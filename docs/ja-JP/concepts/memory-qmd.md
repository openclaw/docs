---
read_when:
    - QMD をメモリバックエンドとして設定したい場合
    - reranking や追加のインデックス対象パスなどの高度なメモリ機能が必要な場合
summary: BM25、ベクトル、再ランキング、クエリ拡張を備えたローカルファースト検索サイドカー
title: QMD メモリエンジン
x-i18n:
    generated_at: "2026-06-27T11:10:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 101a29a88a34ebbb6f9414fc91f599db2a6f098bd8c320737d3c8fbc78785f4a
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) は、OpenClaw と並行して動作するローカルファーストの検索サイドカーです。BM25、ベクトル検索、再ランキングを単一のバイナリにまとめ、ワークスペースのメモリファイルを超えたコンテンツもインデックスできます。

## 組み込みより追加されるもの

- より高い再現率のための **再ランキングとクエリ拡張**。
- **追加ディレクトリのインデックス** -- プロジェクトドキュメント、チームノート、ディスク上のあらゆるもの。
- **セッショントランスクリプトのインデックス** -- 以前の会話を呼び出せます。
- **完全ローカル** -- 公式の llama.cpp provider plugin で動作し、GGUF モデルを自動ダウンロードします。
- **自動フォールバック** -- QMD が利用できない場合、OpenClaw は組み込みエンジンへシームレスにフォールバックします。

## はじめに

### 前提条件

- QMD をインストールします: `npm install -g @tobilu/qmd` または `bun install -g @tobilu/qmd`
- 拡張を許可する SQLite ビルド（macOS では `brew install sqlite`）。
- QMD は Gateway の `PATH` 上にある必要があります。
- macOS と Linux はそのまま動作します。Windows は WSL2 経由が最もよくサポートされています。

### 有効化

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw は自己完結した QMD ホームを `~/.openclaw/agents/<agentId>/qmd/` の下に作成し、サイドカーのライフサイクルを自動的に管理します -- コレクション、更新、埋め込み実行は自動で処理されます。現在の QMD コレクションと MCP クエリ形状を優先しますが、必要に応じて代替コレクションパターンフラグや古い MCP ツール名にもフォールバックします。起動時の照合では、同じ名前の古い QMD コレクションがまだ存在する場合、古くなった管理対象コレクションも正規パターンへ再作成されます。

## サイドカーの仕組み

- OpenClaw はワークスペースのメモリファイルと設定済みの `memory.qmd.paths` からコレクションを作成し、QMD マネージャーが開かれたときとその後定期的に（デフォルトでは 5 分ごと）`qmd update` を実行します。これらの更新はインプロセスのファイルシステムクロールではなく、QMD サブプロセス経由で実行されます。セマンティックモードでは `qmd embed` も実行されます。
- デフォルトのワークスペースコレクションは `MEMORY.md` と `memory/` ツリーを追跡します。小文字の `memory.md` はルートメモリファイルとしてインデックスされません。
- QMD 自身のスキャナーは、隠しパスと `.git`、`.cache`、`node_modules`、`vendor`、`dist`、`build` などの一般的な依存関係/ビルドディレクトリを無視します。Gateway 起動時にはデフォルトで QMD を初期化しないため、コールドブートではメモリが初めて使われるまで、メモリランタイムのインポートや長寿命ウォッチャーの作成を避けます。
- それでも Gateway 起動時に QMD を初期化したい場合は、`memory.qmd.update.startup` を `idle` または `immediate` に設定します。`memory.qmd.update.onBoot: true` の場合、起動時に初回更新が実行されます。`onBoot: false` の場合、起動時はその即時更新をスキップしますが、更新または埋め込みの間隔が設定されている場合は長寿命マネージャーを開くため、QMD が通常のウォッチャーとタイマーを所有できます。
- 検索は設定済みの `searchMode`（デフォルト: `search`; `vsearch` と `query` もサポート）を使用します。`search` は BM25 のみであるため、OpenClaw はそのモードではセマンティックベクトルの準備状況プローブと埋め込みメンテナンスをスキップします。モードが失敗した場合、OpenClaw は `qmd query` で再試行します。
- `searchMode` が `query` の場合、再ランキングなしで QMD のハイブリッドクエリパスを使うには `memory.qmd.rerank` を `false` に設定します。OpenClaw は直接 QMD CLI パスに `--no-rerank` を渡し、QMD の MCP クエリツールに `rerank: false` を渡します。このオプションには QMD 2.1 以降が必要です。
- マルチコレクションフィルターを告知する QMD リリースでは、OpenClaw は同じソースのコレクションを 1 回の QMD 検索呼び出しにまとめます。古い QMD リリースでは、互換性のあるコレクションごとのフォールバックを維持します。
- QMD が完全に失敗した場合、OpenClaw は組み込み SQLite エンジンへフォールバックします。チャットターンでの繰り返し試行は、オープン失敗後に短時間バックオフするため、バイナリの欠落や壊れたサイドカー依存関係による再試行の集中を防ぎます。`openclaw memory status` と単発の CLI プローブは、引き続き QMD を直接再チェックします。

<Info>
最初の検索は遅い場合があります -- QMD は最初の `qmd query` 実行時に、再ランキングとクエリ拡張のための GGUF モデル（約 2 GB）を自動ダウンロードします。
</Info>

## 検索性能と互換性

OpenClaw は QMD 検索パスを現在および古い QMD インストールの両方と互換に保ちます。

起動時に、OpenClaw はインストール済み QMD のヘルプテキストをマネージャーごとに 1 回確認します。バイナリが複数のコレクションフィルターのサポートを告知している場合、OpenClaw は同じソースのすべてのコレクションを 1 つのコマンドで検索します。

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

これにより、永続メモリコレクションごとに QMD サブプロセスを 1 つ起動することを避けます。セッショントランスクリプトコレクションは独自のソースグループに留まるため、`memory` + `sessions` の混在検索でも、両方のソースから結果多様化器への入力が得られます。

古い QMD ビルドは 1 つのコレクションフィルターしか受け付けません。OpenClaw がそのようなビルドを検出した場合、互換性パスを維持し、結果をマージして重複排除する前に各コレクションを個別に検索します。

インストール済みの契約を手動で調べるには、次を実行します。

```bash
qmd --help | grep -i collection
```

現在の QMD ヘルプでは、コレクションフィルターは 1 つ以上のコレクションを対象にできると記載されています。古いヘルプでは通常、単一コレクションが説明されています。

## モデルのオーバーライド

QMD モデル環境変数は Gateway プロセスからそのまま渡されるため、新しい OpenClaw 設定を追加せずに QMD をグローバルに調整できます。

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

埋め込みモデルを変更した後は、インデックスが新しいベクトル空間と一致するように埋め込みを再実行してください。

## 追加パスのインデックス

追加ディレクトリを検索可能にするには、QMD にそれらを指定します。

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

追加パスからのスニペットは、検索結果で `qmd/<collection>/<relative-path>` として表示されます。`memory_get` はこのプレフィックスを理解し、正しいコレクションルートから読み取ります。

## セッショントランスクリプトのインデックス

以前の会話を呼び出すには、セッションインデックスを有効にします。

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

トランスクリプトは、サニタイズされた User/Assistant ターンとして `~/.openclaw/agents/<id>/qmd/sessions/` の下の専用 QMD コレクションへエクスポートされます。

## 検索スコープ

デフォルトでは、QMD 検索結果は直接セッションとチャンネルセッション（グループではない）に表示されます。これを変更するには `memory.qmd.scope` を設定します。

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

スコープが検索を拒否すると、OpenClaw は導出されたチャンネルとチャットタイプを含む警告をログに記録するため、空の結果をデバッグしやすくなります。

## 引用

`memory.citations` が `auto` または `on` の場合、検索スニペットには `Source: <path#line>` フッターが含まれます。エージェント内部にはパスを渡し続けながらフッターを省略するには、`memory.citations = "off"` を設定します。

## 使用する場面

次が必要な場合は QMD を選びます。

- より高品質な結果のための再ランキング。
- ワークスペース外のプロジェクトドキュメントやノートの検索。
- 過去のセッション会話の呼び出し。
- API キー不要の完全ローカル検索。

よりシンプルなセットアップでは、[組み込みエンジン](/ja-JP/concepts/memory-builtin) が追加の依存関係なしでうまく機能します。

## トラブルシューティング

**QMD が見つかりませんか?** バイナリが Gateway の `PATH` 上にあることを確認してください。OpenClaw をサービスとして実行している場合は、シンボリックリンクを作成します。
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

シェルでは `qmd --version` が動作するのに OpenClaw がまだ `spawn qmd ENOENT` を報告する場合、Gateway プロセスの `PATH` が対話シェルと異なる可能性があります。バイナリを明示的に固定します。

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      command: "/absolute/path/to/qmd",
    },
  },
}
```

QMD がインストールされている環境で `command -v qmd` を使い、その後 `openclaw memory status --deep` で再確認します。

**最初の検索が非常に遅いですか?** QMD は初回使用時に GGUF モデルをダウンロードします。OpenClaw が使うものと同じ XDG ディレクトリで `qmd query "test"` を使って事前ウォームアップしてください。

**検索中に多数の QMD サブプロセスがありますか?** 可能であれば QMD を更新してください。OpenClaw は、インストール済み QMD が複数の `-c` フィルターのサポートを告知している場合に限り、同じソースのマルチコレクション検索に 1 つのプロセスを使います。それ以外の場合は、正確性のために古いコレクションごとのフォールバックを維持します。

**BM25 のみの QMD がまだ llama.cpp をビルドしようとしますか?** `memory.qmd.searchMode = "search"` を設定します。OpenClaw はそのモードを語彙検索のみとして扱い、QMD ベクトルステータスプローブや埋め込みメンテナンスを実行せず、セマンティック準備状況の確認は `vsearch` または `query` セットアップに任せます。

**検索がタイムアウトしますか?** `memory.qmd.limits.timeoutMs`（デフォルト: 4000ms）を増やします。低速なハードウェアでは `120000` に設定してください。

**グループチャットで結果が空ですか?** `memory.qmd.scope` を確認してください -- デフォルトでは直接セッションとチャンネルセッションのみを許可します。

**ルートメモリ検索が急に広すぎるようになりましたか?** Gateway を再起動するか、次回の起動時照合を待ってください。OpenClaw は同名の競合を検出すると、古くなった管理対象コレクションを正規の `MEMORY.md` と `memory/` パターンへ再作成します。

**ワークスペースから見える一時リポジトリが `ENAMETOOLONG` や壊れたインデックスを引き起こしていますか?** QMD の走査は現在、OpenClaw の組み込みシンボリックリンクルールではなく、基盤となる QMD スキャナーの挙動に従います。QMD が循環安全な走査または明示的な除外制御を公開するまでは、一時的なモノレポチェックアウトを `.tmp/` のような隠しディレクトリの下、またはインデックス対象の QMD ルート外に置いてください。

## 設定

完全な設定サーフェス（`memory.qmd.*`）、検索モード、更新間隔、スコープルール、その他すべての調整項目については、[メモリ設定リファレンス](/ja-JP/reference/memory-config) を参照してください。

## 関連

- [メモリ概要](/ja-JP/concepts/memory)
- [組み込みメモリエンジン](/ja-JP/concepts/memory-builtin)
- [Honcho メモリ](/ja-JP/concepts/memory-honcho)

---
read_when:
    - QMDをメモリバックエンドとして設定したい場合
    - 再ランキングや追加のインデックス化されたパスなどの高度なメモリ機能が必要な場合
summary: BM25、ベクトル、再ランキング、クエリ拡張を備えたローカル優先の検索サイドカー
title: QMD メモリエンジン
x-i18n:
    generated_at: "2026-06-28T22:33:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 14af147882829451f026f0b9b6cc052c6e2129626a4ab0d0b1c7b77a31c1c050
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) は、OpenClaw と並行して動作するローカルファーストの検索サイドカーです。BM25、ベクトル検索、再ランキングを単一のバイナリに統合し、ワークスペースのメモリファイル以外のコンテンツもインデックス化できます。

## 組み込みより追加されるもの

- **再ランキングとクエリ展開**により、再現率を向上します。
- **追加ディレクトリのインデックス化** -- プロジェクトドキュメント、チームノート、ディスク上の任意のもの。
- **セッショントランスクリプトのインデックス化** -- 以前の会話を呼び出します。
- **完全ローカル** -- 公式の llama.cpp provider plugin で動作し、GGUF モデルを自動ダウンロードします。
- **自動フォールバック** -- QMD が利用できない場合、OpenClaw はシームレスに組み込みエンジンへフォールバックします。

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

OpenClaw は `~/.openclaw/agents/<agentId>/qmd/` の下に自己完結した QMD ホームを作成し、サイドカーのライフサイクルを自動的に管理します -- コレクション、更新、埋め込み実行は自動で処理されます。現在の QMD コレクションと MCP クエリ形状を優先しますが、必要に応じて代替のコレクションパターンフラグや古い MCP ツール名にもフォールバックします。起動時の調整では、同じ名前の古い QMD コレクションがまだ存在する場合、古くなった管理対象コレクションも正規パターンに再作成します。

## サイドカーの仕組み

- OpenClaw はワークスペースのメモリファイルと設定済みの `memory.qmd.paths` からコレクションを作成し、QMD マネージャーが開かれたときと、その後は定期的に（デフォルトでは 5 分ごと）`qmd update` を実行します。これらの更新は、プロセス内のファイルシステムクロールではなく、QMD サブプロセスを通じて実行されます。セマンティックモードでは `qmd embed` も実行されます。
- デフォルトのワークスペースコレクションは、`MEMORY.md` と `memory/` ツリーを追跡します。小文字の `memory.md` はルートメモリファイルとしてインデックス化されません。
- QMD 独自のスキャナーは、隠しパスと、`.git`、`.cache`、`node_modules`、`vendor`、`dist`、`build` などの一般的な依存関係/ビルドディレクトリを無視します。Gateway 起動時にはデフォルトで QMD を初期化しないため、コールドブートではメモリが初めて使われるまで、メモリランタイムのインポートや長寿命ウォッチャーの作成を避けます。
- それでも Gateway 起動時に QMD を初期化したい場合は、`memory.qmd.update.startup` を `idle` または `immediate` に設定します。`memory.qmd.update.onBoot: true` の場合、起動時に初回更新が実行されます。`onBoot: false` の場合、起動時の即時更新はスキップされますが、更新または埋め込みの間隔が設定されている場合は長寿命マネージャーを開くため、QMD が通常のウォッチャーとタイマーを所有できます。
- 検索では設定された `searchMode`（デフォルト: `search`。`vsearch` と `query` もサポート）を使用します。`search` は BM25 のみであるため、OpenClaw はこのモードではセマンティックベクトルの準備状態プローブと埋め込みメンテナンスをスキップします。モードが失敗した場合、OpenClaw は `qmd query` で再試行します。
- `searchMode` が `query` の場合、再ランカーなしで QMD のハイブリッドクエリパスを使うには `memory.qmd.rerank` を `false` に設定します。OpenClaw は直接 QMD CLI パスには `--no-rerank` を、QMD の MCP クエリツールには `rerank: false` を渡します。このオプションには QMD 2.1 以降が必要です。
- 複数コレクションフィルターを通知する QMD リリースでは、OpenClaw は同一ソースのコレクションを 1 回の QMD 検索呼び出しにまとめます。古い QMD リリースでは互換性のあるコレクションごとのフォールバックを維持します。
- QMD が完全に失敗した場合、OpenClaw は組み込み SQLite エンジンへフォールバックします。チャットターンでの繰り返し試行は、オープン失敗後に短くバックオフするため、バイナリ不足や壊れたサイドカー依存関係による再試行の嵐を防ぎます。`openclaw memory status` と 1 回限りの CLI プローブは、引き続き QMD を直接再チェックします。

<Info>
最初の検索は遅い場合があります -- QMD は最初の `qmd query` 実行時に、再ランキングとクエリ展開用の GGUF モデル（約 2 GB）を自動ダウンロードします。
</Info>

## 検索性能と互換性

OpenClaw は QMD 検索パスを、現在の QMD インストールと古い QMD インストールの両方に対応させています。

起動時、OpenClaw はインストール済み QMD のヘルプテキストをマネージャーごとに 1 回確認します。バイナリが複数のコレクションフィルター対応を通知している場合、OpenClaw は同一ソースのすべてのコレクションを 1 つのコマンドで検索します。

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

これにより、永続メモリコレクションごとに QMD サブプロセスを 1 つ起動することを避けられます。セッショントランスクリプトコレクションは独自のソースグループに留まるため、`memory` + `sessions` の混在検索でも、両方のソースから結果ダイバーシファイアの入力を得られます。

古い QMD ビルドは、コレクションフィルターを 1 つしか受け付けません。OpenClaw がそのようなビルドを検出した場合、互換パスを維持し、結果をマージして重複排除する前に各コレクションを個別に検索します。

インストール済みの契約を手動で確認するには、次を実行します。

```bash
qmd --help | grep -i collection
```

現在の QMD ヘルプでは、コレクションフィルターが 1 つ以上のコレクションを対象にできると説明されています。古いヘルプでは通常、単一のコレクションが説明されています。

## モデルの上書き

QMD モデル環境変数は Gateway プロセスからそのまま渡されるため、新しい OpenClaw 設定を追加せずに QMD をグローバルに調整できます。

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

埋め込みモデルを変更した後は、インデックスが新しいベクトル空間と一致するように埋め込みを再実行します。

## 追加パスのインデックス化

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

## セッショントランスクリプトのインデックス化

以前の会話を呼び出すには、セッションインデックス化を有効にします。QMD には、一般的な `memorySearch` セッションソースと QMD トランスクリプトエクスポーターの両方が必要です。

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        experimental: { sessionMemory: true },
        sources: ["memory", "sessions"],
      },
    },
  },
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

トランスクリプトは、サニタイズされた User/Assistant ターンとして、`~/.openclaw/agents/<id>/qmd/sessions/` の下にある専用 QMD コレクションへエクスポートされます。`memorySearch.experimental.sessionMemory` だけを設定しても、トランスクリプトは QMD にエクスポートされません。

セッションヒットは引き続き [`tools.sessions.visibility`](/ja-JP/gateway/config-tools#toolssessions) によってフィルターされます。デフォルトの `tree` 可視性では、無関係な同一エージェントセッションは公開されません。Gateway からディスパッチされたセッションを別の DM セッションから呼び出せるようにする必要がある場合は、意図的に `tools.sessions.visibility: "agent"` を設定します。

## 検索スコープ

デフォルトでは、QMD 検索結果はダイレクトセッションとチャンネルセッション（グループではない）に表示されます。これを変更するには `memory.qmd.scope` を設定します。

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

スコープが検索を拒否した場合、OpenClaw は派生したチャンネルとチャットタイプを含む警告をログに記録するため、空の結果をデバッグしやすくなります。

## 引用

`memory.citations` が `auto` または `on` の場合、検索スニペットには `Source: <path#line>` フッターが含まれます。エージェントには内部的にパスを渡しつつフッターを省略するには、`memory.citations = "off"` を設定します。

## 使用するタイミング

次が必要な場合は QMD を選びます。

- より高品質な結果のための再ランキング。
- ワークスペース外のプロジェクトドキュメントやノートの検索。
- 過去のセッション会話の呼び出し。
- API キー不要の完全ローカル検索。

より単純なセットアップでは、[組み込みエンジン](/ja-JP/concepts/memory-builtin)が追加依存関係なしでよく機能します。

## トラブルシューティング

**QMD が見つからない場合** Gateway の `PATH` 上にバイナリがあることを確認します。OpenClaw をサービスとして実行している場合は、シンボリックリンクを作成します。
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

シェルでは `qmd --version` が動作するのに OpenClaw がまだ `spawn qmd ENOENT` を報告する場合、Gateway プロセスの `PATH` が対話型シェルと異なる可能性があります。バイナリを明示的に固定します。

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

**最初の検索が非常に遅い場合** QMD は初回使用時に GGUF モデルをダウンロードします。OpenClaw が使うものと同じ XDG ディレクトリを使って、`qmd query "test"` で事前にウォームアップします。

**検索中に多数の QMD サブプロセスが発生する場合** 可能であれば QMD を更新してください。OpenClaw は、インストール済み QMD が複数の `-c` フィルター対応を通知している場合にのみ、同一ソースの複数コレクション検索に 1 つのプロセスを使います。それ以外の場合は、正確性のために古いコレクションごとのフォールバックを維持します。

**BM25 のみの QMD がまだ llama.cpp をビルドしようとする場合** `memory.qmd.searchMode = "search"` を設定します。OpenClaw はそのモードを語彙検索のみとして扱い、QMD ベクトルステータスプローブや埋め込みメンテナンスを実行せず、セマンティック準備状態チェックは `vsearch` または `query` セットアップに任せます。

**検索がタイムアウトする場合** `memory.qmd.limits.timeoutMs`（デフォルト: 4000ms）を増やします。遅いハードウェアでは `120000` に設定します。

**グループチャットで結果が空の場合** `memory.qmd.scope` を確認します -- デフォルトではダイレクトセッションとチャンネルセッションのみを許可します。

**ルートメモリ検索が突然広すぎる場合** Gateway を再起動するか、次の起動時調整を待ちます。OpenClaw は、同名の競合を検出した場合、古くなった管理対象コレクションを正規の `MEMORY.md` と `memory/` パターンに再作成します。

**ワークスペースから見える一時リポジトリが `ENAMETOOLONG` や壊れたインデックス化を引き起こす場合** QMD のトラバーサルは現在、OpenClaw の組み込みシンボリックリンクルールではなく、基盤となる QMD スキャナーの動作に従います。QMD が循環安全なトラバーサルまたは明示的な除外制御を公開するまでは、一時的なモノレポチェックアウトを `.tmp/` のような隠しディレクトリの下、またはインデックス化された QMD ルートの外に置いてください。

## 設定

完全な設定サーフェス（`memory.qmd.*`）、検索モード、更新間隔、スコープルール、その他すべての調整項目については、[メモリ設定リファレンス](/ja-JP/reference/memory-config)を参照してください。

## 関連

- [メモリ概要](/ja-JP/concepts/memory)
- [組み込みメモリエンジン](/ja-JP/concepts/memory-builtin)
- [Honcho メモリ](/ja-JP/concepts/memory-honcho)

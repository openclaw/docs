---
read_when:
    - QMD をメモリバックエンドとして設定したい場合
    - リランキングや追加のインデックス化パスなどの高度なメモリ機能が必要な場合
summary: BM25、ベクトル、リランキング、クエリ拡張を備えたローカルファースト検索サイドカー
title: QMD メモリエンジン
x-i18n:
    generated_at: "2026-07-05T11:18:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d4fc87c31835a6a1fdabbb271902334755b9801e51a5b2a3cb5525f1657e9317
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) は、OpenClaw と並行して動作するローカルファーストの検索サイドカーです。BM25、ベクトル検索、リランキングを単一バイナリにまとめ、ワークスペースのメモリファイル以外のコンテンツもインデックス化できます。

## 組み込みより追加される機能

- **リランキングとクエリ拡張**により、再現率を高めます。
- **追加ディレクトリのインデックス化** - プロジェクトドキュメント、チームメモ、ディスク上のあらゆるもの。
- **セッショントランスクリプトのインデックス化** - 以前の会話を思い出せます。
- **完全にローカル** - 公式の llama.cpp プロバイダー Plugin と連携して動作し、GGUF モデルを自動ダウンロードします。
- **自動フォールバック** - QMD が利用できない場合、OpenClaw はシームレスに組み込みエンジンへフォールバックします。

## はじめに

### 前提条件

- QMD をインストールします: `npm install -g @tobilu/qmd` または `bun install -g @tobilu/qmd`
- 拡張を許可する SQLite ビルド（macOS では `brew install sqlite`）。
- QMD はゲートウェイの `PATH` 上にある必要があります。
- macOS と Linux はそのまま動作します。Windows は WSL2 経由が最もよくサポートされています。

### 有効化

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw は `~/.openclaw/agents/<agentId>/qmd/` の下に自己完結型の QMD ホームを作成し、サイドカーのライフサイクルを自動的に管理します - コレクション、更新、埋め込み実行は自動で処理されます。現在の QMD コレクションと MCP クエリ形状を優先しますが、必要に応じて代替のコレクションパターンフラグや古い MCP ツール名へフォールバックします。起動時の照合では、同じ名前の古い QMD コレクションがまだ存在する場合、古くなった管理対象コレクションを正規パターンに再作成します。

## サイドカーの仕組み

- OpenClaw はワークスペースのメモリファイルと設定済みの `memory.qmd.paths` からコレクションを作成し、QMD マネージャーが開いたときとその後定期的に `qmd update` を実行します（`memory.qmd.update.interval`、デフォルトは `5m`）。更新はインプロセスのファイルシステムクロールではなく、QMD サブプロセス経由で実行されます。セマンティック検索モードでは `qmd embed` も実行されます（`memory.qmd.update.embedInterval`、デフォルトは `60m`）。
- デフォルトのワークスペースコレクションは、`MEMORY.md` と `memory/` ツリーを追跡します。小文字の `memory.md` はルートメモリファイルとしてインデックス化されません。
- QMD 自身のスキャナーは、隠しパスと、`.git`、`.cache`、`node_modules`、`vendor`、`dist`、`build` などの一般的な依存関係/ビルドディレクトリを無視します。Gateway 起動時はデフォルトで QMD を初期化しません（`memory.qmd.update.startup` のデフォルトは `off`）。そのため、コールドブート時はメモリが最初に使われるまで、メモリランタイムのインポートや長寿命ウォッチャーの作成を避けます。
- それでもゲートウェイ開始時に QMD を初期化するには、`memory.qmd.update.startup` を `idle` または `immediate` に設定します。`memory.qmd.update.onBoot` のデフォルトは `true` で、起動時に初回更新を実行します。その即時更新をスキップするには `false` に設定します（更新または埋め込み間隔が設定されている場合、長寿命マネージャーは引き続き開くため、QMD は通常のウォッチャー/タイマーを引き続き所有します）。
- 検索は設定済みの `searchMode` を使用します（デフォルト: `search`。`vsearch` と `query` もサポート）。`search` は BM25 のみのため、OpenClaw はそのモードではセマンティックベクトルの準備状況プローブと埋め込みメンテナンスをスキップします。モードが失敗した場合、OpenClaw は `qmd query` で再試行します。
- `searchMode` が `query` の場合、QMD のハイブリッドクエリパスをリランカーなしで使うには `memory.qmd.rerank` を `false` に設定します（QMD 2.1 以降が必要）。OpenClaw は直接 QMD CLI パスに `--no-rerank` を渡し、QMD の MCP クエリツールに `rerank: false` を渡します。
- 複数コレクションフィルターを通知する QMD リリースでは、OpenClaw は同一ソースのコレクションを 1 つの QMD 検索呼び出しにまとめます。古い QMD リリースでは、互換性のあるコレクション単位のフォールバックを維持します。
- QMD が完全に失敗した場合、OpenClaw は組み込み SQLite エンジンへフォールバックします。チャットターン内での繰り返し試行は、オープン失敗後に短時間バックオフするため、バイナリの欠落や壊れたサイドカー依存関係による再試行の集中を避けます。`openclaw memory status` とワンショット CLI プローブは引き続き QMD を直接再チェックします。

<Info>
最初の検索は遅い場合があります - QMD は最初の `qmd query` 実行時に、リランキングとクエリ拡張用の GGUF モデル（約 2 GB）を自動ダウンロードします。
</Info>

## 検索パフォーマンスと互換性

OpenClaw は、現在の QMD と古い QMD インストールの両方に対応するように QMD 検索パスの互換性を保ちます。

起動時に、OpenClaw はインストール済み QMD のヘルプテキストをマネージャーごとに一度確認します。バイナリが複数のコレクションフィルターのサポートを通知している場合、OpenClaw は同一ソースのすべてのコレクションを 1 つのコマンドで検索します。

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

これにより、永続メモリコレクションごとに 1 つの QMD サブプロセスを起動することを避けられます。セッショントランスクリプトコレクションは独自のソースグループに残るため、`memory` + `sessions` の混在検索でも、結果多様化処理に両方のソースからの入力が渡されます。

古い QMD ビルドは 1 つのコレクションフィルターのみ受け付けます。OpenClaw がそのようなビルドを検出した場合、互換性パスを維持し、各コレクションを個別に検索してから結果をマージし重複排除します。

インストール済みの契約を手動で確認するには、次を実行します。

```bash
qmd --help | grep -i collection
```

現在の QMD ヘルプは、1 つ以上のコレクションを対象にすることに言及しています。古いヘルプは通常、単一のコレクションを説明します。

## モデルの上書き

QMD モデル環境変数はゲートウェイプロセスから変更されずに渡されるため、新しい OpenClaw 設定を追加せずに QMD をグローバルに調整できます。

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

埋め込みモデルを変更した後は、インデックスが新しいベクトル空間と一致するように埋め込みを再実行してください。

## 追加パスのインデックス化

検索可能にする追加ディレクトリを QMD に指定します。

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

追加パスからのスニペットは、検索結果では `qmd/<collection>/<relative-path>` として表示されます。`memory_get` はこのプレフィックスを理解し、正しいコレクションルートから読み取ります。

## セッショントランスクリプトのインデックス化

以前の会話を思い出せるようにするには、セッションのインデックス化を有効にします。QMD には、一般的な `memorySearch` セッションソースと QMD トランスクリプトエクスポーターの両方が必要です。

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

トランスクリプトは、サニタイズされた User/Assistant ターンとして `~/.openclaw/agents/<id>/qmd/sessions/` の下の専用 QMD コレクションにエクスポートされます。`memorySearch.experimental.sessionMemory` だけを設定しても、トランスクリプトは QMD にエクスポートされません。

セッションヒットは引き続き [`tools.sessions.visibility`](/ja-JP/gateway/config-tools#toolssessions) によってフィルタリングされます。デフォルトの `tree` 可視性は、同じエージェントの無関係なセッションを公開しません。ゲートウェイからディスパッチされたセッションを別の DM セッションから思い出せるようにする必要がある場合は、意図的に `tools.sessions.visibility: "agent"` を設定します。

## 検索スコープ

デフォルトでは、QMD 検索結果は直接セッションでのみ表示されます（グループまたはチャンネルチャットでは表示されません）。これを変更するには `memory.qmd.scope` を設定します。

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

上記のスニペットは実際のデフォルトルールです。スコープが検索を拒否した場合、OpenClaw は導出されたチャンネルとチャットタイプを含む警告をログに出力し、空の結果をデバッグしやすくします。

## 引用

`memory.citations` が `auto` または `on` の場合、検索スニペットには `Source: <path>#L<line>`（または `#L<start>-L<end>`）フッターが追加されます。`auto` モードでは、フッターは直接チャットセッションの場合にのみ追加されます。エージェント内部にはパスを渡したままフッターを省略するには、`memory.citations = "off"` を設定します。

## 使うべき場合

次が必要な場合は QMD を選択します。

- より高品質な結果のためのリランキング。
- ワークスペース外のプロジェクトドキュメントやメモの検索。
- 過去のセッション会話の想起。
- API キー不要の完全ローカル検索。

よりシンプルなセットアップでは、[組み込みエンジン](/ja-JP/concepts/memory-builtin) が追加の依存関係なしで十分に機能します。

## トラブルシューティング

**QMD が見つかりませんか？** バイナリがゲートウェイの `PATH` 上にあることを確認してください。OpenClaw をサービスとして実行している場合は、シンボリックリンクを作成します: `sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`。

シェルでは `qmd --version` が動作するのに OpenClaw がまだ `spawn qmd ENOENT` を報告する場合、ゲートウェイプロセスの `PATH` が対話型シェルと異なる可能性があります。バイナリを明示的に固定します。

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

QMD がインストールされている環境で `command -v qmd` を使用し、その後 `openclaw memory status --deep` で再確認します。

**最初の検索が非常に遅いですか？** QMD は初回使用時に GGUF モデルをダウンロードします。OpenClaw が使うものと同じ XDG ディレクトリを使って、`qmd query "test"` で事前にウォームアップしてください。

**検索中に多数の QMD サブプロセスが発生しますか？** 可能であれば QMD を更新してください。OpenClaw は、インストール済み QMD が複数の `-c` フィルターのサポートを通知している場合にのみ、同一ソースの複数コレクション検索に 1 つのプロセスを使います。それ以外の場合は、正確性のために古いコレクション単位のフォールバックを維持します。

**BM25 のみの QMD がまだ llama.cpp をビルドしようとしていますか？** `memory.qmd.searchMode = "search"` を設定します。OpenClaw はそのモードを語彙検索のみとして扱い、QMD ベクトルステータスプローブと埋め込みメンテナンスをスキップし、セマンティック準備状況チェックは `vsearch` または `query` セットアップに任せます。

**検索がタイムアウトしますか？** `memory.qmd.limits.timeoutMs` を増やしてください（デフォルト: 4000ms）。遅いハードウェアでは、たとえば `120000` のように高く設定します。

**グループまたはチャンネルチャットで結果が空ですか？** これは、直接セッションのみを許可するデフォルトの `memory.qmd.scope` では想定どおりです。そこで QMD 結果を使いたい場合は、`group` または `channel` チャットタイプの `allow` ルールを追加してください。

**ルートメモリ検索が突然広くなりすぎましたか？** ゲートウェイを再起動するか、次回の起動時照合を待ってください。OpenClaw は同名の競合を検出すると、古くなった管理対象コレクションを正規の `MEMORY.md` と `memory/` パターンに再作成します。

**ワークスペースから見える一時リポジトリが `ENAMETOOLONG` や壊れたインデックス化を引き起こしていますか？** QMD の走査は、OpenClaw の組み込みシンボリックリンクルールではなく、基盤となる QMD スキャナーに従います。QMD が循環安全な走査または明示的な除外制御を公開するまでは、一時的なモノレポチェックアウトを `.tmp/` のような隠しディレクトリ、またはインデックス対象の QMD ルート外に置いてください。

## 設定

完全な設定サーフェス（`memory.qmd.*`）、検索モード、更新間隔、スコープルール、その他すべてのノブについては、[メモリ設定リファレンス](/ja-JP/reference/memory-config) を参照してください。

## 関連

- [メモリ概要](/ja-JP/concepts/memory)
- [組み込みメモリエンジン](/ja-JP/concepts/memory-builtin)
- [Honcho メモリ](/ja-JP/concepts/memory-honcho)

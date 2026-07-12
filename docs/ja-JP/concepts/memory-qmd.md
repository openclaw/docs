---
read_when:
    - QMD をメモリバックエンドとして設定したい場合
    - 再ランキングや追加のインデックス対象パスなど、高度なメモリ機能が必要である場合
summary: BM25、ベクトル、再ランキング、クエリ拡張を備えたローカルファーストの検索サイドカー
title: QMD メモリエンジン
x-i18n:
    generated_at: "2026-07-11T22:11:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d4fc87c31835a6a1fdabbb271902334755b9801e51a5b2a3cb5525f1657e9317
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) は、OpenClaw と並行して動作するローカルファーストの検索サイドカーです。BM25、ベクトル検索、再ランキングを単一のバイナリに統合し、ワークスペースのメモリファイル以外のコンテンツもインデックス化できます。

## 組み込み機能との違い

- 検索漏れを減らすための**再ランキングとクエリ拡張**。
- **追加ディレクトリのインデックス化** - プロジェクトのドキュメント、チームのメモ、ディスク上のあらゆるコンテンツ。
- **セッショントランスクリプトのインデックス化** - 過去の会話を呼び出せます。
- **完全ローカル** - 公式の llama.cpp プロバイダー Plugin で動作し、GGUF モデルを自動的にダウンロードします。
- **自動フォールバック** - QMD が利用できない場合、OpenClaw はシームレスに組み込みエンジンへフォールバックします。

## はじめに

### 前提条件

- QMD をインストールします：`npm install -g @tobilu/qmd` または `bun install -g @tobilu/qmd`
- 拡張機能を許可する SQLite ビルド（macOS では `brew install sqlite`）。
- QMD が Gateway の `PATH` に存在する必要があります。
- macOS と Linux ではそのまま動作します。Windows は WSL2 経由での利用が最も適切にサポートされています。

### 有効化

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw は `~/.openclaw/agents/<agentId>/qmd/` 以下に自己完結型の QMD ホームを作成し、サイドカーのライフサイクルを自動的に管理します。コレクション、更新、埋め込み処理は自動で実行されます。現在の QMD コレクション形式と MCP クエリ形式を優先しますが、必要に応じて代替のコレクションパターンフラグや古い MCP ツール名へフォールバックします。起動時の調整処理では、同名の古い QMD コレクションが残っている場合、古くなった管理対象コレクションを正規パターンで再作成します。

## サイドカーの仕組み

- OpenClaw は、ワークスペースのメモリファイルと設定済みの `memory.qmd.paths` からコレクションを作成し、QMD マネージャーの開始時と、その後の定期的な間隔（`memory.qmd.update.interval`、デフォルトは `5m`）で `qmd update` を実行します。更新はプロセス内のファイルシステム走査ではなく、QMD のサブプロセスを通じて実行されます。セマンティック検索モードでは `qmd embed` も実行されます（`memory.qmd.update.embedInterval`、デフォルトは `60m`）。
- デフォルトのワークスペースコレクションは、`MEMORY.md` と `memory/` ツリーを追跡します。小文字の `memory.md` はルートメモリファイルとしてインデックス化されません。
- QMD 自体のスキャナーは、隠しパスと `.git`、`.cache`、`node_modules`、`vendor`、`dist`、`build` などの一般的な依存関係・ビルドディレクトリを無視します。デフォルトでは Gateway の起動時に QMD は初期化されないため（`memory.qmd.update.startup` のデフォルトは `off`）、コールドブート時には、メモリが初めて使用されるまでメモリランタイムのインポートや長時間動作するウォッチャーの作成を回避します。
- Gateway の起動時に QMD を初期化するには、`memory.qmd.update.startup` を `idle` または `immediate` に設定します。`memory.qmd.update.onBoot` のデフォルトは `true` で、起動時に初回更新を実行します。この即時更新を省略するには `false` に設定します（更新間隔または埋め込み間隔が設定されている場合、長時間動作するマネージャーは引き続き起動するため、QMD は通常のウォッチャーとタイマーを管理し続けます）。
- 検索では設定された `searchMode`（デフォルトは `search`、`vsearch` と `query` もサポート）を使用します。`search` は BM25 のみを使用するため、OpenClaw はこのモードではセマンティックベクトルの準備状態確認と埋め込みの保守を省略します。モードが失敗した場合、OpenClaw は `qmd query` で再試行します。
- `searchMode` が `query` の場合、`memory.qmd.rerank` を `false` に設定すると、再ランカーを使用せずに QMD のハイブリッドクエリ経路を利用できます（QMD 2.1 以降が必要）。OpenClaw は、QMD CLI の直接実行経路には `--no-rerank` を、QMD の MCP クエリツールには `rerank: false` を渡します。
- 複数コレクションのフィルターをサポートすると通知する QMD リリースでは、OpenClaw は同一ソースのコレクションを 1 回の QMD 検索呼び出しにまとめます。古い QMD リリースでは、互換性のあるコレクションごとのフォールバックを維持します。
- QMD が完全に失敗した場合、OpenClaw は組み込みの SQLite エンジンへフォールバックします。バイナリが存在しない場合やサイドカーの依存関係が壊れている場合に再試行が集中しないよう、オープン失敗後はチャットターンごとの反復試行を短時間抑制します。一方、`openclaw memory status` と単発の CLI 確認では、引き続き QMD を直接再確認します。

<Info>
最初の検索には時間がかかる場合があります。QMD は最初の `qmd query` 実行時に、再ランキングとクエリ拡張用の GGUF モデル（約 2 GB）を自動的にダウンロードします。
</Info>

## 検索性能と互換性

OpenClaw は、現在および古い QMD の両方のインストール環境と互換性があるように QMD 検索経路を維持します。

起動時に、OpenClaw はマネージャーごとにインストール済み QMD のヘルプテキストを一度確認します。バイナリが複数のコレクションフィルターへの対応を示している場合、OpenClaw は同一ソースのすべてのコレクションを 1 つのコマンドで検索します。

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

これにより、永続メモリのコレクションごとに QMD サブプロセスを 1 つずつ起動せずに済みます。セッショントランスクリプトのコレクションは独自のソースグループに残るため、`memory` と `sessions` を組み合わせた検索でも、両方のソースからの入力が結果分散処理に渡されます。

古い QMD ビルドでは、コレクションフィルターを 1 つしか指定できません。OpenClaw がそのようなビルドを検出すると、互換経路を維持し、各コレクションを個別に検索した後、結果を統合して重複を除去します。

インストール済みの仕様を手動で確認するには、次を実行します。

```bash
qmd --help | grep -i collection
```

現在の QMD のヘルプでは、1 つ以上のコレクションを対象にできることが記載されています。古いヘルプでは通常、単一のコレクションについて説明されています。

## モデルの上書き

QMD モデルの環境変数は Gateway プロセスから変更されずに渡されるため、新しい OpenClaw 設定を追加せずに QMD をグローバルに調整できます。

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

埋め込みモデルを変更した後は、インデックスを新しいベクトル空間に一致させるため、埋め込みを再実行してください。

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

追加パスから取得したスニペットは、検索結果に `qmd/<collection>/<relative-path>` として表示されます。`memory_get` はこのプレフィックスを認識し、正しいコレクションルートから読み取ります。

## セッショントランスクリプトのインデックス化

過去の会話を呼び出せるようにするには、セッションのインデックス化を有効にします。QMD には、一般的な `memorySearch` セッションソースと QMD トランスクリプトエクスポーターの両方が必要です。

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

トランスクリプトは、サニタイズされたユーザーとアシスタントのターンとして、`~/.openclaw/agents/<id>/qmd/sessions/` 以下の専用 QMD コレクションにエクスポートされます。`memorySearch.experimental.sessionMemory` だけを設定しても、トランスクリプトは QMD にエクスポートされません。

セッションの検索結果は、引き続き [`tools.sessions.visibility`](/ja-JP/gateway/config-tools#toolssessions) によってフィルタリングされます。デフォルトの `tree` 可視性では、同じエージェントの無関係なセッションは公開されません。Gateway からディスパッチされたセッションを別の DM セッションから呼び出せるようにする場合は、意図的に `tools.sessions.visibility: "agent"` を設定してください。

## 検索範囲

デフォルトでは、QMD の検索結果は直接セッションにのみ表示され、グループチャットやチャンネルチャットには表示されません。この動作を変更するには `memory.qmd.scope` を設定します。

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

上記のスニペットが実際のデフォルトルールです。スコープによって検索が拒否された場合、空の結果をデバッグしやすくするため、OpenClaw は判定されたチャンネルとチャット種別を含む警告をログに記録します。

## 引用

`memory.citations` が `auto` または `on` の場合、検索スニペットには `Source: <path>#L<line>`（または `#L<start>-L<end>`）というフッターが追加されます。`auto` モードでは、フッターは直接チャットセッションの場合にのみ追加されます。パスを内部的にはエージェントへ渡しながらフッターを省略するには、`memory.citations = "off"` を設定します。

## 使用する場面

次の要件がある場合は QMD を選択してください。

- より高品質な結果を得るための再ランキング。
- ワークスペース外にあるプロジェクトドキュメントやメモの検索。
- 過去のセッションでの会話の呼び出し。
- API キーを必要としない完全ローカル検索。

より単純な構成では、追加の依存関係なしで[組み込みエンジン](/ja-JP/concepts/memory-builtin)を利用できます。

## トラブルシューティング

**QMD が見つからない場合** バイナリが Gateway の `PATH` に存在することを確認してください。OpenClaw をサービスとして実行している場合は、シンボリックリンクを作成します。
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`

シェルでは `qmd --version` が動作するにもかかわらず、OpenClaw が引き続き `spawn qmd ENOENT` を報告する場合、Gateway プロセスの `PATH` が対話型シェルとは異なる可能性があります。バイナリを明示的に指定してください。

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

QMD がインストールされている環境で `command -v qmd` を使用し、その後 `openclaw memory status --deep` で再確認してください。

**最初の検索が非常に遅い場合** QMD は初回使用時に GGUF モデルをダウンロードします。OpenClaw が使用するものと同じ XDG ディレクトリを使用して、`qmd query "test"` で事前に準備してください。

**検索中に多数の QMD サブプロセスが発生する場合** 可能であれば QMD を更新してください。OpenClaw が同一ソースの複数コレクション検索に 1 つのプロセスを使用するのは、インストール済み QMD が複数の `-c` フィルターへの対応を示している場合のみです。それ以外の場合は、正確性を保つため、古いコレクションごとのフォールバックを維持します。

**BM25 のみの QMD が llama.cpp をビルドしようとする場合** `memory.qmd.searchMode = "search"` を設定してください。OpenClaw はこのモードを語彙検索のみとして扱い、QMD のベクトル状態確認と埋め込みの保守を省略し、セマンティック検索の準備状態確認は `vsearch` または `query` の構成にのみ適用します。

**検索がタイムアウトする場合** `memory.qmd.limits.timeoutMs`（デフォルト：`4000ms`）を増やしてください。低速なハードウェアでは、たとえば `120000` など、より高い値に設定します。

**グループチャットまたはチャンネルチャットで結果が空になる場合** 直接セッションのみを許可するデフォルトの `memory.qmd.scope` では、これは想定された動作です。それらの場所でも QMD の結果を使用する場合は、`group` または `channel` のチャット種別に対する `allow` ルールを追加してください。

**ルートメモリの検索範囲が突然広がりすぎた場合** Gateway を再起動するか、次回の起動時調整処理を待ってください。OpenClaw は、同名の競合を検出すると、古くなった管理対象コレクションを正規の `MEMORY.md` と `memory/` のパターンで再作成します。

**ワークスペースから見える一時リポジトリによって `ENAMETOOLONG` が発生したり、インデックス化が壊れたりする場合**
QMD の走査では、OpenClaw の組み込みシンボリックリンク規則ではなく、基盤となる QMD スキャナーに従います。QMD が循環に安全な走査または明示的な除外制御を提供するまでは、一時的なモノレポのチェックアウトを `.tmp/` などの隠しディレクトリ、またはインデックス対象の QMD ルート外に配置してください。

## 設定

完全な設定項目（`memory.qmd.*`）、検索モード、更新間隔、スコープルール、およびその他すべての調整項目については、[メモリ設定リファレンス](/ja-JP/reference/memory-config)を参照してください。

## 関連項目

- [メモリの概要](/ja-JP/concepts/memory)
- [組み込みメモリエンジン](/ja-JP/concepts/memory-builtin)
- [Honcho メモリ](/ja-JP/concepts/memory-honcho)

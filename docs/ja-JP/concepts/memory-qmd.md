---
read_when:
    - QMD をメモリバックエンドとして設定する場合
    - 再ランキングや追加のインデックス対象パスなど、高度なメモリ機能が必要な場合
summary: BM25、ベクトル、リランキング、クエリ拡張を備えたローカルファーストの検索サイドカー
title: QMD メモリエンジン
x-i18n:
    generated_at: "2026-07-16T11:34:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b13017ead7e7340624a35e603a18216a5c23405cbab09e7f53b1e15d74d59d23
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd) は、OpenClaw と並行して動作するローカルファーストの検索サイドカーです。
BM25、ベクトル検索、再ランキングを単一のバイナリに統合し、ワークスペースのメモリファイル以外のコンテンツもインデックス化できます。

## 組み込み機能に追加されるもの

- **再ランキングとクエリ拡張**により再現率を向上。
- **追加ディレクトリをインデックス化** - プロジェクトのドキュメント、チームのメモ、ディスク上のあらゆるもの。
- **セッショントランスクリプトをインデックス化** - 以前の会話を呼び出せます。
- **完全ローカル** - 公式の llama.cpp プロバイダー Plugin で動作し、
  GGUF モデルを自動ダウンロードします。
- **自動フォールバック** - QMD が利用できない場合、OpenClaw は
  シームレスに組み込みエンジンへフォールバックします。

## はじめに

### 前提条件

- QMD をインストール: `npm install -g @tobilu/qmd` または `bun install -g @tobilu/qmd`
- 拡張機能を許可する SQLite ビルド（macOS では `brew install sqlite`）。
- QMD が Gateway の `PATH` 上に存在する必要があります。
- macOS と Linux ではそのまま動作します。Windows は WSL2 経由での利用が最もよくサポートされています。

### 有効化

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw は `~/.openclaw/agents/<agentId>/qmd/` 配下に自己完結型の QMD ホームを作成し、
サイドカーのライフサイクルを自動的に管理します。コレクション、更新、埋め込みの実行は自動的に処理されます。
現在の QMD コレクションと MCP クエリ形式を優先しますが、必要に応じて
代替のコレクションパターンフラグや古い MCP ツール名へフォールバックします。
起動時の整合処理では、同名の古い QMD コレクションがまだ存在する場合、
古くなった管理対象コレクションを正規パターンで再作成します。

## サイドカーの仕組み

- OpenClaw はワークスペースのメモリファイルと設定済みの
  `memory.qmd.paths` からコレクションを作成し、QMD マネージャーの起動時と、
  その後は定期的に（`memory.qmd.update.interval`、デフォルトは
  `5m`）`qmd update` を実行します。更新はプロセス内のファイルシステム走査ではなく、
  QMD サブプロセスを通じて実行されます。セマンティック検索モードでは
  `qmd embed`（`memory.qmd.update.embedInterval`、デフォルトは `60m`）も実行されます。
- デフォルトのワークスペースコレクションは、`MEMORY.md` と `memory/`
  ツリーを追跡します。小文字の `memory.md` は、ルートメモリファイルとしてインデックス化されません。
- QMD 独自のスキャナーは、隠しパスと、`.git`、`.cache`、`node_modules`、`vendor`、`dist`、
  `build` などの一般的な依存関係／ビルドディレクトリを無視します。Gateway の起動時には、デフォルトで QMD を初期化しません
  （`memory.qmd.update.startup` のデフォルトは `off`）。そのため、コールドブート時には
  メモリが初めて使用されるまで、メモリランタイムのインポートや長期稼働するウォッチャーの作成を回避できます。
- それでも Gateway の起動時に QMD を初期化するには、`memory.qmd.update.startup` を `idle` または `immediate` に設定します。
  `memory.qmd.update.onBoot` のデフォルトは `true` で、起動時に初回更新を実行します。即時更新をスキップするには
  `false` に設定します（更新または埋め込みの間隔が設定されている場合、長期稼働するマネージャーは引き続き起動するため、
  QMD が通常のウォッチャー／タイマーを管理し続けます）。
- 検索では設定済みの `searchMode`（デフォルト: `search`。`vsearch` と `query` もサポート）を使用します。
  `search` は BM25 のみであるため、このモードでは OpenClaw はセマンティックベクトルの準備状況プローブと埋め込みの保守をスキップします。
  モードが失敗した場合、OpenClaw は `qmd query` で再試行します。
- `searchMode` が `query` の場合、再ランカーなしで QMD のハイブリッドクエリパスを使用するには
  `memory.qmd.rerank` を `false` に設定します（QMD 2.1 以降が必要）。
  OpenClaw は直接 QMD CLI パスに `--no-rerank` を渡し、
  QMD の MCP クエリツールに `rerank: false` を渡します。
- 複数コレクションのフィルター対応を明示する QMD リリースでは、OpenClaw は
  同一ソースのコレクションを 1 回の QMD 検索呼び出しにまとめます。古い QMD リリースでは、
  互換性のあるコレクションごとのフォールバックを維持します。
- QMD が完全に失敗した場合、OpenClaw は組み込みの SQLite エンジンへフォールバックします。
  バイナリの欠落やサイドカー依存関係の破損によって再試行が集中しないよう、
  オープン失敗後はチャットターンでの反復試行を短時間バックオフします。
  `openclaw memory status` と 1 回限りの CLI プローブでは、引き続き QMD を直接再確認します。

<Info>
最初の検索は遅い場合があります。QMD は最初の `qmd query` 実行時に、
再ランキングとクエリ拡張用の GGUF モデル（約 2 GB）を自動ダウンロードします。
</Info>

## 検索パフォーマンスと互換性

OpenClaw は、現在および旧バージョンの QMD インストールの両方と互換性があるよう、
QMD 検索パスを維持します。

起動時に、OpenClaw はマネージャーごとに 1 回、インストール済み QMD のヘルプテキストを確認します。
バイナリが複数のコレクションフィルターへの対応を明示している場合、OpenClaw は
同一ソースのすべてのコレクションを 1 つのコマンドで検索します。

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

これにより、永続メモリのコレクションごとに QMD サブプロセスを 1 つずつ起動することを回避できます。
セッショントランスクリプトのコレクションは独自のソースグループに維持されるため、
`memory` と `sessions` を組み合わせた検索でも、両方のソースから結果多様化処理への入力が提供されます。

古い QMD ビルドは、コレクションフィルターを 1 つしか受け付けません。OpenClaw が
そのようなビルドを検出した場合、互換性パスを維持し、各コレクションを
個別に検索してから、結果をマージして重複を排除します。

インストール済みの仕様を手動で確認するには、次を実行します。

```bash
qmd --help | grep -i collection
```

現在の QMD ヘルプには、1 つ以上のコレクションを対象にできることが記載されています。
古いヘルプでは通常、単一のコレクションについて説明されています。

## モデルの上書き

QMD モデルの環境変数は Gateway プロセスから変更されずに渡されるため、
新しい OpenClaw 設定を追加せずに QMD をグローバルに調整できます。

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

埋め込みモデルを変更した後は、インデックスを新しいベクトル空間に一致させるため、
埋め込みを再実行します。

## 追加パスのインデックス化

追加のディレクトリを QMD に指定して検索可能にします。

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

追加パスからのスニペットは、検索結果に `qmd/<collection>/<relative-path>` として表示されます。
`memory_get` はこのプレフィックスを認識し、正しいコレクションルートから読み取ります。

## セッショントランスクリプトのインデックス化

以前の会話を呼び出せるようにするには、セッションのインデックス化を有効にします。
QMD には、汎用の `memorySearch` セッションソースと QMD トランスクリプトエクスポーターの両方が必要です。

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

トランスクリプトは、サニタイズされた User/Assistant ターンとして、
`~/.openclaw/agents/<id>/qmd/sessions/` 配下の専用 QMD コレクションにエクスポートされます。
`memorySearch.experimental.sessionMemory` のみを設定しても、トランスクリプトは QMD にエクスポートされません。

セッションのヒットは引き続き
[`tools.sessions.visibility`](/ja-JP/gateway/config-tools#toolssessions) によってフィルタリングされます。
デフォルトの `tree` 可視性では、同じエージェントの無関係なセッションは公開されません。
Gateway からディスパッチされたセッションを別の DM セッションから呼び出せるようにする場合は、
意図的に `tools.sessions.visibility: "agent"` を設定します。

## 検索範囲

デフォルトでは、QMD の検索結果はダイレクトセッションにのみ表示され、
グループチャットやチャンネルチャットには表示されません。これを変更するには `memory.qmd.scope` を設定します。

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

上記のスニペットは実際のデフォルトルールです。スコープによって検索が拒否されると、
OpenClaw は導出されたチャンネルとチャットタイプを含む警告をログに記録するため、
空の結果をデバッグしやすくなります。

## 引用

`memory.citations` が `auto` または `on` の場合、
検索スニペットには `Source: <path>#L<line>`（または `#L<start>-L<end>`）フッターが追加されます。
`auto` モードでは、フッターはダイレクトチャットセッションにのみ追加されます。
エージェントにはパスを内部的に渡しつつフッターを省略するには、`memory.citations = "off"` を設定します。

## 使用する場面

次のことが必要な場合は QMD を選択します。

- より高品質な結果を得るための再ランキング。
- ワークスペース外のプロジェクトドキュメントやメモの検索。
- 過去のセッション会話の呼び出し。
- API キーを使用しない完全ローカル検索。

よりシンプルな構成には、追加の依存関係なしで利用できる
[組み込みエンジン](/ja-JP/concepts/memory-builtin)が適しています。

## トラブルシューティング

**QMD が見つからない場合** バイナリが Gateway の `PATH` 上にあることを確認してください。
OpenClaw がサービスとして実行されている場合は、シンボリックリンク
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd` を作成します。

シェルで `qmd --version` が動作しても、OpenClaw が引き続き
`spawn qmd ENOENT` と報告する場合、Gateway プロセスの `PATH` が
対話シェルと異なる可能性があります。バイナリを明示的に固定します。

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

QMD がインストールされている環境で `command -v qmd` を使用し、
`openclaw memory status --deep` で再確認します。

**最初の検索が非常に遅い場合** QMD は初回使用時に GGUF モデルをダウンロードします。
OpenClaw と同じ XDG ディレクトリを使用して、`qmd query "test"` で事前にウォームアップします。

**検索中に多数の QMD サブプロセスが発生する場合** 可能であれば QMD を更新してください。
OpenClaw が同一ソースの複数コレクション検索に 1 つのプロセスを使用するのは、
インストール済み QMD が複数の `-c` フィルターへの対応を明示している場合のみです。
それ以外の場合は、正確性のために古いコレクションごとのフォールバックを維持します。

**BM25 のみの QMD が引き続き llama.cpp をビルドしようとする場合** 
`memory.qmd.searchMode = "search"` を設定します。OpenClaw はそのモードを
字句検索のみとして扱い、QMD ベクトル状態のプローブと埋め込みの保守をスキップし、
セマンティック検索の準備状況確認を `vsearch` または `query` の構成に委ねます。

**検索がタイムアウトする場合** `memory.qmd.limits.timeoutMs`（デフォルト: 4000ms）を増やします。
低速なハードウェアでは、たとえば `120000` のように大きな値を設定します。
この制限はエージェントの `memory_search` 呼び出し中の QMD 独自の検索コマンドに適用されます。
セットアップ、同期、組み込みフォールバック、補助コーパス処理には、それぞれ独自の短い期限が維持されます。

**グループチャットやチャンネルチャットで結果が空になる場合** ダイレクトセッションのみを許可する
デフォルトの `memory.qmd.scope` では想定された動作です。
そこで QMD の結果を表示するには、`group` または `channel` のチャットタイプに対する
`allow` ルールを追加します。

**ルートメモリ検索が突然広すぎる範囲を検索するようになった場合** Gateway を再起動するか、
次回の起動時整合処理を待ちます。OpenClaw は同名の競合を検出すると、
古くなった管理対象コレクションを正規の `MEMORY.md` および `memory/` パターンで再作成します。

**ワークスペースから見える一時リポジトリによって `ENAMETOOLONG` やインデックス破損が発生する場合**
QMD の走査は、OpenClaw の組み込みシンボリックリンクルールではなく、
基盤となる QMD スキャナーに従います。QMD が循環安全な走査または明示的な除外制御を提供するまでは、
一時的なモノレポのチェックアウトを `.tmp/` のような隠しディレクトリ内、
またはインデックス化対象の QMD ルート外に配置してください。

## 設定

設定項目の全体（`memory.qmd.*`）、検索モード、更新間隔、
スコープルール、その他すべての調整項目については、
[メモリ設定リファレンス](/ja-JP/reference/memory-config)を参照してください。

## 関連項目

- [メモリの概要](/ja-JP/concepts/memory)
- [組み込みメモリエンジン](/ja-JP/concepts/memory-builtin)
- [Honcho メモリ](/ja-JP/concepts/memory-honcho)

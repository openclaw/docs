---
read_when:
    - QMDをメモリバックエンドとしてセットアップしたい場合
    - rerankingや追加のインデックス対象パスなどの高度なメモリ機能が必要な場合
summary: BM25、ベクトル、reranking、およびクエリ拡張を備えたローカルファースト検索サイドカー
title: QMDメモリエンジン
x-i18n:
    generated_at: "2026-04-24T04:53:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d7af326291e194a04a17aa425901bf7e2517c23bae8282cd504802d24e9e522
    source_path: concepts/memory-qmd.md
    workflow: 15
---

[QMD](https://github.com/tobi/qmd)は、OpenClawと並行して動作するローカルファーストの検索サイドカーです。これは単一の
バイナリでBM25、ベクトル検索、rerankingを組み合わせ、ワークスペースのメモリファイルを超える内容も
インデックス化できます。

## 組み込み版に対して追加されるもの

- より良いリコールのための**rerankingとクエリ拡張**。
- **追加ディレクトリのインデックス化** -- プロジェクトドキュメント、チームノート、ディスク上の任意のもの。
- **セッショントランスクリプトのインデックス化** -- 過去の会話を再利用できます。
- **完全ローカル** -- Bun + node-llama-cpp経由で動作し、GGUFモデルを自動ダウンロードします。
- **自動フォールバック** -- QMDが利用できない場合、OpenClawはシームレスに
  組み込みエンジンへフォールバックします。

## はじめに

### 前提条件

- QMDをインストール: `npm install -g @tobilu/qmd`または`bun install -g @tobilu/qmd`
- 拡張機能を許可するSQLiteビルド（macOSでは`brew install sqlite`）。
- QMDがgatewayの`PATH`上にある必要があります。
- macOSとLinuxはそのままで動作します。WindowsはWSL2経由が最もよくサポートされます。

### 有効化

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClawは、`~/.openclaw/agents/<agentId>/qmd/`配下に自己完結型のQMDホームを作成し、
サイドカーのライフサイクルを自動管理します -- コレクション、更新、埋め込み実行は
すべて自動処理されます。
現在のQMDコレクションおよびMCPクエリ形式を優先しますが、必要に応じて
レガシーの`--mask`コレクションフラグや古いMCPツール名にもフォールバックします。
起動時の整合処理では、同名の古いQMDコレクションがまだ存在する場合に、
古い管理対象コレクションを正規パターンへ再作成します。

## サイドカーの仕組み

- OpenClawは、ワークスペースのメモリファイルおよび設定された
  `memory.qmd.paths`からコレクションを作成し、起動時と定期的に
  `qmd update` + `qmd embed`を実行します（デフォルトは5分ごと）。
- デフォルトのワークスペースコレクションは、`MEMORY.md`と`memory/`
  ツリーを追跡します。小文字の`memory.md`はルートメモリファイルとしてはインデックス化されません。
- 起動時リフレッシュはバックグラウンドで実行されるため、チャット起動をブロックしません。
- 検索では設定された`searchMode`（デフォルト: `search`。`vsearch`および
  `query`もサポート）を使用します。モードが失敗した場合、OpenClawは`qmd query`で再試行します。
- QMDが完全に失敗した場合、OpenClawは組み込みSQLiteエンジンへフォールバックします。

<Info>
最初の検索は遅い場合があります -- QMDは最初の`qmd query`実行時に、
rerankingおよびクエリ拡張用のGGUFモデル（約2 GB）を自動ダウンロードします。
</Info>

## モデルの上書き

QMDモデル用の環境変数はgatewayプロセスからそのまま渡されるため、
新しいOpenClaw設定を追加せずにQMDをグローバルに調整できます。

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

埋め込みモデルを変更した後は、新しいベクトル空間にインデックスが一致するように
埋め込みを再実行してください。

## 追加パスのインデックス化

QMDに追加ディレクトリを指定して検索可能にします。

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

追加パスからのスニペットは、検索結果で`qmd/<collection>/<relative-path>`として表示されます。
`memory_get`はこのプレフィックスを理解し、正しい
コレクションルートから読み取ります。

## セッショントランスクリプトのインデックス化

過去の会話を再利用するには、セッションのインデックス化を有効にします。

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

トランスクリプトは、サニタイズ済みのUser/Assistantターンとして、
`~/.openclaw/agents/<id>/qmd/sessions/`配下の専用QMDコレクションにエクスポートされます。

## 検索スコープ

デフォルトでは、QMD検索結果はダイレクトおよびチャネルセッションで表示されます
（グループは除く）。これを変更するには`memory.qmd.scope`を設定します。

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

スコープにより検索が拒否された場合、OpenClawは導出されたチャネルと
チャット種別を含む警告をログに出すため、空結果のデバッグが容易になります。

## 引用

`memory.citations`が`auto`または`on`の場合、検索スニペットには
`Source: <path#line>`フッターが含まれます。エージェントへ内部的にパスを渡したまま
フッターを省略するには、`memory.citations = "off"`を設定してください。

## 使うべき場面

次のような場合はQMDを選択してください。

- より高品質な結果のためにrerankingが必要。
- ワークスペース外のプロジェクトドキュメントやノートを検索したい。
- 過去のセッション会話を再利用したい。
- APIキーなしで完全ローカル検索を行いたい。

より単純なセットアップでは、[組み込みエンジン](/ja-JP/concepts/memory-builtin)が
追加依存なしで十分機能します。

## トラブルシューティング

**QMDが見つからない?** バイナリがgatewayの`PATH`上にあることを確認してください。OpenClawが
サービスとして実行されている場合は、シンボリックリンクを作成してください:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`。

**最初の検索が非常に遅い?** QMDは初回使用時にGGUFモデルをダウンロードします。事前ウォームアップするには、
OpenClawが使用するのと同じXDGディレクトリで`qmd query "test"`を実行してください。

**検索がタイムアウトする?** `memory.qmd.limits.timeoutMs`（デフォルト: 4000ms）を増やしてください。
低速なハードウェアでは`120000`に設定してください。

**グループチャットで結果が空?** `memory.qmd.scope`を確認してください -- デフォルトでは
ダイレクトおよびチャネルセッションのみ許可されます。

**ルートメモリ検索が急に広すぎるようになった?** gatewayを再起動するか、次回の起動時整合処理を待ってください。
OpenClawは、同名競合を検出すると、古い管理対象コレクションを
正規の`MEMORY.md`および`memory/`パターンへ再作成します。

**ワークスペースから見える一時repoが`ENAMETOOLONG`や壊れたインデックス化を起こす?**
QMDの走査は現在、OpenClaw組み込みのシンボリックリンクルールではなく、基盤となるQMDスキャナーの動作に従います。
QMDがサイクル安全な走査または明示的な除外制御を公開するまで、一時的なmonorepoチェックアウトは
`.tmp/`のような隠しディレクトリ配下、またはインデックス対象のQMDルート外に置いてください。

## 設定

完全な設定インターフェース（`memory.qmd.*`）、検索モード、更新間隔、
スコープルール、その他すべての調整項目については、
[Memory configuration reference](/ja-JP/reference/memory-config)を参照してください。

## 関連

- [Memory overview](/ja-JP/concepts/memory)
- [Builtin memory engine](/ja-JP/concepts/memory-builtin)
- [Honcho memory](/ja-JP/concepts/memory-honcho)

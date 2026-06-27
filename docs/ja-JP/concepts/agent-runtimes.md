---
read_when:
    - OpenClaw、Codex、ACP、または別のネイティブエージェントランタイムのどれを選ぶか判断している
    - ステータスや設定の provider/model/runtime ラベルで混乱している
    - ネイティブハーネスのサポート同等性を文書化している
summary: OpenClaw がモデルプロバイダー、モデル、チャネル、エージェントランタイムを分離する仕組み
title: エージェントランタイム
x-i18n:
    generated_at: "2026-06-27T11:05:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fb818e682ffb11a073ee0053c0e7b7e2ea60239141aab7f96cd82520ded9d22f
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**エージェントランタイム**は、準備済みのモデルループを 1 つ所有するコンポーネントです。
プロンプトを受け取り、モデル出力を駆動し、ネイティブツール呼び出しを処理し、
完了したターンを OpenClaw に返します。

ランタイムはプロバイダーと混同しやすいものです。どちらもモデル設定の近くに
現れるためです。これらは別のレイヤーです。

| レイヤー         | 例                                           | 意味                                                                 |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| プロバイダー      | `openai`, `anthropic`, `github-copilot`      | OpenClaw が認証し、モデルを検出し、モデル参照に名前を付ける方法。 |
| モデル         | `gpt-5.5`, `claude-opus-4-6`                 | エージェントターンで選択されたモデル。                              |
| エージェントランタイム | `openclaw`, `codex`, `copilot`, `claude-cli` | 準備済みターンを実行する低レベルのループまたはバックエンド。      |
| チャンネル       | Telegram, Discord, Slack, WhatsApp           | メッセージが OpenClaw に入り、出ていく場所。                        |

コード内では **ハーネス**という言葉も見かけます。ハーネスは、
エージェントランタイムを提供する実装です。たとえば、同梱の Codex ハーネスは
`codex` ランタイムを実装します。公開設定では、プロバイダーまたはモデルの
エントリーで `agentRuntime.id` を使います。エージェント全体のランタイムキーは
レガシーであり、無視されます。`openclaw doctor --fix` は、古いエージェント全体の
ランタイム固定を削除し、必要に応じてレガシーなランタイムモデル参照を
正規のプロバイダー/モデル参照とモデルスコープのランタイムポリシーに
書き換えます。

ランタイムには 2 つのファミリーがあります。

- **埋め込みハーネス**は OpenClaw の準備済みエージェントループ内で実行されます。
  現在は組み込みの `openclaw` ランタイムに加えて、`codex` や `copilot` などの
  登録済み Plugin ハーネスが該当します。
- **CLI バックエンド**は、モデル参照を正規のまま保ちながらローカル CLI プロセスを
  実行します。たとえば、モデルスコープの `agentRuntime.id: "claude-cli"` を伴う
  `anthropic/claude-opus-4-8` は、「Anthropic モデルを選択し、
  Claude CLI 経由で実行する」ことを意味します。`claude-cli` は埋め込みハーネス ID
  ではなく、AgentHarness の選択に渡してはいけません。

`copilot` ハーネスは、GitHub Copilot CLI 用の独立したオプトインの外部 Plugin
ハーネスです。PI、Codex、GitHub Copilot エージェントランタイムのどれを使うかという
ユーザー向けの判断については、[GitHub Copilot エージェントランタイム](/ja-JP/plugins/copilot)
を参照してください。

## Codex サーフェス

混乱の多くは、複数の異なるサーフェスが Codex という名前を共有していることに
由来します。

| サーフェス                                          | OpenClaw の名前/設定                 | 役割                                                                                                           |
| ------------------------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| ネイティブ Codex app-server ランタイム                  | `openai/*` モデル参照                | Codex app-server 経由で OpenAI の埋め込みエージェントターンを実行します。これは通常の ChatGPT/Codex サブスクリプション設定です。 |
| Codex OAuth 認証プロファイル                        | `openai` OAuth プロファイル          | Codex app-server ハーネスが消費する ChatGPT/Codex サブスクリプション認証を保存します。                             |
| Codex ACP アダプター                                | `runtime: "acp"`, `agentId: "codex"` | 外部 ACP/acpx コントロールプレーン経由で Codex を実行します。ACP/acpx が明示的に求められた場合にのみ使用します。            |
| ネイティブ Codex チャット制御コマンドセット            | `/codex ...`                         | チャットから Codex app-server スレッドをバインド、再開、誘導、停止、検査します。                                |
| 非エージェントサーフェス向け OpenAI Platform API ルート | `openai/*` と API キー認証           | 画像、埋め込み、音声、リアルタイムなどの直接的な OpenAI API に使われます。                                  |

これらのサーフェスは意図的に独立しています。`codex` Plugin を有効化すると、
ネイティブ app-server 機能が利用可能になります。`openclaw doctor --fix` は
レガシーな Codex ルート修復と古いセッション固定のクリーンアップを担います。
エージェントモデルに `openai/*` を選択することは、非エージェントの OpenAI API
サーフェスが使われていない限り、現在は「これを Codex 経由で実行する」ことを
意味します。

一般的な ChatGPT/Codex サブスクリプション設定では認証に Codex OAuth を使いますが、
モデル参照は `openai/*` のままにし、`codex` ランタイムを選択します。

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

これは、OpenClaw が OpenAI モデル参照を選択し、その後 Codex app-server
ランタイムに埋め込みエージェントターンの実行を依頼することを意味します。
「API 課金を使う」ことを意味するわけではなく、チャンネル、モデルプロバイダー
カタログ、OpenClaw セッションストアが Codex になることも意味しません。

同梱の `codex` Plugin が有効な場合、自然言語による Codex 制御には ACP ではなく、
ネイティブの `/codex` コマンドサーフェス（`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`）を使うべきです。Codex に ACP を
使うのは、ユーザーが ACP/acpx を明示的に求めている場合、または ACP アダプター
パスをテストしている場合だけです。Claude Code、Gemini CLI、OpenCode、Cursor、
および同様の外部ハーネスは、引き続き ACP を使います。

これはエージェント向けの判断ツリーです。

1. ユーザーが **Codex のバインド/制御/スレッド/再開/誘導/停止**を求めている場合は、
   同梱の `codex` Plugin が有効ならネイティブの `/codex` コマンドサーフェスを使います。
2. ユーザーが **埋め込みランタイムとしての Codex**を求めている場合、または通常の
   サブスクリプションに支えられた Codex エージェント体験を望んでいる場合は、
   `openai/<model>` を使います。
3. ユーザーが **OpenAI モデルに OpenClaw**を明示的に選ぶ場合は、モデル参照を
   `openai/<model>` のままにし、プロバイダー/モデルのランタイムポリシーを
   `agentRuntime.id: "openclaw"` に設定します。選択された `openai` OAuth
   プロファイルは、OpenClaw の Codex 認証トランスポートを通じて内部的にルーティングされます。
4. レガシー設定に **レガシー Codex モデル参照**がまだ含まれている場合は、
   `openclaw doctor --fix` で `openai/<model>` に修復します。古いモデル参照が
   それを示唆していた箇所では、doctor がプロバイダー/モデルスコープの
   `agentRuntime.id: "codex"` を追加することで Codex 認証ルートを維持します。
   レガシーな **`codex-cli/*` モデル参照**も同じ `openai/<model>` Codex
   app-server ルートに修復されます。OpenClaw は同梱の Codex CLI バックエンドを
   もう保持していません。
5. ユーザーが **ACP**、**acpx**、または **Codex ACP アダプター**を明示的に言う場合は、
   `runtime: "acp"` と `agentId: "codex"` で ACP を使います。
6. リクエストが **Claude Code、Gemini CLI、OpenCode、Cursor、Droid、または
   別の外部ハーネス**に関するものなら、ネイティブのサブエージェントランタイムではなく
   ACP/acpx を使います。

| 意図しているもの...                             | 使うもの...                                      |
| --------------------------------------- | -------------------------------------------- |
| Codex app-server のチャット/スレッド制御    | 同梱の `codex` Plugin から `/codex ...` |
| Codex app-server の埋め込みエージェントランタイム | `openai/*` エージェントモデル参照                  |
| OpenAI Codex OAuth                      | `openai` OAuth プロファイル                      |
| Claude Code またはその他の外部ハーネス   | ACP/acpx                                     |

OpenAI ファミリーのプレフィックス分割については、[OpenAI](/ja-JP/providers/openai) と
[モデルプロバイダー](/ja-JP/concepts/model-providers) を参照してください。Codex ランタイム
サポート契約については、[Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime#v1-support-contract)
を参照してください。

## ランタイムの所有権

ランタイムごとに、ループのどれだけを所有するかが異なります。

| サーフェス                     | OpenClaw 埋め込み                             | Codex app-server                                                            |
| --------------------------- | --------------------------------------------- | --------------------------------------------------------------------------- |
| モデルループの所有者            | OpenClaw 埋め込みランナー経由の OpenClaw | Codex app-server                                                            |
| 正規のスレッド状態      | OpenClaw トランスクリプト                           | Codex スレッドに加えて OpenClaw トランスクリプトミラー                               |
| OpenClaw 動的ツール      | ネイティブ OpenClaw ツールループ                     | Codex アダプター経由でブリッジ                                           |
| ネイティブシェルおよびファイルツール | OpenClaw パス                                 | Codex ネイティブツール。サポートされる場合はネイティブフック経由でブリッジ            |
| コンテキストエンジン              | ネイティブ OpenClaw コンテキスト組み立て              | OpenClaw がコンテキストを Codex ターンに組み立てる                     |
| Compaction                  | OpenClaw または選択されたコンテキストエンジン           | Codex ネイティブの Compaction。OpenClaw 通知とミラー保守を伴う |
| チャンネル配信            | OpenClaw                                      | OpenClaw                                                                    |

この所有権の分割が主要な設計ルールです。

- OpenClaw がサーフェスを所有する場合、OpenClaw は通常の Plugin フック動作を提供できます。
- ネイティブランタイムがサーフェスを所有する場合、OpenClaw にはランタイムイベントまたはネイティブフックが必要です。
- ネイティブランタイムが正規のスレッド状態を所有する場合、OpenClaw はサポートされていない内部を書き換えるのではなく、コンテキストをミラーして投影するべきです。

## ランタイム選択

OpenClaw はプロバイダーとモデルの解決後に埋め込みランタイムを選択します。

1. モデルスコープのランタイムポリシーが優先されます。これは、設定済みのプロバイダー
   モデルエントリー、または `agents.defaults.models["provider/model"].agentRuntime` /
   `agents.list[].models["provider/model"].agentRuntime` に置くことができます。
   `agents.defaults.models["vllm/*"].agentRuntime` のようなプロバイダーのワイルドカードは、
   完全一致のモデルポリシーの後に適用されます。そのため、動的に検出された
   プロバイダーモデルは、モデルごとの正確な例外を上書きせずに 1 つのランタイムを共有できます。
2. 次に、`models.providers.<provider>.agentRuntime` にあるプロバイダースコープの
   ランタイムポリシーが使われます。
3. `auto` モードでは、登録済み Plugin ランタイムがサポート対象のプロバイダー/モデル
   ペアを要求できます。
4. `auto` モードでどのランタイムもターンを要求しない場合、OpenClaw は互換性ランタイムとして
   `openclaw` を使います。実行を厳密にしたい場合は明示的なランタイム ID を使ってください。

セッション全体およびエージェント全体のランタイム固定は無視されます。これには
`OPENCLAW_AGENT_RUNTIME`、セッションの `agentHarnessId`/`agentRuntimeOverride` 状態、
`agents.defaults.agentRuntime`、`agents.list[].agentRuntime` が含まれます。
`openclaw doctor --fix` を実行すると、古いエージェント全体のランタイム設定を削除し、
OpenClaw が意図を維持できる場合はレガシーなランタイムモデル参照を変換できます。

明示的なプロバイダー/モデルの Plugin ランタイムはフェイルクローズします。たとえば、
プロバイダーまたはモデル上の `agentRuntime.id: "codex"` は、Codex または明確な
選択/ランタイムエラーを意味します。OpenClaw に暗黙的に戻されることはありません。

CLI バックエンドのエイリアスは、埋め込みハーネス ID とは異なります。推奨される
Claude CLI の形式は次のとおりです。

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-8",
      models: {
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

`claude-cli/claude-opus-4-7` のようなレガシー参照は互換性のために引き続きサポートされますが、
新しい設定ではプロバイダー/モデルを正規のまま保ち、実行バックエンドを
プロバイダー/モデルのランタイムポリシーに置くべきです。

レガシーな `codex-cli/*` 参照は異なります。doctor はそれらを `openai/*` に移行し、
Codex CLI バックエンドを維持するのではなく Codex app-server ハーネス経由で実行されるようにします。

`auto` モードは、ほとんどのプロバイダーに対して意図的に保守的です。OpenAI エージェント
モデルは例外です。未設定のランタイムと `auto` はどちらも Codex ハーネスに解決されます。
明示的な OpenClaw ランタイム設定は、`openai/*` エージェントターンに対するオプトインの
互換性ルートとして残ります。選択された `openai` OAuth プロファイルと組み合わせると、
OpenClaw は公開モデル参照を `openai/*` のまま保ちながら、そのパスを Codex 認証
トランスポート経由で内部的にルーティングします。古い OpenAI ランタイムセッション固定は
ランタイム選択では無視され、`openclaw doctor --fix` でクリーンアップできます。

`openclaw doctor` が、従来の Codex モデル参照が設定に残っている状態で `codex` プラグインが有効になっていると警告する場合、それは従来のルート状態として扱ってください。Codex ランタイムを使って `openai/*` に書き換えるには、`openclaw doctor --fix` を実行します。

## GitHub Copilot エージェントランタイム

外部の `@openclaw/copilot` プラグインは、GitHub Copilot CLI (`@github/copilot-sdk`) によって支えられる、オプトインの `copilot` ランタイムを登録します。これは正規のサブスクリプション `github-copilot` プロバイダーを要求し、`auto` によって選択されることは**ありません**。`agentRuntime.id` を使って、モデル単位またはプロバイダー単位でオプトインします。

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/gpt-5.5",
      models: {
        "github-copilot/gpt-5.5": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

このハーネスは、`extensions/copilot/doctor-contract-api.ts` でプロバイダー、ランタイム、CLI セッションキー、認証プロファイル接頭辞を要求し、`openclaw doctor` がそれを自動的に読み込みます。設定、認証、トランスクリプトのミラーリング、Compaction、宣言的な doctor コントラクト、および PI と Codex と Copilot SDK のより広い選択については、[GitHub Copilot エージェントランタイム](/ja-JP/plugins/copilot)を参照してください。

## 互換性コントラクト

ランタイムが OpenClaw ではない場合、そのランタイムは対応する OpenClaw サーフェスを文書化するべきです。ランタイムのドキュメントにはこの形式を使います。

| 質問                                   | 重要な理由                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| モデルループの所有者は誰か？           | 再試行、ツール継続、最終回答の判断がどこで行われるかを決定します。                                 |
| 正規のスレッド履歴の所有者は誰か？     | OpenClaw が履歴を編集できるのか、それともミラーリングのみできるのかを決定します。                   |
| OpenClaw の動的ツールは動作するか？    | メッセージング、セッション、cron、OpenClaw 所有のツールはこれに依存します。                         |
| 動的ツールフックは動作するか？         | プラグインは、OpenClaw 所有のツールの周辺で `before_tool_call`、`after_tool_call`、ミドルウェアを期待します。 |
| ネイティブツールフックは動作するか？   | シェル、パッチ、ランタイム所有のツールには、ポリシーと観測のためにネイティブフック対応が必要です。 |
| コンテキストエンジンのライフサイクルは実行されるか？ | メモリおよびコンテキストプラグインは、assemble、ingest、after-turn、Compaction のライフサイクルに依存します。 |
| どの Compaction データが公開されるか？ | 通知だけで足りるプラグインもあれば、保持または破棄されたメタデータを必要とするプラグインもあります。 |
| 意図的に非対応としているものは何か？   | ネイティブランタイムがより多くの状態を所有する場所で、ユーザーが OpenClaw と同等だと想定しないようにするためです。 |

Codex ランタイム対応コントラクトは、[Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime#v1-support-contract)に記載されています。

## ステータスラベル

ステータス出力には `Execution` と `Runtime` の両方のラベルが表示されることがあります。これらはプロバイダー名ではなく、診断情報として読んでください。

- `openai/gpt-5.5` のようなモデル参照は、選択されたプロバイダーとモデルを示します。
- `codex` のようなランタイム ID は、そのターンを実行しているループを示します。
- Telegram や Discord のようなチャンネルラベルは、会話がどこで行われているかを示します。

実行にまだ想定外のランタイムが表示される場合は、まず選択されたプロバイダーとモデルのランタイムポリシーを調べてください。従来のセッションランタイム固定は、もうルーティングを決定しません。

## 関連項目

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [GitHub Copilot エージェントランタイム](/ja-JP/plugins/copilot)
- [OpenAI](/ja-JP/providers/openai)
- [エージェントハーネスプラグイン](/ja-JP/plugins/sdk-agent-harness)
- [エージェントループ](/ja-JP/concepts/agent-loop)
- [モデル](/ja-JP/concepts/models)
- [ステータス](/ja-JP/cli/status)

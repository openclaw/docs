---
read_when:
    - OpenClaw、Codex、ACP、または別のネイティブエージェントランタイムのいずれかを選択しようとしています
    - ステータスまたは設定に表示されるプロバイダー／モデル／ランタイムのラベルが分かりにくい場合
    - ネイティブハーネスのサポート同等性について文書化しています
summary: OpenClaw がモデルプロバイダー、モデル、チャネル、エージェントランタイムを分離する仕組み
title: エージェントランタイム
x-i18n:
    generated_at: "2026-07-12T14:24:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 47634daec4f88afa26ba47f33e1ed54b5768381bedeb7de7730fdb766566da89
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**エージェントランタイム**は、準備済みのモデルループを1つ所有します。プロンプトを受け取り、
モデル出力を駆動し、ネイティブツール呼び出しを処理して、完了したターンを
OpenClaw に返します。

ランタイムとプロバイダーは、どちらもモデル設定の近くに現れるため混同しやすいですが、
異なるレイヤーです。

| レイヤー         | 例                                           | 意味                                                                     |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| プロバイダー      | `anthropic`, `github-copilot`, `openai`      | OpenClaw が認証し、モデルを検出し、モデル参照に名前を付ける方法。 |
| モデル         | `claude-opus-4-6`, `gpt-5.6-sol`             | エージェントターン用に選択されたモデル。                              |
| エージェントランタイム | `claude-cli`, `codex`, `copilot`, `openclaw` | 準備済みターンを実行する低レベルのループまたはバックエンド。      |
| チャネル       | Discord, Slack, Telegram, WhatsApp           | メッセージが OpenClaw に出入りする場所。                            |

**ハーネス**は、エージェントランタイムを提供する実装を指すコード上の用語です。
たとえば、同梱の Codex ハーネスは `codex` ランタイムを実装します。
公開設定では、プロバイダーまたはモデルのエントリにある `agentRuntime.id` を使用します。エージェント全体の
ランタイムキーはレガシーであり、無視されます。`openclaw doctor --fix` は古い
エージェント全体のランタイム固定を削除し、レガシーなランタイムモデル参照を正規の
プロバイダー/モデル参照に書き換え、必要に応じてモデルスコープのランタイムポリシーも追加します。

ランタイムには2つのファミリーがあります。

- **埋め込みハーネス**は OpenClaw の準備済みエージェントループ内で実行されます。
  組み込みの `openclaw` ランタイムに加え、`codex` や `copilot` などの
  登録済み Plugin ハーネスが含まれます。
- **CLI バックエンド**は、モデル参照を正規のまま維持しつつ、ローカルの CLI プロセスを
  実行します。たとえば、モデルスコープの
  `agentRuntime.id: "claude-cli"` を指定した `anthropic/claude-opus-4-8` は、
  「Anthropic モデルを選択し、Claude CLI 経由で実行する」という意味です。
  `claude-cli` は埋め込みハーネス ID ではないため、AgentHarness の選択に
  渡してはいけません。

`copilot` ハーネスは GitHub Copilot CLI 用の、独立したオプトインの外部 Plugin ハーネスです。
PI、Codex、GitHub Copilot エージェントランタイムのユーザー向けの選択については、
[GitHub Copilot エージェントランタイム](/ja-JP/plugins/copilot)を参照してください。

## Codex のサーフェス

複数のサーフェスが Codex という名前を共有しています。

| サーフェス                                          | OpenClaw での名前/設定                 | 機能                                                                                                   |
| ------------------------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| ネイティブ Codex app-server ランタイム                  | `openai/*` モデル参照                | Codex app-server を通じて OpenAI の埋め込みエージェントターンを実行します。これは通常の ChatGPT/Codex サブスクリプション設定です。 |
| Codex OAuth 認証プロファイル                        | `openai` OAuth プロファイル              | Codex app-server ハーネスが使用する ChatGPT/Codex サブスクリプション認証を保存します。                             |
| Codex ACP アダプター                                | `runtime: "acp"`, `agentId: "codex"` | 外部の ACP/acpx コントロールプレーンを通じて Codex を実行します。ACP/acpx が明示的に要求された場合にのみ使用します。        |
| ネイティブ Codex チャット制御コマンドセット            | `/codex ...`                         | チャットから Codex app-server スレッドをバインド、再開、制御、停止、検査します。                                |
| エージェント以外のサーフェス用 OpenAI Platform API ルート | `openai/*` と API キー認証         | 画像、埋め込み、音声、リアルタイムなどの OpenAI API を直接使用します。                                           |

これらのサーフェスは意図的に独立しています。`codex` Plugin を有効にすると、
ネイティブ app-server 機能が利用可能になります。`openclaw doctor --fix` は、
レガシーな Codex ルートの修復と古いセッション固定のクリーンアップを担当します。現在、エージェントモデルに
`openai/*` を選択すると、エージェント以外の OpenAI API サーフェスを使用している場合を除き、
「Codex を通じて実行する」という意味になります。

一般的な ChatGPT/Codex サブスクリプション設定では認証に Codex OAuth を使用しますが、
モデル参照は `openai/*` のまま維持し、`codex` ランタイムを選択します。

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

これは、OpenClaw が OpenAI モデル参照を選択し、その後 Codex
app-server ランタイムに埋め込みエージェントターンの実行を依頼することを意味します。
「API 課金を使用する」という意味ではなく、チャネル、モデルプロバイダーカタログ、
または OpenClaw セッションストアが Codex になるという意味でもありません。

同梱の `codex` Plugin が有効な場合は、ACP ではなく、ネイティブの `/codex` コマンド
サーフェス（`/codex bind`、`/codex threads`、`/codex resume`、`/codex steer`、
`/codex stop`）を使用して、自然言語で Codex を制御します。Codex に ACP を使用するのは、
ユーザーが ACP/acpx を明示的に要求した場合、または ACP アダプター経路をテストしている場合だけです。
Claude Code、Gemini CLI、OpenCode、Cursor、および同様の外部
ハーネスでは、引き続き ACP を使用します。

判断ツリー：

1. **Codex のバインド/制御/スレッド/再開/方向付け/停止** -> 同梱の `codex` Plugin が有効な場合は、ネイティブの `/codex` コマンドサーフェス。
2. **埋め込みランタイムとしての Codex**、または通常のサブスクリプション対応 Codex エージェント体験 -> `openai/<model>`。
3. **OpenAI モデル用に OpenClaw を明示的に選択** -> モデル参照を `openai/<model>` のまま維持し、プロバイダー/モデルのランタイムポリシーを `agentRuntime.id: "openclaw"` に設定します。選択された `openai` OAuth プロファイルは、OpenClaw の Codex 認証トランスポートを通じて内部的にルーティングされます。
4. **設定内のレガシーな Codex モデル参照** -> `openclaw doctor --fix` で `openai/<model>` に修復します。古いモデル参照が Codex 認証ルートを示していた場合、doctor はプロバイダー/モデルスコープの `agentRuntime.id: "codex"` を追加して、そのルートを維持します。レガシーな **`codex-cli/*`** モデル参照も、同じ `openai/<model>` Codex app-server ルートに修復されます。OpenClaw は同梱の Codex CLI バックエンドを維持しなくなりました。
5. **ACP、acpx、または Codex ACP アダプターが明示的に要求された場合** -> `runtime: "acp"` と `agentId: "codex"`。
6. **Claude Code、Gemini CLI、OpenCode、Cursor、Droid、または別の外部ハーネス** -> ネイティブのサブエージェントランタイムではなく ACP/acpx。

| 意図するもの...                             | 使用するもの...                                       |
| --------------------------------------- | -------------------------------------------- |
| Codex app-server のチャット/スレッド制御    | 同梱の `codex` Plugin の `/codex ...` |
| Codex app-server の埋め込みエージェントランタイム | `openai/*` エージェントモデル参照                  |
| OpenAI Codex OAuth                      | `openai` OAuth プロファイル                      |
| Claude Code またはその他の外部ハーネス   | ACP/acpx                                     |

OpenAI ファミリーのプレフィックス分割については、[OpenAI](/ja-JP/providers/openai)と
[モデルプロバイダー](/ja-JP/concepts/model-providers)を参照してください。Codex ランタイムのサポート
契約については、[Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime#v1-support-contract)を参照してください。

## ランタイムの所有権

ランタイムによって、ループを所有する範囲が異なります。

| サーフェス                     | OpenClaw 埋め込み                              | Codex app-server                                                            |
| --------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------- |
| モデルループの所有者            | OpenClaw 埋め込みランナーを通じた OpenClaw | Codex app-server                                                            |
| 正規スレッド状態      | OpenClaw トランスクリプト                            | Codex スレッドと OpenClaw トランスクリプトのミラー                               |
| OpenClaw 動的ツール      | ネイティブ OpenClaw ツールループ                      | Codex アダプターを通じてブリッジ                                           |
| ネイティブシェルおよびファイルツール | OpenClaw 経路                                  | Codex ネイティブツール。サポートされている場合はネイティブフックを通じてブリッジ            |
| コンテキストエンジン              | ネイティブ OpenClaw コンテキストアセンブリ               | OpenClaw が組み立てたコンテキストを Codex ターンに反映                     |
| Compaction                  | OpenClaw または選択されたコンテキストエンジン            | Codex ネイティブの Compaction。OpenClaw の通知とミラー保守を伴う |
| チャネル配信            | OpenClaw                                       | OpenClaw                                                                    |

設計ルール：OpenClaw がサーフェスを所有している場合、通常の Plugin フック動作を
提供できます。ネイティブランタイムがサーフェスを所有している場合、OpenClaw には
ランタイムイベントまたはネイティブフックが必要です。ネイティブランタイムが正規スレッド状態を所有する場合、
OpenClaw はサポートされていない内部構造を書き換えるのではなく、コンテキストをミラーリングして投影します。

## ランタイムの選択

OpenClaw は、プロバイダーとモデルの解決後、次の順序で埋め込みランタイムを
解決します。

1. **モデルスコープのランタイムポリシー**が優先されます。これは設定済みプロバイダーの
   モデルエントリ、または `agents.defaults.models["provider/model"].agentRuntime`
   / `agents.list[].models["provider/model"].agentRuntime` にあります。
   `agents.defaults.models["vllm/*"].agentRuntime` のようなプロバイダーの
   ワイルドカードは、完全一致するモデルポリシーの後に適用されるため、動的に検出されたプロバイダーモデルは、
   モデルごとの完全一致の例外を上書きせずに、1つのランタイムを共有できます。
2. **プロバイダースコープのランタイムポリシー**：`models.providers.<provider>.agentRuntime`。
3. **`auto` モード**：登録済み Plugin ランタイムは、サポート対象のプロバイダー/モデルの組み合わせを引き受けることができます。
4. `auto` モードでどのランタイムもターンを引き受けない場合、OpenClaw は
   互換ランタイムとして `openclaw` にフォールバックします。実行を厳密にする必要がある場合は、
   明示的なランタイム ID を使用してください。

セッション全体およびエージェント全体のランタイム固定は無視されます：`OPENCLAW_AGENT_RUNTIME`、
セッションの `agentHarnessId`/`agentRuntimeOverride` 状態、`agents.defaults.agentRuntime`、
および `agents.list[].agentRuntime`。`openclaw doctor --fix` を実行して、古い
エージェント全体のランタイム設定を削除し、意図を維持できる場合はレガシーなランタイムモデル参照を
変換してください。

明示的なプロバイダー/モデル Plugin ランタイムはフェイルクローズします。プロバイダーまたはモデル上の
`agentRuntime.id: "codex"` は Codex、または明確な選択/ランタイムエラーを意味し、
暗黙に OpenClaw に戻されることはありません。一致しないターンを OpenClaw に
ルーティングできるのは `auto` だけです。

CLI バックエンドのエイリアスは、埋め込みハーネス ID とは異なります。推奨される Claude CLI の形式：

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

`claude-cli/claude-opus-4-7` のようなレガシー参照は互換性のために
引き続きサポートされますが、新しい設定ではプロバイダー/モデルを正規のまま維持し、
実行バックエンドをプロバイダー/モデルのランタイムポリシーに配置する必要があります。

レガシーな `codex-cli/*` 参照は異なります。doctor はそれらを `openai/*` に移行し、
Codex CLI バックエンドを維持する代わりに、Codex app-server ハーネスを通じて実行します。

`auto` モードは、ほとんどのプロバイダーに対して意図的に保守的です。OpenAI エージェント
モデルは例外で、ランタイム未設定と `auto` はどちらも Codex
ハーネスに解決されます。明示的な OpenClaw ランタイム設定は、`openai/*` エージェントターン用の
オプトイン互換ルートとして引き続き使用できます。選択された `openai` OAuth
プロファイルと組み合わせると、OpenClaw は公開モデル参照を `openai/*` のまま維持しつつ、
その経路を Codex 認証トランスポートを通じて内部的にルーティングします。古い OpenAI
ランタイムセッション固定はランタイム選択で無視され、`openclaw doctor --fix` で
クリーンアップできます。

レガシーな Codex モデル参照が設定内に残っている状態で `codex` Plugin が有効になっていると
`openclaw doctor` が警告する場合、それをレガシールートの状態として扱い、
`openclaw doctor --fix` を実行して Codex ランタイム付きの `openai/*` に
書き換えてください。

## GitHub Copilot エージェントランタイム

外部の `@openclaw/copilot` Plugin は、GitHub Copilot CLI（`@github/copilot-sdk`）を基盤とする、オプトイン方式の `copilot` ランタイムを登録します。この Plugin は正規のサブスクリプション `github-copilot` プロバイダーを要求し、`auto` によって選択されることは**決してありません**。`agentRuntime.id` を使用して、モデル単位またはプロバイダー単位でオプトインします。

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

ハーネスは、`extensions/copilot/doctor-contract-api.ts` でプロバイダー、ランタイム、CLI セッションキー、認証プロファイルのプレフィックスを要求し、`openclaw doctor` はこれを自動的に読み込みます。設定、認証、トランスクリプトのミラーリング、Compaction、宣言的な doctor コントラクト、および PI、Codex、Copilot SDK のより広範な選択については、[GitHub Copilot エージェントランタイム](/ja-JP/plugins/copilot)を参照してください。

## 互換性コントラクト

ランタイムが OpenClaw ではない場合、そのドキュメントには、サポートする OpenClaw の機能領域を明記する必要があります。

| 質問 | 重要である理由 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| モデルループの所有者は誰ですか？ | 再試行、ツールの継続、最終回答の決定がどこで行われるかを決定します。 |
| 正規のスレッド履歴の所有者は誰ですか？ | OpenClaw が履歴を編集できるか、ミラーリングのみ可能かを決定します。 |
| OpenClaw の動的ツールは機能しますか？ | メッセージング、セッション、Cron、OpenClaw 所有のツールはこれに依存します。 |
| 動的ツールフックは機能しますか？ | Plugin は、OpenClaw 所有のツールを取り囲む `before_tool_call`、`after_tool_call`、ミドルウェアを必要とします。 |
| ネイティブツールフックは機能しますか？ | シェル、パッチ、ランタイム所有のツールでは、ポリシー適用と監視のためにネイティブフックのサポートが必要です。 |
| コンテキストエンジンのライフサイクルは実行されますか？ | メモリおよびコンテキスト Plugin は、組み立て、取り込み、ターン後処理、Compaction のライフサイクルに依存します。 |
| どの Compaction データが公開されますか？ | 通知のみを必要とする Plugin もあれば、保持／破棄されたメタデータを必要とする Plugin もあります。 |
| 意図的にサポートされていないものは何ですか？ | ネイティブランタイムがより多くの状態を所有する場合、ユーザーは OpenClaw と同等であると想定すべきではありません。 |

Codex ランタイムのサポートコントラクトについては、[Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime#v1-support-contract)に記載されています。

## ステータスラベル

ステータス出力には、`Execution` と `Runtime` の両方のラベルが表示される場合があります。これらはプロバイダー名ではなく、診断情報として解釈してください。

- `openai/gpt-5.6-sol` などのモデル参照は、選択されたプロバイダー／モデルです。
- `codex` などのランタイム ID は、ターンを実行するループです。
- Telegram や Discord などのチャネルラベルは、会話が行われている場所です。

実行で予期しないランタイムが表示される場合は、まず選択されたプロバイダー／モデルのランタイムポリシーを確認してください。従来のセッションランタイム固定は、ルーティングを決定しなくなりました。

## 関連項目

- [Codex ハーネス](/ja-JP/plugins/codex-harness)
- [Codex ハーネスランタイム](/ja-JP/plugins/codex-harness-runtime)
- [GitHub Copilot エージェントランタイム](/ja-JP/plugins/copilot)
- [OpenAI](/ja-JP/providers/openai)
- [エージェントハーネス Plugin](/ja-JP/plugins/sdk-agent-harness)
- [エージェントループ](/ja-JP/concepts/agent-loop)
- [モデル](/ja-JP/concepts/models)
- [ステータス](/ja-JP/cli/status)

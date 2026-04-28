---
read_when:
    - 新しいOpenClaw Pluginを作成したい場合
    - Plugin開発のクイックスタートが必要です
    - 新しいチャネル、プロバイダー、ツール、またはその他のcapabilityをOpenClawに追加しています
sidebarTitle: Getting Started
summary: 数分で最初のOpenClaw Pluginを作成する
title: Pluginの構築
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-25T13:53:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69c7ffb65750fd0c1fa786600c55a371dace790b8b1034fa42f4b80f5f7146df
    source_path: plugins/building-plugins.md
    workflow: 15
---

Pluginは、OpenClawに新しいcapabilityを追加します: チャネル、モデルプロバイダー、
speech、realtime transcription、realtime voice、media understanding、image
generation、video generation、web fetch、web search、agent tool、またはそれらの任意の組み合わせです。

PluginをOpenClaw repositoryに追加する必要はありません。
[ClawHub](/ja-JP/tools/clawhub) またはnpmへ公開し、ユーザーは
`openclaw plugins install <package-name>` でインストールします。OpenClawはまずClawHubを試し、
自動でnpmへフォールバックします。

## 前提条件

- Node >= 22 と package manager（npm または pnpm）
- TypeScript（ESM）に慣れていること
- repo内Pluginの場合: repositoryをclone済みで `pnpm install` 済み

## どの種類のPluginですか？

<CardGroup cols={3}>
  <Card title="チャネルPlugin" icon="messages-square" href="/ja-JP/plugins/sdk-channel-plugins">
    OpenClawをメッセージングプラットフォーム（Discord、IRCなど）に接続する
  </Card>
  <Card title="プロバイダーPlugin" icon="cpu" href="/ja-JP/plugins/sdk-provider-plugins">
    モデルプロバイダー（LLM、proxy、またはカスタムendpoint）を追加する
  </Card>
  <Card title="ツール / hook Plugin" icon="wrench" href="/ja-JP/plugins/hooks">
    agent tool、event hook、またはserviceを登録する — 以下を続けてください
  </Card>
</CardGroup>

オンボーディング/セットアップ実行時にインストールされている保証がないチャネルPluginでは、
`openclaw/plugin-sdk/channel-setup` の
`createOptionalChannelSetupSurface(...)` を使ってください。これにより、
インストール要件を告知し、Pluginがインストールされるまで実際のconfig書き込みではfail-closedする
setup adapter + ウィザードが生成されます。

## クイックスタート: ツールPlugin

このウォークスルーでは、agent toolを登録する最小Pluginを作成します。チャネル
PluginとプロバイダーPluginには、上記リンク先の専用ガイドがあります。

<Steps>
  <Step title="packageとmanifestを作成する">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-my-plugin",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "description": "OpenClawにカスタムツールを追加します",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    設定がなくても、すべてのPluginにmanifestが必要です。完全なschemaについては
    [Manifest](/ja-JP/plugins/manifest) を参照してください。正式なClawHub
    publish snippetは `docs/snippets/plugin-publish/` にあります。

  </Step>

  <Step title="entry pointを書く">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Do a thing",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry` は非チャネルPlugin用です。チャネルでは
    `defineChannelPluginEntry` を使ってください — [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) を参照してください。
    完全なentry pointオプションについては [Entry Points](/ja-JP/plugins/sdk-entrypoints) を参照してください。

  </Step>

  <Step title="テストして公開する">

    **外部Plugin:** ClawHubで検証して公開し、その後インストールします:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClawは、`@myorg/openclaw-my-plugin` のような素のpackage specでも
    npmより先にClawHubを確認します。

    **repo内Plugin:** バンドル済みPlugin workspace tree配下に置けば — 自動検出されます。

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugincapability

1つのPluginは、`api` オブジェクトを通じて任意個のcapabilityを登録できます:

| Capability             | 登録メソッド                                     | 詳細ガイド                                                                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| テキスト推論（LLM）    | `api.registerProvider(...)`                      | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins)                               |
| CLI推論バックエンド    | `api.registerCliBackend(...)`                    | [CLI Backends](/ja-JP/gateway/cli-backends)                                           |
| チャネル / messaging   | `api.registerChannel(...)`                       | [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins)                                 |
| Speech (TTS/STT)       | `api.registerSpeechProvider(...)`                | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Realtime transcription | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Realtime voice         | `api.registerRealtimeVoiceProvider(...)`         | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Media understanding    | `api.registerMediaUnderstandingProvider(...)`    | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Image generation       | `api.registerImageGenerationProvider(...)`       | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Music generation       | `api.registerMusicGenerationProvider(...)`       | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Video generation       | `api.registerVideoGenerationProvider(...)`       | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web fetch              | `api.registerWebFetchProvider(...)`              | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web search             | `api.registerWebSearchProvider(...)`             | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Tool-result middleware | `api.registerAgentToolResultMiddleware(...)`     | [SDK Overview](/ja-JP/plugins/sdk-overview#registration-api)                          |
| Agent tools            | `api.registerTool(...)`                          | 以下                                                                           |
| Custom commands        | `api.registerCommand(...)`                       | [Entry Points](/ja-JP/plugins/sdk-entrypoints)                                        |
| Plugin hooks           | `api.on(...)`                                    | [Plugin hooks](/ja-JP/plugins/hooks)                                                  |
| Internal event hooks   | `api.registerHook(...)`                          | [Entry Points](/ja-JP/plugins/sdk-entrypoints)                                        |
| HTTP routes            | `api.registerHttpRoute(...)`                     | [Internals](/ja-JP/plugins/architecture-internals#gateway-http-routes)                |
| CLI subcommands        | `api.registerCli(...)`                           | [Entry Points](/ja-JP/plugins/sdk-entrypoints)                                        |

完全な登録APIについては [SDK Overview](/ja-JP/plugins/sdk-overview#registration-api) を参照してください。

バンドル済みPluginは、モデルが出力を見る前に非同期のtool-result書き換えが必要な場合、
`api.registerAgentToolResultMiddleware(...)` を使えます。
対象runtimeは `contracts.agentToolResultMiddleware` で宣言してください。たとえば
`["pi", "codex"]` です。これは信頼されたバンドル済みPlugin用のseamです。外部
Pluginは、このcapability向けにOpenClawが明示的な信頼ポリシーを拡張するまでは、
通常のOpenClaw Plugin hookを優先してください。

PluginがカスタムGateway RPCメソッドを登録する場合は、
Plugin固有のプレフィックスに保ってください。core admin namespace（`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`）は予約済みであり、Pluginが
より狭いscopeを要求しても常に `operator.admin` に解決されます。

覚えておくべきhook guardの意味論:

- `before_tool_call`: `{ block: true }` は終端であり、より低優先度のhandlerを停止します。
- `before_tool_call`: `{ block: false }` は判断なしとして扱われます。
- `before_tool_call`: `{ requireApproval: true }` はagent実行を一時停止し、exec approval overlay、Telegram button、Discord interaction、または任意チャネルの `/approve` コマンド経由でユーザー承認を求めます。
- `before_install`: `{ block: true }` は終端であり、より低優先度のhandlerを停止します。
- `before_install`: `{ block: false }` は判断なしとして扱われます。
- `message_sending`: `{ cancel: true }` は終端であり、より低優先度のhandlerを停止します。
- `message_sending`: `{ cancel: false }` は判断なしとして扱われます。
- `message_received`: 受信thread/topicルーティングが必要な場合は、型付きの `threadId` フィールドを優先してください。`metadata` はチャネル固有の追加情報向けに残してください。
- `message_sending`: チャネル固有metadata keyより、型付きの `replyToId` / `threadId` ルーティングフィールドを優先してください。

`/approve` コマンドは、制限付きフォールバックでexec承認とplugin承認の両方を処理します。exec approval idが見つからない場合、OpenClawは同じidをplugin approvals経由で再試行します。Plugin approval forwardingは、configの `approvals.plugin` で個別に設定できます。

同じ制限付きフォールバックケースをカスタム承認処理で検出する必要がある場合は、
承認期限切れ文字列を手動で照合する代わりに、
`openclaw/plugin-sdk/error-runtime` の `isApprovalNotFoundError` を優先してください。

例とhookリファレンスについては [Plugin hooks](/ja-JP/plugins/hooks) を参照してください。

## agent toolの登録

ツールは、LLMが呼び出せる型付き関数です。required（常に
利用可能）にもoptional（ユーザーのオプトイン）にもできます:

```typescript
register(api) {
  // Required tool — 常に利用可能
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool — ユーザーがallowlistに追加する必要がある
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

ユーザーはconfigでoptional toolを有効にします:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- ツール名はcore toolと衝突してはいけません（衝突したものはスキップされます）
- 副作用があるツールや追加バイナリ要件のあるツールには `optional: true` を使ってください
- ユーザーは、Plugin idを `tools.allow` に追加することで、そのPluginの全ツールを有効化できます

## import規約

必ず、焦点化された `openclaw/plugin-sdk/<subpath>` パスからimportしてください:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// 間違い: 単一のルート（非推奨、将来削除予定）
import { ... } from "openclaw/plugin-sdk";
```

完全なsubpathリファレンスについては [SDK Overview](/ja-JP/plugins/sdk-overview) を参照してください。

Plugin内部では、内部importにローカルbarrel file（`api.ts`, `runtime-api.ts`）を使ってください —
自分自身のPluginをそのSDK path経由でimportしてはいけません。

プロバイダーPluginでは、そのseamが本当に汎用的でない限り、プロバイダー固有helperはそれらのpackage-root
barrelに保ってください。現在のバンドル済み例:

- Anthropic: Claude stream wrapperと `service_tier` / beta helper
- OpenAI: provider builder、default-model helper、realtime provider
- OpenRouter: provider builder と onboarding/config helper

あるhelperが1つのバンドル済みprovider package内でしか役に立たない場合は、
それを `openclaw/plugin-sdk/*` へ昇格させるのではなく、その
package-root seamに置いてください。

生成済みの `openclaw/plugin-sdk/<bundled-id>` helper seamの一部は、
バンドル済みPluginの保守と互換性のために引き続き存在します。たとえば
`plugin-sdk/feishu-setup` や `plugin-sdk/zalo-setup` です。これらは予約済みサーフェスとして扱い、
新しいサードパーティPluginのデフォルトパターンにはしないでください。

## 提出前チェックリスト

<Check>**package.json** に正しい `openclaw` metadataがある</Check>
<Check>**openclaw.plugin.json** manifestが存在し、有効である</Check>
<Check>entry pointで `defineChannelPluginEntry` または `definePluginEntry` を使っている</Check>
<Check>すべてのimportが焦点化された `plugin-sdk/<subpath>` パスを使っている</Check>
<Check>内部importがSDK self-importではなくローカルmoduleを使っている</Check>
<Check>テストが通る（`pnpm test -- <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` が通る（repo内Plugin）</Check>

## ベータリリーステスト

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) のGitHub release tagを監視し、`Watch` > `Releases` で購読してください。beta tagは `v2026.3.N-beta.1` のような形式です。リリース告知については、公式OpenClaw Xアカウント [@openclaw](https://x.com/openclaw) の通知も有効にできます。
2. beta tagが出たらすぐに、そのbeta tagに対してPluginをテストしてください。stable化までの猶予は通常数時間しかありません。
3. テスト後、`plugin-forum` Discordチャネル内のあなたのPluginスレッドに、`all good` か壊れた内容を投稿してください。まだスレッドがない場合は作成してください。
4. 何か壊れていたら、`Beta blocker: <plugin-name> - <summary>` というタイトルのissueを作成または更新し、`beta-blocker` ラベルを付けてください。そのissueリンクをスレッドに貼ってください。
5. `main` 向けに `fix(<plugin-id>): beta blocker - <summary>` というタイトルのPRを開き、PRとDiscordスレッドの両方にissueをリンクしてください。contributorはPRにラベルを付けられないため、このタイトルがメンテナーと自動化に対するPR側のシグナルになります。PR付きのblockerはマージされます。PRがないblockerは、そのまま出荷される可能性があります。メンテナーはbeta testing中にこれらのスレッドを監視しています。
6. 反応がないことは問題なしを意味します。タイミングを逃した場合、修正はおそらく次のサイクルに入ります。

## 次のステップ

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/ja-JP/plugins/sdk-channel-plugins">
    メッセージングチャネルPluginを構築する
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/ja-JP/plugins/sdk-provider-plugins">
    モデルプロバイダーPluginを構築する
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/ja-JP/plugins/sdk-overview">
    import mapと登録APIリファレンス
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/ja-JP/plugins/sdk-runtime">
    `api.runtime` 経由のTTS、search、subagent
  </Card>
  <Card title="Testing" icon="test-tubes" href="/ja-JP/plugins/sdk-testing">
    テストユーティリティとパターン
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/ja-JP/plugins/manifest">
    完全なmanifest schemaリファレンス
  </Card>
</CardGroup>

## 関連

- [Plugin Architecture](/ja-JP/plugins/architecture) — 内部アーキテクチャの詳細解説
- [SDK Overview](/ja-JP/plugins/sdk-overview) — Plugin SDKリファレンス
- [Manifest](/ja-JP/plugins/manifest) — plugin manifest形式
- [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) — チャネルPluginの構築
- [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) — プロバイダーPluginの構築

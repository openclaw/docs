---
read_when:
    - 新しいOpenClaw Pluginを作成したい
    - Plugin開発のクイックスタートが必要です
    - OpenClawに新しいチャネル、プロバイダ、ツール、またはその他の機能を追加している
sidebarTitle: Getting Started
summary: 数分で最初のOpenClaw Pluginを作成する
title: Pluginの作成
x-i18n:
    generated_at: "2026-04-24T05:09:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: c14f4c4dc3ae853e385f6beeb9529ea9e360f3d9c5b99dc717cf0851ed02cbc8
    source_path: plugins/building-plugins.md
    workflow: 15
---

Pluginは、新しい機能をOpenClawに追加します: チャネル、モデルプロバイダ、
音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像生成、
動画生成、Web fetch、Web search、エージェントツール、またはそれらの任意の組み合わせです。

PluginをOpenClawリポジトリに追加する必要はありません。
[ClawHub](/ja-JP/tools/clawhub) またはnpmに公開し、ユーザーは
`openclaw plugins install <package-name>` でインストールします。OpenClawはまずClawHubを試し、自動的にnpmへフォールバックします。

## 前提条件

- Node >= 22 とパッケージマネージャ（npm または pnpm）
- TypeScript（ESM）への習熟
- リポジトリ内Pluginの場合: リポジトリをclone済みで、`pnpm install` 済み

## どの種類のPluginか？

<CardGroup cols={3}>
  <Card title="チャネルPlugin" icon="messages-square" href="/ja-JP/plugins/sdk-channel-plugins">
    OpenClawをメッセージングプラットフォーム（Discord、IRC など）に接続する
  </Card>
  <Card title="プロバイダPlugin" icon="cpu" href="/ja-JP/plugins/sdk-provider-plugins">
    モデルプロバイダ（LLM、proxy、またはカスタムendpoint）を追加する
  </Card>
  <Card title="ツール / フックPlugin" icon="wrench">
    エージェントツール、イベントフック、またはサービスを登録する — 以下へ進む
  </Card>
</CardGroup>

オンボーディング/セットアップ実行時に必ずインストールされているとは限らないチャネルPluginには、
`openclaw/plugin-sdk/channel-setup` の
`createOptionalChannelSetupSurface(...)` を使ってください。これは、インストール要件を通知し、Pluginがインストールされるまで実際の設定書き込み時にはフェイルクローズドになるsetup adapter + wizardの組を生成します。

## クイックスタート: ツールPlugin

この手順では、エージェントツールを登録する最小限のPluginを作成します。チャネルPluginとプロバイダPluginには、上にリンクした専用ガイドがあります。

<Steps>
  <Step title="パッケージとmanifestを作成する">
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
      "description": "Adds a custom tool to OpenClaw",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    設定がなくても、すべてのPluginにはmanifestが必要です。完全なschemaについては
    [Manifest](/ja-JP/plugins/manifest) を参照してください。正式なClawHub公開用snippetは
    `docs/snippets/plugin-publish/` にあります。

  </Step>

  <Step title="エントリポイントを書く">

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

    `definePluginEntry` は非チャネルPlugin用です。チャネルには
    `defineChannelPluginEntry` を使います — [チャネルPlugin](/ja-JP/plugins/sdk-channel-plugins) を参照してください。
    完全なエントリポイントオプションについては [Entry Points](/ja-JP/plugins/sdk-entrypoints) を参照してください。

  </Step>

  <Step title="テストして公開する">

    **外部Plugin:** ClawHubで検証して公開し、その後インストールします:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClawは、`@myorg/openclaw-my-plugin` のようなプレフィックスなしpackage specに対しても、
    npmより先にClawHubを確認します。

    **リポジトリ内Plugin:** バンドル済みPlugin workspace tree配下に置きます — 自動検出されます。

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin capabilities

単一のPluginは、`api` オブジェクト経由で任意の数のcapabilityを登録できます:

| Capability | 登録メソッド | 詳細ガイド |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| テキスト推論（LLM） | `api.registerProvider(...)`                      | [プロバイダPlugin](/ja-JP/plugins/sdk-provider-plugins) |
| CLI推論バックエンド | `api.registerCliBackend(...)`                    | [CLIバックエンド](/ja-JP/gateway/cli-backends) |
| チャネル / メッセージング | `api.registerChannel(...)`                       | [チャネルPlugin](/ja-JP/plugins/sdk-channel-plugins) |
| 音声（TTS/STT） | `api.registerSpeechProvider(...)`                | [プロバイダPlugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| リアルタイム文字起こし | `api.registerRealtimeTranscriptionProvider(...)` | [プロバイダPlugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| リアルタイム音声 | `api.registerRealtimeVoiceProvider(...)`         | [プロバイダPlugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| メディア理解 | `api.registerMediaUnderstandingProvider(...)`    | [プロバイダPlugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 画像生成 | `api.registerImageGenerationProvider(...)`       | [プロバイダPlugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 音楽生成 | `api.registerMusicGenerationProvider(...)`       | [プロバイダPlugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 動画生成 | `api.registerVideoGenerationProvider(...)`       | [プロバイダPlugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web fetch | `api.registerWebFetchProvider(...)`              | [プロバイダPlugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web search | `api.registerWebSearchProvider(...)`             | [プロバイダPlugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Embedded Pi拡張 | `api.registerEmbeddedExtensionFactory(...)`      | [SDK概要](/ja-JP/plugins/sdk-overview#registration-api) |
| エージェントツール | `api.registerTool(...)`                          | 下記 |
| カスタムコマンド | `api.registerCommand(...)`                       | [Entry Points](/ja-JP/plugins/sdk-entrypoints) |
| イベントフック | `api.registerHook(...)`                          | [Entry Points](/ja-JP/plugins/sdk-entrypoints) |
| HTTPルート | `api.registerHttpRoute(...)`                     | [Internals](/ja-JP/plugins/architecture-internals#gateway-http-routes) |
| CLIサブコマンド | `api.registerCli(...)`                           | [Entry Points](/ja-JP/plugins/sdk-entrypoints) |

完全な登録APIについては [SDK概要](/ja-JP/plugins/sdk-overview#registration-api) を参照してください。

最終的なツール結果メッセージが送出される前の、非同期な `tool_result` 書き換えのようなPiネイティブ埋め込みrunnerフックが必要な場合は、`api.registerEmbeddedExtensionFactory(...)` を使ってください。その作業にPi拡張のタイミングが不要なら、通常のOpenClaw Pluginフックを優先してください。

Pluginがカスタムgateway RPCメソッドを登録する場合は、Plugin固有のプレフィックスに置いてください。コアの管理namespace（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は予約済みであり、Pluginがより狭いscopeを要求しても、常に `operator.admin` に解決されます。

覚えておくべきフックガードのセマンティクス:

- `before_tool_call`: `{ block: true }` は終端であり、より低い優先度のハンドラを停止する。
- `before_tool_call`: `{ block: false }` は未決定として扱われる。
- `before_tool_call`: `{ requireApproval: true }` はagent実行を一時停止し、exec approval overlay、Telegramボタン、Discord interactions、または任意チャネルの `/approve` コマンドを通じてユーザー承認を求める。
- `before_install`: `{ block: true }` は終端であり、より低い優先度のハンドラを停止する。
- `before_install`: `{ block: false }` は未決定として扱われる。
- `message_sending`: `{ cancel: true }` は終端であり、より低い優先度のハンドラを停止する。
- `message_sending`: `{ cancel: false }` は未決定として扱われる。
- `message_received`: 受信スレッド/トピックルーティングが必要な場合は、型付きの `threadId` フィールドを優先する。`metadata` はチャネル固有の追加情報用に保つ。
- `message_sending`: チャネル固有のmetadataキーより、型付きの `replyToId` / `threadId` ルーティングフィールドを優先する。

`/approve` コマンドは、制限付きフォールバックでexec承認とplugin承認の両方を扱います。exec approval idが見つからない場合、OpenClawは同じidをplugin approvals経由で再試行します。Plugin approval forwardingは、設定の `approvals.plugin` で個別に構成できます。

カスタム承認処理でその同じ制限付きフォールバックケースを検出する必要があるなら、承認期限切れ文字列を手動一致させる代わりに、`openclaw/plugin-sdk/error-runtime` の `isApprovalNotFoundError` を優先してください。

詳細は [SDK概要のフック決定セマンティクス](/ja-JP/plugins/sdk-overview#hook-decision-semantics) を参照してください。

## エージェントツールの登録

ツールは、LLMが呼び出せる型付き関数です。required（常に利用可能）にもoptional（ユーザーのオプトイン）にもできます:

```typescript
register(api) {
  // Required tool — always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool — user must add to allowlist
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

ユーザーは設定でoptionalツールを有効にします:

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- ツール名はコアツールと衝突してはならない（衝突時はスキップされる）
- 副作用や追加バイナリ要件を持つツールには `optional: true` を使う
- ユーザーは、Plugin idを `tools.allow` に追加することで、そのPluginのすべてのツールを有効にできる

## import規約

常に、焦点の絞られた `openclaw/plugin-sdk/<subpath>` パスからimportしてください:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

完全なsubpathリファレンスについては [SDK概要](/ja-JP/plugins/sdk-overview) を参照してください。

Plugin内部では、内部importにはローカルbarrelファイル（`api.ts`、`runtime-api.ts`）を使ってください — 自分のPluginをそのSDKパス経由でimportしてはなりません。

プロバイダPluginでは、provider固有のヘルパーは、その継ぎ目が本当に汎用的でない限り、それらのpackage-root barrelに置いてください。現在のバンドル済み例:

- Anthropic: Claude stream wrappers と `service_tier` / beta helpers
- OpenAI: provider builders、default-model helpers、realtime providers
- OpenRouter: provider builder と onboarding/config helpers

あるヘルパーが1つのバンドル済みprovider packageの内部でしか役に立たないなら、それを `openclaw/plugin-sdk/*` へ昇格させるのではなく、そのpackage-root seamに置いてください。

一部の生成済み `openclaw/plugin-sdk/<bundled-id>` ヘルパーseamは、バンドル済みPluginの保守および互換性のために引き続き存在します。たとえば
`plugin-sdk/feishu-setup` や `plugin-sdk/zalo-setup` です。これらは、新しいサードパーティPluginのデフォルトパターンではなく、予約済みサーフェスとして扱ってください。

## 提出前チェックリスト

<Check>**package.json** に正しい `openclaw` メタデータがある</Check>
<Check>**openclaw.plugin.json** manifest が存在し、有効である</Check>
<Check>エントリポイントが `defineChannelPluginEntry` または `definePluginEntry` を使っている</Check>
<Check>すべてのimportが、焦点の絞られた `plugin-sdk/<subpath>` パスを使っている</Check>
<Check>内部importが、SDK自己importではなくローカルモジュールを使っている</Check>
<Check>テストが通る（`pnpm test -- <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` が通る（リポジトリ内Plugin）</Check>

## ベータリリーステスト

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) のGitHubリリースタグを監視し、`Watch` > `Releases` で購読してください。ベータタグは `v2026.3.N-beta.1` のような形式です。リリース告知のために、公式OpenClaw Xアカウント [@openclaw](https://x.com/openclaw) の通知も有効にできます。
2. ベータタグが現れたら、できるだけ早くそのタグに対してPluginをテストしてください。stableまでの猶予は通常数時間しかありません。
3. テスト後、`plugin-forum` Discordチャネル内の自分のPluginスレッドに、`all good` か、壊れた内容を書き込んでください。まだスレッドがなければ作成してください。
4. 何か壊れていたら、`Beta blocker: <plugin-name> - <summary>` というタイトルのissueを作成または更新し、`beta-blocker` ラベルを付けてください。そのissueリンクをスレッドに貼ってください。
5. `main` に対して `fix(<plugin-id>): beta blocker - <summary>` というタイトルのPRを開き、PRとDiscordスレッドの両方でissueをリンクしてください。コントリビューターはPRにラベルを付けられないため、このタイトルがメンテナと自動化に対するPR側のシグナルになります。PR付きのblockerはマージされます。PRがないblockerは、そのまま出荷される可能性があります。メンテナはベータテスト中にこれらのスレッドを監視しています。
6. 無言はグリーンを意味します。タイミングを逃した場合、その修正はおそらく次のサイクルに入ります。

## 次のステップ

<CardGroup cols={2}>
  <Card title="チャネルPlugin" icon="messages-square" href="/ja-JP/plugins/sdk-channel-plugins">
    メッセージングチャネルPluginを作成する
  </Card>
  <Card title="プロバイダPlugin" icon="cpu" href="/ja-JP/plugins/sdk-provider-plugins">
    モデルプロバイダPluginを作成する
  </Card>
  <Card title="SDK概要" icon="book-open" href="/ja-JP/plugins/sdk-overview">
    import mapと登録APIリファレンス
  </Card>
  <Card title="ランタイムヘルパー" icon="settings" href="/ja-JP/plugins/sdk-runtime">
    `api.runtime` 経由のTTS、search、subagent
  </Card>
  <Card title="テスト" icon="test-tubes" href="/ja-JP/plugins/sdk-testing">
    テストユーティリティとパターン
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/ja-JP/plugins/manifest">
    完全なmanifest schemaリファレンス
  </Card>
</CardGroup>

## 関連

- [Plugin Architecture](/ja-JP/plugins/architecture) — 内部アーキテクチャの詳細
- [SDK概要](/ja-JP/plugins/sdk-overview) — Plugin SDKリファレンス
- [Manifest](/ja-JP/plugins/manifest) — plugin manifest形式
- [チャネルPlugin](/ja-JP/plugins/sdk-channel-plugins) — チャネルPluginの作成
- [プロバイダPlugin](/ja-JP/plugins/sdk-provider-plugins) — プロバイダPluginの作成

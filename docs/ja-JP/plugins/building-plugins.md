---
read_when:
    - 新しいOpenClaw Pluginを作成したい
    - Plugin 開発のクイックスタートが必要です
    - OpenClaw に新しいチャネル、プロバイダー、ツール、またはその他の機能を追加しています
sidebarTitle: Getting Started
summary: 初めての OpenClaw Plugin を数分で作成
title: Pluginの構築
x-i18n:
    generated_at: "2026-05-02T20:51:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: b42170b40094f89a63b1497c08ec31e397931dd536bd6faeeb8bc3c123ae45d1
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin は OpenClaw に新しい機能を追加します。チャンネル、モデルプロバイダー、
音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像
生成、動画生成、Web 取得、Web 検索、エージェントツール、または任意の
組み合わせを追加できます。

Plugin を OpenClaw リポジトリに追加する必要はありません。
[ClawHub](/ja-JP/tools/clawhub) に公開すると、ユーザーは
`openclaw plugins install clawhub:<package-name>` でインストールできます。起動移行期間中は、裸のパッケージ指定も
npm からインストールされます。

## 前提条件

- Node >= 22 とパッケージマネージャー（npm または pnpm）
- TypeScript（ESM）に慣れていること
- リポジトリ内 Plugin の場合: リポジトリをクローンし、`pnpm install` を完了していること。ソース
  チェックアウトでの Plugin 開発は pnpm のみです。OpenClaw はバンドル済み
  Plugin を `extensions/*` ワークスペースパッケージから読み込むためです。

## どの種類の Plugin か？

<CardGroup cols={3}>
  <Card title="Channel plugin" icon="messages-square" href="/ja-JP/plugins/sdk-channel-plugins">
    OpenClaw をメッセージングプラットフォーム（Discord、IRC など）に接続する
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/ja-JP/plugins/sdk-provider-plugins">
    モデルプロバイダー（LLM、プロキシ、またはカスタムエンドポイント）を追加する
  </Card>
  <Card title="Tool / hook plugin" icon="wrench" href="/ja-JP/plugins/hooks">
    エージェントツール、イベントフック、またはサービスを登録する — 以下へ進む
  </Card>
</CardGroup>

オンボーディング/セットアップの実行時にインストールされている保証がないチャンネル Plugin では、
`openclaw/plugin-sdk/channel-setup` の
`createOptionalChannelSetupSurface(...)` を使用します。これはセットアップアダプターとウィザードのペアを生成し、
インストール要件を通知し、Plugin がインストールされるまで実際の設定書き込みを
フェイルクローズします。

## クイックスタート: ツール Plugin

このウォークスルーでは、エージェントツールを登録する最小限の Plugin を作成します。チャンネル
Plugin とプロバイダー Plugin には、上記にリンクされた専用ガイドがあります。

<Steps>
  <Step title="Create the package and manifest">
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
      "contracts": {
        "tools": ["my_tool"]
      },
      "activation": {
        "onStartup": true
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    すべての Plugin には、設定がない場合でもマニフェストが必要です。ランタイムで登録されるツールは
    `contracts.tools` に列挙する必要があります。これにより OpenClaw はすべての Plugin ランタイムを読み込まずに、所有する
    Plugin を検出できます。Plugin は
    `activation.onStartup` も意図的に宣言するべきです。この例では `true` に設定しています。完全なスキーマについては
    [マニフェスト](/ja-JP/plugins/manifest) を参照してください。正規の ClawHub
    公開スニペットは `docs/snippets/plugin-publish/` にあります。

  </Step>

  <Step title="Write the entry point">

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

    `definePluginEntry` は非チャンネル Plugin 用です。チャンネルでは
    `defineChannelPluginEntry` を使用します — [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) を参照してください。
    エントリポイントの完全なオプションについては、[Entry Points](/ja-JP/plugins/sdk-entrypoints) を参照してください。

  </Step>

  <Step title="Test and publish">

    **外部 Plugin:** ClawHub で検証して公開し、その後インストールします。

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    `@myorg/openclaw-my-plugin` のような裸のパッケージ指定は、起動移行期間中は npm から
    インストールされます。ClawHub 解決を使いたい場合は `clawhub:` を使用してください。

    **リポジトリ内 Plugin:** バンドル済み Plugin ワークスペースツリーの下に配置します — 自動的に検出されます。

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin の機能

1 つの Plugin は `api` オブジェクトを通じて任意の数の機能を登録できます。

| 機能                   | 登録メソッド                                     | 詳細ガイド                                                                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| テキスト推論（LLM）    | `api.registerProvider(...)`                      | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins)                               |
| CLI 推論バックエンド   | `api.registerCliBackend(...)`                    | [CLI Backends](/ja-JP/gateway/cli-backends)                                           |
| チャンネル / メッセージング | `api.registerChannel(...)`                       | [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins)                                 |
| 音声（TTS/STT）        | `api.registerSpeechProvider(...)`                | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| リアルタイム文字起こし | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| リアルタイム音声       | `api.registerRealtimeVoiceProvider(...)`         | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| メディア理解           | `api.registerMediaUnderstandingProvider(...)`    | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 画像生成               | `api.registerImageGenerationProvider(...)`       | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 音楽生成               | `api.registerMusicGenerationProvider(...)`       | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 動画生成               | `api.registerVideoGenerationProvider(...)`       | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web 取得               | `api.registerWebFetchProvider(...)`              | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web 検索               | `api.registerWebSearchProvider(...)`             | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| ツール結果ミドルウェア | `api.registerAgentToolResultMiddleware(...)`     | [SDK Overview](/ja-JP/plugins/sdk-overview#registration-api)                          |
| エージェントツール     | `api.registerTool(...)`                          | 以下                                                                            |
| カスタムコマンド       | `api.registerCommand(...)`                       | [Entry Points](/ja-JP/plugins/sdk-entrypoints)                                        |
| Plugin フック          | `api.on(...)`                                    | [Plugin hooks](/ja-JP/plugins/hooks)                                                  |
| 内部イベントフック     | `api.registerHook(...)`                          | [Entry Points](/ja-JP/plugins/sdk-entrypoints)                                        |
| HTTP ルート            | `api.registerHttpRoute(...)`                     | [Internals](/ja-JP/plugins/architecture-internals#gateway-http-routes)                |
| CLI サブコマンド       | `api.registerCli(...)`                           | [Entry Points](/ja-JP/plugins/sdk-entrypoints)                                        |

完全な登録 API については、[SDK Overview](/ja-JP/plugins/sdk-overview#registration-api) を参照してください。

バンドル済み Plugin は、モデルが出力を見る前に非同期のツール結果書き換えが必要な場合に
`api.registerAgentToolResultMiddleware(...)` を使用できます。
対象ランタイムを `contracts.agentToolResultMiddleware` に宣言します。例:
`["pi", "codex"]`。これは信頼されたバンドル済み Plugin のための接点です。外部
Plugin は、この機能について OpenClaw が明示的な信頼ポリシーを拡張しない限り、通常の OpenClaw Plugin フックを優先してください。

Plugin がカスタム Gateway RPC メソッドを登録する場合は、
Plugin 固有のプレフィックスに維持してください。コア管理名前空間（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）は予約されたままで、Plugin がより狭いスコープを要求した場合でも常に
`operator.admin` に解決されます。

覚えておくべきフックガードのセマンティクス:

- `before_tool_call`: `{ block: true }` は終端であり、優先度の低いハンドラーを停止します。
- `before_tool_call`: `{ block: false }` は判断なしとして扱われます。
- `before_tool_call`: `{ requireApproval: true }` はエージェント実行を一時停止し、exec 承認オーバーレイ、Telegram ボタン、Discord インタラクション、または任意のチャンネルの `/approve` コマンドを通じてユーザーに承認を求めます。
- `before_install`: `{ block: true }` は終端であり、優先度の低いハンドラーを停止します。
- `before_install`: `{ block: false }` は判断なしとして扱われます。
- `message_sending`: `{ cancel: true }` は終端であり、優先度の低いハンドラーを停止します。
- `message_sending`: `{ cancel: false }` は判断なしとして扱われます。
- `message_received`: 受信スレッド/トピックのルーティングが必要な場合は、型付きの `threadId` フィールドを優先してください。チャンネル固有の追加情報には `metadata` を維持してください。
- `message_sending`: チャンネル固有のメタデータキーよりも、型付きの `replyToId` / `threadId` ルーティングフィールドを優先してください。

`/approve` コマンドは、境界付きフォールバックで exec と Plugin の承認の両方を処理します。exec 承認 ID が見つからない場合、OpenClaw は同じ ID を Plugin 承認で再試行します。Plugin 承認の転送は、設定内の `approvals.plugin` で個別に構成できます。

カスタム承認の配管で同じ境界付きフォールバックケースを検出する必要がある場合は、
承認期限切れ文字列を手動で照合するのではなく、`openclaw/plugin-sdk/error-runtime` の
`isApprovalNotFoundError` を優先してください。

例とフックリファレンスについては、[Plugin hooks](/ja-JP/plugins/hooks) を参照してください。

## エージェントツールの登録

ツールは LLM が呼び出せる型付き関数です。必須（常に
利用可能）または任意（ユーザーのオプトイン）にできます。

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

`api.registerTool(...)` で登録されたすべてのツールは、
Plugin マニフェストにも宣言する必要があります。

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  }
}
```

OpenClaw は登録されたツールから検証済みディスクリプターを取得してキャッシュするため、
Plugin はマニフェスト内で `description` やスキーマデータを重複させません。
マニフェスト契約は所有権と検出のみを宣言します。実行は引き続き
ライブ登録されたツール実装を呼び出します。

ユーザーは設定で任意ツールを有効にします。

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- ツール名はコアツールと衝突してはいけません（衝突するものはスキップされます）
- `parameters` が欠落しているものを含め、登録オブジェクトの形式が不正なツールはスキップされ、エージェント実行を壊す代わりにPlugin診断で報告されます
- 副作用があるツールや追加のバイナリ要件があるツールには `optional: true` を使用します
- ユーザーはPlugin IDを `tools.allow` に追加することで、そのPluginのすべてのツールを有効にできます

## CLIコマンドの登録

Pluginは `api.registerCli` でルート `openclaw` コマンドグループを追加できます。最上位の各コマンドルートに
`descriptors` を指定すると、OpenClaw はすべてのPluginランタイムを即時ロードせずに
コマンドを表示してルーティングできます。

```typescript
register(api) {
  api.registerCli(
    ({ program }) => {
      const demo = program
        .command("demo-plugin")
        .description("Run demo plugin commands");

      demo
        .command("ping")
        .description("Check that the plugin CLI is executable")
        .action(() => {
          console.log("demo-plugin:pong");
        });
    },
    {
      descriptors: [
        {
          name: "demo-plugin",
          description: "Run demo plugin commands",
          hasSubcommands: true,
        },
      ],
    },
  );
}
```

インストール後、ランタイム登録を確認してコマンドを実行します。

```bash
openclaw plugins inspect demo-plugin --runtime --json
openclaw demo-plugin ping
```

## インポート規約

常に対象を絞った `openclaw/plugin-sdk/<subpath>` パスからインポートします。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

サブパスの完全なリファレンスについては、[SDK概要](/ja-JP/plugins/sdk-overview) を参照してください。

Plugin内では、内部インポートにローカルのバレルファイル（`api.ts`、`runtime-api.ts`）を使用します。自分のPluginをSDKパス経由でインポートしてはいけません。

プロバイダーPluginでは、その境界が本当に汎用的でない限り、プロバイダー固有のヘルパーをパッケージルートのバレルに置きます。現在のバンドル例は次のとおりです。

- Anthropic: Claudeストリームラッパーと `service_tier` / ベータヘルパー
- OpenAI: プロバイダービルダー、デフォルトモデルヘルパー、リアルタイムプロバイダー
- OpenRouter: プロバイダービルダーとオンボーディング/設定ヘルパー

ヘルパーが1つのバンドルプロバイダーパッケージ内でしか有用でない場合は、`openclaw/plugin-sdk/*` に昇格させず、そのパッケージルートの境界に置いてください。

一部の生成済み `openclaw/plugin-sdk/<bundled-id>` ヘルパー境界は、所有者による利用が追跡されている場合のバンドルPlugin保守用にまだ存在します。これらは予約済みのサーフェスとして扱い、新しいサードパーティPluginのデフォルトパターンとは見なさないでください。

## 送信前チェックリスト

<Check>**package.json** に正しい `openclaw` メタデータがある</Check>
<Check>**openclaw.plugin.json** マニフェストが存在し、有効である</Check>
<Check>エントリーポイントが `defineChannelPluginEntry` または `definePluginEntry` を使用している</Check>
<Check>すべてのインポートが対象を絞った `plugin-sdk/<subpath>` パスを使用している</Check>
<Check>内部インポートがSDKの自己インポートではなくローカルモジュールを使用している</Check>
<Check>テストが通過する（`pnpm test -- <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` が通過する（リポジトリ内Plugin）</Check>

## ベータリリースのテスト

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) のGitHubリリースタグを監視し、`Watch` > `Releases` で購読します。ベータタグは `v2026.3.N-beta.1` のような形式です。リリース告知を受け取るために、公式OpenClaw Xアカウント [@openclaw](https://x.com/openclaw) の通知を有効にすることもできます。
2. ベータタグが表示されたら、すぐにそのタグに対してPluginをテストします。安定版までの猶予は通常数時間しかありません。
3. テスト後、`plugin-forum` Discordチャンネル内の自分のPluginスレッドに、`all good` または壊れた内容を投稿します。まだスレッドがない場合は作成してください。
4. 何かが壊れた場合は、`Beta blocker: <plugin-name> - <summary>` というタイトルのIssueを作成または更新し、`beta-blocker` ラベルを適用します。スレッドにIssueリンクを貼ります。
5. `main` に対して `fix(<plugin-id>): beta blocker - <summary>` というタイトルのPRを開き、PRとDiscordスレッドの両方でIssueをリンクします。コントリビューターはPRにラベルを付けられないため、タイトルがメンテナーと自動化向けのPR側シグナルになります。PRがあるブロッカーはマージされますが、PRがないブロッカーはそのまま出荷される可能性があります。メンテナーはベータテスト中にこれらのスレッドを監視します。
6. 沈黙は問題なしを意味します。期間を逃した場合、修正はおそらく次のサイクルに入ります。

## 次のステップ

<CardGroup cols={2}>
  <Card title="チャンネルPlugin" icon="messages-square" href="/ja-JP/plugins/sdk-channel-plugins">
    メッセージングチャンネルPluginを構築する
  </Card>
  <Card title="プロバイダーPlugin" icon="cpu" href="/ja-JP/plugins/sdk-provider-plugins">
    モデルプロバイダーPluginを構築する
  </Card>
  <Card title="SDK概要" icon="book-open" href="/ja-JP/plugins/sdk-overview">
    インポートマップと登録APIのリファレンス
  </Card>
  <Card title="ランタイムヘルパー" icon="settings" href="/ja-JP/plugins/sdk-runtime">
    api.runtime経由のTTS、検索、サブエージェント
  </Card>
  <Card title="テスト" icon="test-tubes" href="/ja-JP/plugins/sdk-testing">
    テストユーティリティとパターン
  </Card>
  <Card title="Pluginマニフェスト" icon="file-json" href="/ja-JP/plugins/manifest">
    完全なマニフェストスキーマリファレンス
  </Card>
</CardGroup>

## 関連

- [Pluginアーキテクチャ](/ja-JP/plugins/architecture) — 内部アーキテクチャの詳細
- [SDK概要](/ja-JP/plugins/sdk-overview) — Plugin SDKリファレンス
- [マニフェスト](/ja-JP/plugins/manifest) — Pluginマニフェスト形式
- [チャンネルPlugin](/ja-JP/plugins/sdk-channel-plugins) — チャンネルPluginの構築
- [プロバイダーPlugin](/ja-JP/plugins/sdk-provider-plugins) — プロバイダーPluginの構築

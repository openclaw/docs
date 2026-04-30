---
read_when:
    - 新しい OpenClaw Plugin を作成したい
    - Plugin 開発にはクイックスタートが必要です
    - OpenClaw に新しいチャネル、プロバイダー、ツール、またはその他の機能を追加している場合
sidebarTitle: Getting Started
summary: 数分で初めてのOpenClaw Pluginを作成する
title: Pluginの構築
x-i18n:
    generated_at: "2026-04-30T05:24:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321f8870d0ce3be8dece21b07815eda6859dcb00941d9181d913b95f3d74d230
    source_path: plugins/building-plugins.md
    workflow: 16
---

PluginsはOpenClawに新しい機能を追加します。チャンネル、モデルプロバイダー、
音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像
生成、動画生成、Web取得、Web検索、エージェントツール、またはそれらの任意の
組み合わせです。

PluginをOpenClawリポジトリに追加する必要はありません。
[ClawHub](/ja-JP/tools/clawhub)に公開すると、ユーザーは
`openclaw plugins install <package-name>`でインストールできます。OpenClawはまずClawHubを試し、
まだnpm配布を使っているパッケージについては自動的にnpmへフォールバックします。

## 前提条件

- Node >= 22 とパッケージマネージャー（npmまたはpnpm）
- TypeScript（ESM）への理解
- リポジトリ内Pluginの場合: リポジトリをクローン済みで、`pnpm install`が完了していること

## どの種類のPluginか？

<CardGroup cols={3}>
  <Card title="Channel plugin" icon="messages-square" href="/ja-JP/plugins/sdk-channel-plugins">
    OpenClawをメッセージングプラットフォーム（Discord、IRCなど）に接続します
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/ja-JP/plugins/sdk-provider-plugins">
    モデルプロバイダー（LLM、プロキシ、またはカスタムエンドポイント）を追加します
  </Card>
  <Card title="Tool / hook plugin" icon="wrench" href="/ja-JP/plugins/hooks">
    エージェントツール、イベントフック、またはサービスを登録します — 以下に続きます
  </Card>
</CardGroup>

オンボーディング/セットアップの実行時にインストールされていることが保証されないチャンネルPluginでは、
`openclaw/plugin-sdk/channel-setup`の`createOptionalChannelSetupSurface(...)`を使用します。
これは、インストール要件を通知し、Pluginがインストールされるまで実際の設定書き込みを
安全側で失敗させるセットアップアダプター + ウィザードのペアを生成します。

## クイックスタート: ツールPlugin

このウォークスルーでは、エージェントツールを登録する最小限のPluginを作成します。チャンネル
PluginとプロバイダーPluginには、上でリンクした専用ガイドがあります。

<Steps>
  <Step title="パッケージとマニフェストを作成する">
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

    設定がない場合でも、すべてのPluginにはマニフェストが必要です。また、すべてのPluginは
    `activation.onStartup`を意図的に宣言する必要があります。ランタイム登録ツールには
    起動時のインポートが必要なため、この例では`true`に設定しています。完全なスキーマについては
    [Manifest](/ja-JP/plugins/manifest)を参照してください。正規のClawHub
    公開スニペットは`docs/snippets/plugin-publish/`にあります。

  </Step>

  <Step title="エントリーポイントを書く">

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

    `definePluginEntry`は非チャンネルPlugin向けです。チャンネルでは
    `defineChannelPluginEntry`を使用します — [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins)を参照してください。
    エントリーポイントのすべてのオプションについては、[Entry Points](/ja-JP/plugins/sdk-entrypoints)を参照してください。

  </Step>

  <Step title="テストして公開する">

    **外部Plugin:** ClawHubで検証して公開し、その後インストールします。

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClawは`@myorg/openclaw-my-plugin`のような素のパッケージ指定についてもnpmより前にClawHubを確認します。
    npmは、まだClawHubへ移行していないパッケージ向けのフォールバックとして残ります。

    **リポジトリ内Plugin:** バンドル済みPluginワークスペースツリーの下に配置します — 自動的に検出されます。

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Pluginの機能

単一のPluginは`api`オブジェクトを介して任意の数の機能を登録できます。

| 機能                   | 登録メソッド                                     | 詳細ガイド                                                                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| テキスト推論（LLM）    | `api.registerProvider(...)`                      | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins)                               |
| CLI推論バックエンド    | `api.registerCliBackend(...)`                    | [CLI Backends](/ja-JP/gateway/cli-backends)                                           |
| チャンネル/メッセージング | `api.registerChannel(...)`                    | [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins)                                 |
| 音声（TTS/STT）        | `api.registerSpeechProvider(...)`                | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| リアルタイム文字起こし | `api.registerRealtimeTranscriptionProvider(...)` | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| リアルタイム音声       | `api.registerRealtimeVoiceProvider(...)`         | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| メディア理解           | `api.registerMediaUnderstandingProvider(...)`    | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 画像生成               | `api.registerImageGenerationProvider(...)`       | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 音楽生成               | `api.registerMusicGenerationProvider(...)`       | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 動画生成               | `api.registerVideoGenerationProvider(...)`       | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web取得                | `api.registerWebFetchProvider(...)`              | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web検索                | `api.registerWebSearchProvider(...)`             | [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| ツール結果ミドルウェア | `api.registerAgentToolResultMiddleware(...)`     | [SDK Overview](/ja-JP/plugins/sdk-overview#registration-api)                          |
| エージェントツール     | `api.registerTool(...)`                          | 下記                                                                            |
| カスタムコマンド       | `api.registerCommand(...)`                       | [Entry Points](/ja-JP/plugins/sdk-entrypoints)                                        |
| Pluginフック           | `api.on(...)`                                    | [Plugin hooks](/ja-JP/plugins/hooks)                                                  |
| 内部イベントフック     | `api.registerHook(...)`                          | [Entry Points](/ja-JP/plugins/sdk-entrypoints)                                        |
| HTTPルート             | `api.registerHttpRoute(...)`                     | [Internals](/ja-JP/plugins/architecture-internals#gateway-http-routes)                |
| CLIサブコマンド        | `api.registerCli(...)`                           | [Entry Points](/ja-JP/plugins/sdk-entrypoints)                                        |

完全な登録APIについては、[SDK Overview](/ja-JP/plugins/sdk-overview#registration-api)を参照してください。

バンドル済みPluginは、モデルが出力を見る前に非同期でツール結果を書き換える必要がある場合に
`api.registerAgentToolResultMiddleware(...)`を使用できます。対象ランタイムを
`contracts.agentToolResultMiddleware`で宣言します。例:
`["pi", "codex"]`。これは信頼されたバンドル済みPlugin向けの接点です。外部
Pluginは、OpenClawがこの機能の明示的な信頼ポリシーを追加しない限り、通常のOpenClaw Pluginフックを優先してください。

PluginがカスタムGateway RPCメソッドを登録する場合は、Plugin固有のプレフィックスに置いてください。
コア管理名前空間（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）は予約されたままで、Pluginがより狭いスコープを要求しても
常に`operator.admin`に解決されます。

覚えておくべきフックガードのセマンティクス:

- `before_tool_call`: `{ block: true }`は終端であり、優先度の低いハンドラーを停止します。
- `before_tool_call`: `{ block: false }`は判断なしとして扱われます。
- `before_tool_call`: `{ requireApproval: true }`はエージェント実行を一時停止し、exec承認オーバーレイ、Telegramボタン、Discordインタラクション、または任意のチャンネルの`/approve`コマンドを介してユーザーに承認を求めます。
- `before_install`: `{ block: true }`は終端であり、優先度の低いハンドラーを停止します。
- `before_install`: `{ block: false }`は判断なしとして扱われます。
- `message_sending`: `{ cancel: true }`は終端であり、優先度の低いハンドラーを停止します。
- `message_sending`: `{ cancel: false }`は判断なしとして扱われます。
- `message_received`: 受信スレッド/トピックのルーティングが必要な場合は、型付きの`threadId`フィールドを優先してください。`metadata`はチャンネル固有の追加情報用に残します。
- `message_sending`: チャンネル固有のメタデータキーよりも、型付きの`replyToId` / `threadId`ルーティングフィールドを優先してください。

`/approve`コマンドは、限定されたフォールバックでexec承認とPlugin承認の両方を処理します。exec承認IDが見つからない場合、OpenClawは同じIDでPlugin承認を再試行します。Plugin承認の転送は、設定内の`approvals.plugin`で独立して構成できます。

カスタム承認の配管で同じ限定フォールバックケースを検出する必要がある場合は、
承認期限切れ文字列を手動で照合するのではなく、`openclaw/plugin-sdk/error-runtime`の
`isApprovalNotFoundError`を優先してください。

例とフックリファレンスについては、[Plugin hooks](/ja-JP/plugins/hooks)を参照してください。

## エージェントツールの登録

ツールはLLMが呼び出せる型付き関数です。必須（常に
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

ユーザーは設定で任意ツールを有効化します。

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- ツール名はコアツールと衝突してはいけません（競合はスキップされます）
- `parameters`の欠落を含む不正な登録オブジェクトを持つツールは、エージェント実行を壊すのではなく、スキップされてPlugin診断に報告されます
- 副作用や追加のバイナリ要件があるツールには`optional: true`を使用します
- ユーザーはPlugin IDを`tools.allow`に追加することで、そのPluginのすべてのツールを有効化できます

## インポート規約

常に焦点を絞った`openclaw/plugin-sdk/<subpath>`パスからインポートします。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

完全なサブパスのリファレンスについては、[SDK Overview](/ja-JP/plugins/sdk-overview) を参照してください。

Plugin 内では、内部インポートにローカルのバレルファイル (`api.ts`, `runtime-api.ts`) を使用します。自分の Plugin をその SDK パス経由でインポートしないでください。

プロバイダー Plugin では、その継ぎ目が本当に汎用でない限り、プロバイダー固有のヘルパーをそれらのパッケージルートのバレルに保持してください。現在のバンドル例:

- Anthropic: Claude ストリームラッパーと `service_tier` / beta ヘルパー
- OpenAI: プロバイダービルダー、デフォルトモデルヘルパー、リアルタイムプロバイダー
- OpenRouter: プロバイダービルダーとオンボーディング/設定ヘルパー

ヘルパーが 1 つのバンドル済みプロバイダーパッケージ内でしか役に立たない場合は、それを `openclaw/plugin-sdk/*` に昇格させるのではなく、そのパッケージルートの継ぎ目に保持してください。

一部の生成済み `openclaw/plugin-sdk/<bundled-id>` ヘルパー継ぎ目は、所有者による使用が追跡されている場合に、バンドル済み Plugin のメンテナンス用としてまだ存在します。これらは予約済みのサーフェスとして扱い、新しいサードパーティ Plugin のデフォルトパターンとは見なさないでください。

## 送信前チェックリスト

<Check>**package.json** に正しい `openclaw` メタデータがある</Check>
<Check>**openclaw.plugin.json** マニフェストが存在し、有効である</Check>
<Check>エントリポイントが `defineChannelPluginEntry` または `definePluginEntry` を使用している</Check>
<Check>すべてのインポートが焦点を絞った `plugin-sdk/<subpath>` パスを使用している</Check>
<Check>内部インポートが SDK 自己インポートではなく、ローカルモジュールを使用している</Check>
<Check>テストが通る (`pnpm test -- <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` が通る (リポジトリ内 Plugin)</Check>

## ベータリリーステスト

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) の GitHub リリースタグを監視し、`Watch` > `Releases` で購読します。ベータタグは `v2026.3.N-beta.1` のような形式です。リリース告知のために、公式 OpenClaw X アカウント [@openclaw](https://x.com/openclaw) の通知を有効にすることもできます。
2. ベータタグが表示されたらすぐに、そのタグに対して Plugin をテストします。安定版までの猶予は通常、数時間しかありません。
3. テスト後、`plugin-forum` Discord チャンネルの自分の Plugin スレッドに、`all good` または壊れた内容を投稿します。まだスレッドがない場合は作成します。
4. 何かが壊れた場合は、`Beta blocker: <plugin-name> - <summary>` というタイトルの issue を開くか更新し、`beta-blocker` ラベルを適用します。issue リンクを自分のスレッドに入れてください。
5. `main` に対して、`fix(<plugin-id>): beta blocker - <summary>` というタイトルの PR を開き、PR と Discord スレッドの両方で issue をリンクします。コントリビューターは PR にラベルを付けられないため、タイトルがメンテナーと自動化に対する PR 側のシグナルになります。PR があるブロッカーはマージされます。PR がないブロッカーはそのまま出荷される可能性があります。メンテナーはベータテスト中にこれらのスレッドを監視します。
6. 沈黙はグリーンを意味します。期間を逃した場合、修正はおそらく次のサイクルに入ります。

## 次のステップ

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/ja-JP/plugins/sdk-channel-plugins">
    メッセージングチャンネル Plugin を構築する
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/ja-JP/plugins/sdk-provider-plugins">
    モデルプロバイダー Plugin を構築する
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/ja-JP/plugins/sdk-overview">
    インポートマップと登録 API リファレンス
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/ja-JP/plugins/sdk-runtime">
    api.runtime 経由の TTS、検索、サブエージェント
  </Card>
  <Card title="Testing" icon="test-tubes" href="/ja-JP/plugins/sdk-testing">
    テストユーティリティとパターン
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/ja-JP/plugins/manifest">
    完全なマニフェストスキーマリファレンス
  </Card>
</CardGroup>

## 関連

- [Plugin Architecture](/ja-JP/plugins/architecture) — 内部アーキテクチャの詳細解説
- [SDK Overview](/ja-JP/plugins/sdk-overview) — Plugin SDK リファレンス
- [Manifest](/ja-JP/plugins/manifest) — Plugin マニフェスト形式
- [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) — チャンネル Plugin の構築
- [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) — プロバイダー Plugin の構築

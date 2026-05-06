---
read_when:
    - 新しい OpenClaw Plugin を作成したい
    - Plugin 開発のクイックスタートが必要な場合
    - OpenClaw に新しいチャネル、プロバイダー、ツール、またはその他の機能を追加する場合
sidebarTitle: Getting Started
summary: 数分で初めてのOpenClaw Pluginを作成する
title: Plugin の構築
x-i18n:
    generated_at: "2026-05-06T05:13:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e9718f8226a3586db06eae6715502edbd7a286f448e24cbef0a08f19a921c3a
    source_path: plugins/building-plugins.md
    workflow: 16
---

Pluginは、チャネル、モデルプロバイダー、音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像生成、動画生成、Webフェッチ、Web検索、エージェントツール、またはそれらの任意の組み合わせといった新しい機能でOpenClawを拡張します。

PluginをOpenClawリポジトリに追加する必要はありません。[ClawHub](/ja-JP/tools/clawhub)に公開すると、ユーザーは`openclaw plugins install clawhub:<package-name>`でインストールできます。`clawhub:`を付けないパッケージ指定も、ローンチ移行期間中は引き続きnpmからインストールされます。

## 前提条件

- Node >= 22 とパッケージマネージャー（npm または pnpm）
- TypeScript（ESM）に慣れていること
- リポジトリ内Pluginの場合: リポジトリをクローンし、`pnpm install`が完了していること。ソースチェックアウトでのPlugin開発はpnpm専用です。OpenClawは`extensions/*`ワークスペースパッケージからバンドルPluginを読み込むためです。

## どの種類のPluginか?

<CardGroup cols={3}>
  <Card title="チャネルPlugin" icon="messages-square" href="/ja-JP/plugins/sdk-channel-plugins">
    OpenClawをメッセージングプラットフォーム（Discord、IRCなど）に接続します
  </Card>
  <Card title="プロバイダーPlugin" icon="cpu" href="/ja-JP/plugins/sdk-provider-plugins">
    モデルプロバイダー（LLM、プロキシ、またはカスタムエンドポイント）を追加します
  </Card>
  <Card title="ツール / フックPlugin" icon="wrench" href="/ja-JP/plugins/hooks">
    エージェントツール、イベントフック、またはサービスを登録します - 以下に続きます
  </Card>
</CardGroup>

オンボーディング/セットアップの実行時にインストールされている保証がないチャネルPluginでは、`openclaw/plugin-sdk/channel-setup`の`createOptionalChannelSetupSurface(...)`を使用します。これにより、インストール要件を通知し、Pluginがインストールされるまで実際の設定書き込みをフェイルクローズするセットアップアダプター + ウィザードのペアが生成されます。

## クイックスタート: ツールPlugin

このチュートリアルでは、エージェントツールを登録する最小限のPluginを作成します。チャネルPluginとプロバイダーPluginには、上記でリンクした専用ガイドがあります。

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

    設定がない場合でも、すべてのPluginにはマニフェストが必要です。実行時に登録されるツールは、OpenClawがすべてのPluginランタイムを読み込まずに所有Pluginを検出できるように、`contracts.tools`に列挙する必要があります。またPluginは、`activation.onStartup`を意図的に宣言する必要があります。この例では`true`に設定しています。完全なスキーマについては[マニフェスト](/ja-JP/plugins/manifest)を参照してください。正規のClawHub公開スニペットは`docs/snippets/plugin-publish/`にあります。

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

    `definePluginEntry`は、チャネル以外のPlugin用です。チャネルでは`defineChannelPluginEntry`を使用します - [チャネルPlugin](/ja-JP/plugins/sdk-channel-plugins)を参照してください。エントリーポイントの全オプションについては、[エントリーポイント](/ja-JP/plugins/sdk-entrypoints)を参照してください。

  </Step>

  <Step title="テストして公開する">

    **外部Plugin:** ClawHubで検証して公開し、その後インストールします:

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    `@myorg/openclaw-my-plugin`のような`clawhub:`を付けないパッケージ指定は、ローンチ移行期間中はnpmからインストールされます。ClawHubの解決を使いたい場合は`clawhub:`を使用してください。

    **リポジトリ内Plugin:** バンドルPluginのワークスペースツリー配下に配置します - 自動的に検出されます。

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Pluginの機能

単一のPluginは、`api`オブジェクトを通じて任意の数の機能を登録できます:

| 機能                   | 登録メソッド                                     | 詳細ガイド                                                                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| テキスト推論（LLM）    | `api.registerProvider(...)`                      | [プロバイダーPlugin](/ja-JP/plugins/sdk-provider-plugins)                             |
| CLI推論バックエンド    | `api.registerCliBackend(...)`                    | [CLIバックエンド](/ja-JP/gateway/cli-backends)                                        |
| チャネル / メッセージング | `api.registerChannel(...)`                       | [チャネルPlugin](/ja-JP/plugins/sdk-channel-plugins)                                  |
| 音声（TTS/STT）        | `api.registerSpeechProvider(...)`                | [プロバイダーPlugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| リアルタイム文字起こし | `api.registerRealtimeTranscriptionProvider(...)` | [プロバイダーPlugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| リアルタイム音声       | `api.registerRealtimeVoiceProvider(...)`         | [プロバイダーPlugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| メディア理解           | `api.registerMediaUnderstandingProvider(...)`    | [プロバイダーPlugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 画像生成               | `api.registerImageGenerationProvider(...)`       | [プロバイダーPlugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 音楽生成               | `api.registerMusicGenerationProvider(...)`       | [プロバイダーPlugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 動画生成               | `api.registerVideoGenerationProvider(...)`       | [プロバイダーPlugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Webフェッチ            | `api.registerWebFetchProvider(...)`              | [プロバイダーPlugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web検索                | `api.registerWebSearchProvider(...)`             | [プロバイダーPlugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| ツール結果ミドルウェア | `api.registerAgentToolResultMiddleware(...)`     | [SDK概要](/ja-JP/plugins/sdk-overview#registration-api)                               |
| エージェントツール     | `api.registerTool(...)`                          | 下記                                                                            |
| カスタムコマンド       | `api.registerCommand(...)`                       | [エントリーポイント](/ja-JP/plugins/sdk-entrypoints)                                  |
| Pluginフック           | `api.on(...)`                                    | [Pluginフック](/ja-JP/plugins/hooks)                                                  |
| 内部イベントフック     | `api.registerHook(...)`                          | [エントリーポイント](/ja-JP/plugins/sdk-entrypoints)                                  |
| HTTPルート             | `api.registerHttpRoute(...)`                     | [内部構造](/ja-JP/plugins/architecture-internals#gateway-http-routes)                 |
| CLIサブコマンド        | `api.registerCli(...)`                           | [エントリーポイント](/ja-JP/plugins/sdk-entrypoints)                                  |

完全な登録APIについては、[SDK概要](/ja-JP/plugins/sdk-overview#registration-api)を参照してください。

バンドルPluginは、モデルが出力を見る前に非同期のツール結果書き換えが必要な場合、`api.registerAgentToolResultMiddleware(...)`を使用できます。対象ランタイムを`contracts.agentToolResultMiddleware`に宣言してください。例: `["pi", "codex"]`。これは信頼済みバンドルPlugin用の接続点です。OpenClawがこの機能に対する明示的な信頼ポリシーを持つまでは、外部Pluginは通常のOpenClaw Pluginフックを優先してください。

PluginがカスタムGateway RPCメソッドを登録する場合は、Plugin固有のプレフィックス上に保持してください。コア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は予約されたままであり、Pluginがより狭いスコープを要求しても常に`operator.admin`に解決されます。

念頭に置くべきフックガードのセマンティクス:

- `before_tool_call`: `{ block: true }`は終端扱いで、優先度の低いハンドラーを停止します。
- `before_tool_call`: `{ block: false }`は判断なしとして扱われます。
- `before_tool_call`: `{ requireApproval: true }`はエージェント実行を一時停止し、exec承認オーバーレイ、Telegramボタン、Discordインタラクション、または任意のチャネル上の`/approve`コマンドを通じてユーザーに承認を求めます。
- `before_install`: `{ block: true }`は終端扱いで、優先度の低いハンドラーを停止します。
- `before_install`: `{ block: false }`は判断なしとして扱われます。
- `message_sending`: `{ cancel: true }`は終端扱いで、優先度の低いハンドラーを停止します。
- `message_sending`: `{ cancel: false }`は判断なしとして扱われます。
- `message_received`: インバウンドのスレッド/トピックルーティングが必要な場合は、型付きの`threadId`フィールドを優先してください。`metadata`はチャネル固有の追加情報用に保持します。
- `message_sending`: チャネル固有のメタデータキーよりも、型付きの`replyToId` / `threadId`ルーティングフィールドを優先してください。

`/approve`コマンドは、exec承認とPlugin承認の両方を、範囲を限定したフォールバックで処理します。exec承認IDが見つからない場合、OpenClawは同じIDでPlugin承認を再試行します。Plugin承認の転送は、設定内の`approvals.plugin`で独立して設定できます。

カスタム承認処理で同じ範囲限定フォールバックケースを検出する必要がある場合は、承認期限切れ文字列を手動で照合するのではなく、`openclaw/plugin-sdk/error-runtime`の`isApprovalNotFoundError`を優先してください。

例とフックリファレンスについては、[Pluginフック](/ja-JP/plugins/hooks)を参照してください。

## エージェントツールの登録

ツールはLLMが呼び出せる型付き関数です。必須（常に利用可能）または任意（ユーザーのオプトイン）にできます:

```typescript
register(api) {
  // Required tool - always available
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // Optional tool - user must add to allowlist
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

`api.registerTool(...)`で登録されるすべてのツールは、Pluginマニフェストでも宣言する必要があります:

```json
{
  "contracts": {
    "tools": ["my_tool", "workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

OpenClaw は登録されたツールから検証済みのディスクリプターを取得してキャッシュするため、
Plugin はマニフェスト内で `description` やスキーマデータを重複して持つ必要がありません。
マニフェスト契約は所有権と検出だけを宣言します。実行時は引き続き
ライブ登録済みツール実装を呼び出します。
`api.registerTool(..., { optional: true })` で登録されたツールには
`toolMetadata.<tool>.optional: true` を設定してください。これにより OpenClaw は、
そのツールが明示的に allowlist されるまで、その Plugin ランタイムの読み込みを回避できます。

ユーザーは設定で任意ツールを有効にします。

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- ツール名はコアツールと衝突してはいけません（衝突はスキップされます）
- `parameters` の欠落を含む、不正な登録オブジェクトを持つツールは、エージェント実行を壊す代わりにスキップされ、Plugin 診断で報告されます
- 副作用や追加のバイナリ要件があるツールには `optional: true` を使用します
- ユーザーは Plugin ID を `tools.allow` に追加することで、その Plugin のすべてのツールを有効にできます

## CLI コマンドの登録

Plugin は `api.registerCli` を使って、ルートの `openclaw` コマンドグループを追加できます。OpenClaw がすべての Plugin ランタイムを積極的に読み込まずにコマンドを表示してルーティングできるように、各トップレベルコマンドルートに
`descriptors` を指定してください。

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

インストール後、ランタイム登録を検証し、コマンドを実行します。

```bash
openclaw plugins inspect demo-plugin --runtime --json
openclaw demo-plugin ping
```

## インポート規約

常に焦点を絞った `openclaw/plugin-sdk/<subpath>` パスからインポートしてください。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

完全なサブパス参照については、[SDK 概要](/ja-JP/plugins/sdk-overview)を参照してください。

自分の Plugin 内では、内部インポートにローカルのバレルファイル（`api.ts`、`runtime-api.ts`）を使用してください。SDK パス経由で自分自身の Plugin をインポートしてはいけません。

プロバイダー Plugin では、その境界が本当に汎用的でない限り、プロバイダー固有のヘルパーをパッケージルートのバレル内に置いてください。現在のバンドル済みの例は次のとおりです。

- Anthropic: Claude ストリームラッパーと `service_tier` / ベータヘルパー
- OpenAI: プロバイダービルダー、デフォルトモデルヘルパー、リアルタイムプロバイダー
- OpenRouter: プロバイダービルダーとオンボーディング/設定ヘルパー

ヘルパーが 1 つのバンドル済みプロバイダーパッケージ内でしか有用でない場合は、`openclaw/plugin-sdk/*` に昇格するのではなく、そのパッケージルート境界に置いてください。

生成済みの `openclaw/plugin-sdk/<bundled-id>` ヘルパー境界の一部は、所有者の使用実績が追跡されている場合に、バンドル済み Plugin のメンテナンス用としてまだ存在します。これらは予約済みサーフェスとして扱い、新しいサードパーティ Plugin のデフォルトパターンとはしないでください。

## 送信前チェックリスト

<Check>**package.json** に正しい `openclaw` メタデータがある</Check>
<Check>**openclaw.plugin.json** マニフェストが存在し、有効である</Check>
<Check>エントリーポイントが `defineChannelPluginEntry` または `definePluginEntry` を使用している</Check>
<Check>すべてのインポートが焦点を絞った `plugin-sdk/<subpath>` パスを使用している</Check>
<Check>内部インポートが SDK の自己インポートではなく、ローカルモジュールを使用している</Check>
<Check>テストが通る（`pnpm test -- <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` が通る（リポジトリ内 Plugin）</Check>

## ベータリリーステスト

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) の GitHub リリースタグを監視し、`Watch` > `Releases` で購読します。ベータタグは `v2026.3.N-beta.1` のような形式です。リリース告知のために、公式 OpenClaw X アカウント [@openclaw](https://x.com/openclaw) の通知をオンにすることもできます。
2. ベータタグが現れたらすぐに、自分の Plugin をそのタグに対してテストします。安定版までの猶予は通常、数時間だけです。
3. テスト後、`plugin-forum` Discord チャンネルにある自分の Plugin のスレッドに、`all good` または壊れた内容を投稿します。まだスレッドがない場合は作成してください。
4. 何かが壊れた場合は、`Beta blocker: <plugin-name> - <summary>` というタイトルの Issue を開くか更新し、`beta-blocker` ラベルを適用します。スレッドに Issue リンクを貼ります。
5. `fix(<plugin-id>): beta blocker - <summary>` というタイトルで `main` への PR を開き、PR と Discord スレッドの両方で Issue をリンクします。コントリビューターは PR にラベルを付けられないため、タイトルがメンテナーと自動化に対する PR 側のシグナルになります。PR があるブロッカーはマージされます。PR がないブロッカーはそのまま出荷される可能性があります。メンテナーはベータテスト中にこれらのスレッドを監視します。
6. 沈黙は green を意味します。ウィンドウを逃した場合、修正はおそらく次のサイクルに入ります。

## 次のステップ

<CardGroup cols={2}>
  <Card title="チャンネル Plugin" icon="messages-square" href="/ja-JP/plugins/sdk-channel-plugins">
    メッセージングチャンネル Plugin を構築する
  </Card>
  <Card title="プロバイダー Plugin" icon="cpu" href="/ja-JP/plugins/sdk-provider-plugins">
    モデルプロバイダー Plugin を構築する
  </Card>
  <Card title="SDK 概要" icon="book-open" href="/ja-JP/plugins/sdk-overview">
    インポートマップと登録 API のリファレンス
  </Card>
  <Card title="ランタイムヘルパー" icon="settings" href="/ja-JP/plugins/sdk-runtime">
    api.runtime 経由の TTS、検索、サブエージェント
  </Card>
  <Card title="テスト" icon="test-tubes" href="/ja-JP/plugins/sdk-testing">
    テストユーティリティとパターン
  </Card>
  <Card title="Plugin マニフェスト" icon="file-json" href="/ja-JP/plugins/manifest">
    完全なマニフェストスキーマリファレンス
  </Card>
</CardGroup>

## 関連

- [Plugin アーキテクチャ](/ja-JP/plugins/architecture) - 内部アーキテクチャの詳細
- [SDK 概要](/ja-JP/plugins/sdk-overview) - Plugin SDK リファレンス
- [マニフェスト](/ja-JP/plugins/manifest) - Plugin マニフェスト形式
- [チャンネル Plugin](/ja-JP/plugins/sdk-channel-plugins) - チャンネル Plugin の構築
- [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins) - プロバイダー Plugin の構築

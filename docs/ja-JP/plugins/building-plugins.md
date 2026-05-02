---
read_when:
    - 新しい OpenClaw Plugin を作成したい場合
    - Plugin 開発向けのクイックスタートが必要です
    - OpenClawに新しいチャネル、プロバイダー、ツール、またはその他の機能を追加している
sidebarTitle: Getting Started
summary: 数分で初めての OpenClaw Plugin を作成する
title: Plugin の構築
x-i18n:
    generated_at: "2026-05-02T05:00:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: e05c82cd810ed400a293cf0c336efeb6e5a6e081b144eb89150407754a98bc19
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin は OpenClaw に新しい機能を追加します。チャネル、モデルプロバイダー、
音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像
生成、動画生成、Web フェッチ、Web 検索、エージェントツール、またはそれらの
任意の組み合わせです。

Plugin を OpenClaw リポジトリに追加する必要はありません。
[ClawHub](/ja-JP/tools/clawhub) に公開すると、ユーザーは
`openclaw plugins install <package-name>` でインストールできます。OpenClaw はまず ClawHub を試し、
まだ npm 配布を使っているパッケージについては、自動的に npm にフォールバックします。

## 前提条件

- Node >= 22 とパッケージマネージャー（npm または pnpm）
- TypeScript（ESM）に慣れていること
- リポジトリ内 Plugin の場合: リポジトリをクローンし、`pnpm install` を完了していること。ソース
  チェックアウトでの Plugin 開発は pnpm 専用です。OpenClaw はバンドルされた
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
    エージェントツール、イベントフック、またはサービスを登録する — 以下に続く
  </Card>
</CardGroup>

オンボーディング/セットアップの実行時にインストール済みであることが保証されないチャネル Plugin では、
`openclaw/plugin-sdk/channel-setup` の `createOptionalChannelSetupSurface(...)` を使用します。
これは、インストール要件を提示し、Plugin がインストールされるまで実際の設定書き込みを
安全側で失敗させるセットアップアダプターと ウィザード のペアを生成します。

## クイックスタート: ツール Plugin

このウォークスルーでは、エージェントツールを登録する最小限の Plugin を作成します。チャネル
Plugin とプロバイダー Plugin には、上記リンク先の専用ガイドがあります。

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

    設定がない場合でも、すべての Plugin にはマニフェストが必要です。また、すべての Plugin は
    `activation.onStartup` を意図的に宣言する必要があります。ランタイム登録ツールには
    起動時のインポートが必要なため、この例では `true` に設定しています。完全なスキーマは
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

    `definePluginEntry` はチャネル以外の Plugin 向けです。チャネルでは
    `defineChannelPluginEntry` を使用します — [チャネル Plugin](/ja-JP/plugins/sdk-channel-plugins) を参照してください。
    エントリーポイントの全オプションについては、[エントリーポイント](/ja-JP/plugins/sdk-entrypoints) を参照してください。

  </Step>

  <Step title="Test and publish">

    **外部 Plugin:** ClawHub で検証して公開し、その後インストールします。

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    OpenClaw は `@myorg/openclaw-my-plugin` のような素のパッケージ指定についても、npm より先に ClawHub を確認します。
    npm は、まだ ClawHub に移行していないパッケージのフォールバックとして残ります。

    **リポジトリ内 Plugin:** バンドル Plugin のワークスペースツリー配下に配置します — 自動的に検出されます。

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin の機能

単一の Plugin は、`api` オブジェクトを通じて任意の数の機能を登録できます。

| 機能                   | 登録メソッド                                     | 詳細ガイド                                                                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| テキスト推論（LLM）    | `api.registerProvider(...)`                      | [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins)                            |
| CLI 推論バックエンド   | `api.registerCliBackend(...)`                    | [CLI バックエンド](/ja-JP/gateway/cli-backends)                                       |
| チャネル / メッセージング | `api.registerChannel(...)`                       | [チャネル Plugin](/ja-JP/plugins/sdk-channel-plugins)                                 |
| 音声（TTS/STT）        | `api.registerSpeechProvider(...)`                | [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| リアルタイム文字起こし | `api.registerRealtimeTranscriptionProvider(...)` | [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| リアルタイム音声       | `api.registerRealtimeVoiceProvider(...)`         | [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| メディア理解           | `api.registerMediaUnderstandingProvider(...)`    | [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 画像生成               | `api.registerImageGenerationProvider(...)`       | [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 音楽生成               | `api.registerMusicGenerationProvider(...)`       | [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 動画生成               | `api.registerVideoGenerationProvider(...)`       | [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web フェッチ           | `api.registerWebFetchProvider(...)`              | [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web 検索               | `api.registerWebSearchProvider(...)`             | [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| ツール結果ミドルウェア | `api.registerAgentToolResultMiddleware(...)`     | [SDK 概要](/ja-JP/plugins/sdk-overview#registration-api)                              |
| エージェントツール     | `api.registerTool(...)`                          | 以下                                                                            |
| カスタムコマンド       | `api.registerCommand(...)`                       | [エントリーポイント](/ja-JP/plugins/sdk-entrypoints)                                  |
| Plugin フック          | `api.on(...)`                                    | [Plugin フック](/ja-JP/plugins/hooks)                                                 |
| 内部イベントフック     | `api.registerHook(...)`                          | [エントリーポイント](/ja-JP/plugins/sdk-entrypoints)                                  |
| HTTP ルート            | `api.registerHttpRoute(...)`                     | [内部構造](/ja-JP/plugins/architecture-internals#gateway-http-routes)                 |
| CLI サブコマンド       | `api.registerCli(...)`                           | [エントリーポイント](/ja-JP/plugins/sdk-entrypoints)                                  |

完全な登録 API については、[SDK 概要](/ja-JP/plugins/sdk-overview#registration-api) を参照してください。

バンドル Plugin は、モデルが出力を見る前に非同期でツール結果を書き換える必要がある場合、
`api.registerAgentToolResultMiddleware(...)` を使用できます。対象ランタイムは
`contracts.agentToolResultMiddleware` に宣言します。例:
`["pi", "codex"]`。これは信頼されたバンドル Plugin 向けの継ぎ目です。外部
Plugin は、OpenClaw がこの機能について明示的な信頼ポリシーを追加するまでは、通常の OpenClaw Plugin フックを優先すべきです。

Plugin がカスタム Gateway RPC メソッドを登録する場合は、Plugin 固有のプレフィックスに置いてください。
コア管理名前空間（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）は予約されたままであり、Plugin がより狭いスコープを要求した場合でも常に
`operator.admin` に解決されます。

覚えておくべきフックガードのセマンティクス:

- `before_tool_call`: `{ block: true }` は終端であり、優先度の低いハンドラーを停止します。
- `before_tool_call`: `{ block: false }` は判断なしとして扱われます。
- `before_tool_call`: `{ requireApproval: true }` はエージェント実行を一時停止し、exec 承認オーバーレイ、Telegram ボタン、Discord インタラクション、または任意のチャネルの `/approve` コマンドを通じてユーザーに承認を求めます。
- `before_install`: `{ block: true }` は終端であり、優先度の低いハンドラーを停止します。
- `before_install`: `{ block: false }` は判断なしとして扱われます。
- `message_sending`: `{ cancel: true }` は終端であり、優先度の低いハンドラーを停止します。
- `message_sending`: `{ cancel: false }` は判断なしとして扱われます。
- `message_received`: 受信スレッド/トピックのルーティングが必要な場合は、型付きの `threadId` フィールドを優先してください。`metadata` はチャネル固有の追加情報用に保持します。
- `message_sending`: チャネル固有のメタデータキーよりも、型付きの `replyToId` / `threadId` ルーティングフィールドを優先してください。

`/approve` コマンドは exec と Plugin の両方の承認を、範囲を限定したフォールバック付きで処理します。exec 承認 ID が見つからない場合、OpenClaw は同じ ID を Plugin 承認として再試行します。Plugin 承認の転送は、設定内の `approvals.plugin` で個別に構成できます。

カスタム承認の配管で、同じ範囲限定フォールバックのケースを検出する必要がある場合は、
承認期限切れ文字列を手動で照合するのではなく、
`openclaw/plugin-sdk/error-runtime` の `isApprovalNotFoundError` を優先してください。

例とフックリファレンスについては、[Plugin フック](/ja-JP/plugins/hooks) を参照してください。

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

ユーザーは設定で任意ツールを有効化します。

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- ツール名はコアツールと競合してはいけません（競合はスキップされます）
- `parameters` の欠落を含む不正な登録オブジェクトを持つツールは、エージェント実行を壊す代わりにスキップされ、Plugin 診断で報告されます
- 副作用や追加のバイナリ要件があるツールには `optional: true` を使用してください
- ユーザーは `tools.allow` に Plugin ID を追加することで、その Plugin のすべてのツールを有効化できます

## CLI コマンドの登録

Plugin は `api.registerCli` でルート `openclaw` コマンドグループを追加できます。
OpenClaw がすべての Plugin ランタイムを先行ロードしなくてもコマンドを表示してルーティングできるように、
各トップレベルコマンドルートに `descriptors` を提供してください。

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

常に、焦点を絞った `openclaw/plugin-sdk/<subpath>` パスからインポートします。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

完全なサブパスのリファレンスについては、[SDK の概要](/ja-JP/plugins/sdk-overview)を参照してください。

Plugin 内では、内部インポートにローカルのバレルファイル（`api.ts`、`runtime-api.ts`）を使用します。SDK パスを通じて自分自身の Plugin をインポートしないでください。

プロバイダーPlugin では、その境界が本当に汎用でない限り、プロバイダー固有のヘルパーをパッケージルートのバレルに置いてください。現在バンドルされている例は次のとおりです。

- Anthropic: Claude ストリームラッパーと `service_tier` / ベータヘルパー
- OpenAI: プロバイダービルダー、デフォルトモデルヘルパー、リアルタイムプロバイダー
- OpenRouter: プロバイダービルダーとオンボーディング/設定ヘルパー

あるヘルパーが 1 つのバンドル済みプロバイダーパッケージ内でしか役に立たない場合は、それを `openclaw/plugin-sdk/*` に昇格させるのではなく、そのパッケージルートの境界に置いてください。

一部の生成済み `openclaw/plugin-sdk/<bundled-id>` ヘルパー境界は、所有者による使用が追跡されている場合に、バンドル済みPlugin のメンテナンス用としてまだ存在します。これらは予約済みの公開面として扱い、新しいサードパーティPlugin のデフォルトパターンとして扱わないでください。

## 提出前チェックリスト

<Check>**package.json** に正しい `openclaw` メタデータがある</Check>
<Check>**openclaw.plugin.json** マニフェストが存在し、有効である</Check>
<Check>エントリーポイントが `defineChannelPluginEntry` または `definePluginEntry` を使用している</Check>
<Check>すべてのインポートが、焦点を絞った `plugin-sdk/<subpath>` パスを使用している</Check>
<Check>内部インポートが SDK 自己インポートではなく、ローカルモジュールを使用している</Check>
<Check>テストが通る（`pnpm test -- <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` が通る（リポジトリ内 Plugin）</Check>

## ベータリリーステスト

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) の GitHub リリースタグを監視し、`Watch` > `Releases` から購読します。ベータタグは `v2026.3.N-beta.1` のような形式です。リリース告知のために、公式 OpenClaw X アカウント [@openclaw](https://x.com/openclaw) の通知を有効にすることもできます。
2. ベータタグが表示されたら、すぐにそのタグに対して Plugin をテストします。安定版までの猶予は通常数時間だけです。
3. テスト後、`all good` または壊れた内容を `plugin-forum` Discord チャンネル内のあなたの Plugin スレッドに投稿します。まだスレッドがない場合は作成してください。
4. 何かが壊れた場合は、`Beta blocker: <plugin-name> - <summary>` というタイトルの issue を開くか更新し、`beta-blocker` ラベルを付けます。スレッドに issue リンクを貼ります。
5. `fix(<plugin-id>): beta blocker - <summary>` というタイトルで `main` への PR を開き、PR と Discord スレッドの両方で issue をリンクします。コントリビューターは PR にラベルを付けられないため、タイトルがメンテナーと自動化向けの PR 側シグナルになります。PR があるブロッカーはマージされます。PR がないブロッカーはそのままリリースされる可能性があります。メンテナーはベータテスト中にこれらのスレッドを監視しています。
6. 沈黙は問題なしを意味します。この期間を逃した場合、修正はおそらく次のサイクルに入ります。

## 次のステップ

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/ja-JP/plugins/sdk-channel-plugins">
    メッセージングチャネルPlugin を構築する
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/ja-JP/plugins/sdk-provider-plugins">
    モデルプロバイダーPlugin を構築する
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

- [Plugin アーキテクチャ](/ja-JP/plugins/architecture) — 内部アーキテクチャの詳細解説
- [SDK の概要](/ja-JP/plugins/sdk-overview) — Plugin SDK リファレンス
- [マニフェスト](/ja-JP/plugins/manifest) — Plugin マニフェスト形式
- [チャネルPlugin](/ja-JP/plugins/sdk-channel-plugins) — チャネルPlugin の構築
- [プロバイダーPlugin](/ja-JP/plugins/sdk-provider-plugins) — プロバイダーPlugin の構築

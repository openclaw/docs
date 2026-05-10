---
read_when:
    - 新しいOpenClaw Pluginを作成したい
    - Plugin 開発のクイックスタートが必要です
    - OpenClaw に新しいチャネル、プロバイダー、ツール、またはその他の機能を追加している
sidebarTitle: Getting Started
summary: 初めてのOpenClaw Pluginを数分で作成する
title: Pluginの構築
x-i18n:
    generated_at: "2026-05-10T19:41:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 320ea03395cd702e62831e3b6bb3e44443b4a00701f3e6d35d7c9e556e3bb258
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin は、チャネル、モデルプロバイダー、音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像生成、動画生成、web fetch、web search、エージェントツール、またはそれらの任意の組み合わせといった新しい機能で OpenClaw を拡張します。

Plugin を OpenClaw リポジトリに追加する必要はありません。[ClawHub](/ja-JP/clawhub) に公開すると、ユーザーは `openclaw plugins install clawhub:<package-name>` でインストールできます。ベアパッケージ指定は、ローンチ移行期間中は引き続き npm からインストールされます。

## 前提条件

- Node >= 22 とパッケージマネージャー（npm または pnpm）
- TypeScript（ESM）に慣れていること
- リポジトリ内 Plugin の場合: リポジトリをクローンし、`pnpm install` を完了していること。ソースチェックアウトでの Plugin 開発は pnpm のみです。OpenClaw は `extensions/*` ワークスペースパッケージからバンドル済み Plugin を読み込むためです。

## どの種類の Plugin ですか？

<CardGroup cols={3}>
  <Card title="チャネル Plugin" icon="messages-square" href="/ja-JP/plugins/sdk-channel-plugins">
    OpenClaw をメッセージングプラットフォーム（Discord、IRC など）に接続します
  </Card>
  <Card title="プロバイダー Plugin" icon="cpu" href="/ja-JP/plugins/sdk-provider-plugins">
    モデルプロバイダー（LLM、プロキシ、またはカスタムエンドポイント）を追加します
  </Card>
  <Card title="CLI バックエンド Plugin" icon="terminal" href="/ja-JP/plugins/cli-backend-plugins">
    ローカル AI CLI を OpenClaw のテキストフォールバックランナーに対応付けます
  </Card>
  <Card title="ツール / フック Plugin" icon="wrench" href="/ja-JP/plugins/hooks">
    エージェントツール、イベントフック、またはサービスを登録します - 以下に進んでください
  </Card>
</CardGroup>

オンボーディング/セットアップの実行時にインストール済みであることが保証されないチャネル Plugin では、`openclaw/plugin-sdk/channel-setup` の `createOptionalChannelSetupSurface(...)` を使用してください。これは、インストール要件を通知し、Plugin がインストールされるまで実際の設定書き込みでフェイルクローズする、セットアップアダプターとウィザードのペアを生成します。

## クイックスタート: ツール Plugin

このウォークスルーでは、エージェントツールを登録する最小限の Plugin を作成します。チャネルおよびプロバイダー Plugin には、上記にリンクされた専用ガイドがあります。

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

    すべての Plugin には、設定がない場合でもマニフェストが必要です。ランタイムで登録されるツールは `contracts.tools` に列挙する必要があります。これにより、OpenClaw はすべての Plugin ランタイムを読み込まずに、所有する Plugin を検出できます。Plugin は `activation.onStartup` も意図的に宣言する必要があります。この例では `true` に設定しています。完全なスキーマについては [マニフェスト](/ja-JP/plugins/manifest) を参照してください。正規の ClawHub 公開スニペットは `docs/snippets/plugin-publish/` にあります。

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

    `definePluginEntry` は非チャネル Plugin 用です。チャネルでは `defineChannelPluginEntry` を使用してください - [チャネル Plugin](/ja-JP/plugins/sdk-channel-plugins) を参照してください。エントリーポイントのすべてのオプションについては、[エントリーポイント](/ja-JP/plugins/sdk-entrypoints) を参照してください。

  </Step>

  <Step title="テストして公開する">

    **外部 Plugin:** ClawHub で検証して公開し、その後インストールします。

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    `@myorg/openclaw-my-plugin` のようなベアパッケージ指定は、ローンチ移行期間中は npm からインストールされます。ClawHub 解決を使いたい場合は `clawhub:` を使用してください。

    **リポジトリ内 Plugin:** バンドル済み Plugin ワークスペースツリーの下に配置します - 自動的に検出されます。

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin 機能

単一の Plugin は、`api` オブジェクトを介して任意の数の機能を登録できます。

| 機能                   | 登録メソッド                                     | 詳細ガイド                                                                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| テキスト推論（LLM）    | `api.registerProvider(...)`                      | [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins)                            |
| CLI 推論バックエンド   | `api.registerCliBackend(...)`                    | [CLI バックエンド Plugin](/ja-JP/plugins/cli-backend-plugins)                         |
| チャネル / メッセージング | `api.registerChannel(...)`                    | [チャネル Plugin](/ja-JP/plugins/sdk-channel-plugins)                                 |
| 音声（TTS/STT）        | `api.registerSpeechProvider(...)`                | [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| リアルタイム文字起こし | `api.registerRealtimeTranscriptionProvider(...)` | [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| リアルタイム音声       | `api.registerRealtimeVoiceProvider(...)`         | [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| メディア理解           | `api.registerMediaUnderstandingProvider(...)`    | [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 画像生成               | `api.registerImageGenerationProvider(...)`       | [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 音楽生成               | `api.registerMusicGenerationProvider(...)`       | [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 動画生成               | `api.registerVideoGenerationProvider(...)`       | [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web fetch              | `api.registerWebFetchProvider(...)`              | [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web search             | `api.registerWebSearchProvider(...)`             | [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| ツール結果ミドルウェア | `api.registerAgentToolResultMiddleware(...)`     | [SDK 概要](/ja-JP/plugins/sdk-overview#registration-api)                              |
| エージェントツール     | `api.registerTool(...)`                          | 以下                                                                            |
| カスタムコマンド       | `api.registerCommand(...)`                       | [エントリーポイント](/ja-JP/plugins/sdk-entrypoints)                                  |
| Plugin フック          | `api.on(...)`                                    | [Plugin フック](/ja-JP/plugins/hooks)                                                 |
| 内部イベントフック     | `api.registerHook(...)`                          | [エントリーポイント](/ja-JP/plugins/sdk-entrypoints)                                  |
| HTTP ルート            | `api.registerHttpRoute(...)`                     | [内部構造](/ja-JP/plugins/architecture-internals#gateway-http-routes)                 |
| CLI サブコマンド       | `api.registerCli(...)`                           | [エントリーポイント](/ja-JP/plugins/sdk-entrypoints)                                  |

完全な登録 API については、[SDK 概要](/ja-JP/plugins/sdk-overview#registration-api) を参照してください。

バンドル済み Plugin は、モデルが出力を見る前に非同期のツール結果書き換えが必要な場合、`api.registerAgentToolResultMiddleware(...)` を使用できます。対象ランタイムを `contracts.agentToolResultMiddleware` に宣言してください。たとえば `["pi", "codex"]` です。これは信頼済みバンドル Plugin の接点です。外部 Plugin は、OpenClaw がこの機能の明示的な信頼ポリシーを拡張するまでは、通常の OpenClaw Plugin フックを優先してください。

Plugin がカスタム Gateway RPC メソッドを登録する場合は、Plugin 固有のプレフィックス上に保ってください。コア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は予約されたままで、Plugin がより狭いスコープを要求しても常に `operator.admin` に解決されます。

覚えておくべきフックガードのセマンティクス:

- `before_tool_call`: `{ block: true }` は終端であり、優先度の低いハンドラーを停止します。
- `before_tool_call`: `{ block: false }` は判断なしとして扱われます。
- `before_tool_call`: `{ requireApproval: true }` はエージェントの実行を一時停止し、exec 承認オーバーレイ、Telegram ボタン、Discord インタラクション、または任意のチャネルの `/approve` コマンドを介してユーザーに承認を求めます。
- `before_install`: `{ block: true }` は終端であり、優先度の低いハンドラーを停止します。
- `before_install`: `{ block: false }` は判断なしとして扱われます。
- `message_sending`: `{ cancel: true }` は終端であり、優先度の低いハンドラーを停止します。
- `message_sending`: `{ cancel: false }` は判断なしとして扱われます。
- `message_received`: 受信スレッド/トピックのルーティングが必要な場合は、型付きの `threadId` フィールドを優先してください。`metadata` はチャネル固有の追加情報用に保ってください。
- `message_sending`: チャネル固有のメタデータキーよりも、型付きの `replyToId` / `threadId` ルーティングフィールドを優先してください。

`/approve` コマンドは、有界フォールバックにより exec 承認と Plugin 承認の両方を処理します。exec 承認 ID が見つからない場合、OpenClaw は同じ ID で Plugin 承認を再試行します。Plugin 承認の転送は、設定内の `approvals.plugin` で独立して構成できます。

カスタム承認の配管で同じ有界フォールバックケースを検出する必要がある場合は、承認期限切れ文字列を手動で照合する代わりに、`openclaw/plugin-sdk/error-runtime` の `isApprovalNotFoundError` を優先してください。

例とフックリファレンスについては、[Plugin フック](/ja-JP/plugins/hooks) を参照してください。

## エージェントツールの登録

ツールは、LLM が呼び出せる型付き関数です。必須（常に利用可能）または任意（ユーザーのオプトイン）にできます。

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

Tool ファクトリは、ランタイムから提供されるコンテキストオブジェクトを受け取ります。ツールが現在のターンのアクティブなモデルを記録、表示、またはそれに適応する必要がある場合は、`ctx.activeModel` を使用してください。このオブジェクトには `provider`、`modelId`、`modelRef` を含められます。これは情報提供用のランタイムメタデータとして扱い、ローカルオペレーター、インストール済みの Plugin コード、または変更された OpenClaw ランタイムに対するセキュリティ境界として扱わないでください。機密性の高いローカルツールでは、明示的な Plugin またはオペレーターのオプトインを維持し、アクティブモデルメタデータがない場合や適切でない場合はフェイルクローズしてください。

`api.registerTool(...)` で登録されるすべてのツールは、Plugin マニフェストでも宣言する必要があります。

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

OpenClaw は登録されたツールから検証済みディスクリプターを取得してキャッシュするため、Plugin はマニフェスト内で `description` やスキーマデータを重複させません。マニフェストコントラクトは所有権と検出だけを宣言します。実行時には引き続き、ライブ登録されたツール実装が呼び出されます。
`api.registerTool(..., { optional: true })` で登録されたツールには `toolMetadata.<tool>.optional: true` を設定してください。これにより OpenClaw は、そのツールが明示的に許可リストに追加されるまで、その Plugin ランタイムのロードを回避できます。

ユーザーは設定で任意ツールを有効にします。

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- ツール名はコアツールと衝突してはいけません（衝突したものはスキップされます）
- `parameters` の欠落を含む、不正な登録オブジェクトを持つツールは、エージェント実行を壊す代わりにスキップされ、Plugin 診断で報告されます
- 副作用や追加のバイナリ要件を持つツールには `optional: true` を使用してください
- ユーザーは Plugin ID を `tools.allow` に追加することで、その Plugin のすべてのツールを有効にできます

## CLI コマンドの登録

Plugin は `api.registerCli` を使って、ルート `openclaw` コマンドグループを追加できます。OpenClaw がすべての Plugin ランタイムを先読みせずにコマンドを表示してルーティングできるように、各トップレベルコマンドルートに `descriptors` を提供してください。

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

インストール後、ランタイム登録を検証してコマンドを実行します。

```bash
openclaw plugins inspect demo-plugin --runtime --json
openclaw demo-plugin ping
```

## インポート規約

常に対象を絞った `openclaw/plugin-sdk/<subpath>` パスからインポートしてください。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

完全なサブパスリファレンスについては、[SDK 概要](/ja-JP/plugins/sdk-overview)を参照してください。

Plugin 内では、内部インポートにローカルのバレルファイル（`api.ts`、`runtime-api.ts`）を使用してください。自分の Plugin を SDK パス経由でインポートしてはいけません。

Provider Plugin では、そのつなぎ目が本当に汎用でない限り、プロバイダー固有のヘルパーをそれらのパッケージルートのバレルに保持してください。現在のバンドル例は次のとおりです。

- Anthropic: Claude ストリームラッパーと `service_tier` / ベータヘルパー
- OpenAI: プロバイダービルダー、デフォルトモデルヘルパー、リアルタイムプロバイダー
- OpenRouter: プロバイダービルダーとオンボーディング/設定ヘルパー

ヘルパーが 1 つのバンドル済みプロバイダーパッケージ内でしか有用でない場合は、`openclaw/plugin-sdk/*` に昇格させるのではなく、そのパッケージルートのつなぎ目に保持してください。

一部の生成済み `openclaw/plugin-sdk/<bundled-id>` ヘルパーのつなぎ目は、所有者の使用状況が追跡されている場合のバンドル済み Plugin メンテナンス用としてまだ存在します。これらは予約済みサーフェスとして扱い、新しいサードパーティ Plugin の既定パターンとして扱わないでください。

## 提出前チェックリスト

<Check>**package.json** に正しい `openclaw` メタデータがある</Check>
<Check>**openclaw.plugin.json** マニフェストが存在し、有効である</Check>
<Check>エントリポイントが `defineChannelPluginEntry` または `definePluginEntry` を使用している</Check>
<Check>すべてのインポートが対象を絞った `plugin-sdk/<subpath>` パスを使用している</Check>
<Check>内部インポートが SDK 自己インポートではなくローカルモジュールを使用している</Check>
<Check>テストが成功する（`pnpm test -- <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` が成功する（リポジトリ内 Plugin）</Check>

## ベータリリーステスト

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) の GitHub リリースタグを監視し、`Watch` > `Releases` で購読してください。ベータタグは `v2026.3.N-beta.1` のような形式です。リリース告知を受け取るには、OpenClaw の公式 X アカウント [@openclaw](https://x.com/openclaw) の通知をオンにすることもできます。
2. ベータタグが表示されたらすぐに、そのタグに対して Plugin をテストしてください。安定版までの猶予は通常、数時間だけです。
3. テスト後、`plugin-forum` Discord チャンネル内の自分の Plugin スレッドに、`all good` または壊れた内容を投稿してください。まだスレッドがない場合は作成してください。
4. 何かが壊れた場合は、`Beta blocker: <plugin-name> - <summary>` というタイトルの Issue を作成または更新し、`beta-blocker` ラベルを適用してください。スレッドに Issue リンクを載せてください。
5. `fix(<plugin-id>): beta blocker - <summary>` というタイトルで `main` への PR を開き、PR と Discord スレッドの両方で Issue をリンクしてください。コントリビューターは PR にラベルを付けられないため、タイトルがメンテナーと自動化に対する PR 側のシグナルになります。PR があるブロッカーはマージされます。PR がないブロッカーは、そのまま出荷される可能性があります。メンテナーはベータテスト中にこれらのスレッドを監視します。
6. 無言は問題なしを意味します。期間を逃した場合、修正はおそらく次のサイクルに入ります。

## 次のステップ

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/ja-JP/plugins/sdk-channel-plugins">
    メッセージングチャンネル Plugin を構築する
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/ja-JP/plugins/sdk-provider-plugins">
    モデルプロバイダー Plugin を構築する
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/ja-JP/plugins/cli-backend-plugins">
    ローカル AI CLI バックエンドを登録する
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

- [Plugin アーキテクチャ](/ja-JP/plugins/architecture) - 内部アーキテクチャの詳細解説
- [SDK 概要](/ja-JP/plugins/sdk-overview) - Plugin SDK リファレンス
- [マニフェスト](/ja-JP/plugins/manifest) - Plugin マニフェスト形式
- [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins) - チャンネル Plugin の構築
- [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins) - プロバイダー Plugin の構築

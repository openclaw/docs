---
read_when:
    - 新しい OpenClaw Plugin を作成したい場合
    - Plugin開発用のクイックスタートが必要です
    - OpenClaw に新しいチャンネル、プロバイダー、ツール、またはその他の機能を追加する場合
sidebarTitle: Getting Started
summary: 数分で初めての OpenClaw Plugin を作成する
title: Pluginの構築
x-i18n:
    generated_at: "2026-05-07T13:22:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b8eb1d4c36828c8e7031f3780f6a795ead2a1e723dd385a54626112163d592d
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins は OpenClaw に新しい機能を追加します。チャネル、モデルプロバイダー、
音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像
生成、動画生成、Web 取得、Web 検索、エージェントツール、またはそれらの
任意の組み合わせです。

Plugin を OpenClaw リポジトリに追加する必要はありません。
[ClawHub](/ja-JP/tools/clawhub) に公開すると、ユーザーは
`openclaw plugins install clawhub:<package-name>` でインストールできます。プレフィックスなしのパッケージ指定も、ローンチ移行中は引き続き npm から
インストールされます。

## 前提条件

- Node >= 22 とパッケージマネージャー (npm または pnpm)
- TypeScript (ESM) に慣れていること
- リポジトリ内 Plugin の場合: リポジトリをクローンし、`pnpm install` が完了していること。ソース
  チェックアウトでの Plugin 開発は pnpm のみです。OpenClaw は `extensions/*` ワークスペースパッケージからバンドル済み
  Plugins を読み込むためです。

## どの種類の Plugin か?

<CardGroup cols={3}>
  <Card title="チャネルPlugin" icon="messages-square" href="/ja-JP/plugins/sdk-channel-plugins">
    OpenClaw をメッセージングプラットフォーム (Discord、IRC など) に接続する
  </Card>
  <Card title="プロバイダーPlugin" icon="cpu" href="/ja-JP/plugins/sdk-provider-plugins">
    モデルプロバイダー (LLM、プロキシ、またはカスタムエンドポイント) を追加する
  </Card>
  <Card title="CLI バックエンドPlugin" icon="terminal" href="/ja-JP/plugins/cli-backend-plugins">
    ローカル AI CLI を OpenClaw のテキストフォールバックランナーに対応付ける
  </Card>
  <Card title="ツール / フックPlugin" icon="wrench" href="/ja-JP/plugins/hooks">
    エージェントツール、イベントフック、またはサービスを登録する - 以下を続ける
  </Card>
</CardGroup>

オンボーディング/セットアップの実行時にインストール済みであることが保証されないチャネルPluginでは、
`openclaw/plugin-sdk/channel-setup` の `createOptionalChannelSetupSurface(...)` を使用します。
これはセットアップアダプターとウィザードのペアを生成し、
インストール要件を通知し、Plugin がインストールされるまで実際の設定書き込みを失敗として閉じます。

## クイックスタート: ツールPlugin

このウォークスルーでは、エージェントツールを登録する最小限の Plugin を作成します。チャネル
およびプロバイダーPlugins には、上記にリンクされた専用ガイドがあります。

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

    設定がない場合でも、すべての Plugin にはマニフェストが必要です。ランタイム登録ツールは
    `contracts.tools` に列挙する必要があります。これにより、OpenClaw はすべての Plugin ランタイムを読み込まずに、
    所有する Plugin を検出できます。Plugins は `activation.onStartup` も意図を持って宣言するべきです。この例では
    `true` に設定しています。完全なスキーマについては
    [マニフェスト](/ja-JP/plugins/manifest) を参照してください。正規の ClawHub
    公開スニペットは `docs/snippets/plugin-publish/` にあります。

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

    `definePluginEntry` は非チャネルPlugins 用です。チャネルでは
    `defineChannelPluginEntry` を使用します - [チャネルPlugins](/ja-JP/plugins/sdk-channel-plugins) を参照してください。
    すべてのエントリポイントオプションについては、[エントリポイント](/ja-JP/plugins/sdk-entrypoints) を参照してください。

  </Step>

  <Step title="テストして公開する">

    **外部Plugins:** ClawHub で検証して公開し、その後インストールします。

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    `@myorg/openclaw-my-plugin` のようなプレフィックスなしのパッケージ指定は、ローンチ移行中に npm からインストールされます。
    ClawHub 解決を使いたい場合は `clawhub:` を使用します。

    **リポジトリ内 Plugins:** バンドル済み Plugin ワークスペースツリーの下に配置します - 自動的に検出されます。

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin の機能

単一の Plugin は `api` オブジェクトを介して任意の数の機能を登録できます。

| 機能                   | 登録メソッド                                     | 詳細ガイド                                                                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| テキスト推論 (LLM)     | `api.registerProvider(...)`                      | [プロバイダーPlugins](/ja-JP/plugins/sdk-provider-plugins)                            |
| CLI 推論バックエンド   | `api.registerCliBackend(...)`                    | [CLI バックエンドPlugins](/ja-JP/plugins/cli-backend-plugins)                         |
| チャネル / メッセージング | `api.registerChannel(...)`                    | [チャネルPlugins](/ja-JP/plugins/sdk-channel-plugins)                                 |
| 音声 (TTS/STT)         | `api.registerSpeechProvider(...)`                | [プロバイダーPlugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| リアルタイム文字起こし | `api.registerRealtimeTranscriptionProvider(...)` | [プロバイダーPlugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| リアルタイム音声       | `api.registerRealtimeVoiceProvider(...)`         | [プロバイダーPlugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| メディア理解           | `api.registerMediaUnderstandingProvider(...)`    | [プロバイダーPlugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 画像生成               | `api.registerImageGenerationProvider(...)`       | [プロバイダーPlugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 音楽生成               | `api.registerMusicGenerationProvider(...)`       | [プロバイダーPlugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| 動画生成               | `api.registerVideoGenerationProvider(...)`       | [プロバイダーPlugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web 取得               | `api.registerWebFetchProvider(...)`              | [プロバイダーPlugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| Web 検索               | `api.registerWebSearchProvider(...)`             | [プロバイダーPlugins](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
| ツール結果ミドルウェア | `api.registerAgentToolResultMiddleware(...)`     | [SDK 概要](/ja-JP/plugins/sdk-overview#registration-api)                              |
| エージェントツール     | `api.registerTool(...)`                          | 以下                                                                            |
| カスタムコマンド       | `api.registerCommand(...)`                       | [エントリポイント](/ja-JP/plugins/sdk-entrypoints)                                    |
| Plugin フック          | `api.on(...)`                                    | [Plugin フック](/ja-JP/plugins/hooks)                                                 |
| 内部イベントフック     | `api.registerHook(...)`                          | [エントリポイント](/ja-JP/plugins/sdk-entrypoints)                                    |
| HTTP ルート            | `api.registerHttpRoute(...)`                     | [内部構造](/ja-JP/plugins/architecture-internals#gateway-http-routes)                 |
| CLI サブコマンド       | `api.registerCli(...)`                           | [エントリポイント](/ja-JP/plugins/sdk-entrypoints)                                    |

完全な登録 API については、[SDK 概要](/ja-JP/plugins/sdk-overview#registration-api) を参照してください。

バンドル済み Plugins は、モデルが出力を見る前に非同期ツール結果の書き換えが必要な場合、
`api.registerAgentToolResultMiddleware(...)` を使用できます。
対象ランタイムを `contracts.agentToolResultMiddleware` に宣言します。例:
`["pi", "codex"]`。これは信頼済みのバンドル済み Plugin 向けの継ぎ目です。外部
Plugins は、この機能に対する明示的な信頼ポリシーが OpenClaw に追加されるまでは、通常の OpenClaw Plugin フックを優先してください。

Plugin がカスタム Gateway RPC メソッドを登録する場合は、それらを
Plugin 固有のプレフィックス上に置いてください。コア管理名前空間 (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) は予約済みのままで、Plugin がより狭いスコープを要求しても常に
`operator.admin` に解決されます。

覚えておくべきフックガードのセマンティクス:

- `before_tool_call`: `{ block: true }` は終端であり、低優先度のハンドラーを停止します。
- `before_tool_call`: `{ block: false }` は決定なしとして扱われます。
- `before_tool_call`: `{ requireApproval: true }` はエージェントの実行を一時停止し、exec 承認オーバーレイ、Telegram ボタン、Discord インタラクション、または任意のチャネルの `/approve` コマンドを介してユーザーに承認を求めます。
- `before_install`: `{ block: true }` は終端であり、低優先度のハンドラーを停止します。
- `before_install`: `{ block: false }` は決定なしとして扱われます。
- `message_sending`: `{ cancel: true }` は終端であり、低優先度のハンドラーを停止します。
- `message_sending`: `{ cancel: false }` は決定なしとして扱われます。
- `message_received`: 受信スレッド/トピックのルーティングが必要な場合は、型付きの `threadId` フィールドを優先してください。チャネル固有の追加情報には `metadata` を使用します。
- `message_sending`: チャネル固有のメタデータキーよりも、型付きの `replyToId` / `threadId` ルーティングフィールドを優先してください。

`/approve` コマンドは、範囲付きフォールバックで exec 承認と Plugin 承認の両方を処理します。exec 承認 ID が見つからない場合、OpenClaw は同じ ID を Plugin 承認で再試行します。Plugin 承認の転送は、設定内の `approvals.plugin` で独立して構成できます。

カスタム承認配管で同じ範囲付きフォールバックケースを検出する必要がある場合は、
承認期限切れ文字列を手動で照合するのではなく、
`openclaw/plugin-sdk/error-runtime` の `isApprovalNotFoundError` を優先してください。

例とフックリファレンスについては、[Plugin フック](/ja-JP/plugins/hooks) を参照してください。

## エージェントツールの登録

ツールは LLM が呼び出せる型付き関数です。必須 (常に
利用可能) または任意 (ユーザーのオプトイン) にできます。

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

`api.registerTool(...)` で登録されるすべてのツールは、Plugin
マニフェストでも宣言する必要があります。

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

OpenClaw は登録済みツールから検証済み descriptor を取得してキャッシュするため、
Plugin はマニフェスト内で `description` やスキーマデータを重複させません。
マニフェスト契約は所有権と検出のみを宣言します。実行時は引き続き、
ライブ登録済みツール実装を呼び出します。
`api.registerTool(..., { optional: true })` で登録したツールには
`toolMetadata.<tool>.optional: true` を設定し、ツールが明示的に allowlist に追加されるまで
OpenClaw がその Plugin runtime を読み込まずに済むようにします。

ユーザーは config で optional tools を有効にします。

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- ツール名は core tools と衝突してはいけません（衝突はスキップされます）
- `parameters` の欠落を含む不正な登録オブジェクトを持つツールは、agent runs を壊す代わりにスキップされ、Plugin diagnostics に報告されます
- 副作用や追加のバイナリ要件があるツールには `optional: true` を使います
- ユーザーは Plugin id を `tools.allow` に追加することで、その Plugin のすべてのツールを有効にできます

## CLI コマンドの登録

Plugin は `api.registerCli` で root `openclaw` コマンドグループを追加できます。
各 top-level command root に `descriptors` を指定すると、OpenClaw はすべての Plugin runtime を eager に読み込まずにコマンドを表示してルーティングできます。

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

インストール後、runtime 登録を検証してコマンドを実行します。

```bash
openclaw plugins inspect demo-plugin --runtime --json
openclaw demo-plugin ping
```

## import 規約

常に focused な `openclaw/plugin-sdk/<subpath>` パスから import します。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// Wrong: monolithic root (deprecated, will be removed)
import { ... } from "openclaw/plugin-sdk";
```

完全な subpath reference については、[SDK 概要](/ja-JP/plugins/sdk-overview) を参照してください。

Plugin 内では、internal imports に local barrel files（`api.ts`、`runtime-api.ts`）を使い、
自分自身の Plugin を SDK path 経由で import しないでください。

provider Plugin では、その seam が真に generic でない限り、provider 固有の helpers は
その package-root barrels に置いてください。現在の bundled examples は次のとおりです。

- Anthropic: Claude stream wrappers と `service_tier` / beta helpers
- OpenAI: provider builders、default-model helpers、realtime providers
- OpenRouter: provider builder とオンボーディング/config helpers

helper が 1 つの bundled provider package 内でしか有用でない場合は、
`openclaw/plugin-sdk/*` に昇格させるのではなく、その package-root seam に保持してください。

一部の生成済み `openclaw/plugin-sdk/<bundled-id>` helper seams は、tracked owner usage がある場合の
bundled-plugin maintenance のためにまだ存在します。新しい third-party Plugin の既定パターンではなく、
予約済みの surfaces として扱ってください。

## 送信前チェックリスト

<Check>**package.json** に正しい `openclaw` metadata がある</Check>
<Check>**openclaw.plugin.json** マニフェストが存在し、有効である</Check>
<Check>entry point が `defineChannelPluginEntry` または `definePluginEntry` を使っている</Check>
<Check>すべての import が focused な `plugin-sdk/<subpath>` パスを使っている</Check>
<Check>internal imports が SDK self-imports ではなく local modules を使っている</Check>
<Check>tests が成功する（`pnpm test -- <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` が成功する（in-repo Plugin）</Check>

## ベータリリースのテスト

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) の GitHub release tags を監視し、`Watch` > `Releases` で購読します。Beta tags は `v2026.3.N-beta.1` のような形式です。リリース告知のために、OpenClaw 公式 X アカウント [@openclaw](https://x.com/openclaw) の通知を有効にすることもできます。
2. beta tag が表示されたらすぐに、Plugin をその beta tag に対してテストします。stable までの猶予は通常、数時間しかありません。
3. テスト後、`plugin-forum` Discord チャネルにある自分の Plugin の thread に、`all good` または壊れた内容を投稿します。まだ thread がない場合は作成してください。
4. 何かが壊れた場合は、`Beta blocker: <plugin-name> - <summary>` というタイトルの issue を開くか更新し、`beta-blocker` ラベルを適用します。issue link を thread に入れてください。
5. `main` に対して `fix(<plugin-id>): beta blocker - <summary>` というタイトルの PR を開き、PR と Discord thread の両方で issue にリンクします。contributors は PR に label を付けられないため、title が maintainers と automation に対する PR 側の signal になります。PR がある blockers は merge されます。PR がない blockers はそのまま ship される可能性があります。maintainers は beta testing 中にこれらの threads を監視します。
6. 無言は green を意味します。window を逃した場合、修正はおそらく次の cycle に入ります。

## 次のステップ

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/ja-JP/plugins/sdk-channel-plugins">
    messaging channel Plugin を構築する
  </Card>
  <Card title="Provider Plugins" icon="cpu" href="/ja-JP/plugins/sdk-provider-plugins">
    model provider Plugin を構築する
  </Card>
  <Card title="CLI Backend Plugins" icon="terminal" href="/ja-JP/plugins/cli-backend-plugins">
    local AI CLI backend を登録する
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/ja-JP/plugins/sdk-overview">
    import map と registration API reference
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/ja-JP/plugins/sdk-runtime">
    api.runtime 経由の TTS、search、subagent
  </Card>
  <Card title="Testing" icon="test-tubes" href="/ja-JP/plugins/sdk-testing">
    test utilities と patterns
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/ja-JP/plugins/manifest">
    完全な manifest schema reference
  </Card>
</CardGroup>

## 関連

- [Plugin アーキテクチャ](/ja-JP/plugins/architecture) - internal architecture の詳細解説
- [SDK 概要](/ja-JP/plugins/sdk-overview) - Plugin SDK reference
- [マニフェスト](/ja-JP/plugins/manifest) - Plugin manifest format
- [チャネル Plugin](/ja-JP/plugins/sdk-channel-plugins) - channel Plugin の構築
- [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins) - provider Plugin の構築

---
read_when:
    - 新しい OpenClaw Plugin を作成したい場合
    - Plugin 開発向けのクイックスタートが必要です
    - OpenClaw に新しいチャネル、プロバイダー、ツール、またはその他の機能を追加しています
sidebarTitle: Getting Started
summary: 数分で初めての OpenClaw plugin を作成する
title: Plugin の構築
x-i18n:
    generated_at: "2026-05-04T05:00:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e6c55c551629da54b3f150ce6299694186fe4434cfd7978a2d43d175d33a5d9
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins は OpenClaw に新しい機能を追加します。チャネル、モデルプロバイダー、
音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像
生成、動画生成、web fetch、web search、エージェントツール、またはその任意の
組み合わせです。

Plugin を OpenClaw リポジトリに追加する必要はありません。
[ClawHub](/ja-JP/tools/clawhub) に公開すると、ユーザーは
`openclaw plugins install clawhub:<package-name>` でインストールできます。ベアパッケージ指定は、ローンチ切り替え期間中も
npm からインストールされます。

## 前提条件

- Node >= 22 とパッケージマネージャー (npm または pnpm)
- TypeScript (ESM) の知識
- リポジトリ内 Plugin の場合: リポジトリをクローンし、`pnpm install` を完了していること。ソース
  チェックアウトでの Plugin 開発は pnpm のみです。これは、OpenClaw がバンドル済み
  Plugin を `extensions/*` ワークスペースパッケージから読み込むためです。

## どの種類の Plugin ですか？

<CardGroup cols={3}>
  <Card title="チャネル Plugin" icon="messages-square" href="/ja-JP/plugins/sdk-channel-plugins">
    OpenClaw をメッセージングプラットフォーム (Discord、IRC など) に接続する
  </Card>
  <Card title="プロバイダー Plugin" icon="cpu" href="/ja-JP/plugins/sdk-provider-plugins">
    モデルプロバイダー (LLM、プロキシ、またはカスタムエンドポイント) を追加する
  </Card>
  <Card title="ツール / フック Plugin" icon="wrench" href="/ja-JP/plugins/hooks">
    エージェントツール、イベントフック、またはサービスを登録する — 以下に進む
  </Card>
</CardGroup>

オンボーディング/セットアップの実行時にインストールされている保証がないチャネル Plugin では、
`openclaw/plugin-sdk/channel-setup` の `createOptionalChannelSetupSurface(...)` を使用します。
これにより、インストール要件を提示し、Plugin がインストールされるまで実際の設定書き込みで
安全に失敗するセットアップアダプターとウィザードのペアが生成されます。

## クイックスタート: ツール Plugin

このチュートリアルでは、エージェントツールを登録する最小限の Plugin を作成します。チャネル
Plugin とプロバイダー Plugin には、上記にリンクされた専用ガイドがあります。

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

    設定がない場合でも、すべての Plugin にはマニフェストが必要です。ランタイムで登録されるツールは、
    `contracts.tools` に列挙する必要があります。これにより OpenClaw は、すべての Plugin ランタイムを
    読み込まずに所有元の Plugin を検出できます。Plugin は
    `activation.onStartup` も意図的に宣言する必要があります。この例では `true` に設定しています。
    完全なスキーマは [マニフェスト](/ja-JP/plugins/manifest) を参照してください。正規の ClawHub
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

    `definePluginEntry` は非チャネル Plugin 用です。チャネルでは
    `defineChannelPluginEntry` を使用します — [チャネル Plugin](/ja-JP/plugins/sdk-channel-plugins) を参照してください。
    エントリポイントの全オプションは、[エントリポイント](/ja-JP/plugins/sdk-entrypoints) を参照してください。

  </Step>

  <Step title="テストして公開する">

    **外部 Plugin:** ClawHub で検証して公開し、その後インストールします。

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    `@myorg/openclaw-my-plugin` のようなベアパッケージ指定は、ローンチ切り替え期間中に
    npm からインストールされます。ClawHub の解決を使用したい場合は `clawhub:` を使用します。

    **リポジトリ内 Plugin:** バンドル済み Plugin のワークスペースツリー配下に配置します — 自動的に検出されます。

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin の機能

単一の Plugin は、`api` オブジェクトを介して任意の数の機能を登録できます。

| 機能                   | 登録メソッド                                     | 詳細ガイド                                                                      |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| テキスト推論 (LLM)     | `api.registerProvider(...)`                      | [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins)                            |
| CLI 推論バックエンド   | `api.registerCliBackend(...)`                    | [CLI バックエンド](/ja-JP/gateway/cli-backends)                                       |
| チャネル / メッセージング | `api.registerChannel(...)`                       | [チャネル Plugin](/ja-JP/plugins/sdk-channel-plugins)                                 |
| 音声 (TTS/STT)         | `api.registerSpeechProvider(...)`                | [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins#step-5-add-extra-capabilities) |
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
| カスタムコマンド       | `api.registerCommand(...)`                       | [エントリポイント](/ja-JP/plugins/sdk-entrypoints)                                    |
| Plugin フック          | `api.on(...)`                                    | [Plugin フック](/ja-JP/plugins/hooks)                                                 |
| 内部イベントフック     | `api.registerHook(...)`                          | [エントリポイント](/ja-JP/plugins/sdk-entrypoints)                                    |
| HTTP ルート            | `api.registerHttpRoute(...)`                     | [内部構造](/ja-JP/plugins/architecture-internals#gateway-http-routes)                 |
| CLI サブコマンド       | `api.registerCli(...)`                           | [エントリポイント](/ja-JP/plugins/sdk-entrypoints)                                    |

完全な登録 API については、[SDK 概要](/ja-JP/plugins/sdk-overview#registration-api) を参照してください。

バンドル済み Plugin は、モデルが出力を見る前に非同期のツール結果書き換えが必要な場合に、
`api.registerAgentToolResultMiddleware(...)` を使用できます。対象ランタイムを
`contracts.agentToolResultMiddleware` に宣言します。例:
`["pi", "codex"]`。これは信頼されたバンドル済み Plugin の接点です。外部
Plugin は、この機能に対する明示的な信頼ポリシーが OpenClaw に追加されるまでは、
通常の OpenClaw Plugin フックを優先するべきです。

Plugin がカスタム Gateway RPC メソッドを登録する場合は、Plugin 固有のプレフィックスに置いてください。
コア管理名前空間 (`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`) は予約されたままで、Plugin がより狭いスコープを要求しても常に
`operator.admin` に解決されます。

覚えておくべきフックガードのセマンティクス:

- `before_tool_call`: `{ block: true }` は終端であり、優先度の低いハンドラーを停止します。
- `before_tool_call`: `{ block: false }` は判断なしとして扱われます。
- `before_tool_call`: `{ requireApproval: true }` はエージェント実行を一時停止し、exec 承認オーバーレイ、Telegram ボタン、Discord インタラクション、または任意のチャネルの `/approve` コマンドを介してユーザーに承認を求めます。
- `before_install`: `{ block: true }` は終端であり、優先度の低いハンドラーを停止します。
- `before_install`: `{ block: false }` は判断なしとして扱われます。
- `message_sending`: `{ cancel: true }` は終端であり、優先度の低いハンドラーを停止します。
- `message_sending`: `{ cancel: false }` は判断なしとして扱われます。
- `message_received`: 受信スレッド/トピックのルーティングが必要な場合は、型付きの `threadId` フィールドを優先してください。`metadata` はチャネル固有の追加情報用に維持します。
- `message_sending`: チャネル固有のメタデータキーよりも、型付きの `replyToId` / `threadId` ルーティングフィールドを優先してください。

`/approve` コマンドは、境界付きフォールバックにより exec 承認と Plugin 承認の両方を処理します。exec 承認 ID が見つからない場合、OpenClaw は同じ ID を Plugin 承認として再試行します。Plugin 承認の転送は、設定の `approvals.plugin` で独立して構成できます。

カスタム承認の配管が同じ境界付きフォールバックケースを検出する必要がある場合は、
承認期限切れ文字列を手動で照合するのではなく、
`openclaw/plugin-sdk/error-runtime` の `isApprovalNotFoundError` を優先してください。

例とフックリファレンスは [Plugin フック](/ja-JP/plugins/hooks) を参照してください。

## エージェントツールの登録

ツールは、LLM が呼び出せる型付き関数です。必須 (常に
利用可能) または任意 (ユーザーのオプトイン) にできます。

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
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

OpenClaw は登録済みツールから検証済みディスクリプターを取得してキャッシュするため、Plugin はマニフェスト内で `description` やスキーマデータを重複させません。マニフェスト契約は所有権と検出だけを宣言し、実行時には引き続きライブの登録済みツール実装を呼び出します。
`api.registerTool(..., { optional: true })` で登録したツールには `toolMetadata.<tool>.optional: true` を設定してください。これにより、ツールが明示的に許可リストに追加されるまで、OpenClaw はその Plugin ランタイムの読み込みを回避できます。

ユーザーは設定で任意ツールを有効にします。

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- ツール名はコアツールと衝突してはいけません（衝突はスキップされます）
- `parameters` の欠落を含む不正な登録オブジェクトを持つツールは、エージェント実行を壊す代わりにスキップされ、Plugin 診断で報告されます
- 副作用や追加のバイナリ要件があるツールには `optional: true` を使用します
- ユーザーは Plugin ID を `tools.allow` に追加することで、その Plugin のすべてのツールを有効にできます

## CLI コマンドの登録

Plugin は `api.registerCli` を使ってルート `openclaw` コマンドグループを追加できます。OpenClaw がすべての Plugin ランタイムを先行読み込みせずにコマンドを表示してルーティングできるよう、各トップレベルコマンドルートに `descriptors` を指定してください。

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

サブパスの完全なリファレンスは、[SDK 概要](/ja-JP/plugins/sdk-overview)を参照してください。

Plugin 内では、内部インポートにローカルのバレルファイル（`api.ts`、`runtime-api.ts`）を使用してください。自身の Plugin を SDK パス経由でインポートしてはいけません。

プロバイダー Plugin では、その継ぎ目が真に汎用でない限り、プロバイダー固有のヘルパーをそれらのパッケージルートのバレルに置いてください。現在バンドルされている例は次のとおりです。

- Anthropic: Claude ストリームラッパーと `service_tier` / ベータヘルパー
- OpenAI: プロバイダービルダー、デフォルトモデルヘルパー、リアルタイムプロバイダー
- OpenRouter: プロバイダービルダーとオンボーディング/設定ヘルパー

ヘルパーが 1 つのバンドル済みプロバイダーパッケージ内でのみ有用な場合は、`openclaw/plugin-sdk/*` に昇格させるのではなく、そのパッケージルートの継ぎ目に置いてください。

生成済みの `openclaw/plugin-sdk/<bundled-id>` ヘルパー継ぎ目の一部は、所有者による利用が追跡されている場合のバンドル済み Plugin メンテナンス用としてまだ存在します。これらは予約済みのサーフェスとして扱い、新しいサードパーティ Plugin のデフォルトパターンとして扱わないでください。

## 提出前チェックリスト

<Check>**package.json** に正しい `openclaw` メタデータがある</Check>
<Check>**openclaw.plugin.json** マニフェストが存在し、有効である</Check>
<Check>エントリーポイントが `defineChannelPluginEntry` または `definePluginEntry` を使用している</Check>
<Check>すべてのインポートが対象を絞った `plugin-sdk/<subpath>` パスを使用している</Check>
<Check>内部インポートが SDK 自己インポートではなくローカルモジュールを使用している</Check>
<Check>テストが成功する（`pnpm test -- <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` が成功する（リポジトリ内 Plugin）</Check>

## ベータリリーステスト

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) の GitHub リリースタグを監視し、`Watch` > `Releases` で購読してください。ベータタグは `v2026.3.N-beta.1` のような形式です。リリース告知のために、公式 OpenClaw X アカウント [@openclaw](https://x.com/openclaw) の通知を有効にすることもできます。
2. ベータタグが表示されたらすぐに、自分の Plugin をそのベータタグに対してテストしてください。安定版までの猶予は通常数時間だけです。
3. テスト後、`plugin-forum` Discord チャンネル内の自分の Plugin スレッドに、`all good` または壊れた内容を投稿してください。まだスレッドがない場合は作成してください。
4. 何かが壊れた場合は、`Beta blocker: <plugin-name> - <summary>` というタイトルの issue を開くか更新し、`beta-blocker` ラベルを付けてください。issue リンクを自分のスレッドに貼ってください。
5. `main` に対して `fix(<plugin-id>): beta blocker - <summary>` というタイトルの PR を開き、PR と自分の Discord スレッドの両方で issue をリンクしてください。コントリビューターは PR にラベルを付けられないため、タイトルがメンテナーと自動化に対する PR 側のシグナルになります。PR があるブロッカーはマージされます。PR がないブロッカーはそのまま出荷される可能性があります。メンテナーはベータテスト中にこれらのスレッドを監視します。
6. 沈黙は問題なしを意味します。期限を逃した場合、修正は次のサイクルに入る可能性が高いです。

## 次のステップ

<CardGroup cols={2}>
  <Card title="チャネル Plugin" icon="messages-square" href="/ja-JP/plugins/sdk-channel-plugins">
    メッセージングチャネル Plugin を構築する
  </Card>
  <Card title="プロバイダー Plugin" icon="cpu" href="/ja-JP/plugins/sdk-provider-plugins">
    モデルプロバイダー Plugin を構築する
  </Card>
  <Card title="SDK 概要" icon="book-open" href="/ja-JP/plugins/sdk-overview">
    インポートマップと登録 API リファレンス
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

- [Plugin アーキテクチャ](/ja-JP/plugins/architecture) — 内部アーキテクチャの詳細
- [SDK 概要](/ja-JP/plugins/sdk-overview) — Plugin SDK リファレンス
- [マニフェスト](/ja-JP/plugins/manifest) — Plugin マニフェスト形式
- [チャネル Plugin](/ja-JP/plugins/sdk-channel-plugins) — チャネル Plugin の構築
- [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins) — プロバイダー Plugin の構築

---
doc-schema-version: 1
read_when:
    - 新しい OpenClaw plugin を作成する必要があります
    - Plugin 開発のクイックスタートが必要です
    - channel、プロバイダー、CLI バックエンド、ツール、またはフックのドキュメントから選択しています
sidebarTitle: Getting Started
summary: 数分で最初のOpenClaw Pluginを作成する
title: Plugin の構築
x-i18n:
    generated_at: "2026-06-27T12:09:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8991b9e857af76b4fecc15a5feb9bd6659af91a4b7518f59c83ca091dc7f705c
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin は、コアを変更せずに OpenClaw を拡張します。Plugin は、メッセージング
チャネル、モデルプロバイダー、ローカル CLI バックエンド、エージェントツール、フック、メディアプロバイダー、
または別の Plugin 所有の機能を追加できます。

外部 Plugin を OpenClaw リポジトリに追加する必要はありません。パッケージを
[ClawHub](/ja-JP/clawhub) に公開すると、ユーザーは次のようにインストールできます。

```bash
openclaw plugins install clawhub:<package-name>
```

ローンチ移行中は、裸のパッケージ指定でも引き続き npm からインストールされます。
ClawHub 解決を使いたい場合は、`clawhub:` プレフィックスを使用してください。

## 要件

- Node 22.19 以降と、`npm` や `pnpm` などのパッケージマネージャーを使用します。
- TypeScript ESM モジュールに慣れている必要があります。
- リポジトリ内のバンドル Plugin を扱う場合は、リポジトリをクローンして `pnpm install` を実行します。
  OpenClaw は `extensions/*` ワークスペースパッケージからバンドル
  Plugin を読み込むため、ソースチェックアウトでの Plugin 開発は pnpm 専用です。

## Plugin の形を選ぶ

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/ja-JP/plugins/sdk-channel-plugins">
    OpenClaw をメッセージングプラットフォームに接続します。
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/ja-JP/plugins/sdk-provider-plugins">
    モデル、メディア、検索、取得、音声、またはリアルタイムプロバイダーを追加します。
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/ja-JP/plugins/cli-backend-plugins">
    OpenClaw のモデルフォールバックを通じてローカル AI CLI を実行します。
  </Card>
  <Card title="Tool plugin" icon="wrench" href="/ja-JP/plugins/tool-plugins">
    エージェントツールを登録します。
  </Card>
</CardGroup>

## クイックスタート

必須のエージェントツールを 1 つ登録して、最小構成のツール Plugin を構築します。これは
最短で実用的な Plugin 形状であり、パッケージ、マニフェスト、エントリーポイント、
ローカルでの証明を示します。

<Steps>
  <Step title="Create package metadata">
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

    公開済みの外部 Plugin は、ランタイムエントリーをビルド済み JavaScript
    ファイルに向ける必要があります。完全なエントリーポイント契約については
    [SDK entry points](/ja-JP/plugins/sdk-entrypoints) を参照してください。

    設定がない場合でも、すべての Plugin にはマニフェストが必要です。ランタイムツールは
    `contracts.tools` に含める必要があります。これにより、OpenClaw はすべての
    Plugin ランタイムを先に読み込まずに所有権を検出できます。`activation.onStartup`
    は意図を持って設定してください。この例は Gateway 起動時に開始します。

    ホストに信頼される Plugin サーフェスもマニフェストで制御され、インストール済み
    Plugin では明示的な有効化が必要です。インストール済み Plugin が
    `api.registerAgentToolResultMiddleware(...)` を登録する場合は、対象の各ランタイムを
    `contracts.agentToolResultMiddleware` に宣言します。`api.registerTrustedToolPolicy(...)`
    を登録する場合は、各ポリシー ID を `contracts.trustedToolPolicies` に宣言します。
    これらの宣言により、インストール時の検査とランタイム登録の整合性が保たれます。

    すべてのマニフェストフィールドについては、[Plugin manifest](/ja-JP/plugins/manifest) を参照してください。

  </Step>

  <Step title="Register the tool">
    ```typescript index.ts
    import { Type } from "typebox";
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Echo one input value",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return {
              content: [{ type: "text", text: `Got: ${params.input}` }],
            };
          },
        });
      },
    });
    ```

    非チャネル Plugin には `definePluginEntry` を使用します。チャネル Plugin では
    `defineChannelPluginEntry` を使用します。

  </Step>

  <Step title="Test the runtime">
    インストール済みまたは外部 Plugin の場合は、読み込まれたランタイムを検査します。

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Plugin が CLI コマンドを登録する場合は、そのコマンドも実行します。たとえば、
    デモコマンドには `openclaw demo-plugin ping` のような実行証明が必要です。

    このリポジトリ内のバンドル Plugin の場合、OpenClaw は `extensions/*` ワークスペースから
    ソースチェックアウト Plugin パッケージを検出します。最も近い対象テストを実行します。

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Publish">
    公開前にパッケージを検証します。

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    正規の ClawHub スニペットは `docs/snippets/plugin-publish/` にあります。

  </Step>

  <Step title="Install">
    公開済みパッケージを ClawHub 経由でインストールします。

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## ツールの登録

ツールは必須または任意にできます。必須ツールは、Plugin が有効な場合は常に利用可能です。
任意ツールにはユーザーのオプトインが必要です。

```typescript
register(api) {
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

`api.registerTool(...)` で登録するすべてのツールは、Plugin マニフェストでも
宣言する必要があります。

```json
{
  "contracts": {
    "tools": ["workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

ユーザーは `tools.allow` でオプトインします。

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

任意ツールは、ツールをモデルに公開するかどうかを制御します。モデルがツールを選択した後、
アクションの実行前にツールやフックで承認を求める必要がある場合は、
[plugin permission requests](/ja-JP/plugins/plugin-permission-requests) を使用します。

副作用、通常でないバイナリ、またはデフォルトで公開すべきでない機能には任意ツールを使用します。
ツール名はコアツールと競合してはなりません。競合はスキップされ、Plugin 診断で報告されます。
`parameters` のないツール記述子を含む不正な登録も、同じ方法でスキップされ報告されます。
登録されたツールは、ポリシーと許可リストのチェックを通過した後にモデルが呼び出せる型付き関数です。

ツールファクトリは、ランタイムから提供されるコンテキストオブジェクトを受け取ります。現在のターンで
アクティブなモデルに応じてツールがログ出力、表示、または適応する必要がある場合は、`ctx.activeModel`
を使用します。このオブジェクトには `provider`、`modelId`、`modelRef` が含まれることがあります。
これは情報提供用のランタイムメタデータとして扱い、ローカルオペレーター、インストール済み
Plugin コード、または変更された OpenClaw ランタイムに対するセキュリティ境界として扱わないでください。
機密性の高いローカルツールでは、引き続き明示的な Plugin またはオペレーターのオプトインを必須とし、
アクティブモデルのメタデータが存在しない、または適切でない場合はフェイルクローズする必要があります。

マニフェストは所有権と検出を宣言します。実行時には、ライブ登録されたツール実装が引き続き呼び出されます。
OpenClaw がそのツールが明示的に許可リストに追加されるまで Plugin ランタイムの読み込みを避けられるように、
`toolMetadata.<tool>.optional: true` と `api.registerTool(..., { optional: true })`
を一致させてください。

## インポート規約

焦点を絞った SDK サブパスからインポートします。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

非推奨のルートバレルからインポートしないでください。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Plugin パッケージ内では、内部インポートに `api.ts` や
`runtime-api.ts` などのローカルバレルファイルを使用します。自分の Plugin を
SDK パス経由でインポートしないでください。プロバイダー固有のヘルパーは、
その境界が本当に汎用でない限り、プロバイダーパッケージ内に置く必要があります。

カスタム Gateway RPC メソッドは高度なエントリーポイントです。Plugin 固有の
プレフィックスに保持してください。`config.*`、`exec.approvals.*`、
`operator.admin.*`、`wizard.*`、`update.*` などのコア管理名前空間は予約済みで、
`operator.admin` に解決されます。`openclaw/plugin-sdk/gateway-method-runtime`
ブリッジは、`contracts.gatewayMethodDispatch: ["authenticated-request"]` を宣言する
Plugin HTTP ルート用に予約されています。

完全なインポートマップについては、[Plugin SDK overview](/ja-JP/plugins/sdk-overview) を参照してください。

## 提出前チェックリスト

<Check>**package.json** に正しい `openclaw` メタデータがある</Check>
<Check>**openclaw.plugin.json** マニフェストが存在し、有効である</Check>
<Check>エントリーポイントが `defineChannelPluginEntry` または `definePluginEntry` を使用している</Check>
<Check>すべてのインポートが焦点を絞った `plugin-sdk/<subpath>` パスを使用している</Check>
<Check>内部インポートが SDK の自己インポートではなく、ローカルモジュールを使用している</Check>
<Check>テストが通る（`pnpm test -- <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` が通る（リポジトリ内 Plugin）</Check>

## ベータリリースに対してテストする

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) の GitHub リリースタグを監視し、`Watch` > `Releases` で購読します。ベータタグは `v2026.3.N-beta.1` のような形式です。リリース告知のために、公式 OpenClaw X アカウント [@openclaw](https://x.com/openclaw) の通知をオンにすることもできます。
2. ベータタグが現れたらすぐに、そのベータタグに対して Plugin をテストします。安定版までの猶予は通常数時間しかありません。
3. テスト後、`plugin-forum` Discord チャネル内の自分の Plugin のスレッドに、`all good` または壊れた内容を投稿します。まだスレッドがない場合は作成します。
4. 何かが壊れた場合は、`Beta blocker: <plugin-name> - <summary>` というタイトルの Issue を開くか更新し、`beta-blocker` ラベルを適用します。Issue リンクを自分のスレッドに貼ります。
5. `fix(<plugin-id>): beta blocker - <summary>` というタイトルで `main` への PR を開き、PR と Discord スレッドの両方で Issue をリンクします。コントリビューターは PR にラベルを付けられないため、タイトルがメンテナーと自動化に対する PR 側のシグナルになります。PR があるブロッカーはマージされます。PR がないブロッカーはそのまま出荷される可能性があります。メンテナーはベータテスト中にこれらのスレッドを監視します。
6. 無言はグリーンを意味します。この期間を逃した場合、修正は次のサイクルに入る可能性が高くなります。

## 次のステップ

<CardGroup cols={2}>
  <Card title="Channel Plugins" icon="messages-square" href="/ja-JP/plugins/sdk-channel-plugins">
    メッセージングチャネル Plugin を構築する
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
    TTS、検索、api.runtime 経由のサブエージェント
  </Card>
  <Card title="Testing" icon="test-tubes" href="/ja-JP/plugins/sdk-testing">
    テストユーティリティとパターン
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/ja-JP/plugins/manifest">
    完全なマニフェストスキーマリファレンス
  </Card>
</CardGroup>

## 関連

- [Plugin hooks](/ja-JP/plugins/hooks)
- [Plugin architecture](/ja-JP/plugins/architecture)

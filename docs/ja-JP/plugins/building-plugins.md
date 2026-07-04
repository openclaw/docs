---
doc-schema-version: 1
read_when:
    - 新しい OpenClaw plugin を作成したい場合
    - Plugin 開発のクイックスタートが必要です
    - channel、provider、CLI バックエンド、tool、hook の docs のどれを選ぶか判断している
sidebarTitle: Getting Started
summary: 数分で最初の OpenClaw Plugin を作成する
title: Pluginを構築する
x-i18n:
    generated_at: "2026-07-04T08:43:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2b5ad271e6a985c3bc8a5a39cfd540af1d8566178fb235fca0e29e4cee083148
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin は、core を変更せずに OpenClaw を拡張します。Plugin は、メッセージング
チャネル、モデルプロバイダー、ローカル CLI バックエンド、エージェントツール、フック、メディアプロバイダー、
または Plugin が所有する別の機能を追加できます。

外部 Plugin を OpenClaw リポジトリに追加する必要はありません。パッケージを
[ClawHub](/ja-JP/clawhub) に公開すると、ユーザーは次のコマンドでインストールできます。

```bash
openclaw plugins install clawhub:<package-name>
```

起動移行期間中は、裸のパッケージ指定も引き続き npm からインストールされます。
ClawHub 解決を使用したい場合は、`clawhub:` プレフィックスを使用してください。

## 要件

- Node 22.19+、Node 23.11+、または Node 24+ と、`npm` や `pnpm` などのパッケージマネージャーを使用します。
- TypeScript ESM モジュールに慣れていること。
- リポジトリ内のバンドル済み Plugin 作業では、リポジトリをクローンして `pnpm install` を実行します。
  OpenClaw は `extensions/*` ワークスペースパッケージからバンドル済み
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
    OpenClaw モデルフォールバックを通じてローカル AI CLI を実行します。
  </Card>
  <Card title="Tool plugin" icon="wrench" href="/ja-JP/plugins/tool-plugins">
    エージェントツールを登録します。
  </Card>
</CardGroup>

## クイックスタート

必須のエージェントツールを 1 つ登録して、最小限のツール Plugin を構築します。これは
最短で有用な Plugin 形態であり、パッケージ、マニフェスト、エントリポイント、
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

    公開済みの外部 Plugin では、ランタイムエントリがビルド済み JavaScript
    ファイルを指すようにしてください。完全なエントリポイント契約については
    [SDK entry points](/ja-JP/plugins/sdk-entrypoints) を参照してください。

    すべての Plugin には、設定がない場合でもマニフェストが必要です。OpenClaw が
    すべての Plugin ランタイムを先に読み込まずに所有権を検出できるように、ランタイムツールは
    `contracts.tools` に現れる必要があります。`activation.onStartup` は
    意図を持って設定してください。この例は Gateway 起動時に開始します。

    ホストが信頼する Plugin サーフェスもマニフェストで制限され、インストール済み
    Plugin では明示的な有効化が必要です。インストール済み Plugin が
    `api.registerAgentToolResultMiddleware(...)` を登録する場合は、対象ランタイムごとに
    `contracts.agentToolResultMiddleware` で宣言してください。`api.registerTrustedToolPolicy(...)`
    を登録する場合は、ポリシー ID ごとに
    `contracts.trustedToolPolicies` で宣言してください。これらの宣言により、インストール時の
    検査とランタイム登録が一致します。

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

    非チャネル Plugin には `definePluginEntry` を使用します。チャネル Plugin は
    `defineChannelPluginEntry` を使用します。

  </Step>

  <Step title="Test the runtime">
    インストール済みまたは外部 Plugin では、読み込まれたランタイムを検査します。

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Plugin が CLI コマンドを登録する場合は、そのコマンドも実行してください。たとえば、
    デモコマンドには `openclaw demo-plugin ping` のような実行証明が必要です。

    このリポジトリ内のバンドル済み Plugin では、OpenClaw は `extensions/*`
    ワークスペースからソースチェックアウトの Plugin パッケージを検出します。最も近い対象テストを
    実行します。

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

ツールには必須と任意があります。必須ツールは Plugin が有効な場合は常に利用できます。
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

`api.registerTool(...)` で登録されるすべてのツールは、Plugin
マニフェストでも宣言する必要があります。

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

任意ツールは、ツールをモデルに公開するかどうかを制御します。モデルがツールやフックを選択した後、
アクションが実行される前に承認を求める必要がある場合は、
[plugin permission requests](/ja-JP/plugins/plugin-permission-requests) を使用してください。

副作用、一般的でないバイナリ、またはデフォルトで公開すべきでない機能には任意ツールを使用します。
ツール名は core ツールと競合してはいけません。競合はスキップされ、Plugin 診断に報告されます。
`parameters` のないツール記述子を含む不正な登録もスキップされ、同じ方法で報告されます。
登録済みツールは、ポリシーと許可リストのチェックに合格した後にモデルが呼び出せる型付き関数です。

ツールファクトリは、ランタイムから提供されるコンテキストオブジェクトを受け取ります。ツールが現在の
ターンのアクティブモデルをログ記録、表示、またはそれに適応する必要がある場合は `ctx.activeModel`
を使用します。このオブジェクトには `provider`、`modelId`、`modelRef` を含めることができます。
これは情報提供用のランタイムメタデータとして扱い、ローカルオペレーター、インストール済み Plugin コード、
または変更された OpenClaw ランタイムに対するセキュリティ境界として扱わないでください。機密性の高いローカル
ツールでは、明示的な Plugin またはオペレーターのオプトインを引き続き要求し、アクティブモデルのメタデータが
ない、または不適切な場合は fail closed する必要があります。

マニフェストは所有権と検出を宣言します。実行時には、ライブ登録されたツール実装が引き続き呼び出されます。
OpenClaw がツールが明示的に許可リストに追加されるまでその Plugin ランタイムを読み込まないようにするため、
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
`runtime-api.ts` などのローカルバレルファイルを使用します。SDK パス経由で自分自身の Plugin を
インポートしないでください。プロバイダー固有のヘルパーは、その接点が本当に汎用でない限り、
プロバイダーパッケージ内に留める必要があります。

カスタム Gateway RPC メソッドは高度なエントリポイントです。Plugin 固有のプレフィックス上に
保持してください。`config.*`、`exec.approvals.*`、`operator.admin.*`、`wizard.*`、
`update.*` などの core 管理名前空間は予約済みのままで、
`operator.admin` に解決されます。
`openclaw/plugin-sdk/gateway-method-runtime` ブリッジは、
`contracts.gatewayMethodDispatch: ["authenticated-request"]` を宣言する Plugin HTTP
ルート専用です。

完全なインポートマップについては、[Plugin SDK overview](/ja-JP/plugins/sdk-overview) を参照してください。

## 提出前チェックリスト

<Check>**package.json** に正しい `openclaw` メタデータがある</Check>
<Check>**openclaw.plugin.json** マニフェストが存在し、有効である</Check>
<Check>エントリポイントが `defineChannelPluginEntry` または `definePluginEntry` を使用している</Check>
<Check>すべてのインポートが焦点を絞った `plugin-sdk/<subpath>` パスを使用している</Check>
<Check>内部インポートが SDK 自己インポートではなくローカルモジュールを使用している</Check>
<Check>テストが通る（`pnpm test -- <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` が通る（リポジトリ内 Plugin）</Check>

## ベータリリースに対するテスト

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) の GitHub リリースタグを監視し、`Watch` > `Releases` で購読します。ベータタグは `v2026.3.N-beta.1` のような形式です。リリース告知のために公式 OpenClaw X アカウント [@openclaw](https://x.com/openclaw) の通知を有効にすることもできます。
2. ベータタグが現れたらすぐに、Plugin をそのベータタグに対してテストします。stable までの猶予は通常数時間だけです。
3. テスト後、`plugin-forum` Discord チャネル内の自分の Plugin スレッドに、`all good` または壊れた内容を投稿します。まだスレッドがない場合は作成してください。
4. 何かが壊れた場合は、`Beta blocker: <plugin-name> - <summary>` というタイトルの issue を開くか更新し、`beta-blocker` ラベルを付けます。issue リンクをスレッドに貼ってください。
5. `main` に対して `fix(<plugin-id>): beta blocker - <summary>` というタイトルの PR を開き、PR と Discord スレッドの両方で issue をリンクします。コントリビューターは PR にラベルを付けられないため、タイトルがメンテナーと自動化に対する PR 側のシグナルになります。PR がある blocker はマージされます。PR がない blocker はそのまま出荷される可能性があります。メンテナーはベータテスト中にこれらのスレッドを監視します。
6. 沈黙は green を意味します。この期間を逃した場合、修正は次のサイクルに入る可能性が高くなります。

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
    `api.runtime` 経由の TTS、検索、サブエージェント
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

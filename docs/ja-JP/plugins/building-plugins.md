---
doc-schema-version: 1
read_when:
    - 新しい OpenClaw Plugin を作成したい場合
    - Plugin 開発のクイックスタートが必要です
    - チャネル、プロバイダー、CLI バックエンド、ツール、フックのいずれかに関するドキュメントを選択しています
sidebarTitle: Getting Started
summary: 数分で最初の OpenClaw Plugin を作成する
title: Plugin の構築
x-i18n:
    generated_at: "2026-07-11T22:24:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99ef2f22f8ae55614d835bc4309881ce264ab1a2287ac08af328e0b311d8fd9a
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin はコアを変更せずに OpenClaw を拡張します。Plugin では、メッセージング
チャネル、モデルプロバイダー、ローカル CLI バックエンド、エージェントツール、フック、メディアプロバイダー、
または Plugin が所有する別の機能を追加できます。

外部 Plugin を OpenClaw リポジトリに追加する必要はありません。パッケージを
[ClawHub](/clawhub) に公開すると、ユーザーは次のコマンドでインストールできます。

```bash
openclaw plugins install clawhub:<package-name>
```

移行期間中は、プレフィックスなしのパッケージ指定も引き続き npm からインストールされます。ClawHub による
解決を使用する場合は、`clawhub:` プレフィックスを使用してください。

## 要件

- Node 22.19+、Node 23.11+、または Node 24+ と、`npm` または `pnpm`。
- TypeScript ESM モジュール。
- リポジトリ内のバンドル済み Plugin を開発する場合は、リポジトリをクローンして `pnpm install` を実行します。
  OpenClaw は `extensions/*` ワークスペースパッケージからバンドル済み Plugin を
  検出するため、ソースチェックアウトでの Plugin 開発では pnpm のみを使用できます。

## Plugin の形式を選択する

<CardGroup cols={2}>
  <Card title="チャネル Plugin" icon="messages-square" href="/ja-JP/plugins/sdk-channel-plugins">
    OpenClaw をメッセージングプラットフォームに接続します。
  </Card>
  <Card title="プロバイダー Plugin" icon="cpu" href="/ja-JP/plugins/sdk-provider-plugins">
    モデル、メディア、検索、取得、音声、またはリアルタイムのプロバイダーを追加します。
  </Card>
  <Card title="CLI バックエンド Plugin" icon="terminal" href="/ja-JP/plugins/cli-backend-plugins">
    OpenClaw のモデルフォールバックを通じてローカル AI CLI を実行します。
  </Card>
  <Card title="ツール Plugin" icon="wrench" href="/ja-JP/plugins/tool-plugins">
    エージェントツールを登録します。
  </Card>
</CardGroup>

## クイックスタート

必須のエージェントツールを 1 つ登録して、最小構成のツール Plugin を構築します。これは
実用的な Plugin として最も簡潔な形式であり、パッケージ、マニフェスト、エントリーポイント、
ローカルでの検証を網羅します。

<Steps>
  <Step title="パッケージメタデータを作成する">
    <CodeGroup>

```json package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "typebox": "1.1.39"
  },
  "peerDependencies": {
    "openclaw": ">=2026.3.24-beta.2"
  },
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

    公開する外部 Plugin のランタイムエントリーは、ビルド済みの JavaScript
    ファイルを参照する必要があります。エントリーポイントの完全な規約については、
    [SDK エントリーポイント](/ja-JP/plugins/sdk-entrypoints)を参照してください。

    設定がなくても、すべての Plugin にマニフェストが必要です。OpenClaw が
    すべての Plugin ランタイムを先行して読み込まずに所有元を検出できるよう、
    ランタイムツールは `contracts.tools` に記載する必要があります。
    `activation.onStartup` は意図を持って設定してください。この例では Gateway の起動時に読み込みます。

    ホストが信頼する Plugin サーフェスもマニフェストによって制限され、インストール済み Plugin では
    明示的な宣言が必要です。`api.registerAgentToolResultMiddleware(...)` では対象となる各ランタイムを
    `contracts.agentToolResultMiddleware` に記載する必要があり、
    `api.registerTrustedToolPolicy(...)` では各ポリシー ID を
    `contracts.trustedToolPolicies` に記載する必要があります。これらの宣言により、インストール時の
    検査とランタイム登録の整合性が保たれます。

    各マニフェストフィールドについては、[Plugin マニフェスト](/ja-JP/plugins/manifest)を参照してください。

  </Step>

  <Step title="ツールを登録する">
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

    チャネル以外の Plugin には `definePluginEntry` を使用します。チャネル Plugin では、
    代わりに `openclaw/plugin-sdk/core` の `defineChannelPluginEntry` を使用します。

  </Step>

  <Step title="ランタイムをテストする">
    インストール済みまたは外部の Plugin では、読み込まれたランタイムを検査します。

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Plugin が CLI コマンドを登録する場合は、そのコマンドも実行して出力を確認します。
    たとえば `openclaw demo-plugin ping` です。

    このリポジトリ内のバンドル済み Plugin では、OpenClaw は `extensions/*` ワークスペースから
    ソースチェックアウトの Plugin パッケージを検出します。最も対象範囲の近いテストを
    実行してください。

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="パッケージのインストールをテストする">
    公開可能な Plugin を公開する前に、ユーザーが利用するものと同じインストール形式を
    テストします。まずビルド手順を追加し、`openclaw.extensions` などのランタイムエントリーが
    `./dist/index.js` のようなビルド済み JavaScript を参照するようにして、
    `npm pack` にその `dist/` 出力が含まれることを確認します。TypeScript ソースのエントリーは、
    ソースチェックアウトとローカル開発パスでのみ使用します。

    次に Plugin をパックし、`npm-pack:` を使用して tarball をインストールします。

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` は OpenClaw が管理する Plugin ごとの npm プロジェクトを使用するため、
    ソースチェックアウトでのテストでは見落とす可能性があるランタイム依存関係の誤りを検出できます。これは
    パッケージと依存関係の形式を検証するものであり、カタログに紐付いた公式の信頼性を検証するものではありません。
    ランタイムのインポートは `dependencies` または `optionalDependencies` に含める必要があります。
    `devDependencies` のみに残された依存関係は、管理対象のランタイムプロジェクトには
    インストールされません。

    公式または特権的な Plugin の動作を最終検証する際に、生のアーカイブやパスによる
    インストールを使用しないでください。生のソースはローカルでのデバッグには便利ですが、
    npm または ClawHub によるインストールと同じ依存関係パスを検証するものではありません。
    Plugin が信頼済みの公式 Plugin ステータスに依存する場合は、カタログに裏付けられた
    公式インストール、または公式の信頼性を記録する公開済みパッケージのパスを通じて
    2 つ目の検証を追加してください。インストールルートと依存関係の所有権の詳細については、
    [Plugin の依存関係解決](/ja-JP/plugins/dependency-resolution)を参照してください。

  </Step>

  <Step title="公開する">
    公開前にパッケージを検証します。

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    正式な ClawHub パッケージのスニペットは `docs/snippets/plugin-publish/` にあります。

  </Step>

  <Step title="インストールする">
    公開済みパッケージを ClawHub 経由でインストールします。

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## ツールを登録する

ツールには必須と任意があります。Plugin が有効な場合、必須ツールは常に利用できます。
任意ツールでは、OpenClaw が所有元の Plugin ランタイムを読み込む前に、
ユーザーによる明示的なオプトインが必要です。

ツールファクトリは、信頼されたランタイムコンテキストを受け取ります。これには `deliveryContext`、
利用可能な場合はアクティブなプラットフォーム会話の `nativeChannelId`、
および `requesterSenderId` が含まれます。

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
  tools: { allow: ["workflow_tool"] }, // または 1 つの Plugin のすべてのツールには ["my-plugin"]
}
```

任意ツールは、ツールをモデルに公開するかどうかを制御します。モデルがツールまたはフックを選択した後、
アクションを実行する前に承認を求める必要がある場合は、
[Plugin 権限リクエスト](/ja-JP/plugins/plugin-permission-requests)を使用してください。

副作用、一般的でないバイナリ、またはデフォルトで公開すべきでない機能には、
任意ツールを使用します。ツール名はコアツール名と競合してはなりません。競合する登録はスキップされ、
Plugin の診断で報告されます。不正な登録も同様にスキップされて報告されます。これには、
空でない `name` がない場合、`execute` が関数でない場合、またはツール記述子に
`parameters` オブジェクトがない場合が該当します。

ツールファクトリは、ランタイムから提供されるコンテキストオブジェクトを受け取ります。現在のターンで
アクティブなモデルに応じてログ記録、表示、または動作調整を行う必要があるツールでは、
`ctx.activeModel` を使用します。これには `provider`、`modelId`、`modelRef` が含まれる場合があります。
これは情報提供用のランタイムメタデータとして扱い、ローカルオペレーター、インストール済みの Plugin コード、
または変更された OpenClaw ランタイムに対するセキュリティ境界として扱わないでください。機密性の高い
ローカルツールでは、引き続き Plugin またはオペレーターによる明示的なオプトインを必須とし、
アクティブモデルのメタデータが欠けているか不適切な場合は、安全側に停止する必要があります。

マニフェストは所有権と検出を宣言しますが、実行時には引き続き登録済みの実際の
ツール実装が呼び出されます。OpenClaw がツールを明示的に許可リストへ追加するまで
その Plugin ランタイムの読み込みを回避できるよう、`toolMetadata.<tool>.optional: true` と
`api.registerTool(..., { optional: true })` の整合性を保ってください。

## インポート規約

対象を限定した SDK サブパスからインポートします。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

非推奨のルートバレルからインポートしないでください。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Plugin パッケージ内では、内部インポートに `api.ts` や
`runtime-api.ts` などのローカルバレルファイルを使用します。SDK パスを通じて
自分自身の Plugin をインポートしないでください。プロバイダー固有のヘルパーは、
その境界が真に汎用的でない限り、プロバイダーパッケージ内に置いてください。

カスタム Gateway RPC メソッドは高度なエントリーポイントです。Plugin 固有の
プレフィックスを付けてください。`config.*`、`exec.approvals.*`、
`operator.admin.*`、`wizard.*`、`update.*` などのコア管理名前空間は予約済みであり、
`operator.admin` に解決されます。
`openclaw/plugin-sdk/gateway-method-runtime` ブリッジは、
`contracts.gatewayMethodDispatch: ["authenticated-request"]` を宣言する Plugin HTTP
ルート専用です。

完全なインポートマップについては、[Plugin SDK の概要](/ja-JP/plugins/sdk-overview)を参照してください。

## 提出前チェックリスト

<Check>**package.json** に正しい `openclaw` メタデータがある</Check>
<Check>**openclaw.plugin.json** マニフェストが存在し、有効である</Check>
<Check>エントリーポイントで `defineChannelPluginEntry` または `definePluginEntry` を使用している</Check>
<Check>すべてのインポートで対象を限定した `plugin-sdk/<subpath>` パスを使用している</Check>
<Check>内部インポートで SDK を介した自己インポートではなく、ローカルモジュールを使用している</Check>
<Check>テストに合格する（`pnpm test <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` に合格する（リポジトリ内の Plugin）</Check>

## ベータリリースに対してテストする

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) のリリースをウォッチします（`Watch` > `Releases`）。ベータタグは `v2026.3.N-beta.1` のような形式です。リリースのお知らせについては、X で [@openclaw](https://x.com/openclaw) をフォローすることもできます。
2. ベータタグが公開されたら、すぐに Plugin をそのタグに対してテストします。安定版までの期間は通常、わずか数時間です。
3. テスト後、`plugin-forum` Discord チャンネル（[discord.gg/clawd](https://discord.gg/clawd)）にある自分の Plugin のスレッドへ、`all good` または問題が発生した内容を投稿します。まだスレッドがない場合は作成してください。
4. 問題が発生した場合は、`Beta blocker: <plugin-name> - <summary>` というタイトルで Issue を作成または更新し、`beta-blocker` ラベルを付けます。スレッドにその Issue へのリンクを記載してください。
5. `fix(<plugin-id>): beta blocker - <summary>` というタイトルで `main` 向けの PR を作成し、PR と Discord スレッドの両方に Issue へのリンクを記載します。コントリビューターは PR にラベルを付けられないため、このタイトルがメンテナーと自動化に対する PR 側のシグナルとなります。PR があるブロッカーはマージされますが、PR がないブロッカーがあっても、そのままリリースされる可能性があります。
6. 連絡がなければ問題なしと見なされます。この期間を逃すと、通常、修正は次のサイクルで取り込まれます。

## 次のステップ

<CardGroup cols={2}>
  <Card title="チャンネル Plugin" icon="messages-square" href="/ja-JP/plugins/sdk-channel-plugins">
    メッセージングチャンネル Plugin を構築する
  </Card>
  <Card title="プロバイダー Plugin" icon="cpu" href="/ja-JP/plugins/sdk-provider-plugins">
    モデルプロバイダー Plugin を構築する
  </Card>
  <Card title="CLI バックエンド Plugin" icon="terminal" href="/ja-JP/plugins/cli-backend-plugins">
    ローカル AI CLI バックエンドを登録する
  </Card>
  <Card title="SDK の概要" icon="book-open" href="/ja-JP/plugins/sdk-overview">
    インポートマップと登録 API のリファレンス
  </Card>
  <Card title="ランタイムヘルパー" icon="settings" href="/ja-JP/plugins/sdk-runtime">
    api.runtime を介した TTS、検索、サブエージェント
  </Card>
  <Card title="テスト" icon="test-tubes" href="/ja-JP/plugins/sdk-testing">
    テスト用ユーティリティとパターン
  </Card>
  <Card title="Plugin マニフェスト" icon="file-json" href="/ja-JP/plugins/manifest">
    完全なマニフェストスキーマのリファレンス
  </Card>
</CardGroup>

## 関連項目

- [Plugin フック](/ja-JP/plugins/hooks)
- [Plugin アーキテクチャ](/ja-JP/plugins/architecture)

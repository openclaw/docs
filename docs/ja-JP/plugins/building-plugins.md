---
doc-schema-version: 1
read_when:
    - 新しい OpenClaw Plugin を作成したい
    - Plugin 開発のクイックスタートが必要です
    - チャネル、プロバイダー、CLI バックエンド、ツール、またはフックのドキュメントから選択しています
sidebarTitle: Getting Started
summary: 数分で最初の OpenClaw plugin を作成する
title: Plugin の構築
x-i18n:
    generated_at: "2026-07-05T11:30:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 71634f848091562bb2c1f5d3aa92a2b623beac190e3bd0b56cc01a1e333143b4
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugins は core を変更せずに OpenClaw を拡張します。Plugin は messaging
channel、model provider、local CLI backend、agent tool、hook、media provider、
または別の Plugin 所有の capability を追加できます。

外部 Plugin を OpenClaw リポジトリに追加する必要はありません。package を
[ClawHub](/clawhub) に公開すると、ユーザーは次のようにインストールできます。

```bash
openclaw plugins install clawhub:<package-name>
```

launch cutover の間は、bare package spec も引き続き npm からインストールされます。
ClawHub 解決を使いたい場合は、`clawhub:` prefix を使用します。

## 要件

- Node 22.19+、Node 23.11+、または Node 24+、および `npm` または `pnpm`。
- TypeScript ESM modules。
- in-repo bundled plugin の作業では、リポジトリを clone して `pnpm install` を実行します。
  OpenClaw は `extensions/*` workspace packages から bundled plugins を検出するため、
  source-checkout plugin 開発は pnpm のみです。

## Plugin の形を選ぶ

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/ja-JP/plugins/sdk-channel-plugins">
    OpenClaw を messaging platform に接続します。
  </Card>
  <Card title="Provider plugin" icon="cpu" href="/ja-JP/plugins/sdk-provider-plugins">
    model、media、search、fetch、speech、または realtime provider を追加します。
  </Card>
  <Card title="CLI backend plugin" icon="terminal" href="/ja-JP/plugins/cli-backend-plugins">
    OpenClaw model fallback を通じて local AI CLI を実行します。
  </Card>
  <Card title="Tool plugin" icon="wrench" href="/ja-JP/plugins/tool-plugins">
    agent tools を登録します。
  </Card>
</CardGroup>

## クイックスタート

必須の agent tool を 1 つ登録して、最小限の tool plugin を構築します。これは
最短で有用な Plugin の形であり、package、manifest、entry point、local proof を
対象にします。

<Steps>
  <Step title="Create package metadata">
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

    公開済みの外部 Plugin は、runtime entries が built JavaScript
    files を指すようにする必要があります。entry point contract 全体については
    [SDK entry points](/ja-JP/plugins/sdk-entrypoints) を参照してください。

    config がない場合でも、すべての Plugin には manifest が必要です。Runtime tools は
    `contracts.tools` に含める必要があります。これにより OpenClaw は
    すべての plugin runtime を eager loading せずに ownership を検出できます。
    `activation.onStartup` は意図して設定してください。この例では Gateway startup 時に読み込みます。

    Host-trusted plugin surfaces も manifest-gated であり、installed plugins では明示的な宣言が必要です:
    `api.registerAgentToolResultMiddleware(...)` では各 target runtime を
    `contracts.agentToolResultMiddleware` に列挙する必要があり、
    `api.registerTrustedToolPolicy(...)` では各 policy id を
    `contracts.trustedToolPolicies` に含める必要があります。これらの宣言により、
    install-time inspection と runtime registration の整合性が保たれます。

    すべての manifest field については、[Plugin manifest](/ja-JP/plugins/manifest) を参照してください。

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

    non-channel plugins には `definePluginEntry` を使用します。Channel plugins は代わりに
    `openclaw/plugin-sdk/core` の `defineChannelPluginEntry` を使用します。

  </Step>

  <Step title="Test the runtime">
    installed plugin または external plugin の場合、loaded runtime を inspect します。

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Plugin が CLI command を登録する場合は、その command も実行し、
    output を確認します。例: `openclaw demo-plugin ping`。

    このリポジトリ内の bundled plugin では、OpenClaw は `extensions/*` workspace から
    source-checkout plugin packages を検出します。最も近い targeted test を実行します。

    ```bash
    pnpm test extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Test the package install">
    package-ready plugin を公開する前に、ユーザーが受け取るものと同じ install shape をテストします。
    まず build step を追加し、`openclaw.extensions` などの runtime entries が
    `./dist/index.js` のような built JavaScript を指すようにし、
    `npm pack` にその `dist/` output が含まれることを確認します。TypeScript source entries は
    source checkouts と local development paths 専用です。

    次に Plugin を pack し、`npm-pack:` で tarball をインストールします。

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` は OpenClaw の managed per-plugin npm project を使用するため、
    source checkout testing では隠れる可能性がある runtime dependency の誤りを検出します。
    これは package と dependency shape を証明するものであり、catalog-linked official trust を証明するものではありません。
    Runtime imports は `dependencies` または `optionalDependencies` に含める必要があります。
    `devDependencies` のみに残された dependencies は、managed runtime project にはインストールされません。

    official または privileged plugin behavior の最終 proof として raw archive/path install を使用しないでください。
    Raw sources は local debugging には有用ですが、npm または ClawHub installs と同じ dependency path を証明しません。
    Plugin が trusted official plugin status に依存する場合は、catalog-backed official install または
    official trust を記録する published package path を通じて、2 つ目の proof を追加してください。
    install-root と dependency ownership の詳細については
    [Plugin dependency resolution](/ja-JP/plugins/dependency-resolution) を参照してください。

  </Step>

  <Step title="Publish">
    公開前に package を検証します。

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    Canonical ClawHub package snippets は `docs/snippets/plugin-publish/` にあります。

  </Step>

  <Step title="Install">
    公開済み package を ClawHub 経由でインストールします。

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## tools の登録

Tools には required と optional があります。Required tools は
Plugin が有効なとき常に利用できます。Optional tools は、OpenClaw が
所有する plugin runtime を読み込む前に、ユーザーによる明示的な opt-in が必要です。

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

`api.registerTool(...)` で登録されるすべての tool は、plugin manifest でも宣言する必要があります。

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

ユーザーは `tools.allow` で opt in します。

```json5
{
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for every tool from one plugin
}
```

Optional tools は、tool を model に公開するかどうかを制御します。model が選択した後、
action が実行される前に tool または hook が approval を求める必要がある場合は、
[plugin permission requests](/ja-JP/plugins/plugin-permission-requests) を使用します。

side effects、unusual binaries、またはデフォルトで公開すべきではない capabilities には
optional tools を使用します。Tool names は core tool names と競合してはいけません。
競合は skipped され、plugin diagnostics に報告されます。Malformed registrations も同じ方法で
skipped され、報告されます。つまり、空でない `name` がない場合、`execute` が function でない場合、
または tool descriptor に `parameters` object がない場合です。

Tool factories は runtime-supplied context object を受け取ります。現在の turn の active model に応じて
tool が log、display、または adapt する必要がある場合は `ctx.activeModel` を使用します。
これには `provider`、`modelId`、`modelRef` が含まれる場合があります。これは informational runtime metadata として扱い、
local operator、installed plugin code、または modified OpenClaw runtime に対する security boundary として扱わないでください。
Sensitive local tools では、引き続き明示的な plugin または operator opt-in を要求し、
active-model metadata がない、または不適切な場合は fail closed する必要があります。

manifest は ownership と discovery を宣言します。execution は引き続き live
registered tool implementation を呼び出します。`toolMetadata.<tool>.optional: true` を
`api.registerTool(..., { optional: true })` と合わせておくことで、OpenClaw は
その tool が明示的に allowlist されるまで plugin runtime の読み込みを避けられます。

## Import conventions

focused SDK subpaths から import します。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

deprecated root barrel から import しないでください。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Plugin package 内では、internal imports に `api.ts` や `runtime-api.ts` などの local barrel files を使用します。
自分の Plugin を SDK path 経由で import しないでください。Provider-specific helpers は、
seam が本当に generic でない限り provider package 内に置く必要があります。

Custom Gateway RPC methods は advanced entry point です。plugin-specific prefix に置いてください。
`config.*`、`exec.approvals.*`、`operator.admin.*`、`wizard.*`、`update.*` などの core admin namespaces は
reserved のままで、`operator.admin` に解決されます。
`openclaw/plugin-sdk/gateway-method-runtime` bridge は、
`contracts.gatewayMethodDispatch: ["authenticated-request"]` を宣言する plugin HTTP routes のために予約されています。

import map 全体については、[Plugin SDK overview](/ja-JP/plugins/sdk-overview) を参照してください。

## 提出前チェックリスト

<Check>**package.json** に正しい `openclaw` metadata がある</Check>
<Check>**openclaw.plugin.json** manifest が存在し、有効である</Check>
<Check>Entry point が `defineChannelPluginEntry` または `definePluginEntry` を使用している</Check>
<Check>すべての imports が focused `plugin-sdk/<subpath>` paths を使用している</Check>
<Check>Internal imports が SDK self-imports ではなく local modules を使用している</Check>
<Check>Tests が通る (`pnpm test <bundled-plugin-root>/my-plugin/`)</Check>
<Check>`pnpm check` が通る (in-repo plugins)</Check>

## beta releases に対してテストする

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) のリリースをウォッチします（`Watch` > `Releases`）。ベータタグは `v2026.3.N-beta.1` のような形式です。リリース告知は X の [@openclaw](https://x.com/openclaw) でもフォローできます。
2. ベータタグが表示されたら、すぐに自分の Plugin をそのタグに対してテストします。安定版までの期間は通常数時間しかありません。
3. テスト後、`plugin-forum` Discord チャンネル（[discord.gg/clawd](https://discord.gg/clawd)）にある自分の Plugin のスレッドに、`all good` または壊れた内容を投稿します。まだスレッドがない場合は作成します。
4. 何かが壊れた場合は、`Beta blocker: <plugin-name> - <summary>` というタイトルの issue を開くか更新し、`beta-blocker` ラベルを適用します。その issue を自分のスレッドにリンクします。
5. `fix(<plugin-id>): beta blocker - <summary>` というタイトルで `main` への PR を開き、PR と Discord スレッドの両方で issue をリンクします。コントリビューターは PR にラベルを付けられないため、タイトルがメンテナーと自動化に対する PR 側のシグナルになります。PR があるブロッカーはマージされますが、PR がないブロッカーはそのまま出荷される可能性があります。
6. 沈黙は問題なしを意味します。この期間を逃すと、通常は修正が次のサイクルに入ります。

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

- [Plugin フック](/ja-JP/plugins/hooks)
- [Plugin アーキテクチャ](/ja-JP/plugins/architecture)

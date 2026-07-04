---
doc-schema-version: 1
read_when:
    - 新しい OpenClaw Plugin を作成する
    - Plugin 開発のクイックスタートが必要です
    - チャンネル、プロバイダー、CLI バックエンド、ツール、またはフックのドキュメントから選択しています
sidebarTitle: Getting Started
summary: 数分で最初の OpenClaw Plugin を作成する
title: Pluginの構築
x-i18n:
    generated_at: "2026-07-04T15:08:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4bceff518e0b2b3b06573a96edb2af65bbe8662d049323045cd1c80fc6f328f
    source_path: plugins/building-plugins.md
    workflow: 16
---

Plugin は、core を変更せずに OpenClaw を拡張します。Plugin は、メッセージング
channel、model provider、local CLI backend、agent tool、hook、media provider、
または別の Plugin 所有の capability を追加できます。

外部 Plugin を OpenClaw リポジトリに追加する必要はありません。package を
[ClawHub](/ja-JP/clawhub) に公開すると、ユーザーは次のコマンドでインストールできます。

```bash
openclaw plugins install clawhub:<package-name>
```

launch cutover の間は、bare package spec も引き続き npm からインストールされます。ClawHub 解決を使いたい場合は、
`clawhub:` prefix を使用してください。

## 要件

- Node 22.19+、Node 23.11+、または Node 24+ と、`npm` や `pnpm` などの package manager を使用してください。
- TypeScript ESM modules に慣れている必要があります。
- リポジトリ内の bundled plugin 作業では、リポジトリを clone して `pnpm install` を実行してください。
  source-checkout plugin 開発は pnpm のみです。OpenClaw は bundled
  plugins を `extensions/*` workspace packages から読み込むためです。

## Plugin の形を選ぶ

<CardGroup cols={2}>
  <Card title="Channel plugin" icon="messages-square" href="/ja-JP/plugins/sdk-channel-plugins">
    OpenClaw をメッセージング platform に接続します。
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

必須の agent tool を 1 つ登録して、最小構成の tool plugin を作成します。これは
実用的な Plugin 形態として最短であり、package、manifest、entry point、
local proof を示します。

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

    公開済みの外部 Plugins では、runtime entries が build 済み JavaScript
    files を指すようにしてください。完全な entry
    point contract については、[SDK entry points](/ja-JP/plugins/sdk-entrypoints) を参照してください。

    すべての Plugin には、config がない場合でも manifest が必要です。Runtime tools は
    `contracts.tools` に含める必要があります。これにより、OpenClaw は
    すべての Plugin runtime を eagerly loading せずに ownership を discovery できます。
    `activation.onStartup` は意図的に設定してください。この例は Gateway startup 時に起動します。

    Host-trusted plugin surfaces も manifest-gated であり、インストール済み Plugins では明示的な
    enablement が必要です。インストール済み Plugin が
    `api.registerAgentToolResultMiddleware(...)` を登録する場合は、各 target runtime を
    `contracts.agentToolResultMiddleware` で宣言してください。`api.registerTrustedToolPolicy(...)` を登録する場合は、
    各 policy id を `contracts.trustedToolPolicies` で宣言してください。これらの宣言により、install-time
    inspection と runtime registration の整合性が保たれます。

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

    non-channel Plugins には `definePluginEntry` を使用してください。Channel plugins は
    `defineChannelPluginEntry` を使用します。

  </Step>

  <Step title="Test the runtime">
    インストール済みまたは外部 Plugin では、読み込まれた runtime を inspect します。

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    Plugin が CLI command を登録する場合は、その command も実行してください。たとえば、
    demo command には `openclaw demo-plugin ping` のような execution proof が必要です。

    このリポジトリ内の bundled plugin では、OpenClaw は `extensions/*` workspace から
    source-checkout plugin packages を discovery します。最も近い targeted
    test を実行してください。

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="Test the package install">
    package-ready plugin を公開する前に、ユーザーが利用するものと同じ install 形態をテストします。
    まず build step を追加し、`openclaw.extensions` などの runtime entries が
    `./dist/index.js` のような build 済み JavaScript を指すようにし、
    `npm pack` にその `dist/` output が含まれることを確認します。TypeScript source entries は
    source checkouts と local development paths 専用です。

    次に Plugin を pack し、`npm-pack:` で tarball をインストールします。

    ```bash
    npm pack --pack-destination /tmp
    openclaw plugins install npm-pack:/tmp/<plugin-package>.tgz --force
    openclaw plugins inspect my-plugin --runtime --json
    ```

    `npm-pack:` は OpenClaw の managed per-plugin npm project を使用するため、
    source checkout testing では隠れがちな runtime dependency の誤りを検出できます。これは
    package と dependency の形を証明するものであり、catalog-linked official trust を証明するものではありません。
    Runtime imports は `dependencies` または `optionalDependencies` に含める必要があります。
    `devDependencies` だけに残された dependencies は、managed runtime project にはインストールされません。

    official または privileged plugin behavior の最終 proof として raw archive/path install を使用しないでください。
    Raw sources は local debugging には便利ですが、
    npm または ClawHub installs と同じ dependency path を証明しません。
    Plugin が trusted official plugin status に依存する場合は、
    catalog-backed official install または official trust を記録する published package path を通じた 2 つ目の proof を追加してください。
    install-root と dependency ownership の詳細については、
    [Plugin dependency resolution](/ja-JP/plugins/dependency-resolution) を参照してください。

  </Step>

  <Step title="Publish">
    公開前に package を検証します。

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    canonical ClawHub snippets は `docs/snippets/plugin-publish/` にあります。

  </Step>

  <Step title="Install">
    ClawHub を通じて公開済み package をインストールします。

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## tools の登録

Tools は required または optional にできます。Required tools は、
Plugin が enabled のとき常に利用できます。Optional tools は user opt-in が必要です。

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

`api.registerTool(...)` で登録されたすべての tool は、Plugin manifest でも宣言する必要があります。

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
  tools: { allow: ["workflow_tool"] }, // or ["my-plugin"] for all tools from one plugin
}
```

Optional tools は、tool を model に公開するかどうかを制御します。tool
または hook が、model に選択された後かつ action 実行前に承認を求めるべき場合は、
[plugin permission requests](/ja-JP/plugins/plugin-permission-requests) を使用してください。

side effects、一般的でない binaries、または default で公開すべきでない capabilities には optional tools を使用してください。
Tool names は core tools と競合してはいけません。
競合は skipped され、plugin diagnostics で報告されます。`parameters` のない tool descriptors を含む malformed
registrations も skipped され、同じ方法で報告されます。登録済み tools は、policy と allowlist checks を通過した後に
model が呼び出せる typed functions です。

Tool factories は runtime-supplied context object を受け取ります。tool が現在の
turn の active model を log、display、または adapt する必要がある場合は `ctx.activeModel` を使用してください。
この object には `provider`、`modelId`、`modelRef` が含まれることがあります。これは
informational runtime metadata として扱い、local
operator、インストール済み Plugin code、または変更された OpenClaw runtime に対する security boundary として扱わないでください。
Sensitive local tools では引き続き明示的な Plugin または operator opt-in を要求し、
active-model metadata が欠落しているか不適切な場合は fail closed するべきです。

manifest は ownership と discovery を宣言します。execution は引き続き live
registered tool implementation を呼び出します。`toolMetadata.<tool>.optional: true` を
`api.registerTool(..., { optional: true })` と揃えておくことで、OpenClaw はその Plugin runtime を
tool が明示的に allowlisted されるまで読み込まずに済みます。

## Import conventions

focused SDK subpaths から import してください。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

deprecated root barrel から import しないでください。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

Plugin package 内では、internal imports に `api.ts` や
`runtime-api.ts` などの local barrel files を使用してください。自分の Plugin を
SDK path 経由で import しないでください。Provider-specific helpers は、その seam が本当に generic でない限り、
provider package 内に留めてください。

Custom Gateway RPC methods は advanced entry point です。これらは
plugin-specific prefix に置いてください。`config.*`、
`exec.approvals.*`、`operator.admin.*`、`wizard.*`、`update.*` などの core admin namespaces は reserved のままで、
`operator.admin` に解決されます。
`openclaw/plugin-sdk/gateway-method-runtime` bridge は、
`contracts.gatewayMethodDispatch: ["authenticated-request"]` を宣言する plugin HTTP
routes 専用に reserved です。

完全な import map については、[Plugin SDK overview](/ja-JP/plugins/sdk-overview) を参照してください。

## 提出前 checklist

<Check>**package.json** に正しい `openclaw` metadata がある</Check>
<Check>**openclaw.plugin.json** manifest が存在し、有効である</Check>
<Check>Entry point が `defineChannelPluginEntry` または `definePluginEntry` を使用している</Check>
<Check>すべての imports が focused `plugin-sdk/<subpath>` paths を使用している</Check>
<Check>Internal imports が SDK self-imports ではなく local modules を使用している</Check>
<Check>Tests が通る（`pnpm test -- <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` が通る（in-repo plugins）</Check>

## beta releases に対してテストする

1. [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) の GitHub リリースタグを監視し、`Watch` > `Releases` で購読します。ベータタグは `v2026.3.N-beta.1` のような形式です。リリース告知を受け取るには、OpenClaw の公式 X アカウント [@openclaw](https://x.com/openclaw) の通知を有効にすることもできます。
2. ベータタグが表示されたら、すぐにそのタグに対して自分の Plugin をテストします。安定版までの期間は通常、数時間しかありません。
3. テスト後、自分の Plugin のスレッドで、`plugin-forum` Discord チャネルに `all good` または壊れた内容を投稿します。まだスレッドがない場合は作成します。
4. 何かが壊れた場合は、`Beta blocker: <plugin-name> - <summary>` というタイトルの Issue を開くか更新し、`beta-blocker` ラベルを適用します。その Issue リンクをスレッドに貼ります。
5. `fix(<plugin-id>): beta blocker - <summary>` というタイトルで `main` への PR を開き、PR と Discord スレッドの両方で Issue をリンクします。コントリビューターは PR にラベルを付けられないため、タイトルがメンテナーと自動化に対する PR 側のシグナルになります。PR があるブロッカーはマージされますが、PR がないブロッカーはそのまま出荷される可能性があります。メンテナーはベータテスト中にこれらのスレッドを監視します。
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
    インポートマップと登録 API のリファレンス
  </Card>
  <Card title="Runtime Helpers" icon="settings" href="/ja-JP/plugins/sdk-runtime">
    `api.runtime` 経由の TTS、検索、サブエージェント
  </Card>
  <Card title="Testing" icon="test-tubes" href="/ja-JP/plugins/sdk-testing">
    テストユーティリティとパターン
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/ja-JP/plugins/manifest">
    完全なマニフェストスキーマのリファレンス
  </Card>
</CardGroup>

## 関連

- [Plugin フック](/ja-JP/plugins/hooks)
- [Plugin アーキテクチャ](/ja-JP/plugins/architecture)

---
read_when:
    - pluginにセットアップウィザードを追加しています
    - '`setup-entry.ts`と`index.ts`の違いを理解する必要があります'
    - plugin config schemaまたは`package.json`のopenclaw metadataを定義しています
sidebarTitle: Setup and Config
summary: セットアップウィザード、`setup-entry.ts`、config schema、および`package.json`メタデータ
title: Pluginセットアップと設定
x-i18n:
    generated_at: "2026-04-21T04:49:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5de51b55c04b4f05947bc2d4de9c34e24a26e4ca8b3ff9b1711288a8e5b63273
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Pluginセットアップと設定

plugin packaging（`package.json`メタデータ）、manifest
（`openclaw.plugin.json`）、setup entries、config schemaのリファレンスです。

<Tip>
  **手順付きガイドを探していますか？** how-toガイドでは、文脈付きでpackagingを扱っています:
  [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins#step-1-package-and-manifest) と
  [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
</Tip>

## パッケージメタデータ

`package.json`には、plugin systemに
そのpluginが何を提供するかを伝える`openclaw`フィールドが必要です。

**Channel plugin:**

```json
{
  "name": "@myorg/openclaw-my-channel",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "blurb": "チャネルの短い説明。"
    }
  }
}
```

**Provider plugin / ClawHub publish baseline:**

```json openclaw-clawhub-package.json
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

pluginをClawHubで外部公開する場合、それらの`compat`および`build`
フィールドは必須です。正式なpublish snippetは
`docs/snippets/plugin-publish/`にあります。

### `openclaw`フィールド

| Field        | Type       | 説明                                                                                                 |
| ------------ | ---------- | ---------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | エントリポイントファイル（package rootからの相対パス）                                              |
| `setupEntry` | `string`   | 軽量なsetup専用エントリ（任意）                                                                      |
| `channel`    | `object`   | setup、picker、quickstart、status surfaces向けのchannel catalog metadata                            |
| `providers`  | `string[]` | このpluginが登録するprovider IDs                                                                     |
| `install`    | `object`   | installヒント: `npmSpec`、`localPath`、`defaultChoice`、`minHostVersion`、`allowInvalidConfigRecovery` |
| `startup`    | `object`   | startup動作フラグ                                                                                    |

### `openclaw.channel`

`openclaw.channel`は、runtimeが読み込まれる前のchannel discoveryとsetup
surfaces向けの軽量なpackage metadataです。

| Field                                  | Type       | 意味                                                                          |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | 正式なchannel id。                                                            |
| `label`                                | `string`   | 主たるchannel label。                                                         |
| `selectionLabel`                       | `string`   | `label`と異なるべき場合のpicker/setup label。                                 |
| `detailLabel`                          | `string`   | より豊かなchannel catalogやstatus surfaces向けの補助detail label。            |
| `docsPath`                             | `string`   | setupおよび選択リンク用のdocs path。                                          |
| `docsLabel`                            | `string`   | channel idと異なるべき場合のdocs links用override label。                      |
| `blurb`                                | `string`   | 短いオンボーディング/catalog説明。                                             |
| `order`                                | `number`   | channel catalogs内の並び順。                                                  |
| `aliases`                              | `string[]` | channel selection用の追加lookup alias。                                       |
| `preferOver`                           | `string[]` | このchannelが優先されるべき低優先度plugin/channel ids。                       |
| `systemImage`                          | `string`   | channel UI catalogs向けの任意のicon/system-image名。                          |
| `selectionDocsPrefix`                  | `string`   | selection surfacesでdocs linksの前に付ける接頭辞テキスト。                    |
| `selectionDocsOmitLabel`               | `boolean`  | selection copyでラベル付きdocs linkの代わりにdocs pathを直接表示する。        |
| `selectionExtras`                      | `string[]` | selection copyに追加される短い文字列。                                        |
| `markdownCapable`                      | `boolean`  | outbound formatting判断用に、そのchannelがmarkdown対応であることを示す。      |
| `exposure`                             | `object`   | setup、configured lists、docs surfaces向けのchannel visibility controls。     |
| `quickstartAllowFrom`                  | `boolean`  | このchannelを標準quickstartの`allowFrom`セットアップフローに含める。          |
| `forceAccountBinding`                  | `boolean`  | accountが1つしかなくても明示的なaccount bindingを必須にする。                 |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | このchannelのannounce target解決でsession lookupを優先する。                  |

例:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (self-hosted)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Webhookベースのself-hostedチャット統合。",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "ガイド:",
      "selectionExtras": ["Markdown"],
      "markdownCapable": true,
      "exposure": {
        "configured": true,
        "setup": true,
        "docs": true
      },
      "quickstartAllowFrom": true
    }
  }
}
```

`exposure`は次をサポートします。

- `configured`: configured/status系の一覧surfacesにそのchannelを含める
- `setup`: 対話型setup/configure pickerにそのchannelを含める
- `docs`: docs/navigation surfacesでそのchannelを公開向けとして扱う

`showConfigured`と`showInSetup`はlegacy aliasとして引き続きサポートされます。`exposure`を優先してください。

### `openclaw.install`

`openclaw.install`はmanifest metadataではなくpackage metadataです。

| Field                        | Type                 | 意味                                                                                     |
| ---------------------------- | -------------------- | ---------------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | install/updateフロー向けの正式なnpm spec。                                               |
| `localPath`                  | `string`             | ローカル開発またはbundled install path。                                                 |
| `defaultChoice`              | `"npm"` \| `"local"` | 両方利用可能な場合の優先install source。                                                 |
| `minHostVersion`             | `string`             | `>=x.y.z`形式の最小対応OpenClaw version。                                                |
| `allowInvalidConfigRecovery` | `boolean`            | bundled-plugin reinstallフローで特定のstale-config failureから回復できるようにする。     |

`minHostVersion`が設定されている場合、installとmanifest-registry読み込みの両方で
それが強制されます。古いhostはそのpluginをスキップし、不正なversion stringは拒否されます。

`allowInvalidConfigRecovery`は、壊れたconfigに対する一般的なバイパスではありません。これは、
bundled pluginの限定的な回復専用であり、reinstall/setupによって
同じpluginに対するmissing bundled plugin pathや古い`channels.<id>`
entryのような既知のアップグレード残骸を修復できるようにするものです。無関係な理由でconfigが壊れている場合、
installは引き続きfail closedし、オペレーターに`openclaw doctor --fix`を実行するよう案内します。

### 遅延フルロード

Channel pluginsは、次のようにして遅延ロードに対応できます。

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

有効にすると、OpenClawはpre-listen startup
phase中、すでに設定済みのchannelsであっても`setupEntry`だけを読み込みます。フルエントリは、
gatewayがlistenを開始した後に読み込まれます。

<Warning>
  遅延ロードを有効にするのは、gatewayがlistenを開始する前に必要なもの
  （channel登録、HTTP routes、gateway methods）を`setupEntry`がすべて登録する場合だけにしてください。フルエントリが必要なstartup capabilityを持つなら、
  デフォルト動作のままにしてください。
</Warning>

setup/full entryがgateway RPC methodsを登録する場合は、
plugin固有のprefixを維持してください。予約済みのcore admin namespace
（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は引き続きcore所有であり、
常に`operator.admin`に解決されます。

## Plugin manifest

すべてのnative pluginは、package rootに`openclaw.plugin.json`を含める必要があります。
OpenClawは、plugin codeを実行せずにconfigを検証するためにこれを使用します。

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "OpenClawにMy Plugin機能を追加します",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook検証用シークレット"
      }
    }
  }
}
```

channel pluginsでは、`kind`と`channels`を追加します。

```json
{
  "id": "my-channel",
  "kind": "channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

configがないpluginでもschemaを含める必要があります。空のschemaでも有効です。

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

完全なschemaリファレンスについては[Plugin Manifest](/ja-JP/plugins/manifest)を参照してください。

## ClawHub公開

plugin packagesでは、package専用のClawHubコマンドを使用してください。

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

legacyなskill専用publish aliasはSkills用です。plugin packagesでは
必ず`clawhub package publish`を使用してください。

## setup entry

`setup-entry.ts`ファイルは、フルの`index.ts`の軽量な代替であり、
OpenClawがsetup surfaces（オンボーディング、config修復、
無効なchannel inspection）のみを必要とするときに読み込みます。

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

これにより、setupフロー中に重いruntime code（crypto libraries、CLI registrations、
background services）を読み込まずに済みます。

setup-safeなexportsをsidecar moduleに置くbundled workspace channelsでは、
`defineSetupPluginEntry(...)`の代わりに
`openclaw/plugin-sdk/channel-entry-contract`の
`defineBundledChannelSetupEntry(...)`を使用できます。
そのbundled contractは任意の
`runtime` exportもサポートしており、setup時のruntime wiringを軽量かつ明示的に保てます。

**OpenClawがフルエントリの代わりに`setupEntry`を使う場合:**

- channelが無効だがsetup/オンボーディングsurfacesが必要な場合
- channelが有効だが未設定の場合
- 遅延ロードが有効な場合（`deferConfiguredChannelFullLoadUntilAfterListen`）

**`setupEntry`が登録しなければならないもの:**

- channel plugin object（`defineSetupPluginEntry`経由）
- gateway listen前に必要なHTTP routes
- startup中に必要なgateway methods

それらのstartup gateway methodsも、`config.*`や`update.*`のような
予約済みcore admin namespaceは避けるべきです。

**`setupEntry`に含めるべきでないもの:**

- CLI登録
- バックグラウンドサービス
- 重いruntime imports（crypto、SDKs）
- startup後にのみ必要なgateway methods

### 狭いsetup helper import

高速なsetup専用pathでは、setup surfaceの一部だけが必要な場合、
より広い`plugin-sdk/setup`アンブレラではなく、狭いsetup helper seamを優先してください。

| Import path                        | 用途                                                                                     | 主なexports                                                                                                                                                                                                                                                                                   |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | `setupEntry` / 遅延channel startupでも利用可能なsetup時runtime helpers                   | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | environment対応のaccount setup adapters                                                  | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                         |
| `plugin-sdk/setup-tools`           | setup/install CLI/archive/docs helpers                                                   | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                               |

config-patch helpers（
`moveSingleAccountChannelSectionToDefaultAccount(...)`など）を含む共有setup
toolbox全体が欲しい場合は、より広い`plugin-sdk/setup` seamを使用してください。

setup patch adaptersは、import時にも高速pathで安全なままです。それらのbundled
single-account promotion contract-surface lookupは遅延実行されるため、
`plugin-sdk/setup-runtime`をimportしても、adapterが実際に使用される前に
bundled contract-surface discoveryが即座に読み込まれることはありません。

### channel所有のsingle-account promotion

channelがsingle-accountのトップレベルconfigから
`channels.<id>.accounts.*`へアップグレードするとき、デフォルトの共有動作では
promotionされたaccountスコープ値を`accounts.default`へ移動します。

bundled channelsは、自身のsetup
contract surfaceを通じてそのpromotionを絞り込んだりoverrideしたりできます。

- `singleAccountKeysToMove`: promotionされた
  accountへ移動すべき追加トップレベルkeys
- `namedAccountPromotionKeys`: named accountsがすでに存在する場合、
  promotionされたaccountへ移動するのはこれらの
  keysのみで、共有policy/delivery keysはchannel rootに残る
- `resolveSingleAccountPromotionTarget(...)`: promotionされた値を受け取る既存accountを選ぶ

現在のbundled例はMatrixです。すでにちょうど1つのnamed Matrix accountが存在する場合や、
`defaultAccount`が`Ops`のような既存の非canonical keyを指している場合、
promotionは新しい`accounts.default` entryを作らず、そのaccountを維持します。

## config schema

plugin configは、manifest内のJSON Schemaに対して検証されます。ユーザーは次のようにして
pluginsを設定します。

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        config: {
          webhookSecret: "abc123",
        },
      },
    },
  },
}
```

pluginは、登録時にこのconfigを`api.pluginConfig`として受け取ります。

channel固有のconfigには、代わりにchannel config sectionを使用してください。

```json5
{
  channels: {
    "my-channel": {
      token: "bot-token",
      allowFrom: ["user1", "user2"],
    },
  },
}
```

### channel config schemaの構築

`openclaw/plugin-sdk/core`の`buildChannelConfigSchema`を使って、
Zod schemaをOpenClawが検証する`ChannelConfigSchema`ラッパーへ変換します。

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/core";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

## セットアップウィザード

channel pluginsは、`openclaw onboard`向けの対話型セットアップウィザードを提供できます。
ウィザードは`ChannelPlugin`上の`ChannelSetupWizard` objectです。

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "接続済み",
    unconfiguredLabel: "未設定",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "environmentのMY_CHANNEL_BOT_TOKENを使用しますか？",
      keepPrompt: "現在のtokenを維持しますか？",
      inputPrompt: "bot tokenを入力してください:",
      inspect: ({ cfg, accountId }) => {
        const token = (cfg.channels as any)?.["my-channel"]?.token;
        return {
          accountConfigured: Boolean(token),
          hasConfiguredValue: Boolean(token),
        };
      },
    },
  ],
};
```

`ChannelSetupWizard` typeは、`credentials`、`textInputs`、
`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize`などをサポートします。
完全な例については、bundled plugin packages（たとえばDiscord pluginの`src/channel.setup.ts`）を参照してください。

標準の
`note -> prompt -> parse -> merge -> patch`フローだけが必要なDM allowlist promptには、
`openclaw/plugin-sdk/setup`の共有setup
helpersを優先してください: `createPromptParsedAllowFromForAccount(...)`、
`createTopLevelChannelParsedAllowFromPrompt(...)`、および
`createNestedChannelParsedAllowFromPrompt(...)`。

label、score、任意のextra linesだけが異なるchannel setup status blockには、
各pluginで同じ`status` objectを手書きする代わりに
`openclaw/plugin-sdk/setup`の`createStandardChannelSetupStatus(...)`を優先してください。

特定の文脈でのみ表示すべき任意のsetup surfaceには、
`openclaw/plugin-sdk/channel-setup`の`createOptionalChannelSetupSurface`を使用してください。

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// { setupAdapter, setupWizard } を返す
```

`plugin-sdk/channel-setup`は、必要なのがその任意install surfaceの片方だけの場合のために、
より低水準の
`createOptionalChannelSetupAdapter(...)`と
`createOptionalChannelSetupWizard(...)`ビルダーも公開しています。

生成されたoptional adapter/wizardは、実際のconfig書き込み時にはfail closedします。
`validateInput`、
`applyAccountConfig`、`finalize`で1つの共通install-required messageを再利用し、
`docsPath`が設定されている場合はdocs linkを追加します。

binaryベースのsetup UIでは、各channelに同じbinary/status glueを複製する代わりに、
共有のdelegated helpersを優先してください。

- label、
  hints、scores、binary detectionだけが異なるstatus blocks向けの`createDetectedBinaryStatus(...)`
- pathベースtext inputs向けの`createCliPathTextInput(...)`
- `setupEntry`が重いフルwizardへ遅延的に転送する必要がある場合の
  `createDelegatedSetupWizardStatusResolvers(...)`、
  `createDelegatedPrepare(...)`、`createDelegatedFinalize(...)`、および
  `createDelegatedResolveConfigured(...)`
- `setupEntry`が`textInputs[*].shouldPrompt`判定だけを委譲する必要がある場合の
  `createDelegatedTextInputShouldPrompt(...)`

## 公開とインストール

**外部plugins:** [ClawHub](/ja-JP/tools/clawhub)またはnpmへ公開し、その後インストールします。

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClawはまずClawHubを試し、自動的にnpmへfallbackします。ClawHubを明示的に強制することもできます。

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHubのみ
```

対応する`npm:` overrideはありません。ClawHub fallback後にnpm pathを使いたい場合は、
通常のnpm package specを使ってください。

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**リポジトリ内plugins:** bundled plugin workspace tree配下に配置すると、
build中に自動検出されます。

**ユーザーがインストールできるもの:**

```bash
openclaw plugins install <package-name>
```

<Info>
  npm由来のインストールでは、`openclaw plugins install`は
  `npm install --ignore-scripts`（lifecycle scriptsなし）を実行します。pluginのdependency
  treeは純粋なJS/TSに保ち、`postinstall` buildを必要とするpackageは避けてください。
</Info>

bundledなOpenClaw所有pluginsだけがstartup repairの例外です。packaged installでは、
plugin config、legacy channel config、またはbundled manifestのdefault-enabled設定によって
有効化されているものがある場合、startup時にそのpluginの
不足しているruntime dependenciesをimport前にインストールします。サードパーティpluginsは
startup installに依存すべきではありません。明示的なplugin installerを使い続けてください。

## 関連

- [SDK Entry Points](/ja-JP/plugins/sdk-entrypoints) -- `definePluginEntry`と`defineChannelPluginEntry`
- [Plugin Manifest](/ja-JP/plugins/manifest) -- 完全なmanifest schemaリファレンス
- [Building Plugins](/ja-JP/plugins/building-plugins) -- 段階的なはじめにガイド

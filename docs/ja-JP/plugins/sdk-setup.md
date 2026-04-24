---
read_when:
    - Pluginにセットアップウィザードを追加している場合
    - setup-entry.tsとindex.tsの違いを理解する必要がある場合
    - Plugin設定スキーマまたはpackage.jsonのopenclawメタデータを定義している場合
sidebarTitle: Setup and Config
summary: セットアップウィザード、setup-entry.ts、設定スキーマ、およびpackage.jsonメタデータ
title: Pluginセットアップと設定
x-i18n:
    generated_at: "2026-04-24T05:12:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 25474e56927fa9d60616413191096f721ba542a7088717d80c277dfb34746d10
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Pluginパッケージング（`package.json`メタデータ）、manifest
（`openclaw.plugin.json`）、setup entry、および設定スキーマのリファレンスです。

<Tip>
  **ウォークスルーを探していますか？** how-toガイドでは、パッケージングを文脈の中で扱っています:
  [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins#step-1-package-and-manifest) と
  [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
</Tip>

## パッケージメタデータ

`package.json`には、Pluginシステムへ
Pluginが何を提供するかを伝える`openclaw`フィールドが必要です。

**Channel Plugin:**

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
      "blurb": "Short description of the channel."
    }
  }
}
```

**Provider Plugin / ClawHub publish baseline:**

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

PluginをClawHubで外部公開する場合、これらの`compat`および`build`
フィールドは必須です。正規のpublishスニペットは
`docs/snippets/plugin-publish/`にあります。

### `openclaw`フィールド

| フィールド | 型 | 説明 |
| ------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Entry pointファイル（パッケージルート相対） |
| `setupEntry` | `string`   | 軽量なsetup専用entry（任意） |
| `channel`    | `object`   | setup、picker、quickstart、およびstatusインターフェース向けのチャネルカタログメタデータ |
| `providers`  | `string[]` | このPluginが登録するprovider id |
| `install`    | `object`   | インストールヒント: `npmSpec`、`localPath`、`defaultChoice`、`minHostVersion`、`expectedIntegrity`、`allowInvalidConfigRecovery` |
| `startup`    | `object`   | 起動動作フラグ |

### `openclaw.channel`

`openclaw.channel`は、ランタイム読み込み前のチャネルdiscoveryおよびsetup
インターフェース向けの軽量パッケージメタデータです。

| フィールド | 型 | 意味 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | 正規のチャネルid。 |
| `label`                                | `string`   | 主チャネルlabel。 |
| `selectionLabel`                       | `string`   | `label`と異なる必要がある場合のpicker/setup label。 |
| `detailLabel`                          | `string`   | より豊かなチャネルカタログおよびstatusインターフェース向けの副次detail label。 |
| `docsPath`                             | `string`   | setupおよびselectionリンク用docs path。 |
| `docsLabel`                            | `string`   | docsリンクでチャネルidと異なるlabelを使いたい場合の上書きlabel。 |
| `blurb`                                | `string`   | 短いオンボーディング/カタログ説明。 |
| `order`                                | `number`   | チャネルカタログ内の並び順。 |
| `aliases`                              | `string[]` | チャネル選択用の追加lookup alias。 |
| `preferOver`                           | `string[]` | このチャネルが優先すべき低優先度Plugin/チャネルid。 |
| `systemImage`                          | `string`   | チャネルUIカタログ向けの任意のicon/system-image名。 |
| `selectionDocsPrefix`                  | `string`   | selectionインターフェースでdocsリンクの前に置くprefix文言。 |
| `selectionDocsOmitLabel`               | `boolean`  | selection文言内でlabel付きdocsリンクの代わりにdocs pathを直接表示する。 |
| `selectionExtras`                      | `string[]` | selection文言に追加される短い文字列。 |
| `markdownCapable`                      | `boolean`  | 送信整形判断のため、チャネルがmarkdown対応であることを示す。 |
| `exposure`                             | `object`   | setup、configured lists、およびdocsインターフェース向けのチャネル可視性制御。 |
| `quickstartAllowFrom`                  | `boolean`  | このチャネルを標準quickstart `allowFrom`セットアップフローへ参加させる。 |
| `forceAccountBinding`                  | `boolean`  | アカウントが1つしかなくても明示的なaccount bindingを必須にする。 |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | このチャネルのannounce target解決時にsession lookupを優先する。 |

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
      "blurb": "Webhook-based self-hosted chat integration.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guide:",
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

- `configured`: configured/status風の一覧インターフェースにそのチャネルを含める
- `setup`: 対話型setup/configure pickerにそのチャネルを含める
- `docs`: docs/navigationインターフェースでそのチャネルを公開向けとして扱う

`showConfigured`と`showInSetup`もレガシーaliasとして引き続きサポートされます。`exposure`を優先してください。

### `openclaw.install`

`openclaw.install`はmanifestメタデータではなく、パッケージメタデータです。

| フィールド | 型 | 意味 |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | install/updateフロー向けの正規npm spec。 |
| `localPath`                  | `string`             | ローカル開発またはバンドルインストールパス。 |
| `defaultChoice`              | `"npm"` \| `"local"` | 両方利用可能な場合の優先インストール元。 |
| `minHostVersion`             | `string`             | `>=x.y.z`形式の最小サポートOpenClawバージョン。 |
| `expectedIntegrity`          | `string`             | 固定インストール用の期待されるnpm dist integrity文字列。通常は`sha512-...`。 |
| `allowInvalidConfigRecovery` | `boolean`            | 特定の古い設定失敗から、バンドルPlugin再インストールフローで復旧できるようにする。 |

対話型オンボーディングも、install-on-demand
インターフェースに`openclaw.install`を使用します。Pluginがランタイム読み込み前に
provider auth選択肢またはchannel setup/catalogメタデータを公開する場合、
オンボーディングはその選択肢を表示し、npm対local installを尋ね、
Pluginをインストールまたは有効化してから、選択されたフローを続行できます。
npmオンボーディング選択には、registry
`npmSpec`を持つ信頼済みカタログメタデータが必要です。厳密バージョンと`expectedIntegrity`は
任意のpinです。`expectedIntegrity`が存在する場合、install/updateフローは
それを強制します。「何を表示するか」メタデータは`openclaw.plugin.json`に、
「どうインストールするか」メタデータは`package.json`に置いてください。

`minHostVersion`が設定されている場合、installとmanifest-registry読み込みの両方で
それが強制されます。古いホストはそのPluginをスキップし、不正な
バージョン文字列は拒否されます。

固定npmインストールでは、厳密バージョンを`npmSpec`に保持し、
期待されるアーティファクトintegrityを追加してください。

```json
{
  "openclaw": {
    "install": {
      "npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3",
      "expectedIntegrity": "sha512-REPLACE_WITH_NPM_DIST_INTEGRITY",
      "defaultChoice": "npm"
    }
  }
}
```

`allowInvalidConfigRecovery`は、壊れた設定全般の回避策ではありません。これは
狭いバンドルPlugin復旧専用であり、同じPluginの欠落したバンドルパスや古い
`channels.<id>`エントリのような既知のアップグレード残骸を、再インストール/setupで修復するためのものです。無関係な理由で設定が壊れている場合、
installは引き続きfail closedし、オペレーターへ`openclaw doctor --fix`の実行を促します。

### 遅延full load

チャネルPluginは、次のようにしてdeferred loadingへオプトインできます。

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

有効な場合、OpenClawは、すでに設定済みのチャネルに対しても、pre-listen起動
フェーズでは`setupEntry`だけを読み込みます。full entryはgatewayがlisten開始した後に読み込まれます。

<Warning>
  deferred loadingは、gatewayがlisten開始前に必要なものすべて
  （チャネル登録、HTTP route、gateway method）を`setupEntry`が登録している場合にのみ有効にしてください。full entryが必要な起動機能を持つ場合は、デフォルト動作のままにしてください。
</Warning>

setup/full entryがgateway RPCメソッドを登録する場合は、それらを
Plugin固有prefixに留めてください。予約済みcore admin namespace（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）は引き続きcore所有であり、常に
`operator.admin`へ解決されます。

## Plugin manifest

すべてのネイティブPluginは、パッケージルートに`openclaw.plugin.json`を同梱しなければなりません。
OpenClawはこれを使って、Pluginコードを実行せずに設定を検証します。

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds My Plugin capabilities to OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook verification secret"
      }
    }
  }
}
```

チャネルPluginでは、`kind`と`channels`も追加してください。

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

設定を持たないPluginでもschemaを同梱しなければなりません。空schemaでも有効です。

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

完全なschemaリファレンスは[Plugin Manifest](/ja-JP/plugins/manifest)を参照してください。

## ClawHub公開

Pluginパッケージには、パッケージ専用のClawHubコマンドを使用してください。

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

レガシーなskill専用publish aliasはSkills用です。Pluginパッケージでは
常に`clawhub package publish`を使用してください。

## Setup entry

`setup-entry.ts`ファイルは`index.ts`の軽量な代替であり、
OpenClawがsetupインターフェース（オンボーディング、設定修復、
無効チャネル検査）だけを必要とするときに読み込まれます。

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

これにより、setupフロー中に重いランタイムコード（crypto library、CLI登録、
バックグラウンドサービス）を読み込まずに済みます。

setup-safe exportをsidecar moduleに保持するバンドルworkspaceチャネルでは、
`defineSetupPluginEntry(...)`の代わりに
`openclaw/plugin-sdk/channel-entry-contract`の
`defineBundledChannelSetupEntry(...)`を使用できます。このバンドルコントラクトは、任意の
`runtime` exportもサポートしているため、setup時のランタイム配線を
軽量かつ明示的なままにできます。

**OpenClawがfull entryの代わりに`setupEntry`を使うタイミング:**

- チャネルが無効だが、setup/オンボーディング用インターフェースが必要なとき
- チャネルは有効だが未設定のとき
- deferred loadingが有効なとき（`deferConfiguredChannelFullLoadUntilAfterListen`）

**`setupEntry`が登録しなければならないもの:**

- チャネルPlugin object（`defineSetupPluginEntry`経由）
- gateway listen前に必要なHTTP route
- 起動中に必要なgateway method

これらの起動用gateway methodも、引き続き予約済みcore admin
namespace（`config.*`や`update.*`など）は避けるべきです。

**`setupEntry`に含めるべきでないもの:**

- CLI登録
- バックグラウンドサービス
- 重いランタイムimport（crypto、SDK）
- 起動後にしか必要ないgateway method

### 狭いsetup helper import

高速なsetup専用パスでは、setupインターフェースの一部しか必要ない場合、
広い`plugin-sdk/setup`傘下ではなく、狭いsetup helper seamを優先してください。

| import path | 用途 | 主なexport |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | `setupEntry` / deferred channel startupでも利用できるsetup時ランタイムhelper | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 環境認識のaccount setup adapter | `createEnvPatchedAccountSetupAdapter` |
| `plugin-sdk/setup-tools`           | setup/install CLI/archive/docs helper | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |

設定patch helper（たとえば
`moveSingleAccountChannelSectionToDefaultAccount(...)`）を含む完全な共有setup
toolboxが必要な場合は、広い`plugin-sdk/setup` seamを使用してください。

setup patch adapterはimport時にホットパス安全のままです。そのバンドルされた
single-account promotion contract-surface lookupは遅延されるため、
`plugin-sdk/setup-runtime`をimportしても、adapterが実際に使われる前に
bundled contract-surface discoveryが eager に読み込まれることはありません。

### チャネル所有のsingle-account昇格

チャネルが単一アカウントのトップレベル設定から
`channels.<id>.accounts.*`へアップグレードするとき、デフォルトの共有動作では、昇格した
account-scoped値は`accounts.default`へ移動されます。

バンドルチャネルは、そのsetup
contract surfaceを通じてこの昇格を絞り込んだり上書きしたりできます。

- `singleAccountKeysToMove`: 昇格した
  アカウントへ移動すべき追加トップレベルキー
- `namedAccountPromotionKeys`: 名前付きアカウントがすでに存在する場合、これらの
  キーだけが昇格アカウントへ移動する。共有ポリシー/配信キーはチャネルルートに残る
- `resolveSingleAccountPromotionTarget(...)`: どの既存アカウントが昇格値を受け取るかを選ぶ

現在のバンドル例はMatrixです。名前付きMatrixアカウントがすでにちょうど1つ存在する場合、
または`defaultAccount`が`Ops`のような既存の非正規キーを指している場合、
昇格では新しい`accounts.default`エントリを作らず、そのアカウントを保持します。

## 設定スキーマ

Plugin設定は、manifest内のJSON Schemaに対して検証されます。ユーザーは
Pluginを次のように設定します。

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

Pluginは登録時に、この設定を`api.pluginConfig`として受け取ります。

チャネル固有の設定では、代わりにチャネル設定セクションを使用してください。

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

### チャネル設定スキーマの構築

`openclaw/plugin-sdk/core`の`buildChannelConfigSchema`を使うと、
Zod schemaを、OpenClawが検証する`ChannelConfigSchema`ラッパーへ変換できます。

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

チャネルPluginは、`openclaw onboard`向けに対話型セットアップウィザードを提供できます。
このウィザードは、`ChannelPlugin`上の`ChannelSetupWizard` objectです。

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connected",
    unconfiguredLabel: "Not configured",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Use MY_CHANNEL_BOT_TOKEN from environment?",
      keepPrompt: "Keep current token?",
      inputPrompt: "Enter your bot token:",
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

`ChannelSetupWizard`型は、`credentials`、`textInputs`、
`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize`などをサポートしています。
完全な例は、バンドルPluginパッケージ（たとえばDiscord Pluginの`src/channel.setup.ts`）を参照してください。

標準の
`note -> prompt -> parse -> merge -> patch`フローだけで十分なDM allowlist promptでは、
`openclaw/plugin-sdk/setup`の共有setup
helper、すなわち`createPromptParsedAllowFromForAccount(...)`、
`createTopLevelChannelParsedAllowFromPrompt(...)`、および
`createNestedChannelParsedAllowFromPrompt(...)`を優先してください。

ラベル、スコア、および任意の追加行だけが異なるチャネルsetup status blockには、
各Pluginで同じ`status` objectを手書きする代わりに、
`openclaw/plugin-sdk/setup`の`createStandardChannelSetupStatus(...)`を優先してください。

特定の文脈でのみ表示される任意のsetupインターフェースには、
`openclaw/plugin-sdk/channel-setup`の`createOptionalChannelSetupSurface`を使用してください。

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// Returns { setupAdapter, setupWizard }
```

`plugin-sdk/channel-setup`は、オプションインストール用インターフェースの片方だけが
必要な場合に備えて、より低レベルの
`createOptionalChannelSetupAdapter(...)`および
`createOptionalChannelSetupWizard(...)` builderも公開しています。

生成されるオプションadapter/wizardは、実際の設定書き込みではfail closedします。これらは
`validateInput`、`applyAccountConfig`、`finalize`で1つのinstall-requiredメッセージを再利用し、
`docsPath`が設定されている場合はdocsリンクを追記します。

バイナリベースのsetup UIでは、同じbinary/status glueを各チャネルへコピーする代わりに、
共有のdelegated helperを優先してください。

- ラベル、ヒント、スコア、およびバイナリ検出だけが異なるstatus block用の`createDetectedBinaryStatus(...)`
- パスベースtext input用の`createCliPathTextInput(...)`
- `setupEntry`が重いfull wizardへ遅延フォワードする必要がある場合の
  `createDelegatedSetupWizardStatusResolvers(...)`、
  `createDelegatedPrepare(...)`、`createDelegatedFinalize(...)`、および
  `createDelegatedResolveConfigured(...)`
- `setupEntry`が`textInputs[*].shouldPrompt`判定だけを委譲すればよい場合の
  `createDelegatedTextInputShouldPrompt(...)`

## 公開とインストール

**外部Plugin:** [ClawHub](/ja-JP/tools/clawhub)またはnpmへ公開し、その後インストールします。

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClawは最初にClawHubを試し、自動的にnpmへフォールバックします。ClawHubを
明示的に強制することもできます。

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHub only
```

対応する`npm:`上書きはありません。ClawHubフォールバック後にnpmパスを
使いたい場合は、通常のnpmパッケージspecを使ってください。

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**リポジトリ内Plugin:** バンドルPlugin workspaceツリーの下に置けば、ビルド中に自動的に
検出されます。

**ユーザーによるインストール:**

```bash
openclaw plugins install <package-name>
```

<Info>
  npmソースのインストールでは、`openclaw plugins install`は
  `npm install --ignore-scripts`（ライフサイクルスクリプトなし）を実行します。Plugin依存関係
  ツリーは純粋なJS/TSに保ち、`postinstall`ビルドを必要とするパッケージは避けてください。
</Info>

バンドルされたOpenClaw所有Pluginだけが起動時修復の例外です。パッケージインストールが
Plugin設定、レガシーチャネル設定、またはそのバンドルdefault-enabled manifestによって有効化された
ものを検出した場合、起動時にそのPluginの不足ランタイム依存関係をimport前にインストールします。サードパーティPluginは起動時インストールに依存すべきではありません。引き続き明示的なPluginインストーラーを使ってください。

## 関連

- [SDK Entry Points](/ja-JP/plugins/sdk-entrypoints) -- `definePluginEntry`および`defineChannelPluginEntry`
- [Plugin Manifest](/ja-JP/plugins/manifest) -- 完全なmanifest schemaリファレンス
- [Building Plugins](/ja-JP/plugins/building-plugins) -- ステップごとの入門ガイド

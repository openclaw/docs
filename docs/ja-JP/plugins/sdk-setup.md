---
read_when:
    - Pluginにセットアップウィザードを追加する場合
    - '`setup-entry.ts` と `index.ts` の違いを理解する必要がある場合'
    - Pluginのconfigスキーマまたは `package.json` のopenclawメタデータを定義している場合
sidebarTitle: Setup and Config
summary: セットアップウィザード、`setup-entry.ts`、configスキーマ、`package.json` メタデータ
title: Pluginの設定とConfig
x-i18n:
    generated_at: "2026-04-23T14:06:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 110cf9aa1bfaeb286d38963cfba2006502e853dd603a126d1c179cbc9b60aea1
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Pluginの設定とConfig

Pluginパッケージング（`package.json` メタデータ）、マニフェスト
（`openclaw.plugin.json`）、セットアップエントリー、およびconfigスキーマのリファレンスです。

<Tip>
  **手順付きガイドを探していますか？** how-toガイドでは、文脈の中でパッケージングを説明しています:
  [Channel Plugins](/ja-JP/plugins/sdk-channel-plugins#step-1-package-and-manifest) と
  [Provider Plugins](/ja-JP/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
</Tip>

## パッケージメタデータ

`package.json` には、PluginシステムにそのPluginが何を提供するかを伝える
`openclaw` フィールドが必要です:

**チャンネルPlugin:**

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
      "blurb": "チャンネルの短い説明。"
    }
  }
}
```

**プロバイダーPlugin / ClawHub公開ベースライン:**

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

PluginをClawHubで外部公開する場合、これらの `compat` と `build`
フィールドは必須です。正規の公開スニペットは
`docs/snippets/plugin-publish/` にあります。

### `openclaw` フィールド

| Field        | Type       | 説明                                                                                                                 |
| ------------ | ---------- | -------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | エントリーポイントファイル（パッケージルートからの相対パス）                                                        |
| `setupEntry` | `string`   | 軽量なsetup専用エントリー（任意）                                                                                    |
| `channel`    | `object`   | setup、picker、クイックスタート、status画面向けのチャンネルカタログメタデータ                                       |
| `providers`  | `string[]` | このPluginが登録するプロバイダーid                                                                                   |
| `install`    | `object`   | インストールヒント: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | 起動動作フラグ                                                                                                       |

### `openclaw.channel`

`openclaw.channel` は、ランタイムを読み込む前にチャンネル検出やsetup画面で使われる軽量なパッケージメタデータです。

| Field                                  | Type       | 意味                                                                 |
| -------------------------------------- | ---------- | -------------------------------------------------------------------- |
| `id`                                   | `string`   | 正式なチャンネルid。                                                 |
| `label`                                | `string`   | 主表示のチャンネルラベル。                                           |
| `selectionLabel`                       | `string`   | `label` と異なる場合のpicker/setup用ラベル。                         |
| `detailLabel`                          | `string`   | より豊かなチャンネルカタログやstatus画面向けの補助ラベル。           |
| `docsPath`                             | `string`   | setupや選択リンク用のdocsパス。                                      |
| `docsLabel`                            | `string`   | チャンネルidと異なる場合のdocsリンク用ラベル上書き。                 |
| `blurb`                                | `string`   | 短いオンボーディング/カタログ説明。                                  |
| `order`                                | `number`   | チャンネルカタログ内のソート順。                                     |
| `aliases`                              | `string[]` | チャンネル選択用の追加参照エイリアス。                               |
| `preferOver`                           | `string[]` | このチャンネルが優先されるべき低優先度のPlugin/チャンネルid。        |
| `systemImage`                          | `string`   | チャンネルUIカタログ用の任意アイコン/system-image名。                |
| `selectionDocsPrefix`                  | `string`   | 選択画面でdocsリンクの前に付ける接頭辞テキスト。                     |
| `selectionDocsOmitLabel`               | `boolean`  | 選択文言でラベル付きdocsリンクの代わりにdocsパス自体を表示する。     |
| `selectionExtras`                      | `string[]` | 選択文言に追加される短い文字列。                                     |
| `markdownCapable`                      | `boolean`  | 送信フォーマット判断のため、このチャンネルがMarkdown対応であることを示す。 |
| `exposure`                             | `object`   | setup、設定済み一覧、docs画面向けのチャンネル可視性制御。            |
| `quickstartAllowFrom`                  | `boolean`  | このチャンネルを標準クイックスタートの `allowFrom` setupフローに含める。 |
| `forceAccountBinding`                  | `boolean`  | アカウントが1つしかない場合でも明示的なアカウントバインディングを要求する。 |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | このチャンネルのannounce target解決時にsession lookupを優先する。    |

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
      "blurb": "Webhookベースのセルフホスト型チャット連携。",
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

`exposure` がサポートする項目:

- `configured`: 設定済み/status系一覧画面にそのチャンネルを含める
- `setup`: 対話型setup/configure pickerにそのチャンネルを含める
- `docs`: docs/navigation画面でそのチャンネルを公開向けとして扱う

`showConfigured` と `showInSetup` は旧エイリアスとして引き続きサポートされます。推奨は
`exposure` です。

### `openclaw.install`

`openclaw.install` はマニフェストメタデータではなく、パッケージメタデータです。

| Field                        | Type                 | 意味                                                                             |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | install/updateフロー用の正規npm指定。                                            |
| `localPath`                  | `string`             | ローカル開発またはバンドルインストールパス。                                     |
| `defaultChoice`              | `"npm"` \| `"local"` | 両方利用可能なときの優先インストール元。                                         |
| `minHostVersion`             | `string`             | `>=x.y.z` 形式の最小サポートOpenClawバージョン。                                 |
| `expectedIntegrity`          | `string`             | 固定インストール向けの期待されるnpm dist integrity文字列。通常は `sha512-...`。 |
| `allowInvalidConfigRecovery` | `boolean`            | バンドル済みPluginの再インストールで特定の古いconfig障害から回復できるようにします。 |

対話型オンボーディングも、インストールオンデマンド画面で `openclaw.install` を使用します。Pluginがランタイム読み込み前にプロバイダー認証の選択肢やチャンネルsetup/カタログメタデータを公開している場合、オンボーディングはその選択肢を表示し、npmかlocal installかを尋ね、Pluginをインストールまたは有効化してから、選択したフローを続行できます。npmオンボーディングの選択肢には、レジストリの `npmSpec` を持つ信頼済みカタログメタデータが必要です。正確なバージョンと `expectedIntegrity` は任意の固定項目です。`expectedIntegrity` がある場合、install/updateフローはそれを強制します。「何を表示するか」のメタデータは `openclaw.plugin.json` に、「どうインストールするか」のメタデータは `package.json` に置いてください。

`minHostVersion` が設定されている場合、installとmanifest-registry読み込みの両方でそれを強制します。古いホストではそのPluginはスキップされ、無効なバージョン文字列は拒否されます。

固定npmインストールでは、正確なバージョンを `npmSpec` に入れ、期待するアーティファクトintegrityも追加してください:

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

`allowInvalidConfigRecovery` は、壊れたconfig全般に対する汎用バイパスではありません。これは狭い範囲のバンドル済みPlugin回復専用であり、たとえばバンドル済みPluginパスの欠落や同じPluginに対する古い `channels.<id>` エントリなど、既知のアップグレード残骸を再インストール/setupで修復できるようにするためのものです。無関係な理由でconfigが壊れている場合、installは引き続きfail closedし、オペレーターに `openclaw doctor --fix` の実行を案内します。

### 完全読み込みの遅延

チャンネルPluginは、次のようにして遅延読み込みへオプトインできます:

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

有効にすると、OpenClawはpre-listen起動フェーズ中、すでに設定済みのチャンネルであっても `setupEntry` だけを読み込みます。完全エントリーはGatewayがlisten開始した後に読み込まれます。

<Warning>
  遅延読み込みを有効にするのは、`setupEntry` がGatewayがlisten開始前に必要とするすべて（チャンネル登録、HTTPルート、Gatewayメソッド）を登録する場合だけにしてください。完全エントリー側が必須の起動機能を持っているなら、デフォルト動作のままにしてください。
</Warning>

setup/full entryがGateway RPCメソッドを登録する場合は、Plugin固有の接頭辞を使ってください。予約済みのコア管理名前空間（`config.*`、
`exec.approvals.*`、`wizard.*`、`update.*`）はコア専有であり、常に `operator.admin` に解決されます。

## Pluginマニフェスト

すべてのネイティブPluginは、パッケージルートに `openclaw.plugin.json` を含める必要があります。
OpenClawはこれを使って、Pluginコードを実行せずにconfigを検証します。

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "OpenClawにMy Pluginの機能を追加します",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook検証シークレット"
      }
    }
  }
}
```

チャンネルPluginでは、`kind` と `channels` を追加します:

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

configを持たないPluginでもスキーマは必須です。空スキーマでも有効です:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

完全なスキーマリファレンスは [Plugin Manifest](/ja-JP/plugins/manifest) を参照してください。

## ClawHub公開

Pluginパッケージでは、パッケージ専用のClawHubコマンドを使用してください:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

旧来のSkill専用公開エイリアスはSkill用です。Pluginパッケージでは
常に `clawhub package publish` を使用してください。

## セットアップエントリー

`setup-entry.ts` は、OpenClawがsetup画面（オンボーディング、config修復、
無効化されたチャンネルの確認）のみを必要とする場合に読み込む、`index.ts` の軽量な代替です。

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

これにより、setupフロー中に重いランタイムコード（暗号ライブラリ、CLI登録、
バックグラウンドサービス）を読み込まずに済みます。

setup安全なexportをsidecarモジュールに保持するバンドル済みworkspaceチャンネルでは、
`openclaw/plugin-sdk/channel-entry-contract` の
`defineBundledChannelSetupEntry(...)` を
`defineSetupPluginEntry(...)` の代わりに使用できます。このバンドル契約は、
任意の `runtime` export もサポートしているため、setup時のランタイム配線を軽量かつ明示的に保てます。

**OpenClawが完全エントリーの代わりに `setupEntry` を使うタイミング:**

- チャンネルが無効だが、setup/オンボーディング画面が必要な場合
- チャンネルは有効だが未設定の場合
- 遅延読み込みが有効な場合（`deferConfiguredChannelFullLoadUntilAfterListen`）

**`setupEntry` が登録しなければならないもの:**

- チャンネルPluginオブジェクト（`defineSetupPluginEntry` 経由）
- Gatewayのlisten前に必要なHTTPルート
- 起動中に必要なGatewayメソッド

これらの起動時Gatewayメソッドでも、`config.*` や `update.*` のような予約済みコア管理名前空間は避ける必要があります。

**`setupEntry` に含めるべきでないもの:**

- CLI登録
- バックグラウンドサービス
- 重いランタイムimport（crypto、SDK）
- 起動後にのみ必要なGatewayメソッド

### 狭いsetupヘルパーimport

setup専用のホットパスでは、setup画面の一部だけが必要な場合、より広い
`plugin-sdk/setup` アンブレラではなく、狭いsetupヘルパーseamを優先してください:

| Import path                        | 用途                                                                                     | 主なexports                                                                                                                                                                                                                                                                                 |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | `setupEntry` / 遅延チャンネル起動でも利用できるsetup時ランタイムヘルパー                 | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 環境対応アカウントsetupアダプター                                                        | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                       |
| `plugin-sdk/setup-tools`           | setup/install用CLI/アーカイブ/docsヘルパー                                              | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                              |

`moveSingleAccountChannelSectionToDefaultAccount(...)` のようなconfig-patchヘルパーを含む、共有setupツールボックス全体が必要な場合は、より広い `plugin-sdk/setup` seam を使用してください。

setup patchアダプターは、import時にもホットパス安全性を保ちます。バンドル済みの
単一アカウント昇格契約サーフェス参照は遅延読み込みされるため、`plugin-sdk/setup-runtime` をimportしても、アダプターが実際に使われる前にバンドル済み契約サーフェス検出を即座に読み込むことはありません。

### チャンネル所有の単一アカウント昇格

チャンネルが単一アカウントのトップレベルconfigから
`channels.<id>.accounts.*` へアップグレードするとき、共有のデフォルト動作では、昇格されたアカウントスコープの値は `accounts.default` へ移動されます。

バンドル済みチャンネルは、自身のsetup契約サーフェスを通じて、この昇格を絞り込んだり上書きしたりできます:

- `singleAccountKeysToMove`: 昇格されたアカウントへ移動すべき追加のトップレベルキー
- `namedAccountPromotionKeys`: 名前付きアカウントがすでに存在する場合、昇格されたアカウントへ移動するのはこれらのキーだけです。共有ポリシー/配信キーはチャンネルルートに残ります
- `resolveSingleAccountPromotionTarget(...)`: 昇格値をどの既存アカウントへ受け取らせるかを選択します

現在のバンドル済み例はMatrixです。名前付きのMatrixアカウントがちょうど1つだけ存在する場合、または `defaultAccount` が `Ops` のような既存の非正規キーを指している場合、昇格では新しい `accounts.default` エントリを作らず、そのアカウントを保持します。

## Configスキーマ

Plugin configは、マニフェスト内のJSON Schemaに対して検証されます。ユーザーは次のようにしてPluginを設定します:

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

登録時に、このconfigは `api.pluginConfig` としてPluginへ渡されます。

チャンネル固有configでは、代わりにチャンネルconfigセクションを使います:

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

### チャンネルconfigスキーマの構築

`openclaw/plugin-sdk/core` の `buildChannelConfigSchema` を使うと、
Zodスキーマを、OpenClawが検証する `ChannelConfigSchema` ラッパーへ変換できます:

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

チャンネルPluginは、`openclaw onboard` 向けの対話型セットアップウィザードを提供できます。
ウィザードは `ChannelPlugin` 上の `ChannelSetupWizard` オブジェクトです:

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
      envPrompt: "環境変数の MY_CHANNEL_BOT_TOKEN を使いますか？",
      keepPrompt: "現在のトークンを保持しますか？",
      inputPrompt: "botトークンを入力してください:",
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

`ChannelSetupWizard` 型は、`credentials`、`textInputs`、
`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize` などをサポートします。
完全な例については、バンドル済みPluginパッケージ（たとえばDiscord Pluginの `src/channel.setup.ts`）を参照してください。

標準の
`note -> prompt -> parse -> merge -> patch` フローだけが必要なDM許可リストプロンプトでは、`openclaw/plugin-sdk/setup` の共有setupヘルパー
`createPromptParsedAllowFromForAccount(...)`、
`createTopLevelChannelParsedAllowFromPrompt(...)`、
`createNestedChannelParsedAllowFromPrompt(...)` を優先してください。

ラベル、スコア、および任意の追加行だけが異なるチャンネルsetup statusブロックでは、各Pluginで同じ `status` オブジェクトを手書きする代わりに、
`openclaw/plugin-sdk/setup` の `createStandardChannelSetupStatus(...)` を優先してください。

特定のコンテキストでのみ表示されるべき任意のsetup画面には、`openclaw/plugin-sdk/channel-setup` の `createOptionalChannelSetupSurface` を使用します:

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// { setupAdapter, setupWizard } を返します
```

`plugin-sdk/channel-setup` は、任意インストール画面の片方だけが必要な場合のために、
低レベルの
`createOptionalChannelSetupAdapter(...)` と
`createOptionalChannelSetupWizard(...)` ビルダーも公開しています。

生成された任意アダプター/ウィザードは、実際のconfig書き込みではfail closedします。
`validateInput`、
`applyAccountConfig`、`finalize` で同じインストール必須メッセージを再利用し、
`docsPath` が設定されていればdocsリンクを追加します。

バイナリ依存のsetup UIでは、各チャンネルに同じバイナリ/status接着コードを複製する代わりに、共有の委譲ヘルパーを優先してください:

- ラベル、ヒント、スコア、バイナリ検出だけが異なるstatusブロックには `createDetectedBinaryStatus(...)`
- パス依存のtext inputには `createCliPathTextInput(...)`
- `setupEntry` が重い完全ウィザードへ遅延委譲する必要がある場合は、
  `createDelegatedSetupWizardStatusResolvers(...)`、
  `createDelegatedPrepare(...)`、`createDelegatedFinalize(...)`、および
  `createDelegatedResolveConfigured(...)`
- `setupEntry` が `textInputs[*].shouldPrompt` 判定だけを委譲する必要がある場合は `createDelegatedTextInputShouldPrompt(...)`

## 公開とインストール

**外部Plugin:** [ClawHub](/ja-JP/tools/clawhub) またはnpmへ公開し、その後インストールします:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClawはまずClawHubを試し、自動的にnpmへフォールバックします。ClawHubを明示的に強制することもできます:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHubのみ
```

対応する `npm:` 上書きはありません。ClawHubフォールバック後にnpm経路を使いたい場合は、通常のnpmパッケージ指定を使用してください:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**リポジトリ内Plugin:** バンドル済みPluginワークスペースツリー配下に置けば、ビルド時に自動検出されます。

**ユーザーがインストールできるもの:**

```bash
openclaw plugins install <package-name>
```

<Info>
  npmソースのインストールでは、`openclaw plugins install` は
  `npm install --ignore-scripts`（ライフサイクルスクリプトなし）を実行します。Pluginの依存関係ツリーは純粋なJS/TSに保ち、
  `postinstall` ビルドを必要とするパッケージは避けてください。
</Info>

バンドル済みのOpenClaw所有Pluginだけが起動時修復の例外です。パッケージ版インストールで、Plugin config、旧チャンネルconfig、またはそのバンドル済みデフォルト有効マニフェストによってそのPluginが有効と見なされた場合、起動時に、そのPluginの欠けているランタイム依存関係をimport前にインストールします。サードパーティPluginは起動時インストールに依存すべきではありません。引き続き明示的なPluginインストーラーを使用してください。

## 関連

- [SDK Entry Points](/ja-JP/plugins/sdk-entrypoints) -- `definePluginEntry` と `defineChannelPluginEntry`
- [Plugin Manifest](/ja-JP/plugins/manifest) -- 完全なマニフェストスキーマリファレンス
- [Building Plugins](/ja-JP/plugins/building-plugins) -- ステップごとのはじめにガイド

---
read_when:
    - Plugin にセットアップウィザードを追加しています
    - setup-entry.ts と index.ts の違いを理解する必要があります
    - Plugin の config schema または package.json の openclaw metadata を定義しています
sidebarTitle: Setup and config
summary: セットアップウィザード、setup-entry.ts、config schema、および package.json metadata
title: Plugin のセットアップと設定
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-26T11:37:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5ac08bf43af0a15e4ed797eb3a732d15f24f67304efbac7d74e6f24ffe67af9
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Plugin のパッケージング（`package.json` metadata）、manifest（`openclaw.plugin.json`）、セットアップエントリ、および config schema のリファレンスです。

<Tip>
**手順付きのガイドを探していますか？** ハウツーガイドでは、パッケージングを文脈の中で扱っています: [Channel plugins](/ja-JP/plugins/sdk-channel-plugins#step-1-package-and-manifest) と [Provider plugins](/ja-JP/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
</Tip>

## パッケージ metadata

`package.json` には、Plugin システムにその Plugin が何を提供するかを伝える `openclaw` フィールドが必要です。

<Tabs>
  <Tab title="Channel plugin">
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
  </Tab>
  <Tab title="Provider plugin / ClawHub baseline">
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
  </Tab>
</Tabs>

<Note>
Plugin を ClawHub で外部公開する場合、これらの `compat` フィールドと `build` フィールドは必須です。正規の publish スニペットは `docs/snippets/plugin-publish/` にあります。
</Note>

### `openclaw` フィールド

<ParamField path="extensions" type="string[]">
  エントリポイントファイル（package root からの相対パス）。
</ParamField>
<ParamField path="setupEntry" type="string">
  軽量なセットアップ専用エントリ（任意）。
</ParamField>
<ParamField path="channel" type="object">
  セットアップ、picker、クイックスタート、および status サーフェス向けの channel catalog metadata。
</ParamField>
<ParamField path="providers" type="string[]">
  この Plugin によって登録される provider id。
</ParamField>
<ParamField path="install" type="object">
  インストールヒント: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery`。
</ParamField>
<ParamField path="startup" type="object">
  起動動作フラグ。
</ParamField>

### `openclaw.channel`

`openclaw.channel` は、ランタイムがロードされる前の channel discovery と setup サーフェスのための軽量な package metadata です。

| Field                                  | Type       | 意味                                                                        |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------- |
| `id`                                   | `string`   | 正規の channel id。                                                          |
| `label`                                | `string`   | 主要な channel label。                                                       |
| `selectionLabel`                       | `string`   | `label` と異なる必要がある場合の picker/setup label。                        |
| `detailLabel`                          | `string`   | より豊かな channel catalog と status サーフェス向けの副次的な detail label。 |
| `docsPath`                             | `string`   | セットアップおよび選択リンク用の docs path。                                 |
| `docsLabel`                            | `string`   | channel id と異なる必要がある場合に docs リンクで使われる上書き label。      |
| `blurb`                                | `string`   | 短いオンボーディング/catalog 説明。                                          |
| `order`                                | `number`   | channel catalog でのソート順。                                               |
| `aliases`                              | `string[]` | channel selection 用の追加 lookup alias。                                    |
| `preferOver`                           | `string[]` | この channel が優先されるべき低優先度の Plugin/channel id。                  |
| `systemImage`                          | `string`   | channel UI catalog 用の任意の icon/system-image 名。                         |
| `selectionDocsPrefix`                  | `string`   | selection サーフェスで docs リンクの前に置く接頭辞テキスト。                 |
| `selectionDocsOmitLabel`               | `boolean`  | selection copy でラベル付き docs リンクの代わりに docs path を直接表示します。 |
| `selectionExtras`                      | `string[]` | selection copy に追加される短い文字列。                                      |
| `markdownCapable`                      | `boolean`  | outbound formatting 判断のためにこの channel を markdown 対応として示します。 |
| `exposure`                             | `object`   | setup、configured list、および docs サーフェス向けの channel 可視性制御。     |
| `quickstartAllowFrom`                  | `boolean`  | この channel を標準クイックスタート `allowFrom` セットアップフローに含めます。 |
| `forceAccountBinding`                  | `boolean`  | アカウントが1つしか存在しない場合でも明示的な account binding を必須にします。 |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | この channel の announce target 解決時に session lookup を優先します。        |

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

`exposure` では以下をサポートします。

- `configured`: configured/status 形式の listing サーフェスに channel を含める
- `setup`: インタラクティブな setup/configure picker に channel を含める
- `docs`: docs/navigation サーフェスで channel を公開向けとしてマークする

<Note>
`showConfigured` と `showInSetup` はレガシーな alias として引き続きサポートされます。`exposure` を優先してください。
</Note>

### `openclaw.install`

`openclaw.install` は manifest metadata ではなく、package metadata です。

| Field                        | Type                 | 意味                                                                                 |
| ---------------------------- | -------------------- | ------------------------------------------------------------------------------------ |
| `npmSpec`                    | `string`             | install/update フロー用の正規 npm spec。                                             |
| `localPath`                  | `string`             | ローカル開発または同梱インストールパス。                                             |
| `defaultChoice`              | `"npm"` \| `"local"` | 両方利用可能な場合の優先インストール元。                                             |
| `minHostVersion`             | `string`             | `>=x.y.z` 形式の最小サポート OpenClaw バージョン。                                   |
| `expectedIntegrity`          | `string`             | ピン留めインストール用に期待される npm dist integrity 文字列。通常は `sha512-...`。 |
| `allowInvalidConfigRecovery` | `boolean`            | 同梱 Plugin の再インストールフローで特定の古い config 障害からの回復を可能にします。 |

<AccordionGroup>
  <Accordion title="オンボーディング動作">
    インタラクティブなオンボーディングでは、インストールオンデマンドのサーフェスにも `openclaw.install` を使用します。Plugin が、ランタイム読み込み前に provider auth の選択肢や channel setup/catalog metadata を公開している場合、オンボーディングではその選択肢を表示し、npm と local install のどちらにするかを確認し、Plugin をインストールまたは有効化してから、選択されたフローを続行できます。npm のオンボーディング選択肢には、registry `npmSpec` を持つ信頼された catalog metadata が必要です。正確なバージョンと `expectedIntegrity` は任意のピンです。`expectedIntegrity` が存在する場合、install/update フローはそれを強制します。「何を表示するか」の metadata は `openclaw.plugin.json` に、「どうインストールするか」の metadata は `package.json` に置いてください。
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    `minHostVersion` が設定されている場合、install と manifest-registry 読み込みの両方でそれが強制されます。古いホストはその Plugin をスキップし、無効なバージョン文字列は拒否されます。
  </Accordion>
  <Accordion title="Pinned npm installs">
    ピン留めされた npm インストールでは、`npmSpec` に正確なバージョンを維持し、期待される artifact integrity を追加してください。

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

  </Accordion>
  <Accordion title="allowInvalidConfigRecovery scope">
    `allowInvalidConfigRecovery` は、壊れた config に対する一般的な回避策ではありません。これは限定的な同梱 Plugin の回復専用であり、再インストール/セットアップが、同じ Plugin の欠落した同梱 Plugin パスや古い `channels.<id>` エントリのような既知のアップグレード残骸を修復できるようにするためのものです。無関係な理由で config が壊れている場合、インストールは引き続きクローズドフェイルし、オペレーターに `openclaw doctor --fix` を実行するよう伝えます。
  </Accordion>
</AccordionGroup>

### 遅延フルロード

Channel Plugin は、以下のようにして遅延ロードを有効にできます。

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

有効にすると、OpenClaw は pre-listen 起動フェーズ中、すでに設定済みの channel であっても `setupEntry` のみを読み込みます。完全なエントリは gateway が listen を開始した後に読み込まれます。

<Warning>
遅延ロードを有効にするのは、gateway が listen を開始する前に必要なすべて（channel registration、HTTP route、gateway method）を `setupEntry` が登録する場合だけにしてください。完全なエントリが必要な起動機能を所有している場合は、デフォルト動作のままにしてください。
</Warning>

セットアップ/完全エントリが gateway RPC method を登録する場合は、それらを Plugin 固有の接頭辞にしてください。予約済みのコア管理 namespace（`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`）はコア管理のままであり、常に `operator.admin` に解決されます。

## Plugin manifest

すべてのネイティブ Plugin は、package root に `openclaw.plugin.json` を含める必要があります。OpenClaw はこれを使って、Plugin コードを実行せずに config を検証します。

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

Channel Plugin では、`kind` と `channels` を追加します。

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

config を持たない Plugin であっても schema を含める必要があります。空の schema でも有効です。

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

完全な schema リファレンスについては、[Plugin manifest](/ja-JP/plugins/manifest) を参照してください。

## ClawHub 公開

Plugin package には、package 専用の ClawHub コマンドを使用します。

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
従来の skill 専用 publish alias は Skills 用です。Plugin package では常に `clawhub package publish` を使用してください。
</Note>

## セットアップエントリ

`setup-entry.ts` ファイルは、OpenClaw がセットアップ用サーフェス（オンボーディング、config 修復、無効化された channel の検査）だけを必要とする場合に読み込む、`index.ts` の軽量な代替です。

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

これにより、セットアップフロー中に重いランタイムコード（crypto ライブラリ、CLI 登録、バックグラウンドサービス）を読み込まずに済みます。

セットアップ安全な export を sidecar module に保持している同梱ワークスペース channel は、`defineSetupPluginEntry(...)` の代わりに `openclaw/plugin-sdk/channel-entry-contract` の `defineBundledChannelSetupEntry(...)` を使用できます。この同梱契約は、セットアップ時のランタイム配線を軽量かつ明示的に保つための任意の `runtime` export もサポートします。

<AccordionGroup>
  <Accordion title="OpenClaw が完全なエントリの代わりに setupEntry を使う場合">
    - channel が無効化されているが、セットアップ/オンボーディング用サーフェスが必要な場合。
    - channel は有効だが未設定の場合。
    - 遅延ロードが有効な場合（`deferConfiguredChannelFullLoadUntilAfterListen`）。
  </Accordion>
  <Accordion title="setupEntry が登録しなければならないもの">
    - channel Plugin オブジェクト（`defineSetupPluginEntry` 経由）。
    - gateway が listen を開始する前に必要な HTTP route。
    - 起動中に必要な gateway method。

    これらの起動用 gateway method でも、`config.*` や `update.*` のような予約済みのコア管理 namespace は引き続き避ける必要があります。

  </Accordion>
  <Accordion title="setupEntry に含めるべきではないもの">
    - CLI 登録。
    - バックグラウンドサービス。
    - 重いランタイム import（crypto、SDK）。
    - 起動後にのみ必要な gateway method。
  </Accordion>
</AccordionGroup>

### 狭いセットアップヘルパー import

高速なセットアップ専用パスでは、セットアップサーフェスの一部だけが必要な場合、より広い `plugin-sdk/setup` アンブレラよりも狭いセットアップヘルパーの接続面を優先してください。

| Import path                        | 用途                                                                                     | 主な export                                                                                                                                                                                                                                                                              |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | `setupEntry` / 遅延 channel 起動で引き続き利用できるセットアップ時ランタイムヘルパー     | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 環境対応の account setup adapter                                                         | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                    |
| `plugin-sdk/setup-tools`           | セットアップ/インストール用 CLI/archive/docs ヘルパー                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                          |

`moveSingleAccountChannelSectionToDefaultAccount(...)` のような config-patch ヘルパーを含む、共有セットアップツール一式全体が必要な場合は、より広い `plugin-sdk/setup` の接続面を使用してください。

セットアップ patch adapter は import 時に高速パス安全なままです。それらの同梱 single-account promotion 契約サーフェス lookup は遅延されるため、`plugin-sdk/setup-runtime` を import しても、adapter が実際に使用される前に同梱契約サーフェス discovery が先行読み込みされることはありません。

### Channel 所有の single-account promotion

channel が単一アカウントのトップレベル config から `channels.<id>.accounts.*` にアップグレードする場合、デフォルトの共有動作では、昇格される account スコープの値を `accounts.default` に移動します。

同梱 channel は、セットアップ契約サーフェスを通じてこの昇格を絞り込んだり上書きしたりできます。

- `singleAccountKeysToMove`: 昇格された account に移動すべき追加のトップレベル key
- `namedAccountPromotionKeys`: すでに名前付きアカウントが存在する場合、昇格された account に移動するのはこれらの key のみで、共有の policy/delivery key は channel root に残ります
- `resolveSingleAccountPromotionTarget(...)`: 昇格された値を受け取る既存アカウントを選択します

<Note>
Matrix は現在の同梱例です。名前付き Matrix アカウントがすでにちょうど1つ存在する場合、または `defaultAccount` が `Ops` のような既存の非標準 key を指している場合、昇格では新しい `accounts.default` エントリを作成せず、そのアカウントを保持します。
</Note>

## Config schema

Plugin config は、manifest 内の JSON Schema に対して検証されます。ユーザーは以下のように Plugin を設定します。

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

Plugin は登録時に、この config を `api.pluginConfig` として受け取ります。

channel 固有の config には、代わりに channel config セクションを使用してください。

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

### Channel config schema の構築

Zod schema を、Plugin 所有の config artifact で使用される `ChannelConfigSchema` ラッパーに変換するには、`buildChannelConfigSchema` を使用します。

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

サードパーティ Plugin では、コールドパス契約は引き続き Plugin manifest です。生成された JSON Schema を `openclaw.plugin.json#channelConfigs` に反映して、config schema、setup、および UI サーフェスがランタイムコードを読み込まずに `channels.<id>` を検査できるようにしてください。

## セットアップウィザード

Channel Plugin は `openclaw onboard` 用のインタラクティブなセットアップウィザードを提供できます。ウィザードは `ChannelPlugin` 上の `ChannelSetupWizard` オブジェクトです。

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

`ChannelSetupWizard` 型は、`credentials`、`textInputs`、`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize` などをサポートします。完全な例については、同梱 Plugin package（たとえば Discord Plugin の `src/channel.setup.ts`）を参照してください。

<AccordionGroup>
  <Accordion title="共有 allowFrom プロンプト">
    標準の `note -> prompt -> parse -> merge -> patch` フローだけが必要な DM allowlist プロンプトには、`openclaw/plugin-sdk/setup` の共有セットアップヘルパーを優先してください: `createPromptParsedAllowFromForAccount(...)`、`createTopLevelChannelParsedAllowFromPrompt(...)`、`createNestedChannelParsedAllowFromPrompt(...)`。
  </Accordion>
  <Accordion title="標準 channel セットアップ status">
    label、score、および任意の追加行だけが異なる channel セットアップ status ブロックには、各 Plugin で同じ `status` オブジェクトを手作業で組み立てる代わりに、`openclaw/plugin-sdk/setup` の `createStandardChannelSetupStatus(...)` を優先してください。
  </Accordion>
  <Accordion title="任意の channel セットアップサーフェス">
    特定の文脈でのみ表示されるべき任意のセットアップサーフェスには、`openclaw/plugin-sdk/channel-setup` の `createOptionalChannelSetupSurface` を使用してください。

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

    `plugin-sdk/channel-setup` では、任意インストールサーフェスの片方だけが必要な場合に使える、より低レベルな `createOptionalChannelSetupAdapter(...)` と `createOptionalChannelSetupWizard(...)` ビルダーも公開しています。

    生成された任意 adapter/ウィザードは、実際の config 書き込み時にはクローズドフェイルします。これらは `validateInput`、`applyAccountConfig`、`finalize` で1つのインストール必須メッセージを再利用し、`docsPath` が設定されている場合は docs リンクを追加します。

  </Accordion>
  <Accordion title="バイナリ対応セットアップヘルパー">
    バイナリ対応のセットアップ UI では、同じ binary/status の接着コードを各 channel にコピーする代わりに、共有の委譲ヘルパーを優先してください。

    - label、hint、score、および binary detection だけが異なる status ブロックには `createDetectedBinaryStatus(...)`
    - パスベース text input には `createCliPathTextInput(...)`
    - `setupEntry` がより重い完全ウィザードへ遅延委譲する必要がある場合は `createDelegatedSetupWizardStatusResolvers(...)`、`createDelegatedPrepare(...)`、`createDelegatedFinalize(...)`、`createDelegatedResolveConfigured(...)`
    - `setupEntry` が `textInputs[*].shouldPrompt` の判定だけを委譲する必要がある場合は `createDelegatedTextInputShouldPrompt(...)`

  </Accordion>
</AccordionGroup>

## 公開とインストール

**外部 Plugin:** [ClawHub](/ja-JP/tools/clawhub) または npm に公開し、その後インストールします。

<Tabs>
  <Tab title="Auto (ClawHub then npm)">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw は最初に ClawHub を試し、自動的に npm に fallback します。

  </Tab>
  <Tab title="ClawHub only">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm package spec">
    対応する `npm:` オーバーライドはありません。ClawHub fallback の後で npm パスを使いたい場合は、通常の npm package spec を使用してください。

    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**リポジトリ内 Plugin:** 同梱 Plugin ワークスペースツリーの下に配置すると、ビルド時に自動的に検出されます。

**ユーザーは次のようにインストールできます:**

```bash
openclaw plugins install <package-name>
```

<Info>
npm ソースのインストールでは、`openclaw plugins install` はプロジェクトローカルの `npm install --ignore-scripts`（ライフサイクルスクリプトなし）を実行し、継承されたグローバル npm install 設定を無視します。Plugin の依存ツリーは純粋な JS/TS に保ち、`postinstall` ビルドを必要とする package は避けてください。
</Info>

<Note>
起動時修復の例外は、同梱された OpenClaw 管理 Plugin のみです。パッケージ化されたインストールで、Plugin config、レガシー channel config、または同梱 manifest のデフォルト有効設定によってそれらの Plugin の1つが有効化されていると判定された場合、起動時に import 前にその Plugin の不足しているランタイム依存関係をインストールします。サードパーティ Plugin は起動時インストールに依存すべきではありません。引き続き明示的な Plugin インストーラーを使用してください。
</Note>

## 関連項目

- [Building plugins](/ja-JP/plugins/building-plugins) — ステップごとの はじめに ガイド
- [Plugin manifest](/ja-JP/plugins/manifest) — 完全な manifest schema リファレンス
- [SDK entry points](/ja-JP/plugins/sdk-entrypoints) — `definePluginEntry` と `defineChannelPluginEntry`

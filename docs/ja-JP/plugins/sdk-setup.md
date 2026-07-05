---
read_when:
    - Plugin にセットアップウィザードを追加しています
    - setup-entry.ts と index.ts の違いを理解する必要があります
    - Plugin の設定スキーマまたは package.json の openclaw メタデータを定義している
sidebarTitle: Setup and config
summary: セットアップウィザード、setup-entry.ts、設定スキーマ、package.json メタデータ
title: Plugin のセットアップと設定
x-i18n:
    generated_at: "2026-07-05T11:40:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b47e1f18a92871c442980168e302c82d7aa9a38b38bbbeed4add9dd6479365b
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Plugin のパッケージ化（`package.json` メタデータ）、マニフェスト（`openclaw.plugin.json`）、セットアップエントリ、構成スキーマのリファレンス。

<Tip>
**ウォークスルーを探していますか？** ハウツーガイドでは、文脈に沿ってパッケージ化を扱っています: [チャネル Plugin](/ja-JP/plugins/sdk-channel-plugins#step-1-package-and-manifest) と [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
</Tip>

## パッケージメタデータ

`package.json` には、Plugin システムにその Plugin が提供する内容を伝える `openclaw` フィールドが必要です。

<Tabs>
  <Tab title="チャネル Plugin">
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
  <Tab title="プロバイダー Plugin / ClawHub ベースライン">
    ```json openclaw-clawhub-package.json
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
  </Tab>
</Tabs>

<Note>
ClawHub で外部公開するには `compat` と `build` が必要です。正規の公開スニペットは `docs/snippets/plugin-publish/` にあります。
</Note>

### `openclaw` フィールド

<ParamField path="extensions" type="string[]">
  エントリポイントファイル（パッケージルートからの相対パス）。ワークスペースと git checkout 開発で有効なソースエントリです。
</ParamField>
<ParamField path="runtimeExtensions" type="string[]">
  `extensions` に対応するビルド済み JavaScript ピア。OpenClaw がインストール済み npm パッケージを読み込む場合に優先されます。ソース/ビルド済みの解決順序については [SDK エントリポイント](/ja-JP/plugins/sdk-entrypoints) を参照してください。
</ParamField>
<ParamField path="setupEntry" type="string">
  軽量なセットアップ専用エントリ（任意）。
</ParamField>
<ParamField path="runtimeSetupEntry" type="string">
  `setupEntry` に対応するビルド済み JavaScript ピア。`setupEntry` も設定されている必要があります。
</ParamField>
<ParamField path="plugin" type="object">
  `{ id, label }` のフォールバック Plugin アイデンティティ。Plugin に id または label を導出できるチャネル/プロバイダーメタデータがない場合に使用されます。
</ParamField>
<ParamField path="channel" type="object">
  セットアップ、ピッカー、クイックスタート、ステータス表示面向けのチャネルカタログメタデータ。
</ParamField>
<ParamField path="install" type="object">
  インストールヒント: `npmSpec`、`localPath`、`defaultChoice`、`minHostVersion`、`expectedIntegrity`、`allowInvalidConfigRecovery`、`requiredPlatformPackages`。
</ParamField>
<ParamField path="startup" type="object">
  起動動作フラグ。
</ParamField>
<ParamField path="compat" type="object">
  この Plugin がサポートする `pluginApi` バージョン範囲。外部 ClawHub 公開では必須です。
</ParamField>

<Note>
プロバイダー id（`providers: string[]`）はパッケージメタデータではなく、マニフェストメタデータです。ここではなく `openclaw.plugin.json` で宣言してください — [Plugin マニフェスト](/ja-JP/plugins/manifest) を参照してください。
</Note>

### `openclaw.channel`

`openclaw.channel` は、ランタイムの読み込み前にチャネル検出とセットアップ表示面で使う軽量なパッケージメタデータです。

| フィールド                             | 型         | 意味                                                                          |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | 正規のチャネル id。                                                           |
| `label`                                | `string`   | 主要なチャネルラベル。                                                        |
| `selectionLabel`                       | `string`   | `label` と異なるべき場合のピッカー/セットアップラベル。                      |
| `detailLabel`                          | `string`   | よりリッチなチャネルカタログとステータス表示面向けの補助詳細ラベル。        |
| `docsPath`                             | `string`   | セットアップと選択リンク向けのドキュメントパス。                              |
| `docsLabel`                            | `string`   | チャネル id と異なるべき場合にドキュメントリンクで使用される上書きラベル。   |
| `blurb`                                | `string`   | 短いオンボーディング/カタログ説明。                                           |
| `order`                                | `number`   | チャネルカタログでの並び順。                                                   |
| `aliases`                              | `string[]` | チャネル選択用の追加検索エイリアス。                                          |
| `preferOver`                           | `string[]` | このチャネルが優先されるべき、優先度の低い Plugin/チャネル id。              |
| `systemImage`                          | `string`   | チャネル UI カタログ向けの任意のアイコン/システム画像名。                    |
| `selectionDocsPrefix`                  | `string`   | 選択表示面のドキュメントリンク前の接頭テキスト。                              |
| `selectionDocsOmitLabel`               | `boolean`  | 選択コピー内で、ラベル付きドキュメントリンクではなくドキュメントパスを直接表示します。 |
| `selectionExtras`                      | `string[]` | 選択コピーに追加される短い文字列。                                            |
| `markdownCapable`                      | `boolean`  | 送信フォーマット判断のために、そのチャネルが Markdown 対応であることを示します。 |
| `exposure`                             | `object`   | セットアップ、構成済み一覧、ドキュメント表示面向けのチャネル可視性制御。      |
| `quickstartAllowFrom`                  | `boolean`  | このチャネルを標準のクイックスタート `allowFrom` セットアップフローに参加させます。 |
| `forceAccountBinding`                  | `boolean`  | アカウントが 1 つしか存在しない場合でも明示的なアカウント紐付けを要求します。 |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | このチャネルの告知ターゲット解決時にセッション検索を優先します。              |

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

`exposure` は以下をサポートします。

- `configured`: 構成済み/ステータス形式の一覧表示面にチャネルを含める
- `setup`: 対話型のセットアップ/構成ピッカーにチャネルを含める
- `docs`: ドキュメント/ナビゲーション表示面でチャネルを公開向けとしてマークする

<Note>
`showConfigured` と `showInSetup` はレガシーエイリアスとして引き続きサポートされます。`exposure` を優先してください。
</Note>

### `openclaw.install`

`openclaw.install` はパッケージメタデータであり、マニフェストメタデータではありません。

| フィールド                   | 型                                  | 意味                                                                              |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | インストール/更新とオンボーディングのオンデマンドインストールフロー向けの正規 ClawHub spec。 |
| `npmSpec`                    | `string`                            | インストール/更新のフォールバックフロー向けの正規 npm spec。                      |
| `localPath`                  | `string`                            | ローカル開発またはバンドル済みインストールパス。                                  |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | 複数のソースが利用可能な場合の優先インストール元。                                |
| `minHostVersion`             | `string`                            | サポートされる最小 OpenClaw バージョン、`>=x.y.z` または `>=x.y.z-prerelease`。     |
| `expectedIntegrity`          | `string`                            | ピン留めインストール用の期待 npm dist 整合性文字列。通常は `sha512-...`。         |
| `allowInvalidConfigRecovery` | `boolean`                           | バンドル済み Plugin の再インストールフローが特定の古い構成失敗から復旧できるようにします。 |
| `requiredPlatformPackages`   | `string[]`                          | npm install 中に検証される、必要なプラットフォーム固有 npm エイリアス。            |

<AccordionGroup>
  <Accordion title="オンボーディング動作">
    対話型オンボーディングは、オンデマンドインストール表示面で `openclaw.install` を使用します。Plugin がランタイム読み込み前にプロバイダー認証選択肢またはチャネルのセットアップ/カタログメタデータを公開している場合、オンボーディングは ClawHub、npm、またはローカルインストールを促し、Plugin をインストールまたは有効化してから、選択されたフローを続行できます。ClawHub の選択肢は `clawhubSpec` を使用し、存在する場合は優先されます。npm の選択肢には、レジストリ `npmSpec` を含む信頼済みカタログメタデータが必要です（正確なバージョンと `expectedIntegrity` は任意のピンで、設定されている場合はインストール/更新時に強制されます）。「何を表示するか」は `openclaw.plugin.json` に、「どうインストールするか」は `package.json` に置いてください。
  </Accordion>
  <Accordion title="minHostVersion の適用">
    `minHostVersion` が設定されている場合、インストールと非バンドルのマニフェストレジストリ読み込みの両方で適用されます。古いホストは外部 Plugin をスキップします。不正なバージョン文字列は拒否されます。バンドル済みソース Plugin は、ホスト checkout と同じバージョンであると見なされます。
  </Accordion>
  <Accordion title="ピン留め npm インストール">
    ピン留め npm インストールでは、`npmSpec` に正確なバージョンを保持し、期待されるアーティファクト整合性を追加してください。

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
  <Accordion title="allowInvalidConfigRecovery のスコープ">
    `allowInvalidConfigRecovery` は壊れた構成に対する一般的なバイパスではありません。これは狭い範囲のバンドル済み Plugin 復旧専用であり、バンドル済み Plugin パスの欠落や、その同じ Plugin の古い `channels.<id>` エントリなど、既知のアップグレード残存物を再インストール/セットアップで修復できるようにします。無関係な理由で構成が壊れている場合、インストールは引き続き fail closed し、オペレーターに `openclaw doctor --fix` の実行を促します。
  </Accordion>
</AccordionGroup>

### 遅延フルロード

チャネル Plugin は、次のように遅延読み込みにオプトインできます。

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

有効にすると、OpenClaw はすでに構成済みのチャネルであっても、listen 前の起動フェーズでは `setupEntry` のみを読み込みます。Gateway が listen を開始した後にフルエントリが読み込まれます。

<Warning>
`setupEntry` が Gateway の listen 開始前に必要なすべて（チャネル登録、HTTP ルート、Gateway メソッド）を登録する場合にのみ、遅延読み込みを有効にしてください。必要な起動機能をフルエントリが所有している場合は、既定の動作を維持してください。
</Warning>

セットアップ/フルエントリが Gateway RPC メソッドを登録する場合は、Plugin 固有のプレフィックスに置いてください。予約済みのコア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）はコア所有のままで、常に `operator.admin` に正規化されます。

## Plugin マニフェスト

すべてのネイティブ Plugin は、パッケージルートに `openclaw.plugin.json` を同梱する必要があります。OpenClaw はこれを使い、Plugin コードを実行せずに config を検証します。

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

チャネル Plugin では、`channels` を追加します（provider Plugin では `providers` を追加します）。

```json
{
  "id": "my-channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

config がない Plugin でも schema を同梱する必要があります。空の schema は有効です。

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

## ClawHub での公開

Skills と Plugin パッケージは別々の ClawHub publish コマンドを使用します。Plugin パッケージでは、パッケージ固有のコマンドを使用します。

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
`clawhub skill publish <path>` は skill フォルダーを公開するための別コマンドであり、Plugin パッケージ用ではありません。[ClawHub での公開](/ja-JP/clawhub/publishing) を参照してください。
</Note>

## Setup entry

`setup-entry.ts` は `index.ts` の軽量な代替で、OpenClaw がセットアップ surface（オンボーディング、config 修復、無効なチャネルの検査）だけを必要とする場合に読み込まれます。

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

これにより、セットアップフロー中に重いランタイムコード（crypto ライブラリ、CLI 登録、バックグラウンドサービス）を読み込まずに済みます。

セットアップセーフな export を sidecar モジュールに保持するバンドル済みワークスペースチャネルは、`defineSetupPluginEntry(...)` の代わりに `openclaw/plugin-sdk/channel-entry-contract` の `defineBundledChannelSetupEntry(...)` を使用できます。そのバンドル済み contract は任意の `runtime` export もサポートするため、セットアップ時の runtime wiring を軽量かつ明示的に保てます。

<AccordionGroup>
  <Accordion title="OpenClaw が完全な entry の代わりに setupEntry を使う場合">
    - チャネルは無効だが、セットアップ/オンボーディング surface が必要な場合。
    - チャネルは有効だが未設定の場合。
    - 遅延読み込みが有効な場合（`deferConfiguredChannelFullLoadUntilAfterListen`）。

  </Accordion>
  <Accordion title="setupEntry が登録する必要があるもの">
    - チャネル Plugin オブジェクト（`defineSetupPluginEntry` 経由）。
    - Gateway listen 前に必要な HTTP routes。
    - 起動中に必要な Gateway methods。

    これらの起動時 Gateway methods は、引き続き `config.*` や `update.*` などの予約済み core admin namespaces を避けるべきです。

  </Accordion>
  <Accordion title="setupEntry に含めるべきではないもの">
    - CLI 登録。
    - バックグラウンドサービス。
    - 重い runtime imports（crypto、SDK）。
    - 起動後にのみ必要な Gateway methods。

  </Accordion>
</AccordionGroup>

### 狭いセットアップ helper import

ホットなセットアップ専用パスでは、セットアップ surface の一部だけが必要な場合、広範な `plugin-sdk/setup` umbrella よりも狭いセットアップ helper seam を優先してください。

| import path                        | 用途                                                                                | 主な export                                                                                                                                                                                                                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | `setupEntry` / 遅延チャネル起動で利用可能なままにするセットアップ時 runtime helpers | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 非推奨の互換 alias。`plugin-sdk/setup-runtime` を使用してください                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | セットアップ/インストール CLI/archive/docs helpers                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

`moveSingleAccountChannelSectionToDefaultAccount(...)` などの config patch helpers を含む、完全な共有セットアップ toolbox が必要な場合は、より広範な `plugin-sdk/setup` seam を使用してください。

固定のセットアップ ウィザード文言には `createSetupTranslator(...)` を使用してください。これは CLI ウィザードの locale（`OPENCLAW_LOCALE`、次にシステム locale 変数）に従い、英語にフォールバックします。Plugin 固有のセットアップテキストは Plugin 所有のコードに置き、共有 catalog keys は共通のセットアップ labels、status text、公式バンドル Plugin のセットアップ文言にのみ使用してください。

セットアップ patch adapters は import 時にホットパス安全です。バンドル済み単一アカウント昇格の contract-surface lookup は lazy なので、`plugin-sdk/setup-runtime` を import しても、adapter が実際に使われる前にバンドル済み contract-surface discovery を eager に読み込むことはありません。

### チャネル所有の単一アカウント昇格

チャネルが単一アカウントのトップレベル config から `channels.<id>.accounts.*` にアップグレードされると、デフォルトの共有動作では、昇格された account-scoped 値が `accounts.default` に移動されます。

バンドル済みチャネルは、setup contract surface を通じてその昇格を絞り込むか上書きできます。

- `singleAccountKeysToMove`: 昇格されたアカウントに移動すべき追加のトップレベル keys
- `namedAccountPromotionKeys`: named accounts がすでに存在する場合、これらの keys のみが昇格されたアカウントに移動します。共有 policy/delivery keys はチャネルルートに残ります
- `resolveSingleAccountPromotionTarget(...)`: どの既存アカウントが昇格された値を受け取るかを選択します

<Note>
Matrix が現在のバンドル済み例です。named Matrix account がちょうど 1 つすでに存在する場合、または `defaultAccount` が `Ops` のような既存の非正規 key を指している場合、昇格は新しい `accounts.default` entry を作成せず、そのアカウントを保持します。
</Note>

## Config schema

Plugin config は manifest 内の JSON Schema に対して検証されます。ユーザーは次のように Plugin を設定します。

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

Plugin は登録中にこの config を `api.pluginConfig` として受け取ります。

チャネル固有の config には、代わりにチャネル config section を使用してください。

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

### チャネル config schema の構築

`buildChannelConfigSchema` を使用して、Zod schema を Plugin 所有の config artifacts で使われる `ChannelConfigSchema` wrapper に変換します。

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

すでに contract を JSON Schema または TypeBox として作成している場合は、OpenClaw が metadata paths 上で Zod-to-JSON-Schema 変換をスキップできるように、直接 helper を使用してください。

```typescript
import { Type } from "typebox";
import { buildJsonChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const configSchema = buildJsonChannelConfigSchema(
  Type.Object({
    token: Type.Optional(Type.String()),
    allowFrom: Type.Optional(Type.Array(Type.String())),
  }),
);
```

サードパーティ Plugin では、cold-path contract は引き続き Plugin manifest です。生成された JSON Schema を `openclaw.plugin.json#channelConfigs` に mirror し、runtime code を読み込まずに config schema、setup、UI surfaces が `channels.<id>` を検査できるようにしてください。

## セットアップ ウィザード

チャネル Plugin は `openclaw onboard` 用の対話型セットアップ ウィザードを提供できます。ウィザードは `ChannelPlugin` 上の `ChannelSetupWizard` オブジェクトです。

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

`ChannelSetupWizard` は `textInputs`、`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize` などもサポートします。完全なバンドル済み例については、Discord Plugin の `src/setup-core.ts` を参照してください。

<AccordionGroup>
  <Accordion title="共有 allowFrom prompts">
    標準の `note -> prompt -> parse -> merge -> patch` フローだけが必要な DM allowlist prompts では、`openclaw/plugin-sdk/setup` の共有セットアップ helpers、`createPromptParsedAllowFromForAccount(...)`、`createTopLevelChannelParsedAllowFromPrompt(...)`、`createNestedChannelParsedAllowFromPrompt(...)` を優先してください。
  </Accordion>
  <Accordion title="標準チャネルセットアップ status">
    labels、scores、任意の追加行だけが異なるチャネルセットアップ status blocks では、各 Plugin で同じ `status` オブジェクトを手作りする代わりに、`openclaw/plugin-sdk/setup` の `createStandardChannelSetupStatus(...)` を優先してください。
  </Accordion>
  <Accordion title="任意のチャネルセットアップ surface">
    特定のコンテキストでのみ表示されるべき任意のセットアップ surfaces には、`openclaw/plugin-sdk/channel-setup` の `createOptionalChannelSetupSurface` を使用してください。

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

    `plugin-sdk/channel-setup` は、その optional-install surface の片側だけが必要な場合に使える、より低レベルの `createOptionalChannelSetupAdapter(...)` と `createOptionalChannelSetupWizard(...)` builders も公開しています。

    生成された任意のアダプター/ウィザードは、実際の設定書き込みではフェイルクローズします。`validateInput`、`applyAccountConfig`、`finalize` 全体でインストール必須を示す同じメッセージを再利用し、`docsPath` が設定されている場合はドキュメントリンクを追加します。

  </Accordion>
  <Accordion title="バイナリを使うセットアップヘルパー">
    バイナリを使うセットアップ UI では、同じバイナリ/ステータスの接着コードを各チャネルにコピーする代わりに、共有の委任ヘルパーを優先してください。

    - ラベル、ヒント、スコア、バイナリ検出だけが異なるステータスブロックには `createDetectedBinaryStatus(...)`
    - パスを保持するテキスト入力には `createCliPathTextInput(...)`
    - `setupEntry` がより重い完全なウィザードへ遅延して転送する必要がある場合は `createDelegatedSetupWizardStatusResolvers(...)`、`createDelegatedPrepare(...)`、`createDelegatedFinalize(...)`、`createDelegatedResolveConfigured(...)`
    - `setupEntry` が `textInputs[*].shouldPrompt` の判断だけを委任する必要がある場合は `createDelegatedTextInputShouldPrompt(...)`

  </Accordion>
</AccordionGroup>

## 公開とインストール

**外部 Plugin:** [ClawHub](/ja-JP/clawhub) に公開してからインストールします。

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    ベアパッケージ指定は、名前がバンドル済みまたは公式の Plugin ID と一致しない限り、起動時の切り替え中に npm からインストールされます。一致する場合、OpenClaw は代わりにそのローカル/公式コピーを使用します。決定的なソース選択には `clawhub:`、`npm:`、`git:`、または `npm-pack:` を使用してください。[Plugin の管理](/ja-JP/plugins/manage-plugins) を参照してください。

  </Tab>
  <Tab title="ClawHub のみ">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm パッケージ指定">
    パッケージがまだ ClawHub に移行していない場合、または移行中に直接 npm インストールパスが必要な場合は、npm を使用します。

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**リポジトリ内 Plugin:** バンドル済み Plugin ワークスペースツリーの下に配置します。ビルド中に自動的に検出されます。

<Info>
npm 由来のインストールでは、`openclaw plugins install` はライフサイクルスクリプトを無効化した状態（`--ignore-scripts`）で、パッケージを `~/.openclaw/npm/projects` 配下の Plugin ごとのプロジェクトにインストールします。Plugin の依存関係ツリーは純粋な JS/TS に保ち、`postinstall` ビルドを必要とするパッケージは避けてください。
</Info>

<Note>
Gateway の起動時に Plugin の依存関係はインストールされません。npm/git/ClawHub のインストールフローが依存関係の収束を所有します。ローカル Plugin は、依存関係がすでにインストールされている必要があります。
</Note>

バンドル済みパッケージのメタデータは明示的であり、Gateway 起動時にビルド済み JavaScript から推論されるものではありません。ランタイム依存関係は、それを所有する Plugin パッケージに属します。パッケージ化された OpenClaw の起動処理が Plugin の依存関係を修復したりミラーしたりすることはありません。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins) — ステップバイステップのはじめにガイド
- [Plugin manifest](/ja-JP/plugins/manifest) — 完全な manifest スキーマリファレンス
- [SDK エントリポイント](/ja-JP/plugins/sdk-entrypoints) — `definePluginEntry` と `defineChannelPluginEntry`

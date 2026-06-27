---
read_when:
    - プラグインにセットアップウィザードを追加しています
    - setup-entry.ts と index.ts の違いを理解する必要があります
    - Plugin 設定スキーマまたは package.json の openclaw メタデータを定義している
sidebarTitle: Setup and config
summary: セットアップウィザード、setup-entry.ts、設定スキーマ、package.json メタデータ
title: Plugin のセットアップと設定
x-i18n:
    generated_at: "2026-06-27T12:35:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a6ca729c40270e9280fb61d8891e53b1c351c0afcc9f894c515be06b02fece95
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Plugin パッケージング（`package.json` メタデータ）、マニフェスト（`openclaw.plugin.json`）、セットアップエントリ、設定スキーマのリファレンス。

<Tip>
**チュートリアルを探していますか？** ハウツーガイドでは、文脈に沿ってパッケージングを扱っています: [チャンネル Plugin](/ja-JP/plugins/sdk-channel-plugins#step-1-package-and-manifest) と [Provider Plugin](/ja-JP/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
</Tip>

## パッケージメタデータ

`package.json` には、Plugin システムにその Plugin が何を提供するかを伝える `openclaw` フィールドが必要です:

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
Plugin を ClawHub で外部公開する場合、これらの `compat` フィールドと `build` フィールドは必須です。正規の公開スニペットは `docs/snippets/plugin-publish/` にあります。
</Note>

### `openclaw` フィールド

<ParamField path="extensions" type="string[]">
  エントリポイントファイル（パッケージルートからの相対パス）。
</ParamField>
<ParamField path="setupEntry" type="string">
  軽量なセットアップ専用エントリ（任意）。
</ParamField>
<ParamField path="channel" type="object">
  セットアップ、ピッカー、クイックスタート、ステータス画面向けのチャンネルカタログメタデータ。
</ParamField>
<ParamField path="providers" type="string[]">
  この Plugin によって登録される Provider id。
</ParamField>
<ParamField path="install" type="object">
  インストールのヒント: `npmSpec`、`localPath`、`defaultChoice`、`minHostVersion`、`expectedIntegrity`、`allowInvalidConfigRecovery`。
</ParamField>
<ParamField path="startup" type="object">
  起動動作フラグ。
</ParamField>

### `openclaw.channel`

`openclaw.channel` は、ランタイムがロードされる前にチャンネルの検出とセットアップ画面で使われる、軽量なパッケージメタデータです。

| フィールド                             | 型         | 意味                                                                          |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | 正規のチャンネル id。                                                         |
| `label`                                | `string`   | 主要なチャンネルラベル。                                                      |
| `selectionLabel`                       | `string`   | `label` と異なる必要がある場合の、ピッカー/セットアップ用ラベル。             |
| `detailLabel`                          | `string`   | より豊かなチャンネルカタログとステータス画面向けの副次的な詳細ラベル。        |
| `docsPath`                             | `string`   | セットアップリンクと選択リンク用のドキュメントパス。                          |
| `docsLabel`                            | `string`   | チャンネル id と異なる必要がある場合にドキュメントリンクで使う上書きラベル。  |
| `blurb`                                | `string`   | オンボーディング/カタログ用の短い説明。                                       |
| `order`                                | `number`   | チャンネルカタログ内の並び順。                                                |
| `aliases`                              | `string[]` | チャンネル選択用の追加ルックアップエイリアス。                                |
| `preferOver`                           | `string[]` | このチャンネルが優先されるべき、優先度の低い Plugin/チャンネル id。           |
| `systemImage`                          | `string`   | チャンネル UI カタログ用の任意のアイコン/システムイメージ名。                 |
| `selectionDocsPrefix`                  | `string`   | 選択画面でドキュメントリンクの前に置く接頭辞テキスト。                        |
| `selectionDocsOmitLabel`               | `boolean`  | 選択コピー内で、ラベル付きドキュメントリンクではなくドキュメントパスを直接表示する。 |
| `selectionExtras`                      | `string[]` | 選択コピーに追加される短い文字列。                                            |
| `markdownCapable`                      | `boolean`  | 送信フォーマットの判断で、チャンネルが markdown 対応であることを示す。        |
| `exposure`                             | `object`   | セットアップ、設定済み一覧、ドキュメント画面でのチャンネル表示制御。          |
| `quickstartAllowFrom`                  | `boolean`  | このチャンネルを標準クイックスタートの `allowFrom` セットアップフローに参加させる。 |
| `forceAccountBinding`                  | `boolean`  | アカウントが 1 つだけ存在する場合でも、明示的なアカウントバインドを要求する。 |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | このチャンネルのアナウンス対象を解決するときに、セッションルックアップを優先する。 |

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

`exposure` は以下をサポートします:

- `configured`: 設定済み/ステータス形式の一覧画面にチャンネルを含める
- `setup`: 対話型のセットアップ/設定ピッカーにチャンネルを含める
- `docs`: ドキュメント/ナビゲーション画面でチャンネルを公開向けとしてマークする

<Note>
`showConfigured` と `showInSetup` はレガシーエイリアスとして引き続きサポートされています。`exposure` を推奨します。
</Note>

### `openclaw.install`

`openclaw.install` はパッケージメタデータであり、マニフェストメタデータではありません。

| フィールド                   | 型                                  | 意味                                                                              |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | インストール/更新と、オンボーディング時のオンデマンドインストールフロー向けの正規 ClawHub spec。 |
| `npmSpec`                    | `string`                            | インストール/更新のフォールバックフロー向けの正規 npm spec。                     |
| `localPath`                  | `string`                            | ローカル開発またはバンドル済みインストールパス。                                  |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | 複数のソースが利用可能な場合の優先インストールソース。                            |
| `minHostVersion`             | `string`                            | `>=x.y.z` または `>=x.y.z-prerelease` 形式の、サポートされる最小 OpenClaw バージョン。 |
| `expectedIntegrity`          | `string`                            | 固定インストール向けの期待される npm dist integrity 文字列。通常は `sha512-...`。 |
| `allowInvalidConfigRecovery` | `boolean`                           | バンドル済み Plugin の再インストールフローが、特定の古い設定エラーから復旧できるようにする。 |
| `requiredPlatformPackages`   | `string[]`                          | npm install 中に検証される、必須のプラットフォーム固有 npm エイリアス。           |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    対話型オンボーディングも、オンデマンドインストール画面に `openclaw.install` を使用します。Plugin がランタイムのロード前に Provider 認証の選択肢やチャンネルセットアップ/カタログメタデータを公開している場合、オンボーディングはその選択肢を表示し、ClawHub、npm、またはローカルインストールを促し、Plugin をインストールまたは有効化してから、選択されたフローを続行できます。ClawHub のオンボーディング選択肢は `clawhubSpec` を使用し、存在する場合は優先されます。npm の選択肢には、レジストリ `npmSpec` を含む信頼済みカタログメタデータが必要です。正確なバージョンと `expectedIntegrity` は任意の npm ピンです。`expectedIntegrity` が存在する場合、インストール/更新フローは npm に対してそれを強制します。「何を表示するか」のメタデータは `openclaw.plugin.json` に、「どうインストールするか」のメタデータは `package.json` に置いてください。
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    `minHostVersion` が設定されている場合、インストールと非バンドルのマニフェストレジストリ読み込みの両方で強制されます。古いホストは外部 Plugin をスキップします。無効なバージョン文字列は拒否されます。バンドル済みソース Plugin は、ホストのチェックアウトと同じバージョンであると見なされます。
  </Accordion>
  <Accordion title="Pinned npm installs">
    固定 npm インストールでは、正確なバージョンを `npmSpec` に保持し、期待されるアーティファクト整合性を追加します:

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
    `allowInvalidConfigRecovery` は壊れた設定に対する一般的なバイパスではありません。これは狭い範囲のバンドル済み Plugin 復旧専用であり、再インストール/セットアップが、バンドル済み Plugin パスの欠落や同じ Plugin の古い `channels.<id>` エントリのような既知のアップグレード残骸を修復できるようにするものです。無関係な理由で設定が壊れている場合、インストールは引き続きフェイルクローズし、オペレーターに `openclaw doctor --fix` の実行を伝えます。
  </Accordion>
</AccordionGroup>

### 遅延フルロード

チャンネル Plugin は次のように遅延ロードを有効化できます:

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

有効にすると、OpenClaw はリッスン前の起動フェーズ中、すでに設定済みのチャンネルであっても `setupEntry` だけをロードします。完全なエントリは Gateway がリッスンを開始した後にロードされます。

<Warning>
遅延ロードは、`setupEntry` が Gateway のリッスン開始前に必要なものすべて（チャンネル登録、HTTP ルート、Gateway メソッド）を登録する場合にのみ有効にしてください。完全なエントリが必須の起動機能を所有している場合は、デフォルト動作のままにしてください。
</Warning>

セットアップ/完全エントリが Gateway RPC メソッドを登録する場合は、Plugin 固有のプレフィックスに置いてください。予約済みのコア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）はコア所有のままで、常に `operator.admin` に解決されます。

## Plugin マニフェスト

すべてのネイティブ Plugin は、パッケージルートに `openclaw.plugin.json` を同梱する必要があります。OpenClaw はこれを使用して、Plugin コードを実行せずに設定を検証します。

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

チャンネル Plugin の場合は、`kind` と `channels` を追加します:

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

設定がない Plugin でもスキーマを同梱する必要があります。空のスキーマは有効です:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

[Plugin マニフェスト](/ja-JP/plugins/manifest)で完全なスキーマリファレンスを参照してください。

## ClawHub 公開

Plugin パッケージには、パッケージ専用の ClawHub コマンドを使用します。

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
従来の Skills 専用公開エイリアスは Skills 用です。Plugin パッケージでは常に `clawhub package publish` を使用してください。
</Note>

## セットアップエントリ

`setup-entry.ts` ファイルは、OpenClaw がセットアップサーフェス（オンボーディング、設定修復、無効なチャネルの検査）だけを必要とする場合に読み込む、`index.ts` の軽量な代替です。

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

これにより、セットアップフロー中に重いランタイムコード（暗号ライブラリ、CLI 登録、バックグラウンドサービス）を読み込まずに済みます。

セットアップセーフなエクスポートをサイドカーモジュールに保持する同梱ワークスペースチャネルは、`defineSetupPluginEntry(...)` の代わりに `openclaw/plugin-sdk/channel-entry-contract` の `defineBundledChannelSetupEntry(...)` を使用できます。この同梱契約は任意の `runtime` エクスポートにも対応しているため、セットアップ時のランタイム配線を軽量かつ明示的に保てます。

<AccordionGroup>
  <Accordion title="OpenClaw が完全なエントリの代わりに setupEntry を使用する場合">
    - チャネルは無効だが、セットアップ/オンボーディングサーフェスが必要な場合。
    - チャネルは有効だが未設定の場合。
    - 遅延読み込みが有効な場合（`deferConfiguredChannelFullLoadUntilAfterListen`）。

  </Accordion>
  <Accordion title="setupEntry が登録する必要があるもの">
    - チャネル Plugin オブジェクト（`defineSetupPluginEntry` 経由）。
    - Gateway listen 前に必要な HTTP ルート。
    - 起動中に必要な Gateway メソッド。

    これらの起動時 Gateway メソッドでも、`config.*` や `update.*` などの予約済みコア管理名前空間は避ける必要があります。

  </Accordion>
  <Accordion title="setupEntry に含めるべきではないもの">
    - CLI 登録。
    - バックグラウンドサービス。
    - 重いランタイムインポート（暗号、SDK）。
    - 起動後にのみ必要な Gateway メソッド。

  </Accordion>
</AccordionGroup>

### 狭いセットアップヘルパーのインポート

セットアップ専用のホットパスでは、セットアップサーフェスの一部だけが必要な場合、広い `plugin-sdk/setup` アンブレラよりも狭いセットアップヘルパーシームを優先してください。

| インポートパス                        | 用途                                                                                | 主なエクスポート                                                                                                                                                                                                                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | `setupEntry` / 遅延チャネル起動で利用可能なままにするセットアップ時ランタイムヘルパー | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 非推奨の互換エイリアス。`plugin-sdk/setup-runtime` を使用してください                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | セットアップ/インストール CLI/アーカイブ/docs ヘルパー                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

`moveSingleAccountChannelSectionToDefaultAccount(...)` などの設定パッチヘルパーを含む、共有セットアップツールボックス全体が必要な場合は、広い `plugin-sdk/setup` シームを使用します。

固定のセットアップウィザード文言には `createSetupTranslator(...)` を使用してください。これは CLI ウィザードのロケール（`OPENCLAW_LOCALE`、次にシステムロケール変数）に従い、英語にフォールバックします。Plugin 固有のセットアップテキストは Plugin 所有のコードに保持し、共有カタログキーは共通のセットアップラベル、ステータステキスト、公式同梱 Plugin のセットアップ文言にのみ使用してください。

セットアップパッチアダプターは、インポート時にもホットパスセーフです。同梱単一アカウント昇格の契約サーフェス検索は遅延されるため、`plugin-sdk/setup-runtime` をインポートしても、アダプターが実際に使用される前に同梱契約サーフェスの検出を先読みしません。

### チャネル所有の単一アカウント昇格

チャネルが単一アカウントのトップレベル設定から `channels.<id>.accounts.*` にアップグレードする場合、デフォルトの共有動作は、昇格されたアカウントスコープ値を `accounts.default` に移動することです。

同梱チャネルは、セットアップ契約サーフェスを通じてその昇格を絞り込んだり上書きしたりできます。

- `singleAccountKeysToMove`: 昇格されたアカウントに移動する追加のトップレベルキー
- `namedAccountPromotionKeys`: 名前付きアカウントがすでに存在する場合、これらのキーのみが昇格されたアカウントに移動します。共有ポリシー/配信キーはチャネルルートに残ります
- `resolveSingleAccountPromotionTarget(...)`: 昇格された値を受け取る既存アカウントを選択します

<Note>
Matrix は現在の同梱例です。名前付き Matrix アカウントがちょうど 1 つすでに存在する場合、または `defaultAccount` が `Ops` のような既存の非正規キーを指している場合、昇格は新しい `accounts.default` エントリを作成するのではなく、そのアカウントを保持します。
</Note>

## 設定スキーマ

Plugin 設定は、マニフェスト内の JSON Schema に対して検証されます。ユーザーは次のように Plugin を設定します。

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

Plugin は登録中にこの設定を `api.pluginConfig` として受け取ります。

チャネル固有の設定には、代わりにチャネル設定セクションを使用します。

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

`buildChannelConfigSchema` を使用して、Zod スキーマを Plugin 所有の設定アーティファクトで使用される `ChannelConfigSchema` ラッパーに変換します。

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

すでに JSON Schema または TypeBox として契約を作成している場合は、メタデータパスで OpenClaw が Zod から JSON Schema への変換をスキップできるよう、直接ヘルパーを使用します。

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

サードパーティ Plugin では、コールドパス契約は引き続き Plugin マニフェストです。生成された JSON Schema を `openclaw.plugin.json#channelConfigs` にミラーし、設定スキーマ、セットアップ、UI サーフェスがランタイムコードを読み込まずに `channels.<id>` を検査できるようにしてください。

## セットアップウィザード

チャネル Plugin は、`openclaw onboard` 向けに対話型セットアップウィザードを提供できます。ウィザードは `ChannelPlugin` 上の `ChannelSetupWizard` オブジェクトです。

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

`ChannelSetupWizard` 型は、`credentials`、`textInputs`、`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize` などに対応しています。完全な例については、同梱 Plugin パッケージ（たとえば Discord Plugin の `src/channel.setup.ts`）を参照してください。

<AccordionGroup>
  <Accordion title="共有 allowFrom プロンプト">
    標準の `note -> prompt -> parse -> merge -> patch` フローだけが必要な DM 許可リストプロンプトでは、`openclaw/plugin-sdk/setup` の共有セットアップヘルパーである `createPromptParsedAllowFromForAccount(...)`、`createTopLevelChannelParsedAllowFromPrompt(...)`、`createNestedChannelParsedAllowFromPrompt(...)` を優先してください。
  </Accordion>
  <Accordion title="標準チャネルセットアップステータス">
    ラベル、スコア、任意の追加行だけが異なるチャネルセットアップステータスブロックでは、各 Plugin で同じ `status` オブジェクトを手作りする代わりに、`openclaw/plugin-sdk/setup` の `createStandardChannelSetupStatus(...)` を優先してください。
  </Accordion>
  <Accordion title="任意のチャネルセットアップサーフェス">
    特定のコンテキストでのみ表示する任意のセットアップサーフェスには、`openclaw/plugin-sdk/channel-setup` の `createOptionalChannelSetupSurface` を使用します。

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

    任意インストールサーフェスの片側だけが必要な場合、`plugin-sdk/channel-setup` は低レベルの `createOptionalChannelSetupAdapter(...)` および `createOptionalChannelSetupWizard(...)` ビルダーも公開しています。

    生成された任意アダプター/ウィザードは、実際の設定書き込みでは fail closed になります。これらは `validateInput`、`applyAccountConfig`、`finalize` にわたって同じインストール必須メッセージを再利用し、`docsPath` が設定されている場合は docs リンクを追加します。

  </Accordion>
  <Accordion title="バイナリに基づくセットアップヘルパー">
    バイナリに基づくセットアップ UI では、同じバイナリ/ステータスの接着コードをすべてのチャネルにコピーする代わりに、共有の委譲ヘルパーを優先してください。

    - ラベル、ヒント、スコア、バイナリ検出だけが異なるステータスブロックには `createDetectedBinaryStatus(...)`
    - パスに基づくテキスト入力には `createCliPathTextInput(...)`
    - `setupEntry` が重い完全ウィザードへ遅延転送する必要がある場合は、`createDelegatedSetupWizardStatusResolvers(...)`、`createDelegatedPrepare(...)`、`createDelegatedFinalize(...)`、`createDelegatedResolveConfigured(...)`
    - `setupEntry` が `textInputs[*].shouldPrompt` の判断だけを委譲する必要がある場合は `createDelegatedTextInputShouldPrompt(...)`

  </Accordion>
</AccordionGroup>

## 公開とインストール

**外部 Plugin:** [ClawHub](/ja-JP/clawhub) に公開してから、インストールします。

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    装飾なしのパッケージ指定は、ローンチ移行中に npm からインストールされます。

  </Tab>
  <Tab title="ClawHub のみ">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm パッケージ指定">
    パッケージがまだ ClawHub に移行していない場合、または移行中に
    直接 npm インストールパスが必要な場合は npm を使用します。

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**リポジトリ内 Plugin:** バンドル済み Plugin ワークスペースツリーの下に配置すると、ビルド時に自動的に検出されます。

**ユーザーはインストールできます。**

```bash
openclaw plugins install <package-name>
```

<Info>
npm 由来のインストールでは、`openclaw plugins install` はライフサイクルスクリプトを無効にした状態で、`~/.openclaw/npm/projects` の下にある Plugin ごとのプロジェクトにパッケージをインストールします。Plugin の依存関係ツリーは純粋な JS/TS に保ち、`postinstall` ビルドを必要とするパッケージは避けてください。
</Info>

<Note>
Gateway 起動時に Plugin の依存関係はインストールされません。npm/git/ClawHub のインストールフローが依存関係の収束を担います。ローカル Plugin は依存関係がすでにインストールされている必要があります。
</Note>

バンドル済みパッケージのメタデータは明示的であり、Gateway 起動時にビルド済み JavaScript から推論されるものではありません。ランタイム依存関係は、それを所有する Plugin パッケージに属します。パッケージ化された OpenClaw の起動処理が Plugin の依存関係を修復またはミラーすることはありません。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins) — ステップごとのはじめにガイド
- [Plugin manifest](/ja-JP/plugins/manifest) — 完全なマニフェストスキーマリファレンス
- [SDK エントリポイント](/ja-JP/plugins/sdk-entrypoints) — `definePluginEntry` と `defineChannelPluginEntry`

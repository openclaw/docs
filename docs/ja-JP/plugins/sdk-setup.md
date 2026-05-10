---
read_when:
    - Pluginにセットアップウィザードを追加する
    - setup-entry.ts と index.ts の違いを理解する必要があります
    - Plugin config スキーマまたは package.json の openclaw メタデータを定義している
sidebarTitle: Setup and config
summary: セットアップウィザード、setup-entry.ts、設定スキーマ、および package.json メタデータ
title: Plugin のセットアップと設定
x-i18n:
    generated_at: "2026-05-10T19:47:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e6c59d7201cc1402cd648a37fc498fbb7e4043a661dcd39c2e62fcf01067879
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Plugin パッケージング（`package.json` メタデータ）、マニフェスト（`openclaw.plugin.json`）、セットアップエントリ、設定スキーマのリファレンス。

<Tip>
**ウォークスルーを探していますか？** ハウツーガイドでは、文脈の中でパッケージングを説明しています: [Channel plugins](/ja-JP/plugins/sdk-channel-plugins#step-1-package-and-manifest) と [Provider plugins](/ja-JP/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
</Tip>

## パッケージメタデータ

`package.json` には、Plugin システムに Plugin が何を提供するかを伝える `openclaw` フィールドが必要です。

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
  <Tab title="Provider plugin / ClawHub ベースライン">
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
Plugin を ClawHub で外部公開する場合、これらの `compat` と `build` フィールドは必須です。正規の公開スニペットは `docs/snippets/plugin-publish/` にあります。
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
  この Plugin によって登録されるプロバイダー ID。
</ParamField>
<ParamField path="install" type="object">
  インストールヒント: `npmSpec`、`localPath`、`defaultChoice`、`minHostVersion`、`expectedIntegrity`、`allowInvalidConfigRecovery`。
</ParamField>
<ParamField path="startup" type="object">
  起動時の動作フラグ。
</ParamField>

### `openclaw.channel`

`openclaw.channel` は、ランタイムが読み込まれる前にチャンネル検出とセットアップ画面で使われる軽量なパッケージメタデータです。

| フィールド                             | 型         | 意味                                                                          |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | 正規のチャンネル ID。                                                         |
| `label`                                | `string`   | 主要なチャンネルラベル。                                                      |
| `selectionLabel`                       | `string`   | `label` と異なる必要がある場合のピッカー/セットアップラベル。                 |
| `detailLabel`                          | `string`   | よりリッチなチャンネルカタログとステータス画面向けの補助詳細ラベル。          |
| `docsPath`                             | `string`   | セットアップと選択リンク向けのドキュメントパス。                              |
| `docsLabel`                            | `string`   | チャンネル ID と異なる必要がある場合にドキュメントリンクで使う上書きラベル。  |
| `blurb`                                | `string`   | 短いオンボーディング/カタログ説明。                                           |
| `order`                                | `number`   | チャンネルカタログでの並び順。                                                |
| `aliases`                              | `string[]` | チャンネル選択用の追加検索エイリアス。                                        |
| `preferOver`                           | `string[]` | このチャンネルが優先されるべき、優先度の低い Plugin/チャンネル ID。           |
| `systemImage`                          | `string`   | チャンネル UI カタログ向けの任意のアイコン/システムイメージ名。               |
| `selectionDocsPrefix`                  | `string`   | 選択画面でドキュメントリンクの前に表示するプレフィックステキスト。            |
| `selectionDocsOmitLabel`               | `boolean`  | 選択コピーで、ラベル付きドキュメントリンクの代わりにドキュメントパスを直接表示する。 |
| `selectionExtras`                      | `string[]` | 選択コピーに追加される短い文字列。                                            |
| `markdownCapable`                      | `boolean`  | 送信フォーマット判断のため、チャンネルが Markdown 対応であることを示します。  |
| `exposure`                             | `object`   | セットアップ、設定済みリスト、ドキュメント画面向けのチャンネル表示制御。      |
| `quickstartAllowFrom`                  | `boolean`  | このチャンネルを標準クイックスタートの `allowFrom` セットアップフローに参加させます。 |
| `forceAccountBinding`                  | `boolean`  | アカウントが 1 つだけ存在する場合でも、明示的なアカウントバインドを要求します。 |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | このチャンネルの通知先を解決するときに、セッション検索を優先します。          |

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

`exposure` は次をサポートします:

- `configured`: チャンネルを設定済み/ステータス形式の一覧画面に含める
- `setup`: チャンネルを対話型のセットアップ/設定ピッカーに含める
- `docs`: チャンネルをドキュメント/ナビゲーション画面で公開向けとして示す

<Note>
`showConfigured` と `showInSetup` は従来のエイリアスとして引き続きサポートされます。`exposure` を優先してください。
</Note>

### `openclaw.install`

`openclaw.install` はパッケージメタデータであり、マニフェストメタデータではありません。

| フィールド                   | 型                                  | 意味                                                                              |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | インストール/更新とオンボーディングのオンデマンドインストールフロー向けの正規 ClawHub 仕様。 |
| `npmSpec`                    | `string`                            | インストール/更新のフォールバックフロー向けの正規 npm 仕様。                     |
| `localPath`                  | `string`                            | ローカル開発またはバンドル済みインストールパス。                                  |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | 複数のソースが利用可能な場合の優先インストール元。                                |
| `minHostVersion`             | `string`                            | `>=x.y.z` または `>=x.y.z-prerelease` 形式の、サポートされる最小 OpenClaw バージョン。 |
| `expectedIntegrity`          | `string`                            | 固定インストール向けの期待される npm dist integrity 文字列。通常は `sha512-...`。 |
| `allowInvalidConfigRecovery` | `boolean`                           | バンドル済み Plugin の再インストールフローが、特定の古い設定失敗から復旧できるようにします。 |

<AccordionGroup>
  <Accordion title="オンボーディングの動作">
    対話型オンボーディングも、オンデマンドインストール画面で `openclaw.install` を使います。Plugin がランタイム読み込み前にプロバイダー認証の選択肢やチャンネルのセットアップ/カタログメタデータを公開する場合、オンボーディングではその選択肢を表示し、ClawHub、npm、またはローカルインストールを求め、Plugin をインストールまたは有効化してから、選択されたフローを続行できます。ClawHub のオンボーディング選択肢は `clawhubSpec` を使用し、存在する場合は優先されます。npm の選択肢には、レジストリ `npmSpec` を持つ信頼済みカタログメタデータが必要です。正確なバージョンと `expectedIntegrity` は任意の npm 固定指定です。`expectedIntegrity` が存在する場合、インストール/更新フローは npm に対してそれを強制します。「何を表示するか」のメタデータは `openclaw.plugin.json` に、「どうインストールするか」のメタデータは `package.json` に置いてください。
  </Accordion>
  <Accordion title="minHostVersion の強制">
    `minHostVersion` が設定されている場合、インストールと非バンドルのマニフェストレジストリ読み込みの両方で強制されます。古いホストは外部 Plugin をスキップします。無効なバージョン文字列は拒否されます。バンドル済みソース Plugin は、ホストのチェックアウトと同じバージョンであると見なされます。
  </Accordion>
  <Accordion title="固定 npm インストール">
    固定 npm インストールでは、正確なバージョンを `npmSpec` に保持し、期待されるアーティファクト integrity を追加します:

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
  <Accordion title="allowInvalidConfigRecovery の範囲">
    `allowInvalidConfigRecovery` は壊れた設定の一般的なバイパスではありません。これは限定的なバンドル済み Plugin の復旧専用であり、再インストール/セットアップが、バンドル済み Plugin パスの欠落や同じ Plugin に対する古い `channels.<id>` エントリなど、既知のアップグレード残存物を修復できるようにするためのものです。無関係な理由で設定が壊れている場合、インストールは引き続きフェイルクローズし、オペレーターに `openclaw doctor --fix` の実行を案内します。
  </Accordion>
</AccordionGroup>

### 完全読み込みの遅延

Channel plugins は、次の設定で遅延読み込みを有効にできます:

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

有効にすると、OpenClaw はすでに設定済みのチャンネルであっても、listen 前の起動フェーズでは `setupEntry` のみを読み込みます。完全なエントリは、Gateway が listen を開始した後に読み込まれます。

<Warning>
`setupEntry` が Gateway の listen 開始前に必要なすべて（チャンネル登録、HTTP ルート、Gateway メソッド）を登録する場合にのみ、遅延読み込みを有効にしてください。完全なエントリが必須の起動時機能を所有している場合は、デフォルトの動作を維持してください。
</Warning>

セットアップ/完全エントリが Gateway RPC メソッドを登録する場合は、Plugin 固有のプレフィックスに置いてください。予約済みのコア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）はコア所有のままで、常に `operator.admin` に解決されます。

## Plugin マニフェスト

すべてのネイティブ Plugin は、パッケージルートに `openclaw.plugin.json` を同梱する必要があります。OpenClaw はこれを使って、Plugin コードを実行せずに設定を検証します。

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

Channel plugins の場合は、`kind` と `channels` を追加します:

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

設定がない Plugin でも、スキーマを同梱する必要があります。空のスキーマは有効です:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

完全なスキーマリファレンスについては、[Plugin マニフェスト](/ja-JP/plugins/manifest) を参照してください。

## ClawHub 公開

Plugin パッケージでは、パッケージ固有の ClawHub コマンドを使います:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
従来のスキル専用 publish エイリアスはスキル用です。Plugin パッケージでは必ず `clawhub package publish` を使用してください。
</Note>

## セットアップエントリ

`setup-entry.ts` ファイルは `index.ts` の軽量な代替で、OpenClaw がセットアップサーフェス（オンボーディング、設定修復、無効化されたチャネルの検査）だけを必要とするときに読み込みます。

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

これにより、セットアップフロー中に重いランタイムコード（暗号ライブラリ、CLI 登録、バックグラウンドサービス）の読み込みを避けられます。

セットアップセーフなエクスポートをサイドカーモジュールに保持するバンドル済みワークスペースチャネルは、`defineSetupPluginEntry(...)` の代わりに `openclaw/plugin-sdk/channel-entry-contract` の `defineBundledChannelSetupEntry(...)` を使用できます。そのバンドル済み契約は任意の `runtime` エクスポートにも対応しているため、セットアップ時のランタイム配線を軽量かつ明示的に保てます。

<AccordionGroup>
  <Accordion title="OpenClaw が完全なエントリではなく setupEntry を使用する場合">
    - チャネルは無効化されているが、セットアップ/オンボーディングサーフェスが必要な場合。
    - チャネルは有効化されているが、未設定の場合。
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

セットアップ専用のホットパスでは、セットアップサーフェスの一部だけが必要な場合、より広範な `plugin-sdk/setup` アンブレラよりも狭いセットアップヘルパーの継ぎ目を優先してください。

| インポートパス                        | 用途                                                                                | 主なエクスポート                                                                                                                                                                                                                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | `setupEntry` / 遅延チャネル起動で利用可能なままにするセットアップ時ランタイムヘルパー | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 非推奨の互換エイリアス。`plugin-sdk/setup-runtime` を使用してください                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | セットアップ/インストール CLI/アーカイブ/ドキュメントヘルパー                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

`moveSingleAccountChannelSectionToDefaultAccount(...)` などの設定パッチヘルパーを含む、完全な共有セットアップツールボックスが必要な場合は、より広範な `plugin-sdk/setup` の継ぎ目を使用してください。

セットアップパッチアダプターは、インポート時もホットパスセーフのままです。バンドル済み単一アカウント昇格の契約サーフェス検索は遅延されるため、`plugin-sdk/setup-runtime` をインポートしても、アダプターが実際に使用される前にバンドル済み契約サーフェス検出を先行読み込みすることはありません。

### チャネル所有の単一アカウント昇格

チャネルが単一アカウントのトップレベル設定から `channels.<id>.accounts.*` にアップグレードされるとき、デフォルトの共有動作では、昇格されたアカウントスコープ値が `accounts.default` に移動されます。

バンドル済みチャネルは、セットアップ契約サーフェスを通じてその昇格を絞り込むか上書きできます。

- `singleAccountKeysToMove`: 昇格されたアカウントに移動する追加のトップレベルキー
- `namedAccountPromotionKeys`: 名前付きアカウントがすでに存在する場合、これらのキーだけが昇格されたアカウントに移動されます。共有ポリシー/配信キーはチャネルルートに残ります
- `resolveSingleAccountPromotionTarget(...)`: 昇格された値を受け取る既存アカウントを選択します

<Note>
Matrix は現在のバンドル済み例です。名前付き Matrix アカウントがすでにちょうど 1 つ存在する場合、または `defaultAccount` が `Ops` のような既存の非正規キーを指している場合、昇格は新しい `accounts.default` エントリを作成するのではなく、そのアカウントを保持します。
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

チャネル固有の設定には、代わりにチャネル設定セクションを使用してください。

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

すでに契約を JSON Schema または TypeBox として作成している場合は、直接ヘルパーを使用して、OpenClaw がメタデータパスで Zod から JSON Schema への変換を省略できるようにします。

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

サードパーティ Plugin では、コールドパス契約は引き続き Plugin マニフェストです。生成された JSON Schema を `openclaw.plugin.json#channelConfigs` にミラーして、ランタイムコードを読み込まずに設定スキーマ、セットアップ、UI サーフェスが `channels.<id>` を検査できるようにしてください。

## セットアップウィザード

チャネル Plugin は、`openclaw onboard` 用の対話型セットアップウィザードを提供できます。ウィザードは `ChannelPlugin` 上の `ChannelSetupWizard` オブジェクトです。

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

`ChannelSetupWizard` 型は `credentials`、`textInputs`、`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize` などに対応しています。完全な例については、バンドル済み Plugin パッケージ（たとえば Discord Plugin の `src/channel.setup.ts`）を参照してください。

<AccordionGroup>
  <Accordion title="共有 allowFrom プロンプト">
    標準の `note -> prompt -> parse -> merge -> patch` フローだけが必要な DM 許可リストプロンプトでは、`openclaw/plugin-sdk/setup` の共有セットアップヘルパーである `createPromptParsedAllowFromForAccount(...)`、`createTopLevelChannelParsedAllowFromPrompt(...)`、`createNestedChannelParsedAllowFromPrompt(...)` を優先してください。
  </Accordion>
  <Accordion title="標準チャネルセットアップステータス">
    ラベル、スコア、任意の追加行だけが異なるチャネルセットアップステータスブロックでは、各 Plugin で同じ `status` オブジェクトを手作りする代わりに、`openclaw/plugin-sdk/setup` の `createStandardChannelSetupStatus(...)` を優先してください。
  </Accordion>
  <Accordion title="任意のチャネルセットアップサーフェス">
    特定のコンテキストでのみ表示されるべき任意のセットアップサーフェスには、`openclaw/plugin-sdk/channel-setup` の `createOptionalChannelSetupSurface` を使用してください。

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

    `plugin-sdk/channel-setup` は、その任意インストールサーフェスの片側だけが必要な場合に使える、より低レベルの `createOptionalChannelSetupAdapter(...)` と `createOptionalChannelSetupWizard(...)` ビルダーも公開しています。

    生成された任意アダプター/ウィザードは、実際の設定書き込みでは fail closed します。`validateInput`、`applyAccountConfig`、`finalize` で 1 つのインストール必須メッセージを再利用し、`docsPath` が設定されている場合はドキュメントリンクを追加します。

  </Accordion>
  <Accordion title="バイナリ対応セットアップヘルパー">
    バイナリ対応セットアップ UI では、同じバイナリ/ステータス接着コードを各チャネルにコピーするのではなく、共有の委譲ヘルパーを優先してください。

    - ラベル、ヒント、スコア、バイナリ検出だけが異なるステータスブロックには `createDetectedBinaryStatus(...)`
    - パス対応テキスト入力には `createCliPathTextInput(...)`
    - `setupEntry` がより重い完全ウィザードへ遅延転送する必要がある場合は `createDelegatedSetupWizardStatusResolvers(...)`、`createDelegatedPrepare(...)`、`createDelegatedFinalize(...)`、`createDelegatedResolveConfigured(...)`
    - `setupEntry` が `textInputs[*].shouldPrompt` 判定だけを委譲する必要がある場合は `createDelegatedTextInputShouldPrompt(...)`

  </Accordion>
</AccordionGroup>

## 公開とインストール

**外部 Plugin:** [ClawHub](/ja-JP/clawhub) に公開してから、インストールします。

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    ベアパッケージ指定は、起動切り替え期間中に npm からインストールされます。

  </Tab>
  <Tab title="ClawHub のみ">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm パッケージ指定">
    パッケージがまだ ClawHub に移行していない場合、または移行中に
    直接 npm インストールパスが必要な場合は、npm を使用してください。

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**リポジトリ内 Plugin:** バンドルされた Plugin ワークスペースツリーの下に配置すると、ビルド時に自動検出されます。

**ユーザーは次のようにインストールできます:**

```bash
openclaw plugins install <package-name>
```

<Info>
npm 由来のインストールでは、`openclaw plugins install` はライフサイクルスクリプトを無効にして、パッケージを `~/.openclaw/npm` の下にインストールします。Plugin の依存関係ツリーは純粋な JS/TS のままにし、`postinstall` ビルドを必要とするパッケージは避けてください。
</Info>

<Note>
Gateway 起動時に Plugin の依存関係はインストールされません。npm/git/ClawHub のインストールフローが依存関係の収束を担います。ローカル Plugin は依存関係がすでにインストールされている必要があります。
</Note>

バンドルされたパッケージメタデータは明示的であり、Gateway 起動時にビルド済み JavaScript から推論されるものではありません。ランタイム依存関係は、それを所有する Plugin パッケージに属します。パッケージ化された OpenClaw の起動処理が Plugin の依存関係を修復したりミラーしたりすることはありません。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins) — ステップバイステップのはじめにガイド
- [Plugin マニフェスト](/ja-JP/plugins/manifest) — 完全なマニフェストスキーマリファレンス
- [SDK エントリポイント](/ja-JP/plugins/sdk-entrypoints) — `definePluginEntry` と `defineChannelPluginEntry`

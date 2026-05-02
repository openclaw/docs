---
read_when:
    - Plugin にセットアップウィザードを追加しています
    - setup-entry.ts と index.ts の違いを理解する必要があります
    - Plugin config スキーマまたは package.json の openclaw メタデータを定義している
sidebarTitle: Setup and config
summary: セットアップウィザード、setup-entry.ts、設定スキーマ、package.json メタデータ
title: Plugin のセットアップと設定
x-i18n:
    generated_at: "2026-05-02T21:04:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a89e113952b1809bc19b0535d0895b1f0e13ee7c57446a9f27817c03a8e6000
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Plugin パッケージング（`package.json` メタデータ）、マニフェスト（`openclaw.plugin.json`）、セットアップエントリ、設定スキーマのリファレンス。

<Tip>
**チュートリアルを探していますか？** ハウツーガイドでは、文脈に沿ってパッケージングを説明しています: [チャンネル Plugin](/ja-JP/plugins/sdk-channel-plugins#step-1-package-and-manifest) と [プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
</Tip>

## パッケージメタデータ

`package.json` には、Plugin システムにその Plugin が何を提供するかを伝える `openclaw` フィールドが必要です。

<Tabs>
  <Tab title="チャンネル Plugin">
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
  起動動作フラグ。
</ParamField>

### `openclaw.channel`

`openclaw.channel` は、ランタイム読み込み前のチャンネル検出とセットアップ画面のための軽量なパッケージメタデータです。

| フィールド                             | 型         | 意味                                                                          |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | 正規のチャンネル ID。                                                         |
| `label`                                | `string`   | 主要なチャンネルラベル。                                                      |
| `selectionLabel`                       | `string`   | `label` と異なる必要がある場合のピッカー/セットアップラベル。                |
| `detailLabel`                          | `string`   | より詳細なチャンネルカタログとステータス画面向けの補助詳細ラベル。          |
| `docsPath`                             | `string`   | セットアップと選択リンク用のドキュメントパス。                                |
| `docsLabel`                            | `string`   | チャンネル ID と異なる必要がある場合にドキュメントリンクで使う上書きラベル。 |
| `blurb`                                | `string`   | 短いオンボーディング/カタログ説明。                                           |
| `order`                                | `number`   | チャンネルカタログ内の並び順。                                                |
| `aliases`                              | `string[]` | チャンネル選択用の追加検索エイリアス。                                        |
| `preferOver`                           | `string[]` | このチャンネルが上位に扱われるべき、優先度の低い Plugin/チャンネル ID。      |
| `systemImage`                          | `string`   | チャンネル UI カタログ向けの任意のアイコン/システム画像名。                   |
| `selectionDocsPrefix`                  | `string`   | 選択画面でドキュメントリンクの前に表示するプレフィックステキスト。            |
| `selectionDocsOmitLabel`               | `boolean`  | 選択コピー内でラベル付きドキュメントリンクではなく、ドキュメントパスを直接表示する。 |
| `selectionExtras`                      | `string[]` | 選択コピーに追加される短い文字列。                                            |
| `markdownCapable`                      | `boolean`  | 送信フォーマット判断のため、このチャンネルを Markdown 対応としてマークする。 |
| `exposure`                             | `object`   | セットアップ、設定済み一覧、ドキュメント画面でのチャンネル表示制御。          |
| `quickstartAllowFrom`                  | `boolean`  | このチャンネルを標準のクイックスタート `allowFrom` セットアップフローに参加させる。 |
| `forceAccountBinding`                  | `boolean`  | アカウントが 1 つだけ存在する場合でも、明示的なアカウントバインドを要求する。 |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | このチャンネルの通知先を解決するときに、セッション検索を優先する。            |

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

`exposure` は次をサポートします。

- `configured`: 設定済み/ステータス風の一覧画面にチャンネルを含める
- `setup`: 対話型のセットアップ/設定ピッカーにチャンネルを含める
- `docs`: ドキュメント/ナビゲーション画面でチャンネルを公開向けとしてマークする

<Note>
`showConfigured` と `showInSetup` はレガシーエイリアスとして引き続きサポートされます。`exposure` を推奨します。
</Note>

### `openclaw.install`

`openclaw.install` はパッケージメタデータであり、マニフェストメタデータではありません。

| フィールド                   | 型                                  | 意味                                                                                  |
| ---------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | インストール/更新およびオンボーディングのオンデマンドインストールフロー用の正規 ClawHub spec。 |
| `npmSpec`                    | `string`                            | インストール/更新フォールバックフロー用の正規 npm spec。                             |
| `localPath`                  | `string`                            | ローカル開発またはバンドル済みインストールパス。                                      |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | 複数のソースが利用可能な場合の優先インストール元。                                    |
| `minHostVersion`             | `string`                            | `>=x.y.z` または `>=x.y.z-prerelease` 形式の、サポートされる最小 OpenClaw バージョン。 |
| `expectedIntegrity`          | `string`                            | 固定インストール向けの期待される npm dist integrity 文字列。通常は `sha512-...`。      |
| `allowInvalidConfigRecovery` | `boolean`                           | バンドル済み Plugin の再インストールフローで、特定の古い設定エラーから復旧できるようにする。 |

<AccordionGroup>
  <Accordion title="オンボーディング動作">
    対話型オンボーディングでも、オンデマンドインストール画面に `openclaw.install` を使用します。Plugin がランタイム読み込み前にプロバイダー認証の選択肢やチャンネルのセットアップ/カタログメタデータを公開する場合、オンボーディングはその選択肢を表示し、ClawHub、npm、またはローカルインストールを促し、Plugin をインストールまたは有効化してから、選択されたフローを続行できます。ClawHub オンボーディングの選択肢は `clawhubSpec` を使用し、存在する場合は優先されます。npm の選択肢には、レジストリ `npmSpec` を含む信頼済みカタログメタデータが必要です。正確なバージョンと `expectedIntegrity` は任意の npm 固定指定です。`expectedIntegrity` が存在する場合、インストール/更新フローは npm に対してそれを強制します。「何を表示するか」のメタデータは `openclaw.plugin.json` に、「どのようにインストールするか」のメタデータは `package.json` に保持してください。
  </Accordion>
  <Accordion title="minHostVersion の強制">
    `minHostVersion` が設定されている場合、インストールと非バンドルのマニフェストレジストリ読み込みの両方で強制されます。古いホストは外部 Plugin をスキップし、無効なバージョン文字列は拒否されます。バンドル済みソース Plugin は、ホストのチェックアウトと同じバージョンであると見なされます。
  </Accordion>
  <Accordion title="固定 npm インストール">
    固定 npm インストールでは、正確なバージョンを `npmSpec` に保持し、期待されるアーティファクト整合性を追加します。

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
    `allowInvalidConfigRecovery` は壊れた設定の一般的なバイパスではありません。これは狭い範囲のバンドル済み Plugin 復旧専用であり、再インストール/セットアップが、バンドル済み Plugin パスの欠落や同じ Plugin の古い `channels.<id>` エントリなど、既知のアップグレード残骸を修復できるようにするためのものです。無関係な理由で設定が壊れている場合、インストールは引き続き fail closed となり、オペレーターに `openclaw doctor --fix` の実行を指示します。
  </Accordion>
</AccordionGroup>

### 遅延フルロード

チャンネル Plugin は、次のように遅延読み込みを有効にできます。

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

有効にすると、OpenClaw は、すでに設定済みのチャンネルであっても、リッスン開始前の起動フェーズでは `setupEntry` のみを読み込みます。完全なエントリは Gateway がリッスンを開始した後に読み込まれます。

<Warning>
遅延読み込みは、`setupEntry` が Gateway のリッスン開始前に必要なすべて（チャンネル登録、HTTP ルート、Gateway メソッド）を登録する場合にのみ有効にしてください。完全なエントリが必須の起動機能を所有している場合は、デフォルト動作のままにしてください。
</Warning>

セットアップ/完全エントリが Gateway RPC メソッドを登録する場合、それらは Plugin 固有のプレフィックス配下に置いてください。予約済みのコア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）はコア所有のままで、常に `operator.admin` に解決されます。

## Plugin マニフェスト

すべてのネイティブ Plugin は、パッケージルートに `openclaw.plugin.json` を含める必要があります。OpenClaw はこれを使用して、Plugin コードを実行せずに設定を検証します。

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

チャンネル Plugin では、`kind` と `channels` を追加します。

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

設定がない Plugin でもスキーマを含める必要があります。空のスキーマは有効です。

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

Plugin パッケージでは、パッケージ固有の ClawHub コマンドを使用します。

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
従来のスキル専用 publish エイリアスはスキル用です。Plugin パッケージでは常に `clawhub package publish` を使用してください。
</Note>

## セットアップエントリ

`setup-entry.ts` ファイルは、OpenClaw がセットアップサーフェス（オンボーディング、設定修復、無効化されたチャネルの検査）だけを必要とする場合に読み込む、`index.ts` の軽量な代替です。

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

これにより、セットアップフロー中に重いランタイムコード（暗号ライブラリ、CLI 登録、バックグラウンドサービス）を読み込まずに済みます。

セットアップ安全なエクスポートをサイドカーモジュールに保持するバンドル済みワークスペースチャネルは、`defineSetupPluginEntry(...)` の代わりに `openclaw/plugin-sdk/channel-entry-contract` の `defineBundledChannelSetupEntry(...)` を使用できます。そのバンドル済みコントラクトは任意の `runtime` エクスポートにも対応しているため、セットアップ時のランタイム配線を軽量かつ明示的に保てます。

<AccordionGroup>
  <Accordion title="OpenClaw が完全なエントリの代わりに setupEntry を使用する場合">
    - チャネルは無効化されているが、セットアップ/オンボーディングサーフェスが必要な場合。
    - チャネルは有効化されているが、未設定の場合。
    - 遅延読み込みが有効な場合（`deferConfiguredChannelFullLoadUntilAfterListen`）。

  </Accordion>
  <Accordion title="setupEntry が登録する必要があるもの">
    - チャネル Plugin オブジェクト（`defineSetupPluginEntry` 経由）。
    - Gateway の listen 前に必要な HTTP ルート。
    - 起動中に必要な Gateway メソッド。

    これらの起動時 Gateway メソッドでも、`config.*` や `update.*` のような予約済みコア管理名前空間は避ける必要があります。

  </Accordion>
  <Accordion title="setupEntry に含めるべきではないもの">
    - CLI 登録。
    - バックグラウンドサービス。
    - 重いランタイムインポート（暗号、SDK）。
    - 起動後にのみ必要な Gateway メソッド。

  </Accordion>
</AccordionGroup>

### 限定的なセットアップヘルパーのインポート

セットアップ専用のホットパスでは、セットアップサーフェスの一部だけが必要な場合、より広い `plugin-sdk/setup` アンブレラではなく、限定的なセットアップヘルパーの境界を優先してください。

| インポートパス                   | 用途                                                                                      | 主要なエクスポート                                                                                                                                                                                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | `setupEntry` / 遅延チャネル起動で利用可能なままにするセットアップ時ランタイムヘルパー     | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 環境対応のアカウントセットアップアダプター                                                | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | セットアップ/インストール CLI/アーカイブ/ドキュメントヘルパー                             | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

`moveSingleAccountChannelSectionToDefaultAccount(...)` のような設定パッチヘルパーを含む共有セットアップツールボックス全体が必要な場合は、より広い `plugin-sdk/setup` 境界を使用してください。

セットアップパッチアダプターは、インポート時にホットパス安全なままです。バンドル済みの単一アカウント昇格コントラクトサーフェスの検索は遅延されるため、`plugin-sdk/setup-runtime` をインポートしても、アダプターが実際に使用される前にバンドル済みコントラクトサーフェス検出を先に読み込むことはありません。

### チャネル所有の単一アカウント昇格

チャネルが単一アカウントのトップレベル設定から `channels.<id>.accounts.*` にアップグレードする場合、デフォルトの共有動作では、昇格されたアカウントスコープの値を `accounts.default` に移動します。

バンドル済みチャネルは、セットアップコントラクトサーフェスを通じて、その昇格を限定または上書きできます。

- `singleAccountKeysToMove`: 昇格されたアカウントへ移動する必要がある追加のトップレベルキー
- `namedAccountPromotionKeys`: 名前付きアカウントがすでに存在する場合、これらのキーだけが昇格されたアカウントへ移動します。共有ポリシー/配信キーはチャネルルートに残ります
- `resolveSingleAccountPromotionTarget(...)`: 昇格された値を受け取る既存アカウントを選択します

<Note>
Matrix は現在のバンドル済みの例です。名前付き Matrix アカウントが正確に 1 つすでに存在する場合、または `defaultAccount` が `Ops` のような既存の非正規キーを指している場合、昇格は新しい `accounts.default` エントリを作成せず、そのアカウントを保持します。
</Note>

## 設定スキーマ

Plugin 設定は、マニフェスト内の JSON Schema に対して検証されます。ユーザーは次の方法で Plugin を設定します。

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

Plugin は登録中に、この設定を `api.pluginConfig` として受け取ります。

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

`buildChannelConfigSchema` を使用して、Zod スキーマを Plugin 所有の設定アーティファクトで使われる `ChannelConfigSchema` ラッパーに変換します。

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

すでにコントラクトを JSON Schema または TypeBox として作成している場合は、直接ヘルパーを使用してください。これにより、OpenClaw はメタデータパスで Zod から JSON Schema への変換を省略できます。

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

サードパーティ Plugin では、コールドパスのコントラクトは引き続き Plugin マニフェストです。生成された JSON Schema を `openclaw.plugin.json#channelConfigs` に反映し、ランタイムコードを読み込まずに設定スキーマ、セットアップ、UI サーフェスが `channels.<id>` を検査できるようにしてください。

## セットアップウィザード

チャネル Plugin は `openclaw onboard` 用の対話型セットアップウィザードを提供できます。ウィザードは `ChannelPlugin` 上の `ChannelSetupWizard` オブジェクトです。

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

`ChannelSetupWizard` 型は、`credentials`、`textInputs`、`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize` などに対応しています。完全な例については、バンドル済み Plugin パッケージ（たとえば Discord Plugin の `src/channel.setup.ts`）を参照してください。

<AccordionGroup>
  <Accordion title="共有 allowFrom プロンプト">
    標準の `note -> prompt -> parse -> merge -> patch` フローだけが必要な DM 許可リストプロンプトでは、`openclaw/plugin-sdk/setup` の共有セットアップヘルパーを優先してください: `createPromptParsedAllowFromForAccount(...)`、`createTopLevelChannelParsedAllowFromPrompt(...)`、`createNestedChannelParsedAllowFromPrompt(...)`。
  </Accordion>
  <Accordion title="標準チャネルセットアップステータス">
    ラベル、スコア、任意の追加行だけが異なるチャネルセットアップステータスブロックでは、各 Plugin で同じ `status` オブジェクトを手作業で作る代わりに、`openclaw/plugin-sdk/setup` の `createStandardChannelSetupStatus(...)` を優先してください。
  </Accordion>
  <Accordion title="任意のチャネルセットアップサーフェス">
    特定のコンテキストでのみ表示する必要がある任意のセットアップサーフェスには、`openclaw/plugin-sdk/channel-setup` の `createOptionalChannelSetupSurface` を使用します。

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

    `plugin-sdk/channel-setup` は、その任意インストールサーフェスの片側だけが必要な場合のために、より低レベルの `createOptionalChannelSetupAdapter(...)` および `createOptionalChannelSetupWizard(...)` ビルダーも公開しています。

    生成された任意アダプター/ウィザードは、実際の設定書き込みに対して fail closed します。これらは `validateInput`、`applyAccountConfig`、`finalize` 全体で同じインストール必須メッセージを再利用し、`docsPath` が設定されている場合はドキュメントリンクを追加します。

  </Accordion>
  <Accordion title="バイナリに基づくセットアップヘルパー">
    バイナリに基づくセットアップ UI では、同じバイナリ/ステータスのつなぎ込みを各チャネルへコピーする代わりに、共有委譲ヘルパーを優先してください。

    - ラベル、ヒント、スコア、バイナリ検出だけが異なるステータスブロックには `createDetectedBinaryStatus(...)`
    - パスに基づくテキスト入力には `createCliPathTextInput(...)`
    - `setupEntry` がより重い完全なウィザードへ遅延して転送する必要がある場合は `createDelegatedSetupWizardStatusResolvers(...)`、`createDelegatedPrepare(...)`、`createDelegatedFinalize(...)`、`createDelegatedResolveConfigured(...)`
    - `setupEntry` が `textInputs[*].shouldPrompt` の判断だけを委譲する必要がある場合は `createDelegatedTextInputShouldPrompt(...)`

  </Accordion>
</AccordionGroup>

## 公開とインストール

**外部 Plugin:** [ClawHub](/ja-JP/tools/clawhub) に公開してから、インストールします。

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    ベアパッケージ指定は、ローンチ移行期間中に npm からインストールされます。

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

**リポジトリ内の Plugin:** バンドルされた Plugin ワークスペースツリーの下に配置すると、ビルド時に自動的に検出されます。

**ユーザーはインストールできます:**

```bash
openclaw plugins install <package-name>
```

<Info>
npm由来のインストールでは、`openclaw plugins install` はライフサイクルスクリプトを無効にして、パッケージを `~/.openclaw/npm` の下にインストールします。Plugin の依存関係ツリーは純粋な JS/TS に保ち、`postinstall` ビルドを必要とするパッケージは避けてください。
</Info>

<Note>
Gateway 起動時に Plugin の依存関係はインストールされません。npm/git/ClawHub のインストールフローが依存関係の収束を担います。ローカル Plugin は依存関係がすでにインストールされている必要があります。
</Note>

バンドルされたパッケージメタデータは明示的であり、Gateway 起動時にビルド済み JavaScript から推測されるものではありません。ランタイム依存関係は、それを所有する Plugin パッケージに属します。パッケージ化された OpenClaw の起動処理が Plugin の依存関係を修復したりミラーしたりすることはありません。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins) — 手順ごとのはじめにガイド
- [Plugin マニフェスト](/ja-JP/plugins/manifest) — 完全なマニフェストスキーマリファレンス
- [SDK エントリポイント](/ja-JP/plugins/sdk-entrypoints) — `definePluginEntry` と `defineChannelPluginEntry`

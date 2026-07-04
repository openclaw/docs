---
read_when:
    - Pluginにセットアップウィザードを追加しています
    - setup-entry.ts と index.ts を理解する必要があります
    - OpenClawメタデータまたは package.json の Plugin 設定スキーマを定義している
sidebarTitle: Setup and config
summary: セットアップウィザード、setup-entry.ts、config スキーマ、package.json メタデータ
title: Plugin のセットアップと設定
x-i18n:
    generated_at: "2026-07-04T15:08:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0969ab2cc069389b8957b07e76591bc76fea7bee22125587fa067122d11bb024
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Plugin のパッケージング（`package.json` メタデータ）、マニフェスト（`openclaw.plugin.json`）、セットアップエントリ、設定スキーマのリファレンス。

<Tip>
**ウォークスルーを探していますか？** ハウツーガイドでは、文脈に沿ってパッケージングを説明しています: [Channel Plugin](/ja-JP/plugins/sdk-channel-plugins#step-1-package-and-manifest) と [Provider Plugin](/ja-JP/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
</Tip>

## パッケージメタデータ

`package.json` には、Plugin システムに Plugin が何を提供するかを伝える `openclaw` フィールドが必要です。

<Tabs>
  <Tab title="Channel Plugin">
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
  <Tab title="Provider Plugin / ClawHub ベースライン">
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
Plugin を ClawHub で外部公開する場合、これらの `compat` フィールドと `build` フィールドは必須です。標準の公開スニペットは `docs/snippets/plugin-publish/` にあります。
</Note>

### `openclaw` フィールド

<ParamField path="extensions" type="string[]">
  エントリポイントファイル（パッケージルートからの相対パス）。
</ParamField>
<ParamField path="setupEntry" type="string">
  セットアップ専用の軽量エントリ（任意）。
</ParamField>
<ParamField path="channel" type="object">
  セットアップ、ピッカー、クイックスタート、ステータス画面向けのチャネルカタログメタデータ。
</ParamField>
<ParamField path="providers" type="string[]">
  この Plugin によって登録されるプロバイダー ID。
</ParamField>
<ParamField path="install" type="object">
  インストールのヒント: `npmSpec`、`localPath`、`defaultChoice`、`minHostVersion`、`expectedIntegrity`、`allowInvalidConfigRecovery`。
</ParamField>
<ParamField path="startup" type="object">
  起動時の動作フラグ。
</ParamField>

### `openclaw.channel`

`openclaw.channel` は、ランタイムが読み込まれる前のチャネル検出とセットアップ画面向けの低コストなパッケージメタデータです。

| フィールド                             | 型         | 意味                                                                          |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | 正規のチャネル ID。                                                           |
| `label`                                | `string`   | プライマリチャネルラベル。                                                    |
| `selectionLabel`                       | `string`   | `label` と異なる必要がある場合のピッカー/セットアップ用ラベル。              |
| `detailLabel`                          | `string`   | より詳細なチャネルカタログとステータス画面向けのセカンダリ詳細ラベル。       |
| `docsPath`                             | `string`   | セットアップと選択リンク用のドキュメントパス。                                |
| `docsLabel`                            | `string`   | ドキュメントリンクに使うラベルを、チャネル ID と異なるものにする場合の上書き。 |
| `blurb`                                | `string`   | オンボーディング/カタログ向けの短い説明。                                     |
| `order`                                | `number`   | チャネルカタログ内の並び順。                                                  |
| `aliases`                              | `string[]` | チャネル選択用の追加検索エイリアス。                                          |
| `preferOver`                           | `string[]` | このチャネルが優先すべき、優先度の低い Plugin/チャネル ID。                  |
| `systemImage`                          | `string`   | チャネル UI カタログ用の任意のアイコン/システム画像名。                       |
| `selectionDocsPrefix`                  | `string`   | 選択画面でドキュメントリンクの前に表示する接頭辞テキスト。                    |
| `selectionDocsOmitLabel`               | `boolean`  | 選択コピーでラベル付きドキュメントリンクの代わりにドキュメントパスを直接表示する。 |
| `selectionExtras`                      | `string[]` | 選択コピーに追加される短い文字列。                                            |
| `markdownCapable`                      | `boolean`  | 送信フォーマット判断で、このチャネルを Markdown 対応としてマークする。        |
| `exposure`                             | `object`   | セットアップ、設定済みリスト、ドキュメント画面でのチャネル表示制御。          |
| `quickstartAllowFrom`                  | `boolean`  | このチャネルを標準のクイックスタート `allowFrom` セットアップフローに参加させる。 |
| `forceAccountBinding`                  | `boolean`  | アカウントが 1 つしかない場合でも、明示的なアカウントバインドを要求する。     |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | このチャネルの告知先を解決するときにセッション検索を優先する。                |

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

- `configured`: 設定済み/ステータス形式の一覧画面にチャネルを含める
- `setup`: 対話型セットアップ/設定ピッカーにチャネルを含める
- `docs`: ドキュメント/ナビゲーション画面でチャネルを公開向けとしてマークする

<Note>
`showConfigured` と `showInSetup` はレガシーエイリアスとして引き続きサポートされます。`exposure` を優先してください。
</Note>

### `openclaw.install`

`openclaw.install` はパッケージメタデータであり、マニフェストメタデータではありません。

| フィールド                   | 型                                  | 意味                                                                              |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | インストール/更新およびオンボーディングのオンデマンドインストールフロー用の正規 ClawHub 仕様。 |
| `npmSpec`                    | `string`                            | インストール/更新のフォールバックフロー用の正規 npm 仕様。                       |
| `localPath`                  | `string`                            | ローカル開発またはバンドル済みインストールパス。                                  |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | 複数のソースが利用可能な場合の優先インストールソース。                            |
| `minHostVersion`             | `string`                            | `>=x.y.z` または `>=x.y.z-prerelease` 形式の、サポートされる最小 OpenClaw バージョン。 |
| `expectedIntegrity`          | `string`                            | 固定インストール向けの、通常は `sha512-...` である期待 npm dist integrity 文字列。 |
| `allowInvalidConfigRecovery` | `boolean`                           | バンドル済み Plugin の再インストールフローが、特定の古い設定障害から復旧できるようにする。 |
| `requiredPlatformPackages`   | `string[]`                          | npm インストール中に検証される、必須のプラットフォーム固有 npm エイリアス。       |

<AccordionGroup>
  <Accordion title="オンボーディング時の動作">
    対話型オンボーディングでも、オンデマンドインストール画面に `openclaw.install` が使われます。Plugin がランタイム読み込み前にプロバイダー認証の選択肢やチャネルセットアップ/カタログメタデータを公開する場合、オンボーディングはその選択肢を表示し、ClawHub、npm、またはローカルインストールを求め、Plugin をインストールまたは有効化してから、選択されたフローを続行できます。ClawHub のオンボーディング選択肢は `clawhubSpec` を使い、存在する場合は優先されます。npm の選択肢には、レジストリ `npmSpec` を持つ信頼済みカタログメタデータが必要です。正確なバージョンと `expectedIntegrity` は任意の npm 固定指定です。`expectedIntegrity` が存在する場合、インストール/更新フローは npm に対してそれを強制します。「何を表示するか」のメタデータは `openclaw.plugin.json` に、「どのようにインストールするか」のメタデータは `package.json` に保持してください。
  </Accordion>
  <Accordion title="minHostVersion の強制">
    `minHostVersion` が設定されている場合、インストールと非バンドルのマニフェストレジストリ読み込みの両方で強制されます。古いホストは外部 Plugin をスキップします。無効なバージョン文字列は拒否されます。バンドル済みソース Plugin は、ホストチェックアウトと同じバージョンであるとみなされます。
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
    `allowInvalidConfigRecovery` は壊れた設定の一般的なバイパスではありません。これは狭い範囲のバンドル済み Plugin 復旧専用であり、再インストール/セットアップが、バンドル済み Plugin パスの欠落や同じ Plugin に対する古い `channels.<id>` エントリのような既知のアップグレード残りを修復できるようにするものです。無関係な理由で設定が壊れている場合、インストールは引き続きフェイルクローズし、オペレーターに `openclaw doctor --fix` を実行するよう伝えます。
  </Accordion>
</AccordionGroup>

### 遅延フルロード

Channel Plugin は、次で遅延読み込みを選択できます。

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

有効にすると、OpenClaw はすでに設定済みのチャネルであっても、listen 前の起動フェーズでは `setupEntry` だけを読み込みます。完全なエントリは Gateway が listen を開始した後に読み込まれます。

<Warning>
遅延読み込みは、`setupEntry` が Gateway の listen 開始前に必要なすべて（チャネル登録、HTTP ルート、Gateway メソッド）を登録する場合にのみ有効にしてください。必要な起動機能を完全なエントリが所有している場合は、デフォルトの動作を維持してください。
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

構成がない Plugin でもスキーマを同梱する必要があります。空のスキーマは有効です。

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

完全なスキーマリファレンスについては、[Plugin マニフェスト](/ja-JP/plugins/manifest)を参照してください。

## ClawHub への公開

Plugin パッケージでは、パッケージ専用の ClawHub コマンドを使用します。

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
従来の Skills 専用公開エイリアスは Skills 用です。Plugin パッケージでは必ず `clawhub package publish` を使用してください。
</Note>

## セットアップエントリ

`setup-entry.ts` ファイルは、OpenClaw がセットアップサーフェス（オンボーディング、構成修復、無効化されたチャンネルの検査）だけを必要とする場合に読み込む、`index.ts` の軽量な代替です。

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

これにより、セットアップフロー中に重いランタイムコード（暗号ライブラリ、CLI 登録、バックグラウンドサービス）を読み込まずに済みます。

セットアップに安全なエクスポートをサイドカーモジュールに保持しているバンドル済みワークスペースチャンネルは、`defineSetupPluginEntry(...)` の代わりに `openclaw/plugin-sdk/channel-entry-contract` の `defineBundledChannelSetupEntry(...)` を使用できます。そのバンドル済み契約は任意の `runtime` エクスポートにも対応しているため、セットアップ時のランタイム配線を軽量かつ明示的に保てます。

<AccordionGroup>
  <Accordion title="OpenClaw がフルエントリの代わりに setupEntry を使用する場合">
    - チャンネルは無効化されているが、セットアップ/オンボーディングサーフェスが必要な場合。
    - チャンネルは有効だが未構成の場合。
    - 遅延読み込みが有効な場合（`deferConfiguredChannelFullLoadUntilAfterListen`）。

  </Accordion>
  <Accordion title="setupEntry が登録する必要があるもの">
    - チャンネル Plugin オブジェクト（`defineSetupPluginEntry` 経由）。
    - Gateway listen 前に必要な HTTP ルート。
    - 起動中に必要な Gateway メソッド。

    これらの起動時 Gateway メソッドでも、`config.*` や `update.*` などの予約済みコア管理名前空間は避ける必要があります。

  </Accordion>
  <Accordion title="setupEntry に含めるべきでないもの">
    - CLI 登録。
    - バックグラウンドサービス。
    - 重いランタイム import（暗号、SDK）。
    - 起動後にのみ必要な Gateway メソッド。

  </Accordion>
</AccordionGroup>

### 狭いセットアップヘルパー import

セットアップ専用のホットパスでは、セットアップサーフェスの一部だけが必要な場合、広範な `plugin-sdk/setup` 包括エントリではなく、狭いセットアップヘルパーの継ぎ目を優先します。

| import パス                        | 用途                                                                                | 主なエクスポート                                                                                                                                                                                                                                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | `setupEntry` / 遅延チャンネル起動で利用可能なままにするセットアップ時ランタイムヘルパー | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 非推奨の互換エイリアス。`plugin-sdk/setup-runtime` を使用してください                            | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | セットアップ/インストール CLI/アーカイブ/ドキュメントヘルパー                                                    | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

`moveSingleAccountChannelSectionToDefaultAccount(...)` などの構成パッチヘルパーを含む、共有セットアップツールボックス全体が必要な場合は、より広範な `plugin-sdk/setup` の継ぎ目を使用します。

固定のセットアップウィザード文言には `createSetupTranslator(...)` を使用します。これは
CLI ウィザードのロケール（`OPENCLAW_LOCALE`、次にシステムロケール変数）に従い、
英語にフォールバックします。Plugin 固有のセットアップテキストは Plugin 所有のコードに保持し、
共通のセットアップラベル、ステータステキスト、公式バンドル Plugin のセットアップ文言にのみ
共有カタログキーを使用します。

セットアップパッチアダプターは、import 時もホットパス安全です。バンドル済み単一アカウント昇格の契約サーフェス検索は遅延されるため、`plugin-sdk/setup-runtime` を import しても、アダプターが実際に使用される前にバンドル済み契約サーフェス探索が即時読み込みされることはありません。

### チャンネル所有の単一アカウント昇格

チャンネルが単一アカウントのトップレベル構成から `channels.<id>.accounts.*` にアップグレードする場合、デフォルトの共有動作では、昇格されたアカウントスコープの値を `accounts.default` に移動します。

バンドル済みチャンネルは、セットアップ契約サーフェスを通じてその昇格を絞り込む、または上書きできます。

- `singleAccountKeysToMove`: 昇格されたアカウントへ移動する必要がある追加のトップレベルキー
- `namedAccountPromotionKeys`: 名前付きアカウントがすでに存在する場合、これらのキーだけが昇格されたアカウントへ移動します。共有ポリシー/配信キーはチャンネルルートに残ります
- `resolveSingleAccountPromotionTarget(...)`: 昇格された値を受け取る既存アカウントを選択します

<Note>
Matrix は現在のバンドル済み例です。名前付き Matrix アカウントがちょうど 1 つすでに存在する場合、または `defaultAccount` が `Ops` のような既存の非正規キーを指している場合、昇格は新しい `accounts.default` エントリを作成せず、そのアカウントを保持します。
</Note>

## 構成スキーマ

Plugin 構成は、マニフェスト内の JSON Schema に対して検証されます。ユーザーは次のように Plugin を構成します。

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

Plugin は登録中にこの構成を `api.pluginConfig` として受け取ります。

チャンネル固有の構成には、代わりにチャンネル構成セクションを使用します。

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

### チャンネル構成スキーマの構築

`buildChannelConfigSchema` を使用して、Zod スキーマを Plugin 所有の構成アーティファクトで使用される `ChannelConfigSchema` ラッパーに変換します。

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

契約をすでに JSON Schema または TypeBox として作成している場合は、メタデータパスで OpenClaw が Zod から JSON Schema への変換を省略できるよう、直接ヘルパーを使用します。

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

サードパーティ Plugin では、コールドパス契約は引き続き Plugin マニフェストです。生成された JSON Schema を `openclaw.plugin.json#channelConfigs` にミラーリングして、構成スキーマ、セットアップ、UI サーフェスがランタイムコードを読み込まずに `channels.<id>` を検査できるようにします。

## セットアップウィザード

チャンネル Plugin は `openclaw onboard` 用の対話型セットアップウィザードを提供できます。ウィザードは `ChannelPlugin` 上の `ChannelSetupWizard` オブジェクトです。

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

`ChannelSetupWizard` 型は、`credentials`、`textInputs`、`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize` などをサポートします。完全な例については、バンドル済み Plugin パッケージ（たとえば Discord Plugin の `src/channel.setup.ts`）を参照してください。

<AccordionGroup>
  <Accordion title="共有 allowFrom プロンプト">
    標準の `note -> prompt -> parse -> merge -> patch` フローだけが必要な DM allowlist プロンプトでは、`openclaw/plugin-sdk/setup` の共有セットアップヘルパーである `createPromptParsedAllowFromForAccount(...)`、`createTopLevelChannelParsedAllowFromPrompt(...)`、`createNestedChannelParsedAllowFromPrompt(...)` を優先します。
  </Accordion>
  <Accordion title="標準チャンネルセットアップステータス">
    ラベル、スコア、任意の追加行だけが異なるチャンネルセットアップステータスブロックでは、各 Plugin で同じ `status` オブジェクトを手作りする代わりに、`openclaw/plugin-sdk/setup` の `createStandardChannelSetupStatus(...)` を優先します。
  </Accordion>
  <Accordion title="任意のチャンネルセットアップサーフェス">
    特定のコンテキストでのみ表示されるべき任意のセットアップサーフェスには、`openclaw/plugin-sdk/channel-setup` の `createOptionalChannelSetupSurface` を使用します。

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

    `plugin-sdk/channel-setup` は、その任意インストールサーフェスの片側だけが必要な場合に使える、より低レベルの `createOptionalChannelSetupAdapter(...)` ビルダーと `createOptionalChannelSetupWizard(...)` ビルダーも公開しています。

    生成された任意アダプター/ウィザードは、実際の構成書き込みではフェイルクローズします。`validateInput`、`applyAccountConfig`、`finalize` で 1 つのインストール必須メッセージを再利用し、`docsPath` が設定されている場合はドキュメントリンクを追加します。

  </Accordion>
  <Accordion title="バイナリベースのセットアップヘルパー">
    バイナリベースのセットアップ UI では、同じバイナリ/ステータスの接着コードをすべてのチャンネルにコピーするのではなく、共有の委譲ヘルパーを優先します。

    - ラベル、ヒント、スコア、バイナリ検出だけが異なるステータスブロックには `createDetectedBinaryStatus(...)`
    - パスに基づくテキスト入力には `createCliPathTextInput(...)`
    - `setupEntry` がより重い完全なウィザードへ遅延転送する必要がある場合は、`createDelegatedSetupWizardStatusResolvers(...)`、`createDelegatedPrepare(...)`、`createDelegatedFinalize(...)`、`createDelegatedResolveConfigured(...)`
    - `setupEntry` が `textInputs[*].shouldPrompt` の判断だけを委譲する必要がある場合は `createDelegatedTextInputShouldPrompt(...)`

  </Accordion>
</AccordionGroup>

## 公開とインストール

**外部プラグイン:** [ClawHub](/clawhub) に公開してから、インストールします。

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    修飾なしのパッケージ指定は、ローンチ切り替え中に npm からインストールされます。

  </Tab>
  <Tab title="ClawHub のみ">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm パッケージ指定">
    パッケージがまだ ClawHub に移行していない場合、または移行中に
    npm への直接インストールパスが必要な場合は npm を使用します。

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**リポジトリ内プラグイン:** バンドル済みプラグインのワークスペースツリー配下に配置すると、ビルド時に自動検出されます。

**ユーザーは次のようにインストールできます。**

```bash
openclaw plugins install <package-name>
```

<Info>
npm 由来のインストールでは、`openclaw plugins install` はライフサイクルスクリプトを無効にした状態で、パッケージを `~/.openclaw/npm/projects` 配下のプラグインごとのプロジェクトへインストールします。プラグインの依存関係ツリーは純粋な JS/TS に保ち、`postinstall` ビルドを必要とするパッケージは避けてください。
</Info>

<Note>
Gateway の起動時にプラグインの依存関係はインストールされません。npm/git/ClawHub のインストールフローが依存関係の収束を担当します。ローカルプラグインは、依存関係がすでにインストールされている必要があります。
</Note>

バンドル済みパッケージのメタデータは明示的であり、Gateway 起動時にビルド済み JavaScript から推論されるものではありません。ランタイム依存関係は、それを所有するプラグインパッケージに属します。パッケージ化された OpenClaw の起動処理がプラグインの依存関係を修復またはミラーすることはありません。

## 関連

- [プラグインの構築](/ja-JP/plugins/building-plugins) — 段階的なはじめにガイド
- [Plugin マニフェスト](/ja-JP/plugins/manifest) — 完全なマニフェストスキーマリファレンス
- [SDK エントリポイント](/ja-JP/plugins/sdk-entrypoints) — `definePluginEntry` と `defineChannelPluginEntry`

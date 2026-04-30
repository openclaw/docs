---
read_when:
    - Pluginにセットアップウィザードを追加しています
    - setup-entry.ts と index.ts の違いを理解する必要があります
    - Plugin 設定スキーマまたは package.json の openclaw メタデータを定義しています
sidebarTitle: Setup and config
summary: セットアップ ウィザード、setup-entry.ts、設定スキーマ、および package.json メタデータ
title: Plugin のセットアップと設定
x-i18n:
    generated_at: "2026-04-30T05:28:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: ded93227e0db13311870a9f45f01c2a0892a7204262fab17d09fdecd7c71579a
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Plugin パッケージング（`package.json` メタデータ）、マニフェスト（`openclaw.plugin.json`）、セットアップエントリ、設定スキーマのリファレンス。

<Tip>
**ウォークスルーを探していますか？** ハウツーガイドでは、文脈に沿ってパッケージングを説明しています: [Channel plugins](/ja-JP/plugins/sdk-channel-plugins#step-1-package-and-manifest) と [Provider plugins](/ja-JP/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
</Tip>

## パッケージメタデータ

`package.json` には、この Plugin が何を提供するかを Plugin システムに伝える `openclaw` フィールドが必要です。

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
  セットアップ、ピッカー、クイックスタート、ステータス画面向けのチャネルカタログメタデータ。
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

`openclaw.channel` は、ランタイムが読み込まれる前のチャネル検出とセットアップ画面向けの軽量なパッケージメタデータです。

| フィールド                             | 型         | 意味                                                                          |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | 正規のチャネル ID。                                                           |
| `label`                                | `string`   | 主要なチャネルラベル。                                                        |
| `selectionLabel`                       | `string`   | `label` と異なる必要がある場合のピッカー/セットアップ用ラベル。              |
| `detailLabel`                          | `string`   | より充実したチャネルカタログとステータス画面向けの補助詳細ラベル。           |
| `docsPath`                             | `string`   | セットアップリンクと選択リンク用のドキュメントパス。                         |
| `docsLabel`                            | `string`   | ドキュメントリンクでチャネル ID と異なる表示にしたい場合に使う上書きラベル。 |
| `blurb`                                | `string`   | 短いオンボーディング/カタログ説明。                                           |
| `order`                                | `number`   | チャネルカタログ内の並び順。                                                  |
| `aliases`                              | `string[]` | チャネル選択用の追加検索エイリアス。                                          |
| `preferOver`                           | `string[]` | このチャネルが優先されるべき、優先度の低い Plugin/チャネル ID。              |
| `systemImage`                          | `string`   | チャネル UI カタログ用の任意のアイコン/システム画像名。                      |
| `selectionDocsPrefix`                  | `string`   | 選択画面でドキュメントリンクの前に表示する接頭辞テキスト。                   |
| `selectionDocsOmitLabel`               | `boolean`  | 選択コピー内でラベル付きドキュメントリンクではなく、ドキュメントパスを直接表示する。 |
| `selectionExtras`                      | `string[]` | 選択コピーに追加される短い文字列。                                            |
| `markdownCapable`                      | `boolean`  | 送信フォーマットの判断で、このチャネルを Markdown 対応としてマークする。     |
| `exposure`                             | `object`   | セットアップ、設定済みリスト、ドキュメント画面でのチャネル表示制御。         |
| `quickstartAllowFrom`                  | `boolean`  | このチャネルを標準のクイックスタート `allowFrom` セットアップフローに参加させる。 |
| `forceAccountBinding`                  | `boolean`  | アカウントが 1 つしか存在しない場合でも、明示的なアカウントバインドを要求する。 |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | このチャネルのアナウンス先を解決するときに、セッション検索を優先する。       |

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

- `configured`: 設定済み/ステータス形式の一覧画面にチャネルを含める
- `setup`: 対話式のセットアップ/設定ピッカーにチャネルを含める
- `docs`: ドキュメント/ナビゲーション画面でチャネルを公開対象としてマークする

<Note>
`showConfigured` と `showInSetup` はレガシーエイリアスとして引き続きサポートされています。`exposure` を推奨します。
</Note>

### `openclaw.install`

`openclaw.install` はパッケージメタデータであり、マニフェストメタデータではありません。

| フィールド                   | 型                   | 意味                                                                             |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | インストール/更新フロー向けの正規 npm 仕様。                                    |
| `localPath`                  | `string`             | ローカル開発またはバンドル済みインストール用パス。                              |
| `defaultChoice`              | `"npm"` \| `"local"` | 両方が利用可能な場合の優先インストール元。                                      |
| `minHostVersion`             | `string`             | `>=x.y.z` 形式の、サポートされる最小 OpenClaw バージョン。                      |
| `expectedIntegrity`          | `string`             | 固定インストール向けの、通常は `sha512-...` の期待 npm dist 整合性文字列。      |
| `allowInvalidConfigRecovery` | `boolean`            | バンドル済み Plugin の再インストールフローが、特定の古い設定エラーから復旧できるようにする。 |

<AccordionGroup>
  <Accordion title="オンボーディング動作">
    対話式オンボーディングでも、オンデマンドインストール画面に `openclaw.install` を使用します。Plugin がランタイム読み込み前にプロバイダー認証の選択肢やチャネルのセットアップ/カタログメタデータを公開している場合、オンボーディングはその選択肢を表示し、npm とローカルインストールのどちらにするかを尋ね、Plugin をインストールまたは有効化してから、選択されたフローを続行できます。npm オンボーディングの選択肢には、レジストリ `npmSpec` を含む信頼済みカタログメタデータが必要です。正確なバージョンと `expectedIntegrity` は任意の固定指定です。`expectedIntegrity` が存在する場合、インストール/更新フローはそれを強制します。「何を表示するか」のメタデータは `openclaw.plugin.json` に、「どうインストールするか」のメタデータは `package.json` に保持してください。
  </Accordion>
  <Accordion title="minHostVersion の強制">
    `minHostVersion` が設定されている場合、インストールとマニフェストレジストリ読み込みの両方でそれが強制されます。古いホストは Plugin をスキップし、無効なバージョン文字列は拒否されます。
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
  <Accordion title="allowInvalidConfigRecovery の範囲">
    `allowInvalidConfigRecovery` は、壊れた設定に対する一般的なバイパスではありません。これは狭い範囲のバンドル済み Plugin 復旧専用であり、再インストール/セットアップによって、同じ Plugin のバンドル済み Plugin パスがない、または古い `channels.<id>` エントリが残っているといった既知のアップグレード残存物を修復できるようにするものです。無関係な理由で設定が壊れている場合、インストールは引き続き失敗クローズし、運用者に `openclaw doctor --fix` を実行するよう伝えます。
  </Accordion>
</AccordionGroup>

### 完全読み込みの延期

チャネル Plugin は、次のように延期読み込みを有効化できます。

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

有効にすると、OpenClaw はすでに設定済みのチャネルであっても、listen 前の起動フェーズ中は `setupEntry` のみを読み込みます。完全なエントリは、Gateway が listen を開始した後に読み込まれます。

<Warning>
延期読み込みは、`setupEntry` が Gateway が listen を開始する前に必要なすべてのもの（チャネル登録、HTTP ルート、Gateway メソッド）を登録する場合にのみ有効にしてください。完全なエントリが必要な起動機能を所有している場合は、既定の動作を維持してください。
</Warning>

セットアップ/完全エントリが Gateway RPC メソッドを登録する場合は、Plugin 固有の接頭辞に維持してください。予約済みのコア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）はコア所有のままで、常に `operator.admin` に解決されます。

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

チャネル Plugin の場合は、`kind` と `channels` を追加します。

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

設定がない Plugin でも、スキーマを同梱する必要があります。空のスキーマは有効です。

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

Plugin パッケージには、パッケージ固有の ClawHub コマンドを使用します。

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
レガシーの Skills 専用公開エイリアスは Skills 用です。Plugin パッケージでは常に `clawhub package publish` を使用してください。
</Note>

## セットアップエントリ

`setup-entry.ts` ファイルは、OpenClaw がセットアップ画面（オンボーディング、設定修復、無効化されたチャネルの検査）のみを必要とする場合に読み込む、`index.ts` の軽量な代替です。

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

これにより、セットアップフロー中に重いランタイムコード（暗号ライブラリ、CLI登録、バックグラウンドサービス）をロードせずに済みます。

セットアップ安全なエクスポートをサイドカーモジュールに保持するバンドル済みワークスペースチャネルは、`defineSetupPluginEntry(...)` の代わりに `openclaw/plugin-sdk/channel-entry-contract` の `defineBundledChannelSetupEntry(...)` を使用できます。このバンドル済みコントラクトは任意の `runtime` エクスポートもサポートするため、セットアップ時のランタイム配線を軽量かつ明示的に保てます。

<AccordionGroup>
  <Accordion title="OpenClaw が完全なエントリの代わりに setupEntry を使用する場合">
    - チャネルが無効だが、セットアップ/オンボーディング画面が必要な場合。
    - チャネルが有効だが未設定の場合。
    - 遅延ロードが有効な場合（`deferConfiguredChannelFullLoadUntilAfterListen`）。

  </Accordion>
  <Accordion title="setupEntry が登録する必要があるもの">
    - チャネル Plugin オブジェクト（`defineSetupPluginEntry` 経由）。
    - Gateway の listen 前に必要な HTTP ルート。
    - 起動中に必要な Gateway メソッド。

    それらの起動時 Gateway メソッドでも、`config.*` や `update.*` などの予約済みコア管理名前空間は避ける必要があります。

  </Accordion>
  <Accordion title="setupEntry に含めるべきではないもの">
    - CLI登録。
    - バックグラウンドサービス。
    - 重いランタイムインポート（暗号、SDK）。
    - 起動後にのみ必要な Gateway メソッド。

  </Accordion>
</AccordionGroup>

### 狭いセットアップヘルパーのインポート

ホットなセットアップ専用パスでは、セットアップ面の一部だけが必要な場合、より広範な `plugin-sdk/setup` アンブレラよりも狭いセットアップヘルパーの継ぎ目を優先してください。

| インポートパス                   | 用途                                                                                      | 主なエクスポート                                                                                                                                                                                                                                                                             |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | `setupEntry` / 遅延チャネル起動で引き続き利用できるセットアップ時ランタイムヘルパー       | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 環境対応のアカウントセットアップアダプター                                                | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | セットアップ/インストール CLI/アーカイブ/ドキュメントヘルパー                            | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

`moveSingleAccountChannelSectionToDefaultAccount(...)` などの設定パッチヘルパーを含む、共有セットアップツールボックス全体が必要な場合は、より広範な `plugin-sdk/setup` の継ぎ目を使用してください。

セットアップパッチアダプターは、インポート時にホットパス安全性を保ちます。バンドル済みの単一アカウント昇格コントラクト面のルックアップは遅延されるため、`plugin-sdk/setup-runtime` をインポートしても、アダプターが実際に使用される前にバンドル済みコントラクト面の検出を先行ロードしません。

### チャネル所有の単一アカウント昇格

チャネルが単一アカウントのトップレベル設定から `channels.<id>.accounts.*` にアップグレードする場合、デフォルトの共有動作では、昇格されたアカウントスコープ値を `accounts.default` に移動します。

バンドル済みチャネルは、セットアップコントラクト面を通じてその昇格を狭めたり上書きしたりできます。

- `singleAccountKeysToMove`: 昇格されたアカウントに移動すべき追加のトップレベルキー
- `namedAccountPromotionKeys`: 名前付きアカウントがすでに存在する場合、昇格されたアカウントに移動するのはこれらのキーのみです。共有ポリシー/配信キーはチャネルルートに残ります
- `resolveSingleAccountPromotionTarget(...)`: 昇格された値を受け取る既存アカウントを選択します

<Note>
Matrix は現在のバンドル済み例です。名前付き Matrix アカウントがすでにちょうど1つ存在する場合、または `defaultAccount` が `Ops` などの既存の非正規キーを指している場合、昇格では新しい `accounts.default` エントリを作成せず、そのアカウントを保持します。
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

`buildChannelConfigSchema` を使用して、Zod スキーマを Plugin 所有の設定成果物で使用される `ChannelConfigSchema` ラッパーに変換します。

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

サードパーティ Plugin の場合、コールドパスコントラクトは引き続き Plugin マニフェストです。生成された JSON Schema を `openclaw.plugin.json#channelConfigs` にミラーして、設定スキーマ、セットアップ、UI 面がランタイムコードをロードせずに `channels.<id>` を検査できるようにしてください。

## セットアップウィザード

チャネル Plugin は、`openclaw onboard` 向けの対話型セットアップウィザードを提供できます。ウィザードは `ChannelPlugin` 上の `ChannelSetupWizard` オブジェクトです。

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

`ChannelSetupWizard` 型は `credentials`、`textInputs`、`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize` などをサポートします。完全な例については、バンドル済み Plugin パッケージ（たとえば Discord Plugin の `src/channel.setup.ts`）を参照してください。

<AccordionGroup>
  <Accordion title="共有 allowFrom プロンプト">
    標準の `note -> prompt -> parse -> merge -> patch` フローだけが必要な DM allowlist プロンプトでは、`openclaw/plugin-sdk/setup` の共有セットアップヘルパーである `createPromptParsedAllowFromForAccount(...)`、`createTopLevelChannelParsedAllowFromPrompt(...)`、`createNestedChannelParsedAllowFromPrompt(...)` を優先してください。
  </Accordion>
  <Accordion title="標準チャネルセットアップステータス">
    ラベル、スコア、任意の追加行だけが異なるチャネルセットアップステータスブロックでは、各 Plugin で同じ `status` オブジェクトを手作りする代わりに、`openclaw/plugin-sdk/setup` の `createStandardChannelSetupStatus(...)` を優先してください。
  </Accordion>
  <Accordion title="任意のチャネルセットアップ面">
    特定のコンテキストでのみ表示されるべき任意のセットアップ面には、`openclaw/plugin-sdk/channel-setup` の `createOptionalChannelSetupSurface` を使用します。

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

    `plugin-sdk/channel-setup` は、その任意インストール面の片側だけが必要な場合に使える、より低レベルの `createOptionalChannelSetupAdapter(...)` と `createOptionalChannelSetupWizard(...)` ビルダーも公開しています。

    生成される任意アダプター/ウィザードは、実際の設定書き込みでは fail closed になります。`validateInput`、`applyAccountConfig`、`finalize` 全体でインストール必須メッセージを1つ再利用し、`docsPath` が設定されている場合はドキュメントリンクを追加します。

  </Accordion>
  <Accordion title="バイナリ支援セットアップヘルパー">
    バイナリ支援のセットアップ UI では、同じバイナリ/ステータス接着コードを各チャネルにコピーする代わりに、共有委譲ヘルパーを優先してください。

    - ラベル、ヒント、スコア、バイナリ検出だけが異なるステータスブロックには `createDetectedBinaryStatus(...)`
    - パス支援のテキスト入力には `createCliPathTextInput(...)`
    - `setupEntry` がより重い完全なウィザードへ遅延転送する必要がある場合は、`createDelegatedSetupWizardStatusResolvers(...)`、`createDelegatedPrepare(...)`、`createDelegatedFinalize(...)`、`createDelegatedResolveConfigured(...)`
    - `setupEntry` が `textInputs[*].shouldPrompt` の判断だけを委譲する必要がある場合は `createDelegatedTextInputShouldPrompt(...)`

  </Accordion>
</AccordionGroup>

## 公開とインストール

**外部 Plugin:** [ClawHub](/ja-JP/tools/clawhub) に公開してから、インストールします。

<Tabs>
  <Tab title="自動（ClawHub、その後 npm）">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw は最初に ClawHub を試し、自動的に npm にフォールバックします。

  </Tab>
  <Tab title="ClawHub のみ">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm パッケージ指定">
    パッケージがまだ ClawHub に移行していない場合、または移行中に直接の npm インストールパスが必要な場合は、npm を使用します。

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**リポジトリ内 Plugin:** バンドル済み Plugin ワークスペースツリーの下に配置すると、ビルド中に自動的に検出されます。

**ユーザーは次のようにインストールできます。**

```bash
openclaw plugins install <package-name>
```

<Info>
npm 由来のインストールでは、`openclaw plugins install` はプロジェクトローカルの `npm install --ignore-scripts`（ライフサイクルスクリプトなし）を実行し、継承されたグローバル npm インストール設定を無視します。Plugin の依存関係ツリーは純粋な JS/TS に保ち、`postinstall` ビルドを必要とするパッケージは避けてください。
</Info>

<Note>
バンドルされた OpenClaw 所有の Plugin だけが起動時修復の例外です。パッケージ版インストールが、Plugin設定、従来のチャンネル設定、またはバンドルされたデフォルト有効マニフェストによって有効になっている Plugin を検出すると、起動時にその Plugin に不足しているランタイム依存関係をインポート前にインストールします。運用者は `openclaw plugins deps` でこの段階を検査または修復できます。サードパーティ Plugin は起動時インストールに依存しないでください。引き続き明示的な Plugin インストーラーを使用してください。
</Note>

バンドルされたパッケージレベルのランタイム依存関係は明示的なメタデータであり、Gateway 起動時にビルド済み JavaScript から推測されるものではありません。共有 OpenClaw ルート依存関係を外部のバンドル済み Plugin ランタイムミラー内で利用可能にする必要がある場合は、ルートパッケージマニフェストの `openclaw.bundle.mirroredRootRuntimeDependencies` で宣言してください。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins) — 手順ごとのはじめにガイド
- [Plugin マニフェスト](/ja-JP/plugins/manifest) — 完全なマニフェストスキーマリファレンス
- [SDK エントリポイント](/ja-JP/plugins/sdk-entrypoints) — `definePluginEntry` と `defineChannelPluginEntry`

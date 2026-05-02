---
read_when:
    - Pluginにセットアップウィザードを追加しています
    - setup-entry.ts と index.ts の違いを理解する必要があります
    - Plugin 設定スキーマまたは package.json の openclaw メタデータを定義している
sidebarTitle: Setup and config
summary: セットアップウィザード、setup-entry.ts、設定スキーマ、および package.json メタデータ
title: Pluginのセットアップと設定
x-i18n:
    generated_at: "2026-05-02T05:03:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 322cf8988da686d5bf7577f9825f6f8decb738f91563e4022c14bf16dca22824
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Plugin パッケージ化（`package.json` メタデータ）、マニフェスト（`openclaw.plugin.json`）、セットアップエントリ、設定スキーマのリファレンス。

<Tip>
**ウォークスルーを探していますか？** ハウツーガイドでは、文脈に沿ってパッケージ化を扱っています: [Channel plugins](/ja-JP/plugins/sdk-channel-plugins#step-1-package-and-manifest) と [Provider plugins](/ja-JP/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
</Tip>

## パッケージメタデータ

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
ClawHub で Plugin を外部公開する場合、これらの `compat` と `build` フィールドは必須です。正規の公開スニペットは `docs/snippets/plugin-publish/` にあります。
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

`openclaw.channel` は、ランタイムが読み込まれる前にチャンネルの検出とセットアップ画面で使われる軽量なパッケージメタデータです。

| フィールド                             | 型         | 意味                                                                          |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | 正規のチャンネル ID。                                                         |
| `label`                                | `string`   | 主要なチャンネルラベル。                                                      |
| `selectionLabel`                       | `string`   | `label` と異なる必要がある場合のピッカー/セットアップ用ラベル。              |
| `detailLabel`                          | `string`   | より詳しいチャンネルカタログとステータス画面向けの補助詳細ラベル。            |
| `docsPath`                             | `string`   | セットアップと選択リンクのためのドキュメントパス。                            |
| `docsLabel`                            | `string`   | ドキュメントリンクでチャンネル ID と異なるラベルを使う場合の上書きラベル。    |
| `blurb`                                | `string`   | 短いオンボーディング/カタログ説明。                                           |
| `order`                                | `number`   | チャンネルカタログでの並び順。                                                |
| `aliases`                              | `string[]` | チャンネル選択用の追加検索エイリアス。                                        |
| `preferOver`                           | `string[]` | このチャンネルが優先されるべき、低優先度の Plugin/チャンネル ID。             |
| `systemImage`                          | `string`   | チャンネル UI カタログ向けの任意のアイコン/システム画像名。                   |
| `selectionDocsPrefix`                  | `string`   | 選択画面でドキュメントリンクの前に表示するプレフィックステキスト。            |
| `selectionDocsOmitLabel`               | `boolean`  | 選択コピーで、ラベル付きドキュメントリンクではなくドキュメントパスを直接表示します。 |
| `selectionExtras`                      | `string[]` | 選択コピーに追加される短い文字列。                                            |
| `markdownCapable`                      | `boolean`  | 送信時のフォーマット判断のために、そのチャンネルが Markdown 対応であることを示します。 |
| `exposure`                             | `object`   | セットアップ、設定済みリスト、ドキュメント画面でのチャンネル表示制御。        |
| `quickstartAllowFrom`                  | `boolean`  | このチャンネルを標準のクイックスタート `allowFrom` セットアップフローに参加させます。 |
| `forceAccountBinding`                  | `boolean`  | アカウントが 1 つだけ存在する場合でも、明示的なアカウント紐付けを要求します。 |
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

- `configured`: 設定済み/ステータス風のリスト画面にチャンネルを含める
- `setup`: インタラクティブなセットアップ/設定ピッカーにチャンネルを含める
- `docs`: ドキュメント/ナビゲーション画面でチャンネルを公開向けとしてマークする

<Note>
`showConfigured` と `showInSetup` はレガシーエイリアスとして引き続きサポートされます。`exposure` を推奨します。
</Note>

### `openclaw.install`

`openclaw.install` はパッケージメタデータであり、マニフェストメタデータではありません。

| フィールド                   | 型                   | 意味                                                                              |
| ---------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | インストール/更新フロー向けの正規 npm spec。                                      |
| `localPath`                  | `string`             | ローカル開発または同梱インストールのパス。                                        |
| `defaultChoice`              | `"npm"` \| `"local"` | 両方が利用可能な場合の優先インストール元。                                        |
| `minHostVersion`             | `string`             | `>=x.y.z` または `>=x.y.z-prerelease` 形式の、サポートされる最小 OpenClaw バージョン。 |
| `expectedIntegrity`          | `string`             | 固定インストール向けの期待される npm 配布 integrity 文字列。通常は `sha512-...`。 |
| `allowInvalidConfigRecovery` | `boolean`            | 同梱 Plugin の再インストールフローで、特定の古い設定エラーからの復旧を許可します。 |

<AccordionGroup>
  <Accordion title="Onboarding behavior">
    インタラクティブなオンボーディングも、オンデマンドインストール画面で `openclaw.install` を使用します。Plugin が、ランタイム読み込み前にプロバイダー認証の選択肢またはチャンネルのセットアップ/カタログメタデータを公開している場合、オンボーディングはその選択肢を表示し、npm とローカルインストールのどちらにするかを確認し、Plugin をインストールまたは有効化してから、選択されたフローを続行できます。npm オンボーディングの選択肢には、レジストリ `npmSpec` を含む信頼済みカタログメタデータが必要です。正確なバージョンと `expectedIntegrity` は任意の固定値です。`expectedIntegrity` が存在する場合、インストール/更新フローはそれを強制します。「何を表示するか」のメタデータは `openclaw.plugin.json` に置き、「どうインストールするか」のメタデータは `package.json` に置いてください。
  </Accordion>
  <Accordion title="minHostVersion enforcement">
    `minHostVersion` が設定されている場合、インストールと非同梱マニフェストレジストリの読み込みの両方でそれが強制されます。古いホストは外部 Plugin をスキップします。不正なバージョン文字列は拒否されます。同梱ソース Plugin は、ホストのチェックアウトと同じバージョンであると見なされます。
  </Accordion>
  <Accordion title="Pinned npm installs">
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
  <Accordion title="allowInvalidConfigRecovery scope">
    `allowInvalidConfigRecovery` は壊れた設定に対する汎用的なバイパスではありません。これは狭い範囲の同梱 Plugin 復旧専用であり、再インストール/セットアップが、同梱 Plugin パスの欠落や同じ Plugin の古い `channels.<id>` エントリのような既知のアップグレード残骸を修復できるようにするものです。無関係な理由で設定が壊れている場合、インストールは引き続き閉じた状態で失敗し、オペレーターに `openclaw doctor --fix` の実行を伝えます。
  </Accordion>
</AccordionGroup>

### 遅延フルロード

チャンネル Plugin は次のように遅延読み込みを有効化できます:

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

有効にすると、OpenClaw は、すでに設定済みのチャンネルであっても、listen 前の起動フェーズでは `setupEntry` だけを読み込みます。完全なエントリは Gateway が listen を開始した後に読み込まれます。

<Warning>
`setupEntry` が、Gateway が listen を開始する前に必要なすべて（チャンネル登録、HTTP ルート、Gateway メソッド）を登録する場合にのみ、遅延読み込みを有効化してください。完全なエントリが必須の起動機能を所有している場合は、デフォルトの動作のままにしてください。
</Warning>

セットアップ/完全エントリが Gateway RPC メソッドを登録する場合は、Plugin 固有のプレフィックス上に保ってください。予約済みのコア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）はコア所有のままであり、常に `operator.admin` に解決されます。

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

完全なスキーマリファレンスについては、[Plugin manifest](/ja-JP/plugins/manifest) を参照してください。

## ClawHub での公開

Plugin パッケージには、パッケージ固有の ClawHub コマンドを使用します:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
レガシーの Skills 専用公開エイリアスは Skills 用です。Plugin パッケージでは常に `clawhub package publish` を使用してください。
</Note>

## セットアップエントリ

`setup-entry.ts` ファイルは `index.ts` の軽量な代替で、OpenClaw が設定サーフェス（オンボーディング、設定修復、無効化されたチャネルの検査）のみを必要とする場合に読み込みます。

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

これにより、設定フロー中に重いランタイムコード（暗号化ライブラリ、CLI 登録、バックグラウンドサービス）を読み込まずに済みます。

セットアップに安全なエクスポートをサイドカーモジュールに保持するバンドル済みワークスペースチャネルは、`defineSetupPluginEntry(...)` の代わりに `openclaw/plugin-sdk/channel-entry-contract` の `defineBundledChannelSetupEntry(...)` を使用できます。そのバンドル済みコントラクトは任意の `runtime` エクスポートもサポートしているため、セットアップ時のランタイム配線を軽量かつ明示的に保てます。

<AccordionGroup>
  <Accordion title="OpenClaw が完全なエントリの代わりに setupEntry を使用する場合">
    - チャネルは無効化されているが、設定/オンボーディングサーフェスが必要な場合。
    - チャネルは有効化されているが、未設定の場合。
    - 遅延読み込みが有効な場合（`deferConfiguredChannelFullLoadUntilAfterListen`）。

  </Accordion>
  <Accordion title="setupEntry が登録する必要があるもの">
    - チャネル Plugin オブジェクト（`defineSetupPluginEntry` 経由）。
    - Gateway の listen 前に必要な HTTP ルート。
    - 起動中に必要な Gateway メソッド。

    これらの起動時 Gateway メソッドでも、`config.*` や `update.*` などの予約済みコア管理名前空間は避ける必要があります。

  </Accordion>
  <Accordion title="setupEntry に含めるべきではないもの">
    - CLI 登録。
    - バックグラウンドサービス。
    - 重いランタイムインポート（暗号化、SDK）。
    - 起動後にのみ必要な Gateway メソッド。

  </Accordion>
</AccordionGroup>

### 狭いセットアップヘルパーのインポート

ホットなセットアップ専用パスでは、セットアップサーフェスの一部だけが必要な場合、広範な `plugin-sdk/setup` アンブレラよりも狭いセットアップヘルパーのシームを優先してください。

| インポートパス                     | 用途                                                                                      | 主なエクスポート                                                                                                                                                                                                                                                                             |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | `setupEntry` / 遅延チャネル起動で利用可能なままにする、セットアップ時ランタイムヘルパー | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 環境対応のアカウントセットアップアダプター                                                | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | セットアップ/インストール CLI/アーカイブ/ドキュメントヘルパー                            | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                |

`moveSingleAccountChannelSectionToDefaultAccount(...)` などの設定パッチヘルパーを含む、共有セットアップツールボックス全体が必要な場合は、より広範な `plugin-sdk/setup` シームを使用してください。

セットアップパッチアダプターは、インポート時にもホットパスで安全なままです。バンドル済み単一アカウント昇格コントラクトサーフェスの検索は遅延されるため、`plugin-sdk/setup-runtime` をインポートしても、アダプターが実際に使用される前にバンドル済みコントラクトサーフェス検出を先行読み込みしません。

### チャネル所有の単一アカウント昇格

チャネルが単一アカウントのトップレベル設定から `channels.<id>.accounts.*` にアップグレードする場合、デフォルトの共有動作では、昇格されたアカウントスコープの値を `accounts.default` に移動します。

バンドル済みチャネルは、セットアップコントラクトサーフェスを通じて、その昇格を絞り込むか上書きできます。

- `singleAccountKeysToMove`: 昇格されたアカウントへ移動する追加のトップレベルキー
- `namedAccountPromotionKeys`: 名前付きアカウントがすでに存在する場合、これらのキーだけを昇格されたアカウントへ移動します。共有ポリシー/配信キーはチャネルルートに残ります
- `resolveSingleAccountPromotionTarget(...)`: 昇格された値を受け取る既存アカウントを選択します

<Note>
Matrix は現在のバンドル済み例です。名前付き Matrix アカウントがちょうど 1 つすでに存在する場合、または `defaultAccount` が `Ops` のような既存の非正規キーを指している場合、昇格は新しい `accounts.default` エントリを作成せず、そのアカウントを保持します。
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

サードパーティ Plugin では、コールドパスのコントラクトは引き続き Plugin マニフェストです。生成された JSON Schema を `openclaw.plugin.json#channelConfigs` に反映し、ランタイムコードを読み込まずに設定スキーマ、セットアップ、UI サーフェスが `channels.<id>` を検査できるようにしてください。

## セットアップウィザード

チャネル Plugin は、`openclaw onboard` 向けに対話型セットアップウィザードを提供できます。このウィザードは `ChannelPlugin` 上の `ChannelSetupWizard` オブジェクトです。

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

`ChannelSetupWizard` 型は `credentials`、`textInputs`、`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize` などをサポートしています。完全な例については、バンドル済み Plugin パッケージ（たとえば Discord Plugin の `src/channel.setup.ts`）を参照してください。

<AccordionGroup>
  <Accordion title="共有 allowFrom プロンプト">
    標準の `note -> prompt -> parse -> merge -> patch` フローだけが必要な DM 許可リストプロンプトでは、`openclaw/plugin-sdk/setup` の共有セットアップヘルパーを優先してください: `createPromptParsedAllowFromForAccount(...)`、`createTopLevelChannelParsedAllowFromPrompt(...)`、`createNestedChannelParsedAllowFromPrompt(...)`。
  </Accordion>
  <Accordion title="標準チャネルセットアップステータス">
    ラベル、スコア、任意の追加行だけが異なるチャネルセットアップステータスブロックでは、各 Plugin で同じ `status` オブジェクトを手作りする代わりに、`openclaw/plugin-sdk/setup` の `createStandardChannelSetupStatus(...)` を優先してください。
  </Accordion>
  <Accordion title="任意のチャネルセットアップサーフェス">
    特定のコンテキストでのみ表示すべき任意のセットアップサーフェスには、`openclaw/plugin-sdk/channel-setup` の `createOptionalChannelSetupSurface` を使用します。

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

    生成された任意アダプター/ウィザードは、実際の設定書き込みでは閉じた状態で失敗します。`validateInput`、`applyAccountConfig`、`finalize` の間で同じインストール必須メッセージを再利用し、`docsPath` が設定されている場合はドキュメントリンクを追加します。

  </Accordion>
  <Accordion title="バイナリに基づくセットアップヘルパー">
    バイナリに基づくセットアップ UI では、同じバイナリ/ステータスの接着コードを各チャネルへコピーする代わりに、共有の委譲ヘルパーを優先してください。

    - ラベル、ヒント、スコア、バイナリ検出だけが異なるステータスブロックには `createDetectedBinaryStatus(...)`
    - パスに基づくテキスト入力には `createCliPathTextInput(...)`
    - `setupEntry` が重い完全なウィザードへ遅延転送する必要がある場合は `createDelegatedSetupWizardStatusResolvers(...)`、`createDelegatedPrepare(...)`、`createDelegatedFinalize(...)`、`createDelegatedResolveConfigured(...)`
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

    OpenClaw は最初に ClawHub を試し、自動的に npm へフォールバックします。

  </Tab>
  <Tab title="ClawHub のみ">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm パッケージ仕様">
    パッケージがまだ ClawHub に移行していない場合、または移行中に直接 npm インストールパスが必要な場合は、npm を使用します。

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**リポジトリ内 Plugin:** バンドル済み Plugin ワークスペースツリーの下に配置すると、ビルド中に自動的に検出されます。

**ユーザーはインストールできます:**

```bash
openclaw plugins install <package-name>
```

<Info>
npm 由来のインストールでは、`openclaw plugins install` はライフサイクルスクリプトを無効にした状態で、パッケージを `~/.openclaw/npm` の下にインストールします。Plugin の依存関係ツリーは純粋な JS/TS に保ち、`postinstall` ビルドを必要とするパッケージは避けてください。
</Info>

<Note>
Gateway 起動時には Plugin 依存関係はインストールされません。npm/git/ClawHub のインストールフローが依存関係の収束を所有します。ローカル Plugin は依存関係がすでにインストールされている必要があります。
</Note>

バンドル済みパッケージのメタデータは明示的なものであり、Gateway 起動時にビルド済み JavaScript から推測されるものではありません。ランタイム依存関係は、それを所有する Plugin パッケージに含めるべきです。パッケージ化された OpenClaw の起動処理が Plugin の依存関係を修復したり複製したりすることはありません。

## 関連

- [Plugin の構築](/ja-JP/plugins/building-plugins) — 手順に沿ったはじめにガイド
- [Plugin マニフェスト](/ja-JP/plugins/manifest) — 完全なマニフェストスキーマリファレンス
- [SDK エントリポイント](/ja-JP/plugins/sdk-entrypoints) — `definePluginEntry` と `defineChannelPluginEntry`

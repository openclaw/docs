---
read_when:
    - Plugin にセットアップウィザードを追加しています
    - setup-entry.ts と index.ts の違いを理解する必要があります
    - Plugin の設定スキーマまたは package.json の openclaw メタデータを定義している場合
sidebarTitle: Setup and config
summary: セットアップウィザード、setup-entry.ts、設定スキーマ、package.json メタデータ
title: Plugin のセットアップと設定
x-i18n:
    generated_at: "2026-07-11T22:34:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b47e1f18a92871c442980168e302c82d7aa9a38b38bbbeed4add9dd6479365b
    source_path: plugins/sdk-setup.md
    workflow: 16
---

Plugin のパッケージング（`package.json` メタデータ）、マニフェスト（`openclaw.plugin.json`）、セットアップエントリ、設定スキーマのリファレンスです。

<Tip>
**手順を確認したい場合は？** ハウツーガイドでは、具体的な文脈に沿ってパッケージングを説明しています：[チャンネル Plugin](/ja-JP/plugins/sdk-channel-plugins#step-1-package-and-manifest)および[プロバイダー Plugin](/ja-JP/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
</Tip>

## パッケージメタデータ

`package.json` には、Plugin システムに Plugin が提供する機能を伝える `openclaw` フィールドが必要です：

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
ClawHub で外部公開するには、`compat` と `build` が必要です。正式な公開用スニペットは `docs/snippets/plugin-publish/` にあります。
</Note>

### `openclaw` のフィールド

<ParamField path="extensions" type="string[]">
  エントリポイントファイル（パッケージルートからの相対パス）。ワークスペースおよび git チェックアウトでの開発に有効なソースエントリです。
</ParamField>
<ParamField path="runtimeExtensions" type="string[]">
  `extensions` に対応するビルド済み JavaScript ファイル。OpenClaw がインストール済み npm パッケージを読み込む際に優先されます。ソースとビルド済みファイルの解決順序については、[SDK エントリポイント](/ja-JP/plugins/sdk-entrypoints)を参照してください。
</ParamField>
<ParamField path="setupEntry" type="string">
  セットアップ専用の軽量エントリ（任意）。
</ParamField>
<ParamField path="runtimeSetupEntry" type="string">
  `setupEntry` に対応するビルド済み JavaScript ファイル。`setupEntry` も設定する必要があります。
</ParamField>
<ParamField path="plugin" type="object">
  `{ id, label }` のフォールバック用 Plugin ID。Plugin に ID やラベルを導出できるチャンネル／プロバイダーメタデータがない場合に使用されます。
</ParamField>
<ParamField path="channel" type="object">
  セットアップ、選択画面、クイックスタート、ステータス画面用のチャンネルカタログメタデータ。
</ParamField>
<ParamField path="install" type="object">
  インストールヒント：`npmSpec`、`localPath`、`defaultChoice`、`minHostVersion`、`expectedIntegrity`、`allowInvalidConfigRecovery`、`requiredPlatformPackages`。
</ParamField>
<ParamField path="startup" type="object">
  起動時の動作フラグ。
</ParamField>
<ParamField path="compat" type="object">
  この Plugin がサポートする `pluginApi` のバージョン範囲。ClawHub で外部公開する場合は必須です。
</ParamField>

<Note>
プロバイダー ID（`providers: string[]`）はパッケージメタデータではなく、マニフェストメタデータです。ここではなく `openclaw.plugin.json` で宣言してください。詳しくは [Plugin マニフェスト](/ja-JP/plugins/manifest)を参照してください。
</Note>

### `openclaw.channel`

`openclaw.channel` は、ランタイムの読み込み前にチャンネルを検出し、セットアップ画面に表示するための軽量なパッケージメタデータです。

| フィールド                             | 型         | 意味                                                                          |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | 正規のチャンネル ID。                                                         |
| `label`                                | `string`   | メインチャンネルラベル。                                                      |
| `selectionLabel`                       | `string`   | `label` と異なる必要がある場合の、選択／セットアップ用ラベル。                |
| `detailLabel`                          | `string`   | より詳細なチャンネルカタログおよびステータス画面用の補助詳細ラベル。          |
| `docsPath`                             | `string`   | セットアップおよび選択リンク用のドキュメントパス。                            |
| `docsLabel`                            | `string`   | チャンネル ID と異なる必要がある場合にドキュメントリンクで使用する上書きラベル。 |
| `blurb`                                | `string`   | オンボーディング／カタログ用の短い説明。                                      |
| `order`                                | `number`   | チャンネルカタログでの並び順。                                                |
| `aliases`                              | `string[]` | チャンネル選択時に使用できる追加の検索エイリアス。                            |
| `preferOver`                           | `string[]` | このチャンネルより優先順位を低くする Plugin／チャンネル ID。                  |
| `systemImage`                          | `string`   | チャンネル UI カタログ用の任意のアイコン／システム画像名。                    |
| `selectionDocsPrefix`                  | `string`   | 選択画面でドキュメントリンクの前に表示するプレフィックステキスト。            |
| `selectionDocsOmitLabel`               | `boolean`  | 選択画面の文面でラベル付きドキュメントリンクの代わりに、ドキュメントパスを直接表示します。 |
| `selectionExtras`                      | `string[]` | 選択画面の文面に追加される短い文字列。                                        |
| `markdownCapable`                      | `boolean`  | 送信時の書式設定を決定するために、チャンネルが Markdown 対応であることを示します。 |
| `exposure`                             | `object`   | セットアップ、設定済み一覧、ドキュメント画面でのチャンネル表示制御。          |
| `quickstartAllowFrom`                  | `boolean`  | このチャンネルを標準クイックスタートの `allowFrom` セットアップフローに含めます。 |
| `forceAccountBinding`                  | `boolean`  | アカウントが 1 つしか存在しない場合でも、明示的なアカウントの関連付けを必須にします。 |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | このチャンネルの通知先を解決する際に、セッション検索を優先します。            |

例：

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

`exposure` は次の項目をサポートします：

- `configured`：設定済み一覧やステータス形式の一覧画面にチャンネルを含める
- `setup`：対話型セットアップ／設定の選択画面にチャンネルを含める
- `docs`：ドキュメント／ナビゲーション画面でチャンネルを一般公開対象として扱う

<Note>
`showConfigured` と `showInSetup` は、従来のエイリアスとして引き続きサポートされます。`exposure` を推奨します。
</Note>

### `openclaw.install`

`openclaw.install` はマニフェストメタデータではなく、パッケージメタデータです。

| フィールド                   | 型                                  | 意味                                                                                |
| ---------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------- |
| `clawhubSpec`                | `string`                            | インストール／更新およびオンボーディングのオンデマンドインストールフロー用の正規 ClawHub 仕様。 |
| `npmSpec`                    | `string`                            | インストール／更新のフォールバックフロー用の正規 npm 仕様。                        |
| `localPath`                  | `string`                            | ローカル開発または同梱インストール用のパス。                                        |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | 複数のソースを利用できる場合に優先するインストール元。                              |
| `minHostVersion`             | `string`                            | サポート対象となる OpenClaw の最小バージョン。`>=x.y.z` または `>=x.y.z-prerelease`。 |
| `expectedIntegrity`          | `string`                            | バージョン固定インストール用の想定 npm 配布物整合性文字列。通常は `sha512-...`。     |
| `allowInvalidConfigRecovery` | `boolean`                           | 特定の古い設定による障害から、同梱 Plugin の再インストールフローを復旧可能にします。 |
| `requiredPlatformPackages`   | `string[]`                          | npm インストール時に検証される、必須のプラットフォーム固有 npm エイリアス。          |

<AccordionGroup>
  <Accordion title="オンボーディングの動作">
    対話型オンボーディングは、オンデマンドインストール画面で `openclaw.install` を使用します。Plugin がランタイムの読み込み前にプロバイダー認証の選択肢やチャンネルのセットアップ／カタログメタデータを公開している場合、オンボーディングは ClawHub、npm、またはローカルインストールを案内し、Plugin をインストールまたは有効化してから、選択されたフローを続行できます。ClawHub の選択肢では `clawhubSpec` を使用し、存在する場合は優先されます。npm の選択肢には、レジストリの `npmSpec` を含む信頼済みカタログメタデータが必要です（正確なバージョンと `expectedIntegrity` は任意の固定値で、設定されている場合はインストール／更新時に適用されます）。「何を表示するか」は `openclaw.plugin.json` に、「どのようにインストールするか」は `package.json` に記述してください。
  </Accordion>
  <Accordion title="minHostVersion の適用">
    `minHostVersion` が設定されている場合、インストールと非同梱マニフェストレジストリの読み込みの両方で適用されます。古いホストでは外部 Plugin がスキップされ、無効なバージョン文字列は拒否されます。同梱ソース Plugin は、ホストのチェックアウトと同じバージョンであると見なされます。
  </Accordion>
  <Accordion title="バージョン固定 npm インストール">
    バージョン固定 npm インストールでは、`npmSpec` に正確なバージョンを保持し、想定する成果物の整合性を追加します：

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
    `allowInvalidConfigRecovery` は、壊れた設定全般を回避するための仕組みではありません。同梱 Plugin の復旧に限定されており、同梱 Plugin のパス欠落や、同じ Plugin に対する古い `channels.<id>` エントリなど、既知のアップグレード残存物を再インストール／セットアップで修復できるようにします。無関係な理由で設定が壊れている場合、インストールは引き続き安全側に失敗し、運用担当者に `openclaw doctor --fix` の実行を案内します。
  </Accordion>
</AccordionGroup>

### 完全読み込みの遅延

チャンネル Plugin は、次の設定で遅延読み込みを有効にできます：

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

有効にすると、設定済みチャンネルの場合でも、OpenClaw はリッスン開始前の起動フェーズでは `setupEntry` のみを読み込みます。完全なエントリは Gateway がリッスンを開始した後に読み込まれます。

<Warning>
遅延読み込みは、Gateway がリッスンを開始する前に必要なすべての要素（チャンネル登録、HTTP ルート、Gateway メソッド）を `setupEntry` が登録する場合にのみ有効にしてください。必要な起動機能を完全なエントリが担っている場合は、デフォルトの動作を維持してください。
</Warning>

セットアップ／完全エントリが Gateway RPC メソッドを登録する場合は、Plugin 固有のプレフィックスを使用してください。予約済みのコア管理名前空間（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）は引き続きコアが所有し、常に `operator.admin` に正規化されます。

## Plugin マニフェスト

すべてのネイティブプラグインは、パッケージルートに `openclaw.plugin.json` を含めて配布する必要があります。OpenClaw はこれを使用して、プラグインコードを実行せずに設定を検証します。

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

チャンネルプラグインでは `channels` を追加します（プロバイダープラグインでは `providers` を追加します）。

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

設定を持たないプラグインでも、スキーマを含めて配布する必要があります。空のスキーマも有効です。

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

完全なスキーマリファレンスについては、[プラグインマニフェスト](/ja-JP/plugins/manifest)を参照してください。

## ClawHub への公開

Skills とプラグインパッケージでは、それぞれ異なる ClawHub 公開コマンドを使用します。プラグインパッケージには、パッケージ専用のコマンドを使用してください。

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
`clawhub skill publish <path>` は Skills フォルダーを公開するための別のコマンドであり、プラグインパッケージ用ではありません。[ClawHub での公開](/ja-JP/clawhub/publishing)を参照してください。
</Note>

## セットアップエントリ

`setup-entry.ts` は、OpenClaw がセットアップ用の機能（オンボーディング、設定修復、無効化されたチャンネルの検査）のみを必要とするときに読み込む、`index.ts` の軽量な代替です。

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

これにより、セットアップフロー中に重いランタイムコード（暗号化ライブラリ、CLI 登録、バックグラウンドサービス）が読み込まれるのを防げます。

セットアップに安全なエクスポートをサイドカーモジュールに保持するバンドル済みワークスペースチャンネルでは、`defineSetupPluginEntry(...)` の代わりに `openclaw/plugin-sdk/channel-entry-contract` の `defineBundledChannelSetupEntry(...)` を使用できます。このバンドル済みコントラクトは、オプションの `runtime` エクスポートにも対応しているため、セットアップ時のランタイム接続を軽量かつ明示的に保てます。

<AccordionGroup>
  <Accordion title="When OpenClaw uses setupEntry instead of the full entry">
    - チャンネルは無効ですが、セットアップまたはオンボーディング用の機能が必要です。
    - チャンネルは有効ですが、未設定です。
    - 遅延読み込みが有効です（`deferConfiguredChannelFullLoadUntilAfterListen`）。

  </Accordion>
  <Accordion title="What setupEntry must register">
    - チャンネルプラグインオブジェクト（`defineSetupPluginEntry` 経由）。
    - Gateway のリッスン開始前に必要な HTTP ルート。
    - 起動中に必要な Gateway メソッド。

    これらの起動時 Gateway メソッドでも、`config.*` や `update.*` など、予約済みのコア管理名前空間は避ける必要があります。

  </Accordion>
  <Accordion title="What setupEntry should NOT include">
    - CLI 登録。
    - バックグラウンドサービス。
    - 重いランタイムインポート（暗号化、SDK）。
    - 起動後にのみ必要な Gateway メソッド。

  </Accordion>
</AccordionGroup>

### 限定的なセットアップヘルパーのインポート

頻繁に実行されるセットアップ専用パスでは、セットアップ機能の一部のみが必要な場合、広範な `plugin-sdk/setup` アンブレラよりも限定的なセットアップヘルパーの境界を優先してください。

| インポートパス                     | 用途                                                                                       | 主なエクスポート                                                                                                                                                                                                                                                                                                      |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | `setupEntry`／チャンネルの遅延起動でも使用できる、セットアップ時のランタイムヘルパー          | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 非推奨の互換性エイリアス。`plugin-sdk/setup-runtime` を使用してください                     | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | セットアップ／インストール用の CLI、アーカイブ、ドキュメントヘルパー                        | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

`moveSingleAccountChannelSectionToDefaultAccount(...)` などの設定パッチヘルパーを含む、共有セットアップツール一式が必要な場合は、より広範な `plugin-sdk/setup` の境界を使用してください。

固定されたセットアップウィザード文言には `createSetupTranslator(...)` を使用してください。これは CLI ウィザードのロケール（`OPENCLAW_LOCALE`、次にシステムロケール変数）に従い、英語へフォールバックします。プラグイン固有のセットアップ文言はプラグイン所有のコードに保持し、共有カタログキーは共通のセットアップラベル、ステータステキスト、公式バンドルプラグインのセットアップ文言にのみ使用してください。

セットアップパッチアダプターは、インポート時にもホットパスで安全です。バンドル済みの単一アカウント昇格コントラクトサーフェスの検索は遅延実行されるため、`plugin-sdk/setup-runtime` をインポートしても、アダプターが実際に使用される前にバンドル済みコントラクトサーフェスの検出が先行して読み込まれることはありません。

### チャンネル所有の単一アカウント昇格

チャンネルが単一アカウントのトップレベル設定から `channels.<id>.accounts.*` へアップグレードされる場合、デフォルトの共有動作では、昇格されたアカウントスコープの値が `accounts.default` に移動されます。

バンドル済みチャンネルでは、セットアップコントラクトサーフェスを通じて、この昇格を限定または上書きできます。

- `singleAccountKeysToMove`: 昇格されたアカウントへ移動する追加のトップレベルキー
- `namedAccountPromotionKeys`: 名前付きアカウントがすでに存在する場合、昇格されたアカウントへ移動するキーをこれらのみに限定します。共有ポリシー／配信キーはチャンネルルートに残ります
- `resolveSingleAccountPromotionTarget(...)`: 昇格された値を受け取る既存アカウントを選択します

<Note>
現在のバンドル例は Matrix です。名前付き Matrix アカウントがちょうど1つすでに存在する場合、または `defaultAccount` が `Ops` のような既存の非正規キーを指している場合、昇格では新しい `accounts.default` エントリを作成せず、そのアカウントを維持します。
</Note>

## 設定スキーマ

プラグイン設定は、マニフェスト内の JSON Schema に対して検証されます。ユーザーは次のようにプラグインを設定します。

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

プラグインは登録時に、この設定を `api.pluginConfig` として受け取ります。

チャンネル固有の設定には、代わりにチャンネル設定セクションを使用してください。

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

### チャンネル設定スキーマの構築

`buildChannelConfigSchema` を使用して、Zod スキーマを、プラグイン所有の設定アーティファクトで使用される `ChannelConfigSchema` ラッパーへ変換します。

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

コントラクトをすでに JSON Schema または TypeBox で記述している場合は、OpenClaw がメタデータパスで Zod から JSON Schema への変換を省略できるよう、直接ヘルパーを使用してください。

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

サードパーティ製プラグインでも、コールドパスのコントラクトは引き続きプラグインマニフェストです。生成された JSON Schema を `openclaw.plugin.json#channelConfigs` に反映し、設定スキーマ、セットアップ、UI の各機能が、ランタイムコードを読み込まずに `channels.<id>` を検査できるようにしてください。

## セットアップウィザード

チャンネルプラグインは、`openclaw onboard` 用の対話型セットアップウィザードを提供できます。ウィザードは `ChannelPlugin` 上の `ChannelSetupWizard` オブジェクトです。

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

`ChannelSetupWizard` は `textInputs`、`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize` などにも対応しています。完全なバンドル例については、Discord プラグインの `src/setup-core.ts` を参照してください。

<AccordionGroup>
  <Accordion title="Shared allowFrom prompts">
    標準の `note -> prompt -> parse -> merge -> patch` フローだけを必要とする DM 許可リストのプロンプトには、`openclaw/plugin-sdk/setup` の共有セットアップヘルパーである `createPromptParsedAllowFromForAccount(...)`、`createTopLevelChannelParsedAllowFromPrompt(...)`、`createNestedChannelParsedAllowFromPrompt(...)` を優先してください。
  </Accordion>
  <Accordion title="Standard channel setup status">
    ラベル、スコア、オプションの追加行のみが異なるチャンネルセットアップステータスブロックには、各プラグインで同じ `status` オブジェクトを独自実装する代わりに、`openclaw/plugin-sdk/setup` の `createStandardChannelSetupStatus(...)` を優先してください。
  </Accordion>
  <Accordion title="Optional channel setup surface">
    特定のコンテキストでのみ表示するオプションのセットアップ機能には、`openclaw/plugin-sdk/channel-setup` の `createOptionalChannelSetupSurface` を使用してください。

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

    `plugin-sdk/channel-setup` は、このオプションインストール機能の片方だけが必要な場合に使用できる、より低レベルの `createOptionalChannelSetupAdapter(...)` および `createOptionalChannelSetupWizard(...)` ビルダーも公開しています。

    生成されたオプションのアダプター/ウィザードは、実際の設定書き込み時にフェイルクローズします。`validateInput`、`applyAccountConfig`、`finalize` で同じインストール必須メッセージを再利用し、`docsPath` が設定されている場合はドキュメントへのリンクを追加します。

  </Accordion>
  <Accordion title="バイナリを利用するセットアップヘルパー">
    バイナリを利用するセットアップ UI では、同じバイナリ/ステータス連携処理を各チャンネルにコピーするのではなく、共有の委譲ヘルパーを使用してください。

    - ラベル、ヒント、スコア、バイナリ検出のみが異なるステータスブロックには `createDetectedBinaryStatus(...)`
    - パスを扱うテキスト入力には `createCliPathTextInput(...)`
    - `setupEntry` がより高機能な完全版ウィザードへ遅延転送する必要がある場合は、`createDelegatedSetupWizardStatusResolvers(...)`、`createDelegatedPrepare(...)`、`createDelegatedFinalize(...)`、`createDelegatedResolveConfigured(...)`
    - `setupEntry` が `textInputs[*].shouldPrompt` の判定のみを委譲する必要がある場合は、`createDelegatedTextInputShouldPrompt(...)`

  </Accordion>
</AccordionGroup>

## 公開とインストール

**外部 Plugin:** [ClawHub](/ja-JP/clawhub) に公開してから、インストールします。

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    裸のパッケージ指定は起動切り替え時に npm からインストールされます。ただし、名前が同梱または公式の Plugin ID と一致する場合、OpenClaw は代わりにそのローカル/公式コピーを使用します。ソースを確定的に選択するには、`clawhub:`、`npm:`、`git:`、`npm-pack:` を使用してください。詳しくは [Plugin の管理](/ja-JP/plugins/manage-plugins) を参照してください。

  </Tab>
  <Tab title="ClawHub のみ">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm パッケージ指定">
    パッケージがまだ ClawHub に移行していない場合、または移行中に
    npm の直接インストールパスが必要な場合は、npm を使用します。

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**リポジトリ内 Plugin:** 同梱 Plugin のワークスペースツリー配下に配置します。ビルド時に自動検出されます。

<Info>
npm をソースとするインストールでは、`openclaw plugins install` はライフサイクルスクリプトを無効化した状態（`--ignore-scripts`）で、パッケージを `~/.openclaw/npm/projects` 配下の Plugin ごとのプロジェクトにインストールします。Plugin の依存関係ツリーは純粋な JS/TS に保ち、`postinstall` ビルドを必要とするパッケージは避けてください。
</Info>

<Note>
Gateway の起動時には Plugin の依存関係をインストールしません。npm/git/ClawHub のインストールフローが依存関係の収束を担います。ローカル Plugin は、依存関係が事前にインストールされている必要があります。
</Note>

同梱パッケージのメタデータは明示的に定義され、Gateway 起動時にビルド済み JavaScript から推論されることはありません。ランタイム依存関係は、それを所有する Plugin パッケージに含めます。パッケージ版 OpenClaw の起動処理が Plugin の依存関係を修復または複製することはありません。

## 関連項目

- [Plugin の構築](/ja-JP/plugins/building-plugins) — ステップ形式のはじめにガイド
- [Plugin マニフェスト](/ja-JP/plugins/manifest) — 完全なマニフェストスキーマのリファレンス
- [SDK エントリポイント](/ja-JP/plugins/sdk-entrypoints) — `definePluginEntry` と `defineChannelPluginEntry`

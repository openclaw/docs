---
read_when:
    - OpenClaw Pluginを構築しています
    - Plugin の設定スキーマをリリースする、または Plugin の検証エラーをデバッグする必要がある
summary: Plugin マニフェスト + JSON スキーマ要件（厳格な設定検証）
title: Plugin マニフェスト
x-i18n:
    generated_at: "2026-05-10T19:44:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 27129a118083d41fc631282cbef37b1b8e36c31343026bd9def5d521ff7fddef
    source_path: plugins/manifest.md
    workflow: 16
---

このページは**ネイティブ OpenClaw Plugin マニフェスト**専用です。

互換バンドルレイアウトについては、[Plugin バンドル](/ja-JP/plugins/bundles)を参照してください。

互換バンドル形式は異なるマニフェストファイルを使用します。

- Codex バンドル: `.codex-plugin/plugin.json`
- Claude バンドル: `.claude-plugin/plugin.json`、またはマニフェストなしのデフォルト Claude コンポーネント
  レイアウト
- Cursor バンドル: `.cursor-plugin/plugin.json`

OpenClaw はこれらのバンドルレイアウトも自動検出しますが、ここで説明する `openclaw.plugin.json` スキーマに対しては検証されません。

互換バンドルについて、OpenClaw は現在、レイアウトが OpenClaw ランタイムの期待に一致する場合に、バンドルメタデータ、宣言された Skills ルート、Claude コマンドルート、Claude バンドル `settings.json` のデフォルト、Claude バンドル LSP のデフォルト、サポートされるフックパックを読み取ります。

すべてのネイティブ OpenClaw Plugin は、**Plugin ルート**に `openclaw.plugin.json` ファイルを含める**必要があります**。OpenClaw はこのマニフェストを使用して、**Plugin コードを実行せずに**設定を検証します。マニフェストがない、または無効な場合は Plugin エラーとして扱われ、設定検証がブロックされます。

完全な Plugin システムガイドを参照してください: [Plugins](/ja-JP/tools/plugin)。
ネイティブ capability モデルと現在の外部互換性ガイダンスについては、次を参照してください:
[Capability モデル](/ja-JP/plugins/architecture#public-capability-model)。

## このファイルの役割

`openclaw.plugin.json` は、OpenClaw が**Plugin コードを読み込む前に**読み取るメタデータです。以下のすべては、Plugin ランタイムを起動せずに検査できる程度に軽量である必要があります。

**用途:**

- Plugin の識別情報、設定検証、設定 UI ヒント
- 認証、オンボーディング、セットアップメタデータ（エイリアス、自動有効化、プロバイダー環境変数、認証選択肢）
- コントロールプレーンのサーフェス向けの有効化ヒント
- モデルファミリー所有権の短縮表記
- 静的な capability 所有権スナップショット（`contracts`）
- 共有 `openclaw qa` ホストが検査できる QA ランナーメタデータ
- カタログと検証サーフェスにマージされる、チャネル固有の設定メタデータ

**用途外:** ランタイム動作の登録、コードエントリポイントの宣言、npm インストールメタデータ。これらは Plugin コードと `package.json` に属します。

## 最小例

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

## 詳細な例

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "OpenRouter provider plugin",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "modelIdNormalization": {
    "providers": {
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  },
  "providerEndpoints": [
    {
      "endpointClass": "openrouter",
      "hostSuffixes": ["openrouter.ai"]
    }
  ],
  "providerRequest": {
    "providers": {
      "openrouter": {
        "family": "openrouter"
      }
    }
  },
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "providerAuthAliases": {
    "openrouter-coding": "openrouter"
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

## トップレベルフィールドリファレンス

| フィールド                           | 必須     | 型                               | 意味                                                                                                                                                                                                                                |
| ------------------------------------ | -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | はい     | `string`                         | 正規のPlugin id。これは `plugins.entries.<id>` で使用される id です。                                                                                                                                                              |
| `configSchema`                       | はい     | `object`                         | このPluginの設定用のインライン JSON Schema。                                                                                                                                                                                       |
| `enabledByDefault`                   | いいえ   | `true`                           | バンドルされたPluginをデフォルトで有効にすることを示します。省略するか、`true` 以外の値を設定すると、Pluginはデフォルトで無効のままになります。                                                                                    |
| `enabledByDefaultOnPlatforms`        | いいえ   | `string[]`                       | 指定された Node.js プラットフォーム上でのみ、バンドルされたPluginをデフォルトで有効にすることを示します。例: `["darwin"]`。明示的な設定が引き続き優先されます。                                                                    |
| `legacyPluginIds`                    | いいえ   | `string[]`                       | この正規Plugin idに正規化されるレガシー id。                                                                                                                                                                                       |
| `autoEnableWhenConfiguredProviders`  | いいえ   | `string[]`                       | 認証、設定、またはモデル参照で言及されたときに、このPluginを自動的に有効にするProvider id。                                                                                                                                        |
| `kind`                               | いいえ   | `"memory"` \| `"context-engine"` | `plugins.slots.*` で使用される排他的なPlugin種別を宣言します。                                                                                                                                                                     |
| `channels`                           | いいえ   | `string[]`                       | このPluginが所有するChannel id。検出と設定検証に使用されます。                                                                                                                                                                     |
| `providers`                          | いいえ   | `string[]`                       | このPluginが所有するProvider id。                                                                                                                                                                                                  |
| `providerCatalogEntry`               | いいえ   | `string`                         | Pluginルートからの相対パスで指定する軽量なProviderカタログモジュールパス。完全なPluginランタイムを有効化せずに読み込める、マニフェストスコープのProviderカタログメタデータ用です。                                                 |
| `modelSupport`                       | いいえ   | `object`                         | ランタイム前にPluginを自動読み込みするために使用される、マニフェスト所有の簡略モデルファミリーメタデータ。                                                                                                                        |
| `modelCatalog`                       | いいえ   | `object`                         | このPluginが所有するProvider向けの宣言的なモデルカタログメタデータ。Pluginランタイムを読み込まずに、将来の読み取り専用一覧、オンボーディング、モデルピッカー、エイリアス、抑制を行うためのコントロールプレーン契約です。         |
| `modelPricing`                       | いいえ   | `object`                         | Provider所有の外部価格検索ポリシー。ローカル/セルフホストProviderをリモート価格カタログから除外したり、coreでProvider idをハードコードせずにProvider参照をOpenRouter/LiteLLMカタログ idへマッピングしたりするために使用します。 |
| `modelIdNormalization`               | いいえ   | `object`                         | Providerランタイムの読み込み前に実行する必要がある、Provider所有のモデル id エイリアス/プレフィックスのクリーンアップ。                                                                                                           |
| `providerEndpoints`                  | いいえ   | `object[]`                       | Providerランタイムの読み込み前にcoreが分類する必要があるProviderルート向けの、マニフェスト所有のエンドポイント host/baseUrl メタデータ。                                                                                          |
| `providerRequest`                    | いいえ   | `object`                         | Providerランタイムの読み込み前に汎用リクエストポリシーで使用される、軽量なProviderファミリーおよびリクエスト互換性メタデータ。                                                                                                    |
| `cliBackends`                        | いいえ   | `string[]`                       | このPluginが所有する CLI 推論バックエンド id。明示的な設定参照からの起動時自動有効化に使用されます。                                                                                                                              |
| `syntheticAuthRefs`                  | いいえ   | `string[]`                       | ランタイム読み込み前のコールドモデル検出中に、Plugin所有の合成認証フックをプローブする必要があるProviderまたは CLI バックエンド参照。                                                                                             |
| `nonSecretAuthMarkers`               | いいえ   | `string[]`                       | 非シークレットのローカル、OAuth、または環境認証情報の状態を表す、バンドルPlugin所有のプレースホルダー API キー値。                                                                                                                |
| `commandAliases`                     | いいえ   | `object[]`                       | ランタイム読み込み前にPlugin対応の設定および CLI 診断を生成する必要がある、このPluginが所有するコマンド名。                                                                                                                       |
| `providerAuthEnvVars`                | いいえ   | `Record<string, string[]>`       | Provider認証/ステータス検索用の非推奨の互換性 env メタデータ。新しいPluginでは `setup.providers[].envVars` を推奨します。OpenClawは非推奨期間中もこれを読み取ります。                                                              |
| `providerAuthAliases`                | いいえ   | `Record<string, string>`         | 認証検索で別のProvider idを再利用する必要があるProvider id。例: ベースProviderの API キーと認証プロファイルを共有するコーディングProvider。                                                                                        |
| `channelEnvVars`                     | いいえ   | `Record<string, string[]>`       | OpenClawがPluginコードを読み込まずに検査できる軽量なChannel env メタデータ。汎用の起動/設定ヘルパーから見える必要がある、env駆動のChannelセットアップまたは認証サーフェスに使用します。                                           |
| `providerAuthChoices`                | いいえ   | `object[]`                       | オンボーディングのピッカー、優先Provider解決、単純な CLI フラグ配線のための軽量な認証選択肢メタデータ。                                                                                                                           |
| `activation`                         | いいえ   | `object`                         | 起動、Provider、コマンド、Channel、ルート、Capabilityトリガーの読み込み向けの軽量な有効化プランナーメタデータ。メタデータのみであり、実際の動作は引き続きPluginランタイムが所有します。                                           |
| `setup`                              | いいえ   | `object`                         | 検出およびセットアップサーフェスがPluginランタイムを読み込まずに検査できる、軽量なセットアップ/オンボーディング記述子。                                                                                                          |
| `qaRunners`                          | いいえ   | `object[]`                       | Pluginランタイムの読み込み前に共有 `openclaw qa` ホストで使用される、軽量な QA ランナー記述子。                                                                                                                                    |
| `contracts`                          | いいえ   | `object`                         | 外部認証フック、音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像生成、音楽生成、動画生成、web取得、web検索、ツール所有権の静的Capability所有権スナップショット。                                               |
| `mediaUnderstandingProviderMetadata` | いいえ   | `Record<string, object>`         | `contracts.mediaUnderstandingProviders` で宣言されたProvider id向けの軽量なメディア理解デフォルト。                                                                                                                                |
| `imageGenerationProviderMetadata`    | いいえ   | `Record<string, object>`         | `contracts.imageGenerationProviders` で宣言されたProvider id向けの軽量な画像生成認証メタデータ。Provider所有の認証エイリアスと base-url ガードを含みます。                                                                         |
| `videoGenerationProviderMetadata`    | いいえ   | `Record<string, object>`         | `contracts.videoGenerationProviders` で宣言されたProvider id向けの軽量な動画生成認証メタデータ。Provider所有の認証エイリアスと base-url ガードを含みます。                                                                         |
| `musicGenerationProviderMetadata`    | いいえ   | `Record<string, object>`         | `contracts.musicGenerationProviders` で宣言されたProvider id向けの軽量な音楽生成認証メタデータ。Provider所有の認証エイリアスと base-url ガードを含みます。                                                                         |
| `toolMetadata`                       | いいえ   | `Record<string, object>`         | `contracts.tools` で宣言されたPlugin所有ツール向けの軽量な可用性メタデータ。設定、env、または認証の証拠が存在しない限り、ツールがランタイムを読み込むべきでない場合に使用します。                                                |
| `channelConfigs`                     | いいえ   | `Record<string, object>`         | ランタイム読み込み前に検出および検証サーフェスへマージされる、マニフェスト所有のChannel設定メタデータ。                                                                                                                           |
| `skills`                             | いいえ   | `string[]`                       | Pluginルートからの相対パスで指定する、読み込むSkillディレクトリ。                                                                                                                                                                  |
| `name`                               | いいえ   | `string`                         | 人間が読めるPlugin名。                                                                                                                                                                                                         |
| `description`                        | いいえ   | `string`                         | Pluginサーフェスに表示される短い概要。                                                                                                                                                                                             |
| `version`                            | いいえ   | `string`                         | 情報提供用のPluginバージョン。                                                                                                                                                                                                       |
| `uiHints`                            | いいえ   | `Record<string, object>`         | 設定フィールドのUIラベル、プレースホルダー、機微性に関するヒント。                                                                                                                                                                   |

## 生成プロバイダーメタデータリファレンス

生成プロバイダーメタデータフィールドは、対応する `contracts.*GenerationProviders` リストで宣言されたプロバイダーの静的な認証シグナルを記述します。
OpenClaw はプロバイダーランタイムが読み込まれる前にこれらのフィールドを読み取るため、コアツールはすべてのプロバイダーPluginをインポートせずに、生成プロバイダーが利用可能かどうかを判断できます。

これらのフィールドは、安価で宣言的な事実にのみ使用してください。トランスポート、リクエスト変換、トークン更新、認証情報の検証、実際の生成動作はPluginランタイムに置きます。

```json
{
  "contracts": {
    "imageGenerationProviders": ["example-image"]
  },
  "imageGenerationProviderMetadata": {
    "example-image": {
      "aliases": ["example-image-oauth"],
      "authProviders": ["example-image"],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example-image.config",
          "overlayPath": "image",
          "mode": {
            "path": "mode",
            "default": "local",
            "allowed": ["local"]
          },
          "requiredAny": ["workflow", "workflowPath"],
          "required": ["promptNodeId"]
        }
      ],
      "authSignals": [
        {
          "provider": "example-image"
        },
        {
          "provider": "example-image-oauth",
          "providerBaseUrl": {
            "provider": "example-image",
            "defaultBaseUrl": "https://api.example.com/v1",
            "allowedBaseUrls": ["https://api.example.com/v1"]
          }
        }
      ]
    }
  }
}
```

各メタデータエントリーは次をサポートします。

| フィールド      | 必須     | 型         | 意味                                                                                                                       |
| --------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | いいえ   | `string[]` | 生成プロバイダーの静的な認証エイリアスとして扱う追加のプロバイダーID。                                       |
| `authProviders` | いいえ   | `string[]` | この生成プロバイダーの認証として扱う、設定済み認証プロファイルを持つプロバイダーID。                                      |
| `configSignals` | いいえ   | `object[]` | 認証プロファイルや環境変数なしで設定できる、ローカルまたはセルフホストプロバイダー向けの安価な設定のみの可用性シグナル。 |
| `authSignals`   | いいえ   | `object[]` | 明示的な認証シグナル。存在する場合、プロバイダーID、`aliases`、`authProviders` から作られるデフォルトのシグナルセットを置き換えます。     |

各 `configSignals` エントリーは次をサポートします。

| フィールド    | 必須     | 型         | 意味                                                                                                                                                                           |
| ------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | はい     | `string`   | 検査するPlugin所有の設定オブジェクトへのドットパス。例: `plugins.entries.example.config`。                                                                                    |
| `overlayPath` | いいえ   | `string`   | シグナルを評価する前にルートオブジェクトへ重ねるべき、ルート設定内のオブジェクトへのドットパス。`image`、`video`、`music` などの機能固有の設定に使用します。 |
| `required`    | いいえ   | `string[]` | 有効な設定内で、設定済みの値を持つ必要があるドットパス。文字列は空であってはならず、オブジェクトと配列も空であってはなりません。                                                |
| `requiredAny` | いいえ   | `string[]` | 有効な設定内で、少なくとも1つが設定済みの値を持つ必要があるドットパス。                                                                                                  |
| `mode`        | いいえ   | `object`   | 有効な設定内の任意の文字列モードガード。設定のみの可用性が1つのモードにのみ適用される場合に使用します。                                                                |

各 `mode` ガードは次をサポートします。

| フィールド     | 必須     | 型         | 意味                                                                      |
| ------------ | -------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | いいえ   | `string`   | 有効な設定内のドットパス。デフォルトは `mode`。                          |
| `default`    | いいえ   | `string`   | 設定でそのパスが省略された場合に使用するモード値。                                  |
| `allowed`    | いいえ   | `string[]` | 存在する場合、有効なモードがこれらの値のいずれかである場合にのみシグナルが通過します。 |
| `disallowed` | いいえ   | `string[]` | 存在する場合、有効なモードがこれらの値のいずれかである場合にシグナルは失敗します。       |

各 `authSignals` エントリーは次をサポートします。

| フィールド        | 必須     | 型       | 意味                                                                                                                                                                 |
| ----------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | はい     | `string` | 設定済み認証プロファイル内で確認するプロバイダーID。                                                                                                                             |
| `providerBaseUrl` | いいえ   | `object` | 参照される設定済みプロバイダーが許可されたベースURLを使用する場合にのみシグナルを有効にする任意のガード。認証エイリアスが特定のAPIに対してのみ有効な場合に使用します。 |

各 `providerBaseUrl` ガードは次をサポートします。

| フィールド        | 必須     | 型         | 意味                                                                                                                                        |
| ----------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | はい     | `string`   | `baseUrl` を確認するプロバイダー設定ID。                                                                                                |
| `defaultBaseUrl`  | いいえ   | `string`   | プロバイダー設定で `baseUrl` が省略された場合に想定するベースURL。                                                                                         |
| `allowedBaseUrls` | はい     | `string[]` | この認証シグナルで許可されるベースURL。設定済みまたはデフォルトのベースURLが、これらの正規化済み値のいずれにも一致しない場合、シグナルは無視されます。 |

## ツールメタデータリファレンス

`toolMetadata` は、ツール名をキーとして、生成プロバイダーメタデータと同じ `configSignals` および `authSignals` の形を使用します。`contracts.tools` は所有権を宣言します。`toolMetadata` は安価な可用性の根拠を宣言するため、OpenClaw はツールファクトリーに `null` を返させるだけのためにPluginランタイムをインポートすることを避けられます。

```json
{
  "providerAuthEnvVars": {
    "example": ["EXAMPLE_API_KEY"]
  },
  "contracts": {
    "tools": ["example_search"]
  },
  "toolMetadata": {
    "example_search": {
      "authSignals": [
        {
          "provider": "example"
        }
      ],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example.config",
          "overlayPath": "search",
          "required": ["apiKey"]
        }
      ]
    }
  }
}
```

ツールに `toolMetadata` がない場合、OpenClaw は既存の動作を維持し、ツール契約がポリシーに一致するときに所有Pluginを読み込みます。ファクトリーが認証や設定に依存するホットパス上のツールについては、Plugin作成者は、問い合わせのためにコアがランタイムをインポートする形ではなく、`toolMetadata` を宣言するべきです。

## providerAuthChoices リファレンス

各 `providerAuthChoices` エントリーは、1つのオンボーディングまたは認証の選択肢を記述します。
OpenClaw はプロバイダーランタイムが読み込まれる前にこれを読み取ります。
プロバイダーセットアップのリストは、プロバイダーランタイムを読み込まずに、これらのマニフェスト上の選択肢、ディスクリプターから導出されるセットアップ選択肢、インストールカタログメタデータを使用します。

| フィールド            | 必須     | 型                                              | 意味                                                                                            |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | はい     | `string`                                        | この選択肢が属するプロバイダーID。                                                                      |
| `method`              | はい     | `string`                                        | ディスパッチ先の認証メソッドID。                                                                           |
| `choiceId`            | はい     | `string`                                        | オンボーディングとCLIフローで使用される安定した認証選択肢ID。                                                  |
| `choiceLabel`         | いいえ   | `string`                                        | ユーザー向けラベル。省略された場合、OpenClaw は `choiceId` にフォールバックします。                                        |
| `choiceHint`          | いいえ   | `string`                                        | ピッカー用の短い補助テキスト。                                                                        |
| `assistantPriority`   | いいえ   | `number`                                        | 値が低いほど、アシスタント主導の対話型ピッカーで先に並びます。                                       |
| `assistantVisibility` | いいえ   | `"visible"` \| `"manual-only"`                  | 手動CLI選択は許可したまま、アシスタントのピッカーからこの選択肢を隠します。                        |
| `deprecatedChoiceIds` | いいえ   | `string[]`                                      | ユーザーをこの置換選択肢へリダイレクトするべきレガシー選択肢ID。                                 |
| `groupId`             | いいえ   | `string`                                        | 関連する選択肢をグループ化するための任意のグループID。                                                          |
| `groupLabel`          | いいえ   | `string`                                        | そのグループのユーザー向けラベル。                                                                        |
| `groupHint`           | いいえ   | `string`                                        | グループ用の短い補助テキスト。                                                                         |
| `optionKey`           | いいえ   | `string`                                        | 単純な1フラグ認証フローの内部オプションキー。                                                      |
| `cliFlag`             | いいえ   | `string`                                        | `--openrouter-api-key` などのCLIフラグ名。                                                           |
| `cliOption`           | いいえ   | `string`                                        | `--openrouter-api-key <key>` などの完全なCLIオプション形式。                                             |
| `cliDescription`      | いいえ   | `string`                                        | CLIヘルプで使用される説明。                                                                            |
| `onboardingScopes`    | いいえ   | `Array<"text-inference" \| "image-generation">` | この選択肢を表示するオンボーディング画面。省略された場合、デフォルトは `["text-inference"]` です。 |

## commandAliases リファレンス

`commandAliases` は、Plugin がランタイムコマンド名を所有しており、ユーザーが誤って `plugins.allow` に入れたり、ルート CLI コマンドとして実行しようとしたりする可能性がある場合に使用します。OpenClaw は Plugin ランタイムコードをインポートせずに、このメタデータを診断に使用します。

```json
{
  "commandAliases": [
    {
      "name": "dreaming",
      "kind": "runtime-slash",
      "cliCommand": "memory"
    }
  ]
}
```

| フィールド   | 必須 | 型                | 意味                                                                            |
| ------------ | ---- | ----------------- | ------------------------------------------------------------------------------- |
| `name`       | はい | `string`          | この Plugin に属するコマンド名。                                                |
| `kind`       | いいえ | `"runtime-slash"` | エイリアスをルート CLI コマンドではなく、チャットのスラッシュコマンドとして示します。 |
| `cliCommand` | いいえ | `string`          | CLI 操作向けに提案する関連ルート CLI コマンド。存在する場合のみ。               |

## activation リファレンス

Plugin が、どのコントロールプレーンイベントで activation/load プランに含めるべきかを低コストに宣言できる場合は、`activation` を使用します。

このブロックはプランナーのメタデータであり、ライフサイクル API ではありません。ランタイム動作を登録せず、`register(...)` を置き換えず、Plugin コードがすでに実行されたことも保証しません。activation プランナーは、既存のマニフェスト所有権メタデータ（`providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools`、hooks など）にフォールバックする前に、候補 Plugin を絞り込むためにこれらのフィールドを使用します。

所有権をすでに説明している、最も狭いメタデータを優先してください。関係を表現できる場合は、`providers`、`channels`、`commandAliases`、setup descriptor、または `contracts` を使用します。これらの所有権フィールドでは表現できない追加のプランナーヒントには `activation` を使用します。
`claude-cli`、`codex-cli`、`google-gemini-cli` などの CLI ランタイムエイリアスには、トップレベルの `cliBackends` を使用します。`activation.onAgentHarnesses` は、所有権フィールドがまだない埋め込み agent harness id 専用です。

このブロックはメタデータのみです。ランタイム動作を登録せず、`register(...)`、`setupEntry`、その他のランタイム/Plugin エントリポイントを置き換えません。現在のコンシューマーは、より広い Plugin ロードの前に絞り込みヒントとして使用するため、startup 以外の activation メタデータが欠けていても通常はパフォーマンスに影響するだけです。マニフェスト所有権フォールバックがまだ存在する限り、正しさは変わらないはずです。

すべての Plugin は `activation.onStartup` を意図的に設定するべきです。Plugin を Gateway 起動時に実行する必要がある場合のみ `true` に設定します。Plugin が起動時には非アクティブで、より狭いトリガーからのみロードされるべき場合は `false` に設定します。`onStartup` を省略しても Plugin が暗黙的に startup-load されることはもうありません。startup、channel、config、agent-harness、memory、その他のより狭い activation トリガーには、明示的な activation メタデータを使用してください。

```json
{
  "activation": {
    "onStartup": false,
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onConfigPaths": ["browser"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| フィールド         | 必須 | 型                                                   | 意味                                                                                                                                                                           |
| ------------------ | ---- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `onStartup`        | いいえ | `boolean`                                            | 明示的な Gateway startup activation。すべての Plugin はこれを設定するべきです。`true` は startup 中に Plugin をインポートし、`false` は別の一致するトリガーがロードを要求しない限り startup-lazy のままにします。 |
| `onProviders`      | いいえ | `string[]`                                           | activation/load プランにこの Plugin を含めるべき Provider id。                                                                                                                |
| `onAgentHarnesses` | いいえ | `string[]`                                           | activation/load プランにこの Plugin を含めるべき埋め込み agent harness ランタイム id。CLI backend エイリアスにはトップレベルの `cliBackends` を使用します。                    |
| `onCommands`       | いいえ | `string[]`                                           | activation/load プランにこの Plugin を含めるべきコマンド id。                                                                                                                 |
| `onChannels`       | いいえ | `string[]`                                           | activation/load プランにこの Plugin を含めるべき Channel id。                                                                                                                 |
| `onRoutes`         | いいえ | `string[]`                                           | activation/load プランにこの Plugin を含めるべき Route kind。                                                                                                                 |
| `onConfigPaths`    | いいえ | `string[]`                                           | パスが存在し、明示的に無効化されていない場合に、startup/load プランにこの Plugin を含めるべきルート相対 config パス。                                                        |
| `onCapabilities`   | いいえ | `Array<"provider" \| "channel" \| "tool" \| "hook">` | コントロールプレーン activation planning で使用される広範な capability ヒント。可能な場合は、より狭いフィールドを優先してください。                                           |

現在のライブコンシューマー:

- Gateway startup planning は、明示的な startup import に `activation.onStartup` を使用します
- command-triggered CLI planning は、レガシーの `commandAliases[].cliCommand` または `commandAliases[].name` にフォールバックします
- agent-runtime startup planning は、埋め込み harness には `activation.onAgentHarnesses` を、CLI ランタイムエイリアスにはトップレベルの `cliBackends[]` を使用します
- channel-triggered setup/channel planning は、明示的な channel activation メタデータがない場合、レガシーの `channels[]` 所有権にフォールバックします
- startup plugin planning は、同梱 browser Plugin の `browser` ブロックなど、channel 以外のルート config surface に `activation.onConfigPaths` を使用します
- provider-triggered setup/runtime planning は、明示的な provider activation メタデータがない場合、レガシーの `providers[]` とトップレベルの `cliBackends[]` 所有権にフォールバックします

プランナー診断は、明示的な activation ヒントとマニフェスト所有権フォールバックを区別できます。たとえば、`activation-command-hint` は `activation.onCommands` が一致したことを意味し、`manifest-command-alias` はプランナーが代わりに `commandAliases` 所有権を使用したことを意味します。これらの reason label はホスト診断とテスト用です。Plugin 作成者は、所有権を最もよく説明するメタデータを宣言し続けてください。

## qaRunners リファレンス

Plugin が共有 `openclaw qa` ルート配下に 1 つ以上の transport runner を提供する場合は、`qaRunners` を使用します。このメタデータは低コストかつ静的に保ってください。実際の CLI 登録は、`qaRunnerCliRegistrations` をエクスポートする軽量な `runtime-api.ts` surface を通じて、引き続き Plugin ランタイムが所有します。

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Run the Docker-backed Matrix live QA lane against a disposable homeserver"
    }
  ]
}
```

| フィールド    | 必須 | 型       | 意味                                                                        |
| ------------- | ---- | -------- | --------------------------------------------------------------------------- |
| `commandName` | はい | `string` | `openclaw qa` 配下にマウントされるサブコマンド。例: `matrix`。              |
| `description` | いいえ | `string` | 共有ホストが stub コマンドを必要とする場合に使用されるフォールバック help text。 |

## setup リファレンス

setup とオンボーディング surface が、ランタイムロード前に低コストな Plugin 所有メタデータを必要とする場合は、`setup` を使用します。

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"],
        "authEvidence": [
          {
            "type": "local-file-with-env",
            "fileEnvVar": "OPENAI_CREDENTIALS_FILE",
            "requiresAllEnv": ["OPENAI_PROJECT"],
            "credentialMarker": "openai-local-credentials",
            "source": "openai local credentials"
          }
        ]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

トップレベルの `cliBackends` は引き続き有効で、CLI inference backend を説明し続けます。`setup.cliBackends` は、メタデータのみのままにすべき control-plane/setup フロー向けの setup-specific descriptor surface です。

存在する場合、`setup.providers` と `setup.cliBackends` は setup discovery 向けの descriptor-first lookup surface として優先されます。descriptor が候補 Plugin を絞り込むだけで、setup がさらに豊富な setup-time ランタイム hook を必要とする場合は、`requiresRuntime: true` を設定し、フォールバック実行パスとして `setup-api` を維持してください。

OpenClaw は、generic provider auth と env-var lookup にも `setup.providers[].envVars` を含めます。`providerAuthEnvVars` は deprecation window 中、互換性 adapter を通じて引き続きサポートされますが、まだそれを使用している非同梱 Plugin はマニフェスト診断を受け取ります。新しい Plugin は setup/status env メタデータを `setup.providers[].envVars` に置くべきです。

OpenClaw は、setup entry がない場合、または `setup.requiresRuntime: false` が setup ランタイム不要を宣言している場合、`setup.providers[].authMethods` から単純な setup 選択肢を導出することもできます。明示的な `providerAuthChoices` エントリは、カスタムラベル、CLI フラグ、オンボーディング scope、assistant メタデータについて引き続き優先されます。

`requiresRuntime: false` は、それらの descriptor が setup surface に十分な場合のみ設定してください。OpenClaw は明示的な `false` を descriptor-only contract として扱い、setup lookup のために `setup-api` や `openclaw.setupEntry` を実行しません。descriptor-only Plugin がそれらの setup runtime entry のいずれかをまだ同梱している場合、OpenClaw は追加診断を報告し、それを無視し続けます。`requiresRuntime` を省略するとレガシーのフォールバック動作が維持されるため、flag なしで descriptor を追加した既存 Plugin は壊れません。

setup lookup は Plugin 所有の `setup-api` コードを実行できるため、正規化された `setup.providers[].id` と `setup.cliBackends[]` の値は、発見された Plugin 間で一意でなければなりません。曖昧な所有権は、discovery order から勝者を選ぶのではなく fail closed します。

setup runtime が実行される場合、`setup-api` がマニフェスト descriptor で宣言されていない provider または CLI backend を登録した場合、または descriptor に一致するランタイム登録がない場合、setup registry diagnostics は descriptor drift を報告します。これらの診断は追加的であり、レガシー Plugin を拒否しません。

### setup.providers リファレンス

| フィールド     | 必須 | 型         | 意味                                                                                           |
| -------------- | ---- | ---------- | ---------------------------------------------------------------------------------------------- |
| `id`           | はい | `string`   | setup またはオンボーディング中に公開される Provider id。正規化された id をグローバルに一意に保ってください。 |
| `authMethods`  | いいえ | `string[]` | フルランタイムをロードせずにこの Provider がサポートする setup/auth method id。                 |
| `envVars`      | いいえ | `string[]` | generic setup/status surface が Plugin ランタイムロード前に確認できる env var。                 |
| `authEvidence` | いいえ | `object[]` | non-secret marker を通じて認証できる Provider 向けの低コストな local auth evidence check。      |

`authEvidence` は、ランタイムコードを読み込まずに検証できる、プロバイダー所有のローカル認証情報マーカー用です。これらのチェックは低コストかつローカルのままにする必要があります。ネットワーク呼び出し、キーチェーンやシークレットマネージャーの読み取り、シェルコマンド、プロバイダー API プローブは行いません。

サポートされる証拠エントリ:

| フィールド         | 必須     | 型         | 意味                                                                                                           |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | はい     | `string`   | 現在は `local-file-with-env` です。                                                                            |
| `fileEnvVar`       | いいえ   | `string`   | 明示的な認証情報ファイルパスを含む環境変数。                                                                   |
| `fallbackPaths`    | いいえ   | `string[]` | `fileEnvVar` が存在しない、または空の場合にチェックされるローカル認証情報ファイルパス。`${HOME}` と `${APPDATA}` をサポートします。 |
| `requiresAnyEnv`   | いいえ   | `string[]` | 証拠が有効になる前に、列挙された環境変数の少なくとも 1 つが空でない必要があります。                           |
| `requiresAllEnv`   | いいえ   | `string[]` | 証拠が有効になる前に、列挙されたすべての環境変数が空でない必要があります。                                     |
| `credentialMarker` | はい     | `string`   | 証拠が存在する場合に返される、シークレットではないマーカー。                                                   |
| `source`           | いいえ   | `string`   | 認証/ステータス出力向けのユーザー表示用ソースラベル。                                                          |

### setup フィールド

| フィールド         | 必須     | 型         | 意味                                                                                                |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | いいえ   | `object[]` | セットアップとオンボーディング中に公開されるプロバイダーセットアップ記述子。                        |
| `cliBackends`      | いいえ   | `string[]` | 記述子優先のセットアップ検索で使用されるセットアップ時バックエンド ID。正規化済み ID はグローバルに一意に保ってください。 |
| `configMigrations` | いいえ   | `string[]` | この Plugin のセットアップサーフェスが所有する設定マイグレーション ID。                             |
| `requiresRuntime`  | いいえ   | `boolean`  | 記述子検索後もセットアップに `setup-api` の実行が必要かどうか。                                     |

## uiHints リファレンス

`uiHints` は、設定フィールド名から小さなレンダリングヒントへのマップです。

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Used for OpenRouter requests",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

各フィールドヒントには次を含めることができます:

| フィールド    | 型         | 意味                                      |
| ------------- | ---------- | ----------------------------------------- |
| `label`       | `string`   | ユーザー表示用フィールドラベル。          |
| `help`        | `string`   | 短い補助テキスト。                        |
| `tags`        | `string[]` | 任意の UI タグ。                          |
| `advanced`    | `boolean`  | フィールドを詳細項目としてマークします。  |
| `sensitive`   | `boolean`  | フィールドをシークレットまたは機密としてマークします。 |
| `placeholder` | `string`   | フォーム入力用のプレースホルダーテキスト。 |

## contracts リファレンス

OpenClaw が Plugin ランタイムをインポートせずに読み取れる静的な機能所有権メタデータにのみ、`contracts` を使用します。

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["pi", "codex"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "migrationProviders": ["hermes"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

各リストは任意です:

| フィールド                       | 型         | 意味                                                                  |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Codex アプリサーバー拡張ファクトリー ID。現在は `codex-app-server`。  |
| `agentToolResultMiddleware`      | `string[]` | バンドル Plugin がツール結果ミドルウェアを登録できるランタイム ID。   |
| `externalAuthProviders`          | `string[]` | この Plugin が外部認証プロファイルフックを所有するプロバイダー ID。   |
| `speechProviders`                | `string[]` | この Plugin が所有する音声プロバイダー ID。                           |
| `realtimeTranscriptionProviders` | `string[]` | この Plugin が所有するリアルタイム文字起こしプロバイダー ID。         |
| `realtimeVoiceProviders`         | `string[]` | この Plugin が所有するリアルタイム音声プロバイダー ID。               |
| `memoryEmbeddingProviders`       | `string[]` | この Plugin が所有するメモリエンベディングプロバイダー ID。           |
| `mediaUnderstandingProviders`    | `string[]` | この Plugin が所有するメディア理解プロバイダー ID。                   |
| `imageGenerationProviders`       | `string[]` | この Plugin が所有する画像生成プロバイダー ID。                       |
| `videoGenerationProviders`       | `string[]` | この Plugin が所有する動画生成プロバイダー ID。                       |
| `webFetchProviders`              | `string[]` | この Plugin が所有する Web フェッチプロバイダー ID。                  |
| `webSearchProviders`             | `string[]` | この Plugin が所有する Web 検索プロバイダー ID。                      |
| `migrationProviders`             | `string[]` | `openclaw migrate` 向けにこの Plugin が所有するインポートプロバイダー ID。 |
| `tools`                          | `string[]` | この Plugin が所有するエージェントツール名。                          |

`contracts.embeddedExtensionFactories` は、バンドルされた Codex アプリサーバー専用拡張ファクトリーのために保持されています。バンドルされたツール結果変換は、代わりに `contracts.agentToolResultMiddleware` を宣言し、`api.registerAgentToolResultMiddleware(...)` で登録する必要があります。外部 Plugin はツール結果ミドルウェアを登録できません。この継ぎ目は、モデルが見る前に高信頼のツール出力を書き換えられるためです。

ランタイムの `api.registerTool(...)` 登録は `contracts.tools` と一致する必要があります。ツール検出はこのリストを使用して、要求されたツールを所有できる Plugin ランタイムだけを読み込みます。

`resolveExternalAuthProfiles` を実装するプロバイダー Plugin は、`contracts.externalAuthProviders` を宣言する必要があります。宣言のない Plugin も非推奨の互換フォールバックを通じて実行されますが、そのフォールバックは低速であり、移行期間後に削除されます。

バンドルされたメモリエンベディングプロバイダーは、`local` のような組み込みアダプターを含め、公開するすべてのアダプター ID について `contracts.memoryEmbeddingProviders` を宣言する必要があります。スタンドアロン CLI パスは、完全な Gateway ランタイムがプロバイダーを登録する前に、所有元 Plugin だけを読み込むためにこのマニフェスト契約を使用します。

## mediaUnderstandingProviderMetadata リファレンス

メディア理解プロバイダーに、デフォルトモデル、自動認証フォールバック優先度、またはランタイム読み込み前に汎用コアヘルパーが必要とするネイティブドキュメントサポートがある場合は、`mediaUnderstandingProviderMetadata` を使用します。キーは `contracts.mediaUnderstandingProviders` でも宣言されている必要があります。

```json
{
  "contracts": {
    "mediaUnderstandingProviders": ["example"]
  },
  "mediaUnderstandingProviderMetadata": {
    "example": {
      "capabilities": ["image", "audio"],
      "defaultModels": {
        "image": "example-vision-latest",
        "audio": "example-transcribe-latest"
      },
      "autoPriority": {
        "image": 40
      },
      "nativeDocumentInputs": ["pdf"]
    }
  }
}
```

各プロバイダーエントリには次を含めることができます:

| フィールド             | 型                                  | 意味                                                                         |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | このプロバイダーが公開するメディア機能。                                     |
| `defaultModels`        | `Record<string, string>`            | 設定でモデルが指定されていない場合に使用される、機能からモデルへのデフォルト。 |
| `autoPriority`         | `Record<string, number>`            | 自動的な認証情報ベースのプロバイダーフォールバックでは、小さい数値ほど先に並びます。 |
| `nativeDocumentInputs` | `"pdf"[]`                           | プロバイダーがサポートするネイティブドキュメント入力。                       |

## channelConfigs リファレンス

チャネル Plugin がランタイム読み込み前に低コストの設定メタデータを必要とする場合は、`channelConfigs` を使用します。読み取り専用のチャネルセットアップ/ステータス検出は、セットアップエントリがない場合、または `setup.requiresRuntime: false` がセットアップランタイム不要を宣言している場合に、設定済み外部チャネルに対してこのメタデータを直接使用できます。

`channelConfigs` は Plugin マニフェストメタデータであり、新しいトップレベルのユーザー設定セクションではありません。ユーザーは引き続き `channels.<channel-id>` の下でチャネルインスタンスを設定します。OpenClaw は、Plugin ランタイムコードが実行される前に、その設定済みチャネルをどの Plugin が所有するかを判断するためにマニフェストメタデータを読み取ります。

チャネル Plugin では、`configSchema` と `channelConfigs` は異なるパスを記述します:

- `configSchema` は `plugins.entries.<plugin-id>.config` を検証します
- `channelConfigs.<channel-id>.schema` は `channels.<channel-id>` を検証します

`channels[]` を宣言する非バンドル Plugin は、一致する `channelConfigs` エントリも宣言する必要があります。宣言がなくても OpenClaw は Plugin を読み込めますが、コールドパスの設定スキーマ、セットアップ、Control UI サーフェスは、Plugin ランタイムが実行されるまでチャネル所有オプションの形を知ることができません。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` と `nativeSkillsAutoEnabled` は、チャネルランタイム読み込み前に実行されるコマンド設定チェック向けに静的な `auto` デフォルトを宣言できます。バンドルされたチャネルは、他のパッケージ所有のチャネルカタログメタデータとともに、`package.json#openclaw.channel.commands` を通じて同じデフォルトを公開することもできます。

```json
{
  "channelConfigs": {
    "matrix": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "homeserverUrl": { "type": "string" }
        }
      },
      "uiHints": {
        "homeserverUrl": {
          "label": "Homeserver URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Matrix homeserver connection",
      "commands": {
        "nativeCommandsAutoEnabled": true,
        "nativeSkillsAutoEnabled": true
      },
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

各チャネルエントリには次を含めることができます:

| フィールド    | 型                       | 意味                                                                                      |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` 用の JSON Schema。宣言された各チャンネル設定エントリに必須です。         |
| `uiHints`     | `Record<string, object>` | そのチャンネル設定セクション用の任意の UI ラベル、プレースホルダー、機密ヒント。          |
| `label`       | `string`                 | ランタイムメタデータの準備ができていない場合に、ピッカーと検査面にマージされるチャンネルラベル。 |
| `description` | `string`                 | 検査面とカタログ面向けの短いチャンネル説明。                               |
| `commands`    | `object`                 | ランタイム前の設定チェック用の静的ネイティブコマンドとネイティブスキルの自動デフォルト。       |
| `preferOver`  | `string[]`               | 選択面でこのチャンネルが優先すべき、レガシーまたは低優先度の Plugin ID。    |

### 別のチャンネル Plugin の置き換え

あなたの Plugin が、別の Plugin も提供できるチャンネル ID の優先所有者である場合は、`preferOver` を使用します。一般的なケースは、名前変更された Plugin ID、バンドルされた Plugin を置き換えるスタンドアロン Plugin、または設定互換性のために同じチャンネル ID を維持するメンテナンス済みフォークです。

```json
{
  "id": "acme-chat",
  "channels": ["chat"],
  "channelConfigs": {
    "chat": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "webhookUrl": { "type": "string" }
        }
      },
      "preferOver": ["chat"]
    }
  }
}
```

`channels.chat` が設定されている場合、OpenClaw はチャンネル ID と優先 Plugin ID の両方を考慮します。低優先度の Plugin が、バンドルされている、またはデフォルトで有効になっているという理由だけで選択された場合、OpenClaw は有効なランタイム設定でそれを無効にし、1 つの Plugin がそのチャンネルとツールを所有するようにします。明示的なユーザー選択は引き続き優先されます。ユーザーが両方の Plugin を明示的に有効にした場合、OpenClaw は要求された Plugin セットを暗黙に変更するのではなく、その選択を保持し、重複するチャンネルまたはツールの診断を報告します。

`preferOver` は、実際に同じチャンネルを提供できる Plugin ID に限定してください。これは汎用の優先度フィールドではなく、ユーザー設定キーの名前を変更するものでもありません。

## modelSupport リファレンス

OpenClaw が、Plugin ランタイムの読み込み前に `gpt-5.5` や `claude-sonnet-4.6` のような省略形モデル ID からプロバイダー Plugin を推論する必要がある場合は、`modelSupport` を使用します。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw は次の優先順位を適用します。

- 明示的な `provider/model` 参照は、所有元の `providers` マニフェストメタデータを使用します
- `modelPatterns` は `modelPrefixes` より優先されます
- 1 つの非バンドル Plugin と 1 つのバンドル Plugin がどちらも一致する場合、非バンドル Plugin が優先されます
- 残る曖昧さは、ユーザーまたは設定がプロバイダーを指定するまで無視されます

フィールド:

| フィールド      | 型         | 意味                                                                       |
| --------------- | ---------- | -------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 省略形モデル ID に対して `startsWith` で照合されるプレフィックス。                 |
| `modelPatterns` | `string[]` | プロファイルサフィックスの削除後に、省略形モデル ID に対して照合される Regex ソース。 |

## modelCatalog リファレンス

OpenClaw が、Plugin ランタイムを読み込む前にプロバイダーモデルメタデータを把握する必要がある場合は、`modelCatalog` を使用します。これは、固定カタログ行、プロバイダーエイリアス、抑制ルール、検出モードのマニフェスト所有ソースです。ランタイム更新は引き続きプロバイダーランタイムコードに属しますが、マニフェストはランタイムが必要になるタイミングをコアに伝えます。

```json
{
  "providers": ["openai"],
  "modelCatalog": {
    "providers": {
      "openai": {
        "baseUrl": "https://api.openai.com/v1",
        "api": "openai-responses",
        "models": [
          {
            "id": "gpt-5.4",
            "name": "GPT-5.4",
            "input": ["text", "image"],
            "reasoning": true,
            "contextWindow": 256000,
            "maxTokens": 128000,
            "cost": {
              "input": 1.25,
              "output": 10,
              "cacheRead": 0.125
            },
            "status": "available",
            "tags": ["default"]
          }
        ]
      }
    },
    "aliases": {
      "azure-openai-responses": {
        "provider": "openai",
        "api": "azure-openai-responses"
      }
    },
    "suppressions": [
      {
        "provider": "azure-openai-responses",
        "model": "gpt-5.3-codex-spark",
        "reason": "not available on Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

トップレベルフィールド:

| フィールド     | 型                                                       | 意味                                                                                                        |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | この Plugin が所有するプロバイダー ID のカタログ行。キーはトップレベルの `providers` にも現れるべきです。       |
| `aliases`      | `Record<string, object>`                                 | カタログまたは抑制計画のために、所有プロバイダーへ解決されるべきプロバイダーエイリアス。              |
| `suppressions` | `object[]`                                               | この Plugin がプロバイダー固有の理由で抑制する、別ソースからのモデル行。                  |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | プロバイダーカタログをマニフェストメタデータから読めるか、キャッシュに更新できるか、ランタイムが必要か。 |

`aliases` は、モデルカタログ計画のためのプロバイダー所有権検索に参加します。エイリアスのターゲットは、同じ Plugin が所有するトップレベルプロバイダーでなければなりません。プロバイダーで絞り込まれたリストがエイリアスを使用する場合、OpenClaw はプロバイダーランタイムを読み込まずに、所有元マニフェストを読み取り、エイリアスの API/base URL オーバーライドを適用できます。エイリアスは、フィルターなしのカタログ一覧には展開されません。広範なリストでは、所有元の正規プロバイダー行のみが出力されます。

`suppressions` は、古いプロバイダーランタイムの `suppressBuiltInModel` フックを置き換えます。抑制エントリは、プロバイダーが Plugin に所有されている場合、または所有プロバイダーをターゲットとする `modelCatalog.aliases` キーとして宣言されている場合にのみ尊重されます。ランタイム抑制フックは、モデル解決中に呼び出されなくなりました。

プロバイダーフィールド:

| フィールド | 型                       | 意味                                                           |
| --------- | ------------------------ | -------------------------------------------------------------- |
| `baseUrl` | `string`                 | このプロバイダーカタログ内のモデルに対する任意のデフォルトベース URL。    |
| `api`     | `ModelApi`               | このプロバイダーカタログ内のモデルに対する任意のデフォルト API アダプター。 |
| `headers` | `Record<string, string>` | このプロバイダーカタログに適用される任意の静的ヘッダー。      |
| `models`  | `object[]`               | 必須のモデル行。`id` のない行は無視されます。            |

モデルフィールド:

| フィールド      | 型                                                             | 意味                                                                      |
| --------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `id`            | `string`                                                       | `provider/` プレフィックスを含まない、プロバイダーローカルのモデル ID。                    |
| `name`          | `string`                                                       | 任意の表示名。                                                      |
| `api`           | `ModelApi`                                                     | 任意のモデル単位 API オーバーライド。                                            |
| `baseUrl`       | `string`                                                       | 任意のモデル単位ベース URL オーバーライド。                                       |
| `headers`       | `Record<string, string>`                                       | 任意のモデル単位静的ヘッダー。                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | モデルが受け付けるモダリティ。                                               |
| `reasoning`     | `boolean`                                                      | モデルが推論動作を公開するかどうか。                               |
| `contextWindow` | `number`                                                       | ネイティブプロバイダーのコンテキストウィンドウ。                                             |
| `contextTokens` | `number`                                                       | `contextWindow` と異なる場合の、任意の有効ランタイムコンテキスト上限。 |
| `maxTokens`     | `number`                                                       | 判明している場合の最大出力トークン数。                                           |
| `cost`          | `object`                                                       | 任意の 100 万トークンあたり USD 料金。任意の `tieredPricing` を含みます。 |
| `compat`        | `object`                                                       | OpenClaw モデル設定互換性に一致する任意の互換性フラグ。  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 一覧表示ステータス。行を一切表示してはならない場合にのみ抑制します。          |
| `statusReason`  | `string`                                                       | 利用可能でないステータスとともに表示される任意の理由。                            |
| `replaces`      | `string[]`                                                     | このモデルが置き換える古いプロバイダーローカルモデル ID。                       |
| `replacedBy`    | `string`                                                       | 非推奨行の置き換え先プロバイダーローカルモデル ID。                    |
| `tags`          | `string[]`                                                     | ピッカーとフィルターで使用される安定したタグ。                                    |

抑制フィールド:

| フィールド                 | 型         | 意味                                                                                                  |
| -------------------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | 抑制するアップストリーム行のプロバイダー ID。この Plugin が所有するか、所有エイリアスとして宣言されている必要があります。 |
| `model`                    | `string`   | 抑制するプロバイダーローカルモデル ID。                                                                      |
| `reason`                   | `string`   | 抑制された行が直接要求されたときに表示される任意のメッセージ。                                     |
| `when.baseUrlHosts`        | `string[]` | 抑制が適用される前に必要な、有効なプロバイダーベース URL ホストの任意のリスト。               |
| `when.providerConfigApiIn` | `string[]` | 抑制が適用される前に必要な、正確なプロバイダー設定 `api` 値の任意のリスト。              |

`modelCatalog` に実行時専用データを入れないでください。マニフェストの行が、プロバイダーでフィルタリングされた一覧やピッカー画面で registry/runtime discovery を省略できるほど十分に完全な場合にのみ、`static` を使用します。マニフェストの行が一覧化可能な有用なシードまたは補足であり、後で refresh/cache によってさらに行を追加できる場合は、`refreshable` を使用します。refreshable の行は、それ自体では権威ある情報ではありません。OpenClaw が一覧を知るためにプロバイダー runtime を読み込む必要がある場合は、`runtime` を使用します。

## modelIdNormalization リファレンス

プロバイダー runtime が読み込まれる前に実行する必要がある、軽量でプロバイダー所有のモデル ID クリーンアップには `modelIdNormalization` を使用します。これにより、短いモデル名、プロバイダー内の従来 ID、プロキシのプレフィックスルールなどのエイリアスを、コアのモデル選択テーブルではなく、所有 Plugin のマニフェスト内に保てます。

```json
{
  "providers": ["anthropic", "openrouter"],
  "modelIdNormalization": {
    "providers": {
      "anthropic": {
        "aliases": {
          "sonnet-4.6": "claude-sonnet-4-6"
        }
      },
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  }
}
```

プロバイダーのフィールド:

| フィールド                           | 型                      | 意味                                                                                      |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | 大文字小文字を区別しない完全一致のモデル ID エイリアス。値は記述どおりに返されます。     |
| `stripPrefixes`                      | `string[]`              | エイリアス検索前に削除するプレフィックス。従来の provider/model 重複に有用です。         |
| `prefixWhenBare`                     | `string`                | 正規化後のモデル ID にまだ `/` が含まれていない場合に追加するプレフィックス。            |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | エイリアス検索後の条件付き bare-id プレフィックスルール。`modelPrefix` と `prefix` がキーです。 |

## providerEndpoints リファレンス

プロバイダー runtime が読み込まれる前に、汎用リクエストポリシーが知る必要のあるエンドポイント分類には `providerEndpoints` を使用します。各 `endpointClass` の意味は引き続きコアが所有し、Plugin マニフェストがホストとベース URL のメタデータを所有します。

エンドポイントのフィールド:

| フィールド                     | 型         | 意味                                                                                           |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | `openrouter`、`moonshot-native`、`google-vertex` などの既知のコアエンドポイントクラス。        |
| `hosts`                        | `string[]` | エンドポイントクラスに対応する正確なホスト名。                                                 |
| `hostSuffixes`                 | `string[]` | エンドポイントクラスに対応するホストサフィックス。ドメインサフィックスのみの一致には `.` を付けます。 |
| `baseUrls`                     | `string[]` | エンドポイントクラスに対応する、正規化済みの正確な HTTP(S) ベース URL。                       |
| `googleVertexRegion`           | `string`   | 正確なグローバルホスト向けの静的な Google Vertex リージョン。                                 |
| `googleVertexRegionHostSuffix` | `string`   | 一致したホストから取り除き、Google Vertex リージョンプレフィックスを公開するためのサフィックス。 |

## providerRequest リファレンス

プロバイダー runtime を読み込まずに汎用リクエストポリシーが必要とする、軽量なリクエスト互換性メタデータには `providerRequest` を使用します。挙動固有のペイロード書き換えは、プロバイダー runtime フックまたは共有プロバイダーファミリーヘルパーに保持してください。

```json
{
  "providers": ["vllm"],
  "providerRequest": {
    "providers": {
      "vllm": {
        "family": "vllm",
        "openAICompletions": {
          "supportsStreamingUsage": true
        }
      }
    }
  }
}
```

プロバイダーのフィールド:

| フィールド            | 型           | 意味                                                                                   |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | 汎用リクエスト互換性の判断と診断に使用されるプロバイダーファミリーラベル。             |
| `compatibilityFamily` | `"moonshot"` | 共有リクエストヘルパー用の任意のプロバイダーファミリー互換性バケット。                 |
| `openAICompletions`   | `object`     | OpenAI 互換 completions リクエストフラグ。現在は `supportsStreamingUsage` です。       |

## modelPricing リファレンス

プロバイダーが runtime 読み込み前に control-plane の価格設定挙動を制御する必要がある場合は、`modelPricing` を使用します。Gateway の価格キャッシュは、プロバイダー runtime コードを import せずにこのメタデータを読み取ります。

```json
{
  "providers": ["ollama", "openrouter"],
  "modelPricing": {
    "providers": {
      "ollama": {
        "external": false
      },
      "openrouter": {
        "openRouter": {
          "passthroughProviderModel": true
        },
        "liteLLM": false
      }
    }
  }
}
```

プロバイダーのフィールド:

| フィールド   | 型                 | 意味                                                                                             |
| ------------ | ------------------ | ------------------------------------------------------------------------------------------------ |
| `external`   | `boolean`          | OpenRouter または LiteLLM の価格を決して取得すべきでないローカル/セルフホストのプロバイダーには `false` を設定します。 |
| `openRouter` | `false \| object`  | OpenRouter 価格検索マッピング。`false` はこのプロバイダーの OpenRouter 検索を無効にします。     |
| `liteLLM`    | `false \| object`  | LiteLLM 価格検索マッピング。`false` はこのプロバイダーの LiteLLM 検索を無効にします。           |

ソースフィールド:

| フィールド                 | 型                   | 意味                                                                                                            |
| -------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`             | OpenClaw のプロバイダー ID と異なる場合の外部カタログプロバイダー ID。たとえば `zai` プロバイダーの `z-ai`。 |
| `passthroughProviderModel` | `boolean`            | スラッシュを含むモデル ID をネストされた provider/model 参照として扱います。OpenRouter などのプロキシプロバイダーに有用です。 |
| `modelIdTransforms`        | `"version-dots"[]`   | 追加の外部カタログモデル ID バリアント。`version-dots` は `claude-opus-4.6` のようなドット区切りバージョン ID を試します。 |

### OpenClaw プロバイダーインデックス

OpenClaw プロバイダーインデックスは、まだ Plugin がインストールされていない可能性があるプロバイダー向けの、OpenClaw 所有のプレビューメタデータです。これは Plugin マニフェストの一部ではありません。Plugin マニフェストは、引き続きインストール済み Plugin の権威ある情報です。プロバイダーインデックスは、プロバイダー Plugin がインストールされていない場合に、将来のインストール可能プロバイダーおよびインストール前モデルピッカー画面が利用する内部フォールバック契約です。

カタログの権威順序:

1. ユーザー設定。
2. インストール済み Plugin マニフェストの `modelCatalog`。
3. 明示的な refresh からのモデルカタログキャッシュ。
4. OpenClaw プロバイダーインデックスのプレビュー行。

プロバイダーインデックスには、シークレット、有効状態、runtime フック、または live アカウント固有のモデルデータを含めてはいけません。そのプレビューカタログは Plugin マニフェストと同じ `modelCatalog` プロバイダー行の形状を使用しますが、`api`、`baseUrl`、価格、互換性フラグなどの runtime adapter フィールドがインストール済み Plugin マニフェストと意図的に同期されている場合を除き、安定した表示メタデータに限定するべきです。live `/models` discovery を持つプロバイダーは、通常の一覧表示やオンボーディングでプロバイダー API を呼び出すのではなく、明示的なモデルカタログキャッシュパスを通じて更新済みの行を書き込むべきです。

プロバイダーインデックスのエントリには、Plugin が core から移動された、またはまだインストールされていないプロバイダー向けのインストール可能 Plugin メタデータを含めることもできます。このメタデータはチャネルカタログのパターンを反映します。パッケージ名、npm install spec、想定 integrity、軽量な auth-choice ラベルがあれば、インストール可能なセットアップオプションを表示するには十分です。Plugin がインストールされると、そのマニフェストが優先され、そのプロバイダーのプロバイダーインデックスエントリは無視されます。

従来のトップレベル capability キーは非推奨です。`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` を `contracts` の下に移動するには `openclaw doctor --fix` を使用してください。通常のマニフェスト読み込みでは、これらのトップレベルフィールドを capability 所有権として扱わなくなりました。

## マニフェストと package.json

この 2 つのファイルは異なる役割を持ちます。

| ファイル               | 用途                                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Plugin コードが実行される前に存在する必要がある discovery、設定検証、auth-choice メタデータ、UI ヒント                         |
| `package.json`         | npm メタデータ、依存関係のインストール、および entrypoint、install gating、setup、または catalog メタデータに使用される `openclaw` ブロック |

メタデータの置き場所がわからない場合は、次のルールを使用します。

- OpenClaw が Plugin コードを読み込む前に知る必要がある場合は、`openclaw.plugin.json` に置きます
- パッケージング、エントリーファイル、または npm install の挙動に関するものなら、`package.json` に置きます

### discovery に影響する package.json フィールド

一部の pre-runtime Plugin メタデータは、意図的に `openclaw.plugin.json` ではなく `package.json` の `openclaw` ブロック内に置かれます。
`openclaw.bundle` と `openclaw.bundle.json` は OpenClaw Plugin 契約ではありません。native Plugin は、`openclaw.plugin.json` と、以下のサポート対象 `package.json#openclaw` フィールドを使用する必要があります。

重要な例:

| フィールド                                                                                      | 意味                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | ネイティブ Plugin エントリポイントを宣言します。Plugin パッケージディレクトリ内に留まっている必要があります。                                                                                                   |
| `openclaw.runtimeExtensions`                                                               | インストール済みパッケージ向けにビルドされた JavaScript ランタイムエントリポイントを宣言します。Plugin パッケージディレクトリ内に留まっている必要があります。                                                                 |
| `openclaw.setupEntry`                                                                      | オンボーディング、遅延チャネル起動、読み取り専用のチャネルステータス/SecretRef 検出で使われる軽量なセットアップ専用エントリポイントです。Plugin パッケージディレクトリ内に留まっている必要があります。 |
| `openclaw.runtimeSetupEntry`                                                               | インストール済みパッケージ向けにビルドされた JavaScript セットアップエントリポイントを宣言します。`setupEntry` が必要で、存在している必要があり、Plugin パッケージディレクトリ内に留まっている必要があります。                         |
| `openclaw.channel`                                                                         | ラベル、ドキュメントパス、エイリアス、選択用コピーなどの安価なチャネルカタログメタデータです。                                                                                                 |
| `openclaw.channel.commands`                                                                | チャネルランタイムがロードされる前に、設定、監査、コマンドリスト画面で使われる静的なネイティブコマンドとネイティブスキル自動デフォルトのメタデータです。                                          |
| `openclaw.channel.configuredState`                                                         | フルチャネルランタイムをロードせずに「env のみのセットアップはすでに存在するか？」に答えられる軽量な設定済み状態チェッカーのメタデータです。                                         |
| `openclaw.channel.persistedAuthState`                                                      | フルチャネルランタイムをロードせずに「すでにサインイン済みのものはあるか？」に答えられる軽量な永続化認証チェッカーのメタデータです。                                               |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | バンドル済みおよび外部公開 Plugin のインストール/更新ヒントです。                                                                                                                   |
| `openclaw.install.defaultChoice`                                                           | 複数のインストール元が利用できる場合の優先インストールパスです。                                                                                                                  |
| `openclaw.install.minHostVersion`                                                          | `>=2026.3.22` や `>=2026.5.1-beta.1` のような semver の下限を使った、サポートされる最小 OpenClaw ホストバージョンです。                                                                             |
| `openclaw.install.expectedIntegrity`                                                       | `sha512-...` などの期待される npm dist integrity 文字列です。インストールと更新フローは、取得したアーティファクトをこれと照合します。                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                                              | 設定が無効な場合に、限定的なバンドル済み Plugin 再インストール復旧パスを許可します。                                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | 起動時にフルチャネル Plugin より前にセットアップ専用チャネル画面をロードできるようにします。                                                                                                 |

マニフェストメタデータは、ランタイムがロードされる前のオンボーディングに表示されるプロバイダー/チャネル/セットアップの選択肢を決定します。`package.json#openclaw.install` は、ユーザーがそれらの選択肢のいずれかを選んだときに、その Plugin を取得または有効化する方法をオンボーディングに伝えます。インストールヒントを `openclaw.plugin.json` に移動しないでください。

`openclaw.install.minHostVersion` は、非バンドル Plugin ソースのインストール時およびマニフェストレジストリのロード時に強制されます。無効な値は拒否されます。より新しいが有効な値の場合、古いホストでは外部 Plugin がスキップされます。バンドル済みソース Plugin は、ホストのチェックアウトと同じバージョンに揃っているものと見なされます。

公式のオンデマンドインストールメタデータでは、Plugin が ClawHub で公開されている場合に `clawhubSpec` を使う必要があります。オンボーディングはそれを優先リモートソースとして扱い、インストール後に ClawHub アーティファクトの事実を記録します。`npmSpec` は、まだ ClawHub に移行していないパッケージの互換性フォールバックとして残ります。

正確な npm バージョン固定は、たとえば `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"` のように、すでに `npmSpec` に含まれています。公式の外部カタログエントリでは、取得された npm アーティファクトが固定リリースと一致しなくなった場合に更新フローが安全側で失敗するよう、正確な spec と `expectedIntegrity` を組み合わせる必要があります。対話型オンボーディングでは、互換性のために、ベアパッケージ名や dist-tag を含む信頼済みレジストリ npm spec も引き続き提示します。カタログ診断は、正確、浮動、integrity 固定、integrity 欠落、パッケージ名不一致、無効なデフォルト選択ソースを区別できます。また、`expectedIntegrity` が存在する一方で、それを固定できる有効な npm ソースがない場合にも警告します。`expectedIntegrity` が存在する場合、インストール/更新フローはそれを強制します。省略されている場合、レジストリ解決は integrity 固定なしで記録されます。

チャネル Plugin は、ステータス、チャネルリスト、または SecretRef スキャンでフルランタイムをロードせずに設定済みアカウントを識別する必要がある場合、`openclaw.setupEntry` を提供する必要があります。セットアップエントリは、チャネルメタデータに加えて、セットアップで安全に使える設定、ステータス、シークレットアダプターを公開する必要があります。ネットワーククライアント、Gateway リスナー、トランスポートランタイムはメイン拡張エントリポイントに留めてください。

ランタイムエントリポイントフィールドは、ソースエントリポイントフィールドに対するパッケージ境界チェックを上書きしません。たとえば、`openclaw.runtimeExtensions` によって、外へ抜ける `openclaw.extensions` パスをロード可能にすることはできません。

`openclaw.install.allowInvalidConfigRecovery` は意図的に限定的です。任意の壊れた設定をインストール可能にするものではありません。現時点では、バンドル済み Plugin パスの欠落や、その同じバンドル済み Plugin に対する古い `channels.<id>` エントリなど、特定の古いバンドル済み Plugin アップグレード失敗からの復旧のみをインストールフローに許可します。無関係な設定エラーは引き続きインストールをブロックし、オペレーターを `openclaw doctor --fix` に誘導します。

`openclaw.channel.persistedAuthState` は、小さなチェッカーモジュール向けのパッケージメタデータです。

```json
{
  "openclaw": {
    "channel": {
      "id": "whatsapp",
      "persistedAuthState": {
        "specifier": "./auth-presence",
        "exportName": "hasAnyWhatsAppAuth"
      }
    }
  }
}
```

セットアップ、doctor、ステータス、または読み取り専用プレゼンスフローで、フルチャネル Plugin がロードされる前に安価な yes/no 認証プローブが必要な場合に使います。永続化認証状態は設定済みチャネル状態ではありません。このメタデータを使って Plugin を自動有効化したり、ランタイム依存関係を修復したり、チャネルランタイムをロードすべきか判断したりしないでください。対象の export は、永続化状態だけを読み取る小さな関数である必要があります。フルチャネルランタイム barrel 経由にしないでください。

`openclaw.channel.configuredState` は、安価な env のみの設定済みチェックに対して同じ形に従います。

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "specifier": "./configured-state",
        "exportName": "hasTelegramConfiguredState"
      }
    }
  }
}
```

チャネルが env またはその他の小さな非ランタイム入力から設定済み状態に答えられる場合に使います。チェックに完全な設定解決や実際のチャネルランタイムが必要な場合は、そのロジックを代わりに Plugin の `config.hasConfiguredState` フックに保持してください。

## 検出の優先順位（重複する Plugin ID）

OpenClaw は複数のルート（バンドル済み、グローバルインストール、ワークスペース、明示的な設定選択パス）から Plugin を検出します。2 つの検出結果が同じ `id` を共有する場合、**最も優先順位の高い**マニフェストだけが保持されます。優先順位の低い重複は、隣にロードされるのではなく破棄されます。

優先順位は高い順に次のとおりです。

1. **設定選択済み** — `plugins.entries.<id>` で明示的に固定されたパス
2. **バンドル済み** — OpenClaw に同梱されている Plugin
3. **グローバルインストール** — グローバル OpenClaw Plugin ルートにインストールされた Plugin
4. **ワークスペース** — 現在のワークスペースを基準に検出された Plugin

影響:

- ワークスペース内にあるバンドル済み Plugin のフォークまたは古いコピーは、バンドル済みビルドをシャドーしません。
- ローカルの Plugin でバンドル済み Plugin を実際に上書きするには、ワークスペース検出に依存するのではなく、`plugins.entries.<id>` で固定して優先順位で勝たせてください。
- 重複の破棄はログに記録されるため、Doctor と起動時診断は破棄されたコピーを示せます。
- 設定選択済みの重複上書きは診断で明示的な上書きとして表現されますが、古いフォークや意図しないシャドーが見えるように引き続き警告されます。

## JSON Schema 要件

- **すべての Plugin は JSON Schema を同梱する必要があります**。設定を受け付けない場合も同様です。
- 空のスキーマは許容されます（たとえば `{ "type": "object", "additionalProperties": false }`）。
- スキーマはランタイムではなく、設定の読み取り/書き込み時に検証されます。
- 新しい設定キーでバンドル済み Plugin を拡張またはフォークする場合は、その Plugin の `openclaw.plugin.json` `configSchema` も同時に更新してください。バンドル済み Plugin のスキーマは厳密なため、`configSchema.properties` に `myNewKey` を追加せずにユーザー設定へ `plugins.entries.<id>.config.myNewKey` を追加すると、Plugin ランタイムがロードされる前に拒否されます。

スキーマ拡張の例:

```json
{
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "myNewKey": {
        "type": "string"
      }
    }
  }
}
```

## 検証動作

- 不明な `channels.*` キーは、チャネル ID が Plugin マニフェストで宣言されていない限り**エラー**です。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny`、`plugins.slots.*` は、**検出可能な** Plugin ID を参照する必要があります。不明な ID は**エラー**です。
- Plugin がインストールされているものの、マニフェストまたはスキーマが壊れているか欠落している場合、検証は失敗し、Doctor は Plugin エラーを報告します。
- Plugin 設定が存在していても Plugin が**無効化**されている場合、その設定は保持され、Doctor とログに**警告**が表示されます。

完全な `plugins.*` スキーマについては、[設定リファレンス](/ja-JP/gateway/configuration) を参照してください。

## 注記

- マニフェストは、ローカルファイルシステムからの読み込みを含め、**ネイティブ OpenClaw Plugin では必須**です。ランタイムは Plugin モジュールを別途読み込みます。マニフェストは検出と検証のためだけに使われます。
- ネイティブマニフェストは JSON5 で解析されるため、最終的な値がオブジェクトである限り、コメント、末尾カンマ、引用符なしのキーを使用できます。
- マニフェストローダーが読み取るのは、文書化されたマニフェストフィールドだけです。カスタムのトップレベルキーは避けてください。
- `channels`、`providers`、`cliBackends`、`skills` は、Plugin が必要としない場合はすべて省略できます。
- `providerCatalogEntry` は軽量に保つ必要があり、広範なランタイムコードをインポートすべきではありません。リクエスト時の実行ではなく、静的なプロバイダーカタログメタデータや限定的な検出記述子に使用してください。`providerDiscoveryEntry` は従来の綴りで、既存の Plugin では引き続き動作します。
- 排他的な Plugin 種別は `plugins.slots.*` を通じて選択します。`plugins.slots.memory` 経由の `kind: "memory"`、`plugins.slots.contextEngine` 経由の `kind: "context-engine"`（デフォルトは `legacy`）です。
- 排他的な Plugin 種別はこのマニフェストで宣言してください。ランタイムエントリの `OpenClawPluginDefinition.kind` は非推奨であり、古い Plugin 向けの互換性フォールバックとしてのみ残っています。
- 環境変数メタデータ（`setup.providers[].envVars`、非推奨の `providerAuthEnvVars`、`channelEnvVars`）は宣言専用です。ステータス、監査、Cron 配信の検証、その他の読み取り専用サーフェスでは、環境変数を設定済みとして扱う前に、引き続き Plugin の信頼性と有効な有効化ポリシーを適用します。
- プロバイダーコードを必要とするランタイム ウィザード メタデータについては、[プロバイダーランタイムフック](/ja-JP/plugins/architecture-internals#provider-runtime-hooks)を参照してください。
- Plugin がネイティブモジュールに依存している場合は、ビルド手順と、パッケージマネージャーの許可リスト要件（たとえば、pnpm `allow-build-scripts` + `pnpm rebuild <package>`）を文書化してください。

## 関連

<CardGroup cols={3}>
  <Card title="Plugin の構築" href="/ja-JP/plugins/building-plugins" icon="rocket">
    Plugin のはじめに。
  </Card>
  <Card title="Plugin アーキテクチャ" href="/ja-JP/plugins/architecture" icon="diagram-project">
    内部アーキテクチャと機能モデル。
  </Card>
  <Card title="SDK 概要" href="/ja-JP/plugins/sdk-overview" icon="book">
    Plugin SDK リファレンスとサブパスインポート。
  </Card>
</CardGroup>

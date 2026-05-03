---
read_when:
    - OpenClaw Pluginを構築しています
    - Plugin 設定スキーマを提供するか、Plugin 検証エラーをデバッグする必要がある
summary: Plugin マニフェスト + JSON スキーマの要件（厳格な設定検証）
title: Plugin マニフェスト
x-i18n:
    generated_at: "2026-05-03T21:36:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 13adec905bd86407b9aa911d66e68299fec348bd74579a6a32a2fd5e19b22b8c
    source_path: plugins/manifest.md
    workflow: 16
---

このページは**ネイティブ OpenClaw Plugin マニフェスト**専用です。

互換バンドルレイアウトについては、[Plugin バンドル](/ja-JP/plugins/bundles)を参照してください。

互換バンドル形式では、異なるマニフェストファイルを使用します。

- Codex バンドル: `.codex-plugin/plugin.json`
- Claude バンドル: `.claude-plugin/plugin.json`、またはマニフェストなしのデフォルト Claude コンポーネント
  レイアウト
- Cursor バンドル: `.cursor-plugin/plugin.json`

OpenClaw はこれらのバンドルレイアウトも自動検出しますが、ここで説明する `openclaw.plugin.json` スキーマに対して検証されるわけではありません。

互換バンドルについて、OpenClaw は現在、レイアウトが OpenClaw ランタイムの期待に一致する場合に、バンドルメタデータに加えて、宣言された skill ルート、Claude コマンドルート、Claude バンドルの `settings.json` デフォルト、Claude バンドルの LSP デフォルト、サポートされるフックパックを読み取ります。

すべてのネイティブ OpenClaw Plugin は、**Plugin ルート**に `openclaw.plugin.json` ファイルを含める必要があります。OpenClaw はこのマニフェストを使用して、**Plugin コードを実行せずに**設定を検証します。マニフェストが欠落している、または無効な場合は Plugin エラーとして扱われ、設定検証がブロックされます。

Plugin システム全体のガイドを参照してください: [Plugins](/ja-JP/tools/plugin)。
ネイティブ機能モデルと現在の外部互換性ガイダンスについては、次を参照してください。
[機能モデル](/ja-JP/plugins/architecture#public-capability-model)。

## このファイルの役割

`openclaw.plugin.json` は、OpenClaw が**Plugin コードを読み込む前に**読み取るメタデータです。以下のすべては、Plugin ランタイムを起動せずに検査できる程度に軽量である必要があります。

**用途:**

- Plugin ID、設定検証、設定 UI ヒント
- 認証、オンボーディング、セットアップメタデータ（エイリアス、自動有効化、プロバイダー環境変数、認証の選択肢）
- コントロールプレーン画面向けの有効化ヒント
- モデルファミリー所有権の短縮表記
- 静的な機能所有権スナップショット（`contracts`）
- 共有 `openclaw qa` ホストが検査できる QA ランナーメタデータ
- カタログと検証画面にマージされる、チャンネル固有の設定メタデータ

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

## 詳細例

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

| フィールド                         | 必須     | 型                               | 意味                                                                                                                                                                                                                       |
| ------------------------------------ | -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | はい     | `string`                         | 正規の Plugin id。これは `plugins.entries.<id>` で使用される id です。                                                                                                                                                                 |
| `configSchema`                       | はい     | `object`                         | この Plugin の設定用のインライン JSON Schema。                                                                                                                                                                                        |
| `enabledByDefault`                   | いいえ   | `true`                           | バンドル Plugin をデフォルトで有効としてマークします。省略するか、`true` 以外の値を設定すると、Plugin はデフォルトで無効のままになります。                                                                                                        |
| `enabledByDefaultOnPlatforms`        | いいえ   | `string[]`                       | バンドル Plugin を、一覧にある Node.js プラットフォーム上でのみデフォルト有効としてマークします。例: `["darwin"]`。明示的な設定が常に優先されます。                                                                                            |
| `legacyPluginIds`                    | いいえ   | `string[]`                       | この正規 Plugin id に正規化されるレガシー id。                                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders`  | いいえ   | `string[]`                       | 認証、設定、またはモデル参照で言及されたときに、この Plugin を自動有効化するプロバイダー id。                                                                                                                                     |
| `kind`                               | いいえ   | `"memory"` \| `"context-engine"` | `plugins.slots.*` で使用される排他的な Plugin 種別を宣言します。                                                                                                                                                                        |
| `channels`                           | いいえ   | `string[]`                       | この Plugin が所有するチャンネル id。検出と設定検証に使用されます。                                                                                                                                                         |
| `providers`                          | いいえ   | `string[]`                       | この Plugin が所有するプロバイダー id。                                                                                                                                                                                                  |
| `providerDiscoveryEntry`             | いいえ   | `string`                         | Plugin ルートからの相対パスで指定する軽量なプロバイダー検出モジュールパス。完全な Plugin ランタイムを有効化せずに読み込める、マニフェストスコープのプロバイダーカタログメタデータ用です。                                               |
| `modelSupport`                       | いいえ   | `object`                         | ランタイム前に Plugin を自動読み込みするために使用される、マニフェスト所有の簡易モデルファミリーメタデータ。                                                                                                                                         |
| `modelCatalog`                       | いいえ   | `object`                         | この Plugin が所有するプロバイダー向けの宣言的なモデルカタログメタデータ。これは、Plugin ランタイムを読み込まずに将来の読み取り専用一覧表示、オンボーディング、モデルピッカー、エイリアス、抑制を行うためのコントロールプレーン契約です。         |
| `modelPricing`                       | いいえ   | `object`                         | プロバイダー所有の外部価格検索ポリシー。ローカルまたはセルフホストのプロバイダーをリモート価格カタログから除外したり、コアにプロバイダー id をハードコードせずにプロバイダー参照を OpenRouter/LiteLLM カタログ id にマッピングしたりするために使用します。             |
| `modelIdNormalization`               | いいえ   | `object`                         | プロバイダーランタイムが読み込まれる前に実行する必要がある、プロバイダー所有のモデル id エイリアスおよびプレフィックスのクリーンアップ。                                                                                                                                           |
| `providerEndpoints`                  | いいえ   | `object[]`                       | プロバイダーランタイムが読み込まれる前にコアが分類する必要がある、プロバイダールート用のマニフェスト所有エンドポイント host/baseUrl メタデータ。                                                                                                            |
| `providerRequest`                    | いいえ   | `object`                         | プロバイダーランタイムが読み込まれる前に、汎用リクエストポリシーで使用される低コストなプロバイダーファミリーおよびリクエスト互換性メタデータ。                                                                                                              |
| `cliBackends`                        | いいえ   | `string[]`                       | この Plugin が所有する CLI 推論バックエンド id。明示的な設定参照からの起動時自動有効化に使用されます。                                                                                                                         |
| `syntheticAuthRefs`                  | いいえ   | `string[]`                       | ランタイムが読み込まれる前のコールドモデル検出中に、Plugin 所有の合成認証フックを調べる必要があるプロバイダーまたは CLI バックエンド参照。                                                                                              |
| `nonSecretAuthMarkers`               | いいえ   | `string[]`                       | 秘密ではないローカル、OAuth、または環境認証情報状態を表す、バンドル Plugin 所有のプレースホルダー API キー値。                                                                                                                |
| `commandAliases`                     | いいえ   | `object[]`                       | ランタイムが読み込まれる前に、Plugin を考慮した設定および CLI 診断を生成する必要がある、この Plugin が所有するコマンド名。                                                                                                                |
| `providerAuthEnvVars`                | いいえ   | `Record<string, string[]>`       | プロバイダー認証/状態検索用の非推奨の互換環境メタデータ。新しい Plugin では `setup.providers[].envVars` を優先してください。OpenClaw は非推奨期間中もこれを読み取ります。                                                 |
| `providerAuthAliases`                | いいえ   | `Record<string, string>`         | 認証検索で別のプロバイダー id を再利用する必要があるプロバイダー id。例: ベースプロバイダー API キーと認証プロファイルを共有するコーディングプロバイダー。                                                                          |
| `channelEnvVars`                     | いいえ   | `Record<string, string[]>`       | OpenClaw が Plugin コードを読み込まずに検査できる低コストなチャンネル環境メタデータ。汎用の起動/設定ヘルパーが認識すべき、環境駆動のチャンネルセットアップまたは認証面に使用します。                                            |
| `providerAuthChoices`                | いいえ   | `object[]`                       | オンボーディングピッカー、優先プロバイダー解決、単純な CLI フラグ配線のための低コストな認証選択メタデータ。                                                                                                                       |
| `activation`                         | いいえ   | `object`                         | 起動、プロバイダー、コマンド、チャンネル、ルート、機能トリガーによる読み込みのための低コストな有効化プランナーメタデータ。メタデータのみで、実際の動作は引き続き Plugin ランタイムが所有します。                                                       |
| `setup`                              | いいえ   | `object`                         | 検出およびセットアップ面が Plugin ランタイムを読み込まずに検査できる、低コストなセットアップ/オンボーディング記述子。                                                                                                                    |
| `qaRunners`                          | いいえ   | `object[]`                       | Plugin ランタイムが読み込まれる前に共有 `openclaw qa` ホストで使用される、低コストな QA ランナー記述子。                                                                                                                                      |
| `contracts`                          | いいえ   | `object`                         | 外部認証フック、音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像生成、音楽生成、動画生成、web-fetch、web 検索、ツール所有権に関する静的な機能所有権スナップショット。 |
| `mediaUnderstandingProviderMetadata` | いいえ   | `Record<string, object>`         | `contracts.mediaUnderstandingProviders` で宣言されたプロバイダー id 向けの低コストなメディア理解デフォルト。                                                                                                                            |
| `imageGenerationProviderMetadata`    | いいえ   | `Record<string, object>`         | `contracts.imageGenerationProviders` で宣言されたプロバイダー id 向けの低コストな画像生成認証メタデータ。プロバイダー所有の認証エイリアスとベース URL ガードを含みます。                                                                  |
| `videoGenerationProviderMetadata`    | いいえ   | `Record<string, object>`         | `contracts.videoGenerationProviders` で宣言されたプロバイダー id 向けの低コストな動画生成認証メタデータ。プロバイダー所有の認証エイリアスとベース URL ガードを含みます。                                                                  |
| `musicGenerationProviderMetadata`    | いいえ   | `Record<string, object>`         | `contracts.musicGenerationProviders` で宣言されたプロバイダー id 向けの低コストな音楽生成認証メタデータ。プロバイダー所有の認証エイリアスとベース URL ガードを含みます。                                                                  |
| `toolMetadata`                       | いいえ   | `Record<string, object>`         | `contracts.tools` で宣言された Plugin 所有ツール向けの低コストな可用性メタデータ。設定、環境、または認証の根拠が存在しない限り、ツールがランタイムを読み込むべきでない場合に使用します。                                                           |
| `channelConfigs`                     | いいえ   | `Record<string, object>`         | ランタイムが読み込まれる前に検出および検証面へマージされる、マニフェスト所有のチャンネル設定メタデータ。                                                                                                                          |
| `skills`                             | いいえ   | `string[]`                       | Plugin ルートからの相対パスで指定する、読み込む Skills ディレクトリ。                                                                                                                                                                             |
| `name`                               | いいえ   | `string`                         | 人間が読める Plugin 名。                                                                                                                                                                                                         |
| `description`                        | いいえ   | `string`                         | Plugin サーフェスに表示される短い概要。                                                                                                                                                                                             |
| `version`                            | いいえ   | `string`                         | 情報提供用の Plugin バージョン。                                                                                                                                                                                                       |
| `uiHints`                            | いいえ   | `Record<string, object>`         | config フィールドの UI ラベル、プレースホルダー、機密性ヒント。                                                                                                                                                                   |

## 生成プロバイダーメタデータリファレンス

生成プロバイダーメタデータフィールドは、一致する`contracts.*GenerationProviders`リストで宣言されたプロバイダーの静的な認証シグナルを記述します。OpenClawはプロバイダーランタイムを読み込む前にこれらのフィールドを読み取るため、コアツールはすべてのプロバイダーPluginをインポートせずに生成プロバイダーが利用可能かどうかを判断できます。

これらのフィールドは、低コストで宣言的な事実にのみ使用してください。トランスポート、リクエスト変換、トークン更新、認証情報の検証、実際の生成動作はPluginランタイムに残します。

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

各メタデータエントリは以下をサポートします。

| フィールド      | 必須     | 型         | 意味                                                                                                                                 |
| --------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`       | いいえ   | `string[]` | 生成プロバイダーの静的な認証エイリアスとして扱う追加のプロバイダーID。                                                              |
| `authProviders` | いいえ   | `string[]` | 構成済みの認証プロファイルがこの生成プロバイダーの認証として扱われるプロバイダーID。                                                |
| `configSignals` | いいえ   | `object[]` | 認証プロファイルや環境変数なしで構成できる、ローカルまたはセルフホスト型プロバイダー向けの低コストな構成のみの可用性シグナル。      |
| `authSignals`   | いいえ   | `object[]` | 明示的な認証シグナル。存在する場合、プロバイダーID、`aliases`、`authProviders`からのデフォルトシグナルセットを置き換えます。        |

各`configSignals`エントリは以下をサポートします。

| フィールド    | 必須     | 型         | 意味                                                                                                                                                                                        |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `rootPath`    | はい     | `string`   | 検査するPlugin所有の構成オブジェクトへのドットパス。例: `plugins.entries.example.config`。                                                                                                |
| `overlayPath` | いいえ   | `string`   | シグナルを評価する前にルートオブジェクトへ重ね合わせる、ルート構成内のオブジェクトへのドットパス。`image`、`video`、`music`など、機能固有の構成に使用します。                             |
| `required`    | いいえ   | `string[]` | 有効な構成内で構成済みの値を持つ必要があるドットパス。文字列は空であってはならず、オブジェクトと配列も空であってはなりません。                                                           |
| `requiredAny` | いいえ   | `string[]` | 有効な構成内で少なくとも1つが構成済みの値を持つ必要があるドットパス。                                                                                                                      |
| `mode`        | いいえ   | `object`   | 有効な構成内の任意の文字列モードガード。構成のみの可用性が1つのモードにのみ適用される場合に使用します。                                                                                    |

各`mode`ガードは以下をサポートします。

| フィールド     | 必須     | 型         | 意味                                                                                 |
| ------------ | -------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | いいえ   | `string`   | 有効な構成内のドットパス。デフォルトは`mode`です。                                  |
| `default`    | いいえ   | `string`   | 構成でパスが省略された場合に使用するモード値。                                      |
| `allowed`    | いいえ   | `string[]` | 存在する場合、有効なモードがこれらの値のいずれかである場合にのみシグナルが通ります。 |
| `disallowed` | いいえ   | `string[]` | 存在する場合、有効なモードがこれらの値のいずれかである場合にシグナルは失敗します。   |

各`authSignals`エントリは以下をサポートします。

| フィールド        | 必須     | 型       | 意味                                                                                                                                                              |
| ----------------- | -------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | はい     | `string` | 構成済み認証プロファイルで確認するプロバイダーID。                                                                                                                |
| `providerBaseUrl` | いいえ   | `object` | 参照された構成済みプロバイダーが許可されたベースURLを使用している場合にのみ、シグナルを有効にする任意のガード。認証エイリアスが特定のAPIにのみ有効な場合に使用します。 |

各`providerBaseUrl`ガードは以下をサポートします。

| フィールド         | 必須     | 型         | 意味                                                                                                                                         |
| ----------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | はい     | `string`   | `baseUrl`を確認するプロバイダー構成ID。                                                                                                      |
| `defaultBaseUrl`  | いいえ   | `string`   | プロバイダー構成で`baseUrl`が省略された場合に想定するベースURL。                                                                             |
| `allowedBaseUrls` | はい     | `string[]` | この認証シグナルに許可されるベースURL。構成済みまたはデフォルトのベースURLが、これらの正規化済み値のいずれにも一致しない場合、シグナルは無視されます。 |

## ツールメタデータリファレンス

`toolMetadata`は、ツール名をキーとして、生成プロバイダーメタデータと同じ`configSignals`および`authSignals`の形を使用します。`contracts.tools`は所有権を宣言します。`toolMetadata`は低コストな可用性の根拠を宣言するため、OpenClawはツールファクトリーに`null`を返させるだけのためにPluginランタイムをインポートせずに済みます。

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

ツールに`toolMetadata`がない場合、OpenClawは既存の動作を保持し、ツール契約がポリシーに一致すると所有Pluginを読み込みます。ファクトリーが認証や構成に依存するホットパスのツールでは、Plugin作者はコアにランタイムをインポートして問い合わせさせるのではなく、`toolMetadata`を宣言するべきです。

## providerAuthChoicesリファレンス

各`providerAuthChoices`エントリは、1つのオンボーディングまたは認証の選択肢を記述します。OpenClawはプロバイダーランタイムを読み込む前にこれを読み取ります。プロバイダー設定リストは、プロバイダーランタイムを読み込まずに、これらのマニフェスト選択肢、記述子から導出された設定選択肢、インストールカタログメタデータを使用します。

| フィールド            | 必須     | 型                                              | 意味                                                                                               |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `provider`            | はい     | `string`                                        | この選択肢が属するプロバイダーID。                                                                 |
| `method`              | はい     | `string`                                        | ディスパッチ先の認証メソッドID。                                                                   |
| `choiceId`            | はい     | `string`                                        | オンボーディングおよびCLIフローで使用される安定した認証選択肢ID。                                  |
| `choiceLabel`         | いいえ   | `string`                                        | ユーザー向けラベル。省略した場合、OpenClawは`choiceId`にフォールバックします。                     |
| `choiceHint`          | いいえ   | `string`                                        | ピッカー用の短いヘルパーテキスト。                                                                 |
| `assistantPriority`   | いいえ   | `number`                                        | 値が小さいほど、アシスタント主導の対話型ピッカーで先に並びます。                                   |
| `assistantVisibility` | いいえ   | `"visible"` \| `"manual-only"`                  | 手動CLI選択は許可したまま、アシスタントピッカーから選択肢を非表示にします。                         |
| `deprecatedChoiceIds` | いいえ   | `string[]`                                      | ユーザーをこの置換選択肢へリダイレクトするべきレガシー選択肢ID。                                   |
| `groupId`             | いいえ   | `string`                                        | 関連する選択肢をグループ化するための任意のグループID。                                             |
| `groupLabel`          | いいえ   | `string`                                        | そのグループのユーザー向けラベル。                                                                 |
| `groupHint`           | いいえ   | `string`                                        | グループ用の短いヘルパーテキスト。                                                                 |
| `optionKey`           | いいえ   | `string`                                        | 単純な1フラグ認証フロー用の内部オプションキー。                                                     |
| `cliFlag`             | いいえ   | `string`                                        | `--openrouter-api-key`などのCLIフラグ名。                                                           |
| `cliOption`           | いいえ   | `string`                                        | `--openrouter-api-key <key>`などの完全なCLIオプション形式。                                         |
| `cliDescription`      | いいえ   | `string`                                        | CLIヘルプで使用される説明。                                                                         |
| `onboardingScopes`    | いいえ   | `Array<"text-inference" \| "image-generation">` | この選択肢を表示するオンボーディング画面。省略した場合、デフォルトは`["text-inference"]`です。       |

## commandAliasesリファレンス

ユーザーが誤って `plugins.allow` に入れたり、ルート CLI コマンドとして実行しようとしたりする可能性があるランタイムコマンド名を Plugin が所有している場合は、`commandAliases` を使用します。OpenClaw は、Plugin ランタイムコードをインポートせずに診断のためにこのメタデータを使用します。

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

| フィールド | 必須 | 型 | 意味 |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name` | はい | `string` | この Plugin に属するコマンド名。 |
| `kind` | いいえ | `"runtime-slash"` | エイリアスをルート CLI コマンドではなくチャットのスラッシュコマンドとしてマークします。 |
| `cliCommand` | いいえ | `string` | CLI 操作向けに提案する関連ルート CLI コマンド (存在する場合)。 |

## activation リファレンス

Plugin が、どのコントロールプレーンイベントで自身を有効化/ロードプランに含めるべきかを低コストに宣言できる場合は、`activation` を使用します。

このブロックはプランナーのメタデータであり、ライフサイクル API ではありません。ランタイム動作を登録せず、`register(...)` を置き換えず、Plugin コードがすでに実行済みであることも約束しません。有効化プランナーは、`providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools`、フックなどの既存のマニフェスト所有権メタデータへフォールバックする前に、これらのフィールドを使用して候補 Plugin を絞り込みます。

すでに所有関係を説明している最も狭いメタデータを優先します。その関係を表現できる場合は、`providers`、`channels`、`commandAliases`、セットアップディスクリプター、または `contracts` を使用します。これらの所有権フィールドでは表現できない追加のプランナーヒントには、`activation` を使用します。
`claude-cli`、`codex-cli`、`google-gemini-cli` などの CLI ランタイムエイリアスには、トップレベルの `cliBackends` を使用します。`activation.onAgentHarnesses` は、まだ所有権フィールドを持たない組み込みエージェントハーネス ID にのみ使用します。

このブロックはメタデータのみです。ランタイム動作を登録せず、`register(...)`、`setupEntry`、その他のランタイム/Plugin エントリーポイントを置き換えません。現在のコンシューマーは、より広範な Plugin ロードの前に絞り込みヒントとして使用するため、起動時以外の有効化メタデータが欠けていても通常はパフォーマンスのコストに留まります。マニフェスト所有権のフォールバックがまだ存在する限り、正しさは変わらないはずです。

すべての Plugin は `activation.onStartup` を意図的に設定する必要があります。Plugin が Gateway 起動中に実行されなければならない場合にのみ `true` に設定します。Plugin が起動時に不活性で、より狭いトリガーからのみロードされるべき場合は `false` に設定します。`onStartup` を省略しても、Plugin が暗黙的に起動時ロードされることはなくなりました。起動、チャネル、設定、エージェントハーネス、メモリ、その他のより狭い有効化トリガーには、明示的な有効化メタデータを使用してください。

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

| フィールド | 必須 | 型 | 意味 |
| ------------------ | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup` | いいえ | `boolean` | 明示的な Gateway 起動時の有効化。すべての Plugin がこれを設定する必要があります。`true` は起動中に Plugin をインポートします。`false` は、別の一致したトリガーが読み込みを必要としない限り、起動時遅延のままにします。 |
| `onProviders` | いいえ | `string[]` | この Plugin を有効化/ロードプランに含めるべきプロバイダー ID。 |
| `onAgentHarnesses` | いいえ | `string[]` | この Plugin を有効化/ロードプランに含めるべき組み込みエージェントハーネスのランタイム ID。CLI バックエンドエイリアスにはトップレベルの `cliBackends` を使用します。 |
| `onCommands` | いいえ | `string[]` | この Plugin を有効化/ロードプランに含めるべきコマンド ID。 |
| `onChannels` | いいえ | `string[]` | この Plugin を有効化/ロードプランに含めるべきチャネル ID。 |
| `onRoutes` | いいえ | `string[]` | この Plugin を有効化/ロードプランに含めるべきルート種別。 |
| `onConfigPaths` | いいえ | `string[]` | パスが存在し、明示的に無効化されていない場合に、この Plugin を起動/ロードプランに含めるべきルート相対の設定パス。 |
| `onCapabilities` | いいえ | `Array<"provider" \| "channel" \| "tool" \| "hook">` | コントロールプレーンの有効化計画で使用される広範なケイパビリティヒント。可能ならより狭いフィールドを優先します。 |

現在の実際のコンシューマー:

- Gateway 起動計画は、明示的な起動時インポートに `activation.onStartup` を使用します
- コマンドでトリガーされる CLI 計画は、レガシーの `commandAliases[].cliCommand` または `commandAliases[].name` にフォールバックします
- エージェントランタイムの起動計画は、組み込みハーネスには `activation.onAgentHarnesses` を、CLI ランタイムエイリアスにはトップレベルの `cliBackends[]` を使用します
- チャネルでトリガーされるセットアップ/チャネル計画は、明示的なチャネル有効化メタデータがない場合、レガシーの `channels[]` 所有権にフォールバックします
- 起動時の Plugin 計画は、バンドルされた browser Plugin の `browser` ブロックのような、チャネルではないルート設定サーフェスに `activation.onConfigPaths` を使用します
- プロバイダーでトリガーされるセットアップ/ランタイム計画は、明示的なプロバイダー有効化メタデータがない場合、レガシーの `providers[]` とトップレベルの `cliBackends[]` 所有権にフォールバックします

プランナー診断は、明示的な有効化ヒントとマニフェスト所有権フォールバックを区別できます。たとえば、`activation-command-hint` は `activation.onCommands` が一致したことを意味し、一方で `manifest-command-alias` はプランナーが代わりに `commandAliases` 所有権を使用したことを意味します。これらの理由ラベルはホスト診断とテストのためのものです。Plugin 作者は、所有関係を最もよく説明するメタデータを宣言し続ける必要があります。

## qaRunners リファレンス

Plugin が共有 `openclaw qa` ルート配下に 1 つ以上のトランスポートランナーを提供する場合は、`qaRunners` を使用します。このメタデータは低コストで静的に保ってください。実際の CLI 登録は引き続き Plugin ランタイムが所有し、`qaRunnerCliRegistrations` をエクスポートする軽量な `runtime-api.ts` サーフェスを通じて行います。

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

| フィールド | 必須 | 型 | 意味 |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | はい | `string` | `openclaw qa` 配下にマウントされるサブコマンド。例: `matrix`。 |
| `description` | いいえ | `string` | 共有ホストがスタブコマンドを必要とする場合に使用されるフォールバックヘルプテキスト。 |

## setup リファレンス

ランタイムがロードされる前に、セットアップおよびオンボーディングサーフェスが低コストな Plugin 所有メタデータを必要とする場合は、`setup` を使用します。

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

トップレベルの `cliBackends` は引き続き有効で、CLI 推論バックエンドを説明し続けます。`setup.cliBackends` は、メタデータのみであるべきコントロールプレーン/セットアップフロー向けの、セットアップ固有のディスクリプターサーフェスです。

存在する場合、`setup.providers` と `setup.cliBackends` はセットアップ検出における推奨のディスクリプター優先ルックアップサーフェスです。ディスクリプターが候補 Plugin を絞り込むだけで、セットアップがより豊富なセットアップ時ランタイムフックをまだ必要とする場合は、`requiresRuntime: true` を設定し、`setup-api` をフォールバック実行パスとして残します。

OpenClaw は、汎用プロバイダー認証と環境変数ルックアップにも `setup.providers[].envVars` を含めます。`providerAuthEnvVars` は非推奨期間中、互換アダプターを通じて引き続きサポートされますが、まだそれを使用している非バンドル Plugin にはマニフェスト診断が発行されます。新しい Plugin は、セットアップ/ステータス用の環境メタデータを `setup.providers[].envVars` に置くべきです。

OpenClaw は、セットアップエントリが利用できない場合、または `setup.requiresRuntime: false` がセットアップランタイム不要を宣言している場合、`setup.providers[].authMethods` から単純なセットアップ選択肢を導出することもできます。カスタムラベル、CLI フラグ、オンボーディングスコープ、アシスタントメタデータには、明示的な `providerAuthChoices` エントリが引き続き優先されます。

それらのディスクリプターがセットアップサーフェスに十分な場合にのみ、`requiresRuntime: false` を設定してください。OpenClaw は明示的な `false` をディスクリプターのみの契約として扱い、セットアップルックアップのために `setup-api` や `openclaw.setupEntry` を実行しません。ディスクリプターのみの Plugin がそれでもこれらのセットアップランタイムエントリのいずれかを同梱している場合、OpenClaw は追加の診断を報告し、それを引き続き無視します。`requiresRuntime` の省略はレガシーフォールバック動作を維持するため、フラグなしでディスクリプターを追加した既存の Plugin が壊れることはありません。

セットアップルックアップは Plugin 所有の `setup-api` コードを実行できるため、正規化された `setup.providers[].id` と `setup.cliBackends[]` の値は、検出された Plugin 間で一意である必要があります。曖昧な所有権は、検出順から採用対象を選ぶのではなく、安全側に失敗します。

セットアップランタイムが実行される場合、`setup-api` がマニフェストディスクリプターに宣言されていないプロバイダーまたは CLI バックエンドを登録した場合、またはディスクリプターに一致するランタイム登録がない場合、セットアップレジストリ診断はディスクリプターのずれを報告します。これらの診断は追加的であり、レガシー Plugin を拒否しません。

### setup.providers リファレンス

| フィールド | 必須 | 型 | 意味 |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id` | はい | `string` | セットアップまたはオンボーディング中に公開されるプロバイダー ID。正規化された ID はグローバルに一意に保ちます。 |
| `authMethods` | いいえ | `string[]` | フルランタイムをロードせずにこのプロバイダーがサポートするセットアップ/認証メソッド ID。 |
| `envVars` | いいえ | `string[]` | Plugin ランタイムがロードされる前に、汎用セットアップ/ステータスサーフェスが確認できる環境変数。 |
| `authEvidence` | いいえ | `object[]` | 非シークレットマーカーを通じて認証できるプロバイダー向けの低コストなローカル認証証拠チェック。 |

`authEvidence` は、ランタイムコードを読み込まずに検証できる、プロバイダー所有のローカル認証情報マーカー用です。これらのチェックは低コストかつローカルのままにする必要があります。ネットワーク呼び出し、キーチェーンやシークレットマネージャーの読み取り、シェルコマンド、プロバイダー API プローブは禁止です。

サポートされる証拠エントリ:

| フィールド         | 必須     | 型         | 意味                                                                                                           |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | はい     | `string`   | 現在は `local-file-with-env`。                                                                                 |
| `fileEnvVar`       | いいえ   | `string`   | 明示的な認証情報ファイルパスを含む環境変数。                                                                   |
| `fallbackPaths`    | いいえ   | `string[]` | `fileEnvVar` が存在しない、または空の場合に確認されるローカル認証情報ファイルパス。`${HOME}` と `${APPDATA}` をサポートします。 |
| `requiresAnyEnv`   | いいえ   | `string[]` | 証拠が有効になる前に、列挙された環境変数の少なくとも 1 つが空でない必要があります。                          |
| `requiresAllEnv`   | いいえ   | `string[]` | 証拠が有効になる前に、列挙されたすべての環境変数が空でない必要があります。                                    |
| `credentialMarker` | はい     | `string`   | 証拠が存在する場合に返される非シークレットマーカー。                                                           |
| `source`           | いいえ   | `string`   | 認証/ステータス出力用のユーザー向けソースラベル。                                                              |

### setup フィールド

| フィールド         | 必須     | 型         | 意味                                                                                                |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | いいえ   | `object[]` | セットアップとオンボーディング中に公開されるプロバイダーセットアップ記述子。                        |
| `cliBackends`      | いいえ   | `string[]` | 記述子優先のセットアップ検索で使われるセットアップ時のバックエンド ID。正規化済み ID はグローバルに一意にしてください。 |
| `configMigrations` | いいえ   | `string[]` | この Plugin のセットアップ面が所有する設定移行 ID。                                                 |
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

各フィールドヒントに含められる項目:

| フィールド    | 型         | 意味                                      |
| ------------- | ---------- | ----------------------------------------- |
| `label`       | `string`   | ユーザー向けフィールドラベル。            |
| `help`        | `string`   | 短いヘルパーテキスト。                    |
| `tags`        | `string[]` | 省略可能な UI タグ。                      |
| `advanced`    | `boolean`  | フィールドを高度な項目としてマークします。 |
| `sensitive`   | `boolean`  | フィールドをシークレットまたは機密としてマークします。 |
| `placeholder` | `string`   | フォーム入力のプレースホルダーテキスト。  |

## contracts リファレンス

OpenClaw が Plugin ランタイムをインポートせずに読み取れる、静的なケイパビリティ所有権メタデータにのみ `contracts` を使用してください。

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

各リストは省略可能です。

| フィールド                       | 型         | 意味                                                                  |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Codex アプリサーバー拡張ファクトリー ID。現在は `codex-app-server`。 |
| `agentToolResultMiddleware`      | `string[]` | バンドルされた Plugin がツール結果ミドルウェアを登録できるランタイム ID。 |
| `externalAuthProviders`          | `string[]` | この Plugin が所有する外部認証プロファイルフックのプロバイダー ID。  |
| `speechProviders`                | `string[]` | この Plugin が所有する音声プロバイダー ID。                           |
| `realtimeTranscriptionProviders` | `string[]` | この Plugin が所有するリアルタイム文字起こしプロバイダー ID。         |
| `realtimeVoiceProviders`         | `string[]` | この Plugin が所有するリアルタイム音声プロバイダー ID。               |
| `memoryEmbeddingProviders`       | `string[]` | この Plugin が所有するメモリエンベディングプロバイダー ID。           |
| `mediaUnderstandingProviders`    | `string[]` | この Plugin が所有するメディア理解プロバイダー ID。                   |
| `imageGenerationProviders`       | `string[]` | この Plugin が所有する画像生成プロバイダー ID。                       |
| `videoGenerationProviders`       | `string[]` | この Plugin が所有する動画生成プロバイダー ID。                       |
| `webFetchProviders`              | `string[]` | この Plugin が所有する Web フェッチプロバイダー ID。                  |
| `webSearchProviders`             | `string[]` | この Plugin が所有する Web 検索プロバイダー ID。                      |
| `migrationProviders`             | `string[]` | この Plugin が `openclaw migrate` 用に所有するインポートプロバイダー ID。 |
| `tools`                          | `string[]` | この Plugin が所有するエージェントツール名。                          |

`contracts.embeddedExtensionFactories` は、バンドルされた Codex アプリサーバー専用拡張ファクトリー用に保持されています。バンドルされたツール結果変換は、代わりに `contracts.agentToolResultMiddleware` を宣言し、`api.registerAgentToolResultMiddleware(...)` で登録する必要があります。外部 Plugin はツール結果ミドルウェアを登録できません。この境界は、モデルが参照する前に高信頼ツール出力を書き換えられるためです。

ランタイムの `api.registerTool(...)` 登録は `contracts.tools` と一致している必要があります。ツール検出はこのリストを使い、要求されたツールを所有できる Plugin ランタイムだけを読み込みます。

`resolveExternalAuthProfiles` を実装するプロバイダー Plugin は、`contracts.externalAuthProviders` を宣言する必要があります。宣言のない Plugin も非推奨の互換フォールバック経由で実行されますが、そのフォールバックは遅く、移行期間後に削除されます。

バンドルされたメモリエンベディングプロバイダーは、`local` などの組み込みアダプターを含め、公開するすべてのアダプター ID について `contracts.memoryEmbeddingProviders` を宣言する必要があります。スタンドアロン CLI パスは、Gateway ランタイム全体がプロバイダーを登録する前に、このマニフェスト契約を使って所有元 Plugin だけを読み込みます。

## mediaUnderstandingProviderMetadata リファレンス

メディア理解プロバイダーに、デフォルトモデル、自動認証フォールバック優先度、またはランタイム読み込み前に汎用コアヘルパーが必要とするネイティブ文書サポートがある場合は、`mediaUnderstandingProviderMetadata` を使用してください。キーは `contracts.mediaUnderstandingProviders` でも宣言されている必要があります。

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

各プロバイダーエントリに含められる項目:

| フィールド             | 型                                  | 意味                                                                         |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | このプロバイダーが公開するメディアケイパビリティ。                           |
| `defaultModels`        | `Record<string, string>`            | 設定でモデルが指定されていない場合に使われる、ケイパビリティからモデルへのデフォルト。 |
| `autoPriority`         | `Record<string, number>`            | 認証情報ベースの自動プロバイダーフォールバックで、数値が小さいほど先に並びます。 |
| `nativeDocumentInputs` | `"pdf"[]`                           | プロバイダーがサポートするネイティブ文書入力。                               |

## channelConfigs リファレンス

チャネル Plugin がランタイム読み込み前に低コストな設定メタデータを必要とする場合は、`channelConfigs` を使用してください。読み取り専用のチャネルセットアップ/ステータス検出は、セットアップエントリが利用できない場合、または `setup.requiresRuntime: false` がセットアップランタイム不要を宣言している場合に、設定済み外部チャネルに対してこのメタデータを直接使用できます。

`channelConfigs` は Plugin マニフェストメタデータであり、新しいトップレベルのユーザー設定セクションではありません。ユーザーは引き続き `channels.<channel-id>` の下でチャネルインスタンスを設定します。OpenClaw はマニフェストメタデータを読み取り、Plugin ランタイムコードが実行される前に、その設定済みチャネルをどの Plugin が所有するかを判断します。

チャネル Plugin では、`configSchema` と `channelConfigs` は異なるパスを記述します。

- `configSchema` は `plugins.entries.<plugin-id>.config` を検証します
- `channelConfigs.<channel-id>.schema` は `channels.<channel-id>` を検証します

`channels[]` を宣言する非バンドル Plugin は、対応する `channelConfigs` エントリも宣言する必要があります。それらがない場合でも OpenClaw は Plugin を読み込めますが、コールドパスの設定スキーマ、セットアップ、および Control UI 面は、Plugin ランタイムが実行されるまで、チャネル所有のオプション形状を知ることができません。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` と `nativeSkillsAutoEnabled` は、チャネルランタイムが読み込まれる前に実行されるコマンド設定チェック用に、静的な `auto` デフォルトを宣言できます。バンドルされたチャネルは、他のパッケージ所有チャネルカタログメタデータと並べて、`package.json#openclaw.channel.commands` 経由でも同じデフォルトを公開できます。

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

各チャネルエントリに含められる項目:

| フィールド | 型 | 意味 |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema` | `object` | `channels.<id>` の JSON Schema。宣言された各チャネル設定エントリに必須。 |
| `uiHints` | `Record<string, object>` | そのチャネル設定セクション用の任意の UI ラベル/プレースホルダー/機密ヒント。 |
| `label` | `string` | ランタイムメタデータがまだ準備できていない場合に、ピッカーと検査画面へマージされるチャネルラベル。 |
| `description` | `string` | 検査画面とカタログ画面用の短いチャネル説明。 |
| `commands` | `object` | ランタイム前の設定チェック用の静的ネイティブコマンドとネイティブスキルの自動デフォルト。 |
| `preferOver` | `string[]` | 選択画面でこのチャネルが上位になるべき、レガシーまたは低優先度の Plugin ID。 |

### 別のチャネル Plugin を置き換える

別の Plugin も提供できるチャネル ID に対して、自分の Plugin が優先される所有者である場合は `preferOver` を使用します。一般的なケースは、名前変更された Plugin ID、バンドル Plugin を置き換えるスタンドアロン Plugin、または設定互換性のために同じチャネル ID を維持するメンテナンス済みフォークです。

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

`channels.chat` が設定されている場合、OpenClaw はチャネル ID と優先 Plugin ID の両方を考慮します。低優先度の Plugin がバンドルされている、またはデフォルトで有効になっているという理由だけで選択されていた場合、OpenClaw は有効なランタイム設定内でそれを無効にし、1 つの Plugin がチャネルとそのツールを所有するようにします。明示的なユーザー選択は引き続き優先されます。ユーザーが両方の Plugin を明示的に有効にした場合、OpenClaw はその選択を保持し、要求された Plugin セットを暗黙に変更するのではなく、重複チャネル/ツール診断を報告します。

`preferOver` は、本当に同じチャネルを提供できる Plugin ID に限定してください。これは汎用の優先度フィールドではなく、ユーザー設定キーの名前変更もしません。

## modelSupport リファレンス

Plugin ランタイムが読み込まれる前に、`gpt-5.5` や `claude-sonnet-4.6` のような短縮モデル ID から OpenClaw がプロバイダー Plugin を推論すべき場合は、`modelSupport` を使用します。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw は次の優先順位を適用します。

- 明示的な `provider/model` 参照は、所有元の `providers` マニフェストメタデータを使用する
- `modelPatterns` は `modelPrefixes` より優先される
- バンドルされていない Plugin とバンドル Plugin の両方が一致する場合は、バンドルされていない Plugin が優先される
- 残りの曖昧さは、ユーザーまたは設定がプロバイダーを指定するまで無視される

フィールド:

| フィールド | 型 | 意味 |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 短縮モデル ID に対して `startsWith` で照合されるプレフィックス。 |
| `modelPatterns` | `string[]` | プロファイルサフィックスの削除後に短縮モデル ID に対して照合される正規表現ソース。 |

## modelCatalog リファレンス

Plugin ランタイムを読み込む前に OpenClaw がプロバイダーモデルメタデータを知るべき場合は、`modelCatalog` を使用します。これは、固定カタログ行、プロバイダーエイリアス、抑制ルール、検出モードに対する、マニフェスト所有のソースです。ランタイム更新は引き続きプロバイダーランタイムコードに属しますが、マニフェストはランタイムが必要になるタイミングをコアへ伝えます。

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

| フィールド | 型 | 意味 |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers` | `Record<string, object>` | この Plugin が所有するプロバイダー ID 用のカタログ行。キーはトップレベルの `providers` にも現れるべきです。 |
| `aliases` | `Record<string, object>` | カタログまたは抑制計画のために、所有されているプロバイダーへ解決されるべきプロバイダーエイリアス。 |
| `suppressions` | `object[]` | この Plugin がプロバイダー固有の理由で抑制する、別ソースからのモデル行。 |
| `discovery` | `Record<string, "static" \| "refreshable" \| "runtime">` | プロバイダーカタログをマニフェストメタデータから読み取れるか、キャッシュへ更新できるか、またはランタイムを必要とするか。 |

`aliases` は、モデルカタログ計画のためのプロバイダー所有権ルックアップに参加します。エイリアスのターゲットは、同じ Plugin が所有するトップレベルプロバイダーでなければなりません。プロバイダーでフィルターされたリストがエイリアスを使用する場合、OpenClaw は所有元マニフェストを読み取り、プロバイダーランタイムを読み込まずにエイリアスの API/ベース URL オーバーライドを適用できます。
エイリアスはフィルターされていないカタログ一覧を展開しません。広範な一覧は、所有元の正規プロバイダー行のみを出力します。

`suppressions` は、古いプロバイダーランタイムの `suppressBuiltInModel` フックを置き換えます。抑制エントリは、プロバイダーがその Plugin に所有されている場合、または所有されているプロバイダーを指す `modelCatalog.aliases` キーとして宣言されている場合にのみ適用されます。ランタイム抑制フックは、モデル解決中には呼び出されなくなりました。

プロバイダーフィールド:

| フィールド | 型 | 意味 |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string` | このプロバイダーカタログ内のモデル用の任意のデフォルトベース URL。 |
| `api` | `ModelApi` | このプロバイダーカタログ内のモデル用の任意のデフォルト API アダプター。 |
| `headers` | `Record<string, string>` | このプロバイダーカタログに適用される任意の静的ヘッダー。 |
| `models` | `object[]` | 必須のモデル行。`id` のない行は無視されます。 |

モデルフィールド:

| フィールド | 型 | 意味 |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id` | `string` | `provider/` プレフィックスを含まない、プロバイダー内ローカルのモデル ID。 |
| `name` | `string` | 任意の表示名。 |
| `api` | `ModelApi` | 任意のモデル単位 API オーバーライド。 |
| `baseUrl` | `string` | 任意のモデル単位ベース URL オーバーライド。 |
| `headers` | `Record<string, string>` | 任意のモデル単位静的ヘッダー。 |
| `input` | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | モデルが受け付けるモダリティ。 |
| `reasoning` | `boolean` | モデルが推論動作を公開するかどうか。 |
| `contextWindow` | `number` | ネイティブプロバイダーのコンテキストウィンドウ。 |
| `contextTokens` | `number` | `contextWindow` と異なる場合の、任意の有効なランタイムコンテキスト上限。 |
| `maxTokens` | `number` | 既知の場合の最大出力トークン数。 |
| `cost` | `object` | 任意の 100 万トークンあたり USD 料金。任意の `tieredPricing` を含む。 |
| `compat` | `object` | OpenClaw モデル設定互換性に一致する任意の互換性フラグ。 |
| `status` | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 一覧ステータス。行をまったく表示してはならない場合にのみ抑制します。 |
| `statusReason` | `string` | 利用可能でないステータスとともに表示される任意の理由。 |
| `replaces` | `string[]` | このモデルが置き換える古いプロバイダー内ローカルのモデル ID。 |
| `replacedBy` | `string` | 非推奨行の代替となるプロバイダー内ローカルのモデル ID。 |
| `tags` | `string[]` | ピッカーとフィルターで使用される安定したタグ。 |

抑制フィールド:

| フィールド | 型 | 意味 |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider` | `string` | 抑制するアップストリーム行のプロバイダー ID。この Plugin が所有しているか、所有エイリアスとして宣言されている必要があります。 |
| `model` | `string` | 抑制するプロバイダー内ローカルのモデル ID。 |
| `reason` | `string` | 抑制された行が直接要求された場合に表示される任意のメッセージ。 |
| `when.baseUrlHosts` | `string[]` | 抑制が適用される前に必要な、有効なプロバイダーベース URL ホストの任意のリスト。 |
| `when.providerConfigApiIn` | `string[]` | 抑制が適用される前に必要な、正確なプロバイダー設定 `api` 値の任意のリスト。 |

ランタイム専用データを `modelCatalog` に置かないでください。`static` は、マニフェスト行がプロバイダーでフィルターされた一覧とピッカーのサーフェスでレジストリ/ランタイム検出を省略できるほど十分に完全な場合にのみ使用します。マニフェスト行が一覧表示可能な有用なシードまたは補足だが、後で更新/キャッシュによってさらに行を追加できる場合は `refreshable` を使用します。refreshable 行は、それ自体では信頼できる情報源ではありません。OpenClaw が一覧を知るためにプロバイダーランタイムをロードする必要がある場合は `runtime` を使用します。

## modelIdNormalization リファレンス

プロバイダーランタイムのロード前に行う必要がある、低コストでプロバイダー所有のモデル ID クリーンアップには `modelIdNormalization` を使用します。これにより、短いモデル名、プロバイダー内のレガシー ID、プロキシ接頭辞ルールなどのエイリアスを、コアのモデル選択テーブルではなく、所有元 Plugin のマニフェストに保持できます。

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

プロバイダーフィールド:

| フィールド                           | 型                      | 意味                                                                                      |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | 大文字小文字を区別しない完全一致のモデル ID エイリアス。値は記述どおりに返されます。      |
| `stripPrefixes`                      | `string[]`              | エイリアス検索の前に削除する接頭辞。レガシーのプロバイダー/モデル重複に有用です。         |
| `prefixWhenBare`                     | `string`                | 正規化後のモデル ID にまだ `/` が含まれていない場合に追加する接頭辞。                     |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | エイリアス検索後の条件付き bare ID 接頭辞ルール。`modelPrefix` と `prefix` をキーにします。 |

## providerEndpoints リファレンス

プロバイダーランタイムのロード前に汎用リクエストポリシーが知る必要があるエンドポイント分類には `providerEndpoints` を使用します。各 `endpointClass` の意味は引き続きコアが所有します。ホストとベース URL のメタデータは Plugin マニフェストが所有します。

エンドポイントフィールド:

| フィールド                     | 型         | 意味                                                                                                 |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | `openrouter`、`moonshot-native`、`google-vertex` などの既知のコアエンドポイントクラス。              |
| `hosts`                        | `string[]` | エンドポイントクラスに対応する完全一致のホスト名。                                                   |
| `hostSuffixes`                 | `string[]` | エンドポイントクラスに対応するホスト接尾辞。ドメイン接尾辞のみの一致には `.` を接頭辞として付けます。 |
| `baseUrls`                     | `string[]` | エンドポイントクラスに対応する、正規化済みの完全一致 HTTP(S) ベース URL。                            |
| `googleVertexRegion`           | `string`   | 完全一致のグローバルホストに対する静的な Google Vertex リージョン。                                  |
| `googleVertexRegionHostSuffix` | `string`   | 一致するホストから取り除き、Google Vertex リージョン接頭辞を公開する接尾辞。                         |

## providerRequest リファレンス

プロバイダーランタイムをロードせずに汎用リクエストポリシーが必要とする、低コストのリクエスト互換性メタデータには `providerRequest` を使用します。動作固有のペイロード書き換えは、プロバイダーランタイムフックまたは共有プロバイダーファミリーヘルパーに保持します。

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

プロバイダーフィールド:

| フィールド            | 型           | 意味                                                                                          |
| --------------------- | ------------ | --------------------------------------------------------------------------------------------- |
| `family`              | `string`     | 汎用リクエスト互換性の判断と診断で使用されるプロバイダーファミリーラベル。                    |
| `compatibilityFamily` | `"moonshot"` | 共有リクエストヘルパー用の任意のプロバイダーファミリー互換性バケット。                        |
| `openAICompletions`   | `object`     | OpenAI 互換 completions リクエストフラグ。現在は `supportsStreamingUsage` です。               |

## modelPricing リファレンス

ランタイムのロード前にプロバイダーが制御プレーンの価格設定動作を制御する必要がある場合は `modelPricing` を使用します。Gateway の価格キャッシュは、プロバイダーランタイムコードをインポートせずにこのメタデータを読み取ります。

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

プロバイダーフィールド:

| フィールド   | 型                | 意味                                                                                                      |
| ------------ | ----------------- | --------------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | OpenRouter または LiteLLM の価格を決して取得すべきでないローカル/セルフホストのプロバイダーには `false` を設定します。 |
| `openRouter` | `false \| object` | OpenRouter 価格検索のマッピング。このプロバイダーの OpenRouter 検索を無効にするには `false` を指定します。 |
| `liteLLM`    | `false \| object` | LiteLLM 価格検索のマッピング。このプロバイダーの LiteLLM 検索を無効にするには `false` を指定します。       |

ソースフィールド:

| フィールド                 | 型                   | 意味                                                                                                                   |
| -------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`             | OpenClaw プロバイダー ID と異なる場合の外部カタログプロバイダー ID。たとえば `zai` プロバイダーに対する `z-ai`。      |
| `passthroughProviderModel` | `boolean`            | スラッシュを含むモデル ID をネストされたプロバイダー/モデル参照として扱います。OpenRouter などのプロキシプロバイダーに有用です。 |
| `modelIdTransforms`        | `"version-dots"[]`   | 追加の外部カタログモデル ID バリアント。`version-dots` は `claude-opus-4.6` のようなドット付きバージョン ID を試します。 |

### OpenClaw プロバイダーインデックス

OpenClaw プロバイダーインデックスは、まだ Plugin がインストールされていない可能性のあるプロバイダー向けに OpenClaw が所有するプレビュー用メタデータです。これは Plugin マニフェストの一部ではありません。Plugin マニフェストは、インストール済み Plugin の信頼できる情報源であり続けます。プロバイダー Plugin がインストールされていない場合、プロバイダーインデックスは、将来のインストール可能プロバイダーとインストール前モデルピッカーのサーフェスが利用する内部フォールバック契約です。

カタログの信頼順序:

1. ユーザー設定。
2. インストール済み Plugin マニフェストの `modelCatalog`。
3. 明示的な更新によるモデルカタログキャッシュ。
4. OpenClaw プロバイダーインデックスのプレビュー行。

プロバイダーインデックスには、シークレット、有効状態、ランタイムフック、ライブアカウント固有のモデルデータを含めてはいけません。そのプレビューカタログは Plugin マニフェストと同じ `modelCatalog` プロバイダー行の形を使用しますが、`api`、`baseUrl`、価格設定、互換性フラグなどのランタイムアダプターフィールドをインストール済み Plugin マニフェストと意図的に同期しておく場合を除き、安定した表示メタデータに限定するべきです。ライブ `/models` 検出を持つプロバイダーは、通常の一覧表示やオンボーディングでプロバイダー API を呼び出すのではなく、明示的なモデルカタログキャッシュパスを通じて更新済み行を書き込むべきです。

プロバイダーインデックスのエントリは、Plugin がコアから移動された、またはまだインストールされていないプロバイダー向けに、インストール可能 Plugin メタデータを持つこともできます。このメタデータはチャネルカタログのパターンを反映します。パッケージ名、npm インストール仕様、期待される整合性、低コストの認証選択ラベルがあれば、インストール可能なセットアップオプションを表示するには十分です。Plugin がインストールされると、そのマニフェストが優先され、そのプロバイダーのプロバイダーインデックスエントリは無視されます。

レガシーのトップレベル capability キーは非推奨です。`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` を `contracts` の下へ移動するには `openclaw doctor --fix` を使用してください。通常のマニフェスト読み込みは、これらのトップレベルフィールドを capability 所有権として扱わなくなりました。

## マニフェストと package.json

この 2 つのファイルは異なる役割を果たします。

| ファイル               | 用途                                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Plugin コードの実行前に存在する必要がある検出、設定検証、認証選択メタデータ、UI ヒント                                          |
| `package.json`         | npm メタデータ、依存関係のインストール、エントリーポイント、インストールゲート、セットアップ、カタログメタデータに使用される `openclaw` ブロック |

メタデータをどこに置くべきか不明な場合は、次のルールを使用してください。

- OpenClaw が Plugin コードをロードする前にそれを知る必要がある場合は、`openclaw.plugin.json` に置きます
- パッケージング、エントリーファイル、npm インストール動作に関するものの場合は、`package.json` に置きます

### 検出に影響する package.json フィールド

一部のランタイム前 Plugin メタデータは、意図的に `openclaw.plugin.json` ではなく `package.json` の `openclaw` ブロック下に置かれます。`openclaw.bundle` と `openclaw.bundle.json` は OpenClaw Plugin 契約ではありません。ネイティブ Plugin は `openclaw.plugin.json` と、下記のサポート対象 `package.json#openclaw` フィールドを使用する必要があります。

重要な例:

| フィールド                                                                                 | 意味                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | ネイティブPluginエントリポイントを宣言します。Pluginパッケージディレクトリ内に留まる必要があります。                                                                               |
| `openclaw.runtimeExtensions`                                                               | インストール済みパッケージ用のビルド済み JavaScript ランタイムエントリポイントを宣言します。Pluginパッケージディレクトリ内に留まる必要があります。                                |
| `openclaw.setupEntry`                                                                      | オンボーディング、遅延チャネル起動、読み取り専用チャネルステータス/SecretRef 検出で使用される軽量なセットアップ専用エントリポイントです。Pluginパッケージディレクトリ内に留まる必要があります。 |
| `openclaw.runtimeSetupEntry`                                                               | インストール済みパッケージ用のビルド済み JavaScript セットアップエントリポイントを宣言します。`setupEntry` が必要で、存在している必要があり、Pluginパッケージディレクトリ内に留まる必要があります。 |
| `openclaw.channel`                                                                         | ラベル、ドキュメントパス、エイリアス、選択時の文言などの低コストなチャネルカタログメタデータです。                                                                                 |
| `openclaw.channel.commands`                                                                | チャネルランタイムが読み込まれる前に、設定、監査、コマンド一覧サーフェスで使用される静的なネイティブコマンドとネイティブスキルの自動デフォルトメタデータです。                    |
| `openclaw.channel.configuredState`                                                         | フルチャネルランタイムを読み込まずに「環境変数のみのセットアップがすでに存在するか？」に答えられる軽量な設定済み状態チェッカーメタデータです。                                    |
| `openclaw.channel.persistedAuthState`                                                      | フルチャネルランタイムを読み込まずに「すでにサインイン済みのものがあるか？」に答えられる軽量な永続化認証チェッカーメタデータです。                                                |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | バンドル済みPluginおよび外部公開Plugin向けのインストール/更新ヒントです。                                                                                                         |
| `openclaw.install.defaultChoice`                                                           | 複数のインストール元を利用できる場合の優先インストールパスです。                                                                                                                  |
| `openclaw.install.minHostVersion`                                                          | `>=2026.3.22` や `>=2026.5.1-beta.1` のような semver 下限を使った、サポートされる最小 OpenClaw ホストバージョンです。                                                               |
| `openclaw.install.expectedIntegrity`                                                       | `sha512-...` などの期待される npm dist integrity 文字列です。インストールおよび更新フローは、取得した成果物をこれと照合して検証します。                                           |
| `openclaw.install.allowInvalidConfigRecovery`                                              | 設定が無効な場合に、限定的なバンドル済みPluginの再インストール復旧パスを許可します。                                                                                              |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | 起動時にフルチャネルPluginより前にセットアップ専用チャネルサーフェスを読み込めるようにします。                                                                                    |

マニフェストメタデータは、ランタイムが読み込まれる前のオンボーディングに表示されるプロバイダー/チャネル/セットアップの選択肢を決定します。`package.json#openclaw.install` は、ユーザーがそれらの選択肢のいずれかを選んだときに、そのPluginをどのように取得または有効化するかをオンボーディングに伝えます。インストールヒントを `openclaw.plugin.json` に移動しないでください。

`openclaw.install.minHostVersion` は、非バンドルPluginソースのインストール時とマニフェストレジストリ読み込み時に適用されます。無効な値は拒否されます。有効だが新しすぎる値の場合、古いホストでは外部Pluginがスキップされます。バンドル済みソースPluginは、ホストチェックアウトと同じバージョンで管理されているものと見なされます。

公式のオンデマンドインストールメタデータでは、Pluginが ClawHub で公開されている場合は `clawhubSpec` を使用してください。オンボーディングはそれを優先リモートソースとして扱い、インストール後に ClawHub 成果物の情報を記録します。`npmSpec` は、まだ ClawHub に移行していないパッケージ向けの互換性フォールバックとして残ります。

厳密な npm バージョン固定は、たとえば `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"` のように、すでに `npmSpec` に含まれています。公式の外部カタログエントリでは、更新フローが取得した npm 成果物が固定リリースと一致しなくなった場合に閉じた形で失敗するよう、厳密な spec と `expectedIntegrity` を組み合わせる必要があります。対話型オンボーディングは互換性のため、裸のパッケージ名や dist-tag を含む、信頼されたレジストリ npm spec も引き続き提示します。カタログ診断は、厳密、浮動、integrity 固定、integrity 欠落、パッケージ名不一致、無効なデフォルト選択ソースを区別できます。また、`expectedIntegrity` が存在する一方で、それを固定できる有効な npm ソースがない場合にも警告します。`expectedIntegrity` が存在する場合、インストール/更新フローはそれを強制します。省略されている場合、レジストリ解決は integrity 固定なしで記録されます。

チャネルPluginは、ステータス、チャネル一覧、または SecretRef スキャンがフルランタイムを読み込まずに設定済みアカウントを識別する必要がある場合、`openclaw.setupEntry` を提供する必要があります。セットアップエントリは、チャネルメタデータに加えて、セットアップ安全な設定、ステータス、シークレットアダプターを公開する必要があります。ネットワーククライアント、Gateway リスナー、トランスポートランタイムはメイン拡張エントリポイントに置いてください。

ランタイムエントリポイントフィールドは、ソースエントリポイントフィールドに対するパッケージ境界チェックを上書きしません。たとえば、`openclaw.runtimeExtensions` は、外へ抜ける `openclaw.extensions` パスを読み込み可能にはできません。

`openclaw.install.allowInvalidConfigRecovery` は意図的に限定されています。任意の壊れた設定をインストール可能にするものではありません。現時点では、バンドル済みPluginパスの欠落や、その同じバンドル済みPluginに対する古い `channels.<id>` エントリなど、特定の古いバンドル済みPluginアップグレード失敗からインストールフローを復旧できるようにするだけです。無関係な設定エラーは引き続きインストールをブロックし、オペレーターを `openclaw doctor --fix` に誘導します。

`openclaw.channel.persistedAuthState` は、小さなチェッカーモジュール用のパッケージメタデータです。

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

セットアップ、doctor、ステータス、読み取り専用プレゼンスフローが、フルチャネルPluginを読み込む前に低コストな yes/no 認証プローブを必要とする場合に使用します。永続化認証状態は設定済みチャネル状態ではありません。このメタデータを使ってPluginを自動有効化したり、ランタイム依存関係を修復したり、チャネルランタイムを読み込むべきかどうかを判断したりしないでください。対象エクスポートは、永続化状態のみを読む小さな関数である必要があります。フルチャネルランタイムのバレル経由にしないでください。

`openclaw.channel.configuredState` は、低コストな環境変数のみの設定済みチェック向けに同じ形に従います。

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

チャネルが環境変数やその他の小さな非ランタイム入力から設定済み状態を判断できる場合に使用します。チェックにフル設定解決や実際のチャネルランタイムが必要な場合は、そのロジックをPluginの `config.hasConfiguredState` フック内に残してください。

## 検出の優先順位（重複Plugin ID）

OpenClaw は複数のルート（バンドル済み、グローバルインストール、ワークスペース、明示的に設定で選択されたパス）からPluginを検出します。2つの検出結果が同じ `id` を共有する場合、**最も優先順位の高い**マニフェストだけが保持されます。優先順位の低い重複は、並べて読み込まれるのではなく破棄されます。

優先順位は高い順に次のとおりです。

1. **設定で選択** — `plugins.entries.<id>` で明示的に固定されたパス
2. **バンドル済み** — OpenClaw に同梱されるPlugin
3. **グローバルインストール** — グローバル OpenClaw PluginルートにインストールされたPlugin
4. **ワークスペース** — 現在のワークスペースに相対して検出されたPlugin

影響:

- ワークスペース内にある、バンドル済みPluginのフォークまたは古いコピーは、バンドル済みビルドをシャドーしません。
- ローカルのPluginでバンドル済みPluginを実際に上書きするには、ワークスペース検出に頼るのではなく、`plugins.entries.<id>` で固定して優先順位で勝たせてください。
- 重複の破棄はログに記録されるため、Doctor と起動診断は破棄されたコピーを指し示せます。
- 設定で選択された重複上書きは、診断では明示的な上書きとして表現されますが、古いフォークや意図しないシャドーが見えるよう、引き続き警告されます。

## JSON Schema 要件

- **すべてのPluginは JSON Schema を同梱する必要があります**。設定を受け付けない場合でも同じです。
- 空のスキーマは許容されます（たとえば `{ "type": "object", "additionalProperties": false }`）。
- スキーマはランタイムではなく、設定の読み取り/書き込み時に検証されます。
- 新しい設定キーでバンドル済みPluginを拡張またはフォークする場合は、そのPluginの `openclaw.plugin.json` の `configSchema` も同時に更新してください。バンドル済みPluginのスキーマは厳密なため、`myNewKey` を `configSchema.properties` に追加せずにユーザー設定へ `plugins.entries.<id>.config.myNewKey` を追加すると、Pluginランタイムが読み込まれる前に拒否されます。

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

## 検証の動作

- 未知の `channels.*` キーは、チャネル ID がPluginマニフェストで宣言されていない限り、**エラー**です。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny`、`plugins.slots.*` は、**検出可能な**Plugin ID を参照する必要があります。未知の ID は**エラー**です。
- Pluginがインストールされているが、マニフェストまたはスキーマが壊れているか欠落している場合、検証は失敗し、Doctor がPluginエラーを報告します。
- Plugin設定が存在していてもPluginが**無効**な場合、その設定は保持され、Doctor とログに**警告**が表示されます。

完全な `plugins.*` スキーマについては、[設定リファレンス](/ja-JP/gateway/configuration) を参照してください。

## 注記

- マニフェストは、ローカルファイルシステムからの読み込みを含む **ネイティブ OpenClaw Plugin では必須**です。ランタイムは Plugin モジュールを別途読み込みます。マニフェストは検出と検証のためだけに使われます。
- ネイティブマニフェストは JSON5 で解析されるため、最終的な値がオブジェクトである限り、コメント、末尾のカンマ、引用符なしのキーを使用できます。
- マニフェストローダーが読み取るのは、文書化されたマニフェストフィールドだけです。独自のトップレベルキーは避けてください。
- Plugin が必要としない場合、`channels`、`providers`、`cliBackends`、`skills` はすべて省略できます。
- `providerDiscoveryEntry` は軽量に保つ必要があり、広範なランタイムコードを import すべきではありません。リクエスト時の実行ではなく、静的なプロバイダーカタログメタデータまたは限定的な検出ディスクリプターに使用してください。
- 排他的な Plugin 種別は `plugins.slots.*` で選択します。`plugins.slots.memory` では `kind: "memory"`、`plugins.slots.contextEngine` では `kind: "context-engine"`（デフォルトは `legacy`）を使います。
- 排他的な Plugin 種別はこのマニフェストで宣言してください。ランタイムエントリの `OpenClawPluginDefinition.kind` は非推奨で、古い Plugin 向けの互換性フォールバックとしてのみ残されています。
- 環境変数メタデータ（`setup.providers[].envVars`、非推奨の `providerAuthEnvVars`、`channelEnvVars`）は宣言専用です。ステータス、監査、cron 配信検証、その他の読み取り専用サーフェスでは、環境変数を設定済みとして扱う前に、引き続き Plugin の信頼性と有効なアクティベーションポリシーが適用されます。
- プロバイダーコードを必要とするランタイムウィザードメタデータについては、[プロバイダーランタイムフック](/ja-JP/plugins/architecture-internals#provider-runtime-hooks)を参照してください。
- Plugin がネイティブモジュールに依存する場合は、ビルド手順とパッケージマネージャーの allowlist 要件（たとえば pnpm `allow-build-scripts` + `pnpm rebuild <package>`）を文書化してください。

## 関連

<CardGroup cols={3}>
  <Card title="Plugin の構築" href="/ja-JP/plugins/building-plugins" icon="rocket">
    Plugin のはじめに。
  </Card>
  <Card title="Plugin アーキテクチャ" href="/ja-JP/plugins/architecture" icon="diagram-project">
    内部アーキテクチャと機能モデル。
  </Card>
  <Card title="SDK の概要" href="/ja-JP/plugins/sdk-overview" icon="book">
    Plugin SDK リファレンスとサブパス import。
  </Card>
</CardGroup>

---
read_when:
    - OpenClaw Pluginを構築しています
    - Plugin の設定スキーマをリリースするか、Plugin の検証エラーをデバッグする必要がある
summary: Pluginマニフェスト + JSONスキーマの要件（厳格な設定検証）
title: Pluginマニフェスト
x-i18n:
    generated_at: "2026-07-11T22:29:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd4ab5b10108585abb9a83a416b129e6f6351023016064b5d64b66aeabd04b2f
    source_path: plugins/manifest.md
    workflow: 16
---

このページでは、**OpenClaw ネイティブ Plugin マニフェスト**である `openclaw.plugin.json` について説明します。互換バンドルレイアウト（Codex、Claude、Cursor）については、[Plugin バンドル](/ja-JP/plugins/bundles)を参照してください。

互換バンドル形式では、代わりにそれぞれ独自のマニフェストファイルを使用します。

- Codex バンドル: `.codex-plugin/plugin.json`
- Claude バンドル: `.claude-plugin/plugin.json`、またはマニフェストを使用しないデフォルトの Claude コンポーネントレイアウト
- Cursor バンドル: `.cursor-plugin/plugin.json`

OpenClaw はこれらのレイアウトを自動検出しますが、以下の `openclaw.plugin.json` スキーマに照らした検証は行いません。互換バンドルの場合、レイアウトが OpenClaw のランタイム要件と一致していれば、OpenClaw はバンドルメタデータ、宣言されたスキルルート、Claude コマンドルート、Claude の `settings.json` デフォルト、Claude LSP デフォルト、およびサポートされるフックパックを読み取ります。

すべての OpenClaw ネイティブ Plugin は、**Plugin ルート**に `openclaw.plugin.json` を**必ず**含める必要があります。OpenClaw はこれを読み取り、**Plugin コードを実行せずに**設定を検証します。マニフェストが存在しないか無効な場合、設定の検証はブロックされ、Plugin エラーとして扱われます。

Plugin システムの完全なガイドについては[Plugin](/ja-JP/tools/plugin)を、ネイティブ機能モデルと現在の外部互換性に関するガイダンスについては[機能モデル](/ja-JP/plugins/architecture#public-capability-model)を参照してください。

## このファイルの役割

`openclaw.plugin.json` は、OpenClaw が**Plugin コードを読み込む前に**読み取るメタデータです。含まれるすべての情報は、Plugin ランタイムを起動せずに低コストで検査できる必要があります。

**次の用途に使用します。**

- Plugin の識別、設定の検証、設定 UI のヒント
- 認証、オンボーディング、セットアップのメタデータ（エイリアス、自動有効化、プロバイダー環境変数、認証方法の選択肢）
- コントロールプレーンの各サーフェス向けの有効化ヒント
- モデルファミリーの短縮表記の所有権
- 静的な機能所有権のスナップショット（`contracts`）
- 共有 `openclaw qa` ホストが検査できる QA ランナーのメタデータ
- カタログおよび検証サーフェスに統合される、チャネル固有の設定メタデータ

**次の用途には使用しないでください。** ランタイム動作の登録、コードエントリポイントの宣言、npm インストールメタデータ。これらは Plugin コードと `package.json` に記述します。

## 最小構成の例

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
  "setup": {
    "providers": [
      {
        "id": "openrouter",
        "envVars": ["OPENROUTER_API_KEY"]
      }
    ]
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

## トップレベルフィールドのリファレンス

| フィールド                           | 必須     | 型                           | 意味                                                                                                                                                                                                                                                                       |
| ------------------------------------ | -------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | はい     | `string`                     | 正規 Plugin ID。`plugins.entries.<id>` で使用される ID です。                                                                                                                                                                                                              |
| `configSchema`                       | はい     | `object`                     | この Plugin の設定用インライン JSON Schema。                                                                                                                                                                                                                               |
| `requiresPlugins`                    | いいえ   | `string[]`                   | この Plugin が機能するために、併せてインストールする必要がある Plugin の ID。検出処理では Plugin を読み込み可能な状態に保ちますが、必要な Plugin が一つでも存在しない場合は警告します。                                                                                     |
| `enabledByDefault`                   | いいえ   | `true`                       | バンドル Plugin をデフォルトで有効としてマークします。省略するか、`true` 以外の値を設定すると、Plugin はデフォルトで無効になります。                                                                                                                                       |
| `enabledByDefaultOnPlatforms`        | いいえ   | `string[]`                   | バンドル Plugin を、一覧に含まれる Node.js プラットフォーム（例: `["darwin"]`）でのみデフォルトで有効としてマークします。明示的な設定が常に優先されます。                                                                                                                  |
| `legacyPluginIds`                    | いいえ   | `string[]`                   | この正規 Plugin ID に正規化される旧 ID。                                                                                                                                                                                                                                   |
| `autoEnableWhenConfiguredProviders`  | いいえ   | `string[]`                   | 認証、設定、またはモデル参照で言及された場合に、この Plugin を自動的に有効化するプロバイダー ID。                                                                                                                                                                          |
| `kind`                               | いいえ   | `PluginKind \| PluginKind[]` | `plugins.slots.*` で使用される、相互排他的な一つ以上の Plugin 種別（`"memory"`、`"context-engine"`）を宣言します。両方のスロットを所有する Plugin は、両方の種別を一つの配列で宣言します。                                                                                   |
| `channels`                           | いいえ   | `string[]`                   | この Plugin が所有するチャンネル ID。検出と設定検証に使用されます。                                                                                                                                                                                                        |
| `providers`                          | いいえ   | `string[]`                   | この Plugin が所有するプロバイダー ID。                                                                                                                                                                                                                                    |
| `providerCatalogEntry`               | いいえ   | `string`                     | Plugin ルートからの相対パスで指定する軽量なプロバイダーカタログモジュールのパス。Plugin ランタイム全体を有効化せずに読み込める、マニフェストスコープのプロバイダーカタログメタデータに使用します。                                                                         |
| `modelSupport`                       | いいえ   | `object`                     | ランタイムより前に Plugin を自動読み込みするための、マニフェスト所有の簡略モデルファミリーメタデータ。                                                                                                                                                                     |
| `modelCatalog`                       | いいえ   | `object`                     | この Plugin が所有するプロバイダー向けの宣言的モデルカタログメタデータ。Plugin ランタイムを読み込まずに、将来の読み取り専用一覧表示、オンボーディング、モデル選択、エイリアス、抑制を実現するためのコントロールプレーン契約です。                                            |
| `modelPricing`                       | いいえ   | `object`                     | プロバイダー所有の外部価格検索ポリシー。ローカルまたはセルフホスト型プロバイダーをリモート価格カタログの対象外にしたり、コアにプロバイダー ID をハードコードせずにプロバイダー参照を OpenRouter/LiteLLM のカタログ ID にマッピングしたりするために使用します。                 |
| `modelIdNormalization`               | いいえ   | `object`                     | プロバイダーランタイムの読み込み前に実行する必要がある、プロバイダー所有のモデル ID エイリアスおよびプレフィックスの整理処理。                                                                                                                                             |
| `providerEndpoints`                  | いいえ   | `object[]`                   | プロバイダーランタイムの読み込み前にコアが分類する必要があるプロバイダールート向けの、マニフェスト所有のエンドポイントホストおよび baseUrl メタデータ。                                                                                                                    |
| `providerRequest`                    | いいえ   | `object`                     | プロバイダーランタイムの読み込み前に、汎用リクエストポリシーが使用する軽量なプロバイダーファミリーおよびリクエスト互換性メタデータ。                                                                                                                                       |
| `secretProviderIntegrations`         | いいえ   | `Record<string, object>`     | コアにプロバイダー固有の統合をハードコードせずに、セットアップまたはインストール画面で提供できる、宣言的な SecretRef exec プロバイダープリセット。                                                                                                                        |
| `cliBackends`                        | いいえ   | `string[]`                   | この Plugin が所有する CLI 推論バックエンド ID。明示的な設定参照に基づく起動時の自動有効化に使用されます。                                                                                                                                                                 |
| `syntheticAuthRefs`                  | いいえ   | `string[]`                   | ランタイムの読み込み前に行うコールドモデル検出時に、Plugin 所有の合成認証フックを検査する必要があるプロバイダーまたは CLI バックエンド参照。                                                                                                                              |
| `nonSecretAuthMarkers`               | いいえ   | `string[]`                   | 非シークレットのローカル認証、OAuth、または環境由来の認証情報状態を表す、バンドル Plugin 所有のプレースホルダー API キー値。                                                                                                                                               |
| `commandAliases`                     | いいえ   | `object[]`                   | この Plugin が所有し、ランタイムの読み込み前に Plugin 対応の設定および CLI 診断を生成する必要があるコマンド名。                                                                                                                                                            |
| `providerAuthEnvVars`                | いいえ   | `Record<string, string[]>`   | プロバイダーの認証およびステータス検索向けの非推奨の互換環境変数メタデータ。新しい Plugin では `setup.providers[].envVars` を優先してください。OpenClaw は非推奨期間中、引き続きこれを読み取ります。                                                                       |
| `providerUsageAuthEnvVars`           | いいえ   | `Record<string, string[]>`   | 使用量および請求専用のプロバイダー認証情報。OpenClaw はこれらの名前を使用量の検出とシークレットの除去に使用しますが、推論認証には決して使用しません。                                                                                                                       |
| `providerAuthAliases`                | いいえ   | `Record<string, string>`     | 認証検索に別のプロバイダー ID を再利用するプロバイダー ID。たとえば、基盤プロバイダーの API キーと認証プロファイルを共有するコーディングプロバイダーに使用します。                                                                                                         |
| `channelEnvVars`                     | いいえ   | `Record<string, string[]>`   | Plugin コードを読み込まずに OpenClaw が検査できる軽量なチャンネル環境変数メタデータ。汎用の起動処理および設定ヘルパーから参照する必要がある、環境変数駆動のチャンネルセットアップまたは認証画面に使用します。                                                               |
| `providerAuthChoices`                | いいえ   | `object[]`                   | オンボーディングの選択画面、優先プロバイダーの解決、および単純な CLI フラグ接続向けの軽量な認証選択肢メタデータ。                                                                                                                                                          |
| `activation`                         | いいえ   | `object`                     | 起動、プロバイダー、コマンド、チャンネル、ルート、および機能によってトリガーされる読み込み向けの軽量な有効化プランナーメタデータ。これはメタデータのみであり、実際の動作は引き続き Plugin ランタイムが所有します。                                                          |
| `setup`                              | いいえ   | `object`                     | Plugin ランタイムを読み込まずに、検出処理およびセットアップ画面が検査できる軽量なセットアップおよびオンボーディング記述子。                                                                                                                                                |
| `qaRunners`                          | いいえ   | `object[]`                   | Plugin ランタイムの読み込み前に、共有 `openclaw qa` ホストが使用する軽量な QA ランナー記述子。                                                                                                                                                                             |
| `contracts`                          | いいえ   | `object`                     | 外部認証フック、埋め込み、音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像・動画・音楽生成、Web 取得、Web 検索、ワーカープロバイダー、文書・Web コンテンツ抽出、およびツール所有権に関する静的な機能所有権スナップショット。                               |
| `configContracts`                    | いいえ   | `object`                     | 汎用コアヘルパーが使用する、マニフェスト所有の設定動作です。危険なフラグの検出、SecretRef の移行先、および旧設定パスの絞り込みを定義します。[configContracts リファレンス](#configcontracts-reference)を参照してください。                                                   |
| `mediaUnderstandingProviderMetadata` | いいえ | `Record<string, object>` | `contracts.mediaUnderstandingProviders` で宣言されたプロバイダー ID 用の軽量なメディア理解デフォルト。 |
| `imageGenerationProviderMetadata`    | いいえ | `Record<string, object>` | `contracts.imageGenerationProviders` で宣言されたプロバイダー ID 用の軽量な画像生成認証メタデータ。プロバイダー所有の認証エイリアスとベース URL ガードを含みます。 |
| `videoGenerationProviderMetadata`    | いいえ | `Record<string, object>` | `contracts.videoGenerationProviders` で宣言されたプロバイダー ID 用の軽量な動画生成認証メタデータ。プロバイダー所有の認証エイリアスとベース URL ガードを含みます。 |
| `musicGenerationProviderMetadata`    | いいえ | `Record<string, object>` | `contracts.musicGenerationProviders` で宣言されたプロバイダー ID 用の軽量な音楽生成認証メタデータ。プロバイダー所有の認証エイリアスとベース URL ガードを含みます。 |
| `toolMetadata`                       | いいえ | `Record<string, object>` | `contracts.tools` で宣言された Plugin 所有ツール用の軽量な利用可否メタデータ。設定、環境変数、または認証の根拠が存在しない限り、ツールがランタイムを読み込むべきでない場合に使用します。 |
| `channelConfigs`                     | いいえ | `Record<string, object>` | ランタイムの読み込み前に、検出および検証サーフェスへマージされる、マニフェスト所有のチャンネル設定メタデータ。 |
| `skills`                             | いいえ | `string[]` | 読み込む Skill ディレクトリ。Plugin ルートからの相対パスです。 |
| `name`                               | いいえ | `string` | 人が読める Plugin 名。 |
| `description`                        | いいえ | `string` | Plugin サーフェスに表示される短い概要。 |
| `catalog`                            | いいえ | `object` | Plugin カタログサーフェス向けの任意の表示ヒント。このメタデータによって Plugin がインストール、有効化、または信頼の付与をされることはありません。 |
| `icon`                               | いいえ | `string` | マーケットプレイス／カタログカード用の HTTPS 画像 URL。ClawHub は有効な任意の `https://` URL を受け付け、省略されているか無効な場合はデフォルトの Plugin アイコンを使用します。 |
| `version`                            | いいえ | `string` | 情報提供用の Plugin バージョン。 |
| `uiHints`                            | いいえ | `Record<string, object>` | 設定フィールド用の UI ラベル、プレースホルダー、および機密性ヒント。 |

## catalog リファレンス

`catalog` は、Plugin ブラウザー向けの任意の表示ヒントを提供します。ホストはこれらのヒントを無視できます。これらによって Plugin がインストールまたは有効化されることはなく、実行時の動作や信頼レベルも変更されません。

```json
{
  "catalog": {
    "featured": true,
    "order": 10
  }
}
```

| フィールド | 型        | 意味                                                                       |
| ---------- | --------- | -------------------------------------------------------------------------- |
| `featured` | `boolean` | カタログ画面でこの Plugin を注目項目として表示するかどうか。               |
| `order`    | `number`  | 選定された Plugin 間の昇順表示ヒント。値が小さいほど先に表示されます。     |

## 生成プロバイダーのメタデータリファレンス

生成プロバイダーのメタデータフィールドは、対応する `contracts.*GenerationProviders` リストで宣言されたプロバイダーの静的認証シグナルを記述します。OpenClaw はプロバイダーのランタイムが読み込まれる前にこれらのフィールドを読み取るため、コアツールはすべてのプロバイダー Plugin をインポートせずに、生成プロバイダーが利用可能かどうかを判断できます。

これらのフィールドは、低コストで宣言的な事実にのみ使用してください。トランスポート、リクエスト変換、トークン更新、認証情報の検証、実際の生成動作は Plugin のランタイムが引き続き担います。

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

各メタデータエントリは次のフィールドに対応しています。

| フィールド             | 必須   | 型         | 意味                                                                                                                                                                        |
| ---------------------- | ------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | いいえ | `string[]` | 生成プロバイダーの静的認証エイリアスとして扱う追加のプロバイダー ID。                                                                                                      |
| `authProviders`        | いいえ | `string[]` | 設定済みの認証プロファイルを、この生成プロバイダーの認証として扱うプロバイダー ID。                                                                                         |
| `configSignals`        | いいえ | `object[]` | 認証プロファイルや環境変数なしで設定できる、ローカルまたはセルフホスト型プロバイダー向けの低コストな設定専用可用性シグナル。                                                  |
| `authSignals`          | いいえ | `object[]` | 明示的な認証シグナル。指定した場合、プロバイダー ID、`aliases`、`authProviders` から生成されるデフォルトのシグナルセットを置き換えます。                                      |
| `referenceAudioInputs` | いいえ | `boolean`  | 動画生成専用。プロバイダーが参照音声アセットを受け入れる場合は `true` に設定します。それ以外の場合、`video_generate` は音声参照パラメーターを非表示にします。                |

各 `configSignals` エントリは次のフィールドに対応しています。

| フィールド       | 必須   | 型         | 意味                                                                                                                                                                                                             |
| ---------------- | ------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | はい   | `string`   | 検査する Plugin 所有の設定オブジェクトへのドットパス（例: `plugins.entries.example.config`）。                                                                                                                    |
| `overlayPath`    | いいえ | `string`   | シグナルの評価前に、ルートオブジェクトへオーバーレイするオブジェクトを指す、ルート設定内のドットパス。`image`、`video`、`music` など、機能固有の設定に使用します。                                                |
| `overlayMapPath` | いいえ | `string`   | 各オブジェクト値をルートオブジェクトへオーバーレイする、ルート設定内のドットパス。`accounts` などの名前付きアカウントマップで、設定済みのいずれかのアカウントを適格とする場合に使用します。                         |
| `required`       | いいえ | `string[]` | 有効な設定内で、設定済みの値を持つ必要があるドットパス。文字列は空であってはならず、オブジェクトと配列も空であってはなりません。                                                                                  |
| `requiredAny`    | いいえ | `string[]` | 有効な設定内で、少なくとも 1 つが設定済みの値を持つ必要があるドットパス。                                                                                                                                        |
| `mode`           | いいえ | `object`   | 有効な設定内の任意の文字列モードガード。設定専用の可用性が 1 つのモードにのみ適用される場合に使用します。                                                                                                        |

各 `mode` ガードは次のフィールドに対応しています。

| フィールド   | 必須   | 型         | 意味                                                                                       |
| ------------ | ------ | ---------- | ------------------------------------------------------------------------------------------ |
| `path`       | いいえ | `string`   | 有効な設定内のドットパス。デフォルトは `mode` です。                                       |
| `default`    | いいえ | `string`   | 設定でパスが省略されている場合に使用するモード値。                                         |
| `allowed`    | いいえ | `string[]` | 指定した場合、有効なモードがこれらの値のいずれかである場合にのみシグナルが成立します。       |
| `disallowed` | いいえ | `string[]` | 指定した場合、有効なモードがこれらの値のいずれかであるとシグナルは成立しません。             |

各 `authSignals` エントリは次のフィールドに対応しています。

| フィールド        | 必須   | 型       | 意味                                                                                                                                                          |
| ----------------- | ------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | はい   | `string` | 設定済みの認証プロファイル内で確認するプロバイダー ID。                                                                                                       |
| `providerBaseUrl` | いいえ | `object` | 参照先の設定済みプロバイダーが許可されたベース URL を使用している場合にのみ、シグナルを有効とする任意のガード。認証エイリアスが特定の API にのみ有効な場合に使用します。 |

各 `providerBaseUrl` ガードは次のフィールドに対応しています。

| フィールド        | 必須   | 型         | 意味                                                                                                                                                     |
| ----------------- | ------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | はい   | `string`   | `baseUrl` を確認するプロバイダー設定 ID。                                                                                                                |
| `defaultBaseUrl`  | いいえ | `string`   | プロバイダー設定で `baseUrl` が省略されている場合に想定するベース URL。                                                                                  |
| `allowedBaseUrls` | はい   | `string[]` | この認証シグナルで許可されるベース URL。設定済みまたはデフォルトのベース URL が、正規化されたこれらの値のいずれにも一致しない場合、シグナルは無視されます。 |

## ツールメタデータのリファレンス

`toolMetadata` は、ツール名をキーとして、生成プロバイダーのメタデータと同じ `configSignals` および `authSignals` の形式を使用します。`contracts.tools` は所有権を宣言します。`toolMetadata` は低コストな可用性の証拠を宣言するため、OpenClaw はツールファクトリーが `null` を返すか確認するためだけに Plugin のランタイムをインポートせずに済みます。

```json
{
  "setup": {
    "providers": [
      {
        "id": "example",
        "envVars": ["EXAMPLE_API_KEY"]
      }
    ]
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

`toolMetadata` エントリでは、上記の共通 `configSignals` / `authSignals` フィールドに加えて、`optional`（Plugin の有効化に必須ではないツールとしてマーク）と `replaySafe`（モデルのターンが不完全に終了した後でも、安全に再実行できるツールとしてマーク）も指定できます。

ツールに `toolMetadata` がない場合、OpenClaw は既存の動作を維持し、ツールコントラクトがポリシーに一致すると所有元の Plugin を読み込みます。ファクトリーが認証や設定に依存するホットパスのツールでは、コアが問い合わせのためにランタイムをインポートするようにするのではなく、Plugin の作成者が `toolMetadata` を宣言する必要があります。

## providerAuthChoices リファレンス

各 `providerAuthChoices` エントリは、1 つのオンボーディングまたは認証の選択肢を記述します。OpenClaw はプロバイダーのランタイムが読み込まれる前にこれを読み取ります。プロバイダーのセットアップ一覧では、プロバイダーのランタイムを読み込まずに、これらのマニフェストの選択肢、記述子から導出されたセットアップの選択肢、インストールカタログのメタデータを使用します。

| フィールド            | 必須 | 型                                                                    | 意味                                                                                                                  |
| --------------------- | ---- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `provider`            | はい | `string`                                                              | この選択肢が属するプロバイダー ID。                                                                                   |
| `method`              | はい | `string`                                                              | ディスパッチ先の認証方式 ID。                                                                                         |
| `choiceId`            | はい | `string`                                                              | オンボーディングおよび CLI フローで使用される安定した認証選択肢 ID。                                                 |
| `choiceLabel`         | いいえ | `string`                                                            | ユーザー向けラベル。省略した場合、OpenClaw は `choiceId` を使用する。                                                 |
| `choiceHint`          | いいえ | `string`                                                            | 選択画面用の短い補助テキスト。                                                                                        |
| `assistantPriority`   | いいえ | `number`                                                            | アシスタント主導の対話型選択画面では、値が小さいほど先に並ぶ。                                                       |
| `assistantVisibility` | いいえ | `"visible"` \| `"manual-only"`                                      | 手動での CLI 選択は許可したまま、アシスタントの選択画面では選択肢を非表示にする。                                    |
| `deprecatedChoiceIds` | いいえ | `string[]`                                                          | ユーザーをこの代替選択肢にリダイレクトする必要がある旧形式の選択肢 ID。                                              |
| `groupId`             | いいえ | `string`                                                            | 関連する選択肢をグループ化するための任意のグループ ID。                                                              |
| `groupLabel`          | いいえ | `string`                                                            | そのグループのユーザー向けラベル。                                                                                    |
| `groupHint`           | いいえ | `string`                                                            | グループ用の短い補助テキスト。                                                                                        |
| `onboardingFeatured`  | いいえ | `boolean`                                                           | 対話型オンボーディング選択画面で、このグループを「More...」項目より前の注目階層に表示する。                           |
| `optionKey`           | いいえ | `string`                                                            | 単一フラグによる単純な認証フロー用の内部オプションキー。                                                              |
| `cliFlag`             | いいえ | `string`                                                            | `--openrouter-api-key` などの CLI フラグ名。                                                                          |
| `cliOption`           | いいえ | `string`                                                            | `--openrouter-api-key <key>` などの完全な CLI オプション形式。                                                        |
| `cliDescription`      | いいえ | `string`                                                            | CLI ヘルプで使用される説明。                                                                                          |
| `onboardingScopes`    | いいえ | `Array<"text-inference" \| "image-generation" \| "music-generation">` | この選択肢を表示するオンボーディング画面。省略した場合、デフォルトは `["text-inference"]`。                            |

## commandAliases リファレンス

Plugin がランタイムコマンド名を所有し、ユーザーが誤ってその名前を `plugins.allow` に指定したり、ルート CLI コマンドとして実行しようとしたりする可能性がある場合は、`commandAliases` を使用する。OpenClaw は、Plugin のランタイムコードをインポートせずに、このメタデータを診断に使用する。

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

| フィールド   | 必須   | 型                | 意味                                                                             |
| ------------ | ------ | ----------------- | -------------------------------------------------------------------------------- |
| `name`       | はい   | `string`          | この Plugin に属するコマンド名。                                                 |
| `kind`       | いいえ | `"runtime-slash"` | エイリアスがルート CLI コマンドではなく、チャットのスラッシュコマンドであることを示す。 |
| `cliCommand` | いいえ | `string`          | 存在する場合、CLI 操作用に提案する関連ルート CLI コマンド。                      |

## activation リファレンス

Plugin が、どのコントロールプレーンイベントで自身を有効化／読み込み計画に含めるべきかを低コストで宣言できる場合は、`activation` を使用する。

このブロックはプランナー用メタデータであり、ライフサイクル API ではない。ランタイム動作を登録せず、`register(...)` の代わりにもならず、Plugin コードがすでに実行済みであることも保証しない。有効化プランナーはこれらのフィールドを使用して候補 Plugin を絞り込み、その後、`providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools`、フックなどの既存のマニフェスト所有権メタデータにフォールバックする。

すでに所有権を表している最も限定的なメタデータを優先する。関係を表現できる場合は、`providers`、`channels`、`commandAliases`、セットアップ記述子、または `contracts` を使用する。それらの所有権フィールドでは表現できない追加のプランナーヒントには、`activation` を使用する。`claude-cli`、`my-cli`、`google-gemini-cli` などの CLI ランタイムエイリアスには、トップレベルの `cliBackends` を使用する。`activation.onAgentHarnesses` は、既存の所有権フィールドを持たない組み込みエージェントハーネス ID 専用である。

すべての Plugin は、`activation.onStartup` を意図的に設定する必要がある。Gateway の起動中に Plugin を実行する必要がある場合にのみ、`true` に設定する。起動時には何もせず、より限定的なトリガーによってのみ読み込む場合は、`false` に設定する。`onStartup` を省略しても、Plugin が暗黙的に起動時に読み込まれることはなくなった。起動、チャンネル、設定、エージェントハーネス、メモリ、またはその他のより限定的な有効化トリガーには、明示的な有効化メタデータを使用する。

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

| フィールド         | 必須   | 型                                                   | 意味                                                                                                                                                                                              |
| ------------------ | ------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | いいえ | `boolean`                                            | 明示的な Gateway 起動時の有効化。すべての Plugin がこれを設定する必要がある。`true` の場合は起動中に Plugin をインポートし、`false` の場合は一致する別のトリガーによって読み込みが必要になるまで起動時の遅延読み込みを維持する。 |
| `onProviders`      | いいえ | `string[]`                                           | 有効化／読み込み計画にこの Plugin を含めるプロバイダー ID。                                                                                                                                        |
| `onAgentHarnesses` | いいえ | `string[]`                                           | 有効化／読み込み計画にこの Plugin を含める組み込みエージェントハーネスのランタイム ID。CLI バックエンドのエイリアスには、トップレベルの `cliBackends` を使用する。                                  |
| `onCommands`       | いいえ | `string[]`                                           | 有効化／読み込み計画にこの Plugin を含めるコマンド ID。                                                                                                                                            |
| `onChannels`       | いいえ | `string[]`                                           | 有効化／読み込み計画にこの Plugin を含めるチャンネル ID。                                                                                                                                          |
| `onRoutes`         | いいえ | `string[]`                                           | 有効化／読み込み計画にこの Plugin を含めるルート種別。                                                                                                                                             |
| `onConfigPaths`    | いいえ | `string[]`                                           | パスが存在し、明示的に無効化されていない場合に、起動／読み込み計画にこの Plugin を含めるルート相対の設定パス。                                                                                      |
| `onCapabilities`   | いいえ | `Array<"provider" \| "channel" \| "tool" \| "hook">` | コントロールプレーンの有効化計画で使用される広範なケイパビリティヒント。可能な場合は、より限定的なフィールドを優先する。                                                                           |

現在の実運用コンシューマー:

- Gateway の起動計画では、明示的な起動時インポートに `activation.onStartup` を使用する。
- コマンドをトリガーとする CLI 計画では、旧形式の `commandAliases[].cliCommand` または `commandAliases[].name` にフォールバックする。
- エージェントランタイムの起動計画では、組み込みハーネスに `activation.onAgentHarnesses` を使用し、CLI ランタイムエイリアスにトップレベルの `cliBackends[]` を使用する。
- チャンネルをトリガーとするセットアップ／チャンネル計画では、明示的なチャンネル有効化メタデータがない場合、旧形式の `channels[]` 所有権にフォールバックする。
- 起動時の Plugin 計画では、バンドルされたブラウザー Plugin の `browser` ブロックなど、チャンネル以外のルート設定領域に `activation.onConfigPaths` を使用する。
- プロバイダーをトリガーとするセットアップ／ランタイム計画では、明示的なプロバイダー有効化メタデータがない場合、旧形式の `providers[]` およびトップレベルの `cliBackends[]` 所有権にフォールバックする。

プランナー診断では、明示的な有効化ヒントとマニフェスト所有権へのフォールバックを区別できる。たとえば、`activation-command-hint` は `activation.onCommands` が一致したことを意味し、`manifest-command-alias` はプランナーが代わりに `commandAliases` の所有権を使用したことを意味する。これらの理由ラベルはホスト診断およびテスト用である。Plugin 作成者は、所有権を最も適切に表すメタデータを引き続き宣言する必要がある。

## qaRunners リファレンス

Plugin が共有の `openclaw qa` ルート配下に 1 つ以上のトランスポートランナーを提供する場合は、`qaRunners` を使用する。このメタデータは軽量かつ静的に保つ。実際の CLI 登録は、対応する `qaRunnerCliRegistrations` をエクスポートする軽量な `runtime-api.ts` インターフェースを通じて、引き続き Plugin ランタイムが所有する。任意の `adapterFactory` は、登録済みコマンドのランナーを変更せずに、トランスポートを共有 QA シナリオに公開する。

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

| フィールド    | 必須   | 型       | 意味                                                                                 |
| ------------- | ------ | -------- | ------------------------------------------------------------------------------------ |
| `commandName` | はい   | `string` | `openclaw qa` 配下にマウントされるサブコマンド。例: `matrix`。                       |
| `description` | いいえ | `string` | 共有ホストがスタブコマンドを必要とする場合に使用されるフォールバック用ヘルプテキスト。 |

`adapterFactory` の id は `commandName` と一致する必要があります。マニフェストに存在しないコマンドの登録をエクスポートしないでください。

## setup リファレンス

ランタイムの読み込み前に、セットアップとオンボーディングのサーフェスで低コストな Plugin 所有のメタデータが必要な場合は、`setup` を使用します。

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

トップレベルの `cliBackends` は引き続き有効で、CLI 推論バックエンドを記述します。`setup.cliBackends` は、メタデータのみに留めるべきコントロールプレーン／セットアップフロー向けの、セットアップ固有の記述子サーフェスです。

`setup.providers` と `setup.cliBackends` が存在する場合、セットアップ検出では、記述子を優先する検索サーフェスとしてこれらが推奨されます。記述子が候補 Plugin を絞り込むだけで、セットアップ時にさらに高度なランタイムフックが必要な場合は、`requiresRuntime: true` を設定し、フォールバック実行パスとして `setup-api` を維持してください。

OpenClaw は、汎用的なプロバイダー認証と環境変数の検索にも `setup.providers[].envVars` を含めます。`providerAuthEnvVars` は非推奨期間中、互換アダプターを通じて引き続きサポートされますが、これを使用し続けるバンドル外の Plugin にはマニフェスト診断が表示されます。新しい Plugin では、セットアップ／ステータス用の環境変数メタデータを `setup.providers[].envVars` に配置してください。

課金または組織レベルの資格情報によって、推論用資格情報として扱わずに `resolveUsageAuth` を有効化する必要がある場合は、`providerUsageAuthEnvVars` を使用します。これらの名前は、ワークスペースの dotenv ブロック、ACP 子プロセスからの除去、サンドボックスのシークレットフィルタリング、および広範なシークレット消去の対象になります。プロバイダーランタイムは、引き続き `resolveUsageAuth` 内で値を読み取り、分類します。

セットアップエントリがない場合、または `setup.requiresRuntime: false` によりセットアップランタイムが不要と宣言されている場合、OpenClaw は `setup.providers[].authMethods` から単純なセットアップ選択肢を導出することもできます。カスタムラベル、CLI フラグ、オンボーディングのスコープ、アシスタントのメタデータには、明示的な `providerAuthChoices` エントリが引き続き優先されます。

これらの記述子だけでセットアップサーフェスに十分な場合に限り、`requiresRuntime: false` を設定してください。OpenClaw は明示的な `false` を記述子のみの契約として扱い、セットアップ検索のために `setup-api` または `openclaw.setupEntry` を実行しません。記述子のみの Plugin がこれらのセットアップランタイムエントリのいずれかを提供している場合でも、OpenClaw は追加診断を報告し、そのエントリを引き続き無視します。`requiresRuntime` を省略すると従来のフォールバック動作が維持されるため、フラグなしで記述子を追加した既存の Plugin が破損することはありません。

セットアップ検索では Plugin 所有の `setup-api` コードを実行できるため、正規化された `setup.providers[].id` と `setup.cliBackends[]` の値は、検出されたすべての Plugin 間で一意である必要があります。所有者が曖昧な場合、検出順から優先対象を選ぶのではなく、フェイルクローズします。

セットアップランタイムが実行される場合、`setup-api` がマニフェスト記述子に宣言されていないプロバイダーまたは CLI バックエンドを登録したとき、あるいは記述子に対応するランタイム登録がないとき、セットアップレジストリ診断は記述子の不一致を報告します。これらの診断は追加的なものであり、従来の Plugin を拒否するものではありません。

### setup.providers リファレンス

| フィールド       | 必須     | 型         | 意味                                                                                          |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | はい      | `string`   | セットアップまたはオンボーディング中に公開されるプロバイダー id。正規化された id をグローバルで一意に保ってください。 |
| `authMethods`  | いいえ    | `string[]` | 完全なランタイムを読み込まずに、このプロバイダーがサポートするセットアップ／認証方式の id。           |
| `envVars`      | いいえ    | `string[]` | Plugin ランタイムの読み込み前に、汎用セットアップ／ステータスサーフェスが確認できる環境変数。         |
| `authEvidence` | いいえ    | `object[]` | 非シークレットマーカーを通じて認証できるプロバイダー向けの、低コストなローカル認証証拠チェック。     |

`authEvidence` は、ランタイムコードを読み込まずに検証できる、プロバイダー所有のローカル資格情報マーカー用です。これらのチェックは低コストかつローカルに留める必要があります。ネットワーク呼び出し、キーチェーンまたはシークレットマネージャーの読み取り、シェルコマンド、およびプロバイダー API のプローブは使用できません。

サポートされる証拠エントリ：

| フィールド           | 必須     | 型         | 意味                                                                                                 |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | はい      | `string`   | 現在は `local-file-with-env`。                                                                                |
| `fileEnvVar`       | いいえ    | `string`   | 明示的な資格情報ファイルパスを含む環境変数。                                                                   |
| `fallbackPaths`    | いいえ    | `string[]` | `fileEnvVar` が存在しないか空の場合に確認されるローカル資格情報ファイルパス。`${HOME}` と `${APPDATA}` をサポートします。 |
| `requiresAnyEnv`   | いいえ    | `string[]` | 証拠が有効になるには、列挙された環境変数のうち少なくとも 1 つが空でない必要があります。                           |
| `requiresAllEnv`   | いいえ    | `string[]` | 証拠が有効になるには、列挙されたすべての環境変数が空でない必要があります。                                      |
| `credentialMarker` | はい      | `string`   | 証拠が存在する場合に返される非シークレットマーカー。                                                           |
| `source`           | いいえ    | `string`   | 認証／ステータス出力用のユーザー向けソースラベル。                                                             |

### setup フィールド

| フィールド           | 必須     | 型         | 意味                                                                                           |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | いいえ    | `object[]` | セットアップとオンボーディング中に公開されるプロバイダーセットアップ記述子。                           |
| `cliBackends`      | いいえ    | `string[]` | 記述子を優先するセットアップ検索に使用される、セットアップ時のバックエンド id。正規化された id をグローバルで一意に保ってください。 |
| `configMigrations` | いいえ    | `string[]` | この Plugin のセットアップサーフェスが所有する設定移行 id。                                          |
| `requiresRuntime`  | いいえ    | `boolean`  | 記述子検索後もセットアップに `setup-api` の実行が必要かどうか。                                      |

## uiHints リファレンス

`uiHints` は、設定フィールド名から小さなレンダリングヒントへのマップです。ネストされた設定フィールドにはドット区切りのキーを使用できますが、パスセグメントに `__proto__`、`constructor`、または `prototype` を含めることはできず、セットアップはこれらの名前を拒否します。

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

各フィールドヒントには、次の項目を含めることができます。

| フィールド      | 型         | 意味                              |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | ユーザー向けのフィールドラベル。         |
| `help`        | `string`   | 短いヘルプテキスト。                     |
| `tags`        | `string[]` | 任意の UI タグ。                         |
| `advanced`    | `boolean`  | フィールドを詳細設定としてマークします。 |
| `sensitive`   | `boolean`  | フィールドをシークレットまたは機密としてマークします。 |
| `placeholder` | `string`   | フォーム入力用のプレースホルダーテキスト。 |

## contracts リファレンス

Plugin ランタイムをインポートせずに OpenClaw が読み取れる、静的な機能所有権メタデータに限り `contracts` を使用します。

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["openclaw", "codex"],
    "trustedToolPolicies": ["workflow-budget"],
    "externalAuthProviders": ["acme-ai"],
    "embeddingProviders": ["openai-compatible"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "musicGenerationProviders": ["stability-audio"],
    "documentExtractors": ["example-docs"],
    "webContentExtractors": ["firecrawl"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "workerProviders": ["example-worker"],
    "usageProviders": ["acme-ai"],
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

各リストは任意です。

| フィールド                        | 型         | 意味                                                                                                                                 |
| --------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedExtensionFactories`      | `string[]` | Codex app-server 拡張ファクトリー ID。現在は `codex-app-server`。                                                                   |
| `agentToolResultMiddleware`       | `string[]` | この Plugin がツール結果ミドルウェアを登録できるランタイム ID。                                                                     |
| `trustedToolPolicies`             | `string[]` | インストール済み Plugin が登録できる、Plugin ローカルの信頼済みツール実行前ポリシー ID。同梱 Plugin はこのフィールドなしでポリシーを登録できます。 |
| `externalAuthProviders`           | `string[]` | この Plugin が外部認証プロファイルフックを所有するプロバイダー ID。                                                                 |
| `embeddingProviders`              | `string[]` | メモリを含む再利用可能なベクトル埋め込み用途向けに、この Plugin が所有する汎用埋め込みプロバイダー ID。                               |
| `speechProviders`                 | `string[]` | この Plugin が所有する音声プロバイダー ID。                                                                                          |
| `realtimeTranscriptionProviders`  | `string[]` | この Plugin が所有するリアルタイム文字起こしプロバイダー ID。                                                                       |
| `realtimeVoiceProviders`          | `string[]` | この Plugin が所有するリアルタイム音声プロバイダー ID。                                                                              |
| `memoryEmbeddingProviders`        | `string[]` | この Plugin が所有する、非推奨のメモリ固有埋め込みプロバイダー ID。                                                                  |
| `mediaUnderstandingProviders`     | `string[]` | この Plugin が所有するメディア理解プロバイダー ID。                                                                                  |
| `transcriptSourceProviders`       | `string[]` | この Plugin が所有する文字起こしソースプロバイダー ID。                                                                              |
| `documentExtractors`              | `string[]` | この Plugin が所有するドキュメント（PDF など）抽出プロバイダー ID。                                                                  |
| `imageGenerationProviders`        | `string[]` | この Plugin が所有する画像生成プロバイダー ID。                                                                                      |
| `videoGenerationProviders`        | `string[]` | この Plugin が所有する動画生成プロバイダー ID。                                                                                      |
| `musicGenerationProviders`        | `string[]` | この Plugin が所有する音楽生成プロバイダー ID。                                                                                      |
| `webContentExtractors`            | `string[]` | この Plugin が所有する Web ページコンテンツ抽出プロバイダー ID。                                                                    |
| `webFetchProviders`               | `string[]` | この Plugin が所有する Web 取得プロバイダー ID。                                                                                     |
| `webSearchProviders`              | `string[]` | この Plugin が所有する Web 検索プロバイダー ID。                                                                                     |
| `workerProviders`                 | `string[]` | プロビジョニングとプロファイルに基づくリースのライフサイクルのために、この Plugin が所有するクラウドワーカープロバイダー ID。       |
| `usageProviders`                  | `string[]` | この Plugin が使用量認証フックと使用量スナップショットフックを所有するプロバイダー ID。                                             |
| `migrationProviders`              | `string[]` | この Plugin が `openclaw migrate` 用に所有するインポートプロバイダー ID。                                                           |
| `gatewayMethodDispatch`           | `string[]` | プロセス内で Gateway メソッドをディスパッチする、認証済み Plugin HTTP ルート用に予約された権限。                                    |
| `tools`                           | `string[]` | この Plugin が所有するエージェントツール名。                                                                                         |

`contracts.embeddedExtensionFactories` は、同梱の Codex app-server 専用拡張ファクトリー用として維持されています。同梱のツール結果変換は、代わりに `contracts.agentToolResultMiddleware` を宣言し、`api.registerAgentToolResultMiddleware(...)` で登録する必要があります。インストール済み Plugin は、明示的に有効化され、かつ `contracts.agentToolResultMiddleware` で宣言したランタイムに限り、同じミドルウェア接続点を使用できます。

ホストが信頼するツール実行前ポリシー層を必要とするインストール済み Plugin は、登録する各ローカル ID を `contracts.trustedToolPolicies` で宣言し、明示的に有効化される必要があります。同梱 Plugin は既存の信頼済みポリシー経路を引き続き使用できますが、未宣言のポリシー ID を持つインストール済み Plugin は登録前に拒否されます。ポリシー ID は登録元 Plugin のスコープ内にあるため、2 つの Plugin がともに `workflow-budget` を宣言して登録できますが、単一の Plugin が同じローカル ID を 2 回登録することはできません。

実行時の `api.registerTool(...)` 登録は `contracts.tools` と一致する必要があります。ツール検出ではこのリストを使用し、要求されたツールを所有できる Plugin ランタイムだけを読み込みます。

`resolveExternalAuthProfiles` を実装するプロバイダー Plugin は、`contracts.externalAuthProviders` を宣言する必要があります。未宣言の外部認証フックは無視されます。

`resolveUsageAuth` と `fetchUsageSnapshot` の両方を実装するプロバイダー Plugin は、自動検出される各プロバイダー ID を `contracts.usageProviders` で宣言する必要があります。使用量検出では、ランタイムコードを読み込む前にこの契約を参照し、宣言された所有者だけを読み込んだ後で両方のフックを検証します。

汎用埋め込みプロバイダーは、`api.registerEmbeddingProvider(...)` で登録する各アダプターについて `contracts.embeddingProviders` を宣言する必要があります。メモリ検索で利用されるプロバイダーを含む、再利用可能なベクトル生成には汎用契約を使用してください。`contracts.memoryEmbeddingProviders` は非推奨のメモリ固有互換機能であり、既存プロバイダーが汎用埋め込みプロバイダー接続点へ移行する間だけ維持されます。

ワーカープロバイダーは、`api.registerWorkerProvider(...)` の各 ID を `contracts.workerProviders` で宣言する必要があります。コアは `provision` を呼び出す前に永続的な意図を保存します。プロバイダーは外部リソースを割り当てる前に設定を検証し、同じ操作 ID で繰り返し呼び出された場合は同じリースを引き継ぐ必要があります。コアは検証済み設定のスナップショットも保存し、名前付きプロファイルが変更または削除された後も含めて、`leaseId` とともに `inspect({ leaseId, profile })` および `destroy({ leaseId, profile })` に渡します。破棄は冪等であり、検査は閉じた `active` / `destroyed` / `unknown` ステータスの共用体を返します。また、SSH 秘密鍵素材は `SecretRef` を通じてのみ参照されます。プロビジョニングされた SSH エンドポイントには、信頼済みのプロビジョニング出力から得た公開 `hostKey` も、ホスト名やコメントを含めず、正確に `algorithm base64` 形式で含める必要があります。これにより、コアは接続前にホストを固定できます。動的な ID 参照を発行するプロバイダーは、正式な `resolveSshIdentity({ leaseId, profile, keyRef })` を実装できます。これを持たないプロバイダーは、コアの汎用シークレットリゾルバーを使用します。正式な `unknown` は、アクティブなローカルレコードを孤立状態にします。永続化された破棄要求の後では、これが破棄完了を確認します。

`contracts.gatewayMethodDispatch` は現在 `"authenticated-request"` を受け付けます。これは、意図的に Gateway コントロールプレーンメソッドをプロセス内でディスパッチするネイティブ Plugin HTTP ルートのための API 衛生ゲートであり、悪意あるネイティブ Plugin に対するサンドボックスではありません。すでに Gateway HTTP 認証を必要とする、厳密にレビューされた同梱または運用者向けのサーフェスにのみ使用してください。権限を付与されたルートが、Gateway のルート作業受付が閉じている間も到達可能になるのは、そのルートが `auth: "gateway"` と、ルート固有の `gatewayRuntimeScopeSurface: "trusted-operator"` の両方を宣言している場合だけです。同じ Plugin の通常の兄弟ルートは、引き続き受付境界の背後に留まります。これにより、Plugin 全体へ受付回避権限を与えることなく、一時停止状態の確認と再開を到達可能なまま維持できます。ディスパッチ外での解析とレスポンス整形は限定的に保ってください。実質的な処理や変更を伴う処理は、受付とスコープの強制を担う Gateway メソッドディスパッチを経由する必要があります。

## configContracts リファレンス

Plugin ランタイムをインポートせずに汎用コアヘルパーが必要とする、マニフェスト所有の設定動作には `configContracts` を使用します。対象は、危険なフラグの検出、SecretRef 移行先、従来の設定パスの絞り込みです。

```json
{
  "configContracts": {
    "compatibilityMigrationPaths": ["legacyProvider"],
    "compatibilityRuntimePaths": ["legacyProvider.webhook"],
    "dangerousFlags": [
      {
        "path": "accounts.*.allowUnverifiedSenders",
        "equals": true
      }
    ],
    "secretInputs": {
      "bundledDefaultEnabled": false,
      "paths": [
        {
          "path": "apiKey",
          "expected": "string"
        }
      ]
    }
  }
}
```

| フィールド                    | 必須   | 型         | 意味                                                                                                                                                                                                                                   |
| ----------------------------- | ------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | いいえ | `string[]` | この Plugin のセットアップ時互換性移行が適用される可能性を示す、ルート相対の設定パス。設定が Plugin を一度も参照しない場合、汎用ランタイム設定読み取りであらゆる Plugin セットアップサーフェスをスキップできます。                  |
| `compatibilityRuntimePaths`   | いいえ | `string[]` | Plugin コードが完全に有効化される前に、この Plugin が実行時に処理できるルート相対の互換性パス。互換性のあるすべての Plugin ランタイムをインポートせずに、同梱候補の集合を絞り込む必要がある従来サーフェスに使用します。             |
| `dangerousFlags`              | いいえ | `object[]` | 有効化されている場合に `openclaw doctor` が安全でない、または危険であると警告すべき設定リテラル。詳細は以下を参照してください。                                                                                                         |
| `secretInputs`                | いいえ | `object`   | SecretRef の移行・監査対象レジストリがシークレット形式の文字列として扱うべき、`plugins.entries.<id>.config` 配下の設定パス。詳細は以下を参照してください。                                                                              |

各 `dangerousFlags` エントリは次をサポートします。

| フィールド | 必須 | 型                                    | 意味                                                                                                                 |
| ---------- | ---- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `path`     | はい | `string`                              | `plugins.entries.<id>.config` からの相対パスとして指定する、ドット区切りの設定パス。マップまたは配列のセグメントでは `*` ワイルドカードを使用できます。 |
| `equals`   | はい | `string \| number \| boolean \| null` | この設定値を危険と判定する完全一致のリテラル。                                                                       |

`secretInputs` は次をサポートします。

| フィールド                | 必須 | 型         | 意味                                                                                                                                                                                                                                    |
| ------------------------- | ---- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled`   | いいえ | `boolean`  | この SecretRef サーフェスが有効かどうかを判断する際に、同梱 Plugin のデフォルトの有効化設定を上書きします。Plugin が同梱されているものの、設定で明示的に有効化されるまでサーフェスを無効のままにする場合に使用します。 |
| `paths`                   | はい | `object[]` | Secret 形式の設定パス。各要素には `path`（ドット区切り、`plugins.entries.<id>.config` からの相対パス、`*` ワイルドカードに対応）と、任意の `expected`（現在は `"string"` のみ）を指定します。                            |

## mediaUnderstandingProviderMetadata リファレンス

メディア理解プロバイダーにデフォルトモデル、自動認証フォールバックの優先順位、または汎用コアヘルパーがランタイムのロード前に必要とするネイティブ文書対応がある場合は、`mediaUnderstandingProviderMetadata` を使用します。キーは `contracts.mediaUnderstandingProviders` にも宣言する必要があります。

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
      "nativeDocumentInputs": ["pdf"],
      "documentModels": {
        "pdf": {
          "textExtraction": "example-doc-text-latest",
          "image": "example-doc-vision-latest"
        }
      }
    }
  }
}
```

各プロバイダーエントリには、次の項目を含めることができます。

| フィールド             | 型                                                               | 意味                                                                                                                       |
| ---------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | このプロバイダーが公開するメディア機能。                                                                                   |
| `defaultModels`        | `Record<string, string>`                                         | 設定でモデルが指定されていない場合に使用する、機能からモデルへのデフォルトマッピング。                                     |
| `autoPriority`         | `Record<string, number>`                                         | 認証情報に基づくプロバイダーの自動フォールバックで、数値が小さいものほど先に並びます。                                     |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | プロバイダーがネイティブに対応する文書入力。                                                                               |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | 文書種別ごとのモデル上書き。`image: false` を設定すると、その文書種別に対する画像ベースの抽出を無効化します。               |

## channelConfigs リファレンス

チャンネル Plugin がランタイムのロード前に軽量な設定メタデータを必要とする場合は、`channelConfigs` を使用します。読み取り専用のチャンネル設定・ステータス検出では、設定エントリがない場合、または `setup.requiresRuntime: false` によって設定時にランタイムが不要と宣言されている場合、設定済みの外部チャンネルに対してこのメタデータを直接使用できます。

`channelConfigs` は Plugin マニフェストのメタデータであり、新しいトップレベルのユーザー設定セクションではありません。ユーザーは引き続き `channels.<channel-id>` でチャンネルインスタンスを設定します。OpenClaw は、Plugin のランタイムコードが実行される前に、設定されたチャンネルをどの Plugin が所有するか判断するためにマニフェストのメタデータを読み取ります。

チャンネル Plugin では、`configSchema` と `channelConfigs` は異なるパスを記述します。

- `configSchema` は `plugins.entries.<plugin-id>.config` を検証します
- `channelConfigs.<channel-id>.schema` は `channels.<channel-id>` を検証します

`channels[]` を宣言する非同梱 Plugin は、一致する `channelConfigs` エントリも宣言する必要があります。宣言がなくても OpenClaw は Plugin をロードできますが、コールドパスの設定スキーマ、セットアップ、および Control UI サーフェスは、Plugin ランタイムが実行されるまでチャンネル所有のオプション構造を把握できません。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` と `nativeSkillsAutoEnabled` では、チャンネルランタイムのロード前に実行されるコマンド設定チェック用の静的な `auto` デフォルトを宣言できます。同梱チャンネルは、パッケージ所有の他のチャンネルカタログメタデータとともに、`package.json#openclaw.channel.commands` を通じて同じデフォルトを公開することもできます。

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

各チャンネルエントリには、次の項目を含めることができます。

| フィールド    | 型                       | 意味                                                                                                           |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` 用の JSON Schema。宣言する各チャンネル設定エントリで必須です。                                 |
| `uiHints`     | `Record<string, object>` | そのチャンネル設定セクション向けの任意の UI ラベル、プレースホルダー、機密情報ヒント。                         |
| `label`       | `string`                 | ランタイムメタデータの準備ができていない場合に、選択画面と検査サーフェスへ統合されるチャンネルラベル。         |
| `description` | `string`                 | 検査サーフェスとカタログサーフェス向けの短いチャンネル説明。                                                   |
| `commands`    | `object`                 | ランタイム前の設定チェック向けの、ネイティブコマンドとネイティブ Skills の静的な自動デフォルト。              |
| `preferOver`  | `string[]`               | 選択サーフェスでこのチャンネルが優先すべき、レガシーまたは優先度の低い Plugin ID。                             |

### 別のチャンネル Plugin の置き換え

別の Plugin も提供できるチャンネル ID に対して、自分の Plugin を優先所有者とする場合は `preferOver` を使用します。一般的なケースとして、Plugin ID の名称変更、同梱 Plugin を置き換えるスタンドアロン Plugin、または設定の互換性のために同じチャンネル ID を維持する、メンテナンスされたフォークがあります。

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

`channels.chat` が設定されている場合、OpenClaw はチャンネル ID と優先 Plugin ID の両方を考慮します。優先度の低い Plugin が、同梱されているかデフォルトで有効になっているという理由だけで選択されていた場合、OpenClaw は実効ランタイム設定でその Plugin を無効化し、1 つの Plugin がチャンネルとそのツールを所有するようにします。ユーザーによる明示的な選択は引き続き優先されます。ユーザーが両方の Plugin を明示的に有効化した場合（`plugins.allow` または実体のある `plugins.entries` 設定を使用）、OpenClaw は要求された Plugin セットを暗黙に変更せず、その選択を維持してチャンネルやツールの重複診断を報告します。

`preferOver` は、実際に同じチャンネルを提供できる Plugin ID のみに限定してください。これは汎用的な優先順位フィールドではなく、ユーザー設定キーの名前を変更するものでもありません。

## modelSupport リファレンス

Plugin ランタイムのロード前に、OpenClaw が `gpt-5.6-sol` や `claude-sonnet-4.6` のような短縮モデル ID からプロバイダー Plugin を推論する必要がある場合は、`modelSupport` を使用します。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw は次の優先順位を適用します。

- 明示的な `provider/model` 参照では、所有元の `providers` マニフェストメタデータを使用します
- `modelPatterns` は `modelPrefixes` より優先されます
- 非同梱 Plugin と同梱 Plugin が両方とも一致する場合、非同梱 Plugin が優先されます
- 残る曖昧さは、ユーザーまたは設定がプロバイダーを指定するまで無視されます

フィールド:

| フィールド      | 型         | 意味                                                                                           |
| --------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 短縮モデル ID に対して `startsWith` で照合するプレフィックス。                                 |
| `modelPatterns` | `string[]` | プロファイルサフィックスを削除した後の短縮モデル ID に対して照合する正規表現ソース。            |

`modelPatterns` のエントリは `compileSafeRegex` を通じてコンパイルされ、ネストした繰り返しを含むパターン（例: `(a+)+$`）は拒否されます。安全性チェックに失敗したパターンは、構文的に無効な正規表現と同様に暗黙にスキップされます。パターンは単純に保ち、ネストした量指定子は避けてください。

## modelCatalog リファレンス

Plugin ランタイムのロード前に、OpenClaw がプロバイダーのモデルメタデータを認識する必要がある場合は、`modelCatalog` を使用します。これは、固定カタログ行、プロバイダーエイリアス、抑制ルール、および検出モードに関する、マニフェスト所有の情報源です。ランタイムでの更新は引き続きプロバイダーのランタイムコードが担当しますが、ランタイムが必要になるタイミングはマニフェストがコアに通知します。

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

トップレベルのフィールド:

| フィールド       | 型                                                       | 意味                                                                                                                        |
| ---------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | このPluginが所有するプロバイダーIDのカタログ行。キーはトップレベルの`providers`にも含める必要があります。                  |
| `aliases`        | `Record<string, object>`                                 | カタログまたは抑制の計画時に、所有するプロバイダーへ解決されるプロバイダーエイリアス。                                     |
| `suppressions`   | `object[]`                                               | このPluginがプロバイダー固有の理由で抑制する、別のソースからのモデル行。                                                    |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | プロバイダーカタログをマニフェストメタデータから読み取れるか、キャッシュへ更新できるか、ランタイムが必要かを示します。      |
| `runtimeAugment` | `boolean`                                                | マニフェスト／設定の計画後にプロバイダーランタイムがカタログ行を追加する必要がある場合にのみ`true`に設定します。            |

`aliases`は、モデルカタログの計画におけるプロバイダー所有権の検索に関与します。エイリアスのターゲットは、同じPluginが所有するトップレベルのプロバイダーでなければなりません。プロバイダーで絞り込まれたリストがエイリアスを使用する場合、OpenClawはプロバイダーランタイムを読み込まずに、所有元のマニフェストを読み取り、エイリアスのAPI／ベースURLオーバーライドを適用できます。エイリアスは絞り込まれていないカタログ一覧を展開しません。広範なリストでは、所有元の正規プロバイダー行のみが出力されます。

`suppressions`は、旧プロバイダーランタイムの`suppressBuiltInModel`フックを置き換えます。抑制エントリが適用されるのは、プロバイダーがそのPluginによって所有されている場合、または所有するプロバイダーをターゲットとする`modelCatalog.aliases`キーとして宣言されている場合のみです。モデル解決中にランタイム抑制フックが呼び出されることはなくなりました。

プロバイダーフィールド：

| フィールド            | 型                       | 意味                                                                                                                                                                                                                                        |
| --------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`             | `string`                 | このプロバイダーカタログ内のモデルに使用する、省略可能な既定のベースURL。                                                                                                                                                                  |
| `api`                 | `ModelApi`               | このプロバイダーカタログ内のモデルに使用する、省略可能な既定のAPIアダプター。                                                                                                                                                               |
| `headers`             | `Record<string, string>` | このプロバイダーカタログに適用する、省略可能な静的ヘッダー。                                                                                                                                                                               |
| `defaultUtilityModel` | `string`                 | 短い内部ユーティリティタスク（タイトル、進捗説明）向けにプロバイダーが推奨する、省略可能な小規模モデルID。`agents.defaults.utilityModel`が未設定で、このプロバイダーがエージェントのプライマリモデルを提供する場合に使用されます。             |
| `models`              | `object[]`               | 必須のモデル行。`id`のない行は無視されます。                                                                                                                                                                                               |

モデルフィールド：

| フィールド         | 型                                                             | 意味                                                                            |
| ------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `id`               | `string`                                                       | `provider/`プレフィックスを含まない、プロバイダー内のモデルID。                |
| `name`             | `string`                                                       | 省略可能な表示名。                                                              |
| `api`              | `ModelApi`                                                     | 省略可能なモデル単位のAPIオーバーライド。                                      |
| `baseUrl`          | `string`                                                       | 省略可能なモデル単位のベースURLオーバーライド。                                |
| `headers`          | `Record<string, string>`                                       | 省略可能なモデル単位の静的ヘッダー。                                           |
| `input`            | `Array<"text" \| "image" \| "document">`                       | モデルが受け付けるモダリティ。その他の値は通知なしで除外されます。              |
| `reasoning`        | `boolean`                                                      | モデルが推論動作を提供するかどうか。                                            |
| `contextWindow`    | `number`                                                       | プロバイダーがネイティブに提供するコンテキストウィンドウ。                      |
| `contextTokens`    | `number`                                                       | `contextWindow`と異なる場合の、省略可能な実効ランタイムコンテキスト上限。       |
| `maxTokens`        | `number`                                                       | 判明している場合の最大出力トークン数。                                          |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | 省略可能な思考レベル別のモデルIDまたはパラメーターオーバーライド。              |
| `cost`             | `object`                                                       | 省略可能な、100万トークン当たりの米ドル価格。省略可能な`tieredPricing`を含みます。 |
| `compat`           | `object`                                                       | OpenClawのモデル設定互換性に対応する、省略可能な互換性フラグ。                  |
| `mediaInput`       | `object`                                                       | 省略可能なモダリティ別入力設定。現在は画像のみです。                            |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 一覧表示ステータス。行を一切表示してはならない場合のみ抑制します。              |
| `statusReason`     | `string`                                                       | 利用可能ではないステータスとともに表示される、省略可能な理由。                  |
| `replaces`         | `string[]`                                                     | このモデルが置き換える、旧プロバイダー内モデルID。                              |
| `replacedBy`       | `string`                                                       | 非推奨行を置き換える、プロバイダー内モデルID。                                  |
| `tags`             | `string[]`                                                     | 選択ツールとフィルターで使用される安定したタグ。                                |

抑制フィールド：

| フィールド                 | 型         | 意味                                                                                                                       |
| -------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | 抑制する上流行のプロバイダーID。このPluginが所有しているか、所有するエイリアスとして宣言されている必要があります。         |
| `model`                    | `string`   | 抑制するプロバイダー内モデルID。                                                                                           |
| `reason`                   | `string`   | 抑制された行が直接要求されたときに表示される、省略可能なメッセージ。                                                       |
| `when.baseUrlHosts`        | `string[]` | 抑制を適用する前提となる、実効プロバイダーベースURLホストの省略可能なリスト。                                              |
| `when.providerConfigApiIn` | `string[]` | 抑制を適用する前提となる、プロバイダー設定の`api`の完全一致値を指定する省略可能なリスト。                                  |

ランタイム専用データを`modelCatalog`に含めないでください。マニフェスト行が十分に完全であり、プロバイダーで絞り込まれたリストと選択ツールがレジストリ／ランタイム検出を省略できる場合にのみ`static`を使用します。マニフェスト行が一覧表示可能な有用な初期データまたは補足データであり、後から更新／キャッシュによって行を追加できる場合は`refreshable`を使用します。更新可能な行だけでは信頼できる完全な情報源にはなりません。OpenClawが一覧を把握するためにプロバイダーランタイムを読み込む必要がある場合は`runtime`を使用します。

## modelIdNormalizationリファレンス

プロバイダーランタイムの読み込み前に実行する必要がある、低コストなプロバイダー所有のモデルID正規化には`modelIdNormalization`を使用します。これにより、短縮モデル名、プロバイダー内の旧モデルID、プロキシプレフィックス規則などのエイリアスを、コアのモデル選択テーブルではなく所有元Pluginのマニフェストに保持できます。

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

プロバイダーフィールド：

| フィールド                           | 型                      | 意味                                                                                              |
| ------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | 大文字と小文字を区別しない、モデルIDの完全一致エイリアス。値は記述されたとおりに返されます。      |
| `stripPrefixes`                      | `string[]`              | エイリアス検索前に削除するプレフィックス。旧来のプロバイダー／モデル重複に役立ちます。            |
| `prefixWhenBare`                     | `string`                | 正規化されたモデルIDに`/`がまだ含まれていない場合に追加するプレフィックス。                       |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | エイリアス検索後に適用する、`modelPrefix`と`prefix`をキーとする条件付きの単独IDプレフィックス規則。 |

## providerEndpointsリファレンス

プロバイダーランタイムの読み込み前に汎用リクエストポリシーが把握する必要のあるエンドポイント分類には、`providerEndpoints`を使用します。各`endpointClass`の意味は引き続きコアが所有し、ホストとベースURLのメタデータはPluginマニフェストが所有します。

公式に外部化されたプロバイダーPluginはコア配布物から除外されるため、
インストールされるまでそのマニフェストは参照できません。Pluginなしでも
エンドポイント分類が機能し続けるように、その`providerEndpoints`も
`scripts/lib/official-external-provider-catalog.json`に複製する必要があります。
契約テストによってこの複製が検証されます。

エンドポイントフィールド：

| フィールド                     | 型         | 意味                                                                                           |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | `openrouter`、`moonshot-native`、`google-vertex` などの既知のコアエンドポイントクラス。        |
| `hosts`                        | `string[]` | エンドポイントクラスに対応する完全一致のホスト名。                                             |
| `hostSuffixes`                 | `string[]` | エンドポイントクラスに対応するホストサフィックス。ドメインサフィックスのみに一致させるには `.` を先頭に付けます。 |
| `baseUrls`                     | `string[]` | エンドポイントクラスに対応する、正規化された完全一致の HTTP(S) ベース URL。                    |
| `googleVertexRegion`           | `string`   | 完全一致するグローバルホスト向けの静的な Google Vertex リージョン。                            |
| `googleVertexRegionHostSuffix` | `string`   | 一致するホストから削除し、Google Vertex リージョンのプレフィックスを取り出すためのサフィックス。 |

## providerRequest リファレンス

プロバイダーランタイムを読み込まずに汎用リクエストポリシーが必要とする、軽量なリクエスト互換性メタデータには `providerRequest` を使用します。動作固有のペイロード書き換えは、プロバイダーランタイムのフックまたは共有プロバイダーファミリーヘルパーに保持します。

```json
{
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

| フィールド            | 型           | 意味                                                                                     |
| --------------------- | ------------ | ---------------------------------------------------------------------------------------- |
| `family`              | `string`     | 汎用リクエスト互換性の判断と診断で使用されるプロバイダーファミリーラベル。               |
| `compatibilityFamily` | `"moonshot"` | 共有リクエストヘルパー向けの、省略可能なプロバイダーファミリー互換性バケット。           |
| `openAICompletions`   | `object`     | OpenAI 互換の補完リクエストフラグ。現在は `supportsStreamingUsage`。                     |

## secretProviderIntegrations リファレンス

Plugin が再利用可能な SecretRef exec プロバイダープリセットを公開できる場合は、`secretProviderIntegrations` を使用します。OpenClaw は Plugin ランタイムの読み込み前にこのメタデータを読み取り、Plugin の所有情報を `secrets.providers.<alias>.pluginIntegration` に保存し、実際のシークレット解決は SecretRef ランタイムに委ねます。プリセットは、バンドル済み Plugin と、git や ClawHub からのインストールなど、管理対象の Plugin インストールルートから検出されたインストール済み Plugin に対してのみ公開されます。

```json
{
  "secretProviderIntegrations": {
    "secret-store": {
      "providerAlias": "team-secrets",
      "displayName": "Team secrets",
      "source": "exec",
      "command": "${node}",
      "args": ["./bin/resolve-secrets.mjs"]
    }
  }
}
```

マップのキーは統合 ID です。`providerAlias` を省略した場合、OpenClaw は統合 ID を SecretRef プロバイダーエイリアスとして使用します。プロバイダーエイリアスは、`team-secrets` や `onepassword-work` など、通常の SecretRef プロバイダーエイリアスのパターンに一致する必要があります。

オペレーターがプリセットを選択すると、OpenClaw は次のようなプロバイダー参照を書き込みます。

```json
{
  "secrets": {
    "providers": {
      "team-secrets": {
        "source": "exec",
        "pluginIntegration": {
          "pluginId": "acme-secrets",
          "integrationId": "secret-store"
        }
      }
    }
  }
}
```

起動時または再読み込み時に、OpenClaw は現在の Plugin マニフェストメタデータを読み込み、所有元の Plugin がインストール済みかつ有効であることを確認し、マニフェストから exec コマンドを具体化して、そのプロバイダーを解決します。Plugin を無効化または削除すると、アクティブな SecretRef に対するそのプロバイダーの使用権が取り消されます。スタンドアロンの exec 設定を使用するオペレーターは、引き続き手動の `command`/`args` プロバイダーを直接記述できます。

現在サポートされているのは `source: "exec"` プリセットのみです。`command` は `${node}` である必要があり、`args[0]` は Plugin ルートからの相対パスである `./` 形式のリゾルバースクリプトでなければなりません。OpenClaw は起動時または再読み込み時に、これを現在の Node 実行ファイルと Plugin 内スクリプトの絶対パスへ具体化します。`--require`、`--import`、`--loader`、`--env-file`、`--eval`、`--print` などの Node オプションは、マニフェストプリセットの契約には含まれません。Node 以外のコマンドが必要なオペレーターは、スタンドアロンの手動 exec プロバイダーを直接設定できます。

OpenClaw は、マニフェストプリセットの `trustedDirs` を Plugin ルートから導出し、`${node}` プリセットの場合は現在の Node 実行ファイルのディレクトリも使用します。マニフェストで指定された `trustedDirs` は無視されます。`timeoutMs`、`noOutputTimeoutMs`、`maxOutputBytes`、`jsonOnly`、`env`、`passEnv`、`allowInsecurePath` など、その他の exec プロバイダーオプションは通常の SecretRef exec プロバイダー設定にそのまま渡されます。

## modelPricing リファレンス

ランタイムの読み込み前にプロバイダーがコントロールプレーンの価格設定動作を制御する必要がある場合は、`modelPricing` を使用します。Gateway の価格キャッシュは、プロバイダーランタイムコードをインポートせずにこのメタデータを読み取ります。

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

| フィールド   | 型                | 意味                                                                                              |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | OpenRouter または LiteLLM の価格を決して取得しないローカルまたはセルフホスト型プロバイダーでは `false` に設定します。 |
| `openRouter` | `false \| object` | OpenRouter の価格検索マッピング。`false` にすると、このプロバイダーでの OpenRouter 検索を無効にします。 |
| `liteLLM`    | `false \| object` | LiteLLM の価格検索マッピング。`false` にすると、このプロバイダーでの LiteLLM 検索を無効にします。 |

ソースフィールド:

| フィールド                 | 型                 | 意味                                                                                                                  |
| -------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | OpenClaw のプロバイダー ID と異なる場合の外部カタログプロバイダー ID。例: `zai` プロバイダーに対する `z-ai`。         |
| `passthroughProviderModel` | `boolean`          | スラッシュを含むモデル ID を、ネストされたプロバイダー/モデル参照として扱います。OpenRouter などのプロキシプロバイダーに有用です。 |
| `modelIdTransforms`        | `"version-dots"[]` | 追加の外部カタログモデル ID バリエーション。`version-dots` は `claude-opus-4.6` のようなドット区切りのバージョン ID を試します。 |

### OpenClaw プロバイダーインデックス

OpenClaw プロバイダーインデックスは、Plugin がまだインストールされていない可能性があるプロバイダー向けの、OpenClaw が所有するプレビューメタデータです。これは Plugin マニフェストの一部ではありません。インストール済み Plugin の正式な情報源は引き続き Plugin マニフェストです。プロバイダーインデックスは、プロバイダー Plugin がインストールされていない場合に、将来のインストール可能プロバイダー画面やインストール前のモデル選択画面が使用する内部フォールバック契約です。

カタログの優先順位:

1. ユーザー設定。
2. インストール済み Plugin マニフェストの `modelCatalog`。
3. 明示的な更新によるモデルカタログキャッシュ。
4. OpenClaw プロバイダーインデックスのプレビュー行。

プロバイダーインデックスには、シークレット、有効状態、ランタイムフック、または実際のアカウント固有のモデルデータを含めてはいけません。そのプレビューカタログでは Plugin マニフェストと同じ `modelCatalog` プロバイダー行の形式を使用しますが、`api`、`baseUrl`、価格設定、互換性フラグなどのランタイムアダプターフィールドをインストール済み Plugin マニフェストと意図的に同期させる場合を除き、安定した表示メタデータに限定する必要があります。実際の `/models` 検出を行うプロバイダーは、通常の一覧表示やオンボーディングでプロバイダー API を呼び出すのではなく、明示的なモデルカタログキャッシュ経路を通じて更新行を書き込む必要があります。

プロバイダーインデックスのエントリには、Plugin がコアから移動したか、まだインストールされていないプロバイダー向けに、インストール可能な Plugin のメタデータを含めることもできます。このメタデータはチャネルカタログのパターンを踏襲します。パッケージ名、npm インストール指定、想定される整合性情報、軽量な認証選択肢ラベルがあれば、インストール可能なセットアップオプションを表示するのに十分です。Plugin がインストールされると、そのマニフェストが優先され、そのプロバイダーのプロバイダーインデックスエントリは無視されます。

`openclaw doctor --fix` は、従来のトップレベルマニフェスト機能キーのうち、限定された固定セットを `contracts.*` に移行します。対象は `speechProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`tools` です。これらのキーを含め、すべての機能リストはトップレベルのマニフェストフィールドとしては読み取られなくなりました。通常のマニフェスト読み込みでは、`contracts` 配下にある場合のみ認識されます。

## マニフェストと package.json の違い

2 つのファイルは異なる役割を担います。

| ファイル               | 用途                                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Plugin コードの実行前に存在する必要がある、検出、設定検証、認証選択肢メタデータ、UI ヒント                                       |
| `package.json`         | npm メタデータ、依存関係のインストール、およびエントリーポイント、インストール制御、セットアップ、カタログメタデータに使用される `openclaw` ブロック |

メタデータをどちらに配置すべきか不明な場合は、次の規則を使用します。

- Plugin コードを読み込む前に OpenClaw が知る必要がある場合は、`openclaw.plugin.json` に配置します
- パッケージング、エントリーファイル、または npm のインストール動作に関する場合は、`package.json` に配置します

### 検出に影響する package.json フィールド

一部のランタイム前 Plugin メタデータは、意図的に `openclaw.plugin.json` ではなく、`package.json` の `openclaw` ブロック配下に置かれます。`openclaw.bundle` と `openclaw.bundle.json` は OpenClaw Plugin の契約ではありません。ネイティブ Plugin は、`openclaw.plugin.json` と、以下でサポートされている `package.json#openclaw` フィールドを使用する必要があります。

重要な例:

| フィールド                                                                                   | 意味                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | ネイティブ Plugin のエントリポイントを宣言します。Plugin パッケージディレクトリ内に収める必要があります。                                                                          |
| `openclaw.runtimeExtensions`                                                               | インストール済みパッケージ用にビルドされた JavaScript ランタイムエントリポイントを宣言します。Plugin パッケージディレクトリ内に収める必要があります。                              |
| `openclaw.setupEntry`                                                                      | オンボーディング、遅延チャネル起動、読み取り専用のチャネル状態および SecretRef 検出で使用される、セットアップ専用の軽量エントリポイントです。Plugin パッケージディレクトリ内に収める必要があります。 |
| `openclaw.runtimeSetupEntry`                                                               | インストール済みパッケージ用にビルドされた JavaScript セットアップエントリポイントを宣言します。`setupEntry` が必要であり、実在し、Plugin パッケージディレクトリ内に収める必要があります。 |
| `openclaw.channel`                                                                         | ラベル、ドキュメントパス、エイリアス、選択時の説明文など、低コストなチャネルカタログメタデータです。                                                                               |
| `openclaw.channel.commands`                                                                | チャネルランタイムの読み込み前に、設定、監査、コマンド一覧の各画面で使用される、静的なネイティブコマンドおよびネイティブスキルの自動デフォルトメタデータです。                     |
| `openclaw.channel.configuredState`                                                         | チャネルランタイム全体を読み込まずに「環境変数のみのセットアップがすでに存在するか？」へ回答できる、軽量な設定済み状態チェッカーのメタデータです。                                 |
| `openclaw.channel.persistedAuthState`                                                      | チャネルランタイム全体を読み込まずに「すでに何かへサインインしているか？」へ回答できる、軽量な永続化認証チェッカーのメタデータです。                                               |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | バンドル済みおよび外部公開 Plugin のインストール／更新に関するヒントです。                                                                                                        |
| `openclaw.install.defaultChoice`                                                           | 複数のインストール元を利用できる場合の優先インストールパスです。                                                                                                                   |
| `openclaw.install.minHostVersion`                                                          | `>=2026.3.22` や `>=2026.5.1-beta.1` のような semver 下限で指定する、サポート対象の最小 OpenClaw ホストバージョンです。                                                            |
| `openclaw.compat.pluginApi`                                                                | `>=2026.5.27` のような semver 下限で指定する、このパッケージが必要とする OpenClaw Plugin API の最小範囲です。                                                                      |
| `openclaw.install.expectedIntegrity`                                                       | `sha512-...` などの想定 npm dist 整合性文字列です。インストールおよび更新フローは、取得した成果物をこの値と照合して検証します。                                                    |
| `openclaw.install.allowInvalidConfigRecovery`                                              | 設定が無効な場合に、限定的なバンドル Plugin 再インストール復旧パスを許可します。                                                                                                  |
| `openclaw.install.requiredPlatformPackages`                                                | ロックファイルのプラットフォーム制約が現在のホストと一致する場合に実体化する必要がある npm パッケージエイリアスです。                                                             |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | セットアップランタイムのチャネル画面を待受開始前に読み込み、設定済みチャネル Plugin 全体の読み込みを待受開始後の有効化まで遅延できるようにします。                                |

マニフェストメタデータは、ランタイムの読み込み前にオンボーディングへ表示するプロバイダー／チャネル／セットアップの選択肢を決定します。`package.json#openclaw.install` は、ユーザーがそれらの選択肢のいずれかを選んだとき、その Plugin を取得または有効化する方法をオンボーディングへ伝えます。インストールのヒントを `openclaw.plugin.json` へ移動しないでください。

`openclaw.install.minHostVersion` は、バンドルされていない Plugin ソースのインストール時およびマニフェストレジストリ読み込み時に適用されます。無効な値は拒否されます。有効でも新しすぎる値の場合、古いホストでは外部 Plugin がスキップされます。バンドルされたソース Plugin は、ホストのチェックアウトと同じバージョンであると見なされます。

`openclaw.install.requiredPlatformPackages` は、オプションのプラットフォーム固有エイリアスを通じて必須のネイティブバイナリを公開する npm パッケージ向けです。サポート対象の各プラットフォームエイリアスについて、修飾なしの npm パッケージ名を列挙してください。npm インストール中、OpenClaw はロックファイルの制約が現在のホストと一致する、宣言済みエイリアスのみを検証します。npm が成功を報告してもそのエイリアスが欠落している場合、OpenClaw は新しいキャッシュで一度だけ再試行し、それでもエイリアスが欠落していればインストールをロールバックします。

`openclaw.compat.pluginApi` は、バンドルされていない Plugin ソースのパッケージインストール時に適用されます。パッケージのビルド対象となった OpenClaw Plugin SDK／ランタイム API の下限として使用してください。Plugin パッケージがより新しい API を必要としつつ、ほかのフロー向けに低いインストールヒントを維持する場合は、`minHostVersion` より厳しくできます。公式 OpenClaw リリースの同期では、既存の公式 Plugin API 下限はデフォルトで OpenClaw のリリースバージョンまで引き上げられますが、パッケージが古いホストを意図的にサポートする場合、Plugin 単独のリリースでは低い下限を維持できます。パッケージバージョンだけを互換性契約として使用しないでください。`peerDependencies.openclaw` は引き続き npm パッケージメタデータです。OpenClaw はインストール互換性の判断に `openclaw.compat.pluginApi` 契約を使用します。

公式のオンデマンドインストールメタデータでは、Plugin が ClawHub で公開されている場合に `clawhubSpec` を使用してください。オンボーディングはこれを優先リモートソースとして扱い、インストール後に ClawHub の成果物情報を記録します。`npmSpec` は、まだ ClawHub へ移行していないパッケージ向けの互換性フォールバックとして残ります。

npm の正確なバージョン固定は、たとえば `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"` のように、すでに `npmSpec` に存在します。公式外部カタログのエントリでは、取得した npm 成果物が固定済みリリースと一致しなくなった場合に更新フローが安全側で失敗するよう、正確な仕様を `expectedIntegrity` と組み合わせる必要があります。対話型オンボーディングでは、互換性のため、修飾なしのパッケージ名や dist-tag を含む、信頼済みレジストリの npm 仕様を引き続き提示します。カタログ診断では、正確、可変、整合性固定済み、整合性欠落、パッケージ名不一致、無効なデフォルト選択の各ソースを区別できます。また、`expectedIntegrity` が存在していても、それを固定できる有効な npm ソースがない場合は警告します。`expectedIntegrity` が存在する場合、インストール／更新フローはそれを適用します。省略されている場合、レジストリ解決結果は整合性固定なしで記録されます。

状態、チャネル一覧、または SecretRef のスキャンで、ランタイム全体を読み込まずに設定済みアカウントを識別する必要がある場合、チャネル Plugin は `openclaw.setupEntry` を提供する必要があります。セットアップエントリは、チャネルメタデータに加え、セットアップで安全に使用できる設定、状態、シークレットのアダプターを公開する必要があります。ネットワーククライアント、Gateway リスナー、トランスポートランタイムはメインの拡張エントリポイントに置いてください。

ランタイムエントリポイントのフィールドは、ソースエントリポイントのフィールドに対するパッケージ境界チェックを上書きしません。たとえば、`openclaw.runtimeExtensions` によって、境界外へ抜ける `openclaw.extensions` パスを読み込み可能にすることはできません。

`openclaw.install.allowInvalidConfigRecovery` は意図的に限定されています。任意の壊れた設定をインストール可能にするものではありません。現在は、バンドル Plugin のパス欠落や、同じバンドル Plugin に対する古い `channels.<id>` エントリなど、特定の古いバンドル Plugin 更新失敗からインストールフローを復旧できるようにするだけです。無関係な設定エラーは引き続きインストールをブロックし、運用者に `openclaw doctor --fix` の実行を促します。

`openclaw.channel.persistedAuthState` は、小規模なチェッカーモジュール向けのパッケージメタデータです。

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

セットアップ、Doctor、状態確認、または読み取り専用の存在確認フローで、チャネル Plugin 全体の読み込み前に低コストな認証の有無を調べる必要がある場合に使用してください。永続化された認証状態は、設定済みチャネル状態ではありません。このメタデータを Plugin の自動有効化、ランタイム依存関係の修復、またはチャネルランタイムを読み込むべきかどうかの判断に使用しないでください。対象のエクスポートは、永続化された状態のみを読み取る小さな関数にしてください。チャネルランタイム全体のバレルを経由させないでください。

`openclaw.channel.configuredState` は、低コストな環境変数のみの設定済みチェックに対して同じ形式を使用します。

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

環境変数またはほかの小規模な非ランタイム入力から、チャネルが設定済み状態を判断できる場合に使用してください。チェックに設定全体の解決または実際のチャネルランタイムが必要な場合は、そのロジックを代わりに Plugin の `config.hasConfiguredState` フックへ置いてください。

## 検出の優先順位（Plugin ID の重複）

OpenClaw は、OpenClaw に同梱されたバンドル Plugin、グローバルインストールルート（`~/.openclaw/extensions`）、現在のワークスペースルート（`<workspace>/.openclaw/extensions`）という3つのルートと、明示的な `plugins.load.paths` エントリから Plugin を検出します。3つのルートはこの順序で確認されます。

2つの検出結果が同じ `id` を共有する場合、**最も優先順位の高い**マニフェストだけが保持されます。優先順位の低い重複は並行して読み込まれず、破棄されます。優先順位は高い順に次のとおりです。

1. **設定で選択済み** — `plugins.entries.<id>` で明示的に固定されたパス
2. **追跡済みインストール記録と一致するグローバルインストール** — `openclaw plugin install`／`openclaw plugin update` でインストールされ、OpenClaw のインストール追跡が同じ ID に対して認識している Plugin。ID がバンドル Plugin にも属する場合を含みます
3. **バンドル済み** — OpenClaw に同梱された Plugin
4. **ワークスペース** — 現在のワークスペースを基準に検出された Plugin
5. その他の検出候補

影響：

- ワークスペースまたはグローバルルートに追跡されずに置かれた、バンドル Plugin のフォークまたは古いコピーは、バンドルされたビルドを隠しません。
- バンドル Plugin を上書きするには、その ID に対して `openclaw plugin install` を実行し、追跡済みグローバルインストールの優先順位をバンドルコピーより高くするか、`plugins.entries.<id>` で特定のパスを固定し、設定で選択済みの優先順位によって勝たせます。
- 重複の破棄はログに記録されるため、Doctor および起動診断で破棄されたコピーを示せます。
- 設定で選択された重複上書きは、診断では明示的な上書きとして表現されますが、古いフォークや意図しない隠蔽を可視化したままにするため、引き続き警告されます。

## JSON Schema の要件

- **すべてのPluginはJSON Schemaを同梱する必要があります**。設定を受け付けない場合も同様です。
- 空のスキーマも使用できます（例: `{ "type": "object", "additionalProperties": false }`）。
- スキーマは実行時ではなく、設定の読み書き時に検証されます。
- 新しい設定キーを追加して同梱Pluginを拡張またはフォークする場合は、そのPluginの`openclaw.plugin.json`にある`configSchema`も同時に更新してください。同梱Pluginのスキーマは厳格なため、`configSchema.properties`に`myNewKey`を追加せずにユーザー設定へ`plugins.entries.<id>.config.myNewKey`を追加すると、Pluginランタイムが読み込まれる前に拒否されます。

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

- 不明な`channels.*`キーは、そのチャンネルIDがPluginマニフェストで宣言されていない限り、**エラー**です。同じIDが`plugins.allow`、`plugins.entries`、または`plugins.installs`にも存在する場合（参照されているものの、現在は検出できないPlugin）、OpenClawは代わりにこれを**警告**へ格下げします。
- 不明なPlugin IDを参照する`plugins.entries.<id>`、`plugins.allow`、および`plugins.deny`はエラーではなく、**警告**（「古い設定エントリは無視されました」）になります。そのため、アップグレードやPluginの削除・名前変更によってGatewayの起動が妨げられることはありません。
- 不明なPlugin IDを参照する`plugins.slots.memory`は**エラー**です。ただし、既知の公式外部Pluginである`memory-lancedb`については、代わりに警告になります。
- Pluginがインストールされていても、マニフェストまたはスキーマが壊れているか存在しない場合、検証は失敗し、DoctorがPluginエラーを報告します。
- Pluginの設定が存在していてもPluginが**無効**になっている場合、設定は保持され、Doctorとログに**警告**が表示されます。

`plugins.*`スキーマの全内容については、[設定リファレンス](/ja-JP/gateway/configuration)を参照してください。

## 注記

- ローカルファイルシステムから読み込む場合を含め、**ネイティブOpenClaw Pluginにはマニフェストが必須です**。ランタイムは引き続きPluginモジュールを別途読み込みます。マニフェストは検出と検証にのみ使用されます。
- ネイティブマニフェストはJSON5で解析されるため、最終的な値がオブジェクトである限り、コメント、末尾のカンマ、および引用符なしのキーを使用できます。
- マニフェストローダーが読み取るのは、文書化されたマニフェストフィールドのみです。独自のトップレベルキーは使用しないでください。
- Pluginで必要としない場合は、`channels`、`providers`、`cliBackends`、および`skills`をすべて省略できます。
- `providerCatalogEntry`は軽量に保ち、広範なランタイムコードをインポートしないようにしてください。リクエスト時の実行ではなく、静的なプロバイダーカタログメタデータまたは限定的な検出記述子に使用します。
- 排他的なPlugin種別は`plugins.slots.*`を通じて選択されます。`kind: "memory"`は`plugins.slots.memory`（デフォルトは`memory-core`）、`kind: "context-engine"`は`plugins.slots.contextEngine`（デフォルトは`legacy`）を使用します。
- 排他的なPlugin種別はこのマニフェストで宣言してください。ランタイムエントリの`OpenClawPluginDefinition.kind`は非推奨で、古いPlugin向けの互換性フォールバックとしてのみ残されています。
- 環境変数メタデータ（`setup.providers[].envVars`、非推奨の`providerAuthEnvVars`、および`channelEnvVars`）は宣言専用です。ステータス、監査、Cron配信の検証、およびその他の読み取り専用サーフェスでは、環境変数を設定済みとして扱う前に、引き続きPluginの信頼性と実効的な有効化ポリシーが適用されます。
- プロバイダーコードを必要とするランタイムのウィザードメタデータについては、[プロバイダーランタイムフック](/ja-JP/plugins/architecture-internals#provider-runtime-hooks)を参照してください。
- Pluginがネイティブモジュールに依存している場合は、ビルド手順とパッケージマネージャーの許可リスト要件（例: pnpmの`allow-build-scripts`と`pnpm rebuild <package>`）を文書化してください。

## 関連項目

<CardGroup cols={3}>
  <Card title="Pluginの構築" href="/ja-JP/plugins/building-plugins" icon="rocket">
    Pluginの使用を開始します。
  </Card>
  <Card title="Pluginアーキテクチャ" href="/ja-JP/plugins/architecture" icon="diagram-project">
    内部アーキテクチャと機能モデル。
  </Card>
  <Card title="SDKの概要" href="/ja-JP/plugins/sdk-overview" icon="book">
    Plugin SDKリファレンスとサブパスインポート。
  </Card>
</CardGroup>

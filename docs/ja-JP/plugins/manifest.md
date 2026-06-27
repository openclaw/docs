---
read_when:
    - OpenClaw Pluginを構築しています
    - Plugin 設定スキーマを出荷する、または Plugin 検証エラーをデバッグする必要がある
summary: Plugin マニフェスト + JSON スキーマ要件（厳格な設定検証）
title: Plugin マニフェスト
x-i18n:
    generated_at: "2026-06-27T12:17:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62f6684ab074e4f14ce5c833fe8c8c624a2750f80215bdeffd972e27dd6bfc9c
    source_path: plugins/manifest.md
    workflow: 16
---

このページは **OpenClaw ネイティブ Plugin マニフェスト**専用です。

互換バンドルレイアウトについては、[Plugin バンドル](/ja-JP/plugins/bundles)を参照してください。

互換バンドル形式では、別のマニフェストファイルを使用します。

- Codex バンドル: `.codex-plugin/plugin.json`
- Claude バンドル: `.claude-plugin/plugin.json`、またはマニフェストなしのデフォルト Claude コンポーネント
  レイアウト
- Cursor バンドル: `.cursor-plugin/plugin.json`

OpenClaw はこれらのバンドルレイアウトも自動検出しますが、ここで説明する
`openclaw.plugin.json` スキーマに対しては検証されません。

互換バンドルについて、OpenClaw は現在、レイアウトが OpenClaw ランタイムの期待に一致する場合に、
バンドルメタデータに加えて、宣言された skill ルート、Claude コマンドルート、Claude バンドルの `settings.json` デフォルト、
Claude バンドルの LSP デフォルト、およびサポートされている hook pack を読み取ります。

すべてのネイティブ OpenClaw Plugin は、**Plugin ルート**に `openclaw.plugin.json` ファイルを同梱する必要があります。OpenClaw はこのマニフェストを使用して、**Plugin コードを実行せずに**設定を検証します。マニフェストがない、または無効な場合は Plugin エラーとして扱われ、設定検証がブロックされます。

Plugin システム全体のガイドを参照してください: [Plugins](/ja-JP/tools/plugin)。
ネイティブ capability モデルと現在の外部互換性ガイダンスについては、次を参照してください:
[Capability model](/ja-JP/plugins/architecture#public-capability-model)。

## このファイルの役割

`openclaw.plugin.json` は、OpenClaw が **Plugin コードをロードする前に**読み取るメタデータです。以下のすべては、Plugin ランタイムを起動せずに検査できる程度に軽量である必要があります。

**用途:**

- Plugin の識別情報、設定検証、設定 UI ヒント
- 認証、オンボーディング、セットアップメタデータ（エイリアス、自動有効化、プロバイダー環境変数、認証の選択肢）
- コントロールプレーンのサーフェス向けの有効化ヒント
- 省略形モデルファミリーの所有権
- 静的な capability 所有権スナップショット（`contracts`）
- 共有 `openclaw qa` ホストが検査できる QA ランナーメタデータ
- カタログおよび検証サーフェスにマージされるチャネル固有の設定メタデータ

**使用しない用途:** ランタイム動作の登録、コードエントリポイントの宣言、
または npm インストールメタデータ。これらは Plugin コードと `package.json` に属します。

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

| フィールド                           | 必須     | 型                               | 意味                                                                                                                                                                                                                                            |
| ------------------------------------ | -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | はい     | `string`                         | 正規の plugin id。これは `plugins.entries.<id>` で使用される id です。                                                                                                                                                                          |
| `configSchema`                       | はい     | `object`                         | この plugin の設定用インライン JSON Schema。                                                                                                                                                                                                    |
| `requiresPlugins`                    | いいえ   | `string[]`                       | この plugin が効果を持つために、併せてインストールされている必要がある plugin id。探索では plugin を読み込み可能なままにしますが、必須 plugin が欠けている場合は警告します。                                                                  |
| `enabledByDefault`                   | いいえ   | `true`                           | バンドルされた plugin をデフォルトで有効としてマークします。省略するか、非 `true` 値を設定すると、その plugin はデフォルトで無効のままになります。                                                                                             |
| `enabledByDefaultOnPlatforms`        | いいえ   | `string[]`                       | バンドルされた plugin を、列挙された Node.js プラットフォーム上でのみデフォルトで有効としてマークします。例: `["darwin"]`。明示的な設定が常に優先されます。                                                                                    |
| `legacyPluginIds`                    | いいえ   | `string[]`                       | この正規の plugin id に正規化されるレガシー id。                                                                                                                                                                                                |
| `autoEnableWhenConfiguredProviders`  | いいえ   | `string[]`                       | auth、設定、またはモデル参照で言及されたときに、この plugin を自動有効化する provider id。                                                                                                                                                      |
| `kind`                               | いいえ   | `"memory"` \| `"context-engine"` | `plugins.slots.*` で使用される排他的な plugin 種別を宣言します。                                                                                                                                                                                |
| `channels`                           | いいえ   | `string[]`                       | この plugin が所有する channel id。探索と設定検証に使用されます。                                                                                                                                                                               |
| `providers`                          | いいえ   | `string[]`                       | この plugin が所有する provider id。                                                                                                                                                                                                            |
| `providerCatalogEntry`               | いいえ   | `string`                         | plugin ルートからの相対パスで指定する軽量な provider catalog モジュールパス。完全な plugin runtime を起動せずに読み込める、manifest スコープの provider catalog メタデータ用です。                                                             |
| `modelSupport`                       | いいえ   | `object`                         | runtime 前に plugin を自動読み込みするために使用される、manifest 所有のモデルファミリー短縮メタデータ。                                                                                                                                        |
| `modelCatalog`                       | いいえ   | `object`                         | この plugin が所有する provider 向けの宣言的なモデルカタログメタデータ。plugin runtime を読み込まずに将来の読み取り専用一覧、オンボーディング、モデルピッカー、エイリアス、抑制を行うための制御プレーン契約です。                           |
| `modelPricing`                       | いいえ   | `object`                         | provider 所有の外部価格検索ポリシー。ローカル/セルフホスト provider をリモート価格カタログの対象外にしたり、core に provider id をハードコードせずに provider 参照を OpenRouter/LiteLLM カタログ id にマッピングしたりするために使用します。 |
| `modelIdNormalization`               | いいえ   | `object`                         | provider runtime の読み込み前に実行する必要がある、provider 所有の model-id エイリアス/プレフィックスのクリーンアップ。                                                                                                                       |
| `providerEndpoints`                  | いいえ   | `object[]`                       | provider runtime の読み込み前に core が分類する必要がある provider ルート向けの、manifest 所有の endpoint host/baseUrl メタデータ。                                                                                                            |
| `providerRequest`                    | いいえ   | `object`                         | provider runtime の読み込み前に汎用リクエストポリシーで使用される、低コストな provider ファミリーおよびリクエスト互換性メタデータ。                                                                                                           |
| `secretProviderIntegrations`         | いいえ   | `Record<string, object>`         | setup またはインストール画面が、core に provider 固有の連携をハードコードせずに提示できる、宣言的な SecretRef exec provider プリセット。                                                                                                       |
| `cliBackends`                        | いいえ   | `string[]`                       | この plugin が所有する CLI 推論 backend id。明示的な設定参照から起動時に自動有効化するために使用されます。                                                                                                                                     |
| `syntheticAuthRefs`                  | いいえ   | `string[]`                       | runtime の読み込み前、コールドモデル探索中に plugin 所有の synthetic auth hook を調べるべき provider または CLI backend 参照。                                                                                                                 |
| `nonSecretAuthMarkers`               | いいえ   | `string[]`                       | 非 secret のローカル、OAuth、または周辺 credential 状態を表す、バンドル plugin 所有のプレースホルダー API キー値。                                                                                                                             |
| `commandAliases`                     | いいえ   | `object[]`                       | runtime の読み込み前に plugin 対応の設定および CLI 診断を生成するべき、この plugin が所有するコマンド名。                                                                                                                                      |
| `providerAuthEnvVars`                | いいえ   | `Record<string, string[]>`       | provider auth/status 検索用の非推奨互換 env メタデータ。新しい plugin では `setup.providers[].envVars` を優先してください。OpenClaw は非推奨期間中、引き続きこれを読み取ります。                                                              |
| `providerAuthAliases`                | いいえ   | `Record<string, string>`         | auth 検索のために別の provider id を再利用するべき provider id。たとえば、ベース provider の API キーと auth プロファイルを共有する coding provider などです。                                                                                |
| `channelEnvVars`                     | いいえ   | `Record<string, string[]>`       | OpenClaw が plugin コードを読み込まずに検査できる、低コストな channel env メタデータ。env 駆動の channel setup や、汎用の起動/設定ヘルパーが見るべき auth 画面に使用します。                                                                   |
| `providerAuthChoices`                | いいえ   | `object[]`                       | オンボーディングのピッカー、優先 provider 解決、単純な CLI フラグ配線のための、低コストな auth-choice メタデータ。                                                                                                                            |
| `activation`                         | いいえ   | `object`                         | 起動、provider、コマンド、channel、ルート、capability トリガーによる読み込みのための、低コストな activation planner メタデータ。メタデータのみで、実際の挙動は引き続き plugin runtime が所有します。                                          |
| `setup`                              | いいえ   | `object`                         | 探索と setup 画面が plugin runtime を読み込まずに検査できる、低コストな setup/オンボーディング記述子。                                                                                                                                        |
| `qaRunners`                          | いいえ   | `object[]`                       | plugin runtime の読み込み前に共有 `openclaw qa` ホストが使用する、低コストな QA runner 記述子。                                                                                                                                                |
| `contracts`                          | いいえ   | `object`                         | 外部 auth hook、embeddings、speech、realtime transcription、realtime voice、media-understanding、image-generation、music-generation、video-generation、web-fetch、web search、tool 所有権の静的な capability 所有権スナップショット。         |
| `mediaUnderstandingProviderMetadata` | いいえ   | `Record<string, object>`         | `contracts.mediaUnderstandingProviders` で宣言された provider id 向けの、低コストな media-understanding デフォルト。                                                                                                                          |
| `imageGenerationProviderMetadata`    | いいえ   | `Record<string, object>`         | `contracts.imageGenerationProviders` で宣言された provider id 向けの、低コストな image-generation auth メタデータ。provider 所有の auth エイリアスと base-url ガードを含みます。                                                              |
| `videoGenerationProviderMetadata`    | いいえ   | `Record<string, object>`         | `contracts.videoGenerationProviders` で宣言された provider id 向けの、低コストな video-generation auth メタデータ。provider 所有の auth エイリアスと base-url ガードを含みます。                                                              |
| `musicGenerationProviderMetadata`    | いいえ   | `Record<string, object>`         | `contracts.musicGenerationProviders` で宣言された provider id 向けの、低コストな music-generation auth メタデータ。provider 所有の auth エイリアスと base-url ガードを含みます。                                                              |
| `toolMetadata`                       | いいえ       | `Record<string, object>`         | `contracts.tools` で宣言された Plugin 所有ツール向けの低コストな可用性メタデータ。設定、環境変数、または認証の証拠が存在しない限りツールがランタイムを読み込むべきでない場合に使用します。                                                                       |
| `channelConfigs`                     | いいえ       | `Record<string, object>`         | ランタイム読み込み前に、検出および検証サーフェスへマージされる、マニフェスト所有のチャンネル設定メタデータ。                                                                                                                                      |
| `skills`                             | いいえ       | `string[]`                       | 読み込む Skills ディレクトリ。Plugin ルートからの相対パスです。                                                                                                                                                                                         |
| `name`                               | いいえ       | `string`                         | 人間が読める Plugin 名。                                                                                                                                                                                                                     |
| `description`                        | いいえ       | `string`                         | Plugin サーフェスに表示される短い概要。                                                                                                                                                                                                         |
| `icon`                               | いいえ       | `string`                         | マーケットプレイス/カタログカード用の HTTPS 画像 URL。ClawHub は有効な任意の `https://` URL を受け入れ、これが省略されているか無効な場合はデフォルトの Plugin アイコンにフォールバックします。                                                                              |
| `version`                            | いいえ       | `string`                         | 情報提供用の Plugin バージョン。                                                                                                                                                                                                                   |
| `uiHints`                            | いいえ       | `Record<string, object>`         | 設定フィールド用の UI ラベル、プレースホルダー、および機密性ヒント。                                                                                                                                                                               |

## 生成プロバイダーメタデータリファレンス

生成プロバイダーメタデータフィールドは、対応する `contracts.*GenerationProviders` リストで宣言されたプロバイダーの静的認証シグナルを記述します。
OpenClaw はプロバイダーランタイムが読み込まれる前にこれらのフィールドを読み取るため、コアツールはすべてのプロバイダー Plugin をインポートせずに生成プロバイダーが利用可能かどうかを判断できます。

これらのフィールドは、低コストで宣言的な事実にのみ使用してください。トランスポート、リクエスト変換、トークン更新、認証情報の検証、実際の生成動作は Plugin ランタイムに留まります。

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

| フィールド | 必須 | 型 | 意味 |
| ---------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases` | いいえ | `string[]` | 生成プロバイダーの静的認証エイリアスとして扱う追加のプロバイダー ID。 |
| `authProviders` | いいえ | `string[]` | この生成プロバイダーの認証として扱う、設定済み認証プロファイルを持つプロバイダー ID。 |
| `configSignals` | いいえ | `object[]` | 認証プロファイルや環境変数なしで設定できる、ローカルまたはセルフホスト型プロバイダー向けの低コストな設定のみの可用性シグナル。 |
| `authSignals` | いいえ | `object[]` | 明示的な認証シグナル。存在する場合、プロバイダー ID、`aliases`、`authProviders` から得られるデフォルトのシグナルセットを置き換えます。 |
| `referenceAudioInputs` | いいえ | `boolean` | 動画生成のみ。プロバイダーが参照音声アセットを受け付ける場合は `true` に設定します。それ以外の場合、`video_generate` は音声参照パラメーターを非表示にします。 |

各 `configSignals` エントリは以下をサポートします。

| フィールド | 必須 | 型 | 意味 |
| ---------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath` | はい | `string` | 検査対象となる Plugin 所有の設定オブジェクトへのドットパス。例: `plugins.entries.example.config`。 |
| `overlayPath` | いいえ | `string` | シグナルを評価する前にルートオブジェクトへオーバーレイするオブジェクトを指す、ルート設定内のドットパス。`image`、`video`、`music` など、機能固有の設定に使用します。 |
| `overlayMapPath` | いいえ | `string` | ルートオブジェクトへそれぞれオーバーレイするオブジェクト値を指す、ルート設定内のドットパス。設定済みのいずれかのアカウントで条件を満たす `accounts` などの名前付きアカウントマップに使用します。 |
| `required` | いいえ | `string[]` | 有効な設定内で、設定済みの値を持つ必要があるドットパス。文字列は空であってはならず、オブジェクトと配列も空であってはなりません。 |
| `requiredAny` | いいえ | `string[]` | 有効な設定内で、少なくとも 1 つが設定済みの値を持つ必要があるドットパス。 |
| `mode` | いいえ | `object` | 有効な設定内の任意の文字列モードガード。設定のみの可用性が 1 つのモードにのみ適用される場合に使用します。 |

各 `mode` ガードは以下をサポートします。

| フィールド | 必須 | 型 | 意味 |
| ------------ | -------- | ---------- | ---------------------------------------------------------------------------------- |
| `path` | いいえ | `string` | 有効な設定内のドットパス。デフォルトは `mode` です。 |
| `default` | いいえ | `string` | 設定でパスが省略された場合に使用するモード値。 |
| `allowed` | いいえ | `string[]` | 存在する場合、有効なモードがこれらの値のいずれかである場合にのみシグナルが通ります。 |
| `disallowed` | いいえ | `string[]` | 存在する場合、有効なモードがこれらの値のいずれかである場合にシグナルは失敗します。 |

各 `authSignals` エントリは以下をサポートします。

| フィールド | 必須 | 型 | 意味 |
| ----------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | はい | `string` | 設定済み認証プロファイルで確認するプロバイダー ID。 |
| `providerBaseUrl` | いいえ | `object` | 参照された設定済みプロバイダーが許可されたベース URL を使用している場合にのみシグナルを有効にする任意のガード。認証エイリアスが特定の API に対してのみ有効な場合に使用します。 |

各 `providerBaseUrl` ガードは以下をサポートします。

| フィールド | 必須 | 型 | 意味 |
| ----------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | はい | `string` | `baseUrl` を確認する対象のプロバイダー設定 ID。 |
| `defaultBaseUrl` | いいえ | `string` | プロバイダー設定で `baseUrl` が省略された場合に仮定するベース URL。 |
| `allowedBaseUrls` | はい | `string[]` | この認証シグナルで許可されるベース URL。設定済みまたはデフォルトのベース URL が、これらの正規化済み値のいずれにも一致しない場合、シグナルは無視されます。 |

## ツールメタデータリファレンス

`toolMetadata` は、ツール名をキーとして、生成プロバイダーメタデータと同じ `configSignals` および `authSignals` の形を使用します。`contracts.tools` は所有権を宣言します。`toolMetadata` は低コストな可用性エビデンスを宣言し、OpenClaw がツールファクトリから `null` が返るかどうかを確認するだけのために Plugin ランタイムをインポートすることを避けられるようにします。

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

ツールに `toolMetadata` がない場合、OpenClaw は既存の動作を維持し、ツール契約がポリシーに一致するときに所有元の Plugin を読み込みます。ファクトリが認証や設定に依存するホットパスのツールでは、Plugin 作成者は、問い合わせのためにコアへランタイムをインポートさせるのではなく、`toolMetadata` を宣言するべきです。

## providerAuthChoices リファレンス

各 `providerAuthChoices` エントリは、1 つのオンボーディングまたは認証の選択肢を記述します。
OpenClaw はプロバイダーランタイムが読み込まれる前にこれを読み取ります。
プロバイダーセットアップリストは、プロバイダーランタイムを読み込まずに、これらのマニフェスト選択肢、記述子から導出されたセットアップ選択肢、インストールカタログメタデータを使用します。

| フィールド          | 必須     | 型                                                                    | 意味                                                                                                                           |
| --------------------- | -------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `provider`            | はい     | `string`                                                              | この選択肢が属するプロバイダー id。                                                                                           |
| `method`              | はい     | `string`                                                              | ディスパッチ先の認証メソッド id。                                                                                             |
| `choiceId`            | はい     | `string`                                                              | オンボーディングと CLI フローで使用される安定した認証選択肢 id。                                                              |
| `choiceLabel`         | いいえ   | `string`                                                              | ユーザー向けラベル。省略した場合、OpenClaw は `choiceId` にフォールバックする。                                                |
| `choiceHint`          | いいえ   | `string`                                                              | ピッカー用の短い補助テキスト。                                                                                                 |
| `assistantPriority`   | いいえ   | `number`                                                              | 値が小さいほど、アシスタント主導の対話型ピッカーで早く並ぶ。                                                                   |
| `assistantVisibility` | いいえ   | `"visible"` \| `"manual-only"`                                        | 手動の CLI 選択は許可したまま、アシスタントのピッカーからこの選択肢を非表示にする。                                           |
| `deprecatedChoiceIds` | いいえ   | `string[]`                                                            | ユーザーをこの置換選択肢へリダイレクトするべき従来の選択肢 id。                                                                |
| `groupId`             | いいえ   | `string`                                                              | 関連する選択肢をグループ化するための任意のグループ id。                                                                        |
| `groupLabel`          | いいえ   | `string`                                                              | そのグループのユーザー向けラベル。                                                                                             |
| `groupHint`           | いいえ   | `string`                                                              | グループ用の短い補助テキスト。                                                                                                 |
| `optionKey`           | いいえ   | `string`                                                              | 単純な 1 フラグ認証フロー用の内部オプションキー。                                                                              |
| `cliFlag`             | いいえ   | `string`                                                              | `--openrouter-api-key` などの CLI フラグ名。                                                                                   |
| `cliOption`           | いいえ   | `string`                                                              | `--openrouter-api-key <key>` などの完全な CLI オプション形式。                                                                 |
| `cliDescription`      | いいえ   | `string`                                                              | CLI ヘルプで使用される説明。                                                                                                   |
| `onboardingScopes`    | いいえ   | `Array<"text-inference" \| "image-generation" \| "music-generation">` | この選択肢を表示するオンボーディングの対象面。省略した場合、デフォルトは `["text-inference"]`。                               |

## commandAliases リファレンス

Plugin が、ユーザーが誤って `plugins.allow` に入れたりルート CLI コマンドとして実行しようとしたりする可能性のあるランタイムコマンド名を所有する場合は、`commandAliases` を使用する。OpenClaw は、Plugin ランタイムコードをインポートせずに診断のためにこのメタデータを使用する。

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

| フィールド   | 必須     | 型                | 意味                                                                 |
| ------------ | -------- | ----------------- | -------------------------------------------------------------------- |
| `name`       | はい     | `string`          | この Plugin に属するコマンド名。                                     |
| `kind`       | いいえ   | `"runtime-slash"` | ルート CLI コマンドではなくチャットのスラッシュコマンドとしてエイリアスを示す。 |
| `cliCommand` | いいえ   | `string`          | 存在する場合、CLI 操作用に提案する関連ルート CLI コマンド。           |

## activation リファレンス

Plugin が、どのコントロールプレーンイベントで activation/load 計画に含めるべきかを安価に宣言できる場合は、`activation` を使用する。

このブロックはプランナーのメタデータであり、ライフサイクル API ではない。ランタイム動作を登録せず、`register(...)` を置き換えず、Plugin コードがすでに実行済みであることも約束しない。activation プランナーは、既存のマニフェスト所有権メタデータ（`providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools`、フックなど）にフォールバックする前に、これらのフィールドを使用して候補 Plugin を絞り込む。

所有権をすでに説明している最も狭いメタデータを優先する。関係を表現できる場合は、`providers`、`channels`、`commandAliases`、セットアップ記述子、または `contracts` を使用する。これらの所有権フィールドでは表現できない追加のプランナーヒントには `activation` を使用する。
`claude-cli`、`my-cli`、`google-gemini-cli` などの CLI ランタイムエイリアスにはトップレベルの `cliBackends` を使用する。`activation.onAgentHarnesses` は、所有権フィールドをまだ持たない埋め込みエージェントハーネス id 専用。

このブロックはメタデータのみ。ランタイム動作を登録せず、`register(...)`、`setupEntry`、その他のランタイム/Plugin エントリポイントを置き換えない。現在のコンシューマーは、より広範な Plugin ロードの前に絞り込みヒントとして使用するため、起動時以外の activation メタデータが欠けていても、通常は性能に影響するだけである。マニフェスト所有権フォールバックがまだ存在する限り、正しさは変わらないはずである。

すべての Plugin は `activation.onStartup` を意図的に設定するべきである。Plugin が Gateway 起動中に実行される必要がある場合にのみ `true` に設定する。Plugin が起動時には不活性で、より狭いトリガーからのみロードされるべき場合は `false` に設定する。`onStartup` を省略しても、Plugin は暗黙に起動時ロードされなくなった。起動、チャネル、設定、エージェントハーネス、メモリ、またはその他のより狭い activation トリガーには、明示的な activation メタデータを使用する。

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

| フィールド         | 必須     | 型                                                   | 意味                                                                                                                                                                                        |
| ------------------ | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | いいえ   | `boolean`                                            | 明示的な Gateway 起動 activation。すべての Plugin がこれを設定するべきである。`true` は起動中に Plugin をインポートする。`false` は、別の一致したトリガーがロードを必要としない限り、起動時には遅延させる。 |
| `onProviders`      | いいえ   | `string[]`                                           | activation/load 計画にこの Plugin を含めるべきプロバイダー id。                                                                                                                            |
| `onAgentHarnesses` | いいえ   | `string[]`                                           | activation/load 計画にこの Plugin を含めるべき埋め込みエージェントハーネスのランタイム id。CLI バックエンドエイリアスにはトップレベルの `cliBackends` を使用する。                         |
| `onCommands`       | いいえ   | `string[]`                                           | activation/load 計画にこの Plugin を含めるべきコマンド id。                                                                                                                                 |
| `onChannels`       | いいえ   | `string[]`                                           | activation/load 計画にこの Plugin を含めるべきチャネル id。                                                                                                                                 |
| `onRoutes`         | いいえ   | `string[]`                                           | activation/load 計画にこの Plugin を含めるべきルート種別。                                                                                                                                  |
| `onConfigPaths`    | いいえ   | `string[]`                                           | パスが存在し、明示的に無効化されていない場合に、起動/load 計画にこの Plugin を含めるべきルート相対の設定パス。                                                                              |
| `onCapabilities`   | いいえ   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | コントロールプレーンの activation 計画で使用される広範な capability ヒント。可能な場合は、より狭いフィールドを優先する。                                                                   |

現在のライブコンシューマー:

- Gateway 起動計画は、明示的な起動インポートに `activation.onStartup` を使用する
- コマンドトリガーの CLI 計画は、従来の `commandAliases[].cliCommand` または `commandAliases[].name` にフォールバックする
- エージェントランタイムの起動計画は、埋め込みハーネスには `activation.onAgentHarnesses` を、CLI ランタイムエイリアスにはトップレベルの `cliBackends[]` を使用する
- チャネルトリガーの setup/channel 計画は、明示的なチャネル activation メタデータが欠けている場合、従来の `channels[]` 所有権にフォールバックする
- 起動時の Plugin 計画は、バンドルされたブラウザー Plugin の `browser` ブロックなど、チャネルではないルート設定面に `activation.onConfigPaths` を使用する
- プロバイダートリガーの setup/runtime 計画は、明示的なプロバイダー activation メタデータが欠けている場合、従来の `providers[]` とトップレベルの `cliBackends[]` 所有権にフォールバックする

プランナー診断は、明示的な activation ヒントとマニフェスト所有権フォールバックを区別できる。たとえば、`activation-command-hint` は `activation.onCommands` が一致したことを意味し、`manifest-command-alias` はプランナーが代わりに `commandAliases` 所有権を使用したことを意味する。これらの理由ラベルはホスト診断とテスト用である。Plugin 作者は、所有権を最もよく説明するメタデータを宣言し続けるべきである。

## qaRunners リファレンス

Plugin が共有の `openclaw qa` ルート配下に 1 つ以上のトランスポートランナーを提供する場合は、`qaRunners` を使用する。このメタデータは安価で静的に保つ。実際の CLI 登録は、`qaRunnerCliRegistrations` をエクスポートする軽量な `runtime-api.ts` サーフェスを通じて、引き続き Plugin ランタイムが所有する。

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

| フィールド         | 必須 | 型     | 意味                                                      |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | はい      | `string` | `openclaw qa` の下にマウントされるサブコマンド。例: `matrix`。    |
| `description` | いいえ       | `string` | 共有ホストがスタブコマンドを必要とする場合に使われるフォールバックヘルプテキスト。 |

## setup リファレンス

ランタイムのロード前に、セットアップとオンボーディングのサーフェスが安価な Plugin 所有メタデータを必要とする場合は、`setup` を使用します。

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

トップレベルの `cliBackends` は引き続き有効で、CLI 推論バックエンドを説明し続けます。`setup.cliBackends` は、メタデータのみのままにすべきコントロールプレーン/セットアップフロー向けの、セットアップ専用ディスクリプターサーフェスです。

存在する場合、`setup.providers` と `setup.cliBackends` は、セットアップ検出のための推奨されるディスクリプター優先ルックアップサーフェスです。ディスクリプターが候補 Plugin を絞り込むだけで、セットアップがセットアップ時ランタイムフックをさらに必要とする場合は、`requiresRuntime: true` を設定し、フォールバック実行パスとして `setup-api` を保持します。

OpenClaw は、汎用プロバイダー認証と環境変数ルックアップにも `setup.providers[].envVars` を含めます。`providerAuthEnvVars` は非推奨期間中、互換性アダプターを通じて引き続きサポートされますが、まだこれを使用している非バンドル Plugin はマニフェスト診断を受け取ります。新しい Plugin は、セットアップ/ステータスの環境メタデータを `setup.providers[].envVars` に置くべきです。

セットアップエントリが利用できない場合、または `setup.requiresRuntime: false` がセットアップランタイム不要を宣言している場合、OpenClaw は `setup.providers[].authMethods` から単純なセットアップ選択肢を導出することもできます。明示的な `providerAuthChoices` エントリは、カスタムラベル、CLI フラグ、オンボーディングスコープ、アシスタントメタデータでは引き続き優先されます。

`requiresRuntime: false` は、それらのディスクリプターがセットアップサーフェスに十分な場合にのみ設定してください。OpenClaw は明示的な `false` をディスクリプターのみの契約として扱い、セットアップルックアップのために `setup-api` または `openclaw.setupEntry` を実行しません。ディスクリプターのみの Plugin がそれらのセットアップランタイムエントリのいずれかをまだ同梱している場合、OpenClaw は追加診断を報告し、それを無視し続けます。`requiresRuntime` を省略すると従来のフォールバック動作が保持されるため、このフラグなしでディスクリプターを追加した既存の Plugin は壊れません。

セットアップルックアップは Plugin 所有の `setup-api` コードを実行できるため、正規化された `setup.providers[].id` と `setup.cliBackends[]` の値は、検出された Plugin 全体で一意である必要があります。所有権が曖昧な場合は、検出順から勝者を選ぶのではなく、フェイルクローズします。

セットアップランタイムが実行される場合、`setup-api` がマニフェストディスクリプターで宣言されていないプロバイダーまたは CLI バックエンドを登録した場合、またはディスクリプターに一致するランタイム登録がない場合、セットアップレジストリ診断はディスクリプターのドリフトを報告します。これらの診断は追加的なものであり、従来の Plugin を拒否しません。

### setup.providers リファレンス

| フィールド          | 必須 | 型       | 意味                                                                                    |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | はい      | `string`   | セットアップまたはオンボーディング中に公開されるプロバイダー ID。正規化された ID はグローバルに一意に保ちます。             |
| `authMethods`  | いいえ       | `string[]` | フルランタイムをロードせずにこのプロバイダーがサポートするセットアップ/認証メソッド ID。                       |
| `envVars`      | いいえ       | `string[]` | Plugin ランタイムのロード前に汎用セットアップ/ステータスサーフェスが確認できる環境変数。               |
| `authEvidence` | いいえ       | `object[]` | 非シークレットマーカーを通じて認証できるプロバイダー向けの安価なローカル認証証拠チェック。 |

`authEvidence` は、ランタイムコードをロードせずに検証できる、プロバイダー所有のローカル認証情報マーカー用です。これらのチェックは安価かつローカルのままでなければなりません。ネットワーク呼び出し、キーチェーンまたはシークレットマネージャーの読み取り、シェルコマンド、プロバイダー API プローブは行いません。

サポートされる証拠エントリ:

| フィールド              | 必須 | 型       | 意味                                                                                                  |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | はい      | `string`   | 現在は `local-file-with-env`。                                                                               |
| `fileEnvVar`       | いいえ       | `string`   | 明示的な認証情報ファイルパスを含む環境変数。                                                           |
| `fallbackPaths`    | いいえ       | `string[]` | `fileEnvVar` が存在しないか空の場合に確認されるローカル認証情報ファイルパス。`${HOME}` と `${APPDATA}` をサポートします。 |
| `requiresAnyEnv`   | いいえ       | `string[]` | 証拠が有効になる前に、一覧の環境変数の少なくとも 1 つが空でない必要があります。                                    |
| `requiresAllEnv`   | いいえ       | `string[]` | 証拠が有効になる前に、一覧のすべての環境変数が空でない必要があります。                                           |
| `credentialMarker` | はい      | `string`   | 証拠が存在する場合に返される非シークレットマーカー。                                                       |
| `source`           | いいえ       | `string`   | 認証/ステータス出力向けのユーザー表示用ソースラベル。                                                               |

### setup フィールド

| フィールド              | 必須 | 型       | 意味                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | いいえ       | `object[]` | セットアップとオンボーディング中に公開されるプロバイダーセットアップディスクリプター。                                     |
| `cliBackends`      | いいえ       | `string[]` | ディスクリプター優先のセットアップルックアップに使われるセットアップ時バックエンド ID。正規化された ID はグローバルに一意に保ちます。 |
| `configMigrations` | いいえ       | `string[]` | この Plugin のセットアップサーフェスが所有する設定移行 ID。                                          |
| `requiresRuntime`  | いいえ       | `boolean`  | ディスクリプタールックアップ後も、セットアップに `setup-api` 実行が必要かどうか。                            |

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

各フィールドヒントには次を含めることができます。

| フィールド         | 型       | 意味                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | ユーザー表示用のフィールドラベル。                |
| `help`        | `string`   | 短いヘルパーテキスト。                      |
| `tags`        | `string[]` | 任意の UI タグ。                       |
| `advanced`    | `boolean`  | フィールドを詳細項目としてマークします。            |
| `sensitive`   | `boolean`  | フィールドをシークレットまたは機密としてマークします。 |
| `placeholder` | `string`   | フォーム入力のプレースホルダーテキスト。       |

## contracts リファレンス

`contracts` は、OpenClaw が Plugin ランタイムをインポートせずに読める静的な機能所有権メタデータにのみ使用します。

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
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

各リストは任意です:

| フィールド                            | 型       | 意味                                                                                                                        |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server 拡張ファクトリー ID。現在は `codex-app-server`。                                                                |
| `agentToolResultMiddleware`      | `string[]` | このプラグインがツール結果ミドルウェアを登録できるランタイム ID。                                                                     |
| `trustedToolPolicies`            | `string[]` | インストール済みプラグインが登録できる、プラグインローカルの信頼済み事前ツールポリシー ID。バンドル済みプラグインはこのフィールドなしでポリシーを登録できる。 |
| `externalAuthProviders`          | `string[]` | このプラグインが外部認証プロファイルフックを所有するプロバイダー ID。                                                                      |
| `embeddingProviders`             | `string[]` | メモリを含む再利用可能なベクトル埋め込み用途向けに、このプラグインが所有する汎用埋め込みプロバイダー ID。                                 |
| `speechProviders`                | `string[]` | このプラグインが所有する音声プロバイダー ID。                                                                                                |
| `realtimeTranscriptionProviders` | `string[]` | このプラグインが所有するリアルタイム文字起こしプロバイダー ID。                                                                                |
| `realtimeVoiceProviders`         | `string[]` | このプラグインが所有するリアルタイム音声プロバイダー ID。                                                                                        |
| `memoryEmbeddingProviders`       | `string[]` | このプラグインが所有する、非推奨のメモリ専用埋め込みプロバイダー ID。                                                                  |
| `mediaUnderstandingProviders`    | `string[]` | このプラグインが所有するメディア理解プロバイダー ID。                                                                                   |
| `transcriptSourceProviders`      | `string[]` | このプラグインが所有するトランスクリプトソースプロバイダー ID。                                                                                     |
| `imageGenerationProviders`       | `string[]` | このプラグインが所有する画像生成プロバイダー ID。                                                                                      |
| `videoGenerationProviders`       | `string[]` | このプラグインが所有する動画生成プロバイダー ID。                                                                                      |
| `webFetchProviders`              | `string[]` | このプラグインが所有する Web 取得プロバイダー ID。                                                                                             |
| `webSearchProviders`             | `string[]` | このプラグインが所有する Web 検索プロバイダー ID。                                                                                            |
| `migrationProviders`             | `string[]` | `openclaw migrate` 用にこのプラグインが所有するインポートプロバイダー ID。                                                                         |
| `gatewayMethodDispatch`          | `string[]` | Gateway メソッドをプロセス内でディスパッチする、認証済みプラグイン HTTP ルート用の予約済みエンタイトルメント。                                  |
| `tools`                          | `string[]` | このプラグインが所有するエージェントツール名。                                                                                                   |

`contracts.embeddedExtensionFactories` は、バンドル済み Codex
app-server 専用拡張ファクトリーのために保持されます。バンドル済みツール結果変換は、
代わりに `contracts.agentToolResultMiddleware` を宣言し、
`api.registerAgentToolResultMiddleware(...)` で登録する必要があります。インストール済みプラグインは、
明示的に有効化され、かつ `contracts.agentToolResultMiddleware` で宣言したランタイムに対してのみ、
同じミドルウェアの継ぎ目を使用できます。

ホスト信頼の事前ツールポリシー階層を必要とするインストール済みプラグインは、
登録される各ローカル ID を `contracts.trustedToolPolicies` で宣言し、明示的に
有効化されている必要があります。バンドル済みプラグインは既存の信頼済みポリシーパスを維持しますが、
未宣言のポリシー ID を持つインストール済みプラグインは登録前に拒否されます。ポリシー ID は
登録するプラグインにスコープされるため、2 つのプラグインがどちらも
`workflow-budget` を宣言して登録できます。ただし、1 つのプラグインが同じローカル ID を
2 回登録することはできません。

ランタイムの `api.registerTool(...)` 登録は `contracts.tools` と一致する必要があります。
ツール探索ではこのリストを使用し、要求されたツールを所有できるプラグインランタイムだけを
読み込みます。

`resolveExternalAuthProfiles` を実装するプロバイダープラグインは
`contracts.externalAuthProviders` を宣言する必要があります。未宣言の外部認証フックは無視されます。

汎用埋め込みプロバイダーは、`api.registerEmbeddingProvider(...)` で登録される
各アダプターについて `contracts.embeddingProviders` を宣言する必要があります。メモリ検索で
消費されるプロバイダーを含む、再利用可能なベクトル生成には汎用契約を使用してください。
`contracts.memoryEmbeddingProviders` は非推奨のメモリ専用互換性であり、
既存プロバイダーが汎用埋め込みプロバイダーの継ぎ目へ移行する間だけ残ります。

`contracts.gatewayMethodDispatch` は現在
`"authenticated-request"` を受け入れます。これは、Gateway コントロールプレーンメソッドを
プロセス内で意図的にディスパッチするネイティブプラグイン HTTP ルート向けの API 衛生ゲートであり、
悪意あるネイティブプラグインに対するサンドボックスではありません。Gateway HTTP 認証をすでに要求する、
厳密にレビューされたバンドル済みまたはオペレーター向けサーフェスにのみ使用してください。

## mediaUnderstandingProviderMetadata リファレンス

メディア理解プロバイダーに、デフォルトモデル、自動認証フォールバック優先度、または
ランタイム読み込み前に汎用コアヘルパーが必要とするネイティブドキュメント対応がある場合は、
`mediaUnderstandingProviderMetadata` を使用します。キーは
`contracts.mediaUnderstandingProviders` でも宣言されている必要があります。

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

各プロバイダーエントリには次を含めることができます。

| フィールド                  | 型                                | 意味                                                                |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | このプロバイダーが公開するメディア機能。                                 |
| `defaultModels`        | `Record<string, string>`            | 設定でモデルが指定されていない場合に使用される、機能からモデルへのデフォルト。      |
| `autoPriority`         | `Record<string, number>`            | 認証情報ベースの自動プロバイダーフォールバックでは、小さい数値ほど先に並びます。 |
| `nativeDocumentInputs` | `"pdf"[]`                           | プロバイダーが対応するネイティブドキュメント入力。                            |

## channelConfigs リファレンス

チャンネルプラグインがランタイム読み込み前に軽量な設定メタデータを必要とする場合は、
`channelConfigs` を使用します。読み取り専用のチャンネルセットアップまたはステータス探索では、
セットアップエントリが利用できない場合、または `setup.requiresRuntime: false` がセットアップランタイム不要を
宣言している場合に、設定済み外部チャンネルに対してこのメタデータを直接使用できます。

`channelConfigs` はプラグインマニフェストメタデータであり、新しいトップレベルのユーザー設定
セクションではありません。ユーザーは引き続き `channels.<channel-id>` の下でチャンネルインスタンスを
設定します。OpenClaw はマニフェストメタデータを読み取り、プラグインランタイムコードが実行される前に、
どのプラグインがその設定済みチャンネルを所有するかを決定します。

チャンネルプラグインでは、`configSchema` と `channelConfigs` は異なるパスを記述します。

- `configSchema` は `plugins.entries.<plugin-id>.config` を検証します
- `channelConfigs.<channel-id>.schema` は `channels.<channel-id>` を検証します

`channels[]` を宣言する非バンドルプラグインは、一致する
`channelConfigs` エントリも宣言する必要があります。それらがない場合でも、OpenClaw はプラグインを読み込めますが、
コールドパスの設定スキーマ、セットアップ、および Control UI サーフェスは、プラグインランタイムが実行されるまで
チャンネル所有オプションの形を知ることができません。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` と
`nativeSkillsAutoEnabled` は、チャンネルランタイムの読み込み前に実行されるコマンド設定チェック用の
静的な `auto` デフォルトを宣言できます。バンドル済みチャンネルは、他のパッケージ所有チャンネルカタログ
メタデータと並べて、`package.json#openclaw.channel.commands` を通じて同じデフォルトを公開することもできます。

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

各チャンネルエントリには次を含めることができます。

| フィールド         | 型                     | 意味                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` 用の JSON Schema。宣言された各チャンネル設定エントリに必須です。         |
| `uiHints`     | `Record<string, object>` | そのチャンネル設定セクション向けの任意の UI ラベル、プレースホルダー、機密ヒント。          |
| `label`       | `string`                 | ランタイムメタデータが準備できていない場合に、ピッカーと検査サーフェスへマージされるチャンネルラベル。 |
| `description` | `string`                 | 検査およびカタログサーフェス向けの短いチャンネル説明。                               |
| `commands`    | `object`                 | ランタイム前の設定チェック向けの、静的なネイティブコマンドおよびネイティブ Skills 自動デフォルト。       |
| `preferOver`  | `string[]`               | 選択サーフェスでこのチャンネルが上回るべき、レガシーまたは低優先度のプラグイン ID。    |

### 別のチャンネルプラグインを置き換える

別のプラグインも提供できるチャンネル ID について、自分のプラグインが優先所有者である場合は
`preferOver` を使用します。一般的なケースとして、名前変更されたプラグイン ID、
バンドル済みプラグインを置き換えるスタンドアロンプラグイン、または設定互換性のために
同じチャンネル ID を維持するメンテナンス済みフォークがあります。

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

`channels.chat` が設定されている場合、OpenClaw はチャンネル ID と
優先プラグイン ID の両方を考慮します。低優先度のプラグインが、バンドル済みである、またはデフォルトで有効化されている
という理由だけで選択されていた場合、OpenClaw は有効なランタイム設定内でそれを無効化し、
1 つのプラグインがそのチャンネルとツールを所有するようにします。明示的なユーザー選択は引き続き優先されます。
ユーザーが両方のプラグインを明示的に有効化した場合、OpenClaw は要求されたプラグインセットを
暗黙に変更するのではなく、その選択を保持し、重複するチャンネルまたはツールの診断を報告します。

`preferOver` は、本当に同じチャンネルを提供できるプラグイン ID にスコープしてください。
これは汎用の優先度フィールドではなく、ユーザー設定キーをリネームするものでもありません。

## modelSupport リファレンス

OpenClaw が Plugin ランタイムを読み込む前に、`gpt-5.5` や `claude-sonnet-4.6` のような短縮モデル ID からプロバイダー Plugin を推論する必要がある場合は、`modelSupport` を使用します。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw はこの優先順位を適用します。

- 明示的な `provider/model` 参照は、所有元の `providers` マニフェストメタデータを使用します
- `modelPatterns` は `modelPrefixes` より優先されます
- 非バンドル Plugin とバンドル Plugin の両方が一致する場合、非バンドル Plugin が優先されます
- 残る曖昧さは、ユーザーまたは設定がプロバイダーを指定するまで無視されます

フィールド:

| フィールド      | 型         | 意味                                                                            |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 短縮モデル ID に対して `startsWith` で照合されるプレフィックス。                 |
| `modelPatterns` | `string[]` | プロファイルサフィックスの削除後、短縮モデル ID に対して照合される正規表現ソース。 |

`modelPatterns` エントリは `compileSafeRegex` を通じてコンパイルされ、ネストした繰り返しを含むパターン（例: `(a+)+$`）は拒否されます。安全性チェックに失敗したパターンは、構文的に無効な正規表現と同様に、黙ってスキップされます。パターンは単純に保ち、ネストした量指定子は避けてください。

## `modelCatalog` リファレンス

OpenClaw が Plugin ランタイムを読み込む前に、プロバイダーモデルのメタデータを把握する必要がある場合は、`modelCatalog` を使用します。これは、固定カタログ行、プロバイダーエイリアス、抑制ルール、検出モードについて、マニフェストが所有するソースです。ランタイム更新は引き続きプロバイダーランタイムコードに属しますが、マニフェストはランタイムが必要になるタイミングをコアへ伝えます。

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

| フィールド       | 型                                                       | 意味                                                                                                       |
| ---------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | この Plugin が所有するプロバイダー ID のカタログ行。キーはトップレベルの `providers` にも現れる必要があります。 |
| `aliases`        | `Record<string, object>`                                 | カタログまたは抑制の計画で、所有済みプロバイダーに解決されるべきプロバイダーエイリアス。                   |
| `suppressions`   | `object[]`                                               | この Plugin がプロバイダー固有の理由で抑制する、別ソース由来のモデル行。                                    |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | プロバイダーカタログをマニフェストメタデータから読めるか、キャッシュへ更新できるか、ランタイムが必要か。     |
| `runtimeAugment` | `boolean`                                                | マニフェスト/設定の計画後にプロバイダーランタイムがカタログ行を追加する必要がある場合にのみ `true` に設定します。 |

`aliases` は、モデルカタログ計画におけるプロバイダー所有権の検索に参加します。エイリアスのターゲットは、同じ Plugin が所有するトップレベルプロバイダーでなければなりません。プロバイダーでフィルターされたリストがエイリアスを使用する場合、OpenClaw は所有元マニフェストを読み、プロバイダーランタイムを読み込まずにエイリアスの API/base URL オーバーライドを適用できます。
エイリアスはフィルターなしのカタログ一覧を展開しません。広範な一覧では、所有元の正規プロバイダー行のみが出力されます。

`suppressions` は、古いプロバイダーランタイムの `suppressBuiltInModel` フックを置き換えます。抑制エントリは、プロバイダーが Plugin に所有されている場合、または所有済みプロバイダーをターゲットとする `modelCatalog.aliases` キーとして宣言されている場合にのみ尊重されます。モデル解決中にランタイム抑制フックは呼び出されなくなりました。

プロバイダーフィールド:

| フィールド | 型                       | 意味                                                                  |
| ---------- | ------------------------ | --------------------------------------------------------------------- |
| `baseUrl`  | `string`                 | このプロバイダーカタログ内モデルの任意のデフォルト base URL。          |
| `api`      | `ModelApi`               | このプロバイダーカタログ内モデルの任意のデフォルト API アダプター。    |
| `headers`  | `Record<string, string>` | このプロバイダーカタログに適用される任意の静的ヘッダー。              |
| `models`   | `object[]`               | 必須のモデル行。`id` のない行は無視されます。                         |

モデルフィールド:

| フィールド      | 型                                                             | 意味                                                                           |
| --------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `id`            | `string`                                                       | `provider/` プレフィックスを含まない、プロバイダー内のモデル ID。              |
| `name`          | `string`                                                       | 任意の表示名。                                                                 |
| `api`           | `ModelApi`                                                     | 任意のモデル単位 API オーバーライド。                                          |
| `baseUrl`       | `string`                                                       | 任意のモデル単位 base URL オーバーライド。                                     |
| `headers`       | `Record<string, string>`                                       | 任意のモデル単位静的ヘッダー。                                                 |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | モデルが受け付けるモダリティ。                                                 |
| `reasoning`     | `boolean`                                                      | モデルが reasoning 動作を公開するかどうか。                                    |
| `contextWindow` | `number`                                                       | ネイティブプロバイダーのコンテキストウィンドウ。                               |
| `contextTokens` | `number`                                                       | `contextWindow` と異なる場合の、任意の有効ランタイムコンテキスト上限。          |
| `maxTokens`     | `number`                                                       | 既知の場合の最大出力トークン数。                                               |
| `cost`          | `object`                                                       | 任意の 100 万トークンあたり USD 価格。任意の `tieredPricing` を含みます。       |
| `compat`        | `object`                                                       | OpenClaw モデル設定互換性に一致する任意の互換性フラグ。                        |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 一覧表示ステータス。行を一切表示してはいけない場合にのみ抑制してください。      |
| `statusReason`  | `string`                                                       | 利用可能でないステータスとともに表示される任意の理由。                         |
| `replaces`      | `string[]`                                                     | このモデルが置き換える、より古いプロバイダー内モデル ID。                      |
| `replacedBy`    | `string`                                                       | 非推奨行に対する置き換え先のプロバイダー内モデル ID。                          |
| `tags`          | `string[]`                                                     | ピッカーとフィルターで使用される安定したタグ。                                 |

抑制フィールド:

| フィールド                 | 型         | 意味                                                                                                   |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| `provider`                 | `string`   | 抑制する上流行のプロバイダー ID。この Plugin に所有されているか、所有済みエイリアスとして宣言されている必要があります。 |
| `model`                    | `string`   | 抑制するプロバイダー内モデル ID。                                                                       |
| `reason`                   | `string`   | 抑制された行が直接要求されたときに表示される任意のメッセージ。                                         |
| `when.baseUrlHosts`        | `string[]` | 抑制が適用される前に必要となる、有効なプロバイダー base URL ホストの任意のリスト。                      |
| `when.providerConfigApiIn` | `string[]` | 抑制が適用される前に必要となる、完全一致の provider-config `api` 値の任意のリスト。                    |

ランタイム専用データを `modelCatalog` に入れないでください。プロバイダーでフィルターされた一覧やピッカー画面がレジストリ/ランタイム検出をスキップするのに十分なほどマニフェスト行が完全な場合にのみ、`static` を使用します。マニフェスト行が一覧表示可能な有用な種データまたは補助データだが、更新/キャッシュによって後からさらに行を追加できる場合は、`refreshable` を使用します。refreshable 行はそれ自体では権威ある情報ではありません。OpenClaw が一覧を把握するためにプロバイダーランタイムを読み込む必要がある場合は、`runtime` を使用します。

## `modelIdNormalization` リファレンス

プロバイダーランタイムの読み込み前に行う必要がある、低コストでプロバイダー所有のモデル ID クリーンアップには、`modelIdNormalization` を使用します。これにより、短いモデル名、プロバイダー内のレガシー ID、プロキシプレフィックスルールなどのエイリアスを、コアのモデル選択テーブルではなく、所有元 Plugin マニフェスト内に保持できます。

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

| フィールド                           | 型                      | 意味                                                                                 |
| ------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------ |
| `aliases`                            | `Record<string,string>` | 大文字小文字を区別しない完全一致のモデル ID エイリアス。値は記述されたまま返されます。 |
| `stripPrefixes`                      | `string[]`              | エイリアス検索の前に削除するプレフィックス。レガシーな provider/model 重複に有用です。 |
| `prefixWhenBare`                     | `string`                | 正規化後のモデル ID に `/` がまだ含まれていない場合に追加するプレフィックス。          |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | エイリアス検索後の条件付き bare-id プレフィックスルール。`modelPrefix` と `prefix` でキー指定されます。 |

## `providerEndpoints` リファレンス

汎用リクエストポリシーがプロバイダーランタイムの読み込み前に把握する必要があるエンドポイント分類には、`providerEndpoints` を使用します。各 `endpointClass` の意味は引き続きコアが所有します。Plugin マニフェストはホストと base URL メタデータを所有します。

Endpoint フィールド:

| フィールド                   | 型         | 意味                                                                                                      |
| ------------------------------ | ---------- | -------------------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | `openrouter`、`moonshot-native`、`google-vertex` などの既知のコアエンドポイントクラス。                  |
| `hosts`                        | `string[]` | エンドポイントクラスにマッピングされる正確なホスト名。                                                   |
| `hostSuffixes`                 | `string[]` | エンドポイントクラスにマッピングされるホストサフィックス。ドメインサフィックスのみの一致には `.` を付ける。 |
| `baseUrls`                     | `string[]` | エンドポイントクラスにマッピングされる、正規化済みの正確な HTTP(S) ベース URL。                         |
| `googleVertexRegion`           | `string`   | 正確なグローバルホスト用の静的な Google Vertex リージョン。                                             |
| `googleVertexRegionHostSuffix` | `string`   | 一致するホストから削除し、Google Vertex リージョンプレフィックスを公開するためのサフィックス。           |

## providerRequest リファレンス

汎用リクエストポリシーがプロバイダーランタイムを読み込まずに必要とする、低コストなリクエスト互換性メタデータには `providerRequest` を使用する。動作固有のペイロード書き換えは、プロバイダーランタイムフックまたは共有プロバイダーファミリーヘルパーに保持する。

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

| フィールド            | 型           | 意味                                                                                       |
| --------------------- | ------------ | ------------------------------------------------------------------------------------------ |
| `family`              | `string`     | 汎用リクエスト互換性の判断と診断に使用されるプロバイダーファミリーラベル。                 |
| `compatibilityFamily` | `"moonshot"` | 共有リクエストヘルパー用の任意のプロバイダーファミリー互換性バケット。                     |
| `openAICompletions`   | `object`     | OpenAI 互換 completions リクエストフラグ。現在は `supportsStreamingUsage`。                 |

## secretProviderIntegrations リファレンス

Plugin が再利用可能な SecretRef exec プロバイダープリセットを公開できる場合は、`secretProviderIntegrations` を使用する。OpenClaw は Plugin ランタイムが読み込まれる前にこのメタデータを読み取り、Plugin の所有権を `secrets.providers.<alias>.pluginIntegration` に保存し、実際のシークレット解決は SecretRef ランタイムに任せる。プリセットは、バンドル済み Plugin と、git や ClawHub インストールなどの管理対象 Plugin インストールルートから検出されたインストール済み Plugin にのみ公開される。

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

マップキーは統合 ID。`providerAlias` が省略された場合、OpenClaw は統合 ID を SecretRef プロバイダーエイリアスとして使用する。プロバイダーエイリアスは、通常の SecretRef プロバイダーエイリアスパターンに一致する必要がある。例: `team-secrets` または `onepassword-work`。

オペレーターがプリセットを選択すると、OpenClaw は次のようなプロバイダー参照を書き込む:

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

起動時またはリロード時に、OpenClaw は現在の Plugin マニフェストメタデータを読み込み、所有元 Plugin がインストール済みかつ有効であることを確認し、マニフェストから exec コマンドを具現化することで、そのプロバイダーを解決する。Plugin を無効化または削除すると、アクティブな SecretRefs に対するプロバイダーは取り消される。スタンドアロンの exec 設定が必要なオペレーターは、手動の `command`/`args` プロバイダーを直接記述できる。

現在サポートされているのは `source: "exec"` プリセットのみ。`command` は `${node}` でなければならず、`args[0]` は `./` で始まる Plugin ルート相対のリゾルバースクリプトでなければならない。OpenClaw は起動時またはリロード時に、それを現在の Node 実行ファイルと Plugin 内スクリプトの絶対パスに具現化する。`--require`、`--import`、`--loader`、`--env-file`、`--eval`、`--print` などの Node オプションは、マニフェストプリセット契約の一部ではない。Node 以外のコマンドが必要なオペレーターは、スタンドアロンの手動 exec プロバイダーを直接設定できる。

OpenClaw は、マニフェストプリセットの `trustedDirs` を Plugin ルートから導出し、`${node}` プリセットの場合は現在の Node 実行ファイルディレクトリからも導出する。マニフェストで記述された `trustedDirs` は無視される。`timeoutMs`、`maxOutputBytes`、`jsonOnly`、`env`、`passEnv`、`allowInsecurePath` などのその他の exec プロバイダーオプションは、通常の SecretRef exec プロバイダー設定へそのまま渡される。

## modelPricing リファレンス

プロバイダーがランタイム読み込み前にコントロールプレーンの価格設定動作を制御する必要がある場合は、`modelPricing` を使用する。Gateway 価格キャッシュは、プロバイダーランタイムコードをインポートせずにこのメタデータを読み取る。

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

| フィールド   | 型                | 意味                                                                                                  |
| ------------ | ----------------- | ----------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | OpenRouter または LiteLLM の価格を決して取得すべきではないローカル/セルフホストプロバイダーには `false` を設定する。 |
| `openRouter` | `false \| object` | OpenRouter 価格ルックアップマッピング。`false` はこのプロバイダーの OpenRouter ルックアップを無効にする。 |
| `liteLLM`    | `false \| object` | LiteLLM 価格ルックアップマッピング。`false` はこのプロバイダーの LiteLLM ルックアップを無効にする。     |

ソースフィールド:

| フィールド                 | 型                 | 意味                                                                                                                 |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | OpenClaw プロバイダー ID と異なる場合の外部カタログプロバイダー ID。例: `zai` プロバイダーに対する `z-ai`。         |
| `passthroughProviderModel` | `boolean`          | スラッシュを含むモデル ID をネストされたプロバイダー/モデル参照として扱う。OpenRouter などのプロキシプロバイダーに有用。 |
| `modelIdTransforms`        | `"version-dots"[]` | 追加の外部カタログモデル ID バリアント。`version-dots` は `claude-opus-4.6` のようなドット付きバージョン ID を試す。 |

### OpenClaw Provider Index

OpenClaw Provider Index は、まだ Plugin がインストールされていない可能性があるプロバイダー向けの、OpenClaw 所有のプレビューメタデータ。Plugin マニフェストの一部ではない。Plugin マニフェストは引き続き、インストール済み Plugin の権威である。Provider Index は、プロバイダー Plugin がインストールされていない場合に、将来のインストール可能プロバイダーおよび事前インストールのモデルピッカー画面が利用する内部フォールバック契約である。

カタログ権威の順序:

1. ユーザー設定。
2. インストール済み Plugin マニフェストの `modelCatalog`。
3. 明示的な更新によるモデルカタログキャッシュ。
4. OpenClaw Provider Index プレビュー行。

Provider Index には、シークレット、有効状態、ランタイムフック、ライブのアカウント固有モデルデータを含めてはならない。そのプレビューカタログは、Plugin マニフェストと同じ `modelCatalog` プロバイダー行形状を使用するが、`api`、`baseUrl`、価格設定、互換性フラグなどのランタイムアダプターフィールドをインストール済み Plugin マニフェストと意図的に同期させる場合を除き、安定した表示メタデータに限定するべきである。ライブ `/models` 検出を持つプロバイダーは、通常の一覧表示やオンボーディングでプロバイダー API を呼び出す代わりに、明示的なモデルカタログキャッシュパスを通じて更新済み行を書き込むべきである。

Provider Index エントリは、Plugin がコア外へ移動した、またはまだインストールされていないプロバイダーについて、インストール可能な Plugin メタデータも保持できる。このメタデータはチャネルカタログパターンを反映する。パッケージ名、npm インストール指定、期待される整合性、低コストな認証選択ラベルがあれば、インストール可能なセットアップオプションを表示するには十分である。Plugin がインストールされると、そのマニフェストが優先され、そのプロバイダーの Provider Index エントリは無視される。

レガシーなトップレベルの capability キーは非推奨。`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` を `contracts` 配下に移動するには `openclaw doctor --fix` を使用する。通常のマニフェスト読み込みでは、これらのトップレベルフィールドを capability 所有権として扱わなくなった。

## マニフェストと package.json の違い

この 2 つのファイルは異なる役割を持つ:

| ファイル               | 用途                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | Plugin コードの実行前に存在している必要がある、検出、設定検証、認証選択メタデータ、UI ヒント                                  |
| `package.json`         | npm メタデータ、依存関係のインストール、およびエントリポイント、インストールゲーティング、セットアップ、カタログメタデータに使われる `openclaw` ブロック |

メタデータをどこに置くべきか迷った場合は、次のルールを使う:

- OpenClaw が Plugin コードを読み込む前に知る必要があるなら、`openclaw.plugin.json` に置く
- パッケージング、エントリファイル、または npm インストール動作に関するものなら、`package.json` に置く

### 検出に影響する package.json フィールド

一部のランタイム前 Plugin メタデータは、意図的に `openclaw.plugin.json` ではなく、`package.json` の `openclaw` ブロック配下に置かれる。`openclaw.bundle` と `openclaw.bundle.json` は OpenClaw Plugin 契約ではない。ネイティブ Plugin は、`openclaw.plugin.json` と、以下でサポートされる `package.json#openclaw` フィールドを使用しなければならない。

重要な例:

| フィールド                                                                                 | 意味                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | ネイティブ Plugin エントリポイントを宣言します。Plugin パッケージディレクトリ内に留まる必要があります。                                                                                               |
| `openclaw.runtimeExtensions`                                                               | インストール済みパッケージ向けにビルド済み JavaScript ランタイムエントリポイントを宣言します。Plugin パッケージディレクトリ内に留まる必要があります。                                                |
| `openclaw.setupEntry`                                                                      | オンボーディング、遅延チャネル起動、読み取り専用チャネルステータス/SecretRef 検出で使われる軽量なセットアップ専用エントリポイントです。Plugin パッケージディレクトリ内に留まる必要があります。        |
| `openclaw.runtimeSetupEntry`                                                               | インストール済みパッケージ向けにビルド済み JavaScript セットアップエントリポイントを宣言します。`setupEntry` が必要で、存在している必要があり、Plugin パッケージディレクトリ内に留まる必要があります。 |
| `openclaw.channel`                                                                         | ラベル、ドキュメントパス、エイリアス、選択時コピーなどの低コストなチャネルカタログメタデータです。                                                                                                     |
| `openclaw.channel.commands`                                                                | チャネルランタイムが読み込まれる前に、設定、監査、コマンド一覧サーフェスで使われる静的なネイティブコマンドとネイティブ Skills 自動デフォルトメタデータです。                                          |
| `openclaw.channel.configuredState`                                                         | 完全なチャネルランタイムを読み込まずに「env のみのセットアップはすでに存在するか？」に答えられる、軽量な設定済み状態チェッカーメタデータです。                                                        |
| `openclaw.channel.persistedAuthState`                                                      | 完全なチャネルランタイムを読み込まずに「すでにサインイン済みのものはあるか？」に答えられる、軽量な永続化認証チェッカーメタデータです。                                                                |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | バンドル済みおよび外部公開 Plugin 向けのインストール/更新ヒントです。                                                                                                                                  |
| `openclaw.install.defaultChoice`                                                           | 複数のインストール元が利用できる場合の優先インストールパスです。                                                                                                                                       |
| `openclaw.install.minHostVersion`                                                          | `>=2026.3.22` や `>=2026.5.1-beta.1` のような semver 下限を使う、サポートされる最小 OpenClaw ホストバージョンです。                                                                                    |
| `openclaw.compat.pluginApi`                                                                | このパッケージに必要な最小 OpenClaw Plugin API 範囲で、`>=2026.5.27` のような semver 下限を使います。                                                                                                  |
| `openclaw.install.expectedIntegrity`                                                       | `sha512-...` などの期待される npm dist integrity 文字列です。インストールおよび更新フローは、取得したアーティファクトをこれと照合します。                                                              |
| `openclaw.install.allowInvalidConfigRecovery`                                              | 設定が無効な場合に、限定的なバンドル済み Plugin 再インストール復旧パスを許可します。                                                                                                                   |
| `openclaw.install.requiredPlatformPackages`                                                | lockfile のプラットフォーム制約が現在のホストに一致するときに実体化される必要がある npm パッケージエイリアスです。                                                                                    |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | セットアップランタイムのチャネルサーフェスを listen 前に読み込み、その後、完全な設定済みチャネル Plugin を listen 後の有効化まで遅延します。                                                          |

マニフェストメタデータは、ランタイムが読み込まれる前にオンボーディングに表示される provider/チャネル/セットアップの選択肢を決定します。`package.json#openclaw.install` は、ユーザーがそれらの選択肢のいずれかを選んだときに、その Plugin を取得または有効化する方法をオンボーディングに伝えます。インストールヒントを `openclaw.plugin.json` に移動しないでください。

`openclaw.install.minHostVersion` は、非バンドル Plugin ソースのインストール時とマニフェストレジストリ読み込み時に強制されます。無効な値は拒否されます。より新しいが有効な値は、古いホスト上の外部 Plugin をスキップします。バンドル済みソース Plugin は、ホストチェックアウトと同じバージョンで管理されているものと見なされます。

`openclaw.install.requiredPlatformPackages` は、必須のネイティブバイナリを任意のプラットフォーム固有エイリアス経由で公開する npm パッケージ向けです。サポートされるすべてのプラットフォームエイリアスについて、素の npm パッケージ名を列挙してください。npm インストール中、OpenClaw は、lockfile 制約が現在のホストに一致する宣言済みエイリアスのみを検証します。npm が成功を報告してもそのエイリアスを省略した場合、OpenClaw は新しいキャッシュで一度だけ再試行し、それでもエイリアスが存在しない場合はインストールをロールバックします。

`openclaw.compat.pluginApi` は、非バンドル Plugin ソースのパッケージインストール時に強制されます。パッケージがビルドされた対象の OpenClaw Plugin SDK/ランタイム API 下限として使ってください。Plugin パッケージがより新しい API を必要としつつ、他のフロー向けには低いインストールヒントを維持する場合、これは `minHostVersion` より厳しくできます。公式 OpenClaw リリース同期は、既存の公式 Plugin API 下限をデフォルトで OpenClaw リリースバージョンまで引き上げますが、Plugin のみのリリースでは、パッケージが意図的に古いホストをサポートする場合に低い下限を維持できます。互換性契約としてパッケージバージョンだけを使わないでください。`peerDependencies.openclaw` は npm パッケージメタデータのままです。OpenClaw はインストール互換性の判断に `openclaw.compat.pluginApi` 契約を使います。

公式のオンデマンドインストールメタデータは、Plugin が ClawHub で公開されている場合は `clawhubSpec` を使うべきです。オンボーディングはそれを優先リモートソースとして扱い、インストール後に ClawHub アーティファクト情報を記録します。`npmSpec` は、まだ ClawHub に移行していないパッケージ向けの互換性フォールバックのままです。

正確な npm バージョン固定は、たとえば `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"` のように、すでに `npmSpec` にあります。公式外部カタログエントリでは、更新フローが取得した npm アーティファクトが固定リリースと一致しなくなった場合にフェイルクローズするよう、正確な spec と `expectedIntegrity` を組み合わせるべきです。対話型オンボーディングは互換性のため、素のパッケージ名や dist-tag を含む、信頼済みレジストリの npm spec を引き続き提示します。カタログ診断は、正確、浮動、integrity 固定、integrity 欠落、パッケージ名不一致、無効なデフォルト選択ソースを区別できます。また、`expectedIntegrity` が存在するものの、それを固定できる有効な npm ソースがない場合にも警告します。`expectedIntegrity` が存在する場合、インストール/更新フローはそれを強制します。省略されている場合、レジストリ解決は integrity 固定なしで記録されます。

チャネル Plugin は、ステータス、チャネル一覧、または SecretRef スキャンが完全なランタイムを読み込まずに設定済みアカウントを識別する必要がある場合、`openclaw.setupEntry` を提供すべきです。セットアップエントリは、チャネルメタデータに加え、セットアップ安全な設定、ステータス、シークレットアダプターを公開するべきです。ネットワーククライアント、Gateway リスナー、トランスポートランタイムはメイン拡張エントリポイントに置いてください。

ランタイムエントリポイントフィールドは、ソースエントリポイントフィールドに対するパッケージ境界チェックを上書きしません。たとえば、`openclaw.runtimeExtensions` によって、外へ抜ける `openclaw.extensions` パスを読み込み可能にすることはできません。

`openclaw.install.allowInvalidConfigRecovery` は意図的に限定されています。任意の壊れた設定をインストール可能にするものではありません。現在は、バンドル済み Plugin パスの欠落や、同じバンドル済み Plugin に対する古い `channels.<id>` エントリなど、特定の古いバンドル済み Plugin アップグレード失敗からインストールフローが復旧することだけを許可します。無関係な設定エラーは引き続きインストールをブロックし、オペレーターに `openclaw doctor --fix` を案内します。

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

セットアップ、doctor、ステータス、または読み取り専用 presence フローが、完全なチャネル Plugin を読み込む前に低コストな yes/no 認証プローブを必要とする場合に使います。永続化認証状態は、設定済みチャネル状態ではありません。このメタデータを使って Plugin を自動有効化したり、ランタイム依存関係を修復したり、チャネルランタイムを読み込むべきかどうかを判断したりしないでください。対象 export は、永続化状態だけを読む小さな関数であるべきです。完全なチャネルランタイム barrel 経由にしないでください。

`openclaw.channel.configuredState` は、低コストな env のみの設定済みチェック向けに同じ形に従います。

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

チャネルが env やその他の小さな非ランタイム入力から設定済み状態に答えられる場合に使います。チェックに完全な設定解決や実際のチャネルランタイムが必要な場合は、そのロジックを Plugin の `config.hasConfiguredState` hook に残してください。

## 検出の優先順位（重複する Plugin ID）

OpenClaw は複数のルートから Plugin を検出します。生のファイルシステムスキャン順序については、[Plugin スキャン順序](/ja-JP/gateway/configuration-reference#plugin-scan-order)を参照してください。2 つの検出結果が同じ `id` を共有する場合、**最高優先順位**のマニフェストだけが保持されます。優先順位の低い重複は、並べて読み込まれるのではなく破棄されます。

優先順位は高い順に次のとおりです。

1. **設定で選択済み** — `plugins.entries.<id>` で明示的に固定されたパス
2. **バンドル済み** — OpenClaw に同梱される Plugin
3. **グローバルインストール** — グローバル OpenClaw Plugin ルートにインストールされた Plugin
4. **ワークスペース** — 現在のワークスペースを基準に検出された Plugin

影響:

- ワークスペースに置かれた、バンドル済み Plugin の fork や古いコピーは、バンドル済みビルドをシャドーイングしません。
- ローカルのものによってバンドル済み Plugin を実際に上書きするには、ワークスペース検出に頼るのではなく、`plugins.entries.<id>` 経由で固定し、優先順位で勝つようにしてください。
- 重複の破棄はログに記録されるため、Doctor と起動診断は破棄されたコピーを示せます。
- 設定で選択された重複上書きは、診断では明示的な上書きとして表現されますが、古い fork や意図しないシャドーイングが見えるように、引き続き警告されます。

## JSON Schema 要件

- **すべての Plugin は JSON Schema を同梱する必要があります**。設定を受け付けない場合でも同様です。
- 空のスキーマも許容されます（例: `{ "type": "object", "additionalProperties": false }`）。
- スキーマは実行時ではなく、設定の読み書き時に検証されます。
- 新しい設定キーで同梱 Plugin を拡張またはフォークする場合は、その Plugin の `openclaw.plugin.json` の `configSchema` も同時に更新してください。同梱 Plugin のスキーマは厳密なため、`configSchema.properties` に `myNewKey` を追加せずにユーザー設定へ `plugins.entries.<id>.config.myNewKey` を追加すると、Plugin ランタイムが読み込まれる前に拒否されます。

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

- 不明な `channels.*` キーは、チャネル ID が Plugin マニフェストで宣言されていない限り **エラー** です。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny`、`plugins.slots.*` は、**検出可能な** Plugin ID を参照する必要があります。不明な ID は **エラー** です。
- Plugin がインストールされていても、マニフェストまたはスキーマが壊れているか存在しない場合、検証は失敗し、Doctor が Plugin エラーを報告します。
- Plugin 設定が存在していても Plugin が **無効** の場合、設定は保持され、Doctor とログに **警告** が表示されます。

完全な `plugins.*` スキーマについては、[設定リファレンス](/ja-JP/gateway/configuration) を参照してください。

## 注記

- マニフェストは、ローカルファイルシステムからの読み込みを含む **ネイティブ OpenClaw Plugin では必須** です。ランタイムは引き続き Plugin モジュールを別途読み込みます。マニフェストは検出と検証のためだけに使用されます。
- ネイティブマニフェストは JSON5 で解析されるため、最終的な値がオブジェクトである限り、コメント、末尾のカンマ、引用符なしのキーを使用できます。
- マニフェストローダーが読み取るのは、ドキュメント化されたマニフェストフィールドのみです。独自のトップレベルキーは避けてください。
- Plugin が不要とする場合、`channels`、`providers`、`cliBackends`、`skills` はすべて省略できます。
- `providerCatalogEntry` は軽量に保つ必要があり、広範なランタイムコードをインポートすべきではありません。リクエスト時の実行ではなく、静的なプロバイダーカタログメタデータや限定的な検出記述子に使用してください。
- 排他的な Plugin 種別は `plugins.slots.*` で選択されます。`kind: "memory"` は `plugins.slots.memory`、`kind: "context-engine"` は `plugins.slots.contextEngine`（デフォルトは `legacy`）を使用します。
- このマニフェストで排他的な Plugin 種別を宣言してください。ランタイムエントリの `OpenClawPluginDefinition.kind` は非推奨であり、古い Plugin 向けの互換フォールバックとしてのみ残されています。
- 環境変数メタデータ（`setup.providers[].envVars`、非推奨の `providerAuthEnvVars`、および `channelEnvVars`）は宣言専用です。ステータス、監査、Cron 配信検証、その他の読み取り専用サーフェスでは、環境変数を設定済みとして扱う前に、引き続き Plugin の信頼性と有効なアクティベーションポリシーが適用されます。
- プロバイダーコードを必要とするランタイムウィザードメタデータについては、[プロバイダーランタイムフック](/ja-JP/plugins/architecture-internals#provider-runtime-hooks) を参照してください。
- Plugin がネイティブモジュールに依存する場合は、ビルド手順と、必要なパッケージマネージャーの許可リスト要件（例: pnpm `allow-build-scripts` + `pnpm rebuild <package>`）をドキュメント化してください。

## 関連

<CardGroup cols={3}>
  <Card title="Building plugins" href="/ja-JP/plugins/building-plugins" icon="rocket">
    Plugin のはじめに。
  </Card>
  <Card title="Plugin architecture" href="/ja-JP/plugins/architecture" icon="diagram-project">
    内部アーキテクチャと機能モデル。
  </Card>
  <Card title="SDK overview" href="/ja-JP/plugins/sdk-overview" icon="book">
    Plugin SDK リファレンスとサブパスインポート。
  </Card>
</CardGroup>

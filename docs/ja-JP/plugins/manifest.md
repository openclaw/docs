---
read_when:
    - OpenClaw Plugin を構築しています
    - Plugin 設定スキーマを出荷するか、Plugin 検証エラーをデバッグする必要がある
summary: Plugin マニフェスト + JSON スキーマ要件（厳密な config 検証）
title: Plugin マニフェスト
x-i18n:
    generated_at: "2026-07-05T11:37:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 400c67c01c551b23bd12c236b9f0d93f12316c284ff1e5f7b103bdb5abf882f2
    source_path: plugins/manifest.md
    workflow: 16
---

このページでは、**ネイティブ OpenClaw Plugin マニフェスト**である `openclaw.plugin.json` について説明します。互換バンドルレイアウト (Codex、Claude、Cursor) については、[Plugin バンドル](/ja-JP/plugins/bundles)を参照してください。

互換バンドル形式では、代わりにそれぞれ独自のマニフェストファイルを使用します。

- Codex バンドル: `.codex-plugin/plugin.json`
- Claude バンドル: `.claude-plugin/plugin.json`、またはマニフェストなしのデフォルト Claude コンポーネントレイアウト
- Cursor バンドル: `.cursor-plugin/plugin.json`

OpenClaw はこれらのレイアウトを自動検出しますが、以下の `openclaw.plugin.json` スキーマに対して検証はしません。互換バンドルの場合、レイアウトが OpenClaw のランタイム要件に一致しているとき、OpenClaw はバンドルメタデータ、宣言された Skills ルート、Claude コマンドルート、Claude `settings.json` のデフォルト、Claude LSP のデフォルト、対応するフックパックを読み取ります。

すべてのネイティブ OpenClaw Plugin は、**Plugin ルート**に `openclaw.plugin.json` を同梱する必要があります。OpenClaw はこれを読み取り、**Plugin コードを実行せずに**構成を検証します。マニフェストがない、または無効な場合、構成検証はブロックされ、Plugin エラーとして扱われます。

Plugin システム全体のガイドは [Plugins](/ja-JP/tools/plugin) を、ネイティブ能力モデルと現在の外部互換性ガイダンスは [能力モデル](/ja-JP/plugins/architecture#public-capability-model) を参照してください。

## このファイルの役割

`openclaw.plugin.json` は、OpenClaw が**Plugin コードを読み込む前に**読み取るメタデータです。ここに含めるすべての内容は、Plugin ランタイムを起動せずに検査できる程度に軽量である必要があります。

**用途:**

- Plugin ID、構成検証、構成 UI ヒント
- 認証、オンボーディング、セットアップメタデータ (エイリアス、自動有効化、プロバイダー環境変数、認証選択肢)
- コントロールプレーン表面向けの有効化ヒント
- モデルファミリー所有権の省略表記
- 静的な能力所有権スナップショット (`contracts`)
- 共有 `openclaw qa` ホストが検査できる QA ランナーメタデータ
- カタログと検証表面にマージされる、チャネル固有の構成メタデータ

**用途ではないもの:** ランタイム動作の登録、コードエントリポイントの宣言、npm インストールメタデータ。これらは Plugin コードと `package.json` に属します。

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

| フィールド                           | 必須     | 型                           | 意味                                                                                                                                                                                                                                                     |
| ------------------------------------ | -------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | はい     | `string`                     | 正規のPlugin id。これは `plugins.entries.<id>` で使われる id。                                                                                                                                                                                           |
| `configSchema`                       | はい     | `object`                     | このPluginの設定用インライン JSON Schema。                                                                                                                                                                                                               |
| `requiresPlugins`                    | いいえ   | `string[]`                   | このPluginが効果を持つために、あわせてインストールされている必要があるPlugin id。検出ではPluginをロード可能なままにするが、必須Pluginが欠けている場合は警告する。                                                                                      |
| `enabledByDefault`                   | いいえ   | `true`                       | バンドルPluginをデフォルトで有効にする。省略するか、`true` 以外の値を設定すると、そのPluginはデフォルトで無効のままになる。                                                                                                                             |
| `enabledByDefaultOnPlatforms`        | いいえ   | `string[]`                   | バンドルPluginを、列挙された Node.js プラットフォーム上でのみデフォルト有効にする。例: `["darwin"]`。明示的な設定が引き続き優先される。                                                                                                                 |
| `legacyPluginIds`                    | いいえ   | `string[]`                   | この正規Plugin idへ正規化されるレガシー id。                                                                                                                                                                                                             |
| `autoEnableWhenConfiguredProviders`  | いいえ   | `string[]`                   | 認証、設定、またはモデル参照で言及されたときに、このPluginを自動有効化するプロバイダー id。                                                                                                                                                             |
| `kind`                               | いいえ   | `PluginKind \| PluginKind[]` | `plugins.slots.*` で使われる、1つ以上の排他的なPlugin種別（`"memory"`、`"context-engine"`）を宣言する。両方のスロットを所有するPluginは、1つの配列で両方の種別を宣言する。                                                                              |
| `channels`                           | いいえ   | `string[]`                   | このPluginが所有するチャンネル id。検出と設定検証に使われる。                                                                                                                                                                                           |
| `providers`                          | いいえ   | `string[]`                   | このPluginが所有するプロバイダー id。                                                                                                                                                                                                                    |
| `providerCatalogEntry`               | いいえ   | `string`                     | Pluginルートからの相対パスで指定する軽量なプロバイダーカタログモジュールパス。完全なPluginランタイムを有効化せずに読み込める、マニフェストスコープのプロバイダーカタログメタデータ用。                                                                  |
| `modelSupport`                       | いいえ   | `object`                     | ランタイム前にPluginを自動ロードするために使われる、マニフェスト所有のモデルファミリーメタデータの省略記法。                                                                                                                                             |
| `modelCatalog`                       | いいえ   | `object`                     | このPluginが所有するプロバイダー向けの宣言的なモデルカタログメタデータ。これは、Pluginランタイムを読み込まずに将来の読み取り専用一覧、オンボーディング、モデル選択、エイリアス、抑制を行うための制御プレーン契約。                                  |
| `modelPricing`                       | いいえ   | `object`                     | プロバイダー所有の外部価格検索ポリシー。ローカル/セルフホスト型プロバイダーをリモート価格カタログから除外したり、コアでプロバイダー idをハードコードせずにプロバイダー参照を OpenRouter/LiteLLM カタログ idへ対応付けたりするために使う。             |
| `modelIdNormalization`               | いいえ   | `object`                     | プロバイダーランタイムが読み込まれる前に実行する必要がある、プロバイダー所有のモデル id エイリアス/プレフィックス整理。                                                                                                                                 |
| `providerEndpoints`                  | いいえ   | `object[]`                   | プロバイダーランタイムが読み込まれる前にコアが分類する必要がある、プロバイダールート向けのマニフェスト所有エンドポイント host/baseUrl メタデータ。                                                                                                      |
| `providerRequest`                    | いいえ   | `object`                     | プロバイダーランタイムが読み込まれる前に汎用リクエストポリシーで使われる、低コストなプロバイダーファミリーおよびリクエスト互換性メタデータ。                                                                                                           |
| `secretProviderIntegrations`         | いいえ   | `Record<string, object>`     | セットアップまたはインストールサーフェスが、コアにプロバイダー固有の統合をハードコードせずに提示できる、宣言的な SecretRef exec プロバイダープリセット。                                                                                                |
| `cliBackends`                        | いいえ   | `string[]`                   | このPluginが所有する CLI 推論バックエンド id。明示的な設定参照から起動時に自動有効化するために使われる。                                                                                                                                                 |
| `syntheticAuthRefs`                  | いいえ   | `string[]`                   | ランタイムが読み込まれる前のコールドモデル検出中に、Plugin所有の合成認証フックをプローブする必要があるプロバイダーまたは CLI バックエンド参照。                                                                                                         |
| `nonSecretAuthMarkers`               | いいえ   | `string[]`                   | 非シークレットのローカル、OAuth、または環境認証情報状態を表す、バンドルPlugin所有のプレースホルダー API キー値。                                                                                                                                        |
| `commandAliases`                     | いいえ   | `object[]`                   | ランタイムが読み込まれる前に、Pluginを認識した設定および CLI 診断を生成する必要がある、このPlugin所有のコマンド名。                                                                                                                                      |
| `providerAuthEnvVars`                | いいえ   | `Record<string, string[]>`   | プロバイダー認証/状態検索向けの非推奨の互換性 env メタデータ。新しいPluginでは `setup.providers[].envVars` を優先する。OpenClaw は非推奨期間中もこれを読み取る。                                                                                       |
| `providerAuthAliases`                | いいえ   | `Record<string, string>`     | 認証検索で別のプロバイダー idを再利用する必要があるプロバイダー id。例: ベースプロバイダーの API キーと認証プロファイルを共有するコーディングプロバイダー。                                                                                            |
| `channelEnvVars`                     | いいえ   | `Record<string, string[]>`   | OpenClaw がPluginコードを読み込まずに検査できる、低コストなチャンネル env メタデータ。汎用の起動/設定ヘルパーが認識すべき、env 駆動のチャンネルセットアップまたは認証サーフェスに使う。                                                                 |
| `providerAuthChoices`                | いいえ   | `object[]`                   | オンボーディングの選択UI、優先プロバイダー解決、単純な CLI フラグ配線向けの低コストな認証選択メタデータ。                                                                                                                                               |
| `activation`                         | いいえ   | `object`                     | 起動、プロバイダー、コマンド、チャンネル、ルート、Capability トリガーによる読み込み向けの低コストな有効化プランナーメタデータ。メタデータのみであり、実際の動作は引き続きPluginランタイムが所有する。                                                   |
| `setup`                              | いいえ   | `object`                     | Discovery とセットアップサーフェスがPluginランタイムを読み込まずに検査できる、低コストなセットアップ/オンボーディング記述子。                                                                                                                           |
| `qaRunners`                          | いいえ   | `object[]`                   | Pluginランタイムが読み込まれる前に、共有 `openclaw qa` ホストで使われる低コストな QA ランナー記述子。                                                                                                                                                   |
| `contracts`                          | いいえ   | `object`                     | 外部認証フック、埋め込み、音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像/動画/音楽生成、Web fetch、Web検索、ドキュメント/Webコンテンツ抽出、ツール所有権に関する静的Capability所有権スナップショット。                            |
| `configContracts`                    | いいえ   | `object`                     | 汎用コアヘルパーが利用する、マニフェスト所有の設定動作: 危険フラグ検出、SecretRef 移行先、レガシー設定パスの絞り込み。[configContracts リファレンス](#configcontracts-reference)を参照。                                                               |
| `mediaUnderstandingProviderMetadata` | いいえ   | `Record<string, object>`     | `contracts.mediaUnderstandingProviders` で宣言されたプロバイダー id向けの、低コストなメディア理解デフォルト。                                                                                                                                           |
| `imageGenerationProviderMetadata`    | いいえ   | `Record<string, object>`     | `contracts.imageGenerationProviders` で宣言されたプロバイダー id向けの、低コストな画像生成認証メタデータ。プロバイダー所有の認証エイリアスと base-url ガードを含む。                                                                                   |
| `videoGenerationProviderMetadata`    | いいえ       | `Record<string, object>`     | `contracts.videoGenerationProviders` で宣言されたプロバイダー ID 向けの軽量な動画生成認証メタデータ。プロバイダー所有の認証エイリアスと base-url ガードを含みます。                                                                                       |
| `musicGenerationProviderMetadata`    | いいえ       | `Record<string, object>`     | `contracts.musicGenerationProviders` で宣言されたプロバイダー ID 向けの軽量な音楽生成認証メタデータ。プロバイダー所有の認証エイリアスと base-url ガードを含みます。                                                                                       |
| `toolMetadata`                       | いいえ       | `Record<string, object>`     | `contracts.tools` で宣言されたプラグイン所有ツール向けの軽量な可用性メタデータ。config、env、または auth の証拠が存在しない限りツールがランタイムを読み込むべきではない場合に使用します。                                                                                |
| `channelConfigs`                     | いいえ       | `Record<string, object>`     | ランタイムが読み込まれる前に、探索および検証サーフェスへマージされる、マニフェスト所有のチャネル設定メタデータ。                                                                                                                                               |
| `skills`                             | いいえ       | `string[]`                   | 読み込むスキルディレクトリ。プラグインルートからの相対パスです。                                                                                                                                                                                                  |
| `name`                               | いいえ       | `string`                     | 人間が読めるプラグイン名。                                                                                                                                                                                                                              |
| `description`                        | いいえ       | `string`                     | プラグインサーフェスに表示される短い概要。                                                                                                                                                                                                                  |
| `icon`                               | いいえ       | `string`                     | マーケットプレイス/カタログカード用の HTTPS 画像 URL。ClawHub は有効な任意の `https://` URL を受け入れ、これが省略されているか無効な場合はデフォルトのプラグインアイコンにフォールバックします。                                                                                       |
| `version`                            | いいえ       | `string`                     | 情報提供用のプラグインバージョン。                                                                                                                                                                                                                            |
| `uiHints`                            | いいえ       | `Record<string, object>`     | 設定フィールドの UI ラベル、プレースホルダー、機密性ヒント。                                                                                                                                                                                        |

## 生成プロバイダーメタデータリファレンス

生成プロバイダーメタデータフィールドは、一致する `contracts.*GenerationProviders` リストで宣言されたプロバイダーの静的な認証シグナルを記述します。OpenClaw はプロバイダーランタイムを読み込む前にこれらのフィールドを読み取るため、コアツールはすべてのプロバイダー Plugin をインポートせずに、生成プロバイダーが利用可能かどうかを判断できます。

これらのフィールドは、低コストで宣言的な事実にのみ使用してください。トランスポート、リクエスト変換、トークン更新、資格情報検証、実際の生成動作は Plugin ランタイムに残します。

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

各メタデータエントリは次をサポートします。

| フィールド | 必須 | 型 | 意味 |
| ---------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases` | いいえ | `string[]` | 生成プロバイダーの静的な認証エイリアスとして数える追加のプロバイダー ID。 |
| `authProviders` | いいえ | `string[]` | 設定済みの認証プロファイルをこの生成プロバイダーの認証として数えるプロバイダー ID。 |
| `configSignals` | いいえ | `object[]` | 認証プロファイルや環境変数なしで設定できる、ローカルまたはセルフホスト型プロバイダー向けの低コストな設定のみの可用性シグナル。 |
| `authSignals` | いいえ | `object[]` | 明示的な認証シグナル。存在する場合、プロバイダー ID、`aliases`、`authProviders` からのデフォルトシグナルセットを置き換えます。 |
| `referenceAudioInputs` | いいえ | `boolean` | 動画生成のみ。プロバイダーが参照音声アセットを受け付ける場合は `true` に設定します。それ以外の場合、`video_generate` は音声参照パラメーターを非表示にします。 |

各 `configSignals` エントリは次をサポートします。

| フィールド | 必須 | 型 | 意味 |
| ---------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath` | はい | `string` | 検査する Plugin 所有の設定オブジェクトへのドットパス。例: `plugins.entries.example.config`。 |
| `overlayPath` | いいえ | `string` | シグナルを評価する前にルートオブジェクトに重ねるべき、ルート設定内のオブジェクトへのドットパス。`image`、`video`、`music` など、機能固有の設定に使用します。 |
| `overlayMapPath` | いいえ | `string` | ルート設定内で、各オブジェクト値をそれぞれルートオブジェクトに重ねるべきドットパス。`accounts` のような名前付きアカウントマップに使用し、設定済みアカウントがあれば条件を満たします。 |
| `required` | いいえ | `string[]` | 値が設定されている必要がある、有効な設定内のドットパス。文字列は空であってはならず、オブジェクトと配列も空であってはなりません。 |
| `requiredAny` | いいえ | `string[]` | 少なくとも 1 つに設定値が必要な、有効な設定内のドットパス。 |
| `mode` | いいえ | `object` | 有効な設定内の任意の文字列モードガード。設定のみの可用性が 1 つのモードにのみ適用される場合に使用します。 |

各 `mode` ガードは次をサポートします。

| フィールド | 必須 | 型 | 意味 |
| ------------ | -------- | ---------- | ---------------------------------------------------------------------------------- |
| `path` | いいえ | `string` | 有効な設定内のドットパス。デフォルトは `mode` です。 |
| `default` | いいえ | `string` | 設定がパスを省略している場合に使用するモード値。 |
| `allowed` | いいえ | `string[]` | 存在する場合、有効なモードがこれらの値のいずれかであるときのみシグナルは通過します。 |
| `disallowed` | いいえ | `string[]` | 存在する場合、有効なモードがこれらの値のいずれかであるときシグナルは失敗します。 |

各 `authSignals` エントリは次をサポートします。

| フィールド | 必須 | 型 | 意味 |
| ----------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | はい | `string` | 設定済みの認証プロファイルで確認するプロバイダー ID。 |
| `providerBaseUrl` | いいえ | `object` | 参照先の設定済みプロバイダーが許可されたベース URL を使用している場合にのみシグナルを数える任意のガード。認証エイリアスが特定の API に対してのみ有効な場合に使用します。 |

各 `providerBaseUrl` ガードは次をサポートします。

| フィールド | 必須 | 型 | 意味 |
| ----------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | はい | `string` | `baseUrl` を確認するプロバイダー設定 ID。 |
| `defaultBaseUrl` | いいえ | `string` | プロバイダー設定が `baseUrl` を省略している場合に仮定するベース URL。 |
| `allowedBaseUrls` | はい | `string[]` | この認証シグナルで許可されるベース URL。設定済みまたはデフォルトのベース URL が、これらの正規化済み値のいずれにも一致しない場合、シグナルは無視されます。 |

## ツールメタデータリファレンス

`toolMetadata` は、ツール名をキーとして、生成プロバイダーメタデータと同じ `configSignals` および `authSignals` の形状を使用します。`contracts.tools` は所有権を宣言します。`toolMetadata` は低コストな可用性証拠を宣言するため、OpenClaw はツールファクトリに `null` を返させるためだけに Plugin ランタイムをインポートすることを避けられます。

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

`toolMetadata` エントリは、上記の共有 `configSignals`/`authSignals` フィールドに加えて、`optional`（Plugin の有効化に必須ではないツールとしてマーク）と `replaySafe`（不完全なモデルターンの後でツール実行を繰り返しても安全としてマーク）も受け付けます。

ツールに `toolMetadata` がない場合、OpenClaw は既存の動作を保持し、ツール契約がポリシーに一致したときに所有 Plugin を読み込みます。ファクトリが認証や設定に依存するホットパスのツールでは、Plugin 作者はコアにランタイムをインポートして問い合わせさせるのではなく、`toolMetadata` を宣言するべきです。

## providerAuthChoices リファレンス

各 `providerAuthChoices` エントリは、1 つのオンボーディングまたは認証の選択肢を記述します。OpenClaw はプロバイダーランタイムを読み込む前にこれを読み取ります。プロバイダー設定リストは、プロバイダーランタイムを読み込まずに、これらのマニフェスト選択肢、ディスクリプターから派生した設定選択肢、インストールカタログメタデータを使用します。

| フィールド          | 必須     | 型                                                                    | 意味                                                                                                                         |
| --------------------- | -------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | はい     | `string`                                                              | この選択肢が属する Provider id。                                                                                          |
| `method`              | はい     | `string`                                                              | ディスパッチ先の認証メソッド id。                                                                                         |
| `choiceId`            | はい     | `string`                                                              | オンボーディングと CLI フローで使われる安定した認証選択肢 id。                                                            |
| `choiceLabel`         | いいえ   | `string`                                                              | ユーザー向けラベル。省略した場合、OpenClaw は `choiceId` にフォールバックする。                                             |
| `choiceHint`          | いいえ   | `string`                                                              | ピッカー用の短い補助テキスト。                                                                                            |
| `assistantPriority`   | いいえ   | `number`                                                              | 値が小さいほど、アシスタント主導の対話型ピッカーで先に並ぶ。                                                              |
| `assistantVisibility` | いいえ   | `"visible"` \| `"manual-only"`                                        | 手動 CLI 選択は許可したまま、アシスタントピッカーから選択肢を隠す。                                                        |
| `deprecatedChoiceIds` | いいえ   | `string[]`                                                            | ユーザーをこの置換選択肢へリダイレクトすべきレガシー選択肢 id。                                                           |
| `groupId`             | いいえ   | `string`                                                              | 関連する選択肢をグループ化するための任意のグループ id。                                                                    |
| `groupLabel`          | いいえ   | `string`                                                              | そのグループのユーザー向けラベル。                                                                                        |
| `groupHint`           | いいえ   | `string`                                                              | グループ用の短い補助テキスト。                                                                                            |
| `onboardingFeatured`  | いいえ   | `boolean`                                                             | 対話型オンボーディングピッカーの注目ティアで、「その他...」エントリより前にこのグループを表示する。                       |
| `optionKey`           | いいえ   | `string`                                                              | 単純な単一フラグ認証フロー用の内部オプションキー。                                                                        |
| `cliFlag`             | いいえ   | `string`                                                              | `--openrouter-api-key` などの CLI フラグ名。                                                                               |
| `cliOption`           | いいえ   | `string`                                                              | `--openrouter-api-key <key>` などの完全な CLI オプション形式。                                                            |
| `cliDescription`      | いいえ   | `string`                                                              | CLI ヘルプで使われる説明。                                                                                                |
| `onboardingScopes`    | いいえ   | `Array<"text-inference" \| "image-generation" \| "music-generation">` | この選択肢が表示されるべきオンボーディングサーフェス。省略した場合、デフォルトは `["text-inference"]`。                   |

## commandAliases リファレンス

Plugin がランタイムコマンド名を所有しており、ユーザーが誤ってそれを `plugins.allow` に入れたり、ルート CLI コマンドとして実行しようとしたりする可能性がある場合は、`commandAliases` を使う。OpenClaw は Plugin ランタイムコードをインポートせずに、このメタデータを診断に使う。

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

| フィールド | 必須   | 型                | 意味                                                                         |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | はい   | `string`          | この Plugin に属するコマンド名。                                             |
| `kind`       | いいえ | `"runtime-slash"` | エイリアスをルート CLI コマンドではなくチャットスラッシュコマンドとしてマークする。 |
| `cliCommand` | いいえ | `string`          | CLI 操作用に提案する関連ルート CLI コマンド。存在する場合のみ。                 |

## activation リファレンス

Plugin が、どのコントロールプレーンイベントでアクティベーション/読み込み計画に含められるべきかを低コストで宣言できる場合は、`activation` を使う。

このブロックはプランナーメタデータであり、ライフサイクル API ではない。ランタイム動作を登録せず、`register(...)` を置き換えず、Plugin コードがすでに実行済みであることも約束しない。アクティベーションプランナーは、`providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools`、フックなどの既存のマニフェスト所有権メタデータにフォールバックする前に、これらのフィールドを使って候補 Plugin を絞り込む。

所有権をすでに表す最も狭いメタデータを優先する。関係性を表せる場合は、`providers`、`channels`、`commandAliases`、セットアップ記述子、または `contracts` を使う。それらの所有権フィールドでは表現できない追加のプランナーヒントには `activation` を使う。`claude-cli`、`my-cli`、`google-gemini-cli` などの CLI ランタイムエイリアスにはトップレベルの `cliBackends` を使う。`activation.onAgentHarnesses` は、所有権フィールドがまだない埋め込みエージェントハーネス id 専用。

すべての Plugin は `activation.onStartup` を意図的に設定すべきである。Plugin が Gateway 起動中に実行される必要がある場合のみ `true` に設定する。Plugin が起動時に不活性で、より狭いトリガーからのみ読み込まれるべき場合は `false` に設定する。`onStartup` を省略しても、Plugin が暗黙的に起動時読み込みされることはなくなった。起動、チャンネル、設定、エージェントハーネス、メモリ、またはその他のより狭いアクティベーショントリガーには、明示的なアクティベーションメタデータを使う。

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

| フィールド       | 必須   | 型                                                   | 意味                                                                                                                                                                                        |
| ------------------ | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | いいえ | `boolean`                                            | 明示的な Gateway 起動時アクティベーション。すべての Plugin がこれを設定すべきである。`true` は起動中に Plugin をインポートする。`false` は、別の一致するトリガーが読み込みを必要としない限り、起動時遅延のままにする。 |
| `onProviders`      | いいえ | `string[]`                                           | アクティベーション/読み込み計画にこの Plugin を含めるべき Provider id。                                                                                                                     |
| `onAgentHarnesses` | いいえ | `string[]`                                           | アクティベーション/読み込み計画にこの Plugin を含めるべき埋め込みエージェントハーネスランタイム id。CLI バックエンドエイリアスにはトップレベルの `cliBackends` を使う。                    |
| `onCommands`       | いいえ | `string[]`                                           | アクティベーション/読み込み計画にこの Plugin を含めるべきコマンド id。                                                                                                                       |
| `onChannels`       | いいえ | `string[]`                                           | アクティベーション/読み込み計画にこの Plugin を含めるべきチャンネル id。                                                                                                                     |
| `onRoutes`         | いいえ | `string[]`                                           | アクティベーション/読み込み計画にこの Plugin を含めるべきルート種別。                                                                                                                        |
| `onConfigPaths`    | いいえ | `string[]`                                           | パスが存在し、明示的に無効化されていない場合に、起動/読み込み計画にこの Plugin を含めるべきルート相対の設定パス。                                                                            |
| `onCapabilities`   | いいえ | `Array<"provider" \| "channel" \| "tool" \| "hook">` | コントロールプレーンのアクティベーション計画で使われる広いケイパビリティヒント。可能な場合は、より狭いフィールドを優先する。                                                                |

現在の実際のコンシューマー:

- Gateway 起動計画は、明示的な起動時インポートに `activation.onStartup` を使う。
- コマンド起動の CLI 計画は、レガシーの `commandAliases[].cliCommand` または `commandAliases[].name` にフォールバックする。
- エージェントランタイム起動計画は、埋め込みハーネスには `activation.onAgentHarnesses` を、CLI ランタイムエイリアスにはトップレベルの `cliBackends[]` を使う。
- チャンネル起動のセットアップ/チャンネル計画は、明示的なチャンネルアクティベーションメタデータがない場合、レガシーの `channels[]` 所有権にフォールバックする。
- 起動時 Plugin 計画は、バンドルされたブラウザー Plugin の `browser` ブロックなど、チャンネル以外のルート設定サーフェスに `activation.onConfigPaths` を使う。
- Provider 起動のセットアップ/ランタイム計画は、明示的な Provider アクティベーションメタデータがない場合、レガシーの `providers[]` とトップレベルの `cliBackends[]` 所有権にフォールバックする。

プランナー診断では、明示的なアクティベーションヒントとマニフェスト所有権フォールバックを区別できる。たとえば、`activation-command-hint` は `activation.onCommands` が一致したことを意味し、`manifest-command-alias` はプランナーが代わりに `commandAliases` 所有権を使ったことを意味する。これらの理由ラベルはホスト診断とテスト用である。Plugin 作者は、所有権を最もよく表すメタデータを宣言し続けるべきである。

## qaRunners リファレンス

Plugin が共有の `openclaw qa` ルート配下に 1 つ以上のトランスポートランナーを提供する場合は、`qaRunners` を使う。このメタデータは低コストで静的に保つ。実際の CLI 登録は、`qaRunnerCliRegistrations` をエクスポートする軽量な `runtime-api.ts` サーフェスを通じて、引き続き Plugin ランタイムが所有する。

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

| フィールド   | 必須   | 型       | 意味                                                                    |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | はい   | `string` | `openclaw qa` 配下にマウントされるサブコマンド。たとえば `matrix`。       |
| `description` | いいえ | `string` | 共有ホストがスタブコマンドを必要とする場合に使われるフォールバックヘルプテキスト。 |

## setup リファレンス

セットアップとオンボーディングサーフェスが、ランタイム読み込み前に低コストな Plugin 所有メタデータを必要とする場合は、`setup` を使う。

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

トップレベルの `cliBackends` は引き続き有効で、CLI 推論バックエンドを説明し続けます。`setup.cliBackends` は、メタデータのみであるべき制御プレーン/セットアップフロー向けの、セットアップ固有の記述子サーフェスです。

`setup.providers` と `setup.cliBackends` が存在する場合、セットアップ検出ではこれらが推奨される記述子優先のルックアップサーフェスです。記述子が候補 Plugin の絞り込みだけを行い、セットアップ時にさらに豊富なランタイムフックが必要な場合は、`requiresRuntime: true` を設定し、フォールバック実行パスとして `setup-api` を維持します。

OpenClaw は、汎用プロバイダー認証と環境変数ルックアップにも `setup.providers[].envVars` を含めます。`providerAuthEnvVars` は非推奨期間中、互換アダプターを通じて引き続きサポートされますが、まだそれを使用しているバンドル外の Plugin にはマニフェスト診断が出ます。新しい Plugin は、セットアップ/ステータスの環境メタデータを `setup.providers[].envVars` に置く必要があります。

OpenClaw は、セットアップエントリがない場合、または `setup.requiresRuntime: false` がセットアップランタイム不要を宣言している場合に、`setup.providers[].authMethods` から単純なセットアップ選択肢も導出できます。明示的な `providerAuthChoices` エントリは、カスタムラベル、CLI フラグ、オンボーディング範囲、アシスタントメタデータでは引き続き推奨されます。

`requiresRuntime: false` は、それらの記述子がセットアップサーフェスに十分な場合にのみ設定してください。OpenClaw は明示的な `false` を記述子のみの契約として扱い、セットアップルックアップのために `setup-api` や `openclaw.setupEntry` を実行しません。記述子のみの Plugin がそれらのセットアップランタイムエントリのいずれかをまだ同梱している場合、OpenClaw は追加的な診断を報告し、それを無視し続けます。`requiresRuntime` を省略すると、フラグなしで記述子を追加した既存の Plugin が壊れないように、レガシーのフォールバック動作が維持されます。

セットアップルックアップでは Plugin 所有の `setup-api` コードを実行できるため、正規化された `setup.providers[].id` と `setup.cliBackends[]` の値は、検出された Plugin 間で一意である必要があります。所有者が曖昧な場合は、検出順から勝者を選ぶのではなく、失敗として閉じます。

セットアップランタイムが実行される場合、`setup-api` がマニフェスト記述子で宣言されていないプロバイダーまたは CLI バックエンドを登録した場合、または記述子に一致するランタイム登録がない場合、セットアップレジストリ診断は記述子のずれを報告します。これらの診断は追加的なものであり、レガシー Plugin を拒否しません。

### setup.providers リファレンス

| フィールド     | 必須 | 型         | 意味                                                                                               |
| -------------- | ---- | ---------- | -------------------------------------------------------------------------------------------------- |
| `id`           | はい | `string`   | セットアップまたはオンボーディング中に公開されるプロバイダー id。正規化された id はグローバルに一意に保ってください。 |
| `authMethods`  | いいえ | `string[]` | 完全なランタイムを読み込まずにこのプロバイダーがサポートするセットアップ/認証メソッド id。          |
| `envVars`      | いいえ | `string[]` | Plugin ランタイムが読み込まれる前に、汎用セットアップ/ステータスサーフェスが確認できる環境変数。    |
| `authEvidence` | いいえ | `object[]` | 非シークレットマーカーを通じて認証できるプロバイダー向けの低コストなローカル認証証拠チェック。      |

`authEvidence` は、ランタイムコードを読み込まずに検証できる、プロバイダー所有のローカル認証情報マーカー用です。これらのチェックは低コストかつローカルである必要があります。ネットワーク呼び出し、キーチェーンやシークレットマネージャーの読み取り、シェルコマンド、プロバイダー API プローブは禁止です。

サポートされる証拠エントリ:

| フィールド         | 必須 | 型         | 意味                                                                                                      |
| ------------------ | ---- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `type`             | はい | `string`   | 現在は `local-file-with-env`。                                                                            |
| `fileEnvVar`       | いいえ | `string`   | 明示的な認証情報ファイルパスを含む環境変数。                                                              |
| `fallbackPaths`    | いいえ | `string[]` | `fileEnvVar` が存在しない、または空の場合に確認されるローカル認証情報ファイルパス。`${HOME}` と `${APPDATA}` をサポートします。 |
| `requiresAnyEnv`   | いいえ | `string[]` | 証拠が有効になる前に、列挙された環境変数の少なくとも 1 つが空でない必要があります。                       |
| `requiresAllEnv`   | いいえ | `string[]` | 証拠が有効になる前に、列挙されたすべての環境変数が空でない必要があります。                                |
| `credentialMarker` | はい | `string`   | 証拠が存在する場合に返される非シークレットマーカー。                                                      |
| `source`           | いいえ | `string`   | 認証/ステータス出力向けのユーザー表示ソースラベル。                                                       |

### setup フィールド

| フィールド         | 必須 | 型         | 意味                                                                                               |
| ------------------ | ---- | ---------- | -------------------------------------------------------------------------------------------------- |
| `providers`        | いいえ | `object[]` | セットアップとオンボーディング中に公開されるプロバイダーセットアップ記述子。                       |
| `cliBackends`      | いいえ | `string[]` | 記述子優先のセットアップルックアップに使用されるセットアップ時バックエンド id。正規化された id はグローバルに一意に保ってください。 |
| `configMigrations` | いいえ | `string[]` | この Plugin のセットアップサーフェスが所有する設定移行 id。                                         |
| `requiresRuntime`  | いいえ | `boolean`  | 記述子ルックアップ後もセットアップに `setup-api` 実行が必要かどうか。                              |

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

各フィールドヒントには次を含められます。

| フィールド    | 型         | 意味                                 |
| ------------- | ---------- | ------------------------------------ |
| `label`       | `string`   | ユーザー表示用のフィールドラベル。   |
| `help`        | `string`   | 短いヘルパーテキスト。               |
| `tags`        | `string[]` | 任意の UI タグ。                     |
| `advanced`    | `boolean`  | フィールドを高度な項目としてマークします。 |
| `sensitive`   | `boolean`  | フィールドをシークレットまたは機微情報としてマークします。 |
| `placeholder` | `string`   | フォーム入力用のプレースホルダーテキスト。 |

## contracts リファレンス

OpenClaw が Plugin ランタイムをインポートせずに読み取れる、静的な機能所有権メタデータにのみ `contracts` を使用してください。

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
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

各リストは任意です:

| フィールド                            | 型         | 意味                                                                                                                        |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server 拡張ファクトリ ID。現在は `codex-app-server`。                                                                |
| `agentToolResultMiddleware`      | `string[]` | この Plugin がツール結果ミドルウェアを登録できるランタイム ID。                                                                     |
| `trustedToolPolicies`            | `string[]` | インストール済み Plugin が登録できる Plugin ローカルの信頼済み事前ツールポリシー ID。バンドル済み Plugin はこのフィールドなしでポリシーを登録できる。 |
| `externalAuthProviders`          | `string[]` | この Plugin が外部認証プロファイルフックを所有するプロバイダー ID。                                                                      |
| `embeddingProviders`             | `string[]` | メモリを含む再利用可能なベクトル埋め込み用途向けに、この Plugin が所有する汎用埋め込みプロバイダー ID。                                 |
| `speechProviders`                | `string[]` | この Plugin が所有する音声プロバイダー ID。                                                                                                |
| `realtimeTranscriptionProviders` | `string[]` | この Plugin が所有するリアルタイム文字起こしプロバイダー ID。                                                                                |
| `realtimeVoiceProviders`         | `string[]` | この Plugin が所有するリアルタイム音声プロバイダー ID。                                                                                        |
| `memoryEmbeddingProviders`       | `string[]` | この Plugin が所有する、非推奨のメモリ専用埋め込みプロバイダー ID。                                                                  |
| `mediaUnderstandingProviders`    | `string[]` | この Plugin が所有するメディア理解プロバイダー ID。                                                                                   |
| `transcriptSourceProviders`      | `string[]` | この Plugin が所有するトランスクリプトソースプロバイダー ID。                                                                                     |
| `documentExtractors`             | `string[]` | この Plugin が所有するドキュメント（例: PDF）抽出プロバイダー ID。                                                                  |
| `imageGenerationProviders`       | `string[]` | この Plugin が所有する画像生成プロバイダー ID。                                                                                      |
| `videoGenerationProviders`       | `string[]` | この Plugin が所有する動画生成プロバイダー ID。                                                                                      |
| `musicGenerationProviders`       | `string[]` | この Plugin が所有する音楽生成プロバイダー ID。                                                                                      |
| `webContentExtractors`           | `string[]` | この Plugin が所有する Web ページコンテンツ抽出プロバイダー ID。                                                                           |
| `webFetchProviders`              | `string[]` | この Plugin が所有する Web 取得プロバイダー ID。                                                                                             |
| `webSearchProviders`             | `string[]` | この Plugin が所有する Web 検索プロバイダー ID。                                                                                            |
| `migrationProviders`             | `string[]` | `openclaw migrate` 向けにこの Plugin が所有するインポートプロバイダー ID。                                                                         |
| `gatewayMethodDispatch`          | `string[]` | Gateway メソッドをプロセス内でディスパッチする認証済み Plugin HTTP ルート用の予約済み権限。                                  |
| `tools`                          | `string[]` | この Plugin が所有するエージェントツール名。                                                                                                   |

`contracts.embeddedExtensionFactories` は、バンドル済み Codex app-server 専用拡張ファクトリのために保持されています。バンドル済みツール結果変換は、代わりに `contracts.agentToolResultMiddleware` を宣言し、`api.registerAgentToolResultMiddleware(...)` で登録する必要があります。インストール済み Plugin は、明示的に有効化されている場合、かつ `contracts.agentToolResultMiddleware` で宣言したランタイムに対してのみ、同じミドルウェアの継ぎ目を使用できます。

ホストに信頼された事前ツールポリシー階層を必要とするインストール済み Plugin は、登録される各ローカル ID を `contracts.trustedToolPolicies` で宣言し、明示的に有効化されている必要があります。バンドル済み Plugin は既存の信頼済みポリシーパスを維持しますが、宣言されていないポリシー ID を持つインストール済み Plugin は登録前に拒否されます。ポリシー ID は登録する Plugin にスコープされるため、2 つの Plugin がどちらも `workflow-budget` を宣言して登録できます。単一の Plugin が同じローカル ID を 2 回登録することはできません。

ランタイムの `api.registerTool(...)` 登録は `contracts.tools` と一致している必要があります。ツール検出では、このリストを使用して、要求されたツールを所有できる Plugin ランタイムだけを読み込みます。

`resolveExternalAuthProfiles` を実装するプロバイダー Plugin は `contracts.externalAuthProviders` を宣言する必要があります。宣言されていない外部認証フックは無視されます。

汎用埋め込みプロバイダーは、`api.registerEmbeddingProvider(...)` で登録される各アダプターについて `contracts.embeddingProviders` を宣言する必要があります。メモリ検索で消費されるプロバイダーを含め、再利用可能なベクトル生成には汎用契約を使用してください。`contracts.memoryEmbeddingProviders` は非推奨のメモリ専用互換性であり、既存のプロバイダーが汎用埋め込みプロバイダーの継ぎ目へ移行する間だけ残ります。

`contracts.gatewayMethodDispatch` は現在 `"authenticated-request"` を受け入れます。これは、Gateway コントロールプレーンメソッドを意図的にプロセス内でディスパッチするネイティブ Plugin HTTP ルート向けの API 衛生ゲートであり、悪意あるネイティブ Plugin に対するサンドボックスではありません。Gateway HTTP 認証をすでに必要とする、厳密にレビューされたバンドル済み/オペレーター向けサーフェスにのみ使用してください。

## configContracts リファレンス

Plugin ランタイムをインポートせずに汎用コアヘルパーが必要とする、マニフェスト所有の設定動作には `configContracts` を使用します。危険フラグ検出、SecretRef 移行ターゲット、レガシー設定パスの絞り込みです。

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

| フィールド                         | 必須 | 型         | 意味                                                                                                                                                                                                                          |
| ----------------------------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | いいえ       | `string[]` | この Plugin のセットアップ時互換性移行が適用される可能性を示す、ルート相対の設定パス。設定がその Plugin を参照していない場合、汎用ランタイム設定読み取りがすべての Plugin セットアップサーフェスをスキップできるようにします。                 |
| `compatibilityRuntimePaths`   | いいえ       | `string[]` | Plugin コードが完全に有効化される前に、この Plugin がランタイム中に処理できるルート相対の互換性パス。すべての互換 Plugin ランタイムをインポートせずに、バンドル済み候補セットを絞り込むべきレガシーサーフェスに使用します。 |
| `dangerousFlags`              | いいえ       | `object[]` | 有効化されている場合に `openclaw doctor` が安全でない、または危険としてフラグを立てるべき設定リテラル。以下を参照してください。                                                                                                                                   |
| `secretInputs`                | いいえ       | `object`   | SecretRef 移行/監査ターゲットレジストリがシークレット形状の文字列として扱うべき、`plugins.entries.<id>.config` 配下の設定パス。以下を参照してください。                                                                                  |

各 `dangerousFlags` エントリは次に対応します。

| フィールド    | 必須 | 型                                  | 意味                                                                                                       |
| -------- | -------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `path`   | はい      | `string`                              | `plugins.entries.<id>.config` からの相対ドット区切り設定パス。マップ/配列セグメントに対する `*` ワイルドカードに対応します。 |
| `equals` | はい      | `string \| number \| boolean \| null` | この設定値を危険としてマークする正確なリテラル。                                                            |

`secretInputs` は次に対応します。

| フィールド                   | 必須 | 型         | 意味                                                                                                                                                                                                   |
| ----------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | いいえ       | `boolean`  | この SecretRef サーフェスがアクティブかを判断する際に、バンドル済み Plugin のデフォルト有効化を上書きします。Plugin がバンドル済みでも、設定で明示的に有効化されるまでサーフェスを非アクティブのままにする必要がある場合に使用します。 |
| `paths`                 | はい      | `object[]` | シークレット形状の設定パス。それぞれに `path`（ドット区切り、`plugins.entries.<id>.config` からの相対、`*` ワイルドカード対応）と任意の `expected`（現在は `"string"` のみ）を持ちます。                            |

## mediaUnderstandingProviderMetadata リファレンス

メディア理解プロバイダーに、ランタイム読み込み前に汎用コアヘルパーが必要とするデフォルトモデル、自動認証フォールバック優先度、またはネイティブドキュメント対応がある場合は、`mediaUnderstandingProviderMetadata` を使用します。キーは `contracts.mediaUnderstandingProviders` でも宣言されている必要があります。

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

各プロバイダーエントリには次を含められます。

| フィールド             | 型                                                               | 意味                                                                                                                       |
| ---------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | このプロバイダーが公開するメディア機能。                                                                                   |
| `defaultModels`        | `Record<string, string>`                                         | config でモデルが指定されていない場合に使われる、機能からモデルへのデフォルト。                                            |
| `autoPriority`         | `Record<string, number>`                                         | 数値が小さいほど、認証情報ベースの自動プロバイダーフォールバックで先に並ぶ。                                               |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | プロバイダーがサポートするネイティブドキュメント入力。                                                                     |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | ドキュメント種別ごとのモデル上書き。`image: false` を設定すると、そのドキュメント種別で画像ベースの抽出を無効化できる。 |

## channelConfigs リファレンス

チャンネル Plugin がランタイム読み込み前に軽量な config メタデータを必要とする場合は、`channelConfigs` を使用します。読み取り専用のチャンネル設定/状態検出は、設定エントリがない場合、または `setup.requiresRuntime: false` によって設定ランタイムが不要であると宣言されている場合、設定済みの外部チャンネルに対してこのメタデータを直接使用できます。

`channelConfigs` は Plugin マニフェストのメタデータであり、新しいトップレベルのユーザー config セクションではありません。ユーザーは引き続き `channels.<channel-id>` の下でチャンネルインスタンスを設定します。OpenClaw はマニフェストメタデータを読み取り、Plugin ランタイムコードが実行される前に、その設定済みチャンネルをどの Plugin が所有するかを判断します。

チャンネル Plugin では、`configSchema` と `channelConfigs` は異なるパスを記述します。

- `configSchema` は `plugins.entries.<plugin-id>.config` を検証します
- `channelConfigs.<channel-id>.schema` は `channels.<channel-id>` を検証します

`channels[]` を宣言する非バンドル Plugin は、一致する `channelConfigs` エントリも宣言する必要があります。これがない場合でも OpenClaw は Plugin を読み込めますが、コールドパスの config スキーマ、設定、Control UI サーフェスは、Plugin ランタイムが実行されるまでチャンネル所有のオプション形状を把握できません。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` と `nativeSkillsAutoEnabled` は、チャンネルランタイム読み込み前に実行されるコマンド config チェック用の静的な `auto` デフォルトを宣言できます。バンドル済みチャンネルは、他のパッケージ所有のチャンネルカタログメタデータと並べて、`package.json#openclaw.channel.commands` から同じデフォルトを公開することもできます。

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

| フィールド    | 型                       | 意味                                                                                                       |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` の JSON Schema。宣言された各チャンネル config エントリに必須。                             |
| `uiHints`     | `Record<string, object>` | そのチャンネル config セクション向けの任意の UI ラベル/プレースホルダー/機密ヒント。                       |
| `label`       | `string`                 | ランタイムメタデータの準備ができていない場合に、ピッカーと inspect サーフェスへマージされるチャンネルラベル。 |
| `description` | `string`                 | inspect とカタログサーフェス向けの短いチャンネル説明。                                                     |
| `commands`    | `object`                 | ランタイム前の config チェック向けの、静的なネイティブコマンドとネイティブ skill の自動デフォルト。        |
| `preferOver`  | `string[]`               | 選択サーフェスでこのチャンネルが優先すべき、レガシーまたは低優先度の Plugin id。                          |

### 別のチャンネル Plugin を置き換える

別の Plugin も提供できるチャンネル id について、自分の Plugin が優先所有者である場合は `preferOver` を使用します。一般的なケースは、名前変更された Plugin id、バンドル済み Plugin を置き換えるスタンドアロン Plugin、または config 互換性のために同じチャンネル id を維持するメンテナンス済みフォークです。

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

`channels.chat` が設定されている場合、OpenClaw はチャンネル id と優先 Plugin id の両方を考慮します。低優先度の Plugin がバンドル済み、またはデフォルトで有効という理由だけで選択されていた場合、OpenClaw は有効なランタイム config 内でそれを無効化し、1 つの Plugin がチャンネルとそのツールを所有するようにします。明示的なユーザー選択は引き続き優先されます。ユーザーが `plugins.allow` または実質的な `plugins.entries` config 経由で両方の Plugin を明示的に有効化している場合、OpenClaw は要求された Plugin セットを暗黙に変更する代わりに、その選択を保持し、重複したチャンネル/ツールの診断を報告します。

`preferOver` は、同じチャンネルを実際に提供できる Plugin id に限定してください。これは汎用的な優先度フィールドではなく、ユーザー config キーの名前を変更するものでもありません。

## modelSupport リファレンス

Plugin ランタイム読み込み前に、OpenClaw が `gpt-5.5` や `claude-sonnet-4.6` のような短縮モデル id からプロバイダー Plugin を推論する必要がある場合は、`modelSupport` を使用します。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw は次の優先順位を適用します。

- 明示的な `provider/model` 参照は、所有側の `providers` マニフェストメタデータを使用します
- `modelPatterns` は `modelPrefixes` より優先されます
- 1 つの非バンドル Plugin と 1 つのバンドル済み Plugin がどちらも一致する場合、非バンドル Plugin が優先されます
- 残りの曖昧さは、ユーザーまたは config がプロバイダーを指定するまで無視されます

フィールド:

| フィールド      | 型         | 意味                                                                                 |
| --------------- | ---------- | ------------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | 短縮モデル id に対して `startsWith` で一致させるプレフィックス。                     |
| `modelPatterns` | `string[]` | プロファイルサフィックス削除後の短縮モデル id に対して一致させる正規表現ソース。    |

`modelPatterns` エントリは `compileSafeRegex` を通じてコンパイルされ、入れ子の繰り返しを含むパターン（例: `(a+)+$`）は拒否されます。安全性チェックに失敗したパターンは、構文的に無効な正規表現と同様に、暗黙にスキップされます。パターンはシンプルに保ち、入れ子の量指定子は避けてください。

## modelCatalog リファレンス

Plugin ランタイムを読み込む前に OpenClaw がプロバイダーモデルメタデータを把握する必要がある場合は、`modelCatalog` を使用します。これは、固定カタログ行、プロバイダーエイリアス、抑制ルール、検出モードに対するマニフェスト所有のソースです。ランタイム更新は引き続きプロバイダーランタイムコードに属しますが、マニフェストはランタイムがいつ必要かをコアに伝えます。

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

| フィールド       | 型                                                       | 意味                                                                                                                     |
| ---------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `providers`      | `Record<string, object>`                                 | この Plugin が所有するプロバイダー id のカタログ行。キーはトップレベルの `providers` にも現れる必要があります。          |
| `aliases`        | `Record<string, object>`                                 | カタログまたは抑制計画のために、所有プロバイダーへ解決されるべきプロバイダーエイリアス。                                 |
| `suppressions`   | `object[]`                                               | プロバイダー固有の理由でこの Plugin が抑制する、別ソースからのモデル行。                                                 |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | プロバイダーカタログをマニフェストメタデータから読めるか、キャッシュへ更新できるか、またはランタイムが必要か。           |
| `runtimeAugment` | `boolean`                                                | プロバイダーランタイムがマニフェスト/config 計画後にカタログ行を追加する必要がある場合にのみ、`true` に設定します。       |

`aliases` は、モデルカタログ計画のためのプロバイダー所有権検索に参加します。エイリアスのターゲットは、同じ Plugin が所有するトップレベルプロバイダーでなければなりません。プロバイダーでフィルタされた一覧がエイリアスを使用する場合、OpenClaw は所有側のマニフェストを読み込み、プロバイダーランタイムを読み込まずにエイリアスの API/base URL 上書きを適用できます。エイリアスは、フィルタされていないカタログ一覧を展開しません。広範な一覧では、所有側の正規プロバイダー行のみが出力されます。

`suppressions` は、古いプロバイダーランタイムの `suppressBuiltInModel` フックを置き換えます。抑制エントリは、プロバイダーがその Plugin によって所有されている場合、または所有プロバイダーをターゲットにする `modelCatalog.aliases` キーとして宣言されている場合にのみ尊重されます。モデル解決中にランタイム抑制フックは呼び出されなくなりました。

プロバイダーフィールド:

| フィールド | 型                       | 意味                                                                 |
| ---------- | ------------------------ | -------------------------------------------------------------------- |
| `baseUrl`  | `string`                 | このプロバイダーカタログ内のモデル向けの任意のデフォルト base URL。 |
| `api`      | `ModelApi`               | このプロバイダーカタログ内のモデル向けの任意のデフォルト API アダプター。 |
| `headers`  | `Record<string, string>` | このプロバイダーカタログに適用される任意の静的ヘッダー。             |
| `models`   | `object[]`               | 必須のモデル行。`id` のない行は無視されます。                        |

モデルフィールド:

| フィールド       | 型                                                             | 意味                                                                        |
| ------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`               | `string`                                                       | `provider/` プレフィックスなしの、プロバイダー内モデル ID。                |
| `name`             | `string`                                                       | 任意の表示名。                                                             |
| `api`              | `ModelApi`                                                     | 任意のモデル別 API オーバーライド。                                         |
| `baseUrl`          | `string`                                                       | 任意のモデル別ベース URL オーバーライド。                                   |
| `headers`          | `Record<string, string>`                                       | 任意のモデル別静的ヘッダー。                                               |
| `input`            | `Array<"text" \| "image" \| "document">`                       | モデルが受け付けるモダリティ。他の値は黙って破棄されます。                |
| `reasoning`        | `boolean`                                                      | モデルが推論動作を公開するかどうか。                                       |
| `contextWindow`    | `number`                                                       | ネイティブプロバイダーのコンテキストウィンドウ。                           |
| `contextTokens`    | `number`                                                       | `contextWindow` と異なる場合の、任意の実効ランタイムコンテキスト上限。     |
| `maxTokens`        | `number`                                                       | 既知の場合の最大出力トークン数。                                           |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | 任意の thinking レベル別モデル ID またはパラメーターのオーバーライド。     |
| `cost`             | `object`                                                       | 任意の 100 万トークンあたり USD 価格。任意の `tieredPricing` を含みます。  |
| `compat`           | `object`                                                       | OpenClaw モデル設定互換性に一致する任意の互換性フラグ。                    |
| `mediaInput`       | `object`                                                       | 任意のモダリティ別入力設定。現在は画像のみです。                           |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 一覧ステータス。行を一切表示してはならない場合にのみ抑制します。          |
| `statusReason`     | `string`                                                       | 利用可能以外のステータスとともに表示される任意の理由。                    |
| `replaces`         | `string[]`                                                     | このモデルが置き換える古いプロバイダー内モデル ID。                       |
| `replacedBy`       | `string`                                                       | 非推奨行の置き換え先プロバイダー内モデル ID。                             |
| `tags`             | `string[]`                                                     | ピッカーとフィルターで使われる安定したタグ。                               |

抑制フィールド:

| フィールド                 | 型         | 意味                                                                                                        |
| -------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | 抑制するアップストリーム行のプロバイダー ID。この Plugin が所有しているか、所有エイリアスとして宣言されている必要があります。 |
| `model`                    | `string`   | 抑制するプロバイダー内モデル ID。                                                                          |
| `reason`                   | `string`   | 抑制された行が直接要求されたときに表示される任意のメッセージ。                                             |
| `when.baseUrlHosts`        | `string[]` | 抑制を適用する前に必要な、実効プロバイダーベース URL ホストの任意のリスト。                                |
| `when.providerConfigApiIn` | `string[]` | 抑制を適用する前に必要な、完全一致する provider-config `api` 値の任意のリスト。                            |

ランタイム専用データを `modelCatalog` に入れないでください。マニフェスト行が、プロバイダーでフィルターされたリストとピッカーサーフェスでレジストリ/ランタイム検出をスキップするのに十分完全な場合にのみ、`static` を使用します。マニフェスト行が一覧可能な有用なシードまたは補足だが、後で refresh/cache によって行を追加できる場合は、`refreshable` を使用します。refreshable 行はそれ自体では権威を持ちません。OpenClaw がリストを知るためにプロバイダーランタイムを読み込む必要がある場合は、`runtime` を使用します。

## modelIdNormalization リファレンス

プロバイダーランタイムが読み込まれる前に行う必要がある、低コストなプロバイダー所有モデル ID クリーンアップには `modelIdNormalization` を使用します。これにより、短いモデル名、プロバイダー内のレガシー ID、プロキシプレフィックスルールなどのエイリアスを、コアのモデル選択テーブルではなく、所有 Plugin のマニフェストに保持できます。

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

| フィールド                           | 型                      | 意味                                                                                         |
| ------------------------------------ | ----------------------- | -------------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | 大文字小文字を区別しない完全一致のモデル ID エイリアス。値は書かれたとおりに返されます。     |
| `stripPrefixes`                      | `string[]`              | エイリアス検索の前に削除するプレフィックス。レガシーの provider/model 重複に有用です。       |
| `prefixWhenBare`                     | `string`                | 正規化後のモデル ID にまだ `/` が含まれていない場合に追加するプレフィックス。                |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | エイリアス検索後の条件付き bare-id プレフィックスルール。`modelPrefix` と `prefix` がキーです。 |

## providerEndpoints リファレンス

プロバイダーランタイムが読み込まれる前に汎用リクエストポリシーが知る必要があるエンドポイント分類には、`providerEndpoints` を使用します。各 `endpointClass` の意味は引き続きコアが所有し、ホストとベース URL のメタデータは Plugin マニフェストが所有します。

公式に外部化されたプロバイダー Plugin はコア配布物から除外されるため、インストールされるまでそれらのマニフェストは見えません。それらの `providerEndpoints` は `scripts/lib/official-external-provider-catalog.json` にもミラーする必要があります。これにより、Plugin がなくてもエンドポイント分類が動作し続けます。契約テストがこのミラーを強制します。

エンドポイントフィールド:

| フィールド                     | 型         | 意味                                                                                     |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | `openrouter`、`moonshot-native`、`google-vertex` などの既知のコアエンドポイントクラス。  |
| `hosts`                        | `string[]` | エンドポイントクラスにマップされる完全一致のホスト名。                                  |
| `hostSuffixes`                 | `string[]` | エンドポイントクラスにマップされるホストサフィックス。ドメインサフィックスのみの一致には `.` を付けます。 |
| `baseUrls`                     | `string[]` | エンドポイントクラスにマップされる、正規化済みの完全一致 HTTP(S) ベース URL。            |
| `googleVertexRegion`           | `string`   | 完全一致するグローバルホスト用の静的 Google Vertex リージョン。                         |
| `googleVertexRegionHostSuffix` | `string`   | 一致するホストから取り除き、Google Vertex リージョンプレフィックスを公開するためのサフィックス。 |

## providerRequest リファレンス

プロバイダーランタイムを読み込まずに汎用リクエストポリシーが必要とする、低コストなリクエスト互換性メタデータには `providerRequest` を使用します。動作固有のペイロード書き換えは、プロバイダーランタイムフックまたは共有プロバイダーファミリーヘルパーに保持します。

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

| フィールド            | 型           | 意味                                                                                 |
| --------------------- | ------------ | ------------------------------------------------------------------------------------ |
| `family`              | `string`     | 汎用リクエスト互換性の判断と診断で使われるプロバイダーファミリーラベル。             |
| `compatibilityFamily` | `"moonshot"` | 共有リクエストヘルパー用の任意のプロバイダーファミリー互換性バケット。               |
| `openAICompletions`   | `object`     | OpenAI 互換 completions リクエストフラグ。現在は `supportsStreamingUsage` です。     |

## secretProviderIntegrations リファレンス

Plugin が再利用可能な SecretRef exec プロバイダープリセットを公開できる場合は、`secretProviderIntegrations` を使用します。OpenClaw は Plugin ランタイムが読み込まれる前にこのメタデータを読み取り、Plugin の所有権を `secrets.providers.<alias>.pluginIntegration` に保存し、実際のシークレット解決は SecretRef ランタイムに委ねます。プリセットは、バンドル済み Plugin と、git や ClawHub インストールなどの管理対象 Plugin インストールルートから検出されたインストール済み Plugin にのみ公開されます。

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

マップキーは統合 ID です。`providerAlias` が省略された場合、OpenClaw は統合 ID を SecretRef プロバイダーエイリアスとして使用します。プロバイダーエイリアスは通常の SecretRef プロバイダーエイリアスパターンに一致する必要があります。例: `team-secrets` または `onepassword-work`。

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

起動時/再読み込み時に、OpenClaw は現在の Plugin マニフェストメタデータを読み込み、所有 Plugin がインストール済みかつアクティブであることを確認し、マニフェストから exec コマンドを具体化して、そのプロバイダーを解決します。Plugin を無効化または削除すると、アクティブな SecretRefs に対するプロバイダーが取り消されます。スタンドアロンの exec 設定が必要なオペレーターは、手動の `command`/`args` プロバイダーを直接記述することもできます。

現在サポートされているのは `source: "exec"` プリセットのみです。`command` は `${node}` である必要があり、`args[0]` は `./` から始まる Plugin ルート相対のリゾルバースクリプトである必要があります。OpenClaw は起動時/再読み込み時に、現在の Node 実行ファイルと Plugin 内スクリプトの絶対パスへ具体化します。`--require`、`--import`、`--loader`、`--env-file`、`--eval`、`--print` などの Node オプションは、マニフェストプリセット契約の一部ではありません。Node 以外のコマンドが必要なオペレーターは、スタンドアロンの手動 exec プロバイダーを直接設定できます。

OpenClaw は、Plugin ルートからマニフェストプリセット用の `trustedDirs` を導出し、`${node}` プリセットでは現在の Node 実行ファイルのディレクトリから導出します。マニフェスト作成者が指定した `trustedDirs` は無視されます。`timeoutMs`、`noOutputTimeoutMs`、`maxOutputBytes`、`jsonOnly`、`env`、`passEnv`、`allowInsecurePath` など、その他の exec プロバイダーオプションは、通常の SecretRef exec プロバイダー設定にそのまま渡されます。

## `modelPricing` リファレンス

プロバイダーがランタイム読み込み前にコントロールプレーンの価格設定動作を制御する必要がある場合は、`modelPricing` を使用します。Gateway の価格キャッシュは、プロバイダーのランタイムコードをインポートせずにこのメタデータを読み取ります。

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

| フィールド   | 型                | 意味                                                                                                           |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | OpenRouter または LiteLLM の価格を取得してはならないローカル/セルフホストのプロバイダーには `false` を設定します。 |
| `openRouter` | `false \| object` | OpenRouter 価格検索のマッピング。`false` はこのプロバイダーの OpenRouter 検索を無効にします。                  |
| `liteLLM`    | `false \| object` | LiteLLM 価格検索のマッピング。`false` はこのプロバイダーの LiteLLM 検索を無効にします。                        |

ソースフィールド:

| フィールド                 | 型                 | 意味                                                                                                                   |
| -------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | OpenClaw のプロバイダー id と異なる場合の外部カタログプロバイダー id。たとえば `zai` プロバイダーに対する `z-ai` です。 |
| `passthroughProviderModel` | `boolean`          | スラッシュを含むモデル id をネストされたプロバイダー/モデル参照として扱います。OpenRouter などのプロキシプロバイダーで有用です。 |
| `modelIdTransforms`        | `"version-dots"[]` | 追加の外部カタログモデル id バリアント。`version-dots` は `claude-opus-4.6` のようなドット付きバージョン id を試します。 |

### OpenClaw Provider Index

OpenClaw Provider Index は、まだ Plugin がインストールされていない可能性があるプロバイダー向けの、OpenClaw 所有のプレビューメタデータです。Plugin マニフェストの一部ではありません。Plugin マニフェストは引き続き、インストール済み Plugin の権威です。Provider Index は、プロバイダー Plugin がインストールされていない場合に、将来のインストール可能プロバイダーおよびインストール前モデルピッカーのサーフェスが利用する内部フォールバック契約です。

カタログ権威の順序:

1. ユーザー設定。
2. インストール済み Plugin マニフェストの `modelCatalog`。
3. 明示的な更新によるモデルカタログキャッシュ。
4. OpenClaw Provider Index のプレビュー行。

Provider Index には、シークレット、有効状態、ランタイムフック、ライブのアカウント固有モデルデータを含めてはなりません。そのプレビューカタログは Plugin マニフェストと同じ `modelCatalog` プロバイダー行形状を使用しますが、`api`、`baseUrl`、価格設定、互換性フラグなどのランタイムアダプターフィールドをインストール済み Plugin マニフェストと意図的に揃える場合を除き、安定した表示メタデータに限定する必要があります。ライブの `/models` 検出を持つプロバイダーは、通常の一覧表示やオンボーディングでプロバイダー API を呼び出すのではなく、明示的なモデルカタログキャッシュパスを通じて更新済みの行を書き込む必要があります。

Provider Index エントリは、Plugin がコアから移動済み、またはまだインストールされていないプロバイダー向けに、インストール可能 Plugin メタデータを持つこともできます。このメタデータはチャネルカタログのパターンを反映します。インストール可能なセットアップオプションを表示するには、パッケージ名、npm インストール仕様、期待される整合性、軽量な認証選択ラベルで十分です。Plugin がインストールされると、そのマニフェストが優先され、そのプロバイダーについて Provider Index エントリは無視されます。

`openclaw doctor --fix` は、レガシーなトップレベルのマニフェスト機能キーの小さな閉集合を `contracts.*` に移行します: `speechProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`tools`。これらのいずれも（または他の機能リストも）、もはやトップレベルのマニフェストフィールドとして読み取られません。通常のマニフェスト読み込みは、`contracts` 配下にあるものだけを認識します。

## マニフェストと `package.json`

この 2 つのファイルは異なる役割を持ちます。

| ファイル               | 用途                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | Plugin コードの実行前に存在している必要がある検出、設定検証、認証選択メタデータ、UI ヒント                                      |
| `package.json`         | npm メタデータ、依存関係のインストール、エントリポイント、インストールゲート、セットアップ、カタログメタデータに使われる `openclaw` ブロック |

メタデータをどこに置くべきかわからない場合は、次の規則を使用します。

- OpenClaw が Plugin コードを読み込む前に知る必要があるものは、`openclaw.plugin.json` に置きます
- パッケージング、エントリファイル、または npm インストール動作に関するものは、`package.json` に置きます

### 検出に影響する `package.json` フィールド

一部のランタイム前 Plugin メタデータは、意図的に `openclaw.plugin.json` ではなく `package.json` の `openclaw` ブロック配下に置かれます。`openclaw.bundle` と `openclaw.bundle.json` は OpenClaw Plugin 契約ではありません。ネイティブ Plugin は、`openclaw.plugin.json` と、以下でサポートされる `package.json#openclaw` フィールドを使用する必要があります。

重要な例:

| フィールド                                                                                   | 意味                                                                                                                                                                      |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                        | ネイティブ Plugin エントリポイントを宣言します。Plugin パッケージディレクトリ内に留まる必要があります。                                                                  |
| `openclaw.runtimeExtensions`                                                                 | インストール済みパッケージ向けのビルド済み JavaScript ランタイムエントリポイントを宣言します。Plugin パッケージディレクトリ内に留まる必要があります。                    |
| `openclaw.setupEntry`                                                                        | オンボーディング、遅延チャネル起動、読み取り専用チャネルステータス/SecretRef 検出中に使用される軽量なセットアップ専用エントリポイントです。Plugin パッケージディレクトリ内に留まる必要があります。 |
| `openclaw.runtimeSetupEntry`                                                                 | インストール済みパッケージ向けのビルド済み JavaScript セットアップエントリポイントを宣言します。`setupEntry` が必要で、存在している必要があり、Plugin パッケージディレクトリ内に留まる必要があります。 |
| `openclaw.channel`                                                                           | ラベル、ドキュメントパス、エイリアス、選択コピーなどの軽量なチャネルカタログメタデータです。                                                                            |
| `openclaw.channel.commands`                                                                  | チャネルランタイム読み込み前に、設定、監査、コマンド一覧サーフェスで使用される静的なネイティブコマンドおよびネイティブ skill 自動デフォルトメタデータです。              |
| `openclaw.channel.configuredState`                                                           | フルのチャネルランタイムを読み込まずに「env のみのセットアップはすでに存在するか？」に答えられる軽量な設定済み状態チェッカーメタデータです。                              |
| `openclaw.channel.persistedAuthState`                                                        | フルのチャネルランタイムを読み込まずに「すでにサインイン済みのものはあるか？」に答えられる軽量な永続化認証チェッカーメタデータです。                                      |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath`   | バンドル済みおよび外部公開 Plugin のインストール/更新ヒントです。                                                                                                        |
| `openclaw.install.defaultChoice`                                                             | 複数のインストールソースが利用可能な場合の推奨インストールパスです。                                                                                                    |
| `openclaw.install.minHostVersion`                                                            | `>=2026.3.22` や `>=2026.5.1-beta.1` のような semver 下限を使用した、サポートされる最小 OpenClaw ホストバージョンです。                                                   |
| `openclaw.compat.pluginApi`                                                                  | `>=2026.5.27` のような semver 下限を使用した、このパッケージが必要とする最小 OpenClaw Plugin API 範囲です。                                                              |
| `openclaw.install.expectedIntegrity`                                                         | `sha512-...` などの期待される npm dist 整合性文字列です。インストールおよび更新フローは、取得したアーティファクトをこれに照らして検証します。                            |
| `openclaw.install.allowInvalidConfigRecovery`                                                | 設定が無効な場合に、限定的なバンドル済み Plugin 再インストール回復パスを許可します。                                                                                     |
| `openclaw.install.requiredPlatformPackages`                                                  | ロックファイルのプラットフォーム制約が現在のホストと一致する場合に具現化される必要がある npm パッケージエイリアスです。                                                  |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                            | listen 前に setup-runtime チャネルサーフェスを読み込めるようにし、その後、設定済みチャネル Plugin 全体の読み込みを listen 後のアクティベーションまで遅延します。           |

マニフェストメタデータは、ランタイム読み込み前のオンボーディングにどのプロバイダー/チャネル/セットアップ選択肢が表示されるかを決定します。`package.json#openclaw.install` は、ユーザーがその選択肢のいずれかを選んだときに、その Plugin を取得または有効化する方法をオンボーディングに伝えます。インストールヒントを `openclaw.plugin.json` に移動しないでください。

`openclaw.install.minHostVersion` は、非バンドル Plugin ソースのインストール中およびマニフェストレジストリ読み込み中に強制されます。無効な値は拒否されます。新しいが有効な値は、古いホストで外部 Plugin をスキップします。バンドル済みソース Plugin は、ホストチェックアウトと同じバージョンであると見なされます。

`openclaw.install.requiredPlatformPackages` は、任意のプラットフォーム固有エイリアスを通じて必要なネイティブバイナリを公開する npm パッケージ向けです。サポートされる各プラットフォームエイリアスについて、裸の npm パッケージ名を列挙します。npm インストール中、OpenClaw は、ロックファイル制約が現在のホストと一致する宣言済みエイリアスのみを検証します。npm が成功を報告したもののそのエイリアスを省略した場合、OpenClaw は新しいキャッシュで 1 回再試行し、それでもエイリアスが欠落している場合はインストールをロールバックします。

`openclaw.compat.pluginApi` は、非バンドルPluginソースのパッケージインストール時に強制されます。パッケージがビルドされた対象の OpenClaw Plugin SDK/runtime API の下限として使用します。Pluginパッケージがより新しい API を必要としつつ、他のフロー向けには低いインストールヒントを維持する場合、`minHostVersion` より厳しくできます。公式 OpenClaw リリース同期では、既存の公式Plugin API下限がデフォルトで OpenClaw リリースバージョンに引き上げられますが、Pluginのみのリリースでは、パッケージが意図的に古いホストをサポートする場合に低い下限を維持できます。互換性契約としてパッケージバージョンだけを使用しないでください。`peerDependencies.openclaw` は npm パッケージメタデータのままです。OpenClaw はインストール互換性の判断に `openclaw.compat.pluginApi` 契約を使用します。

公式のオンデマンドインストールメタデータは、Pluginが ClawHub で公開されている場合は `clawhubSpec` を使用する必要があります。オンボーディングはそれを優先リモートソースとして扱い、インストール後に ClawHub アーティファクトの事実を記録します。`npmSpec` は、まだ ClawHub に移行していないパッケージの互換性フォールバックとして残ります。

正確な npm バージョン固定はすでに `npmSpec` にあります。例: `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`。公式外部カタログエントリでは、取得された npm アーティファクトが固定リリースと一致しなくなった場合に更新フローがフェイルクローズするよう、正確な spec と `expectedIntegrity` を組み合わせる必要があります。対話型オンボーディングでは、互換性のため、ベアパッケージ名や dist-tag を含む信頼済みレジストリ npm spec が引き続き提示されます。カタログ診断では、正確、浮動、integrity固定、integrity欠落、パッケージ名不一致、無効なデフォルト選択ソースを区別できます。また、`expectedIntegrity` が存在するのに、それを固定できる有効な npm ソースがない場合も警告します。`expectedIntegrity` が存在する場合、インストール/更新フローはそれを強制します。省略されている場合、レジストリ解決は integrity 固定なしで記録されます。

チャネルPluginは、status、チャネル一覧、または SecretRef スキャンがフル runtime を読み込まずに設定済みアカウントを識別する必要がある場合、`openclaw.setupEntry` を提供する必要があります。セットアップエントリは、チャネルメタデータに加えて、セットアップで安全に使える config、status、secrets アダプターを公開する必要があります。ネットワーククライアント、gateway リスナー、transport runtime はメイン拡張エントリポイントに保持してください。

runtime エントリポイントフィールドは、ソースエントリポイントフィールドのパッケージ境界チェックを上書きしません。たとえば、`openclaw.runtimeExtensions` は、境界外へ逃げる `openclaw.extensions` パスを読み込み可能にはできません。

`openclaw.install.allowInvalidConfigRecovery` は意図的に狭く設定されています。任意の壊れた config をインストール可能にするものではありません。現時点では、バンドルPluginパスの欠落や、その同じバンドルPluginに対する古い `channels.<id>` エントリなど、特定の古いバンドルPluginアップグレード失敗からインストールフローが回復することだけを許可します。無関係な config エラーは引き続きインストールをブロックし、オペレーターを `openclaw doctor --fix` に誘導します。

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

setup、doctor、status、または読み取り専用の存在確認フローが、フルチャネルPluginを読み込む前に安価な yes/no 認証プローブを必要とする場合に使用します。永続化された認証状態は、設定済みチャネル状態ではありません。このメタデータを使ってPluginを自動有効化したり、runtime 依存関係を修復したり、チャネルruntimeを読み込むべきか判断したりしないでください。対象 export は、永続化状態だけを読み取る小さな関数にする必要があります。フルチャネルruntime barrel 経由にしないでください。

`openclaw.channel.configuredState` は、安価な env のみの設定済みチェック向けに同じ形状に従います。

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

チャネルが env やその他の小さな非runtime入力から設定済み状態に回答できる場合に使用します。チェックにフル config 解決や実際のチャネルruntimeが必要な場合は、そのロジックをPluginの `config.hasConfiguredState` フック内に保持してください。

## 検出の優先順位（重複するPlugin ID）

OpenClaw は3つのルートからPluginを検出し、次の順序で確認します。OpenClaw に同梱されるバンドルPlugin、グローバルインストールルート（`~/.openclaw/extensions`）、現在のワークスペースルート（`<workspace>/.openclaw/extensions`）、および明示的な `plugins.load.paths` エントリです。

2つの検出結果が同じ `id` を共有する場合、**最も優先順位の高い** manifest だけが保持されます。低い優先順位の重複は、並べて読み込まれるのではなく破棄されます。優先順位は高い順に次のとおりです。

1. **Configで選択済み** — `plugins.entries.<id>` で明示的に固定されたパス
2. **追跡済みインストール記録に一致するグローバルインストール** — `openclaw plugin install`/`openclaw plugin update` によってインストールされ、OpenClaw のインストール追跡が同じ id として認識するPlugin。その id がバンドルPluginにも属する場合も含む
3. **バンドル** — OpenClaw に同梱されるPlugin
4. **ワークスペース** — 現在のワークスペースを基準に検出されたPlugin
5. その他の検出候補

影響:

- ワークスペースまたはグローバルルートに未追跡で置かれた、バンドルPluginのフォークや古いコピーは、バンドルビルドをシャドウしません。
- バンドルPluginを上書きするには、その id に対して `openclaw plugin install` を実行して追跡済みグローバルインストールがバンドルコピーより優先されるようにするか、`plugins.entries.<id>` で特定パスを固定して config 選択の優先順位で勝たせます。
- 重複の破棄はログに記録されるため、Doctor と起動診断は破棄されたコピーを指し示せます。
- Configで選択された重複上書きは診断では明示的な上書きとして表現されますが、古いフォークや偶発的なシャドウが見えるよう、引き続き警告します。

## JSON Schema の要件

- **すべてのPluginは JSON Schema を同梱する必要があります**。config を受け付けない場合も同様です。
- 空の schema は許容されます（例: `{ "type": "object", "additionalProperties": false }`）。
- Schema は runtime ではなく、config の読み取り/書き込み時に検証されます。
- 新しい config キーでバンドルPluginを拡張またはフォークする場合は、そのPluginの `openclaw.plugin.json` の `configSchema` も同時に更新してください。バンドルPluginの schema は厳密であるため、`configSchema.properties` に `myNewKey` を追加せずにユーザー config に `plugins.entries.<id>.config.myNewKey` を追加すると、Plugin runtime が読み込まれる前に拒否されます。

Schema 拡張の例:

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

- 未知の `channels.*` キーは、チャネル id がPlugin manifestで宣言されていない限り、**エラー**です。同じ id が `plugins.allow`、`plugins.entries`、または `plugins.installs`（参照されているが現在は検出できないPlugin）にも現れる場合、OpenClaw はこれを代わりに**警告**へ格下げします。
- `plugins.entries.<id>`、`plugins.allow`、および `plugins.deny` が未知のPlugin id を参照している場合は、エラーではなく**警告**（「古い config エントリは無視されました」）です。これにより、アップグレードや削除/名前変更されたPluginが gateway 起動をブロックしません。
- `plugins.slots.memory` が未知のPlugin id を参照している場合は**エラー**です。ただし、既知の `memory-lancedb` 公式外部Pluginは例外で、代わりに警告します。
- Pluginがインストールされているものの、manifest または schema が壊れているか欠落している場合、検証は失敗し、Doctor がPluginエラーを報告します。
- Plugin config が存在するがPluginが**無効**の場合、config は保持され、Doctor とログに**警告**が表示されます。

完全な `plugins.*` schema については、[設定リファレンス](/ja-JP/gateway/configuration)を参照してください。

## 注記

- manifest は、ローカルファイルシステム読み込みを含む**ネイティブ OpenClaw Pluginでは必須**です。runtime はPluginモジュールを別途読み込みます。manifest は検出と検証のためだけに使用されます。
- ネイティブ manifest は JSON5 で解析されるため、最終的な値がオブジェクトである限り、コメント、末尾カンマ、引用符なしキーが受け入れられます。
- manifest loader は、ドキュメント化された manifest フィールドだけを読み取ります。カスタムのトップレベルキーは避けてください。
- Pluginが不要な場合、`channels`、`providers`、`cliBackends`、`skills` はすべて省略できます。
- `providerCatalogEntry` は軽量に保つ必要があり、広範な runtime コードを import すべきではありません。リクエスト時実行ではなく、静的なプロバイダーカタログメタデータや狭い検出 descriptor に使用してください。
- 排他的Plugin種別は `plugins.slots.*` を通じて選択されます。`plugins.slots.memory` 経由の `kind: "memory"`（デフォルト `memory-core`）、`plugins.slots.contextEngine` 経由の `kind: "context-engine"`（デフォルト `legacy`）です。
- 排他的Plugin種別はこの manifest で宣言してください。runtime エントリの `OpenClawPluginDefinition.kind` は非推奨で、古いPlugin向けの互換性フォールバックとしてのみ残っています。
- env var メタデータ（`setup.providers[].envVars`、非推奨の `providerAuthEnvVars`、および `channelEnvVars`）は宣言的なものに限られます。status、audit、cron 配信検証、その他の読み取り専用サーフェスは、env var を設定済みとして扱う前に、引き続きPlugin信頼と有効な有効化ポリシーを適用します。
- プロバイダーコードを必要とする runtime wizard メタデータについては、[プロバイダー runtime フック](/ja-JP/plugins/architecture-internals#provider-runtime-hooks)を参照してください。
- Pluginがネイティブモジュールに依存する場合は、ビルド手順とパッケージマネージャーの allowlist 要件（例: pnpm `allow-build-scripts` + `pnpm rebuild <package>`）をドキュメント化してください。

## 関連

<CardGroup cols={3}>
  <Card title="Pluginの構築" href="/ja-JP/plugins/building-plugins" icon="rocket">
    Pluginをはじめる。
  </Card>
  <Card title="Pluginアーキテクチャ" href="/ja-JP/plugins/architecture" icon="diagram-project">
    内部アーキテクチャと capability モデル。
  </Card>
  <Card title="SDK概要" href="/ja-JP/plugins/sdk-overview" icon="book">
    Plugin SDK リファレンスとサブパス import。
  </Card>
</CardGroup>

---
read_when:
    - OpenClaw Pluginを構築しています
    - Plugin 構成スキーマを出荷する、または Plugin 検証エラーをデバッグする必要がある
summary: Plugin manifest + JSON スキーマ要件（厳密な設定検証）
title: Plugin マニフェスト
x-i18n:
    generated_at: "2026-07-06T21:51:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 317fa77e9e760777a64daa183c72118b78a75a786ca1ca5f8a3fbf289cadff02
    source_path: plugins/manifest.md
    workflow: 16
---

このページでは、**ネイティブ OpenClaw Plugin マニフェスト**である `openclaw.plugin.json` について説明します。互換バンドルレイアウト（Codex、Claude、Cursor）については、[Pluginバンドル](/ja-JP/plugins/bundles)を参照してください。

互換バンドル形式では、代わりにそれぞれ独自のマニフェストファイルを使用します。

- Codex バンドル: `.codex-plugin/plugin.json`
- Claude バンドル: `.claude-plugin/plugin.json`、またはマニフェストなしのデフォルト Claude コンポーネントレイアウト
- Cursor バンドル: `.cursor-plugin/plugin.json`

OpenClaw はこれらのレイアウトを自動検出しますが、以下の `openclaw.plugin.json` スキーマに照らした検証は行いません。互換バンドルでは、レイアウトが OpenClaw のランタイム期待値に一致する場合、OpenClaw はバンドルメタデータ、宣言されたスキルルート、Claude コマンドルート、Claude `settings.json` デフォルト、Claude LSP デフォルト、サポートされているフックパックを読み取ります。

すべてのネイティブ OpenClaw Plugin は、**Plugin ルート**に `openclaw.plugin.json` を同梱する必要があります。OpenClaw はこれを読み取り、**Plugin コードを実行せずに**設定を検証します。マニフェストが存在しない、または無効な場合、設定検証はブロックされ、Plugin エラーとして扱われます。

Plugin システム全体のガイドについては [Plugins](/ja-JP/tools/plugin) を、ネイティブ機能モデルと現在の外部互換性ガイダンスについては [機能モデル](/ja-JP/plugins/architecture#public-capability-model) を参照してください。

## このファイルの役割

`openclaw.plugin.json` は、OpenClaw が**Plugin コードを読み込む前に**読み取るメタデータです。この中のすべては、Plugin ランタイムを起動せずに検査できる程度に軽量である必要があります。

**用途:**

- Plugin の識別、設定検証、設定 UI ヒント
- 認証、オンボーディング、セットアップメタデータ（エイリアス、自動有効化、プロバイダー環境変数、認証選択肢）
- コントロールプレーン画面の有効化ヒント
- モデルファミリー所有権の省略表現
- 静的な機能所有権スナップショット（`contracts`）
- 共有 `openclaw qa` ホストが検査できる QA ランナーメタデータ
- カタログおよび検証画面にマージされるチャネル固有の設定メタデータ

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

## トップレベルフィールドリファレンス

| フィールド                           | 必須     | 型                           | 意味                                                                                                                                                                                                                                                     |
| ------------------------------------ | -------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | はい     | `string`                     | 正規の Plugin ID。これは `plugins.entries.<id>` で使用される ID です。                                                                                                                                                                                   |
| `configSchema`                       | はい     | `object`                     | この Plugin の設定用インライン JSON Schema。                                                                                                                                                                                                             |
| `requiresPlugins`                    | いいえ   | `string[]`                   | この Plugin が効果を持つために同時にインストールされている必要がある Plugin ID。検出では Plugin を読み込み可能なままにしますが、必要な Plugin が欠けている場合は警告します。                                                                           |
| `enabledByDefault`                   | いいえ   | `true`                       | バンドルされた Plugin をデフォルトで有効としてマークします。省略するか、`true` 以外の値を設定すると、Plugin はデフォルトで無効のままになります。                                                                                                         |
| `enabledByDefaultOnPlatforms`        | いいえ   | `string[]`                   | バンドルされた Plugin を、列挙された Node.js プラットフォームでのみデフォルト有効としてマークします。例: `["darwin"]`。明示的な設定が常に優先されます。                                                                                                 |
| `legacyPluginIds`                    | いいえ   | `string[]`                   | この正規 Plugin ID に正規化されるレガシー ID。                                                                                                                                                                                                           |
| `autoEnableWhenConfiguredProviders`  | いいえ   | `string[]`                   | 認証、設定、またはモデル参照で言及されたときに、この Plugin を自動的に有効化する Provider ID。                                                                                                                                                          |
| `kind`                               | いいえ   | `PluginKind \| PluginKind[]` | `plugins.slots.*` で使用される、1 つ以上の排他的な Plugin 種別（`"memory"`、`"context-engine"`）を宣言します。両方のスロットを所有する Plugin は、1 つの配列で両方の種別を宣言します。                                                                    |
| `channels`                           | いいえ   | `string[]`                   | この Plugin が所有する Channel ID。検出と設定検証に使用されます。                                                                                                                                                                                       |
| `providers`                          | いいえ   | `string[]`                   | この Plugin が所有する Provider ID。                                                                                                                                                                                                                    |
| `providerCatalogEntry`               | いいえ   | `string`                     | Plugin ルートからの相対パスで指定する軽量 Provider カタログモジュールパス。完全な Plugin ランタイムを有効化せずに読み込める、manifest スコープの Provider カタログメタデータ用です。                                                                     |
| `modelSupport`                       | いいえ   | `object`                     | ランタイム前に Plugin を自動読み込みするために使用される、manifest 所有のモデルファミリーメタデータの短縮表現。                                                                                                                                         |
| `modelCatalog`                       | いいえ   | `object`                     | この Plugin が所有する Provider 用の宣言的なモデルカタログメタデータ。これは、Plugin ランタイムを読み込まずに将来の読み取り専用一覧表示、オンボーディング、モデルピッカー、エイリアス、抑制を行うためのコントロールプレーン契約です。                 |
| `modelPricing`                       | いいえ   | `object`                     | Provider 所有の外部料金検索ポリシー。ローカルまたはセルフホスト Provider をリモート料金カタログから除外したり、core に Provider ID をハードコードせずに Provider 参照を OpenRouter/LiteLLM カタログ ID にマッピングしたりするために使用します。         |
| `modelIdNormalization`               | いいえ   | `object`                     | Provider ランタイムの読み込み前に実行する必要がある、Provider 所有のモデル ID エイリアスやプレフィックスの整理。                                                                                                                                        |
| `providerEndpoints`                  | いいえ   | `object[]`                   | Provider ランタイムの読み込み前に core が分類する必要がある Provider ルート向けの、manifest 所有の endpoint host/baseUrl メタデータ。                                                                                                                   |
| `providerRequest`                    | いいえ   | `object`                     | Provider ランタイムの読み込み前に汎用リクエストポリシーで使用される、安価な Provider ファミリーおよびリクエスト互換性メタデータ。                                                                                                                       |
| `secretProviderIntegrations`         | いいえ   | `Record<string, object>`     | core に Provider 固有の統合をハードコードせずに setup または install サーフェスが提供できる、宣言的な SecretRef exec Provider プリセット。                                                                                                             |
| `cliBackends`                        | いいえ   | `string[]`                   | この Plugin が所有する CLI 推論バックエンド ID。明示的な設定参照からの起動時自動有効化に使用されます。                                                                                                                                                  |
| `syntheticAuthRefs`                  | いいえ   | `string[]`                   | ランタイムの読み込み前のコールドモデル検出中に、Plugin 所有の合成認証フックをプローブする必要がある Provider または CLI バックエンド参照。                                                                                                             |
| `nonSecretAuthMarkers`               | いいえ   | `string[]`                   | 非シークレットのローカル、OAuth、または環境由来の認証情報状態を表す、バンドル Plugin 所有のプレースホルダー API キー値。                                                                                                                               |
| `commandAliases`                     | いいえ   | `object[]`                   | ランタイムの読み込み前に Plugin 対応の設定および CLI 診断を生成する必要がある、この Plugin が所有するコマンド名。                                                                                                                                       |
| `providerAuthEnvVars`                | いいえ   | `Record<string, string[]>`   | Provider 認証/状態検索用の非推奨互換環境メタデータ。新しい Plugin では `setup.providers[].envVars` を優先してください。OpenClaw は非推奨期間中もこれを読み取ります。                                                                                    |
| `providerUsageAuthEnvVars`           | いいえ   | `Record<string, string[]>`   | 使用量/請求専用の Provider 認証情報。OpenClaw はこれらの名前を使用量検出とシークレットスクラブに使用しますが、推論認証には決して使用しません。                                                                                                         |
| `providerAuthAliases`                | いいえ   | `Record<string, string>`     | 認証検索で別の Provider ID を再利用する必要がある Provider ID。たとえば、ベース Provider の API キーと認証プロファイルを共有するコーディング Provider などです。                                                                                        |
| `channelEnvVars`                     | いいえ   | `Record<string, string[]>`   | OpenClaw が Plugin コードを読み込まずに検査できる、安価な Channel 環境メタデータ。汎用の起動/設定ヘルパーが参照すべき、環境駆動の Channel セットアップまたは認証サーフェスに使用します。                                                                |
| `providerAuthChoices`                | いいえ   | `object[]`                   | オンボーディングピッカー、優先 Provider 解決、単純な CLI フラグ配線用の安価な認証選択メタデータ。                                                                                                                                                      |
| `activation`                         | いいえ   | `object`                     | 起動、Provider、コマンド、Channel、ルート、capability トリガーによる読み込み向けの安価な有効化プランナーメタデータ。メタデータのみであり、実際の動作は引き続き Plugin ランタイムが所有します。                                                          |
| `setup`                              | いいえ   | `object`                     | Plugin ランタイムを読み込まずに検出およびセットアップサーフェスが検査できる、安価なセットアップ/オンボーディング記述子。                                                                                                                               |
| `qaRunners`                          | いいえ   | `object[]`                   | Plugin ランタイムの読み込み前に共有 `openclaw qa` ホストが使用する、安価な QA ランナー記述子。                                                                                                                                                         |
| `contracts`                          | いいえ   | `object`                     | 外部認証フック、埋め込み、音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像/動画/音楽生成、web fetch、web search、document/web-content extraction、および tool 所有権の静的 capability 所有スナップショット。                         |
| `configContracts`                    | いいえ   | `object`                     | 汎用 core ヘルパーが消費する、manifest 所有の設定動作: 危険フラグ検出、SecretRef 移行ターゲット、レガシー設定パスの絞り込み。[configContracts リファレンス](#configcontracts-reference)を参照してください。                                             |
| `mediaUnderstandingProviderMetadata` | いいえ   | `Record<string, object>`     | `contracts.mediaUnderstandingProviders` で宣言された Provider ID 向けの、安価なメディア理解デフォルト。                                                                                                                                                 |
| `imageGenerationProviderMetadata`    | No       | `Record<string, object>`     | `contracts.imageGenerationProviders` で宣言されたプロバイダー ID 向けの軽量な画像生成認証メタデータ。プロバイダー所有の認証エイリアスとベース URL ガードを含みます。                                                                                       |
| `videoGenerationProviderMetadata`    | No       | `Record<string, object>`     | `contracts.videoGenerationProviders` で宣言されたプロバイダー ID 向けの軽量な動画生成認証メタデータ。プロバイダー所有の認証エイリアスとベース URL ガードを含みます。                                                                                       |
| `musicGenerationProviderMetadata`    | No       | `Record<string, object>`     | `contracts.musicGenerationProviders` で宣言されたプロバイダー ID 向けの軽量な音楽生成認証メタデータ。プロバイダー所有の認証エイリアスとベース URL ガードを含みます。                                                                                       |
| `toolMetadata`                       | No       | `Record<string, object>`     | `contracts.tools` で宣言された Plugin 所有のツール向けの軽量な可用性メタデータ。設定、env、または認証の証拠が存在しない限りツールがランタイムを読み込むべきでない場合に使用します。                                                                                |
| `channelConfigs`                     | No       | `Record<string, object>`     | ランタイムが読み込まれる前に、探索および検証サーフェスへマージされる、マニフェスト所有のチャンネル設定メタデータ。                                                                                                                                               |
| `skills`                             | No       | `string[]`                   | Plugin ルートからの相対パスで、読み込む Skill ディレクトリ。                                                                                                                                                                                                  |
| `name`                               | No       | `string`                     | 人間が読める Plugin 名。                                                                                                                                                                                                                              |
| `description`                        | No       | `string`                     | Plugin サーフェスに表示される短い要約。                                                                                                                                                                                                                  |
| `icon`                               | No       | `string`                     | マーケットプレイス/カタログカード用の HTTPS 画像 URL。ClawHub は有効な任意の `https://` URL を受け入れ、これが省略されているか無効な場合はデフォルトの Plugin アイコンへフォールバックします。                                                                                       |
| `version`                            | No       | `string`                     | 情報提供用の Plugin バージョン。                                                                                                                                                                                                                            |
| `uiHints`                            | No       | `Record<string, object>`     | 設定フィールド用の UI ラベル、プレースホルダー、機密性のヒント。                                                                                                                                                                                        |

## 生成プロバイダーメタデータリファレンス

生成プロバイダーメタデータフィールドは、対応する `contracts.*GenerationProviders` リストで宣言されたプロバイダーの静的な認証シグナルを記述します。OpenClaw はプロバイダーランタイムを読み込む前にこれらのフィールドを読み取るため、コアツールはすべてのプロバイダー Plugin をインポートせずに、生成プロバイダーが利用可能かどうかを判断できます。

これらのフィールドは、低コストで宣言的な事実にのみ使用してください。トランスポート、リクエスト変換、トークン更新、認証情報の検証、実際の生成動作は Plugin ランタイムに残します。

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

| フィールド             | 必須 | 型         | 意味                                                                                                                                          |
| ---------------------- | ---- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | いいえ | `string[]` | 生成プロバイダーの静的認証エイリアスとして扱う追加のプロバイダー ID。                                                                        |
| `authProviders`        | いいえ | `string[]` | この生成プロバイダーの認証として扱う、構成済み認証プロファイルを持つプロバイダー ID。                                                        |
| `configSignals`        | いいえ | `object[]` | 認証プロファイルや環境変数なしで構成できる、ローカルまたはセルフホスト型プロバイダー向けの低コストな構成のみの可用性シグナル。              |
| `authSignals`          | いいえ | `object[]` | 明示的な認証シグナル。存在する場合、プロバイダー ID、`aliases`、`authProviders` からのデフォルトシグナルセットを置き換えます。              |
| `referenceAudioInputs` | いいえ | `boolean`  | 動画生成専用。プロバイダーが参照音声アセットを受け付ける場合は `true` に設定します。それ以外の場合、`video_generate` は音声参照パラメーターを非表示にします。 |

各 `configSignals` エントリは以下をサポートします。

| フィールド       | 必須 | 型         | 意味                                                                                                                                                                            |
| ---------------- | ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | はい | `string`   | 検査する Plugin 所有の構成オブジェクトへのドットパス。例: `plugins.entries.example.config`。                                                                                   |
| `overlayPath`    | いいえ | `string`   | シグナルを評価する前にルートオブジェクトへ重ねる、ルート構成内のオブジェクトへのドットパス。`image`、`video`、`music` など、機能固有の構成に使用します。                     |
| `overlayMapPath` | いいえ | `string`   | それぞれのオブジェクト値をルートオブジェクトへ重ねる、ルート構成内のドットパス。`accounts` のような名前付きアカウントマップに使用し、構成済みアカウントがあれば条件を満たします。 |
| `required`       | いいえ | `string[]` | 有効な構成内で、構成済みの値を持つ必要があるドットパス。文字列は空であってはならず、オブジェクトと配列も空であってはなりません。                                             |
| `requiredAny`    | いいえ | `string[]` | 有効な構成内で、少なくとも 1 つが構成済みの値を持つ必要があるドットパス。                                                                                                      |
| `mode`           | いいえ | `object`   | 有効な構成内の任意の文字列モードガード。構成のみの可用性が 1 つのモードにのみ適用される場合に使用します。                                                                      |

各 `mode` ガードは以下をサポートします。

| フィールド   | 必須 | 型         | 意味                                                                                 |
| ------------ | ---- | ---------- | ------------------------------------------------------------------------------------ |
| `path`       | いいえ | `string`   | 有効な構成内のドットパス。デフォルトは `mode` です。                                |
| `default`    | いいえ | `string`   | 構成でパスが省略された場合に使用するモード値。                                      |
| `allowed`    | いいえ | `string[]` | 存在する場合、有効なモードがこれらの値のいずれかである場合にのみシグナルが通ります。 |
| `disallowed` | いいえ | `string[]` | 存在する場合、有効なモードがこれらの値のいずれかである場合にシグナルは失敗します。   |

各 `authSignals` エントリは以下をサポートします。

| フィールド        | 必須 | 型       | 意味                                                                                                                                           |
| ----------------- | ---- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | はい | `string` | 構成済み認証プロファイルで確認するプロバイダー ID。                                                                                           |
| `providerBaseUrl` | いいえ | `object` | 参照先の構成済みプロバイダーが許可されたベース URL を使用している場合にのみシグナルを有効にする任意のガード。認証エイリアスが特定の API にのみ有効な場合に使用します。 |

各 `providerBaseUrl` ガードは以下をサポートします。

| フィールド        | 必須 | 型         | 意味                                                                                                                                      |
| ----------------- | ---- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | はい | `string`   | `baseUrl` を確認するプロバイダー構成 ID。                                                                                                 |
| `defaultBaseUrl`  | いいえ | `string`   | プロバイダー構成で `baseUrl` が省略された場合に仮定するベース URL。                                                                       |
| `allowedBaseUrls` | はい | `string[]` | この認証シグナルで許可されるベース URL。構成済みまたはデフォルトのベース URL がこれらの正規化済み値のいずれにも一致しない場合、シグナルは無視されます。 |

## ツールメタデータリファレンス

`toolMetadata` は、生成プロバイダーメタデータと同じ `configSignals` および `authSignals` 形状を使用し、ツール名をキーにします。`contracts.tools` は所有権を宣言します。`toolMetadata` は低コストな可用性の根拠を宣言するため、OpenClaw はツールファクトリに `null` を返させるためだけに Plugin ランタイムをインポートすることを避けられます。

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

`toolMetadata` エントリは、上記の共有 `configSignals`/`authSignals` フィールドに加えて、`optional`（Plugin の有効化に必須ではないツールとしてマーク）と `replaySafe`（未完了のモデルターン後にツール実行を繰り返しても安全であることをマーク）も受け付けます。

ツールに `toolMetadata` がない場合、OpenClaw は既存の動作を保持し、ツール契約がポリシーに一致すると所有元 Plugin を読み込みます。ファクトリが認証や構成に依存するホットパス上のツールでは、Plugin 作成者は、問い合わせのためにコアへランタイムをインポートさせるのではなく、`toolMetadata` を宣言するべきです。

## providerAuthChoices リファレンス

各 `providerAuthChoices` エントリは、1 つのオンボーディングまたは認証の選択肢を記述します。OpenClaw はプロバイダーランタイムを読み込む前にこれを読み取ります。プロバイダーセットアップリストは、プロバイダーランタイムを読み込まずに、これらのマニフェスト選択肢、ディスクリプターから導出されたセットアップ選択肢、インストールカタログメタデータを使用します。

| フィールド            | 必須     | 型                                                                    | 意味                                                                                                      |
| --------------------- | -------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | はい     | `string`                                                              | この選択肢が属するプロバイダー ID。                                                                       |
| `method`              | はい     | `string`                                                              | ディスパッチ先の認証方式 ID。                                                                            |
| `choiceId`            | はい     | `string`                                                              | オンボーディングと CLI フローで使用される安定した認証選択 ID。                                           |
| `choiceLabel`         | いいえ   | `string`                                                              | ユーザー向けラベル。省略した場合、OpenClaw は `choiceId` にフォールバックする。                          |
| `choiceHint`          | いいえ   | `string`                                                              | ピッカー用の短い補助テキスト。                                                                           |
| `assistantPriority`   | いいえ   | `number`                                                              | 値が小さいほど、アシスタント主導の対話型ピッカーで先に並ぶ。                                             |
| `assistantVisibility` | いいえ   | `"visible"` \| `"manual-only"`                                        | 手動 CLI 選択は許可したまま、アシスタントピッカーではこの選択肢を非表示にする。                          |
| `deprecatedChoiceIds` | いいえ   | `string[]`                                                            | ユーザーをこの置換先の選択肢へリダイレクトすべきレガシー選択 ID。                                        |
| `groupId`             | いいえ   | `string`                                                              | 関連する選択肢をグループ化するための任意のグループ ID。                                                  |
| `groupLabel`          | いいえ   | `string`                                                              | そのグループのユーザー向けラベル。                                                                       |
| `groupHint`           | いいえ   | `string`                                                              | グループ用の短い補助テキスト。                                                                           |
| `onboardingFeatured`  | いいえ   | `boolean`                                                             | 対話型オンボーディングピッカーの注目ティアで、"More..." エントリの前にこのグループを表示する。            |
| `optionKey`           | いいえ   | `string`                                                              | 単純な 1 フラグ認証フロー用の内部オプションキー。                                                        |
| `cliFlag`             | いいえ   | `string`                                                              | `--openrouter-api-key` などの CLI フラグ名。                                                             |
| `cliOption`           | いいえ   | `string`                                                              | `--openrouter-api-key <key>` などの完全な CLI オプション形式。                                           |
| `cliDescription`      | いいえ   | `string`                                                              | CLI ヘルプで使用される説明。                                                                             |
| `onboardingScopes`    | いいえ   | `Array<"text-inference" \| "image-generation" \| "music-generation">` | この選択肢を表示すべきオンボーディング画面。省略した場合、既定で `["text-inference"]` になる。           |

## commandAliases リファレンス

Plugin が、ユーザーが誤って `plugins.allow` に入れたりルート CLI コマンドとして実行しようとしたりする可能性のあるランタイムコマンド名を所有している場合は、`commandAliases` を使用する。OpenClaw は Plugin ランタイムコードをインポートせずに、このメタデータを診断に使用する。

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

| フィールド   | 必須     | 型                | 意味                                                                      |
| ------------ | -------- | ----------------- | ------------------------------------------------------------------------- |
| `name`       | はい     | `string`          | この Plugin に属するコマンド名。                                          |
| `kind`       | いいえ   | `"runtime-slash"` | エイリアスをルート CLI コマンドではなくチャットのスラッシュコマンドとして示す。 |
| `cliCommand` | いいえ   | `string`          | 存在する場合、CLI 操作用に提案する関連ルート CLI コマンド。               |

## activation リファレンス

Plugin が、どのコントロールプレーンイベントで有効化/読み込み計画に含めるべきかを低コストで宣言できる場合は、`activation` を使用する。

このブロックはプランナーのメタデータであり、ライフサイクル API ではない。ランタイム動作を登録せず、`register(...)` を置き換えず、Plugin コードがすでに実行済みであることも約束しない。有効化プランナーは、`providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools`、フックなどの既存のマニフェスト所有権メタデータにフォールバックする前に、これらのフィールドを使って候補 Plugin を絞り込む。

所有権をすでに表している最も狭いメタデータを優先する。関係性を表現できる場合は、`providers`、`channels`、`commandAliases`、セットアップ記述子、または `contracts` を使用する。これらの所有権フィールドでは表せない追加のプランナーヒントには `activation` を使用する。`claude-cli`、`my-cli`、`google-gemini-cli` などの CLI ランタイムエイリアスにはトップレベルの `cliBackends` を使用する。`activation.onAgentHarnesses` は、所有権フィールドをまだ持たない埋め込みエージェントハーネス ID 専用である。

すべての Plugin は `activation.onStartup` を意図的に設定するべきである。Plugin が Gateway 起動中に実行される必要がある場合にのみ `true` に設定する。起動時に Plugin が不活性で、より狭いトリガーからのみ読み込むべき場合は `false` に設定する。`onStartup` を省略しても、Plugin が暗黙的に起動時読み込みされることはなくなった。起動、チャネル、設定、エージェントハーネス、メモリ、またはその他のより狭い有効化トリガーには、明示的な有効化メタデータを使用する。

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

| フィールド         | 必須     | 型                                                   | 意味                                                                                                                                                                |
| ------------------ | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | いいえ   | `boolean`                                            | 明示的な Gateway 起動時の有効化。すべての Plugin がこれを設定するべきである。`true` は起動中に Plugin をインポートし、`false` は別の一致するトリガーが読み込みを必要としない限り、起動時遅延のままにする。 |
| `onProviders`      | いいえ   | `string[]`                                           | 有効化/読み込み計画にこの Plugin を含めるべきプロバイダー ID。                                                                                                     |
| `onAgentHarnesses` | いいえ   | `string[]`                                           | 有効化/読み込み計画にこの Plugin を含めるべき埋め込みエージェントハーネスランタイム ID。CLI バックエンドエイリアスにはトップレベルの `cliBackends` を使用する。    |
| `onCommands`       | いいえ   | `string[]`                                           | 有効化/読み込み計画にこの Plugin を含めるべきコマンド ID。                                                                                                         |
| `onChannels`       | いいえ   | `string[]`                                           | 有効化/読み込み計画にこの Plugin を含めるべきチャネル ID。                                                                                                         |
| `onRoutes`         | いいえ   | `string[]`                                           | 有効化/読み込み計画にこの Plugin を含めるべきルート種別。                                                                                                          |
| `onConfigPaths`    | いいえ   | `string[]`                                           | パスが存在し、明示的に無効化されていない場合に、起動/読み込み計画にこの Plugin を含めるべきルート相対の設定パス。                                                  |
| `onCapabilities`   | いいえ   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | コントロールプレーンの有効化計画で使用される広範なケイパビリティヒント。可能な場合は、より狭いフィールドを優先する。                                               |

現在のライブコンシューマー:

- Gateway 起動計画は、明示的な起動時インポートに `activation.onStartup` を使用する。
- コマンドトリガーの CLI 計画は、レガシーの `commandAliases[].cliCommand` または `commandAliases[].name` にフォールバックする。
- エージェントランタイム起動計画は、埋め込みハーネスに `activation.onAgentHarnesses` を、CLI ランタイムエイリアスにトップレベルの `cliBackends[]` を使用する。
- チャネルトリガーのセットアップ/チャネル計画は、明示的なチャネル有効化メタデータがない場合、レガシーの `channels[]` 所有権にフォールバックする。
- 起動時 Plugin 計画は、バンドルされたブラウザー Plugin の `browser` ブロックなど、非チャネルのルート設定面に `activation.onConfigPaths` を使用する。
- プロバイダートリガーのセットアップ/ランタイム計画は、明示的なプロバイダー有効化メタデータがない場合、レガシーの `providers[]` とトップレベルの `cliBackends[]` 所有権にフォールバックする。

プランナー診断では、明示的な有効化ヒントとマニフェスト所有権フォールバックを区別できる。たとえば、`activation-command-hint` は `activation.onCommands` が一致したことを意味し、`manifest-command-alias` はプランナーが代わりに `commandAliases` 所有権を使用したことを意味する。これらの理由ラベルはホスト診断とテスト用であり、Plugin 作者は所有権を最もよく表すメタデータを宣言し続けるべきである。

## qaRunners リファレンス

Plugin が共有 `openclaw qa` ルート配下に 1 つ以上のトランスポートランナーを提供する場合は、`qaRunners` を使用する。このメタデータは低コストで静的に保つ。Plugin ランタイムは引き続き、一致する `qaRunnerCliRegistrations` をエクスポートする軽量な `runtime-api.ts` サーフェスを通じて、実際の CLI 登録を所有する。任意の `adapterFactory` は、登録済みコマンドのランナーを変更せずに、共有 QA シナリオへトランスポートを公開する。

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

| フィールド    | 必須     | 型       | 意味                                                                            |
| ------------- | -------- | -------- | ------------------------------------------------------------------------------- |
| `commandName` | はい     | `string` | `openclaw qa` 配下にマウントされるサブコマンド。例: `matrix`。                 |
| `description` | いいえ   | `string` | 共有ホストがスタブコマンドを必要とする場合に使用されるフォールバックヘルプテキスト。 |

`adapterFactory` id は `commandName` と一致する必要があります。マニフェストに存在しないコマンドの登録をエクスポートしないでください。

## setup リファレンス

ランタイムが読み込まれる前に、セットアップとオンボーディングのサーフェスが低コストな Plugin 所有のメタデータを必要とする場合は、`setup` を使用します。

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

存在する場合、`setup.providers` と `setup.cliBackends` は、セットアップ検出における記述子優先の推奨ルックアップサーフェスです。記述子が候補 Plugin を絞り込むだけで、セットアップ時にさらにリッチなランタイムフックが必要な場合は、`requiresRuntime: true` を設定し、フォールバック実行パスとして `setup-api` を維持します。

OpenClaw は、汎用プロバイダー認証および環境変数ルックアップにも `setup.providers[].envVars` を含めます。`providerAuthEnvVars` は非推奨期間中、互換アダプターを通じて引き続きサポートされますが、これをまだ使用している非バンドル Plugin にはマニフェスト診断が出ます。新しい Plugin では、セットアップ/ステータス用の環境メタデータを `setup.providers[].envVars` に置く必要があります。

請求または組織レベルの認証情報が、推論認証情報にならずに `resolveUsageAuth` を有効化する必要がある場合は、`providerUsageAuthEnvVars` を使用します。これらの名前は、ワークスペース dotenv ブロック、ACP 子プロセスの除去、サンドボックスのシークレットフィルタリング、広範なシークレットスクラブに加わります。プロバイダーランタイムは引き続き `resolveUsageAuth` 内で値を読み取り、分類します。

OpenClaw は、セットアップエントリがない場合、または `setup.requiresRuntime: false` がセットアップランタイム不要を宣言している場合、`setup.providers[].authMethods` から単純なセットアップ選択肢を導出することもできます。カスタムラベル、CLI フラグ、オンボーディングスコープ、アシスタントメタデータには、明示的な `providerAuthChoices` エントリが引き続き推奨されます。

これらの記述子がセットアップサーフェスに十分な場合にのみ、`requiresRuntime: false` を設定してください。OpenClaw は明示的な `false` を記述子のみの契約として扱い、セットアップルックアップのために `setup-api` または `openclaw.setupEntry` を実行しません。記述子のみの Plugin がそれらのセットアップランタイムエントリのいずれかをまだ出荷している場合、OpenClaw は追加的な診断を報告し、それを無視し続けます。`requiresRuntime` を省略すると、フラグなしで記述子を追加した既存 Plugin が壊れないように、従来のフォールバック動作が維持されます。

セットアップルックアップは Plugin 所有の `setup-api` コードを実行できるため、正規化された `setup.providers[].id` と `setup.cliBackends[]` の値は、検出された Plugin 間で一意である必要があります。所有者が曖昧な場合、検出順から勝者を選ぶのではなく、フェイルクローズします。

セットアップランタイムが実行される場合、`setup-api` がマニフェスト記述子で宣言されていないプロバイダーまたは CLI バックエンドを登録した場合、または記述子に一致するランタイム登録がない場合、セットアップレジストリ診断は記述子のドリフトを報告します。これらの診断は追加的なものであり、従来の Plugin を拒否しません。

### setup.providers リファレンス

| フィールド          | 必須 | 型       | 意味                                                                                    |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | はい      | `string`   | セットアップまたはオンボーディング中に公開されるプロバイダー id。正規化済み id はグローバルに一意に保ちます。             |
| `authMethods`  | いいえ       | `string[]` | フルランタイムを読み込まずにこのプロバイダーがサポートするセットアップ/認証メソッド id。                       |
| `envVars`      | いいえ       | `string[]` | 汎用セットアップ/ステータスサーフェスが Plugin ランタイム読み込み前に確認できる環境変数。               |
| `authEvidence` | いいえ       | `object[]` | 非シークレットマーカーを通じて認証できるプロバイダー向けの低コストなローカル認証エビデンスチェック。 |

`authEvidence` は、ランタイムコードを読み込まずに検証できる、プロバイダー所有のローカル認証情報マーカー用です。これらのチェックは低コストかつローカルである必要があります。ネットワーク呼び出し、キーチェーンやシークレットマネージャーの読み取り、シェルコマンド、プロバイダー API プローブは行いません。

サポートされているエビデンスエントリ:

| フィールド              | 必須 | 型       | 意味                                                                                                  |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | はい      | `string`   | 現在は `local-file-with-env`。                                                                               |
| `fileEnvVar`       | いいえ       | `string`   | 明示的な認証情報ファイルパスを含む環境変数。                                                           |
| `fallbackPaths`    | いいえ       | `string[]` | `fileEnvVar` がない、または空の場合に確認するローカル認証情報ファイルパス。`${HOME}` と `${APPDATA}` をサポートします。 |
| `requiresAnyEnv`   | いいえ       | `string[]` | エビデンスが有効になるには、列挙された環境変数の少なくとも 1 つが空でない必要があります。                                    |
| `requiresAllEnv`   | いいえ       | `string[]` | エビデンスが有効になるには、列挙されたすべての環境変数が空でない必要があります。                                           |
| `credentialMarker` | はい      | `string`   | エビデンスが存在する場合に返される非シークレットマーカー。                                                       |
| `source`           | いいえ       | `string`   | 認証/ステータス出力用のユーザー向けソースラベル。                                                               |

### setup フィールド

| フィールド              | 必須 | 型       | 意味                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | いいえ       | `object[]` | セットアップおよびオンボーディング中に公開されるプロバイダーセットアップ記述子。                                     |
| `cliBackends`      | いいえ       | `string[]` | 記述子優先のセットアップルックアップに使用されるセットアップ時バックエンド id。正規化済み id はグローバルに一意に保ちます。 |
| `configMigrations` | いいえ       | `string[]` | この Plugin のセットアップサーフェスが所有する設定移行 id。                                          |
| `requiresRuntime`  | いいえ       | `boolean`  | セットアップが記述子ルックアップ後も `setup-api` 実行を必要とするかどうか。                            |

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
| `label`       | `string`   | ユーザー向けフィールドラベル。                |
| `help`        | `string`   | 短いヘルパーテキスト。                      |
| `tags`        | `string[]` | 任意の UI タグ。                       |
| `advanced`    | `boolean`  | フィールドを高度な項目としてマークします。            |
| `sensitive`   | `boolean`  | フィールドをシークレットまたは機微情報としてマークします。 |
| `placeholder` | `string`   | フォーム入力用のプレースホルダーテキスト。       |

## contracts リファレンス

Plugin ランタイムをインポートせずに OpenClaw が読み取れる静的なケイパビリティ所有メタデータにのみ、`contracts` を使用します。

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
    "usageProviders": ["acme-ai"],
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

各リストは任意です。

| フィールド                       | 型         | 意味                                                                                                                                 |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server 拡張ファクトリ ID。現在は `codex-app-server`。                                                                      |
| `agentToolResultMiddleware`      | `string[]` | この Plugin がツール結果ミドルウェアを登録できるランタイム ID。                                                                     |
| `trustedToolPolicies`            | `string[]` | インストール済み Plugin が登録できる Plugin ローカルの信頼済み事前ツールポリシー ID。バンドル済み Plugin はこのフィールドなしでポリシーを登録できる。 |
| `externalAuthProviders`          | `string[]` | この Plugin が外部認証プロファイルフックを所有するプロバイダー ID。                                                                 |
| `embeddingProviders`             | `string[]` | メモリを含む再利用可能なベクトル埋め込み用途のために、この Plugin が所有する汎用埋め込みプロバイダー ID。                         |
| `speechProviders`                | `string[]` | この Plugin が所有する音声プロバイダー ID。                                                                                         |
| `realtimeTranscriptionProviders` | `string[]` | この Plugin が所有するリアルタイム文字起こしプロバイダー ID。                                                                       |
| `realtimeVoiceProviders`         | `string[]` | この Plugin が所有するリアルタイム音声プロバイダー ID。                                                                             |
| `memoryEmbeddingProviders`       | `string[]` | この Plugin が所有する、非推奨のメモリ専用埋め込みプロバイダー ID。                                                                 |
| `mediaUnderstandingProviders`    | `string[]` | この Plugin が所有するメディア理解プロバイダー ID。                                                                                 |
| `transcriptSourceProviders`      | `string[]` | この Plugin が所有するトランスクリプトソースプロバイダー ID。                                                                       |
| `documentExtractors`             | `string[]` | この Plugin が所有するドキュメント（たとえば PDF）抽出プロバイダー ID。                                                             |
| `imageGenerationProviders`       | `string[]` | この Plugin が所有する画像生成プロバイダー ID。                                                                                     |
| `videoGenerationProviders`       | `string[]` | この Plugin が所有する動画生成プロバイダー ID。                                                                                     |
| `musicGenerationProviders`       | `string[]` | この Plugin が所有する音楽生成プロバイダー ID。                                                                                     |
| `webContentExtractors`           | `string[]` | この Plugin が所有する Web ページコンテンツ抽出プロバイダー ID。                                                                    |
| `webFetchProviders`              | `string[]` | この Plugin が所有する Web フェッチプロバイダー ID。                                                                                |
| `webSearchProviders`             | `string[]` | この Plugin が所有する Web 検索プロバイダー ID。                                                                                    |
| `usageProviders`                 | `string[]` | この Plugin が使用量認証フックと使用量スナップショットフックを所有するプロバイダー ID。                                           |
| `migrationProviders`             | `string[]` | `openclaw migrate` 用にこの Plugin が所有するインポートプロバイダー ID。                                                            |
| `gatewayMethodDispatch`          | `string[]` | Gateway メソッドをプロセス内でディスパッチする、認証済み Plugin HTTP ルート向けの予約済み権限。                                  |
| `tools`                          | `string[]` | この Plugin が所有する Agent ツール名。                                                                                             |

`contracts.embeddedExtensionFactories` は、バンドル済み Codex app-server 専用拡張ファクトリのために保持されています。バンドル済みツール結果変換は、代わりに `contracts.agentToolResultMiddleware` を宣言し、`api.registerAgentToolResultMiddleware(...)` で登録する必要があります。インストール済み Plugin は、明示的に有効化され、かつ `contracts.agentToolResultMiddleware` で宣言したランタイムに限り、同じミドルウェア接点を使用できます。

ホスト信頼の事前ツールポリシー階層を必要とするインストール済み Plugin は、登録する各ローカル ID を `contracts.trustedToolPolicies` で宣言し、明示的に有効化されている必要があります。バンドル済み Plugin は既存の信頼済みポリシーパスを維持しますが、未宣言のポリシー ID を持つインストール済み Plugin は登録前に拒否されます。ポリシー ID は登録元 Plugin にスコープされるため、2 つの Plugin がどちらも `workflow-budget` を宣言して登録できますが、単一の Plugin が同じローカル ID を 2 回登録することはできません。

ランタイムの `api.registerTool(...)` 登録は `contracts.tools` と一致している必要があります。ツール検出はこのリストを使って、要求されたツールを所有できる Plugin ランタイムだけをロードします。

`resolveExternalAuthProfiles` を実装するプロバイダー Plugin は `contracts.externalAuthProviders` を宣言する必要があります。未宣言の外部認証フックは無視されます。

`resolveUsageAuth` と `fetchUsageSnapshot` の両方を実装するプロバイダー Plugin は、自動検出される各プロバイダー ID を `contracts.usageProviders` で宣言する必要があります。使用量検出はランタイムコードをロードする前にこの契約を読み取り、宣言された所有者だけをロードした後で両方のフックを検証します。

汎用埋め込みプロバイダーは、`api.registerEmbeddingProvider(...)` で登録される各アダプターについて `contracts.embeddingProviders` を宣言する必要があります。メモリ検索で消費されるプロバイダーを含め、再利用可能なベクトル生成には汎用契約を使用してください。`contracts.memoryEmbeddingProviders` は非推奨のメモリ専用互換性であり、既存のプロバイダーが汎用埋め込みプロバイダー接点へ移行する間だけ残ります。

`contracts.gatewayMethodDispatch` は現在 `"authenticated-request"` を受け付けます。これは、Gateway コントロールプレーンメソッドをプロセス内で意図的にディスパッチするネイティブ Plugin HTTP ルートのための API 衛生ゲートであり、悪意あるネイティブ Plugin に対するサンドボックスではありません。Gateway HTTP 認証をすでに必要とする、厳密にレビューされたバンドル済みまたはオペレーター向けサーフェスにのみ使用してください。

## configContracts リファレンス

Plugin ランタイムをインポートせずに汎用コアヘルパーが必要とする、マニフェスト所有の設定動作には `configContracts` を使用します。危険なフラグの検出、SecretRef 移行ターゲット、レガシー設定パスの絞り込みが対象です。

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

| フィールド                    | 必須 | 型         | 意味                                                                                                                                                                                                                                   |
| ----------------------------- | ---- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | いいえ | `string[]` | この Plugin のセットアップ時互換性移行が適用される可能性を示す、ルート相対の設定パス。設定がその Plugin を参照していない場合に、汎用ランタイム設定読み取りがすべての Plugin セットアップサーフェスをスキップできるようにします。 |
| `compatibilityRuntimePaths`   | いいえ | `string[]` | Plugin コードが完全に有効化される前のランタイム中に、この Plugin が処理できるルート相対の互換性パス。互換性のあるすべての Plugin ランタイムをインポートせずに、バンドル済み候補セットを絞り込むべきレガシーサーフェスに使用します。 |
| `dangerousFlags`              | いいえ | `object[]` | 有効な場合に `openclaw doctor` が安全でない、または危険としてフラグを立てるべき設定リテラル。以下を参照してください。                                                                                                                |
| `secretInputs`                | いいえ | `object`   | SecretRef 移行/監査ターゲットレジストリが秘密情報形式の文字列として扱うべき、`plugins.entries.<id>.config` 配下の設定パス。以下を参照してください。                                                                                  |

各 `dangerousFlags` エントリは次をサポートします。

| フィールド | 必須 | 型                                    | 意味                                                                                                                    |
| ---------- | ---- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `path`     | はい | `string`                              | `plugins.entries.<id>.config` からの相対ドット区切り設定パス。マップ/配列セグメントに対して `*` ワイルドカードをサポートします。 |
| `equals`   | はい | `string \| number \| boolean \| null` | この設定値を危険としてマークする完全一致リテラル。                                                                     |

`secretInputs` は次をサポートします。

| フィールド              | 必須 | 型         | 意味                                                                                                                                                                                                 |
| ----------------------- | ---- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | いいえ | `boolean`  | この SecretRef サーフェスがアクティブかどうかを判断するときに、バンドル済み Plugin のデフォルト有効化を上書きします。Plugin はバンドル済みだが、設定で明示的に有効化されるまでサーフェスを非アクティブのままにする必要がある場合に使用します。 |
| `paths`                 | はい | `object[]` | 秘密情報形式の設定パス。それぞれ `path`（ドット区切り、`plugins.entries.<id>.config` からの相対、`*` ワイルドカードをサポート）と任意の `expected`（現在は `"string"` のみ）を持ちます。              |

## mediaUnderstandingProviderMetadata リファレンス

メディア理解プロバイダーに、ランタイムがロードされる前に汎用コアヘルパーが必要とするデフォルトモデル、自動認証フォールバック優先度、またはネイティブドキュメントサポートがある場合は、`mediaUnderstandingProviderMetadata` を使用します。キーは `contracts.mediaUnderstandingProviders` でも宣言されている必要があります。

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

各プロバイダーエントリには次を含めることができます。

| フィールド           | 型                                                               | 意味                                                                                                          |
| ---------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | このプロバイダーが公開するメディア機能。                                                                       |
| `defaultModels`        | `Record<string, string>`                                         | config でモデルが指定されていない場合に使われる、機能からモデルへのデフォルト。                                |
| `autoPriority`         | `Record<string, number>`                                         | 数値が小さいほど、自動の認証情報ベースのプロバイダーフォールバックで先に並ぶ。                                  |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | プロバイダーがサポートするネイティブドキュメント入力。                                                         |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | ドキュメント種別ごとのモデル上書き。`image: false` を設定すると、そのドキュメント種別の画像ベース抽出を無効にする。 |

## channelConfigs リファレンス

チャネルPluginがランタイム読み込み前に低コストの config メタデータを必要とする場合は、`channelConfigs` を使用する。読み取り専用のチャネルセットアップ/ステータス検出は、セットアップエントリがない場合、または `setup.requiresRuntime: false` がセットアップランタイム不要を宣言している場合に、設定済みの外部チャネルに対してこのメタデータを直接使用できる。

`channelConfigs` は Plugin マニフェストメタデータであり、新しいトップレベルのユーザー config セクションではない。ユーザーは引き続き、チャネルインスタンスを `channels.<channel-id>` の下で設定する。OpenClaw は、Plugin ランタイムコードが実行される前に、マニフェストメタデータを読み取って、その設定済みチャネルをどの Plugin が所有するかを決定する。

チャネルPluginでは、`configSchema` と `channelConfigs` は異なるパスを表す。

- `configSchema` は `plugins.entries.<plugin-id>.config` を検証する
- `channelConfigs.<channel-id>.schema` は `channels.<channel-id>` を検証する

`channels[]` を宣言する非バンドルPluginは、対応する `channelConfigs` エントリも宣言するべきである。これがない場合でも OpenClaw は Plugin を読み込めるが、コールドパスの config スキーマ、セットアップ、Control UI サーフェスは、Plugin ランタイムが実行されるまでチャネル所有オプションの形を把握できない。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` と `nativeSkillsAutoEnabled` は、チャネルランタイム読み込み前に実行されるコマンド config チェック向けに、静的な `auto` デフォルトを宣言できる。バンドルチャネルは、パッケージ所有の他のチャネルカタログメタデータと並べて、`package.json#openclaw.channel.commands` から同じデフォルトを公開することもできる。

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

各チャネルエントリには次を含められる。

| フィールド    | 型                       | 意味                                                                                       |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | `channels.<id>` 用の JSON Schema。宣言された各チャネル config エントリに必須。             |
| `uiHints`     | `Record<string, object>` | そのチャネル config セクション向けの任意の UI ラベル/プレースホルダー/機密ヒント。         |
| `label`       | `string`                 | ランタイムメタデータが未準備のときに、ピッカーと inspect サーフェスへマージされるチャネルラベル。 |
| `description` | `string`                 | inspect とカタログサーフェス向けの短いチャネル説明。                                       |
| `commands`    | `object`                 | ランタイム前 config チェック向けの、静的なネイティブコマンドとネイティブスキルの自動デフォルト。 |
| `preferOver`  | `string[]`               | 選択サーフェスでこのチャネルが上回るべき、レガシーまたは低優先度の Plugin id。             |

### 別のチャネルPluginの置き換え

別の Plugin も提供できるチャネル id について、自分の Plugin が優先される所有者である場合は `preferOver` を使用する。一般的なケースは、名前変更された Plugin id、バンドルPluginを置き換えるスタンドアロンPlugin、または config 互換性のために同じチャネル id を維持するメンテナンス済みフォークである。

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

`channels.chat` が設定されている場合、OpenClaw はチャネル id と優先 Plugin id の両方を考慮する。低優先度の Plugin が、バンドルされている、またはデフォルトで有効になっているという理由だけで選択されていた場合、OpenClaw は有効なランタイム config 内でそれを無効化し、1つの Plugin がチャネルとそのツールを所有するようにする。明示的なユーザー選択は引き続き優先される。ユーザーが `plugins.allow` または実体のある `plugins.entries` config を通じて両方の Plugin を明示的に有効にした場合、OpenClaw はその選択を保持し、要求された Plugin セットを黙って変更する代わりに、重複するチャネル/ツールの診断を報告する。

`preferOver` は、実際に同じチャネルを提供できる Plugin id にスコープを限定する。これは汎用の優先度フィールドではなく、ユーザー config キーをリネームするものでもない。

## modelSupport リファレンス

Plugin ランタイムが読み込まれる前に、`gpt-5.5` や `claude-sonnet-4.6` のような短縮モデル id から OpenClaw にプロバイダーPluginを推論させたい場合は、`modelSupport` を使用する。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw は次の優先順位を適用する。

- 明示的な `provider/model` 参照は、所有する `providers` マニフェストメタデータを使用する
- `modelPatterns` は `modelPrefixes` より優先される
- 1つの非バンドルPluginと1つのバンドルPluginがどちらも一致する場合、非バンドルPluginが優先される
- 残る曖昧さは、ユーザーまたは config がプロバイダーを指定するまで無視される

フィールド:

| フィールド      | 型         | 意味                                                                 |
| --------------- | ---------- | -------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 短縮モデル id に対して `startsWith` で照合されるプレフィックス。     |
| `modelPatterns` | `string[]` | プロファイルサフィックス削除後の短縮モデル id に対して照合される Regex ソース。 |

`modelPatterns` エントリは `compileSafeRegex` を通じてコンパイルされ、ネストした繰り返しを含むパターン（例: `(a+)+$`）は拒否される。安全性チェックに失敗したパターンは、構文的に無効な regex と同様に黙ってスキップされる。パターンは単純に保ち、ネストした量指定子を避ける。

## modelCatalog リファレンス

Plugin ランタイムを読み込む前に OpenClaw がプロバイダーモデルメタデータを把握する必要がある場合は、`modelCatalog` を使用する。これは、固定カタログ行、プロバイダーエイリアス、抑制ルール、検出モードのマニフェスト所有ソースである。ランタイム更新は引き続きプロバイダーランタイムコードの責務だが、マニフェストはランタイムが必要になるタイミングをコアへ伝える。

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

| フィールド       | 型                                                       | 意味                                                                                                     |
| ---------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | この Plugin が所有するプロバイダー id のカタログ行。キーはトップレベルの `providers` にも現れるべき。    |
| `aliases`        | `Record<string, object>`                                 | カタログまたは抑制計画のために、所有プロバイダーへ解決されるべきプロバイダーエイリアス。                 |
| `suppressions`   | `object[]`                                               | プロバイダー固有の理由で、この Plugin が抑制する別ソース由来のモデル行。                                 |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | プロバイダーカタログをマニフェストメタデータから読めるか、キャッシュへ更新できるか、ランタイムを必要とするか。 |
| `runtimeAugment` | `boolean`                                                | プロバイダーランタイムが、マニフェスト/config 計画後にカタログ行を追加する必要がある場合にのみ `true` に設定する。 |

`aliases` は、モデルカタログ計画のプロバイダー所有権検索に参加する。エイリアスのターゲットは、同じ Plugin が所有するトップレベルプロバイダーでなければならない。プロバイダーでフィルターされたリストがエイリアスを使用する場合、OpenClaw は所有マニフェストを読み取り、プロバイダーランタイムを読み込まずにエイリアスの API/base URL 上書きを適用できる。エイリアスは、フィルターなしのカタログ一覧を展開しない。広範な一覧は、所有する正規プロバイダー行のみを出力する。

`suppressions` は、古いプロバイダーランタイム `suppressBuiltInModel` フックを置き換える。抑制エントリは、プロバイダーがその Plugin に所有されている場合、または所有プロバイダーをターゲットにする `modelCatalog.aliases` キーとして宣言されている場合にのみ尊重される。モデル解決中にランタイム抑制フックはもう呼び出されない。

プロバイダーフィールド:

| フィールド | 型                       | 意味                                                                       |
| --------- | ------------------------ | -------------------------------------------------------------------------- |
| `baseUrl` | `string`                 | このプロバイダーカタログ内のモデルに対する任意のデフォルト base URL。       |
| `api`     | `ModelApi`               | このプロバイダーカタログ内のモデルに対する任意のデフォルト API アダプター。 |
| `headers` | `Record<string, string>` | このプロバイダーカタログに適用される任意の静的ヘッダー。                   |
| `models`  | `object[]`               | 必須のモデル行。`id` のない行は無視される。                                |

モデルフィールド:

| フィールド       | 型                                                             | 意味                                                                                  |
| ------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `id`               | `string`                                                       | `provider/` プレフィックスなしの、プロバイダー内ローカルなモデル id。                 |
| `name`             | `string`                                                       | 任意の表示名。                                                                        |
| `api`              | `ModelApi`                                                     | 任意のモデル単位 API オーバーライド。                                                 |
| `baseUrl`          | `string`                                                       | 任意のモデル単位ベース URL オーバーライド。                                           |
| `headers`          | `Record<string, string>`                                       | 任意のモデル単位静的ヘッダー。                                                        |
| `input`            | `Array<"text" \| "image" \| "document">`                       | モデルが受け付けるモダリティ。他の値は静かに破棄されます。                           |
| `reasoning`        | `boolean`                                                      | モデルが reasoning 挙動を公開するかどうか。                                           |
| `contextWindow`    | `number`                                                       | ネイティブプロバイダーのコンテキストウィンドウ。                                      |
| `contextTokens`    | `number`                                                       | `contextWindow` と異なる場合の、任意の実効ランタイムコンテキスト上限。                |
| `maxTokens`        | `number`                                                       | 判明している場合の最大出力トークン数。                                                |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | 任意の thinking レベル単位モデル id またはパラメーターオーバーライド。                |
| `cost`             | `object`                                                       | 任意の 100 万トークンあたり USD 価格。任意の `tieredPricing` を含みます。             |
| `compat`           | `object`                                                       | OpenClaw モデル設定の互換性に一致する任意の互換性フラグ。                             |
| `mediaInput`       | `object`                                                       | 任意のモダリティ単位入力設定。現在は画像のみ。                                        |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 一覧表示ステータス。行をまったく表示してはならない場合にのみ抑制します。              |
| `statusReason`     | `string`                                                       | 利用可能でないステータスとともに表示される任意の理由。                                |
| `replaces`         | `string[]`                                                     | このモデルが置き換える、古いプロバイダー内ローカルなモデル id。                       |
| `replacedBy`       | `string`                                                       | 非推奨行の置き換え先となる、プロバイダー内ローカルなモデル id。                       |
| `tags`             | `string[]`                                                     | ピッカーとフィルターで使われる安定したタグ。                                          |

抑制フィールド:

| フィールド                 | 型         | 意味                                                                                                  |
| -------------------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | 抑制する upstream 行のプロバイダー id。この Plugin が所有しているか、所有 alias として宣言されている必要があります。 |
| `model`                    | `string`   | 抑制するプロバイダー内ローカルなモデル id。                                                           |
| `reason`                   | `string`   | 抑制された行が直接要求されたときに表示される任意のメッセージ。                                        |
| `when.baseUrlHosts`        | `string[]` | 抑制が適用される前に必要な、実効プロバイダーベース URL ホストの任意リスト。                            |
| `when.providerConfigApiIn` | `string[]` | 抑制が適用される前に必要な、プロバイダー設定 `api` の完全一致値の任意リスト。                          |

ランタイム専用データを `modelCatalog` に入れないでください。マニフェスト行が、プロバイダーでフィルターされた一覧とピッカー画面でレジストリ/ランタイム検出をスキップできるほど十分に完全な場合にのみ、`static` を使ってください。マニフェスト行が一覧表示可能な有用な seed または補足であり、後で refresh/cache によって行を追加できる場合は `refreshable` を使ってください。refreshable 行はそれ自体では authoritative ではありません。OpenClaw が一覧を知るためにプロバイダーランタイムを読み込む必要がある場合は `runtime` を使ってください。

## modelIdNormalization リファレンス

プロバイダーランタイムの読み込み前に行う必要がある、低コストなプロバイダー所有のモデル id クリーンアップには `modelIdNormalization` を使います。これにより、短いモデル名、プロバイダー内ローカルな legacy id、プロキシプレフィックス規則などの alias を、コアのモデル選択テーブルではなく所有 Plugin マニフェスト内に保持できます。

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

| フィールド                           | 型                      | 意味                                                                                          |
| ------------------------------------ | ----------------------- | --------------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | 大文字小文字を区別しない完全一致のモデル id alias。値は書かれたとおりに返されます。           |
| `stripPrefixes`                      | `string[]`              | alias ルックアップ前に削除するプレフィックス。legacy の provider/model 重複に有用です。        |
| `prefixWhenBare`                     | `string`                | 正規化後のモデル id に `/` がまだ含まれていない場合に追加するプレフィックス。                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | alias ルックアップ後の条件付き bare-id プレフィックス規則。`modelPrefix` と `prefix` でキー指定されます。 |

## providerEndpoints リファレンス

プロバイダーランタイムの読み込み前に汎用リクエストポリシーが知る必要があるエンドポイント分類には `providerEndpoints` を使います。各 `endpointClass` の意味は引き続きコアが所有し、ホストとベース URL メタデータは Plugin マニフェストが所有します。

正式に外部化されたプロバイダー Plugin はコア dist から除外されるため、
インストールされるまでマニフェストは見えません。それらの `providerEndpoints` は
`scripts/lib/official-external-provider-catalog.json` にもミラーして、Plugin なしでも
エンドポイント分類が機能し続けるようにする必要があります。契約テストが
このミラーを強制します。

エンドポイントフィールド:

| フィールド                     | 型         | 意味                                                                                              |
| ------------------------------ | ---------- | ------------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | `openrouter`、`moonshot-native`、`google-vertex` などの既知のコアエンドポイントクラス。            |
| `hosts`                        | `string[]` | エンドポイントクラスにマップされる完全一致ホスト名。                                              |
| `hostSuffixes`                 | `string[]` | エンドポイントクラスにマップされるホストサフィックス。ドメインサフィックス限定一致には `.` を付けます。 |
| `baseUrls`                     | `string[]` | エンドポイントクラスにマップされる、正規化済み HTTP(S) ベース URL の完全一致値。                   |
| `googleVertexRegion`           | `string`   | 完全一致のグローバルホストに対する静的 Google Vertex リージョン。                                 |
| `googleVertexRegionHostSuffix` | `string`   | Google Vertex リージョンプレフィックスを公開するために、一致ホストから削除するサフィックス。       |

## providerRequest リファレンス

プロバイダーランタイムを読み込まずに汎用リクエストポリシーが必要とする、低コストなリクエスト互換性メタデータには `providerRequest` を使います。挙動固有の payload 書き換えは、プロバイダーランタイム hook または共有プロバイダーファミリー helper に保持してください。

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

| フィールド          | 型           | 意味                                                                                     |
| --------------------- | ------------ | ---------------------------------------------------------------------------------------- |
| `family`              | `string`     | 汎用リクエスト互換性の判断と診断で使われるプロバイダーファミリーラベル。                 |
| `compatibilityFamily` | `"moonshot"` | 共有リクエスト helper 用の任意のプロバイダーファミリー互換性 bucket。                     |
| `openAICompletions`   | `object`     | OpenAI 互換 completions リクエストフラグ。現在は `supportsStreamingUsage`。               |

## secretProviderIntegrations リファレンス

Plugin が再利用可能な SecretRef exec プロバイダープリセットを公開できる場合は、`secretProviderIntegrations` を使います。OpenClaw は Plugin ランタイムの読み込み前にこのメタデータを読み取り、Plugin 所有権を `secrets.providers.<alias>.pluginIntegration` に保存し、実際のシークレット解決は SecretRef ランタイムに任せます。プリセットは、バンドル済み Plugin と、git や ClawHub インストールなどの管理対象 Plugin インストールルートから検出されたインストール済み Plugin に対してのみ公開されます。

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

マップキーは integration id です。`providerAlias` が省略された場合、OpenClaw は integration id を SecretRef プロバイダー alias として使います。プロバイダー alias は通常の SecretRef プロバイダー alias パターンに一致する必要があります。例: `team-secrets` または `onepassword-work`。

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

起動時/再読み込み時に、OpenClaw は現在の Plugin マニフェストメタデータを読み込み、所有 Plugin がインストール済みかつ active であることを確認し、マニフェストから exec コマンドを具体化して、そのプロバイダーを解決します。Plugin を無効化または削除すると、active な SecretRef に対してそのプロバイダーが取り消されます。スタンドアロンの exec 設定を必要とするオペレーターは、手動の `command`/`args` プロバイダーを直接書くこともできます。

現在サポートされているのは `source: "exec"` プリセットのみです。`command` は `${node}` である必要があり、`args[0]` は `./` から始まる Plugin ルート相対 resolver スクリプトである必要があります。OpenClaw は起動時/再読み込み時に、それを現在の Node 実行ファイルと Plugin 内スクリプトの絶対パスに具体化します。`--require`、`--import`、`--loader`、`--env-file`、`--eval`、`--print` などの Node オプションは、マニフェストプリセット契約の一部ではありません。Node 以外のコマンドが必要なオペレーターは、スタンドアロンの手動 exec プロバイダーを直接設定できます。

OpenClaw は、Plugin ルートからマニフェストプリセット用の `trustedDirs` を導出し、`${node}` プリセットでは現在の Node 実行ファイルディレクトリも使用します。マニフェストで作成された `trustedDirs` は無視されます。`timeoutMs`、`noOutputTimeoutMs`、`maxOutputBytes`、`jsonOnly`、`env`、`passEnv`、`allowInsecurePath` などのその他の exec プロバイダーオプションは、通常の SecretRef exec プロバイダー設定にそのまま渡されます。

## modelPricing リファレンス

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

| フィールド   | 型                | 意味                                                                                               |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | OpenRouter または LiteLLM の価格設定を決して取得すべきでないローカル/セルフホスト型プロバイダーには `false` を設定します。 |
| `openRouter` | `false \| object` | OpenRouter 価格検索のマッピングです。`false` は、このプロバイダーの OpenRouter 検索を無効にします。 |
| `liteLLM`    | `false \| object` | LiteLLM 価格検索のマッピングです。`false` は、このプロバイダーの LiteLLM 検索を無効にします。       |

ソースフィールド:

| フィールド                 | 型                 | 意味                                                                                                                   |
| -------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | OpenClaw プロバイダー ID と異なる場合の外部カタログプロバイダー ID です。たとえば `zai` プロバイダーに対する `z-ai` などです。 |
| `passthroughProviderModel` | `boolean`          | スラッシュを含むモデル ID をネストされたプロバイダー/モデル参照として扱います。OpenRouter などのプロキシプロバイダーに便利です。 |
| `modelIdTransforms`        | `"version-dots"[]` | 追加の外部カタログモデル ID バリアントです。`version-dots` は `claude-opus-4.6` のようなドット付きバージョン ID を試します。 |

### OpenClaw Provider Index

OpenClaw Provider Index は、Plugin がまだインストールされていない可能性があるプロバイダー向けの、OpenClaw 所有のプレビューメタデータです。これは Plugin マニフェストの一部ではありません。Plugin マニフェストは、引き続きインストール済み Plugin の権威です。Provider Index は、プロバイダー Plugin がインストールされていない場合に、将来のインストール可能プロバイダーとインストール前モデルピッカーのサーフェスが利用する内部フォールバック契約です。

カタログの権威順:

1. ユーザー設定。
2. インストール済み Plugin マニフェストの `modelCatalog`。
3. 明示的な更新によるモデルカタログキャッシュ。
4. OpenClaw Provider Index のプレビュー行。

Provider Index には、シークレット、有効状態、ランタイムフック、またはライブのアカウント固有モデルデータを含めてはなりません。そのプレビューカタログは、Plugin マニフェストと同じ `modelCatalog` プロバイダー行の形状を使用しますが、`api`、`baseUrl`、価格設定、互換性フラグなどのランタイムアダプターフィールドが、インストール済み Plugin マニフェストと意図的に整合されている場合を除き、安定した表示メタデータに限定するべきです。ライブの `/models` 検出を持つプロバイダーは、通常の一覧表示やオンボーディングでプロバイダー API を呼び出すのではなく、明示的なモデルカタログキャッシュ経路を通じて更新済み行を書き込むべきです。

Provider Index エントリは、Plugin がコア外へ移動した、またはその他の理由でまだインストールされていないプロバイダー向けに、インストール可能 Plugin メタデータを保持することもできます。このメタデータは、チャンネルカタログパターンを反映します。インストール可能なセットアップオプションを表示するには、パッケージ名、npm インストール仕様、期待される整合性、低コストな認証選択ラベルで十分です。Plugin がインストールされると、そのマニフェストが優先され、そのプロバイダーの Provider Index エントリは無視されます。

`openclaw doctor --fix` は、レガシーなトップレベルマニフェスト機能キーの小さな閉じた集合を `contracts.*` に移行します: `speechProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`tools`。これらのいずれも、またはその他の機能リストも、もはやトップレベルマニフェストフィールドとしては読み取られません。通常のマニフェスト読み込みでは、`contracts` の下にあるものだけが認識されます。

## マニフェストと package.json

2 つのファイルは異なる役割を担います:

| ファイル               | 用途                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | Plugin コードが実行される前に存在している必要がある、検出、設定検証、認証選択メタデータ、UI ヒント                         |
| `package.json`         | npm メタデータ、依存関係インストール、およびエントリポイント、インストールゲート、セットアップ、カタログメタデータに使われる `openclaw` ブロック |

メタデータをどこに置くべきか不明な場合は、次のルールを使用します:

- OpenClaw が Plugin コードを読み込む前に知る必要がある場合は、`openclaw.plugin.json` に置きます
- パッケージング、エントリファイル、または npm インストール動作に関するものなら、`package.json` に置きます

### 検出に影響する package.json フィールド

一部のランタイム前 Plugin メタデータは、意図的に `openclaw.plugin.json` ではなく、`package.json` の `openclaw` ブロック配下に置かれます。`openclaw.bundle` と `openclaw.bundle.json` は OpenClaw Plugin 契約ではありません。ネイティブ Plugin は、`openclaw.plugin.json` と、以下でサポートされる `package.json#openclaw` フィールドを使用する必要があります。

重要な例:

| フィールド                                                                                 | 意味                                                                                                                                               |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | ネイティブ Plugin エントリポイントを宣言します。Plugin パッケージディレクトリ内に留まる必要があります。                                          |
| `openclaw.runtimeExtensions`                                                               | インストール済みパッケージ向けのビルド済み JavaScript ランタイムエントリポイントを宣言します。Plugin パッケージディレクトリ内に留まる必要があります。 |
| `openclaw.setupEntry`                                                                      | オンボーディング、遅延チャンネル起動、読み取り専用チャンネルステータス/SecretRef 検出中に使用される軽量なセットアップ専用エントリポイントです。Plugin パッケージディレクトリ内に留まる必要があります。 |
| `openclaw.runtimeSetupEntry`                                                               | インストール済みパッケージ向けのビルド済み JavaScript セットアップエントリポイントを宣言します。`setupEntry` が必要で、存在している必要があり、Plugin パッケージディレクトリ内に留まる必要があります。 |
| `openclaw.channel`                                                                         | ラベル、ドキュメントパス、エイリアス、選択文言などの低コストなチャンネルカタログメタデータです。                                                |
| `openclaw.channel.commands`                                                                | チャンネルランタイムが読み込まれる前に、設定、監査、コマンド一覧サーフェスで使用される静的なネイティブコマンドおよびネイティブ skill 自動デフォルトメタデータです。 |
| `openclaw.channel.configuredState`                                                         | 「env のみのセットアップはすでに存在するか」に、完全なチャンネルランタイムを読み込まずに回答できる軽量な設定済み状態チェッカーメタデータです。 |
| `openclaw.channel.persistedAuthState`                                                      | 「すでにサインイン済みのものがあるか」に、完全なチャンネルランタイムを読み込まずに回答できる軽量な永続認証チェッカーメタデータです。           |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | バンドル済みおよび外部公開 Plugin 向けのインストール/更新ヒントです。                                                                             |
| `openclaw.install.defaultChoice`                                                           | 複数のインストール元が利用可能な場合の優先インストール経路です。                                                                                  |
| `openclaw.install.minHostVersion`                                                          | `>=2026.3.22` や `>=2026.5.1-beta.1` のような semver 下限を使用した、サポートされる最小 OpenClaw ホストバージョンです。                           |
| `openclaw.compat.pluginApi`                                                                | `>=2026.5.27` のような semver 下限を使用した、このパッケージが必要とする最小 OpenClaw Plugin API 範囲です。                                       |
| `openclaw.install.expectedIntegrity`                                                       | `sha512-...` などの期待される npm dist 整合性文字列です。インストールおよび更新フローは、取得したアーティファクトをこれと照合します。            |
| `openclaw.install.allowInvalidConfigRecovery`                                              | 設定が無効な場合に、限定的なバンドル済み Plugin 再インストール復旧経路を許可します。                                                             |
| `openclaw.install.requiredPlatformPackages`                                                | ロックファイルのプラットフォーム制約が現在のホストに一致する場合に実体化する必要がある npm パッケージエイリアスです。                           |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | セットアップランタイムのチャンネルサーフェスを listen 前に読み込めるようにし、その後、設定済みチャンネル Plugin の完全読み込みを listen 後のアクティベーションまで遅延します。 |

マニフェストメタデータは、ランタイム読み込み前のオンボーディングにどのプロバイダー/チャンネル/セットアップ選択肢が表示されるかを決定します。`package.json#openclaw.install` は、ユーザーがそれらの選択肢の 1 つを選んだときに、その Plugin を取得または有効化する方法をオンボーディングに伝えます。インストールヒントを `openclaw.plugin.json` に移動しないでください。

`openclaw.install.minHostVersion` は、非バンドル Plugin ソースのインストール時およびマニフェストレジストリ読み込み時に適用されます。無効な値は拒否されます。新しいが有効な値は、古いホスト上の外部 Plugin をスキップします。バンドル済みソース Plugin は、ホストチェックアウトと同じバージョンであると見なされます。

`openclaw.install.requiredPlatformPackages` は、任意のプラットフォーム固有エイリアスを通じて必要なネイティブバイナリを公開する npm パッケージ向けです。サポートされる各プラットフォームエイリアスについて、素の npm パッケージ名を列挙します。npm インストール中、OpenClaw は、ロックファイル制約が現在のホストに一致する宣言済みエイリアスのみを検証します。npm が成功を報告してもそのエイリアスを省略した場合、OpenClaw は新しいキャッシュで一度だけ再試行し、それでもエイリアスが欠けている場合はインストールをロールバックします。

`openclaw.compat.pluginApi` は、バンドルされていない Plugin ソースのパッケージインストール時に適用されます。パッケージのビルド対象になった OpenClaw Plugin SDK/runtime API の下限として使用してください。Plugin パッケージが新しい API を必要としつつ、他のフロー向けには低めのインストールヒントを維持する場合、`minHostVersion` より厳しくできます。公式 OpenClaw リリース同期では、既存の公式 Plugin API の下限はデフォルトで OpenClaw リリースバージョンに引き上げられますが、Plugin のみのリリースでは、パッケージが意図的に古いホストをサポートする場合に下限を低く保てます。パッケージバージョンだけを互換性コントラクトとして使用しないでください。`peerDependencies.openclaw` は npm パッケージメタデータのままです。OpenClaw はインストール互換性の判断に `openclaw.compat.pluginApi` コントラクトを使用します。

公式のオンデマンドインストールメタデータでは、Plugin が ClawHub で公開されている場合は `clawhubSpec` を使用してください。オンボーディングはそれを優先リモートソースとして扱い、インストール後に ClawHub アーティファクト情報を記録します。`npmSpec` は、まだ ClawHub に移行していないパッケージ向けの互換性フォールバックとして残ります。

正確な npm バージョン固定は、たとえば `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"` のように、すでに `npmSpec` に含まれます。公式外部カタログエントリでは、取得した npm アーティファクトが固定リリースと一致しなくなった場合に更新フローがフェイルクローズするよう、正確な spec と `expectedIntegrity` を組み合わせるべきです。対話型オンボーディングでは、互換性のために、裸のパッケージ名や dist-tag を含む信頼済みレジストリ npm spec も引き続き提示されます。カタログ診断では、正確、浮動、integrity 固定、integrity 欠落、パッケージ名不一致、無効なデフォルト選択ソースを区別できます。また、`expectedIntegrity` が存在するものの、それを固定できる有効な npm ソースがない場合にも警告します。`expectedIntegrity` が存在する場合、インストール/更新フローはそれを適用します。省略されている場合、レジストリ解決は integrity 固定なしで記録されます。

チャンネル Plugin は、完全な runtime を読み込まずに設定済みアカウントを識別する必要があるステータス、チャンネル一覧、または SecretRef スキャン向けに `openclaw.setupEntry` を提供するべきです。セットアップエントリは、チャンネルメタデータに加えて、セットアップ安全な config、ステータス、secrets アダプターを公開するべきです。ネットワーククライアント、Gateway リスナー、transport runtime はメインの拡張エントリポイントに保持してください。

runtime エントリポイントフィールドは、ソースエントリポイントフィールドに対するパッケージ境界チェックを上書きしません。たとえば、`openclaw.runtimeExtensions` によって、境界を抜ける `openclaw.extensions` パスを読み込み可能にはできません。

`openclaw.install.allowInvalidConfigRecovery` は意図的に範囲が狭くなっています。任意の壊れた config をインストール可能にするものではありません。現在は、バンドル済み Plugin パスの欠落や、同じバンドル済み Plugin に対する古い `channels.<id>` エントリなど、特定の古いバンドル済み Plugin アップグレード失敗からの復旧のみをインストールフローに許可します。無関係な config エラーは引き続きインストールをブロックし、operator を `openclaw doctor --fix` に誘導します。

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

セットアップ、doctor、ステータス、または読み取り専用の存在確認フローが、完全なチャンネル Plugin を読み込む前に安価な yes/no 認証プローブを必要とする場合に使用してください。永続化された認証状態は、設定済みチャンネル状態ではありません。このメタデータを使用して Plugin を自動有効化したり、runtime 依存関係を修復したり、チャンネル runtime を読み込むべきか判断したりしないでください。対象 export は、永続化された状態のみを読み取る小さな関数にするべきです。完全なチャンネル runtime barrel を経由させないでください。

`openclaw.channel.configuredState` は、安価な env のみの設定済みチェック向けに同じ形に従います。

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

チャンネルが env またはその他の小さな非 runtime 入力から設定済み状態を回答できる場合に使用してください。チェックに完全な config 解決や実際のチャンネル runtime が必要な場合は、そのロジックを Plugin の `config.hasConfiguredState` hook に保持してください。

## 検出の優先順位（重複する Plugin id）

OpenClaw は、次の順序でチェックされる 3 つのルートから Plugin を検出します。OpenClaw に同梱されるバンドル済み Plugin、グローバルインストールルート（`~/.openclaw/extensions`）、現在の workspace ルート（`<workspace>/.openclaw/extensions`）、さらに明示的な `plugins.load.paths` エントリです。

2 つの検出結果が同じ `id` を共有する場合、**最も優先度が高い** manifest のみが保持されます。優先度の低い重複は、横並びで読み込まれるのではなく破棄されます。優先順位は高いものから低いものへ次のとおりです。

1. **Config で選択済み** — `plugins.entries.<id>` で明示的に固定されたパス
2. **追跡済みインストールレコードに一致するグローバルインストール** — `openclaw plugin install`/`openclaw plugin update` によってインストールされ、その同じ id について OpenClaw のインストール追跡が認識している Plugin。id がバンドル済み Plugin にも属している場合も含みます
3. **バンドル済み** — OpenClaw に同梱される Plugin
4. **Workspace** — 現在の workspace を基準に検出される Plugin
5. その他の検出候補

影響:

- workspace またはグローバルルートに未追跡で置かれた、バンドル済み Plugin の fork や古いコピーは、バンドル済みビルドをシャドーしません。
- バンドル済み Plugin を上書きするには、その id に対して `openclaw plugin install` を実行して、追跡済みグローバルインストールがバンドル済みコピーより優先されるようにするか、`plugins.entries.<id>` 経由で特定のパスを固定して、config 選択済みの優先順位で勝たせてください。
- 重複の破棄はログに記録されるため、Doctor と起動診断は破棄されたコピーを指し示せます。
- Config で選択された重複上書きは、診断では明示的な上書きとして表現されますが、古い fork や意図しないシャドーが見えるように警告も継続します。

## JSON Schema 要件

- **すべての Plugin は JSON Schema を同梱する必要があります**。config を受け付けない場合でも同様です。
- 空の schema は許容されます（たとえば `{ "type": "object", "additionalProperties": false }`）。
- Schema は runtime ではなく、config の読み書き時に検証されます。
- 新しい config key でバンドル済み Plugin を拡張または fork する場合は、その Plugin の `openclaw.plugin.json` の `configSchema` も同時に更新してください。バンドル済み Plugin schema は strict であるため、`myNewKey` を `configSchema.properties` に追加せずに、ユーザー config に `plugins.entries.<id>.config.myNewKey` を追加すると、Plugin runtime が読み込まれる前に拒否されます。

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

## 検証の動作

- 未知の `channels.*` key は、チャンネル id が Plugin manifest によって宣言されていない限り **エラー** です。同じ id が `plugins.allow`、`plugins.entries`、または `plugins.installs`（参照されているものの現在は検出できない Plugin）にも現れる場合、OpenClaw はこれを代わりに **警告** に格下げします。
- 未知の Plugin id を参照する `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` は、エラーではなく **警告**（「古い config エントリを無視」）です。そのため、アップグレードや削除/リネームされた Plugin が Gateway 起動をブロックすることはありません。
- 未知の Plugin id を参照する `plugins.slots.memory` は **エラー** です。ただし、既知の `memory-lancedb` 公式外部 Plugin は例外で、代わりに警告します。
- Plugin がインストールされているものの、manifest または schema が壊れているか欠落している場合、検証は失敗し、Doctor が Plugin エラーを報告します。
- Plugin config が存在するが Plugin が **無効** な場合、config は保持され、Doctor とログに **警告** が表示されます。

完全な `plugins.*` schema については、[設定リファレンス](/ja-JP/gateway/configuration) を参照してください。

## 注記

- manifest は、ローカルファイルシステム読み込みを含む **ネイティブ OpenClaw Plugin に必須** です。runtime は Plugin モジュールを別途読み込みます。manifest は検出と検証のためだけに使用されます。
- ネイティブ manifest は JSON5 で解析されるため、最終的な値が object である限り、コメント、末尾カンマ、引用符なし key が受け付けられます。
- 文書化された manifest フィールドのみが manifest loader によって読み取られます。カスタムのトップレベル key は避けてください。
- Plugin が必要としない場合、`channels`、`providers`、`cliBackends`、`skills` はすべて省略できます。
- `providerCatalogEntry` は軽量なままにする必要があり、広範な runtime code を import するべきではありません。リクエスト時の実行ではなく、静的な provider catalog metadata または限定的な discovery descriptor に使用してください。
- 排他的な Plugin 種別は `plugins.slots.*` を通じて選択されます。`plugins.slots.memory` 経由の `kind: "memory"`（デフォルト `memory-core`）、`plugins.slots.contextEngine` 経由の `kind: "context-engine"`（デフォルト `legacy`）です。
- 排他的な Plugin 種別はこの manifest で宣言してください。runtime entry の `OpenClawPluginDefinition.kind` は非推奨であり、古い Plugin 向けの互換性フォールバックとしてのみ残っています。
- Env-var メタデータ（`setup.providers[].envVars`、非推奨の `providerAuthEnvVars`、および `channelEnvVars`）は宣言専用です。ステータス、監査、cron 配信検証、その他の読み取り専用 surface は、env var を設定済みとして扱う前に、引き続き Plugin の信頼性と有効な有効化ポリシーを適用します。
- provider code を必要とする runtime ウィザードメタデータについては、[Provider runtime hooks](/ja-JP/plugins/architecture-internals#provider-runtime-hooks) を参照してください。
- Plugin が native module に依存する場合は、ビルド手順と package manager の allowlist 要件（たとえば pnpm `allow-build-scripts` + `pnpm rebuild <package>`）を文書化してください。

## 関連

<CardGroup cols={3}>
  <Card title="Building plugins" href="/ja-JP/plugins/building-plugins" icon="rocket">
    Plugin のはじめに。
  </Card>
  <Card title="Plugin architecture" href="/ja-JP/plugins/architecture" icon="diagram-project">
    内部アーキテクチャと capability model。
  </Card>
  <Card title="SDK overview" href="/ja-JP/plugins/sdk-overview" icon="book">
    Plugin SDK リファレンスと subpath import。
  </Card>
</CardGroup>

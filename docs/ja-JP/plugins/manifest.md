---
read_when:
    - OpenClaw Pluginを構築しています
    - Plugin の設定スキーマをリリースする、または Plugin の検証エラーをデバッグする必要がある
summary: Plugin マニフェスト + JSON スキーマの要件（厳格な設定検証）
title: Pluginマニフェスト
x-i18n:
    generated_at: "2026-07-16T12:01:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4a858e0bba9ee47dd7ce96413f744818d721420549a0c9af82b72a5572e758c7
    source_path: plugins/manifest.md
    workflow: 16
---

このページでは、**OpenClaw ネイティブ Plugin マニフェスト**である `openclaw.plugin.json` について説明します。互換バンドルのレイアウト（Codex、Claude、Cursor）については、[Plugin バンドル](/ja-JP/plugins/bundles)を参照してください。

互換バンドル形式では、代わりに独自のマニフェストファイルを使用します。

- Codex バンドル：`.codex-plugin/plugin.json`
- Claude バンドル：`.claude-plugin/plugin.json`、またはマニフェストのないデフォルトの Claude コンポーネントレイアウト
- Cursor バンドル：`.cursor-plugin/plugin.json`

OpenClaw はこれらのレイアウトを自動検出しますが、以下の `openclaw.plugin.json` スキーマに対する検証は行いません。互換バンドルでは、レイアウトが OpenClaw のランタイム要件に一致する場合、OpenClaw はバンドルのメタデータ、宣言された Skills ルート、Claude コマンドルート、Claude の `settings.json` デフォルト、Claude LSP のデフォルト、およびサポートされているフックパックを読み取ります。

すべての OpenClaw ネイティブ Plugin は、**Plugin ルート**に `openclaw.plugin.json` を**必ず**含める必要があります。OpenClaw はこれを読み取り、**Plugin コードを実行せずに**設定を検証します。マニフェストがないか無効な場合、設定の検証はブロックされ、Plugin エラーとして扱われます。

Plugin システムの完全なガイドについては[Plugin](/ja-JP/tools/plugin)を、ネイティブ機能モデルと現在の外部互換性に関するガイダンスについては[機能モデル](/ja-JP/plugins/architecture#public-capability-model)を参照してください。

## このファイルの役割

`openclaw.plugin.json` は、OpenClaw が**Plugin コードを読み込む前に**読み取るメタデータです。含まれるすべての情報は、Plugin ランタイムを起動せずに確認できる程度に軽量でなければなりません。

**次の用途に使用します：**

- Plugin の識別情報、設定の検証、設定 UI のヒント
- 認証、オンボーディング、セットアップのメタデータ（エイリアス、自動有効化、プロバイダー環境変数、認証の選択肢）
- コントロールプレーンの各サーフェス向けの有効化ヒント
- モデルファミリーの短縮表記に対する所有権
- 静的な機能所有権のスナップショット（`contracts`）
- 共有 `openclaw qa` ホストが確認できる QA ランナーのメタデータ
- カタログおよび検証サーフェスにマージされるチャネル固有の設定メタデータ

**次の用途には使用しないでください：**ランタイム動作の登録、コードエントリポイントの宣言、npm インストールメタデータ。これらは Plugin コードと `package.json` に属します。

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

| フィールド                                | 必須 | 型                         | 意味                                                                                                                                                                                                                                                              |
| ------------------------------------ | -------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | はい      | `string`                     | 正規のPlugin ID。`plugins.entries.<id>` で使用される ID です。                                                                                                                                                                                                        |
| `configSchema`                       | はい      | `object`                     | このPluginの設定に対するインライン JSON Schema。                                                                                                                                                                                                                               |
| `requiresPlugins`                    | いいえ       | `string[]`                   | このPluginを機能させるために、併せてインストールする必要があるPlugin ID。必須のPluginが不足していても、検出処理はPluginを読み込み可能な状態に保ちますが、警告を表示します。                                                                                                               |
| `enabledByDefault`                   | いいえ       | `true`                       | バンドルされたPluginをデフォルトで有効としてマークします。Pluginをデフォルトで無効のままにするには、省略するか、`true` 以外の値を設定します。                                                                                                                                               |
| `enabledByDefaultOnPlatforms`        | いいえ       | `string[]`                   | バンドルされたPluginを、列挙された Node.js プラットフォーム（例: `["darwin"]`）でのみデフォルトで有効としてマークします。明示的な設定が常に優先されます。                                                                                                                                   |
| `legacyPluginIds`                    | いいえ       | `string[]`                   | この正規のPlugin IDに正規化されるレガシー ID。                                                                                                                                                                                                                     |
| `autoEnableWhenConfiguredProviders`  | いいえ       | `string[]`                   | 認証、設定、またはモデル参照で言及された場合に、このPluginを自動的に有効にするプロバイダー ID。                                                                                                                                                                            |
| `kind`                               | いいえ       | `PluginKind \| PluginKind[]` | `plugins.slots.*` で使用される、1つ以上の排他的なPlugin種別（`"memory"`、`"context-engine"`）を宣言します。両方のスロットを所有するPluginは、両方の種別を1つの配列で宣言します。                                                                                                    |
| `channels`                           | いいえ       | `string[]`                   | このPluginが所有するチャンネル ID。検出と設定の検証に使用されます。                                                                                                                                                                                                |
| `providers`                          | いいえ       | `string[]`                   | このPluginが所有するプロバイダー ID。                                                                                                                                                                                                                                         |
| `providerCatalogEntry`               | いいえ       | `string`                     | Pluginルートからの相対パスで指定する軽量なプロバイダーカタログモジュールのパス。Pluginランタイム全体を有効化せずに読み込める、マニフェストスコープのプロバイダーカタログメタデータに使用します。                                                                                        |
| `modelSupport`                       | いいえ       | `object`                     | ランタイムより前にPluginを自動読み込みするために使用される、マニフェスト所有のモデルファミリー短縮メタデータ。                                                                                                                                                                                |
| `modelCatalog`                       | いいえ       | `object`                     | このPluginが所有するプロバイダー向けの宣言的なモデルカタログメタデータ。Pluginランタイムを読み込まずに、将来の読み取り専用一覧表示、オンボーディング、モデル選択、エイリアス、抑制を行うためのコントロールプレーン契約です。                                                |
| `modelPricing`                       | いいえ       | `object`                     | プロバイダー所有の外部料金検索ポリシー。ローカル／セルフホスト型プロバイダーをリモート料金カタログの対象外にしたり、コアにプロバイダー ID をハードコードせずにプロバイダー参照を OpenRouter/LiteLLM カタログ ID にマッピングしたりするために使用します。                                                    |
| `modelIdNormalization`               | いいえ       | `object`                     | プロバイダーランタイムの読み込み前に実行する必要がある、プロバイダー所有のモデル ID エイリアス／プレフィックス整理処理。                                                                                                                                                                                  |
| `providerEndpoints`                  | いいえ       | `object[]`                   | プロバイダーランタイムの読み込み前にコアが分類する必要があるプロバイダールート向けの、マニフェスト所有のエンドポイントホスト／baseUrl メタデータ。                                                                                                                                                   |
| `providerRequest`                    | いいえ       | `object`                     | プロバイダーランタイムの読み込み前に、汎用リクエストポリシーが使用する軽量なプロバイダーファミリーおよびリクエスト互換性メタデータ。                                                                                                                                                     |
| `secretProviderIntegrations`         | いいえ       | `Record<string, object>`     | セットアップまたはインストール画面が、プロバイダー固有の連携をコアにハードコードせずに提供できる、宣言的な SecretRef exec プロバイダープリセット。                                                                                                                            |
| `cliBackends`                        | いいえ       | `string[]`                   | このPluginが所有する CLI 推論バックエンド ID。明示的な設定参照に基づく起動時の自動有効化に使用されます。                                                                                                                                                                |
| `syntheticAuthRefs`                  | いいえ       | `string[]`                   | ランタイムの読み込み前に行うコールドモデル検出中に、Plugin所有の合成認証フックをプローブする必要があるプロバイダーまたは CLI バックエンド参照。                                                                                                                                     |
| `nonSecretAuthMarkers`               | いいえ       | `string[]`                   | シークレットではないローカル、OAuth、またはアンビエント認証情報の状態を表す、バンドルPlugin所有のプレースホルダー API キー値。                                                                                                                                                       |
| `commandAliases`                     | いいえ       | `object[]`                   | このPluginが所有し、ランタイムの読み込み前にPlugin対応の設定および CLI 診断を生成する必要があるコマンド名。                                                                                                                                                       |
| `providerAuthEnvVars`                | いいえ       | `Record<string, string[]>`   | プロバイダーの認証／ステータス検索向けの非推奨の互換環境変数メタデータ。新しいPluginでは `setup.providers[].envVars` を優先してください。OpenClawは非推奨期間中、引き続きこれを読み取ります。                                                                                        |
| `providerUsageAuthEnvVars`           | いいえ       | `Record<string, string[]>`   | 使用量／請求専用のプロバイダー認証情報。OpenClawはこれらの名前を使用量検出とシークレット除去に使用しますが、推論認証には決して使用しません。                                                                                                                                  |
| `providerAuthAliases`                | いいえ       | `Record<string, string>`     | 認証検索で別のプロバイダー ID を再利用する必要があるプロバイダー ID。たとえば、基盤プロバイダーの API キーと認証プロファイルを共有するコーディングプロバイダーです。                                                                                                                 |
| `channelEnvVars`                     | いいえ       | `Record<string, string[]>`   | Pluginコードを読み込まずに OpenClaw が検査できる軽量なチャンネル環境変数メタデータ。汎用の起動／設定ヘルパーに認識させる必要がある、環境変数駆動のチャンネルセットアップまたは認証画面に使用します。                                                                                   |
| `providerAuthChoices`                | いいえ       | `object[]`                   | オンボーディングの選択画面、優先プロバイダーの解決、単純な CLI フラグ接続に使用する軽量な認証選択メタデータ。                                                                                                                                                              |
| `activation`                         | いいえ       | `object`                     | 起動、プロバイダー、コマンド、チャンネル、ルート、およびケイパビリティをトリガーとする読み込み向けの軽量な有効化プランナーメタデータ。これはメタデータのみであり、実際の動作は引き続きPluginランタイムが所有します。                                                                                              |
| `setup`                              | いいえ       | `object`                     | 検出およびセットアップ画面がPluginランタイムを読み込まずに検査できる、軽量なセットアップ／オンボーディング記述子。                                                                                                                                                           |
| `qaRunners`                          | いいえ       | `object[]`                   | Pluginランタイムの読み込み前に、共有 `openclaw qa` ホストが使用する軽量な QA ランナー記述子。                                                                                                                                                                             |
| `contracts`                          | いいえ       | `object`                     | 外部認証フック、埋め込み、音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像／動画／音楽生成、Web取得、Web検索、ワーカープロバイダー、ドキュメント／Webコンテンツ抽出、およびツール所有権に関する静的なケイパビリティ所有権スナップショット。 |
| `configContracts`                    | いいえ       | `object`                     | 汎用コアヘルパーが使用する、マニフェスト所有の設定動作：危険なフラグの検出、SecretRef の移行先、レガシー設定パスの絞り込み。[configContracts リファレンス](#configcontracts-reference)を参照してください。                                                     |
| `mediaUnderstandingProviderMetadata` | いいえ       | `Record<string, object>`     | `contracts.mediaUnderstandingProviders` で宣言されたプロバイダー ID 向けの、低コストなメディア理解のデフォルト。                                                                                                                                                                   |
| `imageGenerationProviderMetadata`    | いいえ       | `Record<string, object>`     | `contracts.imageGenerationProviders` で宣言されたプロバイダー ID 向けの、低コストな画像生成認証メタデータ。プロバイダー所有の認証エイリアスとベース URL ガードを含みます。                                                                                                         |
| `videoGenerationProviderMetadata`    | いいえ       | `Record<string, object>`     | `contracts.videoGenerationProviders` で宣言されたプロバイダー ID 向けの、低コストな動画生成認証メタデータ。プロバイダー所有の認証エイリアスとベース URL ガードを含みます。                                                                                                         |
| `musicGenerationProviderMetadata`    | いいえ       | `Record<string, object>`     | `contracts.musicGenerationProviders` で宣言されたプロバイダー ID 向けの、低コストな音楽生成認証メタデータ。プロバイダー所有の認証エイリアスとベース URL ガードを含みます。                                                                                                         |
| `toolMetadata`                       | いいえ       | `Record<string, object>`     | `contracts.tools` で宣言された、Plugin 所有ツール向けの低コストな可用性メタデータ。設定、環境変数、または認証の根拠が存在しない限りツールがランタイムを読み込まないようにする場合に使用します。                                                                                                  |
| `channelConfigs`                     | いいえ       | `Record<string, object>`     | ランタイムの読み込み前に、検出および検証サーフェスへマージされる、マニフェスト所有のチャンネル設定メタデータ。                                                                                                                                                                 |
| `skills`                             | いいえ       | `string[]`                   | Plugin ルートからの相対パスで指定する、読み込む Skills ディレクトリ。                                                                                                                                                                                                                    |
| `name`                               | いいえ       | `string`                     | 人が読み取れる Plugin 名。                                                                                                                                                                                                                                                |
| `description`                        | いいえ       | `string`                     | Plugin サーフェスに表示される短い概要。                                                                                                                                                                                                                                    |
| `catalog`                            | いいえ       | `object`                     | Plugin カタログサーフェス向けの、任意の表示ヒント。このメタデータによって Plugin がインストール、有効化、または信頼の付与を受けることはありません。                                                                                                                                               |
| `icon`                               | いいえ       | `string`                     | マーケットプレイス／カタログカード向けの HTTPS 画像 URL。ClawHub は有効な `https://` URL をすべて受け入れ、これが省略されているか無効な場合はデフォルトの Plugin アイコンを使用します。                                                                                                         |
| `version`                            | いいえ       | `string`                     | 情報提供用の Plugin バージョン。                                                                                                                                                                                                                                              |
| `uiHints`                            | いいえ       | `Record<string, object>`     | 設定フィールド向けの UI ラベル、プレースホルダー、機密性のヒント。                                                                                                                                                                                                          |

## カタログリファレンス

`catalog` は、Plugin ブラウザーにオプションの表示ヒントを提供します。ホストはこれらのヒントを無視できます。これらによって Plugin がインストールまたは有効化されることはなく、ランタイムの動作や信頼レベルが変更されることもありません。

```json
{
  "catalog": {
    "featured": true,
    "order": 10
  }
}
```

| フィールド      | 型      | 意味                                                              |
| ---------- | --------- | -------------------------------------------------------------------------- |
| `featured` | `boolean` | カタログ画面でこの Plugin を目立たせるかどうか。                       |
| `order`    | `number`  | 選定された Plugin 間の昇順表示ヒント。値が小さいほど先に表示されます。 |

## 生成プロバイダーのメタデータリファレンス

生成プロバイダーのメタデータフィールドは、対応する `contracts.*GenerationProviders` リストで宣言されたプロバイダーの静的な認証シグナルを記述します。OpenClaw はプロバイダーのランタイムが読み込まれる前にこれらのフィールドを読み取るため、コアツールはすべてのプロバイダー Plugin をインポートせずに、生成プロバイダーが利用可能かどうかを判断できます。

これらのフィールドは、低コストで宣言的な情報にのみ使用してください。トランスポート、リクエスト変換、トークンの更新、認証情報の検証、実際の生成動作は Plugin のランタイムに残します。

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

各メタデータエントリでサポートされるフィールドは次のとおりです。

| フィールド                  | 必須 | 型       | 意味                                                                                                                                       |
| ---------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | いいえ       | `string[]` | 生成プロバイダーの静的な認証エイリアスとして扱う追加のプロバイダー ID。                                                       |
| `authProviders`        | いいえ       | `string[]` | 設定済みの認証プロファイルを、この生成プロバイダーの認証として扱うプロバイダー ID。                                                      |
| `configSignals`        | いいえ       | `object[]` | 認証プロファイルや環境変数なしで設定できるローカルまたはセルフホスト型プロバイダー向けの、低コストで設定のみに基づく利用可能性シグナル。                 |
| `authSignals`          | いいえ       | `object[]` | 明示的な認証シグナル。指定されている場合、プロバイダー ID、`aliases`、`authProviders` から生成されるデフォルトのシグナルセットを置き換えます。                     |
| `referenceAudioInputs` | いいえ       | `boolean`  | 動画生成専用。プロバイダーが参照オーディオアセットを受け付ける場合は `true` に設定します。それ以外の場合、`video_generate` によってオーディオ参照パラメーターが非表示になります。 |

各 `configSignals` エントリでサポートされるフィールドは次のとおりです。

| フィールド            | 必須 | 型       | 意味                                                                                                                                                                             |
| ---------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | はい      | `string`   | 検査する Plugin 所有の設定オブジェクトへのドットパス（例：`plugins.entries.example.config`）。                                                                                      |
| `overlayPath`    | いいえ       | `string`   | シグナルを評価する前に、ルートオブジェクトへ重ね合わせるオブジェクトを示す、ルート設定内のドットパス。`image`、`video`、`music` など、機能固有の設定に使用します。   |
| `overlayMapPath` | いいえ       | `string`   | 各オブジェクト値をルートオブジェクトへ重ね合わせる、ルート設定内のドットパス。`accounts` のような名前付きアカウントマップに使用し、設定済みのいずれかのアカウントが条件を満たせるようにします。 |
| `required`       | いいえ       | `string[]` | 有効な設定内で、設定済みの値を持つ必要があるドットパス。文字列は空であってはならず、オブジェクトと配列も空であってはなりません。                                                  |
| `requiredAny`    | いいえ       | `string[]` | 有効な設定内で、少なくとも 1 つが設定済みの値を持つ必要があるドットパス。                                                                                                    |
| `mode`           | いいえ       | `object`   | 有効な設定内のオプションの文字列モードガード。設定のみに基づく利用可能性が 1 つのモードにのみ適用される場合に使用します。                                                                  |

各 `mode` ガードでサポートされるフィールドは次のとおりです。

| フィールド        | 必須 | 型       | 意味                                                                      |
| ------------ | -------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | いいえ       | `string`   | 有効な設定内のドットパス。デフォルトは `mode` です。                          |
| `default`    | いいえ       | `string`   | 設定でパスが省略されている場合に使用するモード値。                                  |
| `allowed`    | いいえ       | `string[]` | 指定されている場合、有効なモードがこれらの値のいずれかである場合にのみシグナルが通過します。 |
| `disallowed` | いいえ       | `string[]` | 指定されている場合、有効なモードがこれらの値のいずれかであるとシグナルが失敗します。       |

各 `authSignals` エントリでサポートされるフィールドは次のとおりです。

| フィールド             | 必須 | 型     | 意味                                                                                                                                                                 |
| ----------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | はい      | `string` | 設定済みの認証プロファイルで確認するプロバイダー ID。                                                                                                                             |
| `providerBaseUrl` | いいえ       | `object` | 参照先の設定済みプロバイダーが許可されたベース URL を使用している場合にのみ、シグナルを有効として扱うオプションのガード。認証エイリアスが特定の API に対してのみ有効な場合に使用します。 |

各 `providerBaseUrl` ガードでサポートされるフィールドは次のとおりです。

| フィールド             | 必須 | 型       | 意味                                                                                                                                        |
| ----------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | はい      | `string`   | `baseUrl` を確認するプロバイダー設定 ID。                                                                                                |
| `defaultBaseUrl`  | いいえ       | `string`   | プロバイダー設定で `baseUrl` が省略されている場合に使用するベース URL。                                                                                         |
| `allowedBaseUrls` | はい      | `string[]` | この認証シグナルに許可されるベース URL。設定済みまたはデフォルトのベース URL が、正規化されたこれらの値のいずれにも一致しない場合、シグナルは無視されます。 |

## ツールメタデータリファレンス

`toolMetadata` は、生成プロバイダーのメタデータと同じ `configSignals` および `authSignals` の形式を、ツール名をキーとして使用します。`contracts.tools` は所有権を宣言します。`toolMetadata` は低コストの利用可能性エビデンスを宣言するため、OpenClaw はツールファクトリーから `null` が返されることを確認するためだけに、Plugin のランタイムをインポートせずに済みます。

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

`toolMetadata` エントリでは、上記の共通 `configSignals`/`authSignals` フィールドに加えて、`optional`（Plugin の有効化にツールが必須でないことを示す）と `replaySafe`（不完全なモデルターンの後でもツール実行を安全に繰り返せることを示す）も使用できます。

ツールに `toolMetadata` がない場合、OpenClaw は既存の動作を維持し、ツールコントラクトがポリシーに一致すると所有元の Plugin を読み込みます。ファクトリーが認証や設定に依存するホットパスのツールでは、Plugin の作成者は、確認のためにコアからランタイムをインポートさせるのではなく、`toolMetadata` を宣言する必要があります。

## providerAuthChoices リファレンス

各 `providerAuthChoices` エントリは、オンボーディングまたは認証の選択肢を 1 つ記述します。OpenClaw はプロバイダーのランタイムが読み込まれる前にこれを読み取ります。プロバイダー設定リストでは、プロバイダーのランタイムを読み込まずに、これらのマニフェストの選択肢、ディスクリプターから派生した設定の選択肢、インストールカタログのメタデータを使用します。

| フィールド                 | 必須 | 型                                                                  | 意味                                                                                             |
| --------------------- | -------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | はい      | `string`                                                              | この選択肢が属するプロバイダー ID。                                                                       |
| `method`              | はい      | `string`                                                              | 処理を委譲する認証メソッド ID。                                                                            |
| `choiceId`            | はい      | `string`                                                              | オンボーディングおよび CLI フローで使用される安定した認証選択肢 ID。                                                   |
| `choiceLabel`         | いいえ       | `string`                                                              | ユーザー向けラベル。省略した場合、OpenClaw は `choiceId` にフォールバックします。                                         |
| `choiceHint`          | いいえ       | `string`                                                              | 選択画面用の短い補助テキスト。                                                                         |
| `assistantPriority`   | いいえ       | `number`                                                              | アシスタント主導の対話型選択画面では、値が小さいほど先に並びます。                                        |
| `assistantVisibility` | いいえ       | `"visible"` \| `"manual-only"`                                        | 手動での CLI 選択は許可したまま、アシスタントの選択画面ではこの選択肢を非表示にします。                         |
| `deprecatedChoiceIds` | いいえ       | `string[]`                                                            | ユーザーをこの代替選択肢へリダイレクトする必要がある、レガシーな選択肢 ID。                                  |
| `groupId`             | いいえ       | `string`                                                              | 関連する選択肢をグループ化するためのオプションのグループ ID。                                                           |
| `groupLabel`          | いいえ       | `string`                                                              | そのグループのユーザー向けラベル。                                                                         |
| `groupHint`           | いいえ       | `string`                                                              | グループ用の短い補助テキスト。                                                                          |
| `onboardingFeatured`  | いいえ       | `boolean`                                                             | 対話型オンボーディング選択画面の注目階層で、「More...」項目より前にこのグループを表示します。 |
| `optionKey`           | いいえ       | `string`                                                              | 単一フラグによる簡単な認証フロー用の内部オプションキー。                                                       |
| `cliFlag`             | いいえ       | `string`                                                              | `--openrouter-api-key` などの CLI フラグ名。                                                            |
| `cliOption`           | いいえ       | `string`                                                              | `--openrouter-api-key <key>` などの完全な CLI オプション形式。                                              |
| `cliDescription`      | いいえ       | `string`                                                              | CLI ヘルプで使用される説明。                                                                             |
| `appGuidedSecret`     | いいえ       | `boolean`                                                             | 貼り付けられた 1 つのシークレットとプロバイダーのデフォルト値だけで、アプリのガイドに従ったセットアップに十分です。                              |
| `appGuidedDiscovery`  | いいえ       | `boolean`                                                             | 対応するランタイム認証メソッドが、`appGuidedSetup` を介した読み取り専用のローカル検出を所有します。                 |
| `appGuidedAuth`       | いいえ       | `"oauth"` \| `"device-code"`                                          | ネイティブのセットアップクライアントが汎用的にレンダリングできる、プロバイダー所有の対話型ログイン。                        |
| `onboardingScopes`    | いいえ       | `Array<"text-inference" \| "image-generation" \| "music-generation">` | この選択肢を表示するオンボーディング画面。省略した場合、デフォルトは `["text-inference"]` です。  |

`appGuidedDiscovery` が true の場合、対応するプロバイダー認証メソッドは
`appGuidedSetup.detect` と `appGuidedSetup.prepare` を公開する必要があります。検出は
読み取り専用でなければなりません。ログイン、モデルのプル、ダウンロード、設定の書き込みは行いません。準備処理では、
選択された正確なモデルを再確認し、設定案を返します。OpenClaw はその
案を分離環境でライブテストし、成功した場合にのみコミットします。

## commandAliases リファレンス

Plugin が、ユーザーが誤って `plugins.allow` に記述したり、ルート CLI コマンドとして実行しようとしたりする可能性のあるランタイムコマンド名を所有する場合は、`commandAliases` を使用します。OpenClaw は、Plugin のランタイムコードをインポートせずに診断するため、このメタデータを使用します。

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

| フィールド        | 必須 | 型              | 意味                                                           |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | はい      | `string`          | この Plugin に属するコマンド名。                               |
| `kind`       | いいえ       | `"runtime-slash"` | エイリアスがルート CLI コマンドではなく、チャットのスラッシュコマンドであることを示します。 |
| `cliCommand` | いいえ       | `string`          | 存在する場合、CLI 操作用に提案する関連ルート CLI コマンド。  |

## activation リファレンス

Plugin が、どのコントロールプレーンイベントで自身をアクティベーション／ロード計画に含めるべきかを低コストで宣言できる場合は、`activation` を使用します。

このブロックはプランナーのメタデータであり、ライフサイクル API ではありません。ランタイム動作を登録せず、`register(...)` を置き換えず、Plugin コードがすでに実行されたことも保証しません。アクティベーションプランナーは、`providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools`、フックなど、既存のマニフェスト所有権メタデータへフォールバックする前に、これらのフィールドを使用して候補 Plugin を絞り込みます。

所有権をすでに表している最も範囲の狭いメタデータを優先してください。`providers`、`channels`、`commandAliases`、セットアップ記述子、または `contracts` が関係性を表せる場合は、それらのフィールドを使用します。それらの所有権フィールドでは表現できない追加のプランナーヒントには、`activation` を使用します。`claude-cli`、`my-cli`、`google-gemini-cli` などの CLI ランタイムエイリアスには、トップレベルの `cliBackends` を使用します。`activation.onAgentHarnesses` は、既存の所有権フィールドを持たない組み込みエージェントハーネス ID 専用です。

すべての Plugin は、`activation.onStartup` を意図的に設定する必要があります。Plugin を Gateway の起動中に実行する必要がある場合にのみ、`true` に設定します。Plugin が起動時に動作せず、より限定的なトリガーからのみロードされるべき場合は、`false` に設定します。`onStartup` を省略しても、Plugin が暗黙的に起動時ロードされることはなくなりました。起動、チャンネル、設定、エージェントハーネス、メモリ、またはその他のより限定的なアクティベーショントリガーには、明示的なアクティベーションメタデータを使用してください。

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

| フィールド              | 必須 | 型                                                 | 意味                                                                                                                                                                               |
| ------------------ | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | いいえ       | `boolean`                                            | 明示的な Gateway 起動時アクティベーション。すべての Plugin がこれを設定する必要があります。`true` は起動中に Plugin をインポートし、`false` は一致する別のトリガーでロードが必要にならない限り、起動時の遅延ロードを維持します。 |
| `onProviders`      | いいえ       | `string[]`                                           | この Plugin をアクティベーション／ロード計画に含めるプロバイダー ID。                                                                                                                      |
| `onAgentHarnesses` | いいえ       | `string[]`                                           | この Plugin をアクティベーション／ロード計画に含める組み込みエージェントハーネスのランタイム ID。CLI バックエンドエイリアスには、トップレベルの `cliBackends` を使用します。                                           |
| `onCommands`       | いいえ       | `string[]`                                           | この Plugin をアクティベーション／ロード計画に含めるコマンド ID。                                                                                                                       |
| `onChannels`       | いいえ       | `string[]`                                           | この Plugin をアクティベーション／ロード計画に含めるチャンネル ID。                                                                                                                       |
| `onRoutes`         | いいえ       | `string[]`                                           | この Plugin をアクティベーション／ロード計画に含めるルート種別。                                                                                                                       |
| `onConfigPaths`    | いいえ       | `string[]`                                           | パスが存在し、明示的に無効化されていない場合に、この Plugin を起動／ロード計画に含めるルート相対の設定パス。                                                      |
| `onCapabilities`   | いいえ       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | コントロールプレーンのアクティベーション計画で使用される広範なケイパビリティヒント。可能な場合は、より限定的なフィールドを優先してください。                                                                                     |

現在のライブコンシューマー:

- Gateway の起動計画では、明示的な起動時インポートに `activation.onStartup` を使用します。
- コマンドによってトリガーされる CLI 計画は、従来の `commandAliases[].cliCommand` または `commandAliases[].name` にフォールバックします。
- エージェントランタイムの起動計画では、埋め込みハーネスに `activation.onAgentHarnesses` を、CLI ランタイムエイリアスにトップレベルの `cliBackends[]` を使用します。
- チャネルによってトリガーされるセットアップ／チャネル計画は、明示的なチャネル有効化メタデータがない場合、従来の `channels[]` 所有権にフォールバックします。
- 起動時の Plugin 計画では、バンドルされたブラウザー Plugin の `browser` ブロックなど、チャネル以外のルート設定サーフェスに `activation.onConfigPaths` を使用します。
- プロバイダーによってトリガーされるセットアップ／ランタイム計画は、明示的なプロバイダー有効化メタデータがない場合、従来の `providers[]` およびトップレベルの `cliBackends[]` 所有権にフォールバックします。

プランナー診断では、明示的な有効化ヒントとマニフェスト所有権へのフォールバックを区別できます。たとえば、`activation-command-hint` は `activation.onCommands` が一致したことを意味し、`manifest-command-alias` はプランナーが代わりに `commandAliases` 所有権を使用したことを意味します。これらの理由ラベルはホスト診断とテスト用です。Plugin 作成者は、所有権を最も適切に表すメタデータを引き続き宣言してください。

## qaRunners リファレンス

Plugin が共有 `openclaw qa` ルート配下に 1 つ以上のトランスポートランナーを提供する場合は、
`qaRunners` を使用します。このメタデータは軽量かつ静的に保ってください。実際の CLI 登録は引き続き Plugin
ランタイムが担当し、一致する `qaRunnerCliRegistrations` をエクスポートする軽量な
`runtime-api.ts` サーフェスを通じて行います。省略可能な
`adapterFactory` を使用すると、登録済みコマンドのランナーを変更せずに、
共有 QA シナリオへトランスポートを公開できます。

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "使い捨てのホームサーバーに対して、Docker ベースの Matrix ライブ QA レーンを実行する"
    }
  ]
}
```

| フィールド         | 必須 | 型     | 意味                                                      |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | はい      | `string` | `openclaw qa` 配下にマウントされるサブコマンド（例: `matrix`）。    |
| `description` | いいえ       | `string` | 共有ホストがスタブコマンドを必要とする場合に使用されるフォールバックのヘルプテキスト。 |

`adapterFactory` ID は `commandName` と一致する必要があります。マニフェストに存在しない
コマンドの登録をエクスポートしないでください。

## setup リファレンス

セットアップおよびオンボーディングのサーフェスで、ランタイムの読み込み前に軽量な Plugin 所有メタデータが必要な場合は、`setup` を使用します。

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
            "source": "OpenAI のローカル認証情報"
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

トップレベルの `cliBackends` は引き続き有効で、CLI 推論バックエンドを記述します。`setup.cliBackends` は、メタデータのみに保つべきコントロールプレーン／セットアップフロー向けのセットアップ固有ディスクリプターサーフェスです。

存在する場合、`setup.providers` と `setup.cliBackends` は、セットアップ検出に推奨されるディスクリプター優先の検索サーフェスです。ディスクリプターが候補 Plugin を絞り込むだけで、セットアップにより高度なセットアップ時ランタイムフックが必要な場合は、`requiresRuntime: true` を設定し、フォールバック実行パスとして `setup-api` を維持してください。

OpenClaw は、汎用プロバイダー認証および環境変数検索にも `setup.providers[].envVars` を含めます。`providerAuthEnvVars` は非推奨期間中、互換アダプターを通じて引き続きサポートされますが、これを使用し続ける非バンドル Plugin にはマニフェスト診断が表示されます。新しい Plugin では、セットアップ／ステータス用の環境メタデータを `setup.providers[].envVars` に配置してください。

請求または組織レベルの認証情報によって、推論用認証情報にすることなく `resolveUsageAuth` を有効化する必要がある場合は、`providerUsageAuthEnvVars` を使用します。これらの名前は、ワークスペースの dotenv ブロック、ACP 子プロセスからの除去、サンドボックスのシークレットフィルタリング、および広範なシークレット除去の対象になります。プロバイダーランタイムは引き続き `resolveUsageAuth` 内で値を読み取り、分類します。

セットアップエントリがない場合、または `setup.requiresRuntime: false` がセットアップランタイム不要と宣言している場合、OpenClaw は `setup.providers[].authMethods` から単純なセットアップ選択肢を導出することもできます。カスタムラベル、CLI フラグ、オンボーディングのスコープ、アシスタントメタデータには、明示的な `providerAuthChoices` エントリが引き続き優先されます。

これらのディスクリプターだけでセットアップサーフェスに十分な場合にのみ、`requiresRuntime: false` を設定してください。OpenClaw は明示的な `false` をディスクリプター専用の契約として扱い、セットアップ検索のために `setup-api` または `openclaw.setupEntry` を実行しません。ディスクリプター専用 Plugin がそれらのセットアップランタイムエントリのいずれかを含んでいる場合でも、OpenClaw は追加診断を報告し、それを引き続き無視します。`requiresRuntime` を省略すると従来のフォールバック動作が維持されるため、フラグなしでディスクリプターを追加した既存 Plugin が破損することはありません。

セットアップ検索では Plugin 所有の `setup-api` コードを実行できるため、正規化された `setup.providers[].id` と `setup.cliBackends[]` の値は、検出された Plugin 間で一意でなければなりません。所有権が曖昧な場合、検出順序から勝者を選ぶのではなく、フェイルクローズします。

セットアップランタイムが実行される場合、`setup-api` がマニフェストディスクリプターで宣言されていないプロバイダーまたは CLI バックエンドを登録したとき、あるいはディスクリプターに対応するランタイム登録がないときは、セットアップレジストリ診断がディスクリプターの不一致を報告します。これらの診断は追加的なものであり、従来の Plugin を拒否しません。

### setup.providers リファレンス

| フィールド          | 必須 | 型       | 意味                                                                                    |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | はい      | `string`   | セットアップまたはオンボーディング中に公開されるプロバイダー ID。正規化された ID はグローバルに一意にしてください。             |
| `authMethods`  | いいえ       | `string[]` | 完全なランタイムを読み込まずに、このプロバイダーがサポートするセットアップ／認証方式 ID。                       |
| `envVars`      | いいえ       | `string[]` | Plugin ランタイムの読み込み前に、汎用セットアップ／ステータスサーフェスが確認できる環境変数。               |
| `authEvidence` | いいえ       | `object[]` | 非シークレットマーカーを通じて認証できるプロバイダー向けの軽量なローカル認証証拠チェック。 |

`authEvidence` は、ランタイムコードを読み込まずに検証できる、プロバイダー所有のローカル認証情報マーカー用です。これらのチェックは軽量かつローカルに保つ必要があります。ネットワーク呼び出し、キーチェーンまたはシークレットマネージャーの読み取り、シェルコマンド、プロバイダー API のプローブは使用できません。

サポートされる証拠エントリ:

| フィールド              | 必須 | 型       | 意味                                                                                                  |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | はい      | `string`   | 現在は `local-file-with-env`。                                                                               |
| `fileEnvVar`       | いいえ       | `string`   | 明示的な認証情報ファイルパスを含む環境変数。                                                           |
| `fallbackPaths`    | いいえ       | `string[]` | `fileEnvVar` が存在しないか空の場合に確認されるローカル認証情報ファイルパス。`${HOME}` と `${APPDATA}` をサポートします。 |
| `requiresAnyEnv`   | いいえ       | `string[]` | 証拠が有効になるには、一覧内の少なくとも 1 つの環境変数が空でない必要があります。                                    |
| `requiresAllEnv`   | いいえ       | `string[]` | 証拠が有効になるには、一覧内のすべての環境変数が空でない必要があります。                                           |
| `credentialMarker` | はい      | `string`   | 証拠が存在する場合に返される非シークレットマーカー。                                                       |
| `source`           | いいえ       | `string`   | 認証／ステータス出力向けのユーザー表示用ソースラベル。                                                               |

### setup フィールド

| フィールド              | 必須 | 型       | 意味                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | いいえ       | `object[]` | セットアップおよびオンボーディング中に公開されるプロバイダーセットアップディスクリプター。                                     |
| `cliBackends`      | いいえ       | `string[]` | ディスクリプター優先のセットアップ検索に使用されるセットアップ時バックエンド ID。正規化された ID はグローバルに一意にしてください。 |
| `configMigrations` | いいえ       | `string[]` | この Plugin のセットアップサーフェスが所有する設定移行 ID。                                          |
| `requiresRuntime`  | いいえ       | `boolean`  | ディスクリプター検索後もセットアップに `setup-api` の実行が必要かどうか。                            |

## uiHints リファレンス

`uiHints` は、設定フィールド名から小さなレンダリングヒントへのマップです。ネストされた設定フィールドではキーにドットを使用できますが、どのパスセグメントも `__proto__`、`constructor`、または `prototype` にすることはできません。セットアップはこれらの名前を拒否します。

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API キー",
      "help": "OpenRouter リクエストに使用します",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

各フィールドヒントには次の項目を含められます。

| フィールド         | 型       | 意味                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | ユーザー表示用のフィールドラベル。                |
| `help`        | `string`   | 短い補助テキスト。                      |
| `tags`        | `string[]` | 省略可能な UI タグ。                       |
| `advanced`    | `boolean`  | フィールドを詳細設定としてマークします。            |
| `sensitive`   | `boolean`  | フィールドをシークレットまたは機密としてマークします。 |
| `placeholder` | `string`   | フォーム入力用のプレースホルダーテキスト。       |

## contracts リファレンス

OpenClaw が Plugin ランタイムをインポートせずに読み取れる静的なケイパビリティ所有権メタデータにのみ、`contracts` を使用します。

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

各リストは省略可能です。

| フィールド                            | 型       | 意味                                                                                                                        |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server 拡張ファクトリ ID。現在は `codex-app-server`。                                                                |
| `agentToolResultMiddleware`      | `string[]` | この Plugin がツール結果ミドルウェアを登録できるランタイム ID。                                                                     |
| `trustedToolPolicies`            | `string[]` | インストール済み Plugin が登録できる、Plugin ローカルの信頼済みツール実行前ポリシー ID。バンドル Plugin はこのフィールドなしでポリシーを登録できます。 |
| `externalAuthProviders`          | `string[]` | この Plugin が外部認証プロファイルフックを所有するプロバイダー ID。                                                                      |
| `embeddingProviders`             | `string[]` | メモリを含む再利用可能なベクトル埋め込みに使用する、この Plugin が所有する汎用埋め込みプロバイダー ID。                                 |
| `speechProviders`                | `string[]` | この Plugin が所有する音声プロバイダー ID。                                                                                                |
| `realtimeTranscriptionProviders` | `string[]` | この Plugin が所有するリアルタイム文字起こしプロバイダー ID。                                                                                |
| `realtimeVoiceProviders`         | `string[]` | この Plugin が所有するリアルタイム音声プロバイダー ID。                                                                                        |
| `memoryEmbeddingProviders`       | `string[]` | この Plugin が所有する、非推奨のメモリ専用埋め込みプロバイダー ID。                                                                  |
| `mediaUnderstandingProviders`    | `string[]` | この Plugin が所有するメディア理解プロバイダー ID。                                                                                   |
| `transcriptSourceProviders`      | `string[]` | この Plugin が所有するトランスクリプトソースプロバイダー ID。                                                                                     |
| `documentExtractors`             | `string[]` | この Plugin が所有するドキュメント（PDF など）抽出プロバイダー ID。                                                                  |
| `imageGenerationProviders`       | `string[]` | この Plugin が所有する画像生成プロバイダー ID。                                                                                      |
| `videoGenerationProviders`       | `string[]` | この Plugin が所有する動画生成プロバイダー ID。                                                                                      |
| `musicGenerationProviders`       | `string[]` | この Plugin が所有する音楽生成プロバイダー ID。                                                                                      |
| `webContentExtractors`           | `string[]` | この Plugin が所有する Web ページコンテンツ抽出プロバイダー ID。                                                                           |
| `webFetchProviders`              | `string[]` | この Plugin が所有する Web フェッチプロバイダー ID。                                                                                             |
| `webSearchProviders`             | `string[]` | この Plugin が所有する Web 検索プロバイダー ID。                                                                                            |
| `workerProviders`                | `string[]` | プロビジョニングおよびプロファイルに基づくリースライフサイクル用として、この Plugin が所有するクラウドワーカープロバイダー ID。                                      |
| `usageProviders`                 | `string[]` | この Plugin が使用量認証フックおよび使用量スナップショットフックを所有するプロバイダー ID。                                                             |
| `migrationProviders`             | `string[]` | この Plugin が `openclaw migrate` 用に所有するインポートプロバイダー ID。                                                                         |
| `gatewayMethodDispatch`          | `string[]` | プロセス内で Gateway メソッドをディスパッチする、認証済み Plugin HTTP ルート用に予約された権限。                                  |
| `tools`                          | `string[]` | この Plugin が所有するエージェントツール名。                                                                                                   |

`contracts.embeddedExtensionFactories` は、バンドルされた Codex app-server 専用拡張ファクトリのために維持されています。バンドルされたツール結果変換は、代わりに `contracts.agentToolResultMiddleware` を宣言し、`api.registerAgentToolResultMiddleware(...)` で登録する必要があります。インストール済み Plugin が同じミドルウェアシームを使用できるのは、明示的に有効化され、かつ `contracts.agentToolResultMiddleware` で宣言したランタイムに限られます。

ホストから信頼されるツール実行前ポリシー層を必要とするインストール済み Plugin は、登録する各ローカル ID を `contracts.trustedToolPolicies` で宣言し、明示的に有効化される必要があります。バンドル Plugin は既存の信頼済みポリシーパスを維持しますが、宣言されていないポリシー ID を持つインストール済み Plugin は登録前に拒否されます。ポリシー ID は登録元 Plugin のスコープ内にあるため、2 つの Plugin がいずれも `workflow-budget` を宣言して登録できますが、1 つの Plugin が同じローカル ID を 2 回登録することはできません。

ランタイムの `api.registerTool(...)` 登録は `contracts.tools` と一致する必要があります。ツール検出ではこのリストを使用し、要求されたツールを所有できる Plugin ランタイムのみを読み込みます。

`resolveExternalAuthProfiles` を実装するプロバイダー Plugin は、`contracts.externalAuthProviders` を宣言する必要があります。宣言されていない外部認証フックは無視されます。

`resolveUsageAuth` と `fetchUsageSnapshot` の両方を実装するプロバイダー Plugin は、自動検出される各プロバイダー ID を `contracts.usageProviders` で宣言する必要があります。使用量検出はランタイムコードを読み込む前にこのコントラクトを参照し、宣言された所有者のみを読み込んだ後で両方のフックを検証します。

汎用埋め込みプロバイダーは、`api.registerEmbeddingProvider(...)` で登録する各アダプターについて `contracts.embeddingProviders` を宣言する必要があります。メモリ検索で使用されるプロバイダーを含む、再利用可能なベクトル生成には汎用コントラクトを使用してください。`contracts.memoryEmbeddingProviders` は非推奨のメモリ専用互換機能であり、既存のプロバイダーが汎用埋め込みプロバイダーシームへ移行する間のみ維持されます。

ワーカープロバイダーは、各 `api.registerWorkerProvider(...)` ID を `contracts.workerProviders` で宣言する必要があります。コアは `provision` を呼び出す前に永続的な意図を保存します。プロバイダーは外部割り当ての前に設定を検証し、同じ操作 ID による呼び出しが繰り返された場合は、同じリースを採用する必要があります。コアは検証済みの設定スナップショットも保存し、名前付きプロファイルが変更または削除された後も含め、`leaseId` とともに `inspect({ leaseId, profile })` および `destroy({ leaseId, profile })` に渡します。破棄は冪等であり、検査は閉じた `active` / `destroyed` / `unknown` ステータスユニオンを返します。また、SSH 秘密鍵マテリアルは `SecretRef` を介してのみ参照されます。プロビジョニングされた SSH エンドポイントには、接続前にコアがホストを固定できるよう、信頼済みのプロビジョニング出力から得た公開 `hostKey` も、ホスト名やコメントを付けずに正確に `algorithm base64` として含める必要があります。動的な ID 参照を発行するプロバイダーは、信頼できる `resolveSshIdentity({ leaseId, profile, keyRef })` を実装できます。これを実装しないプロバイダーでは、コアの汎用シークレットリゾルバーが使用されます。信頼できる `unknown` は、アクティブなローカルレコードを孤立状態にします。保存済みの破棄要求後は、終了処理を確認します。

`contracts.gatewayMethodDispatch` は現在 `"authenticated-request"` を受け入れます。これは、プロセス内で Gateway コントロールプレーンメソッドを意図的にディスパッチするネイティブ Plugin HTTP ルート向けの API 衛生ゲートであり、悪意のあるネイティブ Plugin に対するサンドボックスではありません。Gateway HTTP 認証をすでに必要とする、厳密にレビューされたバンドル済みまたはオペレーター向けサーフェスにのみ使用してください。権限を付与されたルートが Gateway のルートワーク受付を閉じている間も到達可能なのは、そのルートが `auth: "gateway"` とルート固有の `gatewayRuntimeScopeSurface: "trusted-operator"` も宣言している場合に限られます。同じ Plugin の通常の兄弟ルートは、引き続き受付境界の内側に留まります。これにより、Plugin 全体に受付バイパスを付与することなく、一時停止ステータスと再開機能へ到達できます。解析とレスポンス整形はディスパッチの外側で限定的に行ってください。実質的な処理または変更を伴う処理は、受付とスコープの適用を担う Gateway メソッドディスパッチを経由する必要があります。

## configContracts リファレンス

Plugin ランタイムをインポートせずに汎用コアヘルパーが必要とする、マニフェスト所有の設定動作には `configContracts` を使用します。これには、危険なフラグの検出、SecretRef 移行先、レガシー設定パスの絞り込みが含まれます。

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

| フィールド                         | 必須 | 型       | 意味                                                                                                                                                                                                                          |
| ----------------------------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | いいえ       | `string[]` | この Plugin のセットアップ時の互換性移行が適用される可能性を示す、ルート相対の設定パス。設定が Plugin を一切参照していない場合に、汎用ランタイム設定読み取りがすべての Plugin セットアップサーフェスをスキップできるようにします。                 |
| `compatibilityRuntimePaths`   | いいえ       | `string[]` | Plugin コードが完全に有効化される前に、この Plugin がランタイム中に処理できるルート相対の互換性パス。互換性のあるすべての Plugin ランタイムをインポートせずに、バンドル候補の集合を絞り込む必要があるレガシーサーフェスに使用します。 |
| `dangerousFlags`              | いいえ       | `object[]` | 有効化された場合に `openclaw doctor` が安全でない、または危険であるとフラグ付けする必要がある設定リテラル。以下を参照してください。                                                                                                                                   |
| `secretInputs`                | いいえ       | `object`   | SecretRef の移行および監査対象レジストリがシークレット形式の文字列として扱う必要がある、`plugins.entries.<id>.config` 配下の設定パス。以下を参照してください。                                                                                  |

各 `dangerousFlags` エントリでサポートされる項目は次のとおりです。

| フィールド    | 必須 | 型                                  | 意味                                                                                                       |
| -------- | -------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `path`   | はい      | `string`                              | `plugins.entries.<id>.config` からの相対パスとして指定する、ドット区切りの設定パス。マップまたは配列のセグメントでは `*` ワイルドカードをサポートします。 |
| `equals` | はい      | `string \| number \| boolean \| null` | この設定値を危険として示す完全一致リテラル。                                                            |

`secretInputs` でサポートされる項目は次のとおりです。

| フィールド                   | 必須 | 型       | 意味                                                                                                                                                                                                   |
| ----------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | いいえ       | `boolean`  | この SecretRef サーフェスがアクティブかどうかを判断する際に、バンドル Plugin のデフォルト有効化設定を上書きします。Plugin がバンドルされているものの、設定で明示的に有効化されるまでサーフェスを非アクティブのままにする場合に使用します。 |
| `paths`                 | はい      | `object[]` | シークレット形式の設定パス。それぞれに `path`（ドット区切り、`plugins.entries.<id>.config` からの相対パス、`*` ワイルドカードをサポート）と、任意の `expected`（現在は `"string"` のみ）を指定します。                            |

## mediaUnderstandingProviderMetadata リファレンス

メディア理解プロバイダーにデフォルトモデル、自動認証フォールバックの優先順位、または汎用コアヘルパーがランタイムの読み込み前に必要とするネイティブドキュメントサポートがある場合は、`mediaUnderstandingProviderMetadata` を使用します。キーは `contracts.mediaUnderstandingProviders` にも宣言する必要があります。

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

| フィールド                  | 型                                                             | 意味                                                                                                   |
| ---------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | このプロバイダーが公開するメディア機能。                                                                    |
| `defaultModels`        | `Record<string, string>`                                         | 設定でモデルが指定されていない場合に使用される、機能ごとのデフォルトモデル。                                         |
| `autoPriority`         | `Record<string, number>`                                         | 認証情報に基づくプロバイダーの自動フォールバックでは、数値が小さいほど先に並びます。                                    |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | プロバイダーがサポートするネイティブドキュメント入力。                                                               |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | ドキュメント形式ごとのモデル上書き。該当するドキュメント形式で画像ベースの抽出を無効にするには、`image: false` を設定します。 |

## channelConfigs リファレンス

チャンネル Plugin がランタイムの読み込み前に軽量な設定メタデータを必要とする場合は、`channelConfigs` を使用します。読み取り専用のチャンネルセットアップ／ステータス検出では、セットアップエントリがない場合、または `setup.requiresRuntime: false` がセットアップランタイムを不要と宣言している場合に、設定済みの外部チャンネルに対してこのメタデータを直接使用できます。

`channelConfigs` は Plugin マニフェストのメタデータであり、新しいトップレベルのユーザー設定セクションではありません。ユーザーは引き続き `channels.<channel-id>` 配下でチャンネルインスタンスを設定します。OpenClaw は、Plugin のランタイムコードが実行される前に、設定されたチャンネルをどの Plugin が所有するかを判断するため、マニフェストメタデータを読み取ります。

チャンネル Plugin では、`configSchema` と `channelConfigs` は異なるパスを表します。

- `configSchema` は `plugins.entries.<plugin-id>.config` を検証します
- `channelConfigs.<channel-id>.schema` は `channels.<channel-id>` を検証します

`channels[]` を宣言する非バンドル Plugin は、一致する `channelConfigs` エントリも宣言する必要があります。これらがなくても OpenClaw は Plugin を読み込めますが、コールドパスの設定スキーマ、セットアップ、および Control UI サーフェスは、Plugin ランタイムが実行されるまでチャンネル所有のオプション形式を認識できません。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` と `nativeSkillsAutoEnabled` では、チャンネルランタイムの読み込み前に実行されるコマンド設定チェック用に、静的な `auto` デフォルトを宣言できます。バンドルされたチャンネルは、パッケージ所有の他のチャンネルカタログメタデータとともに、`package.json#openclaw.channel.commands` を通じて同じデフォルトを公開することもできます。

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
          "label": "ホームサーバー URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Matrix ホームサーバー接続",
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
| `schema`      | `object`                 | `channels.<id>` の JSON Schema。宣言された各チャンネル設定エントリに必須です。         |
| `uiHints`     | `Record<string, object>` | そのチャンネル設定セクション用の任意の UI ラベル、プレースホルダー、機密性ヒント。          |
| `label`       | `string`                 | ランタイムメタデータの準備ができていない場合に、選択画面と検査サーフェスへ統合されるチャンネルラベル。 |
| `description` | `string`                 | 検査およびカタログサーフェス用の短いチャンネル説明。                               |
| `commands`    | `object`                 | ランタイム前の設定チェックで使用される、ネイティブコマンドとネイティブ Skills の静的な自動デフォルト。       |
| `preferOver`  | `string[]`               | 選択サーフェスでこのチャンネルより優先順位を低くする、レガシーまたは低優先度の Plugin ID。    |

### 別のチャンネル Plugin の置き換え

別の Plugin でも提供できるチャンネル ID に対して、自分の Plugin を優先所有者とする場合は、`preferOver` を使用します。一般的な例として、名前が変更された Plugin ID、バンドル Plugin を置き換えるスタンドアロン Plugin、または設定互換性のために同じチャンネル ID を維持するメンテナンス済みフォークがあります。

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

`channels.chat` が設定されている場合、OpenClaw はチャンネル ID と優先 Plugin ID の両方を考慮します。優先順位の低い Plugin が、バンドルされているかデフォルトで有効であるという理由だけで選択されていた場合、OpenClaw は有効なランタイム設定内でその Plugin を無効化し、1 つの Plugin がチャンネルとそのツールを所有するようにします。ユーザーによる明示的な選択は引き続き優先されます。ユーザーが両方の Plugin を明示的に有効化した場合（`plugins.allow` または実質的な `plugins.entries` 設定を使用）、OpenClaw はその選択を保持し、要求された Plugin セットを黙って変更する代わりに、重複するチャンネル／ツールの診断を報告します。

`preferOver` は、実際に同じチャンネルを提供できる Plugin ID のみに限定してください。これは汎用的な優先順位フィールドではなく、ユーザー設定キーの名前を変更するものでもありません。

## modelSupport リファレンス

Plugin ランタイムの読み込み前に、OpenClaw が `gpt-5.6-sol` や `claude-sonnet-4.6` のような省略形モデル ID からプロバイダー Plugin を推論する必要がある場合は、`modelSupport` を使用します。

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
- 非バンドル Plugin とバンドル Plugin が両方とも一致する場合、非バンドル Plugin が優先されます
- 残る曖昧さは、ユーザーまたは設定がプロバイダーを指定するまで無視されます

フィールド:

| フィールド           | 型       | 意味                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 省略形モデル ID に対して `startsWith` で照合されるプレフィックス。                 |
| `modelPatterns` | `string[]` | プロファイルサフィックスの削除後に、省略形モデル ID に対して照合される正規表現ソース。 |

`modelPatterns` エントリは `compileSafeRegex` を通じてコンパイルされ、入れ子の繰り返しを含むパターン（例: `(a+)+$`）は拒否されます。安全性チェックに失敗したパターンは、構文的に無効な正規表現と同様に黙ってスキップされます。パターンは単純に保ち、量指定子の入れ子を避けてください。

## modelCatalog リファレンス

Plugin ランタイムを読み込む前に、OpenClaw がプロバイダーのモデルメタデータを認識する必要がある場合は、`modelCatalog` を使用します。これは固定カタログ行、プロバイダーエイリアス、抑制ルール、および検出モードについて、マニフェストが所有する情報源です。ランタイム更新は引き続きプロバイダーのランタイムコードが担当しますが、マニフェストはランタイムが必要となるタイミングをコアに通知します。

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
        "reason": "Azure OpenAI Responses では利用できません"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

トップレベルのフィールド:

| フィールド            | 型                                                     | 意味                                                                                               |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | このPluginが所有するプロバイダー ID のカタログ行。キーはトップレベルの `providers` にも含める必要があります。       |
| `aliases`        | `Record<string, object>`                                 | カタログまたは抑制の計画時に、所有プロバイダーへ解決される必要があるプロバイダーエイリアス。              |
| `suppressions`   | `object[]`                                               | プロバイダー固有の理由により、このPluginが抑制する別ソース由来のモデル行。                  |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | プロバイダーカタログをマニフェストメタデータから読み取れるか、キャッシュへ更新できるか、またはランタイムが必要か。 |
| `runtimeAugment` | `boolean`                                                | マニフェスト／設定の計画後にプロバイダーランタイムがカタログ行を追加する必要がある場合にのみ、`true` に設定します。       |

`aliases` は、モデルカタログ計画時のプロバイダー所有権検索に関与します。エイリアスのターゲットは、同じPluginが所有するトップレベルプロバイダーでなければなりません。プロバイダーでフィルタリングされたリストがエイリアスを使用する場合、OpenClaw はプロバイダーランタイムを読み込まずに、所有元のマニフェストを読み取り、エイリアスの API／ベース URL オーバーライドを適用できます。エイリアスはフィルタリングされていないカタログ一覧を展開しません。広範なリストでは、所有元の正規プロバイダー行のみが出力されます。

`suppressions` は、以前のプロバイダーランタイムの `suppressBuiltInModel` フックを置き換えます。抑制エントリが適用されるのは、プロバイダーがPluginによって所有されている場合、または所有プロバイダーをターゲットとする `modelCatalog.aliases` キーとして宣言されている場合のみです。モデル解決中にランタイム抑制フックが呼び出されることはなくなりました。

プロバイダーフィールド：

| フィールド                 | 型                     | 意味                                                                                                                                                                                                     |
| --------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`             | `string`                 | このプロバイダーカタログ内のモデルに対する、オプションのデフォルトベース URL。                                                                                                                                                    |
| `api`                 | `ModelApi`               | このプロバイダーカタログ内のモデルに対する、オプションのデフォルト API アダプター。                                                                                                                                                 |
| `headers`             | `Record<string, string>` | このプロバイダーカタログに適用される、オプションの静的ヘッダー。                                                                                                                                                      |
| `defaultUtilityModel` | `string`                 | 短い内部ユーティリティタスク（タイトル、進行状況の説明）向けにプロバイダーが推奨する、オプションの小型モデル ID。`agents.defaults.utilityModel` が未設定で、このプロバイダーがエージェントのプライマリモデルを提供している場合に使用されます。 |
| `models`              | `object[]`               | 必須のモデル行。`id` がない行は無視されます。                                                                                                                                                            |

モデルフィールド：

| フィールド              | 型                                                           | 意味                                                               |
| ------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`               | `string`                                                       | `provider/` プレフィックスを除いた、プロバイダー内のモデル ID。                    |
| `name`             | `string`                                                       | オプションの表示名。                                                      |
| `api`              | `ModelApi`                                                     | モデルごとのオプションの API オーバーライド。                                            |
| `baseUrl`          | `string`                                                       | モデルごとのオプションのベース URL オーバーライド。                                       |
| `headers`          | `Record<string, string>`                                       | モデルごとのオプションの静的ヘッダー。                                          |
| `input`            | `Array<"text" \| "image" \| "document">`                       | モデルが受け付けるモダリティ。その他の値は通知なく破棄されます。            |
| `reasoning`        | `boolean`                                                      | モデルが推論動作を公開するかどうか。                               |
| `contextWindow`    | `number`                                                       | プロバイダー固有のコンテキストウィンドウ。                                             |
| `contextTokens`    | `number`                                                       | `contextWindow` と異なる場合の、オプションの実効ランタイムコンテキスト上限。 |
| `maxTokens`        | `number`                                                       | 判明している場合の最大出力トークン数。                                           |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | 思考レベルごとの、オプションのモデル ID またはパラメーターオーバーライド。                    |
| `cost`             | `object`                                                       | 100 万トークンあたりのオプションの USD 価格。オプションの `tieredPricing` を含みます。 |
| `compat`           | `object`                                                       | OpenClaw のモデル設定互換性に一致する、オプションの互換性フラグ。  |
| `mediaInput`       | `object`                                                       | モダリティごとのオプションの入力設定。現在は画像のみです。                   |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 一覧表示ステータス。行を一切表示してはならない場合にのみ抑制します。          |
| `statusReason`     | `string`                                                       | 利用不可ステータスとともに表示される、オプションの理由。                            |
| `replaces`         | `string[]`                                                     | このモデルによって置き換えられる、以前のプロバイダー内モデル ID。                       |
| `replacedBy`       | `string`                                                       | 非推奨行の置換先となるプロバイダー内モデル ID。                    |
| `tags`             | `string[]`                                                     | 選択ツールとフィルターで使用される安定したタグ。                                    |

抑制フィールド：

| フィールド                      | 型       | 意味                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | 抑制するアップストリーム行のプロバイダー ID。このPluginが所有しているか、所有エイリアスとして宣言されている必要があります。 |
| `model`                    | `string`   | 抑制するプロバイダー内モデル ID。                                                                      |
| `reason`                   | `string`   | 抑制された行が直接リクエストされたときに表示される、オプションのメッセージ。                                     |
| `when.baseUrlHosts`        | `string[]` | 抑制が適用されるために必要な、実効プロバイダーベース URL ホストのオプションリスト。               |
| `when.providerConfigApiIn` | `string[]` | 抑制が適用されるために必要な、プロバイダー設定の完全一致する `api` 値のオプションリスト。              |

ランタイム専用データを `modelCatalog` に配置しないでください。マニフェスト行が十分に完全であり、プロバイダーでフィルタリングされたリストと選択ツールの画面でレジストリ／ランタイム検出を省略できる場合にのみ、`static` を使用します。マニフェスト行が一覧表示可能なシードまたは補足として有用であるものの、更新／キャッシュによって後から行を追加できる場合は、`refreshable` を使用します。更新可能な行だけでは信頼できる情報源になりません。OpenClaw が一覧を把握するためにプロバイダーランタイムを読み込む必要がある場合は、`runtime` を使用します。

## modelIdNormalization リファレンス

プロバイダーランタイムの読み込み前に実行する必要がある、低コストのプロバイダー所有モデル ID クリーンアップには、`modelIdNormalization` を使用します。これにより、短いモデル名、プロバイダー内のレガシー ID、プロキシプレフィックス規則などのエイリアスを、コアのモデル選択テーブルではなく、所有元Pluginのマニフェストに保持できます。

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

| フィールド                                | 型                    | 意味                                                                             |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | 大文字と小文字を区別しない、完全一致するモデル ID エイリアス。値は記述どおりに返されます。                  |
| `stripPrefixes`                      | `string[]`              | エイリアス検索前に削除するプレフィックス。レガシーなプロバイダー／モデルの重複に有用です。     |
| `prefixWhenBare`                     | `string`                | 正規化されたモデル ID に `/` がまだ含まれていない場合に追加するプレフィックス。                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | エイリアス検索後に適用する、`modelPrefix` と `prefix` をキーとした条件付きの裸 ID プレフィックス規則。 |

## providerEndpoints リファレンス

プロバイダーランタイムの読み込み前に汎用リクエストポリシーが把握する必要があるエンドポイント分類には、`providerEndpoints` を使用します。各 `endpointClass` の意味は引き続きコアが所有し、ホストとベース URL のメタデータはPluginマニフェストが所有します。

正式に外部化されたプロバイダーPluginはコア配布物から除外されるため、
インストールされるまでそのマニフェストは参照できません。Pluginがなくても
エンドポイント分類が機能し続けるように、その `providerEndpoints` は
`scripts/lib/official-external-provider-catalog.json` にもミラーリングする必要があります。コントラクトテストによって
このミラーリングが強制されます。

エンドポイントフィールド：

| フィールド                          | 型       | 意味                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | `openrouter`、`moonshot-native`、`google-vertex` などの既知のコアエンドポイントクラス。        |
| `hosts`                        | `string[]` | エンドポイントクラスにマッピングされる正確なホスト名。                                                |
| `hostSuffixes`                 | `string[]` | エンドポイントクラスにマッピングされるホストサフィックス。ドメインサフィックスのみの一致には `.` を先頭に付けます。 |
| `baseUrls`                     | `string[]` | エンドポイントクラスにマッピングされる、正規化された正確な HTTP(S) ベース URL。                             |
| `googleVertexRegion`           | `string`   | 正確なグローバルホスト用の静的な Google Vertex リージョン。                                            |
| `googleVertexRegionHostSuffix` | `string`   | 一致するホストから除去して Google Vertex リージョンプレフィックスを取り出すためのサフィックス。                 |

## providerRequest リファレンス

プロバイダーランタイムを読み込まずに汎用リクエストポリシーが必要とする、低コストのリクエスト互換性メタデータには `providerRequest` を使用します。動作固有のペイロード書き換えは、プロバイダーランタイムフックまたは共有プロバイダーファミリーヘルパー内に保持してください。

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

プロバイダーフィールド：

| フィールド                 | 型         | 意味                                                                          |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | 汎用リクエストの互換性判断と診断で使用されるプロバイダーファミリーラベル。 |
| `compatibilityFamily` | `"moonshot"` | 共有リクエストヘルパー用の省略可能なプロバイダーファミリー互換性バケット。              |
| `openAICompletions`   | `object`     | OpenAI 互換の completions リクエストフラグ。現在は `supportsStreamingUsage`。       |

## secretProviderIntegrations リファレンス

Plugin が再利用可能な SecretRef exec プロバイダープリセットを公開できる場合は、`secretProviderIntegrations` を使用します。OpenClaw は Plugin ランタイムが読み込まれる前にこのメタデータを読み取り、Plugin の所有権を `secrets.providers.<alias>.pluginIntegration` に保存し、実際のシークレット解決は SecretRef ランタイムに委ねます。プリセットが公開されるのは、バンドルされた Plugin と、git や ClawHub のインストールなど、管理対象の Plugin インストールルートから検出されたインストール済み Plugin のみです。

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

マップキーはインテグレーション ID です。`providerAlias` が省略された場合、OpenClaw はインテグレーション ID を SecretRef プロバイダーエイリアスとして使用します。プロバイダーエイリアスは通常の SecretRef プロバイダーエイリアスパターンに一致する必要があります。例：`team-secrets` または `onepassword-work`。

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

起動時または再読み込み時に、OpenClaw は現在の Plugin マニフェストメタデータを読み込み、所有元の Plugin がインストール済みかつ有効であることを確認し、マニフェストから exec コマンドを実体化して、そのプロバイダーを解決します。Plugin を無効化または削除すると、アクティブな SecretRef に対するプロバイダーが失効します。スタンドアロンの exec 設定を使用したいオペレーターは、引き続き手動の `command`/`args` プロバイダーを直接記述できます。

現在サポートされているのは `source: "exec"` プリセットのみです。`command` は `${node}`、`args[0]` は Plugin ルートからの相対パスで指定する `./` リゾルバースクリプトでなければなりません。OpenClaw は起動時または再読み込み時に、これを現在の Node 実行可能ファイルと Plugin 内スクリプトの絶対パスへ実体化します。`--require`、`--import`、`--loader`、`--env-file`、`--eval`、`--print` などの Node オプションは、マニフェストプリセットの契約には含まれません。Node 以外のコマンドが必要なオペレーターは、スタンドアロンの手動 exec プロバイダーを直接設定できます。

OpenClaw は、マニフェストプリセットの `trustedDirs` を Plugin ルートから導出し、`${node}` プリセットの場合は現在の Node 実行可能ファイルのディレクトリからも導出します。マニフェストで指定された `trustedDirs` は無視されます。`timeoutMs`、`noOutputTimeoutMs`、`maxOutputBytes`、`jsonOnly`、`env`、`passEnv`、`allowInsecurePath` などのその他の exec プロバイダーオプションは、通常の SecretRef exec プロバイダー設定にそのまま渡されます。

## modelPricing リファレンス

ランタイムの読み込み前にプロバイダーがコントロールプレーンの料金動作を制御する必要がある場合は、`modelPricing` を使用します。Gateway の料金キャッシュは、プロバイダーランタイムコードをインポートせずにこのメタデータを読み取ります。

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

プロバイダーフィールド：

| フィールド        | 型              | 意味                                                                                      |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | OpenRouter または LiteLLM の料金を決して取得すべきでないローカル／セルフホスト型プロバイダーでは、`false` に設定します。 |
| `openRouter` | `false \| object` | OpenRouter の料金検索マッピング。`false` はこのプロバイダーの OpenRouter 検索を無効にします。           |
| `liteLLM`    | `false \| object` | LiteLLM の料金検索マッピング。`false` はこのプロバイダーの LiteLLM 検索を無効にします。                 |

ソースフィールド：

| フィールド                      | 型               | 意味                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | OpenClaw のプロバイダー ID と異なる場合の外部カタログプロバイダー ID。例：`zai` プロバイダーに対する `z-ai`。 |
| `passthroughProviderModel` | `boolean`          | スラッシュを含むモデル ID をネストされたプロバイダー／モデル参照として扱います。OpenRouter などのプロキシプロバイダーに便利です。       |
| `modelIdTransforms`        | `"version-dots"[]` | 追加の外部カタログモデル ID バリアント。`version-dots` は `claude-opus-4.6` のようなドット区切りのバージョン ID を試行します。            |

### OpenClaw プロバイダーインデックス

OpenClaw プロバイダーインデックスは、Plugin がまだインストールされていない可能性があるプロバイダー向けの、OpenClaw が所有するプレビューメタデータです。これは Plugin マニフェストの一部ではありません。Plugin マニフェストは引き続き、インストール済み Plugin に関する正式な情報源です。プロバイダーインデックスは、プロバイダー Plugin がインストールされていない場合に、将来のインストール可能プロバイダー画面やインストール前モデルピッカー画面が利用する内部フォールバック契約です。

カタログの優先順位：

1. ユーザー設定。
2. インストール済み Plugin マニフェストの `modelCatalog`。
3. 明示的な更新によるモデルカタログキャッシュ。
4. OpenClaw プロバイダーインデックスのプレビュー行。

プロバイダーインデックスには、シークレット、有効化状態、ランタイムフック、またはアカウント固有のライブモデルデータを含めてはなりません。そのプレビューカタログでは、Plugin マニフェストと同じ `modelCatalog` プロバイダー行形式を使用しますが、`api`、`baseUrl`、料金、互換性フラグなどのランタイムアダプターフィールドを、インストール済み Plugin マニフェストと意図的に同期させる場合を除き、安定した表示メタデータのみに制限すべきです。ライブの `/models` 検出を備えるプロバイダーは、通常の一覧表示やオンボーディングからプロバイダー API を呼び出すのではなく、明示的なモデルカタログキャッシュ経路を通じて更新済みの行を書き込む必要があります。

プロバイダーインデックスのエントリには、コア外へ移動した、またはまだインストールされていないプロバイダーのインストール可能な Plugin メタデータを含めることもできます。このメタデータはチャネルカタログのパターンを踏襲します。インストール可能なセットアップオプションを表示するには、パッケージ名、npm インストール仕様、期待される整合性情報、低コストで取得できる認証選択肢ラベルで十分です。Plugin がインストールされると、そのマニフェストが優先され、そのプロバイダーのプロバイダーインデックスエントリは無視されます。

`openclaw doctor --fix` は、少数の閉じた集合に属する従来のトップレベルマニフェスト機能キー（`speechProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`tools`）を `contracts.*` に移行します。これら（またはその他の機能リスト）がトップレベルのマニフェストフィールドとして読み取られることはなくなりました。通常のマニフェスト読み込みでは、`contracts` 配下にある場合のみ認識されます。

## マニフェストと package.json の違い

2 つのファイルは異なる役割を担います。

| ファイル                   | 用途                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Plugin コードの実行前に存在する必要がある、検出、設定検証、認証選択肢メタデータ、UI ヒント                         |
| `package.json`         | npm メタデータ、依存関係のインストール、およびエントリーポイント、インストール条件、セットアップ、カタログメタデータに使用される `openclaw` ブロック |

メタデータをどちらに配置すべきか不明な場合は、次のルールを使用します。

- OpenClaw が Plugin コードを読み込む前に知る必要がある場合は、`openclaw.plugin.json` に配置する
- パッケージング、エントリーファイル、または npm のインストール動作に関する場合は、`package.json` に配置する

### 検出に影響する package.json フィールド

一部のランタイム前 Plugin メタデータは、意図的に `openclaw.plugin.json` ではなく、`package.json` 内の `openclaw` ブロックに配置されます。`openclaw.bundle` と `openclaw.bundle.json` は OpenClaw Plugin の契約ではありません。ネイティブ Plugin は、`openclaw.plugin.json` と、以下でサポートされている `package.json#openclaw` フィールドを使用する必要があります。

重要な例：

| フィールド                                                                                      | 意味                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | ネイティブ Plugin のエントリポイントを宣言します。Plugin パッケージディレクトリ内に配置する必要があります。                                                                                                   |
| `openclaw.runtimeExtensions`                                                               | インストール済みパッケージのビルド済み JavaScript ランタイムエントリポイントを宣言します。Plugin パッケージディレクトリ内に配置する必要があります。                                                                 |
| `openclaw.setupEntry`                                                                      | オンボーディング、遅延チャネル起動、読み取り専用のチャネルステータスおよび SecretRef 検出で使用される、軽量なセットアップ専用エントリポイントです。Plugin パッケージディレクトリ内に配置する必要があります。 |
| `openclaw.runtimeSetupEntry`                                                               | インストール済みパッケージのビルド済み JavaScript セットアップエントリポイントを宣言します。`setupEntry` が必要で、実在し、Plugin パッケージディレクトリ内に配置されている必要があります。                         |
| `openclaw.channel`                                                                         | ラベル、ドキュメントパス、エイリアス、選択時の説明文など、軽量なチャネルカタログメタデータです。                                                                                                 |
| `openclaw.channel.commands`                                                                | チャネルランタイムが読み込まれる前に、設定、監査、コマンド一覧の各画面で使用される、静的なネイティブコマンドおよびネイティブスキルの自動デフォルトメタデータです。                                          |
| `openclaw.channel.configuredState`                                                         | 完全なチャネルランタイムを読み込まずに「環境変数のみのセットアップがすでに存在するか」を判定できる、軽量な設定済み状態チェッカーのメタデータです。                                         |
| `openclaw.channel.persistedAuthState`                                                      | 完全なチャネルランタイムを読み込まずに「すでにサインイン済みのものがあるか」を判定できる、軽量な永続化認証チェッカーのメタデータです。                                               |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | バンドル済みおよび外部公開 Plugin のインストール・更新に関するヒントです。                                                                                                                   |
| `openclaw.install.defaultChoice`                                                           | 複数のインストール元を利用できる場合の優先インストールパスです。                                                                                                                  |
| `openclaw.install.minHostVersion`                                                          | サポート対象となる OpenClaw ホストの最小バージョンです。`>=2026.3.22` や `>=2026.5.1-beta.1` のような semver の下限を使用します。                                                                             |
| `openclaw.compat.pluginApi`                                                                | このパッケージに必要な OpenClaw Plugin API の最小範囲です。`>=2026.5.27` のような semver の下限を使用します。                                                                                 |
| `openclaw.install.expectedIntegrity`                                                       | `sha512-...` などの想定 npm dist 整合性文字列です。インストールおよび更新フローでは、取得したアーティファクトをこの値と照合して検証します。                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                                              | 設定が無効な場合に、バンドル済み Plugin を再インストールする限定的な復旧経路を許可します。                                                                                                       |
| `openclaw.install.requiredPlatformPackages`                                                | lockfile のプラットフォーム制約が現在のホストと一致した場合に実体化される必要がある npm パッケージエイリアスです。                                                                           |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | listen 前にセットアップランタイムのチャネル画面を読み込めるようにし、設定済みの完全なチャネル Plugin の読み込みを listen 後の有効化まで遅延します。                                                 |

マニフェストメタデータは、ランタイムが読み込まれる前に、オンボーディングに表示されるプロバイダー、チャネル、セットアップの選択肢を決定します。`package.json#openclaw.install` は、ユーザーがそれらの選択肢のいずれかを選んだ際に、その Plugin を取得または有効化する方法をオンボーディングに伝えます。インストールのヒントを `openclaw.plugin.json` に移動しないでください。

`openclaw.install.minHostVersion` は、バンドルされていない Plugin ソースのインストール時およびマニフェストレジストリの読み込み時に適用されます。無効な値は拒否されます。新しいが有効な値の場合、古いホストでは外部 Plugin がスキップされます。バンドル済みソース Plugin は、ホストのチェックアウトと同じバージョンであると見なされます。

`openclaw.install.requiredPlatformPackages` は、必須のネイティブバイナリをオプションのプラットフォーム固有エイリアス経由で公開する npm パッケージ向けです。サポートする各プラットフォームエイリアスについて、修飾なしの npm パッケージ名を列挙してください。npm のインストール中、OpenClaw は lockfile の制約が現在のホストと一致する、宣言済みエイリアスのみを検証します。npm が成功を報告したにもかかわらずそのエイリアスが欠落している場合、OpenClaw は新しいキャッシュで 1 回再試行し、それでもエイリアスが欠落していればインストールをロールバックします。

`openclaw.compat.pluginApi` は、バンドルされていない Plugin ソースのパッケージインストール時に適用されます。パッケージのビルド対象となった OpenClaw Plugin SDK／ランタイム API の下限を指定するために使用してください。Plugin パッケージがより新しい API を必要としながら、他のフロー向けにはより低いインストールヒントを維持する場合、`minHostVersion` より厳しくできます。公式 OpenClaw リリースの同期では、既存の公式 Plugin の API 下限はデフォルトで OpenClaw のリリースバージョンまで引き上げられますが、パッケージが意図的に古いホストをサポートする場合、Plugin 単独のリリースではより低い下限を維持できます。パッケージバージョンだけを互換性契約として使用しないでください。`peerDependencies.openclaw` は引き続き npm パッケージのメタデータです。OpenClaw は、インストールの互換性判断に `openclaw.compat.pluginApi` の契約を使用します。

公式のオンデマンドインストールメタデータでは、Plugin が ClawHub で公開されている場合に `clawhubSpec` を使用してください。オンボーディングではこれを優先リモートソースとして扱い、インストール後に ClawHub アーティファクトの情報を記録します。`npmSpec` は、まだ ClawHub に移行していないパッケージ向けの互換性フォールバックとして残ります。

npm の厳密なバージョン固定は、たとえば `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"` のように、すでに `npmSpec` に記述します。公式の外部カタログエントリでは、厳密な指定を `expectedIntegrity` と組み合わせ、取得した npm アーティファクトが固定済みリリースと一致しなくなった場合に、更新フローが安全側に停止するようにしてください。対話型オンボーディングでは、互換性のため、修飾なしのパッケージ名や dist-tag を含む、信頼済みレジストリの npm 指定を引き続き提示します。カタログ診断では、厳密指定、可変指定、整合性固定済み、整合性欠落、パッケージ名不一致、無効なデフォルト選択ソースを区別できます。また、`expectedIntegrity` が存在するものの、固定対象となる有効な npm ソースがない場合にも警告します。`expectedIntegrity` が存在する場合、インストールおよび更新フローはそれを適用します。省略された場合、レジストリ解決結果は整合性の固定なしで記録されます。

ステータス、チャネル一覧、または SecretRef スキャンで、完全なランタイムを読み込まずに設定済みアカウントを識別する必要がある場合、チャネル Plugin は `openclaw.setupEntry` を提供する必要があります。セットアップエントリでは、チャネルメタデータに加えて、セットアップで安全に使用できる設定、ステータス、シークレットの各アダプターを公開してください。ネットワーククライアント、Gateway リスナー、トランスポートランタイムはメインの拡張機能エントリポイントに保持してください。

ランタイムエントリポイントのフィールドは、ソースエントリポイントのフィールドに対するパッケージ境界チェックを上書きしません。たとえば、`openclaw.runtimeExtensions` を指定しても、境界外へ抜ける `openclaw.extensions` パスを読み込み可能にはできません。

`openclaw.install.allowInvalidConfigRecovery` の対象は意図的に限定されています。任意の壊れた設定をインストール可能にするものではありません。現在は、バンドル済み Plugin のパス欠落や、同じバンドル済み Plugin に対する古い `channels.<id>` エントリなど、特定の古いバンドル済み Plugin のアップグレード失敗からインストールフローを復旧できるようにするだけです。無関係な設定エラーは引き続きインストールをブロックし、運用担当者を `openclaw doctor --fix` に誘導します。

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

セットアップ、doctor、ステータス、または読み取り専用の存在確認フローで、完全なチャネル Plugin が読み込まれる前に低コストの認証有無チェックが必要な場合に使用してください。永続化された認証状態は、設定済みのチャネル状態ではありません。このメタデータを使用して Plugin を自動有効化したり、ランタイム依存関係を修復したり、チャネルランタイムを読み込むべきか判断したりしないでください。対象のエクスポートは、永続化された状態のみを読み取る小さな関数にしてください。完全なチャネルランタイムのバレルを経由させないでください。

`openclaw.channel.configuredState` は、低コストの設定済みチェックをサポートします。環境変数だけで十分な場合は、宣言的な環境メタデータを優先してください。

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "env": {
          "allOf": ["TELEGRAM_BOT_TOKEN"]
        }
      }
    }
  }
}
```

列挙したすべての変数が必要な場合は `env.allOf` を使用し、空でない変数が 1 つでもあれば十分な場合は `env.anyOf` を使用してください。ランタイムを使用しない小さなチェックに環境メタデータ以上のものが必要な場合は、`persistedAuthState` の例のように `specifier` と `exportName` を使用してください。`env` が存在する場合、OpenClaw はそのモジュールを読み込まずにこの値を使用します。チェックに完全な設定解決または実際のチャネルランタイムが必要な場合は、そのロジックを Plugin の `config.hasConfiguredState` フックに保持してください。

## 検出の優先順位（Plugin ID の重複）

OpenClaw は、次の順序で確認される 3 つのルートから Plugin を検出します。OpenClaw に同梱されるバンドル済み Plugin、グローバルインストールルート（`~/.openclaw/extensions`）、現在のワークスペースルート（`<workspace>/.openclaw/extensions`）に加え、明示的な `plugins.load.paths` エントリです。

2 つの検出結果が同じ `id` を共有する場合、**最も優先順位の高い**マニフェストのみが保持されます。優先順位の低い重複は、並行して読み込まれるのではなく破棄されます。優先順位は高い順に次のとおりです。

1. **設定で選択済み** — `plugins.entries.<id>` で明示的に固定されたパス
2. **追跡済みインストール記録と一致するグローバルインストール** — `openclaw plugin install`／`openclaw plugin update` を介してインストールされ、OpenClaw のインストール追跡で同じ ID として認識される Plugin。ID がバンドル済み Plugin にも属する場合を含みます
3. **バンドル済み** — OpenClaw に同梱される Plugin
4. **ワークスペース** — 現在のワークスペースを基準に検出された Plugin
5. その他の検出候補

影響は次のとおりです。

- ワークスペースまたはグローバルルートに未追跡の状態で置かれた、バンドル済み Plugin のフォークまたは古いコピーが、バンドル済みビルドを隠すことはありません。
- バンドル済み Plugin を上書きするには、その ID に対して `openclaw plugin install` を実行し、追跡済みグローバルインストールの優先順位をバンドル済みコピーより高くするか、`plugins.entries.<id>` で特定のパスを固定して、設定で選択済みの優先順位により勝つようにします。
- 重複の破棄はログに記録されるため、Doctor と起動時診断で破棄されたコピーを示せます。
- 設定で選択された重複の上書きは、診断では明示的な上書きとして表現されますが、古いフォークや意図しない隠蔽が見える状態を保つため、引き続き警告されます。

## JSON Schema の要件

- 設定を受け付けない場合でも、**すべてのPluginにはJSON Schemaを含める必要があります**。
- 空のスキーマでも問題ありません（例: `{ "type": "object", "additionalProperties": false }`）。
- スキーマは、実行時ではなく設定の読み取り時および書き込み時に検証されます。
- バンドルされたPluginを新しい設定キーで拡張またはフォークする場合は、そのPluginの`openclaw.plugin.json` `configSchema`も同時に更新してください。バンドルされたPluginのスキーマは厳格であるため、`myNewKey`を`configSchema.properties`に追加せずにユーザー設定へ`plugins.entries.<id>.config.myNewKey`を追加すると、Pluginランタイムが読み込まれる前に拒否されます。

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

- 不明な`channels.*`キーは、チャンネルIDがPluginマニフェストで宣言されていない限り、**エラー**になります。同じIDが`plugins.allow`、`plugins.entries`、または`plugins.installs`（参照されているものの、現在は検出できないPlugin）にも含まれている場合、OpenClawは代わりにこれを**警告**へ格下げします。
- 不明なPlugin IDを参照する`plugins.entries.<id>`、`plugins.allow`、および`plugins.deny`はエラーではなく、**警告**（「古い設定エントリは無視されました」）になります。そのため、アップグレードやPluginの削除・名前変更によってGatewayの起動が妨げられることはありません。
- 不明なPlugin IDを参照する`plugins.slots.memory`は**エラー**になります。ただし、既知の公式外部Pluginである`memory-lancedb`については、代わりに警告になります。
- Pluginがインストールされていても、マニフェストまたはスキーマが壊れているか欠けている場合、検証は失敗し、DoctorがPluginエラーを報告します。
- Pluginの設定が存在していても、そのPluginが**無効**になっている場合、設定は保持され、Doctorとログに**警告**が表示されます。

完全な`plugins.*`スキーマについては、[設定リファレンス](/ja-JP/gateway/configuration)を参照してください。

## 注記

- ローカルファイルシステムから読み込む場合も含め、**ネイティブOpenClaw Pluginにはマニフェストが必須です**。ランタイムは引き続きPluginモジュールを別途読み込みます。マニフェストは検出と検証にのみ使用されます。
- ネイティブマニフェストはJSON5で解析されるため、最終的な値がオブジェクトである限り、コメント、末尾のカンマ、および引用符のないキーを使用できます。
- マニフェストローダーが読み取るのは、文書化されたマニフェストフィールドのみです。独自のトップレベルキーは使用しないでください。
- Pluginで不要な場合は、`channels`、`providers`、`cliBackends`、および`skills`をすべて省略できます。
- `providerCatalogEntry`は軽量に保ち、広範なランタイムコードをインポートしないでください。リクエスト時の実行ではなく、静的なプロバイダーカタログのメタデータや限定的な検出記述子に使用してください。
- 排他的なPlugin種別は`plugins.slots.*`を介して選択されます。`kind: "memory"`は`plugins.slots.memory`（デフォルトは`memory-core`）を、`kind: "context-engine"`は`plugins.slots.contextEngine`（デフォルトは`legacy`）を使用します。
- 排他的なPlugin種別は、このマニフェストで宣言してください。ランタイムエントリの`OpenClawPluginDefinition.kind`は非推奨であり、古いPluginとの互換性を保つためのフォールバックとしてのみ残されています。
- 環境変数のメタデータ（`setup.providers[].envVars`、非推奨の`providerAuthEnvVars`、および`channelEnvVars`）は宣言専用です。ステータス、監査、Cron配信の検証、およびその他の読み取り専用サーフェスでは、環境変数を設定済みとして扱う前に、引き続きPluginの信頼性と実効的な有効化ポリシーが適用されます。
- プロバイダーコードを必要とするランタイムのウィザードメタデータについては、[プロバイダーランタイムフック](/ja-JP/plugins/architecture-internals#provider-runtime-hooks)を参照してください。
- Pluginがネイティブモジュールに依存する場合は、ビルド手順とパッケージマネージャーの許可リスト要件（例: pnpm `allow-build-scripts` + `pnpm rebuild <package>`）を文書化してください。

## 関連項目

<CardGroup cols={3}>
  <Card title="Pluginの構築" href="/ja-JP/plugins/building-plugins" icon="rocket">
    Pluginのはじめに。
  </Card>
  <Card title="Pluginアーキテクチャ" href="/ja-JP/plugins/architecture" icon="diagram-project">
    内部アーキテクチャと機能モデル。
  </Card>
  <Card title="SDKの概要" href="/ja-JP/plugins/sdk-overview" icon="book">
    Plugin SDKリファレンスとサブパスインポート。
  </Card>
</CardGroup>

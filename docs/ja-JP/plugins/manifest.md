---
read_when:
    - OpenClaw Plugin を構築しています
    - Plugin 設定スキーマをリリースするか、Plugin の検証エラーをデバッグする必要があります
summary: Plugin マニフェスト + JSON スキーマ要件（厳格な設定検証）
title: Plugin マニフェスト
x-i18n:
    generated_at: "2026-07-12T14:45:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
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

OpenClaw はこれらのレイアウトを自動検出しますが、以下の `openclaw.plugin.json` スキーマに対する検証は行いません。互換バンドルでは、レイアウトが OpenClaw のランタイム要件に一致する場合、OpenClaw はバンドルメタデータ、宣言された Skills ルート、Claude コマンドルート、Claude `settings.json` のデフォルト、Claude LSP のデフォルト、およびサポートされているフックパックを読み取ります。

すべてのネイティブ OpenClaw Plugin は、**Plugin ルート**に `openclaw.plugin.json` を必ず同梱する必要があります。OpenClaw はこれを読み取り、**Plugin コードを実行せずに**設定を検証します。マニフェストが存在しないか無効な場合、設定の検証はブロックされ、Plugin エラーとして扱われます。

Plugin システムの完全なガイドについては[プラグイン](/ja-JP/tools/plugin)を、ネイティブ機能モデルと現在の外部互換性に関するガイダンスについては[機能モデル](/ja-JP/plugins/architecture#public-capability-model)を参照してください。

## このファイルの役割

`openclaw.plugin.json` は、OpenClaw が**Plugin コードを読み込む前に**読み取るメタデータです。ここに含めるすべての情報は、Plugin ランタイムを起動せずに低コストで検査できる必要があります。

**次の用途に使用します。**

- Plugin の識別、設定の検証、設定 UI のヒント
- 認証、オンボーディング、セットアップのメタデータ（エイリアス、自動有効化、プロバイダー環境変数、認証方式）
- コントロールプレーン画面向けの有効化ヒント
- モデルファミリーの短縮表記に対する所有権
- 静的な機能所有権のスナップショット（`contracts`）
- 共有 `openclaw qa` ホストが検査できる QA ランナーメタデータ
- カタログおよび検証画面にマージされるチャネル固有の設定メタデータ

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
| `id`                                 | はい     | `string`                     | 正規のプラグイン ID。`plugins.entries.<id>` で使用される ID です。                                                                                                                                                                                                         |
| `configSchema`                       | はい     | `object`                     | このプラグインの設定に対するインライン JSON Schema。                                                                                                                                                                                                                       |
| `requiresPlugins`                    | いいえ   | `string[]`                   | このプラグインを機能させるために、併せてインストールする必要があるプラグイン ID。検出時、プラグインは読み込み可能な状態に保たれますが、必要なプラグインが不足している場合は警告されます。                                                                                     |
| `enabledByDefault`                   | いいえ   | `true`                       | バンドルされたプラグインをデフォルトで有効としてマークします。省略するか、`true` 以外の値を設定すると、プラグインはデフォルトで無効のままになります。                                                                                                                       |
| `enabledByDefaultOnPlatforms`        | いいえ   | `string[]`                   | バンドルされたプラグインを、列挙された Node.js プラットフォーム（例：`["darwin"]`）でのみデフォルトで有効としてマークします。明示的な設定が常に優先されます。                                                                                                              |
| `legacyPluginIds`                    | いいえ   | `string[]`                   | この正規のプラグイン ID に正規化される旧 ID。                                                                                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders`  | いいえ   | `string[]`                   | 認証、設定、またはモデル参照で指定された場合に、このプラグインを自動的に有効化するプロバイダー ID。                                                                                                                                                                        |
| `kind`                               | いいえ   | `PluginKind \| PluginKind[]` | `plugins.slots.*` で使用される、1 つ以上の排他的なプラグイン種別（`"memory"`、`"context-engine"`）を宣言します。両方のスロットを所有するプラグインは、1 つの配列で両方の種別を宣言します。                                                                                  |
| `channels`                           | いいえ   | `string[]`                   | このプラグインが所有するチャンネル ID。検出と設定検証に使用されます。                                                                                                                                                                                                      |
| `providers`                          | いいえ   | `string[]`                   | このプラグインが所有するプロバイダー ID。                                                                                                                                                                                                                                  |
| `providerCatalogEntry`               | いいえ   | `string`                     | プラグインルートからの相対パスで指定する軽量なプロバイダーカタログモジュールのパス。プラグインランタイム全体を有効化せずに読み込める、マニフェストスコープのプロバイダーカタログメタデータに使用します。                                                                     |
| `modelSupport`                       | いいえ   | `object`                     | ランタイムの前にプラグインを自動読み込みするために使用される、マニフェスト所有の簡略化されたモデルファミリーメタデータ。                                                                                                                                                    |
| `modelCatalog`                       | いいえ   | `object`                     | このプラグインが所有するプロバイダーの宣言的なモデルカタログメタデータ。プラグインランタイムを読み込まずに、将来の読み取り専用一覧表示、オンボーディング、モデル選択、エイリアス、抑制を実現するためのコントロールプレーン契約です。                                         |
| `modelPricing`                       | いいえ   | `object`                     | プロバイダー所有の外部料金検索ポリシー。ローカル／セルフホスト型プロバイダーをリモート料金カタログの対象外にしたり、コアにプロバイダー ID をハードコードせずにプロバイダー参照を OpenRouter/LiteLLM カタログ ID に対応付けたりするために使用します。                            |
| `modelIdNormalization`               | いいえ   | `object`                     | プロバイダーランタイムの読み込み前に実行する必要がある、プロバイダー所有のモデル ID エイリアス／プレフィックスの整理。                                                                                                                                                     |
| `providerEndpoints`                  | いいえ   | `object[]`                   | プロバイダーランタイムの読み込み前にコアが分類する必要のあるプロバイダールート向けの、マニフェスト所有のエンドポイントホスト／baseUrl メタデータ。                                                                                                                         |
| `providerRequest`                    | いいえ   | `object`                     | プロバイダーランタイムの読み込み前に汎用リクエストポリシーで使用される、低コストなプロバイダーファミリーおよびリクエスト互換性メタデータ。                                                                                                                                  |
| `secretProviderIntegrations`         | いいえ   | `Record<string, object>`     | コアにプロバイダー固有の連携をハードコードせずに、セットアップまたはインストール画面で提供できる、宣言的な SecretRef exec プロバイダープリセット。                                                                                                                         |
| `cliBackends`                        | いいえ   | `string[]`                   | このプラグインが所有する CLI 推論バックエンド ID。明示的な設定参照に基づく起動時の自動有効化に使用されます。                                                                                                                                                               |
| `syntheticAuthRefs`                  | いいえ   | `string[]`                   | ランタイムの読み込み前に行われるコールドモデル検出中に、プラグイン所有の合成認証フックを調査する必要があるプロバイダーまたは CLI バックエンドの参照。                                                                                                                       |
| `nonSecretAuthMarkers`               | いいえ   | `string[]`                   | 非機密のローカル認証、OAuth、またはアンビエント認証情報の状態を表す、バンドルプラグイン所有のプレースホルダー API キー値。                                                                                                                                                  |
| `commandAliases`                     | いいえ   | `object[]`                   | ランタイムの読み込み前に、プラグインを認識した設定および CLI 診断を生成する必要がある、このプラグイン所有のコマンド名。                                                                                                                                                     |
| `providerAuthEnvVars`                | いいえ   | `Record<string, string[]>`   | プロバイダーの認証／状態検索向けの非推奨の互換環境変数メタデータ。新しいプラグインでは `setup.providers[].envVars` を使用してください。OpenClaw は非推奨期間中、引き続きこれを読み取ります。                                                                                  |
| `providerUsageAuthEnvVars`           | いいえ   | `Record<string, string[]>`   | 使用量／請求専用のプロバイダー認証情報。OpenClaw はこれらの名前を使用量の検出と機密情報の除去に使用しますが、推論の認証には決して使用しません。                                                                                                                              |
| `providerAuthAliases`                | いいえ   | `Record<string, string>`     | 認証検索で別のプロバイダー ID を再利用するプロバイダー ID。たとえば、基盤となるプロバイダーの API キーと認証プロファイルを共有するコーディングプロバイダーに使用します。                                                                                                    |
| `channelEnvVars`                     | いいえ   | `Record<string, string[]>`   | OpenClaw がプラグインコードを読み込まずに検査できる、低コストなチャンネル環境変数メタデータ。汎用的な起動／設定ヘルパーが認識すべき、環境変数駆動のチャンネルセットアップまたは認証画面に使用します。                                                                         |
| `providerAuthChoices`                | いいえ   | `object[]`                   | オンボーディングの選択画面、優先プロバイダーの解決、および単純な CLI フラグ接続のための、低コストな認証選択肢メタデータ。                                                                                                                                                  |
| `activation`                         | いいえ   | `object`                     | 起動、プロバイダー、コマンド、チャンネル、ルート、および機能をトリガーとする読み込み向けの、低コストな有効化プランナーメタデータ。メタデータのみであり、実際の動作は引き続きプラグインランタイムが所有します。                                                               |
| `setup`                              | いいえ   | `object`                     | プラグインランタイムを読み込まずに検出機構およびセットアップ画面が検査できる、低コストなセットアップ／オンボーディング記述子。                                                                                                                                             |
| `qaRunners`                          | いいえ   | `object[]`                   | プラグインランタイムの読み込み前に共有 `openclaw qa` ホストが使用する、低コストな QA ランナー記述子。                                                                                                                                                                     |
| `contracts`                          | いいえ   | `object`                     | 外部認証フック、埋め込み、音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像／動画／音楽生成、Web 取得、Web 検索、ワーカープロバイダー、ドキュメント／Web コンテンツ抽出、およびツール所有権に関する静的な機能所有権スナップショット。                         |
| `configContracts`                    | いいえ   | `object`                     | 汎用コアヘルパーが使用する、マニフェスト所有の設定動作：危険なフラグの検出、SecretRef の移行先、および旧設定パスの絞り込み。[configContracts リファレンス](#configcontracts-reference)を参照してください。                                                                  |
| `mediaUnderstandingProviderMetadata` | いいえ       | `Record<string, object>`     | `contracts.mediaUnderstandingProviders` で宣言されたプロバイダー ID 向けの軽量なメディア理解用デフォルト。                                                                                                                                                                   |
| `imageGenerationProviderMetadata`    | いいえ       | `Record<string, object>`     | `contracts.imageGenerationProviders` で宣言されたプロバイダー ID 向けの軽量な画像生成認証メタデータ。プロバイダー所有の認証エイリアスとベース URL ガードを含みます。                                                                                                         |
| `videoGenerationProviderMetadata`    | いいえ       | `Record<string, object>`     | `contracts.videoGenerationProviders` で宣言されたプロバイダー ID 向けの軽量な動画生成認証メタデータ。プロバイダー所有の認証エイリアスとベース URL ガードを含みます。                                                                                                         |
| `musicGenerationProviderMetadata`    | いいえ       | `Record<string, object>`     | `contracts.musicGenerationProviders` で宣言されたプロバイダー ID 向けの軽量な音楽生成認証メタデータ。プロバイダー所有の認証エイリアスとベース URL ガードを含みます。                                                                                                         |
| `toolMetadata`                       | いいえ       | `Record<string, object>`     | `contracts.tools` で宣言された Plugin 所有ツール向けの軽量な利用可否メタデータ。設定、環境変数、または認証の存在を示す情報がない限りツールがランタイムを読み込むべきでない場合に使用します。                                                                                                  |
| `channelConfigs`                     | いいえ       | `Record<string, object>`     | ランタイムの読み込み前に検出および検証サーフェスへマージされる、マニフェスト所有のチャンネル設定メタデータ。                                                                                                                                                                 |
| `skills`                             | いいえ       | `string[]`                   | Plugin ルートからの相対パスで指定する、読み込む Skills ディレクトリ。                                                                                                                                                                                                                    |
| `name`                               | いいえ       | `string`                     | 人が判読できる Plugin 名。                                                                                                                                                                                                                                                |
| `description`                        | いいえ       | `string`                     | Plugin サーフェスに表示される短い概要。                                                                                                                                                                                                                                    |
| `catalog`                            | いいえ       | `object`                     | Plugin カタログサーフェス向けの省略可能な表示ヒント。このメタデータによって Plugin がインストール、有効化、または信頼の付与を受けることはありません。                                                                                                                                               |
| `icon`                               | いいえ       | `string`                     | マーケットプレイス／カタログカード向けの HTTPS 画像 URL。ClawHub は有効な任意の `https://` URL を受け入れ、省略されているか無効な場合はデフォルトの Plugin アイコンにフォールバックします。                                                                                                         |
| `version`                            | いいえ       | `string`                     | 情報提供用の Plugin バージョン。                                                                                                                                                                                                                                              |
| `uiHints`                            | いいえ       | `Record<string, object>`     | 設定フィールド向けの UI ラベル、プレースホルダー、および機密性に関するヒント。                                                                                                                                                                                                          |

## catalog リファレンス

`catalog` は、Plugin ブラウザー向けのオプションの表示ヒントを提供します。ホストはこれらのヒントを無視できます。これらによって Plugin がインストールまたは有効化されることはなく、実行時の動作や信頼レベルも変更されません。

```json
{
  "catalog": {
    "featured": true,
    "order": 10
  }
}
```

| フィールド | 型        | 意味                                                                 |
| ---------- | --------- | -------------------------------------------------------------------- |
| `featured` | `boolean` | カタログ画面でこの Plugin を注目対象として表示するかどうか。         |
| `order`    | `number`  | 選定された Plugin 間の昇順表示ヒント。値が小さいほど先に表示されます。 |

## 生成プロバイダーメタデータのリファレンス

生成プロバイダーのメタデータフィールドは、対応する `contracts.*GenerationProviders` リストで宣言されたプロバイダーの静的認証シグナルを記述します。OpenClaw はプロバイダーランタイムが読み込まれる前にこれらのフィールドを読み取るため、コアツールはすべてのプロバイダー Plugin をインポートせずに、生成プロバイダーが利用可能かどうかを判断できます。

これらのフィールドは、低コストで宣言的な事実にのみ使用してください。トランスポート、リクエスト変換、トークン更新、認証情報の検証、および実際の生成動作は Plugin ランタイムに残します。

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

| フィールド             | 必須   | 型         | 意味                                                                                                                                                            |
| ---------------------- | ------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | いいえ | `string[]` | 生成プロバイダーの静的認証エイリアスとして扱う追加のプロバイダー ID。                                                                                           |
| `authProviders`        | いいえ | `string[]` | 設定済みの認証プロファイルを、この生成プロバイダーの認証として扱うプロバイダー ID。                                                                             |
| `configSignals`        | いいえ | `object[]` | 認証プロファイルや環境変数なしで設定できる、ローカルまたはセルフホスト型プロバイダー向けの低コストな設定専用可用性シグナル。                                     |
| `authSignals`          | いいえ | `object[]` | 明示的な認証シグナル。指定した場合、プロバイダー ID、`aliases`、`authProviders` から生成されるデフォルトのシグナルセットを置き換えます。                          |
| `referenceAudioInputs` | いいえ | `boolean`  | 動画生成専用。プロバイダーが参照音声アセットを受け入れる場合は `true` に設定します。それ以外の場合、`video_generate` は音声参照パラメーターを非表示にします。 |

各 `configSignals` エントリでサポートされるフィールドは次のとおりです。

| フィールド       | 必須   | 型         | 意味                                                                                                                                                                                                                   |
| ---------------- | ------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | はい   | `string`   | 検査する Plugin 所有の設定オブジェクトへのドットパス。例: `plugins.entries.example.config`。                                                                                                                            |
| `overlayPath`    | いいえ | `string`   | シグナルを評価する前に、そのオブジェクトをルートオブジェクトに重ね合わせる、ルート設定内のドットパス。`image`、`video`、`music` など、機能固有の設定に使用します。                                                       |
| `overlayMapPath` | いいえ | `string`   | 各オブジェクト値をルートオブジェクトに重ね合わせる、ルート設定内のドットパス。設定済みの任意のアカウントを条件適合とする `accounts` など、名前付きアカウントマップに使用します。                                        |
| `required`       | いいえ | `string[]` | 設定済みの値が存在しなければならない、有効な設定内のドットパス。文字列は空であってはならず、オブジェクトと配列も空であってはなりません。                                                                                 |
| `requiredAny`    | いいえ | `string[]` | 少なくとも 1 つに設定済みの値が存在しなければならない、有効な設定内のドットパス。                                                                                                                                      |
| `mode`           | いいえ | `object`   | 有効な設定内のオプションの文字列モードガード。設定専用の可用性が 1 つのモードにのみ適用される場合に使用します。                                                                                                        |

各 `mode` ガードでサポートされるフィールドは次のとおりです。

| フィールド   | 必須   | 型         | 意味                                                                                   |
| ------------ | ------ | ---------- | -------------------------------------------------------------------------------------- |
| `path`       | いいえ | `string`   | 有効な設定内のドットパス。デフォルトは `mode` です。                                   |
| `default`    | いいえ | `string`   | 設定でパスが省略されている場合に使用するモード値。                                     |
| `allowed`    | いいえ | `string[]` | 指定した場合、有効なモードがこれらの値のいずれかである場合にのみシグナルが通過します。 |
| `disallowed` | いいえ | `string[]` | 指定した場合、有効なモードがこれらの値のいずれかであるとシグナルが失敗します。         |

各 `authSignals` エントリでサポートされるフィールドは次のとおりです。

| フィールド        | 必須   | 型       | 意味                                                                                                                                                              |
| ----------------- | ------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | はい   | `string` | 設定済みの認証プロファイル内で確認するプロバイダー ID。                                                                                                          |
| `providerBaseUrl` | いいえ | `object` | 参照先の設定済みプロバイダーが許可されたベース URL を使用している場合にのみシグナルを有効とするオプションのガード。認証エイリアスが特定の API でのみ有効な場合に使用します。 |

各 `providerBaseUrl` ガードでサポートされるフィールドは次のとおりです。

| フィールド        | 必須   | 型         | 意味                                                                                                                                                              |
| ----------------- | ------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | はい   | `string`   | `baseUrl` を確認するプロバイダー設定 ID。                                                                                                                         |
| `defaultBaseUrl`  | いいえ | `string`   | プロバイダー設定で `baseUrl` が省略されている場合に仮定するベース URL。                                                                                           |
| `allowedBaseUrls` | はい   | `string[]` | この認証シグナルで許可されるベース URL。設定済みまたはデフォルトのベース URL が、正規化されたこれらの値のいずれにも一致しない場合、シグナルは無視されます。         |

## ツールメタデータのリファレンス

`toolMetadata` は、ツール名をキーとして、生成プロバイダーメタデータと同じ形式の `configSignals` および `authSignals` を使用します。`contracts.tools` は所有権を宣言します。`toolMetadata` は低コストな可用性の根拠を宣言するため、OpenClaw はツールファクトリーから `null` が返されるかどうかを確認するだけのために Plugin ランタイムをインポートせずに済みます。

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

`toolMetadata` エントリは、前述の共通 `configSignals`/`authSignals` フィールドに加えて、`optional`（Plugin の有効化に必須ではないツールとしてマーク）と `replaySafe`（未完了のモデルターンの後にツール実行を繰り返しても安全であることを示すマーク）も受け入れます。

ツールに `toolMetadata` がない場合、OpenClaw は既存の動作を維持し、ツール契約がポリシーに一致すると、そのツールを所有する Plugin を読み込みます。ファクトリーが認証や設定に依存するホットパスのツールでは、Plugin 作成者は、確認のためにコアがランタイムをインポートするようにするのではなく、`toolMetadata` を宣言する必要があります。

## providerAuthChoices リファレンス

各 `providerAuthChoices` エントリは、1 つのオンボーディングまたは認証の選択肢を記述します。OpenClaw はプロバイダーランタイムが読み込まれる前にこれを読み取ります。プロバイダー設定リストでは、プロバイダーランタイムを読み込まずに、これらのマニフェスト選択肢、記述子から導出された設定選択肢、およびインストールカタログのメタデータを使用します。

| フィールド            | 必須 | 型                                                                    | 意味                                                                                                           |
| --------------------- | ---- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `provider`            | はい | `string`                                                              | この選択肢が属するプロバイダー ID。                                                                            |
| `method`              | はい | `string`                                                              | ディスパッチ先の認証メソッド ID。                                                                              |
| `choiceId`            | はい | `string`                                                              | オンボーディングおよび CLI フローで使用される安定した認証選択肢 ID。                                          |
| `choiceLabel`         | いいえ | `string`                                                            | ユーザー向けラベル。省略した場合、OpenClaw は `choiceId` にフォールバックします。                              |
| `choiceHint`          | いいえ | `string`                                                            | 選択画面用の短い補助テキスト。                                                                                 |
| `assistantPriority`   | いいえ | `number`                                                            | 値が小さいほど、アシスタント主導の対話型選択画面で先に並びます。                                               |
| `assistantVisibility` | いいえ | `"visible"` \| `"manual-only"`                                      | 手動での CLI 選択は許可したまま、アシスタントの選択画面ではこの選択肢を非表示にします。                        |
| `deprecatedChoiceIds` | いいえ | `string[]`                                                          | ユーザーをこの代替選択肢へリダイレクトする必要がある、旧来の選択肢 ID。                                       |
| `groupId`             | いいえ | `string`                                                            | 関連する選択肢をグループ化するための任意のグループ ID。                                                        |
| `groupLabel`          | いいえ | `string`                                                            | そのグループのユーザー向けラベル。                                                                             |
| `groupHint`           | いいえ | `string`                                                            | グループ用の短い補助テキスト。                                                                                 |
| `onboardingFeatured`  | いいえ | `boolean`                                                           | 対話型オンボーディング選択画面で、"More..." エントリより前の注目階層にこのグループを表示します。               |
| `optionKey`           | いいえ | `string`                                                            | 単一フラグによる簡易認証フロー用の内部オプションキー。                                                         |
| `cliFlag`             | いいえ | `string`                                                            | `--openrouter-api-key` などの CLI フラグ名。                                                                   |
| `cliOption`           | いいえ | `string`                                                            | `--openrouter-api-key <key>` などの完全な CLI オプション形式。                                                |
| `cliDescription`      | いいえ | `string`                                                            | CLI ヘルプで使用される説明。                                                                                   |
| `onboardingScopes`    | いいえ | `Array<"text-inference" \| "image-generation" \| "music-generation">` | この選択肢を表示するオンボーディング画面。省略した場合、既定値は `["text-inference"]` です。                   |

## commandAliases リファレンス

Plugin が所有するランタイムコマンド名を、ユーザーが誤って `plugins.allow` に設定したり、ルート CLI コマンドとして実行しようとしたりする可能性がある場合は、`commandAliases` を使用します。OpenClaw は Plugin のランタイムコードをインポートせずに、このメタデータを診断に使用します。

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

| フィールド   | 必須   | 型                | 意味                                                                          |
| ------------ | ------ | ----------------- | ----------------------------------------------------------------------------- |
| `name`       | はい   | `string`          | この Plugin に属するコマンド名。                                              |
| `kind`       | いいえ | `"runtime-slash"` | エイリアスがルート CLI コマンドではなく、チャットのスラッシュコマンドであることを示します。 |
| `cliCommand` | いいえ | `string`          | 存在する場合、CLI 操作用として提案する関連ルート CLI コマンド。                |

## activation リファレンス

Plugin が、どのコントロールプレーンイベントで自身をアクティベーション／ロード計画に含めるべきかを低コストで宣言できる場合は、`activation` を使用します。

このブロックはプランナー用メタデータであり、ライフサイクル API ではありません。ランタイム動作を登録せず、`register(...)` の代わりにもならず、Plugin コードがすでに実行済みであることも保証しません。アクティベーションプランナーは、`providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools`、フックなどの既存のマニフェスト所有権メタデータにフォールバックする前に、これらのフィールドを使用して候補 Plugin を絞り込みます。

所有権をすでに表現している最も限定的なメタデータを優先してください。`providers`、`channels`、`commandAliases`、セットアップ記述子、または `contracts` で関係を表現できる場合は、それらのフィールドを使用します。これらの所有権フィールドでは表現できない追加のプランナーヒントには、`activation` を使用します。`claude-cli`、`my-cli`、`google-gemini-cli` などの CLI ランタイムエイリアスにはトップレベルの `cliBackends` を使用してください。`activation.onAgentHarnesses` は、既存の所有権フィールドを持たない組み込みエージェントハーネス ID 専用です。

すべての Plugin は `activation.onStartup` を意図的に設定する必要があります。Gateway の起動中に Plugin を実行する必要がある場合にのみ、`true` に設定します。起動時に Plugin が何もせず、より限定的なトリガーからのみロードされるべき場合は、`false` に設定します。`onStartup` を省略しても、Plugin が暗黙的に起動時ロードされることはなくなりました。起動、チャネル、設定、エージェントハーネス、メモリ、その他のより限定的なアクティベーショントリガーには、明示的なアクティベーションメタデータを使用してください。

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

| フィールド         | 必須   | 型                                                   | 意味                                                                                                                                                                              |
| ------------------ | ------ | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | いいえ | `boolean`                                            | 明示的な Gateway 起動時アクティベーション。すべての Plugin が設定する必要があります。`true` は起動中に Plugin をインポートし、`false` は一致する別のトリガーによってロードが必要になるまで起動時の遅延ロードを維持します。 |
| `onProviders`      | いいえ | `string[]`                                           | この Plugin をアクティベーション／ロード計画に含めるプロバイダー ID。                                                                                                            |
| `onAgentHarnesses` | いいえ | `string[]`                                           | この Plugin をアクティベーション／ロード計画に含める組み込みエージェントハーネスのランタイム ID。CLI バックエンドエイリアスにはトップレベルの `cliBackends` を使用します。        |
| `onCommands`       | いいえ | `string[]`                                           | この Plugin をアクティベーション／ロード計画に含めるコマンド ID。                                                                                                                |
| `onChannels`       | いいえ | `string[]`                                           | この Plugin をアクティベーション／ロード計画に含めるチャネル ID。                                                                                                                |
| `onRoutes`         | いいえ | `string[]`                                           | この Plugin をアクティベーション／ロード計画に含めるルート種別。                                                                                                                 |
| `onConfigPaths`    | いいえ | `string[]`                                           | パスが存在し、明示的に無効化されていない場合に、この Plugin を起動／ロード計画に含めるルート相対の設定パス。                                                                      |
| `onCapabilities`   | いいえ | `Array<"provider" \| "channel" \| "tool" \| "hook">` | コントロールプレーンのアクティベーション計画で使用される広範なケイパビリティヒント。可能な場合は、より限定的なフィールドを優先してください。                                      |

現在の稼働中のコンシューマー:

- Gateway の起動計画では、明示的な起動時インポートに `activation.onStartup` を使用します。
- コマンドによってトリガーされる CLI 計画では、旧来の `commandAliases[].cliCommand` または `commandAliases[].name` にフォールバックします。
- エージェントランタイムの起動計画では、組み込みハーネスに `activation.onAgentHarnesses` を、CLI ランタイムエイリアスにトップレベルの `cliBackends[]` を使用します。
- チャネルによってトリガーされるセットアップ／チャネル計画では、明示的なチャネルアクティベーションメタデータがない場合、旧来の `channels[]` 所有権にフォールバックします。
- 起動時の Plugin 計画では、バンドルされたブラウザー Plugin の `browser` ブロックなど、チャネル以外のルート設定サーフェスに `activation.onConfigPaths` を使用します。
- プロバイダーによってトリガーされるセットアップ／ランタイム計画では、明示的なプロバイダーアクティベーションメタデータがない場合、旧来の `providers[]` およびトップレベルの `cliBackends[]` 所有権にフォールバックします。

プランナー診断では、明示的なアクティベーションヒントとマニフェスト所有権へのフォールバックを区別できます。たとえば、`activation-command-hint` は `activation.onCommands` が一致したことを意味し、`manifest-command-alias` はプランナーが代わりに `commandAliases` 所有権を使用したことを意味します。これらの理由ラベルはホスト診断とテスト用です。Plugin の作成者は、所有権を最も適切に表すメタデータを宣言し続ける必要があります。

## qaRunners リファレンス

Plugin が共有の `openclaw qa` ルート配下に 1 つ以上のトランスポートランナーを提供する場合は、
`qaRunners` を使用します。このメタデータは軽量かつ静的に保ってください。実際の CLI 登録は引き続き Plugin
ランタイムが、対応する `qaRunnerCliRegistrations` をエクスポートする軽量な
`runtime-api.ts` サーフェスを通じて所有します。任意の `adapterFactory` は、登録済みコマンドのランナーを
変更せずに、共有 QA シナリオへトランスポートを公開します。

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "使い捨てのホームサーバーに対して、Docker を利用する Matrix ライブ QA レーンを実行する"
    }
  ]
}
```

| フィールド    | 必須   | 型       | 意味                                                                                |
| ------------- | ------ | -------- | ----------------------------------------------------------------------------------- |
| `commandName` | はい   | `string` | `openclaw qa` 配下にマウントされるサブコマンド（例: `matrix`）。                    |
| `description` | いいえ | `string` | 共有ホストがスタブコマンドを必要とするときに使用される、フォールバック用ヘルプテキスト。 |

`adapterFactory` の id は `commandName` と一致する必要があります。マニフェストに存在しないコマンドの登録をエクスポートしないでください。

## setup リファレンス

ランタイムの読み込み前に、セットアップとオンボーディングのサーフェスで低コストな Plugin 所有メタデータが必要な場合は、`setup` を使用します。

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

トップレベルの `cliBackends` は引き続き有効であり、CLI 推論バックエンドを記述し続けます。`setup.cliBackends` は、メタデータのみで完結すべきコントロールプレーン／セットアップフロー向けの、セットアップ固有の記述子サーフェスです。

`setup.providers` と `setup.cliBackends` が存在する場合、セットアップ検出では記述子優先のルックアップサーフェスとして推奨されます。記述子が候補 Plugin を絞り込むだけで、セットアップ時にさらに高度なランタイムフックが必要な場合は、`requiresRuntime: true` を設定し、フォールバック実行パスとして `setup-api` を維持してください。

OpenClaw は、汎用プロバイダー認証および環境変数ルックアップにも `setup.providers[].envVars` を含めます。`providerAuthEnvVars` は非推奨期間中、互換性アダプターを介して引き続きサポートされますが、これをまだ使用している非バンドル Plugin にはマニフェスト診断が表示されます。新しい Plugin は、セットアップ／ステータス用の環境メタデータを `setup.providers[].envVars` に配置する必要があります。

請求または組織レベルの認証情報によって、推論用の認証情報にすることなく `resolveUsageAuth` を有効化する必要がある場合は、`providerUsageAuthEnvVars` を使用します。これらの名前は、ワークスペースの dotenv ブロック、ACP 子プロセスからの除去、サンドボックスのシークレットフィルタリング、広範なシークレットのスクラブ処理に追加されます。プロバイダーランタイムは引き続き `resolveUsageAuth` 内で値を読み取り、分類します。

セットアップエントリが利用できない場合、または `setup.requiresRuntime: false` によってセットアップランタイムが不要と宣言されている場合、OpenClaw は `setup.providers[].authMethods` から単純なセットアップ選択肢を導出することもできます。カスタムラベル、CLI フラグ、オンボーディングスコープ、アシスタントメタデータについては、明示的な `providerAuthChoices` エントリが引き続き優先されます。

これらの記述子がセットアップサーフェスに十分な場合にのみ、`requiresRuntime: false` を設定してください。OpenClaw は明示的な `false` を記述子のみの契約として扱い、セットアップのルックアップで `setup-api` または `openclaw.setupEntry` を実行しません。記述子のみの Plugin がこれらのセットアップランタイムエントリのいずれかを提供している場合でも、OpenClaw は追加診断を報告し、そのエントリを無視し続けます。`requiresRuntime` を省略すると従来のフォールバック動作が維持されるため、フラグなしで記述子を追加した既存の Plugin は破損しません。

セットアップのルックアップでは Plugin 所有の `setup-api` コードが実行される可能性があるため、正規化された `setup.providers[].id` と `setup.cliBackends[]` の値は、検出された Plugin 全体で一意でなければなりません。所有者が曖昧な場合、検出順序から優先対象を選ぶのではなく、フェイルクローズします。

セットアップランタイムが実行される場合、`setup-api` がマニフェスト記述子で宣言されていないプロバイダーまたは CLI バックエンドを登録したとき、または記述子に対応するランタイム登録がないとき、セットアップレジストリ診断は記述子の不一致を報告します。これらの診断は追加的なものであり、従来の Plugin を拒否しません。

### setup.providers リファレンス

| フィールド       | 必須   | 型         | 意味                                                                                     |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | はい     | `string`   | セットアップまたはオンボーディング中に公開されるプロバイダー id。正規化された id をグローバルに一意に保ちます。 |
| `authMethods`  | いいえ   | `string[]` | このプロバイダーがランタイム全体を読み込まずにサポートするセットアップ／認証方式の id。 |
| `envVars`      | いいえ   | `string[]` | Plugin ランタイムの読み込み前に、汎用セットアップ／ステータスサーフェスが確認できる環境変数。 |
| `authEvidence` | いいえ   | `object[]` | 非シークレットマーカーを通じて認証できるプロバイダー向けの、低コストなローカル認証証拠チェック。 |

`authEvidence` は、ランタイムコードを読み込まずに検証できる、プロバイダー所有のローカル認証情報マーカー用です。これらのチェックは低コストかつローカルに限定する必要があります。ネットワーク呼び出し、キーチェーンまたはシークレットマネージャーの読み取り、シェルコマンド、プロバイダー API のプローブは禁止です。

サポートされる証拠エントリ：

| フィールド           | 必須   | 型         | 意味                                                                                                           |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | はい     | `string`   | 現在は `local-file-with-env`。 |
| `fileEnvVar`       | いいえ   | `string`   | 明示的な認証情報ファイルパスを含む環境変数。 |
| `fallbackPaths`    | いいえ   | `string[]` | `fileEnvVar` が存在しないか空の場合に確認されるローカル認証情報ファイルパス。`${HOME}` と `${APPDATA}` をサポートします。 |
| `requiresAnyEnv`   | いいえ   | `string[]` | 証拠が有効になるには、一覧内の少なくとも1つの環境変数が空でない必要があります。 |
| `requiresAllEnv`   | いいえ   | `string[]` | 証拠が有効になるには、一覧内のすべての環境変数が空でない必要があります。 |
| `credentialMarker` | はい     | `string`   | 証拠が存在する場合に返される非シークレットマーカー。 |
| `source`           | いいえ   | `string`   | 認証／ステータス出力用のユーザー向けソースラベル。 |

### setup フィールド

| フィールド           | 必須   | 型         | 意味                                                                                        |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | いいえ   | `object[]` | セットアップとオンボーディング中に公開されるプロバイダーセットアップ記述子。 |
| `cliBackends`      | いいえ   | `string[]` | 記述子優先のセットアップルックアップに使用される、セットアップ時のバックエンド id。正規化された id をグローバルに一意に保ちます。 |
| `configMigrations` | いいえ   | `string[]` | この Plugin のセットアップサーフェスが所有する設定移行 id。 |
| `requiresRuntime`  | いいえ   | `boolean`  | 記述子のルックアップ後もセットアップで `setup-api` の実行が必要かどうか。 |

## uiHints リファレンス

`uiHints` は、設定フィールド名から小さなレンダリングヒントへのマップです。ネストされた設定フィールドにはドット区切りのキーを使用できますが、パスセグメントに `__proto__`、`constructor`、`prototype` を使用することはできません。セットアップはこれらの名前を拒否します。

```json
{
  "uiHints": {
    "apiKey": {
      "label": "APIキー",
      "help": "OpenRouterリクエストに使用",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

各フィールドヒントには以下を含められます：

| フィールド      | 型         | 意味                                    |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | ユーザー向けのフィールドラベル。 |
| `help`        | `string`   | 短いヘルプテキスト。 |
| `tags`        | `string[]` | 任意の UI タグ。 |
| `advanced`    | `boolean`  | フィールドを詳細設定として指定します。 |
| `sensitive`   | `boolean`  | フィールドをシークレットまたは機密情報として指定します。 |
| `placeholder` | `string`   | フォーム入力用のプレースホルダーテキスト。 |

## contracts リファレンス

OpenClaw が Plugin ランタイムをインポートせずに読み取れる静的な機能所有権メタデータにのみ、`contracts` を使用します。

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

各リストは任意です：

| フィールド                      | 型         | 意味                                                                                                                                 |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server 拡張ファクトリ ID。現在は `codex-app-server`。                                                                      |
| `agentToolResultMiddleware`      | `string[]` | この Plugin がツール結果ミドルウェアを登録できるランタイム ID。                                                                     |
| `trustedToolPolicies`            | `string[]` | インストール済み Plugin が登録できる、Plugin ローカルの信頼済み事前ツールポリシー ID。バンドル済み Plugin はこのフィールドなしでポリシーを登録できます。 |
| `externalAuthProviders`          | `string[]` | この Plugin が外部認証プロファイルフックを所有するプロバイダー ID。                                                                  |
| `embeddingProviders`             | `string[]` | メモリを含む再利用可能なベクトル埋め込み用途向けに、この Plugin が所有する汎用埋め込みプロバイダー ID。                               |
| `speechProviders`                | `string[]` | この Plugin が所有する音声プロバイダー ID。                                                                                          |
| `realtimeTranscriptionProviders` | `string[]` | この Plugin が所有するリアルタイム文字起こしプロバイダー ID。                                                                        |
| `realtimeVoiceProviders`         | `string[]` | この Plugin が所有するリアルタイム音声プロバイダー ID。                                                                              |
| `memoryEmbeddingProviders`       | `string[]` | この Plugin が所有する、非推奨のメモリ専用埋め込みプロバイダー ID。                                                                  |
| `mediaUnderstandingProviders`    | `string[]` | この Plugin が所有するメディア理解プロバイダー ID。                                                                                  |
| `transcriptSourceProviders`      | `string[]` | この Plugin が所有する文字起こしソースプロバイダー ID。                                                                              |
| `documentExtractors`             | `string[]` | この Plugin が所有する文書（PDF など）抽出プロバイダー ID。                                                                          |
| `imageGenerationProviders`       | `string[]` | この Plugin が所有する画像生成プロバイダー ID。                                                                                      |
| `videoGenerationProviders`       | `string[]` | この Plugin が所有する動画生成プロバイダー ID。                                                                                      |
| `musicGenerationProviders`       | `string[]` | この Plugin が所有する音楽生成プロバイダー ID。                                                                                      |
| `webContentExtractors`           | `string[]` | この Plugin が所有する Web ページコンテンツ抽出プロバイダー ID。                                                                     |
| `webFetchProviders`              | `string[]` | この Plugin が所有する Web フェッチプロバイダー ID。                                                                                 |
| `webSearchProviders`             | `string[]` | この Plugin が所有する Web 検索プロバイダー ID。                                                                                     |
| `workerProviders`                | `string[]` | プロビジョニングおよびプロファイルに基づくリースライフサイクル向けに、この Plugin が所有するクラウドワーカープロバイダー ID。          |
| `usageProviders`                 | `string[]` | この Plugin が使用量認証フックと使用量スナップショットフックを所有するプロバイダー ID。                                                |
| `migrationProviders`             | `string[]` | この Plugin が `openclaw migrate` 向けに所有するインポートプロバイダー ID。                                                          |
| `gatewayMethodDispatch`          | `string[]` | Gateway メソッドをプロセス内でディスパッチする、認証済み Plugin HTTP ルート用に予約された権限。                                       |
| `tools`                          | `string[]` | この Plugin が所有するエージェントツール名。                                                                                         |

`contracts.embeddedExtensionFactories` は、バンドル済みの Codex app-server 専用拡張ファクトリのために維持されています。バンドル済みのツール結果変換は、代わりに `contracts.agentToolResultMiddleware` を宣言し、`api.registerAgentToolResultMiddleware(...)` で登録する必要があります。インストール済み Plugin が同じミドルウェア接続点を使用できるのは、明示的に有効化され、かつ `contracts.agentToolResultMiddleware` で宣言したランタイムに対してのみです。

ホストが信頼する事前ツールポリシー層を必要とするインストール済み Plugin は、登録する各ローカル ID を `contracts.trustedToolPolicies` で宣言し、明示的に有効化される必要があります。バンドル済み Plugin では既存の信頼済みポリシーパスが維持されますが、宣言されていないポリシー ID を持つインストール済み Plugin は登録前に拒否されます。ポリシー ID のスコープは登録元の Plugin に限定されるため、2 つの Plugin がどちらも `workflow-budget` を宣言して登録できますが、単一の Plugin が同じローカル ID を 2 回登録することはできません。

ランタイムの `api.registerTool(...)` 登録は `contracts.tools` と一致する必要があります。ツール検出ではこのリストを使用し、要求されたツールを所有できる Plugin ランタイムのみを読み込みます。

`resolveExternalAuthProfiles` を実装するプロバイダー Plugin は、`contracts.externalAuthProviders` を宣言する必要があります。宣言されていない外部認証フックは無視されます。

`resolveUsageAuth` と `fetchUsageSnapshot` の両方を実装するプロバイダー Plugin は、自動検出される各プロバイダー ID を `contracts.usageProviders` で宣言する必要があります。使用量検出では、ランタイムコードを読み込む前にこのコントラクトを読み取り、宣言された所有者のみを読み込んだ後で両方のフックを検証します。

汎用埋め込みプロバイダーは、`api.registerEmbeddingProvider(...)` で登録する各アダプターについて `contracts.embeddingProviders` を宣言する必要があります。メモリ検索で使用されるプロバイダーを含む、再利用可能なベクトル生成には汎用コントラクトを使用してください。`contracts.memoryEmbeddingProviders` は非推奨のメモリ専用互換機能であり、既存のプロバイダーが汎用埋め込みプロバイダー接続点へ移行する間のみ維持されます。

ワーカープロバイダーは、各 `api.registerWorkerProvider(...)` ID を `contracts.workerProviders` で宣言する必要があります。コアは `provision` を呼び出す前に永続的な意図を保存します。プロバイダーは外部割り当ての前に設定を検証し、同じ操作 ID で繰り返し呼び出された場合は同じリースを引き継ぐ必要があります。コアは検証済みの設定スナップショットも保存し、名前付きプロファイルが変更または削除された後も含め、`leaseId` とともに `inspect({ leaseId, profile })` および `destroy({ leaseId, profile })` に渡します。破棄は冪等であり、検査はクローズドな `active` / `destroyed` / `unknown` ステータスの共用体を返します。また、SSH 秘密鍵マテリアルは `SecretRef` を介してのみ参照されます。プロビジョニングされた SSH エンドポイントには、信頼できるプロビジョニング出力から得た公開 `hostKey` も、ホスト名やコメントを含めず、正確に `algorithm base64` の形式で含める必要があります。これにより、コアは接続前にホストを固定できます。動的な ID 参照を発行するプロバイダーは、権威ある `resolveSshIdentity({ leaseId, profile, keyRef })` を実装できます。これを実装しないプロバイダーでは、コアの汎用シークレットリゾルバーが使用されます。権威ある `unknown` はアクティブなローカルレコードを孤立状態にします。破棄要求が保存された後では、これにより解体が確認されます。

`contracts.gatewayMethodDispatch` は現在 `"authenticated-request"` を受け付けます。これは、Gateway コントロールプレーンメソッドを意図的にプロセス内でディスパッチするネイティブ Plugin HTTP ルート向けの API 衛生ゲートであり、悪意のあるネイティブ Plugin に対するサンドボックスではありません。すでに Gateway HTTP 認証を必要とする、厳密にレビューされたバンドル済みまたはオペレーター向けのサーフェスにのみ使用してください。権限を付与されたルートが Gateway のルートワーク受付が閉じている間も到達可能になるのは、そのルートが `auth: "gateway"` とルート固有の `gatewayRuntimeScopeSurface: "trusted-operator"` も宣言している場合のみです。同じ Plugin の通常の兄弟ルートは、引き続き受付境界の内側に留まります。これにより、Plugin 全体に受付バイパスを付与することなく、一時停止状態と再開に到達できます。ディスパッチ外での解析とレスポンス整形は限定的に保ってください。実質的な処理や変更を伴う処理は、受付とスコープの適用を所有する Gateway メソッドディスパッチを経由する必要があります。

## configContracts リファレンス

Plugin ランタイムをインポートせずに汎用コアヘルパーが必要とする、マニフェスト所有の設定動作には `configContracts` を使用します。対象は、危険なフラグの検出、SecretRef 移行対象、レガシー設定パスの絞り込みです。

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

| フィールド                    | 必須     | 型         | 意味                                                                                                                                                                                                                                   |
| ----------------------------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compatibilityMigrationPaths` | いいえ   | `string[]` | この Plugin のセットアップ時の互換性移行が適用される可能性を示す、ルート相対の設定パス。設定が Plugin を参照していない場合、汎用ランタイム設定の読み取りで、すべての Plugin セットアップサーフェスを省略できるようにします。                |
| `compatibilityRuntimePaths`   | いいえ   | `string[]` | Plugin コードが完全に有効化される前に、この Plugin がランタイム中に処理できるルート相対の互換性パス。互換性のあるすべての Plugin ランタイムをインポートせずに、バンドル済み候補セットを絞り込む必要があるレガシーサーフェスに使用します。 |
| `dangerousFlags`              | いいえ   | `object[]` | 有効な場合に `openclaw doctor` が安全でない、または危険であると警告する必要がある設定リテラル。以下を参照してください。                                                                                                                   |
| `secretInputs`                | いいえ   | `object`   | SecretRef の移行および監査の対象レジストリが、シークレット形式の文字列として扱う必要がある `plugins.entries.<id>.config` 配下の設定パス。以下を参照してください。                                                                        |

各 `dangerousFlags` エントリは以下をサポートします。

| フィールド | 必須   | 型                                    | 意味                                                                                                                        |
| ---------- | ------ | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `path`     | はい   | `string`                              | `plugins.entries.<id>.config` からの相対的な、ドット区切りの設定パス。マップまたは配列のセグメントでは `*` ワイルドカードをサポートします。 |
| `equals`   | はい   | `string \| number \| boolean \| null` | この設定値を危険としてマークする正確なリテラル。                                                                            |

`secretInputs` は以下をサポートします。

| フィールド              | 必須 | 型         | 意味                                                                                                                                                                                                            |
| ----------------------- | ---- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundledDefaultEnabled` | いいえ | `boolean`  | この SecretRef サーフェスが有効かどうかを判断する際に、バンドルされた Plugin のデフォルト有効化設定を上書きします。Plugin がバンドルされているものの、設定で明示的に有効化されるまでサーフェスを無効のままにする場合に使用します。 |
| `paths`                 | はい | `object[]` | シークレット形式の設定パス。各要素には `path`（ドット区切りで、`plugins.entries.<id>.config` からの相対パス。`*` ワイルドカードをサポート）と、省略可能な `expected`（現在は `"string"` のみ）を指定します。 |

## mediaUnderstandingProviderMetadata リファレンス

メディア理解プロバイダーにデフォルトモデル、自動認証フォールバックの優先順位、または汎用コアヘルパーがランタイムのロード前に必要とするネイティブドキュメント対応がある場合は、`mediaUnderstandingProviderMetadata` を使用します。キーは `contracts.mediaUnderstandingProviders` にも宣言する必要があります。

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

各プロバイダーエントリには、次の項目を含められます。

| フィールド             | 型                                                               | 意味                                                                                                        |
| ---------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]`                              | このプロバイダーが公開するメディア機能。                                                                    |
| `defaultModels`        | `Record<string, string>`                                         | 設定でモデルが指定されていない場合に使用する、機能からモデルへのデフォルトマッピング。                       |
| `autoPriority`         | `Record<string, number>`                                         | 認証情報に基づくプロバイダーの自動フォールバックでは、数値が小さいほど先に並びます。                         |
| `nativeDocumentInputs` | `"pdf"[]`                                                        | プロバイダーがネイティブ対応するドキュメント入力。                                                           |
| `documentModels`       | `{ pdf?: { textExtraction?: string; image?: string \| false } }` | ドキュメントタイプごとのモデル上書き。該当するドキュメントタイプで画像ベースの抽出を無効にするには、`image: false` を設定します。 |

## channelConfigs リファレンス

チャンネル Plugin がランタイムのロード前に軽量な設定メタデータを必要とする場合は、`channelConfigs` を使用します。セットアップエントリが利用できない場合、または `setup.requiresRuntime: false` によってセットアップランタイムが不要と宣言されている場合、読み取り専用のチャンネルセットアップ／ステータス検出では、設定済みの外部チャンネルに対してこのメタデータを直接使用できます。

`channelConfigs` は Plugin マニフェストのメタデータであり、新しいトップレベルのユーザー設定セクションではありません。ユーザーは引き続き `channels.<channel-id>` でチャンネルインスタンスを設定します。OpenClaw は、Plugin のランタイムコードが実行される前に、設定済みチャンネルをどの Plugin が所有するかを判断するため、マニフェストのメタデータを読み取ります。

チャンネル Plugin では、`configSchema` と `channelConfigs` は異なるパスを記述します。

- `configSchema` は `plugins.entries.<plugin-id>.config` を検証します
- `channelConfigs.<channel-id>.schema` は `channels.<channel-id>` を検証します

`channels[]` を宣言する非バンドル Plugin は、対応する `channelConfigs` エントリも宣言する必要があります。宣言がなくても OpenClaw は Plugin をロードできますが、コールドパスの設定スキーマ、セットアップ、Control UI の各サーフェスは、Plugin ランタイムが実行されるまでチャンネル所有オプションの形式を認識できません。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` と `nativeSkillsAutoEnabled` では、チャンネルランタイムのロード前に実行されるコマンド設定チェック向けに、静的な `auto` デフォルトを宣言できます。バンドルされたチャンネルは、パッケージが所有する他のチャンネルカタログメタデータとともに、`package.json#openclaw.channel.commands` を介して同じデフォルトを公開することもできます。

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

各チャンネルエントリには、次の項目を含められます。

| フィールド    | 型                       | 意味                                                                                                     |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` の JSON Schema。宣言する各チャンネル設定エントリに必須です。                             |
| `uiHints`     | `Record<string, object>` | そのチャンネル設定セクション用の省略可能な UI ラベル、プレースホルダー、機密性のヒント。                 |
| `label`       | `string`                 | ランタイムメタデータの準備ができていない場合に、ピッカーおよび検査サーフェスへ統合されるチャンネルラベル。 |
| `description` | `string`                 | 検査およびカタログサーフェス向けの短いチャンネル説明。                                                   |
| `commands`    | `object`                 | ランタイム前の設定チェック向けの、ネイティブコマンドおよびネイティブ Skills の静的な自動デフォルト。     |
| `preferOver`  | `string[]`               | 選択サーフェスで、このチャンネルが優先すべきレガシーまたは低優先度の Plugin ID。                         |

### 別のチャンネル Plugin を置き換える

別の Plugin も提供できるチャンネル ID に対して、自分の Plugin を優先所有者にする場合は `preferOver` を使用します。一般的な例としては、名前が変更された Plugin ID、バンドルされた Plugin を置き換えるスタンドアロン Plugin、または設定互換性のために同じチャンネル ID を維持する、メンテナンス中のフォークがあります。

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

`channels.chat` が設定されている場合、OpenClaw はチャンネル ID と優先 Plugin ID の両方を考慮します。低優先度の Plugin が、バンドルされているかデフォルトで有効であるという理由だけで選択されていた場合、OpenClaw は有効なランタイム設定内でその Plugin を無効にし、1 つの Plugin がチャンネルとそのツールを所有するようにします。ユーザーによる明示的な選択は引き続き優先されます。ユーザーが両方の Plugin を明示的に有効化した場合（`plugins.allow` または実質的な `plugins.entries` 設定を使用）、OpenClaw は要求された Plugin セットを黙って変更せず、その選択を維持して、チャンネル／ツールの重複診断を報告します。

`preferOver` の対象は、実際に同じチャンネルを提供できる Plugin ID に限定してください。これは汎用的な優先度フィールドではなく、ユーザー設定キーの名前も変更しません。

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
- 非バンドル Plugin とバンドル Plugin が両方一致する場合、非バンドル Plugin が優先されます
- 残る曖昧さは、ユーザーまたは設定がプロバイダーを指定するまで無視されます

フィールド：

| フィールド      | 型         | 意味                                                                                  |
| --------------- | ---------- | ------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 短縮モデル ID に対して `startsWith` で照合されるプレフィックス。                     |
| `modelPatterns` | `string[]` | プロファイルサフィックスの削除後に、短縮モデル ID に対して照合される正規表現ソース。 |

`modelPatterns` のエントリは `compileSafeRegex` を通じてコンパイルされ、ネストした繰り返しを含むパターン（例：`(a+)+$`）は拒否されます。安全性チェックに失敗したパターンは、構文的に無効な正規表現と同様に、黙ってスキップされます。パターンは単純に保ち、ネストした量指定子を避けてください。

## modelCatalog リファレンス

Plugin ランタイムのロード前に、OpenClaw がプロバイダーモデルのメタデータを認識する必要がある場合は、`modelCatalog` を使用します。これは、固定カタログ行、プロバイダーエイリアス、抑制ルール、検出モードについて、マニフェストが所有する情報源です。ランタイムでの更新は引き続きプロバイダーのランタイムコードが担当しますが、ランタイムが必要となるタイミングはマニフェストによってコアに通知されます。

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
        "reason": "Azure OpenAI Responses では利用不可"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

トップレベルのフィールド：

| フィールド       | 型                                                       | 意味                                                                                                              |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | このPluginが所有するプロバイダー ID のカタログ行。キーは最上位の `providers` にも含める必要があります。          |
| `aliases`        | `Record<string, object>`                                 | カタログまたは抑制の計画時に、所有するプロバイダーとして解決されるプロバイダーエイリアス。                       |
| `suppressions`   | `object[]`                                               | プロバイダー固有の理由により、このPluginが抑制する別ソースのモデル行。                                           |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | プロバイダーカタログをマニフェストメタデータから読み取れるか、キャッシュへ更新できるか、ランタイムが必要か。     |
| `runtimeAugment` | `boolean`                                                | マニフェスト／設定の計画後にプロバイダーランタイムがカタログ行を追加する必要がある場合にのみ `true` にします。 |

`aliases` は、モデルカタログ計画のためのプロバイダー所有権検索に関与します。エイリアスの参照先は、同じPluginが所有する最上位プロバイダーでなければなりません。プロバイダーで絞り込まれたリストがエイリアスを使用する場合、OpenClawはプロバイダーランタイムを読み込まずに、所有元のマニフェストを読み取り、エイリアスの API／ベース URL オーバーライドを適用できます。エイリアスは、絞り込みのないカタログ一覧を展開しません。広範なリストでは、所有元の正規プロバイダー行のみが出力されます。

`suppressions` は、従来のプロバイダーランタイムの `suppressBuiltInModel` フックを置き換えます。抑制エントリが適用されるのは、プロバイダーがPluginによって所有されている場合、または所有するプロバイダーを参照する `modelCatalog.aliases` キーとして宣言されている場合のみです。モデル解決中にランタイム抑制フックが呼び出されることはなくなりました。

プロバイダーフィールド：

| フィールド            | 型                       | 意味                                                                                                                                                                                                                      |
| --------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`             | `string`                 | このプロバイダーカタログ内のモデルに対する、省略可能なデフォルトのベース URL。                                                                                                                                            |
| `api`                 | `ModelApi`               | このプロバイダーカタログ内のモデルに対する、省略可能なデフォルトの API アダプター。                                                                                                                                        |
| `headers`             | `Record<string, string>` | このプロバイダーカタログに適用される、省略可能な静的ヘッダー。                                                                                                                                                            |
| `defaultUtilityModel` | `string`                 | 短い内部ユーティリティタスク（タイトル、進捗の説明）向けにプロバイダーが推奨する、省略可能な小型モデル ID。`agents.defaults.utilityModel` が未設定で、このプロバイダーがエージェントのプライマリモデルを提供する場合に使用されます。 |
| `models`              | `object[]`               | 必須のモデル行。`id` のない行は無視されます。                                                                                                                                                                             |

モデルフィールド：

| フィールド         | 型                                                             | 意味                                                                                   |
| ------------------ | -------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `id`               | `string`                                                       | `provider/` プレフィックスを除いた、プロバイダー内のモデル ID。                        |
| `name`             | `string`                                                       | 省略可能な表示名。                                                                     |
| `api`              | `ModelApi`                                                     | 省略可能なモデル単位の API オーバーライド。                                            |
| `baseUrl`          | `string`                                                       | 省略可能なモデル単位のベース URL オーバーライド。                                      |
| `headers`          | `Record<string, string>`                                       | 省略可能なモデル単位の静的ヘッダー。                                                   |
| `input`            | `Array<"text" \| "image" \| "document">`                       | モデルが受け付けるモダリティ。その他の値は通知なく除外されます。                       |
| `reasoning`        | `boolean`                                                      | モデルが推論動作を公開するかどうか。                                                   |
| `contextWindow`    | `number`                                                       | プロバイダー固有のコンテキストウィンドウ。                                             |
| `contextTokens`    | `number`                                                       | `contextWindow` と異なる場合の、省略可能な実効ランタイムコンテキスト上限。             |
| `maxTokens`        | `number`                                                       | 判明している場合の最大出力トークン数。                                                 |
| `thinkingLevelMap` | `Record<string, string \| null>`                               | 省略可能な思考レベル単位のモデル ID またはパラメーターのオーバーライド。               |
| `cost`             | `object`                                                       | 省略可能な `tieredPricing` を含む、100 万トークン当たりの省略可能な USD 料金。          |
| `compat`           | `object`                                                       | OpenClawのモデル設定互換性に対応する、省略可能な互換性フラグ。                          |
| `mediaInput`       | `object`                                                       | モダリティ単位の省略可能な入力設定。現在は画像のみです。                               |
| `status`           | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 一覧でのステータス。その行を一切表示してはならない場合にのみ抑制します。                |
| `statusReason`     | `string`                                                       | 利用可能以外のステータスとともに表示される、省略可能な理由。                           |
| `replaces`         | `string[]`                                                     | このモデルが後継となる、以前のプロバイダー内モデル ID。                                |
| `replacedBy`       | `string`                                                       | 非推奨行の代替となるプロバイダー内モデル ID。                                          |
| `tags`             | `string[]`                                                     | 選択 UI とフィルターで使用される安定したタグ。                                         |

抑制フィールド：

| フィールド                 | 型         | 意味                                                                                                             |
| -------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | 抑制するアップストリーム行のプロバイダー ID。このPluginが所有するか、所有するエイリアスとして宣言されている必要があります。 |
| `model`                    | `string`   | 抑制するプロバイダー内モデル ID。                                                                                |
| `reason`                   | `string`   | 抑制された行が直接要求された場合に表示される、省略可能なメッセージ。                                            |
| `when.baseUrlHosts`        | `string[]` | 抑制の適用前に必要となる、実効プロバイダーベース URL ホストの省略可能なリスト。                                  |
| `when.providerConfigApiIn` | `string[]` | 抑制の適用前に必要となる、プロバイダー設定の完全一致する `api` 値の省略可能なリスト。                            |

`modelCatalog` にランタイム専用データを入れないでください。マニフェスト行が十分に完全で、プロバイダーで絞り込まれたリストや選択 UI がレジストリ／ランタイム探索を省略できる場合にのみ、`static` を使用します。マニフェスト行が一覧表示可能なシードまたは補足として有用であり、更新／キャッシュによって後からさらに行を追加できる場合は、`refreshable` を使用します。refreshable 行だけでは信頼できる情報源にはなりません。OpenClawが一覧を把握するためにプロバイダーランタイムを読み込む必要がある場合は、`runtime` を使用します。

## modelIdNormalization リファレンス

プロバイダーランタイムの読み込み前に行う必要がある、低コストでプロバイダー所有のモデル ID クリーンアップには、`modelIdNormalization` を使用します。これにより、短縮モデル名、プロバイダー内のレガシーモデル ID、プロキシのプレフィックスルールなどのエイリアスを、コアのモデル選択テーブルではなく、所有元Pluginのマニフェストに保持できます。

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

| フィールド                           | 型                      | 意味                                                                                             |
| ------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------ |
| `aliases`                            | `Record<string,string>` | 大文字と小文字を区別しない、モデル ID の完全一致エイリアス。値は記述されたとおりに返されます。  |
| `stripPrefixes`                      | `string[]`              | エイリアス検索前に削除するプレフィックス。レガシーなプロバイダー／モデルの重複に役立ちます。    |
| `prefixWhenBare`                     | `string`                | 正規化されたモデル ID に `/` がまだ含まれていない場合に追加するプレフィックス。                 |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | エイリアス検索後の条件付きベア ID プレフィックスルール。`modelPrefix` と `prefix` をキーとします。 |

## providerEndpoints リファレンス

プロバイダーランタイムの読み込み前に汎用リクエストポリシーが把握する必要があるエンドポイント分類には、`providerEndpoints` を使用します。各 `endpointClass` の意味は引き続きコアが所有し、ホストとベース URL のメタデータはPluginマニフェストが所有します。

正式に外部化されたプロバイダーPluginはコア配布物から除外されるため、
インストールされるまでそのマニフェストは参照できません。Pluginがなくても
エンドポイント分類が機能し続けるように、その `providerEndpoints` を
`scripts/lib/official-external-provider-catalog.json` にも反映する必要があります。
この対応関係はコントラクトテストによって強制されます。

エンドポイントフィールド：

| フィールド                     | 型         | 意味                                                                                           |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | `openrouter`、`moonshot-native`、`google-vertex` など、既知のコアエンドポイントクラス。        |
| `hosts`                        | `string[]` | エンドポイントクラスに対応する完全一致のホスト名。                                             |
| `hostSuffixes`                 | `string[]` | エンドポイントクラスに対応するホストサフィックス。ドメインサフィックスのみの照合には `.` を先頭に付けます。 |
| `baseUrls`                     | `string[]` | エンドポイントクラスに対応する、正規化された完全一致の HTTP(S) ベース URL。                    |
| `googleVertexRegion`           | `string`   | 完全一致するグローバルホスト用の静的な Google Vertex リージョン。                              |
| `googleVertexRegionHostSuffix` | `string`   | 一致するホストから取り除き、Google Vertex リージョンのプレフィックスを取得するためのサフィックス。 |

## providerRequest リファレンス

プロバイダーランタイムを読み込まずに汎用リクエストポリシーで必要となる、低コストなリクエスト互換性メタデータには `providerRequest` を使用します。動作固有のペイロード書き換えは、プロバイダーランタイムフックまたは共有のプロバイダーファミリーヘルパーに保持してください。

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

| フィールド            | 型           | 意味                                                                                   |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | 汎用リクエストの互換性判断と診断で使用されるプロバイダーファミリーラベル。             |
| `compatibilityFamily` | `"moonshot"` | 共有リクエストヘルパー用の、省略可能なプロバイダーファミリー互換性バケット。           |
| `openAICompletions`   | `object`     | OpenAI 互換の補完リクエストフラグ。現在は `supportsStreamingUsage`。                   |

## secretProviderIntegrations リファレンス

Plugin が再利用可能な SecretRef exec プロバイダープリセットを公開できる場合は、`secretProviderIntegrations` を使用します。OpenClaw は Plugin ランタイムが読み込まれる前にこのメタデータを読み取り、Plugin の所有権を `secrets.providers.<alias>.pluginIntegration` に保存し、実際のシークレット解決は SecretRef ランタイムに委ねます。プリセットは、バンドルされた Plugin、および git や ClawHub によるインストールなど、管理対象の Plugin インストールルートから検出されたインストール済み Plugin に対してのみ公開されます。

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

マップのキーはインテグレーション ID です。`providerAlias` を省略すると、OpenClaw はインテグレーション ID を SecretRef プロバイダーエイリアスとして使用します。プロバイダーエイリアスは、通常の SecretRef プロバイダーエイリアスパターン（例：`team-secrets`、`onepassword-work`）に一致する必要があります。

オペレーターがプリセットを選択すると、OpenClaw は次のようなプロバイダー参照を書き込みます：

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

起動時または再読み込み時に、OpenClaw は現在の Plugin マニフェストメタデータを読み込み、所有する Plugin がインストール済みかつ有効であることを確認し、マニフェストから exec コマンドを具体化することで、そのプロバイダーを解決します。Plugin を無効化または削除すると、有効な SecretRef に対するプロバイダーが取り消されます。スタンドアロンの exec 設定を使用したいオペレーターは、手動の `command`/`args` プロバイダーを直接記述することもできます。

現在サポートされているのは `source: "exec"` プリセットのみです。`command` は `${node}` でなければならず、`args[0]` は Plugin ルートからの相対パスである `./` で始まるリゾルバースクリプトでなければなりません。OpenClaw は起動時または再読み込み時に、これを現在の Node 実行可能ファイルと Plugin 内スクリプトの絶対パスへ具体化します。`--require`、`--import`、`--loader`、`--env-file`、`--eval`、`--print` などの Node オプションは、マニフェストプリセット契約には含まれません。Node 以外のコマンドが必要なオペレーターは、スタンドアロンの手動 exec プロバイダーを直接設定できます。

OpenClaw は、マニフェストプリセットの `trustedDirs` を Plugin ルートから導出し、`${node}` プリセットの場合は現在の Node 実行可能ファイルのディレクトリからも導出します。マニフェストで記述された `trustedDirs` は無視されます。`timeoutMs`、`noOutputTimeoutMs`、`maxOutputBytes`、`jsonOnly`、`env`、`passEnv`、`allowInsecurePath` など、その他の exec プロバイダーオプションは、通常の SecretRef exec プロバイダー設定にそのまま渡されます。

## modelPricing リファレンス

プロバイダーがランタイムの読み込み前にコントロールプレーンの価格設定動作を制御する必要がある場合は、`modelPricing` を使用します。Gateway の価格キャッシュは、プロバイダーランタイムコードをインポートせずにこのメタデータを読み取ります。

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

| フィールド   | 型                | 意味                                                                                                  |
| ------------ | ----------------- | ----------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | OpenRouter または LiteLLM の価格情報を決して取得すべきでないローカル／セルフホスト型プロバイダーでは `false` に設定します。 |
| `openRouter` | `false \| object` | OpenRouter の価格検索マッピング。`false` にすると、このプロバイダーの OpenRouter 検索が無効になります。 |
| `liteLLM`    | `false \| object` | LiteLLM の価格検索マッピング。`false` にすると、このプロバイダーの LiteLLM 検索が無効になります。       |

ソースフィールド：

| フィールド                 | 型                 | 意味                                                                                                           |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | OpenClaw のプロバイダー ID と異なる場合の外部カタログプロバイダー ID。例：`zai` プロバイダーに対する `z-ai`。 |
| `passthroughProviderModel` | `boolean`          | スラッシュを含むモデル ID を、ネストされたプロバイダー／モデル参照として扱います。OpenRouter などのプロキシプロバイダーに有用です。 |
| `modelIdTransforms`        | `"version-dots"[]` | 外部カタログ用の追加モデル ID バリアント。`version-dots` は `claude-opus-4.6` のようなドット区切りのバージョン ID を試します。 |

### OpenClaw プロバイダーインデックス

OpenClaw プロバイダーインデックスは、Plugin がまだインストールされていない可能性があるプロバイダー向けに OpenClaw が管理するプレビューメタデータです。これは Plugin マニフェストの一部ではありません。インストール済み Plugin の正式な情報源は、引き続き Plugin マニフェストです。プロバイダーインデックスは、プロバイダー Plugin がインストールされていない場合に、将来のインストール可能プロバイダー画面やインストール前のモデル選択画面が利用する内部フォールバック契約です。

カタログの優先順位：

1. ユーザー設定。
2. インストール済み Plugin マニフェストの `modelCatalog`。
3. 明示的な更新によるモデルカタログキャッシュ。
4. OpenClaw プロバイダーインデックスのプレビュー行。

プロバイダーインデックスには、シークレット、有効化状態、ランタイムフック、またはアカウント固有のライブモデルデータを含めてはなりません。プレビューカタログでは Plugin マニフェストと同じ `modelCatalog` プロバイダー行の形式を使用しますが、`api`、`baseUrl`、価格設定、互換性フラグなどのランタイムアダプターフィールドを、意図的にインストール済み Plugin マニフェストと整合させる場合を除き、安定した表示メタデータのみに限定すべきです。ライブの `/models` 検出を備えたプロバイダーは、通常の一覧表示やオンボーディングでプロバイダー API を呼び出すのではなく、明示的なモデルカタログキャッシュの経路を通じて更新済みの行を書き込む必要があります。

プロバイダーインデックスのエントリには、コアから移動したか、まだインストールされていないプロバイダー向けに、インストール可能な Plugin のメタデータを含めることもできます。このメタデータはチャンネルカタログのパターンを踏襲します。パッケージ名、npm インストール指定、期待される整合性、および低コストで取得できる認証選択肢のラベルがあれば、インストール可能なセットアップオプションを表示するには十分です。Plugin がインストールされると、そのマニフェストが優先され、そのプロバイダーのプロバイダーインデックスエントリは無視されます。

`openclaw doctor --fix` は、従来のトップレベルにある少数の限定されたマニフェスト機能キーを `contracts.*` に移行します：`speechProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`tools`。これらはいずれも（その他の機能リストも含めて）トップレベルのマニフェストフィールドとしては読み取られなくなりました。通常のマニフェスト読み込みでは、`contracts` 配下にある場合のみ認識されます。

## マニフェストと package.json の違い

2 つのファイルは異なる役割を担います：

| ファイル               | 用途                                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Plugin コードの実行前に存在している必要がある、検出、設定検証、認証選択肢メタデータ、UI ヒント                                  |
| `package.json`         | npm メタデータ、依存関係のインストール、およびエントリーポイント、インストール制御、セットアップ、カタログメタデータに使用される `openclaw` ブロック |

メタデータをどちらに配置すべきか不明な場合は、次のルールを使用してください：

- OpenClaw が Plugin コードを読み込む前に認識する必要がある場合は、`openclaw.plugin.json` に配置します
- パッケージング、エントリーファイル、または npm のインストール動作に関するものであれば、`package.json` に配置します

### 検出に影響する package.json フィールド

一部のランタイム前 Plugin メタデータは、意図的に `openclaw.plugin.json` ではなく、`package.json` の `openclaw` ブロックに配置されます。`openclaw.bundle` と `openclaw.bundle.json` は OpenClaw Plugin の契約ではありません。ネイティブ Plugin は、`openclaw.plugin.json` と、以下でサポートされている `package.json#openclaw` フィールドを使用する必要があります。

重要な例：

| フィールド                                                                                 | 意味                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                                      | ネイティブPluginのエントリポイントを宣言します。Pluginパッケージのディレクトリ内に置く必要があります。                                                                                       |
| `openclaw.runtimeExtensions`                                                               | インストール済みパッケージ用にビルドされたJavaScriptランタイムのエントリポイントを宣言します。Pluginパッケージのディレクトリ内に置く必要があります。                                         |
| `openclaw.setupEntry`                                                                      | オンボーディング、遅延チャネル起動、読み取り専用のチャネルステータスおよびSecretRef検出で使用される、軽量なセットアップ専用エントリポイントです。Pluginパッケージのディレクトリ内に置く必要があります。 |
| `openclaw.runtimeSetupEntry`                                                               | インストール済みパッケージ用にビルドされたJavaScriptセットアップエントリポイントを宣言します。`setupEntry`が必要で、実在し、Pluginパッケージのディレクトリ内に置く必要があります。             |
| `openclaw.channel`                                                                         | ラベル、ドキュメントパス、エイリアス、選択肢の説明文など、低コストで取得できるチャネルカタログのメタデータです。                                                                               |
| `openclaw.channel.commands`                                                                | チャネルランタイムが読み込まれる前に、設定、監査、コマンド一覧の各サーフェスで使用される、静的なネイティブコマンドおよびネイティブスキルの自動デフォルトメタデータです。                       |
| `openclaw.channel.configuredState`                                                         | チャネルランタイム全体を読み込まずに「環境変数のみのセットアップがすでに存在するか」に回答できる、軽量な設定済み状態チェッカーのメタデータです。                                             |
| `openclaw.channel.persistedAuthState`                                                      | チャネルランタイム全体を読み込まずに「すでにサインイン済みのものがあるか」に回答できる、軽量な永続化認証チェッカーのメタデータです。                                                         |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | バンドル済みおよび外部公開されたPluginのインストール／更新に関するヒントです。                                                                                                              |
| `openclaw.install.defaultChoice`                                                           | 複数のインストール元を利用できる場合に優先するインストールパスです。                                                                                                                         |
| `openclaw.install.minHostVersion`                                                          | サポートされるOpenClawホストの最小バージョンです。`>=2026.3.22`や`>=2026.5.1-beta.1`のようなsemverの下限を使用します。                                                                        |
| `openclaw.compat.pluginApi`                                                                | このパッケージに必要なOpenClaw Plugin APIの最小範囲です。`>=2026.5.27`のようなsemverの下限を使用します。                                                                                      |
| `openclaw.install.expectedIntegrity`                                                       | `sha512-...`などの想定されるnpm dist整合性文字列です。インストールおよび更新フローでは、取得したアーティファクトをこの値に照らして検証します。                                               |
| `openclaw.install.allowInvalidConfigRecovery`                                              | 設定が無効な場合に、限定的なバンドルPlugin再インストール復旧パスを許可します。                                                                                                              |
| `openclaw.install.requiredPlatformPackages`                                                | lockfileのプラットフォーム制約が現在のホストと一致する場合に実体化する必要があるnpmパッケージのエイリアスです。                                                                              |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | listen前にセットアップランタイムのチャネルサーフェスを読み込み、その後、設定済みチャネルPlugin全体の読み込みをlisten後の有効化まで遅延させます。                                            |

マニフェストのメタデータによって、ランタイムが読み込まれる前のオンボーディングに表示されるプロバイダー、チャネル、セットアップの選択肢が決まります。`package.json#openclaw.install`は、ユーザーがそれらの選択肢のいずれかを選んだとき、そのPluginを取得または有効化する方法をオンボーディングに指示します。インストールに関するヒントを`openclaw.plugin.json`へ移動しないでください。

`openclaw.install.minHostVersion`は、バンドルされていないPluginソースのインストール時およびマニフェストレジストリの読み込み時に適用されます。無効な値は拒否されます。有効ではあるものの新しい値の場合、古いホストでは外部Pluginがスキップされます。バンドルされたソースPluginは、ホストのチェックアウトと同じバージョンであると見なされます。

`openclaw.install.requiredPlatformPackages`は、オプションのプラットフォーム固有エイリアスを通じて必須のネイティブバイナリを公開するnpmパッケージ用です。サポートされる各プラットフォームエイリアスについて、修飾なしのnpmパッケージ名を列挙します。npmインストール中、OpenClawはlockfileの制約が現在のホストと一致する宣言済みエイリアスのみを検証します。npmが成功を報告してもそのエイリアスが欠落している場合、OpenClawは新しいキャッシュで一度だけ再試行し、それでもエイリアスが欠落していればインストールをロールバックします。

`openclaw.compat.pluginApi`は、バンドルされていないPluginソースのパッケージインストール時に適用されます。パッケージのビルド対象となったOpenClaw Plugin SDK／ランタイムAPIの下限に使用してください。Pluginパッケージが新しいAPIを必要としながら、他のフロー向けには低いインストールヒントを維持する場合、これは`minHostVersion`より厳しくできます。公式のOpenClawリリース同期では、既存の公式PluginのAPI下限をデフォルトでOpenClawのリリースバージョンまで引き上げますが、パッケージが意図的に古いホストをサポートする場合、Pluginのみのリリースでは低い下限を維持できます。パッケージバージョンだけを互換性契約として使用しないでください。`peerDependencies.openclaw`は引き続きnpmパッケージのメタデータです。OpenClawはインストール互換性の判定に`openclaw.compat.pluginApi`契約を使用します。

公式のオンデマンドインストール用メタデータでは、PluginがClawHubで公開されている場合に`clawhubSpec`を使用する必要があります。オンボーディングではこれを優先リモートソースとして扱い、インストール後にClawHubアーティファクトの情報を記録します。`npmSpec`は、まだClawHubへ移行していないパッケージ向けの互換性フォールバックとして残ります。

npmの正確なバージョン固定はすでに`npmSpec`に記述します。たとえば、`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`です。公式の外部カタログエントリでは、正確なspecを`expectedIntegrity`と組み合わせ、取得したnpmアーティファクトが固定されたリリースと一致しなくなった場合に更新フローがフェイルクローズするようにしてください。対話型オンボーディングでは、互換性のために、修飾なしのパッケージ名やdist-tagを含む信頼済みレジストリのnpm specを引き続き提示します。カタログ診断では、正確、可変、整合性固定済み、整合性欠落、パッケージ名不一致、無効なデフォルト選択のソースを区別できます。また、`expectedIntegrity`が存在するものの、それを固定できる有効なnpmソースがない場合にも警告します。`expectedIntegrity`が存在する場合、インストール／更新フローでそれを適用します。省略されている場合、レジストリの解決結果は整合性固定なしで記録されます。

ステータス、チャネル一覧、またはSecretRefスキャンで、ランタイム全体を読み込まずに設定済みアカウントを識別する必要がある場合、チャネルPluginは`openclaw.setupEntry`を提供する必要があります。セットアップエントリでは、チャネルのメタデータに加えて、セットアップで安全に使用できる設定、ステータス、シークレットのアダプターを公開してください。ネットワーククライアント、Gatewayリスナー、トランスポートランタイムはメインの拡張エントリポイントに保持してください。

ランタイムエントリポイントのフィールドは、ソースエントリポイントのフィールドに対するパッケージ境界チェックを上書きしません。たとえば、`openclaw.runtimeExtensions`を指定しても、パッケージ外へ脱出する`openclaw.extensions`パスを読み込み可能にはできません。

`openclaw.install.allowInvalidConfigRecovery`は意図的に限定されています。任意の壊れた設定をインストール可能にするものではありません。現在は、バンドルPluginのパスが欠落している場合や、同じバンドルPluginに対する古い`channels.<id>`エントリなど、特定の古いバンドルPluginのアップグレード失敗からインストールフローを復旧できるようにするだけです。無関係な設定エラーは引き続きインストールをブロックし、運用者を`openclaw doctor --fix`へ案内します。

`openclaw.channel.persistedAuthState`は、小さなチェッカーモジュール用のパッケージメタデータです。

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

セットアップ、doctor、ステータス、または読み取り専用の存在確認フローで、チャネルPlugin全体が読み込まれる前に低コストの認証有無プローブが必要な場合に使用します。永続化認証状態は、設定済みチャネル状態ではありません。このメタデータを、Pluginの自動有効化、ランタイム依存関係の修復、またはチャネルランタイムを読み込むべきかどうかの判定に使用しないでください。対象のexportは、永続化された状態のみを読み取る小さな関数にしてください。チャネルランタイム全体のbarrelを経由させないでください。

`openclaw.channel.configuredState`は、低コストの環境変数のみの設定済みチェックについて同じ形式に従います。

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

チャネルが環境変数またはその他の小さな非ランタイム入力から設定済み状態を判定できる場合に使用します。チェックに完全な設定解決または実際のチャネルランタイムが必要な場合は、そのロジックをPluginの`config.hasConfiguredState`フックに保持してください。

## 検出の優先順位（重複するPlugin ID）

OpenClawは3つのルートからPluginを検出し、次の順序で確認します。OpenClawに同梱されるバンドルPlugin、グローバルインストールルート（`~/.openclaw/extensions`）、現在のワークスペースルート（`<workspace>/.openclaw/extensions`）に加えて、明示的な`plugins.load.paths`エントリです。

2つの検出結果が同じ`id`を共有する場合、**最も優先順位の高い**マニフェストのみが保持され、優先順位の低い重複は並行して読み込まれず破棄されます。優先順位は高い順に次のとおりです。

1. **設定で選択済み** — `plugins.entries.<id>`で明示的に固定されたパス
2. **追跡対象のインストール記録と一致するグローバルインストール** — `openclaw plugin install`／`openclaw plugin update`を介してインストールされ、OpenClawのインストール追跡によって同じIDとして認識されるPlugin。IDがバンドルPluginにも属する場合を含みます
3. **バンドル済み** — OpenClawに同梱されるPlugin
4. **ワークスペース** — 現在のワークスペースを基準に検出されたPlugin
5. その他の検出候補

影響：

- ワークスペースまたはグローバルルートに追跡されずに置かれた、バンドルPluginのフォークまたは古いコピーが、バンドルビルドを隠すことはありません。
- バンドルPluginを上書きするには、そのIDに対して`openclaw plugin install`を実行し、追跡対象のグローバルインストールをバンドルコピーより優先させるか、`plugins.entries.<id>`で特定のパスを固定し、設定で選択済みの優先順位によって勝たせます。
- 重複の破棄はログに記録されるため、Doctorおよび起動診断で破棄されたコピーを示せます。
- 設定で選択された重複の上書きは、診断では明示的な上書きとして表現されますが、古いフォークや意図しない隠蔽を可視化したままにするため、引き続き警告されます。

## JSON Schemaの要件

- **すべてのPluginは JSON Schema を同梱する必要があります**。設定を受け付けない場合も同様です。
- 空のスキーマも使用できます（例: `{ "type": "object", "additionalProperties": false }`）。
- スキーマは実行時ではなく、設定の読み取り時と書き込み時に検証されます。
- バンドルされたPluginを新しい設定キーで拡張またはフォークする場合は、そのPluginの `openclaw.plugin.json` にある `configSchema` も同時に更新してください。バンドルされたPluginのスキーマは厳密であるため、`configSchema.properties` に `myNewKey` を追加せずにユーザー設定へ `plugins.entries.<id>.config.myNewKey` を追加すると、Pluginランタイムが読み込まれる前に拒否されます。

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

- 不明な `channels.*` キーは、チャンネル ID がPluginマニフェストで宣言されていない限り、**エラー**になります。同じ ID が `plugins.allow`、`plugins.entries`、または `plugins.installs` にも存在する場合（参照されているものの、現在は検出できないPlugin）、OpenClawは代わりにこれを**警告**へ格下げします。
- `plugins.entries.<id>`、`plugins.allow`、および `plugins.deny` が不明なPlugin IDを参照している場合、エラーではなく**警告**（「古い設定エントリは無視されました」）になります。これにより、アップグレードやPluginの削除・名前変更によってGatewayの起動が妨げられることはありません。
- `plugins.slots.memory` が不明なPlugin IDを参照している場合は**エラー**になります。ただし、既知の公式外部Pluginである `memory-lancedb` は例外で、代わりに警告になります。
- Pluginがインストールされていても、マニフェストまたはスキーマが破損しているか存在しない場合、検証は失敗し、DoctorにPluginエラーが表示されます。
- Pluginの設定が存在していても、そのPluginが**無効**の場合、設定は保持され、Doctorとログに**警告**が表示されます。

完全な `plugins.*` スキーマについては、[設定リファレンス](/ja-JP/gateway/configuration)を参照してください。

## 注記

- ローカルファイルシステムから読み込む場合も含め、マニフェストは**ネイティブOpenClaw Pluginに必須**です。ランタイムは引き続きPluginモジュールを別途読み込みます。マニフェストは検出と検証のみに使用されます。
- ネイティブマニフェストは JSON5 で解析されるため、最終的な値がオブジェクトである限り、コメント、末尾のカンマ、引用符なしのキーを使用できます。
- マニフェストローダーが読み取るのは、文書化されたマニフェストフィールドのみです。カスタムのトップレベルキーは使用しないでください。
- Pluginで不要な場合、`channels`、`providers`、`cliBackends`、および `skills` はすべて省略できます。
- `providerCatalogEntry` は軽量に保ち、広範なランタイムコードをインポートしないでください。リクエスト時の実行ではなく、静的なプロバイダーカタログのメタデータまたは限定的な検出記述子に使用してください。
- 排他的なPlugin種別は `plugins.slots.*` を介して選択されます。`kind: "memory"` は `plugins.slots.memory`（デフォルトは `memory-core`）、`kind: "context-engine"` は `plugins.slots.contextEngine`（デフォルトは `legacy`）を使用します。
- 排他的なPlugin種別はこのマニフェストで宣言してください。ランタイムエントリの `OpenClawPluginDefinition.kind` は非推奨であり、古いPlugin向けの互換性フォールバックとしてのみ残されています。
- 環境変数のメタデータ（`setup.providers[].envVars`、非推奨の `providerAuthEnvVars`、および `channelEnvVars`）は宣言専用です。ステータス、監査、Cron配信の検証、その他の読み取り専用サーフェスでは、環境変数を設定済みとして扱う前に、引き続きPluginの信頼ポリシーと有効化ポリシーが適用されます。
- プロバイダーコードを必要とするランタイムのウィザードメタデータについては、[プロバイダーランタイムフック](/ja-JP/plugins/architecture-internals#provider-runtime-hooks)を参照してください。
- Pluginがネイティブモジュールに依存する場合は、ビルド手順とパッケージマネージャーの許可リスト要件（例: pnpmの `allow-build-scripts` と `pnpm rebuild <package>`）を文書化してください。

## 関連項目

<CardGroup cols={3}>
  <Card title="Pluginの構築" href="/ja-JP/plugins/building-plugins" icon="rocket">
    Pluginを使い始める方法。
  </Card>
  <Card title="Pluginアーキテクチャ" href="/ja-JP/plugins/architecture" icon="diagram-project">
    内部アーキテクチャと機能モデル。
  </Card>
  <Card title="SDKの概要" href="/ja-JP/plugins/sdk-overview" icon="book">
    Plugin SDKのリファレンスとサブパスインポート。
  </Card>
</CardGroup>

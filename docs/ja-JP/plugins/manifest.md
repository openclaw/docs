---
read_when:
    - OpenClaw Pluginを作成しています
    - Plugin 設定スキーマを出荷するか、Plugin 検証エラーをデバッグする必要がある
summary: Plugin マニフェスト + JSON スキーマの要件（厳格な設定検証）
title: Plugin マニフェスト
x-i18n:
    generated_at: "2026-05-02T20:52:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2988275b976df8b883a4042ee389197e617d50e63f5a478ce248e7a643bb12fb
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

OpenClaw はこれらのバンドルレイアウトも自動検出しますが、ここで説明する `openclaw.plugin.json` スキーマに対しては検証されません。

互換バンドルでは、OpenClaw は現在、バンドルのメタデータに加えて、宣言された Skills ルート、Claude コマンドルート、Claude バンドルの `settings.json` デフォルト、Claude バンドルの LSP デフォルト、およびレイアウトが OpenClaw ランタイムの期待に一致する場合の対応済みフックパックを読み取ります。

すべての OpenClaw ネイティブ Plugin は、**Plugin ルート**に `openclaw.plugin.json` ファイルを含める必要があります。OpenClaw はこのマニフェストを使用して、**Plugin コードを実行せずに**設定を検証します。マニフェストが欠落しているか無効な場合は Plugin エラーとして扱われ、設定検証がブロックされます。

Plugin システム全体のガイドを参照してください: [Plugins](/ja-JP/tools/plugin)。
ネイティブのケイパビリティモデルと現在の外部互換性ガイダンスについては、次を参照してください:
[ケイパビリティモデル](/ja-JP/plugins/architecture#public-capability-model)。

## このファイルの役割

`openclaw.plugin.json` は、OpenClaw が**Plugin コードを読み込む前に**読み取るメタデータです。以下のすべては、Plugin ランタイムを起動せずに調査できる程度に軽量である必要があります。

**用途:**

- Plugin ID、設定検証、設定 UI ヒント
- 認証、オンボーディング、セットアップメタデータ（エイリアス、自動有効化、プロバイダー環境変数、認証選択肢）
- コントロールプレーン画面向けの有効化ヒント
- モデルファミリー所有権の短縮表記
- 静的なケイパビリティ所有権スナップショット（`contracts`）
- 共有 `openclaw qa` ホストが調査できる QA ランナーメタデータ
- カタログと検証画面にマージされるチャネル固有の設定メタデータ

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

| フィールド                         | 必須     | 型                               | 意味                                                                                                                                                                                                                                  |
| ------------------------------------ | -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | はい     | `string`                         | 正規のPlugin ID。これは `plugins.entries.<id>` で使用されるIDです。                                                                                                                                                                  |
| `configSchema`                       | はい     | `object`                         | このPluginの設定用インラインJSON Schema。                                                                                                                                                                                           |
| `enabledByDefault`                   | いいえ   | `true`                           | バンドル済みPluginをデフォルトで有効としてマークします。省略するか、`true` 以外の値を設定すると、そのPluginはデフォルトで無効のままになります。                                                                                      |
| `legacyPluginIds`                    | いいえ   | `string[]`                       | この正規Plugin IDに正規化されるレガシーID。                                                                                                                                                                                         |
| `autoEnableWhenConfiguredProviders`  | いいえ   | `string[]`                       | 認証、設定、またはモデル参照で言及されたときに、このPluginを自動的に有効にするべきプロバイダーID。                                                                                                                                   |
| `kind`                               | いいえ   | `"memory"` \| `"context-engine"` | `plugins.slots.*` で使用される排他的なPlugin種別を宣言します。                                                                                                                                                                       |
| `channels`                           | いいえ   | `string[]`                       | このPluginが所有するチャンネルID。検出と設定検証に使用されます。                                                                                                                                                                    |
| `providers`                          | いいえ   | `string[]`                       | このPluginが所有するプロバイダーID。                                                                                                                                                                                                |
| `providerDiscoveryEntry`             | いいえ   | `string`                         | Pluginルートからの相対パスで指定する軽量なプロバイダー検出モジュールパス。完全なPluginランタイムを有効化せずに読み込める、マニフェストスコープのプロバイダーカタログメタデータに使います。                                           |
| `modelSupport`                       | いいえ   | `object`                         | ランタイム前にPluginを自動読み込みするために使用される、マニフェスト所有のモデルファミリー略記メタデータ。                                                                                                                          |
| `modelCatalog`                       | いいえ   | `object`                         | このPluginが所有するプロバイダー向けの宣言的モデルカタログメタデータ。これは、Pluginランタイムを読み込まずに将来の読み取り専用一覧、オンボーディング、モデルピッカー、エイリアス、抑制を行うためのコントロールプレーン契約です。     |
| `modelPricing`                       | いいえ   | `object`                         | プロバイダー所有の外部価格検索ポリシー。ローカルまたはセルフホストのプロバイダーをリモート価格カタログから除外したり、コアにプロバイダーIDをハードコードせずにプロバイダー参照をOpenRouter/LiteLLMカタログIDへマップしたりできます。 |
| `modelIdNormalization`               | いいえ   | `object`                         | プロバイダーランタイムが読み込まれる前に実行する必要がある、プロバイダー所有のモデルIDエイリアス/プレフィックス整理。                                                                                                               |
| `providerEndpoints`                  | いいえ   | `object[]`                       | プロバイダーランタイムが読み込まれる前にコアが分類する必要がある、プロバイダールート向けのマニフェスト所有エンドポイントhost/baseUrlメタデータ。                                                                                    |
| `providerRequest`                    | いいえ   | `object`                         | プロバイダーランタイムが読み込まれる前に、汎用リクエストポリシーで使用される安価なプロバイダーファミリーおよびリクエスト互換性メタデータ。                                                                                           |
| `cliBackends`                        | いいえ   | `string[]`                       | このPluginが所有するCLI推論バックエンドID。明示的な設定参照からの起動時自動有効化に使用されます。                                                                                                                                   |
| `syntheticAuthRefs`                  | いいえ   | `string[]`                       | ランタイムが読み込まれる前のコールドモデル検出中に、Plugin所有の合成認証フックを調べるべきプロバイダーまたはCLIバックエンド参照。                                                                                                   |
| `nonSecretAuthMarkers`               | いいえ   | `string[]`                       | 非シークレットのローカル、OAuth、または環境由来の認証情報状態を表す、バンドル済みPlugin所有のプレースホルダーAPIキー値。                                                                                                            |
| `commandAliases`                     | いいえ   | `object[]`                       | ランタイムが読み込まれる前に、Pluginを認識した設定およびCLI診断を生成するべき、このPluginが所有するコマンド名。                                                                                                                     |
| `providerAuthEnvVars`                | いいえ   | `Record<string, string[]>`       | プロバイダー認証/ステータス検索用の非推奨互換環境メタデータ。新しいPluginでは `setup.providers[].envVars` を優先してください。OpenClawは非推奨期間中もこれを読み取ります。                                                          |
| `providerAuthAliases`                | いいえ   | `Record<string, string>`         | 認証検索で別のプロバイダーIDを再利用するべきプロバイダーID。たとえば、ベースプロバイダーのAPIキーと認証プロファイルを共有するコーディングプロバイダーなどです。                                                                      |
| `channelEnvVars`                     | いいえ   | `Record<string, string[]>`       | OpenClawがPluginコードを読み込まずに検査できる安価なチャンネル環境メタデータ。汎用の起動/設定ヘルパーが参照するべき、環境駆動のチャンネルセットアップまたは認証サーフェスに使用します。                                             |
| `providerAuthChoices`                | いいえ   | `object[]`                       | オンボーディングピッカー、優先プロバイダー解決、単純なCLIフラグ配線に使う安価な認証選択肢メタデータ。                                                                                                                              |
| `activation`                         | いいえ   | `object`                         | 起動、プロバイダー、コマンド、チャンネル、ルート、能力トリガーの読み込みに使う安価な有効化プランナーメタデータ。メタデータのみです。実際の動作は引き続きPluginランタイムが所有します。                                             |
| `setup`                              | いいえ   | `object`                         | 検出およびセットアップサーフェスがPluginランタイムを読み込まずに検査できる、安価なセットアップ/オンボーディング記述子。                                                                                                             |
| `qaRunners`                          | いいえ   | `object[]`                       | Pluginランタイムが読み込まれる前に共有の `openclaw qa` ホストで使用される、安価なQAランナー記述子。                                                                                                                                 |
| `contracts`                          | いいえ   | `object`                         | 外部認証フック、音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像生成、音楽生成、動画生成、web-fetch、web検索、ツール所有権に関する静的な能力所有スナップショット。                                                |
| `mediaUnderstandingProviderMetadata` | いいえ   | `Record<string, object>`         | `contracts.mediaUnderstandingProviders` で宣言されたプロバイダーID向けの安価なメディア理解デフォルト。                                                                                                                              |
| `imageGenerationProviderMetadata`    | いいえ   | `Record<string, object>`         | `contracts.imageGenerationProviders` で宣言されたプロバイダーID向けの安価な画像生成認証メタデータ。プロバイダー所有の認証エイリアスとbase-urlガードを含みます。                                                                      |
| `videoGenerationProviderMetadata`    | いいえ   | `Record<string, object>`         | `contracts.videoGenerationProviders` で宣言されたプロバイダーID向けの安価な動画生成認証メタデータ。プロバイダー所有の認証エイリアスとbase-urlガードを含みます。                                                                      |
| `musicGenerationProviderMetadata`    | いいえ   | `Record<string, object>`         | `contracts.musicGenerationProviders` で宣言されたプロバイダーID向けの安価な音楽生成認証メタデータ。プロバイダー所有の認証エイリアスとbase-urlガードを含みます。                                                                      |
| `toolMetadata`                       | いいえ   | `Record<string, object>`         | `contracts.tools` で宣言されたPlugin所有ツール向けの安価な可用性メタデータ。設定、環境、または認証の証拠が存在しない限り、ツールがランタイムを読み込むべきでない場合に使用します。                                                  |
| `channelConfigs`                     | いいえ   | `Record<string, object>`         | ランタイムが読み込まれる前に検出および検証サーフェスへマージされる、マニフェスト所有のチャンネル設定メタデータ。                                                                                                                    |
| `skills`                             | いいえ   | `string[]`                       | Pluginルートからの相対パスで指定する、読み込むSkillディレクトリ。                                                                                                                                                                   |
| `name`                               | いいえ   | `string`                         | 人間が読めるPlugin名。                                                                                                                                                                                                               |
| `description`                        | いいえ       | `string`                         | Plugin サーフェスに表示される短い概要。                                                                                                                                                                                             |
| `version`                            | いいえ       | `string`                         | 情報提供用の Plugin バージョン。                                                                                                                                                                                                       |
| `uiHints`                            | いいえ       | `Record<string, object>`         | 設定フィールドの UI ラベル、プレースホルダー、機密性ヒント。                                                                                                                                                                   |

## 生成プロバイダーメタデータリファレンス

生成プロバイダーメタデータフィールドは、対応する `contracts.*GenerationProviders` リストで宣言されたプロバイダーの静的な認証シグナルを記述します。
OpenClaw はプロバイダーランタイムを読み込む前にこれらのフィールドを読み取るため、コアツールはすべてのプロバイダープラグインをインポートしなくても、生成プロバイダーが利用可能かどうかを判断できます。

これらのフィールドは、低コストで宣言的な事実にのみ使用してください。トランスポート、リクエスト変換、トークン更新、認証情報の検証、実際の生成動作はプラグインランタイムに置きます。

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

| フィールド      | 必須 | 型         | 意味                                                                                                                                 |
| --------------- | ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `aliases`       | いいえ | `string[]` | 生成プロバイダーの静的な認証エイリアスとして扱う追加のプロバイダー ID。                                                            |
| `authProviders` | いいえ | `string[]` | 設定済みの認証プロファイルがこの生成プロバイダーの認証として扱われるプロバイダー ID。                                              |
| `configSignals` | いいえ | `object[]` | 認証プロファイルや環境変数なしで設定できる、ローカルまたはセルフホスト型プロバイダー向けの低コストな設定のみの可用性シグナル。     |
| `authSignals`   | いいえ | `object[]` | 明示的な認証シグナル。存在する場合、プロバイダー ID、`aliases`、`authProviders` から作られるデフォルトのシグナルセットを置き換えます。 |

各 `configSignals` エントリは次をサポートします。

| フィールド    | 必須 | 型         | 意味                                                                                                                                                                          |
| ------------- | ---- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | はい | `string`   | 検査するプラグイン所有の設定オブジェクトへのドットパス。例: `plugins.entries.example.config`。                                                                                |
| `overlayPath` | いいえ | `string`   | シグナルを評価する前にルートオブジェクトへ重ねる、ルート設定内のオブジェクトへのドットパス。`image`、`video`、`music` など、機能固有の設定に使用します。                    |
| `required`    | いいえ | `string[]` | 有効な設定内で、設定済みの値を持っている必要があるドットパス。文字列は空であってはならず、オブジェクトと配列も空であってはなりません。                                      |
| `requiredAny` | いいえ | `string[]` | 有効な設定内で、少なくとも 1 つが設定済みの値を持っている必要があるドットパス。                                                                                              |
| `mode`        | いいえ | `object`   | 有効な設定内の任意の文字列モードガード。設定のみの可用性が 1 つのモードにのみ適用される場合に使用します。                                                                    |

各 `mode` ガードは次をサポートします。

| フィールド     | 必須 | 型         | 意味                                                                                  |
| ------------ | ---- | ---------- | ------------------------------------------------------------------------------------- |
| `path`       | いいえ | `string`   | 有効な設定内のドットパス。デフォルトは `mode`。                                      |
| `default`    | いいえ | `string`   | 設定でパスが省略された場合に使用するモード値。                                      |
| `allowed`    | いいえ | `string[]` | 存在する場合、有効なモードがこれらの値のいずれかである場合にのみシグナルが通ります。 |
| `disallowed` | いいえ | `string[]` | 存在する場合、有効なモードがこれらの値のいずれかである場合にシグナルが失敗します。   |

各 `authSignals` エントリは次をサポートします。

| フィールド        | 必須 | 型       | 意味                                                                                                                                                 |
| ----------------- | ---- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | はい | `string` | 設定済みの認証プロファイルで確認するプロバイダー ID。                                                                                              |
| `providerBaseUrl` | いいえ | `object` | 参照される設定済みプロバイダーが許可されたベース URL を使用している場合にのみシグナルを有効にする任意のガード。認証エイリアスが特定の API でのみ有効な場合に使用します。 |

各 `providerBaseUrl` ガードは次をサポートします。

| フィールド          | 必須 | 型         | 意味                                                                                                                                           |
| ----------------- | ---- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | はい | `string`   | `baseUrl` を確認するプロバイダー設定 ID。                                                                                                      |
| `defaultBaseUrl`  | いいえ | `string`   | プロバイダー設定で `baseUrl` が省略された場合に仮定するベース URL。                                                                           |
| `allowedBaseUrls` | はい | `string[]` | この認証シグナルで許可されるベース URL。設定済みまたはデフォルトのベース URL がこれらの正規化された値のいずれにも一致しない場合、シグナルは無視されます。 |

## ツールメタデータリファレンス

`toolMetadata` は、ツール名をキーとして、生成プロバイダーメタデータと同じ `configSignals` および `authSignals` の形を使用します。`contracts.tools` は所有権を宣言します。`toolMetadata` は低コストな可用性の証拠を宣言するため、OpenClaw はツールファクトリが `null` を返すかどうかを確認するためだけにプラグインランタイムをインポートすることを避けられます。

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

ツールに `toolMetadata` がない場合、OpenClaw は既存の動作を維持し、ツール契約がポリシーに一致したときに所有元プラグインを読み込みます。ファクトリが認証や設定に依存するホットパスのツールでは、プラグイン作成者は、問い合わせのためにコアがランタイムをインポートするようにするのではなく、`toolMetadata` を宣言するべきです。

## providerAuthChoices リファレンス

各 `providerAuthChoices` エントリは、1 つのオンボーディングまたは認証の選択肢を記述します。
OpenClaw はプロバイダーランタイムを読み込む前にこれを読み取ります。
プロバイダーセットアップリストは、プロバイダーランタイムを読み込まずに、これらのマニフェスト上の選択肢、ディスクリプター由来のセットアップ選択肢、インストールカタログメタデータを使用します。

| フィールド              | 必須 | 型                                              | 意味                                                                                                  |
| --------------------- | ---- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `provider`            | はい | `string`                                        | この選択肢が属するプロバイダー ID。                                                                  |
| `method`              | はい | `string`                                        | ディスパッチ先の認証メソッド ID。                                                                    |
| `choiceId`            | はい | `string`                                        | オンボーディングと CLI フローで使用される安定した認証選択肢 ID。                                      |
| `choiceLabel`         | いいえ | `string`                                        | ユーザー向けラベル。省略した場合、OpenClaw は `choiceId` にフォールバックします。                    |
| `choiceHint`          | いいえ | `string`                                        | ピッカー用の短い補助テキスト。                                                                        |
| `assistantPriority`   | いいえ | `number`                                        | 値が小さいほど、アシスタント駆動のインタラクティブピッカーで先に並びます。                            |
| `assistantVisibility` | いいえ | `"visible"` \| `"manual-only"`                  | 手動の CLI 選択は許可したまま、アシスタントピッカーから選択肢を隠します。                            |
| `deprecatedChoiceIds` | いいえ | `string[]`                                      | この置き換え後の選択肢へユーザーをリダイレクトする必要があるレガシー選択肢 ID。                      |
| `groupId`             | いいえ | `string`                                        | 関連する選択肢をグループ化するための任意のグループ ID。                                              |
| `groupLabel`          | いいえ | `string`                                        | そのグループのユーザー向けラベル。                                                                    |
| `groupHint`           | いいえ | `string`                                        | グループ用の短い補助テキスト。                                                                        |
| `optionKey`           | いいえ | `string`                                        | 単純な 1 フラグ認証フロー用の内部オプションキー。                                                     |
| `cliFlag`             | いいえ | `string`                                        | `--openrouter-api-key` などの CLI フラグ名。                                                          |
| `cliOption`           | いいえ | `string`                                        | `--openrouter-api-key <key>` などの完全な CLI オプション形式。                                        |
| `cliDescription`      | いいえ | `string`                                        | CLI ヘルプで使用される説明。                                                                          |
| `onboardingScopes`    | いいえ | `Array<"text-inference" \| "image-generation">` | この選択肢を表示するオンボーディング画面。省略した場合、デフォルトは `["text-inference"]` です。       |

## commandAliases リファレンス

`plugins.allow` に誤って入れられたり、ルート CLI コマンドとして実行されようとしたりする可能性があるランタイムコマンド名を Plugin が所有している場合は、`commandAliases` を使用します。OpenClaw
は Plugin のランタイムコードをインポートせずに、診断のためにこのメタデータを使用します。

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
| `kind`       | いいえ       | `"runtime-slash"` | ルート CLI コマンドではなく、チャットスラッシュコマンドとしてエイリアスを示します。 |
| `cliCommand` | いいえ       | `string`          | CLI 操作向けに提案する関連ルート CLI コマンド。存在する場合のみ。  |

## activation リファレンス

Plugin が、どの control-plane イベントでアクティベーション/ロード計画に含めるべきかを低コストで宣言できる場合は、`activation` を使用します。

このブロックはプランナーのメタデータであり、ライフサイクル API ではありません。ランタイム動作を登録せず、`register(...)` を置き換えず、Plugin コードがすでに実行済みであることも保証しません。アクティベーションプランナーは、既存のマニフェスト所有権メタデータ（`providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools`、フックなど）にフォールバックする前に、これらのフィールドを使用して候補 Plugin を絞り込みます。

所有権をすでに表す最も狭いメタデータを優先してください。その関係を表現できる場合は、`providers`、`channels`、`commandAliases`、セットアップ記述子、または `contracts`
を使用します。これらの所有権フィールドで表現できない追加のプランナーヒントには、`activation` を使用します。
`claude-cli`、`codex-cli`、`google-gemini-cli` などの CLI ランタイムエイリアスにはトップレベルの `cliBackends` を使用します。`activation.onAgentHarnesses` は、所有権フィールドがまだない組み込みエージェントハーネス ID 専用です。

このブロックはメタデータのみです。ランタイム動作を登録せず、`register(...)`、`setupEntry`、その他のランタイム/Plugin エントリーポイントを置き換えません。現在の利用側は、より広い Plugin ロードの前に絞り込みヒントとして使用するため、起動時以外のアクティベーションメタデータが不足していても、通常はパフォーマンスに影響するだけです。マニフェスト所有権フォールバックが残っている限り、正しさは変わらないはずです。

すべての Plugin は `activation.onStartup` を意図的に設定する必要があります。Gateway 起動中に Plugin を実行する必要がある場合のみ `true`
に設定します。起動時に Plugin が不活性で、より狭いトリガーからのみロードされるべき場合は `false` に設定します。
`onStartup` を省略しても、Plugin は暗黙的に起動時ロードされなくなりました。起動、チャネル、設定、エージェントハーネス、メモリ、またはその他のより狭いアクティベーショントリガーには、明示的なアクティベーションメタデータを使用してください。

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
| `onStartup`        | いいえ       | `boolean`                                            | 明示的な Gateway 起動時アクティベーション。すべての Plugin がこれを設定する必要があります。`true` は起動中に Plugin をインポートします。`false` は、別の一致したトリガーがロードを要求しない限り、起動時遅延のままにします。 |
| `onProviders`      | いいえ       | `string[]`                                           | アクティベーション/ロード計画にこの Plugin を含めるべきプロバイダー ID。                                                                                                                      |
| `onAgentHarnesses` | いいえ       | `string[]`                                           | アクティベーション/ロード計画にこの Plugin を含めるべき組み込みエージェントハーネスランタイム ID。CLI バックエンドエイリアスにはトップレベルの `cliBackends` を使用します。                                           |
| `onCommands`       | いいえ       | `string[]`                                           | アクティベーション/ロード計画にこの Plugin を含めるべきコマンド ID。                                                                                                                       |
| `onChannels`       | いいえ       | `string[]`                                           | アクティベーション/ロード計画にこの Plugin を含めるべきチャネル ID。                                                                                                                       |
| `onRoutes`         | いいえ       | `string[]`                                           | アクティベーション/ロード計画にこの Plugin を含めるべきルート種別。                                                                                                                       |
| `onConfigPaths`    | いいえ       | `string[]`                                           | パスが存在し、明示的に無効化されていない場合に、起動/ロード計画にこの Plugin を含めるべきルート相対の設定パス。                                                      |
| `onCapabilities`   | いいえ       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | control-plane アクティベーション計画で使用される広範なケイパビリティヒント。可能な場合は、より狭いフィールドを優先してください。                                                                                     |

現在のライブ利用側:

- Gateway 起動計画は、明示的な起動時インポートに `activation.onStartup` を使用します
- コマンドによってトリガーされる CLI 計画は、レガシーの
  `commandAliases[].cliCommand` または `commandAliases[].name` にフォールバックします
- エージェントランタイム起動計画は、組み込みハーネスに `activation.onAgentHarnesses` を使用し、CLI ランタイムエイリアスにトップレベルの `cliBackends[]` を使用します
- チャネルによってトリガーされるセットアップ/チャネル計画は、明示的なチャネルアクティベーションメタデータがない場合、レガシーの `channels[]`
  所有権にフォールバックします
- 起動時 Plugin 計画は、バンドルされたブラウザー Plugin の `browser` ブロックのようなチャネル以外のルート設定サーフェスに `activation.onConfigPaths` を使用します
- プロバイダーによってトリガーされるセットアップ/ランタイム計画は、明示的なプロバイダーアクティベーションメタデータがない場合、レガシーの
  `providers[]` とトップレベルの `cliBackends[]` 所有権にフォールバックします

プランナー診断では、明示的なアクティベーションヒントとマニフェスト所有権フォールバックを区別できます。たとえば、`activation-command-hint` は
`activation.onCommands` が一致したことを意味し、`manifest-command-alias` はプランナーが代わりに `commandAliases` 所有権を使用したことを意味します。これらの理由ラベルはホスト診断とテスト用です。Plugin 作者は、所有権を最もよく表すメタデータを宣言し続ける必要があります。

## qaRunners リファレンス

Plugin が共有の `openclaw qa` ルート配下に 1 つ以上のトランスポートランナーを提供する場合は、`qaRunners` を使用します。このメタデータは低コストで静的に保ってください。実際の CLI 登録は、`qaRunnerCliRegistrations` をエクスポートする軽量な
`runtime-api.ts` サーフェスを通じて、引き続き Plugin ランタイムが所有します。

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
| `commandName` | はい      | `string` | `openclaw qa` 配下にマウントされるサブコマンド。例: `matrix`。    |
| `description` | いいえ       | `string` | 共有ホストがスタブコマンドを必要とする場合に使用されるフォールバックのヘルプテキスト。 |

## setup リファレンス

ランタイムがロードされる前に、セットアップとオンボーディングのサーフェスが Plugin 所有の低コストなメタデータを必要とする場合は、`setup` を使用します。

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

トップレベルの `cliBackends` は引き続き有効であり、CLI 推論バックエンドを説明し続けます。`setup.cliBackends` は、メタデータのみのままにすべき control-plane/セットアップフロー向けの、セットアップ固有の記述子サーフェスです。

存在する場合、`setup.providers` と `setup.cliBackends` は、セットアップ検出のための記述子優先のルックアップサーフェスとして優先されます。記述子が候補 Plugin を絞り込むだけで、セットアップ時により豊富なランタイムフックが必要な場合は、`requiresRuntime: true` を設定し、フォールバック実行パスとして `setup-api` を残してください。

OpenClaw は、汎用プロバイダー認証と env-var ルックアップにも `setup.providers[].envVars` を含めます。`providerAuthEnvVars` は非推奨期間中、互換アダプターを通じて引き続きサポートされますが、まだ使用している非バンドル Plugin にはマニフェスト診断が出ます。新しい Plugin は、セットアップ/ステータスの env メタデータを `setup.providers[].envVars` に置く必要があります。

OpenClaw は、セットアップエントリがない場合、または `setup.requiresRuntime: false`
でセットアップランタイムが不要と宣言されている場合、`setup.providers[].authMethods` から単純なセットアップ選択肢を導出することもできます。カスタムラベル、CLI フラグ、オンボーディングスコープ、アシスタントメタデータには、明示的な `providerAuthChoices` エントリが引き続き優先されます。

`requiresRuntime: false` は、それらの記述子だけでセットアップサーフェスに十分な場合にのみ設定してください。OpenClaw は明示的な `false` を記述子のみの契約として扱い、セットアップルックアップのために `setup-api` または `openclaw.setupEntry` を実行しません。記述子のみの Plugin がそれでもこれらのセットアップランタイムエントリのいずれかを同梱している場合、OpenClaw は追加的な診断を報告し、それを無視し続けます。`requiresRuntime` を省略すると、レガシーのフォールバック動作が維持されるため、このフラグなしで記述子を追加した既存の Plugin は壊れません。

セットアップルックアップでは Plugin 所有の `setup-api` コードを実行できるため、正規化された
`setup.providers[].id` と `setup.cliBackends[]` の値は、検出された Plugin 全体で一意である必要があります。所有権が曖昧な場合、検出順から勝者を選ぶのではなく、閉じた形で失敗します。

セットアップランタイムが実行される場合、セットアップレジストリ診断は、`setup-api` がマニフェスト記述子で宣言されていないプロバイダーまたは CLI バックエンドを登録した場合、または記述子に一致するランタイム登録がない場合に、記述子のずれを報告します。これらの診断は追加的なものであり、レガシー Plugin を拒否しません。

### setup.providers リファレンス

| フィールド          | 必須 | 型       | 意味                                                                                    |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | はい      | `string`   | セットアップまたはオンボーディング中に公開されるプロバイダー ID。正規化された ID をグローバルに一意に保ってください。             |
| `authMethods`  | いいえ       | `string[]` | 完全なランタイムをロードせずにこのプロバイダーがサポートするセットアップ/認証方式 ID。                       |
| `envVars`      | いいえ       | `string[]` | Plugin ランタイムがロードされる前に、汎用セットアップ/ステータスサーフェスが確認できる env var。               |
| `authEvidence` | いいえ       | `object[]` | 非シークレットマーカーを通じて認証できるプロバイダー向けの、低コストなローカル認証証拠チェック。 |

`authEvidence` は、runtime コードを読み込まずに検証できる、プロバイダー所有のローカル認証情報マーカー用です。これらのチェックは安価でローカルなままにする必要があります。
ネットワーク呼び出し、keychain や secret-manager の読み取り、shell コマンド、プロバイダー API プローブは行いません。

サポートされる evidence エントリ:

| フィールド         | 必須 | 型         | 意味                                                                                                           |
| ------------------ | ---- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | はい | `string`   | 現在は `local-file-with-env`。                                                                                 |
| `fileEnvVar`       | いいえ | `string`   | 明示的な認証情報ファイルパスを含む env var。                                                                  |
| `fallbackPaths`    | いいえ | `string[]` | `fileEnvVar` が存在しない、または空の場合にチェックされるローカル認証情報ファイルパス。`${HOME}` と `${APPDATA}` をサポートします。 |
| `requiresAnyEnv`   | いいえ | `string[]` | evidence が有効になる前に、 listed env var の少なくとも 1 つが空でない必要があります。                        |
| `requiresAllEnv`   | いいえ | `string[]` | evidence が有効になる前に、listed env var のすべてが空でない必要があります。                                  |
| `credentialMarker` | はい | `string`   | evidence が存在する場合に返される非 secret マーカー。                                                         |
| `source`           | いいえ | `string`   | auth/status 出力用のユーザー向け source ラベル。                                                               |

### setup フィールド

| フィールド         | 必須 | 型         | 意味                                                                                              |
| ------------------ | ---- | ---------- | ------------------------------------------------------------------------------------------------- |
| `providers`        | いいえ | `object[]` | setup とオンボーディング中に公開されるプロバイダー setup 記述子。                                |
| `cliBackends`      | いいえ | `string[]` | descriptor-first setup ルックアップに使用される setup 時の backend ids。正規化済み ids はグローバルに一意にしてください。 |
| `configMigrations` | いいえ | `string[]` | この Plugin の setup surface が所有する config migration ids。                                    |
| `requiresRuntime`  | いいえ | `boolean`  | descriptor lookup 後にも setup が `setup-api` 実行を必要とするかどうか。                         |

## uiHints リファレンス

`uiHints` は config フィールド名から小さな rendering hints への map です。

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

各フィールド hint には次を含めることができます:

| フィールド    | 型         | 意味                                           |
| ------------- | ---------- | ---------------------------------------------- |
| `label`       | `string`   | ユーザー向けフィールドラベル。                 |
| `help`        | `string`   | 短いヘルパーテキスト。                         |
| `tags`        | `string[]` | 任意の UI タグ。                               |
| `advanced`    | `boolean`  | フィールドを advanced としてマークします。     |
| `sensitive`   | `boolean`  | フィールドを secret または sensitive としてマークします。 |
| `placeholder` | `string`   | フォーム入力用の placeholder テキスト。        |

## contracts リファレンス

`contracts` は、OpenClaw が Plugin runtime を import せずに読み取れる静的な capability ownership metadata にのみ使用します。

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

各 list は任意です:

| フィールド                       | 型         | 意味                                                                  |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server extension factory ids。現在は `codex-app-server`。   |
| `agentToolResultMiddleware`      | `string[]` | bundled Plugin が tool-result middleware を登録できる runtime ids。   |
| `externalAuthProviders`          | `string[]` | この Plugin が所有する external auth profile hook のプロバイダー ids。 |
| `speechProviders`                | `string[]` | この Plugin が所有する speech provider ids。                          |
| `realtimeTranscriptionProviders` | `string[]` | この Plugin が所有する realtime-transcription provider ids。          |
| `realtimeVoiceProviders`         | `string[]` | この Plugin が所有する realtime-voice provider ids。                  |
| `memoryEmbeddingProviders`       | `string[]` | この Plugin が所有する memory embedding provider ids。                |
| `mediaUnderstandingProviders`    | `string[]` | この Plugin が所有する media-understanding provider ids。             |
| `imageGenerationProviders`       | `string[]` | この Plugin が所有する image-generation provider ids。                |
| `videoGenerationProviders`       | `string[]` | この Plugin が所有する video-generation provider ids。                |
| `webFetchProviders`              | `string[]` | この Plugin が所有する web-fetch provider ids。                       |
| `webSearchProviders`             | `string[]` | この Plugin が所有する web-search provider ids。                      |
| `migrationProviders`             | `string[]` | この Plugin が `openclaw migrate` 向けに所有する import provider ids。 |
| `tools`                          | `string[]` | この Plugin が所有する agent tool 名。                                |

`contracts.embeddedExtensionFactories` は、bundled Codex app-server-only extension factories のために保持されています。bundled tool-result transforms は、代わりに `contracts.agentToolResultMiddleware` を宣言し、`api.registerAgentToolResultMiddleware(...)` で登録する必要があります。外部 Plugin は tool-result middleware を登録できません。この seam は、モデルが見る前に high-trust tool output を書き換えることができるためです。

Runtime の `api.registerTool(...)` 登録は `contracts.tools` と一致する必要があります。Tool discovery はこの list を使用して、要求された tools を所有できる Plugin runtimes だけを読み込みます。

`resolveExternalAuthProfiles` を実装するプロバイダー Plugin は、`contracts.externalAuthProviders` を宣言する必要があります。宣言のない Plugin も非推奨の compatibility fallback を通じて実行されますが、その fallback は遅く、migration window 後に削除されます。

Bundled memory embedding providers は、公開するすべての adapter id について `contracts.memoryEmbeddingProviders` を宣言する必要があります。`local` のような built-in adapters も含みます。Standalone CLI paths は、full Gateway runtime が providers を登録する前に、所有する Plugin だけを読み込むためにこの manifest contract を使用します。

## mediaUnderstandingProviderMetadata リファレンス

generic core helpers が runtime の読み込み前に必要とする default models、auto-auth fallback priority、または native document support を media-understanding provider が持つ場合は、`mediaUnderstandingProviderMetadata` を使用します。keys は `contracts.mediaUnderstandingProviders` でも宣言されている必要があります。

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

| フィールド             | 型                                  | 意味                                                                            |
| ---------------------- | ----------------------------------- | ------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | このプロバイダーが公開する media capabilities。                                |
| `defaultModels`        | `Record<string, string>`            | config が model を指定しない場合に使用される capability-to-model defaults。     |
| `autoPriority`         | `Record<string, number>`            | 自動 credential-based provider fallback で、数値が小さいほど先に並びます。     |
| `nativeDocumentInputs` | `"pdf"[]`                           | プロバイダーがサポートする native document inputs。                             |

## channelConfigs リファレンス

channel Plugin が runtime の読み込み前に安価な config metadata を必要とする場合は、`channelConfigs` を使用します。読み取り専用の channel setup/status discovery は、setup entry が利用できない場合、または `setup.requiresRuntime: false` が setup runtime 不要を宣言している場合、configured external channels に対してこの metadata を直接使用できます。

`channelConfigs` は Plugin manifest metadata であり、新しい top-level user config section ではありません。ユーザーは引き続き channel instances を `channels.<channel-id>` の下で設定します。OpenClaw は、Plugin runtime code が実行される前に、設定された channel をどの Plugin が所有するかを判断するために manifest metadata を読み取ります。

channel Plugin の場合、`configSchema` と `channelConfigs` は異なる paths を記述します:

- `configSchema` は `plugins.entries.<plugin-id>.config` を検証します
- `channelConfigs.<channel-id>.schema` は `channels.<channel-id>` を検証します

`channels[]` を宣言する non-bundled plugins は、一致する `channelConfigs` entries も宣言する必要があります。それらがない場合でも OpenClaw は Plugin を読み込めますが、cold-path config schema、setup、Control UI surfaces は、Plugin runtime が実行されるまで channel-owned option shape を知ることができません。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` と `nativeSkillsAutoEnabled` は、channel runtime の読み込み前に実行される command config checks 用の静的な `auto` defaults を宣言できます。Bundled channels は、他の package-owned channel catalog metadata と並べて、`package.json#openclaw.channel.commands` を通じて同じ defaults を公開することもできます。

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

各 channel エントリには次を含めることができます:

| フィールド         | 型                     | 意味                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` の JSON Schema。宣言された各チャネル設定エントリに必須です。         |
| `uiHints`     | `Record<string, object>` | そのチャネル設定セクション用の任意の UI ラベル、プレースホルダー、機密ヒント。          |
| `label`       | `string`                 | ランタイムメタデータの準備ができていない場合に、ピッカーと検査画面へマージされるチャネルラベル。 |
| `description` | `string`                 | 検査画面とカタログ画面用の短いチャネル説明。                               |
| `commands`    | `object`                 | ランタイム前の設定チェック用の静的なネイティブコマンドとネイティブスキルの自動デフォルト。       |
| `preferOver`  | `string[]`               | 選択画面でこのチャネルが上回るべき、レガシーまたは低優先度の Plugin ID。    |

### 別のチャネル Plugin を置き換える

Plugin が、別の Plugin も提供できるチャネル ID の優先所有者である場合は、`preferOver` を使用します。一般的なケースには、名前変更された Plugin ID、バンドル Plugin を置き換えるスタンドアロン Plugin、または設定互換性のために同じチャネル ID を維持するメンテナンス済みフォークがあります。

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

`channels.chat` が設定されている場合、OpenClaw はチャネル ID と優先 Plugin ID の両方を考慮します。低優先度の Plugin がバンドル済みまたはデフォルトで有効であるという理由だけで選択されていた場合、OpenClaw は有効なランタイム設定内でそれを無効化し、1 つの Plugin がチャネルとそのツールを所有するようにします。明示的なユーザー選択は引き続き優先されます。ユーザーが両方の Plugin を明示的に有効化した場合、OpenClaw はその選択を保持し、要求された Plugin セットを暗黙的に変更する代わりに、重複するチャネル/ツールの診断を報告します。

`preferOver` は、同じチャネルを実際に提供できる Plugin ID に限定してください。これは汎用の優先度フィールドではなく、ユーザー設定キーをリネームするものでもありません。

## modelSupport リファレンス

Plugin ランタイムが読み込まれる前に、`gpt-5.5` や `claude-sonnet-4.6` のような省略形モデル ID から OpenClaw がプロバイダー Plugin を推論する必要がある場合は、`modelSupport` を使用します。

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
- 非バンドル Plugin とバンドル Plugin が両方一致する場合、非バンドル Plugin が優先されます
- 残る曖昧さは、ユーザーまたは設定がプロバイダーを指定するまで無視されます

フィールド:

| フィールド           | 型       | 意味                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 省略形モデル ID に対して `startsWith` で照合されるプレフィックス。                 |
| `modelPatterns` | `string[]` | プロファイルサフィックスの削除後に、省略形モデル ID に対して照合される正規表現ソース。 |

## modelCatalog リファレンス

Plugin ランタイムを読み込む前に OpenClaw がプロバイダーモデルメタデータを把握する必要がある場合は、`modelCatalog` を使用します。これは固定カタログ行、プロバイダーエイリアス、抑制ルール、検出モードのためにマニフェストが所有するソースです。ランタイム更新は引き続きプロバイダーランタイムコードに属しますが、マニフェストはいつランタイムが必要かをコアに伝えます。

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

| フィールド          | 型                                                     | 意味                                                                                               |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | この Plugin が所有するプロバイダー ID のカタログ行。キーはトップレベルの `providers` にも現れる必要があります。       |
| `aliases`      | `Record<string, object>`                                 | カタログまたは抑制計画のために、所有プロバイダーへ解決されるべきプロバイダーエイリアス。              |
| `suppressions` | `object[]`                                               | プロバイダー固有の理由により、この Plugin が抑制する別ソース由来のモデル行。                  |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | プロバイダーカタログをマニフェストメタデータから読み取れるか、キャッシュへ更新できるか、またはランタイムが必要か。 |

`aliases` は、モデルカタログ計画のためのプロバイダー所有権ルックアップに参加します。エイリアスの対象は、同じ Plugin が所有するトップレベルプロバイダーでなければなりません。プロバイダーでフィルタリングされたリストがエイリアスを使用する場合、OpenClaw はプロバイダーランタイムを読み込まずに、所有元のマニフェストを読み取り、エイリアスの API/ベース URL 上書きを適用できます。エイリアスはフィルタリングされていないカタログリストを展開しません。広範なリストでは所有元の正規プロバイダー行のみが出力されます。

`suppressions` は、古いプロバイダーランタイムの `suppressBuiltInModel` フックを置き換えます。抑制エントリは、プロバイダーがその Plugin に所有されている場合、または所有プロバイダーを対象とする `modelCatalog.aliases` キーとして宣言されている場合にのみ尊重されます。モデル解決中にランタイム抑制フックが呼び出されることはなくなりました。

プロバイダーフィールド:

| フィールド     | 型                     | 意味                                                     |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | このプロバイダーカタログ内のモデル用の任意のデフォルトベース URL。    |
| `api`     | `ModelApi`               | このプロバイダーカタログ内のモデル用の任意のデフォルト API アダプター。 |
| `headers` | `Record<string, string>` | このプロバイダーカタログに適用される任意の静的ヘッダー。      |
| `models`  | `object[]`               | 必須のモデル行。`id` のない行は無視されます。            |

モデルフィールド:

| フィールド           | 型                                                           | 意味                                                               |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | `provider/` プレフィックスなしの、プロバイダーローカルなモデル ID。                    |
| `name`          | `string`                                                       | 任意の表示名。                                                      |
| `api`           | `ModelApi`                                                     | 任意のモデル単位 API 上書き。                                            |
| `baseUrl`       | `string`                                                       | 任意のモデル単位ベース URL 上書き。                                       |
| `headers`       | `Record<string, string>`                                       | 任意のモデル単位静的ヘッダー。                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | モデルが受け付けるモダリティ。                                               |
| `reasoning`     | `boolean`                                                      | モデルが推論動作を公開するかどうか。                               |
| `contextWindow` | `number`                                                       | ネイティブプロバイダーのコンテキストウィンドウ。                                             |
| `contextTokens` | `number`                                                       | `contextWindow` と異なる場合の、任意の有効ランタイムコンテキスト上限。 |
| `maxTokens`     | `number`                                                       | 既知の場合の最大出力トークン数。                                           |
| `cost`          | `object`                                                       | 任意の 100 万トークンあたり USD 価格。任意の `tieredPricing` を含みます。 |
| `compat`        | `object`                                                       | OpenClaw モデル設定互換性に一致する任意の互換性フラグ。  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | リスト掲載ステータス。行をまったく表示してはならない場合のみ抑制します。          |
| `statusReason`  | `string`                                                       | 利用可能以外のステータスとともに表示される任意の理由。                            |
| `replaces`      | `string[]`                                                     | このモデルが置き換える古いプロバイダーローカルモデル ID。                       |
| `replacedBy`    | `string`                                                       | 非推奨行の置き換え先プロバイダーローカルモデル ID。                    |
| `tags`          | `string[]`                                                     | ピッカーとフィルターで使用される安定したタグ。                                    |

抑制フィールド:

| フィールド                      | 型       | 意味                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | 抑制する上流行のプロバイダー ID。この Plugin が所有しているか、所有エイリアスとして宣言されている必要があります。 |
| `model`                    | `string`   | 抑制するプロバイダーローカルモデル ID。                                                                      |
| `reason`                   | `string`   | 抑制された行が直接要求された場合に表示される任意のメッセージ。                                     |
| `when.baseUrlHosts`        | `string[]` | 抑制が適用される前に必要な、有効なプロバイダーベース URL ホストの任意のリスト。               |
| `when.providerConfigApiIn` | `string[]` | 抑制が適用される前に必要な、完全一致のプロバイダー設定 `api` 値の任意のリスト。              |

ランタイム専用データを `modelCatalog` に入れないでください。マニフェスト
行が、プロバイダーでフィルターされたリストとピッカーのサーフェスで
registry/runtime discovery をスキップできるほど十分に完全な場合にのみ、`static` を使用してください。
マニフェスト行がリスト可能な有用なシードまたは補足であり、後で refresh/cache によって
さらに行を追加できる場合は `refreshable` を使用してください。
refreshable 行は、それ自体では信頼できる情報源ではありません。OpenClaw が
リストを知るためにプロバイダーランタイムをロードする必要がある場合は、`runtime` を使用してください。

## modelIdNormalization リファレンス

プロバイダーランタイムのロード前に実行する必要がある、低コストでプロバイダー所有の model-id クリーンアップには
`modelIdNormalization` を使用してください。これにより、短いモデル名、
プロバイダー内のレガシー ID、プロキシのプレフィックスルールなどのエイリアスを、
core のモデル選択テーブルではなく、所有する Plugin マニフェストに保持できます。

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
| `aliases`                            | `Record<string,string>` | 大文字小文字を区別しない完全一致の model-id エイリアス。値は記述どおりに返されます。     |
| `stripPrefixes`                      | `string[]`              | エイリアス検索前に削除するプレフィックス。レガシーな provider/model の重複に有用です。   |
| `prefixWhenBare`                     | `string`                | 正規化されたモデル ID に `/` がまだ含まれていない場合に追加するプレフィックス。           |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | エイリアス検索後の条件付き bare-id プレフィックスルール。`modelPrefix` と `prefix` をキーにします。 |

## providerEndpoints リファレンス

汎用リクエストポリシーがプロバイダーランタイムのロード前に知る必要がある
エンドポイント分類には `providerEndpoints` を使用してください。Core は引き続き各
`endpointClass` の意味を所有し、Plugin マニフェストはホストとベース URL のメタデータを所有します。

エンドポイントのフィールド:

| フィールド                     | 型         | 意味                                                                                              |
| ------------------------------ | ---------- | ------------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | `openrouter`、`moonshot-native`、`google-vertex` などの既知の core エンドポイントクラス。          |
| `hosts`                        | `string[]` | エンドポイントクラスに対応する正確なホスト名。                                                    |
| `hostSuffixes`                 | `string[]` | エンドポイントクラスに対応するホストサフィックス。ドメインサフィックスのみの照合には `.` を前置します。 |
| `baseUrls`                     | `string[]` | エンドポイントクラスに対応する、正規化済みの正確な HTTP(S) ベース URL。                           |
| `googleVertexRegion`           | `string`   | 正確なグローバルホスト用の静的な Google Vertex リージョン。                                       |
| `googleVertexRegionHostSuffix` | `string`   | 一致したホストから削除し、Google Vertex リージョンプレフィックスを公開するためのサフィックス。     |

## providerRequest リファレンス

汎用リクエストポリシーがプロバイダーランタイムをロードせずに必要とする、
低コストのリクエスト互換性メタデータには `providerRequest` を使用してください。
動作固有のペイロード書き換えは、プロバイダーランタイムフックまたは共有のプロバイダーファミリーヘルパーに保持してください。

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

| フィールド            | 型           | 意味                                                                                 |
| --------------------- | ------------ | ------------------------------------------------------------------------------------ |
| `family`              | `string`     | 汎用リクエスト互換性の判断と診断で使用されるプロバイダーファミリーラベル。          |
| `compatibilityFamily` | `"moonshot"` | 共有リクエストヘルパー用の任意のプロバイダーファミリー互換性バケット。              |
| `openAICompletions`   | `object`     | OpenAI 互換 completions リクエストフラグ。現在は `supportsStreamingUsage` です。     |

## modelPricing リファレンス

プロバイダーがランタイムのロード前に制御プレーンの料金動作を制御する必要がある場合は、
`modelPricing` を使用してください。Gateway の料金キャッシュは、プロバイダーランタイムコードを
インポートせずにこのメタデータを読み取ります。

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

| フィールド   | 型                | 意味                                                                                                  |
| ------------ | ----------------- | ----------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | OpenRouter または LiteLLM の料金を決して取得すべきでないローカル/セルフホスト型プロバイダーでは `false` に設定します。 |
| `openRouter` | `false \| object` | OpenRouter 料金検索マッピング。`false` はこのプロバイダーの OpenRouter 検索を無効にします。           |
| `liteLLM`    | `false \| object` | LiteLLM 料金検索マッピング。`false` はこのプロバイダーの LiteLLM 検索を無効にします。                 |

ソースフィールド:

| フィールド                 | 型                   | 意味                                                                                                      |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | OpenClaw プロバイダー ID と異なる場合の外部カタログプロバイダー ID。たとえば `zai` プロバイダーに対する `z-ai`。 |
| `passthroughProviderModel` | `boolean`          | スラッシュを含むモデル ID をネストされた provider/model 参照として扱います。OpenRouter のようなプロキシプロバイダーに有用です。 |
| `modelIdTransforms`        | `"version-dots"[]` | 追加の外部カタログ model-id バリアント。`version-dots` は `claude-opus-4.6` のようなドット付きバージョン ID を試します。 |

### OpenClaw プロバイダーインデックス

OpenClaw プロバイダーインデックスは、まだ Plugin がインストールされていない可能性のあるプロバイダー向けの、
OpenClaw 所有のプレビューメタデータです。これは Plugin マニフェストの一部ではありません。
Plugin マニフェストは、インストール済み Plugin の信頼できる情報源であり続けます。プロバイダーインデックスは、
インストール可能プロバイダーとインストール前のモデルピッカーサーフェスが、
プロバイダー Plugin がインストールされていない場合に利用する内部フォールバック契約です。

カタログの信頼順序:

1. ユーザー設定。
2. インストール済み Plugin マニフェストの `modelCatalog`。
3. 明示的な更新から得られるモデルカタログキャッシュ。
4. OpenClaw プロバイダーインデックスのプレビュー行。

プロバイダーインデックスには、シークレット、有効状態、ランタイムフック、または
ライブアカウント固有のモデルデータを含めてはなりません。そのプレビューカタログは、
Plugin マニフェストと同じ `modelCatalog` プロバイダー行の形を使用しますが、
`api`、`baseUrl`、料金、互換性フラグなどのランタイムアダプターフィールドを
インストール済み Plugin マニフェストと意図的に揃えて維持する場合を除き、
安定した表示メタデータに限定するべきです。ライブ `/models` discovery を持つプロバイダーは、
通常の一覧表示やオンボーディングでプロバイダー API を呼び出すのではなく、
明示的なモデルカタログキャッシュパスを通じて更新済み行を書き込むべきです。

プロバイダーインデックスのエントリーには、Plugin が core から移動した、または
まだインストールされていないプロバイダー向けの、インストール可能な Plugin メタデータを含めることもできます。
このメタデータはチャネルカタログのパターンを反映します。パッケージ名、npm install spec、
想定される integrity、低コストの認証選択ラベルがあれば、インストール可能なセットアップオプションを表示するには十分です。
Plugin がインストールされると、そのマニフェストが優先され、そのプロバイダーのプロバイダーインデックスエントリーは無視されます。

レガシーのトップレベル capability キーは非推奨です。`openclaw doctor --fix` を使用して
`speechProviders`、`realtimeTranscriptionProviders`、
`realtimeVoiceProviders`、`mediaUnderstandingProviders`、
`imageGenerationProviders`、`videoGenerationProviders`、
`webFetchProviders`、`webSearchProviders` を `contracts` の下に移動してください。通常の
マニフェストロードでは、これらのトップレベルフィールドを capability の所有権として扱わなくなりました。

## マニフェストと package.json

この 2 つのファイルは異なる役割を持ちます。

| ファイル               | 用途                                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Plugin コードの実行前に存在する必要がある discovery、設定検証、認証選択メタデータ、UI ヒント                                   |
| `package.json`         | npm メタデータ、依存関係のインストール、および entrypoint、インストールゲート、セットアップ、カタログメタデータに使われる `openclaw` ブロック |

メタデータをどこに置くべきかわからない場合は、次のルールを使用してください。

- OpenClaw が Plugin コードをロードする前に知る必要がある場合は、`openclaw.plugin.json` に置きます
- パッケージング、エントリーファイル、または npm install 動作に関する場合は、`package.json` に置きます

### discovery に影響する package.json フィールド

一部のランタイム前 Plugin メタデータは、意図的に `openclaw.plugin.json` ではなく
`package.json` の `openclaw` ブロック内に置かれます。
`openclaw.bundle` と `openclaw.bundle.json` は OpenClaw Plugin 契約ではありません。
ネイティブ Plugin は、`openclaw.plugin.json` と、以下でサポートされる
`package.json#openclaw` フィールドを使用する必要があります。

重要な例:

| フィールド                                                                                 | 意味                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | ネイティブ Plugin エントリーポイントを宣言します。Plugin パッケージディレクトリ内にとどまる必要があります。                                                                          |
| `openclaw.runtimeExtensions`                                                               | インストール済みパッケージ向けのビルド済み JavaScript ランタイムエントリーポイントを宣言します。Plugin パッケージディレクトリ内にとどまる必要があります。                         |
| `openclaw.setupEntry`                                                                      | オンボーディング、遅延 channel 起動、読み取り専用 channel ステータス/SecretRef 検出中に使われる軽量な setup 専用エントリーポイントです。Plugin パッケージディレクトリ内にとどまる必要があります。 |
| `openclaw.runtimeSetupEntry`                                                               | インストール済みパッケージ向けのビルド済み JavaScript setup エントリーポイントを宣言します。`setupEntry` が必要で、存在している必要があり、Plugin パッケージディレクトリ内にとどまる必要があります。 |
| `openclaw.channel`                                                                         | ラベル、docs パス、エイリアス、選択用コピーなどの安価な channel カタログメタデータです。                                                                                            |
| `openclaw.channel.commands`                                                                | channel ランタイムが読み込まれる前に、config、audit、command-list サーフェスで使われる静的なネイティブ command とネイティブ skill の自動デフォルトメタデータです。                  |
| `openclaw.channel.configuredState`                                                         | フル channel ランタイムを読み込まずに「env のみの setup はすでに存在するか」に答えられる軽量な configured-state チェッカーメタデータです。                                           |
| `openclaw.channel.persistedAuthState`                                                      | フル channel ランタイムを読み込まずに「すでにサインインされているものがあるか」に答えられる軽量な persisted-auth チェッカーメタデータです。                                         |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | バンドル済みおよび外部公開 Plugin 向けのインストール/更新ヒントです。                                                                                                                |
| `openclaw.install.defaultChoice`                                                           | 複数のインストールソースが利用できる場合の優先インストールパスです。                                                                                                                |
| `openclaw.install.minHostVersion`                                                          | 最小対応 OpenClaw ホストバージョンです。`>=2026.3.22` や `>=2026.5.1-beta.1` のような semver 下限を使います。                                                                        |
| `openclaw.install.expectedIntegrity`                                                       | `sha512-...` のような想定 npm dist integrity 文字列です。インストールおよび更新フローは、取得した artifact をこれと照合して検証します。                                             |
| `openclaw.install.allowInvalidConfigRecovery`                                              | config が無効な場合に、限定的なバンドル済み Plugin の再インストール復旧パスを許可します。                                                                                            |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | 起動中、フル channel Plugin より前に setup 専用 channel サーフェスを読み込めるようにします。                                                                                         |

Manifest メタデータは、ランタイムが読み込まれる前にオンボーディングで表示される provider/channel/setup の選択肢を決定します。`package.json#openclaw.install` は、ユーザーがそれらの選択肢の 1 つを選んだときに、その Plugin を取得または有効化する方法をオンボーディングに伝えます。インストールヒントを `openclaw.plugin.json` に移動しないでください。

`openclaw.install.minHostVersion` は、非バンドル Plugin ソースのインストール時および Manifest レジストリ読み込み時に適用されます。無効な値は拒否されます。新しいが有効な値は、古いホスト上で外部 Plugin をスキップします。バンドル済みソース Plugin は、ホスト checkout と同じバージョンで管理されているものとみなされます。

公式のオンデマンドインストールメタデータでは、Plugin が ClawHub で公開されている場合は `clawhubSpec` を使う必要があります。オンボーディングはそれを優先 remote ソースとして扱い、インストール後に ClawHub artifact の情報を記録します。`npmSpec` は、まだ ClawHub に移行していないパッケージ向けの互換 fallback として残ります。

厳密な npm バージョン固定は、たとえば `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"` のように、すでに `npmSpec` に含まれています。公式の外部カタログエントリでは、取得された npm artifact が固定リリースと一致しなくなった場合に更新フローが fail closed になるよう、厳密な spec と `expectedIntegrity` を組み合わせる必要があります。対話型オンボーディングでは、互換性のために、bare パッケージ名や dist-tag を含む信頼済み registry npm spec も引き続き提示します。カタログ診断では、exact、floating、integrity-pinned、missing-integrity、package-name mismatch、invalid default-choice の各ソースを区別できます。また、`expectedIntegrity` が存在する一方で、それを固定できる有効な npm ソースがない場合にも警告します。`expectedIntegrity` が存在する場合、インストール/更新フローはそれを強制します。省略されている場合、registry 解決は integrity pin なしで記録されます。

channel Plugin は、ステータス、channel list、または SecretRef scan がフルランタイムを読み込まずに configured account を識別する必要がある場合、`openclaw.setupEntry` を提供する必要があります。setup entry は、channel メタデータに加えて setup-safe な config、status、secrets adapter を公開する必要があります。network client、gateway listener、transport runtime はメイン extension エントリーポイントに保持してください。

ランタイムエントリーポイントフィールドは、ソースエントリーポイントフィールドのパッケージ境界チェックを上書きしません。たとえば、`openclaw.runtimeExtensions` によって、外部へ抜ける `openclaw.extensions` パスを読み込み可能にすることはできません。

`openclaw.install.allowInvalidConfigRecovery` は意図的に範囲が限定されています。任意の壊れた config をインストール可能にするものではありません。現時点では、バンドル済み Plugin パスの欠落や、その同じバンドル済み Plugin に対する古い `channels.<id>` エントリなど、特定の古いバンドル済み Plugin アップグレード失敗からインストールフローが復旧することだけを許可します。無関係な config エラーは引き続きインストールをブロックし、operator を `openclaw doctor --fix` に誘導します。

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

setup、doctor、status、または読み取り専用 presence フローが、フル channel Plugin を読み込む前に安価な yes/no auth probe を必要とする場合に使います。永続化 auth state は configured channel state ではありません。このメタデータを使って Plugin を自動有効化したり、ランタイム依存関係を修復したり、channel ランタイムを読み込むべきかどうかを判断したりしないでください。対象 export は persisted state だけを読む小さな関数にする必要があります。フル channel ランタイム barrel を経由させないでください。

`openclaw.channel.configuredState` は、安価な env のみの configured check 向けに同じ形に従います。

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

channel が env やその他の小さな非ランタイム入力から configured-state に答えられる場合に使います。チェックがフル config 解決や実際の channel ランタイムを必要とする場合は、そのロジックを Plugin の `config.hasConfiguredState` hook に保持してください。

## 検出の優先順位（重複する Plugin ID）

OpenClaw は複数の root（バンドル済み、グローバルインストール、workspace、明示的な config 選択パス）から Plugin を検出します。2 つの検出結果が同じ `id` を共有する場合、**最も優先順位が高い** Manifest だけが保持されます。優先順位の低い重複は、並べて読み込まれる代わりに破棄されます。

優先順位は高いものから低いものへ次のとおりです。

1. **Config-selected** — `plugins.entries.<id>` で明示的に固定されたパス
2. **Bundled** — OpenClaw に同梱されている Plugin
3. **Global install** — グローバルな OpenClaw Plugin root にインストールされた Plugin
4. **Workspace** — 現在の workspace からの相対で検出された Plugin

影響:

- workspace に置かれたバンドル済み Plugin の fork や古いコピーは、バンドル済み build を shadow しません。
- バンドル済み Plugin をローカルのもので実際に override するには、workspace 検出に頼るのではなく、`plugins.entries.<id>` で固定して優先順位により勝たせます。
- Doctor と起動診断が破棄されたコピーを指し示せるよう、重複破棄はログに記録されます。
- Config-selected の重複 override は診断では明示的な override として表現されますが、古い fork や偶発的な shadow が見えるままになるよう警告も行います。

## JSON Schema 要件

- **すべての Plugin は JSON Schema を同梱する必要があります**。config を受け付けない場合も同様です。
- 空の schema は許容されます（例: `{ "type": "object", "additionalProperties": false }`）。
- schema は runtime ではなく、config の読み書き時に検証されます。
- 新しい config key を持つバンドル済み Plugin を拡張または fork する場合は、その Plugin の `openclaw.plugin.json` の `configSchema` も同時に更新してください。バンドル済み Plugin の schema は strict であるため、`configSchema.properties` に `myNewKey` を追加せずにユーザー config で `plugins.entries.<id>.config.myNewKey` を追加すると、Plugin ランタイムが読み込まれる前に拒否されます。

schema 拡張例:

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

- channel id が Plugin Manifest によって宣言されていない限り、不明な `channels.*` key は**エラー**です。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny`、`plugins.slots.*` は、**検出可能な** Plugin id を参照する必要があります。不明な id は**エラー**です。
- Plugin がインストールされているものの、Manifest または schema が壊れているか欠落している場合、検証は失敗し、Doctor が Plugin エラーを報告します。
- Plugin config が存在するものの Plugin が**無効**になっている場合、config は保持され、Doctor とログに**警告**が表示されます。

完全な `plugins.*` schema については、[Configuration reference](/ja-JP/gateway/configuration) を参照してください。

## メモ

- マニフェストは、ローカルファイルシステムからの読み込みを含む **ネイティブ OpenClaw Plugin** で必須です。ランタイムは引き続き Plugin モジュールを別途読み込みます。マニフェストは検出 + 検証のためだけに使用されます。
- ネイティブマニフェストは JSON5 で解析されるため、最終的な値がオブジェクトである限り、コメント、末尾のカンマ、引用符なしのキーが許可されます。
- マニフェストローダーが読み取るのは、ドキュメント化されたマニフェストフィールドだけです。カスタムのトップレベルキーは避けてください。
- `channels`、`providers`、`cliBackends`、`skills` は、Plugin がそれらを必要としない場合はすべて省略できます。
- `providerDiscoveryEntry` は軽量に保つ必要があり、広範なランタイムコードをインポートすべきではありません。リクエスト時の実行ではなく、静的なプロバイダーカタログメタデータまたは狭い範囲の検出記述子に使用してください。
- 排他的な Plugin 種別は `plugins.slots.*` を通じて選択されます。`kind: "memory"` は `plugins.slots.memory`、`kind: "context-engine"` は `plugins.slots.contextEngine`（デフォルトは `legacy`）で指定します。
- このマニフェストで排他的な Plugin 種別を宣言してください。ランタイムエントリの `OpenClawPluginDefinition.kind` は非推奨であり、古い Plugin 向けの互換性フォールバックとしてのみ残されています。
- 環境変数メタデータ（`setup.providers[].envVars`、非推奨の `providerAuthEnvVars`、および `channelEnvVars`）は宣言専用です。ステータス、監査、Cron 配信検証、その他の読み取り専用サーフェスでは、環境変数を設定済みとして扱う前に、引き続き Plugin の信頼性と有効な有効化ポリシーが適用されます。
- プロバイダーコードを必要とするランタイム ウィザード メタデータについては、[プロバイダーランタイムフック](/ja-JP/plugins/architecture-internals#provider-runtime-hooks)を参照してください。
- Plugin がネイティブモジュールに依存する場合は、ビルド手順とパッケージマネージャーの allowlist 要件（例: pnpm `allow-build-scripts` + `pnpm rebuild <package>`）をドキュメント化してください。

## 関連

<CardGroup cols={3}>
  <Card title="Plugin の構築" href="/ja-JP/plugins/building-plugins" icon="rocket">
    Plugin のはじめに。
  </Card>
  <Card title="Plugin アーキテクチャ" href="/ja-JP/plugins/architecture" icon="diagram-project">
    内部アーキテクチャと機能モデル。
  </Card>
  <Card title="SDK の概要" href="/ja-JP/plugins/sdk-overview" icon="book">
    Plugin SDK リファレンスとサブパスインポート。
  </Card>
</CardGroup>

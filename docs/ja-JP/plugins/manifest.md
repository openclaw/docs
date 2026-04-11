---
read_when:
    - OpenClawプラグインを作成しています
    - プラグイン設定スキーマを提供する必要がある、またはプラグインの検証エラーをデバッグする必要があります
summary: プラグインマニフェスト + JSONスキーマ要件（厳格な設定検証）
title: プラグインマニフェスト
x-i18n:
    generated_at: "2026-04-11T15:16:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42d454b560a8f6bf714c5d782f34216be1216d83d0a319d08d7349332c91a9e4
    source_path: plugins/manifest.md
    workflow: 15
---

# プラグインマニフェスト（`openclaw.plugin.json`）

このページは、**ネイティブなOpenClawプラグインマニフェスト**のみを対象としています。

互換性のあるバンドルレイアウトについては、[プラグインバンドル](/ja-JP/plugins/bundles)を参照してください。

互換バンドル形式では、異なるマニフェストファイルを使用します。

- Codexバンドル: `.codex-plugin/plugin.json`
- Claudeバンドル: `.claude-plugin/plugin.json` またはマニフェストなしのデフォルトClaudeコンポーネントレイアウト
- Cursorバンドル: `.cursor-plugin/plugin.json`

OpenClawはこれらのバンドルレイアウトも自動検出しますが、ここで説明する`openclaw.plugin.json`スキーマに対しては検証されません。

互換バンドルについて、OpenClawは現在、レイアウトがOpenClawランタイムの期待に一致する場合、バンドルメタデータに加えて、宣言されたスキルルート、Claudeコマンドルート、Claudeバンドルの`settings.json`デフォルト、ClaudeバンドルのLSPデフォルト、およびサポートされるフックパックを読み取ります。

すべてのネイティブOpenClawプラグインは、**プラグインルート**に`openclaw.plugin.json`ファイルを**必ず**含める必要があります。OpenClawはこのマニフェストを使用して、**プラグインコードを実行せずに**設定を検証します。マニフェストが存在しない、または無効な場合はプラグインエラーとして扱われ、設定検証がブロックされます。

プラグインシステム全体のガイドについては、[Plugins](/ja-JP/tools/plugin)を参照してください。
ネイティブの機能モデルと現在の外部互換性ガイダンスについては、
[機能モデル](/ja-JP/plugins/architecture#public-capability-model)を参照してください。

## このファイルの役割

`openclaw.plugin.json`は、OpenClawがプラグインコードを読み込む前に読み取るメタデータです。

用途:

- プラグインID
- 設定検証
- プラグインランタイムを起動せずに利用できるべき認証およびオンボーディングメタデータ
- ランタイム読み込み前にコントロールプレーンサーフェスが確認できる軽量なアクティベーションヒント
- ランタイム読み込み前にセットアップ/オンボーディングサーフェスが確認できる軽量なセットアップ記述子
- プラグインランタイム読み込み前に解決されるべきエイリアスおよび自動有効化メタデータ
- プラグインランタイム読み込み前にプラグインを自動アクティブ化すべきモデルファミリー所有権の短縮メタデータ
- バンドル互換配線およびコントラクトカバレッジに使用される静的な機能所有権スナップショット
- ランタイムを読み込まずにカタログおよび検証サーフェスにマージされるべきチャネル固有の設定メタデータ
- 設定UIヒント

用途ではないもの:

- ランタイム動作の登録
- コードエントリーポイントの宣言
- npmインストールメタデータ

これらはプラグインコードおよび`package.json`に属します。

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
  "cliBackends": ["openrouter-cli"],
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

| Field                               | Required | Type                             | 意味                                                                                                                                                                                                         |
| ----------------------------------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | はい     | `string`                         | 正規のプラグインIDです。このIDは`plugins.entries.<id>`で使用されます。                                                                                                                                       |
| `configSchema`                      | はい     | `object`                         | このプラグイン設定用のインラインJSON Schemaです。                                                                                                                                                            |
| `enabledByDefault`                  | いいえ   | `true`                           | バンドルされたプラグインをデフォルトで有効としてマークします。デフォルトで無効のままにするには、省略するか、`true`以外の値を設定します。                                                                   |
| `legacyPluginIds`                   | いいえ   | `string[]`                       | この正規プラグインIDに正規化されるレガシーIDです。                                                                                                                                                           |
| `autoEnableWhenConfiguredProviders` | いいえ   | `string[]`                       | 認証、設定、またはモデル参照でこれらに言及されたときに、このプラグインを自動有効化すべきプロバイダーIDです。                                                                                               |
| `kind`                              | いいえ   | `"memory"` \| `"context-engine"` | `plugins.slots.*`で使われる排他的なプラグイン種別を宣言します。                                                                                                                                              |
| `channels`                          | いいえ   | `string[]`                       | このプラグインが所有するチャネルIDです。検出および設定検証に使用されます。                                                                                                                                   |
| `providers`                         | いいえ   | `string[]`                       | このプラグインが所有するプロバイダーIDです。                                                                                                                                                                 |
| `modelSupport`                      | いいえ   | `object`                         | ランタイム前にプラグインを自動読み込みするために使われる、マニフェスト所有の短縮モデルファミリーメタデータです。                                                                                           |
| `cliBackends`                       | いいえ   | `string[]`                       | このプラグインが所有するCLI推論バックエンドIDです。明示的な設定参照からの起動時自動アクティベーションに使用されます。                                                                                      |
| `commandAliases`                    | いいえ   | `object[]`                       | ランタイム読み込み前に、プラグイン対応の設定およびCLI診断を生成すべき、このプラグインが所有するコマンド名です。                                                                                           |
| `providerAuthEnvVars`               | いいえ   | `Record<string, string[]>`       | OpenClawがプラグインコードを読み込まずに確認できる、軽量なプロバイダー認証envメタデータです。                                                                                                               |
| `providerAuthAliases`               | いいえ   | `Record<string, string>`         | 認証参照で別のプロバイダーIDを再利用すべきプロバイダーIDです。たとえば、ベースプロバイダーのAPIキーや認証プロファイルを共有するコーディング用プロバイダーなどです。                                       |
| `channelEnvVars`                    | いいえ   | `Record<string, string[]>`       | OpenClawがプラグインコードを読み込まずに確認できる、軽量なチャネルenvメタデータです。env駆動のチャネルセットアップや、汎用の起動/設定ヘルパーが把握すべき認証サーフェスにはこれを使用してください。       |
| `providerAuthChoices`               | いいえ   | `object[]`                       | オンボーディングピッカー、優先プロバイダー解決、シンプルなCLIフラグ配線のための軽量な認証選択メタデータです。                                                                                             |
| `activation`                        | いいえ   | `object`                         | プロバイダー、コマンド、チャネル、ルート、機能トリガー読み込み用の軽量なアクティベーションヒントです。メタデータのみであり、実際の動作は引き続きプラグインランタイムが所有します。                         |
| `setup`                             | いいえ   | `object`                         | 検出およびセットアップサーフェスがプラグインランタイムを読み込まずに確認できる、軽量なセットアップ/オンボーディング記述子です。                                                                           |
| `contracts`                         | いいえ   | `object`                         | speech、realtime transcription、realtime voice、media-understanding、image-generation、music-generation、video-generation、web-fetch、web search、およびツール所有権のための静的なバンドル機能スナップショットです。 |
| `channelConfigs`                    | いいえ   | `Record<string, object>`         | ランタイム読み込み前に検出および検証サーフェスへマージされる、マニフェスト所有のチャネル設定メタデータです。                                                                                               |
| `skills`                            | いいえ   | `string[]`                       | プラグインルートからの相対パスで指定する、読み込むスキルディレクトリです。                                                                                                                                   |
| `name`                              | いいえ   | `string`                         | 人が読めるプラグイン名です。                                                                                                                                                                                 |
| `description`                       | いいえ   | `string`                         | プラグインサーフェスに表示される短い概要です。                                                                                                                                                               |
| `version`                           | いいえ   | `string`                         | 情報提供用のプラグインバージョンです。                                                                                                                                                                       |
| `uiHints`                           | いいえ   | `Record<string, object>`         | 設定フィールド用のUIラベル、プレースホルダー、および機密性ヒントです。                                                                                                                                       |

## providerAuthChoicesリファレンス

各`providerAuthChoices`エントリーは、1つのオンボーディングまたは認証の選択肢を記述します。
OpenClawはこれをプロバイダーランタイムの読み込み前に読み取ります。

| Field                 | Required | Type                                            | 意味                                                                                           |
| --------------------- | -------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `provider`            | はい     | `string`                                        | この選択肢が属するプロバイダーIDです。                                                         |
| `method`              | はい     | `string`                                        | ディスパッチ先の認証メソッドIDです。                                                           |
| `choiceId`            | はい     | `string`                                        | オンボーディングおよびCLIフローで使用される安定した認証選択肢IDです。                         |
| `choiceLabel`         | いいえ   | `string`                                        | ユーザー向けラベルです。省略した場合、OpenClawは`choiceId`にフォールバックします。            |
| `choiceHint`          | いいえ   | `string`                                        | ピッカー向けの短い補助テキストです。                                                           |
| `assistantPriority`   | いいえ   | `number`                                        | 値が小さいほど、アシスタント主導のインタラクティブピッカーで先に並びます。                   |
| `assistantVisibility` | いいえ   | `"visible"` \| `"manual-only"`                  | アシスタントピッカーではこの選択肢を非表示にしつつ、手動CLI選択は引き続き許可します。         |
| `deprecatedChoiceIds` | いいえ   | `string[]`                                      | ユーザーをこの置き換え先の選択肢へリダイレクトすべきレガシー選択肢IDです。                     |
| `groupId`             | いいえ   | `string`                                        | 関連する選択肢をグループ化するための任意のグループIDです。                                     |
| `groupLabel`          | いいえ   | `string`                                        | そのグループのユーザー向けラベルです。                                                         |
| `groupHint`           | いいえ   | `string`                                        | そのグループ向けの短い補助テキストです。                                                       |
| `optionKey`           | いいえ   | `string`                                        | 単一フラグによるシンプルな認証フロー用の内部オプションキーです。                               |
| `cliFlag`             | いいえ   | `string`                                        | `--openrouter-api-key`のようなCLIフラグ名です。                                                |
| `cliOption`           | いいえ   | `string`                                        | `--openrouter-api-key <key>`のような完全なCLIオプション形式です。                              |
| `cliDescription`      | いいえ   | `string`                                        | CLIヘルプで使用される説明です。                                                                |
| `onboardingScopes`    | いいえ   | `Array<"text-inference" \| "image-generation">` | この選択肢をどのオンボーディングサーフェスに表示するかです。省略した場合、`["text-inference"]`がデフォルトになります。 |

## commandAliasesリファレンス

ユーザーがプラグイン所有のランタイムコマンド名を誤って`plugins.allow`に入れたり、ルートCLIコマンドとして実行しようとしたりする可能性がある場合は、`commandAliases`を使用します。OpenClawはこのメタデータを使って、プラグインランタイムコードをインポートせずに診断を行います。

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

| Field        | Required | Type              | 意味                                                                       |
| ------------ | -------- | ----------------- | -------------------------------------------------------------------------- |
| `name`       | はい     | `string`          | このプラグインに属するコマンド名です。                                     |
| `kind`       | いいえ   | `"runtime-slash"` | このエイリアスを、ルートCLIコマンドではなくチャットスラッシュコマンドとしてマークします。 |
| `cliCommand` | いいえ   | `string`          | 関連するルートCLIコマンドが存在する場合に提案する、そのコマンドです。      |

## activationリファレンス

プラグインが、後でどのコントロールプレーンイベントによってアクティブ化されるべきかを軽量に宣言できる場合は、`activation`を使用します。

このブロックはメタデータのみです。ランタイム動作を登録するものではなく、`register(...)`、`setupEntry`、その他のランタイム/プラグインエントリーポイントの代わりにもなりません。

```json
{
  "activation": {
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| Field            | Required | Type                                                 | 意味                                                       |
| ---------------- | -------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| `onProviders`    | いいえ   | `string[]`                                           | 要求されたときにこのプラグインをアクティブ化すべきプロバイダーIDです。 |
| `onCommands`     | いいえ   | `string[]`                                           | このプラグインをアクティブ化すべきコマンドIDです。         |
| `onChannels`     | いいえ   | `string[]`                                           | このプラグインをアクティブ化すべきチャネルIDです。         |
| `onRoutes`       | いいえ   | `string[]`                                           | このプラグインをアクティブ化すべきルート種別です。         |
| `onCapabilities` | いいえ   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | コントロールプレーンのアクティベーション計画で使われる広義の機能ヒントです。 |

## setupリファレンス

セットアップおよびオンボーディングサーフェスが、ランタイム読み込み前にプラグイン所有の軽量なメタデータを必要とする場合は、`setup`を使用します。

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

トップレベルの`cliBackends`は引き続き有効で、CLI推論バックエンドを記述し続けます。`setup.cliBackends`は、メタデータ専用に保つべきコントロールプレーン/セットアップフロー向けのセットアップ固有の記述サーフェスです。

### setup.providersリファレンス

| Field         | Required | Type       | 意味                                                                                 |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | はい     | `string`   | セットアップまたはオンボーディング中に公開されるプロバイダーIDです。                 |
| `authMethods` | いいえ   | `string[]` | フルランタイムを読み込まずにこのプロバイダーがサポートする、セットアップ/認証メソッドIDです。 |
| `envVars`     | いいえ   | `string[]` | プラグインランタイム読み込み前に汎用のセットアップ/ステータスサーフェスが確認できるenv varsです。 |

### setup fields

| Field              | Required | Type       | 意味                                                                       |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------- |
| `providers`        | いいえ   | `object[]` | セットアップおよびオンボーディング中に公開されるプロバイダーセットアップ記述子です。 |
| `cliBackends`      | いいえ   | `string[]` | フルランタイムをアクティブ化せずに利用可能なセットアップ時バックエンドIDです。       |
| `configMigrations` | いいえ   | `string[]` | このプラグインのセットアップサーフェスが所有する設定マイグレーションIDです。         |
| `requiresRuntime`  | いいえ   | `boolean`  | 記述子参照後もセットアップにプラグインランタイムの実行が必要かどうかです。           |

## uiHintsリファレンス

`uiHints`は、設定フィールド名から小さなレンダリングヒントへのマップです。

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

| Field         | Type       | 意味                                   |
| ------------- | ---------- | -------------------------------------- |
| `label`       | `string`   | ユーザー向けフィールドラベルです。     |
| `help`        | `string`   | 短い補助テキストです。                 |
| `tags`        | `string[]` | 任意のUIタグです。                     |
| `advanced`    | `boolean`  | このフィールドを高度な項目としてマークします。 |
| `sensitive`   | `boolean`  | このフィールドをシークレットまたは機密としてマークします。 |
| `placeholder` | `string`   | フォーム入力用のプレースホルダーテキストです。 |

## contractsリファレンス

OpenClawがプラグインランタイムをインポートせずに読み取れる、静的な機能所有権メタデータに対してのみ`contracts`を使用してください。

```json
{
  "contracts": {
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

各リストは任意です。

| Field                            | Type       | 意味                                                       |
| -------------------------------- | ---------- | ---------------------------------------------------------- |
| `speechProviders`                | `string[]` | このプラグインが所有するspeechプロバイダーIDです。         |
| `realtimeTranscriptionProviders` | `string[]` | このプラグインが所有するrealtime transcriptionプロバイダーIDです。 |
| `realtimeVoiceProviders`         | `string[]` | このプラグインが所有するrealtime voiceプロバイダーIDです。 |
| `mediaUnderstandingProviders`    | `string[]` | このプラグインが所有するmedia-understandingプロバイダーIDです。 |
| `imageGenerationProviders`       | `string[]` | このプラグインが所有するimage-generationプロバイダーIDです。 |
| `videoGenerationProviders`       | `string[]` | このプラグインが所有するvideo-generationプロバイダーIDです。 |
| `webFetchProviders`              | `string[]` | このプラグインが所有するweb-fetchプロバイダーIDです。      |
| `webSearchProviders`             | `string[]` | このプラグインが所有するweb searchプロバイダーIDです。     |
| `tools`                          | `string[]` | バンドルコントラクトチェック用にこのプラグインが所有するエージェントツール名です。 |

## channelConfigsリファレンス

チャネルプラグインがランタイム読み込み前に軽量な設定メタデータを必要とする場合は、`channelConfigs`を使用します。

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
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

各チャネルエントリーには次を含められます。

| Field         | Type                     | 意味                                                                                  |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>`用のJSON Schemaです。宣言された各チャネル設定エントリーで必須です。   |
| `uiHints`     | `Record<string, object>` | そのチャネル設定セクション向けの任意のUIラベル/プレースホルダー/機密性ヒントです。   |
| `label`       | `string`                 | ランタイムメタデータの準備ができていないときに、ピッカーおよび検査サーフェスへマージされるチャネルラベルです。 |
| `description` | `string`                 | 検査およびカタログサーフェス向けの短いチャネル説明です。                              |
| `preferOver`  | `string[]`               | 選択サーフェスでこのチャネルが優先すべき、レガシーまたは低優先度のプラグインIDです。 |

## modelSupportリファレンス

プラグインランタイムが読み込まれる前に、OpenClawが`gpt-5.4`や`claude-sonnet-4.6`のような短縮モデルIDからプロバイダープラグインを推定すべき場合は、`modelSupport`を使用します。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClawは次の優先順位を適用します。

- 明示的な`provider/model`参照では、所有元の`providers`マニフェストメタデータを使用します
- `modelPatterns`は`modelPrefixes`より優先されます
- 1つの非バンドルプラグインと1つのバンドルプラグインの両方が一致する場合、非バンドルプラグインが優先されます
- 残る曖昧さは、ユーザーまたは設定がプロバイダーを指定するまで無視されます

フィールド:

| Field           | Type       | 意味                                                                 |
| --------------- | ---------- | -------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 短縮モデルIDに対して`startsWith`で一致判定するプレフィックスです。    |
| `modelPatterns` | `string[]` | プロファイル接尾辞を除去した後の短縮モデルIDに対して一致判定する正規表現ソースです。 |

レガシーなトップレベル機能キーは非推奨です。`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`を`contracts`配下へ移動するには、`openclaw doctor --fix`を使用してください。通常のマニフェスト読み込みでは、これらのトップレベルフィールドを機能所有権としては扱いません。

## マニフェストとpackage.jsonの違い

この2つのファイルは異なる役割を持ちます。

| File                   | 用途                                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | プラグインコード実行前に存在している必要がある、検出、設定検証、認証選択メタデータ、およびUIヒント                             |
| `package.json`         | npmメタデータ、依存関係のインストール、およびエントリーポイント、インストールゲート、セットアップ、またはカタログメタデータに使用される`openclaw`ブロック |

どこにメタデータを置くべきか迷った場合は、次のルールを使ってください。

- OpenClawがプラグインコードを読み込む前に知っている必要があるなら、`openclaw.plugin.json`に入れます
- パッケージ化、エントリーファイル、またはnpmインストール動作に関するものなら、`package.json`に入れます

### 検出に影響するpackage.jsonフィールド

一部のランタイム前プラグインメタデータは、`openclaw.plugin.json`ではなく、意図的に`package.json`の`openclaw`ブロック配下に置かれます。

重要な例:

| Field                                                             | 意味                                                                                                                                   |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | ネイティブプラグインのエントリーポイントを宣言します。                                                                                 |
| `openclaw.setupEntry`                                             | オンボーディングおよび遅延チャネル起動中に使われる、軽量なセットアップ専用エントリーポイントです。                                   |
| `openclaw.channel`                                                | ラベル、ドキュメントパス、エイリアス、選択コピーなどの軽量なチャネルカタログメタデータです。                                         |
| `openclaw.channel.configuredState`                                | フルチャネルランタイムを読み込まずに「envのみのセットアップがすでに存在するか？」へ答えられる、軽量なconfigured-stateチェッカーメタデータです。 |
| `openclaw.channel.persistedAuthState`                             | フルチャネルランタイムを読み込まずに「何かがすでにサインイン済みか？」へ答えられる、軽量な永続化認証チェッカーメタデータです。      |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | バンドル済みおよび外部公開プラグイン用のインストール/更新ヒントです。                                                                  |
| `openclaw.install.defaultChoice`                                  | 複数のインストール元が利用可能な場合の優先インストールパスです。                                                                       |
| `openclaw.install.minHostVersion`                                 | `>=2026.3.22`のようなsemver下限で指定する、サポートされる最小OpenClawホストバージョンです。                                           |
| `openclaw.install.allowInvalidConfigRecovery`                     | 設定が無効な場合に、限定的なバンドルプラグイン再インストール回復パスを許可します。                                                     |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 起動時に、フルチャネルプラグインより前にセットアップ専用チャネルサーフェスを読み込めるようにします。                                 |

`openclaw.install.minHostVersion`は、インストール時およびマニフェストレジストリ読み込み時に適用されます。無効な値は拒否されます。新しすぎても有効な値であれば、古いホストではそのプラグインをスキップします。

`openclaw.install.allowInvalidConfigRecovery`は意図的に限定的です。任意の壊れた設定をインストール可能にするものではありません。現在は、バンドルプラグインパスの欠落や、その同じバンドルプラグインに対する古い`channels.<id>`エントリーなど、特定の古いバンドルプラグイン更新失敗からインストールフローを回復できるようにするだけです。無関係な設定エラーは引き続きインストールをブロックし、オペレーターは`openclaw doctor --fix`に案内されます。

`openclaw.channel.persistedAuthState`は、小さなチェッカーモジュール向けのパッケージメタデータです。

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

セットアップ、doctor、またはconfigured-stateフローで、フルチャネルプラグイン読み込み前に軽量なyes/no認証プローブが必要な場合に使います。対象のexportは、永続化状態だけを読み取る小さな関数にしてください。フルチャネルランタイムbarrel経由にはしないでください。

`openclaw.channel.configuredState`も、軽量なenvのみconfiguredチェック用に同じ形式に従います。

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

チャネルがenvまたはその他の小さな非ランタイム入力からconfigured-stateに答えられる場合に使います。チェックにフル設定解決や実際のチャネルランタイムが必要な場合は、代わりにそのロジックをプラグインの`config.hasConfiguredState`フックに置いてください。

## JSON Schema要件

- **すべてのプラグインはJSON Schemaを必ず提供する必要があります**。設定を受け付けない場合でも同様です。
- 空のスキーマでも構いません（例: `{ "type": "object", "additionalProperties": false }`）。
- スキーマはランタイム時ではなく、設定の読み取り/書き込み時に検証されます。

## 検証動作

- 不明な`channels.*`キーは、チャネルIDがプラグインマニフェストで宣言されていない限り、**エラー**です。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny`、`plugins.slots.*`は、**検出可能な**プラグインIDを参照する必要があります。不明なIDは**エラー**です。
- プラグインがインストール済みでも、マニフェストまたはスキーマが壊れている、または存在しない場合、検証は失敗し、Doctorがそのプラグインエラーを報告します。
- プラグイン設定が存在していても、そのプラグインが**無効**の場合、設定は保持され、Doctor + ログで**警告**が表示されます。

完全な`plugins.*`スキーマについては、[設定リファレンス](/ja-JP/gateway/configuration)を参照してください。

## 注意

- マニフェストは、ローカルファイルシステム読み込みを含む**ネイティブなOpenClawプラグインで必須**です。
- ランタイムは引き続きプラグインモジュールを個別に読み込みます。マニフェストは検出 + 検証専用です。
- ネイティブマニフェストはJSON5で解析されるため、最終的な値が依然としてオブジェクトである限り、コメント、末尾カンマ、クォートなしキーを使用できます。
- マニフェストローダーが読み取るのは文書化されたマニフェストフィールドだけです。ここにカスタムのトップレベルキーを追加するのは避けてください。
- `providerAuthEnvVars`は、認証プローブ、envマーカー検証、およびenv名を確認するためだけにプラグインランタイムを起動すべきでない類似のプロバイダー認証サーフェス向けの軽量メタデータパスです。
- `providerAuthAliases`を使うと、コアにその関係をハードコードせずに、プロバイダーバリアントが別のプロバイダーの認証env vars、認証プロファイル、設定ベースの認証、APIキーのオンボーディング選択肢を再利用できます。
- `channelEnvVars`は、シェルenvフォールバック、セットアッププロンプト、およびenv名を確認するためだけにプラグインランタイムを起動すべきでない類似のチャネルサーフェス向けの軽量メタデータパスです。
- `providerAuthChoices`は、認証選択ピッカー、`--auth-choice`解決、優先プロバイダーマッピング、およびプロバイダーランタイム読み込み前のシンプルなオンボーディングCLIフラグ登録向けの軽量メタデータパスです。プロバイダーコードを必要とするランタイムのウィザードメタデータについては、[Provider runtime hooks](/ja-JP/plugins/architecture#provider-runtime-hooks)を参照してください。
- 排他的なプラグイン種別は`plugins.slots.*`を通じて選択されます。
  - `kind: "memory"`は`plugins.slots.memory`で選択されます。
  - `kind: "context-engine"`は`plugins.slots.contextEngine`で選択されます（デフォルト: 組み込みの`legacy`）。
- `channels`、`providers`、`cliBackends`、`skills`は、プラグインで不要な場合は省略できます。
- プラグインがネイティブモジュールに依存する場合は、ビルド手順と、必要なパッケージマネージャーのallowlist要件（たとえばpnpm `allow-build-scripts`
  - `pnpm rebuild <package>`）を文書化してください。

## 関連

- [プラグインの構築](/ja-JP/plugins/building-plugins) — プラグインのはじめに
- [プラグインアーキテクチャ](/ja-JP/plugins/architecture) — 内部アーキテクチャ
- [SDK概要](/ja-JP/plugins/sdk-overview) — Plugin SDKリファレンス

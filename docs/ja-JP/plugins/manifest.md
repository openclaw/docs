---
read_when:
    - あなたはOpenClawのPluginを構築しています
    - Pluginの設定スキーマを提供するか、Pluginの検証エラーをデバッグする必要があります
summary: Pluginマニフェスト + JSONスキーマ要件（厳格な設定検証）
title: Pluginマニフェスト
x-i18n:
    generated_at: "2026-04-15T04:43:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba2183bfa8802871e4ef33a0ebea290606e8351e9e83e25ee72456addb768730
    source_path: plugins/manifest.md
    workflow: 15
---

# Pluginマニフェスト（`openclaw.plugin.json`）

このページは、**ネイティブなOpenClaw Pluginマニフェスト**のみを対象としています。

互換性のあるバンドルレイアウトについては、[Plugin bundles](/ja-JP/plugins/bundles)を参照してください。

互換バンドル形式では、異なるマニフェストファイルを使用します。

- Codexバンドル: `.codex-plugin/plugin.json`
- Claudeバンドル: `.claude-plugin/plugin.json` またはマニフェストなしのデフォルトClaudeコンポーネントレイアウト
- Cursorバンドル: `.cursor-plugin/plugin.json`

OpenClawはこれらのバンドルレイアウトも自動検出しますが、ここで説明する`openclaw.plugin.json`スキーマに対しては検証されません。

互換バンドルについて、OpenClawは現在、レイアウトがOpenClawランタイムの期待に一致する場合、バンドルメタデータに加えて、宣言されたskillルート、Claudeコマンドルート、Claudeバンドルの`settings.json`デフォルト値、ClaudeバンドルのLSPデフォルト値、対応するフックパックを読み取ります。

すべてのネイティブOpenClaw Pluginは、**pluginルート**に`openclaw.plugin.json`ファイルを**必ず**含める必要があります。OpenClawはこのマニフェストを使って、**Pluginコードを実行せずに**設定を検証します。マニフェストが存在しない、または無効な場合はPluginエラーとして扱われ、設定の検証はブロックされます。

完全なPluginシステムガイドについては、[Plugins](/ja-JP/tools/plugin)を参照してください。
ネイティブのケーパビリティモデルと現在の外部互換性ガイダンスについては、[Capability model](/ja-JP/plugins/architecture#public-capability-model)を参照してください。

## このファイルの役割

`openclaw.plugin.json`は、OpenClawがあなたのPluginコードを読み込む前に読み取るメタデータです。

用途:

- Pluginの識別情報
- 設定の検証
- Pluginランタイムを起動せずに利用可能であるべき認証およびオンボーディングのメタデータ
- コントロールプレーンのサーフェスがランタイム読み込み前に確認できる、低コストなアクティベーションヒント
- セットアップ/オンボーディングのサーフェスがランタイム読み込み前に確認できる、低コストなセットアップ記述子
- Pluginランタイム読み込み前に解決されるべきエイリアスおよび自動有効化メタデータ
- Pluginランタイム読み込み前にPluginを自動アクティベートすべきモデルファミリー所有権の短縮メタデータ
- バンドル互換配線とコントラクトカバレッジに使われる静的なケーパビリティ所有権スナップショット
- 共有`openclaw qa`ホストがPluginランタイム読み込み前に確認できる、低コストなQAランナーメタデータ
- ランタイムを読み込まずにカタログおよび検証サーフェスにマージされるべき、チャネル固有の設定メタデータ
- 設定UIのヒント

用途ではないもの:

- ランタイム動作の登録
- コードのエントリーポイントの宣言
- npmインストールメタデータ

これらはPluginコードおよび`package.json`に属します。

## 最小の例

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

## トップレベルフィールドのリファレンス

| フィールド                            | 必須     | 型                               | 意味                                                                                                                                                                                                         |
| ------------------------------------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                  | はい     | `string`                         | 正規のPlugin idです。このidは`plugins.entries.<id>`で使用されます。                                                                                                                                         |
| `configSchema`                        | はい     | `object`                         | このPlugin設定用のインラインJSON Schemaです。                                                                                                                                                               |
| `enabledByDefault`                    | いいえ   | `true`                           | バンドルされたPluginをデフォルトで有効としてマークします。デフォルトで無効のままにするには、省略するか、`true`以外の値を設定します。                                                                      |
| `legacyPluginIds`                     | いいえ   | `string[]`                       | この正規Plugin idに正規化されるレガシーidです。                                                                                                                                                             |
| `autoEnableWhenConfiguredProviders`   | いいえ   | `string[]`                       | 認証、設定、またはモデル参照で言及されたときに、このPluginを自動有効化すべきprovider idです。                                                                                                               |
| `kind`                                | いいえ   | `"memory"` \| `"context-engine"` | `plugins.slots.*`で使用される排他的なPlugin種別を宣言します。                                                                                                                                               |
| `channels`                            | いいえ   | `string[]`                       | このPluginが所有するchannel idです。検出と設定検証に使用されます。                                                                                                                                          |
| `providers`                           | いいえ   | `string[]`                       | このPluginが所有するprovider idです。                                                                                                                                                                        |
| `modelSupport`                        | いいえ   | `object`                         | ランタイム前にPluginを自動ロードするために使われる、マニフェスト所有の短縮モデルファミリーメタデータです。                                                                                                  |
| `cliBackends`                         | いいえ   | `string[]`                       | このPluginが所有するCLI推論バックエンドidです。明示的な設定参照からの起動時自動アクティベーションに使用されます。                                                                                          |
| `commandAliases`                      | いいえ   | `object[]`                       | ランタイム読み込み前に、Pluginを認識した設定およびCLI診断を生成すべき、このPluginが所有するコマンド名です。                                                                                                 |
| `providerAuthEnvVars`                 | いいえ   | `Record<string, string[]>`       | OpenClawがPluginコードを読み込まずに確認できる、低コストなprovider認証環境変数メタデータです。                                                                                                             |
| `providerAuthAliases`                 | いいえ   | `Record<string, string>`         | 認証ルックアップに別のprovider idを再利用すべきprovider idです。たとえば、ベースproviderのAPIキーと認証プロファイルを共有するcoding providerなどです。                                                    |
| `channelEnvVars`                      | いいえ   | `Record<string, string[]>`       | OpenClawがPluginコードを読み込まずに確認できる、低コストなchannel環境変数メタデータです。環境変数駆動のchannelセットアップや、汎用の起動/設定ヘルパーが認識すべき認証サーフェスにはこれを使用してください。 |
| `providerAuthChoices`                 | いいえ   | `object[]`                       | オンボーディングピッカー、優先provider解決、単純なCLIフラグ配線のための、低コストな認証選択メタデータです。                                                                                                |
| `activation`                          | いいえ   | `object`                         | provider、command、channel、route、およびケーパビリティトリガーによる読み込みのための、低コストなアクティベーションヒントです。メタデータのみであり、実際の動作は引き続きPluginランタイムが所有します。     |
| `setup`                               | いいえ   | `object`                         | 検出およびセットアップのサーフェスがPluginランタイムを読み込まずに確認できる、低コストなセットアップ/オンボーディング記述子です。                                                                          |
| `qaRunners`                           | いいえ   | `object[]`                       | 共有`openclaw qa`ホストがPluginランタイム読み込み前に使用する、低コストなQAランナー記述子です。                                                                                                             |
| `contracts`                           | いいえ   | `object`                         | speech、realtime transcription、realtime voice、media-understanding、image-generation、music-generation、video-generation、web-fetch、web search、およびツール所有権のための静的なバンドル済みケーパビリティスナップショットです。 |
| `channelConfigs`                      | いいえ   | `Record<string, object>`         | ランタイム読み込み前に検出および検証サーフェスへマージされる、マニフェスト所有のchannel設定メタデータです。                                                                                                |
| `skills`                              | いいえ   | `string[]`                       | pluginルートからの相対パスで指定する、読み込むSkillsディレクトリです。                                                                                                                                      |
| `name`                                | いいえ   | `string`                         | 人が読めるPlugin名です。                                                                                                                                                                                     |
| `description`                         | いいえ   | `string`                         | Pluginサーフェスに表示される短い要約です。                                                                                                                                                                   |
| `version`                             | いいえ   | `string`                         | 情報用のPluginバージョンです。                                                                                                                                                                               |
| `uiHints`                             | いいえ   | `Record<string, object>`         | 設定フィールド用のUIラベル、プレースホルダー、および機密性ヒントです。                                                                                                                                      |

## `providerAuthChoices`リファレンス

各`providerAuthChoices`エントリは、1つのオンボーディングまたは認証の選択肢を記述します。
OpenClawはこれをproviderランタイムが読み込まれる前に読み取ります。

| フィールド            | 必須     | 型                                              | 意味                                                                                             |
| --------------------- | -------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `provider`            | はい     | `string`                                        | この選択肢が属するprovider idです。                                                               |
| `method`              | はい     | `string`                                        | ディスパッチ先の認証メソッドidです。                                                             |
| `choiceId`            | はい     | `string`                                        | オンボーディングおよびCLIフローで使われる、安定した認証選択肢idです。                            |
| `choiceLabel`         | いいえ   | `string`                                        | ユーザー向けラベルです。省略した場合、OpenClawは`choiceId`にフォールバックします。               |
| `choiceHint`          | いいえ   | `string`                                        | ピッカー用の短い補助テキストです。                                                               |
| `assistantPriority`   | いいえ   | `number`                                        | 値が小さいほど、assistant主導のインタラクティブピッカーで先に並びます。                          |
| `assistantVisibility` | いいえ   | `"visible"` \| `"manual-only"`                  | assistantピッカーではこの選択肢を非表示にしつつ、手動CLI選択は引き続き許可します。               |
| `deprecatedChoiceIds` | いいえ   | `string[]`                                      | この置き換え選択肢へユーザーをリダイレクトすべき、レガシーな選択肢idです。                       |
| `groupId`             | いいえ   | `string`                                        | 関連する選択肢をグループ化するための任意のグループidです。                                       |
| `groupLabel`          | いいえ   | `string`                                        | そのグループのユーザー向けラベルです。                                                           |
| `groupHint`           | いいえ   | `string`                                        | そのグループ用の短い補助テキストです。                                                           |
| `optionKey`           | いいえ   | `string`                                        | 単一フラグの単純な認証フロー用の内部オプションキーです。                                         |
| `cliFlag`             | いいえ   | `string`                                        | `--openrouter-api-key`のようなCLIフラグ名です。                                                  |
| `cliOption`           | いいえ   | `string`                                        | `--openrouter-api-key <key>`のような完全なCLIオプション形式です。                                |
| `cliDescription`      | いいえ   | `string`                                        | CLIヘルプで使われる説明です。                                                                    |
| `onboardingScopes`    | いいえ   | `Array<"text-inference" \| "image-generation">` | この選択肢を表示すべきオンボーディングサーフェスです。省略した場合、デフォルトは`["text-inference"]`です。 |

## `commandAliases`リファレンス

Pluginが、ユーザーが誤って`plugins.allow`に入れたり、ルートCLIコマンドとして実行しようとしたりする可能性があるランタイムコマンド名を所有している場合は、`commandAliases`を使用します。OpenClawはこのメタデータを、Pluginランタイムコードをインポートせずに診断のために使用します。

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

| フィールド   | 必須     | 型                | 意味                                                                          |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------------- |
| `name`       | はい     | `string`          | このPluginに属するコマンド名です。                                            |
| `kind`       | いいえ   | `"runtime-slash"` | このエイリアスを、ルートCLIコマンドではなくチャットのスラッシュコマンドとして示します。 |
| `cliCommand` | いいえ   | `string`          | 存在する場合、CLI操作向けに提案する関連ルートCLIコマンドです。                |

## `activation`リファレンス

Pluginが、どのコントロールプレーンイベントによって後でアクティベートされるべきかを低コストで宣言できる場合は、`activation`を使用します。

## `qaRunners`リファレンス

Pluginが共有`openclaw qa`ルート配下に1つ以上のトランスポートランナーを追加する場合は、`qaRunners`を使用します。このメタデータは低コストかつ静的に保ってください。実際のCLI登録は、`qaRunnerCliRegistrations`をエクスポートする軽量な`runtime-api.ts`サーフェスを通じて、引き続きPluginランタイムが所有します。

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

| フィールド    | 必須     | 型       | 意味                                                                          |
| ------------- | -------- | -------- | ----------------------------------------------------------------------------- |
| `commandName` | はい     | `string` | `openclaw qa`配下にマウントされるサブコマンドです。たとえば`matrix`です。     |
| `description` | いいえ   | `string` | 共有ホストがスタブコマンドを必要とする場合に使われるフォールバックのヘルプテキストです。 |

このブロックはメタデータのみです。ランタイム動作を登録するものではなく、`register(...)`、`setupEntry`、その他のランタイム/Pluginエントリーポイントを置き換えるものでもありません。現在のコンシューマーはこれを、より広いPlugin読み込み前の絞り込みヒントとして使っているため、`activation`メタデータが欠けていても通常は性能コストが増えるだけです。レガシーなマニフェスト所有権フォールバックがまだ存在する限り、正しさは変わらないはずです。

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

| フィールド       | 必須     | 型                                                   | 意味                                                                     |
| ---------------- | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------ |
| `onProviders`    | いいえ   | `string[]`                                           | リクエスト時にこのPluginをアクティベートすべきprovider idです。          |
| `onCommands`     | いいえ   | `string[]`                                           | このPluginをアクティベートすべきcommand idです。                         |
| `onChannels`     | いいえ   | `string[]`                                           | このPluginをアクティベートすべきchannel idです。                         |
| `onRoutes`       | いいえ   | `string[]`                                           | このPluginをアクティベートすべきroute種別です。                          |
| `onCapabilities` | いいえ   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | コントロールプレーンのアクティベーション計画で使われる広範なケーパビリティヒントです。 |

現在のライブコンシューマー:

- コマンドトリガーのCLI計画は、レガシーな`commandAliases[].cliCommand`または`commandAliases[].name`にフォールバックします
- チャネルトリガーのセットアップ/チャネル計画は、明示的なチャネルアクティベーションメタデータがない場合、レガシーな`channels[]`所有権にフォールバックします
- providerトリガーのセットアップ/ランタイム計画は、明示的なproviderアクティベーションメタデータがない場合、レガシーな`providers[]`およびトップレベル`cliBackends[]`所有権にフォールバックします

## `setup`リファレンス

ランタイム読み込み前に、セットアップおよびオンボーディングのサーフェスがPlugin所有の低コストなメタデータを必要とする場合は、`setup`を使用します。

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

トップレベルの`cliBackends`は引き続き有効で、CLI推論バックエンドを記述し続けます。`setup.cliBackends`は、メタデータのみを維持すべきコントロールプレーン/セットアップフロー向けの、セットアップ固有の記述子サーフェスです。

`setup.providers`および`setup.cliBackends`が存在する場合、これらはセットアップ検出における優先的な記述子ファーストのルックアップサーフェスになります。記述子が候補Pluginを絞り込むだけで、セットアップ時にさらに豊富なランタイムフックが必要な場合は、`requiresRuntime: true`を設定し、フォールバック実行パスとして`setup-api`を維持してください。

セットアップのルックアップはPlugin所有の`setup-api`コードを実行できるため、正規化された`setup.providers[].id`および`setup.cliBackends[]`の値は、検出されたPlugin全体で一意でなければなりません。所有権が曖昧な場合は、検出順で勝者を選ぶのではなく、クローズドに失敗します。

### `setup.providers`リファレンス

| フィールド    | 必須     | 型         | 意味                                                                                   |
| ------------- | -------- | ---------- | -------------------------------------------------------------------------------------- |
| `id`          | はい     | `string`   | セットアップまたはオンボーディング中に公開されるprovider idです。正規化されたidはグローバルに一意に保ってください。 |
| `authMethods` | いいえ   | `string[]` | フルランタイムを読み込まずにこのproviderがサポートするセットアップ/認証メソッドidです。 |
| `envVars`     | いいえ   | `string[]` | 汎用のセットアップ/ステータスサーフェスがPluginランタイム読み込み前に確認できる環境変数です。 |

### `setup`フィールド

| フィールド         | 必須     | 型         | 意味                                                                                                  |
| ------------------ | -------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `providers`        | いいえ   | `object[]` | セットアップおよびオンボーディング中に公開されるproviderセットアップ記述子です。                    |
| `cliBackends`      | いいえ   | `string[]` | 記述子ファーストのセットアップルックアップで使われるセットアップ時バックエンドidです。正規化されたidはグローバルに一意に保ってください。 |
| `configMigrations` | いいえ   | `string[]` | このPluginのセットアップサーフェスが所有する設定移行idです。                                         |
| `requiresRuntime`  | いいえ   | `boolean`  | 記述子ルックアップ後もセットアップに`setup-api`の実行が必要かどうかです。                            |

## `uiHints`リファレンス

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

各フィールドヒントには次を含めることができます。

| フィールド    | 型         | 意味                                   |
| ------------- | ---------- | -------------------------------------- |
| `label`       | `string`   | ユーザー向けのフィールドラベルです。   |
| `help`        | `string`   | 短い補助テキストです。                 |
| `tags`        | `string[]` | 任意のUIタグです。                     |
| `advanced`    | `boolean`  | このフィールドを高度な項目として示します。 |
| `sensitive`   | `boolean`  | このフィールドを秘密情報または機密情報として示します。 |
| `placeholder` | `string`   | フォーム入力用のプレースホルダーテキストです。 |

## `contracts`リファレンス

OpenClawがPluginランタイムをインポートせずに読み取れる、静的なケーパビリティ所有権メタデータにのみ`contracts`を使用してください。

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

| フィールド                       | 型         | 意味                                                       |
| -------------------------------- | ---------- | ---------------------------------------------------------- |
| `speechProviders`                | `string[]` | このPluginが所有するspeech provider idです。               |
| `realtimeTranscriptionProviders` | `string[]` | このPluginが所有するrealtime-transcription provider idです。 |
| `realtimeVoiceProviders`         | `string[]` | このPluginが所有するrealtime-voice provider idです。       |
| `mediaUnderstandingProviders`    | `string[]` | このPluginが所有するmedia-understanding provider idです。  |
| `imageGenerationProviders`       | `string[]` | このPluginが所有するimage-generation provider idです。     |
| `videoGenerationProviders`       | `string[]` | このPluginが所有するvideo-generation provider idです。     |
| `webFetchProviders`              | `string[]` | このPluginが所有するweb-fetch provider idです。            |
| `webSearchProviders`             | `string[]` | このPluginが所有するweb-search provider idです。           |
| `tools`                          | `string[]` | バンドルされたコントラクトチェックのためにこのPluginが所有するagentツール名です。 |

## `channelConfigs`リファレンス

channel Pluginが、ランタイム読み込み前に低コストな設定メタデータを必要とする場合は、`channelConfigs`を使用します。

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

各channelエントリには次を含めることができます。

| フィールド    | 型                       | 意味                                                                                         |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>`用のJSON Schemaです。宣言された各channel設定エントリで必須です。             |
| `uiHints`     | `Record<string, object>` | そのchannel設定セクション用の任意のUIラベル/プレースホルダー/機密性ヒントです。             |
| `label`       | `string`                 | ランタイムメタデータの準備ができていないときに、ピッカーおよびinspectサーフェスにマージされるchannelラベルです。 |
| `description` | `string`                 | inspectおよびカタログサーフェス向けの短いchannel説明です。                                  |
| `preferOver`  | `string[]`               | 選択サーフェスでこのchannelが優先されるべき、レガシーまたは低優先度のplugin idです。        |

## `modelSupport`リファレンス

Pluginランタイム読み込み前に、OpenClawが`gpt-5.4`や`claude-sonnet-4.6`のような短縮モデルidからあなたのprovider Pluginを推論すべき場合は、`modelSupport`を使用します。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClawは次の優先順位を適用します。

- 明示的な`provider/model`参照では、所有する`providers`マニフェストメタデータが使われます
- `modelPatterns`は`modelPrefixes`より優先されます
- バンドルされていないPluginとバンドルされたPluginの両方が一致する場合は、バンドルされていないPluginが優先されます
- 残る曖昧さは、ユーザーまたは設定がproviderを指定するまで無視されます

フィールド:

| フィールド      | 型         | 意味                                                                                 |
| --------------- | ---------- | ------------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | 短縮モデルidに対して`startsWith`で一致させるプレフィックスです。                    |
| `modelPatterns` | `string[]` | プロファイル接尾辞を除去した後の短縮モデルidに対して一致させる正規表現ソースです。 |

レガシーなトップレベルのケーパビリティキーは非推奨です。`openclaw doctor --fix`を使用して、`speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders`を`contracts`配下へ移動してください。通常のマニフェスト読み込みでは、これらのトップレベルフィールドはもはやケーパビリティ所有権として扱われません。

## マニフェストと`package.json`の違い

この2つのファイルは異なる役割を持ちます。

| ファイル                 | 用途                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json`   | 検出、設定検証、認証選択メタデータ、およびPluginコード実行前に存在している必要があるUIヒント                                        |
| `package.json`           | npmメタデータ、依存関係のインストール、およびエントリーポイント、インストールゲーティング、セットアップ、またはカタログメタデータに使われる`openclaw`ブロック |

どこに置くべきメタデータか迷った場合は、次のルールを使ってください。

- OpenClawがPluginコードを読み込む前に知っておく必要がある場合は、`openclaw.plugin.json`に置きます
- パッケージング、エントリーファイル、またはnpmインストール動作に関するものであれば、`package.json`に置きます

### 検出に影響する`package.json`フィールド

一部のランタイム前Pluginメタデータは、`openclaw.plugin.json`ではなく、意図的に`package.json`の`openclaw`ブロック配下に置かれています。

重要な例:

| フィールド                                                          | 意味                                                                                                                                         |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                               | ネイティブPluginエントリーポイントを宣言します。                                                                                            |
| `openclaw.setupEntry`                                               | オンボーディングおよび遅延チャネル起動時に使われる、軽量なセットアップ専用エントリーポイントです。                                          |
| `openclaw.channel`                                                  | ラベル、ドキュメントパス、エイリアス、選択コピーのような低コストなchannelカタログメタデータです。                                           |
| `openclaw.channel.configuredState`                                  | フルchannelランタイムを読み込まずに「環境変数のみのセットアップがすでに存在するか」を判定できる、軽量なconfigured-stateチェッカーメタデータです。 |
| `openclaw.channel.persistedAuthState`                               | フルchannelランタイムを読み込まずに「すでに何かサインイン済みか」を判定できる、軽量な永続化認証チェッカーメタデータです。                   |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`           | バンドル済みPluginおよび外部公開Plugin向けのインストール/更新ヒントです。                                                                    |
| `openclaw.install.defaultChoice`                                    | 複数のインストール元が利用可能な場合の優先インストールパスです。                                                                             |
| `openclaw.install.minHostVersion`                                   | `>=2026.3.22`のようなsemver下限で表される、サポートされる最小OpenClawホストバージョンです。                                                 |
| `openclaw.install.allowInvalidConfigRecovery`                       | 設定が無効な場合に、限定されたバンドル済みPlugin再インストール回復パスを許可します。                                                         |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`   | 起動時に、フルchannel Pluginより先にセットアップ専用channelサーフェスを読み込めるようにします。                                              |

`openclaw.install.minHostVersion`は、インストール時およびマニフェストレジストリ読み込み時に適用されます。無効な値は拒否されます。有効ではあるがより新しい値の場合、古いホストではそのPluginはスキップされます。

`openclaw.install.allowInvalidConfigRecovery`は意図的に限定的です。任意の壊れた設定をインストール可能にするものではありません。現在は、特定の古いバンドル済みPluginアップグレード失敗、たとえば欠落したバンドル済みPluginパスや、同じバンドル済みPluginに対する古い`channels.<id>`エントリなどから、インストールフローが回復することだけを許可します。無関係な設定エラーは引き続きインストールをブロックし、オペレーターを`openclaw doctor --fix`へ案内します。

`openclaw.channel.persistedAuthState`は、小さなチェッカーモジュールのためのパッケージメタデータです。

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

セットアップ、doctor、またはconfigured-stateフローが、フルchannel Plugin読み込み前に低コストなyes/no認証プローブを必要とする場合に使用します。対象のエクスポートは、永続化された状態のみを読み取る小さな関数であるべきです。フルchannelランタイムbarrelを経由させないでください。

`openclaw.channel.configuredState`も、低コストな環境変数のみのconfiguredチェック向けに同じ形を取ります。

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

channelが、環境変数またはその他の小さな非ランタイム入力からconfigured-stateを判定できる場合に使用します。チェックに完全な設定解決または実際のchannelランタイムが必要な場合は、代わりにそのロジックをPluginの`config.hasConfiguredState`フックに置いてください。

## JSON Schema要件

- **すべてのPluginはJSON Schemaを必ず含める必要があります**。設定を受け付けない場合でも同様です。
- 空のスキーマでも許可されます（例: `{ "type": "object", "additionalProperties": false }`）。
- スキーマはランタイム時ではなく、設定の読み取り/書き込み時に検証されます。

## 検証動作

- 不明な`channels.*`キーは、channel idがPluginマニフェストで宣言されていない限り、**エラー**です。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny`、および`plugins.slots.*`は、**検出可能な**Plugin idを参照していなければなりません。不明なidは**エラー**です。
- Pluginがインストールされていても、マニフェストまたはスキーマが壊れているか存在しない場合、検証は失敗し、DoctorがそのPluginエラーを報告します。
- Plugin設定が存在しても、Pluginが**無効**な場合、設定は保持され、Doctor + ログに**警告**が表示されます。

完全な`plugins.*`スキーマについては、[Configuration reference](/ja-JP/gateway/configuration)を参照してください。

## 注記

- マニフェストは、ローカルファイルシステムからの読み込みを含め、**ネイティブなOpenClaw Pluginでは必須**です。
- ランタイムは引き続きPluginモジュールを別途読み込みます。マニフェストは検出と検証専用です。
- ネイティブマニフェストはJSON5で解析されるため、最終的な値が引き続きオブジェクトである限り、コメント、末尾カンマ、クォートなしキーが受け入れられます。
- マニフェストローダーが読み取るのは文書化されたマニフェストフィールドのみです。ここにカスタムのトップレベルキーを追加するのは避けてください。
- `providerAuthEnvVars`は、認証プローブ、環境変数マーカー検証、および環境変数名を確認するためだけにPluginランタイムを起動すべきでない類似のprovider認証サーフェス向けの、低コストなメタデータパスです。
- `providerAuthAliases`により、providerバリアントは、その関係をcoreにハードコードすることなく、別のproviderの認証環境変数、認証プロファイル、設定ベースの認証、APIキーのオンボーディング選択肢を再利用できます。
- `channelEnvVars`は、シェル環境変数フォールバック、セットアッププロンプト、および環境変数名を確認するためだけにPluginランタイムを起動すべきでない類似のchannelサーフェス向けの、低コストなメタデータパスです。
- `providerAuthChoices`は、認証選択肢ピッカー、`--auth-choice`解決、優先providerマッピング、およびproviderランタイム読み込み前の単純なオンボーディングCLIフラグ登録向けの、低コストなメタデータパスです。providerコードを必要とするランタイムのウィザードメタデータについては、[Provider runtime hooks](/ja-JP/plugins/architecture#provider-runtime-hooks)を参照してください。
- 排他的なPlugin種別は`plugins.slots.*`を通じて選択されます。
  - `kind: "memory"`は`plugins.slots.memory`で選択されます。
  - `kind: "context-engine"`は`plugins.slots.contextEngine`で選択されます（デフォルト: 組み込みの`legacy`）。
- `channels`、`providers`、`cliBackends`、`skills`は、Pluginがそれらを必要としない場合は省略できます。
- Pluginがネイティブモジュールに依存している場合は、ビルド手順と、必要なパッケージマネージャーの許可リスト要件（たとえばpnpmの`allow-build-scripts`、`pnpm rebuild <package>`）を文書化してください。

## 関連

- [Building Plugins](/ja-JP/plugins/building-plugins) — Pluginのはじめに
- [Plugin Architecture](/ja-JP/plugins/architecture) — 内部アーキテクチャ
- [SDK Overview](/ja-JP/plugins/sdk-overview) — Plugin SDKリファレンス

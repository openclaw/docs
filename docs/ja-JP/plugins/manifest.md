---
read_when:
    - |-
      OpenClaw Plugin を開発している】【。analysis to=functions.read ,超碰commentary  彩票天天  彩神争霸电脑版 彩票平台招商 json
      {"path":"/home/runner/work/docs/docs/source/scripts/docs-i18n/AGENTS.md"}
    - Plugin の config schema を提供する必要がある、または Plugin の検証エラーをデバッグする必要がある
summary: Plugin manifest + JSON schema の要件（厳格な config 検証）
title: Plugin Manifest
x-i18n:
    generated_at: "2026-04-23T14:06:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: d48810f604aa0c3ff8553528cfa4cb735d1d5e7a15b1bbca6152070d6c8f9cce
    source_path: plugins/manifest.md
    workflow: 15
---

# Plugin manifest (`openclaw.plugin.json`)

このページは**ネイティブ OpenClaw Plugin Manifest**専用です。

互換 bundle レイアウトについては、[Plugin bundles](/ja-JP/plugins/bundles) を参照してください。

互換 bundle 形式では、異なる manifest ファイルを使用します:

- Codex bundle: `.codex-plugin/plugin.json`
- Claude bundle: `.claude-plugin/plugin.json` または manifest のないデフォルトの Claude component
  レイアウト
- Cursor bundle: `.cursor-plugin/plugin.json`

OpenClaw はそれらの bundle レイアウトも自動検出しますが、ここで説明する
`openclaw.plugin.json` schema に対しては検証されません。

互換 bundle について、OpenClaw は現在、bundle メタデータに加えて、宣言された
skill root、Claude command root、Claude bundle の `settings.json` デフォルト、
Claude bundle の LSP デフォルト、およびレイアウトが OpenClaw ランタイムの想定と一致する場合の
サポート対象 hook pack を読み取ります。

すべてのネイティブ OpenClaw Plugin は、**Plugin root** に `openclaw.plugin.json` ファイルを
必ず含める必要があります。OpenClaw はこの manifest を使用して、**Plugin コードを実行せずに**
設定を検証します。manifest が欠けているか無効な場合は Plugin エラーとして扱われ、
config 検証がブロックされます。

完全な Plugin システムガイドについては [Plugins](/ja-JP/tools/plugin) を参照してください。
ネイティブ capability モデルと現在の外部互換ガイダンスについては:
[Capability model](/ja-JP/plugins/architecture#public-capability-model)。

## このファイルの役割

`openclaw.plugin.json` は、Plugin コードを読み込む前に OpenClaw が読み取る
メタデータです。

用途:

- Plugin の識別情報
- config 検証
- Plugin ランタイムを起動せずに利用可能であるべき auth およびオンボーディングのメタデータ
- ランタイム読み込み前に control-plane の各画面が確認できる、軽量な有効化ヒント
- ランタイム読み込み前に setup/オンボーディングの各画面が確認できる、軽量なセットアップ記述子
- Plugin ランタイム読み込み前に解決されるべき alias と自動有効化メタデータ
- Plugin ランタイム読み込み前に Plugin を自動有効化すべき shorthand model-family 所有メタデータ
- bundled compat 配線および contract カバレッジに使用される静的 capability 所有スナップショット
- 共有 `openclaw qa` ホストが Plugin ランタイム読み込み前に確認できる、軽量な QA runner メタデータ
- ランタイムを読み込まずに catalog および検証画面へマージされるべき、channel 固有の config メタデータ
- config UI ヒント

用途にしないもの:

- ランタイム動作の登録
- コードの entrypoint 宣言
- npm インストールメタデータ

それらは Plugin コードと `package.json` に属します。

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
  "providerEndpoints": [
    {
      "endpointClass": "xai-native",
      "hosts": ["api.x.ai"]
    }
  ],
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

## トップレベルフィールドのリファレンス

| フィールド                           | 必須     | 型                               | 意味                                                                                                                                                                                                                              |
| ------------------------------------ | -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | はい     | `string`                         | 正規の Plugin id。これは `plugins.entries.<id>` で使用される id です。                                                                                                                                                            |
| `configSchema`                       | はい     | `object`                         | この Plugin の config 用インライン JSON Schema。                                                                                                                                                                                  |
| `enabledByDefault`                   | いいえ   | `true`                           | 同梱 Plugin をデフォルトで有効にすることを示します。デフォルトで無効のままにするには、省略するか、`true` 以外の値を設定します。                                                                                                 |
| `legacyPluginIds`                    | いいえ   | `string[]`                       | この正規 Plugin id に正規化される旧 id。                                                                                                                                                                                          |
| `autoEnableWhenConfiguredProviders`  | いいえ   | `string[]`                       | auth、config、または model ref でこれらの provider id が参照されたときに、この Plugin を自動有効化すべきであることを示します。                                                                                                  |
| `kind`                               | いいえ   | `"memory"` \| `"context-engine"` | `plugins.slots.*` で使用される排他的な Plugin 種別を宣言します。                                                                                                                                                                  |
| `channels`                           | いいえ   | `string[]`                       | この Plugin が所有する channel id。検出と config 検証に使用されます。                                                                                                                                                             |
| `providers`                          | いいえ   | `string[]`                       | この Plugin が所有する provider id。                                                                                                                                                                                              |
| `modelSupport`                       | いいえ   | `object`                         | ランタイム前に Plugin を自動読み込みするために使われる、Manifest 所有の shorthand model-family メタデータ。                                                                                                                      |
| `providerEndpoints`                  | いいえ   | `object[]`                       | provider ランタイム読み込み前に core が分類しなければならない provider route 用の、Manifest 所有の endpoint host/baseUrl メタデータ。                                                                                            |
| `cliBackends`                        | いいえ   | `string[]`                       | この Plugin が所有する CLI inference backend id。明示的 config ref からの起動時自動有効化に使用されます。                                                                                                                        |
| `syntheticAuthRefs`                  | いいえ   | `string[]`                       | ランタイム読み込み前のコールド model 検出中に、この Plugin 所有の synthetic auth hook を probe すべき provider または CLI backend ref。                                                                                          |
| `nonSecretAuthMarkers`               | いいえ   | `string[]`                       | secret ではないローカル、OAuth、または ambient credential 状態を表す、同梱 Plugin 所有のプレースホルダー API key 値。                                                                                                           |
| `commandAliases`                     | いいえ   | `object[]`                       | ランタイム読み込み前に Plugin 認識の config と CLI 診断を出すべき、この Plugin が所有するコマンド名。                                                                                                                             |
| `providerAuthEnvVars`                | いいえ   | `Record<string, string[]>`       | Plugin コードを読み込まずに OpenClaw が確認できる、軽量な provider-auth env メタデータ。                                                                                                                                         |
| `providerAuthAliases`                | いいえ   | `Record<string, string>`         | auth lookup に別の provider id を再利用すべき provider id。たとえば、ベース provider の API key と auth profiles を共有する coding provider など。                                                                              |
| `channelEnvVars`                     | いいえ   | `Record<string, string[]>`       | Plugin コードを読み込まずに OpenClaw が確認できる、軽量な channel env メタデータ。env 駆動の channel セットアップや、汎用の起動/config ヘルパーに見せたい auth 画面にはこれを使用します。                                      |
| `providerAuthChoices`                | いいえ   | `object[]`                       | オンボーディング picker、preferred-provider 解決、および単純な CLI flag 配線のための軽量 auth-choice メタデータ。                                                                                                               |
| `activation`                         | いいえ   | `object`                         | provider、command、channel、route、および capability トリガー読み込みのための軽量な有効化ヒント。メタデータ専用であり、実際の動作は依然として Plugin ランタイムが所有します。                                                  |
| `setup`                              | いいえ   | `object`                         | 検出およびセットアップ画面が Plugin ランタイムを読み込まずに確認できる、軽量なセットアップ/オンボーディング記述子。                                                                                                              |
| `qaRunners`                          | いいえ   | `object[]`                       | 共有 `openclaw qa` ホストが Plugin ランタイム読み込み前に使用する、軽量な QA runner 記述子。                                                                                                                                     |
| `contracts`                          | いいえ   | `object`                         | 外部 auth hook、speech、realtime transcription、realtime voice、media-understanding、image-generation、music-generation、video-generation、web-fetch、Web 検索、および tool 所有権に関する、静的な bundled capability スナップショット。 |
| `mediaUnderstandingProviderMetadata` | いいえ   | `Record<string, object>`         | `contracts.mediaUnderstandingProviders` で宣言された provider id 用の、軽量な media-understanding デフォルト。                                                                                                                   |
| `channelConfigs`                     | いいえ   | `Record<string, object>`         | ランタイム読み込み前に検出および検証画面へマージされる、Manifest 所有の channel config メタデータ。                                                                                                                               |
| `skills`                             | いいえ   | `string[]`                       | Plugin root からの相対パスで読み込む Skills ディレクトリ。                                                                                                                                                                        |
| `name`                               | いいえ   | `string`                         | 人が読める Plugin 名。                                                                                                                                                                                                            |
| `description`                        | いいえ   | `string`                         | Plugin 画面に表示される短い要約。                                                                                                                                                                                                 |
| `version`                            | いいえ   | `string`                         | 情報用の Plugin バージョン。                                                                                                                                                                                                      |
| `uiHints`                            | いいえ   | `Record<string, object>`         | config field 用の UI ラベル、placeholder、および機密性ヒント。                                                                                                                                                                    |

## providerAuthChoices リファレンス

各 `providerAuthChoices` エントリは、1 つのオンボーディングまたは auth 選択を記述します。
OpenClaw は provider ランタイムを読み込む前にこれを読み取ります。

| フィールド            | 必須     | 型                                              | 意味                                                                                           |
| --------------------- | -------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `provider`            | はい     | `string`                                        | この選択が属する provider id。                                                                 |
| `method`              | はい     | `string`                                        | ディスパッチ先の auth method id。                                                              |
| `choiceId`            | はい     | `string`                                        | オンボーディングおよび CLI フローで使われる安定した auth-choice id。                           |
| `choiceLabel`         | いいえ   | `string`                                        | ユーザー向けラベル。省略した場合、OpenClaw は `choiceId` にフォールバックします。              |
| `choiceHint`          | いいえ   | `string`                                        | picker 用の短い補助テキスト。                                                                  |
| `assistantPriority`   | いいえ   | `number`                                        | assistant 主導の対話 picker で、値が小さいほど先に並びます。                                  |
| `assistantVisibility` | いいえ   | `"visible"` \| `"manual-only"`                  | assistant picker では選択肢を隠しつつ、手動 CLI 選択は引き続き許可します。                     |
| `deprecatedChoiceIds` | いいえ   | `string[]`                                      | ユーザーをこの置き換え選択肢へリダイレクトすべき旧 choice id。                                 |
| `groupId`             | いいえ   | `string`                                        | 関連する選択肢をグループ化するための任意の group id。                                          |
| `groupLabel`          | いいえ   | `string`                                        | その group のユーザー向けラベル。                                                              |
| `groupHint`           | いいえ   | `string`                                        | group 用の短い補助テキスト。                                                                   |
| `optionKey`           | いいえ   | `string`                                        | 単一フラグの単純な auth フロー用の内部 option key。                                            |
| `cliFlag`             | いいえ   | `string`                                        | `--openrouter-api-key` のような CLI flag 名。                                                  |
| `cliOption`           | いいえ   | `string`                                        | `--openrouter-api-key <key>` のような完全な CLI option 形式。                                 |
| `cliDescription`      | いいえ   | `string`                                        | CLI help で使用される説明。                                                                    |
| `onboardingScopes`    | いいえ   | `Array<"text-inference" \| "image-generation">` | この選択肢を表示すべきオンボーディング画面。省略時は `["text-inference"]` がデフォルトです。   |

## commandAliases リファレンス

Plugin がランタイムのコマンド名を所有していて、ユーザーがそれを
誤って `plugins.allow` に入れたり、root CLI コマンドとして実行しようとしたりする可能性がある場合は
`commandAliases` を使用してください。OpenClaw は Plugin ランタイムコードを import せずに、
このメタデータを診断に利用します。

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

| フィールド   | 必須     | 型                | 意味                                                                       |
| ------------ | -------- | ----------------- | -------------------------------------------------------------------------- |
| `name`       | はい     | `string`          | この Plugin に属するコマンド名。                                           |
| `kind`       | いいえ   | `"runtime-slash"` | root CLI コマンドではなく chat slash コマンドとして alias を示します。     |
| `cliCommand` | いいえ   | `string`          | 存在する場合、CLI 操作用に提案する関連 root CLI コマンド。                 |

## activation リファレンス

Plugin が後でどの control-plane event によって有効化されるべきかを
軽量に宣言できる場合は `activation` を使用してください。

## qaRunners リファレンス

Plugin が共有 `openclaw qa` root の下に 1 つ以上の transport runner を提供する場合は
`qaRunners` を使用してください。このメタデータは軽量かつ静的に保ってください。実際の CLI 登録は、
`qaRunnerCliRegistrations` を export する軽量な
`runtime-api.ts` 画面を通じて、引き続き Plugin ランタイムが所有します。

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "使い捨て homeserver に対して Docker バックの Matrix ライブ QA レーンを実行します"
    }
  ]
}
```

| フィールド    | 必須     | 型       | 意味                                                               |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | はい     | `string` | `openclaw qa` の下にマウントされるサブコマンド。例: `matrix`。     |
| `description` | いいえ   | `string` | 共有ホストが stub コマンドを必要とする場合に使う fallback help テキスト。 |

このブロックはメタデータ専用です。ランタイム動作を登録するものではなく、
`register(...)`、`setupEntry`、その他のランタイム/Plugin entrypoint を
置き換えるものでもありません。現在の利用側はこれを、より広い Plugin 読み込み前の絞り込みヒントとして使っているため、
activation メタデータが欠けていても通常はパフォーマンスコストが発生するだけです。従来の manifest 所有 fallback がまだ存在する間は、
正しさを変えるべきではありません。

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

| フィールド       | 必須     | 型                                                   | 意味                                                               |
| ---------------- | -------- | ---------------------------------------------------- | ------------------------------------------------------------------ |
| `onProviders`    | いいえ   | `string[]`                                           | 要求されたときにこの Plugin を有効化すべき provider id。           |
| `onCommands`     | いいえ   | `string[]`                                           | この Plugin を有効化すべき command id。                            |
| `onChannels`     | いいえ   | `string[]`                                           | この Plugin を有効化すべき channel id。                            |
| `onRoutes`       | いいえ   | `string[]`                                           | この Plugin を有効化すべき route kind。                            |
| `onCapabilities` | いいえ   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | control-plane の activation 計画で使われる広い capability ヒント。 |

現在の live consumer:

- command トリガーの CLI 計画は、従来の
  `commandAliases[].cliCommand` または `commandAliases[].name` にフォールバックします
- channel トリガーの setup/channel 計画は、明示的な channel activation メタデータがない場合、
  従来の `channels[]` 所有権にフォールバックします
- provider トリガーの setup/runtime 計画は、明示的な provider
  activation メタデータがない場合、従来の
  `providers[]` とトップレベル `cliBackends[]` 所有権にフォールバックします

## setup リファレンス

セットアップおよびオンボーディング画面がランタイム読み込み前に
Plugin 所有の軽量メタデータを必要とする場合は `setup` を使用してください。

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

トップレベルの `cliBackends` は引き続き有効で、CLI inference
backend を記述し続けます。`setup.cliBackends` は、
メタデータ専用に留めるべき control-plane/setup フロー用の
セットアップ固有 descriptor 画面です。

存在する場合、`setup.providers` と `setup.cliBackends` は
setup 検出における優先 descriptor-first lookup 画面になります。descriptor が
候補 Plugin を絞り込むだけで、セットアップにさらに豊かな setup 時ランタイム
hook が必要な場合は、`requiresRuntime: true` を設定し、
fallback 実行経路として `setup-api` を維持してください。

setup lookup では Plugin 所有の `setup-api` コードを実行する可能性があるため、
正規化された `setup.providers[].id` と `setup.cliBackends[]` の値は、
検出された Plugin 全体で一意でなければなりません。曖昧な所有権は、
検出順で勝者を選ぶ代わりに fail closed します。

### setup.providers リファレンス

| フィールド    | 必須     | 型         | 意味                                                                                  |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------- |
| `id`          | はい     | `string`   | セットアップまたはオンボーディング中に公開される provider id。正規化 id はグローバル一意に保ってください。 |
| `authMethods` | いいえ   | `string[]` | 完全なランタイムを読み込まずにこの provider がサポートする setup/auth method id。     |
| `envVars`     | いいえ   | `string[]` | 汎用 setup/status 画面が Plugin ランタイム読み込み前に確認できる env vars。           |

### setup フィールド

| フィールド         | 必須     | 型         | 意味                                                                                             |
| ------------------ | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `providers`        | いいえ   | `object[]` | セットアップおよびオンボーディング中に公開される provider セットアップ descriptor。              |
| `cliBackends`      | いいえ   | `string[]` | descriptor-first の setup lookup に使用される setup 時 backend id。正規化 id はグローバル一意に保ってください。 |
| `configMigrations` | いいえ   | `string[]` | この Plugin の setup 画面が所有する config migration id。                                         |
| `requiresRuntime`  | いいえ   | `boolean`  | descriptor lookup の後も setup に `setup-api` 実行が必要かどうか。                               |

## uiHints リファレンス

`uiHints` は config field 名から小さなレンダリングヒントへのマップです。

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "OpenRouter リクエストに使用されます",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

各 field ヒントには次を含められます:

| フィールド    | 型         | 意味                                   |
| ------------- | ---------- | -------------------------------------- |
| `label`       | `string`   | ユーザー向け field ラベル。            |
| `help`        | `string`   | 短い補助テキスト。                     |
| `tags`        | `string[]` | 任意の UI タグ。                       |
| `advanced`    | `boolean`  | field を高度設定として示します。       |
| `sensitive`   | `boolean`  | field を secret または機密として示します。 |
| `placeholder` | `string`   | フォーム入力用の placeholder テキスト。 |

## contracts リファレンス

`contracts` は、OpenClaw が Plugin ランタイムを import せずに
読み取れる静的 capability 所有メタデータにのみ使用してください。

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
    "externalAuthProviders": ["acme-ai"],
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

各リストは任意です:

| フィールド                       | 型         | 意味                                                                   |
| -------------------------------- | ---------- | ---------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | 同梱 Plugin が factory を登録できる埋め込み runtime id。               |
| `externalAuthProviders`          | `string[]` | この Plugin が外部 auth profile hook を所有する provider id。          |
| `speechProviders`                | `string[]` | この Plugin が所有する speech provider id。                            |
| `realtimeTranscriptionProviders` | `string[]` | この Plugin が所有する realtime-transcription provider id。            |
| `realtimeVoiceProviders`         | `string[]` | この Plugin が所有する realtime-voice provider id。                    |
| `mediaUnderstandingProviders`    | `string[]` | この Plugin が所有する media-understanding provider id。               |
| `imageGenerationProviders`       | `string[]` | この Plugin が所有する image-generation provider id。                  |
| `videoGenerationProviders`       | `string[]` | この Plugin が所有する video-generation provider id。                  |
| `webFetchProviders`              | `string[]` | この Plugin が所有する web-fetch provider id。                         |
| `webSearchProviders`             | `string[]` | この Plugin が所有する Web 検索 provider id。                          |
| `tools`                          | `string[]` | bundled contract チェック用にこの Plugin が所有する agent tool 名。    |

`resolveExternalAuthProfiles` を実装する provider Plugin は
`contracts.externalAuthProviders` を宣言する必要があります。宣言のない Plugin でも
非推奨の互換 fallback により引き続き動作しますが、この fallback は遅く、
移行期間後に削除される予定です。

## mediaUnderstandingProviderMetadata リファレンス

media-understanding provider に、generic core helper がランタイム読み込み前に必要とする
default model、自動 auth fallback 優先度、または native document サポートがある場合は
`mediaUnderstandingProviderMetadata` を使用してください。key は
`contracts.mediaUnderstandingProviders` にも宣言されている必要があります。

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

各 provider エントリには次を含められます:

| フィールド             | 型                                  | 意味                                                                         |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | この provider が公開する media capability。                                 |
| `defaultModels`        | `Record<string, string>`            | config で model が指定されていないときに使われる capability ごとの default model。 |
| `autoPriority`         | `Record<string, number>`            | credential ベースの provider 自動 fallback で、数値が小さいほど先に並びます。 |
| `nativeDocumentInputs` | `"pdf"[]`                           | この provider がサポートする native document input。                        |

## channelConfigs リファレンス

channel Plugin がランタイム読み込み前に軽量な config メタデータを必要とする場合は
`channelConfigs` を使用してください。

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
      "description": "Matrix homeserver 接続",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

各 channel エントリには次を含められます:

| フィールド    | 型                       | 意味                                                                                 |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | `channels.<id>` 用 JSON Schema。宣言された各 channel config エントリで必須です。     |
| `uiHints`     | `Record<string, object>` | その channel config section 用の任意の UI ラベル/placeholder/機密ヒント。           |
| `label`       | `string`                 | ランタイムメタデータの準備ができていないときに picker と inspect 画面へマージされる channel ラベル。 |
| `description` | `string`                 | inspect および catalog 画面用の短い channel 説明。                                  |
| `preferOver`  | `string[]`               | 選択画面でこの channel が優先すべき、旧または低優先度の Plugin id。                  |

## modelSupport リファレンス

`gpt-5.4` や `claude-sonnet-4.6` のような shorthand model id から
Plugin ランタイム読み込み前に provider Plugin を OpenClaw が推測すべき場合は
`modelSupport` を使用してください。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw は次の優先順位を適用します:

- 明示的な `provider/model` ref は、所有する `providers` manifest メタデータを使用します
- `modelPatterns` は `modelPrefixes` より優先されます
- 非同梱 Plugin と同梱 Plugin の両方が一致する場合は、非同梱
  Plugin が優先されます
- 残る曖昧さは、ユーザーまたは config が provider を指定するまで無視されます

フィールド:

| フィールド      | 型         | 意味                                                                                   |
| --------------- | ---------- | -------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | shorthand model id に対して `startsWith` で一致させる prefix。                        |
| `modelPatterns` | `string[]` | profile suffix を除去した後の shorthand model id に対して一致させる regex source。    |

従来のトップレベル capability key は非推奨です。
`speechProviders`、`realtimeTranscriptionProviders`、
`realtimeVoiceProviders`、`mediaUnderstandingProviders`、
`imageGenerationProviders`、`videoGenerationProviders`、
`webFetchProviders`、および `webSearchProviders` を `contracts` の下へ移動するには
`openclaw doctor --fix` を使用してください。通常の manifest 読み込みでは、これらのトップレベル field は
もはや capability 所有権として扱われません。

## Manifest と package.json の違い

この 2 つのファイルは別々の役割を持ちます:

| ファイル               | 用途                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 検出、config 検証、auth-choice メタデータ、および Plugin コード実行前に存在している必要がある UI ヒント                   |
| `package.json`         | npm メタデータ、依存関係インストール、および entrypoint、install gating、setup、または catalog メタデータに使用される `openclaw` ブロック |

どこに置くべきメタデータか迷った場合は、次のルールを使ってください:

- OpenClaw が Plugin コード読み込み前に知っておく必要があるなら、`openclaw.plugin.json` に置く
- packaging、entry file、または npm インストール動作に関するものなら、`package.json` に置く

### 検出に影響する package.json フィールド

一部のランタイム前 Plugin メタデータは、`openclaw.plugin.json` ではなく
`package.json` の `openclaw` ブロックに意図的に配置されます。

重要な例:

| フィールド                                                            | 意味                                                                                                                                                                                   |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                                 | ネイティブ Plugin entrypoint を宣言します。Plugin package directory 内にとどまっている必要があります。                                                                                 |
| `openclaw.runtimeExtensions`                                          | インストール済み package 用のビルド済み JavaScript runtime entrypoint を宣言します。Plugin package directory 内にとどまっている必要があります。                                        |
| `openclaw.setupEntry`                                                 | オンボーディング、遅延 channel 起動、および読み取り専用の channel status/SecretRef 検出で使われる軽量な setup 専用 entrypoint。Plugin package directory 内にとどまっている必要があります。 |
| `openclaw.runtimeSetupEntry`                                          | インストール済み package 用のビルド済み JavaScript setup entrypoint を宣言します。Plugin package directory 内にとどまっている必要があります。                                           |
| `openclaw.channel`                                                    | ラベル、docs path、alias、選択用コピーなどの軽量な channel catalog メタデータ。                                                                                                         |
| `openclaw.channel.configuredState`                                    | 「env のみのセットアップがすでに存在するか？」に、完全な channel ランタイムを読み込まずに答えられる軽量な configured-state checker メタデータ。                                          |
| `openclaw.channel.persistedAuthState`                                 | 「すでに何かサインイン済みか？」に、完全な channel ランタイムを読み込まずに答えられる軽量な persisted-auth checker メタデータ。                                                         |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`             | 同梱 Plugin と外部公開 Plugin 用の install/update ヒント。                                                                                                                             |
| `openclaw.install.defaultChoice`                                      | 複数の install ソースが利用可能な場合の優先 install パス。                                                                                                                             |
| `openclaw.install.minHostVersion`                                     | `>=2026.3.22` のような semver 下限を用いた、サポートされる最小 OpenClaw host バージョン。                                                                                              |
| `openclaw.install.expectedIntegrity`                                  | `sha512-...` のような期待される npm dist integrity 文字列。install と update フローは、取得した artifact がこれに一致することを検証します。                                            |
| `openclaw.install.allowInvalidConfigRecovery`                         | config が無効なときに、限定的な同梱 Plugin 再インストール復旧パスを許可します。                                                                                                        |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`     | 起動時に、完全な channel Plugin より先に setup 専用の channel 画面を読み込めるようにします。                                                                                           |

manifest メタデータは、ランタイム読み込み前の
オンボーディングにどの provider/channel/setup 選択肢が現れるかを決定します。`package.json#openclaw.install` は、
ユーザーがそれらの選択肢のいずれかを選んだときに、オンボーディングがその Plugin を
どう取得または有効化するかを伝えます。install ヒントを `openclaw.plugin.json` に移さないでください。

`openclaw.install.minHostVersion` は install 中および manifest
registry 読み込み中に適用されます。無効な値は拒否されます。有効だが新しすぎる値の場合、
古い host ではその Plugin をスキップします。

正確な npm バージョン pinning はすでに `npmSpec` にあり、たとえば
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"` のように指定します。取得した
npm artifact が pin されたリリースと一致しなくなった場合に update フローを fail closed にしたい場合は、
これを `expectedIntegrity` と組み合わせてください。対話型オンボーディングでは、
素の package 名や dist-tag を含む信頼済み registry npm spec が提供されます。
`expectedIntegrity` が存在する場合、install/update フローはそれを強制します。これが
省略されている場合、registry 解決結果は integrity pin なしで記録されます。

channel Plugin は、status、channel list、
または SecretRef スキャンで完全な
ランタイムを読み込まずに設定済み account を識別する必要がある場合、`openclaw.setupEntry` を提供すべきです。
setup entrypoint は、channel メタデータに加え、setup-safe な config、
status、および secrets adapter を公開すべきです。network client、gateway listener、および
transport runtime はメインの extension entrypoint に残してください。

runtime entrypoint field は、source
entrypoint field に対する package-boundary チェックを上書きしません。たとえば、
`openclaw.runtimeExtensions` があっても、外へ逃げる `openclaw.extensions` path を
読み込めるようにはできません。

`openclaw.install.allowInvalidConfigRecovery` は意図的に限定的です。これは
任意の壊れた config を install 可能にするものではありません。現在これが許可するのは、
特定の古い同梱 Plugin アップグレード失敗から install
フローを復旧することだけです。たとえば、同じ同梱 Plugin の path が欠けている、
または古い `channels.<id>` エントリが残っている場合などです。
無関係な config エラーは依然として install をブロックし、operator に
`openclaw doctor --fix` を案内します。

`openclaw.channel.persistedAuthState` は、小さな checker
module 用の package メタデータです:

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

setup、doctor、または configured-state フローで、完全な
channel Plugin を読み込む前に安価な yes/no auth probe が必要な場合に使用してください。対象 export は、
永続化済み state だけを読む小さな関数にしてください。完全な
channel runtime barrel を経由させないでください。

`openclaw.channel.configuredState` も、安価な env-only
configured チェックのために同じ形式に従います:

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

channel が env や他の小さな
非ランタイム入力から configured-state に答えられる場合に使用してください。チェックに完全な config 解決や実際の
channel runtime が必要なら、そのロジックは代わりに Plugin の `config.hasConfiguredState`
hook に残してください。

## 検出の優先順位（重複する Plugin id）

OpenClaw は複数の root（同梱、グローバルインストール、workspace、config で明示選択された path）から Plugin を検出します。2 つの検出結果が同じ `id` を共有する場合、**最も優先順位の高い** manifest だけが保持されます。優先順位の低い重複は、それと並んで読み込まれるのではなく破棄されます。

優先順位（高い順）:

1. **Config-selected** — `plugins.entries.<id>` で明示的に pin された path
2. **Bundled** — OpenClaw に同梱されている Plugin
3. **Global install** — グローバル OpenClaw Plugin root にインストールされた Plugin
4. **Workspace** — 現在の workspace 相対で検出された Plugin

影響:

- workspace に置かれた同梱 Plugin の fork や古いコピーは、同梱ビルドを上書きしません。
- 実際にローカル Plugin で同梱 Plugin を上書きしたい場合は、workspace 検出に頼らず `plugins.entries.<id>` で pin し、優先順位で勝たせてください。
- 重複の破棄はログに記録されるため、Doctor と起動時診断で破棄されたコピーを示せます。

## JSON Schema の要件

- **すべての Plugin は JSON Schema を含める必要があります**。config を受け付けない場合でも同様です。
- 空の schema でも構いません（たとえば `{ "type": "object", "additionalProperties": false }`）。
- schema はランタイムではなく、config の読み書き時に検証されます。

## 検証の動作

- `channels.*` の未知の key は**エラー**です。ただし、その channel id が
  Plugin Manifest で宣言されている場合を除きます。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny`、および `plugins.slots.*`
  は、**検出可能な** Plugin id を参照している必要があります。未知の id は**エラー**です。
- Plugin がインストールされていても、manifest または schema が壊れているか欠けている場合、
  検証は失敗し、Doctor が Plugin エラーを報告します。
- Plugin config が存在していても、その Plugin が**無効**の場合、config は保持され、
  Doctor + ログで**警告**が出ます。

完全な `plugins.*` schema については [Configuration reference](/ja-JP/gateway/configuration) を参照してください。

## 注記

- manifest は、ローカル filesystem 読み込みを含む**ネイティブ OpenClaw Plugin で必須**です。
- ランタイムは引き続き Plugin module を個別に読み込みます。manifest は
  検出 + 検証専用です。
- ネイティブ manifest は JSON5 で parse されるため、最終値が object である限り、
  コメント、末尾カンマ、および引用符なし key が許容されます。
- documented manifest field だけが manifest loader に読み取られます。ここに
  独自のトップレベル key を追加しないでください。
- `providerAuthEnvVars` は、auth probe、env-marker
  検証、および env 名を見るだけのために Plugin ランタイムを起動すべきでない類似の provider-auth 画面向けの軽量メタデータ経路です。
- `providerAuthAliases` により、provider variant が別 provider の auth
  env vars、auth profiles、config ベース auth、および API-key オンボーディング選択肢を
  core にその関係をハードコードせずに再利用できます。
- `providerEndpoints` により、provider Plugin が単純な endpoint host/baseUrl
  一致メタデータを所有できます。core がすでにサポートする endpoint class に対してのみ使用してください。
  ランタイム動作は引き続き Plugin が所有します。
- `syntheticAuthRefs` は、provider 所有の synthetic
  auth hook を、ランタイム registry が存在する前のコールド model 検出に見せる必要がある場合の軽量メタデータ経路です。ランタイム provider または CLI backend が
  実際に `resolveSyntheticAuth` を実装している ref のみを列挙してください。
- `nonSecretAuthMarkers` は、ローカル、OAuth、または ambient credential marker のような、
  同梱 Plugin 所有のプレースホルダー API key 用の軽量メタデータ経路です。
  core は、所有 provider をハードコードせずに、これらを auth 表示および secret 監査で
  非 secret として扱います。
- `channelEnvVars` は、shell-env fallback、setup
  prompt、および env 名を見るだけのために Plugin ランタイムを起動すべきでない類似の channel 画面向けの軽量メタデータ経路です。env 名はメタデータであり、それ自体で有効化されるわけではありません。status、audit、Cron 配信検証、およびその他の読み取り専用
  画面では、env var を設定済み channel として扱う前に、引き続き Plugin trust と実効的な有効化ポリシーを適用します。
- `providerAuthChoices` は、auth-choice picker、
  `--auth-choice` 解決、preferred-provider mapping、および provider ランタイム読み込み前の
  単純なオンボーディング CLI flag 登録向けの軽量メタデータ経路です。provider コードが必要なランタイム wizard
  メタデータについては、
  [Provider runtime hooks](/ja-JP/plugins/architecture#provider-runtime-hooks) を参照してください。
- 排他的 Plugin 種別は `plugins.slots.*` を通じて選択されます。
  - `kind: "memory"` は `plugins.slots.memory` で選択されます。
  - `kind: "context-engine"` は `plugins.slots.contextEngine`
    で選択されます（デフォルト: built-in の `legacy`）。
- `channels`、`providers`、`cliBackends`、および `skills` は、
  Plugin がそれらを必要としない場合は省略できます。
- Plugin がネイティブ module に依存する場合は、ビルド手順と必要な
  package-manager allowlist 要件（たとえば pnpm の `allow-build-scripts`
  や `pnpm rebuild <package>`）を文書化してください。

## 関連

- [Building Plugins](/ja-JP/plugins/building-plugins) — Plugin 開発のはじめに
- [Plugin Architecture](/ja-JP/plugins/architecture) — 内部アーキテクチャ
- [SDK Overview](/ja-JP/plugins/sdk-overview) — Plugin SDK リファレンス

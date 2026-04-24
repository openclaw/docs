---
read_when:
    - OpenClaw Plugin を構築している場合
    - Plugin config schema を提供する必要がある場合、または Plugin 検証エラーをデバッグしている場合
summary: Plugin manifest + JSON schema の要件（厳格な config 検証）
title: Plugin manifest
x-i18n:
    generated_at: "2026-04-24T05:10:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e9e38ce695faf9638538b6d4761ee64126f5adee944be1373a02e897853a49d
    source_path: plugins/manifest.md
    workflow: 15
---

このページは、**ネイティブ OpenClaw Plugin manifest** のみを対象としています。

互換 bundle レイアウトについては、[Plugin bundles](/ja-JP/plugins/bundles) を参照してください。

互換 bundle 形式では、異なる manifest ファイルを使います。

- Codex bundle: `.codex-plugin/plugin.json`
- Claude bundle: `.claude-plugin/plugin.json` または manifest なしのデフォルト Claude component
  レイアウト
- Cursor bundle: `.cursor-plugin/plugin.json`

OpenClaw はそれらの bundle レイアウトも自動検出しますが、ここで説明する `openclaw.plugin.json` schema に対しては検証されません。

互換 bundle については、OpenClaw は現在、bundle メタデータに加え、宣言された
Skill ルート、Claude command ルート、Claude bundle `settings.json` デフォルト、
Claude bundle LSP デフォルト、およびレイアウトが OpenClaw ランタイム期待に一致する場合のサポート済み
hook pack を読み取ります。

すべてのネイティブ OpenClaw Plugin は、**Plugin ルート**に
`openclaw.plugin.json` ファイルを**必ず**同梱しなければなりません。OpenClaw はこの manifest を使って、
**Plugin コードを実行せずに**設定を検証します。manifest が欠けている、または無効な場合は
Plugin エラーとして扱われ、config 検証をブロックします。

完全な Plugin システムガイドは [Plugins](/ja-JP/tools/plugin) を参照してください。
ネイティブ capability モデルと現在の外部互換性ガイダンスについては:
[Capability model](/ja-JP/plugins/architecture#public-capability-model)。

## このファイルが行うこと

`openclaw.plugin.json` は、OpenClaw が**Plugin コードを読み込む前に**
読み取るメタデータです。以下の内容はすべて、Plugin ランタイムを起動せずに
検査できる程度に軽量でなければなりません。

**用途:**

- Plugin アイデンティティ、config 検証、config UI ヒント
- auth、オンボーディング、セットアップメタデータ（エイリアス、自動有効化、provider env var、auth 選択肢）
- control-plane サーフェスのアクティベーションヒント
- shorthand モデルファミリー所有権
- 静的 capability 所有権スナップショット（`contracts`）
- 共有 `openclaw qa` ホストが検査できる QA ランナーメタデータ
- カタログと検証サーフェスにマージされるチャネル固有 config メタデータ

**用途ではないもの:** ランタイム動作の登録、コードエントリーポイントの宣言、
npm install メタデータ。これらは Plugin コードと `package.json` に属します。

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

## リッチな例

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

## トップレベルフィールドリファレンス

| フィールド                           | 必須     | 型                               | 意味                                                                                                                                                                                                                              |
| ------------------------------------ | -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | はい     | `string`                         | 正規の Plugin ID。`plugins.entries.<id>` で使われる ID です。                                                                                                                                                                     |
| `configSchema`                       | はい     | `object`                         | この Plugin の config 用インライン JSON Schema。                                                                                                                                                                                  |
| `enabledByDefault`                   | いいえ   | `true`                           | bundled Plugin をデフォルトで有効とマークします。省略するか、`true` 以外の値を設定すると、その Plugin はデフォルトで無効のままです。                                                                                            |
| `legacyPluginIds`                    | いいえ   | `string[]`                       | この正規 Plugin ID に正規化される旧来 ID。                                                                                                                                                                                        |
| `autoEnableWhenConfiguredProviders`  | いいえ   | `string[]`                       | auth、config、または model ref がそれらに言及したときに、この Plugin を自動有効化すべきプロバイダー ID。                                                                                                                        |
| `kind`                               | いいえ   | `"memory"` \| `"context-engine"` | `plugins.slots.*` で使われる排他的な Plugin 種別を宣言します。                                                                                                                                                                   |
| `channels`                           | いいえ   | `string[]`                       | この Plugin が所有するチャネル ID。検出と config 検証に使われます。                                                                                                                                                               |
| `providers`                          | いいえ   | `string[]`                       | この Plugin が所有するプロバイダー ID。                                                                                                                                                                                           |
| `modelSupport`                       | いいえ   | `object`                         | ランタイム前に Plugin を自動読み込みするために使われる、manifest 所有の shorthand モデルファミリーメタデータ。                                                                                                                   |
| `providerEndpoints`                  | いいえ   | `object[]`                       | プロバイダーランタイム読み込み前に core が分類しなければならない provider ルート用の、manifest 所有 endpoint host/baseUrl メタデータ。                                                                                          |
| `cliBackends`                        | いいえ   | `string[]`                       | この Plugin が所有する CLI 推論 backend ID。明示的 config ref からの起動時自動アクティベーションに使われます。                                                                                                                  |
| `syntheticAuthRefs`                  | いいえ   | `string[]`                       | ランタイム読み込み前のコールドモデル discovery 中に、この Plugin 所有の synthetic auth フックを probe すべき provider または CLI backend ref。                                                                                  |
| `nonSecretAuthMarkers`               | いいえ   | `string[]`                       | シークレットではないローカル、OAuth、または ambient credential 状態を表す、bundled Plugin 所有のプレースホルダー API キー値。                                                                                                   |
| `commandAliases`                     | いいえ   | `object[]`                       | ランタイム読み込み前に、Plugin を認識した config と CLI 診断を生成すべき、この Plugin 所有のコマンド名。                                                                                                                         |
| `providerAuthEnvVars`                | いいえ   | `Record<string, string[]>`       | Plugin コードを読み込まずに OpenClaw が検査できる、軽量な provider-auth env メタデータ。                                                                                                                                         |
| `providerAuthAliases`                | いいえ   | `Record<string, string>`         | auth lookup のために別の provider ID を再利用すべき provider ID。たとえば、基底 provider の API キーと auth profile を共有する coding provider など。                                                                          |
| `channelEnvVars`                     | いいえ   | `Record<string, string[]>`       | Plugin コードを読み込まずに OpenClaw が検査できる、軽量なチャネル env メタデータ。generic な起動/config ヘルパーが見えるべき env 駆動チャネルセットアップまたは auth サーフェスにはこれを使ってください。                   |
| `providerAuthChoices`                | いいえ   | `object[]`                       | オンボーディング picker、preferred-provider 解決、単純な CLI フラグ配線のための、軽量な auth choice メタデータ。                                                                                                                |
| `activation`                         | いいえ   | `object`                         | provider、command、channel、route、および capability-triggered 読み込みのための軽量なアクティベーションヒント。メタデータのみであり、実際の動作は引き続き Plugin ランタイムが所有します。                                     |
| `setup`                              | いいえ   | `object`                         | ランタイムを読み込まずに discovery と setup サーフェスが検査できる、軽量な setup/onboarding 記述子。                                                                                                                             |
| `qaRunners`                          | いいえ   | `object[]`                       | Plugin ランタイム読み込み前に共有 `openclaw qa` ホストが使う、軽量な QA ランナー記述子。                                                                                                                                         |
| `contracts`                          | いいえ   | `object`                         | 外部 auth フック、speech、realtime transcription、realtime voice、media-understanding、image-generation、music-generation、video-generation、web-fetch、web search、および tool ownership のための静的 bundled capability スナップショット。 |
| `mediaUnderstandingProviderMetadata` | いいえ   | `Record<string, object>`         | `contracts.mediaUnderstandingProviders` で宣言された provider ID 用の、軽量な media-understanding デフォルト。                                                                                                                   |
| `channelConfigs`                     | いいえ   | `Record<string, object>`         | ランタイム読み込み前に discovery と検証サーフェスへマージされる、manifest 所有のチャネル config メタデータ。                                                                                                                     |
| `skills`                             | いいえ   | `string[]`                       | Plugin ルートからの相対パスで指定する、読み込む Skill ディレクトリ。                                                                                                                                                              |
| `name`                               | いいえ   | `string`                         | 人間が読める Plugin 名。                                                                                                                                                                                                          |
| `description`                        | いいえ   | `string`                         | Plugin サーフェスに表示される短い要約。                                                                                                                                                                                           |
| `version`                            | いいえ   | `string`                         | 情報表示用の Plugin バージョン。                                                                                                                                                                                                  |
| `uiHints`                            | いいえ   | `Record<string, object>`         | config フィールド用の UI ラベル、プレースホルダー、機微情報ヒント。                                                                                                                                                               |

## providerAuthChoices リファレンス

各 `providerAuthChoices` エントリーは、1 つのオンボーディングまたは auth choice を記述します。
OpenClaw は provider ランタイムを読み込む前にこれを読み取ります。

| フィールド            | 必須     | 型                                              | 意味                                                                                              |
| --------------------- | -------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `provider`            | はい     | `string`                                        | この choice が属する provider ID。                                                                |
| `method`              | はい     | `string`                                        | dispatch 先となる auth method ID。                                                                |
| `choiceId`            | はい     | `string`                                        | オンボーディングと CLI フローで使われる安定した auth-choice ID。                                 |
| `choiceLabel`         | いいえ   | `string`                                        | ユーザー向けラベル。省略された場合、OpenClaw は `choiceId` にフォールバックします。              |
| `choiceHint`          | いいえ   | `string`                                        | picker 用の短い補助テキスト。                                                                     |
| `assistantPriority`   | いいえ   | `number`                                        | アシスタント駆動の対話 picker で、値が小さいほど前に並びます。                                   |
| `assistantVisibility` | いいえ   | `"visible"` \| `"manual-only"`                  | choice をアシスタント picker から隠しつつ、手動 CLI 選択は可能にします。                         |
| `deprecatedChoiceIds` | いいえ   | `string[]`                                      | この置き換え choice に誘導すべき旧来 choice ID。                                                  |
| `groupId`             | いいえ   | `string`                                        | 関連 choice をまとめるための任意の group ID。                                                     |
| `groupLabel`          | いいえ   | `string`                                        | その group のユーザー向けラベル。                                                                 |
| `groupHint`           | いいえ   | `string`                                        | group 用の短い補助テキスト。                                                                      |
| `optionKey`           | いいえ   | `string`                                        | 単一フラグの単純な auth フロー用の内部 option key。                                               |
| `cliFlag`             | いいえ   | `string`                                        | `--openrouter-api-key` のような CLI フラグ名。                                                    |
| `cliOption`           | いいえ   | `string`                                        | `--openrouter-api-key <key>` のような完全な CLI option 形状。                                    |
| `cliDescription`      | いいえ   | `string`                                        | CLI ヘルプで使われる説明。                                                                        |
| `onboardingScopes`    | いいえ   | `Array<"text-inference" \| "image-generation">` | この choice をどのオンボーディングサーフェスに表示すべきか。省略時は `["text-inference"]` がデフォルトです。 |

## commandAliases リファレンス

Plugin が所有するランタイムコマンド名を、ユーザーが誤って
`plugins.allow` に書いたり、ルート CLI コマンドとして実行しようとしたりする可能性がある場合は、
`commandAliases` を使ってください。OpenClaw はこのメタデータを、Plugin ランタイムコードを import せずに診断に使います。

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

| フィールド   | 必須     | 型                | 意味                                                                        |
| ------------ | -------- | ----------------- | --------------------------------------------------------------------------- |
| `name`       | はい     | `string`          | この Plugin に属するコマンド名。                                            |
| `kind`       | いいえ   | `"runtime-slash"` | この alias がルート CLI コマンドではなく、チャットスラッシュコマンドであることを示します。 |
| `cliCommand` | いいえ   | `string`          | 存在する場合、CLI 操作で提案すべき関連ルート CLI コマンド。                 |

## activation リファレンス

Plugin が、どの control-plane イベントで後からアクティブ化されるべきかを
軽量に宣言できる場合は `activation` を使ってください。

## qaRunners リファレンス

Plugin が共有 `openclaw qa` ルートの下に 1 つ以上のトランスポートランナーを提供する場合は
`qaRunners` を使ってください。このメタデータは軽量かつ静的に保ってください。実際の CLI 登録は引き続き、`qaRunnerCliRegistrations` を export する軽量な
`runtime-api.ts` サーフェスを通じて Plugin ランタイムが所有します。

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "使い捨て homeserver に対して Docker ベースの Matrix ライブ QA レーンを実行する"
    }
  ]
}
```

| フィールド    | 必須     | 型       | 意味                                                                  |
| ------------- | -------- | -------- | --------------------------------------------------------------------- |
| `commandName` | はい     | `string` | `openclaw qa` 配下にマウントされるサブコマンド。たとえば `matrix`。   |
| `description` | いいえ   | `string` | 共有ホストが stub コマンドを必要とするときに使われるフォールバックヘルプテキスト。 |

このブロックはメタデータのみです。ランタイム動作を登録するものではなく、
`register(...)`、`setupEntry`、その他のランタイム/Plugin エントリーポイントの代わりにもなりません。
現在の利用側はこれを、より広い Plugin 読み込み前の絞り込みヒントとして使っているため、
activation メタデータが欠けていても通常は性能コストになるだけで、旧来の manifest 所有権フォールバックが残っている限り正しさは変わらないはずです。

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

| フィールド       | 必須     | 型                                                   | 意味                                                           |
| ---------------- | -------- | ---------------------------------------------------- | -------------------------------------------------------------- |
| `onProviders`    | いいえ   | `string[]`                                           | 要求時にこの Plugin をアクティブ化すべき provider ID。         |
| `onCommands`     | いいえ   | `string[]`                                           | この Plugin をアクティブ化すべき command ID。                  |
| `onChannels`     | いいえ   | `string[]`                                           | この Plugin をアクティブ化すべき channel ID。                  |
| `onRoutes`       | いいえ   | `string[]`                                           | この Plugin をアクティブ化すべき route kind。                  |
| `onCapabilities` | いいえ   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | control-plane のアクティベーション計画で使われる広い capability ヒント。 |

現在の live consumer:

- command トリガーの CLI planning は、旧来の
  `commandAliases[].cliCommand` または `commandAliases[].name` にフォールバックします
- channel トリガーの setup/channel planning は、明示的な channel activation メタデータがない場合、旧来の `channels[]`
  所有権にフォールバックします
- provider トリガーの setup/runtime planning は、明示的な provider
  activation メタデータがない場合、旧来の `providers[]` とトップレベル `cliBackends[]`
  所有権にフォールバックします

## setup リファレンス

setup とオンボーディングのサーフェスが、ランタイム読み込み前に軽量な Plugin 所有メタデータを必要とする場合は
`setup` を使ってください。

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

トップレベル `cliBackends` は引き続き有効で、CLI 推論
backend を記述し続けます。`setup.cliBackends` は、メタデータのみを維持すべき
control-plane/setup フロー用の setup 固有 descriptor サーフェスです。

存在する場合、`setup.providers` と `setup.cliBackends` は
setup discovery のための優先される descriptor-first lookup サーフェスになります。descriptor が
候補 Plugin を絞り込むだけで、setup がなお豊かな setup 時ランタイムフックを必要とする場合は、
`requiresRuntime: true` を設定し、`setup-api` をフォールバック実行パスとして残してください。

setup lookup は Plugin 所有の `setup-api` コードを実行できるため、
正規化された `setup.providers[].id` と `setup.cliBackends[]` の値は、検出された Plugin 間で一意のままでなければなりません。所有権が曖昧な場合は、発見順で勝者を選ぶのではなく fail-closed します。

### setup.providers リファレンス

| フィールド    | 必須     | 型         | 意味                                                                                 |
| ------------- | -------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | はい     | `string`   | setup またはオンボーディング中に公開される provider ID。正規化 ID はグローバルに一意に保ってください。 |
| `authMethods` | いいえ   | `string[]` | フルランタイムを読み込まずにこの provider がサポートする setup/auth method ID。     |
| `envVars`     | いいえ   | `string[]` | Plugin ランタイム読み込み前に generic な setup/status サーフェスが確認できる env var。 |

### setup フィールド

| フィールド         | 必須     | 型         | 意味                                                                                               |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------- |
| `providers`        | いいえ   | `object[]` | setup とオンボーディング中に公開される provider setup descriptor。                                 |
| `cliBackends`      | いいえ   | `string[]` | descriptor-first setup lookup に使われる setup 時 backend ID。正規化 ID はグローバルに一意に保ってください。 |
| `configMigrations` | いいえ   | `string[]` | この Plugin の setup サーフェスが所有する config migration ID。                                     |
| `requiresRuntime`  | いいえ   | `boolean`  | descriptor lookup 後も setup に `setup-api` 実行が必要かどうか。                                   |

## uiHints リファレンス

`uiHints` は、config フィールド名から小さなレンダリングヒントへのマップです。

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

| フィールド    | 型         | 意味                                  |
| ------------- | ---------- | ------------------------------------- |
| `label`       | `string`   | ユーザー向けフィールドラベル。        |
| `help`        | `string`   | 短い補助テキスト。                    |
| `tags`        | `string[]` | 任意の UI タグ。                      |
| `advanced`    | `boolean`  | フィールドを advanced とマークする。  |
| `sensitive`   | `boolean`  | フィールドを secret または機微情報とマークする。 |
| `placeholder` | `string`   | フォーム入力用のプレースホルダーテキスト。 |

## contracts リファレンス

`contracts` は、OpenClaw が Plugin ランタイムを import せずに
読める、静的な capability 所有権メタデータにのみ使ってください。

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
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
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

各リストは任意です。

| フィールド                       | 型         | 意味                                                                      |
| -------------------------------- | ---------- | ------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | bundled Plugin が factory を登録しうる embedded runtime ID。              |
| `externalAuthProviders`          | `string[]` | この Plugin が所有する external auth profile フックの provider ID。       |
| `speechProviders`                | `string[]` | この Plugin が所有する speech provider ID。                               |
| `realtimeTranscriptionProviders` | `string[]` | この Plugin が所有する realtime-transcription provider ID。               |
| `realtimeVoiceProviders`         | `string[]` | この Plugin が所有する realtime-voice provider ID。                       |
| `memoryEmbeddingProviders`       | `string[]` | この Plugin が所有する memory embedding provider ID。                     |
| `mediaUnderstandingProviders`    | `string[]` | この Plugin が所有する media-understanding provider ID。                  |
| `imageGenerationProviders`       | `string[]` | この Plugin が所有する image-generation provider ID。                     |
| `videoGenerationProviders`       | `string[]` | この Plugin が所有する video-generation provider ID。                     |
| `webFetchProviders`              | `string[]` | この Plugin が所有する web-fetch provider ID。                            |
| `webSearchProviders`             | `string[]` | この Plugin が所有する web-search provider ID。                           |
| `tools`                          | `string[]` | bundled 契約チェック用にこの Plugin が所有する agent tool 名。            |

`resolveExternalAuthProfiles` を実装する provider Plugin は、
`contracts.externalAuthProviders` を宣言する必要があります。
この宣言がない Plugin も、非推奨の互換フォールバック経由ではまだ動作しますが、
そのフォールバックは遅く、移行期間終了後に削除されます。

bundled の memory embedding provider は、
`local` のような組み込み adapter を含め、公開するすべての adapter ID について
`contracts.memoryEmbeddingProviders` を宣言する必要があります。スタンドアロン CLI パスはこの manifest
契約を使い、完全な Gateway ランタイムが provider を登録する前に、
所有する Plugin だけを読み込みます。

## mediaUnderstandingProviderMetadata リファレンス

media-understanding provider にデフォルトモデル、自動 auth フォールバック優先順位、または
generic core helper がランタイム読み込み前に必要とするネイティブドキュメントサポートがある場合は、
`mediaUnderstandingProviderMetadata` を使ってください。キーは `contracts.mediaUnderstandingProviders`
にも宣言されている必要があります。

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

各 provider エントリーには次を含められます。

| フィールド             | 型                                  | 意味                                                                          |
| ---------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | この provider が公開するメディア capability。                                 |
| `defaultModels`        | `Record<string, string>`            | config がモデルを指定しない場合に使われる、capability からモデルへのデフォルト。 |
| `autoPriority`         | `Record<string, number>`            | 自動的な認証情報ベース provider フォールバックで、数値が小さいほど先に並ぶ。 |
| `nativeDocumentInputs` | `"pdf"[]`                           | その provider がサポートするネイティブドキュメント入力。                     |

## channelConfigs リファレンス

チャネル Plugin がランタイム読み込み前に軽量な config メタデータを必要とする場合は、
`channelConfigs` を使ってください。

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

| フィールド    | 型                       | 意味                                                                                           |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` 用 JSON Schema。宣言された各チャネル config エントリーに必須です。            |
| `uiHints`     | `Record<string, object>` | そのチャネル config セクション用の任意の UI ラベル/プレースホルダー/機微情報ヒント。          |
| `label`       | `string`                 | ランタイムメタデータがまだ準備できていないときに picker と inspect サーフェスへマージされるチャネルラベル。 |
| `description` | `string`                 | inspect と catalog サーフェス用の短いチャネル説明。                                            |
| `preferOver`  | `string[]`               | 選択サーフェスでこのチャネルが優先すべき旧来または低優先順位 Plugin ID。                       |

## modelSupport リファレンス

Plugin ランタイム読み込み前に、OpenClaw が `gpt-5.5` や `claude-sonnet-4.6` のような
shorthand モデル ID から provider Plugin を推測すべき場合は、
`modelSupport` を使ってください。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw は次の優先順位を適用します。

- 明示的な `provider/model` ref では、manifest の `providers` 所有権メタデータを使う
- `modelPatterns` は `modelPrefixes` より優先される
- 1 つの non-bundled Plugin と 1 つの bundled Plugin が両方一致した場合、non-bundled
  Plugin が勝つ
- 残る曖昧さは、ユーザーまたは config が provider を指定するまで無視される

フィールド:

| フィールド      | 型         | 意味                                                                                  |
| --------------- | ---------- | ------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | shorthand モデル ID に対して `startsWith` で一致させる prefix。                      |
| `modelPatterns` | `string[]` | profile suffix 除去後の shorthand モデル ID に対して一致させる正規表現ソース。       |

旧来のトップレベル capability キーは非推奨です。
`openclaw doctor --fix` を使って `speechProviders`、`realtimeTranscriptionProviders`、
`realtimeVoiceProviders`、`mediaUnderstandingProviders`、
`imageGenerationProviders`、`videoGenerationProviders`、
`webFetchProviders`、`webSearchProviders` を `contracts` 配下へ移動してください。通常の
manifest 読み込みでは、もはやそれらのトップレベルフィールドを capability
所有権として扱いません。

## Manifest と package.json の違い

この 2 つのファイルは異なる役割を持ちます。

| ファイル                | 用途                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json`  | Plugin コード実行前に存在していなければならない discovery、config 検証、auth-choice メタデータ、UI ヒント                   |
| `package.json`          | npm メタデータ、依存関係インストール、エントリーポイント、install gating、setup、catalog メタデータに使われる `openclaw` ブロック |

どのメタデータをどこに置くべきか迷う場合は、次のルールを使ってください。

- OpenClaw が Plugin コードを読み込む前に知っている必要があるなら、`openclaw.plugin.json` に置く
- packaging、エントリーファイル、または npm install 動作に関するものなら、`package.json` に置く

### discovery に影響する package.json フィールド

一部のランタイム前 Plugin メタデータは、意図的に `openclaw.plugin.json` ではなく、
`package.json` 内の `openclaw` ブロックに置かれます。

重要な例:

| フィールド                                                          | 意味                                                                                                                                                                                 |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                               | ネイティブ Plugin エントリーポイントを宣言します。Plugin パッケージディレクトリ内に留まっている必要があります。                                                                      |
| `openclaw.runtimeExtensions`                                        | インストール済みパッケージ用のビルド済み JavaScript ランタイムエントリーポイントを宣言します。Plugin パッケージディレクトリ内に留まっている必要があります。                         |
| `openclaw.setupEntry`                                               | オンボーディング、遅延チャネル起動、読み取り専用チャネル status/SecretRef discovery 中に使われる、軽量な setup 専用エントリーポイント。Plugin パッケージディレクトリ内に留まっている必要があります。 |
| `openclaw.runtimeSetupEntry`                                        | インストール済みパッケージ用のビルド済み JavaScript setup エントリーポイントを宣言します。Plugin パッケージディレクトリ内に留まっている必要があります。                              |
| `openclaw.channel`                                                  | ラベル、docs パス、alias、選択時コピーのような軽量チャネルカタログメタデータ。                                                                                                      |
| `openclaw.channel.configuredState`                                  | フルチャネルランタイムを読み込まずに「env のみのセットアップがすでに存在するか？」に答えられる、軽量 configured-state checker メタデータ。                                           |
| `openclaw.channel.persistedAuthState`                               | フルチャネルランタイムを読み込まずに「何かがすでにサインイン済みか？」に答えられる、軽量 persisted-auth checker メタデータ。                                                         |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`           | bundled Plugin と外部公開 Plugin 用の install/update ヒント。                                                                                                                        |
| `openclaw.install.defaultChoice`                                    | 複数の install ソースがある場合の優先 install パス。                                                                                                                                 |
| `openclaw.install.minHostVersion`                                   | `>=2026.3.22` のような semver floor を使う、サポートされる最小 OpenClaw ホストバージョン。                                                                                           |
| `openclaw.install.expectedIntegrity`                                | `sha512-...` のような期待 npm dist integrity 文字列。install と update フローは取得したアーティファクトをこれに対して検証します。                                                    |
| `openclaw.install.allowInvalidConfigRecovery`                       | config が無効な場合に、限定的な bundled Plugin 再インストール回復パスを許可します。                                                                                                  |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`   | setup 専用チャネルサーフェスを、起動時にフルチャネル Plugin より先に読み込めるようにします。                                                                                         |

manifest メタデータは、ランタイム読み込み前にオンボーディングにどの provider/channel/setup choice を表示するかを決めます。`package.json#openclaw.install` は、
ユーザーがそれらの choice の 1 つを選んだときに、その Plugin をどう取得または有効化するかを
オンボーディングに伝えます。install ヒントを `openclaw.plugin.json` に移さないでください。

`openclaw.install.minHostVersion` は install 時と manifest
registry 読み込み時に強制されます。無効な値は拒否され、有効だがより新しい値は古いホスト上ではその Plugin をスキップします。

正確な npm バージョン pin は、たとえば
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"` のように、すでに `npmSpec` にあります。取得した
npm アーティファクトがその pin されたリリースと一致しなくなった場合に update フローを fail-closed させたいときは、
これに `expectedIntegrity` を組み合わせてください。対話的オンボーディングでは、
bare パッケージ名や dist-tag を含む信頼済み registry npm spec を提示します。
`expectedIntegrity` が存在する場合、install/update フローはそれを強制します。省略される場合、
registry 解決は integrity pin なしで記録されます。

チャネル Plugin は、status、channel list、
または SecretRef スキャンがフルランタイムを読み込まずに設定済みアカウントを特定する必要がある場合、
`openclaw.setupEntry` を提供すべきです。setup entry はチャネルメタデータと setup-safe な config、
status、secrets adapter を公開すべきであり、network client、Gateway listener、transport runtime は
メイン extension エントリーポイントに置いてください。

runtime エントリーポイントフィールドは、ソース
エントリーポイントフィールドに対する package 境界チェックを上書きしません。たとえば、
`openclaw.runtimeExtensions` は package 外へ逃げる `openclaw.extensions` パスを読み込み可能にはできません。

`openclaw.install.allowInvalidConfigRecovery` は意図的に限定的です。
これにより任意の壊れた config が install 可能になるわけではありません。現在これは、同じ
bundled Plugin に対する Plugin パス欠落や古い `channels.<id>` エントリーのような、
特定の古い bundled Plugin アップグレード失敗から install フローが回復できるようにするだけです。
無関係な config エラーは依然として install をブロックし、運用者を
`openclaw doctor --fix` へ誘導します。

`openclaw.channel.persistedAuthState` は、小さな checker
モジュール用の package メタデータです。

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

これは、setup、doctor、または configured-state フローが、
フルチャネル Plugin 読み込み前に軽量な yes/no auth
probe を必要とする場合に使ってください。対象 export は、永続 state のみを読む小さな
関数であるべきで、フルチャネルランタイム barrel を経由させてはいけません。

`openclaw.channel.configuredState` も、軽量な env-only
configured check 用に同じ形状に従います。

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

これは、チャネルが env やその他の小さな
非ランタイム入力から configured-state を答えられる場合に使ってください。check にフル config 解決や実際の
チャネルランタイムが必要な場合は、そのロジックを Plugin の `config.hasConfiguredState`
フックに置いてください。

## Discovery の優先順位（重複 Plugin ID）

OpenClaw は複数のルート（bundled、global install、workspace、明示的に config で選択されたパス）から Plugin を検出します。2 つの検出結果が同じ `id` を共有する場合、**最も優先順位の高い** manifest だけが保持され、優先順位の低い重複は横に並んで読み込まれるのではなく破棄されます。

優先順位（高い順）:

1. **Config-selected** — `plugins.entries.<id>` で明示的に pin されたパス
2. **Bundled** — OpenClaw に同梱される Plugin
3. **Global install** — グローバル OpenClaw Plugin ルートにインストールされた Plugin
4. **Workspace** — 現在の workspace から相対的に検出された Plugin

含意:

- workspace に置かれた bundled Plugin の fork や古いコピーは、bundled ビルドを上書きしません。
- bundled Plugin を実際にローカル版で上書きしたい場合は、workspace discovery に頼るのではなく、`plugins.entries.<id>` で pin して優先順位で勝たせてください。
- 重複破棄はログに記録されるため、Doctor と起動診断は破棄されたコピーを指摘できます。

## JSON Schema 要件

- **すべての Plugin は JSON Schema を同梱しなければなりません**。config を受け付けない場合でも同様です。
- 空の schema でも受け入れられます（たとえば `{ "type": "object", "additionalProperties": false }`）。
- schema は実行時ではなく、config の読み取り/書き込み時に検証されます。

## 検証動作

- 不明な `channels.*` キーは、そのチャネル ID が
  Plugin manifest によって宣言されていない限り **エラー** です。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny`、および `plugins.slots.*` は
  **発見可能な** Plugin ID を参照していなければなりません。不明な ID は **エラー** です。
- Plugin がインストール済みでも、manifest または schema が壊れている、または欠けている場合は、
  検証が失敗し、Doctor が Plugin エラーを報告します。
- Plugin config が存在しても、その Plugin が**無効**なら、config は保持され、
  **警告** が Doctor + ログに表示されます。

完全な `plugins.*` schema については [設定リファレンス](/ja-JP/gateway/configuration) を参照してください。

## 注意

- manifest は、ローカルファイルシステム読み込みを含む**ネイティブ OpenClaw Plugins に必須**です。ランタイムは引き続き Plugin モジュールを別に読み込みます。manifest は discovery + validation のためだけのものです。
- ネイティブ manifest は JSON5 でパースされるため、最終的な値がオブジェクトである限り、コメント、末尾カンマ、引用なしキーが許可されます。
- documented な manifest フィールドだけが manifest loader によって読み取られます。カスタムトップレベルキーは避けてください。
- `channels`、`providers`、`cliBackends`、`skills` は、Plugin がそれらを必要としない場合はすべて省略できます。
- 排他的 Plugin 種別は `plugins.slots.*` を通じて選択されます。`kind: "memory"` は `plugins.slots.memory`、`kind: "context-engine"` は `plugins.slots.contextEngine`（デフォルト `legacy`）で選びます。
- env var メタデータ（`providerAuthEnvVars`、`channelEnvVars`）は宣言的なものにすぎません。status、audit、Cron 配信検証、その他の読み取り専用サーフェスは、env var を設定済みとして扱う前に、引き続き Plugin 信頼と実効アクティベーションポリシーを適用します。
- provider コードを必要とするランタイム wizard メタデータについては、[Provider runtime hooks](/ja-JP/plugins/architecture-internals#provider-runtime-hooks) を参照してください。
- Plugin がネイティブモジュールに依存する場合は、ビルド手順と、必要なパッケージマネージャー allowlist 要件（たとえば pnpm の `allow-build-scripts` + `pnpm rebuild <package>`）を文書化してください。

## 関連

<CardGroup cols={3}>
  <Card title="Building plugins" href="/ja-JP/plugins/building-plugins" icon="rocket">
    Plugin のはじめに。
  </Card>
  <Card title="Plugin architecture" href="/ja-JP/plugins/architecture" icon="diagram-project">
    内部アーキテクチャと capability モデル。
  </Card>
  <Card title="SDK overview" href="/ja-JP/plugins/sdk-overview" icon="book">
    Plugin SDK リファレンスと subpath import。
  </Card>
</CardGroup>

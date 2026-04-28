---
read_when:
    - OpenClaw Plugin を構築している場合
    - Plugin config schema を提供する必要がある、または Plugin 検証エラーをデバッグする必要がある場合
summary: Plugin マニフェスト + JSON schema 要件（厳格な config 検証）
title: Plugin マニフェスト
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-26T11:36:16Z"
  model: gpt-5.4
  provider: openai
  source_hash: b86920ad774c5ef4ace7b546ef44e5b087a8ca694dea622ddb440258ffff4237
  source_path: plugins/manifest.md
  workflow: 15
---

このページは **ネイティブ OpenClaw Plugin マニフェスト** 専用です。

互換 bundle レイアウトについては [Plugin bundles](/ja-JP/plugins/bundles) を参照してください。

互換 bundle 形式では異なるマニフェストファイルを使用します。

- Codex bundle: `.codex-plugin/plugin.json`
- Claude bundle: `.claude-plugin/plugin.json` または、マニフェストなしのデフォルト Claude component
  レイアウト
- Cursor bundle: `.cursor-plugin/plugin.json`

OpenClaw はそれらの bundle レイアウトも自動検出しますが、
ここで説明する `openclaw.plugin.json` スキーマに対しては検証されません。

互換 bundle について、OpenClaw は現在、bundle metadata と宣言された
skill root、Claude command root、Claude bundle の `settings.json` デフォルト、
Claude bundle の LSP デフォルト、および、レイアウトが
OpenClaw ランタイム期待に一致する場合の対応 hook pack を読み取ります。

すべてのネイティブ OpenClaw Plugin は、**plugin root** に
`openclaw.plugin.json` ファイルを必ず含める必要があります。OpenClaw はこのマニフェストを使って、
**Plugin コードを実行せずに** config を検証します。不足している、または無効なマニフェストは
Plugin エラーとして扱われ、config 検証をブロックします。

完全な Plugin システムガイドについては [Plugins](/ja-JP/tools/plugin) を参照してください。
ネイティブ capability モデルと現在の外部互換ガイダンスについては:
[Capability model](/ja-JP/plugins/architecture#public-capability-model) を参照してください。

## このファイルの役割

`openclaw.plugin.json` は、OpenClaw が **Plugin コードを読み込む前に**
読む metadata です。以下のすべては、Plugin ランタイムを起動せずに調べられるほど軽量でなければなりません。

**用途:**

- Plugin の識別、config 検証、config UI ヒント
- auth、オンボーディング、セットアップ metadata（alias、auto-enable、provider env var、auth choice）
- control-plane サーフェス用の activation ヒント
- model family 所有の短縮表現
- 静的 capability 所有スナップショット（`contracts`）
- 共有 `openclaw qa` ホストが参照できる QA ランナー metadata
- カタログおよび検証サーフェスにマージされる channel 固有の config metadata

**用途外:** ランタイム動作の登録、コード entrypoint の宣言、
または npm install metadata。これらは Plugin コードと `package.json` に属します。

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
| `id`                                 | はい     | `string`                         | 正規の Plugin id。これは `plugins.entries.<id>` で使われる id です。                                                                                                                                                              |
| `configSchema`                       | はい     | `object`                         | この Plugin の config 用インライン JSON Schema。                                                                                                                                                                                  |
| `enabledByDefault`                   | いいえ   | `true`                           | バンドル済み Plugin をデフォルト有効としてマークします。デフォルト無効のままにするには、省略するか、`true` 以外の値を設定してください。                                                                                          |
| `legacyPluginIds`                    | いいえ   | `string[]`                       | この正規 Plugin id に正規化されるレガシー id。                                                                                                                                                                                    |
| `autoEnableWhenConfiguredProviders`  | いいえ   | `string[]`                       | auth、config、または model ref で言及されたときに、この Plugin を自動有効化すべき provider id。                                                                                                                                   |
| `kind`                               | いいえ   | `"memory"` \| `"context-engine"` | `plugins.slots.*` で使われる排他的な Plugin kind を宣言します。                                                                                                                                                                   |
| `channels`                           | いいえ   | `string[]`                       | この Plugin が所有する channel id。検出と config 検証に使われます。                                                                                                                                                               |
| `providers`                          | いいえ   | `string[]`                       | この Plugin が所有する provider id。                                                                                                                                                                                               |
| `providerDiscoveryEntry`             | いいえ   | `string`                         | Plugin root からの相対パスで指定する軽量な provider-discovery モジュールパス。完全な Plugin ランタイムを有効化せずに読み込める、マニフェストスコープの provider catalog metadata 用です。                                     |
| `modelSupport`                       | いいえ   | `object`                         | ランタイム前に Plugin を自動ロードするための、manifest 所有の短縮形 model-family metadata。                                                                                                                                       |
| `modelCatalog`                       | いいえ   | `object`                         | この Plugin が所有する provider 用の宣言的な model catalog metadata。これは、Plugin ランタイムを読み込まずに将来の読み取り専用一覧、オンボーディング、model picker、alias、抑制を行うための control-plane 契約です。       |
| `providerEndpoints`                  | いいえ   | `object[]`                       | core が provider ランタイム読み込み前に分類しなければならない provider route 用の、manifest 所有 endpoint host/baseUrl metadata。                                                                                                 |
| `cliBackends`                        | いいえ   | `string[]`                       | この Plugin が所有する CLI inference backend id。明示的な config ref からの起動時自動有効化に使われます。                                                                                                                        |
| `syntheticAuthRefs`                  | いいえ   | `string[]`                       | ランタイム読み込み前の cold model discovery 中に、その Plugin 所有の synthetic auth hook をプローブすべき provider または CLI backend ref。                                                                                       |
| `nonSecretAuthMarkers`               | いいえ   | `string[]`                       | シークレットではないローカル/OAuth/ambient 認証状態を表す、バンドル済み Plugin 所有のプレースホルダー API キー値。                                                                                                                |
| `commandAliases`                     | いいえ   | `object[]`                       | ランタイム読み込み前に Plugin を認識した config および CLI 診断を生成すべき、この Plugin 所有のコマンド名。                                                                                                                      |
| `providerAuthEnvVars`                | いいえ   | `Record<string, string[]>`       | provider auth/status lookup 用の非推奨互換 env metadata。新しい Plugin では `setup.providers[].envVars` を優先してください。OpenClaw は非推奨期間中、引き続きこれを読み取ります。                                               |
| `providerAuthAliases`                | いいえ   | `Record<string, string>`         | auth lookup のために別の provider id を再利用すべき provider id。たとえば、ベース provider の API キーと auth profile を共有する coding provider などです。                                                                     |
| `channelEnvVars`                     | いいえ   | `Record<string, string[]>`       | Plugin コードを読み込まずに OpenClaw が参照できる軽量な channel env metadata。汎用の起動/config ヘルパーが見えるべき env 駆動 channel セットアップまたは auth サーフェスにはこれを使います。                                  |
| `providerAuthChoices`                | いいえ   | `object[]`                       | オンボーディング picker、preferred-provider 解決、単純な CLI flag 配線用の軽量な auth-choice metadata。                                                                                                                          |
| `activation`                         | いいえ   | `object`                         | provider、command、channel、route、capability トリガーによるロードのための軽量な activation planner metadata。metadata のみであり、実際の動作は引き続き Plugin ランタイムが所有します。                                          |
| `setup`                              | いいえ   | `object`                         | 検出およびセットアップサーフェスが Plugin ランタイムを読み込まずに参照できる、軽量な setup/onboarding 記述子。                                                                                                                   |
| `qaRunners`                          | いいえ   | `object[]`                       | Plugin ランタイム読み込み前に共有 `openclaw qa` ホストが使う軽量な QA ランナー記述子。                                                                                                                                           |
| `contracts`                          | いいえ   | `object`                         | 外部 auth hook、speech、realtime transcription、realtime voice、media-understanding、image-generation、music-generation、video-generation、web-fetch、web search、tool ownership 用の静的なバンドル済み capability スナップショット。 |
| `mediaUnderstandingProviderMetadata` | いいえ   | `Record<string, object>`         | `contracts.mediaUnderstandingProviders` で宣言された provider id 用の軽量な media-understanding デフォルト。                                                                                                                     |
| `channelConfigs`                     | いいえ   | `Record<string, object>`         | ランタイム読み込み前に検出および検証サーフェスにマージされる、manifest 所有の channel config metadata。                                                                                                                           |
| `skills`                             | いいえ   | `string[]`                       | Plugin root からの相対パスで指定する、ロード対象の Skill ディレクトリ。                                                                                                                                                           |
| `name`                               | いいえ   | `string`                         | 人が読める Plugin 名。                                                                                                                                                                                                             |
| `description`                        | いいえ   | `string`                         | Plugin サーフェスに表示される短い要約。                                                                                                                                                                                            |
| `version`                            | いいえ   | `string`                         | 情報用の Plugin バージョン。                                                                                                                                                                                                       |
| `uiHints`                            | いいえ   | `Record<string, object>`         | config フィールド用の UI ラベル、プレースホルダー、機微性ヒント。                                                                                                                                                                  |

## providerAuthChoices リファレンス

各 `providerAuthChoices` エントリは、1 つのオンボーディングまたは auth choice を記述します。
OpenClaw は provider ランタイムを読み込む前にこれを読み取ります。
provider セットアップ一覧は、provider ランタイムを読み込まずに、これらの manifest choice、descriptor 由来の setup
choice、install-catalog metadata を使用します。

| フィールド             | 必須     | 型                                              | 意味                                                                                                         |
| ---------------------- | -------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `provider`             | はい     | `string`                                        | この選択肢が属するプロバイダー id。                                                                          |
| `method`               | はい     | `string`                                        | ディスパッチ先の認証方式 id。                                                                                |
| `choiceId`             | はい     | `string`                                        | オンボーディングと CLI フローで使われる安定した auth-choice id。                                             |
| `choiceLabel`          | いいえ   | `string`                                        | ユーザー向けラベル。省略した場合、OpenClaw は `choiceId` にフォールバックします。                            |
| `choiceHint`           | いいえ   | `string`                                        | ピッカー向けの短い補助テキスト。                                                                             |
| `assistantPriority`    | いいえ   | `number`                                        | アシスタント主導のインタラクティブなピッカーで、値が小さいほど先に並びます。                                 |
| `assistantVisibility`  | いいえ   | `"visible"` \| `"manual-only"`                  | 手動の CLI 選択は可能なまま、アシスタント用ピッカーからこの選択肢を隠します。                                |
| `deprecatedChoiceIds`  | いいえ   | `string[]`                                      | この置き換え先の選択肢にユーザーをリダイレクトすべき、旧来の choice id。                                     |
| `groupId`              | いいえ   | `string`                                        | 関連する選択肢をグループ化するための任意のグループ id。                                                      |
| `groupLabel`           | いいえ   | `string`                                        | そのグループのユーザー向けラベル。                                                                           |
| `groupHint`            | いいえ   | `string`                                        | グループ向けの短い補助テキスト。                                                                             |
| `optionKey`            | いいえ   | `string`                                        | 単一フラグのシンプルな認証フロー向けの内部 option キー。                                                     |
| `cliFlag`              | いいえ   | `string`                                        | `--openrouter-api-key` のような CLI フラグ名。                                                               |
| `cliOption`            | いいえ   | `string`                                        | `--openrouter-api-key <key>` のような完全な CLI オプション形式。                                             |
| `cliDescription`       | いいえ   | `string`                                        | CLI ヘルプで使われる説明。                                                                                   |
| `onboardingScopes`     | いいえ   | `Array<"text-inference" \| "image-generation">` | この選択肢をどのオンボーディング画面に表示するか。省略した場合、デフォルトは `["text-inference"]` です。     |

## commandAliases リファレンス

`commandAliases` は、plugin がランタイムコマンド名を所有していて、ユーザーがそれを誤って `plugins.allow` に入れたり、ルート CLI コマンドとして実行しようとしたりする可能性がある場合に使います。OpenClaw は、plugin のランタイムコードを import せずに診断を行うためにこのメタデータを使います。

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

| フィールド   | 必須   | 型                | 意味                                                                       |
| ------------ | ------ | ----------------- | -------------------------------------------------------------------------- |
| `name`       | はい   | `string`          | この plugin に属するコマンド名。                                           |
| `kind`       | いいえ | `"runtime-slash"` | そのエイリアスがルート CLI コマンドではなくチャットのスラッシュコマンドであることを示します。 |
| `cliCommand` | いいえ | `string`          | 存在する場合、CLI 操作用に提案する関連ルート CLI コマンド。                |

## activation リファレンス

`activation` は、plugin がどの control-plane イベントで activation/load plan に含まれるべきかを低コストで宣言できる場合に使います。

このブロックはプランナー用のメタデータであり、ライフサイクル API ではありません。これはランタイム動作を登録せず、`register(...)` の代わりにもならず、plugin コードがすでに実行済みであることも保証しません。activation planner は、既存の manifest 所有権メタデータ（`providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools`、hooks など）にフォールバックする前に、このフィールドを使って候補 plugin を絞り込みます。

すでに所有権を表現している、できるだけ狭いメタデータを優先してください。関係を表現できるなら、`providers`、`channels`、`commandAliases`、setup descriptor、または `contracts` を使ってください。`activation` は、それらの所有権フィールドでは表現できない追加の planner ヒントに使ってください。
`claude-cli`、`codex-cli`、`google-gemini-cli` のような CLI ランタイムエイリアスにはトップレベルの `cliBackends` を使ってください。`activation.onAgentHarnesses` は、すでに所有権フィールドが存在しない埋め込み agent harness id にのみ使います。

このブロックはメタデータ専用です。ランタイム動作を登録せず、`register(...)`、`setupEntry`、その他のランタイム/plugin エントリーポイントの代わりにもなりません。現在の利用側は、より広い plugin ロードの前にこれを絞り込みヒントとして使っているため、activation メタデータがない場合の影響は通常パフォーマンスだけであり、従来の manifest 所有権フォールバックがまだ存在する間は正しさを変えるべきではありません。

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

| フィールド         | 必須   | 型                                                   | 意味                                                                                                                                          |
| ------------------ | ------ | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `onProviders`      | いいえ | `string[]`                                           | この plugin を activation/load plan に含めるべきプロバイダー id。                                                                             |
| `onAgentHarnesses` | いいえ | `string[]`                                           | この plugin を activation/load plan に含めるべき埋め込み agent harness ランタイム id。CLI バックエンドエイリアスにはトップレベルの `cliBackends` を使ってください。 |
| `onCommands`       | いいえ | `string[]`                                           | この plugin を activation/load plan に含めるべきコマンド id。                                                                                 |
| `onChannels`       | いいえ | `string[]`                                           | この plugin を activation/load plan に含めるべき channel id。                                                                                 |
| `onRoutes`         | いいえ | `string[]`                                           | この plugin を activation/load plan に含めるべき route kind。                                                                                 |
| `onCapabilities`   | いいえ | `Array<"provider" \| "channel" \| "tool" \| "hook">` | control-plane の activation planning で使われる広い capability ヒント。可能な場合はより狭いフィールドを優先してください。                   |

現在のライブ利用側:

- コマンド起動の CLI planning は、従来の
  `commandAliases[].cliCommand` または `commandAliases[].name` にフォールバックします
- agent-runtime 起動 planning は、埋め込み harness には `activation.onAgentHarnesses` を使い、
  CLI ランタイムエイリアスにはトップレベルの `cliBackends[]` を使います
- channel 起動の setup/channel planning は、明示的な channel activation メタデータがない場合、
  従来の `channels[]` 所有権にフォールバックします
- provider 起動の setup/runtime planning は、明示的な provider
  activation メタデータがない場合、従来の `providers[]` とトップレベル `cliBackends[]`
  所有権にフォールバックします

プランナー診断では、明示的な activation ヒントと manifest 所有権フォールバックを区別できます。たとえば `activation-command-hint` は `activation.onCommands` が一致したことを意味し、`manifest-command-alias` は代わりに planner が `commandAliases` 所有権を使ったことを意味します。これらの reason ラベルは host 診断とテスト用です。plugin 作成者は、所有権を最も適切に表すメタデータを引き続き宣言してください。

## qaRunners リファレンス

`qaRunners` は、plugin が共有の `openclaw qa` ルート配下に 1 つ以上の transport runner を提供する場合に使います。このメタデータは低コストかつ静的に保ってください。実際の CLI 登録は、`qaRunnerCliRegistrations` を export する軽量な `runtime-api.ts` サーフェスを通じて、引き続き plugin ランタイムが所有します。

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

| フィールド    | 必須   | 型       | 意味                                                               |
| ------------- | ------ | -------- | ------------------------------------------------------------------ |
| `commandName` | はい   | `string` | `openclaw qa` 配下にマウントされるサブコマンド。たとえば `matrix`。 |
| `description` | いいえ | `string` | 共有 host がスタブコマンドを必要とする場合に使われるフォールバックヘルプテキスト。 |

## setup リファレンス

`setup` は、setup とオンボーディング画面がランタイムロード前に低コストな plugin 所有メタデータを必要とする場合に使います。

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

トップレベルの `cliBackends` は引き続き有効で、CLI 推論バックエンドを表し続けます。`setup.cliBackends` は、メタデータ専用のままであるべき control-plane/setup フロー向けの setup 固有 descriptor サーフェスです。

存在する場合、`setup.providers` と `setup.cliBackends` は setup 検出における優先的な descriptor-first 参照先です。descriptor が候補 plugin を絞り込むだけで、setup にさらに豊富な setup 時ランタイムフックが必要な場合は、`requiresRuntime: true` を設定し、フォールバック実行経路として `setup-api` を維持してください。

OpenClaw は、汎用のプロバイダー認証および env var 参照で `setup.providers[].envVars` も含めます。`providerAuthEnvVars` は廃止予定期間中は互換アダプター経由で引き続きサポートされますが、これをまだ使っているバンドル外 plugin には manifest 診断が出ます。新しい plugin は setup/status の env メタデータを `setup.providers[].envVars` に置くべきです。

OpenClaw はまた、setup entry がない場合、または `setup.requiresRuntime: false` によって setup ランタイムが不要と宣言されている場合、`setup.providers[].authMethods` から単純な setup 選択肢を導出できます。カスタムラベル、CLI フラグ、オンボーディング scope、アシスタント用メタデータについては、明示的な `providerAuthChoices` エントリーが引き続き優先されます。

`requiresRuntime: false` は、それらの descriptor だけで setup 画面に十分な場合にのみ設定してください。OpenClaw は明示的な `false` を descriptor-only 契約として扱い、setup 参照のために `setup-api` や `openclaw.setupEntry` を実行しません。descriptor-only plugin がそれらの setup ランタイムエントリーのいずれかを引き続き提供している場合、OpenClaw は加算的な診断を報告し、引き続きそれを無視します。`requiresRuntime` を省略すると従来のフォールバック動作が維持されるため、フラグなしで descriptor を追加した既存の plugin が壊れることはありません。

setup 参照では plugin 所有の `setup-api` コードを実行できるため、正規化された `setup.providers[].id` と `setup.cliBackends[]` の値は、検出された plugin 間で一意である必要があります。所有権が曖昧な場合、検出順から勝者を選ぶのではなく、クローズドに失敗します。

setup ランタイムが実行される場合、setup registry 診断は、`setup-api` が manifest descriptor で宣言されていないプロバイダーまたは CLI バックエンドを登録したとき、または descriptor に対応するランタイム登録がないときに、descriptor drift を報告します。これらの診断は加算的であり、従来の plugin を拒否しません。

### setup.providers リファレンス

| フィールド    | 必須   | 型         | 意味                                                                                   |
| ------------- | ------ | ---------- | -------------------------------------------------------------------------------------- |
| `id`          | はい   | `string`   | setup またはオンボーディング中に公開されるプロバイダー id。正規化された id はグローバルに一意に保ってください。 |
| `authMethods` | いいえ | `string[]` | フルランタイムをロードせずにこのプロバイダーがサポートする setup/認証方式 id。         |
| `envVars`     | いいえ | `string[]` | plugin ランタイムのロード前に汎用の setup/status 画面で確認できる env var。            |

### setup フィールド

| フィールド         | 必須   | 型         | 意味                                                                                              |
| ------------------ | ------ | ---------- | ------------------------------------------------------------------------------------------------- |
| `providers`        | いいえ | `object[]` | setup およびオンボーディング中に公開されるプロバイダー setup descriptor。                         |
| `cliBackends`      | いいえ | `string[]` | descriptor-first の setup 参照で使われる setup 時バックエンド id。正規化された id はグローバルに一意に保ってください。 |
| `configMigrations` | いいえ | `string[]` | この plugin の setup 画面が所有する config migration id。                                         |
| `requiresRuntime`  | いいえ | `boolean`  | descriptor 参照後も setup に `setup-api` の実行が必要かどうか。                                   |

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

各フィールドヒントには以下を含められます。

| フィールド    | 型         | 意味                               |
| ------------- | ---------- | ---------------------------------- |
| `label`       | `string`   | ユーザー向けのフィールドラベル。   |
| `help`        | `string`   | 短い補助テキスト。                 |
| `tags`        | `string[]` | 任意の UI タグ。                   |
| `advanced`    | `boolean`  | このフィールドを高度な項目として示します。 |
| `sensitive`   | `boolean`  | このフィールドを secret または機密として示します。 |
| `placeholder` | `string`   | フォーム入力用のプレースホルダーテキスト。 |

## contracts リファレンス

`contracts` は、OpenClaw が plugin ランタイムを import せずに読み取れる、静的な capability 所有権メタデータにのみ使ってください。

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
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

各リストは任意です。

| フィールド                       | 型         | 意味                                                                          |
| -------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server 拡張ファクトリー id。現在は `codex-app-server`。             |
| `agentToolResultMiddleware`      | `string[]` | バンドルされた plugin が tool-result middleware を登録できるランタイム id。   |
| `externalAuthProviders`          | `string[]` | この plugin が外部認証プロファイルフックを所有するプロバイダー id。           |
| `speechProviders`                | `string[]` | この plugin が所有する speech プロバイダー id。                               |
| `realtimeTranscriptionProviders` | `string[]` | この plugin が所有する realtime-transcription プロバイダー id。               |
| `realtimeVoiceProviders`         | `string[]` | この plugin が所有する realtime-voice プロバイダー id。                       |
| `memoryEmbeddingProviders`       | `string[]` | この plugin が所有するメモリ埋め込みプロバイダー id。                         |
| `mediaUnderstandingProviders`    | `string[]` | この plugin が所有する media-understanding プロバイダー id。                  |
| `imageGenerationProviders`       | `string[]` | この plugin が所有する image-generation プロバイダー id。                     |
| `videoGenerationProviders`       | `string[]` | この plugin が所有する video-generation プロバイダー id。                     |
| `webFetchProviders`              | `string[]` | この plugin が所有する web-fetch プロバイダー id。                            |
| `webSearchProviders`             | `string[]` | この plugin が所有する web-search プロバイダー id。                           |
| `tools`                          | `string[]` | この plugin が所有する agent tool 名。バンドルされた契約チェック用。          |

`contracts.embeddedExtensionFactories` は、バンドルされた Codex app-server 専用の拡張ファクトリー向けに維持されています。バンドルされた tool-result transform は代わりに `contracts.agentToolResultMiddleware` を宣言し、`api.registerAgentToolResultMiddleware(...)` で登録してください。外部 plugin は tool-result middleware を登録できません。この seam は、モデルが見る前に高信頼の tool 出力を書き換えられるためです。

`resolveExternalAuthProfiles` を実装するプロバイダー plugin は、`contracts.externalAuthProviders` を宣言する必要があります。この宣言がない plugin でも非推奨の互換フォールバック経由では引き続き動作しますが、そのフォールバックは低速で、移行期間後に削除されます。

バンドルされたメモリ埋め込みプロバイダーは、`local` のような組み込みアダプターを含め、公開するすべてのアダプター id について `contracts.memoryEmbeddingProviders` を宣言する必要があります。スタンドアロンの CLI パスは、この manifest 契約を使って、完全な Gateway ランタイムがプロバイダーを登録する前に所有 plugin のみをロードします。

## mediaUnderstandingProviderMetadata リファレンス

`mediaUnderstandingProviderMetadata` は、media-understanding プロバイダーに、generic core helper がランタイムロード前に必要とするデフォルトモデル、自動認証フォールバック優先度、またはネイティブドキュメントサポートがある場合に使います。キーは `contracts.mediaUnderstandingProviders` でも宣言されている必要があります。

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

各プロバイダーエントリーには以下を含められます。

| フィールド             | 型                                  | 意味                                                                     |
| ---------------------- | ----------------------------------- | ------------------------------------------------------------------------ |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | このプロバイダーが公開するメディア capability。                          |
| `defaultModels`        | `Record<string, string>`            | config でモデルが指定されていないときに使われる、capability からモデルへのデフォルト。 |
| `autoPriority`         | `Record<string, number>`            | 資格情報ベースの自動プロバイダーフォールバックで、値が小さいほど先に並びます。 |
| `nativeDocumentInputs` | `"pdf"[]`                           | このプロバイダーがサポートするネイティブドキュメント入力。               |

## channelConfigs リファレンス

`channelConfigs` は、channel plugin がランタイムロード前に低コストな config メタデータを必要とする場合に使います。読み取り専用の channel setup/status 検出では、setup entry が利用できない場合、または `setup.requiresRuntime: false` によって setup ランタイムが不要と宣言されている場合に、設定済み外部 channel に対してこのメタデータを直接使えます。

`channelConfigs` は plugin manifest メタデータであり、新しいトップレベルのユーザー config セクションではありません。ユーザーは引き続き `channels.<channel-id>` 配下で channel インスタンスを設定します。OpenClaw は、plugin ランタイムコードが実行される前に、どの plugin がその設定済み channel を所有しているかを判断するために manifest メタデータを読み取ります。

channel plugin にとって、`configSchema` と `channelConfigs` は異なるパスを記述します。

- `configSchema` は `plugins.entries.<plugin-id>.config` を検証します
- `channelConfigs.<channel-id>.schema` は `channels.<channel-id>` を検証します

`channels[]` を宣言するバンドル外 plugin は、対応する `channelConfigs` エントリーも宣言する必要があります。これらがない場合でも OpenClaw は plugin をロードできますが、コールドパスの config schema、setup、Control UI 画面では、plugin ランタイムが実行されるまで channel 所有のオプション形状を把握できません。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` と `nativeSkillsAutoEnabled` は、channel ランタイムのロード前に実行されるコマンド config チェック向けの静的な `auto` デフォルトを宣言できます。バンドルされた channel は、ほかの package 所有 channel カタログメタデータとあわせて、`package.json#openclaw.channel.commands` を通じて同じデフォルトを公開することもできます。

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
      "commands": {
        "nativeCommandsAutoEnabled": true,
        "nativeSkillsAutoEnabled": true
      },
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

各 channel エントリーには以下を含められます。

| フィールド    | 型                       | 意味                                                                                         |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` の JSON Schema。宣言された各 channel config エントリーで必須です。          |
| `uiHints`     | `Record<string, object>` | その channel config セクション向けの任意の UI ラベル、プレースホルダー、機密ヒント。       |
| `label`       | `string`                 | ランタイムメタデータの準備ができていないときに、picker と inspect 画面に統合される channel ラベル。 |
| `description` | `string`                 | inspect および catalog 画面向けの短い channel 説明。                                        |
| `commands`    | `object`                 | ランタイム前の config チェック向けの、静的な native command と native skill の自動デフォルト。 |
| `preferOver`  | `string[]`               | 選択画面でこれより下位にすべき、旧来または優先度の低い plugin id。                           |

### 別の channel plugin を置き換える

別の plugin でも提供できる channel id に対して、あなたの plugin が優先される所有者である場合は `preferOver` を使ってください。よくあるケースとしては、plugin id のリネーム、バンドルされた plugin を置き換えるスタンドアロン plugin、または config 互換性のために同じ channel id を維持するメンテナンスされた fork があります。

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

`channels.chat` が設定されている場合、OpenClaw は channel id と優先される plugin id の両方を考慮します。優先度の低い plugin が、バンドルされているかデフォルトで有効になっているという理由だけで選ばれていた場合、OpenClaw は実効ランタイム config でそれを無効にし、1 つの plugin がその channel とその tools を所有するようにします。明示的なユーザー選択は引き続き優先されます。ユーザーが両方の plugin を明示的に有効にした場合、OpenClaw はその選択を保持し、要求された plugin セットを黙って変更する代わりに、重複する channel/tool 診断を報告します。

`preferOver` は、実際に同じ channel を提供できる plugin id に限定して使ってください。これは一般的な優先度フィールドではなく、ユーザー config キーのリネームも行いません。

## modelSupport リファレンス

OpenClaw が、plugin ランタイムのロード前に `gpt-5.5` や `claude-sonnet-4.6` のような短縮モデル id からあなたのプロバイダー plugin を推論できるようにしたい場合は `modelSupport` を使ってください。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw は次の優先順位を適用します。

- 明示的な `provider/model` 参照では、所有する `providers` manifest メタデータを使います
- `modelPatterns` は `modelPrefixes` より優先されます
- バンドル外 plugin とバンドルされた plugin の両方が一致した場合、バンドル外 plugin が優先されます
- 残る曖昧さは、ユーザーまたは config がプロバイダーを指定するまで無視されます

フィールド:

| フィールド      | 型         | 意味                                                                 |
| --------------- | ---------- | -------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 短縮モデル id に対して `startsWith` で一致させるプレフィックス。     |
| `modelPatterns` | `string[]` | プロファイル接尾辞を除去した後の短縮モデル id に対して一致させる regex ソース。 |

## modelCatalog リファレンス

OpenClaw が plugin ランタイムをロードする前にプロバイダーモデルのメタデータを把握すべき場合は `modelCatalog` を使ってください。これは、固定 catalog 行、プロバイダー alias、抑制ルール、検出モードのための manifest 所有ソースです。ランタイム refresh は引き続きプロバイダーランタイムコードに属しますが、manifest はランタイムがいつ必要かを core に伝えます。

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
        "reason": "Azure OpenAI Responses では利用できない"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

トップレベルフィールド:

| フィールド     | 型                                                       | 意味                                                                                                  |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | この plugin が所有するプロバイダー id の catalog 行。キーはトップレベルの `providers` にも含めるべきです。 |
| `aliases`      | `Record<string, object>`                                 | catalog または suppression planning のために所有プロバイダーに解決されるべきプロバイダー alias。    |
| `suppressions` | `object[]`                                               | この plugin がプロバイダー固有の理由で抑制する、別のソースからのモデル行。                            |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | そのプロバイダー catalog を manifest メタデータから読み取れるか、cache に refresh できるか、またはランタイムが必要か。 |

プロバイダーフィールド:

| フィールド | 型                       | 意味                                                                  |
| ---------- | ------------------------ | --------------------------------------------------------------------- |
| `baseUrl`  | `string`                 | このプロバイダー catalog 内のモデルに対する任意のデフォルト base URL。 |
| `api`      | `ModelApi`               | このプロバイダー catalog 内のモデルに対する任意のデフォルト API アダプター。 |
| `headers`  | `Record<string, string>` | このプロバイダー catalog に適用される任意の静的ヘッダー。             |
| `models`   | `object[]`               | 必須のモデル行。`id` のない行は無視されます。                         |

モデルフィールド:

| フィールド      | 型                                                             | 意味                                                                             |
| --------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `id`            | `string`                                                       | `provider/` プレフィックスを含まない、プロバイダー内ローカルなモデル id。        |
| `name`          | `string`                                                       | 任意の表示名。                                                                   |
| `api`           | `ModelApi`                                                     | 任意のモデル単位 API オーバーライド。                                            |
| `baseUrl`       | `string`                                                       | 任意のモデル単位 base URL オーバーライド。                                       |
| `headers`       | `Record<string, string>`                                       | 任意のモデル単位の静的ヘッダー。                                                 |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | そのモデルが受け付ける modality。                                                |
| `reasoning`     | `boolean`                                                      | そのモデルが reasoning 動作を公開するかどうか。                                  |
| `contextWindow` | `number`                                                       | ネイティブプロバイダーの context window。                                        |
| `contextTokens` | `number`                                                       | `contextWindow` と異なる場合の任意の実効ランタイム context 上限。                 |
| `maxTokens`     | `number`                                                       | 判明している場合の最大出力トークン数。                                           |
| `cost`          | `object`                                                       | 任意の 100 万トークンあたり USD 価格。オプションの `tieredPricing` を含みます。   |
| `compat`        | `object`                                                       | OpenClaw モデル config 互換性に一致する任意の互換フラグ。                        |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 一覧ステータス。行をまったく表示してはならない場合にのみ suppression を使ってください。 |
| `statusReason`  | `string`                                                       | 利用不可ステータスとともに表示される任意の理由。                                 |
| `replaces`      | `string[]`                                                     | このモデルが置き換える、古いプロバイダー内ローカルモデル id。                     |
| `replacedBy`    | `string`                                                       | 非推奨行の置き換え先となるプロバイダー内ローカルモデル id。                       |
| `tags`          | `string[]`                                                     | picker と filter で使われる安定したタグ。                                        |

ランタイム専用データを `modelCatalog` に入れないでください。完全なモデルセットを把握するために、プロバイダーがアカウント状態、API リクエスト、またはローカルプロセス検出を必要とする場合は、そのプロバイダーを `discovery` で `refreshable` または `runtime` として宣言してください。

### OpenClaw Provider Index

OpenClaw Provider Index は、plugin がまだインストールされていない可能性があるプロバイダー向けの OpenClaw 所有 preview メタデータです。これは plugin manifest の一部ではありません。plugin manifest は引き続きインストール済み plugin の正規情報です。Provider Index は、プロバイダー plugin がインストールされていない場合に、将来の installable-provider と pre-install モデル picker 画面が利用する内部フォールバック契約です。

catalog 権限の順序:

1. ユーザー config。
2. インストール済み plugin manifest の `modelCatalog`。
3. 明示的な refresh による model catalog cache。
4. OpenClaw Provider Index preview 行。

Provider Index には、secret、有効状態、ランタイムフック、またはライブのアカウント固有モデルデータを含めてはいけません。その preview catalog は plugin manifest と同じ `modelCatalog` プロバイダー行の形状を使いますが、`api`、`baseUrl`、価格、互換フラグのようなランタイムアダプターフィールドをインストール済み plugin manifest と意図的に揃えている場合を除き、安定した表示メタデータに限定してください。ライブの `/models` 検出を持つプロバイダーは、通常の一覧表示やオンボーディングでプロバイダー API を呼び出すのではなく、明示的な model catalog cache パスを通じて refresh 済み行を書き込むべきです。

Provider Index エントリーは、plugin が core から移動したか、まだインストールされていないプロバイダー向けの installable-plugin メタデータを持つこともできます。このメタデータは channel catalog パターンを反映しています。パッケージ名、npm install spec、期待される integrity、低コストな auth-choice ラベルがあれば、インストール可能な setup オプションを表示するには十分です。plugin がインストールされると、その manifest が優先され、そのプロバイダーの Provider Index エントリーは無視されます。

従来のトップレベル capability キーは非推奨です。`openclaw doctor --fix` を使って `speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders`、`webSearchProviders` を `contracts` 配下へ移動してください。通常の manifest ロードでは、これらのトップレベルフィールドを capability 所有権としてはもう扱いません。

## Manifest と package.json

この 2 つのファイルは異なる役割を持ちます。

| ファイル               | 用途                                                                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 検出、config 検証、認証選択肢メタデータ、および plugin コードの実行前に存在している必要がある UI ヒント                         |
| `package.json`         | npm メタデータ、依存関係インストール、およびエントリーポイント、インストールゲート、setup、または catalog メタデータに使う `openclaw` ブロック |

どこにメタデータを置くべきかわからない場合は、次のルールを使ってください。

- OpenClaw が plugin コードをロードする前にそれを知る必要がある場合は、`openclaw.plugin.json` に置いてください
- パッケージング、エントリーファイル、または npm install 動作に関するものであれば、`package.json` に置いてください

### 検出に影響する package.json フィールド

一部のランタイム前 plugin メタデータは、`openclaw.plugin.json` ではなく、意図的に `package.json` の `openclaw` ブロック配下に置かれます。

重要な例:

| フィールド                                                        | 意味                                                                                                                                                                                     |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | ネイティブ plugin エントリーポイントを宣言します。plugin パッケージディレクトリー内にとどまる必要があります。                                                                          |
| `openclaw.runtimeExtensions`                                      | インストール済みパッケージ向けのビルド済み JavaScript ランタイムエントリーポイントを宣言します。plugin パッケージディレクトリー内にとどまる必要があります。                              |
| `openclaw.setupEntry`                                             | オンボーディング、遅延 channel 起動、読み取り専用の channel status/SecretRef 検出で使われる軽量な setup 専用エントリーポイントです。plugin パッケージディレクトリー内にとどまる必要があります。 |
| `openclaw.runtimeSetupEntry`                                      | インストール済みパッケージ向けのビルド済み JavaScript setup エントリーポイントを宣言します。plugin パッケージディレクトリー内にとどまる必要があります。                                  |
| `openclaw.channel`                                                | ラベル、docs パス、alias、選択用コピーなどの低コストな channel catalog メタデータです。                                                                                                 |
| `openclaw.channel.commands`                                       | channel ランタイムのロード前に config、監査、コマンド一覧画面で使われる、静的な native command および native skill の自動デフォルトメタデータです。                                     |
| `openclaw.channel.configuredState`                                | フル channel ランタイムをロードせずに「env のみの setup がすでに存在するか？」に答えられる軽量な configured-state checker メタデータです。                                              |
| `openclaw.channel.persistedAuthState`                             | フル channel ランタイムをロードせずに「すでに何かサインイン済みか？」に答えられる軽量な persisted-auth checker メタデータです。                                                         |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | バンドルされた plugin と外部公開 plugin 向けの install/update ヒントです。                                                                                                              |
| `openclaw.install.defaultChoice`                                  | 複数のインストール元が利用できる場合の優先インストールパスです。                                                                                                                         |
| `openclaw.install.minHostVersion`                                 | `>=2026.3.22` のような semver 下限を使った、サポートされる OpenClaw ホストの最小バージョンです。                                                                                        |
| `openclaw.install.expectedIntegrity`                              | `sha512-...` のような期待される npm dist integrity 文字列です。install および update フローは取得したアーティファクトをこれに対して検証します。                                          |
| `openclaw.install.allowInvalidConfigRecovery`                     | config が無効な場合に、限定的なバンドル plugin 再インストール復旧パスを許可します。                                                                                                      |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 起動中、フル channel plugin より前に setup 専用 channel 画面をロードできるようにします。                                                                                                 |

manifest メタデータは、オンボーディングでランタイムロード前にどの provider/channel/setup 選択肢を表示するかを決定します。`package.json#openclaw.install` は、ユーザーがそれらの選択肢の 1 つを選んだときに、その plugin をどう取得または有効化するかをオンボーディングに伝えます。install ヒントを `openclaw.plugin.json` に移さないでください。

`openclaw.install.minHostVersion` は install 時と manifest registry ロード時に適用されます。無効な値は拒否されます。新しすぎても有効な値であれば、古いホストではその plugin をスキップします。

正確な npm バージョン固定は、たとえば `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"` のように、すでに `npmSpec` にあります。公式の外部 catalog エントリーは、取得した npm アーティファクトが固定されたリリースと一致しなくなった場合に update フローがクローズドに失敗するよう、正確な spec と `expectedIntegrity` を組み合わせるべきです。インタラクティブなオンボーディングでは、互換性のために、パッケージ名だけや dist-tag を含む trusted registry npm spec も引き続き提示されます。catalog 診断では、正確指定、フローティング、integrity 固定、integrity 欠如、パッケージ名不一致、無効な default-choice ソースを区別できます。また、`expectedIntegrity` が存在していても、それを固定できる有効な npm ソースがない場合は警告も出します。`expectedIntegrity` が存在する場合、install/update フローはそれを適用します。省略された場合、registry 解決は integrity 固定なしで記録されます。

channel plugin は、status、channel 一覧、または SecretRef スキャンで、フルランタイムをロードせずに設定済みアカウントを識別する必要がある場合、`openclaw.setupEntry` を提供するべきです。setup entry では、channel メタデータに加えて setup-safe な config、status、secret adapter を公開してください。ネットワーククライアント、Gateway リスナー、transport ランタイムはメインの拡張エントリーポイントに置いてください。

ランタイムエントリーポイントフィールドは、ソースエントリーポイントフィールドに対するパッケージ境界チェックを上書きしません。たとえば、`openclaw.runtimeExtensions` によって、境界外へ逃げる `openclaw.extensions` パスをロード可能にはできません。

`openclaw.install.allowInvalidConfigRecovery` は意図的に限定的です。これによって任意の壊れた config がインストール可能になるわけではありません。現在は、バンドル plugin パスの欠落や、その同じバンドル plugin に対する古い `channels.<id>` エントリーなど、特定の古いバンドル plugin アップグレード失敗から install フローが復旧できるようにするだけです。無関係な config エラーは引き続き install をブロックし、運用者を `openclaw doctor --fix` に誘導します。

`openclaw.channel.persistedAuthState` は、小さな checker モジュール向けのパッケージメタデータです。

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

これは、setup、doctor、または configured-state フローで、フル channel plugin のロード前に低コストな yes/no 認証プローブが必要な場合に使ってください。対象の export は、永続化された状態だけを読む小さな関数であるべきです。フル channel ランタイム barrel 経由にしないでください。

`openclaw.channel.configuredState` も、低コストな env-only configured チェック向けに同じ形状に従います。

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

これは、channel が env または他の小さな非ランタイム入力から configured-state に答えられる場合に使ってください。チェックにフル config 解決または実際の channel ランタイムが必要な場合は、そのロジックは代わりに plugin の `config.hasConfiguredState` hook に置いてください。

## 検出の優先順位（重複する plugin id）

OpenClaw は複数のルート（バンドル、グローバルインストール、workspace、config で明示選択されたパス）から plugin を検出します。2 つの検出結果が同じ `id` を共有している場合、保持されるのは**最優先**の manifest だけで、優先度の低い重複は並んでロードされるのではなく破棄されます。

優先順位は高い順に次のとおりです。

1. **Config-selected** — `plugins.entries.<id>` で明示的に固定されたパス
2. **Bundled** — OpenClaw に同梱される plugin
3. **Global install** — グローバル OpenClaw plugin ルートにインストールされた plugin
4. **Workspace** — 現在の workspace から相対的に検出された plugin

意味すること:

- workspace に置かれたバンドル plugin の fork や古いコピーは、バンドル済みビルドをシャドーしません。
- バンドル plugin をローカルのものに本当に置き換えたい場合は、workspace 検出に頼るのではなく、`plugins.entries.<id>` で固定して優先順位で勝たせてください。
- 破棄された重複はログに記録されるため、Doctor と起動時診断で破棄されたコピーを指摘できます。

## JSON Schema 要件

- **すべての plugin は JSON Schema を含める必要があります**。config を受け付けない場合でも同様です。
- 空の schema でも許可されます（たとえば `{ "type": "object", "additionalProperties": false }`）。
- schema は config の読み書き時に検証され、ランタイム時には検証されません。

## 検証動作

- plugin manifest で channel id が宣言されていない限り、未知の `channels.*` キーは**エラー**です。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny`、`plugins.slots.*` は、**検出可能な** plugin id を参照している必要があります。未知の id は**エラー**です。
- plugin がインストールされていても manifest または schema が壊れているか欠落している場合、検証は失敗し、Doctor が plugin エラーを報告します。
- plugin config が存在していても、その plugin が**無効**になっている場合、config は保持され、Doctor とログで**警告**が表示されます。

完全な `plugins.*` schema については、[Configuration reference](/ja-JP/gateway/configuration) を参照してください。

## 注意

- manifest は、ローカルファイルシステムからのロードを含む**ネイティブ OpenClaw plugin で必須**です。ランタイムは引き続き plugin モジュールを別途ロードします。manifest は検出と検証専用です。
- ネイティブ manifest は JSON5 で解析されるため、最終的な値がオブジェクトである限り、コメント、末尾カンマ、クォートなしキーを使用できます。
- manifest ローダーが読むのは文書化された manifest フィールドだけです。独自のトップレベルキーは避けてください。
- plugin がそれらを必要としない場合、`channels`、`providers`、`cliBackends`、`skills` はすべて省略できます。
- `providerDiscoveryEntry` は軽量に保つ必要があり、広範なランタイムコードを import してはいけません。リクエスト時実行ではなく、静的な provider catalog メタデータや限定的な discovery descriptor に使ってください。
- 排他的な plugin kind は `plugins.slots.*` で選択されます。`kind: "memory"` は `plugins.slots.memory`、`kind: "context-engine"` は `plugins.slots.contextEngine`（デフォルトは `legacy`）です。
- env var メタデータ（`setup.providers[].envVars`、非推奨の `providerAuthEnvVars`、`channelEnvVars`）は宣言的なものにすぎません。status、監査、Cron 配信検証、その他の読み取り専用画面では、env var を設定済みとして扱う前に、引き続き plugin trust と実効 activation ポリシーを適用します。
- プロバイダーコードが必要なランタイム `wizard` メタデータについては、[Provider runtime hooks](/ja-JP/plugins/architecture-internals#provider-runtime-hooks) を参照してください。
- plugin がネイティブモジュールに依存する場合は、ビルド手順と、必要なパッケージマネージャーの許可リスト要件（たとえば pnpm の `allow-build-scripts` と `pnpm rebuild <package>`）を文書化してください。

## 関連

<CardGroup cols={3}>
  <Card title="Building plugins" href="/ja-JP/plugins/building-plugins" icon="rocket">
    plugin のはじめに。
  </Card>
  <Card title="Plugin architecture" href="/ja-JP/plugins/architecture" icon="diagram-project">
    内部アーキテクチャと capability モデル。
  </Card>
  <Card title="SDK overview" href="/ja-JP/plugins/sdk-overview" icon="book">
    Plugin SDK リファレンスと subpath import。
  </Card>
</CardGroup>

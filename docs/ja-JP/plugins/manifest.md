---
read_when:
    - OpenClaw Pluginを作成しています
    - Plugin 設定スキーマを提供する、または Plugin 検証エラーをデバッグする必要がある場合
summary: Plugin マニフェスト + JSON スキーマ要件（厳密な設定検証）
title: Plugin マニフェスト
x-i18n:
    generated_at: "2026-05-02T05:01:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83fb98614783b679d6b49d2237148765708e5c5fc2ee40162d3ddd4752f763c2
    source_path: plugins/manifest.md
    workflow: 16
---

このページは **native OpenClaw Plugin マニフェスト**専用です。

互換バンドルレイアウトについては、[Plugin バンドル](/ja-JP/plugins/bundles)を参照してください。

互換バンドル形式では、別のマニフェストファイルを使用します。

- Codex バンドル: `.codex-plugin/plugin.json`
- Claude バンドル: `.claude-plugin/plugin.json`、またはマニフェストのないデフォルトの Claude コンポーネント
  レイアウト
- Cursor バンドル: `.cursor-plugin/plugin.json`

OpenClaw はこれらのバンドルレイアウトも自動検出しますが、ここで説明する `openclaw.plugin.json` スキーマでは検証されません。

互換バンドルについて、OpenClaw は現在、レイアウトが OpenClaw ランタイムの期待に一致する場合に、バンドルメタデータ、宣言されたスキルルート、Claude コマンドルート、Claude バンドルの `settings.json` デフォルト、Claude バンドルの LSP デフォルト、対応するフックパックを読み取ります。

すべての native OpenClaw Plugin は、**Plugin ルート**に `openclaw.plugin.json` ファイルを含める**必要があります**。OpenClaw はこのマニフェストを使用して、**Plugin コードを実行せずに**設定を検証します。マニフェストが存在しない、または無効な場合は Plugin エラーとして扱われ、設定検証がブロックされます。

Plugin システム全体のガイドを参照してください: [Plugins](/ja-JP/tools/plugin)。
native ケイパビリティモデルと現在の外部互換性ガイダンスについては、次を参照してください:
[ケイパビリティモデル](/ja-JP/plugins/architecture#public-capability-model)。

## このファイルの役割

`openclaw.plugin.json` は、OpenClaw が **Plugin コードを読み込む前に**読み取るメタデータです。以下のすべては、Plugin ランタイムを起動せずに検査できるほど軽量である必要があります。

**用途:**

- Plugin ID、設定検証、設定 UI ヒント
- 認証、オンボーディング、セットアップメタデータ（エイリアス、自動有効化、プロバイダー環境変数、認証選択肢）
- コントロールプレーン画面向けの有効化ヒント
- モデルファミリー所有権の短縮表記
- 静的なケイパビリティ所有権スナップショット（`contracts`）
- 共有 `openclaw qa` ホストが検査できる QA ランナーメタデータ
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

| フィールド                         | 必須     | 型                               | 意味                                                                                                                                                                                                                              |
| ------------------------------------ | -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | はい     | `string`                         | 正規のPlugin id。これは `plugins.entries.<id>` で使用されるidです。                                                                                                                                                               |
| `configSchema`                       | はい     | `object`                         | このPluginの設定用のインラインJSON Schema。                                                                                                                                                                                       |
| `enabledByDefault`                   | いいえ   | `true`                           | バンドル済みPluginをデフォルトで有効としてマークします。省略するか、`true` 以外の値を設定すると、そのPluginはデフォルトで無効のままになります。                                                                                  |
| `legacyPluginIds`                    | いいえ   | `string[]`                       | この正規Plugin idへ正規化されるレガシーid。                                                                                                                                                                                       |
| `autoEnableWhenConfiguredProviders`  | いいえ   | `string[]`                       | auth、設定、またはモデル参照が言及したときに、このPluginを自動有効化するProvider id。                                                                                                                                             |
| `kind`                               | いいえ   | `"memory"` \| `"context-engine"` | `plugins.slots.*` で使用される排他的なPlugin種別を宣言します。                                                                                                                                                                    |
| `channels`                           | いいえ   | `string[]`                       | このPluginが所有するチャネルid。検出と設定検証に使用されます。                                                                                                                                                                    |
| `providers`                          | いいえ   | `string[]`                       | このPluginが所有するProvider id。                                                                                                                                                                                                 |
| `providerDiscoveryEntry`             | いいえ   | `string`                         | Pluginルートからの相対パスで指定する軽量なProvider検出モジュールパス。完全なPluginランタイムを有効化せずに読み込める、マニフェストスコープのProviderカタログメタデータ用です。                                                   |
| `modelSupport`                       | いいえ   | `object`                         | ランタイム前にPluginを自動読み込みするために使用される、マニフェスト所有のモデルファミリーメタデータの短縮表現。                                                                                                                  |
| `modelCatalog`                       | いいえ   | `object`                         | このPluginが所有するProvider向けの宣言的なモデルカタログメタデータ。これは、Pluginランタイムを読み込まずに行う将来の読み取り専用一覧、オンボーディング、モデルピッカー、エイリアス、抑制のためのコントロールプレーン契約です。   |
| `modelPricing`                       | いいえ   | `object`                         | Provider所有の外部料金検索ポリシー。ローカルまたはセルフホストProviderをリモート料金カタログから除外したり、coreにProvider idをハードコードせずにProvider参照をOpenRouter/LiteLLMカタログidへマッピングしたりするために使います。 |
| `modelIdNormalization`               | いいえ   | `object`                         | Providerランタイムが読み込まれる前に実行する必要がある、Provider所有のモデルidエイリアス/プレフィックスのクリーンアップ。                                                                                                        |
| `providerEndpoints`                  | いいえ   | `object[]`                       | Providerランタイムが読み込まれる前にcoreが分類する必要があるProviderルート向けの、マニフェスト所有のエンドポイントhost/baseUrlメタデータ。                                                                                       |
| `providerRequest`                    | いいえ   | `object`                         | Providerランタイムが読み込まれる前に汎用リクエストポリシーで使用される、低コストのProviderファミリーおよびリクエスト互換性メタデータ。                                                                                           |
| `cliBackends`                        | いいえ   | `string[]`                       | このPluginが所有するCLI推論バックエンドid。明示的な設定参照からの起動時自動有効化に使用されます。                                                                                                                                |
| `syntheticAuthRefs`                  | いいえ   | `string[]`                       | ランタイムが読み込まれる前のコールドモデル検出中に、Plugin所有の合成authフックを検査すべきProviderまたはCLIバックエンド参照。                                                                                                    |
| `nonSecretAuthMarkers`               | いいえ   | `string[]`                       | 非シークレットのローカル、OAuth、または環境由来の認証情報状態を表す、バンドル済みPlugin所有のプレースホルダーAPIキー値。                                                                                                         |
| `commandAliases`                     | いいえ   | `object[]`                       | ランタイムが読み込まれる前にPluginを考慮した設定およびCLI診断を生成すべき、このPluginが所有するコマンド名。                                                                                                                      |
| `providerAuthEnvVars`                | いいえ   | `Record<string, string[]>`       | Provider auth/状態検索用の非推奨互換envメタデータ。新しいPluginでは `setup.providers[].envVars` を優先してください。OpenClawは非推奨期間中もこれを読み取ります。                                                                 |
| `providerAuthAliases`                | いいえ   | `Record<string, string>`         | auth検索で別のProvider idを再利用すべきProvider id。たとえば、基盤ProviderのAPIキーとauthプロファイルを共有するコーディングProviderなどです。                                                                                     |
| `channelEnvVars`                     | いいえ   | `Record<string, string[]>`       | OpenClawがPluginコードを読み込まずに検査できる低コストのチャネルenvメタデータ。汎用の起動/設定ヘルパーから見えるべき、env駆動のチャネルセットアップまたはauthサーフェスに使用します。                                            |
| `providerAuthChoices`                | いいえ   | `object[]`                       | オンボーディングピッカー、優先Provider解決、単純なCLIフラグ配線のための低コストのauth選択肢メタデータ。                                                                                                                          |
| `activation`                         | いいえ   | `object`                         | 起動、Provider、コマンド、チャネル、ルート、capabilityトリガーによる読み込みのための低コストの有効化プランナーメタデータ。メタデータのみであり、実際の動作は引き続きPluginランタイムが所有します。                                |
| `setup`                              | いいえ   | `object`                         | 検出およびセットアップサーフェスがPluginランタイムを読み込まずに検査できる、低コストのセットアップ/オンボーディング記述子。                                                                                                      |
| `qaRunners`                          | いいえ   | `object[]`                       | Pluginランタイムが読み込まれる前に共有の `openclaw qa` ホストで使用される、低コストのQAランナー記述子。                                                                                                                          |
| `contracts`                          | いいえ   | `object`                         | 外部authフック、音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像生成、音楽生成、動画生成、web取得、web検索、ツール所有権のための静的なバンドル済みcapabilityスナップショット。                                |
| `mediaUnderstandingProviderMetadata` | いいえ   | `Record<string, object>`         | `contracts.mediaUnderstandingProviders` で宣言されたProvider id向けの、低コストのメディア理解デフォルト。                                                                                                                        |
| `channelConfigs`                     | いいえ   | `Record<string, object>`         | ランタイムが読み込まれる前に検出および検証サーフェスへマージされる、マニフェスト所有のチャネル設定メタデータ。                                                                                                                    |
| `skills`                             | いいえ   | `string[]`                       | Pluginルートからの相対パスで指定する、読み込むSkillディレクトリ。                                                                                                                                                                 |
| `name`                               | いいえ   | `string`                         | 人間が読めるPlugin名。                                                                                                                                                                                                            |
| `description`                        | いいえ   | `string`                         | Pluginサーフェスに表示される短い要約。                                                                                                                                                                                            |
| `version`                            | いいえ   | `string`                         | 情報提供用のPluginバージョン。                                                                                                                                                                                                    |
| `uiHints`                            | いいえ   | `Record<string, object>`         | 設定フィールド向けのUIラベル、プレースホルダー、機密性ヒント。                                                                                                                                                                    |

## providerAuthChoices リファレンス

各 `providerAuthChoices` エントリは、1つのオンボーディングまたはauth選択肢を記述します。
OpenClawはProviderランタイムが読み込まれる前にこれを読み取ります。
Providerセットアップ一覧は、Providerランタイムを読み込まずに、これらのマニフェスト選択肢、記述子由来のセットアップ選択肢、インストールカタログメタデータを使用します。

| フィールド          | 必須     | 型                                              | 意味                                                                                                           |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | はい     | `string`                                        | この選択肢が属するプロバイダー id。                                                                      |
| `method`              | はい     | `string`                                        | ディスパッチ先の認証メソッド id。                                                                           |
| `choiceId`            | はい     | `string`                                        | オンボーディングと CLI フローで使用される安定した認証選択肢 id。                                                  |
| `choiceLabel`         | いいえ   | `string`                                        | ユーザー向けラベル。省略した場合、OpenClaw は `choiceId` にフォールバックします。                                        |
| `choiceHint`          | いいえ   | `string`                                        | ピッカー用の短い補助テキスト。                                                                        |
| `assistantPriority`   | いいえ   | `number`                                        | 値が小さいほど、アシスタント駆動の対話型ピッカーで先に並びます。                                       |
| `assistantVisibility` | いいえ   | `"visible"` \| `"manual-only"`                  | 手動の CLI 選択は許可したまま、アシスタントのピッカーからこの選択肢を非表示にします。                        |
| `deprecatedChoiceIds` | いいえ   | `string[]`                                      | ユーザーをこの置換選択肢へリダイレクトするべきレガシー選択肢 id。                                 |
| `groupId`             | いいえ   | `string`                                        | 関連する選択肢をグループ化するための任意のグループ id。                                                          |
| `groupLabel`          | いいえ   | `string`                                        | そのグループのユーザー向けラベル。                                                                        |
| `groupHint`           | いいえ   | `string`                                        | グループ用の短い補助テキスト。                                                                         |
| `optionKey`           | いいえ   | `string`                                        | 単純な 1 フラグ認証フロー用の内部オプションキー。                                                      |
| `cliFlag`             | いいえ   | `string`                                        | `--openrouter-api-key` などの CLI フラグ名。                                                           |
| `cliOption`           | いいえ   | `string`                                        | `--openrouter-api-key <key>` などの完全な CLI オプション形状。                                             |
| `cliDescription`      | いいえ   | `string`                                        | CLI ヘルプで使用される説明。                                                                            |
| `onboardingScopes`    | いいえ   | `Array<"text-inference" \| "image-generation">` | この選択肢を表示するオンボーディング画面。省略した場合、デフォルトは `["text-inference"]` です。 |

## commandAliases リファレンス

Plugin が、ユーザーが誤って `plugins.allow` に入れたりルート CLI コマンドとして実行しようとしたりする可能性のあるランタイムコマンド名を所有する場合は、`commandAliases` を使用します。OpenClaw は Plugin ランタイムコードをインポートせずに、このメタデータを診断に使用します。

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

| フィールド   | 必須     | 型                | 意味                                                                  |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | はい     | `string`          | この Plugin に属するコマンド名。                               |
| `kind`       | いいえ   | `"runtime-slash"` | ルート CLI コマンドではなく、チャットのスラッシュコマンドとしてエイリアスをマークします。 |
| `cliCommand` | いいえ   | `string`          | CLI 操作用に提案する関連ルート CLI コマンド。存在する場合のみ。  |

## activation リファレンス

Plugin が、どのコントロールプレーンイベントで自分を有効化/読み込み計画に含めるべきかを低コストで宣言できる場合は、`activation` を使用します。

このブロックはプランナーのメタデータであり、ライフサイクル API ではありません。ランタイム動作を登録せず、`register(...)` を置き換えず、Plugin コードがすでに実行済みであることも約束しません。有効化プランナーはこれらのフィールドを使用して候補 Plugin を絞り込み、その後で `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools`、フックなどの既存のマニフェスト所有権メタデータにフォールバックします。

所有権をすでに説明している最も狭いメタデータを優先してください。その関係を表現できる場合は、`providers`、`channels`、`commandAliases`、セットアップ記述子、または `contracts` を使用します。これらの所有権フィールドでは表現できない追加のプランナーヒントに `activation` を使用します。
`claude-cli`、`codex-cli`、`google-gemini-cli` などの CLI ランタイムエイリアスにはトップレベルの `cliBackends` を使用してください。`activation.onAgentHarnesses` は、所有権フィールドをまだ持たない埋め込みエージェントハーネス id 専用です。

このブロックはメタデータのみです。ランタイム動作を登録せず、`register(...)`、`setupEntry`、その他のランタイム/Plugin エントリポイントを置き換えません。現在のコンシューマーは、より広い Plugin 読み込みの前に絞り込みヒントとして使用するため、非スタートアップの有効化メタデータがない場合でも通常は性能面のコストにとどまります。マニフェスト所有権のフォールバックがまだ存在する間は、正しさを変えるべきではありません。

すべての Plugin は `activation.onStartup` を意図的に設定する必要があります。Gateway 起動中に Plugin を実行する必要がある場合のみ `true` に設定します。Plugin が起動時には不活性で、より狭いトリガーからのみ読み込まれるべき場合は `false` に設定します。`onStartup` を省略しても、Plugin は暗黙的に起動時読み込みされなくなりました。起動、チャンネル、設定、エージェントハーネス、メモリ、その他のより狭い有効化トリガーには、明示的な有効化メタデータを使用してください。

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

| フィールド         | 必須     | 型                                                   | 意味                                                                                                                                                                               |
| ------------------ | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | いいえ   | `boolean`                                            | 明示的な Gateway 起動時の有効化。すべての Plugin がこれを設定する必要があります。`true` は起動中に Plugin をインポートします。`false` は別の一致するトリガーで読み込みが必要になるまで、起動時遅延のままにします。 |
| `onProviders`      | いいえ   | `string[]`                                           | 有効化/読み込み計画にこの Plugin を含めるべきプロバイダー id。                                                                                                                      |
| `onAgentHarnesses` | いいえ   | `string[]`                                           | 有効化/読み込み計画にこの Plugin を含めるべき埋め込みエージェントハーネスランタイム id。CLI バックエンドエイリアスにはトップレベルの `cliBackends` を使用してください。                                           |
| `onCommands`       | いいえ   | `string[]`                                           | 有効化/読み込み計画にこの Plugin を含めるべきコマンド id。                                                                                                                       |
| `onChannels`       | いいえ   | `string[]`                                           | 有効化/読み込み計画にこの Plugin を含めるべきチャンネル id。                                                                                                                       |
| `onRoutes`         | いいえ   | `string[]`                                           | 有効化/読み込み計画にこの Plugin を含めるべきルート種別。                                                                                                                       |
| `onConfigPaths`    | いいえ   | `string[]`                                           | パスが存在し、明示的に無効化されていない場合に、起動/読み込み計画にこの Plugin を含めるべきルート相対の設定パス。                                                      |
| `onCapabilities`   | いいえ   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | コントロールプレーンの有効化計画で使用される広い機能ヒント。可能な場合は、より狭いフィールドを優先してください。                                                                                     |

現在のライブコンシューマー:

- Gateway 起動計画は、明示的な起動時インポートに `activation.onStartup` を使用します
- コマンドでトリガーされる CLI 計画は、レガシーの `commandAliases[].cliCommand` または `commandAliases[].name` にフォールバックします
- エージェントランタイム起動計画は、埋め込みハーネスに `activation.onAgentHarnesses` を使用し、CLI ランタイムエイリアスにトップレベルの `cliBackends[]` を使用します
- チャンネルでトリガーされるセットアップ/チャンネル計画は、明示的なチャンネル有効化メタデータがない場合、レガシーの `channels[]` 所有権にフォールバックします
- 起動時 Plugin 計画は、バンドルされたブラウザー Plugin の `browser` ブロックなど、非チャンネルのルート設定画面に `activation.onConfigPaths` を使用します
- プロバイダーでトリガーされるセットアップ/ランタイム計画は、明示的なプロバイダー有効化メタデータがない場合、レガシーの `providers[]` とトップレベルの `cliBackends[]` 所有権にフォールバックします

プランナー診断は、明示的な有効化ヒントとマニフェスト所有権フォールバックを区別できます。たとえば、`activation-command-hint` は `activation.onCommands` が一致したことを意味し、`manifest-command-alias` はプランナーが代わりに `commandAliases` の所有権を使用したことを意味します。これらの理由ラベルはホスト診断とテスト用です。Plugin 作者は、所有権を最もよく説明するメタデータを宣言し続ける必要があります。

## qaRunners リファレンス

Plugin が共有の `openclaw qa` ルートの下に 1 つ以上のトランスポートランナーを提供する場合は、`qaRunners` を使用します。このメタデータは低コストかつ静的に保ってください。実際の CLI 登録は、`qaRunnerCliRegistrations` をエクスポートする軽量な `runtime-api.ts` サーフェスを通じて、引き続き Plugin ランタイムが所有します。

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

| フィールド    | 必須     | 型       | 意味                                                                 |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | はい     | `string` | `openclaw qa` の下にマウントされるサブコマンド。例: `matrix`。    |
| `description` | いいえ   | `string` | 共有ホストがスタブコマンドを必要とする場合に使用されるフォールバックのヘルプテキスト。 |

## setup リファレンス

ランタイムが読み込まれる前に、セットアップとオンボーディング画面が低コストの Plugin 所有メタデータを必要とする場合は、`setup` を使用します。

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

最上位の `cliBackends` は引き続き有効で、CLI 推論バックエンドを記述し続けます。`setup.cliBackends` は、メタデータのみのままにするべき制御プレーン/セットアップフロー向けの、セットアップ専用ディスクリプターサーフェスです。

`setup.providers` と `setup.cliBackends` が存在する場合、これらはセットアップ検出におけるディスクリプター優先の推奨検索サーフェスです。ディスクリプターが候補 Plugin を絞り込むだけで、セットアップ時により豊富なランタイムフックがまだ必要な場合は、`requiresRuntime: true` を設定し、フォールバック実行パスとして `setup-api` を維持します。

OpenClaw は、汎用プロバイダー認証と環境変数検索にも `setup.providers[].envVars` を含めます。`providerAuthEnvVars` は非推奨期間中、互換アダプター経由で引き続きサポートされますが、まだこれを使用している非バンドル Plugin はマニフェスト診断を受け取ります。新しい Plugin は、セットアップ/ステータスの環境メタデータを `setup.providers[].envVars` に置くべきです。

OpenClaw は、セットアップエントリーがない場合、または `setup.requiresRuntime: false` によってセットアップランタイムが不要であると宣言されている場合、`setup.providers[].authMethods` から単純なセットアップ選択肢を導出することもできます。カスタムラベル、CLI フラグ、オンボーディングスコープ、アシスタントメタデータには、明示的な `providerAuthChoices` エントリーが引き続き優先されます。

`requiresRuntime: false` は、それらのディスクリプターがセットアップサーフェスに十分な場合にのみ設定してください。OpenClaw は明示的な `false` をディスクリプターのみの契約として扱い、セットアップ検索のために `setup-api` や `openclaw.setupEntry` を実行しません。ディスクリプターのみの Plugin がそれらのセットアップランタイムエントリーのいずれかをまだ同梱している場合、OpenClaw は追加診断を報告し、それを無視し続けます。`requiresRuntime` を省略した場合は従来のフォールバック動作が維持されるため、フラグなしでディスクリプターを追加した既存の Plugin は壊れません。

セットアップ検索では Plugin 所有の `setup-api` コードを実行できるため、正規化された `setup.providers[].id` と `setup.cliBackends[]` の値は、検出された Plugin 全体で一意のままにする必要があります。所有権が曖昧な場合は、検出順から勝者を選ぶのではなく、安全側に倒して失敗します。

セットアップランタイムが実行される場合、セットアップレジストリ診断は、`setup-api` がマニフェストディスクリプターで宣言されていないプロバイダーや CLI バックエンドを登録した場合、またはディスクリプターに対応するランタイム登録がない場合に、ディスクリプターのずれを報告します。これらの診断は追加的なものであり、従来の Plugin を拒否しません。

### setup.providers リファレンス

| フィールド     | 必須 | 型         | 意味                                                                                             |
| -------------- | ---- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | はい | `string`   | セットアップまたはオンボーディング中に公開されるプロバイダー ID。正規化された ID をグローバルに一意に保ちます。 |
| `authMethods`  | いいえ | `string[]` | 完全なランタイムを読み込まずにこのプロバイダーがサポートするセットアップ/認証メソッド ID。       |
| `envVars`      | いいえ | `string[]` | Plugin ランタイムの読み込み前に、汎用セットアップ/ステータスサーフェスが確認できる環境変数。      |
| `authEvidence` | いいえ | `object[]` | 非シークレットマーカーを通じて認証できるプロバイダー向けの、低コストなローカル認証証拠チェック。 |

`authEvidence` は、ランタイムコードを読み込まずに検証できる、プロバイダー所有のローカル認証情報マーカー向けです。これらのチェックは低コストかつローカルのままにする必要があります。ネットワーク呼び出し、キーチェーンまたはシークレットマネージャーの読み取り、シェルコマンド、プロバイダー API プローブは行いません。

サポートされる証拠エントリー:

| フィールド         | 必須 | 型         | 意味                                                                                                      |
| ------------------ | ---- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `type`             | はい | `string`   | 現在は `local-file-with-env`。                                                                            |
| `fileEnvVar`       | いいえ | `string`   | 明示的な認証情報ファイルパスを含む環境変数。                                                            |
| `fallbackPaths`    | いいえ | `string[]` | `fileEnvVar` がない、または空の場合に確認されるローカル認証情報ファイルパス。`${HOME}` と `${APPDATA}` をサポートします。 |
| `requiresAnyEnv`   | いいえ | `string[]` | 証拠が有効になる前に、列挙された環境変数の少なくとも 1 つが空でない必要があります。                     |
| `requiresAllEnv`   | いいえ | `string[]` | 証拠が有効になる前に、列挙されたすべての環境変数が空でない必要があります。                              |
| `credentialMarker` | はい | `string`   | 証拠が存在する場合に返される非シークレットマーカー。                                                    |
| `source`           | いいえ | `string`   | 認証/ステータス出力向けのユーザー表示用ソースラベル。                                                   |

### setup フィールド

| フィールド         | 必須 | 型         | 意味                                                                                         |
| ------------------ | ---- | ---------- | -------------------------------------------------------------------------------------------- |
| `providers`        | いいえ | `object[]` | セットアップとオンボーディング中に公開されるプロバイダーセットアップディスクリプター。       |
| `cliBackends`      | いいえ | `string[]` | ディスクリプター優先のセットアップ検索に使用される、セットアップ時バックエンド ID。正規化された ID をグローバルに一意に保ちます。 |
| `configMigrations` | いいえ | `string[]` | この Plugin のセットアップサーフェスが所有する設定移行 ID。                                  |
| `requiresRuntime`  | いいえ | `boolean`  | ディスクリプター検索後もセットアップに `setup-api` の実行が必要かどうか。                    |

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

| フィールド    | 型         | 意味                                   |
| ------------- | ---------- | -------------------------------------- |
| `label`       | `string`   | ユーザー表示用フィールドラベル。       |
| `help`        | `string`   | 短いヘルパーテキスト。                 |
| `tags`        | `string[]` | 任意の UI タグ。                       |
| `advanced`    | `boolean`  | フィールドを詳細項目としてマークします。 |
| `sensitive`   | `boolean`  | フィールドをシークレットまたは機密としてマークします。 |
| `placeholder` | `string`   | フォーム入力用のプレースホルダーテキスト。 |

## contracts リファレンス

`contracts` は、OpenClaw が Plugin ランタイムをインポートせずに読み取れる、静的な機能所有権メタデータにのみ使用します。

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

各リストは任意です。

| フィールド                       | 型         | 意味                                                                  |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Codex アプリサーバー拡張ファクトリー ID。現在は `codex-app-server`。 |
| `agentToolResultMiddleware`      | `string[]` | バンドル Plugin がツール結果ミドルウェアを登録できるランタイム ID。  |
| `externalAuthProviders`          | `string[]` | この Plugin が外部認証プロファイルフックを所有するプロバイダー ID。  |
| `speechProviders`                | `string[]` | この Plugin が所有する音声プロバイダー ID。                           |
| `realtimeTranscriptionProviders` | `string[]` | この Plugin が所有するリアルタイム文字起こしプロバイダー ID。         |
| `realtimeVoiceProviders`         | `string[]` | この Plugin が所有するリアルタイム音声プロバイダー ID。               |
| `memoryEmbeddingProviders`       | `string[]` | この Plugin が所有するメモリエンベディングプロバイダー ID。           |
| `mediaUnderstandingProviders`    | `string[]` | この Plugin が所有するメディア理解プロバイダー ID。                   |
| `imageGenerationProviders`       | `string[]` | この Plugin が所有する画像生成プロバイダー ID。                       |
| `videoGenerationProviders`       | `string[]` | この Plugin が所有する動画生成プロバイダー ID。                       |
| `webFetchProviders`              | `string[]` | この Plugin が所有する Web 取得プロバイダー ID。                      |
| `webSearchProviders`             | `string[]` | この Plugin が所有する Web 検索プロバイダー ID。                      |
| `migrationProviders`             | `string[]` | `openclaw migrate` 向けにこの Plugin が所有するインポートプロバイダー ID。 |
| `tools`                          | `string[]` | バンドル契約チェック向けにこの Plugin が所有するエージェントツール名。 |

`contracts.embeddedExtensionFactories` は、バンドルされた Codex アプリサーバー専用拡張ファクトリーのために保持されています。バンドルされたツール結果変換は、代わりに `contracts.agentToolResultMiddleware` を宣言し、`api.registerAgentToolResultMiddleware(...)` で登録するべきです。外部 Plugin はツール結果ミドルウェアを登録できません。この継ぎ目は、モデルが見る前に高信頼のツール出力を書き換えられるためです。

`resolveExternalAuthProfiles` を実装するプロバイダー Plugin は、`contracts.externalAuthProviders` を宣言するべきです。宣言のない Plugin も非推奨の互換フォールバック経由で引き続き実行されますが、そのフォールバックは遅く、移行期間後に削除されます。

バンドルされたメモリエンベディングプロバイダーは、`local` などの組み込みアダプターを含め、公開するすべてのアダプター ID について `contracts.memoryEmbeddingProviders` を宣言するべきです。スタンドアロン CLI パスは、完全な Gateway ランタイムがプロバイダーを登録する前に、所有 Plugin のみを読み込むためにこのマニフェスト契約を使用します。

## mediaUnderstandingProviderMetadata リファレンス

メディア理解プロバイダーに、デフォルトモデル、自動認証フォールバック優先度、またはランタイム読み込み前に汎用コアヘルパーが必要とするネイティブドキュメントサポートがある場合は、`mediaUnderstandingProviderMetadata` を使用します。キーは `contracts.mediaUnderstandingProviders` でも宣言されている必要があります。

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

各プロバイダーエントリーには次を含めることができます。

| フィールド             | 型                                  | 意味                                                                         |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | このプロバイダーが公開するメディア機能。                                     |
| `defaultModels`        | `Record<string, string>`            | config でモデルが指定されていない場合に使われる、機能からモデルへのデフォルト。 |
| `autoPriority`         | `Record<string, number>`            | 認証情報に基づくプロバイダーの自動フォールバックでは、小さい数値ほど先に並びます。 |
| `nativeDocumentInputs` | `"pdf"[]`                           | プロバイダーがサポートするネイティブ文書入力。                               |

## channelConfigs リファレンス

ランタイムが読み込まれる前にチャネル Plugin が軽量な config メタデータを必要とする場合は、`channelConfigs` を使います。読み取り専用のチャネルセットアップ/ステータス検出では、セットアップエントリが利用できない場合、または `setup.requiresRuntime: false` によってセットアップランタイムが不要と宣言されている場合に、構成済みの外部チャネルに対してこのメタデータを直接使用できます。

`channelConfigs` は Plugin マニフェストのメタデータであり、新しいトップレベルのユーザー config セクションではありません。ユーザーは引き続き `channels.<channel-id>` の下でチャネルインスタンスを構成します。OpenClaw は Plugin ランタイムコードが実行される前に、構成済みチャネルをどの Plugin が所有するかを判断するためにマニフェストメタデータを読み取ります。

チャネル Plugin の場合、`configSchema` と `channelConfigs` は異なるパスを表します。

- `configSchema` は `plugins.entries.<plugin-id>.config` を検証します
- `channelConfigs.<channel-id>.schema` は `channels.<channel-id>` を検証します

`channels[]` を宣言する非同梱 Plugin は、一致する `channelConfigs` エントリも宣言する必要があります。これらがなくても OpenClaw は Plugin を読み込めますが、コールドパスの config スキーマ、セットアップ、Control UI サーフェスは、Plugin ランタイムが実行されるまでチャネル所有のオプション形状を知ることができません。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` と `nativeSkillsAutoEnabled` は、チャネルランタイムが読み込まれる前に実行されるコマンド config チェック向けに、静的な `auto` デフォルトを宣言できます。同梱チャネルは、他のパッケージ所有のチャネルカタログメタデータとともに、`package.json#openclaw.channel.commands` を通じて同じデフォルトを公開することもできます。

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

各チャネルエントリには次を含めることができます。

| フィールド    | 型                       | 意味                                                                                 |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | `channels.<id>` の JSON Schema。宣言された各チャネル config エントリで必須です。     |
| `uiHints`     | `Record<string, object>` | そのチャネル config セクション向けの任意の UI ラベル/プレースホルダー/機密ヒント。   |
| `label`       | `string`                 | ランタイムメタデータの準備ができていない場合に、ピッカーや検査サーフェスにマージされるチャネルラベル。 |
| `description` | `string`                 | 検査サーフェスとカタログサーフェス向けの短いチャネル説明。                           |
| `commands`    | `object`                 | ランタイム前の config チェック向けの、静的なネイティブコマンドおよびネイティブ skill の自動デフォルト。 |
| `preferOver`  | `string[]`               | 選択サーフェスでこのチャネルが優先すべき、レガシーまたは低優先度の Plugin ID。       |

### 別のチャネル Plugin を置き換える

別の Plugin も提供できるチャネル ID について、自分の Plugin が優先所有者である場合は `preferOver` を使います。よくあるケースは、Plugin ID の名称変更、同梱 Plugin を置き換えるスタンドアロン Plugin、または config 互換性のために同じチャネル ID を維持するメンテナンス済みフォークです。

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

`channels.chat` が構成されている場合、OpenClaw はチャネル ID と優先 Plugin ID の両方を考慮します。低優先度の Plugin が、同梱されている、またはデフォルトで有効化されているという理由だけで選択されていた場合、OpenClaw は有効なランタイム config 内でそれを無効化し、1 つの Plugin がチャネルとそのツールを所有するようにします。明示的なユーザー選択は引き続き優先されます。ユーザーが両方の Plugin を明示的に有効化している場合、OpenClaw は要求された Plugin セットを黙って変更するのではなく、その選択を保持し、重複したチャネル/ツールの診断を報告します。

`preferOver` は、実際に同じチャネルを提供できる Plugin ID に限定してください。これは汎用的な優先度フィールドではなく、ユーザー config キーの名称を変更するものでもありません。

## modelSupport リファレンス

Plugin ランタイムが読み込まれる前に、OpenClaw が `gpt-5.5` や `claude-sonnet-4.6` のような短縮モデル ID からプロバイダー Plugin を推論する必要がある場合は、`modelSupport` を使います。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw は次の優先順位を適用します。

- 明示的な `provider/model` 参照は、所有元の `providers` マニフェストメタデータを使用します
- `modelPatterns` は `modelPrefixes` より優先されます
- 1 つの非同梱 Plugin と 1 つの同梱 Plugin の両方が一致する場合、非同梱 Plugin が優先されます
- 残りの曖昧さは、ユーザーまたは config がプロバイダーを指定するまで無視されます

フィールド:

| フィールド      | 型         | 意味                                                                 |
| --------------- | ---------- | -------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 短縮モデル ID に対して `startsWith` で照合されるプレフィックス。     |
| `modelPatterns` | `string[]` | プロファイルサフィックスの除去後に短縮モデル ID に対して照合される正規表現ソース。 |

## modelCatalog リファレンス

Plugin ランタイムを読み込む前に OpenClaw がプロバイダーモデルのメタデータを知る必要がある場合は、`modelCatalog` を使います。これは固定カタログ行、プロバイダーエイリアス、抑制ルール、検出モードのマニフェスト所有のソースです。ランタイム更新は引き続きプロバイダーランタイムコードに属しますが、ランタイムが必要なタイミングはマニフェストがコアに伝えます。

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

| フィールド     | 型                                                       | 意味                                                                                                  |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | この Plugin が所有するプロバイダー ID のカタログ行。キーはトップレベルの `providers` にも現れるべきです。 |
| `aliases`      | `Record<string, object>`                                 | カタログまたは抑制計画のために、所有されているプロバイダーへ解決されるべきプロバイダーエイリアス。    |
| `suppressions` | `object[]`                                               | プロバイダー固有の理由で、この Plugin が抑制する別ソース由来のモデル行。                              |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | プロバイダーカタログをマニフェストメタデータから読み取れるか、キャッシュへ更新できるか、またはランタイムが必要か。 |

`aliases` は、モデルカタログ計画のためのプロバイダー所有権ルックアップに参加します。エイリアスのターゲットは、同じ Plugin が所有するトップレベルプロバイダーでなければなりません。プロバイダーでフィルタされたリストがエイリアスを使う場合、OpenClaw は所有元のマニフェストを読み取り、プロバイダーランタイムを読み込まずにエイリアスの API/base URL オーバーライドを適用できます。
エイリアスはフィルタされていないカタログリストを展開しません。広範なリストでは、所有元の正規プロバイダー行のみが出力されます。

`suppressions` は、古いプロバイダーランタイム `suppressBuiltInModel` フックを置き換えます。抑制エントリは、プロバイダーがその Plugin に所有されている場合、または所有されているプロバイダーをターゲットとする `modelCatalog.aliases` キーとして宣言されている場合にのみ尊重されます。ランタイム抑制フックは、モデル解決中にはもう呼び出されません。

プロバイダーフィールド:

| フィールド | 型                       | 意味                                                               |
| ---------- | ------------------------ | ------------------------------------------------------------------ |
| `baseUrl`  | `string`                 | このプロバイダーカタログ内のモデル向けの任意のデフォルトベース URL。 |
| `api`      | `ModelApi`               | このプロバイダーカタログ内のモデル向けの任意のデフォルト API アダプター。 |
| `headers`  | `Record<string, string>` | このプロバイダーカタログに適用される任意の静的ヘッダー。           |
| `models`   | `object[]`               | 必須のモデル行。`id` のない行は無視されます。                      |

モデルフィールド:

| フィールド    | 型                                                             | 意味                                                                        |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | `provider/` プレフィックスなしの、プロバイダー内ローカルなモデル ID。      |
| `name`          | `string`                                                       | 任意の表示名。                                                              |
| `api`           | `ModelApi`                                                     | 任意のモデル別 API オーバーライド。                                         |
| `baseUrl`       | `string`                                                       | 任意のモデル別ベース URL オーバーライド。                                   |
| `headers`       | `Record<string, string>`                                       | 任意のモデル別静的ヘッダー。                                                |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | モデルが受け付けるモダリティ。                                              |
| `reasoning`     | `boolean`                                                      | モデルが推論動作を公開するかどうか。                                        |
| `contextWindow` | `number`                                                       | ネイティブなプロバイダーコンテキストウィンドウ。                            |
| `contextTokens` | `number`                                                       | `contextWindow` と異なる場合の、任意の有効なランタイムコンテキスト上限。    |
| `maxTokens`     | `number`                                                       | 既知の場合の最大出力トークン数。                                            |
| `cost`          | `object`                                                       | 任意の 100 万トークンあたりの USD 価格。任意の `tieredPricing` を含む。     |
| `compat`        | `object`                                                       | OpenClaw モデル設定の互換性に一致する任意の互換性フラグ。                   |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | リスト表示ステータス。行をまったく表示してはならない場合だけ抑制する。      |
| `statusReason`  | `string`                                                       | 利用可能でないステータスとともに表示される任意の理由。                      |
| `replaces`      | `string[]`                                                     | このモデルが置き換える古いプロバイダー内ローカルなモデル ID。               |
| `replacedBy`    | `string`                                                       | 非推奨行の置き換え先となるプロバイダー内ローカルなモデル ID。               |
| `tags`          | `string[]`                                                     | ピッカーとフィルターで使用される安定したタグ。                              |

抑制フィールド:

| フィールド               | 型         | 意味                                                                                                      |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | 抑制する上流行のプロバイダー ID。この Plugin が所有しているか、所有エイリアスとして宣言されている必要がある。 |
| `model`                    | `string`   | 抑制するプロバイダー内ローカルなモデル ID。                                                               |
| `reason`                   | `string`   | 抑制された行が直接要求されたときに表示される任意のメッセージ。                                            |
| `when.baseUrlHosts`        | `string[]` | 抑制を適用する前に必要な、有効なプロバイダーベース URL ホストの任意リスト。                               |
| `when.providerConfigApiIn` | `string[]` | 抑制を適用する前に必要な、完全一致するプロバイダー設定 `api` 値の任意リスト。                             |

ランタイム専用データを `modelCatalog` に入れない。マニフェスト行が、プロバイダーでフィルターされたリストとピッカーのサーフェスでレジストリ/ランタイム検出をスキップできるほど十分に完全な場合だけ、`static` を使う。マニフェスト行がリスト可能なシードまたは補足として有用だが、更新/キャッシュで後から行を追加できる場合は `refreshable` を使う。refreshable 行はそれだけでは権威ではない。OpenClaw が一覧を知るためにプロバイダーランタイムをロードする必要がある場合は `runtime` を使う。

## modelIdNormalization リファレンス

プロバイダーランタイムがロードされる前に必要な、低コストなプロバイダー所有のモデル ID クリーンアップには `modelIdNormalization` を使う。これにより、短いモデル名、プロバイダー内ローカルなレガシー ID、プロキシプレフィックスルールなどのエイリアスを、コアのモデル選択テーブルではなく、所有元 Plugin のマニフェスト内に保持できる。

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

| フィールド                         | 型                      | 意味                                                                                      |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | 大文字小文字を区別しない完全一致のモデル ID エイリアス。値は記述どおりに返される。       |
| `stripPrefixes`                      | `string[]`              | エイリアス検索の前に削除するプレフィックス。レガシーな provider/model 重複に有用。       |
| `prefixWhenBare`                     | `string`                | 正規化されたモデル ID に `/` がまだ含まれていない場合に追加するプレフィックス。           |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | エイリアス検索後の条件付き bare-id プレフィックスルール。`modelPrefix` と `prefix` がキー。 |

## providerEndpoints リファレンス

プロバイダーランタイムがロードされる前に汎用リクエストポリシーが知る必要があるエンドポイント分類には `providerEndpoints` を使う。各 `endpointClass` の意味は引き続きコアが所有し、ホストとベース URL のメタデータは Plugin マニフェストが所有する。

エンドポイントフィールド:

| フィールド                   | 型         | 意味                                                                                         |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | `openrouter`、`moonshot-native`、`google-vertex` などの既知のコアエンドポイントクラス。        |
| `hosts`                        | `string[]` | エンドポイントクラスに対応する正確なホスト名。                                                |
| `hostSuffixes`                 | `string[]` | エンドポイントクラスに対応するホストサフィックス。ドメインサフィックスのみの一致には `.` を付ける。 |
| `baseUrls`                     | `string[]` | エンドポイントクラスに対応する、正規化済みの正確な HTTP(S) ベース URL。                       |
| `googleVertexRegion`           | `string`   | 正確なグローバルホスト用の静的な Google Vertex リージョン。                                   |
| `googleVertexRegionHostSuffix` | `string`   | 一致するホストから取り除き、Google Vertex リージョンプレフィックスを公開するためのサフィックス。 |

## providerRequest リファレンス

プロバイダーランタイムをロードせずに汎用リクエストポリシーが必要とする、低コストなリクエスト互換性メタデータには `providerRequest` を使う。動作固有のペイロード書き換えは、プロバイダーランタイムフックまたは共有プロバイダーファミリーヘルパーに保持する。

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

プロバイダーフィールド:

| フィールド          | 型           | 意味                                                                                  |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | 汎用リクエスト互換性の判断と診断で使用されるプロバイダーファミリーラベル。             |
| `compatibilityFamily` | `"moonshot"` | 共有リクエストヘルパー向けの任意のプロバイダーファミリー互換性バケット。               |
| `openAICompletions`   | `object`     | OpenAI 互換補完リクエストフラグ。現在は `supportsStreamingUsage`。                     |

## modelPricing リファレンス

ランタイムがロードされる前にプロバイダーがコントロールプレーンの価格動作を制御する必要がある場合は `modelPricing` を使う。Gateway の価格キャッシュは、プロバイダーランタイムコードをインポートせずにこのメタデータを読み取る。

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

| フィールド | 型                 | 意味                                                                                              |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | OpenRouter または LiteLLM の価格を決して取得すべきでない、ローカル/セルフホストのプロバイダーでは `false` に設定する。 |
| `openRouter` | `false \| object` | OpenRouter の価格検索マッピング。`false` はこのプロバイダーの OpenRouter 検索を無効にする。       |
| `liteLLM`    | `false \| object` | LiteLLM の価格検索マッピング。`false` はこのプロバイダーの LiteLLM 検索を無効にする。             |

ソースフィールド:

| フィールド               | 型                 | 意味                                                                                                             |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | OpenClaw のプロバイダー ID と異なる場合の外部カタログプロバイダー ID。たとえば `zai` プロバイダーに対する `z-ai`。 |
| `passthroughProviderModel` | `boolean`          | スラッシュを含むモデル ID をネストされた provider/model 参照として扱う。OpenRouter などのプロキシプロバイダーに有用。 |
| `modelIdTransforms`        | `"version-dots"[]` | 追加の外部カタログモデル ID バリアント。`version-dots` は `claude-opus-4.6` のようなドット付きバージョン ID を試す。 |

### OpenClaw Provider Index

OpenClaw Provider Index は、まだ Plugin がインストールされていない可能性があるプロバイダー向けの、OpenClaw 所有のプレビューメタデータ。これは Plugin マニフェストの一部ではない。Plugin マニフェストは引き続き、インストール済み Plugin の権威である。Provider Index は、プロバイダー Plugin がインストールされていないときに、将来のインストール可能プロバイダーとインストール前のモデルピッカーサーフェスが利用する内部フォールバック契約である。

カタログ権威の順序:

1. ユーザー設定。
2. インストール済み Plugin マニフェストの `modelCatalog`。
3. 明示的な更新によるモデルカタログキャッシュ。
4. OpenClaw Provider Index のプレビュー行。

プロバイダーインデックスには、シークレット、有効化状態、ランタイムフック、または
ライブのアカウント固有モデルデータを含めてはなりません。そのプレビューカタログは、Plugin マニフェストと同じ
`modelCatalog` プロバイダー行の形状を使用しますが、`api`、
`baseUrl`、価格、互換性フラグなどのランタイムアダプターフィールドを、インストール済み Plugin マニフェストと意図的に同期させておく場合を除き、
安定した表示メタデータに限定する必要があります。ライブの `/models` ディスカバリを持つプロバイダーは、
通常の一覧表示やオンボーディング呼び出しでプロバイダー API を呼ぶのではなく、
明示的なモデルカタログキャッシュパスを通じて更新済みの行を書き込む必要があります。

プロバイダーインデックスのエントリーは、Plugin がコアから移動した、またはまだインストールされていないプロバイダー向けに、
インストール可能 Plugin メタデータを持つこともできます。この
メタデータはチャネルカタログのパターンを反映します。パッケージ名、npm インストール指定、
期待される整合性、低コストな認証選択ラベルがあれば、
インストール可能なセットアップオプションを表示するには十分です。Plugin がインストールされると、
そのマニフェストが優先され、そのプロバイダーについてプロバイダーインデックスのエントリーは無視されます。

従来のトップレベルのケイパビリティキーは非推奨です。`openclaw doctor --fix` を使用して、
`speechProviders`、`realtimeTranscriptionProviders`、
`realtimeVoiceProviders`、`mediaUnderstandingProviders`、
`imageGenerationProviders`、`videoGenerationProviders`、
`webFetchProviders`、および `webSearchProviders` を `contracts` の下へ
移動してください。通常のマニフェスト読み込みでは、これらのトップレベルフィールドをケイパビリティ
所有権として扱わなくなりました。

## マニフェストと package.json

この 2 つのファイルは異なる役割を担います。

| ファイル               | 用途                                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Plugin コードが実行される前に存在している必要があるディスカバリ、設定検証、認証選択メタデータ、UI ヒント                         |
| `package.json`         | npm メタデータ、依存関係のインストール、およびエントリーポイント、インストールゲート、セットアップ、カタログメタデータに使われる `openclaw` ブロック |

メタデータの置き場所が不明な場合は、次のルールを使用してください。

- OpenClaw が Plugin コードを読み込む前にそれを知る必要がある場合は、`openclaw.plugin.json` に置く
- パッケージ化、エントリーファイル、または npm インストール動作に関するものなら、`package.json` に置く

### ディスカバリに影響する package.json フィールド

一部のランタイム前 Plugin メタデータは、意図的に `openclaw.plugin.json` ではなく、
`package.json` の `openclaw` ブロック内に置かれます。

重要な例:

| フィールド                                                        | 意味                                                                                                                                                                                 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | ネイティブ Plugin エントリーポイントを宣言します。Plugin パッケージディレクトリ内に留まる必要があります。                                                                           |
| `openclaw.runtimeExtensions`                                      | インストール済みパッケージのビルド済み JavaScript ランタイムエントリーポイントを宣言します。Plugin パッケージディレクトリ内に留まる必要があります。                               |
| `openclaw.setupEntry`                                             | オンボーディング、遅延チャネル起動、読み取り専用チャネルステータス/SecretRef ディスカバリ中に使用される軽量なセットアップ専用エントリーポイントです。Plugin パッケージディレクトリ内に留まる必要があります。 |
| `openclaw.runtimeSetupEntry`                                      | インストール済みパッケージのビルド済み JavaScript セットアップエントリーポイントを宣言します。`setupEntry` が必要で、存在している必要があり、Plugin パッケージディレクトリ内に留まる必要があります。 |
| `openclaw.channel`                                                | ラベル、ドキュメントパス、エイリアス、選択文言などの低コストなチャネルカタログメタデータです。                                                                                     |
| `openclaw.channel.commands`                                       | チャネルランタイムの読み込み前に、設定、監査、コマンド一覧画面で使用される静的なネイティブコマンドおよびネイティブ Skill 自動デフォルトメタデータです。                              |
| `openclaw.channel.configuredState`                                | フルチャネルランタイムを読み込まずに「env のみのセットアップはすでに存在するか?」に答えられる軽量な設定済み状態チェッカーメタデータです。                                            |
| `openclaw.channel.persistedAuthState`                             | フルチャネルランタイムを読み込まずに「何かがすでにサインイン済みか?」に答えられる軽量な永続化認証チェッカーメタデータです。                                                          |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | バンドル済みおよび外部公開 Plugin のインストール/更新ヒントです。                                                                                                                    |
| `openclaw.install.defaultChoice`                                  | 複数のインストール元が利用可能な場合の優先インストールパスです。                                                                                                                    |
| `openclaw.install.minHostVersion`                                 | `>=2026.3.22` や `>=2026.5.1-beta.1` のような semver の下限を使った、サポートされる最小 OpenClaw ホストバージョンです。                                                             |
| `openclaw.install.expectedIntegrity`                              | `sha512-...` などの期待される npm dist 整合性文字列です。インストールおよび更新フローは、取得したアーティファクトをこれと照合します。                                               |
| `openclaw.install.allowInvalidConfigRecovery`                     | 設定が無効な場合に、狭い範囲のバンドル済み Plugin 再インストール復旧パスを許可します。                                                                                              |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 起動時にフルチャネル Plugin より前にセットアップ専用チャネル画面を読み込めるようにします。                                                                                          |

マニフェストメタデータは、ランタイム読み込み前にオンボーディングに表示される
プロバイダー/チャネル/セットアップ選択肢を決定します。`package.json#openclaw.install` は、
ユーザーがそれらの選択肢の 1 つを選んだときに、その Plugin を取得または有効化する方法を
オンボーディングに伝えます。インストールヒントを `openclaw.plugin.json` に移動しないでください。

`openclaw.install.minHostVersion` は、非バンドル Plugin ソースのインストール時とマニフェスト
レジストリ読み込み時に強制されます。無効な値は拒否されます。
新しいが有効な値は、古いホスト上の外部 Plugin をスキップします。バンドル済みソース
Plugin は、ホストチェックアウトと同じバージョン体系であると見なされます。

npm の厳密なバージョン固定は、たとえば
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"` のように、すでに `npmSpec` にあります。公式の外部カタログ
エントリーでは、厳密な指定を `expectedIntegrity` と組み合わせ、取得された npm アーティファクトが固定リリースと一致しなくなった場合に
更新フローが閉じた形で失敗するようにする必要があります。
互換性のため、対話型オンボーディングは、裸の
パッケージ名や dist-tag を含む、信頼されたレジストリの npm 指定を引き続き提示します。カタログ診断は、
厳密、浮動、整合性固定、整合性欠落、パッケージ名
不一致、無効なデフォルト選択ソースを区別できます。また、
`expectedIntegrity` が存在するものの、それを固定できる有効な npm ソースがない場合にも警告します。
`expectedIntegrity` が存在する場合、
インストール/更新フローはそれを強制します。省略された場合、レジストリ解決は
整合性固定なしで記録されます。

ステータス、チャネル一覧、または SecretRef スキャンで、フル
ランタイムを読み込まずに設定済みアカウントを識別する必要がある場合、チャネル Plugin は `openclaw.setupEntry` を提供する必要があります。
セットアップエントリーは、チャネルメタデータに加えて、セットアップ安全な設定、
ステータス、シークレットアダプターを公開する必要があります。ネットワーククライアント、Gateway リスナー、
トランスポートランタイムはメイン拡張エントリーポイントに置いてください。

ランタイムエントリーポイントフィールドは、ソース
エントリーポイントフィールドに対するパッケージ境界チェックを上書きしません。たとえば、`openclaw.runtimeExtensions` によって、
外へ抜ける `openclaw.extensions` パスを読み込み可能にすることはできません。

`openclaw.install.allowInvalidConfigRecovery` は意図的に狭い範囲です。これは
任意の壊れた設定をインストール可能にするものではありません。現在は、欠落したバンドル済み Plugin パスや、
同じバンドル済み Plugin に対する古い `channels.<id>` エントリーなど、
特定の古いバンドル済み Plugin アップグレード失敗からインストール
フローが復旧することだけを許可します。無関係な設定エラーは引き続きインストールをブロックし、オペレーターを
`openclaw doctor --fix` に誘導します。

`openclaw.channel.persistedAuthState` は、小さなチェッカー
モジュール用のパッケージメタデータです。

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

セットアップ、doctor、ステータス、または読み取り専用プレゼンスフローで、フルチャネル Plugin が読み込まれる前に低コストな
はい/いいえの認証プローブが必要な場合に使用します。永続化認証状態は
設定済みチャネル状態ではありません。このメタデータを使用して Plugin を自動有効化したり、
ランタイム依存関係を修復したり、チャネルランタイムを読み込むべきかどうかを判断したりしないでください。
対象のエクスポートは、永続化状態だけを読み取る小さな関数である必要があります。
フルチャネルランタイムのバレルを経由させないでください。

`openclaw.channel.configuredState` は、低コストな env のみの
設定済みチェックについて同じ形に従います。

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

チャネルが env やその他の小さな
非ランタイム入力から設定済み状態に答えられる場合に使用します。チェックにフル設定解決または実際の
チャネルランタイムが必要な場合は、そのロジックを Plugin の `config.hasConfiguredState`
フックに置いてください。

## ディスカバリの優先順位（重複する Plugin ID）

OpenClaw は複数のルート（バンドル済み、グローバルインストール、ワークスペース、明示的な設定選択パス）から Plugin を発見します。2 つのディスカバリが同じ `id` を共有する場合、**最も優先順位の高い**マニフェストだけが保持されます。優先順位の低い重複は、隣に読み込まれるのではなく破棄されます。

優先順位は高い順に次のとおりです。

1. **設定選択** — `plugins.entries.<id>` で明示的に固定されたパス
2. **バンドル済み** — OpenClaw に同梱される Plugin
3. **グローバルインストール** — グローバル OpenClaw Plugin ルートにインストールされた Plugin
4. **ワークスペース** — 現在のワークスペースからの相対で発見された Plugin

影響:

- ワークスペース内にある、フォークされたまたは古いバンドル済み Plugin のコピーは、バンドル済みビルドを隠しません。
- ローカルの Plugin でバンドル済み Plugin を実際に上書きするには、ワークスペースディスカバリに頼るのではなく、`plugins.entries.<id>` で固定して、優先順位で勝つようにしてください。
- 重複の破棄はログに記録されるため、Doctor と起動診断は破棄されたコピーを指摘できます。

## JSON Schema 要件

- **すべての Plugin は JSON Schema を同梱する必要があります**。設定を受け付けない場合も同様です。
- 空のスキーマは許容されます（例: `{ "type": "object", "additionalProperties": false }`）。
- スキーマはランタイムではなく、設定の読み取り/書き込み時に検証されます。

## 検証動作

- 不明な `channels.*` キーは、チャネル id が Plugin マニフェストで宣言されていない限り、**エラー**です。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny`、および `plugins.slots.*`
  は、**検出可能な** Plugin id を参照する必要があります。不明な id は**エラー**です。
- Plugin がインストールされていても、マニフェストまたはスキーマが壊れているか欠落している場合、
  検証は失敗し、Doctor が Plugin エラーを報告します。
- Plugin 設定が存在していても Plugin が**無効**な場合、その設定は保持され、
  Doctor + ログに**警告**が表示されます。

完全な `plugins.*` スキーマについては、[設定リファレンス](/ja-JP/gateway/configuration)を参照してください。

## 注記

- マニフェストは、ローカルファイルシステムからの読み込みを含め、**ネイティブ OpenClaw Plugin では必須**です。ランタイムは引き続き Plugin モジュールを別途読み込みます。マニフェストは検出 + 検証専用です。
- ネイティブマニフェストは JSON5 で解析されるため、最終的な値がオブジェクトである限り、コメント、末尾のカンマ、引用符なしのキーを使用できます。
- マニフェストローダーが読み取るのは、文書化されたマニフェストフィールドのみです。カスタムのトップレベルキーは避けてください。
- Plugin が必要としない場合、`channels`、`providers`、`cliBackends`、`skills` はすべて省略できます。
- `providerDiscoveryEntry` は軽量に保つ必要があり、広範なランタイムコードをインポートすべきではありません。リクエスト時の実行ではなく、静的なプロバイダーカタログメタデータや範囲を絞った検出記述子に使用してください。
- 排他的な Plugin 種別は `plugins.slots.*` で選択します。`plugins.slots.memory` 経由の `kind: "memory"`、`plugins.slots.contextEngine` 経由の `kind: "context-engine"`（デフォルトは `legacy`）です。
- 排他的な Plugin 種別はこのマニフェストで宣言してください。ランタイムエントリの `OpenClawPluginDefinition.kind` は非推奨で、古い Plugin 向けの互換性フォールバックとしてのみ残っています。
- 環境変数メタデータ（`setup.providers[].envVars`、非推奨の `providerAuthEnvVars`、および `channelEnvVars`）は宣言専用です。ステータス、監査、cron 配信検証、その他の読み取り専用サーフェスは、環境変数を設定済みとして扱う前に、引き続き Plugin の信頼性と有効なアクティベーションポリシーを適用します。
- プロバイダーコードを必要とするランタイム ウィザードメタデータについては、[プロバイダーランタイムフック](/ja-JP/plugins/architecture-internals#provider-runtime-hooks)を参照してください。
- Plugin がネイティブモジュールに依存する場合は、ビルド手順とパッケージマネージャーの allowlist 要件（例: pnpm `allow-build-scripts` + `pnpm rebuild <package>`）を文書化してください。

## 関連

<CardGroup cols={3}>
  <Card title="Plugin の構築" href="/ja-JP/plugins/building-plugins" icon="rocket">
    Plugin のはじめに。
  </Card>
  <Card title="Plugin アーキテクチャ" href="/ja-JP/plugins/architecture" icon="diagram-project">
    内部アーキテクチャと機能モデル。
  </Card>
  <Card title="SDK 概要" href="/ja-JP/plugins/sdk-overview" icon="book">
    Plugin SDK リファレンスとサブパスインポート。
  </Card>
</CardGroup>

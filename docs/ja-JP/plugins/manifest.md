---
read_when:
    - OpenClaw Pluginを構築しています
    - Plugin 設定スキーマを提供するか、Plugin 検証エラーをデバッグする必要がある
summary: Plugin マニフェスト + JSON スキーマ要件（厳格な設定検証）
title: Plugin マニフェスト
x-i18n:
    generated_at: "2026-04-30T05:25:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: e71bc192e10504b59dbf587138cfeb3d53ef31e7cbe35d6a8f0672960d318e2d
    source_path: plugins/manifest.md
    workflow: 16
---

このページは **ネイティブ OpenClaw Plugin マニフェスト**専用です。

互換バンドルレイアウトについては、[Plugin バンドル](/ja-JP/plugins/bundles)を参照してください。

互換バンドル形式では、異なるマニフェストファイルを使用します。

- Codex バンドル: `.codex-plugin/plugin.json`
- Claude バンドル: `.claude-plugin/plugin.json`、またはマニフェストなしのデフォルト Claude コンポーネント
  レイアウト
- Cursor バンドル: `.cursor-plugin/plugin.json`

OpenClaw はこれらのバンドルレイアウトも自動検出しますが、ここで説明する `openclaw.plugin.json` スキーマに対する検証は行いません。

互換バンドルでは、レイアウトが OpenClaw ランタイムの期待に一致する場合、OpenClaw は現在、バンドルメタデータに加えて、宣言されたスキルルート、Claude コマンドルート、Claude バンドルの `settings.json` デフォルト、Claude バンドルの LSP デフォルト、サポートされるフックパックを読み取ります。

すべてのネイティブ OpenClaw Plugin は、**Plugin ルート**に `openclaw.plugin.json` ファイルを同梱する必要があります。OpenClaw はこのマニフェストを使用して、**Plugin コードを実行せずに**設定を検証します。マニフェストがない、または無効な場合は Plugin エラーとして扱われ、設定の検証をブロックします。

Plugin システム全体のガイドを参照してください: [Plugins](/ja-JP/tools/plugin)。
ネイティブ機能モデルと現在の外部互換性ガイダンスについては、次を参照してください:
[機能モデル](/ja-JP/plugins/architecture#public-capability-model)。

## このファイルの役割

`openclaw.plugin.json` は、OpenClaw が **Plugin コードを読み込む前に**読み取るメタデータです。以下のすべては、Plugin ランタイムを起動せずに調査できる程度に低コストである必要があります。

**用途:**

- Plugin の識別、設定の検証、設定 UI ヒント
- 認証、オンボーディング、セットアップメタデータ（エイリアス、自動有効化、プロバイダー環境変数、認証選択肢）
- コントロールプレーン画面向けのアクティベーションヒント
- モデルファミリー所有権の短縮表記
- 静的な機能所有権スナップショット（`contracts`）
- 共有 `openclaw qa` ホストが調査できる QA ランナーメタデータ
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

## トップレベルフィールドのリファレンス

| フィールド                           | 必須     | 型                               | 意味                                                                                                                                                                                                                              |
| ------------------------------------ | -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | はい     | `string`                         | 正規 Plugin ID。これは `plugins.entries.<id>` で使われる ID です。                                                                                                                                                               |
| `configSchema`                       | はい     | `object`                         | この Plugin の設定用インライン JSON Schema。                                                                                                                                                                                     |
| `enabledByDefault`                   | いいえ   | `true`                           | バンドル Plugin をデフォルトで有効としてマークします。省略するか、`true` 以外の値を設定すると、その Plugin はデフォルトで無効のままになります。                                                                                  |
| `legacyPluginIds`                    | いいえ   | `string[]`                       | この正規 Plugin ID に正規化されるレガシー ID。                                                                                                                                                                                   |
| `autoEnableWhenConfiguredProviders`  | いいえ   | `string[]`                       | 認証、設定、またはモデル参照で言及されたときに、この Plugin を自動有効化するプロバイダー ID。                                                                                                                                    |
| `kind`                               | いいえ   | `"memory"` \| `"context-engine"` | `plugins.slots.*` で使われる排他的な Plugin 種別を宣言します。                                                                                                                                                                   |
| `channels`                           | いいえ   | `string[]`                       | この Plugin が所有するチャネル ID。検出と設定検証に使われます。                                                                                                                                                                  |
| `providers`                          | いいえ   | `string[]`                       | この Plugin が所有するプロバイダー ID。                                                                                                                                                                                          |
| `providerDiscoveryEntry`             | いいえ   | `string`                         | Plugin ルートからの相対パスで指定する軽量なプロバイダー検出モジュールパス。完全な Plugin ランタイムを有効化せずに読み込める、マニフェストスコープのプロバイダーカタログメタデータ用です。                                      |
| `modelSupport`                       | いいえ   | `object`                         | ランタイム前に Plugin を自動読み込みするために使われる、マニフェスト所有の簡略モデルファミリーメタデータ。                                                                                                                       |
| `modelCatalog`                       | いいえ   | `object`                         | この Plugin が所有するプロバイダー用の宣言的なモデルカタログメタデータ。Plugin ランタイムを読み込まずに、将来の読み取り専用一覧表示、オンボーディング、モデルピッカー、エイリアス、抑制を行うためのコントロールプレーン契約です。 |
| `modelPricing`                       | いいえ   | `object`                         | プロバイダー所有の外部料金検索ポリシー。ローカルまたはセルフホストのプロバイダーをリモート料金カタログから除外したり、コアにプロバイダー ID をハードコードせずにプロバイダー参照を OpenRouter/LiteLLM カタログ ID にマップしたりするために使います。 |
| `modelIdNormalization`               | いいえ   | `object`                         | プロバイダーランタイムの読み込み前に実行する必要がある、プロバイダー所有のモデル ID エイリアス/プレフィックス整理。                                                                                                             |
| `providerEndpoints`                  | いいえ   | `object[]`                       | プロバイダーランタイムの読み込み前にコアが分類する必要があるプロバイダールート用の、マニフェスト所有のエンドポイント host/baseUrl メタデータ。                                                                                  |
| `providerRequest`                    | いいえ   | `object`                         | プロバイダーランタイムの読み込み前に、汎用リクエストポリシーで使われる低コストなプロバイダーファミリーおよびリクエスト互換性メタデータ。                                                                                        |
| `cliBackends`                        | いいえ   | `string[]`                       | この Plugin が所有する CLI 推論バックエンド ID。明示的な設定参照からの起動時自動有効化に使われます。                                                                                                                            |
| `syntheticAuthRefs`                  | いいえ   | `string[]`                       | ランタイム読み込み前のコールドモデル検出中に、Plugin 所有の合成認証フックをプローブする必要があるプロバイダーまたは CLI バックエンド参照。                                                                                      |
| `nonSecretAuthMarkers`               | いいえ   | `string[]`                       | 非シークレットのローカル、OAuth、または環境由来の資格情報状態を表す、バンドル Plugin 所有のプレースホルダー API キー値。                                                                                                        |
| `commandAliases`                     | いいえ   | `object[]`                       | ランタイム読み込み前に、Plugin を意識した設定および CLI 診断を生成する必要がある、この Plugin が所有するコマンド名。                                                                                                            |
| `providerAuthEnvVars`                | いいえ   | `Record<string, string[]>`       | プロバイダー認証/ステータス検索用の非推奨互換 env メタデータ。新しい Plugin では `setup.providers[].envVars` を優先してください。OpenClaw は非推奨期間中もこれを読み取ります。                                                |
| `providerAuthAliases`                | いいえ   | `Record<string, string>`         | 認証検索で別のプロバイダー ID を再利用する必要があるプロバイダー ID。たとえば、ベースプロバイダーの API キーと認証プロファイルを共有するコーディングプロバイダーなどです。                                                      |
| `channelEnvVars`                     | いいえ   | `Record<string, string[]>`       | OpenClaw が Plugin コードを読み込まずに検査できる低コストなチャネル env メタデータ。汎用の起動/設定ヘルパーから見える必要がある、env 駆動のチャネルセットアップや認証サーフェスに使います。                                     |
| `providerAuthChoices`                | いいえ   | `object[]`                       | オンボーディングピッカー、優先プロバイダー解決、単純な CLI フラグ配線のための低コストな認証選択肢メタデータ。                                                                                                                   |
| `activation`                         | いいえ   | `object`                         | 起動、プロバイダー、コマンド、チャネル、ルート、機能トリガーの読み込み用の低コストな有効化プランナーメタデータ。メタデータのみであり、実際の動作は引き続き Plugin ランタイムが所有します。                                      |
| `setup`                              | いいえ   | `object`                         | 検出およびセットアップサーフェスが Plugin ランタイムを読み込まずに検査できる、低コストなセットアップ/オンボーディング記述子。                                                                                                   |
| `qaRunners`                          | いいえ   | `object[]`                       | Plugin ランタイムの読み込み前に、共有 `openclaw qa` ホストで使われる低コストな QA ランナー記述子。                                                                                                                              |
| `contracts`                          | いいえ   | `object`                         | 外部認証フック、音声、リアルタイム文字起こし、リアルタイム音声、メディア理解、画像生成、音楽生成、動画生成、Web 取得、Web 検索、ツール所有権に関する静的なバンドル機能スナップショット。                                     |
| `mediaUnderstandingProviderMetadata` | いいえ   | `Record<string, object>`         | `contracts.mediaUnderstandingProviders` で宣言されたプロバイダー ID 用の低コストなメディア理解デフォルト。                                                                                                                       |
| `channelConfigs`                     | いいえ   | `Record<string, object>`         | ランタイム読み込み前に検出および検証サーフェスへマージされる、マニフェスト所有のチャネル設定メタデータ。                                                                                                                        |
| `skills`                             | いいえ   | `string[]`                       | Plugin ルートからの相対パスで指定する、読み込む Skill ディレクトリ。                                                                                                                                                             |
| `name`                               | いいえ   | `string`                         | 人が読める Plugin 名。                                                                                                                                                                                                           |
| `description`                        | いいえ   | `string`                         | Plugin サーフェスに表示される短い概要。                                                                                                                                                                                          |
| `version`                            | いいえ   | `string`                         | 情報提供用の Plugin バージョン。                                                                                                                                                                                                 |
| `uiHints`                            | いいえ   | `Record<string, object>`         | 設定フィールド用の UI ラベル、プレースホルダー、機密性ヒント。                                                                                                                                                                  |

## providerAuthChoices リファレンス

各 `providerAuthChoices` エントリは、1 つのオンボーディングまたは認証の選択肢を記述します。
OpenClaw はプロバイダーランタイムを読み込む前にこれを読み取ります。
プロバイダーセットアップ一覧は、プロバイダーランタイムを読み込まずに、これらのマニフェスト選択肢、記述子から派生したセットアップ
選択肢、インストールカタログメタデータを使用します。

| フィールド                 | 必須 | 型                                            | 意味                                                                                            |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | はい      | `string`                                        | この選択が属するプロバイダー ID。                                                                      |
| `method`              | はい      | `string`                                        | ディスパッチ先の認証メソッド ID。                                                                           |
| `choiceId`            | はい      | `string`                                        | オンボーディングと CLI フローで使われる安定した認証選択 ID。                                                  |
| `choiceLabel`         | いいえ       | `string`                                        | ユーザー向けラベル。省略した場合、OpenClaw は `choiceId` にフォールバックします。                                        |
| `choiceHint`          | いいえ       | `string`                                        | ピッカー用の短い補助テキスト。                                                                        |
| `assistantPriority`   | いいえ       | `number`                                        | 値が小さいほど、アシスタント駆動の対話型ピッカーで早く並びます。                                       |
| `assistantVisibility` | いいえ       | `"visible"` \| `"manual-only"`                  | 手動 CLI 選択は許可したまま、アシスタントピッカーからこの選択を隠します。                        |
| `deprecatedChoiceIds` | いいえ       | `string[]`                                      | ユーザーをこの置き換え選択へリダイレクトする必要があるレガシー選択 ID。                                 |
| `groupId`             | いいえ       | `string`                                        | 関連する選択をグループ化するための任意のグループ ID。                                                          |
| `groupLabel`          | いいえ       | `string`                                        | そのグループのユーザー向けラベル。                                                                        |
| `groupHint`           | いいえ       | `string`                                        | グループ用の短い補助テキスト。                                                                         |
| `optionKey`           | いいえ       | `string`                                        | 単純な 1 フラグ認証フロー用の内部オプションキー。                                                      |
| `cliFlag`             | いいえ       | `string`                                        | `--openrouter-api-key` などの CLI フラグ名。                                                           |
| `cliOption`           | いいえ       | `string`                                        | `--openrouter-api-key <key>` などの完全な CLI オプション形式。                                             |
| `cliDescription`      | いいえ       | `string`                                        | CLI ヘルプで使われる説明。                                                                            |
| `onboardingScopes`    | いいえ       | `Array<"text-inference" \| "image-generation">` | この選択をどのオンボーディング画面に表示するか。省略した場合、デフォルトは `["text-inference"]` です。 |

## commandAliases リファレンス

Plugin が、ユーザーが誤って `plugins.allow` に入れたりルート CLI コマンドとして実行しようとしたりする可能性のあるランタイムコマンド名を所有している場合は、`commandAliases` を使います。OpenClaw は Plugin ランタイムコードをインポートせずに、このメタデータを診断に使います。

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
| `kind`       | いいえ       | `"runtime-slash"` | ルート CLI コマンドではなく、チャットのスラッシュコマンドとしてエイリアスをマークします。 |
| `cliCommand` | いいえ       | `string`          | 存在する場合、CLI 操作用に提案する関連ルート CLI コマンド。  |

## activation リファレンス

Plugin が、どのコントロールプレーンイベントで自身をアクティベーション/ロード計画に含めるべきかを低コストで宣言できる場合は、`activation` を使います。

このブロックはプランナーのメタデータであり、ライフサイクル API ではありません。ランタイム動作を登録せず、`register(...)` を置き換えず、Plugin コードがすでに実行済みであることも約束しません。アクティベーションプランナーは、既存のマニフェスト所有権メタデータ（`providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools`、フックなど）へフォールバックする前に、候補 Plugin を絞り込むためにこれらのフィールドを使います。

所有権をすでに説明している最も狭いメタデータを優先してください。関係性を表すフィールドがある場合は、`providers`、`channels`、`commandAliases`、セットアップ記述子、または `contracts` を使います。これらの所有権フィールドでは表現できない追加のプランナーヒントには `activation` を使います。
`claude-cli`、`codex-cli`、`google-gemini-cli` などの CLI ランタイムエイリアスには、トップレベルの `cliBackends` を使います。`activation.onAgentHarnesses` は、所有権フィールドをまだ持たない埋め込みエージェントハーネス ID 専用です。

このブロックはメタデータのみです。ランタイム動作を登録せず、`register(...)`、`setupEntry`、その他のランタイム/Plugin エントリポイントを置き換えません。現在のコンシューマーは、より広範な Plugin ロードの前に絞り込みヒントとしてこれを使うため、アクティベーションメタデータが欠けていても通常はパフォーマンスに影響するだけです。レガシーのマニフェスト所有権フォールバックがまだ存在する間は、正しさを変えるべきではありません。

OpenClaw が暗黙的な起動時インポートから移行しているため、すべての Plugin は `activation.onStartup` を意図的に設定する必要があります。Plugin が Gateway 起動中に実行されなければならない場合にのみ `true` に設定します。Plugin が起動時には不活性で、より狭いトリガーからのみロードされるべき場合は `false` に設定します。`onStartup` を省略すると、静的な capability メタデータを持たない Plugin に対して、非推奨のレガシー暗黙的起動サイドカーフォールバックが維持されます。将来のバージョンでは、それらの Plugin が `activation.onStartup: true` を宣言しない限り、起動時ロードを停止する可能性があります。Plugin ステータスと互換性レポートは、Plugin がそのフォールバックにまだ依存している場合、`legacy-implicit-startup-sidecar` で警告します。

移行テストでは、`OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1` を設定して、その非推奨フォールバックのみを無効にします。このオプトインモードは、明示的な `activation.onStartup: true` の Plugin や、チャンネル、設定、エージェントハーネス、メモリ、その他のより狭いアクティベーショントリガーによってロードされる Plugin をブロックしません。

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

| フィールド              | 必須 | 型                                                 | 意味                                                                                                                                                                                                                      |
| ------------------ | -------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | いいえ       | `boolean`                                            | 明示的な Gateway 起動時アクティベーション。すべての Plugin がこれを設定する必要があります。`true` は起動中に Plugin をインポートします。`false` は、別の一致したトリガーがロードを必要としない限り、非推奨の暗黙的サイドカー起動フォールバックをオプトアウトします。 |
| `onProviders`      | いいえ       | `string[]`                                           | アクティベーション/ロード計画にこの Plugin を含めるべきプロバイダー ID。                                                                                                                                                             |
| `onAgentHarnesses` | いいえ       | `string[]`                                           | アクティベーション/ロード計画にこの Plugin を含めるべき埋め込みエージェントハーネスランタイム ID。CLI バックエンドエイリアスにはトップレベルの `cliBackends` を使います。                                                                                  |
| `onCommands`       | いいえ       | `string[]`                                           | アクティベーション/ロード計画にこの Plugin を含めるべきコマンド ID。                                                                                                                                                              |
| `onChannels`       | いいえ       | `string[]`                                           | アクティベーション/ロード計画にこの Plugin を含めるべきチャンネル ID。                                                                                                                                                              |
| `onRoutes`         | いいえ       | `string[]`                                           | アクティベーション/ロード計画にこの Plugin を含めるべきルート種別。                                                                                                                                                              |
| `onConfigPaths`    | いいえ       | `string[]`                                           | パスが存在し、明示的に無効化されていない場合に、起動/ロード計画にこの Plugin を含めるべきルート相対の設定パス。                                                                                             |
| `onCapabilities`   | いいえ       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | コントロールプレーンのアクティベーション計画で使われる広範な capability ヒント。可能な場合は、より狭いフィールドを優先してください。                                                                                                                            |

現在のライブコンシューマー:

- Gateway 起動計画は、明示的な起動時インポートと、非推奨の暗黙的サイドカー起動フォールバックのオプトアウトに `activation.onStartup` を使います
- コマンドでトリガーされる CLI 計画は、レガシーの `commandAliases[].cliCommand` または `commandAliases[].name` にフォールバックします
- エージェントランタイム起動計画は、埋め込みハーネスには `activation.onAgentHarnesses` を使い、CLI ランタイムエイリアスにはトップレベルの `cliBackends[]` を使います
- チャンネルでトリガーされるセットアップ/チャンネル計画は、明示的なチャンネルアクティベーションメタデータが欠けている場合、レガシーの `channels[]` 所有権にフォールバックします
- 起動時 Plugin 計画は、バンドルされたブラウザー Plugin の `browser` ブロックなど、チャンネルではないルート設定サーフェスに `activation.onConfigPaths` を使います
- プロバイダーでトリガーされるセットアップ/ランタイム計画は、明示的なプロバイダーアクティベーションメタデータが欠けている場合、レガシーの `providers[]` とトップレベルの `cliBackends[]` 所有権にフォールバックします

プランナー診断では、明示的なアクティベーションヒントとマニフェスト所有権フォールバックを区別できます。たとえば、`activation-command-hint` は `activation.onCommands` が一致したことを意味し、`manifest-command-alias` はプランナーが代わりに `commandAliases` 所有権を使ったことを意味します。これらの理由ラベルはホスト診断とテスト用です。Plugin 作者は、所有権を最もよく説明するメタデータを宣言し続けるべきです。

## qaRunners リファレンス

Plugin が共有の `openclaw qa` ルート配下に 1 つ以上のトランスポートランナーを提供する場合は、`qaRunners` を使います。このメタデータは低コストかつ静的に保ってください。実際の CLI 登録は、`qaRunnerCliRegistrations` をエクスポートする軽量な `runtime-api.ts` サーフェスを通じて、引き続き Plugin ランタイムが所有します。

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

| フィールド    | 必須 | 型       | 意味                                                               |
| ------------- | ---- | -------- | ------------------------------------------------------------------ |
| `commandName` | はい | `string` | `openclaw qa` の下にマウントされるサブコマンド。例: `matrix`。    |
| `description` | いいえ | `string` | 共有ホストがスタブコマンドを必要とするときに使われるフォールバックのヘルプテキスト。 |

## setup リファレンス

ランタイムが読み込まれる前に、setup とオンボーディングのサーフェスが安価な Plugin 所有のメタデータを必要とする場合は、`setup` を使います。

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

トップレベルの `cliBackends` は引き続き有効で、CLI 推論バックエンドを説明し続けます。`setup.cliBackends` は、メタデータのみのままにするべき制御プレーン/setup フロー向けの、setup 固有の記述子サーフェスです。

存在する場合、`setup.providers` と `setup.cliBackends` は、setup 検出で推奨される記述子優先の検索サーフェスです。記述子が候補 Plugin を絞り込むだけで、setup がさらに豊富な setup 時ランタイムフックを必要とする場合は、`requiresRuntime: true` を設定し、フォールバック実行パスとして `setup-api` を維持してください。

OpenClaw は、汎用プロバイダー認証と環境変数検索にも `setup.providers[].envVars` を含めます。`providerAuthEnvVars` は非推奨期間中、互換アダプターを通じて引き続きサポートされますが、まだそれを使用している非バンドル Plugin はマニフェスト診断を受け取ります。新しい Plugin は setup/status の環境メタデータを `setup.providers[].envVars` に配置するべきです。

OpenClaw は、setup エントリが利用できない場合、または `setup.requiresRuntime: false` が setup ランタイムは不要だと宣言している場合に、`setup.providers[].authMethods` から単純な setup 選択肢を導出することもできます。カスタムラベル、CLI フラグ、オンボーディングスコープ、アシスタントメタデータには、明示的な `providerAuthChoices` エントリが引き続き推奨されます。

`requiresRuntime: false` は、それらの記述子だけで setup サーフェスに十分な場合にのみ設定してください。OpenClaw は明示的な `false` を記述子のみの契約として扱い、setup 検索のために `setup-api` や `openclaw.setupEntry` を実行しません。記述子のみの Plugin がそれらの setup ランタイムエントリのいずれかをまだ同梱している場合、OpenClaw は追加診断を報告し、それを無視し続けます。`requiresRuntime` を省略するとレガシーのフォールバック動作が維持されるため、フラグなしで記述子を追加した既存の Plugin は壊れません。

setup 検索は Plugin 所有の `setup-api` コードを実行できるため、正規化された `setup.providers[].id` と `setup.cliBackends[]` の値は、検出された Plugin 全体で一意のままにする必要があります。所有権があいまいな場合は、検出順から勝者を選ぶのではなく、安全側に倒して失敗します。

setup ランタイムが実行される場合、`setup-api` がマニフェスト記述子で宣言されていないプロバイダーまたは CLI バックエンドを登録した場合、または記述子に一致するランタイム登録がない場合に、setup レジストリ診断は記述子のずれを報告します。これらの診断は追加的なものであり、レガシー Plugin を拒否しません。

### setup.providers リファレンス

| フィールド     | 必須 | 型         | 意味                                                                                                 |
| -------------- | ---- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `id`           | はい | `string`   | setup またはオンボーディング中に公開されるプロバイダー ID。正規化された ID をグローバルに一意に保ってください。 |
| `authMethods`  | いいえ | `string[]` | フルランタイムを読み込まずに、このプロバイダーがサポートする setup/認証メソッド ID。                |
| `envVars`      | いいえ | `string[]` | Plugin ランタイムが読み込まれる前に、汎用 setup/status サーフェスが確認できる環境変数。             |
| `authEvidence` | いいえ | `object[]` | 非シークレットのマーカーで認証できるプロバイダー向けの、安価なローカル認証エビデンス確認。          |

`authEvidence` は、ランタイムコードを読み込まずに検証できる、プロバイダー所有のローカル認証情報マーカー用です。これらの確認は安価かつローカルのままにする必要があります。ネットワーク呼び出し、キーチェーンやシークレットマネージャーの読み取り、シェルコマンド、プロバイダー API プローブは禁止です。

サポートされるエビデンスエントリ:

| フィールド         | 必須 | 型         | 意味                                                                                                             |
| ------------------ | ---- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| `type`             | はい | `string`   | 現在は `local-file-with-env`。                                                                                   |
| `fileEnvVar`       | いいえ | `string`   | 明示的な認証情報ファイルパスを含む環境変数。                                                                     |
| `fallbackPaths`    | いいえ | `string[]` | `fileEnvVar` が存在しないか空の場合に確認されるローカル認証情報ファイルパス。`${HOME}` と `${APPDATA}` をサポートします。 |
| `requiresAnyEnv`   | いいえ | `string[]` | エビデンスが有効になる前に、列挙された環境変数の少なくとも 1 つが空でない必要があります。                        |
| `requiresAllEnv`   | いいえ | `string[]` | エビデンスが有効になる前に、列挙されたすべての環境変数が空でない必要があります。                                |
| `credentialMarker` | はい | `string`   | エビデンスが存在するときに返される非シークレットのマーカー。                                                     |
| `source`           | いいえ | `string`   | 認証/status 出力向けのユーザー向けソースラベル。                                                                 |

### setup フィールド

| フィールド         | 必須 | 型         | 意味                                                                                                 |
| ------------------ | ---- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `providers`        | いいえ | `object[]` | setup とオンボーディング中に公開されるプロバイダー setup 記述子。                                    |
| `cliBackends`      | いいえ | `string[]` | 記述子優先の setup 検索で使用される setup 時バックエンド ID。正規化された ID をグローバルに一意に保ってください。 |
| `configMigrations` | いいえ | `string[]` | この Plugin の setup サーフェスが所有する設定移行 ID。                                               |
| `requiresRuntime`  | いいえ | `boolean`  | 記述子検索後も setup が `setup-api` 実行を必要とするかどうか。                                       |

## uiHints リファレンス

`uiHints` は設定フィールド名から小さなレンダリングヒントへのマップです。

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
| `label`       | `string`   | ユーザー向けのフィールドラベル。       |
| `help`        | `string`   | 短いヘルパーテキスト。                 |
| `tags`        | `string[]` | 任意の UI タグ。                       |
| `advanced`    | `boolean`  | フィールドを詳細項目としてマークします。 |
| `sensitive`   | `boolean`  | フィールドをシークレットまたはセンシティブとしてマークします。 |
| `placeholder` | `string`   | フォーム入力のプレースホルダーテキスト。 |

## contracts リファレンス

`contracts` は、Plugin ランタイムをインポートせずに OpenClaw が読み取れる静的な能力所有権メタデータにのみ使用します。

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
| `embeddedExtensionFactories`     | `string[]` | Codex app-server 拡張ファクトリー ID。現在は `codex-app-server`。     |
| `agentToolResultMiddleware`      | `string[]` | バンドル Plugin がツール結果ミドルウェアを登録できるランタイム ID。   |
| `externalAuthProviders`          | `string[]` | この Plugin が外部認証プロファイルフックを所有するプロバイダー ID。   |
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

`contracts.embeddedExtensionFactories` は、バンドルされた Codex app-server 専用拡張ファクトリーのために保持されています。バンドルされたツール結果変換は、代わりに `contracts.agentToolResultMiddleware` を宣言し、`api.registerAgentToolResultMiddleware(...)` で登録するべきです。外部 Plugin はツール結果ミドルウェアを登録できません。この継ぎ目は、モデルが確認する前に高信頼ツール出力を書き換えられるためです。

`resolveExternalAuthProfiles` を実装するプロバイダー Plugin は、`contracts.externalAuthProviders` を宣言するべきです。宣言のない Plugin も非推奨の互換フォールバックを通じて引き続き実行されますが、そのフォールバックは遅く、移行期間後に削除されます。

バンドルされたメモリエンベディングプロバイダーは、`local` などの組み込みアダプターを含め、公開するすべてのアダプター ID について `contracts.memoryEmbeddingProviders` を宣言するべきです。スタンドアロン CLI パスは、フル Gateway ランタイムがプロバイダーを登録する前に、所有元 Plugin だけを読み込むためにこのマニフェスト契約を使用します。

## mediaUnderstandingProviderMetadata リファレンス

`mediaUnderstandingProviderMetadata` は、メディア理解プロバイダーにデフォルトモデル、自動認証フォールバック優先度、または汎用コアヘルパーがランタイム読み込み前に必要とするネイティブドキュメント対応がある場合に使用します。キーは `contracts.mediaUnderstandingProviders` でも宣言する必要があります。

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

各プロバイダーエントリには次を含めることができます。

| フィールド             | 型                                  | 意味                                                                                      |
| ---------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | このプロバイダーが公開するメディア機能。                                                  |
| `defaultModels`        | `Record<string, string>`            | config でモデルが指定されていない場合に使用される、機能からモデルへのデフォルト。         |
| `autoPriority`         | `Record<string, number>`            | 自動の認証情報ベースのプロバイダーフォールバックでは、小さい数値ほど先に並びます。        |
| `nativeDocumentInputs` | `"pdf"[]`                           | プロバイダーが対応するネイティブドキュメント入力。                                        |

## channelConfigs リファレンス

チャネル Plugin がランタイム読み込み前に低コストな config メタデータを必要とする場合は、`channelConfigs` を使用します。読み取り専用のチャネルセットアップ/ステータス検出では、セットアップエントリが利用できない場合、または `setup.requiresRuntime: false` がセットアップランタイムは不要と宣言している場合に、設定済みの外部チャネルに対してこのメタデータを直接使用できます。

`channelConfigs` は Plugin マニフェストメタデータであり、新しいトップレベルのユーザー config セクションではありません。ユーザーは引き続き `channels.<channel-id>` の下でチャネルインスタンスを設定します。OpenClaw はマニフェストメタデータを読み取り、Plugin ランタイムコードが実行される前に、その設定済みチャネルを所有する Plugin を判断します。

チャネル Plugin では、`configSchema` と `channelConfigs` は異なるパスを表します。

- `configSchema` は `plugins.entries.<plugin-id>.config` を検証します
- `channelConfigs.<channel-id>.schema` は `channels.<channel-id>` を検証します

`channels[]` を宣言する非バンドル Plugin は、一致する `channelConfigs` エントリも宣言する必要があります。宣言がなくても OpenClaw は Plugin を読み込めますが、コールドパスの config schema、セットアップ、Control UI サーフェスは、Plugin ランタイムが実行されるまでチャネル所有のオプション形状を知ることができません。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` と `nativeSkillsAutoEnabled` は、チャネルランタイム読み込み前に実行されるコマンド config チェック用に、静的な `auto` デフォルトを宣言できます。バンドルチャネルは、その他のパッケージ所有のチャネルカタログメタデータと併せて、`package.json#openclaw.channel.commands` から同じデフォルトを公開することもできます。

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

| フィールド    | 型                       | 意味                                                                                                    |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` 用の JSON Schema。宣言された各チャネル config エントリに必須です。                      |
| `uiHints`     | `Record<string, object>` | そのチャネル config セクション用の任意の UI ラベル/プレースホルダー/機密ヒント。                        |
| `label`       | `string`                 | ランタイムメタデータがまだ準備できていない場合に、ピッカーと検査サーフェスへマージされるチャネルラベル。 |
| `description` | `string`                 | 検査サーフェスとカタログサーフェス向けの短いチャネル説明。                                              |
| `commands`    | `object`                 | ランタイム前の config チェック用の静的なネイティブコマンドおよびネイティブ skill の自動デフォルト。      |
| `preferOver`  | `string[]`               | 選択サーフェスでこのチャネルが優先されるべき、レガシーまたは低優先度の Plugin ID。                      |

### 別のチャネル Plugin を置き換える

別の Plugin も提供できるチャネル ID について、自分の Plugin を優先所有者にしたい場合は `preferOver` を使用します。よくあるケースは、Plugin ID のリネーム、バンドル Plugin を置き換えるスタンドアロン Plugin、または config 互換性のために同じチャネル ID を維持するメンテナンス済みフォークです。

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

`channels.chat` が設定されている場合、OpenClaw はチャネル ID と優先 Plugin ID の両方を考慮します。低優先度の Plugin がバンドル済み、またはデフォルトで有効という理由だけで選択されていた場合、OpenClaw は有効なランタイム config 内でそれを無効化し、1 つの Plugin がチャネルとそのツールを所有するようにします。明示的なユーザー選択は引き続き優先されます。ユーザーが両方の Plugin を明示的に有効化した場合、OpenClaw は要求された Plugin セットを黙って変更するのではなく、その選択を保持し、重複するチャネル/ツール診断を報告します。

`preferOver` は、本当に同じチャネルを提供できる Plugin ID に限定してください。これは汎用の優先度フィールドではなく、ユーザー config キーをリネームするものでもありません。

## modelSupport リファレンス

OpenClaw が Plugin ランタイム読み込み前に、`gpt-5.5` や `claude-sonnet-4.6` のような短縮モデル ID からプロバイダー Plugin を推論すべき場合は、`modelSupport` を使用します。

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
- 非バンドル Plugin とバンドル Plugin の両方が一致する場合、非バンドル Plugin が優先されます
- 残る曖昧さは、ユーザーまたは config がプロバイダーを指定するまで無視されます

フィールド:

| フィールド      | 型         | 意味                                                                                         |
| --------------- | ---------- | -------------------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | 短縮モデル ID に対して `startsWith` で照合されるプレフィックス。                              |
| `modelPatterns` | `string[]` | プロファイルサフィックスの削除後、短縮モデル ID に対して照合される正規表現ソース。            |

## modelCatalog リファレンス

OpenClaw が Plugin ランタイムを読み込む前にプロバイダーモデルメタデータを知るべき場合は、`modelCatalog` を使用します。これは固定カタログ行、プロバイダーエイリアス、抑制ルール、検出モードのためのマニフェスト所有ソースです。ランタイム更新は引き続きプロバイダーランタイムコードの責務ですが、マニフェストはランタイムが必要になるタイミングをコアに伝えます。

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

| フィールド     | 型                                                       | 意味                                                                                                           |
| -------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | この Plugin が所有するプロバイダー ID のカタログ行。キーはトップレベルの `providers` にも現れる必要があります。 |
| `aliases`      | `Record<string, object>`                                 | カタログまたは抑制計画のために、所有プロバイダーへ解決されるべきプロバイダーエイリアス。                       |
| `suppressions` | `object[]`                                               | この Plugin がプロバイダー固有の理由で抑制する、別ソースからのモデル行。                                       |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | プロバイダーカタログをマニフェストメタデータから読めるか、キャッシュへ更新できるか、ランタイムが必要か。       |

`aliases` は、モデルカタログ計画のためのプロバイダー所有権検索に参加します。エイリアスのターゲットは、同じ Plugin が所有するトップレベルプロバイダーである必要があります。プロバイダーで絞り込まれたリストがエイリアスを使用する場合、OpenClaw はプロバイダーランタイムを読み込まずに所有元マニフェストを読み取り、エイリアスの API/base URL オーバーライドを適用できます。
エイリアスはフィルターなしのカタログ一覧を展開しません。広範なリストでは、所有元の正規プロバイダー行のみが出力されます。

`suppressions` は、古いプロバイダーランタイムの `suppressBuiltInModel` フックを置き換えます。抑制エントリは、プロバイダーが Plugin に所有されている場合、または所有プロバイダーをターゲットにする `modelCatalog.aliases` キーとして宣言されている場合にのみ尊重されます。ランタイム抑制フックは、モデル解決中にはもう呼び出されません。

プロバイダーフィールド:

| フィールド | 型                       | 意味                                                                           |
| ---------- | ------------------------ | ------------------------------------------------------------------------------ |
| `baseUrl`  | `string`                 | このプロバイダーカタログ内のモデルに対する任意のデフォルトベース URL。         |
| `api`      | `ModelApi`               | このプロバイダーカタログ内のモデルに対する任意のデフォルト API アダプター。    |
| `headers`  | `Record<string, string>` | このプロバイダーカタログに適用される任意の静的ヘッダー。                       |
| `models`   | `object[]`               | 必須のモデル行。`id` のない行は無視されます。                                  |

モデルフィールド:

| フィールド      | 型                                                             | 意味                                                                        |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | `provider/` プレフィックスなしの、プロバイダー内ローカルなモデル ID。       |
| `name`          | `string`                                                       | 任意の表示名。                                                              |
| `api`           | `ModelApi`                                                     | 任意のモデル単位 API オーバーライド。                                       |
| `baseUrl`       | `string`                                                       | 任意のモデル単位ベース URL オーバーライド。                                 |
| `headers`       | `Record<string, string>`                                       | 任意のモデル単位静的ヘッダー。                                              |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | モデルが受け付けるモダリティ。                                              |
| `reasoning`     | `boolean`                                                      | モデルが推論動作を公開するかどうか。                                        |
| `contextWindow` | `number`                                                       | ネイティブプロバイダーのコンテキストウィンドウ。                            |
| `contextTokens` | `number`                                                       | `contextWindow` と異なる場合の、任意の有効なランタイムコンテキスト上限。    |
| `maxTokens`     | `number`                                                       | 既知の場合の最大出力トークン数。                                            |
| `cost`          | `object`                                                       | 任意の 100 万トークンあたり USD 価格。任意の `tieredPricing` を含む。       |
| `compat`        | `object`                                                       | OpenClaw モデル設定の互換性に一致する任意の互換性フラグ。                   |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 一覧表示ステータス。その行を一切表示しない必要がある場合だけ抑制する。      |
| `statusReason`  | `string`                                                       | 利用可能以外のステータスとともに表示される任意の理由。                      |
| `replaces`      | `string[]`                                                     | このモデルが置き換える古いプロバイダー内ローカルなモデル ID。               |
| `replacedBy`    | `string`                                                       | 非推奨行の置き換え先となるプロバイダー内ローカルなモデル ID。               |
| `tags`          | `string[]`                                                     | ピッカーとフィルターで使われる安定したタグ。                                |

抑制フィールド:

| フィールド                 | 型         | 意味                                                                                                      |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | 抑制するアップストリーム行のプロバイダー ID。この plugin が所有しているか、所有エイリアスとして宣言されている必要がある。 |
| `model`                    | `string`   | 抑制するプロバイダー内ローカルなモデル ID。                                                               |
| `reason`                   | `string`   | 抑制された行が直接要求されたときに表示される任意のメッセージ。                                            |
| `when.baseUrlHosts`        | `string[]` | 抑制が適用される前に必要な、有効なプロバイダーベース URL ホストの任意リスト。                             |
| `when.providerConfigApiIn` | `string[]` | 抑制が適用される前に必要な、完全一致のプロバイダー設定 `api` 値の任意リスト。                             |

ランタイム専用データを `modelCatalog` に入れない。マニフェスト行が、プロバイダーで絞り込んだ一覧とピッカー画面でレジストリ/ランタイム探索をスキップできるほど十分に完全な場合だけ、`static` を使う。マニフェスト行が一覧表示可能なシードや補足として有用だが、更新/キャッシュによって後から行を追加できる場合は `refreshable` を使う。refreshable 行は、それ自体では権威ではない。OpenClaw が一覧を知るためにプロバイダーランタイムを読み込む必要がある場合は `runtime` を使う。

## modelIdNormalization リファレンス

プロバイダーランタイムが読み込まれる前に行う必要がある、低コストなプロバイダー所有のモデル ID 正規化には `modelIdNormalization` を使う。これにより、短いモデル名、プロバイダー内ローカルなレガシー ID、プロキシプレフィックス規則などのエイリアスを、コアのモデル選択テーブルではなく、所有 plugin のマニフェストに置ける。

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

| フィールド                           | 型                      | 意味                                                                                   |
| ------------------------------------ | ----------------------- | -------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | 大文字小文字を区別しない完全一致のモデル ID エイリアス。値は書かれたとおりに返される。 |
| `stripPrefixes`                      | `string[]`              | エイリアス検索の前に削除するプレフィックス。レガシーな provider/model 重複に有用。     |
| `prefixWhenBare`                     | `string`                | 正規化済みモデル ID にまだ `/` が含まれていない場合に追加するプレフィックス。          |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | エイリアス検索後の条件付き bare-id プレフィックス規則。`modelPrefix` と `prefix` でキー指定される。 |

## providerEndpoints リファレンス

プロバイダーランタイムが読み込まれる前に汎用リクエストポリシーが知る必要があるエンドポイント分類には、`providerEndpoints` を使う。各 `endpointClass` の意味は引き続きコアが所有し、plugin マニフェストがホストとベース URL メタデータを所有する。

エンドポイントフィールド:

| フィールド                     | 型         | 意味                                                                                         |
| ------------------------------ | ---------- | -------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | `openrouter`、`moonshot-native`、`google-vertex` などの既知のコアエンドポイントクラス。       |
| `hosts`                        | `string[]` | エンドポイントクラスに対応する正確なホスト名。                                               |
| `hostSuffixes`                 | `string[]` | エンドポイントクラスに対応するホストサフィックス。ドメインサフィックスのみの一致には `.` を付ける。 |
| `baseUrls`                     | `string[]` | エンドポイントクラスに対応する、正確に正規化された HTTP(S) ベース URL。                       |
| `googleVertexRegion`           | `string`   | 正確なグローバルホスト用の静的 Google Vertex リージョン。                                    |
| `googleVertexRegionHostSuffix` | `string`   | 一致したホストから取り除き、Google Vertex リージョンプレフィックスを公開するためのサフィックス。 |

## providerRequest リファレンス

プロバイダーランタイムを読み込まずに汎用リクエストポリシーが必要とする、低コストなリクエスト互換性メタデータには `providerRequest` を使う。動作固有のペイロード書き換えは、プロバイダーランタイムフックまたは共有プロバイダーファミリーヘルパーに保持する。

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

| フィールド            | 型           | 意味                                                                                   |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | 汎用リクエスト互換性の判断と診断で使われるプロバイダーファミリーラベル。               |
| `compatibilityFamily` | `"moonshot"` | 共有リクエストヘルパー用の任意のプロバイダーファミリー互換性バケット。                 |
| `openAICompletions`   | `object`     | OpenAI 互換 completions リクエストフラグ。現在は `supportsStreamingUsage`。             |

## modelPricing リファレンス

ランタイム読み込み前にプロバイダーがコントロールプレーンの価格動作を制御する必要がある場合は、`modelPricing` を使う。Gateway の価格キャッシュは、プロバイダーランタイムコードをインポートせずにこのメタデータを読む。

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

| フィールド   | 型                | 意味                                                                                             |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------ |
| `external`   | `boolean`         | OpenRouter または LiteLLM の価格を決して取得すべきでない、ローカル/セルフホスト型プロバイダーでは `false` に設定する。 |
| `openRouter` | `false \| object` | OpenRouter 価格検索マッピング。`false` はこのプロバイダーの OpenRouter 検索を無効にする。        |
| `liteLLM`    | `false \| object` | LiteLLM 価格検索マッピング。`false` はこのプロバイダーの LiteLLM 検索を無効にする。              |

ソースフィールド:

| フィールド                 | 型                 | 意味                                                                                                          |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | OpenClaw プロバイダー ID と異なる場合の外部カタログプロバイダー ID。たとえば `zai` プロバイダーの `z-ai`。   |
| `passthroughProviderModel` | `boolean`          | スラッシュを含むモデル ID をネストされた provider/model 参照として扱う。OpenRouter のようなプロキシプロバイダーに有用。 |
| `modelIdTransforms`        | `"version-dots"[]` | 追加の外部カタログモデル ID バリアント。`version-dots` は `claude-opus-4.6` のようなドット付きバージョン ID を試す。 |

### OpenClaw プロバイダーインデックス

OpenClaw プロバイダーインデックスは、plugin がまだインストールされていない可能性があるプロバイダー向けの、OpenClaw 所有のプレビューメタデータである。これは plugin マニフェストの一部ではない。plugin マニフェストは、引き続きインストール済み plugin の権威である。プロバイダーインデックスは、プロバイダー plugin がインストールされていない場合に、将来のインストール可能プロバイダーとインストール前モデルピッカー画面が利用する内部フォールバック契約である。

カタログ権威の順序:

1. ユーザー設定。
2. インストール済み plugin マニフェストの `modelCatalog`。
3. 明示的な更新によるモデルカタログキャッシュ。
4. OpenClaw プロバイダーインデックスのプレビュー行。

Provider Index には、シークレット、有効化状態、ランタイムフック、または
ライブのアカウント固有モデルデータを含めてはなりません。そのプレビューカタログでは、Plugin マニフェストと同じ
`modelCatalog` プロバイダー行の形を使いますが、`api`、
`baseUrl`、価格、互換性フラグなどのランタイムアダプターフィールドを、
インストール済み Plugin マニフェストと意図的に揃えて維持する場合を除き、
安定した表示メタデータに限定する必要があります。ライブの `/models` 探索を持つプロバイダーは、
通常の一覧表示やオンボーディングでプロバイダー API を呼び出すのではなく、
明示的なモデルカタログキャッシュパスを通じて更新済みの行を書き込む必要があります。

Provider Index のエントリは、Plugin がコアの外へ移動した、またはまだインストールされていないプロバイダー向けに、
インストール可能な Plugin メタデータを保持することもできます。この
メタデータはチャンネルカタログのパターンに従います。パッケージ名、npm インストール指定、
期待される整合性、軽量な認証選択ラベルがあれば、インストール可能なセットアップオプションを表示するには十分です。
Plugin がインストールされると、そのマニフェストが優先され、
そのプロバイダーの Provider Index エントリは無視されます。

従来のトップレベル機能キーは非推奨です。`openclaw doctor --fix` を使って
`speechProviders`、`realtimeTranscriptionProviders`、
`realtimeVoiceProviders`、`mediaUnderstandingProviders`、
`imageGenerationProviders`、`videoGenerationProviders`、
`webFetchProviders`、`webSearchProviders` を `contracts` の下へ移動してください。通常の
マニフェスト読み込みでは、これらのトップレベルフィールドを機能の
所有権として扱わなくなりました。

## マニフェストと package.json

この2つのファイルは異なる役割を持ちます。

| ファイル               | 用途                                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Plugin コードが実行される前に存在している必要がある探索、設定検証、認証選択メタデータ、UI ヒント                              |
| `package.json`         | npm メタデータ、依存関係のインストール、エントリーポイント、インストールゲート、セットアップ、カタログメタデータに使う `openclaw` ブロック |

あるメタデータをどちらへ置くべきか迷う場合は、次の規則を使ってください。

- Plugin コードを読み込む前に OpenClaw が知る必要がある場合は、`openclaw.plugin.json` に置く
- パッケージング、エントリーファイル、または npm インストール動作に関するものなら、`package.json` に置く

### 探索に影響する package.json フィールド

ランタイム前の一部の Plugin メタデータは、意図的に `openclaw.plugin.json` ではなく
`package.json` の `openclaw` ブロック内に置かれます。

重要な例:

| フィールド                                                        | 意味                                                                                                                                                                                 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | ネイティブ Plugin エントリーポイントを宣言します。Plugin パッケージディレクトリ内に留まる必要があります。                                                                          |
| `openclaw.runtimeExtensions`                                      | インストール済みパッケージ向けのビルド済み JavaScript ランタイムエントリーポイントを宣言します。Plugin パッケージディレクトリ内に留まる必要があります。                           |
| `openclaw.setupEntry`                                             | オンボーディング、遅延チャンネル起動、読み取り専用のチャンネルステータス/SecretRef 探索で使う軽量なセットアップ専用エントリーポイントです。Plugin パッケージディレクトリ内に留まる必要があります。 |
| `openclaw.runtimeSetupEntry`                                      | インストール済みパッケージ向けのビルド済み JavaScript セットアップエントリーポイントを宣言します。Plugin パッケージディレクトリ内に留まる必要があります。                         |
| `openclaw.channel`                                                | ラベル、ドキュメントパス、エイリアス、選択用コピーなどの軽量なチャンネルカタログメタデータです。                                                                                   |
| `openclaw.channel.commands`                                       | チャンネルランタイムが読み込まれる前に、設定、監査、コマンド一覧の各画面で使う静的なネイティブコマンドおよびネイティブ skill 自動デフォルトメタデータです。                         |
| `openclaw.channel.configuredState`                                | 完全なチャンネルランタイムを読み込まずに「環境変数のみのセットアップは既に存在するか」に答えられる、軽量な設定済み状態チェッカーメタデータです。                                    |
| `openclaw.channel.persistedAuthState`                             | 完全なチャンネルランタイムを読み込まずに「既にサインイン済みのものはあるか」に答えられる、軽量な永続化認証チェッカーメタデータです。                                                |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | バンドル済みおよび外部公開 Plugin 向けのインストール/更新ヒントです。                                                                                                                |
| `openclaw.install.defaultChoice`                                  | 複数のインストール元が利用できる場合の優先インストールパスです。                                                                                                                    |
| `openclaw.install.minHostVersion`                                 | `>=2026.3.22` のような semver 下限を使った、サポートされる最小 OpenClaw ホストバージョンです。                                                                                      |
| `openclaw.install.expectedIntegrity`                              | `sha512-...` のような期待される npm dist 整合性文字列です。インストールおよび更新フローは、取得した成果物をこれと照合して検証します。                                               |
| `openclaw.install.allowInvalidConfigRecovery`                     | 設定が無効な場合に、限定的なバンドル済み Plugin 再インストール復旧パスを許可します。                                                                                                |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 起動中、完全なチャンネル Plugin より前にセットアップ専用チャンネル画面を読み込めるようにします。                                                                                    |

マニフェストメタデータは、ランタイムが読み込まれる前のオンボーディングに、
どのプロバイダー/チャンネル/セットアップ選択肢が表示されるかを決定します。
`package.json#openclaw.install` は、ユーザーがそれらの選択肢のいずれかを選んだときに、
オンボーディングがその Plugin を取得または有効化する方法を伝えます。
インストールヒントを `openclaw.plugin.json` に移動しないでください。

`openclaw.install.minHostVersion` はインストール時およびマニフェスト
レジストリ読み込み時に適用されます。無効な値は拒否されます。有効だが新しすぎる値は、
古いホストでは Plugin をスキップします。

正確な npm バージョン固定は、たとえば
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"` のように、
既に `npmSpec` に含まれています。公式の外部カタログ
エントリでは、正確な指定と `expectedIntegrity` を組み合わせ、取得した npm 成果物が
固定リリースと一致しなくなった場合に更新フローが失敗して閉じるようにする必要があります。
対話型オンボーディングでは互換性のため、裸の
パッケージ名や dist-tag を含む信頼済みレジストリ npm 指定も引き続き提示します。
カタログ診断は、正確、浮動、整合性固定済み、整合性欠落、パッケージ名
不一致、無効なデフォルト選択ソースを区別できます。また、
`expectedIntegrity` が存在するのに、それを固定できる有効な npm ソースがない場合も警告します。
`expectedIntegrity` が存在する場合、
インストール/更新フローはそれを適用します。省略された場合、レジストリ解決は
整合性固定なしで記録されます。

チャンネル Plugin は、完全なランタイムを読み込まずに、ステータス、チャンネル一覧、
または SecretRef スキャンで設定済みアカウントを識別する必要がある場合、
`openclaw.setupEntry` を提供する必要があります。セットアップエントリは、チャンネルメタデータに加えて、
セットアップ時に安全な設定、ステータス、シークレットアダプターを公開する必要があります。ネットワーククライアント、
Gateway リスナー、トランスポートランタイムはメイン拡張エントリーポイントに保持してください。

ランタイムエントリーポイントフィールドは、ソース
エントリーポイントフィールドに対するパッケージ境界チェックを上書きしません。たとえば、`openclaw.runtimeExtensions` によって、
外へ抜ける `openclaw.extensions` パスを読み込み可能にすることはできません。

`openclaw.install.allowInvalidConfigRecovery` は意図的に限定的です。これは
任意の壊れた設定をインストール可能にするものではありません。現時点では、欠落したバンドル済み Plugin パスや、
同じバンドル済み Plugin に対する古い `channels.<id>` エントリなど、
特定の古いバンドル済み Plugin アップグレード失敗からインストールフローが復旧することだけを許可します。
無関係な設定エラーは引き続きインストールをブロックし、運用者を
`openclaw doctor --fix` へ案内します。

`openclaw.channel.persistedAuthState` は、小さなチェッカー
モジュール向けのパッケージメタデータです。

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

セットアップ、doctor、ステータス、または読み取り専用の存在確認フローで、完全なチャンネル Plugin が読み込まれる前に、
軽量な yes/no 認証プローブが必要な場合に使ってください。永続化された認証状態は
設定済みチャンネル状態ではありません。このメタデータを使って Plugin を自動有効化したり、
ランタイム依存関係を修復したり、チャンネルランタイムを読み込むべきか判断したりしないでください。
対象の export は、永続化状態だけを読む小さな関数にする必要があります。完全なチャンネルランタイム barrel を
経由させないでください。

`openclaw.channel.configuredState` は、軽量な環境変数のみの
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

環境変数やその他の小さな非ランタイム入力から、チャンネルが設定済み状態に答えられる場合に使ってください。
チェックに完全な設定解決や実際の
チャンネルランタイムが必要な場合、そのロジックは Plugin の `config.hasConfiguredState`
フックに保持してください。

## 探索の優先順位（重複する Plugin id）

OpenClaw は複数のルート（バンドル済み、グローバルインストール、ワークスペース、明示的に設定で選択されたパス）から Plugin を探索します。2つの探索結果が同じ `id` を共有する場合、**最も優先順位の高い**マニフェストだけが保持されます。優先順位の低い重複は、並べて読み込まれるのではなく破棄されます。

優先順位は高いものから低いものへ次の通りです。

1. **設定で選択** — `plugins.entries.<id>` で明示的に固定されたパス
2. **バンドル済み** — OpenClaw と一緒に出荷される Plugin
3. **グローバルインストール** — グローバル OpenClaw Plugin ルートにインストールされた Plugin
4. **ワークスペース** — 現在のワークスペースを基準に探索された Plugin

影響:

- ワークスペースにあるバンドル済み Plugin のフォークや古いコピーは、バンドル済みビルドを隠しません。
- ローカルのものを使ってバンドル済み Plugin を実際に上書きするには、ワークスペース探索に頼るのではなく、`plugins.entries.<id>` で固定し、優先順位で勝たせてください。
- 重複の破棄はログに記録されるため、Doctor と起動診断は破棄されたコピーを示せます。

## JSON Schema 要件

- **すべての Plugin は JSON Schema を同梱する必要があります**。設定を受け付けない場合でも同様です。
- 空のスキーマは許容されます（例: `{ "type": "object", "additionalProperties": false }`）。
- スキーマは設定の読み取り/書き込み時に検証され、ランタイム時ではありません。

## 検証動作

- 不明な `channels.*` キーは、チャネル id が Plugin マニフェストで宣言されていない限り、**エラー**です。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny`、`plugins.slots.*`
  は、**検出可能な** Plugin id を参照する必要があります。不明な id は**エラー**です。
- Plugin がインストールされているものの、マニフェストまたはスキーマが壊れている、または存在しない場合、
  検証は失敗し、Doctor は Plugin エラーを報告します。
- Plugin 設定が存在していても Plugin が**無効**な場合、その設定は保持され、
  Doctor とログに**警告**が表示されます。

完全な `plugins.*` スキーマについては、[設定リファレンス](/ja-JP/gateway/configuration)を参照してください。

## 注記

- マニフェストは、ローカルファイルシステムからの読み込みを含む**ネイティブ OpenClaw Plugin** で**必須**です。ランタイムは Plugin モジュールを別途読み込みます。マニフェストは検出と検証専用です。
- ネイティブマニフェストは JSON5 で解析されるため、最終的な値がオブジェクトである限り、コメント、末尾のカンマ、引用符なしのキーを使用できます。
- マニフェストローダーは、文書化されたマニフェストフィールドのみを読み取ります。カスタムのトップレベルキーは避けてください。
- `channels`、`providers`、`cliBackends`、`skills` は、Plugin が必要としない場合はすべて省略できます。
- `providerDiscoveryEntry` は軽量に保つ必要があり、広範なランタイムコードをインポートすべきではありません。リクエスト時の実行ではなく、静的なプロバイダーカタログメタデータまたは限定的な検出記述子に使用してください。
- 排他的な Plugin 種別は `plugins.slots.*` で選択します。`kind: "memory"` は `plugins.slots.memory` 経由、`kind: "context-engine"` は `plugins.slots.contextEngine` 経由です（デフォルトは `legacy`）。
- 排他的な Plugin 種別はこのマニフェストで宣言してください。ランタイムエントリの `OpenClawPluginDefinition.kind` は非推奨であり、古い Plugin 向けの互換性フォールバックとしてのみ残されています。
- 環境変数メタデータ（`setup.providers[].envVars`、非推奨の `providerAuthEnvVars`、および `channelEnvVars`）は宣言専用です。ステータス、監査、cron 配信検証、その他の読み取り専用サーフェスは、環境変数を設定済みとして扱う前に、引き続き Plugin の信頼性と有効なアクティベーションポリシーを適用します。
- プロバイダーコードを必要とするランタイムウィザードメタデータについては、[プロバイダーランタイムフック](/ja-JP/plugins/architecture-internals#provider-runtime-hooks)を参照してください。
- Plugin がネイティブモジュールに依存する場合は、ビルド手順とパッケージマネージャーの許可リスト要件（例: pnpm `allow-build-scripts` + `pnpm rebuild <package>`）を文書化してください。

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

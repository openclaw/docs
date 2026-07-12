---
read_when:
    - OpenClaw Pluginを保守している場合
    - Plugin の互換性に関する警告が表示される
    - Plugin SDK またはマニフェストの移行を計画している場合
summary: Plugin の互換性契約、非推奨メタデータ、移行に関する要件
title: Plugin の互換性
x-i18n:
    generated_at: "2026-07-11T22:28:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26f737e40175652cb24327c91d2af9dbf72b1b254011115f5b512a309707711c
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw は、古い Plugin コントラクトを削除する前に、名前付き互換性アダプターを介して接続した状態に保ちます。これにより、SDK、マニフェスト、セットアップ、設定、エージェントランタイムのコントラクトが進化する間も、既存のバンドル済みおよび外部 Plugin が保護されます。

## 互換性レジストリ

Plugin の互換性コントラクトは、`src/plugins/compat/registry.ts` のコアレジストリで追跡されます。各レコードには以下が含まれます。

- 安定した互換性コード
- ステータス: `active`、`deprecated`、`removal-pending`、または `removed`
- 所有者: `sdk`、`config`、`setup`、`channel`、`provider`、`plugin-execution`、`agent-runtime`、または `core`
- 該当する場合は導入日と非推奨化日
- 代替手段のガイダンス
- 古い動作と新しい動作を対象とするドキュメント、診断、テスト

このレジストリは、メンテナーの計画と将来の Plugin インスペクターチェックの情報源です。Plugin 向けの動作を変更する場合は、アダプターを追加する変更と同じ変更内で、互換性レコードを追加または更新してください。

Doctor による修復および移行の互換性は、`src/commands/doctor/shared/deprecation-compat.ts` で個別に追跡されます。これらのレコードは、ランタイム互換性パスが削除された後も利用可能な状態を維持する必要がある可能性のある、古い設定形式、インストール台帳のレイアウト、修復シムを対象とします。

リリース時の確認では、両方のレジストリをチェックする必要があります。対応するランタイムまたは設定の互換性レコードが期限切れになったという理由だけで、Doctor の移行処理を削除しないでください。まず、その修復を引き続き必要とするサポート対象のアップグレードパスが存在しないことを確認してください。プロバイダーとチャネルがコアの外へ移るにつれて、Plugin の所有権と設定範囲が変わる可能性があるため、リリース計画時には各代替手段の注釈も再検証してください。

## 非推奨化ポリシー

OpenClaw は、文書化された Plugin コントラクトを、その代替を導入するリリースと同じリリースで削除すべきではありません。移行手順:

1. 新しいコントラクトを追加します。
2. 古い動作を名前付き互換性アダプター経由で接続した状態に保ちます。
3. Plugin 作成者が対応可能になった時点で、診断または警告を出力します。
4. 代替手段とスケジュールを文書化します。
5. 古いパスと新しいパスの両方をテストします。
6. 告知した移行期間が経過するまで待ちます。
7. 破壊的変更を伴うリリースとして明示的に承認された場合にのみ削除します。

非推奨レコードには、警告開始日、代替手段、ドキュメントへのリンク、および警告開始から3か月以内の最終削除日を含める必要があります。メンテナーが永続的な互換性であると明示的に決定し、代わりに `active` としてマークしない限り、削除期限が定められていない非推奨の互換性パスを追加しないでください。

## 現在の互換性対象領域

現在、レジストリでは以下の領域にわたる約70個の互換性コードを追跡しています。新しい Plugin コードでは、各領域および個別の移行ガイドに記載された代替を使用してください。既存の Plugin は、ドキュメント、診断、リリースノートで削除期間が告知されるまで、互換性パスを引き続き使用できます。

- `openclaw/plugin-sdk/compat` などの従来の広範な SDK インポート
- 従来のフックのみの Plugin 形式と `before_agent_start`
- Plugin が `gateway_stop` へ移行する間の、従来の `api.on("deactivate", ...)` クリーンアップフック名
- Plugin が `register(api)` へ移行する間の、従来の `activate(api)` Plugin エントリーポイント
- `openclaw/extension-api`、`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/command-auth` のステータスビルダー、`openclaw/plugin-sdk/test-utils`（目的別の `openclaw/plugin-sdk/*` テストサブパスで置き換え）、および `ClawdbotConfig` / `OpenClawSchemaType` 型エイリアスなどの従来の SDK エイリアス
- バンドル済み Plugin の許可リストと有効化動作
- 従来のプロバイダー／チャネル環境変数マニフェストメタデータ
- プロバイダーが明示的なカタログ、認証、思考、リプレイ、トランスポートの各フックへ移行する間の、従来のプロバイダー Plugin フックと型エイリアス
- `api.runtime.taskFlow`、`api.runtime.subagent.getSession`、`api.runtime.stt`、および非推奨の `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)` などの従来のランタイムエイリアス
- WhatsApp の `WebInboundMessage` のフラットなコールバックフィールド（以下を参照）
- WhatsApp の `WebInboundMessage` のトップレベル受け入れ判定フィールド（以下を参照）
- メモリ Plugin が `registerMemoryCapability` へ移行する間の、従来のメモリ Plugin 分割登録
- 埋め込みプロバイダーが `api.registerEmbeddingProvider(...)` と `contracts.embeddingProviders` へ移行する間の、従来のメモリ固有の埋め込みプロバイダー登録
- ネイティブメッセージスキーマ、メンション制御、受信エンベロープの形式設定、承認機能のネストに対応する従来のチャネル SDK ヘルパー
- Plugin が `openclaw/plugin-sdk/channel-route` へ移行する間の、従来のチャネルルートキーおよび比較可能なターゲット用ヘルパーのエイリアス
- マニフェストのコントリビューション所有権に置き換えられるアクティベーションヒント
- セットアップ記述子がコールドな `setup.requiresRuntime: false` メタデータへ移行する間の `setup-api` ランタイムフォールバック
- プロバイダーカタログフックが `catalog.run(...)` へ移行する間のプロバイダー `discovery` フック
- チャネルパッケージが `openclaw.channel.exposure` へ移行する間のチャネル `showConfigured` / `showInSetup` メタデータ
- Doctor が運用者を `agentRuntime` へ移行する間の、従来のランタイムポリシー設定キー
- レジストリ優先の `channelConfigs` メタデータが導入される間の、生成されたバンドル済みチャネル設定メタデータのフォールバック
- 修復フローが運用者を `openclaw plugins registry --refresh` と `openclaw doctor --fix` へ移行する間の、永続化された Plugin レジストリ無効化およびインストール移行用の環境変数フラグ
- Doctor が `plugins.entries.<plugin>.config` へ移行する間の、従来の Plugin 所有のウェブ検索、ウェブ取得、x_search の設定パス
- インストールメタデータが状態管理された Plugin 台帳へ移行する間の、従来の `plugins.installs` に記述された設定とバンドル済み Plugin のロードパスエイリアス

### WhatsApp 受信コールバックのフラットエイリアス

WhatsApp のランタイムコールバックは `WebInboundMessage` を渡します。これには、正規のネストされた `event`、`payload`、`quote`、`group`、`platform` コンテキストに加え、リリース済みコールバックフィールド用の非推奨のフラットエイリアスが含まれます。新しいコールバックコードでは、ネストされたコンテキストを読み取る必要があります。整理されたネスト形式のコールバックメッセージを構築するコードでは `WebInboundCallbackMessage` を使用できます。古いフラット形式のテストメッセージまたは Plugin メッセージを引き続き挿入する互換性リスナーでは、`LegacyFlatWebInboundMessage` または `WebInboundMessageInput` を使用してください。

フラットエイリアスは **2026-08-30** まで利用できます。この期間が適用されるのはフラットエイリアスへのアクセスのみであり、正規のランタイムコントラクトであるネスト形式には適用されません。各フラットエイリアスの TypeScript `@deprecated` 注釈には、対応する正確なネスト先が記載されています。一般的な例:

- `id`、`timestamp`、`isBatched` は `event` 配下へ移動します。
- `body`、`mediaPath`、`mediaType`、`mediaFileName`、`mediaUrl`、`location`、`untrustedStructuredContext` は `payload` 配下へ移動します。
- `to`、`chatId`、送信者／自己フィールド、`sendComposing`、`reply(...)`、`sendMedia(...)` は `platform` 配下へ移動します。
- `replyTo*` フィールドは `quote` 配下へ移動し、グループの件名／参加者／メンションフィールドは `group` 配下へ移動します。

`payload.untrustedStructuredContext` は、受信したプロバイダーペイロードから抽出されます。Plugin は、その `payload` を信頼できる情報として扱う前に、`label`、`source`、`type` を確認する必要があります。

### WhatsApp 受信の受け入れ判定フィールド

受け入れられた WhatsApp コールバックメッセージには、メッセージを受け入れたアクセス制御の決定を表す、公開しても安全なエンベロープである `admission` が含まれます。新しいコールバックコードでは、以前のトップレベル受け入れ判定フィールドではなく、`msg.admission` から受け入れ判定情報を読み取る必要があります。

トップレベルフィールドは **2026-08-30** まで利用できます。各フィールドの TypeScript `@deprecated` 注釈には、その代替先が記載されています。

- `from` と `conversationId` は `admission.conversation.id` へ移動します。
- `accountId` は `admission.accountId` へ移動します。
- `accessControlPassed` は `admission.ingress.decision === "allow"` から導出される互換性ビューです。すでに `admission` を持つメッセージでは、従来のブール値に書き込んでも受信グラフは書き換えられません。
- `chatType` は `admission.conversation.kind` へ移動します。

## Plugin インスペクターパッケージ

Plugin インスペクターは、バージョン管理された互換性およびマニフェストコントラクトに基づく独立したパッケージ／リポジトリとして、OpenClaw のコアリポジトリ外に配置する必要があります。初期リリースの CLI は次のようにします。

```sh
openclaw-plugin-inspector ./my-plugin
```

マニフェスト／スキーマの検証、チェック対象のコントラクト互換性バージョン、インストール／ソースメタデータのチェック、コールドパスのインポートチェック、非推奨／互換性警告を出力する必要があります。CI 注釈で安定した機械可読出力を得るには `--json` を使用します。OpenClaw コアは、インスペクターが利用できるコントラクトとフィクスチャを公開する必要がありますが、メインの `openclaw` パッケージからインスペクターのバイナリを公開すべきではありません。

### メンテナー向け受け入れ検証レーン

OpenClaw の Plugin パッケージに対して外部インスペクターを検証する場合は、インストール可能パッケージの受け入れ検証レーンに、Crabbox を基盤とする Blacksmith Testbox を使用します。パッケージのビルド後、クリーンな OpenClaw チェックアウトから実行します。

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

このレーンでは外部 npm パッケージをインストールし、リポジトリ外にクローンされた Plugin パッケージを検査する可能性があるため、メンテナーの明示的な選択によってのみ実行するようにしてください。ローカルリポジトリのガードは、SDK のエクスポートマップ、互換性レジストリのメタデータ、非推奨 SDK インポートの段階的削減、バンドル済み拡張機能のインポート境界を対象とします。Testbox によるインスペクターの検証は、外部 Plugin 作成者が利用する形でパッケージを対象とします。

## リリースノート

互換性パスが `removal-pending` または `removed` に移行する前に、リリースノートへ、予定されている Plugin の非推奨化、その対象日、移行ドキュメントへのリンクを含める必要があります。

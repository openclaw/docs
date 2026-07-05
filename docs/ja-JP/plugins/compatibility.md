---
read_when:
    - OpenClaw Pluginを保守している
    - Plugin の互換性警告が表示される
    - Plugin SDK またはマニフェストの移行を計画している
summary: Plugin 互換性契約、非推奨メタデータ、移行の期待事項
title: Plugin の互換性
x-i18n:
    generated_at: "2026-07-05T11:32:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26f737e40175652cb24327c91d2af9dbf72b1b254011115f5b512a309707711c
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw は、古い Plugin 契約を削除する前に、名前付きの互換性
アダプターを通じて接続したままにします。これにより、SDK、マニフェスト、セットアップ、設定、エージェントランタイム契約が
進化する間、既存のバンドル済みおよび外部
Plugin が保護されます。

## 互換性レジストリ

Plugin 互換性契約は、コアレジストリ
`src/plugins/compat/registry.ts` で追跡されます。各レコードには次が含まれます。

- 安定した互換性コード
- ステータス: `active`、`deprecated`、`removal-pending`、または `removed`
- オーナー: `sdk`、`config`、`setup`、`channel`、`provider`、`plugin-execution`、
  `agent-runtime`、または `core`
- 該当する場合の導入日と非推奨日
- 置き換えガイダンス
- 古い動作と新しい動作をカバーするドキュメント、診断、テスト

このレジストリは、メンテナーの計画と将来の Plugin
インスペクターチェックの情報源です。Plugin 向けの動作が変わる場合は、アダプターを追加するのと同じ変更で
互換性レコードを追加または更新してください。

Doctor の修復と移行の互換性は、
`src/commands/doctor/shared/deprecation-compat.ts` で別途追跡されます。これらのレコードは、ランタイム互換性パスが削除された後も
利用可能なままにする必要がある可能性のある、古い
設定形状、インストール台帳レイアウト、修復シムをカバーします。

リリース時の点検では、両方のレジストリを確認する必要があります。対応するランタイムまたは設定の互換性レコードが期限切れになったという理由だけで、Doctor
移行を削除しないでください。まず、その修復をまだ必要とするサポート対象のアップグレードパスがないことを確認してください。プロバイダーとチャネルがコアの外へ移動するにつれて、Plugin の所有権と設定フットプリントは変わる可能性があるため、リリース計画中には各置き換え注釈も再検証してください。

## 非推奨ポリシー

OpenClaw は、文書化済みの Plugin 契約を、その置き換えを導入するのと同じリリースで削除すべきではありません。移行手順:

1. 新しい契約を追加する。
2. 古い動作を名前付きの互換性アダプターを通じて接続したままにする。
3. Plugin 作者が対応できる場合は、診断または警告を出力する。
4. 置き換えとタイムラインを文書化する。
5. 古いパスと新しいパスの両方をテストする。
6. 告知された移行期間が経過するまで待つ。
7. 明示的な破壊的リリース承認がある場合にのみ削除する。

非推奨レコードには、警告開始日、置き換え、ドキュメントリンク、警告開始から3か月以内の最終削除日を含める必要があります。メンテナーがそれを永続的な互換性として明示的に決定し、代わりに `active` とマークしない限り、終了期限のない
削除期間を持つ非推奨互換性パスを追加しないでください。

## 現在の互換性領域

レジストリは現在、これらの領域全体で約70個の互換性コードを追跡しています。新しい Plugin コードは、各領域および特定の移行ガイドにある置き換えを使用するべきです。既存の Plugin は、ドキュメント、診断、リリースノートで削除期間が告知されるまで、互換性パスを使い続けることができます。

- `openclaw/plugin-sdk/compat` などのレガシーな広範 SDK インポート
- レガシーなフック専用 Plugin 形状と `before_agent_start`
- Plugin が `gateway_stop` へ移行する間のレガシーな `api.on("deactivate", ...)` クリーンアップフック名
- Plugin が `register(api)` へ移行する間のレガシーな `activate(api)` Plugin エントリーポイント
- `openclaw/extension-api`、
  `openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/command-auth`
  ステータスビルダー、`openclaw/plugin-sdk/test-utils` (焦点を絞った
  `openclaw/plugin-sdk/*` テストサブパスに置き換え)、および `ClawdbotConfig` /
  `OpenClawSchemaType` 型エイリアスなどのレガシー SDK エイリアス
- バンドル済み Plugin の許可リストと有効化動作
- レガシーなプロバイダー/チャネル env-var マニフェストメタデータ
- プロバイダーが明示的なカタログ、認証、思考、リプレイ、トランスポートフックへ移行する間の、レガシーなプロバイダー Plugin フックと型エイリアス
- `api.runtime.taskFlow`、
  `api.runtime.subagent.getSession`、`api.runtime.stt`、および非推奨の
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)` などのレガシーランタイムエイリアス
- WhatsApp `WebInboundMessage` のフラットなコールバックフィールド (下記参照)
- WhatsApp `WebInboundMessage` のトップレベル入場フィールド (下記参照)
- メモリ Plugin が `registerMemoryCapability` へ移行する間のレガシーなメモリ Plugin 分割登録
- 埋め込みプロバイダーが `api.registerEmbeddingProvider(...)` と
  `contracts.embeddingProviders` へ移行する間の、レガシーなメモリ固有の埋め込みプロバイダー登録
- ネイティブメッセージスキーマ、メンションゲート、インバウンドエンベロープ整形、承認ケイパビリティのネストのためのレガシーチャネル SDK ヘルパー
- Plugin が `openclaw/plugin-sdk/channel-route` へ移行する間の、レガシーチャネルルートキーと比較可能ターゲットヘルパーのエイリアス
- マニフェストのコントリビューション所有権に置き換えられるアクティベーションヒント
- セットアップ記述子がコールドな
  `setup.requiresRuntime: false` メタデータへ移行する間の `setup-api` ランタイムフォールバック
- プロバイダーカタログフックが
  `catalog.run(...)` へ移行する間のプロバイダー `discovery` フック
- チャネルパッケージが
  `openclaw.channel.exposure` へ移行する間のチャネル `showConfigured` / `showInSetup` メタデータ
- Doctor がオペレーターを
  `agentRuntime` へ移行する間のレガシーランタイムポリシー設定キー
- レジストリ優先の
  `channelConfigs` メタデータが導入される間の、生成されたバンドル済みチャネル設定メタデータフォールバック
- 修復フローがオペレーターを `openclaw plugins registry --refresh`
  と `openclaw doctor --fix` へ移行する間の、永続化された Plugin レジストリ無効化およびインストール移行 env フラグ
- Doctor がそれらを `plugins.entries.<plugin>.config` へ移行する間の、レガシーな Plugin 所有の web search、web fetch、x_search 設定パス
- インストールメタデータが状態管理の Plugin 台帳へ移動する間の、レガシーな `plugins.installs` 作成済み設定とバンドル済み Plugin ロードパスエイリアス

### WhatsApp インバウンドコールバックのフラットエイリアス

WhatsApp ランタイムコールバックは `WebInboundMessage` を配信します。正規の
ネストされた `event`、`payload`、`quote`、`group`、`platform` コンテキストに加えて、出荷済みコールバックフィールド用の非推奨フラットエイリアスを含みます。新しいコールバックコードは、ネストされたコンテキストを読むべきです。クリーンなネスト済みコールバックメッセージを構築するコードは `WebInboundCallbackMessage` を使用できます。古いフラットなテストまたは Plugin メッセージをまだ注入する互換性リスナーは、
`LegacyFlatWebInboundMessage` または `WebInboundMessageInput` を使用してください。

フラットエイリアスは **2026-08-30** まで利用できます。この期間が適用されるのは
フラットエイリアスアクセスのみであり、正規のランタイム契約であるネストされた形状には適用されません。各フラットエイリアスの TypeScript `@deprecated` 注釈は、正確なネスト先の置き換えを示します。一般的な例:

- `id`、`timestamp`、`isBatched` は `event` の下へ移動します。
- `body`、`mediaPath`、`mediaType`、`mediaFileName`、`mediaUrl`、`location`、
  `untrustedStructuredContext` は `payload` の下へ移動します。
- `to`、`chatId`、送信者/自身フィールド、`sendComposing`、`reply(...)`、および
  `sendMedia(...)` は `platform` の下へ移動します。
- `replyTo*` フィールドは `quote` の下へ移動します。グループの件名/参加者/メンション
  フィールドは `group` の下へ移動します。

`payload.untrustedStructuredContext` は、インバウンドプロバイダー
ペイロードから抽出されます。Plugin は、その `payload` を信頼できるものとして扱う前に、
`label`、`source`、`type` を検査するべきです。

### WhatsApp インバウンド入場フィールド

受け入れられた WhatsApp コールバックメッセージは、メッセージを許可したアクセス制御判断の公開しても安全な
エンベロープである `admission` を保持します。新しいコールバックコードは、古いトップレベル入場フィールドではなく、
`msg.admission` から入場ファクトを読むべきです。

トップレベルフィールドは **2026-08-30** まで利用できます。各フィールドの
TypeScript `@deprecated` 注釈は置き換え先を示します。

- `from` と `conversationId` は `admission.conversation.id` へ移動します。
- `accountId` は `admission.accountId` へ移動します。
- `accessControlPassed` は
  `admission.ingress.decision === "allow"` の派生互換ビューです。すでに
  `admission` を保持するメッセージでは、レガシー boolean に書き込んでも ingress
  グラフは書き換えられません。
- `chatType` は `admission.conversation.kind` へ移動します。

## Plugin インスペクターパッケージ

Plugin インスペクターは、バージョン管理された互換性契約とマニフェスト契約に基づく
別個のパッケージ/リポジトリとして、コア OpenClaw リポジトリの外部に置くべきです。初日の CLI は次のようにするべきです。

```sh
openclaw-plugin-inspector ./my-plugin
```

これは、マニフェスト/スキーマ検証、チェック対象の契約互換性バージョン、インストール/ソースメタデータチェック、コールドパスインポートチェック、非推奨/互換性警告を出力するべきです。CI 注釈で安定した機械可読出力を得るには `--json` を使用してください。OpenClaw コアは、インスペクターが利用できる契約とフィクスチャを公開するべきですが、メインの `openclaw` パッケージからインスペクターバイナリを公開するべきではありません。

### メンテナー受け入れレーン

外部インスペクターを OpenClaw Plugin
パッケージに対して検証する際は、インストール可能パッケージの受け入れレーンに Crabbox バックの Blacksmith Testbox を使用してください。パッケージがビルドされた後、クリーンな OpenClaw チェックアウトから実行します。

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

このレーンはメンテナー向けのオプトインのままにしてください。外部 npm
パッケージをインストールし、リポジトリ外にクローンされた Plugin パッケージを検査する可能性があるためです。ローカルリポジトリのガードは、SDK エクスポートマップ、互換性レジストリメタデータ、非推奨 SDK インポートの削減、バンドル済み拡張のインポート境界をカバーします。Testbox インスペクターの証明は、外部 Plugin 作者が利用するものとしてパッケージをカバーします。

## リリースノート

リリースノートには、互換性パスが
`removal-pending` または `removed` へ移行する前に、対象日と移行ドキュメントへのリンクを含めて、予定されている Plugin 非推奨を含めるべきです。

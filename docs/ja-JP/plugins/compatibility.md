---
read_when:
    - OpenClaw Plugin を保守している
    - Plugin 互換性警告が表示される
    - Plugin SDK またはマニフェストの移行を計画している
summary: Plugin 互換性契約、非推奨メタデータ、移行の期待事項
title: Plugin の互換性
x-i18n:
    generated_at: "2026-06-27T12:14:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e17881c393e3649cb6accb13996d83a855f434735da2e84738f823ac4eba0f5
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw は、古い Plugin 契約を削除する前に、名前付き互換性
アダプターを通して接続したままにします。これにより、SDK、マニフェスト、
セットアップ、設定、エージェントランタイムの契約が進化する間も、既存の
同梱および外部 Plugin が保護されます。

## 互換性レジストリ

Plugin 互換性契約は、`src/plugins/compat/registry.ts` のコアレジストリで
追跡されます。

各レコードには次が含まれます。

- 安定した互換性コード
- ステータス: `active`、`deprecated`、`removal-pending`、または `removed`
- 所有者: SDK、設定、セットアップ、チャンネル、プロバイダー、Plugin 実行、
  エージェントランタイム、またはコア
- 該当する場合は導入日と非推奨日
- 置き換えガイダンス
- 古い動作と新しい動作をカバーするドキュメント、診断、テスト

このレジストリは、メンテナーの計画と将来の Plugin インスペクター検査の
情報源です。Plugin 向けの動作が変わる場合は、アダプターを追加する同じ変更で
互換性レコードを追加または更新してください。

Doctor の修復および移行の互換性は、
`src/commands/doctor/shared/deprecation-compat.ts` で別途追跡されます。これらの
レコードは、ランタイム互換性パスが削除された後も利用可能にしておく必要が
あるかもしれない古い設定形状、インストール台帳レイアウト、修復 shim を
カバーします。

リリーススイープでは両方のレジストリを確認する必要があります。一致する
ランタイムまたは設定の互換性レコードが期限切れになったという理由だけで、
doctor 移行を削除しないでください。まず、その修復をまだ必要とするサポート
対象のアップグレードパスがないことを確認してください。また、プロバイダーや
チャンネルがコアの外へ移動するにつれて Plugin の所有権と設定フットプリントが
変わる可能性があるため、リリース計画中に各置き換え注釈を再検証してください。

## Plugin インスペクターパッケージ

Plugin インスペクターは、バージョン管理された互換性契約とマニフェスト契約に
基づく、独立したパッケージ/リポジトリとしてコア OpenClaw リポジトリの外に
置くべきです。

初日の CLI は次のようにします。

```sh
openclaw-plugin-inspector ./my-plugin
```

出力には次を含めるべきです。

- マニフェスト/スキーマ検証
- チェック対象の契約互換性バージョン
- インストール/ソースメタデータ検査
- コールドパスインポート検査
- 非推奨および互換性の警告

CI 注釈で安定した機械可読出力を得るには `--json` を使用します。OpenClaw
コアはインスペクターが消費できる契約とフィクスチャを公開するべきですが、
メインの `openclaw` パッケージからインスペクターバイナリを公開するべきでは
ありません。

### メンテナー受け入れレーン

外部インスペクターを OpenClaw Plugin パッケージに対して検証する際は、
インストール可能パッケージの受け入れレーンに Crabbox 支援の Blacksmith
Testbox を使用します。パッケージのビルド後、クリーンな OpenClaw チェックアウト
から実行します。

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

このレーンは、外部 npm パッケージをインストールし、リポジトリ外にクローンされた
Plugin パッケージを検査する可能性があるため、メンテナー向けのオプトインに
してください。ローカルリポジトリのガードは、SDK エクスポートマップ、互換性
レジストリメタデータ、非推奨 SDK インポートの解消、同梱拡張機能のインポート
境界をカバーします。Testbox インスペクターの証明は、外部 Plugin 作者が消費する
形のパッケージをカバーします。

## 非推奨ポリシー

OpenClaw は、置き換えを導入する同じリリースで、文書化された Plugin 契約を
削除するべきではありません。

移行シーケンスは次のとおりです。

1. 新しい契約を追加する。
2. 古い動作を名前付き互換性アダプター経由で接続したままにする。
3. Plugin 作者が対応できる場合は診断または警告を出す。
4. 置き換えとタイムラインを文書化する。
5. 古いパスと新しいパスの両方をテストする。
6. 告知された移行期間が経過するまで待つ。
7. 明示的な破壊的リリース承認がある場合にのみ削除する。

非推奨レコードには、警告開始日、置き換え、ドキュメントリンク、警告開始から
3 か月以内の最終削除日を含める必要があります。メンテナーが明示的に恒久的な
互換性であると判断し、代わりに `active` とマークしない限り、期限のない削除
期間を持つ非推奨互換性パスを追加しないでください。

## 現在の互換性領域

現在の互換性レコードには次が含まれます。

- `openclaw/plugin-sdk/compat` などの従来の広範な SDK インポート
- 従来のフックのみの Plugin 形状と `before_agent_start`
- Plugin が `gateway_stop` へ移行する間の、従来の
  `api.on("deactivate", ...)` クリーンアップフック名
- Plugin が `register(api)` へ移行する間の、従来の `activate(api)` Plugin
  エントリーポイント
- `openclaw/extension-api`、`openclaw/plugin-sdk/channel-runtime`、
  `openclaw/plugin-sdk/command-auth` ステータスビルダー、
  `openclaw/plugin-sdk/test-utils`（焦点を絞った `openclaw/plugin-sdk/*`
  テストサブパスに置き換え）、および `ClawdbotConfig` /
  `OpenClawSchemaType` 型エイリアスなどの従来の SDK エイリアス
- 同梱 Plugin の許可リストと有効化動作
- 従来のプロバイダー/チャンネル env-var マニフェストメタデータ
- プロバイダーが明示的なカタログ、認証、思考、リプレイ、トランスポートフックへ
  移行する間の、従来のプロバイダー Plugin フックと型エイリアス
- `api.runtime.taskFlow`、`api.runtime.subagent.getSession`、`api.runtime.stt`、
  非推奨の `api.runtime.config.loadConfig()` /
  `api.runtime.config.writeConfigFile(...)` などの従来のランタイムエイリアス
- コールバック利用者がネストされた `WebInboundCallbackMessage` の `event`、
  `payload`、`quote`、`group`、`platform` コンテキストへ移行する間の、
  WhatsApp `WebInboundMessage` の `body`、`chatId`、`reply(...)`、
  `mediaPath` などのフラットなコールバックフィールド
- コールバック利用者が `admission` エンベロープへ移行する間の、WhatsApp
  `WebInboundMessage` の `from`、`conversationId`、`accountId`、
  `accessControlPassed`、`chatType` などのトップレベル admission フィールド
- メモリ Plugin が `registerMemoryCapability` へ移行する間の、従来の
  メモリ Plugin 分割登録
- 埋め込みプロバイダーが `api.registerEmbeddingProvider(...)` と
  `contracts.embeddingProviders` へ移行する間の、従来のメモリ固有の埋め込み
  プロバイダー登録
- ネイティブメッセージスキーマ、メンションゲーティング、受信エンベロープ形式、
  承認機能のネストに関する従来のチャンネル SDK ヘルパー
- Plugin が `openclaw/plugin-sdk/channel-route` へ移行する間の、従来の
  チャンネルルートキーと comparable-target ヘルパーエイリアス
- マニフェストのコントリビューション所有権に置き換えられつつある有効化ヒント
- セットアップ記述子がコールドな `setup.requiresRuntime: false` メタデータへ
  移行する間の `setup-api` ランタイムフォールバック
- プロバイダーカタログフックが `catalog.run(...)` へ移行する間の、プロバイダー
  `discovery` フック
- チャンネルパッケージが `openclaw.channel.exposure` へ移行する間の、チャンネル
  `showConfigured` / `showInSetup` メタデータ
- doctor がオペレーターを `agentRuntime` へ移行する間の、従来の runtime-policy
  設定キー
- レジストリ優先の `channelConfigs` メタデータが入るまでの、生成された同梱
  チャンネル設定メタデータフォールバック
- 修復フローがオペレーターを `openclaw plugins registry --refresh` と
  `openclaw doctor --fix` へ移行する間の、永続化された Plugin レジストリ無効化
  およびインストール移行 env フラグ
- doctor が `plugins.entries.<plugin>.config` へ移行する間の、従来の Plugin 所有の
  Web 検索、Web フェッチ、x_search 設定パス
- インストールメタデータが状態管理の Plugin 台帳へ移行する間の、従来の
  `plugins.installs` 記述設定と同梱 Plugin ロードパスエイリアス

新しい Plugin コードでは、レジストリと具体的な移行ガイドに記載された置き換えを
優先するべきです。既存の Plugin は、ドキュメント、診断、リリースノートで削除
期間が告知されるまで、互換性パスを使い続けることができます。

### WhatsApp 受信コールバックのフラットエイリアス

WhatsApp ランタイムコールバックは `WebInboundMessage` を届けます。これは標準の
ネストされた `event`、`payload`、`quote`、`group`、`platform` コンテキストに、
出荷済みコールバックフィールド用の非推奨フラットエイリアスを加えたものです。
新しいコールバックコードはネストされたコンテキストを読むべきです。クリーンな
ネスト済みコールバックメッセージを構築するコードは `WebInboundCallbackMessage`
を使用できます。古いフラットなテストメッセージまたは Plugin メッセージをまだ
注入する互換性リスナーは、`LegacyFlatWebInboundMessage` または
`WebInboundMessageInput` を使用するべきです。

フラットエイリアスは **2026-08-30** まで利用できます。この削除期間はフラット
エイリアスアクセスにのみ適用されます。ネストされたコールバック形状が標準の
ランタイム契約です。各フラットエイリアス上の TypeScript `@deprecated` 注釈は、
正確なネスト先の置き換え名を示します。一般的な例:

- `id`、`timestamp`、`isBatched` は `event` の下へ移動します。
- `body`、`mediaPath`、`mediaType`、`mediaFileName`、`mediaUrl`、`location`、
  `untrustedStructuredContext` は `payload` の下へ移動します。
- `to`、`chatId`、送信者/自分フィールド、`sendComposing`、`reply(...)`、
  `sendMedia(...)` は `platform` の下へ移動します。
- `replyTo*` フィールドは `quote` の下へ、グループの件名/参加者/メンション
  フィールドは `group` の下へ移動します。

`payload.untrustedStructuredContext` は受信プロバイダーペイロードから抽出されます。
Plugin はその `payload` を信頼できるものとして扱う前に、`label`、`source`、`type`
を確認するべきです。

### WhatsApp 受信 Admission フィールド

受け入れられた WhatsApp コールバックメッセージは、メッセージを受け入れた
アクセス制御判断の公開しても安全なエンベロープである `admission` を持つように
なりました。新しいコールバックコードは、古いトップレベル admission フィールド
ではなく、`msg.admission` から admission 情報を読むべきです。

トップレベルフィールドは **2026-08-30** まで利用できます。TypeScript
`@deprecated` 注釈は各置き換え名を示します。

- `from` と `conversationId` は `admission.conversation.id` へ移動します。
- `accountId` は `admission.accountId` へ移動します。
- `accessControlPassed` は
  `admission.ingress.decision === "allow"` から導出される互換性ビューです。
  すでに `admission` を持つメッセージでは、従来の真偽値を書き込んでも ingress
  グラフは書き換えられません。
- `chatType` は `admission.conversation.kind` へ移動します。

## リリースノート

リリースノートには、対象日と移行ドキュメントへのリンク付きで、今後の Plugin
非推奨化を含めるべきです。その警告は、互換性パスが `removal-pending` または
`removed` へ移動する前に行う必要があります。

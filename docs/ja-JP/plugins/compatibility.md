---
read_when:
    - OpenClaw Pluginを保守する
    - Plugin の互換性警告が表示される
    - プラグイン SDK またはマニフェストの移行を計画している場合
summary: Plugin 互換性コントラクト、非推奨メタデータ、移行に関する期待事項
title: Plugin の互換性
x-i18n:
    generated_at: "2026-04-30T05:24:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 344dbaac86db7259adc09bc91b7fbe7ba540fc6fdd96cc422918ccf2c34d9cec
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw は、古いプラグイン契約を削除する前に、名前付きの互換性アダプターを通じて接続された状態に保ちます。これにより、SDK、マニフェスト、セットアップ、設定、エージェントランタイム契約が進化する間も、既存のバンドル済みプラグインと外部プラグインが保護されます。

## 互換性レジストリ

プラグイン互換性契約は、`src/plugins/compat/registry.ts` のコアレジストリで追跡されます。

各レコードには次のものがあります。

- 安定した互換性コード
- ステータス: `active`、`deprecated`、`removal-pending`、または `removed`
- 所有者: SDK、設定、セットアップ、チャンネル、プロバイダー、プラグイン実行、エージェントランタイム、
  またはコア
- 該当する場合の導入日と非推奨日
- 置き換えのガイダンス
- 古い動作と新しい動作をカバーするドキュメント、診断、テスト

このレジストリは、メンテナーの計画と将来のプラグインインスペクターチェックの情報源です。プラグイン向けの動作が変更される場合は、アダプターを追加する同じ変更で互換性レコードを追加または更新してください。

doctor 修復と移行の互換性は、`src/commands/doctor/shared/deprecation-compat.ts` で別途追跡されます。これらのレコードは、ランタイム互換性パスが削除された後も利用可能にしておく必要がある可能性のある、古い設定形状、インストール台帳レイアウト、修復シムをカバーします。

リリーススイープでは両方のレジストリを確認する必要があります。一致するランタイムまたは設定の互換性レコードが期限切れになったという理由だけで、doctor 移行を削除しないでください。まず、その修復をまだ必要とするサポート対象のアップグレードパスがないことを確認してください。また、プロバイダーやチャンネルがコアの外へ移動するにつれてプラグインの所有権と設定の範囲は変わる可能性があるため、リリース計画中に各置き換え注釈を再検証してください。

## Plugin インスペクターパッケージ

プラグインインスペクターは、バージョン管理された互換性契約とマニフェスト契約に基づく、別個のパッケージ/リポジトリとしてコア OpenClaw リポジトリの外に置くべきです。

初日の CLI は次のようにする必要があります。

```sh
openclaw-plugin-inspector ./my-plugin
```

次のものを出力する必要があります。

- マニフェスト/スキーマ検証
- チェック対象の契約互換性バージョン
- インストール/ソースメタデータのチェック
- コールドパスインポートチェック
- 非推奨と互換性の警告

CI 注釈で安定した機械可読出力を得るには `--json` を使用してください。OpenClaw コアは、インスペクターが利用できる契約とフィクスチャを公開するべきですが、メインの `openclaw` パッケージからインスペクターバイナリを公開するべきではありません。

### メンテナー受け入れレーン

外部インスペクターを OpenClaw プラグインパッケージに対して検証するときは、インストール可能パッケージの受け入れレーンに Blacksmith Testbox を使用してください。パッケージをビルドした後、クリーンな OpenClaw チェックアウトから実行します。

```sh
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
blacksmith testbox stop <tbx_id>
```

このレーンは、外部 npm パッケージをインストールし、リポジトリ外にクローンされたプラグインパッケージを検査する可能性があるため、メンテナー向けのオプトインのままにしてください。ローカルリポジトリのガードは、SDK エクスポートマップ、互換性レジストリメタデータ、非推奨 SDK インポートの削減、バンドル済み拡張機能のインポート境界をカバーします。Testbox インスペクターの証明は、外部プラグイン作者が利用する形のパッケージをカバーします。

## 非推奨ポリシー

OpenClaw は、置き換えを導入する同じリリースで、文書化されたプラグイン契約を削除するべきではありません。

移行手順は次のとおりです。

1. 新しい契約を追加する。
2. 名前付きの互換性アダプターを通じて古い動作を接続したままにする。
3. プラグイン作者が対応できる場合は診断または警告を出力する。
4. 置き換えとタイムラインを文書化する。
5. 古いパスと新しいパスの両方をテストする。
6. 発表された移行期間が経過するまで待つ。
7. 明示的な破壊的リリース承認がある場合にのみ削除する。

非推奨レコードには、警告開始日、置き換え、ドキュメントリンク、警告開始から3か月以内の最終削除日を含める必要があります。メンテナーが永続的な互換性であると明示的に判断し、代わりに `active` としてマークしない限り、期限のない削除期間を持つ非推奨互換性パスを追加しないでください。

## 現在の互換性領域

現在の互換性レコードには次のものが含まれます。

- `openclaw/plugin-sdk/compat` などのレガシーな広範囲 SDK インポート
- レガシーなフックのみのプラグイン形状と `before_agent_start`
- プラグインが `register(api)` へ移行する間のレガシーな `activate(api)` プラグインエントリーポイント
- `openclaw/extension-api`、
  `openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/command-auth`
  ステータスビルダー、`openclaw/plugin-sdk/test-utils`（焦点を絞った
  `openclaw/plugin-sdk/*` テストサブパスに置き換え）、および `ClawdbotConfig` /
  `OpenClawSchemaType` 型エイリアスなどのレガシー SDK エイリアス
- バンドル済みプラグインの許可リストと有効化の動作
- レガシーなプロバイダー/チャンネル env-var マニフェストメタデータ
- プロバイダーが明示的なカタログ、認証、思考、リプレイ、トランスポートフックへ移行する間の、レガシーなプロバイダープラグインフックと型エイリアス
- `api.runtime.taskFlow`、
  `api.runtime.subagent.getSession`、`api.runtime.stt`、および非推奨の
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
  などのレガシーランタイムエイリアス
- メモリプラグインが `registerMemoryCapability` へ移行する間の、レガシーなメモリプラグイン分割登録
- ネイティブメッセージスキーマ、メンションゲート、インバウンドエンベロープ整形、承認機能の入れ子構造のためのレガシーチャンネル SDK ヘルパー
- プラグインが `openclaw/plugin-sdk/channel-route` へ移行する間の、レガシーチャンネルルートキーと comparable-target ヘルパーエイリアス
- マニフェスト寄与の所有権に置き換えられつつあるアクティベーションヒント
- `activation.onStartup` を宣言していないプラグインに対する非推奨の暗黙的な起動サイドカー読み込み。メンテナーは `OPENCLAW_DISABLE_LEGACY_IMPLICIT_STARTUP_SIDECARS=1` で将来のより厳格な動作をテストできます
- セットアップ記述子がコールドな `setup.requiresRuntime: false` メタデータへ移行する間の `setup-api` ランタイムフォールバック
- プロバイダーカタログフックが `catalog.run(...)` へ移行する間の、プロバイダー `discovery` フック
- チャンネルパッケージが `openclaw.channel.exposure` へ移行する間の、チャンネル `showConfigured` / `showInSetup` メタデータ
- doctor がオペレーターを `agentRuntime` へ移行する間の、レガシーランタイムポリシー設定キー
- レジストリ優先の `channelConfigs` メタデータが入るまでの、生成されたバンドル済みチャンネル設定メタデータフォールバック
- 修復フローがオペレーターを `openclaw plugins registry --refresh` と
  `openclaw doctor --fix` へ移行する間の、永続化されたプラグインレジストリ無効化とインストール移行 env フラグ
- doctor が `plugins.entries.<plugin>.config` へ移行する間の、レガシーなプラグイン所有の web search、web fetch、x_search 設定パス
- インストールメタデータが状態管理されたプラグイン台帳へ移行する間の、レガシーな `plugins.installs` 作成設定とバンドル済みプラグイン読み込みパスエイリアス

新しいプラグインコードでは、レジストリと特定の移行ガイドに記載された置き換えを優先するべきです。既存のプラグインは、ドキュメント、診断、リリースノートで削除期間が発表されるまで、互換性パスを使い続けることができます。

## リリースノート

リリースノートには、今後のプラグイン非推奨について、目標日と移行ドキュメントへのリンクを含める必要があります。その警告は、互換性パスが `removal-pending` または `removed` に移行する前に行う必要があります。

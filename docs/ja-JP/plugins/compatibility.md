---
read_when:
    - OpenClaw Plugin をメンテナンスしている
    - Plugin の互換性警告が表示される
    - Plugin SDK またはマニフェスト移行を計画している
summary: Plugin の互換性契約、非推奨メタデータ、移行時の期待事項
title: Plugin の互換性
x-i18n:
    generated_at: "2026-05-11T20:34:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1afd37697f55721ca8419256a6e8187c398d4b20fb11a65776b755050dd5368b
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw は、古い Plugin 契約を削除する前に、名前付き互換性
アダプターを通して接続したままにします。これにより、SDK、マニフェスト、セットアップ、設定、エージェントランタイム契約が
進化する間も、既存のバンドル済みおよび外部
Plugin が保護されます。

## 互換性レジストリ

Plugin 互換性契約は、`src/plugins/compat/registry.ts` の
コアレジストリで追跡されます。

各レコードには次の項目があります。

- 安定した互換性コード
- ステータス: `active`、`deprecated`、`removal-pending`、または `removed`
- 所有者: SDK、設定、セットアップ、チャネル、プロバイダー、Plugin 実行、エージェントランタイム、
  またはコア
- 該当する場合は導入日と非推奨日
- 置き換えのガイダンス
- 古い動作と新しい動作をカバーするドキュメント、診断、テスト

このレジストリは、メンテナーの計画と将来の Plugin インスペクター
チェックの情報源です。Plugin 向けの動作が変わる場合は、そのアダプターを追加する同じ変更で、
互換性レコードを追加または更新してください。

Doctor の修復と移行の互換性は、
`src/commands/doctor/shared/deprecation-compat.ts` で別に追跡されます。これらのレコードは、ランタイム互換性パスが削除された後も
利用可能にしておく必要がある場合がある、古い
設定形状、インストール台帳レイアウト、修復 shim を対象にします。

リリース時のスイープでは、両方のレジストリを確認する必要があります。対応するランタイムまたは設定の互換性レコードが期限切れになったという理由だけで、
doctor 移行を削除しないでください。まず、その修復をまだ必要とするサポート済みアップグレードパスが存在しないことを
確認してください。また、プロバイダーとチャネルがコアから移動するにつれて
Plugin の所有権と設定の影響範囲が変わる可能性があるため、リリース計画中に各置き換え注釈を再検証してください。

## Plugin インスペクターパッケージ

Plugin インスペクターは、バージョン管理された互換性契約とマニフェスト
契約に基づく、独立したパッケージ/リポジトリとして、コア OpenClaw リポジトリの外に置く必要があります。

初日の CLI は次のようにします。

```sh
openclaw-plugin-inspector ./my-plugin
```

次を出力する必要があります。

- マニフェスト/スキーマ検証
- チェック対象の契約互換性バージョン
- インストール/ソースメタデータチェック
- コールドパスのインポートチェック
- 非推奨と互換性の警告

CI 注釈で安定した機械可読出力を得るには `--json` を使用してください。OpenClaw
コアは、インスペクターが利用できる契約とフィクスチャを公開するべきですが、
メインの `openclaw` パッケージからインスペクターバイナリを公開するべきではありません。

### メンテナー受け入れレーン

OpenClaw Plugin パッケージに対して外部インスペクターを検証する際は、インストール可能パッケージの受け入れ
レーンに Crabbox backed Blacksmith Testbox を使用してください。
パッケージをビルドした後、クリーンな OpenClaw チェックアウトから実行します。

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

このレーンは、外部 npm
パッケージをインストールし、リポジトリ外でクローンされた Plugin パッケージを検査する場合があるため、メンテナー向けのオプトインのままにしてください。ローカルリポジトリの
ガードは、SDK エクスポートマップ、互換性レジストリメタデータ、非推奨
SDK インポートの削減、バンドル済み拡張のインポート境界をカバーします。Testbox インスペクターの
証明は、外部 Plugin 作者が消費する形のパッケージをカバーします。

## 非推奨ポリシー

OpenClaw は、置き換えを導入する同じリリースで、文書化済みの Plugin 契約を
削除するべきではありません。

移行シーケンスは次のとおりです。

1. 新しい契約を追加する。
2. 古い動作を名前付き互換性アダプター経由で接続したままにする。
3. Plugin 作者が対応できる場合に診断または警告を出力する。
4. 置き換えとタイムラインを文書化する。
5. 古いパスと新しいパスの両方をテストする。
6. 告知された移行期間が過ぎるまで待つ。
7. 明示的な破壊的リリース承認がある場合のみ削除する。

非推奨レコードには、警告開始日、置き換え、ドキュメントリンク、
および警告開始から 3 か月以内の最終削除日を含める必要があります。メンテナーが恒久的な互換性であると明示的に判断し、代わりに `active` としてマークしない限り、
期限のない削除期間を持つ非推奨互換性パスを追加しないでください。

## 現在の互換性領域

現在の互換性レコードには次が含まれます。

- `openclaw/plugin-sdk/compat` などの従来の広範な SDK インポート
- 従来の hook のみの Plugin 形状と `before_agent_start`
- Plugin が `register(api)` に移行する間の従来の `activate(api)` Plugin エントリーポイント
- `openclaw/extension-api`、
  `openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/command-auth`
  ステータスビルダー、`openclaw/plugin-sdk/test-utils`（焦点を絞った
  `openclaw/plugin-sdk/*` テストサブパスで置き換え）、および `ClawdbotConfig` /
  `OpenClawSchemaType` 型エイリアスなどの従来の SDK エイリアス
- バンドル済み Plugin の許可リストと有効化動作
- 従来のプロバイダー/チャネル env-var マニフェストメタデータ
- プロバイダーが明示的な catalog、auth、thinking、replay、transport hook に移行する間の、従来のプロバイダー Plugin hook と型エイリアス
- `api.runtime.taskFlow`、
  `api.runtime.subagent.getSession`、`api.runtime.stt`、および非推奨の
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
  などの従来のランタイムエイリアス
- メモリ Plugin が `registerMemoryCapability` に移行する間の従来のメモリ Plugin 分割登録
- ネイティブメッセージスキーマ、メンションゲーティング、
  インバウンドエンベロープ整形、承認ケイパビリティの入れ子に関する従来のチャネル SDK ヘルパー
- Plugin が `openclaw/plugin-sdk/channel-route` に移行する間の、従来のチャネルルートキーと comparable-target ヘルパーエイリアス
- マニフェスト貢献所有権で置き換えられつつあるアクティベーションヒント
- セットアップディスクリプターがコールドな
  `setup.requiresRuntime: false` メタデータに移行する間の `setup-api` ランタイムフォールバック
- プロバイダーカタログ hook が
  `catalog.run(...)` に移行する間のプロバイダー `discovery` hook
- チャネルパッケージが
  `openclaw.channel.exposure` に移行する間のチャネル `showConfigured` / `showInSetup` メタデータ
- doctor がオペレーターを
  `agentRuntime` に移行する間の従来の runtime-policy 設定キー
- registry-first の
  `channelConfigs` メタデータが導入される間の、生成されたバンドル済みチャネル設定メタデータフォールバック
- 修復フローがオペレーターを `openclaw plugins registry --refresh` と
  `openclaw doctor --fix` に移行する間の、永続化された Plugin レジストリ無効化およびインストール移行 env フラグ
- doctor がそれらを `plugins.entries.<plugin>.config` に移行する間の、従来の Plugin 所有の web search、web fetch、x_search 設定パス
- インストールメタデータが state 管理の Plugin 台帳に移行する間の、従来の `plugins.installs` 作者設定とバンドル済み Plugin ロードパスエイリアス

新しい Plugin コードは、レジストリと特定の移行ガイドに記載されている置き換えを優先する必要があります。既存の Plugin は、ドキュメント、診断、リリースノートで削除期間が告知されるまで、
互換性パスを使用し続けることができます。

## リリースノート

リリースノートには、予定されている Plugin の非推奨化について、目標日と
移行ドキュメントへのリンクを含める必要があります。その警告は、互換性
パスが `removal-pending` または `removed` に移行する前に行う必要があります。

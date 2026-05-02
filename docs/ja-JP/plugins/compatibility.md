---
read_when:
    - OpenClaw Plugin を保守する
    - Plugin の互換性警告が表示される
    - Plugin SDK またはマニフェスト移行を計画している
summary: Plugin の互換性コントラクト、非推奨メタデータ、移行に関する期待事項
title: Plugin の互換性
x-i18n:
    generated_at: "2026-05-02T05:00:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: eecf94743cf34c5b773bfa8066164f90b7c8a75667c43f3f1002d32ec1d04902
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClawは、古いPlugin契約を削除する前に、名前付きの互換性アダプターを通して接続したままにします。これにより、SDK、マニフェスト、セットアップ、設定、エージェントランタイム契約が進化する間も、既存のバンドル済みおよび外部Pluginが保護されます。

## 互換性レジストリ

Plugin互換性契約は、`src/plugins/compat/registry.ts` のコアレジストリで追跡されます。

各レコードには次のものがあります。

- 安定した互換性コード
- ステータス: `active`、`deprecated`、`removal-pending`、または `removed`
- オーナー: SDK、設定、セットアップ、チャネル、プロバイダー、Plugin実行、エージェントランタイム、
  またはコア
- 該当する場合は導入日と非推奨日
- 置き換えのガイダンス
- 古い動作と新しい動作をカバーするドキュメント、診断、テスト

このレジストリは、メンテナーの計画と将来のPluginインスペクターチェックの情報源です。Plugin向けの動作が変わる場合は、アダプターを追加する同じ変更で互換性レコードを追加または更新してください。

Doctor修復と移行の互換性は、`src/commands/doctor/shared/deprecation-compat.ts` で別に追跡されます。これらのレコードは、ランタイム互換性パスが削除された後も利用可能にしておく必要がある可能性のある、古い設定形状、インストール台帳レイアウト、修復シムをカバーします。

リリース時のスイープでは両方のレジストリを確認する必要があります。一致するランタイムまたは設定互換性レコードが期限切れになったという理由だけでDoctor移行を削除しないでください。まず、その修復をまだ必要とするサポート対象のアップグレードパスが存在しないことを確認してください。また、プロバイダーとチャネルがコアの外へ移動するにつれてPluginの所有権と設定の範囲が変わる可能性があるため、リリース計画中に各置き換え注釈を再検証してください。

## Pluginインスペクターパッケージ

Pluginインスペクターは、バージョン管理された互換性契約とマニフェスト契約に基づく、別のパッケージ/リポジトリとしてコアOpenClawリポジトリの外に置く必要があります。

初日のCLIは次のようにします。

```sh
openclaw-plugin-inspector ./my-plugin
```

次の内容を出力する必要があります。

- マニフェスト/スキーマ検証
- チェック対象の契約互換性バージョン
- インストール/ソースメタデータチェック
- コールドパスインポートチェック
- 非推奨および互換性の警告

CI注釈で安定した機械可読出力を得るには `--json` を使用してください。OpenClawコアは、インスペクターが消費できる契約とフィクスチャを公開する必要がありますが、メインの `openclaw` パッケージからインスペクターバイナリを公開してはいけません。

### メンテナー受け入れレーン

外部インスペクターをOpenClaw Pluginパッケージに対して検証する際は、インストール可能パッケージの受け入れレーンにBlacksmith Testboxを使用してください。パッケージのビルド後、クリーンなOpenClawチェックアウトから実行します。

```sh
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
blacksmith testbox run --id <tbx_id> "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
blacksmith testbox stop <tbx_id>
```

このレーンは、外部npmパッケージをインストールし、リポジトリ外でクローンされたPluginパッケージを検査する可能性があるため、メンテナーのオプトインのままにしてください。ローカルリポジトリのガードは、SDKエクスポートマップ、互換性レジストリメタデータ、非推奨SDKインポートの削減、バンドル済み拡張のインポート境界をカバーします。Testboxインスペクターの証明は、外部Plugin作者が利用する形のパッケージをカバーします。

## 非推奨ポリシー

OpenClawは、置き換えを導入するのと同じリリースで、文書化済みのPlugin契約を削除するべきではありません。

移行手順は次のとおりです。

1. 新しい契約を追加します。
2. 名前付きの互換性アダプターを通して古い動作を接続したままにします。
3. Plugin作者が対応できる場合は診断または警告を出力します。
4. 置き換えとタイムラインを文書化します。
5. 古いパスと新しいパスの両方をテストします。
6. 告知済みの移行期間が過ぎるまで待ちます。
7. 明示的な破壊的リリース承認がある場合にのみ削除します。

非推奨レコードには、警告開始日、置き換え、ドキュメントリンク、そして警告開始から3か月以内の最終削除日を含める必要があります。メンテナーがそれを恒久的な互換性として明示的に決定し、代わりに `active` とマークしない限り、削除期間が未定の非推奨互換性パスを追加しないでください。

## 現在の互換性領域

現在の互換性レコードには次のものが含まれます。

- `openclaw/plugin-sdk/compat` などの従来の広範なSDKインポート
- 従来のフック専用Plugin形状と `before_agent_start`
- Pluginが `register(api)` に移行する間の従来の `activate(api)` Pluginエントリーポイント
- `openclaw/extension-api`、`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/command-auth`
  ステータスビルダー、`openclaw/plugin-sdk/test-utils`（焦点を絞った
  `openclaw/plugin-sdk/*` テストサブパスで置き換え）、および `ClawdbotConfig` /
  `OpenClawSchemaType` 型エイリアスなどの従来のSDKエイリアス
- バンドル済みPluginの許可リストと有効化動作
- 従来のプロバイダー/チャネル環境変数マニフェストメタデータ
- プロバイダーが明示的なカタログ、認証、thinking、replay、transportフックに移行する間の従来のプロバイダーPluginフックと型エイリアス
- `api.runtime.taskFlow`、`api.runtime.subagent.getSession`、`api.runtime.stt`、および非推奨の
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)` などの従来のランタイムエイリアス
- メモリPluginが `registerMemoryCapability` に移行する間の従来のメモリPlugin分割登録
- ネイティブメッセージスキーマ、メンションゲート、受信エンベロープ整形、承認機能のネストに関する従来のチャネルSDKヘルパー
- Pluginが `openclaw/plugin-sdk/channel-route` に移行する間の従来のチャネルルートキーと比較可能ターゲットヘルパーエイリアス
- マニフェスト貢献の所有権に置き換えられつつある有効化ヒント
- セットアップ記述子がコールドな `setup.requiresRuntime: false` メタデータに移行する間の `setup-api` ランタイムフォールバック
- プロバイダーカタログフックが `catalog.run(...)` に移行する間のプロバイダー `discovery` フック
- チャネルパッケージが `openclaw.channel.exposure` に移行する間のチャネル `showConfigured` / `showInSetup` メタデータ
- Doctorがオペレーターを `agentRuntime` に移行する間の従来のランタイムポリシー設定キー
- レジストリ優先の `channelConfigs` メタデータが導入される間の、生成されたバンドル済みチャネル設定メタデータフォールバック
- 修復フローがオペレーターを `openclaw plugins registry --refresh` と
  `openclaw doctor --fix` に移行する間の、永続化されたPluginレジストリ無効化およびインストール移行環境変数フラグ
- Doctorがそれらを `plugins.entries.<plugin>.config` に移行する間の、従来のPlugin所有のWeb検索、Web取得、x_search設定パス
- インストールメタデータが状態管理されるPlugin台帳に移行する間の、従来の `plugins.installs` 作者設定とバンドル済みPluginロードパスエイリアス

新しいPluginコードでは、レジストリと該当する移行ガイドに記載された置き換えを優先する必要があります。既存のPluginは、ドキュメント、診断、リリースノートで削除期間が告知されるまで、互換性パスを使い続けることができます。

## リリースノート

リリースノートには、対象日と移行ドキュメントへのリンクを含む、今後のPlugin非推奨を含める必要があります。この警告は、互換性パスが `removal-pending` または `removed` に移る前に行う必要があります。

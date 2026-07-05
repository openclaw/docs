---
read_when:
    - '`clawhub package validate`を実行し、Pluginの検出事項を修正する必要があります'
    - ClawHub が Plugin パッケージの公開を拒否または警告した
    - リリース前に Plugin パッケージのメタデータを更新しています
summary: 公開前に ClawHub Plugin パッケージ検証の指摘事項を修正する
title: Plugin 検証の修正
x-i18n:
    generated_at: "2026-07-05T11:06:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Plugin検証修正

ClawHubは公開前にPluginパッケージを検証し、自動パッケージスキャンからの検出事項も表示できます。このページでは、作者向けの検出事項、つまりPlugin作者が自分のパッケージメタデータ、マニフェスト、SDKインポート、または公開済みアーティファクトで修正できる検出事項を扱います。

内部のPlugin Inspectorカバレッジ検出事項は扱いません。完全なレポートに作者向けの修正ガイダンスがないスキャナーメンテナンスコードが含まれている場合、それらはPlugin作者ではなくOpenClawメンテナー向けです。

修正を適用したら、再実行します。

```bash
clawhub package validate <path-to-plugin>
```

## 作者向けの検出事項

| コード                                    | ここから開始                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [パッケージメタデータを追加する](/ja-JP/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [パッケージのopenclawブロックを追加する](/ja-JP/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [OpenClawパッケージエントリポイントを宣言する](/ja-JP/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [宣言したエントリポイントを公開する](/ja-JP/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [インストールメタデータを完成させる](/ja-JP/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Plugin API互換性を宣言する](/ja-JP/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [最小ホストバージョンを揃える](/ja-JP/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [パッケージとマニフェストのバージョンを揃える](/ja-JP/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [サポートされていないOpenClawパッケージメタデータを削除する](/ja-JP/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [npmアーティファクトをパック可能にする](/ja-JP/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [npm pack出力にエントリポイントを含める](/ja-JP/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [npm pack出力にメタデータを含める](/ja-JP/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [マニフェスト表示名を追加する](/ja-JP/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [サポートされていないマニフェストフィールドを削除する](/ja-JP/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [サポートされていないコントラクトキーを削除する](/ja-JP/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [ルートSDKインポートを置き換える](/ja-JP/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [予約済みSDKインポートを削除する](/ja-JP/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [セッションストア全体へのアクセスを置き換える](/ja-JP/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [セッションストア全体への書き込みを置き換える](/ja-JP/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [セッションファイルパスヘルパーを置き換える](/ja-JP/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [レガシーなトランスクリプトファイルターゲットを置き換える](/ja-JP/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [低レベルのトランスクリプトヘルパーを置き換える](/ja-JP/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [before_agent_startを置き換える](/ja-JP/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [プロバイダー環境変数をセットアップメタデータへ移動する](/ja-JP/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [チャンネル環境変数を現在のメタデータにミラーする](/ja-JP/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [利用できないセキュリティマニフェストスキーマ参照を削除する](/ja-JP/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [サポートされていないセキュリティマニフェストファイルを削除する](/ja-JP/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## パッケージメタデータ

### package-json-missing

パッケージルートに`package.json`が含まれていないため、ClawHubはnpmパッケージ、バージョン、エントリポイント、OpenClawメタデータを識別できません。

- `name`、`version`、`type`を含む`package.json`を追加します。
- パッケージがOpenClaw Pluginを同梱する場合は、`openclaw`ブロックを追加します。
- 最小限のパッケージ例には[Pluginを構築する](/ja-JP/plugins/building-plugins)を、パッケージとマニフェストの分割には[Pluginマニフェスト](/ja-JP/plugins/manifest#manifest-versus-packagejson)を使用します。
- `clawhub package validate <path-to-plugin>`を再実行します。

### package-openclaw-metadata-missing

パッケージには`package.json`がありますが、OpenClawパッケージメタデータを宣言していません。

- `package.json#openclaw`を追加します。
- `openclaw.extensions`や`openclaw.runtimeExtensions`などのエントリポイントメタデータを含めます。
- パッケージをClawHub経由で公開またはインストールする場合は、互換性とインストールのメタデータを追加します。
- [探索に影響するpackage.jsonフィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery)を参照してください。
- `clawhub package validate <path-to-plugin>`を再実行します。

### package-openclaw-entry-missing

パッケージメタデータは存在しますが、OpenClawランタイムエントリポイントを宣言していません。

- ネイティブPluginエントリポイントには`openclaw.extensions`を追加します。
- 公開済みパッケージでビルド済みJavaScriptを読み込む必要がある場合は、`openclaw.runtimeExtensions`を追加します。
- すべてのエントリポイントパスをパッケージディレクトリ内に保ちます。
- [Pluginエントリポイント](/ja-JP/plugins/sdk-entrypoints)と[探索に影響するpackage.jsonフィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery)を参照してください。
- `clawhub package validate <path-to-plugin>`を再実行します。

### package-entrypoint-missing

パッケージはOpenClawエントリポイントを宣言していますが、参照先ファイルが検証対象のパッケージにありません。

- `openclaw.extensions`、`openclaw.runtimeExtensions`、`openclaw.setupEntry`、`openclaw.runtimeSetupEntry`内の各パスを確認します。
- エントリポイントが`dist`に生成される場合は、パッケージをビルドします。
- エントリポイントが移動した場合は、メタデータを更新します。
- [Pluginエントリポイント](/ja-JP/plugins/sdk-entrypoints)を参照してください。
- `clawhub package validate <path-to-plugin>`を再実行します。

### package-install-metadata-incomplete

ClawHubは、パッケージをどのようにインストールまたは更新すべきか判断できません。

- `openclaw.install`に、`clawhubSpec`、`npmSpec`、`localPath`などのサポートされるインストールソースを入力します。
- 複数のインストールソースを利用できる場合は、`openclaw.install.defaultChoice`を設定します。
- 最小OpenClawホストバージョンには`openclaw.install.minHostVersion`を使用します。
- [探索に影響するpackage.jsonフィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery)を参照してください。
- `clawhub package validate <path-to-plugin>`を再実行します。

### package-plugin-api-compat-missing

パッケージがサポートするOpenClaw Plugin API範囲を宣言していません。

- `package.json`に`openclaw.compat.pluginApi`を追加します。
- ビルドおよびテストの対象にしたOpenClaw Plugin APIバージョンまたはsemver下限を使用します。
- これはパッケージバージョンとは分けて扱います。パッケージバージョンはPluginリリースを表し、`openclaw.compat.pluginApi`はホストAPIコントラクトを表します。
- [探索に影響するpackage.jsonフィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery)を参照してください。
- `clawhub package validate <path-to-plugin>`を再実行します。

### package-min-host-version-drift

パッケージの最小ホストバージョンが、パッケージのビルド対象になったOpenClawバージョンメタデータと一致しません。

- `openclaw.install.minHostVersion`を確認します。
- リリース時に使用されたOpenClawバージョンなど、パッケージ内のOpenClawビルドメタデータを確認します。
- 最小ホストバージョンを、パッケージが実際にサポートするホストバージョン範囲と揃えます。
- [探索に影響するpackage.jsonフィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery)を参照してください。
- `clawhub package validate <path-to-plugin>`を再実行します。

### package-manifest-version-drift

パッケージバージョンとPluginマニフェストバージョンが一致していません。

- パッケージリリースバージョンとして`package.json#version`を優先します。
- `openclaw.plugin.json`にも`version`がある場合は、一致するように更新するか、パッケージメタデータが正とされる場合は古いマニフェストバージョンメタデータを削除します。
- 公開済みメタデータを変更した後は、新しいパッケージバージョンを公開します。
- [Pluginマニフェスト](/ja-JP/plugins/manifest)を参照してください。
- `clawhub package validate <path-to-plugin>`を再実行します。

### package-openclaw-unsupported-metadata

`package.json#openclaw`ブロックに、OpenClawパッケージメタデータとしてサポートされていないフィールドが含まれています。

- `openclaw.bundle`などのサポートされていないフィールドを削除します。
- ネイティブPluginメタデータは`openclaw.plugin.json`に保ちます。
- パッケージエントリポイント、互換性、インストール、セットアップ、カタログメタデータは、サポートされる`package.json#openclaw`フィールドに保ちます。
- [探索に影響するpackage.jsonフィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery)を参照してください。
- `clawhub package validate <path-to-plugin>`を再実行します。

## 公開済みアーティファクト

### package-npm-pack-unavailable

パッケージを、ClawHubが検査または公開するアーティファクトにパックできません。

- パッケージルートから`npm pack --dry-run`を実行します。
- パック失敗の原因になる無効なパッケージメタデータ、壊れたライフサイクルスクリプト、またはfilesエントリを修正します。
- このパッケージを公開する意図がある場合は、`private: true`を削除します。
- `clawhub package validate <path-to-plugin>`を再実行します。

### package-npm-pack-entrypoint-missing

パッケージはパックできますが、パック済みアーティファクトに`package.json#openclaw`で宣言されたエントリポイントファイルが含まれていません。

- `npm pack --dry-run`を実行し、含まれる予定のファイルを確認します。
- パック前に生成されるエントリポイントをビルドします。
- 宣言されたエントリポイントが含まれるように、`files`、`.npmignore`、またはビルド出力を更新します。
- [Pluginエントリポイント](/ja-JP/plugins/sdk-entrypoints)を参照してください。
- `clawhub package validate <path-to-plugin>`を再実行します。

### package-npm-pack-metadata-missing

パック済みアーティファクトに、ソースパッケージには存在するOpenClawメタデータがありません。

- `npm pack --dry-run`を実行し、含まれるメタデータファイルを確認します。
- パック済みアーティファクト内の`package.json`に`openclaw`ブロックが含まれていることを確認します。
- パッケージがネイティブOpenClaw Pluginの場合は、`openclaw.plugin.json`が含まれていることを確認します。
- パッケージメタデータが除外されないように、`files`または`.npmignore`を更新します。
- [Pluginを構築する](/ja-JP/plugins/building-plugins)を参照してください。
- `clawhub package validate <path-to-plugin>`を再実行します。

## マニフェストメタデータ

### manifest-name-missing

ネイティブプラグインのマニフェストに表示名が含まれていません。

- 空でない `name` フィールドを `openclaw.plugin.json` に追加します。
- `name` は人間が読める名前にし、`id` は安定したマシン ID として維持します。
- [Plugin マニフェスト](/ja-JP/plugins/manifest)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### manifest-unknown-fields

プラグインマニフェストに、OpenClaw がサポートしていないトップレベルフィールドがあります。

- 各トップレベルフィールドを
  [マニフェストフィールドリファレンス](/ja-JP/plugins/manifest#top-level-field-reference)と比較します。
- カスタムフィールドを `openclaw.plugin.json` から削除します。
- パッケージまたはインストールのメタデータは、マニフェストではなく、サポートされている `package.json#openclaw` フィールドに移動します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### manifest-unknown-contracts

マニフェストの `contracts` 内でサポートされていないキーが宣言されています。

- `contracts` 配下の各キーを
  [contracts リファレンス](/ja-JP/plugins/manifest#contracts-reference)と比較します。
- サポートされていない contract キーを削除します。
- ランタイム動作はプラグイン登録コードに移動し、`contracts` は静的な機能所有権メタデータに限定します。
- `clawhub package validate <path-to-plugin>` を再実行します。

## SDK と互換性の移行

### legacy-root-sdk-import

プラグインが非推奨のルート SDK バレルからインポートしています:
`openclaw/plugin-sdk`.

- ルートバレルのインポートを、用途を絞った公開サブパスインポートに置き換えます。
- `definePluginEntry` には `openclaw/plugin-sdk/plugin-entry` を使用します。
- チャンネルエントリヘルパーには `openclaw/plugin-sdk/channel-core` を使用します。
- 狭いインポートを見つけるには、[インポート規約](/ja-JP/plugins/building-plugins#import-conventions)と
  [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)を使用します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### reserved-sdk-import

プラグインが、バンドル済みプラグインまたは内部互換性用に予約された SDK パスをインポートしています。

- 予約済みの OpenClaw 内部 SDK インポートを、ドキュメント化された公開
  `openclaw/plugin-sdk/*` サブパスに置き換えます。
- その動作に公開 SDK がない場合は、ヘルパーを自分のパッケージ内に保持するか、公開 OpenClaw API をリクエストします。
- サポートされているインポートを選ぶには、[Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)と
  [SDK 移行](/ja-JP/plugins/sdk-migration)を使用します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-load-session-store

プラグインが、非推奨のセッションストア全体ヘルパー
`loadSessionStore` をまだ使用しています。

- セッション状態を読み取るときは、`getSessionEntry(...)` または `listSessionEntries(...)` を使用します。
- セッション状態を書き込むときは、`patchSessionEntry(...)` または `upsertSessionEntry(...)` を使用します。
- セッションストアオブジェクト全体を読み込み、変更し、保存することは避けます。
- 宣言した互換性範囲が、それを必要とする古い OpenClaw バージョンをまだサポートしている間だけ、`loadSessionStore(...)` を保持します。
- [ランタイム API](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-session-store-write

プラグインが、`saveSessionStore` や `updateSessionStore` などの非推奨のセッションストア全体書き込みヘルパーをまだ使用しています。

- 既存のセッションエントリのフィールドを更新するときは、`patchSessionEntry(...)` を使用します。
- セッションエントリを置換または作成するときは、`upsertSessionEntry(...)` を使用します。
- セッションストアオブジェクト全体を読み込み、変更し、保存することは避けます。
- 宣言した互換性範囲が、それらを必要とする古い OpenClaw バージョンをまだサポートしている間だけ、ストア全体の書き込みヘルパーを保持します。
- [ランタイム API](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-session-file-helper

プラグインが、`resolveSessionFilePath` や `resolveAndPersistSessionFile` などの非推奨のセッションファイルパスヘルパーをまだ使用しています。

- エージェントとセッション ID によってセッションメタデータを読み取るには、`getSessionEntry(...)` を使用します。
- セッションメタデータを永続化するには、`patchSessionEntry(...)` または `upsertSessionEntry(...)` を使用します。
- コードがトランスクリプト操作を準備している場合は、トランスクリプト ID またはターゲットヘルパーを使用します。
- レガシートランスクリプトファイルパスを永続化したり、それに依存したりしないでください。
- [ランタイム API](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-session-transcript-file-target

プラグインが、非推奨のトランスクリプトファイルターゲットヘルパー
`resolveSessionTranscriptLegacyFileTarget` をまだ使用しています。

- コードが公開セッション ID だけを必要とする場合は、`resolveSessionTranscriptIdentity(...)` を使用します。
- コードが構造化されたトランスクリプト操作ターゲットを必要とする場合は、`resolveSessionTranscriptTarget(...)` を使用します。
- レガシートランスクリプトファイルターゲットを直接読み取ったり構築したりすることは避けます。
- 宣言した互換性範囲が、それを必要とする古い OpenClaw バージョンをまだサポートしている間だけ、レガシーヘルパーを保持します。
- [ランタイム API](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-session-transcript-low-level

プラグインが、`appendSessionTranscriptMessage` や `emitSessionTranscriptUpdate` などの非推奨の低レベルトランスクリプトヘルパーをまだ使用しています。

- トランスクリプトへの追加には `appendSessionTranscriptMessageByIdentity(...)` を使用します。
- トランスクリプト更新通知には `publishSessionTranscriptUpdateByIdentity(...)` を使用します。
- OpenClaw が正しいトランザクション境界と ID 処理を適用できるように、構造化されたトランスクリプトランタイムサーフェスを優先します。
- 宣言した互換性範囲が、それらを必要とする古い OpenClaw バージョンをまだサポートしている間だけ、低レベルトランスクリプトヘルパーを保持します。
- [ランタイム API](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### legacy-before-agent-start

プラグインがレガシーの `before_agent_start` フックをまだ使用しています。

- モデルまたはプロバイダーの上書き処理は `before_model_resolve` に移動します。
- プロンプトまたはコンテキストの変更処理は `before_prompt_build` に移動します。
- 宣言した互換性範囲が、それを必要とする古い OpenClaw バージョンをまだサポートしている間だけ、`before_agent_start` を保持します。
- [フック](/ja-JP/plugins/hooks)と
  [Plugin 互換性](/ja-JP/plugins/compatibility)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### provider-auth-env-vars

マニフェストがレガシーの `providerAuthEnvVars` プロバイダー認証メタデータをまだ使用しています。

- プロバイダー env-var メタデータを `setup.providers[].envVars` にミラーします。
- サポート対象の OpenClaw 範囲でまだ必要な間だけ、`providerAuthEnvVars` を互換性メタデータとして保持します。
- [setup リファレンス](/ja-JP/plugins/manifest#setup-reference)と
  [SDK 移行](/ja-JP/plugins/sdk-migration)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### channel-env-vars

マニフェストが、ClawHub が期待する現在の setup または config メタデータなしで、レガシーまたは古いチャンネル env-var メタデータを使用しています。

- OpenClaw がチャンネルランタイムを読み込まずに setup 状態を検査できるように、チャンネル env-var メタデータは宣言的に保ちます。
- env によって駆動されるチャンネル setup を、プラグインの形に応じて使われる現在の setup、チャンネル config、またはパッケージのチャンネルメタデータにミラーします。
- 古いサポート対象の OpenClaw バージョンがまだ必要とする間だけ、`channelEnvVars` を互換性メタデータとして保持します。
- [Plugin マニフェスト](/ja-JP/plugins/manifest)と
  [チャンネルプラグイン](/ja-JP/plugins/sdk-channel-plugins)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

## セキュリティマニフェスト

### security-manifest-schema-unavailable

パッケージが、ClawHub が利用可能として認識しないスキーマ参照を含む `openclaw.security.json` を出荷しています。

- そのスキーマ URL が助言目的のみである場合は削除します。
- OpenClaw が公開した後にのみ、ドキュメント化されたバージョン付きスキーマを使用します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### unrecognized-security-manifest

パッケージがサポートされていないセキュリティマニフェストファイルを出荷しています。

- OpenClaw がバージョン付きセキュリティマニフェストスキーマと ClawHub の動作をドキュメント化するまで、`openclaw.security.json` を削除します。
- マニフェスト契約が存在するまでは、セキュリティに関わる動作を公開パッケージドキュメントまたは README に記載します。
- `clawhub package validate <path-to-plugin>` を再実行します。

## 関連

- [ClawHub CLI](/ja-JP/clawhub/cli)
- [ClawHub 公開](/ja-JP/clawhub/publishing)
- [プラグインの構築](/ja-JP/plugins/building-plugins)
- [Plugin マニフェスト](/ja-JP/plugins/manifest)
- [Plugin エントリポイント](/ja-JP/plugins/sdk-entrypoints)
- [Plugin 互換性](/ja-JP/plugins/compatibility)

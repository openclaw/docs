---
read_when:
    - '`clawhub package validate` を実行し、Plugin の検出事項を修正する必要がある'
    - ClawHub が Plugin パッケージ公開時に拒否または警告した
    - リリース前にPluginパッケージのメタデータを更新しています
summary: 公開前に ClawHub Plugin パッケージ検証の指摘事項を修正する
title: Plugin 検証の修正
x-i18n:
    generated_at: "2026-07-01T07:51:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Plugin 検証の修正

ClawHub は公開前に Plugin パッケージを検証し、自動パッケージスキャンの検出結果も表示できます。このページでは、作成者向けの検出結果を扱います。つまり、Plugin 作成者が自分のパッケージメタデータ、マニフェスト、SDK インポート、または公開済みアーティファクトで修正できる検出結果です。

内部の Plugin Inspector カバレッジ検出結果は扱いません。完全なレポートに、作成者向けの修正ガイダンスがないスキャナー保守コードが含まれている場合、それらは Plugin 作成者ではなく OpenClaw メンテナー向けです。

修正を適用した後、次を再実行します。

```bash
clawhub package validate <path-to-plugin>
```

## 作成者向けの検出結果

| コード                                    | ここから開始                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [パッケージメタデータを追加](/ja-JP/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [パッケージの openclaw ブロックを追加](/ja-JP/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [OpenClaw パッケージエントリポイントを宣言](/ja-JP/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [宣言済みエントリポイントを公開](/ja-JP/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [インストールメタデータを完成](/ja-JP/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Plugin API 互換性を宣言](/ja-JP/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [最小ホストバージョンを揃える](/ja-JP/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [パッケージとマニフェストのバージョンを揃える](/ja-JP/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [サポートされていない OpenClaw パッケージメタデータを削除](/ja-JP/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [npm アーティファクトをパック可能にする](/ja-JP/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [npm pack 出力にエントリポイントを含める](/ja-JP/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [npm pack 出力にメタデータを含める](/ja-JP/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [マニフェスト表示名を追加](/ja-JP/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [サポートされていないマニフェストフィールドを削除](/ja-JP/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [サポートされていないコントラクトキーを削除](/ja-JP/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [ルート SDK インポートを置換](/ja-JP/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [予約済み SDK インポートを削除](/ja-JP/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [セッションストア全体へのアクセスを置換](/ja-JP/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [セッションストア全体への書き込みを置換](/ja-JP/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [セッションファイルパスヘルパーを置換](/ja-JP/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [レガシー transcript ファイルターゲットを置換](/ja-JP/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [低レベル transcript ヘルパーを置換](/ja-JP/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [before_agent_start を置換](/ja-JP/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [プロバイダー env vars をセットアップメタデータへ移動](/ja-JP/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [チャンネル env vars を現在のメタデータにミラー](/ja-JP/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [利用できないセキュリティマニフェストスキーマ参照を削除](/ja-JP/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [サポートされていないセキュリティマニフェストファイルを削除](/ja-JP/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## パッケージメタデータ

### package-json-missing

パッケージルートに `package.json` が含まれていないため、ClawHub は npm パッケージ、バージョン、エントリポイント、OpenClaw メタデータを識別できません。

- `name`、`version`、`type` を含む `package.json` を追加します。
- パッケージが OpenClaw Plugin を出荷する場合は、`openclaw` ブロックを追加します。
- 最小限のパッケージ例については [Plugin の構築](/ja-JP/plugins/building-plugins) を、パッケージとマニフェストの分割については [Plugin マニフェスト](/ja-JP/plugins/manifest#manifest-versus-packagejson) を使用します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-openclaw-metadata-missing

パッケージには `package.json` がありますが、OpenClaw パッケージメタデータを宣言していません。

- `package.json#openclaw` を追加します。
- `openclaw.extensions` や `openclaw.runtimeExtensions` などのエントリポイントメタデータを含めます。
- パッケージを ClawHub で公開またはインストールする場合は、互換性とインストールのメタデータを追加します。
- [検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-openclaw-entry-missing

パッケージメタデータは存在しますが、OpenClaw ランタイムエントリポイントを宣言していません。

- ネイティブ Plugin エントリポイントには `openclaw.extensions` を追加します。
- 公開済みパッケージでビルド済み JavaScript を読み込む必要がある場合は、`openclaw.runtimeExtensions` を追加します。
- すべてのエントリポイントパスをパッケージディレクトリ内に保ちます。
- [Plugin エントリポイント](/ja-JP/plugins/sdk-entrypoints) と [検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-entrypoint-missing

パッケージは OpenClaw エントリポイントを宣言していますが、参照先ファイルが検証対象のパッケージにありません。

- `openclaw.extensions`、`openclaw.runtimeExtensions`、`openclaw.setupEntry`、`openclaw.runtimeSetupEntry` の各パスを確認します。
- エントリポイントが `dist` に生成される場合は、パッケージをビルドします。
- エントリポイントが移動した場合は、メタデータを更新します。
- [Plugin エントリポイント](/ja-JP/plugins/sdk-entrypoints) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-install-metadata-incomplete

ClawHub はパッケージをどのようにインストールまたは更新すべきか判断できません。

- `openclaw.install` に、`clawhubSpec`、`npmSpec`、`localPath` などのサポートされているインストールソースを入力します。
- 複数のインストールソースが利用可能な場合は、`openclaw.install.defaultChoice` を設定します。
- 最小 OpenClaw ホストバージョンには `openclaw.install.minHostVersion` を使用します。
- [検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-plugin-api-compat-missing

パッケージは、サポートする OpenClaw Plugin API 範囲を宣言していません。

- `package.json` に `openclaw.compat.pluginApi` を追加します。
- ビルドしてテストした OpenClaw Plugin API バージョンまたは semver の下限を使用します。
- これはパッケージバージョンとは分けておきます。パッケージバージョンは Plugin リリースを表し、`openclaw.compat.pluginApi` はホスト API コントラクトを表します。
- [検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-min-host-version-drift

パッケージの最小ホストバージョンが、パッケージのビルド対象となった OpenClaw バージョンメタデータと一致していません。

- `openclaw.install.minHostVersion` を確認します。
- リリース時に使用された OpenClaw バージョンなど、パッケージ内の OpenClaw ビルドメタデータを確認します。
- 最小ホストバージョンを、パッケージが実際にサポートするホストバージョン範囲に揃えます。
- [検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-manifest-version-drift

パッケージバージョンと Plugin マニフェストバージョンが一致していません。

- パッケージリリースバージョンとして `package.json#version` を優先します。
- `openclaw.plugin.json` にも `version` がある場合は、一致するように更新するか、パッケージメタデータが正である場合は古いマニフェストバージョンメタデータを削除します。
- 公開済みメタデータを変更した後は、新しいパッケージバージョンを公開します。
- [Plugin マニフェスト](/ja-JP/plugins/manifest) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-openclaw-unsupported-metadata

`package.json#openclaw` ブロックに、OpenClaw パッケージメタデータとしてサポートされていないフィールドが含まれています。

- `openclaw.bundle` などのサポートされていないフィールドを削除します。
- ネイティブ Plugin メタデータは `openclaw.plugin.json` に保持します。
- パッケージのエントリポイント、互換性、インストール、セットアップ、カタログメタデータは、サポートされている `package.json#openclaw` フィールドに保持します。
- [検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

## 公開済みアーティファクト

### package-npm-pack-unavailable

パッケージを ClawHub が検査または公開するアーティファクトにパックできません。

- パッケージルートから `npm pack --dry-run` を実行します。
- パックを失敗させる無効なパッケージメタデータ、壊れたライフサイクルスクリプト、または files エントリを修正します。
- このパッケージを公開する意図がある場合は、`private: true` を削除します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-npm-pack-entrypoint-missing

パッケージはパックできますが、パック済みアーティファクトに `package.json#openclaw` で宣言されたエントリポイントファイルが含まれていません。

- `npm pack --dry-run` を実行し、含まれる予定のファイルを確認します。
- パック前に生成されたエントリポイントをビルドします。
- 宣言済みエントリポイントが含まれるように、`files`、`.npmignore`、またはビルド出力を更新します。
- [Plugin エントリポイント](/ja-JP/plugins/sdk-entrypoints) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-npm-pack-metadata-missing

パック済みアーティファクトに、ソースパッケージには存在する OpenClaw メタデータがありません。

- `npm pack --dry-run` を実行し、含まれるメタデータファイルを確認します。
- パック済みアーティファクト内の `package.json` に `openclaw` ブロックが含まれていることを確認します。
- パッケージがネイティブ OpenClaw Plugin の場合は、`openclaw.plugin.json` が含まれていることを確認します。
- パッケージメタデータが除外されないように、`files` または `.npmignore` を更新します。
- [Plugin の構築](/ja-JP/plugins/building-plugins) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

## マニフェストメタデータ

### manifest-name-missing

ネイティブPluginマニフェストに表示名が含まれていません。

- `openclaw.plugin.json` に空でない `name` フィールドを追加してください。
- `name` は人間が読める形式にし、`id` は安定したマシンIDとして維持してください。
- [Pluginマニフェスト](/ja-JP/plugins/manifest)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行してください。

### manifest-unknown-fields

Pluginマニフェストに、OpenClawがサポートしていないトップレベルフィールドがあります。

- 各トップレベルフィールドを
  [マニフェストフィールドリファレンス](/ja-JP/plugins/manifest#top-level-field-reference)と比較してください。
- `openclaw.plugin.json` からカスタムフィールドを削除してください。
- パッケージまたはインストールメタデータは、マニフェストではなく、サポートされている `package.json#openclaw` フィールドに移動してください。
- `clawhub package validate <path-to-plugin>` を再実行してください。

### manifest-unknown-contracts

マニフェストが `contracts` 内でサポートされていないキーを宣言しています。

- `contracts` 配下の各キーを
  [contractsリファレンス](/ja-JP/plugins/manifest#contracts-reference)と比較してください。
- サポートされていないコントラクトキーを削除してください。
- ランタイム動作はPlugin登録コードに移動し、`contracts` は静的な機能所有権メタデータに限定してください。
- `clawhub package validate <path-to-plugin>` を再実行してください。

## SDKと互換性移行

### legacy-root-sdk-import

Pluginが非推奨のルートSDKバレルからインポートしています:
`openclaw/plugin-sdk`.

- ルートバレルインポートを、対象を絞った公開サブパスインポートに置き換えてください。
- `definePluginEntry` には `openclaw/plugin-sdk/plugin-entry` を使用してください。
- チャンネルエントリヘルパーには `openclaw/plugin-sdk/channel-core` を使用してください。
- 狭いインポートを見つけるには、[インポート規約](/ja-JP/plugins/building-plugins#import-conventions)と
  [Plugin SDKサブパス](/ja-JP/plugins/sdk-subpaths)を使用してください。
- `clawhub package validate <path-to-plugin>` を再実行してください。

### reserved-sdk-import

Pluginが、バンドルPluginまたは内部互換性用に予約されたSDKパスをインポートしています。

- 予約済みのOpenClaw内部SDKインポートを、文書化された公開
  `openclaw/plugin-sdk/*` サブパスに置き換えてください。
- その動作に公開SDKがない場合は、ヘルパーをパッケージ内に保持するか、公開OpenClaw APIをリクエストしてください。
- サポートされているインポートを選ぶには、[Plugin SDKサブパス](/ja-JP/plugins/sdk-subpaths)と
  [SDK移行](/ja-JP/plugins/sdk-migration)を使用してください。
- `clawhub package validate <path-to-plugin>` を再実行してください。

### sdk-load-session-store

Pluginはまだ非推奨のセッションストア全体ヘルパー
`loadSessionStore` を使用しています。

- セッション状態を読み取るときは `getSessionEntry(...)` または `listSessionEntries(...)` を使用してください。
- セッション状態を書き込むときは `patchSessionEntry(...)` または `upsertSessionEntry(...)` を使用してください。
- セッションストアオブジェクト全体の読み込み、変更、保存は避けてください。
- 宣言した互換性範囲が、それを必要とする古いOpenClawバージョンをまだサポートしている場合に限り、`loadSessionStore(...)` を保持してください。
- [Runtime API](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDKサブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行してください。

### sdk-session-store-write

Pluginはまだ `saveSessionStore` や `updateSessionStore` などの非推奨のセッションストア全体書き込みヘルパーを使用しています。

- 既存のセッションエントリのフィールドを更新するときは `patchSessionEntry(...)` を使用してください。
- セッションエントリを置き換える、または作成するときは `upsertSessionEntry(...)` を使用してください。
- セッションストアオブジェクト全体の読み込み、変更、保存は避けてください。
- 宣言した互換性範囲が、それらを必要とする古いOpenClawバージョンをまだサポートしている場合に限り、ストア全体の書き込みヘルパーを保持してください。
- [Runtime API](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDKサブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行してください。

### sdk-session-file-helper

Pluginはまだ `resolveSessionFilePath` や `resolveAndPersistSessionFile` などの非推奨のセッションファイルパスヘルパーを使用しています。

- エージェントとセッションIDごとにセッションメタデータを読み取るには、`getSessionEntry(...)` を使用してください。
- セッションメタデータを永続化するには、`patchSessionEntry(...)` または `upsertSessionEntry(...)` を使用してください。
- コードがトランスクリプト操作を準備している場合は、トランスクリプトIDまたはターゲットヘルパーを使用してください。
- レガシートランスクリプトファイルパスを永続化したり、それに依存したりしないでください。
- [Runtime API](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDKサブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行してください。

### sdk-session-transcript-file-target

Pluginはまだ非推奨のトランスクリプトファイルターゲットヘルパー
`resolveSessionTranscriptLegacyFileTarget` を使用しています。

- コードが公開セッションIDだけを必要とする場合は、`resolveSessionTranscriptIdentity(...)` を使用してください。
- コードが構造化されたトランスクリプト操作ターゲットを必要とする場合は、`resolveSessionTranscriptTarget(...)` を使用してください。
- レガシートランスクリプトファイルターゲットを直接読み取ったり構築したりすることは避けてください。
- 宣言した互換性範囲が、それを必要とする古いOpenClawバージョンをまだサポートしている場合に限り、レガシーヘルパーを保持してください。
- [Runtime API](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDKサブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行してください。

### sdk-session-transcript-low-level

Pluginはまだ `appendSessionTranscriptMessage` や `emitSessionTranscriptUpdate` などの非推奨の低レベルトランスクリプトヘルパーを使用しています。

- トランスクリプトへの追加には `appendSessionTranscriptMessageByIdentity(...)` を使用してください。
- トランスクリプト更新通知には `publishSessionTranscriptUpdateByIdentity(...)` を使用してください。
- OpenClawが正しいトランザクション境界とID処理を適用できるように、構造化されたトランスクリプトランタイムサーフェスを優先してください。
- 宣言した互換性範囲が、それらを必要とする古いOpenClawバージョンをまだサポートしている場合に限り、低レベルトランスクリプトヘルパーを保持してください。
- [Runtime API](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDKサブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行してください。

### legacy-before-agent-start

Pluginはまだレガシーの `before_agent_start` フックを使用しています。

- モデルまたはプロバイダーの上書き処理は `before_model_resolve` に移動してください。
- プロンプトまたはコンテキストの変更処理は `before_prompt_build` に移動してください。
- 宣言した互換性範囲が、それを必要とする古いOpenClawバージョンをまだサポートしている場合に限り、`before_agent_start` を保持してください。
- [フック](/ja-JP/plugins/hooks)と
  [Plugin互換性](/ja-JP/plugins/compatibility)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行してください。

### provider-auth-env-vars

マニフェストはまだレガシーの `providerAuthEnvVars` プロバイダー認証メタデータを使用しています。

- プロバイダー環境変数メタデータを `setup.providers[].envVars` にミラーしてください。
- サポート対象のOpenClaw範囲がまだ必要としている間だけ、`providerAuthEnvVars` を互換性メタデータとして保持してください。
- [setupリファレンス](/ja-JP/plugins/manifest#setup-reference)と
  [SDK移行](/ja-JP/plugins/sdk-migration)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行してください。

### channel-env-vars

マニフェストは、ClawHubが期待する現在のセットアップまたは設定メタデータなしで、レガシーまたは古いチャンネル環境変数メタデータを使用しています。

- OpenClawがチャンネルランタイムを読み込まずにセットアップ状態を検査できるように、チャンネル環境変数メタデータは宣言的に保ってください。
- 環境変数駆動のチャンネルセットアップを、Pluginの形状で使用される現在のセットアップ、チャンネル設定、またはパッケージチャンネルメタデータにミラーしてください。
- サポート対象の古いOpenClawバージョンがまだ必要としている間だけ、`channelEnvVars` を互換性メタデータとして保持してください。
- [Pluginマニフェスト](/ja-JP/plugins/manifest)と
  [チャンネルPlugin](/ja-JP/plugins/sdk-channel-plugins)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行してください。

## セキュリティマニフェスト

### security-manifest-schema-unavailable

パッケージは、ClawHubが利用可能と認識していないスキーマ参照付きの `openclaw.security.json` を出荷しています。

- 助言目的のみであれば、スキーマURLを削除してください。
- OpenClawが公開した後にのみ、文書化されたバージョン付きスキーマを使用してください。
- `clawhub package validate <path-to-plugin>` を再実行してください。

### unrecognized-security-manifest

パッケージはサポートされていないセキュリティマニフェストファイルを出荷しています。

- OpenClawがバージョン付きセキュリティマニフェストスキーマとClawHubの動作を文書化するまで、`openclaw.security.json` を削除してください。
- マニフェスト契約が存在するまでは、セキュリティ上重要な動作を公開パッケージドキュメントまたはREADMEに文書化しておいてください。
- `clawhub package validate <path-to-plugin>` を再実行してください。

## 関連

- [ClawHub CLI](/ja-JP/clawhub/cli)
- [ClawHubでの公開](/ja-JP/clawhub/publishing)
- [Pluginのビルド](/ja-JP/plugins/building-plugins)
- [Pluginマニフェスト](/ja-JP/plugins/manifest)
- [Pluginエントリポイント](/ja-JP/plugins/sdk-entrypoints)
- [Plugin互換性](/ja-JP/plugins/compatibility)

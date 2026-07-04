---
read_when:
    - '`clawhub package validate`を実行し、Plugin の指摘を修正する必要がある'
    - ClawHub が Plugin パッケージの公開を拒否または警告した
    - リリース前にPluginパッケージのメタデータを更新しています
summary: 公開前に ClawHub Plugin パッケージ検証の指摘事項を修正する
title: Plugin 検証の修正
x-i18n:
    generated_at: "2026-07-04T10:26:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Plugin 検証の修正

ClawHub は公開前に Plugin パッケージを検証し、自動パッケージスキャンからの検出事項も表示できます。このページでは、作者向けの検出事項、つまり Plugin 作者が自分のパッケージメタデータ、マニフェスト、SDK インポート、または公開済みアーティファクトで修正できる検出事項を扱います。

内部の Plugin Inspector カバレッジ検出事項は扱いません。完全なレポートに作者向けの修正ガイダンスがないスキャナーメンテナンスコードが含まれている場合、それらは Plugin 作者ではなく OpenClaw メンテナー向けです。

修正を適用したら、再実行します。

```bash
clawhub package validate <path-to-plugin>
```

## 作者向けの検出事項

| コード                                    | ここから開始                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [パッケージメタデータを追加する](/ja-JP/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [パッケージの openclaw ブロックを追加する](/ja-JP/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [OpenClaw パッケージエントリーポイントを宣言する](/ja-JP/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [宣言されたエントリーポイントを公開する](/ja-JP/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [インストールメタデータを完了する](/ja-JP/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Plugin API 互換性を宣言する](/ja-JP/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [最小ホストバージョンをそろえる](/ja-JP/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [パッケージとマニフェストのバージョンをそろえる](/ja-JP/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [サポートされていない OpenClaw パッケージメタデータを削除する](/ja-JP/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [npm アーティファクトをパック可能にする](/ja-JP/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [エントリーポイントを npm pack 出力に含める](/ja-JP/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [メタデータを npm pack 出力に含める](/ja-JP/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [マニフェスト表示名を追加する](/ja-JP/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [サポートされていないマニフェストフィールドを削除する](/ja-JP/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [サポートされていないコントラクトキーを削除する](/ja-JP/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [ルート SDK インポートを置き換える](/ja-JP/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [予約済み SDK インポートを削除する](/ja-JP/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [セッションストア全体へのアクセスを置き換える](/ja-JP/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [セッションストア全体への書き込みを置き換える](/ja-JP/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [セッションファイルパスヘルパーを置き換える](/ja-JP/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [レガシー transcript ファイルターゲットを置き換える](/ja-JP/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [低レベル transcript ヘルパーを置き換える](/ja-JP/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [before_agent_start を置き換える](/ja-JP/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [プロバイダー環境変数をセットアップメタデータへ移動する](/ja-JP/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [チャンネル環境変数を現在のメタデータにミラーする](/ja-JP/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [利用できないセキュリティマニフェストスキーマ参照を削除する](/ja-JP/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [サポートされていないセキュリティマニフェストファイルを削除する](/ja-JP/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## パッケージメタデータ

### package-json-missing

パッケージルートに `package.json` が含まれていないため、ClawHub は npm パッケージ、バージョン、エントリーポイント、または OpenClaw メタデータを識別できません。

- `name`、`version`、`type` を含む `package.json` を追加します。
- パッケージが OpenClaw Plugin を出荷する場合は、`openclaw` ブロックを追加します。
- 最小パッケージ例には [Plugin の構築](/ja-JP/plugins/building-plugins) を、パッケージとマニフェストの分割には [Plugin マニフェスト](/ja-JP/plugins/manifest#manifest-versus-packagejson) を使用します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-openclaw-metadata-missing

パッケージには `package.json` がありますが、OpenClaw パッケージメタデータを宣言していません。

- `package.json#openclaw` を追加します。
- `openclaw.extensions` や `openclaw.runtimeExtensions` などのエントリーポイントメタデータを含めます。
- パッケージを ClawHub 経由で公開またはインストールする場合は、互換性とインストールメタデータを追加します。
- [検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-openclaw-entry-missing

パッケージメタデータは存在しますが、OpenClaw ランタイムエントリーポイントを宣言していません。

- ネイティブ Plugin エントリーポイントには `openclaw.extensions` を追加します。
- 公開済みパッケージがビルド済み JavaScript を読み込む必要がある場合は、`openclaw.runtimeExtensions` を追加します。
- すべてのエントリーポイントパスをパッケージディレクトリ内に保ちます。
- [Plugin エントリーポイント](/ja-JP/plugins/sdk-entrypoints)と[検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-entrypoint-missing

パッケージは OpenClaw エントリーポイントを宣言していますが、参照先ファイルが検証中のパッケージにありません。

- `openclaw.extensions`、`openclaw.runtimeExtensions`、`openclaw.setupEntry`、`openclaw.runtimeSetupEntry` の各パスを確認します。
- エントリーポイントが `dist` に生成される場合は、パッケージをビルドします。
- エントリーポイントが移動した場合は、メタデータを更新します。
- [Plugin エントリーポイント](/ja-JP/plugins/sdk-entrypoints)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-install-metadata-incomplete

ClawHub はパッケージをどのようにインストールまたは更新すべきかを判断できません。

- `clawhubSpec`、`npmSpec`、`localPath` など、サポートされているインストールソースで `openclaw.install` を埋めます。
- 複数のインストールソースを利用できる場合は、`openclaw.install.defaultChoice` を設定します。
- OpenClaw ホストの最小バージョンには `openclaw.install.minHostVersion` を使用します。
- [検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-plugin-api-compat-missing

パッケージは、サポートする OpenClaw Plugin API 範囲を宣言していません。

- `package.json` に `openclaw.compat.pluginApi` を追加します。
- ビルドおよびテストの対象にした OpenClaw Plugin API バージョンまたは semver 下限を使用します。
- これはパッケージバージョンとは分けておきます。パッケージバージョンは Plugin リリースを表し、`openclaw.compat.pluginApi` はホスト API コントラクトを表します。
- [検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-min-host-version-drift

パッケージの最小ホストバージョンが、そのパッケージのビルド対象になった OpenClaw バージョンメタデータと一致していません。

- `openclaw.install.minHostVersion` を確認します。
- リリース中に使用された OpenClaw バージョンなど、パッケージ内の OpenClaw ビルドメタデータを確認します。
- 最小ホストバージョンを、パッケージが実際にサポートするホストバージョン範囲にそろえます。
- [検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-manifest-version-drift

パッケージバージョンと Plugin マニフェストバージョンが一致していません。

- パッケージリリースバージョンとしては `package.json#version` を優先します。
- `openclaw.plugin.json` にも `version` がある場合は、それを一致するように更新するか、パッケージメタデータが権威である場合は古いマニフェストバージョンメタデータを削除します。
- 公開済みメタデータを変更した後は、新しいパッケージバージョンを公開します。
- [Plugin マニフェスト](/ja-JP/plugins/manifest)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-openclaw-unsupported-metadata

`package.json#openclaw` ブロックに、サポートされていない OpenClaw パッケージメタデータのフィールドが含まれています。

- `openclaw.bundle` などのサポートされていないフィールドを削除します。
- ネイティブ Plugin メタデータは `openclaw.plugin.json` に保持します。
- パッケージエントリーポイント、互換性、インストール、セットアップ、カタログメタデータは、サポートされている `package.json#openclaw` フィールドに保持します。
- [検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

## 公開済みアーティファクト

### package-npm-pack-unavailable

パッケージを、ClawHub が検査または公開するアーティファクトにパックできません。

- パッケージルートから `npm pack --dry-run` を実行します。
- パック失敗の原因になる無効なパッケージメタデータ、壊れたライフサイクルスクリプト、または files エントリーを修正します。
- このパッケージを公開する意図がある場合は、`private: true` を削除します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-npm-pack-entrypoint-missing

パッケージはパックできますが、パックされたアーティファクトに `package.json#openclaw` で宣言されたエントリーポイントファイルが含まれていません。

- `npm pack --dry-run` を実行し、含まれる予定のファイルを確認します。
- 生成されるエントリーポイントをパック前にビルドします。
- 宣言されたエントリーポイントが含まれるように、`files`、`.npmignore`、またはビルド出力を更新します。
- [Plugin エントリーポイント](/ja-JP/plugins/sdk-entrypoints)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-npm-pack-metadata-missing

パックされたアーティファクトに、ソースパッケージには存在する OpenClaw メタデータがありません。

- `npm pack --dry-run` を実行し、含まれるメタデータファイルを確認します。
- パックされたアーティファクト内の `package.json` に `openclaw` ブロックが含まれるようにします。
- パッケージがネイティブ OpenClaw Plugin の場合は、`openclaw.plugin.json` が含まれるようにします。
- パッケージメタデータが除外されないように、`files` または `.npmignore` を更新します。
- [Plugin の構築](/ja-JP/plugins/building-plugins)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

## マニフェストメタデータ

### manifest-name-missing

ネイティブPluginマニフェストに表示名が含まれていません。

- `openclaw.plugin.json` に空でない `name` フィールドを追加します。
- `name` は人間が読める形式にし、`id` は安定したマシンIDとして維持します。
- [Pluginマニフェスト](/ja-JP/plugins/manifest)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### manifest-unknown-fields

Pluginマニフェストに、OpenClaw がサポートしていないトップレベルフィールドがあります。

- 各トップレベルフィールドを
  [マニフェストフィールドリファレンス](/ja-JP/plugins/manifest#top-level-field-reference)と比較します。
- `openclaw.plugin.json` からカスタムフィールドを削除します。
- パッケージまたはインストールのメタデータは、マニフェストではなく、サポートされている `package.json#openclaw` フィールドに移動します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### manifest-unknown-contracts

マニフェストが `contracts` 内でサポートされていないキーを宣言しています。

- `contracts` 配下の各キーを
  [contractsリファレンス](/ja-JP/plugins/manifest#contracts-reference)と比較します。
- サポートされていないコントラクトキーを削除します。
- ランタイム動作はPlugin登録コードに移動し、`contracts` は静的なケイパビリティ所有権メタデータに限定します。
- `clawhub package validate <path-to-plugin>` を再実行します。

## SDKと互換性移行

### legacy-root-sdk-import

Pluginが非推奨のルートSDKバレルからインポートしています:
`openclaw/plugin-sdk`.

- ルートバレルのインポートを、焦点を絞った公開サブパスインポートに置き換えます。
- `definePluginEntry` には `openclaw/plugin-sdk/plugin-entry` を使用します。
- チャンネルエントリヘルパーには `openclaw/plugin-sdk/channel-core` を使用します。
- 狭いインポートを見つけるには、[インポート規約](/ja-JP/plugins/building-plugins#import-conventions)と
  [Plugin SDKサブパス](/ja-JP/plugins/sdk-subpaths)を使用します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### reserved-sdk-import

Pluginが、バンドル済みPluginまたは内部互換性用に予約されたSDKパスをインポートしています。

- 予約済みの OpenClaw 内部SDKインポートを、文書化された公開
  `openclaw/plugin-sdk/*` サブパスに置き換えます。
- その動作に公開SDKがない場合は、ヘルパーを自分のパッケージ内に保持するか、公開 OpenClaw APIをリクエストします。
- サポートされているインポートを選ぶには、[Plugin SDKサブパス](/ja-JP/plugins/sdk-subpaths)と
  [SDK移行](/ja-JP/plugins/sdk-migration)を使用します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-load-session-store

Pluginが、非推奨のセッションストア全体ヘルパー
`loadSessionStore` をまだ使用しています。

- セッション状態を読み取る場合は、`getSessionEntry(...)` または `listSessionEntries(...)` を使用します。
- セッション状態を書き込む場合は、`patchSessionEntry(...)` または `upsertSessionEntry(...)` を使用します。
- セッションストアオブジェクト全体の読み込み、変更、保存は避けます。
- 宣言した互換性範囲が、それを必要とする古い OpenClaw バージョンをまだサポートしている間だけ、`loadSessionStore(...)` を維持します。
- [Runtime API](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDKサブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-session-store-write

Pluginが、`saveSessionStore` や `updateSessionStore` などの非推奨のセッションストア全体書き込みヘルパーをまだ使用しています。

- 既存のセッションエントリ上のフィールドを更新する場合は、`patchSessionEntry(...)` を使用します。
- セッションエントリを置き換える、または作成する場合は、`upsertSessionEntry(...)` を使用します。
- セッションストアオブジェクト全体の読み込み、変更、保存は避けます。
- 宣言した互換性範囲が、それらを必要とする古い OpenClaw バージョンをまだサポートしている間だけ、ストア全体の書き込みヘルパーを維持します。
- [Runtime API](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDKサブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-session-file-helper

Pluginが、`resolveSessionFilePath` や `resolveAndPersistSessionFile` などの非推奨のセッションファイルパスヘルパーをまだ使用しています。

- エージェントとセッションIDごとにセッションメタデータを読み取るには、`getSessionEntry(...)` を使用します。
- セッションメタデータを永続化するには、`patchSessionEntry(...)` または `upsertSessionEntry(...)` を使用します。
- コードがトランスクリプト操作を準備している場合は、トランスクリプトIDまたはターゲットヘルパーを使用します。
- レガシートランスクリプトファイルパスを永続化したり、それに依存したりしないでください。
- [Runtime API](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDKサブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-session-transcript-file-target

Pluginが、非推奨のトランスクリプトファイルターゲットヘルパー
`resolveSessionTranscriptLegacyFileTarget` をまだ使用しています。

- コードが公開セッションIDだけを必要とする場合は、`resolveSessionTranscriptIdentity(...)` を使用します。
- コードが構造化されたトランスクリプト操作ターゲットを必要とする場合は、`resolveSessionTranscriptTarget(...)` を使用します。
- レガシートランスクリプトファイルターゲットを直接読み取ったり構築したりすることは避けます。
- 宣言した互換性範囲が、それを必要とする古い OpenClaw バージョンをまだサポートしている間だけ、レガシーヘルパーを維持します。
- [Runtime API](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDKサブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-session-transcript-low-level

Pluginが、`appendSessionTranscriptMessage` や `emitSessionTranscriptUpdate` などの非推奨の低レベルトランスクリプトヘルパーをまだ使用しています。

- トランスクリプトの追加には `appendSessionTranscriptMessageByIdentity(...)` を使用します。
- トランスクリプト更新通知には `publishSessionTranscriptUpdateByIdentity(...)` を使用します。
- OpenClaw が正しいトランザクション境界とID処理を適用できるように、構造化されたトランスクリプトランタイムサーフェスを優先します。
- 宣言した互換性範囲が、それらを必要とする古い OpenClaw バージョンをまだサポートしている間だけ、低レベルトランスクリプトヘルパーを維持します。
- [Runtime API](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDKサブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### legacy-before-agent-start

Pluginがレガシーの `before_agent_start` フックをまだ使用しています。

- モデルまたはプロバイダーのオーバーライド作業は `before_model_resolve` に移動します。
- プロンプトまたはコンテキストの変更作業は `before_prompt_build` に移動します。
- 宣言した互換性範囲が、それを必要とする古い OpenClaw バージョンをまだサポートしている間だけ、`before_agent_start` を維持します。
- [フック](/ja-JP/plugins/hooks)と
  [Plugin互換性](/ja-JP/plugins/compatibility)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### provider-auth-env-vars

マニフェストがレガシーの `providerAuthEnvVars` プロバイダー認証メタデータをまだ使用しています。

- プロバイダーの環境変数メタデータを `setup.providers[].envVars` にミラーします。
- サポート対象の OpenClaw 範囲がまだ必要としている間だけ、互換性メタデータとして `providerAuthEnvVars` を維持します。
- [setupリファレンス](/ja-JP/plugins/manifest#setup-reference)と
  [SDK移行](/ja-JP/plugins/sdk-migration)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### channel-env-vars

マニフェストが、ClawHub が期待する現在のsetupまたは設定メタデータなしで、レガシーまたは古いチャンネル環境変数メタデータを使用しています。

- チャンネル環境変数メタデータは宣言的に保ち、OpenClaw がチャンネルランタイムを読み込まずにsetup状態を検査できるようにします。
- 環境変数駆動のチャンネルsetupを、Plugin形状で使用される現在のsetup、チャンネル設定、またはパッケージチャンネルメタデータにミラーします。
- 古いサポート対象の OpenClaw バージョンがまだ必要としている間だけ、互換性メタデータとして `channelEnvVars` を維持します。
- [Pluginマニフェスト](/ja-JP/plugins/manifest)と
  [チャンネルPlugin](/ja-JP/plugins/sdk-channel-plugins)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

## セキュリティマニフェスト

### security-manifest-schema-unavailable

パッケージが、ClawHub が利用可能として認識しないスキーマ参照付きの `openclaw.security.json` を同梱しています。

- アドバイザリ目的のみの場合は、スキーマURLを削除します。
- OpenClaw が公開した後でのみ、文書化されたバージョン付きスキーマを使用します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### unrecognized-security-manifest

パッケージがサポートされていないセキュリティマニフェストファイルを同梱しています。

- OpenClaw がバージョン付きセキュリティマニフェストスキーマと ClawHub の動作を文書化するまで、`openclaw.security.json` を削除します。
- マニフェスト契約が存在するまでは、セキュリティ上重要な動作を公開パッケージドキュメントまたはREADMEに記載します。
- `clawhub package validate <path-to-plugin>` を再実行します。

## 関連

- [ClawHub CLI](/ja-JP/clawhub/cli)
- [ClawHub公開](/ja-JP/clawhub/publishing)
- [Pluginのビルド](/ja-JP/plugins/building-plugins)
- [Pluginマニフェスト](/ja-JP/plugins/manifest)
- [Pluginエントリポイント](/ja-JP/plugins/sdk-entrypoints)
- [Plugin互換性](/ja-JP/plugins/compatibility)

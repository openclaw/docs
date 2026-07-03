---
read_when:
    - clawhub package validate を実行し、Plugin の検出事項を修正する必要がある
    - ClawHub が Plugin パッケージの公開を拒否または警告した
    - リリース前にPluginパッケージメタデータを更新しています
summary: 公開前に ClawHub Plugin パッケージ検証の指摘事項を修正する
title: Plugin 検証の修正
x-i18n:
    generated_at: "2026-07-03T13:15:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Plugin 検証修正

ClawHub は公開前に Plugin パッケージを検証し、自動パッケージスキャンの検出結果も表示できます。このページでは、作者が対応する検出結果、つまり Plugin 作者が自分のパッケージメタデータ、マニフェスト、SDK インポート、または公開済み成果物で修正できる検出結果について説明します。

内部の Plugin Inspector カバレッジ検出結果は扱いません。完全なレポートに作者向けの修正ガイダンスがないスキャナーメンテナンスコードが含まれる場合、それらは Plugin 作者ではなく OpenClaw メンテナー向けです。

修正を適用したら、再実行します。

```bash
clawhub package validate <path-to-plugin>
```

## 作者向けの検出結果

| コード                                    | ここから開始                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [パッケージメタデータを追加](/ja-JP/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [パッケージの openclaw ブロックを追加](/ja-JP/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [OpenClaw パッケージエントリポイントを宣言](/ja-JP/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [宣言されたエントリポイントを公開](/ja-JP/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [インストールメタデータを完成](/ja-JP/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Plugin API 互換性を宣言](/ja-JP/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [最小ホストバージョンを合わせる](/ja-JP/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [パッケージとマニフェストのバージョンを合わせる](/ja-JP/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [サポートされていない OpenClaw パッケージメタデータを削除](/ja-JP/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [npm 成果物をパック可能にする](/ja-JP/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
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
| `sdk-session-transcript-file-target`    | [レガシーのトランスクリプトファイルターゲットを置換](/ja-JP/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [低レベルのトランスクリプトヘルパーを置換](/ja-JP/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [before_agent_start を置換](/ja-JP/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [プロバイダー環境変数をセットアップメタデータへ移動](/ja-JP/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [チャンネル環境変数を現在のメタデータにミラー](/ja-JP/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [利用できないセキュリティマニフェストスキーマ参照を削除](/ja-JP/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [サポートされていないセキュリティマニフェストファイルを削除](/ja-JP/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## パッケージメタデータ

### package-json-missing

パッケージルートに `package.json` が含まれていないため、ClawHub は npm パッケージ、バージョン、エントリポイント、または OpenClaw メタデータを識別できません。

- `name`、`version`、`type` を含む `package.json` を追加します。
- パッケージが OpenClaw Plugin を同梱する場合は、`openclaw` ブロックを追加します。
- 最小限のパッケージ例については [Plugin の構築](/ja-JP/plugins/building-plugins) を、パッケージとマニフェストの分離については [Plugin マニフェスト](/ja-JP/plugins/manifest#manifest-versus-packagejson) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-openclaw-metadata-missing

パッケージには `package.json` がありますが、OpenClaw パッケージメタデータを宣言していません。

- `package.json#openclaw` を追加します。
- `openclaw.extensions` や `openclaw.runtimeExtensions` などのエントリポイントメタデータを含めます。
- パッケージを ClawHub 経由で公開またはインストールする場合は、互換性とインストールメタデータを追加します。
- [検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-openclaw-entry-missing

パッケージメタデータは存在しますが、OpenClaw ランタイムエントリポイントを宣言していません。

- ネイティブ Plugin エントリポイントには `openclaw.extensions` を追加します。
- 公開パッケージでビルド済み JavaScript を読み込む必要がある場合は、`openclaw.runtimeExtensions` を追加します。
- すべてのエントリポイントパスをパッケージディレクトリ内に保ちます。
- [Plugin エントリポイント](/ja-JP/plugins/sdk-entrypoints) と [検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-entrypoint-missing

パッケージは OpenClaw エントリポイントを宣言していますが、参照されているファイルが検証対象のパッケージにありません。

- `openclaw.extensions`、`openclaw.runtimeExtensions`、`openclaw.setupEntry`、`openclaw.runtimeSetupEntry` の各パスを確認します。
- エントリポイントが `dist` に生成される場合は、パッケージをビルドします。
- エントリポイントが移動した場合は、メタデータを更新します。
- [Plugin エントリポイント](/ja-JP/plugins/sdk-entrypoints) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-install-metadata-incomplete

ClawHub はパッケージをどのようにインストールまたは更新すべきかを判断できません。

- `openclaw.install` に、`clawhubSpec`、`npmSpec`、`localPath` など、サポートされているインストール元を入力します。
- 複数のインストール元を利用できる場合は、`openclaw.install.defaultChoice` を設定します。
- OpenClaw ホストの最小バージョンには `openclaw.install.minHostVersion` を使用します。
- [検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-plugin-api-compat-missing

パッケージはサポートする OpenClaw Plugin API 範囲を宣言していません。

- `package.json` に `openclaw.compat.pluginApi` を追加します。
- ビルドしてテストした対象の OpenClaw Plugin API バージョンまたは semver 下限を使用します。
- これはパッケージバージョンとは分けてください。パッケージバージョンは Plugin リリースを表し、`openclaw.compat.pluginApi` はホスト API コントラクトを表します。
- [検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-min-host-version-drift

パッケージの最小ホストバージョンが、パッケージのビルド対象になった OpenClaw バージョンメタデータと一致していません。

- `openclaw.install.minHostVersion` を確認します。
- リリース時に使用した OpenClaw バージョンなど、パッケージ内の OpenClaw ビルドメタデータを確認します。
- 最小ホストバージョンを、パッケージが実際にサポートするホストバージョン範囲に合わせます。
- [検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-manifest-version-drift

パッケージバージョンと Plugin マニフェストバージョンが一致していません。

- パッケージリリースバージョンとして `package.json#version` を優先します。
- `openclaw.plugin.json` にも `version` がある場合は、一致するよう更新するか、パッケージメタデータが信頼できる情報源であるときは古いマニフェストバージョンメタデータを削除します。
- 公開済みメタデータを変更した後は、新しいパッケージバージョンを公開します。
- [Plugin マニフェスト](/ja-JP/plugins/manifest) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-openclaw-unsupported-metadata

`package.json#openclaw` ブロックに、OpenClaw パッケージメタデータとしてサポートされていないフィールドが含まれています。

- `openclaw.bundle` などのサポートされていないフィールドを削除します。
- ネイティブ Plugin メタデータは `openclaw.plugin.json` に保ちます。
- パッケージエントリポイント、互換性、インストール、セットアップ、カタログメタデータは、サポートされている `package.json#openclaw` フィールドに保ちます。
- [検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

## 公開済み成果物

### package-npm-pack-unavailable

パッケージを、ClawHub が検査または公開する成果物へパックできません。

- パッケージルートから `npm pack --dry-run` を実行します。
- パックに失敗する原因となる無効なパッケージメタデータ、壊れたライフサイクルスクリプト、または files エントリを修正します。
- このパッケージを公開する意図がある場合は、`private: true` を削除します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-npm-pack-entrypoint-missing

パッケージはパックできますが、パックされた成果物に `package.json#openclaw` で宣言されたエントリポイントファイルが含まれていません。

- `npm pack --dry-run` を実行し、含まれる予定のファイルを確認します。
- パック前に生成されるエントリポイントをビルドします。
- 宣言されたエントリポイントが含まれるよう、`files`、`.npmignore`、またはビルド出力を更新します。
- [Plugin エントリポイント](/ja-JP/plugins/sdk-entrypoints) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-npm-pack-metadata-missing

パックされた成果物に、ソースパッケージには存在する OpenClaw メタデータがありません。

- `npm pack --dry-run` を実行し、含まれているメタデータファイルを確認します。
- パックされた成果物内の `package.json` に `openclaw` ブロックが含まれていることを確認します。
- パッケージがネイティブ OpenClaw Plugin の場合は、`openclaw.plugin.json` が含まれていることを確認します。
- パッケージメタデータが除外されないよう、`files` または `.npmignore` を更新します。
- [Plugin の構築](/ja-JP/plugins/building-plugins) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

## マニフェストメタデータ

### manifest-name-missing

ネイティブ Plugin マニフェストに表示名が含まれていません。

- 空でない `name` フィールドを `openclaw.plugin.json` に追加します。
- `name` は人間が読めるものにし、`id` は安定したマシン ID として維持します。
- [Plugin マニフェスト](/ja-JP/plugins/manifest)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### manifest-unknown-fields

Plugin マニフェストに、OpenClaw がサポートしていないトップレベルフィールドがあります。

- 各トップレベルフィールドを
  [マニフェストフィールドリファレンス](/ja-JP/plugins/manifest#top-level-field-reference)と比較します。
- カスタムフィールドを `openclaw.plugin.json` から削除します。
- パッケージまたはインストールのメタデータは、マニフェストではなく、サポートされている
  `package.json#openclaw` フィールドへ移動します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### manifest-unknown-contracts

マニフェストが、`contracts` 内でサポートされていないキーを宣言しています。

- `contracts` 配下の各キーを
  [contracts リファレンス](/ja-JP/plugins/manifest#contracts-reference)と比較します。
- サポートされていない contract キーを削除します。
- ランタイム動作は Plugin 登録コードへ移動し、`contracts` は静的なケイパビリティ所有権メタデータに限定します。
- `clawhub package validate <path-to-plugin>` を再実行します。

## SDK と互換性移行

### legacy-root-sdk-import

Plugin が非推奨のルート SDK バレルからインポートしています:
`openclaw/plugin-sdk`.

- ルートバレルのインポートを、焦点を絞った公開サブパスインポートに置き換えます。
- `definePluginEntry` には `openclaw/plugin-sdk/plugin-entry` を使用します。
- channel エントリヘルパーには `openclaw/plugin-sdk/channel-core` を使用します。
- 狭いインポートを見つけるには、[インポート規約](/ja-JP/plugins/building-plugins#import-conventions)と
  [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)を使用します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### reserved-sdk-import

Plugin が、バンドル済み Plugin または内部互換性用に予約された SDK パスをインポートしています。

- 予約された OpenClaw 内部 SDK インポートを、文書化された公開
  `openclaw/plugin-sdk/*` サブパスに置き換えます。
- その動作に公開 SDK がない場合は、ヘルパーを自分のパッケージ内に維持するか、
  公開 OpenClaw API をリクエストします。
- サポートされているインポートを選ぶには、[Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)と
  [SDK 移行](/ja-JP/plugins/sdk-migration)を使用します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-load-session-store

Plugin はまだ、非推奨のセッションストア全体ヘルパー
`loadSessionStore` を使用しています。

- セッション状態を読み取るときは、`getSessionEntry(...)` または `listSessionEntries(...)` を使用します。
- セッション状態を書き込むときは、`patchSessionEntry(...)` または `upsertSessionEntry(...)` を使用します。
- セッションストアオブジェクト全体を読み込み、変更し、保存することは避けます。
- 宣言した互換性範囲が、それを必要とする古い OpenClaw バージョンをまだサポートしている間だけ、
  `loadSessionStore(...)` を維持します。
- [ランタイム API](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-session-store-write

Plugin はまだ、`saveSessionStore` や `updateSessionStore` などの非推奨のセッションストア全体書き込みヘルパーを使用しています。

- 既存のセッションエントリ上のフィールドを更新するときは、`patchSessionEntry(...)` を使用します。
- セッションエントリを置換または作成するときは、`upsertSessionEntry(...)` を使用します。
- セッションストアオブジェクト全体を読み込み、変更し、保存することは避けます。
- 宣言した互換性範囲が、それらを必要とする古い OpenClaw バージョンをまだサポートしている間だけ、
  ストア全体の書き込みヘルパーを維持します。
- [ランタイム API](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-session-file-helper

Plugin はまだ、`resolveSessionFilePath` や `resolveAndPersistSessionFile` などの非推奨のセッションファイルパスヘルパーを使用しています。

- agent とセッション ID によってセッションメタデータを読み取るには、`getSessionEntry(...)` を使用します。
- セッションメタデータを永続化するには、`patchSessionEntry(...)` または `upsertSessionEntry(...)` を使用します。
- コードが transcript 操作を準備している場合は、transcript ID または target ヘルパーを使用します。
- レガシー transcript ファイルパスを永続化したり、それに依存したりしないでください。
- [ランタイム API](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-session-transcript-file-target

Plugin はまだ、非推奨の transcript ファイル target ヘルパー
`resolveSessionTranscriptLegacyFileTarget` を使用しています。

- コードが公開セッション ID だけを必要とする場合は、`resolveSessionTranscriptIdentity(...)` を使用します。
- コードが構造化された transcript 操作 target を必要とする場合は、`resolveSessionTranscriptTarget(...)` を使用します。
- レガシー transcript ファイル target を直接読み取ったり構築したりすることは避けます。
- 宣言した互換性範囲が、それを必要とする古い OpenClaw バージョンをまだサポートしている間だけ、
  レガシーヘルパーを維持します。
- [ランタイム API](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-session-transcript-low-level

Plugin はまだ、`appendSessionTranscriptMessage` や `emitSessionTranscriptUpdate` などの非推奨の低レベル transcript ヘルパーを使用しています。

- transcript の追記には `appendSessionTranscriptMessageByIdentity(...)` を使用します。
- transcript 更新通知には `publishSessionTranscriptUpdateByIdentity(...)` を使用します。
- OpenClaw が正しいトランザクション境界と ID 処理を適用できるように、構造化された transcript ランタイムサーフェスを優先します。
- 宣言した互換性範囲が、それらを必要とする古い OpenClaw バージョンをまだサポートしている間だけ、
  低レベル transcript ヘルパーを維持します。
- [ランタイム API](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### legacy-before-agent-start

Plugin はまだレガシーの `before_agent_start` フックを使用しています。

- モデルまたはプロバイダーの上書き処理を `before_model_resolve` へ移動します。
- プロンプトまたはコンテキストの変更処理を `before_prompt_build` へ移動します。
- 宣言した互換性範囲が、それを必要とする古い OpenClaw バージョンをまだサポートしている間だけ、
  `before_agent_start` を維持します。
- [フック](/ja-JP/plugins/hooks)と
  [Plugin 互換性](/ja-JP/plugins/compatibility)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### provider-auth-env-vars

マニフェストはまだ、レガシーの `providerAuthEnvVars` プロバイダー認証メタデータを使用しています。

- プロバイダーの環境変数メタデータを `setup.providers[].envVars` にミラーします。
- サポート対象の OpenClaw 範囲がまだ必要としている間だけ、互換性メタデータとして `providerAuthEnvVars` を維持します。
- [setup リファレンス](/ja-JP/plugins/manifest#setup-reference)と
  [SDK 移行](/ja-JP/plugins/sdk-migration)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### channel-env-vars

マニフェストは、ClawHub が期待する現在の setup または config メタデータを伴わない、レガシーまたは古い channel 環境変数メタデータを使用しています。

- OpenClaw が channel ランタイムを読み込まずに setup 状態を検査できるように、channel 環境変数メタデータは宣言的に維持します。
- 環境変数駆動の channel setup を、Plugin 形状で使用される現在の setup、channel config、またはパッケージ channel メタデータにミラーします。
- 古いサポート対象 OpenClaw バージョンがまだ必要としている間だけ、互換性メタデータとして `channelEnvVars` を維持します。
- [Plugin マニフェスト](/ja-JP/plugins/manifest)と
  [Channel Plugin](/ja-JP/plugins/sdk-channel-plugins)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

## セキュリティマニフェスト

### security-manifest-schema-unavailable

パッケージは `openclaw.security.json` を同梱していますが、そのスキーマ参照は ClawHub が利用可能として認識していません。

- スキーマ URL が助言目的のみであれば削除します。
- OpenClaw が公開した後でのみ、文書化されたバージョン付きスキーマを使用します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### unrecognized-security-manifest

パッケージはサポートされていないセキュリティマニフェストファイルを同梱しています。

- OpenClaw がバージョン付きセキュリティマニフェストスキーマと ClawHub の動作を文書化するまで、
  `openclaw.security.json` を削除します。
- マニフェスト contract が存在するまでは、セキュリティセンシティブな動作を公開パッケージドキュメントまたは
  README に記載します。
- `clawhub package validate <path-to-plugin>` を再実行します。

## 関連

- [ClawHub CLI](/ja-JP/clawhub/cli)
- [ClawHub 公開](/ja-JP/clawhub/publishing)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [Plugin マニフェスト](/ja-JP/plugins/manifest)
- [Plugin エントリポイント](/ja-JP/plugins/sdk-entrypoints)
- [Plugin 互換性](/ja-JP/plugins/compatibility)

---
read_when:
    - '`clawhub package validate` を実行し、Plugin の指摘事項を修正する必要がある'
    - ClawHub が Plugin パッケージの公開を拒否または警告した
    - リリース前に Plugin パッケージのメタデータを更新しています
summary: 公開前に ClawHub Plugin パッケージ検証の指摘を修正する
title: Plugin 検証の修正
x-i18n:
    generated_at: "2026-07-05T20:17:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Plugin 検証の修正

ClawHub は公開前に Plugin パッケージを検証し、自動パッケージスキャンの検出事項も表示できます。このページでは、作者向けの検出事項、つまり Plugin 作者が自分のパッケージメタデータ、マニフェスト、SDK インポート、または公開済みアーティファクトで修正できる検出事項を扱います。

内部の Plugin Inspector カバレッジ検出事項は扱いません。完全なレポートに作者向けの修正ガイダンスがないスキャナー保守コードが含まれる場合、それらは Plugin 作者ではなく OpenClaw メンテナー向けです。

修正を適用した後、再実行します。

```bash
clawhub package validate <path-to-plugin>
```

## 作者向けの検出事項

| コード                                    | まずここから                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [パッケージメタデータを追加する](/ja-JP/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [パッケージの openclaw ブロックを追加する](/ja-JP/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [OpenClaw パッケージエントリーポイントを宣言する](/ja-JP/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [宣言したエントリーポイントを公開する](/ja-JP/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [インストールメタデータを完成させる](/ja-JP/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Plugin API 互換性を宣言する](/ja-JP/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [最小ホストバージョンを合わせる](/ja-JP/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [パッケージとマニフェストのバージョンを合わせる](/ja-JP/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [サポートされていない OpenClaw パッケージメタデータを削除する](/ja-JP/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [npm アーティファクトをパック可能にする](/ja-JP/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [npm pack 出力にエントリーポイントを含める](/ja-JP/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [npm pack 出力にメタデータを含める](/ja-JP/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
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
| `provider-auth-env-vars`                | [provider 環境変数を setup メタデータへ移動する](/ja-JP/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [channel 環境変数を現在のメタデータに反映する](/ja-JP/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [利用できないセキュリティマニフェストスキーマ参照を削除する](/ja-JP/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [サポートされていないセキュリティマニフェストファイルを削除する](/ja-JP/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## パッケージメタデータ

### package-json-missing

パッケージルートに `package.json` が含まれていないため、ClawHub は npm パッケージ、バージョン、エントリーポイント、または OpenClaw メタデータを識別できません。

- `name`、`version`、`type` を含む `package.json` を追加します。
- パッケージが OpenClaw Plugin を同梱する場合は、`openclaw` ブロックを追加します。
- 最小パッケージ例については [Plugin の構築](/ja-JP/plugins/building-plugins) を、パッケージとマニフェストの分離については [Plugin マニフェスト](/ja-JP/plugins/manifest#manifest-versus-packagejson) を使用します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-openclaw-metadata-missing

パッケージに `package.json` はありますが、OpenClaw パッケージメタデータを宣言していません。

- `package.json#openclaw` を追加します。
- `openclaw.extensions` や `openclaw.runtimeExtensions` などのエントリーポイントメタデータを含めます。
- パッケージを ClawHub 経由で公開またはインストールする場合は、互換性メタデータとインストールメタデータを追加します。
- [検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-openclaw-entry-missing

パッケージメタデータは存在しますが、OpenClaw ランタイムエントリーポイントを宣言していません。

- ネイティブ Plugin エントリーポイントには `openclaw.extensions` を追加します。
- 公開済みパッケージがビルド済み JavaScript を読み込む必要がある場合は `openclaw.runtimeExtensions` を追加します。
- すべてのエントリーポイントパスをパッケージディレクトリ内に保ちます。
- [Plugin エントリーポイント](/ja-JP/plugins/sdk-entrypoints) と [検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-entrypoint-missing

パッケージは OpenClaw エントリーポイントを宣言していますが、参照されたファイルが検証対象のパッケージにありません。

- `openclaw.extensions`、`openclaw.runtimeExtensions`、`openclaw.setupEntry`、`openclaw.runtimeSetupEntry` の各パスを確認します。
- エントリーポイントが `dist` に生成される場合は、パッケージをビルドします。
- エントリーポイントが移動した場合は、メタデータを更新します。
- [Plugin エントリーポイント](/ja-JP/plugins/sdk-entrypoints) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-install-metadata-incomplete

ClawHub はパッケージをどのようにインストールまたは更新すべきか判断できません。

- `clawhubSpec`、`npmSpec`、`localPath` など、サポートされているインストールソースで `openclaw.install` を埋めます。
- 複数のインストールソースを利用できる場合は、`openclaw.install.defaultChoice` を設定します。
- OpenClaw ホストの最小バージョンには `openclaw.install.minHostVersion` を使用します。
- [検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-plugin-api-compat-missing

パッケージは、サポートする OpenClaw Plugin API 範囲を宣言していません。

- `package.json` に `openclaw.compat.pluginApi` を追加します。
- ビルドおよびテスト対象にした OpenClaw Plugin API バージョン、または semver の下限を使用します。
- これはパッケージバージョンとは分けて保持します。パッケージバージョンは Plugin リリースを表し、`openclaw.compat.pluginApi` はホスト API コントラクトを表します。
- [検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-min-host-version-drift

パッケージの最小ホストバージョンが、パッケージのビルド対象となった OpenClaw バージョンメタデータと一致しません。

- `openclaw.install.minHostVersion` を確認します。
- リリース時に使用した OpenClaw バージョンなど、パッケージ内の OpenClaw ビルドメタデータを確認します。
- 最小ホストバージョンを、パッケージが実際にサポートするホストバージョン範囲に合わせます。
- [検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-manifest-version-drift

パッケージバージョンと Plugin マニフェストバージョンが一致していません。

- パッケージリリースバージョンとしては `package.json#version` を優先します。
- `openclaw.plugin.json` にも `version` がある場合は、一致するように更新するか、パッケージメタデータが正とされる場合は古いマニフェストバージョンメタデータを削除します。
- 公開済みメタデータを変更した後は、新しいパッケージバージョンを公開します。
- [Plugin マニフェスト](/ja-JP/plugins/manifest) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-openclaw-unsupported-metadata

`package.json#openclaw` ブロックに、OpenClaw パッケージメタデータとしてサポートされていないフィールドが含まれています。

- `openclaw.bundle` などのサポートされていないフィールドを削除します。
- ネイティブ Plugin メタデータは `openclaw.plugin.json` に保持します。
- パッケージエントリーポイント、互換性、インストール、setup、カタログメタデータは、サポートされている `package.json#openclaw` フィールドに保持します。
- [検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

## 公開済みアーティファクト

### package-npm-pack-unavailable

パッケージを、ClawHub が検査または公開するアーティファクトにパックできません。

- パッケージルートから `npm pack --dry-run` を実行します。
- パックを失敗させる無効なパッケージメタデータ、壊れたライフサイクルスクリプト、または files エントリを修正します。
- このパッケージを公開する意図がある場合は、`private: true` を削除します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-npm-pack-entrypoint-missing

パッケージはパックできますが、パック済みアーティファクトに `package.json#openclaw` で宣言されたエントリーポイントファイルが含まれていません。

- `npm pack --dry-run` を実行し、含まれる予定のファイルを確認します。
- パック前に生成されるエントリーポイントをビルドします。
- 宣言済みエントリーポイントが含まれるように、`files`、`.npmignore`、またはビルド出力を更新します。
- [Plugin エントリーポイント](/ja-JP/plugins/sdk-entrypoints) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-npm-pack-metadata-missing

パック済みアーティファクトに、ソースパッケージに存在する OpenClaw メタデータがありません。

- `npm pack --dry-run` を実行し、含まれるメタデータファイルを確認します。
- パック済みアーティファクト内の `package.json` に `openclaw` ブロックが含まれていることを確認します。
- パッケージがネイティブ OpenClaw Plugin の場合は、`openclaw.plugin.json` が含まれていることを確認します。
- パッケージメタデータが除外されないように、`files` または `.npmignore` を更新します。
- [Plugin の構築](/ja-JP/plugins/building-plugins) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

## マニフェストメタデータ

### manifest-name-missing

ネイティブ Plugin マニフェストに表示名が含まれていません。

- 空でない `name` フィールドを `openclaw.plugin.json` に追加します。
- `name` は人が読める形式にし、`id` は安定した機械向け id として維持します。
- [Plugin マニフェスト](/ja-JP/plugins/manifest)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### manifest-unknown-fields

Plugin マニフェストに、OpenClaw がサポートしていないトップレベルフィールドがあります。

- 各トップレベルフィールドを
  [マニフェストフィールドリファレンス](/ja-JP/plugins/manifest#top-level-field-reference)と比較します。
- `openclaw.plugin.json` からカスタムフィールドを削除します。
- パッケージまたはインストールのメタデータは、マニフェストではなく、サポートされている `package.json#openclaw` フィールドへ移動します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### manifest-unknown-contracts

マニフェストが `contracts` 内でサポートされていないキーを宣言しています。

- `contracts` 配下の各キーを
  [contracts リファレンス](/ja-JP/plugins/manifest#contracts-reference)と比較します。
- サポートされていない contract キーを削除します。
- ランタイム動作は Plugin 登録コードへ移動し、`contracts` は静的な機能所有権メタデータに限定します。
- `clawhub package validate <path-to-plugin>` を再実行します。

## SDK と互換性移行

### legacy-root-sdk-import

Plugin が非推奨のルート SDK バレルからインポートしています:
`openclaw/plugin-sdk`.

- ルートバレルインポートを、焦点を絞った公開サブパスインポートに置き換えます。
- `definePluginEntry` には `openclaw/plugin-sdk/plugin-entry` を使用します。
- チャンネルエントリヘルパーには `openclaw/plugin-sdk/channel-core` を使用します。
- 狭いインポートを見つけるには、[インポート規約](/ja-JP/plugins/building-plugins#import-conventions)と
  [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)を使用します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### reserved-sdk-import

Plugin が、同梱 Plugin または内部互換性用に予約された SDK パスをインポートしています。

- 予約済みの OpenClaw 内部 SDK インポートを、文書化された公開
  `openclaw/plugin-sdk/*` サブパスに置き換えます。
- その動作に公開 SDK がない場合は、ヘルパーを自分のパッケージ内に保持するか、公開 OpenClaw API をリクエストします。
- サポートされているインポートを選ぶには、[Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)と
  [SDK 移行](/ja-JP/plugins/sdk-migration)を使用します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-load-session-store

Plugin が、非推奨のセッションストア全体ヘルパー
`loadSessionStore` をまだ使用しています。

- セッション状態を読み取るときは `getSessionEntry(...)` または `listSessionEntries(...)` を使用します。
- セッション状態を書き込むときは `patchSessionEntry(...)` または `upsertSessionEntry(...)` を使用します。
- セッションストアオブジェクト全体を読み込み、変更し、保存することは避けます。
- 宣言した互換性範囲が、それを必要とする古い OpenClaw バージョンをまだサポートしている場合に限り、`loadSessionStore(...)` を維持します。
- [ランタイム API](/ja-JP/plugins/sdk-runtime#agent-session-state) と
  [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-session-store-write

Plugin が、`saveSessionStore` や `updateSessionStore` などの非推奨のセッションストア全体書き込みヘルパーをまだ使用しています。

- 既存のセッションエントリ上のフィールドを更新するときは `patchSessionEntry(...)` を使用します。
- セッションエントリを置き換える、または作成するときは `upsertSessionEntry(...)` を使用します。
- セッションストアオブジェクト全体を読み込み、変更し、保存することは避けます。
- 宣言した互換性範囲が、それらを必要とする古い OpenClaw バージョンをまだサポートしている場合に限り、ストア全体の書き込みヘルパーを維持します。
- [ランタイム API](/ja-JP/plugins/sdk-runtime#agent-session-state) と
  [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-session-file-helper

Plugin が、`resolveSessionFilePath` や `resolveAndPersistSessionFile` などの非推奨のセッションファイルパスヘルパーをまだ使用しています。

- エージェントとセッション ID でセッションメタデータを読み取るには `getSessionEntry(...)` を使用します。
- セッションメタデータを永続化するには `patchSessionEntry(...)` または `upsertSessionEntry(...)` を使用します。
- コードが transcript 操作を準備している場合は、transcript ID またはターゲットヘルパーを使用します。
- レガシー transcript ファイルパスを永続化したり、それに依存したりしないでください。
- [ランタイム API](/ja-JP/plugins/sdk-runtime#agent-session-state) と
  [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-session-transcript-file-target

Plugin が、非推奨の transcript ファイルターゲットヘルパー
`resolveSessionTranscriptLegacyFileTarget` をまだ使用しています。

- コードが公開セッション ID のみを必要とする場合は `resolveSessionTranscriptIdentity(...)` を使用します。
- コードが構造化された transcript 操作ターゲットを必要とする場合は `resolveSessionTranscriptTarget(...)` を使用します。
- レガシー transcript ファイルターゲットを直接読み取ったり構築したりすることは避けます。
- 宣言した互換性範囲が、それを必要とする古い OpenClaw バージョンをまだサポートしている場合に限り、レガシーヘルパーを維持します。
- [ランタイム API](/ja-JP/plugins/sdk-runtime#agent-session-state) と
  [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-session-transcript-low-level

Plugin が、`appendSessionTranscriptMessage` や `emitSessionTranscriptUpdate` などの非推奨の低レベル transcript ヘルパーをまだ使用しています。

- transcript 追加には `appendSessionTranscriptMessageByIdentity(...)` を使用します。
- transcript 更新通知には `publishSessionTranscriptUpdateByIdentity(...)` を使用します。
- OpenClaw が適切なトランザクション境界と ID 処理を適用できるように、構造化された transcript ランタイムサーフェスを優先します。
- 宣言した互換性範囲が、それらを必要とする古い OpenClaw バージョンをまだサポートしている場合に限り、低レベル transcript ヘルパーを維持します。
- [ランタイム API](/ja-JP/plugins/sdk-runtime#agent-session-state) と
  [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### legacy-before-agent-start

Plugin がレガシーの `before_agent_start` フックをまだ使用しています。

- モデルまたはプロバイダー上書き処理は `before_model_resolve` へ移動します。
- プロンプトまたはコンテキスト変更処理は `before_prompt_build` へ移動します。
- 宣言した互換性範囲が、それを必要とする古い OpenClaw バージョンをまだサポートしている場合に限り、`before_agent_start` を維持します。
- [フック](/ja-JP/plugins/hooks)と
  [Plugin 互換性](/ja-JP/plugins/compatibility)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### provider-auth-env-vars

マニフェストがレガシーの `providerAuthEnvVars` プロバイダー認証メタデータをまだ使用しています。

- プロバイダー env-var メタデータを `setup.providers[].envVars` にミラーします。
- サポート対象の OpenClaw 範囲がまだ必要としている間に限り、`providerAuthEnvVars` を互換性メタデータとして維持します。
- [setup リファレンス](/ja-JP/plugins/manifest#setup-reference)と
  [SDK 移行](/ja-JP/plugins/sdk-migration)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### channel-env-vars

マニフェストが、現在 ClawHub が想定する setup または config メタデータなしで、レガシーまたは古いチャンネル env-var メタデータを使用しています。

- OpenClaw がチャンネルランタイムを読み込まずに setup 状態を検査できるように、チャンネル env-var メタデータは宣言的に保ちます。
- env 駆動のチャンネル setup を、Plugin の形に応じて使用される現在の setup、チャンネル config、またはパッケージチャンネルメタデータへミラーします。
- 古いサポート対象 OpenClaw バージョンがまだ必要としている間に限り、`channelEnvVars` を互換性メタデータとして維持します。
- [Plugin マニフェスト](/ja-JP/plugins/manifest)と
  [チャンネル Plugin](/ja-JP/plugins/sdk-channel-plugins)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

## セキュリティマニフェスト

### security-manifest-schema-unavailable

パッケージが、ClawHub が利用可能として認識しないスキーマ参照を含む `openclaw.security.json` を同梱しています。

- スキーマ URL が助言目的のみの場合は削除します。
- OpenClaw が公開した後に限り、文書化されたバージョン付きスキーマを使用します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### unrecognized-security-manifest

パッケージがサポートされていないセキュリティマニフェストファイルを同梱しています。

- OpenClaw がバージョン付きセキュリティマニフェストスキーマと ClawHub の動作を文書化するまで、`openclaw.security.json` を削除します。
- マニフェスト契約が存在するまでは、セキュリティに関わる動作を公開パッケージドキュメントまたは README に記載します。
- `clawhub package validate <path-to-plugin>` を再実行します。

## 関連

- [ClawHub CLI](/ja-JP/clawhub/cli)
- [ClawHub 公開](/ja-JP/clawhub/publishing)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [Plugin マニフェスト](/ja-JP/plugins/manifest)
- [Plugin エントリポイント](/ja-JP/plugins/sdk-entrypoints)
- [Plugin 互換性](/ja-JP/plugins/compatibility)

---
read_when:
    - clawhub package validate を実行して、Plugin の検出事項を修正する必要があります
    - ClawHub が Plugin パッケージの公開を拒否または警告した
    - リリース前に Plugin パッケージのメタデータを更新しています
summary: ClawHub Plugin パッケージ検証の指摘事項を公開前に修正する
title: Plugin 検証の修正
x-i18n:
    generated_at: "2026-07-06T21:46:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Plugin 検証の修正

ClawHub は公開前に Plugin パッケージを検証し、自動パッケージスキャンからの検出結果も表示できます。このページでは、作者向けの検出結果を扱います。つまり、Plugin 作者が自分のパッケージメタデータ、マニフェスト、SDK インポート、または公開済みアーティファクトで修正できる検出結果です。

内部 Plugin Inspector カバレッジの検出結果は扱いません。完全なレポートに作者向けの修正ガイダンスがないスキャナー保守コードが含まれる場合、それらは Plugin 作者ではなく OpenClaw メンテナー向けです。

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
| `legacy-root-sdk-import`                | [ルート SDK インポートを置き換え](/ja-JP/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [予約済み SDK インポートを削除](/ja-JP/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [セッションストア全体へのアクセスを置き換え](/ja-JP/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [セッションストア全体への書き込みを置き換え](/ja-JP/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [セッションファイルパスヘルパーを置き換え](/ja-JP/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [レガシートランスクリプトファイルターゲットを置き換え](/ja-JP/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [低レベルのトランスクリプトヘルパーを置き換え](/ja-JP/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [before_agent_start を置き換え](/ja-JP/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [プロバイダー環境変数をセットアップメタデータへ移動](/ja-JP/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [現在のメタデータでチャンネル環境変数をミラー](/ja-JP/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [利用できないセキュリティマニフェストスキーマ参照を削除](/ja-JP/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [サポートされていないセキュリティマニフェストファイルを削除](/ja-JP/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## パッケージメタデータ

### package-json-missing

パッケージルートに `package.json` が含まれていないため、ClawHub は npm パッケージ、バージョン、エントリポイント、または OpenClaw メタデータを識別できません。

- `name`、`version`、`type` を含む `package.json` を追加します。
- パッケージが OpenClaw Plugin を出荷する場合は、`openclaw` ブロックを追加します。
- 最小パッケージ例には [Plugin の構築](/ja-JP/plugins/building-plugins) を、パッケージとマニフェストの分離には [Plugin マニフェスト](/ja-JP/plugins/manifest#manifest-versus-packagejson) を使用します。
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
- 公開済みパッケージがビルド済み JavaScript を読み込む必要がある場合は、`openclaw.runtimeExtensions` を追加します。
- すべてのエントリポイントパスをパッケージディレクトリ内に保ちます。
- [Plugin エントリポイント](/ja-JP/plugins/sdk-entrypoints) と [検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-entrypoint-missing

パッケージは OpenClaw エントリポイントを宣言していますが、参照されたファイルが検証対象パッケージにありません。

- `openclaw.extensions`、`openclaw.runtimeExtensions`、`openclaw.setupEntry`、`openclaw.runtimeSetupEntry` の各パスを確認します。
- エントリポイントが `dist` に生成される場合は、パッケージをビルドします。
- エントリポイントが移動した場合は、メタデータを更新します。
- [Plugin エントリポイント](/ja-JP/plugins/sdk-entrypoints) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-install-metadata-incomplete

ClawHub はパッケージをどのようにインストールまたは更新すべきか判断できません。

- `openclaw.install` に、`clawhubSpec`、`npmSpec`、`localPath` など、サポートされているインストールソースを入力します。
- 複数のインストールソースが利用可能な場合は、`openclaw.install.defaultChoice` を設定します。
- 最小 OpenClaw ホストバージョンには `openclaw.install.minHostVersion` を使用します。
- [検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-plugin-api-compat-missing

パッケージは、サポートする OpenClaw Plugin API 範囲を宣言していません。

- `package.json` に `openclaw.compat.pluginApi` を追加します。
- 構築およびテストした対象の OpenClaw Plugin API バージョンまたは semver 下限を使用します。
- これはパッケージバージョンとは分けてください。パッケージバージョンは Plugin リリースを表し、`openclaw.compat.pluginApi` はホスト API コントラクトを表します。
- [検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-min-host-version-drift

パッケージの最小ホストバージョンが、そのパッケージを構築した対象の OpenClaw バージョンメタデータと一致しません。

- `openclaw.install.minHostVersion` を確認します。
- リリース時に使用された OpenClaw バージョンなど、パッケージ内の OpenClaw ビルドメタデータを確認します。
- 最小ホストバージョンを、パッケージが実際にサポートするホストバージョン範囲に揃えます。
- [検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-manifest-version-drift

パッケージバージョンと Plugin マニフェストバージョンが一致しません。

- パッケージリリースバージョンとして `package.json#version` を優先します。
- `openclaw.plugin.json` にも `version` がある場合は、一致するように更新するか、パッケージメタデータが正である場合は古いマニフェストバージョンメタデータを削除します。
- 公開済みメタデータを変更した後は、新しいパッケージバージョンを公開します。
- [Plugin マニフェスト](/ja-JP/plugins/manifest) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-openclaw-unsupported-metadata

`package.json#openclaw` ブロックに、OpenClaw パッケージメタデータとしてサポートされていないフィールドが含まれています。

- `openclaw.bundle` など、サポートされていないフィールドを削除します。
- ネイティブ Plugin メタデータは `openclaw.plugin.json` に保持します。
- パッケージエントリポイント、互換性、インストール、セットアップ、カタログメタデータは、サポートされている `package.json#openclaw` フィールドに保持します。
- [検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

## 公開済みアーティファクト

### package-npm-pack-unavailable

パッケージを、ClawHub が検査または公開するアーティファクトにパックできません。

- パッケージルートから `npm pack --dry-run` を実行します。
- パック失敗の原因になる無効なパッケージメタデータ、壊れたライフサイクルスクリプト、または files エントリを修正します。
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

パック済みアーティファクトに、ソースパッケージに存在する OpenClaw メタデータがありません。

- `npm pack --dry-run` を実行し、含まれるメタデータファイルを確認します。
- パック済みアーティファクトの `package.json` に `openclaw` ブロックが含まれていることを確認します。
- パッケージがネイティブ OpenClaw Plugin の場合は、`openclaw.plugin.json` が含まれていることを確認します。
- パッケージメタデータが除外されないように、`files` または `.npmignore` を更新します。
- [Plugin の構築](/ja-JP/plugins/building-plugins) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

## マニフェストメタデータ

### manifest-name-missing

ネイティブ Plugin マニフェストに表示名が含まれていません。

- 空でない `name` フィールドを `openclaw.plugin.json` に追加します。
- `name` は人間が読める形式にし、`id` は安定したマシン ID として維持します。
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

マニフェストが `contracts` 内でサポートされていないキーを宣言しています。

- `contracts` 配下の各キーを
  [contracts リファレンス](/ja-JP/plugins/manifest#contracts-reference)と比較します。
- サポートされていない contract キーを削除します。
- ランタイム動作は Plugin 登録コードへ移動し、`contracts` は静的なケイパビリティ所有権メタデータに限定します。
- `clawhub package validate <path-to-plugin>` を再実行します。

## SDK と互換性移行

### legacy-root-sdk-import

Plugin が非推奨のルート SDK バレルからインポートしています。
`openclaw/plugin-sdk`

- ルートバレルのインポートを、対象を絞った公開サブパスインポートに置き換えます。
- `definePluginEntry` には `openclaw/plugin-sdk/plugin-entry` を使用します。
- チャネルエントリヘルパーには `openclaw/plugin-sdk/channel-core` を使用します。
- 範囲の狭いインポートを見つけるには、[インポート規約](/ja-JP/plugins/building-plugins#import-conventions)と
  [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)を使用します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### reserved-sdk-import

Plugin が、バンドル済み Plugin または内部互換性のために予約されている SDK パスをインポートしています。

- 予約済みの OpenClaw 内部 SDK インポートを、文書化された公開
  `openclaw/plugin-sdk/*` サブパスに置き換えます。
- その動作に公開 SDK がない場合は、ヘルパーを自分のパッケージ内に保持するか、
  公開 OpenClaw API をリクエストします。
- サポートされているインポートを選ぶには、[Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)と
  [SDK 移行](/ja-JP/plugins/sdk-migration)を使用します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-load-session-store

Plugin が、非推奨のセッションストア全体ヘルパー
`loadSessionStore` をまだ使用しています。

- セッション状態を読み取るときは、`getSessionEntry(...)` または `listSessionEntries(...)` を使用します。
- セッション状態を書き込むときは、`patchSessionEntry(...)` または `upsertSessionEntry(...)` を使用します。
- セッションストアオブジェクト全体の読み込み、変更、保存は避けます。
- 宣言済みの互換性範囲が、これを必要とする古い OpenClaw バージョンをまだサポートしている間だけ、
  `loadSessionStore(...)` を保持します。
- [ランタイム API](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-session-store-write

Plugin が、`saveSessionStore` や `updateSessionStore` などの非推奨のセッションストア全体書き込みヘルパーをまだ使用しています。

- 既存のセッションエントリのフィールドを更新するときは、`patchSessionEntry(...)` を使用します。
- セッションエントリを置換または作成するときは、`upsertSessionEntry(...)` を使用します。
- セッションストアオブジェクト全体の読み込み、変更、保存は避けます。
- 宣言済みの互換性範囲が、これらを必要とする古い OpenClaw バージョンをまだサポートしている間だけ、ストア全体の書き込みヘルパーを保持します。
- [ランタイム API](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-session-file-helper

Plugin が、`resolveSessionFilePath` や `resolveAndPersistSessionFile` などの非推奨のセッションファイルパスヘルパーをまだ使用しています。

- エージェントとセッションの ID によってセッションメタデータを読み取るには、`getSessionEntry(...)` を使用します。
- セッションメタデータを永続化するには、`patchSessionEntry(...)` または `upsertSessionEntry(...)` を使用します。
- コードがトランスクリプト操作を準備している場合は、トランスクリプト ID またはターゲットヘルパーを使用します。
- レガシーなトランスクリプトファイルパスを永続化したり、それに依存したりしないでください。
- [ランタイム API](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-session-transcript-file-target

Plugin が、非推奨のトランスクリプトファイルターゲットヘルパー
`resolveSessionTranscriptLegacyFileTarget` をまだ使用しています。

- コードが公開セッション ID だけを必要とする場合は、`resolveSessionTranscriptIdentity(...)` を使用します。
- コードが構造化されたトランスクリプト操作ターゲットを必要とする場合は、`resolveSessionTranscriptTarget(...)` を使用します。
- レガシーなトランスクリプトファイルターゲットを直接読み取ったり構築したりすることは避けます。
- 宣言済みの互換性範囲が、これを必要とする古い OpenClaw バージョンをまだサポートしている間だけ、レガシーヘルパーを保持します。
- [ランタイム API](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-session-transcript-low-level

Plugin が、`appendSessionTranscriptMessage` や `emitSessionTranscriptUpdate` などの非推奨の低レベルトランスクリプトヘルパーをまだ使用しています。

- トランスクリプトの追記には `appendSessionTranscriptMessageByIdentity(...)` を使用します。
- トランスクリプト更新通知には `publishSessionTranscriptUpdateByIdentity(...)` を使用します。
- OpenClaw が正しいトランザクション境界と ID 処理を適用できるように、構造化されたトランスクリプトランタイムサーフェスを優先します。
- 宣言済みの互換性範囲が、これらを必要とする古い OpenClaw バージョンをまだサポートしている間だけ、低レベルトランスクリプトヘルパーを保持します。
- [ランタイム API](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### legacy-before-agent-start

Plugin がレガシーな `before_agent_start` フックをまだ使用しています。

- モデルまたはプロバイダーの上書き処理は `before_model_resolve` へ移動します。
- プロンプトまたはコンテキストの変更処理は `before_prompt_build` へ移動します。
- 宣言済みの互換性範囲が、これを必要とする古い OpenClaw バージョンをまだサポートしている間だけ、`before_agent_start` を保持します。
- [フック](/ja-JP/plugins/hooks)と
  [Plugin 互換性](/ja-JP/plugins/compatibility)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### provider-auth-env-vars

マニフェストが、レガシーな `providerAuthEnvVars` プロバイダー認証メタデータをまだ使用しています。

- プロバイダーの環境変数メタデータを `setup.providers[].envVars` にミラーします。
- サポート対象の OpenClaw 範囲がまだ必要としている間だけ、`providerAuthEnvVars` を互換性メタデータとして保持します。
- [setup リファレンス](/ja-JP/plugins/manifest#setup-reference)と
  [SDK 移行](/ja-JP/plugins/sdk-migration)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### channel-env-vars

マニフェストが、ClawHub が期待する現在の setup または設定メタデータを持たない、レガシーまたは古いチャネル環境変数メタデータを使用しています。

- OpenClaw がチャネルランタイムを読み込まずに setup 状態を検査できるように、チャネル環境変数メタデータを宣言的に保ちます。
- 環境変数駆動のチャネル setup を、Plugin の形状で使用される現在の setup、チャネル設定、またはパッケージチャネルメタデータへミラーします。
- サポート対象の古い OpenClaw バージョンがまだ必要としている間だけ、`channelEnvVars` を互換性メタデータとして保持します。
- [Plugin マニフェスト](/ja-JP/plugins/manifest)と
  [チャネル Plugin](/ja-JP/plugins/sdk-channel-plugins)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

## セキュリティマニフェスト

### security-manifest-schema-unavailable

パッケージが、ClawHub が利用可能として認識しないスキーマ参照を持つ `openclaw.security.json` を出荷しています。

- スキーマ URL が参考情報のみの場合は削除します。
- OpenClaw が公開した後にのみ、文書化されたバージョン付きスキーマを使用します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### unrecognized-security-manifest

パッケージが、サポートされていないセキュリティマニフェストファイルを出荷しています。

- OpenClaw がバージョン付きセキュリティマニフェストスキーマと ClawHub の動作を文書化するまで、`openclaw.security.json` を削除します。
- マニフェスト contract が存在するまでは、セキュリティに関わる動作を公開パッケージドキュメントまたは README に記載しておきます。
- `clawhub package validate <path-to-plugin>` を再実行します。

## 関連

- [ClawHub CLI](/ja-JP/clawhub/cli)
- [ClawHub 公開](/ja-JP/clawhub/publishing)
- [Plugin のビルド](/ja-JP/plugins/building-plugins)
- [Plugin マニフェスト](/ja-JP/plugins/manifest)
- [Plugin エントリポイント](/ja-JP/plugins/sdk-entrypoints)
- [Plugin 互換性](/ja-JP/plugins/compatibility)

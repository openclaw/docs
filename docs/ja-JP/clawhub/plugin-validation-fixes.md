---
read_when:
    - clawhub package validate を実行し、Plugin に関する指摘を修正する必要があります
    - ClawHub が Plugin パッケージの公開を拒否した、または警告を表示した
    - リリース前にPluginパッケージのメタデータを更新しています
summary: 公開前に ClawHub Plugin パッケージの検証で見つかった問題を修正する
title: Plugin 検証の修正
x-i18n:
    generated_at: "2026-07-12T14:20:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Plugin 検証の修正

ClawHub は公開前に Plugin パッケージを検証し、自動パッケージスキャンの検出結果も表示できます。このページでは、作成者がパッケージのメタデータ、マニフェスト、SDK インポート、または公開アーティファクトで修正できる、作成者向けの検出結果について説明します。

内部の Plugin Inspector カバレッジに関する検出結果は対象外です。完全なレポートに、作成者向けの修正ガイダンスがないスキャナー保守コードが含まれている場合、それらは Plugin 作成者ではなく OpenClaw メンテナー向けです。

修正を適用した後、次を再実行します。

```bash
clawhub package validate <path-to-plugin>
```

## 作成者向けの検出結果

| コード                                    | まずこちらを参照                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [パッケージメタデータを追加する](/ja-JP/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [パッケージの openclaw ブロックを追加する](/ja-JP/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [OpenClaw パッケージのエントリポイントを宣言する](/ja-JP/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [宣言したエントリポイントを公開する](/ja-JP/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [インストールメタデータを完成させる](/ja-JP/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Plugin API の互換性を宣言する](/ja-JP/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [最小ホストバージョンを揃える](/ja-JP/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [パッケージとマニフェストのバージョンを揃える](/ja-JP/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [サポートされていない OpenClaw パッケージメタデータを削除する](/ja-JP/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [npm アーティファクトをパック可能にする](/ja-JP/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [npm pack の出力にエントリポイントを含める](/ja-JP/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [npm pack の出力にメタデータを含める](/ja-JP/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [マニフェストの表示名を追加する](/ja-JP/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [サポートされていないマニフェストフィールドを削除する](/ja-JP/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [サポートされていないコントラクトキーを削除する](/ja-JP/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [ルート SDK インポートを置き換える](/ja-JP/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [予約済み SDK インポートを削除する](/ja-JP/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [セッションストア全体へのアクセスを置き換える](/ja-JP/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [セッションストア全体への書き込みを置き換える](/ja-JP/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [セッションファイルパスのヘルパーを置き換える](/ja-JP/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [従来のトランスクリプトファイルターゲットを置き換える](/ja-JP/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [低レベルのトランスクリプトヘルパーを置き換える](/ja-JP/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [before_agent_start を置き換える](/ja-JP/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [プロバイダーの環境変数をセットアップメタデータに移動する](/ja-JP/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [チャンネルの環境変数を現在のメタデータに反映する](/ja-JP/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [利用できないセキュリティマニフェストスキーマへの参照を削除する](/ja-JP/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [サポートされていないセキュリティマニフェストファイルを削除する](/ja-JP/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## パッケージメタデータ

### package-json-missing

パッケージルートに `package.json` が含まれていないため、ClawHub は npm パッケージ、バージョン、エントリポイント、OpenClaw メタデータを識別できません。

- `name`、`version`、`type` を含む `package.json` を追加します。
- パッケージに OpenClaw Plugin が含まれる場合は、`openclaw` ブロックを追加します。
- 最小限のパッケージ例については [Plugin の構築](/ja-JP/plugins/building-plugins)を、パッケージとマニフェストの役割分担については [Plugin マニフェスト](/ja-JP/plugins/manifest#manifest-versus-packagejson)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-openclaw-metadata-missing

パッケージには `package.json` がありますが、OpenClaw パッケージメタデータが宣言されていません。

- `package.json#openclaw` を追加します。
- `openclaw.extensions` や `openclaw.runtimeExtensions` などのエントリポイントメタデータを含めます。
- パッケージを ClawHub 経由で公開またはインストールする場合は、互換性とインストールのメタデータを追加します。
- [検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-openclaw-entry-missing

パッケージメタデータは存在しますが、OpenClaw ランタイムのエントリポイントが宣言されていません。

- ネイティブ Plugin のエントリポイントには `openclaw.extensions` を追加します。
- 公開パッケージがビルド済み JavaScript を読み込む必要がある場合は、`openclaw.runtimeExtensions` を追加します。
- すべてのエントリポイントパスをパッケージディレクトリ内に配置します。
- [Plugin のエントリポイント](/ja-JP/plugins/sdk-entrypoints)および[検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-entrypoint-missing

パッケージでは OpenClaw エントリポイントが宣言されていますが、参照先のファイルが検証対象のパッケージにありません。

- `openclaw.extensions`、`openclaw.runtimeExtensions`、`openclaw.setupEntry`、`openclaw.runtimeSetupEntry` の各パスを確認します。
- エントリポイントが `dist` に生成される場合は、パッケージをビルドします。
- エントリポイントを移動した場合は、メタデータを更新します。
- [Plugin のエントリポイント](/ja-JP/plugins/sdk-entrypoints)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-install-metadata-incomplete

ClawHub はパッケージのインストールまたは更新方法を判別できません。

- `openclaw.install` に、`clawhubSpec`、`npmSpec`、`localPath` など、サポートされるインストール元を設定します。
- 複数のインストール元を利用できる場合は、`openclaw.install.defaultChoice` を設定します。
- OpenClaw ホストの最小バージョンには `openclaw.install.minHostVersion` を使用します。
- [検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-plugin-api-compat-missing

パッケージで、サポートする OpenClaw Plugin API の範囲が宣言されていません。

- `package.json` に `openclaw.compat.pluginApi` を追加します。
- ビルドおよびテストの対象とした OpenClaw Plugin API バージョンまたは semver の下限を使用します。
- これはパッケージバージョンとは別に管理します。パッケージバージョンは Plugin リリースを表し、`openclaw.compat.pluginApi` はホスト API コントラクトを表します。
- [検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-min-host-version-drift

パッケージの最小ホストバージョンが、パッケージのビルド対象となった OpenClaw バージョンのメタデータと一致していません。

- `openclaw.install.minHostVersion` を確認します。
- リリース時に使用した OpenClaw バージョンなど、パッケージ内の OpenClaw ビルドメタデータを確認します。
- 最小ホストバージョンを、パッケージが実際にサポートするホストバージョン範囲に揃えます。
- [検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-manifest-version-drift

パッケージバージョンと Plugin マニフェストバージョンが一致していません。

- パッケージのリリースバージョンには `package.json#version` を使用することを推奨します。
- `openclaw.plugin.json` にも `version` がある場合は、一致するように更新するか、パッケージメタデータが正となる場合は古いマニフェストバージョンのメタデータを削除します。
- 公開済みのメタデータを変更した後は、新しいパッケージバージョンを公開します。
- [Plugin マニフェスト](/ja-JP/plugins/manifest)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-openclaw-unsupported-metadata

`package.json#openclaw` ブロックに、OpenClaw パッケージメタデータとしてサポートされていないフィールドが含まれています。

- `openclaw.bundle` など、サポートされていないフィールドを削除します。
- ネイティブ Plugin のメタデータは `openclaw.plugin.json` に保持します。
- パッケージのエントリポイント、互換性、インストール、セットアップ、カタログのメタデータは、サポートされている `package.json#openclaw` フィールドに保持します。
- [検出に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

## 公開アーティファクト

### package-npm-pack-unavailable

パッケージを、ClawHub が検査または公開するアーティファクトとしてパックできません。

- パッケージルートから `npm pack --dry-run` を実行します。
- 無効なパッケージメタデータ、破損したライフサイクルスクリプト、またはパックを失敗させる files エントリを修正します。
- このパッケージを一般公開する場合は、`private: true` を削除します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-npm-pack-entrypoint-missing

パッケージはパックできますが、パックされたアーティファクトに `package.json#openclaw` で宣言されたエントリポイントファイルが含まれていません。

- `npm pack --dry-run` を実行し、含まれる予定のファイルを確認します。
- パックする前に、生成されるエントリポイントをビルドします。
- 宣言したエントリポイントが含まれるように、`files`、`.npmignore`、またはビルド出力を更新します。
- [Plugin のエントリポイント](/ja-JP/plugins/sdk-entrypoints)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-npm-pack-metadata-missing

パックされたアーティファクトに、ソースパッケージに存在する OpenClaw メタデータがありません。

- `npm pack --dry-run` を実行し、含まれるメタデータファイルを確認します。
- パックされたアーティファクトの `package.json` に `openclaw` ブロックが含まれていることを確認します。
- パッケージがネイティブ OpenClaw Plugin の場合は、`openclaw.plugin.json` が含まれていることを確認します。
- パッケージメタデータが除外されないように、`files` または `.npmignore` を更新します。
- [Plugin の構築](/ja-JP/plugins/building-plugins)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

## マニフェストメタデータ

### manifest-name-missing

ネイティブPluginマニフェストに表示名が含まれていません。

- `openclaw.plugin.json` に空でない `name` フィールドを追加します。
- `name` は人が読める形式にし、`id` は安定したマシンIDとして維持します。
- [Pluginマニフェスト](/ja-JP/plugins/manifest)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### manifest-unknown-fields

Pluginマニフェストに、OpenClawがサポートしていないトップレベルフィールドがあります。

- 各トップレベルフィールドを
  [マニフェストフィールドのリファレンス](/ja-JP/plugins/manifest#top-level-field-reference)と比較します。
- `openclaw.plugin.json` からカスタムフィールドを削除します。
- パッケージまたはインストールのメタデータは、マニフェストではなく、サポートされている
  `package.json#openclaw` フィールドに移動します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### manifest-unknown-contracts

マニフェストの `contracts` 内に、サポートされていないキーが宣言されています。

- `contracts` 配下の各キーを
  [contractsリファレンス](/ja-JP/plugins/manifest#contracts-reference)と比較します。
- サポートされていないコントラクトキーを削除します。
- ランタイム動作はPlugin登録コードに移動し、`contracts` は
  静的なケイパビリティ所有権メタデータのみに限定します。
- `clawhub package validate <path-to-plugin>` を再実行します。

## SDKと互換性の移行

### legacy-root-sdk-import

Pluginが非推奨のルートSDKバレル
`openclaw/plugin-sdk` からインポートしています。

- ルートバレルからのインポートを、用途を絞った公開サブパスからのインポートに置き換えます。
- `definePluginEntry` には `openclaw/plugin-sdk/plugin-entry` を使用します。
- チャネルエントリーヘルパーには `openclaw/plugin-sdk/channel-core` を使用します。
- [インポート規約](/ja-JP/plugins/building-plugins#import-conventions)と
  [Plugin SDKサブパス](/ja-JP/plugins/sdk-subpaths)を使用して、必要最小限のインポートを見つけます。
- `clawhub package validate <path-to-plugin>` を再実行します。

### reserved-sdk-import

Pluginが、バンドルPluginまたは内部互換性用に予約されたSDKパスをインポートしています。

- 予約されたOpenClaw内部SDKインポートを、文書化された公開
  `openclaw/plugin-sdk/*` サブパスに置き換えます。
- その動作に対応する公開SDKがない場合は、ヘルパーをパッケージ内に保持するか、
  OpenClawの公開APIをリクエストします。
- [Plugin SDKサブパス](/ja-JP/plugins/sdk-subpaths)と
  [SDK移行](/ja-JP/plugins/sdk-migration)を使用して、サポートされているインポートを選択します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-load-session-store

Pluginが、非推奨のセッションストア全体を扱うヘルパー
`loadSessionStore` をまだ使用しています。

- セッション状態を読み取る場合は、`getSessionEntry(...)` または
  `listSessionEntries(...)` を使用します。
- セッション状態を書き込む場合は、`patchSessionEntry(...)` または
  `upsertSessionEntry(...)` を使用します。
- セッションストアオブジェクト全体の読み込み、変更、保存は避けます。
- 宣言した互換性範囲が、それを必要とする古いOpenClawバージョンを
  まだサポートしている間だけ、`loadSessionStore(...)` を維持します。
- [ランタイムAPI](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDKサブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-session-store-write

Pluginが、`saveSessionStore` や `updateSessionStore` など、非推奨の
セッションストア全体を書き込むヘルパーをまだ使用しています。

- 既存のセッションエントリのフィールドを更新する場合は、
  `patchSessionEntry(...)` を使用します。
- セッションエントリを置換または作成する場合は、
  `upsertSessionEntry(...)` を使用します。
- セッションストアオブジェクト全体の読み込み、変更、保存は避けます。
- 宣言した互換性範囲が、それらを必要とする古いOpenClawバージョンを
  まだサポートしている間だけ、ストア全体の書き込みヘルパーを維持します。
- [ランタイムAPI](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDKサブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-session-file-helper

Pluginが、`resolveSessionFilePath` や `resolveAndPersistSessionFile` など、
非推奨のセッションファイルパスヘルパーをまだ使用しています。

- エージェントとセッションの識別情報に基づいてセッションメタデータを読み取るには、
  `getSessionEntry(...)` を使用します。
- セッションメタデータを永続化するには、`patchSessionEntry(...)` または
  `upsertSessionEntry(...)` を使用します。
- コードがトランスクリプト操作を準備している場合は、トランスクリプトの識別情報または
  ターゲットヘルパーを使用します。
- レガシーなトランスクリプトファイルパスを永続化したり、それに依存したりしないでください。
- [ランタイムAPI](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDKサブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-session-transcript-file-target

Pluginが、非推奨のトランスクリプトファイルターゲットヘルパー
`resolveSessionTranscriptLegacyFileTarget` をまだ使用しています。

- コードに公開セッション識別情報のみが必要な場合は、
  `resolveSessionTranscriptIdentity(...)` を使用します。
- コードに構造化されたトランスクリプト操作ターゲットが必要な場合は、
  `resolveSessionTranscriptTarget(...)` を使用します。
- レガシーなトランスクリプトファイルターゲットを直接読み取ったり構築したりしないでください。
- 宣言した互換性範囲が、それを必要とする古いOpenClawバージョンをまだ
  サポートしている間だけ、レガシーヘルパーを維持します。
- [ランタイムAPI](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDKサブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-session-transcript-low-level

Pluginが、`appendSessionTranscriptMessage` や `emitSessionTranscriptUpdate` など、
非推奨の低レベルトランスクリプトヘルパーをまだ使用しています。

- トランスクリプトへの追加には `appendSessionTranscriptMessageByIdentity(...)` を使用します。
- トランスクリプト更新通知には
  `publishSessionTranscriptUpdateByIdentity(...)` を使用します。
- OpenClawが正しいトランザクション境界と識別情報の処理を適用できるように、
  構造化されたトランスクリプトランタイムサーフェスを優先します。
- 宣言した互換性範囲が、それらを必要とする古いOpenClawバージョンを
  まだサポートしている間だけ、低レベルトランスクリプトヘルパーを維持します。
- [ランタイムAPI](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDKサブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### legacy-before-agent-start

Pluginがレガシーな `before_agent_start` フックをまだ使用しています。

- モデルまたはプロバイダーのオーバーライド処理を `before_model_resolve` に移動します。
- プロンプトまたはコンテキストの変更処理を `before_prompt_build` に移動します。
- 宣言した互換性範囲が、それを必要とする古いOpenClawバージョンをまだ
  サポートしている間だけ、`before_agent_start` を維持します。
- [フック](/ja-JP/plugins/hooks)と
  [Pluginの互換性](/ja-JP/plugins/compatibility)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### provider-auth-env-vars

マニフェストがレガシーな `providerAuthEnvVars` プロバイダー認証メタデータをまだ使用しています。

- プロバイダーの環境変数メタデータを `setup.providers[].envVars` に反映します。
- サポート対象のOpenClaw範囲でまだ必要とされる間だけ、互換性メタデータとして
  `providerAuthEnvVars` を維持します。
- [setupリファレンス](/ja-JP/plugins/manifest#setup-reference)と
  [SDK移行](/ja-JP/plugins/sdk-migration)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### channel-env-vars

マニフェストが、ClawHubで想定される現在のセットアップまたは設定メタデータを伴わない、
レガシーまたは旧形式のチャネル環境変数メタデータを使用しています。

- OpenClawがチャネルランタイムを読み込まずにセットアップ状態を検査できるように、
  チャネル環境変数メタデータを宣言的に維持します。
- 環境変数によるチャネルセットアップを、Pluginの構成で使用される現在のセットアップ、
  チャネル設定、またはパッケージのチャネルメタデータに反映します。
- サポート対象の古いOpenClawバージョンでまだ必要とされる間だけ、
  互換性メタデータとして `channelEnvVars` を維持します。
- [Pluginマニフェスト](/ja-JP/plugins/manifest)と
  [チャネルPlugin](/ja-JP/plugins/sdk-channel-plugins)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

## セキュリティマニフェスト

### security-manifest-schema-unavailable

パッケージに含まれる `openclaw.security.json` のスキーマ参照が、
ClawHubで利用可能なものとして認識されていません。

- 助言目的のみの場合は、スキーマURLを削除します。
- OpenClawが公開した後にのみ、文書化されたバージョン付きスキーマを使用します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### unrecognized-security-manifest

パッケージにサポートされていないセキュリティマニフェストファイルが含まれています。

- OpenClawがバージョン付きセキュリティマニフェストスキーマとClawHubの動作を
  文書化するまで、`openclaw.security.json` を削除します。
- マニフェストのコントラクトが確立されるまでは、セキュリティに関わる動作を
  パッケージの公開ドキュメントまたはREADMEに記載します。
- `clawhub package validate <path-to-plugin>` を再実行します。

## 関連項目

- [ClawHub CLI](/ja-JP/clawhub/cli)
- [ClawHubへの公開](/ja-JP/clawhub/publishing)
- [Pluginの構築](/ja-JP/plugins/building-plugins)
- [Pluginマニフェスト](/ja-JP/plugins/manifest)
- [Pluginエントリーポイント](/ja-JP/plugins/sdk-entrypoints)
- [Pluginの互換性](/ja-JP/plugins/compatibility)

---
read_when:
    - clawhub package validate を実行し、Plugin に関する指摘を修正する必要があります
    - ClawHub が Plugin パッケージの公開を拒否した、または警告を表示した
    - リリース前にPluginパッケージのメタデータを更新しています
summary: 公開前に ClawHub Plugin パッケージの検証で検出された問題を修正する
title: Plugin 検証の修正
x-i18n:
    generated_at: "2026-07-11T22:05:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Plugin 検証の修正

ClawHub は公開前に Plugin パッケージを検証し、自動パッケージスキャンの検出結果も表示できます。このページでは、Plugin 作成者がパッケージのメタデータ、マニフェスト、SDK のインポート、または公開アーティファクトで修正できる、作成者向けの検出結果について説明します。

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
| `package-openclaw-entry-missing`        | [OpenClaw パッケージのエントリーポイントを宣言する](/ja-JP/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [宣言したエントリーポイントを公開する](/ja-JP/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [インストールメタデータを完成させる](/ja-JP/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Plugin API の互換性を宣言する](/ja-JP/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [最小ホストバージョンを一致させる](/ja-JP/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [パッケージとマニフェストのバージョンを一致させる](/ja-JP/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [サポートされていない OpenClaw パッケージメタデータを削除する](/ja-JP/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [npm アーティファクトをパック可能にする](/ja-JP/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [npm pack の出力にエントリーポイントを含める](/ja-JP/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [npm pack の出力にメタデータを含める](/ja-JP/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [マニフェストの表示名を追加する](/ja-JP/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [サポートされていないマニフェストフィールドを削除する](/ja-JP/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [サポートされていないコントラクトキーを削除する](/ja-JP/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [ルート SDK のインポートを置き換える](/ja-JP/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [予約済み SDK のインポートを削除する](/ja-JP/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [セッションストア全体へのアクセスを置き換える](/ja-JP/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [セッションストア全体への書き込みを置き換える](/ja-JP/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [セッションファイルパスのヘルパーを置き換える](/ja-JP/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [従来のトランスクリプトファイルターゲットを置き換える](/ja-JP/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [低レベルのトランスクリプトヘルパーを置き換える](/ja-JP/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [before_agent_start を置き換える](/ja-JP/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [プロバイダーの環境変数をセットアップメタデータへ移動する](/ja-JP/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [チャンネルの環境変数を現在のメタデータに反映する](/ja-JP/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [利用できないセキュリティマニフェストのスキーマ参照を削除する](/ja-JP/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [サポートされていないセキュリティマニフェストファイルを削除する](/ja-JP/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## パッケージメタデータ

### package-json-missing

パッケージのルートに `package.json` が含まれていないため、ClawHub は npm パッケージ、バージョン、エントリーポイント、または OpenClaw メタデータを識別できません。

- `name`、`version`、`type` を指定した `package.json` を追加します。
- パッケージが OpenClaw Plugin を提供する場合は、`openclaw` ブロックを追加します。
- 最小限のパッケージ例については [Plugin の構築](/ja-JP/plugins/building-plugins) を、パッケージとマニフェストの役割の違いについては [Plugin マニフェスト](/ja-JP/plugins/manifest#manifest-versus-packagejson) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-openclaw-metadata-missing

パッケージには `package.json` がありますが、OpenClaw パッケージメタデータが宣言されていません。

- `package.json#openclaw` を追加します。
- `openclaw.extensions` や `openclaw.runtimeExtensions` などのエントリーポイントメタデータを含めます。
- パッケージを ClawHub 経由で公開またはインストールする場合は、互換性とインストールのメタデータを追加します。
- [検出に影響する package.json のフィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-openclaw-entry-missing

パッケージメタデータは存在しますが、OpenClaw ランタイムのエントリーポイントが宣言されていません。

- ネイティブ Plugin のエントリーポイントには `openclaw.extensions` を追加します。
- 公開パッケージでビルド済み JavaScript を読み込む場合は、`openclaw.runtimeExtensions` を追加します。
- すべてのエントリーポイントのパスをパッケージディレクトリ内に配置します。
- [Plugin のエントリーポイント](/ja-JP/plugins/sdk-entrypoints)および[検出に影響する package.json のフィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-entrypoint-missing

パッケージで OpenClaw エントリーポイントが宣言されていますが、参照先ファイルが検証対象のパッケージにありません。

- `openclaw.extensions`、`openclaw.runtimeExtensions`、`openclaw.setupEntry`、`openclaw.runtimeSetupEntry` の各パスを確認します。
- エントリーポイントが `dist` に生成される場合は、パッケージをビルドします。
- エントリーポイントが移動した場合は、メタデータを更新します。
- [Plugin のエントリーポイント](/ja-JP/plugins/sdk-entrypoints)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-install-metadata-incomplete

ClawHub は、パッケージをどのようにインストールまたは更新すべきか判断できません。

- `openclaw.install` に、`clawhubSpec`、`npmSpec`、`localPath` など、サポートされるインストール元を設定します。
- 複数のインストール元を使用できる場合は、`openclaw.install.defaultChoice` を設定します。
- OpenClaw ホストの最小バージョンには `openclaw.install.minHostVersion` を使用します。
- [検出に影響する package.json のフィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-plugin-api-compat-missing

パッケージがサポートする OpenClaw Plugin API の範囲が宣言されていません。

- `package.json` に `openclaw.compat.pluginApi` を追加します。
- ビルドおよびテストの基準とした OpenClaw Plugin API のバージョンまたは semver の下限を使用します。
- これはパッケージバージョンとは分けて管理します。パッケージバージョンは Plugin のリリースを表し、`openclaw.compat.pluginApi` はホスト API のコントラクトを表します。
- [検出に影響する package.json のフィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-min-host-version-drift

パッケージの最小ホストバージョンが、そのパッケージのビルド基準となった OpenClaw のバージョンメタデータと一致していません。

- `openclaw.install.minHostVersion` を確認します。
- リリース時に使用した OpenClaw のバージョンなど、パッケージ内の OpenClaw ビルドメタデータを確認します。
- 最小ホストバージョンを、パッケージが実際にサポートするホストバージョン範囲と一致させます。
- [検出に影響する package.json のフィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-manifest-version-drift

パッケージのバージョンと Plugin マニフェストのバージョンが一致していません。

- パッケージのリリースバージョンには `package.json#version` を優先して使用します。
- `openclaw.plugin.json` にも `version` がある場合は、一致するように更新するか、パッケージメタデータを正とする場合は古いマニフェストのバージョンメタデータを削除します。
- 公開済みのメタデータを変更した後は、新しいパッケージバージョンを公開します。
- [Plugin マニフェスト](/ja-JP/plugins/manifest)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-openclaw-unsupported-metadata

`package.json#openclaw` ブロックに、OpenClaw パッケージメタデータとしてサポートされていないフィールドが含まれています。

- `openclaw.bundle` など、サポートされていないフィールドを削除します。
- ネイティブ Plugin のメタデータは `openclaw.plugin.json` に保持します。
- パッケージのエントリーポイント、互換性、インストール、セットアップ、カタログの各メタデータは、サポートされている `package.json#openclaw` フィールドに保持します。
- [検出に影響する package.json のフィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

## 公開アーティファクト

### package-npm-pack-unavailable

パッケージを、ClawHub が検査または公開するアーティファクトとしてパックできません。

- パッケージのルートから `npm pack --dry-run` を実行します。
- パッキングが失敗する原因となる、無効なパッケージメタデータ、壊れたライフサイクルスクリプト、または `files` のエントリを修正します。
- このパッケージを一般公開する場合は、`private: true` を削除します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-npm-pack-entrypoint-missing

パッケージはパックできますが、パックされたアーティファクトに `package.json#openclaw` で宣言されたエントリーポイントファイルが含まれていません。

- `npm pack --dry-run` を実行し、含まれる予定のファイルを確認します。
- パックする前に、生成されるエントリーポイントをビルドします。
- 宣言したエントリーポイントが含まれるように、`files`、`.npmignore`、またはビルド出力を更新します。
- [Plugin のエントリーポイント](/ja-JP/plugins/sdk-entrypoints)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-npm-pack-metadata-missing

パックされたアーティファクトに、ソースパッケージには存在する OpenClaw メタデータがありません。

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
- `name` は人間が読める形式にし、`id` は安定したマシンIDのままにします。
- [Pluginマニフェスト](/ja-JP/plugins/manifest)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### manifest-unknown-fields

Pluginマニフェストに、OpenClawがサポートしていないトップレベルフィールドがあります。

- 各トップレベルフィールドを
  [マニフェストフィールドリファレンス](/ja-JP/plugins/manifest#top-level-field-reference)と比較します。
- `openclaw.plugin.json` からカスタムフィールドを削除します。
- パッケージまたはインストールのメタデータは、マニフェストではなく、サポートされている `package.json#openclaw` フィールドに移動します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### manifest-unknown-contracts

マニフェストの `contracts` 内に、サポートされていないキーが宣言されています。

- `contracts` 内の各キーを
  [コントラクトリファレンス](/ja-JP/plugins/manifest#contracts-reference)と比較します。
- サポートされていないコントラクトキーを削除します。
- ランタイム動作はPlugin登録コードに移動し、`contracts` は静的なケイパビリティ所有権メタデータのみに限定します。
- `clawhub package validate <path-to-plugin>` を再実行します。

## SDKと互換性の移行

### legacy-root-sdk-import

Pluginが非推奨のルートSDKバレル
`openclaw/plugin-sdk` からインポートしています。

- ルートバレルからのインポートを、対象を絞った公開サブパスからのインポートに置き換えます。
- `definePluginEntry` には `openclaw/plugin-sdk/plugin-entry` を使用します。
- チャネルエントリーヘルパーには `openclaw/plugin-sdk/channel-core` を使用します。
- [インポート規約](/ja-JP/plugins/building-plugins#import-conventions)と
  [Plugin SDKサブパス](/ja-JP/plugins/sdk-subpaths)を使用して、範囲の狭いインポートを特定します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### reserved-sdk-import

Pluginが、バンドル済みPluginまたは内部互換性のために予約されたSDKパスをインポートしています。

- 予約されたOpenClaw内部SDKインポートを、文書化された公開 `openclaw/plugin-sdk/*` サブパスに置き換えます。
- その動作に対応する公開SDKがない場合は、ヘルパーをパッケージ内に保持するか、公開OpenClaw APIをリクエストします。
- [Plugin SDKサブパス](/ja-JP/plugins/sdk-subpaths)と
  [SDK移行](/ja-JP/plugins/sdk-migration)を使用して、サポートされているインポートを選択します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-load-session-store

Pluginが、非推奨のセッションストア全体を扱うヘルパー
`loadSessionStore` を引き続き使用しています。

- セッション状態を読み取る場合は、`getSessionEntry(...)` または `listSessionEntries(...)` を使用します。
- セッション状態を書き込む場合は、`patchSessionEntry(...)` または `upsertSessionEntry(...)` を使用します。
- セッションストアオブジェクト全体の読み込み、変更、保存は避けます。
- 宣言した互換性範囲で、それを必要とする古いOpenClawバージョンを引き続きサポートしている間のみ、`loadSessionStore(...)` を保持します。
- [ランタイムAPI](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDKサブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-session-store-write

Pluginが、`saveSessionStore` や `updateSessionStore` など、非推奨のセッションストア全体を書き込むヘルパーを引き続き使用しています。

- 既存のセッションエントリのフィールドを更新する場合は、`patchSessionEntry(...)` を使用します。
- セッションエントリを置換または作成する場合は、`upsertSessionEntry(...)` を使用します。
- セッションストアオブジェクト全体の読み込み、変更、保存は避けます。
- 宣言した互換性範囲で、それらを必要とする古いOpenClawバージョンを引き続きサポートしている間のみ、ストア全体の書き込みヘルパーを保持します。
- [ランタイムAPI](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDKサブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-session-file-helper

Pluginが、`resolveSessionFilePath` や `resolveAndPersistSessionFile` など、非推奨のセッションファイルパスヘルパーを引き続き使用しています。

- エージェントとセッションの識別情報を使用してセッションメタデータを読み取るには、`getSessionEntry(...)` を使用します。
- セッションメタデータを永続化するには、`patchSessionEntry(...)` または `upsertSessionEntry(...)` を使用します。
- コードがトランスクリプト操作を準備している場合は、トランスクリプト識別情報またはターゲットヘルパーを使用します。
- 従来のトランスクリプトファイルパスを永続化したり、それに依存したりしないでください。
- [ランタイムAPI](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDKサブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-session-transcript-file-target

Pluginが、非推奨のトランスクリプトファイルターゲットヘルパー
`resolveSessionTranscriptLegacyFileTarget` を引き続き使用しています。

- コードが公開セッション識別情報のみを必要とする場合は、`resolveSessionTranscriptIdentity(...)` を使用します。
- コードが構造化されたトランスクリプト操作ターゲットを必要とする場合は、`resolveSessionTranscriptTarget(...)` を使用します。
- 従来のトランスクリプトファイルターゲットを直接読み取ったり構築したりすることは避けます。
- 宣言した互換性範囲で、それを必要とする古いOpenClawバージョンを引き続きサポートしている間のみ、従来のヘルパーを保持します。
- [ランタイムAPI](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDKサブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-session-transcript-low-level

Pluginが、`appendSessionTranscriptMessage` や `emitSessionTranscriptUpdate` など、非推奨の低レベルトランスクリプトヘルパーを引き続き使用しています。

- トランスクリプトへの追加には、`appendSessionTranscriptMessageByIdentity(...)` を使用します。
- トランスクリプト更新通知には、`publishSessionTranscriptUpdateByIdentity(...)` を使用します。
- OpenClawが適切なトランザクション境界と識別情報処理を適用できるように、構造化されたトランスクリプトランタイムサーフェスを優先します。
- 宣言した互換性範囲で、それらを必要とする古いOpenClawバージョンを引き続きサポートしている間のみ、低レベルトランスクリプトヘルパーを保持します。
- [ランタイムAPI](/ja-JP/plugins/sdk-runtime#agent-session-state)と
  [Plugin SDKサブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### legacy-before-agent-start

Pluginが従来の `before_agent_start` フックを引き続き使用しています。

- モデルまたはプロバイダーのオーバーライド処理を `before_model_resolve` に移動します。
- プロンプトまたはコンテキストの変更処理を `before_prompt_build` に移動します。
- 宣言した互換性範囲で、それを必要とする古いOpenClawバージョンを引き続きサポートしている間のみ、`before_agent_start` を保持します。
- [フック](/ja-JP/plugins/hooks)と
  [Pluginの互換性](/ja-JP/plugins/compatibility)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### provider-auth-env-vars

マニフェストが従来の `providerAuthEnvVars` プロバイダー認証メタデータを引き続き使用しています。

- プロバイダーの環境変数メタデータを `setup.providers[].envVars` に反映します。
- サポートするOpenClawのバージョン範囲で引き続き必要な間のみ、`providerAuthEnvVars` を互換性メタデータとして保持します。
- [セットアップリファレンス](/ja-JP/plugins/manifest#setup-reference)と
  [SDK移行](/ja-JP/plugins/sdk-migration)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### channel-env-vars

マニフェストが、ClawHubの現在の要件であるセットアップまたは設定メタデータを伴わずに、従来または旧式のチャネル環境変数メタデータを使用しています。

- OpenClawがチャネルランタイムを読み込まずにセットアップ状態を検査できるよう、チャネル環境変数メタデータを宣言的に保ちます。
- 環境変数によるチャネルセットアップを、Pluginの構成で使用される現在のセットアップ、チャネル設定、またはパッケージのチャネルメタデータに反映します。
- サポート対象の古いOpenClawバージョンで引き続き必要な間のみ、`channelEnvVars` を互換性メタデータとして保持します。
- [Pluginマニフェスト](/ja-JP/plugins/manifest)と
  [チャネルPlugin](/ja-JP/plugins/sdk-channel-plugins)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

## セキュリティマニフェスト

### security-manifest-schema-unavailable

パッケージに含まれる `openclaw.security.json` のスキーマ参照を、ClawHubは利用可能なものとして認識していません。

- スキーマURLが参考情報にすぎない場合は削除します。
- OpenClawが公開した後にのみ、文書化されたバージョン付きスキーマを使用します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### unrecognized-security-manifest

パッケージに、サポートされていないセキュリティマニフェストファイルが含まれています。

- OpenClawがバージョン付きセキュリティマニフェストスキーマとClawHubの動作を文書化するまで、`openclaw.security.json` を削除します。
- マニフェストの契約が確立されるまでは、セキュリティに関わる動作を公開パッケージドキュメントまたはREADMEに記載します。
- `clawhub package validate <path-to-plugin>` を再実行します。

## 関連項目

- [ClawHub CLI](/ja-JP/clawhub/cli)
- [ClawHubへの公開](/ja-JP/clawhub/publishing)
- [Pluginの構築](/ja-JP/plugins/building-plugins)
- [Pluginマニフェスト](/ja-JP/plugins/manifest)
- [Pluginエントリーポイント](/ja-JP/plugins/sdk-entrypoints)
- [Pluginの互換性](/ja-JP/plugins/compatibility)

---
read_when:
    - clawhub package validate を実行し、Plugin の検出事項を修正する必要があります
    - ClawHub が Plugin パッケージの公開を拒否または警告した
    - リリース前に Plugin パッケージのメタデータを更新しています
summary: ClawHub Plugin パッケージの検証結果を公開前に修正する
title: Plugin 検証修正
x-i18n:
    generated_at: "2026-06-28T05:08:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c50f57c8feb79c7ff304ad1c8e115b362795621d7cd4f85f435c44cc75308b9
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# Plugin 検証の修正

ClawHub は公開前に Plugin パッケージを検証し、自動パッケージスキャンの検出結果も表示できます。このページでは、著者向けの検出結果、つまり Plugin 作者がパッケージメタデータ、マニフェスト、SDK インポート、または公開済みアーティファクトで修正できる検出結果を扱います。

内部的な Plugin Inspector のカバレッジ検出結果は扱いません。完全なレポートに、作者向けの修正ガイダンスがないスキャナーメンテナンスコードが含まれる場合、それらは Plugin 作者ではなく OpenClaw メンテナー向けです。

修正を適用したら、再実行します。

```bash
clawhub package validate <path-to-plugin>
```

## 作者向けの検出結果

| コード                                  | ここから開始                                                                                                                |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [パッケージメタデータを追加する](/ja-JP/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [パッケージの openclaw ブロックを追加する](/ja-JP/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [OpenClaw パッケージエントリーポイントを宣言する](/ja-JP/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [宣言済みエントリーポイントを公開する](/ja-JP/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [インストールメタデータを完成させる](/ja-JP/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [Plugin API 互換性を宣言する](/ja-JP/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [最小ホストバージョンを揃える](/ja-JP/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [パッケージとマニフェストのバージョンを揃える](/ja-JP/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [サポートされていない OpenClaw パッケージメタデータを削除する](/ja-JP/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [npm アーティファクトをパック可能にする](/ja-JP/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [npm pack 出力にエントリーポイントを含める](/ja-JP/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [npm pack 出力にメタデータを含める](/ja-JP/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [マニフェストの表示名を追加する](/ja-JP/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [サポートされていないマニフェストフィールドを削除する](/ja-JP/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [サポートされていないコントラクトキーを削除する](/ja-JP/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [ルート SDK インポートを置き換える](/ja-JP/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [予約済み SDK インポートを削除する](/ja-JP/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [セッションストア全体へのアクセスを置き換える](/ja-JP/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `legacy-before-agent-start`             | [before_agent_start を置き換える](/ja-JP/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [プロバイダーの環境変数をセットアップメタデータへ移動する](/ja-JP/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [チャネル環境変数を現在のメタデータにミラーする](/ja-JP/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [利用できないセキュリティマニフェストスキーマ参照を削除する](/ja-JP/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [サポートされていないセキュリティマニフェストファイルを削除する](/ja-JP/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## パッケージメタデータ

### package-json-missing

パッケージルートに `package.json` が含まれていないため、ClawHub は npm パッケージ、バージョン、エントリーポイント、または OpenClaw メタデータを識別できません。

- `name`、`version`、`type` を含む `package.json` を追加します。
- パッケージが OpenClaw Plugin を同梱する場合は、`openclaw` ブロックを追加します。
- 最小構成のパッケージ例には [Plugin の構築](/ja-JP/plugins/building-plugins) を、パッケージとマニフェストの分担には [Plugin マニフェスト](/ja-JP/plugins/manifest#manifest-versus-packagejson) を使用します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-openclaw-metadata-missing

パッケージに `package.json` はありますが、OpenClaw パッケージメタデータが宣言されていません。

- `package.json#openclaw` を追加します。
- `openclaw.extensions` や `openclaw.runtimeExtensions` などのエントリーポイントメタデータを含めます。
- パッケージを ClawHub 経由で公開またはインストールする場合は、互換性とインストールメタデータを追加します。
- [探索に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-openclaw-entry-missing

パッケージメタデータは存在しますが、OpenClaw ランタイムエントリーポイントが宣言されていません。

- ネイティブ Plugin エントリーポイントには `openclaw.extensions` を追加します。
- 公開済みパッケージがビルド済み JavaScript を読み込む必要がある場合は、`openclaw.runtimeExtensions` を追加します。
- すべてのエントリーポイントパスをパッケージディレクトリ内に保ちます。
- [Plugin エントリーポイント](/ja-JP/plugins/sdk-entrypoints) と [探索に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-entrypoint-missing

パッケージは OpenClaw エントリーポイントを宣言していますが、参照されているファイルが検証対象のパッケージにありません。

- `openclaw.extensions`、`openclaw.runtimeExtensions`、`openclaw.setupEntry`、`openclaw.runtimeSetupEntry` の各パスを確認します。
- エントリーポイントが `dist` に生成される場合は、パッケージをビルドします。
- エントリーポイントが移動した場合は、メタデータを更新します。
- [Plugin エントリーポイント](/ja-JP/plugins/sdk-entrypoints) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-install-metadata-incomplete

ClawHub は、パッケージをどのようにインストールまたは更新すべきか判断できません。

- `openclaw.install` に、`clawhubSpec`、`npmSpec`、`localPath` などのサポートされているインストールソースを入力します。
- 複数のインストールソースが利用可能な場合は、`openclaw.install.defaultChoice` を設定します。
- 最小 OpenClaw ホストバージョンには `openclaw.install.minHostVersion` を使用します。
- [探索に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-plugin-api-compat-missing

パッケージが、サポートする OpenClaw Plugin API 範囲を宣言していません。

- `package.json` に `openclaw.compat.pluginApi` を追加します。
- ビルドおよびテストの対象にした OpenClaw Plugin API バージョンまたは semver の下限を使用します。
- これはパッケージバージョンとは分けて管理します。パッケージバージョンは Plugin リリースを表し、`openclaw.compat.pluginApi` はホスト API コントラクトを表します。
- [探索に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-min-host-version-drift

パッケージの最小ホストバージョンが、パッケージのビルド対象になった OpenClaw バージョンメタデータと一致していません。

- `openclaw.install.minHostVersion` を確認します。
- リリース時に使用した OpenClaw バージョンなど、パッケージ内の OpenClaw ビルドメタデータを確認します。
- 最小ホストバージョンを、パッケージが実際にサポートするホストバージョン範囲に揃えます。
- [探索に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-manifest-version-drift

パッケージバージョンと Plugin マニフェストバージョンが一致していません。

- パッケージリリースバージョンとしては `package.json#version` を優先します。
- `openclaw.plugin.json` にも `version` がある場合は、一致するように更新するか、パッケージメタデータが信頼できる情報源である場合は古いマニフェストバージョンメタデータを削除します。
- 公開済みメタデータを変更した後は、新しいパッケージバージョンを公開します。
- [Plugin マニフェスト](/ja-JP/plugins/manifest) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### package-openclaw-unsupported-metadata

`package.json#openclaw` ブロックに、OpenClaw パッケージメタデータとしてサポートされていないフィールドが含まれています。

- `openclaw.bundle` などのサポートされていないフィールドを削除します。
- ネイティブ Plugin メタデータは `openclaw.plugin.json` に保持します。
- パッケージエントリーポイント、互換性、インストール、セットアップ、カタログメタデータは、サポートされている `package.json#openclaw` フィールドに保持します。
- [探索に影響する package.json フィールド](/ja-JP/plugins/manifest#packagejson-fields-that-affect-discovery) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

## 公開済みアーティファクト

### package-npm-pack-unavailable

パッケージを、ClawHub が検査または公開するアーティファクトにパックできません。

- パッケージルートから `npm pack --dry-run` を実行します。
- パックに失敗する原因となる無効なパッケージメタデータ、壊れたライフサイクルスクリプト、または files エントリを修正します。
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

パック済みアーティファクトに、ソースパッケージ内に存在する OpenClaw メタデータがありません。

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
- `name` は人間が読める形式にし、`id` は安定したマシン ID として保持します。
- [Plugin マニフェスト](/ja-JP/plugins/manifest) を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### manifest-unknown-fields

Plugin マニフェストに、OpenClaw がサポートしていないトップレベルフィールドがあります。

- 各トップレベルフィールドを
  [マニフェストフィールドリファレンス](/ja-JP/plugins/manifest#top-level-field-reference)と比較します。
- `openclaw.plugin.json` からカスタムフィールドを削除します。
- パッケージまたはインストールのメタデータは、マニフェストではなく、サポートされている `package.json#openclaw` フィールドへ移動します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### manifest-unknown-contracts

マニフェストが、`contracts` 内でサポートされていないキーを宣言しています。

- `contracts` 配下の各キーを
  [contracts リファレンス](/ja-JP/plugins/manifest#contracts-reference)と比較します。
- サポートされていない contract キーを削除します。
- ランタイム動作は Plugin 登録コードへ移動し、`contracts` は静的な capability 所有権メタデータに限定します。
- `clawhub package validate <path-to-plugin>` を再実行します。

## SDK と互換性移行

### legacy-root-sdk-import

Plugin が非推奨のルート SDK バレルからインポートしています:
`openclaw/plugin-sdk`。

- ルートバレルのインポートを、焦点を絞った公開サブパスのインポートに置き換えます。
- `definePluginEntry` には `openclaw/plugin-sdk/plugin-entry` を使用します。
- チャンネルエントリヘルパーには `openclaw/plugin-sdk/channel-core` を使用します。
- 狭いインポートを見つけるには、[インポート規約](/ja-JP/plugins/building-plugins#import-conventions)と
  [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)を使用します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### reserved-sdk-import

Plugin が、バンドル済み Plugin または内部互換性用に予約された SDK パスをインポートしています。

- 予約された OpenClaw 内部 SDK インポートを、ドキュメント化された公開
  `openclaw/plugin-sdk/*` サブパスに置き換えます。
- その動作に公開 SDK がない場合は、ヘルパーを自分のパッケージ内に保持するか、公開 OpenClaw API をリクエストします。
- サポートされているインポートを選択するには、[Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)と
  [SDK 移行](/ja-JP/plugins/sdk-migration)を使用します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### sdk-load-session-store

Plugin はまだ、非推奨のセッションストア全体ヘルパー
`loadSessionStore` を使用しています。

- セッション状態を読み取るときは、`getSessionEntry(...)` または `listSessionEntries(...)` を使用します。
- セッション状態を書き込むときは、`patchSessionEntry(...)` または `upsertSessionEntry(...)` を使用します。
- セッションストアオブジェクト全体を読み込み、変更し、保存することは避けます。
- 宣言した互換性範囲が、これを必要とする古い OpenClaw バージョンをまだサポートしている間だけ、`loadSessionStore(...)` を保持します。
- [ランタイム API](/ja-JP/plugins/sdk-runtime#agent-session-state) と
  [Plugin SDK サブパス](/ja-JP/plugins/sdk-subpaths)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### legacy-before-agent-start

Plugin はまだレガシーの `before_agent_start` フックを使用しています。

- モデルまたはプロバイダーの上書き作業は `before_model_resolve` へ移動します。
- プロンプトまたはコンテキストの変更作業は `before_prompt_build` へ移動します。
- 宣言した互換性範囲が、これを必要とする古い OpenClaw バージョンをまだサポートしている間だけ、`before_agent_start` を保持します。
- [フック](/ja-JP/plugins/hooks)と
  [Plugin 互換性](/ja-JP/plugins/compatibility)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### provider-auth-env-vars

マニフェストはまだ、レガシーの `providerAuthEnvVars` プロバイダー認証メタデータを使用しています。

- プロバイダー env-var メタデータを `setup.providers[].envVars` にミラーします。
- サポート対象の OpenClaw 範囲がまだ必要としている間だけ、互換性メタデータとして `providerAuthEnvVars` を保持します。
- [setup リファレンス](/ja-JP/plugins/manifest#setup-reference)と
  [SDK 移行](/ja-JP/plugins/sdk-migration)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

### channel-env-vars

マニフェストは、ClawHub が期待する現在の setup または config メタデータなしで、レガシーまたは古いチャンネル env-var メタデータを使用しています。

- OpenClaw がチャンネルランタイムを読み込まずにセットアップ状態を検査できるよう、チャンネル env-var メタデータは宣言的に保ちます。
- env 駆動のチャンネルセットアップを、Plugin の形状で使用される現在の setup、チャンネル config、またはパッケージチャンネルメタデータへミラーします。
- サポート対象の古い OpenClaw バージョンがまだ必要としている間だけ、互換性メタデータとして `channelEnvVars` を保持します。
- [Plugin マニフェスト](/ja-JP/plugins/manifest)と
  [チャンネル Plugin](/ja-JP/plugins/sdk-channel-plugins)を参照してください。
- `clawhub package validate <path-to-plugin>` を再実行します。

## セキュリティマニフェスト

### security-manifest-schema-unavailable

パッケージは、ClawHub が利用可能として認識しないスキーマ参照を含む `openclaw.security.json` を同梱しています。

- そのスキーマ URL が助言目的のみの場合は削除します。
- OpenClaw が公開した後にのみ、ドキュメント化されたバージョン付きスキーマを使用します。
- `clawhub package validate <path-to-plugin>` を再実行します。

### unrecognized-security-manifest

パッケージは、サポートされていないセキュリティマニフェストファイルを同梱しています。

- OpenClaw がバージョン付きセキュリティマニフェストスキーマと ClawHub の動作をドキュメント化するまで、`openclaw.security.json` を削除します。
- マニフェスト契約が存在するまでは、セキュリティに敏感な動作を公開パッケージドキュメントまたは README に記載しておきます。
- `clawhub package validate <path-to-plugin>` を再実行します。

## 関連

- [ClawHub CLI](/ja-JP/clawhub/cli)
- [ClawHub 公開](/ja-JP/clawhub/publishing)
- [Plugin の構築](/ja-JP/plugins/building-plugins)
- [Plugin マニフェスト](/ja-JP/plugins/manifest)
- [Plugin エントリポイント](/ja-JP/plugins/sdk-entrypoints)
- [Plugin 互換性](/ja-JP/plugins/compatibility)

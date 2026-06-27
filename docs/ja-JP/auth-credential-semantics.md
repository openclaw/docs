---
read_when:
    - 認証プロファイルの解決または認証情報ルーティングに取り組む
    - モデル認証失敗またはプロファイル順序のデバッグ
summary: auth プロファイルの正規クレデンシャル適格性と解決セマンティクス
title: 認証情報のセマンティクス
x-i18n:
    generated_at: "2026-06-27T10:30:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 591c0384e1d43512252aaa7b362141b6bc93183b30b5847168758f86127f0663
    source_path: auth-credential-semantics.md
    workflow: 16
---

このドキュメントは、以下全体で使用される正規の認証情報適格性と解決セマンティクスを定義します。

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

目的は、選択時とランタイムの動作を一致させることです。

## 安定したプローブ理由コード

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## トークン認証情報

トークン認証情報（`type: "token"`）は、インラインの `token` および/または `tokenRef` をサポートします。

### 適格性ルール

1. `token` と `tokenRef` の両方が存在しない場合、トークンプロファイルは不適格です。
2. `expires` は任意です。
3. `expires` が存在する場合、`0` より大きい有限数でなければなりません。
4. `expires` が無効（`NaN`、`0`、負数、非有限、または誤った型）の場合、プロファイルは `invalid_expires` で不適格です。
5. `expires` が過去の場合、プロファイルは `expired` で不適格です。
6. `tokenRef` は `expires` の検証を回避しません。

### 解決ルール

1. リゾルバーのセマンティクスは、`expires` の適格性セマンティクスと一致します。
2. 適格なプロファイルでは、トークン素材をインライン値または `tokenRef` から解決できます。
3. 解決できない参照は、`models status --probe` 出力で `unresolved_ref` を生成します。

## エージェントコピーのポータビリティ

エージェント認証の継承は読み通しです。エージェントにローカルプロファイルがない場合、ランタイムでデフォルト/メインエージェントストアからプロファイルを解決でき、シークレット素材を自身の `auth-profiles.json` にコピーする必要はありません。

`openclaw agents add` などの明示的なコピーフローでは、このポータビリティポリシーを使用します。

- `api_key` プロファイルは、`copyToAgents: false` でない限りポータブルです。
- `token` プロファイルは、`copyToAgents: false` でない限りポータブルです。
- `oauth` プロファイルは、リフレッシュトークンが単回使用またはローテーションに敏感な場合があるため、デフォルトではポータブルではありません。
- プロバイダー所有の OAuth フローは、エージェント間でリフレッシュ素材をコピーしても安全であることが分かっている場合にのみ、`copyToAgents: true` でオプトインできます。

非ポータブルなプロファイルは、対象エージェントが別途サインインして独自のローカルプロファイルを作成しない限り、読み通し継承を通じて引き続き利用できます。

## 設定専用の認証ルート

`mode: "aws-sdk"` を持つ `auth.profiles` エントリは、保存された認証情報ではなくルーティングメタデータです。対象プロバイダーが `models.providers.<id>.auth: "aws-sdk"`、または Plugin 所有の Amazon Bedrock セットアップ AWS SDK ルートを使用する場合に有効です。これらのプロファイル ID は、`auth-profiles.json` に一致するエントリが存在しない場合でも、`auth.order` とセッションオーバーライドに現れることがあります。

`auth-profiles.json` に `type: "aws-sdk"` を書き込まないでください。レガシーインストールにそのようなマーカーがある場合、`openclaw doctor --fix` はそれを `auth.profiles` に移動し、認証情報ストアからマーカーを削除します。

## 明示的な認証順序フィルタリング

- プロバイダーに対して `auth.order.<provider>` または認証ストアの順序オーバーライドが設定されている場合、`models status --probe` は、そのプロバイダーの解決済み認証順序に残っているプロファイル ID のみをプローブします。
- そのプロバイダーの保存済みプロファイルが明示的な順序から省略されている場合、後で暗黙的に試行されることはありません。プローブ出力は `reasonCode: excluded_by_auth_order` と詳細 `Excluded by auth.order for this provider.` でそれを報告します。

## プローブ対象の解決

- プローブ対象は、認証プロファイル、環境認証情報、または `models.json` から取得できます。
- プロバイダーに認証情報があるものの、OpenClaw がそのプロバイダーに対してプローブ可能なモデル候補を解決できない場合、`models status --probe` は `reasonCode: no_model` とともに `status: no_model` を報告します。

## 外部 CLI 認証情報の検出

- 外部 CLI が所有するランタイム専用の認証情報は、現在の操作のスコープ内にプロバイダー、ランタイム、または認証プロファイルがある場合、またはその外部ソースの保存済みローカルプロファイルがすでに存在する場合にのみ検出されます。
- 認証ストア呼び出し側は、明示的な外部 CLI 検出モードを選択する必要があります。永続化済み/Plugin 認証のみの場合は `none`、すでに保存されている外部 CLI プロファイルを更新する場合は `existing`、具体的なプロバイダー/プロファイルセットの場合は `scoped` です。
- 読み取り専用/ステータスパスは `allowKeychainPrompt: false` を渡します。ファイルベースの外部 CLI 認証情報のみを使用し、macOS Keychain の結果を読み取ったり再利用したりしません。

## OAuth SecretRef ポリシーガード

- SecretRef 入力は静的認証情報専用です。
- プロファイル認証情報が `type: "oauth"` の場合、そのプロファイル認証情報素材では SecretRef オブジェクトはサポートされません。
- `auth.profiles.<id>.mode` が `"oauth"` の場合、そのプロファイルに対する SecretRef ベースの `keyRef`/`tokenRef` 入力は拒否されます。
- 違反は、起動/再読み込みの認証解決パスでハードフェイルになります。

## レガシー互換メッセージング

スクリプト互換性のため、プローブエラーはこの先頭行を変更せずに保持します。

`Auth profile credentials are missing or expired.`

人間が読みやすい詳細と安定した理由コードは、後続行に追加される場合があります。

## 関連

- [シークレット管理](/ja-JP/gateway/secrets)
- [認証ストレージ](/ja-JP/concepts/oauth)

---
read_when:
    - 認証プロファイルの解決または認証情報ルーティングに取り組む場合
    - モデル認証の失敗またはプロファイル順序のデバッグ
summary: 認証プロファイルにおける正規認証情報の適格性と解決セマンティクス
title: 認証情報のセマンティクス
x-i18n:
    generated_at: "2026-05-07T13:13:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d916ff95ca2ac1fe21e66f64b887b1df1e6b97d7dcc681e5bb9a9dee8ce9473
    source_path: auth-credential-semantics.md
    workflow: 16
---

このドキュメントは、次にまたがって使用される標準の認証情報適格性と解決セマンティクスを定義します。

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

目的は、選択時とランタイムの挙動を一致させることです。

## 安定したプローブ理由コード

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## トークン認証情報

トークン認証情報（`type: "token"`）は、インラインの `token` と `tokenRef` の一方または両方をサポートします。

### 適格性ルール

1. トークンプロファイルは、`token` と `tokenRef` の両方が存在しない場合に不適格です。
2. `expires` は任意です。
3. `expires` が存在する場合、`0` より大きい有限の数値でなければなりません。
4. `expires` が無効（`NaN`、`0`、負数、非有限値、または誤った型）の場合、プロファイルは `invalid_expires` として不適格です。
5. `expires` が過去の場合、プロファイルは `expired` として不適格です。
6. `tokenRef` は `expires` の検証をバイパスしません。

### 解決ルール

1. リゾルバーのセマンティクスは、`expires` の適格性セマンティクスと一致します。
2. 適格なプロファイルでは、トークン素材をインライン値または `tokenRef` から解決できます。
3. 解決できない参照は、`models status --probe` 出力で `unresolved_ref` を生成します。

## エージェントコピーの移植性

エージェントの認証継承は読み取り透過です。エージェントにローカルプロファイルがない場合、
シークレット素材を自身の `auth-profiles.json` にコピーせずに、ランタイムでデフォルト/メインエージェントストアから
プロファイルを解決できます。

`openclaw agents add` などの明示的なコピー処理では、次の移植性ポリシーを使用します。

- `api_key` プロファイルは、`copyToAgents: false` でない限り移植可能です。
- `token` プロファイルは、`copyToAgents: false` でない限り移植可能です。
- `oauth` プロファイルは、更新トークンが単回使用またはローテーションに敏感な場合があるため、
  デフォルトでは移植できません。
- プロバイダー所有の OAuth フローは、エージェント間で更新素材をコピーしても安全であることが既知の場合にのみ、
  `copyToAgents: true` でオプトインできます。

移植できないプロファイルは、対象エージェントが別途サインインして自身のローカルプロファイルを作成しない限り、
読み取り透過継承を通じて引き続き利用できます。

## 設定専用の認証ルート

`mode: "aws-sdk"` を持つ `auth.profiles` エントリは、保存された認証情報ではなく
ルーティングメタデータです。対象プロバイダーが
`models.providers.<id>.auth: "aws-sdk"` または組み込みの Amazon Bedrock デフォルト
AWS SDK ルートを使用する場合に有効です。これらのプロファイル ID は、一致するエントリが
`auth-profiles.json` に存在しない場合でも、`auth.order` とセッション
オーバーライドに現れることがあります。

`type: "aws-sdk"` を `auth-profiles.json` に書き込まないでください。レガシーインストールに
そのようなマーカーがある場合、`openclaw doctor --fix` はそれを `auth.profiles` に移動し、
認証情報ストアからマーカーを削除します。

## 明示的な認証順序フィルタリング

- あるプロバイダーに対して `auth.order.<provider>` または認証ストアの順序オーバーライドが設定されている場合、
  `models status --probe` は、そのプロバイダーの解決済み認証順序に残っている
  プロファイル ID のみをプローブします。
- そのプロバイダー用に保存されているプロファイルが明示的な順序から省略されている場合、
  後で暗黙的に試行されることはありません。プローブ出力は、そのプロファイルを
  `reasonCode: excluded_by_auth_order` と詳細
  `Excluded by auth.order for this provider.` で報告します。

## プローブ対象の解決

- プローブ対象は、認証プロファイル、環境認証情報、または
  `models.json` から取得できます。
- プロバイダーに認証情報があるものの、OpenClaw がプローブ可能なモデル候補を
  解決できない場合、`models status --probe` は `reasonCode: no_model` とともに
  `status: no_model` を報告します。

## 外部 CLI 認証情報の検出

- 外部 CLI が所有するランタイム専用認証情報は、プロバイダー、ランタイム、または認証プロファイルが現在の操作の範囲内にある場合、
  またはその外部ソース用に保存済みのローカルプロファイルがすでに存在する場合にのみ検出されます。
- 認証ストアの呼び出し元は、明示的な外部 CLI 検出モードを選択する必要があります。
  永続化済み/Plugin 認証のみの場合は `none`、すでに
  保存されている外部 CLI プロファイルを更新する場合は `existing`、具体的なプロバイダー/プロファイルセットの場合は `scoped` です。
- 読み取り専用/ステータスパスは `allowKeychainPrompt: false` を渡します。ファイルベースの
  外部 CLI 認証情報のみを使用し、macOS Keychain の結果を読み取ったり再利用したりしません。

## OAuth SecretRef ポリシーガード

- SecretRef 入力は静的認証情報専用です。
- プロファイル認証情報が `type: "oauth"` の場合、そのプロファイル認証情報素材では SecretRef オブジェクトはサポートされません。
- `auth.profiles.<id>.mode` が `"oauth"` の場合、そのプロファイルに対する SecretRef ベースの `keyRef`/`tokenRef` 入力は拒否されます。
- 違反は、起動/再読み込み時の認証解決パスでハードエラーになります。

## レガシー互換メッセージ

スクリプト互換性のため、プローブエラーはこの最初の行を変更しません。

`Auth profile credentials are missing or expired.`

人間にわかりやすい詳細と安定した理由コードは、後続の行に追加される場合があります。

## 関連

- [シークレット管理](/ja-JP/gateway/secrets)
- [認証ストレージ](/ja-JP/concepts/oauth)

---
read_when:
    - 認証プロファイルの解決または認証情報のルーティングに取り組む
    - モデル認証の失敗またはプロファイル順序のデバッグ
summary: 認証プロファイルの正規の認証情報の適格性と解決セマンティクス
title: 認証情報のセマンティクス
x-i18n:
    generated_at: "2026-04-30T21:02:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39b9f96159d5a7b793983d07c37a73139a0904abbbc8831267807d6acf5c0037
    source_path: auth-credential-semantics.md
    workflow: 16
---

このドキュメントは、以下全体で使用される標準の認証情報適格性と解決セマンティクスを定義します。

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

トークン認証情報（`type: "token"`）は、インラインの `token` および/または `tokenRef` をサポートします。

### 適格性ルール

1. `token` と `tokenRef` の両方が存在しない場合、トークンプロファイルは不適格です。
2. `expires` は省略可能です。
3. `expires` が存在する場合、`0` より大きい有限数である必要があります。
4. `expires` が無効（`NaN`、`0`、負数、非有限、または誤った型）の場合、プロファイルは `invalid_expires` で不適格になります。
5. `expires` が過去の場合、プロファイルは `expired` で不適格になります。
6. `tokenRef` は `expires` の検証を迂回しません。

### 解決ルール

1. リゾルバーのセマンティクスは、`expires` の適格性セマンティクスと一致します。
2. 適格なプロファイルでは、トークン素材をインライン値または `tokenRef` から解決できます。
3. 解決できない参照は、`models status --probe` 出力で `unresolved_ref` を生成します。

## エージェントコピーの移植性

エージェント認証の継承は読み取りスルーです。エージェントにローカルプロファイルがない場合、シークレット素材を自身の `auth-profiles.json` にコピーせずに、ランタイムでデフォルト/メインエージェントストアからプロファイルを解決できます。

`openclaw agents add` などの明示的なコピーフローでは、この移植性ポリシーを使用します。

- `api_key` プロファイルは、`copyToAgents: false` でない限り移植可能です。
- `token` プロファイルは、`copyToAgents: false` でない限り移植可能です。
- `oauth` プロファイルは、リフレッシュトークンが単回使用またはローテーションの影響を受けやすい場合があるため、デフォルトでは移植できません。
- プロバイダー所有の OAuth フローは、エージェント間でリフレッシュ素材をコピーしても安全であることが分かっている場合にのみ、`copyToAgents: true` でオプトインできます。

移植できないプロファイルは、ターゲットエージェントが個別にサインインして自身のローカルプロファイルを作成しない限り、読み取りスルー継承を通じて引き続き利用できます。

## 明示的な認証順序フィルタリング

- プロバイダーに対して `auth.order.<provider>` または認証ストアの順序オーバーライドが設定されている場合、`models status --probe` はそのプロバイダーの解決済み認証順序に残っているプロファイル ID のみをプローブします。
- 明示的な順序から省略された、そのプロバイダーの保存済みプロファイルは、後で暗黙的に試行されることはありません。プローブ出力では、そのプロファイルを `reasonCode: excluded_by_auth_order` と詳細 `Excluded by auth.order for this provider.` で報告します。

## プローブターゲットの解決

- プローブターゲットは、認証プロファイル、環境認証情報、または `models.json` から取得できます。
- プロバイダーに認証情報があるにもかかわらず、OpenClaw がそのプロバイダー向けのプローブ可能なモデル候補を解決できない場合、`models status --probe` は `reasonCode: no_model` とともに `status: no_model` を報告します。

## 外部 CLI 認証情報の検出

- 外部 CLI が所有するランタイム専用認証情報は、現在の操作でプロバイダー、ランタイム、または認証プロファイルが対象範囲に入っている場合、またはその外部ソースの保存済みローカルプロファイルがすでに存在する場合にのみ検出されます。
- 認証ストアの呼び出し元は、明示的な外部 CLI 検出モードを選択する必要があります。永続化済み/Plugin 認証のみの場合は `none`、すでに保存されている外部 CLI プロファイルを更新する場合は `existing`、具体的なプロバイダー/プロファイルセットの場合は `scoped` です。
- 読み取り専用/ステータスパスは `allowKeychainPrompt: false` を渡します。ファイルに裏付けられた外部 CLI 認証情報のみを使用し、macOS Keychain の結果を読み取ったり再利用したりしません。

## OAuth SecretRef ポリシーガード

- SecretRef 入力は静的認証情報専用です。
- プロファイル認証情報が `type: "oauth"` の場合、そのプロファイル認証情報素材では SecretRef オブジェクトはサポートされません。
- `auth.profiles.<id>.mode` が `"oauth"` の場合、そのプロファイルに対する SecretRef 裏付けの `keyRef`/`tokenRef` 入力は拒否されます。
- 違反は、起動/リロード時の認証解決パスでハードフェイルになります。

## レガシー互換メッセージ

スクリプト互換性のため、プローブエラーはこの先頭行を変更しません。

`Auth profile credentials are missing or expired.`

人間が読みやすい詳細と安定した理由コードは、後続の行に追加される場合があります。

## 関連

- [シークレット管理](/ja-JP/gateway/secrets)
- [認証ストレージ](/ja-JP/concepts/oauth)

---
read_when:
    - authプロファイルの解決または資格情報ルーティングに取り組む場合
    - モデル認証の失敗またはプロファイル順序のデバッグ
summary: authプロファイルにおける正規の資格情報の適格性と解決のセマンティクス
title: 認証資格情報のセマンティクス
x-i18n:
    generated_at: "2026-04-24T04:44:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: b45da872b9ab177acbac08ce353b6ee31b6a068477ace52e5e5eda32a848d8bb
    source_path: auth-credential-semantics.md
    workflow: 15
---

このドキュメントでは、以下全体で使用される、正規の資格情報の適格性と解決のセマンティクスを定義します。

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

目的は、選択時の動作と実行時の動作の整合性を保つことです。

## 安定したプローブ理由コード

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## トークン資格情報

トークン資格情報（`type: "token"`）は、インラインの`token`および/または`tokenRef`をサポートします。

### 適格性ルール

1. `token`と`tokenRef`の両方が存在しない場合、トークンプロファイルは不適格です。
2. `expires`は省略可能です。
3. `expires`が存在する場合、`0`より大きい有限数でなければなりません。
4. `expires`が無効（`NaN`、`0`、負数、非有限値、または型が不正）な場合、プロファイルは`invalid_expires`により不適格です。
5. `expires`が過去の時刻である場合、プロファイルは`expired`により不適格です。
6. `tokenRef`は`expires`の検証を回避しません。

### 解決ルール

1. リゾルバーのセマンティクスは、`expires`に関する適格性セマンティクスと一致します。
2. 適格なプロファイルでは、トークン実体はインライン値または`tokenRef`から解決される場合があります。
3. 解決不能なrefは、`models status --probe`の出力で`unresolved_ref`になります。

## 明示的な認証順序フィルタリング

- プロバイダーに対して`auth.order.<provider>`またはauth-storeの順序オーバーライドが設定されている場合、`models status --probe`は、そのプロバイダーについて解決済みの認証順序に残っているプロファイルIDのみをプローブします。
- そのプロバイダーの保存済みプロファイルが明示的な順序から省かれている場合、後で暗黙的に試行されることはありません。プローブ出力では、それは`reasonCode: excluded_by_auth_order`および詳細`Excluded by auth.order for this provider.`として報告されます。

## プローブ対象の解決

- プローブ対象は、authプロファイル、環境資格情報、または`models.json`から取得できます。
- あるプロバイダーに資格情報があるにもかかわらず、OpenClawがそのプロバイダーについてプローブ可能なモデル候補を解決できない場合、`models status --probe`は`reasonCode: no_model`を伴う`status: no_model`を報告します。

## OAuth SecretRefポリシーガード

- SecretRef入力は静的資格情報専用です。
- プロファイル資格情報が`type: "oauth"`である場合、そのプロファイル資格情報実体ではSecretRefオブジェクトはサポートされません。
- `auth.profiles.<id>.mode`が`"oauth"`である場合、そのプロファイルのSecretRefを利用した`keyRef`/`tokenRef`入力は拒否されます。
- 違反は、起動時/リロード時の認証解決パスではハード失敗となります。

## レガシー互換メッセージ

スクリプト互換性のため、プローブエラーではこの最初の行を変更しないでください。

`Auth profile credentials are missing or expired.`

人が読みやすい詳細および安定した理由コードは、後続の行に追加できます。

## 関連

- [Secrets management](/ja-JP/gateway/secrets)
- [Auth storage](/ja-JP/concepts/oauth)

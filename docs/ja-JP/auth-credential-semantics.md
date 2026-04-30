---
read_when:
    - 認証プロファイルの解決または認証情報ルーティングに取り組む
    - モデル認証の失敗またはプロファイル順序のデバッグ
summary: 認証プロファイルにおける正規の認証情報の適格性と解決セマンティクス
title: 認証情報のセマンティクス
x-i18n:
    generated_at: "2026-04-30T04:57:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0525a71d3f08b7aa95e2f06acc6c23d87cd92d6b5fe4fc050ecf2b7caff84b3f
    source_path: auth-credential-semantics.md
    workflow: 16
---

このドキュメントでは、次の全体で使用される正規の認証情報適格性と解決セマンティクスを定義します。

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

目的は、選択時と実行時の動作を一致させることです。

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

1. `token` と `tokenRef` の両方が存在しない場合、トークンプロファイルは不適格です。
2. `expires` は任意です。
3. `expires` が存在する場合、`0` より大きい有限の数値である必要があります。
4. `expires` が無効（`NaN`、`0`、負数、非有限、または型が誤っている）場合、プロファイルは `invalid_expires` で不適格です。
5. `expires` が過去の時刻である場合、プロファイルは `expired` で不適格です。
6. `tokenRef` は `expires` の検証を迂回しません。

### 解決ルール

1. リゾルバーのセマンティクスは、`expires` の適格性セマンティクスと一致します。
2. 適格なプロファイルでは、トークン素材をインライン値または `tokenRef` から解決できます。
3. 解決できない参照は、`models status --probe` 出力で `unresolved_ref` を生成します。

## エージェントコピーのポータビリティ

エージェント認証の継承は読み取り透過です。エージェントにローカルプロファイルがない場合、実行時にデフォルト/メインエージェントストアからプロファイルを解決でき、シークレット素材を自身の `auth-profiles.json` にコピーする必要はありません。

`openclaw agents add` などの明示的なコピー処理では、次のポータビリティポリシーを使用します。

- `api_key` プロファイルは、`copyToAgents: false` でない限りポータブルです。
- `token` プロファイルは、`copyToAgents: false` でない限りポータブルです。
- `oauth` プロファイルは、リフレッシュトークンが単回使用またはローテーションに影響を受ける可能性があるため、デフォルトではポータブルではありません。
- プロバイダー所有の OAuth フローは、エージェント間でリフレッシュ素材をコピーしても安全であることが分かっている場合に限り、`copyToAgents: true` でオプトインできます。

ポータブルではないプロファイルも、対象エージェントが別途サインインして自身のローカルプロファイルを作成しない限り、読み取り透過の継承を通じて利用できます。

## 明示的な認証順序フィルタリング

- プロバイダーに `auth.order.<provider>` または認証ストアの順序オーバーライドが設定されている場合、`models status --probe` は、そのプロバイダーの解決済み認証順序に残っているプロファイル ID のみをプローブします。
- そのプロバイダーの保存済みプロファイルが明示的な順序から省略されている場合、後で暗黙的に試行されることはありません。プローブ出力は、そのプロファイルを `reasonCode: excluded_by_auth_order` および詳細 `Excluded by auth.order for this provider.` として報告します。

## プローブ対象の解決

- プローブ対象は、認証プロファイル、環境認証情報、または `models.json` から取得できます。
- プロバイダーに認証情報があるものの、OpenClaw がプローブ可能なモデル候補を解決できない場合、`models status --probe` は `status: no_model` と `reasonCode: no_model` を報告します。

## 外部 CLI 認証情報の検出

- 外部 CLI が所有する実行時専用の認証情報は、現在の操作でプロバイダー、ランタイム、または認証プロファイルがスコープ内にある場合、またはその外部ソースの保存済みローカルプロファイルがすでに存在する場合にのみ検出されます。
- 読み取り専用/ステータス経路は `allowKeychainPrompt: false` を渡します。これらはファイルベースの外部 CLI 認証情報のみを使用し、macOS キーチェーンの結果を読み取ったり再利用したりしません。

## OAuth SecretRef ポリシーガード

- SecretRef 入力は静的な認証情報専用です。
- プロファイル認証情報が `type: "oauth"` の場合、そのプロファイル認証情報素材では SecretRef オブジェクトはサポートされません。
- `auth.profiles.<id>.mode` が `"oauth"` の場合、そのプロファイルに対する SecretRef ベースの `keyRef`/`tokenRef` 入力は拒否されます。
- 違反は、起動/再読み込みの認証解決経路でハードエラーになります。

## レガシー互換メッセージング

スクリプト互換性のため、プローブエラーではこの先頭行を変更しません。

`Auth profile credentials are missing or expired.`

人間が読みやすい詳細と安定した理由コードは、後続行に追加される場合があります。

## 関連

- [シークレット管理](/ja-JP/gateway/secrets)
- [認証ストレージ](/ja-JP/concepts/oauth)

---
read_when:
    - 認証プロファイルの解決または認証情報のルーティングに取り組んでいます
    - モデル認証失敗またはプロファイル順序のデバッグ
summary: 認証プロファイルの正規の認証情報適格性と解決セマンティクス
title: 認証資格情報のセマンティクス
x-i18n:
    generated_at: "2026-07-05T11:00:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0516b1bb23f400d5ac5fd39a628736034440216ac22823eef061b38564dff0
    source_path: auth-credential-semantics.md
    workflow: 16
---

これらのセマンティクスにより、選択時とランタイムの認証動作を一致させます。これらは以下で共有されます。

- `resolveAuthProfileOrder`（プロファイル順序）
- `resolveApiKeyForProfile`（ランタイム認証情報解決）
- `openclaw models status --probe`
- `openclaw doctor` 認証チェック（`doctor-auth`）

## 安定したプローブ理由コード

プローブ結果は `status` バケット（`ok`、`auth`、`rate_limit`、`billing`、`timeout`、`format`、`unknown`、`no_model`）と、プローブがモデル呼び出しに到達しなかった場合の安定した `reasonCode` を持ちます。

| `reasonCode`             | 意味                                                                         |
| ------------------------ | ---------------------------------------------------------------------------- |
| `excluded_by_auth_order` | プロファイルが、そのプロバイダーの明示的な認証順序から除外されています。     |
| `missing_credential`     | インライン認証情報または SecretRef が設定されていません。                    |
| `expired`                | トークンの `expires` が過去の時刻です。                                      |
| `invalid_expires`        | `expires` が有効な正の Unix ms タイムスタンプではありません。                |
| `unresolved_ref`         | 設定された SecretRef を解決できませんでした。                                |
| `ineligible_profile`     | プロファイルがプロバイダー設定と互換性がありません（不正なキー入力を含む）。 |
| `no_model`               | 認証情報は存在しますが、プローブ可能なモデル候補が解決されませんでした。     |

適格性チェックでは、使用可能な認証情報の理由コードとして `ok` を報告します。

## トークン認証情報

トークン認証情報（`type: "token"`）は、インラインの `token` と `tokenRef` の一方または両方をサポートします。

### 適格性ルール

1. トークンプロファイルは、`token` と `tokenRef` の両方が存在しない場合に不適格です（`missing_credential`）。
2. `expires` は任意です。存在する場合は、`0` より大きく、JavaScript `Date` タイムスタンプの最大値（8640000000000000）以下の有限な Unix エポックミリ秒数でなければなりません。
3. `expires` が無効な場合（型が違う、`NaN`、`0`、負数、有限でない、またはその最大値を超える）、プロファイルは `invalid_expires` で不適格になります。
4. `expires` が過去の時刻の場合、プロファイルは `expired` で不適格になります。
5. `tokenRef` は `expires` の検証をバイパスしません。

### 解決ルール

1. リゾルバーのセマンティクスは、`expires` の適格性セマンティクスと一致します。
2. 適格なプロファイルでは、トークン素材をインライン値または `tokenRef` から解決できます。
3. 解決できない参照は、`models status --probe` 出力で `unresolved_ref` を生成します。

## エージェントコピーのポータビリティ

エージェント認証の継承は read-through です。エージェントにローカルプロファイルがない場合、実行時にデフォルト/メインエージェントストアからプロファイルを解決し、シークレット素材を自身の認証情報ストア（`agents/<agentId>/agent/openclaw-agent.sqlite`）にコピーしません。

`openclaw agents add` などの明示的なコピー処理では、このポータビリティポリシーを使用します。

- `api_key` と `token` プロファイルは、`copyToAgents: false` でない限りポータブルです。
- `oauth` プロファイルは、リフレッシュトークンが単回使用またはローテーションの影響を受けやすい場合があるため、デフォルトではポータブルではありません。
- プロバイダー所有の OAuth フローは、エージェント間でリフレッシュ素材をコピーしても安全であることが分かっている場合に限り、`copyToAgents: true` でオプトインできます。このオプトインは、プロファイルがインラインのアクセス/リフレッシュ素材を持つ場合にのみ適用されます。

非ポータブルなプロファイルは、対象エージェントが別途サインインして自身のローカルプロファイルを作成しない限り、read-through 継承を通じて引き続き利用できます。

## 設定のみの認証ルート

`mode: "aws-sdk"` を持つ `auth.profiles` エントリは、保存された認証情報ではなくルーティングメタデータです。対象プロバイダーが `models.providers.<id>.auth: "aws-sdk"` を使用する場合に有効であり、これは Plugin 所有の Amazon Bedrock セットアップが書き込むルートです。これらのプロファイル ID は、認証情報ストアに一致するエントリが存在しない場合でも、`auth.order` とセッションオーバーライドに出現できます。

認証情報ストアに `type: "aws-sdk"` を書き込まないでください。保存される認証情報は `api_key`、`token`、`oauth` のみです。レガシーな `auth-profiles.json` にそのようなマーカーがある場合、`openclaw doctor --fix` はそれを `auth.profiles` に移動し、ストアからそのマーカーを削除します。

## 明示的な認証順序フィルタリング

- あるプロバイダーに対して `auth.order.<provider>` または認証ストアの順序オーバーライドが設定されている場合、`models status --probe` は、そのプロバイダーの解決済み認証順序に残っているプロファイル ID のみをプローブします。保存されたオーバーライドは `auth.order` 設定より優先されます。
- そのプロバイダーの保存済みプロファイルが明示的な順序から除外されている場合、後で暗黙的に試行されることはありません。プローブ出力は、そのプロファイルを `reasonCode: excluded_by_auth_order` および詳細 `Excluded by auth.order for this provider.` として報告します。

## プローブ対象の解決

- プローブ対象は、認証プロファイル、環境認証情報、または `models.json` から取得できます（結果の `source`: `profile`、`env`、`models.json`）。
- プロバイダーに認証情報があるものの、OpenClaw がそのプロバイダーのプローブ可能なモデル候補を解決できない場合、`models status --probe` は `reasonCode: no_model` とともに `status: no_model` を報告します。

## 外部 CLI 認証情報の検出

- 外部 CLI が所有するランタイム専用認証情報（`claude-cli` の Claude CLI、`openai` の Codex CLI、`minimax-portal` の MiniMax CLI）は、現在の操作のスコープ内にプロバイダー、ランタイム、または認証プロファイルがある場合、またはその外部ソースの保存済みローカルプロファイルがすでに存在する場合にのみ検出されます。
- 認証ストアの呼び出し元は、明示的な外部 CLI 検出モードを選択します。永続化済み/Plugin 認証のみの場合は `none`、すでに保存されている外部 CLI プロファイルを更新する場合は `existing`、具体的なプロバイダー/プロファイルセットの場合は `scoped` です。
- 読み取り専用/ステータスパスは `allowKeychainPrompt: false` を渡します。これらはファイルベースの外部 CLI 認証情報のみを使用し、macOS Keychain の結果を読み取ったり再利用したりしません。

## OAuth SecretRef ポリシーガード

SecretRef 入力は静的な認証情報専用です。OAuth 認証情報はランタイムで変更可能（リフレッシュフローがローテーション済みトークンを永続化する）であるため、SecretRef ベースの OAuth 素材は可変状態を複数のストアに分割してしまいます。

- プロファイル認証情報が `type: "oauth"` の場合、そのプロファイル上のすべての認証情報素材フィールドで SecretRef オブジェクトは拒否されます。
- `auth.profiles.<id>.mode` が `"oauth"` の場合、そのプロファイルに対する SecretRef ベースの `keyRef`/`tokenRef` 入力は拒否されます。
- 違反は、起動/リロード時のシークレット準備およびプロファイル解決パスでハード失敗（スローされるエラー）になります。

## レガシー互換メッセージング

スクリプト互換性のため、プローブエラーではこの最初の行を変更しません。

`Auth profile credentials are missing or expired.`

人間に分かりやすい詳細と安定した理由コードは、後続の行に `↳ Auth reason [code]: ...` の形式で続きます。

## 関連

- [シークレット管理](/ja-JP/gateway/secrets)
- [認証ストレージ](/ja-JP/concepts/oauth)

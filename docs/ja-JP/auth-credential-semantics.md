---
read_when:
    - 認証プロファイルの解決または認証情報のルーティングに取り組む場合
    - モデル認証エラーまたはプロファイル順序のデバッグ
summary: 認証プロファイルにおける正規の認証情報の適格性と解決のセマンティクス
title: 認証資格情報のセマンティクス
x-i18n:
    generated_at: "2026-07-11T21:58:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0516b1bb23f400d5ac5fd39a628736034440216ac22823eef061b38564dff0
    source_path: auth-credential-semantics.md
    workflow: 16
---

これらのセマンティクスにより、選択時と実行時の認証動作の整合性が保たれます。これらは以下で共有されます。

- `resolveAuthProfileOrder`（プロファイルの順序付け）
- `resolveApiKeyForProfile`（実行時の認証情報解決）
- `openclaw models status --probe`
- `openclaw doctor` の認証チェック（`doctor-auth`）

## 安定したプローブ理由コード

プローブ結果には、`status` 区分（`ok`、`auth`、`rate_limit`、`billing`、`timeout`、`format`、`unknown`、`no_model`）に加え、プローブがモデル呼び出しに到達しなかった場合は安定した `reasonCode` が含まれます。

| `reasonCode`             | 意味                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| `excluded_by_auth_order` | プロバイダーに対する明示的な認証順序からプロファイルが除外されています。                         |
| `missing_credential`     | インライン認証情報も SecretRef も設定されていません。                                            |
| `expired`                | トークンの `expires` が過去の日時です。                                                           |
| `invalid_expires`        | `expires` が有効な正の Unix ミリ秒タイムスタンプではありません。                                 |
| `unresolved_ref`         | 設定された SecretRef を解決できませんでした。                                                     |
| `ineligible_profile`     | プロファイルがプロバイダー設定と互換性がありません（不正な形式のキー入力を含みます）。           |
| `no_model`               | 認証情報は存在しますが、プローブ可能なモデル候補を解決できませんでした。                         |

適格性チェックでは、使用可能な認証情報の理由コードとして `ok` が報告されます。

## トークン認証情報

トークン認証情報（`type: "token"`）は、インラインの `token` および／または `tokenRef` をサポートします。

### 適格性ルール

1. `token` と `tokenRef` の両方が存在しない場合、トークンプロファイルは不適格です（`missing_credential`）。
2. `expires` は省略可能です。指定する場合は、`0` より大きく、JavaScript の `Date` タイムスタンプの最大値（8640000000000000）以下である有限数の Unix エポックミリ秒でなければなりません。
3. `expires` が無効な場合（型が不正、`NaN`、`0`、負数、非有限値、またはその最大値を超える値）、プロファイルは `invalid_expires` として不適格になります。
4. `expires` が過去の日時である場合、プロファイルは `expired` として不適格になります。
5. `tokenRef` を使用しても `expires` の検証は回避されません。

### 解決ルール

1. リゾルバーの `expires` に関するセマンティクスは、適格性のセマンティクスと一致します。
2. 適格なプロファイルでは、トークン情報をインライン値または `tokenRef` から解決できます。
3. 解決できない参照は、`models status --probe` の出力で `unresolved_ref` になります。

## エージェントコピーの可搬性

エージェントの認証継承は読み取り透過方式です。エージェントにローカルプロファイルがない場合、シークレット情報を自身の認証情報ストア（`agents/<agentId>/agent/openclaw-agent.sqlite`）へコピーせず、実行時にデフォルト／メインエージェントのストアからプロファイルを解決します。

`openclaw agents add` などの明示的なコピー処理では、次の可搬性ポリシーが使用されます。

- `api_key` および `token` プロファイルは、`copyToAgents: false` でない限り可搬です。
- `oauth` プロファイルは、リフレッシュトークンが一度しか使用できない場合やローテーションの影響を受ける場合があるため、デフォルトでは可搬ではありません。
- プロバイダーが所有する OAuth フローは、エージェント間でリフレッシュ情報をコピーしても安全であることが判明している場合に限り、`copyToAgents: true` でオプトインできます。このオプトインは、プロファイルにインラインのアクセストークン／リフレッシュトークン情報が含まれている場合にのみ適用されます。

可搬でないプロファイルも、対象エージェントが個別にサインインして独自のローカルプロファイルを作成しない限り、読み取り透過継承を通じて引き続き使用できます。

## 設定専用の認証ルート

`mode: "aws-sdk"` を持つ `auth.profiles` エントリは、保存された認証情報ではなくルーティングメタデータです。対象プロバイダーが `models.providers.<id>.auth: "aws-sdk"` を使用する場合、つまり Plugin が所有する Amazon Bedrock のセットアップによって書き込まれるルートである場合に有効です。これらのプロファイル ID は、認証情報ストアに一致するエントリが存在しない場合でも、`auth.order` およびセッションオーバーライドに指定できます。

認証情報ストアに `type: "aws-sdk"` を書き込まないでください。保存できる認証情報は `api_key`、`token`、`oauth` のみです。従来の `auth-profiles.json` にこのようなマーカーがある場合、`openclaw doctor --fix` はそれを `auth.profiles` に移動し、ストアからマーカーを削除します。

## 明示的な認証順序によるフィルタリング

- プロバイダーに `auth.order.<provider>` または認証ストアの順序オーバーライドが設定されている場合、`models status --probe` は、そのプロバイダーについて解決された認証順序に残っているプロファイル ID のみをプローブします。保存されたオーバーライドが `auth.order` 設定より優先されます。
- 明示的な順序から除外された、そのプロバイダー用の保存済みプロファイルが後から暗黙的に試行されることはありません。プローブ出力では、`reasonCode: excluded_by_auth_order` と詳細 `Excluded by auth.order for this provider.` が報告されます。

## プローブ対象の解決

- プローブ対象は、認証プロファイル、環境認証情報、または `models.json` から取得できます（結果の `source`：`profile`、`env`、`models.json`）。
- プロバイダーに認証情報があっても、OpenClaw がプローブ可能なモデル候補を解決できない場合、`models status --probe` は `reasonCode: no_model` とともに `status: no_model` を報告します。

## 外部 CLI 認証情報の検出

- 外部 CLI が所有する実行時専用の認証情報（`claude-cli` 用の Claude CLI、`openai` 用の Codex CLI、`minimax-portal` 用の MiniMax CLI）は、プロバイダー、ランタイム、または認証プロファイルが現在の操作の対象範囲に含まれる場合、あるいはその外部ソース用の保存済みローカルプロファイルがすでに存在する場合にのみ検出されます。
- 認証ストアの呼び出し元は、外部 CLI の明示的な検出モードを選択します。永続化済み／Plugin 認証のみを対象とする `none`、保存済みの外部 CLI プロファイルを更新する `existing`、具体的なプロバイダー／プロファイルセットを対象とする `scoped` のいずれかです。
- 読み取り専用／ステータス確認の処理では `allowKeychainPrompt: false` が渡されます。ファイルに保存された外部 CLI 認証情報のみを使用し、macOS Keychain の結果を読み取ったり再利用したりしません。

## OAuth SecretRef ポリシーガード

SecretRef 入力は静的な認証情報専用です。OAuth 認証情報は実行時に変更されるため（更新フローによってローテーションされたトークンが永続化されます）、SecretRef による OAuth 情報の参照を許可すると、変更可能な状態が複数のストアに分散します。

- プロファイルの認証情報が `type: "oauth"` の場合、そのプロファイルのすべての認証情報フィールドで SecretRef オブジェクトが拒否されます。
- `auth.profiles.<id>.mode` が `"oauth"` の場合、そのプロファイルに対する SecretRef ベースの `keyRef`／`tokenRef` 入力が拒否されます。
- 違反があると、起動時／再読み込み時のシークレット準備およびプロファイル解決処理でハードエラー（例外の送出）になります。

## 従来互換のメッセージ

スクリプトとの互換性のため、プローブエラーでは次の先頭行が変更されずに維持されます。

`Auth profile credentials are missing or expired.`

人間が理解しやすい詳細と安定した理由コードは、後続の行に `↳ Auth reason [code]: ...` の形式で続きます。

## 関連項目

- [シークレット管理](/ja-JP/gateway/secrets)
- [認証情報の保存](/ja-JP/concepts/oauth)

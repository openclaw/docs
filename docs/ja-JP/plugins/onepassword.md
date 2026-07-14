---
read_when:
    - エージェントが厳選された1Passwordのシークレットをリクエストできるようにする場合
    - シークレットごとの承認ポリシーと監査履歴が必要です
    - OpenClaw 用の 1Password サービスアカウントを設定しています
summary: 監査済みのエージェント用シークレットブローカーとして、オプションの1Password Pluginを使用する
title: 1Password シークレットブローカー
x-i18n:
    generated_at: "2026-07-14T13:53:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 0b199fcb582739dff5d0f7583482ced8e30dfc7e20b62b984391ad7bb92f67e1
    source_path: plugins/onepassword.md
    workflow: 16
---

# 1Password シークレットブローカー

同梱の `onepassword` Plugin は、厳選された一連の 1Password フィールドを読み取るための、ポリシーで制御された単一のツールをエージェントに提供します。デフォルトでは無効であり、`plugins.entries.onepassword.config` が存在するまで何も実行しません。

これはエージェントツールであり、SecretRef プロバイダーではありません。環境変数を注入したり、OpenClaw の設定シークレットを解決したりするものではありません。

## セキュリティモデル

- サービスアカウント認証のみ。トークンはローカルの認証情報ファイルに保持され、`openclaw.json` では決して受け付けられません。
- 厳選されたレジストリのみ。エージェントは設定済みのスラッグを一覧表示できますが、Plugin が 1Password の保管庫を列挙することはありません。
- スラッグごとの `auto`、`approve`、または `deny` ポリシー。
- 承認による許可には有効期限があります。キャッシュされた値によって現在のポリシーが回避されることはありません。
- すべてのアクセス試行は、OpenClaw の共有 SQLite 状態に記録されます。監査行には指定された理由が含まれるため、理由には機密情報を含めないでください。ブローカーが取得した値やサービストークンを監査行にコピーすることはありません。
- 現在のツール実行後、OpenClaw が管理するトランスクリプトの永続化処理により、成功した `get` の値は墨消し済みのメタデータに置き換えられます。
- その実行中、値はモデルから参照できます。モデルがその値を後続のツール呼び出しや応答にコピーした場合、その別の記録はこの Plugin の永続化フックの対象外です。ポリシーの範囲を限定し、値をそのまま出力するようモデルに依頼しないでください。
- Plugin はキャッシュミスごとに `op` を 1 回呼び出します。レート制限やその他の失敗に対する再試行は行いません。

サービスアカウントには、Plugin の設定に登録された保管庫と項目のみへの読み取りアクセス権を付与してください。

## 始める前に

必要なもの：

- Gateway ホストにインストールされた 1Password CLI（`op`）
- 選択した項目へのアクセス権を持つ 1Password サービスアカウント
- 専用のサービスアカウントトークンファイル

同梱の Plugin を有効にします：

```bash
openclaw plugins enable onepassword
```

OpenClaw の状態ディレクトリ配下にトークン用のディレクトリとファイルを作成します：

```bash
mkdir -p ~/.openclaw/credentials/onepassword
chmod 700 ~/.openclaw/credentials/onepassword
printf '%s' "$OP_SERVICE_ACCOUNT_TOKEN" > \
  ~/.openclaw/credentials/onepassword/service-account-token
chmod 600 ~/.openclaw/credentials/onepassword/service-account-token
unset OP_SERVICE_ACCOUNT_TOKEN
```

`OPENCLAW_STATE_DIR` が設定されている場合は、`~/.openclaw` をそのディレクトリに置き換えてください。トークンファイルがグループまたは他のユーザーから読み取り可能または書き込み可能な場合、Plugin は一度だけ警告します。

## 登録するシークレットの設定

`openclaw.json` に Plugin の設定を追加します：

```jsonc
{
  "plugins": {
    "entries": {
      "onepassword": {
        "enabled": true,
        "config": {
          "vault": "Automation",
          "defaultPolicy": "approve",
          "cacheTtlSeconds": 300,
          "grantTtlHours": 720,
          "opTimeoutMs": 15000,
          "items": {
            "repository-token": {
              "item": "Repository automation token",
              "field": "credential",
              "policy": "approve",
              "description": "Token for repository automation",
            },
            "model-key": {
              "item": "Model provider key",
              "vault": "Agent credentials",
              "policy": "auto",
            },
          },
        },
      },
    },
  },
}
```

スラッグには小文字、数字、ハイフンを使用し、先頭は文字または数字にする必要があります。最大長は 64 文字です。1 つのレジストリには最大 32 個のスラッグを登録でき、説明は最大 200 文字です。`field` にはフィールドラベルまたは ID を 1 つ指定できます。カンマを含めることはできず、デフォルトは `credential` です。項目レベルの `vault` は、デフォルトの保管庫を上書きします。`opBin` には `op` 実行ファイルへの絶対パスを設定できます。設定されていない場合、Plugin は `PATH` から `op` を解決します。項目のタイトルをハイフンで始めることはできません。

## エージェントツールの使用

ツール名は `onepassword` です。

登録済みのスラッグを一覧表示します：

```json
{ "action": "list" }
```

結果に含まれるのは、スラッグ、説明、ポリシー、および継続的な許可が有効かどうかのみです。シークレット値が含まれることはなく、1Password への問い合わせも行いません。

シークレットを 1 つ要求します：

```json
{
  "action": "get",
  "slug": "repository-token",
  "reason": "Authenticate the requested repository operation"
}
```

`reason` は必須かつ空でない必要があり、最大 300 文字です。`get` が成功すると、値に加えて、設定されたスラッグ、項目のタイトル、フィールドラベルが返されます。

## ポリシー階層と承認

- `auto`：直ちに取得し、リクエストを監査します。
- `deny`：リクエストをブロックし、監査します。
- `approve`：有効期限内の継続的な許可を使用するか、人間に今回のみ許可、常に許可、または拒否を求めます。

今回のみ許可すると、現在のツール呼び出しだけが承認されます。常に許可すると、そのエージェントとスラッグに対する継続的な許可が SQLite に書き込まれます。他のエージェントには個別の承認が必要です。OpenClaw が常に許可する選択肢を提示するのは、呼び出し元に具体的なエージェント ID がある場合のみです。許可は `grantTtlHours` 後に失効し、デフォルトは 720 時間です。未解決またはタイムアウトした承認ではリクエストが拒否されます。承認の最大待機時間は 600 秒です。Plugin は最大 1,024 件の継続的な許可を保持します。この上限に達すると最も古い許可が削除され、そのエージェントは次回のアクセス時に承認を受ける必要があります。

メモリ内キャッシュのデフォルトは 300 秒で、設定されたスラッグレジストリによって上限が定まります。無効にするには `cacheTtlSeconds` を `0` に設定します。ポリシーはキャッシュを検索するたびに事前評価され、キャッシュヒットも監査されます。実行時の設定再読み込みは、各ポリシーおよび実行境界で反映されます。Plugin を無効化するか、スラッグを削除、拒否、または別の対象に変更すると、保留中の承認とキャッシュされた値が無効になります。

## ステータスと監査履歴の確認

準備状況とレジストリ数を表示します：

```bash
openclaw onepassword status
```

トークンファイルの有無、`op` が解決されたかどうかとそのパス、登録された項目数、およびポリシーごとの件数が報告されます。トークンやシークレット値を読み取ったり表示したりすることはありません。

最新の監査行を 50 件表示します：

```bash
openclaw onepassword audit
openclaw onepassword audit --limit 100
```

行は新しい順に表示され、タイムスタンプ、エージェント、スラッグ、結果、および切り詰められた理由が示されます。理由は指定されたまま保存されます。ブローカーが取得した値を監査ログに追加することはありません。

## 1Password CLI の動作

キャッシュミスのたびに、設定された項目、保管庫、完全一致のフィールドセレクター、JSON 出力、制限付きタイムアウト、および `--cache=false` を指定して `op item get` が実行されます。子プロセスが受け取るのは項目全体ではなく、そのフィールドのみです。子プロセスの環境に存在するのは `OP_SERVICE_ACCOUNT_TOKEN` と `HOME` だけです。

Plugin が試行するのは 1 回のみです。`RATE_LIMITED` エラーが発生した場合は、時間を置いてから後続のエージェントリクエストを行う必要があります。Plugin が自動再試行ループを作成することはありません。その他の安定したエラーコードにより、トークンまたはバイナリの欠落、項目またはフィールドの欠落、認証失敗、タイムアウト、その他の `op` の失敗が区別されます。

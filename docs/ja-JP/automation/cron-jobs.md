---
read_when:
    - バックグラウンドジョブまたはウェイクアップのスケジュール設定
    - 外部トリガー（Webhook、Gmail）を OpenClaw に接続する
    - スケジュールされたタスクに Heartbeat と Cron のどちらを使うかを判断する
summary: Gateway スケジューラのスケジュールされたジョブ、Webhook、および Gmail PubSub トリガー
title: スケジュールされたタスク
x-i18n:
    generated_at: "2026-04-21T13:35:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac08f67af43bc85a1713558899a220c935479620f1ef74aa76336259daac2828
    source_path: automation/cron-jobs.md
    workflow: 15
---

# スケジュールされたタスク（Cron）

Cron は Gateway に組み込まれたスケジューラです。ジョブを永続化し、適切なタイミングでエージェントを起動し、その出力をチャットチャネルや Webhook エンドポイントに返すことができます。

## クイックスタート

```bash
# 1 回限りのリマインダーを追加
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# ジョブを確認
openclaw cron list
openclaw cron show <job-id>

# 実行履歴を表示
openclaw cron runs --id <job-id>
```

## Cron の仕組み

- Cron は **Gateway のプロセス内** で実行されます（モデル内ではありません）。
- ジョブ定義は `~/.openclaw/cron/jobs.json` に永続化されるため、再起動してもスケジュールは失われません。
- 実行時の状態は、その隣の `~/.openclaw/cron/jobs-state.json` に永続化されます。Cron 定義を git で管理する場合は、`jobs.json` を追跡し、`jobs-state.json` は gitignore に追加してください。
- 分離後は、古い OpenClaw バージョンでも `jobs.json` を読み取れますが、実行時フィールドが `jobs-state.json` に移動したため、ジョブを新規として扱う可能性があります。
- すべての Cron 実行は [バックグラウンドタスク](/ja-JP/automation/tasks) レコードを作成します。
- 1 回限りのジョブ（`--at`）は、デフォルトで成功後に自動削除されます。
- 分離された Cron 実行では、実行完了時にその `cron:<jobId>` セッション用に追跡されているブラウザタブやプロセスをベストエフォートで閉じるため、切り離されたブラウザ自動化が孤立したプロセスを残しません。
- 分離された Cron 実行では、古い確認応答返信も防止されます。最初の結果が単なる中間ステータス更新（`on it`、`pulling everything together`、および同様のヒント）であり、最終回答を担当する子孫サブエージェント実行がまだ存在しない場合、OpenClaw は配信前に実際の結果を得るためにもう 1 度再プロンプトします。

<a id="maintenance"></a>

Cron のタスク再調整は実行時所有です。古い子セッション行が残っていても、Cron ランタイムがそのジョブを実行中として追跡している間は、アクティブな Cron タスクは存続します。
ランタイムがジョブの所有をやめ、5 分の猶予時間が過ぎると、メンテナンスによってタスクは `lost` とマークされることがあります。

## スケジュールの種類

| 種類    | CLI フラグ | 説明                                                      |
| ------- | ---------- | --------------------------------------------------------- |
| `at`    | `--at`     | 1 回限りのタイムスタンプ（ISO 8601 または `20m` のような相対指定） |
| `every` | `--every`  | 固定間隔                                                  |
| `cron`  | `--cron`   | 任意の `--tz` を指定できる 5 フィールドまたは 6 フィールドの cron 式 |

タイムゾーンのないタイムスタンプは UTC として扱われます。ローカル時刻でスケジュールするには `--tz America/New_York` を追加してください。

毎時ちょうどの繰り返し式は、負荷スパイクを減らすために最大 5 分まで自動的にずらされます。正確な時刻を強制するには `--exact` を使用するか、明示的なウィンドウとして `--stagger 30s` を使用してください。

### 日付指定と曜日指定は OR ロジックを使用します

Cron 式は [croner](https://github.com/Hexagon/croner) によって解析されます。日付フィールドと曜日フィールドの両方がワイルドカードでない場合、croner は **どちらか** のフィールドが一致したときに一致と判定します。両方ではありません。これは標準的な Vixie cron の挙動です。

```
# 意図:   「毎月 15 日の午前 9 時、ただし月曜日の場合のみ」
# 実際:   「毎月 15 日の午前 9 時」と「毎週月曜日の午前 9 時」
0 9 15 * 1
```

これは月 0〜1 回ではなく、およそ月 5〜6 回実行されます。OpenClaw はここで Croner のデフォルトの OR 挙動を使用します。両方の条件を必須にするには、Croner の `+` 曜日修飾子（`0 9 15 * +1`）を使用するか、片方のフィールドだけでスケジュールし、もう片方はジョブのプロンプトやコマンド内でガードしてください。

## 実行スタイル

| スタイル         | `--session` 値      | 実行される場所           | 最適な用途                       |
| ---------------- | ------------------- | ------------------------ | -------------------------------- |
| メインセッション | `main`              | 次の Heartbeat ターン    | リマインダー、システムイベント   |
| 分離             | `isolated`          | 専用の `cron:<jobId>`    | レポート、バックグラウンド作業   |
| 現在のセッション | `current`           | 作成時にバインド         | コンテキストを要する定期作業     |
| カスタムセッション | `session:custom-id` | 永続的な名前付きセッション | 履歴を積み上げるワークフロー     |

**メインセッション** のジョブはシステムイベントをキューに入れ、必要に応じて Heartbeat を起動します（`--wake now` または `--wake next-heartbeat`）。**分離** ジョブは新しいセッションで専用のエージェントターンを実行します。**カスタムセッション**（`session:xxx`）は実行間でコンテキストを保持するため、以前の要約をもとに積み上げるデイリースタンドアップのようなワークフローを実現できます。

分離ジョブでは、実行時の終了処理にその Cron セッションのブラウザクリーンアップもベストエフォートで含まれるようになりました。クリーンアップの失敗は無視されるため、実際の Cron 結果が優先されます。

分離された Cron 実行がサブエージェントをオーケストレーションする場合、配信では古い親の中間テキストよりも最終的な子孫出力が優先されます。子孫がまだ実行中なら、OpenClaw はその部分的な親更新を通知せずに抑制します。

### 分離ジョブのペイロードオプション

- `--message`: プロンプトテキスト（分離では必須）
- `--model` / `--thinking`: モデルおよび思考レベルの上書き
- `--light-context`: ワークスペースのブートストラップファイル注入をスキップ
- `--tools exec,read`: ジョブが使用できるツールを制限

`--model` は、そのジョブに対して選択された許可済みモデルを使用します。要求されたモデルが許可されていない場合、Cron は警告を記録し、代わりにそのジョブのエージェント/デフォルトのモデル選択にフォールバックします。設定されたフォールバックチェーンは引き続き適用されますが、ジョブごとの明示的なフォールバック一覧がない単なるモデル上書きでは、エージェントのプライマリモデルが隠れた追加リトライ先として付加されることはなくなりました。

分離ジョブのモデル選択の優先順位は次のとおりです。

1. Gmail フックのモデル上書き（その実行が Gmail 由来で、その上書きが許可されている場合）
2. ジョブごとのペイロード `model`
3. 保存された Cron セッションのモデル上書き
4. エージェント/デフォルトのモデル選択

Fast mode も解決された live 選択に従います。選択されたモデル設定に `params.fastMode` がある場合、分離 Cron はそれをデフォルトで使用します。保存されたセッションの `fastMode` 上書きは、どちらの方向でも引き続き設定より優先されます。

分離実行で live のモデル切り替えハンドオフが発生した場合、Cron は切り替え後のプロバイダー/モデルで再試行し、その live 選択を再試行前に永続化します。切り替えに新しい認証プロファイルも含まれている場合、Cron はその認証プロファイル上書きも永続化します。再試行回数には上限があります。初回試行に加えて切り替え再試行を 2 回行った後は、無限ループせずに中止します。

## 配信と出力

| モード     | 動作内容                                                            |
| ---------- | ------------------------------------------------------------------- |
| `announce` | エージェントが送信しなかった場合、最終テキストをターゲットにフォールバック配信する |
| `webhook`  | 完了イベントのペイロードを URL に POST する                         |
| `none`     | ランナーによるフォールバック配信なし                                |

チャネル配信には `--announce --channel telegram --to "-1001234567890"` を使用します。Telegram のフォーラムトピックには `-1001234567890:topic:123` を使用してください。Slack/Discord/Mattermost のターゲットでは明示的なプレフィックス（`channel:<id>`、`user:<id>`）を使用する必要があります。

分離ジョブでは、チャット配信は共有されます。チャットのルートが利用可能であれば、ジョブが `--no-deliver` を使用していてもエージェントは `message` ツールを使用できます。エージェントが設定済み/現在のターゲットに送信した場合、OpenClaw はフォールバックの announce をスキップします。そうでない場合、`announce`、`webhook`、`none` はエージェントターン後の最終返信をランナーがどう扱うかだけを制御します。

失敗通知は別の送信先パスに従います。

- `cron.failureDestination` は失敗通知のグローバルデフォルトを設定します。
- `job.delivery.failureDestination` はジョブ単位でそれを上書きします。
- どちらも設定されておらず、ジョブがすでに `announce` 経由で配信している場合、失敗通知はそのプライマリの announce ターゲットにフォールバックするようになりました。
- `delivery.failureDestination` は、プライマリ配信モードが `webhook` でない限り、`sessionTarget="isolated"` のジョブでのみサポートされます。

## CLI の例

1 回限りのリマインダー（メインセッション）:

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

配信付きの定期的な分離ジョブ:

```bash
openclaw cron add \
  --name "Morning brief" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize overnight updates." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

モデルと思考の上書き付きの分離ジョブ:

```bash
openclaw cron add \
  --name "Deep analysis" \
  --cron "0 6 * * 1" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Weekly deep analysis of project progress." \
  --model "opus" \
  --thinking high \
  --announce
```

## Webhook

Gateway は外部トリガー用に HTTP Webhook エンドポイントを公開できます。設定で有効にします。

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### 認証

すべてのリクエストには、ヘッダー経由でフックトークンを含める必要があります。

- `Authorization: Bearer <token>`（推奨）
- `x-openclaw-token: <token>`

クエリ文字列のトークンは拒否されます。

### POST /hooks/wake

メインセッション用のシステムイベントをキューに入れます。

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text`（必須）: イベントの説明
- `mode`（任意）: `now`（デフォルト）または `next-heartbeat`

### POST /hooks/agent

分離されたエージェントターンを実行します。

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

フィールド: `message`（必須）、`name`、`agentId`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`thinking`、`timeoutSeconds`。

### マップ済みフック（POST /hooks/\<name\>）

カスタムフック名は、設定内の `hooks.mappings` によって解決されます。マッピングは、テンプレートまたはコード変換を使って任意のペイロードを `wake` または `agent` アクションに変換できます。

### セキュリティ

- フックエンドポイントは loopback、tailnet、または信頼できるリバースプロキシの背後に置いてください。
- フック専用トークンを使用し、Gateway の認証トークンを使い回さないでください。
- `hooks.path` は専用のサブパスにしてください。`/` は拒否されます。
- 明示的な `agentId` ルーティングを制限するために `hooks.allowedAgentIds` を設定してください。
- 呼び出し元がセッションを選択する必要がない限り、`hooks.allowRequestSessionKey=false` のままにしてください。
- `hooks.allowRequestSessionKey` を有効にする場合は、許可されるセッションキーの形を制約するために `hooks.allowedSessionKeyPrefixes` も設定してください。
- フックのペイロードはデフォルトで安全境界によってラップされます。

## Gmail PubSub 統合

Google PubSub 経由で Gmail の受信トリガーを OpenClaw に接続します。

**前提条件**: `gcloud` CLI、`gog`（gogcli）、OpenClaw hooks が有効、公開 HTTPS エンドポイント用の Tailscale。

### ウィザード設定（推奨）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

これにより `hooks.gmail` 設定が書き込まれ、Gmail プリセットが有効になり、push エンドポイントには Tailscale Funnel が使用されます。

### Gateway の自動起動

`hooks.enabled=true` で `hooks.gmail.account` が設定されている場合、Gateway は起動時に `gog gmail watch serve` を開始し、watch を自動更新します。無効にするには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定してください。

### 手動での 1 回限りのセットアップ

1. `gog` が使用する OAuth クライアントを所有する GCP プロジェクトを選択します。

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. トピックを作成し、Gmail に push アクセス権を付与します。

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. watch を開始します。

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

### Gmail モデル上書き

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## ジョブの管理

```bash
# すべてのジョブを一覧表示
openclaw cron list

# 解決済みの配信ルートを含めて 1 つのジョブを表示
openclaw cron show <jobId>

# ジョブを編集
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# ジョブを今すぐ強制実行
openclaw cron run <jobId>

# 実行期限が来ている場合のみ実行
openclaw cron run <jobId> --due

# 実行履歴を表示
openclaw cron runs --id <jobId> --limit 50

# ジョブを削除
openclaw cron remove <jobId>

# エージェント選択（マルチエージェント構成）
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

モデル上書きに関する注意:

- `openclaw cron add|edit --model ...` はジョブの選択モデルを変更します。
- モデルが許可されている場合、その正確なプロバイダー/モデルが分離エージェント実行に渡されます。
- 許可されていない場合、Cron は警告を出し、ジョブのエージェント/デフォルトのモデル選択にフォールバックします。
- 設定済みのフォールバックチェーンは引き続き適用されますが、ジョブごとの明示的なフォールバック一覧がない単なる `--model` 上書きでは、エージェントのプライマリに暗黙の追加リトライ先としてフォールスルーしなくなりました。

## 設定

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

実行時状態のサイドカーは `cron.store` から導出されます。たとえば `~/clawd/cron/jobs.json` のような `.json` ストアでは `~/clawd/cron/jobs-state.json` が使われ、`.json` 接尾辞のないストアパスでは `-state.json` が追加されます。

Cron を無効にするには: `cron.enabled: false` または `OPENCLAW_SKIP_CRON=1`。

**1 回限りのリトライ**: 一時的なエラー（レート制限、過負荷、ネットワーク、サーバーエラー）は、指数バックオフで最大 3 回まで再試行されます。恒久的なエラーは即座に無効化されます。

**定期実行のリトライ**: 再試行の間隔には指数バックオフ（30 秒〜60 分）が使われます。バックオフは次の成功実行後にリセットされます。

**メンテナンス**: `cron.sessionRetention`（デフォルト `24h`）は分離された実行セッションのエントリを削除します。`cron.runLog.maxBytes` / `cron.runLog.keepLines` は実行ログファイルを自動削除します。

## トラブルシューティング

### コマンドの段階的確認

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

### Cron が実行されない

- `cron.enabled` と `OPENCLAW_SKIP_CRON` 環境変数を確認してください。
- Gateway が継続的に実行されていることを確認してください。
- `cron` スケジュールでは、タイムゾーン（`--tz`）とホストのタイムゾーンの違いを確認してください。
- 実行出力の `reason: not-due` は、手動実行が `openclaw cron run <jobId> --due` で確認され、そのジョブの期限がまだ来ていなかったことを意味します。

### Cron は実行されたが配信されない

- 配信モードが `none` の場合、ランナーによるフォールバック送信は想定されません。チャットルートが利用可能であれば、エージェントは引き続き `message` ツールで直接送信できます。
- 配信ターゲットが欠落または無効（`channel` / `to`）の場合、送信はスキップされます。
- チャネル認証エラー（`unauthorized`、`Forbidden`）は、認証情報により配信がブロックされたことを意味します。
- 分離実行がサイレントトークン（`NO_REPLY` / `no_reply`）だけを返した場合、OpenClaw は直接の送信配信を抑制し、フォールバックのキュー要約パスも抑制するため、チャットには何も投稿されません。
- エージェントが自分でユーザーにメッセージすべき場合は、そのジョブに使用可能なルート（前回のチャットがある `channel: "last"`、または明示的なチャネル/ターゲット）があることを確認してください。

### タイムゾーンの注意点

- `--tz` なしの Cron は Gateway ホストのタイムゾーンを使用します。
- タイムゾーンなしの `at` スケジュールは UTC として扱われます。
- Heartbeat の `activeHours` は設定されたタイムゾーン解決を使用します。

## 関連

- [Automation & Tasks](/ja-JP/automation) — すべての自動化メカニズムの概要
- [Background Tasks](/ja-JP/automation/tasks) — Cron 実行のタスク台帳
- [Heartbeat](/ja-JP/gateway/heartbeat) — 定期的なメインセッションターン
- [Timezone](/ja-JP/concepts/timezone) — タイムゾーン設定

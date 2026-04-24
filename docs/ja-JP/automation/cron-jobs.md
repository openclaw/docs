---
read_when:
    - バックグラウンドジョブまたはウェイクアップのスケジューリング
    - 外部トリガー（Webhook、Gmail）をOpenClawに接続する
    - スケジュール済みタスクにHeartbeatとCronのどちらを使うかを決める
summary: Gatewayスケジューラ向けのスケジュール済みジョブ、Webhook、Gmail PubSub トリガー
title: スケジュール済みタスク
x-i18n:
    generated_at: "2026-04-24T04:44:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: a165c7d2c51ebd5625656690458a96b04b498de29ecadcefc65864cbc2c1b84b
    source_path: automation/cron-jobs.md
    workflow: 15
---

# スケジュール済みタスク（Cron）

Cron は Gateway の組み込みスケジューラです。ジョブを永続化し、適切な時刻にエージェントを起動し、出力をチャットチャネルや Webhook エンドポイントに返すことができます。

## クイックスタート

```bash
# 1回限りのリマインダーを追加
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

## cron の仕組み

- Cron は **Gateway プロセス内**で実行されます（モデル内ではありません）。
- ジョブ定義は `~/.openclaw/cron/jobs.json` に永続化されるため、再起動してもスケジュールは失われません。
- 実行時の実行状態は、その隣の `~/.openclaw/cron/jobs-state.json` に永続化されます。cron 定義を git で追跡する場合は、`jobs.json` を追跡し、`jobs-state.json` は gitignore に追加してください。
- 分離後、古い OpenClaw バージョンでも `jobs.json` を読み取れますが、実行時フィールドは現在 `jobs-state.json` にあるため、ジョブを新規として扱う場合があります。
- すべての cron 実行は [バックグラウンドタスク](/ja-JP/automation/tasks) レコードを作成します。
- 1回限りのジョブ（`--at`）は、デフォルトで成功後に自動削除されます。
- 分離された cron 実行は、実行完了時にその `cron:<jobId>` セッション用に追跡されているブラウザタブやプロセスをベストエフォートで閉じるため、切り離されたブラウザ自動化によって孤立プロセスが残ることを防ぎます。
- 分離された cron 実行は、古い確認応答の返信も防止します。最初の結果が中間的なステータス更新（`on it`、`pulling everything together`、および類似のヒント）にすぎず、最終回答を担う子孫サブエージェント実行がまだ存在しない場合、OpenClaw は配信前に実際の結果を得るために一度だけ再プロンプトします。

<a id="maintenance"></a>

cron のタスク再調整はランタイム所有です。古い子セッション行が残っていても、アクティブな cron タスクは、cron ランタイムがそのジョブを実行中として追跡している間は存続します。
ランタイムがジョブの所有をやめ、5 分間の猶予ウィンドウが経過すると、メンテナンスはそのタスクを `lost` としてマークできます。

## スケジュールの種類

| 種類    | CLI フラグ | 説明                                                    |
| ------- | ---------- | ------------------------------------------------------- |
| `at`    | `--at`     | 1回限りのタイムスタンプ（ISO 8601 または `20m` のような相対指定） |
| `every` | `--every`  | 固定間隔                                                |
| `cron`  | `--cron`   | 任意の `--tz` を伴う 5 フィールドまたは 6 フィールドの cron 式 |

タイムゾーンのないタイムスタンプは UTC として扱われます。ローカル壁時計ベースでスケジュールするには `--tz America/New_York` を追加してください。

毎時ちょうどの定期実行式は、負荷スパイクを減らすために最大 5 分まで自動的にずらされます。正確な時刻を強制するには `--exact` を使用し、明示的なウィンドウを指定するには `--stagger 30s` を使用してください。

### 日と曜日は OR ロジックを使う

Cron 式は [croner](https://github.com/Hexagon/croner) によって解析されます。日付と曜日の両方のフィールドがワイルドカードでない場合、croner は **どちらか** のフィールドが一致したときに一致とみなします。両方ではありません。これは標準的な Vixie cron の動作です。

```
# 意図:   "15日で、かつ月曜日の場合のみ、午前9時"
# 実際:   "毎月15日の午前9時、かつ毎週月曜日の午前9時"
0 9 15 * 1
```

これは月に 0〜1 回ではなく、約 5〜6 回発火します。OpenClaw はここで Croner のデフォルト OR 動作を使います。両方の条件を必須にするには、Croner の `+` 曜日修飾子（`0 9 15 * +1`）を使うか、一方のフィールドだけでスケジュールし、もう一方はジョブのプロンプトまたはコマンド内でガードしてください。

## 実行スタイル

| スタイル        | `--session` の値     | 実行される場所             | 最適な用途                      |
| --------------- | -------------------- | -------------------------- | ------------------------------- |
| メインセッション | `main`               | 次の Heartbeat ターン      | リマインダー、システムイベント |
| 分離            | `isolated`           | 専用の `cron:<jobId>`      | レポート、バックグラウンド作業 |
| 現在のセッション | `current`            | 作成時点でバインド         | コンテキスト依存の定期作業     |
| カスタムセッション | `session:custom-id` | 永続的な名前付きセッション | 履歴を積み上げるワークフロー    |

**メインセッション** ジョブはシステムイベントをキューに入れ、必要に応じて Heartbeat を起動します（`--wake now` または `--wake next-heartbeat`）。**分離** ジョブは、新しいセッションで専用のエージェントターンを実行します。**カスタムセッション**（`session:xxx`）は実行間でコンテキストを永続化するため、以前の要約を土台にする日次スタンドアップのようなワークフローを実現できます。

分離ジョブでは、ランタイムの後処理にその cron セッション向けのベストエフォートなブラウザクリーンアップが含まれるようになりました。実際の cron 結果が優先されるよう、クリーンアップ失敗は無視されます。

分離された cron 実行は、共有ランタイムクリーンアップパスを通じて、そのジョブ用に作成された同梱 MCP ランタイムインスタンスも破棄します。これはメインセッションおよびカスタムセッションの MCP クライアントの終了方法と一致しており、分離 cron ジョブが stdio 子プロセスや長寿命 MCP 接続を実行間でリークしないようにします。

分離された cron 実行がサブエージェントをオーケストレーションする場合、配信でも古い親の中間テキストより子孫の最終出力を優先します。子孫がまだ実行中の場合、OpenClaw はその部分的な親更新を通知せず抑制します。

### 分離ジョブのペイロードオプション

- `--message`: プロンプトテキスト（分離では必須）
- `--model` / `--thinking`: モデルおよび思考レベルのオーバーライド
- `--light-context`: ワークスペースのブートストラップファイル注入をスキップ
- `--tools exec,read`: ジョブが使えるツールを制限

`--model` はそのジョブで選択された許可済みモデルを使います。要求されたモデルが許可されていない場合、cron は警告をログに記録し、その代わりにジョブのエージェント/デフォルトのモデル選択へフォールバックします。設定されたフォールバックチェーンは引き続き適用されますが、明示的なジョブ単位フォールバックリストがない単純なモデルオーバーライドでは、エージェントのプライマリが隠れた追加リトライ対象として付加されることはなくなりました。

分離ジョブのモデル選択優先順位は次のとおりです。

1. Gmail フックのモデルオーバーライド（実行が Gmail 由来で、そのオーバーライドが許可されている場合）
2. ジョブ単位ペイロードの `model`
3. 保存済み cron セッションのモデルオーバーライド
4. エージェント/デフォルトのモデル選択

Fast mode も解決されたライブ選択に従います。選択されたモデル設定に `params.fastMode` がある場合、分離 cron はデフォルトでそれを使用します。保存済みセッションの `fastMode` オーバーライドは、どちらの方向でも引き続き設定より優先されます。

分離実行でライブのモデル切り替えハンドオフが発生した場合、cron は切り替え後のプロバイダ/モデルで再試行し、そのライブ選択を再試行前に永続化します。切り替えに新しい認証プロファイルも含まれている場合、cron はその認証プロファイルのオーバーライドも永続化します。再試行回数には上限があります。初回試行に加えて 2 回の切り替え再試行の後、cron は無限ループせず中断します。

## 配信と出力

| モード      | 発生すること                                                     |
| ----------- | ---------------------------------------------------------------- |
| `announce`  | エージェントが送信しなかった場合、最終テキストを対象へフォールバック配信する |
| `webhook`   | 完了イベントのペイロードを URL に POST する                      |
| `none`      | ランナーによるフォールバック配信なし                             |

チャネル配信には `--announce --channel telegram --to "-1001234567890"` を使います。Telegram フォーラムトピックには `-1001234567890:topic:123` を使ってください。Slack/Discord/Mattermost の対象には、明示的なプレフィックス（`channel:<id>`、`user:<id>`）を使う必要があります。

分離ジョブでは、チャット配信は共有されます。チャットルートが利用可能であれば、ジョブが `--no-deliver` を使っていても、エージェントは `message` ツールを使えます。エージェントが設定済み/現在の対象へ送信した場合、OpenClaw はフォールバック announce をスキップします。そうでない場合、`announce`、`webhook`、`none` は、エージェントターン後にランナーが最終返信をどう扱うかだけを制御します。

失敗通知は別の宛先パスに従います。

- `cron.failureDestination` は失敗通知のグローバルデフォルトを設定します。
- `job.delivery.failureDestination` はジョブごとにそれを上書きします。
- どちらも設定されておらず、ジョブがすでに `announce` で配信している場合、失敗通知はそのプライマリ announce 対象へフォールバックするようになりました。
- `delivery.failureDestination` は、プライマリ配信モードが `webhook` でない限り、`sessionTarget="isolated"` ジョブでのみサポートされます。

## CLI の例

1回限りのリマインダー（メインセッション）:

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

モデルおよび思考オーバーライド付きの分離ジョブ:

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

Gateway は外部トリガー向けに HTTP Webhook エンドポイントを公開できます。設定で有効化します。

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

すべてのリクエストは、ヘッダー経由でフックトークンを含める必要があります。

- `Authorization: Bearer <token>`（推奨）
- `x-openclaw-token: <token>`

クエリ文字列のトークンは拒否されます。

### POST /hooks/wake

メインセッション向けにシステムイベントをキューに入れます。

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
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
```

フィールド: `message`（必須）、`name`、`agentId`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`thinking`、`timeoutSeconds`。

### マップ済みフック（POST /hooks/\<name\>）

カスタムフック名は、設定内の `hooks.mappings` を通じて解決されます。マッピングは、テンプレートまたはコード変換により、任意のペイロードを `wake` または `agent` アクションへ変換できます。

### セキュリティ

- フックエンドポイントは loopback、tailnet、または信頼できるリバースプロキシの背後に置いてください。
- 専用のフックトークンを使ってください。Gateway 認証トークンを再利用しないでください。
- `hooks.path` は専用のサブパスにしてください。`/` は拒否されます。
- 明示的な `agentId` ルーティングを制限するには `hooks.allowedAgentIds` を設定してください。
- 呼び出し元がセッションを選択する必要がない限り、`hooks.allowRequestSessionKey=false` を維持してください。
- `hooks.allowRequestSessionKey` を有効にする場合は、許可するセッションキー形状を制約するために `hooks.allowedSessionKeyPrefixes` も設定してください。
- フックペイロードはデフォルトで安全境界によってラップされます。

## Gmail PubSub 統合

Google PubSub を介して Gmail 受信トリガーを OpenClaw に接続します。

**前提条件**: `gcloud` CLI、`gog`（gogcli）、OpenClaw hooks が有効、公開 HTTPS エンドポイント用の Tailscale。

### ウィザードによるセットアップ（推奨）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

これにより `hooks.gmail` 設定が書き込まれ、Gmail プリセットが有効になり、プッシュエンドポイントには Tailscale Funnel が使用されます。

### Gateway 自動起動

`hooks.enabled=true` かつ `hooks.gmail.account` が設定されている場合、Gateway は起動時に `gog gmail watch serve` を開始し、watch を自動更新します。無効化するには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定してください。

### 手動の初回セットアップ

1. `gog` で使われる OAuth クライアントを所有する GCP プロジェクトを選択します。

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. トピックを作成し、Gmail にプッシュアクセスを付与します。

```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. watch を開始します:

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

### Gmail モデルオーバーライド

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

# 解決された配信ルートを含めて1つのジョブを表示
openclaw cron show <jobId>

# ジョブを編集
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# ジョブを今すぐ強制実行
openclaw cron run <jobId>

# 期限が来ている場合のみ実行
openclaw cron run <jobId> --due

# 実行履歴を表示
openclaw cron runs --id <jobId> --limit 50

# ジョブを削除
openclaw cron remove <jobId>

# エージェント選択（マルチエージェント構成）
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

モデルオーバーライドに関する注記:

- `openclaw cron add|edit --model ...` はジョブの選択済みモデルを変更します。
- モデルが許可されている場合、その正確なプロバイダ/モデルが分離エージェント実行に渡されます。
- 許可されていない場合、cron は警告を出し、ジョブのエージェント/デフォルトのモデル選択にフォールバックします。
- 設定されたフォールバックチェーンは引き続き適用されますが、明示的なジョブ単位フォールバックリストのない単純な `--model` オーバーライドは、サイレントな追加リトライ対象としてエージェントのプライマリにフォールスルーしなくなりました。

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

ランタイム状態のサイドカーは `cron.store` から導出されます。`~/clawd/cron/jobs.json` のような `.json` ストアは `~/clawd/cron/jobs-state.json` を使い、`.json` サフィックスのないストアパスは `-state.json` を追加します。

cron を無効にするには: `cron.enabled: false` または `OPENCLAW_SKIP_CRON=1`。

**1回限りの再試行**: 一時的なエラー（レート制限、過負荷、ネットワーク、サーバーエラー）は指数バックオフで最大 3 回まで再試行されます。恒久的なエラーは即座に無効化されます。

**定期実行の再試行**: 再試行の間に指数バックオフ（30 秒〜60 分）を使います。次回の成功実行後にバックオフはリセットされます。

**メンテナンス**: `cron.sessionRetention`（デフォルト `24h`）は分離された実行セッションエントリを削除します。`cron.runLog.maxBytes` / `cron.runLog.keepLines` は実行ログファイルを自動削除します。

## トラブルシューティング

### コマンドラダー

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
- Gateway が継続的に動作していることを確認してください。
- `cron` スケジュールの場合、タイムゾーン（`--tz`）とホストのタイムゾーンを確認してください。
- 実行出力の `reason: not-due` は、手動実行が `openclaw cron run <jobId> --due` で確認され、そのジョブの期限がまだ来ていなかったことを意味します。

### Cron は実行されたが配信されない

- 配信モード `none` は、ランナーによるフォールバック送信が想定されていないことを意味します。チャットルートが利用可能であれば、エージェントは引き続き `message` ツールで直接送信できます。
- 配信先の欠落/無効（`channel`/`to`）は、送信がスキップされたことを意味します。
- チャネル認証エラー（`unauthorized`、`Forbidden`）は、認証情報によって配信がブロックされたことを意味します。
- 分離実行がサイレントトークン（`NO_REPLY` / `no_reply`）だけを返した場合、OpenClaw は直接の送信配信を抑制し、フォールバックのキュー済み要約パスも抑制するため、チャットには何も投稿されません。
- エージェント自身がユーザーにメッセージを送る必要がある場合、そのジョブに利用可能なルート（以前のチャットがある `channel: "last"`、または明示的なチャネル/ターゲット）があることを確認してください。

### タイムゾーンの注意点

- `--tz` なしの cron は gateway ホストのタイムゾーンを使います。
- タイムゾーンなしの `at` スケジュールは UTC として扱われます。
- Heartbeat の `activeHours` は設定されたタイムゾーン解決を使います。

## 関連

- [自動化とタスク](/ja-JP/automation) — すべての自動化メカニズムの概要
- [バックグラウンドタスク](/ja-JP/automation/tasks) — cron 実行のタスク台帳
- [Heartbeat](/ja-JP/gateway/heartbeat) — 定期的なメインセッションターン
- [タイムゾーン](/ja-JP/concepts/timezone) — タイムゾーン設定

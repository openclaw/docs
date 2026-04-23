---
read_when:
    - バックグラウンドジョブまたはウェイクアップのスケジューリング
    - 外部トリガー（Webhook、Gmail）を OpenClaw に接続する
    - スケジュールされたタスクに Heartbeat と Cron のどちらを使うかを決める
summary: Gateway スケジューラ用のスケジュールされたジョブ、Webhook、Gmail PubSub トリガー
title: スケジュールされたタスク
x-i18n:
    generated_at: "2026-04-23T13:57:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: c9565b73efc151c991ee6a1029c887c35d8673736913ddc5cdcfae09a4652f86
    source_path: automation/cron-jobs.md
    workflow: 15
---

# スケジュールされたタスク（Cron）

Cron は Gateway に組み込まれたスケジューラです。ジョブを永続化し、適切なタイミングでエージェントを起動し、出力をチャットチャネルまたは Webhook エンドポイントに返すことができます。

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

## cron の仕組み

- Cron は **Gateway プロセス内** で動作します（モデル内ではありません）。
- ジョブ定義は `~/.openclaw/cron/jobs.json` に永続化されるため、再起動してもスケジュールは失われません。
- 実行時の実行状態は、その隣の `~/.openclaw/cron/jobs-state.json` に永続化されます。cron 定義を git で管理する場合は、`jobs.json` を追跡し、`jobs-state.json` は gitignore に追加してください。
- 分割後も、古い OpenClaw バージョンは `jobs.json` を読み取れますが、実行時フィールドが `jobs-state.json` に移ったため、ジョブを新規として扱う場合があります。
- すべての cron 実行は [バックグラウンドタスク](/ja-JP/automation/tasks) レコードを作成します。
- 1 回限りのジョブ（`--at`）は、デフォルトで成功後に自動削除されます。
- 分離された cron 実行では、実行完了時にその `cron:<jobId>` セッション用に追跡されているブラウザタブやプロセスをベストエフォートで閉じるため、分離されたブラウザ自動化で孤立プロセスが残るのを防ぎます。
- 分離された cron 実行では、古い確認応答も防止します。最初の結果が単なる中間ステータス更新（`on it`、`pulling everything together` などのヒント）で、最終回答を担当する子孫サブエージェント実行が残っていない場合、OpenClaw は配信前に実際の結果を得るため一度だけ再プロンプトします。

<a id="maintenance"></a>

cron のタスク調整はランタイムが所有します。古い子セッション行がまだ存在していても、cron ランタイムがそのジョブを実行中として追跡している間は、アクティブな cron タスクは有効なままです。ランタイムがそのジョブを所有しなくなり、5 分間の猶予期間が過ぎると、メンテナンスによってそのタスクは `lost` とマークされる場合があります。

## スケジュールの種類

| 種類    | CLI フラグ | 説明                                                    |
| ------- | ---------- | ------------------------------------------------------- |
| `at`    | `--at`     | 1 回限りのタイムスタンプ（ISO 8601 または `20m` のような相対指定） |
| `every` | `--every`  | 固定間隔                                                |
| `cron`  | `--cron`   | オプションの `--tz` を伴う 5 フィールドまたは 6 フィールドの cron 式 |

タイムゾーンのないタイムスタンプは UTC として扱われます。ローカル壁時計ベースのスケジューリングには `--tz America/New_York` を追加してください。

毎時ちょうどに実行される定期式は、負荷スパイクを減らすため自動的に最大 5 分までずらされます。正確な時刻を強制するには `--exact` を、明示的なウィンドウを指定するには `--stagger 30s` を使ってください。

### 日付指定と曜日指定は OR ロジックを使います

Cron 式は [croner](https://github.com/Hexagon/croner) で解析されます。日付指定フィールドと曜日指定フィールドの両方がワイルドカードでない場合、croner は **どちらか** のフィールドが一致したときに一致とみなします。両方ではありません。これは標準的な Vixie cron の挙動です。

```
# 意図:   「毎月 15 日の午前 9 時、ただし月曜日の場合のみ」
# 実際:   「毎月 15 日の午前 9 時、かつ毎週月曜日の午前 9 時」
0 9 15 * 1
```

これは月 0〜1 回ではなく、月に約 5〜6 回実行されます。OpenClaw はここで Croner のデフォルト OR 動作を使います。両方の条件を必須にするには、Croner の `+` 曜日修飾子（`0 9 15 * +1`）を使うか、片方のフィールドだけでスケジュールし、もう片方はジョブのプロンプトまたはコマンド内でガードしてください。

## 実行スタイル

| スタイル        | `--session` 値      | 実行場所                 | 最適な用途                      |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| メインセッション | `main`              | 次の Heartbeat ターン     | リマインダー、システムイベント |
| 分離             | `isolated`          | 専用の `cron:<jobId>`     | レポート、バックグラウンド作業 |
| 現在のセッション | `current`           | 作成時にバインド         | コンテキスト依存の定期作業     |
| カスタムセッション | `session:custom-id` | 永続的な名前付きセッション | 履歴を積み上げるワークフロー   |

**メインセッション** ジョブはシステムイベントをキューに入れ、必要に応じて Heartbeat を起動します（`--wake now` または `--wake next-heartbeat`）。**分離** ジョブは、新しいセッションで専用のエージェントターンを実行します。**カスタムセッション**（`session:xxx`）は実行間でコンテキストを保持し、以前の要約を積み上げる毎日のスタンドアップのようなワークフローを可能にします。

分離ジョブでは、実行時の後始末にその cron セッション向けのベストエフォートなブラウザクリーンアップが含まれるようになりました。クリーンアップ失敗は無視されるため、実際の cron 結果が優先されます。

分離された cron 実行では、共有ランタイムクリーンアップパスを通じてそのジョブ用に作成されたバンドル済み MCP ランタイムインスタンスも破棄されます。これはメインセッションおよびカスタムセッションの MCP クライアントの破棄方法と一致しているため、分離された cron ジョブが stdio 子プロセスや長寿命の MCP 接続を実行間でリークすることはありません。

分離された cron 実行がサブエージェントをオーケストレーションする場合、配信では古い親の中間テキストよりも最終的な子孫出力を優先します。子孫がまだ実行中の場合、OpenClaw はその部分的な親更新を通知せずに抑制します。

### 分離ジョブのペイロードオプション

- `--message`: プロンプトテキスト（分離では必須）
- `--model` / `--thinking`: モデルおよび thinking レベルの上書き
- `--light-context`: ワークスペースのブートストラップファイル注入をスキップ
- `--tools exec,read`: ジョブが使用できるツールを制限

`--model` は、そのジョブで選択された許可済みモデルを使用します。要求されたモデルが許可されていない場合、cron は警告を記録し、代わりにジョブのエージェント/デフォルトのモデル選択にフォールバックします。設定済みのフォールバックチェーンは引き続き適用されますが、明示的なジョブ単位のフォールバックリストがない単なるモデル上書きでは、エージェントのプライマリが隠れた追加再試行先として付加されることはなくなりました。

分離ジョブのモデル選択の優先順位は次のとおりです。

1. Gmail フックのモデル上書き（実行元が Gmail で、その上書きが許可されている場合）
2. ジョブ単位ペイロードの `model`
3. 保存された cron セッションのモデル上書き
4. エージェント/デフォルトのモデル選択

Fast mode も解決された live 選択に従います。選択されたモデル設定に `params.fastMode` がある場合、分離 cron はそれをデフォルトで使います。保存済みセッションの `fastMode` 上書きは、どちらの方向でも引き続き設定より優先されます。

分離実行が live のモデル切り替えハンドオフに達した場合、cron は切り替え先の provider/model で再試行し、その live 選択を再試行前に永続化します。切り替えに新しい認証プロファイルも含まれている場合、cron はその認証プロファイル上書きも永続化します。再試行回数には上限があります。初回試行に加えて 2 回の切り替え再試行後は、無限ループせずに中止します。

## 配信と出力

| モード     | 動作内容                                                          |
| ---------- | ----------------------------------------------------------------- |
| `announce` | エージェントが送信しなかった場合、最終テキストをターゲットにフォールバック配信 |
| `webhook`  | 完了イベントのペイロードを URL に POST                           |
| `none`     | ランナーによるフォールバック配信なし                             |

チャネル配信には `--announce --channel telegram --to "-1001234567890"` を使用します。Telegram のフォーラムトピックには `-1001234567890:topic:123` を使います。Slack/Discord/Mattermost のターゲットには明示的なプレフィックス（`channel:<id>`、`user:<id>`）を使う必要があります。

分離ジョブでは、チャット配信は共有されます。チャットルートが利用可能なら、ジョブが `--no-deliver` を使っていても、エージェントは `message` ツールを使えます。エージェントが設定済み/現在のターゲットに送信した場合、OpenClaw はフォールバックの announce をスキップします。それ以外では、`announce`、`webhook`、`none` は、エージェントターン後にランナーが最終応答をどう扱うかだけを制御します。

失敗通知は別の宛先経路に従います。

- `cron.failureDestination` は失敗通知のグローバルデフォルトを設定します。
- `job.delivery.failureDestination` はジョブ単位でそれを上書きします。
- どちらも設定されておらず、そのジョブがすでに `announce` で配信している場合、失敗通知はそのプライマリの announce ターゲットにフォールバックするようになりました。
- `delivery.failureDestination` は `sessionTarget="isolated"` のジョブでのみサポートされます。ただしプライマリ配信モードが `webhook` の場合は除きます。

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

配信付きの定期分離ジョブ:

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

モデルと thinking 上書きを持つ分離ジョブ:

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

Gateway は外部トリガー用に HTTP Webhook エンドポイントを公開できます。設定で有効化します。

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

メインセッションにシステムイベントをキューに入れます。

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

### マップされたフック（POST /hooks/\<name\>）

カスタムフック名は設定内の `hooks.mappings` を通じて解決されます。マッピングはテンプレートまたはコード変換を使って、任意のペイロードを `wake` または `agent` アクションに変換できます。

### セキュリティ

- フックエンドポイントは loopback、tailnet、または信頼できるリバースプロキシの背後に置いてください。
- 専用のフックトークンを使用し、gateway 認証トークンを使い回さないでください。
- `hooks.path` は専用のサブパスにしてください。`/` は拒否されます。
- 明示的な `agentId` ルーティングを制限するには `hooks.allowedAgentIds` を設定してください。
- 呼び出し元がセッションを選べる必要がない限り、`hooks.allowRequestSessionKey=false` のままにしてください。
- `hooks.allowRequestSessionKey` を有効にする場合は、許可されるセッションキー形状を制約するために `hooks.allowedSessionKeyPrefixes` も設定してください。
- フックのペイロードは、デフォルトで安全境界付きでラップされます。

## Gmail PubSub 連携

Google PubSub 経由で Gmail の受信トリガーを OpenClaw に接続します。

**前提条件**: `gcloud` CLI、`gog`（gogcli）、OpenClaw hooks の有効化、公開 HTTPS エンドポイント用の Tailscale。

### ウィザード設定（推奨）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

これにより `hooks.gmail` 設定が書き込まれ、Gmail プリセットが有効になり、プッシュエンドポイントに Tailscale Funnel が使われます。

### Gateway の自動起動

`hooks.enabled=true` かつ `hooks.gmail.account` が設定されている場合、Gateway は起動時に `gog gmail watch serve` を開始し、watch を自動更新します。無効化するには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定してください。

### 手動の 1 回限りセットアップ

1. `gog` が使用する OAuth クライアントを所有する GCP プロジェクトを選択します。

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. トピックを作成し、Gmail にプッシュ権限を付与します。

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

### Gmail のモデル上書き

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

# 解決された配信ルートを含め、1 つのジョブを表示
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

モデル上書きに関する注意:

- `openclaw cron add|edit --model ...` は、ジョブの選択モデルを変更します。
- モデルが許可されている場合、その正確な provider/model が分離されたエージェント実行に渡されます。
- 許可されていない場合、cron は警告を出し、ジョブのエージェント/デフォルトのモデル選択にフォールバックします。
- 設定済みのフォールバックチェーンは引き続き適用されますが、明示的なジョブ単位のフォールバックリストがない単なる `--model` 上書きでは、エージェントのプライマリに暗黙の追加再試行先としてフォールスルーしなくなりました。

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

ランタイム状態のサイドカーは `cron.store` から導出されます。たとえば `~/clawd/cron/jobs.json` のような `.json` ストアは `~/clawd/cron/jobs-state.json` を使い、`.json` 接尾辞のないストアパスには `-state.json` が追加されます。

cron を無効化するには: `cron.enabled: false` または `OPENCLAW_SKIP_CRON=1`。

**1 回限りジョブの再試行**: 一時的なエラー（レート制限、過負荷、ネットワーク、サーバーエラー）は指数バックオフで最大 3 回まで再試行されます。恒久的なエラーは直ちに無効化されます。

**定期ジョブの再試行**: 再試行の間に指数バックオフ（30 秒〜60 分）を使用します。次回の成功実行後にバックオフはリセットされます。

**メンテナンス**: `cron.sessionRetention`（デフォルト `24h`）は分離実行セッションのエントリを削除します。`cron.runLog.maxBytes` / `cron.runLog.keepLines` は実行ログファイルを自動的に削除します。

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
- Gateway が継続的に動作していることを確認してください。
- `cron` スケジュールでは、タイムゾーン（`--tz`）とホストのタイムゾーンの差異を確認してください。
- 実行出力の `reason: not-due` は、手動実行を `openclaw cron run <jobId> --due` で確認したが、ジョブの期限がまだ来ていなかったことを意味します。

### Cron は実行されたが配信されない

- 配信モード `none` は、ランナーによるフォールバック送信が行われないことを意味します。チャットルートが利用可能なら、エージェントは依然として `message` ツールで直接送信できます。
- 配信ターゲットが欠落または無効（`channel`/`to`）な場合、送信はスキップされます。
- チャネル認証エラー（`unauthorized`、`Forbidden`）は、資格情報によって配信がブロックされたことを意味します。
- 分離実行が無音トークン（`NO_REPLY` / `no_reply`）のみを返した場合、OpenClaw は直接の送信配信を抑制し、フォールバックのキュー要約経路も抑制するため、チャットには何も投稿されません。
- エージェントが自分でユーザーにメッセージを送るべき場合、そのジョブに使用可能なルート（前回のチャットを使う `channel: "last"`、または明示的なチャネル/ターゲット）があることを確認してください。

### タイムゾーンの注意点

- `--tz` なしの cron は gateway ホストのタイムゾーンを使用します。
- タイムゾーンなしの `at` スケジュールは UTC として扱われます。
- Heartbeat の `activeHours` は設定されたタイムゾーン解決を使用します。

## 関連

- [自動化とタスク](/ja-JP/automation) — すべての自動化メカニズムの概要
- [バックグラウンドタスク](/ja-JP/automation/tasks) — cron 実行のタスク台帳
- [Heartbeat](/ja-JP/gateway/heartbeat) — 定期的なメインセッションターン
- [タイムゾーン](/ja-JP/concepts/timezone) — タイムゾーン設定

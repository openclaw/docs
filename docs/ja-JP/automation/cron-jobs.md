---
read_when:
    - バックグラウンドジョブまたはウェイクアップのスケジュール設定
    - 外部トリガー（Webhook、Gmail）を OpenClaw に接続する
    - 定期実行タスクで Heartbeat と Cron のどちらを使うか判断する
summary: Gateway スケジューラの定期実行ジョブ、Webhook、Gmail PubSub トリガー
title: 定期実行タスク
x-i18n:
    generated_at: "2026-04-21T04:43:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: e25f4dc8ee7b8f88e22d5cbc86e4527a9f5ac0ab4921e7874f76b186054682a3
    source_path: automation/cron-jobs.md
    workflow: 15
---

# 定期実行タスク (Cron)

Cron は Gateway に組み込まれたスケジューラです。ジョブを永続化し、適切な時刻にエージェントを起動し、出力をチャットチャネルや Webhook エンドポイントに返すことができます。

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

# 実行履歴を表示
openclaw cron runs --id <job-id>
```

## cron の仕組み

- Cron は **Gateway 内部** で実行されます（モデル内部ではありません）。
- ジョブ定義は `~/.openclaw/cron/jobs.json` に永続化されるため、再起動してもスケジュールは失われません。
- 実行時の状態は隣接する `~/.openclaw/cron/jobs-state.json` に永続化されます。cron 定義を git で追跡する場合は、`jobs.json` を追跡し、`jobs-state.json` は gitignore に追加してください。
- 分離後、古い OpenClaw バージョンでも `jobs.json` は読み取れますが、実行時フィールドが `jobs-state.json` に移動したため、ジョブを新規として扱う場合があります。
- すべての cron 実行で [バックグラウンドタスク](/ja-JP/automation/tasks) レコードが作成されます。
- 1 回限りのジョブ (`--at`) は、デフォルトで成功後に自動削除されます。
- 分離された cron 実行では、実行完了時にその `cron:<jobId>` セッション用に追跡しているブラウザタブやプロセスをベストエフォートで終了するため、切り離されたブラウザ自動化が孤立プロセスを残しません。
- 分離された cron 実行では、古い確認応答の返信も防止されます。最初の結果が単なる中間ステータス更新（`on it`、`pulling everything together`、および同様のヒント）で、最終回答を担当する子孫 subagent 実行がまだ存在しない場合、OpenClaw は配信前に実際の結果を得るために 1 回再プロンプトします。

<a id="maintenance"></a>

cron のタスク照合は実行時に所有されます。古い子セッション行が残っていても、cron ランタイムがそのジョブを実行中として追跡している間は、アクティブな cron タスクは存続します。
ランタイムがそのジョブを所有しなくなり、5 分間の猶予期間が過ぎると、メンテナンスはそのタスクを `lost` としてマークできます。

## スケジュールの種類

| 種類    | CLI フラグ | 説明                                                    |
| ------- | ---------- | ------------------------------------------------------- |
| `at`    | `--at`     | 1 回限りのタイムスタンプ（ISO 8601 または `20m` のような相対指定） |
| `every` | `--every`  | 固定間隔                                                |
| `cron`  | `--cron`   | 任意の `--tz` を伴う 5 フィールドまたは 6 フィールドの cron 式 |

タイムゾーンのないタイムスタンプは UTC として扱われます。ローカルの壁時計時刻でスケジュールするには `--tz America/New_York` を追加してください。

毎時ちょうどの定期実行式は、負荷スパイクを減らすために自動的に最大 5 分まで分散されます。正確な時刻を強制するには `--exact` を使うか、明示的なウィンドウとして `--stagger 30s` を使ってください。

### 日付と曜日は OR ロジックを使う

cron 式は [croner](https://github.com/Hexagon/croner) によって解析されます。日付フィールドと曜日フィールドの両方がワイルドカードでない場合、croner は **どちらか** のフィールドが一致したときに一致します。両方ではありません。これは標準的な Vixie cron の動作です。

```
# 意図: 「15日の午前9時。ただし月曜日の場合のみ」
# 実際: 「毎月15日の午前9時、かつ毎週月曜日の午前9時」
0 9 15 * 1
```

これにより、月 0〜1 回ではなく、およそ月 5〜6 回実行されます。OpenClaw はここで Croner のデフォルト OR 動作を使用します。両方の条件を必須にするには、Croner の `+` 曜日修飾子（`0 9 15 * +1`）を使うか、一方のフィールドだけでスケジュールし、もう一方はジョブのプロンプトまたはコマンド内でガードしてください。

## 実行スタイル

| スタイル        | `--session` の値     | 実行場所                 | 最適な用途                      |
| --------------- | -------------------- | ------------------------ | ------------------------------- |
| メインセッション | `main`               | 次の Heartbeat ターン    | リマインダー、システムイベント |
| 分離            | `isolated`           | 専用の `cron:<jobId>`    | レポート、バックグラウンド作業 |
| 現在のセッション | `current`            | 作成時点でバインド       | コンテキスト依存の定期作業     |
| カスタムセッション | `session:custom-id` | 永続的な名前付きセッション | 履歴を積み上げるワークフロー |

**メインセッション** ジョブはシステムイベントをキューに入れ、必要に応じて heartbeat を起動します（`--wake now` または `--wake next-heartbeat`）。**分離** ジョブは、新しいセッションで専用のエージェントターンを実行します。**カスタムセッション**（`session:xxx`）は実行間でコンテキストを保持するため、以前の要約をもとに積み上げる日次スタンドアップのようなワークフローを実現できます。

分離ジョブでは、実行時の後処理にその cron セッション向けのベストエフォートのブラウザクリーンアップも含まれるようになりました。クリーンアップ失敗は無視されるため、実際の cron 結果が優先されます。

分離された cron 実行が subagent をオーケストレーションする場合、配信でも古い親の中間テキストより最終的な子孫出力が優先されます。子孫がまだ実行中なら、OpenClaw はその部分的な親更新を通知せず抑止します。

### 分離ジョブのペイロードオプション

- `--message`: プロンプトテキスト（分離では必須）
- `--model` / `--thinking`: モデルおよび thinking レベルの上書き
- `--light-context`: ワークスペースのブートストラップファイル注入をスキップ
- `--tools exec,read`: ジョブが使えるツールを制限

`--model` は、そのジョブで選択された許可済みモデルを使用します。要求したモデルが許可されていない場合、cron は警告をログに記録し、そのジョブのエージェント/デフォルトのモデル選択にフォールバックします。設定済みのフォールバックチェーンは引き続き適用されますが、明示的なジョブ単位フォールバックリストがない単純なモデル上書きでは、エージェントのプライマリが隠れた追加リトライ先として付加されなくなりました。

分離ジョブのモデル選択優先順位は次のとおりです。

1. Gmail hook のモデル上書き（実行が Gmail 由来で、その上書きが許可されている場合）
2. ジョブ単位ペイロードの `model`
3. 保存済み cron セッションのモデル上書き
4. エージェント/デフォルトのモデル選択

fast mode も解決後の live 選択に従います。選択されたモデル設定に `params.fastMode` がある場合、分離 cron はデフォルトでそれを使います。保存済みセッションの `fastMode` 上書きは、どちらの方向でも引き続き設定より優先されます。

分離実行中に live のモデル切り替えハンドオフが発生した場合、cron は切り替え後の provider/model で再試行し、その live 選択を再試行前に永続化します。切り替えに新しい auth profile も含まれている場合、cron はその auth profile 上書きも永続化します。再試行回数には上限があります。初回試行に加えて 2 回の切り替え再試行の後は、無限ループする代わりに cron は中止します。

## 配信と出力

| モード      | 動作                                                     |
| ----------- | -------------------------------------------------------- |
| `announce`  | ターゲットチャネルに要約を配信（分離のデフォルト）       |
| `webhook`   | 完了イベントのペイロードを URL に POST                   |
| `none`      | 内部のみで、配信なし                                     |

チャネル配信には `--announce --channel telegram --to "-1001234567890"` を使ってください。Telegram のフォーラムトピックでは `-1001234567890:topic:123` を使います。Slack/Discord/Mattermost のターゲットでは、明示的なプレフィックス（`channel:<id>`、`user:<id>`）を使ってください。

cron 所有の分離ジョブでは、runner が最終配信経路を所有します。エージェントにはプレーンテキストの要約を返すようプロンプトされ、その要約が `announce`、`webhook` を通じて送信されるか、`none` の場合は内部のまま保持されます。`--no-deliver` は配信をエージェントに戻しません。実行を内部専用のままにします。

元のタスクで外部の受信者にメッセージを送ることが明示されている場合、エージェントはそのメッセージを直接送ろうとせず、誰にどこへ送るべきかを出力内に記載する必要があります。

失敗通知は別の宛先経路に従います。

- `cron.failureDestination` は失敗通知のグローバルなデフォルトを設定します。
- `job.delivery.failureDestination` はジョブ単位でそれを上書きします。
- どちらも設定されておらず、ジョブがすでに `announce` で配信している場合、失敗通知はそのプライマリの announce ターゲットにフォールバックします。
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

モデルおよび thinking 上書き付きの分離ジョブ:

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

すべてのリクエストには、ヘッダー経由で hook token を含める必要があります。

- `Authorization: Bearer <token>`（推奨）
- `x-openclaw-token: <token>`

クエリ文字列のトークンは拒否されます。

### POST /hooks/wake

メインセッションにシステムイベントをキューします。

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

### Mapped hooks (POST /hooks/\<name\>)

カスタム hook 名は、設定の `hooks.mappings` を通じて解決されます。mapping はテンプレートまたはコード変換によって、任意のペイロードを `wake` または `agent` アクションに変換できます。

### セキュリティ

- hook エンドポイントは loopback、tailnet、または信頼できるリバースプロキシの背後に置いてください。
- hook 専用の token を使用し、gateway auth token を再利用しないでください。
- `hooks.path` は専用のサブパスにしてください。`/` は拒否されます。
- 明示的な `agentId` ルーティングを制限するには `hooks.allowedAgentIds` を設定してください。
- 呼び出し元がセッションを選択する必要がない限り、`hooks.allowRequestSessionKey=false` のままにしてください。
- `hooks.allowRequestSessionKey` を有効にする場合は、許可される session key の形を制約するために `hooks.allowedSessionKeyPrefixes` も設定してください。
- hook のペイロードはデフォルトで安全境界によってラップされます。

## Gmail PubSub 統合

Google PubSub を介して Gmail の受信トリガーを OpenClaw に接続します。

**前提条件**: `gcloud` CLI、`gog`（gogcli）、OpenClaw hooks の有効化、公開 HTTPS エンドポイント用の Tailscale。

### ウィザード設定（推奨）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

これにより `hooks.gmail` 設定が書き込まれ、Gmail preset が有効化され、push エンドポイントに Tailscale Funnel が使われます。

### Gateway の自動起動

`hooks.enabled=true` かつ `hooks.gmail.account` が設定されていると、Gateway は起動時に `gog gmail watch serve` を開始し、watch を自動更新します。無効にするには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定してください。

### 手動の 1 回限りセットアップ

1. `gog` が使用する OAuth client を所有する GCP project を選択します。

```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. topic を作成し、Gmail に push アクセスを付与します。

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

- `openclaw cron add|edit --model ...` は、ジョブで選択されたモデルを変更します。
- モデルが許可されている場合、その正確な provider/model が分離されたエージェント実行に渡されます。
- 許可されていない場合、cron は警告を出し、そのジョブのエージェント/デフォルトのモデル選択にフォールバックします。
- 設定されたフォールバックチェーンは引き続き適用されますが、明示的なジョブ単位フォールバックリストのない単純な `--model` 上書きは、サイレントな追加リトライ先としてエージェントのプライマリにフォールスルーしなくなりました。

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

ランタイム状態のサイドカーは `cron.store` から導出されます。たとえば `~/clawd/cron/jobs.json` のような `.json` ストアは `~/clawd/cron/jobs-state.json` を使用し、`.json` 接尾辞のないストアパスには `-state.json` が追加されます。

cron を無効化するには: `cron.enabled: false` または `OPENCLAW_SKIP_CRON=1`。

**1 回限りのリトライ**: 一時的なエラー（rate limit、overload、network、server error）は指数バックオフで最大 3 回まで再試行されます。永続的なエラーは即座に無効化されます。

**定期実行のリトライ**: 再試行の間に指数バックオフ（30 秒〜60 分）を使います。次回の成功実行後にバックオフはリセットされます。

**メンテナンス**: `cron.sessionRetention`（デフォルト `24h`）は分離された実行セッションのエントリを削除します。`cron.runLog.maxBytes` / `cron.runLog.keepLines` は実行ログファイルを自動的に削除します。

## トラブルシューティング

### コマンドの確認順

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
- `cron` スケジュールでは、タイムゾーン（`--tz`）とホストのタイムゾーンを確認してください。
- 実行出力の `reason: not-due` は、手動実行が `openclaw cron run <jobId> --due` で確認され、そのジョブの期限がまだ来ていなかったことを意味します。

### Cron は実行されたが配信されない

- 配信モードが `none` の場合、外部メッセージは想定されません。
- 配信先が欠落または無効（`channel`/`to`）の場合、送信はスキップされます。
- チャネル認証エラー（`unauthorized`、`Forbidden`）は、資格情報によって配信がブロックされたことを意味します。
- 分離実行がサイレントトークン（`NO_REPLY` / `no_reply`）だけを返した場合、OpenClaw は直接の外部配信を抑止し、フォールバックのキュー済み要約経路も抑止するため、チャットには何も投稿されません。
- cron 所有の分離ジョブでは、フォールバックとしてエージェントが message tool を使うことを期待しないでください。runner が最終配信を所有します。`--no-deliver` は、直接送信を許可する代わりに内部のまま保持します。

### タイムゾーンの注意点

- `--tz` のない Cron は gateway ホストのタイムゾーンを使用します。
- タイムゾーンのない `at` スケジュールは UTC として扱われます。
- Heartbeat の `activeHours` は設定されたタイムゾーン解決を使用します。

## 関連

- [自動化とタスク](/ja-JP/automation) — すべての自動化メカニズムの概要
- [バックグラウンドタスク](/ja-JP/automation/tasks) — cron 実行のタスク台帳
- [Heartbeat](/ja-JP/gateway/heartbeat) — 定期的なメインセッションターン
- [タイムゾーン](/ja-JP/concepts/timezone) — タイムゾーン設定

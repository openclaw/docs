---
read_when:
    - バックグラウンドジョブまたはウェイクアップのスケジュール設定
    - 外部トリガー（Webhook、Gmail）をOpenClawに接続すること
    - スケジュールされたタスクに Heartbeat と Cron のどちらを使うかを決めること
sidebarTitle: Scheduled tasks
summary: Gatewayスケジューラ用のスケジュール済みジョブ、Webhook、Gmail PubSubトリガー
title: スケジュールされたタスク
x-i18n:
    generated_at: "2026-04-26T11:23:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 41908a34ddec3359e414ff4fbca128cc30db53273ee96a6dd12026da950b95ec
    source_path: automation/cron-jobs.md
    workflow: 15
---

Cron は Gateway に組み込まれたスケジューラです。ジョブを永続化し、適切なタイミングでエージェントを起動し、出力をチャットチャネルや Webhook エンドポイントに返すことができます。

## クイックスタート

<Steps>
  <Step title="単発のリマインダーを追加する">
    ```bash
    openclaw cron add \
      --name "Reminder" \
      --at "2026-02-01T16:00:00Z" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="ジョブを確認する">
    ```bash
    openclaw cron list
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="実行履歴を確認する">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Cron の動作

- Cron は **Gateway プロセス内** で実行されます（モデル内ではありません）。
- ジョブ定義は `~/.openclaw/cron/jobs.json` に永続化されるため、再起動してもスケジュールは失われません。
- ランタイム実行状態はその隣の `~/.openclaw/cron/jobs-state.json` に永続化されます。Cron 定義を git で管理する場合は、`jobs.json` を追跡し、`jobs-state.json` は gitignore に追加してください。
- 分離後、古い OpenClaw バージョンでも `jobs.json` を読み取れますが、ランタイムフィールドが `jobs-state.json` に移動したため、ジョブを新規として扱う可能性があります。
- すべての Cron 実行で [バックグラウンドタスク](/ja-JP/automation/tasks) のレコードが作成されます。
- 単発ジョブ（`--at`）は、デフォルトで成功後に自動削除されます。
- 分離された Cron 実行では、実行完了時に、その `cron:<jobId>` セッションで追跡されているブラウザタブやプロセスをベストエフォートで閉じるため、切り離されたブラウザ自動化で孤立プロセスが残りません。
- 分離された Cron 実行では、古い確認応答の返信も防止されます。最初の結果が単なる中間ステータス更新（`on it`、`pulling everything together` などのヒント）であり、最終回答に対して引き続き責任を持つ子孫サブエージェント実行が存在しない場合、OpenClaw は配信前に実際の結果を得るために一度だけ再プロンプトします。

<a id="maintenance"></a>

<Note>
Cron のタスク照合は、まずランタイム所有、次に永続履歴に基づいて行われます。古い子セッション行がまだ存在していても、Cron ランタイムがそのジョブを実行中として追跡している間は、アクティブな Cron タスクは存続します。ランタイムがジョブの所有を停止し、5 分の猶予期間が過ぎると、メンテナンスチェックは、対応する `cron:<jobId>:<startedAt>` 実行について、永続化された実行ログとジョブ状態を確認します。その永続履歴に終了結果があれば、タスク台帳はそこから確定されます。なければ、Gateway 所有のメンテナンスでタスクを `lost` とマークできます。オフライン CLI 監査では永続履歴から復旧できますが、自身のインプロセスのアクティブジョブ集合が空であることを、Gateway 所有の Cron 実行が消えた証拠とは見なしません。
</Note>

## スケジュールの種類

| 種類    | CLI フラグ | 説明                                                      |
| ------- | ---------- | --------------------------------------------------------- |
| `at`    | `--at`     | 単発タイムスタンプ（ISO 8601 または `20m` のような相対指定） |
| `every` | `--every`  | 固定間隔                                                  |
| `cron`  | `--cron`   | 5 フィールドまたは 6 フィールドの cron 式。任意で `--tz` を指定可能 |

タイムゾーンのないタイムスタンプは UTC として扱われます。ローカルの壁時計時刻でスケジュールするには `--tz America/New_York` を追加してください。

毎時ちょうどの繰り返し式は、負荷スパイクを減らすために最大 5 分まで自動的にずらされます。正確な時刻を強制するには `--exact` を使うか、明示的なウィンドウとして `--stagger 30s` を指定してください。

### 日と曜日は OR ロジックを使います

Cron 式は [croner](https://github.com/Hexagon/croner) によって解析されます。日フィールドと曜日フィールドの両方がワイルドカード以外の場合、croner は **どちらか** のフィールドが一致したときに一致とみなします。両方ではありません。これは標準的な Vixie cron の動作です。

```
# 意図: 「15日の午前9時、ただし月曜日の場合のみ」
# 実際: 「毎月15日の午前9時、かつ毎週月曜日の午前9時」
0 9 15 * 1
```

これは月 0〜1 回ではなく、およそ月 5〜6 回実行されます。OpenClaw はここで Croner のデフォルト OR 動作を使用します。両方の条件を必須にするには、Croner の `+` 曜日修飾子（`0 9 15 * +1`）を使うか、片方のフィールドだけでスケジュールし、もう片方はジョブのプロンプトまたはコマンド内でガードしてください。

## 実行スタイル

| スタイル        | `--session` の値    | 実行場所                 | 最適な用途                     |
| --------------- | ------------------- | ------------------------ | ------------------------------ |
| メインセッション | `main`              | 次の Heartbeat ターン     | リマインダー、システムイベント |
| 分離            | `isolated`          | 専用の `cron:<jobId>`    | レポート、バックグラウンド作業 |
| 現在のセッション | `current`           | 作成時点でバインド       | コンテキストを意識した定期作業 |
| カスタムセッション | `session:custom-id` | 永続的な名前付きセッション | 履歴を積み上げるワークフロー   |

<AccordionGroup>
  <Accordion title="メインセッション、分離、カスタムの違い">
    **メインセッション** ジョブはシステムイベントをキューに入れ、必要に応じて Heartbeat を起動します（`--wake now` または `--wake next-heartbeat`）。これらのシステムイベントは、対象セッションの日次/アイドルリセットの鮮度を延長しません。**分離** ジョブは、新しいセッションで専用のエージェントターンを実行します。**カスタムセッション**（`session:xxx`）は実行をまたいでコンテキストを保持するため、過去の要約を積み上げる日次スタンドアップのようなワークフローを実現できます。
  </Accordion>
  <Accordion title="分離ジョブにおける「新しいセッション」の意味">
    分離ジョブにおいて「新しいセッション」とは、各実行ごとに新しい transcript/session id が使われることを意味します。OpenClaw は thinking/fast/verbose 設定、ラベル、ユーザーが明示的に選択した model/auth のオーバーライドなどの安全な設定は引き継ぐことがありますが、古い Cron 行から周囲の会話コンテキストは引き継ぎません。たとえば、チャネル/グループのルーティング、送信またはキューポリシー、権限昇格、origin、ACP ランタイムバインディングなどです。定期ジョブで意図的に同じ会話コンテキストを積み上げたい場合は、`current` または `session:<id>` を使ってください。
  </Accordion>
  <Accordion title="ランタイムクリーンアップ">
    分離ジョブでは、ランタイムの終了処理にその Cron セッションのブラウザクリーンアップがベストエフォートで含まれます。クリーンアップの失敗は無視されるため、実際の Cron 結果が優先されます。

    分離された Cron 実行では、共有のランタイムクリーンアップ経路を通じて、そのジョブ用に作成されたバンドル済み MCP ランタイムインスタンスも破棄されます。これはメインセッションおよびカスタムセッションの MCP クライアントの終了方法と一致しているため、分離された Cron ジョブで stdio 子プロセスや長寿命の MCP 接続が実行をまたいでリークしません。

  </Accordion>
  <Accordion title="サブエージェントと Discord への配信">
    分離された Cron 実行がサブエージェントをオーケストレーションする場合、配信では古い親の中間テキストよりも最終的な子孫出力が優先されます。子孫がまだ実行中であれば、OpenClaw はその部分的な親更新を通知せず抑制します。

    テキストのみの Discord 通知先では、OpenClaw はストリーミング/中間テキストのペイロードと最終回答の両方を再生するのではなく、標準の最終アシスタントテキストを一度だけ送信します。メディアおよび構造化された Discord ペイロードは、添付ファイルやコンポーネントが失われないよう、引き続き別個のペイロードとして配信されます。

  </Accordion>
</AccordionGroup>

### 分離ジョブのペイロードオプション

<ParamField path="--message" type="string" required>
  プロンプトテキスト（分離では必須）。
</ParamField>
<ParamField path="--model" type="string">
  Model オーバーライド。ジョブ用に選択された許可済み model を使用します。
</ParamField>
<ParamField path="--thinking" type="string">
  Thinking レベルのオーバーライド。
</ParamField>
<ParamField path="--light-context" type="boolean">
  ワークスペースのブートストラップファイル注入をスキップします。
</ParamField>
<ParamField path="--tools" type="string">
  ジョブが使用できるツールを制限します。たとえば `--tools exec,read`。
</ParamField>

`--model` は、そのジョブ用に選択された許可済み model を使用します。要求された model が許可されていない場合、Cron は警告を記録し、代わりにそのジョブの agent/default model 選択にフォールバックします。設定済みのフォールバックチェーンは引き続き適用されますが、ジョブごとの明示的なフォールバックリストがない単純な model オーバーライドでは、隠れた追加の再試行先として agent primary が追加されなくなりました。

分離ジョブの model 選択優先順位は次のとおりです。

1. Gmail フックの model オーバーライド（実行が Gmail から来ていて、そのオーバーライドが許可されている場合）
2. ジョブごとのペイロード `model`
3. ユーザーが選択した保存済み Cron セッションの model オーバーライド
4. agent/default model 選択

Fast mode も解決済みのライブ選択に従います。選択された model config に `params.fastMode` がある場合、分離された Cron はデフォルトでそれを使用します。保存済みセッションの `fastMode` オーバーライドは、どちらの方向でも config より優先されます。

分離実行でライブの model-switch ハンドオフが発生した場合、Cron は切り替え後の provider/model で再試行し、そのライブ選択を再試行前にアクティブな実行へ永続化します。切り替えに新しい auth profile も含まれている場合、Cron はその auth profile オーバーライドもアクティブな実行へ永続化します。再試行には上限があり、初回試行に加えて 2 回の switch 再試行の後、Cron は無限ループせず中止します。

## 配信と出力

| モード     | 動作                                                                |
| ---------- | ------------------------------------------------------------------- |
| `announce` | エージェントが送信しなかった場合、対象へ最終テキストをフォールバック配信する |
| `webhook`  | 完了したイベントのペイロードを URL に POST する                     |
| `none`     | ランナーによるフォールバック配信を行わない                          |

チャネル配信には `--announce --channel telegram --to "-1001234567890"` を使います。Telegram のフォーラムトピックでは `-1001234567890:topic:123` を使ってください。Slack/Discord/Mattermost の対象では明示的な接頭辞（`channel:<id>`、`user:<id>`）を使用してください。Matrix の room ID は大文字小文字を区別するため、正確な room ID または Matrix の `room:!room:server` 形式を使用してください。

分離ジョブでは、チャット配信は共有されます。チャットルートが利用可能であれば、ジョブで `--no-deliver` を使っていても、エージェントは `message` ツールを使用できます。エージェントが設定済み/現在の対象に送信した場合、OpenClaw はフォールバック通知をスキップします。そうでない場合、`announce`、`webhook`、`none` は、エージェントターンの後でランナーが最終返信をどう扱うかだけを制御します。

エージェントがアクティブなチャットから分離されたリマインダーを作成すると、OpenClaw はフォールバック通知ルート用に保持されたライブ配信対象を保存します。内部セッションキーは小文字の場合がありますが、現在のチャットコンテキストが利用可能なとき、provider 配信対象はそれらのキーから再構成されません。

失敗通知は別の送信先パスに従います。

- `cron.failureDestination` は失敗通知のグローバルデフォルトを設定します。
- `job.delivery.failureDestination` はジョブごとにそれを上書きします。
- どちらも設定されておらず、ジョブがすでに `announce` で配信している場合、失敗通知はその主通知先にフォールバックするようになりました。
- `delivery.failureDestination` は、主配信モードが `webhook` の場合を除き、`sessionTarget="isolated"` ジョブでのみサポートされます。

## CLI の例

<Tabs>
  <Tab title="単発のリマインダー">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="定期的な分離ジョブ">
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
  </Tab>
  <Tab title="Model と Thinking のオーバーライド">
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
  </Tab>
</Tabs>

## Webhook

Gateway は外部トリガー向けに HTTP Webhook エンドポイントを公開できます。config で有効化します。

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

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    メインセッションのシステムイベントをキューに追加します。

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      イベントの説明。
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` または `next-heartbeat`。
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    分離されたエージェントターンを実行します。

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    フィールド: `message`（必須）、`name`、`agentId`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`thinking`、`timeoutSeconds`。

  </Accordion>
  <Accordion title="マッピングされたフック（POST /hooks/<name>）">
    カスタムフック名は、config 内の `hooks.mappings` を通じて解決されます。マッピングでは、テンプレートまたはコード変換を使って任意のペイロードを `wake` または `agent` アクションに変換できます。
  </Accordion>
</AccordionGroup>

<Warning>
フックエンドポイントは loopback、tailnet、または信頼できるリバースプロキシの背後に置いてください。

- 専用のフックトークンを使ってください。Gateway 認証トークンを使い回さないでください。
- `hooks.path` は専用のサブパスに設定してください。`/` は拒否されます。
- 明示的な `agentId` ルーティングを制限するには `hooks.allowedAgentIds` を設定してください。
- 呼び出し元がセッションを選択する必要がない限り、`hooks.allowRequestSessionKey=false` のままにしてください。
- `hooks.allowRequestSessionKey` を有効にする場合は、許可されるセッションキーの形式を制約するために `hooks.allowedSessionKeyPrefixes` も設定してください。
- フックのペイロードはデフォルトで安全境界に包まれます。

</Warning>

## Gmail PubSub 統合

Google PubSub を通じて Gmail 受信トリガーを OpenClaw に接続します。

<Note>
**前提条件:** `gcloud` CLI、`gog`（gogcli）、有効化された OpenClaw hooks、公開 HTTPS エンドポイント用の Tailscale。
</Note>

### ウィザード設定（推奨）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

これにより `hooks.gmail` config が書き込まれ、Gmail プリセットが有効化され、プッシュエンドポイントに Tailscale Funnel が使われます。

### Gateway の自動起動

`hooks.enabled=true` かつ `hooks.gmail.account` が設定されている場合、Gateway は起動時に `gog gmail watch serve` を開始し、watch を自動更新します。オプトアウトするには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定してください。

### 手動の初回設定

<Steps>
  <Step title="GCP プロジェクトを選択する">
    `gog` が使用する OAuth クライアントを所有する GCP プロジェクトを選択します。

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="トピックを作成し、Gmail に push アクセスを付与する">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="watch を開始する">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Gmail の model オーバーライド

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

# 解決済みの配信ルートを含む 1 つのジョブを表示
openclaw cron show <jobId>

# ジョブを編集
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# ジョブを今すぐ強制実行
openclaw cron run <jobId>

# 期限到来時のみ実行
openclaw cron run <jobId> --due

# 実行履歴を表示
openclaw cron runs --id <jobId> --limit 50

# ジョブを削除
openclaw cron remove <jobId>

# エージェント選択（マルチエージェント構成）
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

<Note>
Model オーバーライドに関する注記:

- `openclaw cron add|edit --model ...` はジョブの選択された model を変更します。
- その model が許可されていれば、その正確な provider/model が分離されたエージェント実行に渡されます。
- 許可されていなければ、Cron は警告を出し、そのジョブの agent/default model 選択にフォールバックします。
- 設定済みのフォールバックチェーンは引き続き適用されますが、ジョブごとの明示的なフォールバックリストがない単純な `--model` オーバーライドでは、agent primary への暗黙の追加再試行先フォールバックは行われなくなりました。

</Note>

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

ランタイム状態の sidecar は `cron.store` から導出されます。たとえば `~/clawd/cron/jobs.json` のような `.json` ストアでは `~/clawd/cron/jobs-state.json` が使われ、`.json` 接尾辞のないストアパスでは `-state.json` が追加されます。

Cron を無効化するには: `cron.enabled: false` または `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="再試行動作">
    **単発の再試行**: 一時的なエラー（レート制限、過負荷、ネットワーク、サーバーエラー）は指数バックオフで最大 3 回まで再試行されます。恒久的なエラーは即座に無効化されます。

    **定期実行の再試行**: 再試行の間に指数バックオフ（30 秒〜 60 分）を使います。次回成功した実行後にバックオフはリセットされます。

  </Accordion>
  <Accordion title="メンテナンス">
    `cron.sessionRetention`（デフォルトは `24h`）は分離された実行セッションのエントリを削除します。`cron.runLog.maxBytes` / `cron.runLog.keepLines` は実行ログファイルを自動的に削除します。
  </Accordion>
</AccordionGroup>

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

<AccordionGroup>
  <Accordion title="Cron が発火しない">
    - `cron.enabled` と `OPENCLAW_SKIP_CRON` 環境変数を確認してください。
    - Gateway が継続して実行されていることを確認してください。
    - `cron` スケジュールでは、タイムゾーン（`--tz`）とホストのタイムゾーンの違いを確認してください。
    - 実行出力の `reason: not-due` は、手動実行が `openclaw cron run <jobId> --due` で確認され、その時点ではジョブがまだ期限前だったことを意味します。

  </Accordion>
  <Accordion title="Cron は発火したが配信されない">
    - 配信モード `none` は、ランナーによるフォールバック送信が想定されないことを意味します。チャットルートが利用可能な場合、エージェントは引き続き `message` ツールで直接送信できます。
    - 配信対象が欠落または無効（`channel`/`to`）の場合、送信はスキップされます。
    - Matrix では、コピーまたはレガシージョブで `delivery.to` の room ID が小文字化されていると、Matrix の room ID は大文字小文字を区別するため失敗することがあります。ジョブを Matrix の正確な `!room:server` または `room:!room:server` の値に編集してください。
    - チャネル認証エラー（`unauthorized`、`Forbidden`）は、認証情報によって配信がブロックされたことを意味します。
    - 分離実行がサイレントトークン（`NO_REPLY` / `no_reply`）だけを返した場合、OpenClaw は直接の送信配信を抑制し、フォールバックのキュー済み要約経路も抑制するため、チャットには何も投稿されません。
    - エージェント自身がユーザーにメッセージを送るべき場合は、そのジョブに利用可能なルート（前回のチャットがある `channel: "last"`、または明示的なチャネル/対象）があることを確認してください。

  </Accordion>
  <Accordion title="Cron または Heartbeat によって /new スタイルのロールオーバーが妨げられているように見える">
    - 日次およびアイドルリセットの鮮度は `updatedAt` に基づきません。[セッション管理](/ja-JP/concepts/session#session-lifecycle) を参照してください。
    - Cron のウェイクアップ、Heartbeat 実行、exec 通知、Gateway の台帳処理によって、ルーティングや状態のためにセッション行が更新されることはありますが、`sessionStartedAt` や `lastInteractionAt` は延長されません。
    - それらのフィールドが存在する前に作成されたレガシー行については、ファイルがまだ利用可能であれば、OpenClaw は transcript JSONL セッションヘッダーから `sessionStartedAt` を復元できます。`lastInteractionAt` を持たないレガシーなアイドル行では、その復元された開始時刻がアイドル基準として使われます。

  </Accordion>
  <Accordion title="タイムゾーンの注意点">
    - `--tz` のない Cron は Gateway ホストのタイムゾーンを使用します。
    - タイムゾーンのない `at` スケジュールは UTC として扱われます。
    - Heartbeat の `activeHours` は設定されたタイムゾーン解決を使用します。

  </Accordion>
</AccordionGroup>

## 関連

- [自動化とタスク](/ja-JP/automation) — すべての自動化メカニズムの概要
- [バックグラウンドタスク](/ja-JP/automation/tasks) — Cron 実行のタスク台帳
- [Heartbeat](/ja-JP/gateway/heartbeat) — 定期的なメインセッションターン
- [タイムゾーン](/ja-JP/concepts/timezone) — タイムゾーン設定

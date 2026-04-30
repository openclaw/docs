---
read_when:
    - バックグラウンドジョブまたはウェイクアップのスケジュール設定
    - 外部トリガー（Webhook、Gmail）をOpenClawに接続する
    - スケジュールされたタスクで Heartbeat と Cron のどちらを使うかを決める
sidebarTitle: Scheduled tasks
summary: Gateway スケジューラー向けのスケジュール済みジョブ、Webhook、Gmail PubSub トリガー
title: スケジュールされたタスク
x-i18n:
    generated_at: "2026-04-30T04:57:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 021e623bdea786178e0948e9905360c897c26d31fdf866e9af8cfc9538968d60
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron は Gateway に組み込まれたスケジューラです。ジョブを永続化し、適切な時刻にエージェントを起動し、チャットチャンネルまたは Webhook エンドポイントへ出力を返すことができます。

## クイックスタート

<Steps>
  <Step title="1回限りのリマインダーを追加する">
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
  <Step title="実行履歴を見る">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## Cron の仕組み

- Cron は**Gateway**プロセス内で実行されます（モデル内ではありません）。
- ジョブ定義は `~/.openclaw/cron/jobs.json` に永続化されるため、再起動してもスケジュールは失われません。
- ランタイム実行状態は、その隣の `~/.openclaw/cron/jobs-state.json` に永続化されます。Cron 定義を git で追跡する場合は、`jobs.json` を追跡し、`jobs-state.json` は gitignore してください。
- 分割後、古い OpenClaw バージョンは `jobs.json` を読み取れますが、ランタイムフィールドが `jobs-state.json` に移ったため、ジョブを新規のものとして扱う場合があります。
- Gateway の実行中または停止中に `jobs.json` が編集されると、OpenClaw は変更されたスケジュールフィールドを保留中のランタイムスロットメタデータと比較し、古い `nextRunAtMs` 値をクリアします。純粋なフォーマット変更やキー順序のみの書き換えでは、保留中のスロットは維持されます。
- すべての Cron 実行は [background task](/ja-JP/automation/tasks) レコードを作成します。
- Gateway 起動時、期限切れの分離エージェントターンジョブは即座に再実行されるのではなく、チャンネル接続期間の外に再スケジュールされます。そのため、再起動後も Discord/Telegram の起動とネイティブコマンド設定は応答性を保ちます。
- 1回限りのジョブ（`--at`）は、デフォルトで成功後に自動削除されます。
- 分離 Cron 実行は、実行完了時に `cron:<jobId>` セッションの追跡対象ブラウザータブ/プロセスをベストエフォートで閉じるため、切り離されたブラウザー自動化が孤立プロセスを残しません。
- 分離 Cron 実行は、古い確認応答の返信も防ぎます。最初の結果が単なる暫定ステータス更新（`on it`、`pulling everything together`、および同様のヒント）で、子孫サブエージェント実行が最終回答をまだ担当していない場合、OpenClaw は配信前に実際の結果を一度だけ再プロンプトします。
- 分離 Cron 実行は、埋め込み実行からの構造化された実行拒否メタデータを優先し、その後 `SYSTEM_RUN_DENIED` や `INVALID_REQUEST` などの既知の最終サマリー/出力マーカーにフォールバックします。そのため、ブロックされたコマンドが成功した実行として報告されません。
- 分離 Cron 実行は、返信ペイロードが生成されない場合でも、実行レベルのエージェント失敗をジョブエラーとして扱います。そのため、モデル/プロバイダーの失敗はエラーカウンターを増やし、ジョブを成功としてクリアするのではなく失敗通知をトリガーします。
- 分離エージェントターンジョブが `timeoutSeconds` に達すると、Cron は基盤となるエージェント実行を中止し、短いクリーンアップ時間を与えます。実行が完了処理を終えない場合、Gateway 所有のクリーンアップが Cron がタイムアウトを記録する前にその実行のセッション所有権を強制的にクリアするため、キューに入ったチャット作業が古い処理中セッションの背後に残されません。

<a id="maintenance"></a>

<Note>
Cron のタスク照合は、まずランタイム所有で、次に永続履歴を裏付けにします。古い子セッション行がまだ存在する場合でも、Cron ランタイムがそのジョブを実行中として追跡している間、アクティブな Cron タスクはライブのままです。ランタイムがジョブの所有を停止し、5分間の猶予期間が期限切れになると、メンテナンスは永続化された実行ログとジョブ状態から一致する `cron:<jobId>:<startedAt>` 実行を確認します。その永続履歴が終端結果を示す場合、タスク台帳はそれに基づいて確定されます。そうでない場合、Gateway 所有のメンテナンスはタスクを `lost` としてマークできます。オフライン CLI 監査は永続履歴から復旧できますが、自身の空のインプロセスアクティブジョブセットを、Gateway 所有の Cron 実行が消えた証拠としては扱いません。
</Note>

## スケジュールの種類

| 種類    | CLI フラグ | 説明                                                    |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | 1回限りのタイムスタンプ（ISO 8601 または `20m` のような相対指定） |
| `every` | `--every` | 固定間隔                                                |
| `cron`  | `--cron`  | 任意の `--tz` を伴う5フィールドまたは6フィールドの Cron 式 |

タイムゾーンのないタイムスタンプは UTC として扱われます。ローカルの壁時計時刻でスケジュールするには `--tz America/New_York` を追加してください。

毎時ちょうどに繰り返される式は、負荷スパイクを減らすために最大5分まで自動的に分散されます。正確なタイミングを強制するには `--exact` を使用し、明示的なウィンドウには `--stagger 30s` を使用します。

### 日付と曜日は OR ロジックを使用する

Cron 式は [croner](https://github.com/Hexagon/croner) によって解析されます。日付フィールドと曜日フィールドの両方がワイルドカードでない場合、croner は**どちらか**のフィールドが一致したときに一致とします。両方ではありません。これは標準的な Vixie cron の動作です。

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

これは月に0〜1回ではなく、月に約5〜6回実行されます。OpenClaw はここで Croner のデフォルトの OR 動作を使用します。両方の条件を必須にするには、Croner の `+` 曜日修飾子（`0 9 15 * +1`）を使用するか、一方のフィールドでスケジュールし、もう一方はジョブのプロンプトまたはコマンド内でガードしてください。

## 実行スタイル

| スタイル        | `--session` 値     | 実行場所                 | 最適な用途                     |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| メインセッション | `main`              | 次の Heartbeat ターン    | リマインダー、システムイベント |
| 分離            | `isolated`          | 専用の `cron:<jobId>`    | レポート、バックグラウンド作業 |
| 現在のセッション | `current`           | 作成時にバインド         | コンテキスト対応の繰り返し作業 |
| カスタムセッション | `session:custom-id` | 永続的な名前付きセッション | 履歴を土台にするワークフロー   |

<AccordionGroup>
  <Accordion title="メインセッションと分離とカスタム">
    **メインセッション**ジョブはシステムイベントをキューに入れ、任意で Heartbeat を起動します（`--wake now` または `--wake next-heartbeat`）。これらのシステムイベントは、対象セッションの日次/アイドルリセットの鮮度を延長しません。**分離**ジョブは、新しいセッションで専用のエージェントターンを実行します。**カスタムセッション**（`session:xxx`）は実行間でコンテキストを永続化し、前回のサマリーを土台にする日次スタンドアップのようなワークフローを可能にします。
  </Accordion>
  <Accordion title="分離ジョブにおける「新しいセッション」の意味">
    分離ジョブの場合、「新しいセッション」とは各実行に対する新しいトランスクリプト/セッション ID を意味します。OpenClaw は、thinking/fast/verbose 設定、ラベル、明示的にユーザーが選択したモデル/auth オーバーライドなどの安全な設定を引き継ぐ場合がありますが、古い Cron 行から周囲の会話コンテキストを継承することはありません。チャンネル/グループルーティング、送信またはキューポリシー、昇格、オリジン、ACP ランタイムバインディングも継承されません。繰り返しジョブが同じ会話コンテキストを意図的に土台にする必要がある場合は、`current` または `session:<id>` を使用してください。
  </Accordion>
  <Accordion title="ランタイムのクリーンアップ">
    分離ジョブでは、ランタイムの終了処理に、その Cron セッションのベストエフォートのブラウザークリーンアップが含まれるようになりました。実際の Cron 結果が優先されるように、クリーンアップ失敗は無視されます。

    分離 Cron 実行は、共有ランタイムクリーンアップパスを通じて、ジョブ用に作成されたバンドル済み MCP ランタイムインスタンスも破棄します。これはメインセッションおよびカスタムセッションの MCP クライアントの終了処理と一致するため、分離 Cron ジョブは stdio 子プロセスや長時間存続する MCP 接続を実行間でリークしません。

  </Accordion>
  <Accordion title="サブエージェントと Discord 配信">
    分離 Cron 実行がサブエージェントをオーケストレーションする場合、配信は古い親の暫定テキストよりも最終的な子孫出力を優先します。子孫がまだ実行中の場合、OpenClaw はその部分的な親更新をアナウンスせずに抑制します。

    テキストのみの Discord アナウンス対象では、OpenClaw はストリーミング/中間テキストペイロードと最終回答の両方を再生するのではなく、正規の最終アシスタントテキストを一度だけ送信します。メディアおよび構造化された Discord ペイロードは、添付ファイルやコンポーネントが欠落しないように、引き続き別個のペイロードとして配信されます。

  </Accordion>
</AccordionGroup>

### 分離ジョブのペイロードオプション

<ParamField path="--message" type="string" required>
  プロンプトテキスト（分離では必須）。
</ParamField>
<ParamField path="--model" type="string">
  モデルオーバーライド。ジョブに選択された許可済みモデルを使用します。
</ParamField>
<ParamField path="--thinking" type="string">
  Thinking レベルのオーバーライド。
</ParamField>
<ParamField path="--light-context" type="boolean">
  ワークスペースブートストラップファイルの注入をスキップします。
</ParamField>
<ParamField path="--tools" type="string">
  ジョブが使用できるツールを制限します。例: `--tools exec,read`。
</ParamField>

`--model` は、選択された許可済みモデルをそのジョブのプライマリモデルとして使用します。これはチャットセッションの `/model` オーバーライドとは異なります。ジョブのプライマリが失敗した場合も、設定済みのフォールバックチェーンは引き続き適用されます。要求されたモデルが許可されていない、または解決できない場合、Cron はジョブのエージェント/デフォルトモデル選択へ暗黙にフォールバックするのではなく、明示的な検証エラーで実行を失敗させます。

Cron ジョブはペイロードレベルの `fallbacks` も保持できます。存在する場合、そのリストはジョブの設定済みフォールバックチェーンを置き換えます。選択されたモデルのみを試す厳密な Cron 実行にしたい場合は、ジョブペイロード/API で `fallbacks: []` を使用してください。ジョブに `--model` があり、ペイロードにも設定にもフォールバックがない場合、OpenClaw は明示的な空のフォールバックオーバーライドを渡すため、エージェントのプライマリが隠れた追加リトライ対象として追加されることはありません。

分離ジョブのモデル選択の優先順位は次のとおりです。

1. Gmail フックのモデルオーバーライド（実行が Gmail 由来で、そのオーバーライドが許可されている場合）
2. ジョブ単位のペイロード `model`
3. ユーザーが選択して保存された Cron セッションのモデルオーバーライド
4. エージェント/デフォルトのモデル選択

高速モードも解決済みのライブ選択に従います。選択されたモデル設定に `params.fastMode` がある場合、分離 Cron はデフォルトでそれを使用します。保存されたセッションの `fastMode` オーバーライドは、どちらの方向でも設定より優先されます。

分離実行がライブモデル切り替えハンドオフに達した場合、Cron は切り替え後のプロバイダー/モデルで再試行し、再試行前にそのライブ選択をアクティブな実行に永続化します。切り替えに新しい auth プロファイルも含まれる場合、Cron はその auth プロファイルオーバーライドもアクティブな実行に永続化します。再試行には上限があります。初回試行に加えて2回の切り替え再試行後、Cron は無限ループするのではなく中止します。

分離 Cron 実行がエージェントランナーに入る前に、OpenClaw は `baseUrl` が loopback、プライベートネットワーク、または `.local` の、設定済み `api: "ollama"` および `api: "openai-completions"` プロバイダーについて、到達可能なローカルプロバイダーエンドポイントを確認します。そのエンドポイントが停止している場合、実行はモデル呼び出しを開始するのではなく、明確なプロバイダー/モデルエラー付きで `skipped` として記録されます。エンドポイント結果は5分間キャッシュされるため、同じ停止中のローカル Ollama、vLLM、SGLang、または LM Studio サーバーを使用する多数の期限到来ジョブは、リクエストの嵐を作るのではなく、1つの小さなプローブを共有します。プロバイダープリフライトでスキップされた実行は、実行エラーバックオフを増やしません。繰り返しのスキップ通知が必要な場合は、`failureAlert.includeSkipped` を有効にしてください。

## 配信と出力

| モード     | 動作                                                                |
| ---------- | ------------------------------------------------------------------- |
| `announce` | エージェントが送信しなかった場合、最終テキストを対象にフォールバック配信します |
| `webhook`  | 完了イベントペイロードを URL に POST します                         |
| `none`     | ランナーのフォールバック配信はありません                            |

Use `--announce --channel telegram --to "-1001234567890"` をチャンネル配信に使用します。Telegram フォーラムトピックでは `-1001234567890:topic:123` を使用します。直接 RPC/config 呼び出し側は `delivery.threadId` を文字列または数値として渡すこともできます。Slack/Discord/Mattermost のターゲットでは明示的なプレフィックス（`channel:<id>`、`user:<id>`）を使用してください。Matrix のルーム ID は大文字と小文字を区別します。Matrix から取得した正確なルーム ID、または `room:!room:server` 形式を使用してください。

分離ジョブでは、チャット配信は共有されます。チャットルートが利用可能な場合、ジョブが `--no-deliver` を使用していても、エージェントは `message` ツールを使用できます。エージェントが設定済み/現在のターゲットに送信した場合、OpenClaw はフォールバック通知をスキップします。それ以外の場合、`announce`、`webhook`、`none` は、エージェントターン後の最終返信をランナーがどう扱うかだけを制御します。

エージェントがアクティブなチャットから分離リマインダーを作成すると、OpenClaw はフォールバック通知ルート用に保持されたライブ配信ターゲットを保存します。内部セッションキーは小文字の場合があります。現在のチャットコンテキストが利用可能な場合、プロバイダー配信ターゲットはそれらのキーから再構築されません。

失敗通知は別の宛先パスに従います。

- `cron.failureDestination` は失敗通知のグローバル既定値を設定します。
- `job.delivery.failureDestination` はジョブごとにそれを上書きします。
- どちらも設定されておらず、ジョブがすでに `announce` 経由で配信している場合、失敗通知はそのプライマリ通知ターゲットにフォールバックするようになりました。
- `delivery.failureDestination` は、プライマリ配信モードが `webhook` でない限り、`sessionTarget="isolated"` ジョブでのみサポートされます。
- `failureAlert.includeSkipped: true` は、ジョブまたはグローバル cron アラートポリシーで、繰り返しスキップされた実行のアラートを有効にします。スキップされた実行は個別の連続スキップカウンターを保持するため、実行エラーのバックオフには影響しません。

## CLI の例

<Tabs>
  <Tab title="1 回限りのリマインダー">
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
  <Tab title="モデルと思考の上書き">
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

Gateway は外部トリガー用の HTTP Webhook エンドポイントを公開できます。config で有効にします。

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

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    main セッションのシステムイベントをキューに入れます。

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
    分離エージェントターンを実行します。

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    フィールド: `message`（必須）、`name`、`agentId`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`fallbacks`、`thinking`、`timeoutSeconds`。

  </Accordion>
  <Accordion title="マップされたフック（POST /hooks/<name>）">
    カスタムフック名は config の `hooks.mappings` で解決されます。マッピングは、任意のペイロードをテンプレートまたはコード変換で `wake` または `agent` アクションに変換できます。
  </Accordion>
</AccordionGroup>

<Warning>
フックエンドポイントは loopback、tailnet、または信頼済みリバースプロキシの背後に置いてください。

- 専用のフックトークンを使用してください。gateway 認証トークンを再利用しないでください。
- `hooks.path` は専用のサブパスにしてください。`/` は拒否されます。
- 明示的な `agentId` ルーティングを制限するには `hooks.allowedAgentIds` を設定してください。
- 呼び出し側が選択したセッションが必要でない限り、`hooks.allowRequestSessionKey=false` のままにしてください。
- `hooks.allowRequestSessionKey` を有効にする場合は、許可されるセッションキーの形状を制約するために `hooks.allowedSessionKeyPrefixes` も設定してください。
- フックペイロードは既定で安全境界でラップされます。

</Warning>

## Gmail PubSub 連携

Google PubSub 経由で Gmail 受信トリガーを OpenClaw に接続します。

<Note>
**前提条件:** `gcloud` CLI、`gog`（gogcli）、OpenClaw フック有効化済み、公開 HTTPS エンドポイント用の Tailscale。
</Note>

### ウィザード設定（推奨）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

これにより `hooks.gmail` config が書き込まれ、Gmail プリセットが有効になり、プッシュエンドポイントに Tailscale Funnel が使用されます。

### Gateway 自動起動

`hooks.enabled=true` かつ `hooks.gmail.account` が設定されている場合、Gateway は起動時に `gog gmail watch serve` を開始し、watch を自動更新します。オプトアウトするには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定してください。

### 手動の 1 回限りの設定

<Steps>
  <Step title="GCP プロジェクトを選択">
    `gog` が使用する OAuth クライアントを所有する GCP プロジェクトを選択します。

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="トピックを作成して Gmail プッシュアクセスを付与">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="watch を開始">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Gmail モデルの上書き

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
# List all jobs
openclaw cron list

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

<Note>
モデル上書きの注意:

- `openclaw cron add|edit --model ...` はジョブで選択されたモデルを変更します。
- モデルが許可されている場合、その正確なプロバイダー/モデルが分離エージェント実行に到達します。
- 許可されていない、または解決できない場合、cron は明示的な検証エラーで実行を失敗させます。
- 設定済みのフォールバックチェーンは引き続き適用されます。cron `--model` はジョブのプライマリであり、セッションの `/model` 上書きではないためです。
- ペイロードの `fallbacks` は、そのジョブの設定済みフォールバックを置き換えます。`fallbacks: []` はフォールバックを無効にし、実行を厳格にします。
- 明示的または設定済みのフォールバックリストがない単純な `--model` は、暗黙の追加リトライターゲットとしてエージェントのプライマリへフォールスルーしません。

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

`maxConcurrentRuns` は、スケジュールされた cron ディスパッチと分離エージェントターン実行の両方を制限します。分離 cron エージェントターンは内部でキュー専用の `cron-nested` 実行レーンを使用するため、この値を増やすと、独立した cron LLM 実行は外側の cron ラッパーを開始するだけでなく並行して進行できます。共有の非 cron `nested` レーンはこの設定では拡張されません。

ランタイム状態サイドカーは `cron.store` から派生します。`~/clawd/cron/jobs.json` のような `.json` ストアは `~/clawd/cron/jobs-state.json` を使用し、`.json` サフィックスのないストアパスでは `-state.json` が追加されます。

`jobs.json` を手動編集する場合は、`jobs-state.json` をソース管理から除外してください。OpenClaw はそのサイドカーを、保留スロット、アクティブマーカー、最終実行メタデータ、および外部編集されたジョブに新しい `nextRunAtMs` が必要な時期をスケジューラーに伝えるスケジュール ID に使用します。

cron を無効化: `cron.enabled: false` または `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="リトライ動作">
    **1 回限りのリトライ**: 一時的なエラー（レート制限、過負荷、ネットワーク、サーバーエラー）は、指数バックオフで最大 3 回リトライします。恒久的なエラーは即座に無効化されます。

    **定期リトライ**: リトライ間で指数バックオフ（30 秒から 60 分）を使用します。バックオフは次回の成功実行後にリセットされます。

  </Accordion>
  <Accordion title="メンテナンス">
    `cron.sessionRetention`（既定値 `24h`）は分離実行セッションのエントリを整理します。`cron.runLog.maxBytes` / `cron.runLog.keepLines` は実行ログファイルを自動整理します。
  </Accordion>
</AccordionGroup>

## トラブルシューティング

### コマンド手順

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
  <Accordion title="Cron が起動しない">
    - `cron.enabled` と `OPENCLAW_SKIP_CRON` 環境変数を確認してください。
    - Gateway が継続的に実行されていることを確認してください。
    - `cron` スケジュールでは、タイムゾーン（`--tz`）とホストのタイムゾーンを確認してください。
    - 実行出力の `reason: not-due` は、手動実行が `openclaw cron run <jobId> --due` で確認され、ジョブの期限がまだ来ていないことを意味します。

  </Accordion>
  <Accordion title="Cron は起動したが配信されない">
    - 配信モード `none` は、ランナーのフォールバック送信が期待されないことを意味します。チャットルートが利用可能な場合、エージェントは引き続き `message` ツールで直接送信できます。
    - 配信ターゲットがない/無効（`channel`/`to`）な場合、アウトバウンドはスキップされます。
    - Matrix では、コピーされたジョブやレガシージョブで `delivery.to` のルーム ID が小文字化されていると、Matrix のルーム ID は大文字と小文字を区別するため失敗することがあります。Matrix から取得した正確な `!room:server` または `room:!room:server` 値にジョブを編集してください。
    - チャンネル認証エラー（`unauthorized`、`Forbidden`）は、認証情報によって配信がブロックされたことを意味します。
    - 分離実行がサイレントトークン（`NO_REPLY` / `no_reply`）のみを返す場合、OpenClaw は直接アウトバウンド配信を抑制し、フォールバックのキュー済み要約パスも抑制するため、チャットには何も投稿されません。
    - エージェント自身がユーザーにメッセージを送る必要がある場合は、ジョブに使用可能なルート（以前のチャットを持つ `channel: "last"`、または明示的なチャンネル/ターゲット）があることを確認してください。

  </Accordion>
  <Accordion title="Cron または Heartbeat が /new-style ロールオーバーを妨げているように見える">
    - 日次リセットとアイドルリセットの鮮度判定は `updatedAt` に基づきません。詳しくは [セッション管理](/ja-JP/concepts/session#session-lifecycle) を参照してください。
    - Cron のウェイクアップ、Heartbeat の実行、exec 通知、Gateway の管理処理は、ルーティングやステータスのためにセッション行を更新する場合がありますが、`sessionStartedAt` や `lastInteractionAt` を延長しません。
    - これらのフィールドが存在する前に作成されたレガシー行については、ファイルがまだ利用可能な場合、OpenClaw はトランスクリプト JSONL のセッションヘッダーから `sessionStartedAt` を復元できます。`lastInteractionAt` がないレガシーのアイドル行では、その復元された開始時刻をアイドルの基準として使用します。

  </Accordion>
  <Accordion title="タイムゾーンの注意点">
    - `--tz` なしの Cron は Gateway ホストのタイムゾーンを使用します。
    - タイムゾーンなしの `at` スケジュールは UTC として扱われます。
    - Heartbeat の `activeHours` は設定されたタイムゾーン解決を使用します。

  </Accordion>
</AccordionGroup>

## 関連

- [自動化とタスク](/ja-JP/automation) — すべての自動化メカニズムの概要
- [バックグラウンドタスク](/ja-JP/automation/tasks) — Cron 実行のタスク台帳
- [Heartbeat](/ja-JP/gateway/heartbeat) — 定期的なメインセッションターン
- [タイムゾーン](/ja-JP/concepts/timezone) — タイムゾーン設定

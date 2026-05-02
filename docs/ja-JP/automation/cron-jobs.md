---
read_when:
    - バックグラウンドジョブまたはウェイクアップのスケジュール設定
    - 外部トリガー（Webhook、Gmail）をOpenClawに接続する
    - スケジュール済みタスクで Heartbeat と Cron のどちらを使うか決める
sidebarTitle: Scheduled tasks
summary: Gateway スケジューラー向けのスケジュール済みジョブ、Webhook、Gmail PubSub トリガー
title: スケジュールされたタスク
x-i18n:
    generated_at: "2026-05-02T04:48:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: cdda94c3c31e4530e0944cd8f5667a7eb567fcff8e602d6a86d5699d078e9b48
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron は Gateway の組み込みスケジューラです。ジョブを永続化し、適切な時刻にエージェントを起動し、出力をチャットチャンネルまたは webhook エンドポイントに返すことができます。

## クイックスタート

<Steps>
  <Step title="1 回限りのリマインダーを追加する">
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

## cron の仕組み

- Cron は**Gateway 内**プロセスで実行されます（モデル内ではありません）。
- ジョブ定義は `~/.openclaw/cron/jobs.json` に永続化されるため、再起動してもスケジュールは失われません。
- ランタイム実行状態は、隣の `~/.openclaw/cron/jobs-state.json` に永続化されます。cron 定義を git で管理する場合は、`jobs.json` を管理対象にし、`jobs-state.json` を gitignore してください。
- 分割後、古い OpenClaw バージョンは `jobs.json` を読み取れますが、ランタイムフィールドが `jobs-state.json` に移動したため、ジョブを新規として扱う場合があります。
- Gateway の実行中または停止中に `jobs.json` が編集されると、OpenClaw は変更されたスケジュールフィールドを保留中のランタイムスロットメタデータと比較し、古くなった `nextRunAtMs` 値をクリアします。純粋なフォーマット変更やキー順序だけの書き換えでは、保留中のスロットは保持されます。
- すべての cron 実行は [バックグラウンドタスク](/ja-JP/automation/tasks) レコードを作成します。
- Gateway 起動時、期限超過の分離エージェントターンジョブは即時再生されず、チャンネル接続ウィンドウの外へ再スケジュールされるため、再起動後も Discord/Telegram の起動とネイティブコマンド設定の応答性が保たれます。
- 1 回限りのジョブ（`--at`）は、デフォルトで成功後に自動削除されます。
- 分離 cron 実行は、実行完了時にその `cron:<jobId>` セッションで追跡されているブラウザータブ/プロセスをベストエフォートで閉じるため、切り離されたブラウザー自動化が孤立プロセスを残しません。
- 分離 cron 実行は、古い確認応答の返信も防ぎます。最初の結果が一時的なステータス更新（`on it`、`pulling everything together`、および類似のヒント）だけで、最終回答を担当する子孫サブエージェント実行がまだ存在しない場合、OpenClaw は配信前に実際の結果を 1 回再プロンプトします。
- 分離 cron 実行は、埋め込み実行からの構造化された実行拒否メタデータを優先し、その後 `SYSTEM_RUN_DENIED` や `INVALID_REQUEST` などの既知の最終サマリー/出力マーカーにフォールバックするため、ブロックされたコマンドが正常実行として報告されません。
- 分離 cron 実行は、返信ペイロードが生成されない場合でも実行レベルのエージェント失敗をジョブエラーとして扱うため、モデル/プロバイダーの失敗はジョブを成功としてクリアせず、エラーカウンターを増やして失敗通知をトリガーします。
- 分離エージェントターンジョブが `timeoutSeconds` に達すると、cron は基盤となるエージェント実行を中止し、短いクリーンアップ時間を与えます。実行が排出されない場合、cron がタイムアウトを記録する前に Gateway 所有のクリーンアップがその実行のセッション所有権を強制的にクリアするため、キューに入ったチャット作業が古い処理中セッションの背後に残されません。

<a id="maintenance"></a>

<Note>
cron のタスク照合では、まずランタイム所有、次に耐久履歴による裏付けが使われます。古い子セッション行がまだ存在していても、cron ランタイムがそのジョブを実行中として追跡している間、アクティブな cron タスクはライブのままです。ランタイムがジョブを所有しなくなり、5 分の猶予ウィンドウが期限切れになると、メンテナンスは一致する `cron:<jobId>:<startedAt>` 実行について、永続化された実行ログとジョブ状態を確認します。その耐久履歴が終端結果を示している場合、タスク台帳はそこから確定されます。それ以外の場合、Gateway 所有のメンテナンスはタスクを `lost` としてマークできます。オフライン CLI 監査は耐久履歴から復旧できますが、自身の空のインプロセスアクティブジョブセットを、Gateway 所有の cron 実行が消えた証拠として扱うことはありません。
</Note>

## スケジュール種別

| 種類    | CLI フラグ | 説明                                                    |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | 1 回限りのタイムスタンプ（ISO 8601 または `20m` のような相対指定） |
| `every` | `--every` | 固定間隔                                                |
| `cron`  | `--cron`  | オプションの `--tz` を伴う 5 フィールドまたは 6 フィールドの cron 式 |

タイムゾーンなしのタイムスタンプは UTC として扱われます。ローカルの壁時計時刻でスケジュールするには、`--tz America/New_York` を追加してください。

毎時ちょうどの繰り返し式は、負荷スパイクを減らすために最大 5 分まで自動的にずらされます。正確なタイミングを強制するには `--exact` を使用し、明示的なウィンドウには `--stagger 30s` を使用します。

### 日付と曜日は OR ロジックを使用します

Cron 式は [croner](https://github.com/Hexagon/croner) によって解析されます。日付フィールドと曜日フィールドの両方がワイルドカードでない場合、croner は**どちらか**のフィールドが一致したときに一致とします。両方ではありません。これは標準的な Vixie cron の挙動です。

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

これは月に 0〜1 回ではなく、約 5〜6 回発火します。OpenClaw はここで Croner のデフォルトの OR 挙動を使用します。両方の条件を必須にするには、Croner の `+` 曜日修飾子（`0 9 15 * +1`）を使用するか、一方のフィールドでスケジュールし、もう一方をジョブのプロンプトまたはコマンドでガードしてください。

## 実行スタイル

| スタイル        | `--session` 値    | 実行先                   | 最適な用途                      |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| メインセッション | `main`              | 次の Heartbeat ターン    | リマインダー、システムイベント  |
| 分離            | `isolated`          | 専用の `cron:<jobId>`    | レポート、バックグラウンド雑務  |
| 現在のセッション | `current`           | 作成時にバインド         | コンテキスト対応の繰り返し作業  |
| カスタムセッション | `session:custom-id` | 永続的な名前付きセッション | 履歴を積み上げるワークフロー    |

<AccordionGroup>
  <Accordion title="メインセッション、分離、カスタムの違い">
    **メインセッション**ジョブはシステムイベントをキューに入れ、必要に応じて Heartbeat を起動します（`--wake now` または `--wake next-heartbeat`）。これらのシステムイベントは、対象セッションの日次/アイドルリセットの新鮮度を延長しません。**分離**ジョブは、新しいセッションで専用のエージェントターンを実行します。**カスタムセッション**（`session:xxx`）は実行間でコンテキストを永続化し、前回のサマリーを土台にした日次スタンドアップのようなワークフローを可能にします。
  </Accordion>
  <Accordion title="分離ジョブにおける「新しいセッション」の意味">
    分離ジョブにおいて、「新しいセッション」とは各実行ごとに新しいトランスクリプト/セッション ID を使うことを意味します。OpenClaw は、thinking/fast/verbose 設定、ラベル、明示的にユーザーが選択したモデル/auth オーバーライドなどの安全な設定を引き継ぐ場合がありますが、古い cron 行から周囲の会話コンテキストは継承しません。チャンネル/グループルーティング、送信またはキューのポリシー、権限昇格、起点、ACP ランタイムバインディングなどです。繰り返しジョブが意図的に同じ会話コンテキストを土台にする必要がある場合は、`current` または `session:<id>` を使用してください。
  </Accordion>
  <Accordion title="ランタイムクリーンアップ">
    分離ジョブでは、ランタイムのティアダウンに、その cron セッション向けのベストエフォートのブラウザークリーンアップが含まれるようになりました。実際の cron 結果が優先されるよう、クリーンアップ失敗は無視されます。

    分離 cron 実行は、共有ランタイムクリーンアップパスを通じて、そのジョブ用に作成されたバンドル済み MCP ランタイムインスタンスも破棄します。これはメインセッションおよびカスタムセッションの MCP クライアントのティアダウン方法と一致するため、分離 cron ジョブが実行間で stdio 子プロセスや長寿命の MCP 接続をリークしません。

  </Accordion>
  <Accordion title="サブエージェントと Discord 配信">
    分離 cron 実行がサブエージェントをオーケストレーションする場合、配信では古い親の一時テキストよりも最終的な子孫出力が優先されます。子孫がまだ実行中の場合、OpenClaw はその部分的な親の更新を通知せずに抑制します。

    テキストのみの Discord 通知先については、OpenClaw はストリーミング/中間テキストペイロードと最終回答の両方を再生するのではなく、正規の最終アシスタントテキストを 1 回だけ送信します。メディアと構造化された Discord ペイロードは、添付ファイルやコンポーネントが落ちないよう、引き続き個別のペイロードとして配信されます。

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

`--model` は、そのジョブのプライマリモデルとして選択された許可済みモデルを使用します。これはチャットセッションの `/model` オーバーライドとは異なります。設定済みのフォールバックチェーンは、ジョブのプライマリが失敗した場合にも引き続き適用されます。要求されたモデルが許可されていない、または解決できない場合、cron はジョブのエージェント/デフォルトモデル選択へ黙ってフォールバックするのではなく、明示的な検証エラーで実行を失敗させます。

Cron ジョブはペイロードレベルの `fallbacks` も保持できます。存在する場合、そのリストはジョブの設定済みフォールバックチェーンを置き換えます。選択されたモデルだけを試す厳密な cron 実行にしたい場合は、ジョブペイロード/API で `fallbacks: []` を使用してください。ジョブに `--model` があり、ペイロードにも設定済みフォールバックにも何もない場合、OpenClaw は明示的な空のフォールバックオーバーライドを渡すため、エージェントのプライマリが隠れた追加リトライ対象として追加されることはありません。

分離ジョブのモデル選択優先順位は次のとおりです。

1. Gmail フックのモデルオーバーライド（実行が Gmail から来ており、そのオーバーライドが許可されている場合）
2. ジョブごとのペイロード `model`
3. ユーザーが選択して保存した cron セッションのモデルオーバーライド
4. エージェント/デフォルトのモデル選択

Fast モードも解決されたライブ選択に従います。選択されたモデル設定に `params.fastMode` がある場合、分離 cron はデフォルトでそれを使用します。保存済みセッションの `fastMode` オーバーライドは、どちらの方向でも設定より優先されます。

分離実行がライブモデル切り替えハンドオフに達した場合、cron は切り替え後のプロバイダー/モデルでリトライし、リトライ前にそのライブ選択をアクティブな実行に永続化します。切り替えに新しい auth プロファイルも含まれる場合、cron はその auth プロファイルオーバーライドもアクティブな実行に永続化します。リトライには上限があります。初回試行に加えて 2 回の切り替えリトライ後、cron は無限ループせずに中止します。

分離 cron 実行がエージェントランナーに入る前に、OpenClaw は、`baseUrl` が local loopback、プライベートネットワーク、または `.local` である、設定済みの `api: "ollama"` および `api: "openai-completions"` プロバイダーについて、到達可能なローカルプロバイダーエンドポイントを確認します。そのエンドポイントが停止している場合、実行はモデル呼び出しを開始せず、明確なプロバイダー/モデルエラーとともに `skipped` として記録されます。エンドポイント結果は 5 分間キャッシュされるため、同じ停止中のローカル Ollama、vLLM、SGLang、または LM Studio サーバーを使う多数の期限到来ジョブは、リクエストの嵐を作らず、1 回の小さなプローブを共有します。プロバイダープリフライトでスキップされた実行は、実行エラーのバックオフを増やしません。繰り返しのスキップ通知が必要な場合は、`failureAlert.includeSkipped` を有効にしてください。

## 配信と出力

| モード     | 発生すること                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | エージェントが送信しなかった場合、最終テキストを対象にフォールバック配信します |
| `webhook`  | 完了イベントペイロードを URL に POST します                        |
| `none`     | ランナーのフォールバック配信はありません                           |

`--announce --channel telegram --to "-1001234567890"` はチャンネル配信に使用します。Telegram フォーラムトピックでは `-1001234567890:topic:123` を使用します。直接の RPC/設定呼び出し元は、`delivery.threadId` を文字列または数値として渡すこともできます。Slack/Discord/Mattermost のターゲットは明示的なプレフィックス（`channel:<id>`、`user:<id>`）を使用してください。Matrix のルーム ID は大文字と小文字が区別されます。Matrix の正確なルーム ID、または `room:!room:server` 形式を使用してください。

announce 配信で `channel: "last"` を使用するか `channel` を省略すると、`telegram:123` のようなプロバイダープレフィックス付きターゲットによって、cron がセッション履歴または単一の設定済みチャンネルにフォールバックする前にチャンネルを選択できます。読み込まれた plugin が公開しているプレフィックスだけがプロバイダーセレクターです。`delivery.channel` が明示されている場合、ターゲットプレフィックスは同じプロバイダー名でなければなりません。たとえば、`channel: "whatsapp"` と `to: "telegram:123"` の組み合わせは、WhatsApp に Telegram ID を電話番号として解釈させるのではなく拒否されます。`channel:<id>`、`user:<id>`、`imessage:<handle>`、`sms:<number>` などのターゲット種別とサービスプレフィックスは、プロバイダーセレクターではなく、引き続きチャンネル所有のターゲット構文です。

分離ジョブでは、チャット配信が共有されます。チャットルートが利用できる場合、ジョブが `--no-deliver` を使用していても、エージェントは `message` ツールを使用できます。エージェントが設定済みまたは現在のターゲットへ送信した場合、OpenClaw はフォールバック announce をスキップします。それ以外の場合、`announce`、`webhook`、`none` は、エージェントターン後の最終返信を runner がどのように扱うかだけを制御します。

エージェントがアクティブなチャットから分離リマインダーを作成すると、OpenClaw はフォールバック announce ルート用に保持されたライブ配信ターゲットを保存します。内部セッションキーは小文字の場合があります。現在のチャットコンテキストが利用できる場合、プロバイダー配信ターゲットはそれらのキーから再構築されません。

失敗通知は別の宛先パスに従います。

- `cron.failureDestination` は失敗通知のグローバルデフォルトを設定します。
- `job.delivery.failureDestination` はジョブごとにそれを上書きします。
- どちらも設定されておらず、ジョブがすでに `announce` で配信している場合、失敗通知はその主要 announce ターゲットにフォールバックするようになりました。
- `delivery.failureDestination` は、主要配信モードが `webhook` の場合を除き、`sessionTarget="isolated"` ジョブでのみサポートされます。
- `failureAlert.includeSkipped: true` は、ジョブまたはグローバル cron アラートポリシーで、繰り返しのスキップ実行アラートを有効にします。スキップされた実行は別個の連続スキップカウンターを保持するため、実行エラーのバックオフには影響しません。

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
  <Tab title="繰り返しの分離ジョブ">
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

Gateway は外部トリガー用の HTTP Webhook エンドポイントを公開できます。設定で有効にします。

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

すべてのリクエストは、ヘッダーで hook トークンを含める必要があります。

- `Authorization: Bearer <token>`（推奨）
- `x-openclaw-token: <token>`

クエリ文字列のトークンは拒否されます。

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    メインセッションにシステムイベントをキュー登録します。

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
  <Accordion title="マッピング済み hook（POST /hooks/<name>）">
    カスタム hook 名は、設定内の `hooks.mappings` で解決されます。マッピングは、テンプレートまたはコード変換を使って任意のペイロードを `wake` または `agent` アクションへ変換できます。
  </Accordion>
</AccordionGroup>

<Warning>
hook エンドポイントは loopback、tailnet、または信頼済みリバースプロキシの背後に置いてください。

- 専用の hook トークンを使用し、gateway 認証トークンを再利用しないでください。
- `hooks.path` は専用のサブパスにしてください。`/` は拒否されます。
- `hooks.allowedAgentIds` を設定して、明示的な `agentId` ルーティングを制限してください。
- 呼び出し元によるセッション選択が必要でない限り、`hooks.allowRequestSessionKey=false` のままにしてください。
- `hooks.allowRequestSessionKey` を有効にする場合は、許可するセッションキーの形状を制約するために `hooks.allowedSessionKeyPrefixes` も設定してください。
- hook ペイロードはデフォルトで安全境界にラップされます。

</Warning>

## Gmail PubSub 統合

Google PubSub 経由で Gmail 受信箱トリガーを OpenClaw に接続します。

<Note>
**前提条件:** `gcloud` CLI、`gog`（gogcli）、OpenClaw hooks 有効化、公開 HTTPS エンドポイント用の Tailscale。
</Note>

### ウィザード設定（推奨）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

これにより `hooks.gmail` 設定が書き込まれ、Gmail プリセットが有効になり、プッシュエンドポイントに Tailscale Funnel が使用されます。

### Gateway 自動起動

`hooks.enabled=true` で `hooks.gmail.account` が設定されている場合、Gateway は起動時に `gog gmail watch serve` を開始し、watch を自動更新します。オプトアウトするには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定します。

### 手動の 1 回限り設定

<Steps>
  <Step title="GCP プロジェクトを選択">
    `gog` が使用する OAuth クライアントを所有する GCP プロジェクトを選択します。

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="トピックを作成し、Gmail プッシュアクセスを付与">
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
モデル上書きに関する注記:

- `openclaw cron add|edit --model ...` はジョブで選択されたモデルを変更します。
- モデルが許可されている場合、その正確なプロバイダー/モデルが分離エージェント実行に届きます。
- 許可されていない、または解決できない場合、cron は明示的な検証エラーで実行を失敗させます。
- 設定済みのフォールバックチェーンは引き続き適用されます。cron `--model` はジョブの primary であり、セッションの `/model` 上書きではないためです。
- ペイロードの `fallbacks` は、そのジョブの設定済みフォールバックを置き換えます。`fallbacks: []` はフォールバックを無効にし、実行を strict にします。
- 明示的または設定済みのフォールバックリストがない単純な `--model` は、暗黙の追加リトライターゲットとしてエージェント primary にフォールスルーしません。

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

`maxConcurrentRuns` は、スケジュールされた cron ディスパッチと分離エージェントターン実行の両方を制限します。分離 cron エージェントターンは内部的にキュー専用の `cron-nested` 実行レーンを使用するため、この値を増やすと、独立した cron LLM 実行が外側の cron ラッパーの開始だけでなく並列に進行できます。共有の非 cron `nested` レーンは、この設定では拡張されません。

ランタイム状態 sidecar は `cron.store` から派生します。`~/clawd/cron/jobs.json` のような `.json` store は `~/clawd/cron/jobs-state.json` を使用し、`.json` サフィックスのない store パスには `-state.json` が追加されます。

`jobs.json` を手動編集する場合は、`jobs-state.json` をソース管理に含めないでください。OpenClaw はその sidecar を、保留中のスロット、アクティブマーカー、最終実行メタデータ、および外部で編集されたジョブに新しい `nextRunAtMs` が必要なタイミングをスケジューラーに伝えるスケジュール ID に使用します。

cron を無効化: `cron.enabled: false` または `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="リトライ動作">
    **1 回限りのリトライ**: 一時的なエラー（レート制限、過負荷、ネットワーク、サーバーエラー）は、指数バックオフで最大 3 回リトライされます。永続的なエラーは即座に無効化します。

    **繰り返しリトライ**: リトライ間に指数バックオフ（30 秒から 60 分）が入ります。バックオフは次回の成功実行後にリセットされます。

  </Accordion>
  <Accordion title="メンテナンス">
    `cron.sessionRetention`（デフォルト `24h`）は分離実行セッションエントリを prune します。`cron.runLog.maxBytes` / `cron.runLog.keepLines` は実行ログファイルを自動 prune します。
  </Accordion>
</AccordionGroup>

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

<AccordionGroup>
  <Accordion title="Cron が起動しない">
    - `cron.enabled` と `OPENCLAW_SKIP_CRON` 環境変数を確認してください。
    - Gateway が継続的に実行されていることを確認してください。
    - `cron` スケジュールでは、タイムゾーン（`--tz`）とホストのタイムゾーンを確認してください。
    - 実行出力の `reason: not-due` は、手動実行が `openclaw cron run <jobId> --due` でチェックされ、ジョブがまだ期日ではなかったことを意味します。

  </Accordion>
  <Accordion title="Cron は起動したが配信されない">
    - 配信モード `none` では、runner のフォールバック送信は想定されません。チャットルートが利用できる場合、エージェントは `message` ツールで直接送信できます。
    - 配信先（`channel`/`to`）がない、または無効な場合、アウトバウンドはスキップされます。
    - Matrix では、コピーされたジョブや従来のジョブで小文字化された `delivery.to` のルーム ID を使うと、Matrix のルーム ID は大文字と小文字を区別するため失敗することがあります。Matrix から取得した正確な `!room:server` または `room:!room:server` の値にジョブを編集してください。
    - チャネル認証エラー（`unauthorized`、`Forbidden`）は、認証情報によって配信がブロックされたことを意味します。
    - 分離実行がサイレントトークン（`NO_REPLY` / `no_reply`）だけを返す場合、OpenClaw は直接のアウトバウンド配信を抑制し、フォールバックのキュー済み要約経路も抑制するため、チャットには何も投稿されません。
    - エージェント自身がユーザーにメッセージを送る必要がある場合、ジョブに利用可能なルート（以前のチャットがある `channel: "last"`、または明示的なチャネル/ターゲット）があることを確認してください。

  </Accordion>
  <Accordion title="Cron または Heartbeat が /new-style のロールオーバーを妨げているように見える">
    - 日次リセットとアイドルリセットの新しさは `updatedAt` に基づきません。[セッション管理](/ja-JP/concepts/session#session-lifecycle)を参照してください。
    - Cron のウェイクアップ、Heartbeat 実行、exec 通知、Gateway のブックキーピングはルーティング/ステータスのためにセッション行を更新することがありますが、`sessionStartedAt` や `lastInteractionAt` は延長しません。
    - これらのフィールドが存在する前に作成された従来の行については、ファイルがまだ利用できる場合、OpenClaw は transcript JSONL のセッションヘッダーから `sessionStartedAt` を復元できます。`lastInteractionAt` がない従来のアイドル行では、その復元された開始時刻をアイドルの基準として使います。

  </Accordion>
  <Accordion title="タイムゾーンの落とし穴">
    - `--tz` なしの Cron は Gateway ホストのタイムゾーンを使います。
    - タイムゾーンなしの `at` スケジュールは UTC として扱われます。
    - Heartbeat の `activeHours` は、設定されたタイムゾーン解決を使います。

  </Accordion>
</AccordionGroup>

## 関連

- [自動化とタスク](/ja-JP/automation) — すべての自動化機構の概要
- [バックグラウンドタスク](/ja-JP/automation/tasks) — Cron 実行用のタスク台帳
- [Heartbeat](/ja-JP/gateway/heartbeat) — 定期的なメインセッションターン
- [タイムゾーン](/ja-JP/concepts/timezone) — タイムゾーン設定

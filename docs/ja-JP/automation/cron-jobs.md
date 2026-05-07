---
read_when:
    - バックグラウンドジョブまたはウェイクアップのスケジュール設定
    - 外部トリガー（Webhook、Gmail）を OpenClaw に接続する
    - スケジュールされたタスクで Heartbeat と Cron のどちらを使うかを決める
sidebarTitle: Scheduled tasks
summary: Gateway スケジューラー向けのスケジュール済みジョブ、Webhook、Gmail PubSub トリガー
title: スケジュール済みタスク
x-i18n:
    generated_at: "2026-05-07T13:13:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19c3505408ab7602775dc1168c2c7a626986fa2a15ef02a44dc864d5ec538bfe
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron は Gateway の組み込みスケジューラです。ジョブを永続化し、適切な時刻にエージェントを起動し、出力をチャットチャンネルまたは Webhook エンドポイントへ返すことができます。

## クイックスタート

<Steps>
  <Step title="ワンショットリマインダーを追加する">
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

- Cron は（モデル内ではなく）**Gateway 内**のプロセスで実行されます。
- ジョブ定義は `~/.openclaw/cron/jobs.json` に永続化されるため、再起動してもスケジュールは失われません。
- ランタイム実行状態は、その隣の `~/.openclaw/cron/jobs-state.json` に永続化されます。cron 定義を git で管理する場合は、`jobs.json` を管理対象にし、`jobs-state.json` を gitignore してください。
- 分割後、古い OpenClaw バージョンは `jobs.json` を読み取れますが、ランタイムフィールドが現在は `jobs-state.json` にあるため、ジョブを新規として扱う場合があります。
- Gateway の実行中または停止中に `jobs.json` が編集されると、OpenClaw は変更されたスケジュールフィールドを保留中のランタイムスロットメタデータと比較し、古くなった `nextRunAtMs` 値をクリアします。純粋なフォーマット変更やキー順序だけの書き換えでは、保留中のスロットは保持されます。
- すべての cron 実行は [バックグラウンドタスク](/ja-JP/automation/tasks) レコードを作成します。
- Gateway 起動時、期限を過ぎた isolated エージェントターンジョブは即座に再実行されるのではなく、チャンネル接続ウィンドウの外へ再スケジュールされるため、再起動後も Discord/Telegram の起動とネイティブコマンド設定の応答性が保たれます。
- ワンショットジョブ（`--at`）は、既定で成功後に自動削除されます。
- isolated cron 実行では、実行完了時に `cron:<jobId>` セッション用に追跡されたブラウザータブ/プロセスをベストエフォートで閉じるため、切り離されたブラウザー自動化が孤立プロセスを残しません。
- 狭い cron 自己クリーンアップ権限を受け取った isolated cron 実行は、引き続きスケジューラの状態と自分の現在のジョブに自己フィルタリングされたリストを読み取れるため、ステータス/Heartbeat チェックは、より広範な cron 変更アクセスを得ることなく自身のスケジュールを検査できます。
- isolated cron 実行は、古い確認応答の返信に対してもガードします。最初の結果が単なる途中ステータス更新（`on it`、`pulling everything together`、および類似のヒント）で、最終回答をまだ担当している子孫サブエージェント実行がない場合、OpenClaw は配信前に実際の結果を一度だけ再プロンプトします。
- isolated cron 実行は、まず埋め込み実行からの構造化された実行拒否メタデータを優先し、その後 `SYSTEM_RUN_DENIED` や `INVALID_REQUEST` などの既知の最終サマリー/出力マーカーへフォールバックするため、ブロックされたコマンドが成功した実行として報告されません。
- isolated cron 実行は、返信ペイロードが生成されない場合でも、実行レベルのエージェント失敗をジョブエラーとして扱うため、モデル/プロバイダーの失敗はジョブを成功としてクリアするのではなく、エラーカウンターを増やして失敗通知をトリガーします。
- isolated エージェントターンジョブが `timeoutSeconds` に達すると、cron は基盤となるエージェント実行を中止し、短いクリーンアップウィンドウを与えます。実行が終了しない場合、Gateway 所有のクリーンアップが cron によるタイムアウト記録の前にその実行のセッション所有権を強制的にクリアするため、キューされたチャット作業が古い処理中セッションの背後に残されません。

<a id="maintenance"></a>

<Note>
cron のタスク調整では、まずランタイム所有が優先され、次に永続履歴が裏付けになります。古い子セッション行がまだ存在していても、cron ランタイムがそのジョブを実行中として追跡している間、アクティブな cron タスクはライブのままです。ランタイムがジョブの所有をやめ、5 分の猶予ウィンドウが期限切れになると、メンテナンスは一致する `cron:<jobId>:<startedAt>` 実行について、永続化された実行ログとジョブ状態を確認します。その永続履歴が終端結果を示している場合、タスク台帳はそこから確定されます。それ以外の場合、Gateway 所有のメンテナンスはタスクを `lost` としてマークできます。オフライン CLI 監査は永続履歴から復旧できますが、自身の空のインプロセス active-job セットを、Gateway 所有の cron 実行が消えた証拠として扱うことはありません。
</Note>

## スケジュールの種類

| 種類    | CLI フラグ  | 説明                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | ワンショットタイムスタンプ（ISO 8601 または `20m` のような相対指定）    |
| `every` | `--every` | 固定間隔                                          |
| `cron`  | `--cron`  | 任意の `--tz` を伴う 5 フィールドまたは 6 フィールドの cron 式 |

タイムゾーンのないタイムスタンプは UTC として扱われます。ローカルの壁時計時刻でスケジュールするには `--tz America/New_York` を追加してください。

毎時ちょうどの再帰式は、負荷スパイクを減らすため最大 5 分まで自動的にずらされます。正確なタイミングを強制するには `--exact` を使用し、明示的なウィンドウには `--stagger 30s` を使用します。

### 月の日付と曜日は OR ロジックを使用します

Cron 式は [croner](https://github.com/Hexagon/croner) によって解析されます。月の日付フィールドと曜日フィールドの両方がワイルドカードでない場合、croner は両方ではなく、**どちらか一方**のフィールドが一致したときに一致とします。これは標準的な Vixie cron の動作です。

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

これは月に 0〜1 回ではなく、約 5〜6 回発火します。OpenClaw はここで Croner の既定の OR 動作を使用します。両方の条件を必須にするには、Croner の `+` 曜日修飾子（`0 9 15 * +1`）を使用するか、一方のフィールドでスケジュールし、もう一方をジョブのプロンプトまたはコマンドでガードしてください。

## 実行スタイル

| スタイル           | `--session` 値   | 実行場所                  | 最適な用途                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| メインセッション    | `main`              | 次の Heartbeat ターン      | リマインダー、システムイベント        |
| Isolated        | `isolated`          | 専用の `cron:<jobId>` | レポート、バックグラウンド作業      |
| 現在のセッション | `current`           | 作成時にバインド   | コンテキストを意識した再帰作業    |
| カスタムセッション  | `session:custom-id` | 永続的な名前付きセッション | 履歴を積み上げるワークフロー |

<AccordionGroup>
  <Accordion title="メインセッション、isolated、カスタムの違い">
    **メインセッション**ジョブはシステムイベントをキューに入れ、任意で Heartbeat を起動します（`--wake now` または `--wake next-heartbeat`）。これらのシステムイベントは、対象セッションの日次/アイドルリセットの鮮度を延長しません。**isolated** ジョブは、新しいセッションで専用のエージェントターンを実行します。**カスタムセッション**（`session:xxx`）は実行間でコンテキストを永続化し、以前のサマリーを土台にする日次スタンドアップのようなワークフローを可能にします。
  </Accordion>
  <Accordion title="isolated ジョブにおける「新しいセッション」の意味">
    isolated ジョブでは、「新しいセッション」とは各実行ごとに新しいトランスクリプト/セッション ID を意味します。OpenClaw は思考/高速/詳細設定、ラベル、明示的にユーザーが選択したモデル/認証オーバーライドなどの安全な設定を引き継ぐ場合がありますが、古い cron 行から周囲の会話コンテキスト、つまりチャンネル/グループルーティング、送信またはキューポリシー、昇格、オリジン、ACP ランタイムバインディングは継承しません。再帰ジョブが同じ会話コンテキストを意図的に土台にする必要がある場合は、`current` または `session:<id>` を使用してください。
  </Accordion>
  <Accordion title="ランタイムクリーンアップ">
    isolated ジョブでは、ランタイムのティアダウンに、その cron セッションのベストエフォートなブラウザークリーンアップが含まれるようになりました。実際の cron 結果を優先するため、クリーンアップ失敗は無視されます。

    isolated cron 実行は、ジョブ用に作成されたバンドル MCP ランタイムインスタンスも、共有ランタイムクリーンアップパスを通じて破棄します。これはメインセッションおよびカスタムセッションの MCP クライアントがティアダウンされる方法と一致するため、isolated cron ジョブが stdio 子プロセスや長寿命 MCP 接続を実行間でリークしません。

  </Accordion>
  <Accordion title="サブエージェントと Discord 配信">
    isolated cron 実行がサブエージェントを編成する場合、配信も古い親の途中テキストより最終的な子孫出力を優先します。子孫がまだ実行中の場合、OpenClaw はそれを通知するのではなく、その部分的な親更新を抑制します。

    テキストのみの Discord announce ターゲットでは、OpenClaw はストリーミング/中間テキストペイロードと最終回答の両方を再生するのではなく、正規の最終アシスタントテキストを一度だけ送信します。添付ファイルやコンポーネントが落ちないよう、メディアおよび構造化 Discord ペイロードは引き続き個別のペイロードとして配信されます。

  </Accordion>
</AccordionGroup>

### isolated ジョブのペイロードオプション

<ParamField path="--message" type="string" required>
  プロンプトテキスト（isolated では必須）。
</ParamField>
<ParamField path="--model" type="string">
  モデルオーバーライド。ジョブに対して選択された許可済みモデルを使用します。
</ParamField>
<ParamField path="--thinking" type="string">
  思考レベルのオーバーライド。
</ParamField>
<ParamField path="--light-context" type="boolean">
  ワークスペースのブートストラップファイル注入をスキップします。
</ParamField>
<ParamField path="--tools" type="string">
  ジョブが使用できるツールを制限します。例: `--tools exec,read`。
</ParamField>

`--model` は、そのジョブのプライマリモデルとして、選択された許可済みモデルを使用します。これはチャットセッションの `/model` オーバーライドとは異なります。ジョブのプライマリが失敗した場合でも、設定済みのフォールバックチェーンは引き続き適用されます。要求されたモデルが許可されていない、または解決できない場合、cron はジョブのエージェント/既定モデル選択へ黙ってフォールバックするのではなく、明示的な検証エラーで実行を失敗させます。

Cron ジョブはペイロードレベルの `fallbacks` も持つことができます。存在する場合、そのリストはジョブの設定済みフォールバックチェーンを置き換えます。選択されたモデルだけを試す厳密な cron 実行にしたい場合は、ジョブのペイロード/API で `fallbacks: []` を使用してください。ジョブに `--model` があり、ペイロードにも設定済みフォールバックにもフォールバックがない場合、OpenClaw は明示的な空のフォールバックオーバーライドを渡すため、エージェントのプライマリが隠れた追加再試行ターゲットとして追加されることはありません。

isolated ジョブのモデル選択の優先順位は次のとおりです。

1. Gmail フックのモデルオーバーライド（実行が Gmail 由来で、そのオーバーライドが許可されている場合）
2. ジョブごとのペイロード `model`
3. ユーザーが選択して保存した cron セッションのモデルオーバーライド
4. エージェント/既定のモデル選択

高速モードも解決済みのライブ選択に従います。選択されたモデル設定に `params.fastMode` がある場合、isolated cron は既定でそれを使用します。保存されたセッションの `fastMode` オーバーライドは、どちらの方向でも設定より優先されます。

isolated 実行がライブのモデル切り替えハンドオフに達した場合、cron は切り替え後のプロバイダー/モデルで再試行し、再試行前にそのライブ選択をアクティブな実行に永続化します。切り替えが新しい認証プロファイルも伴う場合、cron はその認証プロファイルのオーバーライドもアクティブな実行に永続化します。再試行には上限があります。初回試行に加えて 2 回の切り替え再試行後、cron は無限ループせずに中止します。

isolated cron 実行がエージェントランナーに入る前に、OpenClaw は、`baseUrl` が local loopback、プライベートネットワーク、または `.local` である設定済みの `api: "ollama"` および `api: "openai-completions"` プロバイダーについて、到達可能なローカルプロバイダーエンドポイントを確認します。そのエンドポイントがダウンしている場合、実行はモデル呼び出しを開始するのではなく、明確なプロバイダー/モデルエラー付きで `skipped` として記録されます。エンドポイント結果は 5 分間キャッシュされるため、同じ停止中のローカル Ollama、vLLM、SGLang、または LM Studio サーバーを使用する多数の期限到来ジョブは、リクエストの嵐を作るのではなく、1 回の小さなプローブを共有します。スキップされたプロバイダー事前チェック実行は、実行エラーのバックオフを増やしません。スキップ通知を繰り返し受け取りたい場合は、`failureAlert.includeSkipped` を有効にしてください。

## 配信と出力

| モード       | 起こること                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | エージェントが送信しなかった場合、最終テキストをターゲットへフォールバック配信します |
| `webhook`  | 完了イベントペイロードを URL に POST します                                |
| `none`     | ランナーのフォールバック配信はありません                                         |

`--announce --channel telegram --to "-1001234567890"` を使用してチャンネル配信します。Telegram フォーラムトピックでは `-1001234567890:topic:123` を使用します。直接の RPC/config 呼び出し側は、`delivery.threadId` を文字列または数値として渡すこともできます。Slack/Discord/Mattermost の送信先には、明示的なプレフィックス（`channel:<id>`、`user:<id>`）を使用してください。Matrix のルーム ID は大文字小文字を区別します。正確なルーム ID、または Matrix の `room:!room:server` 形式を使用してください。

announce 配信で `channel: "last"` を使用するか `channel` を省略した場合、cron がセッション履歴または単一の設定済みチャンネルへフォールバックする前に、`telegram:123` のようなプロバイダープレフィックス付き送信先でチャンネルを選択できます。読み込まれた plugin が公開しているプレフィックスのみがプロバイダーセレクターです。`delivery.channel` が明示されている場合、送信先プレフィックスは同じプロバイダーを指定する必要があります。たとえば、`channel: "whatsapp"` と `to: "telegram:123"` の組み合わせは、WhatsApp が Telegram ID を電話番号として解釈するのではなく拒否されます。`channel:<id>`、`user:<id>`、`imessage:<handle>`、`sms:<number>` のような送信先種別およびサービスのプレフィックスは、プロバイダーセレクターではなく、チャンネルが所有する送信先構文のままです。

isolated ジョブでは、チャット配信は共有されます。チャットルートが利用可能な場合、ジョブが `--no-deliver` を使用していても、エージェントは `message` ツールを使用できます。エージェントが設定済みまたは現在の送信先に送信した場合、OpenClaw はフォールバック announce をスキップします。それ以外の場合、`announce`、`webhook`、`none` は、エージェントターン後の最終返信を runner がどう扱うかだけを制御します。

エージェントがアクティブなチャットから isolated リマインダーを作成すると、OpenClaw はフォールバック announce ルート用に保持されたライブ配信先を保存します。内部セッションキーは小文字の場合があります。現在のチャットコンテキストが利用可能な場合、プロバイダー配信先はそれらのキーから再構築されません。

暗黙的な announce 配信では、設定済みチャンネルの allowlist を使用して古い送信先を検証し、再ルーティングします。DM の pairing-store 承認はフォールバック自動化の受信者ではありません。スケジュール済みジョブが DM に能動的に送信する必要がある場合は、`delivery.to` を設定するか、チャンネルの `allowFrom` エントリを設定してください。

失敗通知は別の送信先パスに従います。

- `cron.failureDestination` は失敗通知のグローバル既定値を設定します。
- `job.delivery.failureDestination` はジョブごとにそれを上書きします。
- どちらも設定されておらず、そのジョブがすでに `announce` で配信している場合、失敗通知はその主要な announce 送信先にフォールバックするようになりました。
- `delivery.failureDestination` は、主要な配信モードが `webhook` でない限り、`sessionTarget="isolated"` ジョブでのみサポートされます。
- `failureAlert.includeSkipped: true` は、ジョブまたはグローバル cron アラートポリシーで、繰り返しのスキップ実行アラートを有効にします。スキップされた実行は別の連続スキップカウンターを保持するため、実行エラーのバックオフには影響しません。

## CLI 例

<Tabs>
  <Tab title="1回限りのリマインダー">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="繰り返しの isolated ジョブ">
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

すべてのリクエストは、ヘッダーで hook token を含める必要があります。

- `Authorization: Bearer <token>`（推奨）
- `x-openclaw-token: <token>`

クエリ文字列の token は拒否されます。

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    main セッションの system event をキューに入れます。

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
    isolated エージェントターンを実行します。

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    フィールド: `message`（必須）、`name`、`agentId`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`fallbacks`、`thinking`、`timeoutSeconds`。

  </Accordion>
  <Accordion title="マップ済み hook（POST /hooks/<name>）">
    カスタム hook 名は config の `hooks.mappings` で解決されます。マッピングでは、テンプレートまたはコード変換を使って任意の payload を `wake` または `agent` アクションに変換できます。
  </Accordion>
</AccordionGroup>

<Warning>
hook エンドポイントは loopback、tailnet、または信頼できるリバースプロキシの背後に置いてください。

- 専用の hook token を使用してください。gateway auth token を再利用しないでください。
- `hooks.path` は専用のサブパスにしてください。`/` は拒否されます。
- `hooks.allowedAgentIds` を設定して、明示的な `agentId` ルーティングを制限してください。
- 呼び出し側がセッションを選択する必要がない限り、`hooks.allowRequestSessionKey=false` のままにしてください。
- `hooks.allowRequestSessionKey` を有効にする場合は、`hooks.allowedSessionKeyPrefixes` も設定して、許可される session key の形を制約してください。
- hook payload は既定で安全境界に包まれます。

</Warning>

## Gmail PubSub 連携

Google PubSub 経由で Gmail 受信トレイトリガーを OpenClaw に接続します。

<Note>
**前提条件:** `gcloud` CLI、`gog`（gogcli）、OpenClaw hooks 有効化、公開 HTTPS エンドポイント用の Tailscale。
</Note>

### ウィザード設定（推奨）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

これは `hooks.gmail` config を書き込み、Gmail プリセットを有効にし、push エンドポイントに Tailscale Funnel を使用します。

### Gateway 自動起動

`hooks.enabled=true` かつ `hooks.gmail.account` が設定されている場合、Gateway は起動時に `gog gmail watch serve` を開始し、watch を自動更新します。無効にするには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定します。

### 手動の一回限りの設定

<Steps>
  <Step title="GCP プロジェクトを選択">
    `gog` で使用される OAuth client を所有する GCP プロジェクトを選択します。

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="topic を作成して Gmail push アクセスを付与">
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

- `openclaw cron add|edit --model ...` はジョブで選択されるモデルを変更します。
- モデルが許可されている場合、その正確な provider/model が isolated エージェント実行に渡されます。
- 許可されていない、または解決できない場合、cron は明示的な検証エラーで実行を失敗させます。
- cron `--model` はジョブの primary であり、セッションの `/model` 上書きではないため、設定済みの fallback chain は引き続き適用されます。
- Payload の `fallbacks` は、そのジョブの設定済み fallback を置き換えます。`fallbacks: []` は fallback を無効にし、実行を strict にします。
- 明示的または設定済みの fallback list がない単純な `--model` は、暗黙の追加再試行先として agent primary にフォールスルーしません。

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

`maxConcurrentRuns` は、スケジュール済み cron dispatch と isolated エージェントターン実行の両方を制限します。isolated cron エージェントターンは、内部的にキュー専用の `cron-nested` 実行 lane を使用するため、この値を上げると、外側の cron wrapper だけを開始するのではなく、独立した cron LLM 実行を並列に進められます。共有の非 cron `nested` lane は、この設定では拡張されません。

runtime state sidecar は `cron.store` から派生します。`~/clawd/cron/jobs.json` のような `.json` store は `~/clawd/cron/jobs-state.json` を使用し、`.json` suffix のない store path には `-state.json` が追加されます。

`jobs.json` を手動編集する場合は、`jobs-state.json` をソース管理に入れないでください。OpenClaw はその sidecar を pending slot、active marker、last-run metadata、および外部編集されたジョブに新しい `nextRunAtMs` が必要なタイミングを scheduler に伝える schedule identity に使用します。

cron を無効化: `cron.enabled: false` または `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="再試行動作">
    **1回限りの再試行**: 一時的なエラー（rate limit、overload、network、server error）は、指数バックオフで最大3回再試行します。永続的なエラーは即座に無効化されます。

    **繰り返しの再試行**: 再試行間に指数バックオフ（30秒から60分）を使用します。次に成功した実行後、バックオフはリセットされます。

  </Accordion>
  <Accordion title="メンテナンス">
    `cron.sessionRetention`（既定値 `24h`）は isolated run-session エントリを削除します。`cron.runLog.maxBytes` / `cron.runLog.keepLines` は run-log ファイルを自動削除します。
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
    - `cron.enabled` と `OPENCLAW_SKIP_CRON` env var を確認します。
    - Gateway が継続的に実行されていることを確認します。
    - `cron` schedule では、timezone（`--tz`）と host timezone を確認します。
    - run output の `reason: not-due` は、手動実行が `openclaw cron run <jobId> --due` で確認され、ジョブの期限がまだ来ていないことを意味します。

  </Accordion>
  <Accordion title="Cron は起動したが配信されない">
    - 配信モード `none` は、runner のフォールバック送信が想定されないことを意味します。チャットルートが利用可能な場合、エージェントは引き続き `message` ツールで直接送信できます。
    - 配信先が欠落しているか無効（`channel`/`to`）な場合、アウトバウンド送信はスキップされます。
    - Matrix では、コピーされたジョブやレガシージョブで小文字化された `delivery.to` ルーム ID を使っていると失敗することがあります。Matrix のルーム ID は大文字小文字を区別するためです。ジョブを Matrix の正確な `!room:server` または `room:!room:server` 値に編集してください。
    - チャンネル認証エラー（`unauthorized`、`Forbidden`）は、認証情報によって配信がブロックされたことを意味します。
    - 分離実行がサイレントトークン（`NO_REPLY` / `no_reply`）だけを返す場合、OpenClaw は直接のアウトバウンド配信を抑止し、フォールバックのキュー済み要約パスも抑止するため、チャットには何も投稿されません。
    - エージェント自身がユーザーにメッセージを送るべき場合は、ジョブに利用可能なルート（以前のチャットがある `channel: "last"`、または明示的なチャンネル/ターゲット）があることを確認してください。

  </Accordion>
  <Accordion title="Cron または Heartbeat が /new-style ロールオーバーを妨げているように見える">
    - 日次リセットとアイドルリセットの鮮度は `updatedAt` に基づきません。[セッション管理](/ja-JP/concepts/session#session-lifecycle)を参照してください。
    - Cron のウェイクアップ、Heartbeat 実行、exec 通知、Gateway のブックキーピングは、ルーティング/ステータスのためにセッション行を更新することがありますが、`sessionStartedAt` や `lastInteractionAt` は延長しません。
    - これらのフィールドが存在する前に作成されたレガシー行では、ファイルがまだ利用可能な場合、OpenClaw は transcript JSONL セッションヘッダーから `sessionStartedAt` を復元できます。`lastInteractionAt` のないレガシーのアイドル行は、その復元された開始時刻をアイドル基準として使用します。

  </Accordion>
  <Accordion title="タイムゾーンの注意点">
    - `--tz` なしの Cron は、Gateway ホストのタイムゾーンを使用します。
    - タイムゾーンなしの `at` スケジュールは UTC として扱われます。
    - Heartbeat の `activeHours` は、設定されたタイムゾーン解決を使用します。

  </Accordion>
</AccordionGroup>

## 関連

- [自動化とタスク](/ja-JP/automation) — すべての自動化メカニズムの概要
- [バックグラウンドタスク](/ja-JP/automation/tasks) — Cron 実行のタスク台帳
- [Heartbeat](/ja-JP/gateway/heartbeat) — 定期的なメインセッションターン
- [タイムゾーン](/ja-JP/concepts/timezone) — タイムゾーン設定

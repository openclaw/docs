---
read_when:
    - バックグラウンドジョブまたはウェイクアップのスケジュール設定
    - 外部トリガー（Webhook、Gmail）をOpenClawに接続する
    - スケジュールされたタスクで Heartbeat と Cron のどちらを選ぶか
sidebarTitle: Scheduled tasks
summary: Gateway スケジューラー向けのスケジュール済みジョブ、Webhook、および Gmail PubSub トリガー
title: スケジュールされたタスク
x-i18n:
    generated_at: "2026-05-10T19:20:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: b837fc5c4cd2647bdab98b0421d2f89a528164c8eb93e7851428c73f8f59dccb
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron は Gateway に組み込まれたスケジューラです。ジョブを永続化し、適切な時刻にエージェントを起動し、出力をチャットチャネルまたは Webhook エンドポイントへ返すことができます。

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

- Cron は **Gateway の内部** プロセスで実行されます（モデルの内部ではありません）。
- ジョブ定義は `~/.openclaw/cron/jobs.json` に永続化されるため、再起動してもスケジュールは失われません。
- ランタイム実行状態は、その隣の `~/.openclaw/cron/jobs-state.json` に永続化されます。cron 定義を git で管理する場合は、`jobs.json` を管理対象にし、`jobs-state.json` は gitignore してください。
- 分割後は、古い OpenClaw バージョンでも `jobs.json` を読み取れますが、ランタイムフィールドが `jobs-state.json` に移動したため、ジョブを新規として扱う場合があります。
- Gateway の実行中または停止中に `jobs.json` が編集されると、OpenClaw は変更されたスケジュールフィールドを保留中のランタイムスロットメタデータと比較し、古い `nextRunAtMs` 値をクリアします。純粋な書式変更やキー順序のみの書き換えでは、保留中のスロットは維持されます。
- すべての cron 実行は [バックグラウンドタスク](/ja-JP/automation/tasks) レコードを作成します。
- Gateway 起動時、期限を過ぎた隔離エージェントターンのジョブは、即時に再生されるのではなく、チャネル接続ウィンドウの外へ再スケジュールされます。そのため、再起動後も Discord/Telegram の起動とネイティブコマンド設定の応答性が保たれます。
- 1 回限りのジョブ（`--at`）は、デフォルトで成功後に自動削除されます。
- 隔離 cron 実行は、実行完了時に `cron:<jobId>` セッションの追跡対象ブラウザータブやプロセスをベストエフォートで閉じるため、切り離されたブラウザー自動化が孤立プロセスを残しません。
- 狭い cron 自己クリーンアップ権限を受け取った隔離 cron 実行は、スケジューラの状態、自身の現在のジョブだけにフィルターされた一覧、およびそのジョブの実行履歴を引き続き読み取れます。そのため、状態確認や Heartbeat チェックは、より広範な cron 変更アクセスを得ることなく自身のスケジュールを検査できます。
- 隔離 cron 実行は、古い確認応答の返信も防ぎます。最初の結果が単なる暫定ステータス更新（`on it`、`pulling everything together`、および類似のヒント）で、最終回答に責任を持つ子孫サブエージェント実行がまだ存在しない場合、OpenClaw は配信前に実際の結果を一度だけ再プロンプトします。
- 隔離 cron 実行は、まず埋め込み実行からの構造化された実行拒否メタデータを優先し、その後 `SYSTEM_RUN_DENIED` や `INVALID_REQUEST` などの既知の最終サマリー/出力マーカーへフォールバックします。そのため、ブロックされたコマンドが成功した実行として報告されません。
- 隔離 cron 実行は、返信ペイロードが生成されない場合でも、実行レベルのエージェント失敗をジョブエラーとして扱います。そのため、モデル/プロバイダーの失敗はエラーカウンターを増やし、ジョブを成功としてクリアするのではなく失敗通知をトリガーします。
- 隔離エージェントターンジョブが `timeoutSeconds` に達すると、cron は基盤となるエージェント実行を中止し、短いクリーンアップウィンドウを与えます。実行が排出されない場合、Gateway 所有のクリーンアップが、その実行のセッション所有権を強制的にクリアしてから cron がタイムアウトを記録します。そのため、キューに入ったチャット作業が古い処理中セッションの背後に残されません。
- 隔離エージェントターンがランナー開始前、または最初のモデル呼び出し前に停止すると、cron は `setup timed out before runner start` や `stalled before first model call (last phase: context-engine)` など、フェーズ固有のタイムアウトを記録します。これらのウォッチドッグは、外部 CLI プロセスが実際に開始される前の埋め込みプロバイダーと CLI バックエンドのプロバイダーを対象とし、長い `timeoutSeconds` 値とは独立して上限が設けられているため、コールドスタート、認証、コンテキストの失敗がジョブ全体の予算を待たずに素早く表面化します。

<a id="maintenance"></a>

<Note>
cron のタスク調整では、まずランタイム所有が優先され、次に永続履歴が使用されます。cron ランタイムがそのジョブを実行中として追跡している間は、古い子セッション行がまだ存在していても、アクティブな cron タスクはライブのままです。ランタイムがジョブの所有を停止し、5 分間の猶予ウィンドウが期限切れになると、メンテナンスは一致する `cron:<jobId>:<startedAt>` 実行について、永続化された実行ログとジョブ状態を確認します。その永続履歴が終端結果を示す場合、タスク台帳はそこから確定されます。それ以外の場合、Gateway 所有のメンテナンスはタスクを `lost` としてマークできます。オフライン CLI 監査は永続履歴から復旧できますが、自身のプロセス内アクティブジョブセットが空であることを、Gateway 所有の cron 実行が消失した証拠として扱うことはありません。
</Note>

## スケジュール種別

| 種別    | CLI フラグ  | 説明                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | 1 回限りのタイムスタンプ（ISO 8601、または `20m` のような相対指定）    |
| `every` | `--every` | 固定間隔                                          |
| `cron`  | `--cron`  | 任意の `--tz` を伴う 5 フィールドまたは 6 フィールドの cron 式 |

タイムゾーンのないタイムスタンプは UTC として扱われます。ローカルの壁時計時刻でスケジュールするには `--tz America/New_York` を追加してください。

毎時ちょうどの繰り返し式は、負荷スパイクを減らすために最大 5 分まで自動的に分散されます。正確な時刻を強制するには `--exact` を使用し、明示的なウィンドウには `--stagger 30s` を使用してください。

### 日と曜日は OR ロジックを使用します

Cron 式は [croner](https://github.com/Hexagon/croner) によって解析されます。日フィールドと曜日フィールドの両方がワイルドカードでない場合、croner は **どちらか一方** のフィールドが一致したときに一致とします。両方ではありません。これは標準的な Vixie cron の動作です。

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

これは月に 0〜1 回ではなく、約 5〜6 回発火します。OpenClaw はここで Croner のデフォルトの OR 動作を使用します。両方の条件を必須にするには、Croner の `+` 曜日修飾子（`0 9 15 * +1`）を使用するか、一方のフィールドでスケジュールし、もう一方をジョブのプロンプトまたはコマンド内でガードしてください。

## 実行スタイル

| スタイル           | `--session` 値   | 実行場所                  | 最適な用途                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| メインセッション    | `main`              | 次の Heartbeat ターン      | リマインダー、システムイベント        |
| 隔離        | `isolated`          | 専用の `cron:<jobId>` | レポート、バックグラウンド作業      |
| 現在のセッション | `current`           | 作成時にバインド   | コンテキストを意識した繰り返し作業    |
| カスタムセッション  | `session:custom-id` | 永続的な名前付きセッション | 履歴を積み上げるワークフロー |

<AccordionGroup>
  <Accordion title="メインセッション、隔離、カスタムの違い">
    **メインセッション** ジョブはシステムイベントをキューに入れ、必要に応じて Heartbeat を起動します（`--wake now` または `--wake next-heartbeat`）。これらのシステムイベントは、対象セッションの日次/アイドルリセットの鮮度を延長しません。**隔離** ジョブは、新しいセッションで専用のエージェントターンを実行します。**カスタムセッション**（`session:xxx`）は実行間でコンテキストを永続化し、前回の要約を積み上げる日次スタンドアップのようなワークフローを可能にします。
  </Accordion>
  <Accordion title="隔離ジョブにおける「新しいセッション」の意味">
    隔離ジョブでは、「新しいセッション」とは各実行ごとの新しいトランスクリプト/セッション ID を意味します。OpenClaw は、思考/高速/詳細設定、ラベル、明示的にユーザーが選択したモデル/認証オーバーライドなどの安全な設定を引き継ぐ場合がありますが、古い cron 行から周辺会話コンテキストを継承することはありません。つまり、チャネル/グループルーティング、送信またはキュー方針、昇格、オリジン、ACP ランタイムバインディングは継承されません。繰り返しジョブが意図的に同じ会話コンテキストを積み上げる必要がある場合は、`current` または `session:<id>` を使用してください。
  </Accordion>
  <Accordion title="ランタイムクリーンアップ">
    隔離ジョブでは、ランタイムの破棄に、その cron セッション向けのベストエフォートのブラウザークリーンアップが含まれるようになりました。クリーンアップ失敗は無視されるため、実際の cron 結果が引き続き優先されます。

    隔離 cron 実行は、共有ランタイムクリーンアップパスを通じてジョブ用に作成されたバンドル MCP ランタイムインスタンスも破棄します。これはメインセッションおよびカスタムセッションの MCP クライアントの破棄方法と一致するため、隔離 cron ジョブが stdio 子プロセスや長寿命の MCP 接続を実行間でリークすることはありません。

  </Accordion>
  <Accordion title="サブエージェントと Discord 配信">
    隔離 cron 実行がサブエージェントをオーケストレーションする場合、配信では古い親の暫定テキストよりも最終的な子孫出力が優先されます。子孫がまだ実行中の場合、OpenClaw はその部分的な親の更新を通知せずに抑制します。

    テキストのみの Discord 通知先では、OpenClaw はストリーミング/中間テキストペイロードと最終回答の両方を再生するのではなく、正規の最終アシスタントテキストを一度だけ送信します。メディアおよび構造化された Discord ペイロードは、添付ファイルとコンポーネントが欠落しないよう、引き続き別個のペイロードとして配信されます。

  </Accordion>
</AccordionGroup>

### 隔離ジョブのペイロードオプション

<ParamField path="--message" type="string" required>
  プロンプトテキスト（隔離では必須）。
</ParamField>
<ParamField path="--model" type="string">
  モデルのオーバーライド。ジョブで選択された許可済みモデルを使用します。
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

`--model` は、選択された許可済みモデルをそのジョブのプライマリモデルとして使用します。これはチャットセッションの `/model` オーバーライドとは異なります。ジョブのプライマリが失敗した場合でも、設定済みのフォールバックチェーンは引き続き適用されます。要求されたモデルが許可されていない、または解決できない場合、cron はジョブのエージェント/デフォルトモデル選択へ暗黙的にフォールバックするのではなく、明示的な検証エラーで実行を失敗させます。

Cron ジョブは、ペイロードレベルの `fallbacks` も保持できます。存在する場合、その一覧はジョブの設定済みフォールバックチェーンを置き換えます。選択されたモデルだけを試行する厳密な cron 実行にしたい場合は、ジョブペイロード/API で `fallbacks: []` を使用してください。ジョブに `--model` があり、ペイロードにも設定にもフォールバックがない場合、OpenClaw は明示的な空のフォールバックオーバーライドを渡します。そのため、エージェントのプライマリが隠れた追加リトライ対象として追加されることはありません。

隔離ジョブのモデル選択優先順位は次のとおりです。

1. Gmail フックのモデルオーバーライド（実行が Gmail から来ており、そのオーバーライドが許可されている場合）
2. ジョブごとのペイロード `model`
3. ユーザーが選択して保存された cron セッションのモデルオーバーライド
4. エージェント/デフォルトのモデル選択

高速モードも、解決されたライブ選択に従います。選択されたモデル設定に `params.fastMode` がある場合、隔離 cron はデフォルトでそれを使用します。保存されたセッションの `fastMode` オーバーライドは、どちらの方向でも設定より優先されます。

隔離実行でライブのモデル切り替えハンドオフが発生した場合、cron は切り替え後のプロバイダー/モデルで再試行し、再試行前にそのライブ選択をアクティブ実行に永続化します。切り替えが新しい認証プロファイルも伴う場合、cron はその認証プロファイルのオーバーライドもアクティブ実行に永続化します。再試行には上限があります。初回試行に加えて 2 回の切り替え再試行後、cron は永久にループせずに中止します。

分離された Cron 実行がエージェントランナーに入る前に、OpenClaw は、`baseUrl` がループバック、プライベートネットワーク、または `.local` である、設定済みの `api: "ollama"` および `api: "openai-completions"` プロバイダーについて、到達可能なローカルプロバイダーエンドポイントを確認します。そのエンドポイントが停止している場合、モデル呼び出しを開始する代わりに、その実行は明確なプロバイダー/モデルエラー付きで `skipped` として記録されます。エンドポイントの結果は 5 分間キャッシュされるため、同じ停止中のローカル Ollama、vLLM、SGLang、または LM Studio サーバーを使用する多数の期限到来ジョブは、リクエストの嵐を作る代わりに、1 回の小さなプローブを共有します。プロバイダープリフライトでスキップされた実行は、実行エラーのバックオフを増やしません。スキップ通知を繰り返し受け取りたい場合は、`failureAlert.includeSkipped` を有効にします。

## 配信と出力

| モード       | 何が起きるか                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | エージェントが送信しなかった場合、最終テキストをターゲットへフォールバック配信します |
| `webhook`  | 完了イベントペイロードを URL に POST します                                |
| `none`     | ランナーによるフォールバック配信はありません                                         |

チャンネル配信には `--announce --channel telegram --to "-1001234567890"` を使用します。Telegram フォーラムトピックでは `-1001234567890:topic:123` を使用します。直接 RPC/config 呼び出し元は、`delivery.threadId` を文字列または数値として渡すこともできます。Slack/Discord/Mattermost のターゲットでは、明示的なプレフィックス（`channel:<id>`、`user:<id>`）を使用する必要があります。Matrix ルーム ID は大文字小文字を区別します。Matrix の正確なルーム ID、または `room:!room:server` 形式を使用してください。

announce 配信で `channel: "last"` を使用するか `channel` を省略した場合、`telegram:123` のようなプロバイダープレフィックス付きターゲットは、Cron がセッション履歴または単一の設定済みチャンネルへフォールバックする前に、チャンネルを選択できます。読み込まれた Plugin が広告するプレフィックスのみがプロバイダーセレクターです。`delivery.channel` が明示されている場合、ターゲットプレフィックスは同じプロバイダー名でなければなりません。たとえば、`channel: "whatsapp"` かつ `to: "telegram:123"` は、WhatsApp に Telegram ID を電話番号として解釈させる代わりに拒否されます。`channel:<id>`、`user:<id>`、`imessage:<handle>`、`sms:<number>` のようなターゲット種別およびサービスプレフィックスは、プロバイダーセレクターではなく、チャンネル所有のターゲット構文のままです。

分離ジョブでは、チャット配信は共有されます。チャットルートが利用可能な場合、ジョブが `--no-deliver` を使用していても、エージェントは `message` ツールを使用できます。エージェントが設定済み/現在のターゲットへ送信した場合、OpenClaw はフォールバック announce をスキップします。それ以外の場合、`announce`、`webhook`、`none` は、エージェントターン後の最終返信をランナーがどう扱うかだけを制御します。

エージェントがアクティブなチャットから分離リマインダーを作成すると、OpenClaw はフォールバック announce ルート用に保持されたライブ配信ターゲットを保存します。内部セッションキーは小文字の場合があります。現在のチャットコンテキストが利用可能な場合、それらのキーからプロバイダー配信ターゲットは再構築されません。

暗黙の announce 配信は、設定済みチャンネルの許可リストを使用して、古いターゲットを検証し再ルーティングします。DM ペアリングストアの承認はフォールバック自動化の受信者ではありません。スケジュール済みジョブが DM へ能動的に送信する必要がある場合は、`delivery.to` を設定するか、チャンネルの `allowFrom` エントリを設定してください。

失敗通知は別の宛先パスに従います。

- `cron.failureDestination` は失敗通知のグローバルデフォルトを設定します。
- `job.delivery.failureDestination` はジョブごとにそれを上書きします。
- どちらも設定されておらず、ジョブがすでに `announce` で配信している場合、失敗通知はその主要 announce ターゲットへフォールバックします。
- `delivery.failureDestination` は、主要配信モードが `webhook` でない限り、`sessionTarget="isolated"` ジョブでのみサポートされます。
- `failureAlert.includeSkipped: true` は、ジョブまたはグローバル Cron アラートポリシーで、スキップ実行アラートの繰り返しを有効にします。スキップされた実行は個別の連続スキップカウンターを保持するため、実行エラーのバックオフには影響しません。

## CLI の例

<Tabs>
  <Tab title="単発リマインダー">
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

すべてのリクエストは、ヘッダーでフックトークンを含める必要があります。

- `Authorization: Bearer <token>`（推奨）
- `x-openclaw-token: <token>`

クエリ文字列トークンは拒否されます。

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    main セッション用のシステムイベントをキューに入れます。

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
  <Accordion title="マッピング済みフック（POST /hooks/<name>）">
    カスタムフック名は、config 内の `hooks.mappings` によって解決されます。マッピングは、任意のペイロードをテンプレートまたはコード変換で `wake` または `agent` アクションへ変換できます。
  </Accordion>
</AccordionGroup>

<Warning>
フックエンドポイントは、ループバック、tailnet、または信頼済みリバースプロキシの背後に置いてください。

- 専用のフックトークンを使用し、Gateway 認証トークンを再利用しないでください。
- `hooks.path` は専用のサブパスに保ちます。`/` は拒否されます。
- 明示的な `agentId` ルーティングを制限するには `hooks.allowedAgentIds` を設定します。
- 呼び出し元にセッション選択を許可する必要がない限り、`hooks.allowRequestSessionKey=false` のままにします。
- `hooks.allowRequestSessionKey` を有効にする場合は、許可されるセッションキーの形を制約するために `hooks.allowedSessionKeyPrefixes` も設定します。
- フックペイロードは、デフォルトで安全境界でラップされます。

</Warning>

## Gmail PubSub 連携

Google PubSub 経由で Gmail 受信トリガーを OpenClaw に接続します。

<Note>
**前提条件:** `gcloud` CLI、`gog`（gogcli）、OpenClaw hooks 有効化、公開 HTTPS エンドポイント用の Tailscale。
</Note>

### ウィザードセットアップ（推奨）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

これは `hooks.gmail` config を書き込み、Gmail プリセットを有効化し、プッシュエンドポイントに Tailscale Funnel を使用します。

### Gateway 自動起動

`hooks.enabled=true` で `hooks.gmail.account` が設定されている場合、Gateway は起動時に `gog gmail watch serve` を開始し、watch を自動更新します。無効にするには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定します。

### 手動の一回限りセットアップ

<Steps>
  <Step title="GCP プロジェクトを選択">
    `gog` が使用する OAuth クライアントを所有する GCP プロジェクトを選択します。

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="トピックを作成し、Gmail push アクセスを付与">
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
モデル上書きに関する注意:

- `openclaw cron add|edit --model ...` はジョブの選択モデルを変更します。
- そのモデルが許可されている場合、その正確なプロバイダー/モデルが分離エージェント実行に到達します。
- 許可されていない、または解決できない場合、Cron は明示的な検証エラーで実行を失敗させます。
- Cron `--model` はジョブの主要モデルであり、セッション `/model` 上書きではないため、設定済みのフォールバックチェーンは引き続き適用されます。
- ペイロードの `fallbacks` は、そのジョブの設定済みフォールバックを置き換えます。`fallbacks: []` はフォールバックを無効化し、実行を厳密にします。
- 明示的または設定済みのフォールバックリストがない単純な `--model` は、無言の追加リトライターゲットとしてエージェントの主要モデルへフォールスルーしません。

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

`maxConcurrentRuns` は、スケジュール済み Cron ディスパッチと分離エージェントターン実行の両方を制限します。分離 Cron エージェントターンは、内部的にキュー専用の `cron-nested` 実行レーンを使用するため、この値を増やすと、独立した Cron LLM 実行が外側の Cron ラッパーを開始するだけでなく、並行して進行できます。共有の非 Cron `nested` レーンは、この設定では拡張されません。

ランタイム状態サイドカーは `cron.store` から派生します。`~/clawd/cron/jobs.json` のような `.json` ストアは `~/clawd/cron/jobs-state.json` を使用し、`.json` サフィックスのないストアパスには `-state.json` が追加されます。

`jobs.json` を手動編集する場合、`jobs-state.json` はソース管理から外してください。OpenClaw はそのサイドカーを、保留スロット、アクティブマーカー、最終実行メタデータ、および外部編集されたジョブに新しい `nextRunAtMs` が必要なタイミングをスケジューラーへ伝えるスケジュール ID に使用します。

Cron を無効化: `cron.enabled: false` または `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="リトライ動作">
    **単発リトライ**: 一時的なエラー（レート制限、過負荷、ネットワーク、サーバーエラー）は、指数バックオフで最大 3 回リトライされます。恒久的なエラーは直ちに無効化されます。

    **定期リトライ**: リトライ間に指数バックオフ（30 秒から 60 分）を使用します。次回の成功実行後にバックオフはリセットされます。

  </Accordion>
  <Accordion title="メンテナンス">
    `cron.sessionRetention`（デフォルト `24h`）は、分離実行セッションエントリを削除します。`cron.runLog.maxBytes` / `cron.runLog.keepLines` は、実行ログファイルを自動削除します。
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
    - `cron.enabled` と `OPENCLAW_SKIP_CRON` 環境変数を確認します。
    - Gateway が継続的に実行されていることを確認します。
    - `cron` スケジュールでは、タイムゾーン (`--tz`) とホストのタイムゾーンを照合します。
    - 実行出力の `reason: not-due` は、手動実行が `openclaw cron run <jobId> --due` で確認され、ジョブの実行時刻がまだ来ていなかったことを意味します。

  </Accordion>
  <Accordion title="Cron は起動したが配信されない">
    - 配信モード `none` は、runner fallback send が想定されていないことを意味します。チャットルートが利用可能な場合、エージェントは引き続き `message` ツールで直接送信できます。
    - 配信先が欠落している、または無効 (`channel`/`to`) な場合、アウトバウンドはスキップされます。
    - Matrix では、コピーされたジョブやレガシージョブで小文字化された `delivery.to` のルーム ID を使うと、Matrix のルーム ID は大文字と小文字を区別するため失敗することがあります。ジョブを Matrix から取得した正確な `!room:server` または `room:!room:server` の値に編集してください。
    - チャンネル認証エラー (`unauthorized`, `Forbidden`) は、認証情報により配信がブロックされたことを意味します。
    - 分離実行がサイレントトークン (`NO_REPLY` / `no_reply`) だけを返す場合、OpenClaw は直接のアウトバウンド配信を抑制し、fallback queued summary パスも抑制するため、チャットには何も投稿されません。
    - エージェント自身がユーザーにメッセージを送るべき場合は、ジョブに利用可能なルート (`channel: "last"` と以前のチャット、または明示的なチャンネル/ターゲット) があることを確認します。

  </Accordion>
  <Accordion title="Cron または Heartbeat が /new-style ロールオーバーを妨げているように見える">
    - 日次およびアイドルリセットの鮮度は `updatedAt` に基づきません。[セッション管理](/ja-JP/concepts/session#session-lifecycle) を参照してください。
    - Cron のウェイクアップ、Heartbeat 実行、exec 通知、Gateway のブックキーピングは、ルーティング/ステータス用にセッション行を更新することがありますが、`sessionStartedAt` や `lastInteractionAt` は延長しません。
    - これらのフィールドが存在する前に作成されたレガシー行では、ファイルがまだ利用可能な場合、OpenClaw は transcript JSONL のセッションヘッダーから `sessionStartedAt` を復元できます。`lastInteractionAt` のないレガシーのアイドル行では、その復元された開始時刻をアイドルの基準として使用します。

  </Accordion>
  <Accordion title="タイムゾーンの注意点">
    - `--tz` なしの Cron は、gateway ホストのタイムゾーンを使用します。
    - タイムゾーンなしの `at` スケジュールは UTC として扱われます。
    - Heartbeat の `activeHours` は、設定されたタイムゾーン解決を使用します。

  </Accordion>
</AccordionGroup>

## 関連

- [自動化とタスク](/ja-JP/automation) — すべての自動化メカニズムの概要
- [バックグラウンドタスク](/ja-JP/automation/tasks) — Cron 実行のタスク台帳
- [Heartbeat](/ja-JP/gateway/heartbeat) — メインセッションの定期ターン
- [タイムゾーン](/ja-JP/concepts/timezone) — タイムゾーン設定

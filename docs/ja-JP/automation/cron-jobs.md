---
read_when:
    - バックグラウンドジョブまたはウェイクアップのスケジュール設定
    - 外部トリガー（Webhook、Gmail）をOpenClawに接続する
    - スケジュールされたタスクで Heartbeat と Cron のどちらを使うかを決定する
sidebarTitle: Scheduled tasks
summary: Gateway スケジューラ向けのスケジュール済みジョブ、Webhook、Gmail PubSub トリガー
title: スケジュール済みタスク
x-i18n:
    generated_at: "2026-05-07T01:50:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4771847517f526ec537a940773c70141e056bdc5a7b735099f40c6ea10e18162
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron は Gateway の組み込みスケジューラです。ジョブを永続化し、適切なタイミングでエージェントを起動し、出力をチャットチャンネルまたは Webhook エンドポイントに返せます。

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

## Cron の仕組み

- Cron は **Gateway 内部**のプロセスで実行されます（モデル内ではありません）。
- ジョブ定義は `~/.openclaw/cron/jobs.json` に永続化されるため、再起動してもスケジュールは失われません。
- ランタイム実行状態は、その隣の `~/.openclaw/cron/jobs-state.json` に永続化されます。cron 定義を git で追跡する場合は、`jobs.json` を追跡し、`jobs-state.json` を gitignore に追加してください。
- 分割後、古い OpenClaw バージョンは `jobs.json` を読み取れますが、ランタイムフィールドが `jobs-state.json` に移動したため、ジョブを新規扱いする場合があります。
- Gateway の実行中または停止中に `jobs.json` が編集されると、OpenClaw は変更されたスケジュールフィールドを保留中のランタイムスロットメタデータと比較し、古くなった `nextRunAtMs` 値をクリアします。純粋な整形やキー順序のみの書き換えでは、保留中のスロットは保持されます。
- すべての cron 実行は [バックグラウンドタスク](/ja-JP/automation/tasks) レコードを作成します。
- Gateway 起動時、期限を過ぎた分離エージェントターンジョブは即時再生されるのではなく、チャンネル接続ウィンドウの外に再スケジュールされるため、再起動後も Discord/Telegram の起動とネイティブコマンドのセットアップが応答性を保ちます。
- 1 回限りのジョブ（`--at`）は、デフォルトで成功後に自動削除されます。
- 分離 cron 実行は、実行完了時に `cron:<jobId>` セッション用に追跡されているブラウザータブ/プロセスをベストエフォートで閉じるため、切り離されたブラウザー自動化が孤立プロセスを残しません。
- 狭い cron 自己クリーンアップ権限を受け取った分離 cron 実行は、引き続きスケジューラ状態と自身の現在のジョブだけに絞り込まれたリストを読み取れるため、状態/Heartbeat チェックは、より広範な cron 変更アクセスを得ることなく自身のスケジュールを検査できます。
- 分離 cron 実行は、古い確認応答にも対処します。最初の結果が単なる暫定ステータス更新（`on it`、`pulling everything together`、および同様のヒント）であり、最終回答を担当する子孫サブエージェント実行がまだ存在しない場合、OpenClaw は配信前に実際の結果を得るために 1 回だけ再プロンプトします。
- 分離 cron 実行は、埋め込み実行からの構造化された実行拒否メタデータを優先し、その後 `SYSTEM_RUN_DENIED` や `INVALID_REQUEST` などの既知の最終サマリー/出力マーカーにフォールバックするため、ブロックされたコマンドが成功実行として報告されません。
- 分離 cron 実行は、返信ペイロードが生成されない場合でも、実行レベルのエージェント失敗をジョブエラーとして扱うため、モデル/プロバイダーの失敗はジョブを成功としてクリアするのではなく、エラーカウンターを増やして失敗通知をトリガーします。
- 分離エージェントターンジョブが `timeoutSeconds` に達すると、cron は基盤となるエージェント実行を中止し、短いクリーンアップウィンドウを与えます。実行が排出されない場合、Cron がタイムアウトを記録する前に Gateway 所有のクリーンアップがその実行のセッション所有権を強制的にクリアするため、キューに入ったチャット作業が古い処理中セッションの背後に残されません。

<a id="maintenance"></a>

<Note>
Cron のタスク調整は、まずランタイム所有、次に耐久履歴ベースです。アクティブな cron タスクは、古い子セッション行がまだ存在していても、cron ランタイムがそのジョブを実行中として追跡している間はライブのままです。ランタイムがジョブの所有を停止し、5 分間の猶予ウィンドウが期限切れになると、メンテナンスは永続化された実行ログとジョブ状態を、対応する `cron:<jobId>:<startedAt>` 実行について確認します。その耐久履歴が終端結果を示している場合、タスク台帳はそれに基づいて確定されます。それ以外の場合、Gateway 所有のメンテナンスはタスクを `lost` としてマークできます。オフライン CLI 監査は耐久履歴から復旧できますが、自身の空のインプロセスアクティブジョブ集合を、Gateway 所有の cron 実行がなくなった証拠としては扱いません。
</Note>

## スケジュールタイプ

| 種類    | CLI フラグ  | 説明                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | 1 回限りのタイムスタンプ（ISO 8601 または `20m` のような相対指定）    |
| `every` | `--every` | 固定間隔                                          |
| `cron`  | `--cron`  | 省略可能な `--tz` を伴う 5 フィールドまたは 6 フィールドの cron 式 |

タイムゾーンのないタイムスタンプは UTC として扱われます。ローカルの実時間スケジュールには `--tz America/New_York` を追加してください。

毎時ちょうどの繰り返し式は、負荷スパイクを減らすために最大 5 分まで自動的に分散されます。正確なタイミングを強制するには `--exact` を使用し、明示的なウィンドウには `--stagger 30s` を使用してください。

### 日付と曜日は OR ロジックを使用する

Cron 式は [croner](https://github.com/Hexagon/croner) によって解析されます。日付フィールドと曜日フィールドの両方がワイルドカードでない場合、croner は **どちらか一方**のフィールドが一致したときに一致とみなします。両方ではありません。これは標準的な Vixie cron の動作です。

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

これは月 0〜1 回ではなく、月に約 5〜6 回発火します。OpenClaw はここで Croner のデフォルトの OR 動作を使用します。両方の条件を必須にするには、Croner の `+` 曜日修飾子（`0 9 15 * +1`）を使用するか、一方のフィールドでスケジュールし、もう一方をジョブのプロンプトまたはコマンドでガードしてください。

## 実行スタイル

| スタイル           | `--session` 値   | 実行場所                  | 最適な用途                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| メインセッション    | `main`              | 次の Heartbeat ターン      | リマインダー、システムイベント        |
| 分離        | `isolated`          | 専用の `cron:<jobId>` | レポート、バックグラウンド作業      |
| 現在のセッション | `current`           | 作成時にバインド   | コンテキストを意識した繰り返し作業    |
| カスタムセッション  | `session:custom-id` | 永続的な名前付きセッション | 履歴に基づいて構築されるワークフロー |

<AccordionGroup>
  <Accordion title="メインセッションと分離とカスタムの違い">
    **メインセッション** ジョブはシステムイベントをキューに入れ、必要に応じて Heartbeat を起動します（`--wake now` または `--wake next-heartbeat`）。これらのシステムイベントは、対象セッションの日次/アイドルリセットの鮮度を延長しません。**分離** ジョブは、新しいセッションで専用エージェントターンを実行します。**カスタムセッション**（`session:xxx`）は実行間でコンテキストを永続化し、前回の要約に基づく日次スタンドアップのようなワークフローを可能にします。
  </Accordion>
  <Accordion title="分離ジョブにおける「新しいセッション」の意味">
    分離ジョブの場合、「新しいセッション」とは、各実行に対して新しいトランスクリプト/セッション ID を使うことを意味します。OpenClaw は、thinking/fast/verbose 設定、ラベル、明示的にユーザーが選択したモデル/auth オーバーライドなどの安全な設定を引き継ぐ場合がありますが、古い cron 行からの周辺的な会話コンテキスト、つまりチャンネル/グループルーティング、送信またはキューポリシー、昇格、origin、ACP ランタイムバインディングは継承しません。繰り返しジョブが同じ会話コンテキストに意図的に基づく必要がある場合は、`current` または `session:<id>` を使用してください。
  </Accordion>
  <Accordion title="ランタイムクリーンアップ">
    分離ジョブでは、ランタイムのティアダウンに、その cron セッションのベストエフォートのブラウザークリーンアップが含まれるようになりました。クリーンアップ失敗は無視されるため、実際の cron 結果が引き続き優先されます。

    分離 cron 実行は、共有ランタイムクリーンアップパスを通じて、ジョブ用に作成されたバンドル済み MCP ランタイムインスタンスも破棄します。これはメインセッションおよびカスタムセッションの MCP クライアントがティアダウンされる方法と一致するため、分離 cron ジョブは実行間で stdio 子プロセスや長寿命の MCP 接続をリークしません。

  </Accordion>
  <Accordion title="サブエージェントと Discord 配信">
    分離 cron 実行がサブエージェントをオーケストレーションする場合、配信は古い親の暫定テキストよりも、最終的な子孫出力を優先します。子孫がまだ実行中の場合、OpenClaw はその部分的な親更新を通知せずに抑制します。

    テキストのみの Discord 通知ターゲットでは、OpenClaw はストリーミング/中間テキストペイロードと最終回答の両方を再生するのではなく、正規の最終アシスタントテキストを 1 回送信します。メディアおよび構造化された Discord ペイロードは引き続き別ペイロードとして配信されるため、添付ファイルとコンポーネントは失われません。

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

`--model` は、そのジョブの主モデルとして選択された許可済みモデルを使用します。これはチャットセッションの `/model` オーバーライドとは同じではありません。ジョブの主モデルが失敗した場合も、構成済みのフォールバックチェーンは引き続き適用されます。要求されたモデルが許可されていない、または解決できない場合、cron はジョブのエージェント/デフォルトモデル選択に暗黙的にフォールバックするのではなく、明示的な検証エラーで実行を失敗させます。

古い、または手動編集された `jobs.json` エントリが `payload.model` を `"default"`、`"null"`、空文字列、または JSON `null` として保存している場合は、`openclaw doctor --fix` を実行してください。Doctor はこれらの無効な永続化済みオーバーライド番兵値を削除します。ランタイムはそれらをフォールバックエイリアスとしてサポートしません。通常のエージェント/デフォルトモデル選択を使用するには、model フィールドを省略してください。

Cron ジョブはペイロードレベルの `fallbacks` も保持できます。存在する場合、そのリストはジョブ用に構成済みのフォールバックチェーンを置き換えます。選択されたモデルのみを試す厳格な cron 実行にしたい場合は、ジョブペイロード/API で `fallbacks: []` を使用してください。ジョブに `--model` があるものの、ペイロードにも構成にもフォールバックがない場合、OpenClaw は明示的な空のフォールバックオーバーライドを渡し、エージェント主モデルが隠れた追加再試行ターゲットとして追加されないようにします。

分離ジョブのモデル選択優先順位は次のとおりです。

1. Gmail フックのモデルオーバーライド（実行が Gmail 由来で、そのオーバーライドが許可されている場合）
2. ジョブごとのペイロード `model`
3. ユーザーが選択して保存した cron セッションモデルオーバーライド
4. エージェント/デフォルトモデル選択

Fast mode も解決済みのライブ選択に従います。選択されたモデル構成に `params.fastMode` がある場合、分離 cron はデフォルトでそれを使用します。保存済みセッションの `fastMode` オーバーライドは、どちらの方向でも構成より優先されます。

分離実行がライブモデル切り替えハンドオフに到達した場合、cron は切り替え後のプロバイダー/モデルで再試行し、再試行前にそのライブ選択をアクティブな実行に永続化します。切り替えに新しい auth プロファイルも含まれる場合、cron はその auth プロファイルオーバーライドもアクティブな実行に永続化します。再試行には上限があります。初回試行に加えて 2 回の切り替え再試行後、cron は無限ループするのではなく中止します。

分離 cron 実行がエージェントランナーに入る前に、OpenClaw は、`baseUrl` が local loopback、プライベートネットワーク、または `.local` である構成済み `api: "ollama"` および `api: "openai-completions"` プロバイダーについて、到達可能なローカルプロバイダーエンドポイントを確認します。そのエンドポイントが停止している場合、実行はモデル呼び出しを開始するのではなく、明確なプロバイダー/モデルエラーとともに `skipped` として記録されます。エンドポイント結果は 5 分間キャッシュされるため、同じ停止中のローカル Ollama、vLLM、SGLang、または LM Studio サーバーを使用する多数の期限到来ジョブは、リクエストストームを作るのではなく、1 回の小さなプローブを共有します。スキップされたプロバイダー事前確認実行は、実行エラーのバックオフを増やしません。繰り返しのスキップ通知が必要な場合は、`failureAlert.includeSkipped` を有効にしてください。

## 配信と出力

| モード       | 動作                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | エージェントが送信しなかった場合、最終テキストを対象へフォールバック配信する |
| `webhook`  | 完了イベントペイロードを URL に POST する                                |
| `none`     | ランナーによるフォールバック配信なし                                         |

チャネル配信には `--announce --channel telegram --to "-1001234567890"` を使用します。Telegram のフォーラムトピックでは `-1001234567890:topic:123` を使用します。直接 RPC/config の呼び出し元は、`delivery.threadId` を文字列または数値として渡すこともできます。Slack/Discord/Mattermost の対象には明示的なプレフィックス（`channel:<id>`、`user:<id>`）を使用してください。Matrix のルーム ID は大文字と小文字が区別されます。正確なルーム ID、または Matrix の `room:!room:server` 形式を使用してください。

announce 配信で `channel: "last"` を使用する、または `channel` を省略する場合、cron がセッション履歴または設定済みの単一チャネルにフォールバックする前に、`telegram:123` のようなプロバイダープレフィックス付き対象でチャネルを選択できます。読み込まれた plugin が通知するプレフィックスだけがプロバイダーセレクターです。`delivery.channel` が明示されている場合、対象のプレフィックスは同じプロバイダー名でなければなりません。たとえば、`channel: "whatsapp"` と `to: "telegram:123"` の組み合わせは、WhatsApp に Telegram ID を電話番号として解釈させるのではなく拒否されます。`channel:<id>`、`user:<id>`、`imessage:<handle>`、`sms:<number>` などの対象種別およびサービスプレフィックスは、プロバイダーセレクターではなく、引き続きチャネル所有の対象構文です。

分離ジョブでは、チャット配信は共有されます。チャットルートが利用可能な場合、ジョブが `--no-deliver` を使用していても、エージェントは `message` ツールを使用できます。エージェントが設定済みまたは現在の対象に送信した場合、OpenClaw はフォールバック announce をスキップします。それ以外の場合、`announce`、`webhook`、`none` は、エージェントターン後の最終返信に対してランナーが何をするかだけを制御します。

エージェントがアクティブなチャットから分離リマインダーを作成すると、OpenClaw はフォールバック announce ルート用に保持されたライブ配信対象を保存します。内部セッションキーは小文字の場合がありますが、現在のチャットコンテキストが利用可能な場合、プロバイダー配信対象はそれらのキーから再構築されません。

暗黙の announce 配信では、設定済みチャネルの許可リストを使用して、古くなった対象を検証し、再ルーティングします。DM ペアリングストアの承認はフォールバック自動化の受信者ではありません。スケジュール済みジョブが DM に能動的に送信する必要がある場合は、`delivery.to` を設定するか、チャネルの `allowFrom` エントリを設定してください。

失敗通知は別の宛先パスに従います。

- `cron.failureDestination` は失敗通知のグローバルデフォルトを設定します。
- `job.delivery.failureDestination` はジョブごとにそれを上書きします。
- どちらも設定されておらず、そのジョブがすでに `announce` で配信している場合、失敗通知は現在、その主要 announce 対象へフォールバックします。
- `delivery.failureDestination` は、主要な配信モードが `webhook` の場合を除き、`sessionTarget="isolated"` ジョブでのみサポートされます。
- `failureAlert.includeSkipped: true` は、ジョブまたはグローバル Cron アラートポリシーに、繰り返しスキップされた実行のアラートを含めます。スキップされた実行は別個の連続スキップカウンターを保持するため、実行エラーのバックオフには影響しません。

## CLI の例

<Tabs>
  <Tab title="One-shot reminder">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Recurring isolated job">
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
  <Tab title="Model and thinking override">
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

Gateway は外部トリガー用の HTTP Webhook エンドポイントを公開できます。config で有効化します。

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

クエリ文字列トークンは拒否されます。

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    メインセッションにシステムイベントをキューへ追加します。

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
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    カスタムフック名は config の `hooks.mappings` によって解決されます。マッピングでは、テンプレートまたはコード変換を使って任意のペイロードを `wake` または `agent` アクションに変換できます。
  </Accordion>
</AccordionGroup>

<Warning>
フックエンドポイントは loopback、tailnet、または信頼済みリバースプロキシの背後に置いてください。

- 専用のフックトークンを使用し、gateway 認証トークンを再利用しないでください。
- `hooks.path` は専用のサブパスにしてください。`/` は拒否されます。
- `hooks.allowedAgentIds` を設定して、明示的な `agentId` ルーティングを制限してください。
- 呼び出し元が選択するセッションが必要な場合を除き、`hooks.allowRequestSessionKey=false` のままにしてください。
- `hooks.allowRequestSessionKey` を有効にする場合は、許可されるセッションキーの形状を制約するために `hooks.allowedSessionKeyPrefixes` も設定してください。
- フックペイロードはデフォルトで安全境界に包まれます。

</Warning>

## Gmail PubSub 連携

Google PubSub 経由で Gmail 受信トレイトリガーを OpenClaw に接続します。

<Note>
**前提条件:** `gcloud` CLI、`gog`（gogcli）、OpenClaw hooks の有効化、公開 HTTPS エンドポイント用の Tailscale。
</Note>

### ウィザード設定（推奨）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

これにより `hooks.gmail` config が書き込まれ、Gmail プリセットが有効化され、プッシュエンドポイントに Tailscale Funnel が使用されます。

### Gateway の自動起動

`hooks.enabled=true` かつ `hooks.gmail.account` が設定されている場合、Gateway は起動時に `gog gmail watch serve` を開始し、watch を自動更新します。無効化するには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定します。

### 手動のワンタイム設定

<Steps>
  <Step title="Select the GCP project">
    `gog` が使用する OAuth クライアントを所有する GCP プロジェクトを選択します。

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Create topic and grant Gmail push access">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Start the watch">
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
モデル上書きの注記:

- `openclaw cron add|edit --model ...` はジョブで選択されるモデルを変更します。
- モデルが許可されている場合、その正確な provider/model が分離エージェント実行に到達します。
- 許可されていない、または解決できない場合、cron は明示的な検証エラーで実行を失敗させます。
- 設定済みのフォールバックチェーンは引き続き適用されます。cron の `--model` はジョブのプライマリであり、セッションの `/model` 上書きではないためです。
- ペイロードの `fallbacks` は、そのジョブの設定済みフォールバックを置き換えます。`fallbacks: []` はフォールバックを無効化し、実行を厳密にします。
- 明示的または設定済みのフォールバックリストがない単純な `--model` は、暗黙の追加リトライ対象としてエージェントのプライマリへフォールスルーしません。

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

`maxConcurrentRuns` は、スケジュール済み cron ディスパッチと分離エージェントターン実行の両方を制限します。分離 cron エージェントターンは内部的にキュー専用の `cron-nested` 実行レーンを使用するため、この値を上げると、外側の cron ラッパーだけが開始されるのではなく、独立した cron LLM 実行を並列に進められます。共有の非 cron `nested` レーンは、この設定では拡張されません。

ランタイム状態のサイドカーは `cron.store` から派生します。`~/clawd/cron/jobs.json` のような `.json` ストアは `~/clawd/cron/jobs-state.json` を使用し、`.json` サフィックスのないストアパスには `-state.json` が追加されます。

`jobs.json` を手動編集する場合、`jobs-state.json` はソース管理に含めないでください。OpenClaw はそのサイドカーを、保留中スロット、アクティブマーカー、最終実行メタデータ、外部編集されたジョブに新しい `nextRunAtMs` が必要なタイミングをスケジューラーに伝えるスケジュール ID に使用します。

cron を無効化するには、`cron.enabled: false` または `OPENCLAW_SKIP_CRON=1` を使用します。

<AccordionGroup>
  <Accordion title="Retry behavior">
    **ワンショットリトライ**: 一時的エラー（レート制限、過負荷、ネットワーク、サーバーエラー）は、指数バックオフで最大 3 回リトライします。永続的エラーは即座に無効化されます。

    **繰り返しリトライ**: リトライ間に指数バックオフ（30 秒から 60 分）を適用します。次回の成功実行後にバックオフはリセットされます。

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention`（デフォルト `24h`）は分離実行セッションエントリを整理します。`cron.runLog.maxBytes` / `cron.runLog.keepLines` は実行ログファイルを自動整理します。
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
  <Accordion title="Cron not firing">
    - `cron.enabled` と `OPENCLAW_SKIP_CRON` 環境変数を確認してください。
    - Gateway が継続的に実行されていることを確認してください。
    - `cron` スケジュールでは、タイムゾーン（`--tz`）とホストのタイムゾーンを確認してください。
    - 実行出力の `reason: not-due` は、手動実行が `openclaw cron run <jobId> --due` で確認され、そのジョブがまだ期限に達していなかったことを意味します。

  </Accordion>
  <Accordion title="Cron が起動したが配信されない">
    - 配信モード `none` は、runner のフォールバック送信が想定されないことを意味します。チャットルートが利用可能な場合、エージェントは `message` ツールで直接送信できます。
    - 配信先が欠落している、または無効な場合（`channel`/`to`）、送信はスキップされます。
    - Matrix では、コピーされたジョブやレガシージョブで `delivery.to` のルーム ID が小文字化されていると、Matrix のルーム ID は大文字と小文字を区別するため失敗することがあります。ジョブを Matrix の正確な `!room:server` または `room:!room:server` の値に編集してください。
    - チャンネル認証エラー（`unauthorized`、`Forbidden`）は、認証情報によって配信がブロックされたことを意味します。
    - 分離実行がサイレントトークン（`NO_REPLY` / `no_reply`）のみを返す場合、OpenClaw は直接の送信配信を抑制し、フォールバックのキュー済み要約パスも抑制するため、チャットには何も投稿されません。
    - エージェント自身がユーザーにメッセージを送る必要がある場合は、ジョブに使用可能なルート（以前のチャットがある `channel: "last"`、または明示的なチャンネル/ターゲット）があることを確認してください。

  </Accordion>
  <Accordion title="Cron または Heartbeat が /new-style ロールオーバーを妨げているように見える">
    - 日次リセットとアイドルリセットの鮮度は `updatedAt` に基づきません。[セッション管理](/ja-JP/concepts/session#session-lifecycle)を参照してください。
    - Cron のウェイクアップ、Heartbeat の実行、exec 通知、Gateway の管理処理は、ルーティング/ステータスのためにセッション行を更新することがありますが、`sessionStartedAt` や `lastInteractionAt` は延長しません。
    - これらのフィールドが存在する前に作成されたレガシー行では、ファイルがまだ利用可能な場合、OpenClaw はトランスクリプト JSONL のセッションヘッダーから `sessionStartedAt` を復元できます。`lastInteractionAt` のないレガシーのアイドル行は、その復元された開始時刻をアイドルの基準として使用します。

  </Accordion>
  <Accordion title="タイムゾーンの注意点">
    - `--tz` なしの Cron は Gateway ホストのタイムゾーンを使用します。
    - タイムゾーンなしの `at` スケジュールは UTC として扱われます。
    - Heartbeat の `activeHours` は、設定されたタイムゾーン解決を使用します。

  </Accordion>
</AccordionGroup>

## 関連

- [自動化とタスク](/ja-JP/automation) — すべての自動化メカニズムの概要
- [バックグラウンドタスク](/ja-JP/automation/tasks) — Cron 実行のタスク台帳
- [Heartbeat](/ja-JP/gateway/heartbeat) — 定期的なメインセッションターン
- [タイムゾーン](/ja-JP/concepts/timezone) — タイムゾーン設定

---
read_when:
    - バックグラウンドジョブまたはウェイクアップのスケジュール設定
    - 外部トリガー（Webhook、Gmail）をOpenClawに接続する
    - スケジュール済みタスクで Heartbeat と Cron のどちらを使うかを判断する
sidebarTitle: Scheduled tasks
summary: スケジュール済みジョブ、Webhook、Gateway スケジューラー向けの Gmail PubSub トリガー
title: スケジュールされたタスク
x-i18n:
    generated_at: "2026-05-06T17:52:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19c3505408ab7602775dc1168c2c7a626986fa2a15ef02a44dc864d5ec538bfe
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron は Gateway の組み込みスケジューラーです。ジョブを永続化し、適切な時刻にエージェントを起動し、チャットチャンネルまたは webhook エンドポイントへ出力を返すことができます。

## クイックスタート

<Steps>
  <Step title="一度限りのリマインダーを追加する">
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

- Cron は（モデル内ではなく）**Gateway** プロセスの中で実行されます。
- ジョブ定義は `~/.openclaw/cron/jobs.json` に永続化されるため、再起動してもスケジュールは失われません。
- ランタイム実行状態は、その隣の `~/.openclaw/cron/jobs-state.json` に永続化されます。cron 定義を git で追跡する場合は、`jobs.json` を追跡し、`jobs-state.json` を gitignore に追加してください。
- 分割後、古い OpenClaw バージョンは `jobs.json` を読み取れますが、ランタイムフィールドが `jobs-state.json` に移動したため、ジョブを新規のものとして扱う場合があります。
- Gateway の実行中または停止中に `jobs.json` が編集されると、OpenClaw は変更されたスケジュールフィールドを保留中のランタイムスロットメタデータと比較し、古くなった `nextRunAtMs` 値をクリアします。純粋な整形やキー順序だけの書き換えでは、保留中のスロットは保持されます。
- すべての cron 実行は [バックグラウンドタスク](/ja-JP/automation/tasks) レコードを作成します。
- Gateway 起動時、期限を過ぎた分離エージェントターンジョブは即座に再生されるのではなく、チャンネル接続ウィンドウの外へ再スケジュールされるため、再起動後も Discord/Telegram の起動とネイティブコマンドのセットアップの応答性が保たれます。
- 一度限りのジョブ（`--at`）は、デフォルトで成功後に自動削除されます。
- 分離 cron 実行は、実行完了時に `cron:<jobId>` セッション用に追跡されたブラウザータブ/プロセスをベストエフォートで閉じるため、切り離されたブラウザー自動化が孤立プロセスを残しません。
- 狭い cron 自己クリーンアップ許可を受け取った分離 cron 実行は、それでもスケジューラー状態と現在のジョブの自己フィルター済みリストを読み取れるため、状態/Heartbeat チェックはより広い cron 変更アクセスを得ることなく自分自身のスケジュールを検査できます。
- 分離 cron 実行は、古い確認応答の返信も防ぎます。最初の結果が単なる暫定的な状態更新（`on it`、`pulling everything together`、および類似のヒント）であり、最終回答を担当する子孫サブエージェント実行がまだ存在しない場合、OpenClaw は配信前に実際の結果を一度だけ再プロンプトします。
- 分離 cron 実行は、埋め込み実行からの構造化された実行拒否メタデータを優先し、その後 `SYSTEM_RUN_DENIED` や `INVALID_REQUEST` などの既知の最終サマリー/出力マーカーへフォールバックするため、ブロックされたコマンドが成功した実行として報告されることはありません。
- 分離 cron 実行は、返信ペイロードが生成されない場合でも実行レベルのエージェント失敗をジョブエラーとして扱うため、モデル/プロバイダーの失敗はジョブを成功としてクリアするのではなく、エラーカウンターを増やして失敗通知をトリガーします。
- 分離エージェントターンジョブが `timeoutSeconds` に達すると、cron は基盤のエージェント実行を中止し、短いクリーンアップウィンドウを与えます。実行が排出されない場合、Gateway 所有のクリーンアップが cron のタイムアウト記録前にその実行のセッション所有権を強制的にクリアするため、キューに入ったチャット作業が古い処理中セッションの背後に残されません。

<a id="maintenance"></a>

<Note>
cron のタスク照合は、まずランタイム所有、次に耐久履歴を裏付けとします。アクティブな cron タスクは、古い子セッション行がまだ存在していても、cron ランタイムがそのジョブを実行中として追跡している間はライブのままです。ランタイムがジョブの所有を停止し、5 分の猶予ウィンドウが期限切れになると、メンテナンスは一致する `cron:<jobId>:<startedAt>` 実行について、永続化された実行ログとジョブ状態を確認します。その耐久履歴が終端結果を示している場合、タスク台帳はそこから確定されます。そうでない場合、Gateway 所有のメンテナンスはタスクを `lost` としてマークできます。オフライン CLI 監査は耐久履歴から復旧できますが、自身の空のインプロセスアクティブジョブセットを、Gateway 所有の cron 実行が失われた証拠としては扱いません。
</Note>

## スケジュールタイプ

| 種類    | CLI フラグ  | 説明                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | 一度限りのタイムスタンプ（ISO 8601 または `20m` のような相対指定）    |
| `every` | `--every` | 固定間隔                                          |
| `cron`  | `--cron`  | 任意の `--tz` を伴う 5 フィールドまたは 6 フィールドの cron 式 |

タイムゾーンのないタイムスタンプは UTC として扱われます。ローカルの壁時計時刻でスケジュールするには、`--tz America/New_York` を追加してください。

毎時 0 分の繰り返し式は、負荷スパイクを減らすために最大 5 分まで自動的に分散されます。正確なタイミングを強制するには `--exact` を使用し、明示的なウィンドウには `--stagger 30s` を使用してください。

### 日付と曜日は OR ロジックを使用する

Cron 式は [croner](https://github.com/Hexagon/croner) によって解析されます。日付フィールドと曜日フィールドがどちらもワイルドカードでない場合、croner は**どちらか一方**のフィールドが一致したときに一致とします。両方ではありません。これは標準の Vixie cron の動作です。

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

これは月あたり 0〜1 回ではなく、約 5〜6 回発火します。OpenClaw はここで Croner のデフォルトの OR 動作を使用します。両方の条件を必須にするには、Croner の `+` 曜日修飾子（`0 9 15 * +1`）を使用するか、片方のフィールドでスケジュールし、もう片方をジョブのプロンプトまたはコマンドでガードしてください。

## 実行スタイル

| スタイル           | `--session` 値   | 実行場所                  | 最適な用途                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| メインセッション    | `main`              | 次の Heartbeat ターン      | リマインダー、システムイベント        |
| 分離        | `isolated`          | 専用の `cron:<jobId>` | レポート、バックグラウンド作業      |
| 現在のセッション | `current`           | 作成時にバインド   | コンテキスト対応の繰り返し作業    |
| カスタムセッション  | `session:custom-id` | 永続的な名前付きセッション | 履歴に基づいて構築されるワークフロー |

<AccordionGroup>
  <Accordion title="メインセッションと分離とカスタム">
    **メインセッション**ジョブはシステムイベントをキューに入れ、任意で Heartbeat（`--wake now` または `--wake next-heartbeat`）を起動します。これらのシステムイベントは、対象セッションの日次/アイドルリセットの鮮度を延長しません。**分離**ジョブは、新しいセッションで専用のエージェントターンを実行します。**カスタムセッション**（`session:xxx`）は実行間でコンテキストを永続化し、以前のサマリーに基づく日次スタンドアップのようなワークフローを可能にします。
  </Accordion>
  <Accordion title="分離ジョブにおける「新しいセッション」の意味">
    分離ジョブでは、「新しいセッション」とは各実行ごとの新しいトランスクリプト/セッション ID を意味します。OpenClaw は、thinking/fast/verbose 設定、ラベル、明示的にユーザーが選択したモデル/認証オーバーライドなどの安全な設定を引き継ぐ場合がありますが、古い cron 行から周囲の会話コンテキスト、つまりチャンネル/グループルーティング、送信またはキューポリシー、昇格、オリジン、ACP ランタイムバインディングは継承しません。繰り返しジョブが意図的に同じ会話コンテキストに基づくべき場合は、`current` または `session:<id>` を使用してください。
  </Accordion>
  <Accordion title="ランタイムクリーンアップ">
    分離ジョブでは、ランタイムの破棄に、その cron セッション向けのベストエフォートのブラウザークリーンアップが含まれるようになりました。クリーンアップの失敗は無視されるため、実際の cron 結果が引き続き優先されます。

    分離 cron 実行は、共有ランタイムクリーンアップパスを通じて、そのジョブ用に作成されたバンドル済み MCP ランタイムインスタンスも破棄します。これはメインセッションおよびカスタムセッションの MCP クライアントが破棄される方法と一致しているため、分離 cron ジョブは実行間で stdio 子プロセスや長寿命の MCP 接続をリークしません。

  </Accordion>
  <Accordion title="サブエージェントと Discord 配信">
    分離 cron 実行がサブエージェントをオーケストレーションする場合、配信は古い親の暫定テキストよりも、子孫の最終出力も優先します。子孫がまだ実行中の場合、OpenClaw はその部分的な親の更新を通知せずに抑制します。

    テキストのみの Discord 通知ターゲットに対して、OpenClaw はストリーミング/中間テキストペイロードと最終回答の両方を再生するのではなく、正規の最終アシスタントテキストを一度だけ送信します。メディアおよび構造化 Discord ペイロードは、添付ファイルやコンポーネントが失われないよう、引き続き個別のペイロードとして配信されます。

  </Accordion>
</AccordionGroup>

### 分離ジョブのペイロードオプション

<ParamField path="--message" type="string" required>
  プロンプトテキスト（分離では必須）。
</ParamField>
<ParamField path="--model" type="string">
  モデルオーバーライド。ジョブに対して選択された許可済みモデルを使用します。
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

`--model` は、そのジョブのプライマリモデルとして、選択された許可済みモデルを使用します。これはチャットセッションの `/model` オーバーライドとは同じではありません。ジョブのプライマリが失敗した場合でも、設定済みのフォールバックチェーンは引き続き適用されます。要求されたモデルが許可されていない、または解決できない場合、cron はジョブのエージェント/デフォルトモデル選択へ黙ってフォールバックするのではなく、明示的な検証エラーで実行を失敗させます。

Cron ジョブはペイロードレベルの `fallbacks` も保持できます。存在する場合、そのリストはジョブの設定済みフォールバックチェーンを置き換えます。選択されたモデルだけを試す厳密な cron 実行にしたい場合は、ジョブペイロード/API で `fallbacks: []` を使用してください。ジョブに `--model` があり、ペイロードにも設定済みフォールバックにもない場合、OpenClaw は明示的な空のフォールバックオーバーライドを渡すため、エージェントのプライマリが隠れた追加リトライターゲットとして追加されることはありません。

分離ジョブのモデル選択の優先順位は次のとおりです。

1. Gmail フックのモデルオーバーライド（実行が Gmail 由来で、そのオーバーライドが許可されている場合）
2. ジョブごとのペイロード `model`
3. ユーザーが選択して保存した cron セッションモデルオーバーライド
4. エージェント/デフォルトモデル選択

高速モードも解決済みのライブ選択に従います。選択されたモデル設定に `params.fastMode` がある場合、分離 cron はそれをデフォルトで使用します。保存済みセッションの `fastMode` オーバーライドは、どちらの方向でも設定より優先されます。

分離実行がライブのモデル切り替えハンドオフに到達した場合、cron は切り替え後のプロバイダー/モデルで再試行し、再試行前にそのライブ選択をアクティブな実行に永続化します。切り替えが新しい認証プロファイルも伴う場合、cron はそのアクティブな実行用の認証プロファイルオーバーライドも永続化します。再試行には上限があります。初回試行に加えて 2 回の切り替え再試行後、cron は無限ループするのではなく中止します。

分離 cron 実行がエージェントランナーに入る前に、OpenClaw は `baseUrl` が loopback、プライベートネットワーク、または `.local` である設定済みの `api: "ollama"` および `api: "openai-completions"` プロバイダーについて、到達可能なローカルプロバイダーエンドポイントを確認します。そのエンドポイントが停止している場合、実行はモデル呼び出しを開始するのではなく、明確なプロバイダー/モデルエラーとともに `skipped` として記録されます。エンドポイント結果は 5 分間キャッシュされるため、同じ停止中のローカル Ollama、vLLM、SGLang、または LM Studio サーバーを使用する多数の期限到来ジョブは、リクエストの嵐を作るのではなく、1 回の小さなプローブを共有します。プロバイダープリフライトでスキップされた実行は、実行エラーのバックオフを増やしません。繰り返しのスキップ通知が必要な場合は、`failureAlert.includeSkipped` を有効にしてください。

## 配信と出力

| モード       | 発生すること                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | エージェントが送信しなかった場合、最終テキストをターゲットへフォールバック配信する |
| `webhook`  | 完了イベントペイロードを URL に POST する                                |
| `none`     | ランナーのフォールバック配信なし                                         |

`--announce --channel telegram --to "-1001234567890"` を使用してチャンネルへ配信します。Telegram のフォーラムトピックでは `-1001234567890:topic:123` を使用します。直接 RPC/config 呼び出し元は `delivery.threadId` を文字列または数値として渡すこともできます。Slack/Discord/Mattermost のターゲットには明示的なプレフィックス（`channel:<id>`、`user:<id>`）を使用してください。Matrix のルーム ID は大文字と小文字が区別されます。正確なルーム ID、または Matrix の `room:!room:server` 形式を使用してください。

announce 配信で `channel: "last"` を使用するか `channel` を省略した場合、`telegram:123` のようなプロバイダープレフィックス付きターゲットで、cron がセッション履歴または設定済みの単一チャンネルへフォールバックする前にチャンネルを選択できます。読み込まれた plugin が公開しているプレフィックスだけがプロバイダーセレクターです。`delivery.channel` が明示されている場合、ターゲットプレフィックスは同じプロバイダー名を指定する必要があります。たとえば、`channel: "whatsapp"` と `to: "telegram:123"` の組み合わせは、WhatsApp が Telegram ID を電話番号として解釈する前に拒否されます。`channel:<id>`、`user:<id>`、`imessage:<handle>`、`sms:<number>` のようなターゲット種別とサービスのプレフィックスは、プロバイダーセレクターではなく、引き続きチャンネル所有のターゲット構文です。

分離ジョブでは、チャット配信は共有されます。チャットルートが利用可能な場合、ジョブが `--no-deliver` を使用していても、エージェントは `message` ツールを使用できます。エージェントが設定済みまたは現在のターゲットへ送信した場合、OpenClaw はフォールバック announce をスキップします。それ以外の場合、`announce`、`webhook`、`none` は、エージェントターン後の最終返信をランナーがどう扱うかだけを制御します。

エージェントがアクティブなチャットから分離リマインダーを作成すると、OpenClaw はフォールバック announce ルート用に保持されたライブ配信ターゲットを保存します。内部セッションキーは小文字になることがあります。現在のチャットコンテキストが利用可能な場合、プロバイダー配信ターゲットはそれらのキーから再構築されません。

暗黙の announce 配信では、設定済みチャンネルの allowlist を使用して古いターゲットを検証し、再ルーティングします。DM ペアリングストアの承認はフォールバック自動化の受信者ではありません。スケジュール済みジョブが DM へ能動的に送信する必要がある場合は、`delivery.to` を設定するか、チャンネルの `allowFrom` エントリを設定してください。

失敗通知は別の宛先パスに従います。

- `cron.failureDestination` は失敗通知のグローバル既定値を設定します。
- `job.delivery.failureDestination` はジョブごとにそれを上書きします。
- どちらも設定されておらず、ジョブがすでに `announce` で配信している場合、失敗通知はそのプライマリ announce ターゲットへフォールバックするようになりました。
- `delivery.failureDestination` は、プライマリ配信モードが `webhook` の場合を除き、`sessionTarget="isolated"` ジョブでのみサポートされます。
- `failureAlert.includeSkipped: true` は、ジョブまたはグローバル cron アラートポリシーで、繰り返し発生するスキップ実行アラートを有効にします。スキップされた実行は個別の連続スキップカウンターを保持するため、実行エラーのバックオフには影響しません。

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
    main セッションにシステムイベントをキューへ追加します。

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
    カスタムフック名は、config の `hooks.mappings` で解決されます。マッピングは、テンプレートまたはコード変換を使って任意のペイロードを `wake` または `agent` アクションへ変換できます。
  </Accordion>
</AccordionGroup>

<Warning>
フックエンドポイントは、loopback、tailnet、または信頼済みリバースプロキシの背後に配置してください。

- 専用のフックトークンを使用してください。gateway 認証トークンを再利用しないでください。
- `hooks.path` は専用のサブパスに保持してください。`/` は拒否されます。
- `hooks.allowedAgentIds` を設定して、明示的な `agentId` ルーティングを制限してください。
- 呼び出し元が選択するセッションが必要でない限り、`hooks.allowRequestSessionKey=false` のままにしてください。
- `hooks.allowRequestSessionKey` を有効にする場合は、許可されるセッションキー形状を制約するために `hooks.allowedSessionKeyPrefixes` も設定してください。
- フックペイロードは既定で安全境界でラップされます。

</Warning>

## Gmail PubSub 連携

Google PubSub 経由で Gmail inbox トリガーを OpenClaw に接続します。

<Note>
**前提条件:** `gcloud` CLI、`gog`（gogcli）、OpenClaw hooks 有効化、公開 HTTPS エンドポイント用の Tailscale。
</Note>

### ウィザードセットアップ（推奨）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

これは `hooks.gmail` config を書き込み、Gmail プリセットを有効化し、プッシュエンドポイントに Tailscale Funnel を使用します。

### Gateway 自動起動

`hooks.enabled=true` で `hooks.gmail.account` が設定されている場合、Gateway は起動時に `gog gmail watch serve` を開始し、watch を自動更新します。オプトアウトするには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定します。

### 手動の一回限りセットアップ

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
モデル上書きの注記:

- `openclaw cron add|edit --model ...` はジョブで選択されたモデルを変更します。
- モデルが許可されている場合、その正確なプロバイダー/モデルが分離エージェント実行に届きます。
- 許可されていない、または解決できない場合、cron は明示的な検証エラーでその実行を失敗させます。
- cron の `--model` はジョブのプライマリであり、セッションの `/model` 上書きではないため、設定済みのフォールバックチェーンは引き続き適用されます。
- ペイロードの `fallbacks` は、そのジョブの設定済みフォールバックを置き換えます。`fallbacks: []` はフォールバックを無効化し、実行を厳密にします。
- 明示的または設定済みのフォールバックリストがない単純な `--model` は、暗黙の追加再試行ターゲットとしてエージェントのプライマリへフォールスルーしません。

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

`maxConcurrentRuns` は、スケジュール済み cron ディスパッチと分離エージェントターン実行の両方を制限します。分離 cron エージェントターンは内部でキュー専用の `cron-nested` 実行レーンを使用するため、この値を上げると、外側の cron ラッパーだけが開始されるのではなく、独立した cron LLM 実行を並行して進められます。共有の非 cron `nested` レーンは、この設定では拡張されません。

ランタイム状態 sidecar は `cron.store` から派生します。`~/clawd/cron/jobs.json` のような `.json` ストアは `~/clawd/cron/jobs-state.json` を使用し、`.json` 接尾辞のないストアパスには `-state.json` が追加されます。

`jobs.json` を手動編集する場合は、`jobs-state.json` をソース管理に含めないでください。OpenClaw はその sidecar を、保留スロット、アクティブマーカー、最終実行メタデータ、外部編集されたジョブに新しい `nextRunAtMs` が必要な時期をスケジューラーに伝えるスケジュール ID に使用します。

cron を無効化: `cron.enabled: false` または `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="Retry behavior">
    **一回限りの再試行**: 一時的なエラー（レート制限、過負荷、ネットワーク、サーバーエラー）は、指数バックオフで最大 3 回再試行されます。永続的なエラーは即座に無効化されます。

    **反復再試行**: 再試行間に指数バックオフ（30 秒から 60 分）が入ります。バックオフは次回の成功実行後にリセットされます。

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention`（既定値 `24h`）は分離実行セッションエントリを刈り込みます。`cron.runLog.maxBytes` / `cron.runLog.keepLines` は run-log ファイルを自動的に刈り込みます。
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
    - `cron.enabled` と `OPENCLAW_SKIP_CRON` env var を確認してください。
    - Gateway が継続的に実行されていることを確認してください。
    - `cron` スケジュールでは、タイムゾーン（`--tz`）とホストのタイムゾーンを確認してください。
    - 実行出力の `reason: not-due` は、手動実行が `openclaw cron run <jobId> --due` でチェックされ、そのジョブがまだ期限に達していないことを意味します。

  </Accordion>
  <Accordion title="Cron が起動したが配信されない">
    - 配信モード `none` は、ランナーのフォールバック送信が想定されていないことを意味します。チャットルートが利用可能な場合、エージェントは引き続き `message` ツールで直接送信できます。
    - 配信先が欠落または無効 (`channel`/`to`) の場合、送信はスキップされます。
    - Matrix では、小文字化された `delivery.to` ルーム ID を持つコピー済みまたはレガシーのジョブが失敗することがあります。Matrix のルーム ID は大文字と小文字を区別するためです。ジョブを Matrix の正確な `!room:server` または `room:!room:server` 値に編集してください。
    - チャネル認証エラー (`unauthorized`, `Forbidden`) は、認証情報によって配信がブロックされたことを意味します。
    - 分離実行がサイレントトークン (`NO_REPLY` / `no_reply`) のみを返す場合、OpenClaw は直接の送信配信を抑制し、フォールバックのキュー済み要約パスも抑制するため、チャットには何も投稿されません。
    - エージェント自身がユーザーにメッセージを送るべき場合は、ジョブに利用可能なルート (`channel: "last"` と以前のチャット、または明示的なチャネル/ターゲット) があることを確認してください。

  </Accordion>
  <Accordion title="Cron または Heartbeat が /new-style ロールオーバーを妨げているように見える">
    - 日次リセットとアイドルリセットの鮮度は `updatedAt` に基づきません。[セッション管理](/ja-JP/concepts/session#session-lifecycle)を参照してください。
    - Cron のウェイクアップ、Heartbeat の実行、exec 通知、Gateway のブックキーピングは、ルーティング/ステータスのためにセッション行を更新することがありますが、`sessionStartedAt` または `lastInteractionAt` を延長することはありません。
    - これらのフィールドが存在する前に作成されたレガシー行については、ファイルがまだ利用可能な場合、OpenClaw はトランスクリプト JSONL のセッションヘッダーから `sessionStartedAt` を復元できます。`lastInteractionAt` のないレガシーのアイドル行は、その復元された開始時刻をアイドルの基準として使用します。

  </Accordion>
  <Accordion title="タイムゾーンの注意点">
    - `--tz` なしの Cron は、Gateway ホストのタイムゾーンを使用します。
    - タイムゾーンなしの `at` スケジュールは UTC として扱われます。
    - Heartbeat の `activeHours` は、設定済みのタイムゾーン解決を使用します。

  </Accordion>
</AccordionGroup>

## 関連

- [自動化とタスク](/ja-JP/automation) — すべての自動化メカニズムの概要
- [バックグラウンドタスク](/ja-JP/automation/tasks) — Cron 実行のタスク台帳
- [Heartbeat](/ja-JP/gateway/heartbeat) — 定期的なメインセッションターン
- [タイムゾーン](/ja-JP/concepts/timezone) — タイムゾーン設定

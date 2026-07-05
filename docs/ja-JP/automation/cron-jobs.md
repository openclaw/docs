---
read_when:
    - バックグラウンドジョブやウェイクアップのスケジュール
    - 外部トリガー（Webhook、Gmail）をOpenClawに接続する
    - スケジュールされたタスクで Heartbeat と Cron のどちらを使うか判断する
sidebarTitle: Scheduled tasks
summary: Gateway スケジューラ向けのスケジュール済みジョブ、Webhook、Gmail PubSub トリガー
title: スケジュールされたタスク
x-i18n:
    generated_at: "2026-07-05T11:00:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aa2b15d205cfb9914b4dc25ba5c446ecc8460e322e99bb784495ef7802d94f1e
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron は Gateway の組み込みスケジューラーです。ジョブを永続化し、適切なタイミングでエージェントを起動し、出力をチャットチャンネル、Webhook、またはどこにも配信しないようにできます。

## クイックスタート

<Steps>
  <Step title="Add a one-shot reminder">
    ```bash
    openclaw cron create "2027-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="Check your jobs">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="See run history">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## cron の仕組み

- Cron はモデル内ではなく、**Gateway プロセス内**で実行されます。スケジュールを発火させるには Gateway が実行中である必要があります。
- ジョブ定義、ランタイム状態、実行履歴は OpenClaw の共有 SQLite 状態データベースに永続化されるため、再起動してもスケジュールは失われません。
- cron の各実行は [バックグラウンドタスク](/ja-JP/automation/tasks) レコードを作成します。
- ワンショットジョブ (`--at`) は、デフォルトでは成功後に自動削除されます。保持するには `--keep-after-run` を渡します。
- 実行ごとの実時間予算: 設定されている場合は `--timeout-seconds`。それ以外の場合、分離/デタッチされたエージェントターンジョブは、基盤となるエージェントターンのタイムアウト (`agents.defaults.timeoutSeconds`、デフォルト 48 時間) が適用される前に、cron 独自の 60 分ウォッチドッグで制限されます。コマンドジョブのデフォルトは 10 分です。
- Gateway 起動時、期限を過ぎた分離エージェントターンジョブは即時再生されず、再スケジュールされます。これにより、モデル/ツールのブートストラップ作業がチャンネル接続ウィンドウに入りません。
- システム cron や別の外部スケジューラーから `openclaw agent` を駆動する場合、CLI がすでに `SIGTERM`/`SIGINT` を処理していても、ハードキルへのエスカレーションでラップしてください。Gateway バックの実行では、受理済み実行の中止を Gateway に要求します。ローカル実行と組み込みフォールバック実行にも同じ中止シグナルが送られます。GNU `timeout` では、単純な `timeout 600 ...` よりも `timeout -k 60 600 openclaw agent ...` を推奨します。`-k` 値は、プロセスが時間内に終了処理できない場合のバックストップです。systemd ユニットでは、最終的な kill の前に猶予ウィンドウ (`TimeoutStopSec`) 付きの `SIGTERM` 停止シグナルを使用します。元の Gateway 実行がまだアクティブな間に `--run-id` を再利用すると、2 つ目の実行を開始せず、重複は実行中として報告されます。

<AccordionGroup>
  <Accordion title="Isolated run hardening">
    - 分離実行は、完了時に `cron:<jobId>` セッション用に追跡されたブラウザータブ/プロセスをベストエフォートで閉じ、ジョブ用に作成されたバンドル MCP ランタイムインスタンスを、メインセッションおよびカスタムセッション実行で使用されるものと同じ共有ティアダウンパスで破棄します。クリーンアップ失敗は無視されるため、cron 結果が優先されます。
    - 狭い cron 自己クリーンアップ権限を持つ分離実行は、スケジューラー状態、自分自身のジョブだけを含む自己フィルター済みリスト、およびそのジョブの実行履歴を読み取ることができ、自分自身のジョブだけを削除できます。
    - 分離実行は、古い確認応答の返信を防御します。最初の結果が暫定的な状態更新 (`on it`、`pulling everything together`、および類似のヒント) のみで、最終回答を担当する子孫サブエージェントがまだ存在しない場合、OpenClaw は配信前に実際の結果を一度だけ再プロンプトします。
    - 構造化された実行拒否メタデータ (ネストされたエラーが `SYSTEM_RUN_DENIED` または `INVALID_REQUEST` で始まる node-host `UNAVAILABLE` ラッパーを含む) が認識されるため、ブロックされたコマンドが成功実行として報告されません。一方、通常のアシスタント文章が拒否と誤認されることはありません。
    - 実行レベルのエージェント失敗は、返信ペイロードがなくてもジョブエラーとしてカウントされるため、モデル/プロバイダー失敗は、ジョブを成功としてクリアするのではなく、エラーカウンターを増やして失敗通知をトリガーします。
    - ジョブが `timeoutSeconds` に達すると、cron は実行を中止し、短いクリーンアップウィンドウを与えます。終了処理できない場合、Gateway 所有のクリーンアップが、その実行のセッション所有権を強制クリアしてから cron がタイムアウトを記録するため、キュー内のチャット作業が古い処理セッションの後ろで停止しません。
    - セットアップ/起動の停止には、フェーズ固有のタイムアウトが適用されます (例: `cron: isolated agent setup timed out before runner start` または `cron: isolated agent run stalled before execution start (last phase: context-engine)`)。これらのウォッチドッグは、外部 CLI プロセスが開始する前でも組み込みおよび CLI バックのプロバイダーをカバーし、長い `timeoutSeconds` 値とは独立して上限が設定されるため、コールドスタート/auth/コンテキスト失敗がすばやく表面化します。

  </Accordion>
  <Accordion title="Task reconciliation">
    Cron タスク調整は、まずランタイム所有、次に永続履歴バックです。アクティブな cron タスクは、古い子セッション行がまだ存在していても、cron ランタイムがそのジョブを実行中として追跡している間はライブのままです。ランタイムがジョブの所有を停止し、5 分の猶予ウィンドウが期限切れになると、メンテナンスは一致する `cron:<jobId>:<startedAt>` 実行について、永続化された実行ログとジョブ状態を確認します。そこで終端結果があればタスク台帳を確定します。そうでない場合、Gateway 所有のメンテナンスがタスクを `lost` としてマークできます。オフライン CLI 監査は永続履歴から復旧できますが、自身のプロセス内アクティブジョブセットが空であることだけでは、Gateway 所有の実行がなくなった証拠にはなりません。
  </Accordion>
</AccordionGroup>

## スケジュール種別

| 種別      | CLI フラグ    | 説明                                                                                              |
| --------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| `at`      | `--at`      | ワンショットのタイムスタンプ (ISO 8601 または `20m` のような相対指定)                                                     |
| `every`   | `--every`   | 固定間隔 (`10m`、`1h`、`1d`)                                                                       |
| `cron`    | `--cron`    | オプションの `--tz` を伴う 5 フィールドまたは 6 フィールドの cron 式                                                  |
| `on-exit` | `--on-exit` | 監視対象コマンドが終了したときに一度発火 (イベントトリガー、ターンのティアダウン後も存続、オプションで `--on-exit-cwd`) |

タイムゾーンなしのタイムスタンプは UTC として扱われます。オフセットのない `--at` 日時を解釈する場合、または cron 式を評価する場合は、その IANA タイムゾーンで `--tz America/New_York` を追加します。`--tz` なしの cron 式は Gateway ホストのタイムゾーンを使用します。`--tz` は `--every` または `--on-exit` では有効ではありません。

毎時ちょうどに繰り返す式 (分が `0` で、時フィールドがワイルドカード) は、負荷スパイクを減らすため最大 5 分まで自動的にずらされます。正確なタイミングを強制するには `--exact` を使用し、明示的なウィンドウには `--stagger 30s` を使用します (cron スケジュールのみ)。

### 日付と曜日は OR ロジックを使用します

Cron 式は [croner](https://github.com/Hexagon/croner) によって解析されます。日付フィールドと曜日フィールドの両方がワイルドカードでない場合、croner は両方ではなく、**いずれか**のフィールドが一致したときに一致とします。これは標準的な Vixie cron の動作です。

```bash
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

これは月に 0〜1 回ではなく、おおよそ月に 5〜6 回発火します。両方の条件を必須にするには、croner の `+` 曜日修飾子 (`0 9 15 * +1`) を使用するか、一方のフィールドでスケジュールし、もう一方をジョブのプロンプトまたはコマンドでガードします。

## ペイロード

すべてのジョブは、フラグで選択されるちょうど 1 つのペイロード種別を持ちます。

| ペイロード       | フラグ                                           | 実行                                                    |
| ------------- | ---------------------------------------------- | ------------------------------------------------------- |
| システムイベント  | `--system-event <text>`                        | メインセッションにキュー投入され、それ自体ではモデル呼び出しはありません |
| エージェントメッセージ | `--message <text>`                             | モデルバックのエージェントターン                               |
| コマンド       | `--command <shell>` または `--command-argv <json>` | Gateway ホスト上のシェル/プロセス、モデル呼び出しはありません      |

### エージェントターンのオプション

<ParamField path="--message" type="string" required>
  プロンプトテキスト (分離/現在/カスタムセッションジョブでは必須)。
</ParamField>
<ParamField path="--model" type="string">
  モデルのオーバーライド。許可されたモデルに解決できる必要があり、そうでない場合、実行は検証エラーで失敗します。
</ParamField>
<ParamField path="--fallbacks" type="string">
  ジョブごとのフォールバックモデルリスト。例: `--fallbacks openai/gpt-5.5,openrouter/meta-llama/llama-3.3-70b-instruct:free`。フォールバックなしの厳密な実行には `--fallbacks ""` を渡します。
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  `cron edit` で、ジョブごとのフォールバックオーバーライドを削除し、ジョブが設定済みのフォールバック優先順位に従うようにします。`--fallbacks` と組み合わせることはできません。
</ParamField>
<ParamField path="--clear-model" type="boolean">
  `cron edit` で、ジョブごとのモデルオーバーライドを削除し、ジョブが通常の cron モデル優先順位 (保存済み cron セッションオーバーライド、それ以外はエージェント/デフォルトモデル) に従うようにします。`--model` と組み合わせることはできません。
</ParamField>
<ParamField path="--thinking" type="string">
  Thinking レベルのオーバーライド (`off|minimal|low|medium|high|xhigh|adaptive|max`)。
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  `cron edit` で、ジョブごとの thinking オーバーライドを削除します。`--thinking` と組み合わせることはできません。
</ParamField>
<ParamField path="--light-context" type="boolean">
  ワークスペースブートストラップファイルの注入をスキップします。
</ParamField>
<ParamField path="--tools" type="string">
  ジョブが使用できるツールを制限します。例: `--tools exec,read`。
</ParamField>

`--model` はジョブのプライマリモデルを設定します。セッションの `/model` オーバーライドを置き換えるものではないため、設定済みのフォールバックチェーンはその上に引き続き適用されます。解決できない、または許可されていないモデルは、デフォルトへ黙ってフォールバックするのではなく、明示的な検証エラーで実行に失敗します。ジョブに `--model` があり、明示的または設定済みのフォールバックリストがない場合、OpenClaw はエージェントのプライマリを隠れた再試行ターゲットとして黙って追加するのではなく、空のフォールバックオーバーライドを渡します。

分離ジョブのモデル選択優先順位は、上から順に次のとおりです。

1. ジョブごとのペイロード `model` (明示的設定。許可されていないモデルは実行に失敗します)
2. Gmail フックのモデルオーバーライド (実行が Gmail 由来で、そのオーバーライドが許可されている場合のみ)
3. ユーザーが選択した保存済み cron セッションのモデルオーバーライド
4. エージェント/デフォルトのモデル選択

高速モードは、解決されたライブ選択に従います。選択されたモデル設定に `params.fastMode` がある場合、分離 cron はデフォルトでそれを使用します。保存済みセッションの `fastMode` オーバーライド (次にエージェントの `fastModeDefault`) は、どちらの方向でもモデル設定より優先されます。自動モードはモデルの `params.fastAutoOnSeconds` カットオフを使用し、デフォルトは 60 秒です。

実行がライブのモデル切り替えハンドオフに達した場合、cron は切り替え後のプロバイダー/モデルで再試行し、その選択 (および新しい auth プロファイル) をアクティブな実行に永続化します。再試行には上限があります。最初の試行に加えて 2 回の切り替え再試行の後、cron はループせずに中止します。

分離実行を開始する前に、OpenClaw は、`baseUrl` がループバック、プライベートネットワーク、または `.local` の設定済み `api: "ollama"` および `api: "openai-completions"` プロバイダーについて、到達可能なローカルエンドポイントを確認します。このプリフライトはジョブに設定されたフォールバックチェーンをたどり、すべての候補に到達できない場合にのみ実行を `skipped` としてマークします。`--fallbacks ""` は、その探索をプライマリモデルのみに厳密化します。停止中のエンドポイントは、モデル呼び出しを開始する代わりに、明確なエラーとともに実行を `skipped` として記録します。結果はエンドポイントごと (ジョブやモデルごとではなく) に 5 分間キャッシュされるため、停止中のローカル Ollama/vLLM/SGLang/LM Studio サーバーを共有する多数の期限到来ジョブは、リクエストの嵐ではなく 1 回のプローブだけで済みます。スキップされたプリフライト実行は、実行エラーのバックオフを増加させません。繰り返しのスキップアラートを受け取るには `failureAlert.includeSkipped` を設定します。

### コマンドペイロード

コマンドペイロードは、モデルバックのターンを開始せずに、Gateway スケジューラー内で決定的なスクリプトを実行します。Gateway ホスト上で実行され、stdout/stderr をキャプチャし、実行を cron 履歴に記録し、エージェントターンジョブと同じ `announce`、`webhook`、`none` 配信モードを再利用します。

<Note>
Command cron は、エージェントの `tools.exec` 呼び出しではなく、オペレーター管理者向けの Gateway 自動化サーフェスです。cron ジョブの作成、更新、削除、または手動実行には `operator.admin` が必要です。スケジュールされたコマンド実行は、後でその管理者作成の自動化として Gateway プロセス内で実行されます。エージェント exec ポリシー（`tools.exec.mode`、承認プロンプト、エージェントごとのツール許可リスト）は、モデルから見える exec ツールを管理するものであり、command cron ペイロードは対象ではありません。
</Note>

```bash
openclaw cron create "*/15 * * * *" \
  --name "Queue depth probe" \
  --command "scripts/check-queue.sh" \
  --command-cwd "/srv/app" \
  --announce \
  --channel telegram \
  --to "-1001234567890"
```

`--command <shell>` は `argv: ["sh", "-lc", <shell>]` を保存します。シェル解析なしで正確な argv 実行を行うには `--command-argv '["node","scripts/report.mjs"]'` を使用します。任意の `--command-env KEY=VALUE`（繰り返し可）、`--command-input`、`--timeout-seconds`（デフォルトは 10 分）、`--no-output-timeout-seconds`、`--output-max-bytes` は、プロセス環境、stdin、出力の上限を制御します。

配信されるテキストはプロセス出力から導出されます。空でない stdout が優先されます。stdout が空で stderr が空でない場合は、stderr が配信されます。両方が存在する場合、cron は小さな `stdout:` / `stderr:` ブロックを送信します。終了コード `0` は実行を `ok` として記録します。0 以外の終了、シグナル、タイムアウト、または無出力タイムアウトは `error` として記録され、失敗アラートをトリガーできます。`NO_REPLY` だけを出力するコマンドは、通常の cron サイレントトークン抑制を使用し、チャットには何も投稿しません。

## 実行スタイル

| スタイル | `--session` 値 | 実行先 | 最適な用途 |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| メインセッション | `main` | 専用 cron wake レーン | リマインダー、システムイベント |
| 分離 | `isolated` | 専用 `cron:<jobId>` | レポート、バックグラウンド作業 |
| 現在のセッション | `current` | 作成時にバインド | コンテキスト対応の定期作業 |
| カスタムセッション | `session:custom-id` | 永続的な名前付きセッション | 履歴を積み上げるワークフロー |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    **メインセッション** ジョブは、システムイベントを cron 所有の実行レーンにエンキューし、必要に応じて Heartbeat（`--wake now` または `--wake next-heartbeat`）を起動します。返信にはターゲットのメインセッションの直近の配信コンテキストを使用できますが、通常の cron ターンを人間とのチャットレーンに追加せず、ターゲットセッションの日次/アイドルリセットの鮮度も延長しません。**分離** ジョブは、新しいセッションで専用のエージェントターンを実行します。**カスタムセッション**（`session:xxx`）は実行間でコンテキストを保持し、前回の要約を踏まえる日次スタンドアップのようなワークフローを可能にします。

    メインセッションの cron イベントは、自己完結したシステムイベントリマインダーです。デフォルトの Heartbeat プロンプトにある「Read HEARTBEAT.md」指示は自動的には含まれません。リマインダーが `HEARTBEAT.md` を参照するべき場合は、cron イベントテキストで明示してください。

  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    実行ごとに新しいトランスクリプト/セッション ID が作成されます。OpenClaw は安全な設定（thinking/fast/verbose 設定、ラベル、明示的にユーザーが選択したモデル/auth 上書き）を引き継ぎますが、古い cron 行から周辺の会話コンテキストは継承しません。つまり、チャンネル/グループルーティング、送信またはキューポリシー、昇格、origin、ACP ランタイムバインディングは継承されません。定期ジョブが意図的に同じ会話コンテキストを積み上げる必要がある場合は、`current` または `session:<id>` を使用してください。
  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    分離 cron 実行がサブエージェントを編成する場合、配信では古い親の途中テキストよりも、最終 descendant 出力が優先されます。descendant がまだ実行中の場合、OpenClaw はその部分的な親更新を告知せずに抑制します。

    テキストのみの Discord 告知ターゲットでは、OpenClaw はストリーミング/中間テキストと最終回答の両方を再生するのではなく、正規の最終アシスタントテキストを 1 回だけ送信します。メディアと構造化された Discord ペイロードは、添付ファイルとコンポーネントが失われないように、引き続き個別に配信されます。

  </Accordion>
</AccordionGroup>

## 配信と出力

| モード | 動作 |
| ---------- | ------------------------------------------------------------------- |
| `announce` | エージェントが送信しなかった場合、最終テキストをターゲットへフォールバック配信 |
| `webhook` | 完了イベントペイロードを URL に POST |
| `none` | ランナーのフォールバック配信なし |

チャンネル配信には `--announce --channel telegram --to "-1001234567890"` を使用します。Telegram フォーラムトピックでは `-1001234567890:topic:123` を使用します。OpenClaw は Telegram 所有の省略形 `-1001234567890:123` も受け付けます。直接 RPC/config 呼び出し元は `delivery.threadId` を文字列または数値として渡せます。Slack/Discord/Mattermost ターゲットは明示的な接頭辞（`channel:<id>`、`user:<id>`）を使用します。Matrix ルーム ID は大文字と小文字が区別されます。正確なルーム ID または Matrix の `room:!room:server` 形式を使用してください。

告知配信で `channel: "last"` を使用するか `channel` を省略した場合、`telegram:123` のようなプロバイダー接頭辞付きターゲットは、cron がセッション履歴または単一の設定済みチャンネルへフォールバックする前にチャンネルを選択できます。読み込まれた plugin によって広告されている接頭辞だけがプロバイダーセレクターです。`delivery.channel` が明示されている場合、ターゲット接頭辞は同じプロバイダーを指す必要があります。`channel: "whatsapp"` と `to: "telegram:123"` の組み合わせは、WhatsApp が Telegram ID を電話番号として解釈することを許さず、拒否されます。ターゲット種別とサービス接頭辞（`channel:<id>`、`user:<id>`、`imessage:<handle>`、`sms:<number>`）は、プロバイダーセレクターではなく、チャンネル所有のターゲット構文のままです。

分離ジョブでは、チャット配信は共有されます。チャットルートが利用可能な場合、エージェントは `--no-deliver` があっても `message` ツールを使用できます。エージェントが設定済み/現在のターゲットへ送信した場合、OpenClaw はフォールバック告知をスキップします。それ以外では、`announce`、`webhook`、`none` はエージェントターン後にランナーが最終返信をどう扱うかだけを制御します。

エージェントがアクティブなチャットから分離リマインダーを作成すると、OpenClaw はフォールバック告知ルート用に保持されたライブ配信ターゲットを保存します。内部セッションキーは小文字の場合があります。現在のチャットコンテキストが利用可能な場合、プロバイダー配信ターゲットはそれらのキーから再構築されません。

暗黙の告知配信は、設定済みチャンネル許可リストを使用して古いターゲットを検証し、再ルーティングします。DM ペアリングストア承認はフォールバック自動化の受信者ではありません。スケジュールされたジョブが DM に能動的に送信する必要がある場合は、`delivery.to` を設定するか、チャンネルの `allowFrom` エントリを設定してください。

### 失敗通知

失敗通知は別の宛先パスに従います。

- `cron.failureDestination` は失敗通知のグローバルデフォルトを設定します。
- `job.delivery.failureDestination` はジョブごとにそれを上書きします。
- どちらも設定されておらず、ジョブがすでに `announce` で配信している場合、失敗通知はその主告知ターゲットへフォールバックします。
- `delivery.failureDestination` は、主配信モードが `webhook` でない限り、`sessionTarget="isolated"` ジョブでのみサポートされます。
- `failureAlert.includeSkipped: true` は、ジョブまたはグローバル cron アラートポリシーで、繰り返しスキップされた実行のアラートを有効にします。スキップされた実行は別の連続スキップカウンターを保持するため、実行エラーのバックオフには影響しません。
- `openclaw cron edit` はジョブごとのアラート調整を公開します。`--failure-alert`/`--no-failure-alert`、`--failure-alert-after <n>`、`--failure-alert-channel`、`--failure-alert-to`、`--failure-alert-cooldown`、`--failure-alert-include-skipped`/`--failure-alert-exclude-skipped`、`--failure-alert-mode`、`--failure-alert-account-id` です。

### 出力言語

Cron ジョブは、チャンネル、ロケール、または以前のメッセージから返信言語を推測しません。スケジュールされたメッセージまたはテンプレートに言語ルールを入れてください。

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

テンプレートファイルでは、レンダリングされたプロンプトに言語指示を保持し、ジョブ実行前に `{{language}}` などのプレースホルダーが埋まっていることを確認してください。出力に複数の言語が混在する場合は、たとえば「Use Chinese for narrative text and keep technical terms in English.」のように、ルールを明示してください。

## CLI 例

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
    openclaw cron create "0 7 * * *" \
      "Summarize overnight updates." \
      --name "Morning brief" \
      --tz "America/Los_Angeles" \
      --session isolated \
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
  <Tab title="Webhook output">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="Command output">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "Queue depth probe" \
      --command "scripts/check-queue.sh" \
      --command-cwd "/srv/app" \
      --announce \
      --channel telegram \
      --to "-1001234567890"
    ```
  </Tab>
</Tabs>

## ジョブの管理

```bash
# List all jobs
openclaw cron list

# Get one stored job as JSON
openclaw cron get <jobId>

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Enable/disable without deleting
openclaw cron enable <jobId>
openclaw cron disable <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Force run a job now and wait for its terminal status
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# View one exact run
openclaw cron runs --id <jobId> --run-id <runId>

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron create "0 6 * * *" "Check ops queue" --name "Ops sweep" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

`openclaw cron run <jobId>` は手動実行をエンキューした後に戻ります。シャットダウンフック、メンテナンススクリプト、またはキューに入った実行が完了するまでブロックする必要があるその他の自動化には `--wait` を使用します。返された `runId` をポーリングし（デフォルトタイムアウトは `10m`、ポーリング間隔は `2s`）、ステータス `ok` では `0`、`error`、`skipped`、または待機タイムアウトでは 0 以外で終了します。

エージェントの `cron` ツールは、`cron(action: "list")` からコンパクトなジョブ要約（`id`、`name`、`enabled`、`nextRunAtMs`、`scheduleKind`、`lastRunStatus`）を返します。1 つの完全なジョブ定義には `cron(action: "get", jobId: "...")` を使用してください。直接 Gateway 呼び出し元は `cron.list` に `compact: true` を渡せます。省略すると、配信プレビューを含む完全なレスポンスが保持されます。

`openclaw cron create` は `openclaw cron add` のエイリアスです。新しいジョブでは、位置引数のスケジュール（`"0 9 * * 1"`、`"every 1h"`、`"20m"`、または ISO タイムスタンプ）に続けて、位置引数のエージェントプロンプトを使用できます。完了した実行ペイロードを HTTP エンドポイントへ POST するには、`cron add|create` または `cron edit` で `--webhook <url>` を使用します。Webhook 配信はチャット配信フラグ（`--announce`、`--channel`、`--to`、`--thread-id`、`--account`）と組み合わせることはできません。`cron edit` では、`--clear-channel`、`--clear-to`、`--clear-thread-id`、`--clear-account` がそれぞれのルーティングフィールドを個別に解除します（各フラグは対応する設定フラグと同時指定すると拒否されます）。これは `--no-deliver` とは異なり、`--no-deliver` はランナーのフォールバック配信のみを無効にします。

<Note>
モデルオーバーライドの注記:

- `openclaw cron add|edit --model ...` はジョブで選択されたモデルを変更します。
- モデルが許可されている場合、その正確なプロバイダー/モデルが分離されたエージェント実行に届きます。
- 許可されていない、または解決できない場合、cron は明示的な検証エラーで実行を失敗させます。
- API の `cron.update` ペイロードパッチでは、保存済みジョブモデルオーバーライドをクリアするために `model: null` を設定できます。
- `openclaw cron edit <job-id> --clear-model` は CLI からそのオーバーライドをクリアし（`model: null` パッチと同じ効果）、`--model` と組み合わせることはできません。
- cron の `--model` はジョブのプライマリであり、セッションの `/model` オーバーライドではないため、設定済みのフォールバックチェーンは引き続き適用されます。
- `openclaw cron add|edit --fallbacks ...` はペイロードの `fallbacks` を設定し、そのジョブの設定済みフォールバックを置き換えます。`--fallbacks ""` はフォールバックを無効にし、実行を厳格にします。`openclaw cron edit <job-id> --clear-fallbacks` はジョブ単位のオーバーライドをクリアします。
- 明示的または設定済みのフォールバックリストがない単なる `--model` は、サイレントな追加リトライ対象としてエージェントのプライマリへフォールスルーしません。

</Note>

## Webhook

Gateway は外部トリガー用の HTTP Webhook エンドポイントを公開できます。設定で有効化します:

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

すべてのリクエストは、ヘッダーでフックトークンを含める必要があります:

- `Authorization: Bearer <token>`（推奨）
- `x-openclaw-token: <token>`

クエリ文字列のトークンは拒否されます。

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    メインセッションのシステムイベントをキューに入れます:

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
    分離されたエージェントターンを実行します:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.5"}'
    ```

    フィールド: `message`（必須）、`name`、`agentId`、`sessionKey`（`hooks.allowRequestSessionKey=true` が必要）、`idempotencyKey`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`thinking`、`timeoutSeconds`。

  </Accordion>
  <Accordion title="マップされたフック（POST /hooks/<name>）">
    カスタムフック名は、設定内の `hooks.mappings` によって解決されます。マッピングは、テンプレートまたはコード変換を使って任意のペイロードを `wake` または `agent` アクションに変換できます。
  </Accordion>
</AccordionGroup>

<Warning>
フックエンドポイントは、loopback、tailnet、または信頼できるリバースプロキシの背後に置いてください。

- 専用のフックトークンを使用し、gateway 認証トークンは再利用しないでください。
- `hooks.path` は専用のサブパスにしてください。`/` は拒否されます。
- `hooks.allowedAgentIds` を設定して、`agentId` が省略された場合のデフォルトエージェントを含め、フックが対象にできる有効なエージェントを制限してください。
- 呼び出し元が選択するセッションが必要でない限り、`hooks.allowRequestSessionKey=false` のままにしてください。
- `hooks.allowRequestSessionKey` を有効にする場合は、許可されるセッションキー形状を制約するために `hooks.allowedSessionKeyPrefixes` も設定してください。
- フックペイロードはデフォルトで安全境界にラップされます。

</Warning>

## Gmail PubSub 連携

Google PubSub 経由で Gmail の受信トリガーを OpenClaw に接続します。

<Note>
**前提条件:** `gcloud` CLI、`gog`（gogcli）、OpenClaw フック有効化、公開 HTTPS エンドポイント用の Tailscale。
</Note>

### ウィザードセットアップ（推奨）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

これにより `hooks.gmail` 設定が書き込まれ、Gmail プリセットが有効化され、プッシュエンドポイントはデフォルトで Tailscale Funnel になります（`--tailscale funnel|serve|off`）。

### Gateway 自動起動

`hooks.enabled=true` かつ `hooks.gmail.account` が設定されている場合、Gateway は起動時に `gog gmail watch serve` を開始し、watch を自動更新します。オプトアウトするには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定してください。

### 手動の 1 回限りのセットアップ

<Steps>
  <Step title="GCP プロジェクトを選択">
    `gog` が使用する OAuth クライアントを所有する GCP プロジェクトを選択します:

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

## 設定

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

上記の `retry` 値はデフォルトです。`30s/60s/5m` のバックオフで最大 3 回リトライし、5 つすべての一時的カテゴリをリトライします。`webhookToken` は、cron Webhook の POST で `Authorization: Bearer <token>` として送信されます。

`maxConcurrentRuns` は、スケジュールされた cron ディスパッチと分離されたエージェントターン実行の両方を制限し、デフォルトは 8 です。分離された cron エージェントターンは、内部的にキュー専用の `cron-nested` 実行レーンを使用するため、この値を引き上げると、外側の cron ラッパーだけを開始するのではなく、独立した cron LLM 実行を並列に進められます。共有の非 cron `nested` レーンは、この設定では拡張されません。

`cron.store` は論理ストアキーおよび doctor 移行パスであり、手動編集するライブ JSON ファイルではありません。ジョブデータは SQLite に保存されます。変更には CLI または Gateway API を使用してください。

cron を無効化: `cron.enabled: false` または `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="リトライ動作">
    **ワンショットリトライ**: 一時的エラー（レート制限、過負荷、ネットワーク、タイムアウト、サーバーエラー）は、`retry.backoffMs`（デフォルト 30s、60s、5m）を使って最大 `retry.maxAttempts` 回（デフォルト 3）リトライされます。恒久的エラーはジョブを即座に無効化します。

    **定期リトライ**: 連続する実行エラーは、拡張スケジュール（30s、60s、5m、15m、60m）でバックオフします。次回の実行が成功すると、バックオフはリセットされます。

  </Accordion>
  <Accordion title="メンテナンス">
    `cron.sessionRetention`（デフォルト `24h`、`false` で無効）は、分離実行セッションのエントリを削除します。`cron.runLog.keepLines` は、ジョブごとに保持される SQLite 実行履歴行を制限します。`maxBytes` は、古いファイルバックの実行ログとの設定互換性のために保持されています。
  </Accordion>
  <Accordion title="レガシーストア移行">
    アップグレード時に `openclaw doctor --fix` を実行して、レガシーの `~/.openclaw/cron/jobs.json`、`jobs-state.json`、`runs/*.jsonl` ファイルを SQLite にインポートし、`.migrated` サフィックス付きにリネームします。不正なジョブ行はランタイムからスキップされ、後で修復またはレビューできるように `jobs-quarantine.json` にコピーされます。
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
  <Accordion title="Cron が発火しない">
    - `cron.enabled` と `OPENCLAW_SKIP_CRON` 環境変数を確認してください。
    - Gateway が継続して実行されていることを確認してください。
    - `cron` スケジュールでは、タイムゾーン（`--tz`）とホストのタイムゾーンを確認してください。
    - 実行出力の `reason: not-due` は、手動実行が `openclaw cron run <jobId> --due` で確認され、ジョブがまだ期限に達していなかったことを意味します。

  </Accordion>
  <Accordion title="Cron は発火したが配信されない">
    - 配信モード `none` は、ランナーのフォールバック送信が想定されていないことを意味します。チャットルートが利用可能な場合、エージェントは `message` ツールで直接送信することもできます。
    - 配信先が欠落または無効（`channel`/`to`）な場合、送信はスキップされます。
    - Matrix では、コピーされたジョブやレガシージョブで小文字化された `delivery.to` ルーム ID があると、Matrix のルーム ID は大文字小文字を区別するため失敗することがあります。Matrix から取得した正確な `!room:server` または `room:!room:server` の値にジョブを編集してください。
    - チャンネル認証エラー（`unauthorized`、`Forbidden`）は、認証情報によって配信がブロックされたことを意味します。
    - 分離実行がサイレントトークン（`NO_REPLY` / `no_reply`）のみを返す場合、OpenClaw は直接の外向き配信とフォールバックのキュー済みサマリーパスを抑制するため、チャットには何も投稿されません。
    - エージェント自身がユーザーへメッセージする必要がある場合は、ジョブに利用可能なルート（以前のチャットがある `channel: "last"`、または明示的なチャンネル/ターゲット）があることを確認してください。

  </Accordion>
  <Accordion title="Cron または Heartbeat が /new-style ロールオーバーを妨げているように見える">
    - 日次およびアイドルリセットの鮮度は `updatedAt` に基づいていません。[セッション管理](/ja-JP/concepts/session#session-lifecycle)を参照してください。
    - Cron の wakeup、Heartbeat 実行、exec 通知、Gateway の bookkeeping は、ルーティング/ステータスのためにセッション行を更新することがありますが、`sessionStartedAt` や `lastInteractionAt` は延長しません。
    - これらのフィールドが存在する前に作成されたレガシー行では、ファイルがまだ利用可能な場合、OpenClaw は transcript JSONL のセッションヘッダーから `sessionStartedAt` を復元できます。`lastInteractionAt` がないレガシーのアイドル行では、その復元された開始時刻をアイドル基準として使用します。

  </Accordion>
  <Accordion title="タイムゾーンの注意点">
    - `--tz` なしの Cron は Gateway ホストのタイムゾーンを使用します。
    - タイムゾーンなしの `at` スケジュールは UTC として扱われます。
    - Heartbeat の `activeHours` は、設定済みタイムゾーン解決を使用します。

  </Accordion>
</AccordionGroup>

## 関連

- [自動化](/ja-JP/automation) — すべての自動化メカニズムの概要
- [バックグラウンドタスク](/ja-JP/automation/tasks) — cron 実行のタスク台帳
- [Heartbeat](/ja-JP/gateway/heartbeat) — 定期的なメインセッションターン
- [タイムゾーン](/ja-JP/concepts/timezone) — タイムゾーン設定

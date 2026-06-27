---
read_when:
    - バックグラウンドジョブまたはウェイクアップのスケジュール設定
    - 外部トリガー（Webhook、Gmail）をOpenClawに接続する
    - スケジュール済みタスクで Heartbeat と Cron のどちらを使うかを決める
sidebarTitle: Scheduled tasks
summary: Gateway スケジューラ向けのスケジュール済みジョブ、Webhook、Gmail PubSub トリガー
title: スケジュールされたタスク
x-i18n:
    generated_at: "2026-06-27T10:30:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97097c9809afea699caa0c60d2ab5b71cd3794f90d9e002d35d25e76ca40d63c
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron は Gateway に組み込まれたスケジューラです。ジョブを永続化し、適切な時刻にエージェントを起動し、出力をチャットチャネルまたは Webhook エンドポイントへ返すことができます。

## クイックスタート

<Steps>
  <Step title="1 回限りのリマインダーを追加する">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
      --name "Reminder" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="ジョブを確認する">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
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

- Cron は **Gateway の内部**プロセスで実行されます（モデルの内部ではありません）。
- ジョブ定義、ランタイム状態、実行履歴は OpenClaw の共有 SQLite 状態データベースに永続化されるため、再起動してもスケジュールは失われません。
- アップグレード時には、`openclaw doctor --fix` を実行して、従来の `~/.openclaw/cron/jobs.json`、`jobs-state.json`、`runs/*.jsonl` ファイルを SQLite にインポートし、`.migrated` サフィックス付きにリネームします。不正な形式のジョブ行はランタイムからスキップされ、後で修復またはレビューできるように `jobs-quarantine.json` にコピーされます。
- `cron.store` は引き続き論理的な cron ストアキーと doctor インポートパスを表します。インポート後、その JSON ファイルを編集してもアクティブな cron ジョブは変更されません。代わりに `openclaw cron add|edit|remove` または Gateway cron RPC メソッドを使用してください。
- すべての cron 実行は [バックグラウンドタスク](/ja-JP/automation/tasks) レコードを作成します。
- Gateway 起動時、期限超過の分離エージェントターンジョブは即座に再生されるのではなく、チャネル接続ウィンドウの外へ再スケジュールされるため、再起動後も Discord/Telegram の起動とネイティブコマンドのセットアップは応答性を保ちます。
- 1 回限りのジョブ（`--at`）は、既定で成功後に自動削除されます。
- 分離 cron 実行は、実行完了時に `cron:<jobId>` セッション用に追跡されたブラウザタブ/プロセスをベストエフォートで閉じるため、切り離されたブラウザ自動化が孤立プロセスを残しません。
- 狭い cron 自己クリーンアップ権限を受け取った分離 cron 実行は、スケジューラ状態、自分の現在ジョブに自己フィルタされた一覧、そのジョブの実行履歴を引き続き読み取れるため、状態/Heartbeat チェックはより広い cron 変更アクセスを得ることなく、自分自身のスケジュールを検査できます。
- 分離 cron 実行は、古い確認応答の返信も防ぎます。最初の結果が暫定的な状態更新（`on it`、`pulling everything together` などのヒント）だけで、最終回答を担当している子孫サブエージェント実行が残っていない場合、OpenClaw は配信前に実際の結果を 1 回だけ再プロンプトします。
- 分離 cron 実行は、組み込み実行からの構造化された実行拒否メタデータを使用します。これには、ネストされたエラーメッセージが `SYSTEM_RUN_DENIED` または `INVALID_REQUEST` で始まる node-host `UNAVAILABLE` ラッパーも含まれるため、ブロックされたコマンドが正常な実行として報告されることはなく、通常のアシスタントの文章が拒否として扱われることもありません。
- 分離 cron 実行は、返信ペイロードが生成されない場合でも、実行レベルのエージェント失敗をジョブエラーとして扱うため、モデル/プロバイダの失敗はジョブを成功として消し込むのではなく、エラーカウンターを増やして失敗通知をトリガーします。
- 分離エージェントターンジョブが `timeoutSeconds` に達すると、cron は基礎となるエージェント実行を中止し、短いクリーンアップウィンドウを与えます。実行が排出されない場合、Gateway 所有のクリーンアップが、その実行のセッション所有権を強制的にクリアしてから cron がタイムアウトを記録するため、キュー内のチャット作業が古い処理中セッションの背後に残りません。
- 分離エージェントターンがランナー開始前、または最初のモデル呼び出し前に停止した場合、cron は `setup timed out before runner start` や `stalled before first model call (last phase: context-engine)` のようなフェーズ固有のタイムアウトを記録します。これらのウォッチドッグは、外部 CLI プロセスが実際に起動される前の組み込みプロバイダと CLI バックのプロバイダをカバーし、長い `timeoutSeconds` 値とは独立して上限が設定されるため、コールドスタート/認証/コンテキスト失敗がジョブ全体の予算を待たずに素早く表面化します。
- システム cron または別の外部スケジューラを使用して `openclaw agent` を実行する場合、CLI が `SIGTERM`/`SIGINT` を処理するとしても、ハードキルへのエスカレーションでラップしてください。Gateway バックの実行は、受け付け済み実行の中止を Gateway に要求します。ローカル実行と組み込みフォールバック実行は同じ中止シグナルを受け取ります。GNU `timeout` では、単なる `timeout 600 ...` ではなく `timeout -k 60 600 openclaw agent ...` を推奨します。`-k` 値は、プロセスが排出できない場合のスーパーバイザのバックストップです。systemd ユニットでは、`SIGTERM` 停止シグナルと、最終的な kill の前に `TimeoutStopSec` のような猶予ウィンドウを使用して同じ形を保ってください。元の Gateway 実行がまだアクティブな間にリトライが `--run-id` を再利用すると、重複は 2 つ目の実行を開始するのではなく、実行中として報告されます。

<a id="maintenance"></a>

<Note>
cron のタスク照合は、まずランタイム所有、次に永続履歴バックです。古い子セッション行がまだ存在していても、cron ランタイムがそのジョブを実行中として追跡している間、アクティブな cron タスクは live のままです。ランタイムがジョブの所有を停止し、5 分間の猶予ウィンドウが期限切れになると、メンテナンスは一致する `cron:<jobId>:<startedAt>` 実行について、永続化された実行ログとジョブ状態を確認します。その永続履歴が終端結果を示している場合、タスク台帳はそれを基に確定されます。そうでない場合、Gateway 所有のメンテナンスはタスクを `lost` としてマークできます。オフライン CLI 監査は永続履歴から復旧できますが、自身の空のインプロセス active-job セットを、Gateway 所有の cron 実行が消えた証拠としては扱いません。
</Note>

## スケジュール種別

| 種類    | CLI フラグ  | 説明                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | 1 回限りのタイムスタンプ（ISO 8601 または `20m` のような相対指定）    |
| `every` | `--every` | 固定間隔                                          |
| `cron`  | `--cron`  | 任意の `--tz` を伴う 5 フィールドまたは 6 フィールドの cron 式 |

タイムゾーンのないタイムスタンプは UTC として扱われます。ローカルの壁時計時刻でスケジュールするには、`--tz America/New_York` を追加してください。

毎時ちょうどの繰り返し式は、負荷スパイクを減らすために最大 5 分まで自動的に分散されます。正確なタイミングを強制するには `--exact` を、明示的なウィンドウには `--stagger 30s` を使用してください。

### 日と曜日は OR ロジックを使用する

Cron 式は [croner](https://github.com/Hexagon/croner) によって解析されます。日フィールドと曜日フィールドがどちらもワイルドカードでない場合、croner は **どちらか一方**のフィールドが一致したときに一致とします。両方ではありません。これは標準的な Vixie cron の動作です。

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

これは月 0〜1 回ではなく、月に約 5〜6 回発火します。ここでは OpenClaw は Croner の既定の OR 動作を使用します。両方の条件を要求するには、Croner の `+` 曜日修飾子（`0 9 15 * +1`）を使用するか、一方のフィールドでスケジュールし、もう一方をジョブのプロンプトまたはコマンド内でガードしてください。

## 実行スタイル

| スタイル           | `--session` 値   | 実行場所                  | 最適な用途                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| メインセッション    | `main`              | 専用 cron wake レーン | リマインダー、システムイベント        |
| 分離        | `isolated`          | 専用 `cron:<jobId>` | レポート、バックグラウンド作業      |
| 現在のセッション | `current`           | 作成時にバインド   | コンテキスト対応の繰り返し作業    |
| カスタムセッション  | `session:custom-id` | 永続的な名前付きセッション | 履歴を積み上げるワークフロー |

<AccordionGroup>
  <Accordion title="メインセッション、分離、カスタムの違い">
    **メインセッション**ジョブは、cron 所有の実行レーンにシステムイベントをエンキューし、任意で Heartbeat を起動します（`--wake now` または `--wake next-heartbeat`）。返信にはターゲットのメインセッションの最後の配信コンテキストを使用できますが、通常の cron ターンを人間のチャットレーンに追加せず、ターゲットセッションの日次/アイドルリセットの鮮度も延長しません。**分離**ジョブは、新しいセッションで専用のエージェントターンを実行します。**カスタムセッション**（`session:xxx`）は実行間でコンテキストを永続化し、前回の要約を基にする日次スタンドアップのようなワークフローを可能にします。

    メインセッション cron イベントは、自己完結したシステムイベントリマインダーです。既定の Heartbeat プロンプトの「Read
    HEARTBEAT.md」指示は自動的には含まれません。繰り返しリマインダーが
    `HEARTBEAT.md` を参照すべき場合は、cron イベントテキストまたは
    エージェント自身の指示で明示的に述べてください。

  </Accordion>
  <Accordion title="分離ジョブにおける「新しいセッション」の意味">
    分離ジョブでは、「新しいセッション」は各実行ごとの新しい transcript/session id を意味します。OpenClaw は thinking/fast/verbose 設定、ラベル、明示的にユーザーが選択したモデル/認証オーバーライドなど安全なプリファレンスを引き継ぐ場合がありますが、古い cron 行から周囲の会話コンテキストを継承することはありません。つまり、チャネル/グループルーティング、送信またはキューポリシー、昇格、origin、ACP ランタイムバインディングは継承されません。繰り返しジョブが意図的に同じ会話コンテキストを基にするべき場合は、`current` または `session:<id>` を使用してください。
  </Accordion>
  <Accordion title="ランタイムクリーンアップ">
    分離ジョブでは、ランタイムの終了処理に、その cron セッション用のベストエフォートなブラウザクリーンアップが含まれるようになりました。クリーンアップ失敗は無視されるため、実際の cron 結果が引き続き優先されます。

    分離 cron 実行は、共有ランタイムクリーンアップパスを通じて、そのジョブ用に作成されたバンドル MCP ランタイムインスタンスも破棄します。これはメインセッションおよびカスタムセッションの MCP クライアントの終了処理と一致するため、分離 cron ジョブは実行間で stdio 子プロセスや長寿命の MCP 接続をリークしません。

  </Accordion>
  <Accordion title="サブエージェントと Discord 配信">
    分離 cron 実行がサブエージェントをオーケストレーションする場合、配信も古い親の暫定テキストより最終的な子孫出力を優先します。子孫がまだ実行中の場合、OpenClaw はその部分的な親更新を通知せずに抑制します。

    テキストのみの Discord 通知ターゲットでは、OpenClaw はストリーミング/中間テキストペイロードと最終回答の両方を再生するのではなく、正規の最終アシスタントテキストを 1 回送信します。メディアと構造化 Discord ペイロードは引き続き別ペイロードとして配信されるため、添付ファイルとコンポーネントはドロップされません。

  </Accordion>
</AccordionGroup>

### コマンドペイロード

モデルバックの分離エージェントターンを開始せずに Gateway スケジューラ内で実行すべき決定的なスクリプトには、コマンドペイロードを使用します。コマンドジョブは Gateway ホスト上で実行され、stdout/stderr をキャプチャし、cron 履歴に実行を記録し、分離ジョブと同じ `announce`、`webhook`、`none` 配信モードを再利用します。

<Note>
コマンド cron は、エージェントの `tools.exec` 呼び出しではなく、operator-admin Gateway 自動化サーフェスです。cron ジョブの作成、更新、削除、または手動実行には
`operator.admin` が必要です。スケジュールされたコマンド実行は、後で
Gateway プロセス内で、その admin 作成の自動化として実行されます。
`tools.exec.mode`、承認プロンプト、エージェントごとのツール許可リストなどのエージェント exec ポリシーは、モデルから見える exec ツールを管理するものであり、コマンド cron ペイロードを管理するものではありません。
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

`--command <shell>` は `argv: ["sh", "-lc", <shell>]` を保存します。シェル解析なしで正確な argv 実行を行いたい場合は、`--command-argv '["node","scripts/report.mjs"]'` を使用してください。任意の `--command-env KEY=VALUE`、`--command-input`、`--timeout-seconds`、`--no-output-timeout-seconds`、`--output-max-bytes` フィールドは、プロセス環境、stdin、出力上限を制御します。

stdout が空でない場合、そのテキストが配信結果になります。stdout が空で、stderr が空でない場合は、stderr が配信されます。両方のストリームが存在する場合、cron は小さな `stdout:` / `stderr:` ブロックを配信します。終了コード 0 は実行を `ok` として記録します。0 以外の終了、シグナル、タイムアウト、または出力なしタイムアウトは `error` を記録し、失敗アラートをトリガーできます。`NO_REPLY` だけを出力するコマンドは、通常の cron サイレントトークン抑制を使用し、チャットには何も投稿しません。

### 分離ジョブのペイロードオプション

<ParamField path="--message" type="string" required>
  プロンプトテキスト（分離では必須）。
</ParamField>
<ParamField path="--model" type="string">
  モデルのオーバーライド。ジョブに選択された許可済みモデルを使用します。
</ParamField>
<ParamField path="--fallbacks" type="string">
  ジョブごとのフォールバックモデルリスト。例: `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`。フォールバックなしの厳密な実行には `--fallbacks ""` を渡します。
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  `cron edit` で、ジョブごとのフォールバックオーバーライドを削除し、ジョブが設定済みのフォールバック優先順位に従うようにします。`--fallbacks` と組み合わせることはできません。
</ParamField>
<ParamField path="--clear-model" type="boolean">
  `cron edit` で、ジョブごとのモデルオーバーライドを削除し、ジョブが通常の cron モデル選択優先順位（設定されている場合は保存済み cron セッションオーバーライド、それ以外はエージェント/デフォルトモデル）に従うようにします。`--model` と組み合わせることはできません。
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

`--model` は、選択された許可済みモデルをそのジョブのプライマリモデルとして使用します。これはチャットセッションの `/model` オーバーライドとは同じではありません。ジョブのプライマリが失敗した場合も、設定済みのフォールバックチェーンが適用されます。要求されたモデルが許可されていない、または解決できない場合、cron はジョブのエージェント/デフォルトモデル選択へ暗黙にフォールバックするのではなく、明示的な検証エラーで実行を失敗させます。

Cron ジョブはペイロードレベルの `fallbacks` も持てます。存在する場合、そのリストがジョブの設定済みフォールバックチェーンを置き換えます。選択したモデルだけを試す厳密な cron 実行にしたい場合は、ジョブペイロード/API で `fallbacks: []` を使用します。ジョブに `--model` があり、ペイロードにも設定にもフォールバックがない場合、OpenClaw は明示的な空のフォールバックオーバーライドを渡し、エージェントのプライマリが隠れた追加リトライ対象として追加されないようにします。

ローカルプロバイダーのプリフライトチェックは、cron 実行を `skipped` としてマークする前に設定済みフォールバックをたどります。`fallbacks: []` はそのプリフライト経路を厳密に保ちます。

分離ジョブのモデル選択優先順位は次のとおりです。

1. Gmail フックのモデルオーバーライド（実行が Gmail から来ており、そのオーバーライドが許可されている場合）
2. ジョブごとのペイロード `model`
3. ユーザーが選択して保存した cron セッションモデルオーバーライド
4. エージェント/デフォルトモデル選択

高速モードも解決済みのライブ選択に従います。選択されたモデル設定に `params.fastMode` がある場合、分離 cron はデフォルトでそれを使用します。保存済みセッションの `fastMode` オーバーライドは、どちらの方向でも設定より優先されます。自動モードは、存在する場合は選択されたモデルの `params.fastAutoOnSeconds` カットオフを使用し、デフォルトは 60 秒です。

分離実行がライブのモデル切り替えハンドオフに到達した場合、cron は切り替え後のプロバイダー/モデルでリトライし、リトライ前にそのライブ選択をアクティブな実行へ永続化します。切り替えが新しい認証プロファイルも持つ場合、cron はその認証プロファイルオーバーライドもアクティブな実行へ永続化します。リトライには上限があります。初回試行に加えて 2 回の切り替えリトライ後、cron は無限ループせずに中止します。

分離 cron 実行がエージェントランナーに入る前に、OpenClaw は `baseUrl` がループバック、プライベートネットワーク、または `.local` である、設定済みの `api: "ollama"` および `api: "openai-completions"` プロバイダーについて、到達可能なローカルプロバイダーエンドポイントをチェックします。そのエンドポイントが停止している場合、モデル呼び出しを開始する代わりに、実行は明確なプロバイダー/モデルエラー付きで `skipped` として記録されます。エンドポイント結果は 5 分間キャッシュされるため、同じ停止中のローカル Ollama、vLLM、SGLang、または LM Studio サーバーを使用する多数の期限到来ジョブは、リクエストストームを発生させる代わりに 1 回の小さなプローブを共有します。プロバイダープリフライトでスキップされた実行は、実行エラーのバックオフを増やしません。繰り返しのスキップ通知が必要な場合は `failureAlert.includeSkipped` を有効にします。

## 配信と出力

| モード       | 何が起こるか                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | エージェントが送信しなかった場合、最終テキストをターゲットへフォールバック配信します |
| `webhook`  | 完了イベントペイロードを URL に POST します                                |
| `none`     | ランナーのフォールバック配信はありません                                         |

チャンネル配信には `--announce --channel telegram --to "-1001234567890"` を使用します。Telegram フォーラムトピックには `-1001234567890:topic:123` を使用します。OpenClaw は Telegram 所有の短縮形 `-1001234567890:123` も受け付けます。直接 RPC/config 呼び出し元は `delivery.threadId` を文字列または数値として渡せます。Slack/Discord/Mattermost のターゲットは明示的なプレフィックス（`channel:<id>`、`user:<id>`）を使用する必要があります。Matrix ルーム ID は大文字と小文字を区別します。正確なルーム ID または Matrix の `room:!room:server` 形式を使用してください。

announce 配信で `channel: "last"` を使用するか `channel` を省略した場合、`telegram:123` のようなプロバイダープレフィックス付きターゲットは、cron がセッション履歴または単一の設定済みチャンネルへフォールバックする前にチャンネルを選択できます。読み込まれた Plugin が通知するプレフィックスだけがプロバイダーセレクターです。`delivery.channel` が明示されている場合、ターゲットプレフィックスは同じプロバイダー名でなければなりません。たとえば、`channel: "whatsapp"` と `to: "telegram:123"` の組み合わせは、WhatsApp に Telegram ID を電話番号として解釈させるのではなく拒否されます。`channel:<id>`、`user:<id>`、`imessage:<handle>`、`sms:<number>` などのターゲット種別およびサービスプレフィックスは、プロバイダーセレクターではなく、チャンネル所有のターゲット構文のままです。

分離ジョブでは、チャット配信は共有されます。チャット経路が利用可能な場合、ジョブが `--no-deliver` を使用していても、エージェントは `message` ツールを使用できます。エージェントが設定済み/現在のターゲットへ送信した場合、OpenClaw はフォールバック announce をスキップします。それ以外の場合、`announce`、`webhook`、`none` は、エージェントターン後にランナーが最終返信をどう扱うかだけを制御します。

エージェントがアクティブなチャットから分離リマインダーを作成すると、OpenClaw はフォールバック announce 経路用に保持されたライブ配信ターゲットを保存します。内部セッションキーは小文字の場合があります。現在のチャットコンテキストが利用可能な場合、それらのキーからプロバイダー配信ターゲットは再構築されません。

暗黙の announce 配信は、設定済みチャンネル allowlist を使用して古いターゲットを検証し、再ルーティングします。DM ペアリングストアの承認はフォールバック自動化の受信者ではありません。スケジュール済みジョブが DM に能動的に送信する必要がある場合は、`delivery.to` を設定するか、チャンネルの `allowFrom` エントリを設定します。

## 出力言語

Cron ジョブは、チャンネル、ロケール、または以前のメッセージから返信言語を推測しません。スケジュール済みメッセージまたはテンプレートに言語ルールを入れてください。

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

テンプレートファイルでは、レンダリングされたプロンプトに言語指示を保持し、ジョブ実行前に `{{language}}` などのプレースホルダーが埋められていることを確認してください。出力に複数の言語が混在する場合は、ルールを明示します。例: 「説明文には中国語を使い、技術用語は英語のままにしてください。」

失敗通知は別の宛先経路に従います。

- `cron.failureDestination` は失敗通知のグローバルデフォルトを設定します。
- `job.delivery.failureDestination` はジョブごとにそれをオーバーライドします。
- どちらも設定されておらず、ジョブがすでに `announce` で配信している場合、失敗通知はそのプライマリ announce ターゲットへフォールバックするようになりました。
- `delivery.failureDestination` は、プライマリ配信モードが `webhook` でない限り、`sessionTarget="isolated"` ジョブでのみサポートされます。
- `failureAlert.includeSkipped: true` は、ジョブまたはグローバル cron アラートポリシーで、繰り返しのスキップ実行アラートを有効にします。スキップ実行は別の連続スキップカウンターを保持するため、実行エラーのバックオフには影響しません。

## CLI 例

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
  <Tab title="繰り返し分離ジョブ">
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
  <Tab title="モデルと思考のオーバーライド">
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
  <Tab title="Webhook 出力">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "Summarize today's deploys as JSON." \
      --name "Deploy digest" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="コマンド出力">
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
    メインセッションのシステムイベントをキューに入れます。

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      イベント説明。
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
    カスタムフック名は config の `hooks.mappings` によって解決されます。マッピングは、任意のペイロードをテンプレートまたはコード変換で `wake` または `agent` アクションへ変換できます。
  </Accordion>
</AccordionGroup>

<Warning>
フックエンドポイントは、ループバック、tailnet、または信頼済みリバースプロキシの背後に配置してください。

- 専用のフックトークンを使用し、Gateway 認証トークンを再利用しないでください。
- `hooks.path` は専用のサブパスに保ちます。`/` は拒否されます。
- `hooks.allowedAgentIds` を設定して、`agentId` が省略された場合のデフォルトエージェントを含め、フックが対象にできる有効なエージェントを制限します。
- 呼び出し元が選択するセッションが必要でない限り、`hooks.allowRequestSessionKey=false` のままにします。
- `hooks.allowRequestSessionKey` を有効にする場合は、許可されるセッションキー形状を制約するために `hooks.allowedSessionKeyPrefixes` も設定します。
- フックペイロードはデフォルトで安全境界に包まれます。

</Warning>

## Gmail PubSub 統合

Google PubSub 経由で Gmail 受信トリガーを OpenClaw に接続します。

<Note>
**前提条件:** `gcloud` CLI、`gog` (gogcli)、OpenClaw hooks の有効化、公開 HTTPS エンドポイント用の Tailscale。
</Note>

### ウィザードセットアップ（推奨）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

これは `hooks.gmail` 設定を書き込み、Gmail プリセットを有効化し、push エンドポイントに Tailscale Funnel を使用します。

### Gateway の自動起動

`hooks.enabled=true` かつ `hooks.gmail.account` が設定されている場合、Gateway は起動時に `gog gmail watch serve` を開始し、watch を自動更新します。オプトアウトするには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定します。

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

# Get one stored job as JSON
openclaw cron get <jobId>

# Show one job, including resolved delivery route
openclaw cron show <jobId>

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

`openclaw cron run <jobId>` は、手動実行をキューに入れた後に戻ります。キューに入った実行が完了するまでブロックする必要があるシャットダウン hook、メンテナンススクリプト、その他の自動化には `--wait` を使用します。wait モードは、返された正確な `runId` をポーリングします。ステータス `ok` では `0` で終了し、`error`、`skipped`、または wait タイムアウトでは非ゼロで終了します。

エージェントの `cron` ツールは、`cron(action: "list")` からコンパクトなジョブ要約（`id`、`name`、`enabled`、`nextRunAtMs`、`scheduleKind`、`lastRunStatus`）を返します。完全なジョブ定義を 1 件取得するには `cron(action: "get", jobId: "...")` を使用します。Gateway の直接呼び出し元は `cron.list` に `compact: true` を渡せます。省略すると、配信プレビューを含む既存の完全なレスポンスが保持されます。

`openclaw cron create` は `openclaw cron add` のエイリアスであり、新しいジョブでは位置指定のスケジュール（`"0 9 * * 1"`、`"every 1h"`、`"20m"`、または ISO タイムスタンプ）に続けて、位置指定のエージェントプロンプトを使用できます。完了した実行ペイロードを HTTP エンドポイントに POST するには、`cron add|create` または `cron edit` で `--webhook <url>` を使用します。Webhook 配信は、`--announce`、`--channel`、`--to`、`--thread-id`、`--account` などのチャット配信フラグと組み合わせることはできません。`cron edit` では、`--clear-channel`、`--clear-to`、`--clear-thread-id`、`--clear-account` がそれらのルーティングフィールドを個別に解除します（各フラグは対応する設定フラグと同時に指定すると拒否されます）。これは、`--no-deliver` が runner フォールバック配信を無効化することとは異なります。

<Note>
モデル上書きの注記:

- `openclaw cron add|edit --model ...` はジョブの選択モデルを変更します。
- モデルが許可されている場合、その正確な provider/model が isolated agent run に到達します。
- 許可されていない、または解決できない場合、Cron は明示的な検証エラーで実行を失敗させます。
- API の `cron.update` ペイロードパッチでは、保存されたジョブモデル上書きをクリアするために `model: null` を設定できます。
- `openclaw cron edit <job-id> --clear-model` は CLI からその上書きをクリアし（`model: null` パッチと同じ効果）、`--model` と組み合わせることはできません。
- Cron の `--model` はジョブの primary であり、セッションの `/model` 上書きではないため、設定済みの fallback チェーンは引き続き適用されます。
- `openclaw cron add|edit --fallbacks ...` はペイロードの `fallbacks` を設定し、そのジョブの設定済み fallback を置き換えます。`--fallbacks ""` は fallback を無効化し、実行を strict にします。`openclaw cron edit <job-id> --clear-fallbacks` はジョブ単位の上書きをクリアします。
- 明示的または設定済みの fallback リストがないプレーンな `--model` は、サイレントな追加再試行先としてエージェント primary にフォールスルーしません。

</Note>

## 設定

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
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

`maxConcurrentRuns` は、スケジュール済み Cron ディスパッチと isolated agent-turn execution の両方を制限し、デフォルトは 8 です。isolated cron agent turns は内部的にキュー専用の `cron-nested` 実行レーンを使用するため、この値を上げると、外側の Cron ラッパーだけを開始するのではなく、独立した Cron LLM 実行を並列に進められます。共有の非 Cron `nested` レーンは、この設定によって拡張されません。

`cron.store` は論理ストアキーであり、レガシー doctor インポートパスです。既存の JSON ストアを SQLite にインポートしてアーカイブするには、`openclaw doctor --fix` を実行します。今後の Cron 変更は CLI または Gateway API 経由で行う必要があります。

Cron を無効化: `cron.enabled: false` または `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="再試行の動作">
    **一回限りの再試行**: 一時的なエラー（rate limit、overload、network、server error）は、指数バックオフで最大 3 回再試行します。永続的なエラーは即座に無効化されます。

    **繰り返し再試行**: 再試行間で指数バックオフ（30s から 60m）を使用します。バックオフは次の成功した実行後にリセットされます。

  </Accordion>
  <Accordion title="メンテナンス">
    `cron.sessionRetention`（デフォルト `24h`）は isolated run-session エントリを削除します。`cron.runLog.keepLines` は、ジョブごとに保持する SQLite 実行履歴行を制限します。`maxBytes` は、古いファイルベースの実行ログとの設定互換性のために保持されています。
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
    - `cron` スケジュールでは、タイムゾーン（`--tz`）とホストのタイムゾーンを確認します。
    - 実行出力の `reason: not-due` は、手動実行が `openclaw cron run <jobId> --due` でチェックされ、ジョブがまだ期限に達していなかったことを意味します。

  </Accordion>
  <Accordion title="Cron は起動したが配信されない">
    - 配信モード `none` は、runner fallback send が想定されていないことを意味します。チャットルートが利用可能な場合、エージェントは引き続き `message` ツールで直接送信できます。
    - 配信ターゲットが欠落または無効（`channel`/`to`）な場合、送信はスキップされます。
    - Matrix では、コピーされたジョブやレガシージョブで小文字化された `delivery.to` ルーム ID があると、Matrix のルーム ID は大文字と小文字を区別するため失敗することがあります。Matrix から取得した正確な `!room:server` または `room:!room:server` 値にジョブを編集します。
    - チャンネル認証エラー（`unauthorized`、`Forbidden`）は、認証情報によって配信がブロックされたことを意味します。
    - isolated run がサイレントトークン（`NO_REPLY` / `no_reply`）のみを返す場合、OpenClaw は直接の送信配信を抑制し、fallback のキュー済み要約パスも抑制するため、チャットには何も投稿されません。
    - エージェント自身がユーザーにメッセージを送る必要がある場合は、ジョブに利用可能なルート（以前のチャットがある `channel: "last"`、または明示的な channel/target）があることを確認します。

  </Accordion>
  <Accordion title="Cron または Heartbeat が /new-style ロールオーバーを妨げているように見える">
    - 日次リセットとアイドルリセットの freshness は `updatedAt` に基づきません。[セッション管理](/ja-JP/concepts/session#session-lifecycle) を参照してください。
    - Cron wakeup、heartbeat 実行、exec 通知、Gateway bookkeeping は routing/status のためにセッション行を更新する場合がありますが、`sessionStartedAt` または `lastInteractionAt` は延長しません。
    - これらのフィールドが存在する前に作成されたレガシー行では、ファイルがまだ利用可能な場合、OpenClaw は transcript JSONL セッションヘッダーから `sessionStartedAt` を復元できます。`lastInteractionAt` のないレガシー idle 行は、その復元された開始時刻を idle baseline として使用します。

  </Accordion>
  <Accordion title="タイムゾーンの注意点">
    - `--tz` なしの Cron は Gateway ホストのタイムゾーンを使用します。
    - タイムゾーンなしの `at` スケジュールは UTC として扱われます。
    - Heartbeat `activeHours` は設定済みのタイムゾーン解決を使用します。

  </Accordion>
</AccordionGroup>

## 関連

- [自動化](/ja-JP/automation) — すべての自動化メカニズムの概要
- [バックグラウンドタスク](/ja-JP/automation/tasks) — Cron 実行のタスク台帳
- [Heartbeat](/ja-JP/gateway/heartbeat) — 定期的な main-session turns
- [タイムゾーン](/ja-JP/concepts/timezone) — タイムゾーン設定

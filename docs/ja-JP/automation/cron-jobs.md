---
read_when:
    - バックグラウンドジョブまたはウェイクアップのスケジュール設定
    - 外部トリガー（webhook、Gmail）を OpenClaw に接続する
    - スケジュールされたタスクで Heartbeat と Cron のどちらを選ぶか
sidebarTitle: Scheduled tasks
summary: Gateway スケジューラ向けのスケジュール済みジョブ、webhook、Gmail PubSub トリガー
title: スケジュールされたタスク
x-i18n:
    generated_at: "2026-07-01T02:57:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f75b8d1e5ac558a02b895e1cd1b92b05af549a2bd63d4ce3ddafcaf9e94b88e
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron は Gateway の組み込みスケジューラです。ジョブを永続化し、適切な時刻にエージェントを起動し、出力をチャットチャネルまたは Webhook エンドポイントに返すことができます。

## クイックスタート

<Steps>
  <Step title="単発リマインダーを追加する">
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
  <Step title="実行履歴を確認する">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## cron の仕組み

- Cron は **Gateway 内部**のプロセスで実行されます（モデル内ではありません）。
- ジョブ定義、ランタイム状態、実行履歴は OpenClaw の共有 SQLite 状態データベースに永続化されるため、再起動してもスケジュールは失われません。
- アップグレード時は、`openclaw doctor --fix` を実行して、従来の `~/.openclaw/cron/jobs.json`、`jobs-state.json`、`runs/*.jsonl` ファイルを SQLite にインポートし、`.migrated` サフィックス付きにリネームします。不正な形式のジョブ行はランタイムからスキップされ、後で修復またはレビューできるよう `jobs-quarantine.json` にコピーされます。
- `cron.store` は引き続き論理 cron ストアキーと doctor インポートパスの名前です。インポート後は、その JSON ファイルを編集してもアクティブな cron ジョブは変更されません。代わりに `openclaw cron add|edit|remove` または Gateway cron RPC メソッドを使用してください。
- すべての cron 実行は [バックグラウンドタスク](/ja-JP/automation/tasks) レコードを作成します。
- Gateway 起動時、期限超過の分離エージェントターンジョブは即時に再生されるのではなく、チャネル接続ウィンドウの外に再スケジュールされるため、再起動後も Discord/Telegram の起動とネイティブコマンド設定の応答性が保たれます。
- 単発ジョブ（`--at`）は、デフォルトで成功後に自動削除されます。
- 分離 cron 実行は、実行完了時に `cron:<jobId>` セッションで追跡されているブラウザタブ/プロセスをベストエフォートで閉じるため、切り離されたブラウザ自動化が孤立プロセスを残しません。
- 狭い cron 自己クリーンアップ権限を受け取った分離 cron 実行は、スケジューラ状態、自分の現在ジョブに自己フィルタされたリスト、そのジョブの実行履歴を引き続き読み取れるため、状態/Heartbeat チェックはより広い cron 変更権限を得ずに自分のスケジュールを検査できます。
- 分離 cron 実行は、古い確認応答にも対処します。最初の結果が単なる暫定的な状態更新（`on it`、`pulling everything together`、および同様のヒント）で、子孫サブエージェント実行が最終回答に対してまだ責任を持っていない場合、OpenClaw は配信前に実際の結果を一度だけ再プロンプトします。
- 分離 cron 実行は、埋め込み実行からの構造化された実行拒否メタデータを使用します。これには、ネストされたエラーメッセージが `SYSTEM_RUN_DENIED` または `INVALID_REQUEST` で始まる node-host `UNAVAILABLE` ラッパーが含まれるため、ブロックされたコマンドが成功実行として報告されず、通常のアシスタント文章が拒否として扱われることもありません。
- 分離 cron 実行は、返信ペイロードが生成されない場合でも、実行レベルのエージェント失敗をジョブエラーとして扱います。そのため、モデル/プロバイダーの失敗は、ジョブを成功としてクリアするのではなく、エラーカウンターを増やして失敗通知をトリガーします。
- 分離エージェントターンジョブが `timeoutSeconds` に達すると、cron は基礎となるエージェント実行を中止し、短いクリーンアップウィンドウを与えます。実行が排出されない場合、Gateway 所有のクリーンアップは cron がタイムアウトを記録する前にその実行のセッション所有権を強制的にクリアするため、キューに入ったチャット作業が古い処理セッションの背後に残りません。
- 分離エージェントターンがランナー開始前、または最初のモデル呼び出し前に停止した場合、cron は `setup timed out before runner start` や `stalled before first model call (last phase: context-engine)` のようなフェーズ固有のタイムアウトを記録します。これらのウォッチドッグは、外部 CLI プロセスが実際に開始される前の埋め込みプロバイダーと CLI バックエンドのプロバイダーをカバーし、長い `timeoutSeconds` 値とは独立して上限が設定されるため、コールドスタート/認証/コンテキストの失敗がジョブ予算全体を待たずにすばやく表面化します。
- system cron または別の外部スケジューラを使って `openclaw agent` を実行する場合、CLI が `SIGTERM`/`SIGINT` を処理する場合でも、ハードキルのエスカレーションでラップしてください。Gateway バックエンドの実行は、受け付けられた実行を中止するよう Gateway に要求します。ローカルおよび埋め込みフォールバック実行も同じ中止シグナルを受け取ります。GNU `timeout` では、単なる `timeout 600 ...` よりも `timeout -k 60 600 openclaw agent ...` を推奨します。`-k` 値は、プロセスを排出できない場合のスーパーバイザのバックストップです。systemd ユニットでは、`SIGTERM` 停止シグナルと、最終的な kill の前に `TimeoutStopSec` などの猶予ウィンドウを使って同じ形を維持してください。元の Gateway 実行がまだアクティブな間にリトライが `--run-id` を再利用すると、重複は 2 つ目の実行を開始する代わりに実行中として報告されます。

<a id="maintenance"></a>

<Note>
cron のタスク調整は、まずランタイム所有、次に永続履歴バックアップです。古い子セッション行がまだ存在していても、cron ランタイムがそのジョブを実行中として追跡している間、アクティブな cron タスクはライブのままです。ランタイムがジョブの所有を停止し、5 分の猶予ウィンドウが期限切れになると、メンテナンスは永続化された実行ログとジョブ状態から一致する `cron:<jobId>:<startedAt>` 実行を確認します。その永続履歴が終端結果を示す場合、タスク台帳はそこから確定されます。それ以外の場合、Gateway 所有のメンテナンスがタスクを `lost` とマークできます。オフライン CLI 監査は永続履歴から復旧できますが、自身の空のインプロセスアクティブジョブセットを Gateway 所有の cron 実行が消えた証拠として扱いません。
</Note>

## スケジュールタイプ

| 種類    | CLI フラグ  | 説明                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | 単発タイムスタンプ（ISO 8601 または `20m` のような相対指定）    |
| `every` | `--every` | 固定間隔                                          |
| `cron`  | `--cron`  | 任意の `--tz` を伴う 5 フィールドまたは 6 フィールドの cron 式 |

タイムゾーンのないタイムスタンプは UTC として扱われます。ローカルの壁時計時刻でスケジュールするには、`--tz America/New_York` を追加してください。

毎時ちょうどの繰り返し式は、負荷スパイクを減らすため最大 5 分まで自動的に分散されます。正確なタイミングを強制するには `--exact` を、明示的なウィンドウには `--stagger 30s` を使用してください。

### 月の日付と曜日は OR ロジックを使用します

Cron 式は [croner](https://github.com/Hexagon/croner) によって解析されます。月の日付フィールドと曜日フィールドの両方がワイルドカードでない場合、croner は **どちらか** のフィールドが一致したときに一致とします。両方ではありません。これは標準的な Vixie cron の動作です。

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

これは月に 0〜1 回ではなく、約 5〜6 回発火します。OpenClaw はここで Croner のデフォルト OR 動作を使用します。両方の条件を必須にするには、Croner の `+` 曜日修飾子（`0 9 15 * +1`）を使用するか、片方のフィールドでスケジュールして、もう片方をジョブのプロンプトまたはコマンド内でガードしてください。

## 実行スタイル

| スタイル           | `--session` 値   | 実行場所                  | 最適な用途                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| メインセッション    | `main`              | 専用 cron 起動レーン | リマインダー、システムイベント        |
| 分離        | `isolated`          | 専用 `cron:<jobId>` | レポート、バックグラウンド雑務      |
| 現在のセッション | `current`           | 作成時にバインド   | コンテキストを意識した繰り返し作業    |
| カスタムセッション  | `session:custom-id` | 永続的な名前付きセッション | 履歴をもとに構築するワークフロー |

<AccordionGroup>
  <Accordion title="メインセッション、分離、カスタムの違い">
    **メインセッション**ジョブは、cron 所有の実行レーンにシステムイベントをキュー投入し、任意で Heartbeat を起動します（`--wake now` または `--wake next-heartbeat`）。返信には対象メインセッションの最後の配信コンテキストを使用できますが、通常の cron ターンを人間のチャットレーンに追加せず、対象セッションの日次/アイドルリセットの鮮度を延長しません。**分離**ジョブは、新しいセッションで専用エージェントターンを実行します。**カスタムセッション**（`session:xxx`）は実行間でコンテキストを永続化し、前回の要約をもとに構築する日次スタンドアップのようなワークフローを可能にします。

    メインセッションの cron イベントは、自己完結したシステムイベントリマインダーです。デフォルト Heartbeat プロンプトの「Read
    HEARTBEAT.md」指示は自動的には含まれません。繰り返しリマインダーで
    `HEARTBEAT.md` を参照する必要がある場合は、cron イベントテキストまたは
    エージェント自身の指示内で明示してください。

  </Accordion>
  <Accordion title="分離ジョブにおける「新しいセッション」の意味">
    分離ジョブでは、「新しいセッション」とは各実行に対する新しいトランスクリプト/セッション ID を意味します。OpenClaw は思考/高速/詳細設定、ラベル、明示的にユーザー選択されたモデル/認証オーバーライドなどの安全な設定を引き継ぐ場合がありますが、古い cron 行から周囲の会話コンテキストを継承しません。つまり、チャネル/グループルーティング、送信またはキューポリシー、権限昇格、起点、ACP ランタイムバインディングは継承されません。繰り返しジョブが同じ会話コンテキストを意図的にもとにする必要がある場合は、`current` または `session:<id>` を使用してください。
  </Accordion>
  <Accordion title="ランタイムクリーンアップ">
    分離ジョブでは、ランタイムの破棄に、その cron セッションのブラウザをベストエフォートでクリーンアップする処理が含まれるようになりました。クリーンアップ失敗は無視されるため、実際の cron 結果が引き続き優先されます。

    分離 cron 実行は、共有ランタイムクリーンアップパスを通じて、ジョブ用に作成されたバンドル MCP ランタイムインスタンスも破棄します。これはメインセッションおよびカスタムセッションの MCP クライアントが破棄される方法と一致しているため、分離 cron ジョブは stdio 子プロセスや長寿命 MCP 接続を実行間でリークしません。

  </Accordion>
  <Accordion title="サブエージェントと Discord 配信">
    分離 cron 実行がサブエージェントを編成する場合、配信は古い親の暫定テキストよりも、最終的な子孫出力を優先します。子孫がまだ実行中の場合、OpenClaw はその部分的な親更新を通知する代わりに抑制します。

    テキストのみの Discord 通知先では、OpenClaw はストリーミング/中間テキストペイロードと最終回答の両方を再生するのではなく、正規の最終アシスタントテキストを一度だけ送信します。メディアと構造化された Discord ペイロードは、添付ファイルとコンポーネントが失われないよう、引き続き別々のペイロードとして配信されます。

  </Accordion>
</AccordionGroup>

### コマンドペイロード

モデルバックエンドの分離エージェントターンを開始せずに Gateway スケジューラ内で実行する必要がある決定的なスクリプトには、コマンドペイロードを使用してください。コマンドジョブは Gateway ホストで実行され、stdout/stderr をキャプチャし、cron 履歴に実行を記録し、分離ジョブと同じ `announce`、`webhook`、`none` 配信モードを再利用します。

<Note>
コマンド cron は、エージェントの `tools.exec` 呼び出しではなく、オペレーター管理者向けの Gateway 自動化サーフェスです。cron ジョブの作成、更新、削除、または手動実行には `operator.admin` が必要です。スケジュールされたコマンド実行は、その後 Gateway プロセス内で、その管理者が作成した自動化として実行されます。`tools.exec.mode`、承認プロンプト、エージェントごとのツール許可リストなどのエージェント exec ポリシーは、モデルに見える exec ツールを管理するものであり、コマンド cron ペイロードを管理するものではありません。
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

`--command <shell>` は `argv: ["sh", "-lc", <shell>]` を保存します。シェル解析なしで正確な argv 実行をしたい場合は、`--command-argv '["node","scripts/report.mjs"]'` を使用してください。任意の `--command-env KEY=VALUE`、`--command-input`、`--timeout-seconds`、`--no-output-timeout-seconds`、`--output-max-bytes` フィールドは、プロセス環境、stdin、および出力上限を制御します。

stdout が空でない場合、そのテキストが配信結果になります。stdout が空で stderr が空でない場合、stderr が配信されます。両方のストリームが存在する場合、cron は小さな `stdout:` / `stderr:` ブロックを配信します。終了コード 0 は実行を `ok` として記録します。0 以外の終了、シグナル、タイムアウト、または無出力タイムアウトは `error` を記録し、失敗アラートをトリガーできます。`NO_REPLY` だけを出力するコマンドは、通常の cron サイレントトークン抑制を使用し、チャットへは何も投稿しません。

### 分離ジョブのペイロードオプション

<ParamField path="--message" type="string" required>
  プロンプトテキスト（分離では必須）。
</ParamField>
<ParamField path="--model" type="string">
  モデルの上書き。ジョブに選択された許可済みモデルを使用します。
</ParamField>
<ParamField path="--fallbacks" type="string">
  ジョブ単位のフォールバックモデルリスト。例: `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`。フォールバックなしの厳密な実行には `--fallbacks ""` を渡します。
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  `cron edit` で、ジョブ単位のフォールバック上書きを削除し、ジョブが設定済みのフォールバック優先順位に従うようにします。`--fallbacks` と組み合わせることはできません。
</ParamField>
<ParamField path="--clear-model" type="boolean">
  `cron edit` で、ジョブ単位のモデル上書きを削除し、ジョブが通常の cron モデル選択優先順位（設定されていれば保存済み cron セッション上書き、それ以外はエージェント/デフォルトモデル）に従うようにします。`--model` と組み合わせることはできません。
</ParamField>
<ParamField path="--thinking" type="string">
  思考レベルの上書き。
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  `cron edit` で、ジョブ単位の思考上書きを削除し、ジョブが通常の cron 思考優先順位に従うようにします。`--thinking` と組み合わせることはできません。
</ParamField>
<ParamField path="--light-context" type="boolean">
  ワークスペースのブートストラップファイル注入をスキップします。
</ParamField>
<ParamField path="--tools" type="string">
  ジョブが使用できるツールを制限します。例: `--tools exec,read`。
</ParamField>

`--model` は、そのジョブのプライマリモデルとして選択された許可済みモデルを使用します。これはチャットセッションの `/model` 上書きとは同じではありません。ジョブのプライマリが失敗した場合でも、設定済みのフォールバックチェーンは引き続き適用されます。要求されたモデルが許可されていない、または解決できない場合、cron はジョブのエージェント/デフォルトモデル選択へ暗黙にフォールバックするのではなく、明示的な検証エラーで実行を失敗させます。

Cron ジョブは、ペイロードレベルの `fallbacks` も保持できます。存在する場合、そのリストはジョブの設定済みフォールバックチェーンを置き換えます。選択したモデルだけを試す厳密な cron 実行にしたい場合は、ジョブペイロード/API で `fallbacks: []` を使用します。ジョブに `--model` があり、ペイロードにも設定済みフォールバックにもフォールバックがない場合、OpenClaw は明示的な空のフォールバック上書きを渡し、エージェントのプライマリが隠れた追加の再試行先として追加されないようにします。

ローカルプロバイダーのプリフライトチェックは、cron 実行を `skipped` としてマークする前に設定済みフォールバックをたどります。`fallbacks: []` は、そのプリフライト経路を厳密なままにします。

分離ジョブのモデル選択優先順位は次のとおりです。

1. Gmail フックのモデル上書き（実行が Gmail 由来で、その上書きが許可されている場合）
2. ジョブ単位のペイロード `model`
3. ユーザーが選択した保存済み cron セッションモデル上書き
4. エージェント/デフォルトモデル選択

高速モードも、解決されたライブ選択に従います。選択されたモデル設定に `params.fastMode` がある場合、分離 cron はそれをデフォルトで使用します。保存済みセッションの `fastMode` 上書きは、どちらの方向でも設定より優先されます。自動モードは、存在する場合は選択されたモデルの `params.fastAutoOnSeconds` カットオフを使用し、デフォルトは 60 秒です。

分離実行でライブモデル切り替えの引き継ぎが発生した場合、cron は切り替え後のプロバイダー/モデルで再試行し、再試行前にそのライブ選択をアクティブな実行へ永続化します。切り替えが新しい認証プロファイルも伴う場合、cron はその認証プロファイル上書きもアクティブな実行へ永続化します。再試行には上限があります。初回試行に加えて 2 回の切り替え再試行の後、cron は無限ループせずに中止します。

分離 cron 実行がエージェントランナーに入る前に、OpenClaw は設定済みの `api: "ollama"` および `api: "openai-completions"` プロバイダーのうち、`baseUrl` が loopback、プライベートネットワーク、または `.local` である到達可能なローカルプロバイダーエンドポイントを確認します。そのエンドポイントが停止している場合、モデル呼び出しを開始するのではなく、実行は明確なプロバイダー/モデルエラー付きで `skipped` として記録されます。エンドポイント結果は 5 分間キャッシュされるため、同じ停止中のローカル Ollama、vLLM、SGLang、または LM Studio サーバーを使用する多数の期限到来ジョブは、リクエストの嵐を作る代わりに 1 回の小さなプローブを共有します。プロバイダープリフライトでスキップされた実行は、実行エラーのバックオフを増やしません。スキップ通知を繰り返し受け取りたい場合は、`failureAlert.includeSkipped` を有効にしてください。

## 配信と出力

| モード       | 何が起こるか                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | エージェントが送信しなかった場合、最終テキストをターゲットへフォールバック配信します |
| `webhook`  | 完了イベントペイロードを URL へ POST します                                |
| `none`     | ランナーのフォールバック配信はありません                                         |

チャンネル配信には `--announce --channel telegram --to "-1001234567890"` を使用します。Telegram フォーラムトピックには `-1001234567890:topic:123` を使用します。OpenClaw は Telegram 所有の `-1001234567890:123` 省略形も受け付けます。直接 RPC/設定呼び出し元は、`delivery.threadId` を文字列または数値として渡せます。Slack/Discord/Mattermost ターゲットでは明示的なプレフィックス（`channel:<id>`、`user:<id>`）を使用してください。Matrix ルーム ID は大文字と小文字を区別します。正確なルーム ID または Matrix の `room:!room:server` 形式を使用してください。

announce 配信で `channel: "last"` を使用する、または `channel` を省略する場合、`telegram:123` のようなプロバイダープレフィックス付きターゲットは、cron がセッション履歴または単一の設定済みチャンネルへフォールバックする前にチャンネルを選択できます。読み込まれた Plugin が広告するプレフィックスだけがプロバイダーセレクターです。`delivery.channel` が明示されている場合、ターゲットプレフィックスは同じプロバイダー名でなければなりません。たとえば、`channel: "whatsapp"` と `to: "telegram:123"` の組み合わせは、WhatsApp が Telegram ID を電話番号として解釈するのを許す代わりに拒否されます。`channel:<id>`、`user:<id>`、`imessage:<handle>`、`sms:<number>` などのターゲット種別およびサービスプレフィックスは、プロバイダーセレクターではなく、チャンネル所有のターゲット構文のままです。

分離ジョブでは、チャット配信は共有されます。チャット経路が利用可能な場合、ジョブが `--no-deliver` を使用していても、エージェントは `message` ツールを使用できます。エージェントが設定済み/現在のターゲットへ送信した場合、OpenClaw はフォールバック announce をスキップします。それ以外の場合、`announce`、`webhook`、`none` は、エージェントターン後の最終返信をランナーがどう扱うかだけを制御します。

エージェントがアクティブなチャットから分離リマインダーを作成すると、OpenClaw はフォールバック announce 経路のために保持されたライブ配信ターゲットを保存します。内部セッションキーは小文字の場合があります。現在のチャットコンテキストが利用可能な場合、プロバイダー配信ターゲットはそれらのキーから再構築されません。

暗黙の announce 配信は、設定済みのチャンネル許可リストを使用して古いターゲットを検証し、再ルーティングします。DM ペアリングストア承認はフォールバック自動化の受信者ではありません。スケジュール済みジョブが DM へ能動的に送信すべき場合は、`delivery.to` を設定するか、チャンネルの `allowFrom` エントリを設定してください。

## 出力言語

Cron ジョブは、チャンネル、ロケール、または以前の
メッセージから返信言語を推測しません。スケジュール済みメッセージまたはテンプレートに言語ルールを入れてください。

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

テンプレートファイルでは、レンダリングされたプロンプト内に言語指示を保持し、
ジョブ実行前に `{{language}}` などのプレースホルダーが埋められていることを確認してください。出力に複数の言語が混在する場合は、ルールを明示してください。例: 「説明文には中国語を使用し、技術用語は英語のままにする。」

失敗通知は、別の宛先経路に従います。

- `cron.failureDestination` は失敗通知のグローバルデフォルトを設定します。
- `job.delivery.failureDestination` はジョブ単位でそれを上書きします。
- どちらも設定されておらず、ジョブがすでに `announce` で配信している場合、失敗通知はそのプライマリ announce ターゲットへフォールバックするようになりました。
- `delivery.failureDestination` は、プライマリ配信モードが `webhook` でない限り、`sessionTarget="isolated"` ジョブでのみサポートされます。
- `failureAlert.includeSkipped: true` は、ジョブまたはグローバル cron アラートポリシーで、スキップ実行アラートの繰り返しを有効にします。スキップ実行は別の連続スキップカウンターを保持するため、実行エラーのバックオフには影響しません。

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
  <Tab title="定期的な分離ジョブ">
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
  <Accordion title="マップ済みフック（POST /hooks/<name>）">
    カスタムフック名は、設定内の `hooks.mappings` で解決されます。マッピングは、テンプレートまたはコード変換を使って任意のペイロードを `wake` または `agent` アクションへ変換できます。
  </Accordion>
</AccordionGroup>

<Warning>
フックエンドポイントは loopback、tailnet、または信頼済みリバースプロキシの背後に置いてください。

- 専用のフックトークンを使用し、gateway 認証トークンを再利用しないでください。
- `hooks.path` は専用のサブパスに保ちます。`/` は拒否されます。
- `hooks.allowedAgentIds` を設定して、フックが対象にできる有効なエージェントを制限します。`agentId` が省略された場合のデフォルトエージェントも含みます。
- 呼び出し元が選択するセッションが必要でない限り、`hooks.allowRequestSessionKey=false` のままにします。
- `hooks.allowRequestSessionKey` を有効にする場合は、`hooks.allowedSessionKeyPrefixes` も設定して、許可されるセッションキーの形を制約します。
- フックペイロードはデフォルトで安全境界に包まれます。

</Warning>

## Gmail PubSub インテグレーション

Google PubSub 経由で Gmail 受信トリガーを OpenClaw に接続します。

<Note>
**前提条件:** `gcloud` CLI、`gog`（gogcli）、OpenClaw フックの有効化、公開 HTTPS エンドポイント用の Tailscale。
</Note>

### ウィザード設定（推奨）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

これは `hooks.gmail` 設定を書き込み、Gmail プリセットを有効にし、プッシュエンドポイントに Tailscale Funnel を使用します。

### Gateway 自動起動

`hooks.enabled=true` かつ `hooks.gmail.account` が設定されている場合、Gateway は起動時に `gog gmail watch serve` を開始し、watch を自動更新します。無効にするには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定します。

### 手動の一回限り設定

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

`openclaw cron run <jobId>` は手動実行をキューに入れた後に戻ります。シャットダウンフック、メンテナンススクリプト、またはキューに入った実行が完了するまでブロックする必要があるその他の自動化には `--wait` を使用します。待機モードは返された正確な `runId` をポーリングします。ステータス `ok` では `0` で終了し、`error`、`skipped`、または待機タイムアウトではゼロ以外で終了します。

エージェントの `cron` ツールは、`cron(action: "list")` からコンパクトなジョブ概要（`id`、`name`、`enabled`、`nextRunAtMs`、`scheduleKind`、`lastRunStatus`）を返します。完全なジョブ定義を 1 件取得するには `cron(action: "get", jobId: "...")` を使用します。直接の Gateway 呼び出し元は `compact: true` を `cron.list` に渡せます。省略すると、配信プレビューを含む既存の完全なレスポンスが保持されます。

`openclaw cron create` は `openclaw cron add` のエイリアスです。新しいジョブでは、位置引数のスケジュール（`"0 9 * * 1"`、`"every 1h"`、`"20m"`、または ISO タイムスタンプ）に続けて、位置引数のエージェントプロンプトを使用できます。完了した実行ペイロードを HTTP エンドポイントに POST するには、`cron add|create` または `cron edit` で `--webhook <url>` を使用します。Webhook 配信は、`--announce`、`--channel`、`--to`、`--thread-id`、`--account` などのチャット配信フラグと併用できません。`cron edit` では、`--clear-channel`、`--clear-to`、`--clear-thread-id`、`--clear-account` がそれぞれのルーティングフィールドを個別に解除します（各フラグは対応する設定フラグと一緒に指定すると拒否されます）。これは、`--no-deliver` が runner フォールバック配信を無効にすることとは異なります。

<Note>
モデル上書きの注意:

- `openclaw cron add|edit --model ...` はジョブで選択されたモデルを変更します。
- モデルが許可されている場合、その正確なプロバイダー/モデルが分離エージェント実行に到達します。
- 許可されていない、または解決できない場合、Cron は明示的な検証エラーで実行を失敗させます。
- API `cron.update` ペイロードパッチでは、保存済みジョブのモデル上書きをクリアするために `model: null` を設定できます。
- `openclaw cron edit <job-id> --clear-model` は CLI からその上書きをクリアし（`model: null` パッチと同じ効果）、`--model` と併用できません。
- Cron の `--model` はセッションの `/model` 上書きではなくジョブのプライマリであるため、設定済みのフォールバックチェーンは引き続き適用されます。
- `openclaw cron add|edit --fallbacks ...` はペイロード `fallbacks` を設定し、そのジョブの設定済みフォールバックを置き換えます。`--fallbacks ""` はフォールバックを無効にし、実行を厳格にします。`openclaw cron edit <job-id> --clear-fallbacks` はジョブ単位の上書きをクリアします。
- 明示的または設定済みのフォールバックリストがない単純な `--model` は、暗黙の追加リトライ先としてエージェントのプライマリへフォールスルーしません。

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

`maxConcurrentRuns` は、スケジュールされた Cron ディスパッチと分離エージェントターン実行の両方を制限し、デフォルトは 8 です。分離 Cron エージェントターンは、内部的にキュー専用の `cron-nested` 実行レーンを使用します。そのため、この値を増やすと、外側の Cron ラッパーだけが開始されるのではなく、独立した Cron LLM 実行を並列に進められます。共有の非 Cron `nested` レーンはこの設定では拡張されません。

`cron.store` は論理ストアキーであり、legacy doctor のインポートパスです。既存の JSON ストアを SQLite にインポートしてアーカイブするには、`openclaw doctor --fix` を実行します。今後の Cron 変更は CLI または Gateway API 経由で行う必要があります。

Cron の無効化: `cron.enabled: false` または `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="Retry behavior">
    **ワンショットリトライ**: 一時的なエラー（レート制限、過負荷、ネットワーク、サーバーエラー）は、指数バックオフで最大 3 回リトライされます。恒久的なエラーは即座に無効化します。

    **繰り返しリトライ**: リトライ間に指数バックオフ（30 秒から 60 分）を使用します。次回の成功実行後にバックオフはリセットされます。

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention`（デフォルト `24h`）は、分離実行セッションエントリを削除します。`cron.runLog.keepLines` は、ジョブごとに保持される SQLite 実行履歴行を制限します。`maxBytes` は古いファイルベースの実行ログとの設定互換性のために保持されています。
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
    - `cron.enabled` と `OPENCLAW_SKIP_CRON` 環境変数を確認します。
    - Gateway が継続的に実行されていることを確認します。
    - `cron` スケジュールでは、タイムゾーン（`--tz`）とホストのタイムゾーンを確認します。
    - 実行出力の `reason: not-due` は、手動実行が `openclaw cron run <jobId> --due` で確認され、ジョブがまだ実行期限に達していなかったことを意味します。

  </Accordion>
  <Accordion title="Cron fired but no delivery">
    - 配信モード `none` は、runner フォールバック送信が想定されていないことを意味します。チャットルートが利用可能な場合、エージェントは引き続き `message` ツールで直接送信できます。
    - 配信先が欠落または無効（`channel`/`to`）な場合、アウトバウンドはスキップされます。
    - Matrix では、コピーされたジョブや legacy ジョブで小文字化された `delivery.to` ルーム ID を使っていると、Matrix ルーム ID は大文字小文字を区別するため失敗することがあります。Matrix から取得した正確な `!room:server` または `room:!room:server` 値にジョブを編集してください。
    - チャンネル認証エラー（`unauthorized`、`Forbidden`）は、認証情報により配信がブロックされたことを意味します。
    - 分離実行がサイレントトークン（`NO_REPLY` / `no_reply`）のみを返す場合、OpenClaw は直接アウトバウンド配信を抑制し、フォールバックのキュー済み要約パスも抑制するため、チャットには何も投稿されません。
    - エージェント自身がユーザーにメッセージを送る必要がある場合は、ジョブに使用可能なルート（以前のチャットを持つ `channel: "last"`、または明示的なチャンネル/ターゲット）があることを確認します。

  </Accordion>
  <Accordion title="Cron or heartbeat appears to prevent /new-style rollover">
    - 日次およびアイドルリセットの鮮度は `updatedAt` に基づきません。[セッション管理](/ja-JP/concepts/session#session-lifecycle)を参照してください。
    - Cron ウェイクアップ、Heartbeat 実行、exec 通知、Gateway の bookkeeping は、ルーティング/ステータス用にセッション行を更新することがありますが、`sessionStartedAt` や `lastInteractionAt` は延長しません。
    - これらのフィールドが存在する前に作成された legacy 行では、ファイルがまだ利用可能な場合、OpenClaw は transcript JSONL セッションヘッダーから `sessionStartedAt` を復元できます。`lastInteractionAt` のない legacy アイドル行では、その復元された開始時刻をアイドル基準として使用します。

  </Accordion>
  <Accordion title="Timezone gotchas">
    - `--tz` のない Cron は Gateway ホストのタイムゾーンを使用します。
    - タイムゾーンのない `at` スケジュールは UTC として扱われます。
    - Heartbeat `activeHours` は設定済みのタイムゾーン解決を使用します。

  </Accordion>
</AccordionGroup>

## 関連

- [自動化](/ja-JP/automation) — すべての自動化メカニズムの一覧
- [バックグラウンドタスク](/ja-JP/automation/tasks) — Cron 実行のタスク台帳
- [Heartbeat](/ja-JP/gateway/heartbeat) — 定期的なメインセッションターン
- [タイムゾーン](/ja-JP/concepts/timezone) — タイムゾーン設定

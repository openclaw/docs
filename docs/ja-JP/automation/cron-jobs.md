---
read_when:
    - バックグラウンドジョブまたはウェイクアップのスケジュール設定
    - 外部トリガー（Webhook、Gmail）をOpenClawに接続する
    - スケジュールされたタスクで Heartbeat と Cron のどちらを選ぶか
sidebarTitle: Scheduled tasks
summary: Gateway スケジューラー向けのスケジュール済みジョブ、Webhook、Gmail PubSub トリガー
title: 定期タスク
x-i18n:
    generated_at: "2026-07-02T00:42:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 314b02ed3002843afe9d96e948de362b6111e648eb0e7106ec2ccc230cf50692
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron は Gateway 組み込みのスケジューラーです。ジョブを永続化し、適切な時刻にエージェントを起動し、出力をチャットチャネルまたは Webhook エンドポイントへ返すことができます。

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
  <Step title="実行履歴を確認する">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## cron の仕組み

- Cron は **Gateway 内部の** プロセスで実行されます（モデル内ではありません）。
- ジョブ定義、ランタイム状態、実行履歴は OpenClaw の共有 SQLite 状態データベースに永続化されるため、再起動してもスケジュールは失われません。
- アップグレード時は、`openclaw doctor --fix` を実行して、レガシーの `~/.openclaw/cron/jobs.json`、`jobs-state.json`、`runs/*.jsonl` ファイルを SQLite にインポートし、`.migrated` サフィックス付きにリネームします。不正な形式のジョブ行はランタイムからスキップされ、後で修復または確認できるよう `jobs-quarantine.json` にコピーされます。
- `cron.store` は引き続き論理的な cron ストアキーと doctor インポートパスを表します。インポート後は、その JSON ファイルを編集してもアクティブな cron ジョブは変更されません。代わりに `openclaw cron add|edit|remove` または Gateway cron RPC メソッドを使用してください。
- すべての cron 実行は [バックグラウンドタスク](/ja-JP/automation/tasks) レコードを作成します。
- Gateway 起動時、期限を過ぎた分離エージェントターンジョブはすぐに再生されるのではなく、チャネル接続ウィンドウの外へ再スケジュールされるため、再起動後も Discord/Telegram の起動とネイティブコマンド設定の応答性が保たれます。
- 1 回限りのジョブ（`--at`）は、デフォルトで成功後に自動削除されます。
- 分離 cron 実行は、実行完了時に `cron:<jobId>` セッション用に追跡されたブラウザータブやプロセスをベストエフォートで閉じるため、切り離されたブラウザー自動化が孤立プロセスを残しません。
- 狭い cron 自己クリーンアップ権限を受け取った分離 cron 実行は、スケジューラー状態、自分の現在ジョブに自己フィルタリングされた一覧、そのジョブの実行履歴を引き続き読み取れるため、より広範な cron 変更アクセスを得ずに、状態や Heartbeat チェックで自分のスケジュールを検査できます。
- 分離 cron 実行は、古い確認応答もガードします。最初の結果が単なる暫定状態更新（`on it`、`pulling everything together`、および類似のヒント）で、最終回答にまだ責任を持つ子孫サブエージェント実行がない場合、OpenClaw は配信前に実際の結果を一度だけ再プロンプトします。
- 分離 cron 実行は、埋め込み実行からの構造化された実行拒否メタデータを使用します。これには、ネストされたエラーメッセージが `SYSTEM_RUN_DENIED` または `INVALID_REQUEST` で始まる node-host `UNAVAILABLE` ラッパーも含まれるため、ブロックされたコマンドが成功した実行として報告されず、通常のアシスタント文が拒否として扱われることもありません。
- 分離 cron 実行は、返信ペイロードが生成されない場合でも、実行レベルのエージェント失敗をジョブエラーとして扱います。そのため、モデルやプロバイダーの失敗は、ジョブを成功としてクリアするのではなく、エラーカウンターを増やして失敗通知をトリガーします。
- 分離エージェントターンジョブが `timeoutSeconds` に達すると、cron は基盤となるエージェント実行を中止し、短いクリーンアップウィンドウを与えます。実行が排出されない場合、Gateway 所有のクリーンアップが、cron がタイムアウトを記録する前にその実行のセッション所有権を強制的にクリアするため、キュー内のチャット作業が古い処理中セッションの背後に残されません。
- 分離エージェントターンがランナー開始前または最初のモデル呼び出し前に停止した場合、cron は `setup timed out before runner start` や `stalled before first model call (last phase: context-engine)` のようなフェーズ固有のタイムアウトを記録します。これらのウォッチドッグは、外部 CLI プロセスが実際に開始される前の埋め込みプロバイダーと CLI バックエンドプロバイダーをカバーし、長い `timeoutSeconds` 値とは独立して上限が設定されるため、コールドスタート、認証、コンテキスト失敗がジョブ全体の予算を待たずにすばやく表面化します。
- system cron または別の外部スケジューラーを使用して `openclaw agent` を実行する場合、CLI が `SIGTERM`/`SIGINT` を処理する場合でも、ハードキルのエスカレーションでラップしてください。Gateway バックエンド実行は、受け付けられた実行の中止を Gateway に依頼します。ローカルおよび埋め込みフォールバック実行は、同じ中止シグナルを受け取ります。GNU `timeout` では、単純な `timeout 600 ...` よりも `timeout -k 60 600 openclaw agent ...` を推奨します。`-k` 値は、プロセスが排出できない場合のスーパーバイザーの最後の抑止策です。systemd ユニットでは、最終的な kill の前に `TimeoutStopSec` のような猶予ウィンドウと `SIGTERM` 停止シグナルを使用して同じ形を維持してください。元の Gateway 実行がまだアクティブな間にリトライが `--run-id` を再利用した場合、2 回目の実行を開始するのではなく、重複は実行中として報告されます。

<a id="maintenance"></a>

<Note>
cron のタスク調整は、第一にランタイム所有、第二に永続履歴バックエンドです。古い子セッション行がまだ存在していても、cron ランタイムがそのジョブを実行中として追跡している間、アクティブな cron タスクはライブのままです。ランタイムがジョブの所有を停止し、5 分間の猶予ウィンドウが期限切れになると、メンテナンスは一致する `cron:<jobId>:<startedAt>` 実行について、永続化された実行ログとジョブ状態を確認します。その永続履歴に終端結果が示されている場合、タスク台帳はそこから確定されます。それ以外の場合、Gateway 所有のメンテナンスはタスクを `lost` としてマークできます。オフライン CLI 監査は永続履歴から回復できますが、自分自身の空のインプロセスアクティブジョブセットを、Gateway 所有の cron 実行が消えた証拠として扱うことはありません。
</Note>

## スケジュール種別

| 種類    | CLI フラグ  | 説明                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | 1 回限りのタイムスタンプ（ISO 8601 または `20m` のような相対指定）    |
| `every` | `--every` | 固定間隔                                          |
| `cron`  | `--cron`  | 任意の `--tz` を伴う 5 フィールドまたは 6 フィールドの cron 式 |

タイムゾーンのないタイムスタンプは UTC として扱われます。ローカルの壁時計時刻でスケジュールするには `--tz America/New_York` を追加してください。

毎時ちょうどの再帰式は、負荷スパイクを減らすために最大 5 分まで自動的にずらされます。正確な時刻を強制するには `--exact` を使用し、明示的なウィンドウには `--stagger 30s` を使用します。

### 日付と曜日は OR ロジックを使用する

Cron 式は [croner](https://github.com/Hexagon/croner) によって解析されます。日付フィールドと曜日フィールドの両方がワイルドカードでない場合、croner は両方ではなく、**どちらか**のフィールドが一致したときに一致とします。これは標準的な Vixie cron の動作です。

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

これは月に 0〜1 回ではなく、約 5〜6 回発火します。OpenClaw はここで Croner のデフォルトの OR 動作を使用します。両方の条件を必須にするには、Croner の `+` 曜日修飾子（`0 9 15 * +1`）を使用するか、一方のフィールドでスケジュールし、もう一方をジョブのプロンプトまたはコマンド内でガードしてください。

## 実行スタイル

| スタイル           | `--session` 値   | 実行先                  | 最適な用途                       |
| --------------- | ------------------- | ------------------------ | ------------------------------ |
| メインセッション    | `main`              | 専用 cron 起動レーン | リマインダー、システムイベント       |
| 分離        | `isolated`          | 専用 `cron:<jobId>` | レポート、バックグラウンド作業     |
| 現在のセッション | `current`           | 切り離された cron 実行        | コンテキスト対応の定期作業   |
| カスタムセッション  | `session:custom-id` | 切り離された cron 実行        | 既知のチャット/セッションを対象にする |

<AccordionGroup>
  <Accordion title="メインセッションと分離、カスタムの違い">
    **メインセッション**ジョブは、システムイベントを cron 所有の実行レーンにエンキューし、必要に応じて Heartbeat（`--wake now` または `--wake next-heartbeat`）を起動します。返信には対象メインセッションの最後の配信コンテキストを使用できますが、通常の cron ターンを人間のチャットレーンに追加せず、対象セッションの日次/アイドルリセットの鮮度も延長しません。**分離**ジョブは、新しいセッションで専用のエージェントターンを実行します。**現在**および**カスタム**セッションジョブ（`current`、`session:xxx`）は、配信コンテキストと安全な設定シードに選択されたチャット/セッションを使用できますが、各実行は引き続き切り離された cron セッションで実行されるため、スケジュールされた作業がライブ会話トランスクリプトをブロックしたり汚染したりしません。

    メインセッションの cron イベントは、自己完結型のシステムイベントリマインダーです。デフォルトの Heartbeat プロンプトの「Read
    HEARTBEAT.md」指示は自動的には含まれません。定期リマインダーが
    `HEARTBEAT.md` を参照する必要がある場合は、cron イベントテキストまたは
    エージェント自身の指示で明示してください。

  </Accordion>
  <Accordion title="切り離されたジョブにおける「新しいセッション」の意味">
    分離、現在のセッション、カスタムセッションのジョブでは、「新しいセッション」とは、各実行に対して新しいトランスクリプト/セッション ID を意味します。OpenClaw は、思考/高速/詳細設定、ラベル、明示的にユーザーが選択したモデル/認証オーバーライドなどの安全な設定を引き継ぐ場合があります。切り離された実行は、古い cron 行から周囲の会話コンテキストを継承しません。つまり、チャネル/グループルーティング、送信またはキューポリシー、昇格、発生元、ACP ランタイムバインディングは継承されません。cron メモリとしてライブチャットトランスクリプトに依存するのではなく、定期作業の永続状態をプロンプト、ワークスペースファイル、ツール、またはジョブが操作するシステムに置いてください。
  </Accordion>
  <Accordion title="ランタイムクリーンアップ">
    分離ジョブでは、ランタイムのティアダウンに、その cron セッションのベストエフォートなブラウザークリーンアップが含まれるようになりました。クリーンアップ失敗は無視されるため、実際の cron 結果が引き続き優先されます。

    分離 cron 実行は、共有ランタイムクリーンアップパスを通じて、ジョブ用に作成されたバンドル MCP ランタイムインスタンスも破棄します。これはメインセッションおよびカスタムセッションの MCP クライアントがティアダウンされる方法と一致するため、分離 cron ジョブが stdio 子プロセスや長寿命の MCP 接続を実行間でリークしません。

  </Accordion>
  <Accordion title="サブエージェントと Discord 配信">
    分離 cron 実行がサブエージェントをオーケストレーションする場合、配信も古い親の暫定テキストより最終的な子孫出力を優先します。子孫がまだ実行中の場合、OpenClaw はその部分的な親更新を通知せずに抑制します。

    テキストのみの Discord 通知先では、OpenClaw はストリーミング/中間テキストペイロードと最終回答の両方を再生するのではなく、正規の最終アシスタントテキストを一度だけ送信します。メディアおよび構造化された Discord ペイロードは引き続き別個のペイロードとして配信されるため、添付ファイルやコンポーネントは失われません。

  </Accordion>
</AccordionGroup>

### コマンドペイロード

モデルバックエンドの分離エージェントターンを開始せずに Gateway スケジューラー内で実行する必要がある決定的なスクリプトには、コマンドペイロードを使用します。コマンドジョブは Gateway ホスト上で実行され、stdout/stderr をキャプチャし、実行を cron 履歴に記録し、分離ジョブと同じ `announce`、`webhook`、`none` 配信モードを再利用します。

<Note>
コマンド cron は、エージェントの
`tools.exec` 呼び出しではなく、operator-admin の Gateway 自動化サーフェスです。cron ジョブの作成、更新、削除、または手動実行には
`operator.admin` が必要です。スケジュール済みコマンド実行は、その後
Gateway プロセス内で、その管理者が作成した自動化として実行されます。
`tools.exec.mode`、承認プロンプト、エージェントごとのツール許可リストなどのエージェント exec ポリシーは、モデルに見える exec ツールを管理するものであり、コマンド cron ペイロードは管理しません。
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

`--command <shell>` は `argv: ["sh", "-lc", <shell>]` を保存します。シェル解析なしで正確な argv 実行をしたい場合は、`--command-argv '["node","scripts/report.mjs"]'` を使用してください。任意の `--command-env KEY=VALUE`、`--command-input`、`--timeout-seconds`、`--no-output-timeout-seconds`、`--output-max-bytes` フィールドは、プロセス環境、stdin、出力上限を制御します。

stdout が空でない場合、そのテキストが配信結果になります。stdout が空で、stderr が空でない場合、stderr が配信されます。両方のストリームが存在する場合、Cron は小さな `stdout:` / `stderr:` ブロックを配信します。終了コード 0 は実行を `ok` として記録します。ゼロ以外の終了、シグナル、タイムアウト、または出力なしタイムアウトは `error` を記録し、失敗アラートをトリガーできます。`NO_REPLY` のみを出力するコマンドは、通常の Cron サイレントトークン抑制を使用し、チャットには何も投稿しません。

### 分離ジョブのペイロードオプション

<ParamField path="--message" type="string" required>
  プロンプトテキスト（分離では必須）。
</ParamField>
<ParamField path="--model" type="string">
  モデルの上書き。ジョブ用に選択された許可済みモデルを使用します。
</ParamField>
<ParamField path="--fallbacks" type="string">
  ジョブ単位のフォールバックモデル一覧。例: `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`。フォールバックなしの厳密な実行には `--fallbacks ""` を渡します。
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  `cron edit` で、ジョブ単位のフォールバック上書きを削除し、ジョブが設定済みのフォールバック優先順位に従うようにします。`--fallbacks` と組み合わせることはできません。
</ParamField>
<ParamField path="--clear-model" type="boolean">
  `cron edit` で、ジョブ単位のモデル上書きを削除し、ジョブが通常の Cron モデル選択優先順位（設定されている場合は保存済み Cron セッション上書き、それ以外はエージェント/デフォルトモデル）に従うようにします。`--model` と組み合わせることはできません。
</ParamField>
<ParamField path="--thinking" type="string">
  思考レベルの上書き。
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  `cron edit` で、ジョブ単位の思考上書きを削除し、ジョブが通常の Cron 思考優先順位に従うようにします。`--thinking` と組み合わせることはできません。
</ParamField>
<ParamField path="--light-context" type="boolean">
  ワークスペースのブートストラップファイル注入をスキップします。
</ParamField>
<ParamField path="--tools" type="string">
  ジョブが使用できるツールを制限します。例: `--tools exec,read`。
</ParamField>

`--model` は、選択された許可済みモデルをそのジョブのプライマリモデルとして使用します。これはチャットセッションの `/model` 上書きとは異なります。ジョブのプライマリが失敗した場合でも、設定済みのフォールバックチェーンは引き続き適用されます。要求されたモデルが許可されていない、または解決できない場合、Cron はジョブのエージェント/デフォルトモデル選択へ暗黙にフォールバックするのではなく、明示的な検証エラーで実行を失敗させます。

Cron ジョブはペイロードレベルの `fallbacks` も保持できます。存在する場合、その一覧がジョブの設定済みフォールバックチェーンを置き換えます。選択されたモデルのみを試す厳密な Cron 実行にしたい場合は、ジョブペイロード/API で `fallbacks: []` を使用します。ジョブに `--model` があり、ペイロードにも設定済みフォールバックにも何もない場合、OpenClaw は明示的な空のフォールバック上書きを渡すため、エージェントのプライマリが隠れた追加リトライ対象として追加されません。

ローカルプロバイダーの事前チェックは、Cron 実行を `skipped` とマークする前に設定済みフォールバックを順に確認します。`fallbacks: []` は、その事前チェックパスを厳密なままにします。

分離ジョブのモデル選択優先順位は次のとおりです。

1. Gmail フックのモデル上書き（実行が Gmail 由来で、その上書きが許可されている場合）
2. ジョブ単位ペイロードの `model`
3. ユーザーが選択した保存済み Cron セッションモデル上書き
4. エージェント/デフォルトモデル選択

高速モードも、解決されたライブ選択に従います。選択されたモデル設定に `params.fastMode` がある場合、分離 Cron はデフォルトでそれを使用します。保存済みセッションの `fastMode` 上書きは、どちらの方向でも設定より優先されます。自動モードは、存在する場合は選択モデルの `params.fastAutoOnSeconds` カットオフを使用し、デフォルトは 60 秒です。

分離実行でライブモデル切り替えハンドオフが発生した場合、Cron は切り替え後のプロバイダー/モデルで再試行し、再試行前にそのライブ選択をアクティブな実行に永続化します。切り替えに新しい認証プロファイルも含まれる場合、Cron はその認証プロファイル上書きもアクティブな実行に永続化します。リトライには上限があります。初回試行に加えて 2 回の切り替えリトライ後、Cron は無限ループせずに中止します。

分離 Cron 実行がエージェントランナーに入る前に、OpenClaw は、`baseUrl` がループバック、プライベートネットワーク、または `.local` である、設定済みの `api: "ollama"` および `api: "openai-completions"` プロバイダーについて、到達可能なローカルプロバイダーエンドポイントを確認します。そのエンドポイントが停止している場合、モデル呼び出しを開始する代わりに、明確なプロバイダー/モデルエラーとともに実行が `skipped` として記録されます。エンドポイント結果は 5 分間キャッシュされるため、同じ停止中のローカル Ollama、vLLM、SGLang、または LM Studio サーバーを使用する多数の期限到来ジョブは、リクエストの集中を生む代わりに 1 回の小さなプローブを共有します。プロバイダー事前チェックでスキップされた実行は、実行エラーバックオフを増やしません。スキップ通知を繰り返したい場合は `failureAlert.includeSkipped` を有効にします。

## 配信と出力

| モード       | 動作                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | エージェントが送信しなかった場合、最終テキストをターゲットへフォールバック配信 |
| `webhook`  | 完了イベントペイロードを URL に POST                                |
| `none`     | ランナーによるフォールバック配信なし                                         |

チャンネル配信には `--announce --channel telegram --to "-1001234567890"` を使用します。Telegram フォーラムトピックでは `-1001234567890:topic:123` を使用します。OpenClaw は Telegram 所有の省略形 `-1001234567890:123` も受け付けます。直接 RPC/設定呼び出し元は、`delivery.threadId` を文字列または数値として渡せます。Slack/Discord/Mattermost のターゲットには、明示的なプレフィックス（`channel:<id>`、`user:<id>`）を使用してください。Matrix のルーム ID は大文字と小文字を区別します。正確なルーム ID、または Matrix の `room:!room:server` 形式を使用してください。

announce 配信で `channel: "last"` を使用する、または `channel` を省略する場合、`telegram:123` のようなプロバイダープレフィックス付きターゲットは、Cron がセッション履歴または単一の設定済みチャンネルにフォールバックする前にチャンネルを選択できます。読み込まれた Plugin によって通知されているプレフィックスのみがプロバイダーセレクターです。`delivery.channel` が明示されている場合、ターゲットプレフィックスは同じプロバイダー名でなければなりません。たとえば、`channel: "whatsapp"` と `to: "telegram:123"` の組み合わせは、WhatsApp に Telegram ID を電話番号として解釈させるのではなく拒否されます。`channel:<id>`、`user:<id>`、`imessage:<handle>`、`sms:<number>` などのターゲット種別およびサービスプレフィックスは、プロバイダーセレクターではなく、チャンネル所有のターゲット構文のままです。

分離ジョブでは、チャット配信は共有されます。チャットルートが利用可能な場合、ジョブが `--no-deliver` を使用していても、エージェントは `message` ツールを使用できます。エージェントが設定済み/現在のターゲットに送信した場合、OpenClaw はフォールバック announce をスキップします。それ以外の場合、`announce`、`webhook`、`none` は、エージェントターン後の最終応答をランナーがどう扱うかだけを制御します。

エージェントがアクティブなチャットから分離リマインダーを作成すると、OpenClaw はフォールバック announce ルート用に保持されたライブ配信ターゲットを保存します。内部セッションキーは小文字の場合があります。現在のチャットコンテキストが利用可能な場合、プロバイダー配信ターゲットはそれらのキーから再構築されません。

暗黙の announce 配信は、設定済みのチャンネル許可リストを使用して古いターゲットを検証し、再ルーティングします。DM ペアリングストアの承認はフォールバック自動化の受信者ではありません。スケジュール済みジョブが DM に能動的に送信すべき場合は、`delivery.to` を設定するか、チャンネルの `allowFrom` エントリを設定してください。

## 出力言語

Cron ジョブは、チャンネル、ロケール、または以前の
メッセージから返信言語を推測しません。スケジュール済みメッセージまたはテンプレートに言語ルールを入れてください。

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

テンプレートファイルでは、レンダリング後のプロンプトに言語指示を保持し、
ジョブ実行前に `{{language}}` などのプレースホルダーが埋まっていることを確認してください。出力に複数の言語が混在する場合は、ルールを明示します。例: 「説明文には中国語を使用し、技術用語は英語のままにしてください。」

失敗通知は別の宛先パスに従います。

- `cron.failureDestination` は失敗通知のグローバルデフォルトを設定します。
- `job.delivery.failureDestination` はジョブ単位でそれを上書きします。
- どちらも設定されておらず、ジョブがすでに `announce` 経由で配信している場合、失敗通知はそのプライマリ announce ターゲットへフォールバックするようになりました。
- `delivery.failureDestination` は、プライマリ配信モードが `webhook` でない限り、`sessionTarget="isolated"` ジョブでのみサポートされます。
- `failureAlert.includeSkipped: true` は、ジョブまたはグローバル Cron アラートポリシーで、スキップ実行アラートの繰り返しを有効にします。スキップされた実行は、連続スキップカウンターを別に保持するため、実行エラーバックオフには影響しません。

## CLI 例

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
  <Tab title="反復する分離ジョブ">
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

Gateway は外部トリガー用に HTTP Webhook エンドポイントを公開できます。設定で有効にします。

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

クエリ文字列トークンは拒否されます。

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
    カスタムフック名は、設定内の `hooks.mappings` によって解決されます。マッピングは、任意のペイロードをテンプレートまたはコード変換で `wake` または `agent` アクションに変換できます。
  </Accordion>
</AccordionGroup>

<Warning>
フックエンドポイントは、ループバック、tailnet、または信頼済みリバースプロキシの背後に置いてください。

- 専用のフックトークンを使用し、gateway 認証トークンを再利用しないでください。
- `hooks.path` は専用のサブパスに保持してください。`/` は拒否されます。
- `hooks.allowedAgentIds` を設定して、フックが対象にできる有効なエージェントを制限してください。`agentId` が省略された場合のデフォルトエージェントも含みます。
- 呼び出し元にセッションを選択させる必要がない限り、`hooks.allowRequestSessionKey=false` のままにしてください。
- `hooks.allowRequestSessionKey` を有効にする場合は、許可するセッションキーの形を制約するために `hooks.allowedSessionKeyPrefixes` も設定してください。
- フックペイロードはデフォルトで安全境界によりラップされます。

</Warning>

## Gmail PubSub 連携

Google PubSub 経由で Gmail 受信トリガーを OpenClaw に接続します。

<Note>
**前提条件:** `gcloud` CLI、`gog` (gogcli)、OpenClaw フックの有効化、公開 HTTPS エンドポイント用の Tailscale。
</Note>

### ウィザードセットアップ（推奨）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

これにより `hooks.gmail` 設定が書き込まれ、Gmail プリセットが有効化され、プッシュエンドポイントに Tailscale Funnel が使用されます。

### Gateway の自動起動

`hooks.enabled=true` かつ `hooks.gmail.account` が設定されている場合、Gateway は起動時に `gog gmail watch serve` を開始し、watch を自動更新します。無効にするには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定してください。

### 手動の一回限りのセットアップ

<Steps>
  <Step title="GCP プロジェクトを選択する">
    `gog` が使用する OAuth クライアントを所有する GCP プロジェクトを選択します。

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="トピックを作成し、Gmail プッシュアクセスを付与する">
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

`openclaw cron run <jobId>` は手動実行をキューに入れた後に戻ります。シャットダウンフック、メンテナンススクリプト、またはキュー内の実行が完了するまでブロックする必要があるその他の自動化には `--wait` を使用してください。待機モードは返された正確な `runId` をポーリングします。ステータスが `ok` の場合は `0` で終了し、`error`、`skipped`、または待機タイムアウトの場合は非ゼロで終了します。

エージェントの `cron` ツールは、`cron(action: "list")` からコンパクトなジョブ概要（`id`、`name`、`enabled`、`nextRunAtMs`、`scheduleKind`、`lastRunStatus`）を返します。完全なジョブ定義を 1 件取得するには `cron(action: "get", jobId: "...")` を使用してください。Gateway を直接呼び出す場合は `cron.list` に `compact: true` を渡せます。省略すると、配信プレビューを含む既存の完全なレスポンスが維持されます。

`openclaw cron create` は `openclaw cron add` のエイリアスです。新しいジョブでは、位置引数のスケジュール（`"0 9 * * 1"`、`"every 1h"`、`"20m"`、または ISO タイムスタンプ）に続けて、位置引数のエージェントプロンプトを使用できます。完了した実行ペイロードを HTTP エンドポイントに POST するには、`cron add|create` または `cron edit` で `--webhook <url>` を使用してください。Webhook 配信は、`--announce`、`--channel`、`--to`、`--thread-id`、`--account` などのチャット配信フラグと組み合わせることはできません。`cron edit` では、`--clear-channel`、`--clear-to`、`--clear-thread-id`、`--clear-account` がそれぞれのルーティングフィールドを個別に解除します（それぞれ対応する設定フラグと同時指定すると拒否されます）。これは、`--no-deliver` がランナーのフォールバック配信を無効化することとは別です。

<Note>
モデルオーバーライドの注意:

- `openclaw cron add|edit --model ...` はジョブの選択モデルを変更します。
- モデルが許可されている場合、その正確なプロバイダー/モデルが分離エージェント実行に到達します。
- 許可されていない、または解決できない場合、cron は明示的な検証エラーで実行を失敗させます。
- API の `cron.update` ペイロードパッチでは、保存済みジョブのモデルオーバーライドをクリアするために `model: null` を設定できます。
- `openclaw cron edit <job-id> --clear-model` は CLI からそのオーバーライドをクリアします（`model: null` パッチと同じ効果）し、`--model` と組み合わせることはできません。
- 設定済みのフォールバックチェーンは引き続き適用されます。cron の `--model` はジョブのプライマリであり、セッションの `/model` オーバーライドではないためです。
- `openclaw cron add|edit --fallbacks ...` はペイロード `fallbacks` を設定し、そのジョブの設定済みフォールバックを置き換えます。`--fallbacks ""` はフォールバックを無効化し、実行を厳格にします。`openclaw cron edit <job-id> --clear-fallbacks` はジョブごとのオーバーライドをクリアします。
- 明示的または設定済みのフォールバックリストがない通常の `--model` は、無言の追加再試行先としてエージェントのプライマリにフォールスルーしません。

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

`maxConcurrentRuns` はスケジュール済み cron ディスパッチと分離エージェントターン実行の両方を制限し、デフォルトは 8 です。分離 cron エージェントターンは内部的にキュー専用の `cron-nested` 実行レーンを使用するため、この値を上げると、外側の cron ラッパーの開始だけでなく、独立した cron LLM 実行を並列に進められます。共有の非 cron `nested` レーンは、この設定では拡張されません。

`cron.store` は論理ストアキーであり、レガシー doctor インポートパスです。既存の JSON ストアを SQLite にインポートしてアーカイブするには、`openclaw doctor --fix` を実行してください。今後の cron 変更は CLI または Gateway API 経由で行う必要があります。

cron を無効化: `cron.enabled: false` または `OPENCLAW_SKIP_CRON=1`。

<AccordionGroup>
  <Accordion title="再試行動作">
    **ワンショット再試行**: 一時的なエラー（レート制限、過負荷、ネットワーク、サーバーエラー）は、指数バックオフで最大 3 回再試行されます。恒久的なエラーは即座に無効化されます。

    **繰り返し再試行**: 再試行間に指数バックオフ（30 秒から 60 分）を使用します。次回の成功実行後にバックオフはリセットされます。

  </Accordion>
  <Accordion title="メンテナンス">
    `cron.sessionRetention`（デフォルト `24h`）は、分離実行セッションエントリをプルーニングします。`cron.runLog.keepLines` は、ジョブごとに保持する SQLite 実行履歴行数を制限します。`maxBytes` は、古いファイルベース実行ログとの設定互換性のために保持されています。
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
  <Accordion title="Cron が発火しない">
    - `cron.enabled` と `OPENCLAW_SKIP_CRON` 環境変数を確認してください。
    - Gateway が継続的に実行されていることを確認してください。
    - `cron` スケジュールでは、タイムゾーン（`--tz`）とホストのタイムゾーンを確認してください。
    - 実行出力の `reason: not-due` は、`openclaw cron run <jobId> --due` で手動実行が確認され、そのジョブがまだ期限に達していなかったことを意味します。

  </Accordion>
  <Accordion title="Cron は発火したが配信されない">
    - 配信モード `none` は、ランナーのフォールバック送信が想定されていないことを意味します。チャットルートが利用可能な場合、エージェントは引き続き `message` ツールで直接送信できます。
    - 配信先が欠落または無効（`channel`/`to`）な場合、送信はスキップされます。
    - Matrix では、小文字化された `delivery.to` ルーム ID を持つコピー済みまたはレガシージョブは、Matrix のルーム ID が大文字小文字を区別するため失敗する可能性があります。Matrix から取得した正確な `!room:server` または `room:!room:server` の値にジョブを編集してください。
    - チャンネル認証エラー（`unauthorized`、`Forbidden`）は、認証情報により配信がブロックされたことを意味します。
    - 分離実行がサイレントトークン（`NO_REPLY` / `no_reply`）のみを返す場合、OpenClaw は直接のアウトバウンド配信を抑制し、フォールバックのキュー済み概要パスも抑制するため、チャットには何も投稿されません。
    - エージェント自身がユーザーにメッセージを送るべき場合は、ジョブに使用可能なルート（以前のチャットがある `channel: "last"`、または明示的なチャンネル/ターゲット）があることを確認してください。

  </Accordion>
  <Accordion title="Cron または heartbeat が /new スタイルのロールオーバーを妨げているように見える">
    - 日次リセットとアイドルリセットの鮮度は `updatedAt` に基づきません。[セッション管理](/ja-JP/concepts/session#session-lifecycle) を参照してください。
    - Cron の wakeup、heartbeat 実行、exec 通知、Gateway の帳簿管理は、ルーティング/ステータスのためにセッション行を更新する場合がありますが、`sessionStartedAt` や `lastInteractionAt` は延長しません。
    - これらのフィールドが存在する前に作成されたレガシー行では、ファイルがまだ利用可能な場合、OpenClaw は transcript JSONL セッションヘッダーから `sessionStartedAt` を復元できます。`lastInteractionAt` のないレガシーアイドル行は、その復元された開始時刻をアイドル基準として使用します。

  </Accordion>
  <Accordion title="タイムゾーンの注意点">
    - `--tz` なしの Cron は Gateway ホストのタイムゾーンを使用します。
    - タイムゾーンのない `at` スケジュールは UTC として扱われます。
    - Heartbeat の `activeHours` は設定済みのタイムゾーン解決を使用します。

  </Accordion>
</AccordionGroup>

## 関連

- [自動化](/ja-JP/automation) — すべての自動化メカニズムの概要
- [バックグラウンドタスク](/ja-JP/automation/tasks) — cron 実行のタスク台帳
- [Heartbeat](/ja-JP/gateway/heartbeat) — 定期的なメインセッションターン
- [タイムゾーン](/ja-JP/concepts/timezone) — タイムゾーン設定

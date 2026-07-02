---
read_when:
    - バックグラウンドジョブまたはウェイクアップのスケジュール設定
    - 外部トリガー（Webhook、Gmail）を OpenClaw に接続する
    - スケジュールされたタスクに Heartbeat と Cron のどちらを使うかを決める
sidebarTitle: Scheduled tasks
summary: Gateway スケジューラー向けのスケジュール済みジョブ、Webhook、Gmail PubSub トリガー
title: スケジュールされたタスク
x-i18n:
    generated_at: "2026-07-02T07:56:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f75b8d1e5ac558a02b895e1cd1b92b05af549a2bd63d4ce3ddafcaf9e94b88e
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron は Gateway 組み込みのスケジューラーです。ジョブを永続化し、適切な時刻にエージェントを起動し、出力をチャットチャネルまたは webhook エンドポイントへ返すことができます。

## クイックスタート

<Steps>
  <Step title="Add a one-shot reminder">
    ```bash
    openclaw cron create "2026-02-01T16:00:00Z" \
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

- Cron は **Gateway 内部** のプロセスで実行されます（モデル内部ではありません）。
- ジョブ定義、ランタイム状態、実行履歴は OpenClaw の共有 SQLite 状態データベースに永続化されるため、再起動してもスケジュールは失われません。
- アップグレード時は、`openclaw doctor --fix` を実行して、レガシーの `~/.openclaw/cron/jobs.json`、`jobs-state.json`、`runs/*.jsonl` ファイルを SQLite にインポートし、`.migrated` サフィックス付きにリネームします。不正な形式のジョブ行はランタイムからスキップされ、後で修復またはレビューできるよう `jobs-quarantine.json` にコピーされます。
- `cron.store` は引き続き、論理的な cron ストアキーと doctor インポートパスを示します。インポート後、その JSON ファイルを編集してもアクティブな cron ジョブは変更されません。代わりに `openclaw cron add|edit|remove` または Gateway cron RPC メソッドを使用してください。
- すべての cron 実行は [バックグラウンドタスク](/ja-JP/automation/tasks) レコードを作成します。
- Gateway 起動時、期限を過ぎた分離エージェントターンジョブは即時再生されるのではなく、チャネル接続ウィンドウの外へ再スケジュールされます。そのため再起動後も Discord/Telegram の起動とネイティブコマンド設定の応答性が保たれます。
- ワンショットジョブ（`--at`）は、デフォルトで成功後に自動削除されます。
- 分離 cron 実行は、実行完了時に `cron:<jobId>` セッション用に追跡されているブラウザータブ/プロセスをベストエフォートで閉じるため、切り離されたブラウザー自動化が孤立プロセスを残しません。
- 限定的な cron 自己クリーンアップ権限を受け取った分離 cron 実行は、スケジューラー状態、自身の現在のジョブだけにフィルタリングされた一覧、そのジョブの実行履歴を引き続き読み取れます。そのため、より広い cron 変更権限を得ることなく、自身のスケジュールを状態/Heartbeat チェックで検査できます。
- 分離 cron 実行は、古い確認応答の返信も防ぎます。最初の結果が単なる暫定的な状態更新（`on it`、`pulling everything together`、および類似のヒント）であり、子孫サブエージェント実行が最終回答の責任をまだ負っていない場合、OpenClaw は配信前に実際の結果を一度だけ再プロンプトします。
- 分離 cron 実行は、埋め込み実行からの構造化された実行拒否メタデータを使用します。これには、ネストされたエラーメッセージが `SYSTEM_RUN_DENIED` または `INVALID_REQUEST` で始まる node-host `UNAVAILABLE` ラッパーも含まれるため、ブロックされたコマンドが正常な実行として報告されず、通常のアシスタント文も拒否として扱われません。
- 分離 cron 実行は、返信ペイロードが生成されない場合でも、実行レベルのエージェント失敗をジョブエラーとして扱います。そのため、モデル/プロバイダーの失敗はエラーカウンターを増やし、ジョブを成功としてクリアするのではなく失敗通知をトリガーします。
- 分離エージェントターンジョブが `timeoutSeconds` に達すると、cron は基盤となるエージェント実行を中止し、短いクリーンアップウィンドウを与えます。実行がドレインしない場合、Gateway 所有のクリーンアップが cron のタイムアウト記録前にその実行のセッション所有権を強制クリアするため、キュー済みのチャット作業が古い処理中セッションの背後に残されません。
- 分離エージェントターンがランナー開始前、または最初のモデル呼び出し前に停止した場合、cron は `setup timed out before runner start` や `stalled before first model call (last phase: context-engine)` など、フェーズ固有のタイムアウトを記録します。これらのウォッチドッグは、外部 CLI プロセスが実際に開始される前の埋め込みプロバイダーと CLI ベースのプロバイダーを対象とし、長い `timeoutSeconds` 値とは独立して上限が設定されるため、コールドスタート/認証/コンテキストの失敗がジョブ予算全体を待たずにすばやく表面化します。
- system cron または別の外部スケジューラーで `openclaw agent` を実行する場合、CLI が `SIGTERM`/`SIGINT` を処理する場合でも、ハードキルのエスカレーションでラップしてください。Gateway バックの実行は、受け付け済み実行を中止するよう Gateway に要求します。ローカルおよび埋め込みフォールバック実行は、同じ中止シグナルを受け取ります。GNU `timeout` では、単なる `timeout 600 ...` よりも `timeout -k 60 600 openclaw agent ...` を推奨します。`-k` 値は、プロセスがドレインできない場合のスーパーバイザーのバックストップです。systemd ユニットでは、`SIGTERM` 停止シグナルと、最終 kill 前の `TimeoutStopSec` などの猶予ウィンドウを使って同じ形を保ってください。元の Gateway 実行がまだアクティブな間に再試行が `--run-id` を再利用した場合、重複分は 2 つ目の実行を開始せず、実行中として報告されます。

<a id="maintenance"></a>

<Note>
cron のタスク調整は、第一にランタイム所有、第二に永続履歴バックです。古い子セッション行がまだ存在する場合でも、cron ランタイムがそのジョブを実行中として追跡している間、アクティブな cron タスクはライブのままです。ランタイムがジョブを所有しなくなり、5 分の猶予ウィンドウが期限切れになると、メンテナンスは永続化された実行ログとジョブ状態から、一致する `cron:<jobId>:<startedAt>` 実行を確認します。その永続履歴が終端結果を示している場合、タスク台帳はそこから確定されます。そうでない場合、Gateway 所有のメンテナンスはタスクを `lost` としてマークできます。オフライン CLI 監査は永続履歴から復旧できますが、自身の空のインプロセス active-job セットを、Gateway 所有の cron 実行がなくなった証拠としては扱いません。
</Note>

## スケジュール種別

| 種別    | CLI フラグ | 説明                                                    |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | ワンショットのタイムスタンプ（ISO 8601、または `20m` のような相対指定） |
| `every` | `--every` | 固定間隔                                                |
| `cron`  | `--cron`  | 任意の `--tz` を伴う 5 フィールドまたは 6 フィールドの cron 式 |

タイムゾーンのないタイムスタンプは UTC として扱われます。ローカルの壁時計時刻でスケジュールするには `--tz America/New_York` を追加してください。

毎時 0 分の繰り返し式は、負荷スパイクを減らすため最大 5 分まで自動的に分散されます。正確なタイミングを強制するには `--exact` を使用し、明示的なウィンドウには `--stagger 30s` を使用してください。

### 日付と曜日は OR ロジックを使用する

Cron 式は [croner](https://github.com/Hexagon/croner) によって解析されます。日付フィールドと曜日フィールドの両方がワイルドカードでない場合、croner は **どちらか** のフィールドが一致したときに一致とします。両方ではありません。これは標準的な Vixie cron の動作です。

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

これは月に 0〜1 回ではなく、約 5〜6 回発火します。OpenClaw はここで Croner のデフォルト OR 動作を使用します。両方の条件を必須にするには、Croner の `+` 曜日修飾子（`0 9 15 * +1`）を使用するか、一方のフィールドでスケジュールし、もう一方をジョブのプロンプトまたはコマンドでガードしてください。

## 実行スタイル

| スタイル        | `--session` 値      | 実行場所                 | 最適な用途                         |
| --------------- | ------------------- | ------------------------ | ---------------------------------- |
| メインセッション | `main`              | 専用 cron wake レーン    | リマインダー、システムイベント     |
| 分離            | `isolated`          | 専用 `cron:<jobId>`      | レポート、バックグラウンド作業     |
| 現在のセッション | `current`           | 作成時にバインド         | コンテキスト対応の繰り返し作業     |
| カスタムセッション | `session:custom-id` | 永続的な名前付きセッション | 履歴を土台にするワークフロー       |

<AccordionGroup>
  <Accordion title="Main session vs isolated vs custom">
    **メインセッション** ジョブは、システムイベントを cron 所有の実行レーンへキューに入れ、任意で Heartbeat（`--wake now` または `--wake next-heartbeat`）を起動します。返信には対象メインセッションの最後の配信コンテキストを使用できますが、通常の cron ターンを人間のチャットレーンに追加せず、対象セッションの日次/アイドルリセット鮮度も延長しません。**分離** ジョブは、新しいセッションで専用エージェントターンを実行します。**カスタムセッション**（`session:xxx`）は実行間でコンテキストを永続化し、以前の要約を土台にする日次スタンドアップのようなワークフローを可能にします。

    メインセッションの cron イベントは、自己完結したシステムイベントのリマインダーです。デフォルト Heartbeat プロンプトの「Read HEARTBEAT.md」指示は自動的には含まれません。繰り返しリマインダーで `HEARTBEAT.md` を参照する必要がある場合は、cron イベント本文またはエージェント自身の指示で明示してください。

  </Accordion>
  <Accordion title="What 'fresh session' means for isolated jobs">
    分離ジョブにおける「新しいセッション」とは、実行ごとに新しいトランスクリプト/セッション ID を使うことを意味します。OpenClaw は、thinking/fast/verbose 設定、ラベル、明示的にユーザーが選択したモデル/認証オーバーライドなどの安全な設定を持ち越す場合がありますが、古い cron 行から周囲の会話コンテキストは継承しません。つまり、チャネル/グループルーティング、送信またはキューポリシー、昇格、送信元、ACP ランタイムバインディングは継承されません。繰り返しジョブが同じ会話コンテキストを意図的に土台にする必要がある場合は、`current` または `session:<id>` を使用してください。
  </Accordion>
  <Accordion title="Runtime cleanup">
    分離ジョブでは、ランタイムのティアダウンに、その cron セッション用のベストエフォートのブラウザークリーンアップが含まれるようになりました。クリーンアップ失敗は無視されるため、実際の cron 結果が引き続き優先されます。

    分離 cron 実行は、共有ランタイムクリーンアップパスを通じて、ジョブ用に作成されたバンドル MCP ランタイムインスタンスもすべて破棄します。これはメインセッションおよびカスタムセッションの MCP クライアントのティアダウン方法と一致するため、分離 cron ジョブが実行間で stdio 子プロセスや長命の MCP 接続をリークしません。

  </Accordion>
  <Accordion title="Subagent and Discord delivery">
    分離 cron 実行がサブエージェントをオーケストレーションする場合、配信も古い親の暫定テキストより最終的な子孫出力を優先します。子孫がまだ実行中の場合、OpenClaw はその部分的な親更新を告知せず抑制します。

    テキストのみの Discord 告知ターゲットでは、OpenClaw はストリーミング/中間テキストペイロードと最終回答の両方を再生するのではなく、正規の最終アシスタントテキストを 1 回送信します。メディアおよび構造化された Discord ペイロードは、添付ファイルやコンポーネントが落ちないよう、引き続き個別のペイロードとして配信されます。

  </Accordion>
</AccordionGroup>

### コマンドペイロード

モデルバックの分離エージェントターンを開始せずに Gateway スケジューラー内部で実行する必要がある決定論的スクリプトには、コマンドペイロードを使用します。コマンドジョブは Gateway ホスト上で実行され、stdout/stderr をキャプチャし、実行を cron 履歴に記録し、分離ジョブと同じ `announce`、`webhook`、`none` 配信モードを再利用します。

<Note>
コマンド cron は、エージェントの `tools.exec` 呼び出しではなく、オペレーター管理者向けの Gateway 自動化サーフェスです。cron ジョブを作成、更新、削除、または手動実行するには `operator.admin` が必要です。スケジュール済みコマンド実行は後で、その管理者が作成した自動化として Gateway プロセス内で実行されます。`tools.exec.mode`、承認プロンプト、エージェントごとのツール許可リストなどのエージェント exec ポリシーは、モデルに見える exec ツールを管理するものであり、コマンド cron ペイロードを管理するものではありません。
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

stdout が空でない場合、そのテキストが配信結果です。stdout が空で、stderr が空でない場合は、stderr が配信されます。両方のストリームが存在する場合、Cron は小さな `stdout:` / `stderr:` ブロックを配信します。終了コード 0 は実行を `ok` として記録します。0 以外の終了、シグナル、タイムアウト、または出力なしタイムアウトは `error` を記録し、失敗アラートをトリガーできます。`NO_REPLY` だけを出力するコマンドは、通常の Cron サイレントトークン抑制を使用し、チャットには何も投稿しません。

### 隔離ジョブのペイロードオプション

<ParamField path="--message" type="string" required>
  プロンプトテキスト（隔離には必須）。
</ParamField>
<ParamField path="--model" type="string">
  モデルの上書き。ジョブに対して選択された許可済みモデルを使用します。
</ParamField>
<ParamField path="--fallbacks" type="string">
  ジョブごとのフォールバックモデルリスト。例: `--fallbacks openrouter/gpt-4.1-mini,openai/gpt-5`。フォールバックなしの厳密な実行には `--fallbacks ""` を渡します。
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  `cron edit` で、ジョブごとのフォールバック上書きを削除し、ジョブが設定済みのフォールバック優先順位に従うようにします。`--fallbacks` と組み合わせることはできません。
</ParamField>
<ParamField path="--clear-model" type="boolean">
  `cron edit` で、ジョブごとのモデル上書きを削除し、ジョブが通常の Cron モデル選択優先順位（保存済みの Cron セッション上書きが設定されていればそれ、なければエージェント/デフォルトモデル）に従うようにします。`--model` と組み合わせることはできません。
</ParamField>
<ParamField path="--thinking" type="string">
  思考レベルの上書き。
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  `cron edit` で、ジョブごとの思考上書きを削除し、ジョブが通常の Cron 思考優先順位に従うようにします。`--thinking` と組み合わせることはできません。
</ParamField>
<ParamField path="--light-context" type="boolean">
  ワークスペースのブートストラップファイル注入をスキップします。
</ParamField>
<ParamField path="--tools" type="string">
  ジョブが使用できるツールを制限します。例: `--tools exec,read`。
</ParamField>

`--model` は、そのジョブのプライマリモデルとして選択された許可済みモデルを使用します。これはチャットセッションの `/model` 上書きとは同じではありません。ジョブのプライマリが失敗した場合も、設定済みのフォールバックチェーンが適用されます。要求されたモデルが許可されていない、または解決できない場合、Cron はジョブのエージェント/デフォルトモデル選択へ黙ってフォールバックする代わりに、明示的な検証エラーで実行を失敗させます。

Cron ジョブは、ペイロードレベルの `fallbacks` も保持できます。存在する場合、そのリストはジョブの設定済みフォールバックチェーンを置き換えます。選択されたモデルだけを試す厳密な Cron 実行にしたい場合は、ジョブペイロード/API で `fallbacks: []` を使用します。ジョブに `--model` があり、ペイロードにも設定にもフォールバックがない場合、OpenClaw は明示的な空のフォールバック上書きを渡すため、エージェントのプライマリが隠れた追加リトライ対象として追加されることはありません。

ローカルプロバイダーのプリフライトチェックは、Cron 実行を `skipped` とマークする前に、設定済みフォールバックをたどります。`fallbacks: []` はそのプリフライトパスを厳密に保ちます。

隔離ジョブのモデル選択優先順位は次のとおりです。

1. Gmail フックのモデル上書き（実行が Gmail 由来で、その上書きが許可されている場合）
2. ジョブごとのペイロード `model`
3. ユーザーが選択した保存済み Cron セッションモデル上書き
4. エージェント/デフォルトモデル選択

高速モードも解決済みのライブ選択に従います。選択されたモデル設定に `params.fastMode` がある場合、隔離 Cron はデフォルトでそれを使用します。保存済みセッションの `fastMode` 上書きは、どちらの方向でも設定より優先されます。自動モードは、存在する場合は選択されたモデルの `params.fastAutoOnSeconds` カットオフを使用し、デフォルトは 60 秒です。

隔離実行でライブモデル切り替えの引き継ぎが発生した場合、Cron は切り替え後のプロバイダー/モデルでリトライし、リトライ前にそのライブ選択をアクティブな実行に永続化します。切り替えが新しい認証プロファイルも伴う場合、Cron はその認証プロファイル上書きもアクティブな実行に永続化します。リトライには上限があります。初回試行に加えて 2 回の切り替えリトライ後、Cron は無限ループせずに中止します。

隔離 Cron 実行がエージェントランナーに入る前に、OpenClaw は `api: "ollama"` および `api: "openai-completions"` が設定されたプロバイダーのうち、`baseUrl` が local loopback、プライベートネットワーク、または `.local` の到達可能なローカルプロバイダーエンドポイントを確認します。そのエンドポイントがダウンしている場合、モデル呼び出しを開始する代わりに、実行は明確なプロバイダー/モデルエラー付きで `skipped` として記録されます。エンドポイント結果は 5 分間キャッシュされるため、同じ停止中のローカル Ollama、vLLM、SGLang、または LM Studio サーバーを使用する多数の期限到来ジョブは、リクエストの嵐を作る代わりに 1 つの小さなプローブを共有します。プロバイダープリフライトでスキップされた実行は、実行エラーのバックオフを増やしません。繰り返しのスキップ通知が必要な場合は、`failureAlert.includeSkipped` を有効にします。

## 配信と出力

| モード       | 動作                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | エージェントが送信しなかった場合、最終テキストをターゲットへフォールバック配信 |
| `webhook`  | 完了イベントペイロードを URL に POST                                |
| `none`     | ランナーのフォールバック配信なし                                         |

チャンネル配信には `--announce --channel telegram --to "-1001234567890"` を使用します。Telegram フォーラムトピックには `-1001234567890:topic:123` を使用します。OpenClaw は Telegram 所有の短縮形 `-1001234567890:123` も受け付けます。直接 RPC/設定呼び出し元は、`delivery.threadId` を文字列または数値として渡せます。Slack/Discord/Mattermost のターゲットは、明示的なプレフィックス（`channel:<id>`、`user:<id>`）を使用してください。Matrix のルーム ID は大文字小文字を区別します。正確なルーム ID、または Matrix の `room:!room:server` 形式を使用してください。

announce 配信で `channel: "last"` を使用する、または `channel` を省略する場合、`telegram:123` のようなプロバイダープレフィックス付きターゲットは、Cron がセッション履歴または単一の設定済みチャンネルへフォールバックする前にチャンネルを選択できます。読み込まれた Plugin が通知するプレフィックスだけがプロバイダーセレクターです。`delivery.channel` が明示されている場合、ターゲットプレフィックスは同じプロバイダー名でなければなりません。たとえば、`channel: "whatsapp"` と `to: "telegram:123"` の組み合わせは、WhatsApp に Telegram ID を電話番号として解釈させる代わりに拒否されます。`channel:<id>`、`user:<id>`、`imessage:<handle>`、`sms:<number>` のようなターゲット種別およびサービスプレフィックスは、プロバイダーセレクターではなく、チャンネル所有のターゲット構文のままです。

隔離ジョブでは、チャット配信は共有されます。チャットルートが利用可能な場合、ジョブが `--no-deliver` を使用していても、エージェントは `message` ツールを使用できます。エージェントが設定済み/現在のターゲットに送信した場合、OpenClaw はフォールバック announce をスキップします。それ以外の場合、`announce`、`webhook`、`none` は、エージェントターン後の最終返信をランナーがどう扱うかだけを制御します。

エージェントがアクティブなチャットから隔離リマインダーを作成する場合、OpenClaw はフォールバック announce ルート用に保持されたライブ配信ターゲットを保存します。内部セッションキーは小文字の場合がありますが、現在のチャットコンテキストが利用可能なとき、プロバイダー配信ターゲットはそれらのキーから再構築されません。

暗黙の announce 配信は、設定済みチャンネル許可リストを使用して古いターゲットを検証し、再ルーティングします。DM ペアリングストア承認はフォールバック自動化の受信者ではありません。スケジュール済みジョブが DM に能動的に送信する必要がある場合は、`delivery.to` を設定するか、チャンネルの `allowFrom` エントリを設定してください。

## 出力言語

Cron ジョブは、チャンネル、ロケール、または以前の
メッセージから返信言語を推測しません。言語ルールをスケジュール済みメッセージまたはテンプレートに入れてください。

```bash
openclaw cron edit <jobId> \
  --message "Summarize the updates. Respond in Chinese; keep URLs, code, and product names unchanged."
```

テンプレートファイルでは、レンダリングされたプロンプト内に言語指示を保持し、
ジョブ実行前に `{{language}}` などのプレースホルダーが埋まっていることを確認してください。
出力に複数の言語が混在する場合は、ルールを明示してください。例: 「叙述文には中国語を使用し、技術用語は英語のままにします。」

失敗通知は別の宛先パスに従います。

- `cron.failureDestination` は失敗通知のグローバルデフォルトを設定します。
- `job.delivery.failureDestination` はジョブごとにそれを上書きします。
- どちらも設定されておらず、ジョブがすでに `announce` で配信している場合、失敗通知はそのプライマリ announce ターゲットへフォールバックするようになりました。
- `delivery.failureDestination` は、プライマリ配信モードが `webhook` でない限り、`sessionTarget="isolated"` ジョブでのみサポートされます。
- `failureAlert.includeSkipped: true` は、ジョブまたはグローバル Cron アラートポリシーを繰り返しスキップ実行アラートの対象にします。スキップされた実行は別個の連続スキップカウンターを保持するため、実行エラーのバックオフには影響しません。

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
    メインセッション用のシステムイベントをキューに入れます。

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
    隔離エージェントターンを実行します。

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    フィールド: `message`（必須）、`name`、`agentId`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`fallbacks`、`thinking`、`timeoutSeconds`。

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    カスタムフック名は設定内の `hooks.mappings` によって解決されます。マッピングは任意のペイロードを、テンプレートまたはコード変換を使って `wake` または `agent` アクションに変換できます。
  </Accordion>
</AccordionGroup>

<Warning>
フックエンドポイントは、local loopback、tailnet、または信頼済みリバースプロキシの背後に置いてください。

- 専用のフックトークンを使用し、gateway 認証トークンを再利用しないでください。
- `hooks.path` は専用のサブパスに保ってください。`/` は拒否されます。
- `hooks.allowedAgentIds` を設定して、フックが対象にできる有効なエージェントを制限します。`agentId` が省略された場合のデフォルトエージェントも含まれます。
- 呼び出し元がセッションを選択する必要がない限り、`hooks.allowRequestSessionKey=false` のままにしてください。
- `hooks.allowRequestSessionKey` を有効にする場合は、許可するセッションキーの形を制約するために `hooks.allowedSessionKeyPrefixes` も設定してください。
- フックペイロードはデフォルトで安全境界によってラップされます。

</Warning>

## Gmail PubSub 統合

Google PubSub 経由で Gmail 受信トリガーを OpenClaw に接続します。

<Note>
**前提条件:** `gcloud` CLI、`gog` (gogcli)、OpenClaw フックの有効化、公開 HTTPS エンドポイント用の Tailscale。
</Note>

### ウィザードセットアップ（推奨）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

これにより `hooks.gmail` 設定が書き込まれ、Gmail プリセットが有効化され、プッシュエンドポイントに Tailscale Funnel が使用されます。

### Gateway 自動起動

`hooks.enabled=true` かつ `hooks.gmail.account` が設定されている場合、Gateway は起動時に `gog gmail watch serve` を開始し、watch を自動更新します。オプトアウトするには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定します。

### 手動のワンタイムセットアップ

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

`openclaw cron run <jobId>` は手動実行をキューに入れた後に戻ります。キューに入った実行が完了するまでブロックする必要があるシャットダウンフック、メンテナンススクリプト、その他の自動化では `--wait` を使用してください。待機モードは、返された正確な `runId` をポーリングします。ステータス `ok` では `0` で終了し、`error`、`skipped`、または待機タイムアウトでは非ゼロで終了します。

エージェントの `cron` ツールは、`cron(action: "list")` からコンパクトなジョブサマリー（`id`、`name`、`enabled`、`nextRunAtMs`、`scheduleKind`、`lastRunStatus`）を返します。完全なジョブ定義を1件取得するには `cron(action: "get", jobId: "...")` を使用してください。直接 Gateway を呼び出す側は `cron.list` に `compact: true` を渡せます。省略すると、配信プレビューを含む既存の完全なレスポンスが維持されます。

`openclaw cron create` は `openclaw cron add` のエイリアスです。新しいジョブでは、位置引数のスケジュール（`"0 9 * * 1"`、`"every 1h"`、`"20m"`、または ISO タイムスタンプ）に続けて、位置引数のエージェントプロンプトを使用できます。完了した実行ペイロードを HTTP エンドポイントへ POST するには、`cron add|create` または `cron edit` で `--webhook <url>` を使用してください。Webhook 配信は、`--announce`、`--channel`、`--to`、`--thread-id`、`--account` などのチャット配信フラグと組み合わせることはできません。`cron edit` では、`--clear-channel`、`--clear-to`、`--clear-thread-id`、`--clear-account` がそれぞれ対応するルーティングフィールドを個別に解除します（各フラグは対応する設定フラグとの併用時に拒否されます）。これは、`--no-deliver` がランナーのフォールバック配信を無効にすることとは別です。

<Note>
モデルオーバーライドに関する注記:

- `openclaw cron add|edit --model ...` はジョブで選択されたモデルを変更します。
- モデルが許可されている場合、その正確なプロバイダー/モデルが isolated エージェント実行に到達します。
- 許可されていない、または解決できない場合、Cron は明示的な検証エラーで実行を失敗させます。
- API `cron.update` のペイロードパッチでは、保存済みジョブのモデルオーバーライドをクリアするために `model: null` を設定できます。
- `openclaw cron edit <job-id> --clear-model` は CLI からそのオーバーライドをクリアし（`model: null` パッチと同じ効果）、`--model` と組み合わせることはできません。
- 設定済みのフォールバックチェーンは引き続き適用されます。Cron の `--model` はジョブのプライマリであり、セッションの `/model` オーバーライドではないためです。
- `openclaw cron add|edit --fallbacks ...` はペイロード `fallbacks` を設定し、そのジョブの設定済みフォールバックを置き換えます。`--fallbacks ""` はフォールバックを無効化し、実行を厳格にします。`openclaw cron edit <job-id> --clear-fallbacks` はジョブ単位のオーバーライドをクリアします。
- 明示的または設定済みのフォールバックリストがない単純な `--model` は、暗黙の追加リトライ対象としてエージェントのプライマリへフォールスルーしません。

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

`maxConcurrentRuns` は、スケジュールされた Cron ディスパッチと isolated エージェントターン実行の両方を制限し、デフォルトは 8 です。isolated Cron エージェントターンは内部的にキュー専用の `cron-nested` 実行レーンを使用するため、この値を上げると、外側の Cron ラッパーだけを開始するのではなく、独立した Cron LLM 実行を並列に進められます。共有の非 Cron `nested` レーンは、この設定によって拡張されません。

`cron.store` は論理ストアキーであり、レガシー doctor インポートパスです。既存の JSON ストアを SQLite にインポートしてアーカイブするには、`openclaw doctor --fix` を実行してください。今後の Cron 変更は CLI または Gateway API 経由で行う必要があります。

Cron を無効化するには、`cron.enabled: false` または `OPENCLAW_SKIP_CRON=1` を使用します。

<AccordionGroup>
  <Accordion title="Retry behavior">
    **ワンショットリトライ**: 一時的なエラー（レート制限、過負荷、ネットワーク、サーバーエラー）は、指数バックオフで最大3回リトライされます。永続的なエラーは即座に無効化されます。

    **定期リトライ**: リトライ間に指数バックオフ（30秒から60分）が入ります。次回の成功実行後にバックオフはリセットされます。

  </Accordion>
  <Accordion title="Maintenance">
    `cron.sessionRetention`（デフォルト `24h`）は isolated 実行セッションエントリを刈り込みます。`cron.runLog.keepLines` はジョブごとに保持される SQLite 実行履歴行を制限します。`maxBytes` は古いファイルベースの実行ログとの設定互換性のために保持されています。
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
    - `cron` スケジュールでは、タイムゾーン（`--tz`）とホストのタイムゾーンを照合してください。
    - 実行出力の `reason: not-due` は、手動実行が `openclaw cron run <jobId> --due` で確認され、ジョブの期限がまだ来ていなかったことを意味します。

  </Accordion>
  <Accordion title="Cron fired but no delivery">
    - 配信モード `none` は、ランナーのフォールバック送信が想定されていないことを意味します。チャットルートが利用可能な場合、エージェントは引き続き `message` ツールで直接送信できます。
    - 配信先が欠落または無効（`channel`/`to`）な場合、アウトバウンドはスキップされます。
    - Matrix では、小文字化された `delivery.to` ルーム ID を持つコピー済みジョブやレガシージョブが失敗することがあります。Matrix ルーム ID は大文字と小文字を区別するためです。Matrix から取得した正確な `!room:server` または `room:!room:server` の値にジョブを編集してください。
    - チャンネル認証エラー（`unauthorized`、`Forbidden`）は、認証情報によって配信がブロックされたことを意味します。
    - isolated 実行がサイレントトークン（`NO_REPLY` / `no_reply`）のみを返す場合、OpenClaw は直接アウトバウンド配信を抑制し、フォールバックのキュー済みサマリーパスも抑制するため、チャットには何も投稿されません。
    - エージェント自身がユーザーにメッセージを送る必要がある場合は、ジョブに使用可能なルート（以前のチャットがある `channel: "last"`、または明示的なチャンネル/ターゲット）があることを確認してください。

  </Accordion>
  <Accordion title="Cron or heartbeat appears to prevent /new-style rollover">
    - 日次リセットとアイドルリセットの鮮度は `updatedAt` に基づきません。[セッション管理](/ja-JP/concepts/session#session-lifecycle) を参照してください。
    - Cron のウェイクアップ、Heartbeat 実行、exec 通知、gateway のブックキーピングは、ルーティング/ステータス用にセッション行を更新する場合がありますが、`sessionStartedAt` や `lastInteractionAt` は延長しません。
    - これらのフィールドが存在する前に作成されたレガシー行については、ファイルがまだ利用可能な場合、OpenClaw は transcript JSONL のセッションヘッダーから `sessionStartedAt` を復元できます。`lastInteractionAt` がないレガシーのアイドル行は、復元された開始時刻をアイドル基準として使用します。

  </Accordion>
  <Accordion title="Timezone gotchas">
    - `--tz` のない Cron は gateway ホストのタイムゾーンを使用します。
    - タイムゾーンのない `at` スケジュールは UTC として扱われます。
    - Heartbeat の `activeHours` は設定済みのタイムゾーン解決を使用します。

  </Accordion>
</AccordionGroup>

## 関連

- [自動化](/ja-JP/automation) — すべての自動化メカニズムの概要
- [バックグラウンドタスク](/ja-JP/automation/tasks) — Cron 実行のタスク台帳
- [Heartbeat](/ja-JP/gateway/heartbeat) — 定期的なメインセッションターン
- [タイムゾーン](/ja-JP/concepts/timezone) — タイムゾーン設定

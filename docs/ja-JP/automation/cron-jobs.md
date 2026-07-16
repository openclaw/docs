---
read_when:
    - バックグラウンドジョブまたはウェイクアップのスケジュール設定
    - 外部トリガー（Webhook、Gmail）をOpenClawに接続する
    - スケジュールされたタスクでHeartbeatとCronのどちらを使用するかの判断
sidebarTitle: Scheduled tasks
summary: Gateway スケジューラー向けのスケジュール済みジョブ、Webhook、Gmail PubSub トリガー
title: スケジュールされたタスク
x-i18n:
    generated_at: "2026-07-16T11:21:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9a419d4376fa08df1c429c167ead6918262cc34b986a85ffec024023f6da1eef
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron は Gateway に組み込まれたスケジューラです。ジョブを永続化し、適切な時刻にエージェントを起動して、出力をチャットチャンネルや Webhook に配信することも、どこにも配信しないこともできます。

## クイックスタート

<Steps>
  <Step title="1 回限りのリマインダーを追加">
    ```bash
    openclaw cron create "2027-02-01T16:00:00Z" \
      --name "リマインダー" \
      --session main \
      --system-event "リマインダー: cron ドキュメントの下書きを確認" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="ジョブを確認">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="実行履歴を表示">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## cron の仕組み

- Cron はモデル内ではなく、**Gateway プロセス内**で実行されます。スケジュールを発火させるには Gateway が稼働している必要があります。
- ジョブ定義、ランタイム状態、実行履歴は OpenClaw の共有 SQLite 状態データベースに永続化されるため、再起動してもスケジュールは失われません。
- cron を実行するたびに、[バックグラウンドタスク](/ja-JP/automation/tasks)レコードが作成されます。
- 1 回限りのジョブ（`--at`）は、デフォルトでは成功後に自動削除されます。保持するには `--keep-after-run` を渡します。
- 実行ごとの実時間予算: 設定されている場合は `--timeout-seconds`。それ以外の場合、分離／デタッチされたエージェントターンジョブには、基盤となるエージェントターンのタイムアウト（`agents.defaults.timeoutSeconds`、デフォルト 48 時間）が適用される前に、cron 独自の 60 分間のウォッチドッグ制限が適用されます。コマンドジョブのデフォルトは 10 分です。
- Gateway の起動時、期限を過ぎた分離エージェントターンジョブは即座に再実行されるのではなく、再スケジュールされます。これにより、モデル／ツールのブートストラップ処理がチャンネル接続期間外に保たれます。
- システム cron または別の外部スケジューラから `openclaw agent` を実行する場合、CLI がすでに `SIGTERM`/`SIGINT` を処理していても、ハードキルへのエスカレーションでラップしてください。Gateway を介した実行では、受理済みの実行を中止するよう Gateway に要求します。ローカル実行および埋め込みフォールバック実行にも同じ中止シグナルが送られます。GNU `timeout` では、単純な `timeout 600 ...` よりも `timeout -k 60 600 openclaw agent ...` を推奨します。`-k` の値は、プロセスが時間内に終了処理を完了できない場合の最後の安全策です。systemd ユニットでは、最終的な強制終了の前に猶予期間（`TimeoutStopSec`）を設けた `SIGTERM` 停止シグナルを使用します。元の Gateway 実行がまだアクティブな間に `--run-id` を再利用すると、2 回目の実行を開始する代わりに、重複が実行中として報告されます。

<AccordionGroup>
  <Accordion title="分離実行の強化">
    - 分離実行は、完了時にその `cron:<jobId>` セッションで追跡されているブラウザータブ／プロセスをベストエフォートで閉じ、ジョブ用に作成されたバンドル MCP ランタイムインスタンスを、メインセッションおよびカスタムセッションの実行で使用されるものと同じ共有終了処理パスを通じて破棄します。クリーンアップの失敗は無視されるため、cron の結果が引き続き優先されます。
    - 限定的な cron 自己クリーンアップ権限を持つ分離実行は、スケジューラの状態、自身のジョブのみを含む自己フィルタリング済みリスト、そのジョブの実行履歴を読み取ることができ、自身のジョブのみを削除できます。
    - 分離実行では、古い確認応答が返されないよう保護されます。最初の結果が中間状態の更新（`on it`、`pulling everything together`、および同様のヒント）のみで、最終回答を担当する子孫サブエージェントが残っていない場合、OpenClaw は配信前に実際の結果を求めて 1 回だけ再プロンプトします。
    - 構造化された実行拒否メタデータ（ネストされたエラーが `SYSTEM_RUN_DENIED` または `INVALID_REQUEST` で始まる Node ホストの `UNAVAILABLE` ラッパーを含む）が認識されるため、ブロックされたコマンドが成功した実行として報告されることはありません。一方、通常のアシスタントの文章が拒否と誤認されることもありません。
    - 実行レベルのエージェント障害は、応答ペイロードがない場合でもジョブエラーとしてカウントされます。そのため、モデル／プロバイダーの障害はエラーカウンターを増加させ、ジョブを成功としてクリアする代わりに失敗通知をトリガーします。
    - ジョブが `timeoutSeconds` に達すると、cron は実行を中止し、短いクリーンアップ期間を設けます。その期間内に終了処理が完了しない場合、Gateway が所有するクリーンアップ処理によって、その実行のセッション所有権が強制的にクリアされてから、cron がタイムアウトを記録します。これにより、キューに入ったチャット処理が古い処理セッションの後ろで停止することを防ぎます。
    - セットアップ／起動時の停止には、フェーズ固有のタイムアウト（たとえば `cron: isolated agent setup timed out before runner start` または `cron: isolated agent run stalled before execution start (last phase: context-engine)`）が適用されます。これらのウォッチドッグは、外部 CLI プロセスが起動する前から、埋め込みプロバイダーと CLI ベースのプロバイダーの両方を対象とします。また、長い `timeoutSeconds` 値とは独立して上限が設定されるため、コールドスタート／認証／コンテキストの障害が迅速に表面化します。

  </Accordion>
  <Accordion title="タスクの照合">
    Cron タスクの照合では、第一にランタイムの所有状態、第二に永続化された履歴が使用されます。古い子セッション行がまだ存在していても、cron ランタイムがそのジョブを実行中として追跡している間は、アクティブな cron タスクは稼働状態を維持します。ランタイムがジョブの所有を停止し、5 分間の猶予期間が経過すると、保守処理は対応する `cron:<jobId>:<startedAt>` 実行について、永続化された実行ログとジョブ状態を確認します。そこに終了結果があればタスク台帳を確定し、なければ Gateway が所有する保守処理によってタスクを `lost` としてマークできます。オフライン CLI 監査では永続化された履歴から復旧できますが、それ自体の空のプロセス内アクティブジョブセットは、Gateway が所有する実行が消失したことの証明にはなりません。
  </Accordion>
</AccordionGroup>

## スケジュールの種類

| 種類      | CLI フラグ    | 説明                                                                                              |
| --------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| `at`      | `--at`      | 1 回限りのタイムスタンプ（ISO 8601、または `20m` のような相対指定）                                                     |
| `every`   | `--every`   | 固定間隔（`10m`、`1h`、`1d`）                                                                       |
| `cron`    | `--cron`    | オプションの `--tz` を伴う 5 フィールドまたは 6 フィールドの cron 式                                                  |
| `on-exit` | `--on-exit` | 監視対象のコマンドが終了したときに 1 回発火（イベントトリガー。ターン終了後も存続。オプションの `--on-exit-cwd`） |

タイムゾーンのないタイムスタンプは UTC として扱われます。オフセットのない `--at` 日時をその IANA タイムゾーンとして解釈する場合、または cron 式をそのタイムゾーンで評価する場合は、`--tz America/New_York` を追加します。`--tz` のない cron 式では、Gateway ホストのタイムゾーンが使用されます。`--tz` は `--every` または `--on-exit` と併用できません。

毎時 0 分に繰り返す式（分フィールドが `0` で、時フィールドがワイルドカード）は、負荷の急増を抑えるため、最大 5 分まで自動的にずらされます。正確なタイミングを強制するには `--exact` を使用し、明示的な時間枠を指定するには `--stagger 30s` を使用します（cron スケジュールのみ）。

### 日と曜日には OR ロジックが使用される

Cron 式は [croner](https://github.com/Hexagon/croner) によって解析されます。日フィールドと曜日フィールドの両方がワイルドカードでない場合、croner は両方ではなく、**いずれか一方**のフィールドが一致したときに一致と判断します。これは標準的な Vixie cron の動作です。

```bash
# 意図: 「15 日が月曜日の場合に限り、午前 9 時」
# 実際: 「毎月 15 日の午前 9 時、かつ毎週月曜日の午前 9 時」
0 9 15 * 1
```

この場合、月に 0～1 回ではなく、およそ 5～6 回発火します。両方の条件を必須にするには、croner の `+` 曜日修飾子（`0 9 15 * +1`）を使用するか、一方のフィールドでスケジュールし、ジョブのプロンプトまたはコマンド内でもう一方をチェックします。

## イベントトリガー（条件ウォッチャー）

イベントトリガーは、`every` または `cron` スケジュールにヘッドレス条件スクリプトを追加します。Cron はジョブの実行時刻になるとスクリプトを評価し、スクリプトが `fire: true` を返した場合にのみ通常のペイロードを実行します。

```json5
{
  schedule: { kind: "every", everyMs: 30000 },
  trigger: {
    // 観測された状態が前回の評価と異なる場合にのみ発火します。
    script: "const res = await tools.call('exec', { command: 'gh pr checks 123 --json state -q \\'.[].state\\' | sort -u' }); const status = String(res?.result?.details?.aggregated ?? '').trim(); json({ fire: status !== trigger.state?.status, message: `PR 123 CI: ${trigger.state?.status ?? 'unknown'} -> ${status}`, state: { status } });",
    once: false,
  },
  payload: { kind: "agentTurn", message: "CI 状態の変化を調査してください。" },
}
```

スクリプトは `{ fire, message?, state? }` を返す必要があります。以前の JSON 状態は、深く凍結された `trigger.state` として利用できます。永続化するには、新しい `state` 値を返します。状態の上限は 16 KB です。発火結果に `message` が含まれる場合、cron は実行前にそれをシステムイベントのテキストまたはエージェントターンのメッセージへ追加します。`once: true` は、最初に発火したペイロードが正常に完了した後、ジョブを無効にします。

`fire: false` は評価状態とカウンターを永続化してから、実行履歴を作成せずに再スケジュールします。発火したペイロードの実行が失敗した場合、返された `state` は永続化**されません**。次の評価では以前の状態が参照され、再び発火できるため、スクリプトは読み取り専用のチェックとして記述し、アクションはペイロードに含めてください。トリガースケジュールには設定可能な最小間隔があります（デフォルトは 30 秒）。各評価には 30 秒の実時間予算と、最大 5 回のツール呼び出しが割り当てられます。

<Warning>
`cron.triggers.enabled` を有効にすると、エージェントが作成したスクリプトを、所有エージェントの **`exec` を含む完全なツールポリシー**でヘッドレス実行できます。これは、そのエージェントの権限による無人コード実行として扱ってください。cron ジョブの作成を許可されたすべてのエージェントが相応に信頼できる場合を除き、無効のままにしてください。
</Warning>

ローカルスクリプトファイルからウォッチャーを作成します（`-` は標準入力からスクリプトを読み取ります）。

```bash
openclaw cron add \
  --name "PR CI ウォッチャー" \
  --every 30s \
  --trigger-script ./watch-pr-ci.js \
  --message "CI 状態の変化に対応してください" \
  --session isolated
```

## ペイロード

各ジョブは、フラグで選択されたペイロードの種類を正確に 1 つ持ちます。

| ペイロード       | フラグ                                           | 実行内容                                                    |
| ------------- | ---------------------------------------------- | ------------------------------------------------------- |
| システムイベント  | `--system-event <text>`                        | メインセッションのキューに追加され、それ自体ではモデルを呼び出さない |
| エージェントメッセージ | `--message <text>`                             | モデルを使用するエージェントターン                               |
| コマンド       | `--command <shell>` または `--command-argv <json>` | Gateway ホスト上のシェル／プロセス。モデルは呼び出さない      |

### エージェントターンのオプション

<ParamField path="--message" type="string" required>
  プロンプトテキスト（分離／現在／カスタムセッションのジョブでは必須）。
</ParamField>
<ParamField path="--model" type="string">
  モデルのオーバーライド。許可されたモデルに解決される必要があり、解決されない場合は検証エラーで実行が失敗します。
</ParamField>
<ParamField path="--fallbacks" type="string">
  ジョブごとのフォールバックモデル一覧（例: `--fallbacks openai/gpt-5.6-sol,openrouter/meta-llama/llama-3.3-70b-instruct:free`）。フォールバックなしの厳格な実行には `--fallbacks ""` を渡します。
</ParamField>
<ParamField path="--clear-fallbacks" type="boolean">
  `cron edit` では、ジョブごとのフォールバックオーバーライドを削除し、設定されたフォールバックの優先順位に従うようにします。`--fallbacks` とは併用できません。
</ParamField>
<ParamField path="--clear-model" type="boolean">
  `cron edit` では、ジョブごとのモデルオーバーライドを削除し、通常の Cron モデル優先順位（保存された Cron セッションのオーバーライド、それがなければエージェント／デフォルトモデル）に従うようにします。`--model` とは併用できません。
</ParamField>
<ParamField path="--thinking" type="string">
  思考レベルのオーバーライド（`off|minimal|low|medium|high|xhigh|adaptive|max|ultra`）。利用可能なレベルは、選択したモデルとエージェントランタイムによって異なります。
</ParamField>
<ParamField path="--clear-thinking" type="boolean">
  `cron edit` では、ジョブごとの思考オーバーライドを削除します。`--thinking` とは併用できません。
</ParamField>
<ParamField path="--light-context" type="boolean">
  ワークスペースのブートストラップファイルの挿入をスキップします。
</ParamField>
<ParamField path="--tools" type="string">
  ジョブが使用できるツールを制限します（例: `--tools exec,read`）。
</ParamField>

`--model` はジョブのプライマリモデルを設定します。セッションの `/model` オーバーライドは置き換えないため、設定されたフォールバックチェーンは引き続きその上に適用されます。解決できない、または許可されていないモデルの場合、暗黙にデフォルトへフォールバックせず、明示的な検証エラーで実行が失敗します。ジョブに `--model` があり、明示的または設定済みのフォールバック一覧がない場合、OpenClaw はエージェントのプライマリを非表示の再試行先として暗黙に追加せず、空のフォールバックオーバーライドを渡します。

分離ジョブのモデル選択優先順位（高い順）:

1. ジョブごとのペイロード `model`（明示的な設定。許可されていないモデルの場合は実行が失敗）
2. Gmail フックのモデルオーバーライド（実行元が Gmail であり、そのオーバーライドが許可されている場合のみ）
3. ユーザーが選択して保存された Cron セッションのモデルオーバーライド
4. エージェント／デフォルトのモデル選択

高速モードは、解決されたライブ選択に従います。選択したモデル設定に `params.fastMode` がある場合、分離 Cron はそれをデフォルトで使用します。ただし、保存されたセッションの `fastMode` オーバーライド（次にエージェントの `fastModeDefault`）は、どちらの方向でもモデル設定より優先されます。自動モードはモデルの `params.fastAutoOnSeconds` カットオフを使用し、デフォルトは 60 秒です。

実行中にライブモデル切り替えの引き継ぎが発生した場合、Cron は切り替え後のプロバイダー／モデルで再試行し、その選択（および新しい認証プロファイルがあればそれも）をアクティブな実行に保持します。再試行回数には上限があります。最初の試行に加えて 2 回の切り替え再試行を行った後、Cron はループせずに中止します。

分離実行の開始前に、OpenClaw は、`baseUrl` が loopback、プライベートネットワーク、または `.local` である、設定済みの `api: "ollama"` および `api: "openai-completions"` プロバイダーについて、到達可能なローカルエンドポイントを確認します。この事前チェックはジョブに設定されたフォールバックチェーンをたどり、すべての候補に到達できない場合にのみ実行を `skipped` としてマークします。`--fallbacks ""` を指定すると、プライマリモデルだけを厳格に確認します。停止中のエンドポイントでは、モデル呼び出しを開始せず、明確なエラーとともに実行が `skipped` として記録されます。結果はジョブやモデルごとではなくエンドポイントごとに 5 分間キャッシュされるため、停止中の同じローカル Ollama/vLLM/SGLang/LM Studio サーバーを共有する多数の期限到来ジョブでも、リクエスト集中ではなく 1 回のプローブで済みます。事前チェックでスキップされた実行は、実行エラーのバックオフを増加させません。スキップ警告を繰り返し受け取るには `failureAlert.includeSkipped` を設定します。

### コマンドペイロード

コマンドペイロードは、モデルを使用するターンを開始せずに、Gateway スケジューラー内で決定的なスクリプトを実行します。Gateway ホスト上で実行され、stdout/stderr を取得し、Cron 履歴に実行を記録し、エージェントターンジョブと同じ `announce`、`webhook`、`none` の配信モードを再利用します。

<Note>
コマンド Cron は、オペレーター管理者向けの Gateway 自動化サーフェスであり、エージェントの `tools.exec` 呼び出しではありません。Cron ジョブの作成、更新、削除、または手動実行には `operator.admin` が必要です。スケジュールされたコマンド実行は、その後、管理者が作成した自動化として Gateway プロセス内で実行されます。エージェントの exec ポリシー（`tools.exec.mode`、承認プロンプト、エージェントごとのツール許可リスト）は、モデルから見える exec ツールを管理するものであり、コマンド Cron ペイロードを管理するものではありません。
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

`--command <shell>` は `argv: ["sh", "-lc", <shell>]` を保存します。シェル解析を行わずに argv を正確に実行するには `--command-argv '["node","scripts/report.mjs"]'` を使用します。任意の `--command-env KEY=VALUE`（繰り返し指定可能）、`--command-input`、`--timeout-seconds`（デフォルト 10 分）、`--no-output-timeout-seconds`、`--output-max-bytes` で、プロセス環境、stdin、出力上限を制御します。

配信されるテキストはプロセス出力から生成されます。空でない stdout が優先されます。stdout が空で stderr が空でない場合は、stderr が配信されます。両方が存在する場合、Cron は小さな `stdout:` / `stderr:` ブロックを送信します。終了コード `0` の場合、実行は `ok` として記録されます。ゼロ以外の終了、シグナル、タイムアウト、または無出力タイムアウトの場合は `error` として記録され、失敗警告が発生することがあります。`NO_REPLY` だけを出力するコマンドには、通常の Cron サイレントトークン抑制が適用され、チャットには何も投稿されません。

## 実行スタイル

| スタイル           | `--session` の値   | 実行場所                  | 最適な用途                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| メインセッション    | `main`              | 専用の Cron ウェイクレーン | リマインダー、システムイベント        |
| 分離        | `isolated`          | 専用の `cron:<jobId>` | レポート、バックグラウンド作業      |
| 現在のセッション | `current`           | 作成時にバインド   | コンテキストを考慮する定期作業    |
| カスタムセッション  | `session:custom-id` | 永続的な名前付きセッション | 履歴を積み上げるワークフロー |

<AccordionGroup>
  <Accordion title="メインセッション、分離、カスタムの違い">
    **メインセッション**ジョブは、Cron が所有する実行レーンにシステムイベントをキューへ追加し、必要に応じて Heartbeat（`--wake now` または `--wake next-heartbeat`）を起動します。返信には対象メインセッションの直近の配信コンテキストを使用できますが、通常の Cron ターンを人間とのチャットレーンに追加せず、対象セッションの日次／アイドルリセットの鮮度も延長しません。**分離**ジョブは、新しいセッションで専用のエージェントターンを実行します。**カスタムセッション**（`session:xxx`）は実行間でコンテキストを保持するため、以前の要約を積み上げる日次スタンドアップのようなワークフローを実現できます。

    メインセッションの Cron イベントは、自己完結型のシステムイベントリマインダーです。デフォルトの Heartbeat プロンプトにある「Read HEARTBEAT.md」という指示は自動的には含まれません。リマインダーで `HEARTBEAT.md` を参照させる場合は、Cron イベントのテキストにその旨を明示してください。

  </Accordion>
  <Accordion title="分離ジョブにおける「新しいセッション」の意味">
    実行ごとに新しいトランスクリプト／セッション ID が作成されます。OpenClaw は安全な設定（思考／高速／詳細設定、ラベル、ユーザーが明示的に選択したモデル／認証オーバーライド）を引き継ぎますが、古い Cron 行から周囲の会話コンテキストは継承しません。これには、チャンネル／グループのルーティング、送信またはキューポリシー、昇格、オリジン、ACP ランタイムのバインドが含まれます。定期ジョブで意図的に同じ会話コンテキストを積み上げる場合は、`current` または `session:<id>` を使用します。
  </Accordion>
  <Accordion title="サブエージェントと Discord への配信">
    分離 Cron 実行でサブエージェントをオーケストレーションする場合、古い親の中間テキストよりも、最終的な子孫の出力が配信で優先されます。子孫がまだ実行中の場合、OpenClaw はその親の部分的な更新を通知せずに抑制します。

    テキストのみの Discord 通知先に対して、OpenClaw はストリーミング／中間テキストと最終回答の両方を再送せず、正規の最終アシスタントテキストを 1 回だけ送信します。メディアおよび構造化された Discord ペイロードは引き続き個別に配信されるため、添付ファイルやコンポーネントは失われません。

  </Accordion>
</AccordionGroup>

## 配信と出力

| モード       | 動作                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | エージェントが送信しなかった場合、最終テキストを対象へフォールバック配信 |
| `webhook`  | 完了イベントのペイロードを URL に POST                                |
| `none`     | ランナーによるフォールバック配信なし                                         |

チャンネル配信には `--announce --channel telegram --to "-1001234567890"` を使用します。Telegram フォーラムのトピックでは `-1001234567890:topic:123` を使用します。OpenClaw は Telegram が所有する省略形 `-1001234567890:123` も受け付けます。RPC／設定を直接呼び出す側は、`delivery.threadId` を文字列または数値として渡せます。Slack/Discord/Mattermost の対象には、明示的なプレフィックス（`channel:<id>`、`user:<id>`）を使用します。Matrix のルーム ID は大文字と小文字を区別します。正確なルーム ID または Matrix の `room:!room:server` 形式を使用してください。

通知配信で `channel: "last"` を使用するか、`channel` を省略した場合、`telegram:123` のようなプロバイダープレフィックス付きの対象によってチャンネルを選択できます。その後、Cron はセッション履歴または設定された単一のチャンネルへフォールバックします。読み込まれた Plugin が公開するプレフィックスだけがプロバイダーセレクターになります。`delivery.channel` が明示されている場合、対象のプレフィックスは同じプロバイダーを指定する必要があります。WhatsApp が Telegram ID を電話番号として解釈することを許可せず、`channel: "whatsapp"` と `to: "telegram:123"` の組み合わせは拒否されます。対象種別およびサービスのプレフィックス（`channel:<id>`、`user:<id>`、`imessage:<handle>`、`sms:<number>`）は、プロバイダーセレクターではなく、チャンネルが所有する対象構文のままです。

分離ジョブでは、チャット配信が共有されます。チャットルートが利用可能であれば、`--no-deliver` であっても、エージェントは `message` ツールを使用できます。エージェントが設定済み／現在の対象へ送信した場合、OpenClaw はフォールバック通知をスキップします。それ以外の場合、`announce`、`webhook`、`none` は、エージェントターン後の最終返信をランナーがどのように扱うかだけを制御します。

エージェントがアクティブなチャットから分離リマインダーを作成すると、OpenClaw は保持されたライブ配信対象をフォールバック通知ルートとして保存します。内部セッションキーは小文字の場合があります。現在のチャットコンテキストが利用可能な場合、プロバイダーの配信対象がこれらのキーから再構築されることはありません。

暗黙の通知配信では、設定済みのチャンネル許可リストを使用して、古くなった対象を検証し、再ルーティングします。DM ペアリングストアの承認は、フォールバック自動化の受信先にはなりません。スケジュール済みジョブから DM へ能動的に送信する場合は、`delivery.to` を設定するか、チャンネルの `allowFrom` エントリを設定します。

### 失敗通知

失敗通知は別の送信先経路に従います。

- `cron.failureDestination` は、失敗通知のグローバルデフォルトを設定します。
- `job.delivery.failureDestination` は、ジョブごとにその設定を上書きします。
- どちらも設定されておらず、ジョブがすでに `announce` 経由で配信している場合、失敗通知はそのプライマリ通知先にフォールバックします。
- `delivery.failureDestination` は、プライマリ配信モードが `webhook` でない限り、`sessionTarget="isolated"` ジョブでのみサポートされます。
- `failureAlert.includeSkipped: true` は、ジョブまたはグローバル Cron アラートポリシーで、スキップされた実行について繰り返しアラートを有効にします。スキップされた実行には個別の連続スキップカウンターが使用されるため、実行エラーのバックオフには影響しません。
- `openclaw cron edit` では、ジョブごとのアラート調整項目として、`--failure-alert`/`--no-failure-alert`、`--failure-alert-after <n>`、`--failure-alert-channel`、`--failure-alert-to`、`--failure-alert-cooldown`、`--failure-alert-include-skipped`/`--failure-alert-exclude-skipped`、`--failure-alert-mode`、および `--failure-alert-account-id` を指定できます。

### 出力言語

Cron ジョブは、チャンネル、ロケール、以前のメッセージから応答言語を推測しません。スケジュールされたメッセージまたはテンプレートに言語ルールを含めてください。

```bash
openclaw cron edit <jobId> \
  --message "更新内容を要約してください。中国語で応答し、URL、コード、製品名は変更しないでください。"
```

テンプレートファイルでは、レンダリングされるプロンプトに言語の指示を含め、ジョブの実行前に `{{language}}` などのプレースホルダーが入力されていることを確認してください。出力に複数の言語が混在する場合は、たとえば「説明文には中国語を使用し、技術用語は英語のままにしてください」のように、ルールを明示してください。

## CLI の例

<Tabs>
  <Tab title="一度限りのリマインダー">
    ```bash
    openclaw cron add \
      --name "カレンダー確認" \
      --at "20m" \
      --session main \
      --system-event "次の Heartbeat：カレンダーを確認してください。" \
      --wake now
    ```
  </Tab>
  <Tab title="定期的な分離ジョブ">
    ```bash
    openclaw cron create "0 7 * * *" \
      "夜間の更新を要約してください。" \
      --name "朝の概要" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="モデルと思考レベルの上書き">
    ```bash
    openclaw cron add \
      --name "詳細分析" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "プロジェクトの進捗を毎週詳細に分析してください。" \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
  <Tab title="Webhook 出力">
    ```bash
    openclaw cron create "0 18 * * 1-5" \
      "今日のデプロイを JSON 形式で要約してください。" \
      --name "デプロイ概要" \
      --webhook "https://example.invalid/openclaw/cron"
    ```
  </Tab>
  <Tab title="コマンド出力">
    ```bash
    openclaw cron create "*/15 * * * *" \
      --name "キュー深度の検査" \
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
# すべてのジョブを一覧表示
openclaw cron list

# 保存されたジョブを1件 JSON として取得
openclaw cron get <jobId>

# 解決済みの配信経路を含め、ジョブを1件表示
openclaw cron show <jobId>

# 削除せずに有効化／無効化
openclaw cron enable <jobId>
openclaw cron disable <jobId>

# ジョブを編集
openclaw cron edit <jobId> --message "更新されたプロンプト" --model "opus"

# ジョブを今すぐ強制実行
openclaw cron run <jobId>

# ジョブを今すぐ強制実行し、終了ステータスを待機
openclaw cron run <jobId> --wait --wait-timeout 10m --poll-interval 2s

# 実行期限に達している場合のみ実行
openclaw cron run <jobId> --due

# 実行履歴を表示
openclaw cron runs --id <jobId> --limit 50

# 特定の実行を1件表示
openclaw cron runs --id <jobId> --run-id <runId>

# ジョブを削除
openclaw cron remove <jobId>

# エージェントの選択（マルチエージェント構成）
openclaw cron create "0 6 * * *" "運用キューを確認してください" --name "運用確認" --session isolated --agent ops
openclaw cron edit <jobId> --clear-agent
```

セッションをアーカイブすると（Control UI、またはオペレーター管理者の呼び出し元による `sessions.patch { archived: true }`）、そのセッションに関連付けられた有効な Cron ジョブがすべて無効になります。対象には、その分離された `cron:<jobId>` セッション、`session:<key>` ターゲット、または配信／起動用の `sessionKey` レーンが含まれます。セッションを復元しても、それらのジョブは再び有効になりません。`openclaw cron enable <jobId>` を使用してください。有効な関連ジョブがあるセッションには、Control UI のサイドバーに時計のバッジが表示されます。

`openclaw cron run <jobId>` は、手動実行をキューに追加した後に処理を返します。シャットダウンフック、メンテナンススクリプト、またはキューに追加された実行の完了までブロックする必要があるその他の自動化では、`--wait` を使用してください。返された `runId` をポーリングし（デフォルトのタイムアウトは `10m`、ポーリング間隔は `2s`）、ステータスが `ok` の場合は `0` で終了し、`error`、`skipped`、または待機タイムアウトの場合はゼロ以外で終了します。

エージェントの `cron` ツールは、`cron(action: "list")` から簡潔なジョブ概要（`id`、`name`、`enabled`、`nextRunAtMs`、`scheduleKind`、`lastRunStatus`）を返します。完全なジョブ定義を1件取得するには、`cron(action: "get", jobId: "...")` を使用してください。Gateway を直接呼び出す場合は、`cron.list` に `compact: true` を渡せます。省略すると、配信プレビューを含む完全な応答が維持されます。

`openclaw cron create` は `openclaw cron add` のエイリアスです。新しいジョブでは、位置引数のスケジュール（`"0 9 * * 1"`、`"every 1h"`、`"20m"`、または ISO タイムスタンプ）に続けて、位置引数のエージェントプロンプトを指定できます。完了した実行ペイロードを HTTP エンドポイントへ POST するには、`cron add|create` または `cron edit` で `--webhook <url>` を使用してください。Webhook 配信は、チャット配信フラグ（`--announce`、`--channel`、`--to`、`--thread-id`、`--account`）と組み合わせることはできません。`cron edit`、`--clear-channel`、`--clear-to`、`--clear-thread-id`、および `--clear-account` は、それぞれのルーティングフィールドを個別に未設定にします（対応する設定フラグと同時に指定すると、いずれも拒否されます）。これは、ランナーのフォールバック配信のみを無効にする `--no-deliver` とは異なります。

<Note>
モデルの上書きに関する注意：

- `openclaw cron add|edit --model ...` は、ジョブで選択されるモデルを変更します。
- モデルが許可されている場合、その正確なプロバイダー／モデルが分離されたエージェント実行に渡されます。
- モデルが許可されていないか解決できない場合、Cron は明示的な検証エラーで実行を失敗させます。
- API の `cron.update` ペイロードパッチでは、保存されたジョブのモデル上書きを消去するために `model: null` を設定できます。
- `openclaw cron edit <job-id> --clear-model` は、CLI からその上書きを消去し（`model: null` パッチと同じ効果）、`--model` と組み合わせることはできません。
- Cron の `--model` はジョブのプライマリであり、セッションの `/model` 上書きではないため、設定されたフォールバックチェーンは引き続き適用されます。
- `openclaw cron add|edit --fallbacks ...` はペイロードの `fallbacks` を設定し、そのジョブに設定されたフォールバックを置き換えます。`--fallbacks ""` はフォールバックを無効にし、実行を厳格にします。`openclaw cron edit <job-id> --clear-fallbacks` はジョブごとの上書きを消去します。
- 明示的または設定済みのフォールバックリストがない単独の `--model` は、暗黙の追加再試行先としてエージェントのプライマリにフォールスルーしません。

</Note>

## Webhook

Gateway は、外部トリガー用の HTTP Webhook エンドポイントを公開できます。設定で有効にします。

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

すべてのリクエストは、ヘッダーを介してフックトークンを含める必要があります。

- `Authorization: Bearer <token>`（推奨）
- `x-openclaw-token: <token>`

クエリ文字列のトークンは拒否されます。

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    メインセッションのシステムイベントをキューに追加します。

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"新しいメールを受信しました","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      イベントの説明。
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` または `next-heartbeat`。
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    分離されたエージェントターンを実行します。

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"受信トレイを要約してください","name":"メール","model":"openai/gpt-5.6-sol"}'
    ```

    フィールド：`message`（必須）、`name`、`agentId`、`sessionKey`（`hooks.allowRequestSessionKey=true` が必要）、`idempotencyKey`、`wakeMode`、`deliver`、`channel`、`to`、`model`、`thinking`、`timeoutSeconds`。

  </Accordion>
  <Accordion title="マッピングされたフック（POST /hooks/<name>）">
    カスタムフック名は、設定内の `hooks.mappings` を介して解決されます。マッピングでは、テンプレートまたはコード変換により、任意のペイロードを `wake` または `agent` アクションに変換できます。
  </Accordion>
</AccordionGroup>

<Warning>
フックエンドポイントは、ループバック、tailnet、または信頼できるリバースプロキシの背後に配置してください。

- 専用のフックトークンを使用し、Gateway の認証トークンを再利用しないでください。
- `hooks.path` は専用のサブパスに配置してください。`/` は拒否されます。
- `hooks.allowedAgentIds` を設定し、フックが対象にできる実効エージェントを制限してください。これには、`agentId` が省略された場合のデフォルトエージェントも含まれます。
- 呼び出し元がセッションを選択する必要がない限り、`hooks.allowRequestSessionKey=false` を維持してください。
- `hooks.allowRequestSessionKey` を有効にする場合は、許可されるセッションキーの形式を制限するために `hooks.allowedSessionKeyPrefixes` も設定してください。
- フックペイロードは、デフォルトで安全境界によってラップされます。

</Warning>

## Gmail PubSub 連携

Google PubSub を介して Gmail の受信トリガーを OpenClaw に接続します。

<Note>
**前提条件：** `gcloud` CLI、`gog`（gogcli）、有効化された OpenClaw フック、公開 HTTPS エンドポイント用の Tailscale。
</Note>

### ウィザードによるセットアップ（推奨）

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

このコマンドは `hooks.gmail` の設定を書き込み、Gmail プリセットを有効化し、プッシュエンドポイント（`--tailscale funnel|serve|off`）のデフォルトとして Tailscale Funnel を使用します。

<Warning>
Gmail プリセットのメッセージごとのセッションは会話コンテキストを分離しますが、対象エージェントのツールやワークスペースを制限するものではありません。`agentId` を設定するカスタムマッピングがない場合、Gmail フックはデフォルトエージェントとして実行されます。

信頼できない受信トレイでは、フックを専用の閲覧エージェントにルーティングし、そのエージェントのワークスペースアクセスを読み取り専用またはアクセスなしに設定し、ファイルシステムへの書き込み、シェル、ブラウザー、およびその他の不要なツールを拒否してください。メインエージェントへの通知が必要な場合は、必要なエージェント間の引き継ぎのみを許可してください。[プロンプトインジェクション](/ja-JP/gateway/security#prompt-injection)、[マルチエージェントのサンドボックスとツール](/ja-JP/tools/multi-agent-sandbox-tools)、および [`tools.agentToAgent`](/ja-JP/gateway/config-tools#toolsagenttoagent) を参照してください。
</Warning>

### Gateway の自動起動

`hooks.enabled=true` と `hooks.gmail.account` が設定されている場合、Gateway は起動時に `gog gmail watch serve` を開始し、監視を自動更新します。無効にするには `OPENCLAW_SKIP_GMAIL_WATCHER=1` を設定してください。

### 手動による1回限りのセットアップ

<Steps>
  <Step title="GCP プロジェクトを選択">
    `gog` が使用する OAuth クライアントを所有する GCP プロジェクトを選択します。

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="トピックを作成して Gmail プッシュアクセスを許可する">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="監視を開始する">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Gmail モデルのオーバーライド

```json5
{
  hooks: {
    gmail: {
      model: "openai/gpt-5.6-sol",
      thinking: "high",
    },
  },
}
```

信頼できない受信トレイには、プロバイダーで利用可能な最新世代かつ最上位のモデルを使用してください。上記の値は一例です。モデルは設定済みのカタログと許可リストに存在している必要があります。

## 設定

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8,
    triggers: {
      enabled: false,
      minIntervalMs: 30000,
    },
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
  },
}
```

上記の `retry` 値がデフォルトです。`30s/60s/5m` バックオフを使用して最大 3 回再試行し、5 つの一時的なカテゴリすべてを再試行します。`webhookToken` は、Cron Webhook の POST で `Authorization: Bearer <token>` として送信されます。

`maxConcurrentRuns` は、スケジュールされた Cron ディスパッチと分離されたエージェントターンの実行の両方を制限し、デフォルトは 8 です。分離された Cron エージェントターンは、内部でキュー専用の `cron-nested` 実行レーンを使用します。そのため、この値を増やすと、外側の Cron ラッパーだけが起動するのではなく、独立した Cron LLM 実行を並行して進められます。この設定によって、Cron 以外で共有される `nested` レーンが拡張されることはありません。

`cron.store` は論理ストアキーおよび doctor の移行パスであり、手動編集する稼働中の JSON ファイルではありません。ジョブデータは SQLite に保存されます。変更には CLI または Gateway API を使用してください。

Cron を無効にするには、`cron.enabled: false` または `OPENCLAW_SKIP_CRON=1` を使用します。

<AccordionGroup>
  <Accordion title="再試行の動作">
    **単発実行の再試行**：一時的なエラー（レート制限、過負荷、ネットワーク、タイムアウト、サーバーエラー）は、`retry.backoffMs`（デフォルトは 30s、60s、5m）を使用して最大 `retry.maxAttempts` 回（デフォルトは 3）再試行されます。永続的なエラーが発生すると、ジョブは直ちに無効化されます。

    **繰り返し実行の再試行**：実行エラーが連続すると、延長スケジュール（30s、60s、5m、15m、60m）に従ってバックオフします。次回の実行が成功すると、バックオフはリセットされます。

  </Accordion>
  <Accordion title="メンテナンス">
    `cron.sessionRetention`（デフォルトは `24h`、`false` で無効化）は、分離された実行セッションのエントリを削除します。実行履歴では、ジョブごとに最新の完了済み行 2000 件が保持されます。消失した行には、24 時間のクリーンアップ期間が引き続き適用されます。
  </Accordion>
  <Accordion title="従来のストアの移行">
    アップグレード時に `openclaw doctor --fix` を実行して、従来の `~/.openclaw/cron/jobs.json`、`jobs-state.json`、`runs/*.jsonl` ファイルを SQLite にインポートし、`.migrated` サフィックスを付けて名前を変更します。不正な形式のジョブ行はランタイムでスキップされ、後で修復または確認できるように `jobs-quarantine.json` にコピーされます。
  </Accordion>
</AccordionGroup>

## トラブルシューティング

### コマンドの確認手順

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
  <Accordion title="Cron が実行されない">
    - `cron.enabled` と `OPENCLAW_SKIP_CRON` 環境変数を確認します。
    - Gateway が継続的に稼働していることを確認します。
    - `cron` スケジュールでは、タイムゾーン（`--tz`）とホストのタイムゾーンを照合します。
    - 実行出力の `reason: not-due` は、手動実行が `openclaw cron run <jobId> --due` を使用して確認され、ジョブの実行時刻がまだ到来していなかったことを意味します。

  </Accordion>
  <Accordion title="Cron は実行されたが配信されない">
    - 配信モードが `none` の場合、ランナーによるフォールバック送信は行われません。チャットルートが利用可能な場合、エージェントは引き続き `message` ツールで直接送信できます。
    - 配信先が欠落しているか無効（`channel`/`to`）な場合、送信はスキップされます。
    - Matrix では、コピーされたジョブや従来のジョブで `delivery.to` ルーム ID が小文字化されていると、Matrix のルーム ID は大文字と小文字を区別するため、失敗することがあります。ジョブを編集し、Matrix から取得した正確な `!room:server` または `room:!room:server` の値を設定してください。
    - チャンネル認証エラー（`unauthorized`、`Forbidden`）は、認証情報によって配信がブロックされたことを意味します。
    - 分離された実行がサイレントトークン（`NO_REPLY` / `no_reply`）のみを返した場合、OpenClaw は直接の送信とフォールバックのキュー済み要約パスを抑制するため、チャットには何も投稿されません。
    - エージェント自身がユーザーにメッセージを送信する必要がある場合は、ジョブに使用可能なルート（以前のチャットがある `channel: "last"`、または明示的なチャンネル/送信先）が設定されていることを確認します。

  </Accordion>
  <Accordion title="Cron または Heartbeat が /new 形式のロールオーバーを妨げているように見える">
    - 日次およびアイドルリセットの鮮度は `updatedAt` に基づきません。[セッション管理](/ja-JP/concepts/session#session-lifecycle)を参照してください。
    - Cron のウェイクアップ、Heartbeat の実行、exec 通知、Gateway の管理処理によって、ルーティングやステータスのためにセッション行が更新される場合がありますが、`sessionStartedAt` や `lastInteractionAt` が延長されることはありません。
    - これらのフィールドが存在する前に作成された従来の行では、ファイルがまだ利用可能な場合、OpenClaw はトランスクリプト JSONL のセッションヘッダーから `sessionStartedAt` を復元できます。`lastInteractionAt` がない従来のアイドル行では、その復元された開始時刻がアイドル期間の基準として使用されます。

  </Accordion>
  <Accordion title="タイムゾーンに関する注意事項">
    - `--tz` がない Cron は、Gateway ホストのタイムゾーンを使用します。
    - タイムゾーンがない `at` スケジュールは、UTC として扱われます。
    - Heartbeat の `activeHours` では、設定されたタイムゾーン解決が使用されます。

  </Accordion>
</AccordionGroup>

## 関連項目

- [自動化](/ja-JP/automation) — すべての自動化メカニズムの概要
- [バックグラウンドタスク](/ja-JP/automation/tasks) — Cron 実行のタスク台帳
- [Heartbeat](/ja-JP/gateway/heartbeat) — メインセッションの定期的なターン
- [タイムゾーン](/ja-JP/concepts/timezone) — タイムゾーンの設定

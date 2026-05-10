---
read_when:
    - バックグラウンド exec 動作の追加または変更
    - 長時間実行される exec タスクのデバッグ
summary: バックグラウンドでの exec 実行とプロセス管理
title: バックグラウンド実行とプロセスツール
x-i18n:
    generated_at: "2026-05-10T19:33:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95fb986cf0c07ef3d054189ce2838b441ae24f07703f8edc1ddb8aca3a58b300
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw は `exec` ツールを通じてシェルコマンドを実行し、長時間実行されるタスクをメモリ内に保持します。`process` ツールはそれらのバックグラウンドセッションを管理します。

## `exec` ツール

主要なパラメータ:

- `command` (必須)
- `yieldMs` (デフォルト 10000): この遅延後に自動でバックグラウンド化
- `background` (bool): ただちにバックグラウンド化
- `timeout` (秒、デフォルトは `tools.exec.timeoutSec`): このタイムアウト後にプロセスを kill します。その呼び出しで exec プロセスのタイムアウトを無効にする場合のみ `timeout: 0` を設定します
- `elevated` (bool): elevated モードが有効/許可されている場合にサンドボックス外で実行します (デフォルトは `gateway`、exec ターゲットが `node` の場合は `node`)
- 実際の TTY が必要ですか? `pty: true` を設定してください。
- `workdir`, `env`

動作:

- フォアグラウンド実行は出力を直接返します。
- バックグラウンド化された場合 (明示的またはタイムアウト)、ツールは `status: "running"` + `sessionId` と短い末尾出力を返します。
- バックグラウンド実行と `yieldMs` 実行は、呼び出しが明示的な `timeout` を指定しない限り、`tools.exec.timeoutSec` を継承します。
- 出力は、セッションがポーリングまたはクリアされるまでメモリ内に保持されます。
- `process` ツールが許可されていない場合、`exec` は同期的に実行され、`yieldMs`/`background` を無視します。
- 生成された exec コマンドは、コンテキスト対応のシェル/プロファイルルールのために `OPENCLAW_SHELL=exec` を受け取ります。
- これから開始する長時間実行の作業では、一度だけ開始し、自動完了ウェイクが有効で、コマンドが出力を生成するか失敗した場合はそれに依存します。
- 自動完了ウェイクが利用できない場合、または出力なしで正常終了したコマンドの静かな成功確認が必要な場合は、`process` を使用して完了を確認します。
- リマインダーや遅延フォローアップを `sleep` ループや繰り返しポーリングでエミュレートしないでください。将来の作業には Cron を使用してください。

## 子プロセスブリッジ

exec/process ツールの外で長時間実行される子プロセスを生成する場合 (たとえば、CLI の再生成や Gateway ヘルパー)、終了シグナルが転送され、exit/error 時にリスナーがデタッチされるように、子プロセスブリッジヘルパーをアタッチします。これにより、systemd 上で孤立プロセスを避け、プラットフォーム間でシャットダウン動作を一貫させます。

環境変数の上書き:

- `PI_BASH_YIELD_MS`: デフォルトの yield (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: メモリ内出力の上限 (文字数)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: ストリームごとの保留中 stdout/stderr 上限 (文字数)
- `PI_BASH_JOB_TTL_MS`: 完了済みセッションの TTL (ms、1m–3h に制限)
- `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`: 書き込み可能なバックグラウンドセッションが入力待ちの可能性ありとしてマークされる前のアイドル出力しきい値 (デフォルト 15000 ms)

設定 (推奨):

- `tools.exec.backgroundMs` (デフォルト 10000)
- `tools.exec.timeoutSec` (デフォルト 1800)
- `tools.exec.cleanupMs` (デフォルト 1800000)
- `tools.exec.notifyOnExit` (デフォルト true): バックグラウンド化された exec が終了したときに、システムイベントをキューに入れ、Heartbeat をリクエストします。
- `tools.exec.notifyOnExitEmptySuccess` (デフォルト false): true の場合、出力を生成しなかった成功したバックグラウンド実行についても完了イベントをキューに入れます。

## `process` ツール

アクション:

- `list`: 実行中 + 完了済みセッション
- `poll`: セッションの新しい出力をドレインします (終了ステータスも報告)
- `log`: 集約された出力を読み取り、入力復旧ヒントを表示します (`offset` + `limit` をサポート)
- `write`: stdin を送信します (`data`、任意の `eof`)
- `send-keys`: PTY ベースのセッションに明示的なキートークンまたはバイトを送信します
- `submit`: PTY ベースのセッションに Enter / キャリッジリターンを送信します
- `paste`: リテラルテキストを送信します。任意で bracketed paste モードにラップできます
- `kill`: バックグラウンドセッションを終了します
- `clear`: 完了済みセッションをメモリから削除します
- `remove`: 実行中なら kill し、完了済みなら clear します

注記:

- バックグラウンド化されたセッションのみが一覧表示され、メモリ内に永続化されます。
- セッションはプロセス再起動時に失われます (ディスク永続化なし)。
- セッションログは、`process poll/log` を実行してツール結果が記録された場合にのみチャット履歴に保存されます。
- `process` はエージェントごとのスコープです。そのエージェントが開始したセッションのみを参照します。
- ステータス、ログ、静かな成功確認、または自動完了ウェイクが利用できない場合の完了確認には、`poll` / `log` を使用します。
- インタラクティブ CLI を復旧する前に `log` を使用して、現在のトランスクリプト、stdin 状態、入力待ちヒントをまとめて確認できるようにします。
- 入力または介入が必要な場合は、`write` / `send-keys` / `submit` / `paste` / `kill` を使用します。
- `process list` には、素早い確認のために派生した `name` (コマンド動詞 + ターゲット) が含まれます。
- `process list`、`poll`、`log` は、セッションにまだ書き込み可能な stdin があり、入力待ちしきい値より長くアイドル状態の場合にのみ `waitingForInput` を報告します。
- `process log` は行ベースの `offset`/`limit` を使用します。
- `offset` と `limit` の両方が省略された場合、最後の 200 行を返し、ページングヒントを含めます。
- `offset` が指定され、`limit` が省略された場合、`offset` から末尾までを返します (200 行には制限されません)。
- ポーリングはオンデマンドのステータス確認用であり、待機ループのスケジューリング用ではありません。作業を後で実行する必要がある場合は、代わりに Cron を使用してください。

## 例

長時間タスクを実行して後でポーリングする:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

入力を送信する前にインタラクティブセッションを調べる:

```json
{ "tool": "process", "action": "log", "sessionId": "<id>" }
```

ただちにバックグラウンドで開始する:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

stdin を送信する:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

PTY キーを送信する:

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

現在の行を送信する:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

リテラルテキストを貼り付ける:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## 関連

- [Exec ツール](/ja-JP/tools/exec)
- [Exec 承認](/ja-JP/tools/exec-approvals)

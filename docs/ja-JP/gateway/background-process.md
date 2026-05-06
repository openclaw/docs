---
read_when:
    - バックグラウンド exec の動作を追加または変更する
    - 長時間実行される exec タスクのデバッグ
summary: バックグラウンドでの exec 実行とプロセス管理
title: バックグラウンド実行とプロセスツール
x-i18n:
    generated_at: "2026-05-06T09:04:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7677dcb1cb28b4922a034855550696f839e64cdd349b39d09fbf2c00acf8cec1
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw は `exec` ツールを通じてシェルコマンドを実行し、長時間実行されるタスクをメモリ内に保持します。`process` ツールはそれらのバックグラウンドセッションを管理します。

## `exec` ツール

主なパラメータ:

- `command` (必須)
- `yieldMs` (デフォルト 10000): この遅延後に自動でバックグラウンド化
- `background` (bool): ただちにバックグラウンド化
- `timeout` (秒、デフォルト `tools.exec.timeoutSec`): このタイムアウト後にプロセスを kill します。その呼び出しで exec プロセスのタイムアウトを無効にする場合にのみ `timeout: 0` を設定します
- `elevated` (bool): elevated モードが有効/許可されている場合にサンドボックス外で実行します (デフォルトは `gateway`、または exec ターゲットが `node` の場合は `node`)
- 実際の TTY が必要ですか? `pty: true` を設定します。
- `workdir`, `env`

動作:

- フォアグラウンド実行は出力を直接返します。
- バックグラウンド化された場合 (明示的、またはタイムアウト)、ツールは `status: "running"` + `sessionId` と短い末尾出力を返します。
- バックグラウンド実行と `yieldMs` 実行は、呼び出しで明示的な `timeout` が指定されていない限り、`tools.exec.timeoutSec` を継承します。
- 出力は、セッションがポーリングまたはクリアされるまでメモリ内に保持されます。
- `process` ツールが許可されていない場合、`exec` は同期的に実行され、`yieldMs`/`background` を無視します。
- 生成された exec コマンドは、コンテキスト対応のシェル/プロファイル規則のために `OPENCLAW_SHELL=exec` を受け取ります。
- 今すぐ開始する長時間実行の作業では、一度だけ開始し、自動
  完了 wake が有効で、コマンドが出力を生成するか失敗した場合はそれに依存します。
- 自動完了 wake が利用できない場合、または出力なしで正常終了したコマンドについて
  無出力成功の確認が必要な場合は、`process`
  を使用して完了を確認します。
- リマインダーや遅延フォローアップを `sleep` ループや反復
  ポーリングでエミュレートしないでください。将来の作業には cron を使用します。

## 子プロセスブリッジ

exec/process ツールの外部で長時間実行される子プロセスを生成する場合 (たとえば、CLI の再生成や gateway ヘルパー)、子プロセスブリッジヘルパーを接続して、終了シグナルが転送され、exit/error 時にリスナーが切り離されるようにします。これにより systemd 上で孤立プロセスを避け、プラットフォーム間で shutdown 動作を一貫させます。

環境変数による上書き:

- `PI_BASH_YIELD_MS`: デフォルト yield (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: メモリ内出力上限 (文字数)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: ストリームごとの保留中 stdout/stderr 上限 (文字数)
- `PI_BASH_JOB_TTL_MS`: 完了したセッションの TTL (ms、1m–3h に制限)

設定 (推奨):

- `tools.exec.backgroundMs` (デフォルト 10000)
- `tools.exec.timeoutSec` (デフォルト 1800)
- `tools.exec.cleanupMs` (デフォルト 1800000)
- `tools.exec.notifyOnExit` (デフォルト true): バックグラウンド化された exec が終了したときに、システムイベントをキューに入れ、Heartbeat をリクエストします。
- `tools.exec.notifyOnExitEmptySuccess` (デフォルト false): true の場合、出力を生成しなかった成功したバックグラウンド実行についても完了イベントをキューに入れます。

## `process` ツール

アクション:

- `list`: 実行中 + 完了済みセッション
- `poll`: セッションの新しい出力を drain します (終了ステータスも報告)
- `log`: 集約された出力を読み取ります (`offset` + `limit` をサポート)
- `write`: stdin を送信します (`data`、任意の `eof`)
- `send-keys`: PTY  backed セッションに明示的なキートークンまたはバイトを送信します
- `submit`: PTY  backed セッションに Enter / carriage return を送信します
- `paste`: リテラルテキストを送信します。任意で bracketed paste mode でラップできます
- `kill`: バックグラウンドセッションを終了します
- `clear`: 完了したセッションをメモリから削除します
- `remove`: 実行中なら kill し、完了済みなら clear します

注記:

- バックグラウンド化されたセッションのみが一覧表示/メモリ内に保持されます。
- セッションはプロセス再起動時に失われます (ディスク永続化なし)。
- セッションログは、`process poll/log` を実行し、ツール結果が記録された場合にのみチャット履歴に保存されます。
- `process` はエージェントごとにスコープされます。そのエージェントが開始したセッションだけを参照します。
- ステータス、ログ、無出力成功の確認、または自動完了 wake が利用できない場合の
  完了確認には `poll` / `log` を使用します。
- 入力や介入が必要な場合は、`write` / `send-keys` / `submit` / `paste` / `kill` を使用します。
- `process list` には、すばやく確認するための派生 `name` (コマンド動詞 + ターゲット) が含まれます。
- `process log` は行ベースの `offset`/`limit` を使用します。
- `offset` と `limit` の両方が省略された場合、直近 200 行を返し、ページングヒントを含めます。
- `offset` が指定され、`limit` が省略された場合、`offset` から末尾までを返します (200 行に制限されません)。
- ポーリングはオンデマンドのステータス確認用であり、待機ループのスケジューリング用ではありません。作業を
  後で実行する必要がある場合は、代わりに cron を使用します。

## 例

長いタスクを実行し、後でポーリングします:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

ただちにバックグラウンドで開始します:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

stdin を送信します:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

PTY キーを送信します:

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["C-c"] }
```

現在の行を送信します:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

リテラルテキストを貼り付けます:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## 関連

- [Exec ツール](/ja-JP/tools/exec)
- [Exec 承認](/ja-JP/tools/exec-approvals)

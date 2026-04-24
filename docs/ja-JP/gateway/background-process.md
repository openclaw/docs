---
read_when:
    - バックグラウンド exec の動作を追加または変更する
    - 長時間実行される exec タスクをデバッグする
summary: バックグラウンド exec 実行とプロセス管理
title: バックグラウンド exec と process tool
x-i18n:
    generated_at: "2026-04-24T04:55:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: c6dbf6fd0ee39a053fda0a910e95827e9d0e31dcdfbbf542b6ba5d1d63aa48dc
    source_path: gateway/background-process.md
    workflow: 15
---

# バックグラウンド exec + process tool

OpenClaw は `exec` tool を通じてシェルコマンドを実行し、長時間実行されるタスクをメモリ内に保持します。`process` tool はそれらのバックグラウンドセッションを管理します。

## exec tool

主なパラメーター:

- `command`（必須）
- `yieldMs`（デフォルト 10000）: この遅延後に自動でバックグラウンド化
- `background`（bool）: ただちにバックグラウンド化
- `timeout`（秒、デフォルト 1800）: このタイムアウト後にプロセスを kill
- `elevated`（bool）: elevated モードが有効/許可されている場合にサンドボックス外で実行（デフォルトは `gateway`、exec ターゲットが `node` の場合は `node`）
- 実際の TTY が必要ですか？ `pty: true` を設定してください。
- `workdir`, `env`

動作:

- フォアグラウンド実行は出力を直接返します。
- バックグラウンド化された場合（明示的またはタイムアウト）、tool は `status: "running"` + `sessionId` と短い tail を返します。
- 出力は、セッションがポーリングまたはクリアされるまでメモリに保持されます。
- `process` tool が許可されていない場合、`exec` は同期実行され、`yieldMs`/`background` は無視されます。
- 起動された exec コマンドは、コンテキスト認識型のシェル/プロファイルルールのために `OPENCLAW_SHELL=exec` を受け取ります。
- 今すぐ始める長時間実行作業については、一度開始したら、自動完了 wake が有効で、コマンドが出力を出すか失敗した場合にはそれに任せてください。
- 自動完了 wake が使えない場合、または出力なしで正常終了したコマンドについて静かな成功確認が必要な場合は、`process` を使って完了を確認してください。
- `sleep` ループや繰り返しポーリングでリマインダーや遅延フォローアップをエミュレートしないでください。将来の作業には Cron を使ってください。

## 子プロセスブリッジ

exec/process tools の外で長時間実行される子プロセスを起動する場合（たとえば CLI の再起動や Gateway ヘルパー）、子プロセスブリッジヘルパーを接続して、終了シグナルが転送され、exit/error 時にリスナーが切り離されるようにしてください。これにより systemd 上で孤立プロセスが残るのを防ぎ、プラットフォーム間で一貫したシャットダウン動作を維持できます。

環境変数による上書き:

- `PI_BASH_YIELD_MS`: デフォルトの yield（ms）
- `PI_BASH_MAX_OUTPUT_CHARS`: メモリ内出力上限（文字数）
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: ストリームごとの保留 stdout/stderr 上限（文字数）
- `PI_BASH_JOB_TTL_MS`: 完了済みセッションの TTL（ms、1 分〜3 時間に制限）

設定（推奨）:

- `tools.exec.backgroundMs`（デフォルト 10000）
- `tools.exec.timeoutSec`（デフォルト 1800）
- `tools.exec.cleanupMs`（デフォルト 1800000）
- `tools.exec.notifyOnExit`（デフォルト true）: バックグラウンド化された exec が終了したときに、システムイベントをキューに入れ、Heartbeat を要求する。
- `tools.exec.notifyOnExitEmptySuccess`（デフォルト false）: true の場合、出力を生成しなかった成功したバックグラウンド exec に対しても完了イベントをキューに入れる。

## process tool

アクション:

- `list`: 実行中 + 完了済みセッション
- `poll`: セッションの新しい出力を排出する（終了ステータスも報告）
- `log`: 集約出力を読み取る（`offset` + `limit` をサポート）
- `write`: stdin を送る（`data`、任意で `eof`）
- `send-keys`: PTY バックのセッションに明示的なキー token またはバイトを送る
- `submit`: PTY バックのセッションに Enter / carriage return を送る
- `paste`: 任意で bracketed paste mode でラップしたリテラルテキストを送る
- `kill`: バックグラウンドセッションを終了する
- `clear`: 完了済みセッションをメモリから削除する
- `remove`: 実行中なら kill、完了済みなら clear

注意:

- メモリに一覧表示/保持されるのは、バックグラウンド化されたセッションのみです。
- セッションはプロセス再起動時に失われます（ディスク永続化なし）。
- セッションログは、`process poll/log` を実行し、その tool 結果が記録された場合にのみチャット履歴へ保存されます。
- `process` はエージェントごとのスコープです。そのエージェントが開始したセッションしか見えません。
- `poll` / `log` は、ステータス、ログ、静かな成功確認、または自動完了 wake が利用できない場合の完了確認に使用してください。
- `write` / `send-keys` / `submit` / `paste` / `kill` は、入力や介入が必要な場合に使用してください。
- `process list` には、素早く確認できるよう、派生した `name`（コマンド動詞 + ターゲット）が含まれます。
- `process log` は行ベースの `offset`/`limit` を使います。
- `offset` と `limit` の両方が省略された場合、最後の 200 行を返し、ページングヒントを含みます。
- `offset` が指定され、`limit` が省略された場合、`offset` から末尾までを返します（200 行には制限されません）。
- ポーリングはオンデマンドのステータス確認用であり、待機ループのスケジューリング用ではありません。作業を後で実行すべきなら、代わりに Cron を使ってください。

## 例

長いタスクを実行し、後でポーリングする:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

すぐにバックグラウンドで開始する:

```json
{ "tool": "exec", "command": "npm run build", "background": true }
```

stdin を送る:

```json
{ "tool": "process", "action": "write", "sessionId": "<id>", "data": "y\n" }
```

PTY キーを送る:

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

- [Exec tool](/ja-JP/tools/exec)
- [Exec approvals](/ja-JP/tools/exec-approvals)

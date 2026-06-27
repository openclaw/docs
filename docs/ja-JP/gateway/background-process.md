---
read_when:
    - バックグラウンド exec の動作を追加または変更する
    - 長時間実行される exec タスクのデバッグ
summary: バックグラウンド exec の実行とプロセス管理
title: バックグラウンド exec とプロセスツール
x-i18n:
    generated_at: "2026-06-27T11:20:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5822c1e26b0144c5216ae6e59e279ccc506cf4c0a42b8cd6c386f535fe458bd3
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw は `exec` ツールを通じてシェルコマンドを実行し、長時間実行されるタスクをメモリに保持します。`process` ツールはそれらのバックグラウンドセッションを管理します。

## exec ツール

主要パラメータ:

- `command` (必須)
- `yieldMs` (デフォルト 10000): この遅延後に自動でバックグラウンド化
- `background` (bool): ただちにバックグラウンド化
- `timeout` (秒、デフォルト `tools.exec.timeoutSec`): このタイムアウト後にプロセスを kill します。その呼び出しで exec プロセスタイムアウトを無効にする場合にのみ `timeout: 0` を設定します
- `elevated` (bool): elevated モードが有効/許可されている場合にサンドボックス外で実行します (デフォルトは `gateway`、または exec ターゲットが `node` の場合は `node`)
- 実際の TTY が必要ですか? `pty: true` を設定します。
- `workdir`, `env`

動作:

- フォアグラウンド実行は出力を直接返します。
- バックグラウンド化された場合 (明示またはタイムアウト)、ツールは `status: "running"` + `sessionId` と短い末尾ログを返します。
- バックグラウンド実行と `yieldMs` 実行は、呼び出しが明示的な `timeout` を指定しない限り `tools.exec.timeoutSec` を継承します。
- 出力は、セッションがポーリングまたはクリアされるまでメモリに保持されます。
- `process` ツールが許可されていない場合、`exec` は同期的に実行され、`yieldMs`/`background` を無視します。
- 生成された exec コマンドは、コンテキストを考慮したシェル/プロファイルルールのために `OPENCLAW_SHELL=exec` を受け取ります。
- これから開始する長時間実行の作業では、一度だけ開始し、自動完了ウェイクが有効で、コマンドが出力を発するか失敗したときはそれに頼ります。
- 自動完了ウェイクを利用できない場合、または出力なしで正常終了したコマンドについて静かな成功確認が必要な場合は、`process` を使用して完了を確認します。
- リマインダーや遅延フォローアップを `sleep` ループや反復ポーリングでエミュレートしないでください。将来の作業には cron を使用します。

## 子プロセスブリッジ

exec/process ツールの外で長時間実行される子プロセスを生成する場合 (たとえば CLI の再生成や gateway ヘルパー)、終了シグナルが転送され、終了/エラー時にリスナーが切り離されるように、子プロセスブリッジヘルパーを接続します。これにより systemd 上の孤立プロセスを避け、プラットフォーム間でシャットダウン動作を一貫させます。

環境オーバーライド:

- `OPENCLAW_BASH_YIELD_MS`: デフォルトの yield (ms)
- `OPENCLAW_BASH_MAX_OUTPUT_CHARS`: メモリ内出力上限 (文字数)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: ストリームごとの保留中 stdout/stderr 上限 (文字数)
- `OPENCLAW_BASH_JOB_TTL_MS`: 完了済みセッションの TTL (ms、1m–3h に制限)
- `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`: 書き込み可能なバックグラウンドセッションが入力待ちの可能性ありとマークされる前のアイドル出力しきい値 (デフォルト 15000 ms)

設定 (推奨):

- `tools.exec.backgroundMs` (デフォルト 10000)
- `tools.exec.timeoutSec` (デフォルト 1800)
- `tools.exec.cleanupMs` (デフォルト 1800000)
- `tools.exec.notifyOnExit` (デフォルト true): バックグラウンド化された exec が終了したときに、システムイベントをキューに入れ、Heartbeat をリクエストします。
- `tools.exec.notifyOnExitEmptySuccess` (デフォルト false): true の場合、出力を生成しなかった成功したバックグラウンド実行についても完了イベントをキューに入れます。

## process ツール

アクション:

- `list`: 実行中 + 完了済みセッション
- `poll`: セッションの新しい出力を排出します (終了ステータスも報告)
- `log`: 集約された出力を読み取り、入力復旧ヒントを表示します (`offset` + `limit` をサポート)
- `write`: stdin を送信します (`data`、任意の `eof`)
- `send-keys`: PTY ベースのセッションに明示的なキー トークンまたはバイトを送信します
- `submit`: PTY ベースのセッションに Enter / キャリッジリターンを送信します
- `paste`: リテラルテキストを送信し、任意で bracketed paste モードでラップします
- `kill`: バックグラウンドセッションを終了します
- `clear`: 完了済みセッションをメモリから削除します
- `remove`: 実行中なら kill し、完了済みなら clear します

注記:

- バックグラウンド化されたセッションだけが一覧表示され、メモリに永続化されます。
- セッションはプロセス再起動時に失われます (ディスク永続化なし)。
- セッションログは、`process poll/log` を実行してツール結果が記録された場合にのみチャット履歴に保存されます。
- `process` はエージェントごとにスコープされます。そのエージェントが開始したセッションだけを参照します。
- 自動完了ウェイクを利用できない場合のステータス、ログ、静かな成功確認、または完了確認には `poll` / `log` を使用します。
- インタラクティブ CLI を復旧する前に `log` を使用し、現在のトランスクリプト、stdin 状態、入力待ちヒントを一緒に表示します。
- 入力または介入が必要な場合は、`write` / `send-keys` / `submit` / `paste` / `kill` を使用します。
- `process list` には、クイックスキャン用の派生 `name` (コマンド動詞 + ターゲット) が含まれます。
- `process list`、`poll`、`log` は、セッションがまだ書き込み可能な stdin を持ち、入力待ちしきい値より長くアイドル状態だった場合にのみ `waitingForInput` を報告します。
- `process log` は行ベースの `offset`/`limit` を使用します。
- `offset` と `limit` の両方が省略された場合、最後の 200 行を返し、ページングヒントを含めます。
- `offset` が指定され、`limit` が省略された場合、`offset` から末尾までを返します (200 行に制限されません)。
- ポーリングはオンデマンドのステータス用であり、待機ループのスケジューリング用ではありません。作業を後で実行すべき場合は、代わりに cron を使用します。

## 例

長いタスクを実行し、後でポーリングする:

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

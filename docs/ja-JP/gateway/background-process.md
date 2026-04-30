---
read_when:
    - バックグラウンド実行動作の追加または変更
    - 長時間実行される exec タスクのデバッグ
summary: バックグラウンドの exec 実行とプロセス管理
title: バックグラウンド実行とプロセスツール
x-i18n:
    generated_at: "2026-04-30T05:11:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0df76d7a09184bf87f5568d800bcee683620a76c092f34451d987db4ef1a1eaf
    source_path: gateway/background-process.md
    workflow: 16
---

# バックグラウンド Exec + Process ツール

OpenClaw は `exec` ツールでシェルコマンドを実行し、長時間実行されるタスクをメモリ内に保持します。`process` ツールはそれらのバックグラウンドセッションを管理します。

## exec ツール

主なパラメータ:

- `command` (必須)
- `yieldMs` (デフォルト 10000): この遅延後に自動でバックグラウンド化
- `background` (bool): 即座にバックグラウンド化
- `timeout` (秒、デフォルト `tools.exec.timeoutSec`): このタイムアウト後にプロセスを kill します。その呼び出しで exec プロセスタイムアウトを無効にする場合のみ `timeout: 0` を設定します
- `elevated` (bool): elevated モードが有効/許可されている場合、サンドボックス外で実行します (デフォルトは `gateway`、exec ターゲットが `node` の場合は `node`)
- 実際の TTY が必要ですか? `pty: true` を設定します。
- `workdir`, `env`

動作:

- フォアグラウンド実行は出力を直接返します。
- バックグラウンド化された場合 (明示的、またはタイムアウト)、ツールは `status: "running"` + `sessionId` と短い末尾ログを返します。
- バックグラウンド実行と `yieldMs` 実行は、呼び出しで明示的な `timeout` が指定されていない限り `tools.exec.timeoutSec` を継承します。
- 出力はセッションがポーリングまたはクリアされるまでメモリ内に保持されます。
- `process` ツールが許可されていない場合、`exec` は同期的に実行され、`yieldMs`/`background` を無視します。
- 生成された exec コマンドは、コンテキスト対応のシェル/プロファイル規則のために `OPENCLAW_SHELL=exec` を受け取ります。
- 今から開始する長時間実行の作業では、一度だけ開始し、コマンドが出力を発するか失敗したときに有効化される自動完了 wake に依存します。
- 自動完了 wake が利用できない場合、または出力なしで正常終了したコマンドの quiet-success 確認が必要な場合は、`process` を使用して完了を確認します。
- `sleep` ループや反復ポーリングでリマインダーや遅延フォローアップを模倣しないでください。将来の作業には cron を使用します。

## 子プロセスブリッジ

exec/process ツールの外で長時間実行される子プロセスを生成する場合 (たとえば CLI の再起動や gateway ヘルパー)、終了シグナルが転送され、終了/エラー時にリスナーがデタッチされるように、子プロセスブリッジヘルパーをアタッチします。これにより systemd 上で孤立プロセスを避け、プラットフォーム間でシャットダウン動作を一貫させます。

環境オーバーライド:

- `PI_BASH_YIELD_MS`: デフォルト yield (ms)
- `PI_BASH_MAX_OUTPUT_CHARS`: メモリ内出力上限 (文字)
- `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS`: ストリームごとの保留 stdout/stderr 上限 (文字)
- `PI_BASH_JOB_TTL_MS`: 完了済みセッションの TTL (ms、1m–3h に制限)

設定 (推奨):

- `tools.exec.backgroundMs` (デフォルト 10000)
- `tools.exec.timeoutSec` (デフォルト 1800)
- `tools.exec.cleanupMs` (デフォルト 1800000)
- `tools.exec.notifyOnExit` (デフォルト true): バックグラウンド化された exec が終了したとき、システムイベントをキューに入れ、heartbeat を要求します。
- `tools.exec.notifyOnExitEmptySuccess` (デフォルト false): true の場合、出力を生成しなかった正常なバックグラウンド実行についても完了イベントをキューに入れます。

## process ツール

アクション:

- `list`: 実行中 + 完了済みセッション
- `poll`: セッションの新しい出力をドレインします (終了ステータスも報告)
- `log`: 集約された出力を読み取ります (`offset` + `limit` をサポート)
- `write`: stdin を送信します (`data`、任意で `eof`)
- `send-keys`: PTY backed セッションに明示的なキー トークンまたはバイトを送信します
- `submit`: PTY backed セッションに Enter / キャリッジリターンを送信します
- `paste`: リテラルテキストを送信します。任意で bracketed paste mode でラップできます
- `kill`: バックグラウンドセッションを終了します
- `clear`: 完了済みセッションをメモリから削除します
- `remove`: 実行中なら kill し、完了済みなら clear します

注記:

- バックグラウンド化されたセッションだけが一覧表示され、メモリ内に永続化されます。
- セッションはプロセス再起動時に失われます (ディスク永続化なし)。
- セッションログは、`process poll/log` を実行してツール結果が記録された場合のみチャット履歴に保存されます。
- `process` はエージェントごとにスコープされ、そのエージェントが開始したセッションだけを参照します。
- ステータス、ログ、quiet-success 確認、または自動完了 wake が利用できない場合の完了確認には `poll` / `log` を使用します。
- 入力や介入が必要な場合は `write` / `send-keys` / `submit` / `paste` / `kill` を使用します。
- `process list` には、素早いスキャン用に派生した `name` (コマンド動詞 + ターゲット) が含まれます。
- `process log` は行ベースの `offset`/`limit` を使用します。
- `offset` と `limit` の両方が省略された場合、最後の 200 行を返し、ページングヒントを含めます。
- `offset` が指定され、`limit` が省略された場合、`offset` から末尾までを返します (200 に制限されません)。
- ポーリングはオンデマンドのステータス用であり、wait-loop のスケジューリング用ではありません。作業を後で実行する必要がある場合は、代わりに cron を使用します。

## 例

長いタスクを実行し、後でポーリングします:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

即座にバックグラウンドで開始します:

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

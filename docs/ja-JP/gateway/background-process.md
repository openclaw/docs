---
read_when:
    - バックグラウンド exec 動作の追加または変更
    - 長時間実行される exec タスクのデバッグ
summary: バックグラウンド exec 実行とプロセス管理
title: バックグラウンド実行とプロセスツール
x-i18n:
    generated_at: "2026-07-05T11:19:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a4cd16585ee31038f5a9849add94ddc5056591d2f04523375b0a3f570a301c6
    source_path: gateway/background-process.md
    workflow: 16
---

OpenClaw は `exec` ツールを通じてシェルコマンドを実行し、長時間実行されるタスクをメモリに保持します。`process` ツールはそれらのバックグラウンドセッションを管理します。

## `exec` ツール

パラメータ:

| パラメータ | 説明 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `command`    | 必須。実行するシェルコマンド。                                                                                                                        |
| `workdir`    | 作業ディレクトリ。既定の cwd を使う場合は省略します。                                                                                                        |
| `env`        | コマンド用の追加環境変数。                                                                                                           |
| `yieldMs`    | バックグラウンド化する前に待機するミリ秒数（既定値 10000）。                                                                                             |
| `background` | すぐにバックグラウンドで実行します。                                                                                                                         |
| `timeout`    | 秒単位のタイムアウト（既定値は `tools.exec.timeoutSec`）。期限切れ時にプロセスを kill します。その呼び出しで exec プロセスのタイムアウトを無効にするには `timeout: 0` を設定します。 |
| `pty`        | 利用可能な場合、疑似端末で実行します（TTY が必要な CLI、コーディングエージェント）。                                                                            |
| `elevated`   | 昇格モードが有効/許可されている場合、サンドボックスの外で実行します（既定では `gateway`、exec ターゲットが `node` の場合は `node`）。                          |
| `host`       | Exec ターゲット: `auto`、`sandbox`、`gateway`、または `node`。                                                                                                  |
| `node`       | Node の id/name。`host: "node"` と一緒に使用します。                                                                                                                |

動作:

- フォアグラウンド実行は出力を直接返します。
- バックグラウンド化された場合（明示的、または `yieldMs` タイムアウト経由）、ツールは `status: "running"` + `sessionId` と短い出力末尾を返します。
- バックグラウンド化された実行と `yieldMs` 実行は、呼び出しで明示的な `timeout` が渡されない限り、`tools.exec.timeoutSec` を継承します。
- 出力はセッションがポーリングまたはクリアされるまでメモリに残ります。
- `process` ツールが許可されていない場合、`exec` は同期的に実行され、`yieldMs`/`background` を無視します。
- 生成された exec コマンドは、コンテキスト対応のシェル/プロファイルルール用に `OPENCLAW_SHELL=exec` を受け取ります。
- 今すぐ開始する長時間実行の作業では、一度だけ開始し、コマンドが出力を発するか失敗した時点で（有効な場合）自動完了ウェイクに任せます。
- 自動完了ウェイクが利用できない場合、または出力なしで正常終了するコマンドの静かな成功確認が必要な場合は、`process` でポーリングします。
- `sleep` ループや反復ポーリングでリマインダーや遅延フォローアップを模倣しないでください。将来の作業には Cron を使用します。

### 環境変数オーバーライド

| 変数 | 効果 |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_BASH_YIELD_MS`                 | バックグラウンド化する前の既定の待機時間（ms）。既定値は 10000、10-120000 に制限されます。                                       |
| `OPENCLAW_BASH_MAX_OUTPUT_CHARS`         | メモリ内出力の上限（文字数）。                                                                                    |
| `OPENCLAW_BASH_PENDING_MAX_OUTPUT_CHARS` | ストリームごとの保留中 stdout/stderr の上限（文字数）。                                                                    |
| `OPENCLAW_BASH_JOB_TTL_MS`               | 完了済みセッションの TTL（ms）。1m-3h に制限されます。                                                                |
| `OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`    | 書き込み可能なバックグラウンドセッションが入力待ちの可能性ありとしてマークされるまでのアイドル出力しきい値。既定値は 15000。 |

### 設定（環境変数オーバーライドより推奨）

| キー | 既定値 | 効果 |
| ------------------------------------- | ------- | ------------------------------------------------------------------------------- |
| `tools.exec.backgroundMs`             | 10000   | `OPENCLAW_BASH_YIELD_MS` と同じ。                                               |
| `tools.exec.timeoutSec`               | 1800    | 呼び出しごとの既定タイムアウト。                                                       |
| `tools.exec.cleanupMs`                | 1800000 | `OPENCLAW_BASH_JOB_TTL_MS` と同じ。                                             |
| `tools.exec.notifyOnExit`             | true    | バックグラウンド化された exec が終了したときに、システムイベントをキューに入れ、Heartbeat を要求します。      |
| `tools.exec.notifyOnExitEmptySuccess` | false   | 出力なしで成功したバックグラウンド実行についても完了イベントをキューに入れます。 |

## 子プロセスブリッジ

exec/process ツールの外で長時間実行される子プロセスを生成する場合（CLI の再起動、Gateway ヘルパー）、子プロセスブリッジヘルパーを接続して、終了シグナルを転送し、終了/エラー時にリスナーを切り離します。これにより systemd 上で孤立プロセスを避け、プラットフォーム間でシャットダウンの一貫性を保てます。

## `process` ツール

アクション:

| アクション | 効果 |
| ----------- | ----------------------------------------------------------------------------- |
| `list`      | 実行中 + 完了済みセッション。                                                  |
| `poll`      | セッションの新しい出力を排出します（終了ステータスも報告します）。                    |
| `log`       | 集約された出力と入力回復ヒントを読み取ります。`offset` + `limit` をサポートします。 |
| `write`     | stdin を送信します（`data`、任意の `eof`）。                                          |
| `send-keys` | PTY ベースのセッションに明示的なキー token またはバイトを送信します。                    |
| `submit`    | PTY ベースのセッションに Enter/キャリッジリターンを送信します。                           |
| `paste`     | リテラルテキストを送信します。任意で bracketed paste mode でラップできます。                |
| `kill`      | バックグラウンドセッションを終了します。                                               |
| `clear`     | 完了済みセッションをメモリから削除します。                                        |
| `remove`    | 実行中なら kill し、完了済みなら clear します。                                 |

注記:

- バックグラウンド化されたセッションのみが一覧表示/永続化されます。ディスク上ではなく、メモリ内のみです。プロセス再起動時にセッションは失われます。
- セッションログは、`process poll`/`log` を実行してツール結果が記録された場合にのみチャット履歴に保存されます。
- `process` はエージェントごとにスコープされます。そのエージェントが開始したセッションのみを参照します。
- 自動完了ウェイクが利用できない場合は、ステータス、ログ、または完了確認に `poll`/`log` を使用します。
- インタラクティブ CLI を回復する前に `log` を使用し、現在のトランスクリプト、stdin 状態、入力待ちヒントをまとめて確認できるようにします。
- 入力または介入が必要な場合は `write`/`send-keys`/`submit`/`paste`/`kill` を使用します。
- `process list` には、素早く確認するための派生 `name`（コマンド動詞 + ターゲット）が含まれます。
- `process list`、`poll`、`log` は、セッションにまだ書き込み可能な stdin があり、入力待ちしきい値（既定 15000 ms、`OPENCLAW_PROCESS_INPUT_WAIT_IDLE_MS`）より長くアイドル状態だった場合にのみ `waitingForInput` を報告します。
- `process log` は行ベースの `offset`/`limit` を使用します。両方が省略された場合、ページングヒント付きで最後の 200 行を返します。`offset` が設定され、`limit` が設定されていない場合、`offset` から末尾までを返します（200 行には制限されません）。
- `poll` の `timeout` は、返る前に最大でそのミリ秒数だけ待機します。30000 を超える値は 30000 に制限されます。
- ポーリングはオンデマンドのステータス確認用であり、待機ループのスケジューリング用ではありません。作業を後で実行する必要がある場合は Cron を使用します。

## 例

長いタスクを実行し、後でポーリングします:

```json
{ "tool": "exec", "command": "sleep 5 && echo done", "yieldMs": 1000 }
```

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>" }
```

入力を送信する前にインタラクティブセッションを確認します:

```json
{ "tool": "process", "action": "log", "sessionId": "<id>" }
```

すぐにバックグラウンドで開始します:

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

- [exec ツール](/ja-JP/tools/exec)
- [exec 承認](/ja-JP/tools/exec-approvals)

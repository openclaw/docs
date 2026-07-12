---
read_when:
    - voice-call Pluginを使用し、すべてのCLIエントリポイントを利用する場合
    - setup、smoke、call、continue、speak、dtmf、end、status、tail、latency、expose、start の各フラグ一覧表とデフォルト値が必要です
summary: '`openclaw voicecall` の CLI リファレンス（音声通話 Plugin のコマンドインターフェース）'
title: 音声通話
x-i18n:
    generated_at: "2026-07-11T22:04:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aec445886cccb79c9212dd9f1f448ff9634274deb380632be786478c9bb29670
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` はプラグインによって提供されるコマンドです。音声通話プラグインがインストールされ、有効になっている場合にのみ表示されます。

Gateway が実行中の場合、操作コマンド（`call`、`start`、`continue`、`speak`、`dtmf`、`end`、`status`）は、その Gateway の音声通話ランタイムにルーティングされます。到達可能な Gateway がない場合は、スタンドアロンの CLI ランタイムにフォールバックします。

## サブコマンド

```bash
openclaw voicecall setup    [--json]
openclaw voicecall smoke    [-t <phone>] [--message <text>] [--mode <m>] [--yes] [--json]
openclaw voicecall call     -m <text> [-t <phone>] [--mode <m>]
openclaw voicecall start    --to <phone> [--message <text>] [--mode <m>]
openclaw voicecall continue --call-id <id> --message <text>
openclaw voicecall speak    --call-id <id> --message <text>
openclaw voicecall dtmf     --call-id <id> --digits <digits>
openclaw voicecall end      --call-id <id>
openclaw voicecall status   [--call-id <id>] [--json]
openclaw voicecall tail     [--file <path>] [--since <n>] [--poll <ms>]
openclaw voicecall latency  [--file <path>] [--last <n>]
openclaw voicecall expose   [--mode <m>] [--path <p>] [--port <port>] [--serve-path <p>]
```

| サブコマンド | 説明 |
| ---------- | --------------------------------------------------------------- |
| `setup`    | プロバイダーと Webhook の準備状況チェックを表示します。 |
| `smoke`    | 準備状況チェックを実行します。`--yes` を指定した場合にのみ実際のテスト通話を発信します。 |
| `call`     | 外部への音声通話を開始します。 |
| `start`    | `--to` が必須で、`--message` が任意の `call` のエイリアスです。 |
| `continue` | メッセージを読み上げ、次の応答を待ちます。 |
| `speak`    | 応答を待たずにメッセージを読み上げます。 |
| `dtmf`     | 通話中の呼び出しに DTMF 数字を送信します。 |
| `end`      | 通話中の呼び出しを切断します。 |
| `status`   | 通話中の呼び出しを確認します（または `--call-id` で 1 件を指定します）。 |
| `tail`     | `calls.jsonl` を追跡表示します（プロバイダーのテスト中に便利です）。 |
| `latency`  | `calls.jsonl` のターン遅延メトリクスを要約します。 |
| `expose`   | Webhook エンドポイント用の Tailscale Serve/Funnel を切り替えます。 |

## セットアップとスモークテスト

### `setup`

デフォルトでは、人が読みやすい形式で準備状況チェックを出力します。スクリプトで使用する場合は `--json` を指定します。

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

同じ準備状況チェックを実行します。`--to` と `--yes` の両方が指定されている場合にのみ、実際の電話を発信します。

| フラグ | デフォルト | 説明 |
| ------------------ | --------------------------------- | --------------------------------------- |
| `-t, --to <phone>` | （なし） | 実際のスモークテストで発信する電話番号。 |
| `--message <text>` | `OpenClaw voice call smoke test.` | スモークテスト通話中に読み上げるメッセージ。 |
| `--mode <mode>`    | `notify` | 通話モード：`notify` または `conversation`。 |
| `--yes`            | `false` | 実際に外部への通話を発信します。 |
| `--json`           | `false` | 機械可読な JSON を出力します。 |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # ドライラン
openclaw voicecall smoke --to "+15555550123" --yes  # 実際の通知通話
```

<Note>
外部プロバイダー（`plivo`、`telnyx`、`twilio`）の場合、`setup` と `smoke` には、`publicUrl`、トンネル、または Tailscale による公開を通じて利用できるパブリック Webhook URL が必要です。通信事業者から到達できないため、ループバックまたはプライベートな Serve へのフォールバックは拒否されます。
</Note>

## 通話のライフサイクル

### `call`

外部への音声通話を開始します。

| フラグ | 必須 | デフォルト | 説明 |
| ---------------------- | -------- | ----------------- | -------------------------------------------------------------------------- |
| `-m, --message <text>` | はい | （なし） | 通話接続時に読み上げるメッセージ。 |
| `-t, --to <phone>`     | いいえ | 設定の `toNumber` | 発信先の E.164 電話番号。 |
| `--mode <mode>`        | いいえ | `conversation` | 通話モード：`notify`（メッセージの後に切断）または `conversation`（接続を維持）。 |

```bash
openclaw voicecall call --to "+15555550123" --message "Hello"
openclaw voicecall call -m "Heads up" --mode notify
```

### `start`

デフォルトのフラグ構成が異なる `call` のエイリアスです。

| フラグ | 必須 | デフォルト | 説明 |
| ------------------ | -------- | -------------- | ---------------------------------------- |
| `--to <phone>`     | はい | （なし） | 発信先の電話番号。 |
| `--message <text>` | いいえ | （なし） | 通話接続時に読み上げるメッセージ。 |
| `--mode <mode>`    | いいえ | `conversation` | 通話モード：`notify` または `conversation`。 |

### `continue`

メッセージを読み上げ、応答を待ちます。

| フラグ | 必須 | 説明 |
| ------------------ | -------- | ----------------- |
| `--call-id <id>`   | はい | 通話 ID。 |
| `--message <text>` | はい | 読み上げるメッセージ。 |

### `speak`

応答を待たずにメッセージを読み上げます。

| フラグ | 必須 | 説明 |
| ------------------ | -------- | ----------------- |
| `--call-id <id>`   | はい | 通話 ID。 |
| `--message <text>` | はい | 読み上げるメッセージ。 |

### `dtmf`

通話中の呼び出しに DTMF 数字を送信します。

| フラグ | 必須 | 説明 |
| ------------------- | -------- | ------------------------------------------------ |
| `--call-id <id>`    | はい | 通話 ID。 |
| `--digits <digits>` | はい | DTMF 数字（たとえば、待機を含める場合は `ww123456#`）。 |

### `end`

通話中の呼び出しを切断します。

| フラグ | 必須 | 説明 |
| ---------------- | -------- | ----------- |
| `--call-id <id>` | はい | 通話 ID。 |

### `status`

通話中の呼び出しを確認します。

| フラグ | デフォルト | 説明 |
| ---------------- | ------- | ---------------------------- |
| `--call-id <id>` | （なし） | 出力を 1 件の通話に限定します。 |
| `--json`         | `false` | 機械可読な JSON を出力します。 |

```bash
openclaw voicecall status
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
```

## ログとメトリクス

### `tail`

音声通話の JSONL ログを追跡表示します。開始時に最後の `--since` 行を出力し、その後は新しい行が書き込まれるたびにストリーミングします。

| フラグ | デフォルト | 説明 |
| --------------- | -------------------------- | ------------------------------ |
| `--file <path>` | プラグインストアから解決 | `calls.jsonl` へのパス。 |
| `--since <n>`   | `25` | 追跡開始前に出力する行数。 |
| `--poll <ms>`   | `250`（最小 50） | ポーリング間隔（ミリ秒）。 |

### `latency`

`calls.jsonl` のターン遅延とリッスン待機のメトリクスを要約します。出力は、`recordsScanned`、`turnLatency`、`listenWait` の要約を含む JSON です。

| フラグ | デフォルト | 説明 |
| --------------- | -------------------------- | ------------------------------------ |
| `--file <path>` | プラグインストアから解決 | `calls.jsonl` へのパス。 |
| `--last <n>`    | `200`（最小 1） | 分析する最近のレコード数。 |

## Webhook の公開

### `expose`

音声 Webhook 用の Tailscale Serve/Funnel 設定を有効化、無効化、または変更します。

| フラグ | デフォルト | 説明 |
| --------------------- | ----------------------------------------- | ----------------------------------------------- |
| `--mode <mode>`       | `funnel` | `off`、`serve`（tailnet）、または `funnel`（パブリック）。 |
| `--path <path>`       | 設定の `tailscale.path` または `--serve-path` | 公開する Tailscale パス。 |
| `--port <port>`       | 設定の `serve.port` または `3334` | ローカル Webhook ポート。 |
| `--serve-path <path>` | 設定の `serve.path` または `/voice/webhook` | ローカル Webhook パス。 |

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

<Warning>
Webhook エンドポイントは、信頼できるネットワークにのみ公開してください。可能な場合は、Funnel より Tailscale Serve を優先してください。
</Warning>

## 関連項目

- [CLI リファレンス](/ja-JP/cli)
- [音声通話プラグイン](/ja-JP/plugins/voice-call)

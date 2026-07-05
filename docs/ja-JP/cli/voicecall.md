---
read_when:
    - voice-call Pluginを使用していて、すべてのCLIエントリーポイントが必要な場合
    - setup、smoke、call、continue、speak、dtmf、end、status、tail、latency、expose、start のフラグ表とデフォルトが必要です
summary: '`openclaw voicecall` の CLI リファレンス（音声通話 Plugin コマンドサーフェス）'
title: 音声通話
x-i18n:
    generated_at: "2026-07-05T11:15:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aec445886cccb79c9212dd9f1f448ff9634274deb380632be786478c9bb29670
    source_path: cli/voicecall.md
    workflow: 16
---

# `openclaw voicecall`

`voicecall` はPlugin提供のコマンドです。音声通話Pluginがインストールされ、有効になっている場合にのみ表示されます。

Gatewayが実行中の場合、操作コマンド（`call`、`start`、`continue`、`speak`、`dtmf`、`end`、`status`）はそのGatewayの音声通話ランタイムへルーティングされます。到達可能なGatewayがない場合は、スタンドアロンCLIランタイムにフォールバックします。

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

| サブコマンド | 説明                                                            |
| ---------- | --------------------------------------------------------------- |
| `setup`    | プロバイダーとWebhookの準備状態チェックを表示します。           |
| `smoke`    | 準備状態チェックを実行します。`--yes` 指定時のみライブテスト通話を発信します。 |
| `call`     | 発信音声通話を開始します。                                      |
| `start`    | `call` のエイリアスです。`--to` が必須で、`--message` は任意です。 |
| `continue` | メッセージを読み上げ、次の応答を待ちます。                      |
| `speak`    | 応答を待たずにメッセージを読み上げます。                        |
| `dtmf`     | アクティブな通話にDTMF桁を送信します。                          |
| `end`      | アクティブな通話を切断します。                                  |
| `status`   | アクティブな通話を確認します（または `--call-id` で1件を確認します）。 |
| `tail`     | `calls.jsonl` をtailします（プロバイダーテスト中に便利です）。  |
| `latency`  | `calls.jsonl` からターンレイテンシのメトリクスを要約します。    |
| `expose`   | Webhookエンドポイント用のTailscale serve/funnelを切り替えます。 |

## セットアップとスモーク

### `setup`

デフォルトでは人間が読みやすい準備状態チェックを出力します。スクリプト用には `--json` を渡します。

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

### `smoke`

同じ準備状態チェックを実行します。実際の電話通話は、`--to` と `--yes` の両方がある場合にのみ発信します。

| フラグ             | デフォルト                      | 説明                                  |
| ------------------ | --------------------------------- | --------------------------------------- |
| `-t, --to <phone>` | （なし）                          | ライブスモークで発信する電話番号。    |
| `--message <text>` | `OpenClaw voice call smoke test.` | スモーク通話中に読み上げるメッセージ。 |
| `--mode <mode>`    | `notify`                          | 通話モード: `notify` または `conversation`。 |
| `--yes`            | `false`                           | 実際にライブの発信通話を行います。    |
| `--json`           | `false`                           | 機械可読JSONを出力します。             |

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"        # dry run
openclaw voicecall smoke --to "+15555550123" --yes  # live notify call
```

<Note>
外部プロバイダー（`plivo`、`telnyx`、`twilio`）では、`setup` と `smoke` に `publicUrl`、トンネル、またはTailscale公開による公開Webhook URLが必要です。キャリアが到達できないため、loopbackやプライベートserveのフォールバックは拒否されます。
</Note>

## 通話ライフサイクル

### `call`

発信音声通話を開始します。

| フラグ                 | 必須     | デフォルト      | 説明                                                                       |
| ---------------------- | -------- | ----------------- | -------------------------------------------------------------------------- |
| `-m, --message <text>` | はい     | （なし）         | 通話接続時に読み上げるメッセージ。                                        |
| `-t, --to <phone>`     | いいえ   | 設定 `toNumber`  | 発信先のE.164電話番号。                                                    |
| `--mode <mode>`        | いいえ   | `conversation`    | 通話モード: `notify`（メッセージ後に切断）または `conversation`（接続を維持）。 |

```bash
openclaw voicecall call --to "+15555550123" --message "Hello"
openclaw voicecall call -m "Heads up" --mode notify
```

### `start`

異なるデフォルトのフラグ形状を持つ `call` のエイリアスです。

| フラグ             | 必須     | デフォルト     | 説明                                  |
| ------------------ | -------- | -------------- | ---------------------------------------- |
| `--to <phone>`     | はい     | （なし）       | 発信先の電話番号。                     |
| `--message <text>` | いいえ   | （なし）       | 通話接続時に読み上げるメッセージ。     |
| `--mode <mode>`    | いいえ   | `conversation` | 通話モード: `notify` または `conversation`。 |

### `continue`

メッセージを読み上げ、応答を待ちます。

| フラグ             | 必須     | 説明              |
| ------------------ | -------- | ----------------- |
| `--call-id <id>`   | はい     | 通話ID。          |
| `--message <text>` | はい     | 読み上げるメッセージ。 |

### `speak`

応答を待たずにメッセージを読み上げます。

| フラグ             | 必須     | 説明              |
| ------------------ | -------- | ----------------- |
| `--call-id <id>`   | はい     | 通話ID。          |
| `--message <text>` | はい     | 読み上げるメッセージ。 |

### `dtmf`

アクティブな通話にDTMF桁を送信します。

| フラグ              | 必須     | 説明                                             |
| ------------------- | -------- | ------------------------------------------------ |
| `--call-id <id>`    | はい     | 通話ID。                                         |
| `--digits <digits>` | はい     | DTMF桁（例: 待機には `ww123456#`）。             |

### `end`

アクティブな通話を切断します。

| フラグ           | 必須     | 説明    |
| ---------------- | -------- | ------- |
| `--call-id <id>` | はい     | 通話ID。 |

### `status`

アクティブな通話を確認します。

| フラグ           | デフォルト | 説明                              |
| ---------------- | ---------- | --------------------------------- |
| `--call-id <id>` | （なし）   | 出力を1件の通話に制限します。     |
| `--json`         | `false`    | 機械可読JSONを出力します。        |

```bash
openclaw voicecall status
openclaw voicecall status --json
openclaw voicecall status --call-id <id>
```

## ログとメトリクス

### `tail`

音声通話のJSONLログをtailします。開始時に最後の `--since` 行を出力し、その後は書き込まれた新しい行をストリーミングします。

| フラグ          | デフォルト                 | 説明                              |
| --------------- | -------------------------- | --------------------------------- |
| `--file <path>` | Pluginストアから解決       | `calls.jsonl` へのパス。          |
| `--since <n>`   | `25`                       | tail前に出力する行数。            |
| `--poll <ms>`   | `250`（最小50）            | ポーリング間隔（ミリ秒）。        |

### `latency`

`calls.jsonl` からターンレイテンシと待ち受け待機のメトリクスを要約します。出力は `recordsScanned`、`turnLatency`、`listenWait` の要約を含むJSONです。

| フラグ          | デフォルト                 | 説明                                  |
| --------------- | -------------------------- | ------------------------------------- |
| `--file <path>` | Pluginストアから解決       | `calls.jsonl` へのパス。              |
| `--last <n>`    | `200`（最小1）             | 分析する最近のレコード数。            |

## Webhookの公開

### `expose`

音声Webhook用のTailscale serve/funnel設定を有効化、無効化、または変更します。

| フラグ                | デフォルト                              | 説明                                           |
| --------------------- | ----------------------------------------- | ----------------------------------------------- |
| `--mode <mode>`       | `funnel`                                  | `off`、`serve`（tailnet）、または `funnel`（公開）。 |
| `--path <path>`       | 設定 `tailscale.path` または `--serve-path` | 公開するTailscaleパス。                       |
| `--port <port>`       | 設定 `serve.port` または `3334`           | ローカルWebhookポート。                        |
| `--serve-path <path>` | 設定 `serve.path` または `/voice/webhook` | ローカルWebhookパス。                          |

```bash
openclaw voicecall expose --mode serve
openclaw voicecall expose --mode funnel
openclaw voicecall expose --mode off
```

<Warning>
信頼するネットワークにのみWebhookエンドポイントを公開してください。可能な場合はFunnelよりTailscale Serveを優先してください。
</Warning>

## 関連

- [CLIリファレンス](/ja-JP/cli)
- [音声通話Plugin](/ja-JP/plugins/voice-call)

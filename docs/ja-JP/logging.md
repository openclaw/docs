---
read_when:
    - 初心者向けの logging 概要が必要な場合
    - ログレベルやフォーマットを設定したい場合
    - トラブルシューティング中で、ログをすぐ見つける必要がある場合
summary: 'ログ概要: ファイルログ、コンソール出力、CLI tailing、および Control UI'
title: ログ概要
x-i18n:
    generated_at: "2026-04-24T05:06:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b6f274600bcb9f5597c91aa6c30512871105a3e0de446773394abbe27276058
    source_path: logging.md
    workflow: 15
---

# Logging

OpenClaw には主に 2 つのログ面があります:

- Gateway が書き込む **ファイルログ**（JSON lines）
- ターミナルと Gateway Debug UI に表示される **コンソール出力**

Control UI の **Logs** タブは gateway のファイルログを tail します。このページでは、
ログの保存場所、読み方、ログレベルやフォーマットの設定方法を説明します。

## ログの保存場所

デフォルトでは、Gateway は次の場所にローテーションするログファイルを書き込みます:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

日付は gateway ホストのローカルタイムゾーンを使います。

これは `~/.openclaw/openclaw.json` で上書きできます:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## ログの読み方

### CLI: ライブ tail（推奨）

CLI を使って RPC 経由で gateway ログファイルを tail します:

```bash
openclaw logs --follow
```

現在便利なオプション:

- `--local-time`: タイムスタンプをローカルタイムゾーンで表示
- `--url <url>` / `--token <token>` / `--timeout <ms>`: 標準 Gateway RPC フラグ
- `--expect-final`: エージェントバックエンド RPC の最終応答待機フラグ（共有クライアント層を通じてここでも受け付けられます）

出力モード:

- **TTY セッション**: 見やすく、色付きで、構造化されたログ行
- **非 TTY セッション**: プレーンテキスト
- `--json`: 行区切り JSON（1 行に 1 ログイベント）
- `--plain`: TTY セッションでもプレーンテキストを強制
- `--no-color`: ANSI カラーを無効化

明示的な `--url` を渡すと、CLI は設定や
環境認証情報を自動適用しません。対象 Gateway に認証が必要なら
`--token` も自分で指定してください。

JSON モードでは、CLI は `type` タグ付きオブジェクトを出力します:

- `meta`: ストリームメタデータ（ファイル、カーソル、サイズ）
- `log`: 解析済みログエントリ
- `notice`: truncation / rotation のヒント
- `raw`: 未解析のログ行

ローカル loopback Gateway が pairing を要求した場合、`openclaw logs` は
設定済みローカルログファイルへ自動フォールバックします。明示的な `--url` ターゲットでは
このフォールバックは使われません。

Gateway に到達できない場合、CLI は次を実行するよう短いヒントを表示します:

```bash
openclaw doctor
```

### Control UI（web）

Control UI の **Logs** タブは `logs.tail` を使って同じファイルを tail します。
開き方は [/web/control-ui](/ja-JP/web/control-ui) を参照してください。

### チャネル専用ログ

チャネルアクティビティ（WhatsApp / Telegram など）だけを絞り込みたい場合は:

```bash
openclaw channels logs --channel whatsapp
```

## ログフォーマット

### ファイルログ（JSONL）

ログファイルの各行は JSON オブジェクトです。CLI と Control UI はこれらの
エントリを解析して、構造化出力（時刻、レベル、サブシステム、メッセージ）を描画します。

### コンソール出力

コンソールログは **TTY 対応** で、読みやすさのために整形されています:

- サブシステム接頭辞（例: `gateway/channels/whatsapp`）
- レベルごとの色分け（info / warn / error）
- 任意の compact または JSON モード

コンソールフォーマットは `logging.consoleStyle` で制御します。

### Gateway WebSocket ログ

`openclaw gateway` には、RPC トラフィック向けの WebSocket プロトコルログもあります:

- 通常モード: 興味深い結果のみ（エラー、解析エラー、遅い呼び出し）
- `--verbose`: すべてのリクエスト / レスポンスのトラフィック
- `--ws-log auto|compact|full`: verbose レンダリングスタイルを選択
- `--compact`: `--ws-log compact` のエイリアス

例:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## logging の設定

logging 設定はすべて `~/.openclaw/openclaw.json` の `logging` 配下にあります。

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### ログレベル

- `logging.level`: **ファイルログ**（JSONL）のレベル
- `logging.consoleLevel`: **コンソール** の詳細度レベル

両方とも **`OPENCLAW_LOG_LEVEL`** 環境変数で上書きできます（例: `OPENCLAW_LOG_LEVEL=debug`）。この env var は設定ファイルより優先されるため、`openclaw.json` を編集せずに単一実行だけ詳細度を上げられます。さらに、グローバル CLI オプション **`--log-level <level>`**（例: `openclaw --log-level debug gateway run`）を渡すと、そのコマンドに限り環境変数より優先されます。

`--verbose` はコンソール出力と WS ログの詳細度にのみ影響し、
ファイルログレベルは変更しません。

### コンソールスタイル

`logging.consoleStyle`:

- `pretty`: 人向けで、色付き、タイムスタンプ付き
- `compact`: より密な出力（長時間セッション向け）
- `json`: 1 行ごとの JSON（ログ処理系向け）

### 秘匿化

ツール要約は、機微トークンがコンソールに出る前に秘匿化できます:

- `logging.redactSensitive`: `off` | `tools`（デフォルト: `tools`）
- `logging.redactPatterns`: デフォルトセットを上書きする regex 文字列のリスト

秘匿化は **コンソール出力にのみ** 影響し、ファイルログは変更しません。

## Diagnostics + OpenTelemetry

diagnostics は、モデル実行 **および**
メッセージフローテレメトリ（Webhook、キューイング、セッション状態）向けの構造化された機械可読イベントです。
これはログの代替ではなく、メトリクス、トレース、その他の exporter にデータを供給するためのものです。

diagnostics イベントはプロセス内で発行されますが、exporter が接続されるのは
diagnostics と exporter Plugin の両方が有効な場合だけです。

### OpenTelemetry と OTLP の違い

- **OpenTelemetry (OTel)**: traces、metrics、logs のデータモデル + SDK
- **OTLP**: OTel データを collector / backend に送るためのワイヤープロトコル
- OpenClaw は現在 **OTLP/HTTP (protobuf)** 経由でエクスポートします

### エクスポートされるシグナル

- **Metrics**: counters + histograms（token 使用量、メッセージフロー、キューイング）
- **Traces**: モデル使用 + Webhook / メッセージ処理の span
- **Logs**: `diagnostics.otel.logs` が有効なとき OTLP 経由でエクスポート。ログ量は
  多くなる可能性があるため、`logging.level` と exporter フィルタを意識してください。

### Diagnostic event カタログ

モデル使用量:

- `model.usage`: tokens、cost、duration、context、provider / model / channel、session ids

メッセージフロー:

- `webhook.received`: チャネルごとの Webhook 受信
- `webhook.processed`: Webhook 処理完了 + 所要時間
- `webhook.error`: Webhook ハンドラエラー
- `message.queued`: 処理キューへのメッセージ投入
- `message.processed`: 結果 + 所要時間 + 任意の error

キュー + セッション:

- `queue.lane.enqueue`: コマンドキューレーンへの投入 + 深さ
- `queue.lane.dequeue`: コマンドキューレーンからの取り出し + 待機時間
- `session.state`: セッション状態遷移 + 理由
- `session.stuck`: セッションスタック警告 + 経過時間
- `run.attempt`: 実行リトライ / 試行メタデータ
- `diagnostic.heartbeat`: 集約カウンタ（Webhooks / queue / session）

### diagnostics を有効化（exporter なし）

Plugin やカスタム sink から diagnostics イベントを使いたい場合はこれを使ってください:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### diagnostics flags（対象限定ログ）

`logging.level` を上げずに、限定的な追加デバッグログを有効にするには flags を使ってください。
flags は大文字小文字を区別せず、ワイルドカード（例: `telegram.*` や `*`）をサポートします。

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

env での上書き（単発）:

```
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

注記:

- flag ログは標準ログファイル（`logging.file` と同じ）へ書き込まれます。
- 出力には引き続き `logging.redactSensitive` による秘匿化が適用されます。
- 完全ガイド: [/diagnostics/flags](/ja-JP/diagnostics/flags)。

### OpenTelemetry へエクスポート

diagnostics は `diagnostics-otel` Plugin（OTLP/HTTP）経由でエクスポートできます。これは
OTLP/HTTP を受け付ける任意の OpenTelemetry collector / backend で動作します。

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": {
        "enabled": true
      }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true,
      "sampleRate": 0.2,
      "flushIntervalMs": 60000
    }
  }
}
```

注記:

- `openclaw plugins enable diagnostics-otel` でも Plugin を有効にできます。
- `protocol` は現在 `http/protobuf` のみサポートします。`grpc` は無視されます。
- metrics には、token 使用量、cost、context size、run duration、およびメッセージフロー
  counters / histograms（Webhooks、キューイング、セッション状態、キュー深度 / 待機）が含まれます。
- traces / metrics は `traces` / `metrics` で切り替え可能です（デフォルト: on）。traces
  には、モデル使用 span に加え、有効時は Webhook / メッセージ処理 span も含まれます。
- collector に認証が必要な場合は `headers` を設定してください。
- サポートされる環境変数: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.

### エクスポートされる metrics（名前 + 型）

モデル使用量:

- `openclaw.tokens`（counter, attrs: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`）
- `openclaw.cost.usd`（counter, attrs: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`）
- `openclaw.run.duration_ms`（histogram, attrs: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`）
- `openclaw.context.tokens`（histogram, attrs: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`）

メッセージフロー:

- `openclaw.webhook.received`（counter, attrs: `openclaw.channel`,
  `openclaw.webhook`）
- `openclaw.webhook.error`（counter, attrs: `openclaw.channel`,
  `openclaw.webhook`）
- `openclaw.webhook.duration_ms`（histogram, attrs: `openclaw.channel`,
  `openclaw.webhook`）
- `openclaw.message.queued`（counter, attrs: `openclaw.channel`,
  `openclaw.source`）
- `openclaw.message.processed`（counter, attrs: `openclaw.channel`,
  `openclaw.outcome`）
- `openclaw.message.duration_ms`（histogram, attrs: `openclaw.channel`,
  `openclaw.outcome`）

キュー + セッション:

- `openclaw.queue.lane.enqueue`（counter, attrs: `openclaw.lane`）
- `openclaw.queue.lane.dequeue`（counter, attrs: `openclaw.lane`）
- `openclaw.queue.depth`（histogram, attrs: `openclaw.lane` または
  `openclaw.channel=heartbeat`）
- `openclaw.queue.wait_ms`（histogram, attrs: `openclaw.lane`）
- `openclaw.session.state`（counter, attrs: `openclaw.state`, `openclaw.reason`）
- `openclaw.session.stuck`（counter, attrs: `openclaw.state`）
- `openclaw.session.stuck_age_ms`（histogram, attrs: `openclaw.state`）
- `openclaw.run.attempt`（counter, attrs: `openclaw.attempt`）

### エクスポートされる spans（名前 + 主要属性）

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.sessionKey`, `openclaw.sessionId`
  - `openclaw.tokens.*`（input / output / cache_read / cache_write / total）
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`,
    `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`,
    `openclaw.messageId`, `openclaw.sessionKey`, `openclaw.sessionId`,
    `openclaw.reason`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`,
    `openclaw.sessionKey`, `openclaw.sessionId`

### Sampling + flushing

- トレースサンプリング: `diagnostics.otel.sampleRate`（0.0–1.0、root spans のみ）
- メトリクスエクスポート間隔: `diagnostics.otel.flushIntervalMs`（最小 1000ms）

### プロトコルに関する注記

- OTLP/HTTP エンドポイントは `diagnostics.otel.endpoint` または
  `OTEL_EXPORTER_OTLP_ENDPOINT` で設定できます。
- エンドポイントにすでに `/v1/traces` または `/v1/metrics` が含まれていれば、そのまま使われます。
- エンドポイントにすでに `/v1/logs` が含まれていれば、ログ用にもそのまま使われます。
- `diagnostics.otel.logs` は、メイン logger 出力の OTLP ログエクスポートを有効にします。

### ログエクスポートの動作

- OTLP ログは `logging.file` に書き込まれるのと同じ構造化レコードを使います。
- `logging.level`（ファイルログレベル）に従います。コンソールの秘匿化は
  OTLP ログには適用されません。
- 大量ログ環境では、OTLP collector 側のサンプリング / フィルタリングを優先してください。

## トラブルシューティングのヒント

- **Gateway に到達できない？** まず `openclaw doctor` を実行してください。
- **ログが空？** Gateway が動作しており、`logging.file` のパスに
  書き込んでいることを確認してください。
- **もっと詳細が必要？** `logging.level` を `debug` または `trace` に上げて再試行してください。

## 関連

- [Gateway Logging Internals](/ja-JP/gateway/logging) — WS ログスタイル、サブシステム接頭辞、コンソールキャプチャ
- [Diagnostics](/ja-JP/gateway/configuration-reference#diagnostics) — OpenTelemetry エクスポートとキャッシュトレース設定

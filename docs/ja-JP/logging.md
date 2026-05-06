---
read_when:
    - OpenClaw のロギングについて、初心者向けの概要が必要です
    - ログレベル、形式、または秘匿化を設定したい場合
    - トラブルシューティング中で、ログをすばやく見つける必要がある
summary: ファイルログ、コンソール出力、CLI の tail 表示、Control UI のログタブ
title: ロギング
x-i18n:
    generated_at: "2026-05-06T05:11:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: abcdfeb0f9fbd13715762a1829198d0285738855c50f2ee531cab1e989d936b1
    source_path: logging.md
    workflow: 16
---

OpenClaw には主なログサーフェスが 2 つあります。

- Gateway によって書き込まれる **ファイルログ**（JSON lines）。
- ターミナルと Gateway デバッグ UI に表示される **コンソール出力**。

Control UI の **ログ** タブは Gateway ファイルログを追尾します。このページでは、ログの場所、読み方、ログレベルと形式の設定方法を説明します。

## ログの場所

デフォルトでは、Gateway はローリングログファイルを次の場所に書き込みます。

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

日付には Gateway ホストのローカルタイムゾーンが使われます。

各ファイルは `logging.maxFileBytes`（デフォルト: 100 MB）に達するとローテーションされます。OpenClaw はアクティブファイルの横に `openclaw-YYYY-MM-DD.1.log` のような番号付きアーカイブを最大 5 個保持し、診断情報を抑制する代わりに新しいアクティブログへ書き込み続けます。

これは `~/.openclaw/openclaw.json` で上書きできます。

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## ログの読み方

### CLI: ライブ追尾（推奨）

CLI を使って RPC 経由で Gateway ログファイルを追尾します。

```bash
openclaw logs --follow
```

現在の便利なオプション:

- `--local-time`: タイムスタンプをローカルタイムゾーンで表示する
- `--url <url>` / `--token <token>` / `--timeout <ms>`: 標準の Gateway RPC フラグ
- `--expect-final`: agent backed RPC の最終レスポンス待機フラグ（共有クライアント層経由でここでも受け付けられます）

出力モード:

- **TTY セッション**: 見やすく、色付きの構造化ログ行。
- **非 TTY セッション**: プレーンテキスト。
- `--json`: 行区切り JSON（1 行につき 1 つのログイベント）。
- `--plain`: TTY セッションでもプレーンテキストを強制する。
- `--no-color`: ANSI カラーを無効にする。

明示的な `--url` を渡す場合、CLI は設定や環境の認証情報を自動適用しません。対象 Gateway が認証を要求する場合は、自分で `--token` を含めてください。

JSON モードでは、CLI は `type` タグ付きオブジェクトを出力します。

- `meta`: ストリームメタデータ（ファイル、カーソル、サイズ）
- `log`: 解析済みログエントリ
- `notice`: 切り詰め / ローテーションのヒント
- `raw`: 未解析のログ行

暗黙の local loopback Gateway がペアリングを求めた場合、接続中に閉じた場合、または `logs.tail` が応答する前にタイムアウトした場合、`openclaw logs` は設定済みの Gateway ファイルログへ自動的にフォールバックします。明示的な `--url` 対象ではこのフォールバックは使われません。

Gateway に到達できない場合、CLI は次を実行するための短いヒントを表示します。

```bash
openclaw doctor
```

### Control UI（Web）

Control UI の **ログ** タブは、`logs.tail` を使って同じファイルを追尾します。開き方は [Control UI](/ja-JP/web/control-ui) を参照してください。

### チャンネル専用ログ

チャンネルのアクティビティ（WhatsApp/Telegram など）を絞り込むには、次を使います。

```bash
openclaw channels logs --channel whatsapp
```

## ログ形式

### ファイルログ（JSONL）

ログファイルの各行は JSON オブジェクトです。CLI と Control UI はこれらのエントリを解析し、構造化された出力（時刻、レベル、サブシステム、メッセージ）として表示します。

ファイルログの JSONL レコードには、利用可能な場合、機械的にフィルタ可能なトップレベルフィールドも含まれます。

- `hostname`: Gateway ホスト名。
- `message`: 全文検索用に平坦化されたログメッセージテキスト。
- `agent_id`: ログ呼び出しにエージェントコンテキストが含まれる場合のアクティブなエージェント ID。
- `session_id`: ログ呼び出しにセッションコンテキストが含まれる場合のアクティブなセッション ID/キー。
- `channel`: ログ呼び出しにチャンネルコンテキストが含まれる場合のアクティブなチャンネル。

OpenClaw はこれらのフィールドとあわせて元の構造化ログ引数も保持するため、番号付き tslog 引数キーを読む既存のパーサーも引き続き動作します。

### コンソール出力

コンソールログは **TTY 対応** で、読みやすいように形式化されます。

- サブシステムプレフィックス（例: `gateway/channels/whatsapp`）
- レベルの色分け（info/warn/error）
- 任意のコンパクトモードまたは JSON モード

コンソール形式は `logging.consoleStyle` で制御されます。

### Gateway WebSocket ログ

`openclaw gateway` には RPC トラフィック用の WebSocket プロトコルログもあります。

- 通常モード: 注目すべき結果のみ（エラー、解析エラー、遅い呼び出し）
- `--verbose`: すべてのリクエスト/レスポンストラフィック
- `--ws-log auto|compact|full`: 詳細表示のレンダリングスタイルを選択する
- `--compact`: `--ws-log compact` のエイリアス

例:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## ログの設定

すべてのログ設定は `~/.openclaw/openclaw.json` の `logging` 配下にあります。

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

- `logging.level`: **ファイルログ**（JSONL）のレベル。
- `logging.consoleLevel`: **コンソール** の詳細度レベル。

どちらも **`OPENCLAW_LOG_LEVEL`** 環境変数で上書きできます（例: `OPENCLAW_LOG_LEVEL=debug`）。環境変数は設定ファイルより優先されるため、`openclaw.json` を編集せずに 1 回の実行だけ詳細度を上げられます。グローバル CLI オプション **`--log-level <level>`**（例: `openclaw --log-level debug gateway run`）も渡せます。このオプションはそのコマンドで環境変数を上書きします。

`--verbose` はコンソール出力と WS ログの詳細度にのみ影響します。ファイルログレベルは変更しません。

### トレース相関

ファイルログは JSONL です。ログ呼び出しが有効な診断トレースコンテキストを持つ場合、OpenClaw はトレースフィールドをトップレベル JSON キー（`traceId`, `spanId`, `parentSpanId`, `traceFlags`）として書き込みます。これにより、外部ログプロセッサはその行を OTEL スパンやプロバイダーの `traceparent` 伝播と関連付けられます。

Gateway HTTP リクエストと Gateway WebSocket フレームは、内部リクエストトレーススコープを確立します。その非同期スコープ内で発行されたログと診断イベントは、明示的なトレースコンテキストを渡さない場合、リクエストトレースを継承します。エージェント実行とモデル呼び出しのトレースはアクティブなリクエストトレースの子になるため、ローカルログ、診断スナップショット、OTEL スパン、信頼済みプロバイダーの `traceparent` ヘッダーを、生のリクエストやモデル内容をログに記録せずに `traceId` で結合できます。

### モデル呼び出しのサイズとタイミング

モデル呼び出し診断は、生のプロンプトやレスポンス内容を取得せず、境界付けられたリクエスト/レスポンス測定値を記録します。

- `requestPayloadBytes`: 最終モデルリクエストペイロードの UTF-8 バイトサイズ
- `responseStreamBytes`: ストリーミングされたモデルレスポンスイベントの UTF-8 バイトサイズ
- `timeToFirstByteMs`: 最初のストリーミングレスポンスイベントまでの経過時間
- `durationMs`: モデル呼び出しの合計時間

これらのフィールドは、診断エクスポートが有効な場合、診断スナップショット、モデル呼び出し Plugin フック、OTEL モデル呼び出しスパン/メトリクスで利用できます。

### コンソールスタイル

`logging.consoleStyle`:

- `pretty`: 人間が読みやすく、色付きで、タイムスタンプ付き。
- `compact`: より詰めた出力（長いセッションに最適）。
- `json`: 1 行ごとの JSON（ログプロセッサ向け）。

### リダクション

OpenClaw は、機密トークンがコンソール出力、ファイルログ、OTLP ログレコード、永続化されたセッショントランスクリプトテキスト、または Control UI のツールイベントペイロード（ツール開始引数、部分/最終結果ペイロード、派生した exec 出力、パッチ要約）に到達する前にリダクトできます。

- `logging.redactSensitive`: `off` | `tools`（デフォルト: `tools`）
- `logging.redactPatterns`: デフォルトセットを上書きする正規表現文字列のリスト。カスタムパターンは、Control UI ツールペイロードについては組み込みデフォルトの上に適用されるため、パターンを追加してもデフォルトですでに捕捉される値のリダクションが弱まることはありません。

ファイルログとセッショントランスクリプトは JSONL のままですが、一致するシークレット値は、その行またはメッセージがディスクに書き込まれる前にマスクされます。リダクションはベストエフォートです。テキストを含むメッセージ内容とログ文字列に適用されますが、すべての識別子やバイナリペイロードフィールドに適用されるわけではありません。

組み込みデフォルトは、カード番号、CVC/CVV、共有支払いトークン、支払い認証情報など、一般的な API 認証情報と支払い認証情報のフィールド名が JSON フィールド、URL パラメーター、CLI フラグ、または代入として現れる場合をカバーします。

`logging.redactSensitive: "off"` は、この一般的なログ/トランスクリプトポリシーのみを無効にします。OpenClaw は、UI クライアント、サポートバンドル、診断オブザーバー、承認プロンプト、またはエージェントツールに表示されうる安全境界ペイロードについては引き続きリダクトします。例として、Control UI ツール呼び出しイベント、`sessions_history` 出力、診断サポートエクスポート、プロバイダーエラー観測、exec 承認コマンド表示、Gateway WebSocket プロトコルログがあります。カスタム `logging.redactPatterns` は、これらのサーフェスにもプロジェクト固有のパターンを追加できます。

## 診断と OpenTelemetry

診断は、モデル実行とメッセージフローテレメトリ（Webhook、キューイング、セッション状態）のための構造化された機械可読イベントです。ログを置き換えるものではありません。メトリクス、トレース、エクスポーターへ供給されます。イベントは、エクスポートするかどうかにかかわらずプロセス内で発行されます。

隣接する 2 つのサーフェス:

- **OpenTelemetry エクスポート** — OTLP/HTTP 経由で、任意の OpenTelemetry 互換コレクターまたはバックエンド（Grafana、Datadog、Honeycomb、New Relic、Tempo など）へメトリクス、トレース、ログを送信します。完全な設定、シグナルカタログ、メトリクス/スパン名、環境変数、プライバシーモデルは専用ページにあります: [OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry)。
- **診断フラグ** — `logging.level` を上げずに追加ログを `logging.file` へルーティングする、対象指定のデバッグログフラグ。フラグは大文字小文字を区別せず、ワイルドカード（`telegram.*`, `*`）をサポートします。`diagnostics.flags` 配下、または `OPENCLAW_DIAGNOSTICS=...` 環境上書きで設定します。完全なガイド: [診断フラグ](/ja-JP/diagnostics/flags)。

OTLP エクスポートなしで Plugin またはカスタムシンク向けの診断イベントを有効にするには:

```json5
{
  diagnostics: { enabled: true },
}
```

コレクターへの OTLP エクスポートについては、[OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry) を参照してください。

## トラブルシューティングのヒント

- **Gateway に到達できない?** まず `openclaw doctor` を実行してください。
- **ログが空?** Gateway が実行中で、`logging.file` のファイルパスへ書き込んでいることを確認してください。
- **さらに詳細が必要?** `logging.level` を `debug` または `trace` に設定して再試行してください。

## 関連

- [OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry) — OTLP/HTTP エクスポート、メトリクス/スパンカタログ、プライバシーモデル
- [診断フラグ](/ja-JP/diagnostics/flags) — 対象指定のデバッグログフラグ
- [Gateway ロギング内部](/ja-JP/gateway/logging) — WS ログスタイル、サブシステムプレフィックス、コンソールキャプチャ
- [設定リファレンス](/ja-JP/gateway/configuration-reference#diagnostics) — 完全な `diagnostics.*` フィールドリファレンス

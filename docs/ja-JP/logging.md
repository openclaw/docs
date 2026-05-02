---
read_when:
    - OpenClaw のログ記録について、初心者にもわかりやすい概要が必要です
    - ログレベル、形式、または秘匿化を設定したい場合
    - トラブルシューティング中で、ログをすばやく見つける必要がある
summary: ファイルログ、コンソール出力、CLI でのログ追尾、Control UI の「ログ」タブ
title: ログ記録
x-i18n:
    generated_at: "2026-05-02T04:59:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: d41ce5b1ae30fe1ca65577abe387fc266bd281686acb10098f82b8e78dfaa357
    source_path: logging.md
    workflow: 16
---

OpenClaw には主に 2 つのログ表示面があります。

- Gateway が書き込む **ファイルログ**（JSON 行）。
- ターミナルと Gateway Debug UI に表示される **コンソール出力**。

Control UI の **Logs** タブは Gateway のファイルログを tail します。このページでは、ログの場所、読み方、ログレベルと形式の設定方法を説明します。

## ログの場所

デフォルトでは、Gateway は次の場所にローテーションされるログファイルを書き込みます。

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

日付には Gateway ホストのローカルタイムゾーンが使われます。

各ファイルは `logging.maxFileBytes`（デフォルト: 100 MB）に達するとローテーションされます。OpenClaw はアクティブなファイルの横に、`openclaw-YYYY-MM-DD.1.log` のような番号付きアーカイブを最大 5 個まで保持し、診断情報を抑制するのではなく、新しいアクティブログへの書き込みを続けます。

これは `~/.openclaw/openclaw.json` で上書きできます。

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## ログの読み方

### CLI: ライブ tail（推奨）

CLI を使って RPC 経由で Gateway ログファイルを tail します。

```bash
openclaw logs --follow
```

現在便利なオプション:

- `--local-time`: タイムスタンプをローカルタイムゾーンで表示します
- `--url <url>` / `--token <token>` / `--timeout <ms>`: 標準の Gateway RPC フラグ
- `--expect-final`: エージェント backed RPC の最終応答待機フラグ（共有クライアント層経由でここでも受け付けられます）

出力モード:

- **TTY セッション**: 整形され、色付きの構造化ログ行。
- **非 TTY セッション**: プレーンテキスト。
- `--json`: 行区切り JSON（1 行につき 1 つのログイベント）。
- `--plain`: TTY セッションでもプレーンテキストを強制します。
- `--no-color`: ANSI 色を無効にします。

明示的な `--url` を渡すと、CLI は設定や環境の認証情報を自動適用しません。対象の Gateway で認証が必要な場合は、自分で `--token` を含めてください。

JSON モードでは、CLI は `type` タグ付きのオブジェクトを出力します。

- `meta`: ストリームメタデータ（ファイル、カーソル、サイズ）
- `log`: パース済みログエントリ
- `notice`: 切り詰め / ローテーションのヒント
- `raw`: パースされていないログ行

暗黙の local loopback Gateway がペアリングを要求した場合、接続中に閉じた場合、または `logs.tail` が応答する前にタイムアウトした場合、`openclaw logs` は設定済みの Gateway ファイルログに自動的にフォールバックします。明示的な `--url` 対象では、このフォールバックは使われません。

Gateway に到達できない場合、CLI は次を実行するための短いヒントを表示します。

```bash
openclaw doctor
```

### Control UI（Web）

Control UI の **Logs** タブは、`logs.tail` を使って同じファイルを tail します。開き方については [/web/control-ui](/ja-JP/web/control-ui) を参照してください。

### チャンネル専用ログ

チャンネルのアクティビティ（WhatsApp/Telegram など）をフィルタするには、次を使います。

```bash
openclaw channels logs --channel whatsapp
```

## ログ形式

### ファイルログ（JSONL）

ログファイル内の各行は JSON オブジェクトです。CLI と Control UI はこれらのエントリをパースして、構造化された出力（時刻、レベル、サブシステム、メッセージ）を表示します。

ファイルログの JSONL レコードには、利用可能な場合、機械的にフィルタ可能なトップレベルフィールドも含まれます。

- `hostname`: Gateway ホスト名。
- `message`: 全文検索用に平坦化されたログメッセージテキスト。
- `agent_id`: ログ呼び出しがエージェントコンテキストを持つ場合のアクティブなエージェント ID。
- `session_id`: ログ呼び出しがセッションコンテキストを持つ場合のアクティブなセッション ID/キー。
- `channel`: ログ呼び出しがチャンネルコンテキストを持つ場合のアクティブなチャンネル。

OpenClaw は、これらのフィールドと並んで元の構造化ログ引数を保持するため、番号付きの tslog 引数キーを読む既存のパーサーは引き続き動作します。

### コンソール出力

コンソールログは **TTY 対応**で、読みやすさを重視して整形されます。

- サブシステム接頭辞（例: `gateway/channels/whatsapp`）
- レベルごとの色付け（info/warn/error）
- 任意の compact モードまたは JSON モード

コンソールの整形は `logging.consoleStyle` で制御されます。

### Gateway WebSocket ログ

`openclaw gateway` には、RPC トラフィック用の WebSocket プロトコルログもあります。

- 通常モード: 注目すべき結果のみ（エラー、パースエラー、遅い呼び出し）
- `--verbose`: すべてのリクエスト/レスポンストラフィック
- `--ws-log auto|compact|full`: verbose 表示スタイルを選択します
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
- `logging.consoleLevel`: **コンソール**の詳細度レベル。

どちらも **`OPENCLAW_LOG_LEVEL`** 環境変数（例: `OPENCLAW_LOG_LEVEL=debug`）で上書きできます。環境変数は設定ファイルより優先されるため、`openclaw.json` を編集せずに 1 回の実行だけ詳細度を上げられます。グローバル CLI オプション **`--log-level <level>`**（例: `openclaw --log-level debug gateway run`）を渡すこともでき、そのコマンドについては環境変数を上書きします。

`--verbose` はコンソール出力と WS ログの詳細度にのみ影響します。ファイルログレベルは変更しません。

### トレース相関

ファイルログは JSONL です。ログ呼び出しが有効な診断トレースコンテキストを持つ場合、OpenClaw はトレースフィールドをトップレベルの JSON キー（`traceId`、`spanId`、`parentSpanId`、`traceFlags`）として書き込むため、外部ログプロセッサはその行を OTEL span やプロバイダーの `traceparent` 伝搬と相関できます。

Gateway HTTP リクエストと Gateway WebSocket フレームは内部リクエストトレーススコープを確立します。その非同期スコープ内で出力されるログと診断イベントは、明示的なトレースコンテキストを渡さない場合、リクエストトレースを継承します。エージェント実行とモデル呼び出しのトレースはアクティブなリクエストトレースの子になるため、ローカルログ、診断スナップショット、OTEL span、信頼済みプロバイダーの `traceparent` ヘッダーを、生のリクエスト内容やモデル内容をログに記録せずに `traceId` で結合できます。

### モデル呼び出しのサイズとタイミング

モデル呼び出しの診断は、生のプロンプトや応答内容を取得せずに、境界付けられたリクエスト/レスポンス測定値を記録します。

- `requestPayloadBytes`: 最終的なモデルリクエストペイロードの UTF-8 バイトサイズ
- `responseStreamBytes`: ストリーミングされたモデル応答イベントの UTF-8 バイトサイズ
- `timeToFirstByteMs`: 最初のストリーミング応答イベントまでの経過時間
- `durationMs`: モデル呼び出しの合計時間

これらのフィールドは、診断エクスポートが有効な場合、診断スナップショット、モデル呼び出し Plugin フック、OTEL モデル呼び出し span/メトリクスで利用できます。

### コンソールスタイル

`logging.consoleStyle`:

- `pretty`: 人間が読みやすく、色付きで、タイムスタンプ付き。
- `compact`: より詰めた出力（長いセッションに最適）。
- `json`: 1 行ごとの JSON（ログプロセッサ向け）。

### リダクション

OpenClaw は、機密トークンがコンソール出力、ファイルログ、OTLP ログレコード、永続化されたセッショントランスクリプトテキスト、または Control UI ツールイベントペイロード（ツール開始引数、部分/最終結果ペイロード、派生した exec 出力、パッチサマリー）に到達する前にリダクトできます。

- `logging.redactSensitive`: `off` | `tools`（デフォルト: `tools`）
- `logging.redactPatterns`: デフォルトセットを上書きする正規表現文字列のリスト。カスタムパターンは Control UI ツールペイロードの組み込みデフォルトに追加で適用されるため、パターンを追加しても、デフォルトですでに捕捉される値のリダクションが弱まることはありません。

ファイルログとセッショントランスクリプトは JSONL のままですが、一致したシークレット値は行またはメッセージがディスクに書き込まれる前にマスクされます。リダクションはベストエフォートです。テキストを含むメッセージ内容とログ文字列には適用されますが、すべての識別子やバイナリペイロードフィールドに適用されるわけではありません。

組み込みデフォルトは、カード番号、CVC/CVV、共有支払いトークン、支払い認証情報などの一般的な API 認証情報および支払い認証情報のフィールド名が、JSON フィールド、URL パラメータ、CLI フラグ、または代入として現れる場合をカバーします。

`logging.redactSensitive: "off"` は、この一般的なログ/トランスクリプトポリシーだけを無効にします。OpenClaw は、UI クライアント、サポートバンドル、診断オブザーバー、承認プロンプト、またはエージェントツールに表示され得る安全境界ペイロードを引き続きリダクトします。例には、Control UI ツール呼び出しイベント、`sessions_history` 出力、診断サポートエクスポート、プロバイダーエラー観測、exec 承認コマンド表示、Gateway WebSocket プロトコルログが含まれます。カスタム `logging.redactPatterns` は、これらの表示面にもプロジェクト固有のパターンを追加できます。

## 診断と OpenTelemetry

診断は、モデル実行とメッセージフローテレメトリ（Webhook、キューイング、セッション状態）向けの、構造化された機械可読イベントです。ログを置き換えるものではありません。メトリクス、トレース、エクスポーターに供給されます。イベントは、エクスポートの有無にかかわらずプロセス内で出力されます。

隣接する 2 つの表示面:

- **OpenTelemetry エクスポート** — メトリクス、トレース、ログを OTLP/HTTP 経由で任意の OpenTelemetry 互換コレクターまたはバックエンド（Grafana、Datadog、Honeycomb、New Relic、Tempo など）に送信します。完全な設定、シグナルカタログ、メトリクス/span 名、環境変数、プライバシーモデルは専用ページにあります: [OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry)。
- **診断フラグ** — `logging.level` を上げずに追加ログを `logging.file` にルーティングする、対象を絞ったデバッグログフラグです。フラグは大文字と小文字を区別せず、ワイルドカード（`telegram.*`、`*`）をサポートします。`diagnostics.flags` 配下または `OPENCLAW_DIAGNOSTICS=...` 環境変数上書きで設定します。完全なガイド: [診断フラグ](/ja-JP/diagnostics/flags)。

OTLP エクスポートなしで Plugin やカスタム sink 向けに診断イベントを有効にするには:

```json5
{
  diagnostics: { enabled: true },
}
```

コレクターへの OTLP エクスポートについては、[OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry) を参照してください。

## トラブルシューティングのヒント

- **Gateway に到達できない場合** まず `openclaw doctor` を実行してください。
- **ログが空の場合** Gateway が実行中で、`logging.file` のファイルパスに書き込んでいることを確認してください。
- **さらに詳細が必要な場合** `logging.level` を `debug` または `trace` に設定して再試行してください。

## 関連

- [OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry) — OTLP/HTTP エクスポート、メトリクス/span カタログ、プライバシーモデル
- [診断フラグ](/ja-JP/diagnostics/flags) — 対象を絞ったデバッグログフラグ
- [Gateway ログ内部](/ja-JP/gateway/logging) — WS ログスタイル、サブシステム接頭辞、コンソールキャプチャ
- [設定リファレンス](/ja-JP/gateway/configuration-reference#diagnostics) — 完全な `diagnostics.*` フィールドリファレンス

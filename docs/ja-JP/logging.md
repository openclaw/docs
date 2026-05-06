---
read_when:
    - OpenClaw ロギングの初心者向け概要が必要です
    - ログレベル、形式、または秘匿化を設定したい
    - トラブルシューティング中で、ログをすばやく見つける必要がある
summary: ファイルログ、コンソール出力、CLI の tailing、Control UI の「ログ」タブ
title: ロギング
x-i18n:
    generated_at: "2026-05-06T17:58:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 218f68c5111b6de01dc14707dad132d15d5e78c8e906af8a5416e618807663ac
    source_path: logging.md
    workflow: 16
---

OpenClaw には主に 2 つのログサーフェスがあります。

- Gateway が書き込む **ファイルログ**（JSON lines）。
- ターミナルと Gateway デバッグ UI に表示される **コンソール出力**。

Control UI の **ログ** タブは Gateway ファイルログを追尾します。このページでは、ログの保存場所、読み方、ログレベルと形式の設定方法を説明します。

## ログの保存場所

デフォルトでは、Gateway はローリングログファイルを次の場所に書き込みます。

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

日付には Gateway ホストのローカルタイムゾーンが使用されます。

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

CLI を使用して RPC 経由で Gateway ログファイルを追尾します。

```bash
openclaw logs --follow
```

現在有用なオプション:

- `--local-time`: タイムスタンプをローカルタイムゾーンで表示
- `--url <url>` / `--token <token>` / `--timeout <ms>`: 標準の Gateway RPC フラグ
- `--expect-final`: エージェントベース RPC の最終応答待機フラグ（共有クライアントレイヤー経由でここでも受け付けられます）

出力モード:

- **TTY セッション**: 整形され、色付きで、構造化されたログ行。
- **非 TTY セッション**: プレーンテキスト。
- `--json`: 行区切り JSON（1 行につき 1 つのログイベント）。
- `--plain`: TTY セッションでプレーンテキストを強制。
- `--no-color`: ANSI カラーを無効化。

明示的な `--url` を渡すと、CLI は設定や環境認証情報を自動適用しません。対象 Gateway が認証を必要とする場合は、自分で `--token` を含めてください。

JSON モードでは、CLI は `type` タグ付きオブジェクトを出力します。

- `meta`: ストリームメタデータ（ファイル、カーソル、サイズ）
- `log`: 解析済みログエントリ
- `notice`: 切り詰め / ローテーションのヒント
- `raw`: 未解析のログ行

暗黙の local loopback Gateway がペアリングを要求する、接続中に閉じる、または `logs.tail` が応答する前にタイムアウトした場合、`openclaw logs` は設定済みの Gateway ファイルログへ自動的にフォールバックします。明示的な `--url` 対象ではこのフォールバックは使用されません。

Gateway に到達できない場合、CLI は次を実行するための短いヒントを表示します。

```bash
openclaw doctor
```

### Control UI（Web）

Control UI の **ログ** タブは `logs.tail` を使用して同じファイルを追尾します。開き方は [Control UI](/ja-JP/web/control-ui) を参照してください。

### チャンネル専用ログ

チャンネルアクティビティ（WhatsApp/Telegram など）をフィルタするには、次を使用します。

```bash
openclaw channels logs --channel whatsapp
```

## ログ形式

### ファイルログ（JSONL）

ログファイルの各行は JSON オブジェクトです。CLI と Control UI はこれらのエントリを解析して、構造化された出力（時刻、レベル、サブシステム、メッセージ）を表示します。

ファイルログの JSONL レコードには、利用可能な場合、機械的にフィルタ可能なトップレベルフィールドも含まれます。

- `hostname`: Gateway ホスト名。
- `message`: 全文検索用にフラット化されたログメッセージテキスト。
- `agent_id`: ログ呼び出しがエージェントコンテキストを持つ場合のアクティブなエージェント ID。
- `session_id`: ログ呼び出しがセッションコンテキストを持つ場合のアクティブなセッション ID/キー。
- `channel`: ログ呼び出しがチャンネルコンテキストを持つ場合のアクティブなチャンネル。

OpenClaw はこれらのフィールドと並べて元の構造化ログ引数を保持するため、番号付き tslog 引数キーを読む既存のパーサーも引き続き動作します。

通話、リアルタイム音声、管理ルームのアクティビティは、この同じファイルログパイプラインを通じて、境界付きのライフサイクルログレコードを出力します。これらのレコードには、利用可能な場合、イベントタイプ、モード、トランスポート、プロバイダー、サイズ/タイミング測定値が含まれますが、トランスクリプトテキスト、音声ペイロード、ターン ID、通話 ID、プロバイダー項目 ID は省略されます。

### コンソール出力

コンソールログは **TTY 対応** で、読みやすさのために整形されます。

- サブシステムプレフィックス（例: `gateway/channels/whatsapp`）
- レベルの色分け（info/warn/error）
- 任意のコンパクトモードまたは JSON モード

コンソール形式は `logging.consoleStyle` で制御されます。

### Gateway WebSocket ログ

`openclaw gateway` には RPC トラフィック用の WebSocket プロトコルログもあります。

- 通常モード: 関心のある結果のみ（エラー、解析エラー、遅い呼び出し）
- `--verbose`: すべてのリクエスト/レスポンストラフィック
- `--ws-log auto|compact|full`: verbose の表示スタイルを選択
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

**`OPENCLAW_LOG_LEVEL`** 環境変数（例: `OPENCLAW_LOG_LEVEL=debug`）で両方を上書きできます。この環境変数は設定ファイルより優先されるため、`openclaw.json` を編集せずに 1 回の実行だけ詳細度を上げられます。グローバル CLI オプション **`--log-level <level>`**（例: `openclaw --log-level debug gateway run`）を渡すこともでき、このコマンドでは環境変数を上書きします。

`--verbose` はコンソール出力と WS ログの詳細度にのみ影響します。ファイルログレベルは変更しません。

### トレース相関

ファイルログは JSONL です。ログ呼び出しが有効な診断トレースコンテキストを持つ場合、OpenClaw は外部ログプロセッサーがその行を OTEL span とプロバイダーの `traceparent` 伝播に関連付けられるように、トレースフィールドをトップレベル JSON キー（`traceId`、`spanId`、`parentSpanId`、`traceFlags`）として書き込みます。

Gateway HTTP リクエストと Gateway WebSocket フレームは内部リクエストトレーススコープを確立します。その非同期スコープ内で出力されるログと診断イベントは、明示的なトレースコンテキストを渡さない場合、リクエストトレースを継承します。エージェント実行とモデル呼び出しのトレースはアクティブなリクエストトレースの子になるため、生のリクエスト内容やモデル内容をログに記録せずに、ローカルログ、診断スナップショット、OTEL span、信頼済みプロバイダーの `traceparent` ヘッダーを `traceId` で結合できます。

OpenTelemetry ログエクスポートが有効な場合、通話ライフサイクルログレコードもファイルログと同じ境界付き属性を使用して OTLP ログへ流れます。

### モデル呼び出しのサイズとタイミング

モデル呼び出し診断は、生のプロンプトやレスポンス内容をキャプチャせずに、境界付きのリクエスト/レスポンス測定値を記録します。

- `requestPayloadBytes`: 最終モデルリクエストペイロードの UTF-8 バイトサイズ
- `responseStreamBytes`: ストリーミングされたモデルレスポンスイベントの UTF-8 バイトサイズ
- `timeToFirstByteMs`: 最初のストリーミングレスポンスイベントまでの経過時間
- `durationMs`: モデル呼び出しの合計所要時間

診断エクスポートが有効な場合、これらのフィールドは診断スナップショット、モデル呼び出し Plugin フック、OTEL モデル呼び出し span/メトリクスで利用できます。

### コンソールスタイル

`logging.consoleStyle`:

- `pretty`: 人が読みやすい、色付き、タイムスタンプ付き。
- `compact`: より詰めた出力（長時間セッションに最適）。
- `json`: 1 行ごとの JSON（ログプロセッサー向け）。

### リダクション

OpenClaw は、機密トークンがコンソール出力、ファイルログ、OTLP ログレコード、永続化されたセッショントランスクリプトテキスト、または Control UI のツールイベントペイロード（ツール開始引数、部分/最終結果ペイロード、派生した exec 出力、パッチ概要）に到達する前にリダクトできます。

- `logging.redactSensitive`: `off` | `tools`（デフォルト: `tools`）
- `logging.redactPatterns`: デフォルトセットを上書きする正規表現文字列のリスト。Control UI ツールペイロードでは、カスタムパターンは組み込みデフォルトの上に適用されるため、パターンを追加しても、デフォルトですでに捕捉される値のリダクションが弱まることはありません。

ファイルログとセッショントランスクリプトは JSONL のままですが、一致するシークレット値は行またはメッセージがディスクへ書き込まれる前にマスクされます。リダクションはベストエフォートです。テキストを含むメッセージ内容とログ文字列に適用されますが、すべての識別子やバイナリペイロードフィールドに適用されるわけではありません。

組み込みデフォルトは、JSON フィールド、URL パラメーター、CLI フラグ、または代入として現れるカード番号、CVC/CVV、共有決済トークン、決済認証情報など、一般的な API 認証情報と決済認証情報フィールド名を対象にします。

`logging.redactSensitive: "off"` は、この一般的なログ/トランスクリプトポリシーのみを無効にします。OpenClaw は引き続き、UI クライアント、サポートバンドル、診断オブザーバー、承認プロンプト、またはエージェントツールに表示され得る安全境界ペイロードをリダクトします。例には、Control UI ツール呼び出しイベント、`sessions_history` 出力、診断サポートエクスポート、プロバイダーエラー観測、exec 承認コマンド表示、Gateway WebSocket プロトコルログが含まれます。カスタム `logging.redactPatterns` は、これらのサーフェスにもプロジェクト固有のパターンを追加できます。

## 診断と OpenTelemetry

診断は、モデル実行とメッセージフローテレメトリ（Webhook、キューイング、セッション状態）のための、構造化された機械可読イベントです。ログを置き換えるものではありません。メトリクス、トレース、エクスポーターに供給されます。イベントは、エクスポートの有無にかかわらずプロセス内で出力されます。

隣接する 2 つのサーフェス:

- **OpenTelemetry エクスポート** — メトリクス、トレース、ログを OTLP/HTTP 経由で任意の OpenTelemetry 互換コレクターまたはバックエンド（Grafana、Datadog、Honeycomb、New Relic、Tempo など）へ送信します。完全な設定、シグナルカタログ、メトリクス/span 名、環境変数、プライバシーモデルは専用ページにあります: [OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry)。
- **診断フラグ** — `logging.level` を上げずに追加ログを `logging.file` へルーティングする、対象を絞ったデバッグログフラグです。フラグは大文字小文字を区別せず、ワイルドカード（`telegram.*`、`*`）をサポートします。`diagnostics.flags` 配下、または `OPENCLAW_DIAGNOSTICS=...` 環境上書きで設定します。完全なガイド: [診断フラグ](/ja-JP/diagnostics/flags)。

OTLP エクスポートなしで Plugin またはカスタム sink 向けに診断イベントを有効にするには:

```json5
{
  diagnostics: { enabled: true },
}
```

コレクターへの OTLP エクスポートについては、[OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry) を参照してください。

## トラブルシューティングのヒント

- **Gateway に到達できませんか?** まず `openclaw doctor` を実行してください。
- **ログが空ですか?** Gateway が実行中で、`logging.file` のファイルパスへ書き込んでいることを確認してください。
- **さらに詳細が必要ですか?** `logging.level` を `debug` または `trace` に設定して再試行してください。

## 関連

- [OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry) — OTLP/HTTP エクスポート、メトリクス/span カタログ、プライバシーモデル
- [診断フラグ](/ja-JP/diagnostics/flags) — 対象を絞ったデバッグログフラグ
- [Gateway ログ内部](/ja-JP/gateway/logging) — WS ログスタイル、サブシステムプレフィックス、コンソールキャプチャ
- [設定リファレンス](/ja-JP/gateway/configuration-reference#diagnostics) — 完全な `diagnostics.*` フィールドリファレンス

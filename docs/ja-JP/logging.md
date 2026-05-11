---
read_when:
    - OpenClaw のロギングに関する初心者向けの概要が必要です
    - ログレベル、フォーマット、またはマスキングを設定したい場合
    - トラブルシューティング中でログをすばやく見つける必要がある
summary: ファイルログ、コンソール出力、CLI での tail 表示、コントロール UI のログタブ
title: ロギング
x-i18n:
    generated_at: "2026-05-11T20:33:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49b28755998bbe667dd986ae8440d9006d03b0704679bb6d64b5a148a25fc50e
    source_path: logging.md
    workflow: 16
---

OpenClaw には、主に 2 つのログ面があります。

- Gateway によって書き込まれる **ファイルログ** (JSON lines)。
- ターミナルと Gateway デバッグ UI に表示される **コンソール出力**。

Control UI の **ログ** タブは、gateway ファイルログを tail します。このページでは、ログの保存場所、読み方、ログレベルと形式の設定方法を説明します。

## ログの保存場所

デフォルトでは、Gateway は次の場所にローリングログファイルを書き込みます。

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

日付には、gateway ホストのローカルタイムゾーンが使われます。

各ファイルは `logging.maxFileBytes` (デフォルト: 100 MB) に達するとローテーションされます。
OpenClaw は、アクティブファイルの横に `openclaw-YYYY-MM-DD.1.log` のような番号付きアーカイブを最大 5 個保持し、診断情報を抑制するのではなく、新しいアクティブログへの書き込みを続けます。

これは `~/.openclaw/openclaw.json` で上書きできます。

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## ログの読み方

### CLI: ライブ tail (推奨)

CLI を使って、RPC 経由で gateway ログファイルを tail します。

```bash
openclaw logs --follow
```

現在有用なオプション:

- `--local-time`: タイムスタンプをローカルタイムゾーンで表示
- `--url <url>` / `--token <token>` / `--timeout <ms>`: 標準の Gateway RPC フラグ
- `--expect-final`: agent-backed RPC の final-response 待機フラグ (共有クライアント層経由でここでも受け付けられます)

出力モード:

- **TTY セッション**: 見やすく、色付きで、構造化されたログ行。
- **非 TTY セッション**: プレーンテキスト。
- `--json`: 行区切り JSON (1 行につき 1 ログイベント)。
- `--plain`: TTY セッションでプレーンテキストを強制。
- `--no-color`: ANSI カラーを無効化。

明示的な `--url` を渡すと、CLI は設定や環境の認証情報を自動適用しません。対象の Gateway が認証を必要とする場合は、自分で `--token` を含めてください。

JSON モードでは、CLI は `type` タグ付きオブジェクトを出力します。

- `meta`: ストリームメタデータ (ファイル、カーソル、サイズ)
- `log`: パース済みログエントリ
- `notice`: 切り詰め / ローテーションのヒント
- `raw`: パースできなかったログ行

暗黙の local loopback Gateway がペアリングを要求した場合、接続中に閉じた場合、または `logs.tail` が応答する前にタイムアウトした場合、`openclaw logs` は設定済みの Gateway ファイルログに自動的にフォールバックします。明示的な `--url` ターゲットでは、このフォールバックは使われません。

Gateway に到達できない場合、CLI は次を実行するための短いヒントを表示します。

```bash
openclaw doctor
```

### Control UI (Web)

Control UI の **ログ** タブは、`logs.tail` を使って同じファイルを tail します。
開き方については [Control UI](/ja-JP/web/control-ui) を参照してください。

### チャンネル専用ログ

チャンネルアクティビティ (WhatsApp/Telegram など) をフィルタするには、次を使います。

```bash
openclaw channels logs --channel whatsapp
```

## ログ形式

### ファイルログ (JSONL)

ログファイルの各行は JSON オブジェクトです。CLI と Control UI はこれらのエントリをパースし、構造化された出力 (時刻、レベル、サブシステム、メッセージ) を表示します。

ファイルログの JSONL レコードには、利用可能な場合、機械的にフィルタ可能なトップレベルフィールドも含まれます。

- `hostname`: gateway ホスト名。
- `message`: 全文検索用にフラット化されたログメッセージテキスト。
- `agent_id`: ログ呼び出しがエージェントコンテキストを持つ場合のアクティブエージェント ID。
- `session_id`: ログ呼び出しがセッションコンテキストを持つ場合のアクティブセッション ID/キー。
- `channel`: ログ呼び出しがチャンネルコンテキストを持つ場合のアクティブチャンネル。

OpenClaw は、これらのフィールドと一緒に元の構造化ログ引数を保持するため、番号付き tslog 引数キーを読む既存のパーサーは引き続き動作します。

会話、リアルタイム音声、管理ルームのアクティビティは、この同じファイルログパイプラインを通じて境界付きのライフサイクルログレコードを出力します。これらのレコードには、利用可能な場合、イベント種別、モード、トランスポート、プロバイダー、サイズ/タイミング測定値が含まれますが、トランスクリプトテキスト、音声ペイロード、ターン ID、通話 ID、プロバイダーアイテム ID は省略されます。

### コンソール出力

コンソールログは **TTY 対応** で、読みやすい形式に整形されます。

- サブシステムプレフィックス (例: `gateway/channels/whatsapp`)
- レベルの色分け (info/warn/error)
- 任意のコンパクトモードまたは JSON モード

コンソールの整形は `logging.consoleStyle` で制御されます。

### Gateway WebSocket ログ

`openclaw gateway` には、RPC トラフィック用の WebSocket プロトコルログもあります。

- 通常モード: 注目すべき結果のみ (エラー、パースエラー、遅い呼び出し)
- `--verbose`: すべてのリクエスト/レスポンストラフィック
- `--ws-log auto|compact|full`: 詳細表示のレンダリングスタイルを選択
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

- `logging.level`: **ファイルログ** (JSONL) のレベル。
- `logging.consoleLevel`: **コンソール** の詳細度レベル。

**`OPENCLAW_LOG_LEVEL`** 環境変数で両方を上書きできます (例: `OPENCLAW_LOG_LEVEL=debug`)。環境変数は設定ファイルより優先されるため、`openclaw.json` を編集せずに 1 回の実行だけ詳細度を上げられます。グローバル CLI オプション **`--log-level <level>`** (例: `openclaw --log-level debug gateway run`) も渡せます。これは、そのコマンドについて環境変数を上書きします。

`--verbose` が影響するのはコンソール出力と WS ログの詳細度のみです。ファイルログレベルは変更しません。

### 対象を絞ったモデル転送診断

プロバイダー呼び出しをデバッグする場合は、すべてのログを `debug` に上げるのではなく、対象を絞った環境フラグを使います。

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

利用可能なフラグ:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: リクエスト開始、fetch レスポンス、SDK ヘッダー、最初のストリーミングイベント、ストリーム完了、トランスポートエラーを `info` レベルで出力。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: モデルリクエストログに、境界付きのリクエストペイロード要約を含める。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: ペイロード要約に、モデル向けの全ツール名を含める。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: 秘匿化され、上限付きの JSON ペイロードスナップショットを含める。デバッグ中のみ使用してください。シークレットは秘匿化されますが、プロンプトやメッセージテキストは残る場合があります。
- `OPENCLAW_DEBUG_SSE=events`: 最初のイベントとストリーム完了のタイミングを出力。
- `OPENCLAW_DEBUG_SSE=peek`: さらに、秘匿化された最初の 5 件の SSE イベントペイロードを、イベントごとに上限付きで出力。
- `OPENCLAW_DEBUG_CODE_MODE=1`: コードモードのモデル面診断を出力します。コードモードがツール面を所有しているためにネイティブプロバイダーツールが非表示になる場合も含みます。

これらのフラグは通常の OpenClaw ログを通じて記録されるため、`openclaw logs --follow` と Control UI のログタブに表示されます。フラグなしでも、同じ診断は `debug` レベルで利用できます。

### トレース相関

ファイルログは JSONL です。ログ呼び出しが有効な診断トレースコンテキストを持つ場合、OpenClaw はトレースフィールドをトップレベル JSON キー (`traceId`、`spanId`、`parentSpanId`、`traceFlags`) として書き込みます。これにより、外部ログプロセッサはその行を OTEL span やプロバイダーの `traceparent` 伝播と相関できます。

Gateway HTTP リクエストと Gateway WebSocket フレームは、内部リクエストトレーススコープを確立します。その async スコープ内で出力されるログと診断イベントは、明示的なトレースコンテキストを渡していない場合、リクエストトレースを継承します。エージェント実行とモデル呼び出しのトレースはアクティブなリクエストトレースの子になるため、ローカルログ、診断スナップショット、OTEL span、信頼されたプロバイダーの `traceparent` ヘッダーを、生のリクエストやモデル内容をログに記録せずに `traceId` で結合できます。

Talk ライフサイクルログレコードも、OpenTelemetry ログエクスポートが有効な場合、ファイルログと同じ境界付き属性を使って OTLP ログへ流れます。

### モデル呼び出しのサイズとタイミング

モデル呼び出し診断は、生のプロンプトやレスポンス内容を取得せずに、境界付きのリクエスト/レスポンス測定値を記録します。

- `requestPayloadBytes`: 最終的なモデルリクエストペイロードの UTF-8 バイトサイズ
- `responseStreamBytes`: ストリーミングされたモデルレスポンスイベントの UTF-8 バイトサイズ
- `timeToFirstByteMs`: 最初のストリーミングレスポンスイベントまでの経過時間
- `durationMs`: モデル呼び出しの合計時間

これらのフィールドは、診断スナップショット、モデル呼び出し Plugin フック、診断エクスポートが有効な場合の OTEL モデル呼び出し span/メトリクスで利用できます。

### コンソールスタイル

`logging.consoleStyle`:

- `pretty`: 人が読みやすく、色付きで、タイムスタンプ付き。
- `compact`: より詰まった出力 (長いセッションに最適)。
- `json`: 1 行ごとの JSON (ログプロセッサ向け)。

### 秘匿化

OpenClaw は、機密トークンがコンソール出力、ファイルログ、OTLP ログレコード、永続化されたセッショントランスクリプトテキスト、または Control UI ツールイベントペイロード (ツール開始引数、部分/最終結果ペイロード、派生 exec 出力、パッチ要約) に到達する前に秘匿化できます。

- `logging.redactSensitive`: `off` | `tools` (デフォルト: `tools`)
- `logging.redactPatterns`: デフォルトセットを上書きする正規表現文字列のリスト。カスタムパターンは、Control UI ツールペイロードの組み込みデフォルトの上に適用されるため、パターンを追加しても、デフォルトで既に検出される値の秘匿化が弱まることはありません。

ファイルログとセッショントランスクリプトは JSONL のままですが、一致するシークレット値は、行またはメッセージがディスクに書き込まれる前にマスクされます。秘匿化はベストエフォートです。テキストを含むメッセージ内容とログ文字列に適用されますが、すべての識別子やバイナリペイロードフィールドに適用されるわけではありません。

組み込みデフォルトは、カード番号、CVC/CVV、共有支払いトークン、支払い認証情報など、一般的な API 認証情報と支払い認証情報フィールド名を対象にします。これらが JSON フィールド、URL パラメータ、CLI フラグ、または代入として現れる場合に適用されます。

`logging.redactSensitive: "off"` は、この一般的なログ/トランスクリプトポリシーのみを無効にします。OpenClaw は、UI クライアント、サポートバンドル、診断オブザーバー、承認プロンプト、またはエージェントツールに表示され得る安全境界ペイロードを引き続き秘匿化します。例には、Control UI ツール呼び出しイベント、`sessions_history` 出力、診断サポートエクスポート、プロバイダーエラー観測、exec 承認コマンド表示、Gateway WebSocket プロトコルログが含まれます。カスタム `logging.redactPatterns` は、これらの面にもプロジェクト固有のパターンを追加できます。

## 診断と OpenTelemetry

診断は、モデル実行とメッセージフローテレメトリ (webhook、キューイング、セッション状態) のための、構造化された機械可読イベントです。これはログを置き換えるものではありません。メトリクス、トレース、エクスポーターへ供給されます。イベントは、エクスポートするかどうかに関係なくプロセス内で出力されます。

隣接する面は 2 つあります。

- **OpenTelemetry エクスポート** — メトリクス、トレース、ログを OTLP/HTTP 経由で任意の OpenTelemetry 互換コレクターまたはバックエンド (Grafana、Datadog、Honeycomb、New Relic、Tempo など) に送信します。完全な設定、シグナルカタログ、メトリクス/span 名、環境変数、プライバシーモデルは専用ページにあります:
  [OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry)。
- **診断フラグ** — `logging.level` を上げずに追加ログを `logging.file` にルーティングする、対象を絞ったデバッグログフラグです。フラグは大文字小文字を区別せず、ワイルドカード (`telegram.*`、`*`) をサポートします。`diagnostics.flags` 配下、または `OPENCLAW_DIAGNOSTICS=...` 環境上書きで設定します。完全なガイド:
  [診断フラグ](/ja-JP/diagnostics/flags)。

OTLP エクスポートなしで、Plugin またはカスタム sink の診断イベントを有効にするには:

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
- [Gateway ログの内部](/ja-JP/gateway/logging) — WS ログスタイル、サブシステムプレフィックス、コンソールキャプチャ
- [設定リファレンス](/ja-JP/gateway/configuration-reference#diagnostics) — 完全な `diagnostics.*` フィールドリファレンス

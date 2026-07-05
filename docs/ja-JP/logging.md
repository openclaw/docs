---
read_when:
    - OpenClaw のロギングに関する初心者向けの概要が必要です
    - ログレベル、形式、または秘匿化を設定したい
    - トラブルシューティング中で、ログをすばやく見つける必要がある
summary: ファイルログ、コンソール出力、CLI テーリング、および Control UI のログタブ
title: ログ記録
x-i18n:
    generated_at: "2026-07-05T11:34:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: add41e125c22ca1b2343a3a1fb1e88e94ef9c81a07c48b9eb67f4d4b2510dd08
    source_path: logging.md
    workflow: 16
---

OpenClaw には主に 2 つのログサーフェスがあります。

- Gateway が書き込む **ファイルログ**（JSON lines）。
- Gateway を実行しているターミナルの **コンソール出力**。

Control UI の **ログ** タブは Gateway ファイルログを追尾します。このページでは、
ログの保存場所、読み方、ログレベルと形式の設定方法を説明します。

## ログの保存場所

デフォルトでは、Gateway は日ごとにローテーションするログファイルを書き込みます。

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

日付には Gateway ホストのローカルタイムゾーンが使われます。`/tmp/openclaw` が安全でない、
または利用できない場合（Windows では常に）、OpenClaw は代わりに OS の一時ディレクトリ配下の
ユーザースコープの `openclaw-<uid>` ディレクトリを使います。日付付きログファイルは
24 時間後に削除されます。

各ファイルは、次の書き込みで `logging.maxFileBytes`
（デフォルト: 100 MB）を超える場合にローテーションします。OpenClaw はアクティブなファイルの横に
`openclaw-YYYY-MM-DD.1.log` など最大 5 個の番号付きアーカイブを保持し、
診断を抑制する代わりに新しいアクティブログへ書き込み続けます。

`~/.openclaw/openclaw.json` でパスを上書きできます。

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## ログの読み方

### CLI: ライブ追尾（推奨）

RPC 経由で Gateway ログファイルを追尾します。

```bash
openclaw logs --follow
```

オプション:

| フラグ              | デフォルト | 動作                                                                                  |
| ------------------- | ---------- | ------------------------------------------------------------------------------------- |
| `--follow`          | オフ       | 追尾を継続し、切断時はバックオフ付きで再接続します                                    |
| `--limit <n>`       | `200`      | 1 回の取得あたりの最大行数                                                            |
| `--max-bytes <n>`   | `250000`   | 1 回の取得あたりに読み取る最大バイト数                                                |
| `--interval <ms>`   | `1000`     | 追尾中のポーリング間隔                                                                |
| `--json`            | オフ       | 行区切り JSON（1 行に 1 イベント）                                                    |
| `--plain`           | オフ       | TTY セッションでプレーンテキストを強制します                                          |
| `--no-color`        | —          | ANSI 色を無効化します                                                                 |
| `--utc`             | オフ       | タイムスタンプを UTC で表示します（デフォルトはローカル時刻）                         |
| `--local-time`      | オフ       | ローカル時刻デフォルト用の互換スペルとして受け付けられます。それ以外の効果はありません |
| `--url` / `--token` | —          | 標準の Gateway RPC フラグ                                                             |
| `--timeout <ms>`    | `30000`    | Gateway RPC タイムアウト                                                              |
| `--expect-final`    | オフ       | エージェント支援 RPC の最終応答待機フラグ（共有クライアント層経由でここでも受け付け） |

出力モード:

- **TTY セッション**: 見やすく色付きの構造化ログ行。
- **非 TTY セッション**: プレーンテキスト。

明示的な `--url` を渡した場合、CLI は設定や環境の認証情報を自動適用しません。
自分で `--token` を含めてください。含めない場合、呼び出しは
`gateway url override requires explicit credentials` で失敗します。

JSON モードでは、CLI は `type` タグ付きオブジェクトを出力します。

- `meta`: ストリームメタデータ（file、source、sourceKind、service、cursor、size）
- `log`: パース済みログエントリ
- `notice`: 切り詰め / ローテーションのヒント
- `raw`: 未パースのログ行
- `error`: Gateway 接続失敗（stderr に書き込み）

暗黙の local loopback Gateway がペアリングを要求した場合、接続中に閉じた場合、
または `logs.tail` が応答する前にタイムアウトした場合、`openclaw logs` は設定済みの
Gateway ファイルログへ自動的にフォールバックします。明示的な `--url` ターゲットでは
このフォールバックは使われません。`openclaw logs --follow` はより厳格です。Linux では、
利用可能な場合は PID によるアクティブなユーザー systemd Gateway ジャーナルを使い、
それ以外では古くなっている可能性のある横並びファイルを追尾する代わりに、
バックオフ付きでライブ Gateway を再試行します。

Gateway に到達できない場合、CLI は次を実行する短いヒントを表示します。

```bash
openclaw doctor
```

### Control UI（Web）

Control UI の **ログ** タブは、`logs.tail` を使って同じファイルを追尾します。
開き方は [Control UI](/ja-JP/web/control-ui) を参照してください。

### チャンネル専用ログ

チャンネル活動（WhatsApp/Telegram など）を絞り込むには、次を使います。

```bash
openclaw channels logs --channel whatsapp
```

`--channel` のデフォルトは `all` です。`--lines <n>`（デフォルト 200）と `--json` も
利用できます。

## ログ形式

### ファイルログ（JSONL）

ログファイルの各行は JSON オブジェクトです。CLI と Control UI はこれらのエントリをパースして、
構造化出力（時刻、レベル、サブシステム、メッセージ）を表示します。

ファイルログの JSONL レコードには、利用可能な場合、機械的にフィルター可能なトップレベルフィールドも含まれます。

- `hostname`: Gateway ホスト名。
- `message`: 全文検索用に平坦化されたログメッセージテキスト。
- `agent_id`: ログ呼び出しがエージェントコンテキストを持つ場合のアクティブなエージェント ID。
- `session_id`: ログ呼び出しがセッションコンテキストを持つ場合のアクティブなセッション ID/キー。
- `channel`: ログ呼び出しがチャンネルコンテキストを持つ場合のアクティブなチャンネル。

OpenClaw は、既存のパーサーが番号付き tslog 引数キーを読み続けられるように、
これらのフィールドと並べて元の構造化ログ引数を保持します。

会話、リアルタイム音声、管理対象ルームの活動は、この同じファイルログパイプラインを通じて
境界付きライフサイクルログレコードを出力します。これらのレコードには、利用可能な場合、
イベントタイプ、モード、トランスポート、プロバイダー、サイズ/タイミング測定が含まれますが、
トランスクリプトテキスト、音声ペイロード、ターン ID、通話 ID、プロバイダー項目 ID は省略されます。

### コンソール出力

コンソールログは **TTY 対応** で、読みやすいように整形されます。

- サブシステム接頭辞（例: `gateway/channels/whatsapp`）
- レベルの色分け（info/warn/error）
- オプションのコンパクトモードまたは JSON モード

コンソール整形は `logging.consoleStyle` で制御されます。

### Gateway WebSocket ログ

`openclaw gateway` には、RPC トラフィック用の WebSocket プロトコルログもあります。

- 通常モード: 注目すべき結果のみ（エラー、パースエラー、遅い呼び出し）
- `--verbose`: すべてのリクエスト/レスポンストラフィック
- `--ws-log auto|compact|full`: verbose 表示スタイルを選択
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

レベル: `silent`、`fatal`、`error`、`warn`、`info`、`debug`、`trace`。

- `logging.level`: **ファイルログ**（JSONL）のレベル（デフォルト: `info`）。
- `logging.consoleLevel`: **コンソール**の詳細度レベル。

**`OPENCLAW_LOG_LEVEL`** 環境変数（例: `OPENCLAW_LOG_LEVEL=debug`）で両方を上書きできます。この環境変数は設定ファイルより優先されるため、`openclaw.json` を編集せずに単一実行だけ詳細度を上げられます。グローバル CLI オプション **`--log-level <level>`**（例: `openclaw --log-level debug gateway run`）も渡せます。これは、そのコマンドについて環境変数を上書きします。

`--verbose` はコンソール出力と WS ログの詳細度にのみ影響します。ファイルログレベルは変更しません。

### 対象を絞ったモデルトランスポート診断

プロバイダー呼び出しをデバッグする場合は、すべてのログを `debug` に上げる代わりに、
対象を絞った環境フラグを使います。

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

利用可能なフラグ:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: リクエスト開始、fetch レスポンス、SDK
  ヘッダー、最初のストリーミングイベント、ストリーム完了、トランスポートエラーを
  `info` レベルで出力します。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: モデルリクエストログに境界付きのリクエストペイロード要約を含めます。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: ペイロード要約に、モデル向けのすべてのツール名を含めます。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: 編集済みで上限付きの JSON
  ペイロードスナップショットを含めます。デバッグ中にのみ使用してください。シークレットは編集されますが、
  プロンプトやメッセージテキストがまだ含まれる場合があります。
- `OPENCLAW_DEBUG_SSE=events`: 最初のイベントとストリーム完了のタイミングを出力します。
- `OPENCLAW_DEBUG_SSE=peek`: 最初の 5 件の編集済み SSE イベントペイロードも出力します。
  イベントごとに上限があります。
- `OPENCLAW_DEBUG_CODE_MODE=1`: ネイティブプロバイダーツールがコードモードによってツールサーフェスを所有しているために隠された場合を含め、
  コードモードのモデルサーフェス診断を出力します。

これらのフラグは通常の OpenClaw ログを通じて記録されるため、`openclaw logs --follow` と
Control UI のログタブに表示されます。フラグがない場合でも、同じ診断は `debug` レベルで利用できます。

`[model-fetch]` の開始およびレスポンスメタデータ（プロバイダー、API、モデル、ステータス、
レイテンシ、method、URL、timeout、proxy、policy などのリクエストフィールド）は、
`OPENCLAW_DEBUG_MODEL_TRANSPORT` に関係なく常に `info` レベルで出力されるため、
基本的なモデルトランスポートの健全性はデバッグフラグなしで確認できます。

### トレース相関

ファイルログは JSONL です。ログ呼び出しが有効な診断トレースコンテキストを持つ場合、
OpenClaw はトレースフィールドをトップレベル JSON キー（`traceId`、`spanId`、
`parentSpanId`、`traceFlags`）として書き込みます。これにより、外部ログプロセッサーは
その行を OTEL span やプロバイダーの `traceparent` 伝播と関連付けられます。

Gateway HTTP リクエストと Gateway WebSocket フレームは、内部リクエストトレーススコープを確立します。
その非同期スコープ内で出力されるログと診断イベントは、明示的なトレースコンテキストを渡していない場合、
リクエストトレースを継承します。エージェント実行とモデル呼び出しのトレースはアクティブな
リクエストトレースの子になるため、ローカルログ、診断スナップショット、OTEL span、
信頼済みプロバイダーの `traceparent` ヘッダーを、生のリクエストやモデルコンテンツをログに記録せずに
`traceId` で結合できます。

OpenTelemetry ログエクスポートが有効な場合、会話ライフサイクルログレコードも
ファイルログと同じ境界付き属性を使って diagnostics-otel ログエクスポートへ流れます。
`diagnostics.otel.logsExporter` を設定して、OTLP、stdout JSONL、または両方のシンクを選択します。

### モデル呼び出しのサイズとタイミング

モデル呼び出し診断は、生のプロンプトやレスポンス内容をキャプチャせずに、
境界付きのリクエスト/レスポンス測定を記録します。

- `requestPayloadBytes`: 最終的なモデルリクエストペイロードの UTF-8 バイトサイズ
- `responseStreamBytes`: ストリーミングされたモデルレスポンスチャンクペイロードの UTF-8 バイトサイズ。
  高頻度のテキスト、思考、ツール呼び出し delta イベントは、完全な `partial` スナップショットではなく、
  増分の `delta` バイトのみをカウントします。
- `timeToFirstByteMs`: 最初のストリーミングレスポンスイベントまでの経過時間
- `durationMs`: モデル呼び出しの合計時間

これらのフィールドは、診断エクスポートが有効な場合、診断スナップショット、
モデル呼び出し Plugin フック、OTEL モデル呼び出し span/メトリクスで利用できます。

### コンソールスタイル

`logging.consoleStyle`:

- `pretty`: 人間に読みやすく、色付きで、タイムスタンプ付き。
- `compact`: より詰めた出力（長いセッションに最適）。
- `json`: 1 行に 1 JSON（ログプロセッサー向け）。

### 編集

OpenClaw は、機微なトークンがコンソール出力、ファイルログ、OTLP ログレコード、
永続化されたセッショントランスクリプトテキスト、または Control UI ツール
イベントペイロード（ツール開始引数、部分/最終結果ペイロード、派生した
exec 出力、パッチ要約）に到達する前に編集できます。

- `logging.redactSensitive`: `off` | `tools`（デフォルト: `tools`）
- `logging.redactPatterns`: ログ/トランスクリプト出力用のデフォルトセットを置き換える regex 文字列のリスト。Control UI ツールペイロードでは、カスタムパターンは組み込みデフォルトの上に適用されるため、パターンを追加しても、デフォルトですでに捕捉される値の編集が弱まることはありません。

ファイルログとセッショントランスクリプトは JSONL のままですが、一致したシークレット値は
行またはメッセージがディスクへ書き込まれる前にマスクされます。編集はベストエフォートです。
テキストを含むメッセージ内容とログ文字列に適用されますが、すべての識別子やバイナリペイロードフィールドに適用されるわけではありません。

組み込みのデフォルトは、一般的な API 認証情報と、カード番号、CVC/CVV、共有支払いトークン、支払い認証情報などの支払い認証情報フィールド名が JSON フィールド、URL パラメーター、CLI フラグ、または代入として現れる場合を対象にします。

`logging.redactSensitive: "off"` は、この一般的なログ/トランスクリプトポリシーのみを無効にします。OpenClaw は、UI クライアント、サポートバンドル、診断オブザーバー、承認プロンプト、またはエージェントツールに表示される可能性がある安全境界のペイロードを引き続き秘匿します。例には、Control UI ツール呼び出しイベント、`sessions_history` 出力、診断サポートエクスポート、プロバイダーエラー観測、exec 承認コマンド表示、Gateway WebSocket プロトコルログが含まれます。カスタム `logging.redactPatterns` は、これらのサーフェスにプロジェクト固有のパターンを引き続き追加できます。

## 診断と OpenTelemetry

診断は、モデル実行とメッセージフローのテレメトリ（Webhook、キューイング、セッション状態）のための、構造化された機械可読イベントです。診断はログを**置き換えるものではありません**。メトリクス、トレース、エクスポーターに供給されます。イベントはデフォルトでプロセス内で発行されます（無効にするには `diagnostics.enabled: false` を設定します）。それらのエクスポートは別です。

隣接する 2 つのサーフェスがあります。

- **OpenTelemetry エクスポート** — OTLP/HTTP 経由で、任意の OpenTelemetry 互換コレクターまたはバックエンド（Datadog、Grafana、Honeycomb、New Relic、Tempo など）へメトリクス、トレース、ログを送信します。完全な設定、シグナルカタログ、メトリクス/span 名、env var、プライバシーモデルは専用ページにあります:
  [OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry)。
- **診断フラグ** — `logging.level` を上げずに追加ログを `logging.file` にルーティングする、対象を絞ったデバッグログフラグです。フラグは大文字と小文字を区別せず、ワイルドカード（`telegram.*`、`*`）をサポートします。`diagnostics.flags` の下、または `OPENCLAW_DIAGNOSTICS=...` env オーバーライド経由で設定します。完全なガイド:
  [診断フラグ](/ja-JP/diagnostics/flags)。

コレクターへの OTLP エクスポートについては、[OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry) を参照してください。

## トラブルシューティングのヒント

- **Gateway に到達できませんか？** まず `openclaw doctor` を実行してください。
- **ログが空ですか？** Gateway が実行中で、`logging.file` のファイルパスに書き込んでいることを確認してください。
- **さらに詳細が必要ですか？** `logging.level` を `debug` または `trace` に設定して再試行してください。

## 関連

- [OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry) — OTLP/HTTP エクスポート、メトリクス/span カタログ、プライバシーモデル
- [診断フラグ](/ja-JP/diagnostics/flags) — 対象を絞ったデバッグログフラグ
- [Gateway ログ内部構造](/ja-JP/gateway/logging) — WS ログスタイル、サブシステムプレフィックス、コンソールキャプチャ
- [設定リファレンス](/ja-JP/gateway/configuration-reference#diagnostics) — 完全な `diagnostics.*` フィールドリファレンス

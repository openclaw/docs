---
read_when:
    - OpenClaw のログについて初心者向けの概要が必要です
    - ログレベル、形式、または秘匿化を設定する場合
    - トラブルシューティング中で、ログをすばやく見つける必要がある場合
summary: ファイルログ、コンソール出力、CLI での追跡、および Control UI の Logs タブ
title: ログ記録
x-i18n:
    generated_at: "2026-07-11T22:22:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: add41e125c22ca1b2343a3a1fb1e88e94ef9c81a07c48b9eb67f4d4b2510dd08
    source_path: logging.md
    workflow: 16
---

OpenClaw には主に 2 つのログ表示領域があります。

- Gateway が書き込む**ファイルログ**（JSON Lines）。
- Gateway を実行しているターミナルの**コンソール出力**。

Control UI の**ログ**タブでは、Gateway のファイルログを追跡表示します。このページでは、
ログの保存場所、読み方、ログレベルと形式の設定方法について説明します。

## ログの保存場所

デフォルトでは、Gateway は日ごとにローテーションするログファイルを書き込みます。

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

日付には Gateway ホストのローカルタイムゾーンが使用されます。`/tmp/openclaw` が安全でない、
または利用できない場合（Windows では常に）、OpenClaw は代わりに OS の一時ディレクトリ配下にある
ユーザー単位の `openclaw-<uid>` ディレクトリを使用します。日付付きログファイルは
24 時間後に削除されます。

次の書き込みによって `logging.maxFileBytes`
（デフォルト: 100 MB）を超える場合、各ファイルはローテーションされます。OpenClaw は、
`openclaw-YYYY-MM-DD.1.log` のような番号付きアーカイブをアクティブファイルの隣に最大 5 個保持し、
診断情報の出力を抑止するのではなく、新しいアクティブログへの書き込みを続けます。

`~/.openclaw/openclaw.json` でパスを上書きできます。

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## ログの読み方

### CLI: リアルタイム追跡（推奨）

RPC 経由で Gateway のログファイルを追跡します。

```bash
openclaw logs --follow
```

オプション:

| フラグ              | デフォルト | 動作                                                                                                          |
| ------------------- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| `--follow`          | オフ       | 追跡を継続し、切断時にはバックオフしながら再接続する                                                        |
| `--limit <n>`       | `200`      | 1 回の取得あたりの最大行数                                                                                   |
| `--max-bytes <n>`   | `250000`   | 1 回の取得あたりに読み取る最大バイト数                                                                       |
| `--interval <ms>`   | `1000`     | 追跡中のポーリング間隔                                                                                       |
| `--json`            | オフ       | 行区切り JSON（1 行につき 1 イベント）                                                                       |
| `--plain`           | オフ       | TTY セッションでプレーンテキストを強制する                                                                   |
| `--no-color`        | —          | ANSI カラーを無効にする                                                                                      |
| `--utc`             | オフ       | タイムスタンプを UTC で表示する（デフォルトはローカル時刻）                                                  |
| `--local-time`      | オフ       | ローカル時刻をデフォルトとする設定の互換表記として受け付けられるが、それ以外の効果はない                      |
| `--url` / `--token` | —          | 標準の Gateway RPC フラグ                                                                                    |
| `--timeout <ms>`    | `30000`    | Gateway RPC のタイムアウト                                                                                   |
| `--expect-final`    | オフ       | エージェント基盤 RPC の最終応答待機フラグ（共有クライアント層を通じてここでも受け付けられる）                |

出力モード:

- **TTY セッション**: 見やすく色分けされた構造化ログ行。
- **非 TTY セッション**: プレーンテキスト。

明示的な `--url` を渡すと、CLI は設定または環境の認証情報を自動適用しません。
自分で `--token` を指定しない場合、呼び出しは
`gateway url override requires explicit credentials`
というエラーで失敗します。

JSON モードでは、CLI は `type` タグ付きオブジェクトを出力します。

- `meta`: ストリームのメタデータ（ファイル、ソース、ソース種別、サービス、カーソル、サイズ）
- `log`: 解析済みログエントリ
- `notice`: 切り詰め／ローテーションに関する通知
- `raw`: 未解析のログ行
- `error`: Gateway 接続エラー（stderr に書き込まれる）

暗黙の local loopback Gateway がペアリングを要求した場合、接続中に閉じた場合、
または `logs.tail` が応答する前にタイムアウトした場合、`openclaw logs` は
設定済みの Gateway ファイルログへ自動的にフォールバックします。明示的な `--url` の接続先では、
このフォールバックは使用されません。`openclaw logs --follow` はより厳格です。Linux では、
利用可能な場合は PID に基づいてアクティブユーザーの systemd Gateway ジャーナルを使用し、
そうでない場合は、古くなっている可能性がある隣接ファイルを追跡する代わりに、
バックオフしながら稼働中の Gateway への接続を再試行します。

Gateway に到達できない場合、CLI は次のコマンドを実行するよう短いヒントを表示します。

```bash
openclaw doctor
```

### Control UI（Web）

Control UI の**ログ**タブでは、`logs.tail` を使用して同じファイルを追跡します。
開き方については、[Control UI](/ja-JP/web/control-ui)を参照してください。

### チャネル専用ログ

チャネルのアクティビティ（WhatsApp／Telegram など）を絞り込むには、次を使用します。

```bash
openclaw channels logs --channel whatsapp
```

`--channel` のデフォルトは `all` です。`--lines <n>`（デフォルト 200）と `--json` も
利用できます。

## ログ形式

### ファイルログ（JSONL）

ログファイルの各行は JSON オブジェクトです。CLI と Control UI はこれらの
エントリを解析し、構造化された出力（時刻、レベル、サブシステム、メッセージ）を表示します。

ファイルログの JSONL レコードには、利用可能な場合、機械的なフィルタリングが可能な
次のトップレベルフィールドも含まれます。

- `hostname`: Gateway のホスト名。
- `message`: 全文検索用にフラット化されたログメッセージテキスト。
- `agent_id`: ログ呼び出しにエージェントコンテキストが含まれる場合のアクティブなエージェント ID。
- `session_id`: ログ呼び出しにセッションコンテキストが含まれる場合のアクティブなセッション ID／キー。
- `channel`: ログ呼び出しにチャネルコンテキストが含まれる場合のアクティブなチャネル。

OpenClaw は、これらのフィールドとともに元の構造化ログ引数を保持するため、
番号付きの tslog 引数キーを読み取る既存のパーサーも引き続き動作します。

通話、リアルタイム音声、管理対象ルームのアクティビティでは、同じファイルログパイプラインを通じて、
サイズが制限されたライフサイクルログレコードが出力されます。これらのレコードには、
利用可能な場合、イベント種別、モード、トランスポート、プロバイダー、サイズ／タイミング測定値が含まれますが、
文字起こしテキスト、音声ペイロード、ターン ID、通話 ID、プロバイダー項目 ID は省略されます。

### コンソール出力

コンソールログは **TTY 対応**で、読みやすい形式に整形されます。

- サブシステムの接頭辞（例: `gateway/channels/whatsapp`）
- レベルごとの色分け（情報／警告／エラー）
- オプションのコンパクトモードまたは JSON モード

コンソールの形式は `logging.consoleStyle` で制御します。

### Gateway WebSocket ログ

`openclaw gateway` には、RPC トラフィック用の WebSocket プロトコルログもあります。

- 通常モード: 注目すべき結果のみ（エラー、解析エラー、遅い呼び出し）
- `--verbose`: すべてのリクエスト／レスポンストラフィック
- `--ws-log auto|compact|full`: 詳細表示の形式を選択
- `--compact`: `--ws-log compact` の別名

例:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## ログの設定

すべてのログ設定は、`~/.openclaw/openclaw.json` の `logging` 配下にあります。

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

**`OPENCLAW_LOG_LEVEL`** 環境変数（例: `OPENCLAW_LOG_LEVEL=debug`）で両方を上書きできます。この環境変数は設定ファイルより優先されるため、`openclaw.json` を編集せずに、1 回の実行だけ詳細度を上げられます。グローバル CLI オプション **`--log-level <level>`**（例: `openclaw --log-level debug gateway run`）も指定でき、そのコマンドでは環境変数より優先されます。

`--verbose` はコンソール出力と WebSocket ログの詳細度にのみ影響し、
ファイルログのレベルは変更しません。

### 対象を絞ったモデルトランスポート診断

プロバイダー呼び出しをデバッグするときは、すべてのログを `debug` に上げる代わりに、
対象を絞った環境フラグを使用します。

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

利用可能なフラグ:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: リクエスト開始、fetch レスポンス、SDK
  ヘッダー、最初のストリーミングイベント、ストリーム完了、トランスポートエラーを
  `info` レベルで出力します。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: モデルリクエストログに、サイズが制限された
  リクエストペイロードの概要を含めます。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: ペイロードの概要に、モデルに公開される
  すべてのツール名を含めます。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: 秘匿化され、サイズ上限が適用された JSON
  ペイロードのスナップショットを含めます。デバッグ中にのみ使用してください。シークレットは秘匿化されますが、
  プロンプトやメッセージテキストが残る場合があります。
- `OPENCLAW_DEBUG_SSE=events`: 最初のイベントとストリーム完了のタイミングを出力します。
- `OPENCLAW_DEBUG_SSE=peek`: さらに、最初の 5 件の秘匿化済み SSE イベント
  ペイロードを、イベントごとの上限付きで出力します。
- `OPENCLAW_DEBUG_CODE_MODE=1`: コードモードがツール表示領域を所有するために
  ネイティブプロバイダーツールが非表示になる場合を含め、コードモードのモデル表示領域に関する診断を出力します。

これらのフラグは通常の OpenClaw ログ機構を通じて記録されるため、`openclaw logs --follow`
と Control UI のログタブに表示されます。フラグを指定しなくても、同じ診断情報は
`debug` レベルで引き続き利用できます。

`[model-fetch]` の開始およびレスポンスメタデータ（プロバイダー、API、モデル、ステータス、
レイテンシ、ならびにメソッド、URL、タイムアウト、プロキシ、ポリシーなどのリクエストフィールド）は、
`OPENCLAW_DEBUG_MODEL_TRANSPORT` の設定にかかわらず常に `info` レベルで出力されるため、
デバッグフラグなしでも基本的なモデルトランスポートの健全性を確認できます。

### トレースの関連付け

ファイルログは JSONL です。ログ呼び出しに有効な診断トレースコンテキストが含まれる場合、
OpenClaw はトレースフィールドをトップレベルの JSON キー（`traceId`、`spanId`、
`parentSpanId`、`traceFlags`）として書き込み、外部ログプロセッサーがその行を
OTEL スパンおよびプロバイダーの `traceparent` 伝播と関連付けられるようにします。

Gateway HTTP リクエストと Gateway WebSocket フレームは、内部リクエストトレーススコープを
確立します。その非同期スコープ内で出力されたログと診断イベントは、明示的なトレースコンテキストが
渡されていない場合、リクエストトレースを継承します。エージェント実行とモデル呼び出しのトレースは、
アクティブなリクエストトレースの子になるため、生のリクエスト内容やモデル内容をログに記録せずに、
ローカルログ、診断スナップショット、OTEL スパン、信頼済みプロバイダーの `traceparent` ヘッダーを
`traceId` で結合できます。

通話ライフサイクルのログレコードも、OpenTelemetry ログエクスポートが有効な場合、
ファイルログと同じ制限付き属性を使用して diagnostics-otel ログエクスポートへ送られます。
OTLP、標準出力 JSONL、または両方の出力先を選択するには、`diagnostics.otel.logsExporter` を設定します。

### モデル呼び出しのサイズとタイミング

モデル呼び出し診断は、生のプロンプトまたはレスポンス内容を取得せずに、
サイズが制限されたリクエスト／レスポンス測定値を記録します。

- `requestPayloadBytes`: 最終的なモデルリクエストペイロードの UTF-8 バイトサイズ
- `responseStreamBytes`: ストリーミングされたモデルレスポンスチャンクの
  ペイロードの UTF-8 バイトサイズ。高頻度のテキスト、思考、ツール呼び出しの差分イベントでは、
  完全な `partial` スナップショットではなく、増分の `delta` バイトのみを計上します。
- `timeToFirstByteMs`: 最初のストリーミングレスポンスイベントまでの経過時間
- `durationMs`: モデル呼び出しの合計所要時間

これらのフィールドは、診断エクスポートが有効な場合、診断スナップショット、
モデル呼び出し Plugin フック、OTEL のモデル呼び出しスパン／メトリクスで利用できます。

### コンソールスタイル

`logging.consoleStyle`:

- `pretty`: タイムスタンプと色付きの、人が読みやすい表示。
- `compact`: より簡潔な出力（長時間のセッションに最適）。
- `json`: 1 行ごとの JSON（ログプロセッサー向け）。

### 秘匿化

OpenClaw は、機密トークンがコンソール出力、ファイルログ、
OTLP ログレコード、保存されたセッション文字起こしテキスト、または Control UI のツール
イベントペイロード（ツール開始引数、部分／最終結果ペイロード、派生した
実行出力、パッチの概要）に到達する前に秘匿化できます。

- `logging.redactSensitive`: `off` | `tools`（デフォルト: `tools`）
- `logging.redactPatterns`: ログ／文字起こし出力用のデフォルトセットを置き換える正規表現文字列のリスト。Control UI のツールペイロードでは、カスタムパターンが組み込みデフォルトに追加適用されるため、パターンを追加しても、デフォルトですでに検出される値の秘匿化が弱まることはありません。

ファイルログとセッション文字起こしは JSONL のままですが、一致するシークレット値は、
行またはメッセージがディスクに書き込まれる前にマスクされます。秘匿化はベストエフォートです。
テキストを含むメッセージ内容とログ文字列には適用されますが、すべての
識別子やバイナリペイロードフィールドに適用されるわけではありません。

組み込みのデフォルトは、一般的な API 認証情報と、カード番号、CVC/CVV、共有決済トークン、決済認証情報などの決済認証情報フィールド名が、JSON フィールド、URL パラメータ、CLI フラグ、または代入として現れる場合に対応します。

`logging.redactSensitive: "off"` は、この一般的なログ／トランスクリプトポリシーのみを無効にします。OpenClaw は引き続き、UI クライアント、サポートバンドル、診断オブザーバー、承認プロンプト、またはエージェントツールに表示される可能性がある安全境界のペイロードを秘匿化します。例として、Control UI のツール呼び出しイベント、`sessions_history` の出力、診断サポートエクスポート、プロバイダーエラーの観測、exec 承認コマンドの表示、Gateway WebSocket プロトコルログがあります。カスタムの `logging.redactPatterns` を使用すると、これらのサーフェスにもプロジェクト固有のパターンを追加できます。

## 診断と OpenTelemetry

診断は、モデル実行とメッセージフローのテレメトリ（Webhook、キューイング、セッション状態）を対象とする、構造化された機械可読イベントです。ログを置き換えるものでは**ありません**。診断はメトリクス、トレース、エクスポーターにデータを供給します。デフォルトではイベントがプロセス内で生成されます（無効にするには `diagnostics.enabled: false` を設定します）。イベントのエクスポートは別途設定します。

隣接する 2 つのサーフェスがあります。

- **OpenTelemetry エクスポート** — OTLP/HTTP 経由で、メトリクス、トレース、ログを OpenTelemetry 互換の任意のコレクターまたはバックエンド（Datadog、Grafana、Honeycomb、New Relic、Tempo など）に送信します。完全な設定、シグナルカタログ、メトリクス／スパン名、環境変数、プライバシーモデルについては、専用ページを参照してください。
  [OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry)。
- **診断フラグ** — `logging.level` を上げることなく、追加のログを `logging.file` に送る、対象を絞ったデバッグログフラグです。フラグでは大文字と小文字が区別されず、ワイルドカード（`telegram.*`、`*`）も使用できます。`diagnostics.flags` で設定するか、`OPENCLAW_DIAGNOSTICS=...` 環境変数による上書きを使用します。完全なガイド：
  [診断フラグ](/ja-JP/diagnostics/flags)。

コレクターへの OTLP エクスポートについては、[OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry)を参照してください。

## トラブルシューティングのヒント

- **Gateway に接続できない場合**：まず `openclaw doctor` を実行してください。
- **ログが空の場合**：Gateway が実行中であり、`logging.file` のファイルパスに書き込んでいることを確認してください。
- **さらに詳細が必要な場合**：`logging.level` を `debug` または `trace` に設定して再試行してください。

## 関連項目

- [OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry) — OTLP/HTTP エクスポート、メトリクス／スパンカタログ、プライバシーモデル
- [診断フラグ](/ja-JP/diagnostics/flags) — 対象を絞ったデバッグログフラグ
- [Gateway ロギングの内部動作](/ja-JP/gateway/logging) — WS ログ形式、サブシステムのプレフィックス、コンソールキャプチャ
- [設定リファレンス](/ja-JP/gateway/configuration-reference#diagnostics) — `diagnostics.*` フィールドの完全なリファレンス

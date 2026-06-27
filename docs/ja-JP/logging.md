---
read_when:
    - OpenClaw ログの初心者向け概要が必要です
    - ログレベル、形式、またはリダクションを設定したい
    - トラブルシューティング中で、ログをすばやく見つける必要がある
summary: ファイルログ、コンソール出力、CLI テーリング、Control UI のログタブ
title: ロギング
x-i18n:
    generated_at: "2026-06-27T11:51:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: caf2780dfeeaf29f4ee94429894a03422b211a4414e63062642d1134f38b6b3f
    source_path: logging.md
    workflow: 16
---

OpenClaw には主に 2 つのログ表示面があります。

- Gateway が書き込む **ファイルログ**（JSON 行）。
- ターミナルと Gateway Debug UI に表示される **コンソール出力**。

Control UI の **ログ** タブは Gateway ファイルログを追尾します。このページでは、ログがどこに保存されるか、
ログの読み方、ログレベルと形式の設定方法を説明します。

## ログの保存場所

デフォルトでは、Gateway は次の場所にローテーションされるログファイルを書き込みます。

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

日付には Gateway ホストのローカルタイムゾーンが使用されます。

各ファイルは `logging.maxFileBytes`（デフォルト: 100 MB）に達するとローテーションされます。
OpenClaw はアクティブファイルの横に、`openclaw-YYYY-MM-DD.1.log` のような
番号付きアーカイブを最大 5 つ保持し、診断を抑制する代わりに新しいアクティブログへ書き込み続けます。

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

CLI を使用して、RPC 経由で Gateway ログファイルを追尾します。

```bash
openclaw logs --follow
```

現在有用なオプション:

- `--local-time`: タイムスタンプをローカルタイムゾーンで表示する
- `--url <url>` / `--token <token>` / `--timeout <ms>`: 標準の Gateway RPC フラグ
- `--expect-final`: エージェント支援 RPC の最終応答待機フラグ（共有クライアント層経由でここでも受け付けられます）

出力モード:

- **TTY セッション**: 見やすく、色付きの構造化ログ行。
- **非 TTY セッション**: プレーンテキスト。
- `--json`: 行区切り JSON（1 行につき 1 つのログイベント）。
- `--plain`: TTY セッションでプレーンテキストを強制する。
- `--no-color`: ANSI 色を無効にする。

明示的な `--url` を渡した場合、CLI は設定や環境認証情報を自動適用しません。対象の Gateway が認証を必要とする場合は、自分で `--token` を含めてください。

JSON モードでは、CLI は `type` タグ付きオブジェクトを出力します。

- `meta`: ストリームメタデータ（ファイル、カーソル、サイズ）
- `log`: 解析済みログエントリ
- `notice`: 切り詰め / ローテーションのヒント
- `raw`: 未解析のログ行

暗黙の local loopback Gateway がペアリングを要求する、接続中に閉じる、または
`logs.tail` が応答する前にタイムアウトする場合、`openclaw logs` は設定済みの Gateway ファイルログへ自動的にフォールバックします。明示的な `--url` 対象では、このフォールバックは使用されません。`openclaw logs --follow` はより厳密です。Linux では、利用可能な場合は PID によるアクティブなユーザー systemd Gateway ジャーナルを使用し、それ以外の場合は古くなっている可能性がある横並びのファイルを追尾する代わりに、ライブ Gateway を再試行し続けます。

Gateway に到達できない場合、CLI は次を実行するための短いヒントを表示します。

```bash
openclaw doctor
```

### Control UI（Web）

Control UI の **ログ** タブは、`logs.tail` を使用して同じファイルを追尾します。
開き方については [Control UI](/ja-JP/web/control-ui) を参照してください。

### チャンネル専用ログ

チャンネルアクティビティ（WhatsApp/Telegram など）をフィルタするには、次を使用します。

```bash
openclaw channels logs --channel whatsapp
```

## ログ形式

### ファイルログ（JSONL）

ログファイル内の各行は JSON オブジェクトです。CLI と Control UI はこれらのエントリを解析して、構造化出力（時刻、レベル、サブシステム、メッセージ）を表示します。

ファイルログ JSONL レコードには、利用可能な場合、機械でフィルタ可能なトップレベルフィールドも含まれます。

- `hostname`: Gateway ホスト名。
- `message`: 全文検索用に平坦化されたログメッセージテキスト。
- `agent_id`: ログ呼び出しがエージェントコンテキストを持つ場合のアクティブなエージェント ID。
- `session_id`: ログ呼び出しがセッションコンテキストを持つ場合のアクティブなセッション ID/キー。
- `channel`: ログ呼び出しがチャンネルコンテキストを持つ場合のアクティブなチャンネル。

OpenClaw は、これらのフィールドと並べて元の構造化ログ引数を保持するため、番号付き tslog 引数キーを読む既存のパーサーは引き続き動作します。

Talk、リアルタイム音声、管理対象ルームのアクティビティは、この同じファイルログパイプラインを通じて境界付きのライフサイクルログレコードを出力します。これらのレコードには、利用可能な場合、イベント種別、モード、トランスポート、プロバイダー、サイズ/タイミング測定値が含まれますが、文字起こしテキスト、音声ペイロード、ターン ID、通話 ID、プロバイダー項目 ID は省略されます。

### コンソール出力

コンソールログは **TTY 対応** で、読みやすさを重視して整形されます。

- サブシステムプレフィックス（例: `gateway/channels/whatsapp`）
- レベルの色分け（info/warn/error）
- 任意のコンパクトモードまたは JSON モード

コンソール形式は `logging.consoleStyle` で制御されます。

### Gateway WebSocket ログ

`openclaw gateway` には RPC トラフィック用の WebSocket プロトコルログもあります。

- 通常モード: 注目すべき結果のみ（エラー、解析エラー、遅い呼び出し）
- `--verbose`: すべてのリクエスト/レスポンストラフィック
- `--ws-log auto|compact|full`: verbose 表示スタイルを選択する
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

**`OPENCLAW_LOG_LEVEL`** 環境変数（例: `OPENCLAW_LOG_LEVEL=debug`）で両方を上書きできます。この環境変数は設定ファイルより優先されるため、`openclaw.json` を編集せずに単一の実行だけ詳細度を上げられます。グローバル CLI オプション **`--log-level <level>`**（例: `openclaw --log-level debug gateway run`）を渡すこともでき、そのコマンドでは環境変数を上書きします。

`--verbose` はコンソール出力と WS ログ詳細度にのみ影響します。ファイルログレベルは変更しません。

### 対象を絞ったモデルトランスポート診断

プロバイダー呼び出しをデバッグする場合、すべてのログを `debug` に上げる代わりに、対象を絞った環境フラグを使用します。

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
```

利用可能なフラグ:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: リクエスト開始、fetch レスポンス、SDK ヘッダー、最初のストリーミングイベント、ストリーム完了、トランスポートエラーを `info` レベルで出力します。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: モデルリクエストログに境界付きのリクエストペイロード概要を含めます。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: ペイロード概要に、モデル向けのすべてのツール名を含めます。
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: 編集済みで上限付きの JSON ペイロードスナップショットを含めます。デバッグ中にのみ使用してください。シークレットは編集されますが、プロンプトやメッセージテキストがまだ含まれる場合があります。
- `OPENCLAW_DEBUG_SSE=events`: 最初のイベントとストリーム完了のタイミングを出力します。
- `OPENCLAW_DEBUG_SSE=peek`: 最初の 5 つの編集済み SSE イベントペイロードも出力します。各イベントに上限があります。
- `OPENCLAW_DEBUG_CODE_MODE=1`: ネイティブプロバイダーツールが、コードモードがツール表示面を所有しているため非表示になる場合を含め、コードモードのモデル表示面診断を出力します。

これらのフラグは通常の OpenClaw ログ経由で記録されるため、`openclaw logs --follow` と Control UI のログタブに表示されます。フラグがない場合でも、同じ診断は `debug` レベルで利用できます。

`[model-fetch]` の開始とレスポンスメタデータ（プロバイダー、API、モデル、ステータス、レイテンシ、およびメソッド、URL、タイムアウト、プロキシ、ポリシーなどのリクエストフィールド）は、`OPENCLAW_DEBUG_MODEL_TRANSPORT` に関係なく常に `info` レベルで出力されるため、基本的なモデルトランスポートの健全性はデバッグフラグなしで確認できます。

### トレース相関

ファイルログは JSONL です。ログ呼び出しが有効な診断トレースコンテキストを持つ場合、OpenClaw はトレースフィールドをトップレベル JSON キー（`traceId`, `spanId`, `parentSpanId`, `traceFlags`）として書き込むため、外部ログプロセッサはその行を OTEL span やプロバイダーの `traceparent` 伝播と相関できます。

Gateway HTTP リクエストと Gateway WebSocket フレームは、内部リクエストトレーススコープを確立します。その非同期スコープ内で出力されたログと診断イベントは、明示的なトレースコンテキストを渡さない場合、リクエストトレースを継承します。エージェント実行とモデル呼び出しのトレースはアクティブなリクエストトレースの子になるため、ローカルログ、診断スナップショット、OTEL span、信頼済みプロバイダーの `traceparent` ヘッダーは、生のリクエストやモデル内容をログに記録せずに `traceId` で結合できます。

Talk ライフサイクルログレコードも、OpenTelemetry ログエクスポートが有効な場合、ファイルログと同じ境界付き属性を使用して diagnostics-otel ログエクスポートへ流れます。`diagnostics.otel.logsExporter` を設定して、OTLP、stdout JSONL、または両方のシンクを選択します。

### モデル呼び出しのサイズとタイミング

モデル呼び出し診断は、生のプロンプトやレスポンス内容を取得せずに、境界付きのリクエスト/レスポンス測定値を記録します。

- `requestPayloadBytes`: 最終的なモデルリクエストペイロードの UTF-8 バイトサイズ
- `responseStreamBytes`: ストリーミングされたモデルレスポンスチャンクペイロードの UTF-8 バイトサイズ。高頻度のテキスト、thinking、ツール呼び出し差分イベントは、完全な `partial` スナップショットではなく、増分の `delta` バイトのみを数えます。
- `timeToFirstByteMs`: 最初のストリーミングレスポンスイベントまでの経過時間
- `durationMs`: モデル呼び出しの合計時間

これらのフィールドは、診断エクスポートが有効な場合、診断スナップショット、モデル呼び出し Plugin フック、OTEL モデル呼び出し span/メトリクスで利用できます。

### コンソールスタイル

`logging.consoleStyle`:

- `pretty`: 人間に読みやすく、色付きで、タイムスタンプ付き。
- `compact`: より詰めた出力（長時間セッションに最適）。
- `json`: 1 行につき 1 つの JSON（ログプロセッサ向け）。

### 編集

OpenClaw は、機密トークンがコンソール出力、ファイルログ、OTLP ログレコード、永続化されたセッショントランスクリプトテキスト、または Control UI ツールイベントペイロード（ツール開始引数、部分/最終結果ペイロード、派生した exec 出力、パッチ概要）に到達する前に編集できます。

- `logging.redactSensitive`: `off` | `tools`（デフォルト: `tools`）
- `logging.redactPatterns`: デフォルトセットを上書きする regex 文字列のリスト。カスタムパターンは、Control UI ツールペイロードに対する組み込みデフォルトの上に適用されるため、パターンを追加しても、デフォルトですでに捕捉される値の編集が弱まることはありません。

ファイルログとセッショントランスクリプトは JSONL のままですが、一致するシークレット値は、行またはメッセージがディスクへ書き込まれる前にマスクされます。編集はベストエフォートです。テキストを含むメッセージ内容とログ文字列に適用されますが、すべての識別子やバイナリペイロードフィールドに適用されるわけではありません。

組み込みデフォルトは、カード番号、CVC/CVV、共有支払いトークン、支払い認証情報など、一般的な API 認証情報や支払い認証情報フィールド名が JSON フィールド、URL パラメーター、CLI フラグ、または代入として現れる場合を対象にします。

`logging.redactSensitive: "off"` は、この一般的なログ/トランスクリプトポリシーだけを無効にします。OpenClaw は、UI クライアント、サポートバンドル、診断オブザーバー、承認プロンプト、またはエージェントツールに表示され得る安全境界ペイロードを引き続き編集します。例には、Control UI ツール呼び出しイベント、`sessions_history` 出力、診断サポートエクスポート、プロバイダーエラー観測、exec 承認コマンド表示、Gateway WebSocket プロトコルログが含まれます。カスタム `logging.redactPatterns` は、それらの表示面にもプロジェクト固有のパターンを追加できます。

## 診断と OpenTelemetry

診断は、モデル実行とメッセージフローテレメトリ（Webhook、キューイング、セッション状態）のための、構造化された機械可読イベントです。これはログを置き換えるものではありません。メトリクス、トレース、エクスポーターへ供給されます。イベントは、エクスポートするかどうかに関係なくプロセス内で出力されます。

隣接する 2 つの表示面:

- **OpenTelemetry エクスポート** — メトリクス、トレース、ログを OTLP/HTTP 経由で OpenTelemetry 互換の任意のコレクターまたはバックエンド（Grafana、Datadog、Honeycomb、New Relic、Tempo など）へ送信します。完全な設定、シグナルカタログ、メトリクス/span 名、環境変数、プライバシーモデルは専用ページにあります:
  [OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry)。
- **診断フラグ** — `logging.level` を上げずに、追加ログを `logging.file` へ送る対象指定のデバッグログフラグ。フラグは大文字小文字を区別せず、ワイルドカード（`telegram.*`, `*`）をサポートします。`diagnostics.flags` 配下、または `OPENCLAW_DIAGNOSTICS=...` 環境上書きで設定します。完全なガイド:
  [診断フラグ](/ja-JP/diagnostics/flags)。

OTLP エクスポートなしで Plugin またはカスタムシンク向けに診断イベントを有効にするには:

```json5
{
  diagnostics: { enabled: true },
}
```

OTLP をコレクターへエクスポートする場合は、[OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry)を参照してください。

## トラブルシューティングのヒント

- **Gateway に到達できませんか？** まず `openclaw doctor` を実行してください。
- **ログが空ですか？** Gateway が実行中で、`logging.file` のファイルパスに書き込んでいることを確認してください。
- **さらに詳細が必要ですか？** `logging.level` を `debug` または `trace` に設定して再試行してください。

## 関連

- [OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry) — OTLP/HTTP エクスポート、メトリック/span カタログ、プライバシーモデル
- [診断フラグ](/ja-JP/diagnostics/flags) — 対象を絞ったデバッグログフラグ
- [Gateway ログ内部仕様](/ja-JP/gateway/logging) — WS ログスタイル、サブシステム接頭辞、コンソールキャプチャ
- [設定リファレンス](/ja-JP/gateway/configuration-reference#diagnostics) — 完全な `diagnostics.*` フィールドリファレンス

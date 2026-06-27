---
read_when:
    - ログ出力または形式の変更
    - CLI または Gateway 出力のデバッグ
summary: ログ記録サーフェス、ファイルログ、WSログスタイル、コンソール書式設定
title: Gateway ロギング
x-i18n:
    generated_at: "2026-06-27T11:30:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde5e589bb48cd8c41ac6dd0d74780fec1cc1ee79d82d433b4e7c7450dc5c8b6
    source_path: gateway/logging.md
    workflow: 16
---

# ロギング

ユーザー向けの概要（CLI + Control UI + 設定）については、[/logging](/ja-JP/logging) を参照してください。

OpenClaw には 2 つのログ「サーフェス」があります。

- **コンソール出力**（ターミナル / Debug UI で表示されるもの）。
- Gateway ロガーによって書き込まれる **ファイルログ**（JSON Lines）。

起動時に、Gateway は解決済みのデフォルトエージェントモデルを、新しいセッションに影響する
モードのデフォルトと合わせてログに記録します。例:

```text
agent model: openai/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` はデフォルトエージェント、モデルパラメーター、またはグローバルなエージェントデフォルトから取得されます。
未設定の場合、起動時のサマリーには `medium` と表示されます。`fast` はデフォルトエージェントまたはモデルの `fastMode` パラメーターから取得されます。

## ファイルベースのロガー

- デフォルトのローテーションログファイルは `/tmp/openclaw/` 配下にあります（1 日 1 ファイル）: `openclaw-YYYY-MM-DD.log`
  - 日付には Gateway ホストのローカルタイムゾーンが使用されます。
- アクティブなログファイルは `logging.maxFileBytes`（デフォルト: 100 MB）でローテーションされ、
  最大 5 つの番号付きアーカイブを保持し、新しいアクティブファイルへの書き込みを継続します。
- ログファイルのパスとレベルは `~/.openclaw/openclaw.json` で設定できます:
  - `logging.file`
  - `logging.level`

ファイル形式は 1 行につき 1 つの JSON オブジェクトです。

Talk、リアルタイム音声、管理対象ルームのコードパスは、境界のあるライフサイクル記録に共有ファイルロガーを使用します。
これらの記録は運用デバッグと OTLP ログエクスポートを目的としています。トランスクリプトテキスト、音声ペイロード、ターン ID、通話 ID、
プロバイダー項目 ID はログレコードにコピーされません。

Control UI の Logs タブは、Gateway（`logs.tail`）経由でこのファイルを tail します。
CLI でも同じことができます:

```bash
openclaw logs --follow
```

**詳細出力とログレベル**

- **ファイルログ** は `logging.level` のみによって制御されます。
- `--verbose` は **コンソールの詳細度**（および WS ログスタイル）にのみ影響します。**ファイルログレベルを上げることはありません**。
- 詳細出力でのみ出る情報をファイルログに取得するには、`logging.level` を `debug` または `trace` に設定します。
- トレースログには、Plugin ツールファクトリの準備など、選択されたホットパスの診断用タイミングサマリーも含まれます。
  [/tools/plugin#slow-plugin-tool-setup](/ja-JP/tools/plugin#slow-plugin-tool-setup) を参照してください。

## コンソールキャプチャ

CLI は `console.log/info/warn/error/debug/trace` をキャプチャしてファイルログに書き込み、
同時に stdout/stderr への出力も維持します。

コンソールの詳細度は、次の項目で独立して調整できます:

- `logging.consoleLevel`（デフォルト `info`）
- `logging.consoleStyle`（`pretty` | `compact` | `json`）

## 秘匿化

OpenClaw は、ログまたはトランスクリプト出力がプロセス外へ出る前に、機密トークンをマスクできます。
このロギング秘匿化ポリシーは、コンソール、ファイルログ、OTLP ログレコード、セッショントランスクリプトテキストの出力先に適用されるため、
一致するシークレット値は JSONL 行やメッセージがディスクへ書き込まれる前にマスクされます。

- `logging.redactSensitive`: `off` | `tools`（デフォルト: `tools`）
- `logging.redactPatterns`: 正規表現文字列の配列（デフォルトを上書き）
  - 生の正規表現文字列（自動 `gi`）、またはカスタムフラグが必要な場合は `/pattern/flags` を使用します。
  - 一致箇所は、先頭 6 文字 + 末尾 4 文字（長さ >= 18）を残してマスクされます。それ以外は `***` になります。
  - デフォルトでは、一般的なキー代入、CLI フラグ、JSON フィールド、Bearer ヘッダー、PEM ブロック、よく使われるトークン接頭辞、カード番号、CVC/CVV、共有支払いトークン、支払い認証情報などの支払い認証情報フィールド名を対象にします。

一部の安全境界では、`logging.redactSensitive` に関係なく常に秘匿化されます。
これには、Control UI のツール呼び出しイベント、`sessions_history` ツール出力、
診断サポートエクスポート、プロバイダーエラー観測、exec 承認コマンド表示、
Gateway WebSocket プロトコルログが含まれます。これらのサーフェスでは追加パターンとして
`logging.redactPatterns` を引き続き使用できますが、`redactSensitive: "off"` にしても
生のシークレットを出力することはありません。

## Gateway WebSocket ログ

Gateway は WebSocket プロトコルログを 2 つのモードで出力します:

- **通常モード（`--verbose` なし）**: 「注目すべき」RPC 結果のみを出力します:
  - エラー（`ok=false`）
  - 遅い呼び出し（デフォルトしきい値: `>= 50ms`）
  - パースエラー
- **詳細モード（`--verbose`）**: すべての WS リクエスト/レスポンストラフィックを出力します。

### WS ログスタイル

`openclaw gateway` は Gateway ごとのスタイル切り替えに対応しています:

- `--ws-log auto`（デフォルト）: 通常モードは最適化され、詳細モードでは compact 出力を使用します
- `--ws-log compact`: 詳細モード時の compact 出力（対応するリクエスト/レスポンス）
- `--ws-log full`: 詳細モード時のフレームごとの完全な出力
- `--compact`: `--ws-log compact` のエイリアス

例:

```bash
# optimized (only errors/slow)
openclaw gateway

# show all WS traffic (paired)
openclaw gateway --verbose --ws-log compact

# show all WS traffic (full meta)
openclaw gateway --verbose --ws-log full
```

## コンソールフォーマット（サブシステムロギング）

コンソールフォーマッターは **TTY 対応** で、一貫したプレフィックス付きの行を出力します。
サブシステムロガーは出力をグループ化し、読み取りやすく保ちます。

挙動:

- すべての行に **サブシステムプレフィックス**（例: `[gateway]`、`[canvas]`、`[tailscale]`）
- **サブシステムカラー**（サブシステムごとに安定）とレベルの色分け
- **出力先が TTY、または環境が高機能ターミナルのように見える場合に色を使用**（`TERM`/`COLORTERM`/`TERM_PROGRAM`）、`NO_COLOR` を尊重
- **短縮されたサブシステムプレフィックス**: 先頭の `gateway/` + `channels/` を落とし、最後の 2 セグメントを保持（例: `whatsapp/outbound`）
- **サブシステム別のサブロガー**（自動プレフィックス + 構造化フィールド `{ subsystem }`）
- QR/UX 出力用の **`logRaw()`**（プレフィックスなし、フォーマットなし）
- **コンソールスタイル**（例: `pretty | compact | json`）
- ファイルログレベルとは別の **コンソールログレベル**（`logging.level` が `debug`/`trace` に設定されている場合、ファイルには完全な詳細が保持されます）
- **WhatsApp メッセージ本文** は `debug` でログに記録されます（表示するには `--verbose` を使用）

これにより、既存のファイルログを安定したまま保ちつつ、対話的な出力を読み取りやすくできます。

## 関連

- [ロギング](/ja-JP/logging)
- [OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry)
- [診断エクスポート](/ja-JP/gateway/diagnostics)

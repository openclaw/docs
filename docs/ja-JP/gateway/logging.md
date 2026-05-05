---
read_when:
    - ログ出力や形式の変更
    - CLI または Gateway 出力のデバッグ
summary: ログ記録サーフェス、ファイルログ、WS ログスタイル、コンソールの書式設定
title: Gateway のロギング
x-i18n:
    generated_at: "2026-05-05T01:46:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: d49ca112d3cc4ec76ecfc8b14d16dae64f74ca1f761fdb2b7bb470f73b66a246
    source_path: gateway/logging.md
    workflow: 16
---

# ロギング

ユーザー向けの概要（CLI + Control UI + 設定）については、[/logging](/ja-JP/logging) を参照してください。

OpenClaw には 2 つのログ「サーフェス」があります。

- **コンソール出力**（ターミナル / Debug UI に表示されるもの）。
- Gateway ロガーによって書き込まれる **ファイルログ**（JSON lines）。

起動時に、Gateway は解決済みのデフォルトエージェントモデルを、新しいセッションに影響するモードのデフォルトとともにログに記録します。例:

```text
agent model: openai-codex/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` はデフォルトエージェント、モデルパラメータ、またはグローバルエージェントデフォルトから取得されます。未設定の場合、起動時の要約には `medium` と表示されます。`fast` はデフォルトエージェントまたはモデルの `fastMode` パラメータから取得されます。

## ファイルベースのロガー

- デフォルトのローテーションログファイルは `/tmp/openclaw/` 配下にあります（1 日 1 ファイル）: `openclaw-YYYY-MM-DD.log`
  - 日付には Gateway ホストのローカルタイムゾーンが使用されます。
- アクティブなログファイルは `logging.maxFileBytes`（デフォルト: 100 MB）でローテーションされ、最大 5 つの番号付きアーカイブを保持しつつ、新しいアクティブファイルへの書き込みを続けます。
- ログファイルのパスとレベルは `~/.openclaw/openclaw.json` で設定できます。
  - `logging.file`
  - `logging.level`

ファイル形式は 1 行につき 1 つの JSON オブジェクトです。

Control UI の Logs タブは、Gateway（`logs.tail`）経由でこのファイルを tail します。
CLI でも同じことができます。

```bash
openclaw logs --follow
```

**詳細表示とログレベル**

- **ファイルログ**は `logging.level` のみによって制御されます。
- `--verbose` は **コンソールの詳細度**（および WS ログスタイル）にのみ影響します。**ファイルログレベルを上げるものではありません**。
- 詳細表示専用の内容をファイルログに取得するには、`logging.level` を `debug` または `trace` に設定します。
- Trace ロギングには、Plugin ツールファクトリ準備など、一部のホットパスの診断用タイミング要約も含まれます。[/tools/plugin#slow-plugin-tool-setup](/ja-JP/tools/plugin#slow-plugin-tool-setup) を参照してください。

## コンソールキャプチャ

CLI は `console.log/info/warn/error/debug/trace` をキャプチャしてファイルログに書き込みつつ、stdout/stderr への出力も継続します。

コンソールの詳細度は、以下で個別に調整できます。

- `logging.consoleLevel`（デフォルトは `info`）
- `logging.consoleStyle`（`pretty` | `compact` | `json`）

## リダクション

OpenClaw は、ログまたはトランスクリプト出力がプロセスを離れる前に、機密トークンをマスクできます。このロギングリダクションポリシーは、コンソール、ファイルログ、OTLP ログレコード、セッショントランスクリプトテキストのシンクに適用されるため、一致するシークレット値は JSONL 行やメッセージがディスクへ書き込まれる前にマスクされます。

- `logging.redactSensitive`: `off` | `tools`（デフォルト: `tools`）
- `logging.redactPatterns`: 正規表現文字列の配列（デフォルトを上書き）
  - 生の正規表現文字列（自動で `gi`）を使用するか、カスタムフラグが必要な場合は `/pattern/flags` を使用します。
  - 一致箇所は、最初の 6 文字 + 最後の 4 文字を保持してマスクされます（長さ >= 18）。それ以外は `***` になります。
  - デフォルトでは、一般的なキー代入、CLI フラグ、JSON フィールド、Bearer ヘッダー、PEM ブロック、よく使われるトークンプレフィックス、カード番号、CVC/CVV、共有決済トークン、決済認証情報などの決済認証情報フィールド名をカバーします。

一部の安全境界では、`logging.redactSensitive` に関係なく常にリダクションされます。
これには、Control UI のツール呼び出しイベント、`sessions_history` ツール出力、診断サポートエクスポート、プロバイダーエラー観測、exec 承認コマンド表示、Gateway WebSocket プロトコルログが含まれます。これらのサーフェスでは追加パターンとして `logging.redactPatterns` が引き続き使用される場合がありますが、`redactSensitive: "off"` にしても未加工のシークレットが出力されることはありません。

## Gateway WebSocket ログ

Gateway は WebSocket プロトコルログを 2 つのモードで出力します。

- **通常モード（`--verbose` なし）**: 「重要」な RPC 結果のみが出力されます。
  - エラー（`ok=false`）
  - 遅い呼び出し（デフォルトしきい値: `>= 50ms`）
  - パースエラー
- **詳細モード（`--verbose`）**: すべての WS リクエスト/レスポンストラフィックを出力します。

### WS ログスタイル

`openclaw gateway` は Gateway ごとのスタイル切り替えをサポートします。

- `--ws-log auto`（デフォルト）: 通常モードは最適化され、詳細モードでは compact 出力を使用します
- `--ws-log compact`: 詳細モード時に compact 出力（ペアになったリクエスト/レスポンス）
- `--ws-log full`: 詳細モード時にフレームごとの完全な出力
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

## コンソール整形（サブシステムロギング）

コンソールフォーマッターは **TTY 対応**で、一貫したプレフィックス付きの行を出力します。
サブシステムロガーにより、出力はグループ化され、スキャンしやすく保たれます。

動作:

- すべての行に **サブシステムプレフィックス**（例: `[gateway]`、`[canvas]`、`[tailscale]`）
- **サブシステムカラー**（サブシステムごとに安定）とレベルカラー
- **出力先が TTY、または環境がリッチなターミナルに見える場合にカラー表示**（`TERM`/`COLORTERM`/`TERM_PROGRAM`）。`NO_COLOR` を尊重します
- **短縮されたサブシステムプレフィックス**: 先頭の `gateway/` + `channels/` を削除し、最後の 2 セグメントを保持します（例: `whatsapp/outbound`）
- **サブシステム別のサブロガー**（自動プレフィックス + 構造化フィールド `{ subsystem }`）
- QR/UX 出力用の **`logRaw()`**（プレフィックスなし、整形なし）
- **コンソールスタイル**（例: `pretty | compact | json`）
- ファイルログレベルとは別の **コンソールログレベル**（`logging.level` が `debug`/`trace` に設定されている場合、ファイルには完全な詳細が保持されます）
- **WhatsApp メッセージ本文**は `debug` でログに記録されます（表示するには `--verbose` を使用）

これにより、既存のファイルログを安定させたまま、対話型出力をスキャンしやすくできます。

## 関連

- [ロギング](/ja-JP/logging)
- [OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry)
- [診断エクスポート](/ja-JP/gateway/diagnostics)

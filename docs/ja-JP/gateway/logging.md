---
read_when:
    - ログ出力または形式の変更
    - CLI または Gateway 出力のデバッグ
summary: ログ出力サーフェス、ファイルログ、WSログスタイル、コンソールの書式設定
title: Gateway のログ記録
x-i18n:
    generated_at: "2026-04-30T05:13:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ce9c78201d2e26760282b08eacb17826b1eac84e80b99d3a9d5cbff4078b5b3
    source_path: gateway/logging.md
    workflow: 16
---

# ロギング

ユーザー向けの概要（CLI + Control UI + 設定）については、[/logging](/ja-JP/logging) を参照してください。

OpenClaw には 2 つのログ「サーフェス」があります。

- **コンソール出力**（ターミナル / デバッグ UI に表示されるもの）。
- **ファイルログ**（JSON lines）。Gateway ロガーによって書き込まれます。

## ファイルベースのロガー

- デフォルトのローリングログファイルは `/tmp/openclaw/` 配下です（1 日 1 ファイル）: `openclaw-YYYY-MM-DD.log`
  - 日付には Gateway ホストのローカルタイムゾーンが使われます。
- アクティブなログファイルは `logging.maxFileBytes`（デフォルト: 100 MB）でローテートされ、最大 5 つの番号付きアーカイブを保持し、新しいアクティブファイルへの書き込みを続けます。
- ログファイルのパスとレベルは `~/.openclaw/openclaw.json` で設定できます。
  - `logging.file`
  - `logging.level`

ファイル形式は、1 行につき 1 つの JSON オブジェクトです。

Control UI のログタブは、Gateway 経由でこのファイルを追尾します（`logs.tail`）。
CLI でも同じことができます。

```bash
openclaw logs --follow
```

**詳細表示とログレベル**

- **ファイルログ**は `logging.level` のみで制御されます。
- `--verbose` は **コンソールの詳細度**（および WS ログスタイル）にのみ影響します。ファイルログレベルは上げません。
- 詳細表示でのみ出る内容をファイルログに記録するには、`logging.level` を `debug` または `trace` に設定します。

## コンソールキャプチャ

CLI は `console.log/info/warn/error/debug/trace` をキャプチャしてファイルログに書き込みつつ、stdout/stderr への出力も続けます。

コンソールの詳細度は次の項目で個別に調整できます。

- `logging.consoleLevel`（デフォルトは `info`）
- `logging.consoleStyle`（`pretty` | `compact` | `json`）

## リダクション

OpenClaw は、ログまたはトランスクリプト出力がプロセスを出る前に、機密トークンをマスクできます。このロギングのリダクションポリシーは、コンソール、ファイルログ、OTLP ログレコード、セッショントランスクリプトのテキストシンクに適用されるため、一致したシークレット値は JSONL 行やメッセージがディスクに書き込まれる前にマスクされます。

- `logging.redactSensitive`: `off` | `tools`（デフォルト: `tools`）
- `logging.redactPatterns`: 正規表現文字列の配列（デフォルトを上書き）
  - 生の正規表現文字列（自動で `gi`）、またはカスタムフラグが必要な場合は `/pattern/flags` を使用します。
  - 一致箇所は、長さが 18 以上の場合は先頭 6 文字 + 末尾 4 文字を残してマスクされ、それ以外は `***` になります。
  - デフォルトでは、一般的なキー代入、CLI フラグ、JSON フィールド、bearer ヘッダー、PEM ブロック、よく使われるトークンプレフィックスを対象にします。

一部の安全境界では、`logging.redactSensitive` に関係なく常にリダクションされます。
これには、Control UI のツール呼び出しイベント、`sessions_history` ツール出力、診断サポートエクスポート、プロバイダーエラー観測、exec 承認コマンド表示、Gateway WebSocket プロトコルログが含まれます。これらのサーフェスでは追加パターンとして `logging.redactPatterns` を使用できますが、`redactSensitive: "off"` にしても生のシークレットは出力されません。

## Gateway WebSocket ログ

Gateway は WebSocket プロトコルログを 2 つのモードで出力します。

- **通常モード（`--verbose` なし）**: 「注目すべき」RPC 結果のみ出力されます。
  - エラー（`ok=false`）
  - 遅い呼び出し（デフォルトのしきい値: `>= 50ms`）
  - パースエラー
- **詳細モード（`--verbose`）**: すべての WS リクエスト/レスポンス通信を出力します。

### WS ログスタイル

`openclaw gateway` は Gateway ごとのスタイル切り替えをサポートします。

- `--ws-log auto`（デフォルト）: 通常モードは最適化され、詳細モードではコンパクト出力を使います
- `--ws-log compact`: 詳細モード時のコンパクト出力（リクエスト/レスポンスのペア）
- `--ws-log full`: 詳細モード時のフレーム単位の完全出力
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

コンソールフォーマッターは **TTY 対応**で、一貫したプレフィックス付きの行を出力します。
サブシステムロガーにより、出力はまとまり、読み取りやすくなります。

挙動:

- すべての行に **サブシステムプレフィックス**（例: `[gateway]`、`[canvas]`、`[tailscale]`）
- **サブシステムカラー**（サブシステムごとに安定）とレベルカラー
- **出力先が TTY、または環境がリッチターミナルらしい場合にカラーを使用**（`TERM`/`COLORTERM`/`TERM_PROGRAM`）。`NO_COLOR` を尊重します
- **短縮サブシステムプレフィックス**: 先頭の `gateway/` + `channels/` を削除し、末尾 2 セグメントを保持します（例: `whatsapp/outbound`）
- **サブシステム別サブロガー**（自動プレフィックス + 構造化フィールド `{ subsystem }`）
- QR/UX 出力用の **`logRaw()`**（プレフィックスなし、フォーマットなし）
- **コンソールスタイル**（例: `pretty | compact | json`）
- **コンソールログレベル**はファイルログレベルとは別です（`logging.level` が `debug`/`trace` に設定されている場合、ファイルには完全な詳細が保持されます）
- **WhatsApp メッセージ本文**は `debug` でログ記録されます（表示するには `--verbose` を使用）

これにより、既存のファイルログを安定させたまま、インタラクティブ出力を読み取りやすくできます。

## 関連

- [ロギング](/ja-JP/logging)
- [OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry)
- [診断エクスポート](/ja-JP/gateway/diagnostics)

---
read_when:
    - ログ出力や形式の変更
    - CLI または Gateway の出力のデバッグ
summary: ログ記録サーフェス、ファイルログ、WS ログスタイル、コンソール書式設定
title: Gateway ロギング
x-i18n:
    generated_at: "2026-05-02T04:55:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb5f5ccd77909e82bd2938a33514ce8361c69910eb945c731d9b2c8266174c13
    source_path: gateway/logging.md
    workflow: 16
---

# ロギング

ユーザー向けの概要（CLI + Control UI + 設定）については、[/logging](/ja-JP/logging) を参照してください。

OpenClaw には 2 つのログ「サーフェス」があります。

- **コンソール出力**（ターミナル / Debug UI に表示されるもの）。
- **ファイルログ**（JSON 行）。Gateway ロガーによって書き込まれます。

## ファイルベースのロガー

- デフォルトのローテーションログファイルは `/tmp/openclaw/` 配下です（1 日 1 ファイル）: `openclaw-YYYY-MM-DD.log`
  - 日付には Gateway ホストのローカルタイムゾーンが使われます。
- アクティブなログファイルは `logging.maxFileBytes`（デフォルト: 100 MB）でローテーションし、
  最大 5 個の番号付きアーカイブを保持しながら、新しいアクティブファイルへの書き込みを続けます。
- ログファイルのパスとレベルは `~/.openclaw/openclaw.json` で設定できます:
  - `logging.file`
  - `logging.level`

ファイル形式は 1 行に 1 つの JSON オブジェクトです。

Control UI の Logs タブは Gateway 経由でこのファイルを追尾します（`logs.tail`）。
CLI でも同じことができます:

```bash
openclaw logs --follow
```

**詳細出力とログレベル**

- **ファイルログ**は `logging.level` のみによって制御されます。
- `--verbose` は **コンソールの詳細度**（および WS ログスタイル）にのみ影響し、ファイルログレベルを
  引き上げることは**ありません**。
- 詳細出力限定の情報をファイルログに記録するには、`logging.level` を `debug` または
  `trace` に設定します。
- トレースロギングには、Plugin ツールファクトリの準備など、選択された高頻度パスに関する診断用タイミングサマリーも含まれます。
  [/tools/plugin#slow-plugin-tool-setup](/ja-JP/tools/plugin#slow-plugin-tool-setup) を参照してください。

## コンソールキャプチャ

CLI は `console.log/info/warn/error/debug/trace` をキャプチャしてファイルログに書き込み、
同時に stdout/stderr への出力も継続します。

コンソールの詳細度は次で個別に調整できます:

- `logging.consoleLevel`（デフォルト `info`）
- `logging.consoleStyle`（`pretty` | `compact` | `json`）

## リダクション

OpenClaw は、ログやトランスクリプト出力がプロセスの外へ出る前に、機密トークンをマスクできます。
このロギングリダクションポリシーは、コンソール、ファイルログ、OTLP ログレコード、セッショントランスクリプトテキストの各シンクに適用されるため、一致するシークレット値は JSONL 行やメッセージがディスクに書き込まれる前にマスクされます。

- `logging.redactSensitive`: `off` | `tools`（デフォルト: `tools`）
- `logging.redactPatterns`: 正規表現文字列の配列（デフォルトを上書き）
  - 生の正規表現文字列（自動で `gi`）、またはカスタムフラグが必要な場合は `/pattern/flags` を使います。
  - 一致箇所は、長さが 18 以上の場合は先頭 6 文字 + 末尾 4 文字を残してマスクされ、それ以外は `***` になります。
  - デフォルトでは、一般的なキー代入、CLI フラグ、JSON フィールド、Bearer ヘッダー、PEM ブロック、よく使われるトークンプレフィックス、カード番号、CVC/CVV、共有決済トークン、決済クレデンシャルなどの決済クレデンシャルフィールド名を対象にします。

一部の安全境界では、`logging.redactSensitive` に関係なく常にリダクションされます。
これには、Control UI のツール呼び出しイベント、`sessions_history` ツール出力、
診断サポートエクスポート、プロバイダーエラー観測、exec 承認コマンド表示、
Gateway WebSocket プロトコルログが含まれます。これらのサーフェスでは追加パターンとして
`logging.redactPatterns` を引き続き使用できますが、`redactSensitive: "off"` にしても
生のシークレットは出力されません。

## Gateway WebSocket ログ

Gateway は WebSocket プロトコルログを 2 つのモードで出力します:

- **通常モード（`--verbose` なし）**: 「注目すべき」RPC 結果のみが出力されます:
  - エラー（`ok=false`）
  - 遅い呼び出し（デフォルトのしきい値: `>= 50ms`）
  - 解析エラー
- **詳細モード（`--verbose`）**: すべての WS リクエスト/レスポンストラフィックを出力します。

### WS ログスタイル

`openclaw gateway` は Gateway ごとのスタイル切り替えをサポートしています:

- `--ws-log auto`（デフォルト）: 通常モードは最適化され、詳細モードではコンパクトな出力を使います
- `--ws-log compact`: 詳細モード時にコンパクトな出力（ペアのリクエスト/レスポンス）
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

## コンソール形式（サブシステムロギング）

コンソールフォーマッターは **TTY 対応**で、一貫したプレフィックス付きの行を出力します。
サブシステムロガーにより、出力はまとまりがありスキャンしやすくなります。

動作:

- すべての行に **サブシステムプレフィックス**（例: `[gateway]`、`[canvas]`、`[tailscale]`）
- **サブシステムカラー**（サブシステムごとに安定）とレベルカラー
- **出力先が TTY、または環境がリッチターミナルに見える場合にカラー表示**（`TERM`/`COLORTERM`/`TERM_PROGRAM`）、`NO_COLOR` を尊重
- **短縮されたサブシステムプレフィックス**: 先頭の `gateway/` + `channels/` を削除し、最後の 2 セグメントを保持（例: `whatsapp/outbound`）
- **サブシステム別のサブロガー**（自動プレフィックス + 構造化フィールド `{ subsystem }`）
- QR/UX 出力向けの **`logRaw()`**（プレフィックスなし、形式設定なし）
- **コンソールスタイル**（例: `pretty | compact | json`）
- **コンソールログレベル**はファイルログレベルとは別です（`logging.level` が `debug`/`trace` に設定されている場合、ファイルには完全な詳細が保持されます）
- **WhatsApp メッセージ本文**は `debug` でログに記録されます（表示するには `--verbose` を使います）

これにより、既存のファイルログを安定させたまま、対話的な出力をスキャンしやすくできます。

## 関連

- [ロギング](/ja-JP/logging)
- [OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry)
- [診断エクスポート](/ja-JP/gateway/diagnostics)

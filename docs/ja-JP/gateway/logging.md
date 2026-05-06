---
read_when:
    - ログ出力または形式の変更
    - CLI または Gateway 出力のデバッグ
summary: ログ出力先、ファイルログ、WS ログスタイル、コンソール書式設定
title: Gateway のログ記録
x-i18n:
    generated_at: "2026-05-06T17:55:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16bce5763754d13f855a46777b4c3cc7a7c966e35e0cd08a15f359fd22623bcb
    source_path: gateway/logging.md
    workflow: 16
---

# ログ記録

ユーザー向けの概要（CLI + Control UI + 設定）については、[/logging](/ja-JP/logging) を参照してください。

OpenClaw には 2 つのログ「サーフェス」があります。

- **コンソール出力**（ターミナル / Debug UI に表示されるもの）。
- **ファイルログ**（JSON lines）。gateway logger によって書き込まれます。

起動時に、Gateway は解決済みのデフォルトエージェントモデルを、新しいセッションに影響する
モードのデフォルトとともにログに記録します。例:

```text
agent model: openai-codex/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` はデフォルトエージェント、モデル params、またはグローバルエージェントのデフォルトに由来します。
未設定の場合、起動時の概要には `medium` と表示されます。`fast` はデフォルトエージェントまたはモデルの `fastMode` params に由来します。

## ファイルベースのロガー

- デフォルトのローテーションログファイルは `/tmp/openclaw/` 配下です（1 日 1 ファイル）: `openclaw-YYYY-MM-DD.log`
  - 日付には Gateway ホストのローカルタイムゾーンが使用されます。
- アクティブなログファイルは `logging.maxFileBytes`（デフォルト: 100 MB）でローテーションされ、
  最大 5 つの番号付きアーカイブを保持し、新しいアクティブファイルへの書き込みを継続します。
- ログファイルのパスとレベルは `~/.openclaw/openclaw.json` で設定できます:
  - `logging.file`
  - `logging.level`

ファイル形式は 1 行に 1 つの JSON オブジェクトです。

Talk、リアルタイム音声、managed-room のコードパスは、有界のライフサイクルレコードに共有ファイルロガーを使用します。
これらのレコードは運用デバッグと OTLP ログエクスポートを目的としています。トランスクリプトのテキスト、音声ペイロード、turn id、call id、
provider item id はログレコードにコピーされません。

Control UI の Logs タブは Gateway 経由でこのファイルを tail します（`logs.tail`）。
CLI でも同じことができます:

```bash
openclaw logs --follow
```

**verbose とログレベル**

- **ファイルログ**は `logging.level` のみで制御されます。
- `--verbose` は **コンソールの詳細度**（および WS ログスタイル）にのみ影響します。**ファイルログレベルを上げることはありません**。
- verbose 限定の詳細をファイルログに取り込むには、`logging.level` を `debug` または
  `trace` に設定します。
- trace ログには、plugin tool factory の準備など、選択されたホットパスの診断用タイミング概要も含まれます。
  [/tools/plugin#slow-plugin-tool-setup](/ja-JP/tools/plugin#slow-plugin-tool-setup) を参照してください。

## コンソールキャプチャ

CLI は `console.log/info/warn/error/debug/trace` をキャプチャしてファイルログに書き込み、
stdout/stderr への出力も継続します。

コンソールの詳細度は次で個別に調整できます:

- `logging.consoleLevel`（デフォルト `info`）
- `logging.consoleStyle`（`pretty` | `compact` | `json`）

## リダクション

OpenClaw は、ログまたはトランスクリプト出力がプロセスを離れる前に機密トークンをマスクできます。
このログリダクションポリシーは、コンソール、ファイルログ、OTLP ログレコード、セッショントランスクリプトのテキストシンクに適用されます。
そのため、一致するシークレット値は、JSONL 行やメッセージがディスクに書き込まれる前にマスクされます。

- `logging.redactSensitive`: `off` | `tools`（デフォルト: `tools`）
- `logging.redactPatterns`: regex 文字列の配列（デフォルトを上書き）
  - 生の regex 文字列（自動 `gi`）、またはカスタムフラグが必要な場合は `/pattern/flags` を使用します。
  - 一致箇所は、最初の 6 文字 + 最後の 4 文字（長さ >= 18）を残してマスクされます。それ以外は `***` です。
  - デフォルトでは、一般的なキー代入、CLI フラグ、JSON フィールド、bearer ヘッダー、PEM ブロック、よく使われるトークンプレフィックス、カード番号、CVC/CVV、共有支払いトークン、支払い認証情報などの支払い認証情報フィールド名を対象にします。

一部の安全境界では、`logging.redactSensitive` に関係なく常にリダクションされます。
これには、Control UI の tool-call イベント、`sessions_history` tool 出力、診断サポートエクスポート、provider error observations、exec approval command
表示、Gateway WebSocket protocol logs が含まれます。これらのサーフェスは追加パターンとして
`logging.redactPatterns` を使用する場合がありますが、`redactSensitive: "off"` にしても
生のシークレットを出力するようにはなりません。

## Gateway WebSocket ログ

Gateway は WebSocket protocol logs を 2 つのモードで出力します:

- **通常モード（`--verbose` なし）**: 「興味深い」RPC 結果のみを出力します:
  - エラー（`ok=false`）
  - 遅い呼び出し（デフォルトのしきい値: `>= 50ms`）
  - parse errors
- **verbose モード（`--verbose`）**: すべての WS request/response トラフィックを出力します。

### WS ログスタイル

`openclaw gateway` は Gateway ごとのスタイル切り替えをサポートします:

- `--ws-log auto`（デフォルト）: 通常モードは最適化され、verbose モードはコンパクト出力を使用します
- `--ws-log compact`: verbose 時にコンパクト出力（対応する request/response）を使用します
- `--ws-log full`: verbose 時にフレームごとの完全な出力を使用します
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

## コンソール整形（サブシステムログ）

コンソールフォーマッターは **TTY-aware** で、一貫したプレフィックス付き行を出力します。
サブシステムロガーは出力をグループ化し、読み取りやすく保ちます。

動作:

- すべての行に **サブシステムプレフィックス**（例: `[gateway]`、`[canvas]`、`[tailscale]`）
- **サブシステムの色**（サブシステムごとに安定）とレベルの色分け
- **出力が TTY の場合、または環境が高機能ターミナルのように見える場合に色を使用**（`TERM`/`COLORTERM`/`TERM_PROGRAM`）。`NO_COLOR` を尊重します
- **短縮されたサブシステムプレフィックス**: 先頭の `gateway/` + `channels/` を削除し、最後の 2 セグメントを保持します（例: `whatsapp/outbound`）
- **サブシステムごとのサブログガー**（自動プレフィックス + 構造化フィールド `{ subsystem }`）
- QR/UX 出力用の **`logRaw()`**（プレフィックスなし、整形なし）
- **コンソールスタイル**（例: `pretty | compact | json`）
- **コンソールログレベル**はファイルログレベルと別です（`logging.level` が `debug`/`trace` に設定されている場合、ファイルは完全な詳細を保持します）
- **WhatsApp メッセージ本文**は `debug` でログ記録されます（表示するには `--verbose` を使用）

これにより、既存のファイルログを安定させたまま、インタラクティブ出力を読み取りやすくします。

## 関連

- [ログ記録](/ja-JP/logging)
- [OpenTelemetry export](/ja-JP/gateway/opentelemetry)
- [Diagnostics export](/ja-JP/gateway/diagnostics)

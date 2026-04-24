---
read_when:
    - ロギング出力またはフォーマットを変更しています
    - CLI または Gateway 出力をデバッグしています
summary: ロギングサーフェス、ファイルログ、WS ログスタイル、コンソールフォーマット
title: Gateway ロギング
x-i18n:
    generated_at: "2026-04-24T04:58:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 17ecbb9b781734727fc7aa8e3b0a59bc7ea22b455affd02fbc2db924c144b9f3
    source_path: gateway/logging.md
    workflow: 15
---

# ロギング

ユーザー向けの概要（CLI + Control UI + config）については、[/logging](/ja-JP/logging) を参照してください。

OpenClaw には 2 つのログ「サーフェス」があります。

- **コンソール出力**（ターミナル / Debug UI で見えるもの）
- **ファイルログ**（Gateway logger によって書き込まれる JSON lines）

## ファイルベース logger

- デフォルトのローテーションログファイルは `/tmp/openclaw/` 配下にあります（1 日 1 ファイル）: `openclaw-YYYY-MM-DD.log`
  - 日付は Gateway ホストのローカルタイムゾーンを使用します。
- ログファイルのパスとレベルは `~/.openclaw/openclaw.json` で設定できます:
  - `logging.file`
  - `logging.level`

ファイル形式は、1 行ごとに 1 つの JSON オブジェクトです。

Control UI の Logs タブは、このファイルを Gateway 経由で tail します（`logs.tail`）。
CLI でも同じことができます。

```bash
openclaw logs --follow
```

**Verbose とログレベル**

- **ファイルログ**は `logging.level` のみで制御されます。
- `--verbose` は **コンソールの詳細度**（および WS ログスタイル）にのみ影響し、
  ファイルログレベルは上げません。
- verbose 限定の詳細をファイルログに記録したい場合は、`logging.level` を `debug` または
  `trace` に設定してください。

## コンソールキャプチャ

CLI は `console.log/info/warn/error/debug/trace` をキャプチャしてファイルログに書き込みつつ、
そのまま stdout/stderr にも表示します。

コンソールの詳細度は次で個別に調整できます。

- `logging.consoleLevel`（デフォルト `info`）
- `logging.consoleStyle`（`pretty` | `compact` | `json`）

## ツール要約のリダクション

verbose なツール要約（例: `🛠️ Exec: ...`）は、コンソールストリームに出る前に
機密トークンをマスクできます。これは **ツール専用** であり、ファイルログは変更しません。

- `logging.redactSensitive`: `off` | `tools`（デフォルト: `tools`）
- `logging.redactPatterns`: 正規表現文字列の配列（デフォルトを上書き）
  - 生の正規表現文字列（自動で `gi`）、またはカスタムフラグが必要な場合は `/pattern/flags` を使用します。
  - 一致箇所は、先頭 6 文字 + 末尾 4 文字を残してマスクされます（長さ >= 18 の場合）。それ以外は `***` です。
  - デフォルトは、一般的なキー代入、CLI フラグ、JSON フィールド、bearer ヘッダー、PEM ブロック、人気のあるトークンプレフィックスをカバーします。

## Gateway WebSocket ログ

Gateway は WebSocket プロトコルログを 2 つのモードで表示します。

- **通常モード（`--verbose` なし）**: 「興味深い」RPC 結果のみ表示します:
  - エラー（`ok=false`）
  - 遅い呼び出し（デフォルトしきい値: `>= 50ms`）
  - parse エラー
- **Verbose モード（`--verbose`）**: すべての WS リクエスト/レスポンストラフィックを表示します。

### WS ログスタイル

`openclaw gateway` は Gateway ごとのスタイル切り替えをサポートしています。

- `--ws-log auto`（デフォルト）: 通常モードは最適化され、verbose モードでは compact 出力を使用
- `--ws-log compact`: verbose 時に compact 出力（対になった request/response）
- `--ws-log full`: verbose 時にフレームごとの完全出力
- `--compact`: `--ws-log compact` のエイリアス

例:

```bash
# 最適化（エラー/低速のみ）
openclaw gateway

# すべての WS トラフィックを表示（対表示）
openclaw gateway --verbose --ws-log compact

# すべての WS トラフィックを表示（完全メタ）
openclaw gateway --verbose --ws-log full
```

## コンソールフォーマット（サブシステムロギング）

コンソールフォーマッターは **TTY 対応** で、一貫したプレフィックス付き行を出力します。
サブシステム logger は、出力をグループ化して見やすく保ちます。

挙動:

- 各行に **サブシステムプレフィックス**（例: `[gateway]`、`[canvas]`、`[tailscale]`）
- **サブシステム色**（サブシステムごとに安定）とレベル色
- **出力が TTY の場合、または環境が高機能ターミナルに見える場合**（`TERM`/`COLORTERM`/`TERM_PROGRAM`）に色を使用し、`NO_COLOR` を尊重
- **短縮されたサブシステムプレフィックス**: 先頭の `gateway/` + `channels/` を落とし、最後の 2 セグメントを保持（例: `whatsapp/outbound`）
- **サブシステムごとの sub-logger**（自動プレフィックス + 構造化フィールド `{ subsystem }`）
- **`logRaw()`** は QR/UX 出力用（プレフィックスなし、フォーマットなし）
- **コンソールスタイル**（例: `pretty | compact | json`）
- **コンソールログレベル**はファイルログレベルと別（`logging.level` が `debug`/`trace` に設定されていれば、ファイルは完全な詳細を保持）
- **WhatsApp メッセージ本文**は `debug` で記録されます（表示するには `--verbose` を使用）

これにより、既存のファイルログの安定性を保ちながら、対話的出力を見やすくできます。

## 関連

- [ロギング概要](/ja-JP/logging)
- [診断エクスポート](/ja-JP/gateway/diagnostics)

---
read_when:
    - ログ出力または形式の変更
    - CLI または Gateway 出力のデバッグ
summary: ログ出力面、ファイルログ、WS ログスタイル、コンソール書式設定
title: Gateway ロギング
x-i18n:
    generated_at: "2026-07-05T11:25:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d7c689690d10ccdc5eca838e5248a5bf235a595c7498c600760dc71cf5c688eb
    source_path: gateway/logging.md
    workflow: 16
---

# ロギング

ユーザー向けの概要（CLI + Control UI + config）については、[/logging](/ja-JP/logging) を参照してください。

OpenClaw には2つのログサーフェスがあります。

- **コンソール出力** - terminal / Debug UI で表示される内容。
- **ファイルログ** - gateway logger によって書き込まれる JSON lines。

起動時、Gateway は解決されたデフォルトのエージェントモデルと、新しいセッションに影響するモードのデフォルトをログに記録します。

```text
agent model: openai/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` はデフォルトエージェント、モデルパラメータ、またはグローバルエージェントデフォルトに由来します。未設定の場合は `medium` と表示されます。`fast` はデフォルトエージェントまたはモデルの `fastMode` パラメータに由来します。

## ファイルベースの logger

- デフォルトのローテーションログファイルは `/tmp/openclaw/` 配下にあります（1日1ファイル）: `openclaw-YYYY-MM-DD.log`。日付は gateway ホストのローカルタイムゾーンに基づきます。そのディレクトリが安全でない、または書き込み不能な場合（所有者が誤っている、誰でも書き込める、シンボリックリンクである）、OpenClaw は代わりにユーザースコープの `os.tmpdir()/openclaw-<uid>` パスへフォールバックします。Windows では常にその OS-tmpdir フォールバックを使用します。
- アクティブなログファイルは `logging.maxFileBytes`（デフォルト: 100 MB）でローテーションされ、最大5つの番号付きアーカイブ（`.1` から `.5`）を保持し、新しいアクティブファイルへの書き込みを続けます。
- ログファイルのパスとレベルは `~/.openclaw/openclaw.json` の `logging.file`、`logging.level` で設定します。
- ファイル形式は1行につき1つの JSON オブジェクトです。

Talk、リアルタイム音声、managed-room のコードパスは、運用デバッグと OTLP ログエクスポートを目的とした境界付きライフサイクルレコードに、共有ファイル logger を使用します。トランスクリプトテキスト、音声ペイロード、turn id、call id、provider item id がログレコードへコピーされることはありません。

Control UI の Logs タブは gateway（`logs.tail`）経由でこのファイルを tail します。CLI も同じことを行います。

```bash
openclaw logs --follow
```

### Verbose とログレベル

- **ファイルログ** は `logging.level` のみによって制御されます。
- `--verbose` は **コンソールの詳細度**（および WS ログスタイル）にのみ影響し、ファイルログレベルは上げません。
- verbose のみの詳細をファイルログで取得するには、`logging.level` を `debug` または `trace` に設定します。
- Trace logging には、plugin tool factory preparation など、選択されたホットパスの診断タイミングサマリーも含まれます。[/tools/plugin#slow-plugin-tool-setup](/ja-JP/tools/plugin#slow-plugin-tool-setup) を参照してください。

## コンソールキャプチャ

CLI は `console.log/info/warn/error/debug/trace` をキャプチャし、ファイルログへ書き込み、stdout/stderr にも引き続き出力します。

コンソールの詳細度は個別に調整できます。

- `logging.consoleLevel`（デフォルト `info`）
- `logging.consoleStyle`（`pretty` | `compact` | `json`; TTY ではデフォルトが `pretty`、それ以外では `compact`）

## リダクション

OpenClaw は、ログまたはトランスクリプトの出力がプロセス外へ出る前に機密トークンをマスクします。このリダクションポリシーは、コンソール、ファイルログ、OTLP ログレコード、セッショントランスクリプトテキストの sink に適用されるため、一致する secret 値は JSONL 行やメッセージがディスクへ書き込まれる前にマスクされます。

- `logging.redactSensitive`: `off` | `tools`（デフォルト: `tools`）
- `logging.redactPatterns`: regex 文字列の配列（デフォルトを上書き）
  - 生の regex 文字列（自動 `gi`）、またはカスタムフラグ用の `/pattern/flags` を使用します。
  - 一致箇所は先頭6文字 + 末尾4文字を保持してマスクされます（18文字以上の値）。それより短い値は `***` になります。
  - デフォルトは、一般的なキー代入、CLI フラグ、JSON フィールド、bearer headers、PEM ブロック、よく使われるベンダートークンプレフィックス、支払い認証情報のフィールド名（カード番号、CVC/CVV、共有支払いトークン、支払い認証情報）をカバーします。

一部の安全境界では、`logging.redactSensitive` に関係なく常にリダクションされます。Control UI tool-call events、`sessions_history` tool output、diagnostics support exports、provider error observations、exec approval command display、Gateway WebSocket protocol logs が該当します。これらのサーフェスは追加パターンとして `logging.redactPatterns` を引き続き尊重しますが、`redactSensitive: "off"` にしても生の secret は出力されません。

## Gateway WebSocket ログ

gateway は WebSocket protocol logs を2つのモードで出力します。

- **通常モード（`--verbose` なし）**: 「興味深い」RPC 結果のみを出力します。errors（`ok=false`）、slow calls（デフォルトしきい値: `>= 50ms`）、parse errors です。
- **Verbose モード（`--verbose`）**: すべての WS request/response traffic を出力します。

### WS ログスタイル

`openclaw gateway` は gateway ごとのスタイル切り替えをサポートします。

- `--ws-log auto`（デフォルト）: 通常モードは最適化され、verbose モードでは compact output を使用します。
- `--ws-log compact`: verbose 時に compact output（ペアになった request/response）を使用します。
- `--ws-log full`: verbose 時に full per-frame output を使用します。
- `--compact`: `--ws-log compact` のエイリアスです。

```bash
# optimized (only errors/slow)
openclaw gateway

# show all WS traffic (paired)
openclaw gateway --verbose --ws-log compact

# show all WS traffic (full meta)
openclaw gateway --verbose --ws-log full
```

## コンソールフォーマット（サブシステムロギング）

コンソールフォーマッタは **TTY-aware** で、一貫したプレフィックス付き行を出力します。サブシステム logger は、出力をまとまりがありスキャンしやすい状態に保ちます。

- すべての行に **サブシステムプレフィックス**（例: `[gateway]`、`[canvas]`、`[tailscale]`）。
- **サブシステムカラー**（サブシステムごとに安定し、名前からハッシュ化）とレベルの色付け。
- 出力先が TTY、または環境がリッチターミナルのように見える場合（`TERM`/`COLORTERM`/`TERM_PROGRAM`）に **色を使用** します。`NO_COLOR` と `FORCE_COLOR` を尊重します。
- **短縮されたサブシステムプレフィックス**: 先頭の `gateway/`、`channels/`、または `providers/` セグメントを削除し、その後、残りのセグメントの末尾最大2つだけを保持します（例: `channels/turn/kernel` は `turn/kernel` と表示されます）。既知の channel subsystem（`telegram`、`whatsapp`、`slack` など）は常に channel name だけに畳み込まれます。
- **サブシステム別の sub-loggers**（自動プレフィックス + 構造化フィールド `{ subsystem }`）。
- QR/UX 出力用の **`logRaw()`**（プレフィックスなし、フォーマットなし）。
- **コンソールスタイル**: `pretty` | `compact` | `json`。
- **コンソールログレベル** はファイルログレベルとは別です（`logging.level` が `debug`/`trace` の場合、ファイルは完全な詳細を保持します）。
- **WhatsApp message bodies** は `debug` でログに記録されます（表示するには `--verbose` を使用します）。

これにより、ファイルログを安定させつつ、対話型出力をスキャンしやすく保てます。

## 関連

- [ロギング](/ja-JP/logging)
- [OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry)
- [診断エクスポート](/ja-JP/gateway/diagnostics)

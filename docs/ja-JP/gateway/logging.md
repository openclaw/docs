---
read_when:
    - ログ出力または形式の変更
    - CLI または Gateway の出力のデバッグ
summary: ログ出力先、ファイルログ、WS ログスタイル、コンソールの書式設定
title: Gateway ロギング
x-i18n:
    generated_at: "2026-05-06T09:05:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 078b4196ef1c5af5f7f0a4253f704d90d474a3ff668ec555559cab56cbcb15c6
    source_path: gateway/logging.md
    workflow: 16
---

# ロギング

ユーザー向けの概要（CLI + Control UI + 設定）については、[/logging](/ja-JP/logging) を参照してください。

OpenClaw には 2 つのログ「サーフェス」があります。

- **コンソール出力**（ターミナル / Debug UI に表示されるもの）。
- **ファイルログ**（JSON Lines）。Gateway ロガーによって書き込まれます。

起動時に、Gateway は解決済みのデフォルトエージェントモデルを、
新しいセッションに影響するモード既定値とともにログに記録します。例:

```text
agent model: openai-codex/gpt-5.5 (thinking=medium, fast=on)
```

`thinking` はデフォルトエージェント、モデルパラメーター、またはグローバルエージェント既定値に由来します。
未設定の場合、起動時の要約には `medium` と表示されます。`fast` はデフォルトエージェントまたはモデルの `fastMode` パラメーターに由来します。

## ファイルベースのロガー

- 既定のローテーションログファイルは `/tmp/openclaw/` 配下にあります（1 日 1 ファイル）: `openclaw-YYYY-MM-DD.log`
  - 日付には Gateway ホストのローカルタイムゾーンが使われます。
- アクティブなログファイルは `logging.maxFileBytes`（既定: 100 MB）でローテーションされ、
  最大 5 個の番号付きアーカイブを保持し、新しいアクティブファイルへの書き込みを続けます。
- ログファイルのパスとレベルは `~/.openclaw/openclaw.json` で設定できます:
  - `logging.file`
  - `logging.level`

ファイル形式は 1 行につき 1 つの JSON オブジェクトです。

Control UI のログタブは Gateway（`logs.tail`）経由でこのファイルを tail します。
CLI でも同じことができます:

```bash
openclaw logs --follow
```

**詳細表示とログレベル**

- **ファイルログ**は `logging.level` のみで制御されます。
- `--verbose` は **コンソールの詳細度**（および WS ログスタイル）にのみ影響します。ファイルログレベルは上げません。
- 詳細表示でのみ出る内容をファイルログに記録するには、`logging.level` を `debug` または `trace` に設定します。
- Trace ログには、Plugin ツールファクトリの準備など、選択されたホットパスの診断用タイミング要約も含まれます。
  [/tools/plugin#slow-plugin-tool-setup](/ja-JP/tools/plugin#slow-plugin-tool-setup) を参照してください。

## コンソールキャプチャ

CLI は `console.log/info/warn/error/debug/trace` をキャプチャしてファイルログへ書き込み、
同時に stdout/stderr への出力も続けます。

コンソールの詳細度は、以下で独立して調整できます。

- `logging.consoleLevel`（既定 `info`）
- `logging.consoleStyle`（`pretty` | `compact` | `json`）

## 秘密情報のマスク

OpenClaw は、ログやトランスクリプト出力がプロセスを離れる前に機密トークンをマスクできます。
このログの秘密情報マスクポリシーは、コンソール、ファイルログ、OTLP ログレコード、セッショントランスクリプトテキストの出力先に適用されるため、一致するシークレット値は JSONL 行やメッセージがディスクに書き込まれる前にマスクされます。

- `logging.redactSensitive`: `off` | `tools`（既定: `tools`）
- `logging.redactPatterns`: 正規表現文字列の配列（既定値を上書き）
  - 生の正規表現文字列（自動で `gi`）を使うか、カスタムフラグが必要な場合は `/pattern/flags` を使います。
  - 一致部分は、先頭 6 文字 + 末尾 4 文字（長さ >= 18）を残してマスクされます。それ以外は `***` になります。
  - 既定値は、一般的なキー代入、CLI フラグ、JSON フィールド、bearer ヘッダー、PEM ブロック、一般的なトークンプレフィックス、カード番号、CVC/CVV、共有支払いトークン、支払い資格情報などの支払い資格情報フィールド名を対象にします。

一部の安全境界では、`logging.redactSensitive` に関係なく常に秘密情報がマスクされます。
これには、Control UI のツール呼び出しイベント、`sessions_history` ツール出力、診断サポートエクスポート、プロバイダーエラー観測、exec 承認コマンド表示、Gateway WebSocket プロトコルログが含まれます。これらのサーフェスでは追加パターンとして `logging.redactPatterns` を引き続き使用できますが、`redactSensitive: "off"` にしても生のシークレットは出力されません。

## Gateway WebSocket ログ

Gateway は WebSocket プロトコルログを 2 つのモードで出力します。

- **通常モード（`--verbose` なし）**: 「興味深い」RPC 結果のみが出力されます:
  - エラー（`ok=false`）
  - 遅い呼び出し（既定のしきい値: `>= 50ms`）
  - パースエラー
- **詳細モード（`--verbose`）**: すべての WS リクエスト/レスポンストラフィックを出力します。

### WS ログスタイル

`openclaw gateway` は Gateway ごとのスタイル切り替えをサポートしています。

- `--ws-log auto`（既定）: 通常モードは最適化され、詳細モードではコンパクト出力を使います
- `--ws-log compact`: 詳細表示時にコンパクト出力（対応するリクエスト/レスポンス）を使います
- `--ws-log full`: 詳細表示時にフレームごとの完全な出力を使います
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

コンソールフォーマッターは **TTY を認識**し、一貫したプレフィックス付きの行を出力します。
サブシステムロガーにより、出力はグループ化され、読み取りやすく保たれます。

動作:

- すべての行に **サブシステムプレフィックス**（例: `[gateway]`、`[canvas]`、`[tailscale]`）
- **サブシステム色**（サブシステムごとに安定）とレベル色
- **出力先が TTY であるか、環境がリッチターミナルのように見える場合は色付き**（`TERM`/`COLORTERM`/`TERM_PROGRAM`）。`NO_COLOR` を尊重します
- **短縮サブシステムプレフィックス**: 先頭の `gateway/` + `channels/` を削除し、末尾 2 セグメントを保持します（例: `whatsapp/outbound`）
- **サブシステム別のサブロガー**（自動プレフィックス + 構造化フィールド `{ subsystem }`）
- QR/UX 出力用の **`logRaw()`**（プレフィックスなし、整形なし）
- **コンソールスタイル**（例: `pretty | compact | json`）
- **コンソールログレベル**はファイルログレベルとは別です（`logging.level` が `debug`/`trace` に設定されている場合、ファイルは詳細をすべて保持します）
- **WhatsApp メッセージ本文**は `debug` でログに記録されます（表示するには `--verbose` を使います）

これにより、既存のファイルログを安定させたまま、インタラクティブ出力を読み取りやすくできます。

## 関連

- [ロギング](/ja-JP/logging)
- [OpenTelemetry エクスポート](/ja-JP/gateway/opentelemetry)
- [診断エクスポート](/ja-JP/gateway/diagnostics)

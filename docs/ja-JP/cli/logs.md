---
read_when:
    - SSH を使わずにリモートで Gateway ログを追尾する必要があります
    - ツール用に JSON ログ行が必要である
summary: '`openclaw logs` のCLIリファレンス（RPC経由でGatewayログを追跡）'
title: ログ
x-i18n:
    generated_at: "2026-07-05T11:12:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c54d7dd7ec46a0ea71cfee0fbe24abf43a3f1207eba3717b40862fb27ed6c9cd
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

RPC 経由で Gateway のファイルログを追尾します。リモートモードで動作します。

## オプション

- `--limit <n>`: 返すログ行の最大数（デフォルト `200`）
- `--max-bytes <n>`: ログファイルから読み取る最大バイト数（デフォルト `250000`）
- `--follow`: ログストリームを追尾
- `--interval <ms>`: 追尾中のポーリング間隔（デフォルト `1000`）
- `--json`: 行区切りの JSON イベントを出力
- `--plain`: スタイル付き書式なしのプレーンテキスト出力
- `--no-color`: ANSI カラーを無効化
- `--local-time`: タイムスタンプをローカルタイムゾーンで表示（デフォルト）
- `--utc`: タイムスタンプを UTC で表示

## 共有 Gateway RPC オプション

- `--url <url>`: Gateway WebSocket URL
- `--token <token>`: Gateway トークン
- `--timeout <ms>`: タイムアウト（ミリ秒、デフォルト `30000`）
- `--expect-final`: Gateway 呼び出しがエージェント支援の場合、最終レスポンスを待機

`--url` を渡すと、自動適用される設定済み認証情報はスキップされます。対象の Gateway が認証を必要とする場合は、`--token` を明示的に含めてください。

## 例

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --utc
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## フォールバックと復旧動作

- 暗黙の local loopback Gateway がペアリングを要求した場合、接続中に閉じた場合、または `logs.tail` が応答する前にタイムアウトした場合、`openclaw logs` は設定済みの Gateway ファイルログへ自動的にフォールバックします。明示的な `--url` ターゲットでは、このフォールバックは使用されません。
- `--follow` は、暗黙のローカル Gateway RPC 障害後にその設定済みファイルへフォールバックしません。古い横置きファイルがライブ追尾を誤解させる可能性があるためです。Linux では代わりに、利用可能な場合は PID によってアクティブな user-systemd Gateway ジャーナルを使用します（選択されたソースを出力します）。それ以外の場合は、ライブ Gateway への再試行を続けます。
- `--follow` 中、一時的な切断（WebSocket の close、タイムアウト、接続断）は、指数バックオフによる自動再接続をトリガーします。最大 8 回再試行し、試行間隔は最大 30 秒です。各再試行で stderr に警告が出力され、ポーリングが成功すると `[logs] gateway reconnected` 通知が 1 回出力されます。`--json` モードでは、どちらも stderr に `{"type":"notice"}` レコードとして出力されます。復旧不能なエラー（認証失敗、不正な設定）は引き続き即座に終了します。
- `--follow --json` モードでは、ログソースの遷移が `{"type":"meta"}` レコードとして出力されます。カーソルは `sourceKind` ごとに追跡してください。ストリームは Gateway ファイル出力（`sourceKind: "file"`）からローカルジャーナルフォールバック（`sourceKind: "journal"`、`localFallback: true`、`service.pid`/`service.unit` 付き）へ移動し、復旧後に Gateway ファイル出力へ戻ることがあります。セッション全体で単一の安定したソースやカーソルがあると仮定せず、復旧時に Gateway ファイルカーソルが再生されて行が重複することを許容してください。

## 関連

- [ログ記録の概要](/ja-JP/logging)
- [Gateway CLI](/ja-JP/cli/gateway)
- [CLI リファレンス](/ja-JP/cli)
- [Gateway ログ記録](/ja-JP/gateway/logging)

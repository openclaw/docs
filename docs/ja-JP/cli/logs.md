---
read_when:
    - SSH なしでリモートから Gateway ログを追跡する必要があります
    - ツール用に JSON ログ行が必要な場合
summary: '`openclaw logs` のCLIリファレンス（RPC経由でGatewayログを追跡）'
title: ログ
x-i18n:
    generated_at: "2026-07-01T15:19:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c2cc14132d46b60fd323b40dad3c524b6eef40b940bb98d4b445d03782e0ea07
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

RPC 経由で Gateway ファイルログを追尾します（リモートモードで動作します）。

関連:

- ロギングの概要: [ロギング](/ja-JP/logging)
- Gateway CLI: [gateway](/ja-JP/cli/gateway)

## オプション

- `--limit <n>`: 返すログ行の最大数（デフォルト `200`）
- `--max-bytes <n>`: ログファイルから読み取る最大バイト数（デフォルト `250000`）
- `--follow`: ログストリームを追尾します
- `--interval <ms>`: 追尾中のポーリング間隔（デフォルト `1000`）
- `--json`: 行区切りの JSON イベントを出力します
- `--plain`: スタイル付き書式なしのプレーンテキスト出力
- `--no-color`: ANSI カラーを無効にします
- `--local-time`: タイムスタンプをローカルタイムゾーンで表示します（デフォルト）
- `--utc`: タイムスタンプを UTC で表示します

## 共有 Gateway RPC オプション

`openclaw logs` は標準の Gateway クライアントフラグも受け付けます。

- `--url <url>`: Gateway WebSocket URL
- `--token <token>`: Gateway トークン
- `--timeout <ms>`: ミリ秒単位のタイムアウト（デフォルト `30000`）
- `--expect-final`: Gateway 呼び出しがエージェントに支えられている場合、最終応答を待ちます

`--url` を渡すと、CLI は設定または環境認証情報を自動適用しません。対象の Gateway が認証を必要とする場合は、`--token` を明示的に含めてください。

## 例

```bash
openclaw logs
openclaw logs --follow
openclaw logs --follow --interval 2000
openclaw logs --limit 500 --max-bytes 500000
openclaw logs --json
openclaw logs --plain
openclaw logs --no-color
openclaw logs --limit 500
openclaw logs --local-time
openclaw logs --utc
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## 注記

- タイムスタンプはデフォルトでローカルタイムゾーンで表示されます。UTC 出力には `--utc` を使用してください。
- 暗黙の local loopback Gateway がペアリングを要求した場合、接続中に閉じた場合、または `logs.tail` が応答する前にタイムアウトした場合、`openclaw logs` は設定済みの Gateway ファイルログへ自動的にフォールバックします。明示的な `--url` 対象ではこのフォールバックを使用しません。
- `openclaw logs --follow` は、暗黙のローカル Gateway RPC 障害の後に、設定済みファイルへのフォールバックを追尾しません。Linux では、利用可能な場合は PID によってアクティブなユーザー systemd Gateway ジャーナルを使用し、選択されたログソースを出力します。それ以外の場合は、古い可能性のある横並びファイルを tail するのではなく、ライブ Gateway の再試行を続けます。
- `--follow` を使用している場合、一時的な Gateway 切断（WebSocket のクローズ、タイムアウト、接続断）は、指数バックオフによる自動再接続をトリガーします（最大 8 回再試行、試行間隔は最大 30 秒）。各再試行で stderr に警告が出力され、ポーリングが成功すると `[logs] gateway reconnected` 通知が 1 回出力されます。`--json` モードでは、再試行の警告と再接続遷移の両方が stderr に `{"type":"notice"}` レコードとして出力されます。回復不能なエラー（認証失敗、不正な設定）は引き続き即座に終了します。
- `--follow --json` モードでは、ログソースの遷移が `{"type":"meta"}` レコードとして出力されます。コンシューマーは `sourceKind` ごとにカーソルを追跡する必要があります。ストリームは Gateway ファイル出力（`sourceKind: "file"`）からローカルジャーナルフォールバック（`sourceKind: "journal"`、`localFallback: true`、`service.pid`/`service.unit` 付き）へ移り、回復後に Gateway ファイル出力へ戻ることがあります。follow セッション全体で 1 つの安定したソースまたはカーソルがあると仮定せず、回復時に Gateway ファイルカーソルが再生される場合の重複行を許容してください。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway ロギング](/ja-JP/gateway/logging)

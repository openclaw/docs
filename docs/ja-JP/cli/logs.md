---
read_when:
    - Gateway のログをリモートで追跡する必要があります（SSH は使用しません）
    - ツール向けの JSON ログ行が必要な場合
summary: '`openclaw logs` の CLI リファレンス（RPC 経由で Gateway ログを追跡）'
title: ログ
x-i18n:
    generated_at: "2026-07-11T22:03:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c54d7dd7ec46a0ea71cfee0fbe24abf43a3f1207eba3717b40862fb27ed6c9cd
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

RPC 経由で Gateway のファイルログを追尾します。リモートモードでも動作します。

## オプション

- `--limit <n>`: 返すログ行の最大数（デフォルト: `200`）
- `--max-bytes <n>`: ログファイルから読み取る最大バイト数（デフォルト: `250000`）
- `--follow`: ログストリームを追尾
- `--interval <ms>`: 追尾中のポーリング間隔（デフォルト: `1000`）
- `--json`: 行区切りの JSON イベントを出力
- `--plain`: スタイル付き書式を使用せず、プレーンテキストで出力
- `--no-color`: ANSI カラーを無効化
- `--local-time`: タイムスタンプをローカルタイムゾーンで表示（デフォルト）
- `--utc`: タイムスタンプを UTC で表示

## Gateway 共通 RPC オプション

- `--url <url>`: Gateway の WebSocket URL
- `--token <token>`: Gateway トークン
- `--timeout <ms>`: タイムアウト（ミリ秒、デフォルト: `30000`）
- `--expect-final`: Gateway 呼び出しがエージェントによって処理される場合、最終応答を待機

`--url` を指定すると、設定された認証情報は自動適用されません。対象の Gateway で認証が必要な場合は、`--token` を明示的に指定してください。

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

## フォールバックと復旧の動作

- 暗黙の local loopback Gateway がペアリングを要求した場合、接続中に切断した場合、または `logs.tail` が応答する前にタイムアウトした場合、`openclaw logs` は設定済みの Gateway ファイルログへ自動的にフォールバックします。`--url` で明示的に指定した接続先では、このフォールバックは使用されません。
- `--follow` では、暗黙のローカル Gateway RPC が失敗しても、設定済みのファイルにはフォールバックしません。並存する古いファイルを使用すると、ライブ追尾で誤解を招く可能性があるためです。Linux では代わりに、利用可能な場合は PID に基づいてアクティブなユーザー systemd Gateway ジャーナルを使用し（選択したソースを表示）、それ以外の場合は稼働中の Gateway への再試行を継続します。
- `--follow` の実行中、一時的な切断（WebSocket の切断、タイムアウト、接続断）が発生すると、指数バックオフで自動的に再接続します。最大 8 回再試行し、試行間隔は最大 30 秒です。再試行のたびに警告が標準エラー出力へ表示され、ポーリングが成功すると `[logs] gateway reconnected` という通知が一度表示されます。`--json` モードでは、どちらも標準エラー出力へ `{"type":"notice"}` レコードとして出力されます。復旧不可能なエラー（認証失敗、不正な設定）の場合は、引き続き即座に終了します。
- `--follow --json` モードでは、ログソースの切り替わりが `{"type":"meta"}` レコードとして出力されます。カーソルは `sourceKind` ごとに追跡してください。ストリームは Gateway ファイル出力（`sourceKind: "file"`）からローカルジャーナルへのフォールバック（`sourceKind: "journal"`、`localFallback: true`、`service.pid`/`service.unit` を含む）へ移行し、復旧後に Gateway ファイル出力へ戻ることがあります。セッション全体でソースやカーソルが常に同一であると想定せず、復旧時に Gateway ファイルのカーソルが再生されることで行が重複しても処理できるようにしてください。

## 関連項目

- [ログの概要](/ja-JP/logging)
- [Gateway CLI](/ja-JP/cli/gateway)
- [CLI リファレンス](/ja-JP/cli)
- [Gateway のログ](/ja-JP/gateway/logging)

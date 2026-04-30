---
read_when:
    - SSH なしで Gateway ログをリモートから追尾表示する必要があります
    - ツール用の JSON ログ行が必要な場合
summary: '`openclaw logs` の CLI リファレンス（RPC 経由で Gateway ログを tail する）'
title: ログ
x-i18n:
    generated_at: "2026-04-30T05:04:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f9268fefa4d0e54297fd12c5cef30a1465bd735ae6a36292c279a438285f2b8
    source_path: cli/logs.md
    workflow: 16
---

# `openclaw logs`

RPC 経由で Gateway のファイルログを追尾します（リモートモードで動作します）。

関連:

- ロギングの概要: [ロギング](/ja-JP/logging)
- Gateway CLI: [gateway](/ja-JP/cli/gateway)

## オプション

- `--limit <n>`: 返すログ行の最大数（デフォルト `200`）
- `--max-bytes <n>`: ログファイルから読み取る最大バイト数（デフォルト `250000`）
- `--follow`: ログストリームを追尾
- `--interval <ms>`: 追尾中のポーリング間隔（デフォルト `1000`）
- `--json`: 行区切りの JSON イベントを出力
- `--plain`: スタイル付き書式なしのプレーンテキスト出力
- `--no-color`: ANSI カラーを無効化
- `--local-time`: タイムスタンプをローカルタイムゾーンで表示

## 共有 Gateway RPC オプション

`openclaw logs` は標準の Gateway クライアントフラグも受け付けます:

- `--url <url>`: Gateway WebSocket URL
- `--token <token>`: Gateway トークン
- `--timeout <ms>`: ms 単位のタイムアウト（デフォルト `30000`）
- `--expect-final`: Gateway 呼び出しがエージェントによって処理される場合に最終応答を待機

`--url` を渡すと、CLI は設定や環境の認証情報を自動適用しません。対象の Gateway が認証を要求する場合は、`--token` を明示的に含めてください。

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
openclaw logs --follow --local-time
openclaw logs --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

## 注記

- タイムスタンプをローカルタイムゾーンで表示するには `--local-time` を使用します。
- 暗黙の local loopback Gateway がペアリングを要求した場合、接続中に閉じた場合、または `logs.tail` が応答する前にタイムアウトした場合、`openclaw logs` は設定済みの Gateway ファイルログに自動的にフォールバックします。明示的な `--url` ターゲットでは、このフォールバックは使用されません。

## 関連

- [CLI リファレンス](/ja-JP/cli)
- [Gateway ロギング](/ja-JP/gateway/logging)

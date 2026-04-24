---
read_when:
    - SSHを使わずにGatewayログをリモートでtailする必要がある
    - ツール向けにJSONログ行が欲しい
summary: '`openclaw logs` のCLIリファレンス（RPC経由でGatewayログをtailする）'
title: ログ
x-i18n:
    generated_at: "2026-04-24T04:50:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 94dddb9fd507c2f1d885c5cf92b78fd381355481317bf6f56b794afbd387f402
    source_path: cli/logs.md
    workflow: 15
---

# `openclaw logs`

RPC経由でGatewayのファイルログをtailします（リモートモードでも動作します）。

関連:

- ログの概要: [ログ](/ja-JP/logging)
- Gateway CLI: [gateway](/ja-JP/cli/gateway)

## オプション

- `--limit <n>`: 返すログ行数の上限（デフォルト `200`）
- `--max-bytes <n>`: ログファイルから読み取る最大バイト数（デフォルト `250000`）
- `--follow`: ログストリームを追従する
- `--interval <ms>`: 追従中のポーリング間隔（デフォルト `1000`）
- `--json`: 改行区切りJSONイベントを出力する
- `--plain`: スタイル付き書式なしのプレーンテキスト出力
- `--no-color`: ANSIカラーを無効にする
- `--local-time`: タイムスタンプをローカルタイムゾーンで表示する

## 共通のGateway RPCオプション

`openclaw logs` は、標準のGatewayクライアントフラグも受け付けます:

- `--url <url>`: Gateway WebSocket URL
- `--token <token>`: Gatewayトークン
- `--timeout <ms>`: タイムアウト（ミリ秒、デフォルト `30000`）
- `--expect-final`: Gateway呼び出しがエージェントバックの場合、最終応答を待つ

`--url` を渡した場合、CLIは設定または環境変数の認証情報を自動適用しません。対象のGatewayで認証が必要な場合は、`--token` を明示的に含めてください。

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

- タイムスタンプをローカルタイムゾーンで表示するには `--local-time` を使ってください。
- local loopback Gatewayがペアリングを要求する場合、`openclaw logs` は設定済みのローカルログファイルに自動的にフォールバックします。明示的な `--url` ターゲットではこのフォールバックは使われません。

## 関連

- [CLIリファレンス](/ja-JP/cli)
- [Gatewayログ](/ja-JP/gateway/logging)

---
read_when:
    - Cronジョブを作成せずにシステムイベントをエンキューしたい場合
    - Heartbeatを有効または無効にする必要がある場合
    - システムプレゼンスエントリを確認したい場合
summary: '`openclaw system` のCLIリファレンス（システムイベント、Heartbeat、プレゼンス）'
title: システム
x-i18n:
    generated_at: "2026-04-24T04:52:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0f4be30b0b2d18ee5653071d6375cebeb9fc94733e30bdb7b89a19c286df880b
    source_path: cli/system.md
    workflow: 15
---

# `openclaw system`

Gateway向けのシステムレベルヘルパーです。システムイベントのエンキュー、Heartbeatの制御、
プレゼンスの表示を行います。

すべての`system`サブコマンドはGateway RPCを使用し、共有クライアントフラグを受け付けます。

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## よく使うコマンド

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

**メイン**セッションにシステムイベントをエンキューします。次のHeartbeatで、
プロンプト内に`System:`行として注入されます。Heartbeatを即時に
トリガーするには`--mode now`を使用します。`next-heartbeat`は次回のスケジュールされたティックまで待機します。

フラグ:

- `--text <text>`: 必須のシステムイベントテキスト。
- `--mode <mode>`: `now`または`next-heartbeat`（デフォルト）。
- `--json`: 機械可読な出力。
- `--url`、`--token`、`--timeout`、`--expect-final`: 共有Gateway RPCフラグ。

## `system heartbeat last|enable|disable`

Heartbeat制御:

- `last`: 最後のHeartbeatイベントを表示します。
- `enable`: Heartbeatを再度有効にします（無効化されていた場合に使用）。
- `disable`: Heartbeatを一時停止します。

フラグ:

- `--json`: 機械可読な出力。
- `--url`、`--token`、`--timeout`、`--expect-final`: 共有Gateway RPCフラグ。

## `system presence`

Gatewayが認識している現在のシステムプレゼンスエントリ（Node、
インスタンス、および同様のステータス行）を一覧表示します。

フラグ:

- `--json`: 機械可読な出力。
- `--url`、`--token`、`--timeout`、`--expect-final`: 共有Gateway RPCフラグ。

## 注意

- 現在の設定（ローカルまたはリモート）から到達可能な、実行中のGatewayが必要です。
- システムイベントは一時的なもので、再起動後には保持されません。

## 関連

- [CLI reference](/ja-JP/cli)

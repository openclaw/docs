---
read_when:
    - Cron ジョブを作成せずにシステムイベントをキューに入れたい場合
    - Heartbeatを有効または無効にする必要があります
    - システムプレゼンスエントリを確認したい
summary: '`openclaw system` の CLI リファレンス（システムイベント、Heartbeat、プレゼンス）'
title: システム
x-i18n:
    generated_at: "2026-05-11T20:27:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2810fb064ea4afeac24ca0d71419913a664bbec0721cabdb09196075914f4864
    source_path: cli/system.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw system`

Gateway 用のシステムレベルヘルパーです。システムイベントをキューに入れ、Heartbeat を制御し、
プレゼンスを表示します。

すべての `system` サブコマンドは Gateway RPC を使用し、共通のクライアントフラグを受け付けます。

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## 共通コマンド

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

デフォルトでは、**メイン**セッションにシステムイベントをキューに入れます。次の Heartbeat で、
プロンプト内の `System:` 行として注入されます。Heartbeat をすぐにトリガーするには `--mode now` を使用します。
`next-heartbeat` は次にスケジュールされたティックまで待機します。

特定のセッションを対象にするには `--session-key` を渡します（たとえば、
非同期タスクの完了を、それを開始したチャンネルへ中継して戻す場合）。

> **`--session-key` 使用時のタイミング例外:** `--session-key` が指定されている場合、
> `--mode next-heartbeat` は、次にスケジュールされたティックを待たずに、
> 即時の対象指定ウェイクに折りたたまれます。対象指定ウェイクは Heartbeat インテント
> `immediate` を使用するため、runner の not-due ゲートをバイパスします。このゲートは通常、
> `event` インテントのウェイクを遅延させます（実質的にはドロップします）。遅延配信したい場合は、
> `--session-key` を省略し、イベントがメインセッションに届いて次の通常の Heartbeat に乗るようにしてください。

フラグ:

- `--text <text>`: 必須のシステムイベントテキスト。
- `--mode <mode>`: `now` または `next-heartbeat`（デフォルト）。
- `--session-key <sessionKey>`: 任意。エージェントのメインセッションではなく、
  特定のエージェントセッションを対象にします。解決されたエージェントに属さないキーは、
  エージェントのメインセッションにフォールバックします。
- `--json`: 機械可読出力。
- `--url`、`--token`、`--timeout`、`--expect-final`: 共通の Gateway RPC フラグ。

## `system heartbeat last|enable|disable`

Heartbeat 制御:

- `last`: 最後の Heartbeat イベントを表示します。
- `enable`: Heartbeat を再びオンにします（無効化されていた場合に使用します）。
- `disable`: Heartbeat を一時停止します。

フラグ:

- `--json`: 機械可読出力。
- `--url`、`--token`、`--timeout`、`--expect-final`: 共通の Gateway RPC フラグ。

## `system presence`

Gateway が認識している現在のシステムプレゼンスエントリ（ノード、
インスタンス、および同様のステータス行）を一覧表示します。

フラグ:

- `--json`: 機械可読出力。
- `--url`、`--token`、`--timeout`、`--expect-final`: 共通の Gateway RPC フラグ。

## メモ

- 現在の設定（ローカルまたはリモート）から到達可能な、実行中の Gateway が必要です。
- システムイベントは一時的なもので、再起動をまたいで永続化されません。

## 関連

- [CLI リファレンス](/ja-JP/cli)

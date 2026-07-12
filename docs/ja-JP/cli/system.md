---
read_when:
    - cron ジョブを作成せずにシステムイベントをキューに追加したい場合
    - Heartbeatを有効または無効にする必要があります
    - システムのプレゼンスエントリを確認する場合
summary: '`openclaw system` の CLI リファレンス（システムイベント、Heartbeat、プレゼンス）'
title: システム
x-i18n:
    generated_at: "2026-07-11T22:04:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaca206d8b463fd33f9e3cb21382bbf36469e9daa2706d8a9e2c7fab14b76e7a
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

Gateway 用のシステムレベルのヘルパーです。システムイベントのキューへの追加、Heartbeat の制御、プレゼンスの表示を行います。

すべての `system` サブコマンドは Gateway RPC を使用し、共通のクライアントフラグを受け付けます。

| フラグ              | デフォルト                              | 説明                                                                                                                                                                                            |
| ----------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--url <url>`     | 設定されている場合は `gateway.remote.url` | Gateway WebSocket URL。                                                                                                                                                                                 |
| `--token <token>` | なし                                 | Gateway トークン（必要な場合）。                                                                                                                                                                           |
| `--timeout <ms>`  | `30000`                              | RPC タイムアウト（ミリ秒単位）。                                                                                                                                                                           |
| `--expect-final`  | オフ                                  | 最終応答（エージェント）を待機します。                                                                                                                                                                       |
| `--json`          | オフ                                  | JSON を出力します。`heartbeat last/enable/disable` と `system presence` は、このフラグにかかわらず常に未加工の RPC JSON ペイロードを出力します。`system event` では、このフラグによって JSON とプレーンな `ok` 行を切り替えます。 |

## よく使うコマンド

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

デフォルトでは、**メイン**セッションのキューにシステムイベントを追加します。次の Heartbeat で、プロンプトに `System:` 行として挿入されます。Heartbeat を即座にトリガーするには `--mode now` を使用します。`next-heartbeat`（デフォルト）では、次に予定されているティックまで待機します。

特定のセッションを対象にするには `--session-key` を渡します。たとえば、非同期タスクの完了を、そのタスクを開始したチャンネルへ返す場合に使用します。

<Note>
**`--session-key` 使用時のタイミング例外：** `--session-key` が指定されている場合、`--mode next-heartbeat` は、次に予定されているティックを待つ代わりに、対象を指定した即時ウェイクとして動作します。対象を指定したウェイクでは Heartbeat インテント `immediate` が使用されるため、通常なら `event` インテントのウェイクを延期（実質的には破棄）するランナーの未到来ゲートを回避します。遅延配信が必要な場合は `--session-key` を省略してください。これにより、イベントはメインセッションに追加され、次の通常の Heartbeat で配信されます。
</Note>

フラグ：

- `--text <text>`：必須のシステムイベントテキスト。
- `--mode <mode>`：`now` または `next-heartbeat`（デフォルト）。
- `--session-key <sessionKey>`：任意。エージェントのメインセッションではなく、特定のエージェントセッションを対象にします。解決されたエージェントに属さないキーは、そのエージェントのメインセッションにフォールバックします。

## `system heartbeat last|enable|disable`

- `last`：最後の Heartbeat イベントを表示します。
- `enable`：Heartbeat を再度有効にします（無効化されている場合に使用します）。
- `disable`：Heartbeat を一時停止します。

## `system presence`

Gateway が認識している現在のシステムプレゼンスエントリ（Node、インスタンス、および同様のステータス行）を一覧表示します。

## 注意事項

- 現在の設定（ローカルまたはリモート）から到達可能な Gateway が実行中である必要があります。
- システムイベントは一時的なものであり、再起動後には保持されません。

## 関連項目

- [CLI リファレンス](/ja-JP/cli)

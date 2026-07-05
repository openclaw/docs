---
read_when:
    - システムイベントをキューに追加したいが、cron ジョブは作成したくない
    - Heartbeat を有効または無効にする必要があります
    - システムの存在エントリを確認したい場合
summary: '`openclaw system` の CLI リファレンス（システムイベント、heartbeat、presence）'
title: システム
x-i18n:
    generated_at: "2026-07-05T11:14:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaca206d8b463fd33f9e3cb21382bbf36469e9daa2706d8a9e2c7fab14b76e7a
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

Gateway 用のシステムレベルのヘルパー: システムイベントのエンキュー、Heartbeat の制御、プレゼンスの表示。

すべての `system` サブコマンドは Gateway RPC を使用し、共通のクライアントフラグを受け付けます。

| フラグ              | デフォルト                              | 説明                                                                                                                                                                                            |
| ----------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--url <url>`     | 構成済みの場合は `gateway.remote.url` | Gateway WebSocket URL。                                                                                                                                                                                 |
| `--token <token>` | なし                                 | Gateway トークン (必要な場合)。                                                                                                                                                                           |
| `--timeout <ms>`  | `30000`                              | ミリ秒単位の RPC タイムアウト。                                                                                                                                                                           |
| `--expect-final`  | オフ                                  | 最終応答 (agent) を待ちます。                                                                                                                                                                       |
| `--json`          | オフ                                  | JSON を出力します。`heartbeat last/enable/disable` と `system presence` は、このフラグに関係なく常に生の RPC JSON ペイロードを出力します。`system event` はこのフラグを使用して、JSON とプレーンな `ok` 行を切り替えます。 |

## 共通コマンド

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

デフォルトでは、**main** セッションにシステムイベントをエンキューします。次の Heartbeat が、それをプロンプト内の `System:` 行として注入します。Heartbeat を即時にトリガーするには `--mode now` を使用します。`next-heartbeat` (デフォルト) は次のスケジュール済み tick を待ちます。

特定のセッションを対象にするには `--session-key` を渡します。たとえば、async-task の完了を、それを開始したチャネルへ中継する場合です。

<Note>
**`--session-key` 使用時のタイミング例外:** `--session-key` が指定されている場合、`--mode next-heartbeat` は次のスケジュール済み tick を待たず、即時の対象指定 wake に縮約されます。対象指定 wake は Heartbeat intent `immediate` を使用するため、runner の not-due gate をバイパスします。この gate は、そうしなければ `event`-intent wake を遅延させ (実質的にドロップし) ます。遅延配信したい場合は、`--session-key` を省略し、イベントが main セッションに着地して次の通常の Heartbeat に乗るようにしてください。
</Note>

フラグ:

- `--text <text>`: 必須のシステムイベントテキスト。
- `--mode <mode>`: `now` または `next-heartbeat` (デフォルト)。
- `--session-key <sessionKey>`: 任意。agent の main セッションではなく、特定の agent セッションを対象にします。解決された agent に属さないキーは、agent の main セッションにフォールバックします。

## `system heartbeat last|enable|disable`

- `last`: 最後の Heartbeat イベントを表示します。
- `enable`: Heartbeat を再びオンにします (無効化されていた場合に使用します)。
- `disable`: Heartbeat を一時停止します。

## `system presence`

Gateway が把握している現在のシステムプレゼンスエントリ (ノード、インスタンス、同様のステータス行) を一覧表示します。

## 注記

- 現在の構成 (ローカルまたはリモート) で到達可能な、実行中の Gateway が必要です。
- システムイベントは一時的で、再起動をまたいで永続化されません。

## 関連

- [CLI リファレンス](/ja-JP/cli)

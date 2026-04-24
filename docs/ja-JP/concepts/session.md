---
read_when:
    - セッションのルーティングと分離を理解したい場合
    - マルチユーザー環境向けに DM スコープを設定したい場合
summary: OpenClaw が会話セッションを管理する仕組み
title: セッション管理
x-i18n:
    generated_at: "2026-04-24T04:54:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: cafff1fd480bdd306f87c818e7cb66bda8440d643fbe9ce5e14b773630b35d37
    source_path: concepts/session.md
    workflow: 15
---

OpenClaw は会話を**セッション**として整理します。各メッセージは、DM、グループチャット、Cron jobs など、どこから来たかに基づいてセッションへルーティングされます。

## メッセージのルーティング方法

| ソース | 動作 |
| --------------- | ------------------------- |
| ダイレクトメッセージ | デフォルトでは共有セッション |
| グループチャット | グループごとに分離 |
| ルーム/チャンネル | ルームごとに分離 |
| Cron jobs | 実行ごとに新しいセッション |
| Webhooks | hook ごとに分離 |

## DM 分離

デフォルトでは、すべての DM は継続性のために 1 つのセッションを共有します。これは単一ユーザー環境では問題ありません。

<Warning>
複数人があなたのエージェントにメッセージできる場合は、DM 分離を有効にしてください。これをしないと、すべてのユーザーが同じ会話コンテキストを共有します -- Alice のプライベートメッセージが Bob に見えてしまいます。
</Warning>

**修正方法:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // チャンネル + 送信者ごとに分離
  },
}
```

他のオプション:

- `main`（デフォルト） -- すべての DM が 1 つのセッションを共有
- `per-peer` -- 送信者ごとに分離（チャンネルをまたいで）
- `per-channel-peer` -- チャンネル + 送信者ごとに分離（推奨）
- `per-account-channel-peer` -- アカウント + チャンネル + 送信者ごとに分離

<Tip>
同じ人が複数のチャンネルから連絡してくる場合は、
`session.identityLinks` を使ってその identity をリンクし、1 つのセッションを共有させてください。
</Tip>

設定は `openclaw security audit` で確認できます。

## セッションのライフサイクル

セッションは期限切れになるまで再利用されます。

- **日次リセット**（デフォルト） -- gateway ホストのローカル時刻で午前 4:00 に新しいセッション
- **アイドルリセット**（任意） -- 一定期間非アクティブだと新しいセッション。`session.reset.idleMinutes` を設定します
- **手動リセット** -- チャットで `/new` または `/reset` を入力します。`/new <model>` ではモデルも切り替わります

日次リセットとアイドルリセットの両方が設定されている場合は、先に期限切れになる方が優先されます。

アクティブなプロバイダー所有 CLI セッションを持つセッションは、暗黙の日次デフォルトでは切断されません。それらのセッションをタイマーで期限切れにしたい場合は、`/reset` を使うか、`session.reset` を明示的に設定してください。

## 状態が保存される場所

すべてのセッション状態は**gateway**が所有します。UI クライアントは gateway にセッションデータを問い合わせます。

- **保存先:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **トランスクリプト:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

## セッションメンテナンス

OpenClaw は時間の経過とともにセッションストレージを自動的に制限します。デフォルトでは
`warn` モードで実行されます（何がクリーンアップされるかを報告）。自動クリーンアップを有効にするには、`session.maintenance.mode`
を `"enforce"` に設定してください。

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

`openclaw sessions cleanup --dry-run` でプレビューできます。

## セッションを調べる

- `openclaw status` -- セッションストアのパスと最近のアクティビティ
- `openclaw sessions --json` -- すべてのセッション（`--active <minutes>` でフィルター）
- チャット内の `/status` -- コンテキスト使用量、モデル、トグル
- `/context list` -- system prompt に何が含まれているか

## さらに読む

- [Session Pruning](/ja-JP/concepts/session-pruning) -- tool 結果のトリミング
- [Compaction](/ja-JP/concepts/compaction) -- 長い会話の要約
- [Session Tools](/ja-JP/concepts/session-tool) -- クロスセッション作業向けのエージェント tools
- [Session Management Deep Dive](/ja-JP/reference/session-management-compaction) --
  ストアスキーマ、transcript、送信ポリシー、origin メタデータ、高度な config
- [Multi-Agent](/ja-JP/concepts/multi-agent) — エージェント間のルーティングとセッション分離
- [Background Tasks](/ja-JP/automation/tasks) — 分離された作業がセッション参照付きのタスクレコードを作成する仕組み
- [Channel Routing](/ja-JP/channels/channel-routing) — 受信メッセージがセッションにルーティングされる仕組み

## 関連

- [Session pruning](/ja-JP/concepts/session-pruning)
- [Session tools](/ja-JP/concepts/session-tool)
- [Command queue](/ja-JP/concepts/queue)

---
read_when:
    - 任意のチャンネルでリアクションを扱う
    - プラットフォームごとの絵文字リアクションの違いを理解する
summary: サポートされているすべてのチャネルにおけるリアクションツールのセマンティクス
title: リアクション
x-i18n:
    generated_at: "2026-05-12T01:00:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 835c2a580f7f3e098ee956274de24191587929bfea7405a022cd68b35710c455
    source_path: tools/reactions.md
    workflow: 16
---

エージェントは、`message` ツールを `react` アクションで使用して、メッセージに絵文字リアクションを追加および削除できます。リアクションの動作はチャンネルとトランスポートによって異なります。

## 仕組み

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- リアクションを追加する場合、`emoji` は必須です。
- ボットのリアクションを削除するには、`emoji` を空文字列 (`""`) に設定します。
- 特定の絵文字を削除するには、`remove: true` を設定します（空でない `emoji` が必要です）。
- ステータスリアクションをサポートするチャンネルでは、リアクションに `trackToolCalls: true` を設定すると、ランタイムは同じターン内の後続のツール進行状況リアクションに、そのリアクションされたメッセージを使用できます。

## チャンネルの動作

<AccordionGroup>
  <Accordion title="Discord と Slack">
    - 空の `emoji` は、メッセージ上のボットのすべてのリアクションを削除します。
    - `remove: true` は、指定した絵文字のみを削除します。

  </Accordion>

  <Accordion title="Google Chat">
    - 空の `emoji` は、メッセージ上のアプリのリアクションを削除します。
    - `remove: true` は、指定した絵文字のみを削除します。

  </Accordion>

  <Accordion title="Telegram">
    - 空の `emoji` は、ボットのリアクションを削除します。
    - `remove: true` もリアクションを削除しますが、ツール検証のために空でない `emoji` が引き続き必要です。

  </Accordion>

  <Accordion title="WhatsApp">
    - 空の `emoji` は、ボットのリアクションを削除します。
    - `remove: true` は内部的に空の絵文字にマッピングされます（ツール呼び出しでは引き続き `emoji` が必要です）。

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - 空でない `emoji` が必要です。
    - `remove: true` は、その特定の絵文字リアクションを削除します。

  </Accordion>

  <Accordion title="Feishu/Lark">
    - `feishu_reaction` ツールを `add`、`remove`、`list` アクションで使用します。
    - 追加/削除には `emoji_type` が必要です。削除にはさらに `reaction_id` も必要です。

  </Accordion>

  <Accordion title="Signal">
    - 受信リアクション通知は `channels.signal.reactionNotifications` で制御されます: `"off"` は無効化し、`"own"`（デフォルト）はユーザーがボットメッセージにリアクションしたときにイベントを発行し、`"all"` はすべてのリアクションについてイベントを発行します。

  </Accordion>

  <Accordion title="iMessage">
    - 送信リアクションは iMessage の tapback（`love`、`like`、`dislike`、`laugh`、`emphasize`、`question`）です。
    - 受信 tapback 通知は `channels.imessage.reactionNotifications` で制御されます: `"off"` は無効化し、`"own"`（デフォルト）はユーザーがボット作成メッセージにリアクションしたときにイベントを発行し、`"all"` は認可済み送信者からのすべての tapback についてイベントを発行します。

  </Accordion>
</AccordionGroup>

## リアクションレベル

チャンネルごとの `reactionLevel` 設定は、エージェントがどの程度広くリアクションを使用するかを制御します。値は通常 `off`、`ack`、`minimal`、または `extensive` です。

- [Telegram reactionLevel](/ja-JP/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/ja-JP/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

個々のチャンネルで `reactionLevel` を設定し、各プラットフォームでエージェントがメッセージにどの程度積極的にリアクションするかを調整します。

## 関連

- [Agent Send](/ja-JP/tools/agent-send) — `react` を含む `message` ツール
- [チャンネル](/ja-JP/channels) — チャンネル固有の設定

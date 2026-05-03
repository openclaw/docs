---
read_when:
    - 任意のチャンネルでリアクションを扱う
    - プラットフォーム間で絵文字リアクションがどのように異なるかを理解する
summary: サポートされているすべてのチャネルにおけるリアクションツールのセマンティクス
title: リアクション
x-i18n:
    generated_at: "2026-05-03T21:39:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99008cdaf1fa7462bbe72066be7c404880df237a79d3deba01bffe00083c1e34
    source_path: tools/reactions.md
    workflow: 16
---

エージェントは、`react` アクションを指定した `message`
ツールを使用して、メッセージに絵文字リアクションを追加および削除できます。リアクションの動作は、チャンネルとトランスポートによって異なります。

## 仕組み

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- リアクションを追加するときは `emoji` が必須です。
- ボットのリアクションを削除するには、`emoji` を空文字列（`""`）に設定します。
- 特定の絵文字を削除するには、`remove: true` を設定します（空でない `emoji` が必要です）。
- ステータスリアクションをサポートするチャンネルでは、リアクションで
  `trackToolCalls: true` を指定すると、ランタイムは同じターン中の後続ツール
  進捗リアクションに、そのリアクションされたメッセージを使用できます。

## チャンネルの動作

<AccordionGroup>
  <Accordion title="Discord と Slack">
    - 空の `emoji` は、メッセージ上のボットのすべてのリアクションを削除します。
    - `remove: true` は、指定した絵文字だけを削除します。

  </Accordion>

  <Accordion title="Google Chat">
    - 空の `emoji` は、メッセージ上のアプリのリアクションを削除します。
    - `remove: true` は、指定した絵文字だけを削除します。

  </Accordion>

  <Accordion title="Telegram">
    - 空の `emoji` は、ボットのリアクションを削除します。
    - `remove: true` もリアクションを削除しますが、ツール検証のために空でない `emoji` が必要です。

  </Accordion>

  <Accordion title="WhatsApp">
    - 空の `emoji` は、ボットのリアクションを削除します。
    - `remove: true` は内部的に空の絵文字にマップされます（ツール呼び出しでは引き続き `emoji` が必要です）。

  </Accordion>

  <Accordion title="Zalo Personal（zalouser）">
    - 空でない `emoji` が必要です。
    - `remove: true` は、その特定の絵文字リアクションを削除します。

  </Accordion>

  <Accordion title="Feishu/Lark">
    - `add`、`remove`、`list` アクションを指定して `feishu_reaction` ツールを使用します。
    - 追加/削除には `emoji_type` が必要です。削除には `reaction_id` も必要です。

  </Accordion>

  <Accordion title="Signal">
    - 受信リアクション通知は `channels.signal.reactionNotifications` で制御されます。`"off"` は無効化し、`"own"`（デフォルト）はユーザーがボットのメッセージにリアクションしたときにイベントを発行し、`"all"` はすべてのリアクションについてイベントを発行します。

  </Accordion>
</AccordionGroup>

## リアクションレベル

チャンネルごとの `reactionLevel` 設定は、エージェントがどの程度広くリアクションを使用するかを制御します。値は通常 `off`、`ack`、`minimal`、または `extensive` です。

- [Telegram reactionLevel](/ja-JP/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/ja-JP/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

個別のチャンネルで `reactionLevel` を設定し、各プラットフォームでエージェントがメッセージにどの程度積極的にリアクションするかを調整します。

## 関連

- [エージェント送信](/ja-JP/tools/agent-send) — `react` を含む `message` ツール
- [チャンネル](/ja-JP/channels) — チャンネル固有の設定

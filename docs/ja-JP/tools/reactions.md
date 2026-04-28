---
read_when:
    - 任意のチャネルでリアクションに取り組む場合
    - 絵文字リアクションがプラットフォームごとにどう異なるかを理解する դեպքում
summary: サポートされているすべてのチャネルにおける Reaction tool のセマンティクス
title: リアクション
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T05:26:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 58d9a85114e715fd1813a4d662b02a6b8b9cad9a8eea9c63d024a933ba573a65
    source_path: tools/reactions.md
    workflow: 15
---

agent は、`message`
tool の `react` アクションを使って、メッセージに絵文字リアクションを追加または削除できます。リアクションの動作はチャネルごとに異なります。

## 仕組み

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- リアクションを追加する場合、`emoji` は必須です。
- bot のリアクションを削除するには、`emoji` を空文字列（`""`）に設定します。
- 特定の絵文字を削除するには `remove: true` を設定します（空でない `emoji` が必要です）。

## チャネルごとの動作

<AccordionGroup>
  <Accordion title="Discord と Slack">
    - 空の `emoji` は、そのメッセージ上の bot のすべてのリアクションを削除します。
    - `remove: true` は指定された絵文字だけを削除します。
  </Accordion>

  <Accordion title="Google Chat">
    - 空の `emoji` は、そのメッセージ上の app のリアクションを削除します。
    - `remove: true` は指定された絵文字だけを削除します。
  </Accordion>

  <Accordion title="Telegram">
    - 空の `emoji` は bot のリアクションを削除します。
    - `remove: true` でもリアクションは削除されますが、tool 検証のために空でない `emoji` が引き続き必要です。
  </Accordion>

  <Accordion title="WhatsApp">
    - 空の `emoji` は bot リアクションを削除します。
    - `remove: true` は内部的に空の絵文字へマップされます（それでも tool call には `emoji` が必要です）。
  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - 空でない `emoji` が必要です。
    - `remove: true` はその特定の絵文字リアクションを削除します。
  </Accordion>

  <Accordion title="Feishu/Lark">
    - `add`, `remove`, `list` アクションを持つ `feishu_reaction` tool を使います。
    - add/remove には `emoji_type` が必要で、remove にはさらに `reaction_id` が必要です。
  </Accordion>

  <Accordion title="Signal">
    - 受信リアクション通知は `channels.signal.reactionNotifications` で制御されます: `"off"` で無効、`"own"`（デフォルト）でユーザーが bot メッセージにリアクションしたときにイベントを発行し、`"all"` ですべてのリアクションに対してイベントを発行します。
  </Accordion>
</AccordionGroup>

## Reaction level

チャネルごとの `reactionLevel` config は、agent がどの程度広くリアクションを使うかを制御します。値は通常 `off`, `ack`, `minimal`, `extensive` です。

- [Telegram reactionLevel](/ja-JP/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/ja-JP/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

個々のチャネルで `reactionLevel` を設定して、各プラットフォームで agent がどの程度積極的にメッセージへリアクションするかを調整してください。

## 関連

- [Agent Send](/ja-JP/tools/agent-send) — `react` を含む `message` tool
- [Channels](/ja-JP/channels) — チャネル固有の設定

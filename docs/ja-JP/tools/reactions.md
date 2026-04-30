---
read_when:
    - 任意のチャネルでリアクションを扱う
    - プラットフォームごとの絵文字リアクションの違いを理解する
summary: すべての対応チャンネルにおけるリアクションツールのセマンティクス
title: リアクション
x-i18n:
    generated_at: "2026-04-30T05:39:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 29cbb4a3afa4c0fdd049bfd615890b0fccea26bf28f109d6cba6f041423ca5e0
    source_path: tools/reactions.md
    workflow: 16
---

エージェントは、`react` アクションを指定した `message`
ツールを使って、メッセージに絵文字リアクションを追加および削除できます。リアクションの動作は、チャンネルとトランスポートによって異なります。

## 仕組み

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- リアクションを追加するときは `emoji` が必須です。
- ボットのリアクションを削除するには、`emoji` を空文字列 (`""`) に設定します。
- 特定の絵文字を削除するには、`remove: true` を設定します（空でない `emoji` が必要です）。

## チャンネルの動作

<AccordionGroup>
  <Accordion title="Discord と Slack">
    - 空の `emoji` は、メッセージ上のボットのリアクションをすべて削除します。
    - `remove: true` は、指定された絵文字だけを削除します。

  </Accordion>

  <Accordion title="Google Chat">
    - 空の `emoji` は、メッセージ上のアプリのリアクションを削除します。
    - `remove: true` は、指定された絵文字だけを削除します。

  </Accordion>

  <Accordion title="Telegram">
    - 空の `emoji` は、ボットのリアクションを削除します。
    - `remove: true` もリアクションを削除しますが、ツール検証のために空でない `emoji` が引き続き必要です。

  </Accordion>

  <Accordion title="WhatsApp">
    - 空の `emoji` は、ボットのリアクションを削除します。
    - `remove: true` は内部的に空の絵文字にマッピングされます（ツール呼び出し内では引き続き `emoji` が必要です）。

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - 空でない `emoji` が必要です。
    - `remove: true` は、その特定の絵文字リアクションを削除します。

  </Accordion>

  <Accordion title="Feishu/Lark">
    - `add`、`remove`、`list` アクションを指定して `feishu_reaction` ツールを使用します。
    - 追加/削除には `emoji_type` が必要です。削除にはさらに `reaction_id` も必要です。

  </Accordion>

  <Accordion title="Signal">
    - 受信リアクション通知は `channels.signal.reactionNotifications` で制御されます。`"off"` は通知を無効にし、`"own"`（デフォルト）はユーザーがボットのメッセージにリアクションしたときにイベントを発行し、`"all"` はすべてのリアクションについてイベントを発行します。

  </Accordion>
</AccordionGroup>

## リアクションレベル

チャンネルごとの `reactionLevel` 設定は、エージェントがリアクションをどの程度広く使うかを制御します。値は通常、`off`、`ack`、`minimal`、または `extensive` です。

- [Telegram reactionLevel](/ja-JP/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/ja-JP/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

各プラットフォームでエージェントがメッセージにどの程度積極的にリアクションするかを調整するには、個別のチャンネルで `reactionLevel` を設定します。

## 関連

- [Agent Send](/ja-JP/tools/agent-send) — `react` を含む `message` ツール
- [チャンネル](/ja-JP/channels) — チャンネル固有の設定

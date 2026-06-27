---
read_when:
    - 任意のチャネルでリアクションに取り組む
    - プラットフォーム間で絵文字リアクションがどのように異なるかを理解する
summary: サポートされているすべてのチャンネルにおけるリアクションツールのセマンティクス
title: リアクション
x-i18n:
    generated_at: "2026-06-27T13:16:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2dc9575eaeb79a56ca82ee491c2974e9984b1a12999762b1532ca9affdbbd72f
    source_path: tools/reactions.md
    workflow: 16
---

エージェントは、`message` ツールと `react` アクションを使って、メッセージに絵文字リアクションを追加および削除できます。リアクションの動作はチャンネルとトランスポートによって異なります。

## 仕組み

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- リアクションを追加する場合、`emoji` は必須です。
- ボットのリアクションを削除するには、`emoji` を空文字列（`""`）に設定します。
- 特定の絵文字を削除するには、`remove: true` を設定します（空でない `emoji` が必要です）。
- ステータスリアクションをサポートするチャンネルでは、リアクションの `trackToolCalls: true` により、ランタイムは同じターン中の後続ツール進行状況リアクションに、そのリアクション済みメッセージを使用できます。

## チャンネルの動作

<AccordionGroup>
  <Accordion title="Discord and Slack">
    - 空の `emoji` は、メッセージ上のボットのリアクションをすべて削除します。
    - `remove: true` は、指定された絵文字だけを削除します。

  </Accordion>

  <Accordion title="Google Chat">
    - 空の `emoji` は、メッセージ上のアプリのリアクションを削除します。
    - `remove: true` は、指定された絵文字だけを削除します。

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - リアクションの追加のみ: `emoji` は必須で、空でない必要があります。
    - リアクション削除はまだサポートされていません。`remove: true`（または空の `emoji`）を指定した呼び出しは、何もせずに成功扱いにするのではなく、明確なエラーで拒否されます。
    - Talk ボットが `reaction` 機能付きで登録されている必要があります（[Nextcloud Talk チャンネルドキュメント](/ja-JP/channels/nextcloud-talk)を参照）。

  </Accordion>

  <Accordion title="Telegram">
    - 空の `emoji` は、ボットのリアクションを削除します。
    - `remove: true` もリアクションを削除しますが、ツール検証のために空でない `emoji` が引き続き必要です。

  </Accordion>

  <Accordion title="WhatsApp">
    - 空の `emoji` は、ボットのリアクションを削除します。
    - `remove: true` は内部的に空の絵文字へマッピングされます（ツール呼び出しでは引き続き `emoji` が必要です）。
    - WhatsApp にはメッセージごとにボットリアクション枠が1つあります。ステータスリアクション更新は、複数の絵文字を積み重ねるのではなく、その枠を置き換えます。

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - 空でない `emoji` が必要です。
    - `remove: true` は、その特定の絵文字リアクションを削除します。

  </Accordion>

  <Accordion title="Feishu/Lark">
    - `add`、`remove`、`list` アクションを指定して `feishu_reaction` ツールを使用します。
    - 追加/削除には `emoji_type` が必要です。削除には `reaction_id` も必要です。

  </Accordion>

  <Accordion title="Signal">
    - 受信リアクション通知は `channels.signal.reactionNotifications` で制御されます: `"off"` は通知を無効化し、`"own"`（デフォルト）はユーザーがボットメッセージにリアクションしたときにイベントを発行し、`"all"` はすべてのリアクションについてイベントを発行します。

  </Accordion>

  <Accordion title="iMessage">
    - 送信リアクションは iMessage のタップバック（`love`、`like`、`dislike`、`laugh`、`emphasize`、`question`）です。
    - 受信タップバック通知は `channels.imessage.reactionNotifications` で制御されます: `"off"` は通知を無効化し、`"own"`（デフォルト）はユーザーがボット作成メッセージにリアクションしたときにイベントを発行し、`"all"` は承認済み送信者からのすべてのタップバックについてイベントを発行します。

  </Accordion>
</AccordionGroup>

## リアクションレベル

チャンネルごとの `reactionLevel` 設定は、エージェントがどの程度広くリアクションを使うかを制御します。値は通常、`off`、`ack`、`minimal`、または `extensive` です。

- [Telegram reactionLevel](/ja-JP/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/ja-JP/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

個別のチャンネルで `reactionLevel` を設定し、各プラットフォームでエージェントがメッセージにどの程度積極的にリアクションするかを調整します。

## 関連

- [エージェント送信](/ja-JP/tools/agent-send) — `react` を含む `message` ツール
- [チャンネル](/ja-JP/channels) — チャンネル固有の設定

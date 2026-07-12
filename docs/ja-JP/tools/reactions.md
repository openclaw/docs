---
read_when:
    - あらゆるチャンネルでリアクションを操作する
    - プラットフォーム間で絵文字リアクションがどのように異なるかを理解する
summary: サポートされているすべてのチャネルにおけるリアクションツールのセマンティクス
title: リアクション
x-i18n:
    generated_at: "2026-07-12T14:53:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e148a93edbcfbe997075f6e9e191667ec257f76fa48162688fd1f333479661f0
    source_path: tools/reactions.md
    workflow: 16
---

エージェントは、`message` ツールの `react` アクションを使用して絵文字リアクションを追加および削除します。動作はチャネルによって異なります。

## 仕組み

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- リアクションを追加する場合、`emoji` は必須です。
- 対応しているチャネルでボットのリアクションを削除するには、`emoji` を空文字列（`""`）に設定します。
- 特定の絵文字を1つ削除するには、`remove: true` を設定します（空でない `emoji` が必要です）。
- ステータスリアクションに対応するチャネルでは、リアクションに `trackToolCalls: true` を指定すると、同じターン内の後続のツール進捗リアクションで、そのリアクションを付けたメッセージをランタイムが再利用できます。

## チャネル別の動作

<AccordionGroup>
  <Accordion title="Discord と Slack">
    - 空の `emoji` を指定すると、メッセージに付けたボットのすべてのリアクションが削除されます。
    - `remove: true` を指定すると、指定した絵文字だけが削除されます。

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - リアクションの追加のみ対応しています。`emoji` は必須で、空にはできません。
    - リアクションの削除は、まだ削除呼び出しに接続されていません。`remove: true` は何もせずに無視されるのではなく、明示的なエラーで拒否されます。
    - `reaction` 機能を有効にして登録された Talk ボットが必要です（[Nextcloud Talk チャネルのドキュメント](/ja-JP/channels/nextcloud-talk)を参照）。

  </Accordion>

  <Accordion title="Telegram">
    - 空の `emoji` を指定すると、ボットのリアクションが削除されます。
    - `remove: true` でもリアクションが削除されますが、ツール検証のために空でない `emoji` が引き続き必要です。

  </Accordion>

  <Accordion title="WhatsApp">
    - 空の `emoji` を指定すると、ボットのリアクションが削除されます。
    - `remove: true` は内部で空の絵文字に変換されます（ツール呼び出しでは引き続き `emoji` が必要です）。
    - WhatsApp では、メッセージごとにボットのリアクション枠は1つです。新しいリアクションを送信すると、複数の絵文字が重なるのではなく、既存のリアクションが置き換えられます。

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - 追加と削除のどちらにも、空でない `emoji` が必要です。
    - `remove: true` を指定すると、その特定の絵文字リアクションが削除されます。

  </Accordion>

  <Accordion title="Feishu/Lark">
    - 個別のツールではなく、他のチャネルと同じ `react` アクションを使用します（メッセージリアクション ID による追加、削除、一覧取得）。
    - 追加には空でない `emoji` が必要です（Feishu の `emoji_type` にマッピングされます。例：`SMILE`、`THUMBSUP`、`HEART`）。
    - `remove: true` には空でない `emoji` が必要で、その絵文字タイプに一致するボット自身のリアクションが削除されます。
    - 空の `emoji` と `clearAll: true` を指定すると、メッセージに付けたボットのすべてのリアクションが削除されます。

  </Accordion>

  <Accordion title="Signal">
    - 受信リアクション通知は `channels.signal.reactionNotifications` で制御します。`"off"` は通知を無効にし、`"own"`（デフォルト）はユーザーがボットのメッセージにリアクションしたときにイベントを発行し、`"all"` はすべてのリアクションに対してイベントを発行し、`"allowlist"` は `channels.signal.reactionAllowlist` に含まれる送信者についてのみイベントを発行します。

  </Accordion>

  <Accordion title="iMessage">
    - 送信リアクションは iMessage の Tapback（`love`、`like`、`dislike`、`laugh`、`emphasize`、`question`）です。リアクションを追加するには、`emoji` がこれらのいずれかの種類にマッピングされる必要があります。
    - 認識される Tapback の種類を指定せずに `remove: true` を設定すると、すべての Tapback の種類が削除されます。認識される種類を指定した場合は、その種類だけが削除されます。

  </Accordion>
</AccordionGroup>

## リアクションレベル

チャネルごとの `reactionLevel` は、エージェントが自身のリアクションを送信する頻度を制限します。値は `off`、`ack`、`minimal`、`extensive` です。

- [Telegram のリアクション通知](/ja-JP/channels/telegram#feature-reference) - `channels.telegram.reactionLevel`（デフォルト：`minimal`）
- [WhatsApp のリアクションレベル](/ja-JP/channels/whatsapp#reaction-level) - `channels.whatsapp.reactionLevel`（デフォルト：`minimal`）
- [Signal のリアクション](/ja-JP/channels/signal#reactions-message-tool) - `channels.signal.reactionLevel`（デフォルト：`minimal`）

## 関連項目

- [エージェント送信](/ja-JP/tools/agent-send) - `react` を含む `message` ツール
- [チャネル](/ja-JP/channels) - チャネル固有の設定

---
read_when:
    - 任意のチャンネルでリアクションに取り組む
    - 絵文字リアクションがプラットフォーム間でどのように異なるかを理解する
summary: サポートされるすべてのチャンネルにわたるリアクションツールのセマンティクス
title: リアクション
x-i18n:
    generated_at: "2026-07-05T11:56:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bcffae5deb5525b7f38fe827cce7ab46b66f238512d063c4cda651378efd8a67
    source_path: tools/reactions.md
    workflow: 16
---

エージェントは、`message` ツールの `react` アクションで絵文字リアクションを追加および削除します。動作はチャネルによって異なります。

## 仕組み

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- リアクションを追加する場合は `emoji` が必須です。
- 対応しているチャネルでボットのリアクションを削除するには、`emoji` を空文字列 (`""`) に設定します。
- 特定の絵文字を1つ削除するには、`remove: true` を設定します (空でない `emoji` が必要です)。
- ステータスリアクションを持つチャネルでは、リアクションで `trackToolCalls: true` を設定すると、ランタイムは同じターン中の以後のツール進捗リアクションに、そのリアクション済みメッセージを再利用できます。

## チャネルの動作

<AccordionGroup>
  <Accordion title="Discord and Slack">
    - 空の `emoji` は、メッセージ上のボットのすべてのリアクションを削除します。
    - `remove: true` は、指定された絵文字だけを削除します。

  </Accordion>

  <Accordion title="Google Chat">
    - 空の `emoji` (または `remove: true`) は、メッセージ上のボット自身のリアクションを削除し、設定されている場合は `emoji` で絞り込みます。
    - `remove: true` は、指定された絵文字だけを削除します。

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - リアクションの追加のみ: `emoji` は必須で、空であってはなりません。
    - リアクション削除はまだ delete 呼び出しに接続されていません。`remove: true` は何もせず黙って成功するのではなく、明示的なエラーで拒否されます。
    - `reaction` 機能で登録された Talk ボットが必要です ([Nextcloud Talk チャネルドキュメント](/ja-JP/channels/nextcloud-talk) を参照)。

  </Accordion>

  <Accordion title="Telegram">
    - 空の `emoji` は、ボットのリアクションを削除します。
    - `remove: true` もリアクションを削除しますが、ツール検証のために空でない `emoji` が引き続き必要です。

  </Accordion>

  <Accordion title="WhatsApp">
    - 空の `emoji` は、ボットのリアクションを削除します。
    - `remove: true` は内部的に空の絵文字へマッピングされます (ツール呼び出しでは引き続き `emoji` が必要です)。
    - WhatsApp にはメッセージごとにボットのリアクションスロットが1つあります。新しいリアクションを送信すると、複数の絵文字を積み重ねるのではなく置き換えられます。

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - 追加と削除の両方で空でない `emoji` が必要です。
    - `remove: true` は、その特定の絵文字リアクションを削除します。

  </Accordion>

  <Accordion title="Feishu/Lark">
    - 他のチャネルと同じ `react` アクションを使用します (メッセージリアクション ID による追加/削除/一覧)。別のツールではありません。
    - 追加には空でない `emoji` が必要です (Feishu の `emoji_type`、例: `SMILE`、`THUMBSUP`、`HEART` にマッピングされます)。
    - `remove: true` には空でない `emoji` が必要で、その絵文字タイプに一致するボット自身のリアクションを削除します。
    - `clearAll: true` と空の `emoji` は、メッセージ上のボットのすべてのリアクションを削除します。

  </Accordion>

  <Accordion title="Signal">
    - 受信リアクション通知は `channels.signal.reactionNotifications` で制御されます: `"off"` は無効化し、`"own"` (デフォルト) はユーザーがボットメッセージにリアクションしたときにイベントを発行し、`"all"` はすべてのリアクションについてイベントを発行し、`"allowlist"` は `channels.signal.reactionAllowlist` 内の送信者についてのみイベントを発行します。

  </Accordion>

  <Accordion title="iMessage">
    - 送信リアクションは iMessage の tapback (`love`、`like`、`dislike`、`laugh`、`emphasize`、`question`) です。リアクションを追加するには、`emoji` がこれらの種類のいずれかにマッピングされる必要があります。
    - 認識された tapback 種類なしの `remove: true` は、すべての tapback 種類を削除します。認識された種類がある場合は、その1つだけを削除します。

  </Accordion>
</AccordionGroup>

## リアクションレベル

チャネルごとの `reactionLevel` は、エージェントが自身のリアクションを送信する頻度を制限します。値: `off`、`ack`、`minimal`、`extensive`。

- [Telegram リアクション通知](/ja-JP/channels/telegram#feature-reference) - `channels.telegram.reactionLevel` (デフォルト `minimal`)
- [WhatsApp リアクションレベル](/ja-JP/channels/whatsapp#reaction-level) - `channels.whatsapp.reactionLevel` (デフォルト `minimal`)
- [Signal リアクション](/ja-JP/channels/signal#reactions-message-tool) - `channels.signal.reactionLevel` (デフォルト `minimal`)

## 関連

- [Agent Send](/ja-JP/tools/agent-send) - `react` を含む `message` ツール
- [チャネル](/ja-JP/channels) - チャネル固有の設定

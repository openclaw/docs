---
read_when:
    - あらゆるチャンネルでリアクションを操作する
    - プラットフォームごとの絵文字リアクションの違いを理解する
summary: サポートされているすべてのチャンネルにおけるリアクションツールのセマンティクス
title: リアクション
x-i18n:
    generated_at: "2026-07-11T22:45:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e148a93edbcfbe997075f6e9e191667ec257f76fa48162688fd1f333479661f0
    source_path: tools/reactions.md
    workflow: 16
---

エージェントは、`message`ツールの`react`アクションを使用して絵文字リアクションを追加および削除します。動作はチャンネルによって異なります。

## 仕組み

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- リアクションを追加する場合は`emoji`が必須です。
- 対応しているチャンネルでボットのリアクションを削除するには、`emoji`を空文字列（`""`）に設定します。
- 特定の絵文字を1つ削除するには、`remove: true`を設定します（空でない`emoji`が必要です）。
- ステータスリアクションに対応するチャンネルでは、リアクションに`trackToolCalls: true`を設定すると、ランタイムは同じターン中の後続のツール進捗リアクションに、そのリアクションが付いたメッセージを再利用できます。

## チャンネルごとの動作

<AccordionGroup>
  <Accordion title="DiscordとSlack">
    - 空の`emoji`を指定すると、メッセージに付けたボットのすべてのリアクションが削除されます。
    - `remove: true`を指定すると、指定した絵文字だけが削除されます。

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - リアクションの追加のみ対応しています。`emoji`は必須で、空にできません。
    - リアクションの削除はまだ削除呼び出しに接続されていません。`remove: true`は何もせず暗黙に処理されるのではなく、明示的なエラーとして拒否されます。
    - `reaction`機能を有効にして登録されたTalkボットが必要です（[Nextcloud Talkチャンネルのドキュメント](/ja-JP/channels/nextcloud-talk)を参照）。

  </Accordion>

  <Accordion title="Telegram">
    - 空の`emoji`を指定すると、ボットのリアクションが削除されます。
    - `remove: true`でもリアクションが削除されますが、ツールの検証では引き続き空でない`emoji`が必要です。

  </Accordion>

  <Accordion title="WhatsApp">
    - 空の`emoji`を指定すると、ボットのリアクションが削除されます。
    - `remove: true`は内部で空の絵文字に変換されます（ツール呼び出しでは引き続き`emoji`が必要です）。
    - WhatsAppでは、メッセージごとにボットのリアクション枠が1つあります。新しいリアクションを送信すると、複数の絵文字が積み重なるのではなく、既存のリアクションが置き換えられます。

  </Accordion>

  <Accordion title="Zalo Personal（zalouser）">
    - 追加と削除の両方で、空でない`emoji`が必要です。
    - `remove: true`を指定すると、その特定の絵文字リアクションが削除されます。

  </Accordion>

  <Accordion title="Feishu/Lark">
    - 別個のツールではなく、他のチャンネルと同じ`react`アクションを使用します（メッセージのリアクションIDによる追加、削除、一覧取得）。
    - 追加には空でない`emoji`が必要です（Feishuの`emoji_type`にマッピングされます。例：`SMILE`、`THUMBSUP`、`HEART`）。
    - `remove: true`には空でない`emoji`が必要で、その絵文字タイプに一致するボット自身のリアクションを削除します。
    - 空の`emoji`と`clearAll: true`を指定すると、メッセージに付けたボットのすべてのリアクションが削除されます。

  </Accordion>

  <Accordion title="Signal">
    - 受信リアクション通知は`channels.signal.reactionNotifications`で制御します。`"off"`は通知を無効にし、`"own"`（デフォルト）はユーザーがボットのメッセージにリアクションしたときにイベントを発行し、`"all"`はすべてのリアクションについてイベントを発行し、`"allowlist"`は`channels.signal.reactionAllowlist`に含まれる送信者についてのみイベントを発行します。

  </Accordion>

  <Accordion title="iMessage">
    - 送信リアクションはiMessageのタップバック（`love`、`like`、`dislike`、`laugh`、`emphasize`、`question`）です。リアクションを追加するには、`emoji`がこれらの種類のいずれかにマッピングされる必要があります。
    - 認識されるタップバック種別なしで`remove: true`を指定すると、すべてのタップバック種別が削除されます。認識される種別を指定した場合は、その種別だけが削除されます。

  </Accordion>
</AccordionGroup>

## リアクションレベル

チャンネルごとの`reactionLevel`は、エージェントが自身のリアクションを送信する頻度を制限します。値は`off`、`ack`、`minimal`、`extensive`です。

- [Telegramのリアクション通知](/ja-JP/channels/telegram#feature-reference) - `channels.telegram.reactionLevel`（デフォルト：`minimal`）
- [WhatsAppのリアクションレベル](/ja-JP/channels/whatsapp#reaction-level) - `channels.whatsapp.reactionLevel`（デフォルト：`minimal`）
- [Signalのリアクション](/ja-JP/channels/signal#reactions-message-tool) - `channels.signal.reactionLevel`（デフォルト：`minimal`）

## 関連項目

- [エージェント送信](/ja-JP/tools/agent-send) - `react`を含む`message`ツール
- [チャンネル](/ja-JP/channels) - チャンネル固有の設定

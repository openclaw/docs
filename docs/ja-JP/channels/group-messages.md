---
read_when:
    - グループメッセージのルールまたはメンションを変更する
summary: WhatsApp グループメッセージ処理の動作と設定（`mentionPatterns` は各サーフェス間で共有されます）
title: グループメッセージ
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-25T13:41:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 740eee61d15a24b09b4b896613ff9e0235457708d9dcbe0c3b1d5e136cefb975
    source_path: channels/group-messages.md
    workflow: 15
---

Clawd が WhatsApp グループに参加し、ピングされたときだけ反応し、そのスレッドを個人DMセッションとは分離して維持できるようにすることを目的とします。

注意: `agents.list[].groupChat.mentionPatterns` は現在、Telegram/Discord/Slack/iMessage でも使用されます。このドキュメントでは WhatsApp 固有の動作に焦点を当てます。マルチエージェント構成では、エージェントごとに `agents.list[].groupChat.mentionPatterns` を設定してください（または、グローバルなフォールバックとして `messages.groupChat.mentionPatterns` を使用してください）。

## 現在の実装（2025-12-03）

- アクティベーションモード: `mention`（デフォルト）または `always`。`mention` ではピングが必要です（`mentionedJids` による実際の WhatsApp @メンション、安全な正規表現パターン、またはテキスト内の任意位置にあるボットの E.164）。`always` はすべてのメッセージでエージェントを起動しますが、意味のある価値を追加できる場合にのみ返信し、それ以外の場合は正確にサイレントトークン `NO_REPLY` / `no_reply` を返す必要があります。デフォルトは設定の `channels.whatsapp.groups` で設定でき、グループごとに `/activation` で上書きできます。`channels.whatsapp.groups` が設定されている場合、それはグループの許可リストとしても機能します（すべてを許可するには `"*"` を含めます）。
- グループポリシー: `channels.whatsapp.groupPolicy` は、グループメッセージを受け入れるかどうかを制御します（`open|disabled|allowlist`）。`allowlist` は `channels.whatsapp.groupAllowFrom` を使用します（フォールバック: 明示的な `channels.whatsapp.allowFrom`）。デフォルトは `allowlist` です（送信者を追加するまでブロックされます）。
- グループごとのセッション: セッションキーは `agent:<agentId>:whatsapp:group:<jid>` のようになります。そのため、`/verbose on`、`/trace on`、`/think high` のようなコマンド（スタンドアロンメッセージとして送信）はそのグループに限定され、個人DMの状態には影響しません。Heartbeat はグループスレッドではスキップされます。
- コンテキスト注入: 実行をトリガーしなかった**保留中のみ**のグループメッセージ（デフォルト 50 件）は、`[Chat messages since your last reply - for context]` の下にプレフィックスとして追加され、トリガーした行は `[Current message - respond to this]` の下に追加されます。すでにセッションにあるメッセージは再注入されません。
- 送信者の提示: すべてのグループバッチの末尾に `[from: Sender Name (+E164)]` が追加されるようになったため、Pi は誰が話しているのかを把握できます。
- 一時メッセージ/view-once: テキストやメンションを抽出する前にこれらをアンラップするため、それらの中のピングでもトリガーされます。
- グループシステムプロンプト: グループセッションの最初のターン時（および `/activation` でモードが変更されるたび）に、`You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` のような短い説明をシステムプロンプトに注入します。メタデータが利用できない場合でも、それがグループチャットであることはエージェントに伝えます。

## 設定例（WhatsApp）

WhatsApp がテキスト本文中の視覚的な `@` を削除した場合でも表示名でのピングが機能するよう、`~/.openclaw/openclaw.json` に `groupChat` ブロックを追加します。

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

注意事項:

- 正規表現は大文字小文字を区別せず、他の設定用正規表現サーフェスと同じ safe-regex ガードレールを使用します。無効なパターンや安全でないネストした繰り返しは無視されます。
- WhatsApp は、誰かが連絡先をタップしたときに `mentionedJids` による正規のメンションを引き続き送信するため、番号フォールバックが必要になることはまれですが、有用な安全策になります。

### アクティベーションコマンド（owner のみ）

グループチャットコマンドを使用します。

- `/activation mention`
- `/activation always`

これを変更できるのは owner の番号のみです（`channels.whatsapp.allowFrom`、または未設定時はボット自身の E.164）。現在のアクティベーションモードを確認するには、グループで `/status` をスタンドアロンメッセージとして送信してください。

## 使用方法

1. WhatsApp アカウント（OpenClaw を実行しているもの）をグループに追加します。
2. `@openclaw …` と発言するか、番号を含めます。`groupPolicy: "open"` を設定していない限り、許可リストに載っている送信者だけがトリガーできます。
3. エージェントプロンプトには、最近のグループコンテキストと末尾の `[from: …]` マーカーが含まれるため、適切な相手に応答できます。
4. セッションレベルのディレクティブ（`/verbose on`、`/trace on`、`/think high`、`/new` または `/reset`、`/compact`）はそのグループのセッションにのみ適用されます。認識されるように、スタンドアロンメッセージとして送信してください。個人DMセッションは独立したままです。

## テスト / 検証

- 手動スモークテスト:
  - グループ内で `@openclaw` のピングを送り、送信者名を参照した返信があることを確認する。
  - 2回目のピングを送り、履歴ブロックが含まれ、その次のターンでクリアされることを確認する。
- Gateway ログ（`--verbose` で実行）を確認し、`from: <groupJid>` と `[from: …]` サフィックスを示す `inbound web message` エントリを確認します。

## 既知の考慮事項

- Heartbeat は、ノイズの多いブロードキャストを避けるため、グループでは意図的にスキップされます。
- エコー抑制は結合されたバッチ文字列を使用します。メンションなしで同一テキストを2回送信した場合、返信を受けるのは最初の1回だけです。
- セッションストアのエントリは、セッションストア（デフォルトでは `~/.openclaw/agents/<agentId>/sessions/sessions.json`）内で `agent:<agentId>:whatsapp:group:<jid>` として表示されます。エントリがない場合は、そのグループがまだ実行をトリガーしていないことを意味するだけです。
- グループ内の入力中インジケーターは `agents.defaults.typingMode` に従います（デフォルト: メンションされていない場合は `message`）。

## 関連

- [Groups](/ja-JP/channels/groups)
- [Channel routing](/ja-JP/channels/channel-routing)
- [Broadcast groups](/ja-JP/channels/broadcast-groups)

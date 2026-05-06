---
read_when:
    - WhatsAppグループを個別に設定する
    - WhatsApp のアクティベーションモードの変更（`mention` と `always`）
    - WhatsApp グループセッションキーまたは保留中メッセージコンテキストの調整
sidebarTitle: WhatsApp groups
summary: WhatsApp グループメッセージの処理 — 有効化、許可リスト、セッション、コンテキスト注入
title: WhatsApp グループメッセージ
x-i18n:
    generated_at: "2026-05-06T09:03:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 489f04ea9f4d0954f77eee4590d609383d5dc987eaaea5eb121b454620a2d0fe
    source_path: channels/group-messages.md
    workflow: 16
---

クロスチャネルのグループモデル (Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo) については、[グループ](/ja-JP/channels/groups) を参照してください。このページでは、そのモデルの上にある WhatsApp 固有の挙動、つまり有効化、グループ許可リスト、グループごとのセッションキー、保留メッセージのコンテキスト注入について説明します。

目標: OpenClaw を WhatsApp グループ内に常駐させ、ping されたときだけ起動し、そのスレッドを個人 DM セッションとは別に保つこと。

<Note>
`agents.list[].groupChat.mentionPatterns` は Telegram、Discord、Slack、iMessage でも使用されます。複数エージェント構成では、エージェントごとに設定するか、グローバルなフォールバックとして `messages.groupChat.mentionPatterns` を使用してください。
</Note>

## 挙動

- 有効化モード: `mention` (デフォルト) または `always`。`mention` では ping ( `mentionedJids` による実際の WhatsApp @メンション、安全な正規表現パターン、または本文中の任意の位置にあるボットの E.164) が必要です。`always` はすべてのメッセージでエージェントを起動しますが、意味のある価値を追加できる場合にのみ返信するべきです。そうでない場合は、正確なサイレントトークン `NO_REPLY` / `no_reply` を返します。デフォルトは設定 (`channels.whatsapp.groups`) で指定でき、`/activation` によってグループごとに上書きできます。`channels.whatsapp.groups` が設定されている場合は、グループ許可リストとしても機能します (すべてを許可するには `"*"` を含めます)。
- グループポリシー: `channels.whatsapp.groupPolicy` は、グループメッセージを受け入れるかどうか (`open|disabled|allowlist`) を制御します。`allowlist` は `channels.whatsapp.groupAllowFrom` を使用します (フォールバック: 明示的な `channels.whatsapp.allowFrom`)。デフォルトは `allowlist` です (送信者を追加するまでブロックされます)。
- グループごとのセッション: セッションキーは `agent:<agentId>:whatsapp:group:<jid>` のような形式になるため、`/verbose on`、`/trace on`、`/think high` などのコマンド (単独メッセージとして送信) はそのグループにスコープされます。個人 DM の状態は変更されません。Heartbeat はグループスレッドではスキップされます。
- コンテキスト注入: 実行をトリガーしなかった **保留中のみ** のグループメッセージ (デフォルト 50 件) は、`[Chat messages since your last reply - for context]` の下にプレフィックスされ、トリガー行は `[Current message - respond to this]` の下に置かれます。すでにセッション内にあるメッセージは再注入されません。
- 送信者の提示: 各グループバッチの末尾に `[from: Sender Name (+E164)]` が付くようになったため、Pi は誰が話しているかを把握できます。
- エフェメラル/一度だけ表示: テキストやメンションを抽出する前にこれらを展開するため、その中の ping もトリガーされます。
- グループシステムプロンプト: グループセッションの最初のターン (および `/activation` がモードを変更したとき) に、`You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), ... Activation: trigger-only ... Address the specific sender noted in the message context.` のような短い説明をシステムプロンプトに注入します。メタデータを利用できない場合でも、グループチャットであることはエージェントに伝えます。

## 設定例 (WhatsApp)

WhatsApp が本文内の視覚的な `@` を取り除く場合でも表示名 ping が機能するように、`~/.openclaw/openclaw.json` に `groupChat` ブロックを追加します。

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

注:

- 正規表現は大文字小文字を区別せず、他の設定正規表現サーフェスと同じ安全な正規表現ガードレールを使用します。無効なパターンや安全でない入れ子反復は無視されます。
- 誰かが連絡先をタップした場合、WhatsApp は引き続き `mentionedJids` 経由で正規のメンションを送信するため、番号フォールバックが必要になることはほとんどありませんが、有用な安全網になります。

### 有効化コマンド (所有者のみ)

グループチャットコマンドを使用します。

- `/activation mention`
- `/activation always`

これを変更できるのは、所有者番号 (`channels.whatsapp.allowFrom` から取得、未設定の場合はボット自身の E.164) のみです。現在の有効化モードを確認するには、グループ内で単独メッセージとして `/status` を送信します。

## 使い方

1. 自分の WhatsApp アカウント (OpenClaw を実行しているアカウント) をグループに追加します。
2. `@openclaw …` と発言します (または番号を含めます)。`groupPolicy: "open"` を設定しない限り、許可リストに含まれる送信者だけがトリガーできます。
3. エージェントプロンプトには、最近のグループコンテキストと末尾の `[from: …]` マーカーが含まれるため、適切な相手に話しかけられます。
4. セッションレベルの指示 (`/verbose on`、`/trace on`、`/think high`、`/new` または `/reset`、`/compact`) はそのグループのセッションにのみ適用されます。登録されるように、単独メッセージとして送信してください。個人 DM セッションは独立したままです。

## テスト / 検証

- 手動スモーク:
  - グループで `@openclaw` ping を送信し、送信者名を参照する返信を確認します。
  - 2 回目の ping を送信し、履歴ブロックが含まれ、その次のターンでクリアされることを確認します。
- Gateway ログ (`--verbose` 付きで実行) を確認し、`from: <groupJid>` と `[from: …]` サフィックスを示す `inbound web message` エントリを確認します。

## 既知の考慮事項

- Heartbeat は、ノイズの多いブロードキャストを避けるため、グループでは意図的にスキップされます。
- エコー抑制は結合されたバッチ文字列を使用します。同一のテキストをメンションなしで 2 回送信した場合、最初のものだけが応答を受け取ります。
- セッションストアのエントリは、デフォルトではセッションストア (`~/.openclaw/agents/<agentId>/sessions/sessions.json`) 内に `agent:<agentId>:whatsapp:group:<jid>` として表示されます。エントリがない場合は、そのグループがまだ実行をトリガーしていないことを意味するだけです。
- グループ内の入力インジケーターは `agents.defaults.typingMode` に従います。表示される返信がデフォルトのメッセージツールのみモードを使用している場合、デフォルトでは入力が即座に開始されるため、自動の最終返信が投稿されない場合でも、グループメンバーはエージェントが作業中であることを確認できます。明示的な入力モード設定は引き続き優先されます。

## 関連

- [グループ](/ja-JP/channels/groups)
- [チャネルルーティング](/ja-JP/channels/channel-routing)
- [ブロードキャストグループ](/ja-JP/channels/broadcast-groups)

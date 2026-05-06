---
read_when:
    - WhatsApp グループを個別に設定する
    - WhatsAppの有効化モードの変更 (`mention` と `always`)
    - WhatsApp グループセッションキーまたは保留メッセージコンテキストの調整
sidebarTitle: WhatsApp groups
summary: WhatsApp グループメッセージ処理 — 有効化、許可リスト、セッション、コンテキスト注入
title: WhatsApp のグループメッセージ
x-i18n:
    generated_at: "2026-05-06T04:57:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1fa520f0722d804bba253c9ad72d821234d4a27801badb0d7d4c2ca3ea51bec9
    source_path: channels/group-messages.md
    workflow: 16
---

クロスチャネルのグループモデル（Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo）については、[グループ](/ja-JP/channels/groups)を参照してください。このページでは、そのモデルの上にある WhatsApp 固有の動作（有効化、グループ許可リスト、グループごとのセッションキー、保留メッセージのコンテキスト注入）について説明します。

目標: OpenClaw を WhatsApp グループに参加させ、ping されたときだけ起動し、そのスレッドを個人 DM セッションから分離して保持します。

<Note>
`agents.list[].groupChat.mentionPatterns` は Telegram、Discord、Slack、iMessage でも使われます。マルチエージェント構成ではエージェントごとに設定するか、グローバルなフォールバックとして `messages.groupChat.mentionPatterns` を使います。
</Note>

## 動作

- 有効化モード: `mention`（デフォルト）または `always`。`mention` では ping（`mentionedJids` 経由の実際の WhatsApp @メンション、安全な正規表現パターン、または本文中の任意の場所にある bot の E.164）が必要です。`always` はすべてのメッセージでエージェントを起動しますが、意味のある価値を追加できる場合にのみ返信する必要があります。それ以外の場合は、正確なサイレントトークン `NO_REPLY` / `no_reply` を返します。デフォルトは設定（`channels.whatsapp.groups`）で設定でき、`/activation` によってグループごとに上書きできます。`channels.whatsapp.groups` が設定されている場合、グループ許可リストとしても機能します（すべてを許可するには `"*"` を含めます）。
- グループポリシー: `channels.whatsapp.groupPolicy` は、グループメッセージを受け入れるかどうか（`open|disabled|allowlist`）を制御します。`allowlist` は `channels.whatsapp.groupAllowFrom`（フォールバック: 明示的な `channels.whatsapp.allowFrom`）を使います。デフォルトは `allowlist` です（送信者を追加するまでブロックされます）。
- グループごとのセッション: セッションキーは `agent:<agentId>:whatsapp:group:<jid>` のようになるため、`/verbose on`、`/trace on`、`/think high`（単独メッセージとして送信）などのコマンドはそのグループにスコープされます。個人 DM の状態は変更されません。Heartbeat はグループスレッドではスキップされます。
- コンテキスト注入: 実行をトリガーしなかった**保留のみ**のグループメッセージ（デフォルト 50 件）は、`[Chat messages since your last reply - for context]` の下にプレフィックスされ、トリガー行は `[Current message - respond to this]` の下に置かれます。すでにセッション内にあるメッセージは再注入されません。
- 送信者の表示: すべてのグループバッチの末尾に `[from: Sender Name (+E164)]` が付くようになり、Pi は誰が発話しているかを把握できます。
- エフェメラル/一度だけ表示: テキスト/メンションを抽出する前にそれらを展開するため、その中の ping もトリガーになります。
- グループシステムプロンプト: グループセッションの最初のターン（および `/activation` がモードを変更するたび）に、`You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` のような短い説明をシステムプロンプトに注入します。メタデータを利用できない場合でも、グループチャットであることはエージェントに伝えます。

## 設定例（WhatsApp）

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

注記:

- 正規表現は大文字小文字を区別せず、他の設定正規表現サーフェスと同じ安全な正規表現ガードレールを使います。無効なパターンや安全でないネストされた繰り返しは無視されます。
- 誰かが連絡先をタップした場合、WhatsApp は `mentionedJids` 経由で正規のメンションを引き続き送信するため、番号フォールバックが必要になることはまれですが、有用なセーフティネットです。

### 有効化コマンド（所有者のみ）

グループチャットコマンドを使います。

- `/activation mention`
- `/activation always`

これを変更できるのは、所有者番号（`channels.whatsapp.allowFrom` から取得、未設定の場合は bot 自身の E.164）だけです。現在の有効化モードを確認するには、グループ内で `/status` を単独メッセージとして送信します。

## 使い方

1. WhatsApp アカウント（OpenClaw を実行しているアカウント）をグループに追加します。
2. `@openclaw …` と発言します（または番号を含めます）。`groupPolicy: "open"` を設定しない限り、許可リストに含まれる送信者だけがトリガーできます。
3. エージェントプロンプトには、直近のグループコンテキストと末尾の `[from: …]` マーカーが含まれるため、適切な相手に応答できます。
4. セッションレベルの指示（`/verbose on`、`/trace on`、`/think high`、`/new` または `/reset`、`/compact`）は、そのグループのセッションにのみ適用されます。登録されるように、単独メッセージとして送信します。個人 DM セッションは独立したままです。

## テスト / 検証

- 手動スモーク:
  - グループで `@openclaw` ping を送信し、送信者名を参照した返信があることを確認します。
  - 2 回目の ping を送信し、履歴ブロックが含まれてから次のターンでクリアされることを確認します。
- Gateway ログ（`--verbose` 付きで実行）を確認し、`from: <groupJid>` と `[from: …]` サフィックスを示す `inbound web message` エントリを確認します。

## 既知の考慮事項

- ノイズの多いブロードキャストを避けるため、Heartbeat はグループでは意図的にスキップされます。
- エコー抑制は結合されたバッチ文字列を使います。メンションなしで同一テキストを 2 回送信した場合、最初のものだけが応答を受けます。
- セッションストアのエントリは、デフォルトではセッションストア（`~/.openclaw/agents/<agentId>/sessions/sessions.json`）内に `agent:<agentId>:whatsapp:group:<jid>` として表示されます。エントリがない場合は、そのグループがまだ実行をトリガーしていないことを意味するだけです。
- グループでの入力中インジケーターは `agents.defaults.typingMode` に従います。表示される返信がデフォルトのメッセージツール専用モードを使う場合、デフォルトでは入力中表示がすぐに開始されるため、自動の最終返信が投稿されない場合でも、グループメンバーはエージェントが作業中であることを確認できます。明示的な入力モード設定がある場合は、それが引き続き優先されます。

## 関連

- [グループ](/ja-JP/channels/groups)
- [チャネルルーティング](/ja-JP/channels/channel-routing)
- [ブロードキャストグループ](/ja-JP/channels/broadcast-groups)

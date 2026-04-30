---
read_when:
    - グループメッセージのルールまたはメンションを変更する
summary: WhatsAppグループメッセージ処理の動作と設定（mentionPatterns は各サーフェスで共有されます）
title: グループメッセージ
x-i18n:
    generated_at: "2026-04-30T04:58:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: eb7713f83b3bf309336c4b09add17835b13facb17a5a1e3db48c25d892988ee4
    source_path: channels/group-messages.md
    workflow: 16
---

Goal: Clawd を WhatsApp グループ内に置き、ping されたときだけ起動させ、そのスレッドを個人 DM セッションから分離しておく。

<Note>
`agents.list[].groupChat.mentionPatterns` は Telegram、Discord、Slack、iMessage でも使用されます。このドキュメントでは WhatsApp 固有の動作に焦点を当てます。複数エージェント構成では、エージェントごとに `agents.list[].groupChat.mentionPatterns` を設定するか、グローバルなフォールバックとして `messages.groupChat.mentionPatterns` を使用します。
</Note>

## 現在の実装 (2025-12-03)

- 起動モード: `mention` (デフォルト) または `always`。`mention` では ping が必要です (実際の WhatsApp @メンションは `mentionedJids`、安全な正規表現パターン、またはテキスト内の任意の場所にあるボットの E.164 で検出)。`always` はすべてのメッセージでエージェントを起動しますが、意味のある価値を追加できる場合にのみ返信すべきです。それ以外の場合は、正確な無音トークン `NO_REPLY` / `no_reply` を返します。デフォルトは設定 (`channels.whatsapp.groups`) で指定でき、グループごとに `/activation` で上書きできます。`channels.whatsapp.groups` が設定されている場合は、グループの許可リストとしても機能します (すべてを許可するには `"*"` を含めます)。
- グループポリシー: `channels.whatsapp.groupPolicy` はグループメッセージを受け入れるかどうかを制御します (`open|disabled|allowlist`)。`allowlist` は `channels.whatsapp.groupAllowFrom` を使用します (フォールバック: 明示的な `channels.whatsapp.allowFrom`)。デフォルトは `allowlist` です (送信者を追加するまでブロックされます)。
- グループごとのセッション: セッションキーは `agent:<agentId>:whatsapp:group:<jid>` のようになるため、`/verbose on`、`/trace on`、`/think high` などのコマンド (単独メッセージとして送信) はそのグループにスコープされます。個人 DM の状態には影響しません。グループスレッドでは Heartbeat はスキップされます。
- コンテキスト注入: 実行をトリガーしなかった **保留中のみ** のグループメッセージ (デフォルト 50 件) は、`[Chat messages since your last reply - for context]` の下に接頭辞付きで追加され、トリガー行は `[Current message - respond to this]` の下に置かれます。すでにセッション内にあるメッセージは再注入されません。
- 送信者の提示: すべてのグループバッチの末尾に `[from: Sender Name (+E164)]` が付くようになったため、Pi は誰が話しているかを把握できます。
- エフェメラル/一度だけ表示: テキスト/メンションを抽出する前にこれらを展開するため、その中の ping でもトリガーされます。
- グループシステムプロンプト: グループセッションの最初のターン (および `/activation` がモードを変更するたび) に、`You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` のような短い説明をシステムプロンプトに注入します。メタデータが利用できない場合でも、エージェントにはグループチャットであることを伝えます。

## 設定例 (WhatsApp)

WhatsApp がテキスト本文内の視覚的な `@` を取り除く場合でも表示名 ping が機能するように、`~/.openclaw/openclaw.json` に `groupChat` ブロックを追加します。

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

- 正規表現は大文字小文字を区別せず、他の設定正規表現サーフェスと同じ安全な正規表現ガードレールを使用します。無効なパターンや安全でない入れ子の繰り返しは無視されます。
- 誰かが連絡先をタップすると、WhatsApp は引き続き `mentionedJids` 経由で正規のメンションを送信するため、番号フォールバックが必要になることはまれですが、有用な安全策です。

### 起動コマンド (所有者のみ)

グループチャットコマンドを使用します。

- `/activation mention`
- `/activation always`

これを変更できるのは所有者番号 (`channels.whatsapp.allowFrom` から取得、未設定の場合はボット自身の E.164) のみです。現在の起動モードを確認するには、グループ内で `/status` を単独メッセージとして送信します。

## 使い方

1. WhatsApp アカウント (OpenClaw を実行しているもの) をグループに追加します。
2. `@openclaw …` と発言します (または番号を含めます)。`groupPolicy: "open"` を設定しない限り、許可リストに含まれる送信者だけがトリガーできます。
3. エージェントプロンプトには、最近のグループコンテキストに加えて末尾の `[from: …]` マーカーが含まれるため、適切な相手に宛てて応答できます。
4. セッションレベルの指示 (`/verbose on`、`/trace on`、`/think high`、`/new` または `/reset`、`/compact`) は、そのグループのセッションにのみ適用されます。登録されるように、単独メッセージとして送信してください。個人 DM セッションは独立したままです。

## テスト / 検証

- 手動スモーク:
  - グループ内で `@openclaw` ping を送信し、送信者名を参照する返信があることを確認します。
  - 2 回目の ping を送信し、履歴ブロックが含まれ、その次のターンでクリアされることを確認します。
- Gateway ログ (`--verbose` 付きで実行) を確認し、`from: <groupJid>` と `[from: …]` 接尾辞を示す `inbound web message` エントリを確認します。

## 既知の考慮事項

- ノイズの多いブロードキャストを避けるため、グループでは Heartbeat が意図的にスキップされます。
- エコー抑制は結合されたバッチ文字列を使用します。メンションなしで同一テキストを 2 回送信した場合、応答を受け取るのは最初の 1 回だけです。
- セッションストアのエントリは、セッションストア (デフォルトでは `~/.openclaw/agents/<agentId>/sessions/sessions.json`) に `agent:<agentId>:whatsapp:group:<jid>` として表示されます。エントリがない場合は、そのグループがまだ実行をトリガーしていないことを意味します。
- グループ内の入力インジケーターは `agents.defaults.typingMode` に従います。表示される返信がデフォルトのメッセージツールのみモードを使用する場合、デフォルトでは入力がすぐに開始されるため、自動の最終返信が投稿されない場合でも、グループメンバーはエージェントが作業中であることを確認できます。明示的な入力モード設定は引き続き優先されます。

## 関連

- [グループ](/ja-JP/channels/groups)
- [チャネルルーティング](/ja-JP/channels/channel-routing)
- [ブロードキャストグループ](/ja-JP/channels/broadcast-groups)

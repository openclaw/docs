---
read_when:
    - WhatsApp グループを個別に設定する
    - WhatsApp のアクティベーションモードの変更（`mention` と `always`）
    - WhatsApp グループセッションキーまたは保留中メッセージコンテキストの調整
sidebarTitle: WhatsApp groups
summary: WhatsAppグループメッセージ処理 — 起動、許可リスト、セッション、コンテキスト注入
title: WhatsApp グループメッセージ
x-i18n:
    generated_at: "2026-06-27T10:34:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 790866fd959b43d94b745082f3c90920b81c0a016492e9e164c600663f1b2eee
    source_path: channels/group-messages.md
    workflow: 16
---

クロスチャネルグループモデル (Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo) については、[グループ](/ja-JP/channels/groups) を参照してください。このページでは、そのモデルの上にある WhatsApp 固有の動作、つまりアクティベーション、グループ許可リスト、グループごとのセッションキー、保留メッセージのコンテキスト注入について説明します。

目標: OpenClaw が WhatsApp グループに参加し、呼び出されたときだけ起動し、そのスレッドを個人 DM セッションから分離して維持できるようにする。

<Note>
`agents.list[].groupChat.mentionPatterns` は Telegram、Discord、Slack、iMessage でも使用されます。マルチエージェント構成では、エージェントごとに設定するか、グローバルフォールバックとして `messages.groupChat.mentionPatterns` を使用してください。
</Note>

## 動作

- アクティベーションモード: `mention` (デフォルト) または `always`。`mention` では呼び出しが必要です (実際の WhatsApp @メンションは `mentionedJids` 経由、安全な正規表現パターン、またはテキスト内の任意の場所にあるボットの E.164)。`always` はすべてのメッセージでエージェントを起動しますが、意味のある価値を追加できる場合にのみ返信すべきです。それ以外の場合は正確なサイレントトークン `NO_REPLY` / `no_reply` を返します。デフォルトは設定 (`channels.whatsapp.groups`) で指定でき、グループごとに `/activation` で上書きできます。`channels.whatsapp.groups` が設定されている場合、グループ許可リストとしても機能します (すべてを許可するには `"*"` を含めます)。
- グループポリシー: `channels.whatsapp.groupPolicy` はグループメッセージを受け入れるかどうか (`open|disabled|allowlist`) を制御します。`allowlist` は `channels.whatsapp.groupAllowFrom` を使用します (フォールバック: 明示的な `channels.whatsapp.allowFrom`)。デフォルトは `allowlist` です (送信者を追加するまでブロックされます)。
- グループごとのセッション: セッションキーは `agent:<agentId>:whatsapp:group:<jid>` のようになるため、`/verbose on`、`/trace on`、`/think high` などのコマンド (単独メッセージとして送信) はそのグループにスコープされます。個人 DM の状態は影響を受けません。グループスレッドでは Heartbeat はスキップされます。
- コンテキスト注入: 実行をトリガーしなかった **保留中のみ** のグループメッセージ (デフォルト 50 件) は、`[Chat messages since your last reply - for context]` の下にプレフィックスされ、トリガー行は `[Current message - respond to this]` の下に置かれます。すでにセッション内にあるメッセージは再注入されません。
- 送信者の提示: すべてのグループバッチは `[from: Sender Name (+E164)]` で終わるようになったため、OpenClaw は誰が発言しているかを把握できます。
- エフェメラル/表示 1 回: テキスト/メンションを抽出する前にこれらを展開するため、その中の呼び出しもトリガーされます。
- グループシステムプロンプト: グループセッションの最初のターン (および `/activation` がモードを変更するたび) に、`You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), ... Activation: trigger-only ... Address the specific sender noted in the message context.` のような短い説明をシステムプロンプトに注入します。メタデータが利用できない場合でも、グループチャットであることはエージェントに伝えます。

## 設定例 (WhatsApp)

WhatsApp がテキスト本文内の視覚的な `@` を取り除く場合でも表示名による呼び出しが機能するように、`~/.openclaw/openclaw.json` に `groupChat` ブロックを追加します。

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

- 正規表現は大文字小文字を区別せず、他の設定正規表現サーフェスと同じ安全な正規表現ガードレールを使用します。無効なパターンや安全でないネストされた繰り返しは無視されます。
- 誰かが連絡先をタップすると WhatsApp は引き続き `mentionedJids` 経由で正規のメンションを送信するため、番号フォールバックが必要になることはまれですが、有用な安全網です。

### アクティベーションコマンド (所有者のみ)

グループチャットコマンドを使用します。

- `/activation mention`
- `/activation always`

所有者番号 (`channels.whatsapp.allowFrom` から取得、未設定の場合はボット自身の E.164) のみがこれを変更できます。現在のアクティベーションモードを確認するには、グループ内で `/status` を単独メッセージとして送信します。

## 使用方法

1. WhatsApp アカウント (OpenClaw を実行しているもの) をグループに追加します。
2. `@openclaw …` と発言します (または番号を含めます)。`groupPolicy: "open"` を設定しない限り、許可リストにある送信者だけがトリガーできます。
3. エージェントプロンプトには、最近のグループコンテキストに加えて末尾の `[from: …]` マーカーが含まれるため、適切な相手に呼びかけられます。
4. セッションレベルのディレクティブ (`/verbose on`、`/trace on`、`/think high`、`/new` または `/reset`、`/compact`) は、そのグループのセッションにのみ適用されます。登録されるように単独メッセージとして送信してください。個人 DM セッションは独立したままです。

## テスト / 検証

- 手動スモーク:
  - グループで `@openclaw` の呼び出しを送信し、送信者名を参照する返信があることを確認します。
  - 2 回目の呼び出しを送信し、履歴ブロックが含まれた後、次のターンでクリアされることを検証します。
- Gateway ログ (`--verbose` 付きで実行) を確認し、`from: <groupJid>` と `[from: …]` サフィックスを示す `inbound web message` エントリを確認します。

## 既知の考慮事項

- 騒がしいブロードキャストを避けるため、グループでは Heartbeat は意図的にスキップされます。
- エコー抑制は結合されたバッチ文字列を使用します。同一のテキストをメンションなしで 2 回送信した場合、返信を受け取るのは最初の 1 回だけです。
- セッションストアエントリは、デフォルトではセッションストア (`~/.openclaw/agents/<agentId>/sessions/sessions.json`) 内に `agent:<agentId>:whatsapp:group:<jid>` として表示されます。エントリがない場合は、そのグループがまだ実行をトリガーしていないことを意味するだけです。
- グループでの入力インジケーターは `agents.defaults.typingMode` に従います。表示される返信がメッセージツールのみモードにオプトインされている場合、自動の最終返信が投稿されなくてもエージェントが作業中であることをグループメンバーが確認できるように、デフォルトで入力がすぐに開始されます。明示的な入力モード設定は引き続き優先されます。

## 関連

- [グループ](/ja-JP/channels/groups)
- [チャネルルーティング](/ja-JP/channels/channel-routing)
- [ブロードキャストグループ](/ja-JP/channels/broadcast-groups)

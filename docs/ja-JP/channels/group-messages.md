---
read_when:
    - グループメッセージのルールやメンションを変更する場合
summary: WhatsApp のグループメッセージ処理に関する動作と設定（mentionPatterns は各サーフェス間で共有されます）
title: グループメッセージ
x-i18n:
    generated_at: "2026-04-24T04:45:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: f67ed72c0e61aef18a529cb1d9dbc98909e213352ff7cbef93fe4c9bf8357186
    source_path: channels/group-messages.md
    workflow: 15
---

# グループメッセージ（WhatsApp Web チャンネル）

目的: Clawd を WhatsApp グループに参加させ、呼びかけられたときだけ反応するようにし、そのスレッドを個人 DM セッションとは分離して保つことです。

注: `agents.list[].groupChat.mentionPatterns` は現在、Telegram/Discord/Slack/iMessage でも使用されます。このドキュメントでは WhatsApp 固有の動作に焦点を当てます。複数エージェント構成では、エージェントごとに `agents.list[].groupChat.mentionPatterns` を設定するか、グローバルなフォールバックとして `messages.groupChat.mentionPatterns` を使用してください。

## 現在の実装（2025-12-03）

- アクティベーションモード: `mention`（デフォルト）または `always`。`mention` では呼びかけが必要です（`mentionedJids` による実際の WhatsApp の @メンション、安全な正規表現パターン、またはテキスト内の任意の位置にあるボットの E.164）。`always` はすべてのメッセージでエージェントを起動しますが、意味のある価値を追加できる場合にのみ返信すべきです。それ以外の場合は、完全に一致する無言トークン `NO_REPLY` / `no_reply` を返します。デフォルトは設定の `channels.whatsapp.groups` で指定でき、グループごとに `/activation` で上書きできます。`channels.whatsapp.groups` を設定すると、グループの許可リストとしても機能します（すべてを許可するには `"*"` を含めてください）。
- グループポリシー: `channels.whatsapp.groupPolicy` は、グループメッセージを受け入れるかどうかを制御します（`open|disabled|allowlist`）。`allowlist` は `channels.whatsapp.groupAllowFrom` を使用します（フォールバック: 明示的な `channels.whatsapp.allowFrom`）。デフォルトは `allowlist` です（送信者を追加するまでブロックされます）。
- グループごとのセッション: セッションキーは `agent:<agentId>:whatsapp:group:<jid>` のようになります。そのため、`/verbose on`、`/trace on`、`/think high` などのコマンド（単独メッセージとして送信）は、そのグループにスコープされます。個人 DM の状態には影響しません。Heartbeat はグループスレッドではスキップされます。
- コンテキスト注入: 実行をトリガーしなかった**保留中のみ**のグループメッセージ（デフォルト 50 件）が、`[Chat messages since your last reply - for context]` の下に先頭追加され、トリガーとなった行は `[Current message - respond to this]` の下に追加されます。すでにセッションにあるメッセージは再注入されません。
- 送信者の表示: すべてのグループバッチの末尾に `[from: Sender Name (+E164)]` が追加されるため、Pi は誰が話しているかを把握できます。
- 一時メッセージ / view-once: テキストやメンションを抽出する前にこれらを展開するため、その中の呼びかけでも引き続きトリガーされます。
- グループシステムプロンプト: グループセッションの最初のターン時（および `/activation` によってモードが変更されるたび）に、`You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` のような短い説明文をシステムプロンプトに注入します。メタデータが利用できない場合でも、グループチャットであることはエージェントに伝えます。

## 設定例（WhatsApp）

表示名による呼びかけが、WhatsApp が本文テキストから視覚的な `@` を削除した場合でも機能するように、`~/.openclaw/openclaw.json` に `groupChat` ブロックを追加します。

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

- 正規表現は大文字小文字を区別せず、他の設定の正規表現サーフェスと同じ safe-regex ガードレールを使用します。無効なパターンや、安全でないネストした繰り返しは無視されます。
- 誰かが連絡先をタップしたとき、WhatsApp は引き続き `mentionedJids` による正規メンションを送信するため、番号によるフォールバックが必要になることはまれですが、有用な安全策です。

### アクティベーションコマンド（オーナーのみ）

グループチャットコマンドを使用します。

- `/activation mention`
- `/activation always`

これを変更できるのは、オーナー番号（`channels.whatsapp.allowFrom` の値。未設定の場合はボット自身の E.164）のみです。現在のアクティベーションモードを確認するには、グループで `/status` を単独メッセージとして送信してください。

## 使用方法

1. WhatsApp アカウント（OpenClaw を実行しているもの）をグループに追加します。
2. `@openclaw …` と送信するか、番号を含めます。`groupPolicy: "open"` を設定していない限り、許可リストに載っている送信者だけがこれをトリガーできます。
3. エージェントプロンプトには、最近のグループコンテキストと末尾の `[from: …]` マーカーが含まれるため、適切な相手に応答できます。
4. セッションレベルのディレクティブ（`/verbose on`、`/trace on`、`/think high`、`/new` または `/reset`、`/compact`）は、そのグループのセッションにのみ適用されます。認識されるように、単独メッセージとして送信してください。個人 DM セッションは独立したままです。

## テスト / 検証

- 手動スモークテスト:
  - グループで `@openclaw` の呼びかけを送信し、送信者名を参照した返信が返ることを確認します。
  - 2 回目の呼びかけを送り、履歴ブロックが含まれ、その次のターンでクリアされることを確認します。
- Gateway ログ（`--verbose` 付きで実行）を確認し、`from: <groupJid>` と `[from: …]` 接尾辞を示す `inbound web message` エントリを確認します。

## 既知の考慮事項

- グループへのノイズの多いブロードキャストを避けるため、Heartbeat は意図的にグループではスキップされます。
- エコー抑制は結合されたバッチ文字列を使用します。メンションなしで同一テキストを 2 回送信した場合、返信されるのは最初の 1 回だけです。
- セッションストア内のエントリは、セッションストア（デフォルトでは `~/.openclaw/agents/<agentId>/sessions/sessions.json`）で `agent:<agentId>:whatsapp:group:<jid>` として表示されます。エントリが存在しない場合は、そのグループがまだ実行をトリガーしていないことを意味するだけです。
- グループでの入力中インジケーターは `agents.defaults.typingMode` に従います（デフォルト: メンションされていない場合は `message`）。

## 関連

- [グループ](/ja-JP/channels/groups)
- [チャンネルルーティング](/ja-JP/channels/channel-routing)
- [ブロードキャストグループ](/ja-JP/channels/broadcast-groups)

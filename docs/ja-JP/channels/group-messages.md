---
read_when:
    - WhatsAppグループ固有の設定
    - WhatsApp の有効化モードの変更（`mention` と `always`）
    - WhatsApp グループのセッションキーまたは保留中メッセージのコンテキストの調整
sidebarTitle: WhatsApp groups
summary: WhatsApp グループメッセージの処理 — アクティベーション、許可リスト、セッション、コンテキスト注入
title: WhatsAppグループメッセージ
x-i18n:
    generated_at: "2026-07-12T14:18:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: bd1adb379a4cae4ee9b4b9950d7519e62e1fc0e72ece25ec1b337ee3cb803cda
    source_path: channels/group-messages.md
    workflow: 16
---

クロスチャネルのグループモデル（Discord、iMessage、Matrix、Microsoft Teams、QQBot、Signal、Slack、Telegram、WhatsApp、Zalo）については、[グループ](/ja-JP/channels/groups)を参照してください。このページでは、そのモデルに加えて、アクティベーション、グループ許可リスト、グループごとのセッションキー、保留中メッセージのコンテキスト注入といった、WhatsApp固有の動作について説明します。

目標: OpenClawをWhatsAppグループに参加させ、呼びかけられたときだけ起動し、そのスレッドを個人DMセッションとは分離して維持します。

<Note>
`agents.list[].groupChat.mentionPatterns`は、他のチャネルのメンションゲートと共有されます。マルチエージェント構成ではエージェントごとに設定するか、グローバルなフォールバックとして`messages.groupChat.mentionPatterns`を使用してください。どちらも設定されていない場合、パターンはエージェントの識別名/絵文字から導出されます。
</Note>

## 動作

- アクティベーションモード: `mention`（デフォルト）または`always`。`mention`では呼びかけが必要です。具体的には、実際のWhatsAppの@メンション（`mentionedJids`）、設定済みの正規表現パターン、テキスト内の任意の場所にあるボットのE.164形式の数字、またはボットのメッセージに対する引用返信（共有番号を使用した自分自身とのチャット構成を除く）のいずれかです。`always`ではメッセージごとにエージェントが起動しますが、注入されるグループプロンプトにより、価値を付加できる場合にのみ返信し、それ以外の場合は正確な無応答トークン`NO_REPLY`（大文字と小文字を区別しない）を返すよう指示されます。デフォルト値は設定（`channels.whatsapp.groups`の`requireMention`）から取得され、グループごとに`/activation`で上書きできます。
- グループ許可リスト: `channels.whatsapp.groups`が設定されている場合、一覧に含まれるグループJIDのみが許可されます（すべて許可するには`"*"`を含めます）。一覧にないグループからのメッセージは、ログにヒントを残して破棄されます。
- グループポリシー: `channels.whatsapp.groupPolicy`は、グループメッセージを受け入れるかどうか（`open|disabled|allowlist`）を制御します。`allowlist`は`channels.whatsapp.groupAllowFrom`（フォールバック: 明示的な`channels.whatsapp.allowFrom`）を使用します。デフォルトは`allowlist`です（送信者を追加するまでブロックされます）。
- グループごとのセッション: セッションキーは`agent:<agentId>:whatsapp:group:<jid>`のような形式です（デフォルト以外のアカウントでは`:thread:whatsapp-account-<accountId>`が付加されます）。そのため、`/verbose on`、`/trace on`、`/think high`などのディレクティブ（単独のメッセージとして送信）は、そのグループに限定され、個人DMの状態には影響しません。
- コンテキスト注入: 実行をトリガーしなかった**保留中のみ**のグループメッセージ（デフォルト50件）が`[Chat messages since your last reply - for context]`の下に前置され、トリガーとなった行は`[Current message - respond to this]`の下に配置されます。保留ウィンドウは実行後にクリアされ、すでにセッション内にあるメッセージは再注入されません。
- 送信者の帰属情報: 各グループ行には、メッセージエンベロープ内に送信者ラベルが含まれます。例: `[WhatsApp <groupJid> <timestamp>] Alice (+447700900123): text`。また、送信者の識別情報とグループの件名/メンバー情報が、信頼されていない会話メタデータブロックに付随します。
- 一時的/一度だけ表示: テキスト/メンションを抽出する前にラッパーが解除されるため、その中の呼びかけも引き続きトリガーになります。
- グループシステムプロンプト: グループセッションの最初のターン（および`/activation`でモードを変更した後の各ターン）では、アクティベーションのガイダンスがシステムプロンプトに注入されます（`Activation: trigger-only ...`または`Activation: always-on ...`に加え、「特定の送信者に呼びかける」という指示）。永続的なグループチャット配信ガイダンス（「WhatsAppグループチャットに参加しています...」）は常に含まれます。

## 設定例（WhatsApp）

WhatsAppがテキスト本文から視覚的な`@`を取り除いた場合でも、表示名による呼びかけが機能するようにします。

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
      historyLimit: 50, // 保留中のグループコンテキストウィンドウ（デフォルト50）
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

注記:

- 正規表現では大文字と小文字が区別されず、他の設定の正規表現サーフェスと同じ安全な正規表現のガードレールが使用されます。無効なパターンや安全でないネストされた繰り返しは無視されます。
- 誰かが連絡先をタップした場合、WhatsAppは引き続き`mentionedJids`を通じて正規のメンションを送信するため、番号によるフォールバックが必要になることはほとんどありませんが、有用な安全策になります。
- 保留中コンテキストウィンドウは、`channels.whatsapp.accounts.<id>.historyLimit` → `channels.whatsapp.historyLimit` → `messages.groupChat.historyLimit` → 50の順で解決されます。

### アクティベーションコマンド（所有者のみ）

グループチャットコマンドを使用します。

- `/activation mention`
- `/activation always`

この設定を変更できるのは、所有者の番号（`channels.whatsapp.allowFrom` で指定された番号、未設定の場合はボット自身の E.164 番号）のみです。それ以外のユーザーからの `/activation` は無視され、コンテキストとしてのみ保存されます。現在のアクティベーションモードを確認するには、グループ内で `/status` を単独のメッセージとして送信します。

## 使用方法

1. OpenClaw を実行している WhatsApp アカウントをグループに追加します。
2. `@openclaw ...` と発言します（または番号を含めます）。`groupPolicy: "open"` を設定しない限り、許可リストに登録された送信者のみが起動できます。
3. エージェントのプロンプトには、保留中のグループコンテキストと送信者ラベル付きの行が含まれるため、適切な相手に応答できます。
4. セッションディレクティブ（`/verbose on`、`/trace on`、`/think high`、`/new` または `/reset`、`/compact`）は、そのグループのセッションにのみ適用されます。認識されるよう、単独のメッセージとして送信してください。個人の DM セッションは独立したままです。

## テスト / 検証

- 手動スモークテスト：
  - グループ内で `@openclaw` へのメンションを送信し、送信者名を参照する返信が届くことを確認します。
  - 2 回目のメンションを送信し、履歴ブロックが含まれていること、その次のターンで消去されることを確認します。
- Gateway のログ（`--verbose` を指定して実行）で、`from: <groupJid>` と送信者ラベル付きの本文が表示される `inbound web message` エントリを確認します。

## 既知の考慮事項

- Heartbeat はエージェントのメインセッションで実行されます。グループセッションでは Heartbeat が実行されることはありません。
- エコー抑制では、ボット自身が配信したメッセージによって再起動されないように、セッションごとに結合されたプロンプト（履歴 + 現在のメッセージ）が記憶されます。同一のバッチが繰り返された場合は、エコーとしてスキップされることがあります。
- セッションストアのエントリは、エージェントごとの SQLite セッションストアに `agent:<agentId>:whatsapp:group:<jid>` として表示されます。エントリが存在しない場合は、そのグループがまだ実行を起動していないことを意味するだけです。
- 入力中インジケーターは `session.typingMode` / `agents.defaults.typingMode` に従います。表示される返信でメッセージツールのみのモードを選択した場合、デフォルトでは入力中表示が直ちに開始されるため、自動的な最終返信が投稿されなくても、グループメンバーはエージェントが処理中であることを確認できます。入力モードを明示的に設定している場合は、その設定が引き続き優先されます。

## 関連項目

- [グループ](/ja-JP/channels/groups)
- [チャンネルルーティング](/ja-JP/channels/channel-routing)
- [ブロードキャストグループ](/ja-JP/channels/broadcast-groups)

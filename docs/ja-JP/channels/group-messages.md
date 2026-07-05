---
read_when:
    - WhatsApp グループを個別に設定する
    - WhatsAppのアクティベーションモードの変更（`mention` と `always`）
    - WhatsApp グループセッションキーまたは保留中メッセージコンテキストの調整
sidebarTitle: WhatsApp groups
summary: WhatsApp グループメッセージ処理 — 有効化、許可リスト、セッション、コンテキスト注入
title: WhatsApp グループメッセージ
x-i18n:
    generated_at: "2026-07-05T11:02:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdc16719e33ed5532e9bc11b195fa1b2d79910ae476d8201adcc9507bbfa1b29
    source_path: channels/group-messages.md
    workflow: 16
---

クロスチャネルのグループモデル（Discord、iMessage、Matrix、Microsoft Teams、QQBot、Signal、Slack、Telegram、WhatsApp、Zalo）については、[グループ](/ja-JP/channels/groups)を参照してください。このページでは、そのモデルの上にある WhatsApp 固有の動作、つまりアクティベーション、グループ許可リスト、グループごとのセッションキー、保留メッセージのコンテキスト注入について説明します。

目標: OpenClaw を WhatsApp グループ内に置き、呼び出されたときだけ起動し、そのスレッドを個人 DM セッションから分離して維持します。

<Note>
`agents.list[].groupChat.mentionPatterns` は、他のチャネルのメンションゲートと共有されます。マルチエージェント構成では、エージェントごとに設定するか、グローバルなフォールバックとして `messages.groupChat.mentionPatterns` を使用します。どちらも設定されていない場合、パターンはエージェントの ID 名/絵文字から派生します。
</Note>

## 動作

- アクティベーションモード: `mention`（デフォルト）または `always`。`mention` では呼び出しが必要です。実際の WhatsApp @メンション（`mentionedJids`）、設定済みの正規表現パターン、テキスト内の任意の場所にあるボットの E.164 数字、またはボットのメッセージへの引用返信（共有番号の自己チャット構成を除く）が該当します。`always` はすべてのメッセージでエージェントを起動しますが、注入されるグループプロンプトは、価値を加える場合にのみ返信し、それ以外の場合は正確なサイレントトークン `NO_REPLY`（大文字小文字を区別しない）を返すよう指示します。デフォルトは設定（`channels.whatsapp.groups` `requireMention`）から取得され、`/activation` でグループごとに上書きできます。
- グループ許可リスト: `channels.whatsapp.groups` が設定されている場合、一覧にあるグループ JID のみが許可されます（すべてを許可するには `"*"` を含めます）。一覧にないグループからのメッセージは、ログヒント付きで破棄されます。
- グループポリシー: `channels.whatsapp.groupPolicy` は、グループメッセージを受け入れるかどうか（`open|disabled|allowlist`）を制御します。`allowlist` は `channels.whatsapp.groupAllowFrom`（フォールバック: 明示的な `channels.whatsapp.allowFrom`）を使用します。デフォルトは `allowlist`（送信者を追加するまでブロック）です。
- グループごとのセッション: セッションキーは `agent:<agentId>:whatsapp:group:<jid>` のようになります（デフォルト以外のアカウントでは `:thread:whatsapp-account-<accountId>` が追加されます）。そのため、`/verbose on`、`/trace on`、`/think high`（単独メッセージとして送信）のようなディレクティブはそのグループにスコープされます。個人 DM の状態には影響しません。
- コンテキスト注入: 実行をトリガーしなかった**保留中のみ**のグループメッセージ（デフォルト 50）は、`[Chat messages since your last reply - for context]` の下に前置され、トリガー行は `[Current message - respond to this]` の下に置かれます。保留ウィンドウは実行後にクリアされます。すでにセッション内にあるメッセージは再注入されません。
- 送信者の帰属: 各グループ行には、メッセージエンベロープ内に送信者ラベルが含まれます。例: `[WhatsApp <groupJid> <timestamp>] Alice (+447700900123): text`。送信者 ID とグループの件名/メンバーも、信頼されていない会話メタデータブロックに含まれます。
- エフェメラル/一度だけ表示: テキスト/メンション抽出前にラッパーが解除されるため、その中の呼び出しもトリガーされます。
- グループシステムプロンプト: グループセッションの最初のターン（および `/activation` でモードが変更された後の任意のターン）では、アクティベーションガイダンスがシステムプロンプトに注入されます（`Activation: trigger-only ...` または `Activation: always-on ...` に加え、「特定の送信者に宛てる」）。永続的なグループチャット配信ガイダンス（「You are in a WhatsApp group chat...」）は常に含まれます。

## 設定例（WhatsApp）

WhatsApp がテキスト本文から表示上の `@` を取り除く場合でも、表示名での呼び出しが機能するようにします。

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
      historyLimit: 50, // pending group context window (default 50)
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

注:

- 正規表現は大文字小文字を区別せず、他の設定正規表現サーフェスと同じ安全な正規表現ガードレールを使用します。無効なパターンと安全でないネストされた繰り返しは無視されます。
- 誰かが連絡先をタップした場合、WhatsApp は引き続き `mentionedJids` 経由で正規のメンションを送信するため、番号フォールバックが必要になることはまれですが、有用なセーフティネットです。
- 保留コンテキストウィンドウは、`channels.whatsapp.accounts.<id>.historyLimit` → `channels.whatsapp.historyLimit` → `messages.groupChat.historyLimit` → 50 の順に解決されます。

### アクティベーションコマンド（オーナーのみ）

グループチャットコマンドを使用します。

- `/activation mention`
- `/activation always`

これを変更できるのはオーナー番号（`channels.whatsapp.allowFrom` から取得、未設定の場合はボット自身の E.164）のみです。それ以外のユーザーからの `/activation` は無視され、コンテキストとしてのみ保存されます。現在のアクティベーションモードを確認するには、グループ内で `/status` を単独メッセージとして送信します。

## 使い方

1. WhatsApp アカウント（OpenClaw を実行しているもの）をグループに追加します。
2. `@openclaw ...` と発言します（または番号を含めます）。`groupPolicy: "open"` を設定しない限り、許可リストにある送信者のみがトリガーできます。
3. エージェントプロンプトには、保留中のグループコンテキストと送信者ラベル付きの行が含まれるため、適切な相手に宛てることができます。
4. セッションディレクティブ（`/verbose on`、`/trace on`、`/think high`、`/new` または `/reset`、`/compact`）は、そのグループのセッションにのみ適用されます。登録されるよう、単独メッセージとして送信してください。個人 DM セッションは独立したままです。

## テスト / 検証

- 手動スモーク:
  - グループで `@openclaw` の呼び出しを送信し、送信者名に言及する返信を確認します。
  - 2 回目の呼び出しを送信して履歴ブロックが含まれることを確認し、次のターンでクリアされることを検証します。
- Gateway ログ（`--verbose` 付きで実行）で、`from: <groupJid>` と送信者ラベル付き本文を示す `inbound web message` エントリを確認します。

## 既知の考慮事項

- Heartbeat はエージェントのメインセッションで実行されます。グループセッションで Heartbeat 実行が行われることはありません。
- エコー抑制は、セッションごとに結合プロンプト（履歴 + 現在のメッセージ）を記憶するため、ボット自身が配信したメッセージで再トリガーされることはありません。同一の繰り返しバッチはエコーとしてスキップされる場合があります。
- セッションストアのエントリは、セッションストア内で `agent:<agentId>:whatsapp:group:<jid>` として表示されます（デフォルトでは `~/.openclaw/agents/<agentId>/sessions/sessions.json`）。エントリがない場合、そのグループがまだ実行をトリガーしていないことを意味するだけです。
- 入力インジケーターは `session.typingMode` / `agents.defaults.typingMode` に従います。表示される返信がメッセージツールのみのモードにオプトインされている場合、デフォルトでは入力が即座に開始されるため、自動の最終返信が投稿されない場合でも、グループメンバーはエージェントが作業中であることを確認できます。明示的な入力モード設定は引き続き優先されます。

## 関連

- [グループ](/ja-JP/channels/groups)
- [チャネルルーティング](/ja-JP/channels/channel-routing)
- [ブロードキャストグループ](/ja-JP/channels/broadcast-groups)

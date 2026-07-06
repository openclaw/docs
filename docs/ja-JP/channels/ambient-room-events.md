---
read_when:
    - 常時オンのグループまたはチャンネルルームの設定
    - エージェントに最終テキストを自動投稿させず、ルームのやり取りを監視させたい
    - 表示されるルームメッセージがない状態でタイピングとトークン使用量をデバッグする
sidebarTitle: Ambient room events
summary: 対応するグループルームでは、エージェントがメッセージツールで送信しない限り、静かなコンテキストを提供する
title: 周囲のルームイベント
x-i18n:
    generated_at: "2026-07-06T10:46:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 66177ae942c20026b5aaf007ebbd115373f15aceff585952471abb7721115469
    source_path: channels/ambient-room-events.md
    workflow: 16
---

Ambient room events により、OpenClaw はメンションされていないグループまたはチャンネルの会話を静かなコンテキストとして処理できます。エージェントはメモリとセッション状態を更新できますが、エージェントが明示的に `message` ツールを呼び出さない限り、ルームは無言のままです。

常時オンのグループチャットでは、`messages.groupChat.unmentionedInbound: "room_event"` と `messages.groupChat.visibleReplies: "message_tool"` を組み合わせます。エージェントはリッスンし、返信が有用なタイミングを判断し、`NO_REPLY` と答える古いプロンプトパターンは不要になります。

現在サポートされているもの: Discord ギルドチャンネル、Slack チャンネルとプライベートチャンネル、Slack 複数人 DM、Telegram グループまたはスーパーグループ。その他のグループチャンネルは、そのチャンネルページで ambient room events のサポートが明記されていない限り、既存のグループ動作を維持します。

## 推奨セットアップ

グローバルなグループチャット動作を設定します。

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
}
```

次に、そのルームのメンションゲートを無効にして、ルームを常時オンにします。ルームは引き続き通常の `groupPolicy`、ルーム許可リスト、送信者許可リストを通過する必要があります。

設定を保存すると、Gateway は `messages` 設定をホット適用します。ファイル監視または設定リロードが無効 (`gateway.reload.mode: "off"`) の場合のみ再起動してください。

## 変更点

`messages.groupChat.unmentionedInbound: "room_event"` の場合:

- メンションされていない許可済みのグループまたはチャンネルメッセージは、静かなルームイベントになります
- メンションされたメッセージはユーザーリクエストのままです
- テキスト制御コマンドとネイティブコマンドはユーザーリクエストのままです
- 中止または停止リクエストはユーザーリクエストのままです
- ダイレクトメッセージはユーザーリクエストのままです

ルームイベントは厳格な可視配信を使用します。最終的なアシスタントテキストは非公開です。エージェントはルームに投稿するために `message(action=send)` を呼び出す必要があります。

タイピングとライフサイクルステータスリアクションは、ルームイベントでは抑制されたままです。1 つの明示的な受信確認の例外は `messages.ackReactionScope: "all"` で、設定済みの ack リアクションを送信します。ルームを完全に無言に保つ必要がある場合は、より狭いスコープまたは `"off"` を使用してください。

## Discord の例

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          requireMention: false,
          users: ["<YOUR_DISCORD_USER_ID>"],
        },
      },
    },
  },
}
```

1 つのチャンネルだけを ambient にする場合は、チャンネル単位の Discord 設定を使用します。`groupPolicy: "allowlist"` では、チャンネルを列挙することが許可になります (`enabled: false` はエントリを無効にします)。

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

## Slack の例

Slack チャンネル許可リストは ID 優先です。`#channel-name` ではなく、`C12345678` のようなチャンネル ID を使用してください。`channels.slack.channels` の下にチャンネルを列挙することが許可になります (`enabled: false` はエントリを無効にします)。

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    slack: {
      groupPolicy: "allowlist",
      channels: {
        "<SLACK_CHANNEL_ID>": {
          requireMention: false,
        },
      },
    },
  },
}
```

## Telegram の例

Telegram グループでは、ボットが通常のグループメッセージを見られる必要があります。`requireMention: false` の場合、BotFather のプライバシーモードを無効にするか、ボットに完全なグループトラフィックを配信する別の Telegram セットアップを使用してください。

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    telegram: {
      groups: {
        "<TELEGRAM_GROUP_CHAT_ID>": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

Telegram グループ ID は通常、`-1001234567890` のような負の数です。`openclaw logs --follow` から `chat.id` を読み取るか、グループメッセージを ID ヘルパーボットへ転送するか、Bot API `getUpdates` を確認してください。

## エージェント固有ポリシー

複数のエージェントが同じルームを共有しているが、1 つだけがメンションされていない会話を ambient context として扱うべき場合は、エージェントオーバーライドを使用します。

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          unmentionedInbound: "room_event",
          mentionPatterns: ["@openclaw", "openclaw"],
        },
      },
    ],
  },
}
```

エージェント固有の `agents.list[].groupChat.unmentionedInbound` 値は、そのエージェントについて `messages.groupChat.unmentionedInbound` を上書きします。

## 可視返信モード

`messages.groupChat.visibleReplies` のデフォルトは、通常のグループ/チャンネルユーザーリクエストでは `"automatic"` です。明示的な message-tool 呼び出しなしで最終的なアシスタントテキストを可視投稿したい場合は、そのデフォルトを維持してください。

ambient な常時オンルームでは、`messages.groupChat.visibleReplies: "message_tool"` が引き続き推奨されます。特に GPT 5.5 のような最新世代でツール信頼性の高いモデルではそうです。これにより、エージェントは message ツールを呼び出して、いつ発言するかを判断できます。モデルがツールを呼び出さずに最終テキストを返した場合、OpenClaw はその最終テキストを非公開のままにし、抑制された配信メタデータをログに記録します。

他のグループリクエストが自動返信を使用している場合でも、ルームイベントは厳格なままです。メンションされていない ambient room events は、可視出力のために常に `message(action=send)` を必要とします。

## 履歴

`messages.groupChat.historyLimit` は、グローバルなグループ履歴のデフォルトを設定します (未設定時は 50。正の整数である必要があります)。チャンネルは `channels.<channel>.historyLimit` で上書きでき、一部のチャンネルはアカウント単位の履歴制限にも対応しています。そのチャンネルのグループ履歴コンテキストを無効にするには、チャンネルレベルで `historyLimit: 0` を設定します。

サポートされているルームイベントチャンネルは、最近の ambient room messages をコンテキストとして保持します。Telegram は `historyLimit` で制限された常時オンのグループ単位ローリングウィンドウを保持します。ユーザーリクエストターンでは、ボットの最後に記録された返信以降のエントリを選択し、ルームイベントターンでは、モデルが自身の最近の投稿を見られるように最近のウィンドウ全体を受け取ります。廃止された Telegram の `includeGroupHistoryContext` モードキーは、`openclaw doctor --fix` によって削除されます。

## トラブルシューティング

ルームでタイピングまたはトークン使用量が表示されるが、可視メッセージがない場合:

1. ルームがチャンネル許可リストと送信者許可リストで許可されていることを確認します。
2. 期待するルームレベルで `requireMention: false` が設定されていることを確認します。
3. `messages.groupChat.unmentionedInbound` またはエージェントオーバーライドが `"room_event"` かどうかを確認します。
4. 抑制された最終ペイロードメタデータまたは `didSendViaMessagingTool: false` がログにないか確認します。
5. 通常のグループリクエストでは、最終返信を自動投稿したい場合、`messages.groupChat.visibleReplies: "automatic"` を維持または復元します。`message_tool` を使用する ambient ルームでは、ツールを確実に呼び出すモデル/ランタイムを使用してください。

Telegram ambient ルームがまったくトリガーされない場合は、BotFather のプライバシーモードを確認し、Gateway が通常のグループメッセージを受信していることを検証してください。

Slack ambient ルームがトリガーされない場合は、チャンネルキーが Slack チャンネル ID であることと、アプリがそのルームタイプの履歴スコープを持っていることを確認してください: `channels:history` (公開)、`groups:history` (非公開)、または `mpim:history` (複数人 DM)。

## 関連

- [グループ](/ja-JP/channels/groups)
- [Discord](/ja-JP/channels/discord)
- [Slack](/ja-JP/channels/slack)
- [Telegram](/ja-JP/channels/telegram)
- [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)
- [チャンネル設定リファレンス](/ja-JP/gateway/config-channels)

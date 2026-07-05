---
read_when:
    - 常時接続のグループまたはチャンネルルームを設定する
    - エージェントに、最終テキストを自動投稿せずにルームの雑談を監視させたい
    - 表示されるルームメッセージがない状態での入力とトークン使用量のデバッグ
sidebarTitle: Ambient room events
summary: サポート対象のグループルームが、エージェントがメッセージツールで送信する場合を除き、静かなコンテキストを提供できるようにする
title: 室内環境イベント
x-i18n:
    generated_at: "2026-07-05T11:02:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1ac64dfa6d1af4e30397819ef1b94cd0fb0b838025dbb1129e685782f8679c1
    source_path: channels/ambient-room-events.md
    workflow: 16
---

アンビエントルームイベントにより、OpenClaw はメンションされていないグループやチャンネルの会話を静かなコンテキストとして処理できます。エージェントはメモリとセッション状態を更新できますが、エージェントが明示的に `message` ツールを呼び出さない限り、ルームには何も投稿されません。

常時オンのグループチャットでは、`messages.groupChat.unmentionedInbound: "room_event"` と `messages.groupChat.visibleReplies: "message_tool"` を組み合わせます。エージェントは会話を聞き、返信が有用なタイミングを判断し、以前の `NO_REPLY` と答えるプロンプトパターンを必要としません。

現在サポートされているもの: Discord のギルドチャンネル、Slack チャンネルとプライベートチャンネル、Slack の複数人 DM、Telegram のグループまたはスーパーグループ。その他のグループチャンネルは、そのチャンネルページでアンビエントルームイベントをサポートすると記載されていない限り、既存のグループ動作を維持します。

## 推奨設定

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

次に、そのルームのメンションゲーティングを無効にして、ルームを常時オンにします。ルームは引き続き通常の `groupPolicy`、ルーム許可リスト、送信者許可リストを通過する必要があります。

設定を保存すると、Gateway は `messages` 設定をホット適用します。ファイル監視または設定リロードが無効 (`gateway.reload.mode: "off"`) の場合のみ再起動してください。

## 変更点

`messages.groupChat.unmentionedInbound: "room_event"` の場合:

- メンションされていない許可済みのグループまたはチャンネルメッセージは、静かなルームイベントになります
- メンションされたメッセージはユーザーリクエストのままです
- テキスト制御コマンドとネイティブコマンドはユーザーリクエストのままです
- 中止または停止リクエストはユーザーリクエストのままです
- ダイレクトメッセージはユーザーリクエストのままです

ルームイベントでは厳格な表示配信を使用します。最終的なアシスタントテキストは非公開です。エージェントはルームに投稿するために `message(action=send)` を呼び出す必要があります。

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

1 つのチャンネルだけをアンビエントにする場合は、チャンネルごとの Discord 設定を使用します。`groupPolicy: "allowlist"` では、チャンネルを列挙することがそれを許可することになります (`enabled: false` はエントリを無効にします)。

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

Slack チャンネル許可リストは ID 優先です。`#channel-name` ではなく、`C12345678` のようなチャンネル ID を使用してください。`channels.slack.channels` の下にチャンネルを列挙することがそれを許可することになります (`enabled: false` はエントリを無効にします)。

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

Telegram グループでは、ボットが通常のグループメッセージを見られる必要があります。`requireMention: false` の場合は、BotFather のプライバシーモードを無効にするか、完全なグループトラフィックをボットに配信する別の Telegram 設定を使用してください。

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

Telegram グループ ID は通常、`-1001234567890` のような負の数です。`openclaw logs --follow` から `chat.id` を読み取るか、グループメッセージを ID ヘルパーボットに転送するか、Bot API の `getUpdates` を調べてください。

## エージェント固有のポリシー

複数のエージェントが同じルームを共有しているが、1 つだけがメンションされていない会話をアンビエントコンテキストとして扱うべき場合は、エージェントオーバーライドを使用します。

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

## 表示返信モード

`messages.groupChat.visibleReplies` は、通常のグループ/チャンネルのユーザーリクエストではデフォルトで `"automatic"` です。最終的なアシスタントテキストを明示的なメッセージツール呼び出しなしで表示投稿したい場合は、そのデフォルトを維持してください。

アンビエントな常時オンルームでは、特に GPT 5.5 のような最新世代でツールの信頼性が高いモデルと組み合わせる場合、`messages.groupChat.visibleReplies: "message_tool"` が引き続き推奨されます。これにより、エージェントはメッセージツールを呼び出して、いつ発言するかを判断できます。モデルがツールを呼び出さずに最終テキストを返した場合、OpenClaw はその最終テキストを非公開に保ち、抑制された配信メタデータをログに記録します。

他のグループリクエストが自動返信を使用する場合でも、ルームイベントは厳格なままです。メンションされていないアンビエントルームイベントでは、表示出力に常に `message(action=send)` が必要です。

## 履歴

`messages.groupChat.historyLimit` はグローバルなグループ履歴のデフォルトを設定します (未設定時は 50。正の整数である必要があります)。チャンネルは `channels.<channel>.historyLimit` で上書きでき、一部のチャンネルはアカウントごとの履歴制限もサポートします。そのチャンネルのグループ履歴コンテキストを無効にするには、チャンネルレベルの `historyLimit: 0` を設定してください。

サポートされているルームイベントチャンネルは、最近のアンビエントルームメッセージをコンテキストとして保持します。Telegram は `historyLimit` で制限された常時オンのグループごとのローリングウィンドウを保持します。ユーザーリクエストターンではボットが最後に記録した返信以降のエントリを選択し、ルームイベントターンでは完全な最近のウィンドウを受け取るため、モデルは自身の最近の投稿を確認できます。廃止された Telegram の `includeGroupHistoryContext` モードキーは、`openclaw doctor --fix` によって削除されます。

## トラブルシューティング

ルームに入力中表示やトークン使用量が表示されるのに、表示メッセージがない場合:

1. ルームがチャンネル許可リストと送信者許可リストで許可されていることを確認します。
2. 期待するルームレベルで `requireMention: false` が設定されていることを確認します。
3. `messages.groupChat.unmentionedInbound` またはエージェントオーバーライドが `"room_event"` かどうかを確認します。
4. 抑制された最終ペイロードメタデータまたは `didSendViaMessagingTool: false` がログにあるか調べます。
5. 通常のグループリクエストでは、最終返信を自動的に投稿したい場合、`messages.groupChat.visibleReplies: "automatic"` を維持または復元してください。`message_tool` を使用するアンビエントルームでは、ツールを確実に呼び出すモデル/ランタイムを使用してください。

Telegram のアンビエントルームがまったくトリガーされない場合は、BotFather のプライバシーモードを確認し、Gateway が通常のグループメッセージを受信していることを検証してください。

Slack のアンビエントルームがトリガーされない場合は、チャンネルキーが Slack チャンネル ID であること、およびアプリがそのルームタイプの履歴スコープを持っていることを確認してください: `channels:history` (公開)、`groups:history` (非公開)、または `mpim:history` (複数人 DM)。

## 関連

- [グループ](/ja-JP/channels/groups)
- [Discord](/ja-JP/channels/discord)
- [Slack](/ja-JP/channels/slack)
- [Telegram](/ja-JP/channels/telegram)
- [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)
- [チャンネル設定リファレンス](/ja-JP/gateway/config-channels)

---
read_when:
    - 常時稼働のグループまたはチャンネルルームを設定する
    - エージェントに最終テキストを自動投稿させず、ルームの会話を監視させたい
    - 表示されるルームメッセージなしでタイピングとトークン使用量をデバッグする
sidebarTitle: Ambient room events
summary: サポートされているグループルームでは、エージェントが message ツールで送信しない限り、静かなコンテキストを提供します。
title: アンビエントルームイベント
x-i18n:
    generated_at: "2026-07-02T17:30:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e3dcf5abab58d9bfd75b7cef6c8a55b98f6688a895774b8ba4a1ffc5723e0a6
    source_path: channels/ambient-room-events.md
    workflow: 16
---

Ambient ルームイベントにより、OpenClaw はメンションされていないグループやチャンネルの雑談を静かなコンテキストとして処理できます。エージェントはメモリとセッション状態を更新できますが、エージェントが明示的に `message` ツールを呼び出さない限り、ルームは沈黙したままです。

常時オンのグループチャットでは、これが推奨モードです: `messages.groupChat.unmentionedInbound: "room_event"` と `messages.groupChat.visibleReplies: "message_tool"` を組み合わせます。エージェントが聞き取り、返信が有用なタイミングを判断し、`NO_REPLY` と答える古いプロンプトパターンを避けるべき場合に使用します。

現在対応済み: Discord ギルドチャンネル、Slack チャンネルとプライベートチャンネル、Slack 複数人 DM、Telegram グループまたはスーパーグループ。他のグループチャンネルは、そのチャンネルページで Ambient ルームイベントへの対応が明記されていない限り、既存のグループ動作を維持します。

## 推奨セットアップ

グローバルなグループチャット動作を設定します:

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

次に、そのルームのメンションゲートを無効にして、ルーム自体を常時オンとして設定します。そのチャンネルは、通常の `groupPolicy`、ルーム許可リスト、送信者許可リストでも引き続き許可されている必要があります。

設定を保存すると、Gateway は `messages` 設定をホットリロードします。ファイル監視または設定リロードが無効な場合にのみ再起動してください。

## 変更点

`messages.groupChat.unmentionedInbound: "room_event"` の場合:

- メンションされていない許可済みのグループまたはチャンネルメッセージは、静かなルームイベントになります
- メンションされたメッセージはユーザーリクエストのままです
- テキストコマンドとネイティブコマンドはユーザーリクエストのままです
- 中断または停止リクエストはユーザーリクエストのままです
- ダイレクトメッセージはユーザーリクエストのままです

ルームイベントは厳格な可視配信を使用します。最終的なアシスタントテキストは非公開です。エージェントはルームに投稿するために `message(action=send)` を呼び出す必要があります。

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

1 つのチャンネルだけを Ambient にする場合は、チャンネルごとの Discord 設定を使用します:

```json5
{
  channels: {
    discord: {
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
              allow: true,
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

Slack チャンネル許可リストは ID 優先です。`#channel-name` ではなく、`C12345678` のようなチャンネル ID を使用してください。

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
          allow: true,
          requireMention: false,
        },
      },
    },
  },
}
```

## Telegram の例

Telegram グループでは、ボットが通常のグループメッセージを参照できる必要があります。`requireMention: false` の場合は、BotFather のプライバシーモードを無効にするか、完全なグループトラフィックをボットに配信する別の Telegram セットアップを使用してください。

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

Telegram グループ ID は通常、`-1001234567890` のような負の数です。`openclaw logs --follow` から `chat.id` を読み取るか、グループメッセージを ID ヘルパーボットに転送するか、Bot API `getUpdates` を調べてください。

## エージェント固有のポリシー

複数のエージェントが同じルームを共有しているが、メンションされていない雑談を Ambient コンテキストとして扱うべきエージェントが 1 つだけの場合は、エージェントのオーバーライドを使用します:

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

エージェント固有の `agents.list[].groupChat.unmentionedInbound` 値は、そのエージェントについて `messages.groupChat.unmentionedInbound` をオーバーライドします。

## 可視返信モード

通常のグループまたはチャンネルのユーザーリクエストでは、`messages.groupChat.visibleReplies` のデフォルトは `"automatic"` です。明示的な message ツール呼び出しを要求せずに、最終的なアシスタントテキストを可視投稿したい場合は、このデフォルトを維持してください。

Ambient の常時オンルームでは、特に GPT 5.5 のような最新世代のツール信頼性が高いモデルでは、`messages.groupChat.visibleReplies: "message_tool"` が引き続き推奨されます。これにより、エージェントは message ツールを呼び出して、いつ発話するかを判断できます。モデルがツールを呼び出さずに最終テキストを返した場合、OpenClaw はその最終テキストを非公開のままにし、抑制された配信メタデータをログに記録します。

他のグループリクエストが自動返信を使用している場合でも、ルームイベントは厳格なままです。メンションされていない Ambient ルームイベントでは、可視出力のために引き続き `message(action=send)` が必要です。

## 履歴

`messages.groupChat.historyLimit` は、グローバルなグループ履歴のデフォルトを制御します。チャンネルは `channels.<channel>.historyLimit` でこれをオーバーライドでき、一部のチャンネルはアカウントごとの履歴制限にも対応しています。

グループ履歴コンテキストを無効にするには、`historyLimit: 0` を設定します。

対応しているルームイベントチャンネルは、最近の Ambient ルームメッセージをコンテキストとして保持します。Telegram は、`historyLimit` によって制限された常時オンのグループごとのローリングウィンドウを保持します。ユーザーリクエストのターンでは、ボットが最後に記録した返信以降のエントリを選択し、ルームイベントのターンでは、モデルが自分の最近の投稿を参照できるように最近のウィンドウ全体を受け取ります。廃止された Telegram `includeGroupHistoryContext` モードキーは、`openclaw doctor --fix` によって削除されます。

## トラブルシューティング

ルームに入力中表示やトークン使用量が表示されるのに可視メッセージがない場合:

1. ルームがチャンネル許可リストと送信者許可リストで許可されていることを確認します。
2. 期待しているルームレベルで `requireMention: false` が設定されていることを確認します。
3. `messages.groupChat.unmentionedInbound` またはエージェントのオーバーライドが `"room_event"` かどうかを確認します。
4. 抑制された最終ペイロードメタデータまたは `didSendViaMessagingTool: false` がないかログを調べます。
5. 通常のグループリクエストで最終返信を自動投稿したい場合は、`messages.groupChat.visibleReplies: "automatic"` を維持または復元します。`message_tool` を使用する Ambient ルームでは、確実にツールを呼び出すモデルまたはランタイムを使用してください。

Telegram Ambient ルームがまったくトリガーされない場合は、BotFather のプライバシーモードを確認し、Gateway が通常のグループメッセージを受信していることを検証してください。

Slack Ambient ルームがトリガーされない場合は、チャンネルキーが Slack チャンネル ID であり、アプリがそのルーム種別に必要な `channels:history` または `groups:history` スコープを持っていることを確認してください。

## 関連

- [グループ](/ja-JP/channels/groups)
- [Discord](/ja-JP/channels/discord)
- [Slack](/ja-JP/channels/slack)
- [Telegram](/ja-JP/channels/telegram)
- [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)
- [チャンネル設定リファレンス](/ja-JP/gateway/config-channels)

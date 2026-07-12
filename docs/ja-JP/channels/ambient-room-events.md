---
read_when:
    - 常時稼働するグループまたはチャンネルルームの設定
    - エージェントに最終的なテキストを自動投稿させず、ルーム内の会話を監視させたい場合
    - ルームにメッセージが表示されない場合の入力中表示とトークン使用量のデバッグ
sidebarTitle: Ambient room events
summary: 対応しているグループルームでは、エージェントがメッセージツールで送信しない限り、発言せずにコンテキストのみを提供するようにする
title: 周囲のルームイベント
x-i18n:
    generated_at: "2026-07-12T14:17:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3f144b44c8ae0a78e756d741c7b4685632862c0eb15531185ddeb0c2ba801e1a
    source_path: channels/ambient-room-events.md
    workflow: 16
---

アンビエントルームイベントを使用すると、OpenClaw はメンションされていないグループやチャンネルの会話を、発言を伴わないコンテキストとして処理できます。エージェントはメモリとセッション状態を更新できますが、エージェントが明示的に `message` ツールを呼び出さない限り、ルームには何も投稿されません。

常時稼働のグループチャットでは、`messages.groupChat.unmentionedInbound: "room_event"` と `messages.groupChat.visibleReplies: "message_tool"` を組み合わせます。エージェントは会話を聞き、返信が有用なタイミングを判断します。従来のプロンプトパターンである `NO_REPLY` と応答する必要はありません。

現在サポートされているのは、Discord のギルドチャンネル、Slack のチャンネルとプライベートチャンネル、Slack の複数人 DM、Telegram のグループまたはスーパーグループです。その他のグループチャンネルでは、そのチャンネルのページにアンビエントルームイベントをサポートすると記載されていない限り、既存のグループ動作が維持されます。

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

次に、そのルームのメンション制限を無効にして、ルームを常時稼働にします。ルームは引き続き、通常の `groupPolicy`、ルーム許可リスト、送信者許可リストを通過する必要があります。

設定を保存すると、Gateway は `messages` 設定をホット適用します。ファイル監視または設定の再読み込みが無効になっている場合（`gateway.reload.mode: "off"`）にのみ再起動してください。

## 変更される動作

`messages.groupChat.unmentionedInbound: "room_event"` を設定すると、次のように動作します。

- 許可されたグループまたはチャンネルでメンションされていないメッセージは、発言を伴わないルームイベントになります
- メンションされたメッセージは、引き続きユーザーリクエストになります
- テキスト制御コマンドとネイティブコマンドは、引き続きユーザーリクエストになります
- 中止または停止リクエストは、引き続きユーザーリクエストになります
- ダイレクトメッセージは、引き続きユーザーリクエストになります

ルームイベントでは、可視配信が厳格に制御されます。アシスタントの最終テキストは非公開です。ルームに投稿するには、エージェントが `message(action=send)` を呼び出す必要があります。

ルームイベントでは、入力中表示とライフサイクル状態リアクションも抑制されます。唯一の明示的な受信確認の例外は `messages.ackReactionScope: "all"` で、設定された受信確認リアクションを送信します。ルームを完全に無音にする必要がある場合は、より限定的なスコープまたは `"off"` を使用してください。

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

1 つのチャンネルだけをアンビエントにする場合は、チャンネルごとの Discord 設定を使用します。`groupPolicy: "allowlist"` では、チャンネルを一覧に追加することで許可されます（`enabled: false` を指定すると、そのエントリが無効になります）。

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

Slack のチャンネル許可リストでは ID が優先されます。`#channel-name` ではなく、`C12345678` のようなチャンネル ID を使用してください。`channels.slack.channels` の下にチャンネルを一覧表示することで許可されます（`enabled: false` を指定すると、そのエントリが無効になります）。

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

Telegram グループでは、ボットが通常のグループメッセージを閲覧できる必要があります。`requireMention: false` を設定する場合は、BotFather のプライバシーモードを無効にするか、グループのすべてのトラフィックをボットに配信する別の Telegram 設定を使用してください。

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

Telegram のグループ ID は通常、`-1001234567890` のような負の数です。`openclaw logs --follow` から `chat.id` を確認するか、グループメッセージを ID 確認用ボットに転送するか、Bot API の `getUpdates` を確認してください。

## エージェント固有のポリシー

複数のエージェントが同じルームを共有しているものの、メンションされていない会話をアンビエントコンテキストとして扱うエージェントを 1 つだけにする場合は、エージェントのオーバーライドを使用します。

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

エージェント固有の `agents.list[].groupChat.unmentionedInbound` の値は、そのエージェントについて `messages.groupChat.unmentionedInbound` をオーバーライドします。

## 可視返信モード

通常のグループまたはチャンネルのユーザーリクエストでは、`messages.groupChat.visibleReplies` のデフォルトは `"automatic"` です。明示的なメッセージツール呼び出しなしでアシスタントの最終テキストを表示可能な状態で投稿する場合は、このデフォルトを維持してください。

常時稼働のアンビエントルームでは、特に GPT-5.6 Sol のような最新世代のツール呼び出し信頼性が高いモデルを使用する場合、引き続き `messages.groupChat.visibleReplies: "message_tool"` を推奨します。これにより、エージェントはメッセージツールを呼び出して、発言するタイミングを決定できます。モデルがツールを呼び出さずに最終テキストを返した場合、OpenClaw はその最終テキストを非公開のまま保持し、配信抑制メタデータをログに記録します。

他のグループリクエストが自動返信を使用する場合でも、ルームイベントには厳格な制御が適用されます。メンションされていないアンビエントルームイベントで表示可能な出力を送信するには、常に `message(action=send)` が必要です。

## 履歴

`messages.groupChat.historyLimit` は、グローバルなグループ履歴のデフォルトを設定します（未設定の場合は 50。正の整数である必要があります）。チャンネルでは `channels.<channel>.historyLimit` を使用してオーバーライドでき、一部のチャンネルではアカウントごとの履歴上限もサポートされます。チャンネルレベルで `historyLimit: 0` を設定すると、そのチャンネルのグループ履歴コンテキストが無効になります。

ルームイベントをサポートするチャンネルでは、最近のアンビエントルームメッセージがコンテキストとして保持されます。Telegram は、`historyLimit` で制限されたグループごとの常時稼働ローリングウィンドウを保持します。ユーザーリクエストのターンでは、ボットが最後に記録した返信より後のエントリが選択されます。一方、ルームイベントのターンでは最近のウィンドウ全体が渡されるため、モデルは自身の最近の投稿を確認できます。廃止された Telegram の `includeGroupHistoryContext` モードキーは、`openclaw doctor --fix` によって削除されます。

## トラブルシューティング

ルームに入力中表示やトークン使用量が表示されるものの、表示可能なメッセージがない場合は、次を確認してください。

1. チャンネル許可リストと送信者許可リストでルームが許可されていることを確認します。
2. 想定しているルームレベルで `requireMention: false` が設定されていることを確認します。
3. `messages.groupChat.unmentionedInbound` またはエージェントのオーバーライドが `"room_event"` になっているか確認します。
4. 抑制された最終ペイロードのメタデータまたは `didSendViaMessagingTool: false` がログに記録されていないか確認します。
5. 通常のグループリクエストで最終返信を自動的に投稿する場合は、`messages.groupChat.visibleReplies: "automatic"` を維持または復元します。`message_tool` を使用するアンビエントルームでは、ツールを確実に呼び出すモデルまたはランタイムを使用してください。

Telegram のアンビエントルームがまったくトリガーされない場合は、BotFather のプライバシーモードを確認し、Gateway が通常のグループメッセージを受信していることを確認してください。

Slack のアンビエントルームがトリガーされない場合は、チャンネルキーが Slack のチャンネル ID であること、およびアプリにそのルーム種別に対応する履歴スコープがあることを確認してください。公開チャンネルは `channels:history`、プライベートチャンネルは `groups:history`、複数人 DM は `mpim:history` です。

## 関連項目

- [グループ](/ja-JP/channels/groups)
- [Discord](/ja-JP/channels/discord)
- [Slack](/ja-JP/channels/slack)
- [Telegram](/ja-JP/channels/telegram)
- [チャンネルのトラブルシューティング](/ja-JP/channels/troubleshooting)
- [チャンネル設定リファレンス](/ja-JP/gateway/config-channels)

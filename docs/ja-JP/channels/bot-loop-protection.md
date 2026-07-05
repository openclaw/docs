---
read_when:
    - ボット作成のチャンネルメッセージの設定
    - ボット間ループ保護のチューニング
sidebarTitle: Bot loop protection
summary: ボット間ループ保護のデフォルトとチャネルのオーバーライド
title: Bot ループ保護
x-i18n:
    generated_at: "2026-07-05T11:01:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08637267cd3422d3154315e709c85c85fa57641f1adb0e8ef10c32e8a7b73312
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

OpenClaw は、`allowBots` をサポートするチャンネルで他のボットが書き込んだメッセージを受け付けられます。その経路が有効な場合、ペアループ保護により、2つのボット ID が互いに無期限に返信し続けることを防ぎます。

このガードは、コアのインバウンド返信ランナーによって適用されます。対応する各チャンネルは、インバウンドイベントを汎用的な事実へマッピングします。アカウントまたはスコープ、会話 ID、送信者ボット ID、受信者ボット ID です。コアは参加者ペアを双方向で追跡し（A から B と B から A は同じペアとして数えます）、スライディングウィンドウ予算を適用し、予算を超えた後のクールダウン中はそのペアを抑制します。

## デフォルト

ペアループ保護は、チャンネルがボット作成メッセージをディスパッチへ到達させる場合に常に有効です。組み込みのデフォルト:

| キー                 | デフォルト | 意味                                                |
| -------------------- | ---------- | --------------------------------------------------- |
| `enabled`            | `true`     | それをサポートするチャンネルでガードを有効にします。 |
| `maxEventsPerWindow` | `20`       | ウィンドウ内でボットペアが交換できるイベント数。    |
| `windowSeconds`      | `60`       | スライディングウィンドウの長さ。                    |
| `cooldownSeconds`    | `60`       | ペアが予算を超えた後の抑制時間。                    |

このガードは、人間が作成したメッセージ、単一ボットのデプロイ、自分自身のメッセージのフィルタリング、または予算内に収まるボット返信には影響しません。

## 共有デフォルトを設定する

`channels.defaults.botLoopProtection` を一度設定すると、対応するすべてのチャンネルに同じベースラインを与えられます。チャンネル、アカウント、ルームのオーバーライドで、個別のサーフェスを引き続き調整できます。

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
  },
}
```

チャンネルポリシーが、自動抑制なしのボット間会話を意図的に許可する場合にのみ、`enabled: false` を設定してください。

## チャンネル、アカウント、またはルームごとにオーバーライドする

対応するチャンネルは、共有デフォルトの上に独自の設定をキーごとに重ねます。優先順位は、狭いものから順に次のとおりです。

1. `channels.<channel>.<room-or-space>.botLoopProtection`、チャンネルが会話ごとのオーバーライドをサポートする場合
2. `channels.<channel>.accounts.<account>.botLoopProtection`、チャンネルがアカウントをサポートする場合
3. `channels.<channel>.botLoopProtection`、チャンネルがトップレベルのデフォルトをサポートする場合
4. `channels.defaults.botLoopProtection`
5. 組み込みのデフォルト

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
      },
    },
    discord: {
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
      accounts: {
        secondary: {
          allowBots: "mentions",
          botLoopProtection: {
            maxEventsPerWindow: 5,
            cooldownSeconds: 90,
          },
        },
      },
    },
    googlechat: {
      allowBots: true,
      groups: {
        "spaces/AAAA": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
    matrix: {
      allowBots: "mentions",
      groups: {
        "!roomid:example.org": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
    slack: {
      allowBots: "mentions",
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
    },
  },
}
```

## チャンネルサポート

- Discord: ネイティブの `author.bot` 事実。Discord アカウント、チャンネル、ボットペアをキーにします。
- Google Chat: 受け付けたボット作成メッセージのネイティブな `sender.type=BOT` 事実。アカウント、スペース、ボットペアをキーにします。
- Matrix: 設定済みの Matrix ボットアカウント。Matrix アカウント、ルーム、設定済みボットペアをキーにします。
- Slack: 受け付けたボット作成メッセージのネイティブな `bot_id` 事実。Slack アカウント、チャンネル、ボットペアをキーにします。

信頼できるインバウンドのボット ID を公開しないチャンネルは、通常の自分自身のメッセージとアクセスポリシーのフィルターを使い続けます。ボットペアの両方の参加者を識別できるようになるまでは、このガードを有効にするべきではありません。

Plugin 実装の詳細については、[SDK ランタイム](/ja-JP/plugins/sdk-runtime#reusable-runtime-utilities) を参照してください。

---
read_when:
    - ボット作成のチャンネルメッセージの設定
    - bot 間ループ保護の調整
sidebarTitle: Bot loop protection
summary: ボット間ループ保護のデフォルトとチャネル上書き
title: ボットループ保護
x-i18n:
    generated_at: "2026-06-27T10:32:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a36794332e89dc7a9cf558e1687beabf4a6d10fb8e73c39794b0f0fd01c65b7
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

# ボットループ保護

OpenClaw は、`allowBots` をサポートするチャネルで他のボットが書き込んだメッセージを受け付けられます。
その経路が有効な場合、ペアループ保護により、2 つのボット ID が互いに無期限に返信し続けることを防ぎます。

このガードは、コアの受信返信ランナーによって適用されます。対応する各チャネルは、独自の受信イベントを汎用的な事実にマッピングします: アカウントまたはスコープ、会話 ID、送信側ボット ID、受信側ボット ID。次にコアは参加者ペアを双方向で追跡し、スライディングウィンドウの上限を適用し、上限を超えた後のクールダウン中はそのペアを抑制します。

## デフォルト

チャネルがボット作成メッセージをディスパッチに到達させる場合、ペアループ保護は有効です。組み込みのデフォルトは次のとおりです:

- `maxEventsPerWindow: 20` - ボットペアはウィンドウ内で 20 件のイベントを交換できます
- `windowSeconds: 60` - スライディングウィンドウの長さ
- `cooldownSeconds: 60` - ペアが上限を超えた後の抑制時間

このガードは、通常の人間が作成したメッセージ、単一ボットのデプロイ、自分自身のメッセージのフィルタリング、または上限内に収まる単発のボット返信には影響しません。

## 共有デフォルトを設定する

`channels.defaults.botLoopProtection` を一度設定すると、対応するすべてのチャネルに同じベースラインを与えられます。チャネルおよびアカウントのオーバーライドで、個別のサーフェスを引き続き調整できます。

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

`enabled: false` は、チャネルポリシーが自動抑制なしのボット間会話を意図的に許可する場合にのみ設定してください。

## チャネルまたはアカウントごとにオーバーライドする

対応するチャネルは、共有デフォルトの上に独自の設定を重ねます。優先順位は次のとおりです:

- `channels.<channel>.<room-or-space>.botLoopProtection`、チャネルが会話ごとのオーバーライドをサポートする場合
- `channels.<channel>.accounts.<account>.botLoopProtection`、チャネルがアカウントをサポートする場合
- `channels.<channel>.botLoopProtection`、チャネルがトップレベルのデフォルトをサポートする場合
- `channels.defaults.botLoopProtection`
- 組み込みのデフォルト

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
        molty: {
          allowBots: "mentions",
          botLoopProtection: {
            maxEventsPerWindow: 5,
            cooldownSeconds: 90,
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
  },
}
```

## チャネルのサポート

- Discord: ネイティブの `author.bot` 事実。Discord アカウント、チャネル、ボットペアでキー付けされます。
- Slack: 受け付けられたボット作成メッセージに対するネイティブの `bot_id` 事実。Slack アカウント、チャネル、ボットペアでキー付けされます。
- Matrix: 設定済みの Matrix ボットアカウント。Matrix アカウント、ルーム、設定済みボットペアでキー付けされます。
- Google Chat: 受け付けられたボット作成メッセージに対するネイティブの `sender.type=BOT` 事実。アカウント、スペース、ボットペアでキー付けされます。

信頼できる受信ボット ID を公開しないチャネルは、通常の自分自身のメッセージおよびアクセスポリシーのフィルターを引き続き使用します。ボットペアの両方の参加者を識別できるようになるまで、このガードを有効化すべきではありません。

Plugin の実装詳細については、[SDK ランタイム](/ja-JP/plugins/sdk-runtime#reusable-runtime-utilities)を参照してください。

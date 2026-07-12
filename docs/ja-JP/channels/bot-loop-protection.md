---
read_when:
    - ボットが作成したチャンネルメッセージの設定
    - ボット間ループ保護の調整
sidebarTitle: Bot loop protection
summary: ボット間ループ保護のデフォルト設定とチャンネルごとの上書き設定
title: Bot ループ保護
x-i18n:
    generated_at: "2026-07-11T21:56:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08637267cd3422d3154315e709c85c85fa57641f1adb0e8ef10c32e8a7b73312
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

OpenClaw は、`allowBots` をサポートするチャンネルで、他のボットが作成したメッセージを受信できます。この経路を有効にすると、ペアループ保護により、2 つのボット ID が互いに無期限に返信し続けることを防止します。

このガードは、コアの受信返信ランナーによって適用されます。対応する各チャンネルは、受信イベントをアカウントまたはスコープ、会話 ID、送信側ボット ID、受信側ボット ID という汎用情報にマッピングします。コアは参加者のペアを双方向で追跡し（A から B と B から A は同じペアとして数えます）、スライディングウィンドウの上限を適用し、上限を超えた後はクールダウン期間中そのペアを抑制します。

## デフォルト

チャンネルでボットが作成したメッセージをディスパッチに到達させる場合、ペアループ保護は常に有効です。組み込みのデフォルトは次のとおりです。

| キー                 | デフォルト | 意味                                                     |
| -------------------- | ---------- | -------------------------------------------------------- |
| `enabled`            | `true`     | この機能をサポートするチャンネルでガードを有効にします。 |
| `maxEventsPerWindow` | `20`       | ウィンドウ内でボットペアが交換できるイベント数です。     |
| `windowSeconds`      | `60`       | スライディングウィンドウの長さです。                     |
| `cooldownSeconds`    | `60`       | ペアが上限を超えた後の抑制時間です。                     |

このガードは、人間が作成したメッセージ、単一ボットのデプロイ、自己メッセージのフィルタリング、または上限内に収まるボットの返信には影響しません。

## 共有デフォルトの設定

`channels.defaults.botLoopProtection` を一度設定すると、対応するすべてのチャンネルに同じ基準値を適用できます。チャンネル、アカウント、ルームのオーバーライドを使用して、個別の対象を引き続き調整できます。

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

チャンネルポリシーで、自動抑制なしのボット間会話を意図的に許可する場合に限り、`enabled: false` を設定してください。

## チャンネル、アカウント、ルームごとのオーバーライド

対応するチャンネルは、キーごとに独自の設定を共有デフォルトへ重ねて適用します。優先順位は、最も限定的なものから次のとおりです。

1. `channels.<channel>.<room-or-space>.botLoopProtection`（チャンネルが会話ごとのオーバーライドをサポートする場合）
2. `channels.<channel>.accounts.<account>.botLoopProtection`（チャンネルがアカウントをサポートする場合）
3. `channels.<channel>.botLoopProtection`（チャンネルがトップレベルのデフォルトをサポートする場合）
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

## チャンネルのサポート状況

- Discord: ネイティブの `author.bot` 情報を使用し、Discord アカウント、チャンネル、ボットペアをキーとします。
- Google Chat: 受け入れられたボット作成メッセージに対するネイティブの `sender.type=BOT` 情報を使用し、アカウント、スペース、ボットペアをキーとします。
- Matrix: 設定済みの Matrix ボットアカウントを使用し、Matrix アカウント、ルーム、設定済みのボットペアをキーとします。
- Slack: 受け入れられたボット作成メッセージに対するネイティブの `bot_id` 情報を使用し、Slack アカウント、チャンネル、ボットペアをキーとします。

信頼できる受信ボット ID を公開していないチャンネルでは、通常の自己メッセージフィルターとアクセスポリシーフィルターを引き続き使用します。ボットペアの両方の参加者を識別できるようになるまでは、このガードを有効にすべきではありません。

Plugin の実装の詳細については、[SDK ランタイム](/ja-JP/plugins/sdk-runtime#reusable-runtime-utilities)を参照してください。

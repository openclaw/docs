---
read_when:
    - 設定由 Bot 撰寫的頻道訊息
    - 調整機器人對機器人迴圈保護
sidebarTitle: Bot loop protection
summary: Bot 對 Bot 迴圈保護預設值與通道覆寫
title: 機器人迴圈保護
x-i18n:
    generated_at: "2026-07-05T11:01:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08637267cd3422d3154315e709c85c85fa57641f1adb0e8ef10c32e8a7b73312
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

OpenClaw 可以接受由其他機器人在支援 `allowBots` 的通道上寫入的訊息。啟用該路徑時，配對迴圈防護會防止兩個機器人身分彼此無限回覆。

此防護由核心傳入回覆執行器強制執行。每個支援的通道都會將其傳入事件對應成通用事實：帳號或範圍、對話 ID、傳送方機器人 ID，以及接收方機器人 ID。核心會雙向追蹤參與者配對（A 到 B 與 B 到 A 會計為同一組配對）、套用滑動視窗預算，並在超出預算後於冷卻期間抑制該配對。

## 預設值

只要通道允許機器人撰寫的訊息進入分派，配對迴圈防護就會啟用。內建預設值：

| 鍵                   | 預設值  | 意義                                                |
| -------------------- | ------- | --------------------------------------------------- |
| `enabled`            | `true`  | 對支援此功能的通道啟用防護。                       |
| `maxEventsPerWindow` | `20`    | 機器人配對可在視窗內交換的事件數。                 |
| `windowSeconds`      | `60`    | 滑動視窗長度。                                      |
| `cooldownSeconds`    | `60`    | 配對超出預算後的抑制時間。                         |

此防護不會影響由真人撰寫的訊息、單一機器人部署、自我訊息篩選，或維持在預算內的機器人回覆。

## 設定共用預設值

設定一次 `channels.defaults.botLoopProtection`，即可為每個支援的通道提供相同基準。通道、帳號和房間覆寫仍可調整個別介面。

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

只有在你的通道政策刻意允許機器人對機器人對話且不進行自動抑制時，才設定 `enabled: false`。

## 依通道、帳號或房間覆寫

支援的通道會逐鍵將自己的設定疊加在共用預設值之上。優先順序由最窄到最寬如下：

1. `channels.<channel>.<room-or-space>.botLoopProtection`，當通道支援每個對話的覆寫時
2. `channels.<channel>.accounts.<account>.botLoopProtection`，當通道支援帳號時
3. `channels.<channel>.botLoopProtection`，當通道支援頂層預設值時
4. `channels.defaults.botLoopProtection`
5. 內建預設值

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

## 通道支援

- Discord：原生 `author.bot` 事實，依 Discord 帳號、通道和機器人配對作為鍵。
- Google Chat：對已接受的機器人撰寫訊息使用原生 `sender.type=BOT` 事實，依帳號、空間和機器人配對作為鍵。
- Matrix：已設定的 Matrix 機器人帳號，依 Matrix 帳號、房間和已設定的機器人配對作為鍵。
- Slack：對已接受的機器人撰寫訊息使用原生 `bot_id` 事實，依 Slack 帳號、通道和機器人配對作為鍵。

未公開可靠傳入機器人身分的通道，會繼續使用其一般的自我訊息與存取政策篩選器。在能識別機器人配對中的兩位參與者之前，它們不應選擇加入此防護。

請參閱 [SDK 執行階段](/zh-TW/plugins/sdk-runtime#reusable-runtime-utilities)，了解外掛實作詳細資訊。

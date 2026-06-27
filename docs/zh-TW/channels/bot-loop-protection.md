---
read_when:
    - 設定機器人撰寫的頻道訊息
    - 調整機器人對機器人迴圈保護
sidebarTitle: Bot loop protection
summary: Bot 對 Bot 迴圈保護預設值與頻道覆寫
title: Bot 迴圈保護
x-i18n:
    generated_at: "2026-06-27T18:54:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a36794332e89dc7a9cf558e1687beabf4a6d10fb8e73c39794b0f0fd01c65b7
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

# 機器人迴圈防護

OpenClaw 可以在支援 `allowBots` 的頻道上接受其他機器人撰寫的訊息。
啟用該路徑時，配對迴圈防護會防止兩個機器人身分
無限期地互相回覆。

此防護由核心傳入回覆執行器強制執行。每個支援的頻道
會將自己的傳入事件對應為通用事實：帳號或範圍、對話 ID、
傳送者機器人 ID，以及接收者機器人 ID。接著核心會雙向追蹤參與者配對，
套用滑動視窗預算，並在超過預算後於
冷卻期間抑制該配對。

## 預設值

當頻道允許機器人撰寫的訊息到達
分派流程時，配對迴圈防護會啟用。內建預設值為：

- `maxEventsPerWindow: 20` - 一組機器人配對可在視窗內交換 20 個事件
- `windowSeconds: 60` - 滑動視窗長度
- `cooldownSeconds: 60` - 配對超出預算後的抑制時間

此防護不會影響一般由人類撰寫的訊息、單一機器人部署、
自我訊息過濾，或維持在預算內的一次性機器人回覆。

## 設定共用預設值

設定一次 `channels.defaults.botLoopProtection`，即可為每個支援的頻道
提供相同基準。頻道與帳號覆寫仍可調整個別
介面。

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

只有在你的頻道政策刻意允許
機器人對機器人對話且不進行自動抑制時，才設定 `enabled: false`。

## 依頻道或帳號覆寫

支援的頻道會將自身設定疊加在共用預設值之上。優先順序為：

- `channels.<channel>.<room-or-space>.botLoopProtection`，當頻道支援依對話覆寫時
- `channels.<channel>.accounts.<account>.botLoopProtection`，當頻道支援帳號時
- `channels.<channel>.botLoopProtection`，當頻道支援最上層預設值時
- `channels.defaults.botLoopProtection`
- 內建預設值

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

## 頻道支援

- Discord：原生 `author.bot` 事實，以 Discord 帳號、頻道和機器人配對作為鍵。
- Slack：已接受的機器人撰寫訊息會使用原生 `bot_id` 事實，以 Slack 帳號、頻道和機器人配對作為鍵。
- Matrix：已設定的 Matrix 機器人帳號，以 Matrix 帳號、聊天室和已設定的機器人配對作為鍵。
- Google Chat：已接受的機器人撰寫訊息會使用原生 `sender.type=BOT` 事實，以帳號、聊天室空間和機器人配對作為鍵。

不公開可靠傳入機器人身分的頻道會繼續使用其
一般的自我訊息與存取政策過濾器。它們不應選擇加入此
防護，直到能夠識別機器人配對中的兩個參與者為止。

如需外掛實作詳細資訊，請參閱 [SDK runtime](/zh-TW/plugins/sdk-runtime#reusable-runtime-utilities)。

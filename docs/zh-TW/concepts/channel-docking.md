---
read_when:
    - 你希望某個作用中工作階段的回覆從 Telegram 轉移到 Discord、Slack、Mattermost 或其他已連結的頻道
    - 你正在設定用於跨通道直接訊息的 session.identityLinks
    - '`/dock` 命令顯示傳送者尚未連結，或不存在作用中的工作階段'
summary: 在已連結的聊天頻道之間移動單一 OpenClaw 工作階段的回覆路由
title: 通道對接
x-i18n:
    generated_at: "2026-04-30T02:58:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: b981cd177ed76194cf18667620a1f9b2f2ba50df42fe203f6f68916971ed6a61
    source_path: concepts/channel-docking.md
    workflow: 16
---

通道停靠是針對單一 OpenClaw 工作階段的來電轉接。

它會保留相同的對話脈絡，但變更該工作階段日後回覆的傳送位置。

## 範例

Alice 可以在 Telegram 和 Discord 上傳訊息給 OpenClaw：

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456"],
    },
  },
}
```

如果 Alice 從 Telegram 傳送這個：

```text
/dock_discord
```

OpenClaw 會保留目前的工作階段脈絡，並變更回覆路由：

| 停靠前                       | `/dock_discord` 後          |
| ---------------------------- | --------------------------- |
| 回覆會傳送到 Telegram `123` | 回覆會傳送到 Discord `456` |

工作階段不會重新建立。轉錄歷史記錄會保持附加在同一個工作階段上。

## 使用原因

當任務從一個聊天應用程式開始，但後續回覆應該送達其他地方時，請使用停靠。

常見流程：

1. 從 Telegram 啟動代理任務。
2. 移至你正在協調工作的 Discord。
3. 從 Telegram 工作階段傳送 `/dock_discord`。
4. 保留相同的 OpenClaw 工作階段，但在 Discord 中接收日後回覆。

## 必要設定

停靠需要 `session.identityLinks`。來源傳送者和目標對等端必須位於同一個身分群組中：

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456", "slack:U123"],
    },
  },
}
```

這些值是帶有通道前綴的對等端 ID：

| 值             | 含義                         |
| -------------- | ---------------------------- |
| `telegram:123` | Telegram 傳送者 ID `123`     |
| `discord:456`  | Discord 直接對等端 ID `456` |
| `slack:U123`   | Slack 使用者 ID `U123`       |

標準鍵（上方的 `alice`）只是共用身分群組名稱。停靠指令會使用帶有通道前綴的值，證明來源傳送者和目標對等端是同一個人。

## 命令

Dock 命令是從已載入且支援原生命令的通道 Plugin 產生。目前內建的命令：

| 目標通道 | 命令               | 別名               |
| -------- | ------------------ | ------------------ |
| Discord  | `/dock-discord`    | `/dock_discord`    |
| Mattermost | `/dock-mattermost` | `/dock_mattermost` |
| Slack    | `/dock-slack`      | `/dock_slack`      |
| Telegram | `/dock-telegram`   | `/dock_telegram`   |

底線別名適用於 Telegram 等原生命令介面。

## 變更內容

Dock 會更新作用中工作階段的遞送欄位：

| 工作階段欄位    | `/dock_discord` 之後的範例             |
| --------------- | ---------------------------------------- |
| `lastChannel`   | `discord`                                |
| `lastTo`        | `456`                                    |
| `lastAccountId` | 目標通道帳戶，或 `default` |

這些欄位會保存在工作階段儲存區中，並供該工作階段後續回覆遞送使用。

## 不會變更的內容

Dock 不會：

- 建立通道帳戶
- 連接新的 Discord、Telegram、Slack 或 Mattermost bot
- 授予使用者存取權
- 繞過通道允許清單或 DM 政策
- 將對話記錄移至另一個工作階段
- 讓無關的使用者共用工作階段

它只會變更目前工作階段的遞送路由。

## 疑難排解

**命令顯示傳送者尚未連結。**

將目前傳送者和目標對等端都加入同一個 `session.identityLinks` 群組。例如，如果 Telegram 傳送者 `123` 應 Dock 到 Discord 對等端 `456`，請同時包含 `telegram:123` 和 `discord:456`。

**命令顯示沒有作用中的工作階段。**

請從既有的直接聊天工作階段執行 Dock。此命令需要作用中的工作階段項目，才能保存新的路由。

**回覆仍傳送到舊通道。**

確認命令已回覆成功訊息，並確認目標對等端 id 符合該通道使用的 id。Dock 只會變更作用中工作階段路由；另一個工作階段可能仍會路由到其他位置。

**我需要切換回來。**

請由已連結的傳送者送出原始通道對應的命令，例如 `/dock_telegram` 或 `/dock-telegram`。

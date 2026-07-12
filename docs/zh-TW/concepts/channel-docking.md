---
read_when:
    - 你想要將某個作用中工作階段的回覆從 Telegram 移至 Discord、Slack、Mattermost 或其他已連結的頻道
    - 你正在設定 `session.identityLinks`，以用於跨頻道的直接訊息
    - /dock 命令顯示傳送者尚未連結，或目前沒有作用中的工作階段
summary: 在已連結的聊天頻道之間移動某個 OpenClaw 工作階段的回覆路由
title: 頻道停駐
x-i18n:
    generated_at: "2026-07-11T21:17:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d7af3a59b95b2c73cb74a9529584e51caed055719db2df8aad2ba8e8c9b0593
    source_path: concepts/channel-docking.md
    workflow: 16
---

頻道停靠相當於為單一 OpenClaw 工作階段設定通話轉接。它會保留相同的
對話上下文，但變更該工作階段後續回覆的傳送位置。停靠功能僅能從私聊使用；
無法從群組聊天執行。

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

如果 Alice 從 Telegram 私聊傳送以下命令：

```text
/dock_discord
```

OpenClaw 會保留目前的工作階段上下文，並變更回覆路由：

| 停靠前                     | 執行 `/dock_discord` 後   |
| -------------------------- | ------------------------- |
| 回覆傳送至 Telegram `123` | 回覆傳送至 Discord `456` |

工作階段不會重新建立。對話記錄歷程仍會附加至
同一個工作階段。

## 使用時機

當任務從某個聊天應用程式開始，但後續回覆應傳送至
其他位置時，請使用停靠功能。

常見流程：

1. 從 Telegram 啟動代理程式任務。
2. 移至用來協調工作的 Discord。
3. 從 Telegram 私聊傳送 `/dock_discord`。
4. 保留相同的 OpenClaw 工作階段，但在 Discord 接收後續回覆。

## 必要設定

停靠功能需要 `session.identityLinks`。來源傳送者與目標對等端
必須位於相同的身分群組中：

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456", "slack:U123"],
    },
  },
}
```

這些值是帶有頻道前綴的對等端 ID：

| 值             | 含義                         |
| -------------- | ---------------------------- |
| `telegram:123` | Telegram 傳送者 ID `123`     |
| `discord:456`  | Discord 私聊對等端 ID `456`  |
| `slack:U123`   | Slack 使用者 ID `U123`       |

標準鍵（上例中的 `alice`）僅是共用身分群組的名稱。停靠
命令會使用帶有頻道前綴的值，證明來源傳送者與
目標對等端是同一個人。

## 命令

OpenClaw 會為每個支援原生命令且已載入的頻道外掛，產生一個
`/dock-<channel>` 命令，因此命令清單會隨著新增外掛而增加。目前支援此功能的
內建外掛如下：

| 目標頻道   | 命令               | 別名               |
| ---------- | ------------------ | ------------------ |
| Discord    | `/dock-discord`    | `/dock_discord`    |
| Mattermost | `/dock-mattermost` | `/dock_mattermost` |
| Slack      | `/dock-slack`      | `/dock_slack`      |
| Telegram   | `/dock-telegram`   | `/dock_telegram`   |

在 Telegram 這類直接提供斜線命令的介面上，底線形式也是
原生命令名稱。

## 變更內容

停靠功能會更新作用中工作階段的傳送欄位：

| 工作階段欄位    | 執行 `/dock_discord` 後的範例     |
| --------------- | --------------------------------- |
| `lastChannel`   | `discord`                         |
| `lastTo`        | `456`                             |
| `lastAccountId` | 目標頻道帳號，或 `default`        |

這些欄位會持久儲存在工作階段儲存區中，並由該工作階段後續的
回覆傳送流程使用。

## 不變內容

停靠功能不會：

- 建立頻道帳號
- 連線新的 Discord、Telegram、Slack 或 Mattermost 機器人
- 授予使用者存取權
- 略過頻道允許清單或私訊政策
- 將對話記錄歷程移至另一個工作階段
- 讓無關的使用者共用工作階段

它只會變更目前工作階段的傳送路由。

## 疑難排解

**命令顯示傳送者尚未連結。**

請將目前傳送者與目標對等端加入同一個
`session.identityLinks` 群組。例如，若 Telegram 傳送者 `123` 應停靠至
Discord 對等端 `456`，請同時加入 `telegram:123` 和 `discord:456`。

**命令顯示停靠功能僅能從私聊使用。**

請從與 OpenClaw 的私聊傳送停靠命令，而非從群組聊天傳送。

**命令顯示沒有作用中的工作階段。**

請從現有的私聊工作階段執行停靠。此命令需要作用中的工作階段
項目，才能持久儲存新路由。

**回覆仍傳送至舊頻道。**

請確認命令已回覆成功訊息，並確認目標
對等端 ID 與該頻道使用的 ID 相符。停靠功能只會變更作用中
工作階段的路由；其他工作階段仍可能路由至其他位置。

**我需要切換回原頻道。**

請從已連結的傳送者傳送原頻道對應的命令，例如 `/dock_telegram` 或
`/dock-telegram`。

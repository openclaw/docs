---
read_when:
    - 你希望某個作用中工作階段的回覆從 Telegram 移至 Discord、Slack、Mattermost 或另一個已連結的頻道。
    - 你正在設定 session.identityLinks，以用於跨通道私訊
    - /dock 命令顯示傳送者尚未連結，或沒有作用中的工作階段存在
summary: 在已連結的聊天頻道之間移動一個 OpenClaw 工作階段的回覆路由
title: 通道對接
x-i18n:
    generated_at: "2026-07-05T11:12:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d7af3a59b95b2c73cb74a9529584e51caed055719db2df8aad2ba8e8c9b0593
    source_path: concepts/channel-docking.md
    workflow: 16
---

頻道停靠是針對單一 OpenClaw 工作階段的來電轉接。它會保留相同的
對話脈絡，但變更該工作階段未來回覆的送達位置。停靠只能從直接聊天使用；不能從群組
聊天執行。

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

如果 Alice 從 Telegram 直接聊天送出：

```text
/dock_discord
```

OpenClaw 會保留目前的工作階段脈絡並變更回覆路由：

| 停靠前                       | `/dock_discord` 後          |
| ---------------------------- | --------------------------- |
| 回覆傳送到 Telegram `123`    | 回覆傳送到 Discord `456`    |

工作階段不會重新建立。轉錄歷程會保持附加在
同一個工作階段。

## 使用時機

當工作從某個聊天應用程式開始，但接下來的回覆應該送到
其他地方時，請使用停靠。

常見流程：

1. 從 Telegram 啟動代理程式工作。
2. 移到正在協調工作的 Discord。
3. 從 Telegram 直接聊天送出 `/dock_discord`。
4. 保留相同的 OpenClaw 工作階段，但在 Discord 接收未來回覆。

## 必要設定

停靠需要 `session.identityLinks`。來源傳送者和目標對等端
必須在同一個身分群組中：

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

| 值             | 意義                         |
| -------------- | ---------------------------- |
| `telegram:123` | Telegram 傳送者 ID `123`     |
| `discord:456`  | Discord 直接對等端 ID `456`  |
| `slack:U123`   | Slack 使用者 ID `U123`       |

標準鍵（上方的 `alice`）只是共用身分群組名稱。停靠
命令會使用帶有頻道前綴的值來證明來源傳送者和
目標對等端是同一個人。

## 命令

OpenClaw 會為每個已載入且支援原生命令的頻道外掛產生一個 `/dock-<channel>` 命令，
因此清單會隨著外掛加入而增長。目前支援它的內建
外掛：

| 目標頻道   | 命令               | 別名               |
| ---------- | ------------------ | ------------------ |
| Discord    | `/dock-discord`    | `/dock_discord`    |
| Mattermost | `/dock-mattermost` | `/dock_mattermost` |
| Slack      | `/dock-slack`      | `/dock_slack`      |
| Telegram   | `/dock-telegram`   | `/dock_telegram`   |

底線形式也是像 Telegram 這類直接公開斜線命令的介面上的原生命令名稱。

## 變更內容

停靠會更新作用中工作階段的送達欄位：

| 工作階段欄位  | `/dock_discord` 後的範例              |
| ------------- | ------------------------------------- |
| `lastChannel` | `discord`                             |
| `lastTo`      | `456`                                 |
| `lastAccountId` | 目標頻道帳號，或 `default`          |

這些欄位會保存在工作階段儲存區中，並由該工作階段後續的回覆
送達使用。

## 不會變更的內容

停靠不會：

- 建立頻道帳號
- 連線新的 Discord、Telegram、Slack 或 Mattermost 機器人
- 授予使用者存取權
- 繞過頻道允許清單或私訊政策
- 將轉錄歷程移到另一個工作階段
- 讓無關的使用者共用工作階段

它只會變更目前工作階段的送達路由。

## 疑難排解

**命令顯示傳送者尚未連結。**

將目前傳送者和目標對等端都加入同一個
`session.identityLinks` 群組。例如，如果 Telegram 傳送者 `123` 應該停靠
到 Discord 對等端 `456`，請同時包含 `telegram:123` 和 `discord:456`。

**命令顯示停靠只能從直接聊天使用。**

請從與 OpenClaw 的直接聊天送出停靠命令，不要從群組聊天送出。

**命令顯示沒有作用中的工作階段。**

請從現有的直接聊天工作階段執行停靠。此命令需要作用中的工作階段
項目，才能保存新路由。

**回覆仍然傳送到舊頻道。**

請檢查命令是否以成功訊息回覆，並確認目標
對等端 ID 符合該頻道使用的 ID。停靠只會變更作用中的
工作階段路由；另一個工作階段可能仍會路由到其他地方。

**我需要切換回去。**

請從已連結的傳送者送出原始頻道的對應命令，例如 `/dock_telegram` 或
`/dock-telegram`。

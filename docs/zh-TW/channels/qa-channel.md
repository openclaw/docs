---
read_when:
    - 您正在將合成 QA 傳輸接入本機或 CI 測試執行
    - 你需要隨附的 qa-channel 設定介面
    - 你正在反覆改進端到端 QA 自動化
summary: 用於確定性 OpenClaw QA 情境的合成 Slack 類通道外掛
title: QA 頻道
x-i18n:
    generated_at: "2026-07-05T11:03:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f33af6ef31515e0cab0ee2540f48f3ffea8aba3d13915dc8cf66111599354187
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` 是儲存庫本機的合成訊息傳輸，用於自動化 OpenClaw QA（`extensions/qa-channel`，私有套件，已從打包安裝中排除）。它不是生產用頻道；它的存在是為了演練真實傳輸所使用的相同頻道外掛邊界，同時讓狀態保持確定性且完全可檢查。

## 它的功能

- Slack 類型目標語法：
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- 共享的 `channel:` 和 `group:` 對話會以群組/頻道房間回合呈現給代理，因此會演練 Discord、Slack、Telegram 以及類似傳輸所使用的相同可見回覆與訊息工具路由政策。
- 以 HTTP 支援的合成匯流排，用於注入傳入訊息、擷取傳出逐字稿、建立執行緒、反應、編輯、刪除，以及搜尋/讀取動作。
- 主機端自我檢查執行器，會將 Markdown 報告寫入 `.artifacts/qa-e2e/`。

## 設定

```json
{
  "channels": {
    "qa-channel": {
      "baseUrl": "http://127.0.0.1:43123",
      "botUserId": "openclaw",
      "botDisplayName": "OpenClaw QA",
      "allowFrom": ["*"],
      "pollTimeoutMs": 1000
    }
  }
}
```

帳號鍵：

- `enabled` - 此帳號的主開關。
- `name` - 選用的顯示標籤。
- `baseUrl` - 合成匯流排 URL。設定此項後，帳號即視為已設定。
- `botUserId` - 目標語法中使用的合成機器人使用者 id（預設：`openclaw`）。
- `botDisplayName` - 傳出訊息的顯示名稱（預設：`OpenClaw QA`）。
- `pollTimeoutMs` - 長輪詢等待視窗。介於 100 和 30000 之間的整數（預設：1000）。
- `allowFrom` - 寄件者允許清單（使用者 id 或 `"*"`；預設：`["*"]`）。私訊一律為
  `open` 政策；允許清單群組政策也會使用這些合成
  寄件者 id。
- `groupPolicy` - 共享房間政策：`"open"`（預設）、`"allowlist"` 或
  `"disabled"`。
- `groupAllowFrom` - 選用的共享房間寄件者允許清單。在
  `"allowlist"` 下省略時，QA Channel 會回退到 `allowFrom`。
- `groups.<room>.requireMention` - 在特定群組/頻道房間回覆前，要求提及機器人（預設：false）。`groups."*"` 會設定預設值；
  每個房間的 `tools` / `toolsBySender` 會設定工具政策覆寫。
- `defaultTo` - 未提供目標時的備用目標。
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` - 每個動作的工具閘控。

最上層的多帳號鍵：

- `accounts` - 以帳號 id 為鍵的具名個別帳號覆寫記錄。
- `defaultAccount` - 設定多個帳號時偏好的帳號 id。

## 執行器

主機端自我檢查（在 `.artifacts/qa-e2e/` 下寫入 Markdown 報告）：

```bash
pnpm qa:e2e
```

這會透過 `qa-lab` 路由、啟動儲存庫內的 QA 匯流排、啟動 `qa-channel` 執行階段切片，並執行確定性的自我檢查。

完整的儲存庫支援情境套件：

```bash
pnpm openclaw qa suite
```

會針對 QA 閘道通道平行執行情境。情境、設定檔和提供者模式請參閱 [QA 概覽](/zh-TW/concepts/qa-e2e-automation)。

Docker 支援的 QA 網站（閘道 + QA Lab 除錯器 UI 位於同一堆疊）：

```bash
pnpm qa:lab:up
```

建置 QA 網站，啟動 Docker 支援的閘道 + QA Lab 堆疊，並印出 QA Lab URL。之後你可以選擇情境、選擇模型通道、啟動個別執行，並即時觀看結果。QA Lab 除錯器與已發佈的 Control UI 套件是分開的。

## 相關

- [QA 概覽](/zh-TW/concepts/qa-e2e-automation) - 整體堆疊、傳輸配接器、情境撰寫
- [矩陣 QA](/zh-TW/concepts/qa-matrix) - 驅動真實頻道的即時傳輸執行器範例
- [配對](/zh-TW/channels/pairing)
- [群組](/zh-TW/channels/groups)
- [頻道概覽](/zh-TW/channels)

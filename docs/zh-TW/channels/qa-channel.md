---
read_when:
    - 你要將合成 QA 傳輸接入本機或 CI 測試執行中
    - 你需要隨附的 qa-channel 設定介面
    - 你正在持續迭代端對端 QA 自動化
summary: 用於確定性 OpenClaw QA 情境的合成 Slack 類通道 Plugin
title: QA 頻道
x-i18n:
    generated_at: "2026-05-06T09:03:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1990b64d8a3ed158b11fc08742f774c5355ee25b68402ec447b92316109ac2f2
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` 是隨附的合成訊息傳輸，用於自動化 OpenClaw QA。它不是生產環境頻道 - 它的存在是為了在保持狀態具備確定性且完全可檢查的同時，演練真實傳輸所使用的同一個頻道 Plugin 邊界。

## 它的功能

- Slack 類目標語法：
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- 共用的 `channel:` 和 `group:` 對話會以群組/頻道房間回合的形式呈現給代理，因此它們會演練 Discord、Slack、Telegram 及類似傳輸所使用的同一套可見回覆與訊息工具路由政策。
- 以 HTTP 為後端的合成匯流排，用於注入傳入訊息、擷取傳出轉錄、建立執行緒、反應、編輯、刪除，以及搜尋/讀取動作。
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

帳戶鍵：

- `enabled` - 此帳戶的主要開關。
- `name` - 選用的顯示標籤。
- `baseUrl` - 合成匯流排 URL。
- `botUserId` - 目標語法中使用的 Matrix 風格 bot 使用者 ID。
- `botDisplayName` - 傳出訊息的顯示名稱。
- `pollTimeoutMs` - 長輪詢等待視窗。介於 100 到 30000 之間的整數。
- `allowFrom` - 寄件者允許清單（使用者 ID 或 `"*"`）。
- `defaultTo` - 未提供目標時的備用目標。
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` - 依動作套用的工具控管。

頂層的多帳戶鍵：

- `accounts` - 依帳戶 ID 建立索引的具名逐帳戶覆寫記錄。
- `defaultAccount` - 設定多個帳戶時偏好的帳戶 ID。

## 執行器

主機端自我檢查（在 `.artifacts/qa-e2e/` 下寫入 Markdown 報告）：

```bash
pnpm qa:e2e
```

這會透過 `qa-lab` 路由，啟動儲存庫內的 QA 匯流排，啟動隨附的 `qa-channel` 執行階段片段，並執行具備確定性的自我檢查。

完整的儲存庫支援情境套件：

```bash
pnpm openclaw qa suite
```

針對 QA gateway 路徑平行執行情境。請參閱 [QA 概觀](/zh-TW/concepts/qa-e2e-automation)以了解情境、設定檔和供應商模式。

Docker 支援的 QA 站台（gateway + QA Lab 偵錯器 UI 位於同一個堆疊中）：

```bash
pnpm qa:lab:up
```

建置 QA 站台，啟動 Docker 支援的 gateway + QA Lab 堆疊，並列印 QA Lab URL。接著你可以挑選情境、選擇模型路徑、啟動個別執行，並即時觀看結果。QA Lab 偵錯器與已出貨的 Control UI bundle 是分開的。

## 相關

- [QA 概觀](/zh-TW/concepts/qa-e2e-automation) - 整體堆疊、傳輸配接器、情境撰寫
- [Matrix QA](/zh-TW/concepts/qa-matrix) - 驅動真實頻道的即時傳輸執行器範例
- [配對](/zh-TW/channels/pairing)
- [群組](/zh-TW/channels/groups)
- [頻道概觀](/zh-TW/channels)

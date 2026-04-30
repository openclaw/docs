---
read_when:
    - 您正在將合成 QA 傳輸接入本機或 CI 測試執行
    - 你需要隨附的 qa-channel 設定介面
    - 你正在反覆改進端對端品質保證自動化
summary: 用於決定性 OpenClaw QA 情境的合成 Slack 級頻道 Plugin
title: QA 頻道
x-i18n:
    generated_at: "2026-04-30T02:48:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: e1de1f52da1a14c845cf2a536ddc6f36ab52ed6364f68d9ece32ce272e2a2f96
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` 是一個隨附的合成訊息傳輸，用於自動化 OpenClaw QA。它不是生產用通道，而是用來演練實際傳輸所使用的相同通道 Plugin 邊界，同時保持狀態具備確定性且可完整檢查。

## 功能

- Slack 類型目標語法：
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- 以 HTTP 支援的合成匯流排，用於注入傳入訊息、擷取傳出逐字稿、建立討論串、反應、編輯、刪除，以及搜尋/讀取動作。
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

- `enabled` — 此帳號的主開關。
- `name` — 選用的顯示標籤。
- `baseUrl` — 合成匯流排 URL。
- `botUserId` — 目標語法中使用的 Matrix 樣式機器人使用者 ID。
- `botDisplayName` — 傳出訊息的顯示名稱。
- `pollTimeoutMs` — 長輪詢等待時間窗。介於 100 到 30000 之間的整數。
- `allowFrom` — 寄件者允許清單（使用者 ID 或 `"*"`）。
- `defaultTo` — 未提供目標時的後備目標。
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` — 依動作設定的工具門控。

頂層的多帳號鍵：

- `accounts` — 以帳號 ID 作為鍵的具名逐帳號覆寫記錄。
- `defaultAccount` — 設定多個帳號時偏好的帳號 ID。

## 執行器

主機端自我檢查（在 `.artifacts/qa-e2e/` 下寫入 Markdown 報告）：

```bash
pnpm qa:e2e
```

這會透過 `qa-lab` 路由，啟動儲存庫內的 QA 匯流排，啟動隨附的 `qa-channel` 執行階段切片，並執行具確定性的自我檢查。

完整的儲存庫支援情境套件：

```bash
pnpm openclaw qa suite
```

針對 QA Gateway lane 平行執行情境。情境、設定檔與供應商模式請參閱 [QA 概觀](/zh-TW/concepts/qa-e2e-automation)。

Docker 支援的 QA 站台（Gateway + QA Lab 除錯器 UI 位於同一個堆疊中）：

```bash
pnpm qa:lab:up
```

建置 QA 站台，啟動 Docker 支援的 Gateway + QA Lab 堆疊，並列印 QA Lab URL。接著你可以挑選情境、選擇模型 lane、啟動個別執行，並即時觀看結果。QA Lab 除錯器與已出貨的 Control UI bundle 是分開的。

## 相關

- [QA 概觀](/zh-TW/concepts/qa-e2e-automation) — 整體堆疊、傳輸配接器、情境撰寫
- [Matrix QA](/zh-TW/concepts/qa-matrix) — 驅動真實通道的範例即時傳輸執行器
- [配對](/zh-TW/channels/pairing)
- [群組](/zh-TW/channels/groups)
- [通道概觀](/zh-TW/channels)

---
read_when:
    - 你正在將合成 QA 傳輸接入本機或 CI 測試執行
    - 你需要隨附的 qa-channel 設定介面
    - 你正在疊代改進端對端 QA 自動化
summary: 用於確定性 OpenClaw QA 情境的合成 Slack 類通道 Plugin
title: QA 頻道
x-i18n:
    generated_at: "2026-05-02T02:44:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: efe057812de1fbc6d89d2b6d5860cd6af4648c3e86913efa3a69267c4e8c57b4
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` 是一個內建的合成訊息傳輸，用於自動化 OpenClaw QA。它不是生產用頻道 — 它的存在是為了測試真實傳輸所使用的相同頻道 Plugin 邊界，同時讓狀態保持確定性且可完整檢查。

## 它的作用

- Slack 類別目標文法：
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- 共用的 `channel:` 和 `group:` 對話會以群組/頻道房間回合的形式呈現給代理，因此它們會測試 Discord、Slack、Telegram 和類似傳輸所使用的相同可見回覆與訊息工具路由政策。
- 由 HTTP 支援的合成匯流排，用於傳入訊息注入、傳出逐字稿擷取、建立執行緒、回應、編輯、刪除，以及搜尋/讀取動作。
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

- `enabled` — 此帳戶的主開關。
- `name` — 選用的顯示標籤。
- `baseUrl` — 合成匯流排 URL。
- `botUserId` — 在目標文法中使用的 Matrix 風格 Bot 使用者 ID。
- `botDisplayName` — 傳出訊息的顯示名稱。
- `pollTimeoutMs` — 長輪詢等待視窗。介於 100 到 30000 之間的整數。
- `allowFrom` — 傳送者允許清單（使用者 ID 或 `"*"`）。
- `defaultTo` — 未提供目標時的後備目標。
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` — 依動作設定的工具閘控。

頂層的多帳戶鍵：

- `accounts` — 以帳戶 ID 為鍵的具名個別帳戶覆寫記錄。
- `defaultAccount` — 設定多個帳戶時偏好的帳戶 ID。

## 執行器

主機端自我檢查（在 `.artifacts/qa-e2e/` 下寫入 Markdown 報告）：

```bash
pnpm qa:e2e
```

這會透過 `qa-lab` 路由，啟動儲存庫內的 QA 匯流排，啟動內建的 `qa-channel` 執行階段切片，並執行確定性的自我檢查。

完整的儲存庫支援情境套件：

```bash
pnpm openclaw qa suite
```

針對 QA Gateway 通道平行執行情境。請參閱 [QA 概觀](/zh-TW/concepts/qa-e2e-automation) 以了解情境、設定檔和提供者模式。

Docker 支援的 QA 網站（Gateway + QA Lab 偵錯工具 UI 位於同一個堆疊中）：

```bash
pnpm qa:lab:up
```

建置 QA 網站，啟動 Docker 支援的 Gateway + QA Lab 堆疊，並列印 QA Lab URL。接著你可以挑選情境、選擇模型通道、啟動個別執行，並即時觀看結果。QA Lab 偵錯工具與隨附的 Control UI 套件是分開的。

## 相關

- [QA 概觀](/zh-TW/concepts/qa-e2e-automation) — 整體堆疊、傳輸配接器、情境編寫
- [Matrix QA](/zh-TW/concepts/qa-matrix) — 驅動真實頻道的即時傳輸執行器範例
- [配對](/zh-TW/channels/pairing)
- [群組](/zh-TW/channels/groups)
- [頻道概觀](/zh-TW/channels)

---
read_when:
    - 您正在將合成 QA 傳輸機制接入本機或 CI 測試執行流程
    - 你需要隨附的 qa-channel 設定介面
    - 你正在反覆改進端對端品質保證自動化流程
summary: 用於確定性 OpenClaw 品質保證情境的合成 Slack 類別頻道外掛
title: QA 頻道
x-i18n:
    generated_at: "2026-07-11T21:07:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f33af6ef31515e0cab0ee2540f48f3ffea8aba3d13915dc8cf66111599354187
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` 是用於自動化 OpenClaw QA 的儲存庫本機合成訊息傳輸機制（`extensions/qa-channel`，私有套件，不包含在封裝安裝中）。它不是正式環境頻道，而是用來測試真實傳輸機制所使用的相同頻道外掛邊界，同時讓狀態保持確定且完全可檢查。

## 功能

- Slack 類型的目標語法：
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- 共用的 `channel:` 和 `group:` 對話會以群組／頻道房間回合的形式呈現給代理程式，因此會測試 Discord、Slack、Telegram 及類似傳輸機制所使用的相同可見回覆與訊息工具路由政策。
- 以 HTTP 為基礎的合成匯流排，可用於注入傳入訊息、擷取傳出記錄、建立討論串、回應、編輯、刪除，以及搜尋／讀取動作。
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

- `enabled`－此帳號的總開關。
- `name`－選用的顯示標籤。
- `baseUrl`－合成匯流排 URL。設定此項後，帳號即視為已完成設定。
- `botUserId`－目標語法中使用的合成機器人使用者 ID（預設值：`openclaw`）。
- `botDisplayName`－傳出訊息的顯示名稱（預設值：`OpenClaw QA`）。
- `pollTimeoutMs`－長輪詢等待時間。介於 100 到 30000 之間的整數（預設值：1000）。
- `allowFrom`－傳送者允許清單（使用者 ID 或 `"*"`；預設值：`["*"]`）。私訊一律採用 `open` 政策；採用允許清單的群組政策也會使用這些合成傳送者 ID。
- `groupPolicy`－共用房間政策：`"open"`（預設）、`"allowlist"` 或 `"disabled"`。
- `groupAllowFrom`－選用的共用房間傳送者允許清單。在 `"allowlist"` 下省略此項時，QA Channel 會改用 `allowFrom`。
- `groups.<room>.requireMention`－在特定群組／頻道房間中，回覆前必須提及機器人（預設值：false）。`groups."*"` 用於設定預設值；每個房間的 `tools`／`toolsBySender` 可設定工具政策覆寫。
- `defaultTo`－未提供目標時使用的備用目標。
- `actions.messages`／`actions.reactions`／`actions.search`／`actions.threads`－各動作的工具存取控制。

頂層的多帳號鍵：

- `accounts`－以帳號 ID 為鍵的具名帳號個別覆寫記錄。
- `defaultAccount`－設定多個帳號時的偏好帳號 ID。

## 執行器

主機端自我檢查（將 Markdown 報告寫入 `.artifacts/qa-e2e/`）：

```bash
pnpm qa:e2e
```

此命令會透過 `qa-lab` 路由、啟動儲存庫內的 QA 匯流排、啟動 `qa-channel` 執行階段切片，並執行確定性的自我檢查。

完整的儲存庫支援情境套件：

```bash
pnpm openclaw qa suite
```

針對 QA 閘道通道平行執行情境。如需情境、設定檔和供應商模式的詳細資訊，請參閱 [QA 概觀](/zh-TW/concepts/qa-e2e-automation)。

Docker 支援的 QA 網站（閘道與 QA Lab 偵錯工具介面位於同一堆疊中）：

```bash
pnpm qa:lab:up
```

建置 QA 網站、啟動 Docker 支援的閘道與 QA Lab 堆疊，並顯示 QA Lab URL。您可以在其中選取情境、選擇模型通道、啟動個別執行，並即時查看結果。QA Lab 偵錯工具與正式發布的 Control UI 套件彼此獨立。

## 相關內容

- [QA 概觀](/zh-TW/concepts/qa-e2e-automation)－整體堆疊、傳輸配接器、情境編寫
- [矩陣 QA](/zh-TW/concepts/qa-matrix)－驅動真實頻道的即時傳輸執行器範例
- [配對](/zh-TW/channels/pairing)
- [群組](/zh-TW/channels/groups)
- [頻道概觀](/zh-TW/channels)

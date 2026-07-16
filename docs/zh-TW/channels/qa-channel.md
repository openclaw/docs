---
read_when:
    - 你正在將合成 QA 傳輸機制整合至本機或 CI 測試執行中
    - 你需要內建的 qa-channel 設定介面
    - 你正在反覆改進端對端 QA 自動化流程
summary: 適用於確定性 OpenClaw QA 情境的模擬 Slack 類別頻道外掛
title: QA 頻道
x-i18n:
    generated_at: "2026-07-16T11:21:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a43c35e197116a6bd44b238010eb508aed23dea99ab872d10e6fc853b5f4d4a7
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` 是一種儲存庫本機的合成訊息傳輸，用於自動化 OpenClaw QA（`extensions/qa-channel`、私有套件，不包含在封裝安裝中）。它不是正式環境頻道，而是用來演練真實傳輸所使用的相同頻道外掛邊界，同時保持狀態具確定性且可完整檢查。

## 功能

- Slack 類別的目標語法：
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- 共享的 `channel:` 和 `group:` 對話會以群組／頻道聊天室回合的形式呈現給代理程式，因此可演練 Discord、Slack、Telegram 和類似傳輸所使用的相同可見回覆與訊息工具路由政策。
- 以 HTTP 為基礎的合成匯流排，用於注入傳入訊息、擷取傳出記錄、建立討論串、回應、編輯、刪除，以及搜尋／讀取動作。
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

- `enabled` — 此帳號的總開關。
- `name` — 選用的顯示標籤。
- `baseUrl` — 合成匯流排 URL。設定此項後，帳號即視為已設定。
- `botUserId` — 目標語法中使用的合成機器人使用者 ID（預設：`openclaw`）。
- `botDisplayName` — 傳出訊息的顯示名稱（預設：`OpenClaw QA`）。
- `pollTimeoutMs` — 長輪詢等待時間範圍。介於 100 和 30000 之間的整數（預設：1000）。
- `allowFrom` — 傳送者允許清單（使用者 ID 或 `"*"`；預設：`["*"]`）。私訊一律採用
  `open` 政策；允許清單群組政策也使用這些合成
  傳送者 ID。
- `groupPolicy` — 共享聊天室政策：`"open"`（預設）、`"allowlist"` 或
  `"disabled"`。
- `groupAllowFrom` — 選用的共享聊天室傳送者允許清單。在
  `"allowlist"` 下省略時，QA Channel 會改用 `allowFrom`。
- `groups.<room>.requireMention` — 在特定群組／頻道聊天室中，要求提及機器人才會回覆
  （預設：false）。`groups."*"` 設定預設值；
  每個聊天室的 `tools`／`toolsBySender` 設定工具政策覆寫。
- `defaultTo` — 未提供目標時使用的後備目標。
- `actions.messages`／`actions.reactions`／`actions.search`／`actions.threads` — 每個動作的工具管控。

頂層的多帳號鍵：

- `accounts` — 以帳號 ID 為鍵的具名個別帳號覆寫記錄。
- `defaultAccount` — 設定多個帳號時的偏好帳號 ID。

## 執行器

主機端自我檢查（將 Markdown 報告寫入 `.artifacts/qa-e2e/` 下）：

```bash
pnpm qa:e2e
```

這會透過 `qa-lab` 路由、啟動儲存庫內的 QA 匯流排、啟動 `qa-channel` 執行階段切片，並執行具確定性的自我檢查。

完整的儲存庫支援情境套件：

```bash
pnpm openclaw qa suite
```

針對 QA 閘道工作執行緒平行執行情境。如需情境、設定檔和提供者模式的詳細資訊，請參閱 [QA 概觀](/zh-TW/concepts/qa-e2e-automation)。

以 Docker 為基礎的 QA 站台（閘道 + 位於同一堆疊中的 QA Lab 偵錯工具 UI）：

```bash
pnpm qa:lab:up
```

建置 QA 站台、啟動以 Docker 為基礎的閘道 + QA Lab 堆疊，並印出 QA Lab URL。你可以從該處挑選情境、選擇模型工作執行緒、啟動個別執行，並即時查看結果。QA Lab 偵錯工具與隨附的 Control UI 套件分開。

## 相關內容

- [QA 概觀](/zh-TW/concepts/qa-e2e-automation) — 整體堆疊、傳輸配接器、Matrix 設定檔和情境撰寫
- [配對](/zh-TW/channels/pairing)
- [群組](/zh-TW/channels/groups)
- [頻道概觀](/zh-TW/channels)

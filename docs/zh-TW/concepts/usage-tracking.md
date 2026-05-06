---
read_when:
    - 你正在串接提供者使用量/配額介面
    - 你需要說明使用量追蹤行為或身分驗證要求
summary: 使用量追蹤介面與憑證需求
title: 使用量追蹤
x-i18n:
    generated_at: "2026-05-06T09:08:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14210813bf3c078a1323b1560a1a3da586f55880e05a9b310e1b6a2d5490f956
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## 它是什麼

- 直接從供應商的用量端點提取供應商用量/配額。
- 不估算成本；只使用供應商回報的時間窗口。
- 人類可讀的狀態輸出會正規化為 `X% left`，即使上游 API 回報的是已消耗配額、剩餘配額，或只有原始計數。
- 工作階段層級的 `/status` 和 `session_status` 可在即時工作階段快照資訊稀疏時，退回使用最新的文字記錄用量項目。該退回機制會補齊缺少的 token/快取計數器，可復原作用中的執行階段模型標籤，並在工作階段中繼資料缺失或較小時，偏好較大的提示導向總量。既有的非零即時值仍會優先使用。

## 出現的位置

- 聊天中的 `/status`：含豐富表情符號的狀態卡，顯示工作階段 token + 估算成本（僅 API 金鑰）。可用時，供應商用量會針對**目前模型供應商**顯示為正規化的 `X% left` 時間窗口。
- 聊天中的 `/usage off|tokens|full`：每則回覆的用量頁尾（OAuth 只顯示 token）。
- 聊天中的 `/usage cost`：從 OpenClaw 工作階段記錄彙總出的本機成本摘要。
- CLI：`openclaw status --usage` 會列印完整的逐供應商明細。
- CLI：`openclaw channels list` 會在供應商設定旁列印相同的用量快照（使用 `--no-usage` 可略過）。
- macOS 選單列：Context 下的「用量」區段（僅在可用時）。

## 供應商 + 認證

- **Anthropic (Claude)**：驗證設定檔中的 OAuth token。
- **GitHub Copilot**：驗證設定檔中的 OAuth token。
- **Gemini CLI**：驗證設定檔中的 OAuth token。
  - JSON 用量會退回使用 `stats`；`stats.cached` 會正規化為 `cacheRead`。
- **OpenAI Codex**：驗證設定檔中的 OAuth token（存在時使用 accountId）。
- **MiniMax**：API 金鑰或 MiniMax OAuth 驗證設定檔。OpenClaw 會將 `minimax`、`minimax-cn` 和 `minimax-portal` 視為同一個 MiniMax 配額介面，存在已儲存的 MiniMax OAuth 時會優先使用，否則退回使用 `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY` 或 `MINIMAX_API_KEY`。
  用量輪詢會在已設定時，從 `models.providers.minimax-portal.baseUrl` 或 `models.providers.minimax.baseUrl` 推導 Coding Plan 主機，否則使用 MiniMax CN 主機。
  MiniMax 的原始 `usage_percent` / `usagePercent` 欄位表示**剩餘**配額，因此 OpenClaw 會在顯示前反轉它們；存在以計數為基礎的欄位時會優先使用。
  - Coding Plan 的時間窗口標籤會在存在時來自供應商的小時/分鐘欄位，接著退回使用 `start_time` / `end_time` 跨度。
  - 如果 Coding Plan 端點傳回 `model_remains`，OpenClaw 會優先使用聊天模型項目，在明確的 `window_hours` / `window_minutes` 欄位缺失時從時間戳推導時間窗口標籤，並在方案標籤中包含模型名稱。
- **Xiaomi MiMo**：透過 env/config/auth store 使用 API 金鑰（`XIAOMI_API_KEY`）。
- **z.ai**：透過 env/config/auth store 使用 API 金鑰。

無法解析出可用的供應商用量驗證時，會隱藏用量。供應商可提供 Plugin 專用的用量驗證邏輯；否則 OpenClaw 會退回比對來自驗證設定檔、環境變數或設定中的 OAuth/API 金鑰認證。

## 相關

- [Token 用量與成本](/zh-TW/reference/token-use)
- [API 用量與成本](/zh-TW/reference/api-usage-costs)
- [提示快取](/zh-TW/reference/prompt-caching)

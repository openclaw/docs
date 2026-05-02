---
read_when:
    - 你正在串接提供者用量/配額介面
    - 您需要說明使用量追蹤行為或身分驗證要求
summary: 使用量追蹤介面與憑證需求
title: 使用量追蹤
x-i18n:
    generated_at: "2026-05-02T20:46:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4faa5daff55668a6be73981b730edece51939d99954e784907c99fb101fcaaa7
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## 它是什麼

- 直接從供應商的用量端點拉取供應商用量/配額。
- 沒有估算成本；只顯示供應商回報的時間窗。
- 人類可讀的狀態輸出會正規化為 `X% left`，即使上游 API 回報的是已耗用配額、剩餘配額，或只有原始計數。
- 工作階段層級的 `/status` 和 `session_status` 可在即時工作階段快照稀疏時，回退到最新的對話記錄用量項目。該回退會填補缺少的權杖/快取計數器，可復原作用中的執行階段模型標籤，並在工作階段中繼資料缺失或較小時，偏好較大的提示導向總計。現有的非零即時值仍會優先。

## 顯示位置

- 聊天中的 `/status`：含豐富表情符號的狀態卡，包含工作階段權杖 + 估算成本（僅 API 金鑰）。供應商用量會在可用時，針對**目前模型供應商**顯示為正規化的 `X% left` 時間窗。
- 聊天中的 `/usage off|tokens|full`：每次回應的用量頁尾（OAuth 僅顯示權杖）。
- 聊天中的 `/usage cost`：從 OpenClaw 工作階段記錄彙總的本機成本摘要。
- CLI：`openclaw status --usage` 會列印完整的各供應商明細。
- CLI：`openclaw channels list` 會在供應商設定旁列印相同的用量快照（使用 `--no-usage` 跳過）。
- macOS 選單列：Context 下的「用量」區段（僅在可用時）。

## 供應商 + 憑證

- **Anthropic (Claude)**：驗證設定檔中的 OAuth 權杖。
- **GitHub Copilot**：驗證設定檔中的 OAuth 權杖。
- **Gemini CLI**：驗證設定檔中的 OAuth 權杖。
  - JSON 用量會回退到 `stats`；`stats.cached` 會正規化為 `cacheRead`。
- **OpenAI Codex**：驗證設定檔中的 OAuth 權杖（存在時使用 accountId）。
- **MiniMax**：API 金鑰或 MiniMax OAuth 驗證設定檔。OpenClaw 會將 `minimax`、`minimax-cn` 和 `minimax-portal` 視為相同的 MiniMax 配額介面，存在時偏好已儲存的 MiniMax OAuth，否則回退到 `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY` 或 `MINIMAX_API_KEY`。
  用量輪詢會在已設定時，從 `models.providers.minimax-portal.baseUrl` 或 `models.providers.minimax.baseUrl` 推導 Coding Plan 主機，否則使用 MiniMax CN 主機。
  MiniMax 的原始 `usage_percent` / `usagePercent` 欄位表示**剩餘**配額，因此 OpenClaw 會在顯示前反轉它們；存在以計數為基礎的欄位時會優先使用。
  - Coding Plan 時間窗標籤在存在時來自供應商的小時/分鐘欄位，接著回退到 `start_time` / `end_time` 範圍。
  - 如果 Coding Plan 端點傳回 `model_remains`，OpenClaw 會偏好聊天模型項目，在明確的 `window_hours` / `window_minutes` 欄位缺席時從時間戳記推導時間窗標籤，並在方案標籤中包含模型名稱。
- **Xiaomi MiMo**：透過 env/config/auth store 的 API 金鑰（`XIAOMI_API_KEY`）。
- **z.ai**：透過 env/config/auth store 的 API 金鑰。

無法解析可用的供應商用量驗證時，會隱藏用量。供應商可以提供 Plugin 專屬的用量驗證邏輯；否則 OpenClaw 會回退到驗證設定檔、環境變數或設定中相符的 OAuth/API 金鑰憑證。

## 相關

- [權杖使用量與成本](/zh-TW/reference/token-use)
- [API 用量與成本](/zh-TW/reference/api-usage-costs)
- [提示快取](/zh-TW/reference/prompt-caching)

---
read_when:
    - 你正在串接提供者使用量／配額介面
    - 你需要說明使用情況追蹤行為或身分驗證要求
summary: 使用量追蹤介面與憑證需求
title: 使用情況追蹤
x-i18n:
    generated_at: "2026-04-30T03:03:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 21c2ae0c32d9f28b301abed22d6edcb423d46831cb1d78f4c2908df0ecf82854
    source_path: concepts/usage-tracking.md
    workflow: 16
---

## 它是什麼

- 直接從供應商的使用量端點拉取使用量/配額。
- 沒有預估成本；只顯示供應商回報的時間窗口。
- 人類可讀的狀態輸出會正規化為 `X% left`，即使上游 API 回報的是已消耗配額、剩餘配額，或只有原始計數。
- Session 層級的 `/status` 和 `session_status` 可在即時 Session 快照資料稀疏時，退回使用最新的 transcript 使用量項目。該退回機制會填補遺失的 token/cache 計數器，可復原作用中的 runtime 模型標籤，並在 Session 中繼資料遺失或較小時，偏好較大的 prompt 導向總量。現有的非零即時值仍會優先。

## 顯示位置

- 聊天中的 `/status`：包含 Session tokens + 預估成本（僅限 API key）的 emoji 豐富狀態卡。供應商使用量在可用時，會針對**目前模型供應商**顯示為正規化的 `X% left` 時間窗口。
- 聊天中的 `/usage off|tokens|full`：每次回應的使用量頁尾（OAuth 只顯示 tokens）。
- 聊天中的 `/usage cost`：從 OpenClaw Session logs 彙總的本機成本摘要。
- CLI：`openclaw status --usage` 會列印完整的逐供應商明細。
- CLI：`openclaw channels list` 會在供應商設定旁列印相同的使用量快照（使用 `--no-usage` 跳過）。
- macOS 選單列：Context 下的「使用量」區段（僅在可用時）。

## 供應商與憑證

- **Anthropic (Claude)**：auth profiles 中的 OAuth tokens。
- **GitHub Copilot**：auth profiles 中的 OAuth tokens。
- **Gemini CLI**：auth profiles 中的 OAuth tokens。
  - JSON 使用量會退回使用 `stats`；`stats.cached` 會正規化為 `cacheRead`。
- **OpenAI Codex**：auth profiles 中的 OAuth tokens（存在時使用 accountId）。
- **MiniMax**：API key 或 MiniMax OAuth auth profile。OpenClaw 會將 `minimax`、`minimax-cn` 和 `minimax-portal` 視為相同的 MiniMax 配額介面，存在時偏好儲存的 MiniMax OAuth，否則退回使用 `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY` 或 `MINIMAX_API_KEY`。MiniMax 的原始 `usage_percent` / `usagePercent` 欄位表示**剩餘**配額，因此 OpenClaw 會在顯示前反轉；存在以計數為基礎的欄位時，會以其為優先。
  - Coding-plan 時間窗口標籤會在存在時來自供應商的小時/分鐘欄位，接著退回使用 `start_time` / `end_time` 區間。
  - 如果 coding-plan 端點回傳 `model_remains`，OpenClaw 會偏好 chat-model 項目，在明確的 `window_hours` / `window_minutes` 欄位缺少時從時間戳推導時間窗口標籤，並在方案標籤中包含模型名稱。
- **Xiaomi MiMo**：透過 env/config/auth store 的 API key（`XIAOMI_API_KEY`）。
- **z.ai**：透過 env/config/auth store 的 API key。

無法解析可用的供應商使用量認證時，使用量會隱藏。供應商可以提供 Plugin 專屬的使用量認證邏輯；否則 OpenClaw 會退回比對 auth profiles、環境變數或 config 中的 OAuth/API-key 憑證。

## 相關內容

- [Token 使用量與成本](/zh-TW/reference/token-use)
- [API 使用量與成本](/zh-TW/reference/api-usage-costs)
- [Prompt caching](/zh-TW/reference/prompt-caching)

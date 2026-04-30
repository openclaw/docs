---
read_when:
    - 處理 Pi 整合程式碼或測試
    - 執行 Pi 專用的程式碼檢查、型別檢查和即時測試流程
summary: Pi 整合的開發者工作流程：建置、測試與即時驗證
title: Pi 開發工作流程
x-i18n:
    generated_at: "2026-04-30T03:18:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c4025c8ed1a4dff0d8116440fd48f375264eb4cac06f71afebf8c05f3470ab4
    source_path: pi-dev.md
    workflow: 16
---

在 OpenClaw 中開發 Pi 整合時可採用的合理工作流程。

## 型別檢查與 lint

- 預設本機驗證關卡：`pnpm check`
- 建置驗證關卡：當變更可能影響建置輸出、封裝，或延遲載入/模組邊界時執行 `pnpm build`
- Pi 相關大型變更的完整合併驗證關卡：`pnpm check && pnpm test`

## 執行 Pi 測試

直接使用 Vitest 執行以 Pi 為主的測試集：

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

若要包含即時提供者演練：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

這涵蓋主要的 Pi 單元測試套件：

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

## 手動測試

建議流程：

- 以開發模式執行 Gateway：
  - `pnpm gateway:dev`
- 直接觸發代理程式：
  - `pnpm openclaw agent --message "Hello" --thinking low`
- 使用 TUI 進行互動式偵錯：
  - `pnpm tui`

針對工具呼叫行為，提示進行 `read` 或 `exec` 動作，這樣你就能查看工具串流與 payload 處理。

## 從乾淨狀態重設

狀態位於 OpenClaw 狀態目錄下。預設為 `~/.openclaw`。如果已設定 `OPENCLAW_STATE_DIR`，請改用該目錄。

若要重設所有內容：

- `openclaw.json` 用於設定
- `agents/<agentId>/agent/auth-profiles.json` 用於模型驗證設定檔（API keys + OAuth）
- `credentials/` 用於仍存放在驗證設定檔儲存區之外的提供者/頻道狀態
- `agents/<agentId>/sessions/` 用於代理程式工作階段歷史
- `agents/<agentId>/sessions/sessions.json` 用於工作階段索引
- `sessions/` 如果存在舊版路徑
- `workspace/` 如果你想要空白工作區

如果你只想重設工作階段，請刪除該代理程式的 `agents/<agentId>/sessions/`。如果你想保留驗證，請保留 `agents/<agentId>/agent/auth-profiles.json`，以及 `credentials/` 下的任何提供者狀態。

## 參考資料

- [測試](/zh-TW/help/testing)
- [開始使用](/zh-TW/start/getting-started)

## 相關

- [Pi 整合架構](/zh-TW/pi)

---
read_when:
    - 正在處理 OpenClaw 代理程式執行階段程式碼或測試
    - 執行 agent-runtime lint、型別檢查和即時測試流程
summary: OpenClaw 代理執行階段的開發者工作流程：建置、測試與即時驗證
title: OpenClaw 代理程式執行階段工作流程
x-i18n:
    generated_at: "2026-06-27T19:30:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbe2a192ff7954577f8cbeae33676cbfd330f297d31c1917d2ab52898c2c5064
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

在 OpenClaw 中處理 OpenClaw 代理執行階段的合理工作流程。

## 型別檢查與 lint

- 預設本機關卡：`pnpm check`
- 建置關卡：當變更可能影響建置輸出、封裝，或延遲載入/模組邊界時執行 `pnpm build`
- 代理執行階段變更的完整落地關卡：`pnpm check && pnpm test`

## 執行代理執行階段測試

直接使用 Vitest 執行代理執行階段測試集：

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-tools*.test.ts" \
  "src/agents/agent-settings.test.ts" \
  "src/agents/agent-tool-definition-adapter*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

若要包含即時供應商練習：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/embedded-agent-runner-extraparams.live.test.ts
```

這涵蓋主要的代理執行階段單元測試套件：

- `src/agents/agent-*.test.ts`
- `src/agents/embedded-agent-*.test.ts`
- `src/agents/agent-tools*.test.ts`
- `src/agents/agent-settings.test.ts`
- `src/agents/agent-tool-definition-adapter.test.ts`
- `src/agents/agent-hooks/*.test.ts`

## 手動測試

建議流程：

- 以開發模式執行閘道：
  - `pnpm gateway:dev`
- 直接觸發代理：
  - `pnpm openclaw agent --message "Hello" --thinking low`
- 使用終端介面進行互動式除錯：
  - `pnpm tui`

若要測試工具呼叫行為，請提示 `read` 或 `exec` 動作，這樣就能看到工具串流與酬載處理。

## 全新重設

狀態位於 OpenClaw 狀態目錄下。預設為 `~/.openclaw`。如果已設定 `OPENCLAW_STATE_DIR`，請改用該目錄。

若要重設所有內容：

- `openclaw.json` 用於設定
- `agents/<agentId>/agent/auth-profiles.json` 用於模型驗證設定檔（API 金鑰 + OAuth）
- `credentials/` 用於仍位於驗證設定檔儲存區之外的供應商/通道狀態
- `agents/<agentId>/sessions/` 用於代理工作階段歷史記錄
- `agents/<agentId>/sessions/sessions.json` 用於工作階段索引
- `sessions/` 如果舊版路徑存在
- `workspace/` 如果你想要空白工作區

如果你只想重設工作階段，請刪除該代理的 `agents/<agentId>/sessions/`。如果你想保留驗證，請保留 `agents/<agentId>/agent/auth-profiles.json`，以及 `credentials/` 下的任何供應商狀態。

## 參考

- [測試](/zh-TW/help/testing)
- [入門](/zh-TW/start/getting-started)

## 相關

- [OpenClaw 代理執行階段架構](/zh-TW/agent-runtime-architecture)

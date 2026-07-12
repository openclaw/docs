---
read_when:
    - 處理 OpenClaw 代理程式執行階段程式碼或測試
    - 執行代理執行階段的 lint、型別檢查與即時測試流程
summary: OpenClaw 代理執行階段的開發者工作流程：建置、測試與即時驗證
title: OpenClaw 代理程式執行階段工作流程
x-i18n:
    generated_at: "2026-07-12T14:35:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 044f05779bef4ad18478081ba44d84356723c8a0be764440aa9d2b976d167324
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

OpenClaw 儲存庫中代理程式執行階段（`src/agents/`）的開發者工作流程。

## 型別檢查與程式碼檢查

- 預設本機關卡：`pnpm check`（型別檢查、程式碼檢查、政策防護）
- 建置關卡：當變更可能影響建置輸出、封裝或延遲載入／模組邊界時，執行 `pnpm build`
- 推送前完整關卡：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`

## 執行代理程式執行階段測試

執行代理程式執行階段的單元測試套件：

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

第一個 glob 模式也涵蓋 `agent-tools*`、`agent-settings` 和
`agent-tool-definition-adapter*` 測試套件。

即時測試不包含在單元測試設定中；請透過即時測試包裝程式執行
（會設定 `OPENCLAW_LIVE_TEST=1`，且需要供應商認證資訊）：

```bash
pnpm test:live src/agents/embedded-agent-runner-extraparams.live.test.ts
```

## 手動測試

- 以開發模式執行閘道（透過 `OPENCLAW_SKIP_CHANNELS=1` 略過頻道連線）：`pnpm gateway:dev`
- 透過閘道觸發一次代理程式回合：`pnpm openclaw agent --message "Hello" --thinking low`
- 使用終端介面進行互動式偵錯：`pnpm tui`

若要測試工具呼叫行為，請提示執行 `read` 或 `exec` 動作，以便觀察
工具串流與酬載處理。

## 重設為全新狀態

狀態儲存在 OpenClaw 狀態目錄中，預設為 `~/.openclaw`；若已設定，
則為 `$OPENCLAW_STATE_DIR`。以下路徑皆相對於該目錄：

| 路徑                                           | 內容                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `openclaw.json`                                | 設定                                                              |
| `state/openclaw.sqlite`                        | 共用執行階段狀態資料庫                                             |
| `agents/<agentId>/agent/openclaw-agent.sqlite` | 各代理程式的模型驗證設定檔（API 金鑰 + OAuth）與執行階段狀態        |
| `credentials/`                                 | 驗證設定檔儲存區以外的供應商／頻道認證資訊                          |
| `agents/<agentId>/sessions/`                   | 對話記錄歷程與舊版工作階段移轉來源                                  |
| `sessions/`                                    | 舊版單一代理程式工作階段儲存區（僅限舊安裝）                        |
| `workspace/`                                   | 預設代理程式工作區（額外代理程式使用 `workspace-<agentId>`）        |

刪除這些路徑即可完整重設。範圍較小的重設方式：

- 僅重設工作階段：請勿刪除 `agents/<agentId>/agent/openclaw-agent.sqlite`；工作階段資料列與其他各代理程式狀態一同儲存於其中。使用 `/new` 或 `/reset` 為單一聊天開始新的工作階段，並使用 `openclaw sessions cleanup` 維護工作階段。
- 保留驗證資訊：保留 `agents/<agentId>/agent/openclaw-agent.sqlite` 和 `credentials/`。

執行階段不再讀取舊版 `auth-profiles.json` 檔案；
`openclaw doctor --fix` 會將其匯入 SQLite 儲存區。

## 參考資料

- [測試](/zh-TW/help/testing)
- [開始使用](/zh-TW/start/getting-started)

## 相關內容

- [OpenClaw 代理程式執行階段架構](/zh-TW/agent-runtime-architecture)

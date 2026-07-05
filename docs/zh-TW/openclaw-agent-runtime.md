---
read_when:
    - 處理 OpenClaw 代理執行階段程式碼或測試
    - 執行 agent-runtime lint、型別檢查和即時測試流程
summary: OpenClaw 代理程式執行階段的開發者工作流程：建置、測試與即時驗證
title: OpenClaw 代理執行階段工作流程
x-i18n:
    generated_at: "2026-07-05T11:26:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e5150689bc102a372b65b1c9bf0a378c7ccb0578d38a750571887dcbe0650e8a
    source_path: openclaw-agent-runtime.md
    workflow: 16
---

OpenClaw 儲存庫中代理執行階段（`src/agents/`）的開發者工作流程。

## 型別檢查與 lint

- 預設本機閘門：`pnpm check`（型別檢查、lint、政策防護）
- 建置閘門：當變更可能影響建置輸出、封裝，或延遲載入/模組邊界時執行 `pnpm build`
- 完整推送前閘門：`pnpm build && pnpm check && pnpm check:test-types && pnpm test`

## 執行代理執行階段測試

執行代理執行階段單元套件：

```bash
pnpm test \
  "src/agents/agent-*.test.ts" \
  "src/agents/embedded-agent-*.test.ts" \
  "src/agents/agent-hooks/**/*.test.ts"
```

第一個 glob 也涵蓋 `agent-tools*`、`agent-settings` 和
`agent-tool-definition-adapter*` 套件。

即時測試已從單元設定中排除；請透過即時
包裝器執行它們（會設定 `OPENCLAW_LIVE_TEST=1`，且需要提供者憑證）：

```bash
pnpm test:live src/agents/embedded-agent-runner-extraparams.live.test.ts
```

## 手動測試

- 以開發模式執行閘道（透過 `OPENCLAW_SKIP_CHANNELS=1` 跳過頻道連線）：`pnpm gateway:dev`
- 透過閘道觸發一次代理回合：`pnpm openclaw agent --message "Hello" --thinking low`
- 使用終端介面進行互動式除錯：`pnpm tui`

針對工具呼叫行為，提示進行 `read` 或 `exec` 動作，這樣你就能觀察
工具串流與酬載處理。

## 乾淨狀態重設

狀態位於 OpenClaw 狀態目錄：預設為 `~/.openclaw`，或在設定時使用
`$OPENCLAW_STATE_DIR`。相對於該目錄的路徑：

| 路徑                                           | 保存內容                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `openclaw.json`                                | 設定                                                               |
| `state/openclaw.sqlite`                        | 共享執行階段狀態資料庫                                             |
| `agents/<agentId>/agent/openclaw-agent.sqlite` | 每個代理的模型驗證設定檔（API 金鑰 + OAuth）與執行階段狀態         |
| `credentials/`                                 | 驗證設定檔儲存區以外的提供者/頻道憑證                              |
| `agents/<agentId>/sessions/`                   | 工作階段逐字稿以及 `sessions.json` 索引                            |
| `sessions/`                                    | 舊版單一代理工作階段儲存區（僅舊安裝）                             |
| `workspace/`                                   | 預設代理工作區（額外代理使用 `workspace-<agentId>`）                |

刪除這些路徑可完整重設。較小範圍的重設：

- 僅工作階段：刪除該代理的 `agents/<agentId>/sessions/`。
- 保留驗證：保留 `agents/<agentId>/agent/openclaw-agent.sqlite` 和 `credentials/`。

舊版 `auth-profiles.json` 檔案不再於執行階段讀取；
`openclaw doctor --fix` 會將它們匯入 SQLite 儲存區。

## 參考資料

- [測試](/zh-TW/help/testing)
- [開始使用](/zh-TW/start/getting-started)

## 相關

- [OpenClaw 代理執行階段架構](/zh-TW/agent-runtime-architecture)

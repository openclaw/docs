---
summary: OpenClaw 如何建構內建代理程式執行階段：程式碼配置、邊界、資源資訊清單與執行階段選擇。
title: 代理程式執行階段架構
x-i18n:
    generated_at: "2026-07-05T11:00:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3dfae2f4770af5c14daa86ab39595598772af833dee4b03090d27b95eb17efdd
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw 擁有內建代理程式執行階段。執行階段程式碼位於 `src/agents/` 下，模型/提供者傳輸位於 `src/llm/` 下，而面向外掛的合約則透過 `openclaw/plugin-sdk/*` barrels 公開。

## 執行階段配置

| 路徑                                | 擁有                                                                                                                                                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/agents/embedded-agent-runner/` | 內建嘗試迴圈（`run.ts`、`run/`）、模型選擇與提供者正規化（`model*.ts`）、各提供者請求參數（`extra-params.*`）、壓縮、轉錄與工作階段接線。                            |
| `src/agents/sessions/`              | 工作階段持久化（`session-manager.ts`）、資源探索（`package-manager.ts`、`resource-loader.ts`）、工作階段內 `extensions` 載入、提示詞範本、Skills、主題，以及由終端介面支援的工具轉譯器（`tools/`）。 |
| `packages/agent-core/`              | 可重用的代理程式核心（`@openclaw/agent-core`）：代理程式迴圈、harness 型別、訊息、壓縮輔助工具、提示詞範本、Skills，以及工作階段儲存合約。                                                           |
| `src/agents/runtime/`               | OpenClaw facade，將 `@openclaw/agent-core` 接到外掛 SDK LLM 執行階段，並重新匯出它以及本機 proxy 公用工具。                                                                                             |
| `src/agents/agent-tools*.ts`        | OpenClaw 擁有的工具定義、參數 schema、工具政策、工具呼叫前/後 adapter，以及主機/sandbox 編輯工具。                                                                                            |
| `src/agents/agent-hooks/`           | 內建執行階段 hooks：壓縮 safeguard、壓縮指示、情境 pruning。                                                                                                                                   |
| `src/agents/harness/`               | 內建與外掛註冊 harness 的 harness registry、選擇政策與生命週期。                                                                                                                       |
| `src/llm/`                          | 模型/提供者 registry、傳輸輔助工具，以及提供者特定的 stream 實作（`src/llm/providers/`）。                                                                                                          |

## 邊界

核心透過 OpenClaw 模組與 SDK barrels 呼叫內建執行階段；不再保留外部代理程式框架套件。外掛使用已文件化的 `openclaw/plugin-sdk/*` 進入點，且不匯入 `src/**` 內部項目。

`@earendil-works/pi-tui` 仍是第三方相依套件：供本機終端介面與工作階段工具轉譯器使用的終端元件工具包。將它內部化會是一項獨立的 vendoring 工作。

## Manifests

資源套件在 `package.json` metadata 中宣告 OpenClaw 資源。項目是相對於套件根目錄的檔案路徑或 globs：

```json
{
  "openclaw": {
    "extensions": ["extensions/index.ts"],
    "skills": ["skills/*.md"],
    "prompts": ["prompts/*.md"],
    "themes": ["themes/*.json"]
  }
}
```

manifest 中未列出的資源型別，會退回探索傳統的 `extensions/`、`skills/`、`prompts/` 與 `themes/` 目錄。

## 執行階段選擇

- 內建執行階段 id 是 `openclaw`。舊版 alias `pi` 會正規化為 `openclaw`；`codex-app-server` 會正規化為 `codex`。
- 外掛 harness 會註冊其他執行階段 id（例如 `codex`）。
- 執行階段政策是以模型/提供者為範圍的 `agentRuntime.id` config（模型項目優先於提供者項目）。未設定或 `default` 會解析為 `auto`。
- `auto` 會選擇支援該提供者/模型的已註冊外掛 harness，否則使用內建 OpenClaw 執行階段。
- 官方 API endpoint 上的 `openai` 提供者預設使用 `codex` harness；自訂 `baseUrl` 值會保留其已設定的行為。

## 相關

- [OpenClaw 代理程式執行階段工作流程](/zh-TW/openclaw-agent-runtime)
- [代理程式執行階段](/zh-TW/concepts/agent-runtimes)

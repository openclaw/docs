---
summary: OpenClaw 如何組織內建的代理程式執行階段：程式碼配置、邊界、資源資訊清單與執行階段選擇。
title: 代理程式執行階段架構
x-i18n:
    generated_at: "2026-07-12T14:17:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 071a0cb076230ce02f2c2c1c21971379cf617f24faa8a9733570aae30a062019
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw 擁有內建的代理程式執行階段。執行階段程式碼位於 `src/agents/`，模型／供應商傳輸位於 `src/llm/`，面向外掛的合約則透過 `openclaw/plugin-sdk/*` 彙整入口公開。

## 執行階段配置

| 路徑                                | 負責範圍                                                                                                                                                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/agents/embedded-agent-runner/` | 內建嘗試迴圈（`run.ts`、`run/`）、模型選擇與供應商正規化（`model*.ts`）、各供應商的請求參數（`extra-params.*`）、壓縮、逐字稿及工作階段串接。                            |
| `src/agents/sessions/`              | 工作階段持久化（`session-manager.ts`）、資源探索（`package-manager.ts`、`resource-loader.ts`）、工作階段內的 `extensions` 載入、提示詞範本、Skills、主題，以及由終端介面支援的工具算繪器（`tools/`）。 |
| `packages/agent-core/`              | 可重複使用的代理程式核心（`@openclaw/agent-core`）：代理程式迴圈、控管架構型別、訊息、壓縮輔助工具、提示詞範本、Skills，以及工作階段儲存合約。                                                           |
| `src/agents/runtime/`               | OpenClaw 門面層，將 `@openclaw/agent-core` 串接至外掛 SDK 的 LLM 執行階段，並重新匯出該執行階段及本機代理工具。                                                                                             |
| `src/agents/agent-tools*.ts`        | OpenClaw 擁有的工具定義、參數結構描述、工具政策、工具呼叫前後的配接器，以及主機／沙箱編輯工具。                                                                                            |
| `src/agents/agent-hooks/`           | 內建執行階段掛鉤：壓縮防護、壓縮指示、內容剪枝。                                                                                                                                   |
| `src/agents/harness/`               | 內建與外掛註冊控管架構的登錄、選擇政策及生命週期。                                                                                                                       |
| `src/llm/`                          | 模型／供應商登錄、傳輸輔助工具，以及供應商特定的串流實作（`src/llm/providers/`）。                                                                                                          |

## 邊界

核心透過 OpenClaw 模組與 SDK 彙整入口呼叫內建執行階段；不再保留任何外部代理程式框架套件。外掛使用有文件記載的 `openclaw/plugin-sdk/*` 進入點，且不匯入 `src/**` 內部項目。

`@earendil-works/pi-tui` 仍是第三方相依套件：這是一套供本機終端介面與工作階段工具算繪器使用的終端元件工具組。若要將其內部化，需另行進行程式碼內嵌維護工作。

## 資訊清單

資源套件會在 `package.json` 中繼資料宣告 OpenClaw 資源。項目是相對於套件根目錄的檔案路徑或萬用字元模式：

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

資訊清單未列出的資源類型，會改以探索慣例的 `extensions/`、`skills/`、`prompts/` 及 `themes/` 目錄作為後備方式。

## 執行階段選擇

- 內建執行階段 ID 為 `openclaw`。舊版別名 `pi` 會正規化為 `openclaw`；`codex-app-server` 會正規化為 `codex`。
- 外掛控管架構會註冊其他執行階段 ID（例如 `codex`）。
- 執行階段政策是以模型／供應商為範圍的 `agentRuntime.id` 設定（模型項目優先於供應商項目）。未設定或設為 `default` 時會解析為 `auto`。
- `auto` 會選擇支援有效供應商路由的已註冊外掛控管架構，否則使用內建 OpenClaw 執行階段。僅憑供應商或模型前綴絕不會選擇控管架構。
- 只有在使用完全相符的官方 HTTPS Platform Responses 或 ChatGPT Responses 路由，且沒有自行指定的請求覆寫時，OpenAI 才可能隱含選擇 `codex`。Completions 配接器、自訂端點，以及具有自行指定請求行為的路由仍使用 `openclaw`；純文字的官方 HTTP 端點會遭拒絕。請參閱 [OpenAI 隱含代理程式執行階段](/zh-TW/providers/openai#implicit-agent-runtime)。

## 相關內容

- [OpenClaw 代理程式執行階段工作流程](/zh-TW/openclaw-agent-runtime)
- [代理程式執行階段](/zh-TW/concepts/agent-runtimes)

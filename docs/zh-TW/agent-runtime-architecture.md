---
summary: OpenClaw 如何建構內建代理程式執行階段：程式碼配置、邊界、資源資訊清單與執行階段選擇。
title: 代理程式執行階段架構
x-i18n:
    generated_at: "2026-07-19T13:34:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3e09ff21b4369a7c102db51e4458ad3ba1e86c9fe43a3a8bff72eef1713d2d51
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw 擁有內建的代理執行階段。執行階段程式碼位於 `src/agents/`，模型／供應商傳輸位於 `src/llm/`，而面向外掛的合約則透過 `openclaw/plugin-sdk/*` barrel 公開。

## 執行階段配置

| 路徑                                | 負責範圍                                                                                                                                                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/agents/embedded-agent-runner/` | 內建嘗試迴圈（`run.ts`、`run/`）、模型選擇與供應商正規化（`model*.ts`）、各供應商的請求參數（`extra-params.*`）、壓縮、逐字稿與工作階段串接。                            |
| `src/agents/sessions/`              | 工作階段持久化（`session-manager.ts`）、資源探索（`package-manager.ts`、`resource-loader.ts`）、工作階段內的 `extensions` 載入、提示詞範本、Skills、主題，以及由終端介面支援的工具轉譯器（`tools/`）。 |
| `packages/agent-core/`              | 可重複使用的代理核心（`@openclaw/agent-core`）：代理迴圈、控管框架型別、訊息、壓縮輔助工具、提示詞範本、Skills，以及工作階段儲存合約。                                                           |
| `src/agents/runtime/`               | 將 `@openclaw/agent-core` 串接至外掛 SDK LLM 執行階段的 OpenClaw 外觀介面，並重新匯出該執行階段與本機 Proxy 公用工具。                                                                                             |
| `src/agents/agent-tools*.ts`        | OpenClaw 所擁有的工具定義、參數結構描述、工具政策、工具呼叫前後的轉接器，以及主機／沙箱編輯工具。                                                                                            |
| `src/agents/agent-hooks/`           | 內建執行階段掛鉤：壓縮防護、壓縮指示、情境修剪。                                                                                                                                   |
| `src/agents/harness/`               | 內建及由外掛註冊之控管框架的登錄檔、選擇政策與生命週期。                                                                                                                       |
| `src/llm/`                          | 模型／供應商登錄檔、傳輸輔助工具，以及供應商專屬的串流實作（`src/llm/providers/`）。                                                                                                          |

## 邊界

核心透過 OpenClaw 模組與 SDK barrel 呼叫內建執行階段；不再保留任何外部代理框架套件。外掛使用已有文件說明的 `openclaw/plugin-sdk/*` 進入點，且不匯入 `src/**` 內部實作。

`@earendil-works/pi-tui` 仍是第三方相依套件：本機終端介面與工作階段工具轉譯器所使用的終端元件工具組。若要將其內部化，會是另一項獨立的內嵌相依套件工作。

## 資訊清單

資源套件會在 `package.json` 中繼資料內宣告 OpenClaw 資源。項目是相對於套件根目錄的檔案路徑或 Glob 模式：

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

未列於資訊清單中的資源類型，會退回探索慣例的 `extensions/`、`skills/`、`prompts/` 與 `themes/` 目錄。

## 執行階段選擇

- 內建執行階段 ID 為 `openclaw`。舊版別名 `pi` 會正規化為 `openclaw`；`codex-app-server` 會正規化為 `codex`。
- 外掛控管框架會註冊其他執行階段 ID（例如 `codex`）。
- 執行階段政策是模型／供應商範圍的 `agentRuntime.id` 設定（模型項目優先於供應商項目）。未設定或設為 `default` 時，會解析為 `auto`。
- `auto` 會選擇支援有效供應商路由的已註冊外掛控管框架，否則使用內建 OpenClaw 執行階段。僅有供應商或模型前置詞絕不會選取控管框架。
- 僅當路由完全符合官方 HTTPS Platform Responses 或 ChatGPT Responses，且沒有自行撰寫的請求覆寫時，OpenAI 才可隱含選擇 `codex`。Completions 轉接器、自訂端點，以及含有自行撰寫之請求行為的路由，仍會使用 `openclaw`；官方的純文字 HTTP 端點會遭拒絕。請參閱 [OpenAI 隱含代理執行階段](/zh-TW/providers/openai#implicit-agent-runtime)。

## 模型執行階段世代

閘道啟動與設定、外掛或驗證發布作業，會為每個已設定的代理建置一個備妥的模型執行階段世代。每個世代會將探索到的驗證範本、模型登錄檔和投影後的模型目錄，作為單一不可分割的快照來擁有。代理執行作業會從該快照分叉出可變的驗證與登錄檔儲存區；瀏覽、狀態、排程、doctor、終端介面、PDF 與影像路徑會讀取已發布的目錄，而不會重複進行檔案系統探索。

獨立的嵌入式執行階段會在其啟用邊界發布相同形狀的快照。失敗或過時的世代絕不會與較新的不完整世代一同提供；生命週期擁有者必須先發布完整的替代世代。

## 相關內容

- [OpenClaw 代理執行階段工作流程](/zh-TW/openclaw-agent-runtime)
- [代理執行階段](/zh-TW/concepts/agent-runtimes)

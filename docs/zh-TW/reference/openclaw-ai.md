---
read_when:
    - 你想在其他應用程式中重複使用 OpenClaw 的模型傳輸層
    - 您正在變更 `packages/ai` 或 AI 傳輸主機連接埠
    - 你正在檢視 OpenClaw 發行版本除了根套件之外還會發佈哪些內容到 npm
summary: '@openclaw/ai npm 套件：可重複使用的模型傳輸、隔離執行環境與主機政策介面'
title: '@openclaw/ai 套件'
x-i18n:
    generated_at: "2026-07-11T21:46:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 610057caae0a9bbf9f74074cda75fc40c0b9aa9d3441f8263151f08f1a3f35a8
    source_path: reference/openclaw-ai.md
    workflow: 16
---

`@openclaw/ai` 是 OpenClaw 模型執行層可發布的函式庫形式：提供與供應商無關的訊息／工具／串流合約、驗證、診斷、事件串流、隔離的執行階段登錄檔，以及八種內建 API 系列（Anthropic Messages、OpenAI Completions、OpenAI Responses、Azure OpenAI Responses、ChatGPT/Codex Responses、Google Generative AI、Google Vertex、Mistral Conversations）的延遲載入轉接器。

每次發布時，它都會與根層級的 `openclaw` 套件一同發布，並鎖定為相同版本；它也有自己的 `npm-shrinkwrap.json`，因此其遞移相依性樹會在安裝時鎖定。安裝 `openclaw` 時，會自動安裝相符的 `@openclaw/ai`；函式庫使用者則可直接將其列為相依套件，無須使用任何 OpenClaw 應用程式碼。

## 快速開始

```js
import { createLlmRuntime } from "@openclaw/ai";
import { registerBuiltInApiProviders } from "@openclaw/ai/providers";

const runtime = createLlmRuntime();
registerBuiltInApiProviders(runtime.registry);

const stream = runtime.streamSimple(model, { messages }, { apiKey });
for await (const event of stream) {
  if (event.type === "text_delta") process.stdout.write(event.delta);
}
const result = await stream.result();
```

可執行的版本位於儲存庫中的 `examples/ai-chat`。

## 設計合約

- **預設以執行個體為範圍。** 匯入此套件不會在全域登錄任何內容。`createApiRegistry()`／`createLlmRuntime()` 會傳回隔離的執行個體；`registerBuiltInApiProviders(registry)` 可選擇讓某個登錄檔啟用內建傳輸。供應商 SDK 模組會在首次使用時延遲載入。
- **主機政策由外部注入，而非內建於套件。** 請求擷取防護（例如 SSRF 政策）、工具結果重播文字的機密資訊遮蔽、OpenAI 嚴格工具預設值，以及診斷記錄，都是透過 `configureAiTransportHost` 設定的 `AiTransportHost` 連接埠。函式庫的預設實作不會主動執行任何操作；OpenClaw 會在其串流外觀層安裝實際實作。
- **統一的事件串流識別。** `@openclaw/ai/event-stream` 是由 OpenClaw 核心、代理程式核心及外部使用者共用的標準 `EventStream` 建構函式。
- **`internal/*` 子路徑不屬於 API。** 它們僅供 OpenClaw 應用程式本身使用，且不提供語意化版本相容性保證。
- 供應商 ID、憑證、模型目錄、重試及容錯移轉仍屬於應用程式層面的考量。OpenClaw 會在此套件外圍疊加這些功能；函式庫使用者則直接提供 `Model` 物件和選項。

## 子路徑匯出

| 子路徑           | 內容                                                                           |
| ---------------- | ------------------------------------------------------------------------------ |
| `.`              | 合約、`createApiRegistry`、`createLlmRuntime`、`configureAiTransportHost`       |
| `./providers`    | `registerBuiltInApiProviders`、`resetApiProviders`                             |
| `./types`        | 模型／訊息／工具／串流型別                                                     |
| `./validation`   | 工具引數驗證                                                                   |
| `./diagnostics`  | 診斷合約                                                                       |
| `./event-stream` | 共用的 `EventStream` 實作                                                      |
| `./internal/*`   | OpenClaw 內部使用，不提供語意化版本相容性保證                                  |

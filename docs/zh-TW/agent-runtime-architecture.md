---
summary: OpenClaw 如何執行內建代理執行階段、提供者、工作階段、工具與擴充功能。
title: 代理執行階段架構
x-i18n:
    generated_at: "2026-06-27T18:53:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd0ca61b10a4f7029590da8566b22cc44cf801af162e5f2c00c9561fe46e39e3
    source_path: agent-runtime-architecture.md
    workflow: 16
---

OpenClaw 直接擁有內建代理程式執行階段。執行階段程式碼位於 `src/agents/` 下，模型/提供者輔助工具位於 `src/llm/` 下，面向外掛的合約則透過 `openclaw/plugin-sdk/*` barrel 匯出入口公開。

## 執行階段配置

- `src/agents/embedded-agent-runner/`：內建代理程式嘗試迴圈、提供者串流配接器、壓縮、模型選擇，以及工作階段接線。
- `src/agents/sessions/`：工作階段持久化、擴充功能載入、資源探索、Skills、提示、主題，以及由終端介面支援的工具呈現器。
- `packages/agent-core/`：可重用的代理程式核心、較底層的執行框架型別、訊息、壓縮輔助工具、提示範本，以及工具/工作階段合約。
- `src/agents/runtime/`：供 `@openclaw/agent-core` 使用的 OpenClaw facade，加上本機 proxy 工具。
- `src/agents/agent-tools*.ts`：OpenClaw 擁有的工具定義、schema、政策、before/after hook 配接器，以及主機編輯支援。
- `src/agents/agent-hooks/`：內建執行階段 hook，例如壓縮防護措施與內容剪裁。
- `src/llm/`：模型/提供者登錄、傳輸輔助工具，以及特定提供者的串流實作。

## 邊界

核心程式碼透過 OpenClaw 模組和 SDK barrel 匯出入口呼叫內建執行階段，而不是透過舊的外部代理程式套件。外掛使用已文件化的 `openclaw/plugin-sdk/*` 進入點，且不匯入 `src/**` 內部項目。

`@earendil-works/pi-tui` 仍是第三方終端介面相依套件。本機終端介面和工作階段呈現器將它作為終端元件工具組使用；將其內部化會是另一項 vendoring 工作。

## 清單

資源套件在套件中繼資料中宣告 OpenClaw 資源：

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

套件管理器也會探索慣例的 `extensions/`、`skills/`、`prompts/` 和 `themes/` 目錄。

## 執行階段選擇

預設的內建執行階段 ID 是 `openclaw`。外掛執行框架可以註冊其他執行階段 ID。`auto` 會在存在支援的外掛執行框架時選取它，否則使用內建 OpenClaw 執行階段。

## 相關內容

- [OpenClaw 代理程式執行階段工作流程](/zh-TW/openclaw-agent-runtime)
- [代理程式執行階段](/zh-TW/concepts/agent-runtimes)

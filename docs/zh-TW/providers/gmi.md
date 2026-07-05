---
read_when:
    - 你想要使用 GMI Cloud 模型執行 OpenClaw
    - 你需要 GMI 提供者 ID、金鑰或端點
summary: 搭配 OpenClaw 使用 GMI Cloud 的 OpenAI 相容 API
title: GMI Cloud
x-i18n:
    generated_at: "2026-07-05T11:41:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a21fd2a997f44e1f78d97a0fba24ca2bbc00dd193323da712d650ed4ba105355
    source_path: providers/gmi.md
    workflow: 16
---

GMI Cloud 是一個託管推論平台，透過 OpenAI 相容 API 提供前沿與開放權重模型。在 OpenClaw 中，它是官方外部供應商外掛：安裝一次，透過一般模型驗證儲存憑證，然後使用像 `gmi/google/gemini-3.1-flash-lite` 這樣的模型參照。

當你想用一組 API 金鑰存取多個託管模型家族時，請使用 GMI，包括 GMI 目錄公開的 Anthropic、DeepSeek、Google、Moonshot、OpenAI 和 Z.AI 路由。它適合作為模型備援的次要供應商、用來比較不同廠商的託管路由，或在 GMI 比主要供應商更早提供某個模型時使用。OpenClaw 擁有供應商 id、驗證設定檔、別名、模型目錄種子和基底 URL；GMI 擁有即時模型可用性、計費、速率限制，以及任何供應商端路由政策。

| 屬性          | 值                                       |
| ------------- | ---------------------------------------- |
| 供應商 id     | `gmi`（別名：`gmi-cloud`、`gmicloud`）   |
| 套件          | `@openclaw/gmi-provider`                 |
| 驗證環境變數  | `GMI_API_KEY`                            |
| API           | OpenAI 相容（`openai-completions`）      |
| 基底 URL      | `https://api.gmi-serving.com/v1`         |
| 預設模型      | `gmi/google/gemini-3.1-flash-lite`       |

## 設定

安裝外掛、重新啟動閘道，然後在 GMI Cloud 建立 API 金鑰（`https://www.gmicloud.ai/`）：

```bash
openclaw plugins install @openclaw/gmi-provider
openclaw gateway restart
```

接著執行：

```bash
openclaw onboard --auth-choice gmi-api-key
```

非互動式設定可以傳入 `--gmi-api-key <key>`，或設定：

```bash
export GMI_API_KEY="<your-gmi-api-key>" # pragma: allowlist secret
```

## 何時選擇 GMI

- 你想要託管的 OpenAI 相容端點，而不是本機模型伺服器。
- 你想透過一個供應商帳戶試用多個商用與開放權重模型家族。
- 你想要與 DeepInfra、OpenRouter、Together 或直接廠商 API 有不同上游路由的備援供應商。
- 你需要 GMI 專屬模型 id、定價或帳戶控制。

當你需要 GMI 未透過其 OpenAI 相容路由公開的廠商原生功能時，請改選直接廠商供應商。當資料位置或本機 GPU 控制比託管便利性更重要時，請選擇 LM Studio、Ollama、SGLang 或 vLLM 等本機供應商。

## 模型

外掛目錄會種入常見可用的 GMI Cloud 路由 id：

| 模型參照                           | 輸入         | 上下文    | 最大輸出 |
| ---------------------------------- | ------------ | --------- | -------- |
| `gmi/anthropic/claude-sonnet-4.6`  | 文字 + 圖像  | 200,000   | 64,000   |
| `gmi/deepseek-ai/DeepSeek-V3.2`    | 文字         | 163,840   | 65,536   |
| `gmi/google/gemini-3.1-flash-lite` | 文字 + 圖像  | 1,048,576 | 65,536   |
| `gmi/moonshotai/Kimi-K2.5`         | 文字 + 圖像  | 262,144   | 65,536   |
| `gmi/openai/gpt-5.4`               | 文字 + 圖像  | 400,000   | 128,000  |
| `gmi/zai-org/GLM-5.1-FP8`          | 文字         | 202,752   | 65,536   |

此目錄是一個種子，並不保證每個帳戶都能在任何時候呼叫每個模型。列出已設定供應商在你的環境中回報的內容：

```bash
openclaw models list --provider gmi
```

## 疑難排解

- `401` 或 `403`：檢查執行 OpenClaw 的程序是否已設定 `GMI_API_KEY`，或重新執行入門設定，將金鑰儲存在供應商驗證設定檔中。
- 未知模型錯誤：確認該模型存在於你的 GMI 帳戶中，並使用 `openclaw models list --provider gmi` 顯示的完整 `gmi/<route-id>` 參照。
- 間歇性供應商錯誤：嘗試不同的 GMI 路由，或將 GMI 設定為備援，而不是唯一的主要模型供應商。

## 相關

- [模型供應商](/zh-TW/concepts/model-providers)
- [所有供應商](/zh-TW/providers/index)

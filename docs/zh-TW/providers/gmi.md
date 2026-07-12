---
read_when:
    - 您想要使用 GMI Cloud 模型執行 OpenClaw
    - 你需要 GMI 提供者 ID、金鑰或端點
summary: 搭配 OpenClaw 使用 GMI Cloud 的 OpenAI 相容 API
title: GMI Cloud
x-i18n:
    generated_at: "2026-07-11T21:42:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a21fd2a997f44e1f78d97a0fba24ca2bbc00dd193323da712d650ed4ba105355
    source_path: providers/gmi.md
    workflow: 16
---

GMI Cloud 是一個託管式推論平台，透過 OpenAI 相容 API 提供前沿模型與開放權重模型。在 OpenClaw 中，它是官方的外部供應商外掛：安裝一次、透過一般模型驗證儲存憑證，並使用如 `gmi/google/gemini-3.1-flash-lite` 的模型參照。

若您想使用一組 API 金鑰存取多個託管模型系列，可選用 GMI，包括其目錄所提供的 Anthropic、DeepSeek、Google、Moonshot、OpenAI 與 Z.AI 路由。它可作為模型備援的次要供應商、用於比較不同廠商的託管路由，或在 GMI 比主要供應商更早提供某個模型時使用。OpenClaw 負責供應商識別碼、驗證設定檔、別名、模型目錄種子資料與基礎 URL；GMI 則負責即時模型可用性、計費、速率限制，以及任何供應商端的路由政策。

| 屬性          | 值                                       |
| ------------- | ---------------------------------------- |
| 供應商識別碼  | `gmi`（別名：`gmi-cloud`、`gmicloud`）  |
| 套件          | `@openclaw/gmi-provider`                 |
| 驗證環境變數  | `GMI_API_KEY`                            |
| API           | OpenAI 相容（`openai-completions`）      |
| 基礎 URL      | `https://api.gmi-serving.com/v1`         |
| 預設模型      | `gmi/google/gemini-3.1-flash-lite`       |

## 設定

安裝外掛、重新啟動閘道，然後在 GMI Cloud（`https://www.gmicloud.ai/`）建立 API 金鑰：

```bash
openclaw plugins install @openclaw/gmi-provider
openclaw gateway restart
```

接著執行：

```bash
openclaw onboard --auth-choice gmi-api-key
```

非互動式設定可傳入 `--gmi-api-key <key>`，或設定：

```bash
export GMI_API_KEY="<your-gmi-api-key>" # pragma: allowlist secret
```

## 適合選用 GMI 的情況

- 您想使用託管式 OpenAI 相容端點，而非本機模型伺服器。
- 您想透過單一供應商帳戶試用多個商業與開放權重模型系列。
- 您想使用與 DeepInfra、OpenRouter、Together 或廠商直接 API 採用不同上游路由的備援供應商。
- 您需要 GMI 特有的模型識別碼、定價或帳戶控制功能。

若您需要 GMI 未透過其 OpenAI 相容路由提供的廠商原生功能，請改選廠商的直接供應商。若資料在地性或本機 GPU 控制比託管服務的便利性更重要，請選用 LM Studio、Ollama、SGLang 或 vLLM 等本機供應商。

## 模型

此外掛目錄預先提供常見的 GMI Cloud 路由識別碼：

| 模型參照                           | 輸入         | 上下文    | 最大輸出 |
| ---------------------------------- | ------------ | --------- | -------- |
| `gmi/anthropic/claude-sonnet-4.6`  | 文字 + 圖片  | 200,000   | 64,000   |
| `gmi/deepseek-ai/DeepSeek-V3.2`    | 文字         | 163,840   | 65,536   |
| `gmi/google/gemini-3.1-flash-lite` | 文字 + 圖片  | 1,048,576 | 65,536   |
| `gmi/moonshotai/Kimi-K2.5`         | 文字 + 圖片  | 262,144   | 65,536   |
| `gmi/openai/gpt-5.4`               | 文字 + 圖片  | 400,000   | 128,000  |
| `gmi/zai-org/GLM-5.1-FP8`          | 文字         | 202,752   | 65,536   |

此目錄是種子資料，並不保證每個帳戶隨時都能呼叫所有模型。列出已設定供應商在您環境中回報的模型：

```bash
openclaw models list --provider gmi
```

## 疑難排解

- `401` 或 `403`：檢查執行 OpenClaw 的程序是否已設定 `GMI_API_KEY`，或重新執行初始設定，將金鑰儲存在供應商驗證設定檔中。
- 未知模型錯誤：確認該模型存在於您的 GMI 帳戶中，並使用 `openclaw models list --provider gmi` 所顯示的完整 `gmi/<route-id>` 參照。
- 間歇性供應商錯誤：嘗試不同的 GMI 路由，或將 GMI 設定為備援，而非唯一的主要模型供應商。

## 相關內容

- [模型供應商](/zh-TW/concepts/model-providers)
- [所有供應商](/zh-TW/providers/index)

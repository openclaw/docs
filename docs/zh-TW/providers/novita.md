---
read_when:
    - 您想要使用 NovitaAI 模型執行 OpenClaw
    - 你需要 Novita 提供者 ID、金鑰或端點
summary: 使用 NovitaAI 的 OpenAI 相容 API 搭配 OpenClaw
title: NovitaAI
x-i18n:
    generated_at: "2026-07-05T11:42:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83e0e43e68d85d73e790023858a49f971b683129dbbdf6092fbd8bba4d8da331
    source_path: providers/novita.md
    workflow: 16
---

NovitaAI 是託管式 AI 基礎架構供應商，提供與 OpenAI 相容的 API。
它以 bundled OpenClaw 供應商形式出貨（不需要另外安裝外掛），因此
憑證會走一般模型驗證流程，模型參照看起來像
`novita/deepseek/deepseek-v3-0324`。

## 設定

在 [novita.ai/settings/key-management](https://novita.ai/settings/key-management) 建立 API 金鑰，然後執行：

```bash
openclaw onboard --auth-choice novita-api-key
```

或設定：

```bash
export NOVITA_API_KEY="<your-novita-api-key>" # pragma: allowlist secret
```

## 預設值

| 設定          | 值                                 |
| ------------- | ---------------------------------- |
| 供應商 id     | `novita`                           |
| 別名          | `novita-ai`, `novitaai`            |
| 基底 URL      | `https://api.novita.ai/openai/v1`  |
| 環境變數      | `NOVITA_API_KEY`                   |
| 預設模型      | `novita/deepseek/deepseek-v3-0324` |

## 內建模型目錄

- `novita/moonshotai/kimi-k2.5`
- `novita/minimax/minimax-m2.7`
- `novita/zai-org/glm-5`
- `novita/deepseek/deepseek-v3-0324`
- `novita/deepseek/deepseek-r1-0528`
- `novita/qwen/qwen3-235b-a22b-fp8`

這是起點，不是即時目錄。你的帳號、區域，或
Novita 目前提供的項目可能新增、移除或限制路由。設定長期預設值前請先檢查：

```bash
openclaw models list --provider novita
```

## 何時選擇 Novita

- 透過與 OpenAI 相容的 API 存取託管式開放權重模型。
- 透過單一供應商帳號使用 DeepSeek、Kimi、MiniMax、GLM 或 Qwen 系列路由。
- 在 DeepInfra、GMI、OpenRouter 或直接供應商 API 之外，另一條託管式備援路徑。
- 使用供應商端模型託管，而不是維護 LM Studio、Ollama、SGLang 或 vLLM 基礎架構。

當你需要供應商原生的請求參數或支援合約時，請選擇直接供應商。
當模型必須在你自己的硬體或網路邊界內執行時，請選擇本機供應商。

## 疑難排解

- `401`/`403`：請在 Novita 的金鑰管理頁面確認金鑰；如果已儲存的設定檔過期，請重新執行
  `openclaw onboard --auth-choice novita-api-key`。
- 未知模型錯誤：請使用
  `openclaw models list --provider novita` 傳回的確切 `novita/<route-id>`。
- 路由緩慢或失敗：請嘗試另一個 Novita 模型路由，或將 Novita 設為可容忍供應商特定差異的工作負載之備援供應商。

## 相關

- [模型供應商](/zh-TW/concepts/model-providers)
- [供應商目錄](/zh-TW/providers/index)

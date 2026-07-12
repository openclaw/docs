---
read_when:
    - 你想要使用 NovitaAI 模型執行 OpenClaw
    - 你需要 Novita 供應商 ID、金鑰或端點
summary: 搭配 OpenClaw 使用 NovitaAI 的 OpenAI 相容 API
title: NovitaAI
x-i18n:
    generated_at: "2026-07-11T21:43:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83e0e43e68d85d73e790023858a49f971b683129dbbdf6092fbd8bba4d8da331
    source_path: providers/novita.md
    workflow: 16
---

NovitaAI 是一家託管式 AI 基礎設施供應商，提供與 OpenAI 相容的 API。
它以 OpenClaw 內建供應商的形式提供（無須另外安裝外掛），因此
憑證會透過一般模型驗證流程處理，而模型參照的格式如下：
`novita/deepseek/deepseek-v3-0324`。

## 設定

在 [novita.ai/settings/key-management](https://novita.ai/settings/key-management) 建立 API 金鑰，然後執行：

```bash
openclaw onboard --auth-choice novita-api-key
```

或者設定：

```bash
export NOVITA_API_KEY="<your-novita-api-key>" # pragma: allowlist secret
```

## 預設值

| 設定          | 值                                 |
| ------------- | ---------------------------------- |
| 供應商識別碼  | `novita`                           |
| 別名          | `novita-ai`, `novitaai`            |
| 基礎 URL      | `https://api.novita.ai/openai/v1`  |
| 環境變數      | `NOVITA_API_KEY`                   |
| 預設模型      | `novita/deepseek/deepseek-v3-0324` |

## 內建模型目錄

- `novita/moonshotai/kimi-k2.5`
- `novita/minimax/minimax-m2.7`
- `novita/zai-org/glm-5`
- `novita/deepseek/deepseek-v3-0324`
- `novita/deepseek/deepseek-r1-0528`
- `novita/qwen/qwen3-235b-a22b-fp8`

這只是起始清單，並非即時目錄。你的帳戶、區域或
Novita 目前提供的服務可能會新增、移除或限制路由。設定
長期使用的預設值之前，請先檢查：

```bash
openclaw models list --provider novita
```

## 適合選擇 Novita 的情況

- 透過與 OpenAI 相容的 API 存取託管式開放權重模型。
- 使用單一供應商帳戶存取 DeepSeek、Kimi、MiniMax、GLM 或 Qwen 系列路由。
- 除了 DeepInfra、GMI、OpenRouter 或供應商直接 API 之外，還需要另一條託管式備援路徑。
- 使用供應商端模型託管，而非自行維護 LM Studio、Ollama、SGLang 或 vLLM 基礎設施。

需要供應商原生的請求參數或支援合約時，請選擇供應商直接提供的服務。
模型必須在你自己的硬體或網路邊界內執行時，請選擇本機供應商。

## 疑難排解

- `401`/`403`：在 Novita 的金鑰管理頁面確認金鑰；如果儲存的設定檔已過期，請重新執行
  `openclaw onboard --auth-choice novita-api-key`。
- 未知模型錯誤：使用
  `openclaw models list --provider novita` 傳回的確切 `novita/<route-id>`。
- 路由緩慢或失敗：嘗試其他 Novita 模型路由，或針對可容許供應商特定差異的工作負載，將 Novita 設為備援供應商。

## 相關內容

- [模型供應商](/zh-TW/concepts/model-providers)
- [供應商目錄](/zh-TW/providers/index)

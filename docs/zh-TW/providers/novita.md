---
read_when:
    - 您想使用 NovitaAI 模型執行 OpenClaw
    - 你需要 Novita 提供者 ID、金鑰或端點
summary: 搭配 OpenClaw 使用 NovitaAI 的 OpenAI 相容 API
title: NovitaAI
x-i18n:
    generated_at: "2026-06-27T19:56:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 602df700662dbf2176acabcad7d23950e8240158f58d115f8e56bf1fb9f43bcb
    source_path: providers/novita.md
    workflow: 16
---

NovitaAI 是託管式 AI 基礎設施提供者，提供與 OpenAI 相容的模型 API。在 OpenClaw 中，它是內建模型提供者，因此提供者 ID 是 `novita`，憑證會透過一般模型驗證流程處理，模型參照看起來像 `novita/deepseek/deepseek-v3-0324`。

當你想在不自行執行推論伺服器的情況下，使用託管的開放權重與第三方模型路由時，請使用 Novita。內建目錄聚焦於適合代理回合的聊天模型，包括 Novita 公開的 DeepSeek、Moonshot、MiniMax、GLM 和 Qwen 路由。

此提供者使用 Novita 與 OpenAI 相容的端點。OpenClaw 會處理提供者註冊、驗證、別名、模型參照正規化和基礎 URL 選擇；Novita 則控制即時模型可用性、帳戶權限、定價和速率限制。

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

- 提供者：`novita`
- 別名：`novita-ai`、`novitaai`
- 基礎 URL：`https://api.novita.ai/openai/v1`
- 環境變數：`NOVITA_API_KEY`
- 預設模型：`novita/deepseek/deepseek-v3-0324`

## 何時選擇 Novita

- 你想透過與 OpenAI 相容的 API 使用託管的開放權重模型。
- 你想透過單一提供者帳戶使用 DeepSeek、Kimi、MiniMax、GLM 或 Qwen 系列路由。
- 除了 OpenRouter、GMI、DeepInfra 或直接供應商 API 之外，你想要另一個託管備援路徑。
- 相較於維護 vLLM、SGLang、LM Studio 或 Ollama 基礎設施，你偏好由提供者端託管模型。

當你需要供應商原生的請求參數或支援合約時，請選擇直接供應商提供者。當模型必須在你自己的硬體上執行，或位於你自己的網路邊界後方時，請選擇本機提供者。

## 模型

內建目錄會預置常見可用的 NovitaAI 路由 ID，包括：

- `novita/moonshotai/kimi-k2.5`
- `novita/minimax/minimax-m2.7`
- `novita/zai-org/glm-5`
- `novita/deepseek/deepseek-v3-0324`
- `novita/deepseek/deepseek-r1-0528`
- `novita/qwen/qwen3-235b-a22b-fp8`

此目錄是 OpenClaw 模型選擇的起點。你的帳戶、區域或 Novita 目前的目錄可能會新增、移除或限制路由。在設定長期使用的預設值之前，請先從命令列介面檢查提供者：

```bash
openclaw models list --provider novita
```

## 疑難排解

- `401` 或 `403`：請在 Novita 的金鑰管理頁面驗證金鑰；如果已儲存的設定檔過時，請重新執行 `openclaw onboard --auth-choice novita-api-key`。
- 未知模型錯誤：請使用 `openclaw models list --provider novita` 傳回的確切 `novita/<route-id>`。
- 路由緩慢或失敗：請嘗試其他 Novita 模型路由，或針對可容忍提供者特定差異的工作負載，將 Novita 設為備援提供者。

## 相關

- [模型提供者](/zh-TW/concepts/model-providers)
- [所有提供者](/zh-TW/providers/index)

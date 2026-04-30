---
read_when:
    - 你想透過 LM Studio 使用開源模型執行 OpenClaw
    - 您想要設定並配置 LM Studio
summary: 使用 LM Studio 執行 OpenClaw
title: LM Studio
x-i18n:
    generated_at: "2026-04-30T03:31:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe6d1feadf355579b244ab4187a8d3b8bad661a5605aed906eedf361d6fcae3f
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio 是一款友善但功能強大的應用程式，可在你自己的硬體上執行開放權重模型。它可讓你執行 llama.cpp (GGUF) 或 MLX 模型 (Apple Silicon)。提供 GUI 套件或無介面守護程式 (`llmster`)。產品與設定文件請參閱 [lmstudio.ai](https://lmstudio.ai/)。

## 快速開始

1. 安裝 LM Studio (桌面版) 或 `llmster` (無介面)，然後啟動本機伺服器：

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. 啟動伺服器

請確認你已啟動桌面應用程式，或使用下列命令執行守護程式：

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

如果你使用應用程式，請確認已啟用 JIT 以獲得順暢體驗。詳情請參閱 [LM Studio JIT 與 TTL 指南](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict)。

3. 如果已啟用 LM Studio 驗證，請設定 `LM_API_TOKEN`：

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

如果已停用 LM Studio 驗證，你可以在互動式 OpenClaw 設定期間將 API 金鑰留空。

LM Studio 驗證設定詳情請參閱 [LM Studio 驗證](https://lmstudio.ai/docs/developer/core/authentication)。

4. 執行初始設定並選擇 `LM Studio`：

```bash
openclaw onboard
```

5. 在初始設定中，使用 `Default model` 提示選擇你的 LM Studio 模型。

你也可以稍後設定或變更它：

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio 模型金鑰遵循 `author/model-name` 格式 (例如 `qwen/qwen3.5-9b`)。OpenClaw
模型參照會在前面加上供應商名稱：`lmstudio/qwen/qwen3.5-9b`。你可以執行 `curl http://localhost:1234/api/v1/models` 並查看 `key` 欄位，以找到
模型的確切金鑰。

## 非互動式初始設定

當你想要以腳本設定時 (CI、佈建、遠端啟動設定)，請使用非互動式初始設定：

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

或指定基礎 URL、模型和選用 API 金鑰：

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` 接受 LM Studio 傳回的模型金鑰 (例如 `qwen/qwen3.5-9b`)，不包含
`lmstudio/` 供應商前綴。

對於需要驗證的 LM Studio 伺服器，請傳入 `--lmstudio-api-key` 或設定 `LM_API_TOKEN`。
對於不需要驗證的 LM Studio 伺服器，請省略金鑰；OpenClaw 會儲存本機非機密標記。

`--custom-api-key` 仍支援相容性用途，但 LM Studio 建議使用 `--lmstudio-api-key`。

這會寫入 `models.providers.lmstudio`，並將預設模型設定為
`lmstudio/<custom-model-id>`。當你提供 API 金鑰時，設定也會寫入
`lmstudio:default` 驗證設定檔。

互動式設定可提示輸入選用的偏好載入內容長度，並套用到其儲存至設定中的所有已探索 LM Studio 模型。
LM Studio Plugin 設定會信任已設定的 LM Studio 端點以進行模型請求，包括 loopback、LAN 和 tailnet 主機。你可以設定 `models.providers.lmstudio.request.allowPrivateNetwork: false` 來選擇退出。

## 設定

### 串流使用量相容性

LM Studio 與串流使用量相容。當它未發出 OpenAI 形式的
`usage` 物件時，OpenClaw 會改從 llama.cpp 風格的
`timings.prompt_n` / `timings.predicted_n` 中繼資料復原 token 計數。

相同的串流使用量行為也適用於這些 OpenAI 相容的本機後端：

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Thinking 相容性

當 LM Studio 的 `/api/v1/models` 探索回報模型專屬 reasoning
選項時，OpenClaw 會在模型相容性中繼資料中保留這些原生值。對於
宣告 `allowed_options: ["off", "on"]` 的二元 thinking 模型，
OpenClaw 會將停用 thinking 對應到 `off`，並將啟用的 `/think` 層級對應到 `on`，
而不是傳送僅限 OpenAI 的值，例如 `low` 或 `medium`。

### 明確設定

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "qwen/qwen3-coder-next",
            name: "Qwen 3 Coder Next",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## 疑難排解

### 未偵測到 LM Studio

請確認 LM Studio 正在執行。如果已啟用驗證，也請設定 `LM_API_TOKEN`：

```bash
# Start via desktop app, or headless:
lms server start --port 1234
```

驗證 API 可存取：

```bash
curl http://localhost:1234/api/v1/models
```

### 驗證錯誤 (HTTP 401)

如果設定回報 HTTP 401，請驗證你的 API 金鑰：

- 檢查 `LM_API_TOKEN` 是否符合 LM Studio 中設定的金鑰。
- LM Studio 驗證設定詳情請參閱 [LM Studio 驗證](https://lmstudio.ai/docs/developer/core/authentication)。
- 如果你的伺服器不需要驗證，請在設定期間將金鑰留空。

### 即時模型載入

LM Studio 支援即時 (JIT) 模型載入，模型會在首次請求時載入。請確認已啟用此功能，以避免「Model not loaded」錯誤。

### LAN 或 tailnet LM Studio 主機

使用 LM Studio 主機可連線的位址，保留 `/v1`，並確認 LM Studio 在該機器上已繫結到 loopback 以外的位址：

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://gpu-box.local:1234/v1",
        apiKey: "lmstudio",
        api: "openai-completions",
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

不同於一般 OpenAI 相容供應商，`lmstudio` 會自動信任其設定的本機/私人端點，以進行受保護的模型請求。自訂 loopback 供應商 ID，例如 `localhost` 或 `127.0.0.1` 也會自動受到信任；對於 LAN、tailnet 或私人 DNS 自訂供應商 ID，請明確設定 `models.providers.<id>.request.allowPrivateNetwork: true`。

## 相關

- [模型選擇](/zh-TW/concepts/model-providers)
- [Ollama](/zh-TW/providers/ollama)
- [本機模型](/zh-TW/gateway/local-models)

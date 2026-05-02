---
read_when:
    - 你想透過 LM Studio 使用開源模型執行 OpenClaw
    - 您想要安裝並設定 LM Studio
summary: 使用 LM Studio 執行 OpenClaw
title: LM Studio
x-i18n:
    generated_at: "2026-05-02T21:02:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3971bc471e5d8b0f142394b7b1897f8fdb2be283082245fbb2cf744d06143292
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio 是一款友善且功能強大的應用程式，可在你自己的硬體上執行開放權重模型。它可讓你執行 llama.cpp (GGUF) 或 MLX 模型 (Apple Silicon)。提供 GUI 套件或無介面 daemon (`llmster`)。產品與設定文件請參閱 [lmstudio.ai](https://lmstudio.ai/)。

## 快速開始

1. 安裝 LM Studio (桌面版) 或 `llmster` (無介面)，然後啟動本機伺服器：

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. 啟動伺服器

請確認你已啟動桌面應用程式，或使用下列命令執行 daemon：

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

如果你使用應用程式，請確認已啟用 JIT，以獲得流暢體驗。請在 [LM Studio JIT 和 TTL 指南](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict)深入瞭解。

3. 如果已啟用 LM Studio 驗證，請設定 `LM_API_TOKEN`：

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

如果已停用 LM Studio 驗證，你可以在互動式 OpenClaw 設定期間將 API key 留空。

如需 LM Studio 驗證設定詳細資訊，請參閱 [LM Studio 驗證](https://lmstudio.ai/docs/developer/core/authentication)。

4. 執行 onboarding 並選擇 `LM Studio`：

```bash
openclaw onboard
```

5. 在 onboarding 中，使用 `Default model` 提示選擇你的 LM Studio 模型。

你也可以稍後設定或變更：

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio 模型鍵遵循 `author/model-name` 格式 (例如 `qwen/qwen3.5-9b`)。OpenClaw
模型參照會在前面加上 provider 名稱：`lmstudio/qwen/qwen3.5-9b`。你可以執行
`curl http://localhost:1234/api/v1/models`，並查看 `key` 欄位來找到模型的確切鍵。

## 非互動式 onboarding

當你想要以指令碼進行設定時 (CI、佈建、遠端 bootstrap)，請使用非互動式 onboarding：

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

或指定 base URL、模型，以及選用的 API key：

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` 接受 LM Studio 回傳的模型鍵 (例如 `qwen/qwen3.5-9b`)，不包含
`lmstudio/` provider 前綴。

對於已驗證的 LM Studio 伺服器，請傳入 `--lmstudio-api-key` 或設定 `LM_API_TOKEN`。
對於未驗證的 LM Studio 伺服器，請省略該 key；OpenClaw 會儲存一個本機非祕密標記。

`--custom-api-key` 仍支援相容性用途，但 LM Studio 建議使用 `--lmstudio-api-key`。

這會寫入 `models.providers.lmstudio`，並將預設模型設定為
`lmstudio/<custom-model-id>`。當你提供 API key 時，設定也會寫入
`lmstudio:default` auth profile。

互動式設定可提示輸入選用的偏好載入 context 長度，並套用到它儲存至 config 的已探索 LM Studio 模型。
LM Studio Plugin config 會信任已設定的 LM Studio endpoint 來處理模型請求，包括 loopback、LAN 和 tailnet host。你可以透過設定 `models.providers.lmstudio.request.allowPrivateNetwork: false` 退出。

## 設定

### 串流 usage 相容性

LM Studio 與串流 usage 相容。當它未發出 OpenAI 形狀的
`usage` 物件時，OpenClaw 會改從 llama.cpp 風格的
`timings.prompt_n` / `timings.predicted_n` 中繼資料復原 token 計數。

相同的串流 usage 行為也適用於這些 OpenAI 相容的本機後端：

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Thinking 相容性

當 LM Studio 的 `/api/v1/models` 探索回報模型專屬 reasoning
選項時，OpenClaw 會在模型相容性中繼資料中保留那些原生值。對於
宣告 `allowed_options: ["off", "on"]` 的二元 thinking 模型，
OpenClaw 會將停用 thinking 對應到 `off`，並將已啟用的 `/think` 層級對應到 `on`，
而不是傳送 OpenAI 專用值，例如 `low` 或 `medium`。

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

### 偵測不到 LM Studio

請確認 LM Studio 正在執行。如果已啟用驗證，也請設定 `LM_API_TOKEN`：

```bash
# Start via desktop app, or headless:
lms server start --port 1234
```

確認 API 可存取：

```bash
curl http://localhost:1234/api/v1/models
```

### 驗證錯誤 (HTTP 401)

如果設定回報 HTTP 401，請確認你的 API key：

- 檢查 `LM_API_TOKEN` 是否符合 LM Studio 中設定的 key。
- 如需 LM Studio 驗證設定詳細資訊，請參閱 [LM Studio 驗證](https://lmstudio.ai/docs/developer/core/authentication)。
- 如果你的伺服器不需要驗證，請在設定期間將 key 留空。

### Just-in-time 模型載入

LM Studio 支援 just-in-time (JIT) 模型載入，也就是在第一次請求時載入模型。OpenClaw 預設會透過 LM Studio 的原生載入 endpoint 預先載入模型，這在停用 JIT 時很有幫助。若要讓 LM Studio 的 JIT、閒置 TTL 和自動逐出行為負責模型生命週期，請停用 OpenClaw 的預載步驟：

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        api: "openai-completions",
        params: { preload: false },
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

### LAN 或 tailnet LM Studio host

使用 LM Studio host 可連線的位址，保留 `/v1`，並確認該機器上的 LM Studio 繫結範圍超出 loopback：

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

不同於一般 OpenAI 相容 providers，`lmstudio` 會自動信任其已設定的本機/私人 endpoint，以處理受防護的模型請求。自訂 loopback provider ID，例如 `localhost` 或 `127.0.0.1`，也會自動受到信任；對於 LAN、tailnet 或私人 DNS 自訂 provider ID，請明確設定 `models.providers.<id>.request.allowPrivateNetwork: true`。

## 相關

- [模型選擇](/zh-TW/concepts/model-providers)
- [Ollama](/zh-TW/providers/ollama)
- [本機模型](/zh-TW/gateway/local-models)

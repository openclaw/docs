---
read_when:
    - 你想要透過 LM Studio 使用開放原始碼模型執行 OpenClaw
    - 你想要設定並配置 LM Studio
summary: 使用 LM Studio 執行 OpenClaw
title: LM Studio
x-i18n:
    generated_at: "2026-07-16T11:58:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 21129dad2f1bf53fcf9474db2393fce7642b82f4f22e1770d9788547f08eca7f
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio 可在本機執行 llama.cpp（GGUF）或 MLX 模型，並可作為 GUI 應用程式或無介面的 `llmster`
常駐程式運作。如需安裝與產品文件，請參閱 [lmstudio.ai](https://lmstudio.ai/)。

## 快速開始

<Steps>
  <Step title="安裝並啟動伺服器">
    安裝 LM Studio（桌面版）或 `llmster`（無介面版），然後啟動伺服器：

    ```bash
    lms server start --port 1234
    ```

    或執行無介面的常駐程式：

    ```bash
    lms daemon up
    ```

    若使用桌面應用程式，請啟用 JIT，以順暢載入模型；請參閱
    [LM Studio JIT 與 TTL 指南](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict)。

  </Step>
  <Step title="若已啟用驗證，請設定 API 金鑰">
    ```bash
    export LM_API_TOKEN="your-lm-studio-api-token"
    ```

    若已停用 LM Studio 驗證，請在設定期間將 API 金鑰留空。請參閱
    [LM Studio 驗證](https://lmstudio.ai/docs/developer/core/authentication)。

  </Step>
  <Step title="執行初始設定">
    ```bash
    openclaw onboard
    ```

    選擇 `LM Studio`，然後在 `Default model` 提示中選取模型。

    在全新的引導式設定中，OpenClaw 會先查詢預設或已設定 LM Studio 主機上的
    `/api/v1/models`。現有的 LLM 會透過相同的命令列介面/macOS 設定流程提供選擇，並在儲存其
    設定前，以實際的補全請求進行驗證。自動檢查絕不會下載模型，且會忽略僅供嵌入使用的目錄項目。

  </Step>
</Steps>

稍後變更預設模型：

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio 模型金鑰使用 `author/model-name` 格式（例如 `qwen/qwen3.5-9b`）；OpenClaw 模型參照
會在前方加上供應商：`lmstudio/qwen/qwen3.5-9b`。若要找出模型的確切金鑰，請執行下列
命令並查看 `key` 欄位：

```bash
curl http://localhost:1234/api/v1/models
```

## 非互動式初始設定

```bash
openclaw onboard --non-interactive --accept-risk --auth-choice lmstudio
```

或明確指定基底 URL、模型與 API 金鑰：

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` 接受 LM Studio 傳回的模型金鑰（例如 `qwen/qwen3.5-9b`），不含
`lmstudio/` 供應商前綴。對於需要驗證的伺服器，請傳入 `--lmstudio-api-key`（或設定 `LM_API_TOKEN`）；
對於不需要驗證的伺服器，請省略此項，OpenClaw 會改為儲存本機非機密標記。
為了相容性，仍可接受 `--custom-api-key`，但建議使用 `--lmstudio-api-key`。

這會寫入 `models.providers.lmstudio`，並將預設模型設為 `lmstudio/<custom-model-id>`。
提供 API 金鑰也會寫入 `lmstudio:default` 驗證設定檔。

互動式設定還可提示輸入偏好的載入情境長度，並將其套用至已探索且儲存至設定的所有模型。

## 設定

### 串流用量相容性

LM Studio 不一定會在串流回應中發出符合 OpenAI 格式的 `usage` 物件。OpenClaw
會改從 llama.cpp 樣式的 `timings.prompt_n` / `timings.predicted_n` 中繼資料
復原權杖計數。任何解析為本機端點（回送主機）的 OpenAI 相容端點都會使用相同的
備援機制，其中也涵蓋其他本機後端，例如 vLLM、SGLang、llama.cpp、LocalAI、Jan、TabbyAPI
及 text-generation-webui。

### 思考相容性

當 LM Studio 的 `/api/v1/models` 探索回報模型專屬的推理選項時，OpenClaw
會在模型相容性中繼資料中公開相符的 `reasoning_effort` 值（`none`、`minimal`、`low`、`medium`、`high`、`xhigh`）。
部分 LM Studio 組建會提供二元 UI 選項（`allowed_options: ["off",
"on"]`），但在 `/v1/chat/completions` 上拒絕這些常值；
OpenClaw 會在傳送請求前，將該二元形式正規化為六級尺度，這也適用於仍含有
`off`/`on` 推理對應表的舊版已儲存設定。

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

### 停用預先載入

LM Studio 支援即時（JIT）模型載入，可在首次請求時載入模型。OpenClaw
預設會透過 LM Studio 的原生載入端點預先載入模型，這在停用 JIT 時很有幫助。
若要改由 LM Studio 的 JIT、閒置 TTL 與自動退出行為管理模型生命週期，
請停用 OpenClaw 的預先載入步驟：

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

### 區域網路或 tailnet 主機

使用 LM Studio 主機可連線的位址、保留 `/v1`，並確認該電腦上的 LM Studio
不僅繫結至回送介面：

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

`lmstudio` 會自動信任其為模型請求所設定的端點，包括回送、區域網路及 tailnet 主機
（中繼資料/連結本機來源除外）。任何自訂/本機 OpenAI 相容供應商項目都會獲得相同的精確來源信任。
對不同私有主機或連接埠的請求仍需要 `models.providers.<id>.request.allowPrivateNetwork: true`；將其設為 `false`
即可選擇退出預設信任。

## 疑難排解

### 未偵測到 LM Studio

確認 LM Studio 正在執行：

```bash
lms server start --port 1234
```

若已啟用驗證，亦請設定 `LM_API_TOKEN`。確認 API 可連線：

```bash
curl http://localhost:1234/api/v1/models
```

### 驗證錯誤（HTTP 401）

- 確認 `LM_API_TOKEN` 與 LM Studio 中設定的金鑰相符。
- 請參閱 [LM Studio 驗證](https://lmstudio.ai/docs/developer/core/authentication)。
- 若伺服器不需要驗證，請在設定期間將金鑰留空。

## 相關內容

- [模型選擇](/zh-TW/concepts/model-providers)
- [Ollama](/zh-TW/providers/ollama)
- [本機模型](/zh-TW/gateway/local-models)

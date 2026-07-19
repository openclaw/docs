---
read_when:
    - 你想要在本機進行文字推論，且不需要 API 金鑰或模型伺服器
    - 你想使用本機 GGUF 模型產生記憶搜尋的嵌入向量
    - 你正在設定 memorySearch.provider = "local"
    - 你需要擁有 node-llama-cpp 執行階段的 OpenClaw 外掛
sidebarTitle: llama.cpp Provider
summary: 使用 llama.cpp 在 OpenClaw 中執行本機 GGUF 文字推論與記憶嵌入
title: llama.cpp 提供者
x-i18n:
    generated_at: "2026-07-19T13:52:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8af1118ae65741519f81520e6c1c961e208e8dc2c9e1b250979c3758b8fe7c83
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` 是官方的外部提供者外掛，用於程序內本機 GGUF
文字推論與嵌入。它會註冊文字提供者 `llama-cpp`、
嵌入提供者 `local`，並負責 `node-llama-cpp` 原生執行階段。

使用本機推論或本機記憶嵌入前，請先安裝此外掛：

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

主要的 `openclaw` npm 套件不包含 `node-llama-cpp`。將原生相依套件保留在此
外掛中，可避免一般的 OpenClaw npm 更新刪除手動安裝在 OpenClaw 套件目錄內的
執行階段。

## 本機文字推論

在互動式初始設定期間選擇 **本機模型 (llama.cpp)**。OpenClaw 會在下載預設模型前
詢問：

`hf:bartowski/Qwen_Qwen3-4B-Instruct-2507-GGUF/Qwen_Qwen3-4B-Instruct-2507-Q4_K_M.gguf`

Qwen3 4B Instruct 2507 Q4_K_M 檔案約為 2.5 GB。模型權重大約需要 3 GB
RAM，此外還要加上上下文與 OpenClaw 執行階段的額外負擔。預設上下文會自動調整大小，
上限為 8,192 個權杖，因此在 8 GB 的機器上仍具實用性。只有在機器有足夠記憶體時，
才設定更大的上下文。

初始設定的探索檢查為唯讀。只有當預設或已設定的 GGUF 檔案已位於模型快取中時，
才會自動提供 llama.cpp；探索期間絕不會下載。Ollama 與 LM Studio 仍是獨立的本機
服務選項，並各自保有其探索流程。手動選擇 llama.cpp 才會提示下載預設模型。

提供者使用 GGUF 模型內嵌的聊天範本與原生 node-llama-cpp 函式呼叫。
文字會逐權杖串流。工具呼叫會傳回 OpenClaw 執行，而不是在 node-llama-cpp
內部執行。

### 使用其他 GGUF 模型

將模型新增至 `models.providers.llama-cpp`。在 `params.modelPath` 中放入本機路徑或完整的
`hf:` 檔案 URI：

```json5
{
  models: {
    mode: "merge",
    providers: {
      "llama-cpp": {
        baseUrl: "local://llama-cpp",
        api: "openai-completions",
        params: {
          modelCacheDir: "~/.node-llama-cpp/models",
        },
        models: [
          {
            id: "my-local-model",
            name: "My local GGUF",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 8192,
            maxTokens: 2048,
            params: {
              modelPath: "~/Models/my-model.Q4_K_M.gguf",
              contextSize: 8192,
            },
            compat: { supportsTools: true },
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "llama-cpp/my-local-model" },
    },
  },
}
```

推論絕不會隱含下載缺少的模型。若使用自訂 `hf:` URI，
請先將 GGUF 下載至 `modelCacheDir`。探索功能使用 node-llama-cpp
本身的唯讀快取解析器，包括儲存庫、分支與分割檔案命名。

## 記憶嵌入設定

將 `memorySearch.provider` 設為 `local`：

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        local: {
          modelPath: "hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

`local.modelPath` 預設為上方所示的 `hf:` URI（`embeddinggemma-300m-qat-Q8_0.gguf`）。
若要使用其他模型，請將其指向不同的 `hf:` URI 或本機
`.gguf` 檔案。`local.modelCacheDir` 會覆寫下載模型的快取位置
（預設值：`~/.node-llama-cpp/models`），而 `local.contextSize` 接受整數或
`"auto"`。

當 `local.contextSize` 為數值時，提供者也會將該需求交給 node-llama-cpp
的自動 GPU 層配置。這可讓 node-llama-cpp 在保留其記憶體安全檢查的同時，
一併容納模型與嵌入上下文。使用 `"auto"` 時，node-llama-cpp
會維持其一般自動配置。

## 原生執行階段

使用 Node 24 可獲得最順暢的原生安裝流程。使用 pnpm 的原始碼簽出可能需要
核准並重建原生相依套件：

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

## 記憶執行階段診斷

提供者載入後執行 `openclaw memory status --deep`，即可檢查所選的後端與組建、裝置名稱、
GPU 卸載層數、要求的上下文大小，以及最近觀察到的 VRAM 或統一記憶體快照。
VRAM 值會包含觀察時間戳記，因為被動狀態讀取不會重新載入模型或輪詢裝置。

執行中的閘道若已使用本機提供者，相同的最近已知資訊也可能出現在
`openclaw doctor` 中。一般的狀態或 doctor 命令不會只為了收集診斷資訊
而載入模型。

## 疑難排解

如果 `node-llama-cpp` 遺失或載入失敗，OpenClaw 會回報失敗並顯示：

1. 安裝外掛：`openclaw plugins install @openclaw/llama-cpp-provider`。
2. 使用 Node 24 進行原生安裝／更新。
3. 若使用 pnpm 原始碼簽出：先執行 `pnpm approve-builds`，再執行 `pnpm rebuild node-llama-cpp`。

若要進行不含程序內原生相依套件的本機推論，請改用 Ollama 或
LM Studio 提供者。若要使用更容易設定的本機嵌入，請改將
`memorySearch.provider` 設為遠端嵌入提供者，例如 `lmstudio`、
`ollama`、`openai` 或 `voyage`。

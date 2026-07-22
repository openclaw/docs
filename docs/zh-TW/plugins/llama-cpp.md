---
read_when:
    - 你想要在本機進行文字推論，且不使用 API 金鑰或模型伺服器
    - 你想要使用本機 GGUF 模型產生記憶搜尋嵌入向量
    - 你正在設定 memory.search.provider = "local"
    - 你需要擁有 node-llama-cpp 執行階段的 OpenClaw 外掛
sidebarTitle: llama.cpp Provider
summary: 使用 llama.cpp 在 OpenClaw 中執行本機 GGUF 文字推論與記憶嵌入
title: llama.cpp 提供者
x-i18n:
    generated_at: "2026-07-22T10:39:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 88e6d66943adcbc602421b8cc00359b3ed87357194c3ffaa845c1db7fbcd9c38
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` 是用於程序內本機 GGUF 文字推論與嵌入的官方外部提供者外掛。它會註冊文字提供者 `llama-cpp`、嵌入提供者 `local`，並擁有 `node-llama-cpp` 原生執行階段。

使用本機推論或本機記憶嵌入前，請先安裝此外掛：

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

主要的 `openclaw` npm 套件不包含 `node-llama-cpp`。將原生相依套件保留在此外掛中，可避免一般的 OpenClaw npm 更新刪除 OpenClaw 套件目錄內手動安裝的執行階段。

## 本機文字推論

在互動式初始設定期間選擇 **本機模型 (llama.cpp)**。OpenClaw 會在下載預設模型前詢問：

`hf:bartowski/Qwen_Qwen3-4B-Instruct-2507-GGUF/Qwen_Qwen3-4B-Instruct-2507-Q4_K_M.gguf`

Qwen3 4B Instruct 2507 Q4_K_M 檔案約為 2.5 GB。模型權重大約需要預留 3 GB RAM，另需加上上下文與 OpenClaw 執行階段的額外負擔。預設上下文會自動調整大小，上限為 8,192 個權杖，因此在 8 GB 的機器上仍具實用性。只有在機器具備足夠記憶體時，才設定更大的上下文。

初始設定的探索檢查是唯讀的。只有當預設或設定的 GGUF 檔案已位於模型快取中時，才會自動提供 llama.cpp；探索期間絕不會下載。Ollama 與 LM Studio 仍是獨立的本機服務選項，並各自保有其探索流程。手動選擇 llama.cpp 才會提示下載預設模型。

提供者會使用 GGUF 模型內嵌的聊天範本與原生 node-llama-cpp 函式呼叫。文字會逐權杖串流。工具呼叫會傳回 OpenClaw 執行，而不是在 node-llama-cpp 內部執行。

### 使用其他 GGUF 模型

將模型新增至 `models.providers.llama-cpp`。在 `params.modelPath` 中填入本機路徑或完整的 `hf:` 檔案 URI：

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

推論絕不會隱含下載缺少的模型。若使用自訂 `hf:` URI，請先將 GGUF 下載至 `modelCacheDir`。探索會使用 node-llama-cpp 自有的唯讀快取解析器，包括儲存庫、分支與分割檔案命名。

## 記憶嵌入設定

將 `memory.search.provider` 設為 `local`：

```json5
{
  memory: {
    search: {
      provider: "local",
      local: {
        modelPath: "hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf",
      },
    },
  },
}
```

`local.modelPath` 預設為上方所示的 `hf:` URI（`embeddinggemma-300m-qat-Q8_0.gguf`）。若要使用其他模型，請將其指向不同的 `hf:` URI 或本機 `.gguf` 檔案。`local.modelCacheDir` 會覆寫已下載模型的快取位置（預設值：`~/.node-llama-cpp/models`），而 `local.contextSize` 接受整數或 `"auto"`。

當 `local.contextSize` 為數值時，提供者也會將該需求交給 node-llama-cpp 的自動 GPU 層配置。這可讓 node-llama-cpp 在保留其記憶體安全檢查的同時，一併容納模型與嵌入上下文。使用 `"auto"` 時，node-llama-cpp 會維持其一般的自動配置。

## 原生執行階段

使用 Node 24 可獲得最順暢的原生安裝流程。使用 pnpm 的原始碼簽出可能需要核准並重新建置原生相依套件：

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

## 記憶執行階段診斷

提供者載入後，執行 `openclaw memory status --deep`，即可檢查所選後端與組建、裝置名稱、卸載至 GPU 的層數、要求的上下文大小，以及最近觀察到的 VRAM 或統一記憶體快照。VRAM 值包含觀察時間戳記，因為被動狀態讀取不會重新載入模型或輪詢裝置。

當執行中的閘道已使用本機提供者時，相同的最近已知資訊也可能出現在 `openclaw doctor` 中。一般的狀態或 doctor 命令不會僅為了收集診斷資訊而載入模型。

## 疑難排解

若 `node-llama-cpp` 遺失或載入失敗，OpenClaw 會回報失敗並提供：

1. 安裝外掛：`openclaw plugins install @openclaw/llama-cpp-provider`。
2. 原生安裝／更新請使用 Node 24。
3. 若使用 pnpm 原始碼簽出：先執行 `pnpm approve-builds`，再執行 `pnpm rebuild node-llama-cpp`。

若要使用不含程序內原生相依套件的本機推論，請改用 Ollama 或 LM Studio 提供者。若要更輕鬆地使用本機嵌入，請改將 `memory.search.provider` 設為遠端嵌入提供者，例如 `lmstudio`、`ollama`、`openai` 或 `voyage`。

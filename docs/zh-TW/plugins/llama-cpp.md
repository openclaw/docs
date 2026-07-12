---
read_when:
    - 你想要使用本機 GGUF 模型產生記憶搜尋嵌入向量
    - 你正在設定 memorySearch.provider = "local"
    - 你需要擁有 node-llama-cpp 執行階段的 OpenClaw 外掛
sidebarTitle: llama.cpp Provider
summary: 安裝官方 llama.cpp 提供者，以在本機使用 GGUF 記憶嵌入向量
title: llama.cpp 提供者
x-i18n:
    generated_at: "2026-07-12T14:43:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 369ec199e8493356912337b849a84f829672e8872d17083c9a597f4e5294ebd5
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` 是用於本機 GGUF 嵌入的官方外部提供者外掛。它會註冊嵌入提供者 ID `local`，並負責管理 `memorySearch.provider: "local"` 所使用的 `node-llama-cpp` 執行階段相依套件。

使用本機記憶體嵌入之前，請先安裝此外掛：

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

主要的 `openclaw` npm 套件不包含 `node-llama-cpp`。將原生相依套件保留在此外掛中，可避免一般 OpenClaw npm 更新刪除手動安裝在 OpenClaw 套件目錄內的執行階段。

## 設定

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

`local.modelPath` 預設為上方所示的 `hf:` URI（`embeddinggemma-300m-qat-Q8_0.gguf`）。若要使用其他模型，請將它指向不同的 `hf:` URI 或本機 `.gguf` 檔案。`local.modelCacheDir` 可覆寫下載模型的快取位置（預設值：`~/.node-llama-cpp/models`），而 `local.contextSize` 接受整數或 `"auto"`。

當 `local.contextSize` 為數值時，提供者也會將該需求交給 node-llama-cpp 的自動 GPU 層配置。這可讓 node-llama-cpp 在保留其記憶體安全檢查的同時，一併容納模型與嵌入上下文。使用 `"auto"` 時，node-llama-cpp 會維持一般的自動配置。

## 原生執行階段

使用 Node 24 可獲得最順暢的原生安裝流程。使用 pnpm 的原始碼簽出可能需要核准並重新建置原生相依套件：

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

## 執行階段診斷

提供者載入後，執行 `openclaw memory status --deep`，以檢查所選的後端與組建、裝置名稱、卸載至 GPU 的層數、要求的上下文大小，以及最近一次觀察到的 VRAM 或統一記憶體快照。VRAM 數值包含觀察時間戳記，因為被動狀態讀取不會重新載入模型或輪詢裝置。

若執行中的閘道已使用過本機提供者，`openclaw doctor` 中也可能顯示相同的最近已知資訊。一般的狀態或 doctor 命令不會僅為了收集診斷資訊而載入模型。

## 疑難排解

如果缺少 `node-llama-cpp` 或無法載入，OpenClaw 會回報失敗並提供下列指引：

1. 安裝外掛：`openclaw plugins install @openclaw/llama-cpp-provider`。
2. 使用 Node 24 進行原生安裝／更新。
3. 若使用 pnpm 原始碼簽出：執行 `pnpm approve-builds`，然後執行 `pnpm rebuild node-llama-cpp`。

若想使用不需原生建置步驟、設定更簡便的本機嵌入，請改為將 `memorySearch.provider` 設為遠端嵌入提供者，例如 `lmstudio`、`ollama`、`openai` 或 `voyage`。

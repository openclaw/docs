---
read_when:
    - 你想要從本機 GGUF 模型取得記憶搜尋嵌入
    - 您正在設定 memorySearch.provider = "local"
    - 你需要擁有 node-llama-cpp 執行階段的 OpenClaw 外掛
sidebarTitle: llama.cpp Provider
summary: 安裝官方 llama.cpp 供應器，用於本機 GGUF 記憶嵌入
title: llama.cpp 提供者
x-i18n:
    generated_at: "2026-07-05T11:31:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bc8243a07b647f2f9a4b2da855997d39fb37704dfe584fc4f14076ab276b07a8
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` 是用於本機 GGUF 嵌入的官方外部供應商外掛。它會註冊嵌入供應商 ID `local`，並擁有 `memorySearch.provider: "local"` 所使用的 `node-llama-cpp` 執行階段相依性。

使用本機記憶嵌入之前，請先安裝它：

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

主要的 `openclaw` npm 套件不包含 `node-llama-cpp`。將這個原生相依性保留在此插件中，可避免一般 OpenClaw npm 更新刪除 OpenClaw 套件目錄內手動安裝的執行階段。

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

`local.modelPath` 預設為上方顯示的 `hf:` URI（`embeddinggemma-300m-qat-Q8_0.gguf`）。
將它指向不同的 `hf:` URI 或本機 `.gguf` 檔案，即可使用另一個模型。`local.modelCacheDir` 會覆寫下載模型的快取位置（預設值：`~/.node-llama-cpp/models`），而 `local.contextSize` 可接受整數或 `"auto"`。

## 原生執行階段

使用節點 24 可獲得最順暢的原生安裝路徑。使用 pnpm 的原始碼 checkout 可能需要核准並重新建置原生相依性：

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

## 疑難排解

如果缺少 `node-llama-cpp` 或載入失敗，OpenClaw 會回報失敗並附上：

1. 安裝外掛：`openclaw plugins install @openclaw/llama-cpp-provider`。
2. 使用節點 24 進行原生安裝/更新。
3. 從 pnpm 原始碼 checkout 執行：`pnpm approve-builds`，然後執行 `pnpm rebuild node-llama-cpp`。

若想使用阻力較低、無需原生建置步驟的本機嵌入，請改將 `memorySearch.provider` 設為遠端嵌入供應商，例如 `lmstudio`、`ollama`、`openai` 或 `voyage`。

---
read_when:
    - 你想要來自本機 GGUF 模型的記憶搜尋嵌入向量
    - 你正在設定 memorySearch.provider = "local"
    - 你需要擁有 node-llama-cpp 執行階段的 OpenClaw 外掛
sidebarTitle: llama.cpp Provider
summary: 安裝官方 llama.cpp 供應商，以使用本機 GGUF 記憶嵌入
title: llama.cpp 供應商
x-i18n:
    generated_at: "2026-06-27T19:37:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b0988c36c5ed5c61a7e97980df291fb43a0071e57c7460bf5a653f516114963
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` 是本機 GGUF 嵌入的官方外部提供者外掛。
它擁有 `memorySearch.provider: "local"` 使用的 `node-llama-cpp` 執行階段相依套件。

使用本機記憶嵌入前，請先安裝它：

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

主要的 `openclaw` npm 套件不包含 `node-llama-cpp`。將原生相依套件保留在此外掛中，可避免一般 OpenClaw npm 更新刪除 OpenClaw 套件目錄內手動安裝的執行階段。

## 設定

將記憶搜尋提供者設為 `local`：

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

預設模型是 `embeddinggemma-300m-qat-Q8_0.gguf`。你也可以將 `local.modelPath` 指向本機 `.gguf` 檔案。

## 原生執行階段

使用節點 24 可獲得最順暢的原生安裝路徑。使用 pnpm 的原始碼 checkout 可能需要核准並重新建置原生相依套件：

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

若要降低本機嵌入的使用阻力，請改用 Ollama 或 LM Studio 等本機服務提供者。

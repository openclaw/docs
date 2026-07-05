---
read_when:
    - 你想使用本地 GGUF 模型生成记忆搜索嵌入
    - 你正在配置 memorySearch.provider = "local"
    - 你需要负责 node-llama-cpp 运行时的 OpenClaw 插件
sidebarTitle: llama.cpp Provider
summary: 安装官方 llama.cpp 提供商，用于本地 GGUF 记忆嵌入
title: llama.cpp 提供商
x-i18n:
    generated_at: "2026-07-05T11:31:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bc8243a07b647f2f9a4b2da855997d39fb37704dfe584fc4f14076ab276b07a8
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` 是用于本地 GGUF 嵌入的官方外部提供商插件。它注册嵌入提供商 ID `local`，并拥有 `memorySearch.provider: "local"` 所使用的 `node-llama-cpp` 运行时依赖。

在使用本地记忆嵌入之前安装它：

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

主 `openclaw` npm 包不包含 `node-llama-cpp`。将原生依赖保留在此插件中，可以防止常规 OpenClaw npm 更新删除 OpenClaw 包目录内手动安装的运行时。

## 配置

将 `memorySearch.provider` 设置为 `local`：

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

`local.modelPath` 默认使用上面显示的 `hf:` URI（`embeddinggemma-300m-qat-Q8_0.gguf`）。将它指向不同的 `hf:` URI 或本地 `.gguf` 文件即可使用其他模型。`local.modelCacheDir` 会覆盖已下载模型的缓存位置（默认：`~/.node-llama-cpp/models`），并且 `local.contextSize` 接受整数或 `"auto"`。

## 原生运行时

使用 Node 24 可获得最顺畅的原生安装路径。使用 pnpm 的源码检出可能需要批准并重新构建原生依赖：

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

## 故障排查

如果 `node-llama-cpp` 缺失或加载失败，OpenClaw 会报告失败并提示：

1. 安装插件：`openclaw plugins install @openclaw/llama-cpp-provider`。
2. 使用 Node 24 进行原生安装/更新。
3. 从 pnpm 源码检出中：`pnpm approve-builds`，然后运行 `pnpm rebuild node-llama-cpp`。

若想在没有原生构建步骤的情况下以更低摩擦使用本地嵌入，请改为将 `memorySearch.provider` 设置为远程嵌入提供商，例如 `lmstudio`、`ollama`、`openai` 或 `voyage`。

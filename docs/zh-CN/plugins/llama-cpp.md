---
read_when:
    - 你想使用本地 GGUF 模型生成记忆搜索嵌入
    - 你正在配置 memorySearch.provider = "local"
    - 你需要拥有 node-llama-cpp 运行时的 OpenClaw 插件
sidebarTitle: llama.cpp Provider
summary: 安装官方 llama.cpp 提供商，用于本地 GGUF 记忆嵌入
title: llama.cpp 提供商
x-i18n:
    generated_at: "2026-06-27T02:41:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b0988c36c5ed5c61a7e97980df291fb43a0071e57c7460bf5a653f516114963
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` 是用于本地 GGUF 嵌入的官方外部提供商插件。
它拥有 `memorySearch.provider: "local"` 使用的 `node-llama-cpp` 运行时依赖。

在使用本地记忆嵌入之前安装它：

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

主 `openclaw` npm 包不包含 `node-llama-cpp`。将原生依赖保留在此插件中，可以防止常规 OpenClaw npm 更新删除手动安装在 OpenClaw 包目录内的运行时。

## 配置

将记忆搜索提供商设置为 `local`：

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

默认模型是 `embeddinggemma-300m-qat-Q8_0.gguf`。你也可以将 `local.modelPath` 指向本地 `.gguf` 文件。

## 原生运行时

使用 Node 24 可获得最顺畅的原生安装路径。使用 pnpm 的源码检出可能需要批准并重新构建原生依赖：

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

如果想更轻量地使用本地嵌入，请改用本地服务提供商，例如 Ollama 或 LM Studio。

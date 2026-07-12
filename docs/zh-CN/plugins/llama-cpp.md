---
read_when:
    - 你希望使用本地 GGUF 模型生成记忆搜索嵌入向量
    - 你正在配置 `memorySearch.provider = "local"`
    - 你需要负责 `node-llama-cpp` 运行时的 OpenClaw 插件
sidebarTitle: llama.cpp Provider
summary: 安装官方 llama.cpp 提供商，以使用本地 GGUF 记忆嵌入模型
title: llama.cpp 提供商
x-i18n:
    generated_at: "2026-07-11T20:44:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 369ec199e8493356912337b849a84f829672e8872d17083c9a597f4e5294ebd5
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` 是用于本地 GGUF 嵌入的官方外部提供商插件。它注册嵌入提供商 ID `local`，并负责管理 `memorySearch.provider: "local"` 使用的 `node-llama-cpp` 运行时依赖。

使用本地记忆嵌入前，请先安装它：

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

主 `openclaw` npm 软件包不包含 `node-llama-cpp`。将原生依赖保留在此插件中，可防止常规 OpenClaw npm 更新删除手动安装在 OpenClaw 软件包目录内的运行时。

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

`local.modelPath` 默认为上面所示的 `hf:` URI（`embeddinggemma-300m-qat-Q8_0.gguf`）。若要使用其他模型，请将其指向其他 `hf:` URI 或本地 `.gguf` 文件。`local.modelCacheDir` 可覆盖下载模型的缓存位置（默认值：`~/.node-llama-cpp/models`），而 `local.contextSize` 接受整数或 `"auto"`。

当 `local.contextSize` 为数值时，提供商还会将该要求传递给 node-llama-cpp 的自动 GPU 层放置功能。这样，node-llama-cpp 就能在保留内存安全检查的同时，合理容纳模型和嵌入上下文。使用 `"auto"` 时，node-llama-cpp 会保持常规的自动放置方式。

## 原生运行时

使用 Node 24 可获得最顺畅的原生安装体验。使用 pnpm 的源代码检出可能需要批准并重新构建原生依赖：

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

## 运行时诊断

提供商加载后，运行 `openclaw memory status --deep`，可检查所选后端和构建版本、设备名称、GPU 卸载层数、请求的上下文大小，以及最近观测到的 VRAM 或统一内存快照。VRAM 值包含观测时间戳，因为被动状态读取不会重新加载模型或轮询设备。

如果正在运行的 Gateway 网关已经使用过本地提供商，同样的最近已知信息也可能出现在 `openclaw doctor` 中。常规状态或 Doctor 命令不会仅为了收集诊断信息而加载模型。

## 故障排查

如果 `node-llama-cpp` 缺失或加载失败，OpenClaw 会报告故障，并提供以下解决步骤：

1. 安装插件：`openclaw plugins install @openclaw/llama-cpp-provider`。
2. 使用 Node 24 进行原生安装或更新。
3. 对于 pnpm 源代码检出：运行 `pnpm approve-builds`，然后运行 `pnpm rebuild node-llama-cpp`。

若希望以更省事的方式使用本地嵌入，而不执行原生构建步骤，请改为将 `memorySearch.provider` 设置为远程嵌入提供商，例如 `lmstudio`、`ollama`、`openai` 或 `voyage`。

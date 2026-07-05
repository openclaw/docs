---
read_when:
    - 你想用一个 API key 接入顶级开源 LLM
    - 你想在 OpenClaw 中通过 DeepInfra 的 API 运行模型
summary: 使用 DeepInfra 的统一 API，在 OpenClaw 中访问最受欢迎的开源模型和前沿模型
title: DeepInfra
x-i18n:
    generated_at: "2026-07-05T11:37:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f68bac84311d20348007c715803a34451ba8ab0c09beba63366ba5b1b29de05
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra 将请求路由到热门开源模型和前沿模型，并通过一个与 OpenAI 兼容的端点和 API 密钥提供服务。大多数 OpenAI SDK 只需切换基础 URL 即可使用它。

## 安装插件

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## 获取 API 密钥

1. 登录 [deepinfra.com](https://deepinfra.com/)
2. 前往仪表盘 / 密钥并生成一个密钥，或使用自动创建的密钥

## CLI 设置

```bash
openclaw onboard --deepinfra-api-key <key>
```

或设置环境变量：

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## 配置片段

```json5
{
  env: { DEEPINFRA_API_KEY: "<your-deepinfra-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V4-Flash" },
    },
  },
}
```

## 支持的接口面

配置 `DEEPINFRA_API_KEY` 后，聊天、图像生成和视频生成会从 `https://api.deepinfra.com/v1/openai/models?sort_by=openclaw&filter=with_meta` 实时刷新它们的模型目录。其他接口面在迁移到同一个实时目录之前，会使用下面的静态默认值。

| 接口面                   | 默认模型                                                                                              | OpenClaw 配置/工具                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 聊天 / 模型提供商        | 实时目录中第一个带聊天标签的条目（静态回退 `deepseek-ai/DeepSeek-V4-Flash`）                         | `agents.defaults.model`                                  |
| 图像生成/编辑            | 实时目录中第一个带 `image-gen` 标签的条目（静态回退 `black-forest-labs/FLUX-1-schnell`）             | `image_generate`, `agents.defaults.imageGenerationModel` |
| 媒体理解                 | 用于图像的 `moonshotai/Kimi-K2.5`                                                                     | 入站图像理解                                             |
| 语音转文本               | `openai/whisper-large-v3-turbo`                                                                       | 入站音频转录                                             |
| 文本转语音               | `hexgrad/Kokoro-82M`                                                                                  | `messages.tts.provider: "deepinfra"`                     |
| 视频生成                 | 静态回退 `Pixverse/Pixverse-T2V`（DeepInfra 当前没有实时 video-gen 行）                               | `video_generate`, `agents.defaults.videoGenerationModel` |
| 记忆嵌入                 | `BAAI/bge-m3`                                                                                         | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra 还公开重排序、分类、对象检测以及其他原生模型类型。OpenClaw 目前还没有这些类别的提供商契约，因此此插件不会注册它们。

## 可用模型

配置密钥后，OpenClaw 会动态发现 DeepInfra 模型。使用 `/models deepinfra` 或 `openclaw models list --provider deepinfra` 查看当前列表。

[deepinfra.com](https://deepinfra.com/) 上的任何模型都可以配合 `deepinfra/` 前缀使用：

```text
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...and many more
```

## 说明

- 模型引用为 `deepinfra/<provider>/<model>`（例如 `deepinfra/Qwen/Qwen3-Max`）。
- 默认聊天模型：`deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- 基础 URL：`https://api.deepinfra.com/v1/openai`
- 原生视频生成使用 `https://api.deepinfra.com/v1/inference/<model>`。

## 相关

- [模型提供商](/zh-CN/concepts/model-providers)
- [所有提供商](/zh-CN/providers/index)

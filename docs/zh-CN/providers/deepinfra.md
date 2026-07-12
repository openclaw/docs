---
read_when:
    - 你希望使用一个 API key 访问顶尖的开源大语言模型
    - 你想通过 DeepInfra 的 API 在 OpenClaw 中运行模型
summary: 使用 DeepInfra 的统一 API，在 OpenClaw 中访问最受欢迎的开源模型和前沿模型
title: DeepInfra
x-i18n:
    generated_at: "2026-07-11T20:52:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f68bac84311d20348007c715803a34451ba8ab0c09beba63366ba5b1b29de05
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra 通过单个兼容 OpenAI 的端点和 API key，将请求路由到热门开源模型和前沿模型。大多数 OpenAI SDK 只需切换基础 URL 即可使用它。

## 安装插件

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## 获取 API key

1. 在 [deepinfra.com](https://deepinfra.com/) 登录
2. 前往 Dashboard / Keys 并生成一个 key，或使用自动创建的 key

## CLI 设置

```bash
openclaw onboard --deepinfra-api-key <key>
```

或者设置环境变量：

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

## 支持的功能界面

配置 `DEEPINFRA_API_KEY` 后，聊天、图像生成和视频生成会从 `https://api.deepinfra.com/v1/openai/models?sort_by=openclaw&filter=with_meta` 实时刷新其模型目录。其他功能界面在迁移到同一个实时目录之前，会使用下方的静态默认值。

| 功能界面                 | 默认模型                                                                                                      | OpenClaw 配置/工具                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 聊天/模型提供商          | 实时目录中第一个带聊天标签的条目（静态回退为 `deepseek-ai/DeepSeek-V4-Flash`）                                | `agents.defaults.model`                                  |
| 图像生成/编辑            | 实时目录中第一个带 `image-gen` 标签的条目（静态回退为 `black-forest-labs/FLUX-1-schnell`）                   | `image_generate`, `agents.defaults.imageGenerationModel` |
| 媒体理解                 | 图像使用 `moonshotai/Kimi-K2.5`                                                                               | 入站图像理解                                             |
| 语音转文本               | `openai/whisper-large-v3-turbo`                                                                               | 入站音频转录                                             |
| 文本转语音               | `hexgrad/Kokoro-82M`                                                                                          | `messages.tts.provider: "deepinfra"`                     |
| 视频生成                 | 静态回退为 `Pixverse/Pixverse-T2V`（目前 DeepInfra 没有实时的 video-gen 条目）                               | `video_generate`, `agents.defaults.videoGenerationModel` |
| 记忆嵌入                 | `BAAI/bge-m3`                                                                                                 | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra 还提供重排序、分类、对象检测以及其他原生模型类型。OpenClaw 目前尚未为这些类别定义提供商契约，因此该插件不会注册它们。

## 可用模型

配置 key 后，OpenClaw 会动态发现 DeepInfra 模型。使用 `/models deepinfra` 或 `openclaw models list --provider deepinfra` 查看当前列表。

[deepinfra.com](https://deepinfra.com/) 上的任何模型都可以使用 `deepinfra/` 前缀：

```text
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
……以及更多模型
```

## 说明

- 模型引用格式为 `deepinfra/<provider>/<model>`（例如 `deepinfra/Qwen/Qwen3-Max`）。
- 默认聊天模型：`deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- 基础 URL：`https://api.deepinfra.com/v1/openai`
- 原生视频生成使用 `https://api.deepinfra.com/v1/inference/<model>`。

## 相关内容

- [模型提供商](/zh-CN/concepts/model-providers)
- [所有提供商](/zh-CN/providers/index)

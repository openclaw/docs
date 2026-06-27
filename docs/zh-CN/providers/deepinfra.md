---
read_when:
    - 你想为顶级开源 LLM 使用一个 API key
    - 你想在 OpenClaw 中通过 DeepInfra 的 API 运行模型
summary: 使用 DeepInfra 的统一 API，在 OpenClaw 中访问最受欢迎的开源模型和前沿模型
title: DeepInfra
x-i18n:
    generated_at: "2026-06-27T03:02:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 059a556c24d2de2c8c5290b54c78fbc7451dc534238bfc4c725dcfbbd9a2d17f
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra 提供一个**统一 API**，可通过单个端点和 API key 将请求路由到最受欢迎的开源模型和前沿模型。它兼容 OpenAI，因此大多数 OpenAI SDK 只需切换 base URL 即可使用。

## 安装插件

安装官方插件，然后重启 Gateway 网关：

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## 获取 API key

1. 前往 [https://deepinfra.com/](https://deepinfra.com/)
2. 登录或创建账号
3. 进入 Dashboard / Keys，生成新的 API key，或使用自动创建的 API key

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

## 支持的 OpenClaw 表面

该插件会注册所有符合当前 OpenClaw 提供商契约的 DeepInfra 表面。聊天、图像生成和视频生成会在配置 `DEEPINFRA_API_KEY` 后，从 `/v1/openai/models?sort_by=openclaw&filter=with_meta` 实时刷新其模型目录；其他表面使用下面整理好的静态默认值。

| 表面                     | 默认模型                                                                                              | OpenClaw 配置/工具                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 聊天 / 模型提供商        | 实时目录中第一个带 chat 标签的条目（清单回退值 `deepseek-ai/DeepSeek-V4-Flash`）                     | `agents.defaults.model`                                  |
| 图像生成/编辑            | 实时目录中第一个带 `image-gen` 标签的条目（静态回退值 `black-forest-labs/FLUX-1-schnell`）           | `image_generate`, `agents.defaults.imageGenerationModel` |
| 媒体理解                 | 图像使用 `moonshotai/Kimi-K2.5`                                                                       | 入站图像理解                                             |
| 语音转文本               | `openai/whisper-large-v3-turbo`                                                                       | 入站音频转写                                             |
| 文本转语音               | `hexgrad/Kokoro-82M`                                                                                  | `messages.tts.provider: "deepinfra"`                     |
| 视频生成                 | 实时目录中第一个带 `video-gen` 标签的条目（静态回退值 `Pixverse/Pixverse-T2V`）                      | `video_generate`, `agents.defaults.videoGenerationModel` |
| 记忆嵌入                 | `BAAI/bge-m3`                                                                                         | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra 还公开了重排序、分类、对象检测以及其他原生模型类型。OpenClaw 目前还没有这些类别的一等提供商契约，因此该插件尚未注册它们。

## 可用模型

OpenClaw 会在启动时动态发现可用的 DeepInfra 模型。使用 `/models deepinfra` 查看完整可用模型列表。

[DeepInfra.com](https://deepinfra.com/) 上可用的任何模型都可以配合 `deepinfra/` 前缀使用：

```
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...and many more
```

## 说明

- 模型引用格式为 `deepinfra/<provider>/<model>`（例如 `deepinfra/Qwen/Qwen3-Max`）。
- 默认模型：`deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- Base URL：`https://api.deepinfra.com/v1/openai`
- 原生视频生成使用 `https://api.deepinfra.com/v1/inference/<model>`。

## 相关

- [模型提供商](/zh-CN/concepts/model-providers)
- [所有提供商](/zh-CN/providers/index)

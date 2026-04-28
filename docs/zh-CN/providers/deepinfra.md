---
read_when:
    - 你想用一个 API 密钥访问顶级开源 LLM
    - 你想在 OpenClaw 中通过 DeepInfra 的 API 运行模型
summary: 在 OpenClaw 中使用 DeepInfra 的统一 API 访问最受欢迎的开源模型和前沿模型
x-i18n:
    generated_at: "2026-04-28T00:33:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22a178e7ac582e094f82f5779a9a963e0bf77b1b19820f74725255b6be0b0593
    source_path: providers/deepinfra.md
    workflow: 15
---

# DeepInfra

DeepInfra 提供一个**统一 API**，可通过单一端点和 API 密钥，将请求路由到最受欢迎的开源模型和前沿模型。它兼容 OpenAI，因此大多数 OpenAI SDK 只需切换 base URL 即可使用。

## 获取 API 密钥

1. 前往 [https://deepinfra.com/](https://deepinfra.com/)
2. 登录或创建账户
3. 进入 Dashboard / Keys，生成新的 API 密钥，或使用自动创建的密钥

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
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V3.2" },
    },
  },
}
```

## 支持的 OpenClaw 界面

内置插件会注册所有与当前 OpenClaw provider 契约匹配的 DeepInfra 界面：

| 界面 | 默认模型 | OpenClaw 配置/工具 |
| ------------------------ | ---------------------------------- | -------------------------------------------------------- |
| 聊天 / 模型 provider | `deepseek-ai/DeepSeek-V3.2` | `agents.defaults.model` |
| 图像生成/编辑 | `black-forest-labs/FLUX-1-schnell` | `image_generate`, `agents.defaults.imageGenerationModel` |
| 媒体理解 | 图像使用 `moonshotai/Kimi-K2.5` | 入站图像理解 |
| 语音转文本 | `openai/whisper-large-v3-turbo` | 入站音频转录 |
| 文本转语音 | `hexgrad/Kokoro-82M` | `messages.tts.provider: "deepinfra"` |
| 视频生成 | `Pixverse/Pixverse-T2V` | `video_generate`, `agents.defaults.videoGenerationModel` |
| 记忆嵌入 | `BAAI/bge-m3` | `agents.defaults.memorySearch.provider: "deepinfra"` |

DeepInfra 还提供重排序、分类、目标检测及其他原生模型类型。OpenClaw 当前尚未为这些类别提供一流的 provider 契约，因此此插件暂时不会注册它们。

## 可用模型

OpenClaw 会在启动时动态发现可用的 DeepInfra 模型。使用 `/models deepinfra` 查看完整的可用模型列表。

[DeepInfra.com](https://deepinfra.com/) 上可用的任何模型都可以通过 `deepinfra/` 前缀使用：

```
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/moonshotai/Kimi-K2.5
deepinfra/zai-org/GLM-5.1
...以及更多
```

## 说明

- 模型引用格式为 `deepinfra/<provider>/<model>`（例如 `deepinfra/Qwen/Qwen3-Max`）。
- 默认模型：`deepinfra/deepseek-ai/DeepSeek-V3.2`
- Base URL：`https://api.deepinfra.com/v1/openai`
- 原生视频生成使用 `https://api.deepinfra.com/v1/inference/<model>`。

---
read_when:
    - 你想将 Together AI 与 OpenClaw 搭配使用
    - 你需要 API key 环境变量或 CLI 身份验证选择
summary: Together AI 设置（凭证 + 模型选择）
title: Together AI
x-i18n:
    generated_at: "2026-06-27T03:10:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1f803ae88828a775d93dcf8b0b62e70b1dbd0cf963639121e2995fabfcd280b
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) 通过统一 API 提供对领先开源模型的访问，包括 Llama、DeepSeek、Kimi 等。

| 属性 | 值                            |
| -------- | ----------------------------- |
| 提供商 | `together`                    |
| 凭证     | `TOGETHER_API_KEY`            |
| API      | OpenAI 兼容             |
| 基础 URL | `https://api.together.xyz/v1` |

## 入门指南

<Steps>
  <Step title="获取 API key">
    在
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys)
    创建 API key。
  </Step>
  <Step title="运行新手引导">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="设置默认模型">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "together/meta-llama/Llama-3.3-70B-Instruct-Turbo",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

### 非交互式示例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
新手引导预设会将
`together/meta-llama/Llama-3.3-70B-Instruct-Turbo` 设置为默认模型。
</Note>

## 内置目录

OpenClaw 随附此内置 Together 目录：

| 模型引用                                           | 名称                         | 输入       | 上下文 | 说明                |
| -------------------------------------------------- | ---------------------------- | ----------- | ------- | -------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | 文本        | 131,072 | 默认模型        |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | 文本、图像 | 262,144 | Kimi 推理模型 |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | 文本        | 512,000 | 推理文本模型 |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | 文本        | 32,768  | 快速文本模型      |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | 文本        | 202,752 | 推理文本模型 |

## 视频生成

内置的 `together` 插件还通过共享的
`video_generate` 工具注册视频生成功能。

| 属性             | 值                                                                    |
| -------------------- | ------------------------------------------------------------------------ |
| 默认视频模型  | `together/Wan-AI/Wan2.2-T2V-A14B`                                        |
| 模式                | 文本转视频；仅支持使用 `Wan-AI/Wan2.2-I2V-A14B` 的单图像参考 |
| 支持的参数 | `aspectRatio`, `resolution`                                              |

要将 Together 用作默认视频提供商：

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "together/Wan-AI/Wan2.2-T2V-A14B",
      },
    },
  },
}
```

<Tip>
参阅 [视频生成](/zh-CN/tools/video-generation)，了解共享工具参数、
提供商选择和故障转移行为。
</Tip>

<AccordionGroup>
  <Accordion title="环境说明">
    如果 Gateway 网关 作为守护进程运行（launchd/systemd），请确保
    `TOGETHER_API_KEY` 可供该进程使用（例如，在
    `~/.openclaw/.env` 中，或通过 `env.shellEnv`）。

    <Warning>
    仅在你的交互式 shell 中设置的密钥对守护进程管理的
    gateway 进程不可见。请使用 `~/.openclaw/.env` 或 `env.shellEnv`
    配置来保证持久可用。
    </Warning>

  </Accordion>

  <Accordion title="故障排除">
    - 验证你的密钥可用：`openclaw models list --provider together`
    - 如果模型未显示，请确认 API key 已在你的 Gateway 网关进程所用的正确
      环境中设置。
    - 模型引用使用 `together/<model-id>` 形式。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    提供商规则、模型引用和故障转移行为。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享视频生成工具参数和提供商选择。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    完整配置架构，包括提供商设置。
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Together AI 仪表板、API 文档和定价。
  </Card>
</CardGroup>

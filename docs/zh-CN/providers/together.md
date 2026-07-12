---
read_when:
    - 你想将 Together AI 与 OpenClaw 搭配使用
    - 你需要 API key 环境变量或 CLI 身份验证选项
summary: Together AI 设置（身份验证 + 模型选择）
title: Together AI
x-i18n:
    generated_at: "2026-07-11T20:55:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0860ac6e8092bb4eb48d3c0d348d5c42f538e0316d2fa22a99cbb3a9851b1185
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) 通过统一 API 提供对 Llama、DeepSeek、Kimi 等领先开源模型的访问。
OpenClaw 将其内置为 `together` 提供商。

| 属性 | 值                            |
| ---- | ----------------------------- |
| 提供商 | `together`                    |
| 身份验证 | `TOGETHER_API_KEY`            |
| API  | 兼容 OpenAI                   |
| 基础 URL | `https://api.together.xyz/v1` |

## 入门指南

<Steps>
  <Step title="Get an API key">
    在
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys)
    创建 API key。
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="Set a default model">
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
新手引导会将 `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` 设为
默认模型。
</Note>

## 内置目录

费用单位为每百万 token 的美元价格。

| 模型引用                                           | 名称                         | 输入       | 上下文  | 最大输出 | 费用（输入/输出） | 备注           |
| -------------------------------------------------- | ---------------------------- | ---------- | ------- | -------- | ----------------- | -------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | 文本       | 131,072 | 8,192    | 0.88 / 0.88       | 默认模型       |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | 文本、图像 | 262,144 | 32,768   | 1.20 / 4.50       | 推理模型       |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | 文本       | 512,000 | 8,192    | 2.10 / 4.40       | 推理模型       |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | 文本       | 32,768  | 8,192    | 0.30 / 0.30       | 快速、非推理型 |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | 文本       | 202,752 | 8,192    | 1.40 / 4.40       | 推理模型       |

## 视频生成

内置的 `together` 插件还通过共享的 `video_generate` 工具注册视频生成功能。

| 属性         | 值                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------- |
| 默认视频模型 | `Wan-AI/Wan2.2-T2V-A14B`                                                                  |
| 其他模型     | `Wan-AI/Wan2.2-I2V-A14B`、`minimax/Hailuo-02`、`Kwai/Kling-2.1-Master`                    |
| 模式         | 文本生成视频；仅 `Wan-AI/Wan2.2-I2V-A14B` 支持图像生成视频（单张参考图像）                |
| 时长         | 1–10 秒                                                                                   |
| 支持的参数   | `size`（按 `<width>x<height>` 解析）；不读取 `aspectRatio`/`resolution`                   |

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
有关共享工具参数、提供商选择和故障转移行为，请参阅[视频生成](/zh-CN/tools/video-generation)。
</Tip>

<AccordionGroup>
  <Accordion title="Environment note">
    如果 Gateway 网关作为守护进程（launchd/systemd）运行，请确保该进程可以访问
    `TOGETHER_API_KEY`（例如，将其放在 `~/.openclaw/.env` 中，或通过
    `env.shellEnv` 提供）。

    <Warning>
    仅在交互式 shell 中设置的密钥对守护进程管理的 Gateway 网关进程不可见。
    请使用 `~/.openclaw/.env` 或 `env.shellEnv` 配置来确保其持续可用。
    </Warning>

  </Accordion>

  <Accordion title="Troubleshooting">
    - 验证你的密钥是否有效：`openclaw models list --provider together`
    - 如果模型未显示，请确认 API key 已在 Gateway 网关进程使用的正确环境中设置。
    - 模型引用采用 `together/<model-id>` 格式。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="Model providers" href="/zh-CN/concepts/model-providers" icon="layers">
    提供商规则、模型引用和故障转移行为。
  </Card>
  <Card title="Video generation" href="/zh-CN/tools/video-generation" icon="video">
    共享视频生成工具的参数和提供商选择。
  </Card>
  <Card title="Configuration reference" href="/zh-CN/gateway/configuration-reference" icon="gear">
    完整的配置模式，包括提供商设置。
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Together AI 控制面板、API 文档和定价。
  </Card>
</CardGroup>

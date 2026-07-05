---
read_when:
    - 你想将 Together AI 与 OpenClaw 一起使用
    - 你需要 API 密钥环境变量或 CLI 凭证选项
summary: Together AI 设置（凭证 + 模型选择）
title: Together AI
x-i18n:
    generated_at: "2026-07-05T11:39:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0860ac6e8092bb4eb48d3c0d348d5c42f538e0316d2fa22a99cbb3a9851b1185
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) 通过统一 API 提供对领先开源模型的访问，包括 Llama、DeepSeek、Kimi 等。
OpenClaw 将它内置为 `together` 提供商。

| 属性 | 值                            |
| -------- | ----------------------------- |
| 提供商 | `together`                    |
| 认证     | `TOGETHER_API_KEY`            |
| API      | OpenAI 兼容             |
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
新手引导会将 `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` 设置为默认模型。
</Note>

## 内置目录

费用以每百万 token 的美元价格计算。

| 模型引用                                           | 名称                         | 输入        | 上下文 | 最大输出 | 成本（输入/输出） | 备注                |
| -------------------------------------------------- | ---------------------------- | ----------- | ------- | ---------- | ------------- | ------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | 文本        | 131,072 | 8,192      | 0.88 / 0.88   | 默认模型       |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | 文本、图像 | 262,144 | 32,768     | 1.20 / 4.50   | 推理模型     |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | 文本        | 512,000 | 8,192      | 2.10 / 4.40   | 推理模型     |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | 文本        | 32,768  | 8,192      | 0.30 / 0.30   | 快速，非推理 |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | 文本        | 202,752 | 8,192      | 1.40 / 4.40   | 推理模型     |

## 视频生成

内置的 `together` 插件还会通过共享的 `video_generate` 工具注册视频生成能力。

| 属性             | 值                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------- |
| 默认视频模型  | `Wan-AI/Wan2.2-T2V-A14B`                                                                  |
| 其他模型         | `Wan-AI/Wan2.2-I2V-A14B`、`minimax/Hailuo-02`、`Kwai/Kling-2.1-Master`                    |
| 模式                | 文本转视频；仅 `Wan-AI/Wan2.2-I2V-A14B` 支持图像转视频（单张参考图像） |
| 时长             | 1-10 秒                                                                              |
| 支持的参数 | `size`（按 `<width>x<height>` 解析）；不会读取 `aspectRatio`/`resolution`            |

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
参阅[视频生成](/zh-CN/tools/video-generation)，了解共享工具参数、提供商选择和故障转移行为。
</Tip>

<AccordionGroup>
  <Accordion title="Environment note">
    如果 Gateway 网关 作为守护进程（launchd/systemd）运行，请确保
    `TOGETHER_API_KEY` 可供该进程使用（例如，在
    `~/.openclaw/.env` 中，或通过 `env.shellEnv`）。

    <Warning>
    仅在你的交互式 shell 中设置的密钥，对守护进程管理的 Gateway 网关 进程不可见。请使用 `~/.openclaw/.env` 或 `env.shellEnv` 配置来保证持久可用。
    </Warning>

  </Accordion>

  <Accordion title="Troubleshooting">
    - 验证你的密钥可用：`openclaw models list --provider together`
    - 如果模型没有出现，请确认 API key 已在你的 Gateway 网关 进程的正确环境中设置。
    - 模型引用使用 `together/<model-id>` 形式。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="Model providers" href="/zh-CN/concepts/model-providers" icon="layers">
    提供商规则、模型引用和故障转移行为。
  </Card>
  <Card title="Video generation" href="/zh-CN/tools/video-generation" icon="video">
    共享的视频生成工具参数和提供商选择。
  </Card>
  <Card title="Configuration reference" href="/zh-CN/gateway/configuration-reference" icon="gear">
    完整配置 schema，包括提供商设置。
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Together AI 仪表板、API 文档和定价。
  </Card>
</CardGroup>

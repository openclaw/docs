---
read_when:
    - 你想在 OpenClaw 中使用 Together AI
    - 你需要 API 密钥环境变量或 CLI 认证选项
summary: Together AI 设置（认证 + 模型选择）
title: Together AI
x-i18n:
    generated_at: "2026-04-12T10:26:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 33531a1646443ac2e46ee1fbfbb60ec71093611b022618106e8e5435641680ac
    source_path: providers/together.md
    workflow: 15
---

# Together AI

[Together AI](https://together.ai) 通过统一的 API 提供对领先开源模型的访问，包括 Llama、DeepSeek、Kimi 等。

| Property | Value                         |
| -------- | ----------------------------- |
| 提供商 | `together`                    |
| 认证     | `TOGETHER_API_KEY`            |
| API      | 与 OpenAI 兼容             |
| Base URL | `https://api.together.xyz/v1` |

## 入门指南

<Steps>
  <Step title="获取 API 密钥">
    在
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys)
    创建一个 API 密钥。
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
          model: { primary: "together/moonshotai/Kimi-K2.5" },
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
新手引导预设会将 `together/moonshotai/Kimi-K2.5` 设置为默认模型。
</Note>

## 内置目录

OpenClaw 附带以下 Together 目录：

| Model ref                                                    | Name                                   | Input       | Context    | Notes                            |
| ------------------------------------------------------------ | -------------------------------------- | ----------- | ---------- | -------------------------------- |
| `together/moonshotai/Kimi-K2.5`                              | Kimi K2.5                              | 文本、图像 | 262,144    | 默认模型；已启用推理 |
| `together/zai-org/GLM-4.7`                                   | GLM 4.7 Fp8                            | 文本        | 202,752    | 通用文本模型       |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`           | Llama 3.3 70B Instruct Turbo           | 文本        | 131,072    | 快速指令模型           |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`         | Llama 4 Scout 17B 16E Instruct         | 文本、图像 | 10,000,000 | 多模态                       |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | 文本、图像 | 20,000,000 | 多模态                       |
| `together/deepseek-ai/DeepSeek-V3.1`                         | DeepSeek V3.1                          | 文本        | 131,072    | 通用文本模型               |
| `together/deepseek-ai/DeepSeek-R1`                           | DeepSeek R1                            | 文本        | 131,072    | 推理模型                  |
| `together/moonshotai/Kimi-K2-Instruct-0905`                  | Kimi K2-Instruct 0905                  | 文本        | 262,144    | 次要 Kimi 文本模型        |

## 视频生成

内置的 `together` 插件还会通过共享的 `video_generate` 工具注册视频生成功能。

| Property             | Value                                 |
| -------------------- | ------------------------------------- |
| 默认视频模型  | `together/Wan-AI/Wan2.2-T2V-A14B`     |
| 模式                | 文本到视频、单图参考 |
| 支持的参数 | `aspectRatio`, `resolution`           |

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
参见 [视频生成](/zh-CN/tools/video-generation)，了解共享工具参数、提供商选择和故障切换行为。
</Tip>

<AccordionGroup>
  <Accordion title="环境说明">
    如果 Gateway 网关 作为守护进程运行（launchd/systemd），请确保
    `TOGETHER_API_KEY` 对该进程可用（例如在
    `~/.openclaw/.env` 中，或通过 `env.shellEnv`）。

    <Warning>
    仅在你的交互式 shell 中设置的密钥对由守护进程管理的
    Gateway 网关 进程不可见。请使用 `~/.openclaw/.env` 或
    `env.shellEnv` 配置来确保持续可用。
    </Warning>

  </Accordion>

  <Accordion title="故障排除">
    - 验证你的密钥是否可用：`openclaw models list --provider together`
    - 如果模型没有显示，请确认 API 密钥已在你的 Gateway 网关 进程对应的正确环境中设置。
    - 模型引用使用 `together/<model-id>` 这种格式。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型提供商" href="/zh-CN/concepts/model-providers" icon="layers">
    提供商规则、模型引用和故障切换行为。
  </Card>
  <Card title="视频生成" href="/zh-CN/tools/video-generation" icon="video">
    共享视频生成工具参数和提供商选择。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    完整的配置 schema，包括提供商设置。
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Together AI 控制台、API 文档和定价。
  </Card>
</CardGroup>

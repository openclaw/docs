---
read_when:
    - 你想在 OpenClaw 中免费使用开放模型
    - 你需要设置 NVIDIA_API_KEY
    - 你想通过 NVIDIA 使用 Nemotron 3 Ultra
summary: 在 OpenClaw 中使用 NVIDIA 的 OpenAI 兼容 API
title: NVIDIA
x-i18n:
    generated_at: "2026-07-05T11:37:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3300395fdaf9baf22476f9b4d5a5b217ddab1aa10042c5959ffa059c3a258de4
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA 通过位于 `https://integrate.api.nvidia.com/v1` 的兼容 OpenAI 的 API 免费提供开放模型，并使用来自 [build.nvidia.com](https://build.nvidia.com/settings/api-keys) 的 API key 进行身份验证。OpenClaw 默认将 NVIDIA provider 设为 Nemotron 3 Ultra，这是 NVIDIA 的 550B 总参数 / 55B 激活参数推理模型，适用于长上下文智能体工作。

## 入门指南

<Steps>
  <Step title="获取你的 API key">
    在 [build.nvidia.com](https://build.nvidia.com/settings/api-keys) 创建 API key。
  </Step>
  <Step title="导出密钥并运行新手引导">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="设置 NVIDIA 模型">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

对于非交互式设置，请直接传入密钥：

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

<Warning>
`--nvidia-api-key` 会让密钥进入 shell 历史记录和 `ps` 输出。尽可能优先使用 `NVIDIA_API_KEY` 环境变量。
</Warning>

## 配置示例

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-ultra-550b-a55b" },
    },
  },
}
```

## 精选目录

配置 NVIDIA API key 后，设置和模型选择路径会从 `https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` 获取 NVIDIA 的公开精选模型目录，并将结果缓存 24 小时（前 32 个条目，作为免费文本输入行导入）。因此，build.nvidia.com 上的新精选模型会出现在设置和模型选择界面中，而无需等待 OpenClaw 发布。当实时源可用时，返回的第一个模型会成为 NVIDIA 设置期间的预选选项。

获取过程会对 `assets.ngc.nvidia.com` 使用固定 HTTPS 主机策略。如果未配置 NVIDIA API key，或者该源不可用或格式异常，OpenClaw 会回退到下面的内置目录和内置默认值。

## Nemotron 3 Ultra

Nemotron 3 Ultra 是 OpenClaw 中的默认 NVIDIA 模型。NVIDIA 关于 [`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b) 的构建页面将其列为可用的免费端点，并标明 1M token 上下文规格。内置目录记录了 16,384 token 的最大输出，以匹配 NVIDIA 当前针对托管端点的兼容 OpenAI 的示例请求。

内置 Ultra 行默认发送 `chat_template_kwargs: { enable_thinking: false, force_nonempty_content: true }`，因此普通聊天输出会保留在可见答案中，而不会暴露推理文本。

如果需要最高能力的 NVIDIA 默认模型，请使用 Ultra。如果你想要较小的 Nemotron 3 选项，请继续选择 Super；或者在 NVIDIA 目录中托管的第三方模型的上下文、延迟或行为更合适时，选择其中之一。

## 内置回退目录

| 模型引用                                   | 名称                         | 上下文    | 最大输出 | 说明                                      |
| ------------------------------------------ | ---------------------------- | --------- | ---------- | ---------------------------------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384     | 默认                                  |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 1,048,576 | 8,192      |                                          |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192      |                                          |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192      |                                          |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192      |                                          |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192      | 已弃用；使用 `minimaxai/minimax-m2.7` |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192      | 已弃用；使用 `z-ai/glm-5.1`           |

## 高级配置

<AccordionGroup>
  <Accordion title="自动启用行为">
    当设置了 `NVIDIA_API_KEY` 环境变量，或新手引导期间存储了密钥时，该 provider 会自动启用。除密钥外，不需要显式 provider 配置。
  </Accordion>

  <Accordion title="目录和定价">
    配置 NVIDIA 身份验证后，OpenClaw 会优先使用 NVIDIA 的公开精选模型目录，并将其缓存 24 小时。内置回退目录是静态的，并保留已发布的弃用引用以保持升级兼容性。源代码中的成本默认值为 `0`，因为 NVIDIA 目前为列出的模型提供免费 API 访问。
  </Accordion>

  <Accordion title="兼容 OpenAI 的端点">
    OpenClaw 使用 `openai-completions` 适配器，通过标准 `/v1` 聊天补全路由与 NVIDIA 通信。任何兼容 OpenAI 的工具都应能通过 NVIDIA base URL 开箱即用。
  </Accordion>

  <Accordion title="Nemotron 3 Ultra 推理参数">
    NVIDIA 的 Ultra 示例请求使用 `chat_template_kwargs.enable_thinking` 和 `reasoning_budget` 输出推理内容。OpenClaw 的内置 Ultra 行默认禁用模板思考，以适配普通聊天用途。如果你需要选择启用 NVIDIA 推理输出，或强制使用其他 NVIDIA 专用请求字段，请设置按模型参数，并将 provider 专用覆盖限制在 NVIDIA 模型范围内：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "nvidia/nvidia/nemotron-3-ultra-550b-a55b": {
              params: {
                chat_template_kwargs: { enable_thinking: true },
                extra_body: { reasoning_budget: 16384 },
              },
            },
          },
        },
      },
    }
    ```

    `params.chat_template_kwargs` 会合并到请求中已有的任何 `chat_template_kwargs`，而不是替换整个对象。`params.extra_body` 是最终的兼容 OpenAI 的请求体覆盖项，会覆盖冲突的载荷键，因此仅应将其用于 NVIDIA 为所选端点记录的字段。

  </Accordion>

  <Accordion title="较慢的自定义 provider 响应">
    某些由 NVIDIA 托管的自定义模型可能会比默认约 120 秒的模型空闲看门狗更久才发出第一个响应分块。对于自定义 NVIDIA provider 条目，请提高 provider 超时时间，而不是整个 Agent Runtimes 超时时间；`timeoutSeconds` 覆盖 provider HTTP 请求，并提高该 provider 的空闲/流式看门狗上限：

    ```json5
    {
      models: {
        providers: {
          "custom-integrate-api-nvidia-com": {
            baseUrl: "https://integrate.api.nvidia.com/v1",
            api: "openai-completions",
            apiKey: "NVIDIA_API_KEY",
            timeoutSeconds: 300,
          },
        },
      },
      agents: {
        defaults: {
          models: {
            "custom-integrate-api-nvidia-com/meta/llama-3.1-70b-instruct": {
              params: { thinking: "off" },
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

<Tip>
NVIDIA 模型目前可以免费使用。请查看 [build.nvidia.com](https://build.nvidia.com/) 获取最新可用性和速率限制详情。
</Tip>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择 provider、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    针对智能体、模型和 provider 的完整配置参考。
  </Card>
</CardGroup>

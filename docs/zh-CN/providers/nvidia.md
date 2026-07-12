---
read_when:
    - 你想在 OpenClaw 中免费使用开放模型
    - 你需要设置 NVIDIA_API_KEY
    - 你想通过 NVIDIA 使用 Nemotron 3 Ultra
summary: 在 OpenClaw 中使用 NVIDIA 的 OpenAI 兼容 API
title: NVIDIA
x-i18n:
    generated_at: "2026-07-12T14:44:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b5ac7bcc19400a661b2f2861a1dd4d2306c94e445783929e342e9184003314e9
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA 通过位于 `https://integrate.api.nvidia.com/v1` 的 OpenAI 兼容 API 免费提供开放模型，使用从 [build.nvidia.com](https://build.nvidia.com/settings/api-keys) 获取的 API key 进行身份验证。OpenClaw 默认将 NVIDIA 提供商的模型设为 Nemotron 3 Ultra，这是 NVIDIA 面向长上下文智能体任务的推理模型，总参数量为 550B，激活参数量为 55B。

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
`--nvidia-api-key` 会将密钥留在 shell 历史记录和 `ps` 输出中。请尽可能优先使用 `NVIDIA_API_KEY` 环境变量。
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

配置 NVIDIA API key 后，设置和模型选择路径会从 `https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` 获取 NVIDIA 的公开精选模型目录，并将结果缓存 24 小时（取前 32 个条目，并作为免费文本输入行导入）。因此，build.nvidia.com 上新增的精选模型无需等待 OpenClaw 发布新版本，就会出现在设置和模型选择界面中。当实时源可用时，返回的第一个模型会在 NVIDIA 设置期间成为预选选项。

获取操作对 `assets.ngc.nvidia.com` 使用固定的 HTTPS 主机策略。如果未配置 NVIDIA API key，或者数据源不可用或格式不正确，OpenClaw 会回退到下方的内置目录和内置默认值。

## Nemotron 3 Ultra

Nemotron 3 Ultra 是 OpenClaw 中默认的 NVIDIA 模型。NVIDIA 的 [`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b) 构建页面将其列为可用的免费端点，并标明 1M token 上下文规格。

内置的 Ultra 条目默认发送 `chat_template_kwargs: { enable_thinking: false, force_nonempty_content: true }`，使普通聊天输出保留在可见答案中，而不是暴露推理文本。

如需使用能力最强的 NVIDIA 默认模型，请选择 Ultra。如果你希望使用更小的 Nemotron 3 选项，请继续选择 Super；如果 NVIDIA 目录中托管的第三方模型在上下文、延迟或行为方面更合适，也可以选择其中之一。

## 内置回退目录

可选择的内置条目是 NVIDIA 精选模型目录的快照。已弃用的兼容性条目仍可通过精确引用解析，但不会出现在模型选择器中。

| 模型引用                                   | 名称                   | 上下文    | 最大输出   |
| ------------------------------------------ | --------------------- | --------- | ---------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | Nemotron 3 Ultra 550B | 1,048,576 | 8,192      |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | Nemotron 3 Super 120B | 1,000,000 | 8,192      |
| `nvidia/z-ai/glm-5.2`                      | GLM 5.2               | 202,752   | 8,192      |
| `nvidia/moonshotai/kimi-k2.6`              | Kimi K2.6             | 262,144   | 8,192      |
| `nvidia/minimaxai/minimax-m3`              | Minimax M3            | 196,608   | 8,192      |
| `nvidia/deepseek-ai/deepseek-v4-pro`       | DeepSeek V4 Pro       | 262,144   | 16,384     |
| `nvidia/qwen/qwen3.5-397b-a17b`            | Qwen3.5 397B A17B     | 262,144   | 16,384     |

完整兼容性目录还保留了以下已发布引用，以支持现有配置：`nvidia/moonshotai/kimi-k2.5`、`nvidia/z-ai/glm-5.1`、`nvidia/minimaxai/minimax-m2.5`、`nvidia/z-ai/glm5` 和 `nvidia/minimaxai/minimax-m2.7`。它们仍可通过精确引用使用，但不会出现在新手引导或模型选择器中。

## 高级配置

<AccordionGroup>
  <Accordion title="自动启用行为">
    设置 `NVIDIA_API_KEY` 环境变量，或在新手引导期间存储密钥后，提供商会自动启用。除密钥外，无需显式配置提供商。
  </Accordion>

  <Accordion title="目录和定价">
    配置 NVIDIA 身份验证后，OpenClaw 会优先使用 NVIDIA 的公开精选模型目录，并将其缓存 24 小时。可选择的内置回退目录是 NVIDIA 精选模型目录的静态快照；已弃用、仅支持精确引用的兼容性条目不会显示在模型选择器中。由于 NVIDIA 目前为列出的模型提供免费 API 访问，因此源代码中的成本默认为 `0`。
  </Accordion>

  <Accordion title="OpenAI 兼容端点">
    OpenClaw 使用 `openai-completions` 适配器，通过标准 `/v1` 聊天补全路由与 NVIDIA 通信。任何 OpenAI 兼容工具都应当能使用 NVIDIA 基础 URL 直接工作。
  </Accordion>

  <Accordion title="Nemotron 3 Ultra 推理参数">
    NVIDIA 的 Ultra 示例请求使用 `chat_template_kwargs.enable_thinking` 和 `reasoning_budget` 控制推理输出。OpenClaw 内置的 Ultra 条目默认禁用模板思考，以供普通聊天使用。如果你需要启用 NVIDIA 推理输出或强制使用其他 NVIDIA 特定请求字段，请设置每模型参数，并将提供商特定覆盖限制在 NVIDIA 模型范围内：

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

    `params.chat_template_kwargs` 会合并到请求中已有的任何 `chat_template_kwargs`，而不是替换整个对象。
    `params.extra_body` 是最终的 OpenAI 兼容请求正文覆盖项，会覆盖发生冲突的负载键，因此请仅将其用于 NVIDIA 针对所选端点记录的字段。

  </Accordion>

  <Accordion title="自定义提供商响应缓慢">
    某些由 NVIDIA 托管的自定义模型可能需要超过默认约 120s 的模型空闲看门狗时间，才能发出第一个响应块。对于自定义 NVIDIA 提供商条目，请提高提供商超时时间，而不是整个智能体运行时超时时间；`timeoutSeconds` 适用于提供商 HTTP 请求，并会提高该提供商的空闲/流式传输看门狗上限：

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
NVIDIA 模型目前可免费使用。请在 [build.nvidia.com](https://build.nvidia.com/) 查看最新的可用性和速率限制详情。
</Tip>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    智能体、模型和提供商的完整配置参考。
  </Card>
</CardGroup>

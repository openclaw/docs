---
read_when:
    - 你想在 OpenClaw 中免费使用开放模型
    - 你需要设置 NVIDIA_API_KEY
    - 你想通过 NVIDIA 使用 Nemotron 3 Ultra
summary: 在 OpenClaw 中使用 NVIDIA 的 OpenAI 兼容 API
title: NVIDIA
x-i18n:
    generated_at: "2026-07-01T20:12:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b738746acead8dcaa74a39b13b4413171c5bf60efa5166dbc9b259d883a4e22
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA 在 `https://integrate.api.nvidia.com/v1` 提供 OpenAI 兼容 API，可免费使用
开放模型。使用来自
[build.nvidia.com](https://build.nvidia.com/settings/api-keys) 的 API key 进行认证。OpenClaw
默认将 NVIDIA provider 设为 Nemotron 3 Ultra，这是 NVIDIA 面向长上下文 Agent 工作的 550B 总参数 / 55B
活跃推理模型。

## 入门指南

<Steps>
  <Step title="获取你的 API key">
    在 [build.nvidia.com](https://build.nvidia.com/settings/api-keys) 创建 API key。
  </Step>
  <Step title="导出 key 并运行新手引导">
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

<Warning>
如果你传入 `--nvidia-api-key` 而不是环境变量，该值会进入 shell
历史记录和 `ps` 输出。可行时优先使用 `NVIDIA_API_KEY` 环境变量。
</Warning>

对于非交互式设置，也可以直接传入 key：

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

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

配置 NVIDIA API key 后，OpenClaw 设置和模型选择路径会尝试从
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` 获取 NVIDIA 的公开精选模型目录，并将排序后的结果缓存 24 小时。因此，build.nvidia.com
上的新精选模型会显示在设置和模型选择界面中，无需等待
OpenClaw 发布。当实时 feed 可用时，返回的第一个模型就是 NVIDIA 设置期间显示的默认选项。

该拉取使用针对 `assets.ngc.nvidia.com` 的固定 HTTPS 主机策略。如果未配置
NVIDIA API key，或该公开目录不可用或格式不正确，OpenClaw 会回退到下面的内置目录和内置默认值。

## Nemotron 3 Ultra

Nemotron 3 Ultra 是 OpenClaw 中的默认 NVIDIA 模型。NVIDIA 的
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
构建页面将其列为可用的免费端点，并标注 1M-token 上下文规格。
内置目录记录了 16,384-token 的最大输出，以匹配 NVIDIA 当前针对托管端点的
OpenAI 兼容示例请求。

如果你想使用能力最高的 NVIDIA 默认模型，请使用 Ultra。如果你想要更小的
Nemotron 3 选项，请继续选择 Super；或者当 NVIDIA 目录中托管的第三方模型在上下文、延迟或行为上更合适时，选择其中之一。
内置 Ultra 行默认发送 `chat_template_kwargs.enable_thinking: false` 和
`force_nonempty_content: true`，因此普通聊天输出会保留在可见答案中，而不是暴露推理文本。

## 内置回退目录

| Model ref                                  | 名称                         | 上下文    | 最大输出 | 说明                             |
| ------------------------------------------ | ---------------------------- | --------- | ---------- | --------------------------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384     | 默认                           |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 1,048,576 | 8,192      | 精选回退                 |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192      | 精选回退                 |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192      | 精选回退                 |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192      | 精选回退                 |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192      | 已弃用，升级兼容性 |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192      | 已弃用，升级兼容性 |

## 高级配置

<AccordionGroup>
  <Accordion title="自动启用行为">
    当设置了 `NVIDIA_API_KEY` 环境变量时，provider 会自动启用。
    除 key 外，不需要显式 provider 配置。
  </Accordion>

  <Accordion title="目录和定价">
    配置 NVIDIA 认证后，OpenClaw 优先使用 NVIDIA 的公开精选模型目录，并将其缓存 24 小时。内置回退目录是静态的，
    并保留已弃用的已发布 refs 以支持升级兼容性。由于 NVIDIA 目前为列出的模型提供免费 API 访问，源码中的成本默认
    为 `0`。
  </Accordion>

  <Accordion title="OpenAI 兼容端点">
    NVIDIA 使用标准的 `/v1` completions 端点。任何 OpenAI 兼容
    工具都应该能直接配合 NVIDIA base URL 使用。
  </Accordion>

  <Accordion title="Nemotron 3 Ultra 推理参数">
    NVIDIA 的 Ultra 示例请求使用 `chat_template_kwargs.enable_thinking`
    和 `reasoning_budget` 输出推理内容。OpenClaw 的内置 Ultra 行
    默认禁用模板思考，以适配普通聊天使用。如果你需要
    选择启用 NVIDIA 推理输出，或强制使用其他 NVIDIA 特定请求
    字段，请设置按模型参数，并将 provider 特定覆盖限定到
    NVIDIA 模型：

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

    `params.extra_body` 是最终的 OpenAI 兼容请求体覆盖，因此
    只将它用于 NVIDIA 为所选端点记录的字段。

  </Accordion>

  <Accordion title="慢速自定义 provider 响应">
    某些 NVIDIA 托管的自定义模型在发出第一个响应分块之前，可能会比默认模型空闲
    watchdog 等待得更久。对于自定义 NVIDIA provider
    条目，请提高 provider timeout，而不是提高整个 agent
    运行时 timeout：

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
NVIDIA 模型目前可免费使用。请查看
[build.nvidia.com](https://build.nvidia.com/) 获取最新可用性和
速率限制详情。
</Tip>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择 providers、model refs 和故障转移行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    agents、models 和 providers 的完整配置参考。
  </Card>
</CardGroup>

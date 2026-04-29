---
read_when:
    - 你想在 OpenClaw 中免费使用开放模型
    - 你需要设置 NVIDIA_API_KEY
summary: 在 OpenClaw 中使用 NVIDIA 的 OpenAI 兼容 API
title: NVIDIA
x-i18n:
    generated_at: "2026-04-29T16:28:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 297cc25cf5235bb51f3962c2a1b8799ca6544d57e701c42e9b1e1c7d881ad32b
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA 在 `https://integrate.api.nvidia.com/v1` 提供 OpenAI 兼容 API，可免费使用开放模型。使用来自 [build.nvidia.com](https://build.nvidia.com/settings/api-keys) 的 API 密钥进行身份验证。

## 入门指南

<Steps>
  <Step title="获取你的 API 密钥">
    在 [build.nvidia.com](https://build.nvidia.com/settings/api-keys) 创建一个 API 密钥。
  </Step>
  <Step title="导出密钥并运行新手引导">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="设置 NVIDIA 模型">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
如果你传入 `--nvidia-api-key` 而不是环境变量，该值会进入 shell 历史记录和 `ps` 输出。尽可能优先使用 `NVIDIA_API_KEY` 环境变量。
</Warning>

对于非交互式设置，你也可以直接传入密钥：

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
      model: { primary: "nvidia/nvidia/nemotron-3-super-120b-a12b" },
    },
  },
}
```

## 内置目录

| 模型 ref                                   | 名称                         | 上下文  | 最大输出 |
| ------------------------------------------ | ---------------------------- | ------- | -------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144 | 8,192    |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144 | 8,192    |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608 | 8,192    |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752 | 8,192    |

## 高级配置

<AccordionGroup>
  <Accordion title="自动启用行为">
    当设置了 `NVIDIA_API_KEY` 环境变量时，提供商会自动启用。除了密钥以外，不需要显式的提供商配置。
  </Accordion>

  <Accordion title="目录和定价">
    内置目录是静态的。由于 NVIDIA 目前为列出的模型提供免费 API 访问权限，源代码中的成本默认值为 `0`。
  </Accordion>

  <Accordion title="OpenAI 兼容端点">
    NVIDIA 使用标准的 `/v1` 补全端点。任何 OpenAI 兼容工具都应可直接配合 NVIDIA base URL 使用。
  </Accordion>
</AccordionGroup>

<Tip>
NVIDIA 模型目前可免费使用。请查看 [build.nvidia.com](https://build.nvidia.com/) 获取最新的可用性和速率限制详情。
</Tip>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型 ref 和故障转移行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    智能体、模型和提供商的完整配置参考。
  </Card>
</CardGroup>

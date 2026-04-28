---
read_when:
    - 你想为多个 LLM 使用一个 API 密钥
    - 你需要百度千帆设置指导
summary: 使用 Qianfan 的统一 API 在 OpenClaw 中访问多种模型
title: 千帆
x-i18n:
    generated_at: "2026-04-28T12:02:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6adfbad6c18bf2bcf93d9c56c51591c862ebb751ffd8183015fa2fc9566ce0af
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan 是百度的 MaaS 平台，提供一个**统一 API**，可通过单一端点和 API key 将请求路由到多个模型。它兼容 OpenAI，因此大多数 OpenAI SDK 只需切换 base URL 即可使用。

| 属性 | 值                                |
| -------- | --------------------------------- |
| 提供商 | `qianfan`                         |
| 身份验证 | `QIANFAN_API_KEY`                 |
| API      | 兼容 OpenAI                       |
| 基础 URL | `https://qianfan.baidubce.com/v2` |

## 入门指南

<Steps>
  <Step title="创建百度云账号">
    在 [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) 注册或登录，并确保已启用 Qianfan API 访问权限。
  </Step>
  <Step title="生成 API key">
    创建新应用或选择现有应用，然后生成 API key。密钥格式为 `bce-v3/ALTAK-...`。
  </Step>
  <Step title="运行新手引导">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="验证模型是否可用">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## 内置目录

| 模型引用                             | 输入        | 上下文 | 最大输出 | 推理 | 备注          |
| ------------------------------------ | ----------- | ------- | ---------- | --------- | ------------- |
| `qianfan/deepseek-v3.2`              | text        | 98,304  | 32,768     | 是        | 默认模型      |
| `qianfan/ernie-5.0-thinking-preview` | text, image | 119,000 | 64,000     | 是        | 多模态        |

<Tip>
默认内置模型引用是 `qianfan/deepseek-v3.2`。只有在需要自定义 base URL 或模型元数据时，才需要覆盖 `models.providers.qianfan`。
</Tip>

## 配置示例

```json5
{
  env: { QIANFAN_API_KEY: "bce-v3/ALTAK-..." },
  agents: {
    defaults: {
      model: { primary: "qianfan/deepseek-v3.2" },
      models: {
        "qianfan/deepseek-v3.2": { alias: "QIANFAN" },
      },
    },
  },
  models: {
    providers: {
      qianfan: {
        baseUrl: "https://qianfan.baidubce.com/v2",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v3.2",
            name: "DEEPSEEK V3.2",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 98304,
            maxTokens: 32768,
          },
          {
            id: "ernie-5.0-thinking-preview",
            name: "ERNIE-5.0-Thinking-Preview",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 119000,
            maxTokens: 64000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="传输协议和兼容性">
    Qianfan 通过 OpenAI 兼容的传输路径运行，而不是原生 OpenAI 请求构造。这意味着标准 OpenAI SDK 功能可以使用，但提供商特定参数可能不会被转发。
  </Accordion>

  <Accordion title="目录和覆盖">
    当前内置目录包含 `deepseek-v3.2` 和 `ernie-5.0-thinking-preview`。只有在需要自定义 base URL 或模型元数据时，才添加或覆盖 `models.providers.qianfan`。

    <Note>
    模型引用使用 `qianfan/` 前缀（例如 `qianfan/deepseek-v3.2`）。
    </Note>

  </Accordion>

  <Accordion title="故障排除">
    - 确保你的 API key 以 `bce-v3/ALTAK-` 开头，并且已在百度云控制台启用 Qianfan API 访问权限。
    - 如果未列出模型，请确认你的账号已激活 Qianfan 服务。
    - 默认 base URL 是 `https://qianfan.baidubce.com/v2`。仅在使用自定义端点或代理时才更改它。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    完整的 OpenClaw 配置参考。
  </Card>
  <Card title="智能体设置" href="/zh-CN/concepts/agent" icon="robot">
    配置智能体默认值和模型分配。
  </Card>
  <Card title="Qianfan API 文档" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Qianfan API 官方文档。
  </Card>
</CardGroup>

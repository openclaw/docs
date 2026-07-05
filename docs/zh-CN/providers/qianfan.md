---
read_when:
    - 你想为多个 LLM 使用单个 API key
    - 你需要 Baidu Qianfan 设置指导
summary: 使用 Qianfan 的统一 API 在 OpenClaw 中访问多种模型
title: 千帆
x-i18n:
    generated_at: "2026-07-05T11:38:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31387a53ee4472e2d20ae939ea75cea0d6f6367501becd56a8654fd97fdf0804
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan 是百度的 MaaS 平台：一个统一、兼容 OpenAI 的 API，可通过单一端点和 API key 将请求路由到多个模型。OpenClaw 将其作为官方外部插件 `@openclaw/qianfan-provider` 发布。

| 属性          | 值                                       |
| ------------- | ---------------------------------------- |
| 提供商        | `qianfan`                                |
| 凭证          | `QIANFAN_API_KEY`                        |
| API           | 兼容 OpenAI（`openai-completions`）      |
| 基础 URL      | `https://qianfan.baidubce.com/v2`        |
| 默认模型      | `qianfan/deepseek-v3.2`                  |

## 安装插件

安装官方插件，然后重启 Gateway 网关：

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## 入门指南

<Steps>
  <Step title="创建百度智能云账号">
    在 [Qianfan 控制台](https://console.bce.baidu.com/qianfan/ais/console/apiKey)注册或登录，并确保你已启用 Qianfan API 访问权限。
  </Step>
  <Step title="生成 API key">
    创建一个新应用或选择一个现有应用，然后生成 API key。百度智能云密钥使用 `bce-v3/ALTAK-...` 格式。
  </Step>
  <Step title="运行新手引导">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```

    非交互式运行会从 `--qianfan-api-key <key>` 或
    `QIANFAN_API_KEY` 读取密钥。新手引导会写入提供商配置，为默认模型添加
    `QIANFAN` 别名，并在未配置模型时将 `qianfan/deepseek-v3.2`
    设为默认模型。

  </Step>
  <Step title="验证模型可用">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## 内置目录

| 模型引用                             | 输入        | 上下文  | 最大输出   | 推理      | 备注         |
| ------------------------------------ | ----------- | ------- | ---------- | --------- | ------------- |
| `qianfan/deepseek-v3.2`              | 文本        | 98,304  | 32,768     | 是        | 默认模型     |
| `qianfan/ernie-5.0-thinking-preview` | 文本、图像  | 119,000 | 64,000     | 是        | 多模态       |

目录是静态的；没有实时模型发现。

<Tip>
只有在需要自定义基础 URL 或模型元数据时，才需要覆盖 `models.providers.qianfan`。
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

<Note>
模型引用使用 `qianfan/` 前缀（例如 `qianfan/deepseek-v3.2`）。
</Note>

<AccordionGroup>
  <Accordion title="传输协议和兼容性">
    Qianfan 通过兼容 OpenAI 的传输路径运行，而不是使用原生 OpenAI 请求整形。标准 OpenAI SDK 功能可以使用，但提供商特定参数可能不会被转发。
  </Accordion>

  <Accordion title="故障排查">
    - 确保你的 API key 以 `bce-v3/ALTAK-` 开头，并且已在百度智能云控制台中启用 Qianfan API 访问权限。
    - 如果没有列出模型，请确认你的账号已激活 Qianfan 服务。
    - 只有在使用自定义端点或代理时，才需要更改基础 URL。

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
  <Card title="Agent 设置" href="/zh-CN/concepts/agent" icon="robot">
    配置智能体默认值和模型分配。
  </Card>
  <Card title="Qianfan API 文档" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    官方 Qianfan API 文档。
  </Card>
</CardGroup>

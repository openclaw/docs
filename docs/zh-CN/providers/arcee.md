---
read_when:
    - 你想将 Arcee AI 与 OpenClaw 一起使用
    - 你需要 API 密钥环境变量或 CLI 认证选项
summary: Arcee AI 设置（认证 + 模型选择）
title: Arcee AI
x-i18n:
    generated_at: "2026-05-02T23:30:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 622ee5288aec3ae0b45d3f06ba65fd6f972e07d7a7596ae3905d6fbdac0bf737
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) 通过 OpenAI 兼容 API 提供 Trinity 系列混合专家模型访问。所有 Trinity 模型均采用 Apache 2.0 许可证授权。

Arcee AI 模型可以通过 Arcee 平台直接访问，也可以通过 [OpenRouter](/zh-CN/providers/openrouter) 访问。

| 属性 | 值                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| 提供商 | `arcee`                                                                               |
| 认证     | `ARCEEAI_API_KEY`（直连）或 `OPENROUTER_API_KEY`（通过 OpenRouter）                   |
| API      | OpenAI 兼容                                                                     |
| 基础 URL | `https://api.arcee.ai/api/v1`（直连）或 `https://openrouter.ai/api/v1`（OpenRouter） |

## 入门指南

<Tabs>
  <Tab title="直连（Arcee 平台）">
    <Steps>
      <Step title="获取 API key">
        在 [Arcee AI](https://chat.arcee.ai/) 创建 API key。
      </Step>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="设置默认模型">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="通过 OpenRouter">
    <Steps>
      <Step title="获取 API key">
        在 [OpenRouter](https://openrouter.ai/keys) 创建 API key。
      </Step>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="设置默认模型">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        相同的模型引用同时适用于直连和 OpenRouter 设置（例如 `arcee/trinity-large-thinking`）。
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 非交互式设置

<Tabs>
  <Tab title="直连（Arcee 平台）">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="通过 OpenRouter">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## 内置目录

OpenClaw 目前随附这个 Arcee 内置目录：

| 模型引用                      | 名称                   | 输入 | 上下文 | 成本（每 100 万输入/输出） | 备注                                      |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ------------------------------------------ |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text  | 256K    | $0.25 / $0.90        | 默认模型；已启用推理；无工具 |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text  | 128K    | $0.25 / $1.00        | 通用；400B 参数，13B 激活   |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text  | 128K    | $0.045 / $0.15       | 快速且成本高效；函数调用  |

<Tip>
新手引导预设会将 `arcee/trinity-large-thinking` 设为默认模型。它仅支持推理/文本，不支持使用工具或函数调用。
</Tip>

## 支持的功能

| 功能                                       | 支持                                   |
| --------------------------------------------- | ------------------------------------------- |
| 流式传输                                     | 是                                         |
| 使用工具 / 函数调用                   | 取决于模型；Trinity Large Thinking 不支持 |
| 结构化输出（JSON 模式和 JSON schema） | 是                                         |
| 扩展思考                             | 是（Trinity Large Thinking）                |

<AccordionGroup>
  <Accordion title="环境说明">
    如果 Gateway 网关以守护进程（launchd/systemd）运行，请确保 `ARCEEAI_API_KEY`
    （或 `OPENROUTER_API_KEY`）对该进程可用（例如位于
    `~/.openclaw/.env` 中，或通过 `env.shellEnv` 提供）。
  </Accordion>

  <Accordion title="OpenRouter 路由">
    通过 OpenRouter 使用 Arcee 模型时，同样适用 `arcee/*` 模型引用。
    OpenClaw 会根据你的认证选择透明处理路由。有关 OpenRouter 专属
    配置详情，请参阅 [OpenRouter 提供商文档](/zh-CN/providers/openrouter)。
  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/zh-CN/providers/openrouter" icon="shuffle">
    通过单个 API key 访问 Arcee 模型和许多其他模型。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
</CardGroup>

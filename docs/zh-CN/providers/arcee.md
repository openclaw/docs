---
read_when:
    - 你想将 Arcee AI 与 OpenClaw 搭配使用
    - 你需要 API key 环境变量或 CLI 身份验证选项
summary: Arcee AI 设置（身份验证 + 模型选择）
title: Arcee AI
x-i18n:
    generated_at: "2026-07-11T20:51:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe519393db3cf39f1b14b8121603b6f667102ac8c122fb6560d9b73a6ee6b0a3
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) 通过兼容 OpenAI 的 API 提供 Trinity 混合专家模型系列。所有 Trinity 模型均采用 Apache 2.0 许可证。Arcee 是 OpenClaw 的官方插件，不随核心内置，因此需要先安装插件，再进行新手引导。

你可以直接通过 Arcee 平台访问 Arcee 模型，也可以通过 [OpenRouter](/zh-CN/providers/openrouter) 访问。

| 属性 | 值                                                                                    |
| -------- | ------------------------------------------------------------------------------------- |
| 提供商 | `arcee`                                                                               |
| 身份验证 | `ARCEEAI_API_KEY`（直连）或 `OPENROUTER_API_KEY`（通过 OpenRouter）                   |
| API      | 兼容 OpenAI                                                                     |
| 基础 URL | `https://api.arcee.ai/api/v1`（直连）或 `https://openrouter.ai/api/v1`（OpenRouter） |

## 安装插件

```bash
openclaw plugins install @openclaw/arcee-provider
openclaw gateway restart
```

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

        直连和 OpenRouter 设置使用相同的模型引用。
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

| 模型引用                       | 名称                   | 输入 | 上下文 | 最大输出 | 成本（每 100 万输入/输出 token） | 工具 | 说明                                      |
| ------------------------------ | ---------------------- | ----- | ------- | ---------- | -------------------- | ----- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | 文本  | 256K    | 80K        | $0.25 / $0.90        | 否    | 默认模型；扩展思考                         |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | 文本  | 128K    | 16K        | $0.25 / $1.00        | 是    | 通用；4000 亿参数，130 亿活跃参数          |
| `arcee/trinity-mini`           | Trinity Mini 26B       | 文本  | 128K    | 80K        | $0.045 / $0.15       | 是    | 速度快且成本高效；函数调用                 |

<Tip>
新手引导预设会将 `arcee/trinity-large-thinking` 设为默认模型。
</Tip>

## 支持的功能

| 功能                                          | 支持情况                                      |
| --------------------------------------------- | -------------------------------------------- |
| 流式传输                                      | 是                                           |
| 工具使用/函数调用                             | 是（Trinity Mini、Trinity Large Preview）    |
| 结构化输出（JSON 模式和 JSON schema）         | 是                                           |
| 扩展思考                                      | 是（Trinity Large Thinking；工具已禁用）     |

<AccordionGroup>
  <Accordion title="环境说明">
    如果 Gateway 网关以守护进程（launchd/systemd）运行，请确保该进程可以使用 `ARCEEAI_API_KEY`
    （或 `OPENROUTER_API_KEY`），例如将其配置在
    `~/.openclaw/.env` 中或通过 `env.shellEnv` 配置。
  </Accordion>

  <Accordion title="OpenRouter 路由">
    通过 OpenRouter 使用 Arcee 模型时，仍使用相同的 `arcee/*` 模型引用。
    OpenClaw 会根据你的身份验证选择透明地进行路由。有关 OpenRouter 特定的
    配置详情，请参阅 [OpenRouter 提供商文档](/zh-CN/providers/openrouter)。
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/zh-CN/providers/openrouter" icon="shuffle">
    使用单个 API key 访问 Arcee 模型以及许多其他模型。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
</CardGroup>

---
read_when:
    - 你想将 Arcee AI 与 OpenClaw 配合使用
    - 你需要 API 密钥环境变量或 CLI 认证选项
summary: Arcee AI 设置（身份验证 + 模型选择）
title: Arcee AI
x-i18n:
    generated_at: "2026-05-07T15:09:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c3775ac2783da0833988c68621bd81c73a3b3e8240c26b4c1b590c1e9df2a8f
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) 通过 OpenAI 兼容 API 提供对 Trinity 混合专家模型系列的访问。所有 Trinity 模型均采用 Apache 2.0 许可证。

可以直接通过 Arcee 平台或通过 [OpenRouter](/zh-CN/providers/openrouter) 访问 Arcee AI 模型。

| 属性 | 值                                                                                    |
| -------- | ------------------------------------------------------------------------------------- |
| 提供商 | `arcee`                                                                               |
| 认证     | `ARCEEAI_API_KEY`（直接）或 `OPENROUTER_API_KEY`（通过 OpenRouter）                   |
| API      | OpenAI 兼容                                                                     |
| 基础 URL | `https://api.arcee.ai/api/v1`（直接）或 `https://openrouter.ai/api/v1`（OpenRouter） |

## 入门指南

<Tabs>
  <Tab title="直接（Arcee 平台）">
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

        相同的模型引用同时适用于直接设置和 OpenRouter 设置（例如 `arcee/trinity-large-thinking`）。
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 非交互式设置

<Tabs>
  <Tab title="直接（Arcee 平台）">
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

OpenClaw 当前随附以下内置 Arcee 目录：

| 模型引用                      | 名称                   | 输入 | 上下文 | 成本（每 1M 输入/输出） | 备注                                     |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text  | 256K    | $0.25 / $0.90        | 默认模型；已启用推理          |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text  | 128K    | $0.25 / $1.00        | 通用用途；400B 参数，13B 激活  |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text  | 128K    | $0.045 / $0.15       | 快速且成本高效；函数调用 |

<Tip>
新手引导预设会将 `arcee/trinity-large-thinking` 设置为默认模型。
</Tip>

## 支持的功能

| 功能                                       | 支持                                    |
| --------------------------------------------- | -------------------------------------------- |
| 流式传输                                     | 是                                          |
| 工具使用 / 函数调用                   | 是（Trinity Mini、Trinity Large Preview）    |
| 结构化输出（JSON 模式和 JSON schema） | 是                                          |
| 扩展思考                             | 是（Trinity Large Thinking；工具已禁用） |

<AccordionGroup>
  <Accordion title="环境说明">
    如果 Gateway 网关作为守护进程运行（launchd/systemd），请确保 `ARCEEAI_API_KEY`
    （或 `OPENROUTER_API_KEY`）可供该进程使用（例如，在
    `~/.openclaw/.env` 中或通过 `env.shellEnv`）。
  </Accordion>

  <Accordion title="OpenRouter 路由">
    通过 OpenRouter 使用 Arcee 模型时，同样适用 `arcee/*` 模型引用。
    OpenClaw 会根据你的认证选择透明地处理路由。请参阅
    [OpenRouter 提供商文档](/zh-CN/providers/openrouter)，了解 OpenRouter 专用的
    配置详情。
  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/zh-CN/providers/openrouter" icon="shuffle">
    通过一个 API key 访问 Arcee 模型以及许多其他模型。
  </Card>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
</CardGroup>

---
read_when:
    - 你想在 OpenClaw 中使用注重隐私的推理
    - 你想要 Venice AI 设置指南
summary: 在 OpenClaw 中使用 Venice AI 注重隐私的模型
title: Venice AI
x-i18n:
    generated_at: "2026-04-28T12:03:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: d87db1595ba6d34459143e7d173cca9549ad21928eaaf00605b7487ce6d33fce
    source_path: providers/venice.md
    workflow: 16
---

Venice AI 提供**注重隐私的 AI 推理**，支持未审查模型，并可通过其匿名化代理访问主要专有模型。所有推理默认都是私有的：不会用你的数据训练，也不会记录日志。

## 为什么在 OpenClaw 中使用 Venice

- 面向开源模型的**私有推理**（不记录日志）。
- 在你需要时可使用**未审查模型**。
- 当质量很重要时，可**匿名化访问**专有模型（Opus/GPT/Gemini）。
- OpenAI 兼容的 `/v1` 端点。

## 隐私模式

Venice 提供两种隐私级别，理解这一点是选择模型的关键：

| 模式           | 说明                                                                                                                       | Models                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **私有**    | 完全私有。提示词/响应**从不存储或记录**。临时存在。                                                       | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored 等。 |
| **匿名化** | 经由 Venice 代理并去除元数据。底层提供商（OpenAI、Anthropic、Google、xAI）会看到匿名化请求。 | Claude, GPT, Gemini, Grok                                     |

<Warning>
匿名化模型**不是**完全私有的。Venice 会在转发前去除元数据，但底层提供商（OpenAI、Anthropic、Google、xAI）仍会处理该请求。需要完全隐私时，请选择**私有**模型。
</Warning>

## 功能

- **注重隐私**：在“私有”（完全私有）和“匿名化”（代理）模式之间选择
- **未审查模型**：访问没有内容限制的模型
- **主要模型访问**：通过 Venice 的匿名化代理使用 Claude、GPT、Gemini 和 Grok
- **OpenAI 兼容 API**：标准 `/v1` 端点，便于集成
- **流式传输**：所有模型均支持
- **函数调用**：部分模型支持（检查模型能力）
- **视觉**：具备视觉能力的模型支持
- **无硬性速率限制**：极端使用情况下可能会应用公平使用节流

## 入门指南

<Steps>
  <Step title="获取你的 API 密钥">
    1. 在 [venice.ai](https://venice.ai) 注册
    2. 前往**Settings > API Keys > Create new key**
    3. 复制你的 API 密钥（格式：`vapi_xxxxxxxxxxxx`）
  </Step>
  <Step title="配置 OpenClaw">
    选择你偏好的设置方法：

    <Tabs>
      <Tab title="交互式（推荐）">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        这会：
        1. 提示输入你的 API 密钥（或使用现有的 `VENICE_API_KEY`）
        2. 显示所有可用的 Venice 模型
        3. 让你选择默认模型
        4. 自动配置提供商
      </Tab>
      <Tab title="环境变量">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="非交互式">
        ```bash
        openclaw onboard --non-interactive \
          --auth-choice venice-api-key \
          --venice-api-key "vapi_xxxxxxxxxxxx"
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="验证设置">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## 模型选择

设置完成后，OpenClaw 会显示所有可用的 Venice 模型。根据你的需求选择：

- **默认模型**：`venice/kimi-k2-5`，提供强大的私有推理和视觉能力。
- **高能力选项**：`venice/claude-opus-4-6`，用于最强的 Venice 匿名化路径。
- **隐私**：选择“私有”模型以获得完全私有的推理。
- **能力**：选择“匿名化”模型，通过 Venice 代理访问 Claude、GPT、Gemini。

随时更改你的默认模型：

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

列出所有可用模型：

```bash
openclaw models list | grep venice
```

你也可以运行 `openclaw configure`，选择 **Model/auth**，然后选择 **Venice AI**。

<Tip>
使用下表为你的用例选择合适的模型。

| 用例                   | 推荐模型                | 原因                                          |
| -------------------------- | -------------------------------- | -------------------------------------------- |
| **通用聊天（默认）** | `kimi-k2-5`                      | 强大的私有推理加视觉能力         |
| **最佳整体质量**   | `claude-opus-4-6`                | 最强的 Venice 匿名化选项           |
| **隐私 + 编码**       | `qwen3-coder-480b-a35b-instruct` | 具有大上下文的私有编码模型      |
| **私有视觉**         | `kimi-k2-5`                      | 不离开私有模式即可支持视觉  |
| **快速 + 低成本**           | `qwen3-4b`                       | 轻量级推理模型                  |
| **复杂私有任务**  | `deepseek-v3.2`                  | 推理能力强，但不支持 Venice 工具 |
| **未审查**             | `venice-uncensored`              | 无内容限制                      |

</Tip>

## DeepSeek V4 重放行为

如果 Venice 暴露了 `venice/deepseek-v4-pro` 或
`venice/deepseek-v4-flash` 等 DeepSeek V4 模型，当代理省略所需的 DeepSeek V4
`reasoning_content` 重放占位符时，OpenClaw 会在 assistant 消息上填充它。Venice 会拒绝 DeepSeek 原生的顶层 `thinking` 控制，因此
OpenClaw 会将该提供商专用的重放修复与原生
DeepSeek 提供商的思考控制分开处理。

## 内置目录（共 41 个）

<AccordionGroup>
  <Accordion title="私有模型（26 个）— 完全私有，不记录日志">
    | 模型 ID                               | 名称                                | 上下文 | 功能                   |
    | -------------------------------------- | ----------------------------------- | ------- | -------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k    | 默认、推理、视觉 |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k    | 推理                  |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k    | 通用                    |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k    | 通用                    |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B            | 128k    | 通用，工具已禁用    |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                | 128k    | 推理                  |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                | 128k    | 通用                    |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                   | 256k    | 编码                     |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo             | 256k    | 编码                     |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                    | 256k    | 推理、视觉          |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                     | 256k    | 通用                    |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)             | 256k    | 视觉                     |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)            | 32k     | 快速、推理            |
    | `deepseek-v3.2`                        | DeepSeek V3.2                      | 160k    | 推理，工具已禁用  |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k     | 未审查，工具已禁用 |
    | `mistral-31-24b`                       | Venice Medium (Mistral)            | 128k    | 视觉                     |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct        | 198k    | 视觉                     |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B               | 128k    | 通用                    |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B         | 128k    | 通用                    |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic              | 128k    | 推理                  |
    | `zai-org-glm-4.6`                      | GLM 4.6                            | 198k    | 通用                    |
    | `zai-org-glm-4.7`                      | GLM 4.7                            | 198k    | 推理                  |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                      | 128k    | 推理                  |
    | `zai-org-glm-5`                        | GLM 5                              | 198k    | 推理                  |
    | `minimax-m21`                          | MiniMax M2.1                       | 198k    | 推理                  |
    | `minimax-m25`                          | MiniMax M2.5                       | 198k    | 推理                  |
  </Accordion>

  <Accordion title="匿名化模型（15 个）— 通过 Venice 代理">
    | 模型 ID                        | 名称                           | 上下文 | 功能                  |
    | ------------------------------- | ------------------------------ | ------- | ------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (via Venice)   | 1M      | 推理、视觉         |
    | `claude-opus-4-5`               | Claude Opus 4.5 (via Venice)   | 198k    | 推理、视觉         |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (via Venice) | 1M      | 推理、视觉         |
    | `claude-sonnet-4-5`             | Claude Sonnet 4.5 (via Venice) | 198k    | 推理、视觉         |
    | `openai-gpt-54`                 | GPT-5.4 (via Venice)           | 1M      | 推理、视觉         |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (via Venice)     | 400k    | 推理、视觉、编码 |
    | `openai-gpt-52`                 | GPT-5.2 (via Venice)           | 256k    | 推理                 |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (via Venice)     | 256k    | 推理、视觉、编码 |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (via Venice)            | 128k    | 视觉                    |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (via Venice)       | 128k    | 视觉                    |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (via Venice)    | 1M      | 推理、视觉         |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (via Venice)      | 198k    | 推理、视觉         |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (via Venice)    | 256k    | 推理、视觉         |
    | `grok-41-fast`                  | Grok 4.1 Fast (via Venice)     | 1M      | 推理、视觉         |
    | `grok-code-fast-1`              | Grok Code Fast 1 (via Venice)  | 256k    | 推理、编码         |
  </Accordion>
</AccordionGroup>

## 模型发现

当设置了 `VENICE_API_KEY` 时，OpenClaw 会自动从 Venice API 发现模型。如果 API 无法访问，它会回退到静态目录。

`/models` 端点是公开的（列出模型不需要身份验证），但推理需要有效的 API 密钥。

## 流式传输和工具支持

| 功能                 | 支持                                                 |
| -------------------- | ---------------------------------------------------- |
| **流式传输**         | 所有模型                                             |
| **函数调用**         | 大多数模型（检查 API 中的 `supportsFunctionCalling`） |
| **视觉/图像**        | 标记为“视觉”功能的模型                               |
| **JSON 模式**        | 通过 `response_format` 支持                          |

## 定价

Venice 使用基于点数的系统。请查看 [venice.ai/pricing](https://venice.ai/pricing) 了解当前费率：

- **私有模型**：通常成本更低
- **匿名化模型**：与直接 API 定价类似 + 少量 Venice 费用

### Venice（匿名化）与直接 API 对比

| 方面         | Venice（匿名化）             | 直接 API          |
| ------------ | ----------------------------- | ------------------- |
| **隐私**     | 元数据被移除，已匿名化        | 关联你的账户        |
| **延迟**     | +10-50ms（代理）              | 直接连接            |
| **功能**     | 支持大多数功能                | 完整功能            |
| **计费**     | Venice 点数                   | 提供商计费          |

## 使用示例

```bash
# Use the default private model
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Use Claude Opus via Venice (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Use uncensored model
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Use vision model with image
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Use coding model
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## 故障排除

<AccordionGroup>
  <Accordion title="无法识别 API key">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    确保该 key 以 `vapi_` 开头。

  </Accordion>

  <Accordion title="模型不可用">
    Venice 模型目录会动态更新。运行 `openclaw models list` 查看当前可用的模型。某些模型可能暂时离线。
  </Accordion>

  <Accordion title="连接问题">
    Venice API 位于 `https://api.venice.ai/api/v1`。确保你的网络允许 HTTPS 连接。
  </Accordion>
</AccordionGroup>

<Note>
更多帮助：[故障排除](/zh-CN/help/troubleshooting) 和 [常见问题](/zh-CN/help/faq)。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="配置文件示例">
    ```json5
    {
      env: { VENICE_API_KEY: "vapi_..." },
      agents: { defaults: { model: { primary: "venice/kimi-k2-5" } } },
      models: {
        mode: "merge",
        providers: {
          venice: {
            baseUrl: "https://api.venice.ai/api/v1",
            apiKey: "${VENICE_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2-5",
                name: "Kimi K2.5",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型选择" href="/zh-CN/concepts/model-providers" icon="layers">
    选择提供商、模型引用和故障转移行为。
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Venice AI 主页和账户注册。
  </Card>
  <Card title="API 文档" href="https://docs.venice.ai" icon="book">
    Venice API 参考和开发者文档。
  </Card>
  <Card title="定价" href="https://venice.ai/pricing" icon="credit-card">
    当前 Venice 点数费率和套餐。
  </Card>
</CardGroup>

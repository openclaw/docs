---
read_when:
    - 你想在 OpenClaw 中使用注重隐私的推理
    - 你想获取 Venice AI 设置指南
summary: 在 OpenClaw 中使用注重隐私的 Venice AI 模型
title: Venice AI
x-i18n:
    generated_at: "2026-04-05T10:07:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 53313e45e197880feb7e90764ee8fd6bb7f5fd4fe03af46b594201c77fbc8eab
    source_path: providers/venice.md
    workflow: 15
---

# Venice AI（Venice 亮点）

**Venice** 是我们重点推荐的 Venice 设置，适合用于以隐私为先的推理，并可选择通过匿名访问专有模型。

Venice AI 提供以隐私为中心的 AI 推理，支持未审查模型，并可通过其匿名代理访问主流专有模型。所有推理默认都是私密的——不会用你的数据训练，也不会记录日志。

## 为什么在 OpenClaw 中使用 Venice

- **私密推理**，适用于开源模型（不记录日志）。
- **未审查模型**，在你需要时可用。
- **匿名访问** 专有模型（Opus/GPT/Gemini），在质量重要时尤其有用。
- 兼容 OpenAI 的 `/v1` 端点。

## 隐私模式

Venice 提供两种隐私级别——理解这一点对于选择模型至关重要：

| 模式 | 描述 | 模型 |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Private** | 完全私密。提示词/响应 **永不存储或记录**。短暂存在。 | Llama、Qwen、DeepSeek、Kimi、MiniMax、Venice Uncensored 等 |
| **Anonymized** | 通过 Venice 代理并去除元数据。底层提供商（OpenAI、Anthropic、Google、xAI）看到的是匿名请求。 | Claude、GPT、Gemini、Grok |

## 功能

- **注重隐私**：可在 “private”（完全私密）和 “anonymized”（代理匿名）模式之间选择
- **未审查模型**：可访问不受内容限制的模型
- **主流模型访问**：通过 Venice 的匿名代理使用 Claude、GPT、Gemini 和 Grok
- **兼容 OpenAI 的 API**：标准 `/v1` 端点，便于集成
- **流式传输**：✅ 所有模型均支持
- **函数调用**：✅ 部分模型支持（请检查模型能力）
- **视觉**：✅ 具备视觉能力的模型支持
- **无硬性速率限制**：极端使用情况下可能会触发公平使用限流

## 设置

### 1. 获取 API 密钥

1. 在 [venice.ai](https://venice.ai) 注册
2. 进入 **Settings → API Keys → Create new key**
3. 复制你的 API 密钥（格式：`vapi_xxxxxxxxxxxx`）

### 2. 配置 OpenClaw

**选项 A：环境变量**

```bash
export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
```

**选项 B：交互式设置（推荐）**

```bash
openclaw onboard --auth-choice venice-api-key
```

这将会：

1. 提示你输入 API 密钥（或使用现有的 `VENICE_API_KEY`）
2. 显示所有可用的 Venice 模型
3. 让你选择默认模型
4. 自动配置提供商

**选项 C：非交互式**

```bash
openclaw onboard --non-interactive \
  --auth-choice venice-api-key \
  --venice-api-key "vapi_xxxxxxxxxxxx"
```

### 3. 验证设置

```bash
openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
```

## 模型选择

设置完成后，OpenClaw 会显示所有可用的 Venice 模型。请根据你的需求进行选择：

- **默认模型**：`venice/kimi-k2-5`，适合强大的私密推理加视觉能力。
- **高能力选项**：`venice/claude-opus-4-6`，适合最强的 Venice 匿名路径。
- **隐私**：选择 “private” 模型以获得完全私密的推理。
- **能力**：选择 “anonymized” 模型，以便通过 Venice 的代理访问 Claude、GPT、Gemini。

你可以随时更改默认模型：

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

列出所有可用模型：

```bash
openclaw models list | grep venice
```

## 通过 `openclaw configure` 配置

1. 运行 `openclaw configure`
2. 选择 **Model/auth**
3. 选择 **Venice AI**

## 我应该使用哪个模型？

| 用例 | 推荐模型 | 原因 |
| -------------------------- | -------------------------------- | -------------------------------------------- |
| **通用聊天（默认）** | `kimi-k2-5` | 强大的私密推理加视觉能力 |
| **整体质量最佳** | `claude-opus-4-6` | 最强的 Venice 匿名选项 |
| **隐私 + 编码** | `qwen3-coder-480b-a35b-instruct` | 具有大上下文的私密编码模型 |
| **私密视觉** | `kimi-k2-5` | 在不离开 Private 模式的情况下支持视觉 |
| **快速 + 低成本** | `qwen3-4b` | 轻量级推理模型 |
| **复杂私密任务** | `deepseek-v3.2` | 推理能力强，但不支持 Venice 工具 |
| **未审查** | `venice-uncensored` | 无内容限制 |

## 可用模型（共 41 个）

### Private 模型（26 个）- 完全私密，不记录日志

| Model ID | 名称 | 上下文 | 功能 |
| -------------------------------------- | ----------------------------------- | ------- | -------------------------- |
| `kimi-k2-5` | Kimi K2.5 | 256k | 默认、推理、视觉 |
| `kimi-k2-thinking` | Kimi K2 Thinking | 256k | 推理 |
| `llama-3.3-70b` | Llama 3.3 70B | 128k | 通用 |
| `llama-3.2-3b` | Llama 3.2 3B | 128k | 通用 |
| `hermes-3-llama-3.1-405b` | Hermes 3 Llama 3.1 405B | 128k | 通用，工具已禁用 |
| `qwen3-235b-a22b-thinking-2507` | Qwen3 235B Thinking | 128k | 推理 |
| `qwen3-235b-a22b-instruct-2507` | Qwen3 235B Instruct | 128k | 通用 |
| `qwen3-coder-480b-a35b-instruct` | Qwen3 Coder 480B | 256k | 编码 |
| `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo | 256k | 编码 |
| `qwen3-5-35b-a3b` | Qwen3.5 35B A3B | 256k | 推理、视觉 |
| `qwen3-next-80b` | Qwen3 Next 80B | 256k | 通用 |
| `qwen3-vl-235b-a22b` | Qwen3 VL 235B（视觉） | 256k | 视觉 |
| `qwen3-4b` | Venice Small（Qwen3 4B） | 32k | 快速、推理 |
| `deepseek-v3.2` | DeepSeek V3.2 | 160k | 推理，工具已禁用 |
| `venice-uncensored` | Venice Uncensored（Dolphin-Mistral） | 32k | 未审查，工具已禁用 |
| `mistral-31-24b` | Venice Medium（Mistral） | 128k | 视觉 |
| `google-gemma-3-27b-it` | Google Gemma 3 27B Instruct | 198k | 视觉 |
| `openai-gpt-oss-120b` | OpenAI GPT OSS 120B | 128k | 通用 |
| `nvidia-nemotron-3-nano-30b-a3b` | NVIDIA Nemotron 3 Nano 30B | 128k | 通用 |
| `olafangensan-glm-4.7-flash-heretic` | GLM 4.7 Flash Heretic | 128k | 推理 |
| `zai-org-glm-4.6` | GLM 4.6 | 198k | 通用 |
| `zai-org-glm-4.7` | GLM 4.7 | 198k | 推理 |
| `zai-org-glm-4.7-flash` | GLM 4.7 Flash | 128k | 推理 |
| `zai-org-glm-5` | GLM 5 | 198k | 推理 |
| `minimax-m21` | MiniMax M2.1 | 198k | 推理 |
| `minimax-m25` | MiniMax M2.5 | 198k | 推理 |

### Anonymized 模型（15 个）- 通过 Venice 代理

| Model ID | 名称 | 上下文 | 功能 |
| ------------------------------- | ------------------------------ | ------- | ------------------------- |
| `claude-opus-4-6` | Claude Opus 4.6（通过 Venice） | 1M | 推理、视觉 |
| `claude-opus-4-5` | Claude Opus 4.5（通过 Venice） | 198k | 推理、视觉 |
| `claude-sonnet-4-6` | Claude Sonnet 4.6（通过 Venice） | 1M | 推理、视觉 |
| `claude-sonnet-4-5` | Claude Sonnet 4.5（通过 Venice） | 198k | 推理、视觉 |
| `openai-gpt-54` | GPT-5.4（通过 Venice） | 1M | 推理、视觉 |
| `openai-gpt-53-codex` | GPT-5.3 Codex（通过 Venice） | 400k | 推理、视觉、编码 |
| `openai-gpt-52` | GPT-5.2（通过 Venice） | 256k | 推理 |
| `openai-gpt-52-codex` | GPT-5.2 Codex（通过 Venice） | 256k | 推理、视觉、编码 |
| `openai-gpt-4o-2024-11-20` | GPT-4o（通过 Venice） | 128k | 视觉 |
| `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini（通过 Venice） | 128k | 视觉 |
| `gemini-3-1-pro-preview` | Gemini 3.1 Pro（通过 Venice） | 1M | 推理、视觉 |
| `gemini-3-pro-preview` | Gemini 3 Pro（通过 Venice） | 198k | 推理、视觉 |
| `gemini-3-flash-preview` | Gemini 3 Flash（通过 Venice） | 256k | 推理、视觉 |
| `grok-41-fast` | Grok 4.1 Fast（通过 Venice） | 1M | 推理、视觉 |
| `grok-code-fast-1` | Grok Code Fast 1（通过 Venice） | 256k | 推理、编码 |

## 模型发现

当设置了 `VENICE_API_KEY` 时，OpenClaw 会自动从 Venice API 发现模型。如果 API 不可达，它会回退到静态目录。

`/models` 端点是公开的（列出模型时无需鉴权），但推理需要有效的 API 密钥。

## 流式传输和工具支持

| 功能 | 支持情况 |
| -------------------- | ------------------------------------------------------- |
| **流式传输** | ✅ 所有模型 |
| **函数调用** | ✅ 大多数模型（请检查 API 中的 `supportsFunctionCalling`） |
| **视觉/图像** | ✅ 标记有 “Vision” 功能的模型 |
| **JSON 模式** | ✅ 通过 `response_format` 支持 |

## 定价

Venice 使用基于积分的系统。当前费率请查看 [venice.ai/pricing](https://venice.ai/pricing)：

- **Private 模型**：通常成本更低
- **Anonymized 模型**：与直接 API 定价相近，外加少量 Venice 费用

## 对比：Venice 与直接 API

| 方面 | Venice（Anonymized） | 直接 API |
| ------------ | ----------------------------- | ------------------- |
| **隐私** | 元数据已去除、请求匿名化 | 关联到你的账户 |
| **延迟** | +10-50ms（代理） | 直连 |
| **功能** | 支持大多数功能 | 完整功能 |
| **计费** | Venice 积分 | 提供商计费 |

## 使用示例

```bash
# 使用默认的私密模型
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# 通过 Venice 使用 Claude Opus（匿名）
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# 使用未审查模型
openclaw agent --model venice/venice-uncensored --message "Draft options"

# 使用带图像的视觉模型
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# 使用编码模型
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## 故障排除

### API 密钥无法识别

```bash
echo $VENICE_API_KEY
openclaw models list | grep venice
```

请确保密钥以 `vapi_` 开头。

### 模型不可用

Venice 模型目录会动态更新。运行 `openclaw models list` 以查看当前可用模型。有些模型可能会暂时离线。

### 连接问题

Venice API 地址为 `https://api.venice.ai/api/v1`。请确保你的网络允许 HTTPS 连接。

## 配置文件示例

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

## 链接

- [Venice AI](https://venice.ai)
- [API 文档](https://docs.venice.ai)
- [定价](https://venice.ai/pricing)
- [状态](https://status.venice.ai)

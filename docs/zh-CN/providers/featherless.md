---
read_when:
    - 你想将 Featherless AI 与 OpenClaw 搭配使用
    - 你需要 Featherless API key 环境变量或模型引用格式
summary: Featherless AI 设置、模型选择和工具调用
title: Featherless AI
x-i18n:
    generated_at: "2026-07-12T14:43:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9112f7e65b4089bf96933c632d0b62f7fb87d42998d985ca85eb92dc392636b6
    source_path: providers/featherless.md
    workflow: 16
---

[Featherless AI](https://featherless.ai) 通过兼容 OpenAI 的 API 提供开放模型。OpenClaw 将 Featherless 安装为官方外部提供商插件，并保持内置目录精简，同时在运行时接受 Featherless 的精确模型 ID。

| 属性 | 值 |
| --------------- | ---------------------------------------- |
| 提供商 ID | `featherless` |
| 软件包 | `@openclaw/featherless-provider` |
| 身份验证环境变量 | `FEATHERLESS_API_KEY` |
| 新手引导标志 | `--auth-choice featherless-api-key` |
| 直接 CLI 标志 | `--featherless-api-key <key>` |
| API | 兼容 OpenAI（`openai-completions`） |
| 基础 URL | `https://api.featherless.ai/v1` |
| 默认模型 | `featherless/Qwen/Qwen3-32B` |

## 设置

安装插件并重启 Gateway 网关：

```bash
openclaw plugins install @openclaw/featherless-provider
openclaw gateway restart
```

运行新手引导：

```bash
openclaw onboard --auth-choice featherless-api-key
```

对于非交互式设置：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice featherless-api-key \
  --featherless-api-key "$FEATHERLESS_API_KEY"
```

或者将密钥提供给 Gateway 网关进程：

```bash
export FEATHERLESS_API_KEY="<your-featherless-api-key>" # pragma: allowlist secret
```

验证提供商：

```bash
openclaw models list --provider featherless
```

## 默认模型

该插件使用 `Qwen/Qwen3-32B` 作为设置时的默认模型，因为 Featherless 文档说明 Qwen 3 系列支持原生工具调用。OpenClaw 为其配置了 32,768 token 的上下文窗口、保守的 4,096 token 输出限制，以及 Qwen 聊天模板的思考控制。

目录中的成本字段为零，因为 Featherless 支持多种计费模式，而 OpenClaw 不会嵌入特定于账户的套餐或按请求计费费率。

## 其他 Featherless 模型

在 `featherless/` 提供商前缀后使用 Featherless 的精确模型 ID：

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "featherless/moonshotai/Kimi-K2-Instruct",
      },
    },
  },
}
```

OpenClaw 特意不将 Featherless 的完整公共模型索引复制到选择器中。该索引规模庞大，并且没有提供足够的结构化能力元数据，无法安全地对每个文本、视觉、嵌入和推理模型进行分类。因此，未知 ID 会使用保守的纯文本、非推理默认值进行解析：4,096 token 的上下文窗口和 1,024 token 的输出限制。

当模型需要不同的元数据时，请添加显式的提供商模型条目：

```json5
{
  models: {
    mode: "merge",
    providers: {
      featherless: {
        baseUrl: "https://api.featherless.ai/v1",
        apiKey: "${FEATHERLESS_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-3-27b-it",
            name: "Gemma 3 27B",
            input: ["text", "image"],
            reasoning: false,
            contextWindow: 32768,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

添加自定义元数据之前，请查看 Featherless 的模型目录，确认当前的模型可用性和能力标签。

## 故障排查

- `401` 或 `403`：确认 Gateway 网关进程可以访问 `FEATHERLESS_API_KEY`，或重新运行新手引导。
- 未知模型：在 `featherless/` 前缀后使用 Featherless 中区分大小写的精确 ID。
- 工具调用以文本形式返回：选择 Featherless 文档说明支持原生函数调用的模型系列，例如 Qwen 3。
- 托管式 Gateway 网关无法读取密钥：将其放入 `~/.openclaw/.env` 或服务加载的其他环境来源中，然后重启 Gateway 网关。

## 相关内容

- [模型提供商](/zh-CN/concepts/model-providers)
- [所有提供商](/zh-CN/providers/index)
- [思考模式](/zh-CN/tools/thinking)

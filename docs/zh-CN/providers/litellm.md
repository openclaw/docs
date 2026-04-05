---
read_when:
    - 你想通过 LiteLLM 代理转发 OpenClaw
    - 你需要通过 LiteLLM 进行成本跟踪、日志记录或模型路由
summary: 通过 LiteLLM Proxy 运行 OpenClaw，以实现统一模型访问和成本跟踪
title: LiteLLM
x-i18n:
    generated_at: "2026-04-05T08:42:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e8ca73458186285bc06967b397b8a008791dc58eea1159d6c358e1a794982d1
    source_path: providers/litellm.md
    workflow: 15
---

# LiteLLM

[LiteLLM](https://litellm.ai) 是一个开源 LLM 网关，为 100 多个模型提供商提供统一 API。通过 LiteLLM 转发 OpenClaw，你可以获得集中式成本跟踪、日志记录，以及在不更改 OpenClaw 配置的情况下切换后端的灵活性。

## 为什么将 LiteLLM 与 OpenClaw 一起使用？

- **成本跟踪** — 精确查看 OpenClaw 在所有模型上的花费
- **模型路由** — 在 Claude、GPT-4、Gemini、Bedrock 之间切换，而无需更改配置
- **虚拟密钥** — 为 OpenClaw 创建带有支出限制的密钥
- **日志记录** — 用于调试的完整请求/响应日志
- **故障切换** — 当你的主提供商不可用时自动切换

## 快速开始

### 通过新手引导

```bash
openclaw onboard --auth-choice litellm-api-key
```

### 手动设置

1. 启动 LiteLLM Proxy：

```bash
pip install 'litellm[proxy]'
litellm --model claude-opus-4-6
```

2. 将 OpenClaw 指向 LiteLLM：

```bash
export LITELLM_API_KEY="your-litellm-key"

openclaw
```

就是这样。OpenClaw 现在会通过 LiteLLM 路由。

## 配置

### 环境变量

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### 配置文件

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

## 虚拟密钥

为 OpenClaw 创建一个带有支出限制的专用密钥：

```bash
curl -X POST "http://localhost:4000/key/generate" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key_alias": "openclaw",
    "max_budget": 50.00,
    "budget_duration": "monthly"
  }'
```

使用生成的密钥作为 `LITELLM_API_KEY`。

## 模型路由

LiteLLM 可以将模型请求路由到不同后端。在你的 LiteLLM `config.yaml` 中进行配置：

```yaml
model_list:
  - model_name: claude-opus-4-6
    litellm_params:
      model: claude-opus-4-6
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: gpt-4o
    litellm_params:
      model: gpt-4o
      api_key: os.environ/OPENAI_API_KEY
```

OpenClaw 会持续请求 `claude-opus-4-6` —— 路由由 LiteLLM 处理。

## 查看使用情况

检查 LiteLLM 的仪表板或 API：

```bash
# 密钥信息
curl "http://localhost:4000/key/info" \
  -H "Authorization: Bearer sk-litellm-key"

# 支出日志
curl "http://localhost:4000/spend/logs" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```

## 说明

- LiteLLM 默认运行在 `http://localhost:4000`
- OpenClaw 通过 LiteLLM 的代理式、兼容 OpenAI 的 `/v1`
  端点进行连接
- 原生仅限 OpenAI 的请求整形不适用于通过 LiteLLM 的情况：
  不支持 `service_tier`、不支持 Responses `store`、不支持提示词缓存提示，也不支持
  OpenAI 推理兼容负载整形
- 在自定义 LiteLLM 基础 URL 上，不会注入隐藏的 OpenClaw 归因请求头（`originator`、`version`、`User-Agent`）

## 另请参阅

- [LiteLLM 文档](https://docs.litellm.ai)
- [模型提供商](/concepts/model-providers)

---
read_when:
    - 你想用一个 API 密钥访问多个 LLM
    - 你需要百度 Qianfan 的设置指南
summary: 使用 Qianfan 的统一 API 在 OpenClaw 中访问多种模型
title: Qianfan
x-i18n:
    generated_at: "2026-04-05T10:06:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 965d83dd968563447ce3571a73bd71c6876275caff8664311a852b2f9827e55b
    source_path: providers/qianfan.md
    workflow: 15
---

# Qianfan 提供商指南

Qianfan 是百度的 MaaS 平台，提供一个**统一 API**，可通过单一端点和 API 密钥将请求路由到多种模型。它兼容 OpenAI，因此大多数 OpenAI SDK 只需切换基础 URL 即可使用。

## 前提条件

1. 一个具有 Qianfan API 访问权限的百度云账户
2. 一个从 Qianfan 控制台获取的 API 密钥
3. 你的系统上已安装 OpenClaw

## 获取 API 密钥

1. 访问 [Qianfan 控制台](https://console.bce.baidu.com/qianfan/ais/console/apiKey)
2. 创建一个新应用或选择一个现有应用
3. 生成一个 API 密钥（格式：`bce-v3/ALTAK-...`）
4. 复制该 API 密钥以供 OpenClaw 使用

## CLI 设置

```bash
openclaw onboard --auth-choice qianfan-api-key
```

## 配置片段

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

## 说明

- 默认内置模型引用：`qianfan/deepseek-v3.2`
- 默认基础 URL：`https://qianfan.baidubce.com/v2`
- 当前内置目录包含 `deepseek-v3.2` 和 `ernie-5.0-thinking-preview`
- 仅当你需要自定义基础 URL 或模型元数据时，才添加或覆盖 `models.providers.qianfan`
- Qianfan 通过 OpenAI 兼容传输路径运行，而不是原生 OpenAI 请求塑形

## 相关文档

- [OpenClaw 配置](/zh-CN/gateway/configuration)
- [模型提供商](/zh-CN/concepts/model-providers)
- [智能体设置](/zh-CN/concepts/agent)
- [Qianfan API 文档](https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb)

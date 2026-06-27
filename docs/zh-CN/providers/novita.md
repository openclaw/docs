---
read_when:
    - 你想使用 NovitaAI 模型运行 OpenClaw
    - 你需要 Novita 提供商 ID、密钥或端点
summary: 通过 OpenClaw 使用 NovitaAI 的 OpenAI 兼容 API
title: NovitaAI
x-i18n:
    generated_at: "2026-06-27T03:06:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 602df700662dbf2176acabcad7d23950e8240158f58d115f8e56bf1fb9f43bcb
    source_path: providers/novita.md
    workflow: 16
---

NovitaAI 是一个托管式 AI 基础设施提供商，提供与 OpenAI 兼容的模型 API。在 OpenClaw 中，它是一个内置模型提供商，因此提供商 ID 是 `novita`，凭据通过常规模型认证流程处理，模型引用看起来像 `novita/deepseek/deepseek-v3-0324`。

当你希望在不运行自己的推理服务器的情况下，托管访问开放权重和第三方模型路由时，请使用 Novita。内置目录侧重于适合智能体轮次的聊天模型，包括 Novita 暴露的 DeepSeek、Moonshot、MiniMax、GLM 和 Qwen 路由。

此提供商使用 Novita 的 OpenAI 兼容端点。OpenClaw 负责提供商注册、认证、别名、模型引用规范化和基础 URL 选择；Novita 控制实时模型可用性、账户权限、定价和速率限制。

## 设置

在 [novita.ai/settings/key-management](https://novita.ai/settings/key-management) 创建 API key，然后运行：

```bash
openclaw onboard --auth-choice novita-api-key
```

或者设置：

```bash
export NOVITA_API_KEY="<your-novita-api-key>" # pragma: allowlist secret
```

## 默认值

- 提供商：`novita`
- 别名：`novita-ai`、`novitaai`
- 基础 URL：`https://api.novita.ai/openai/v1`
- 环境变量：`NOVITA_API_KEY`
- 默认模型：`novita/deepseek/deepseek-v3-0324`

## 何时选择 Novita

- 你希望通过 OpenAI 兼容 API 托管访问开放权重模型。
- 你希望通过单个提供商账户使用 DeepSeek、Kimi、MiniMax、GLM 或 Qwen 系列路由。
- 你希望在 OpenRouter、GMI、DeepInfra 或直接厂商 API 之外，再增加一条托管式回退路径。
- 相比维护 vLLM、SGLang、LM Studio 或 Ollama 基础设施，你更偏好提供商侧模型托管。

当你需要厂商原生请求参数或支持合同时，请选择直接厂商提供商。当模型必须在你自己的硬件上运行，或必须位于你自己的网络边界之后时，请选择本地提供商。

## Models

内置目录会预置常用的 NovitaAI 路由 ID，包括：

- `novita/moonshotai/kimi-k2.5`
- `novita/minimax/minimax-m2.7`
- `novita/zai-org/glm-5`
- `novita/deepseek/deepseek-v3-0324`
- `novita/deepseek/deepseek-r1-0528`
- `novita/qwen/qwen3-235b-a22b-fp8`

该目录是 OpenClaw 模型选择的起点。你的账户、地区或 Novita 当前目录可能会添加、移除或限制路由。在设置长期默认值前，请先通过 CLI 检查该提供商：

```bash
openclaw models list --provider novita
```

## 故障排除

- `401` 或 `403`：在 Novita 的 key 管理页面验证该 key；如果存储的配置文件已过期，请重新运行 `openclaw onboard --auth-choice novita-api-key`。
- 未知模型错误：使用 `openclaw models list --provider novita` 返回的精确 `novita/<route-id>`。
- 路由缓慢或失败：尝试另一个 Novita 模型路由，或将 Novita 设置为可容忍提供商特定差异的工作负载的回退提供商。

## 相关

- [模型提供商](/zh-CN/concepts/model-providers)
- [所有提供商](/zh-CN/providers/index)

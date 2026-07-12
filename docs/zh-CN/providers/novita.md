---
read_when:
    - 你想使用 NovitaAI 模型运行 OpenClaw
    - 你需要 Novita 提供商 ID、密钥或端点
summary: 通过 OpenClaw 使用 NovitaAI 的 OpenAI 兼容 API
title: NovitaAI
x-i18n:
    generated_at: "2026-07-11T20:52:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83e0e43e68d85d73e790023858a49f971b683129dbbdf6092fbd8bba4d8da331
    source_path: providers/novita.md
    workflow: 16
---

NovitaAI 是一家托管式 AI 基础设施提供商，提供兼容 OpenAI 的 API。
它作为 OpenClaw 内置提供商随附（无需单独安装插件），因此
凭证通过常规模型身份验证流程处理，模型引用的格式类似于
`novita/deepseek/deepseek-v3-0324`。

## 设置

在 [novita.ai/settings/key-management](https://novita.ai/settings/key-management) 创建 API 密钥，然后运行：

```bash
openclaw onboard --auth-choice novita-api-key
```

或者设置：

```bash
export NOVITA_API_KEY="<your-novita-api-key>" # pragma: allowlist secret
```

## 默认值

| 设置          | 值                                 |
| ------------- | ---------------------------------- |
| 提供商 ID     | `novita`                           |
| 别名          | `novita-ai`, `novitaai`            |
| 基础 URL      | `https://api.novita.ai/openai/v1`  |
| 环境变量      | `NOVITA_API_KEY`                   |
| 默认模型      | `novita/deepseek/deepseek-v3-0324` |

## 内置模型目录

- `novita/moonshotai/kimi-k2.5`
- `novita/minimax/minimax-m2.7`
- `novita/zai-org/glm-5`
- `novita/deepseek/deepseek-v3-0324`
- `novita/deepseek/deepseek-r1-0528`
- `novita/qwen/qwen3-235b-a22b-fp8`

这只是一个起始列表，并非实时目录。你的账户、地区或
Novita 当前提供的服务可能会添加、移除或限制路由。在设置
长期使用的默认模型之前，请先检查：

```bash
openclaw models list --provider novita
```

## 何时选择 Novita

- 通过兼容 OpenAI 的 API 访问托管式开放权重模型。
- 使用单个提供商账户访问 DeepSeek、Kimi、MiniMax、GLM 或 Qwen 系列路由。
- 在 DeepInfra、GMI、OpenRouter 或供应商直连 API 之外，提供另一条托管式备用路径。
- 使用提供商侧的模型托管，而不是自行维护 LM Studio、Ollama、SGLang 或 vLLM 基础设施。

当你需要供应商原生请求参数或支持合同时，请选择供应商直连提供商。
当模型必须在你自己的硬件或网络边界内运行时，请选择本地提供商。

## 故障排查

- `401`/`403`：在 Novita 的密钥管理页面中验证密钥；如果存储的配置文件
  已过期，请重新运行 `openclaw onboard --auth-choice novita-api-key`。
- 未知模型错误：使用 `openclaw models list --provider novita`
  返回的确切 `novita/<route-id>`。
- 路由缓慢或失败：尝试其他 Novita 模型路由，或对于能够容忍
  提供商特定差异的工作负载，将 Novita 设置为备用提供商。

## 相关内容

- [模型提供商](/zh-CN/concepts/model-providers)
- [提供商目录](/zh-CN/providers/index)

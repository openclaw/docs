---
read_when:
    - 你想在 OpenClaw 中使用 StepFun 模型
    - 你需要 StepFun 设置指南
summary: 在 OpenClaw 中使用 StepFun 模型
title: StepFun
x-i18n:
    generated_at: "2026-04-05T10:06:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3154852556577b4cfb387a2de281559f2b173c774bfbcaea996abe5379ae684a
    source_path: providers/stepfun.md
    workflow: 15
---

# StepFun

OpenClaw 内置了一个 StepFun 提供商插件，包含两个提供商 id：

- `stepfun` 用于标准端点
- `stepfun-plan` 用于 Step Plan 端点

当前内置目录按接入面有所不同：

- 标准：`step-3.5-flash`
- Step Plan：`step-3.5-flash`、`step-3.5-flash-2603`

## 区域和端点概览

- 中国标准端点：`https://api.stepfun.com/v1`
- 全球标准端点：`https://api.stepfun.ai/v1`
- 中国 Step Plan 端点：`https://api.stepfun.com/step_plan/v1`
- 全球 Step Plan 端点：`https://api.stepfun.ai/step_plan/v1`
- 认证环境变量：`STEPFUN_API_KEY`

`.com` 端点请使用中国区密钥，`.ai`
端点请使用全球密钥。

## CLI 设置

交互式设置：

```bash
openclaw onboard
```

选择以下认证方式之一：

- `stepfun-standard-api-key-cn`
- `stepfun-standard-api-key-intl`
- `stepfun-plan-api-key-cn`
- `stepfun-plan-api-key-intl`

非交互式示例：

```bash
openclaw onboard --auth-choice stepfun-standard-api-key-intl --stepfun-api-key "$STEPFUN_API_KEY"
openclaw onboard --auth-choice stepfun-plan-api-key-intl --stepfun-api-key "$STEPFUN_API_KEY"
```

## 模型引用

- 标准默认模型：`stepfun/step-3.5-flash`
- Step Plan 默认模型：`stepfun-plan/step-3.5-flash`
- Step Plan 备用模型：`stepfun-plan/step-3.5-flash-2603`

## 内置目录

标准（`stepfun`）：

| 模型引用                 | 上下文  | 最大输出 | 说明           |
| ------------------------ | ------- | -------- | -------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536   | 默认标准模型 |

Step Plan（`stepfun-plan`）：

| 模型引用                           | 上下文  | 最大输出 | 说明                 |
| ---------------------------------- | ------- | -------- | -------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536   | 默认 Step Plan 模型 |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536   | 其他 Step Plan 模型 |

## 配置片段

标准提供商：

```json5
{
  env: { STEPFUN_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "stepfun/step-3.5-flash" } } },
  models: {
    mode: "merge",
    providers: {
      stepfun: {
        baseUrl: "https://api.stepfun.ai/v1",
        api: "openai-completions",
        apiKey: "${STEPFUN_API_KEY}",
        models: [
          {
            id: "step-3.5-flash",
            name: "Step 3.5 Flash",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

Step Plan 提供商：

```json5
{
  env: { STEPFUN_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "stepfun-plan/step-3.5-flash" } } },
  models: {
    mode: "merge",
    providers: {
      "stepfun-plan": {
        baseUrl: "https://api.stepfun.ai/step_plan/v1",
        api: "openai-completions",
        apiKey: "${STEPFUN_API_KEY}",
        models: [
          {
            id: "step-3.5-flash",
            name: "Step 3.5 Flash",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 65536,
          },
          {
            id: "step-3.5-flash-2603",
            name: "Step 3.5 Flash 2603",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## 说明

- 该提供商随 OpenClaw 内置，因此不需要单独安装插件。
- `step-3.5-flash-2603` 当前仅在 `stepfun-plan` 上提供。
- 单次认证流程会为 `stepfun` 和 `stepfun-plan` 写入区域匹配的配置文件，因此两个接入面都可以一起被发现。
- 使用 `openclaw models list` 和 `openclaw models set <provider/model>` 查看或切换模型。
- 更广泛的提供商概览，请参见 [模型提供商](/zh-CN/concepts/model-providers)。

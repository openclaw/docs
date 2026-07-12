---
read_when:
    - 你想在 OpenClaw 中使用 StepFun 模型
    - 你需要 StepFun 设置指南
summary: 通过 OpenClaw 使用 StepFun 模型
title: 阶跃星辰
x-i18n:
    generated_at: "2026-07-12T14:44:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c65e6d395f4ea890efc0e4847ec21dc1c2796fa240d20ca3e6d40eea480ed9f4
    source_path: providers/stepfun.md
    workflow: 16
---

StepFun 以外部官方插件（`@openclaw/stepfun-provider`）形式提供，包含两个提供商 ID：

- `stepfun` 用于标准端点
- `stepfun-plan` 用于 Step Plan 端点

<Warning>
标准端点和 Step Plan 是**不同的提供商**，使用不同的端点和模型引用前缀（`stepfun/...` 与 `stepfun-plan/...`）。中国区密钥应与 `.com` 端点搭配使用，全球密钥应与 `.ai` 端点搭配使用。
</Warning>

## 安装插件

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## 区域和端点概览

| 端点      | 中国区（`.com`）                       | 全球（`.ai`）                         |
| --------- | -------------------------------------- | ------------------------------------- |
| 标准      | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

身份验证环境变量：`STEPFUN_API_KEY`

## 内置目录

标准（`stepfun`）：

| 模型引用                 | 上下文  | 最大输出   | 说明                         |
| ------------------------ | ------- | ---------- | ---------------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536     | 默认标准模型                 |
| `stepfun/step-3.7-flash` | 262,144 | 262,144    | 支持多模态图像输入           |

Step Plan（`stepfun-plan`）：

| 模型引用                           | 上下文  | 最大输出   | 说明                         |
| ---------------------------------- | ------- | ---------- | ---------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536     | 默认 Step Plan 模型          |
| `stepfun-plan/step-3.7-flash`      | 262,144 | 262,144    | 支持多模态图像输入           |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536     | 其他 Step Plan 模型          |

## 入门指南

<Tabs>
  <Tab title="标准">
    最适合通过 StepFun 标准端点进行通用操作。

    <Steps>
      <Step title="选择端点区域">
        | 身份验证选项                   | 端点                          | 区域 |
        | -------------------------------- | ----------------------------- | -------------- |
        | `stepfun-standard-api-key-intl` | `https://api.stepfun.ai/v1`  | 国际 |
        | `stepfun-standard-api-key-cn`   | `https://api.stepfun.com/v1` | 中国 |
      </Step>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        中国区端点：

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="非交互式替代方案">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    默认模型：`stepfun/step-3.5-flash`
    备选模型：`stepfun/step-3.7-flash`

  </Tab>

  <Tab title="Step Plan">
    最适合 Step Plan 推理端点。

    <Steps>
      <Step title="选择端点区域">
        | 身份验证选项                | 端点                                       | 区域 |
        | ------------------------------ | ------------------------------------------ | -------------- |
        | `stepfun-plan-api-key-intl` | `https://api.stepfun.ai/step_plan/v1`  | 国际 |
        | `stepfun-plan-api-key-cn`   | `https://api.stepfun.com/step_plan/v1` | 中国 |
      </Step>
      <Step title="运行新手引导">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        中国区端点：

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="非交互式替代方案">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    默认模型：`stepfun-plan/step-3.5-flash`
    备选模型：`stepfun-plan/step-3.7-flash`、`stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

一次身份验证流程会为 `stepfun` 和 `stepfun-plan` 写入与区域匹配的配置文件，因此运行一次新手引导后即可同时发现这两个接口。

## 高级配置

<AccordionGroup>
  <Accordion title="完整配置：标准提供商">
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
                id: "step-3.7-flash",
                name: "Step 3.7 Flash",
                reasoning: true,
                input: ["text", "image"],
                thinkingLevelMap: { off: "low", minimal: "low", xhigh: "high", max: "high" },
                cost: { input: 0.2, output: 1.15, cacheRead: 0.04, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
                compat: {
                  supportsStore: false,
                  supportsDeveloperRole: false,
                  supportsUsageInStreaming: false,
                  supportsReasoningEffort: true,
                  supportsStrictMode: false,
                  supportedReasoningEfforts: ["low", "medium", "high"],
                  maxTokensField: "max_tokens",
                  reasoningEffortMap: {
                    off: "low",
                    none: "low",
                    minimal: "low",
                    low: "low",
                    medium: "medium",
                    high: "high",
                    xhigh: "high",
                    adaptive: "high",
                    max: "high",
                  },
                },
              },
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
  </Accordion>

  <Accordion title="完整配置：Step Plan 提供商">
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
                id: "step-3.7-flash",
                name: "Step 3.7 Flash",
                reasoning: true,
                input: ["text", "image"],
                thinkingLevelMap: { off: "low", minimal: "low", xhigh: "high", max: "high" },
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
                compat: {
                  supportsStore: false,
                  supportsDeveloperRole: false,
                  supportsUsageInStreaming: false,
                  supportsReasoningEffort: true,
                  supportsStrictMode: false,
                  supportedReasoningEfforts: ["low", "medium", "high"],
                  maxTokensField: "max_tokens",
                  reasoningEffortMap: {
                    off: "low",
                    none: "low",
                    minimal: "low",
                    low: "low",
                    medium: "medium",
                    high: "high",
                    xhigh: "high",
                    adaptive: "high",
                    max: "high",
                  },
                },
              },
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
  </Accordion>

  <Accordion title="说明">
    - `step-3.7-flash` 可通过 OpenClaw 接受文本和图像输入。StepFun API 还支持视频，但 OpenClaw 尚未将视频作为模型输入模态。
    - Step 3.7 支持 `low`、`medium` 和 `high` 推理强度。由于该模型没有非推理模式，`/think off` 会映射到 `low`。
    - `step-3.5-flash-2603` 目前仅在 `stepfun-plan` 上提供。
    - 使用 `openclaw models list` 和 `openclaw models set <provider/model>` 检查或切换模型。

  </Accordion>
</AccordionGroup>

## 相关内容

<CardGroup cols={2}>
  <Card title="模型提供商" href="/zh-CN/concepts/model-providers" icon="layers">
    所有提供商、模型引用和故障转移行为的概览。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    提供商、模型和插件的完整配置架构。
  </Card>
  <Card title="模型 CLI" href="/zh-CN/concepts/models" icon="brain">
    如何选择和配置模型。
  </Card>
  <Card title="StepFun 平台" href="https://platform.stepfun.com" icon="globe">
    StepFun API 密钥管理和文档。
  </Card>
</CardGroup>

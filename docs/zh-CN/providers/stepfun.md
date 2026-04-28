---
read_when:
    - 你想在 OpenClaw 中使用 StepFun 模型
    - 你需要 StepFun 设置指导
summary: 在 OpenClaw 中使用 StepFun 模型
title: StepFun
x-i18n:
    generated_at: "2026-04-28T12:02:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9d43f6e8cda9703a0b9b82d079b282ed5c955676b99b946529582af230d8d10
    source_path: providers/stepfun.md
    workflow: 16
---

OpenClaw 包含一个内置的 StepFun 提供商插件，带有两个提供商 ID：

- `stepfun` 用于标准端点
- `stepfun-plan` 用于 Step Plan 端点

<Warning>
标准端点和 Step Plan 是**独立的提供商**，具有不同的端点和模型引用前缀（`stepfun/...` 与 `stepfun-plan/...`）。`.com` 端点使用中国区密钥，`.ai` 端点使用全球区密钥。
</Warning>

## 区域和端点概览

| 端点      | 中国区（`.com`）                       | 全球区（`.ai`）                       |
| --------- | -------------------------------------- | ------------------------------------- |
| 标准      | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

认证环境变量：`STEPFUN_API_KEY`

## 内置目录

标准（`stepfun`）：

| 模型引用                 | 上下文  | 最大输出   | 备注             |
| ------------------------ | ------- | ---------- | ---------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536     | 默认标准模型     |

Step Plan（`stepfun-plan`）：

| 模型引用                           | 上下文  | 最大输出   | 备注                      |
| ---------------------------------- | ------- | ---------- | ------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536     | 默认 Step Plan 模型       |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536     | 其他 Step Plan 模型       |

## 入门指南

选择你的提供商界面并按照设置步骤操作。

<Tabs>
  <Tab title="Standard">
    **最适合：** 通过标准 StepFun 端点进行通用用途使用。

    <Steps>
      <Step title="Choose your endpoint region">
        | 认证选项                         | 端点                             | 区域   |
        | -------------------------------- | -------------------------------- | ------ |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | 国际区 |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | 中国区 |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        或者用于中国区端点：

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="Non-interactive alternative">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    ### 模型引用

    - 默认模型：`stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **最适合：** Step Plan 推理端点。

    <Steps>
      <Step title="Choose your endpoint region">
        | 认证选项                     | 端点                                    | 区域   |
        | ---------------------------- | --------------------------------------- | ------ |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | 国际区 |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | 中国区 |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        或者用于中国区端点：

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="Non-interactive alternative">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    ### 模型引用

    - 默认模型：`stepfun-plan/step-3.5-flash`
    - 备用模型：`stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

## 高级配置

<AccordionGroup>
  <Accordion title="Full config: Standard provider">
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
  </Accordion>

  <Accordion title="Full config: Step Plan provider">
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
  </Accordion>

  <Accordion title="Notes">
    - 该提供商随 OpenClaw 内置，因此不需要单独的插件安装步骤。
    - `step-3.5-flash-2603` 目前仅在 `stepfun-plan` 上公开。
    - 单个认证流程会为 `stepfun` 和 `stepfun-plan` 写入区域匹配的配置文件，因此可以同时发现这两个界面。
    - 使用 `openclaw models list` 和 `openclaw models set <provider/model>` 检查或切换模型。

  </Accordion>
</AccordionGroup>

<Note>
有关更广泛的提供商概览，请参阅[模型提供商](/zh-CN/concepts/model-providers)。
</Note>

## 相关内容

<CardGroup cols={2}>
  <Card title="Model selection" href="/zh-CN/concepts/model-providers" icon="layers">
    所有提供商、模型引用和故障转移行为的概览。
  </Card>
  <Card title="Configuration reference" href="/zh-CN/gateway/configuration-reference" icon="gear">
    提供商、模型和插件的完整配置架构。
  </Card>
  <Card title="Model selection" href="/zh-CN/concepts/models" icon="brain">
    如何选择和配置模型。
  </Card>
  <Card title="StepFun Platform" href="https://platform.stepfun.com" icon="globe">
    StepFun API 密钥管理和文档。
  </Card>
</CardGroup>

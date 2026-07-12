---
read_when:
    - Bạn muốn sử dụng các mô hình StepFun trong OpenClaw
    - Bạn cần hướng dẫn thiết lập StepFun
summary: Sử dụng các mô hình StepFun với OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-07-12T08:17:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c65e6d395f4ea890efc0e4847ec21dc1c2796fa240d20ca3e6d40eea480ed9f4
    source_path: providers/stepfun.md
    workflow: 16
---

StepFun được phân phối dưới dạng plugin chính thức bên ngoài (`@openclaw/stepfun-provider`) với hai mã nhà cung cấp:

- `stepfun` dành cho điểm cuối tiêu chuẩn
- `stepfun-plan` dành cho điểm cuối Step Plan

<Warning>
Tiêu chuẩn và Step Plan là **hai nhà cung cấp riêng biệt** với các điểm cuối và tiền tố tham chiếu mô hình khác nhau (`stepfun/...` so với `stepfun-plan/...`). Sử dụng khóa Trung Quốc với các điểm cuối `.com` và khóa toàn cầu với các điểm cuối `.ai`.
</Warning>

## Cài đặt plugin

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## Tổng quan về khu vực và điểm cuối

| Điểm cuối | Trung Quốc (`.com`)                     | Toàn cầu (`.ai`)                       |
| --------- | -------------------------------------- | ------------------------------------- |
| Tiêu chuẩn | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Biến môi trường xác thực: `STEPFUN_API_KEY`

## Danh mục tích hợp sẵn

Tiêu chuẩn (`stepfun`):

| Tham chiếu mô hình       | Ngữ cảnh | Đầu ra tối đa | Ghi chú                        |
| ------------------------ | ------- | ---------- | ------------------------------ |
| `stepfun/step-3.5-flash` | 262,144 | 65,536     | Mô hình tiêu chuẩn mặc định    |
| `stepfun/step-3.7-flash` | 262,144 | 262,144    | Hỗ trợ đầu vào hình ảnh đa phương thức |

Step Plan (`stepfun-plan`):

| Tham chiếu mô hình                 | Ngữ cảnh | Đầu ra tối đa | Ghi chú                        |
| ---------------------------------- | ------- | ---------- | ------------------------------ |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536     | Mô hình Step Plan mặc định     |
| `stepfun-plan/step-3.7-flash`      | 262,144 | 262,144    | Hỗ trợ đầu vào hình ảnh đa phương thức |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536     | Mô hình Step Plan bổ sung      |

## Bắt đầu

<Tabs>
  <Tab title="Standard">
    Phù hợp nhất cho mục đích sử dụng đa năng thông qua điểm cuối StepFun tiêu chuẩn.

    <Steps>
      <Step title="Choose your endpoint region">
        | Lựa chọn xác thực              | Điểm cuối                    | Khu vực       |
        | -------------------------------- | ----------------------------- | -------------- |
        | `stepfun-standard-api-key-intl` | `https://api.stepfun.ai/v1`  | Quốc tế       |
        | `stepfun-standard-api-key-cn`   | `https://api.stepfun.com/v1` | Trung Quốc    |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Điểm cuối Trung Quốc:

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

    Mô hình mặc định: `stepfun/step-3.5-flash`
    Mô hình thay thế: `stepfun/step-3.7-flash`

  </Tab>

  <Tab title="Step Plan">
    Phù hợp nhất cho điểm cuối suy luận Step Plan.

    <Steps>
      <Step title="Choose your endpoint region">
        | Lựa chọn xác thực           | Điểm cuối                               | Khu vực       |
        | ------------------------------ | ------------------------------------------ | -------------- |
        | `stepfun-plan-api-key-intl` | `https://api.stepfun.ai/step_plan/v1`  | Quốc tế       |
        | `stepfun-plan-api-key-cn`   | `https://api.stepfun.com/step_plan/v1` | Trung Quốc    |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Điểm cuối Trung Quốc:

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

    Mô hình mặc định: `stepfun-plan/step-3.5-flash`
    Các mô hình thay thế: `stepfun-plan/step-3.7-flash`, `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

Một luồng xác thực duy nhất sẽ ghi các hồ sơ phù hợp với khu vực cho cả `stepfun` và `stepfun-plan`, vì vậy cả hai bề mặt đều được phát hiện cùng nhau sau một lần chạy quy trình thiết lập ban đầu.

## Cấu hình nâng cao

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

  <Accordion title="Notes">
    - `step-3.7-flash` chấp nhận đầu vào văn bản và hình ảnh thông qua OpenClaw. API của StepFun cũng hỗ trợ video, nhưng đây chưa phải là một phương thức đầu vào mô hình trong OpenClaw.
    - Step 3.7 hỗ trợ mức nỗ lực suy luận `low`, `medium` và `high`. Vì mô hình không có chế độ không suy luận, `/think off` được ánh xạ thành `low`.
    - `step-3.5-flash-2603` hiện chỉ được cung cấp trên `stepfun-plan`.
    - Sử dụng `openclaw models list` và `openclaw models set <provider/model>` để kiểm tra hoặc chuyển đổi mô hình.

  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Model providers" href="/vi/concepts/model-providers" icon="layers">
    Tổng quan về tất cả nhà cung cấp, tham chiếu mô hình và hành vi chuyển đổi dự phòng.
  </Card>
  <Card title="Configuration reference" href="/vi/gateway/configuration-reference" icon="gear">
    Lược đồ cấu hình đầy đủ cho nhà cung cấp, mô hình và plugin.
  </Card>
  <Card title="Models CLI" href="/vi/concepts/models" icon="brain">
    Cách chọn và cấu hình mô hình.
  </Card>
  <Card title="StepFun Platform" href="https://platform.stepfun.com" icon="globe">
    Quản lý khóa API và tài liệu của StepFun.
  </Card>
</CardGroup>

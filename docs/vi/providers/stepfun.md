---
read_when:
    - Bạn muốn các mô hình StepFun trong OpenClaw
    - Bạn cần hướng dẫn thiết lập StepFun
summary: Sử dụng các mô hình StepFun với OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-06-27T18:06:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c5d684382ae98a981f6f441f7eb49c01342598952bcf16dc251d0bdfb526ca
    source_path: providers/stepfun.md
    workflow: 16
---

Plugin nhà cung cấp StepFun hỗ trợ hai id nhà cung cấp:

- `stepfun` cho điểm cuối tiêu chuẩn
- `stepfun-plan` cho điểm cuối Step Plan

<Warning>
Standard và Step Plan là **các nhà cung cấp riêng biệt** với điểm cuối và tiền tố model ref khác nhau (`stepfun/...` so với `stepfun-plan/...`). Dùng khóa Trung Quốc với các điểm cuối `.com` và khóa toàn cầu với các điểm cuối `.ai`.
</Warning>

## Cài đặt Plugin

Cài đặt Plugin chính thức, rồi khởi động lại Gateway:

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## Tổng quan về khu vực và điểm cuối

| Điểm cuối | Trung Quốc (`.com`)                   | Toàn cầu (`.ai`)                      |
| --------- | -------------------------------------- | ------------------------------------- |
| Standard  | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Biến môi trường xác thực: `STEPFUN_API_KEY`

## Danh mục tích hợp sẵn

Standard (`stepfun`):

| Model ref                | Ngữ cảnh | Đầu ra tối đa | Ghi chú                  |
| ------------------------ | -------- | ------------- | ------------------------ |
| `stepfun/step-3.5-flash` | 262,144  | 65,536        | Mô hình tiêu chuẩn mặc định |

Step Plan (`stepfun-plan`):

| Model ref                          | Ngữ cảnh | Đầu ra tối đa | Ghi chú                       |
| ---------------------------------- | -------- | ------------- | ----------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144  | 65,536        | Mô hình Step Plan mặc định    |
| `stepfun-plan/step-3.5-flash-2603` | 262,144  | 65,536        | Mô hình Step Plan bổ sung     |

## Bắt đầu

Chọn bề mặt nhà cung cấp của bạn và làm theo các bước thiết lập.

<Tabs>
  <Tab title="Standard">
    **Phù hợp nhất cho:** sử dụng mục đích chung thông qua điểm cuối StepFun tiêu chuẩn.

    <Steps>
      <Step title="Choose your endpoint region">
        | Lựa chọn xác thực             | Điểm cuối                       | Khu vực        |
        | -------------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | Quốc tế       |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | Trung Quốc    |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Hoặc cho điểm cuối Trung Quốc:

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

    ### Model ref

    - Mô hình mặc định: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **Phù hợp nhất cho:** điểm cuối suy luận Step Plan.

    <Steps>
      <Step title="Choose your endpoint region">
        | Lựa chọn xác thực         | Điểm cuối                              | Khu vực        |
        | ---------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | Quốc tế       |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | Trung Quốc    |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Hoặc cho điểm cuối Trung Quốc:

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

    ### Model ref

    - Mô hình mặc định: `stepfun-plan/step-3.5-flash`
    - Mô hình thay thế: `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

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
    - Nhà cung cấp là một gói bên ngoài chính thức; hãy cài đặt trước khi thiết lập.
    - `step-3.5-flash-2603` hiện chỉ được hiển thị trên `stepfun-plan`.
    - Một luồng xác thực duy nhất ghi các hồ sơ khớp khu vực cho cả `stepfun` và `stepfun-plan`, nên có thể khám phá cả hai bề mặt cùng nhau.
    - Dùng `openclaw models list` và `openclaw models set <provider/model>` để kiểm tra hoặc chuyển đổi mô hình.

  </Accordion>
</AccordionGroup>

<Note>
Để xem tổng quan rộng hơn về nhà cung cấp, hãy xem [Nhà cung cấp mô hình](/vi/concepts/model-providers).
</Note>

## Liên quan

<CardGroup cols={2}>
  <Card title="Model selection" href="/vi/concepts/model-providers" icon="layers">
    Tổng quan về tất cả nhà cung cấp, model ref và hành vi failover.
  </Card>
  <Card title="Configuration reference" href="/vi/gateway/configuration-reference" icon="gear">
    Schema cấu hình đầy đủ cho nhà cung cấp, mô hình và Plugin.
  </Card>
  <Card title="Model selection" href="/vi/concepts/models" icon="brain">
    Cách chọn và cấu hình mô hình.
  </Card>
  <Card title="StepFun Platform" href="https://platform.stepfun.com" icon="globe">
    Quản lý khóa API StepFun và tài liệu.
  </Card>
</CardGroup>

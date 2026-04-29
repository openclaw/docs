---
read_when:
    - Bạn muốn dùng các mô hình StepFun trong OpenClaw
    - Bạn cần hướng dẫn thiết lập StepFun
summary: Sử dụng các mô hình StepFun với OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-04-29T23:09:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9d43f6e8cda9703a0b9b82d079b282ed5c955676b99b946529582af230d8d10
    source_path: providers/stepfun.md
    workflow: 16
---

OpenClaw bao gồm một Plugin nhà cung cấp StepFun được tích hợp sẵn với hai id nhà cung cấp:

- `stepfun` cho endpoint tiêu chuẩn
- `stepfun-plan` cho endpoint Step Plan

<Warning>
Standard và Step Plan là **các nhà cung cấp riêng biệt** với endpoint và tiền tố model ref khác nhau (`stepfun/...` so với `stepfun-plan/...`). Dùng khóa Trung Quốc với các endpoint `.com` và khóa toàn cầu với các endpoint `.ai`.
</Warning>

## Tổng quan về khu vực và endpoint

| Endpoint  | Trung Quốc (`.com`)                    | Toàn cầu (`.ai`)                      |
| --------- | -------------------------------------- | ------------------------------------- |
| Standard  | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

Biến môi trường xác thực: `STEPFUN_API_KEY`

## Catalog tích hợp sẵn

Standard (`stepfun`):

| Model ref                | Ngữ cảnh | Đầu ra tối đa | Ghi chú               |
| ------------------------ | -------- | ------------- | --------------------- |
| `stepfun/step-3.5-flash` | 262,144  | 65,536        | Model tiêu chuẩn mặc định |

Step Plan (`stepfun-plan`):

| Model ref                          | Ngữ cảnh | Đầu ra tối đa | Ghi chú                    |
| ---------------------------------- | -------- | ------------- | -------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144  | 65,536        | Model Step Plan mặc định   |
| `stepfun-plan/step-3.5-flash-2603` | 262,144  | 65,536        | Model Step Plan bổ sung    |

## Bắt đầu

Chọn bề mặt nhà cung cấp của bạn và làm theo các bước thiết lập.

<Tabs>
  <Tab title="Tiêu chuẩn">
    **Phù hợp nhất cho:** sử dụng đa mục đích thông qua endpoint StepFun tiêu chuẩn.

    <Steps>
      <Step title="Chọn khu vực endpoint của bạn">
        | Lựa chọn xác thực             | Endpoint                         | Khu vực       |
        | ----------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | Quốc tế       |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | Trung Quốc    |
      </Step>
      <Step title="Chạy onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        Hoặc cho endpoint Trung Quốc:

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="Phương án không tương tác">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Xác minh model có sẵn">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    ### Model ref

    - Model mặc định: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **Phù hợp nhất cho:** endpoint suy luận Step Plan.

    <Steps>
      <Step title="Chọn khu vực endpoint của bạn">
        | Lựa chọn xác thực         | Endpoint                                | Khu vực       |
        | ------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | Quốc tế       |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | Trung Quốc    |
      </Step>
      <Step title="Chạy onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        Hoặc cho endpoint Trung Quốc:

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="Phương án không tương tác">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Xác minh model có sẵn">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    ### Model ref

    - Model mặc định: `stepfun-plan/step-3.5-flash`
    - Model thay thế: `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Cấu hình đầy đủ: Nhà cung cấp Standard">
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

  <Accordion title="Cấu hình đầy đủ: Nhà cung cấp Step Plan">
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

  <Accordion title="Ghi chú">
    - Nhà cung cấp này được tích hợp sẵn với OpenClaw, nên không có bước cài đặt Plugin riêng.
    - `step-3.5-flash-2603` hiện chỉ được cung cấp trên `stepfun-plan`.
    - Một luồng xác thực duy nhất ghi các hồ sơ khớp khu vực cho cả `stepfun` và `stepfun-plan`, nên có thể khám phá cả hai bề mặt cùng nhau.
    - Dùng `openclaw models list` và `openclaw models set <provider/model>` để kiểm tra hoặc chuyển đổi model.

  </Accordion>
</AccordionGroup>

<Note>
Để xem tổng quan nhà cung cấp rộng hơn, hãy xem [Nhà cung cấp model](/vi/concepts/model-providers).
</Note>

## Liên quan

<CardGroup cols={2}>
  <Card title="Lựa chọn model" href="/vi/concepts/model-providers" icon="layers">
    Tổng quan về tất cả nhà cung cấp, model ref và hành vi failover.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/configuration-reference" icon="gear">
    Schema cấu hình đầy đủ cho nhà cung cấp, model và Plugin.
  </Card>
  <Card title="Lựa chọn model" href="/vi/concepts/models" icon="brain">
    Cách chọn và cấu hình model.
  </Card>
  <Card title="Nền tảng StepFun" href="https://platform.stepfun.com" icon="globe">
    Quản lý khóa API StepFun và tài liệu.
  </Card>
</CardGroup>

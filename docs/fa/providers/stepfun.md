---
read_when:
    - شما مدل‌های StepFun را در OpenClaw می‌خواهید
    - به راهنمای راه‌اندازی StepFun نیاز دارید
summary: استفاده از مدل‌های StepFun با OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-04-29T23:28:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9d43f6e8cda9703a0b9b82d079b282ed5c955676b99b946529582af230d8d10
    source_path: providers/stepfun.md
    workflow: 16
---

OpenClaw شامل یک Plugin ارائه‌دهنده StepFun است که به‌صورت همراه عرضه می‌شود و دو شناسه ارائه‌دهنده دارد:

- `stepfun` برای endpoint استاندارد
- `stepfun-plan` برای endpoint Step Plan

<Warning>
Standard و Step Plan **ارائه‌دهنده‌های جداگانه‌ای** هستند که endpointها و پیشوندهای مدل ref متفاوتی دارند (`stepfun/...` در برابر `stepfun-plan/...`). از کلید چین با endpointهای `.com` و از کلید جهانی با endpointهای `.ai` استفاده کنید.
</Warning>

## نمای کلی منطقه و endpoint

| Endpoint  | چین (`.com`)                         | جهانی (`.ai`)                        |
| --------- | -------------------------------------- | ------------------------------------- |
| Standard  | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

متغیر محیطی احراز هویت: `STEPFUN_API_KEY`

## کاتالوگ داخلی

Standard (`stepfun`):

| مدل ref                  | Context | حداکثر خروجی | یادداشت‌ها              |
| ------------------------ | ------- | ---------- | ---------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536     | مدل استاندارد پیش‌فرض |

Step Plan (`stepfun-plan`):

| مدل ref                            | Context | حداکثر خروجی | یادداشت‌ها                  |
| ---------------------------------- | ------- | ---------- | -------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536     | مدل Step Plan پیش‌فرض      |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536     | مدل اضافی Step Plan        |

## شروع به کار

سطح ارائه‌دهنده خود را انتخاب کنید و مراحل راه‌اندازی را دنبال کنید.

<Tabs>
  <Tab title="Standard">
    **بهترین گزینه برای:** استفاده عمومی از طریق endpoint استاندارد StepFun.

    <Steps>
      <Step title="منطقه endpoint خود را انتخاب کنید">
        | انتخاب احراز هویت              | Endpoint                         | منطقه        |
        | -------------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | بین‌المللی |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | چین         |
      </Step>
      <Step title="onboarding را اجرا کنید">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        یا برای endpoint چین:

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="جایگزین غیرتعاملی">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="در دسترس بودن مدل‌ها را بررسی کنید">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    ### مدل‌های ref

    - مدل پیش‌فرض: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **بهترین گزینه برای:** endpoint استدلال Step Plan.

    <Steps>
      <Step title="منطقه endpoint خود را انتخاب کنید">
        | انتخاب احراز هویت          | Endpoint                                | منطقه        |
        | ---------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | بین‌المللی |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | چین         |
      </Step>
      <Step title="onboarding را اجرا کنید">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        یا برای endpoint چین:

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="جایگزین غیرتعاملی">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="در دسترس بودن مدل‌ها را بررسی کنید">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    ### مدل‌های ref

    - مدل پیش‌فرض: `stepfun-plan/step-3.5-flash`
    - مدل جایگزین: `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="پیکربندی کامل: ارائه‌دهنده Standard">
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

  <Accordion title="پیکربندی کامل: ارائه‌دهنده Step Plan">
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

  <Accordion title="یادداشت‌ها">
    - این ارائه‌دهنده همراه OpenClaw عرضه می‌شود، بنابراین مرحله نصب Plugin جداگانه‌ای ندارد.
    - `step-3.5-flash-2603` در حال حاضر فقط روی `stepfun-plan` ارائه می‌شود.
    - یک جریان احراز هویت واحد، پروفایل‌های همسان با منطقه را برای هر دو `stepfun` و `stepfun-plan` می‌نویسد، بنابراین هر دو سطح می‌توانند با هم کشف شوند.
    - از `openclaw models list` و `openclaw models set <provider/model>` برای بررسی یا تغییر مدل‌ها استفاده کنید.

  </Accordion>
</AccordionGroup>

<Note>
برای نمای کلی گسترده‌تر ارائه‌دهنده‌ها، [ارائه‌دهنده‌های مدل](/fa/concepts/model-providers) را ببینید.
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    نمای کلی همه ارائه‌دهنده‌ها، مدل‌های ref، و رفتار failover.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    طرح‌واره کامل پیکربندی برای ارائه‌دهنده‌ها، مدل‌ها، و Pluginها.
  </Card>
  <Card title="انتخاب مدل" href="/fa/concepts/models" icon="brain">
    نحوه انتخاب و پیکربندی مدل‌ها.
  </Card>
  <Card title="پلتفرم StepFun" href="https://platform.stepfun.com" icon="globe">
    مدیریت کلید API و مستندات StepFun.
  </Card>
</CardGroup>

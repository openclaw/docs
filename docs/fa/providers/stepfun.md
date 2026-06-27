---
read_when:
    - شما مدل‌های StepFun را در OpenClaw می‌خواهید
    - به راهنمای راه‌اندازی StepFun نیاز دارید
summary: استفاده از مدل‌های StepFun با OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-06-27T18:44:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c5d684382ae98a981f6f441f7eb49c01342598952bcf16dc251d0bdfb526ca
    source_path: providers/stepfun.md
    workflow: 16
---

Plugin ارائه‌دهنده StepFun از دو شناسه ارائه‌دهنده پشتیبانی می‌کند:

- `stepfun` برای نقطه پایانی استاندارد
- `stepfun-plan` برای نقطه پایانی Step Plan

<Warning>
Standard و Step Plan **ارائه‌دهنده‌های جداگانه‌ای** با نقاط پایانی و پیشوندهای مرجع مدل متفاوت هستند (`stepfun/...` در برابر `stepfun-plan/...`). از کلید چین با نقاط پایانی `.com` و از کلید سراسری با نقاط پایانی `.ai` استفاده کنید.
</Warning>

## نصب Plugin

Plugin رسمی را نصب کنید، سپس Gateway را دوباره راه‌اندازی کنید:

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## نمای کلی منطقه و نقطه پایانی

| نقطه پایانی | چین (`.com`)                           | سراسری (`.ai`)                       |
| --------- | -------------------------------------- | ------------------------------------- |
| استاندارد | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

متغیر محیطی احراز هویت: `STEPFUN_API_KEY`

## کاتالوگ داخلی

استاندارد (`stepfun`):

| مرجع مدل                 | زمینه | حداکثر خروجی | یادداشت‌ها              |
| ------------------------ | ------- | ---------- | ---------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536     | مدل استاندارد پیش‌فرض |

Step Plan (`stepfun-plan`):

| مرجع مدل                           | زمینه | حداکثر خروجی | یادداشت‌ها                  |
| ---------------------------------- | ------- | ---------- | -------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536     | مدل پیش‌فرض Step Plan      |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536     | مدل اضافی Step Plan        |

## شروع به کار

سطح ارائه‌دهنده خود را انتخاب کنید و مراحل راه‌اندازی را دنبال کنید.

<Tabs>
  <Tab title="Standard">
    **بهترین برای:** استفاده عمومی از طریق نقطه پایانی استاندارد StepFun.

    <Steps>
      <Step title="منطقه نقطه پایانی خود را انتخاب کنید">
        | انتخاب احراز هویت              | نقطه پایانی                     | منطقه        |
        | -------------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | بین‌المللی |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | چین         |
      </Step>
      <Step title="اجرای ورود اولیه">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        یا برای نقطه پایانی چین:

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
      <Step title="بررسی در دسترس بودن مدل‌ها">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    ### مراجع مدل

    - مدل پیش‌فرض: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **بهترین برای:** نقطه پایانی استدلال Step Plan.

    <Steps>
      <Step title="منطقه نقطه پایانی خود را انتخاب کنید">
        | انتخاب احراز هویت          | نقطه پایانی                            | منطقه        |
        | ---------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | بین‌المللی |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | چین         |
      </Step>
      <Step title="اجرای ورود اولیه">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        یا برای نقطه پایانی چین:

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
      <Step title="بررسی در دسترس بودن مدل‌ها">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    ### مراجع مدل

    - مدل پیش‌فرض: `stepfun-plan/step-3.5-flash`
    - مدل جایگزین: `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="پیکربندی کامل: ارائه‌دهنده استاندارد">
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
    - ارائه‌دهنده یک بسته خارجی رسمی است؛ پیش از راه‌اندازی آن را نصب کنید.
    - `step-3.5-flash-2603` در حال حاضر فقط روی `stepfun-plan` ارائه می‌شود.
    - یک جریان احراز هویت واحد پروفایل‌های همسان با منطقه را برای هر دو `stepfun` و `stepfun-plan` می‌نویسد، بنابراین هر دو سطح می‌توانند با هم کشف شوند.
    - از `openclaw models list` و `openclaw models set <provider/model>` برای بررسی یا تغییر مدل‌ها استفاده کنید.

  </Accordion>
</AccordionGroup>

<Note>
برای نمای کلی گسترده‌تر ارائه‌دهنده، [ارائه‌دهندگان مدل](/fa/concepts/model-providers) را ببینید.
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    نمای کلی همه ارائه‌دهندگان، مراجع مدل، و رفتار failover.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    طرح‌واره کامل پیکربندی برای ارائه‌دهندگان، مدل‌ها، و plugins.
  </Card>
  <Card title="انتخاب مدل" href="/fa/concepts/models" icon="brain">
    چگونگی انتخاب و پیکربندی مدل‌ها.
  </Card>
  <Card title="پلتفرم StepFun" href="https://platform.stepfun.com" icon="globe">
    مدیریت کلید API و مستندات StepFun.
  </Card>
</CardGroup>

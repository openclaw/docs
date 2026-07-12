---
read_when:
    - شما می‌خواهید از مدل‌های StepFun در OpenClaw استفاده کنید
    - به راهنمای راه‌اندازی StepFun نیاز دارید
summary: از مدل‌های StepFun با OpenClaw استفاده کنید
title: StepFun
x-i18n:
    generated_at: "2026-07-12T10:44:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c65e6d395f4ea890efc0e4847ec21dc1c2796fa240d20ca3e6d40eea480ed9f4
    source_path: providers/stepfun.md
    workflow: 16
---

StepFun به‌صورت یک Plugin رسمی خارجی (`@openclaw/stepfun-provider`) با دو شناسهٔ ارائه‌دهنده عرضه می‌شود:

- `stepfun` برای نقطهٔ پایانی استاندارد
- `stepfun-plan` برای نقطهٔ پایانی Step Plan

<Warning>
استاندارد و Step Plan **دو ارائه‌دهندهٔ جداگانه** با نقاط پایانی و پیشوندهای ارجاع مدل متفاوت هستند (`stepfun/...` در برابر `stepfun-plan/...`). برای نقاط پایانی `.com` از کلید چین و برای نقاط پایانی `.ai` از کلید جهانی استفاده کنید.
</Warning>

## نصب Plugin

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## نمای کلی منطقه و نقطهٔ پایانی

| نقطهٔ پایانی | چین (`.com`)                           | جهانی (`.ai`)                          |
| ------------- | -------------------------------------- | -------------------------------------- |
| استاندارد     | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`            |
| Step Plan     | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1`  |

متغیر محیطی احراز هویت: `STEPFUN_API_KEY`

## فهرست داخلی

استاندارد (`stepfun`):

| ارجاع مدل                | زمینه   | حداکثر خروجی | توضیحات                         |
| ------------------------ | ------- | ------------ | -------------------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536       | مدل استاندارد پیش‌فرض           |
| `stepfun/step-3.7-flash` | 262,144 | 262,144      | پشتیبانی از ورودی تصویر چندوجهی |

Step Plan (`stepfun-plan`):

| ارجاع مدل                          | زمینه   | حداکثر خروجی | توضیحات                         |
| ---------------------------------- | ------- | ------------ | -------------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536       | مدل پیش‌فرض Step Plan            |
| `stepfun-plan/step-3.7-flash`      | 262,144 | 262,144      | پشتیبانی از ورودی تصویر چندوجهی |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536       | مدل اضافی Step Plan              |

## شروع به کار

<Tabs>
  <Tab title="استاندارد">
    مناسب‌ترین گزینه برای استفادهٔ عمومی از طریق نقطهٔ پایانی استاندارد StepFun.

    <Steps>
      <Step title="منطقهٔ نقطهٔ پایانی خود را انتخاب کنید">
        | انتخاب احراز هویت              | نقطهٔ پایانی                 | منطقه       |
        | -------------------------------- | ----------------------------- | ------------ |
        | `stepfun-standard-api-key-intl` | `https://api.stepfun.ai/v1`  | بین‌المللی  |
        | `stepfun-standard-api-key-cn`   | `https://api.stepfun.com/v1` | چین          |
      </Step>
      <Step title="راه‌اندازی اولیه را اجرا کنید">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        نقطهٔ پایانی چین:

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="روش جایگزین غیرتعاملی">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="در دسترس بودن مدل‌ها را تأیید کنید">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    مدل پیش‌فرض: `stepfun/step-3.5-flash`
    مدل جایگزین: `stepfun/step-3.7-flash`

  </Tab>

  <Tab title="Step Plan">
    مناسب‌ترین گزینه برای نقطهٔ پایانی استدلال Step Plan.

    <Steps>
      <Step title="منطقهٔ نقطهٔ پایانی خود را انتخاب کنید">
        | انتخاب احراز هویت           | نقطهٔ پایانی                            | منطقه       |
        | ------------------------------ | ------------------------------------------ | ------------ |
        | `stepfun-plan-api-key-intl` | `https://api.stepfun.ai/step_plan/v1`  | بین‌المللی  |
        | `stepfun-plan-api-key-cn`   | `https://api.stepfun.com/step_plan/v1` | چین          |
      </Step>
      <Step title="راه‌اندازی اولیه را اجرا کنید">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        نقطهٔ پایانی چین:

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="روش جایگزین غیرتعاملی">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="در دسترس بودن مدل‌ها را تأیید کنید">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    مدل پیش‌فرض: `stepfun-plan/step-3.5-flash`
    مدل‌های جایگزین: `stepfun-plan/step-3.7-flash`، `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

یک جریان احراز هویت واحد، نمایه‌های منطبق با منطقه را برای هر دو ارائه‌دهندهٔ `stepfun` و `stepfun-plan` می‌نویسد؛ بنابراین پس از یک‌بار اجرای راه‌اندازی اولیه، هر دو سطح با هم شناسایی می‌شوند.

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="پیکربندی کامل: ارائه‌دهندهٔ استاندارد">
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

  <Accordion title="پیکربندی کامل: ارائه‌دهندهٔ Step Plan">
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

  <Accordion title="نکات">
    - `step-3.7-flash` از طریق OpenClaw ورودی متن و تصویر را می‌پذیرد. API متعلق به StepFun از ویدئو نیز پشتیبانی می‌کند، اما ویدئو هنوز یکی از شیوه‌های ورودی مدل در OpenClaw نیست.
    - Step 3.7 از سطح تلاش استدلال `low`، `medium` و `high` پشتیبانی می‌کند. ازآنجاکه این مدل حالت بدون استدلال ندارد، `/think off` به `low` نگاشت می‌شود.
    - `step-3.5-flash-2603` در حال حاضر فقط در `stepfun-plan` ارائه می‌شود.
    - برای بررسی یا تغییر مدل‌ها از `openclaw models list` و `openclaw models set <provider/model>` استفاده کنید.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="ارائه‌دهندگان مدل" href="/fa/concepts/model-providers" icon="layers">
    نمای کلی همهٔ ارائه‌دهندگان، ارجاع‌های مدل و رفتار تغییر مسیر هنگام خرابی.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    طرح‌وارهٔ کامل پیکربندی برای ارائه‌دهندگان، مدل‌ها و Pluginها.
  </Card>
  <Card title="CLI مدل‌ها" href="/fa/concepts/models" icon="brain">
    نحوهٔ انتخاب و پیکربندی مدل‌ها.
  </Card>
  <Card title="پلتفرم StepFun" href="https://platform.stepfun.com" icon="globe">
    مدیریت کلید API و مستندات StepFun.
  </Card>
</CardGroup>

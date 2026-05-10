---
read_when:
    - شما راه‌اندازی Moonshot K2 (Moonshot Open Platform) در مقابل Kimi Coding را می‌خواهید
    - باید endpointهای جداگانه، کلیدها و ارجاع‌های مدل را درک کنید
    - برای هرکدام از دو ارائه‌دهنده، پیکربندی آمادهٔ کپی/پیست می‌خواهید
summary: پیکربندی Moonshot K2 در برابر Kimi Coding (ارائه‌دهندگان و کلیدهای جداگانه)
title: Moonshot AI
x-i18n:
    generated_at: "2026-05-10T20:04:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f6396d91ac8c1f698531ce067f79d4a4de7a5c7a166099c0fe4b7e5b78fde9e
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot، Kimi API را با اندپوینت‌های سازگار با OpenAI فراهم می‌کند. provider را پیکربندی کنید و مدل پیش‌فرض را روی `moonshot/kimi-k2.6` تنظیم کنید، یا از Kimi Coding با `kimi/kimi-for-coding` استفاده کنید.

<Warning>
Moonshot و Kimi Coding، **providerهای جداگانه** هستند. کلیدها قابل جایگزینی با هم نیستند، اندپوینت‌ها متفاوت‌اند، و ارجاع‌های مدل نیز تفاوت دارند (`moonshot/...` در برابر `kimi/...`).
</Warning>

## کاتالوگ مدل داخلی

[//]: # "moonshot-kimi-k2-ids:start"

| ارجاع مدل                         | نام                   | استدلال | ورودی       | Context | حداکثر خروجی |
| --------------------------------- | ---------------------- | --------- | ----------- | ------- | ---------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | خیر        | متن، تصویر | 262,144 | 262,144    |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | خیر        | متن، تصویر | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | بله       | متن        | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | بله       | متن        | 262,144 | 262,144    |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | خیر        | متن        | 256,000 | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

برآوردهای هزینه همراه برای مدل‌های K2 فعلی میزبانی‌شده توسط Moonshot از نرخ‌های پرداخت به‌ازای مصرف منتشرشده Moonshot استفاده می‌کنند: Kimi K2.6 برای اصابت کش $0.16/MTok، برای ورودی $0.95/MTok، و برای خروجی $4.00/MTok است؛ Kimi K2.5 برای اصابت کش $0.10/MTok، برای ورودی $0.60/MTok، و برای خروجی $3.00/MTok است. سایر ورودی‌های کاتالوگ قدیمی، مگر اینکه آن‌ها را در پیکربندی بازنویسی کنید، جای‌نگهدارهای بدون هزینه را حفظ می‌کنند.

## شروع به کار

provider خود را انتخاب کنید و مراحل راه‌اندازی را دنبال کنید.

<Tabs>
  <Tab title="Moonshot API">
    **بهترین گزینه برای:** مدل‌های Kimi K2 از طریق Moonshot Open Platform.

    <Steps>
      <Step title="Choose your endpoint region">
        | انتخاب احراز هویت            | اندپوینت                       | منطقه        |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | بین‌المللی |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | چین         |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        یا برای اندپوینت چین:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.6" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Run a live smoke test">
        وقتی می‌خواهید دسترسی مدل و رهگیری هزینه را بدون دست‌زدن به نشست‌های عادی خود تأیید کنید، از یک دایرکتوری وضعیت ایزوله استفاده کنید:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        پاسخ JSON باید `provider: "moonshot"` و `model: "kimi-k2.6"` را گزارش کند. ورودی رونوشت دستیار، وقتی Moonshot فراداده مصرف را برمی‌گرداند، مصرف توکن نرمال‌سازی‌شده به‌همراه هزینه تخمینی را زیر `usage.cost` ذخیره می‌کند.
      </Step>
    </Steps>

    ### نمونه پیکربندی

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.6": { alias: "Kimi K2.6" },
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
            "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
            "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
            "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
            // moonshot-kimi-k2-aliases:end
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              // moonshot-kimi-k2-models:start
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking",
                name: "Kimi K2 Thinking",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking-turbo",
                name: "Kimi K2 Thinking Turbo",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-turbo",
                name: "Kimi K2 Turbo",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 16384,
              },
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    **بهترین گزینه برای:** کارهای متمرکز بر کد از طریق اندپوینت Kimi Coding.

    <Note>
    Kimi Coding از کلید API و پیشوند provider متفاوتی (`kimi/...`) نسبت به Moonshot (`moonshot/...`) استفاده می‌کند. ارجاع مدل API پایدار `kimi/kimi-for-coding` است؛ ارجاع‌های قدیمی `kimi/kimi-code` و `kimi/k2p5` همچنان پذیرفته می‌شوند و به آن شناسه مدل API نرمال‌سازی می‌شوند.
    </Note>

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-for-coding" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### نمونه پیکربندی

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: {
            "kimi/kimi-for-coding": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## جست‌وجوی وب Kimi

OpenClaw همچنین **Kimi** را به‌عنوان ارائه‌دهندهٔ `web_search` عرضه می‌کند که با جست‌وجوی وب Moonshot پشتیبانی می‌شود.

<Steps>
  <Step title="راه‌اندازی تعاملی جست‌وجوی وب را اجرا کنید">
    ```bash
    openclaw configure --section web
    ```

    در بخش جست‌وجوی وب، **Kimi** را انتخاب کنید تا
    `plugins.entries.moonshot.config.webSearch.*` ذخیره شود.

  </Step>
  <Step title="ناحیه و مدل جست‌وجوی وب را پیکربندی کنید">
    راه‌اندازی تعاملی برای موارد زیر پرسش می‌کند:

    | تنظیم             | گزینه‌ها                                                              |
    | ------------------- | -------------------------------------------------------------------- |
    | ناحیهٔ API          | `https://api.moonshot.ai/v1` (بین‌المللی) یا `https://api.moonshot.cn/v1` (چین) |
    | مدل جست‌وجوی وب    | به‌طور پیش‌فرض `kimi-k2.6` است                                             |

  </Step>
</Steps>

پیکربندی زیر `plugins.entries.moonshot.config.webSearch` قرار دارد:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // or use KIMI_API_KEY / MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="حالت تفکر بومی">
    Moonshot Kimi از تفکر بومی دودویی پشتیبانی می‌کند:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    آن را برای هر مدل از طریق `agents.defaults.models.<provider/model>.params` پیکربندی کنید:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw همچنین سطح‌های زمان اجرای `/think` را برای Moonshot نگاشت می‌کند:

    | سطح `/think`       | رفتار Moonshot          |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | هر سطحی غیر از off    | `thinking.type=enabled`    |

    <Warning>
    وقتی تفکر Moonshot فعال باشد، `tool_choice` باید `auto` یا `none` باشد. OpenClaw برای سازگاری، مقدارهای ناسازگار `tool_choice` را به `auto` نرمال‌سازی می‌کند.
    </Warning>

    Kimi K2.6 همچنین یک فیلد اختیاری `thinking.keep` را می‌پذیرد که نگه‌داری چندنوبته‌ی `reasoning_content` را کنترل می‌کند. آن را روی `"all"` تنظیم کنید تا استدلال کامل در نوبت‌ها حفظ شود؛ آن را حذف کنید (یا `null` بگذارید) تا از راهبرد پیش‌فرض سرور استفاده شود. OpenClaw فقط `thinking.keep` را برای `moonshot/kimi-k2.6` ارسال می‌کند و آن را از مدل‌های دیگر حذف می‌کند.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "enabled", keep: "all" },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="پاک‌سازی شناسه tool call">
    Moonshot Kimi شناسه‌های tool_call را به شکل `functions.<name>:<index>` ارائه می‌کند. OpenClaw آن‌ها را بدون تغییر حفظ می‌کند تا tool callهای چندنوبته همچنان کار کنند.

    برای اعمال پاک‌سازی سخت‌گیرانه روی یک ارائه‌دهنده‌ی سفارشی سازگار با OpenAI، `sanitizeToolCallIds: true` را تنظیم کنید:

    ```json5
    {
      models: {
        providers: {
          "my-kimi-proxy": {
            api: "openai-completions",
            sanitizeToolCallIds: true,
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="سازگاری مصرف استریمینگ">
    نقاط پایانی بومی Moonshot (`https://api.moonshot.ai/v1` و `https://api.moonshot.cn/v1`) سازگاری مصرف استریمینگ را روی ترابرد مشترک `openai-completions` اعلام می‌کنند. OpenClaw این را بر اساس قابلیت‌های نقطه پایانی تعیین می‌کند، بنابراین شناسه‌های ارائه‌دهنده‌ی سفارشی سازگار که همان میزبان‌های بومی Moonshot را هدف می‌گیرند، همان رفتار مصرف استریمینگ را به ارث می‌برند.

    با قیمت‌گذاری K2.6 همراه، مصرف استریم‌شده‌ای که شامل توکن‌های ورودی، خروجی و cache-read باشد نیز برای `/status`، `/usage full`، `/usage cost` و حسابداری نشست مبتنی بر رونوشت به هزینه‌ی تخمینی محلی به دلار آمریکا تبدیل می‌شود.

  </Accordion>

  <Accordion title="مرجع endpoint و model ref">
    | ارائه‌دهنده   | پیشوند model ref | Endpoint                      | متغیر محیطی احراز هویت        |
    | ---------- | ---------------- | ----------------------------- | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | endpoint Kimi Coding          | `KIMI_API_KEY`      |
    | Kimi Coding| `kimi/`          | endpoint Kimi Coding          | `KIMI_API_KEY`      |
    | جست‌وجوی وب | N/A              | همان منطقه API مربوط به Moonshot   | `KIMI_API_KEY` یا `MOONSHOT_API_KEY` |

    - جست‌وجوی وب Kimi از `KIMI_API_KEY` یا `MOONSHOT_API_KEY` استفاده می‌کند و به‌طور پیش‌فرض با مدل `kimi-k2.6` روی `https://api.moonshot.ai/v1` تنظیم می‌شود.
    - در صورت نیاز، قیمت‌گذاری و فراداده زمینه را در `models.providers` بازنویسی کنید.
    - اگر Moonshot محدودیت‌های زمینه متفاوتی برای یک مدل منتشر کند، `contextWindow` را مطابق آن تنظیم کنید.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهنده‌ها، model refها، و رفتار failover.
  </Card>
  <Card title="جست‌وجوی وب" href="/fa/tools/web" icon="magnifying-glass">
    پیکربندی ارائه‌دهنده‌های جست‌وجوی وب، از جمله Kimi.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    طرح‌واره کامل پیکربندی برای ارائه‌دهنده‌ها، مدل‌ها، و Pluginها.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    مدیریت کلید API و مستندات Moonshot.
  </Card>
</CardGroup>

---
read_when:
    - راه‌اندازی Moonshot K2 (Moonshot Open Platform) در مقایسه با Kimi Coding را می‌خواهید
    - باید نقاط پایانی، کلیدها و ارجاع‌های مدلِ جداگانه را درک کنید
    - پیکربندی آمادهٔ کپی/پیست برای هر یک از ارائه‌دهندگان را می‌خواهید
summary: پیکربندی Moonshot K2 در برابر Kimi Coding (ارائه‌دهنده‌ها + کلیدهای جداگانه)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-29T23:27:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd6ababe59354a302975b68f4cdb12a623647f8e5cadfb8ae58a74bb2934ce65
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot ‏Kimi API را با نقاط پایانی سازگار با OpenAI ارائه می‌کند. provider را پیکربندی کنید و مدل پیش‌فرض را روی `moonshot/kimi-k2.6` تنظیم کنید، یا از Kimi Coding با `kimi/kimi-code` استفاده کنید.

<Warning>
Moonshot و Kimi Coding **providerهای جداگانه** هستند. کلیدها قابل‌جابه‌جایی نیستند، نقاط پایانی متفاوت‌اند، و ارجاع‌های مدل فرق دارند (`moonshot/...` در برابر `kimi/...`).
</Warning>

## کاتالوگ مدل داخلی

[//]: # "moonshot-kimi-k2-ids:start"

| ارجاع مدل                         | نام                    | استدلال | ورودی      | زمینه  | حداکثر خروجی |
| --------------------------------- | ---------------------- | ------- | ---------- | ------ | ------------ |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | خیر     | متن، تصویر | 262,144 | 262,144      |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | خیر     | متن، تصویر | 262,144 | 262,144      |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | بله     | متن        | 262,144 | 262,144      |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | بله     | متن        | 262,144 | 262,144      |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | خیر     | متن        | 256,000 | 16,384       |

[//]: # "moonshot-kimi-k2-ids:end"

برآوردهای هزینه همراه برای مدل‌های K2 فعلی میزبانی‌شده در Moonshot از نرخ‌های پرداخت به‌ازای مصرف منتشرشده Moonshot استفاده می‌کنند: Kimi K2.6 برای cache hit برابر با ‎$0.16/MTok، برای ورودی ‎$0.95/MTok، و برای خروجی ‎$4.00/MTok است؛ Kimi K2.5 برای cache hit برابر با ‎$0.10/MTok، برای ورودی ‎$0.60/MTok، و برای خروجی ‎$3.00/MTok است. سایر ورودی‌های قدیمی کاتالوگ placeholderهای با هزینه صفر را نگه می‌دارند، مگر اینکه آن‌ها را در config بازنویسی کنید.

## شروع به کار

provider خود را انتخاب کنید و مراحل راه‌اندازی را دنبال کنید.

<Tabs>
  <Tab title="Moonshot API">
    **مناسب برای:** مدل‌های Kimi K2 از طریق پلتفرم باز Moonshot.

    <Steps>
      <Step title="Choose your endpoint region">
        | انتخاب احراز هویت     | نقطه پایانی                    | منطقه        |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | بین‌المللی   |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | چین          |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        یا برای نقطه پایانی چین:

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
        وقتی می‌خواهید دسترسی به مدل و ردیابی هزینه را بدون دست‌زدن به نشست‌های معمول خود بررسی کنید، از یک دایرکتوری وضعیت جداگانه استفاده کنید:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        پاسخ JSON باید `provider: "moonshot"` و `model: "kimi-k2.6"` را گزارش کند. ورودی transcript دستیار، زمانی که Moonshot فراداده usage را برمی‌گرداند، مصرف token نرمال‌سازی‌شده به‌همراه هزینه تخمینی را زیر `usage.cost` ذخیره می‌کند.
      </Step>
    </Steps>

    ### نمونه config

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
    **مناسب برای:** کارهای متمرکز بر کد از طریق نقطه پایانی Kimi Coding.

    <Note>
    Kimi Coding از کلید API و پیشوند provider متفاوتی (`kimi/...`) نسبت به Moonshot (`moonshot/...`) استفاده می‌کند. ارجاع مدل قدیمی `kimi/k2p5` همچنان به‌عنوان شناسه سازگاری پذیرفته می‌شود.
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
              model: { primary: "kimi/kimi-code" },
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

    ### نمونه config

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-code" },
          models: {
            "kimi/kimi-code": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## جست‌وجوی وب Kimi

OpenClaw همچنین **Kimi** را به‌عنوان ارائه‌دهنده‌ی `web_search`، با پشتیبانی جست‌وجوی وب Moonshot، عرضه می‌کند.

<Steps>
  <Step title="Run interactive web search setup">
    ```bash
    openclaw configure --section web
    ```

    در بخش جست‌وجوی وب، **Kimi** را انتخاب کنید تا
    `plugins.entries.moonshot.config.webSearch.*` ذخیره شود.

  </Step>
  <Step title="Configure the web search region and model">
    راه‌اندازی تعاملی برای این موارد از شما ورودی می‌خواهد:

    | تنظیمات             | گزینه‌ها                                                              |
    | ------------------- | -------------------------------------------------------------------- |
    | منطقه‌ی API          | `https://api.moonshot.ai/v1` (بین‌المللی) یا `https://api.moonshot.cn/v1` (چین) |
    | مدل جست‌وجوی وب    | پیش‌فرض `kimi-k2.6` است                                             |

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
  <Accordion title="Native thinking mode">
    Moonshot Kimi از حالت تفکر بومی دودویی پشتیبانی می‌کند:

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
    | هر سطحی به‌جز off    | `thinking.type=enabled`    |

    <Warning>
    وقتی اندیشیدن Moonshot فعال است، `tool_choice` باید `auto` یا `none` باشد. OpenClaw برای سازگاری، مقدارهای ناسازگار `tool_choice` را به `auto` نرمال‌سازی می‌کند.
    </Warning>

    Kimi K2.6 همچنین یک فیلد اختیاری `thinking.keep` می‌پذیرد که نگهداری چندنوبتی `reasoning_content` را کنترل می‌کند. آن را روی `"all"` تنظیم کنید تا استدلال کامل در نوبت‌ها حفظ شود؛ آن را حذف کنید (یا `null` بگذارید) تا راهبرد پیش‌فرض سرور استفاده شود. OpenClaw فقط `thinking.keep` را برای `moonshot/kimi-k2.6` ارسال می‌کند و آن را از مدل‌های دیگر حذف می‌کند.

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

  <Accordion title="پاک‌سازی شناسهٔ فراخوانی ابزار">
    Moonshot Kimi شناسه‌های tool_call را به شکل `functions.<name>:<index>` ارائه می‌دهد. OpenClaw آن‌ها را بدون تغییر حفظ می‌کند تا فراخوانی‌های چندنوبتی ابزار همچنان کار کنند.

    برای اجبار پاک‌سازی سخت‌گیرانه در یک ارائه‌دهندهٔ سفارشی سازگار با OpenAI، `sanitizeToolCallIds: true` را تنظیم کنید:

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

  <Accordion title="سازگاری استفاده در Streaming">
    نقاط پایانی بومی Moonshot (`https://api.moonshot.ai/v1` و
    `https://api.moonshot.cn/v1`) سازگاری استفاده در Streaming را روی انتقال مشترک `openai-completions` اعلام می‌کنند. OpenClaw این را بر اساس قابلیت‌های نقطهٔ پایانی تعیین می‌کند، بنابراین شناسه‌های ارائه‌دهندهٔ سفارشی سازگار که همان میزبان‌های بومی Moonshot را هدف می‌گیرند، همان رفتار استفادهٔ Streaming را به ارث می‌برند.

    با قیمت‌گذاری همراه K2.6، استفادهٔ Streaming که شامل توکن‌های ورودی، خروجی و cache-read باشد، همچنین برای `/status`، `/usage full`، `/usage cost` و حسابداری نشست مبتنی بر رونوشت به هزینهٔ تخمینی محلی USD تبدیل می‌شود.

  </Accordion>

  <Accordion title="مرجع Endpoint و model ref">
    | ارائه‌دهنده   | پیشوند model ref | Endpoint                      | متغیر محیطی احراز هویت        |
    | ---------- | ---------------- | ----------------------------- | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Endpoint مربوط به Kimi Coding          | `KIMI_API_KEY`      |
    | جست‌وجوی وب | N/A              | همان ناحیه API مربوط به Moonshot   | `KIMI_API_KEY` یا `MOONSHOT_API_KEY` |

    - جست‌وجوی وب Kimi از `KIMI_API_KEY` یا `MOONSHOT_API_KEY` استفاده می‌کند و به‌صورت پیش‌فرض با مدل `kimi-k2.6` روی `https://api.moonshot.ai/v1` تنظیم می‌شود.
    - در صورت نیاز، قیمت‌گذاری و فراداده زمینه را در `models.providers` بازنویسی کنید.
    - اگر Moonshot محدودیت‌های زمینه متفاوتی برای یک مدل منتشر کند، `contextWindow` را متناسب با آن تنظیم کنید.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهنده‌ها، model refها، و رفتار failover.
  </Card>
  <Card title="جست‌وجوی وب" href="/fa/tools/web" icon="magnifying-glass">
    پیکربندی ارائه‌دهنده‌های جست‌وجوی وب از جمله Kimi.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    طرح‌واره کامل پیکربندی برای ارائه‌دهنده‌ها، مدل‌ها، و plugins.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    مدیریت کلید API و مستندات Moonshot.
  </Card>
</CardGroup>

---
read_when:
    - شما راه‌اندازی Moonshot K2 (Moonshot Open Platform) در برابر راه‌اندازی Kimi Coding را می‌خواهید
    - باید نقاط پایانی، کلیدها و ارجاع‌های مدلِ مجزا را درک کنید
    - شما پیکربندی قابل کپی/جای‌گذاری برای هرکدام از ارائه‌دهنده‌ها می‌خواهید.
summary: پیکربندی Moonshot K2 در برابر Kimi Coding (ارائه‌دهندگان و کلیدهای جداگانه)
title: Moonshot AI
x-i18n:
    generated_at: "2026-06-27T18:41:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7365d7e843275750824a937553dcf535245146fb49fe00c622bf14b71d2dd17
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot API کیمی را با endpointهای سازگار با OpenAI ارائه می‌کند. provider را پیکربندی کنید و مدل پیش‌فرض را روی `moonshot/kimi-k2.6` تنظیم کنید، یا از Kimi Coding با `kimi/kimi-for-coding` استفاده کنید.

<Warning>
Moonshot و Kimi Coding **providerهای جداگانه‌ای** هستند. کلیدها قابل‌جابه‌جایی نیستند، endpointها متفاوت‌اند، و ارجاع‌های مدل فرق دارند (`moonshot/...` در برابر `kimi/...`).
</Warning>

## کاتالوگ مدل داخلی

[//]: # "moonshot-kimi-k2-ids:start"

| ارجاع مدل                         | نام                   | استدلال | ورودی       | زمینه | حداکثر خروجی |
| --------------------------------- | ---------------------- | --------- | ----------- | ------- | ---------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | خیر        | متن، تصویر | 262,144 | 262,144    |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | همیشه روشن | متن، تصویر | 262,144 | 262,144    |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | خیر        | متن، تصویر | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | بله       | متن        | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | بله       | متن        | 262,144 | 262,144    |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | خیر        | متن        | 256,000 | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

برآوردهای هزینه کاتالوگ برای مدل‌های فعلی K2 میزبانی‌شده توسط Moonshot از نرخ‌های منتشرشده پرداخت به‌ازای مصرف Moonshot استفاده می‌کند: Kimi K2.7 Code برای hit کش $0.19/MTok، برای ورودی $0.95/MTok، و برای خروجی $4.00/MTok است؛ Kimi K2.6 برای hit کش $0.16/MTok، برای ورودی $0.95/MTok، و برای خروجی $4.00/MTok است؛ Kimi K2.5 برای hit کش $0.10/MTok، برای ورودی $0.60/MTok، و برای خروجی $3.00/MTok است. سایر ورودی‌های قدیمی کاتالوگ، مگر اینکه در config آن‌ها را override کنید، جای‌نگهدارهای بدون هزینه را حفظ می‌کنند.

Kimi K2.7 Code همیشه از تفکر بومی استفاده می‌کند. OpenClaw برای این مدل فقط وضعیت تفکر `on` را در دسترس می‌گذارد و کنترل‌های خروجی `thinking` و `reasoning_effort` را، طبق الزام Moonshot، حذف می‌کند. OpenClaw همچنین overrideهای نمونه‌گیری را که K2.7 روی پیش‌فرض‌های provider ثابت می‌کند حذف می‌کند. Kimi K2.6 همچنان پیش‌فرض onboarding می‌ماند.

## شروع کار

provider خود را انتخاب کنید و مراحل راه‌اندازی را دنبال کنید.

<Tabs>
  <Tab title="Moonshot API">
    **بهترین برای:** مدل‌های Kimi K2 از طریق Moonshot Open Platform.

    <Steps>
      <Step title="ناحیه endpoint خود را انتخاب کنید">
        | انتخاب احراز هویت            | Endpoint                       | ناحیه        |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | بین‌المللی |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | چین         |
      </Step>
      <Step title="onboarding را اجرا کنید">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        یا برای endpoint چین:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="یک مدل پیش‌فرض تنظیم کنید">
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
      <Step title="بررسی کنید مدل‌ها در دسترس هستند">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="یک آزمون smoke زنده اجرا کنید">
        وقتی می‌خواهید دسترسی مدل و رهگیری هزینه را بدون دست زدن به sessionهای معمول خود بررسی کنید، از یک دایرکتوری state جداگانه استفاده کنید:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        پاسخ JSON باید `provider: "moonshot"` و `model: "kimi-k2.6"` را گزارش کند. ورودی transcript دستیار، مصرف token نرمال‌شده به‌همراه هزینه تخمینی را زیر `usage.cost` ذخیره می‌کند، وقتی Moonshot فراداده مصرف را برگرداند.
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
            "moonshot/kimi-k2.7-code": { alias: "Kimi K2.7 Code" },
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
                id: "kimi-k2.7-code",
                name: "Kimi K2.7 Code",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.19, cacheWrite: 0 },
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
    Plugin رسمی را نصب کنید، سپس Gateway را restart کنید:

    ```bash
    openclaw plugins install @openclaw/kimi-provider
    openclaw gateway restart
    ```
    **بهترین برای:** وظایف متمرکز بر کد از طریق endpoint مربوط به Kimi Coding.

    <Note>
    Kimi Coding از کلید API و پیشوند provider متفاوتی (`kimi/...`) نسبت به Moonshot (`moonshot/...`) استفاده می‌کند. ارجاع مدل API پایدار `kimi/kimi-for-coding` است؛ ارجاع‌های قدیمی `kimi/kimi-code` و `kimi/k2p5` همچنان پذیرفته می‌شوند و به آن شناسه مدل API نرمال‌سازی می‌شوند.
    </Note>

    <Steps>
      <Step title="Plugin را نصب کنید">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        ```
      </Step>
      <Step title="onboarding را اجرا کنید">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="یک مدل پیش‌فرض تنظیم کنید">
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
      <Step title="بررسی کنید مدل در دسترس است">
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

Plugin مربوط به Moonshot همچنین **Kimi** را به‌عنوان provider `web_search`، با پشتوانه جست‌وجوی وب Moonshot، ثبت می‌کند.

<Steps>
  <Step title="راه‌اندازی تعاملی جست‌وجوی وب را اجرا کنید">
    ```bash
    openclaw configure --section web
    ```

    برای ذخیره `plugins.entries.moonshot.config.webSearch.*`، در بخش جست‌وجوی وب **Kimi** را انتخاب کنید.

  </Step>
  <Step title="ناحیه و مدل جست‌وجوی وب را پیکربندی کنید">
    راه‌اندازی تعاملی این موارد را درخواست می‌کند:

    | تنظیم             | گزینه‌ها                                                              |
    | ------------------- | -------------------------------------------------------------------- |
    | ناحیه API          | `https://api.moonshot.ai/v1` (بین‌المللی) یا `https://api.moonshot.cn/v1` (چین) |
    | مدل جست‌وجوی وب    | پیش‌فرض روی `kimi-k2.6`                                             |

  </Step>
</Steps>

Config زیر `plugins.entries.moonshot.config.webSearch` قرار دارد:

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
    Kimi K2.7 Code همیشه از تفکر بومی استفاده می‌کند. Moonshot از clientها می‌خواهد برای این مدل فیلد `thinking` را حذف کنند، بنابراین OpenClaw فقط `on` را در دسترس می‌گذارد و تنظیمات قدیمی `off` را نادیده می‌گیرد. K2.7 همچنین `temperature`، `top_p`، `n`، `presence_penalty`، و `frequency_penalty` را ثابت می‌کند؛ OpenClaw overrideهای پیکربندی‌شده برای آن فیلدها را حذف می‌کند.

    سایر مدل‌های Moonshot Kimi از تفکر بومی دودویی پشتیبانی می‌کنند:

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

    OpenClaw سطح‌های زمان اجرای `/think` را برای آن مدل‌ها map می‌کند:

    | سطح `/think`       | رفتار Moonshot          |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | هر سطحی غیر از off    | `thinking.type=enabled`    |

    <Warning>
    وقتی تفکر Moonshot فعال است، `tool_choice` باید `auto` یا `none` باشد. OpenClaw مقادیر ناسازگار را به `auto` نرمال‌سازی می‌کند. این شامل Kimi K2.7 Code هم می‌شود، که حالت تفکر آن برای حفظ یک انتخاب ابزار pin‌شده قابل غیرفعال‌سازی نیست.
    </Warning>

    Kimi K2.6 همچنین یک فیلد اختیاری `thinking.keep` می‌پذیرد که
    نگه‌داری چندنوبتی `reasoning_content` را کنترل می‌کند. آن را روی `"all"` تنظیم کنید تا
    استدلال کامل در طول نوبت‌ها نگه داشته شود؛ آن را حذف کنید (یا `null` بگذارید) تا از راهبرد
    پیش‌فرض سرور استفاده شود. OpenClaw فقط `thinking.keep` را برای
    `moonshot/kimi-k2.6` ارسال می‌کند و آن را از مدل‌های دیگر حذف می‌کند. Kimi K2.7 Code
    به‌صورت پیش‌فرض تاریخچه کامل استدلال را حفظ می‌کند، در حالی که OpenClaw کل فیلد
    `thinking` را حذف می‌کند.

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

  <Accordion title="پاک‌سازی id فراخوانی ابزار">
    Moonshot Kimi شناسه‌های بومی tool_call را با قالب `functions.<name>:<index>` ارائه می‌کند. برای انتقال OpenAI-completions، OpenClaw نخستین رخداد هر id بومی Kimi را حفظ می‌کند و تکرارهای بعدی را به idهای قطعی `call_*` به سبک OpenAI بازنویسی می‌کند. نتایج ابزار متناظر با همان id بازنگاشت می‌شوند تا بازپخش، بدون حذف نخستین id بومی Kimi، یکتا بماند.

    برای اعمال پاک‌سازی سخت‌گیرانه روی یک ارائه‌دهنده سفارشی سازگار با OpenAI، `sanitizeToolCallIds: true` را تنظیم کنید:

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

  <Accordion title="سازگاری مصرف در پخش جریانی">
    نقاط پایانی بومی Moonshot (`https://api.moonshot.ai/v1` و
    `https://api.moonshot.cn/v1`) سازگاری مصرف در پخش جریانی را روی
    انتقال مشترک `openai-completions` اعلام می‌کنند. OpenClaw این را بر اساس
    قابلیت‌های نقطه پایانی تعیین می‌کند، بنابراین idهای ارائه‌دهنده سفارشی سازگار که همان میزبان‌های بومی
    Moonshot را هدف می‌گیرند، همان رفتار مصرف در پخش جریانی را به ارث می‌برند.

    با قیمت‌گذاری K2.6 در کاتالوگ، مصرف پخش‌شده‌ای که شامل توکن‌های ورودی، خروجی،
    و خواندن از کش باشد نیز به هزینه محلی تخمینی بر حسب USD برای
    `/status`، `/usage full`، `/usage cost`، و حسابداری نشست
    مبتنی بر رونوشت تبدیل می‌شود.

  </Accordion>

  <Accordion title="مرجع نقطه پایانی و ارجاع مدل">
    | ارائه‌دهنده | پیشوند ارجاع مدل | نقطه پایانی | متغیر محیطی احراز هویت |
    | ---------- | ---------------- | ----------------------------- | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | نقطه پایانی Kimi Coding       | `KIMI_API_KEY`      |
    | جستجوی وب | N/A              | همانند منطقه Moonshot API     | `KIMI_API_KEY` یا `MOONSHOT_API_KEY` |

    - جستجوی وب Kimi از `KIMI_API_KEY` یا `MOONSHOT_API_KEY` استفاده می‌کند و به‌صورت پیش‌فرض با مدل `kimi-k2.6` روی `https://api.moonshot.ai/v1` قرار دارد.
    - در صورت نیاز، قیمت‌گذاری و فراداده زمینه را در `models.providers` بازنویسی کنید.
    - اگر Moonshot محدودیت‌های زمینه متفاوتی برای یک مدل منتشر کند، `contextWindow` را متناسب با آن تنظیم کنید.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="جستجوی وب" href="/fa/tools/web" icon="magnifying-glass">
    پیکربندی ارائه‌دهندگان جستجوی وب، از جمله Kimi.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    طرح‌واره کامل پیکربندی برای ارائه‌دهندگان، مدل‌ها، و Pluginها.
  </Card>
  <Card title="پلتفرم باز Moonshot" href="https://platform.moonshot.ai" icon="globe">
    مدیریت کلید API و مستندات Moonshot.
  </Card>
</CardGroup>

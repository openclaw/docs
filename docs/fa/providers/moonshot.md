---
read_when:
    - شما راه‌اندازی Moonshot K2 (Moonshot Open Platform) را در مقایسه با Kimi Coding می‌خواهید
    - باید نقاط پایانی، کلیدها و ارجاع‌های مدلِ جداگانه را درک کنید
    - برای هرکدام از ارائه‌دهندگان، پیکربندی آمادهٔ کپی/جای‌گذاری می‌خواهید
summary: پیکربندی Moonshot K2 در مقایسه با Kimi Coding (ارائه‌دهندگان و کلیدهای جداگانه)
title: Moonshot AI
x-i18n:
    generated_at: "2026-07-12T10:45:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c917a595337fc2138601245f4c7055815859dfa3b2ddf90a56c980a7a4e09744
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot رابط Kimi API را با endpointهای سازگار با OpenAI ارائه می‌کند. برای Moonshot Open Platform، مدل پیش‌فرض را روی `moonshot/kimi-k2.6` و برای Kimi Coding روی `kimi/kimi-for-coding` تنظیم کنید.

<Warning>
Moonshot و Kimi Coding **ارائه‌دهندگان جداگانه‌ای** هستند که هرکدام به‌صورت یک Plugin خارجی مجزا عرضه می‌شوند. کلیدهای آن‌ها قابل‌جایگزینی نیستند، endpointها متفاوت‌اند و ارجاع‌های مدل نیز تفاوت دارند (`moonshot/...` در برابر `kimi/...`).
</Warning>

## کاتالوگ مدل داخلی

[//]: # "moonshot-kimi-k2-ids:start"

| ارجاع مدل                         | نام                    | استدلال       | ورودی      | زمینه   | حداکثر خروجی |
| --------------------------------- | ---------------------- | ------------- | ---------- | ------- | ------------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | خیر           | متن، تصویر | 262,144 | 262,144       |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | همیشه فعال    | متن، تصویر | 262,144 | 262,144       |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | خیر           | متن، تصویر | 262,144 | 262,144       |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | بله           | متن        | 262,144 | 262,144       |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | بله           | متن        | 262,144 | 262,144       |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | خیر           | متن        | 256,000 | 16,384        |

[//]: # "moonshot-kimi-k2-ids:end"

برآورد هزینه‌های کاتالوگ از نرخ‌های پرداخت به‌ازای مصرف منتشرشده توسط Moonshot استفاده می‌کند: برای Kimi K2.7 Code، اصابت کش $0.19/MTok، ورودی $0.95/MTok و خروجی $4.00/MTok است؛ برای Kimi K2.6، اصابت کش $0.16/MTok، ورودی $0.95/MTok و خروجی $4.00/MTok است؛ و برای Kimi K2.5، اصابت کش $0.10/MTok، ورودی $0.60/MTok و خروجی $3.00/MTok است. سایر ورودی‌های کاتالوگ، مگر اینکه آن‌ها را در پیکربندی بازنویسی کنید، جای‌نگهدارهای بدون هزینه را حفظ می‌کنند.

Kimi K2.7 Code همیشه از تفکر بومی استفاده می‌کند. OpenClaw برای این مدل فقط وضعیت تفکر `on` را ارائه می‌دهد و مطابق الزام Moonshot، فیلدهای خروجی `thinking` و `reasoning_effort` را حذف می‌کند. همچنین بازنویسی‌های نمونه‌گیری (`temperature`، `top_p`، `n`، `presence_penalty` و `frequency_penalty`) را حذف می‌کند، زیرا K2.7 آن‌ها را روی مقادیر پیش‌فرض ارائه‌دهنده ثابت می‌کند. Kimi K2.6 همچنان مدل پیش‌فرض راه‌اندازی اولیه است.

## شروع به کار

Moonshot و Kimi Coding هر دو Pluginهای خارجی هستند؛ پیش از راه‌اندازی اولیه، یکی از آن‌ها را نصب کنید.

<Tabs>
  <Tab title="Moonshot API">
    **بهترین گزینه برای:** مدل‌های Kimi K2 از طریق Moonshot Open Platform.

    <Steps>
      <Step title="نصب Plugin">
        ```bash
        openclaw plugins install @openclaw/moonshot-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="انتخاب منطقه endpoint">
        | گزینه احراز هویت       | endpoint                       | منطقه       |
        | ---------------------- | ------------------------------ | ----------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | بین‌المللی  |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | چین         |
      </Step>
      <Step title="اجرای راه‌اندازی اولیه">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        یا برای endpoint چین:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="تنظیم مدل پیش‌فرض">
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
      <Step title="بررسی دردسترس‌بودن مدل‌ها">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="اجرای آزمون دود زنده">
        اگر می‌خواهید دسترسی به مدل و ردیابی هزینه را بدون دست‌زدن به نشست‌های عادی خود بررسی کنید، از یک دایرکتوری وضعیت ایزوله استفاده کنید:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        پاسخ JSON باید `provider: "moonshot"` و `model: "kimi-k2.6"` را گزارش کند. وقتی Moonshot فراداده مصرف را برمی‌گرداند، ورودی رونوشت دستیار، مصرف نرمال‌شده توکن را همراه با هزینه تخمینی در `usage.cost` ذخیره می‌کند.
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
    **بهترین گزینه برای:** وظایف متمرکز بر کد از طریق endpoint مربوط به Kimi Coding.

    <Note>
    Kimi Coding در مقایسه با Moonshot (`moonshot/...`) از کلید API و پیشوند ارائه‌دهنده متفاوتی (`kimi/...`) استفاده می‌کند. ارجاع پایدار مدل `kimi/kimi-for-coding` است؛ ارجاع‌های قدیمی `kimi/kimi-code` و `kimi/k2p5` همچنان پذیرفته می‌شوند و به همان شناسه مدل نرمال‌سازی می‌شوند.
    </Note>

    <Steps>
      <Step title="نصب Plugin">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="اجرای راه‌اندازی اولیه">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="تنظیم مدل پیش‌فرض">
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
      <Step title="بررسی دردسترس‌بودن مدل">
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

Plugin مربوط به Moonshot همچنین **Kimi** را به‌عنوان ارائه‌دهنده `web_search` مبتنی بر جست‌وجوی وب Moonshot ثبت می‌کند.

<Steps>
  <Step title="اجرای تنظیم تعاملی جست‌وجوی وب">
    ```bash
    openclaw configure --section web
    ```

    برای ذخیره‌سازی `plugins.entries.moonshot.config.webSearch.*`، در بخش جست‌وجوی وب **Kimi** را انتخاب کنید.

  </Step>
  <Step title="پیکربندی منطقه و مدل جست‌وجوی وب">
    تنظیم تعاملی موارد زیر را درخواست می‌کند:

    | تنظیم                | گزینه‌ها                                                              |
    | -------------------- | --------------------------------------------------------------------- |
    | منطقه API            | `https://api.moonshot.ai/v1` (بین‌المللی) یا `https://api.moonshot.cn/v1` (چین) |
    | مدل جست‌وجوی وب      | مقدار پیش‌فرض `kimi-k2.6` است                                         |

  </Step>
</Steps>

پیکربندی در `plugins.entries.moonshot.config.webSearch` قرار دارد:

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
    Kimi K2.7 Code همیشه از تفکر بومی استفاده می‌کند. Moonshot از کلاینت‌ها می‌خواهد فیلد `thinking` را برای این مدل حذف کنند؛ بنابراین OpenClaw فقط `on` را ارائه می‌دهد و تنظیمات قدیمی `off` را نادیده می‌گیرد. K2.7 همچنین `temperature`، `top_p`، `n`، `presence_penalty` و `frequency_penalty` را ثابت می‌کند؛ OpenClaw بازنویسی‌های پیکربندی‌شده برای این فیلدها را حذف می‌کند.

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

    OpenClaw سطح‌های زمان اجرای `/think` را برای آن مدل‌ها به‌شکل زیر نگاشت می‌کند:

    | سطح `/think`         | رفتار Moonshot              |
    | -------------------- | --------------------------- |
    | `/think off`         | `thinking.type=disabled`    |
    | هر سطحی به‌جز off    | `thinking.type=enabled`     |

    <Warning>
    وقتی تفکر Moonshot فعال است، `tool_choice` باید `auto` یا `none` باشد. انتخاب ابزار سنجاق‌شده (`type: "tool"` یا `type: "function"`) به‌جای آن تفکر را به `disabled` بازمی‌گرداند تا ابزار درخواستی همچنان اجرا شود؛ در مقابل، `tool_choice: "required"` به `auto` نرمال‌سازی می‌شود. این موضوع برای همه مدل‌های Moonshot به‌جز Kimi K2.7 Code اعمال می‌شود؛ حالت تفکر آن غیرفعال‌شدنی نیست و در صورت ناسازگاری، `tool_choice` آن به `auto` نرمال‌سازی می‌شود.
    </Warning>

    Kimi K2.6 همچنین یک فیلد اختیاری `thinking.keep` را می‌پذیرد که نگه‌داری چندنوبتی `reasoning_content` را کنترل می‌کند. برای حفظ کامل استدلال در میان نوبت‌ها، آن را روی `"all"` تنظیم کنید؛ برای استفاده از راهبرد پیش‌فرض سرور، آن را حذف کنید (یا مقدار `null` را برای آن نگه دارید). OpenClaw فقط `thinking.keep` را برای `moonshot/kimi-k2.6` ارسال می‌کند و آن را از سایر مدل‌ها حذف می‌کند. Kimi K2.7 Code به‌طور پیش‌فرض تاریخچه کامل استدلال را حفظ می‌کند، درحالی‌که OpenClaw کل فیلد `thinking` را حذف می‌کند.

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

  <Accordion title="پاک‌سازی شناسه فراخوانی ابزار">
    Moonshot Kimi شناسه‌های بومی tool_call را با قالب `functions.<name>:<index>` ارائه می‌کند. OpenClaw نخستین رخداد هر شناسه بومی Kimi را حفظ می‌کند و موارد تکراری بعدی را به شناسه‌های قطعی `call_*` به سبک OpenAI بازنویسی می‌کند. نتایج ابزار متناظر نیز با همان شناسه نگاشت مجدد می‌شوند تا بازپخش، بدون حذف نخستین شناسه بومی Kimi، یکتا باقی بماند. این رفتار در ارائه‌دهنده همراه Moonshot تعبیه شده است و تنظیمی قابل‌پیکربندی توسط کاربر نیست.
  </Accordion>

  <Accordion title="سازگاری مصرف در جریان‌سازی">
    نقطه‌های پایانی بومی Moonshot (`https://api.moonshot.ai/v1` و
    `https://api.moonshot.cn/v1`) سازگاری مصرف در جریان‌سازی را اعلام می‌کنند.
    OpenClaw این قابلیت را بر اساس میزبان نقطه پایانی فعال می‌کند، نه شناسه ارائه‌دهنده؛ بنابراین یک
    شناسه ارائه‌دهنده سفارشی که به همان میزبان بومی Moonshot اشاره کند، همان
    رفتار مصرف در جریان‌سازی را به ارث می‌برد.

    با قیمت‌گذاری K2.6 در کاتالوگ، مصرف جریان‌یافته‌ای که شامل توکن‌های ورودی، خروجی
    و خوانده‌شده از کش باشد، برای
    `/status`، `/usage full`، `/usage cost` و حسابداری نشست
    مبتنی بر رونوشت، به هزینه تخمینی محلی بر حسب دلار آمریکا نیز تبدیل می‌شود.

  </Accordion>

  <Accordion title="مرجع نقطه پایانی و ارجاع مدل">
    | ارائه‌دهنده   | پیشوند ارجاع مدل | نقطه پایانی                      | متغیر محیطی احراز هویت        |
    | ---------- | ---------------- | ------------------------------ | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | نقطه پایانی Kimi Coding           | `KIMI_API_KEY`      |
    | جست‌وجوی وب | نامرتبط              | همان منطقه API مربوط به Moonshot    | `KIMI_API_KEY` یا `MOONSHOT_API_KEY` |

    - جست‌وجوی وب Kimi از `KIMI_API_KEY` یا `MOONSHOT_API_KEY` استفاده می‌کند و به‌طور پیش‌فرض از `https://api.moonshot.ai/v1` با مدل `kimi-k2.6` بهره می‌برد.
    - در صورت نیاز، قیمت‌گذاری و فراداده زمینه را در `models.providers` بازنویسی کنید.
    - اگر Moonshot محدودیت‌های زمینه متفاوتی را برای یک مدل منتشر کرد، `contextWindow` را متناسب با آن تنظیم کنید.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار جایگزینی هنگام خرابی.
  </Card>
  <Card title="جست‌وجوی وب" href="/fa/tools/web" icon="magnifying-glass">
    پیکربندی ارائه‌دهندگان جست‌وجوی وب، از جمله Kimi.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    طرح‌واره کامل پیکربندی برای ارائه‌دهندگان، مدل‌ها و Pluginها.
  </Card>
  <Card title="پلتفرم باز Moonshot" href="https://platform.moonshot.ai" icon="globe">
    مدیریت کلید API و مستندات Moonshot.
  </Card>
</CardGroup>

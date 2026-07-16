---
read_when:
    - می‌خواهید از مدل‌های Z.AI / GLM در OpenClaw استفاده کنید
    - به یک راه‌اندازی ساده برای ZAI_API_KEY نیاز دارید
summary: استفاده از Z.AI (مدل‌های GLM) با OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-07-16T17:17:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7f7adf0e2f436f9081891013c0092ce4717bf302b2a4a2e997d9561d7d40211a
    source_path: providers/zai.md
    workflow: 16
---

Z.AI پلتفرم API برای مدل‌های **GLM** است. این پلتفرم APIهای REST را برای GLM ارائه می‌دهد و
برای احراز هویت از کلیدهای API استفاده می‌کند. کلید API خود را در کنسول Z.AI ایجاد کنید.
OpenClaw از ارائه‌دهنده `zai` همراه با یک کلید API از Z.AI استفاده می‌کند.

| ویژگی | مقدار                                        |
| -------- | -------------------------------------------- |
| ارائه‌دهنده | `zai`                                        |
| بسته  | `@openclaw/zai-provider`                     |
| احراز هویت     | `ZAI_API_KEY` (نام مستعار قدیمی: `Z_AI_API_KEY`) |
| API      | تکمیل‌های گفت‌وگوی Z.AI (احراز هویت Bearer)          |

## مدل‌های GLM

GLM یک خانواده مدل است، نه یک ارائه‌دهنده جداگانه. در OpenClaw، مدل‌های GLM از
ارجاع‌هایی مانند `zai/glm-5.2` استفاده می‌کنند: ارائه‌دهنده `zai`، شناسه مدل `glm-5.2`.

## شروع به کار

ابتدا Plugin ارائه‌دهنده را نصب کنید:

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="تشخیص خودکار نقطه پایانی">
    **مناسب برای:** بیشتر کاربران. OpenClaw با کلید API شما نقاط پایانی پشتیبانی‌شده Z.AI را بررسی می‌کند و URL پایه صحیح را به‌طور خودکار اعمال می‌کند.

    <Steps>
      <Step title="اجرای راه‌اندازی اولیه">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="بررسی فهرست‌شدن مدل">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="نقطه پایانی منطقه‌ای صریح">
    **مناسب برای:** کاربرانی که می‌خواهند یک Coding Plan مشخص یا سطح API عمومی خاصی را اجباری کنند.

    <Steps>
      <Step title="انتخاب گزینه صحیح راه‌اندازی اولیه">
        ```bash
        # Coding Plan سراسری (توصیه‌شده برای کاربران Coding Plan)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan چین (منطقه چین)
        openclaw onboard --auth-choice zai-coding-cn

        # API عمومی
        openclaw onboard --auth-choice zai-global

        # API عمومی چین (منطقه چین)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="بررسی فهرست‌شدن مدل">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

### نقاط پایانی

| گزینه راه‌اندازی اولیه   | URL پایه                                      | مدل پیش‌فرض |
| ------------------- | --------------------------------------------- | ------------- |
| `zai-global`        | `https://api.z.ai/api/paas/v4`                | `glm-5.1`     |
| `zai-cn`            | `https://open.bigmodel.cn/api/paas/v4`        | `glm-5.1`     |
| `zai-coding-global` | `https://api.z.ai/api/coding/paas/v4`         | `glm-5.2`     |
| `zai-coding-cn`     | `https://open.bigmodel.cn/api/coding/paas/v4` | `glm-5.2`     |

`zai-api-key` با بررسی کلید شما در API تکمیل گفت‌وگوی هر نقطه پایانی،
یکی از این چهار مورد را به‌طور خودکار تشخیص می‌دهد؛ ابتدا نقاط پایانی عمومی (`zai-global`،
سپس `zai-cn`) و بعد نقاط پایانی Coding Plan (`zai-coding-global`، سپس
`zai-coding-cn`) را بررسی می‌کند و در نخستین نقطه پایانی که درخواست را می‌پذیرد، متوقف می‌شود.
اگر کلید شما روی هر دو کار می‌کند، برای اجباری‌کردن یک نقطه پایانی Coding Plan از یک
`--auth-choice` صریح استفاده کنید.

## محدودیت نرخ و اضافه‌بار

Z.AI، Coding Plan و ابزارهای عامل همه‌منظوره را به‌عنوان سرویس‌هایی با
ظرفیت مدیریت‌شده مستند کرده است. طبق مستندات خود Z.AI:

- [ابزارهای عامل همه‌منظوره](https://docs.z.ai/devpack/tool/others)،
  از جمله OpenClaw، بر مبنای بهترین تلاش ارائه می‌شوند. هنگام بار استنتاج بالا،
  معمولاً حدود ساعت 2 تا 6 بعدازظهر به وقت سنگاپور، برخی درخواست‌ها ممکن است با
  محدودیت نرخ موقت مواجه شوند.
- [محدودیت‌های نرخ و هم‌زمانی Coding Plan](https://docs.z.ai/devpack/usage-policy)
  به سطح طرح وابسته‌اند و ممکن است بر اساس دسترس‌پذیری منابع به‌صورت پویا تنظیم
  شوند. در ساعات کم‌بار ممکن است هم‌زمانی بیشتری در دسترس باشد.
- [کد خطای API ‏`1302`](https://docs.z.ai/api-reference/api-code) به معنای «محدودیت
  نرخ برای درخواست‌ها رسیده است» است. کد خطای API ‏`1305` به معنای «ممکن است سرویس
  موقتاً دچار اضافه‌بار باشد، لطفاً بعداً دوباره تلاش کنید» است.

اگر در یک دوره شلوغ پاسخ موقت `429` یا `1305` مشاهده کردید، صبر کنید و
درخواست را دوباره بفرستید. اگر خطاها خارج از دوره‌های اوج تکرارپذیرند یا فقط
برای یک نقطه پایانی، مدل یا ساختار درخواست رخ می‌دهند، ابتدا نقطه پایانی و مدل
پیکربندی‌شده را بررسی کنید:

```bash
openclaw models list --all --provider zai
openclaw config get models.providers.zai.baseUrl
```

کلیدهای Coding Plan باید از یک نقطه پایانی Coding Plan مانند
`https://api.z.ai/api/coding/paas/v4` استفاده کنند؛ کلیدهای API عمومی باید از یک نقطه پایانی
API عمومی مانند `https://api.z.ai/api/paas/v4` استفاده کنند. خطاهای مداوم با همان
کلید و نقطه پایانی می‌توانند نشان‌دهنده رد درخواست از سوی ارائه‌دهنده یا محدودیت طرح باشند،
نه محدودسازی عادی ناشی از بار اوج.

## نمونه پیکربندی

<Tip>
`zai-api-key` به OpenClaw امکان می‌دهد نقطه پایانی منطبق Z.AI را از روی کلید تشخیص دهد و
URL پایه صحیح را به‌طور خودکار اعمال کند. هنگامی که می‌خواهید یک Coding Plan مشخص یا
سطح API عمومی خاصی را اجباری کنید، از گزینه‌های منطقه‌ای صریح استفاده کنید.
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 از نقطه پایانی Coding Plan استفاده می‌کند.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## کاتالوگ داخلی

Plugin ارائه‌دهنده `zai` کاتالوگ خود را در مانیفست Plugin عرضه می‌کند، بنابراین
فهرست‌گیری فقط‌خواندنی می‌تواند ردیف‌های شناخته‌شده GLM را بدون بارگذاری زمان اجرای ارائه‌دهنده نشان دهد:

```bash
openclaw models list --all --provider zai
```

کاتالوگ مبتنی بر مانیفست در حال حاضر شامل موارد زیر است:

| ارجاع مدل            | توضیحات                           |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | پیش‌فرض Coding Plan؛ زمینه 1M |
| `zai/glm-5.1`        | پیش‌فرض API عمومی             |
| `zai/glm-5`          |                                 |
| `zai/glm-5-turbo`    |                                 |
| `zai/glm-5v-turbo`   |                                 |
| `zai/glm-4.7`        |                                 |
| `zai/glm-4.7-flash`  |                                 |
| `zai/glm-4.7-flashx` |                                 |
| `zai/glm-4.6`        |                                 |
| `zai/glm-4.6v`       |                                 |
| `zai/glm-4.5`        |                                 |
| `zai/glm-4.5-air`    |                                 |
| `zai/glm-4.5-flash`  |                                 |
| `zai/glm-4.5v`       |                                 |

<Tip>
مدل‌های GLM به‌صورت `zai/<model>` در دسترس‌اند (مثال: `zai/glm-5`).
</Tip>

<Note>
راه‌اندازی Coding Plan به‌طور پیش‌فرض از `zai/glm-5.2` استفاده می‌کند؛ راه‌اندازی API عمومی
`zai/glm-5.1` را حفظ می‌کند. در نقاط پایانی Coding Plan، اگر کلید یا طرح GLM-5.2 را ارائه نکند،
تشخیص خودکار ابتدا به `glm-5.1` و سپس به `glm-4.7` بازمی‌گردد. نسخه‌ها و
دسترس‌پذیری GLM ممکن است تغییر کنند؛ برای مشاهده کاتالوگ شناخته‌شده نسخه نصب‌شده خود،
`openclaw models list --all --provider zai` را اجرا کنید.
</Note>

## سطوح تفکر

<Tabs>
  <Tab title="GLM-5.2">
    دامنه کامل: `off`، `low`، `high`، `max` (پیش‌فرض `off`). OpenClaw
    از طریق `reasoning_effort` در بار درخواست، `low` و `high` را به میزان تلاش استدلال
    `high` در Z.AI و `max` را به میزان تلاش `max` در Z.AI نگاشت می‌کند.
  </Tab>
  <Tab title="سایر مدل‌های GLM">
    فقط کلید دودویی: `off` و `low` (در انتخاب‌گرها به‌صورت `on` نمایش داده می‌شود)، با پیش‌فرض
    `off`. تنظیم تفکر روی `off` مقدار `thinking: { type: "disabled" }` را ارسال می‌کند؛
    هر سطح دیگری بار درخواست را دست‌نخورده باقی می‌گذارد (رفتار پیش‌فرض
    استدلال خود Z.AI اعمال می‌شود).
  </Tab>
</Tabs>

تنظیم تفکر روی `off` از پاسخ‌هایی جلوگیری می‌کند که بودجه خروجی را پیش از متن
قابل‌مشاهده صرف `reasoning_content` می‌کنند.

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="تفکیک پیش‌نگر مدل‌های ناشناخته GLM-5">
    شناسه‌های ناشناخته `glm-5*` همچنان در مسیر ارائه‌دهنده به‌صورت پیش‌نگر تفکیک می‌شوند؛
    به این صورت که وقتی شناسه با ساختار فعلی خانواده GLM-5 مطابقت دارد، فراداده متعلق به ارائه‌دهنده
    از الگوی `glm-4.7` ساخته می‌شود.
  </Accordion>

  <Accordion title="پخش جریانی فراخوانی ابزار">
    `tool_stream` به‌طور پیش‌فرض برای پخش جریانی فراخوانی ابزار Z.AI فعال است. برای غیرفعال‌کردن آن:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/<model>": {
              params: { tool_stream: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="تفکر حفظ‌شده">
    تفکر حفظ‌شده به‌صورت انتخابی فعال می‌شود، زیرا Z.AI نیاز دارد کل
    `reasoning_content` تاریخی بازپخش شود که تعداد توکن‌های پرامپت را افزایش می‌دهد. آن را
    برای هر مدل فعال کنید:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.2": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    هنگامی که این گزینه فعال باشد و تفکر روشن باشد، OpenClaw
    `thinking: { type: "enabled", clear_thinking: false }` را ارسال می‌کند و
    `reasoning_content` قبلی را برای همان رونوشت سازگار با OpenAI بازپخش می‌کند. کلید پارامتر snake_case
    یعنی `preserve_thinking` نیز به‌عنوان نام مستعار کار می‌کند.

    کاربران پیشرفته همچنان می‌توانند بار دقیق ارائه‌دهنده را با
    `params.extra_body.thinking` بازنویسی کنند.

  </Accordion>

  <Accordion title="درک تصویر">
    Plugin ‏Z.AI قابلیت درک تصویر را ثبت می‌کند.

    | ویژگی      | مقدار       |
    | ------------- | ----------- |
    | مدل         | `glm-4.6v`  |

    درک تصویر به‌طور خودکار از احراز هویت پیکربندی‌شده Z.AI تفکیک می‌شود و
    به پیکربندی اضافی نیاز ندارد.

  </Accordion>

  <Accordion title="جزئیات احراز هویت">
    - Z.AI برای احراز هویت Bearer از کلید API شما استفاده می‌کند.
    - گزینه راه‌اندازی اولیه `zai-api-key` با بررسی نقاط پایانی پشتیبانی‌شده به‌وسیله کلید شما، نقطه پایانی منطبق Z.AI را به‌طور خودکار تشخیص می‌دهد.
    - هنگامی که می‌خواهید یک سطح API مشخص را اجباری کنید، از گزینه‌های منطقه‌ای صریح (`zai-coding-global`، `zai-coding-cn`، `zai-global`، `zai-cn`) استفاده کنید.
    - متغیر محیطی قدیمی `Z_AI_API_KEY` همچنان پذیرفته می‌شود؛ اگر `ZAI_API_KEY` تنظیم نشده باشد، OpenClaw هنگام راه‌اندازی آن را در `ZAI_API_KEY` کپی می‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار جایگزینی هنگام خرابی.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    طرح‌واره کامل پیکربندی OpenClaw، شامل تنظیمات ارائه‌دهنده و مدل.
  </Card>
</CardGroup>

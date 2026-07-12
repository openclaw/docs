---
read_when:
    - می‌خواهید از مدل‌های Z.AI / GLM در OpenClaw استفاده کنید
    - به یک راه‌اندازی ساده برای `ZAI_API_KEY` نیاز دارید
summary: استفاده از Z.AI (مدل‌های GLM) با OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-07-12T10:42:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab29149da39cbf82fe041ea5932a860c461320e14bf26f83f69060d7ae0ae00a
    source_path: providers/zai.md
    workflow: 16
---

Z.AI پلتفرم API برای مدل‌های **GLM** است. این پلتفرم APIهای REST را برای GLM ارائه می‌دهد و
برای احراز هویت از کلیدهای API استفاده می‌کند. کلید API خود را در کنسول Z.AI ایجاد کنید.
OpenClaw از ارائه‌دهندهٔ `zai` همراه با یک کلید API متعلق به Z.AI استفاده می‌کند.

| ویژگی | مقدار                                        |
| -------- | -------------------------------------------- |
| ارائه‌دهنده | `zai`                                        |
| بسته  | `@openclaw/zai-provider`                     |
| احراز هویت     | `ZAI_API_KEY` (نام مستعار قدیمی: `Z_AI_API_KEY`) |
| API      | تکمیل‌های گفت‌وگوی Z.AI (احراز هویت Bearer)          |

## مدل‌های GLM

GLM یک خانوادهٔ مدل است، نه یک ارائه‌دهندهٔ جداگانه. در OpenClaw، مدل‌های GLM از
ارجاع‌هایی مانند `zai/glm-5.2` استفاده می‌کنند: ارائه‌دهنده `zai` و شناسهٔ مدل `glm-5.2`.

## شروع کار

ابتدا Plugin ارائه‌دهنده را نصب کنید:

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="تشخیص خودکار نقطهٔ پایانی">
    **مناسب برای:** بیشتر کاربران. OpenClaw با استفاده از کلید API شما نقاط پایانی پشتیبانی‌شدهٔ Z.AI را بررسی می‌کند و نشانی پایهٔ صحیح را به‌طور خودکار اعمال می‌کند.

    <Steps>
      <Step title="اجرای راه‌اندازی اولیه">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="بررسی نمایش مدل در فهرست">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="نقطهٔ پایانی منطقه‌ای صریح">
    **مناسب برای:** کاربرانی که می‌خواهند استفاده از یک سطح API مشخص برای Coding Plan یا API عمومی را اجبار کنند.

    <Steps>
      <Step title="انتخاب گزینهٔ صحیح راه‌اندازی اولیه">
        ```bash
        # Coding Plan Global (recommended for Coding Plan users)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (China region)
        openclaw onboard --auth-choice zai-coding-cn

        # General API
        openclaw onboard --auth-choice zai-global

        # General API CN (China region)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="بررسی نمایش مدل در فهرست">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

### نقاط پایانی

| گزینهٔ راه‌اندازی اولیه   | نشانی پایه                                      | مدل پیش‌فرض |
| ------------------- | --------------------------------------------- | ------------- |
| `zai-global`        | `https://api.z.ai/api/paas/v4`                | `glm-5.1`     |
| `zai-cn`            | `https://open.bigmodel.cn/api/paas/v4`        | `glm-5.1`     |
| `zai-coding-global` | `https://api.z.ai/api/coding/paas/v4`         | `glm-5.2`     |
| `zai-coding-cn`     | `https://open.bigmodel.cn/api/coding/paas/v4` | `glm-5.2`     |

`zai-api-key` با آزمایش کلید شما در API تکمیل گفت‌وگوی هر نقطهٔ پایانی،
یکی از این چهار مورد را به‌طور خودکار تشخیص می‌دهد؛ ابتدا نقاط پایانی عمومی
(`zai-global` و سپس `zai-cn`) و بعد نقاط پایانی Coding Plan
(`zai-coding-global` و سپس `zai-coding-cn`) بررسی می‌شوند و فرایند در نخستین
نقطهٔ پایانی که درخواست را می‌پذیرد متوقف می‌شود. اگر کلید شما در هر دو مورد
کار می‌کند، برای اجبار استفاده از یک نقطهٔ پایانی Coding Plan از یک
`--auth-choice` صریح استفاده کنید.

## نمونهٔ پیکربندی

<Tip>
`zai-api-key` به OpenClaw امکان می‌دهد نقطهٔ پایانی منطبق Z.AI را از روی کلید
تشخیص دهد و نشانی پایهٔ صحیح را به‌طور خودکار اعمال کند. وقتی می‌خواهید استفاده
از یک سطح API مشخص برای Coding Plan یا API عمومی را اجبار کنید، از گزینه‌های
منطقه‌ای صریح استفاده کنید.
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 uses the Coding Plan endpoint.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## کاتالوگ داخلی

Plugin ارائه‌دهندهٔ `zai` کاتالوگ خود را در مانیفست Plugin عرضه می‌کند، بنابراین
فهرست‌سازی فقط‌خواندنی می‌تواند بدون بارگذاری زمان اجرای ارائه‌دهنده، ردیف‌های
شناخته‌شدهٔ GLM را نمایش دهد:

```bash
openclaw models list --all --provider zai
```

کاتالوگ مبتنی بر مانیفست در حال حاضر شامل موارد زیر است:

| ارجاع مدل            | توضیحات                           |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | پیش‌فرض Coding Plan؛ زمینهٔ ۱ میلیون توکنی |
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
مدل‌های GLM به‌شکل `zai/<model>` در دسترس‌اند (مثال: `zai/glm-5`).
</Tip>

<Note>
راه‌اندازی Coding Plan به‌طور پیش‌فرض از `zai/glm-5.2` استفاده می‌کند؛ راه‌اندازی
API عمومی همچنان `zai/glm-5.1` را نگه می‌دارد. در نقاط پایانی Coding Plan، اگر
کلید یا طرح دسترسی به GLM-5.2 را فراهم نکند، تشخیص خودکار ابتدا به `glm-5.1` و
سپس به `glm-4.7` بازمی‌گردد. نسخه‌ها و دسترس‌پذیری GLM ممکن است تغییر کنند؛ برای
مشاهدهٔ کاتالوگ شناخته‌شده در نسخهٔ نصب‌شدهٔ خود، دستور
`openclaw models list --all --provider zai` را اجرا کنید.
</Note>

## سطوح تفکر

<Tabs>
  <Tab title="GLM-5.2">
    دامنهٔ کامل: `off`، `low`، `high`، `max` (پیش‌فرض `off`). OpenClaw مقادیر
    `low` و `high` را به تلاش استدلال `high` در Z.AI و `max` را به تلاش `max`
    در Z.AI نگاشت می‌کند؛ این کار از طریق `reasoning_effort` در بار درخواست
    انجام می‌شود.
  </Tab>
  <Tab title="سایر مدل‌های GLM">
    فقط کلید دودویی: `off` و `low` (در انتخابگرها به‌شکل `on` نمایش داده می‌شود)،
    با پیش‌فرض `off`. تنظیم تفکر روی `off` مقدار
    `thinking: { type: "disabled" }` را ارسال می‌کند؛ هر سطح دیگری بار درخواست
    را بدون تغییر باقی می‌گذارد (رفتار استدلال پیش‌فرض خود Z.AI اعمال می‌شود).
  </Tab>
</Tabs>

تنظیم تفکر روی `off` از پاسخ‌هایی جلوگیری می‌کند که پیش از متن قابل مشاهده،
بودجهٔ خروجی را صرف `reasoning_content` می‌کنند.

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="تفکیک رو‌به‌جلوی مدل‌های ناشناختهٔ GLM-5">
    شناسه‌های ناشناختهٔ `glm-5*` همچنان در مسیر ارائه‌دهنده به‌صورت رو‌به‌جلو
    تفکیک می‌شوند؛ در صورتی که شناسه با ساختار فعلی خانوادهٔ GLM-5 مطابقت داشته
    باشد، فرادادهٔ متعلق به ارائه‌دهنده از الگوی `glm-4.7` ساخته می‌شود.
  </Accordion>

  <Accordion title="جریان‌دهی فراخوانی ابزار">
    `tool_stream` برای جریان‌دهی فراخوانی ابزار Z.AI به‌طور پیش‌فرض فعال است. برای غیرفعال‌کردن آن:

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
    تفکر حفظ‌شده نیازمند فعال‌سازی صریح است، زیرا Z.AI می‌خواهد کل
    `reasoning_content` تاریخی دوباره پخش شود که تعداد توکن‌های ورودی را افزایش
    می‌دهد. آن را برای هر مدل فعال کنید:

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

    هنگامی که این قابلیت فعال باشد و تفکر روشن باشد، OpenClaw مقدار
    `thinking: { type: "enabled", clear_thinking: false }` را ارسال می‌کند و
    `reasoning_content` قبلی را برای همان رونوشت سازگار با OpenAI دوباره پخش
    می‌کند. کلید پارامتر snake_case یعنی `preserve_thinking` نیز به‌عنوان نام
    مستعار کار می‌کند.

    کاربران پیشرفته همچنان می‌توانند بار دقیق ارائه‌دهنده را با
    `params.extra_body.thinking` بازنویسی کنند.

  </Accordion>

  <Accordion title="درک تصویر">
    Plugin مربوط به Z.AI قابلیت درک تصویر را ثبت می‌کند.

    | ویژگی      | مقدار       |
    | ------------- | ----------- |
    | مدل         | `glm-4.6v`  |

    درک تصویر به‌طور خودکار از احراز هویت پیکربندی‌شدهٔ Z.AI تفکیک می‌شود و
    نیازی به پیکربندی اضافی نیست.

  </Accordion>

  <Accordion title="جزئیات احراز هویت">
    - Z.AI برای احراز هویت از Bearer به‌همراه کلید API شما استفاده می‌کند.
    - گزینهٔ راه‌اندازی اولیهٔ `zai-api-key` با آزمایش نقاط پایانی پشتیبانی‌شده به‌وسیلهٔ کلید شما، نقطهٔ پایانی منطبق Z.AI را به‌طور خودکار تشخیص می‌دهد.
    - وقتی می‌خواهید استفاده از یک سطح API مشخص را اجبار کنید، از گزینه‌های منطقه‌ای صریح (`zai-coding-global`، `zai-coding-cn`، `zai-global`، `zai-cn`) استفاده کنید.
    - متغیر محیطی قدیمی `Z_AI_API_KEY` همچنان پذیرفته می‌شود؛ اگر `ZAI_API_KEY` تنظیم نشده باشد، OpenClaw هنگام راه‌اندازی آن را در `ZAI_API_KEY` کپی می‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار جایگزینی هنگام خرابی.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    طرح‌وارهٔ کامل پیکربندی OpenClaw، شامل تنظیمات ارائه‌دهنده و مدل.
  </Card>
</CardGroup>

---
read_when:
    - می‌خواهید `code_execution` را فعال یا پیکربندی کنید
    - شما تحلیل از راه دور را بدون دسترسی به پوستهٔ محلی می‌خواهید
    - می‌خواهید x_search یا web_search را با تحلیل از راه دور Python ترکیب کنید
summary: 'code_execution: اجرای تحلیل راه‌دور Python در محیط ایزوله با xAI'
title: اجرای کد
x-i18n:
    generated_at: "2026-07-12T11:00:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ab391daed9154f113535e6d241c45d5c08c22abdc012148a9f0f2ae5ec548b3
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` تحلیل پایتون راه‌دور و ایزوله‌شده را در Responses API متعلق به xAI اجرا می‌کند
(`https://api.x.ai/v1/responses`، همان نقطه پایانی که `x_search` استفاده می‌کند). این ابزار
توسط Plugin همراه `xai` تحت قرارداد `tools` ثبت می‌شود.

<Warning>
  `code_execution` روی سرورهای xAI اجرا می‌شود. xAI به‌ازای هر ۱٬۰۰۰ فراخوانی ابزار ۵ دلار،
  به‌علاوه توکن‌های ورودی و خروجی مدل، هزینه دریافت می‌کند.
</Warning>

| ویژگی             | مقدار                                                                             |
| ------------------ | --------------------------------------------------------------------------------- |
| نام ابزار          | `code_execution`                                                                  |
| Plugin ارائه‌دهنده | `xai` (همراه، `enabledByDefault: true`)                                           |
| احراز هویت         | نمایه احراز هویت xAI،‏ `XAI_API_KEY`، یا `plugins.entries.xai.config.webSearch.apiKey` |
| مدل پیش‌فرض        | `grok-4.3`                                                                        |
| مهلت زمانی پیش‌فرض | ۳۰ ثانیه                                                                          |
| `maxTurns` پیش‌فرض | تنظیم‌نشده (xAI محدودیت داخلی خود را اعمال می‌کند)                                |

از آن برای محاسبات، جدول‌بندی، آمار سریع و تحلیل به‌سبک نمودار استفاده کنید؛
از جمله برای داده‌هایی که `x_search` یا `web_search` برمی‌گردانند. این ابزار به
فایل‌های محلی، پوسته، مخزن یا دستگاه‌های جفت‌شده شما دسترسی ندارد و وضعیت را
بین فراخوانی‌ها حفظ نمی‌کند؛ بنابراین هر فراخوانی را تحلیلی موقتی بدانید، نه
یک نشست دفترچه یادداشت. برای داده‌های تازه X، ابتدا
[`x_search`](/fa/tools/web#x_search) را اجرا کنید و نتیجه را به آن بدهید.

برای اجرای محلی، به‌جای آن از [`exec`](/fa/tools/exec) استفاده کنید.

## راه‌اندازی

<Steps>
  <Step title="ارائه اطلاعات اعتبارسنجی xAI">
    OAuth به اشتراک واجد شرایط SuperGrok یا X Premium نیاز دارد
    (تأیید با کد دستگاه انجام می‌شود، بنابراین از میزبان‌های راه‌دور و بدون
    فراخوانی برگشتی localhost نیز کار می‌کند):

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    هنگام نصب تازه، همین گزینه در فرایند آغازین نیز در دسترس است:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    یا با یک کلید API:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

    یا از طریق پیکربندی:

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              webSearch: {
                apiKey: "xai-...",
              },
            },
          },
        },
      },
    }
    ```

    هر یک از این سه روش، `x_search` و `web_search` در Grok را نیز فعال می‌کند.

  </Step>

  <Step title="فعال‌سازی و تنظیم code_execution">
    اگر `enabled` حذف شده باشد، `code_execution` فقط زمانی در دسترس قرار می‌گیرد
    که ارائه‌دهنده مدل فعال `xai` باشد و اطلاعات اعتبارسنجی xAI با موفقیت
    پیدا شود. برای مدل فعالی با ارائه‌دهنده شناخته‌شده غیر xAI،
    `plugins.entries.xai.config.codeExecution.enabled` را روی `true` تنظیم کنید
    تا استفاده میان‌ارائه‌دهنده‌ای را فعال کنید. اگر ارائه‌دهنده مدل فعال مشخص
    نباشد یا قابل تشخیص نباشد، ابزار پنهان می‌ماند. برای غیرفعال‌کردن آن برای
    همه ارائه‌دهندگان، `enabled` را روی `false` تنظیم کنید. اطلاعات اعتبارسنجی
    xAI همیشه الزامی است.

    برای بازنویسی مدل، سقف نوبت‌ها یا مهلت زمانی از همین بلوک استفاده کنید:

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true, // برای ارائه‌دهنده شناخته‌شده مدل غیر xAI الزامی است
                model: "grok-4.3", // بازنویسی مدل پیش‌فرض اجرای کد xAI
                maxTurns: 2,            // سقف اختیاری نوبت‌های داخلی ابزار
                timeoutSeconds: 30,     // مهلت زمانی درخواست (پیش‌فرض: ۳۰)
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="راه‌اندازی مجدد Gateway">
    ```bash
    openclaw gateway restart
    ```

    پس از ثبت مجدد Plugin‏ xAI و موفقیت بررسی‌های ارائه‌دهنده، فعال‌سازی و
    احراز هویت بالا، `code_execution` در فهرست ابزارهای عامل ظاهر می‌شود.

  </Step>
</Steps>

## روش استفاده

هدف تحلیل را صریح بیان کنید؛ ابزار تنها یک پارامتر `task` می‌پذیرد،
بنابراین درخواست کامل و هرگونه داده درون‌خطی را در یک پرامپت ارسال کنید:

```text
برای این اعداد، با استفاده از code_execution میانگین متحرک ۷روزه را محاسبه کن: ...
```

```text
با استفاده از x_search پست‌هایی را که این هفته به OpenClaw اشاره کرده‌اند پیدا کن، سپس با code_execution تعداد آن‌ها را به تفکیک روز بشمار.
```

```text
با استفاده از web_search جدیدترین اعداد معیارهای سنجش هوش مصنوعی را گردآوری کن، سپس با code_execution تغییرات درصدی را مقایسه کن.
```

## خطاها

بدون احراز هویت، ابزار یک خطای JSON ساخت‌یافته برمی‌گرداند (نه یک
استثنای پرتاب‌شده) تا عامل بتواند خوداصلاحی انجام دهد:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs xAI credentials. Run `openclaw onboard --auth-choice xai-oauth` to sign in with Grok, run `openclaw onboard --auth-choice xai-api-key`, set `XAI_API_KEY` in the Gateway environment, or configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## مرتبط

<CardGroup cols={2}>
  <Card title="ابزار Exec" href="/fa/tools/exec" icon="terminal">
    اجرای پوسته محلی روی دستگاه یا Node جفت‌شده شما.
  </Card>
  <Card title="تأییدهای Exec" href="/fa/tools/exec-approvals" icon="shield">
    خط‌مشی اجازه/رد برای اجرای پوسته.
  </Card>
  <Card title="ابزارهای وب" href="/fa/tools/web" icon="globe">
    `web_search`،‏ `x_search` و `web_fetch`.
  </Card>
  <Card title="ارائه‌دهنده xAI" href="/fa/providers/xai" icon="microchip">
    مدل‌های Grok، جست‌وجوی وب/X و پیکربندی اجرای کد.
  </Card>
</CardGroup>

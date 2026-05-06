---
read_when:
    - می‌خواهید مدل‌های GLM را در OpenClaw داشته باشید
    - به قرارداد نام‌گذاری مدل و راه‌اندازی نیاز دارید
summary: نمای کلی خانوادهٔ مدل‌های GLM و نحوهٔ استفاده از آن در OpenClaw
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-05-06T09:38:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 190b8834e3f11cdb90c9bdb1844bfad3a79383776540f733e601437157b7a093
    source_path: providers/glm.md
    workflow: 16
---

GLM یک خانوادهٔ مدل است (نه یک شرکت) که از طریق پلتفرم [Z.AI](https://z.ai) در دسترس است. در OpenClaw، مدل‌های GLM از طریق ارائه‌دهندهٔ همراه‌شدهٔ `zai` با ارجاع‌هایی مانند `zai/glm-5.1` قابل دسترسی هستند.

| ویژگی               | مقدار                                                                      |
| ------------------- | --------------------------------------------------------------------------- |
| شناسهٔ ارائه‌دهنده   | `zai`                                                                       |
| Plugin              | همراه‌شده، `enabledByDefault: true`                                         |
| متغیرهای محیطی احراز هویت | `ZAI_API_KEY` یا `Z_AI_API_KEY`                                             |
| گزینه‌های راه‌اندازی | `zai-api-key`, `zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn` |
| API                 | سازگار با OpenAI                                                           |
| URL پایهٔ پیش‌فرض    | `https://api.z.ai/api/paas/v4`                                              |
| پیش‌فرض پیشنهادی     | `zai/glm-5.1`                                                               |
| مدل تصویر پیش‌فرض    | `zai/glm-4.6v`                                                              |

## شروع به کار

<Steps>
  <Step title="یک مسیر احراز هویت انتخاب کنید و راه‌اندازی را اجرا کنید">
    گزینهٔ راه‌اندازی‌ای را انتخاب کنید که با طرح و منطقهٔ Z.AI شما سازگار است. گزینهٔ عمومی `zai-api-key` نقطهٔ پایانی متناظر را از شکل کلید به‌صورت خودکار تشخیص می‌دهد؛ وقتی می‌خواهید یک Coding Plan مشخص یا سطح API عمومی خاصی را اجبار کنید، از گزینه‌های منطقه‌ای صریح استفاده کنید.

    | گزینهٔ احراز هویت | مناسب برای                                         |
    | ------------------- | --------------------------------------------------- |
    | `zai-api-key`       | کلید API عمومی با تشخیص خودکار نقطهٔ پایانی        |
    | `zai-coding-global` | کاربران Coding Plan (جهانی)                        |
    | `zai-coding-cn`     | کاربران Coding Plan (منطقهٔ چین)                   |
    | `zai-global`        | API عمومی (جهانی)                                  |
    | `zai-cn`            | API عمومی (منطقهٔ چین)                             |

    <CodeGroup>

```bash تشخیص خودکار
openclaw onboard --auth-choice zai-api-key
```

```bash Coding Plan (جهانی)
openclaw onboard --auth-choice zai-coding-global
```

```bash Coding Plan (چین)
openclaw onboard --auth-choice zai-coding-cn
```

```bash API عمومی (جهانی)
openclaw onboard --auth-choice zai-global
```

```bash API عمومی (چین)
openclaw onboard --auth-choice zai-cn
```

    </CodeGroup>

  </Step>
  <Step title="GLM را به‌عنوان مدل پیش‌فرض تنظیم کنید">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="در دسترس بودن مدل‌ها را بررسی کنید">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## نمونهٔ پیکربندی

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
  `zai-api-key` به OpenClaw اجازه می‌دهد نقطهٔ پایانی متناظر Z.AI را از شکل کلید تشخیص دهد و URL پایهٔ درست را به‌صورت خودکار اعمال کند. وقتی می‌خواهید یک Coding Plan مشخص یا سطح API عمومی خاصی را ثابت کنید، از گزینه‌های منطقه‌ای صریح استفاده کنید.
</Tip>

## کاتالوگ داخلی

ارائه‌دهندهٔ همراه‌شدهٔ `zai`، ۱۳ ارجاع مدل GLM را مقداردهی اولیه می‌کند. همهٔ ورودی‌ها از استدلال پشتیبانی می‌کنند مگر اینکه خلاف آن مشخص شده باشد؛ `glm-5v-turbo` و `glm-4.6v` علاوه بر متن، ورودی تصویر را نیز می‌پذیرند.

| ارجاع مدل            | یادداشت‌ها                                        |
| -------------------- | -------------------------------------------------- |
| `zai/glm-5.1`        | مدل پیش‌فرض. استدلال، فقط متن، زمینهٔ 202k.       |
| `zai/glm-5`          | استدلال، فقط متن، زمینهٔ 202k.                    |
| `zai/glm-5-turbo`    | استدلال، فقط متن، زمینهٔ 202k.                    |
| `zai/glm-5v-turbo`   | استدلال، متن + تصویر، زمینهٔ 202k.                |
| `zai/glm-4.7`        | استدلال، فقط متن، زمینهٔ 204k.                    |
| `zai/glm-4.7-flash`  | استدلال، فقط متن، زمینهٔ 200k.                    |
| `zai/glm-4.7-flashx` | استدلال، فقط متن.                                 |
| `zai/glm-4.6`        | استدلال، فقط متن.                                 |
| `zai/glm-4.6v`       | استدلال، متن + تصویر. مدل تصویر پیش‌فرض.          |
| `zai/glm-4.5`        | استدلال، فقط متن.                                 |
| `zai/glm-4.5-air`    | استدلال، فقط متن.                                 |
| `zai/glm-4.5-flash`  | استدلال، فقط متن.                                 |
| `zai/glm-4.5v`       | استدلال، متن + تصویر.                             |

<Note>
  نسخه‌ها و دسترس‌پذیری GLM ممکن است تغییر کند. برای دیدن ردیف‌های کاتالوگی که نسخهٔ نصب‌شدهٔ شما می‌شناسد، `openclaw models list --provider zai` را اجرا کنید و برای مدل‌های تازه‌اضافه‌شده یا منسوخ‌شده، مستندات Z.AI را بررسی کنید.
</Note>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="تشخیص خودکار نقطهٔ پایانی">
    وقتی از گزینهٔ احراز هویت `zai-api-key` استفاده می‌کنید، OpenClaw شکل کلید را بررسی می‌کند تا URL پایهٔ درست Z.AI را تعیین کند. گزینه‌های منطقه‌ای صریح (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) تشخیص خودکار را نادیده می‌گیرند و نقطهٔ پایانی را مستقیما ثابت می‌کنند.
  </Accordion>

  <Accordion title="جزئیات ارائه‌دهنده">
    مدل‌های GLM توسط ارائه‌دهندهٔ زمان اجرای `zai` ارائه می‌شوند. برای پیکربندی کامل ارائه‌دهنده، نقاط پایانی منطقه‌ای و قابلیت‌های بیشتر، [صفحهٔ ارائه‌دهندهٔ Z.AI](/fa/providers/zai) را ببینید.
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="ارائه‌دهندهٔ Z.AI" href="/fa/providers/zai" icon="server">
    پیکربندی کامل ارائه‌دهندهٔ Z.AI و نقاط پایانی منطقه‌ای.
  </Card>
  <Card title="ارائه‌دهندگان مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهنده‌ها، ارجاع‌های مدل و رفتار جایگزینی هنگام خطا.
  </Card>
  <Card title="حالت‌های تفکر" href="/fa/tools/thinking" icon="brain">
    سطوح `/think` برای خانوادهٔ GLM دارای قابلیت استدلال.
  </Card>
  <Card title="پرسش‌های متداول مدل‌ها" href="/fa/help/faq-models" icon="circle-question">
    پروفایل‌های احراز هویت، تغییر مدل‌ها و رفع خطاهای «no profile».
  </Card>
</CardGroup>

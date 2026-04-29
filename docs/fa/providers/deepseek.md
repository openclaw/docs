---
read_when:
    - می‌خواهید از DeepSeek با OpenClaw استفاده کنید
    - به متغیر محیطی کلید API یا گزینه احراز هویت CLI نیاز دارید
summary: راه‌اندازی DeepSeek (احراز هویت + انتخاب مدل)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-29T23:24:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: e84d989a7cba8d259779ac02293718050ce51efe6ce2bdbfacb9e22bbfd294ef
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) مدل‌های قدرتمند هوش مصنوعی را با API سازگار با OpenAI ارائه می‌کند.

| ویژگی | مقدار                     |
| -------- | -------------------------- |
| ارائه‌دهنده | `deepseek`                 |
| احراز هویت     | `DEEPSEEK_API_KEY`         |
| API      | سازگار با OpenAI          |
| URL پایه | `https://api.deepseek.com` |

## شروع به کار

<Steps>
  <Step title="دریافت کلید API">
    یک کلید API در [platform.deepseek.com](https://platform.deepseek.com/api_keys) بسازید.
  </Step>
  <Step title="اجرای راه‌اندازی اولیه">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    این دستور کلید API شما را درخواست می‌کند و `deepseek/deepseek-v4-flash` را به‌عنوان مدل پیش‌فرض تنظیم می‌کند.

  </Step>
  <Step title="بررسی در دسترس بودن مدل‌ها">
    ```bash
    openclaw models list --provider deepseek
    ```

    برای بررسی کاتالوگ ایستای همراه بدون نیاز به Gateway در حال اجرا،
    از این استفاده کنید:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="راه‌اندازی غیرتعاملی">
    برای نصب‌های اسکریپت‌شده یا بدون رابط کاربری، همه فلگ‌ها را مستقیم وارد کنید:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
اگر Gateway به‌صورت daemon (launchd/systemd) اجرا می‌شود، مطمئن شوید `DEEPSEEK_API_KEY`
برای آن فرایند در دسترس است (برای مثال، در `~/.openclaw/.env` یا از طریق
`env.shellEnv`).
</Warning>

## کاتالوگ داخلی

| ارجاع مدل                    | نام              | ورودی | زمینه   | حداکثر خروجی | یادداشت‌ها                                      |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text  | 1,000,000 | 384,000    | مدل پیش‌فرض؛ سطح V4 با قابلیت فکر کردن |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text  | 1,000,000 | 384,000    | سطح V4 با قابلیت فکر کردن                |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072   | 8,192      | سطح DeepSeek V3.2 بدون فکر کردن         |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072   | 65,536     | سطح V3.2 با قابلیت استدلال             |

<Tip>
مدل‌های V4 از کنترل `thinking` در DeepSeek پشتیبانی می‌کنند. OpenClaw همچنین
`reasoning_content` در DeepSeek را در نوبت‌های بعدی بازپخش می‌کند تا نشست‌های فکر کردن با فراخوانی ابزارها
بتوانند ادامه پیدا کنند.
</Tip>

## فکر کردن و ابزارها

نشست‌های فکر کردن DeepSeek V4 نسبت به بیشتر ارائه‌دهنده‌های سازگار با OpenAI
قرارداد بازپخش سخت‌گیرانه‌تری دارند: پس از آن‌که یک نوبت با فکر کردن فعال از ابزارها استفاده کند، DeepSeek
انتظار دارد پیام‌های assistant بازپخش‌شده از آن نوبت در درخواست‌های بعدی شامل
`reasoning_content` باشند. OpenClaw این موضوع را در Plugin
DeepSeek مدیریت می‌کند، بنابراین استفاده عادی چندنوبتی از ابزارها با
`deepseek/deepseek-v4-flash` و `deepseek/deepseek-v4-pro` کار می‌کند.

اگر یک نشست موجود را از ارائه‌دهنده سازگار با OpenAI دیگری به یک
مدل DeepSeek V4 تغییر دهید، نوبت‌های قدیمی‌تر فراخوانی ابزار assistant ممکن است
`reasoning_content` بومی DeepSeek نداشته باشند. OpenClaw این فیلد گمشده را هنگام بازپخش
پیام‌های assistant برای درخواست‌های فکر کردن DeepSeek V4 پر می‌کند تا ارائه‌دهنده بتواند
تاریخچه را بدون نیاز به `/new` بپذیرد.

وقتی فکر کردن در OpenClaw غیرفعال است (از جمله انتخاب **None** در UI)،
OpenClaw مقدار `thinking: { type: "disabled" }` را برای DeepSeek ارسال می‌کند و
`reasoning_content` بازپخش‌شده را از تاریخچه خروجی حذف می‌کند. این کار نشست‌های با فکر کردن غیرفعال را
در مسیر بدون فکر کردن DeepSeek نگه می‌دارد.

برای مسیر سریع پیش‌فرض از `deepseek/deepseek-v4-flash` استفاده کنید. وقتی مدل V4
قوی‌تر را می‌خواهید و می‌توانید هزینه یا تأخیر بالاتر را بپذیرید، از
`deepseek/deepseek-v4-pro` استفاده کنید.

## آزمون زنده

مجموعه مدل زنده مستقیم شامل DeepSeek V4 در مجموعه مدل‌های مدرن است. برای
اجرای فقط بررسی‌های مدل مستقیم DeepSeek V4:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

این بررسی زنده تأیید می‌کند که هر دو مدل V4 می‌توانند کامل شوند و نوبت‌های بعدی فکر کردن/ابزار
payload بازپخشی را که DeepSeek نیاز دارد حفظ می‌کنند.

## نمونه پیکربندی

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهنده‌ها، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    مرجع کامل پیکربندی برای عامل‌ها، مدل‌ها، و ارائه‌دهنده‌ها.
  </Card>
</CardGroup>

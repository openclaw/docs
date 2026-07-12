---
read_when:
    - می‌خواهید از DeepSeek با OpenClaw استفاده کنید
    - به متغیر محیطی کلید API یا گزینهٔ احراز هویت CLI نیاز دارید
summary: راه‌اندازی DeepSeek (احراز هویت + انتخاب مدل)
title: DeepSeek
x-i18n:
    generated_at: "2026-07-12T10:38:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 77e074756d593205d7d05f499da93b9bd3c63acdce7092b42fb5562023577925
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) مدل‌های هوش مصنوعی قدرتمندی با یک API سازگار با OpenAI ارائه می‌دهد.

| ویژگی | مقدار                      |
| -------- | -------------------------- |
| ارائه‌دهنده | `deepseek`                 |
| احراز هویت     | `DEEPSEEK_API_KEY`         |
| API      | سازگار با OpenAI          |
| نشانی پایه | `https://api.deepseek.com` |

## نصب Plugin

Plugin رسمی را نصب کنید، سپس Gateway را راه‌اندازی مجدد کنید:

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## شروع به کار

<Steps>
  <Step title="دریافت کلید API">
    یک کلید API در [platform.deepseek.com](https://platform.deepseek.com/api_keys) ایجاد کنید.
  </Step>
  <Step title="اجرای راه‌اندازی اولیه">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    کلید API شما را درخواست می‌کند و `deepseek/deepseek-v4-flash` را به‌عنوان مدل پیش‌فرض تنظیم می‌کند.

  </Step>
  <Step title="بررسی دردسترس‌بودن مدل‌ها">
    ```bash
    openclaw models list --provider deepseek
    ```

    برای بررسی کاتالوگ ایستای Plugin بدون Gateway در حال اجرا:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="راه‌اندازی غیرتعاملی">
    برای نصب‌های اسکریپتی یا بدون رابط گرافیکی، همه پرچم‌ها را مستقیماً وارد کنید:

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
اگر Gateway به‌صورت یک سرویس پس‌زمینه (launchd/systemd) اجرا می‌شود، مطمئن شوید `DEEPSEEK_API_KEY`
برای آن فرایند در دسترس است (برای مثال، در `~/.openclaw/.env` یا از طریق
`env.shellEnv`).
</Warning>

## کاتالوگ داخلی

| مرجع مدل                    | نام              | ورودی | زمینه   | حداکثر خروجی | توضیحات                                               |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | --------------------------------------------------- |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | متن  | 1,000,000 | 384,000    | مدل پیش‌فرض؛ رابط V4 با قابلیت تفکر          |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | متن  | 1,000,000 | 384,000    | رابط V4 با قابلیت تفکر                         |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | متن  | 1,000,000 | 384,000    | نام سازگاری منسوخ‌شده برای V4 Flash بدون تفکر |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | متن  | 1,000,000 | 384,000    | نام سازگاری منسوخ‌شده برای V4 Flash با تفکر     |

<Warning>
DeepSeek در ۲۴ ژوئیهٔ ۲۰۲۶ ساعت ۱۵:۵۹ به‌وقت UTC، `deepseek-chat` و `deepseek-reasoner` را
بازنشسته خواهد کرد. این مدل‌ها در حال حاضر به‌ترتیب در حالت بدون تفکر و
حالت تفکر به DeepSeek V4 Flash هدایت می‌شوند. پیش از موعد مقرر، مراجع مدل پیکربندی‌شده را به
`deepseek/deepseek-v4-flash` یا `deepseek/deepseek-v4-pro` منتقل کنید.
</Warning>

برآوردهای هزینهٔ محلی OpenClaw از نرخ‌های منتشرشدهٔ DeepSeek برای برخورد با حافظهٔ نهان،
عدم برخورد با حافظهٔ نهان و خروجی پیروی می‌کنند. DeepSeek می‌تواند این نرخ‌ها را تغییر دهد؛ صفحهٔ
[مدل‌ها و قیمت‌گذاری](https://api-docs.deepseek.com/quick_start/pricing/) آن
مرجع معتبر صورت‌حساب است.

<Tip>
مدل‌های V4 از کنترل `thinking` در DeepSeek پشتیبانی می‌کنند. OpenClaw همچنین
`reasoning_content` متعلق به DeepSeek را در نوبت‌های بعدی بازپخش می‌کند تا نشست‌های تفکر دارای
فراخوانی ابزار بتوانند ادامه یابند.
برای درخواست حداکثر `reasoning_effort` در DeepSeek، از `/think xhigh` یا `/think max`
همراه مدل‌های DeepSeek V4 استفاده کنید؛ هر دو به `"max"` نگاشت می‌شوند.
</Tip>

## تفکر و ابزارها

نشست‌های تفکر DeepSeek V4 ایجاب می‌کنند که پیام‌های بازپخش‌شدهٔ دستیار از یک
نوبت دارای تفکر، در درخواست‌های بعدی شامل `reasoning_content` باشند.
Plugin ‏DeepSeek در OpenClaw این فیلد را به‌صورت خودکار تکمیل می‌کند؛ بنابراین استفادهٔ معمول
چندنوبتی از ابزارها روی `deepseek/deepseek-v4-flash` و
`deepseek/deepseek-v4-pro` حتی زمانی کار می‌کند که تاریخچه از یک
ارائه‌دهندهٔ دیگر سازگار با OpenAI (بدون `reasoning_content` بومی) یا از یک پیام سادهٔ
دستیار آمده باشد. پس از تغییر ارائه‌دهنده در میانهٔ نشست، نیازی به `/new` نیست.

وقتی تفکر غیرفعال است (از جمله انتخاب **None** در رابط کاربری)، OpenClaw
مقدار `thinking: { type: "disabled" }` را ارسال می‌کند و `reasoning_content` بازپخش‌شده را
از تاریخچهٔ خروجی حذف می‌کند تا نشست در مسیر بدون تفکر DeepSeek باقی بماند.

برای مسیر سریع پیش‌فرض از `deepseek/deepseek-v4-flash` استفاده کنید. هنگامی که می‌توانید
هزینه یا تأخیر بیشتر را بپذیرید، برای مدل قدرتمندتر از
`deepseek/deepseek-v4-pro` استفاده کنید.

## آزمون زنده

برای اجرای فقط بررسی‌های مستقیم مدل DeepSeek V4 از مجموعهٔ آزمون زندهٔ مدل‌های مدرن:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

تکمیل پاسخ توسط هر دو مدل V4 و حفظ محتوای بازپخش موردنیاز DeepSeek در
نوبت‌های بعدی تفکر/ابزار را بررسی می‌کند.

## نمونهٔ پیکربندی

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

## مطالب مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، مراجع مدل و رفتار جایگزینی هنگام خطا.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    مرجع کامل پیکربندی عامل‌ها، مدل‌ها و ارائه‌دهندگان.
  </Card>
</CardGroup>

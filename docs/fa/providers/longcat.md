---
read_when:
    - می‌خواهید از LongCat-2.0 با OpenClaw استفاده کنید
    - به کلید API سرویس LongCat یا محدودیت‌های مدل نیاز دارید
summary: راه‌اندازی API لانگ‌کت برای لانگ‌کت-۲.۰
title: لانگ‌کت
x-i18n:
    generated_at: "2026-07-12T10:39:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c447f9c42e6547a69d2124debcb685c32fe59de29bfc551e18e791d9f280584
    source_path: providers/longcat.md
    workflow: 16
---

[LongCat](https://longcat.ai) یک API میزبانی‌شده برای LongCat-2.0 ارائه می‌دهد؛ مدلی استدلالی که برای کدنویسی و بارهای کاری عامل‌محور ساخته شده است. OpenClaw، Plugin رسمی `longcat` را برای نقطه پایانی سازگار با OpenAI متعلق به LongCat ارائه می‌کند.

| ویژگی       | مقدار                                  |
| ------------ | -------------------------------------- |
| ارائه‌دهنده  | `longcat`                              |
| احراز هویت   | `LONGCAT_API_KEY`                      |
| API          | تکمیل‌های گفت‌وگوی سازگار با OpenAI    |
| نشانی پایه   | `https://api.longcat.chat/openai`      |
| مدل          | `longcat/LongCat-2.0`                  |
| بافت         | ۱٬۰۴۸٬۵۷۶ توکن                         |
| حداکثر خروجی | ۱۳۱٬۰۷۲ توکن                           |
| ورودی        | متن                                    |

## نصب Plugin

بسته رسمی را نصب کنید، سپس Gateway را راه‌اندازی مجدد کنید:

```bash
openclaw plugins install @openclaw/longcat-provider
openclaw gateway restart
```

## شروع به کار

<Steps>
  <Step title="ایجاد کلید API">
    وارد [پلتفرم API ‏LongCat](https://longcat.chat/platform/) شوید و در صفحه
    [کلیدهای API](https://longcat.chat/platform/api_keys) یک کلید ایجاد کنید.
  </Step>
  <Step title="اجرای راه‌اندازی اولیه">
    ```bash
    openclaw onboard --auth-choice longcat-api-key
    ```
  </Step>
  <Step title="تأیید مدل">
    ```bash
    openclaw models list --provider longcat
    ```
  </Step>
</Steps>

راه‌اندازی اولیه، کاتالوگ میزبانی‌شده را اضافه می‌کند و در صورتی که از قبل مدل اصلی پیکربندی نشده باشد، `longcat/LongCat-2.0` را انتخاب می‌کند.

### راه‌اندازی غیرتعاملی

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice longcat-api-key \
  --longcat-api-key "$LONGCAT_API_KEY"
```

## رفتار استدلال

LongCat کنترل دودویی تفکر را ارائه می‌دهد. OpenClaw سطوح فعال تفکر را به `thinking: { type: "enabled" }` و `/think off` را به `thinking: { type: "disabled" }` نگاشت می‌کند. LongCat در حال حاضر `reasoning_effort` را مستند نکرده است؛ بنابراین OpenClaw آن را ارسال نمی‌کند.

LongCat استدلال را در `reasoning_content` برمی‌گرداند. OpenClaw هنگام بازپخش نوبت‌های فراخوانی ابزار دستیار، این فیلد را حفظ می‌کند تا نشست‌های عامل چندنوبتی، ساختار پیام مورد انتظار ارائه‌دهنده را نگه دارند.

## قیمت‌گذاری

کاتالوگ داخلی از قیمت‌های فهرست پرداخت به‌ازای مصرف LongCat به دلار آمریکا برای هر یک میلیون توکن استفاده می‌کند: ۰٫۷۵ دلار برای ورودی ذخیره‌نشده در حافظه نهان، ۰٫۰۱۵ دلار برای ورودی ذخیره‌شده در حافظه نهان و ۲٫۹۵ دلار برای خروجی. ممکن است LongCat تخفیف‌های موقتی ارائه دهد؛ [صفحه قیمت‌گذاری](https://longcat.chat/platform/docs/Pricing/LongCat-2.0.html) و سوابق صورت‌حساب شما منابع معتبر هستند.

## LongCat-2.0 خودمیزبان

ارائه‌دهنده `longcat`، API میزبانی‌شده LongCat را هدف قرار می‌دهد. برای وزن‌های باز موجود در [Hugging Face](https://huggingface.co/meituan-longcat/LongCat-2.0)، مدل را از طریق یک محیط اجرای سازگار با OpenAI ارائه کنید و به‌جای آن از ارائه‌دهنده موجود [vLLM](/fa/providers/vllm) یا [SGLang](/fa/providers/sglang) در OpenClaw استفاده کنید.

شناسه دقیق مدل در محیط اجرا را در کاتالوگ ارائه‌دهنده خودمیزبان نگه دارید؛ یک استقرار محلی را از طریق `longcat/LongCat-2.0` مسیریابی نکنید.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="کلید در پوسته کار می‌کند، اما در Gateway کار نمی‌کند">
    فرایندهای Gateway که توسط سرویس پس‌زمینه مدیریت می‌شوند، همه متغیرهای پوسته تعاملی را به ارث نمی‌برند. `LONGCAT_API_KEY` را در `~/.openclaw/.env` قرار دهید، آن را از طریق راه‌اندازی اولیه پیکربندی کنید یا از یک ارجاع راز تأییدشده استفاده کنید.
  </Accordion>

  <Accordion title="درخواست‌ها با خطای 402 یا 429 ناموفق می‌شوند">
    `402` به این معناست که حساب سهمیه توکن کافی ندارد. `429` به این معناست که کلید API به محدودیت نرخ رسیده است. [میزان استفاده LongCat](https://longcat.chat/platform/usage) را بررسی کنید و درخواست‌های محدودشده از نظر نرخ را پس از پایان بازه انتظار ارائه‌دهنده دوباره امتحان کنید.
  </Accordion>

  <Accordion title="مدل نمایش داده نمی‌شود">
    `openclaw plugins list` را اجرا کنید و تأیید کنید که Plugin ‏`longcat` فعال است؛ سپس `openclaw models list --provider longcat` را اجرا کنید.
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="ارائه‌دهندگان مدل" href="/fa/concepts/model-providers" icon="layers">
    پیکربندی ارائه‌دهنده، ارجاع‌های مدل و رفتار جایگزینی هنگام خرابی.
  </Card>
  <Card title="مستندات API ‏LongCat" href="https://longcat.chat/platform/docs/" icon="arrow-up-right-from-square">
    نقاط پایانی API میزبانی‌شده، احراز هویت، محدودیت‌ها و نمونه‌ها.
  </Card>
  <Card title="کارت مدل LongCat-2.0" href="https://huggingface.co/meituan-longcat/LongCat-2.0" icon="arrow-up-right-from-square">
    معماری، راهنمای استقرار و جزئیات مدل.
  </Card>
  <Card title="رازها" href="/fa/gateway/secrets" icon="key">
    اطلاعات احراز هویت ارائه‌دهنده را بدون گنجاندن متن ساده در پیکربندی ذخیره کنید.
  </Card>
</CardGroup>

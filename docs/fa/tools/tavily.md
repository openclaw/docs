---
read_when:
    - شما جست‌وجوی وب مبتنی بر Tavily می‌خواهید
    - به یک کلید API Tavily نیاز دارید
    - شما Tavily را به‌عنوان ارائه‌دهنده‌ی web_search می‌خواهید
    - می‌خواهید محتوا از URLها استخراج شود
summary: ابزارهای جست‌وجو و استخراج Tavily
title: Tavily
x-i18n:
    generated_at: "2026-06-27T19:05:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 539e76120e858129dabfb85c1fe379837fc87be491d5a57803917bf6bb7018ae
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) یک API جست‌وجو است که برای برنامه‌های هوش مصنوعی طراحی شده است. OpenClaw آن را به دو روش ارائه می‌کند:

- به‌عنوان ارائه‌دهنده `web_search` برای ابزار جست‌وجوی عمومی
- به‌عنوان ابزارهای صریح Plugin: `tavily_search` و `tavily_extract`

Tavily نتایج ساخت‌یافته‌ای را برمی‌گرداند که برای مصرف LLM بهینه شده‌اند و از عمق جست‌وجوی قابل تنظیم، فیلتر موضوع، فیلتر دامنه، خلاصه‌های پاسخ تولیدشده با هوش مصنوعی، و استخراج محتوا از URLها (از جمله صفحه‌های رندرشده با JavaScript) پشتیبانی می‌کند.

| ویژگی  | مقدار                               |
| --------- | ----------------------------------- |
| شناسه Plugin | `tavily`                            |
| بسته   | `@openclaw/tavily-plugin`           |
| احراز هویت      | `TAVILY_API_KEY` یا پیکربندی `apiKey` |
| URL پایه  | `https://api.tavily.com` (پیش‌فرض)  |
| ابزارها     | `tavily_search`, `tavily_extract`   |

## شروع به کار

<Steps>
  <Step title="نصب Plugin">
    ```bash
    openclaw plugins install @openclaw/tavily-plugin
    ```
  </Step>
  <Step title="دریافت کلید API">
    یک حساب Tavily در [tavily.com](https://tavily.com) بسازید، سپس در داشبورد یک کلید API تولید کنید.
  </Step>
  <Step title="پیکربندی Plugin و ارائه‌دهنده">
    ```json5
    {
      plugins: {
        entries: {
          tavily: {
            enabled: true,
            config: {
              webSearch: {
                apiKey: "tvly-...", // optional if TAVILY_API_KEY is set
                baseUrl: "https://api.tavily.com",
              },
            },
          },
        },
      },
      tools: {
        web: {
          search: {
            provider: "tavily",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="تأیید اجرای جست‌وجو">
    یک `web_search` را از هر عاملی اجرا کنید، یا `tavily_search` را مستقیم فراخوانی کنید.
  </Step>
</Steps>

<Tip>
انتخاب Tavily در فرایند راه‌اندازی اولیه یا `openclaw configure --section web` در صورت نیاز Plugin رسمی Tavily را نصب و فعال می‌کند.
</Tip>

## مرجع ابزار

### `tavily_search`

وقتی به‌جای `web_search` عمومی، کنترل‌های جست‌وجوی مخصوص Tavily را می‌خواهید از این ابزار استفاده کنید.

| پارامتر         | نوع         | محدودیت‌ها / پیش‌فرض                  | توضیح                                     |
| ----------------- | ------------ | -------------------------------------- | ----------------------------------------------- |
| `query`           | string       | الزامی                               | رشته پرس‌وجوی جست‌وجو. کمتر از ۴۰۰ نویسه نگه دارید. |
| `search_depth`    | enum         | `basic` (پیش‌فرض), `advanced`          | `advanced` کندتر است اما ارتباط بیشتری دارد.      |
| `topic`           | enum         | `general` (پیش‌فرض), `news`, `finance` | بر اساس خانواده موضوع فیلتر می‌کند.                         |
| `max_results`     | integer      | 1-20                                   | تعداد نتایج.                              |
| `include_answer`  | boolean      | پیش‌فرض `false`                        | خلاصه پاسخ تولیدشده با هوش مصنوعی Tavily را شامل می‌شود.   |
| `time_range`      | enum         | `day`, `week`, `month`, `year`         | نتایج را بر اساس تازگی فیلتر می‌کند.                      |
| `include_domains` | string array | (هیچ‌کدام)                                 | فقط نتایج این دامنه‌ها را شامل می‌شود.        |
| `exclude_domains` | string array | (هیچ‌کدام)                                 | نتایج این دامنه‌ها را حذف می‌کند.             |

موازنه عمق جست‌وجو:

| عمق      | سرعت  | ارتباط | بهترین کاربرد                             |
| ---------- | ------ | --------- | ------------------------------------ |
| `basic`    | سریع‌تر | زیاد      | پرس‌وجوهای عمومی (پیش‌فرض).   |
| `advanced` | کندتر | بیشترین   | پژوهش دقیق و راستی‌آزمایی. |

### `tavily_extract`

برای استخراج محتوای تمیز از یک یا چند URL از این ابزار استفاده کنید. صفحه‌های رندرشده با JavaScript را مدیریت می‌کند و از قطعه‌بندی متمرکز بر پرس‌وجو برای استخراج هدفمند پشتیبانی می‌کند.

| پارامتر           | نوع         | محدودیت‌ها / پیش‌فرض         | توضیح                                                 |
| ------------------- | ------------ | ----------------------------- | ----------------------------------------------------------- |
| `urls`              | string array | الزامی، 1-20                | URLهایی که محتوا از آن‌ها استخراج می‌شود.                               |
| `query`             | string       | (اختیاری)                    | قطعه‌های استخراج‌شده را بر اساس ارتباط با این پرس‌وجو دوباره رتبه‌بندی می‌کند.         |
| `extract_depth`     | enum         | `basic` (پیش‌فرض), `advanced` | برای صفحه‌های سنگین از نظر JS، SPAها، یا جدول‌های پویا از `advanced` استفاده کنید. |
| `chunks_per_source` | integer      | 1-5؛ **نیازمند `query`**     | تعداد قطعه‌های بازگردانده‌شده برای هر URL. اگر بدون `query` تنظیم شود خطا می‌دهد.     |
| `include_images`    | boolean      | پیش‌فرض `false`               | URL تصاویر را در نتایج شامل می‌شود.                              |

موازنه عمق استخراج:

| عمق      | زمان استفاده                                |
| ---------- | ------------------------------------------ |
| `basic`    | صفحه‌های ساده. ابتدا این را امتحان کنید.              |
| `advanced` | SPAهای رندرشده با JS، محتوای پویا، جدول‌ها. |

<Tip>
فهرست‌های بزرگ‌تر URL را به چند فراخوانی `tavily_extract` تقسیم کنید (حداکثر ۲۰ مورد در هر درخواست). برای دریافت فقط محتوای مرتبط به‌جای صفحه‌های کامل، از `query` همراه با `chunks_per_source` استفاده کنید.
</Tip>

## انتخاب ابزار مناسب

| نیاز                                 | ابزار             |
| ------------------------------------ | ---------------- |
| جست‌وجوی سریع وب، بدون گزینه‌های ویژه | `web_search`     |
| جست‌وجو با عمق، موضوع، پاسخ‌های هوش مصنوعی | `tavily_search`  |
| استخراج محتوا از URLهای مشخص   | `tavily_extract` |

<Note>
ابزار عمومی `web_search` با Tavily به‌عنوان ارائه‌دهنده از `query` و `count` (تا ۲۰ نتیجه) پشتیبانی می‌کند. برای کنترل‌های مخصوص Tavily (`search_depth`, `topic`, `include_answer`, فیلترهای دامنه، بازه زمانی)، به‌جای آن از `tavily_search` استفاده کنید.
</Note>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="ترتیب یافتن کلید API">
    کلاینت Tavily کلید API خود را به این ترتیب جست‌وجو می‌کند:

    1. `plugins.entries.tavily.config.webSearch.apiKey` (از طریق SecretRefs حل می‌شود).
    2. `TAVILY_API_KEY` از محیط Gateway.

    اگر هیچ‌کدام وجود نداشته باشد، `tavily_extract` خطای راه‌اندازی ایجاد می‌کند.

  </Accordion>

  <Accordion title="URL پایه سفارشی">
    اگر Tavily را از طریق یک پراکسی جلوی مسیر قرار می‌دهید، `plugins.entries.tavily.config.webSearch.baseUrl` را بازنویسی کنید. مقدار پیش‌فرض `https://api.tavily.com` است.
  </Accordion>

  <Accordion title="`chunks_per_source` به `query` نیاز دارد">
    `tavily_extract` فراخوانی‌هایی را که `chunks_per_source` را بدون `query` ارسال می‌کنند رد می‌کند. Tavily قطعه‌ها را بر اساس ارتباط با پرس‌وجو رتبه‌بندی می‌کند، بنابراین این پارامتر بدون آن بی‌معنا است.
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="نمای کلی جست‌وجوی وب" href="/fa/tools/web" icon="magnifying-glass">
    همه ارائه‌دهنده‌ها و قواعد تشخیص خودکار.
  </Card>
  <Card title="Firecrawl" href="/fa/tools/firecrawl" icon="fire">
    جست‌وجو به‌همراه scraping با استخراج محتوا.
  </Card>
  <Card title="Exa Search" href="/fa/tools/exa-search" icon="binoculars">
    جست‌وجوی عصبی با استخراج محتوا.
  </Card>
  <Card title="پیکربندی" href="/fa/gateway/configuration" icon="gear">
    طرح‌واره کامل پیکربندی برای ورودی‌های Plugin و مسیریابی ابزار.
  </Card>
</CardGroup>

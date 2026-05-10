---
read_when:
    - شما جست‌وجوی وب مبتنی بر Tavily می‌خواهید
    - به یک کلید API Tavily نیاز دارید
    - Tavily را به‌عنوان ارائه‌دهندهٔ web_search می‌خواهید
    - می‌خواهید محتوا از URLها استخراج شود
summary: ابزارهای جست‌وجو و استخراج Tavily
title: Tavily
x-i18n:
    generated_at: "2026-05-10T20:12:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 071e2b1be054890711e32d7424d16d94133d16ff1ce7da3703e62c53b5c217ef
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) یک API جست‌وجو است که برای برنامه‌های AI طراحی شده است. OpenClaw آن را به دو روش ارائه می‌کند:

- به‌عنوان ارائه‌دهنده‌ی `web_search` برای ابزار جست‌وجوی عمومی
- به‌عنوان ابزارهای صریح Plugin: ‏`tavily_search` و `tavily_extract`

Tavily نتایج ساختاریافته‌ای برمی‌گرداند که برای مصرف LLM بهینه شده‌اند و عمق جست‌وجوی قابل پیکربندی، فیلتر موضوع، فیلترهای دامنه، خلاصه پاسخ‌های تولیدشده با AI، و استخراج محتوا از URLها (از جمله صفحه‌های رندرشده با JavaScript) را پشتیبانی می‌کنند.

| ویژگی      | مقدار                               |
| ------------- | ----------------------------------- |
| شناسه Plugin     | `tavily`                            |
| احراز هویت          | `TAVILY_API_KEY` یا پیکربندی `apiKey` |
| URL پایه      | `https://api.tavily.com` (پیش‌فرض)  |
| ابزارهای همراه | `tavily_search`, `tavily_extract`   |

## شروع به کار

<Steps>
  <Step title="دریافت یک کلید API">
    در [tavily.com](https://tavily.com) یک حساب Tavily بسازید، سپس در داشبورد یک کلید API ایجاد کنید.
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
  <Step title="بررسی اجرای جست‌وجو">
    از هر agent یک `web_search` اجرا کنید، یا مستقیما `tavily_search` را فراخوانی کنید.
  </Step>
</Steps>

<Tip>
انتخاب Tavily در onboarding یا `openclaw configure --section web`، Plugin همراه Tavily را به‌صورت خودکار فعال می‌کند.
</Tip>

## مرجع ابزار

### `tavily_search`

وقتی به کنترل‌های جست‌وجوی اختصاصی Tavily به‌جای `web_search` عمومی نیاز دارید، از این استفاده کنید.

| پارامتر         | نوع         | محدودیت‌ها / پیش‌فرض                  | توضیح                                     |
| ----------------- | ------------ | -------------------------------------- | ----------------------------------------------- |
| `query`           | string       | الزامی                               | رشته پرس‌وجوی جست‌وجو. کمتر از 400 نویسه نگه دارید. |
| `search_depth`    | enum         | `basic` (پیش‌فرض), `advanced`          | `advanced` کندتر است اما ارتباط بالاتری دارد.      |
| `topic`           | enum         | `general` (پیش‌فرض), `news`, `finance` | فیلتر بر اساس خانواده موضوع.                         |
| `max_results`     | integer      | 1-20                                   | تعداد نتایج.                              |
| `include_answer`  | boolean      | پیش‌فرض `false`                        | شامل‌کردن خلاصه پاسخ تولیدشده با AI توسط Tavily.   |
| `time_range`      | enum         | `day`, `week`, `month`, `year`         | فیلتر نتایج بر اساس تازگی.                      |
| `include_domains` | string array | (هیچ‌کدام)                                 | فقط نتایج این دامنه‌ها را شامل شود.        |
| `exclude_domains` | string array | (هیچ‌کدام)                                 | نتایج این دامنه‌ها حذف شود.             |

موازنه عمق جست‌وجو:

| عمق      | سرعت  | ارتباط | بهترین کاربرد                             |
| ---------- | ------ | --------- | ------------------------------------ |
| `basic`    | سریع‌تر | بالا      | پرس‌وجوهای عمومی (پیش‌فرض).   |
| `advanced` | کندتر | بالاترین   | پژوهش دقیق و حقیقت‌یابی. |

### `tavily_extract`

از این برای استخراج محتوای تمیز از یک یا چند URL استفاده کنید. صفحه‌های رندرشده با JavaScript را مدیریت می‌کند و برای استخراج هدفمند، قطعه‌بندی متمرکز بر پرس‌وجو را پشتیبانی می‌کند.

| پارامتر           | نوع         | محدودیت‌ها / پیش‌فرض         | توضیح                                                 |
| ------------------- | ------------ | ----------------------------- | ----------------------------------------------------------- |
| `urls`              | string array | الزامی، 1-20                | URLهایی که محتوا از آن‌ها استخراج می‌شود.                               |
| `query`             | string       | (اختیاری)                    | رتبه‌بندی دوباره قطعه‌های استخراج‌شده بر اساس ارتباط با این پرس‌وجو.         |
| `extract_depth`     | enum         | `basic` (پیش‌فرض), `advanced` | از `advanced` برای صفحه‌های سنگین از نظر JS، SPAها، یا جدول‌های پویا استفاده کنید. |
| `chunks_per_source` | integer      | 1-5؛ **به `query` نیاز دارد**     | قطعه‌های برگشتی به‌ازای هر URL. اگر بدون `query` تنظیم شود خطا می‌دهد.     |
| `include_images`    | boolean      | پیش‌فرض `false`               | شامل‌کردن URLهای تصویر در نتایج.                              |

موازنه عمق استخراج:

| عمق      | زمان استفاده                                |
| ---------- | ------------------------------------------ |
| `basic`    | صفحه‌های ساده. ابتدا این را امتحان کنید.              |
| `advanced` | SPAهای رندرشده با JS، محتوای پویا، جدول‌ها. |

<Tip>
فهرست‌های بزرگ‌تر URL را در چند فراخوانی `tavily_extract` دسته‌بندی کنید (حداکثر 20 مورد در هر درخواست). برای دریافت فقط محتوای مرتبط به‌جای صفحه‌های کامل، از `query` به‌همراه `chunks_per_source` استفاده کنید.
</Tip>

## انتخاب ابزار مناسب

| نیاز                                 | ابزار             |
| ------------------------------------ | ---------------- |
| جست‌وجوی سریع وب، بدون گزینه‌های ویژه | `web_search`     |
| جست‌وجو با عمق، موضوع، پاسخ‌های AI | `tavily_search`  |
| استخراج محتوا از URLهای مشخص   | `tavily_extract` |

<Note>
ابزار عمومی `web_search` با Tavily به‌عنوان ارائه‌دهنده، از `query` و `count` (تا 20 نتیجه) پشتیبانی می‌کند. برای کنترل‌های اختصاصی Tavily (`search_depth`, `topic`, `include_answer`, فیلترهای دامنه، بازه زمانی)، به‌جای آن از `tavily_search` استفاده کنید.
</Note>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="ترتیب یافتن کلید API">
    کلاینت Tavily کلید API خود را به این ترتیب جست‌وجو می‌کند:

    1. `plugins.entries.tavily.config.webSearch.apiKey` (حل‌شده از طریق SecretRefs).
    2. `TAVILY_API_KEY` از محیط gateway.

    اگر هیچ‌کدام وجود نداشته باشد، `tavily_extract` خطای راه‌اندازی ایجاد می‌کند.

  </Accordion>

  <Accordion title="URL پایه سفارشی">
    اگر Tavily را از طریق یک proxy در جلو قرار می‌دهید، `plugins.entries.tavily.config.webSearch.baseUrl` را بازنویسی کنید. مقدار پیش‌فرض `https://api.tavily.com` است.
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
  <Card title="جست‌وجوی Exa" href="/fa/tools/exa-search" icon="binoculars">
    جست‌وجوی عصبی با استخراج محتوا.
  </Card>
  <Card title="پیکربندی" href="/fa/gateway/configuration" icon="gear">
    schema کامل پیکربندی برای ورودی‌های Plugin و مسیریابی ابزار.
  </Card>
</CardGroup>

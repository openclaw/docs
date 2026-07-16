---
read_when:
    - در حال پیکربندی Plugin ‏memory-lancedb هستید
    - حافظهٔ بلندمدت مبتنی بر LanceDB با یادآوری خودکار یا ثبت خودکار می‌خواهید
    - از تعبیه‌سازی‌های محلی سازگار با OpenAI مانند Ollama استفاده می‌کنید
sidebarTitle: Memory LanceDB
summary: Plugin رسمی و خارجی حافظهٔ LanceDB را، از جمله تعبیه‌سازی‌های محلی سازگار با Ollama، پیکربندی کنید
title: حافظه LanceDB
x-i18n:
    generated_at: "2026-07-16T16:54:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 786b511da4fbfd90f4c3e5be5a1aeddf5daa59036247552bd671f4bab89319f6
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` یک plugin خارجی رسمی است که حافظهٔ بلندمدت را با قابلیت جست‌وجوی برداری در
LanceDB ذخیره می‌کند. این plugin می‌تواند پیش از نوبت مدل، خاطرات مرتبط را به‌طور خودکار
بازیابی کند و پس از پاسخ، واقعیت‌های مهم را به‌طور خودکار ثبت کند.

از آن برای یک پایگاه دادهٔ برداری محلی، یک نقطهٔ پایانی تعبیه‌سازی سازگار با OpenAI، یا
یک مخزن حافظه خارج از بک‌اند حافظهٔ داخلی پیش‌فرض استفاده کنید.

## نصب

```bash
openclaw plugins install @openclaw/memory-lancedb
```

این plugin در npm منتشر شده است و در تصویر زمان اجرای OpenClaw
گنجانده نمی‌شود. نصب آن ورودی plugin را می‌نویسد، آن را فعال می‌کند و
`plugins.slots.memory` را به `memory-lancedb` تغییر می‌دهد. اگر plugin دیگری در حال حاضر مالک
جایگاه حافظه باشد، آن plugin همراه با یک هشدار غیرفعال می‌شود.

<Note>
pluginهای همراهی مانند `memory-wiki` می‌توانند در کنار `memory-lancedb` اجرا شوند،
اما در هر لحظه تنها یک plugin مالک جایگاه حافظهٔ فعال است.
</Note>

## شروع سریع

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "openai",
            model: "text-embedding-3-small",
          },
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

پس از تغییر پیکربندی plugin، Gateway را راه‌اندازی مجدد کنید و سپس بارگذاری آن را بررسی کنید:

```bash
openclaw gateway restart
openclaw plugins list
```

## پیکربندی تعبیه‌سازی

`embedding` الزامی است و باید دست‌کم یک فیلد داشته باشد. `provider`
به‌طور پیش‌فرض `openai` است؛ `model` نیز به‌طور پیش‌فرض `text-embedding-3-small` است.

| فیلد                  | نوع          | توضیحات                                                                    |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | رشته        | شناسهٔ آداپتور، برای مثال `openai`، `github-copilot`، `ollama`. پیش‌فرض `openai`. |
| `embedding.model`      | رشته        | پیش‌فرض `text-embedding-3-small`.                                        |
| `embedding.apiKey`     | رشته        | اختیاری؛ از بسط `${ENV_VAR}` پشتیبانی می‌کند.                               |
| `embedding.baseUrl`    | رشته        | اختیاری؛ از بسط `${ENV_VAR}` پشتیبانی می‌کند.                               |
| `embedding.dimensions` | عدد صحیح (>=1) | برای مدل‌هایی که در جدول داخلی نیستند الزامی است (پایین را ببینید).               |

دو مسیر درخواست وجود دارد:

- **مسیر آداپتور ارائه‌دهنده** (پیش‌فرض): `embedding.provider` را تنظیم و
  `embedding.apiKey`/`embedding.baseUrl` را حذف کنید. plugin، پروفایل احراز هویت
  پیکربندی‌شدهٔ ارائه‌دهنده، متغیر محیطی یا
  `models.providers.<provider>.apiKey` را از طریق همان آداپتورهای تعبیه‌سازی حافظه‌ای
  که `memory-core` استفاده می‌کند، پیدا می‌کند. این مسیر برای `github-copilot`، `ollama`
  و هر ارائه‌دهندهٔ همراه دیگری است که از تعبیه‌سازی پشتیبانی می‌کند.
- **مسیر مستقیم کلاینت سازگار با OpenAI**: `embedding.provider` را تنظیم‌نشده بگذارید
  (یا `"openai"`) و `embedding.apiKey` را به‌همراه `embedding.baseUrl` تنظیم کنید. از این مسیر
  برای یک نقطهٔ پایانی خام تعبیه‌سازی سازگار با OpenAI استفاده کنید که آداپتور ارائه‌دهندهٔ
  همراهی ندارد.

OAuth متعلق به OpenAI Codex / ChatGPT یک اعتبارنامهٔ تعبیه‌سازی پلتفرم OpenAI نیست.
برای تعبیه‌سازی OpenAI از یک پروفایل احراز هویت کلید API ‏OpenAI، `OPENAI_API_KEY` یا
`models.providers.openai.apiKey` استفاده کنید. کاربرانی که فقط OAuth دارند باید ارائه‌دهندهٔ دیگری
با قابلیت تعبیه‌سازی، مانند `github-copilot` یا `ollama`، انتخاب کنند.

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "github-copilot",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

برخی نقاط پایانی تعبیه‌سازی سازگار با OpenAI پارامتر `encoding_format`
را رد می‌کنند؛ برخی دیگر آن را نادیده می‌گیرند و همیشه `number[]` را برمی‌گردانند. `memory-lancedb`
در درخواست‌ها `encoding_format` را حذف می‌کند و پاسخ‌های آرایهٔ اعشاری یا
float32 کدگذاری‌شده با base64 را می‌پذیرد، بنابراین هر دو شکل پاسخ بدون پیکربندی کار می‌کنند.

### ابعاد

OpenClaw فقط برای `text-embedding-3-small` (1536) و
`text-embedding-3-large` (3072) بُعد داخلی دارد. هر مدل دیگری به یک
`embedding.dimensions` صریح نیاز دارد تا LanceDB بتواند ستون بردار را ایجاد کند؛ برای مثال،
مدل ZhiPu ‏`embedding-3` با 2048 بُعد:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            apiKey: "${ZHIPU_API_KEY}",
            baseUrl: "https://open.bigmodel.cn/api/paas/v4",
            model: "embedding-3",
            dimensions: 2048,
          },
        },
      },
    },
  },
}
```

## تعبیه‌سازی‌های Ollama

از مسیر آداپتور ارائه‌دهندهٔ همراه Ollama ‏(`embedding.provider: "ollama"`) استفاده کنید.
این مسیر نقطهٔ پایانی بومی `/api/embed` در Ollama را فراخوانی می‌کند و از همان قواعد احراز هویت/نشانی
پایهٔ ارائه‌دهندهٔ [Ollama](/fa/providers/ollama) پیروی می‌کند.

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "ollama",
            baseUrl: "http://127.0.0.1:11434",
            model: "mxbai-embed-large",
            dimensions: 1024,
          },
          recallMaxChars: 400,
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

`mxbai-embed-large` در جدول ابعاد داخلی نیست، بنابراین `dimensions`
الزامی است. برای مدل‌های کوچک تعبیه‌سازی محلی، اگر سرور
محلی خطاهای طول زمینه برمی‌گرداند، `recallMaxChars` را کاهش دهید.

## محدودیت‌های بازیابی و ثبت

| تنظیم           | پیش‌فرض | بازه                        | کاربرد                                                 |
| ----------------- | ------- | ---------------------------- | ---------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000                    | متنی که برای بازیابی به API تعبیه‌سازی ارسال می‌شود.                 |
| `captureMaxChars` | `500`   | 100-10000                    | طول پیام مجاز برای ثبت خودکار.                  |
| `customTriggers`  | `[]`    | 0-50 مورد، هرکدام <=100 نویسه | عبارت‌های لفظی که باعث می‌شوند ثبت خودکار یک پیام را بررسی کند. |

`recallMaxChars` محدودهٔ پرس‌وجوی بازیابی خودکار `before_prompt_build`،
ابزار `memory_recall`، مسیر پرس‌وجوی `memory_forget` و `openclaw ltm
search` را تعیین می‌کند. بازیابی خودکار، جدیدترین پیام کاربر در نوبت را تعبیه می‌کند و
فقط زمانی که هیچ پیام کاربری وجود نداشته باشد به کل پرامپت بازمی‌گردد؛ در نتیجه فرادادهٔ کانال
و بلوک‌های بزرگ پرامپت از درخواست تعبیه‌سازی خارج می‌مانند.

`captureMaxChars` تعیین می‌کند که آیا پیام کاربری رویداد `agent_end`
نوبت به‌اندازهٔ کافی کوتاه است تا برای ثبت خودکار بررسی شود؛ این تنظیم بر
پرس‌وجوهای بازیابی تأثیری ندارد.

`customTriggers` عبارت‌های لفظی ثبت خودکار را بدون عبارت منظم اضافه می‌کند. محرک‌های
داخلی، عبارت‌های رایج حافظه در زبان‌های انگلیسی، چکی، چینی، ژاپنی و کره‌ای
(`remember`، `prefer`، `记住`، `覚えて`، `기억해` و موارد مشابه) را پوشش می‌دهند.

ثبت خودکار همچنین متنی را که شبیه فرادادهٔ پاکت/انتقال،
بارهای تزریق پرامپت یا زمینهٔ ازپیش تزریق‌شدهٔ `<relevant-memories>` باشد رد می‌کند
و در هر نوبت عامل، حداکثر 3 خاطره ثبت می‌کند.

هر خاطره متعلق به یک عامل است. بازیابی، تشخیص تکراری بودن، ثبت،
فهرست‌کردن، پرس‌وجوهای خام و حذف، همگی پیش از برگرداندن یا
تغییر ردیف‌ها مالک را اعمال می‌کنند. عاملی با `memorySearch.enabled: false` (در `agents.list[]`
یا از طریق `agents.defaults`) هیچ‌یک از ابزارهای `memory_recall`، `memory_store`
یا `memory_forget` را نیز دریافت نمی‌کند و حتی وقتی پرچم‌های `autoRecall`/`autoCapture`
در سطح plugin روشن باشند، در بازیابی یا ثبت خودکار شرکت نمی‌کند.

## فرمان‌ها

`memory-lancedb` هر زمان که نصب باشد فضای نام CLI ‏`ltm` را ثبت می‌کند
(نه فقط زمانی که مالک جایگاه حافظهٔ فعال است):

```bash
openclaw ltm list [--agent <id>] [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--agent <id>] [--limit <n>]
openclaw ltm stats [--agent <id>]
```

`ltm query` یک پرس‌وجوی غیربرداری را مستقیماً روی جدول LanceDB اجرا می‌کند:

```bash
openclaw ltm query --agent research --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| پرچم                              | پیش‌فرض                                 | توضیحات                                                                                                                                     |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--agent <id>`                    | عامل پیش‌فرض پیکربندی‌شده                | فضای نام خصوصی عامل را انتخاب می‌کند. در `list`، `search`، `query` و `stats` در دسترس است.                                                 |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | فهرست مجاز ستون‌ها با جداکنندهٔ ویرگول.                                                                                                         |
| `--filter <condition>`            | هیچ‌کدام                                    | یک مقایسه روی یک ستون خروجی، مانند `category = 'preference'` یا `importance >= 0.8`. مقادیر رشته‌ای باید درون نقل‌قول قرار گیرند.             |
| `--limit <n>`                     | `10`                                    | عدد صحیح مثبت.                                                                                                                         |
| `--order-by <column>:<asc\|desc>` | هیچ‌کدام                                    | پس از اجرای فیلتر در حافظه مرتب می‌شود؛ ستون مرتب‌سازی به‌طور خودکار به تصویر افزوده و اگر درخواست نشده باشد از خروجی حذف می‌شود. |

عامل‌ها سه ابزار را از plugin حافظهٔ فعال دریافت می‌کنند:

- `memory_recall`: جست‌وجوی برداری در خاطرات ذخیره‌شده.
- `memory_store`: ذخیرهٔ یک واقعیت، ترجیح، تصمیم یا موجودیت (متنی را که
  شبیه بار تزریق پرامپت باشد رد می‌کند؛ ذخیره‌سازی موارد تقریباً تکراری را نادیده می‌گیرد).
- `memory_forget`: حذف بر اساس `memoryId` یا `query` (یک
  تطابق با امتیاز بالاتر از 90% را خودکار حذف می‌کند؛ در غیر این صورت شناسه‌های نامزد را برای رفع ابهام فهرست می‌کند).

## ذخیره‌سازی

داده‌های LanceDB به‌طور پیش‌فرض در `~/.openclaw/memory/lancedb` قرار می‌گیرند. با `dbPath` آن را تغییر دهید:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "~/.openclaw/memory/lancedb",
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

این plugin یک جدول LanceDB نگه می‌دارد و مالک نرمال‌شدهٔ عامل را در هر
ردیف ذخیره می‌کند. این یک مرز ذخیره‌سازی است، نه فیلتری پس از جست‌وجو: مالکیت عامل
پیش از رتبه‌بندی برداری اعمال می‌شود و در گزاره‌های فهرست، پرس‌وجو، شمارش و حذف
گنجانده شده است. `ltm query --filter` یک مقایسهٔ اعتبارسنجی‌شده روی
ستون‌های عمومی خروجی می‌پذیرد. مخزن آن مقایسه را جدا از
گزارهٔ اجباری مالک می‌سازد، بنابراین یک فیلتر نمی‌تواند دامنهٔ پرس‌وجو را به عامل
دیگری گسترش دهد.

پایگاه‌های داده‌ای که پیش از مالکیت به‌ازای هر عامل ایجاد شده‌اند، منشأ قابل‌اعتمادی برای ردیف‌ها ندارند.
هنگام ارتقا، `openclaw doctor --fix` آن ردیف‌های قدیمی را یک‌بار به
عامل پیش‌فرض پیکربندی‌شده اختصاص می‌دهد. دسترسی زمان اجرا تا تکمیل آن مهاجرت
به‌صورت بسته شکست می‌خورد؛ عامل‌های دیگر هرگز ردیف‌های اشتراکی قدیمی را به ارث نمی‌برند.

`storageOptions` جفت‌های کلید/مقدار رشته‌ای را برای بک‌اندهای ذخیره‌سازی LanceDB
(برای مثال، ذخیره‌سازی شیء سازگار با S3) می‌پذیرد و از بسط `${ENV_VAR}` پشتیبانی می‌کند:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "s3://memory-bucket/openclaw",
          storageOptions: {
            access_key: "${AWS_ACCESS_KEY_ID}",
            secret_key: "${AWS_SECRET_ACCESS_KEY}",
            endpoint: "${AWS_ENDPOINT_URL}",
          },
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

## وابستگی‌های زمان اجرا و پشتیبانی از پلتفرم‌ها

`memory-lancedb` به بسته بومی `@lancedb/lancedb` وابسته است که مالکیت آن با
بسته Plugin است (نه توزیع هسته OpenClaw). راه‌اندازی Gateway وابستگی‌های
Plugin را ترمیم نمی‌کند؛ اگر وابستگی بومی وجود ندارد یا بارگذاری آن ناموفق است،
بسته Plugin را دوباره نصب یا به‌روزرسانی کنید و Gateway را مجدداً راه‌اندازی کنید.

`@lancedb/lancedb` برای `darwin-x64` (Mac مبتنی بر Intel) بیلد بومی
منتشر نمی‌کند. در آن پلتفرم، Plugin هنگام بارگذاری ثبت می‌کند که LanceDB
در دسترس نیست؛ از بک‌اند پیش‌فرض حافظه استفاده کنید، Gateway را روی
پلتفرم/معماری پشتیبانی‌شده اجرا کنید، یا `memory-lancedb` را غیرفعال کنید.

## عیب‌یابی

### طول ورودی از طول زمینه فراتر می‌رود

مدل تعبیه‌سازی، پرس‌وجوی بازیابی را رد کرد:

```text
memory-lancedb: بازیابی ناموفق بود: خطا: 400 طول ورودی از طول زمینه فراتر می‌رود
```

مقدار `recallMaxChars` را کاهش دهید، سپس Gateway را مجدداً راه‌اندازی کنید:

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        config: {
          recallMaxChars: 400,
        },
      },
    },
  },
}
```

برای Ollama، همچنین با استفاده از نقطه پایانی بومی تعبیه‌سازی آن بررسی کنید که سرور
تعبیه‌سازی از میزبان Gateway قابل دسترسی باشد:

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### مدل تعبیه‌سازی پشتیبانی‌نشده

بدون `embedding.dimensions`، فقط ابعاد تعبیه‌سازی داخلی OpenAI
شناخته‌شده‌اند (`text-embedding-3-small`، `text-embedding-3-large`). برای هر مدل
دیگر، `embedding.dimensions` را روی اندازه برداری تنظیم کنید که آن مدل گزارش می‌دهد.

### Plugin بارگذاری می‌شود، اما هیچ حافظه‌ای ظاهر نمی‌شود

تأیید کنید که `plugins.slots.memory` به `memory-lancedb` اشاره می‌کند، سپس اجرا کنید:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

اگر `autoCapture` غیرفعال باشد، Plugin همچنان حافظه‌های موجود را بازیابی می‌کند،
اما موارد جدید را به‌طور خودکار ذخیره نمی‌کند. از ابزار `memory_store` استفاده کنید،
یا `autoCapture` را فعال کنید.

## مرتبط

- [نمای کلی حافظه](/fa/concepts/memory)
- [Active Memory](/fa/concepts/active-memory)
- [جست‌وجوی حافظه](/fa/concepts/memory-search)
- [ویکی حافظه](/fa/plugins/memory-wiki)
- [Ollama](/fa/providers/ollama)

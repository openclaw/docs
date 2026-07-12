---
read_when:
    - در حال پیکربندی Plugin حافظهٔ LanceDB هستید
    - شما حافظهٔ بلندمدت مبتنی بر LanceDB با یادآوری یا ثبت خودکار می‌خواهید
    - شما از امبدینگ‌های محلیِ سازگار با OpenAI، مانند Ollama، استفاده می‌کنید
sidebarTitle: Memory LanceDB
summary: Plugin رسمی و خارجی حافظهٔ LanceDB را، از جمله تعبیه‌سازی‌های محلی سازگار با Ollama، پیکربندی کنید
title: حافظه LanceDB
x-i18n:
    generated_at: "2026-07-12T10:26:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cdcf5ef7b7fbb8bf6055363d86782cfa36df193fc724406dba06c1380fd9f434
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` یک Plugin خارجی رسمی است که حافظهٔ بلندمدت را با قابلیت جست‌وجوی برداری در
LanceDB ذخیره می‌کند. این Plugin می‌تواند پیش از نوبت مدل، حافظه‌های مرتبط را به‌طور خودکار
بازیابی کند و پس از پاسخ، واقعیت‌های مهم را به‌طور خودکار ثبت کند.

از آن برای یک پایگاه دادهٔ برداری محلی، یک نقطهٔ پایانی تعبیه‌سازی سازگار با OpenAI، یا
یک مخزن حافظه خارج از زیرسامانهٔ پیش‌فرض و داخلی حافظه استفاده کنید.

## نصب

```bash
openclaw plugins install @openclaw/memory-lancedb
```

این Plugin در npm منتشر می‌شود و در تصویر زمان اجرای OpenClaw گنجانده نشده است.
نصب آن ورودی Plugin را می‌نویسد، فعالش می‌کند و
`plugins.slots.memory` را به `memory-lancedb` تغییر می‌دهد. اگر اکنون Plugin دیگری
مالک شکاف حافظه باشد، آن Plugin همراه با یک هشدار غیرفعال می‌شود.

<Note>
Pluginهای همراه مانند `memory-wiki` می‌توانند در کنار `memory-lancedb` اجرا شوند،
اما در هر لحظه فقط یک Plugin مالک شکاف حافظهٔ فعال است.
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

پس از تغییر پیکربندی Plugin، Gateway را راه‌اندازی مجدد کنید و سپس بارگذاری آن را بررسی کنید:

```bash
openclaw gateway restart
openclaw plugins list
```

## پیکربندی تعبیه‌سازی

`embedding` الزامی است و باید دست‌کم یک فیلد داشته باشد. مقدار پیش‌فرض `provider`
برابر `openai` و مقدار پیش‌فرض `model` برابر `text-embedding-3-small` است.

| فیلد                   | نوع           | توضیحات                                                                  |
| ---------------------- | ------------- | ------------------------------------------------------------------------ |
| `embedding.provider`   | رشته          | شناسهٔ آداپتور، مانند `openai`، `github-copilot`، `ollama`. پیش‌فرض `openai`. |
| `embedding.model`      | رشته          | پیش‌فرض `text-embedding-3-small`.                                        |
| `embedding.apiKey`     | رشته          | اختیاری؛ از گسترش `${ENV_VAR}` پشتیبانی می‌کند.                           |
| `embedding.baseUrl`    | رشته          | اختیاری؛ از گسترش `${ENV_VAR}` پشتیبانی می‌کند.                           |
| `embedding.dimensions` | عدد صحیح (>=1) | برای مدل‌هایی که در جدول داخلی نیستند الزامی است (پایین را ببینید).       |

دو مسیر درخواست وجود دارد:

- **مسیر آداپتور ارائه‌دهنده** (پیش‌فرض): `embedding.provider` را تنظیم و
  `embedding.apiKey`/`embedding.baseUrl` را حذف کنید. Plugin نمایهٔ احراز هویت
  پیکربندی‌شدهٔ ارائه‌دهنده، متغیر محیطی، یا
  `models.providers.<provider>.apiKey` را از طریق همان آداپتورهای تعبیه‌سازی حافظه‌ای
  که `memory-core` استفاده می‌کند، برطرف می‌کند. این مسیر برای `github-copilot`، `ollama`
  و هر ارائه‌دهندهٔ همراه دیگری است که از تعبیه‌سازی پشتیبانی می‌کند.
- **مسیر مستقیم کلاینت سازگار با OpenAI**: `embedding.provider` را تنظیم‌نشده
  باقی بگذارید (یا روی `"openai"` تنظیم کنید) و `embedding.apiKey` به‌همراه
  `embedding.baseUrl` را تنظیم کنید. از این مسیر برای یک نقطهٔ پایانی خام تعبیه‌سازی
  سازگار با OpenAI استفاده کنید که آداپتور ارائه‌دهندهٔ همراه ندارد.

OAuth مربوط به OpenAI Codex / ChatGPT اعتبارنامهٔ تعبیه‌سازی OpenAI Platform نیست.
برای تعبیه‌سازی‌های OpenAI از نمایهٔ احراز هویت کلید API متعلق به OpenAI،
`OPENAI_API_KEY`، یا `models.providers.openai.apiKey` استفاده کنید. کاربرانی که فقط
OAuth دارند باید ارائه‌دهندهٔ دیگری با قابلیت تعبیه‌سازی، مانند `github-copilot`
یا `ollama` را انتخاب کنند.

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

برخی نقاط پایانی تعبیه‌سازی سازگار با OpenAI پارامتر `encoding_format` را رد می‌کنند؛
برخی دیگر آن را نادیده می‌گیرند و همیشه `number[]` برمی‌گردانند. `memory-lancedb`
در درخواست‌ها `encoding_format` را حذف می‌کند و پاسخ‌های آرایهٔ اعشاری یا
float32 کدگذاری‌شده با base64 را می‌پذیرد؛ بنابراین هر دو شکل پاسخ بدون پیکربندی کار می‌کنند.

### ابعاد

OpenClaw فقط برای `text-embedding-3-small` (1536) و
`text-embedding-3-large` (3072) ابعاد داخلی دارد. هر مدل دیگری به
`embedding.dimensions` صریح نیاز دارد تا LanceDB بتواند ستون برداری را ایجاد کند؛
برای نمونه، `embedding-3` از ZhiPu با 2048 بُعد:

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

از مسیر آداپتور همراه ارائه‌دهندهٔ Ollama استفاده کنید (`embedding.provider: "ollama"`).
این مسیر نقطهٔ پایانی بومی `/api/embed` متعلق به Ollama را فراخوانی می‌کند و از همان
قواعد احراز هویت/نشانی پایهٔ ارائه‌دهندهٔ [Ollama](/fa/providers/ollama) پیروی می‌کند.

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

`mxbai-embed-large` در جدول داخلی ابعاد نیست، بنابراین `dimensions`
الزامی است. برای مدل‌های کوچک تعبیه‌سازی محلی، اگر سرور محلی خطاهای طول زمینه
برمی‌گرداند، مقدار `recallMaxChars` را کاهش دهید.

## محدودیت‌های بازیابی و ثبت

| تنظیم              | پیش‌فرض | محدوده                         | کاربرد                                                       |
| ------------------ | ------- | ------------------------------ | ------------------------------------------------------------ |
| `recallMaxChars`   | `1000`  | 100-10000                      | متن ارسالی به API تعبیه‌سازی برای بازیابی.                    |
| `captureMaxChars`  | `500`   | 100-10000                      | طول پیام واجد شرایط برای ثبت خودکار.                          |
| `customTriggers`   | `[]`    | 0-50 مورد، هرکدام <=100 نویسه | عبارت‌های تحت‌اللفظی که باعث بررسی پیام برای ثبت خودکار می‌شوند. |

`recallMaxChars` اندازهٔ پرس‌وجوی بازیابی خودکار `before_prompt_build`،
ابزار `memory_recall`، مسیر پرس‌وجوی `memory_forget` و `openclaw ltm
search` را محدود می‌کند. بازیابی خودکار، جدیدترین پیام کاربر در نوبت را تعبیه می‌کند
و فقط وقتی هیچ پیام کاربری وجود ندارد، از کل پرامپت استفاده می‌کند؛ در نتیجه فرادادهٔ
کانال و بلوک‌های بزرگ پرامپت از درخواست تعبیه‌سازی کنار گذاشته می‌شوند.

`captureMaxChars` تعیین می‌کند که آیا پیام کاربر از رویداد `agent_end` نوبت
برای بررسی جهت ثبت خودکار به‌اندازهٔ کافی کوتاه است یا نه؛ این تنظیم بر پرس‌وجوهای
بازیابی اثری ندارد.

`customTriggers` عبارت‌های تحت‌اللفظی ثبت خودکار را بدون عبارت منظم اضافه می‌کند.
محرک‌های داخلی، عبارت‌های رایج حافظه در زبان‌های انگلیسی، چکی، چینی، ژاپنی و کره‌ای
(`remember`، `prefer`، `记住`، `覚えて`، `기억해` و موارد مشابه) را پوشش می‌دهند.

ثبت خودکار همچنین متن‌هایی را که شبیه فرادادهٔ پوش/انتقال، محتوای تزریق پرامپت،
یا زمینهٔ ازپیش‌تزریق‌شدهٔ `<relevant-memories>` هستند رد می‌کند و در هر نوبت عامل،
حداکثر ۳ حافظه را ثبت می‌کند.

## فرمان‌ها

هرگاه `memory-lancedb` نصب باشد، فضای نام CLI با نام `ltm` را ثبت می‌کند
(نه فقط زمانی که مالک شکاف حافظهٔ فعال است):

```bash
openclaw ltm list [--limit <n>] [--order-by-created-at]
openclaw ltm search <query> [--limit <n>]
openclaw ltm stats
```

`ltm query` یک پرس‌وجوی غیربرداری را مستقیماً روی جدول LanceDB اجرا می‌کند:

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

| پرچم                              | پیش‌فرض                                 | توضیحات                                                                                                                                              |
| --------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--cols <columns>`                | `id,text,importance,category,createdAt` | فهرست مجاز ستون‌ها با جداکنندهٔ ویرگول.                                                                                                               |
| `--filter <condition>`            | هیچ‌کدام                                | عبارت WHERE به سبک SQL. حداکثر ۲۰۰ نویسه؛ فقط حروف و اعداد، `_-`، فاصله و `='"<>!.,()%*` مجاز هستند.                                                 |
| `--limit <n>`                     | `10`                                    | عدد صحیح مثبت.                                                                                                                                       |
| `--order-by <column>:<asc\|desc>` | هیچ‌کدام                                | پس از اجرای فیلتر در حافظه مرتب می‌شود؛ ستون مرتب‌سازی به‌طور خودکار به تصویرسازی افزوده و اگر درخواست نشده باشد، از خروجی حذف می‌شود.                |

عامل‌ها سه ابزار را از Plugin حافظهٔ فعال دریافت می‌کنند:

- `memory_recall`: جست‌وجوی برداری در حافظه‌های ذخیره‌شده.
- `memory_store`: ذخیرهٔ یک واقعیت، ترجیح، تصمیم یا موجودیت (متنی را که شبیه
  محتوای تزریق پرامپت باشد رد می‌کند و از ذخیرهٔ موارد تقریباً تکراری صرف‌نظر می‌کند).
- `memory_forget`: حذف بر اساس `memoryId` یا `query` (اگر یک تطابق با امتیاز
  بیش از ۹۰٪ وجود داشته باشد، آن را خودکار حذف می‌کند؛ در غیر این صورت شناسه‌های
  نامزد را برای رفع ابهام فهرست می‌کند).

## ذخیره‌سازی

داده‌های LanceDB به‌طور پیش‌فرض در `~/.openclaw/memory/lancedb` قرار می‌گیرند.
با `dbPath` آن را بازنویسی کنید:

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

`storageOptions` جفت‌های کلید/مقدار رشته‌ای را برای زیرسامانه‌های ذخیره‌سازی LanceDB
(مانند ذخیره‌سازی شیء سازگار با S3) می‌پذیرد و از گسترش `${ENV_VAR}` پشتیبانی می‌کند:

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

## وابستگی‌های زمان اجرا و پشتیبانی از پلتفرم

`memory-lancedb` به بستهٔ بومی `@lancedb/lancedb` وابسته است که مالکیت آن با
بستهٔ Plugin است (نه توزیع هستهٔ OpenClaw). راه‌اندازی Gateway وابستگی‌های
Plugin را ترمیم نمی‌کند؛ اگر وابستگی بومی موجود نباشد یا بارگذاری آن شکست بخورد،
بستهٔ Plugin را دوباره نصب یا به‌روزرسانی کنید و Gateway را راه‌اندازی مجدد کنید.

`@lancedb/lancedb` ساخت بومی برای `darwin-x64` (مک Intel) منتشر نمی‌کند.
در آن پلتفرم، Plugin هنگام بارگذاری ثبت می‌کند که LanceDB در دسترس نیست؛
از زیرسامانهٔ پیش‌فرض حافظه استفاده کنید، Gateway را روی پلتفرم/معماری پشتیبانی‌شده
اجرا کنید، یا `memory-lancedb` را غیرفعال کنید.

## عیب‌یابی

### طول ورودی از طول زمینه بیشتر است

مدل تعبیه‌سازی، پرس‌وجوی بازیابی را رد کرده است:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

مقدار `recallMaxChars` را کاهش دهید، سپس Gateway را راه‌اندازی مجدد کنید:

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

برای Ollama، همچنین بررسی کنید که سرور تعبیه‌سازی از میزبان Gateway و از طریق
نقطهٔ پایانی بومی تعبیه‌سازی آن قابل دسترسی باشد:

```bash
curl http://127.0.0.1:11434/api/embed \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### مدل تعبیه‌سازی پشتیبانی‌نشده

بدون `embedding.dimensions`، فقط ابعاد داخلی تعبیه‌سازی OpenAI شناخته می‌شوند
(`text-embedding-3-small`، `text-embedding-3-large`). برای هر مدل دیگری،
`embedding.dimensions` را روی اندازهٔ برداری که آن مدل گزارش می‌کند تنظیم کنید.

### Plugin بارگذاری می‌شود، اما هیچ حافظه‌ای ظاهر نمی‌شود

تأیید کنید که `plugins.slots.memory` به `memory-lancedb` اشاره می‌کند، سپس اجرا کنید:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

اگر `autoCapture` غیرفعال باشد، Plugin همچنان حافظه‌های موجود را بازیابی می‌کند، اما
حافظه‌های جدید را به‌طور خودکار ذخیره نمی‌کند. از ابزار `memory_store` استفاده کنید یا
`autoCapture` را فعال کنید.

## مرتبط

- [نمای کلی حافظه](/fa/concepts/memory)
- [Active Memory](/fa/concepts/active-memory)
- [جست‌وجوی حافظه](/fa/concepts/memory-search)
- [ویکی حافظه](/fa/plugins/memory-wiki)
- [Ollama](/fa/providers/ollama)

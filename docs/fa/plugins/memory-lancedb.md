---
read_when:
    - در حال پیکربندی Plugin memory-lancedb هستید
    - شما حافظهٔ بلندمدت مبتنی بر LanceDB با بازیابی خودکار یا ثبت خودکار می‌خواهید.
    - شما از embeddingهای محلی سازگار با OpenAI مانند Ollama استفاده می‌کنید
sidebarTitle: Memory LanceDB
summary: افزونه رسمی و خارجی حافظه LanceDB را پیکربندی کنید، شامل نهفته‌سازی‌های محلی سازگار با Ollama
title: Memory LanceDB
x-i18n:
    generated_at: "2026-06-27T18:18:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4142a755e788418a8b9c64a6ff3a8ce3c520bd6be09b685929478ae0754f7d39
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` یک Plugin رسمی خارجی برای حافظه است که حافظه بلندمدت را در
LanceDB ذخیره می‌کند و برای بازیابی از embeddingها استفاده می‌کند. این Plugin می‌تواند به‌طور خودکار حافظه‌های مرتبط را
پیش از نوبت مدل بازیابی کند و پس از پاسخ، واقعیت‌های مهم را ثبت کند.

زمانی از آن استفاده کنید که یک پایگاه‌داده برداری محلی برای حافظه می‌خواهید، به یک
نقطه پایانی embedding سازگار با OpenAI نیاز دارید، یا می‌خواهید پایگاه‌داده حافظه را بیرون از
ذخیره‌ساز حافظه داخلی پیش‌فرض نگه دارید.

## نصب

پیش از تنظیم `plugins.slots.memory = "memory-lancedb"`، `memory-lancedb` را نصب کنید:

```bash
openclaw plugins install @openclaw/memory-lancedb
```

این Plugin در npm منتشر شده و در تصویر زمان اجرای OpenClaw بسته‌بندی نشده است.
نصب‌کننده ورودی Plugin را می‌نویسد و وقتی هیچ Plugin دیگری مالک آن نیست،
slot حافظه را تغییر می‌دهد.

<Note>
`memory-lancedb` یک Plugin مربوط به Active Memory است. با انتخاب slot حافظه با
`plugins.slots.memory = "memory-lancedb"` آن را فعال کنید. Pluginهای همراه مانند
`memory-wiki` می‌توانند در کنار آن اجرا شوند، اما فقط یک Plugin مالک slot مربوط به Active Memory است.
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

پس از تغییر پیکربندی Plugin، Gateway را راه‌اندازی دوباره کنید:

```bash
openclaw gateway restart
```

سپس بررسی کنید Plugin بارگذاری شده است:

```bash
openclaw plugins list
```

## embeddingهای پشتیبانی‌شده توسط ارائه‌دهنده

`memory-lancedb` می‌تواند از همان adapterهای ارائه‌دهنده embedding حافظه استفاده کند که
`memory-core` استفاده می‌کند. `embedding.provider` را تنظیم کنید و `embedding.apiKey` را حذف کنید تا از
نمایه احراز هویت پیکربندی‌شده ارائه‌دهنده، متغیر محیطی، یا
`models.providers.<provider>.apiKey` استفاده شود.

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
        },
      },
    },
  },
}
```

این مسیر با نمایه‌های احراز هویت ارائه‌دهنده که اعتبارنامه‌های embedding را در اختیار می‌گذارند کار می‌کند.
برای مثال، وقتی نمایه/طرح Copilot از embeddingها پشتیبانی کند، می‌توان از GitHub Copilot استفاده کرد:

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
            provider: "github-copilot",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

OpenAI Codex / ChatGPT OAuth یک اعتبارنامه embedding برای OpenAI Platform نیست.
برای embeddingهای OpenAI، از نمایه احراز هویت کلید API OpenAI،
`OPENAI_API_KEY`، یا `models.providers.openai.apiKey` استفاده کنید. کاربران فقط-OAuth می‌توانند از
ارائه‌دهنده دیگری که توانایی embedding دارد، مانند GitHub Copilot یا Ollama استفاده کنند.

## embeddingهای Ollama

برای embeddingهای Ollama، ارائه‌دهنده embedding بسته‌بندی‌شده Ollama را ترجیح دهید. این ارائه‌دهنده از
نقطه پایانی بومی Ollama `/api/embed` استفاده می‌کند و از همان قواعد احراز هویت/URL پایه پیروی می‌کند که
برای ارائه‌دهنده Ollama در [Ollama](/fa/providers/ollama) مستند شده است.

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

برای مدل‌های embedding غیراستاندارد، `dimensions` را تنظیم کنید. OpenClaw
ابعاد `text-embedding-3-small` و `text-embedding-3-large` را می‌شناسد؛ مدل‌های سفارشی
به این مقدار در پیکربندی نیاز دارند تا LanceDB بتواند ستون برداری را بسازد.

برای مدل‌های embedding محلی کوچک، اگر خطاهای طول context را از سرور محلی می‌بینید،
`recallMaxChars` را کاهش دهید.

## ارائه‌دهندگان سازگار با OpenAI

برخی ارائه‌دهندگان embedding سازگار با OpenAI پارامتر `encoding_format` را رد می‌کنند،
درحالی‌که برخی دیگر آن را نادیده می‌گیرند و همیشه بردارهای `number[]` برمی‌گردانند.
بنابراین `memory-lancedb` در درخواست‌های embedding، `encoding_format` را حذف می‌کند و
هم پاسخ‌های آرایه float و هم پاسخ‌های float32 کدگذاری‌شده با base64 را می‌پذیرد.

اگر یک نقطه پایانی خام embedding سازگار با OpenAI دارید که
adapter ارائه‌دهنده بسته‌بندی‌شده ندارد، `embedding.provider` را حذف کنید (یا آن را به صورت `openai` باقی بگذارید) و
`embedding.apiKey` را همراه با `embedding.baseUrl` تنظیم کنید. این کار مسیر مستقیم
کلاینت سازگار با OpenAI را حفظ می‌کند.

برای ارائه‌دهندگانی که ابعاد مدلشان داخلی تعریف نشده است، `embedding.dimensions` را تنظیم کنید.
برای مثال، ZhiPu `embedding-3` از ابعاد `2048` استفاده می‌کند:

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

## محدودیت‌های بازیابی و ثبت

`memory-lancedb` دو محدودیت متنی جداگانه دارد:

| تنظیمات           | پیش‌فرض | بازه     | اعمال می‌شود به                                                |
| ----------------- | ------- | --------- | --------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000 | متنی که برای بازیابی به API embedding فرستاده می‌شود                 |
| `captureMaxChars` | `500`   | 100-10000 | طول پیامی که برای ثبت خودکار واجد شرایط است                  |
| `customTriggers`  | `[]`    | 0-50      | عبارت‌های لفظی که باعث می‌شوند ثبت خودکار یک پیام را بررسی کند |

`recallMaxChars` بازیابی خودکار، ابزار `memory_recall`،
مسیر پرس‌وجوی `memory_forget`، و `openclaw ltm search` را کنترل می‌کند. بازیابی خودکار
آخرین پیام کاربر از نوبت را ترجیح می‌دهد و فقط وقتی هیچ پیام کاربری در دسترس نباشد
به prompt کامل برمی‌گردد. این کار فراداده کانال و بلوک‌های بزرگ prompt را
از درخواست embedding بیرون نگه می‌دارد.

`captureMaxChars` کنترل می‌کند که آیا یک پاسخ به اندازه کافی کوتاه هست که برای
ثبت خودکار بررسی شود. این مقدار embeddingهای پرس‌وجوی بازیابی را محدود نمی‌کند.

`customTriggers` به شما اجازه می‌دهد بدون نوشتن
عبارت‌های منظم، عبارت‌های لفظی ثبت خودکار اضافه کنید. triggerهای داخلی شامل عبارت‌های رایج حافظه به انگلیسی، چکی،
چینی، ژاپنی و کره‌ای هستند.

## دستورها

وقتی `memory-lancedb` Plugin مربوط به Active Memory باشد، فضای نام CLI به نام `ltm` را ثبت می‌کند:

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

زیر‌دستور `query` یک پرس‌وجوی غیربرداری را مستقیما روی جدول LanceDB اجرا می‌کند:

```bash
openclaw ltm query --cols id,text,createdAt --limit 20
openclaw ltm query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: فهرست مجاز ستون‌ها، جداشده با ویرگول (پیش‌فرض `id`، `text`، `importance`، `category`، `createdAt`).
- `--filter <condition>`: عبارت WHERE به سبک SQL؛ به 200 نویسه محدود شده و به نویسه‌های الفبایی‌عددی، عملگرهای مقایسه، نقل‌قول‌ها، پرانتزها، و مجموعه کوچکی از نشانه‌گذاری امن محدود است.
- `--limit <n>`: عدد صحیح مثبت؛ پیش‌فرض `10`.
- `--order-by <column>:<asc|desc>`: مرتب‌سازی درون‌حافظه‌ای که پس از filter اعمال می‌شود؛ ستون مرتب‌سازی به‌طور خودکار در projection گنجانده می‌شود.

عامل‌ها همچنین ابزارهای حافظه LanceDB را از Plugin مربوط به Active Memory دریافت می‌کنند:

- `memory_recall` برای بازیابی پشتیبانی‌شده با LanceDB
- `memory_store` برای ذخیره واقعیت‌های مهم، ترجیحات، تصمیم‌ها، و موجودیت‌ها
- `memory_forget` برای حذف حافظه‌های مطابق

## ذخیره‌سازی

به‌طور پیش‌فرض، داده‌های LanceDB زیر `~/.openclaw/memory/lancedb` قرار می‌گیرند. مسیر را با
`dbPath` بازنویسی کنید:

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

`storageOptions` جفت‌های کلید/مقدار رشته‌ای را برای backendهای ذخیره‌سازی LanceDB می‌پذیرد و
از گسترش `${ENV_VAR}` پشتیبانی می‌کند:

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

## وابستگی‌های زمان اجرا

`memory-lancedb` به بسته بومی `@lancedb/lancedb` وابسته است. OpenClaw بسته‌بندی‌شده
آن بسته را بخشی از بسته Plugin در نظر می‌گیرد. راه‌اندازی Gateway
وابستگی‌های Plugin را تعمیر نمی‌کند؛ اگر وابستگی وجود ندارد، بسته Plugin را دوباره نصب یا
به‌روزرسانی کنید و Gateway را راه‌اندازی دوباره کنید.

اگر یک نصب قدیمی هنگام بارگذاری Plugin خطای نبودن `dist/package.json` یا نبودن
`@lancedb/lancedb` را ثبت کرد، OpenClaw را ارتقا دهید و Gateway را راه‌اندازی دوباره کنید.

اگر Plugin ثبت کند که LanceDB روی `darwin-x64` در دسترس نیست، از backend حافظه پیش‌فرض
روی همان ماشین استفاده کنید، Gateway را به یک پلتفرم پشتیبانی‌شده منتقل کنید، یا
`memory-lancedb` را غیرفعال کنید.

## عیب‌یابی

### طول ورودی از طول context بیشتر است

این معمولا یعنی مدل embedding پرس‌وجوی بازیابی را رد کرده است:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

`recallMaxChars` را روی مقدار پایین‌تری تنظیم کنید، سپس Gateway را راه‌اندازی دوباره کنید:

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

برای Ollama، همچنین بررسی کنید سرور embedding از میزبان Gateway قابل دسترسی باشد:

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### مدل embedding پشتیبانی‌نشده

بدون `dimensions`، فقط ابعاد embedding داخلی OpenAI شناخته می‌شوند.
برای مدل‌های embedding محلی یا سفارشی، `embedding.dimensions` را روی اندازه برداری
گزارش‌شده توسط آن مدل تنظیم کنید.

### Plugin بارگذاری می‌شود اما هیچ حافظه‌ای ظاهر نمی‌شود

بررسی کنید `plugins.slots.memory` به `memory-lancedb` اشاره کند، سپس اجرا کنید:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

اگر `autoCapture` غیرفعال باشد، Plugin حافظه‌های موجود را بازیابی می‌کند اما
حافظه‌های جدید را به‌طور خودکار ذخیره نمی‌کند. اگر ثبت خودکار می‌خواهید، از ابزار
`memory_store` استفاده کنید یا `autoCapture` را فعال کنید.

## مرتبط

- [نمای کلی حافظه](/fa/concepts/memory)
- [Active Memory](/fa/concepts/active-memory)
- [جست‌وجوی حافظه](/fa/concepts/memory-search)
- [Memory Wiki](/fa/plugins/memory-wiki)
- [Ollama](/fa/providers/ollama)

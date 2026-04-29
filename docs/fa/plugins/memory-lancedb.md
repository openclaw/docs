---
read_when:
    - شما در حال پیکربندی Plugin همراه memory-lancedb هستید
    - شما حافظهٔ بلندمدت مبتنی بر LanceDB با فراخوانی خودکار یا ثبت خودکار می‌خواهید
    - شما از امبدینگ‌های محلی سازگار با OpenAI مانند Ollama استفاده می‌کنید
sidebarTitle: Memory LanceDB
summary: Plugin حافظهٔ همراه LanceDB را، شامل نهفته‌سازی‌های محلی سازگار با Ollama، پیکربندی کنید
title: حافظه LanceDB
x-i18n:
    generated_at: "2026-04-29T23:15:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: bda53528857a492f1627f655e49be6775e0114115781371ff67debb155b7e731
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` یک Plugin حافظهٔ همراه است که حافظهٔ بلندمدت را در
LanceDB ذخیره می‌کند و برای بازیابی از تعبیه‌ها استفاده می‌کند. این Plugin می‌تواند پیش از نوبت مدل، حافظه‌های مرتبط را به‌طور خودکار بازیابی کند و پس از پاسخ، واقعیت‌های مهم را ثبت کند.

وقتی از آن استفاده کنید که یک پایگاه‌دادهٔ برداری محلی برای حافظه می‌خواهید، به یک نقطهٔ پایانی تعبیهٔ سازگار با OpenAI نیاز دارید، یا می‌خواهید پایگاه‌دادهٔ حافظه را خارج از ذخیره‌گاه حافظهٔ داخلی پیش‌فرض نگه دارید.

<Note>
`memory-lancedb` یک Plugin حافظهٔ فعال است. آن را با انتخاب اسلات حافظه از طریق `plugins.slots.memory = "memory-lancedb"` فعال کنید. Pluginهای همراه مانند `memory-wiki` می‌توانند در کنار آن اجرا شوند، اما فقط یک Plugin مالک اسلات حافظهٔ فعال است.
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

پس از تغییر پیکربندی Plugin، Gateway را راه‌اندازی مجدد کنید:

```bash
openclaw gateway restart
```

سپس بررسی کنید که Plugin بارگذاری شده است:

```bash
openclaw plugins list
```

## تعبیه‌های پشتیبانی‌شده با ارائه‌دهنده

`memory-lancedb` می‌تواند از همان آداپتورهای ارائه‌دهندهٔ تعبیهٔ حافظه استفاده کند که
`memory-core` استفاده می‌کند. `embedding.provider` را تنظیم کنید و `embedding.apiKey` را حذف کنید تا از پروفایل احراز هویت پیکربندی‌شدهٔ ارائه‌دهنده، متغیر محیطی، یا
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

این مسیر با پروفایل‌های احراز هویت ارائه‌دهنده که اعتبارنامه‌های تعبیه را در دسترس می‌گذارند کار می‌کند. برای مثال، وقتی پروفایل/طرح Copilot از تعبیه‌ها پشتیبانی کند، می‌توان از GitHub Copilot استفاده کرد:

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

OpenAI Codex / ChatGPT OAuth (`openai-codex`) اعتبارنامهٔ تعبیه‌های OpenAI Platform نیست. برای تعبیه‌های OpenAI، از پروفایل احراز هویت کلید API OpenAI،
`OPENAI_API_KEY`، یا `models.providers.openai.apiKey` استفاده کنید. کاربران فقط-OAuth می‌توانند از ارائه‌دهندهٔ دیگری که از تعبیه پشتیبانی می‌کند، مانند GitHub Copilot یا Ollama، استفاده کنند.

## تعبیه‌های Ollama

برای تعبیه‌های Ollama، ارائه‌دهندهٔ تعبیهٔ Ollama همراه را ترجیح دهید. این ارائه‌دهنده از نقطهٔ پایانی بومی Ollama به نام `/api/embed` استفاده می‌کند و همان قواعد احراز هویت/URL پایه را دنبال می‌کند که برای ارائه‌دهندهٔ Ollama در [Ollama](/fa/providers/ollama) مستند شده‌اند.

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

برای مدل‌های تعبیهٔ غیراستاندارد، `dimensions` را تنظیم کنید. OpenClaw ابعاد
`text-embedding-3-small` و `text-embedding-3-large` را می‌شناسد؛ مدل‌های سفارشی به مقدار آن در پیکربندی نیاز دارند تا LanceDB بتواند ستون برداری را ایجاد کند.

برای مدل‌های تعبیهٔ محلی کوچک، اگر خطاهای طول زمینه را از سرور محلی می‌بینید، مقدار `recallMaxChars` را کاهش دهید.

## ارائه‌دهندگان سازگار با OpenAI

برخی ارائه‌دهندگان تعبیهٔ سازگار با OpenAI پارامتر `encoding_format` را رد می‌کنند، در حالی که برخی دیگر آن را نادیده می‌گیرند و همیشه بردارهای `number[]` برمی‌گردانند.
بنابراین `memory-lancedb` در درخواست‌های تعبیه `encoding_format` را حذف می‌کند و هم پاسخ‌های آرایهٔ عدد اعشاری و هم پاسخ‌های float32 کدگذاری‌شده با base64 را می‌پذیرد.

اگر یک نقطهٔ پایانی خام تعبیهٔ سازگار با OpenAI دارید که آداپتور ارائه‌دهندهٔ همراه ندارد، `embedding.provider` را حذف کنید (یا آن را `openai` بگذارید) و `embedding.apiKey` را همراه با `embedding.baseUrl` تنظیم کنید. این کار مسیر مستقیم کلاینت سازگار با OpenAI را حفظ می‌کند.

برای ارائه‌دهندگانی که ابعاد مدلشان داخلی نیست، `embedding.dimensions` را تنظیم کنید. برای مثال، `embedding-3` متعلق به ZhiPu از `2048` بُعد استفاده می‌کند:

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

| تنظیمات           | پیش‌فرض | بازه     | اعمال می‌شود بر                                    |
| ----------------- | ------- | --------- | --------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000 | متن ارسال‌شده به API تعبیه برای بازیابی     |
| `captureMaxChars` | `500`   | 100-10000 | طول پیام دستیار که برای ثبت واجد شرایط است |

`recallMaxChars` بازیابی خودکار، ابزار `memory_recall`، مسیر پرس‌وجوی
`memory_forget`، و `openclaw ltm search` را کنترل می‌کند. بازیابی خودکار آخرین پیام کاربر از آن نوبت را ترجیح می‌دهد و فقط وقتی هیچ پیام کاربری موجود نباشد به اعلان کامل برمی‌گردد. این کار فرادادهٔ کانال و بلوک‌های بزرگ اعلان را از درخواست تعبیه دور نگه می‌دارد.

`captureMaxChars` کنترل می‌کند که آیا یک پاسخ به‌اندازهٔ کافی کوتاه هست تا برای ثبت خودکار در نظر گرفته شود. این مقدار تعبیه‌های پرس‌وجوی بازیابی را محدود نمی‌کند.

## فرمان‌ها

وقتی `memory-lancedb` Plugin حافظهٔ فعال باشد، فضای نام CLI به نام `ltm` را ثبت می‌کند:

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

این Plugin همچنین `openclaw memory` را با یک زیرفرمان غیر برداری `query` گسترش می‌دهد که مستقیماً روی جدول LanceDB اجرا می‌شود:

```bash
openclaw memory query --cols id,text,createdAt --limit 20
openclaw memory query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: فهرست مجاز ستون‌ها با جداسازی ویرگول (به‌طور پیش‌فرض `id`، `text`، `importance`، `category`، `createdAt`).
- `--filter <condition>`: بند WHERE به سبک SQL؛ به ۲۰۰ نویسه محدود است و به حروف و اعداد، عملگرهای مقایسه، نقل‌قول‌ها، پرانتزها، و مجموعهٔ کوچکی از علائم نگارشی امن محدود می‌شود.
- `--limit <n>`: عدد صحیح مثبت؛ پیش‌فرض `10`.
- `--order-by <column>:<asc|desc>`: مرتب‌سازی درون‌حافظه‌ای که پس از فیلتر اعمال می‌شود؛ ستون مرتب‌سازی به‌طور خودکار در تصویرسازی گنجانده می‌شود.

عامل‌ها نیز ابزارهای حافظهٔ LanceDB را از Plugin حافظهٔ فعال دریافت می‌کنند:

- `memory_recall` برای بازیابی پشتیبانی‌شده با LanceDB
- `memory_store` برای ذخیرهٔ واقعیت‌های مهم، ترجیح‌ها، تصمیم‌ها، و موجودیت‌ها
- `memory_forget` برای حذف حافظه‌های منطبق

## ذخیره‌سازی

به‌طور پیش‌فرض، داده‌های LanceDB زیر `~/.openclaw/memory/lancedb` قرار می‌گیرند. مسیر را با `dbPath` بازنویسی کنید:

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

`storageOptions` جفت‌های کلید/مقدار رشته‌ای را برای بک‌اندهای ذخیره‌سازی LanceDB می‌پذیرد و از گسترش `${ENV_VAR}` پشتیبانی می‌کند:

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

`memory-lancedb` به بستهٔ بومی `@lancedb/lancedb` وابسته است. نصب‌های بسته‌بندی‌شدهٔ
OpenClaw ابتدا وابستگی زمان اجرای همراه را امتحان می‌کنند و وقتی واردسازی همراه در دسترس نباشد، می‌توانند وابستگی زمان اجرای Plugin را زیر وضعیت OpenClaw تعمیر کنند.

اگر یک نصب قدیمی هنگام بارگذاری Plugin خطای نبودن `dist/package.json` یا نبودن
`@lancedb/lancedb` را ثبت می‌کند، OpenClaw را ارتقا دهید و Gateway را راه‌اندازی مجدد کنید.

اگر Plugin ثبت کرد که LanceDB روی `darwin-x64` در دسترس نیست، روی آن دستگاه از بک‌اند حافظهٔ پیش‌فرض استفاده کنید، Gateway را به یک پلتفرم پشتیبانی‌شده منتقل کنید، یا
`memory-lancedb` را غیرفعال کنید.

## عیب‌یابی

### طول ورودی از طول زمینه بیشتر است

این معمولاً یعنی مدل تعبیه، پرس‌وجوی بازیابی را رد کرده است:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

یک `recallMaxChars` کمتر تنظیم کنید، سپس Gateway را راه‌اندازی مجدد کنید:

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

برای Ollama، همچنین بررسی کنید که سرور تعبیه از میزبان Gateway در دسترس باشد:

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### مدل تعبیهٔ پشتیبانی‌نشده

بدون `dimensions`، فقط ابعاد داخلی تعبیهٔ OpenAI شناخته می‌شوند. برای مدل‌های تعبیهٔ محلی یا سفارشی، `embedding.dimensions` را روی اندازهٔ برداری تنظیم کنید که آن مدل گزارش می‌کند.

### Plugin بارگذاری می‌شود اما هیچ حافظه‌ای ظاهر نمی‌شود

بررسی کنید که `plugins.slots.memory` به `memory-lancedb` اشاره می‌کند، سپس اجرا کنید:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

اگر `autoCapture` غیرفعال باشد، Plugin حافظه‌های موجود را بازیابی می‌کند اما حافظه‌های جدید را به‌طور خودکار ذخیره نمی‌کند. اگر ثبت خودکار می‌خواهید، از ابزار `memory_store` استفاده کنید یا `autoCapture` را فعال کنید.

## مرتبط

- [نمای کلی حافظه](/fa/concepts/memory)
- [Active memory](/fa/concepts/active-memory)
- [جست‌وجوی حافظه](/fa/concepts/memory-search)
- [Memory Wiki](/fa/plugins/memory-wiki)
- [Ollama](/fa/providers/ollama)

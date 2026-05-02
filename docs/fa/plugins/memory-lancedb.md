---
read_when:
    - شما در حال پیکربندی Plugin همراهِ memory-lancedb هستید
    - می‌خواهید حافظهٔ بلندمدتِ مبتنی بر LanceDB با یادآوری خودکار یا ثبت خودکار داشته باشید
    - شما از تعبیه‌سازی‌های محلی سازگار با OpenAI مانند Ollama استفاده می‌کنید
sidebarTitle: Memory LanceDB
summary: Plugin حافظهٔ LanceDB همراه را، از جمله تعبیه‌سازی‌های محلی سازگار با Ollama، پیکربندی کنید
title: حافظه LanceDB
x-i18n:
    generated_at: "2026-05-02T11:56:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 671daa20e4f070f9beb0187ff76db9368297b3bc78873ebf3f09ac7ccffa00a2
    source_path: plugins/memory-lancedb.md
    workflow: 16
---

`memory-lancedb` یک Plugin حافظه‌ی bundled است که حافظه‌ی بلندمدت را در
LanceDB ذخیره می‌کند و از embeddingها برای recall استفاده می‌کند. می‌تواند پیش از نوبت مدل، حافظه‌های مرتبط را به‌طور خودکار recall کند و پس از یک پاسخ، facts مهم را capture کند.

وقتی از آن استفاده کنید که یک پایگاه‌داده‌ی برداری محلی برای حافظه می‌خواهید، به یک endpoint embedding سازگار با OpenAI نیاز دارید، یا می‌خواهید پایگاه‌داده‌ی حافظه را بیرون از memory store داخلی پیش‌فرض نگه دارید.

<Note>
`memory-lancedb` یک Plugin حافظه‌ی فعال است. آن را با انتخاب slot حافظه با `plugins.slots.memory = "memory-lancedb"` فعال کنید. Pluginهای همراه مانند `memory-wiki` می‌توانند کنار آن اجرا شوند، اما فقط یک Plugin مالک slot حافظه‌ی فعال است.
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

## embeddingهای پشتیبانی‌شده توسط provider

`memory-lancedb` می‌تواند از همان adapterهای provider embedding حافظه استفاده کند که `memory-core` استفاده می‌کند. `embedding.provider` را تنظیم کنید و `embedding.apiKey` را حذف کنید تا از auth profile پیکربندی‌شده‌ی provider، متغیر محیطی، یا `models.providers.<provider>.apiKey` استفاده شود.

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

این مسیر با auth profileهای provider که credentialهای embedding را ارائه می‌کنند کار می‌کند. برای مثال، وقتی profile/plan مربوط به Copilot از embeddingها پشتیبانی کند، می‌توان از GitHub Copilot استفاده کرد:

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

OpenAI Codex / ChatGPT OAuth (`openai-codex`) یک credential embedding مربوط به OpenAI Platform نیست. برای embeddingهای OpenAI، از یک auth profile با کلید OpenAI API، `OPENAI_API_KEY`، یا `models.providers.openai.apiKey` استفاده کنید. کاربران فقط-OAuth می‌توانند از provider دیگری با قابلیت embedding مانند GitHub Copilot یا Ollama استفاده کنند.

## embeddingهای Ollama

برای embeddingهای Ollama، provider embedding داخلی Ollama را ترجیح دهید. این provider از endpoint بومی Ollama یعنی `/api/embed` استفاده می‌کند و همان قواعد auth/base URL را دنبال می‌کند که برای provider Ollama در [Ollama](/fa/providers/ollama) مستند شده‌اند.

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

برای مدل‌های embedding غیراستاندارد، `dimensions` را تنظیم کنید. OpenClaw ابعاد `text-embedding-3-small` و `text-embedding-3-large` را می‌داند؛ مدل‌های سفارشی به مقدار در پیکربندی نیاز دارند تا LanceDB بتواند ستون برداری را ایجاد کند.

برای مدل‌های embedding محلی کوچک، اگر از server محلی خطاهای طول context می‌بینید، `recallMaxChars` را کاهش دهید.

## providerهای سازگار با OpenAI

برخی providerهای embedding سازگار با OpenAI پارامتر `encoding_format` را رد می‌کنند، در حالی که برخی دیگر آن را نادیده می‌گیرند و همیشه بردارهای `number[]` برمی‌گردانند. بنابراین `memory-lancedb` در درخواست‌های embedding، `encoding_format` را حذف می‌کند و هم پاسخ‌های float-array و هم پاسخ‌های float32 کدگذاری‌شده با base64 را می‌پذیرد.

اگر یک endpoint خام embedding سازگار با OpenAI دارید که adapter provider داخلی ندارد، `embedding.provider` را حذف کنید (یا آن را به‌صورت `openai` باقی بگذارید) و `embedding.apiKey` را همراه با `embedding.baseUrl` تنظیم کنید. این کار مسیر مستقیم client سازگار با OpenAI را حفظ می‌کند.

برای providerهایی که ابعاد مدلشان به‌صورت داخلی شناخته‌شده نیست، `embedding.dimensions` را تنظیم کنید. برای مثال، ZhiPu `embedding-3` از ابعاد `2048` استفاده می‌کند:

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

## محدودیت‌های recall و capture

`memory-lancedb` دو محدودیت جداگانه برای متن دارد:

| تنظیمات           | پیش‌فرض | بازه      | اعمال می‌شود به                                    |
| ----------------- | ------- | --------- | --------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000 | متنی که برای recall به API embedding ارسال می‌شود     |
| `captureMaxChars` | `500`   | 100-10000 | طول پیام assistant که برای capture واجد شرایط است |

`recallMaxChars`، auto-recall، ابزار `memory_recall`، مسیر query مربوط به `memory_forget`، و `openclaw ltm search` را کنترل می‌کند. Auto-recall آخرین پیام user از آن turn را ترجیح می‌دهد و فقط وقتی هیچ پیام user در دسترس نباشد به prompt کامل fallback می‌کند. این کار metadataهای channel و blockهای بزرگ prompt را از درخواست embedding بیرون نگه می‌دارد.

`captureMaxChars` کنترل می‌کند که آیا یک پاسخ به‌اندازه‌ی کافی کوتاه هست تا برای capture خودکار در نظر گرفته شود یا نه. این مقدار embeddingهای query مربوط به recall را محدود نمی‌کند.

## دستورها

وقتی `memory-lancedb` Plugin حافظه‌ی فعال باشد، namespace مربوط به `ltm` در CLI را ثبت می‌کند:

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

این Plugin همچنین `openclaw memory` را با یک subcommand غیر برداری به نام `query` گسترش می‌دهد که مستقیماً روی جدول LanceDB اجرا می‌شود:

```bash
openclaw memory query --cols id,text,createdAt --limit 20
openclaw memory query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`: allowlist ستون‌های جداشده با کاما (به‌طور پیش‌فرض `id`، `text`، `importance`، `category`، `createdAt`).
- `--filter <condition>`: بند WHERE به سبک SQL؛ به ۲۰۰ نویسه محدود شده و به حروف و اعداد، عملگرهای مقایسه، quoteها، پرانتزها، و مجموعه‌ی کوچکی از نشانه‌گذاری امن محدود است.
- `--limit <n>`: عدد صحیح مثبت؛ پیش‌فرض `10`.
- `--order-by <column>:<asc|desc>`: مرتب‌سازی درون حافظه که پس از filter اعمال می‌شود؛ ستون مرتب‌سازی به‌طور خودکار در projection وارد می‌شود.

Agentها همچنین ابزارهای حافظه‌ی LanceDB را از Plugin حافظه‌ی فعال دریافت می‌کنند:

- `memory_recall` برای recall پشتیبانی‌شده توسط LanceDB
- `memory_store` برای ذخیره‌ی facts، preferences، decisions و entities مهم
- `memory_forget` برای حذف حافظه‌های مطابق

## ذخیره‌سازی

به‌طور پیش‌فرض، داده‌های LanceDB زیر `~/.openclaw/memory/lancedb` قرار می‌گیرند. مسیر را با `dbPath` override کنید:

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

`storageOptions` جفت‌های کلید/مقدار رشته‌ای را برای backendهای ذخیره‌سازی LanceDB می‌پذیرد و از گسترش `${ENV_VAR}` پشتیبانی می‌کند:

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

## وابستگی‌های runtime

`memory-lancedb` به package بومی `@lancedb/lancedb` وابسته است. OpenClaw بسته‌بندی‌شده آن package را بخشی از package مربوط به Plugin در نظر می‌گیرد. startup مربوط به Gateway وابستگی‌های Plugin را repair نمی‌کند؛ اگر dependency وجود ندارد، package مربوط به Plugin را دوباره نصب یا update کنید و Gateway را restart کنید.

اگر یک نصب قدیمی هنگام load شدن Plugin خطای missing `dist/package.json` یا missing `@lancedb/lancedb` را log کرد، OpenClaw را upgrade کنید و Gateway را restart کنید.

اگر Plugin log کرد که LanceDB روی `darwin-x64` در دسترس نیست، از backend حافظه‌ی پیش‌فرض روی آن machine استفاده کنید، Gateway را به platform پشتیبانی‌شده منتقل کنید، یا `memory-lancedb` را disable کنید.

## عیب‌یابی

### طول input از طول context فراتر می‌رود

این معمولاً یعنی مدل embedding، query مربوط به recall را رد کرده است:

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

`recallMaxChars` را روی مقدار کمتری تنظیم کنید، سپس Gateway را restart کنید:

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

برای Ollama، همچنین بررسی کنید که server embedding از host مربوط به Gateway قابل دسترسی باشد:

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### مدل embedding پشتیبانی‌نشده

بدون `dimensions`، فقط ابعاد embedding داخلی OpenAI شناخته شده‌اند. برای مدل‌های embedding محلی یا سفارشی، `embedding.dimensions` را روی اندازه‌ی برداری تنظیم کنید که آن مدل گزارش می‌کند.

### Plugin load می‌شود اما هیچ حافظه‌ای ظاهر نمی‌شود

بررسی کنید که `plugins.slots.memory` به `memory-lancedb` اشاره کند، سپس اجرا کنید:

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

اگر `autoCapture` غیرفعال باشد، Plugin حافظه‌های موجود را recall می‌کند اما موارد جدید را به‌طور خودکار ذخیره نمی‌کند. اگر capture خودکار می‌خواهید، از ابزار `memory_store` استفاده کنید یا `autoCapture` را فعال کنید.

## مرتبط

- [نمای کلی حافظه](/fa/concepts/memory)
- [Active memory](/fa/concepts/active-memory)
- [جستجوی حافظه](/fa/concepts/memory-search)
- [Memory Wiki](/fa/plugins/memory-wiki)
- [Ollama](/fa/providers/ollama)

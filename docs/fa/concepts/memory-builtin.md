---
read_when:
    - می‌خواهید بک‌اند پیش‌فرض حافظه را درک کنید
    - می‌خواهید ارائه‌دهندگان embedding یا جست‌وجوی ترکیبی را پیکربندی کنید
summary: بک‌اند پیش‌فرض حافظه مبتنی بر SQLite با جست‌وجوی کلیدواژه‌ای، برداری و ترکیبی
title: موتور حافظهٔ داخلی
x-i18n:
    generated_at: "2026-06-27T17:32:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a867bd295778f81109b258a63a35a1683d652d4564e44335053af4d86f90584e
    source_path: concepts/memory-builtin.md
    workflow: 16
---

موتور داخلی، پشتانه پیش‌فرض حافظه است. این موتور نمایه حافظه شما را در
یک پایگاه داده SQLite مختص هر عامل ذخیره می‌کند و برای شروع به وابستگی اضافه‌ای نیاز ندارد.

## چه چیزهایی فراهم می‌کند

- **جست‌وجوی کلیدواژه‌ای** از طریق نمایه‌سازی تمام‌متن FTS5 (امتیازدهی BM25).
- **جست‌وجوی برداری** از طریق embeddingها از هر ارائه‌دهنده پشتیبانی‌شده.
- **جست‌وجوی ترکیبی** که هر دو را برای بهترین نتایج ترکیب می‌کند.
- **پشتیبانی CJK** از طریق توکنیزه‌سازی سه‌حرفی برای چینی، ژاپنی و کره‌ای.
- **شتاب‌دهی sqlite-vec** برای پرس‌وجوهای برداری درون پایگاه داده (اختیاری).

## شروع به کار

به‌طور پیش‌فرض، موتور داخلی از embeddingهای OpenAI استفاده می‌کند. اگر از قبل
`OPENAI_API_KEY` یا `models.providers.openai.apiKey` را پیکربندی کرده باشید، جست‌وجوی برداری
بدون پیکربندی اضافه حافظه کار می‌کند.

برای تنظیم صریح یک ارائه‌دهنده:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
      },
    },
  },
}
```

بدون ارائه‌دهنده embedding، فقط جست‌وجوی کلیدواژه‌ای در دسترس است.

برای اجبار به استفاده از embeddingهای محلی GGUF، Plugin رسمی ارائه‌دهنده llama.cpp را نصب کنید،
سپس `local.modelPath` را به یک فایل GGUF اشاره دهید:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        fallback: "none",
        local: {
          modelPath: "~/.node-llama-cpp/models/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

## ارائه‌دهندگان embedding پشتیبانی‌شده

| ارائه‌دهنده        | شناسه               | یادداشت‌ها                              |
| ----------------- | ------------------- | ----------------------------------- |
| Bedrock           | `bedrock`           | از زنجیره اعتبارنامه AWS استفاده می‌کند |
| DeepInfra         | `deepinfra`         | پیش‌فرض: `BAAI/bge-m3`              |
| Gemini            | `gemini`            | از چندرسانه‌ای (تصویر + صدا) پشتیبانی می‌کند |
| GitHub Copilot    | `github-copilot`    | از اشتراک Copilot استفاده می‌کند |
| محلی              | `local`             | `@openclaw/llama-cpp-provider`      |
| Mistral           | `mistral`           |                                     |
| Ollama            | `ollama`            | محلی/خودمیزبان                    |
| OpenAI            | `openai`            | پیش‌فرض: `text-embedding-3-small`   |
| سازگار با OpenAI  | `openai-compatible` | نقطه پایانی عمومی `/v1/embeddings` |
| Voyage            | `voyage`            |                                     |

برای کنار گذاشتن OpenAI، `memorySearch.provider` را تنظیم کنید.

## نمایه‌سازی چگونه کار می‌کند

OpenClaw فایل‌های `MEMORY.md` و `memory/*.md` را به قطعه‌ها نمایه می‌کند (حدود ۴۰۰ توکن با
هم‌پوشانی ۸۰ توکن) و آن‌ها را در یک پایگاه داده SQLite مختص هر عامل ذخیره می‌کند.

- **محل نمایه:** پایگاه داده عامل مالک در
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **نگه‌داری ذخیره‌سازی:** فایل‌های جانبی WAL مربوط به SQLite با checkpointهای دوره‌ای و
  هنگام خاموشی محدود می‌شوند.
- **پایش فایل:** تغییرات در فایل‌های حافظه باعث بازنمایه‌سازی debounce‌شده می‌شود (۱٫۵ ثانیه).
- **بازنمایه‌سازی خودکار:** وقتی ارائه‌دهنده embedding، مدل، یا پیکربندی قطعه‌بندی
  تغییر کند، کل نمایه به‌صورت خودکار بازسازی می‌شود.
- **بازنمایه‌سازی در صورت نیاز:** `openclaw memory index --force`

<Info>
همچنین می‌توانید فایل‌های Markdown خارج از workspace را با
`memorySearch.extraPaths` نمایه کنید. به
[مرجع پیکربندی](/fa/reference/memory-config#additional-memory-paths) مراجعه کنید.
</Info>

## چه زمانی استفاده شود

موتور داخلی انتخاب مناسب بیشتر کاربران است:

- بدون وابستگی اضافه، آماده کار است.
- جست‌وجوی کلیدواژه‌ای و برداری را خوب مدیریت می‌کند.
- از همه ارائه‌دهندگان embedding پشتیبانی می‌کند.
- جست‌وجوی ترکیبی بهترین ویژگی‌های هر دو رویکرد بازیابی را ترکیب می‌کند.

اگر به رتبه‌بندی مجدد، گسترش پرس‌وجو،
یا نمایه‌سازی پوشه‌های خارج از workspace نیاز دارید، به [QMD](/fa/concepts/memory-qmd) تغییر دهید.

اگر حافظه بین‌نشستی با
مدل‌سازی خودکار کاربر می‌خواهید، [Honcho](/fa/concepts/memory-honcho) را در نظر بگیرید.

## عیب‌یابی

**جست‌وجوی حافظه غیرفعال است؟** `openclaw memory status` را بررسی کنید. اگر هیچ ارائه‌دهنده‌ای
تشخیص داده نشد، یکی را صریح تنظیم کنید یا یک کلید API اضافه کنید.

**ارائه‌دهنده محلی تشخیص داده نمی‌شود؟** تأیید کنید که مسیر محلی وجود دارد و اجرا کنید:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

هم فرمان‌های مستقل CLI و هم Gateway از همان شناسه ارائه‌دهنده `local` استفاده می‌کنند.
وقتی embeddingهای محلی می‌خواهید، `memorySearch.provider: "local"` را تنظیم کنید.

**نتایج کهنه هستند؟** برای بازسازی، `openclaw memory index --force` را اجرا کنید. پایشگر
ممکن است در موارد لبه‌ای نادر تغییرات را از دست بدهد.

**sqlite-vec بارگذاری نمی‌شود؟** OpenClaw به‌صورت خودکار به شباهت کسینوسی درون‌فرآیندی
برمی‌گردد. `openclaw memory status --deep` ذخیره‌گاه برداری محلی را
جدا از ارائه‌دهنده embedding گزارش می‌کند؛ بنابراین `Vector store: unavailable` به
بارگذاری sqlite-vec اشاره دارد، در حالی که `Embeddings: unavailable` به ارائه‌دهنده/احراز هویت
یا آمادگی مدل اشاره می‌کند. برای خطای بارگذاری مشخص، لاگ‌ها را بررسی کنید.

## پیکربندی

برای راه‌اندازی ارائه‌دهنده embedding، تنظیم جست‌وجوی ترکیبی (وزن‌ها، MMR، زوال زمانی)،
نمایه‌سازی دسته‌ای، حافظه چندرسانه‌ای، sqlite-vec، مسیرهای اضافه، و همه
گزینه‌های پیکربندی دیگر، به
[مرجع پیکربندی حافظه](/fa/reference/memory-config) مراجعه کنید.

## مرتبط

- [نمای کلی حافظه](/fa/concepts/memory)
- [جست‌وجوی حافظه](/fa/concepts/memory-search)
- [Active Memory](/fa/concepts/active-memory)

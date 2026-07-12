---
read_when:
    - شما تعبیه‌های جست‌وجوی حافظه را از یک مدل محلی GGUF می‌خواهید
    - شما در حال پیکربندی `memorySearch.provider = "local"` هستید
    - به Plugin متعلق به OpenClaw نیاز دارید که مالک زمان‌اجرای node-llama-cpp است
sidebarTitle: llama.cpp Provider
summary: ارائه‌دهنده رسمی llama.cpp را برای تعبیه‌های حافظه محلی GGUF نصب کنید
title: ارائه‌دهنده llama.cpp
x-i18n:
    generated_at: "2026-07-12T10:31:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 369ec199e8493356912337b849a84f829672e8872d17083c9a597f4e5294ebd5
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp`، Plugin رسمی ارائه‌دهندهٔ خارجی برای تعبیه‌سازی‌های محلی GGUF است. این Plugin شناسهٔ ارائه‌دهندهٔ تعبیه‌سازی `local` را ثبت می‌کند و مالک وابستگی زمان اجرای `node-llama-cpp` است که توسط `memorySearch.provider: "local"` استفاده می‌شود.

پیش از استفاده از تعبیه‌سازی‌های محلی حافظه، آن را نصب کنید:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

بستهٔ اصلی `openclaw` در npm شامل `node-llama-cpp` نیست. نگه‌داشتن این وابستگی بومی در این Plugin مانع از آن می‌شود که به‌روزرسانی‌های عادی OpenClaw از طریق npm، زمان اجرایی را که به‌صورت دستی در پوشهٔ بستهٔ OpenClaw نصب شده است حذف کنند.

## پیکربندی

مقدار `memorySearch.provider` را روی `local` تنظیم کنید:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        local: {
          modelPath: "hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

مقدار پیش‌فرض `local.modelPath` همان URI با پیشوند `hf:` است که در بالا نمایش داده شده (`embeddinggemma-300m-qat-Q8_0.gguf`). برای استفاده از مدلی دیگر، آن را به یک URI متفاوت با پیشوند `hf:` یا یک فایل محلی `.gguf` ارجاع دهید. `local.modelCacheDir` محل ذخیرهٔ موقت مدل‌های دانلودشده را بازنویسی می‌کند (پیش‌فرض: `~/.node-llama-cpp/models`) و `local.contextSize` یک عدد صحیح یا `"auto"` می‌پذیرد.

وقتی `local.contextSize` عددی باشد، ارائه‌دهنده این نیازمندی را نیز به جانمایی خودکار لایه‌های GPU در node-llama-cpp می‌دهد. این کار به node-llama-cpp اجازه می‌دهد مدل و زمینهٔ تعبیه‌سازی را با هم جای دهد و در عین حال بررسی‌های ایمنی حافظهٔ خود را حفظ کند. با `"auto"`، node-llama-cpp جانمایی خودکار عادی خود را حفظ می‌کند.

## زمان اجرای بومی

برای روان‌ترین مسیر نصب بومی، از Node 24 استفاده کنید. درخت‌های منبعی که از pnpm استفاده می‌کنند ممکن است نیاز داشته باشند وابستگی بومی را تأیید و دوباره بسازند:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

## عیب‌یابی زمان اجرا

پس از بارگذاری ارائه‌دهنده، `openclaw memory status --deep` را اجرا کنید تا پشتیبان و ساخت منتخب، نام دستگاه‌ها، لایه‌های واگذارشده به GPU، اندازهٔ زمینهٔ درخواستی و آخرین نمای لحظه‌ای مشاهده‌شده از VRAM یا حافظهٔ یکپارچه را بررسی کنید. مقادیر VRAM شامل برچسب زمانی مشاهده هستند، زیرا خواندن‌های غیرفعال وضعیت، مدل را دوباره بارگذاری نمی‌کنند و دستگاه را پایش دوره‌ای نمی‌کنند.

همین اطلاعاتِ آخرین وضعیت شناخته‌شده ممکن است در `openclaw doctor` نیز ظاهر شوند، مشروط بر اینکه Gateway در حال اجرا قبلاً از ارائه‌دهندهٔ محلی استفاده کرده باشد. فرمان عادی وضعیت یا doctor صرفاً برای جمع‌آوری اطلاعات عیب‌یابی، مدلی را بارگذاری نمی‌کند.

## رفع اشکال

اگر `node-llama-cpp` موجود نباشد یا بارگذاری آن ناموفق باشد، OpenClaw خطا را همراه با این راهکارها گزارش می‌کند:

1. Plugin را نصب کنید: `openclaw plugins install @openclaw/llama-cpp-provider`.
2. برای نصب‌ها و به‌روزرسانی‌های بومی از Node 24 استفاده کنید.
3. در یک درخت منبع pnpm: ابتدا `pnpm approve-builds` و سپس `pnpm rebuild node-llama-cpp` را اجرا کنید.

برای استفادهٔ آسان‌تر از تعبیه‌سازی‌های محلی بدون مرحلهٔ ساخت بومی، به‌جای آن `memorySearch.provider` را روی یک ارائه‌دهندهٔ تعبیه‌سازی راه‌دور مانند `lmstudio`، `ollama`، `openai` یا `voyage` تنظیم کنید.

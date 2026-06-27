---
read_when:
    - می‌خواهید embeddingهای جستجوی حافظه را از یک مدل محلی GGUF بگیرید
    - شما در حال پیکربندی memorySearch.provider = "local" هستید
    - به Plugin مربوط به OpenClaw نیاز دارید که مالک زمان اجرای node-llama-cpp است
sidebarTitle: llama.cpp Provider
summary: ارائه‌دهندهٔ رسمی llama.cpp را برای جاسازی‌های حافظهٔ محلی GGUF نصب کنید
title: ارائه‌دهنده‌ی llama.cpp
x-i18n:
    generated_at: "2026-06-27T18:17:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b0988c36c5ed5c61a7e97980df291fb43a0071e57c7460bf5a653f516114963
    source_path: plugins/llama-cpp.md
    workflow: 16
---

`llama-cpp` Plugin رسمی ارائه‌دهندهٔ خارجی برای تعبیه‌های GGUF محلی است.
این Plugin مالک وابستگی runtime یعنی `node-llama-cpp` است که توسط
`memorySearch.provider: "local"` استفاده می‌شود.

پیش از استفاده از تعبیه‌های حافظهٔ محلی، آن را نصب کنید:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

بستهٔ اصلی npm مربوط به `openclaw` شامل `node-llama-cpp` نیست. نگه داشتن
وابستگی بومی در این Plugin باعث می‌شود به‌روزرسانی‌های عادی npm برای OpenClaw
یک runtime نصب‌شده به‌صورت دستی را داخل پوشهٔ بستهٔ OpenClaw حذف نکنند.

## پیکربندی

ارائه‌دهندهٔ جست‌وجوی حافظه را روی `local` تنظیم کنید:

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

مدل پیش‌فرض `embeddinggemma-300m-qat-Q8_0.gguf` است. همچنین می‌توانید
`local.modelPath` را به یک فایل `.gguf` محلی اشاره دهید.

## Runtime بومی

برای روان‌ترین مسیر نصب بومی، از Node 24 استفاده کنید. checkoutهای سورس که از pnpm استفاده می‌کنند
ممکن است لازم باشد وابستگی بومی را تأیید و بازسازی کنند:

```bash
pnpm approve-builds
pnpm rebuild node-llama-cpp
```

برای تعبیه‌های محلی با اصطکاک کمتر، به‌جای آن از یک ارائه‌دهندهٔ سرویس محلی مانند
Ollama یا LM Studio استفاده کنید.

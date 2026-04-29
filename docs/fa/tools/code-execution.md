---
read_when:
    - می‌خواهید code_execution را فعال یا پیکربندی کنید
    - تحلیل از راه دور را بدون دسترسی به پوستهٔ محلی می‌خواهید
    - می‌خواهید x_search یا web_search را با تحلیل Python از راه دور ترکیب کنید
summary: code_execution -- اجرای تحلیل Python سندباکس‌شده از راه دور با xAI
title: اجرای کد
x-i18n:
    generated_at: "2026-04-29T23:40:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe635ec65aaf593a5bd63c139fbfc69e1ba3ea7c58c2bba639ec1ebd70dba1a9
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` تحلیل Python راه‌دور و سندباکس‌شده را روی Responses API شرکت xAI اجرا می‌کند.
این با [`exec`](/fa/tools/exec) محلی متفاوت است:

- `exec` فرمان‌های shell را روی ماشین یا node شما اجرا می‌کند
- `code_execution`، Python را در سندباکس راه‌دور xAI اجرا می‌کند

از `code_execution` برای این موارد استفاده کنید:

- محاسبات
- جدول‌بندی
- آمار سریع
- تحلیل به سبک نمودار
- تحلیل داده‌های بازگردانده‌شده توسط `x_search` یا `web_search`

وقتی به فایل‌های محلی، shell خودتان، repo خودتان، یا دستگاه‌های جفت‌شده نیاز دارید، از آن استفاده **نکنید**. برای این کار از [`exec`](/fa/tools/exec) استفاده کنید.

## راه‌اندازی

به یک کلید API از xAI نیاز دارید. هرکدام از این‌ها کار می‌کند:

- `XAI_API_KEY`
- `plugins.entries.xai.config.webSearch.apiKey`

مثال:

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...",
          },
          codeExecution: {
            enabled: true,
            model: "grok-4-1-fast",
            maxTurns: 2,
            timeoutSeconds: 30,
          },
        },
      },
    },
  },
}
```

## روش استفاده

طبیعی درخواست کنید و هدف تحلیل را صریح بیان کنید:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

این ابزار در داخل یک پارامتر واحد به نام `task` می‌گیرد، بنابراین عامل باید درخواست کامل تحلیل و هر داده درون‌خطی را در یک prompt ارسال کند.

## محدودیت‌ها

- این اجرای راه‌دور xAI است، نه اجرای فرایند محلی.
- باید آن را تحلیل گذرا در نظر گرفت، نه یک notebook پایدار.
- دسترسی به فایل‌های محلی یا workspace خود را فرض نکنید.
- برای داده‌های تازه X، ابتدا از [`x_search`](/fa/tools/web#x_search) استفاده کنید.

## مرتبط

- [ابزار Exec](/fa/tools/exec)
- [تاییدیه‌های Exec](/fa/tools/exec-approvals)
- [ابزار apply_patch](/fa/tools/apply-patch)
- [ابزارهای وب](/fa/tools/web)
- [xAI](/fa/providers/xai)

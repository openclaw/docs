---
read_when:
    - می‌خواهید از Ollama برای web_search استفاده کنید
    - شما یک ارائه‌دهندهٔ web_search بدون کلید می‌خواهید
    - می‌خواهید از جست‌وجوی وب میزبانی‌شدهٔ Ollama با OLLAMA_API_KEY استفاده کنید
    - به راهنمای راه‌اندازی جست‌وجوی وب Ollama نیاز دارید
summary: جست‌وجوی وب Ollama از طریق میزبان محلی Ollama یا API میزبانی‌شده Ollama
title: جست‌وجوی وب Ollama
x-i18n:
    generated_at: "2026-06-27T19:02:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4a30a6a2ed78d0d5f680ca2894e5e015cf99fbae2bcad4601727bbc9f560c124
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw از **Ollama Web Search** به‌عنوان یک ارائه‌دهنده `web_search` همراه پشتیبانی می‌کند. این قابلیت
از API جست‌وجوی وب Ollama استفاده می‌کند و نتایج ساختاریافته‌ای با عنوان‌ها، URLها
و قطعه‌متن‌ها برمی‌گرداند.

برای Ollama محلی یا خودمیزبان، این راه‌اندازی به‌صورت پیش‌فرض به کلید API
نیاز ندارد. اما به موارد زیر نیاز دارد:

- یک میزبان Ollama که از OpenClaw قابل دسترسی باشد
- `ollama signin`

برای جست‌وجوی میزبانی‌شده مستقیم، URL پایه ارائه‌دهنده Ollama را روی `https://ollama.com`
تنظیم کنید و یک `OLLAMA_API_KEY` واقعی ارائه دهید.

## راه‌اندازی

<Steps>
  <Step title="Start Ollama">
    مطمئن شوید Ollama نصب شده و در حال اجرا است.
  </Step>
  <Step title="Sign in">
    اجرا کنید:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Choose Ollama Web Search">
    اجرا کنید:

    ```bash
    openclaw configure --section web
    ```

    سپس **Ollama Web Search** را به‌عنوان ارائه‌دهنده انتخاب کنید.

  </Step>
</Steps>

اگر از قبل از Ollama برای مدل‌ها استفاده می‌کنید، Ollama Web Search از همان
میزبان پیکربندی‌شده دوباره استفاده می‌کند.

## پیکربندی

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

بازنویسی اختیاری میزبان Ollama:

```json5
{
  plugins: {
    entries: {
      ollama: {
        config: {
          webSearch: {
            baseUrl: "http://ollama-host:11434",
          },
        },
      },
    },
  },
}
```

اگر از قبل Ollama را به‌عنوان ارائه‌دهنده مدل پیکربندی کرده‌اید، ارائه‌دهنده جست‌وجوی وب می‌تواند
به‌جای آن از همان میزبان دوباره استفاده کند:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

ارائه‌دهنده مدل Ollama از `baseUrl` به‌عنوان کلید استاندارد استفاده می‌کند. ارائه‌دهنده جست‌وجوی وب همچنین برای سازگاری با نمونه‌های پیکربندی به سبک OpenAI SDK، از `baseURL` در `models.providers.ollama` نیز پشتیبانی می‌کند.

اگر هیچ URL پایه صریحی برای Ollama تنظیم نشده باشد، OpenClaw از `http://127.0.0.1:11434` استفاده می‌کند.

اگر میزبان Ollama شما انتظار احراز هویت bearer داشته باشد، OpenClaw از
`models.providers.ollama.apiKey` (یا احراز هویت ارائه‌دهنده متناظرِ پشتیبانی‌شده با env)
برای درخواست‌ها به آن میزبان پیکربندی‌شده دوباره استفاده می‌کند.

Ollama Web Search میزبانی‌شده مستقیم:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

## نکات

- برای این ارائه‌دهنده، هیچ فیلد کلید API اختصاصی جست‌وجوی وب لازم نیست.
- اگر میزبان Ollama با احراز هویت محافظت شده باشد، OpenClaw در صورت وجود،
  از کلید API معمول ارائه‌دهنده Ollama دوباره استفاده می‌کند.
- اگر `baseUrl` برابر با `https://ollama.com` باشد، OpenClaw مستقیماً
  `https://ollama.com/api/web_search` را فراخوانی می‌کند و کلید API پیکربندی‌شده Ollama
  را به‌عنوان احراز هویت bearer ارسال می‌کند.
- اگر میزبان پیکربندی‌شده جست‌وجوی وب را ارائه نکند و `OLLAMA_API_KEY` تنظیم شده باشد،
  OpenClaw می‌تواند بدون ارسال آن کلید env به میزبان محلی،
  به `https://ollama.com/api/web_search` بازگردد.
- اگر Ollama در دسترس نباشد یا وارد حساب نشده باشد، OpenClaw هنگام راه‌اندازی هشدار می‌دهد، اما
  جلوی انتخاب را نمی‌گیرد.
- وقتی هیچ ارائه‌دهنده دارای اعتبار با اولویت بالاتر پیکربندی نشده باشد، OpenClaw به‌صورت خودکار
  Ollama Web Search را انتخاب نمی‌کند؛ آن را صراحتاً با
  `tools.web.search.provider: "ollama"` انتخاب کنید.
- میزبان‌های daemon محلی Ollama از نقطه پایانی پروکسی محلی
  `/api/experimental/web_search` استفاده می‌کنند که درخواست را امضا کرده و به Ollama Cloud ارسال می‌کند.
- میزبان‌های `https://ollama.com` مستقیماً از نقطه پایانی میزبانی‌شده عمومی
  `/api/web_search` با احراز هویت کلید API به‌صورت bearer استفاده می‌کنند.

## مرتبط

- [نمای کلی جست‌وجوی وب](/fa/tools/web) -- همه ارائه‌دهندگان و شناسایی خودکار
- [Ollama](/fa/providers/ollama) -- راه‌اندازی مدل Ollama و حالت‌های ابری/محلی

---
read_when:
    - می‌خواهید برای web_search از Ollama استفاده کنید
    - شما یک ارائه‌دهندهٔ web_search بدون نیاز به کلید می‌خواهید
    - می‌خواهید با OLLAMA_API_KEY از جست‌وجوی وب میزبانی‌شدهٔ Ollama استفاده کنید
    - به راهنمای راه‌اندازی جست‌وجوی وب Ollama نیاز دارید
summary: جست‌وجوی وب Ollama از طریق میزبان محلی Ollama یا API میزبانی‌شده Ollama
title: جست‌وجوی وب Ollama
x-i18n:
    generated_at: "2026-07-12T10:58:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: edbbd887841339ab4c0c62ab7682a22fe99434a788957a91989fce6942187e9a
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw از **جست‌وجوی وب Ollama** به‌عنوان ارائه‌دهندهٔ داخلی `web_search` پشتیبانی می‌کند و عنوان‌ها، نشانی‌های URL و گزیده‌ها را از API جست‌وجوی وب Ollama برمی‌گرداند.

Ollama محلی/میزبانی‌شده توسط خودتان به‌طور پیش‌فرض به کلید API نیاز ندارد؛ به یک میزبان Ollama در دسترس و اجرای `ollama signin` نیاز دارد. جست‌وجوی مستقیم میزبانی‌شده (بدون Ollama محلی) به `baseUrl: "https://ollama.com"` و یک `OLLAMA_API_KEY` واقعی نیاز دارد.

## راه‌اندازی

<Steps>
  <Step title="راه‌اندازی Ollama">
    مطمئن شوید Ollama نصب و در حال اجرا است.
  </Step>
  <Step title="ورود">
    ```bash
    ollama signin
    ```
  </Step>
  <Step title="انتخاب جست‌وجوی وب Ollama">
    ```bash
    openclaw configure --section web
    ```

    **Ollama Web Search** را به‌عنوان ارائه‌دهنده انتخاب کنید.

  </Step>
</Steps>

اگر از قبل برای مدل‌ها از Ollama استفاده می‌کنید، جست‌وجوی وب Ollama از همان میزبان پیکربندی‌شده استفاده می‌کند.

<Note>
  OpenClaw هرگز جست‌وجوی وب Ollama را به‌صورت خودکار به‌جای یک ارائه‌دهندهٔ دارای اعتبارنامه با اولویت بالاتر انتخاب نمی‌کند؛ باید آن را صراحتاً با `tools.web.search.provider: "ollama"` انتخاب کنید.
</Note>

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

بازنویسی اختیاری میزبان، تنها در محدودهٔ جست‌وجوی وب:

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

یا از میزبانی که از قبل برای ارائه‌دهندهٔ مدل Ollama پیکربندی شده است استفاده کنید:

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

`models.providers.ollama.baseUrl` کلید استاندارد است؛ ارائه‌دهندهٔ جست‌وجوی وب برای سازگاری با نمونه‌های پیکربندی به سبک SDK متعلق به OpenAI، `baseURL` را نیز در آنجا می‌پذیرد. اگر هیچ‌چیز تنظیم نشده باشد، مقدار پیش‌فرض OpenClaw برابر با `http://127.0.0.1:11434` است.

جست‌وجوی مستقیم میزبانی‌شدهٔ وب Ollama (بدون Ollama محلی):

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

## احراز هویت و مسیریابی درخواست

- هیچ فیلد کلید API مختص جست‌وجوی وبی وجود ندارد؛ وقتی میزبان پیکربندی‌شده با احراز هویت محافظت می‌شود، ارائه‌دهنده از `models.providers.ollama.apiKey` (یا احراز هویت متناظر ارائه‌دهنده که از متغیر محیطی تأمین می‌شود) استفاده می‌کند.
- ترتیب تعیین میزبان: `plugins.entries.ollama.config.webSearch.baseUrl` ← `models.providers.ollama.baseUrl` (یا `baseURL`) ← `http://127.0.0.1:11434`.
- اگر میزبان تعیین‌شده `https://ollama.com` باشد، OpenClaw با استفاده از کلید API به‌عنوان احراز هویت bearer، مستقیماً `https://ollama.com/api/web_search` را فراخوانی می‌کند.
- در غیر این صورت، OpenClaw ابتدا نقطهٔ پایانی پراکسی محلی `/api/experimental/web_search` را فراخوانی می‌کند (که درخواست را امضا کرده و به Ollama Cloud ارسال می‌کند)، سپس در صورت شکست از `/api/web_search` روی همان میزبان استفاده می‌کند. اگر هر دو ناموفق باشند و `OLLAMA_API_KEY` تنظیم شده باشد، یک‌بار دیگر با آن کلید `https://ollama.com/api/web_search` را امتحان می‌کند — بدون آنکه کلید را به میزبان محلی ارسال کند.
- اگر Ollama در دسترس نباشد یا ورود به آن انجام نشده باشد، OpenClaw هنگام راه‌اندازی هشدار می‌دهد، اما انتخاب ارائه‌دهنده را مسدود نمی‌کند.

## مرتبط

- [نمای کلی جست‌وجوی وب](/fa/tools/web) -- همهٔ ارائه‌دهندگان و تشخیص خودکار
- [Ollama](/fa/providers/ollama) -- راه‌اندازی مدل Ollama و حالت‌های ابری/محلی

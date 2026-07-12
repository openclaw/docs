---
read_when:
    - می‌خواهید OpenClaw فقط زمانی یک سرور مدل محلی را راه‌اندازی کند که ارائه‌دهندهٔ مدل یا تعبیه‌سازی آن انتخاب شده باشد
    - شما ds4، inferrs، vLLM، llama.cpp، MLX یا سرور محلی دیگری سازگار با OpenAI را اجرا می‌کنید
    - باید راه‌اندازی سرد، آمادگی و خاموش‌شدن در حالت بی‌کاری را برای ارائه‌دهندگان محلی کنترل کنید
summary: راه‌اندازی سرورهای مدل محلی در صورت نیاز، پیش از درخواست‌های مدل و تعبیه‌سازی OpenClaw
title: سرویس‌های مدل محلی
x-i18n:
    generated_at: "2026-07-12T10:02:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a761113dd591fed0394379b2bad173165efc5e284565c652493e73d1e724529d
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` یک سرور مدل محلیِ تحت مالکیت ارائه‌دهنده را در صورت نیاز راه‌اندازی می‌کند. هنگامی که یک درخواست مدل یا تعبیه‌سازی آن ارائه‌دهنده را انتخاب کند، OpenClaw نقطه پایانی سلامت را بررسی می‌کند، اگر فرایند از کار افتاده باشد آن را راه‌اندازی می‌کند، تا آماده‌شدن منتظر می‌ماند و سپس درخواست را ارسال می‌کند. از آن استفاده کنید تا مجبور نباشید سرورهای محلی پرهزینه را تمام روز در حال اجرا نگه دارید.

## نحوه کار

1. یک درخواست مدل یا تعبیه‌سازی به یک ارائه‌دهنده پیکربندی‌شده نگاشت می‌شود.
2. اگر آن ارائه‌دهنده دارای `localService` باشد، OpenClaw نشانی `healthUrl` را بررسی می‌کند.
3. اگر بررسی موفق باشد، OpenClaw از سروری که از قبل در حال اجراست استفاده می‌کند.
4. اگر بررسی ناموفق باشد، OpenClaw دستور `command` را با `args` به‌صورت یک فرایند جدید اجرا می‌کند.
5. OpenClaw تا زمان انقضای `readyTimeoutMs`، نقطه پایانی سلامت را به‌طور دوره‌ای بررسی می‌کند.
6. درخواست از مسیر انتقال عادی مدل یا تعبیه‌سازی عبور می‌کند.
7. اگر OpenClaw فرایند را راه‌اندازی کرده باشد و `idleStopMs` تنظیم شده باشد، پس از آنکه آخرین درخواست در حال اجرا به همان مدت بیکار ماند، فرایند را متوقف می‌کند.

OpenClaw برای این کار launchd،‏ systemd،‏ Docker یا هیچ سرویس پس‌زمینه‌ای نصب نمی‌کند. سرور صرفاً یک فرایند فرزندِ همان فرایند OpenClaw است که نخستین بار به آن نیاز پیدا کرده است.

راه‌اندازی بر اساس هر ارائه‌دهنده پیکربندی‌شده و مجموعه دستور، آرگومان‌ها و متغیرهای محیطی به‌صورت ترتیبی انجام می‌شود؛ بنابراین درخواست‌های هم‌زمان گفت‌وگو و تعبیه‌سازی برای یک سرویس، سرورهای تکراری ایجاد نمی‌کنند. هر درخواست تا تکمیل پردازش پاسخ، اجاره اختصاصی خود را نگه می‌دارد؛ بنابراین خاموش‌شدن در حالت بیکاری منتظر پایان تمام درخواست‌های مدل و تعبیه‌سازیِ در حال اجرا می‌ماند. نام‌های مستعار پیکربندی‌شده ارائه‌دهنده از یکدیگر متمایز می‌مانند: دو نام مستعار می‌توانند به میزبان‌های GPU متفاوت اشاره کنند، بدون آنکه روی یک شناسه آداپتور Ollama،‏ LM Studio یا سازگار با OpenAI ادغام شوند.

اگر فرایند دیگری از OpenClaw از قبل سروری سالم در همان `healthUrl` داشته باشد، این فرایند بدون در اختیار گرفتن مدیریت آن، دوباره از آن استفاده می‌کند (هر فرایند فقط فرزندی را مدیریت می‌کند که شخصاً راه‌اندازی کرده است). گزارش‌های راه‌اندازی و خروج شامل بخش‌های انتهایی محدود و محرمانه‌سازی‌شده از خروجی فرایند فرزند، به‌همراه جزئیات زمان‌بندی و خروج هستند؛ مقادیر محیطی پیکربندی‌شده هرگز منتشر نمی‌شوند.

## ساختار پیکربندی

```json5
{
  models: {
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "local-model",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/absolute/path/to/server",
          args: ["--host", "127.0.0.1", "--port", "8000"],
          cwd: "/absolute/path/to/working-dir",
          env: { LOCAL_MODEL_CACHE: "/absolute/path/to/cache" },
          healthUrl: "http://127.0.0.1:8000/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "my-local-model",
            name: "My Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

گزینه `timeoutSeconds` را در ورودی ارائه‌دهنده تنظیم کنید (نه در `localService`) تا راه‌اندازی‌های اولیه کند و تولیدهای طولانی با مهلت زمانی پیش‌فرض درخواست مدل برخورد نکنند. هرگاه سرور شما آمادگی را در مکانی غیر از `/models` روی نشانی پایه ارائه می‌دهد، یک `healthUrl` صریح تنظیم کنید.

## فیلدها

| فیلد             | الزامی | توضیحات                                                                                                                                             |
| ---------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`        | بله    | مسیر مطلق فایل اجرایی. جست‌وجویی در PATH پوسته انجام نمی‌شود.                                                                                       |
| `args`           | خیر    | آرگومان‌های فرایند. بسط پوسته، لوله‌ها، تطبیق الگو یا نقل‌قول‌گذاری انجام نمی‌شود.                                                                   |
| `cwd`            | خیر    | پوشه کاری فرایند.                                                                                                                                   |
| `env`            | خیر    | متغیرهای محیطی که روی محیط فرایند OpenClaw ادغام می‌شوند.                                                                                            |
| `healthUrl`      | خیر    | نشانی آمادگی. مقدار پیش‌فرض، `baseUrl` با افزوده‌شدن `/models` است (`http://127.0.0.1:8000/v1` به `http://127.0.0.1:8000/v1/models` تبدیل می‌شود). |
| `readyTimeoutMs` | خیر    | مهلت آماده‌شدن هنگام راه‌اندازی. پیش‌فرض: `120000`.                                                                                                 |
| `idleStopMs`     | خیر    | تأخیر خاموش‌شدن در حالت بیکاری برای فرایندی که OpenClaw راه‌اندازی کرده است. مقدار `0` یا حذف این گزینه، آن را تا خروج OpenClaw زنده نگه می‌دارد.  |

## نمونه Inferrs

Inferrs یک بخش پشتی سفارشی و سازگار با OpenAI در مسیر `/v1` است؛ بنابراین همان API مربوط به `localService` با یک ورودی ارائه‌دهنده `inferrs` کار می‌کند:

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: { requiresStringContent: true },
          },
        ],
      },
    },
  },
}
```

در دستگاهی که OpenClaw را اجرا می‌کند، مقدار `command` را با نتیجه `which inferrs` جایگزین کنید. راه‌اندازی کامل inferrs: [Inferrs](/fa/providers/inferrs).

## نمونه ds4

```json5
{
  models: {
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "<DS4_DIR>/ds4-server",
          args: [
            "--model",
            "<DS4_DIR>/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "32768",
            "--tokens",
            "128",
          ],
          cwd: "<DS4_DIR>",
          healthUrl: "http://127.0.0.1:18000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 0,
        },
        models: [],
      },
    },
  },
}
```

دستورهای راه‌اندازی کامل، تعیین اندازه زمینه و تأیید: [ds4](/fa/providers/ds4).

## مرتبط

<CardGroup cols={2}>
  <Card title="مدل‌های محلی" href="/fa/gateway/local-models" icon="server">
    راه‌اندازی مدل محلی، گزینه‌های ارائه‌دهنده و راهنمای ایمنی.
  </Card>
  <Card title="Inferrs" href="/fa/providers/inferrs" icon="cpu">
    OpenClaw را از طریق سرور محلی inferrs سازگار با OpenAI اجرا کنید.
  </Card>
</CardGroup>

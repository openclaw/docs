---
read_when:
    - می‌خواهید OpenClaw فقط زمانی یک سرور مدل محلی را راه‌اندازی کند که مدل آن انتخاب شده باشد
    - شما ds4، inferrs، vLLM، llama.cpp، MLX یا یک سرور محلی دیگر سازگار با OpenAI را اجرا می‌کنید
    - باید راه‌اندازی سرد، آمادگی و خاموشی در حالت بیکاری را برای ارائه‌دهندگان محلی کنترل کنید
summary: سرورهای مدل محلی را بنا به نیاز و پیش از درخواست‌های مدل OpenClaw راه‌اندازی کنید
title: سرویس‌های مدل محلی
x-i18n:
    generated_at: "2026-06-27T17:44:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 399648e32dd51faba7687a26de75ef349f1197269b5cca03d34552f0cd9cce28
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService` به OpenClaw اجازه می‌دهد در صورت نیاز، یک
سرور مدل محلی متعلق به ارائه‌دهنده را راه‌اندازی کند. این پیکربندی در سطح ارائه‌دهنده است: وقتی مدل انتخاب‌شده
به آن ارائه‌دهنده تعلق داشته باشد، OpenClaw سرویس را بررسی می‌کند، اگر نقطه پایانی در دسترس نباشد فرایند را
راه‌اندازی می‌کند، منتظر آمادگی می‌ماند، سپس درخواست مدل را ارسال می‌کند.

از آن برای سرورهای محلی‌ای استفاده کنید که روشن نگه داشتنشان در تمام روز پرهزینه است، یا برای
راه‌اندازی‌های دستی که در آن‌ها انتخاب مدل باید برای بالا آوردن backend کافی باشد.

## نحوه کار

1. یک درخواست مدل به یک ارائه‌دهنده پیکربندی‌شده resolve می‌شود.
2. اگر آن ارائه‌دهنده `localService` داشته باشد، OpenClaw آدرس `healthUrl` را بررسی می‌کند.
3. اگر بررسی موفق شود، OpenClaw از سرور موجود استفاده می‌کند.
4. اگر بررسی شکست بخورد، OpenClaw فرمان `command` را با `args` اجرا می‌کند.
5. OpenClaw تا زمان انقضای `readyTimeoutMs` آمادگی را poll می‌کند.
6. درخواست مدل از طریق انتقال عادی ارائه‌دهنده ارسال می‌شود.
7. اگر OpenClaw فرایند را راه‌اندازی کرده باشد و `idleStopMs` مثبت باشد، فرایند
   پس از آنکه آخرین درخواست در حال اجرا به همان مدت بیکار ماند، متوقف می‌شود.

OpenClaw برای این کار launchd، systemd، Docker یا daemon نصب نمی‌کند. سرور
فرزند فرایند OpenClaw است که نخستین بار به آن نیاز پیدا کرده است.

## شکل پیکربندی

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

## فیلدها

- `command`: مسیر مطلق فایل اجرایی. جست‌وجوی shell استفاده نمی‌شود.
- `args`: آرگومان‌های فرایند. هیچ بسط shell، pipe، globbing یا قواعد quoting
  اعمال نمی‌شود.
- `cwd`: دایرکتوری کاری اختیاری برای فرایند.
- `env`: متغیرهای محیطی اختیاری که روی محیط فرایند OpenClaw merge می‌شوند.
- `healthUrl`: URL آمادگی. اگر حذف شود، OpenClaw عبارت `/models` را به
  `baseUrl` اضافه می‌کند، بنابراین `http://127.0.0.1:8000/v1` به
  `http://127.0.0.1:8000/v1/models` تبدیل می‌شود.
- `readyTimeoutMs`: مهلت آمادگی هنگام راه‌اندازی. پیش‌فرض: `120000`.
- `idleStopMs`: تاخیر خاموش‌سازی در حالت بیکاری برای فرایندهایی که OpenClaw راه‌اندازی کرده است. `0` یا
  حذف آن، فرایند را تا زمان خروج OpenClaw زنده نگه می‌دارد.

## نمونه Inferrs

Inferrs یک backend سفارشی `/v1` سازگار با OpenAI است، بنابراین همان API سرویس محلی
با ورودی ارائه‌دهنده `inferrs` کار می‌کند.

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
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

`command` را با نتیجه `which inferrs` روی ماشینی که OpenClaw را اجرا می‌کند جایگزین کنید.

## نمونه ds4

برای راه‌اندازی کامل، راهنمایی اندازه‌گذاری context و فرمان‌های راستی‌آزمایی، [ds4](/fa/providers/ds4) را ببینید.

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

## نکات عملیاتی

- یک فرایند OpenClaw فرزندی را که خودش راه‌اندازی کرده مدیریت می‌کند. فرایند OpenClaw دیگری
  که ببیند همان URL سلامت از قبل فعال است، بدون adopt کردن آن دوباره از آن استفاده می‌کند.
- راه‌اندازی برای هر فرمان ارائه‌دهنده و مجموعه آرگومان به‌صورت سریالی انجام می‌شود، بنابراین درخواست‌های
  هم‌زمان برای همان پیکربندی سرورهای تکراری spawn نمی‌کنند.
- پاسخ‌های streaming فعال یک lease نگه می‌دارند؛ خاموش‌سازی در حالت بیکاری تا کامل شدن
  رسیدگی به body پاسخ منتظر می‌ماند.
- برای ارائه‌دهندگان محلی کند از `timeoutSeconds` استفاده کنید تا cold startها و generationهای طولانی
  به timeout پیش‌فرض درخواست مدل برخورد نکنند.
- اگر سرورتان آمادگی را جایی غیر از `/v1/models` ارائه می‌کند، از یک `healthUrl` صریح استفاده کنید.

## مرتبط

<CardGroup cols={2}>
  <Card title="Local models" href="/fa/gateway/local-models" icon="server">
    راه‌اندازی مدل محلی، انتخاب‌های ارائه‌دهنده و راهنمایی ایمنی.
  </Card>
  <Card title="Inferrs" href="/fa/providers/inferrs" icon="cpu">
    OpenClaw را از طریق سرور محلی سازگار با OpenAI در inferrs اجرا کنید.
  </Card>
</CardGroup>

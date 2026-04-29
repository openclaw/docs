---
read_when:
    - می‌خواهید مدل‌ها را از دستگاه مجهز به پردازندهٔ گرافیکی خودتان میزبانی کنید
    - در حال اتصال LM Studio یا یک پراکسی سازگار با OpenAI هستید
    - به ایمن‌ترین راهنمایی برای مدل محلی نیاز دارید
summary: اجرای OpenClaw روی مدل‌های زبانی بزرگ محلی (LM Studio، vLLM، LiteLLM، نقاط پایانی سفارشی OpenAI)
title: مدل‌های محلی
x-i18n:
    generated_at: "2026-04-29T22:52:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ec1be4eac371328c1efe80b71450019f68fb1114df90db1532a4ff72bfa0ab1
    source_path: gateway/local-models.md
    workflow: 16
---

محلی قابل انجام است، اما OpenClaw انتظار زمینهٔ بزرگ و دفاع‌های قوی در برابر تزریق پرامپت را دارد. کارت‌های کوچک زمینه را کوتاه می‌کنند و ایمنی را نشت می‌دهند. هدف را بالا بگیرید: **حداقل ۲ Mac Studio با حداکثر پیکربندی یا ریگ GPU معادل (~۳۰ هزار دلار به بالا)**. یک GPU با **۲۴ GB** فقط برای پرامپت‌های سبک‌تر و با تأخیر بیشتر جواب می‌دهد. از **بزرگ‌ترین / نسخهٔ کامل مدل که می‌توانید اجرا کنید** استفاده کنید؛ چک‌پوینت‌های به‌شدت کوانتیزه یا «کوچک» خطر تزریق پرامپت را بالا می‌برند (ببینید [امنیت](/fa/gateway/security)).

اگر ساده‌ترین راه‌اندازی محلی را می‌خواهید، با [LM Studio](/fa/providers/lmstudio) یا [Ollama](/fa/providers/ollama) و `openclaw onboard` شروع کنید. این صفحه راهنمای جهت‌دار برای استک‌های محلی رده‌بالا و سرورهای محلی سفارشی سازگار با OpenAI است.

<Warning>
**کاربران WSL2 + Ollama + NVIDIA/CUDA:** نصب‌کنندهٔ رسمی لینوکس Ollama یک سرویس systemd با `Restart=always` فعال می‌کند. در راه‌اندازی‌های GPU روی WSL2، شروع خودکار می‌تواند آخرین مدل را هنگام بوت دوباره بارگذاری کند و حافظهٔ میزبان را اشغال نگه دارد. اگر VM مربوط به WSL2 شما پس از فعال‌سازی Ollama مرتباً ری‌استارت می‌شود، [حلقهٔ خرابی WSL2](/fa/providers/ollama#wsl2-crash-loop-repeated-reboots) را ببینید.
</Warning>

## پیشنهادی: LM Studio + مدل محلی بزرگ (Responses API)

بهترین استک محلی فعلی. یک مدل بزرگ را در LM Studio بارگذاری کنید (برای نمونه، یک بیلد کامل Qwen، DeepSeek یا Llama)، سرور محلی را فعال کنید (پیش‌فرض `http://127.0.0.1:1234`) و از Responses API استفاده کنید تا استدلال از متن نهایی جدا بماند.

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "lmstudio/my-local-model": { alias: "Local" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**چک‌لیست راه‌اندازی**

- LM Studio را نصب کنید: [https://lmstudio.ai](https://lmstudio.ai)
- در LM Studio، **بزرگ‌ترین بیلد مدل موجود** را دانلود کنید (از نسخه‌های «small»/به‌شدت کوانتیزه اجتناب کنید)، سرور را راه‌اندازی کنید و مطمئن شوید `http://127.0.0.1:1234/v1/models` آن را فهرست می‌کند.
- `my-local-model` را با شناسهٔ واقعی مدل که در LM Studio نشان داده می‌شود جایگزین کنید.
- مدل را بارگذاری‌شده نگه دارید؛ بارگذاری سرد تأخیر شروع را اضافه می‌کند.
- اگر بیلد LM Studio شما متفاوت است، `contextWindow`/`maxTokens` را تنظیم کنید.
- برای WhatsApp، به Responses API پایبند بمانید تا فقط متن نهایی ارسال شود.

حتی هنگام اجرای محلی، مدل‌های میزبانی‌شده را پیکربندی‌شده نگه دارید؛ از `models.mode: "merge"` استفاده کنید تا fallbackها در دسترس بمانند.

### پیکربندی ترکیبی: مدل میزبانی‌شده به‌عنوان اصلی، محلی به‌عنوان fallback

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### اولویت با محلی همراه با شبکهٔ ایمنی میزبانی‌شده

ترتیب اصلی و fallback را جابه‌جا کنید؛ همان بلوک providers و `models.mode: "merge"` را نگه دارید تا وقتی ماشین محلی در دسترس نیست بتوانید به Sonnet یا Opus fallback کنید.

### میزبانی منطقه‌ای / مسیریابی داده

- نسخه‌های میزبانی‌شدهٔ MiniMax/Kimi/GLM روی OpenRouter هم با endpointهای مقید به منطقه (مثلاً میزبانی‌شده در آمریکا) وجود دارند. نسخهٔ منطقه‌ای را آنجا انتخاب کنید تا ترافیک در حوزهٔ قضایی انتخابی شما بماند، در حالی که همچنان از `models.mode: "merge"` برای fallbackهای Anthropic/OpenAI استفاده می‌کنید.
- فقط-محلی همچنان قوی‌ترین مسیر حریم خصوصی است؛ مسیریابی منطقه‌ای میزبانی‌شده راه میانه است وقتی به قابلیت‌های provider نیاز دارید اما می‌خواهید بر جریان داده کنترل داشته باشید.

## پراکسی‌های محلی دیگر سازگار با OpenAI

MLX (`mlx_lm.server`)، vLLM، SGLang، LiteLLM، OAI-proxy، یا Gatewayهای سفارشی در صورتی کار می‌کنند که یک endpoint به سبک OpenAI در `/v1/chat/completions` ارائه کنند. از آداپتر Chat Completions استفاده کنید مگر اینکه backend صراحتاً پشتیبانی از `/v1/responses` را مستند کرده باشد. بلوک provider بالا را با endpoint و شناسهٔ مدل خود جایگزین کنید:

```json5
{
  agents: {
    defaults: {
      model: { primary: "local/my-local-model" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

اگر `api` در یک provider سفارشی با `baseUrl` حذف شود، OpenClaw به‌صورت پیش‌فرض از `openai-completions` استفاده می‌کند. endpointهای loopback مانند `127.0.0.1` به‌طور خودکار قابل اعتماد هستند؛ endpointهای LAN، tailnet و DNS خصوصی همچنان به `request.allowPrivateNetwork: true` نیاز دارند.

مقدار `models.providers.<id>.models[].id` مختص همان provider است. پیشوند provider را آنجا اضافه نکنید. برای مثال، سرور MLX که با `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` شروع شده باید از این شناسهٔ catalog و ارجاع مدل استفاده کند:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

روی مدل‌های بینایی محلی یا proxied مقدار `input: ["text", "image"]` را تنظیم کنید تا پیوست‌های تصویری وارد نوبت‌های agent شوند. onboarding تعاملی provider سفارشی شناسه‌های رایج مدل‌های بینایی را استنباط می‌کند و فقط برای نام‌های ناشناخته سؤال می‌پرسد. onboarding غیرتعاملی از همان استنباط استفاده می‌کند؛ برای شناسه‌های ناشناختهٔ بینایی از `--custom-image-input` یا وقتی مدلی با ظاهر شناخته‌شده پشت endpoint شما فقط متنی است از `--custom-text-input` استفاده کنید.

`models.mode: "merge"` را نگه دارید تا مدل‌های میزبانی‌شده به‌عنوان fallback در دسترس بمانند. برای سرورهای مدل محلی یا راه‌دور کند، قبل از بالا بردن `agents.defaults.timeoutSeconds` از `models.providers.<id>.timeoutSeconds` استفاده کنید. timeout مربوط به provider فقط روی درخواست‌های HTTP مدل اعمال می‌شود، شامل اتصال، headers، استریم بدنه، و کل abort محافظت‌شدهٔ fetch.

<Note>
برای providerهای سفارشی سازگار با OpenAI، ذخیرهٔ یک نشانگر محلی غیرمحرمانه مثل `apiKey: "ollama-local"` وقتی `baseUrl` به loopback، یک LAN خصوصی، `.local` یا یک hostname ساده resolve می‌شود پذیرفته است. OpenClaw به‌جای گزارش کلید گم‌شده، آن را یک اعتبارنامهٔ محلی معتبر در نظر می‌گیرد. برای هر provider که hostname عمومی می‌پذیرد از مقدار واقعی استفاده کنید.
</Note>

نکتهٔ رفتاری برای backendهای محلی/proxied با `/v1`:

- OpenClaw این‌ها را مسیرهای proxy-style سازگار با OpenAI در نظر می‌گیرد، نه endpointهای بومی OpenAI
- شکل‌دهی درخواست مخصوص OpenAI بومی اینجا اعمال نمی‌شود: بدون `service_tier`، بدون Responses `store`، بدون شکل‌دهی payload سازگار با reasoning در OpenAI، و بدون hintهای prompt-cache
- headerهای انتساب پنهان OpenClaw (`originator`، `version`، `User-Agent`) روی این URLهای proxy سفارشی تزریق نمی‌شوند

نکته‌های سازگاری برای backendهای سخت‌گیرتر سازگار با OpenAI:

- بعضی سرورها در Chat Completions فقط `messages[].content` رشته‌ای را می‌پذیرند، نه آرایه‌های ساختاریافتهٔ content-part. برای این endpointها `models.providers.<provider>.models[].compat.requiresStringContent: true` را تنظیم کنید.
- بعضی مدل‌های محلی درخواست‌های ابزار مستقل داخل براکت را به‌صورت متن تولید می‌کنند، مانند `[tool_name]` که JSON و `[END_TOOL_REQUEST]` پس از آن می‌آید. OpenClaw فقط وقتی آن‌ها را به فراخوانی واقعی ابزار ارتقا می‌دهد که نام دقیقاً با یک ابزار ثبت‌شده برای آن نوبت مطابق باشد؛ در غیر این صورت بلوک به‌عنوان متن پشتیبانی‌نشده در نظر گرفته می‌شود و از پاسخ‌های قابل مشاهده برای کاربر پنهان می‌ماند.
- اگر یک مدل JSON، XML، یا متن به سبک ReAct تولید کند که شبیه فراخوانی ابزار است اما provider فراخوانی ساختاریافته صادر نکرده باشد، OpenClaw آن را به‌صورت متن باقی می‌گذارد و با شناسهٔ run، provider/model، الگوی تشخیص‌داده‌شده، و نام ابزار در صورت وجود، یک هشدار log می‌کند. این را ناسازگاری tool-call مربوط به provider/model بدانید، نه اجرای کامل‌شدهٔ ابزار.
- اگر ابزارها به‌جای اجرا شدن به‌صورت متن assistant ظاهر شوند، برای مثال JSON خام، XML، syntax سبک ReAct، یا آرایهٔ خالی `tool_calls` در پاسخ provider، ابتدا بررسی کنید سرور از chat template/parser دارای قابلیت tool-call استفاده می‌کند. برای backendهای Chat Completions سازگار با OpenAI که parser آن‌ها فقط وقتی استفاده از ابزار اجباری باشد کار می‌کند، به‌جای تکیه بر parsing متن، یک override درخواست برای هر مدل تنظیم کنید:

  ```json5
  {
    agents: {
      defaults: {
        models: {
          "local/my-local-model": {
            params: {
              extra_body: {
                tool_choice: "required",
              },
            },
          },
        },
      },
    },
  }
  ```

  این را فقط برای مدل‌ها/sessionهایی استفاده کنید که در آن‌ها هر نوبت عادی باید یک ابزار را فراخوانی کند. این مقدار پیش‌فرض proxy در OpenClaw یعنی `tool_choice: "auto"` را override می‌کند. `local/my-local-model` را با ارجاع دقیق provider/model که `openclaw models list` نشان می‌دهد جایگزین کنید.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- اگر یک مدل سفارشی سازگار با OpenAI تلاش‌های reasoning فراتر از پروفایل داخلی را می‌پذیرد، آن‌ها را در بلوک compat مدل تعریف کنید. افزودن `"xhigh"` در اینجا باعث می‌شود `/think xhigh`، انتخاب‌گرهای session، اعتبارسنجی Gateway، و اعتبارسنجی `llm-task` این سطح را برای ارجاع پیکربندی‌شدهٔ provider/model نمایش دهند:

  ```json5
  {
    models: {
      providers: {
        local: {
          baseUrl: "http://127.0.0.1:8000/v1",
          apiKey: "sk-local",
          api: "openai-responses",
          models: [
            {
              id: "gpt-5.4",
              name: "GPT 5.4 via local proxy",
              reasoning: true,
              input: ["text"],
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
              contextWindow: 196608,
              maxTokens: 8192,
              compat: {
                supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
                reasoningEffortMap: { xhigh: "xhigh" },
              },
            },
          ],
        },
      },
    },
  }
  ```

- بعضی backendهای محلی کوچک‌تر یا سخت‌گیرتر با شکل کامل پرامپت runtime مربوط به agent در OpenClaw ناپایدار هستند، به‌ویژه وقتی schemaهای ابزار هم گنجانده شوند. ابتدا مسیر provider را با probe محلی سبک بررسی کنید:

  ```bash
  openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  برای بررسی مسیر Gateway بدون شکل کامل پرامپت agent، به‌جای آن از probe مدل Gateway استفاده کنید:

  ```bash
  openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  هر دو probe مدل محلی و Gateway فقط پرامپت ارائه‌شده را ارسال می‌کنند. probe مربوط به Gateway همچنان مسیریابی Gateway، احراز هویت، و انتخاب provider را اعتبارسنجی می‌کند، اما عمداً transcript قبلی session، زمینهٔ AGENTS/bootstrap، مونتاژ context-engine، ابزارها، و سرورهای MCP bundled را رد می‌کند.

  اگر این کار موفق شد اما نوبت‌های عادی عامل OpenClaw ناموفق می‌شوند، ابتدا
  `agents.defaults.experimental.localModelLean: true` را امتحان کنید تا ابزارهای
  پیش‌فرض سنگین مانند `browser`، `cron` و `message` حذف شوند؛ این یک پرچم
  آزمایشی است، نه یک تنظیم پایدار حالت پیش‌فرض. ببینید
  [ویژگی‌های آزمایشی](/fa/concepts/experimental-features). اگر همچنان ناموفق بود، امتحان کنید
  `models.providers.<provider>.models[].compat.supportsTools: false`.

- اگر بک‌اند همچنان فقط در اجراهای بزرگ‌تر OpenClaw ناموفق می‌شود، مشکل باقی‌مانده
  معمولاً ظرفیت مدل/سرور بالادستی یا یک اشکال بک‌اند است، نه لایه انتقال
  OpenClaw.

## عیب‌یابی

- آیا Gateway می‌تواند به پراکسی دسترسی پیدا کند؟ `curl http://127.0.0.1:1234/v1/models`.
- مدل LM Studio بارگذاری نشده است؟ دوباره بارگذاری کنید؛ شروع سرد یکی از علت‌های رایج «گیر کردن» است.
- سرور محلی `terminated`، `ECONNRESET` می‌گوید یا جریان را در میانه نوبت می‌بندد؟
  OpenClaw یک `model.call.error.failureKind` با کاردینالیتی پایین به‌همراه
  نمایه RSS/heap فرایند OpenClaw را در عیب‌یابی‌ها ثبت می‌کند. برای فشار حافظه
  LM Studio/Ollama، آن timestamp را با لاگ سرور یا لاگ crash / jetsam در macOS
  تطبیق دهید تا تأیید کنید آیا سرور مدل کشته شده است یا نه.
- OpenClaw وقتی پنجره زمینه شناسایی‌شده کمتر از **32k** باشد هشدار می‌دهد و زیر **16k** مسدود می‌کند. اگر به این پیش‌پرواز برخورد کردید، حد زمینه سرور/مدل را افزایش دهید یا مدل بزرگ‌تری انتخاب کنید.
- خطاهای زمینه دارید؟ `contextWindow` را کاهش دهید یا حد سرور خود را افزایش دهید.
- سرور سازگار با OpenAI مقدار `messages[].content ... expected a string` برمی‌گرداند؟
  روی آن ورودی مدل، `compat.requiresStringContent: true` را اضافه کنید.
- فراخوانی‌های کوچک مستقیم `/v1/chat/completions` کار می‌کنند، اما `openclaw infer model run --local`
  روی Gemma یا یک مدل محلی دیگر ناموفق است؟ ابتدا URL ارائه‌دهنده، ارجاع مدل، نشانگر احراز هویت
  و لاگ‌های سرور را بررسی کنید؛ `model run` محلی شامل ابزارهای عامل نیست.
  اگر `model run` محلی موفق می‌شود اما نوبت‌های بزرگ‌تر عامل ناموفق‌اند، سطح ابزار عامل
  را با `localModelLean` یا `compat.supportsTools: false` کاهش دهید.
- فراخوانی‌های ابزار به‌صورت متن خام JSON/XML/ReAct ظاهر می‌شوند، یا ارائه‌دهنده یک
  آرایه خالی `tool_calls` برمی‌گرداند؟ پراکسی‌ای اضافه نکنید که کورکورانه متن assistant
  را به اجرای ابزار تبدیل کند. ابتدا قالب/پارسر chat سرور را اصلاح کنید. اگر
  مدل فقط وقتی استفاده از ابزار اجباری می‌شود کار می‌کند، override مختص هر مدلِ
  `params.extra_body.tool_choice: "required"` را که در بالا آمده اضافه کنید و از آن ورودی مدل
  فقط برای نشست‌هایی استفاده کنید که در هر نوبت انتظار فراخوانی ابزار می‌رود.
- ایمنی: مدل‌های محلی فیلترهای سمت ارائه‌دهنده را رد می‌کنند؛ عامل‌ها را محدود نگه دارید و Compaction را روشن بگذارید تا شعاع اثر تزریق پرامپت محدود شود.

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference)
- [بازیابی از خرابی مدل](/fa/concepts/model-failover)

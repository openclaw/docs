---
read_when:
    - می‌خواهید مدل‌ها را از دستگاه مجهز به پردازندهٔ گرافیکی خودتان میزبانی کنید
    - در حال راه‌اندازی LM Studio یا یک پراکسی سازگار با OpenAI هستید
    - به راهنمایی درباره ایمن‌ترین مدل محلی نیاز دارید
summary: اجرای OpenClaw روی مدل‌های زبانی بزرگ محلی (LM Studio، vLLM، LiteLLM، نقاط پایانی سفارشی OpenAI)
title: مدل‌های محلی
x-i18n:
    generated_at: "2026-04-30T09:37:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 283da11a7896c670d3a249eeb957a252cbda7f7457bd814bb0796f3ca9956723
    source_path: gateway/local-models.md
    workflow: 16
---

محلی قابل انجام است، اما OpenClaw انتظار زمینه‌ی بزرگ + دفاع‌های قوی در برابر تزریق پرامپت را دارد. کارت‌های کوچک زمینه را کوتاه می‌کنند و ایمنی را نشت می‌دهند. هدف را بالا بگیرید: **≥2 Mac Studio با حداکثر پیکربندی یا ریگ GPU معادل (~$30k+)**. یک GPU با **24 GB** فقط برای پرامپت‌های سبک‌تر با تاخیر بیشتر کار می‌کند. از **بزرگ‌ترین / نسخه‌ی کامل مدل که می‌توانید اجرا کنید** استفاده کنید؛ چک‌پوینت‌های به‌شدت کوانتیزه یا «کوچک» ریسک تزریق پرامپت را افزایش می‌دهند (ببینید [امنیت](/fa/gateway/security)).

اگر کم‌اصطکاک‌ترین راه‌اندازی محلی را می‌خواهید، با [LM Studio](/fa/providers/lmstudio) یا [Ollama](/fa/providers/ollama) و `openclaw onboard` شروع کنید. این صفحه راهنمای نظرپردازانه برای استک‌های محلی رده‌بالا و سرورهای محلی سفارشی سازگار با OpenAI است.

<Warning>
**کاربران WSL2 + Ollama + NVIDIA/CUDA:** نصب‌کننده‌ی رسمی Ollama برای Linux یک سرویس systemd با `Restart=always` فعال می‌کند. در راه‌اندازی‌های GPU روی WSL2، شروع خودکار می‌تواند آخرین مدل را هنگام بوت دوباره بارگذاری کند و حافظه‌ی میزبان را اشغال نگه دارد. اگر VM شما در WSL2 پس از فعال کردن Ollama بارها دوباره راه‌اندازی می‌شود، [حلقه‌ی خرابی WSL2](/fa/providers/ollama#wsl2-crash-loop-repeated-reboots) را ببینید.
</Warning>

## توصیه‌شده: LM Studio + مدل محلی بزرگ (API پاسخ‌ها)

بهترین استک محلی فعلی. یک مدل بزرگ را در LM Studio بارگذاری کنید (برای مثال، یک بیلد کامل Qwen، DeepSeek، یا Llama)، سرور محلی را فعال کنید (پیش‌فرض `http://127.0.0.1:1234`)، و از API پاسخ‌ها استفاده کنید تا استدلال از متن نهایی جدا بماند.

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
- در LM Studio، **بزرگ‌ترین بیلد مدل موجود** را دانلود کنید (از نسخه‌های «کوچک»/به‌شدت کوانتیزه پرهیز کنید)، سرور را راه‌اندازی کنید، و تایید کنید که `http://127.0.0.1:1234/v1/models` آن را فهرست می‌کند.
- `my-local-model` را با شناسه‌ی واقعی مدل که در LM Studio نمایش داده می‌شود جایگزین کنید.
- مدل را بارگذاری‌شده نگه دارید؛ بارگذاری سرد تاخیر شروع را افزایش می‌دهد.
- اگر بیلد LM Studio شما متفاوت است، `contextWindow`/`maxTokens` را تنظیم کنید.
- برای WhatsApp، به API پاسخ‌ها پایبند بمانید تا فقط متن نهایی ارسال شود.

حتی هنگام اجرای محلی، مدل‌های میزبانی‌شده را پیکربندی‌شده نگه دارید؛ از `models.mode: "merge"` استفاده کنید تا fallbackها در دسترس بمانند.

### پیکربندی ترکیبی: اصلی میزبانی‌شده، fallback محلی

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

### محلی‌اول با شبکه‌ی ایمنی میزبانی‌شده

ترتیب اصلی و fallback را جابه‌جا کنید؛ همان بلوک providers و `models.mode: "merge"` را نگه دارید تا وقتی ماشین محلی از دسترس خارج است بتوانید به Sonnet یا Opus fallback کنید.

### میزبانی منطقه‌ای / مسیریابی داده

- نسخه‌های میزبانی‌شده‌ی MiniMax/Kimi/GLM نیز در OpenRouter با endpointهای مقید به منطقه وجود دارند (مثلا میزبانی‌شده در ایالات متحده). نسخه‌ی منطقه‌ای را آنجا انتخاب کنید تا ترافیک در حوزه‌ی قضایی انتخابی شما بماند، در حالی که همچنان از `models.mode: "merge"` برای fallbackهای Anthropic/OpenAI استفاده می‌کنید.
- فقط-محلی همچنان قوی‌ترین مسیر حریم خصوصی است؛ مسیریابی منطقه‌ای میزبانی‌شده راه میانی است وقتی به قابلیت‌های provider نیاز دارید اما می‌خواهید روی جریان داده کنترل داشته باشید.

## پروکسی‌های محلی دیگر سازگار با OpenAI

MLX (`mlx_lm.server`)، vLLM، SGLang، LiteLLM، OAI-proxy، یا Gatewayهای سفارشی اگر یک endpoint به سبک OpenAI با مسیر `/v1/chat/completions` ارائه کنند کار می‌کنند. مگر اینکه backend به‌صراحت پشتیبانی از `/v1/responses` را مستند کرده باشد، از آداپتر Chat Completions استفاده کنید. بلوک provider بالا را با endpoint و شناسه‌ی مدل خود جایگزین کنید:

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

اگر `api` در یک provider سفارشی با `baseUrl` حذف شود، OpenClaw به‌صورت پیش‌فرض از `openai-completions` استفاده می‌کند. endpointهای loopback مانند `127.0.0.1` به‌طور خودکار مورد اعتماد هستند؛ endpointهای LAN، tailnet، و DNS خصوصی همچنان به `request.allowPrivateNetwork: true` نیاز دارند.

مقدار `models.providers.<id>.models[].id` برای همان provider محلی است. پیشوند provider را آنجا وارد نکنید. برای مثال، سرور MLX که با `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` شروع شده باید از این شناسه‌ی catalog و ارجاع مدل استفاده کند:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

روی مدل‌های محلی یا vision پروکسی‌شده، `input: ["text", "image"]` را تنظیم کنید تا پیوست‌های تصویری در نوبت‌های agent تزریق شوند. onboarding تعاملی provider سفارشی، شناسه‌های رایج مدل‌های vision را استنباط می‌کند و فقط برای نام‌های ناشناخته سوال می‌پرسد. onboarding غیرتعاملی از همان استنباط استفاده می‌کند؛ برای شناسه‌های vision ناشناخته از `--custom-image-input` یا وقتی یک مدل ظاهرا شناخته‌شده پشت endpoint شما فقط متن است از `--custom-text-input` استفاده کنید.

`models.mode: "merge"` را نگه دارید تا مدل‌های میزبانی‌شده به‌عنوان fallback در دسترس بمانند. برای سرورهای کند مدل محلی یا راه‌دور، پیش از افزایش `agents.defaults.timeoutSeconds` از `models.providers.<id>.timeoutSeconds` استفاده کنید. timeout provider فقط روی درخواست‌های HTTP مدل اعمال می‌شود، شامل اتصال، headerها، streaming بدنه، و لغو guarded-fetch کلی.

<Note>
برای providerهای سفارشی سازگار با OpenAI، ماندگار کردن یک نشانگر محلی غیرمحرمانه مثل `apiKey: "ollama-local"` وقتی `baseUrl` به loopback، LAN خصوصی، `.local`، یا یک hostname ساده resolve می‌شود پذیرفته است. OpenClaw آن را به‌جای گزارش کلید گمشده، به‌عنوان credential محلی معتبر در نظر می‌گیرد. برای هر provider که hostname عمومی می‌پذیرد، از مقدار واقعی استفاده کنید.
</Note>

نکته‌ی رفتاری برای backendهای محلی/پروکسی‌شده‌ی `/v1`:

- OpenClaw این‌ها را مسیرهای سازگار با OpenAI به سبک پروکسی در نظر می‌گیرد، نه endpointهای بومی OpenAI
- شکل‌دهی درخواست مخصوص OpenAI بومی اینجا اعمال نمی‌شود: نه `service_tier`، نه `store` در پاسخ‌ها، نه شکل‌دهی payload سازگار با استدلال OpenAI، و نه hintهای prompt-cache
- headerهای پنهان انتساب OpenClaw (`originator`، `version`، `User-Agent`) روی این URLهای پروکسی سفارشی تزریق نمی‌شوند

نکته‌های سازگاری برای backendهای سخت‌گیرتر سازگار با OpenAI:

- برخی سرورها در Chat Completions فقط `messages[].content` رشته‌ای را می‌پذیرند، نه آرایه‌های ساختاریافته‌ی content-part. برای این endpointها `models.providers.<provider>.models[].compat.requiresStringContent: true` را تنظیم کنید.
- برخی مدل‌های محلی درخواست‌های ابزار مستقل داخل کروشه را به‌صورت متن منتشر می‌کنند، مانند `[tool_name]` به‌دنبال JSON و `[END_TOOL_REQUEST]`. OpenClaw فقط وقتی نام دقیقا با یک ابزار ثبت‌شده برای آن نوبت منطبق باشد، آن‌ها را به فراخوانی‌های واقعی ابزار ارتقا می‌دهد؛ در غیر این صورت بلوک به‌عنوان متن پشتیبانی‌نشده در نظر گرفته می‌شود و از پاسخ‌های قابل مشاهده برای کاربر پنهان می‌ماند.
- اگر یک مدل JSON، XML، یا متن به سبک ReAct منتشر کند که شبیه فراخوانی ابزار است اما provider یک invocation ساختاریافته منتشر نکرده باشد، OpenClaw آن را به‌صورت متن باقی می‌گذارد و با run id، provider/model، الگوی تشخیص‌داده‌شده، و در صورت وجود نام ابزار، یک هشدار ثبت می‌کند. با آن به‌عنوان ناسازگاری فراخوانی ابزار در provider/model برخورد کنید، نه اجرای کامل ابزار.
- اگر ابزارها به‌جای اجرا شدن به‌صورت متن assistant ظاهر می‌شوند، برای مثال JSON خام، XML، نحو ReAct، یا یک آرایه‌ی `tool_calls` خالی در پاسخ provider، ابتدا تایید کنید که سرور از chat template/parser دارای قابلیت فراخوانی ابزار استفاده می‌کند. برای backendهای Chat Completions سازگار با OpenAI که parser آن‌ها فقط وقتی استفاده از ابزار اجباری شود کار می‌کند، به‌جای تکیه بر parsing متن، یک override درخواست به‌ازای مدل تنظیم کنید:

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

  این را فقط برای مدل‌ها/نشست‌هایی استفاده کنید که در آن‌ها هر نوبت عادی باید یک ابزار را فراخوانی کند.
  این مقدار پیش‌فرض پروکسی OpenClaw یعنی `tool_choice: "auto"` را override می‌کند.
  `local/my-local-model` را با ارجاع دقیق provider/model که توسط `openclaw models list` نمایش داده می‌شود جایگزین کنید.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- اگر یک مدل سفارشی سازگار با OpenAI effortهای استدلال OpenAI فراتر از profile داخلی را می‌پذیرد، آن‌ها را روی بلوک compat مدل اعلام کنید. افزودن `"xhigh"` در اینجا باعث می‌شود `/think xhigh`، session pickerها، اعتبارسنجی Gateway، و اعتبارسنجی `llm-task` این سطح را برای ارجاع provider/model پیکربندی‌شده نمایش دهند:

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

- برخی backendهای محلی کوچک‌تر یا سخت‌گیرتر با شکل کامل پرامپت agent-runtime در OpenClaw ناپایدار هستند، به‌ویژه وقتی schemaهای ابزار گنجانده می‌شوند. ابتدا مسیر provider را با probe محلی سبک تایید کنید:

  ```bash
  openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  برای تایید مسیر Gateway بدون شکل کامل پرامپت agent، به‌جای آن از probe مدل Gateway استفاده کنید:

  ```bash
  openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  هر دو probe مدل محلی و Gateway فقط پرامپت ارائه‌شده را ارسال می‌کنند. probe Gateway همچنان مسیریابی Gateway، auth، و انتخاب provider را اعتبارسنجی می‌کند، اما عمدا transcript نشست قبلی، زمینه‌ی AGENTS/bootstrap، مونتاژ context-engine، ابزارها، و سرورهای MCP بسته‌بندی‌شده را رد می‌کند.

  اگر این مورد موفق بود اما نوبت‌های عادی عامل OpenClaw شکست می‌خورند، ابتدا
  `agents.defaults.experimental.localModelLean: true` را امتحان کنید تا ابزارهای
  پیش‌فرض سنگین مانند `browser`، `cron` و `message` حذف شوند؛ این یک پرچم
  آزمایشی است، نه یک تنظیم پایدار برای حالت پیش‌فرض. ببینید:
  [ویژگی‌های آزمایشی](/fa/concepts/experimental-features). اگر باز هم شکست خورد، امتحان کنید:
  `models.providers.<provider>.models[].compat.supportsTools: false`.

- اگر بک‌اند همچنان فقط در اجراهای بزرگ‌تر OpenClaw شکست می‌خورد، مشکل باقی‌مانده
  معمولا ظرفیت مدل/سرور بالادستی یا یک باگ بک‌اند است، نه لایهٔ انتقال OpenClaw.

## عیب‌یابی

- آیا Gateway می‌تواند به پراکسی دسترسی پیدا کند؟ `curl http://127.0.0.1:1234/v1/models`.
- مدل LM Studio بارگذاری نشده است؟ دوباره بارگذاری کنید؛ شروع سرد یکی از علت‌های رایج «گیر کردن» است.
- سرور محلی `terminated`، `ECONNRESET` می‌گوید، یا جریان را در میانهٔ نوبت می‌بندد؟
  OpenClaw یک `model.call.error.failureKind` کم‌کاردینالیتی به‌همراه اسنپ‌شات
  RSS/heap فرایند OpenClaw را در تشخیص‌ها ثبت می‌کند. برای فشار حافظهٔ LM Studio/Ollama،
  آن زمان‌مهر را با لاگ سرور یا لاگ crash / jetsam در macOS تطبیق دهید تا تأیید کنید
  آیا سرور مدل کشته شده است یا نه.
- OpenClaw آستانه‌های پیش‌بررسی پنجرهٔ زمینه را از پنجرهٔ مدل شناسایی‌شده، یا وقتی `agents.defaults.contextTokens` پنجرهٔ مؤثر را کاهش می‌دهد از پنجرهٔ بدون سقف مدل، استخراج می‌کند. زیر ۲۰٪ با کف **8k** هشدار می‌دهد. مسدودسازی‌های سخت از آستانهٔ ۱۰٪ با کف **4k** استفاده می‌کنند و به پنجرهٔ زمینهٔ مؤثر محدود می‌شوند تا فرادادهٔ بیش‌ازحد بزرگ مدل نتواند یک سقف معتبر کاربر را رد کند. اگر به این پیش‌بررسی برخورد کردید، حد زمینهٔ سرور/مدل را افزایش دهید یا مدل بزرگ‌تری انتخاب کنید.
- خطاهای زمینه دارید؟ `contextWindow` را کاهش دهید یا حد سرور خود را افزایش دهید.
- سرور سازگار با OpenAI مقدار `messages[].content ... expected a string` برمی‌گرداند؟
  روی آن ورودی مدل، `compat.requiresStringContent: true` را اضافه کنید.
- فراخوانی‌های کوچک مستقیم `/v1/chat/completions` کار می‌کنند، اما `openclaw infer model run --local`
  روی Gemma یا مدل محلی دیگری شکست می‌خورد؟ ابتدا URL ارائه‌دهنده، ارجاع مدل، نشانگر احراز هویت
  و لاگ‌های سرور را بررسی کنید؛ `model run` محلی ابزارهای عامل را شامل نمی‌شود.
  اگر `model run` محلی موفق است اما نوبت‌های بزرگ‌تر عامل شکست می‌خورند، سطح ابزار عامل
  را با `localModelLean` یا `compat.supportsTools: false` کاهش دهید.
- فراخوانی‌های ابزار به‌صورت متن خام JSON/XML/ReAct ظاهر می‌شوند، یا ارائه‌دهنده یک
  آرایهٔ خالی `tool_calls` برمی‌گرداند؟ پراکسی‌ای اضافه نکنید که متن دستیار را کورکورانه
  به اجرای ابزار تبدیل کند. ابتدا قالب/تجزیه‌گر چت سرور را اصلاح کنید. اگر مدل فقط وقتی کار می‌کند
  که استفاده از ابزار اجباری شده باشد، بازنویسی مخصوص مدل
  `params.extra_body.tool_choice: "required"` بالا را اضافه کنید و از آن ورودی مدل
  فقط برای نشست‌هایی استفاده کنید که در هر نوبت انتظار فراخوانی ابزار وجود دارد.
- ایمنی: مدل‌های محلی فیلترهای سمت ارائه‌دهنده را دور می‌زنند؛ عامل‌ها را محدود نگه دارید و Compaction را روشن بگذارید تا شعاع اثر تزریق پرامپت محدود شود.

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference)
- [جایگزینی مدل هنگام شکست](/fa/concepts/model-failover)

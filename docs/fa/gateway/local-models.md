---
read_when:
    - می‌خواهید مدل‌ها را از سرور GPU خودتان ارائه کنید
    - در حال راه‌اندازی LM Studio یا یک پروکسی سازگار با OpenAI هستید
    - به ایمن‌ترین راهنمایی برای مدل محلی نیاز دارید
summary: اجرای OpenClaw روی LLMهای محلی (LM Studio، vLLM، LiteLLM، اندپوینت‌های سفارشی OpenAI)
title: مدل‌های محلی
x-i18n:
    generated_at: "2026-05-06T09:18:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: cf0a1f960c5d0bd93eebb49e10db1066c305b2bc64401eb5000bf559f7e62349
    source_path: gateway/local-models.md
    workflow: 16
---

مدل‌های محلی شدنی هستند. همچنین سطح انتظار از سخت‌افزار، اندازه context، و دفاع در برابر prompt-injection را بالاتر می‌برند؛ کارت‌های کوچک یا به‌شدت quantized، context را کوتاه می‌کنند و ایمنی را نشت می‌دهند. این صفحه راهنمای نظرمدار برای پشته‌های محلی رده‌بالا و سرورهای محلی سفارشی سازگار با OpenAI است. برای راه‌اندازی با کمترین اصطکاک، با [LM Studio](/fa/providers/lmstudio) یا [Ollama](/fa/providers/ollama) و `openclaw onboard` شروع کنید.

## حداقل سخت‌افزار

هدف را بالا بگیرید: **حداقل ۲ Mac Studio با حداکثر مشخصات یا یک ریگ GPU معادل (~۳۰ هزار دلار به بالا)** برای یک حلقه عامل راحت. یک GPU با **۲۴ GB** فقط برای promptهای سبک‌تر و با تاخیر بیشتر جواب می‌دهد. همیشه **بزرگ‌ترین / نسخه کامل‌اندازه‌ای را که می‌توانید میزبانی کنید** اجرا کنید؛ checkpointهای کوچک یا به‌شدت quantized خطر prompt-injection را افزایش می‌دهند (نگاه کنید به [امنیت](/fa/gateway/security)).

## انتخاب backend

| Backend                                              | چه زمانی استفاده شود                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [LM Studio](/fa/providers/lmstudio)                     | راه‌اندازی محلی برای بار اول، بارگذار GUI، Responses API بومی                    |
| [Ollama](/fa/providers/ollama)                          | گردش کار CLI، کتابخانه مدل، سرویس systemd بی‌نیاز از مداخله                      |
| MLX / vLLM / SGLang                                  | سرویس‌دهی self-hosted با توان عملیاتی بالا و endpoint HTTP سازگار با OpenAI |
| LiteLLM / OAI-proxy / پراکسی سفارشی سازگار با OpenAI | وقتی جلوی یک API مدل دیگر قرار می‌گیرید و لازم دارید OpenClaw آن را مثل OpenAI رفتار دهد         |

وقتی backend پشتیبانی می‌کند (LM Studio پشتیبانی می‌کند)، از Responses API (`api: "openai-responses"`) استفاده کنید. در غیر این صورت سراغ Chat Completions (`api: "openai-completions"`) بروید.

<Warning>
**کاربران WSL2 + Ollama + NVIDIA/CUDA:** نصب‌کننده رسمی Ollama برای Linux یک سرویس systemd با `Restart=always` فعال می‌کند. در راه‌اندازی‌های GPU روی WSL2، شروع خودکار می‌تواند آخرین مدل را هنگام boot دوباره بارگذاری کند و حافظه میزبان را درگیر نگه دارد. اگر VM شما در WSL2 بعد از فعال‌کردن Ollama بارها restart می‌شود، [حلقه خرابی WSL2](/fa/providers/ollama#wsl2-crash-loop-repeated-reboots) را ببینید.
</Warning>

## پیشنهادی: LM Studio + مدل محلی بزرگ (Responses API)

بهترین پشته محلی فعلی. یک مدل بزرگ را در LM Studio بارگذاری کنید (برای نمونه، یک build کامل‌اندازه از Qwen، DeepSeek، یا Llama)، سرور محلی را فعال کنید (پیش‌فرض `http://127.0.0.1:1234`)، و از Responses API استفاده کنید تا reasoning از متن نهایی جدا بماند.

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
- در LM Studio، **بزرگ‌ترین build مدل موجود** را دانلود کنید (از نسخه‌های "small"/به‌شدت quantized دوری کنید)، سرور را شروع کنید، و تایید کنید که `http://127.0.0.1:1234/v1/models` آن را فهرست می‌کند.
- `my-local-model` را با ID واقعی مدل که در LM Studio نمایش داده می‌شود جایگزین کنید.
- مدل را بارگذاری‌شده نگه دارید؛ cold-load تاخیر شروع را اضافه می‌کند.
- اگر build شما در LM Studio متفاوت است، `contextWindow`/`maxTokens` را تنظیم کنید.
- برای WhatsApp، روی Responses API بمانید تا فقط متن نهایی ارسال شود.

حتی هنگام اجرای محلی، مدل‌های میزبانی‌شده را پیکربندی‌شده نگه دارید؛ از `models.mode: "merge"` استفاده کنید تا fallbackها در دسترس بمانند.

### پیکربندی ترکیبی: primary میزبانی‌شده، fallback محلی

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

### اول محلی با شبکه ایمنی میزبانی‌شده

ترتیب primary و fallback را جابه‌جا کنید؛ همان بلوک providers و `models.mode: "merge"` را نگه دارید تا وقتی دستگاه محلی خاموش است بتوانید به Sonnet یا Opus fallback کنید.

### میزبانی منطقه‌ای / مسیریابی داده

- گونه‌های میزبانی‌شده MiniMax/Kimi/GLM روی OpenRouter هم با endpointهای محدود به منطقه وجود دارند (مثلا میزبانی‌شده در US). گونه منطقه‌ای را آنجا انتخاب کنید تا ضمن استفاده از `models.mode: "merge"` برای fallbackهای Anthropic/OpenAI، ترافیک در حوزه قضایی انتخابی شما بماند.
- فقط محلی همچنان قوی‌ترین مسیر حریم خصوصی است؛ مسیریابی منطقه‌ای میزبانی‌شده حد میانی است وقتی به قابلیت‌های provider نیاز دارید اما می‌خواهید بر جریان داده کنترل داشته باشید.

## پراکسی‌های محلی دیگر سازگار با OpenAI

MLX (`mlx_lm.server`)، vLLM، SGLang، LiteLLM، OAI-proxy، یا Gatewayهای سفارشی
اگر یک endpoint به سبک OpenAI برای `/v1/chat/completions` ارائه دهند کار می‌کنند. مگر اینکه backend به‌صراحت
پشتیبانی از `/v1/responses` را مستند کرده باشد، از adapter مربوط به Chat Completions استفاده کنید. بلوک provider بالا را با
endpoint و ID مدل خود جایگزین کنید:

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

اگر `api` روی یک provider سفارشی دارای `baseUrl` حذف شود، OpenClaw به‌صورت پیش‌فرض از
`openai-completions` استفاده می‌کند. endpointهای loopback مانند `127.0.0.1` به‌طور خودکار
قابل اعتماد هستند؛ endpointهای LAN، tailnet، و DNS خصوصی همچنان به
`request.allowPrivateNetwork: true` نیاز دارند.

مقدار `models.providers.<id>.models[].id` محلیِ provider است. پیشوند provider را
آنجا وارد نکنید. برای نمونه، یک سرور MLX که با
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` شروع شده باید از این
ID کاتالوگ و ref مدل استفاده کند:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

روی مدل‌های vision محلی یا proxied مقدار `input: ["text", "image"]` را تنظیم کنید تا
پیوست‌های تصویر وارد turnهای عامل شوند. onboarding تعاملی برای provider سفارشی
IDهای رایج مدل‌های vision را استنباط می‌کند و فقط درباره نام‌های ناشناخته سوال می‌پرسد.
onboarding غیرتعاملی از همان استنباط استفاده می‌کند؛ برای IDهای vision ناشناخته از `--custom-image-input`
یا وقتی مدلی که شبیه مدل شناخته‌شده است پشت endpoint شما فقط متن است، از `--custom-text-input` استفاده کنید.

`models.mode: "merge"` را نگه دارید تا مدل‌های میزبانی‌شده به‌عنوان fallback در دسترس بمانند.
برای سرورهای مدل محلی یا راه‌دور کند، قبل از افزایش `agents.defaults.timeoutSeconds` از
`models.providers.<id>.timeoutSeconds` استفاده کنید. timeout مربوط به provider
فقط روی درخواست‌های HTTP مدل اعمال می‌شود، شامل connect، headers، body streaming،
و abort کلی guarded-fetch.

<Note>
برای providerهای سفارشی سازگار با OpenAI، نگهداری یک نشانگر محلی غیرمحرمانه مانند `apiKey: "ollama-local"` وقتی `baseUrl` به loopback، یک LAN خصوصی، `.local`، یا یک hostname ساده resolve می‌شود پذیرفته است. OpenClaw به جای گزارش کلید مفقود، آن را به‌عنوان credential محلی معتبر در نظر می‌گیرد. برای هر provider که hostname عمومی می‌پذیرد از یک مقدار واقعی استفاده کنید.
</Note>

نکته رفتاری برای backendهای محلی/proxied مربوط به `/v1`:

- OpenClaw این‌ها را مسیرهای سازگار با OpenAI به سبک پراکسی در نظر می‌گیرد، نه endpointهای بومی
  OpenAI
- شکل‌دهی درخواست مخصوص OpenAI بومی اینجا اعمال نمی‌شود: بدون
  `service_tier`، بدون `store` در Responses، بدون شکل‌دهی payload سازگار با reasoning در OpenAI،
  و بدون hintهای prompt-cache
- headerهای پنهان attribution مربوط به OpenClaw (`originator`، `version`، `User-Agent`)
  روی این URLهای پراکسی سفارشی تزریق نمی‌شوند

نکته‌های سازگاری برای backendهای سخت‌گیرتر سازگار با OpenAI:

- بعضی سرورها در Chat Completions فقط `messages[].content` رشته‌ای را می‌پذیرند، نه
  آرایه‌های ساختاریافته content-part. برای آن endpointها مقدار
  `models.providers.<provider>.models[].compat.requiresStringContent: true` را تنظیم کنید.
- بعضی مدل‌های محلی درخواست‌های tool مستقل و داخل bracket را به‌صورت متن منتشر می‌کنند، مانند
  `[tool_name]` به‌دنبال JSON و `[END_TOOL_REQUEST]`. OpenClaw فقط زمانی
  آن‌ها را به tool callهای واقعی ارتقا می‌دهد که نام دقیقا با یک tool ثبت‌شده
  برای آن turn منطبق باشد؛ در غیر این صورت block به‌عنوان متن پشتیبانی‌نشده در نظر گرفته می‌شود و از
  پاسخ‌های قابل مشاهده برای کاربر پنهان می‌ماند.
- اگر یک مدل JSON، XML، یا متن به سبک ReAct منتشر کند که شبیه tool call است
  اما provider invocation ساختاریافته منتشر نکرده باشد، OpenClaw آن را به‌صورت
  متن باقی می‌گذارد و همراه با run id، provider/model، الگوی تشخیص‌داده‌شده، و
  در صورت وجود نام tool یک warning ثبت می‌کند. آن را ناسازگاری tool-call مربوط به provider/model
  تلقی کنید، نه یک اجرای کامل‌شده tool.
- اگر tools به جای اجرا شدن به‌صورت متن assistant ظاهر می‌شوند، مثلا JSON خام،
  XML، نحو ReAct، یا آرایه خالی `tool_calls` در پاسخ provider،
  ابتدا بررسی کنید سرور از chat template/parser دارای قابلیت tool-call استفاده می‌کند. برای
  backendهای OpenAI-compatible Chat Completions که parser آن‌ها فقط وقتی tool
  use اجباری باشد کار می‌کند، به جای تکیه بر text
  parsing، یک override درخواست برای هر مدل تنظیم کنید:

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

  این را فقط برای مدل‌ها/sessionهایی استفاده کنید که هر turn عادی باید یک tool را صدا بزند.
  این مقدار پیش‌فرض پراکسی OpenClaw یعنی `tool_choice: "auto"` را override می‌کند.
  `local/my-local-model` را با ref دقیق provider/model که
  `openclaw models list` نشان می‌دهد جایگزین کنید.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- اگر یک مدل سفارشی سازگار با OpenAI تلاش‌های reasoning فراتر از
  profile داخلی را می‌پذیرد، آن‌ها را روی بلوک compat مدل declare کنید. افزودن `"xhigh"`
  اینجا باعث می‌شود `/think xhigh`، session pickerها، اعتبارسنجی Gateway، و اعتبارسنجی `llm-task`
  آن سطح را برای ref پیکربندی‌شده provider/model نمایش دهند:

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

## backendهای کوچک‌تر یا سخت‌گیرتر

اگر مدل بدون مشکل بارگذاری می‌شود اما turnهای کامل عامل بدرفتاری می‌کنند، از بالا به پایین کار کنید؛ اول transport را تایید کنید، سپس سطح را محدود کنید.

1. **تأیید کنید خود مدل محلی پاسخ می‌دهد.** بدون ابزارها، بدون زمینه عامل:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **مسیریابی Gateway را تأیید کنید.** فقط پرامپت ارائه‌شده را می‌فرستد؛ transcript، راه‌اندازی AGENTS، مونتاژ context-engine، ابزارها، و سرورهای MCP بسته‌بندی‌شده را رد می‌کند، اما همچنان مسیریابی Gateway، احراز هویت، و انتخاب provider را اجرا و بررسی می‌کند:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **حالت سبک را امتحان کنید.** اگر هر دو بررسی موفق شدند اما نوبت‌های واقعی عامل با فراخوانی‌های بدفرم ابزار یا پرامپت‌های بیش از حد بزرگ شکست می‌خورند، `agents.defaults.experimental.localModelLean: true` را فعال کنید. این گزینه سه ابزار پیش‌فرض سنگین‌تر (`browser`، `cron`، `message`) را حذف می‌کند تا شکل پرامپت کوچک‌تر و کم‌شکننده‌تر شود. برای توضیح کامل، زمان استفاده، و نحوه تأیید فعال بودن آن، [ویژگی‌های آزمایشی ← حالت سبک مدل محلی](/fa/concepts/experimental-features#local-model-lean-mode) را ببینید.

4. **به عنوان آخرین راه‌حل، ابزارها را کاملاً غیرفعال کنید.** اگر حالت سبک کافی نیست، برای ورودی آن مدل `models.providers.<provider>.models[].compat.supportsTools: false` را تنظیم کنید. سپس عامل روی آن مدل بدون فراخوانی ابزار کار خواهد کرد.

5. **بعد از آن، گلوگاه بالادست است.** اگر backend همچنان فقط در اجراهای بزرگ‌تر OpenClaw پس از حالت سبک و `supportsTools: false` شکست می‌خورد، مشکل باقی‌مانده معمولاً ظرفیت مدل یا سرور بالادست است: پنجره زمینه، حافظه GPU، حذف kv-cache، یا یک باگ backend. در آن نقطه، مشکل از لایه انتقال OpenClaw نیست.

## عیب‌یابی

- آیا Gateway می‌تواند به proxy برسد؟ `curl http://127.0.0.1:1234/v1/models`.
- آیا مدل LM Studio unload شده است؟ دوباره load کنید؛ شروع سرد یکی از علت‌های رایج «گیر کردن» است.
- آیا سرور محلی `terminated`، `ECONNRESET` می‌گوید، یا stream را وسط نوبت می‌بندد؟
  OpenClaw یک `model.call.error.failureKind` کم‌تعداد به‌همراه
  snapshot مربوط به RSS/heap فرایند OpenClaw را در diagnostics ثبت می‌کند. برای فشار حافظه LM Studio/Ollama،
  آن timestamp را با لاگ سرور یا لاگ crash / jetsam در macOS تطبیق دهید تا تأیید کنید آیا سرور مدل kill شده است یا نه.
- OpenClaw آستانه‌های preflight پنجره زمینه را از پنجره مدل شناسایی‌شده، یا وقتی `agents.defaults.contextTokens` پنجره مؤثر را کاهش می‌دهد از پنجره بدون سقف مدل، استخراج می‌کند. زیر 20% با کف **8k** هشدار می‌دهد. انسدادهای سخت از آستانه 10% با کف **4k** استفاده می‌کنند و به پنجره زمینه مؤثر محدود می‌شوند تا metadata بیش از حد بزرگ مدل نتواند سقف کاربری‌ای را که در غیر این صورت معتبر است رد کند. اگر به آن preflight برخورد کردید، حد زمینه سرور/مدل را افزایش دهید یا مدل بزرگ‌تری انتخاب کنید.
- خطاهای زمینه؟ `contextWindow` را کاهش دهید یا حد سرورتان را افزایش دهید.
- آیا سرور سازگار با OpenAI خطای `messages[].content ... expected a string` برمی‌گرداند؟
  روی آن ورودی مدل `compat.requiresStringContent: true` را اضافه کنید.
- فراخوانی‌های مستقیم و کوچک `/v1/chat/completions` کار می‌کنند، اما `openclaw infer model run --local`
  روی Gemma یا مدل محلی دیگری شکست می‌خورد؟ ابتدا provider URL، model ref، marker احراز هویت،
  و لاگ‌های سرور را بررسی کنید؛ `model run` محلی ابزارهای عامل را شامل نمی‌شود.
  اگر `model run` محلی موفق می‌شود اما نوبت‌های بزرگ‌تر عامل شکست می‌خورند، سطح ابزار عامل را با `localModelLean` یا `compat.supportsTools: false` کاهش دهید.
- آیا فراخوانی‌های ابزار به‌صورت متن خام JSON/XML/ReAct ظاهر می‌شوند، یا provider یک آرایه خالی `tool_calls` برمی‌گرداند؟ proxyای اضافه نکنید که کورکورانه متن assistant را به اجرای ابزار تبدیل کند. ابتدا chat template/parser سرور را اصلاح کنید. اگر مدل فقط زمانی کار می‌کند که استفاده از ابزار اجباری باشد، override سطح مدل `params.extra_body.tool_choice: "required"` را که در بالا آمده اضافه کنید و آن ورودی مدل را فقط برای sessionهایی استفاده کنید که در هر نوبت انتظار فراخوانی ابزار وجود دارد.
- ایمنی: مدل‌های محلی فیلترهای سمت provider را رد می‌کنند؛ عامل‌ها را محدود نگه دارید و Compaction را روشن بگذارید تا شعاع اثر prompt injection محدود شود.

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference)
- [failover مدل](/fa/concepts/model-failover)

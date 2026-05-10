---
read_when:
    - می‌خواهید مدل‌ها را از سرور مجهز به پردازندهٔ گرافیکی خودتان ارائه کنید
    - شما در حال پیکربندی اتصال LM Studio یا یک پراکسی سازگار با OpenAI هستید
    - به ایمن‌ترین راهنمایی برای مدل محلی نیاز دارید
summary: OpenClaw را روی LLMهای محلی اجرا کنید (LM Studio، vLLM، LiteLLM، endpointهای سفارشی OpenAI)
title: مدل‌های محلی
x-i18n:
    generated_at: "2026-05-10T19:43:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83a5667aa5bef697a890b0d8b6b8f5e4de56fa3cdcdfe5a5dbb826a62b64fbcf
    source_path: gateway/local-models.md
    workflow: 16
---

مدل‌های محلی قابل استفاده‌اند. همچنین سطح انتظار از سخت‌افزار، اندازه context و دفاع در برابر prompt-injection را بالا می‌برند؛ کارت‌های کوچک یا به‌شدت quantized، context را کوتاه می‌کنند و ایمنی را تضعیف می‌کنند. این صفحه راهنمایی نظر‌محور برای stackهای محلی رده‌بالا و سرورهای محلی سفارشیِ سازگار با OpenAI است. برای onboarding با کمترین اصطکاک، با [LM Studio](/fa/providers/lmstudio) یا [Ollama](/fa/providers/ollama) و `openclaw onboard` شروع کنید.

برای سرورهای محلی‌ای که فقط وقتی مدل انتخاب‌شده به آن‌ها نیاز دارد باید شروع شوند، ببینید:
[خدمات مدل محلی](/fa/gateway/local-model-services).

## حداقل سخت‌افزار

هدف را بالا بگیرید: **≥2 Mac Studio با بالاترین پیکربندی یا یک rig معادل GPU (~$30k+)** برای یک حلقه agent راحت. یک GPU تنها با **24 GB** فقط برای promptهای سبک‌تر با latency بالاتر مناسب است. همیشه **بزرگ‌ترین / نسخه full-sizeای را که می‌توانید میزبانی کنید** اجرا کنید؛ checkpointهای کوچک یا شدیدا quantized خطر prompt-injection را افزایش می‌دهند (ببینید [امنیت](/fa/gateway/security)).

## انتخاب backend

| Backend                                              | چه زمانی استفاده شود                                                         |
| ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| [LM Studio](/fa/providers/lmstudio)                     | راه‌اندازی محلی برای بار اول، GUI loader، Responses API بومی                 |
| [Ollama](/fa/providers/ollama)                          | workflow مبتنی بر CLI، کتابخانه مدل، سرویس systemd بدون نیاز به رسیدگی دستی  |
| MLX / vLLM / SGLang                                  | serving خودمیزبان با throughput بالا و endpoint HTTP سازگار با OpenAI         |
| LiteLLM / OAI-proxy / custom OpenAI-compatible proxy | وقتی API مدل دیگری را front می‌کنید و می‌خواهید OpenClaw آن را OpenAI بداند |

وقتی backend از آن پشتیبانی می‌کند، از Responses API (`api: "openai-responses"`) استفاده کنید (LM Studio پشتیبانی می‌کند). در غیر این صورت از Chat Completions (`api: "openai-completions"`) استفاده کنید.

<Warning>
**کاربران WSL2 + Ollama + NVIDIA/CUDA:** نصب‌کننده رسمی Linux برای Ollama یک سرویس systemd با `Restart=always` فعال می‌کند. در setupهای WSL2 GPU، autostart می‌تواند هنگام boot آخرین مدل را دوباره بارگذاری کند و حافظه host را نگه دارد. اگر VM مربوط به WSL2 شما پس از فعال کردن Ollama مکررا restart می‌شود، ببینید [حلقه crash در WSL2](/fa/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## توصیه‌شده: LM Studio + مدل محلی بزرگ (Responses API)

بهترین stack محلی فعلی. یک مدل بزرگ را در LM Studio بارگذاری کنید (برای مثال، build کامل Qwen، DeepSeek یا Llama)، سرور محلی را فعال کنید (پیش‌فرض `http://127.0.0.1:1234`) و از Responses API استفاده کنید تا reasoning از متن نهایی جدا بماند.

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
- در LM Studio، **بزرگ‌ترین build مدل موجود** را دانلود کنید (از نسخه‌های "small"/شدیدا quantized پرهیز کنید)، سرور را start کنید، و تایید کنید `http://127.0.0.1:1234/v1/models` آن را فهرست می‌کند.
- `my-local-model` را با model ID واقعی نشان‌داده‌شده در LM Studio جایگزین کنید.
- مدل را loaded نگه دارید؛ cold-load به startup latency اضافه می‌کند.
- اگر build شما در LM Studio متفاوت است، `contextWindow`/`maxTokens` را تنظیم کنید.
- برای WhatsApp، به Responses API پایبند بمانید تا فقط متن نهایی ارسال شود.

حتی هنگام اجرای محلی، مدل‌های hosted را هم configured نگه دارید؛ از `models.mode: "merge"` استفاده کنید تا fallbackها در دسترس بمانند.

### Config ترکیبی: primary hosted، fallback محلی

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

### اولویت محلی با شبکه ایمنی hosted

ترتیب primary و fallback را جابه‌جا کنید؛ همان block مربوط به providers و `models.mode: "merge"` را نگه دارید تا وقتی دستگاه محلی down است بتوانید به Sonnet یا Opus fallback کنید.

### میزبانی منطقه‌ای / مسیریابی داده

- نسخه‌های hosted از MiniMax/Kimi/GLM روی OpenRouter نیز با endpointهای region-pinned وجود دارند (مثلا hosted در US). نسخه منطقه‌ای را آنجا انتخاب کنید تا traffic در jurisdiction انتخابی شما بماند، در حالی که همچنان از `models.mode: "merge"` برای fallbackهای Anthropic/OpenAI استفاده می‌کنید.
- local-only همچنان قوی‌ترین مسیر حریم خصوصی است؛ routing منطقه‌ای hosted حد میانی است وقتی به قابلیت‌های provider نیاز دارید اما می‌خواهید بر جریان داده کنترل داشته باشید.

## Proxyهای محلی دیگر سازگار با OpenAI

MLX (`mlx_lm.server`)، vLLM، SGLang، LiteLLM، OAI-proxy، یا Gatewayهای سفارشی در صورتی کار می‌کنند که endpointی به سبک OpenAI با `/v1/chat/completions` ارائه کنند. مگر اینکه backend صراحتا پشتیبانی از `/v1/responses` را مستند کرده باشد، از adapter مربوط به Chat Completions استفاده کنید. block مربوط به provider در بالا را با endpoint و model ID خود جایگزین کنید:

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

اگر `api` روی provider سفارشی دارای `baseUrl` حذف شود، OpenClaw به‌صورت پیش‌فرض از `openai-completions` استفاده می‌کند. endpointهای loopback مانند `127.0.0.1` به‌صورت خودکار trusted هستند؛ endpointهای LAN، tailnet و DNS خصوصی همچنان به `request.allowPrivateNetwork: true` نیاز دارند.

مقدار `models.providers.<id>.models[].id` در محدوده provider محلی است. prefix مربوط به provider را آنجا وارد نکنید. برای مثال، سرور MLX که با `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` شروع شده باید از این catalog id و model ref استفاده کند:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

روی مدل‌های محلی یا proxied vision مقدار `input: ["text", "image"]` را تنظیم کنید تا image attachmentها به turnهای agent تزریق شوند. onboarding تعاملی custom-provider، IDهای رایج مدل‌های vision را استنباط می‌کند و فقط برای نام‌های ناشناخته سوال می‌پرسد. onboarding غیرتعاملی از همان inference استفاده می‌کند؛ برای IDهای vision ناشناخته از `--custom-image-input` استفاده کنید یا وقتی مدلی که vision به نظر می‌رسد پشت endpoint شما فقط text-only است، از `--custom-text-input` استفاده کنید.

`models.mode: "merge"` را نگه دارید تا مدل‌های hosted به‌عنوان fallback در دسترس بمانند. برای سرورهای مدل محلی یا remote کند، قبل از افزایش `agents.defaults.timeoutSeconds` از `models.providers.<id>.timeoutSeconds` استفاده کنید. timeout مربوط به provider فقط روی درخواست‌های HTTP مدل اعمال می‌شود، شامل connect، headers، body streaming و abort کلی guarded-fetch.

<Note>
برای providerهای سفارشی سازگار با OpenAI، وقتی `baseUrl` به loopback، یک LAN خصوصی، `.local` یا یک hostname بدون domain resolve می‌شود، ذخیره یک marker محلی غیرمحرمانه مانند `apiKey: "ollama-local"` پذیرفته می‌شود. OpenClaw به‌جای گزارش missing key، آن را به‌عنوان credential محلی معتبر در نظر می‌گیرد. برای هر providerی که hostname عمومی می‌پذیرد، از مقدار واقعی استفاده کنید.
</Note>

نکته رفتاری برای backendهای محلی/proxied `/v1`:

- OpenClaw این‌ها را routeهای سازگار با OpenAI از نوع proxy-style در نظر می‌گیرد، نه endpointهای بومی OpenAI
- shaping مخصوص درخواست‌های فقط OpenAI بومی اینجا اعمال نمی‌شود: بدون `service_tier`، بدون Responses `store`، بدون shaping payload سازگار با OpenAI reasoning، و بدون hintهای prompt-cache
- headerهای attribution مخفی OpenClaw (`originator`، `version`، `User-Agent`) روی این URLهای proxy سفارشی تزریق نمی‌شوند

نکته‌های سازگاری برای backendهای سخت‌گیرتر سازگار با OpenAI:

- برخی سرورها در Chat Completions فقط `messages[].content` از نوع string را می‌پذیرند، نه آرایه‌های structured content-part. برای آن endpointها مقدار `models.providers.<provider>.models[].compat.requiresStringContent: true` را تنظیم کنید.
- برخی مدل‌های محلی درخواست‌های مستقل ابزار را به‌صورت متن bracketed منتشر می‌کنند، مانند `[tool_name]` و سپس JSON و `[END_TOOL_REQUEST]`. OpenClaw فقط وقتی نام دقیقا با یک ابزار registered برای آن turn match کند، آن‌ها را به tool call واقعی promote می‌کند؛ در غیر این صورت block به‌عنوان متن unsupported در نظر گرفته می‌شود و از replyهای قابل مشاهده برای کاربر hidden می‌شود.
- اگر مدلی JSON، XML یا متن ReAct-style منتشر کند که شبیه tool call است اما provider invocation ساختاریافته منتشر نکرده باشد، OpenClaw آن را text نگه می‌دارد و warningی با run id، provider/model، الگوی شناسایی‌شده و tool name در صورت موجود بودن log می‌کند. آن را ناسازگاری tool-call در provider/model بدانید، نه یک tool run تکمیل‌شده.
- اگر ابزارها به‌جای اجرا شدن به‌صورت assistant text ظاهر شوند، برای مثال JSON خام، XML، syntax مربوط به ReAct، یا آرایه خالی `tool_calls` در response provider، ابتدا تایید کنید server از chat template/parser دارای قابلیت tool-call استفاده می‌کند. برای backendهای OpenAI-compatible Chat Completions که parser آن‌ها فقط وقتی tool use اجباری است کار می‌کند، به‌جای تکیه بر text parsing، override درخواست per-model تنظیم کنید:

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

  این را فقط برای مدل‌ها/sessionهایی استفاده کنید که هر turn عادی باید یک tool را call کند. این مقدار پیش‌فرض proxy در OpenClaw یعنی `tool_choice: "auto"` را override می‌کند. `local/my-local-model` را با provider/model ref دقیق نشان‌داده‌شده توسط `openclaw models list` جایگزین کنید.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- اگر یک مدل سفارشی سازگار با OpenAI، reasoning effortهای OpenAI فراتر از profile داخلی را می‌پذیرد، آن‌ها را در block مربوط به model compat declare کنید. افزودن `"xhigh"` در اینجا باعث می‌شود `/think xhigh`، session pickerها، اعتبارسنجی Gateway و اعتبارسنجی `llm-task` این سطح را برای provider/model ref configured شده expose کنند:

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

## Backendهای کوچک‌تر یا سخت‌گیرتر

اگر مدل بدون مشکل بارگذاری می‌شود اما گردش‌های کامل عامل بدرفتاری می‌کنند، از بالا به پایین کار کنید — اول انتقال را تأیید کنید، سپس سطح را محدودتر کنید.

1. **تأیید کنید خود مدل محلی پاسخ می‌دهد.** بدون ابزار، بدون زمینهٔ عامل:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **مسیریابی Gateway را تأیید کنید.** فقط پرامپت ارائه‌شده را می‌فرستد — متن رونوشت، راه‌اندازی AGENTS، مونتاژ موتور زمینه، ابزارها، و سرورهای MCP همراه را رد می‌کند، اما همچنان مسیریابی Gateway، احراز هویت، و انتخاب ارائه‌دهنده را آزمون می‌کند:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **حالت سبک را امتحان کنید.** اگر هر دو کاوش موفق‌اند اما گردش‌های واقعی عامل با فراخوانی‌های ابزار بدشکل یا پرامپت‌های بیش‌ازحد بزرگ شکست می‌خورند، `agents.defaults.experimental.localModelLean: true` را فعال کنید. این گزینه سه ابزار پیش‌فرض سنگین‌تر (`browser`، `cron`، `message`) را حذف می‌کند تا شکل پرامپت کوچک‌تر و شکنندگی آن کمتر شود. برای توضیح کامل، زمان استفاده، و نحوهٔ تأیید فعال بودن آن، [ویژگی‌های آزمایشی → حالت سبک مدل محلی](/fa/concepts/experimental-features#local-model-lean-mode) را ببینید.

4. **به‌عنوان آخرین راهکار، ابزارها را کاملاً غیرفعال کنید.** اگر حالت سبک کافی نیست، برای ورودی آن مدل `models.providers.<provider>.models[].compat.supportsTools: false` را تنظیم کنید. سپس عامل روی آن مدل بدون فراخوانی ابزار کار خواهد کرد.

5. **بعد از آن، گلوگاه بالادست است.** اگر پس‌زمینه پس از حالت سبک و `supportsTools: false` همچنان فقط در اجراهای بزرگ‌تر OpenClaw شکست می‌خورد، مشکل باقی‌مانده معمولاً ظرفیت مدل یا سرور بالادستی است — پنجرهٔ زمینه، حافظهٔ GPU، حذف kv-cache، یا باگ پس‌زمینه. در آن نقطه مشکل از لایهٔ انتقال OpenClaw نیست.

## عیب‌یابی

- آیا Gateway می‌تواند به پراکسی برسد؟ `curl http://127.0.0.1:1234/v1/models`.
- آیا مدل LM Studio بارگذاری نشده است؟ دوباره بارگذاری کنید؛ شروع سرد یکی از علت‌های رایج «گیر کردن» است.
- آیا سرور محلی `terminated`، `ECONNRESET` می‌گوید، یا جریان را میانهٔ گردش می‌بندد؟
  OpenClaw یک `model.call.error.failureKind` با کاردینالیتی پایین به‌همراه
  نمای لحظه‌ای RSS/heap فرایند OpenClaw را در عیب‌یابی‌ها ثبت می‌کند. برای فشار
  حافظهٔ LM Studio/Ollama، آن مهر زمانی را با لاگ سرور یا لاگ crash / jetsam در macOS
  تطبیق دهید تا تأیید کنید آیا سرور مدل کشته شده است یا نه.
- OpenClaw آستانه‌های پیش‌بررسی پنجرهٔ زمینه را از پنجرهٔ مدل شناسایی‌شده، یا وقتی `agents.defaults.contextTokens` پنجرهٔ مؤثر را پایین می‌آورد از پنجرهٔ بدون سقف مدل، استخراج می‌کند. زیر 20٪ با کف **8k** هشدار می‌دهد. مسدودسازی‌های سخت از آستانهٔ 10٪ با کف **4k** استفاده می‌کنند، و به پنجرهٔ زمینهٔ مؤثر محدود می‌شوند تا فرادادهٔ بیش‌ازحد بزرگ مدل نتواند سقف معتبر کاربر را رد کند. اگر به این پیش‌بررسی برخورد کردید، حد زمینهٔ سرور/مدل را بالا ببرید یا مدل بزرگ‌تری انتخاب کنید.
- خطاهای زمینه دارید؟ `contextWindow` را پایین بیاورید یا حد سرور خود را بالا ببرید.
- سرور سازگار با OpenAI برمی‌گرداند `messages[].content ... expected a string`؟
  روی آن ورودی مدل `compat.requiresStringContent: true` را اضافه کنید.
- سرور سازگار با OpenAI برمی‌گرداند `validation.keys` یا می‌گوید ورودی‌های پیام فقط `role` و `content` را مجاز می‌دانند؟
  روی آن ورودی مدل `compat.strictMessageKeys: true` را اضافه کنید.
- فراخوانی‌های بسیار کوچک مستقیم `/v1/chat/completions` کار می‌کنند، اما `openclaw infer model run --local`
  روی Gemma یا مدل محلی دیگری شکست می‌خورد؟ اول URL ارائه‌دهنده، ارجاع مدل، نشانگر احراز هویت،
  و لاگ‌های سرور را بررسی کنید؛ `model run` محلی ابزارهای عامل را شامل نمی‌شود.
  اگر `model run` محلی موفق است اما گردش‌های بزرگ‌تر عامل شکست می‌خورند، سطح
  ابزار عامل را با `localModelLean` یا `compat.supportsTools: false` کاهش دهید.
- فراخوانی‌های ابزار به‌صورت متن خام JSON/XML/ReAct ظاهر می‌شوند، یا ارائه‌دهنده یک
  آرایهٔ خالی `tool_calls` برمی‌گرداند؟ پراکسی‌ای اضافه نکنید که کورکورانه متن دستیار
  را به اجرای ابزار تبدیل کند. ابتدا قالب/پارسر گفت‌وگوی سرور را اصلاح کنید. اگر
  مدل فقط وقتی استفاده از ابزار اجباری است کار می‌کند، بازنویسی مخصوص هر مدل
  `params.extra_body.tool_choice: "required"` بالا را اضافه کنید و از آن ورودی مدل
  فقط برای نشست‌هایی استفاده کنید که در هر گردش انتظار فراخوانی ابزار می‌رود.
- ایمنی: مدل‌های محلی فیلترهای سمت ارائه‌دهنده را رد می‌کنند؛ عامل‌ها را محدود نگه دارید و Compaction را فعال بگذارید تا شعاع اثر تزریق پرامپت محدود شود.

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference)
- [جایگزینی مدل هنگام خطا](/fa/concepts/model-failover)

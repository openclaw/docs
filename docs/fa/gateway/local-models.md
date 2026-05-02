---
read_when:
    - می‌خواهید مدل‌ها را از دستگاه GPU خودتان ارائه دهید
    - شما در حال اتصال LM Studio یا یک پروکسی سازگار با OpenAI هستید
    - به ایمن‌ترین راهنمایی برای مدل محلی نیاز دارید
summary: اجرای OpenClaw روی مدل‌های زبانی بزرگ محلی (LM Studio، vLLM، LiteLLM، نقاط پایانی سفارشی OpenAI)
title: مدل‌های محلی
x-i18n:
    generated_at: "2026-05-02T22:20:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 29ab8530620370e0c213714bf6fef67bafed878055102cea47935c85b6238ffb
    source_path: gateway/local-models.md
    workflow: 16
---

مدل‌های محلی شدنی هستند. اما سطح نیازمندی‌های سخت‌افزار، اندازهٔ context، و دفاع در برابر prompt-injection را هم بالاتر می‌برند — کارت‌های کوچک یا به‌شدت quantized، context را کوتاه می‌کنند و ایمنی را نشت می‌دهند. این صفحه راهنمای موضع‌دار برای stackهای محلی رده‌بالا و سرورهای محلی سفارشی سازگار با OpenAI است. برای onboarding با کمترین اصطکاک، با [LM Studio](/fa/providers/lmstudio) یا [Ollama](/fa/providers/ollama) و `openclaw onboard` شروع کنید.

## کف سخت‌افزار

هدف را بالا بگیرید: **≥2 Mac Studio با حداکثر پیکربندی یا یک rig GPU معادل (~$30k+)** برای یک چرخهٔ agent راحت. یک GPU با **24 GB** فقط برای promptهای سبک‌تر با latency بالاتر جواب می‌دهد. همیشه **بزرگ‌ترین / نسخهٔ کامل‌اندازه‌ای را که می‌توانید میزبانی کنید** اجرا کنید؛ checkpointهای کوچک یا به‌شدت quantized ریسک prompt-injection را بالا می‌برند ( [Security](/fa/gateway/security) را ببینید).

## انتخاب backend

| Backend                                              | چه زمانی استفاده کنید                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [LM Studio](/fa/providers/lmstudio)                     | راه‌اندازی محلی برای اولین بار، loader گرافیکی، Responses API بومی                    |
| [Ollama](/fa/providers/ollama)                          | workflow مبتنی بر CLI، کتابخانهٔ مدل، سرویس systemd بدون نیاز به رسیدگی                      |
| MLX / vLLM / SGLang                                  | سرویس‌دهی self-hosted با throughput بالا و endpoint HTTP سازگار با OpenAI |
| LiteLLM / OAI-proxy / custom OpenAI-compatible proxy | وقتی جلوی یک API مدل دیگر قرار می‌گیرید و می‌خواهید OpenClaw آن را مثل OpenAI در نظر بگیرد         |

وقتی backend پشتیبانی می‌کند (LM Studio پشتیبانی می‌کند)، از Responses API (`api: "openai-responses"`) استفاده کنید. در غیر این صورت روی Chat Completions (`api: "openai-completions"`) بمانید.

<Warning>
**کاربران WSL2 + Ollama + NVIDIA/CUDA:** نصب‌کنندهٔ رسمی Ollama برای Linux یک سرویس systemd با `Restart=always` فعال می‌کند. در راه‌اندازی‌های GPU روی WSL2، autostart می‌تواند هنگام boot آخرین مدل را دوباره بارگذاری کند و حافظهٔ host را درگیر نگه دارد. اگر VM شما در WSL2 پس از فعال‌سازی Ollama مدام restart می‌شود، [WSL2 crash loop](/fa/providers/ollama#wsl2-crash-loop-repeated-reboots) را ببینید.
</Warning>

## پیشنهادی: LM Studio + مدل محلی بزرگ (Responses API)

بهترین stack محلی فعلی. یک مدل بزرگ را در LM Studio بارگذاری کنید (برای مثال، build کامل‌اندازهٔ Qwen، DeepSeek، یا Llama)، سرور محلی را فعال کنید (پیش‌فرض `http://127.0.0.1:1234`)، و از Responses API استفاده کنید تا reasoning از متن نهایی جدا بماند.

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
- در LM Studio، **بزرگ‌ترین build مدل موجود** را دانلود کنید (از نسخه‌های «small»/به‌شدت quantized دوری کنید)، سرور را start کنید، و تأیید کنید که `http://127.0.0.1:1234/v1/models` آن را فهرست می‌کند.
- `my-local-model` را با model ID واقعی نشان‌داده‌شده در LM Studio جایگزین کنید.
- مدل را loaded نگه دارید؛ cold-load به startup latency اضافه می‌کند.
- اگر build شما در LM Studio متفاوت است، `contextWindow`/`maxTokens` را تنظیم کنید.
- برای WhatsApp، روی Responses API بمانید تا فقط متن نهایی ارسال شود.

حتی هنگام اجرای محلی، مدل‌های hosted را configured نگه دارید؛ از `models.mode: "merge"` استفاده کنید تا fallbackها در دسترس بمانند.

### پیکربندی hybrid: primary hosted، fallback محلی

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

### local-first با safety net hosted

ترتیب primary و fallback را جابه‌جا کنید؛ همان بلوک providers و `models.mode: "merge"` را نگه دارید تا وقتی جعبهٔ محلی down است بتوانید به Sonnet یا Opus fallback کنید.

### میزبانی منطقه‌ای / مسیریابی داده

- نسخه‌های hosted از MiniMax/Kimi/GLM روی OpenRouter هم با endpointهای region-pinned وجود دارند (مثلاً hosted در آمریکا). نسخهٔ منطقه‌ای را آنجا انتخاب کنید تا traffic در jurisdiction انتخابی شما بماند و همچنان از `models.mode: "merge"` برای fallbackهای Anthropic/OpenAI استفاده کنید.
- local-only همچنان قوی‌ترین مسیر privacy است؛ مسیریابی منطقه‌ای hosted وقتی به ویژگی‌های provider نیاز دارید اما می‌خواهید روی flow داده کنترل داشته باشید، راه میانی است.

## proxyهای محلی دیگرِ سازگار با OpenAI

MLX (`mlx_lm.server`)، vLLM، SGLang، LiteLLM، OAI-proxy، یا gatewayهای سفارشی اگر یک endpoint به سبک OpenAI با `/v1/chat/completions` ارائه کنند کار می‌کنند. مگر اینکه backend به‌صراحت پشتیبانی از `/v1/responses` را مستند کرده باشد، از adapter مربوط به Chat Completions استفاده کنید. بلوک provider بالا را با endpoint و model ID خودتان جایگزین کنید:

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

اگر `api` روی یک provider سفارشی با `baseUrl` حذف شود، OpenClaw به‌صورت پیش‌فرض از `openai-completions` استفاده می‌کند. endpointهای loopback مانند `127.0.0.1` به‌صورت خودکار trusted هستند؛ endpointهای LAN، tailnet، و private DNS همچنان به `request.allowPrivateNetwork: true` نیاز دارند.

مقدار `models.providers.<id>.models[].id` داخل provider محلی است. prefix مربوط به provider را آنجا نیاورید. برای مثال، یک سرور MLX که با `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` start شده باید از این catalog id و model ref استفاده کند:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

روی مدل‌های vision محلی یا proxied مقدار `input: ["text", "image"]` را تنظیم کنید تا attachmentهای تصویر وارد turnهای agent شوند. onboarding تعاملی custom-provider، model IDهای رایج vision را infer می‌کند و فقط برای نام‌های ناشناخته می‌پرسد. onboarding غیرتعاملی از همان inference استفاده می‌کند؛ برای vision IDهای ناشناخته از `--custom-image-input` یا وقتی یک مدلِ ظاهراً شناخته‌شده پشت endpoint شما text-only است از `--custom-text-input` استفاده کنید.

`models.mode: "merge"` را نگه دارید تا مدل‌های hosted به‌عنوان fallback در دسترس بمانند. برای سرورهای مدل محلی یا remote کند، پیش از افزایش `agents.defaults.timeoutSeconds` از `models.providers.<id>.timeoutSeconds` استفاده کنید. timeout مربوط به provider فقط روی requestهای HTTP مدل اعمال می‌شود، شامل connect، headers، body streaming، و کل abort محافظت‌شدهٔ fetch.

<Note>
برای providerهای سفارشی سازگار با OpenAI، ذخیرهٔ یک marker محلی غیرمحرمانه مانند `apiKey: "ollama-local"` وقتی `baseUrl` به loopback، یک LAN خصوصی، `.local`، یا یک hostname بدون domain resolve شود پذیرفته است. OpenClaw آن را به‌جای گزارش کلید missing، به‌عنوان credential محلی معتبر در نظر می‌گیرد. برای هر provider که یک hostname عمومی می‌پذیرد، از یک مقدار واقعی استفاده کنید.
</Note>

نکتهٔ رفتاری برای backendهای `/v1` محلی/proxied:

- OpenClaw این‌ها را routeهای سازگار با OpenAI به سبک proxy در نظر می‌گیرد، نه endpointهای بومی OpenAI
- shaping request فقط مخصوص OpenAI بومی اینجا اعمال نمی‌شود: بدون `service_tier`، بدون Responses `store`، بدون shaping payload سازگار با OpenAI reasoning، و بدون hintهای prompt-cache
- headerهای attribution پنهان OpenClaw (`originator`، `version`، `User-Agent`) روی این URLهای proxy سفارشی inject نمی‌شوند

نکته‌های سازگاری برای backendهای سخت‌گیرتر سازگار با OpenAI:

- بعضی سرورها در Chat Completions فقط `messages[].content` رشته‌ای را می‌پذیرند، نه آرایه‌های structured content-part. برای آن endpointها `models.providers.<provider>.models[].compat.requiresStringContent: true` را تنظیم کنید.
- بعضی مدل‌های محلی درخواست‌های ابزار bracketed مستقل را به‌شکل متن emit می‌کنند، مثل `[tool_name]` و بعد JSON و `[END_TOOL_REQUEST]`. OpenClaw فقط وقتی آن‌ها را به tool call واقعی promote می‌کند که نام دقیقاً با یک tool ثبت‌شده برای آن turn match باشد؛ در غیر این صورت block به‌عنوان متن unsupported در نظر گرفته می‌شود و از replyهای visible برای user پنهان می‌ماند.
- اگر یک مدل JSON، XML، یا متن به سبک ReAct emit کند که شبیه tool call است اما provider یک invocation ساختاریافته emit نکرده، OpenClaw آن را به‌عنوان متن باقی می‌گذارد و warningای با run id، provider/model، pattern تشخیص‌داده‌شده، و نام tool وقتی در دسترس باشد log می‌کند. آن را ناسازگاری provider/model در tool-call بدانید، نه یک tool run کامل‌شده.
- اگر ابزارها به‌جای اجرا شدن به‌صورت متن assistant ظاهر می‌شوند، مثلاً JSON خام، XML، syntax مربوط به ReAct، یا یک آرایهٔ `tool_calls` خالی در پاسخ provider، اول تأیید کنید که سرور از chat template/parser دارای قابلیت tool-call استفاده می‌کند. برای backendهای OpenAI-compatible Chat Completions که parser آن‌ها فقط وقتی tool use اجباری باشد کار می‌کند، به‌جای تکیه بر text parsing، یک override برای request در سطح هر مدل تنظیم کنید:

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

  این را فقط برای مدل‌ها/sessionهایی استفاده کنید که هر turn عادی باید یک tool را call کند. این مقدار پیش‌فرض proxy در OpenClaw یعنی `tool_choice: "auto"` را override می‌کند. `local/my-local-model` را با ref دقیق provider/model که `openclaw models list` نشان می‌دهد جایگزین کنید.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- اگر یک مدل سفارشی سازگار با OpenAI تلاش‌های reasoning فراتر از profile داخلی را می‌پذیرد، آن‌ها را در model compat block اعلام کنید. افزودن `"xhigh"` در اینجا باعث می‌شود `/think xhigh`، session pickerها، validation در Gateway، و validation در `llm-task` این سطح را برای ref پیکربندی‌شدهٔ provider/model expose کنند:

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

اگر مدل بدون مشکل load می‌شود اما turnهای کامل agent بدرفتاری می‌کنند، از بالا به پایین کار کنید — اول transport را تأیید کنید، سپس surface را narrow کنید.

1. **تأیید کنید که خود مدل محلی پاسخ می‌دهد.** بدون ابزار، بدون زمینه عامل:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **مسیریابی Gateway را تأیید کنید.** فقط پرامپت ارائه‌شده را می‌فرستد — رونوشت، راه‌انداز AGENTS، مونتاژ موتور زمینه، ابزارها و سرورهای MCP همراه را رد می‌کند، اما همچنان مسیریابی Gateway، احراز هویت و انتخاب ارائه‌دهنده را اجرا می‌کند:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **حالت سبک را امتحان کنید.** اگر هر دو وارسی موفق شدند اما نوبت‌های واقعی عامل با فراخوانی‌های ابزار بدشکل یا پرامپت‌های بیش‌ازحد بزرگ شکست خوردند، `agents.defaults.experimental.localModelLean: true` را فعال کنید. این گزینه سه ابزار پیش‌فرض سنگین‌تر (`browser`، `cron`، `message`) را حذف می‌کند تا شکل پرامپت کوچک‌تر و کم‌ شکننده‌تر شود. برای توضیح کامل، زمان استفاده و روش تأیید فعال بودن آن، [ویژگی‌های آزمایشی → حالت سبک مدل محلی](/fa/concepts/experimental-features#local-model-lean-mode) را ببینید.

4. **به‌عنوان آخرین راه‌حل، ابزارها را کاملاً غیرفعال کنید.** اگر حالت سبک کافی نیست، برای آن ورودی مدل `models.providers.<provider>.models[].compat.supportsTools: false` را تنظیم کنید. سپس عامل روی آن مدل بدون فراخوانی ابزار کار خواهد کرد.

5. **پس از آن، گلوگاه در بالادست است.** اگر پس از حالت سبک و `supportsTools: false`، بک‌اند هنوز فقط در اجراهای بزرگ‌تر OpenClaw شکست می‌خورد، مشکل باقی‌مانده معمولاً ظرفیت مدل یا سرور بالادستی است — پنجره زمینه، حافظه GPU، حذف kv-cache، یا باگ بک‌اند. در آن نقطه، این مشکل از لایه انتقال OpenClaw نیست.

## عیب‌یابی

- آیا Gateway می‌تواند به پروکسی برسد؟ `curl http://127.0.0.1:1234/v1/models`.
- آیا مدل LM Studio بارگذاری نشده است؟ دوباره بارگذاری کنید؛ شروع سرد یک علت رایج «گیر کردن» است.
- آیا سرور محلی `terminated`، `ECONNRESET` می‌گوید، یا جریان را در میانه نوبت می‌بندد؟
  OpenClaw یک `model.call.error.failureKind` با کاردینالیتی پایین به‌همراه
  اسنپ‌شات RSS/heap فرایند OpenClaw را در عیب‌یابی‌ها ثبت می‌کند. برای فشار حافظه
  LM Studio/Ollama، آن timestamp را با لاگ سرور یا لاگ crash /
  jetsam در macOS تطبیق دهید تا تأیید کنید آیا سرور مدل کشته شده است یا نه.
- OpenClaw آستانه‌های پیش‌پرواز پنجره زمینه را از پنجره مدل شناسایی‌شده، یا از پنجره بدون سقف مدل هنگامی که `agents.defaults.contextTokens` پنجره مؤثر را پایین می‌آورد، استخراج می‌کند. زیر ۲۰٪ با کف **8k** هشدار می‌دهد. مسدودسازی‌های سخت از آستانه ۱۰٪ با کف **4k** استفاده می‌کنند و به پنجره زمینه مؤثر محدود می‌شوند تا فراداده مدلِ بیش‌ازحد بزرگ نتواند سقف معتبر کاربر را رد کند. اگر به آن پیش‌پرواز برخورد کردید، حد زمینه سرور/مدل را افزایش دهید یا مدل بزرگ‌تری انتخاب کنید.
- خطاهای زمینه دارید؟ `contextWindow` را کاهش دهید یا حد سرور خود را افزایش دهید.
- آیا سرور سازگار با OpenAI مقدار `messages[].content ... expected a string` برمی‌گرداند؟
  روی آن ورودی مدل `compat.requiresStringContent: true` را اضافه کنید.
- فراخوانی‌های مستقیم و کوچک `/v1/chat/completions` کار می‌کنند، اما `openclaw infer model run --local`
  روی Gemma یا مدل محلی دیگری شکست می‌خورد؟ ابتدا URL ارائه‌دهنده، ارجاع مدل، نشانگر احراز هویت
  و لاگ‌های سرور را بررسی کنید؛ `model run` محلی ابزارهای عامل را شامل نمی‌شود.
  اگر `model run` محلی موفق می‌شود اما نوبت‌های بزرگ‌تر عامل شکست می‌خورند، سطح ابزار عامل را
  با `localModelLean` یا `compat.supportsTools: false` کاهش دهید.
- فراخوانی‌های ابزار به‌صورت متن خام JSON/XML/ReAct ظاهر می‌شوند، یا ارائه‌دهنده یک آرایه
  خالی `tool_calls` برمی‌گرداند؟ پروکسی‌ای اضافه نکنید که کورکورانه متن assistant
  را به اجرای ابزار تبدیل کند. ابتدا قالب/تجزیه‌گر چت سرور را اصلاح کنید. اگر
  مدل فقط وقتی استفاده از ابزار اجباری است کار می‌کند، بازنویسی برای هر مدل
  `params.extra_body.tool_choice: "required"` را در بالا اضافه کنید و از آن ورودی مدل
  فقط برای نشست‌هایی استفاده کنید که در هر نوبت انتظار فراخوانی ابزار می‌رود.
- ایمنی: مدل‌های محلی فیلترهای سمت ارائه‌دهنده را رد می‌کنند؛ عامل‌ها را محدود نگه دارید و Compaction را روشن بگذارید تا شعاع اثر تزریق پرامپت محدود شود.

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference)
- [جابه‌جایی در زمان شکست مدل](/fa/concepts/model-failover)

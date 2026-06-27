---
read_when:
    - می‌خواهید مدل‌ها را از دستگاه GPU خودتان ارائه کنید
    - شما در حال اتصال LM Studio یا یک پراکسی سازگار با OpenAI هستید
    - به ایمن‌ترین راهنمایی برای مدل محلی نیاز دارید
summary: OpenClaw را روی LLMهای محلی اجرا کنید (LM Studio، vLLM، LiteLLM، نقاط پایانی سفارشی OpenAI)
title: مدل‌های محلی
x-i18n:
    generated_at: "2026-06-27T17:45:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 671c92d78fa29c778fd34b6df027cc8f9e7ad507c9d446700d97cd789becd041
    source_path: gateway/local-models.md
    workflow: 16
---

مدل‌های محلی شدنی هستند. آن‌ها همچنین سطح انتظار از سخت‌افزار، اندازهٔ context، و دفاع در برابر prompt-injection را بالا می‌برند — کارت‌های کوچک یا به‌شدت quantized شده context را کوتاه می‌کنند و ایمنی را تضعیف می‌کنند. این صفحه راهنمای موضع‌دار برای stackهای محلی رده‌بالا و سرورهای محلی سفارشی سازگار با OpenAI است. برای onboarding با کمترین اصطکاک، با [LM Studio](/fa/providers/lmstudio) یا [Ollama](/fa/providers/ollama) و `openclaw onboard` شروع کنید.

برای سرورهای محلی که باید فقط وقتی یک مدل انتخاب‌شده به آن‌ها نیاز دارد شروع شوند، ببینید
[سرویس‌های مدل محلی](/fa/gateway/local-model-services).

## حداقل سخت‌افزار

هدف را بالا بگیرید: **≥2 Mac Studio با حداکثر پیکربندی یا یک دستگاه GPU معادل (~$30k+)** برای یک حلقهٔ agent راحت. یک GPU تنها با **24 GB** فقط برای promptهای سبک‌تر با latency بالاتر جواب می‌دهد. همیشه **بزرگ‌ترین / نسخهٔ full-size که می‌توانید میزبانی کنید** را اجرا کنید؛ checkpointهای کوچک یا شدیداً quantized شده خطر prompt-injection را بالا می‌برند (ببینید [امنیت](/fa/gateway/security)).

## انتخاب backend

| Backend                                              | چه زمانی استفاده شود                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [ds4](/fa/providers/ds4)                                | DeepSeek V4 Flash محلی روی macOS Metal با فراخوانی‌های ابزار سازگار با OpenAI    |
| [LM Studio](/fa/providers/lmstudio)                     | راه‌اندازی محلی برای اولین بار، loader گرافیکی، Responses API بومی                    |
| LiteLLM / OAI-proxy / custom OpenAI-compatible proxy | وقتی جلوی API مدل دیگری قرار می‌گیرید و می‌خواهید OpenClaw آن را مثل OpenAI در نظر بگیرد         |
| MLX / vLLM / SGLang                                  | سرویس‌دهی self-hosted با throughput بالا و endpoint HTTP سازگار با OpenAI |
| [Ollama](/fa/providers/ollama)                          | workflow مبتنی بر CLI، کتابخانهٔ مدل، سرویس systemd بدون نیاز به دخالت                      |

وقتی backend پشتیبانی می‌کند (LM Studio پشتیبانی می‌کند)، از Responses API (`api: "openai-responses"`) استفاده کنید. در غیر این صورت به Chat Completions (`api: "openai-completions"`) پایبند بمانید.

<Warning>
**کاربران WSL2 + Ollama + NVIDIA/CUDA:** installer رسمی Ollama برای Linux یک سرویس systemd با `Restart=always` فعال می‌کند. در setupهای GPU روی WSL2، autostart می‌تواند آخرین مدل را هنگام boot دوباره بارگذاری کند و memory میزبان را pin کند. اگر VM WSL2 شما پس از فعال‌کردن Ollama مرتب restart می‌شود، ببینید [حلقهٔ crash در WSL2](/fa/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## پیشنهادی: LM Studio + مدل محلی بزرگ (Responses API)

بهترین stack محلی فعلی. یک مدل بزرگ را در LM Studio بارگذاری کنید (برای مثال، build کامل Qwen، DeepSeek، یا Llama)، سرور محلی را فعال کنید (پیش‌فرض `http://127.0.0.1:1234`)، و از Responses API استفاده کنید تا reasoning از متن نهایی جدا بماند.

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
- در LM Studio، **بزرگ‌ترین build مدل موجود** را دانلود کنید (از نسخه‌های "small"/شدیداً quantized شده پرهیز کنید)، سرور را start کنید، و تأیید کنید `http://127.0.0.1:1234/v1/models` آن را فهرست می‌کند.
- `my-local-model` را با ID واقعی مدل که در LM Studio نمایش داده شده جایگزین کنید.
- مدل را loaded نگه دارید؛ cold-load به startup latency اضافه می‌کند.
- اگر build شما در LM Studio متفاوت است، `contextWindow`/`maxTokens` را تنظیم کنید.
- برای WhatsApp، به Responses API پایبند بمانید تا فقط متن نهایی ارسال شود.

حتی وقتی local اجرا می‌کنید، مدل‌های hosted را پیکربندی‌شده نگه دارید؛ از `models.mode: "merge"` استفاده کنید تا fallbackها در دسترس بمانند.

### پیکربندی Hybrid: primary میزبانی‌شده، fallback محلی

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

### Local-first با safety net میزبانی‌شده

ترتیب primary و fallback را عوض کنید؛ همان block مربوط به providers و `models.mode: "merge"` را نگه دارید تا وقتی دستگاه local down است بتوانید به Sonnet یا Opus fallback کنید.

### میزبانی منطقه‌ای / routing داده

- نسخه‌های hosted MiniMax/Kimi/GLM روی OpenRouter با endpointهای ثابت‌شده به region (مثلاً US-hosted) هم وجود دارند. variant منطقه‌ای را آنجا انتخاب کنید تا traffic در jurisdiction منتخب شما بماند، در حالی که همچنان از `models.mode: "merge"` برای fallbackهای Anthropic/OpenAI استفاده می‌کنید.
- local-only قوی‌ترین مسیر privacy باقی می‌ماند؛ routing منطقه‌ای hosted زمانی راه میانه است که به ویژگی‌های provider نیاز دارید اما می‌خواهید روی جریان داده کنترل داشته باشید.

## proxyهای محلی دیگر سازگار با OpenAI

MLX (`mlx_lm.server`)، vLLM، SGLang، LiteLLM، OAI-proxy، یا gatewayهای سفارشی
اگر یک endpoint به سبک OpenAI با `/v1/chat/completions`
ارائه کنند کار می‌کنند. مگر اینکه backend صراحتاً پشتیبانی از
`/v1/responses` را مستند کرده باشد، از adapter مربوط به Chat Completions استفاده کنید. block provider بالا را با
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

اگر `api` در یک provider سفارشی با `baseUrl` حذف شود، OpenClaw به‌طور پیش‌فرض از
`openai-completions` استفاده می‌کند. ورودی‌های provider سفارشی/محلی به origin دقیق
`baseUrl` پیکربندی‌شدهٔ خود برای requestهای محافظت‌شدهٔ مدل اعتماد می‌کنند، از جمله loopback، LAN، tailnet،
و میزبان‌های DNS خصوصی. requestها به originهای خصوصی دیگر همچنان به
`request.allowPrivateNetwork: true` نیاز دارند؛ originهای metadata/link-local بدون opt-in صریح blocked می‌مانند. برای opt out از اعتماد به exact-origin، آن را روی `false` تنظیم کنید.

مقدار `models.providers.<id>.models[].id` محلیِ provider است. prefix مربوط به provider را
آنجا وارد نکنید. برای مثال، یک سرور MLX که با
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` start شده باید از این
catalog id و model ref استفاده کند:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

برای مدل‌های vision محلی یا proxied، `input: ["text", "image"]` را تنظیم کنید تا
attachmentهای تصویر به turnهای agent تزریق شوند. onboarding تعاملی custom-provider
IDهای رایج مدل vision را infer می‌کند و فقط برای نام‌های ناشناخته سؤال می‌پرسد.
onboarding غیرتعاملی از همان inference استفاده می‌کند؛ برای IDهای vision ناشناخته از `--custom-image-input`
یا وقتی مدلی که به نظر شناخته‌شده می‌آید پشت endpoint شما text-only است از `--custom-text-input` استفاده کنید.

`models.mode: "merge"` را نگه دارید تا مدل‌های hosted به‌عنوان fallback در دسترس بمانند.
برای سرورهای مدل محلی یا remote کند، قبل از بالا بردن `agents.defaults.timeoutSeconds` از
`models.providers.<id>.timeoutSeconds` استفاده کنید. timeout مربوط به provider
فقط روی requestهای HTTP مدل اعمال می‌شود، از جمله connect، headerها، body streaming،
و کل abort مربوط به guarded-fetch. اگر timeout مربوط به agent یا run پایین‌تر است، آن
سقف را هم بالا ببرید چون timeoutهای provider نمی‌توانند کل agent run را طولانی‌تر کنند.

<Note>
برای providerهای سفارشی سازگار با OpenAI، ذخیرهٔ یک marker محلی غیرمحرمانه مثل `apiKey: "ollama-local"` زمانی پذیرفته می‌شود که `baseUrl` به loopback، یک LAN خصوصی، `.local`، یا یک hostname ساده resolve شود. OpenClaw آن را به‌جای گزارش key گم‌شده، به‌عنوان credential محلی معتبر در نظر می‌گیرد. برای هر provider که hostname عمومی می‌پذیرد، از یک مقدار واقعی استفاده کنید.
</Note>

نکتهٔ رفتاری برای backendهای محلی/proxied `/v1`:

- OpenClaw این‌ها را routeهای proxy-style سازگار با OpenAI در نظر می‌گیرد، نه endpointهای بومی
  OpenAI
- شکل‌دهی request مخصوص OpenAI بومی اینجا اعمال نمی‌شود: نه
  `service_tier`، نه Responses `store`، نه شکل‌دهی payload سازگاری reasoning با OpenAI
  و نه hintهای prompt-cache
- headerهای attribution مخفی OpenClaw (`originator`, `version`, `User-Agent`)
  روی این URLهای proxy سفارشی تزریق نمی‌شوند

نکات compatibility برای backendهای سخت‌گیرتر سازگار با OpenAI:

- بعضی سرورها در Chat Completions فقط `messages[].content` رشته‌ای را می‌پذیرند، نه
  آرایه‌های structured content-part. برای
  آن endpointها `models.providers.<provider>.models[].compat.requiresStringContent: true` را تنظیم کنید.
- بعضی مدل‌های محلی requestهای ابزار bracketed مستقل را به‌صورت text منتشر می‌کنند، مانند
  `[tool_name]` و سپس JSON و `[END_TOOL_REQUEST]`. OpenClaw
  فقط وقتی آن‌ها را به tool call واقعی ارتقا می‌دهد که نام دقیقاً با یک ابزار registered
  برای آن turn match شود؛ در غیر این صورت block به‌عنوان متن unsupported در نظر گرفته می‌شود و از replyهای user-visible
  پنهان می‌ماند.
- اگر مدلی JSON، XML، یا متن ReAct-style منتشر کند که شبیه tool call
  است اما provider invocation ساختاریافته منتشر نکرده باشد، OpenClaw آن را به‌صورت
  text باقی می‌گذارد و با run id، provider/model، pattern شناسایی‌شده، و
  نام ابزار در صورت وجود warning لاگ می‌کند. این را incompatibility مربوط به tool-call در provider/model
  در نظر بگیرید، نه یک tool run کامل‌شده.
- اگر ابزارها به‌جای اجرا شدن به‌صورت assistant text ظاهر می‌شوند، برای مثال JSON خام،
  XML، syntax مربوط به ReAct، یا یک آرایهٔ `tool_calls` خالی در response provider،
  ابتدا تأیید کنید سرور از chat template/parser دارای قابلیت tool-call استفاده می‌کند. برای
  backendهای OpenAI-compatible Chat Completions که parser آن‌ها فقط وقتی tool
  use اجباری شده کار می‌کند، به‌جای تکیه بر text
  parsing یک override request per-model تنظیم کنید:

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

  از این فقط برای مدل‌ها/sessionهایی استفاده کنید که هر turn معمولی باید یک tool را call کند.
  این مقدار پیش‌فرض proxy در OpenClaw یعنی `tool_choice: "auto"` را override می‌کند.
  `local/my-local-model` را با provider/model ref دقیق نمایش‌داده‌شده توسط
  `openclaw models list` جایگزین کنید.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- اگر یک مدل سفارشی سازگار با OpenAI تلاش‌های reasoning فراتر از
  profile داخلی را می‌پذیرد، آن‌ها را روی block compat مدل declare کنید. اضافه کردن `"xhigh"`
  اینجا باعث می‌شود `/think xhigh`، session pickerها، validation مربوط به Gateway، و validation مربوط به `llm-task`
  آن سطح را برای provider/model ref پیکربندی‌شده expose کنند:

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

## بک‌اندهای کوچک‌تر یا سخت‌گیرتر

اگر مدل بدون مشکل بارگذاری می‌شود اما نوبت‌های کامل عامل رفتار نادرست دارند، از بالا به پایین کار کنید؛ ابتدا انتقال را تأیید کنید، سپس سطح را محدودتر کنید.

1. **تأیید کنید خود مدل محلی پاسخ می‌دهد.** بدون ابزار، بدون زمینه عامل:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **مسیریابی Gateway را تأیید کنید.** فقط prompt ارائه‌شده را می‌فرستد؛ transcript، راه‌اندازی AGENTS، سرهم‌سازی context-engine، ابزارها، و سرورهای MCP همراه را رد می‌کند، اما همچنان مسیریابی Gateway، احراز هویت، و انتخاب ارائه‌دهنده را آزمایش می‌کند:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **حالت سبک را امتحان کنید.** اگر هر دو کاوش موفق می‌شوند اما نوبت‌های عامل واقعی با فراخوانی‌های ابزار بدشکل یا اعلان‌های بیش از حد بزرگ شکست می‌خورند، `agents.defaults.experimental.localModelLean: true` را فعال کنید. این حالت سه ابزار پیش‌فرض سنگین‌تر (`browser`، `cron`، `message`) را حذف می‌کند و کاتالوگ‌های ابزار بزرگ‌تر را به‌صورت پیش‌فرض پشت کنترل‌های ساختاریافتهٔ جست‌وجوی ابزار قرار می‌دهد، به‌جز اجراهایی که باید معناشناسی تحویل مستقیم `message` را حفظ کنند. برای توضیح کامل، زمان استفاده، و روش تأیید فعال بودن آن، [ویژگی‌های آزمایشی ← حالت سبک مدل محلی](/fa/concepts/experimental-features#local-model-lean-mode) را ببینید.

4. **به‌عنوان آخرین راهکار، ابزارها را کاملاً غیرفعال کنید.** اگر حالت سبک کافی نیست، برای آن ورودی مدل `models.providers.<provider>.models[].compat.supportsTools: false` را تنظیم کنید. سپس عامل روی آن مدل بدون فراخوانی ابزار کار خواهد کرد.

5. **بعد از آن، گلوگاه در بالادست است.** اگر backend پس از حالت سبک و `supportsTools: false` همچنان فقط در اجراهای بزرگ‌تر OpenClaw شکست می‌خورد، مشکل باقی‌مانده معمولاً ظرفیت مدل یا سرور بالادست است — پنجرهٔ زمینه، حافظهٔ GPU، بیرون‌رانی kv-cache، یا یک باگ backend. در آن مرحله، این مشکل از لایهٔ انتقال OpenClaw نیست.

## عیب‌یابی

- آیا Gateway می‌تواند به proxy دسترسی پیدا کند؟ `curl http://127.0.0.1:1234/v1/models`.
- آیا مدل LM Studio بارگذاری نشده است؟ دوباره بارگذاری کنید؛ شروع سرد یکی از علت‌های رایج «گیر کردن» است.
- آیا سرور محلی `terminated`، `ECONNRESET` می‌گوید یا stream را در میانهٔ نوبت می‌بندد؟
  OpenClaw یک `model.call.error.failureKind` با کاردینالیتی پایین به‌همراه
  snapshot مربوط به RSS/heap فرایند OpenClaw را در diagnostics ثبت می‌کند. برای فشار
  حافظهٔ LM Studio/Ollama، آن timestamp را با لاگ سرور یا لاگ crash /
  jetsam در macOS تطبیق دهید تا تأیید کنید آیا model server کشته شده است یا نه.
- OpenClaw آستانه‌های preflight پنجرهٔ زمینه را از پنجرهٔ مدل شناسایی‌شده، یا هنگامی که `agents.defaults.contextTokens` پنجرهٔ مؤثر را کاهش می‌دهد از پنجرهٔ مدل بدون سقف، به‌دست می‌آورد. زیر 20٪ با کف **8k** هشدار می‌دهد. مسدودسازی‌های سخت از آستانهٔ 10٪ با کف **4k** استفاده می‌کنند و تا پنجرهٔ زمینهٔ مؤثر سقف‌گذاری می‌شوند تا metadata بیش از حد بزرگ مدل نتواند یک سقف کاربر معتبر را رد کند. اگر به آن preflight برخورد کردید، محدودیت زمینهٔ سرور/مدل را افزایش دهید یا مدل بزرگ‌تری انتخاب کنید.
- خطاهای زمینه دارید؟ `contextWindow` را کاهش دهید یا محدودیت سرور خود را افزایش دهید.
- آیا سرور سازگار با OpenAI مقدار `messages[].content ... expected a string` برمی‌گرداند؟
  روی آن ورودی مدل `compat.requiresStringContent: true` را اضافه کنید.
- آیا سرور سازگار با OpenAI مقدار `validation.keys` برمی‌گرداند یا می‌گوید ورودی‌های پیام فقط `role` و `content` را مجاز می‌دانند؟
  روی آن ورودی مدل `compat.strictMessageKeys: true` را اضافه کنید.
- فراخوانی‌های کوچک مستقیم `/v1/chat/completions` کار می‌کنند، اما `openclaw infer model run --local`
  روی Gemma یا مدل محلی دیگری شکست می‌خورد؟ ابتدا URL ارائه‌دهنده، ref مدل، نشانگر auth،
  و لاگ‌های سرور را بررسی کنید؛ `model run` محلی ابزارهای عامل را شامل نمی‌شود.
  اگر `model run` محلی موفق است اما نوبت‌های بزرگ‌تر عامل شکست می‌خورند، سطح ابزار عامل
  را با `localModelLean` یا `compat.supportsTools: false` کاهش دهید.
- آیا فراخوانی‌های ابزار به‌صورت متن خام JSON/XML/ReAct ظاهر می‌شوند، یا ارائه‌دهنده یک
  آرایهٔ خالی `tool_calls` برمی‌گرداند؟ proxyای اضافه نکنید که کورکورانه متن assistant
  را به اجرای ابزار تبدیل کند. ابتدا chat template/parser سرور را اصلاح کنید. اگر
  مدل فقط وقتی کار می‌کند که استفاده از ابزار اجباری باشد، override سطح مدل
  `params.extra_body.tool_choice: "required"` بالا را اضافه کنید و از آن ورودی مدل
  فقط برای sessionهایی استفاده کنید که در هر نوبت یک فراخوانی ابزار انتظار می‌رود.
- ایمنی: مدل‌های محلی فیلترهای سمت ارائه‌دهنده را دور می‌زنند؛ عامل‌ها را محدود نگه دارید و Compaction را روشن بگذارید تا شعاع اثر prompt injection محدود شود.

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference)
- [failover مدل](/fa/concepts/model-failover)

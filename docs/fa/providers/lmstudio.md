---
read_when:
    - می‌خواهید OpenClaw را با مدل‌های متن‌باز از طریق LM Studio اجرا کنید
    - می‌خواهید LM Studio را راه‌اندازی و پیکربندی کنید
summary: اجرای OpenClaw با LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-07-12T10:45:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b4223f90e786e285651fc889985dd61124c60758b4e9c3599d76201d9ac20b46
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio مدل‌های llama.cpp‏ (GGUF) یا MLX را به‌صورت محلی، در قالب یک برنامهٔ رابط گرافیکی یا daemon بدون رابط `llmster` اجرا می‌کند. برای راهنمای نصب و مستندات محصول، به [lmstudio.ai](https://lmstudio.ai/) مراجعه کنید.

## شروع سریع

<Steps>
  <Step title="نصب و راه‌اندازی سرور">
    LM Studio (نسخهٔ دسکتاپ) یا `llmster` (نسخهٔ بدون رابط) را نصب کنید، سپس سرور را راه‌اندازی کنید:

    ```bash
    lms server start --port 1234
    ```

    یا daemon بدون رابط را اجرا کنید:

    ```bash
    lms daemon up
    ```

    اگر از برنامهٔ دسکتاپ استفاده می‌کنید، برای بارگذاری روان مدل‌ها JIT را فعال کنید؛ به
    [راهنمای JIT و TTL در LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict) مراجعه کنید.

  </Step>
  <Step title="تنظیم کلید API در صورت فعال بودن احراز هویت">
    ```bash
    export LM_API_TOKEN="your-lm-studio-api-token"
    ```

    اگر احراز هویت LM Studio غیرفعال است، هنگام راه‌اندازی کلید API را خالی بگذارید. به
    [احراز هویت LM Studio](https://lmstudio.ai/docs/developer/core/authentication) مراجعه کنید.

  </Step>
  <Step title="اجرای فرایند راه‌اندازی اولیه">
    ```bash
    openclaw onboard
    ```

    `LM Studio` را انتخاب کنید، سپس در اعلان `Default model` یک مدل برگزینید.

  </Step>
</Steps>

برای تغییر مدل پیش‌فرض در آینده:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

کلیدهای مدل LM Studio از قالب `author/model-name` استفاده می‌کنند (برای مثال `qwen/qwen3.5-9b`)؛ ارجاع‌های مدل OpenClaw
نام ارائه‌دهنده را به ابتدای آن اضافه می‌کنند: `lmstudio/qwen/qwen3.5-9b`. برای یافتن کلید دقیق یک مدل، فرمان
زیر را اجرا کنید و فیلد `key` را بررسی کنید:

```bash
curl http://localhost:1234/api/v1/models
```

## راه‌اندازی اولیهٔ غیرتعاملی

```bash
openclaw onboard --non-interactive --accept-risk --auth-choice lmstudio
```

یا نشانی پایه، مدل و کلید API را به‌طور صریح مشخص کنید:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` کلید مدل بازگردانده‌شده توسط LM Studio را می‌پذیرد (برای مثال `qwen/qwen3.5-9b`)، بدون
پیشوند ارائه‌دهندهٔ `lmstudio/`. برای سرورهای دارای احراز هویت، `--lmstudio-api-key` را ارسال کنید (یا `LM_API_TOKEN` را تنظیم کنید)؛
برای سرورهای بدون احراز هویت آن را حذف کنید تا OpenClaw به‌جای آن یک نشانگر محلی و غیرمحرمانه ذخیره کند.
`--custom-api-key` همچنان برای سازگاری پذیرفته می‌شود، اما `--lmstudio-api-key` ترجیح داده می‌شود.

این کار `models.providers.lmstudio` را می‌نویسد و مدل پیش‌فرض را روی `lmstudio/<custom-model-id>` تنظیم می‌کند.
ارائهٔ یک کلید API همچنین پروفایل احراز هویت `lmstudio:default` را می‌نویسد.

راه‌اندازی تعاملی می‌تواند علاوه بر این، طول زمینهٔ بارگذاری ترجیحی را درخواست کند و آن را برای همهٔ
مدل‌های کشف‌شده‌ای که در پیکربندی ذخیره می‌کند اعمال کند.

## پیکربندی

### سازگاری مصرف در جریان‌دهی

LM Studio همیشه در پاسخ‌های جریانی یک شیء `usage` با ساختار OpenAI منتشر نمی‌کند. OpenClaw
به‌جای آن شمار توکن‌ها را از فرادادهٔ سبک llama.cpp یعنی `timings.prompt_n` و `timings.predicted_n`
بازیابی می‌کند. هر نقطهٔ پایانی سازگار با OpenAI که به‌عنوان نقطهٔ پایانی محلی (میزبان local loopback) تشخیص داده شود، همین
سازوکار جایگزین را دریافت می‌کند؛ این موضوع سایر بک‌اندهای محلی مانند vLLM، SGLang، llama.cpp، LocalAI، Jan، TabbyAPI
و text-generation-webui را نیز پوشش می‌دهد.

### سازگاری تفکر

هنگامی که کشف مدل از طریق `/api/v1/models` در LM Studio گزینه‌های استدلال مختص مدل را گزارش می‌کند، OpenClaw
مقادیر متناظر `reasoning_effort` یعنی (`none`، `minimal`، `low`، `medium`، `high`، `xhigh`) را در
فرادادهٔ سازگاری مدل ارائه می‌کند. برخی نسخه‌های LM Studio یک گزینهٔ دودویی رابط کاربری (`allowed_options: ["off",
"on"]`) را اعلام می‌کنند، اما همان مقادیر تحت‌اللفظی را در `/v1/chat/completions` رد می‌کنند؛ OpenClaw پیش از ارسال درخواست‌ها،
آن ساختار دودویی را به مقیاس شش‌سطحی تبدیل می‌کند؛ این تبدیل پیکربندی‌های ذخیره‌شدهٔ قدیمی را که هنوز نگاشت‌های استدلال
`off`/`on` دارند نیز شامل می‌شود.

### پیکربندی صریح

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "qwen/qwen3-coder-next",
            name: "Qwen 3 Coder Next",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### غیرفعال‌کردن پیش‌بارگذاری

LM Studio از بارگذاری به‌موقع (JIT) مدل پشتیبانی می‌کند و مدل‌ها را هنگام نخستین درخواست بارگذاری می‌کند. OpenClaw
به‌طور پیش‌فرض مدل‌ها را از طریق نقطهٔ پایانی بومی بارگذاری LM Studio پیش‌بارگذاری می‌کند؛ این کار زمانی مفید است که JIT
غیرفعال باشد. برای اینکه JIT در LM Studio، TTL زمان بیکاری و رفتار تخلیهٔ خودکار، چرخهٔ عمر مدل را مدیریت کنند،
مرحلهٔ پیش‌بارگذاری OpenClaw را غیرفعال کنید:

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        api: "openai-completions",
        params: { preload: false },
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

### میزبان LAN یا tailnet

از نشانی قابل‌دسترسی میزبان LM Studio استفاده کنید، `/v1` را حفظ کنید و مطمئن شوید LM Studio در آن دستگاه
روی نشانی‌ای فراتر از loopback مقید شده است:

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://gpu-box.local:1234/v1",
        apiKey: "lmstudio",
        api: "openai-completions",
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

`lmstudio` برای درخواست‌های مدل، به‌طور خودکار به نقطهٔ پایانی پیکربندی‌شدهٔ خود اعتماد می‌کند؛ از جمله میزبان‌های loopback،
LAN و tailnet (به‌جز مبدأهای فراداده یا link-local). هر ورودی ارائه‌دهندهٔ سفارشی/محلی سازگار با OpenAI
نیز همین اعتماد دقیقاً هم‌مبدأ را دریافت می‌کند. درخواست‌ها به یک میزبان یا درگاه خصوصی دیگر همچنان
به `models.providers.<id>.request.allowPrivateNetwork: true` نیاز دارند؛ برای انصراف از
اعتماد پیش‌فرض، آن را روی `false` تنظیم کنید.

## رفع اشکال

### LM Studio شناسایی نمی‌شود

مطمئن شوید LM Studio در حال اجرا است:

```bash
lms server start --port 1234
```

اگر احراز هویت فعال است، `LM_API_TOKEN` را نیز تنظیم کنید. دردسترس‌بودن API را بررسی کنید:

```bash
curl http://localhost:1234/api/v1/models
```

### خطاهای احراز هویت (HTTP 401)

- بررسی کنید که `LM_API_TOKEN` با کلید پیکربندی‌شده در LM Studio مطابقت داشته باشد.
- به [احراز هویت LM Studio](https://lmstudio.ai/docs/developer/core/authentication) مراجعه کنید.
- اگر سرور به احراز هویت نیاز ندارد، هنگام راه‌اندازی کلید را خالی بگذارید.

## مطالب مرتبط

- [انتخاب مدل](/fa/concepts/model-providers)
- [Ollama](/fa/providers/ollama)
- [مدل‌های محلی](/fa/gateway/local-models)

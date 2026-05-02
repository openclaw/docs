---
read_when:
    - می‌خواهید OpenClaw را با مدل‌های متن‌باز از طریق LM Studio اجرا کنید
    - می‌خواهید LM Studio را راه‌اندازی و پیکربندی کنید
summary: اجرای OpenClaw با LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-05-02T11:59:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3971bc471e5d8b0f142394b7b1897f8fdb2be283082245fbb2cf744d06143292
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio برنامه‌ای دوستانه اما قدرتمند برای اجرای مدل‌های open-weight روی سخت‌افزار خودتان است. این برنامه به شما امکان می‌دهد مدل‌های llama.cpp (GGUF) یا MLX (Apple Silicon) را اجرا کنید. به‌صورت بسته GUI یا daemon بدون رابط (`llmster`) عرضه می‌شود. برای مستندات محصول و راه‌اندازی، [lmstudio.ai](https://lmstudio.ai/) را ببینید.

## شروع سریع

1. LM Studio (دسکتاپ) یا `llmster` (بدون رابط) را نصب کنید، سپس سرور محلی را شروع کنید:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. سرور را شروع کنید

مطمئن شوید یا برنامه دسکتاپ را شروع کرده‌اید یا daemon را با فرمان زیر اجرا می‌کنید:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

اگر از برنامه استفاده می‌کنید، مطمئن شوید JIT برای تجربه‌ای روان فعال است. در [راهنمای JIT و TTL در LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict) بیشتر بیاموزید.

3. اگر احراز هویت LM Studio فعال است، `LM_API_TOKEN` را تنظیم کنید:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

اگر احراز هویت LM Studio غیرفعال است، می‌توانید هنگام راه‌اندازی تعاملی OpenClaw کلید API را خالی بگذارید.

برای جزئیات راه‌اندازی احراز هویت LM Studio، [احراز هویت LM Studio](https://lmstudio.ai/docs/developer/core/authentication) را ببینید.

4. فرایند onboarding را اجرا کنید و `LM Studio` را انتخاب کنید:

```bash
openclaw onboard
```

5. در onboarding، از اعلان `Default model` برای انتخاب مدل LM Studio خود استفاده کنید.

همچنین می‌توانید بعدا آن را تنظیم یا تغییر دهید:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

کلیدهای مدل LM Studio از قالب `author/model-name` پیروی می‌کنند (مثلا `qwen/qwen3.5-9b`). ارجاع‌های مدل OpenClaw
نام ارائه‌دهنده را در ابتدا اضافه می‌کنند: `lmstudio/qwen/qwen3.5-9b`. می‌توانید کلید دقیق یک مدل را با اجرای `curl http://localhost:1234/api/v1/models` و نگاه کردن به فیلد `key` پیدا کنید.

## Onboarding غیرتعاملی

وقتی می‌خواهید راه‌اندازی را اسکریپت کنید (CI، provisioning، bootstrap راه دور)، از onboarding غیرتعاملی استفاده کنید:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

یا URL پایه، مدل و کلید API اختیاری را مشخص کنید:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` کلید مدل را همان‌طور که LM Studio برمی‌گرداند می‌گیرد (مثلا `qwen/qwen3.5-9b`)، بدون
پیشوند ارائه‌دهنده `lmstudio/`.

برای سرورهای LM Studio احرازشده، `--lmstudio-api-key` را پاس دهید یا `LM_API_TOKEN` را تنظیم کنید.
برای سرورهای LM Studio بدون احراز هویت، کلید را حذف کنید؛ OpenClaw یک نشانگر محلی غیرمحرمانه ذخیره می‌کند.

`--custom-api-key` برای سازگاری همچنان پشتیبانی می‌شود، اما `--lmstudio-api-key` برای LM Studio ترجیح داده می‌شود.

این کار `models.providers.lmstudio` را می‌نویسد و مدل پیش‌فرض را روی
`lmstudio/<custom-model-id>` تنظیم می‌کند. وقتی یک کلید API ارائه می‌کنید، راه‌اندازی همچنین پروفایل احراز هویت
`lmstudio:default` را می‌نویسد.

راه‌اندازی تعاملی می‌تواند یک طول زمینه بارگذاری ترجیحی اختیاری را درخواست کند و آن را روی مدل‌های LM Studio کشف‌شده‌ای که در پیکربندی ذخیره می‌کند اعمال کند.
پیکربندی Plugin مربوط به LM Studio به endpoint پیکربندی‌شده LM Studio برای درخواست‌های مدل اعتماد می‌کند، از جمله میزبان‌های loopback، LAN و tailnet. می‌توانید با تنظیم `models.providers.lmstudio.request.allowPrivateNetwork: false` از این رفتار خارج شوید.

## پیکربندی

### سازگاری مصرف در streaming

LM Studio با مصرف در streaming سازگار است. وقتی یک شیء `usage` با شکل OpenAI منتشر نمی‌کند، OpenClaw به‌جای آن شمارش token را از metadata سبک llama.cpp یعنی
`timings.prompt_n` / `timings.predicted_n` بازیابی می‌کند.

همین رفتار مصرف در streaming برای این backendهای محلی سازگار با OpenAI اعمال می‌شود:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### سازگاری thinking

وقتی کشف `/api/v1/models` در LM Studio گزینه‌های reasoning ویژه مدل را گزارش می‌کند، OpenClaw آن مقادیر بومی را در metadata سازگاری مدل حفظ می‌کند. برای مدل‌های thinking دودویی که `allowed_options: ["off", "on"]` را اعلام می‌کنند،
OpenClaw thinking غیرفعال را به `off` و سطح‌های فعال `/think` را به `on` نگاشت می‌کند
به‌جای ارسال مقادیری که فقط مخصوص OpenAI هستند، مانند `low` یا `medium`.

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

## عیب‌یابی

### LM Studio شناسایی نشد

مطمئن شوید LM Studio در حال اجرا است. اگر احراز هویت فعال است، `LM_API_TOKEN` را هم تنظیم کنید:

```bash
# Start via desktop app, or headless:
lms server start --port 1234
```

قابل‌دسترسی بودن API را بررسی کنید:

```bash
curl http://localhost:1234/api/v1/models
```

### خطاهای احراز هویت (HTTP 401)

اگر راه‌اندازی HTTP 401 گزارش کرد، کلید API خود را بررسی کنید:

- بررسی کنید که `LM_API_TOKEN` با کلید پیکربندی‌شده در LM Studio مطابقت دارد.
- برای جزئیات راه‌اندازی احراز هویت LM Studio، [احراز هویت LM Studio](https://lmstudio.ai/docs/developer/core/authentication) را ببینید.
- اگر سرور شما به احراز هویت نیاز ندارد، هنگام راه‌اندازی کلید را خالی بگذارید.

### بارگذاری just-in-time مدل

LM Studio از بارگذاری just-in-time (JIT) مدل پشتیبانی می‌کند، جایی که مدل‌ها با نخستین درخواست بارگذاری می‌شوند. OpenClaw به‌طور پیش‌فرض مدل‌ها را از طریق endpoint بارگذاری بومی LM Studio از پیش بارگذاری می‌کند، که وقتی JIT غیرفعال است کمک می‌کند. برای اینکه JIT، TTL بیکاری و رفتار auto-evict در LM Studio مالک چرخه عمر مدل باشند، مرحله ازپیش‌بارگذاری OpenClaw را غیرفعال کنید:

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

### میزبان LM Studio روی LAN یا tailnet

از نشانی قابل‌دسترسی میزبان LM Studio استفاده کنید، `/v1` را نگه دارید، و مطمئن شوید LM Studio روی آن ماشین فراتر از loopback bind شده است:

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

برخلاف ارائه‌دهنده‌های عمومی سازگار با OpenAI، `lmstudio` به‌طور خودکار به endpoint محلی/خصوصی پیکربندی‌شده خود برای درخواست‌های محافظت‌شده مدل اعتماد می‌کند. شناسه‌های ارائه‌دهنده سفارشی loopback مانند `localhost` یا `127.0.0.1` نیز به‌طور خودکار مورد اعتماد هستند؛ برای شناسه‌های ارائه‌دهنده سفارشی LAN، tailnet یا DNS خصوصی، `models.providers.<id>.request.allowPrivateNetwork: true` را صریحا تنظیم کنید.

## مرتبط

- [انتخاب مدل](/fa/concepts/model-providers)
- [Ollama](/fa/providers/ollama)
- [مدل‌های محلی](/fa/gateway/local-models)

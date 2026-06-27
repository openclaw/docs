---
read_when:
    - می‌خواهید OpenClaw را با مدل‌های NovitaAI اجرا کنید
    - به شناسه provider، کلید یا endpoint نوویتا نیاز دارید
summary: از API سازگار با OpenAI متعلق به NovitaAI همراه با OpenClaw استفاده کنید
title: NovitaAI
x-i18n:
    generated_at: "2026-06-27T18:41:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 602df700662dbf2176acabcad7d23950e8240158f58d115f8e56bf1fb9f43bcb
    source_path: providers/novita.md
    workflow: 16
---

NovitaAI یک ارائه‌دهنده زیرساخت هوش مصنوعی میزبانی‌شده با API مدل سازگار با OpenAI است. در OpenClaw، این یک ارائه‌دهنده مدل بسته‌بندی‌شده است، بنابراین شناسه ارائه‌دهنده `novita` است، اعتبارنامه‌ها از مسیر معمول احراز هویت مدل عبور می‌کنند، و ارجاع‌های مدل شبیه `novita/deepseek/deepseek-v3-0324` هستند.

وقتی می‌خواهید بدون اجرای سرور استنتاج خودتان به مسیرهای مدل‌های وزن‌باز و مدل‌های شخص ثالث به‌صورت میزبانی‌شده دسترسی داشته باشید، از Novita استفاده کنید. کاتالوگ بسته‌بندی‌شده بر مدل‌های گفت‌وگویی تمرکز دارد که برای نوبت‌های عامل عملی هستند، از جمله مسیرهای DeepSeek، Moonshot، MiniMax، GLM، و Qwen که Novita ارائه می‌کند.

این ارائه‌دهنده از نقطه پایانی سازگار با OpenAI متعلق به Novita استفاده می‌کند. OpenClaw ثبت ارائه‌دهنده، احراز هویت، نام‌های مستعار، نرمال‌سازی ارجاع مدل، و انتخاب URL پایه را مدیریت می‌کند؛ Novita دسترس‌پذیری زنده مدل، مجوزهای حساب، قیمت‌گذاری، و محدودیت‌های نرخ را کنترل می‌کند.

## راه‌اندازی

یک کلید API در [novita.ai/settings/key-management](https://novita.ai/settings/key-management) بسازید، سپس اجرا کنید:

```bash
openclaw onboard --auth-choice novita-api-key
```

یا تنظیم کنید:

```bash
export NOVITA_API_KEY="<your-novita-api-key>" # pragma: allowlist secret
```

## پیش‌فرض‌ها

- ارائه‌دهنده: `novita`
- نام‌های مستعار: `novita-ai`, `novitaai`
- URL پایه: `https://api.novita.ai/openai/v1`
- متغیر محیطی: `NOVITA_API_KEY`
- مدل پیش‌فرض: `novita/deepseek/deepseek-v3-0324`

## چه زمانی Novita را انتخاب کنید

- می‌خواهید به مدل‌های وزن‌باز میزبانی‌شده با یک API سازگار با OpenAI دسترسی داشته باشید.
- می‌خواهید مسیرهای DeepSeek، Kimi، MiniMax، GLM، یا خانواده Qwen را از طریق یک حساب ارائه‌دهنده واحد داشته باشید.
- می‌خواهید یک مسیر جایگزین میزبانی‌شده دیگر در کنار OpenRouter، GMI، DeepInfra، یا APIهای مستقیم فروشنده داشته باشید.
- میزبانی مدل در سمت ارائه‌دهنده را به نگهداری زیرساخت vLLM، SGLang، LM Studio، یا Ollama ترجیح می‌دهید.

وقتی به پارامترهای درخواست بومی فروشنده یا قراردادهای پشتیبانی نیاز دارید، یک ارائه‌دهنده مستقیم فروشنده را انتخاب کنید. وقتی مدل باید روی سخت‌افزار خودتان یا پشت مرز شبکه خودتان اجرا شود، یک ارائه‌دهنده محلی را انتخاب کنید.

## مدل‌ها

کاتالوگ بسته‌بندی‌شده شناسه‌های مسیر رایج NovitaAI را از پیش فراهم می‌کند، از جمله:

- `novita/moonshotai/kimi-k2.5`
- `novita/minimax/minimax-m2.7`
- `novita/zai-org/glm-5`
- `novita/deepseek/deepseek-v3-0324`
- `novita/deepseek/deepseek-r1-0528`
- `novita/qwen/qwen3-235b-a22b-fp8`

کاتالوگ نقطه شروعی برای انتخاب مدل در OpenClaw است. حساب، منطقه، یا کاتالوگ فعلی Novita ممکن است مسیرهایی را اضافه، حذف، یا محدود کند. پیش از تنظیم یک پیش‌فرض بلندمدت، ارائه‌دهنده را از CLI بررسی کنید:

```bash
openclaw models list --provider novita
```

## عیب‌یابی

- `401` یا `403`: کلید را در صفحه مدیریت کلید Novita بررسی کنید و اگر پروفایل ذخیره‌شده قدیمی است، دوباره `openclaw onboard --auth-choice novita-api-key` را اجرا کنید.
- خطاهای مدل ناشناخته: از همان `novita/<route-id>` دقیق که توسط `openclaw models list --provider novita` برگردانده شده است استفاده کنید.
- مسیرهای کند یا ناموفق: یک مسیر مدل دیگر Novita را امتحان کنید یا Novita را برای بارهای کاری‌ای که می‌توانند نوسان ویژه ارائه‌دهنده را تحمل کنند، به‌عنوان ارائه‌دهنده جایگزین تنظیم کنید.

## مرتبط

- [ارائه‌دهندگان مدل](/fa/concepts/model-providers)
- [همه ارائه‌دهندگان](/fa/providers/index)

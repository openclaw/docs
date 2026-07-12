---
read_when:
    - می‌خواهید شناسه ارائه‌دهنده `qwen-oauth` را پیکربندی کنید
    - شما پیش‌تر از اعتبارنامه‌های OAuth پرتال Qwen استفاده کرده‌اید
    - به نقطهٔ پایانی پورتال Qwen یا راهنمای مهاجرت نیاز دارید
summary: از شناسه ارائه‌دهنده Qwen Portal با OpenClaw استفاده کنید
title: OAuth / پرتال Qwen
x-i18n:
    generated_at: "2026-07-12T10:46:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b78f6f23e62e38d11e6fe4e2bf515b13b414f276d08f672740ad94747a22c8fb
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` شناسهٔ ارائه‌دهندهٔ Qwen Portal است که توسط Plugin ‏Qwen
‏(`@openclaw/qwen-provider`) ثبت می‌شود. این ارائه‌دهنده نقطهٔ پایانی Qwen Portal در
`https://portal.qwen.ai/v1` را هدف قرار می‌دهد و امکان آدرس‌دهی به تنظیمات قدیمی‌تر
Qwen OAuth / پورتال را از طریق شناسهٔ ارائه‌دهنده‌ای متمایز و جدا از ارائه‌دهندهٔ
اصلی `qwen` حفظ می‌کند.

اگر از قبل یک توکن فعال Qwen Portal دارید، در حال مهاجرت از گردش‌کار قدیمی
Qwen OAuth یا Qwen CLI هستید، یا باید مشخصاً نقطهٔ پایانی Qwen Portal را آزمایش
کنید، `qwen-oauth` را انتخاب کنید. برای تنظیمات جدید، استفاده از
[Qwen](/fa/providers/qwen) با نقطهٔ پایانی استاندارد ModelStudio ترجیح داده می‌شود:
این گزینه تنظیمات جدید کلید API، انتخاب‌های گسترده‌تر نقطهٔ پایانی، پرداخت استاندارد
به‌ازای مصرف، Coding Plan و کاتالوگ کامل Plugin ‏Qwen را پوشش می‌دهد.

## راه‌اندازی

اگر هنوز Plugin ‏Qwen را نصب نکرده‌اید، آن را نصب کنید:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

توکن پورتال خود را از طریق فرایند آغازین ارائه کنید:

```bash
openclaw onboard --auth-choice qwen-oauth
```

اجراهای غیرتعاملی توکن را از `--qwen-oauth-token <token>` می‌خوانند؛ یا این متغیر را تنظیم کنید:

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

فرایند آغازین، توکن را در یک نمایهٔ احراز هویت `qwen-oauth` ذخیره می‌کند، کاتالوگ
مدل پورتال را مقداردهی اولیه می‌کند و در صورت پیکربندی‌نشدن هیچ مدلی،
`qwen-oauth/qwen3.5-plus` را به‌عنوان مدل پیش‌فرض تنظیم می‌کند.

## پیش‌فرض‌ها

- ارائه‌دهنده: `qwen-oauth`
- نام‌های مستعار: `qwen-portal`، `qwen-cli`
- نشانی پایه: `https://portal.qwen.ai/v1`
- متغیر محیطی: `QWEN_API_KEY`
- سبک API: سازگار با OpenAI
- مدل پیش‌فرض: `qwen-oauth/qwen3.5-plus`

## تفاوت این ارائه‌دهنده با Qwen

OpenClaw دو شناسهٔ ارائه‌دهنده برای Qwen دارد:

| ارائه‌دهنده   | خانوادهٔ نقطهٔ پایانی                                      | مناسب برای                                                                                             |
| ------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `qwen`        | نقاط پایانی Qwen Cloud / Alibaba DashScope و Coding Plan   | تنظیمات جدید کلید API، پرداخت استاندارد به‌ازای مصرف، Coding Plan و قابلیت‌های چندوجهی DashScope      |
| `qwen-oauth`  | نقطهٔ پایانی Qwen Portal در `portal.qwen.ai/v1`            | توکن‌های موجود Qwen Portal و تنظیمات قدیمی Qwen OAuth / CLI                                           |

هر دو ارائه‌دهنده از قالب درخواست سازگار با OpenAI استفاده می‌کنند، اما سطوح
احراز هویت آن‌ها جدا است. توکنی که برای `qwen-oauth` ذخیره شده است نباید به‌عنوان
کلید DashScope یا ModelStudio در نظر گرفته شود؛ همچنین برای یک کلید جدید DashScope
باید به‌جای آن از ارائه‌دهندهٔ اصلی `qwen` استفاده شود.

## مدل‌ها

Plugin ‏Qwen این کاتالوگ ایستا را برای نقطهٔ پایانی Qwen Portal مقداردهی اولیه
می‌کند. حداکثر خروجی همهٔ ورودی‌ها ۶۵٬۵۳۶ توکن است؛ دسترس‌پذیری به حساب و توکن
فعلی Qwen Portal بستگی دارد.

| ارجاع مدل                         | ورودی       | زمینه     | توضیحات       |
| --------------------------------- | ----------- | ---------- | ------------- |
| `qwen-oauth/qwen3.5-plus`         | متن، تصویر  | ۱٬۰۰۰٬۰۰۰ | مدل پیش‌فرض   |
| `qwen-oauth/qwen3.6-plus`         | متن، تصویر  | ۱٬۰۰۰٬۰۰۰ |               |
| `qwen-oauth/qwen3-max-2026-01-23` | متن         | ۲۶۲٬۱۴۴   |               |
| `qwen-oauth/qwen3-coder-next`     | متن         | ۲۶۲٬۱۴۴   |               |
| `qwen-oauth/qwen3-coder-plus`     | متن         | ۱٬۰۰۰٬۰۰۰ |               |
| `qwen-oauth/MiniMax-M2.5`         | متن         | ۱٬۰۰۰٬۰۰۰ | استدلال       |
| `qwen-oauth/glm-5`                | متن         | ۲۰۲٬۷۵۲   |               |
| `qwen-oauth/glm-4.7`              | متن         | ۲۰۲٬۷۵۲   |               |
| `qwen-oauth/kimi-k2.5`            | متن، تصویر  | ۲۶۲٬۱۴۴   |               |

اگر حساب شما به‌جای آن از کلیدهای API مربوط به ModelStudio / DashScope استفاده
می‌کند، ارائه‌دهندهٔ اصلی `qwen` را پیکربندی کنید:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## مهاجرت

نمایه‌های قدیمی Qwen Portal OAuth قابل نوسازی نیستند؛ `openclaw doctor` آن‌ها را
علامت‌گذاری می‌کند. اگر یک نمایهٔ پورتال از کار افتاد، فرایند آغازین را با یک توکن
فعلی دوباره اجرا کنید یا به ارائه‌دهندهٔ استاندارد Qwen تغییر دهید:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

ModelStudio استاندارد جهانی از این نشانی استفاده می‌کند:

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## رفع اشکال

- خطاهای نوسازی OAuth پورتال: نمایه‌های قدیمی Qwen Portal OAuth قابل نوسازی
  نیستند. فرایند آغازین را با یک توکن فعلی دوباره اجرا کنید.
- خطاهای نقطهٔ پایانی نادرست: هنگام استفاده از توکن پورتال، تأیید کنید ارجاع مدل
  با `qwen-oauth/` آغاز می‌شود. ارجاع‌های `qwen/` را فقط برای ارائه‌دهندهٔ اصلی
  Qwen به کار ببرید.
- ابهام دربارهٔ `QWEN_API_KEY`: هر دو صفحهٔ Qwen به این متغیر محیطی اشاره می‌کنند،
  اما فرایند آغازین اعتبارنامه‌ها را زیر شناسهٔ ارائه‌دهندهٔ انتخاب‌شده ذخیره
  می‌کند. وقتی هر دو ارائه‌دهندهٔ `qwen` و `qwen-oauth` را روی یک دستگاه در دسترس
  نگه می‌دارید، استفاده از فرایند آغازین ترجیح داده می‌شود.

## مطالب مرتبط

- [Qwen](/fa/providers/qwen)
- [Alibaba Model Studio](/fa/providers/alibaba)
- [ارائه‌دهندگان مدل](/fa/concepts/model-providers)
- [همهٔ ارائه‌دهندگان](/fa/providers/index)

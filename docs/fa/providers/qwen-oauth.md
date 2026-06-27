---
read_when:
    - می‌خواهید شناسهٔ ارائه‌دهندهٔ qwen-oauth را پیکربندی کنید
    - شما قبلاً از اعتبارنامه‌های OAuth مربوط به Qwen Portal استفاده کرده‌اید
    - به نقطه پایانی Qwen Portal یا راهنمای مهاجرت نیاز دارید
summary: از شناسه ارائه‌دهنده Qwen Portal با OpenClaw استفاده کنید
title: Qwen OAuth / پرتال
x-i18n:
    generated_at: "2026-06-27T18:43:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 46f147e3730024bf63e99827f666e2be791318723eace98941ca067c440dddd0
    source_path: providers/qwen-oauth.md
    workflow: 16
---

`qwen-oauth` شناسه ارائه‌دهنده Qwen Portal است. این شناسه نقطه پایانی Qwen Portal را هدف می‌گیرد
و راه‌اندازی‌های قدیمی‌تر Qwen OAuth / portal را از طریق یک شناسه ارائه‌دهنده متمایز
قابل آدرس‌دهی نگه می‌دارد.

از این ارائه‌دهنده زمانی استفاده کنید که مشخصا یک توکن فعلی Qwen Portal برای
`https://portal.qwen.ai/v1` دارید، یا وقتی در حال مهاجرت از یک راه‌اندازی قدیمی‌تر Qwen Portal /
Qwen CLI هستید و می‌خواهید آن اعتبارنامه‌ها را جدا از ارائه‌دهنده مرجع
Qwen Cloud نگه دارید. این گزینه برای کاربران جدید Qwen انتخاب اول پیشنهادی نیست.

برای راه‌اندازی‌های جدید Qwen Cloud، مگر اینکه مشخصا یک توکن فعلی Qwen Portal داشته باشید،
[Qwen](/fa/providers/qwen) را با نقطه پایانی Standard
ModelStudio ترجیح دهید.

## راه‌اندازی

توکن portal خود را از طریق راه‌اندازی اولیه ارائه کنید:

```bash
openclaw onboard --auth-choice qwen-oauth
```

یا تنظیم کنید:

```bash
export QWEN_API_KEY="<your-qwen-portal-token>" # pragma: allowlist secret
```

## پیش‌فرض‌ها

- ارائه‌دهنده: `qwen-oauth`
- نام‌های مستعار: `qwen-portal`, `qwen-cli`
- نشانی پایه: `https://portal.qwen.ai/v1`
- متغیر محیطی: `QWEN_API_KEY`
- سبک API: سازگار با OpenAI
- مدل پیش‌فرض: `qwen-oauth/qwen3.5-plus`

## تفاوت این با Qwen

OpenClaw دو شناسه ارائه‌دهنده رو به Qwen دارد:

| ارائه‌دهنده | خانواده نقطه پایانی | مناسب برای |
| ------------ | -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `qwen` | Qwen Cloud / نقاط پایانی Alibaba DashScope و Coding Plan | راه‌اندازی‌های جدید با کلید API، پرداخت به‌ازای مصرف Standard، Coding Plan، قابلیت‌های چندوجهی DashScope |
| `qwen-oauth` | نقطه پایانی Qwen Portal در `portal.qwen.ai/v1` | توکن‌های موجود Qwen Portal و راه‌اندازی‌های قدیمی Qwen OAuth / CLI |

هر دو ارائه‌دهنده از قالب‌های درخواست سازگار با OpenAI استفاده می‌کنند، اما سطح‌های احراز هویت
جداگانه‌ای هستند. توکنی که برای `qwen-oauth` ذخیره شده نباید به‌عنوان کلید DashScope
یا ModelStudio در نظر گرفته شود، و یک کلید جدید DashScope باید به‌جای آن از ارائه‌دهنده مرجع `qwen`
استفاده کند.

## چه زمانی Qwen OAuth / Portal را انتخاب کنید

- از قبل یک توکن کارآمد Qwen Portal دارید.
- در حال حفظ یک گردش‌کار قدیمی Qwen OAuth یا Qwen CLI هنگام انتقال به
  مدل ارائه‌دهنده OpenClaw هستید.
- لازم است سازگاری را مشخصا با نقطه پایانی Qwen Portal آزمایش کنید.

برای راه‌اندازی جدید، انتخاب‌های گسترده‌تر نقطه پایانی، Standard
ModelStudio، Coding Plan، و کاتالوگ کامل Pluginهای Qwen، [Qwen](/fa/providers/qwen) را انتخاب کنید.

## مدل‌ها

کاتالوگ Pluginهای Qwen پیش‌فرض Qwen Portal را مقداردهی اولیه می‌کند:

- `qwen-oauth/qwen3.5-plus`

دردسترس‌بودن به حساب و توکن فعلی Qwen Portal بستگی دارد. اگر حساب شما به‌جای آن از کلیدهای API
برای ModelStudio / DashScope استفاده می‌کند، ارائه‌دهنده مرجع
`qwen` را پیکربندی کنید:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
openclaw models set qwen/qwen3-coder-plus
```

## مهاجرت

پروفایل‌های قدیمی Qwen Portal OAuth ممکن است قابل نوسازی نباشند. اگر یک پروفایل portal
از کار افتاد، با یک توکن فعلی دوباره احراز هویت کنید یا به ارائه‌دهنده Standard
Qwen تغییر دهید:

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

ModelStudio سراسری Standard از این استفاده می‌کند:

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## عیب‌یابی

- شکست‌های نوسازی Portal OAuth: پروفایل‌های قدیمی Qwen Portal OAuth ممکن است
  قابل نوسازی نباشند. راه‌اندازی اولیه را با یک توکن فعلی دوباره اجرا کنید.
- خطاهای نقطه پایانی نادرست: هنگام استفاده از توکن portal، تأیید کنید که ارجاع مدل با `qwen-oauth/` شروع می‌شود.
  از ارجاع‌های `qwen/` فقط برای ارائه‌دهنده مرجع Qwen استفاده کنید.
- سردرگمی `QWEN_API_KEY`: هر دو صفحه Qwen این متغیر محیطی را ذکر می‌کنند، اما راه‌اندازی اولیه
  اعتبارنامه‌ها را زیر شناسه ارائه‌دهنده انتخاب‌شده ذخیره می‌کند. وقتی می‌خواهید هر دو
  `qwen` و `qwen-oauth` را روی یک دستگاه در دسترس نگه دارید، راه‌اندازی اولیه را ترجیح دهید.

## مرتبط

- [Qwen](/fa/providers/qwen)
- [Alibaba Model Studio](/fa/providers/alibaba)
- [ارائه‌دهندگان مدل](/fa/concepts/model-providers)
- [همه ارائه‌دهندگان](/fa/providers/index)

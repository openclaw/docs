---
read_when:
    - می‌خواهید PDFها را از عامل‌ها تحلیل کنید
    - به پارامترها و محدودیت‌های دقیق ابزار PDF نیاز دارید
    - شما در حال اشکال‌زدایی حالت PDF بومی در برابر مسیر جایگزین استخراج هستید
summary: یک یا چند سند PDF را با پشتیبانی بومی ارائه‌دهنده و fallback استخراج تحلیل کنید
title: ابزار PDF
x-i18n:
    generated_at: "2026-06-27T19:03:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6cce4328a7457f30b8c64abdcfa94b6a5d5649c2bcdfde3187288b11a0e154b1
    source_path: tools/pdf.md
    workflow: 16
---

`pdf` یک یا چند سند PDF را تحلیل می‌کند و متن برمی‌گرداند.

رفتار سریع:

- حالت ارائه‌دهنده بومی برای ارائه‌دهندگان مدل Anthropic و Google.
- حالت fallback استخراج برای ارائه‌دهندگان دیگر؛ ابتدا متن استخراج می‌شود و سپس در صورت نیاز تصاویر صفحه‌ها.
- از ورودی تکی (`pdf`) یا چندتایی (`pdfs`) پشتیبانی می‌کند؛ حداکثر ۱۰ PDF در هر فراخوانی.

## دسترس‌پذیری

این ابزار فقط زمانی ثبت می‌شود که OpenClaw بتواند یک پیکربندی مدل دارای قابلیت PDF را برای عامل resolve کند:

1. `agents.defaults.pdfModel`
2. fallback به `agents.defaults.imageModel`
3. fallback به مدل resolve‌شده نشست/پیش‌فرض عامل
4. اگر ارائه‌دهندگان PDF بومی مبتنی بر احراز هویت باشند، آن‌ها را جلوتر از نامزدهای fallback تصویر عمومی ترجیح می‌دهد

اگر هیچ مدل قابل استفاده‌ای قابل resolve نباشد، ابزار `pdf` عرضه نمی‌شود.

نکات دسترس‌پذیری:

- زنجیره fallback نسبت به احراز هویت آگاه است. یک `provider/model` پیکربندی‌شده فقط زمانی حساب می‌شود که
  OpenClaw واقعاً بتواند آن ارائه‌دهنده را برای عامل احراز هویت کند.
- ارائه‌دهندگان PDF بومی در حال حاضر **Anthropic** و **Google** هستند.
- اگر ارائه‌دهنده resolve‌شده نشست/پیش‌فرض از قبل یک مدل vision/PDF
  پیکربندی‌شده داشته باشد، ابزار PDF پیش از fallback به ارائه‌دهندگان
  مبتنی بر احراز هویت دیگر، از همان دوباره استفاده می‌کند.

## مرجع ورودی

<ParamField path="pdf" type="string">
یک مسیر یا URL برای PDF.
</ParamField>

<ParamField path="pdfs" type="string[]">
چند مسیر یا URL برای PDF، در مجموع تا ۱۰ مورد.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
پرامپت تحلیل.
</ParamField>

<ParamField path="pages" type="string">
فیلتر صفحه مانند `1-5` یا `1,3,7-9`.
</ParamField>

<ParamField path="password" type="string">
رمز عبور برای PDFهای رمزگذاری‌شده در حالت fallback استخراج.
</ParamField>

<ParamField path="model" type="string">
override اختیاری مدل در قالب `provider/model`.
</ParamField>

<ParamField path="maxBytesMb" type="number">
سقف اندازه برای هر PDF بر حسب مگابایت. پیش‌فرض `agents.defaults.pdfMaxBytesMb` یا `10` است.
</ParamField>

نکات ورودی:

- `pdf` و `pdfs` پیش از بارگذاری ادغام و deduplicate می‌شوند.
- اگر هیچ ورودی PDF ارائه نشود، ابزار خطا می‌دهد.
- `pages` به‌عنوان شماره صفحه‌های یک‌مبنایی parse می‌شود، dedupe، مرتب، و به حداکثر صفحه‌های پیکربندی‌شده clamp می‌شود.
- `password` برای همه PDFهای داخل درخواست اعمال می‌شود و فقط توسط حالت fallback استخراج استفاده می‌شود.
- `maxBytesMb` به‌صورت پیش‌فرض `agents.defaults.pdfMaxBytesMb` یا `10` است.

## ارجاع‌های PDF پشتیبانی‌شده

- مسیر فایل محلی (شامل گسترش `~`)
- URL از نوع `file://`
- URLهای `http://` و `https://`
- ارجاع‌های ورودی مدیریت‌شده توسط OpenClaw مانند `media://inbound/<id>`

نکات ارجاع:

- طرح‌های URI دیگر (برای مثال `ftp://`) با `unsupported_pdf_reference` رد می‌شوند.
- در حالت sandbox، URLهای راه‌دور `http(s)` رد می‌شوند.
- وقتی سیاست فایل فقط-workspace فعال باشد، مسیرهای فایل محلی خارج از rootهای مجاز رد می‌شوند.
- ارجاع‌های ورودی مدیریت‌شده و مسیرهای replayشده زیر فروشگاه رسانه ورودی OpenClaw با سیاست فایل فقط-workspace مجاز هستند.

## حالت‌های اجرا

### حالت ارائه‌دهنده بومی

حالت بومی برای ارائه‌دهنده‌های `anthropic` و `google` استفاده می‌شود.
ابزار بایت‌های خام PDF را مستقیماً به APIهای ارائه‌دهنده می‌فرستد.

محدودیت‌های حالت بومی:

- `pages` پشتیبانی نمی‌شود. اگر تنظیم شود، ابزار خطا برمی‌گرداند.
- `password` پشتیبانی نمی‌شود. برای تحلیل PDFهای رمزگذاری‌شده از یک مدل غیر بومی استفاده کنید.
- ورودی چند-PDF پشتیبانی می‌شود؛ هر PDF پیش از پرامپت به‌عنوان یک بلوک سند بومی /
  بخش PDF inline ارسال می‌شود.

### حالت fallback استخراج

حالت fallback برای ارائه‌دهندگان غیر بومی استفاده می‌شود.

جریان:

1. متن را از صفحه‌های انتخاب‌شده استخراج کن (تا `agents.defaults.pdfMaxPages`، پیش‌فرض `20`).
2. اگر طول متن استخراج‌شده کمتر از `200` نویسه باشد، صفحه‌های انتخاب‌شده را به تصاویر PNG render کن و آن‌ها را شامل کن.
3. محتوای استخراج‌شده به‌همراه پرامپت را به مدل انتخاب‌شده بفرست.

جزئیات fallback:

- استخراج تصویر صفحه از بودجه پیکسلی `4,000,000` استفاده می‌کند.
- PDFهای رمزگذاری‌شده را می‌توان با پارامتر سطح بالای `password` باز کرد.
- اگر مدل هدف از ورودی تصویر پشتیبانی نکند و هیچ متن قابل استخراجی وجود نداشته باشد، ابزار خطا می‌دهد.
- اگر استخراج متن موفق شود اما استخراج تصویر روی یک مدل فقط-متن به vision نیاز داشته باشد،
  OpenClaw تصاویر renderشده را کنار می‌گذارد و با متن
  استخراج‌شده ادامه می‌دهد.
- fallback استخراج از Plugin همراه `document-extract` استفاده می‌کند. این Plugin مالک
  `clawpdf` است که استخراج متن و render تصویر را از طریق PDFium
  WebAssembly فراهم می‌کند.

## پیکربندی

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

برای جزئیات کامل فیلدها، [مرجع پیکربندی](/fa/gateway/configuration-reference) را ببینید.

## جزئیات خروجی

ابزار متن را در `content[0].text` و metadata ساخت‌یافته را در `details` برمی‌گرداند.

فیلدهای رایج `details`:

- `model`: ارجاع مدل resolve‌شده (`provider/model`)
- `native`: در حالت ارائه‌دهنده بومی `true`، و برای fallback برابر `false`
- `attempts`: تلاش‌های fallback که پیش از موفقیت شکست خورده‌اند

فیلدهای مسیر:

- ورودی PDF تکی: `details.pdf`
- ورودی‌های PDF چندتایی: `details.pdfs[]` با ورودی‌های `pdf`
- metadata بازنویسی مسیر sandbox (وقتی کاربرد دارد): `rewrittenFrom`

## رفتار خطا

- ورودی PDF غایب: خطای `pdf required: provide a path or URL to a PDF document` را throw می‌کند
- تعداد PDF بیش از حد: خطای ساخت‌یافته را در `details.error = "too_many_pdfs"` برمی‌گرداند
- طرح ارجاع پشتیبانی‌نشده: `details.error = "unsupported_pdf_reference"` را برمی‌گرداند
- حالت بومی با `pages`: خطای واضح `pages is not supported with native PDF providers` را throw می‌کند

## مثال‌ها

PDF تکی:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

چند PDF:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

مدل fallback با فیلتر صفحه:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

PDF رمزگذاری‌شده با fallback استخراج:

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Summarize this contract"
}
```

## مرتبط

- [نمای کلی ابزارها](/fa/tools) - همه ابزارهای عامل موجود
- [مرجع پیکربندی](/fa/gateway/config-agents#agent-defaults) - پیکربندی pdfMaxBytesMb و pdfMaxPages

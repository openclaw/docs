---
read_when:
    - پیاده‌سازی پنل Canvas در macOS
    - افزودن کنترل‌های عامل برای فضای کاری بصری
    - اشکال‌زدایی بارگذاری‌های canvas در WKWebView
summary: پنل Canvas تحت کنترل عامل، تعبیه‌شده از طریق WKWebView و طرح‌واره URL سفارشی
title: بوم
x-i18n:
    generated_at: "2026-07-16T16:49:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 21955803c39debfbc34851a0c40a69c1f3c6ca009526d9929a4c429ad0b09084
    source_path: platforms/mac/canvas.md
    workflow: 16
---

برنامه macOS یک **پنل Canvas** تحت کنترل عامل را با استفاده از `WKWebView` تعبیه می‌کند؛
یک فضای کاری بصری سبک برای HTML/CSS/JS،‏ A2UI و سطوح کوچک و تعاملی
رابط کاربری.

## محل قرارگیری Canvas

وضعیت Canvas در Application Support ذخیره می‌شود:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

پنل Canvas این فایل‌ها را از طریق یک طرح URL سفارشی،
`openclaw-canvas://<session>/<path>`، ارائه می‌کند:

- `openclaw-canvas://main/` -> `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` -> `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` -> `<canvasRoot>/main/widgets/todo/index.html`

اگر هیچ `index.html` در ریشه وجود نداشته باشد، برنامه یک صفحه داربست داخلی نمایش می‌دهد.

## رفتار پنل

- پنلی بدون حاشیه و با قابلیت تغییر اندازه که نزدیک نوار منو (یا نشانگر ماوس) قرار می‌گیرد.
- اندازه/موقعیت را برای هر نشست به خاطر می‌سپارد.
- با تغییر فایل‌های محلی Canvas، به‌طور خودکار بارگذاری مجدد می‌شود.
- در هر لحظه فقط یک پنل Canvas قابل مشاهده است (نشست در صورت نیاز تغییر می‌کند).

Canvas را می‌توان از تنظیمات -> **اجازه‌دادن به Canvas** غیرفعال کرد. در حالت غیرفعال،
فرمان‌های Node مربوط به Canvas مقدار `CANVAS_DISABLED` را برمی‌گردانند.

## سطح API عامل

Canvas از طریق WebSocket متعلق به Gateway در دسترس قرار می‌گیرد، بنابراین عامل می‌تواند
پنل را نمایش دهد یا پنهان کند، به یک مسیر یا URL برود، JavaScript را ارزیابی کند و یک
تصویر لحظه‌ای ثبت کند:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

`canvas.navigate` مسیرهای محلی Canvas،‏ URLهای `http(s)` و URLهای `file://` را
می‌پذیرد. ارسال `"/"` داربست محلی یا `index.html` را نمایش می‌دهد.

مقصدهای میزبانی‌شده توسط Gateway در `/__openclaw__/canvas/` و
`/__openclaw__/a2ui/` از طریق URL فعلی و محدودشده Canvas در نشست Node
تفکیک می‌شوند. برنامه پیش از پیمایش، این قابلیت کوتاه‌عمر را تازه‌سازی می‌کند؛
نیازی نیست خودتان URL قابلیت را بسازید یا کپی کنید.

## A2UI در Canvas

A2UI توسط میزبان Canvas متعلق به Gateway میزبانی و درون پنل Canvas
رندر می‌شود. وقتی Gateway وجود میزبان Canvas را اعلام می‌کند، برنامه macOS هنگام نخستین بازشدن،
به‌طور خودکار به صفحه میزبان A2UI می‌رود.

URL اعلام‌شده به یک قابلیت محدود است؛ برای مثال
`http://<gateway-host>:18789/__openclaw__/cap/<token>/__openclaw__/a2ui/?platform=macos`.
با آن مانند اعتبارنامه‌ای موقت رفتار کنید، نه یک پیوند پایدار.

### فرمان‌های A2UI (v0.8)

Canvas پیام‌های سرور به کلاینت A2UI v0.8 را می‌پذیرد: `beginRendering`،
`surfaceUpdate`،‏ `dataModelUpdate`،‏ `deleteSurface`. ‏`createSurface` (v0.9)
هنوز پشتیبانی نمی‌شود.

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas ‏(A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"اگر می‌توانید این متن را بخوانید، ارسال A2UI کار می‌کند."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

آزمون سریع دود:

```bash
openclaw nodes canvas a2ui push --node <id> --text "سلام از A2UI"
```

## راه‌اندازی اجرای عامل از Canvas

Canvas می‌تواند از طریق پیوندهای عمیق `openclaw://agent?...` اجرای جدید عامل را راه‌اندازی کند:

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

پارامترهای پرس‌وجوی پشتیبانی‌شده:

| پارامتر                     | مفهوم                                                 |
| -------------------------- | ----------------------------------------------------- |
| `message`                  | درخواست ازپیش‌پرشده عامل.                             |
| `sessionKey`               | شناسه پایدار نشست.                                    |
| `thinking`                 | نمایه اختیاری تفکر.                                   |
| `deliver`، `to`، `channel` | مقصد تحویل.                                           |
| `timeoutSeconds`           | مهلت زمانی اختیاری اجرا.                              |
| `key`                      | توکن ایمنی تولیدشده توسط برنامه برای فراخوان‌های محلی مورد اعتماد. |

برنامه درخواست تأیید می‌کند، مگر اینکه یک کلید معتبر ارائه شود. پیوندهای
بدون کلید، پیام و URL را پیش از تأیید نمایش می‌دهند و فیلدهای مسیریابی تحویل را
نادیده می‌گیرند؛ پیوندهای کلیددار از مسیر عادی اجرای Gateway استفاده می‌کنند.

## نکات امنیتی

- طرح Canvas پیمایش پوشه‌ای را مسدود می‌کند؛ فایل‌ها باید زیر ریشه نشست قرار داشته باشند.
- محتوای محلی Canvas از یک طرح سفارشی استفاده می‌کند (به سرور loopback نیازی نیست).
- URLهای خارجی `http(s)` فقط هنگامی مجازند که صراحتاً به آن‌ها پیمایش شود.
- صفحه‌های وب عادی فقط قابل رندر هستند. کنش‌های عامل تنها از طرح Canvas
  متعلق به برنامه یا دقیقاً سند A2UI محدودشده به قابلیت Gateway که
  برنامه انتخاب کرده است پذیرفته می‌شوند؛ زیرقاب‌ها، تغییرمسیرها، قابلیت‌های منقضی و
  پرس‌وجوهای تغییریافته نمی‌توانند کنشی را ارسال کنند.

## مرتبط

- [برنامه macOS](/fa/platforms/macos)
- [WebChat](/fa/web/webchat)

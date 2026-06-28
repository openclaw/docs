---
read_when:
    - پیاده‌سازی پنل بوم macOS
    - افزودن کنترل‌های عامل برای فضای کاری بصری
    - اشکال‌زدایی بارگذاری‌های canvas در WKWebView
summary: پنل Canvas کنترل‌شده توسط عامل، جاسازی‌شده از طریق WKWebView + شِمای URL سفارشی
title: بوم
x-i18n:
    generated_at: "2026-06-28T00:13:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 45f0e1b27fbe58e85d57dbf35a6eb44d47df30569b8b10ed24e8bd240b4b5686
    source_path: platforms/mac/canvas.md
    workflow: 16
---

اپ macOS یک **پنل Canvas** کنترل‌شده توسط عامل را با استفاده از `WKWebView` تعبیه می‌کند. این
یک فضای کاری بصری سبک برای HTML/CSS/JS، A2UI و سطح‌های کوچک UI
تعاملی است.

## محل قرارگیری Canvas

وضعیت Canvas زیر Application Support ذخیره می‌شود:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

پنل Canvas این فایل‌ها را از طریق یک **طرح URL سفارشی** ارائه می‌کند:

- `openclaw-canvas://<session>/<path>`

نمونه‌ها:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

اگر هیچ `index.html`ای در ریشه وجود نداشته باشد، برنامه یک **صفحه داربست داخلی** نمایش می‌دهد.

## رفتار پنل

- پنل بدون حاشیه و قابل تغییر اندازه، نزدیک نوار منو (یا نشانگر ماوس) ثابت می‌شود.
- اندازه/موقعیت را برای هر نشست به خاطر می‌سپارد.
- وقتی فایل‌های محلی Canvas تغییر کنند، به‌صورت خودکار بارگذاری مجدد می‌شود.
- در هر لحظه فقط یک پنل Canvas قابل مشاهده است (نشست در صورت نیاز تعویض می‌شود).

Canvas را می‌توان از Settings → **Allow Canvas** غیرفعال کرد. وقتی غیرفعال باشد، فرمان‌های
گره canvas مقدار `CANVAS_DISABLED` برمی‌گردانند.

## سطح API عامل

Canvas از طریق **Gateway WebSocket** در دسترس است، بنابراین عامل می‌تواند:

- پنل را نشان دهد/پنهان کند
- به یک مسیر یا URL پیمایش کند
- JavaScript را ارزیابی کند
- یک تصویر snapshot بگیرد

نمونه‌های CLI:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

یادداشت‌ها:

- `canvas.navigate` **مسیرهای محلی Canvas**، URLهای `http(s)` و URLهای `file://` را می‌پذیرد.
- اگر `"/"` را بدهید، Canvas داربست محلی یا `index.html` را نشان می‌دهد.

## A2UI در Canvas

A2UI توسط میزبان canvas در Gateway میزبانی می‌شود و داخل پنل Canvas رندر می‌شود.
وقتی Gateway یک میزبان Canvas را اعلام کند، برنامه macOS در اولین باز شدن به‌صورت خودکار به
صفحه میزبان A2UI پیمایش می‌کند.

URL پیش‌فرض میزبان A2UI:

```
http://<gateway-host>:18789/__openclaw__/a2ui/
```

### فرمان‌های A2UI (v0.8)

Canvas در حال حاضر پیام‌های سرور→کلاینت **A2UI v0.8** را می‌پذیرد:

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

`createSurface` (v0.9) پشتیبانی نمی‌شود.

نمونه CLI:

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

آزمایش smoke سریع:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## راه‌اندازی اجرای عامل از Canvas

Canvas می‌تواند اجرای عامل‌های جدید را از طریق پیوندهای عمیق راه‌اندازی کند:

- `openclaw://agent?...`

نمونه (در JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

پارامترهای query پشتیبانی‌شده:

- `message`: پرامپت ازپیش‌پرشده عامل.
- `sessionKey`: شناسه پایدار نشست.
- `thinking`: پروفایل اختیاری تفکر.
- `deliver`، `to` یا `channel`: مقصد تحویل.
- `timeoutSeconds`: زمان پایان اختیاری اجرا.
- `key`: توکن ایمنی تولیدشده توسط برنامه برای فراخوان‌های محلی مورد اعتماد.

برنامه درخواست تأیید می‌کند مگر اینکه یک کلید معتبر ارائه شده باشد. پیوندهای بدون کلید
پیش از تأیید، پیام و URL را نشان می‌دهند و فیلدهای مسیریابی تحویل را نادیده می‌گیرند؛
پیوندهای کلیددار از مسیر اجرای عادی Gateway استفاده می‌کنند.

## یادداشت‌های امنیتی

- طرح Canvas پیمایش دایرکتوری را مسدود می‌کند؛ فایل‌ها باید زیر ریشه نشست قرار داشته باشند.
- محتوای محلی Canvas از یک طرح سفارشی استفاده می‌کند (نیازی به سرور loopback نیست).
- URLهای خارجی `http(s)` فقط وقتی مجازند که صراحتاً به آن‌ها پیمایش شود.

## مرتبط

- [برنامه macOS](/fa/platforms/macos)
- [WebChat](/fa/web/webchat)

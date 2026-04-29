---
read_when:
    - پیاده‌سازی پنل بوم در macOS
    - افزودن کنترل‌های عامل برای فضای کاری بصری
    - اشکال‌زدایی بارگذاری‌های بوم WKWebView
summary: پنل بومِ کنترل‌شده توسط عامل، جاسازی‌شده از طریق WKWebView + طرح URL سفارشی
title: بوم
x-i18n:
    generated_at: "2026-04-29T23:11:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a791f7841193a55b7f9cc5cc26168258d72d972279bba4c68fd1b15ef16f1c4
    source_path: platforms/mac/canvas.md
    workflow: 16
---

برنامه macOS با استفاده از `WKWebView` یک **پنل Canvas** تحت کنترل عامل را در خود جای می‌دهد. این
یک فضای کاری بصری سبک برای HTML/CSS/JS، A2UI و سطح‌های کوچک و تعاملی
UI است.

## Canvas کجا قرار دارد

وضعیت Canvas زیر Application Support ذخیره می‌شود:

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

پنل Canvas این فایل‌ها را از طریق یک **شِمای URL سفارشی** ارائه می‌کند:

- `openclaw-canvas://<session>/<path>`

نمونه‌ها:

- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

اگر هیچ `index.html` در ریشه وجود نداشته باشد، برنامه یک **صفحه داربست داخلی** نشان می‌دهد.

## رفتار پنل

- پنل بدون کادر و قابل تغییر اندازه که نزدیک نوار منو (یا نشانگر ماوس) لنگر می‌شود.
- اندازه/موقعیت را برای هر نشست به خاطر می‌سپارد.
- وقتی فایل‌های محلی canvas تغییر کنند، به‌صورت خودکار بازبارگذاری می‌شود.
- هر بار فقط یک پنل Canvas قابل مشاهده است (نشست در صورت نیاز تغییر داده می‌شود).

Canvas را می‌توان از Settings → **Allow Canvas** غیرفعال کرد. وقتی غیرفعال باشد، فرمان‌های
گره canvas مقدار `CANVAS_DISABLED` برمی‌گردانند.

## سطح API عامل

Canvas از طریق **WebSocket Gateway** در دسترس است، بنابراین عامل می‌تواند:

- پنل را نشان دهد/پنهان کند
- به یک مسیر یا URL ناوبری کند
- JavaScript را ارزیابی کند
- یک تصویر snapshot بگیرد

نمونه‌های CLI:

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

نکته‌ها:

- `canvas.navigate` **مسیرهای محلی canvas**، URLهای `http(s)` و URLهای `file://` را می‌پذیرد.
- اگر `"/"` را ارسال کنید، Canvas داربست محلی یا `index.html` را نشان می‌دهد.

## A2UI در Canvas

A2UI توسط میزبان canvas در Gateway میزبانی می‌شود و داخل پنل Canvas رندر می‌شود.
وقتی Gateway یک میزبان Canvas را اعلام کند، برنامه macOS در اولین باز شدن به‌صورت خودکار به
صفحه میزبان A2UI ناوبری می‌کند.

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

آزمون smoke سریع:

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## راه‌اندازی اجرای عامل از Canvas

Canvas می‌تواند از طریق deep linkها اجرای عامل جدید را راه‌اندازی کند:

- `openclaw://agent?...`

نمونه (در JS):

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

برنامه درخواست تأیید می‌کند مگر اینکه یک کلید معتبر ارائه شده باشد.

## نکته‌های امنیتی

- شِمای Canvas پیمایش دایرکتوری را مسدود می‌کند؛ فایل‌ها باید زیر ریشه نشست باشند.
- محتوای محلی Canvas از یک شِمای سفارشی استفاده می‌کند (به سرور local loopback نیازی نیست).
- URLهای خارجی `http(s)` فقط وقتی مجازند که صراحتاً به آن‌ها ناوبری شده باشد.

## مرتبط

- [برنامه macOS](/fa/platforms/macos)
- [WebChat](/fa/web/webchat)

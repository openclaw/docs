---
read_when:
    - استقرار OpenClaw در Railway
    - شما یک استقرار ابری تک‌کلیکی با رابط کاربری کنترل مبتنی بر مرورگر می‌خواهید
summary: استقرار OpenClaw روی Railway با قالب یک‌کلیکی
title: Railway
x-i18n:
    generated_at: "2026-04-29T23:07:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 989c8467ead04b8aa7c94101abd99c936ecd3e451fe728afe8c2f2bd5a78df48
    source_path: install/railway.mdx
    workflow: 16
---

# Railway

OpenClaw را روی Railway با یک قالب یک‌کلیکی مستقر کنید و از طریق Control UI وب به آن دسترسی داشته باشید.
این ساده‌ترین مسیر «بدون ترمینال روی سرور» است: Railway Gateway را برای شما اجرا می‌کند.

## چک‌لیست سریع (کاربران جدید)

1. روی **استقرار در Railway** کلیک کنید (در پایین).
2. یک **Volume** اضافه کنید که در `/data` mount شده باشد.
3. **Variables** لازم را تنظیم کنید (حداقل `OPENCLAW_GATEWAY_PORT` و `OPENCLAW_GATEWAY_TOKEN`).
4. **HTTP Proxy** را روی پورت `8080` فعال کنید.
5. `https://<your-railway-domain>/openclaw` را باز کنید و با secret مشترک پیکربندی‌شده وصل شوید. این قالب به‌طور پیش‌فرض از `OPENCLAW_GATEWAY_TOKEN` استفاده می‌کند؛ اگر آن را با احراز هویت گذرواژه‌ای جایگزین کردید، به‌جای آن از همان گذرواژه استفاده کنید.

## استقرار یک‌کلیکی

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  استقرار در Railway
</a>

پس از استقرار، URL عمومی خود را در **Railway → your service → Settings → Domains** پیدا کنید.

Railway یکی از این دو کار را انجام می‌دهد:

- یک دامنه تولیدشده به شما می‌دهد (اغلب `https://<something>.up.railway.app`)، یا
- اگر دامنه سفارشی متصل کرده باشید، از آن استفاده می‌کند.

سپس باز کنید:

- `https://<your-railway-domain>/openclaw` — Control UI

## چه چیزی دریافت می‌کنید

- Gateway میزبانی‌شده OpenClaw + Control UI
- ذخیره‌سازی پایدار از طریق Railway Volume (`/data`) تا `openclaw.json`،
  `auth-profiles.json` مخصوص هر عامل، وضعیت کانال/ارائه‌دهنده، نشست‌ها، و
  فضای کاری پس از استقرارهای دوباره باقی بمانند

## تنظیمات لازم Railway

### شبکه عمومی

**HTTP Proxy** را برای سرویس فعال کنید.

- پورت: `8080`

### Volume (الزامی)

یک Volume متصل کنید که در این مسیر mount شده باشد:

- `/data`

### Variables

این متغیرها را روی سرویس تنظیم کنید:

- `OPENCLAW_GATEWAY_PORT=8080` (الزامی — باید با پورت در شبکه عمومی مطابقت داشته باشد)
- `OPENCLAW_GATEWAY_TOKEN` (الزامی؛ آن را به‌عنوان secret مدیر در نظر بگیرید)
- `OPENCLAW_STATE_DIR=/data/.openclaw` (توصیه‌شده)
- `OPENCLAW_WORKSPACE_DIR=/data/workspace` (توصیه‌شده)

## اتصال یک کانال

برای دستورالعمل‌های راه‌اندازی کانال، از Control UI در `/openclaw` استفاده کنید یا `openclaw onboard` را از طریق shell در Railway اجرا کنید:

- [Telegram](/fa/channels/telegram) (سریع‌ترین — فقط یک توکن bot)
- [Discord](/fa/channels/discord)
- [همه کانال‌ها](/fa/channels)

## پشتیبان‌گیری و مهاجرت

وضعیت، پیکربندی، پروفایل‌های احراز هویت، و فضای کاری خود را export کنید:

```bash
openclaw backup create
```

این دستور یک آرشیو پشتیبان قابل‌حمل با وضعیت OpenClaw به‌همراه هر
فضای کاری پیکربندی‌شده ایجاد می‌کند. برای جزئیات، [پشتیبان‌گیری](/fa/cli/backup) را ببینید.

## گام‌های بعدی

- کانال‌های پیام‌رسانی را راه‌اندازی کنید: [کانال‌ها](/fa/channels)
- Gateway را پیکربندی کنید: [پیکربندی Gateway](/fa/gateway/configuration)
- OpenClaw را به‌روز نگه دارید: [به‌روزرسانی](/fa/install/updating)

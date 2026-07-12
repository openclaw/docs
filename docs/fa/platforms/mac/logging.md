---
read_when:
    - ثبت گزارش‌های macOS یا بررسی ثبت داده‌های خصوصی
    - اشکال‌زدایی مشکلات فعال‌سازی صوتی و چرخهٔ عمر نشست
summary: 'ثبت رویداد OpenClaw: گزارش فایل تشخیصی چرخشی + پرچم‌های یکپارچهٔ حریم خصوصی گزارش‌ها'
title: ثبت گزارش در macOS
x-i18n:
    generated_at: "2026-07-12T10:22:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef0fd91bd7fc0a8b5f598cfe8f5de551795a4badd0f6634c5bcbd4f3916bfc64
    source_path: platforms/mac/logging.md
    workflow: 16
---

# ثبت گزارش (macOS)

## گزارش پرونده‌ای چرخشیِ عیب‌یابی (پنل اشکال‌زدایی)

برنامه macOS گزارش‌ها را از طریق swift-log ثبت می‌کند (به‌طور پیش‌فرض با ثبت گزارش یکپارچه) و همچنین می‌تواند برای ثبت ماندگار، گزارش چرخشی را در یک پرونده محلی بنویسد (`DiagnosticsFileLog`).

- فعال‌سازی: **پنل اشکال‌زدایی -> گزارش‌ها -> ثبت گزارش برنامه -> "نوشتن گزارش چرخشی عیب‌یابی (JSONL)"** (به‌طور پیش‌فرض غیرفعال است).
- میزان جزئیات: انتخاب‌گر **پنل اشکال‌زدایی -> گزارش‌ها -> ثبت گزارش برنامه -> میزان جزئیات**.
- مکان: `~/Library/Logs/OpenClaw/diagnostics.jsonl`.
- چرخش: در حجم ۵ مگابایت می‌چرخد؛ حداکثر ۵ نسخه پشتیبان با پسوندهای `.1`...`.5` نگه‌داری می‌شوند (قدیمی‌ترین نسخه حذف می‌شود).
- پاک‌سازی: گزینه **پنل اشکال‌زدایی -> گزارش‌ها -> ثبت گزارش برنامه -> "پاک‌کردن"** پرونده فعال و همه نسخه‌های پشتیبان را حذف می‌کند.

این پرونده را حساس تلقی کنید؛ بدون بازبینی آن را به اشتراک نگذارید.

## داده‌های خصوصی در ثبت گزارش یکپارچه macOS

ثبت گزارش یکپارچه بیشتر محتوای داده‌ها را پنهان می‌کند، مگر اینکه یک زیرسامانه `privacy -off` را فعال کند. این رفتار با یک پرونده plist در `/Library/Preferences/Logging/Subsystems/` کنترل می‌شود که کلید آن نام زیرسامانه است. فقط ورودی‌های جدید گزارش این پرچم را اعمال می‌کنند، بنابراین پیش از بازتولید مشکل آن را فعال کنید. اطلاعات بیشتر: [ماجراهای حریم خصوصی ثبت گزارش در macOS](https://steipete.me/posts/2025/logging-privacy-shenanigans).

## فعال‌سازی برای OpenClaw (`ai.openclaw`)

ابتدا plist را در یک پرونده موقت بنویسید، سپس آن را به‌صورت اتمی و با دسترسی root نصب کنید:

```bash
cat <<'EOF' >/tmp/ai.openclaw.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>DEFAULT-OPTIONS</key>
    <dict>
        <key>Enable-Private-Data</key>
        <true/>
    </dict>
</dict>
</plist>
EOF
sudo install -m 644 -o root -g wheel /tmp/ai.openclaw.plist /Library/Preferences/Logging/Subsystems/ai.openclaw.plist
```

نیازی به راه‌اندازی مجدد نیست؛ logd پرونده را به‌سرعت شناسایی می‌کند، اما فقط خطوط جدید گزارش شامل محتوای خصوصی خواهند بود. خروجی غنی‌تر را با `./scripts/clawlog.sh --category WebChat --last 5m` مشاهده کنید (`--last`/`-l` محدوده زمانی را تنظیم می‌کند و مقدار پیش‌فرض آن `5m` است؛ `--category`/`-c` بر اساس دسته فیلتر می‌کند).

## غیرفعال‌سازی پس از اشکال‌زدایی

- بازنویسی را حذف کنید: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- در صورت تمایل، برای واداشتن logd به کنارگذاشتن فوری بازنویسی، `sudo log config --reload` را اجرا کنید.
- این بخش ممکن است شامل شماره تلفن‌ها و متن پیام‌ها باشد؛ plist را فقط زمانی در جای خود نگه دارید که فعالانه به آن نیاز دارید.

## مرتبط

- [برنامه macOS](/fa/platforms/macos)
- [ثبت گزارش Gateway](/fa/gateway/logging)

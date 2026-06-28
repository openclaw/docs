---
read_when:
    - گردآوری لاگ‌های macOS یا بررسی ثبت داده‌های خصوصی
    - اشکال‌زدایی مشکلات چرخهٔ حیات بیدارسازی صوتی/نشست
summary: 'ثبت گزارش OpenClaw: فایل گزارش تشخیصی چرخشی + پرچم‌های حریم خصوصی گزارش یکپارچه'
title: ثبت لاگ در macOS
x-i18n:
    generated_at: "2026-05-06T09:30:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 76c001008311d4e3f245add4cce32bdcc3eed9d897b30f6884c0649d2f0523df
    source_path: platforms/mac/logging.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# ثبت وقایع (macOS)

## فایل گزارش تشخیصی چرخشی (پنجره اشکال‌زدایی)

OpenClaw گزارش‌های برنامه macOS را از طریق swift-log مسیریابی می‌کند (به‌طور پیش‌فرض ثبت وقایع یکپارچه) و زمانی که به ثبت پایدار نیاز دارید، می‌تواند یک فایل گزارش محلی و چرخشی را روی دیسک بنویسد.

- سطح جزئیات: **پنجره اشکال‌زدایی → گزارش‌ها → ثبت گزارش برنامه → سطح جزئیات**
- فعال‌سازی: **پنجره اشکال‌زدایی → گزارش‌ها → ثبت گزارش برنامه → «نوشتن گزارش تشخیصی چرخشی (JSONL)»**
- مکان: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (به‌طور خودکار چرخش می‌یابد؛ به فایل‌های قدیمی پسوندهای `.1`، `.2`، … اضافه می‌شود)
- پاک‌سازی: **پنجره اشکال‌زدایی → گزارش‌ها → ثبت گزارش برنامه → «پاک کردن»**

نکات:

- این گزینه **به‌طور پیش‌فرض غیرفعال است**. فقط هنگام اشکال‌زدایی فعالانه آن را فعال کنید.
- با این فایل به‌عنوان داده حساس برخورد کنید؛ آن را بدون بازبینی به اشتراک نگذارید.

## داده‌های خصوصی در ثبت وقایع یکپارچه روی macOS

ثبت وقایع یکپارچه بیشتر payloadها را پنهان می‌کند، مگر اینکه یک subsystem در `privacy -off` شرکت کند. طبق نوشته Peter درباره [ترفندهای حریم خصوصی ثبت وقایع](https://steipete.me/posts/2025/logging-privacy-shenanigans) در macOS (۲۰۲۵)، این رفتار با یک plist در `/Library/Preferences/Logging/Subsystems/` کنترل می‌شود که با نام subsystem کلیدگذاری شده است. فقط ورودی‌های جدید گزارش این پرچم را اعمال می‌کنند، بنابراین پیش از بازتولید مشکل آن را فعال کنید.

## فعال‌سازی برای OpenClaw (`ai.openclaw`)

- ابتدا plist را در یک فایل موقت بنویسید، سپس آن را به‌صورت اتمیک و با دسترسی root نصب کنید:

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

- نیازی به راه‌اندازی مجدد نیست؛ logd فایل را سریع تشخیص می‌دهد، اما فقط خطوط گزارش جدید شامل payloadهای خصوصی خواهند بود.
- خروجی غنی‌تر را با کمک‌ابزار موجود ببینید، برای مثال `./scripts/clawlog.sh --category WebChat --last 5m`.

## غیرفعال‌سازی پس از اشکال‌زدایی

- override را حذف کنید: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- در صورت تمایل، `sudo log config --reload` را اجرا کنید تا logd بلافاصله override را کنار بگذارد.
- به یاد داشته باشید که این سطح می‌تواند شامل شماره تلفن‌ها و متن پیام‌ها باشد؛ plist را فقط تا زمانی نگه دارید که فعالانه به جزئیات اضافی نیاز دارید.

## مرتبط

- [برنامه macOS](/fa/platforms/macos)
- [ثبت وقایع Gateway](/fa/gateway/logging)

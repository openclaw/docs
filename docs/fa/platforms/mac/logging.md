---
read_when:
    - گرفتن لاگ‌های macOS یا بررسی ثبت داده‌های خصوصی
    - اشکال‌زدایی مشکلات چرخهٔ عمر بیدارسازی صوتی/نشست
summary: 'ثبت لاگ OpenClaw: فایل لاگ عیب‌یابی چرخشی + پرچم‌های حریم خصوصی لاگ یکپارچه'
title: ثبت گزارش در macOS
x-i18n:
    generated_at: "2026-04-29T23:11:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84e8f56ef0f85ba9eae629d6a3cc1bcaf49cc70c82f67a10b9292f2f54b1ff6b
    source_path: platforms/mac/logging.md
    workflow: 16
---

# لاگ‌گیری (macOS)

## فایل لاگ تشخیصی چرخشی (پنجره Debug)

OpenClaw لاگ‌های برنامه macOS را از طریق swift-log هدایت می‌کند (به‌صورت پیش‌فرض لاگ‌گیری یکپارچه) و وقتی به ثبت پایدار نیاز دارید، می‌تواند یک فایل لاگ محلی و چرخشی را روی دیسک بنویسد.

- سطح جزئیات: **پنجره Debug → Logs → App logging → Verbosity**
- فعال‌سازی: **پنجره Debug → Logs → App logging → “Write rolling diagnostics log (JSONL)”**
- مکان: `~/Library/Logs/OpenClaw/diagnostics.jsonl` (به‌صورت خودکار چرخش می‌کند؛ فایل‌های قدیمی با `.1`، `.2`، … پسوند می‌گیرند)
- پاک‌سازی: **پنجره Debug → Logs → App logging → “Clear”**

نکته‌ها:

- این گزینه **به‌صورت پیش‌فرض غیرفعال است**. فقط هنگام اشکال‌زدایی فعال آن را فعال کنید.
- با فایل به‌عنوان داده حساس برخورد کنید؛ بدون بازبینی آن را به اشتراک نگذارید.

## داده خصوصی لاگ‌گیری یکپارچه در macOS

لاگ‌گیری یکپارچه بیشتر payloadها را پنهان می‌کند، مگر اینکه یک زیرسامانه `privacy -off` را فعال کند. طبق نوشته Peter درباره [ترفندهای حریم خصوصی لاگ‌گیری](https://steipete.me/posts/2025/logging-privacy-shenanigans) در macOS (2025)، این مورد با یک plist در `/Library/Preferences/Logging/Subsystems/` کنترل می‌شود که کلید آن نام زیرسامانه است. فقط ورودی‌های لاگ جدید این پرچم را دریافت می‌کنند، پس پیش از بازتولید مشکل آن را فعال کنید.

## فعال‌سازی برای OpenClaw (`ai.openclaw`)

- ابتدا plist را در یک فایل موقت بنویسید، سپس آن را به‌صورت اتمیک با دسترسی root نصب کنید:

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

- نیازی به راه‌اندازی دوباره نیست؛ logd به‌سرعت متوجه فایل می‌شود، اما فقط خطوط لاگ جدید payloadهای خصوصی را شامل می‌شوند.
- خروجی غنی‌تر را با helper موجود مشاهده کنید، برای مثال `./scripts/clawlog.sh --category WebChat --last 5m`.

## غیرفعال‌سازی پس از اشکال‌زدایی

- override را حذف کنید: `sudo rm /Library/Preferences/Logging/Subsystems/ai.openclaw.plist`.
- در صورت تمایل `sudo log config --reload` را اجرا کنید تا logd فوراً override را کنار بگذارد.
- به یاد داشته باشید این سطح می‌تواند شامل شماره تلفن‌ها و متن پیام‌ها باشد؛ plist را فقط زمانی نگه دارید که فعالانه به جزئیات بیشتر نیاز دارید.

## مرتبط

- [برنامه macOS](/fa/platforms/macos)
- [لاگ‌گیری Gateway](/fa/gateway/logging)

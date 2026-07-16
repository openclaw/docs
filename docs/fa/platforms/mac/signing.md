---
read_when:
    - ساخت یا امضای بیلدهای اشکال‌زدایی مک
summary: مراحل امضای بیلدهای اشکال‌زدایی macOS تولیدشده توسط اسکریپت‌های بسته‌بندی
title: امضای macOS
x-i18n:
    generated_at: "2026-07-16T16:39:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 406211dadc9293cf7983e75ae7dd98234f9088351234cf06c33df2f63d1b9b97
    source_path: platforms/mac/signing.md
    workflow: 16
---

# امضای mac (بیلدهای اشکال‌زدایی)

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) برنامه را در یک مسیر ثابت (`dist/OpenClaw.app`) می‌سازد و بسته‌بندی می‌کند، سپس برای امضای آن [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) را فراخوانی می‌کند. مجوزهای TCC به شناسهٔ باندل و امضای کد وابسته‌اند؛ ثابت نگه‌داشتن هر دو (و نگه‌داشتن برنامه در مسیری ثابت) میان بیلدهای مجدد، مانع از آن می‌شود که macOS مجوزهای TCC (اعلان‌ها، دسترس‌پذیری، ضبط صفحه، میکروفون، گفتار) را فراموش کند.

- شناسهٔ باندل اشکال‌زدایی به‌طور پیش‌فرض `ai.openclaw.mac.debug` است (با `BUNDLE_ID=...` بازنویسی کنید).
- Node: `>=22.22.3 <23`، `>=24.15.0 <25` یا `>=25.9.0` (`package.json` مخزن `engines`). بسته‌بند همچنین رابط کاربری کنترل (`pnpm ui:build`) را می‌سازد.
- به‌طور پیش‌فرض به یک هویت امضای واقعی نیاز دارد؛ اگر هیچ هویتی پیدا نشود و `ALLOW_ADHOC_SIGNING` تنظیم نشده باشد، اسکریپت codesign با خطا خارج می‌شود. امضای موقت (`SIGN_IDENTITY="-"`) باید صریحاً فعال شود و مجوزهای TCC را میان بیلدهای مجدد حفظ نمی‌کند. به [مجوزهای macOS](/fa/platforms/mac/permissions) مراجعه کنید.
- `SIGN_IDENTITY` را از محیط می‌خواند (برای مثال، `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` یا یک گواهی Developer ID Application). بدون آن، `codesign-mac-app.sh` به‌طور خودکار هویتی را با این ترتیب انتخاب می‌کند: Developer ID Application، Apple Distribution، Apple Development و سپس نخستین هویت معتبر امضای کد که پیدا شود.
- `CODESIGN_TIMESTAMP=auto` (پیش‌فرض) مهر زمانی مورداعتماد را فقط برای امضاهای Developer ID Application فعال می‌کند. برای اجبار هر یک از حالت‌ها، `on`/`off` را تنظیم کنید.
- در Info.plist، مقادیر `OpenClawBuildTimestamp` (ISO8601 UTC) و `OpenClawGitCommit` (هش کوتاه، یا در صورت در دسترس نبودن `unknown`) را ثبت می‌کند تا زبانهٔ درباره بتواند بیلد، git و کانال اشکال‌زدایی/انتشار را نمایش دهد.
- پس از امضا، ممیزی Team ID را اجرا می‌کند و اگر هر Mach-O داخل باندل Team ID متفاوتی داشته باشد، ناموفق می‌شود. برای عبور از این بررسی، `SKIP_TEAM_ID_CHECK=1` را تنظیم کنید.

## نحوهٔ استفاده

```bash
# از ریشهٔ مخزن
scripts/package-mac-app.sh                                                      # هویت را خودکار انتخاب می‌کند؛ اگر هویتی پیدا نشود خطا می‌دهد
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # گواهی واقعی
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # موقت (مجوزها حفظ نخواهند شد)
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # موقتِ صریح (با همان ملاحظه)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # راه‌حل موقتِ صرفاً توسعه‌ای برای ناهماهنگی Sparkle Team ID
```

### نکته دربارهٔ امضای موقت

`SIGN_IDENTITY="-"`، Hardened Runtime (`--options runtime`) را غیرفعال می‌کند تا هنگام بارگذاری فریم‌ورک‌های تعبیه‌شده‌ای (مانند Sparkle) که Team ID یکسانی ندارند، از خرابی برنامه جلوگیری شود. امضاهای موقت همچنین ماندگاری مجوزهای TCC را مختل می‌کنند؛ برای مراحل بازیابی به [مجوزهای macOS](/fa/platforms/mac/permissions) مراجعه کنید.

## فرادادهٔ بیلد برای «درباره»

زبانهٔ «درباره»، `OpenClawBuildTimestamp` و `OpenClawGitCommit` را از Info.plist می‌خواند تا نسخه، تاریخ بیلد، کامیت git و DEBUG بودن بیلد (از طریق `#if DEBUG`) را نمایش دهد. برای تازه‌سازی این مقادیر، پس از تغییرات کد بسته‌بند را دوباره اجرا کنید.

## مرتبط

- [برنامهٔ macOS](/fa/platforms/macos)
- [مجوزهای macOS](/fa/platforms/mac/permissions)

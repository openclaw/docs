---
read_when:
    - ساخت یا امضای بیلدهای دیباگ مک
summary: مراحل امضای بیلدهای اشکال‌زدایی macOS که توسط اسکریپت‌های بسته‌بندی تولید شده‌اند
title: امضای macOS
x-i18n:
    generated_at: "2026-07-12T10:18:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 663c08c031417d5a9f048581421e4fe9f69480917582f74746af675bcca5cf95
    source_path: platforms/mac/signing.md
    workflow: 16
---

# امضای mac (بیلدهای اشکال‌زدایی)

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) برنامه را در یک مسیر ثابت (`dist/OpenClaw.app`) می‌سازد و بسته‌بندی می‌کند، سپس برای امضای آن [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) را فراخوانی می‌کند. مجوزهای TCC به شناسهٔ بسته و امضای کد وابسته‌اند؛ ثابت نگه‌داشتن هر دو (و قرار داشتن برنامه در مسیری ثابت) در بیلدهای مجدد باعث می‌شود macOS مجوزهای اعطاشدهٔ TCC (اعلان‌ها، دسترس‌پذیری، ضبط صفحه، میکروفون و گفتار) را فراموش نکند.

- شناسهٔ بستهٔ اشکال‌زدایی به‌طور پیش‌فرض `ai.openclaw.mac.debug` است (با `BUNDLE_ID=...` بازنویسی کنید).
- Node: نسخهٔ `>=22.19.0 <23` یا `>=23.11.0` (`engines` در `package.json` مخزن). بسته‌بند همچنین رابط کاربری کنترل را می‌سازد (`pnpm ui:build`).
- به‌طور پیش‌فرض به یک هویت امضای واقعی نیاز دارد؛ اگر هیچ هویتی پیدا نشود و `ALLOW_ADHOC_SIGNING` تنظیم نشده باشد، اسکریپت امضا با خطا خارج می‌شود. امضای موقت (`SIGN_IDENTITY="-"`) باید صریحاً فعال شود و مجوزهای TCC را در بیلدهای مجدد حفظ نمی‌کند. به [مجوزهای macOS](/fa/platforms/mac/permissions) مراجعه کنید.
- `SIGN_IDENTITY` را از محیط می‌خواند (برای نمونه، `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` یا یک گواهی Developer ID Application). بدون آن، `codesign-mac-app.sh` به‌طور خودکار هویتی را با این ترتیب انتخاب می‌کند: Developer ID Application، Apple Distribution، Apple Development و سپس نخستین هویت معتبر امضای کد که پیدا شود.
- `CODESIGN_TIMESTAMP=auto` (پیش‌فرض) مُهر زمانی مورداعتماد را فقط برای امضاهای Developer ID Application فعال می‌کند. برای اجبار به فعال یا غیرفعال بودن آن، مقدار `on` یا `off` را تنظیم کنید.
- در Info.plist، مقدار `OpenClawBuildTimestamp` (زمان UTC با قالب ISO8601) و `OpenClawGitCommit` (هش کوتاه؛ در صورت در دسترس نبودن `unknown`) را ثبت می‌کند تا زبانهٔ «درباره» بتواند بیلد، git و کانال اشکال‌زدایی/انتشار را نمایش دهد.
- پس از امضا، ممیزی شناسهٔ تیم را اجرا می‌کند و اگر هر فایل Mach-O درون بسته شناسهٔ تیم متفاوتی داشته باشد، با شکست متوقف می‌شود. برای دور زدن این بررسی، `SKIP_TEAM_ID_CHECK=1` را تنظیم کنید.

## روش استفاده

```bash
# از ریشهٔ مخزن
scripts/package-mac-app.sh                                                      # هویت را خودکار انتخاب می‌کند؛ اگر هویتی پیدا نشود خطا می‌دهد
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # گواهی واقعی
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # موقت (مجوزها حفظ نخواهند شد)
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # امضای موقت صریح (با همان ملاحظه)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # راه‌حل موقت ناسازگاری شناسهٔ تیم Sparkle، فقط برای توسعه
```

### نکتهٔ امضای موقت

`SIGN_IDENTITY="-"` زمان‌اجرای سخت‌سازی‌شده (`--options runtime`) را غیرفعال می‌کند تا هنگام بارگذاری فریم‌ورک‌های تعبیه‌شده‌ای (مانند Sparkle) که شناسهٔ تیم یکسانی ندارند، برنامه از کار نیفتد. امضاهای موقت همچنین ماندگاری مجوزهای TCC را مختل می‌کنند؛ برای مراحل بازیابی به [مجوزهای macOS](/fa/platforms/mac/permissions) مراجعه کنید.

## فرادادهٔ بیلد برای بخش «درباره»

زبانهٔ «درباره» مقادیر `OpenClawBuildTimestamp` و `OpenClawGitCommit` را از Info.plist می‌خواند تا نسخه، تاریخ بیلد، ثبت git و DEBUG بودن بیلد (از طریق `#if DEBUG`) را نمایش دهد. پس از تغییرات کد، بسته‌بند را دوباره اجرا کنید تا این مقادیر به‌روزرسانی شوند.

## مرتبط

- [برنامهٔ macOS](/fa/platforms/macos)
- [مجوزهای macOS](/fa/platforms/mac/permissions)

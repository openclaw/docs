---
read_when:
    - ساخت یا امضای نسخه‌های اشکال‌زدایی مک
summary: مراحل امضا برای ساخت‌های دیباگ macOS که توسط اسکریپت‌های بسته‌بندی تولید شده‌اند
title: امضای macOS
x-i18n:
    generated_at: "2026-05-06T09:31:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08a2f18f0f813c0bb7352b393531ad69d24da55de2e6ec6446febe0661eb4598
    source_path: platforms/mac/signing.md
    workflow: 16
---

# امضای mac (ساخت‌های دیباگ)

این برنامه معمولاً از طریق [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) ساخته می‌شود، که اکنون:

- یک شناسه پایدار برای بسته دیباگ تنظیم می‌کند: `ai.openclaw.mac.debug`
- فایل Info.plist را با همان شناسه بسته می‌نویسد (قابل بازنویسی با `BUNDLE_ID=...`)
- [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) را فراخوانی می‌کند تا باینری اصلی و بسته برنامه را امضا کند، تا macOS هر بازسازی را همان بسته امضاشده در نظر بگیرد و مجوزهای TCC را نگه دارد (اعلان‌ها، دسترس‌پذیری، ضبط صفحه، میکروفون، گفتار). برای مجوزهای پایدار، از یک هویت امضای واقعی استفاده کنید؛ امضای ad-hoc اختیاری و شکننده است (نگاه کنید به [مجوزهای macOS](/fa/platforms/mac/permissions)).
- به‌طور پیش‌فرض از `CODESIGN_TIMESTAMP=auto` استفاده می‌کند؛ این گزینه timestampهای مورد اعتماد را برای امضاهای Developer ID فعال می‌کند. برای رد کردن timestamp (ساخت‌های دیباگ آفلاین)، `CODESIGN_TIMESTAMP=off` را تنظیم کنید.
- فراداده ساخت را به Info.plist تزریق می‌کند: `OpenClawBuildTimestamp` (UTC) و `OpenClawGitCommit` (هش کوتاه)، تا پنل About بتواند ساخت، git، و کانال دیباگ/انتشار را نشان دهد.
- **بسته‌بندی به‌طور پیش‌فرض از Node 24 استفاده می‌کند**: اسکریپت ساخت‌های TS و ساخت Control UI را اجرا می‌کند. Node 22 LTS، در حال حاضر `22.14+`، همچنان برای سازگاری پشتیبانی می‌شود.
- `SIGN_IDENTITY` را از محیط می‌خواند. `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (یا گواهی Developer ID Application خودتان) را به rc شل خود اضافه کنید تا همیشه با گواهی خودتان امضا شود. امضای ad-hoc نیازمند فعال‌سازی صریح از طریق `ALLOW_ADHOC_SIGNING=1` یا `SIGN_IDENTITY="-"` است (برای آزمون مجوزها توصیه نمی‌شود).
- پس از امضا یک ممیزی Team ID اجرا می‌کند و اگر هر Mach-O داخل بسته برنامه با Team ID متفاوتی امضا شده باشد، شکست می‌خورد. برای دور زدن، `SKIP_TEAM_ID_CHECK=1` را تنظیم کنید.

## استفاده

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### نکته امضای ad-hoc

هنگام امضا با `SIGN_IDENTITY="-"` (ad-hoc)، اسکریپت به‌طور خودکار **زمان اجرای سخت‌سازی‌شده** (`--options runtime`) را غیرفعال می‌کند. این کار برای جلوگیری از کرش هنگام تلاش برنامه برای بارگذاری فریم‌ورک‌های تعبیه‌شده (مانند Sparkle) که Team ID یکسانی ندارند، لازم است. امضاهای ad-hoc همچنین پایداری مجوزهای TCC را از بین می‌برند؛ برای مراحل بازیابی، [مجوزهای macOS](/fa/platforms/mac/permissions) را ببینید.

## فراداده ساخت برای About

`package-mac-app.sh` بسته را با این موارد نشان‌گذاری می‌کند:

- `OpenClawBuildTimestamp`: زمان UTC با قالب ISO8601 در زمان بسته‌بندی
- `OpenClawGitCommit`: هش کوتاه git (یا `unknown` اگر در دسترس نباشد)

زبانه About این کلیدها را می‌خواند تا نسخه، تاریخ ساخت، commit گیت، و اینکه آیا ساخت دیباگ است یا نه (از طریق `#if DEBUG`) را نشان دهد. پس از تغییرات کد، بسته‌ساز را اجرا کنید تا این مقادیر تازه شوند.

## چرا

مجوزهای TCC به شناسه بسته _و_ امضای کد وابسته‌اند. ساخت‌های دیباگ امضانشده با UUIDهای متغیر باعث می‌شدند macOS پس از هر بازسازی، مجوزهای اعطاشده را فراموش کند. امضای باینری‌ها (به‌طور پیش‌فرض ad-hoc) و نگه داشتن یک شناسه/مسیر ثابت برای بسته (`dist/OpenClaw.app`) مجوزها را بین ساخت‌ها حفظ می‌کند، همسو با رویکرد VibeTunnel.

## مرتبط

- [برنامه macOS](/fa/platforms/macos)
- [مجوزهای macOS](/fa/platforms/mac/permissions)

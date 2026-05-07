---
read_when:
    - ساخت یا امضای بیلدهای دیباگ Mac
summary: مراحل امضا برای ساخت‌های اشکال‌زدایی macOS که توسط اسکریپت‌های بسته‌بندی تولید می‌شوند
title: امضای macOS
x-i18n:
    generated_at: "2026-05-07T13:26:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 58a4edd3d0df0d06c6e60251345a8e4a658bc4a3fceb4c01a21a9e98aeabfb6f
    source_path: platforms/mac/signing.md
    workflow: 16
---

# امضای mac (ساخت‌های اشکال‌زدایی)

این برنامه معمولاً از طریق [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) ساخته می‌شود، که اکنون:

- یک شناسه پایدار برای بسته اشکال‌زدایی تنظیم می‌کند: `ai.openclaw.mac.debug`
- Info.plist را با همان شناسه بسته می‌نویسد (قابل بازنویسی با `BUNDLE_ID=...`)
- [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) را فراخوانی می‌کند تا باینری اصلی و بسته برنامه را امضا کند، تا macOS هر بازسازی را همان بسته امضاشده در نظر بگیرد و مجوزهای TCC را حفظ کند (اعلان‌ها، دسترس‌پذیری، ضبط صفحه، میکروفون، گفتار). برای مجوزهای پایدار، از یک هویت امضای واقعی استفاده کنید؛ امضای ad-hoc نیازمند فعال‌سازی صریح است و شکننده محسوب می‌شود (ببینید [مجوزهای macOS](/fa/platforms/mac/permissions)).
- به‌طور پیش‌فرض از `CODESIGN_TIMESTAMP=auto` استفاده می‌کند؛ این گزینه timestampهای مورد اعتماد را برای امضاهای Developer ID فعال می‌کند. برای رد شدن از timestamping، `CODESIGN_TIMESTAMP=off` را تنظیم کنید (ساخت‌های اشکال‌زدایی آفلاین).
- فراداده ساخت را به Info.plist تزریق می‌کند: `OpenClawBuildTimestamp` (UTC) و `OpenClawGitCommit` (هش کوتاه)، تا پنل About بتواند ساخت، git، و کانال اشکال‌زدایی/انتشار را نشان دهد.
- **بسته‌بندی به‌طور پیش‌فرض از Node 24 استفاده می‌کند**: اسکریپت ساخت‌های TS و ساخت Control UI را اجرا می‌کند. Node 22 LTS، در حال حاضر `22.16+`، همچنان برای سازگاری پشتیبانی می‌شود.
- `SIGN_IDENTITY` را از محیط می‌خواند. `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (یا گواهی Developer ID Application خودتان) را به shell rc خود اضافه کنید تا همیشه با گواهی خودتان امضا شود. امضای ad-hoc نیازمند فعال‌سازی صریح از طریق `ALLOW_ADHOC_SIGNING=1` یا `SIGN_IDENTITY="-"` است (برای آزمون مجوزها توصیه نمی‌شود).
- پس از امضا یک ممیزی Team ID اجرا می‌کند و اگر هر Mach-O داخل بسته برنامه با Team ID متفاوتی امضا شده باشد، شکست می‌خورد. برای عبور از این بررسی، `SKIP_TEAM_ID_CHECK=1` را تنظیم کنید.

## استفاده

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### نکته امضای Ad-hoc

هنگام امضا با `SIGN_IDENTITY="-"` (ad-hoc)، اسکریپت به‌طور خودکار **Hardened Runtime** (`--options runtime`) را غیرفعال می‌کند. این کار برای جلوگیری از کرش‌ها زمانی لازم است که برنامه تلاش می‌کند frameworkهای توکار (مانند Sparkle) را بارگذاری کند که Team ID یکسانی ندارند. امضاهای ad-hoc همچنین پایداری مجوزهای TCC را از بین می‌برند؛ برای مراحل بازیابی، [مجوزهای macOS](/fa/platforms/mac/permissions) را ببینید.

## فراداده ساخت برای About

`package-mac-app.sh` بسته را با این موارد مهرگذاری می‌کند:

- `OpenClawBuildTimestamp`: زمان UTC با قالب ISO8601 هنگام بسته‌بندی
- `OpenClawGitCommit`: هش کوتاه git (یا `unknown` اگر در دسترس نباشد)

زبانه About این کلیدها را می‌خواند تا نسخه، تاریخ ساخت، کامیت git، و اینکه آیا ساخت اشکال‌زدایی است یا نه (از طریق `#if DEBUG`) را نشان دهد. پس از تغییرات کد، بسته‌ساز را اجرا کنید تا این مقادیر تازه شوند.

## دلیل

مجوزهای TCC به شناسه بسته _و_ امضای کد گره خورده‌اند. ساخت‌های اشکال‌زدایی امضانشده با UUIDهای متغیر باعث می‌شدند macOS پس از هر بازسازی مجوزهای اعطاشده را فراموش کند. امضای باینری‌ها (به‌طور پیش‌فرض ad-hoc) و نگه داشتن شناسه/مسیر ثابت بسته (`dist/OpenClaw.app`) مجوزها را بین ساخت‌ها حفظ می‌کند، مطابق با رویکرد VibeTunnel.

## مرتبط

- [برنامه macOS](/fa/platforms/macos)
- [مجوزهای macOS](/fa/platforms/mac/permissions)

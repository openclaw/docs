---
read_when:
    - ساخت یا امضای بیلدهای دیباگ مک
summary: مراحل امضا برای بیلدهای اشکال‌زدایی macOS که با اسکریپت‌های بسته‌بندی تولید شده‌اند
title: امضای macOS
x-i18n:
    generated_at: "2026-06-27T18:08:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df4ee44b6bdf09a24e0d05ed4354e2cb573372d12a667b4fcdfd7d6f88291082
    source_path: platforms/mac/signing.md
    workflow: 16
---

# امضای mac (ساخت‌های debug)

این برنامه معمولاً از [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) ساخته می‌شود، که اکنون:

- یک شناسه پایدار برای بسته debug تنظیم می‌کند: `ai.openclaw.mac.debug`
- فایل Info.plist را با همان شناسه بسته می‌نویسد (قابل بازنویسی با `BUNDLE_ID=...`)
- برای امضای باینری اصلی و بسته برنامه، [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) را فراخوانی می‌کند تا macOS هر بازسازی را همان بسته امضاشده در نظر بگیرد و مجوزهای TCC را حفظ کند (اعلان‌ها، دسترس‌پذیری، ضبط صفحه، میکروفن، گفتار). برای مجوزهای پایدار، از یک هویت امضای واقعی استفاده کنید؛ ad-hoc اختیاری و شکننده است (ببینید [مجوزهای macOS](/fa/platforms/mac/permissions)).
- به‌صورت پیش‌فرض از `CODESIGN_TIMESTAMP=auto` استفاده می‌کند؛ این گزینه timestampهای مورد اعتماد را برای امضاهای Developer ID فعال می‌کند. برای رد کردن timestamping، `CODESIGN_TIMESTAMP=off` را تنظیم کنید (ساخت‌های debug آفلاین).
- فراداده ساخت را به Info.plist تزریق می‌کند: `OpenClawBuildTimestamp` (UTC) و `OpenClawGitCommit` (هش کوتاه) تا پنل «درباره» بتواند ساخت، git، و کانال debug/release را نشان دهد.
- **بسته‌بندی به‌صورت پیش‌فرض از Node 24 استفاده می‌کند**: اسکریپت ساخت‌های TS و ساخت Control UI را اجرا می‌کند. Node 22 LTS، در حال حاضر `22.19+`، همچنان برای سازگاری پشتیبانی می‌شود.
- `SIGN_IDENTITY` را از محیط می‌خواند. برای اینکه همیشه با گواهی خودتان امضا کنید، `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (یا گواهی Developer ID Application خودتان) را به shell rc خود اضافه کنید. امضای ad-hoc نیازمند opt-in صریح از طریق `ALLOW_ADHOC_SIGNING=1` یا `SIGN_IDENTITY="-"` است (برای آزمون مجوزها توصیه نمی‌شود).
- پس از امضا یک ممیزی Team ID اجرا می‌کند و اگر هر Mach-O داخل بسته برنامه با Team ID متفاوتی امضا شده باشد شکست می‌خورد. برای دور زدن، `SKIP_TEAM_ID_CHECK=1` را تنظیم کنید.

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

هنگام امضا با `SIGN_IDENTITY="-"` (ad-hoc)، اسکریپت به‌طور خودکار **Hardened Runtime** (`--options runtime`) را غیرفعال می‌کند. این کار برای جلوگیری از کرش هنگام تلاش برنامه برای بارگذاری frameworkهای تعبیه‌شده (مانند Sparkle) که Team ID یکسانی ندارند ضروری است. امضاهای ad-hoc همچنین پایداری مجوزهای TCC را از بین می‌برند؛ برای مراحل بازیابی، [مجوزهای macOS](/fa/platforms/mac/permissions) را ببینید.

## فراداده ساخت برای «درباره»

`package-mac-app.sh` بسته را با این موارد مهر می‌زند:

- `OpenClawBuildTimestamp`: زمان UTC با قالب ISO8601 هنگام بسته‌بندی
- `OpenClawGitCommit`: هش کوتاه git (یا `unknown` اگر در دسترس نباشد)

زبانه «درباره» این کلیدها را می‌خواند تا نسخه، تاریخ ساخت، commit گیت، و اینکه ساخت debug است یا نه (از طریق `#if DEBUG`) را نشان دهد. پس از تغییرات کد، packager را اجرا کنید تا این مقادیر تازه شوند.

## دلیل

مجوزهای TCC به شناسه بسته _و_ امضای کد وابسته‌اند. ساخت‌های debug بدون امضا با UUIDهای متغیر باعث می‌شدند macOS پس از هر بازسازی مجوزها را فراموش کند. امضای باینری‌ها (به‌صورت پیش‌فرض ad-hoc) و ثابت نگه داشتن شناسه/مسیر بسته (`dist/OpenClaw.app`) مجوزها را بین ساخت‌ها حفظ می‌کند و با رویکرد VibeTunnel هم‌خوان است.

## مرتبط

- [برنامه macOS](/fa/platforms/macos)
- [مجوزهای macOS](/fa/platforms/mac/permissions)

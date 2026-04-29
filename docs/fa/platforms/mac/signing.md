---
read_when:
    - ساخت یا امضای بیلدهای دیباگ مک
summary: مراحل امضا برای بیلدهای اشکال‌زدایی macOS که توسط اسکریپت‌های بسته‌بندی تولید می‌شوند
title: امضای macOS
x-i18n:
    generated_at: "2026-04-29T23:11:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: cdd432c1f87ea14f4e19b1e5db967a62b42e2e4118fbd2a44d358b4eedea799f
    source_path: platforms/mac/signing.md
    workflow: 16
---

# امضای mac (بیلدهای اشکال‌زدایی)

این برنامه معمولاً از طریق [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) ساخته می‌شود، که اکنون:

- یک شناسهٔ پایدار بستهٔ اشکال‌زدایی تنظیم می‌کند: `ai.openclaw.mac.debug`
- فایل Info.plist را با همان شناسهٔ بسته می‌نویسد (قابل بازنویسی با `BUNDLE_ID=...`)
- برای امضای باینری اصلی و بستهٔ برنامه، [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) را فراخوانی می‌کند تا macOS هر بازسازی را به‌عنوان همان بستهٔ امضاشده در نظر بگیرد و مجوزهای TCC (اعلان‌ها، دسترسی‌پذیری، ضبط صفحه، میکروفون، گفتار) را حفظ کند. برای مجوزهای پایدار، از یک هویت امضای واقعی استفاده کنید؛ امضای ad-hoc نیازمند فعال‌سازی صریح است و شکننده محسوب می‌شود (ببینید: [مجوزهای macOS](/fa/platforms/mac/permissions)).
- به‌طور پیش‌فرض از `CODESIGN_TIMESTAMP=auto` استفاده می‌کند؛ این گزینه timestampهای معتمد را برای امضاهای Developer ID فعال می‌کند. برای رد شدن از timestampگذاری (بیلدهای اشکال‌زدایی آفلاین)، `CODESIGN_TIMESTAMP=off` را تنظیم کنید.
- فرادادهٔ بیلد را به Info.plist تزریق می‌کند: `OpenClawBuildTimestamp` (UTC) و `OpenClawGitCommit` (هش کوتاه) تا پنل About بتواند بیلد، git، و کانال اشکال‌زدایی/انتشار را نشان دهد.
- **بسته‌بندی به‌طور پیش‌فرض از Node 24 استفاده می‌کند**: اسکریپت بیلدهای TS و بیلد Control UI را اجرا می‌کند. Node 22 LTS، که در حال حاضر `22.14+` است، همچنان برای سازگاری پشتیبانی می‌شود.
- `SIGN_IDENTITY` را از محیط می‌خواند. `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (یا گواهی Developer ID Application خودتان) را به rc شل خود اضافه کنید تا همیشه با گواهی خودتان امضا شود. امضای ad-hoc نیازمند فعال‌سازی صریح از طریق `ALLOW_ADHOC_SIGNING=1` یا `SIGN_IDENTITY="-"` است (برای آزمایش مجوزها توصیه نمی‌شود).
- پس از امضا، یک ممیزی Team ID اجرا می‌کند و اگر هر Mach-O داخل بستهٔ برنامه با Team ID متفاوتی امضا شده باشد، شکست می‌خورد. برای دور زدن، `SKIP_TEAM_ID_CHECK=1` را تنظیم کنید.

## استفاده

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### نکتهٔ امضای ad-hoc

هنگام امضا با `SIGN_IDENTITY="-"` (ad-hoc)، اسکریپت به‌طور خودکار **Hardened Runtime** (`--options runtime`) را غیرفعال می‌کند. این کار برای جلوگیری از کرش‌ها لازم است، زمانی که برنامه تلاش می‌کند frameworkهای جاسازی‌شده‌ای (مثل Sparkle) را بارگذاری کند که Team ID یکسانی ندارند. امضاهای ad-hoc همچنین پایداری مجوزهای TCC را مختل می‌کنند؛ برای مراحل بازیابی، [مجوزهای macOS](/fa/platforms/mac/permissions) را ببینید.

## فرادادهٔ بیلد برای About

`package-mac-app.sh` بسته را با این موارد مهر می‌کند:

- `OpenClawBuildTimestamp`: زمان UTC در قالب ISO8601 هنگام بسته‌بندی
- `OpenClawGitCommit`: هش کوتاه git (یا `unknown` اگر در دسترس نباشد)

زبانهٔ About این کلیدها را می‌خواند تا نسخه، تاریخ بیلد، کامیت git، و اینکه آیا یک بیلد اشکال‌زدایی است یا نه (از طریق `#if DEBUG`) را نشان دهد. پس از تغییرات کد، بسته‌ساز را اجرا کنید تا این مقدارها به‌روزرسانی شوند.

## دلیل

مجوزهای TCC به شناسهٔ بسته _و_ امضای کد وابسته‌اند. بیلدهای اشکال‌زدایی امضانشده با UUIDهای متغیر باعث می‌شدند macOS پس از هر بازسازی، اعطاهای مجوز را فراموش کند. امضای باینری‌ها (به‌طور پیش‌فرض ad-hoc) و حفظ شناسه/مسیر ثابت بسته (`dist/OpenClaw.app`) اعطاها را بین بیلدها حفظ می‌کند و با رویکرد VibeTunnel هم‌خوان است.

## مرتبط

- [برنامهٔ macOS](/fa/platforms/macos)
- [مجوزهای macOS](/fa/platforms/mac/permissions)

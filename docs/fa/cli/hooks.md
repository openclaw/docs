---
read_when:
    - می‌خواهید هوک‌های عامل را مدیریت کنید
    - می‌خواهید دسترس‌پذیری هوک‌ها را بررسی کنید یا هوک‌های فضای کار را فعال کنید
summary: مرجع CLI برای `openclaw hooks` (هوک‌های عامل)
title: هوک‌ها
x-i18n:
    generated_at: "2026-05-05T08:25:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e860d4a20a09526e804fa1aff8c983a75396fcd1e6e24f742252fdf1812f6b7
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

هوک‌های عامل را مدیریت کنید (خودکارسازی‌های رویدادمحور برای دستورهایی مانند `/new`، `/reset` و راه‌اندازی Gateway).

اجرای `openclaw hooks` بدون زیردستور، معادل `openclaw hooks list` است.

مرتبط:

- هوک‌ها: [هوک‌ها](/fa/automation/hooks)
- هوک‌های Plugin: [هوک‌های Plugin](/fa/plugins/hooks)

## فهرست کردن همهٔ هوک‌ها

```bash
openclaw hooks list
```

همهٔ هوک‌های کشف‌شده از دایرکتوری‌های فضای کاری، مدیریت‌شده، اضافی و باندل‌شده را فهرست می‌کند.
راه‌اندازی Gateway هندلرهای هوک داخلی را تا زمانی که دست‌کم یک هوک داخلی پیکربندی نشده باشد بارگذاری نمی‌کند.

**گزینه‌ها:**

- `--eligible`: فقط هوک‌های واجد شرایط را نشان می‌دهد (نیازمندی‌ها برآورده شده‌اند)
- `--json`: خروجی به‌صورت JSON
- `-v, --verbose`: نمایش اطلاعات تفصیلی، شامل نیازمندی‌های از قلم‌افتاده

**نمونه خروجی:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**نمونه (با جزئیات):**

```bash
openclaw hooks list --verbose
```

نیازمندی‌های از قلم‌افتاده برای هوک‌های فاقد شرایط را نشان می‌دهد.

**نمونه (JSON):**

```bash
openclaw hooks list --json
```

برای استفادهٔ برنامه‌نویسی، JSON ساخت‌یافته برمی‌گرداند.

## دریافت اطلاعات هوک

```bash
openclaw hooks info <name>
```

اطلاعات تفصیلی دربارهٔ یک هوک مشخص را نشان می‌دهد.

**آرگومان‌ها:**

- `<name>`: نام هوک یا کلید هوک (مثلاً `session-memory`)

**گزینه‌ها:**

- `--json`: خروجی به‌صورت JSON

**نمونه:**

```bash
openclaw hooks info session-memory
```

**خروجی:**

```
💾 session-memory ✓ Ready

Save session context to memory when /new or /reset command is issued

Details:
  Source: openclaw-bundled
  Path: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Events: command:new, command:reset

Requirements:
  Config: ✓ workspace.dir
```

## بررسی واجد شرایط بودن هوک‌ها

```bash
openclaw hooks check
```

خلاصه‌ای از وضعیت واجد شرایط بودن هوک‌ها را نشان می‌دهد (چند مورد آماده و چند مورد آماده نیستند).

**گزینه‌ها:**

- `--json`: خروجی به‌صورت JSON

**نمونه خروجی:**

```
Hooks Status

Total hooks: 4
Ready: 4
Not ready: 0
```

## فعال کردن یک هوک

```bash
openclaw hooks enable <name>
```

یک هوک مشخص را با افزودن آن به پیکربندی شما فعال می‌کند (به‌طور پیش‌فرض `~/.openclaw/openclaw.json`).

**نکته:** هوک‌های فضای کاری به‌طور پیش‌فرض غیرفعال‌اند تا زمانی که اینجا یا در پیکربندی فعال شوند. هوک‌هایی که توسط Pluginها مدیریت می‌شوند در `openclaw hooks list` به‌صورت `plugin:<id>` نمایش داده می‌شوند و نمی‌توان آن‌ها را اینجا فعال/غیرفعال کرد. در عوض خود Plugin را فعال/غیرفعال کنید.

**آرگومان‌ها:**

- `<name>`: نام هوک (مثلاً `session-memory`)

**نمونه:**

```bash
openclaw hooks enable session-memory
```

**خروجی:**

```
✓ Enabled hook: 💾 session-memory
```

**چه کاری انجام می‌دهد:**

- بررسی می‌کند که هوک وجود دارد و واجد شرایط است
- در پیکربندی شما `hooks.internal.entries.<name>.enabled = true` را به‌روزرسانی می‌کند
- پیکربندی را روی دیسک ذخیره می‌کند

اگر هوک از `<workspace>/hooks/` آمده باشد، این مرحلهٔ opt-in پیش از آن‌که
Gateway آن را بارگذاری کند الزامی است.

**پس از فعال‌سازی:**

- Gateway را دوباره راه‌اندازی کنید تا هوک‌ها دوباره بارگذاری شوند (راه‌اندازی مجدد برنامهٔ نوار منو در macOS، یا راه‌اندازی مجدد فرایند Gateway در محیط توسعه).

## غیرفعال کردن یک هوک

```bash
openclaw hooks disable <name>
```

یک هوک مشخص را با به‌روزرسانی پیکربندی شما غیرفعال می‌کند.

**آرگومان‌ها:**

- `<name>`: نام هوک (مثلاً `command-logger`)

**نمونه:**

```bash
openclaw hooks disable command-logger
```

**خروجی:**

```
⏸ Disabled hook: 📝 command-logger
```

**پس از غیرفعال‌سازی:**

- Gateway را دوباره راه‌اندازی کنید تا هوک‌ها دوباره بارگذاری شوند

## یادداشت‌ها

- `openclaw hooks list --json`، `info --json` و `check --json`، JSON ساخت‌یافته را مستقیماً در stdout می‌نویسند.
- هوک‌های مدیریت‌شده توسط Plugin را نمی‌توان اینجا فعال یا غیرفعال کرد؛ در عوض Plugin مالک را فعال یا غیرفعال کنید.

## نصب بسته‌های هوک

```bash
openclaw plugins install <package>        # npm by default
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

بسته‌های هوک را از طریق نصب‌کنندهٔ یکپارچهٔ Pluginها نصب کنید.

`openclaw hooks install` همچنان به‌عنوان نام مستعار سازگاری کار می‌کند، اما یک
هشدار منسوخ‌شدن چاپ می‌کند و به `openclaw plugins install` هدایت می‌شود.

مشخصات npm **فقط رجیستری** هستند (نام بسته + **نسخهٔ دقیق** اختیاری یا
**dist-tag**). مشخصات Git/URL/file و بازه‌های semver رد می‌شوند. نصب وابستگی‌ها
برای ایمنی به‌صورت project-local با `--ignore-scripts` اجرا می‌شود، حتی وقتی
پوستهٔ شما تنظیمات نصب npm سراسری داشته باشد.

مشخصات بدون پیشوند و `@latest` روی مسیر پایدار می‌مانند. اگر npm هرکدام از
آن‌ها را به یک prerelease resolve کند، OpenClaw متوقف می‌شود و از شما می‌خواهد
با یک تگ prerelease مانند `@beta`/`@rc` یا یک نسخهٔ دقیق prerelease صراحتاً opt in کنید.

**چه کاری انجام می‌دهد:**

- بستهٔ هوک را در `~/.openclaw/hooks/<id>` کپی می‌کند
- هوک‌های نصب‌شده را در `hooks.internal.entries.*` فعال می‌کند
- نصب را زیر `hooks.internal.installs` ثبت می‌کند

**گزینه‌ها:**

- `-l, --link`: به‌جای کپی کردن، یک دایرکتوری محلی را لینک می‌کند (آن را به `hooks.internal.load.extraDirs` اضافه می‌کند)
- `--pin`: نصب‌های npm را به‌صورت `name@version` دقیق و resolve‌شده در `hooks.internal.installs` ثبت می‌کند

**آرشیوهای پشتیبانی‌شده:** `.zip`، `.tgz`، `.tar.gz`، `.tar`

**نمونه‌ها:**

```bash
# Local directory
openclaw plugins install ./my-hook-pack

# Local archive
openclaw plugins install ./my-hook-pack.zip

# NPM package
openclaw plugins install @openclaw/my-hook-pack

# Link a local directory without copying
openclaw plugins install -l ./my-hook-pack
```

بسته‌های هوک لینک‌شده به‌عنوان هوک‌های مدیریت‌شده از یک دایرکتوری
پیکربندی‌شده توسط اپراتور در نظر گرفته می‌شوند، نه به‌عنوان هوک‌های فضای کاری.

## به‌روزرسانی بسته‌های هوک

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

بسته‌های هوک مبتنی بر npm و ردیابی‌شده را از طریق به‌روزرسان یکپارچهٔ Pluginها به‌روزرسانی کنید.

`openclaw hooks update` همچنان به‌عنوان نام مستعار سازگاری کار می‌کند، اما یک
هشدار منسوخ‌شدن چاپ می‌کند و به `openclaw plugins update` هدایت می‌شود.

**گزینه‌ها:**

- `--all`: همهٔ بسته‌های هوک ردیابی‌شده را به‌روزرسانی می‌کند
- `--dry-run`: بدون نوشتن، نشان می‌دهد چه چیزی تغییر خواهد کرد

وقتی یک هش یکپارچگی ذخیره‌شده وجود داشته باشد و هش آرتیفکت دریافت‌شده تغییر کند،
OpenClaw یک هشدار چاپ می‌کند و پیش از ادامه تأیید می‌خواهد. برای دور زدن اعلان‌ها
در CI/اجراهای غیرتعاملی، از `--yes` سراسری استفاده کنید.

## هوک‌های باندل‌شده

### session-memory

وقتی `/new` یا `/reset` را صادر می‌کنید، زمینهٔ نشست را در حافظه ذخیره می‌کند.

**فعال‌سازی:**

```bash
openclaw hooks enable session-memory
```

**خروجی:** به‌طور پیش‌فرض `~/.openclaw/workspace/memory/YYYY-MM-DD-HHMM.md`. برای اسلاگ‌های نام فایل تولیدشده توسط مدل، `hooks.internal.entries.session-memory.llmSlug: true` را تنظیم کنید.

**ببینید:** [مستندات session-memory](/fa/automation/hooks#session-memory)

### bootstrap-extra-files

فایل‌های bootstrap اضافی (برای مثال `AGENTS.md` / `TOOLS.md` محلی monorepo) را هنگام `agent:bootstrap` تزریق می‌کند.

**فعال‌سازی:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**ببینید:** [مستندات bootstrap-extra-files](/fa/automation/hooks#bootstrap-extra-files)

### command-logger

همهٔ رویدادهای دستور را در یک فایل ممیزی متمرکز لاگ می‌کند.

**فعال‌سازی:**

```bash
openclaw hooks enable command-logger
```

**خروجی:** `~/.openclaw/logs/commands.log`

**مشاهدهٔ لاگ‌ها:**

```bash
# Recent commands
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filter by action
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**ببینید:** [مستندات command-logger](/fa/automation/hooks#command-logger)

### boot-md

هنگام شروع Gateway (پس از شروع کانال‌ها)، `BOOT.md` را اجرا می‌کند.

**رویدادها**: `gateway:startup`

**فعال‌سازی**:

```bash
openclaw hooks enable boot-md
```

**ببینید:** [مستندات boot-md](/fa/automation/hooks#boot-md)

## مرتبط

- [مرجع CLI](/fa/cli)
- [هوک‌های خودکارسازی](/fa/automation/hooks)

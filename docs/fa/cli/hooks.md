---
read_when:
    - می‌خواهید قلاب‌های عامل را مدیریت کنید
    - می‌خواهید در دسترس بودن هوک‌ها را بررسی کنید یا هوک‌های فضای کاری را فعال کنید
summary: مرجع CLI برای `openclaw hooks` (قلاب‌های عامل)
title: هوک‌ها
x-i18n:
    generated_at: "2026-04-29T22:36:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63ab6b014923dd4776767a6a0333129b85f51d008c63bb9fbdff06228d4c2f4b
    source_path: cli/hooks.md
    workflow: 16
---

# `openclaw hooks`

هوک‌های عامل را مدیریت کنید (اتوماسیون‌های رویدادمحور برای دستورهایی مانند `/new`، `/reset` و شروع به کار Gateway).

اجرای `openclaw hooks` بدون زیردستور معادل `openclaw hooks list` است.

مرتبط:

- هوک‌ها: [هوک‌ها](/fa/automation/hooks)
- هوک‌های Plugin: [هوک‌های Plugin](/fa/plugins/hooks)

## فهرست کردن همه هوک‌ها

```bash
openclaw hooks list
```

همه هوک‌های کشف‌شده از دایرکتوری‌های workspace، مدیریت‌شده، اضافی و همراه را فهرست می‌کند.
شروع به کار Gateway تا زمانی که حداقل یک هوک داخلی پیکربندی نشده باشد، handlerهای هوک داخلی را بارگیری نمی‌کند.

**گزینه‌ها:**

- `--eligible`: فقط هوک‌های واجد شرایط را نشان می‌دهد (نیازمندی‌ها برآورده شده‌اند)
- `--json`: خروجی را به صورت JSON ارائه می‌دهد
- `-v, --verbose`: اطلاعات تفصیلی شامل نیازمندی‌های مفقود را نشان می‌دهد

**نمونه خروجی:**

```
Hooks (4/4 ready)

Ready:
  🚀 boot-md ✓ - Run BOOT.md on gateway startup
  📎 bootstrap-extra-files ✓ - Inject extra workspace bootstrap files during agent bootstrap
  📝 command-logger ✓ - Log all command events to a centralized audit file
  💾 session-memory ✓ - Save session context to memory when /new or /reset command is issued
```

**نمونه (مفصل):**

```bash
openclaw hooks list --verbose
```

نیازمندی‌های مفقود برای هوک‌های فاقد شرایط را نشان می‌دهد.

**نمونه (JSON):**

```bash
openclaw hooks list --json
```

JSON ساخت‌یافته را برای استفاده برنامه‌نویسی برمی‌گرداند.

## دریافت اطلاعات هوک

```bash
openclaw hooks info <name>
```

اطلاعات تفصیلی درباره یک هوک مشخص را نشان می‌دهد.

**آرگومان‌ها:**

- `<name>`: نام هوک یا کلید هوک (مثلاً `session-memory`)

**گزینه‌ها:**

- `--json`: خروجی را به صورت JSON ارائه می‌دهد

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

خلاصه‌ای از وضعیت واجد شرایط بودن هوک‌ها را نشان می‌دهد (چند مورد آماده‌اند و چند مورد آماده نیستند).

**گزینه‌ها:**

- `--json`: خروجی را به صورت JSON ارائه می‌دهد

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

یک هوک مشخص را با افزودن آن به پیکربندی شما فعال می‌کند (`~/.openclaw/openclaw.json` به طور پیش‌فرض).

**یادداشت:** هوک‌های workspace به طور پیش‌فرض غیرفعال‌اند تا زمانی که اینجا یا در پیکربندی فعال شوند. هوک‌هایی که توسط plugins مدیریت می‌شوند در `openclaw hooks list` مقدار `plugin:<id>` را نشان می‌دهند و اینجا قابل فعال/غیرفعال‌سازی نیستند. به‌جای آن، Plugin را فعال/غیرفعال کنید.

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

**کاری که انجام می‌دهد:**

- بررسی می‌کند هوک وجود دارد و واجد شرایط است
- مقدار `hooks.internal.entries.<name>.enabled = true` را در پیکربندی شما به‌روزرسانی می‌کند
- پیکربندی را روی دیسک ذخیره می‌کند

اگر هوک از `<workspace>/hooks/` آمده باشد، این مرحله opt-in پیش از آنکه
Gateway آن را بارگیری کند لازم است.

**پس از فعال‌سازی:**

- Gateway را راه‌اندازی مجدد کنید تا هوک‌ها دوباره بارگیری شوند (راه‌اندازی مجدد برنامه نوار منو در macOS، یا راه‌اندازی مجدد فرایند Gateway خود در dev).

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

- Gateway را راه‌اندازی مجدد کنید تا هوک‌ها دوباره بارگیری شوند

## نکته‌ها

- `openclaw hooks list --json`، `info --json` و `check --json`، JSON ساخت‌یافته را مستقیماً در stdout می‌نویسند.
- هوک‌های مدیریت‌شده توسط Plugin را نمی‌توان اینجا فعال یا غیرفعال کرد؛ به‌جای آن، Plugin مالک را فعال یا غیرفعال کنید.

## نصب بسته‌های هوک

```bash
openclaw plugins install <package>        # ClawHub first, then npm
openclaw plugins install npm:<package>    # npm only
openclaw plugins install <package> --pin  # pin version
openclaw plugins install <path>           # local path
```

بسته‌های هوک را از طریق نصب‌کننده یکپارچه plugins نصب کنید.

`openclaw hooks install` همچنان به‌عنوان alias سازگاری کار می‌کند، اما یک
هشدار منسوخ‌شدن چاپ می‌کند و به `openclaw plugins install` ارجاع می‌دهد.

مشخصات npm **فقط registry** هستند (نام بسته + نسخه **دقیق** اختیاری یا
**dist-tag**). مشخصات Git/URL/file و بازه‌های semver رد می‌شوند. نصب‌های وابستگی
برای ایمنی به‌صورت project-local و با `--ignore-scripts` اجرا می‌شوند، حتی وقتی
shell شما تنظیمات نصب سراسری npm دارد.

مشخصات bare و `@latest` روی مسیر پایدار باقی می‌مانند. اگر npm هرکدام از
آن‌ها را به یک prerelease resolve کند، OpenClaw متوقف می‌شود و از شما می‌خواهد با یک
برچسب prerelease مانند `@beta`/`@rc` یا یک نسخه prerelease دقیق، صراحتاً opt in کنید.

**کاری که انجام می‌دهد:**

- بسته هوک را در `~/.openclaw/hooks/<id>` کپی می‌کند
- هوک‌های نصب‌شده را در `hooks.internal.entries.*` فعال می‌کند
- نصب را زیر `hooks.internal.installs` ثبت می‌کند

**گزینه‌ها:**

- `-l, --link`: به‌جای کپی کردن، یک دایرکتوری محلی را لینک می‌کند (آن را به `hooks.internal.load.extraDirs` اضافه می‌کند)
- `--pin`: نصب‌های npm را به صورت `name@version` resolve‌شده دقیق در `hooks.internal.installs` ثبت می‌کند

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

بسته‌های هوک لینک‌شده به‌عنوان هوک‌های مدیریت‌شده از یک دایرکتوری پیکربندی‌شده توسط operator
در نظر گرفته می‌شوند، نه به‌عنوان هوک‌های workspace.

## به‌روزرسانی بسته‌های هوک

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

بسته‌های هوک مبتنی بر npm و ردیابی‌شده را از طریق به‌روزرسان یکپارچه plugins به‌روزرسانی کنید.

`openclaw hooks update` همچنان به‌عنوان alias سازگاری کار می‌کند، اما یک
هشدار منسوخ‌شدن چاپ می‌کند و به `openclaw plugins update` ارجاع می‌دهد.

**گزینه‌ها:**

- `--all`: همه بسته‌های هوک ردیابی‌شده را به‌روزرسانی می‌کند
- `--dry-run`: نشان می‌دهد چه چیزی تغییر می‌کرد، بدون نوشتن

وقتی یک hash یکپارچگی ذخیره‌شده وجود داشته باشد و hash artifact دریافت‌شده تغییر کند،
OpenClaw یک هشدار چاپ می‌کند و پیش از ادامه تأیید می‌خواهد. برای عبور از promptها در اجراهای CI/غیرتعاملی از
`--yes` سراسری استفاده کنید.

## هوک‌های همراه

### session-memory

وقتی `/new` یا `/reset` را صادر می‌کنید، زمینه جلسه را در حافظه ذخیره می‌کند.

**فعال‌سازی:**

```bash
openclaw hooks enable session-memory
```

**خروجی:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**ببینید:** [مستندات session-memory](/fa/automation/hooks#session-memory)

### bootstrap-extra-files

فایل‌های bootstrap اضافی را (برای مثال `AGENTS.md` / `TOOLS.md` محلیِ monorepo) هنگام `agent:bootstrap` تزریق می‌کند.

**فعال‌سازی:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**ببینید:** [مستندات bootstrap-extra-files](/fa/automation/hooks#bootstrap-extra-files)

### command-logger

همه رویدادهای دستور را در یک فایل audit متمرکز ثبت می‌کند.

**فعال‌سازی:**

```bash
openclaw hooks enable command-logger
```

**خروجی:** `~/.openclaw/logs/commands.log`

**مشاهده logها:**

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

وقتی Gateway شروع می‌شود (پس از شروع channelها)، `BOOT.md` را اجرا می‌کند.

**رویدادها**: `gateway:startup`

**فعال‌سازی**:

```bash
openclaw hooks enable boot-md
```

**ببینید:** [مستندات boot-md](/fa/automation/hooks#boot-md)

## مرتبط

- [مرجع CLI](/fa/cli)
- [هوک‌های اتوماسیون](/fa/automation/hooks)

---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: مدیریت زمان‌اجراهای سندباکس و بررسی سیاست مؤثر سندباکس
title: CLI محیط ایزوله
x-i18n:
    generated_at: "2026-06-27T17:27:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eeba1a5530bb946b334cfe399b7a0c862694ae47c55b2341d7146333e112602a
    source_path: cli/sandbox.md
    workflow: 16
---

محیط‌های اجرای sandbox را برای اجرای ایزوله عامل مدیریت کنید.

## نمای کلی

OpenClaw می‌تواند برای امنیت، عامل‌ها را در محیط‌های اجرای sandbox ایزوله اجرا کند. فرمان‌های `sandbox` به شما کمک می‌کنند پس از به‌روزرسانی‌ها یا تغییرات پیکربندی، این محیط‌های اجرا را بررسی و دوباره ایجاد کنید.

امروزه این معمولاً یعنی:

- کانتینرهای sandbox Docker
- محیط‌های اجرای sandbox SSH وقتی `agents.defaults.sandbox.backend = "ssh"`
- محیط‌های اجرای sandbox OpenShell وقتی `agents.defaults.sandbox.backend = "openshell"`

برای `ssh` و OpenShell `remote`، ایجاد دوباره مهم‌تر از Docker است:

- فضای کاری راه‌دور پس از seed اولیه مرجع اصلی است
- `openclaw sandbox recreate` آن فضای کاری راه‌دور مرجع را برای دامنه انتخاب‌شده حذف می‌کند
- استفاده بعدی آن را دوباره از فضای کاری محلی فعلی seed می‌کند

## فرمان‌ها

### `openclaw sandbox explain`

حالت/دامنه/دسترسی فضای کاری **موثر** sandbox، سیاست ابزار sandbox، و دروازه‌های ارتقایافته را بررسی کنید (همراه با مسیرهای کلید پیکربندی برای رفع مشکل).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

همه محیط‌های اجرای sandbox را همراه با وضعیت و پیکربندی آن‌ها فهرست کنید.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
```

**خروجی شامل موارد زیر است:**

- نام و وضعیت محیط اجرا
- بک‌اند (`docker`، `openshell`، و غیره)
- برچسب پیکربندی و اینکه آیا با پیکربندی فعلی مطابقت دارد
- عمر (زمان سپری‌شده از ایجاد)
- زمان بیکاری (زمان سپری‌شده از آخرین استفاده)
- نشست/عامل مرتبط

### `openclaw sandbox recreate`

محیط‌های اجرای sandbox را حذف کنید تا با پیکربندی به‌روزشده دوباره ایجاد شوند.

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

**گزینه‌ها:**

- `--all`: همه کانتینرهای sandbox را دوباره ایجاد می‌کند
- `--session <key>`: کانتینر را برای نشست مشخص دوباره ایجاد می‌کند
- `--agent <id>`: کانتینرها را برای عامل مشخص دوباره ایجاد می‌کند
- `--browser`: فقط کانتینرهای مرورگر را دوباره ایجاد می‌کند
- `--force`: پیام تأیید را رد می‌کند

<Note>
محیط‌های اجرا هنگام استفاده بعدی از عامل، به‌طور خودکار دوباره ایجاد می‌شوند.
</Note>

## موارد استفاده

### پس از به‌روزرسانی یک image Docker

```bash
# Pull new image
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Update config to use new image
# Edit config: agents.defaults.sandbox.docker.image (or agents.list[].sandbox.docker.image)

# Recreate containers
openclaw sandbox recreate --all
```

### پس از تغییر پیکربندی sandbox

```bash
# Edit config: agents.defaults.sandbox.* (or agents.list[].sandbox.*)

# Recreate to apply new config
openclaw sandbox recreate --all
```

### پس از تغییر مقصد SSH یا مواد احراز هویت SSH

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

برای بک‌اند اصلی `ssh`، ایجاد دوباره ریشه فضای کاری راه‌دور هر دامنه را
روی مقصد SSH حذف می‌کند. اجرای بعدی آن را دوباره از فضای کاری محلی seed می‌کند.

### پس از تغییر منبع، سیاست، یا حالت OpenShell

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

برای حالت OpenShell `remote`، ایجاد دوباره فضای کاری راه‌دور مرجع
آن دامنه را حذف می‌کند. اجرای بعدی آن را دوباره از فضای کاری محلی seed می‌کند.

### پس از تغییر setupCommand

```bash
openclaw sandbox recreate --all
# or just one agent:
openclaw sandbox recreate --agent family
```

### فقط برای یک عامل مشخص

```bash
# Update only one agent's containers
openclaw sandbox recreate --agent alfred
```

## چرا این لازم است

وقتی پیکربندی sandbox را به‌روزرسانی می‌کنید:

- محیط‌های اجرای موجود با تنظیمات قدیمی به کار خود ادامه می‌دهند.
- محیط‌های اجرا فقط پس از ۲۴ ساعت عدم فعالیت هرس می‌شوند.
- عامل‌هایی که مرتب استفاده می‌شوند، محیط‌های اجرای قدیمی را برای مدت نامحدود زنده نگه می‌دارند.

از `openclaw sandbox recreate` برای حذف اجباری محیط‌های اجرای قدیمی استفاده کنید. وقتی دوباره لازم شوند، با تنظیمات فعلی به‌طور خودکار ایجاد می‌شوند.

<Tip>
`openclaw sandbox recreate` را به پاک‌سازی دستی و وابسته به بک‌اند ترجیح دهید. این فرمان از رجیستری محیط اجرای Gateway استفاده می‌کند و وقتی دامنه یا کلیدهای نشست تغییر می‌کنند، از ناهماهنگی جلوگیری می‌کند.
</Tip>

## مهاجرت رجیستری

OpenClaw فراداده محیط اجرای sandbox را در پایگاه داده SQLite وضعیت مشترک ذخیره می‌کند. نصب‌های قدیمی‌تر ممکن است هنوز فایل‌های رجیستری sandbox قدیمی داشته باشند:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`

برخی ارتقاها ممکن است زیر `~/.openclaw/sandbox/containers/` یا `~/.openclaw/sandbox/browsers/` نیز برای هر کانتینر/مرورگر یک shard JSON داشته باشند. خواندن‌های عادی محیط اجرای sandbox این منابع قدیمی را بازنویسی نمی‌کنند. برای مهاجرت ورودی‌های قدیمی معتبر به SQLite، `openclaw doctor --fix` را اجرا کنید. فایل‌های قدیمی نامعتبر قرنطینه می‌شوند تا یک رجیستری قدیمی خراب نتواند ورودی‌های محیط اجرای فعلی را پنهان کند.

## پیکربندی

تنظیمات sandbox در `~/.openclaw/openclaw.json` زیر `agents.defaults.sandbox` قرار دارند (بازنویسی‌های هر عامل در `agents.list[].sandbox` قرار می‌گیرند):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... more Docker options
        },
        "prune": {
          "idleHours": 24, // Auto-prune after 24h idle
          "maxAgeDays": 7, // Auto-prune after 7 days
        },
      },
    },
  },
}
```

## مرتبط

- [مرجع CLI](/fa/cli)
- [Sandboxing](/fa/gateway/sandboxing)
- [فضای کاری عامل](/fa/concepts/agent-workspace)
- [Doctor](/fa/gateway/doctor): راه‌اندازی sandbox را بررسی می‌کند.

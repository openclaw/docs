---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: مدیریت محیط‌های اجرای سندباکس و بررسی سیاست مؤثر سندباکس
title: CLI محیط ایزوله
x-i18n:
    generated_at: "2026-05-03T21:28:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: c50b97c35ba8cd79416de6a167a7cbc313d063b320db7deafd42f7a570e507ac
    source_path: cli/sandbox.md
    workflow: 16
---

مدیریت زمان‌اجراهای sandbox برای اجرای ایزولهٔ عامل.

## نمای کلی

OpenClaw می‌تواند برای امنیت، عامل‌ها را در زمان‌اجراهای sandbox ایزوله اجرا کند. دستورهای `sandbox` به شما کمک می‌کنند پس از به‌روزرسانی‌ها یا تغییرات پیکربندی، این زمان‌اجراها را بررسی و بازایجاد کنید.

امروز این معمولاً یعنی:

- کانتینرهای sandbox در Docker
- زمان‌اجراهای sandbox مبتنی بر SSH وقتی `agents.defaults.sandbox.backend = "ssh"`
- زمان‌اجراهای sandbox مبتنی بر OpenShell وقتی `agents.defaults.sandbox.backend = "openshell"`

برای `ssh` و OpenShell `remote`، بازایجاد از Docker مهم‌تر است:

- فضای کاری راه‌دور پس از seed اولیه، مرجع اصلی است
- `openclaw sandbox recreate` آن فضای کاری راه‌دور مرجع را برای دامنهٔ انتخاب‌شده حذف می‌کند
- استفادهٔ بعدی دوباره آن را از فضای کاری محلی فعلی seed می‌کند

## دستورها

### `openclaw sandbox explain`

حالت/دامنه/دسترسی فضای کاری **مؤثر** sandbox، سیاست ابزار sandbox، و دروازه‌های elevated را بررسی کنید (همراه با مسیرهای کلید پیکربندی برای رفع مشکل).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

همهٔ زمان‌اجراهای sandbox را همراه با وضعیت و پیکربندی آن‌ها فهرست کنید.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
```

**خروجی شامل این موارد است:**

- نام و وضعیت زمان‌اجرا
- بک‌اند (`docker`، `openshell` و غیره)
- برچسب پیکربندی و این‌که آیا با پیکربندی فعلی مطابقت دارد یا نه
- سن (زمان سپری‌شده از ایجاد)
- زمان بیکاری (زمان سپری‌شده از آخرین استفاده)
- نشست/عامل مرتبط

### `openclaw sandbox recreate`

زمان‌اجراهای sandbox را حذف کنید تا با پیکربندی به‌روزشده دوباره ایجاد شوند.

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

**گزینه‌ها:**

- `--all`: بازایجاد همهٔ کانتینرهای sandbox
- `--session <key>`: بازایجاد کانتینر برای نشست مشخص
- `--agent <id>`: بازایجاد کانتینرها برای عامل مشخص
- `--browser`: فقط بازایجاد کانتینرهای مرورگر
- `--force`: رد کردن درخواست تأیید

<Note>
زمان‌اجراها هنگام استفادهٔ بعدی از عامل، به‌صورت خودکار بازایجاد می‌شوند.
</Note>

## موارد استفاده

### پس از به‌روزرسانی یک تصویر Docker

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

برای بک‌اند اصلی `ssh`، بازایجاد ریشهٔ فضای کاری راه‌دور مختص هر دامنه را روی مقصد SSH حذف می‌کند. اجرای بعدی دوباره آن را از فضای کاری محلی seed می‌کند.

### پس از تغییر منبع، سیاست، یا حالت OpenShell

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

برای حالت OpenShell `remote`، بازایجاد فضای کاری راه‌دور مرجع را برای آن دامنه حذف می‌کند. اجرای بعدی دوباره آن را از فضای کاری محلی seed می‌کند.

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

- زمان‌اجراهای موجود با تنظیمات قدیمی به کار ادامه می‌دهند.
- زمان‌اجراها فقط پس از ۲۴ ساعت بی‌استفاده بودن پاک‌سازی می‌شوند.
- عامل‌هایی که مرتب استفاده می‌شوند، زمان‌اجراهای قدیمی را برای مدت نامحدود زنده نگه می‌دارند.

از `openclaw sandbox recreate` استفاده کنید تا حذف زمان‌اجراهای قدیمی را اجبار کنید. آن‌ها در زمان نیاز بعدی، به‌صورت خودکار با تنظیمات فعلی بازایجاد می‌شوند.

<Tip>
`openclaw sandbox recreate` را به پاک‌سازی دستی مخصوص هر بک‌اند ترجیح دهید. این دستور از رجیستری زمان‌اجرای Gateway استفاده می‌کند و وقتی کلیدهای دامنه یا نشست تغییر می‌کنند، از ناهماهنگی جلوگیری می‌کند.
</Tip>

## مهاجرت رجیستری

OpenClaw فرادادهٔ زمان‌اجرای sandbox را به‌صورت یک shard JSON برای هر ورودی کانتینر/مرورگر، زیر دایرکتوری وضعیت sandbox ذخیره می‌کند. نصب‌های قدیمی‌تر ممکن است هنوز فایل‌های قدیمی یکپارچه داشته باشند:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`

خواندن‌های معمول زمان‌اجرای sandbox این فایل‌ها را بازنویسی نمی‌کنند. برای مهاجرت ورودی‌های قدیمی معتبر به دایرکتوری‌های رجیستری shardشده، `openclaw doctor --fix` را اجرا کنید. فایل‌های قدیمی نامعتبر قرنطینه می‌شوند تا یک رجیستری قدیمی خراب نتواند ورودی‌های زمان‌اجرای فعلی را پنهان کند.

## پیکربندی

تنظیمات sandbox در `~/.openclaw/openclaw.json` زیر `agents.defaults.sandbox` قرار دارند (بازنویسی‌های مختص هر عامل در `agents.list[].sandbox` قرار می‌گیرند):

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
- [sandboxing](/fa/gateway/sandboxing)
- [فضای کاری عامل](/fa/concepts/agent-workspace)
- [Doctor](/fa/gateway/doctor): راه‌اندازی sandbox را بررسی می‌کند.

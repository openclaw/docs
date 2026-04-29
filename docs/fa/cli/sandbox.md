---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: محیط‌های زمان اجرای سندباکس را مدیریت کنید و سیاست اعمال‌شدهٔ سندباکس را بررسی کنید
title: CLI محیط ایزوله
x-i18n:
    generated_at: "2026-04-29T22:38:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65520040611ccf0cfc28b28f0caf2ed1c7d3b32de06eec7884131042bba4a01e
    source_path: cli/sandbox.md
    workflow: 16
---

مدیریت runtimeهای sandbox برای اجرای ایزولهٔ عامل‌ها.

## نمای کلی

OpenClaw می‌تواند برای امنیت، عامل‌ها را در runtimeهای sandbox ایزوله اجرا کند. فرمان‌های `sandbox` به شما کمک می‌کنند پس از به‌روزرسانی‌ها یا تغییرات پیکربندی، آن runtimeها را بررسی و دوباره ایجاد کنید.

امروز این معمولاً یعنی:

- کانتینرهای Docker sandbox
- runtimeهای SSH sandbox وقتی `agents.defaults.sandbox.backend = "ssh"`
- runtimeهای OpenShell sandbox وقتی `agents.defaults.sandbox.backend = "openshell"`

برای `ssh` و OpenShell `remote`، ایجاد دوباره مهم‌تر از Docker است:

- workspace راه‌دور پس از seed اولیه، مرجع اصلی است
- `openclaw sandbox recreate` آن workspace راه‌دور مرجع را برای دامنهٔ انتخاب‌شده حذف می‌کند
- استفادهٔ بعدی، آن را دوباره از workspace محلی فعلی seed می‌کند

## فرمان‌ها

### `openclaw sandbox explain`

حالت/دامنه/دسترسی workspace مؤثر sandbox، سیاست ابزار sandbox، و gateهای ارتقایافته را بررسی کنید (همراه با مسیرهای کلید پیکربندی برای اصلاح).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

همهٔ runtimeهای sandbox را همراه با وضعیت و پیکربندی‌شان فهرست کنید.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
```

**خروجی شامل موارد زیر است:**

- نام و وضعیت runtime
- Backend (`docker`، `openshell` و غیره)
- برچسب پیکربندی و اینکه آیا با پیکربندی فعلی مطابقت دارد
- سن (زمان سپری‌شده از زمان ایجاد)
- زمان بیکاری (زمان سپری‌شده از آخرین استفاده)
- نشست/عامل مرتبط

### `openclaw sandbox recreate`

runtimeهای sandbox را حذف کنید تا با پیکربندی به‌روزشده دوباره ایجاد شوند.

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

**گزینه‌ها:**

- `--all`: همهٔ کانتینرهای sandbox را دوباره ایجاد می‌کند
- `--session <key>`: کانتینر را برای نشست مشخص دوباره ایجاد می‌کند
- `--agent <id>`: کانتینرها را برای عامل مشخص دوباره ایجاد می‌کند
- `--browser`: فقط کانتینرهای مرورگر را دوباره ایجاد می‌کند
- `--force`: اعلان تأیید را رد می‌کند

<Note>
runtimeها هنگام استفادهٔ بعدی از عامل، به‌طور خودکار دوباره ایجاد می‌شوند.
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

برای backend اصلی `ssh`، ایجاد دوباره، ریشهٔ workspace راه‌دور مخصوص هر دامنه را
روی مقصد SSH حذف می‌کند. اجرای بعدی، آن را دوباره از workspace محلی seed می‌کند.

### پس از تغییر منبع، سیاست، یا حالت OpenShell

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

برای حالت OpenShell `remote`، ایجاد دوباره، workspace راه‌دور مرجع
آن دامنه را حذف می‌کند. اجرای بعدی، آن را دوباره از workspace محلی seed می‌کند.

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

- runtimeهای موجود با تنظیمات قدیمی به اجرا ادامه می‌دهند.
- runtimeها فقط پس از ۲۴ ساعت عدم فعالیت هرس می‌شوند.
- عامل‌هایی که به‌طور منظم استفاده می‌شوند، runtimeهای قدیمی را برای مدت نامحدود زنده نگه می‌دارند.

از `openclaw sandbox recreate` برای وادار کردن حذف runtimeهای قدیمی استفاده کنید. آن‌ها هنگام نیاز بعدی، به‌طور خودکار با تنظیمات فعلی دوباره ایجاد می‌شوند.

<Tip>
`openclaw sandbox recreate` را به پاک‌سازی دستیِ مخصوص backend ترجیح دهید. این فرمان از registry runtime در Gateway استفاده می‌کند و وقتی کلیدهای دامنه یا نشست تغییر می‌کنند، از ناهماهنگی جلوگیری می‌کند.
</Tip>

## پیکربندی

تنظیمات sandbox در `~/.openclaw/openclaw.json` زیر `agents.defaults.sandbox` قرار دارند (overrideهای مخصوص هر عامل در `agents.list[].sandbox` قرار می‌گیرند):

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
- [workspace عامل](/fa/concepts/agent-workspace)
- [Doctor](/fa/gateway/doctor): راه‌اندازی sandbox را بررسی می‌کند.

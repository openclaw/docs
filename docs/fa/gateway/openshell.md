---
read_when:
    - سندباکس‌های تحت مدیریت ابر را به‌جای Docker محلی می‌خواهید
    - در حال راه‌اندازی Plugin OpenShell هستید
    - باید بین حالت‌های فضای کاری آینه‌ای و راه‌دور یکی را انتخاب کنید
summary: از OpenShell به‌عنوان بک‌اند سندباکس مدیریت‌شده برای عامل‌های OpenClaw استفاده کنید
title: OpenShell
x-i18n:
    generated_at: "2026-06-27T17:46:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d278f7550a3178c30a1b42f80495c55bb9827f7785ce9c4d1ee4a57adb3a5e4b
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell یک بک‌اند سندباکس مدیریت‌شده برای OpenClaw است. به‌جای اجرای
کانتینرهای Docker به‌صورت محلی، OpenClaw چرخه عمر سندباکس را به CLI
`openshell` واگذار می‌کند؛ این CLI محیط‌های راه دور را با اجرای فرمان مبتنی بر SSH فراهم می‌کند.

Plugin مربوط به OpenShell همان انتقال SSH هسته و پل سیستم فایل راه دوری را
بازاستفاده می‌کند که بک‌اند عمومی [SSH](/fa/gateway/sandboxing#ssh-backend) از آن استفاده می‌کند. این Plugin چرخه عمر اختصاصی OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`)
و یک حالت اختیاری فضای کاری `mirror` را اضافه می‌کند.

## پیش‌نیازها

- Plugin مربوط به OpenShell نصب شده باشد (`openclaw plugins install @openclaw/openshell-sandbox`)
- CLI مربوط به `openshell` نصب شده و در `PATH` باشد (یا مسیر سفارشی را از طریق
  `plugins.entries.openshell.config.command` تنظیم کنید)
- یک حساب OpenShell با دسترسی به سندباکس
- OpenClaw Gateway روی میزبان در حال اجرا باشد

## شروع سریع

1. Plugin را نصب و فعال کنید، سپس بک‌اند سندباکس را تنظیم کنید:

```bash
openclaw plugins install @openclaw/openshell-sandbox
```

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

2. Gateway را راه‌اندازی مجدد کنید. در نوبت بعدی عامل، OpenClaw یک سندباکس
   OpenShell ایجاد می‌کند و اجرای ابزارها را از طریق آن مسیریابی می‌کند.

3. راستی‌آزمایی:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## حالت‌های فضای کاری

این مهم‌ترین تصمیم هنگام استفاده از OpenShell است.

### `mirror`

وقتی می‌خواهید **فضای کاری محلی مرجع باقی بماند**، از
`plugins.entries.openshell.config.mode: "mirror"` استفاده کنید.

رفتار:

- پیش از `exec`، OpenClaw فضای کاری محلی را در سندباکس OpenShell همگام‌سازی می‌کند.
- پس از `exec`، OpenClaw فضای کاری راه دور را دوباره با فضای کاری محلی همگام‌سازی می‌کند.
- ابزارهای فایل همچنان از طریق پل سندباکس عمل می‌کنند، اما فضای کاری محلی
  بین نوبت‌ها منبع حقیقت باقی می‌ماند.

مناسب برای:

- فایل‌ها را بیرون از OpenClaw به‌صورت محلی ویرایش می‌کنید و می‌خواهید آن تغییرات به‌طور خودکار در
  سندباکس دیده شوند.
- می‌خواهید سندباکس OpenShell تا جای ممکن شبیه بک‌اند Docker رفتار کند.
- می‌خواهید فضای کاری میزبان پس از هر نوبت exec، نوشتن‌های سندباکس را منعکس کند.

مصالحه: هزینه همگام‌سازی بیشتر پیش و پس از هر exec.

### `remote`

وقتی می‌خواهید **فضای کاری OpenShell مرجع شود**، از
`plugins.entries.openshell.config.mode: "remote"` استفاده کنید.

رفتار:

- وقتی سندباکس برای نخستین بار ایجاد می‌شود، OpenClaw یک بار فضای کاری راه دور را از
  فضای کاری محلی بذرگذاری می‌کند.
- پس از آن، `exec`، `read`، `write`، `edit` و `apply_patch` مستقیماً روی
  فضای کاری راه دور OpenShell عمل می‌کنند.
- OpenClaw تغییرات راه دور را **به** فضای کاری محلی همگام‌سازی نمی‌کند.
- خواندن رسانه در زمان پرامپت همچنان کار می‌کند، چون ابزارهای فایل و رسانه از طریق
  پل سندباکس می‌خوانند.

مناسب برای:

- سندباکس باید عمدتاً در سمت راه دور زندگی کند.
- می‌خواهید سربار همگام‌سازی در هر نوبت کمتر باشد.
- نمی‌خواهید ویرایش‌های محلی میزبان بی‌صدا وضعیت سندباکس راه دور را بازنویسی کنند.

<Warning>
اگر پس از بذرگذاری اولیه فایل‌ها را روی میزبان و بیرون از OpenClaw ویرایش کنید، سندباکس راه دور آن تغییرات را **نمی‌بیند**. برای بذرگذاری دوباره از `openclaw sandbox recreate` استفاده کنید.
</Warning>

### انتخاب حالت

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **فضای کاری مرجع**       | میزبان محلی                | OpenShell راه دور         |
| **جهت همگام‌سازی**       | دوطرفه (هر exec)           | بذرگذاری یک‌باره          |
| **سربار هر نوبت**        | بیشتر (آپلود + دانلود)     | کمتر (عملیات مستقیم راه دور) |
| **ویرایش‌های محلی دیده می‌شوند؟** | بله، در exec بعدی          | خیر، تا زمان recreate     |
| **بهترین کاربرد**        | گردش‌کارهای توسعه          | عامل‌های طولانی‌مدت، CI   |

## مرجع پیکربندی

همه پیکربندی OpenShell زیر `plugins.entries.openshell.config` قرار دارد:

| کلید                      | نوع                      | پیش‌فرض       | توضیح                                                 |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` یا `"remote"` | `"mirror"`    | حالت همگام‌سازی فضای کاری                             |
| `command`                 | `string`                 | `"openshell"` | مسیر یا نام CLI مربوط به `openshell`                  |
| `from`                    | `string`                 | `"openclaw"`  | منبع سندباکس برای ایجاد نخستین‌بار                    |
| `gateway`                 | `string`                 | —             | نام Gateway مربوط به OpenShell (`--gateway`)          |
| `gatewayEndpoint`         | `string`                 | —             | URL نقطه پایانی Gateway مربوط به OpenShell (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | شناسه خط‌مشی OpenShell برای ایجاد سندباکس             |
| `providers`               | `string[]`               | `[]`          | نام ارائه‌دهندگانی که هنگام ایجاد سندباکس پیوست می‌شوند |
| `gpu`                     | `boolean`                | `false`       | درخواست منابع GPU                                    |
| `autoProviders`           | `boolean`                | `true`        | ارسال `--auto-providers` هنگام ایجاد سندباکس          |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | فضای کاری اصلی قابل نوشتن داخل سندباکس                |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | مسیر mount فضای کاری عامل (برای دسترسی فقط‌خواندنی)   |
| `timeoutSeconds`          | `number`                 | `120`         | مهلت زمانی برای عملیات CLI مربوط به `openshell`       |

تنظیمات سطح سندباکس (`mode`، `scope`، `workspaceAccess`) مانند هر بک‌اند دیگری زیر
`agents.defaults.sandbox` پیکربندی می‌شوند. برای ماتریس کامل، [سندباکس‌گذاری](/fa/gateway/sandboxing) را ببینید.

## نمونه‌ها

### راه‌اندازی راه دور حداقلی

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

### حالت Mirror با GPU

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "agent",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "mirror",
          gpu: true,
          providers: ["openai"],
          timeoutSeconds: 180,
        },
      },
    },
  },
}
```

### OpenShell برای هر عامل با Gateway سفارشی

```json5
{
  agents: {
    defaults: {
      sandbox: { mode: "off" },
    },
    list: [
      {
        id: "researcher",
        sandbox: {
          mode: "all",
          backend: "openshell",
          scope: "agent",
          workspaceAccess: "rw",
        },
      },
    ],
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
          gateway: "lab",
          gatewayEndpoint: "https://lab.example",
          policy: "strict",
        },
      },
    },
  },
}
```

## مدیریت چرخه عمر

سندباکس‌های OpenShell از طریق CLI معمول سندباکس مدیریت می‌شوند:

```bash
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

برای حالت `remote`، **recreate اهمیت ویژه‌ای دارد**: این کار فضای کاری راه دور مرجع را
برای آن دامنه حذف می‌کند. استفاده بعدی یک فضای کاری راه دور تازه را از
فضای کاری محلی بذرگذاری می‌کند.

برای حالت `mirror`، recreate عمدتاً محیط اجرای راه دور را بازنشانی می‌کند، چون
فضای کاری محلی مرجع باقی می‌ماند.

### چه زمانی recreate کنیم

پس از تغییر هرکدام از موارد زیر recreate کنید:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## سخت‌سازی امنیتی

OpenShell ریشه فضای کاری fd را ثابت نگه می‌دارد و پیش از هر
read هویت سندباکس را دوباره بررسی می‌کند، بنابراین جابه‌جایی symlink یا mount دوباره فضای کاری نمی‌تواند خواندن‌ها را به بیرون از
فضای کاری راه دور موردنظر هدایت کند.

## محدودیت‌های فعلی

- مرورگر سندباکس در بک‌اند OpenShell پشتیبانی نمی‌شود.
- `sandbox.docker.binds` روی OpenShell اعمال نمی‌شود.
- تنظیمات runtime اختصاصی Docker زیر `sandbox.docker.*` فقط روی بک‌اند Docker
  اعمال می‌شوند.

## نحوه کار

1. OpenClaw فرمان `openshell sandbox create` را فراخوانی می‌کند (با پرچم‌های `--from`، `--gateway`،
   `--policy`، `--providers`، `--gpu` مطابق پیکربندی).
2. OpenClaw برای دریافت جزئیات اتصال SSH سندباکس، `openshell sandbox ssh-config <name>` را فراخوانی می‌کند.
3. هسته پیکربندی SSH را در یک فایل موقت می‌نویسد و با استفاده از همان
   پل سیستم فایل راه دورِ بک‌اند عمومی SSH، یک نشست SSH باز می‌کند.
4. در حالت `mirror`: پیش از exec از محلی به راه دور همگام‌سازی می‌کند، اجرا می‌کند، و پس از exec دوباره همگام می‌کند.
5. در حالت `remote`: هنگام ایجاد یک بار بذرگذاری می‌کند، سپس مستقیماً روی
   فضای کاری راه دور عمل می‌کند.

## مرتبط

- [سندباکس‌گذاری](/fa/gateway/sandboxing) -- حالت‌ها، دامنه‌ها و مقایسه بک‌اندها
- [سندباکس در برابر خط‌مشی ابزار در برابر Elevated](/fa/gateway/sandbox-vs-tool-policy-vs-elevated) -- اشکال‌زدایی ابزارهای مسدودشده
- [سندباکس و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) -- بازنویسی‌های هر عامل
- [CLI سندباکس](/fa/cli/sandbox) -- فرمان‌های `openclaw sandbox`

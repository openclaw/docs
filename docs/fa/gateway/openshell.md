---
read_when:
    - شما به‌جای Docker محلی، محیط‌های ایزوله مدیریت‌شده در فضای ابری می‌خواهید
    - در حال راه‌اندازی Pluginِ OpenShell هستید
    - باید بین حالت‌های فضای کاری آینه‌ای و راه‌دور یکی را انتخاب کنید
summary: از OpenShell به‌عنوان بک‌اند سندباکس مدیریت‌شده برای عامل‌های OpenClaw استفاده کنید
title: OpenShell
x-i18n:
    generated_at: "2026-07-12T10:07:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf5c33912bd0db759a01cf58ea26712a8ada68c0804bf16f69f1f7cdd496828c
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell یک بک‌اند سندباکس مدیریت‌شده است: به‌جای اجرای محلی کانتینرهای Docker، OpenClaw چرخهٔ عمر سندباکس را به CLIِ `openshell` واگذار می‌کند که محیط‌های راه‌دور را فراهم می‌سازد و فرمان‌ها را از طریق SSH اجرا می‌کند.

این Plugin از همان انتقال SSH و پل فایل‌سیستم راه‌دورِ [بک‌اند SSH](/fa/gateway/sandboxing#ssh-backend) عمومی استفاده می‌کند و چرخهٔ عمر OpenShell (`sandbox create/get/delete/ssh-config`) را به‌همراه حالت اختیاری همگام‌سازی فضای کاری `mirror` می‌افزاید.

## پیش‌نیازها

- Pluginِ OpenShell نصب‌شده باشد (`openclaw plugins install @openclaw/openshell-sandbox`)
- CLIِ `openshell` در `PATH` موجود باشد (یا مسیر سفارشی از طریق `plugins.entries.openshell.config.command` تنظیم شود)
- یک حساب OpenShell با دسترسی به سندباکس
- Gatewayِ OpenClaw روی میزبان در حال اجرا باشد

## شروع سریع

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

Gateway را راه‌اندازی مجدد کنید. در نوبت بعدی عامل، OpenClaw یک سندباکس OpenShell ایجاد می‌کند و اجرای ابزار را از طریق آن هدایت می‌کند. با فرمان‌های زیر بررسی کنید:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## حالت‌های فضای کاری

این مهم‌ترین تصمیم در OpenShell است.

### mirror (پیش‌فرض)

`plugins.entries.openshell.config.mode: "mirror"` **فضای کاری محلی را مرجع اصلی** نگه می‌دارد:

- پیش از `exec`، OpenClaw فضای کاری محلی را با سندباکس همگام می‌کند.
- پس از `exec`، OpenClaw فضای کاری راه‌دور را با محیط محلی همگام می‌کند.
- ابزارهای فایل از پل سندباکس عبور می‌کنند، اما بین نوبت‌ها محیط محلی منبع حقیقت باقی می‌ماند.

مناسب‌ترین گزینه برای گردش‌کارهای توسعه: ویرایش‌های محلی خارج از OpenClaw در اجرای بعدی `exec` ظاهر می‌شوند و رفتار سندباکس به بک‌اند Docker نزدیک است.

هزینه: هزینهٔ بارگذاری و بارگیری در هر نوبت `exec`.

### remote

`mode: "remote"` **فضای کاری OpenShell را مرجع اصلی** قرار می‌دهد:

- هنگام نخستین ایجاد سندباکس، OpenClaw فقط یک‌بار فضای کاری راه‌دور را از محیط محلی مقداردهی اولیه می‌کند.
- پس از آن، `exec`، `read`، `write`، `edit` و `apply_patch` مستقیماً روی فضای کاری راه‌دور عمل می‌کنند. OpenClaw تغییرات راه‌دور را با محیط محلی همگام **نمی‌کند**.
- خواندن رسانه‌ها هنگام ساخت اعلان همچنان کار می‌کند (ابزارهای فایل/رسانه از طریق پل سندباکس می‌خوانند).

مناسب‌ترین گزینه برای عامل‌های طولانی‌مدت و CI: سربار کمتر در هر نوبت، و ویرایش‌های محلی میزبان نمی‌توانند بدون اطلاع وضعیت راه‌دور را بازنویسی کنند.

<Warning>
ویرایش فایل‌ها روی میزبان و خارج از OpenClaw پس از مقداردهی اولیه، برای سندباکس راه‌دور قابل مشاهده نیست. برای مقداردهی مجدد، `openclaw sandbox recreate` را اجرا کنید.
</Warning>

### انتخاب حالت

|                          | `mirror`                         | `remote`                         |
| ------------------------ | -------------------------------- | -------------------------------- |
| **فضای کاری مرجع**       | میزبان محلی                      | OpenShell راه‌دور                 |
| **جهت همگام‌سازی**       | دوسویه (در هر exec)              | مقداردهی اولیهٔ یک‌باره          |
| **سربار هر نوبت**        | بیشتر (بارگذاری + بارگیری)       | کمتر (عملیات مستقیم راه‌دور)     |
| **نمایان بودن ویرایش‌های محلی؟** | بله، در exec بعدی         | خیر، تا زمان ایجاد مجدد          |
| **مناسب برای**           | گردش‌کارهای توسعه                | عامل‌های طولانی‌مدت، CI          |

## مرجع پیکربندی

تمام پیکربندی OpenShell زیر `plugins.entries.openshell.config` قرار دارد:

| کلید                      | نوع                      | پیش‌فرض      | توضیحات                                                                                         |
| ------------------------- | ------------------------ | ------------ | ------------------------------------------------------------------------------------------------ |
| `mode`                    | `"mirror"` یا `"remote"` | `"mirror"`   | حالت همگام‌سازی فضای کاری                                                                       |
| `command`                 | `string`                 | `"openshell"` | مسیر یا نام CLIِ `openshell`                                                                    |
| `from`                    | `string`                 | `"openclaw"` | منبع سندباکس برای ایجاد نخستین‌بار                                                              |
| `gateway`                 | `string`                 | تنظیم‌نشده   | نام Gatewayِ OpenShell (`--gateway` در سطح بالا)                                                 |
| `gatewayEndpoint`         | `string`                 | تنظیم‌نشده   | نقطهٔ پایانی Gatewayِ OpenShell (`--gateway-endpoint` در سطح بالا)                               |
| `policy`                  | `string`                 | تنظیم‌نشده   | شناسهٔ خط‌مشی OpenShell برای ایجاد سندباکس                                                       |
| `providers`               | `string[]`               | `[]`         | نام ارائه‌دهندگانی که هنگام ایجاد سندباکس متصل می‌شوند (بدون تکرار، یک پرچم `--provider` برای هر ورودی) |
| `gpu`                     | `boolean`                | `false`      | درخواست منابع GPU (`--gpu`)                                                                     |
| `autoProviders`           | `boolean`                | `true`       | ارسال `--auto-providers` (یا در صورت false بودن، `--no-auto-providers`) هنگام ایجاد              |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"` | فضای کاری اصلی و قابل‌نوشتن درون سندباکس                                                        |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`   | مسیر اتصال فضای کاری عامل (وقتی دسترسی فضای کاری `rw` نباشد، فقط‌خواندنی است)                    |
| `timeoutSeconds`          | `number`                 | `120`        | مهلت زمانی عملیات CLIِ `openshell`                                                               |

`remoteWorkspaceDir` و `remoteAgentWorkspaceDir` باید مسیرهای مطلق باشند و زیر ریشه‌های مدیریت‌شدهٔ `/sandbox` یا `/agent` باقی بمانند؛ سایر مسیرهای مطلق رد می‌شوند.

تنظیمات سطح سندباکس (`mode`، `scope`، `workspaceAccess`) مانند هر بک‌اند دیگری زیر `agents.defaults.sandbox` قرار می‌گیرند. برای ماتریس کامل، به [سندباکس‌سازی](/fa/gateway/sandboxing) مراجعه کنید.

## نمونه‌ها

### راه‌اندازی حداقلی راه‌دور

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

### OpenShell به‌ازای هر عامل با Gateway سفارشی

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

## مدیریت چرخهٔ عمر

```bash
# فهرست همهٔ محیط‌های اجرای سندباکس (Docker + OpenShell)
openclaw sandbox list

# بررسی خط‌مشی مؤثر
openclaw sandbox explain

# ایجاد مجدد (فضای کاری راه‌دور را حذف می‌کند و در استفادهٔ بعدی دوباره مقداردهی می‌شود)
openclaw sandbox recreate --all
```

در حالت `remote`، ایجاد مجدد اهمیت ویژه‌ای دارد: این کار فضای کاری راه‌دور مرجع را برای آن دامنه حذف می‌کند و در استفادهٔ بعدی، یک فضای کاری تازه از محیط محلی مقداردهی می‌شود. در حالت `mirror`، ایجاد مجدد عمدتاً محیط اجرای راه‌دور را بازنشانی می‌کند، زیرا محیط محلی مرجع اصلی باقی می‌ماند.

پس از تغییر هر یک از موارد زیر، سندباکس را دوباره ایجاد کنید:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

## مقاوم‌سازی امنیتی

پل فایل‌سیستم حالت mirror، ریشهٔ فضای کاری محلی را ثابت می‌کند و پیش از هر عملیات خواندن، نوشتن، mkdir، حذف و تغییر نام، مسیرهای متعارف را (از طریق realpath) دوباره بررسی می‌کند و پیوندهای نمادین میانی را رد می‌کند. تعویض پیوند نمادین یا اتصال مجدد فضای کاری نمی‌تواند دسترسی فایل را به خارج از درخت آینه‌شده هدایت کند.

## محدودیت‌های کنونی

- مرورگر سندباکس در بک‌اند OpenShell پشتیبانی نمی‌شود.
- `sandbox.docker.binds` برای OpenShell اعمال نمی‌شود؛ اگر اتصال‌ها پیکربندی شده باشند، ایجاد سندباکس ناموفق خواهد بود.
- گزینه‌های اختصاصی زمان اجرای Docker زیر `sandbox.docker.*` (به‌جز `env`) فقط برای بک‌اند Docker اعمال می‌شوند.

## نحوهٔ کار

1. OpenClaw فرمان `sandbox get` را برای نام سندباکس اجرا می‌کند (همراه با هر `--gateway`/`--gateway-endpoint` پیکربندی‌شده)؛ اگر ناموفق باشد، با `sandbox create` یک سندباکس ایجاد می‌کند و `--name`، `--from`، در صورت تنظیم `--policy`، در صورت فعال بودن `--gpu`، یکی از `--auto-providers`/`--no-auto-providers` و برای هر ارائه‌دهندهٔ پیکربندی‌شده یک پرچم `--provider` را ارسال می‌کند.
2. OpenClaw فرمان `sandbox ssh-config` را برای نام سندباکس اجرا می‌کند تا جزئیات اتصال SSH را دریافت کند.
3. هسته، پیکربندی SSH را در یک فایل موقت می‌نویسد و از طریق همان پل فایل‌سیستم راه‌دورِ بک‌اند SSH عمومی، یک نشست SSH باز می‌کند.
4. در حالت `mirror`: پیش از exec محیط محلی با راه‌دور همگام می‌شود، فرمان اجرا می‌شود و سپس تغییرات به محیط محلی بازگردانده می‌شوند.
5. در حالت `remote`: هنگام ایجاد فقط یک‌بار مقداردهی می‌شود و سپس عملیات مستقیماً روی فضای کاری راه‌دور انجام می‌شوند.

## مرتبط

- [سندباکس‌سازی](/fa/gateway/sandboxing) - حالت‌ها، دامنه‌ها و مقایسهٔ بک‌اندها
- [سندباکس در برابر خط‌مشی ابزار در برابر دسترسی ارتقایافته](/fa/gateway/sandbox-vs-tool-policy-vs-elevated) - اشکال‌زدایی ابزارهای مسدودشده
- [سندباکس و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) - بازنویسی تنظیمات به‌ازای هر عامل
- [CLI سندباکس](/fa/cli/sandbox) - فرمان‌های `openclaw sandbox`

---
read_when:
    - سندباکس‌های مدیریت‌شده در ابر را به‌جای Docker محلی می‌خواهید
    - شما در حال راه‌اندازی Plugin OpenShell هستید
    - باید بین حالت‌های فضای کاری آینه‌ای و راه‌دور انتخاب کنید.
summary: از OpenShell به‌عنوان بک‌اند sandbox مدیریت‌شده برای عامل‌های OpenClaw استفاده کنید
title: OpenShell
x-i18n:
    generated_at: "2026-04-29T22:54:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 694a0a145802f4b624af01b58cbb5886bab7426fb9a90f216480141082089144
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell یک backend sandbox مدیریت‌شده برای OpenClaw است. به‌جای اجرای Docker
containerها به‌صورت محلی، OpenClaw چرخهٔ عمر sandbox را به CLI
`openshell` واگذار می‌کند که محیط‌های remote را با اجرای command مبتنی بر SSH فراهم می‌کند.

Plugin مربوط به OpenShell همان transport هسته‌ای SSH و bridge فایل‌سیستم remote
را مانند [SSH backend](/fa/gateway/sandboxing#ssh-backend) عمومی دوباره استفاده می‌کند. این Plugin
چرخهٔ عمر ویژهٔ OpenShell (`sandbox create/get/delete`، `sandbox ssh-config`)
و یک حالت workspace اختیاری `mirror` را اضافه می‌کند.

## پیش‌نیازها

- CLI `openshell` نصب شده و روی `PATH` باشد (یا یک مسیر سفارشی از طریق
  `plugins.entries.openshell.config.command` تنظیم کنید)
- یک حساب OpenShell با دسترسی sandbox
- OpenClaw Gateway در حال اجرا روی host

## شروع سریع

1. Plugin را فعال کنید و sandbox backend را تنظیم کنید:

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

2. Gateway را راه‌اندازی مجدد کنید. در turn بعدی agent، OpenClaw یک sandbox
   OpenShell ایجاد می‌کند و اجرای ابزار را از طریق آن هدایت می‌کند.

3. بررسی کنید:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## حالت‌های workspace

این مهم‌ترین تصمیم هنگام استفاده از OpenShell است.

### `mirror`

وقتی می‌خواهید **workspace محلی canonical باقی بماند** از
`plugins.entries.openshell.config.mode: "mirror"` استفاده کنید.

رفتار:

- پیش از `exec`، OpenClaw workspace محلی را به sandbox OpenShell همگام‌سازی می‌کند.
- پس از `exec`، OpenClaw workspace remote را به workspace محلی همگام‌سازی می‌کند.
- ابزارهای فایل همچنان از طریق bridge sandbox عمل می‌کنند، اما workspace محلی
  بین turnها source of truth باقی می‌ماند.

بهترین گزینه برای:

- فایل‌ها را به‌صورت محلی و خارج از OpenClaw ویرایش می‌کنید و می‌خواهید آن تغییرات
  به‌طور خودکار در sandbox قابل مشاهده باشند.
- می‌خواهید sandbox OpenShell تا حد امکان شبیه Docker backend رفتار کند.
- می‌خواهید workspace روی host پس از هر turn اجرای exec، نوشته‌های sandbox را منعکس کند.

نقطهٔ مصالحه: هزینهٔ همگام‌سازی اضافی پیش و پس از هر exec.

### `remote`

وقتی می‌خواهید **workspace مربوط به OpenShell canonical شود** از
`plugins.entries.openshell.config.mode: "remote"` استفاده کنید.

رفتار:

- وقتی sandbox برای نخستین بار ایجاد می‌شود، OpenClaw workspace remote را یک‌بار از
  workspace محلی seed می‌کند.
- پس از آن، `exec`، `read`، `write`، `edit`، و `apply_patch` مستقیماً روی
  workspace remote OpenShell عمل می‌کنند.
- OpenClaw تغییرات remote را به workspace محلی همگام‌سازی **نمی‌کند**.
- خواندن media در زمان prompt همچنان کار می‌کند، چون ابزارهای فایل و media از طریق
  bridge مربوط به sandbox می‌خوانند.

بهترین گزینه برای:

- sandbox باید عمدتاً در سمت remote زندگی کند.
- می‌خواهید سربار همگام‌سازی هر turn کمتر باشد.
- نمی‌خواهید ویرایش‌های host-local به‌صورت بی‌صدا وضعیت sandbox remote را overwrite کنند.

<Warning>
اگر پس از seed اولیه، فایل‌ها را روی host و خارج از OpenClaw ویرایش کنید، sandbox remote آن تغییرات را **نمی‌بیند**. برای seed دوباره از `openclaw sandbox recreate` استفاده کنید.
</Warning>

### انتخاب حالت

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **workspace canonical**  | host محلی                  | OpenShell remote          |
| **جهت همگام‌سازی**       | دوطرفه (هر exec)           | seed یک‌باره              |
| **سربار هر turn**        | بیشتر (upload + download)  | کمتر (عملیات remote مستقیم) |
| **ویرایش‌های محلی قابل مشاهده‌اند؟** | بله، در exec بعدی          | نه، تا زمان recreate      |
| **بهترین برای**          | workflowهای توسعه          | agentهای طولانی‌مدت، CI   |

## مرجع پیکربندی

تمام config مربوط به OpenShell زیر `plugins.entries.openshell.config` قرار دارد:

| کلید                      | نوع                      | پیش‌فرض       | توضیح                                                |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` یا `"remote"` | `"mirror"`    | حالت همگام‌سازی workspace                            |
| `command`                 | `string`                 | `"openshell"` | مسیر یا نام CLI `openshell`                          |
| `from`                    | `string`                 | `"openclaw"`  | منبع sandbox برای ایجاد نخستین‌بار                   |
| `gateway`                 | `string`                 | —             | نام OpenShell gateway (`--gateway`)                  |
| `gatewayEndpoint`         | `string`                 | —             | URL endpoint مربوط به OpenShell gateway (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | شناسهٔ policy مربوط به OpenShell برای ایجاد sandbox  |
| `providers`               | `string[]`               | `[]`          | نام providerهایی که هنگام ایجاد sandbox متصل می‌شوند |
| `gpu`                     | `boolean`                | `false`       | درخواست منابع GPU                                   |
| `autoProviders`           | `boolean`                | `true`        | هنگام ایجاد sandbox، `--auto-providers` را pass می‌کند |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | workspace اصلی قابل نوشتن داخل sandbox              |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | مسیر mount مربوط به workspace agent (برای دسترسی read-only) |
| `timeoutSeconds`          | `number`                 | `120`         | timeout برای عملیات CLI `openshell`                  |

تنظیمات سطح sandbox (`mode`، `scope`، `workspaceAccess`) مانند هر backend دیگری زیر
`agents.defaults.sandbox` پیکربندی می‌شوند. برای matrix کامل، [Sandboxing](/fa/gateway/sandboxing) را ببینید.

## مثال‌ها

### راه‌اندازی حداقلی remote

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

### حالت mirror با GPU

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

### OpenShell برای هر agent با gateway سفارشی

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

sandboxهای OpenShell از طریق CLI معمول sandbox مدیریت می‌شوند:

```bash
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

برای حالت `remote`، **recreate اهمیت ویژه‌ای دارد**: این کار workspace remote canonical
برای آن scope را حذف می‌کند. استفادهٔ بعدی یک workspace remote تازه را از
workspace محلی seed می‌کند.

برای حالت `mirror`، recreate عمدتاً محیط اجرای remote را reset می‌کند، چون
workspace محلی canonical باقی می‌ماند.

### چه زمانی recreate کنید

پس از تغییر هرکدام از موارد زیر recreate کنید:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## سخت‌سازی امنیتی

OpenShell ریشهٔ workspace fd را pin می‌کند و پیش از هر read، هویت sandbox را دوباره بررسی می‌کند،
بنابراین تعویض symlink یا remount شدن workspace نمی‌تواند readها را به خارج از
workspace remote مورد نظر redirect کند.

## محدودیت‌های فعلی

- مرورگر sandbox روی OpenShell backend پشتیبانی نمی‌شود.
- `sandbox.docker.binds` برای OpenShell اعمال نمی‌شود.
- knobهای runtime مخصوص Docker زیر `sandbox.docker.*` فقط برای Docker
  backend اعمال می‌شوند.

## نحوهٔ کار

1. OpenClaw فراخوانی `openshell sandbox create` را انجام می‌دهد (با flagهای
   `--from`، `--gateway`، `--policy`، `--providers`، `--gpu` طبق config).
2. OpenClaw فراخوانی `openshell sandbox ssh-config <name>` را انجام می‌دهد تا جزئیات
   اتصال SSH برای sandbox را دریافت کند.
3. هسته config مربوط به SSH را در یک فایل temp می‌نویسد و با استفاده از همان
   bridge فایل‌سیستم remote مانند SSH backend عمومی، یک session SSH باز می‌کند.
4. در حالت `mirror`: پیش از exec از local به remote همگام‌سازی می‌کند، اجرا می‌کند، و پس از exec دوباره همگام‌سازی می‌کند.
5. در حالت `remote`: هنگام create یک‌بار seed می‌کند، سپس مستقیماً روی workspace
   remote عمل می‌کند.

## مرتبط

- [Sandboxing](/fa/gateway/sandboxing) -- حالت‌ها، scopeها، و مقایسهٔ backend
- [Sandbox در برابر Tool Policy در برابر Elevated](/fa/gateway/sandbox-vs-tool-policy-vs-elevated) -- اشکال‌زدایی ابزارهای block شده
- [Sandbox و ابزارهای چند-agentی](/fa/tools/multi-agent-sandbox-tools) -- overrideهای per-agent
- [CLI مربوط به Sandbox](/fa/cli/sandbox) -- commandهای `openclaw sandbox`

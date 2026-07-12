---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'نحوهٔ عملکرد سندباکس OpenClaw: حالت‌ها، دامنه‌ها، دسترسی به فضای کاری و ایمیج‌ها'
title: سندباکس‌سازی
x-i18n:
    generated_at: "2026-07-12T10:05:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60d6695c5d8f4e8d3bfb80dd387a50c104dc4e140d5974a66d5a2176594782a4
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw می‌تواند اجرای ابزارها را درون یک بک‌اند سندباکس انجام دهد تا دامنهٔ آسیب احتمالی کاهش یابد. سندباکس‌سازی به‌طور پیش‌فرض غیرفعال است و با `agents.defaults.sandbox` (سراسری) یا `agents.list[].sandbox` (برای هر عامل) کنترل می‌شود. فرایند Gateway همیشه روی میزبان باقی می‌ماند؛ در صورت فعال‌سازی، فقط اجرای ابزارها به سندباکس منتقل می‌شود.

<Note>
این یک مرز امنیتی بی‌نقص نیست، اما وقتی مدل کار نابخردانه‌ای انجام می‌دهد، دسترسی به سیستم فایل و فرایندها را به‌طور محسوسی محدود می‌کند.
</Note>

## چه چیزهایی در سندباکس اجرا می‌شوند

- اجرای ابزارها: `exec`، `read`، `write`، `edit`، `apply_patch`، `process` و غیره.
- مرورگر سندباکس‌شدهٔ اختیاری (`agents.defaults.sandbox.browser`).

مواردی که در سندباکس اجرا نمی‌شوند:

- خود فرایند Gateway.
- هر ابزاری که از طریق `tools.elevated` صراحتاً اجازه داشته باشد بیرون از سندباکس اجرا شود. اجرای ارتقایافته سندباکس‌سازی را دور می‌زند و در مسیر خروج پیکربندی‌شده اجرا می‌شود (به‌طور پیش‌فرض `gateway`، یا هنگامی که مقصد اجرا `node` است، `node`). اگر سندباکس‌سازی غیرفعال باشد، `tools.elevated` هیچ تغییری ایجاد نمی‌کند، زیرا اجرا از قبل روی میزبان انجام می‌شود. به [حالت ارتقایافته](/fa/tools/elevated) مراجعه کنید.

## حالت‌ها، دامنه و بک‌اند

سه تنظیم مستقل رفتار سندباکس را کنترل می‌کنند:

| تنظیم | کلید                               | مقادیر                       | پیش‌فرض  |
| ------- | --------------------------------- | ---------------------------- | -------- |
| حالت    | `agents.defaults.sandbox.mode`    | `off`، `non-main`، `all`     | `off`    |
| دامنه   | `agents.defaults.sandbox.scope`   | `agent`، `session`، `shared` | `agent`  |
| بک‌اند | `agents.defaults.sandbox.backend` | `docker`، `ssh`، `openshell` | `docker` |

**حالت** تعیین می‌کند سندباکس‌سازی چه زمانی اعمال شود:

- `off`: بدون سندباکس‌سازی.
- `non-main`: همهٔ نشست‌ها به‌جز نشست اصلی عامل در سندباکس اجرا می‌شوند. کلید نشست اصلی همیشه `agent:<agentId>:main` است (یا وقتی `session.scope` برابر `"global"` باشد، `global`) و قابل پیکربندی نیست. نشست‌های گروهی/کانالی از کلیدهای خود استفاده می‌کنند، بنابراین همیشه غیر اصلی محسوب می‌شوند و در سندباکس اجرا خواهند شد.
- `all`: همهٔ نشست‌ها در سندباکس اجرا می‌شوند.

**دامنه** تعیین می‌کند چند کانتینر/محیط ایجاد شود:

- `agent`: یک کانتینر برای هر عامل.
- `session`: یک کانتینر برای هر نشست.
- `shared`: یک کانتینر مشترک میان همهٔ نشست‌های سندباکس‌شده (در این دامنه، بازنویسی‌های مختص هر عامل برای `docker`/`ssh`/`browser` نادیده گرفته می‌شوند).

**بک‌اند** تعیین می‌کند کدام محیط اجرا ابزارهای سندباکس‌شده را اجرا کند. پیکربندی مختص SSH زیر `agents.defaults.sandbox.ssh` و پیکربندی مختص OpenShell زیر `plugins.entries.openshell.config` قرار دارد.

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **محل اجرا**   | کانتینر محلی                  | هر میزبان قابل‌دسترسی با SSH        | سندباکس مدیریت‌شده توسط OpenShell                           |
| **راه‌اندازی**           | `scripts/sandbox-setup.sh`       | کلید SSH + میزبان مقصد          | Plugin مربوط به OpenShell فعال باشد                            |
| **مدل فضای کاری** | اتصال مستقیم یا کپی               | مرجع راه‌دور (یک‌بار مقداردهی اولیه)   | `mirror` یا `remote`                                |
| **کنترل شبکه** | `docker.network` (پیش‌فرض: هیچ‌کدام) | وابسته به میزبان راه‌دور         | وابسته به OpenShell                                |
| **سندباکس مرورگر** | پشتیبانی می‌شود                        | پشتیبانی نمی‌شود                  | هنوز پشتیبانی نمی‌شود                                   |
| **اتصال‌های مستقیم**     | `docker.binds`                   | نامرتبط                            | نامرتبط                                                 |
| **مناسب برای**        | توسعهٔ محلی، جداسازی کامل        | واگذاری پردازش به یک دستگاه راه‌دور | سندباکس‌های راه‌دور مدیریت‌شده با همگام‌سازی دوطرفهٔ اختیاری |

## بک‌اند Docker

پس از فعال‌شدن سندباکس‌سازی، Docker بک‌اند پیش‌فرض است. ابزارها و مرورگرهای سندباکس را به‌صورت محلی از طریق سوکت دیمن Docker (`/var/run/docker.sock`) اجرا می‌کند؛ جداسازی توسط فضای نام‌های Docker فراهم می‌شود.

پیش‌فرض‌ها: `network: "none"` (بدون دسترسی خروجی)، `readOnlyRoot: true`، `capDrop: ["ALL"]`، تصویر `openclaw-sandbox:bookworm-slim`.

برای در دسترس قرار دادن GPUهای میزبان، `agents.defaults.sandbox.docker.gpus` (یا بازنویسی مختص هر عامل) را روی مقداری مانند `"all"` یا `"device=GPU-uuid"` تنظیم کنید. این مقدار به پرچم `--gpus` در Docker منتقل می‌شود و به یک محیط اجرای سازگار روی میزبان، مانند NVIDIA Container Toolkit، نیاز دارد.

<Warning>
**Docker بیرون از Docker (DooD): محدودیت‌ها**

اگر خود Gateway متعلق به OpenClaw را به‌صورت کانتینر Docker استقرار دهید، با استفاده از سوکت Docker میزبان، کانتینرهای سندباکس هم‌سطح را هماهنگ می‌کند (DooD). این کار یک محدودیت نگاشت مسیر ایجاد می‌کند:

- **پیکربندی به مسیرهای میزبان نیاز دارد**: مقدار `workspace` در `openclaw.json` باید شامل **مسیر مطلق میزبان** باشد (برای مثال `/home/user/.openclaw/workspaces`)، نه مسیر داخلی کانتینر Gateway. دیمن Docker مسیرها را نسبت به فضای نام سیستم‌عامل میزبان ارزیابی می‌کند، نه فضای نام خود Gateway.
- **نگاشت حجمی یکسان الزامی است**: فرایند Gateway فایل‌های Heartbeat و پل را نیز در همان مسیر `workspace` می‌نویسد. یک نگاشت حجمی یکسان (`-v /home/user/.openclaw:/home/user/.openclaw`) به کانتینر Gateway بدهید تا همان مسیر میزبان از درون کانتینر Gateway نیز به‌درستی resolve شود. نگاشت‌های ناسازگار هنگامی که Gateway می‌کوشد Heartbeat خود را بنویسد، به‌صورت `EACCES` نمایان می‌شوند.
- **حالت کد Codex**: وقتی یک سندباکس OpenClaw فعال باشد، OpenClaw حالت کد بومی app-server در Codex، سرورهای MCP کاربر و اجرای Pluginهای متکی به برنامه را برای آن نوبت غیرفعال می‌کند (این موارد از فرایند app-server میزبان Gateway اجرا می‌شوند، نه از بک‌اند سندباکس OpenClaw)، مگر آنکه خط‌مشی ابزار سندباکس ابزارهای لازم را در دسترس قرار دهد و مسیر آزمایشی exec-server سندباکس را فعال کنید. سپس دسترسی پوسته از طریق ابزارهای متکی به سندباکس OpenClaw، مانند `sandbox_exec` و `sandbox_process`، مسیریابی می‌شود. سوکت Docker میزبان را داخل کانتینرهای سندباکس عامل یا سندباکس‌های سفارشی Codex متصل نکنید. برای رفتار کامل، به [مهار Codex](/fa/plugins/codex-harness) مراجعه کنید.

در میزبان‌های Ubuntu/AppArmor که حالت سندباکس Docker فعال است، اجرای پوستهٔ `workspace-write` در app-server متعلق به Codex به فضای نام کاربر بدون امتیاز درون کانتینر سندباکس نیاز دارد و اگر کاربر سرویس نتواند آن را ایجاد کند، ممکن است پیش از راه‌اندازی پوسته شکست بخورد. وقتی دسترسی خروجی سندباکس Docker غیرفعال است (`network: "none"` که مقدار پیش‌فرض است)، این فرایند به یک فضای نام شبکهٔ بدون امتیاز نیز نیاز دارد. نشانه‌های رایج: `bwrap: setting up uid map: Permission denied` و `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. دستور `openclaw doctor` را اجرا کنید؛ اگر شکست کاوش فضای نام bwrap متعلق به Codex را گزارش کرد، ترجیحاً از یک نمایهٔ AppArmor استفاده کنید که فضای نام‌های لازم را به فرایند سرویس OpenClaw اعطا می‌کند. `kernel.apparmor_restrict_unprivileged_userns=0` یک راهکار جایگزین در سطح کل میزبان با ملاحظات امنیتی است؛ فقط زمانی از آن استفاده کنید که چنین وضعیت امنیتی برای میزبان پذیرفتنی باشد.
</Warning>

### مرورگر سندباکس‌شده

- مرورگر سندباکس هنگامی که ابزار مرورگر به آن نیاز دارد به‌طور خودکار آغاز می‌شود (و اطمینان حاصل می‌کند CDP قابل‌دسترسی است). آن را از طریق `agents.defaults.sandbox.browser.autoStart` (پیش‌فرض `true`) و `autoStartTimeoutMs` (پیش‌فرض ۱۲ ثانیه) پیکربندی کنید.
- کانتینرهای مرورگر سندباکس به‌جای شبکهٔ سراسری `bridge` از یک شبکهٔ اختصاصی Docker با نام `openclaw-sandbox-browser` استفاده می‌کنند. آن را با `agents.defaults.sandbox.browser.network` پیکربندی کنید.
- `agents.defaults.sandbox.browser.cdpSourceRange` ورود CDP در لبهٔ کانتینر را با فهرست مجاز CIDR محدود می‌کند (برای مثال `172.21.0.1/32`).
- دسترسی ناظر noVNC به‌طور پیش‌فرض با گذرواژه محافظت می‌شود؛ OpenClaw یک نشانی URL دارای توکن کوتاه‌عمر ایجاد می‌کند که یک صفحهٔ راه‌انداز محلی ارائه می‌دهد و noVNC را با گذرواژه در قطعهٔ URL باز می‌کند (نه در رشتهٔ پرس‌وجو یا گزارش‌های سربرگ).
- `agents.defaults.sandbox.browser.allowHostControl` (پیش‌فرض `false`) به نشست‌های سندباکس‌شده اجازه می‌دهد مرورگر میزبان را صراحتاً هدف قرار دهند.
- فهرست‌های مجاز اختیاری دسترسی به `target: "custom"` را کنترل می‌کنند: `allowedControlUrls`، `allowedControlHosts`، `allowedControlPorts`.

## بک‌اند SSH

از `backend: "ssh"` برای اجرای سندباکس‌شدهٔ `exec`، ابزارهای فایل و خواندن رسانه روی هر دستگاه قابل‌دسترسی با SSH استفاده کنید.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // Or use SecretRefs / inline contents instead of local files:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

پیش‌فرض‌ها: `command: "ssh"`، `workspaceRoot: "/tmp/openclaw-sandboxes"`، `strictHostKeyChecking: true`، `updateHostKeys: true`.

- **چرخهٔ حیات**: OpenClaw زیر `sandbox.ssh.workspaceRoot` یک ریشهٔ راه‌دور برای هر دامنه ایجاد می‌کند. در نخستین استفاده پس از ایجاد یا بازآفرینی، فضای کاری راه‌دور را یک‌بار از فضای کاری محلی مقداردهی اولیه می‌کند. پس از آن، `exec`، `read`، `write`، `edit`، `apply_patch`، خواندن رسانه‌های اعلان و آماده‌سازی رسانه‌های ورودی، مستقیماً از طریق SSH روی فضای کاری راه‌دور اجرا می‌شوند. OpenClaw تغییرات راه‌دور را به‌طور خودکار با فضای کاری محلی همگام نمی‌کند.
- **مواد احراز هویت**: `identityFile`/`certificateFile`/`knownHostsFile` به فایل‌های محلی موجود اشاره می‌کنند. `identityData`/`certificateData`/`knownHostsData` رشته‌های درون‌خطی یا SecretRefها را می‌پذیرند؛ این موارد از طریق تصویر لحظه‌ای معمول محیط اجرای اسرار resolve می‌شوند، در فایل‌های موقت با حالت `0600` نوشته می‌شوند و با پایان نشست SSH حذف می‌شوند. اگر برای یک مورد، هم نوع `*File` و هم نوع `*Data` تنظیم شده باشد، `*Data` برای آن نشست اولویت دارد.
- **پیامدهای مرجع‌بودن محیط راه‌دور**: پس از مقداردهی اولیه، فضای کاری راه‌دور SSH به وضعیت واقعی سندباکس تبدیل می‌شود. ویرایش‌های محلی میزبان که پس از مرحلهٔ مقداردهی اولیه بیرون از OpenClaw انجام شوند، تا زمانی که سندباکس را بازآفرینی نکنید در محیط راه‌دور قابل مشاهده نیستند. `openclaw sandbox recreate` ریشهٔ راه‌دور مختص دامنه را حذف می‌کند و در استفادهٔ بعدی دوباره از محیط محلی مقداردهی اولیه می‌کند. سندباکس‌سازی مرورگر در این بک‌اند پشتیبانی نمی‌شود و تنظیمات `sandbox.docker.*` بر آن اعمال نمی‌شوند.

## بک‌اند OpenShell

از `backend: "openshell"` برای اجرای سندباکس‌شدهٔ ابزارها در یک محیط راه‌دور مدیریت‌شده توسط OpenShell استفاده کنید. OpenShell از همان انتقال SSH و پل سیستم فایل راه‌دور بک‌اند عمومی SSH استفاده می‌کند و چرخهٔ حیات OpenShell (`sandbox create/get/delete/ssh-config`) را به‌همراه یک حالت اختیاری همگام‌سازی فضای کاری `mirror` می‌افزاید.

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
          mode: "remote", // mirror | remote
        },
      },
    },
  },
}
```

`mode: "mirror"` (پیش‌فرض) فضای کاری محلی را مرجع نگه می‌دارد: OpenClaw پیش از `exec` محیط محلی را با سندباکس همگام می‌کند و پس از آن تغییرات را بازمی‌گرداند. `mode: "remote"` فضای کاری راه‌دور را یک‌بار از محیط محلی مقداردهی اولیه می‌کند، سپس `exec`/`read`/`write`/`edit`/`apply_patch` را مستقیماً روی فضای کاری راه‌دور و بدون همگام‌سازی معکوس اجرا می‌کند؛ ویرایش‌های محلی پس از مقداردهی اولیه تا زمانی که `openclaw sandbox recreate` را اجرا نکنید قابل مشاهده نیستند. در `scope: "agent"` یا `scope: "shared"`، آن فضای کاری راه‌دور در همان دامنه مشترک است. محدودیت‌های فعلی: سندباکس مرورگر هنوز پشتیبانی نمی‌شود و `sandbox.docker.binds` بر این بک‌اند اعمال نمی‌شود.

دستورهای `openclaw sandbox list`/`recreate`/prune همگی با محیط‌های اجرای OpenShell همانند محیط‌های اجرای Docker رفتار می‌کنند؛ منطق هرس از نوع بک‌اند آگاه است.

برای پیش‌نیازهای کامل، مرجع پیکربندی، مقایسهٔ حالت‌های فضای کاری و جزئیات چرخهٔ حیات، به [OpenShell](/fa/gateway/openshell) مراجعه کنید.

## دسترسی به فضای کاری

`agents.defaults.sandbox.workspaceAccess` تعیین می‌کند سندباکس چه چیزهایی را می‌تواند ببیند:

| مقدار            | رفتار                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `none` (پیش‌فرض) | ابزارها یک فضای کاری جعبه‌شنی ایزوله را در `~/.openclaw/sandboxes` می‌بینند.                    |
| `ro`             | فضای کاری عامل را به‌صورت فقط‌خواندنی در `/agent` سوار می‌کند (`write`/`edit`/`apply_patch` را غیرفعال می‌کند). |
| `rw`             | فضای کاری عامل را به‌صورت خواندنی/نوشتنی در `/workspace` سوار می‌کند.                                    |

با پشتیبان OpenShell، حالت `mirror` همچنان بین نوبت‌های اجرا از فضای کاری محلی به‌عنوان منبع مرجع استفاده می‌کند، حالت `remote` پس از بذرگذاری اولیه فضای کاری راه‌دور OpenShell را مرجع قرار می‌دهد، و `workspaceAccess: "ro"`/`"none"` همچنان رفتار نوشتن را به همان شیوه محدود می‌کند.

رسانه‌های ورودی در فضای کاری جعبه‌شنی فعال کپی می‌شوند (`media/inbound/*`).

<Note>
**Skills**: ابزار `read` به ریشه جعبه‌شنی محدود است. با `workspaceAccess: "none"`، OpenClaw مهارت‌های واجد شرایط را در فضای کاری جعبه‌شنی (`.../skills`) بازتاب می‌دهد تا قابل خواندن باشند. با `"rw"`، مهارت‌های فضای کاری از `/workspace/skills` قابل خواندن‌اند و مهارت‌های واجد شرایطِ مدیریت‌شده، همراه‌شده یا افزونه‌ای در مسیر فقط‌خواندنی تولیدشده `/workspace/.openclaw/sandbox-skills/skills` قرار می‌گیرند.
</Note>

## اتصال‌های سفارشی

`agents.defaults.sandbox.docker.binds` دایرکتوری‌های میزبان بیشتری را در کانتینر سوار می‌کند. قالب: `host:container:mode` (برای مثال، `"/home/user/source:/source:rw"`).

اتصال‌های سراسری و مختص هر عامل با هم ادغام می‌شوند (جایگزین نمی‌شوند). در `scope: "shared"`، اتصال‌های مختص هر عامل نادیده گرفته می‌شوند.

`agents.defaults.sandbox.browser.binds` دایرکتوری‌های میزبان بیشتری را فقط در کانتینر **مرورگر جعبه‌شنی** سوار می‌کند. وقتی تنظیم شده باشد (از جمله `[]`)، برای کانتینر مرورگر جایگزین `docker.binds` می‌شود؛ وقتی حذف شده باشد، کانتینر مرورگر از `docker.binds` استفاده می‌کند.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

<Warning>
**امنیت اتصال‌ها**

- اتصال‌ها سامانه فایل جعبه‌شنی را دور می‌زنند: آن‌ها مسیرهای میزبان را با همان حالتی که تنظیم می‌کنید (`:ro` یا `:rw`) در معرض قرار می‌دهند.
- OpenClaw به‌طور پیش‌فرض منابع اتصال خطرناک را مسدود می‌کند: مسیرهای سیستمی (`/etc`، `/proc`، `/sys`، `/dev`، `/root`، `/boot`)، دایرکتوری‌های سوکت Docker (`/run`، `/var/run` و گونه‌های `docker.sock` آن‌ها)، و ریشه‌های رایج اطلاعات اعتبارسنجی در دایرکتوری خانه (`~/.aws`، `~/.cargo`، `~/.config`، `~/.docker`، `~/.gnupg`، `~/.netrc`، `~/.npm`، `~/.ssh`).
- اعتبارسنجی مسیر منبع را نرمال‌سازی می‌کند، سپس آن را دوباره از طریق عمیق‌ترین جد موجود تفکیک می‌کند و بعد مسیرهای مسدودشده و ریشه‌های مجاز را دوباره بررسی می‌کند؛ بنابراین فرار از طریق والدِ پیوند نمادین حتی اگر برگ نهایی هنوز وجود نداشته باشد به‌صورت بسته شکست می‌خورد (برای مثال، اگر `run-link` به آنجا اشاره کند، `/workspace/run-link/new-file` همچنان به‌صورت `/var/run/...` تفکیک می‌شود).
- مقصدهای اتصالی که نقاط سوارشدن رزروشده کانتینر (`/workspace`، `/agent`) را می‌پوشانند نیز به‌طور پیش‌فرض مسدودند؛ برای نادیده‌گرفتن این محدودیت، `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets: true` را تنظیم کنید.
- منابع اتصال خارج از ریشه‌های مجاز فضای کاری/فضای کاری عامل به‌طور پیش‌فرض مسدودند؛ برای نادیده‌گرفتن این محدودیت، `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources: true` را تنظیم کنید. ریشه‌های مجاز نیز به همان شیوه متعارف‌سازی می‌شوند، بنابراین مسیری که فقط پیش از تفکیک پیوند نمادین درون فهرست مجاز به نظر می‌رسد، همچنان به‌عنوان مسیری خارج از ریشه‌های مجاز رد می‌شود.
- سوارشدن‌های حساس (اسرار، کلیدهای SSH، اطلاعات اعتبارسنجی سرویس) باید `:ro` باشند، مگر اینکه نوشتن مطلقاً ضروری باشد.
- اگر فقط به دسترسی خواندن فضای کاری نیاز دارید، آن را با `workspaceAccess: "ro"` ترکیب کنید؛ حالت‌های اتصال مستقل باقی می‌مانند.
- برای چگونگی تعامل اتصال‌ها با سیاست ابزار و اجرای ارتقایافته، به [جعبه‌شنی در برابر سیاست ابزار در برابر اجرای ارتقایافته](/fa/gateway/sandbox-vs-tool-policy-vs-elevated) مراجعه کنید.

</Warning>

## تصویرها و راه‌اندازی

تصویر پیش‌فرض Docker: `openclaw-sandbox:bookworm-slim`

<Note>
**دریافت کد منبع در برابر نصب npm**

اسکریپت‌های کمکی `scripts/sandbox-setup.sh`، `scripts/sandbox-common-setup.sh` و `scripts/sandbox-browser-setup.sh` فقط هنگام اجرا از یک [دریافت کد منبع](https://github.com/openclaw/openclaw) در دسترس‌اند. آن‌ها در بسته npm گنجانده نشده‌اند.

اگر OpenClaw را از طریق `npm install -g openclaw` نصب کرده‌اید، به‌جای آن از فرمان‌های درون‌خطی `docker build` که در ادامه آمده‌اند استفاده کنید.
</Note>

<Steps>
  <Step title="ساخت تصویر پیش‌فرض">
    از یک دریافت کد منبع:

    ```bash
    scripts/sandbox-setup.sh
    ```

    از یک نصب npm (بدون نیاز به دریافت کد منبع):

    ```bash
    docker build -t openclaw-sandbox:bookworm-slim - <<'DOCKERFILE'
    FROM debian:bookworm-slim
    ENV DEBIAN_FRONTEND=noninteractive
    RUN apt-get update && apt-get install -y --no-install-recommends \
      bash ca-certificates curl git jq python3 ripgrep \
      && rm -rf /var/lib/apt/lists/*
    RUN useradd --create-home --shell /bin/bash sandbox
    USER sandbox
    WORKDIR /home/sandbox
    CMD ["sleep", "infinity"]
    DOCKERFILE
    ```

    تصویر پیش‌فرض شامل Node **نیست**. اگر یک مهارت به Node (یا محیط‌های اجرایی دیگر) نیاز دارد، یا یک تصویر سفارشی بسازید یا از طریق `sandbox.docker.setupCommand` نصب کنید (نیازمند خروجی شبکه + ریشه قابل‌نوشتن + کاربر ریشه).

    وقتی `openclaw-sandbox:bookworm-slim` موجود نیست، OpenClaw به‌صورت پنهانی `debian:bookworm-slim` ساده را جایگزین نمی‌کند. اجراهای جعبه‌شنی که تصویر پیش‌فرض را هدف می‌گیرند، تا زمانی که آن را نسازید، با دستورالعمل ساخت فوراً شکست می‌خورند؛ زیرا تصویر همراه‌شده برای ابزارهای کمکی نوشتن/ویرایش جعبه‌شنی شامل `python3` است.

  </Step>
  <Step title="اختیاری: ساخت تصویر مشترک">
    برای یک تصویر جعبه‌شنی کاربردی‌تر با ابزارهای رایج (برای مثال `curl`، `jq`، Node 24، pnpm، `python3` و `git`):

    از یک دریافت کد منبع:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    از یک نصب npm، ابتدا تصویر پیش‌فرض را بسازید (بالا را ببینید)، سپس با استفاده از [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) از مخزن، تصویر مشترک را روی آن بسازید.

    سپس `agents.defaults.sandbox.docker.image` را روی `openclaw-sandbox-common:bookworm-slim` تنظیم کنید.

  </Step>
  <Step title="اختیاری: ساخت تصویر مرورگر جعبه‌شنی">
    از یک دریافت کد منبع:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    از یک نصب npm، با استفاده از [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) از مخزن تصویر را بسازید.

  </Step>
</Steps>

به‌طور پیش‌فرض، کانتینرهای جعبه‌شنی Docker **هیچ شبکه‌ای ندارند**. با `agents.defaults.sandbox.docker.network` این رفتار را تغییر دهید.

<AccordionGroup>
  <Accordion title="پیش‌فرض‌های Chromium مرورگر جعبه‌شنی">
    تصویر همراه‌شده مرورگر جعبه‌شنی برای بارهای کاری کانتینری پرچم‌های محافظه‌کارانه‌ای را هنگام راه‌اندازی Chromium اعمال می‌کند:

    - `--remote-debugging-address=127.0.0.1`
    - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
    - `--user-data-dir=${HOME}/.chrome`
    - `--no-first-run`
    - `--no-default-browser-check`
    - `--disable-dev-shm-usage`
    - `--disable-background-networking`
    - `--disable-breakpad`
    - `--disable-crash-reporter`
    - `--no-zygote`
    - `--metrics-recording-only`
    - `--password-store=basic`
    - `--use-mock-keychain`
    - وقتی `browser.headless` فعال باشد، `--headless=new`.
    - وقتی `browser.noSandbox` فعال باشد، `--no-sandbox --disable-setuid-sandbox`.
    - به‌طور پیش‌فرض `--disable-3d-apis`، `--disable-gpu` و `--disable-software-rasterizer`؛ این پرچم‌های سخت‌سازی گرافیکی به کانتینرهای بدون پشتیبانی GPU کمک می‌کنند. اگر بار کاری شما به WebGL یا دیگر قابلیت‌های سه‌بعدی نیاز دارد، `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` را تنظیم کنید.
    - به‌طور پیش‌فرض `--disable-extensions`؛ برای جریان‌های وابسته به افزونه، `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` را تنظیم کنید.
    - به‌طور پیش‌فرض `--renderer-process-limit=2`؛ با `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` کنترل می‌شود، که در آن `0` پیش‌فرض Chromium را حفظ می‌کند.

    اگر به نمایه اجرایی متفاوتی نیاز دارید، از یک تصویر مرورگر سفارشی استفاده کنید و نقطه ورود خود را ارائه دهید. برای نمایه‌های محلی Chromium (غیرکانتینری)، از `browser.extraArgs` برای افزودن پرچم‌های راه‌اندازی بیشتر استفاده کنید.

  </Accordion>
  <Accordion title="پیش‌فرض‌های امنیت شبکه">
    - `network: "host"` مسدود است.
    - `network: "container:<id>"` به‌طور پیش‌فرض مسدود است (خطر دورزدن با پیوستن به فضای نام).
    - نادیده‌گیری اضطراری: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

نصب‌های Docker و Gateway کانتینری در اینجا قرار دارند: [Docker](/fa/install/docker)

برای استقرارهای Gateway مبتنی بر Docker، `scripts/docker/setup.sh` می‌تواند پیکربندی جعبه‌شنی را راه‌اندازی اولیه کند. برای فعال‌کردن این مسیر، `OPENCLAW_SANDBOX=1` (یا `true`/`yes`/`on`) را تنظیم کنید. محل سوکت را با `OPENCLAW_DOCKER_SOCKET` تغییر دهید. مرجع کامل راه‌اندازی و متغیرهای محیطی: [Docker](/fa/install/docker#agent-sandbox).

## setupCommand (راه‌اندازی یک‌باره کانتینر)

`setupCommand` پس از ایجاد کانتینر جعبه‌شنی **یک‌بار** اجرا می‌شود (نه در هر اجرا). این فرمان داخل کانتینر از طریق `sh -lc` اجرا می‌شود.

مسیرها:

- سراسری: `agents.defaults.sandbox.docker.setupCommand`
- مختص هر عامل: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="دام‌های رایج">
    - مقدار پیش‌فرض `docker.network` برابر با `"none"` است (بدون خروجی شبکه)، بنابراین نصب بسته‌ها شکست می‌خورد.
    - `docker.network: "container:<id>"` به `dangerouslyAllowContainerNamespaceJoin: true` نیاز دارد و فقط برای شرایط اضطراری است.
    - `readOnlyRoot: true` مانع نوشتن می‌شود؛ `readOnlyRoot: false` را تنظیم کنید یا یک تصویر سفارشی بسازید.
    - برای نصب بسته‌ها، `user` باید ریشه باشد (`user` را حذف کنید یا `user: "0:0"` را تنظیم کنید).
    - اجرای جعبه‌شنی، `process.env` میزبان را به ارث **نمی‌برد**. برای کلیدهای API مهارت‌ها از `agents.defaults.sandbox.docker.env` (یا یک تصویر سفارشی) استفاده کنید.
    - مقادیر موجود در `agents.defaults.sandbox.docker.env` به‌عنوان متغیرهای محیطی صریح کانتینر Docker ارسال می‌شوند. هر کسی که به دیمن Docker دسترسی داشته باشد می‌تواند آن‌ها را با فرمان‌های فراداده Docker مانند `docker inspect` مشاهده کند. اگر این افشای فراداده پذیرفتنی نیست، از یک تصویر سفارشی، فایل اسرار سوارشده یا مسیر دیگری برای تحویل اسرار استفاده کنید.

  </Accordion>
</AccordionGroup>

## سیاست ابزار و راه‌های گریز

سیاست‌های مجاز/ممنوع ابزار همچنان پیش از قواعد جعبه‌شنی اعمال می‌شوند. اگر ابزاری به‌صورت سراسری یا برای یک عامل ممنوع باشد، جعبه‌شنی آن را دوباره در دسترس قرار نمی‌دهد.

`tools.elevated` یک راه گریز صریح است که `exec` را بیرون از جعبه‌شنی اجرا می‌کند (به‌طور پیش‌فرض روی `gateway`، یا وقتی مقصد اجرا `node` است روی `node`). دستورالعمل‌های `/exec` فقط برای فرستندگان مجاز اعمال می‌شوند و در هر نشست پایدار می‌مانند؛ برای غیرفعال‌سازی قطعی `exec`، از سیاست ممنوعیت ابزار استفاده کنید (به [جعبه‌شنی در برابر سیاست ابزار در برابر اجرای ارتقایافته](/fa/gateway/sandbox-vs-tool-policy-vs-elevated) مراجعه کنید).

اشکال‌زدایی:

- `openclaw sandbox list` کانتینرهای جعبه‌شنی، وضعیت، تطابق تصویر، عمر، زمان بیکاری و نشست/عامل مرتبط را نشان می‌دهد.
- `openclaw sandbox explain [--session <key>] [--agent <id>]` حالت مؤثر جعبه‌شنی، فضای کاری میزبان، دایرکتوری کاری زمان اجرا، سوارشدن‌های Docker، سیاست ابزار و کلیدهای پیکربندی اصلاح را بررسی می‌کند. فیلد `workspaceRoot` آن همان ریشه جعبه‌شنی پیکربندی‌شده باقی می‌ماند؛ `effectiveHostWorkspaceRoot` نشان می‌دهد فضای کاری فعال واقعاً کجا قرار دارد.
- `openclaw sandbox recreate [--all | --session <key> | --agent <id>] [--browser] [--force]` کانتینرها/محیط‌ها را حذف می‌کند تا در استفاده بعدی با پیکربندی فعلی دوباره ایجاد شوند.
- برای مدل ذهنی «چرا این مسدود شده است؟»، به [جعبه‌شنی در برابر سیاست ابزار در برابر اجرای ارتقایافته](/fa/gateway/sandbox-vs-tool-policy-vs-elevated) مراجعه کنید.

## بازنویسی‌های چندعاملی

هر عامل می‌تواند جعبه‌شنی و ابزارها را بازنویسی کند: `agents.list[].sandbox` و `agents.list[].tools` (به‌علاوه `agents.list[].tools.sandbox.tools` برای سیاست ابزار جعبه‌شنی). برای تقدم، به [جعبه‌شنی و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) مراجعه کنید.

## نمونه حداقلی فعال‌سازی

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## مرتبط

- [سندباکس و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) -- بازنویسی‌های مختص هر عامل و ترتیب تقدم
- [OpenShell](/fa/gateway/openshell) -- راه‌اندازی بک‌اند مدیریت‌شدهٔ سندباکس، حالت‌های فضای کاری و مرجع پیکربندی
- [پیکربندی سندباکس](/fa/gateway/config-agents#agentsdefaultssandbox)
- [سندباکس در برابر سیاست ابزار در برابر دسترسی ارتقایافته](/fa/gateway/sandbox-vs-tool-policy-vs-elevated) -- اشکال‌زدایی «چرا این مسدود شده است؟»
- [امنیت](/fa/gateway/security)

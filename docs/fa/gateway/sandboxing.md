---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'نحوهٔ کار سندباکس OpenClaw: حالت‌ها، محدوده‌ها، دسترسی به فضای کاری، و تصاویر'
title: سندباکس‌سازی
x-i18n:
    generated_at: "2026-05-11T20:34:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a90a68fdab1fdaef462bc6be589cb510d89c01138a0d43927e29d55bbb6e3ea
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw می‌تواند **ابزارها را داخل بک‌اندهای سندباکس** اجرا کند تا دامنه اثرگذاری کاهش یابد. این کار **اختیاری** است و با پیکربندی (`agents.defaults.sandbox` یا `agents.list[].sandbox`) کنترل می‌شود. اگر سندباکس غیرفعال باشد، ابزارها روی میزبان اجرا می‌شوند. Gateway روی میزبان باقی می‌ماند؛ اجرای ابزار، در صورت فعال بودن، در یک سندباکس ایزوله اجرا می‌شود.

<Note>
این یک مرز امنیتی بی‌نقص نیست، اما وقتی مدل کار نادرستی انجام می‌دهد، دسترسی به فایل‌سیستم و فرایندها را به‌طور محسوسی محدود می‌کند.
</Note>

## چه چیزهایی سندباکس می‌شوند

- اجرای ابزار (`exec`، `read`، `write`، `edit`، `apply_patch`، `process` و غیره).
- مرورگر سندباکس‌شده اختیاری (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="Sandboxed browser details">
    - به‌طور پیش‌فرض، مرورگر سندباکس وقتی ابزار مرورگر به آن نیاز داشته باشد، خودکار شروع می‌شود (اطمینان می‌دهد CDP در دسترس است). از طریق `agents.defaults.sandbox.browser.autoStart` و `agents.defaults.sandbox.browser.autoStartTimeoutMs` پیکربندی کنید.
    - به‌طور پیش‌فرض، کانتینرهای مرورگر سندباکس به‌جای شبکه سراسری `bridge` از یک شبکه Docker اختصاصی (`openclaw-sandbox-browser`) استفاده می‌کنند. با `agents.defaults.sandbox.browser.network` پیکربندی کنید.
    - گزینه اختیاری `agents.defaults.sandbox.browser.cdpSourceRange` ورودی CDP در لبه کانتینر را با یک فهرست مجاز CIDR محدود می‌کند (برای مثال `172.21.0.1/32`).
    - دسترسی مشاهده‌گر noVNC به‌طور پیش‌فرض با گذرواژه محافظت می‌شود؛ OpenClaw یک URL توکن کوتاه‌عمر منتشر می‌کند که یک صفحه راه‌اندازی محلی ارائه می‌دهد و noVNC را با گذرواژه در قطعه URL باز می‌کند (نه در لاگ‌های query/header).
    - `agents.defaults.sandbox.browser.allowHostControl` به نشست‌های سندباکس‌شده اجازه می‌دهد مرورگر میزبان را به‌صورت صریح هدف بگیرند.
    - فهرست‌های مجاز اختیاری `target: "custom"` را کنترل می‌کنند: `allowedControlUrls`، `allowedControlHosts`، `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

سندباکس نمی‌شوند:

- خود فرایند Gateway.
- هر ابزاری که صراحتا اجازه داشته باشد خارج از سندباکس اجرا شود (مثلا `tools.elevated`).
  - **اجرای ارتقایافته سندباکس را دور می‌زند و از مسیر خروج پیکربندی‌شده استفاده می‌کند (`gateway` به‌طور پیش‌فرض، یا `node` وقتی هدف exec برابر `node` باشد).**
  - اگر سندباکس غیرفعال باشد، `tools.elevated` اجرا را تغییر نمی‌دهد (همین حالا هم روی میزبان است). [حالت ارتقایافته](/fa/tools/elevated) را ببینید.

## حالت‌ها

`agents.defaults.sandbox.mode` کنترل می‌کند سندباکس **چه زمانی** استفاده شود:

<Tabs>
  <Tab title="off">
    بدون سندباکس.
  </Tab>
  <Tab title="non-main">
    فقط نشست‌های **غیر اصلی** را سندباکس می‌کند (گزینه پیش‌فرض اگر گفت‌وگوهای عادی را روی میزبان می‌خواهید).

    `"non-main"` بر اساس `session.mainKey` (پیش‌فرض `"main"`) است، نه شناسه عامل. نشست‌های گروه/کانال کلیدهای خودشان را دارند، بنابراین غیر اصلی محسوب می‌شوند و سندباکس خواهند شد.

  </Tab>
  <Tab title="all">
    هر نشست در یک سندباکس اجرا می‌شود.
  </Tab>
</Tabs>

## دامنه

`agents.defaults.sandbox.scope` کنترل می‌کند **چند کانتینر** ساخته شود:

- `"agent"` (پیش‌فرض): یک کانتینر برای هر عامل.
- `"session"`: یک کانتینر برای هر نشست.
- `"shared"`: یک کانتینر مشترک برای همه نشست‌های سندباکس‌شده.

## بک‌اند

`agents.defaults.sandbox.backend` کنترل می‌کند **کدام runtime** سندباکس را فراهم کند:

- `"docker"` (پیش‌فرض وقتی سندباکس فعال است): runtime سندباکس محلی مبتنی بر Docker.
- `"ssh"`: runtime سندباکس راه‌دور عمومی مبتنی بر SSH.
- `"openshell"`: runtime سندباکس مبتنی بر OpenShell.

پیکربندی ویژه SSH زیر `agents.defaults.sandbox.ssh` قرار دارد. پیکربندی ویژه OpenShell زیر `plugins.entries.openshell.config` قرار دارد.

### انتخاب بک‌اند

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **کجا اجرا می‌شود** | کانتینر محلی                    | هر میزبان قابل دسترسی با SSH   | سندباکس مدیریت‌شده OpenShell                       |
| **راه‌اندازی**      | `scripts/sandbox-setup.sh`       | کلید SSH + میزبان هدف          | Plugin OpenShell فعال شده                          |
| **مدل workspace**   | bind-mount یا کپی               | راه‌دور-مرجع (یک بار seed)     | `mirror` یا `remote`                               |
| **کنترل شبکه**      | `docker.network` (پیش‌فرض: none) | وابسته به میزبان راه‌دور       | وابسته به OpenShell                                |
| **سندباکس مرورگر**  | پشتیبانی می‌شود                 | پشتیبانی نمی‌شود               | هنوز پشتیبانی نمی‌شود                              |
| **Bind mountها**    | `docker.binds`                   | N/A                            | N/A                                                 |
| **بهترین کاربرد**   | توسعه محلی، ایزوله‌سازی کامل    | واگذاری به یک ماشین راه‌دور    | سندباکس‌های راه‌دور مدیریت‌شده با همگام‌سازی دوطرفه اختیاری |

### بک‌اند Docker

سندباکس به‌طور پیش‌فرض غیرفعال است. اگر سندباکس را فعال کنید و بک‌اندی انتخاب نکنید، OpenClaw از بک‌اند Docker استفاده می‌کند. ابزارها و مرورگرهای سندباکس را به‌صورت محلی از طریق سوکت daemon Docker (`/var/run/docker.sock`) اجرا می‌کند. ایزوله‌سازی کانتینر سندباکس توسط namespaceهای Docker تعیین می‌شود.

برای در معرض قرار دادن GPUهای میزبان برای سندباکس‌های Docker، `agents.defaults.sandbox.docker.gpus` یا override ویژه هر عامل `agents.list[].sandbox.docker.gpus` را تنظیم کنید. مقدار به‌عنوان یک آرگومان جداگانه به پرچم `--gpus` در Docker پاس داده می‌شود، برای مثال `"all"` یا `"device=GPU-uuid"`، و به runtime میزبان سازگار مثل NVIDIA Container Toolkit نیاز دارد.

<Warning>
**محدودیت‌های Docker-out-of-Docker (DooD)**

اگر خود OpenClaw Gateway را به‌عنوان کانتینر Docker مستقر کنید، کانتینرهای سندباکس هم‌سطح را با استفاده از سوکت Docker میزبان ارکستره می‌کند (DooD). این یک محدودیت مشخص برای نگاشت مسیر ایجاد می‌کند:

- **پیکربندی به مسیرهای میزبان نیاز دارد**: پیکربندی `workspace` در `openclaw.json` باید شامل **مسیر مطلق میزبان** باشد (مثلا `/home/user/.openclaw/workspaces`)، نه مسیر داخلی کانتینر Gateway. وقتی OpenClaw از daemon Docker می‌خواهد یک سندباکس ایجاد کند، daemon مسیرها را نسبت به namespace سیستم‌عامل میزبان ارزیابی می‌کند، نه namespace Gateway.
- **همسانی پل FS (نقشه volume یکسان)**: فرایند بومی OpenClaw Gateway همچنین فایل‌های Heartbeat و پل را در دایرکتوری `workspace` می‌نویسد. چون Gateway همان رشته دقیق (مسیر میزبان) را از داخل محیط کانتینری خودش ارزیابی می‌کند، استقرار Gateway باید شامل یک نقشه volume یکسان باشد که namespace میزبان را به‌صورت بومی پیوند دهد (`-v /home/user/.openclaw:/home/user/.openclaw`).
- **حالت کد Codex**: وقتی یک سندباکس OpenClaw فعال است، OpenClaw نوبت‌های app-server در Codex را به سندباکس `workspace-write` در Codex محدود می‌کند، حتی اگر پیش‌فرض Plugin در Codex برابر `danger-full-access` باشد. سوکت Docker میزبان را داخل کانتینرهای سندباکس عامل یا سندباکس‌های سفارشی Codex mount نکنید.

اگر مسیرها را به‌صورت داخلی و بدون همسانی مطلق با میزبان نگاشت کنید، OpenClaw به‌صورت بومی هنگام تلاش برای نوشتن Heartbeat خود داخل محیط کانتینر، خطای مجوز `EACCES` می‌دهد، چون رشته مسیر کامل به‌صورت بومی وجود ندارد.
</Warning>

### بک‌اند SSH

وقتی می‌خواهید OpenClaw، `exec`، ابزارهای فایل، و خواندن رسانه‌ها را روی یک ماشین دلخواه قابل دسترسی با SSH سندباکس کند، از `backend: "ssh"` استفاده کنید.

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

<AccordionGroup>
  <Accordion title="How it works">
    - OpenClaw یک ریشه راه‌دور برای هر دامنه زیر `sandbox.ssh.workspaceRoot` می‌سازد.
    - در اولین استفاده پس از ساخت یا بازسازی، OpenClaw آن workspace راه‌دور را یک بار از workspace محلی seed می‌کند.
    - پس از آن، `exec`، `read`، `write`، `edit`، `apply_patch`، خواندن رسانه prompt، و staging رسانه ورودی مستقیما از طریق SSH روی workspace راه‌دور اجرا می‌شوند.
    - OpenClaw تغییرات راه‌دور را به‌صورت خودکار به workspace محلی همگام نمی‌کند.

  </Accordion>
  <Accordion title="Authentication material">
    - `identityFile`، `certificateFile`، `knownHostsFile`: از فایل‌های محلی موجود استفاده می‌کنند و آن‌ها را از طریق پیکربندی OpenSSH عبور می‌دهند.
    - `identityData`، `certificateData`، `knownHostsData`: از رشته‌های inline یا SecretRefها استفاده می‌کنند. OpenClaw آن‌ها را از طریق snapshot معمول runtime اسرار resolve می‌کند، در فایل‌های موقت با `0600` می‌نویسد، و وقتی نشست SSH پایان یابد حذفشان می‌کند.
    - اگر هر دو `*File` و `*Data` برای یک مورد تنظیم شده باشند، `*Data` برای آن نشست SSH اولویت دارد.

  </Accordion>
  <Accordion title="Remote-canonical consequences">
    این یک مدل **راه‌دور-مرجع** است. workspace راه‌دور SSH پس از seed اولیه به وضعیت واقعی سندباکس تبدیل می‌شود.

    - ویرایش‌های محلی میزبان که بیرون از OpenClaw پس از مرحله seed انجام شوند، تا زمانی که سندباکس را بازسازی نکنید در راه‌دور دیده نمی‌شوند.
    - `openclaw sandbox recreate` ریشه راه‌دور ویژه دامنه را حذف می‌کند و در استفاده بعدی دوباره از محلی seed می‌کند.
    - سندباکس مرورگر در بک‌اند SSH پشتیبانی نمی‌شود.
    - تنظیمات `sandbox.docker.*` برای بک‌اند SSH اعمال نمی‌شوند.

  </Accordion>
</AccordionGroup>

### بک‌اند OpenShell

وقتی می‌خواهید OpenClaw ابزارها را در یک محیط راه‌دور مدیریت‌شده توسط OpenShell سندباکس کند، از `backend: "openshell"` استفاده کنید. برای راهنمای کامل راه‌اندازی، مرجع پیکربندی، و مقایسه حالت workspace، صفحه اختصاصی [OpenShell](/fa/gateway/openshell) را ببینید.

OpenShell از همان انتقال SSH هسته و پل فایل‌سیستم راه‌دور مانند بک‌اند عمومی SSH استفاده می‌کند، و lifecycle ویژه OpenShell (`sandbox create/get/delete`، `sandbox ssh-config`) به‌همراه حالت اختیاری workspace به نام `mirror` را اضافه می‌کند.

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
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

حالت‌های OpenShell:

- `mirror` (پیش‌فرض): workspace محلی مرجع باقی می‌ماند. OpenClaw فایل‌های محلی را پیش از exec به OpenShell همگام می‌کند و workspace راه‌دور را پس از exec برمی‌گرداند و همگام می‌کند.
- `remote`: workspace در OpenShell پس از ایجاد سندباکس مرجع است. OpenClaw یک بار workspace راه‌دور را از workspace محلی seed می‌کند، سپس ابزارهای فایل و exec مستقیما روی سندباکس راه‌دور اجرا می‌شوند، بدون اینکه تغییرات برگردانده و همگام شوند.

<AccordionGroup>
  <Accordion title="Remote transport details">
    - OpenClaw از OpenShell پیکربندی SSH ویژه سندباکس را از طریق `openshell sandbox ssh-config <name>` درخواست می‌کند.
    - Core آن پیکربندی SSH را در یک فایل موقت می‌نویسد، نشست SSH را باز می‌کند، و از همان پل فایل‌سیستم راه‌دور که `backend: "ssh"` استفاده می‌کند دوباره استفاده می‌کند.
    - در حالت `mirror` فقط lifecycle متفاوت است: پیش از exec از محلی به راه‌دور همگام می‌کند، سپس پس از exec به عقب همگام می‌کند.

  </Accordion>
  <Accordion title="Current OpenShell limitations">
    - سندباکس مرورگر هنوز پشتیبانی نمی‌شود
    - `sandbox.docker.binds` در بک‌اند OpenShell پشتیبانی نمی‌شود
    - گزینه‌های runtime ویژه Docker زیر `sandbox.docker.*` همچنان فقط برای بک‌اند Docker اعمال می‌شوند

  </Accordion>
</AccordionGroup>

#### حالت‌های workspace

OpenShell دو مدل workspace دارد. این همان بخشی است که در عمل بیشترین اهمیت را دارد.

<Tabs>
  <Tab title="mirror (local canonical)">
    وقتی می‌خواهید **workspace محلی مرجع باقی بماند**، از `plugins.entries.openshell.config.mode: "mirror"` استفاده کنید.

    رفتار:

    - پیش از `exec`، OpenClaw فضای کاری محلی را در sandbox مربوط به OpenShell همگام‌سازی می‌کند.
    - پس از `exec`، OpenClaw فضای کاری remote را دوباره با فضای کاری محلی همگام‌سازی می‌کند.
    - ابزارهای فایل همچنان از طریق پل sandbox کار می‌کنند، اما فضای کاری محلی بین نوبت‌ها منبع حقیقت باقی می‌ماند.

    از این حالت زمانی استفاده کنید که:

    - فایل‌ها را به‌صورت محلی بیرون از OpenClaw ویرایش می‌کنید و می‌خواهید آن تغییرات به‌طور خودکار در sandbox ظاهر شوند
    - می‌خواهید sandbox مربوط به OpenShell تا حد ممکن شبیه backend مربوط به Docker رفتار کند
    - می‌خواهید فضای کاری میزبان پس از هر نوبت exec نوشتن‌های sandbox را منعکس کند

    بده‌بستان: هزینه همگام‌سازی اضافی پیش و پس از exec.

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    زمانی از `plugins.entries.openshell.config.mode: "remote"` استفاده کنید که می‌خواهید **فضای کاری OpenShell canonical شود**.

    رفتار:

    - وقتی sandbox برای نخستین بار ساخته می‌شود، OpenClaw فضای کاری remote را یک‌بار از فضای کاری محلی مقداردهی اولیه می‌کند.
    - پس از آن، `exec`، `read`، `write`، `edit`، و `apply_patch` مستقیما روی فضای کاری remote مربوط به OpenShell عمل می‌کنند.
    - OpenClaw تغییرات remote را پس از exec دوباره با فضای کاری محلی همگام‌سازی **نمی‌کند**.
    - خواندن رسانه در زمان prompt همچنان کار می‌کند، چون ابزارهای فایل و رسانه به‌جای فرض کردن یک مسیر میزبان محلی، از طریق پل sandbox می‌خوانند.
    - انتقال از طریق SSH به sandbox مربوط به OpenShell است که `openshell sandbox ssh-config` برمی‌گرداند.

    پیامدهای مهم:

    - اگر پس از مرحله مقداردهی اولیه، فایل‌ها را روی میزبان بیرون از OpenClaw ویرایش کنید، sandbox مربوط به remote آن تغییرات را به‌طور خودکار **نخواهد دید**.
    - اگر sandbox دوباره ساخته شود، فضای کاری remote دوباره از فضای کاری محلی مقداردهی اولیه می‌شود.
    - با `scope: "agent"` یا `scope: "shared"`، آن فضای کاری remote در همان scope مشترک است.

    از این حالت زمانی استفاده کنید که:

    - sandbox باید عمدتا در سمت remote مربوط به OpenShell زندگی کند
    - می‌خواهید سربار همگام‌سازی در هر نوبت کمتر باشد
    - نمی‌خواهید ویرایش‌های محلی میزبان به‌صورت پنهانی وضعیت sandbox مربوط به remote را بازنویسی کنند

  </Tab>
</Tabs>

اگر sandbox را یک محیط اجرای موقت می‌دانید، `mirror` را انتخاب کنید. اگر sandbox را فضای کاری واقعی می‌دانید، `remote` را انتخاب کنید.

#### چرخه حیات OpenShell

sandboxهای OpenShell همچنان از طریق چرخه حیات عادی sandbox مدیریت می‌شوند:

- `openclaw sandbox list` runtimeهای OpenShell و همچنین runtimeهای Docker را نشان می‌دهد
- `openclaw sandbox recreate` runtime فعلی را حذف می‌کند و اجازه می‌دهد OpenClaw در استفاده بعدی آن را دوباره بسازد
- منطق prune نیز از backend آگاه است

برای حالت `remote`، بازسازی به‌ویژه مهم است:

- بازسازی، فضای کاری remote و canonical را برای آن scope حذف می‌کند
- استفاده بعدی، یک فضای کاری remote تازه را از فضای کاری محلی مقداردهی اولیه می‌کند

برای حالت `mirror`، بازسازی عمدتا محیط اجرای remote را بازنشانی می‌کند، چون فضای کاری محلی در هر صورت canonical باقی می‌ماند.

## دسترسی به فضای کاری

`agents.defaults.sandbox.workspaceAccess` کنترل می‌کند **sandbox چه چیزی را می‌تواند ببیند**:

<Tabs>
  <Tab title="none (default)">
    ابزارها یک فضای کاری sandbox را زیر `~/.openclaw/sandboxes` می‌بینند.
  </Tab>
  <Tab title="ro">
    فضای کاری agent را به‌صورت فقط‌خواندنی در `/agent` mount می‌کند (`write`/`edit`/`apply_patch` را غیرفعال می‌کند).
  </Tab>
  <Tab title="rw">
    فضای کاری agent را به‌صورت خواندن/نوشتن در `/workspace` mount می‌کند.
  </Tab>
</Tabs>

با backend مربوط به OpenShell:

- حالت `mirror` همچنان از فضای کاری محلی به‌عنوان منبع canonical بین نوبت‌های exec استفاده می‌کند
- حالت `remote` پس از مقداردهی اولیه، از فضای کاری remote مربوط به OpenShell به‌عنوان منبع canonical استفاده می‌کند
- `workspaceAccess: "ro"` و `"none"` همچنان رفتار نوشتن را به همان شکل محدود می‌کنند

رسانه ورودی در فضای کاری sandbox فعال کپی می‌شود (`media/inbound/*`).

<Note>
**نکته Skills:** ابزار `read` در ریشه sandbox قرار دارد. با `workspaceAccess: "none"`، OpenClaw مهارت‌های واجد شرایط را در فضای کاری sandbox (`.../skills`) mirror می‌کند تا بتوان آن‌ها را خواند. با `"rw"`، مهارت‌های فضای کاری از `/workspace/skills` خواندنی هستند.
</Note>

## bind mountهای سفارشی

`agents.defaults.sandbox.docker.binds` دایرکتوری‌های میزبان اضافی را در container mount می‌کند. قالب: `host:container:mode` (برای مثال، `"/home/user/source:/source:rw"`).

bindهای global و هر-agent **ادغام** می‌شوند (جایگزین نمی‌شوند). زیر `scope: "shared"`، bindهای هر-agent نادیده گرفته می‌شوند.

`agents.defaults.sandbox.browser.binds` دایرکتوری‌های میزبان اضافی را فقط در container مربوط به **مرورگر sandbox** mount می‌کند.

- وقتی تنظیم شود (شامل `[]`)، برای container مرورگر جایگزین `agents.defaults.sandbox.docker.binds` می‌شود.
- وقتی حذف شود، container مرورگر به `agents.defaults.sandbox.docker.binds` fallback می‌کند (سازگار با گذشته).

نمونه (source فقط‌خواندنی + یک دایرکتوری داده اضافی):

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
**امنیت bind**

- bindها سیستم فایل sandbox را دور می‌زنند: آن‌ها مسیرهای میزبان را با هر حالتی که تنظیم کنید (`:ro` یا `:rw`) در معرض قرار می‌دهند.
- OpenClaw منابع bind خطرناک را مسدود می‌کند (برای مثال: `docker.sock`، `/etc`، `/proc`، `/sys`، `/dev`، و mountهای والدی که آن‌ها را در معرض قرار می‌دهند).
- OpenClaw همچنین ریشه‌های رایج اعتبارنامه در دایرکتوری خانه مانند `~/.aws`، `~/.cargo`، `~/.config`، `~/.docker`، `~/.gnupg`، `~/.netrc`، `~/.npm`، و `~/.ssh` را مسدود می‌کند.
- اعتبارسنجی bind فقط تطبیق رشته‌ای نیست. OpenClaw مسیر منبع را normalize می‌کند، سپس آن را دوباره از طریق عمیق‌ترین ancestor موجود resolve می‌کند و بعد مسیرهای مسدودشده و ریشه‌های مجاز را دوباره بررسی می‌کند.
- این یعنی فرارهای symlink-parent همچنان fail closed می‌شوند، حتی وقتی برگ نهایی هنوز وجود نداشته باشد. مثال: اگر `run-link` به آنجا اشاره کند، `/workspace/run-link/new-file` همچنان به‌صورت `/var/run/...` resolve می‌شود.
- ریشه‌های منبع مجاز نیز به همین روش canonicalize می‌شوند، بنابراین مسیری که فقط پیش از symlink resolution داخل allowlist به نظر می‌رسد، همچنان با `outside allowed roots` رد می‌شود.
- mountهای حساس (secrets، کلیدهای SSH، اعتبارنامه‌های سرویس) باید `:ro` باشند، مگر اینکه کاملا ضروری باشد.
- اگر فقط به دسترسی خواندن به فضای کاری نیاز دارید، با `workspaceAccess: "ro"` ترکیب کنید؛ حالت‌های bind مستقل می‌مانند.
- برای نحوه تعامل bindها با policy ابزار و exec با سطح دسترسی بالاتر، [Sandbox vs Tool Policy vs Elevated](/fa/gateway/sandbox-vs-tool-policy-vs-elevated) را ببینید.

</Warning>

## Imageها و setup

Image پیش‌فرض Docker: `openclaw-sandbox:bookworm-slim`

<Note>
**source checkout در برابر نصب npm**

اسکریپت‌های کمکی `scripts/sandbox-setup.sh`، `scripts/sandbox-common-setup.sh`، و `scripts/sandbox-browser-setup.sh` فقط هنگام اجرا از یک [source checkout](https://github.com/openclaw/openclaw) در دسترس هستند. آن‌ها در بسته npm گنجانده نشده‌اند.

اگر OpenClaw را از طریق `npm install -g openclaw` نصب کرده‌اید، به‌جای آن از دستورهای inline مربوط به `docker build` که در ادامه نشان داده شده‌اند استفاده کنید.
</Note>

<Steps>
  <Step title="Build the default image">
    از یک source checkout:

    ```bash
    scripts/sandbox-setup.sh
    ```

    از یک نصب npm (بدون نیاز به source checkout):

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

    image پیش‌فرض شامل Node **نیست**. اگر یک skill به Node (یا runtimeهای دیگر) نیاز دارد، یا یک image سفارشی bake کنید یا از طریق `sandbox.docker.setupCommand` نصب کنید (به خروجی شبکه + ریشه قابل نوشتن + کاربر root نیاز دارد).

    وقتی `openclaw-sandbox:bookworm-slim` موجود نیست، OpenClaw بی‌صدا `debian:bookworm-slim` ساده را جایگزین نمی‌کند. اجرای sandbox که image پیش‌فرض را هدف می‌گیرد، با یک دستور ساخت سریع شکست می‌خورد تا زمانی که آن را بسازید، چون image همراه، `python3` را برای helperهای نوشتن/ویرایش sandbox حمل می‌کند.

  </Step>
  <Step title="Optional: build the common image">
    برای یک image sandbox کاربردی‌تر با ابزارهای رایج (برای مثال `curl`، `jq`، `nodejs`، `python3`، `git`):

    از یک source checkout:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    از یک نصب npm، ابتدا image پیش‌فرض را بسازید (بالا را ببینید)، سپس image common را روی آن با استفاده از [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) از repository بسازید.

    سپس `agents.defaults.sandbox.docker.image` را روی `openclaw-sandbox-common:bookworm-slim` تنظیم کنید.

  </Step>
  <Step title="Optional: build the sandbox browser image">
    از یک source checkout:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    از یک نصب npm، با استفاده از [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) از repository بسازید.

  </Step>
</Steps>

به‌صورت پیش‌فرض، containerهای sandbox مربوط به Docker با **بدون شبکه** اجرا می‌شوند. با `agents.defaults.sandbox.docker.network` بازنویسی کنید.

<AccordionGroup>
  <Accordion title="Sandbox browser Chromium defaults">
    image مرورگر sandbox همراه، پیش‌فرض‌های شروع محافظه‌کارانه Chromium را نیز برای workloadهای containerized اعمال می‌کند. پیش‌فرض‌های فعلی container شامل موارد زیر است:

    - `--remote-debugging-address=127.0.0.1`
    - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
    - `--user-data-dir=${HOME}/.chrome`
    - `--no-first-run`
    - `--no-default-browser-check`
    - `--disable-3d-apis`
    - `--disable-gpu`
    - `--disable-dev-shm-usage`
    - `--disable-background-networking`
    - `--disable-extensions`
    - `--disable-features=TranslateUI`
    - `--disable-breakpad`
    - `--disable-crash-reporter`
    - `--disable-software-rasterizer`
    - `--no-zygote`
    - `--metrics-recording-only`
    - `--renderer-process-limit=2`
    - وقتی `noSandbox` فعال باشد، `--no-sandbox`.
    - سه flag سخت‌سازی گرافیکی (`--disable-3d-apis`، `--disable-software-rasterizer`، `--disable-gpu`) اختیاری هستند و وقتی containerها پشتیبانی GPU ندارند مفیدند. اگر workload شما به WebGL یا ویژگی‌های دیگر 3D/مرورگر نیاز دارد، `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` را تنظیم کنید.
    - `--disable-extensions` به‌صورت پیش‌فرض فعال است و برای flowهای وابسته به extension می‌تواند با `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` غیرفعال شود.
    - `--renderer-process-limit=2` توسط `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` کنترل می‌شود، که در آن `0` پیش‌فرض Chromium را نگه می‌دارد.

    اگر به پروفایل runtime متفاوتی نیاز دارید، از یک image مرورگر سفارشی استفاده کنید و entrypoint خودتان را ارائه دهید. برای پروفایل‌های Chromium محلی (غیر-container)، از `browser.extraArgs` برای افزودن flagهای شروع اضافی استفاده کنید.

  </Accordion>
  <Accordion title="Network security defaults">
    - `network: "host"` مسدود است.
    - `network: "container:<id>"` به‌صورت پیش‌فرض مسدود است (خطر دور زدن namespace join).
    - بازنویسی اضطراری: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

نصب‌های Docker و Gateway containerized اینجا قرار دارند: [Docker](/fa/install/docker)

برای استقرارهای Gateway مربوط به Docker، `scripts/docker/setup.sh` می‌تواند پیکربندی sandbox را bootstrap کند. برای فعال کردن آن مسیر، `OPENCLAW_SANDBOX=1` (یا `true`/`yes`/`on`) را تنظیم کنید. می‌توانید مکان socket را با `OPENCLAW_DOCKER_SOCKET` بازنویسی کنید. راه‌اندازی کامل و مرجع env: [Docker](/fa/install/docker#agent-sandbox).

## setupCommand (راه‌اندازی یک‌باره container)

`setupCommand` پس از ساخته شدن container مربوط به sandbox **یک‌بار** اجرا می‌شود (نه در هر اجرا). این دستور داخل container از طریق `sh -lc` اجرا می‌شود.

مسیرها:

- Global: `agents.defaults.sandbox.docker.setupCommand`
- هر-agent: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="دام‌های رایج">
    - مقدار پیش‌فرض `docker.network` برابر `"none"` است (بدون خروجی شبکه)، بنابراین نصب بسته‌ها شکست می‌خورد.
    - `docker.network: "container:<id>"` به `dangerouslyAllowContainerNamespaceJoin: true` نیاز دارد و فقط برای شرایط اضطراری است.
    - `readOnlyRoot: true` مانع نوشتن می‌شود؛ `readOnlyRoot: false` را تنظیم کنید یا یک تصویر سفارشی بسازید.
    - برای نصب بسته‌ها، `user` باید root باشد (`user` را حذف کنید یا `user: "0:0"` را تنظیم کنید).
    - اجرای سندباکس، `process.env` میزبان را به ارث **نمی‌برد**. برای کلیدهای API مربوط به skill از `agents.defaults.sandbox.docker.env` (یا یک تصویر سفارشی) استفاده کنید.

  </Accordion>
</AccordionGroup>

## سیاست ابزار و راه‌های خروج اضطراری

سیاست‌های اجازه/رد ابزار همچنان پیش از قوانین سندباکس اعمال می‌شوند. اگر ابزاری به‌صورت سراسری یا برای هر عامل رد شده باشد، سندباکس کردن آن را بازنمی‌گرداند.

`tools.elevated` یک راه خروج اضطراری صریح است که `exec` را خارج از سندباکس اجرا می‌کند (به‌طور پیش‌فرض در `gateway`، یا وقتی هدف اجرای `exec` برابر `node` باشد، در `node`). دستورهای `/exec` فقط برای فرستندگان مجاز اعمال می‌شوند و در هر نشست ماندگارند؛ برای غیرفعال‌سازی قطعی `exec`، از رد کردن در سیاست ابزار استفاده کنید (نگاه کنید به [سندباکس در برابر سیاست ابزار در برابر Elevated](/fa/gateway/sandbox-vs-tool-policy-vs-elevated)).

اشکال‌زدایی:

- از `openclaw sandbox explain` برای بررسی حالت مؤثر سندباکس، سیاست ابزار، و کلیدهای پیکربندی اصلاح استفاده کنید.
- برای مدل ذهنی «چرا این مسدود شده است؟» به [سندباکس در برابر سیاست ابزار در برابر Elevated](/fa/gateway/sandbox-vs-tool-policy-vs-elevated) مراجعه کنید.

آن را قفل‌شده نگه دارید.

## بازنویسی‌های چندعاملی

هر عامل می‌تواند سندباکس + ابزارها را بازنویسی کند: `agents.list[].sandbox` و `agents.list[].tools` (به‌علاوه `agents.list[].tools.sandbox.tools` برای سیاست ابزار سندباکس). برای ترتیب تقدم، به [سندباکس و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) مراجعه کنید.

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

- [سندباکس و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) — بازنویسی‌های هر عامل و ترتیب تقدم
- [OpenShell](/fa/gateway/openshell) — راه‌اندازی بک‌اند سندباکس مدیریت‌شده، حالت‌های فضای کاری، و مرجع پیکربندی
- [پیکربندی سندباکس](/fa/gateway/config-agents#agentsdefaultssandbox)
- [سندباکس در برابر سیاست ابزار در برابر Elevated](/fa/gateway/sandbox-vs-tool-policy-vs-elevated) — اشکال‌زدایی «چرا این مسدود شده است؟»
- [امنیت](/fa/gateway/security)

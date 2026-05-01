---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'سندباکسینگ OpenClaw چگونه کار می‌کند: حالت‌ها، دامنه‌ها، دسترسی به فضای کاری، و تصاویر'
title: سندباکس‌سازی
x-i18n:
    generated_at: "2026-05-01T11:47:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f313333ec676aaef636b42d4a6f28f35bf213d9e1c5292ffb4868f312cf0eda
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw می‌تواند **ابزارها را داخل بک‌اندهای سندباکس** اجرا کند تا دامنه اثر کاهش یابد. این کار **اختیاری** است و با پیکربندی (`agents.defaults.sandbox` یا `agents.list[].sandbox`) کنترل می‌شود. اگر سندباکس خاموش باشد، ابزارها روی میزبان اجرا می‌شوند. Gateway روی میزبان باقی می‌ماند؛ اجرای ابزارها، وقتی فعال باشد، در یک سندباکس ایزوله انجام می‌شود.

<Note>
این یک مرز امنیتی کامل نیست، اما وقتی مدل کار نادرستی انجام می‌دهد، دسترسی به فایل‌سیستم و فرایندها را به‌طور محسوسی محدود می‌کند.
</Note>

## چه چیزهایی سندباکس می‌شوند

- اجرای ابزار (`exec`، `read`، `write`، `edit`، `apply_patch`، `process`، و غیره).
- مرورگر سندباکس‌شده اختیاری (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="جزئیات مرورگر سندباکس‌شده">
    - به‌طور پیش‌فرض، مرورگر سندباکس وقتی ابزار مرورگر به آن نیاز داشته باشد به‌صورت خودکار راه‌اندازی می‌شود (اطمینان می‌دهد CDP در دسترس است). از طریق `agents.defaults.sandbox.browser.autoStart` و `agents.defaults.sandbox.browser.autoStartTimeoutMs` پیکربندی کنید.
    - به‌طور پیش‌فرض، کانتینرهای مرورگر سندباکس به‌جای شبکه سراسری `bridge` از یک شبکه Docker اختصاصی (`openclaw-sandbox-browser`) استفاده می‌کنند. با `agents.defaults.sandbox.browser.network` پیکربندی کنید.
    - گزینه اختیاری `agents.defaults.sandbox.browser.cdpSourceRange` ورود CDP در لبه کانتینر را با یک فهرست مجاز CIDR محدود می‌کند (برای مثال `172.21.0.1/32`).
    - دسترسی ناظر noVNC به‌طور پیش‌فرض با رمز عبور محافظت می‌شود؛ OpenClaw یک URL توکن کوتاه‌عمر صادر می‌کند که یک صفحه بوت‌استرپ محلی ارائه می‌دهد و noVNC را با رمز عبور در بخش fragment URL باز می‌کند (نه در گزارش‌های query/header).
    - `agents.defaults.sandbox.browser.allowHostControl` به نشست‌های سندباکس‌شده اجازه می‌دهد مرورگر میزبان را به‌طور صریح هدف بگیرند.
    - فهرست‌های مجاز اختیاری، `target: "custom"` را کنترل می‌کنند: `allowedControlUrls`، `allowedControlHosts`، `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

سندباکس نمی‌شوند:

- خود فرایند Gateway.
- هر ابزاری که صراحتا اجازه داشته باشد خارج از سندباکس اجرا شود (مثلا `tools.elevated`).
  - **اجرای elevated سندباکس را دور می‌زند و از مسیر خروج پیکربندی‌شده استفاده می‌کند (`gateway` به‌طور پیش‌فرض، یا `node` وقتی هدف exec برابر `node` باشد).**
  - اگر سندباکس خاموش باشد، `tools.elevated` اجرا را تغییر نمی‌دهد (از قبل روی میزبان است). [حالت Elevated](/fa/tools/elevated) را ببینید.

## حالت‌ها

`agents.defaults.sandbox.mode` کنترل می‌کند سندباکس **چه زمانی** استفاده شود:

<Tabs>
  <Tab title="off">
    بدون سندباکس.
  </Tab>
  <Tab title="non-main">
    فقط نشست‌های **غیر اصلی** را سندباکس می‌کند (پیش‌فرض اگر بخواهید چت‌های عادی روی میزبان باشند).

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

- `"docker"` (پیش‌فرض وقتی سندباکس فعال باشد): runtime سندباکس محلی متکی بر Docker.
- `"ssh"`: runtime سندباکس راه‌دور عمومی متکی بر SSH.
- `"openshell"`: runtime سندباکس متکی بر OpenShell.

پیکربندی مخصوص SSH زیر `agents.defaults.sandbox.ssh` قرار می‌گیرد. پیکربندی مخصوص OpenShell زیر `plugins.entries.openshell.config` قرار می‌گیرد.

### انتخاب بک‌اند

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **محل اجرا**        | کانتینر محلی                     | هر میزبان در دسترس از طریق SSH | سندباکس مدیریت‌شده OpenShell                        |
| **راه‌اندازی**      | `scripts/sandbox-setup.sh`       | کلید SSH + میزبان هدف          | Plugin OpenShell فعال                               |
| **مدل workspace**   | Bind-mount یا کپی                | مرجع راه‌دور (seed یک‌باره)    | `mirror` یا `remote`                                |
| **کنترل شبکه**      | `docker.network` (پیش‌فرض: none) | وابسته به میزبان راه‌دور       | وابسته به OpenShell                                 |
| **سندباکس مرورگر**  | پشتیبانی می‌شود                  | پشتیبانی نمی‌شود               | هنوز پشتیبانی نمی‌شود                               |
| **Bind mountها**    | `docker.binds`                   | N/A                            | N/A                                                 |
| **بهترین کاربرد**   | توسعه محلی، ایزوله‌سازی کامل     | برون‌سپاری به ماشین راه‌دور    | سندباکس‌های راه‌دور مدیریت‌شده با همگام‌سازی دوطرفه اختیاری |

### بک‌اند Docker

سندباکس به‌طور پیش‌فرض خاموش است. اگر سندباکس را فعال کنید و بک‌اندی انتخاب نکنید، OpenClaw از بک‌اند Docker استفاده می‌کند. این بک‌اند ابزارها و مرورگرهای سندباکس را به‌صورت محلی از طریق سوکت daemon Docker (`/var/run/docker.sock`) اجرا می‌کند. ایزوله‌سازی کانتینر سندباکس توسط namespaceهای Docker تعیین می‌شود.

برای ارائه GPUهای میزبان به سندباکس‌های Docker، `agents.defaults.sandbox.docker.gpus` یا override هر عامل `agents.list[].sandbox.docker.gpus` را تنظیم کنید. مقدار به‌عنوان یک آرگومان جداگانه به flag `--gpus` در Docker پاس داده می‌شود، مثلا `"all"` یا `"device=GPU-uuid"`، و به یک runtime میزبان سازگار مانند NVIDIA Container Toolkit نیاز دارد.

<Warning>
**محدودیت‌های Docker-out-of-Docker (DooD)**

اگر خود OpenClaw Gateway را به‌عنوان یک کانتینر Docker مستقر کنید، کانتینرهای سندباکس خواهر را با استفاده از سوکت Docker میزبان هماهنگ می‌کند (DooD). این یک محدودیت مشخص در نگاشت مسیر ایجاد می‌کند:

- **پیکربندی به مسیرهای میزبان نیاز دارد**: پیکربندی `workspace` در `openclaw.json` باید شامل **مسیر مطلق میزبان** باشد (مثلا `/home/user/.openclaw/workspaces`)، نه مسیر داخلی کانتینر Gateway. وقتی OpenClaw از daemon Docker می‌خواهد یک سندباکس ایجاد کند، daemon مسیرها را نسبت به namespace سیستم‌عامل میزبان ارزیابی می‌کند، نه namespace Gateway.
- **هم‌ارزی پل FS (نگاشت volume یکسان)**: فرایند بومی OpenClaw Gateway همچنین فایل‌های Heartbeat و bridge را در دایرکتوری `workspace` می‌نویسد. از آنجا که Gateway همان رشته دقیق (مسیر میزبان) را از داخل محیط کانتینری خودش ارزیابی می‌کند، استقرار Gateway باید شامل یک نگاشت volume یکسان باشد که namespace میزبان را به‌صورت بومی متصل کند (`-v /home/user/.openclaw:/home/user/.openclaw`).

اگر مسیرها را به‌صورت داخلی و بدون هم‌ارزی مطلق با میزبان نگاشت کنید، OpenClaw به‌صورت بومی هنگام تلاش برای نوشتن Heartbeat خود داخل محیط کانتینر، خطای مجوز `EACCES` می‌دهد، چون رشته مسیر کاملا qualified به‌صورت بومی وجود ندارد.
</Warning>

### بک‌اند SSH

وقتی می‌خواهید OpenClaw اجرای `exec`، ابزارهای فایل، و خواندن رسانه را روی یک ماشین دلخواه در دسترس از طریق SSH سندباکس کند، از `backend: "ssh"` استفاده کنید.

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
  <Accordion title="نحوه کارکرد">
    - OpenClaw یک ریشه راه‌دور به‌ازای هر دامنه زیر `sandbox.ssh.workspaceRoot` ایجاد می‌کند.
    - در اولین استفاده پس از ایجاد یا ایجاد دوباره، OpenClaw آن workspace راه‌دور را یک بار از workspace محلی seed می‌کند.
    - پس از آن، `exec`، `read`، `write`، `edit`، `apply_patch`، خواندن رسانه prompt، و staging رسانه ورودی مستقیما از طریق SSH روی workspace راه‌دور اجرا می‌شوند.
    - OpenClaw تغییرات راه‌دور را به‌صورت خودکار به workspace محلی همگام‌سازی نمی‌کند.

  </Accordion>
  <Accordion title="مواد احراز هویت">
    - `identityFile`، `certificateFile`، `knownHostsFile`: از فایل‌های محلی موجود استفاده می‌کنند و آن‌ها را از طریق پیکربندی OpenSSH پاس می‌دهند.
    - `identityData`، `certificateData`، `knownHostsData`: از رشته‌های inline یا SecretRefs استفاده می‌کنند. OpenClaw آن‌ها را از طریق snapshot عادی runtime اسرار resolve می‌کند، در فایل‌های موقت با `0600` می‌نویسد، و وقتی نشست SSH پایان یافت حذفشان می‌کند.
    - اگر هم `*File` و هم `*Data` برای یک مورد تنظیم شده باشند، `*Data` برای آن نشست SSH اولویت دارد.

  </Accordion>
  <Accordion title="پیامدهای مرجع راه‌دور">
    این یک مدل **مرجع راه‌دور** است. workspace راه‌دور SSH پس از seed اولیه به وضعیت واقعی سندباکس تبدیل می‌شود.

    - ویرایش‌های محلی میزبان که پس از مرحله seed خارج از OpenClaw انجام شوند، تا زمانی که سندباکس را دوباره ایجاد نکنید در راه‌دور قابل مشاهده نیستند.
    - `openclaw sandbox recreate` ریشه راه‌دور هر دامنه را حذف می‌کند و در استفاده بعدی دوباره از محلی seed می‌کند.
    - سندباکس مرورگر در بک‌اند SSH پشتیبانی نمی‌شود.
    - تنظیمات `sandbox.docker.*` روی بک‌اند SSH اعمال نمی‌شوند.

  </Accordion>
</AccordionGroup>

### بک‌اند OpenShell

وقتی می‌خواهید OpenClaw ابزارها را در یک محیط راه‌دور مدیریت‌شده توسط OpenShell سندباکس کند، از `backend: "openshell"` استفاده کنید. برای راهنمای کامل راه‌اندازی، مرجع پیکربندی، و مقایسه حالت‌های workspace، صفحه اختصاصی [OpenShell](/fa/gateway/openshell) را ببینید.

OpenShell همان انتقال SSH هسته‌ای و پل فایل‌سیستم راه‌دور بک‌اند عمومی SSH را دوباره استفاده می‌کند، و lifecycle مخصوص OpenShell (`sandbox create/get/delete`، `sandbox ssh-config`) به‌همراه حالت اختیاری workspace به نام `mirror` را اضافه می‌کند.

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

- `mirror` (پیش‌فرض): workspace محلی مرجع باقی می‌ماند. OpenClaw فایل‌های محلی را پیش از exec به OpenShell همگام‌سازی می‌کند و workspace راه‌دور را پس از exec برمی‌گرداند.
- `remote`: پس از ایجاد سندباکس، workspace OpenShell مرجع است. OpenClaw یک بار workspace راه‌دور را از workspace محلی seed می‌کند، سپس ابزارهای فایل و exec مستقیما روی سندباکس راه‌دور اجرا می‌شوند، بدون همگام‌سازی تغییرات به عقب.

<AccordionGroup>
  <Accordion title="جزئیات انتقال راه‌دور">
    - OpenClaw از OpenShell پیکربندی SSH مخصوص سندباکس را از طریق `openshell sandbox ssh-config <name>` درخواست می‌کند.
    - هسته آن پیکربندی SSH را در یک فایل موقت می‌نویسد، نشست SSH را باز می‌کند، و همان پل فایل‌سیستم راه‌دور استفاده‌شده توسط `backend: "ssh"` را دوباره استفاده می‌کند.
    - در حالت `mirror` فقط lifecycle متفاوت است: همگام‌سازی محلی به راه‌دور پیش از exec، سپس همگام‌سازی برگشتی پس از exec.

  </Accordion>
  <Accordion title="محدودیت‌های فعلی OpenShell">
    - مرورگر سندباکس هنوز پشتیبانی نمی‌شود
    - `sandbox.docker.binds` در بک‌اند OpenShell پشتیبانی نمی‌شود
    - تنظیمات runtime مخصوص Docker زیر `sandbox.docker.*` همچنان فقط روی بک‌اند Docker اعمال می‌شوند

  </Accordion>
</AccordionGroup>

#### حالت‌های workspace

OpenShell دو مدل workspace دارد. این همان بخشی است که در عمل بیشترین اهمیت را دارد.

<Tabs>
  <Tab title="mirror (local canonical)">
    وقتی می‌خواهید **workspace محلی مرجع باقی بماند**، از `plugins.entries.openshell.config.mode: "mirror"` استفاده کنید.

    رفتار:

    - پیش از `exec`، OpenClaw workspace محلی را به سندباکس OpenShell همگام‌سازی می‌کند.
    - پس از `exec`، OpenClaw workspace راه‌دور را به workspace محلی همگام‌سازی می‌کند.
    - ابزارهای فایل همچنان از طریق پل سندباکس عمل می‌کنند، اما workspace محلی بین نوبت‌ها منبع حقیقت باقی می‌ماند.

    وقتی از این استفاده کنید که:

    - فایل‌ها را به‌صورت محلی بیرون از OpenClaw ویرایش می‌کنید و می‌خواهید آن تغییرات به‌طور خودکار در sandbox ظاهر شوند
    - می‌خواهید sandbox مربوط به OpenShell تا حد امکان مانند backend مربوط به Docker رفتار کند
    - می‌خواهید workspace میزبان پس از هر نوبت exec، نوشته‌های sandbox را منعکس کند

    مصالحه: هزینه همگام‌سازی اضافی پیش و پس از exec.

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    وقتی می‌خواهید **workspace مربوط به OpenShell مرجع شود**، از `plugins.entries.openshell.config.mode: "remote"` استفاده کنید.

    رفتار:

    - وقتی sandbox برای نخستین بار ساخته می‌شود، OpenClaw یک‌بار workspace راه‌دور را از workspace محلی مقداردهی اولیه می‌کند.
    - پس از آن، `exec`، `read`، `write`، `edit` و `apply_patch` مستقیما روی workspace راه‌دور OpenShell عمل می‌کنند.
    - OpenClaw پس از exec تغییرات راه‌دور را دوباره در workspace محلی همگام‌سازی **نمی‌کند**.
    - خواندن media در زمان prompt همچنان کار می‌کند، چون ابزارهای file و media به‌جای فرض کردن مسیر میزبان محلی، از طریق پل sandbox می‌خوانند.
    - انتقال از طریق SSH به sandbox مربوط به OpenShell است که توسط `openshell sandbox ssh-config` برگردانده می‌شود.

    پیامدهای مهم:

    - اگر پس از مرحله مقداردهی اولیه، فایل‌ها را روی میزبان بیرون از OpenClaw ویرایش کنید، sandbox راه‌دور آن تغییرات را به‌طور خودکار **نخواهد** دید.
    - اگر sandbox دوباره ساخته شود، workspace راه‌دور دوباره از workspace محلی مقداردهی اولیه می‌شود.
    - با `scope: "agent"` یا `scope: "shared"`، آن workspace راه‌دور در همان scope مشترک می‌شود.

    زمانی از این استفاده کنید که:

    - sandbox باید عمدتا در سمت راه‌دور OpenShell زندگی کند
    - می‌خواهید سربار همگام‌سازی برای هر نوبت کمتر باشد
    - نمی‌خواهید ویرایش‌های محلی میزبان به‌صورت پنهانی وضعیت sandbox راه‌دور را بازنویسی کنند

  </Tab>
</Tabs>

اگر sandbox را یک محیط اجرای موقت می‌دانید، `mirror` را انتخاب کنید. اگر sandbox را workspace واقعی می‌دانید، `remote` را انتخاب کنید.

#### چرخه عمر OpenShell

sandboxهای OpenShell همچنان از طریق چرخه عمر عادی sandbox مدیریت می‌شوند:

- `openclaw sandbox list` runtimeهای OpenShell و همچنین runtimeهای Docker را نشان می‌دهد
- `openclaw sandbox recreate` runtime فعلی را حذف می‌کند و اجازه می‌دهد OpenClaw در استفاده بعدی آن را دوباره بسازد
- منطق prune هم از backend آگاه است

برای حالت `remote`، ساخت دوباره اهمیت ویژه‌ای دارد:

- ساخت دوباره، workspace راه‌دور مرجع را برای آن scope حذف می‌کند
- استفاده بعدی، یک workspace راه‌دور تازه را از workspace محلی مقداردهی اولیه می‌کند

برای حالت `mirror`، ساخت دوباره عمدتا محیط اجرای راه‌دور را بازنشانی می‌کند، چون workspace محلی در هر صورت مرجع باقی می‌ماند.

## دسترسی به workspace

`agents.defaults.sandbox.workspaceAccess` کنترل می‌کند **sandbox چه چیزی را می‌تواند ببیند**:

<Tabs>
  <Tab title="none (default)">
    ابزارها یک workspace مربوط به sandbox را زیر `~/.openclaw/sandboxes` می‌بینند.
  </Tab>
  <Tab title="ro">
    workspace عامل را به‌صورت فقط‌خواندنی در `/agent` mount می‌کند (`write`/`edit`/`apply_patch` را غیرفعال می‌کند).
  </Tab>
  <Tab title="rw">
    workspace عامل را به‌صورت خواندنی/نوشتنی در `/workspace` mount می‌کند.
  </Tab>
</Tabs>

با backend مربوط به OpenShell:

- حالت `mirror` همچنان از workspace محلی به‌عنوان منبع مرجع بین نوبت‌های exec استفاده می‌کند
- حالت `remote` پس از مقداردهی اولیه، از workspace راه‌دور OpenShell به‌عنوان منبع مرجع استفاده می‌کند
- `workspaceAccess: "ro"` و `"none"` همچنان رفتار نوشتن را به همان شکل محدود می‌کنند

media ورودی در workspace فعال sandbox کپی می‌شود (`media/inbound/*`).

<Note>
**نکته Skills:** ابزار `read` ریشه‌اش در sandbox است. با `workspaceAccess: "none"`، OpenClaw موارد Skills واجد شرایط را در workspace sandbox (`.../skills`) mirror می‌کند تا بتوانند خوانده شوند. با `"rw"`، Skills مربوط به workspace از `/workspace/skills` قابل خواندن هستند.
</Note>

## bind mountهای سفارشی

`agents.defaults.sandbox.docker.binds` دایرکتوری‌های اضافی میزبان را در container mount می‌کند. قالب: `host:container:mode` (برای مثال، `"/home/user/source:/source:rw"`).

bindهای سراسری و مخصوص هر عامل **ادغام** می‌شوند (جایگزین نمی‌شوند). زیر `scope: "shared"`، bindهای مخصوص هر عامل نادیده گرفته می‌شوند.

`agents.defaults.sandbox.browser.binds` دایرکتوری‌های اضافی میزبان را فقط در container مربوط به **مرورگر sandbox** mount می‌کند.

- وقتی تنظیم شود (از جمله `[]`)، برای container مرورگر جایگزین `agents.defaults.sandbox.docker.binds` می‌شود.
- وقتی حذف شود، container مرورگر به `agents.defaults.sandbox.docker.binds` برمی‌گردد (سازگار با گذشته).

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

- bindها فایل‌سیستم sandbox را دور می‌زنند: آن‌ها مسیرهای میزبان را با هر حالتی که تنظیم کرده‌اید (`:ro` یا `:rw`) در معرض قرار می‌دهند.
- OpenClaw منابع bind خطرناک را مسدود می‌کند (برای مثال: `docker.sock`، `/etc`، `/proc`، `/sys`، `/dev` و mountهای والدی که آن‌ها را در معرض قرار می‌دهند).
- OpenClaw همچنین ریشه‌های رایج اعتبارنامه در home directory مانند `~/.aws`، `~/.cargo`، `~/.config`، `~/.docker`، `~/.gnupg`، `~/.netrc`، `~/.npm` و `~/.ssh` را مسدود می‌کند.
- اعتبارسنجی bind فقط تطبیق رشته‌ای نیست. OpenClaw مسیر منبع را نرمال‌سازی می‌کند، سپس پیش از بررسی دوباره مسیرهای مسدود و ریشه‌های مجاز، آن را دوباره از طریق عمیق‌ترین ancestor موجود resolve می‌کند.
- یعنی گریزهای symlink-parent همچنان fail closed می‌شوند، حتی وقتی leaf نهایی هنوز وجود ندارد. مثال: اگر `run-link` به آنجا اشاره کند، `/workspace/run-link/new-file` همچنان به‌صورت `/var/run/...` resolve می‌شود.
- ریشه‌های منبع مجاز به همان شکل canonicalize می‌شوند، بنابراین مسیری که فقط پیش از symlink resolution داخل allowlist به نظر می‌رسد، همچنان به‌عنوان `outside allowed roots` رد می‌شود.
- mountهای حساس (secrets، کلیدهای SSH، اعتبارنامه‌های سرویس) باید `:ro` باشند مگر اینکه کاملا ضروری باشد.
- اگر فقط به دسترسی خواندن به workspace نیاز دارید، با `workspaceAccess: "ro"` ترکیب کنید؛ حالت‌های bind مستقل باقی می‌مانند.
- برای اینکه bindها چگونه با سیاست ابزار و exec با سطح دسترسی elevated تعامل می‌کنند، [Sandbox در برابر سیاست ابزار در برابر Elevated](/fa/gateway/sandbox-vs-tool-policy-vs-elevated) را ببینید.

</Warning>

## imageها و راه‌اندازی

image پیش‌فرض Docker: `openclaw-sandbox:bookworm-slim`

<Note>
**source checkout در برابر npm install**

اسکریپت‌های کمکی `scripts/sandbox-setup.sh`، `scripts/sandbox-common-setup.sh` و `scripts/sandbox-browser-setup.sh` فقط هنگام اجرا از یک [source checkout](https://github.com/openclaw/openclaw) در دسترس هستند. آن‌ها در بسته npm گنجانده نشده‌اند.

اگر OpenClaw را با `npm install -g openclaw` نصب کرده‌اید، به‌جای آن از دستورهای inline `docker build` که در ادامه نشان داده شده‌اند استفاده کنید.
</Note>

<Steps>
  <Step title="ساخت image پیش‌فرض">
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

    image پیش‌فرض شامل Node **نیست**. اگر یک Skills به Node (یا runtimeهای دیگر) نیاز دارد، یا یک image سفارشی bake کنید یا از طریق `sandbox.docker.setupCommand` نصب کنید (نیازمند خروجی شبکه + ریشه قابل نوشتن + کاربر root).

    وقتی `openclaw-sandbox:bookworm-slim` وجود ندارد، OpenClaw بی‌سروصدا `debian:bookworm-slim` ساده را جایگزین نمی‌کند. اجراهای sandbox که image پیش‌فرض را هدف می‌گیرند، تا زمانی که آن را بسازید با یک دستورالعمل ساخت سریع fail می‌شوند، چون image همراه، `python3` را برای helperهای write/edit در sandbox به‌همراه دارد.

  </Step>
  <Step title="اختیاری: ساخت image رایج">
    برای یک image کاربردی‌تر sandbox با ابزارهای رایج (برای مثال `curl`، `jq`، `nodejs`، `python3`، `git`):

    از یک source checkout:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    از یک نصب npm، ابتدا image پیش‌فرض را بسازید (بالا را ببینید)، سپس image رایج را روی آن و با استفاده از [`Dockerfile.sandbox-common`](https://github.com/openclaw/openclaw/blob/main/Dockerfile.sandbox-common) از مخزن بسازید.

    سپس `agents.defaults.sandbox.docker.image` را روی `openclaw-sandbox-common:bookworm-slim` تنظیم کنید.

  </Step>
  <Step title="اختیاری: ساخت image مرورگر sandbox">
    از یک source checkout:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    از یک نصب npm، با استفاده از [`Dockerfile.sandbox-browser`](https://github.com/openclaw/openclaw/blob/main/Dockerfile.sandbox-browser) از مخزن بسازید.

  </Step>
</Steps>

به‌طور پیش‌فرض، containerهای sandbox مربوط به Docker با **بدون شبکه** اجرا می‌شوند. با `agents.defaults.sandbox.docker.network` override کنید.

<AccordionGroup>
  <Accordion title="پیش‌فرض‌های Chromium مرورگر sandbox">
    image همراه مرورگر sandbox همچنین پیش‌فرض‌های شروع محافظه‌کارانه Chromium را برای workloadهای containerized اعمال می‌کند. پیش‌فرض‌های فعلی container شامل این موارد است:

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
    - `--no-sandbox` وقتی `noSandbox` فعال باشد.
    - سه flag سخت‌سازی graphics (`--disable-3d-apis`، `--disable-software-rasterizer`، `--disable-gpu`) اختیاری هستند و وقتی containerها پشتیبانی GPU ندارند مفیدند. اگر workload شما به WebGL یا قابلیت‌های 3D/مرورگر دیگر نیاز دارد، `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` را تنظیم کنید.
    - `--disable-extensions` به‌طور پیش‌فرض فعال است و برای جریان‌هایی که به extension وابسته‌اند، می‌تواند با `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` غیرفعال شود.
    - `--renderer-process-limit=2` توسط `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` کنترل می‌شود، که در آن `0` پیش‌فرض Chromium را نگه می‌دارد.

    اگر به profile runtime متفاوتی نیاز دارید، از یک image مرورگر سفارشی استفاده کنید و entrypoint خودتان را ارائه دهید. برای profileهای محلی (غیر-container) Chromium، از `browser.extraArgs` برای افزودن flagهای شروع اضافی استفاده کنید.

  </Accordion>
  <Accordion title="پیش‌فرض‌های امنیت شبکه">
    - `network: "host"` مسدود است.
    - `network: "container:<id>"` به‌طور پیش‌فرض مسدود است (خطر دور زدن namespace join).
    - override اضطراری: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

نصب‌های Docker و gateway کانتینری‌شده اینجا هستند: [Docker](/fa/install/docker)

برای deploymentهای gateway مربوط به Docker، `scripts/docker/setup.sh` می‌تواند config مربوط به sandbox را bootstrap کند. برای فعال کردن آن مسیر، `OPENCLAW_SANDBOX=1` (یا `true`/`yes`/`on`) را تنظیم کنید. می‌توانید مکان socket را با `OPENCLAW_DOCKER_SOCKET` override کنید. راه‌اندازی کامل و مرجع env: [Docker](/fa/install/docker#agent-sandbox).

## setupCommand (راه‌اندازی یک‌باره container)

`setupCommand` پس از ساخته شدن container مربوط به sandbox، **یک‌بار** اجرا می‌شود (نه در هر اجرا). این دستور داخل container از طریق `sh -lc` اجرا می‌شود.

مسیرها:

- سراسری: `agents.defaults.sandbox.docker.setupCommand`
- مخصوص هر عامل: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="دام‌های رایج">
    - مقدار پیش‌فرض `docker.network` برابر `"none"` است (بدون خروجی)، بنابراین نصب packageها شکست می‌خورد.
    - `docker.network: "container:<id>"` به `dangerouslyAllowContainerNamespaceJoin: true` نیاز دارد و فقط برای حالت اضطراری است.
    - `readOnlyRoot: true` مانع نوشتن می‌شود؛ `readOnlyRoot: false` را تنظیم کنید یا یک image سفارشی bake کنید.
    - برای نصب packageها، `user` باید root باشد (`user` را حذف کنید یا `user: "0:0"` تنظیم کنید).
    - exec در sandbox، `process.env` میزبان را به ارث **نمی‌برد**. برای کلیدهای API مربوط به Skills از `agents.defaults.sandbox.docker.env` (یا یک image سفارشی) استفاده کنید.

  </Accordion>
</AccordionGroup>

## سیاست ابزار و گریزگاه‌ها

سیاست‌های اجازه/رد ابزار همچنان پیش از قواعد محیط ایزوله اعمال می‌شوند. اگر ابزاری به‌صورت سراسری یا برای هر عامل رد شده باشد، ایزوله‌سازی آن را برنمی‌گرداند.

`tools.elevated` یک گریزگاه صریح است که `exec` را بیرون از محیط ایزوله اجرا می‌کند (به‌صورت پیش‌فرض `gateway`، یا وقتی هدف اجرای `exec` برابر `node` باشد، `node`). دستورهای `/exec` فقط برای فرستندگان مجاز اعمال می‌شوند و در هر نشست پایدار می‌مانند؛ برای غیرفعال‌سازی قطعی `exec`، از رد در سیاست ابزار استفاده کنید (ببینید [محیط ایزوله در برابر سیاست ابزار در برابر ارتقایافته](/fa/gateway/sandbox-vs-tool-policy-vs-elevated)).

اشکال‌زدایی:

- از `openclaw sandbox explain` برای بررسی حالت مؤثر محیط ایزوله، سیاست ابزار، و کلیدهای پیکربندی اصلاح استفاده کنید.
- برای مدل ذهنی «چرا این مسدود شده است؟»، [محیط ایزوله در برابر سیاست ابزار در برابر ارتقایافته](/fa/gateway/sandbox-vs-tool-policy-vs-elevated) را ببینید.

آن را قفل‌شده نگه دارید.

## بازنویسی‌های چندعامله

هر عامل می‌تواند محیط ایزوله + ابزارها را بازنویسی کند: `agents.list[].sandbox` و `agents.list[].tools` (به‌علاوه `agents.list[].tools.sandbox.tools` برای سیاست ابزار محیط ایزوله). برای ترتیب تقدم، [محیط ایزوله و ابزارهای چندعامله](/fa/tools/multi-agent-sandbox-tools) را ببینید.

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

- [محیط ایزوله و ابزارهای چندعامله](/fa/tools/multi-agent-sandbox-tools) — بازنویسی‌ها و ترتیب تقدم برای هر عامل
- [OpenShell](/fa/gateway/openshell) — راه‌اندازی backend مدیریت‌شده محیط ایزوله، حالت‌های فضای کاری، و مرجع پیکربندی
- [پیکربندی محیط ایزوله](/fa/gateway/config-agents#agentsdefaultssandbox)
- [محیط ایزوله در برابر سیاست ابزار در برابر ارتقایافته](/fa/gateway/sandbox-vs-tool-policy-vs-elevated) — اشکال‌زدایی «چرا این مسدود شده است؟»
- [امنیت](/fa/gateway/security)

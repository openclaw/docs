---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'نحوهٔ کارکرد ایزوله‌سازی در OpenClaw: حالت‌ها، محدوده‌ها، دسترسی به فضای کاری، و تصاویر'
title: ایزوله‌سازی
x-i18n:
    generated_at: "2026-05-03T11:36:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: e887d07ed84d582bb605c75f841499b6bed42cfc94d60690aba33c2f351b272b
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw می‌تواند **ابزارها را درون پشتوانه‌های sandbox** اجرا کند تا دامنه اثر کاهش یابد. این کار **اختیاری** است و با پیکربندی کنترل می‌شود (`agents.defaults.sandbox` یا `agents.list[].sandbox`). اگر sandboxing خاموش باشد، ابزارها روی میزبان اجرا می‌شوند. Gateway روی میزبان باقی می‌ماند؛ اجرای ابزار، در صورت فعال بودن، در یک sandbox ایزوله اجرا می‌شود.

<Note>
این یک مرز امنیتی بی‌نقص نیست، اما وقتی مدل کار نادرستی انجام می‌دهد، دسترسی به فایل‌سیستم و فرایندها را به‌طور محسوسی محدود می‌کند.
</Note>

## چه چیزهایی sandbox می‌شوند

- اجرای ابزار (`exec`، `read`، `write`، `edit`، `apply_patch`، `process` و غیره).
- مرورگر sandbox اختیاری (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="جزئیات مرورگر sandbox">
    - به‌طور پیش‌فرض، مرورگر sandbox وقتی ابزار مرورگر به آن نیاز دارد، خودکار شروع می‌شود (اطمینان می‌دهد CDP در دسترس است). از طریق `agents.defaults.sandbox.browser.autoStart` و `agents.defaults.sandbox.browser.autoStartTimeoutMs` پیکربندی کنید.
    - به‌طور پیش‌فرض، کانتینرهای مرورگر sandbox به‌جای شبکه سراسری `bridge` از یک شبکه Docker اختصاصی (`openclaw-sandbox-browser`) استفاده می‌کنند. با `agents.defaults.sandbox.browser.network` پیکربندی کنید.
    - گزینه اختیاری `agents.defaults.sandbox.browser.cdpSourceRange` ورود CDP در لبه کانتینر را با یک allowlist از CIDR محدود می‌کند (برای مثال `172.21.0.1/32`).
    - دسترسی مشاهده‌گر noVNC به‌طور پیش‌فرض با گذرواژه محافظت می‌شود؛ OpenClaw یک URL توکن کوتاه‌عمر صادر می‌کند که یک صفحه bootstrap محلی ارائه می‌دهد و noVNC را با گذرواژه در fragment نشانی باز می‌کند (نه در لاگ‌های query/header).
    - `agents.defaults.sandbox.browser.allowHostControl` به نشست‌های sandbox اجازه می‌دهد صراحتا مرورگر میزبان را هدف بگیرند.
    - allowlistهای اختیاری، `target: "custom"` را کنترل می‌کنند: `allowedControlUrls`، `allowedControlHosts`، `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

sandbox نمی‌شوند:

- خود فرایند Gateway.
- هر ابزاری که صراحتا مجاز باشد خارج از sandbox اجرا شود (مثلا `tools.elevated`).
  - **اجرای ارتقایافته از sandboxing عبور می‌کند و از مسیر خروج پیکربندی‌شده استفاده می‌کند (`gateway` به‌طور پیش‌فرض، یا `node` وقتی هدف اجرا `node` است).**
  - اگر sandboxing خاموش باشد، `tools.elevated` اجرا را تغییر نمی‌دهد (از قبل روی میزبان است). [حالت ارتقایافته](/fa/tools/elevated) را ببینید.

## حالت‌ها

`agents.defaults.sandbox.mode` کنترل می‌کند sandboxing **چه زمانی** استفاده شود:

<Tabs>
  <Tab title="off">
    بدون sandboxing.
  </Tab>
  <Tab title="non-main">
    فقط نشست‌های **غیر main** را sandbox کن (پیش‌فرض، اگر می‌خواهید گفت‌وگوهای عادی روی میزبان باشند).

    `"non-main"` بر اساس `session.mainKey` است (پیش‌فرض `"main"`)، نه شناسه agent. نشست‌های گروه/کانال کلیدهای خودشان را دارند، بنابراین غیر main محسوب می‌شوند و sandbox خواهند شد.

  </Tab>
  <Tab title="all">
    هر نشست در یک sandbox اجرا می‌شود.
  </Tab>
</Tabs>

## دامنه

`agents.defaults.sandbox.scope` کنترل می‌کند **چند کانتینر** ساخته شود:

- `"agent"` (پیش‌فرض): یک کانتینر برای هر agent.
- `"session"`: یک کانتینر برای هر نشست.
- `"shared"`: یک کانتینر مشترک میان همه نشست‌های sandbox شده.

## پشتوانه

`agents.defaults.sandbox.backend` کنترل می‌کند **کدام runtime** sandbox را فراهم کند:

- `"docker"` (پیش‌فرض وقتی sandboxing فعال است): runtime محلی sandbox مبتنی بر Docker.
- `"ssh"`: runtime عمومی sandbox راه‌دور مبتنی بر SSH.
- `"openshell"`: runtime sandbox مبتنی بر OpenShell.

پیکربندی مخصوص SSH زیر `agents.defaults.sandbox.ssh` قرار دارد. پیکربندی مخصوص OpenShell زیر `plugins.entries.openshell.config` قرار دارد.

### انتخاب یک پشتوانه

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **محل اجرا**        | کانتینر محلی                     | هر میزبان قابل‌دسترسی با SSH   | sandbox مدیریت‌شده توسط OpenShell                  |
| **راه‌اندازی**      | `scripts/sandbox-setup.sh`       | کلید SSH + میزبان هدف          | Plugin مربوط به OpenShell فعال باشد                |
| **مدل workspace**   | Bind-mount یا کپی                | راه‌دور به‌عنوان مرجع (یک‌بار seed) | `mirror` یا `remote`                                |
| **کنترل شبکه**      | `docker.network` (پیش‌فرض: none) | به میزبان راه‌دور بستگی دارد   | به OpenShell بستگی دارد                            |
| **مرورگر sandbox**  | پشتیبانی می‌شود                  | پشتیبانی نمی‌شود               | هنوز پشتیبانی نمی‌شود                              |
| **Bind mountها**    | `docker.binds`                   | N/A                            | N/A                                                 |
| **بهترین کاربرد**   | توسعه محلی، ایزولاسیون کامل      | واگذاری بار به یک ماشین راه‌دور | sandboxهای راه‌دور مدیریت‌شده با همگام‌سازی دوطرفه اختیاری |

### پشتوانه Docker

sandboxing به‌طور پیش‌فرض خاموش است. اگر sandboxing را فعال کنید و پشتوانه‌ای انتخاب نکنید، OpenClaw از پشتوانه Docker استفاده می‌کند. ابزارها و مرورگرهای sandbox را به‌صورت محلی از طریق سوکت daemon Docker (`/var/run/docker.sock`) اجرا می‌کند. ایزولاسیون کانتینر sandbox توسط namespaceهای Docker تعیین می‌شود.

برای در معرض قرار دادن GPUهای میزبان برای sandboxهای Docker، `agents.defaults.sandbox.docker.gpus` یا override مخصوص هر agent یعنی `agents.list[].sandbox.docker.gpus` را تنظیم کنید. مقدار به‌عنوان یک آرگومان جداگانه به پرچم `--gpus` در Docker پاس داده می‌شود، برای مثال `"all"` یا `"device=GPU-uuid"`، و به runtime میزبان سازگار مانند NVIDIA Container Toolkit نیاز دارد.

<Warning>
**محدودیت‌های Docker-out-of-Docker (DooD)**

اگر خود OpenClaw Gateway را به‌عنوان یک کانتینر Docker مستقر کنید، با استفاده از سوکت Docker میزبان، کانتینرهای sandbox خواهر را هماهنگ می‌کند (DooD). این یک محدودیت مشخص در نگاشت مسیر ایجاد می‌کند:

- **پیکربندی به مسیرهای میزبان نیاز دارد**: پیکربندی `workspace` در `openclaw.json` باید شامل **مسیر مطلق میزبان** باشد (مثلا `/home/user/.openclaw/workspaces`)، نه مسیر داخلی کانتینر Gateway. وقتی OpenClaw از daemon Docker می‌خواهد یک sandbox ایجاد کند، daemon مسیرها را نسبت به namespace سیستم‌عامل میزبان ارزیابی می‌کند، نه namespace Gateway.
- **هم‌ارزی پل FS (نگاشت volume یکسان)**: فرایند بومی OpenClaw Gateway همچنین فایل‌های Heartbeat و bridge را در پوشه `workspace` می‌نویسد. چون Gateway همان رشته دقیق (مسیر میزبان) را از درون محیط کانتینری خودش ارزیابی می‌کند، استقرار Gateway باید یک نگاشت volume یکسان داشته باشد که namespace میزبان را به‌صورت بومی پیوند دهد (`-v /home/user/.openclaw:/home/user/.openclaw`).

اگر مسیرها را به‌صورت داخلی بدون هم‌ارزی مطلق با میزبان نگاشت کنید، OpenClaw هنگام تلاش برای نوشتن Heartbeat خود در محیط کانتینر، به‌صورت بومی خطای مجوز `EACCES` می‌دهد، چون رشته مسیر کاملا تعیین‌شده به‌صورت بومی وجود ندارد.
</Warning>

### پشتوانه SSH

وقتی می‌خواهید OpenClaw اجرای `exec`، ابزارهای فایل، و خواندن رسانه را روی هر ماشین قابل‌دسترسی با SSH sandbox کند، از `backend: "ssh"` استفاده کنید.

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
  <Accordion title="نحوه کار">
    - OpenClaw یک ریشه راه‌دور مخصوص هر دامنه زیر `sandbox.ssh.workspaceRoot` ایجاد می‌کند.
    - در اولین استفاده پس از ایجاد یا ایجاد مجدد، OpenClaw آن workspace راه‌دور را یک‌بار از workspace محلی seed می‌کند.
    - پس از آن، `exec`، `read`، `write`، `edit`، `apply_patch`، خواندن رسانه prompt، و staging رسانه ورودی مستقیما از طریق SSH روی workspace راه‌دور اجرا می‌شوند.
    - OpenClaw تغییرات راه‌دور را به‌صورت خودکار به workspace محلی همگام نمی‌کند.

  </Accordion>
  <Accordion title="مواد احراز هویت">
    - `identityFile`، `certificateFile`، `knownHostsFile`: از فایل‌های محلی موجود استفاده می‌کنند و آن‌ها را از طریق پیکربندی OpenSSH پاس می‌دهند.
    - `identityData`، `certificateData`، `knownHostsData`: از رشته‌های inline یا SecretRefs استفاده می‌کنند. OpenClaw آن‌ها را از طریق snapshot معمول runtime اسرار resolve می‌کند، آن‌ها را با `0600` در فایل‌های موقت می‌نویسد، و وقتی نشست SSH تمام شود حذفشان می‌کند.
    - اگر هم `*File` و هم `*Data` برای یک مورد تنظیم شده باشند، `*Data` برای آن نشست SSH اولویت دارد.

  </Accordion>
  <Accordion title="پیامدهای راه‌دور به‌عنوان مرجع">
    این یک مدل **راه‌دور به‌عنوان مرجع** است. workspace راه‌دور SSH پس از seed اولیه به وضعیت واقعی sandbox تبدیل می‌شود.

    - ویرایش‌های محلی میزبان که پس از مرحله seed خارج از OpenClaw انجام شوند، تا زمانی که sandbox را دوباره ایجاد نکنید در راه‌دور قابل مشاهده نیستند.
    - `openclaw sandbox recreate` ریشه راه‌دور مخصوص آن دامنه را حذف می‌کند و در استفاده بعدی دوباره از محلی seed می‌کند.
    - sandboxing مرورگر در پشتوانه SSH پشتیبانی نمی‌شود.
    - تنظیمات `sandbox.docker.*` برای پشتوانه SSH اعمال نمی‌شوند.

  </Accordion>
</AccordionGroup>

### پشتوانه OpenShell

وقتی می‌خواهید OpenClaw ابزارها را در یک محیط راه‌دور مدیریت‌شده توسط OpenShell sandbox کند، از `backend: "openshell"` استفاده کنید. برای راهنمای کامل راه‌اندازی، مرجع پیکربندی، و مقایسه حالت‌های workspace، صفحه اختصاصی [OpenShell](/fa/gateway/openshell) را ببینید.

OpenShell همان انتقال SSH هسته و پل فایل‌سیستم راه‌دور پشتوانه عمومی SSH را دوباره استفاده می‌کند، و lifecycle مخصوص OpenShell (`sandbox create/get/delete`، `sandbox ssh-config`) به‌همراه حالت اختیاری workspace یعنی `mirror` را اضافه می‌کند.

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

- `mirror` (پیش‌فرض): workspace محلی مرجع باقی می‌ماند. OpenClaw پیش از exec فایل‌های محلی را به OpenShell همگام می‌کند و پس از exec، workspace راه‌دور را به عقب همگام می‌کند.
- `remote`: workspace در OpenShell پس از ایجاد sandbox مرجع است. OpenClaw یک‌بار workspace راه‌دور را از workspace محلی seed می‌کند، سپس ابزارهای فایل و exec مستقیما روی sandbox راه‌دور اجرا می‌شوند، بدون همگام‌سازی تغییرات به عقب.

<AccordionGroup>
  <Accordion title="جزئیات انتقال راه‌دور">
    - OpenClaw از OpenShell پیکربندی SSH مخصوص sandbox را از طریق `openshell sandbox ssh-config <name>` می‌خواهد.
    - هسته آن پیکربندی SSH را در یک فایل موقت می‌نویسد، نشست SSH را باز می‌کند، و همان پل فایل‌سیستم راه‌دور استفاده‌شده توسط `backend: "ssh"` را دوباره استفاده می‌کند.
    - فقط در حالت `mirror`، lifecycle متفاوت است: همگام‌سازی محلی به راه‌دور پیش از exec، سپس همگام‌سازی به عقب پس از exec.

  </Accordion>
  <Accordion title="محدودیت‌های فعلی OpenShell">
    - مرورگر sandbox هنوز پشتیبانی نمی‌شود
    - `sandbox.docker.binds` در پشتوانه OpenShell پشتیبانی نمی‌شود
    - knobهای runtime مخصوص Docker زیر `sandbox.docker.*` همچنان فقط برای پشتوانه Docker اعمال می‌شوند

  </Accordion>
</AccordionGroup>

#### حالت‌های workspace

OpenShell دو مدل workspace دارد. این همان بخشی است که در عمل بیشترین اهمیت را دارد.

<Tabs>
  <Tab title="mirror (local canonical)">
    وقتی می‌خواهید **workspace محلی مرجع باقی بماند**، از `plugins.entries.openshell.config.mode: "mirror"` استفاده کنید.

    رفتار:

    - پیش از `exec`، OpenClaw workspace محلی را به sandbox در OpenShell همگام می‌کند.
    - پس از `exec`، OpenClaw workspace راه‌دور را به workspace محلی همگام می‌کند.
    - ابزارهای فایل همچنان از طریق پل sandbox عمل می‌کنند، اما workspace محلی بین نوبت‌ها منبع حقیقت باقی می‌ماند.

    در این موارد استفاده کنید:

    - فایل‌ها را به‌صورت محلی بیرون از OpenClaw ویرایش می‌کنید و می‌خواهید آن تغییرات به‌طور خودکار در سندباکس ظاهر شوند
    - می‌خواهید سندباکس OpenShell تا حد امکان مانند بک‌اند Docker رفتار کند
    - می‌خواهید فضای کاری میزبان بعد از هر نوبت exec، نوشتن‌های سندباکس را بازتاب دهد

    مصالحه: هزینه همگام‌سازی اضافی قبل و بعد از exec.

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    وقتی می‌خواهید **فضای کاری OpenShell مرجع شود** از `plugins.entries.openshell.config.mode: "remote"` استفاده کنید.

    رفتار:

    - وقتی سندباکس برای اولین بار ساخته می‌شود، OpenClaw فضای کاری راه‌دور را یک‌بار از فضای کاری محلی مقداردهی اولیه می‌کند.
    - بعد از آن، `exec`، `read`، `write`، `edit` و `apply_patch` مستقیماً روی فضای کاری راه‌دور OpenShell عمل می‌کنند.
    - OpenClaw تغییرات راه‌دور را بعد از exec به فضای کاری محلی همگام‌سازی **نمی‌کند**.
    - خواندن رسانه‌ها در زمان پرامپت همچنان کار می‌کند، چون ابزارهای فایل و رسانه به‌جای فرض گرفتن مسیر محلی میزبان، از طریق پل سندباکس می‌خوانند.
    - انتقال از طریق SSH به سندباکس OpenShell است که توسط `openshell sandbox ssh-config` برگردانده می‌شود.

    پیامدهای مهم:

    - اگر بعد از مرحله مقداردهی اولیه، فایل‌ها را روی میزبان بیرون از OpenClaw ویرایش کنید، سندباکس راه‌دور آن تغییرات را به‌طور خودکار **نخواهد دید**.
    - اگر سندباکس دوباره ساخته شود، فضای کاری راه‌دور دوباره از فضای کاری محلی مقداردهی اولیه می‌شود.
    - با `scope: "agent"` یا `scope: "shared"`، آن فضای کاری راه‌دور در همان scope مشترک است.

    زمانی از این استفاده کنید که:

    - سندباکس باید عمدتاً در سمت راه‌دور OpenShell زندگی کند
    - سربار همگام‌سازی کمتری در هر نوبت می‌خواهید
    - نمی‌خواهید ویرایش‌های محلی میزبان، وضعیت سندباکس راه‌دور را بی‌صدا بازنویسی کنند

  </Tab>
</Tabs>

اگر سندباکس را یک محیط اجرای موقت در نظر می‌گیرید، `mirror` را انتخاب کنید. اگر سندباکس را فضای کاری واقعی در نظر می‌گیرید، `remote` را انتخاب کنید.

#### چرخه عمر OpenShell

سندباکس‌های OpenShell همچنان از طریق چرخه عمر معمول سندباکس مدیریت می‌شوند:

- `openclaw sandbox list` زمان‌اجراهای OpenShell و همچنین زمان‌اجراهای Docker را نشان می‌دهد
- `openclaw sandbox recreate` زمان‌اجرای فعلی را حذف می‌کند و به OpenClaw اجازه می‌دهد در استفاده بعدی آن را دوباره بسازد
- منطق پاک‌سازی نیز از بک‌اند آگاه است

برای حالت `remote`، ساخت دوباره به‌ویژه مهم است:

- ساخت دوباره، فضای کاری راه‌دور مرجع را برای آن scope حذف می‌کند
- استفاده بعدی، یک فضای کاری راه‌دور تازه را از فضای کاری محلی مقداردهی اولیه می‌کند

برای حالت `mirror`، ساخت دوباره عمدتاً محیط اجرای راه‌دور را بازنشانی می‌کند، چون فضای کاری محلی در هر صورت مرجع باقی می‌ماند.

## دسترسی به فضای کاری

`agents.defaults.sandbox.workspaceAccess` کنترل می‌کند **سندباکس چه چیزهایی را می‌تواند ببیند**:

<Tabs>
  <Tab title="none (default)">
    ابزارها یک فضای کاری سندباکس را زیر `~/.openclaw/sandboxes` می‌بینند.
  </Tab>
  <Tab title="ro">
    فضای کاری عامل را به‌صورت فقط‌خواندنی در `/agent` mount می‌کند (`write`/`edit`/`apply_patch` را غیرفعال می‌کند).
  </Tab>
  <Tab title="rw">
    فضای کاری عامل را به‌صورت خواندن/نوشتن در `/workspace` mount می‌کند.
  </Tab>
</Tabs>

با بک‌اند OpenShell:

- حالت `mirror` همچنان از فضای کاری محلی به‌عنوان منبع مرجع بین نوبت‌های exec استفاده می‌کند
- حالت `remote` بعد از مقداردهی اولیه، از فضای کاری راه‌دور OpenShell به‌عنوان منبع مرجع استفاده می‌کند
- `workspaceAccess: "ro"` و `"none"` همچنان رفتار نوشتن را به همان شکل محدود می‌کنند

رسانه ورودی در فضای کاری فعال سندباکس کپی می‌شود (`media/inbound/*`).

<Note>
**یادداشت Skills:** ابزار `read` از ریشه سندباکس کار می‌کند. با `workspaceAccess: "none"`، OpenClaw مهارت‌های واجد شرایط را در فضای کاری سندباکس (`.../skills`) mirror می‌کند تا بتوان آن‌ها را خواند. با `"rw"`، مهارت‌های فضای کاری از `/workspace/skills` خواندنی هستند.
</Note>

## اتصال‌های bind سفارشی

`agents.defaults.sandbox.docker.binds` دایرکتوری‌های اضافی میزبان را در کانتینر mount می‌کند. قالب: `host:container:mode` (برای مثال، `"/home/user/source:/source:rw"`).

bindهای سراسری و مختص هر عامل **ادغام** می‌شوند (جایگزین نمی‌شوند). تحت `scope: "shared"`، bindهای مختص هر عامل نادیده گرفته می‌شوند.

`agents.defaults.sandbox.browser.binds` دایرکتوری‌های اضافی میزبان را فقط در کانتینر **مرورگر سندباکس** mount می‌کند.

- وقتی تنظیم شود (از جمله `[]`)، برای کانتینر مرورگر جایگزین `agents.defaults.sandbox.docker.binds` می‌شود.
- وقتی حذف شود، کانتینر مرورگر به `agents.defaults.sandbox.docker.binds` برمی‌گردد (سازگار با نسخه‌های قبلی).

مثال (منبع فقط‌خواندنی + یک دایرکتوری داده اضافی):

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

- bindها فایل‌سیستم سندباکس را دور می‌زنند: آن‌ها مسیرهای میزبان را با هر حالتی که تنظیم کنید (`:ro` یا `:rw`) در معرض قرار می‌دهند.
- OpenClaw منابع bind خطرناک را مسدود می‌کند (برای مثال: `docker.sock`، `/etc`، `/proc`، `/sys`، `/dev` و mountهای والدی که آن‌ها را در معرض قرار می‌دهند).
- OpenClaw همچنین ریشه‌های رایج اعتبارنامه در دایرکتوری خانگی مانند `~/.aws`، `~/.cargo`، `~/.config`، `~/.docker`، `~/.gnupg`، `~/.netrc`، `~/.npm` و `~/.ssh` را مسدود می‌کند.
- اعتبارسنجی bind فقط تطبیق رشته‌ای نیست. OpenClaw مسیر منبع را نرمال‌سازی می‌کند، سپس آن را دوباره از طریق عمیق‌ترین نیای موجود resolve می‌کند و بعد مسیرهای مسدودشده و ریشه‌های مجاز را دوباره بررسی می‌کند.
- یعنی گریزهای والد symlink حتی وقتی برگ نهایی هنوز وجود ندارد، همچنان به‌صورت fail closed شکست می‌خورند. مثال: اگر `run-link` به آنجا اشاره کند، `/workspace/run-link/new-file` همچنان به‌صورت `/var/run/...` resolve می‌شود.
- ریشه‌های منبع مجاز نیز به همان شکل canonicalize می‌شوند، بنابراین مسیری که فقط قبل از resolve شدن symlink داخل allowlist به نظر می‌رسد، همچنان با `outside allowed roots` رد می‌شود.
- mountهای حساس (secretها، کلیدهای SSH، اعتبارنامه‌های سرویس) باید `:ro` باشند مگر اینکه کاملاً ضروری باشد.
- اگر فقط به دسترسی خواندن به فضای کاری نیاز دارید، با `workspaceAccess: "ro"` ترکیب کنید؛ حالت‌های bind مستقل باقی می‌مانند.
- برای اینکه bindها چگونه با سیاست ابزار و exec ارتقایافته تعامل دارند، [سندباکس در برابر سیاست ابزار در برابر ارتقایافته](/fa/gateway/sandbox-vs-tool-policy-vs-elevated) را ببینید.

</Warning>

## تصویرها و راه‌اندازی

تصویر پیش‌فرض Docker: `openclaw-sandbox:bookworm-slim`

<Note>
**checkout منبع در برابر نصب npm**

اسکریپت‌های کمکی `scripts/sandbox-setup.sh`، `scripts/sandbox-common-setup.sh` و `scripts/sandbox-browser-setup.sh` فقط هنگام اجرا از یک [checkout منبع](https://github.com/openclaw/openclaw) در دسترس هستند. آن‌ها در بسته npm گنجانده نشده‌اند.

اگر OpenClaw را با `npm install -g openclaw` نصب کرده‌اید، به‌جای آن از دستورهای inline `docker build` که در ادامه آمده‌اند استفاده کنید.
</Note>

<Steps>
  <Step title="ساخت تصویر پیش‌فرض">
    از یک checkout منبع:

    ```bash
    scripts/sandbox-setup.sh
    ```

    از نصب npm (بدون نیاز به checkout منبع):

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

    تصویر پیش‌فرض شامل Node **نیست**. اگر یک مهارت به Node (یا زمان‌اجراهای دیگر) نیاز دارد، یا یک تصویر سفارشی بسازید یا از طریق `sandbox.docker.setupCommand` نصب کنید (نیازمند خروج شبکه + ریشه قابل‌نوشتن + کاربر root).

    وقتی `openclaw-sandbox:bookworm-slim` موجود نباشد، OpenClaw بی‌صدا `debian:bookworm-slim` ساده را جایگزین نمی‌کند. اجراهای سندباکس که تصویر پیش‌فرض را هدف می‌گیرند، تا زمانی که آن را بسازید با یک دستورالعمل ساخت سریع شکست می‌خورند، چون تصویر همراه، `python3` را برای کمک‌ابزارهای نوشتن/ویرایش سندباکس حمل می‌کند.

  </Step>
  <Step title="اختیاری: ساخت تصویر common">
    برای یک تصویر سندباکس کاربردی‌تر با ابزارهای رایج (برای مثال `curl`، `jq`، `nodejs`، `python3`، `git`):

    از یک checkout منبع:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    از نصب npm، ابتدا تصویر پیش‌فرض را بسازید (بالا را ببینید)، سپس تصویر common را با استفاده از [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) از مخزن، روی آن بسازید.

    سپس `agents.defaults.sandbox.docker.image` را روی `openclaw-sandbox-common:bookworm-slim` تنظیم کنید.

  </Step>
  <Step title="اختیاری: ساخت تصویر مرورگر سندباکس">
    از یک checkout منبع:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    از نصب npm، با استفاده از [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) از مخزن بسازید.

  </Step>
</Steps>

به‌صورت پیش‌فرض، کانتینرهای سندباکس Docker با **بدون شبکه** اجرا می‌شوند. با `agents.defaults.sandbox.docker.network` override کنید.

<AccordionGroup>
  <Accordion title="پیش‌فرض‌های Chromium مرورگر سندباکس">
    تصویر همراه مرورگر سندباکس همچنین پیش‌فرض‌های محافظه‌کارانه شروع Chromium را برای بارهای کاری کانتینری اعمال می‌کند. پیش‌فرض‌های فعلی کانتینر شامل این موارد است:

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
    - `--no-sandbox` وقتی `noSandbox` فعال است.
    - سه فلگ سخت‌سازی گرافیک (`--disable-3d-apis`، `--disable-software-rasterizer`، `--disable-gpu`) اختیاری هستند و وقتی کانتینرها پشتیبانی GPU ندارند مفیدند. اگر بار کاری شما به WebGL یا ویژگی‌های سه‌بعدی/مرورگری دیگر نیاز دارد، `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` را تنظیم کنید.
    - `--disable-extensions` به‌صورت پیش‌فرض فعال است و برای جریان‌هایی که به افزونه متکی هستند می‌توان آن را با `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` غیرفعال کرد.
    - `--renderer-process-limit=2` توسط `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` کنترل می‌شود، که در آن `0` پیش‌فرض Chromium را نگه می‌دارد.

    اگر به پروفایل زمان‌اجرای متفاوتی نیاز دارید، از یک تصویر مرورگر سفارشی استفاده کنید و entrypoint خودتان را ارائه دهید. برای پروفایل‌های Chromium محلی (غیرکانتینری)، از `browser.extraArgs` برای افزودن فلگ‌های شروع اضافی استفاده کنید.

  </Accordion>
  <Accordion title="پیش‌فرض‌های امنیت شبکه">
    - `network: "host"` مسدود است.
    - `network: "container:<id>"` به‌صورت پیش‌فرض مسدود است (ریسک دور زدن با پیوستن به namespace).
    - override اضطراری: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

نصب‌های Docker و Gateway کانتینری‌شده اینجا هستند: [Docker](/fa/install/docker)

برای استقرارهای Gateway Docker، `scripts/docker/setup.sh` می‌تواند پیکربندی سندباکس را bootstrap کند. برای فعال کردن آن مسیر، `OPENCLAW_SANDBOX=1` (یا `true`/`yes`/`on`) را تنظیم کنید. می‌توانید محل socket را با `OPENCLAW_DOCKER_SOCKET` override کنید. راه‌اندازی کامل و مرجع env: [Docker](/fa/install/docker#agent-sandbox).

## setupCommand (راه‌اندازی یک‌باره کانتینر)

`setupCommand` بعد از ساخته شدن کانتینر سندباکس **یک‌بار** اجرا می‌شود (نه در هر اجرا). این فرمان داخل کانتینر از طریق `sh -lc` اجرا می‌شود.

مسیرها:

- سراسری: `agents.defaults.sandbox.docker.setupCommand`
- مختص هر عامل: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="دام‌های رایج">
    - مقدار پیش‌فرض `docker.network` برابر `"none"` است (بدون خروجی شبکه)، بنابراین نصب بسته‌ها شکست می‌خورد.
    - `docker.network: "container:<id>"` به `dangerouslyAllowContainerNamespaceJoin: true` نیاز دارد و فقط برای شرایط اضطراری است.
    - `readOnlyRoot: true` از نوشتن جلوگیری می‌کند؛ `readOnlyRoot: false` را تنظیم کنید یا یک تصویر سفارشی بسازید.
    - برای نصب بسته‌ها، `user` باید root باشد (`user` را حذف کنید یا `user: "0:0"` را تنظیم کنید).
    - اجرای sandbox متغیرهای `process.env` میزبان را به ارث نمی‌برد. برای کلیدهای API مربوط به skill از `agents.defaults.sandbox.docker.env` (یا یک تصویر سفارشی) استفاده کنید.

  </Accordion>
</AccordionGroup>

## خط‌مشی ابزار و راه‌های خروج اضطراری

خط‌مشی‌های مجاز/غیرمجاز ابزار همچنان پیش از قواعد sandbox اعمال می‌شوند. اگر ابزاری به‌صورت سراسری یا برای هر عامل رد شده باشد، sandboxing آن را برنمی‌گرداند.

`tools.elevated` یک راه خروج اضطراری صریح است که `exec` را بیرون از sandbox اجرا می‌کند (به‌صورت پیش‌فرض `gateway`، یا وقتی هدف exec برابر `node` باشد، `node`). دستورهای `/exec` فقط برای فرستندگان مجاز اعمال می‌شوند و در هر جلسه پایدار می‌مانند؛ برای غیرفعال‌سازی کامل `exec`، از رد کردن در خط‌مشی ابزار استفاده کنید (نگاه کنید به [Sandbox در برابر خط‌مشی ابزار در برابر Elevated](/fa/gateway/sandbox-vs-tool-policy-vs-elevated)).

اشکال‌زدایی:

- برای بررسی حالت sandbox مؤثر، خط‌مشی ابزار، و کلیدهای پیکربندی اصلاح، از `openclaw sandbox explain` استفاده کنید.
- برای مدل ذهنی «چرا این مسدود شده است؟» به [Sandbox در برابر خط‌مشی ابزار در برابر Elevated](/fa/gateway/sandbox-vs-tool-policy-vs-elevated) مراجعه کنید.

آن را قفل و محدود نگه دارید.

## بازنویسی‌های چندعاملی

هر عامل می‌تواند sandbox + ابزارها را بازنویسی کند: `agents.list[].sandbox` و `agents.list[].tools` (به‌علاوه `agents.list[].tools.sandbox.tools` برای خط‌مشی ابزار sandbox). برای ترتیب تقدم، به [Sandbox و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) مراجعه کنید.

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

- [Sandbox و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) — بازنویسی‌ها و ترتیب تقدم در هر عامل
- [OpenShell](/fa/gateway/openshell) — راه‌اندازی backend مدیریت‌شده sandbox، حالت‌های workspace، و مرجع پیکربندی
- [پیکربندی sandbox](/fa/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox در برابر خط‌مشی ابزار در برابر Elevated](/fa/gateway/sandbox-vs-tool-policy-vs-elevated) — اشکال‌زدایی «چرا این مسدود شده است؟»
- [امنیت](/fa/gateway/security)

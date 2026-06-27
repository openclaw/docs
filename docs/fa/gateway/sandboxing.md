---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'سندباکس‌سازی OpenClaw چگونه کار می‌کند: حالت‌ها، دامنه‌ها، دسترسی به فضای کاری، و تصاویر'
title: ایزوله‌سازی
x-i18n:
    generated_at: "2026-06-27T17:48:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c9754fbfc71ee5fb48df72eece8ba3b155ce5e0d9c55aae75ce21801dceb07d
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw می‌تواند **ابزارها را داخل backendهای sandbox** اجرا کند تا دامنه اثر کاهش یابد. این کار **اختیاری** است و با پیکربندی (`agents.defaults.sandbox` یا `agents.list[].sandbox`) کنترل می‌شود. اگر sandboxing خاموش باشد، ابزارها روی میزبان اجرا می‌شوند. Gateway روی میزبان باقی می‌ماند؛ اجرای ابزار، در صورت فعال بودن، در یک sandbox ایزوله اجرا می‌شود.

<Note>
این یک مرز امنیتی بی‌نقص نیست، اما وقتی مدل کار نادرستی انجام می‌دهد، دسترسی به فایل‌سیستم و فرایندها را به‌طور معناداری محدود می‌کند.
</Note>

## چه چیزهایی sandbox می‌شوند

- اجرای ابزار (`exec`، `read`، `write`، `edit`، `apply_patch`، `process` و غیره).
- مرورگر sandboxشده اختیاری (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="جزئیات مرورگر sandboxشده">
    - به‌طور پیش‌فرض، وقتی ابزار مرورگر به آن نیاز داشته باشد، مرورگر sandbox به‌صورت خودکار شروع می‌شود (اطمینان می‌دهد CDP در دسترس است). از طریق `agents.defaults.sandbox.browser.autoStart` و `agents.defaults.sandbox.browser.autoStartTimeoutMs` پیکربندی کنید.
    - به‌طور پیش‌فرض، کانتینرهای مرورگر sandbox به‌جای شبکه سراسری `bridge` از یک شبکه Docker اختصاصی (`openclaw-sandbox-browser`) استفاده می‌کنند. با `agents.defaults.sandbox.browser.network` پیکربندی کنید.
    - گزینه اختیاری `agents.defaults.sandbox.browser.cdpSourceRange` ورودی CDP در لبه کانتینر را با یک allowlist از نوع CIDR محدود می‌کند (برای مثال `172.21.0.1/32`).
    - دسترسی مشاهده‌گر noVNC به‌طور پیش‌فرض با گذرواژه محافظت می‌شود؛ OpenClaw یک URL توکن کوتاه‌عمر صادر می‌کند که یک صفحه bootstrap محلی ارائه می‌دهد و noVNC را با گذرواژه در قطعه URL باز می‌کند (نه در query/header logs).
    - `agents.defaults.sandbox.browser.allowHostControl` به نشست‌های sandboxشده اجازه می‌دهد مرورگر میزبان را به‌صورت صریح هدف بگیرند.
    - allowlistهای اختیاری، `target: "custom"` را کنترل می‌کنند: `allowedControlUrls`، `allowedControlHosts`، `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

sandbox نمی‌شوند:

- خود فرایند Gateway.
- هر ابزاری که صریحاً اجازه داشته باشد خارج از sandbox اجرا شود (مثلاً `tools.elevated`).
  - **اجرای elevated از sandboxing عبور می‌کند و از مسیر خروج پیکربندی‌شده استفاده می‌کند (`gateway` به‌طور پیش‌فرض، یا `node` وقتی هدف exec برابر `node` است).**
  - اگر sandboxing خاموش باشد، `tools.elevated` اجرا را تغییر نمی‌دهد (از قبل روی میزبان است). [حالت Elevated](/fa/tools/elevated) را ببینید.

## حالت‌ها

`agents.defaults.sandbox.mode` کنترل می‌کند sandboxing **چه زمانی** استفاده شود:

<Tabs>
  <Tab title="off">
    بدون sandboxing.
  </Tab>
  <Tab title="non-main">
    فقط نشست‌های **غیر main** را sandbox می‌کند (پیش‌فرض اگر چت‌های عادی را روی میزبان می‌خواهید).

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
- `"shared"`: یک کانتینر مشترک برای همه نشست‌های sandboxشده.

## Backend

`agents.defaults.sandbox.backend` کنترل می‌کند **کدام runtime** sandbox را فراهم کند:

- `"docker"` (پیش‌فرض وقتی sandboxing فعال است): runtime sandbox محلی با پشتوانه Docker.
- `"ssh"`: runtime sandbox راه‌دور عمومی با پشتوانه SSH.
- `"openshell"`: runtime sandbox با پشتوانه OpenShell.

پیکربندی اختصاصی SSH زیر `agents.defaults.sandbox.ssh` قرار دارد. پیکربندی اختصاصی OpenShell زیر `plugins.entries.openshell.config` قرار دارد.

### انتخاب backend

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **محل اجرا**        | کانتینر محلی                     | هر میزبان قابل‌دسترسی با SSH   | sandbox مدیریت‌شده OpenShell                        |
| **راه‌اندازی**      | `scripts/sandbox-setup.sh`       | کلید SSH + میزبان هدف          | Plugin مربوط به OpenShell فعال باشد                |
| **مدل workspace**   | Bind-mount یا کپی                | remote-canonical (یک‌بار seed) | `mirror` یا `remote`                                |
| **کنترل شبکه**      | `docker.network` (پیش‌فرض: none) | وابسته به میزبان راه‌دور       | وابسته به OpenShell                                 |
| **sandbox مرورگر**  | پشتیبانی می‌شود                 | پشتیبانی نمی‌شود               | هنوز پشتیبانی نمی‌شود                              |
| **Bind mountها**    | `docker.binds`                   | N/A                            | N/A                                                 |
| **بهترین کاربرد**   | توسعه محلی، ایزوله‌سازی کامل    | واگذاری بار به ماشین راه‌دور   | sandboxهای راه‌دور مدیریت‌شده با همگام‌سازی دوسویه اختیاری |

### Docker backend

sandboxing به‌طور پیش‌فرض خاموش است. اگر sandboxing را فعال کنید و backend انتخاب نکنید، OpenClaw از Docker backend استفاده می‌کند. ابزارها و مرورگرهای sandbox را به‌صورت محلی از طریق سوکت daemon Docker (`/var/run/docker.sock`) اجرا می‌کند. ایزوله‌سازی کانتینر sandbox توسط namespaceهای Docker تعیین می‌شود.

برای در دسترس گذاشتن GPUهای میزبان برای sandboxهای Docker، `agents.defaults.sandbox.docker.gpus` یا override اختصاصی هر agent یعنی `agents.list[].sandbox.docker.gpus` را تنظیم کنید. مقدار به‌عنوان یک آرگومان جداگانه به flag `--gpus` در Docker پاس داده می‌شود، برای مثال `"all"` یا `"device=GPU-uuid"`، و به یک runtime میزبان سازگار مانند NVIDIA Container Toolkit نیاز دارد.

<Warning>
**محدودیت‌های Docker-out-of-Docker (DooD)**

اگر خود OpenClaw Gateway را به‌عنوان کانتینر Docker مستقر کنید، کانتینرهای sandbox هم‌رده را با استفاده از سوکت Docker میزبان هماهنگ می‌کند (DooD). این کار یک محدودیت خاص در نگاشت مسیر ایجاد می‌کند:

- **پیکربندی به مسیرهای میزبان نیاز دارد**: پیکربندی `workspace` در `openclaw.json` باید شامل **مسیر مطلق میزبان** باشد (مثلاً `/home/user/.openclaw/workspaces`)، نه مسیر داخلی کانتینر Gateway. وقتی OpenClaw از daemon Docker می‌خواهد یک sandbox ایجاد کند، daemon مسیرها را نسبت به namespace سیستم‌عامل میزبان ارزیابی می‌کند، نه namespace Gateway.
- **همسانی پل FS (نگاشت volume یکسان)**: فرایند native مربوط به OpenClaw Gateway همچنین فایل‌های heartbeat و bridge را در دایرکتوری `workspace` می‌نویسد. چون Gateway همان رشته دقیق (مسیر میزبان) را از داخل محیط کانتینری خودش ارزیابی می‌کند، استقرار Gateway باید یک نگاشت volume یکسان داشته باشد که namespace میزبان را به‌صورت native وصل کند (`-v /home/user/.openclaw:/home/user/.openclaw`).
- **حالت کد Codex**: وقتی یک sandbox در OpenClaw فعال است، OpenClaw برای آن نوبت Code Mode بومی app-server در Codex، سرورهای MCP کاربر، و اجرای Pluginهای متکی به app را غیرفعال می‌کند، چون این سطوح native از فرایند app-server میزبان Gateway اجرا می‌شوند، نه از backend sandbox در OpenClaw. وقتی ابزارهای عادی exec/process در دسترس باشند، دسترسی shell از طریق ابزارهای متکی به sandbox در OpenClaw مانند `sandbox_exec` و `sandbox_process` ارائه می‌شود. سوکت Docker میزبان را داخل کانتینرهای sandbox agent یا sandboxهای سفارشی Codex mount نکنید.

در میزبان‌های Ubuntu/AppArmor، `workspace-write` در Codex می‌تواند پیش از شروع shell شکست بخورد
وقتی عمداً `workspace-write` بومی Codex را بدون sandboxing فعال
OpenClaw اجرا می‌کنید و کاربر سرویس اجازه ساخت namespaceهای کاربر بدون امتیاز را ندارد.
وقتی خروجی شبکه sandbox در Docker غیرفعال است (`network: "none"`، مقدار
پیش‌فرض)، Codex همچنین به یک namespace شبکه بدون امتیاز نیاز دارد. نشانه‌های رایج عبارت‌اند از
`bwrap: setting up uid map: Permission denied` و
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. دستور
`openclaw doctor` را اجرا کنید؛ اگر شکست probe مربوط به namespace bwrap در Codex را گزارش کرد، ترجیحاً
از یک profile در AppArmor استفاده کنید که namespaceهای لازم را به فرایند سرویس OpenClaw
اعطا کند. `kernel.apparmor_restrict_unprivileged_userns=0` یک fallback در سطح میزبان
با tradeoffهای امنیتی است؛ فقط وقتی از نظر وضعیت امنیتی آن میزبان
قابل‌قبول است از آن استفاده کنید.

اگر مسیرها را به‌صورت داخلی و بدون همسانی مطلق با میزبان نگاشت کنید، OpenClaw به‌صورت native یک خطای مجوز `EACCES` هنگام تلاش برای نوشتن heartbeat خودش داخل محیط کانتینر پرتاب می‌کند، چون رشته مسیر کامل به‌صورت native وجود ندارد.
</Warning>

### SSH backend

وقتی می‌خواهید OpenClaw، `exec`، ابزارهای فایل، و خواندن‌های رسانه را روی یک ماشین دلخواه قابل‌دسترسی با SSH sandbox کند، از `backend: "ssh"` استفاده کنید.

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
    - OpenClaw یک ریشه راه‌دور برای هر scope زیر `sandbox.ssh.workspaceRoot` می‌سازد.
    - در اولین استفاده پس از ساخت یا بازسازی، OpenClaw آن workspace راه‌دور را یک‌بار از workspace محلی seed می‌کند.
    - پس از آن، `exec`، `read`، `write`، `edit`، `apply_patch`، خواندن رسانه‌های prompt، و staging رسانه‌های ورودی مستقیماً روی workspace راه‌دور از طریق SSH اجرا می‌شوند.
    - OpenClaw تغییرات راه‌دور را به‌صورت خودکار به workspace محلی همگام‌سازی نمی‌کند.

  </Accordion>
  <Accordion title="مواد احراز هویت">
    - `identityFile`، `certificateFile`، `knownHostsFile`: از فایل‌های محلی موجود استفاده می‌کنند و آن‌ها را از طریق پیکربندی OpenSSH عبور می‌دهند.
    - `identityData`، `certificateData`، `knownHostsData`: از رشته‌های inline یا SecretRefs استفاده می‌کنند. OpenClaw آن‌ها را از طریق snapshot معمول runtime اسرار resolve می‌کند، با مجوز `0600` در فایل‌های موقت می‌نویسد، و پس از پایان نشست SSH حذف می‌کند.
    - اگر هم `*File` و هم `*Data` برای یک مورد تنظیم شده باشند، `*Data` برای آن نشست SSH برنده است.

  </Accordion>
  <Accordion title="پیامدهای remote-canonical">
    این یک مدل **remote-canonical** است. workspace راه‌دور SSH پس از seed اولیه به وضعیت واقعی sandbox تبدیل می‌شود.

    - ویرایش‌های محلی میزبان که پس از مرحله seed خارج از OpenClaw انجام شوند، تا وقتی sandbox را بازسازی نکنید در راه‌دور قابل مشاهده نیستند.
    - `openclaw sandbox recreate` ریشه راه‌دور مربوط به هر scope را حذف می‌کند و در استفاده بعدی دوباره از محلی seed می‌کند.
    - sandboxing مرورگر در SSH backend پشتیبانی نمی‌شود.
    - تنظیمات `sandbox.docker.*` برای SSH backend اعمال نمی‌شوند.

  </Accordion>
</AccordionGroup>

### OpenShell backend

وقتی می‌خواهید OpenClaw ابزارها را در یک محیط راه‌دور مدیریت‌شده توسط OpenShell sandbox کند، از `backend: "openshell"` استفاده کنید. برای راهنمای کامل راه‌اندازی، مرجع پیکربندی، و مقایسه حالت‌های workspace، صفحه اختصاصی [OpenShell](/fa/gateway/openshell) را ببینید.

OpenShell از همان انتقال SSH هسته‌ای و پل فایل‌سیستم راه‌دور backend عمومی SSH دوباره استفاده می‌کند و lifecycle اختصاصی OpenShell (`sandbox create/get/delete`، `sandbox ssh-config`) به‌علاوه حالت اختیاری workspace با نام `mirror` را اضافه می‌کند.

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

- `mirror` (پیش‌فرض): workspace محلی canonical باقی می‌ماند. OpenClaw فایل‌های محلی را پیش از exec به OpenShell همگام‌سازی می‌کند و workspace راه‌دور را پس از exec برمی‌گرداند.
- `remote`: پس از ساخت sandbox، workspace در OpenShell canonical است. OpenClaw یک‌بار workspace راه‌دور را از workspace محلی seed می‌کند، سپس ابزارهای فایل و exec مستقیماً روی sandbox راه‌دور اجرا می‌شوند، بدون اینکه تغییرات به عقب همگام‌سازی شوند.

<AccordionGroup>
  <Accordion title="جزئیات انتقال از راه دور">
    - OpenClaw پیکربندی SSH مخصوص sandbox را از OpenShell از طریق `openshell sandbox ssh-config <name>` درخواست می‌کند.
    - هسته آن پیکربندی SSH را در یک فایل موقت می‌نویسد، نشست SSH را باز می‌کند و همان پل فایل‌سیستم راه دور را که توسط `backend: "ssh"` استفاده می‌شود، دوباره به‌کار می‌گیرد.
    - در حالت `mirror` فقط چرخه عمر متفاوت است: پیش از exec، محلی را با راه دور همگام می‌کند و سپس پس از exec دوباره همگام‌سازی را برمی‌گرداند.

  </Accordion>
  <Accordion title="محدودیت‌های فعلی OpenShell">
    - مرورگر sandbox هنوز پشتیبانی نمی‌شود
    - `sandbox.docker.binds` در backend OpenShell پشتیبانی نمی‌شود
    - تنظیمات runtime ویژه Docker زیر `sandbox.docker.*` همچنان فقط برای backend Docker اعمال می‌شوند

  </Accordion>
</AccordionGroup>

#### حالت‌های workspace

OpenShell دو مدل workspace دارد. این همان بخشی است که در عمل بیشترین اهمیت را دارد.

<Tabs>
  <Tab title="mirror (local canonical)">
    وقتی می‌خواهید **workspace محلی canonical باقی بماند** از `plugins.entries.openshell.config.mode: "mirror"` استفاده کنید.

    رفتار:

    - پیش از `exec`، OpenClaw workspace محلی را در sandbox OpenShell همگام می‌کند.
    - پس از `exec`، OpenClaw workspace راه دور را دوباره به workspace محلی همگام می‌کند.
    - ابزارهای فایل همچنان از طریق پل sandbox کار می‌کنند، اما workspace محلی بین نوبت‌ها منبع حقیقت باقی می‌ماند.

    وقتی از این استفاده کنید که:

    - فایل‌ها را خارج از OpenClaw به‌صورت محلی ویرایش می‌کنید و می‌خواهید آن تغییرات به‌طور خودکار در sandbox ظاهر شوند
    - می‌خواهید sandbox OpenShell تا حد ممکن شبیه backend Docker رفتار کند
    - می‌خواهید workspace میزبان پس از هر نوبت exec، نوشتن‌های sandbox را منعکس کند

    موازنه: هزینه همگام‌سازی اضافی پیش و پس از exec.

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    وقتی می‌خواهید **workspace OpenShell به canonical تبدیل شود** از `plugins.entries.openshell.config.mode: "remote"` استفاده کنید.

    رفتار:

    - وقتی sandbox برای نخستین بار ساخته می‌شود، OpenClaw یک‌بار workspace راه دور را از workspace محلی مقداردهی اولیه می‌کند.
    - پس از آن، `exec`، `read`، `write`، `edit` و `apply_patch` مستقیماً روی workspace راه دور OpenShell عمل می‌کنند.
    - OpenClaw پس از exec تغییرات راه دور را به workspace محلی همگام **نمی‌کند**.
    - خواندن رسانه‌ها در زمان prompt همچنان کار می‌کند، چون ابزارهای فایل و رسانه به‌جای فرض گرفتن مسیر میزبان محلی، از طریق پل sandbox می‌خوانند.
    - انتقال، SSH به sandbox OpenShell است که توسط `openshell sandbox ssh-config` برگردانده می‌شود.

    پیامدهای مهم:

    - اگر پس از مرحله مقداردهی اولیه، فایل‌ها را روی میزبان خارج از OpenClaw ویرایش کنید، sandbox راه دور آن تغییرات را به‌طور خودکار **نخواهد دید**.
    - اگر sandbox دوباره ساخته شود، workspace راه دور دوباره از workspace محلی مقداردهی اولیه می‌شود.
    - با `scope: "agent"` یا `scope: "shared"`، آن workspace راه دور در همان scope مشترک است.

    وقتی از این استفاده کنید که:

    - sandbox باید عمدتاً در سمت راه دور OpenShell زندگی کند
    - می‌خواهید سربار همگام‌سازی در هر نوبت کمتر باشد
    - نمی‌خواهید ویرایش‌های محلی میزبان به‌صورت پنهانی وضعیت sandbox راه دور را بازنویسی کنند

  </Tab>
</Tabs>

اگر sandbox را یک محیط اجرای موقت می‌دانید، `mirror` را انتخاب کنید. اگر sandbox را workspace واقعی می‌دانید، `remote` را انتخاب کنید.

#### چرخه عمر OpenShell

sandboxهای OpenShell همچنان از طریق چرخه عمر معمول sandbox مدیریت می‌شوند:

- `openclaw sandbox list` هم runtimeهای OpenShell و هم runtimeهای Docker را نشان می‌دهد
- `openclaw sandbox recreate` runtime فعلی را حذف می‌کند و اجازه می‌دهد OpenClaw آن را در استفاده بعدی دوباره بسازد
- منطق prune نیز از backend آگاه است

برای حالت `remote`، ساخت دوباره اهمیت ویژه‌ای دارد:

- ساخت دوباره، workspace راه دور canonical را برای آن scope حذف می‌کند
- استفاده بعدی، یک workspace راه دور تازه را از workspace محلی مقداردهی اولیه می‌کند

برای حالت `mirror`، ساخت دوباره عمدتاً محیط اجرای راه دور را بازنشانی می‌کند، چون workspace محلی در هر حال canonical باقی می‌ماند.

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
    workspace عامل را به‌صورت خواندن/نوشتن در `/workspace` mount می‌کند.
  </Tab>
</Tabs>

با backend OpenShell:

- حالت `mirror` همچنان از workspace محلی به‌عنوان منبع canonical بین نوبت‌های exec استفاده می‌کند
- حالت `remote` پس از مقداردهی اولیه، از workspace راه دور OpenShell به‌عنوان منبع canonical استفاده می‌کند
- `workspaceAccess: "ro"` و `"none"` همچنان رفتار نوشتن را به همان شکل محدود می‌کنند

رسانه ورودی در workspace فعال sandbox کپی می‌شود (`media/inbound/*`).

<Note>
**یادداشت Skills:** ابزار `read` در ریشه sandbox قرار دارد. با `workspaceAccess: "none"`، OpenClaw مهارت‌های واجد شرایط را در workspace sandbox (`.../skills`) mirror می‌کند تا قابل خواندن باشند. با `"rw"`، مهارت‌های workspace از `/workspace/skills` خواندنی هستند، و مهارت‌های واجد شرایطِ مدیریت‌شده، همراه، یا Plugin در مسیر فقط‌خواندنی تولیدشده `/workspace/.openclaw/sandbox-skills/skills` materialize می‌شوند.
</Note>

## mountهای bind سفارشی

`agents.defaults.sandbox.docker.binds` دایرکتوری‌های اضافی میزبان را در container mount می‌کند. قالب: `host:container:mode` (برای مثال، `"/home/user/source:/source:rw"`).

bindهای سراسری و مخصوص هر عامل **ادغام** می‌شوند (جایگزین نمی‌شوند). زیر `scope: "shared"`، bindهای مخصوص هر عامل نادیده گرفته می‌شوند.

`agents.defaults.sandbox.browser.binds` دایرکتوری‌های اضافی میزبان را فقط در container **مرورگر sandbox** mount می‌کند.

- وقتی تنظیم شود (از جمله `[]`)، برای container مرورگر جایگزین `agents.defaults.sandbox.docker.binds` می‌شود.
- وقتی حذف شود، container مرورگر به `agents.defaults.sandbox.docker.binds` برمی‌گردد (سازگار با نسخه‌های قبلی).

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

- bindها فایل‌سیستم sandbox را دور می‌زنند: آن‌ها مسیرهای میزبان را با هر حالتی که تنظیم کنید (`:ro` یا `:rw`) در معرض قرار می‌دهند.
- OpenClaw منابع bind خطرناک را مسدود می‌کند (برای مثال: `docker.sock`، `/etc`، `/proc`، `/sys`، `/dev` و mountهای والدی که آن‌ها را در معرض قرار می‌دهند).
- OpenClaw همچنین ریشه‌های رایج اعتبارنامه در دایرکتوری خانگی مانند `~/.aws`، `~/.cargo`، `~/.config`، `~/.docker`، `~/.gnupg`، `~/.netrc`، `~/.npm` و `~/.ssh` را مسدود می‌کند.
- اعتبارسنجی bind فقط تطبیق رشته‌ای نیست. OpenClaw مسیر منبع را نرمال‌سازی می‌کند، سپس آن را دوباره از طریق عمیق‌ترین جد موجود resolve می‌کند و پس از آن مسیرهای مسدودشده و ریشه‌های مجاز را دوباره بررسی می‌کند.
- این یعنی فرار از طریق والد symlink همچنان fail closed می‌شود، حتی وقتی برگ نهایی هنوز وجود ندارد. مثال: اگر `run-link` به آن‌جا اشاره کند، `/workspace/run-link/new-file` همچنان به‌صورت `/var/run/...` resolve می‌شود.
- ریشه‌های منبع مجاز نیز به همان شکل canonicalize می‌شوند، بنابراین مسیری که فقط پیش از resolve شدن symlink داخل allowlist به نظر می‌رسد، همچنان با `outside allowed roots` رد می‌شود.
- mountهای حساس (secrets، کلیدهای SSH، اعتبارنامه‌های سرویس) باید `:ro` باشند مگر اینکه کاملاً ضروری باشد.
- اگر فقط به دسترسی خواندن به workspace نیاز دارید، با `workspaceAccess: "ro"` ترکیب کنید؛ حالت‌های bind مستقل باقی می‌مانند.
- برای این‌که bindها چگونه با سیاست ابزار و exec ارتقایافته تعامل دارند، [Sandbox vs Tool Policy vs Elevated](/fa/gateway/sandbox-vs-tool-policy-vs-elevated) را ببینید.

</Warning>

## imageها و راه‌اندازی

image پیش‌فرض Docker: `openclaw-sandbox:bookworm-slim`

<Note>
**checkout منبع در برابر نصب npm**

اسکریپت‌های کمکی `scripts/sandbox-setup.sh`، `scripts/sandbox-common-setup.sh` و `scripts/sandbox-browser-setup.sh` فقط هنگام اجرا از یک [checkout منبع](https://github.com/openclaw/openclaw) در دسترس هستند. آن‌ها در بسته npm گنجانده نشده‌اند.

اگر OpenClaw را از طریق `npm install -g openclaw` نصب کرده‌اید، به‌جای آن از فرمان‌های درون‌خطی `docker build` که در ادامه نشان داده شده‌اند استفاده کنید.
</Note>

<Steps>
  <Step title="ساخت image پیش‌فرض">
    از یک checkout منبع:

    ```bash
    scripts/sandbox-setup.sh
    ```

    از یک نصب npm (بدون نیاز به checkout منبع):

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

    image پیش‌فرض شامل Node **نیست**. اگر یک مهارت به Node (یا runtimeهای دیگر) نیاز دارد، یا یک image سفارشی بسازید یا از طریق `sandbox.docker.setupCommand` نصب کنید (نیازمند خروجی شبکه + ریشه قابل‌نوشتن + کاربر root).

    وقتی `openclaw-sandbox:bookworm-slim` وجود ندارد، OpenClaw به‌صورت پنهانی `debian:bookworm-slim` ساده را جایگزین نمی‌کند. اجراهای sandbox که image پیش‌فرض را هدف می‌گیرند تا زمانی که آن را بسازید، با یک دستور ساخت سریعاً fail می‌شوند، چون image همراه `python3` را برای helperهای نوشتن/ویرایش sandbox حمل می‌کند.

  </Step>
  <Step title="اختیاری: ساخت image عمومی">
    برای یک image sandbox کاربردی‌تر با ابزارهای رایج (برای مثال `curl`، `jq`، Node 24، pnpm، `python3` و `git`):

    از یک checkout منبع:

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    از یک نصب npm، ابتدا image پیش‌فرض را بسازید (بالا را ببینید)، سپس با استفاده از [`scripts/docker/sandbox/Dockerfile.common`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.common) از repository، image عمومی را روی آن بسازید.

    سپس `agents.defaults.sandbox.docker.image` را روی `openclaw-sandbox-common:bookworm-slim` تنظیم کنید.

  </Step>
  <Step title="اختیاری: ساخت image مرورگر sandbox">
    از یک checkout منبع:

    ```bash
    scripts/sandbox-browser-setup.sh
    ```

    از یک نصب npm، با استفاده از [`scripts/docker/sandbox/Dockerfile.browser`](https://github.com/openclaw/openclaw/blob/main/scripts/docker/sandbox/Dockerfile.browser) از repository بسازید.

  </Step>
</Steps>

به‌طور پیش‌فرض، containerهای sandbox Docker با **بدون شبکه** اجرا می‌شوند. با `agents.defaults.sandbox.docker.network` بازنویسی کنید.

<AccordionGroup>
  <Accordion title="پیش‌فرض‌های Chromium مرورگر sandbox">
    image همراه مرورگر sandbox همچنین پیش‌فرض‌های محافظه‌کارانه راه‌اندازی Chromium را برای workloadهای containerized اعمال می‌کند. پیش‌فرض‌های فعلی container شامل این‌ها هستند:

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
    - سه flag سخت‌سازی گرافیک (`--disable-3d-apis`، `--disable-software-rasterizer`، `--disable-gpu`) اختیاری هستند و زمانی مفیدند که containerها پشتیبانی GPU ندارند. اگر workload شما به WebGL یا دیگر قابلیت‌های 3D/مرورگر نیاز دارد، `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` را تنظیم کنید.
    - `--disable-extensions` به‌طور پیش‌فرض فعال است و برای flowهای وابسته به extension می‌توان آن را با `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` غیرفعال کرد.
    - `--renderer-process-limit=2` توسط `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` کنترل می‌شود، که در آن `0` پیش‌فرض Chromium را نگه می‌دارد.

    اگر به پروفایل runtime متفاوتی نیاز دارید، از یک image مرورگر سفارشی استفاده کنید و entrypoint خودتان را ارائه دهید. برای پروفایل‌های Chromium محلی (غیر-container)، از `browser.extraArgs` برای افزودن flagهای راه‌اندازی اضافی استفاده کنید.

  </Accordion>
  <Accordion title="پیش‌فرض‌های امنیت شبکه">
    - `network: "host"` مسدود است.
    - `network: "container:<id>"` به‌طور پیش‌فرض مسدود است (خطر دور زدن از طریق پیوستن به namespace).
    - کنارگذاری اضطراری: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

نصب‌های Docker و Gateway کانتینری اینجا هستند: [Docker](/fa/install/docker)

برای استقرارهای Docker Gateway، `scripts/docker/setup.sh` می‌تواند پیکربندی سندباکس را راه‌اندازی اولیه کند. `OPENCLAW_SANDBOX=1` (یا `true`/`yes`/`on`) را تنظیم کنید تا آن مسیر فعال شود. می‌توانید مکان سوکت را با `OPENCLAW_DOCKER_SOCKET` بازنویسی کنید. راه‌اندازی کامل و مرجع env: [Docker](/fa/install/docker#agent-sandbox).

## setupCommand (راه‌اندازی یک‌باره کانتینر)

`setupCommand` پس از ایجاد کانتینر سندباکس، **یک بار** اجرا می‌شود (نه در هر اجرا). این دستور داخل کانتینر از طریق `sh -lc` اجرا می‌شود.

مسیرها:

- سراسری: `agents.defaults.sandbox.docker.setupCommand`
- برای هر عامل: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="دام‌های رایج">
    - مقدار پیش‌فرض `docker.network` برابر `"none"` است (بدون خروجی شبکه)، بنابراین نصب بسته‌ها شکست می‌خورد.
    - `docker.network: "container:<id>"` به `dangerouslyAllowContainerNamespaceJoin: true` نیاز دارد و فقط برای کنارگذاری اضطراری است.
    - `readOnlyRoot: true` مانع نوشتن می‌شود؛ `readOnlyRoot: false` را تنظیم کنید یا یک تصویر سفارشی بسازید.
    - برای نصب بسته‌ها، `user` باید root باشد (`user` را حذف کنید یا `user: "0:0"` را تنظیم کنید).
    - اجرای سندباکس، `process.env` میزبان را **به ارث نمی‌برد**. برای کلیدهای API مربوط به Skills از `agents.defaults.sandbox.docker.env` (یا یک تصویر سفارشی) استفاده کنید.
    - مقادیر در `agents.defaults.sandbox.docker.env` به‌عنوان متغیرهای محیطی صریح کانتینر Docker پاس داده می‌شوند. هر کسی که به daemon Docker دسترسی داشته باشد می‌تواند آن‌ها را با دستورهای فراداده Docker مانند `docker inspect` بررسی کند. اگر این افشای فراداده قابل قبول نیست، از یک تصویر سفارشی، فایل secret متصل‌شده، یا مسیر تحویل secret دیگری استفاده کنید.

  </Accordion>
</AccordionGroup>

## سیاست ابزار و راه‌های خروج اضطراری

سیاست‌های مجاز/غیرمجاز ابزار همچنان پیش از قوانین سندباکس اعمال می‌شوند. اگر ابزاری به‌صورت سراسری یا برای هر عامل غیرمجاز شده باشد، سندباکس‌کردن آن را برنمی‌گرداند.

`tools.elevated` یک راه خروج اضطراری صریح است که `exec` را خارج از سندباکس اجرا می‌کند (به‌طور پیش‌فرض `gateway`، یا وقتی هدف اجرای `exec` برابر `node` باشد، `node`). دستورالعمل‌های `/exec` فقط برای فرستندگان مجاز اعمال می‌شوند و در هر نشست ماندگار می‌مانند؛ برای غیرفعال‌سازی سخت `exec`، از غیرمجازکردن در سیاست ابزار استفاده کنید (ببینید [سندباکس در برابر سیاست ابزار در برابر Elevated](/fa/gateway/sandbox-vs-tool-policy-vs-elevated)).

اشکال‌زدایی:

- از `openclaw sandbox explain` برای بررسی حالت مؤثر سندباکس، سیاست ابزار، و کلیدهای پیکربندی fix-it استفاده کنید.
- برای مدل ذهنی «چرا این مسدود شده است؟» ببینید [سندباکس در برابر سیاست ابزار در برابر Elevated](/fa/gateway/sandbox-vs-tool-policy-vs-elevated).

آن را قفل‌شده نگه دارید.

## بازنویسی‌های چندعاملی

هر عامل می‌تواند سندباکس + ابزارها را بازنویسی کند: `agents.list[].sandbox` و `agents.list[].tools` (به‌علاوه `agents.list[].tools.sandbox.tools` برای سیاست ابزار سندباکس). برای تقدم، ببینید [سندباکس و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools).

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

- [سندباکس و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) — بازنویسی‌ها و تقدم برای هر عامل
- [OpenShell](/fa/gateway/openshell) — راه‌اندازی backend سندباکس مدیریت‌شده، حالت‌های workspace، و مرجع پیکربندی
- [پیکربندی سندباکس](/fa/gateway/config-agents#agentsdefaultssandbox)
- [سندباکس در برابر سیاست ابزار در برابر Elevated](/fa/gateway/sandbox-vs-tool-policy-vs-elevated) — اشکال‌زدایی «چرا این مسدود شده است؟»
- [امنیت](/fa/gateway/security)

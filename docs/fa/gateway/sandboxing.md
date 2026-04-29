---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
sidebarTitle: Sandboxing
status: active
summary: 'نحوهٔ کار سندباکس‌سازی OpenClaw: حالت‌ها، محدوده‌ها، دسترسی به فضای کاری و تصاویر'
title: سندباکس‌سازی
x-i18n:
    generated_at: "2026-04-29T22:55:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96861f3f70bf26b5ed20a063c047064f98a0dc74d36e8f4ccada1f3bb455118d
    source_path: gateway/sandboxing.md
    workflow: 16
---

OpenClaw می‌تواند **ابزارها را داخل بک‌اندهای سندباکس** اجرا کند تا دامنهٔ اثر خطا محدودتر شود. این کار **اختیاری** است و با پیکربندی (`agents.defaults.sandbox` یا `agents.list[].sandbox`) کنترل می‌شود. اگر سندباکس‌سازی خاموش باشد، ابزارها روی میزبان اجرا می‌شوند. Gateway روی میزبان باقی می‌ماند؛ اجرای ابزار، در صورت فعال بودن، داخل یک سندباکس ایزوله انجام می‌شود.

<Note>
این یک مرز امنیتی کامل نیست، اما وقتی مدل کار نادرستی انجام می‌دهد، دسترسی به فایل‌سیستم و فرایندها را به‌طور محسوسی محدود می‌کند.
</Note>

## چه چیزهایی سندباکس می‌شوند

- اجرای ابزار (`exec`، `read`، `write`، `edit`، `apply_patch`، `process` و غیره).
- مرورگر سندباکس‌شدهٔ اختیاری (`agents.defaults.sandbox.browser`).

<AccordionGroup>
  <Accordion title="جزئیات مرورگر سندباکس‌شده">
    - به‌طور پیش‌فرض، وقتی ابزار مرورگر به آن نیاز دارد، مرورگر سندباکس به‌صورت خودکار شروع می‌شود (مطمئن می‌شود CDP قابل دسترسی است). از طریق `agents.defaults.sandbox.browser.autoStart` و `agents.defaults.sandbox.browser.autoStartTimeoutMs` پیکربندی کنید.
    - به‌طور پیش‌فرض، کانتینرهای مرورگر سندباکس به‌جای شبکهٔ سراسری `bridge` از یک شبکهٔ Docker اختصاصی (`openclaw-sandbox-browser`) استفاده می‌کنند. با `agents.defaults.sandbox.browser.network` پیکربندی کنید.
    - گزینهٔ اختیاری `agents.defaults.sandbox.browser.cdpSourceRange` ورود CDP در لبهٔ کانتینر را با یک فهرست مجاز CIDR محدود می‌کند (برای مثال `172.21.0.1/32`).
    - دسترسی ناظر noVNC به‌طور پیش‌فرض با رمز عبور محافظت می‌شود؛ OpenClaw یک URL توکن کوتاه‌عمر منتشر می‌کند که یک صفحهٔ راه‌اندازی محلی ارائه می‌دهد و noVNC را با رمز عبور در قطعهٔ URL باز می‌کند (نه در گزارش‌های query/header).
    - `agents.defaults.sandbox.browser.allowHostControl` به نشست‌های سندباکس‌شده اجازه می‌دهد مرورگر میزبان را به‌صورت صریح هدف بگیرند.
    - فهرست‌های مجاز اختیاری، `target: "custom"` را کنترل می‌کنند: `allowedControlUrls`، `allowedControlHosts`، `allowedControlPorts`.

  </Accordion>
</AccordionGroup>

سندباکس نمی‌شوند:

- خود فرایند Gateway.
- هر ابزاری که صریحاً مجاز شده باشد خارج از سندباکس اجرا شود (مثلاً `tools.elevated`).
  - **اجرای ارتقایافته از سندباکس‌سازی عبور می‌کند و از مسیر خروج پیکربندی‌شده استفاده می‌کند (`gateway` به‌طور پیش‌فرض، یا `node` وقتی هدف اجرا `node` باشد).**
  - اگر سندباکس‌سازی خاموش باشد، `tools.elevated` اجرا را تغییر نمی‌دهد (از قبل روی میزبان است). [حالت ارتقایافته](/fa/tools/elevated) را ببینید.

## حالت‌ها

`agents.defaults.sandbox.mode` کنترل می‌کند سندباکس‌سازی **چه زمانی** استفاده شود:

<Tabs>
  <Tab title="off">
    بدون سندباکس‌سازی.
  </Tab>
  <Tab title="non-main">
    فقط نشست‌های **غیر اصلی** را سندباکس کن (پیش‌فرض، اگر می‌خواهید چت‌های عادی روی میزبان باشند).

    `"non-main"` بر اساس `session.mainKey` است (پیش‌فرض `"main"`)، نه شناسهٔ عامل. نشست‌های گروه/کانال کلیدهای خودشان را دارند، بنابراین غیر اصلی محسوب می‌شوند و سندباکس خواهند شد.

  </Tab>
  <Tab title="all">
    هر نشست داخل یک سندباکس اجرا می‌شود.
  </Tab>
</Tabs>

## دامنه

`agents.defaults.sandbox.scope` کنترل می‌کند **چند کانتینر** ساخته شود:

- `"agent"` (پیش‌فرض): یک کانتینر برای هر عامل.
- `"session"`: یک کانتینر برای هر نشست.
- `"shared"`: یک کانتینر مشترک میان همهٔ نشست‌های سندباکس‌شده.

## بک‌اند

`agents.defaults.sandbox.backend` کنترل می‌کند **کدام runtime** سندباکس را فراهم کند:

- `"docker"` (پیش‌فرض وقتی سندباکس‌سازی فعال است): runtime سندباکس محلی مبتنی بر Docker.
- `"ssh"`: runtime سندباکس دور عمومی مبتنی بر SSH.
- `"openshell"`: runtime سندباکس مبتنی بر OpenShell.

پیکربندی مخصوص SSH زیر `agents.defaults.sandbox.ssh` قرار دارد. پیکربندی مخصوص OpenShell زیر `plugins.entries.openshell.config` قرار دارد.

### انتخاب بک‌اند

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **محل اجرا**        | کانتینر محلی                     | هر میزبان قابل دسترسی با SSH   | سندباکس مدیریت‌شدهٔ OpenShell                       |
| **راه‌اندازی**      | `scripts/sandbox-setup.sh`       | کلید SSH + میزبان هدف          | Plugin OpenShell فعال                              |
| **مدل workspace**   | bind-mount یا کپی                | معیار-دور (seed یک‌باره)       | `mirror` یا `remote`                                |
| **کنترل شبکه**      | `docker.network` (پیش‌فرض: هیچ‌کدام) | وابسته به میزبان دور       | وابسته به OpenShell                                |
| **سندباکس مرورگر**  | پشتیبانی می‌شود                  | پشتیبانی نمی‌شود               | هنوز پشتیبانی نمی‌شود                              |
| **Bind mountها**    | `docker.binds`                   | نامرتبط                        | نامرتبط                                            |
| **بهترین کاربرد**   | توسعهٔ محلی، ایزولاسیون کامل    | واگذاری کار به ماشین دور       | سندباکس‌های دور مدیریت‌شده با همگام‌سازی دوطرفهٔ اختیاری |

### بک‌اند Docker

سندباکس‌سازی به‌طور پیش‌فرض خاموش است. اگر سندباکس‌سازی را فعال کنید و بک‌اندی انتخاب نکنید، OpenClaw از بک‌اند Docker استفاده می‌کند. این بک‌اند ابزارها و مرورگرهای سندباکس را به‌صورت محلی از طریق سوکت daemon مربوط به Docker (`/var/run/docker.sock`) اجرا می‌کند. ایزولاسیون کانتینر سندباکس توسط namespaceهای Docker تعیین می‌شود.

برای در معرض قرار دادن GPUهای میزبان برای سندباکس‌های Docker، `agents.defaults.sandbox.docker.gpus` یا override هر عامل در `agents.list[].sandbox.docker.gpus` را تنظیم کنید. مقدار به‌عنوان یک آرگومان جداگانه به پرچم `--gpus` در Docker داده می‌شود، برای مثال `"all"` یا `"device=GPU-uuid"`، و به runtime میزبان سازگار مانند NVIDIA Container Toolkit نیاز دارد.

<Warning>
**محدودیت‌های Docker-out-of-Docker (DooD)**

اگر خود OpenClaw Gateway را به‌عنوان یک کانتینر Docker مستقر کنید، کانتینرهای سندباکس هم‌سطح را با استفاده از سوکت Docker میزبان هماهنگ می‌کند (DooD). این موضوع یک محدودیت خاص در نگاشت مسیر ایجاد می‌کند:

- **پیکربندی به مسیرهای میزبان نیاز دارد**: پیکربندی `workspace` در `openclaw.json` باید شامل **مسیر مطلق میزبان** باشد (مثلاً `/home/user/.openclaw/workspaces`)، نه مسیر داخلی کانتینر Gateway. وقتی OpenClaw از daemon مربوط به Docker می‌خواهد یک سندباکس بسازد، daemon مسیرها را نسبت به namespace سیستم‌عامل میزبان ارزیابی می‌کند، نه namespace مربوط به Gateway.
- **برابری پل FS (نقشهٔ volume یکسان)**: فرایند بومی OpenClaw Gateway همچنین فایل‌های Heartbeat و bridge را در دایرکتوری `workspace` می‌نویسد. چون Gateway همان رشتهٔ دقیق (مسیر میزبان) را از داخل محیط کانتینری خودش ارزیابی می‌کند، استقرار Gateway باید یک نگاشت volume یکسان داشته باشد که namespace میزبان را به‌صورت بومی پیوند دهد (`-v /home/user/.openclaw:/home/user/.openclaw`).

اگر مسیرها را به‌صورت داخلی و بدون برابری مطلق با میزبان نگاشت کنید، OpenClaw به‌صورت بومی هنگام تلاش برای نوشتن Heartbeat داخل محیط کانتینر، خطای مجوز `EACCES` می‌دهد، چون رشتهٔ مسیر کاملاً واجد شرایط به‌صورت بومی وجود ندارد.
</Warning>

### بک‌اند SSH

وقتی می‌خواهید OpenClaw اجرای `exec`، ابزارهای فایل و خواندن‌های رسانه‌ای را روی هر ماشین قابل دسترسی با SSH سندباکس کند، از `backend: "ssh"` استفاده کنید.

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
  <Accordion title="نحوهٔ کارکرد">
    - OpenClaw یک ریشهٔ دور برای هر دامنه زیر `sandbox.ssh.workspaceRoot` می‌سازد.
    - در نخستین استفاده پس از ایجاد یا ایجاد مجدد، OpenClaw آن workspace دور را یک‌بار از workspace محلی seed می‌کند.
    - پس از آن، `exec`، `read`، `write`، `edit`، `apply_patch`، خواندن‌های رسانهٔ prompt، و staging رسانهٔ ورودی مستقیماً از طریق SSH روی workspace دور اجرا می‌شوند.
    - OpenClaw تغییرات دور را به‌صورت خودکار به workspace محلی همگام نمی‌کند.

  </Accordion>
  <Accordion title="مواد احراز هویت">
    - `identityFile`، `certificateFile`، `knownHostsFile`: از فایل‌های محلی موجود استفاده می‌کنند و آن‌ها را از طریق پیکربندی OpenSSH عبور می‌دهند.
    - `identityData`، `certificateData`، `knownHostsData`: از رشته‌های inline یا SecretRefها استفاده می‌کنند. OpenClaw آن‌ها را از طریق snapshot معمول runtime اسرار resolve می‌کند، در فایل‌های موقت با `0600` می‌نویسد، و هنگام پایان نشست SSH حذفشان می‌کند.
    - اگر هم `*File` و هم `*Data` برای یک مورد یکسان تنظیم شده باشند، `*Data` برای آن نشست SSH برنده است.

  </Accordion>
  <Accordion title="پیامدهای معیار-دور">
    این یک مدل **معیار-دور** است. workspace دور SSH پس از seed اولیه به وضعیت واقعی سندباکس تبدیل می‌شود.

    - ویرایش‌های محلی میزبان که پس از مرحلهٔ seed بیرون از OpenClaw انجام شوند، تا زمانی که سندباکس را دوباره ایجاد نکنید از راه دور قابل مشاهده نیستند.
    - `openclaw sandbox recreate` ریشهٔ دور مربوط به هر دامنه را حذف می‌کند و در استفادهٔ بعدی دوباره از محلی seed می‌کند.
    - سندباکس‌سازی مرورگر در بک‌اند SSH پشتیبانی نمی‌شود.
    - تنظیمات `sandbox.docker.*` برای بک‌اند SSH اعمال نمی‌شوند.

  </Accordion>
</AccordionGroup>

### بک‌اند OpenShell

وقتی می‌خواهید OpenClaw ابزارها را در یک محیط دور مدیریت‌شده توسط OpenShell سندباکس کند، از `backend: "openshell"` استفاده کنید. برای راهنمای کامل راه‌اندازی، مرجع پیکربندی و مقایسهٔ حالت‌های workspace، صفحهٔ اختصاصی [OpenShell](/fa/gateway/openshell) را ببینید.

OpenShell همان انتقال SSH اصلی و پل فایل‌سیستم دور را که بک‌اند عمومی SSH استفاده می‌کند دوباره به‌کار می‌گیرد، و lifecycle مخصوص OpenShell (`sandbox create/get/delete`، `sandbox ssh-config`) به‌همراه حالت اختیاری workspace به نام `mirror` را اضافه می‌کند.

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

- `mirror` (پیش‌فرض): workspace محلی معیار باقی می‌ماند. OpenClaw فایل‌های محلی را پیش از exec وارد OpenShell همگام می‌کند و پس از exec، workspace دور را برمی‌گرداند و همگام می‌کند.
- `remote`: پس از ساخته شدن سندباکس، workspace مربوط به OpenShell معیار است. OpenClaw workspace دور را یک‌بار از workspace محلی seed می‌کند، سپس ابزارهای فایل و exec مستقیماً روی سندباکس دور اجرا می‌شوند، بدون اینکه تغییرات به عقب همگام شوند.

<AccordionGroup>
  <Accordion title="جزئیات انتقال دور">
    - OpenClaw از OpenShell پیکربندی SSH مخصوص سندباکس را از طریق `openshell sandbox ssh-config <name>` می‌خواهد.
    - Core آن پیکربندی SSH را در یک فایل موقت می‌نویسد، نشست SSH را باز می‌کند، و همان پل فایل‌سیستم دوری را که توسط `backend: "ssh"` استفاده می‌شود دوباره به‌کار می‌گیرد.
    - در حالت `mirror` فقط lifecycle متفاوت است: پیش از exec محلی را به دور همگام کن، سپس پس از exec دوباره همگام کن.

  </Accordion>
  <Accordion title="محدودیت‌های فعلی OpenShell">
    - مرورگر سندباکس هنوز پشتیبانی نمی‌شود
    - `sandbox.docker.binds` در بک‌اند OpenShell پشتیبانی نمی‌شود
    - گزینه‌های runtime مخصوص Docker زیر `sandbox.docker.*` همچنان فقط برای بک‌اند Docker اعمال می‌شوند

  </Accordion>
</AccordionGroup>

#### حالت‌های workspace

OpenShell دو مدل workspace دارد. این همان بخشی است که در عمل بیشترین اهمیت را دارد.

<Tabs>
  <Tab title="mirror (معیار محلی)">
    وقتی می‌خواهید **workspace محلی معیار باقی بماند**، از `plugins.entries.openshell.config.mode: "mirror"` استفاده کنید.

    رفتار:

    - پیش از `exec`، OpenClaw workspace محلی را داخل سندباکس OpenShell همگام می‌کند.
    - پس از `exec`، OpenClaw workspace دور را دوباره به workspace محلی همگام می‌کند.
    - ابزارهای فایل همچنان از طریق پل سندباکس عمل می‌کنند، اما workspace محلی بین نوبت‌ها منبع حقیقت باقی می‌ماند.

    زمانی از این استفاده کنید که:

    - فایل‌ها را به‌صورت محلی بیرون از OpenClaw ویرایش می‌کنید و می‌خواهید آن تغییرات به‌طور خودکار در محیط ایزوله ظاهر شوند
    - می‌خواهید محیط ایزوله OpenShell تا حد ممکن شبیه بک‌اند Docker رفتار کند
    - می‌خواهید فضای کاری میزبان پس از هر نوبت exec، نوشتن‌های محیط ایزوله را منعکس کند

    مصالحه: هزینه همگام‌سازی اضافی قبل و بعد از exec.

  </Tab>
  <Tab title="remote (OpenShell canonical)">
    وقتی می‌خواهید **فضای کاری OpenShell مرجع شود** از `plugins.entries.openshell.config.mode: "remote"` استفاده کنید.

    رفتار:

    - وقتی محیط ایزوله برای نخستین بار ساخته می‌شود، OpenClaw فضای کاری راه‌دور را یک‌بار از فضای کاری محلی مقداردهی اولیه می‌کند.
    - پس از آن، `exec`، `read`، `write`، `edit`، و `apply_patch` مستقیماً روی فضای کاری راه‌دور OpenShell عمل می‌کنند.
    - OpenClaw تغییرات راه‌دور را پس از exec به فضای کاری محلی همگام‌سازی **نمی‌کند**.
    - خواندن رسانه‌ها در زمان پرامپت همچنان کار می‌کند، چون ابزارهای فایل و رسانه به‌جای فرض کردن مسیر میزبان محلی، از طریق پل محیط ایزوله می‌خوانند.
    - انتقال از طریق SSH به محیط ایزوله OpenShell انجام می‌شود که `openshell sandbox ssh-config` برمی‌گرداند.

    پیامدهای مهم:

    - اگر پس از مرحله مقداردهی اولیه، فایل‌ها را روی میزبان بیرون از OpenClaw ویرایش کنید، محیط ایزوله راه‌دور آن تغییرات را به‌طور خودکار **نخواهد** دید.
    - اگر محیط ایزوله دوباره ساخته شود، فضای کاری راه‌دور دوباره از فضای کاری محلی مقداردهی اولیه می‌شود.
    - با `scope: "agent"` یا `scope: "shared"`، آن فضای کاری راه‌دور در همان scope مشترک است.

    در این موارد استفاده کنید:

    - محیط ایزوله باید عمدتاً در سمت راه‌دور OpenShell زندگی کند
    - می‌خواهید سربار همگام‌سازی در هر نوبت کمتر باشد
    - نمی‌خواهید ویرایش‌های محلی میزبان بی‌صدا وضعیت محیط ایزوله راه‌دور را بازنویسی کنند

  </Tab>
</Tabs>

اگر محیط ایزوله را یک محیط اجرای موقت می‌دانید، `mirror` را انتخاب کنید. اگر محیط ایزوله را فضای کاری واقعی می‌دانید، `remote` را انتخاب کنید.

#### چرخه عمر OpenShell

محیط‌های ایزوله OpenShell همچنان از طریق چرخه عمر عادی محیط ایزوله مدیریت می‌شوند:

- `openclaw sandbox list` runtimeهای OpenShell و runtimeهای Docker را نشان می‌دهد
- `openclaw sandbox recreate` runtime فعلی را حذف می‌کند و به OpenClaw اجازه می‌دهد در استفاده بعدی آن را دوباره بسازد
- منطق prune هم نسبت به بک‌اند آگاه است

برای حالت `remote`، recreate اهمیت ویژه‌ای دارد:

- recreate فضای کاری راه‌دور مرجع را برای آن scope حذف می‌کند
- استفاده بعدی یک فضای کاری راه‌دور تازه را از فضای کاری محلی مقداردهی اولیه می‌کند

برای حالت `mirror`، recreate عمدتاً محیط اجرای راه‌دور را بازنشانی می‌کند، چون در هر صورت فضای کاری محلی مرجع باقی می‌ماند.

## دسترسی فضای کاری

`agents.defaults.sandbox.workspaceAccess` کنترل می‌کند **محیط ایزوله چه چیزی را می‌تواند ببیند**:

<Tabs>
  <Tab title="none (default)">
    ابزارها یک فضای کاری محیط ایزوله را زیر `~/.openclaw/sandboxes` می‌بینند.
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
- حالت `remote` پس از مقداردهی اولیه، از فضای کاری راه‌دور OpenShell به‌عنوان منبع مرجع استفاده می‌کند
- `workspaceAccess: "ro"` و `"none"` همچنان رفتار نوشتن را به همان شکل محدود می‌کنند

رسانه ورودی در فضای کاری فعال محیط ایزوله کپی می‌شود (`media/inbound/*`).

<Note>
**نکته Skills:** ابزار `read` ریشه‌اش محیط ایزوله است. با `workspaceAccess: "none"`، OpenClaw مهارت‌های واجد شرایط را در فضای کاری محیط ایزوله (`.../skills`) mirror می‌کند تا بتوان آن‌ها را خواند. با `"rw"`، مهارت‌های فضای کاری از `/workspace/skills` قابل خواندن هستند.
</Note>

## mountهای bind سفارشی

`agents.defaults.sandbox.docker.binds` دایرکتوری‌های اضافی میزبان را در کانتینر mount می‌کند. قالب: `host:container:mode` (برای مثال، `"/home/user/source:/source:rw"`).

bindهای سراسری و مخصوص هر عامل **ادغام** می‌شوند (جایگزین نمی‌شوند). در `scope: "shared"`، bindهای مخصوص هر عامل نادیده گرفته می‌شوند.

`agents.defaults.sandbox.browser.binds` دایرکتوری‌های اضافی میزبان را فقط در کانتینر **مرورگر محیط ایزوله** mount می‌کند.

- وقتی تنظیم شود (شامل `[]`)، برای کانتینر مرورگر جایگزین `agents.defaults.sandbox.docker.binds` می‌شود.
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

- bindها از فایل‌سیستم محیط ایزوله عبور می‌کنند: مسیرهای میزبان را با هر حالتی که تنظیم کنید (`:ro` یا `:rw`) در معرض قرار می‌دهند.
- OpenClaw منابع bind خطرناک را مسدود می‌کند (برای مثال: `docker.sock`، `/etc`، `/proc`، `/sys`، `/dev`، و mountهای والدی که آن‌ها را در معرض قرار می‌دهند).
- OpenClaw همچنین ریشه‌های رایج اعتبارنامه در دایرکتوری خانه مانند `~/.aws`، `~/.cargo`، `~/.config`، `~/.docker`، `~/.gnupg`، `~/.netrc`، `~/.npm`، و `~/.ssh` را مسدود می‌کند.
- اعتبارسنجی bind فقط تطبیق رشته‌ای نیست. OpenClaw مسیر منبع را نرمال‌سازی می‌کند، سپس آن را دوباره از طریق عمیق‌ترین جد موجود resolve می‌کند و بعد مسیرهای مسدودشده و ریشه‌های مجاز را دوباره بررسی می‌کند.
- یعنی گریزهای symlink-parent حتی وقتی برگ نهایی هنوز وجود ندارد هم بسته شکست می‌خورند. مثال: اگر `run-link` به آنجا اشاره کند، `/workspace/run-link/new-file` همچنان به‌صورت `/var/run/...` resolve می‌شود.
- ریشه‌های منبع مجاز نیز به همان شکل canonicalize می‌شوند، بنابراین مسیری که فقط قبل از resolve کردن symlink داخل allowlist به نظر می‌رسد، همچنان با `outside allowed roots` رد می‌شود.
- mountهای حساس (secrets، کلیدهای SSH، اعتبارنامه‌های سرویس) باید `:ro` باشند مگر اینکه واقعاً لازم باشد.
- اگر فقط به دسترسی خواندن به فضای کاری نیاز دارید، با `workspaceAccess: "ro"` ترکیب کنید؛ حالت‌های bind مستقل باقی می‌مانند.
- برای اینکه ببینید bindها چگونه با سیاست ابزار و exec ارتقایافته تعامل دارند، [محیط ایزوله در برابر سیاست ابزار در برابر ارتقایافته](/fa/gateway/sandbox-vs-tool-policy-vs-elevated) را ببینید.

</Warning>

## تصاویر و راه‌اندازی

تصویر پیش‌فرض Docker: `openclaw-sandbox:bookworm-slim`

<Steps>
  <Step title="ساخت تصویر پیش‌فرض">
    ```bash
    scripts/sandbox-setup.sh
    ```

    تصویر پیش‌فرض شامل Node **نیست**. اگر یک skill به Node (یا runtimeهای دیگر) نیاز دارد، یا یک تصویر سفارشی بسازید یا از طریق `sandbox.docker.setupCommand` نصب کنید (نیازمند خروجی شبکه + ریشه قابل نوشتن + کاربر root).

    وقتی `openclaw-sandbox:bookworm-slim` موجود نیست، OpenClaw بی‌صدا `debian:bookworm-slim` ساده را جایگزین نمی‌کند. اجرای محیط ایزوله‌ای که تصویر پیش‌فرض را هدف می‌گیرد، تا زمانی که `scripts/sandbox-setup.sh` را اجرا کنید با یک دستور ساخت سریع شکست می‌خورد، چون تصویر همراه، `python3` را برای helperهای نوشتن/ویرایش محیط ایزوله دارد.

  </Step>
  <Step title="اختیاری: ساخت تصویر common">
    برای یک تصویر محیط ایزوله کاربردی‌تر با ابزارهای رایج (برای مثال `curl`، `jq`، `nodejs`، `python3`، `git`):

    ```bash
    scripts/sandbox-common-setup.sh
    ```

    سپس `agents.defaults.sandbox.docker.image` را روی `openclaw-sandbox-common:bookworm-slim` تنظیم کنید.

  </Step>
  <Step title="اختیاری: ساخت تصویر مرورگر محیط ایزوله">
    ```bash
    scripts/sandbox-browser-setup.sh
    ```
  </Step>
</Steps>

به‌طور پیش‌فرض، کانتینرهای محیط ایزوله Docker با **بدون شبکه** اجرا می‌شوند. با `agents.defaults.sandbox.docker.network` بازنویسی کنید.

<AccordionGroup>
  <Accordion title="پیش‌فرض‌های Chromium مرورگر محیط ایزوله">
    تصویر مرورگر محیط ایزوله همراه، پیش‌فرض‌های محافظه‌کارانه راه‌اندازی Chromium را نیز برای workloadهای کانتینری اعمال می‌کند. پیش‌فرض‌های فعلی کانتینر شامل موارد زیر است:

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
    - سه پرچم سخت‌سازی گرافیکی (`--disable-3d-apis`، `--disable-software-rasterizer`، `--disable-gpu`) اختیاری هستند و زمانی مفیدند که کانتینرها پشتیبانی GPU ندارند. اگر workload شما به WebGL یا قابلیت‌های دیگر 3D/مرورگر نیاز دارد، `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` را تنظیم کنید.
    - `--disable-extensions` به‌طور پیش‌فرض فعال است و برای جریان‌هایی که به افزونه وابسته‌اند می‌تواند با `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` غیرفعال شود.
    - `--renderer-process-limit=2` با `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` کنترل می‌شود، که در آن `0` پیش‌فرض Chromium را نگه می‌دارد.

    اگر به پروفایل runtime متفاوتی نیاز دارید، از یک تصویر مرورگر سفارشی استفاده کنید و entrypoint خودتان را ارائه دهید. برای پروفایل‌های Chromium محلی (غیرکانتینری)، از `browser.extraArgs` برای افزودن پرچم‌های راه‌اندازی اضافی استفاده کنید.

  </Accordion>
  <Accordion title="پیش‌فرض‌های امنیت شبکه">
    - `network: "host"` مسدود است.
    - `network: "container:<id>"` به‌طور پیش‌فرض مسدود است (ریسک دور زدن با join کردن namespace).
    - بازنویسی اضطراری: `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`.

  </Accordion>
</AccordionGroup>

نصب‌های Docker و Gateway کانتینری‌شده اینجا هستند: [Docker](/fa/install/docker)

برای استقرارهای Gateway با Docker، `scripts/docker/setup.sh` می‌تواند پیکربندی محیط ایزوله را bootstrap کند. برای فعال کردن آن مسیر، `OPENCLAW_SANDBOX=1` (یا `true`/`yes`/`on`) را تنظیم کنید. می‌توانید مکان socket را با `OPENCLAW_DOCKER_SOCKET` بازنویسی کنید. راه‌اندازی کامل و مرجع env: [Docker](/fa/install/docker#agent-sandbox).

## setupCommand (راه‌اندازی یک‌باره کانتینر)

`setupCommand` پس از ساخته شدن کانتینر محیط ایزوله **یک‌بار** اجرا می‌شود (نه در هر اجرا). داخل کانتینر از طریق `sh -lc` اجرا می‌شود.

مسیرها:

- سراسری: `agents.defaults.sandbox.docker.setupCommand`
- مخصوص هر عامل: `agents.list[].sandbox.docker.setupCommand`

<AccordionGroup>
  <Accordion title="دام‌های رایج">
    - `docker.network` پیش‌فرض `"none"` است (بدون خروجی)، بنابراین نصب packageها شکست می‌خورد.
    - `docker.network: "container:<id>"` به `dangerouslyAllowContainerNamespaceJoin: true` نیاز دارد و فقط برای حالت اضطراری است.
    - `readOnlyRoot: true` از نوشتن جلوگیری می‌کند؛ `readOnlyRoot: false` را تنظیم کنید یا یک تصویر سفارشی بسازید.
    - برای نصب packageها، `user` باید root باشد (`user` را حذف کنید یا `user: "0:0"` را تنظیم کنید).
    - exec محیط ایزوله `process.env` میزبان را به ارث **نمی‌برد**. برای کلیدهای API skill، از `agents.defaults.sandbox.docker.env` (یا یک تصویر سفارشی) استفاده کنید.

  </Accordion>
</AccordionGroup>

## سیاست ابزار و راه‌های خروج

سیاست‌های allow/deny ابزار همچنان پیش از قواعد محیط ایزوله اعمال می‌شوند. اگر ابزاری به‌صورت سراسری یا مخصوص هر عامل deny شده باشد، sandboxing آن را برنمی‌گرداند.

`tools.elevated` یک راه خروج صریح است که `exec` را بیرون از محیط ایزوله اجرا می‌کند (به‌طور پیش‌فرض `gateway`، یا وقتی هدف exec برابر `node` است، `node`). دستورهای `/exec` فقط برای فرستنده‌های مجاز اعمال می‌شوند و در هر session ماندگار می‌مانند؛ برای hard-disable کردن `exec`، از deny در سیاست ابزار استفاده کنید (ببینید [محیط ایزوله در برابر سیاست ابزار در برابر ارتقایافته](/fa/gateway/sandbox-vs-tool-policy-vs-elevated)).

اشکال‌زدایی:

- از `openclaw sandbox explain` برای بررسی حالت مؤثر محیط ایزوله، سیاست ابزار، و کلیدهای پیکربندی fix-it استفاده کنید.
- برای مدل ذهنی «چرا این مسدود شده است؟»، [محیط ایزوله در برابر سیاست ابزار در برابر ارتقایافته](/fa/gateway/sandbox-vs-tool-policy-vs-elevated) را ببینید.

آن را قفل‌شده نگه دارید.

## بازنویسی‌های چندعاملی

هر عامل می‌تواند محیط ایزوله + ابزارها را بازنویسی کند: `agents.list[].sandbox` و `agents.list[].tools` (به‌علاوه `agents.list[].tools.sandbox.tools` برای سیاست ابزار محیط ایزوله). برای تقدم، [محیط ایزوله و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) را ببینید.

## مثال حداقلی فعال‌سازی

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

- [سندباکس و ابزارهای چندعاملی](/fa/tools/multi-agent-sandbox-tools) — بازنویسی‌ها و تقدم به‌ازای هر عامل
- [OpenShell](/fa/gateway/openshell) — راه‌اندازی بک‌اند سندباکس مدیریت‌شده، حالت‌های فضای کاری، و مرجع پیکربندی
- [پیکربندی سندباکس](/fa/gateway/config-agents#agentsdefaultssandbox)
- [سندباکس در برابر سیاست ابزار در برابر ارتقایافته](/fa/gateway/sandbox-vs-tool-policy-vs-elevated) — اشکال‌زدایی «چرا این مسدود شده است؟»
- [امنیت](/fa/gateway/security)

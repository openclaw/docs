---
read_when:
    - می‌خواهید `openclaw.ai/install.sh` را درک کنید
    - می‌خواهید نصب‌ها را خودکار کنید (CI / بدون رابط گرافیکی)
    - می‌خواهید از یک نسخهٔ دریافت‌شده از GitHub نصب کنید
summary: نحوهٔ کار اسکریپت‌های نصب (install.sh, install-cli.sh, install.ps1)، پرچم‌ها، و خودکارسازی
title: سازوکارهای داخلی نصب‌کننده
x-i18n:
    generated_at: "2026-05-02T11:51:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 119d94edae8cae2460e1bce9fe6bb31dc3c91d23443090cd34bf10adde9e10f1
    source_path: install/installer.md
    workflow: 16
---

OpenClaw سه اسکریپت نصب ارائه می‌کند که از `openclaw.ai` سرو می‌شوند.

| اسکریپت                            | پلتفرم             | کاری که انجام می‌دهد                                                                                                   |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | در صورت نیاز Node را نصب می‌کند، OpenClaw را از طریق npm (پیش‌فرض) یا git نصب می‌کند، و می‌تواند راه‌اندازی اولیه را اجرا کند.                   |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Node + OpenClaw را در یک پیشوند محلی (`~/.openclaw`) با حالت‌های npm یا git checkout نصب می‌کند. نیازی به دسترسی ریشه نیست. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | در صورت نیاز Node را نصب می‌کند، OpenClaw را از طریق npm (پیش‌فرض) یا git نصب می‌کند، و می‌تواند راه‌اندازی اولیه را اجرا کند.                   |

## فرمان‌های سریع

<Tabs>
  <Tab title="install.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install-cli.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install.ps1">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```

    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag beta -NoOnboard -DryRun
    ```

  </Tab>
</Tabs>

<Note>
اگر نصب موفق شد اما `openclaw` در یک ترمینال جدید پیدا نشد، [عیب‌یابی Node.js](/fa/install/node#troubleshooting) را ببینید.
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
برای بیشتر نصب‌های تعاملی روی macOS/Linux/WSL توصیه می‌شود.
</Tip>

### جریان (install.sh)

<Steps>
  <Step title="تشخیص سیستم‌عامل">
    از macOS و Linux (از جمله WSL) پشتیبانی می‌کند. اگر macOS تشخیص داده شود، در صورت نبود Homebrew آن را نصب می‌کند.
  </Step>
  <Step title="اطمینان از Node.js 24 به‌صورت پیش‌فرض">
    نسخه Node را بررسی می‌کند و در صورت نیاز Node 24 را نصب می‌کند (Homebrew روی macOS، اسکریپت‌های راه‌اندازی NodeSource روی Linux apt/dnf/yum). OpenClaw همچنان برای سازگاری از Node 22 LTS، در حال حاضر `22.14+`، پشتیبانی می‌کند.
  </Step>
  <Step title="اطمینان از وجود Git">
    در صورت نبود Git آن را نصب می‌کند.
  </Step>
  <Step title="نصب OpenClaw">
    - روش `npm` (پیش‌فرض): نصب سراسری npm
    - روش `git`: شبیه‌سازی/به‌روزرسانی مخزن، نصب وابستگی‌ها با pnpm، ساخت، سپس نصب wrapper در `~/.local/bin/openclaw`

  </Step>
  <Step title="کارهای پس از نصب">
    - یک سرویس gateway بارگذاری‌شده را به بهترین شکل ممکن تازه‌سازی می‌کند (`openclaw gateway install --force`، سپس راه‌اندازی مجدد)
    - در ارتقاها و نصب‌های git، `openclaw doctor --non-interactive` را اجرا می‌کند (بهترین تلاش)
    - در صورت مناسب بودن، راه‌اندازی اولیه را تلاش می‌کند (TTY در دسترس باشد، راه‌اندازی اولیه غیرفعال نشده باشد، و بررسی‌های bootstrap/config موفق باشند)
    - مقدار پیش‌فرض `SHARP_IGNORE_GLOBAL_LIBVIPS=1` را تنظیم می‌کند

  </Step>
</Steps>

### تشخیص checkout منبع

اگر داخل یک checkout از OpenClaw اجرا شود (`package.json` + `pnpm-workspace.yaml`)، اسکریپت این گزینه‌ها را پیشنهاد می‌کند:

- استفاده از checkout (`git`)، یا
- استفاده از نصب سراسری (`npm`)

اگر TTY در دسترس نباشد و هیچ روش نصبی تنظیم نشده باشد، به‌صورت پیش‌فرض از `npm` استفاده می‌کند و هشدار می‌دهد.

اسکریپت برای انتخاب روش نامعتبر یا مقدارهای نامعتبر `--install-method` با کد `2` خارج می‌شود.

### نمونه‌ها (install.sh)

<Tabs>
  <Tab title="پیش‌فرض">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="رد کردن راه‌اندازی اولیه">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="نصب Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main از طریق npm">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --version main
    ```
  </Tab>
  <Tab title="اجرای آزمایشی">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="مرجع پرچم‌ها">

| پرچم                                  | توضیح                                                |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | انتخاب روش نصب (پیش‌فرض: `npm`). نام مستعار: `--method`  |
| `--npm`                               | میان‌بر برای روش npm                                    |
| `--git`                               | میان‌بر برای روش git. نام مستعار: `--github`                 |
| `--version <version\|dist-tag\|spec>` | نسخه npm، dist-tag، یا مشخصات بسته (پیش‌فرض: `latest`) |
| `--beta`                              | در صورت وجود از beta dist-tag استفاده می‌کند، وگرنه به `latest` برمی‌گردد  |
| `--git-dir <path>`                    | دایرکتوری checkout (پیش‌فرض: `~/openclaw`). نام مستعار: `--dir` |
| `--no-git-update`                     | برای checkout موجود، `git pull` را رد می‌کند                      |
| `--no-prompt`                         | اعلان‌ها را غیرفعال می‌کند                                            |
| `--no-onboard`                        | راه‌اندازی اولیه را رد می‌کند                                            |
| `--onboard`                           | راه‌اندازی اولیه را فعال می‌کند                                          |
| `--dry-run`                           | کنش‌ها را بدون اعمال تغییرات چاپ می‌کند                     |
| `--verbose`                           | خروجی اشکال‌زدایی را فعال می‌کند (`set -x`، لاگ‌های سطح notice در npm)      |
| `--help`                              | راهنمای استفاده را نشان می‌دهد (`-h`)                                          |

  </Accordion>

  <Accordion title="مرجع متغیرهای محیطی">

| متغیر                                                | توضیح                                   |
| ------------------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | روش نصب                                |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | نسخه npm، dist-tag، یا مشخصات بسته        |
| `OPENCLAW_BETA=0\|1`                                    | استفاده از beta در صورت وجود                         |
| `OPENCLAW_GIT_DIR=<path>`                               | دایرکتوری checkout                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | تغییر وضعیت به‌روزرسانی‌های git                            |
| `OPENCLAW_NO_PROMPT=1`                                  | غیرفعال کردن اعلان‌ها                               |
| `OPENCLAW_NO_ONBOARD=1`                                 | رد کردن راه‌اندازی اولیه                               |
| `OPENCLAW_DRY_RUN=1`                                    | حالت اجرای آزمایشی                                  |
| `OPENCLAW_VERBOSE=1`                                    | حالت اشکال‌زدایی                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | سطح لاگ npm                                 |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | کنترل رفتار sharp/libvips (پیش‌فرض: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
برای محیط‌هایی طراحی شده که می‌خواهید همه‌چیز زیر یک پیشوند محلی
(پیش‌فرض `~/.openclaw`) باشد و وابستگی سیستمی به Node وجود نداشته باشد. به‌صورت پیش‌فرض از نصب‌های npm
پشتیبانی می‌کند، به‌همراه نصب‌های git-checkout در همان جریان پیشوند.
</Info>

### جریان (install-cli.sh)

<Steps>
  <Step title="نصب runtime محلی Node">
    یک آرشیو tarball پین‌شده و پشتیبانی‌شده Node LTS را (نسخه در اسکریپت جاسازی شده و مستقل به‌روزرسانی می‌شود) در `<prefix>/tools/node-v<version>` دانلود می‌کند و SHA-256 را تأیید می‌کند.
  </Step>
  <Step title="اطمینان از وجود Git">
    اگر Git وجود نداشته باشد، تلاش می‌کند آن را از طریق apt/dnf/yum روی Linux یا Homebrew روی macOS نصب کند.
  </Step>
  <Step title="نصب OpenClaw زیر پیشوند">
    - روش `npm` (پیش‌فرض): زیر پیشوند با npm نصب می‌کند، سپس wrapper را در `<prefix>/bin/openclaw` می‌نویسد
    - روش `git`: یک checkout را شبیه‌سازی/به‌روزرسانی می‌کند (پیش‌فرض `~/openclaw`) و همچنان wrapper را در `<prefix>/bin/openclaw` می‌نویسد

  </Step>
  <Step title="تازه‌سازی سرویس gateway بارگذاری‌شده">
    اگر یک سرویس gateway از همان پیشوند از قبل بارگذاری شده باشد، اسکریپت
    `openclaw gateway install --force`، سپس `openclaw gateway restart` را اجرا می‌کند، و
    سلامت gateway را به بهترین شکل ممکن بررسی می‌کند.
  </Step>
</Steps>

### نمونه‌ها (install-cli.sh)

<Tabs>
  <Tab title="پیش‌فرض">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="پیشوند سفارشی + نسخه">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="نصب Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="خروجی JSON برای خودکارسازی">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="اجرای راه‌اندازی اولیه">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="مرجع پرچم‌ها">

| پرچم                        | توضیح                                                                     |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | پیشوند نصب (پیش‌فرض: `~/.openclaw`)                                         |
| `--install-method npm\|git` | انتخاب روش نصب (پیش‌فرض: `npm`). نام مستعار: `--method`                       |
| `--npm`                     | میان‌بر برای روش npm                                                         |
| `--git`, `--github`         | میان‌بر برای روش git                                                         |
| `--git-dir <path>`          | دایرکتوری git checkout (پیش‌فرض: `~/openclaw`). نام مستعار: `--dir`                  |
| `--version <ver>`           | نسخه OpenClaw یا dist-tag (پیش‌فرض: `latest`)                                |
| `--node-version <ver>`      | نسخه Node (پیش‌فرض: `22.22.0`)                                               |
| `--json`                    | رویدادهای NDJSON را منتشر می‌کند                                                              |
| `--onboard`                 | پس از نصب `openclaw onboard` را اجرا می‌کند                                            |
| `--no-onboard`              | راه‌اندازی اولیه را رد می‌کند (پیش‌فرض)                                                       |
| `--set-npm-prefix`          | روی Linux، اگر پیشوند فعلی قابل نوشتن نیست، پیشوند npm را به `~/.npm-global` اجبار می‌کند |
| `--help`                    | راهنمای استفاده را نشان می‌دهد (`-h`)                                                               |

  </Accordion>

  <Accordion title="مرجع متغیرهای محیطی">

| متغیر                                    | توضیح                                   |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | پیشوند نصب                                |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | روش نصب                                |
| `OPENCLAW_VERSION=<ver>`                    | نسخه OpenClaw یا dist-tag                  |
| `OPENCLAW_NODE_VERSION=<ver>`               | نسخه Node                                  |
| `OPENCLAW_GIT_DIR=<path>`                   | دایرکتوری checkout Git برای نصب‌های git       |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | روشن/خاموش کردن به‌روزرسانی‌های git برای checkoutهای موجود     |
| `OPENCLAW_NO_ONBOARD=1`                     | رد کردن راه‌اندازی اولیه                               |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | سطح گزارش npm                                 |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | کنترل رفتار sharp/libvips (پیش‌فرض: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### جریان (install.ps1)

<Steps>
  <Step title="اطمینان از محیط PowerShell + Windows">
    به PowerShell 5+ نیاز دارد.
  </Step>
  <Step title="اطمینان از Node.js 24 به‌صورت پیش‌فرض">
    اگر موجود نباشد، نصب از طریق winget، سپس Chocolatey، و سپس Scoop را امتحان می‌کند. Node 22 LTS، در حال حاضر `22.14+`، برای سازگاری همچنان پشتیبانی می‌شود.
  </Step>
  <Step title="نصب OpenClaw">
    - روش `npm` (پیش‌فرض): نصب سراسری npm با استفاده از `-Tag` انتخاب‌شده، اجراشده از یک دایرکتوری موقت نصب‌کننده که قابل نوشتن است تا پوسته‌هایی که در پوشه‌های محافظت‌شده مانند `C:\` باز شده‌اند همچنان کار کنند
    - روش `git`: clone/update مخزن، نصب/ساخت با pnpm، و نصب wrapper در `%USERPROFILE%\.local\bin\openclaw.cmd`

  </Step>
  <Step title="کارهای پس از نصب">
    - در صورت امکان، دایرکتوری bin لازم را به PATH کاربر اضافه می‌کند
    - یک سرویس Gateway بارگذاری‌شده را به‌صورت best-effort تازه‌سازی می‌کند (`openclaw gateway install --force`، سپس راه‌اندازی مجدد)
    - هنگام ارتقاها و نصب‌های git، `openclaw doctor --non-interactive` را اجرا می‌کند (best effort)

  </Step>
  <Step title="مدیریت شکست‌ها">
    نصب‌های `iwr ... | iex` و scriptblock یک خطای terminating گزارش می‌کنند بدون اینکه جلسه PowerShell فعلی بسته شود. نصب‌های مستقیم `powershell -File` / `pwsh -File` همچنان برای automation با کد غیرصفر خارج می‌شوند.
  </Step>
</Steps>

### نمونه‌ها (install.ps1)

<Tabs>
  <Tab title="پیش‌فرض">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="نصب Git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="شاخه main در GitHub از طریق npm">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
    ```
  </Tab>
  <Tab title="دایرکتوری git سفارشی">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="اجرای آزمایشی">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="ردیابی اشکال‌زدایی">
    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="مرجع flagها">

| Flag                        | توضیح                                                |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | روش نصب (پیش‌فرض: `npm`)                            |
| `-Tag <tag\|version\|spec>` | dist-tag، نسخه، یا package spec برای npm (پیش‌فرض: `latest`) |
| `-GitDir <path>`            | دایرکتوری checkout (پیش‌فرض: `%USERPROFILE%\openclaw`)     |
| `-NoOnboard`                | رد کردن راه‌اندازی اولیه                                            |
| `-NoGitUpdate`              | رد کردن `git pull`                                            |
| `-DryRun`                   | فقط چاپ کارها                                         |

  </Accordion>

  <Accordion title="مرجع متغیرهای محیطی">

| متغیر                           | توضیح        |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | روش نصب     |
| `OPENCLAW_GIT_DIR=<path>`          | دایرکتوری checkout |
| `OPENCLAW_NO_ONBOARD=1`            | رد کردن راه‌اندازی اولیه    |
| `OPENCLAW_GIT_UPDATE=0`            | غیرفعال کردن git pull   |
| `OPENCLAW_DRY_RUN=1`               | حالت اجرای آزمایشی       |

  </Accordion>
</AccordionGroup>

<Note>
اگر `-InstallMethod git` استفاده شود و Git موجود نباشد، اسکریپت خارج می‌شود و لینک Git for Windows را چاپ می‌کند.
</Note>

---

## CI و automation

برای اجراهای قابل پیش‌بینی از flagها/env vars غیرتعاملی استفاده کنید.

<Tabs>
  <Tab title="install.sh (npm غیرتعاملی)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (git غیرتعاملی)">
    ```bash
    OPENCLAW_INSTALL_METHOD=git OPENCLAW_NO_PROMPT=1 \
      curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="install-cli.sh (JSON)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="install.ps1 (رد کردن راه‌اندازی اولیه)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## عیب‌یابی

<AccordionGroup>
  <Accordion title="چرا Git لازم است؟">
    Git برای روش نصب `git` لازم است. برای نصب‌های `npm` نیز Git همچنان بررسی/نصب می‌شود تا وقتی وابستگی‌ها از URLهای git استفاده می‌کنند، از شکست‌های `spawn git ENOENT` جلوگیری شود.
  </Accordion>

  <Accordion title="چرا npm در Linux با EACCES روبه‌رو می‌شود؟">
    بعضی تنظیمات Linux پیشوند سراسری npm را به مسیرهای متعلق به root اشاره می‌دهند. `install.sh` می‌تواند پیشوند را به `~/.npm-global` تغییر دهد و exportهای PATH را به فایل‌های rc پوسته اضافه کند (وقتی آن فایل‌ها وجود داشته باشند).
  </Accordion>

  <Accordion title="مشکلات sharp/libvips">
    اسکریپت‌ها به‌صورت پیش‌فرض `SHARP_IGNORE_GLOBAL_LIBVIPS=1` را تنظیم می‌کنند تا sharp در برابر libvips سیستمی ساخته نشود. برای override کردن:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Git for Windows را نصب کنید، PowerShell را دوباره باز کنید، و نصب‌کننده را دوباره اجرا کنید.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    `npm config get prefix` را اجرا کنید و آن دایرکتوری را به PATH کاربر خود اضافه کنید (در Windows پسوند `\bin` لازم نیست)، سپس PowerShell را دوباره باز کنید.
  </Accordion>

  <Accordion title="Windows: چگونه خروجی پرجزئیات نصب‌کننده را بگیرید">
    `install.ps1` در حال حاضر switch به نام `-Verbose` ارائه نمی‌کند.
    برای diagnostics در سطح اسکریپت از ردیابی PowerShell استفاده کنید:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw پس از نصب پیدا نشد">
    معمولاً مشکل PATH است. [عیب‌یابی Node.js](/fa/install/node#troubleshooting) را ببینید.
  </Accordion>
</AccordionGroup>

## مرتبط

- [نمای کلی نصب](/fa/install)
- [به‌روزرسانی](/fa/install/updating)
- [حذف نصب](/fa/install/uninstall)

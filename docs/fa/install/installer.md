---
read_when:
    - می‌خواهید `openclaw.ai/install.sh` را درک کنید
    - می‌خواهید نصب‌ها را خودکار کنید (CI / بدون رابط کاربری)
    - می‌خواهید از یک نسخهٔ کاری GitHub نصب کنید
summary: نحوهٔ کار اسکریپت‌های نصب‌کننده (install.sh، install-cli.sh، install.ps1)، پرچم‌ها و خودکارسازی
title: جزئیات داخلی نصب‌کننده
x-i18n:
    generated_at: "2026-05-07T13:25:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: a62720526e2a5ffc94555f77e7e806d63768b849a9491b60f6fdc9cf070eed2f
    source_path: install/installer.md
    workflow: 16
---

OpenClaw سه اسکریپت نصب را ارائه می‌کند که از `openclaw.ai` سرو می‌شوند.

| اسکریپت                            | پلتفرم              | کاری که انجام می‌دهد                                                                                                  |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | در صورت نیاز Node را نصب می‌کند، OpenClaw را از طریق npm (پیش‌فرض) یا git نصب می‌کند، و می‌تواند onboarding را اجرا کند.                   |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Node + OpenClaw را با حالت‌های npm یا git checkout در یک پیشوند محلی (`~/.openclaw`) نصب می‌کند. به دسترسی root نیاز ندارد. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | در صورت نیاز Node را نصب می‌کند، OpenClaw را از طریق npm (پیش‌فرض) یا git نصب می‌کند، و می‌تواند onboarding را اجرا کند.                   |

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
  <Step title="Detect OS">
    از macOS و Linux (از جمله WSL) پشتیبانی می‌کند. اگر macOS شناسایی شود، در صورت نبود Homebrew آن را نصب می‌کند.
  </Step>
  <Step title="Ensure Node.js 24 by default">
    نسخه Node را بررسی می‌کند و در صورت نیاز Node 24 را نصب می‌کند (Homebrew روی macOS، اسکریپت‌های راه‌اندازی NodeSource روی Linux apt/dnf/yum). OpenClaw همچنان برای سازگاری از Node 22 LTS، در حال حاضر `22.16+`، پشتیبانی می‌کند.
  </Step>
  <Step title="Ensure Git">
    در صورت نبود Git آن را نصب می‌کند.
  </Step>
  <Step title="Install OpenClaw">
    - روش `npm` (پیش‌فرض): نصب سراسری npm
    - روش `git`: clone/update مخزن، نصب وابستگی‌ها با pnpm، build، سپس نصب wrapper در `~/.local/bin/openclaw`

  </Step>
  <Step title="Post-install tasks">
    - یک سرویس gateway بارگذاری‌شده را به‌صورت best-effort تازه‌سازی می‌کند (`openclaw gateway install --force`، سپس restart)
    - در upgradeها و نصب‌های git، `openclaw doctor --non-interactive` را اجرا می‌کند (best effort)
    - وقتی مناسب باشد onboarding را تلاش می‌کند (TTY در دسترس باشد، onboarding غیرفعال نشده باشد، و بررسی‌های bootstrap/config موفق باشند)
    - مقدار پیش‌فرض `SHARP_IGNORE_GLOBAL_LIBVIPS=1` را تنظیم می‌کند

  </Step>
</Steps>

### شناسایی checkout منبع

اگر داخل یک checkout از OpenClaw اجرا شود (`package.json` + `pnpm-workspace.yaml`)، اسکریپت این گزینه‌ها را پیشنهاد می‌دهد:

- استفاده از checkout (`git`)، یا
- استفاده از نصب سراسری (`npm`)

اگر TTY در دسترس نباشد و هیچ روش نصبی تنظیم نشده باشد، به‌طور پیش‌فرض از `npm` استفاده می‌کند و هشدار می‌دهد.

اسکریپت برای انتخاب روش نامعتبر یا مقادیر نامعتبر `--install-method` با کد `2` خارج می‌شود.

### مثال‌ها (install.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Skip onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main via npm">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --version main
    ```
  </Tab>
  <Tab title="Dry run">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| پرچم                                  | توضیح                                                |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | انتخاب روش نصب (پیش‌فرض: `npm`). نام مستعار: `--method`  |
| `--npm`                               | میان‌بر برای روش npm                                    |
| `--git`                               | میان‌بر برای روش git. نام مستعار: `--github`                 |
| `--version <version\|dist-tag\|spec>` | نسخه npm، dist-tag، یا package spec (پیش‌فرض: `latest`) |
| `--beta`                              | اگر beta dist-tag در دسترس باشد از آن استفاده می‌کند، در غیر این صورت به `latest` برمی‌گردد  |
| `--git-dir <path>`                    | دایرکتوری checkout (پیش‌فرض: `~/openclaw`). نام مستعار: `--dir` |
| `--no-git-update`                     | از `git pull` برای checkout موجود صرف‌نظر می‌کند                      |
| `--no-prompt`                         | promptها را غیرفعال می‌کند                                            |
| `--no-onboard`                        | از onboarding صرف‌نظر می‌کند                                            |
| `--onboard`                           | onboarding را فعال می‌کند                                          |
| `--dry-run`                           | اقدام‌ها را بدون اعمال تغییرات چاپ می‌کند                     |
| `--verbose`                           | خروجی debug را فعال می‌کند (`set -x`، لاگ‌های سطح notice در npm)      |
| `--help`                              | نحوه استفاده را نشان می‌دهد (`-h`)                                          |

  </Accordion>

  <Accordion title="Environment variables reference">

| متغیر                                                | توضیح                                   |
| ------------------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | روش نصب                                |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | نسخه npm، dist-tag، یا package spec        |
| `OPENCLAW_BETA=0\|1`                                    | در صورت در دسترس بودن از beta استفاده می‌کند                         |
| `OPENCLAW_GIT_DIR=<path>`                               | دایرکتوری checkout                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | به‌روزرسانی‌های git را تغییر وضعیت می‌دهد                            |
| `OPENCLAW_NO_PROMPT=1`                                  | promptها را غیرفعال می‌کند                               |
| `OPENCLAW_NO_ONBOARD=1`                                 | از onboarding صرف‌نظر می‌کند                               |
| `OPENCLAW_DRY_RUN=1`                                    | حالت dry run                                  |
| `OPENCLAW_VERBOSE=1`                                    | حالت debug                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | سطح لاگ npm                                 |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | رفتار sharp/libvips را کنترل می‌کند (پیش‌فرض: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
برای محیط‌هایی طراحی شده است که می‌خواهید همه‌چیز زیر یک پیشوند محلی
(پیش‌فرض `~/.openclaw`) باشد و به وابستگی Node سیستمی نیاز نداشته باشید. به‌طور پیش‌فرض از نصب‌های npm پشتیبانی می‌کند،
به‌علاوه نصب‌های git-checkout را نیز زیر همان جریان پیشوند پشتیبانی می‌کند.
</Info>

### جریان (install-cli.sh)

<Steps>
  <Step title="Install local Node runtime">
    یک tarball پین‌شده و پشتیبانی‌شده Node LTS را (نسخه در اسکریپت جاسازی شده و مستقل به‌روزرسانی می‌شود) در `<prefix>/tools/node-v<version>` دانلود می‌کند و SHA-256 را تأیید می‌کند.
  </Step>
  <Step title="Ensure Git">
    اگر Git موجود نباشد، تلاش می‌کند آن را از طریق apt/dnf/yum روی Linux یا Homebrew روی macOS نصب کند.
  </Step>
  <Step title="Install OpenClaw under prefix">
    - روش `npm` (پیش‌فرض): زیر پیشوند با npm نصب می‌کند، سپس wrapper را در `<prefix>/bin/openclaw` می‌نویسد
    - روش `git`: یک checkout را clone/update می‌کند (پیش‌فرض `~/openclaw`) و همچنان wrapper را در `<prefix>/bin/openclaw` می‌نویسد

  </Step>
  <Step title="Refresh loaded gateway service">
    اگر یک سرویس gateway از همان پیشوند قبلاً بارگذاری شده باشد، اسکریپت
    `openclaw gateway install --force`، سپس `openclaw gateway restart` را اجرا می‌کند، و
    سلامت gateway را به‌صورت best-effort بررسی می‌کند.
  </Step>
</Steps>

### مثال‌ها (install-cli.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Custom prefix + version">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Git install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Automation JSON output">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Run onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| پرچم                        | توضیح                                                                     |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | پیشوند نصب (پیش‌فرض: `~/.openclaw`)                                         |
| `--install-method npm\|git` | انتخاب روش نصب (پیش‌فرض: `npm`). نام مستعار: `--method`                       |
| `--npm`                     | میان‌بر برای روش npm                                                         |
| `--git`, `--github`         | میان‌بر برای روش git                                                         |
| `--git-dir <path>`          | دایرکتوری git checkout (پیش‌فرض: `~/openclaw`). نام مستعار: `--dir`                  |
| `--version <ver>`           | نسخه OpenClaw یا dist-tag (پیش‌فرض: `latest`)                                |
| `--node-version <ver>`      | نسخه Node (پیش‌فرض: `22.22.0`)                                               |
| `--json`                    | رویدادهای NDJSON منتشر می‌کند                                                              |
| `--onboard`                 | پس از نصب `openclaw onboard` را اجرا می‌کند                                            |
| `--no-onboard`              | از onboarding صرف‌نظر می‌کند (پیش‌فرض)                                                       |
| `--set-npm-prefix`          | روی Linux، اگر پیشوند فعلی قابل نوشتن نباشد، پیشوند npm را به `~/.npm-global` اجبار می‌کند |
| `--help`                    | نحوه استفاده را نشان می‌دهد (`-h`)                                                               |

  </Accordion>

  <Accordion title="Environment variables reference">

| متغیر                                    | توضیح                                   |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | پیشوند نصب                                |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | روش نصب                                |
| `OPENCLAW_VERSION=<ver>`                    | نسخه OpenClaw یا برچسب توزیع                  |
| `OPENCLAW_NODE_VERSION=<ver>`               | نسخه Node                                  |
| `OPENCLAW_GIT_DIR=<path>`                   | دایرکتوری checkout مربوط به Git برای نصب‌های git       |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | تغییر وضعیت به‌روزرسانی‌های git برای checkoutهای موجود     |
| `OPENCLAW_NO_ONBOARD=1`                     | رد کردن راه‌اندازی اولیه                               |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | سطح لاگ npm                                 |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | کنترل رفتار sharp/libvips (پیش‌فرض: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### جریان (install.ps1)

<Steps>
  <Step title="Ensure PowerShell + Windows environment">
    به PowerShell 5+ نیاز دارد.
  </Step>
  <Step title="Ensure Node.js 24 by default">
    اگر موجود نباشد، تلاش می‌کند آن را ابتدا از طریق winget، سپس Chocolatey و بعد Scoop نصب کند. Node 22 LTS که در حال حاضر `22.16+` است، همچنان برای سازگاری پشتیبانی می‌شود.
  </Step>
  <Step title="Install OpenClaw">
    - روش `npm` (پیش‌فرض): نصب سراسری npm با استفاده از `-Tag` انتخاب‌شده، از یک دایرکتوری موقت قابل‌نوشتن نصب‌کننده اجرا می‌شود تا shellهایی که در پوشه‌های محافظت‌شده مانند `C:\` باز شده‌اند همچنان کار کنند
    - روش `git`: clone/update کردن repo، نصب/ساخت با pnpm، و نصب wrapper در `%USERPROFILE%\.local\bin\openclaw.cmd`

  </Step>
  <Step title="Post-install tasks">
    - در صورت امکان، دایرکتوری bin لازم را به PATH کاربر اضافه می‌کند
    - سرویس Gateway بارگذاری‌شده را به‌صورت best-effort تازه‌سازی می‌کند (`openclaw gateway install --force`، سپس restart)
    - در upgradeها و نصب‌های git، `openclaw doctor --non-interactive` را اجرا می‌کند (best effort)

  </Step>
  <Step title="Handle failures">
    نصب‌های `iwr ... | iex` و scriptblock یک خطای خاتمه‌دهنده گزارش می‌کنند، بدون اینکه نشست فعلی PowerShell را ببندند. نصب‌های مستقیم `powershell -File` / `pwsh -File` همچنان برای خودکارسازی با کد غیرصفر خارج می‌شوند.
  </Step>
</Steps>

### نمونه‌ها (install.ps1)

<Tabs>
  <Tab title="Default">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Git install">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="GitHub main via npm">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
    ```
  </Tab>
  <Tab title="Custom git directory">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Dry run">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="Debug trace">
    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| پرچم                        | توضیح                                                |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | روش نصب (پیش‌فرض: `npm`)                            |
| `-Tag <tag\|version\|spec>` | برچسب توزیع npm، نسخه، یا مشخصات بسته (پیش‌فرض: `latest`) |
| `-GitDir <path>`            | دایرکتوری checkout (پیش‌فرض: `%USERPROFILE%\openclaw`)     |
| `-NoOnboard`                | رد کردن راه‌اندازی اولیه                                            |
| `-NoGitUpdate`              | رد کردن `git pull`                                            |
| `-DryRun`                   | فقط چاپ کنش‌ها                                         |

  </Accordion>

  <Accordion title="Environment variables reference">

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

## CI و خودکارسازی

برای اجراهای قابل‌پیش‌بینی از پرچم‌ها/متغیرهای محیطی غیرتعاملی استفاده کنید.

<Tabs>
  <Tab title="install.sh (non-interactive npm)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (non-interactive git)">
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
  <Tab title="install.ps1 (skip onboarding)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## عیب‌یابی

<AccordionGroup>
  <Accordion title="Why is Git required?">
    Git برای روش نصب `git` لازم است. برای نصب‌های `npm` نیز Git همچنان بررسی/نصب می‌شود تا وقتی وابستگی‌ها از URLهای git استفاده می‌کنند، از خطاهای `spawn git ENOENT` جلوگیری شود.
  </Accordion>

  <Accordion title="Why does npm hit EACCES on Linux?">
    برخی تنظیمات Linux پیشوند سراسری npm را به مسیرهای متعلق به root اشاره می‌دهند. `install.sh` می‌تواند پیشوند را به `~/.npm-global` تغییر دهد و exportهای PATH را به فایل‌های rc مربوط به shell اضافه کند (وقتی آن فایل‌ها وجود داشته باشند).
  </Accordion>

  <Accordion title="sharp/libvips issues">
    اسکریپت‌ها به‌صورت پیش‌فرض `SHARP_IGNORE_GLOBAL_LIBVIPS=1` را تنظیم می‌کنند تا از build شدن sharp در برابر libvips سیستم جلوگیری شود. برای override کردن:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Git for Windows را نصب کنید، PowerShell را دوباره باز کنید، نصب‌کننده را دوباره اجرا کنید.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    `npm config get prefix` را اجرا کنید و آن دایرکتوری را به PATH کاربر خود اضافه کنید (در Windows پسوند `\bin` لازم نیست)، سپس PowerShell را دوباره باز کنید.
  </Accordion>

  <Accordion title="Windows: how to get verbose installer output">
    `install.ps1` در حال حاضر switch مربوط به `-Verbose` را ارائه نمی‌کند.
    برای تشخیص‌های سطح اسکریپت از tracing در PowerShell استفاده کنید:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw not found after install">
    معمولاً مشکل PATH است. [عیب‌یابی Node.js](/fa/install/node#troubleshooting) را ببینید.
  </Accordion>
</AccordionGroup>

## مرتبط

- [نمای کلی نصب](/fa/install)
- [به‌روزرسانی](/fa/install/updating)
- [حذف نصب](/fa/install/uninstall)

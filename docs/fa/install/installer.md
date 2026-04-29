---
read_when:
    - می‌خواهید `openclaw.ai/install.sh` را درک کنید
    - می‌خواهید نصب‌ها را خودکار کنید (CI / بدون رابط گرافیکی)
    - می‌خواهید از یک نسخهٔ دریافت‌شده از GitHub نصب کنید
summary: نحوهٔ کار اسکریپت‌های نصب‌کننده (install.sh, install-cli.sh, install.ps1)، فلگ‌ها، و خودکارسازی
title: جزئیات داخلی نصب‌کننده
x-i18n:
    generated_at: "2026-04-29T23:05:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 278e8d6a1a39651812b7f0955965c53c62afd3ad673b357484f8aecbcfbbdb1d
    source_path: install/installer.md
    workflow: 16
---

OpenClaw سه اسکریپت نصب ارائه می‌کند که از `openclaw.ai` سرو می‌شوند.

| اسکریپت                            | پلتفرم              | کاری که انجام می‌دهد                                                                                                   |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | در صورت نیاز Node را نصب می‌کند، OpenClaw را از طریق npm (پیش‌فرض) یا git نصب می‌کند، و می‌تواند راه‌اندازی اولیه را اجرا کند.                   |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Node + OpenClaw را در یک پیشوند محلی (`~/.openclaw`) با حالت‌های npm یا checkout از git نصب می‌کند. به root نیاز ندارد. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | در صورت نیاز Node را نصب می‌کند، OpenClaw را از طریق npm (پیش‌فرض) یا git نصب می‌کند، و می‌تواند راه‌اندازی اولیه را اجرا کند.                   |

## دستورهای سریع

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
اگر نصب موفق شد اما `openclaw` در ترمینال جدید پیدا نشد، [عیب‌یابی Node.js](/fa/install/node#troubleshooting) را ببینید.
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
برای بیشتر نصب‌های تعاملی روی macOS/Linux/WSL توصیه می‌شود.
</Tip>

### روند (install.sh)

<Steps>
  <Step title="تشخیص سیستم‌عامل">
    از macOS و Linux (از جمله WSL) پشتیبانی می‌کند. اگر macOS تشخیص داده شود، در صورت نبود Homebrew آن را نصب می‌کند.
  </Step>
  <Step title="اطمینان از وجود Node.js 24 به‌صورت پیش‌فرض">
    نسخه Node را بررسی می‌کند و در صورت نیاز Node 24 را نصب می‌کند (Homebrew روی macOS، اسکریپت‌های راه‌اندازی NodeSource روی Linux apt/dnf/yum). OpenClaw همچنان برای سازگاری از Node 22 LTS، در حال حاضر `22.14+`، پشتیبانی می‌کند.
  </Step>
  <Step title="اطمینان از وجود Git">
    اگر Git موجود نباشد، آن را نصب می‌کند.
  </Step>
  <Step title="نصب OpenClaw">
    - روش `npm` (پیش‌فرض): نصب سراسری npm
    - روش `git`: clone/update کردن repo، نصب وابستگی‌ها با pnpm، build، سپس نصب wrapper در `~/.local/bin/openclaw`

  </Step>
  <Step title="کارهای پس از نصب">
    - یک سرویس gateway بارگذاری‌شده را به‌صورت بهترین تلاش refresh می‌کند (`openclaw gateway install --force`، سپس restart)
    - در upgradeها و نصب‌های git، `openclaw doctor --non-interactive` را اجرا می‌کند (بهترین تلاش)
    - در صورت مناسب بودن تلاش می‌کند onboarding را انجام دهد (TTY در دسترس باشد، onboarding غیرفعال نشده باشد، و بررسی‌های bootstrap/config موفق باشند)
    - مقدار پیش‌فرض `SHARP_IGNORE_GLOBAL_LIBVIPS=1` را تنظیم می‌کند

  </Step>
</Steps>

### تشخیص checkout منبع

اگر داخل یک checkout از OpenClaw اجرا شود (`package.json` + `pnpm-workspace.yaml`)، اسکریپت پیشنهاد می‌دهد:

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
  <Tab title="رد کردن onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="نصب Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="main گیت‌هاب از طریق npm">
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
  <Accordion title="مرجع flagها">

| Flag                                  | توضیح                                                |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | انتخاب روش نصب (پیش‌فرض: `npm`). نام مستعار: `--method`  |
| `--npm`                               | میان‌بر برای روش npm                                    |
| `--git`                               | میان‌بر برای روش git. نام مستعار: `--github`                 |
| `--version <version\|dist-tag\|spec>` | نسخه npm، dist-tag، یا مشخصات package (پیش‌فرض: `latest`) |
| `--beta`                              | استفاده از beta dist-tag در صورت وجود، وگرنه fallback به `latest`  |
| `--git-dir <path>`                    | دایرکتوری checkout (پیش‌فرض: `~/openclaw`). نام مستعار: `--dir` |
| `--no-git-update`                     | رد کردن `git pull` برای checkout موجود                      |
| `--no-prompt`                         | غیرفعال کردن promptها                                            |
| `--no-onboard`                        | رد کردن onboarding                                            |
| `--onboard`                           | فعال کردن onboarding                                          |
| `--dry-run`                           | چاپ actionها بدون اعمال تغییرات                     |
| `--verbose`                           | فعال کردن خروجی debug (`set -x`، لاگ‌های سطح notice در npm)      |
| `--help`                              | نمایش روش استفاده (`-h`)                                          |

  </Accordion>

  <Accordion title="مرجع متغیرهای محیطی">

| متغیر                                                | توضیح                                   |
| ------------------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | روش نصب                                |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | نسخه npm، dist-tag، یا مشخصات package        |
| `OPENCLAW_BETA=0\|1`                                    | استفاده از beta در صورت وجود                         |
| `OPENCLAW_GIT_DIR=<path>`                               | دایرکتوری checkout                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | تغییر وضعیت updateهای git                            |
| `OPENCLAW_NO_PROMPT=1`                                  | غیرفعال کردن promptها                               |
| `OPENCLAW_NO_ONBOARD=1`                                 | رد کردن onboarding                               |
| `OPENCLAW_DRY_RUN=1`                                    | حالت اجرای آزمایشی                                  |
| `OPENCLAW_VERBOSE=1`                                    | حالت debug                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | سطح لاگ npm                                 |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | کنترل رفتار sharp/libvips (پیش‌فرض: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
برای محیط‌هایی طراحی شده که می‌خواهید همه‌چیز زیر یک پیشوند محلی
(پیش‌فرض `~/.openclaw`) باشد و وابستگی سیستمی Node نداشته باشید. به‌صورت پیش‌فرض از نصب‌های npm پشتیبانی می‌کند،
به‌علاوه نصب‌های checkout از git زیر همان روند پیشوند.
</Info>

### روند (install-cli.sh)

<Steps>
  <Step title="نصب runtime محلی Node">
    یک tarball پین‌شده و پشتیبانی‌شده Node LTS را (نسخه در اسکریپت گنجانده شده و مستقل به‌روزرسانی می‌شود) در `<prefix>/tools/node-v<version>` دانلود می‌کند و SHA-256 را بررسی می‌کند.
  </Step>
  <Step title="اطمینان از وجود Git">
    اگر Git موجود نباشد، تلاش می‌کند آن را از طریق apt/dnf/yum روی Linux یا Homebrew روی macOS نصب کند.
  </Step>
  <Step title="نصب OpenClaw زیر پیشوند">
    - روش `npm` (پیش‌فرض): زیر پیشوند با npm نصب می‌کند، سپس wrapper را در `<prefix>/bin/openclaw` می‌نویسد
    - روش `git`: یک checkout را clone/update می‌کند (پیش‌فرض `~/openclaw`) و همچنان wrapper را در `<prefix>/bin/openclaw` می‌نویسد

  </Step>
  <Step title="Refresh کردن سرویس gateway بارگذاری‌شده">
    اگر یک سرویس gateway از همان پیشوند قبلاً بارگذاری شده باشد، اسکریپت
    `openclaw gateway install --force`، سپس `openclaw gateway restart` را اجرا می‌کند، و
    سلامت gateway را به‌صورت بهترین تلاش probe می‌کند.
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
  <Tab title="خروجی JSON برای automation">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="اجرای onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="مرجع flagها">

| Flag                        | توضیح                                                                     |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | پیشوند نصب (پیش‌فرض: `~/.openclaw`)                                         |
| `--install-method npm\|git` | انتخاب روش نصب (پیش‌فرض: `npm`). نام مستعار: `--method`                       |
| `--npm`                     | میان‌بر برای روش npm                                                         |
| `--git`, `--github`         | میان‌بر برای روش git                                                         |
| `--git-dir <path>`          | دایرکتوری checkout از Git (پیش‌فرض: `~/openclaw`). نام مستعار: `--dir`                  |
| `--version <ver>`           | نسخه OpenClaw یا dist-tag (پیش‌فرض: `latest`)                                |
| `--node-version <ver>`      | نسخه Node (پیش‌فرض: `22.22.0`)                                               |
| `--json`                    | انتشار رویدادهای NDJSON                                                              |
| `--onboard`                 | اجرای `openclaw onboard` پس از نصب                                            |
| `--no-onboard`              | رد کردن onboarding (پیش‌فرض)                                                       |
| `--set-npm-prefix`          | روی Linux، اگر پیشوند فعلی قابل نوشتن نباشد، پیشوند npm را به‌اجبار روی `~/.npm-global` تنظیم می‌کند |
| `--help`                    | نمایش روش استفاده (`-h`)                                                               |

  </Accordion>

  <Accordion title="مرجع متغیرهای محیطی">

| متغیر                                      | توضیح                                       |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | پیشوند نصب                                  |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | روش نصب                                     |
| `OPENCLAW_VERSION=<ver>`                    | نسخه OpenClaw یا dist-tag                   |
| `OPENCLAW_NODE_VERSION=<ver>`               | نسخه Node                                   |
| `OPENCLAW_GIT_DIR=<path>`                   | پوشه checkout گیت برای نصب‌های گیت          |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | فعال یا غیرفعال کردن به‌روزرسانی‌های گیت برای checkoutهای موجود |
| `OPENCLAW_NO_ONBOARD=1`                     | رد کردن راه‌اندازی اولیه                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | سطح گزارش npm                               |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | کنترل رفتار sharp/libvips (پیش‌فرض: `1`)    |

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
    اگر موجود نباشد، نصب از طریق winget، سپس Chocolatey، سپس Scoop را امتحان می‌کند. Node 22 LTS، در حال حاضر `22.14+`، همچنان برای سازگاری پشتیبانی می‌شود.
  </Step>
  <Step title="نصب OpenClaw">
    - روش `npm` (پیش‌فرض): نصب سراسری npm با استفاده از `-Tag` انتخاب‌شده
    - روش `git`: clone/update مخزن، نصب/ساخت با pnpm، و نصب wrapper در `%USERPROFILE%\.local\bin\openclaw.cmd`

  </Step>
  <Step title="کارهای پس از نصب">
    - در صورت امکان، پوشه bin لازم را به PATH کاربر اضافه می‌کند
    - یک سرویس Gateway بارگذاری‌شده را با بهترین تلاش تازه‌سازی می‌کند (`openclaw gateway install --force`، سپس restart)
    - در ارتقاها و نصب‌های گیت، `openclaw doctor --non-interactive` را اجرا می‌کند (با بهترین تلاش)

  </Step>
  <Step title="مدیریت خطاها">
    نصب‌های `iwr ... | iex` و scriptblock بدون بستن نشست PowerShell فعلی، یک خطای خاتمه‌دهنده گزارش می‌کنند. نصب‌های مستقیم `powershell -File` / `pwsh -File` همچنان برای اتوماسیون با کد غیرصفر خارج می‌شوند.
  </Step>
</Steps>

### نمونه‌ها (install.ps1)

<Tabs>
  <Tab title="پیش‌فرض">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="نصب گیت">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="شاخه main گیت‌هاب از طریق npm">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
    ```
  </Tab>
  <Tab title="پوشه سفارشی گیت">
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

| Flag                        | توضیح                                                      |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | روش نصب (پیش‌فرض: `npm`)                                  |
| `-Tag <tag\|version\|spec>` | dist-tag، نسخه، یا spec بسته npm (پیش‌فرض: `latest`)      |
| `-GitDir <path>`            | پوشه checkout (پیش‌فرض: `%USERPROFILE%\openclaw`)          |
| `-NoOnboard`                | رد کردن راه‌اندازی اولیه                                  |
| `-NoGitUpdate`              | رد کردن `git pull`                                        |
| `-DryRun`                   | فقط چاپ کنش‌ها                                            |

  </Accordion>

  <Accordion title="مرجع متغیرهای محیطی">

| متغیر                              | توضیح                    |
| ---------------------------------- | ------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | روش نصب                 |
| `OPENCLAW_GIT_DIR=<path>`          | پوشه checkout           |
| `OPENCLAW_NO_ONBOARD=1`            | رد کردن راه‌اندازی اولیه |
| `OPENCLAW_GIT_UPDATE=0`            | غیرفعال کردن git pull   |
| `OPENCLAW_DRY_RUN=1`               | حالت اجرای آزمایشی      |

  </Accordion>
</AccordionGroup>

<Note>
اگر `-InstallMethod git` استفاده شود و Git موجود نباشد، اسکریپت خارج می‌شود و لینک Git for Windows را چاپ می‌کند.
</Note>

---

## CI و اتوماسیون

برای اجراهای قابل پیش‌بینی، از flagها/متغیرهای محیطی غیرتعاملی استفاده کنید.

<Tabs>
  <Tab title="install.sh (npm غیرتعاملی)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (گیت غیرتعاملی)">
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
    Git برای روش نصب `git` لازم است. برای نصب‌های `npm`، Git همچنان بررسی/نصب می‌شود تا وقتی وابستگی‌ها از URLهای گیت استفاده می‌کنند، از خطاهای `spawn git ENOENT` جلوگیری شود.
  </Accordion>

  <Accordion title="چرا npm در Linux با EACCES مواجه می‌شود؟">
    برخی تنظیمات Linux پیشوند سراسری npm را به مسیرهای متعلق به root اشاره می‌دهند. `install.sh` می‌تواند پیشوند را به `~/.npm-global` تغییر دهد و exportهای PATH را به فایل‌های rc پوسته اضافه کند (وقتی آن فایل‌ها وجود داشته باشند).
  </Accordion>

  <Accordion title="مشکلات sharp/libvips">
    اسکریپت‌ها به‌صورت پیش‌فرض `SHARP_IGNORE_GLOBAL_LIBVIPS=1` را تنظیم می‌کنند تا از ساخت sharp بر اساس libvips سیستم جلوگیری شود. برای بازنویسی:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Git for Windows را نصب کنید، PowerShell را دوباره باز کنید، نصب‌کننده را دوباره اجرا کنید.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    `npm config get prefix` را اجرا کنید و آن پوشه را به PATH کاربر خود اضافه کنید (در Windows پسوند `\bin` لازم نیست)، سپس PowerShell را دوباره باز کنید.
  </Accordion>

  <Accordion title="Windows: چگونه خروجی پرجزئیات نصب‌کننده را دریافت کنیم">
    `install.ps1` در حال حاضر سوییچ `-Verbose` ارائه نمی‌کند.
    برای عیب‌یابی در سطح اسکریپت، از ردیابی PowerShell استفاده کنید:

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

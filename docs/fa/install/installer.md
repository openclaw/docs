---
read_when:
    - می‌خواهید `openclaw.ai/install.sh` را درک کنید
    - می‌خواهید نصب‌ها را خودکار کنید (CI / بدون رابط کاربری)
    - می‌خواهید از یک checkout گیت‌هاب نصب کنید
summary: نحوهٔ کار اسکریپت‌های نصب (install.sh، install-cli.sh، install.ps1)، فلگ‌ها و خودکارسازی
title: جزئیات داخلی نصب‌کننده
x-i18n:
    generated_at: "2026-06-27T17:59:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72182472f423e64b33afa071feda76c2c9abdf896bffa269f2148124c49a451c
    source_path: install/installer.md
    workflow: 16
---

OpenClaw سه اسکریپت نصب را ارائه می‌کند که از `openclaw.ai` سرو می‌شوند.

| اسکریپت                           | پلتفرم              | کاری که انجام می‌دهد                                                                                                      |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | در صورت نیاز Node را نصب می‌کند، OpenClaw را از طریق npm (پیش‌فرض) یا git نصب می‌کند، و می‌تواند راه‌اندازی اولیه را اجرا کند. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Node و OpenClaw را با حالت‌های npm یا git checkout در یک پیشوند محلی (`~/.openclaw`) نصب می‌کند. دسترسی root لازم نیست. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | در صورت نیاز Node را نصب می‌کند، OpenClaw را از طریق npm (پیش‌فرض) یا git نصب می‌کند، و می‌تواند راه‌اندازی اولیه را اجرا کند. |

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
    از macOS و Linux (از جمله WSL) پشتیبانی می‌کند.
  </Step>
  <Step title="اطمینان از Node.js 24 به‌صورت پیش‌فرض">
    نسخه Node را بررسی می‌کند و در صورت نیاز Node 24 را نصب می‌کند (Homebrew روی macOS، اسکریپت‌های راه‌اندازی NodeSource روی Linux apt/dnf/yum). روی macOS، Homebrew فقط زمانی نصب می‌شود که نصب‌کننده برای Node یا Git به آن نیاز داشته باشد. OpenClaw همچنان برای سازگاری از Node 22 LTS، در حال حاضر `22.19+`، پشتیبانی می‌کند.
    روی Alpine/musl Linux، نصب‌کننده به‌جای NodeSource از بسته‌های apk استفاده می‌کند؛ مخازن پیکربندی‌شده Alpine باید Node `22.19+` را فراهم کنند (در زمان نگارش، Alpine 3.21 یا جدیدتر).
  </Step>
  <Step title="اطمینان از Git">
    اگر Git موجود نباشد، آن را با مدیر بسته تشخیص‌داده‌شده نصب می‌کند، از جمله Homebrew روی macOS و apk روی Alpine.
  </Step>
  <Step title="نصب OpenClaw">
    - روش `npm` (پیش‌فرض): نصب سراسری npm
    - روش `git`: clone/update کردن repo، نصب وابستگی‌ها با pnpm، build، سپس نصب wrapper در `~/.local/bin/openclaw`

  </Step>
  <Step title="کارهای پس از نصب">
    - یک سرویس Gateway بارگذاری‌شده را به‌صورت best-effort تازه‌سازی می‌کند (`openclaw gateway install --force`، سپس restart)
    - در ارتقاها و نصب‌های git، `openclaw doctor --non-interactive` را اجرا می‌کند (best effort)
    - در صورت مناسب بودن، راه‌اندازی اولیه را امتحان می‌کند (TTY در دسترس باشد، راه‌اندازی اولیه غیرفعال نشده باشد، و بررسی‌های bootstrap/config موفق باشند)

  </Step>
</Steps>

### تشخیص checkout منبع

اگر داخل یک checkout از OpenClaw اجرا شود (`package.json` + `pnpm-workspace.yaml`)، اسکریپت این گزینه‌ها را پیشنهاد می‌دهد:

- استفاده از checkout (`git`)، یا
- استفاده از نصب سراسری (`npm`)

اگر TTY در دسترس نباشد و هیچ روش نصبی تنظیم نشده باشد، پیش‌فرض را `npm` قرار می‌دهد و هشدار می‌دهد.

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
  <Tab title="Checkout شاخه main در GitHub">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
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

| Flag                                  | توضیح                                                      |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | انتخاب روش نصب (پیش‌فرض: `npm`). نام مستعار: `--method`  |
| `--npm`                               | میانبر برای روش npm                                       |
| `--git`                               | میانبر برای روش git. نام مستعار: `--github`              |
| `--version <version\|dist-tag\|spec>` | نسخه npm، dist-tag، یا مشخصات بسته (پیش‌فرض: `latest`)   |
| `--beta`                              | استفاده از beta dist-tag اگر موجود باشد، وگرنه بازگشت به `latest` |
| `--git-dir <path>`                    | دایرکتوری checkout (پیش‌فرض: `~/openclaw`). نام مستعار: `--dir` |
| `--no-git-update`                     | رد کردن `git pull` برای checkout موجود                    |
| `--no-prompt`                         | غیرفعال کردن promptها                                    |
| `--no-onboard`                        | رد کردن راه‌اندازی اولیه                                  |
| `--onboard`                           | فعال کردن راه‌اندازی اولیه                                |
| `--dry-run`                           | چاپ کارها بدون اعمال تغییرات                              |
| `--verbose`                           | فعال کردن خروجی اشکال‌زدایی (`set -x`، لاگ‌های npm در سطح notice) |
| `--help`                              | نمایش شیوه استفاده (`-h`)                                 |

  </Accordion>

  <Accordion title="مرجع متغیرهای محیطی">

| متغیر                                            | توضیح                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | روش نصب                                                            |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | نسخه npm، dist-tag، یا مشخصات بسته                                 |
| `OPENCLAW_BETA=0\|1`                              | استفاده از beta اگر موجود باشد                                     |
| `OPENCLAW_HOME=<path>`                            | دایرکتوری پایه برای وضعیت OpenClaw و مسیرهای پیش‌فرض git/onboarding |
| `OPENCLAW_GIT_DIR=<path>`                         | دایرکتوری checkout                                                  |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | تغییر وضعیت به‌روزرسانی‌های git                                    |
| `OPENCLAW_NO_PROMPT=1`                            | غیرفعال کردن promptها                                              |
| `OPENCLAW_NO_ONBOARD=1`                           | رد کردن راه‌اندازی اولیه                                            |
| `OPENCLAW_DRY_RUN=1`                              | حالت اجرای آزمایشی                                                  |
| `OPENCLAW_VERBOSE=1`                              | حالت اشکال‌زدایی                                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | سطح لاگ npm                                                         |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
برای محیط‌هایی طراحی شده است که می‌خواهید همه‌چیز زیر یک پیشوند محلی
(پیش‌فرض `~/.openclaw`) باشد و وابستگی سیستمی به Node وجود نداشته باشد. به‌صورت پیش‌فرض از نصب‌های npm
پشتیبانی می‌کند، و نصب‌های git-checkout را نیز زیر همان جریان پیشوند ارائه می‌دهد.
</Info>

### جریان (install-cli.sh)

<Steps>
  <Step title="نصب runtime محلی Node">
    یک tarball پین‌شده و پشتیبانی‌شده Node LTS را (نسخه درون اسکریپت جاسازی شده و مستقل به‌روزرسانی می‌شود) در `<prefix>/tools/node-v<version>` دانلود می‌کند و SHA-256 را بررسی می‌کند.
    روی Alpine/musl Linux، جایی که Node برای runtime پین‌شده tarballهای سازگار منتشر نمی‌کند، `nodejs` و `npm` را با `apk` نصب می‌کند و آن runtime را به مسیر wrapper پیشوند لینک می‌کند. مخازن Alpine باید Node `22.19+` را فراهم کنند؛ اگر مخازن قدیمی‌تر فقط Node 20 یا 21 را ارائه می‌دهند، از Alpine 3.21 یا جدیدتر استفاده کنید.
  </Step>
  <Step title="اطمینان از Git">
    اگر Git موجود نباشد، نصب از طریق apt/dnf/yum/apk روی Linux یا Homebrew روی macOS را امتحان می‌کند.
  </Step>
  <Step title="نصب OpenClaw زیر پیشوند">
    - روش `npm` (پیش‌فرض): زیر پیشوند با npm نصب می‌کند، سپس wrapper را در `<prefix>/bin/openclaw` می‌نویسد
    - روش `git`: یک checkout را clone/update می‌کند (پیش‌فرض `~/openclaw`) و همچنان wrapper را در `<prefix>/bin/openclaw` می‌نویسد

  </Step>
  <Step title="تازه‌سازی سرویس Gateway بارگذاری‌شده">
    اگر یک سرویس Gateway از همان پیشوند از قبل بارگذاری شده باشد، اسکریپت
    `openclaw gateway install --force`، سپس `openclaw gateway restart` را اجرا می‌کند، و
    سلامت Gateway را به‌صورت best-effort بررسی می‌کند.
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
  <Tab title="اجرای راه‌اندازی اولیه">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="مرجع flagها">

| گزینه                       | توضیح                                                                          |
| --------------------------- | ------------------------------------------------------------------------------ |
| `--prefix <path>`           | پیشوند نصب (پیش‌فرض: `~/.openclaw`)                                            |
| `--install-method npm\|git` | روش نصب را انتخاب کنید (پیش‌فرض: `npm`). نام مستعار: `--method`                |
| `--npm`                     | میان‌بر برای روش npm                                                           |
| `--git`, `--github`         | میان‌بر برای روش git                                                           |
| `--git-dir <path>`          | دایرکتوری checkout گیت (پیش‌فرض: `~/openclaw`). نام مستعار: `--dir`            |
| `--version <ver>`           | نسخه OpenClaw یا برچسب توزیع (پیش‌فرض: `latest`)                               |
| `--node-version <ver>`      | نسخه Node (پیش‌فرض: `22.22.0`)                                                 |
| `--json`                    | رویدادهای NDJSON را منتشر کنید                                                 |
| `--onboard`                 | پس از نصب، `openclaw onboard` را اجرا کنید                                      |
| `--no-onboard`              | راه‌اندازی اولیه را رد کنید (پیش‌فرض)                                          |
| `--set-npm-prefix`          | در لینوکس، اگر پیشوند فعلی قابل نوشتن نیست، پیشوند npm را به `~/.npm-global` اجبار کنید |
| `--help`                    | نمایش روش استفاده (`-h`)                                                       |

  </Accordion>

  <Accordion title="Environment variables reference">

| متغیر                                       | توضیح                                                            |
| ------------------------------------------- | ---------------------------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | پیشوند نصب                                                       |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | روش نصب                                                          |
| `OPENCLAW_VERSION=<ver>`                    | نسخه OpenClaw یا برچسب توزیع                                     |
| `OPENCLAW_NODE_VERSION=<ver>`               | نسخه Node                                                        |
| `OPENCLAW_HOME=<path>`                      | دایرکتوری پایه برای وضعیت OpenClaw و مسیرهای پیش‌فرض git/راه‌اندازی اولیه |
| `OPENCLAW_GIT_DIR=<path>`                   | دایرکتوری checkout گیت برای نصب‌های git                          |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | روشن/خاموش کردن به‌روزرسانی‌های git برای checkoutهای موجود       |
| `OPENCLAW_NO_ONBOARD=1`                     | رد کردن راه‌اندازی اولیه                                         |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | سطح لاگ npm                                                       |

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
    اگر موجود نباشد، ابتدا نصب از طریق winget، سپس Chocolatey و سپس Scoop را امتحان می‌کند. اگر هیچ مدیر بسته‌ای در دسترس نباشد، اسکریپت فایل zip رسمی Node.js برای Windows را در `%LOCALAPPDATA%\OpenClaw\deps\portable-node` دانلود می‌کند و آن را به PATH فرایند فعلی و کاربر اضافه می‌کند. Node 22 LTS، در حال حاضر `22.19+`، همچنان برای سازگاری پشتیبانی می‌شود.
  </Step>
  <Step title="Install OpenClaw">
    - روش `npm` (پیش‌فرض): نصب سراسری npm با استفاده از `-Tag` انتخاب‌شده، اجراشده از یک دایرکتوری موقت نصب‌کننده قابل نوشتن تا پوسته‌هایی که در پوشه‌های محافظت‌شده مانند `C:\` باز شده‌اند همچنان کار کنند
    - روش `git`: clone/update مخزن، install/build با pnpm، و نصب wrapper در `%USERPROFILE%\.local\bin\openclaw.cmd`. اگر Git موجود نباشد، اسکریپت MinGit محلی کاربر را زیر `%LOCALAPPDATA%\OpenClaw\deps\portable-git` راه‌اندازی می‌کند و آن را به PATH فرایند فعلی و کاربر اضافه می‌کند.

  </Step>
  <Step title="Post-install tasks">
    - در صورت امکان، دایرکتوری bin موردنیاز را به PATH کاربر اضافه می‌کند
    - سرویس gateway بارگذاری‌شده را به‌صورت بهترین تلاش تازه‌سازی می‌کند (`openclaw gateway install --force`، سپس راه‌اندازی مجدد)
    - در ارتقاها و نصب‌های git، `openclaw doctor --non-interactive` را اجرا می‌کند (بهترین تلاش)

  </Step>
  <Step title="Handle failures">
    نصب‌های `iwr ... | iex` و scriptblock بدون بستن نشست فعلی PowerShell یک خطای خاتمه‌دهنده گزارش می‌کنند. نصب‌های مستقیم `powershell -File` / `pwsh -File` همچنان برای اتوماسیون با کد غیرصفر خارج می‌شوند.
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
  <Tab title="GitHub main checkout">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
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

| گزینه                       | توضیح                                                     |
| --------------------------- | --------------------------------------------------------- |
| `-InstallMethod npm\|git`   | روش نصب (پیش‌فرض: `npm`)                                  |
| `-Tag <tag\|version\|spec>` | برچسب توزیع npm، نسخه، یا مشخصات بسته (پیش‌فرض: `latest`) |
| `-GitDir <path>`            | دایرکتوری checkout (پیش‌فرض: `%USERPROFILE%\openclaw`)    |
| `-NoOnboard`                | رد کردن راه‌اندازی اولیه                                  |
| `-NoGitUpdate`              | رد کردن `git pull`                                        |
| `-DryRun`                   | فقط چاپ اقدامات                                           |

  </Accordion>

  <Accordion title="Environment variables reference">

| متغیر                              | توضیح                    |
| ---------------------------------- | ------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | روش نصب                  |
| `OPENCLAW_GIT_DIR=<path>`          | دایرکتوری checkout       |
| `OPENCLAW_NO_ONBOARD=1`            | رد کردن راه‌اندازی اولیه |
| `OPENCLAW_GIT_UPDATE=0`            | غیرفعال کردن git pull    |
| `OPENCLAW_DRY_RUN=1`               | حالت اجرای آزمایشی       |

  </Accordion>
</AccordionGroup>

<Note>
اگر `-InstallMethod git` استفاده شود و Git موجود نباشد، اسکریپت پیش از چاپ لینک Git for Windows، راه‌اندازی MinGit محلی کاربر را امتحان می‌کند.
</Note>

---

## CI و اتوماسیون

برای اجراهای قابل پیش‌بینی، از گزینه‌ها/متغیرهای محیطی غیرتعاملی استفاده کنید.

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
    Git برای روش نصب `git` لازم است. برای نصب‌های `npm`، همچنان Git بررسی/نصب می‌شود تا وقتی وابستگی‌ها از URLهای git استفاده می‌کنند، از خطاهای `spawn git ENOENT` جلوگیری شود.
  </Accordion>

  <Accordion title="Why does npm hit EACCES on Linux?">
    بعضی تنظیمات لینوکس پیشوند سراسری npm را به مسیرهای متعلق به root اشاره می‌دهند. `install.sh` می‌تواند پیشوند را به `~/.npm-global` تغییر دهد و exportهای PATH را به فایل‌های rc پوسته اضافه کند (وقتی آن فایل‌ها وجود داشته باشند).
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    نصب‌کننده را دوباره اجرا کنید تا بتواند MinGit محلی کاربر را راه‌اندازی کند، یا Git for Windows را نصب کنید و PowerShell را دوباره باز کنید.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    `npm config get prefix` را اجرا کنید و آن دایرکتوری را به PATH کاربر خود اضافه کنید (در Windows پسوند `\bin` لازم نیست)، سپس PowerShell را دوباره باز کنید.
  </Accordion>

  <Accordion title="Windows: how to get verbose installer output">
    `install.ps1` در حال حاضر سوئیچ `-Verbose` ارائه نمی‌کند.
    برای عیب‌یابی در سطح اسکریپت، از tracing در PowerShell استفاده کنید:

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

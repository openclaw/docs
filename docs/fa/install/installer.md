---
read_when:
    - می‌خواهید `openclaw.ai/install.sh` را درک کنید
    - می‌خواهید نصب‌ها را خودکار کنید (CI / بدون رابط گرافیکی)
    - می‌خواهید از یک نسخهٔ دریافت‌شده از GitHub نصب کنید
summary: نحوهٔ کار اسکریپت‌های نصب (install.sh، install-cli.sh، install.ps1)، پرچم‌ها و خودکارسازی
title: جزئیات داخلی نصب‌کننده
x-i18n:
    generated_at: "2026-07-12T10:16:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 59b38a2eecbf15cc966beada81acf1824229a3825c73ae33ea0f8e89612bdf5b
    source_path: install/installer.md
    workflow: 16
---

OpenClaw سه اسکریپت نصب ارائه می‌کند که از `openclaw.ai` عرضه می‌شوند.

| اسکریپت                             | پلتفرم             | کاری که انجام می‌دهد                                                                                   |
| ---------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | در صورت نیاز Node را نصب می‌کند، OpenClaw را از طریق npm (پیش‌فرض) یا git نصب می‌کند و می‌تواند فرایند راه‌اندازی اولیه را اجرا کند.       |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Node و OpenClaw را از طریق npm یا git در یک پیشوند محلی (`~/.openclaw`) نصب می‌کند. به دسترسی root نیاز ندارد. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | در صورت نیاز Node را نصب می‌کند، OpenClaw را از طریق npm (پیش‌فرض) یا git نصب می‌کند و می‌تواند فرایند راه‌اندازی اولیه را اجرا کند.       |

هر سه از Node **22.19+، 23.11+ یا 24+** پشتیبانی می‌کنند؛ Node 24 هدف پیش‌فرض برای نصب‌های جدید است.

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
اگر نصب موفق بود اما `openclaw` در ترمینال جدید پیدا نشد، به [عیب‌یابی Node.js](/fa/install/node#troubleshooting) مراجعه کنید.
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
برای بیشتر نصب‌های تعاملی در macOS/Linux/WSL توصیه می‌شود.
</Tip>

### روند (install.sh)

<Steps>
  <Step title="تشخیص سیستم‌عامل">
    از macOS و Linux (از جمله WSL) پشتیبانی می‌کند.
  </Step>
  <Step title="اطمینان از وجود Node.js 24 به‌صورت پیش‌فرض">
    نسخه Node را بررسی می‌کند و در صورت نیاز Node 24 را نصب می‌کند (Homebrew در macOS و اسکریپت‌های راه‌اندازی NodeSource در apt/dnf/yum لینوکس). در macOS، تنها زمانی Homebrew نصب می‌شود که نصب‌کننده برای Node یا Git به آن نیاز داشته باشد. Node 22.19+ و 23.11+ برای سازگاری همچنان پشتیبانی می‌شوند.
    در Alpine/musl Linux، نصب‌کننده به‌جای NodeSource از بسته‌های apk استفاده می‌کند؛ مخازن پیکربندی‌شده Alpine باید نسخه‌ای پشتیبانی‌شده از Node را ارائه کنند (در زمان نگارش، Alpine 3.21 یا جدیدتر).
  </Step>
  <Step title="اطمینان از وجود Git">
    اگر Git موجود نباشد، آن را با مدیر بسته شناسایی‌شده نصب می‌کند؛ از جمله Homebrew در macOS و apk در Alpine.
  </Step>
  <Step title="نصب OpenClaw">
    - روش `npm` (پیش‌فرض): نصب سراسری با npm
    - روش `git`: همسانه‌سازی/به‌روزرسانی مخزن، نصب وابستگی‌ها با pnpm، ساخت و سپس نصب پوشاننده در `~/.local/bin/openclaw`

  </Step>
  <Step title="کارهای پس از نصب">
    - فایل اجرایی تازه‌نصب‌شده `openclaw` را برای فرمان‌های بعدی پیدا می‌کند
    - برای نصب پیکربندی‌نشده، راه‌اندازی اولیه را پیش از بررسی‌های doctor یا Gateway آغاز می‌کند. با `--no-onboard` یا در نبود TTY، فرمان تکمیل راه‌اندازی در زمان بعد را نمایش می‌دهد.
    - برای نصب پیکربندی‌شده، در حد امکان سرویس Gateway بارگذاری‌شده را تازه‌سازی و راه‌اندازی مجدد می‌کند و doctor را اجرا می‌کند. ارتقاها در صورت امکان Pluginها را به‌روزرسانی می‌کنند، یا در اجرای بدون رابط با اعلان‌های فعال، فرمان دستی را نمایش می‌دهند.
    - هنگام اجرای `--verify`، نسخه نصب‌شده را بررسی می‌کند و تنها پس از وجود پیکربندی، سلامت Gateway را بررسی می‌کند.

  </Step>
</Steps>

### تشخیص نسخه کاری کد منبع

اگر اسکریپت درون یک نسخه کاری OpenClaw (`package.json` + `pnpm-workspace.yaml`) اجرا شود، این گزینه‌ها را پیشنهاد می‌دهد:

- استفاده از نسخه کاری (`git`)، یا
- استفاده از نصب سراسری (`npm`)

اگر TTY در دسترس نباشد و هیچ روش نصبی تعیین نشده باشد، به‌صورت پیش‌فرض از `npm` استفاده می‌کند و هشدار می‌دهد.

اسکریپت برای انتخاب روش نامعتبر یا مقادیر نامعتبر `--install-method` با کد `2` خارج می‌شود.

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
  <Tab title="نصب با Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="نسخه کاری شاخه اصلی GitHub">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="اجرای آزمایشی">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
  <Tab title="اعتبارسنجی پس از نصب">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard --verify
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="مرجع پرچم‌ها">

| پرچم                                    | توضیحات                                                             |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `--install-method \| --method npm\|git` | انتخاب روش نصب (پیش‌فرض: `npm`)                                  |
| `--npm`                                 | میان‌بر روش npm                                                 |
| `--git \| --github`                     | میان‌بر روش git                                                 |
| `--version <version\|dist-tag\|spec>`   | نسخه npm، برچسب توزیع یا مشخصات بسته (پیش‌فرض: `latest`)              |
| `--beta`                                | استفاده از برچسب توزیع beta در صورت موجود بودن؛ در غیر این صورت بازگشت به `latest`              |
| `--git-dir \| --dir <path>`             | پوشه نسخه کاری (پیش‌فرض: `~/openclaw`)                              |
| `--no-git-update`                       | رد کردن `git pull` برای نسخه کاری موجود                                   |
| `--no-prompt`                           | غیرفعال کردن اعلان‌ها                                                         |
| `--no-onboard`                          | رد کردن راه‌اندازی اولیه                                                         |
| `--onboard`                             | فعال کردن راه‌اندازی اولیه                                                       |
| `--verify`                              | اجرای اعتبارسنجی سریع پس از نصب (`--version` و سلامت Gateway در صورت بارگذاری بودن) |
| `--dry-run`                             | نمایش عملیات بدون اعمال تغییرات                                  |
| `--verbose`                             | فعال کردن خروجی اشکال‌زدایی (`set -x` و گزارش‌های سطح notice در npm)                   |
| `--help \| -h`                          | نمایش نحوه استفاده                                                              |

  </Accordion>

  <Accordion title="مرجع متغیرهای محیطی">

| متغیر                                          | توضیحات                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | روش نصب                                                     |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | نسخه npm، برچسب توزیع یا مشخصات بسته                             |
| `OPENCLAW_BETA=0\|1`                              | استفاده از beta در صورت موجود بودن                                              |
| `OPENCLAW_HOME=<path>`                            | پوشه پایه برای وضعیت OpenClaw و مسیرهای پیش‌فرض git/راه‌اندازی اولیه |
| `OPENCLAW_GIT_DIR=<path>`                         | پوشه نسخه کاری                                                 |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | فعال یا غیرفعال کردن به‌روزرسانی‌های git                                                 |
| `OPENCLAW_NO_PROMPT=1`                            | غیرفعال کردن اعلان‌ها                                                    |
| `OPENCLAW_VERIFY_INSTALL=1`                       | اجرای اعتبارسنجی سریع پس از نصب                                  |
| `OPENCLAW_NO_ONBOARD=1`                           | رد کردن راه‌اندازی اولیه                                                    |
| `OPENCLAW_DRY_RUN=1`                              | حالت اجرای آزمایشی                                                       |
| `OPENCLAW_VERBOSE=1`                              | حالت اشکال‌زدایی                                                         |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | سطح گزارش npm (پیش‌فرض: `error`، پیام‌های منسوخ‌شدن npm را پنهان می‌کند)      |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
برای محیط‌هایی طراحی شده است که می‌خواهید همه‌چیز زیر یک پیشوند محلی
(پیش‌فرض `~/.openclaw`) قرار گیرد و وابستگی به Node سیستمی وجود نداشته باشد. به‌صورت پیش‌فرض از نصب‌های npm
و همچنین نصب از نسخه کاری git در همان روند پیشوند پشتیبانی می‌کند.
</Info>

### روند (install-cli.sh)

<Steps>
  <Step title="نصب زمان اجرای محلی Node">
    یک فایل tarball ثابت از نسخه پشتیبانی‌شده Node LTS را (نسخه در اسکریپت تعبیه شده و مستقل به‌روزرسانی می‌شود؛ پیش‌فرض `22.22.2`) در `<prefix>/tools/node-v<version>` بارگیری و SHA-256 آن را اعتبارسنجی می‌کند.
    در Alpine/musl Linux، که Node برای زمان اجرای ثابت‌شده فایل‌های tarball سازگار منتشر نمی‌کند، `nodejs` و `npm` را با `apk` نصب می‌کند و آن زمان اجرا را به مسیر پوشاننده پیشوند پیوند می‌دهد. مخازن Alpine باید نسخه‌ای پشتیبانی‌شده از Node (22.19+، 23.11+ یا 24+) را ارائه کنند؛ اگر مخازن قدیمی‌تر فقط Node 20 یا 21 را ارائه می‌کنند، از Alpine 3.21 یا جدیدتر استفاده کنید.
  </Step>
  <Step title="اطمینان از وجود Git">
    اگر Git موجود نباشد، تلاش می‌کند آن را در Linux از طریق apt/dnf/yum/apk یا در macOS از طریق Homebrew نصب کند.
  </Step>
  <Step title="نصب OpenClaw زیر پیشوند">
    - روش `npm` (پیش‌فرض): با npm زیر پیشوند نصب می‌کند، سپس پوشاننده را در `<prefix>/bin/openclaw` می‌نویسد
    - روش `git`: یک نسخه کاری را همسانه‌سازی/به‌روزرسانی می‌کند (پیش‌فرض `~/openclaw`) و همچنان پوشاننده را در `<prefix>/bin/openclaw` می‌نویسد

  </Step>
  <Step title="تازه‌سازی سرویس Gateway بارگذاری‌شده">
    اگر یک سرویس Gateway از همان پیشوند از قبل بارگذاری شده باشد، اسکریپت
    `openclaw gateway install --force` و سپس `openclaw gateway restart` را اجرا می‌کند و
    در حد امکان سلامت Gateway را بررسی می‌کند.
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
  <Tab title="نصب با Git">
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

| پرچم                                   | توضیحات                                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------- |
| `--prefix <path>`                       | پیشوند نصب (پیش‌فرض: `~/.openclaw`)                                                         |
| `--install-method \| --method npm\|git` | انتخاب روش نصب (پیش‌فرض: `npm`)                                                             |
| `--npm`                                 | میان‌بر روش npm                                                                             |
| `--git \| --github`                     | میان‌بر روش git                                                                             |
| `--git-dir \| --dir <path>`             | پوشهٔ وارسی Git (پیش‌فرض: `~/openclaw`)                                                     |
| `--version <ver>`                       | نسخه یا برچسب توزیع OpenClaw (پیش‌فرض: `latest`)                                            |
| `--node-version <ver>`                  | نسخهٔ Node (پیش‌فرض: `22.22.2`)                                                             |
| `--json`                                | انتشار رویدادهای NDJSON                                                                     |
| `--onboard`                             | اجرای `openclaw onboard` پس از نصب                                                          |
| `--no-onboard`                          | رد کردن راه‌اندازی اولیه (پیش‌فرض)                                                          |
| `--set-npm-prefix`                      | در Linux، اگر پیشوند فعلی قابل نوشتن نیست، پیشوند npm را به `~/.npm-global` اجبار می‌کند |
| `--help \| -h`                          | نمایش نحوهٔ استفاده                                                                         |

  </Accordion>

  <Accordion title="مرجع متغیرهای محیطی">

| متغیر                                      | توضیحات                                                                      |
| ------------------------------------------- | ---------------------------------------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | پیشوند نصب                                                                   |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | روش نصب                                                                      |
| `OPENCLAW_VERSION=<ver>`                    | نسخه یا برچسب توزیع OpenClaw                                                 |
| `OPENCLAW_NODE_VERSION=<ver>`               | نسخهٔ Node                                                                   |
| `OPENCLAW_HOME=<path>`                      | پوشهٔ پایه برای وضعیت OpenClaw و مسیرهای پیش‌فرض git و راه‌اندازی اولیه    |
| `OPENCLAW_GIT_DIR=<path>`                   | پوشهٔ وارسی Git برای نصب‌های git                                             |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | فعال یا غیرفعال کردن به‌روزرسانی git برای وارسی‌های موجود                   |
| `OPENCLAW_NO_ONBOARD=1`                     | رد کردن راه‌اندازی اولیه                                                     |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | سطح گزارش npm (پیش‌فرض: `error`)                                             |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` و دیگر مشخصات منبع GitHub، اهداف معتبری برای `--version` در نصب‌های npm نیستند. به‌جای آن از `--install-method git --version main` استفاده کنید.
</Note>

---

<a id="installps1"></a>

## install.ps1

### روند (install.ps1)

<Steps>
  <Step title="اطمینان از محیط PowerShell و Windows">
    به PowerShell 5 یا جدیدتر نیاز دارد.
  </Step>
  <Step title="اطمینان از وجود Node.js 24 به‌صورت پیش‌فرض">
    اگر موجود نباشد، ابتدا نصب از طریق winget، سپس Chocolatey و بعد Scoop را امتحان می‌کند. اگر هیچ مدیر بسته‌ای در دسترس نباشد، اسکریپت فایل zip رسمی Node.js 24 برای Windows را در `%LOCALAPPDATA%\OpenClaw\deps\portable-node` بارگیری می‌کند و آن را به PATH فرایند فعلی و کاربر می‌افزاید. Node 22.19+ و 23.11+ همچنان برای سازگاری پشتیبانی می‌شوند.
  </Step>
  <Step title="نصب OpenClaw">
    - روش `npm` (پیش‌فرض): نصب سراسری npm با استفاده از `-Tag` انتخاب‌شده که از یک پوشهٔ موقت و قابل نوشتنِ نصب‌کننده اجرا می‌شود تا پوسته‌هایی که در پوشه‌های محافظت‌شده‌ای مانند `C:\` باز شده‌اند نیز همچنان کار کنند
    - روش `git`: شبیه‌سازی یا به‌روزرسانی مخزن، نصب و ساخت با pnpm، و نصب پوشش فرمان در `%USERPROFILE%\.local\bin\openclaw.cmd`. اگر Git موجود نباشد، اسکریپت MinGit محلیِ کاربر را در `%LOCALAPPDATA%\OpenClaw\deps\portable-git` راه‌اندازی می‌کند و آن را به PATH فرایند فعلی و کاربر می‌افزاید.

  </Step>
  <Step title="کارهای پس از نصب">
    - در صورت امکان، پوشهٔ اجرایی موردنیاز را به PATH کاربر می‌افزاید
    - سرویس Gateway بارگذاری‌شده را به‌صورت بهترین تلاش تازه‌سازی می‌کند (ابتدا `openclaw gateway install --force` و سپس راه‌اندازی مجدد)
    - در ارتقاها و نصب‌های git، دستور `openclaw doctor --non-interactive` را اجرا می‌کند (به‌صورت بهترین تلاش)

  </Step>
  <Step title="مدیریت خطاها">
    نصب‌های `iwr ... | iex` و scriptblock بدون بستن نشست فعلی PowerShell، یک خطای خاتمه‌دهنده گزارش می‌کنند. نصب‌های مستقیم `powershell -File` / `pwsh -File` همچنان برای خودکارسازی با کد غیرصفر خارج می‌شوند.
  </Step>
</Steps>

### نمونه‌ها (install.ps1)

<Tabs>
  <Tab title="پیش‌فرض">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="نصب با Git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="وارسی شاخهٔ اصلی GitHub">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
    ```
  </Tab>
  <Tab title="پوشهٔ سفارشی git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="اجرای آزمایشی">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="مرجع پرچم‌ها">

| پرچم                       | توضیحات                                                               |
| --------------------------- | --------------------------------------------------------------------- |
| `-InstallMethod npm\|git`   | روش نصب (پیش‌فرض: `npm`)                                              |
| `-Tag <tag\|version\|spec>` | برچسب توزیع، نسخه یا مشخصات بستهٔ npm (پیش‌فرض: `latest`)             |
| `-GitDir <path>`            | پوشهٔ وارسی (پیش‌فرض: `%USERPROFILE%\openclaw`)                       |
| `-NoOnboard`                | رد کردن راه‌اندازی اولیه                                              |
| `-NoGitUpdate`              | رد کردن `git pull`                                                     |
| `-DryRun`                   | فقط چاپ عملیات                                                         |

  </Accordion>

  <Accordion title="مرجع متغیرهای محیطی">

| متغیر                             | توضیحات                         |
| --------------------------------- | ------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | روش نصب                         |
| `OPENCLAW_GIT_DIR=<path>`          | پوشهٔ وارسی                     |
| `OPENCLAW_NO_ONBOARD=1`            | رد کردن راه‌اندازی اولیه        |
| `OPENCLAW_GIT_UPDATE=0`            | غیرفعال کردن git pull           |
| `OPENCLAW_DRY_RUN=1`               | حالت اجرای آزمایشی              |

  </Accordion>
</AccordionGroup>

<Note>
اگر از `-InstallMethod git` استفاده شود و Git موجود نباشد، اسکریپت پیش از نمایش پیوند Git for Windows، راه‌اندازی MinGit محلیِ کاربر را امتحان می‌کند.
</Note>

---

## CI و خودکارسازی

برای اجراهای قابل پیش‌بینی، از پرچم‌ها و متغیرهای محیطی غیرتعاملی استفاده کنید.

<Tabs>
  <Tab title="install.sh (نصب غیرتعاملی npm)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (نصب غیرتعاملی git)">
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
    Git برای روش نصب `git` لازم است. در نصب‌های `npm` نیز Git بررسی یا نصب می‌شود تا وقتی وابستگی‌ها از نشانی‌های git استفاده می‌کنند، از خطاهای `spawn git ENOENT` جلوگیری شود.
  </Accordion>

  <Accordion title="چرا npm در Linux با EACCES مواجه می‌شود؟">
    برخی پیکربندی‌های Linux، پیشوند سراسری npm را به مسیرهای متعلق به کاربر root هدایت می‌کنند. `install.sh` می‌تواند پیشوند را به `~/.npm-global` تغییر دهد و اعلان‌های PATH را به فایل‌های rc پوسته اضافه کند (در صورت وجود آن فایل‌ها).
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    نصب‌کننده را دوباره اجرا کنید تا بتواند MinGit محلیِ کاربر را راه‌اندازی کند، یا Git for Windows را نصب کرده و PowerShell را دوباره باز کنید.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    دستور `npm config get prefix` را اجرا کنید و آن پوشه را به PATH کاربر خود بیفزایید (در Windows به پسوند `\bin` نیازی نیست)، سپس PowerShell را دوباره باز کنید.
  </Accordion>

  <Accordion title="Windows: چگونه خروجی تفصیلی نصب‌کننده را دریافت کنیم">
    `install.ps1` گزینهٔ `-Verbose` را ارائه نمی‌کند.
    برای تشخیص در سطح اسکریپت، از ردیابی PowerShell استفاده کنید:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw پس از نصب یافت نمی‌شود">
    معمولاً مشکل از PATH است. به [عیب‌یابی Node.js](/fa/install/node#troubleshooting) مراجعه کنید.
  </Accordion>
</AccordionGroup>

## مطالب مرتبط

- [نمای کلی نصب](/fa/install)
- [به‌روزرسانی](/fa/install/updating)
- [حذف نصب](/fa/install/uninstall)

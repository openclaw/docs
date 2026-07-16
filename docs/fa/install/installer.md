---
read_when:
    - می‌خواهید `openclaw.ai/install.sh` را درک کنید
    - می‌خواهید نصب‌ها را خودکار کنید (CI / بدون رابط گرافیکی)
    - می‌خواهید از یک نسخهٔ دریافت‌شده از GitHub نصب کنید
summary: نحوهٔ کار اسکریپت‌های نصب (install.sh، install-cli.sh، install.ps1)، پرچم‌ها و خودکارسازی
title: جزئیات داخلی نصب‌کننده
x-i18n:
    generated_at: "2026-07-16T16:36:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7878f10903893b4e1902bbc79991f43edaa436bd802d5fecde41421e3e05bc2b
    source_path: install/installer.md
    workflow: 16
---

OpenClaw با سه اسکریپت نصب عرضه می‌شود که از `openclaw.ai` ارائه می‌شوند.

| اسکریپت                             | پلتفرم             | کاری که انجام می‌دهد                                                                                   |
| ---------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | در صورت نیاز Node را نصب می‌کند، OpenClaw را از طریق npm (پیش‌فرض) یا git نصب می‌کند و می‌تواند راه‌اندازی اولیه را اجرا کند.       |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Node و OpenClaw را از طریق npm یا git در یک پیشوند محلی (`~/.openclaw`) نصب می‌کند. به دسترسی root نیاز ندارد. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | در صورت نیاز Node را نصب می‌کند، OpenClaw را از طریق npm (پیش‌فرض) یا git نصب می‌کند و می‌تواند راه‌اندازی اولیه را اجرا کند.       |

هر سه از Node **22.22.3+، 24.15+ یا 25.9+** پشتیبانی می‌کنند؛ Node 24 هدف پیش‌فرض برای نصب‌های جدید است.

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
اگر نصب موفق است اما `openclaw` در یک ترمینال جدید پیدا نمی‌شود، به [عیب‌یابی Node.js](/fa/install/node#troubleshooting) مراجعه کنید.
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
    نسخه Node را بررسی می‌کند و در صورت نیاز Node 24 را نصب می‌کند (Homebrew در macOS و اسکریپت‌های راه‌اندازی NodeSource در apt/dnf/yum لینوکس). در macOS، Homebrew فقط زمانی نصب می‌شود که نصب‌کننده برای Node یا Git به آن نیاز داشته باشد. Node 22.22.3+، Node 24.15+ و Node 25.9+ پشتیبانی می‌شوند؛ Node 23 پشتیبانی نمی‌شود.
    در Alpine/musl Linux، نصب‌کننده به‌جای NodeSource از بسته‌های apk استفاده می‌کند و نسخه واقعی SQLite پیوندخورده را تأیید می‌کند. جریان‌های بسته پایدار فعلی Alpine ممکن است Node به‌اندازه کافی جدیدی را همراه با SQLite سیستمی آسیب‌پذیر ارائه کنند؛ در این حالت، به‌جای آن از یک کانتینر رسمی `node:24-alpine` یا میزبانی مبتنی بر glibc استفاده کنید.
  </Step>
  <Step title="اطمینان از وجود Git">
    اگر Git موجود نباشد، آن را با استفاده از مدیر بسته شناسایی‌شده، از جمله Homebrew در macOS و apk در Alpine، نصب می‌کند.
  </Step>
  <Step title="نصب OpenClaw">
    - روش `npm` (پیش‌فرض): نصب سراسری با npm
    - روش `git`: مخزن را کلون/به‌روزرسانی می‌کند، وابستگی‌ها را با pnpm نصب می‌کند، می‌سازد و سپس پوشش فرمان را در `~/.local/bin/openclaw` نصب می‌کند

  </Step>
  <Step title="کارهای پس از نصب">
    - فایل اجرایی `openclaw` را که به‌تازگی نصب شده است برای فرمان‌های بعدی پیدا می‌کند
    - برای یک نصب پیکربندی‌نشده، راه‌اندازی اولیه را پیش از بررسی‌های doctor یا Gateway آغاز می‌کند. با `--no-onboard` یا در نبود TTY، فرمان تکمیل راه‌اندازی در زمانی دیگر را چاپ می‌کند.
    - برای یک نصب پیکربندی‌شده، سرویس Gateway بارگذاری‌شده را به‌صورت بهترین تلاش تازه‌سازی و راه‌اندازی مجدد می‌کند و doctor را اجرا می‌کند. ارتقاها در صورت امکان Pluginها را به‌روزرسانی می‌کنند، یا در یک اجرای بدون رابط و دارای اعلان، فرمان دستی را چاپ می‌کنند.
    - هنگام اجرای `--verify`، نسخه نصب‌شده را بررسی می‌کند و تنها پس از وجود پیکربندی، سلامت Gateway را بررسی می‌کند.

  </Step>
</Steps>

### تشخیص نسخه منبع

اگر اسکریپت درون یک نسخه منبع OpenClaw اجرا شود (`package.json` + `pnpm-workspace.yaml`)، این گزینه‌ها را ارائه می‌کند:

- استفاده از نسخه منبع (`git`)، یا
- استفاده از نصب سراسری (`npm`)

اگر TTY در دسترس نباشد و هیچ روش نصبی تعیین نشده باشد، به‌صورت پیش‌فرض از `npm` استفاده می‌کند و هشدار می‌دهد.

اسکریپت برای انتخاب نامعتبر روش یا مقادیر نامعتبر `--install-method` با کد `2` خارج می‌شود.

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
  <Tab title="نسخه منبع main در GitHub">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="اجرای آزمایشی">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
  <Tab title="تأیید پس از نصب">
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
| `--git-dir \| --dir <path>`             | پوشه نسخه منبع (پیش‌فرض: `~/openclaw`)                              |
| `--no-git-update`                       | رد کردن `git pull` برای نسخه منبع موجود                                   |
| `--no-prompt`                           | غیرفعال کردن اعلان‌ها                                                         |
| `--no-onboard`                          | رد کردن راه‌اندازی اولیه                                                         |
| `--onboard`                             | فعال کردن راه‌اندازی اولیه                                                       |
| `--verify`                              | اجرای یک تأیید سریع پس از نصب (`--version`، سلامت Gateway در صورت بارگذاری بودن) |
| `--dry-run`                             | چاپ عملیات بدون اعمال تغییرات                                  |
| `--verbose`                             | فعال کردن خروجی اشکال‌زدایی (`set -x`، گزارش‌های سطح notice در npm)                   |
| `--help \| -h`                          | نمایش راهنما                                                              |

  </Accordion>

  <Accordion title="مرجع متغیرهای محیطی">

| متغیر                                          | توضیحات                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | روش نصب                                                     |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | نسخه npm، برچسب توزیع یا مشخصات بسته                             |
| `OPENCLAW_BETA=0\|1`                              | استفاده از beta در صورت موجود بودن                                              |
| `OPENCLAW_HOME=<path>`                            | پوشه پایه برای وضعیت OpenClaw و مسیرهای پیش‌فرض git/راه‌اندازی اولیه |
| `OPENCLAW_GIT_DIR=<path>`                         | پوشه نسخه منبع                                                 |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | تغییر وضعیت به‌روزرسانی‌های git                                                 |
| `OPENCLAW_NO_PROMPT=1`                            | غیرفعال کردن اعلان‌ها                                                    |
| `OPENCLAW_VERIFY_INSTALL=1`                       | اجرای تأیید سریع پس از نصب                                  |
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
(پیش‌فرض `~/.openclaw`) قرار گیرد و هیچ وابستگی به Node سیستمی وجود نداشته باشد. به‌صورت پیش‌فرض از نصب‌های npm
و همچنین نصب‌های نسخه منبع git در همان روند پیشوند پشتیبانی می‌کند.
</Info>

### روند (install-cli.sh)

<Steps>
  <Step title="نصب محیط اجرای محلی Node">
    یک فایل tar ثابت‌شده از نسخه پشتیبانی‌شده Node LTS را (نسخه در اسکریپت تعبیه شده و به‌طور مستقل به‌روزرسانی می‌شود؛ پیش‌فرض `24.15.0`) در `<prefix>/tools/node-v<version>` دانلود می‌کند و SHA-256 را تأیید می‌کند.
    Linux ARMv7 از Node `22.22.3` استفاده می‌کند، زیرا فایل‌های اجرایی رسمی ARMv7 برای Node 24+ در دسترس نیستند.
    در Alpine/musl Linux، که Node فایل‌های tar سازگار با محیط اجرای ثابت‌شده منتشر نمی‌کند، `nodejs` و `npm` را با `apk` نصب می‌کند و سپس هم Node و هم کتابخانه واقعی SQLite پیوندخورده را تأیید می‌کند. جریان‌های بسته پایدار فعلی Alpine ممکن است حتی با Node به‌اندازه کافی جدید همچنان به SQLite آسیب‌پذیر پیوند شوند؛ هنگامی که بررسی ایمنی بسته را رد می‌کند، از یک کانتینر رسمی `node:24-alpine` یا میزبانی مبتنی بر glibc استفاده کنید.
  </Step>
  <Step title="اطمینان از وجود Git">
    اگر Git موجود نباشد، تلاش می‌کند آن را از طریق apt/dnf/yum/apk در Linux یا Homebrew در macOS نصب کند.
  </Step>
  <Step title="نصب OpenClaw زیر پیشوند">
    - روش `npm` (پیش‌فرض): با npm زیر پیشوند نصب می‌کند، سپس پوشش فرمان را در `<prefix>/bin/openclaw` می‌نویسد
    - روش `git`: یک نسخه منبع را کلون/به‌روزرسانی می‌کند (پیش‌فرض `~/openclaw`) و همچنان پوشش فرمان را در `<prefix>/bin/openclaw` می‌نویسد

  </Step>
  <Step title="تازه‌سازی سرویس Gateway بارگذاری‌شده">
    اگر یک سرویس Gateway از همان پیشوند از قبل بارگذاری شده باشد، اسکریپت
    `openclaw gateway install --force` را اجرا می‌کند که سرویس جایگزین را فعال می‌کند،
    و سپس سلامت Gateway را به‌صورت بهترین تلاش بررسی می‌کند.
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

| پرچم                                    | توضیحات                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`                       | پیشوند نصب (پیش‌فرض: `~/.openclaw`)                                         |
| `--install-method \| --method npm\|git` | انتخاب روش نصب (پیش‌فرض: `npm`)                                          |
| `--npm`                                 | میان‌بر روش npm                                                         |
| `--git \| --github`                     | میان‌بر روش git                                                         |
| `--git-dir \| --dir <path>`             | پوشه checkout گیت (پیش‌فرض: `~/openclaw`)                                  |
| `--version <ver>`                       | نسخه یا dist-tag مربوط به OpenClaw (پیش‌فرض: `latest`)                                |
| `--node-version <ver>`                  | نسخه Node (پیش‌فرض: `24.15.0`؛ `22.22.3` در Linux ARMv7)                     |
| `--json`                                | انتشار رویدادهای NDJSON                                                              |
| `--onboard`                             | اجرای `openclaw onboard` پس از نصب                                            |
| `--no-onboard`                          | رد کردن راه‌اندازی اولیه (پیش‌فرض)                                                       |
| `--set-npm-prefix`                      | در Linux، اگر پیشوند فعلی نوشتنی نیست، پیشوند npm به‌اجبار روی `~/.npm-global` تنظیم شود |
| `--help \| -h`                          | نمایش نحوه استفاده                                                                      |

  </Accordion>

  <Accordion title="مرجع متغیرهای محیطی">

| متغیر                                    | توضیحات                                                        |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | پیشوند نصب                                                     |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | روش نصب                                                     |
| `OPENCLAW_VERSION=<ver>`                    | نسخه یا dist-tag مربوط به OpenClaw                                       |
| `OPENCLAW_NODE_VERSION=<ver>`               | نسخه Node                                                       |
| `OPENCLAW_HOME=<path>`                      | پوشه پایه برای وضعیت OpenClaw و مسیرهای پیش‌فرض git/راه‌اندازی اولیه |
| `OPENCLAW_GIT_DIR=<path>`                   | پوشه checkout گیت برای نصب‌های git                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | فعال یا غیرفعال‌سازی به‌روزرسانی‌های git برای checkoutهای موجود                          |
| `OPENCLAW_NO_ONBOARD=1`                     | رد کردن راه‌اندازی اولیه                                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | سطح گزارش npm (پیش‌فرض: `error`)                                   |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` و سایر مشخصات منبع GitHub، هدف‌های معتبر `--version` برای نصب‌های npm نیستند. به‌جای آن از `--install-method git --version main` استفاده کنید.
</Note>

---

<a id="installps1"></a>

## install.ps1

### روند (install.ps1)

<Steps>
  <Step title="اطمینان از وجود محیط PowerShell و Windows">
    به PowerShell 5+ نیاز دارد.
  </Step>
  <Step title="اطمینان از وجود Node.js 24 به‌صورت پیش‌فرض">
    در صورت نبودن، نصب ابتدا از طریق winget، سپس Chocolatey و بعد Scoop امتحان می‌شود. اگر هیچ مدیر بسته‌ای در دسترس نباشد، اسکریپت فایل zip رسمی Node.js 24 برای Windows را در `%LOCALAPPDATA%\OpenClaw\deps\portable-node` بارگیری می‌کند و آن را به PATH فرایند فعلی و کاربر می‌افزاید. Node 22.22.3+، Node 24.15+ و Node 25.9+ پشتیبانی می‌شوند؛ Node 23 پشتیبانی نمی‌شود.
  </Step>
  <Step title="نصب OpenClaw">
    - روش `npm` (پیش‌فرض): نصب سراسری npm با استفاده از `-Tag` انتخاب‌شده که از یک پوشه موقت نوشتنی نصب‌کننده اجرا می‌شود تا پوسته‌هایی که در پوشه‌های محافظت‌شده‌ای مانند `C:\` باز شده‌اند نیز همچنان کار کنند
    - روش `git`: مخزن را clone/به‌روزرسانی می‌کند، با pnpm نصب/build می‌کند و wrapper را در `%USERPROFILE%\.local\bin\openclaw.cmd` نصب می‌کند. اگر Git موجود نباشد، اسکریپت MinGit محلی کاربر را در `%LOCALAPPDATA%\OpenClaw\deps\portable-git` راه‌اندازی می‌کند و آن را به PATH فرایند فعلی و کاربر می‌افزاید.

  </Step>
  <Step title="کارهای پس از نصب">
    - در صورت امکان، پوشه bin موردنیاز را به PATH کاربر می‌افزاید
    - سرویس Gateway بارگذاری‌شده را به‌شکل best-effort تازه‌سازی می‌کند (`openclaw gateway install --force` و سپس راه‌اندازی مجدد)
    - در ارتقاها و نصب‌های git، `openclaw doctor --non-interactive` را اجرا می‌کند (best effort)

  </Step>
  <Step title="مدیریت خطاها">
    نصب‌های `iwr ... | iex` و scriptblock بدون بستن نشست فعلی PowerShell، خطای پایان‌دهنده گزارش می‌کنند. نصب‌های مستقیم `powershell -File` / `pwsh -File` همچنان برای خودکارسازی با کد خروج غیرصفر خاتمه می‌یابند.
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
  <Tab title="checkout شاخه main در GitHub">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
    ```
  </Tab>
  <Tab title="پوشه سفارشی git">
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

| پرچم                        | توضیحات                                                |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | روش نصب (پیش‌فرض: `npm`)                            |
| `-Tag <tag\|version\|spec>` | dist-tag، نسخه یا مشخصه بسته npm (پیش‌فرض: `latest`) |
| `-GitDir <path>`            | پوشه checkout (پیش‌فرض: `%USERPROFILE%\openclaw`)     |
| `-NoOnboard`                | رد کردن راه‌اندازی اولیه                                            |
| `-NoGitUpdate`              | رد کردن `git pull`                                            |
| `-DryRun`                   | فقط چاپ عملیات                                         |

  </Accordion>

  <Accordion title="مرجع متغیرهای محیطی">

| متغیر                           | توضیحات        |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | روش نصب     |
| `OPENCLAW_GIT_DIR=<path>`          | پوشه checkout |
| `OPENCLAW_NO_ONBOARD=1`            | رد کردن راه‌اندازی اولیه    |
| `OPENCLAW_GIT_UPDATE=0`            | غیرفعال‌سازی git pull   |
| `OPENCLAW_DRY_RUN=1`               | حالت اجرای آزمایشی       |

  </Accordion>
</AccordionGroup>

<Note>
اگر از `-InstallMethod git` استفاده شود و Git موجود نباشد، اسکریپت پیش از چاپ پیوند Git for Windows، راه‌اندازی MinGit محلی کاربر را امتحان می‌کند.
</Note>

---

## CI و خودکارسازی

برای اجراهای قابل‌پیش‌بینی، از پرچم‌ها/متغیرهای محیطی غیرتعاملی استفاده کنید.

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
    Git برای روش نصب `git` لازم است. در نصب‌های `npm` نیز Git همچنان بررسی/نصب می‌شود تا هنگام استفاده وابستگی‌ها از URLهای git، از خطاهای `spawn git ENOENT` جلوگیری شود.
  </Accordion>

  <Accordion title="چرا npm در Linux با EACCES مواجه می‌شود؟">
    برخی پیکربندی‌های Linux، پیشوند سراسری npm را به مسیرهای متعلق به root اشاره می‌دهند. `install.sh` می‌تواند پیشوند را به `~/.npm-global` تغییر دهد و exportهای PATH را به فایل‌های rc پوسته اضافه کند (اگر این فایل‌ها وجود داشته باشند).
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    نصب‌کننده را دوباره اجرا کنید تا بتواند MinGit محلی کاربر را راه‌اندازی کند، یا Git for Windows را نصب کرده و PowerShell را دوباره باز کنید.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    `npm config get prefix` را اجرا کنید و آن پوشه را به PATH کاربر خود بیفزایید (در Windows به پسوند `\bin` نیازی نیست)، سپس PowerShell را دوباره باز کنید.
  </Accordion>

  <Accordion title="Windows: روش دریافت خروجی مشروح نصب‌کننده">
    `install.ps1` گزینه `-Verbose` را ارائه نمی‌کند.
    برای عیب‌یابی در سطح اسکریپت، از ردیابی PowerShell استفاده کنید:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw پس از نصب پیدا نمی‌شود">
    معمولاً مشکل از PATH است. به [عیب‌یابی Node.js](/fa/install/node#troubleshooting) مراجعه کنید.
  </Accordion>
</AccordionGroup>

## مرتبط

- [نمای کلی نصب](/fa/install)
- [به‌روزرسانی](/fa/install/updating)
- [حذف نصب](/fa/install/uninstall)

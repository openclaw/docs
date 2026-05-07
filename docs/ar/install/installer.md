---
read_when:
    - تريد فهم `openclaw.ai/install.sh`
    - تريد أتمتة عمليات التثبيت (CI / بدون واجهة رسومية)
    - تريد التثبيت من نسخة مستخرجة من GitHub
summary: كيفية عمل نصوص التثبيت (install.sh وinstall-cli.sh وinstall.ps1) والخيارات والأتمتة
title: داخليات المُثبّت
x-i18n:
    generated_at: "2026-05-07T13:23:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: a62720526e2a5ffc94555f77e7e806d63768b849a9491b60f6fdc9cf070eed2f
    source_path: install/installer.md
    workflow: 16
---

يشحن OpenClaw ثلاثة نصوص تثبيت، تُقدَّم من `openclaw.ai`.

| النص البرمجي                       | المنصة               | ما يفعله                                                                                                        |
| ---------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | يثبّت Node عند الحاجة، ويثبّت OpenClaw عبر npm (افتراضيًا) أو git، ويمكنه تشغيل التهيئة الأولية.                |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | يثبّت Node + OpenClaw داخل بادئة محلية (`~/.openclaw`) باستخدام npm أو أوضاع checkout عبر git. لا يتطلب root. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | يثبّت Node عند الحاجة، ويثبّت OpenClaw عبر npm (افتراضيًا) أو git، ويمكنه تشغيل التهيئة الأولية.                |

## أوامر سريعة

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
إذا نجح التثبيت ولكن لم يتم العثور على `openclaw` في طرفية جديدة، فراجع [استكشاف أخطاء Node.js وإصلاحها](/ar/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
موصى به لمعظم عمليات التثبيت التفاعلية على macOS/Linux/WSL.
</Tip>

### التدفق (install.sh)

<Steps>
  <Step title="اكتشاف نظام التشغيل">
    يدعم macOS وLinux (بما في ذلك WSL). إذا تم اكتشاف macOS، يثبّت Homebrew إذا كان مفقودًا.
  </Step>
  <Step title="ضمان Node.js 24 افتراضيًا">
    يتحقق من إصدار Node ويثبّت Node 24 عند الحاجة (Homebrew على macOS، ونصوص إعداد NodeSource على Linux apt/dnf/yum). لا يزال OpenClaw يدعم Node 22 LTS، حاليًا `22.16+`، للتوافق.
  </Step>
  <Step title="ضمان Git">
    يثبّت Git إذا كان مفقودًا.
  </Step>
  <Step title="تثبيت OpenClaw">
    - طريقة `npm` (الافتراضية): تثبيت npm عام
    - طريقة `git`: استنساخ/تحديث المستودع، وتثبيت الاعتماديات باستخدام pnpm، والبناء، ثم تثبيت الملتف في `~/.local/bin/openclaw`

  </Step>
  <Step title="مهام ما بعد التثبيت">
    - يحدّث خدمة Gateway محمّلة بأفضل جهد (`openclaw gateway install --force`، ثم إعادة التشغيل)
    - يشغّل `openclaw doctor --non-interactive` عند الترقيات وتثبيتات git (بأفضل جهد)
    - يحاول التهيئة الأولية عند ملاءمة ذلك (توفر TTY، وعدم تعطيل التهيئة الأولية، واجتياز فحوصات bootstrap/config)
    - يضبط `SHARP_IGNORE_GLOBAL_LIBVIPS=1` افتراضيًا

  </Step>
</Steps>

### اكتشاف checkout المصدر

إذا شُغّل داخل checkout لـ OpenClaw (`package.json` + `pnpm-workspace.yaml`)، يعرض النص البرمجي:

- استخدام checkout (`git`)، أو
- استخدام التثبيت العام (`npm`)

إذا لم يكن TTY متاحًا ولم تُضبط طريقة تثبيت، فسيستخدم `npm` افتراضيًا ويصدر تحذيرًا.

يخرج النص البرمجي بالرمز `2` عند اختيار طريقة غير صالحة أو قيم `--install-method` غير صالحة.

### أمثلة (install.sh)

<Tabs>
  <Tab title="افتراضي">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="تخطي التهيئة الأولية">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="تثبيت Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main عبر npm">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --version main
    ```
  </Tab>
  <Tab title="تشغيل تجريبي">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="مرجع العلامات">

| العلامة                              | الوصف                                                     |
| ------------------------------------- | --------------------------------------------------------- |
| `--install-method npm\|git`           | اختر طريقة التثبيت (الافتراضي: `npm`). الاسم البديل: `--method` |
| `--npm`                               | اختصار لطريقة npm                                         |
| `--git`                               | اختصار لطريقة git. الاسم البديل: `--github`               |
| `--version <version\|dist-tag\|spec>` | إصدار npm أو dist-tag أو مواصفة حزمة (الافتراضي: `latest`) |
| `--beta`                              | استخدم dist-tag بيتا إذا كان متاحًا، وإلا فارجع إلى `latest` |
| `--git-dir <path>`                    | دليل checkout (الافتراضي: `~/openclaw`). الاسم البديل: `--dir` |
| `--no-git-update`                     | تخطَّ `git pull` لـ checkout موجود                        |
| `--no-prompt`                         | عطّل المطالبات                                            |
| `--no-onboard`                        | تخطَّ التهيئة الأولية                                     |
| `--onboard`                           | فعّل التهيئة الأولية                                      |
| `--dry-run`                           | اطبع الإجراءات دون تطبيق التغييرات                        |
| `--verbose`                           | فعّل إخراج التصحيح (`set -x`، وسجلات npm بمستوى notice)  |
| `--help`                              | اعرض الاستخدام (`-h`)                                     |

  </Accordion>

  <Accordion title="مرجع متغيرات البيئة">

| المتغير                                                | الوصف                                      |
| ------------------------------------------------------- | ------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | طريقة التثبيت                              |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | إصدار npm أو dist-tag أو مواصفة حزمة       |
| `OPENCLAW_BETA=0\|1`                                    | استخدم بيتا إذا كان متاحًا                 |
| `OPENCLAW_GIT_DIR=<path>`                               | دليل checkout                              |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | تبديل تحديثات git                          |
| `OPENCLAW_NO_PROMPT=1`                                  | تعطيل المطالبات                            |
| `OPENCLAW_NO_ONBOARD=1`                                 | تخطي التهيئة الأولية                       |
| `OPENCLAW_DRY_RUN=1`                                    | وضع التشغيل التجريبي                       |
| `OPENCLAW_VERBOSE=1`                                    | وضع التصحيح                                |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | مستوى سجل npm                              |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | التحكم في سلوك sharp/libvips (الافتراضي: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
مصمم للبيئات التي تريد فيها وضع كل شيء تحت بادئة محلية
(الافتراضي `~/.openclaw`) ودون اعتماد على Node في النظام. يدعم تثبيتات npm
افتراضيًا، بالإضافة إلى تثبيتات git-checkout ضمن تدفق البادئة نفسه.
</Info>

### التدفق (install-cli.sh)

<Steps>
  <Step title="تثبيت وقت تشغيل Node المحلي">
    ينزّل أرشيف tarball مدعومًا ومثبت الإصدار لـ Node LTS (الإصدار مضمّن في النص البرمجي ويُحدّث بشكل مستقل) إلى `<prefix>/tools/node-v<version>` ويتحقق من SHA-256.
  </Step>
  <Step title="ضمان Git">
    إذا كان Git مفقودًا، يحاول التثبيت عبر apt/dnf/yum على Linux أو Homebrew على macOS.
  </Step>
  <Step title="تثبيت OpenClaw تحت البادئة">
    - طريقة `npm` (الافتراضية): تثبّت تحت البادئة باستخدام npm، ثم تكتب الملتف إلى `<prefix>/bin/openclaw`
    - طريقة `git`: تستنسخ/تحدّث checkout (الافتراضي `~/openclaw`) وتظل تكتب الملتف إلى `<prefix>/bin/openclaw`

  </Step>
  <Step title="تحديث خدمة Gateway المحمّلة">
    إذا كانت خدمة Gateway محمّلة بالفعل من تلك البادئة نفسها، فسيشغّل النص البرمجي
    `openclaw gateway install --force`، ثم `openclaw gateway restart`، ويفحص
    صحة Gateway بأفضل جهد.
  </Step>
</Steps>

### أمثلة (install-cli.sh)

<Tabs>
  <Tab title="افتراضي">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="بادئة مخصصة + إصدار">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="تثبيت Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="إخراج JSON للأتمتة">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="تشغيل التهيئة الأولية">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="مرجع العلامات">

| العلامة                    | الوصف                                                                  |
| --------------------------- | ---------------------------------------------------------------------- |
| `--prefix <path>`           | بادئة التثبيت (الافتراضي: `~/.openclaw`)                              |
| `--install-method npm\|git` | اختر طريقة التثبيت (الافتراضي: `npm`). الاسم البديل: `--method`       |
| `--npm`                     | اختصار لطريقة npm                                                      |
| `--git`, `--github`         | اختصار لطريقة git                                                      |
| `--git-dir <path>`          | دليل Git checkout (الافتراضي: `~/openclaw`). الاسم البديل: `--dir`    |
| `--version <ver>`           | إصدار OpenClaw أو dist-tag (الافتراضي: `latest`)                      |
| `--node-version <ver>`      | إصدار Node (الافتراضي: `22.22.0`)                                     |
| `--json`                    | إصدار أحداث NDJSON                                                    |
| `--onboard`                 | تشغيل `openclaw onboard` بعد التثبيت                                  |
| `--no-onboard`              | تخطي التهيئة الأولية (الافتراضي)                                      |
| `--set-npm-prefix`          | على Linux، فرض بادئة npm إلى `~/.npm-global` إذا كانت البادئة الحالية غير قابلة للكتابة |
| `--help`                    | اعرض الاستخدام (`-h`)                                                  |

  </Accordion>

  <Accordion title="مرجع متغيرات البيئة">

| المتغير                                    | الوصف                                   |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | بادئة التثبيت                                |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | طريقة التثبيت                                |
| `OPENCLAW_VERSION=<ver>`                    | إصدار OpenClaw أو dist-tag                  |
| `OPENCLAW_NODE_VERSION=<ver>`               | إصدار Node                                  |
| `OPENCLAW_GIT_DIR=<path>`                   | دليل سحب Git لتثبيتات git       |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | تبديل تحديثات git لعمليات السحب الموجودة     |
| `OPENCLAW_NO_ONBOARD=1`                     | تخطي الإعداد الأولي                               |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | مستوى سجل npm                                 |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | التحكم في سلوك sharp/libvips (الافتراضي: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### التدفق (install.ps1)

<Steps>
  <Step title="Ensure PowerShell + Windows environment">
    يتطلب PowerShell 5+.
  </Step>
  <Step title="Ensure Node.js 24 by default">
    إذا كان غير موجود، يحاول التثبيت عبر winget، ثم Chocolatey، ثم Scoop. يظل Node 22 LTS، حاليًا `22.16+`، مدعومًا للتوافق.
  </Step>
  <Step title="Install OpenClaw">
    - طريقة `npm` (الافتراضية): تثبيت npm عمومي باستخدام `-Tag` المحدد، يتم تشغيله من دليل مؤقت قابل للكتابة للمثبت حتى تظل الصدفات المفتوحة في مجلدات محمية مثل `C:\` تعمل
    - طريقة `git`: استنساخ/تحديث المستودع، التثبيت/البناء باستخدام pnpm، وتثبيت المغلف في `%USERPROFILE%\.local\bin\openclaw.cmd`

  </Step>
  <Step title="Post-install tasks">
    - يضيف دليل bin المطلوب إلى PATH الخاص بالمستخدم عندما يكون ذلك ممكنًا
    - يحدّث خدمة Gateway محملة بأفضل جهد (`openclaw gateway install --force`، ثم إعادة التشغيل)
    - يشغل `openclaw doctor --non-interactive` عند الترقيات وتثبيتات git (بأفضل جهد)

  </Step>
  <Step title="Handle failures">
    تبلغ عمليات التثبيت عبر `iwr ... | iex` و scriptblock عن خطأ نهائي دون إغلاق جلسة PowerShell الحالية. لا تزال عمليات التثبيت المباشرة عبر `powershell -File` / `pwsh -File` تخرج برمز غير صفري للأتمتة.
  </Step>
</Steps>

### أمثلة (install.ps1)

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

| العلم                        | الوصف                                                |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | طريقة التثبيت (الافتراضي: `npm`)                            |
| `-Tag <tag\|version\|spec>` | dist-tag أو إصدار أو مواصفة حزمة npm (الافتراضي: `latest`) |
| `-GitDir <path>`            | دليل السحب (الافتراضي: `%USERPROFILE%\openclaw`)     |
| `-NoOnboard`                | تخطي الإعداد الأولي                                            |
| `-NoGitUpdate`              | تخطي `git pull`                                            |
| `-DryRun`                   | طباعة الإجراءات فقط                                         |

  </Accordion>

  <Accordion title="Environment variables reference">

| المتغير                           | الوصف        |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | طريقة التثبيت     |
| `OPENCLAW_GIT_DIR=<path>`          | دليل السحب |
| `OPENCLAW_NO_ONBOARD=1`            | تخطي الإعداد الأولي    |
| `OPENCLAW_GIT_UPDATE=0`            | تعطيل git pull   |
| `OPENCLAW_DRY_RUN=1`               | وضع التشغيل التجريبي       |

  </Accordion>
</AccordionGroup>

<Note>
إذا استُخدمت `-InstallMethod git` وكان Git مفقودًا، يخرج السكربت ويطبع رابط Git for Windows.
</Note>

---

## CI والأتمتة

استخدم الأعلام/متغيرات البيئة غير التفاعلية للحصول على عمليات تشغيل قابلة للتنبؤ.

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

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="Why is Git required?">
    Git مطلوب لطريقة تثبيت `git`. بالنسبة لتثبيتات `npm`، لا يزال يتم فحص/تثبيت Git لتجنب حالات فشل `spawn git ENOENT` عندما تستخدم التبعيات عناوين URL من git.
  </Accordion>

  <Accordion title="Why does npm hit EACCES on Linux?">
    تشير بعض إعدادات Linux إلى بادئة npm العمومية في مسارات مملوكة للجذر. يمكن لـ `install.sh` تبديل البادئة إلى `~/.npm-global` وإلحاق عمليات تصدير PATH بملفات rc الخاصة بالصدفة (عند وجود تلك الملفات).
  </Accordion>

  <Accordion title="sharp/libvips issues">
    تضبط السكربتات افتراضيًا `SHARP_IGNORE_GLOBAL_LIBVIPS=1` لتجنب بناء sharp مقابل libvips الخاص بالنظام. للتجاوز:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    ثبّت Git for Windows، وأعد فتح PowerShell، ثم أعد تشغيل المثبت.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    شغّل `npm config get prefix` وأضف ذلك الدليل إلى PATH الخاص بالمستخدم لديك (لا حاجة إلى لاحقة `\bin` على Windows)، ثم أعد فتح PowerShell.
  </Accordion>

  <Accordion title="Windows: how to get verbose installer output">
    لا يعرض `install.ps1` حاليًا مفتاح `-Verbose`.
    استخدم تتبع PowerShell لتشخيصات مستوى السكربت:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw not found after install">
    عادة ما تكون المشكلة متعلقة بـ PATH. راجع [استكشاف أخطاء Node.js وإصلاحها](/ar/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install)
- [التحديث](/ar/install/updating)
- [إلغاء التثبيت](/ar/install/uninstall)

---
read_when:
    - تريد فهم `openclaw.ai/install.sh`
    - تريد أتمتة عمليات التثبيت (CI / بدون واجهة)
    - تريد التثبيت من نسخة مستخرجة من GitHub
summary: كيفية عمل نصوص التثبيت (install.sh، install-cli.sh، install.ps1)، والخيارات، والأتمتة
title: الأجزاء الداخلية للمثبّت
x-i18n:
    generated_at: "2026-04-30T08:08:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 278e8d6a1a39651812b7f0955965c53c62afd3ad673b357484f8aecbcfbbdb1d
    source_path: install/installer.md
    workflow: 16
---

OpenClaw يوفّر ثلاثة نصوص تثبيت برمجية، تُقدَّم من `openclaw.ai`.

| النص البرمجي                       | المنصة               | ما الذي يفعله                                                                                                  |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | يثبّت Node عند الحاجة، ويثبّت OpenClaw عبر npm (افتراضيًا) أو git، ويمكنه تشغيل الإعداد الأولي.                |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | يثبّت Node + OpenClaw في بادئة محلية (`~/.openclaw`) باستخدام أوضاع npm أو git checkout. لا يتطلب صلاحيات root. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | يثبّت Node عند الحاجة، ويثبّت OpenClaw عبر npm (افتراضيًا) أو git، ويمكنه تشغيل الإعداد الأولي.                |

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
    يتحقق من إصدار Node ويثبّت Node 24 عند الحاجة (Homebrew على macOS، ونصوص إعداد NodeSource على Linux apt/dnf/yum). لا يزال OpenClaw يدعم Node 22 LTS، حاليًا `22.14+`، للتوافق.
  </Step>
  <Step title="ضمان Git">
    يثبّت Git إذا كان مفقودًا.
  </Step>
  <Step title="تثبيت OpenClaw">
    - طريقة `npm` (الافتراضية): تثبيت npm عام
    - طريقة `git`: استنساخ/تحديث المستودع، تثبيت الاعتماديات باستخدام pnpm، البناء، ثم تثبيت الغلاف في `~/.local/bin/openclaw`

  </Step>
  <Step title="مهام ما بعد التثبيت">
    - يحدّث خدمة Gateway محمّلة على أساس أفضل جهد (`openclaw gateway install --force`، ثم إعادة التشغيل)
    - يشغّل `openclaw doctor --non-interactive` عند الترقيات وتثبيتات git (أفضل جهد)
    - يحاول الإعداد الأولي عند الاقتضاء (TTY متاح، الإعداد الأولي غير معطّل، وفحوصات التمهيد/الإعدادات تمر بنجاح)
    - يعيّن `SHARP_IGNORE_GLOBAL_LIBVIPS=1` افتراضيًا

  </Step>
</Steps>

### اكتشاف checkout للمصدر

إذا تم تشغيله داخل checkout لـ OpenClaw (`package.json` + `pnpm-workspace.yaml`)، يعرض النص البرمجي:

- استخدام checkout (`git`)، أو
- استخدام التثبيت العام (`npm`)

إذا لم يكن TTY متاحًا ولم تُعيَّن طريقة تثبيت، فسيستخدم `npm` افتراضيًا ويعرض تحذيرًا.

يخرج النص البرمجي بالرمز `2` عند اختيار طريقة غير صالحة أو قيم `--install-method` غير صالحة.

### أمثلة (install.sh)

<Tabs>
  <Tab title="الافتراضي">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="تخطي الإعداد الأولي">
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

| العلامة                               | الوصف                                                     |
| ------------------------------------- | --------------------------------------------------------- |
| `--install-method npm\|git`           | اختر طريقة التثبيت (الافتراضي: `npm`). الاسم البديل: `--method` |
| `--npm`                               | اختصار لطريقة npm                                         |
| `--git`                               | اختصار لطريقة git. الاسم البديل: `--github`               |
| `--version <version\|dist-tag\|spec>` | إصدار npm أو وسم التوزيع أو مواصفة الحزمة (الافتراضي: `latest`) |
| `--beta`                              | استخدم وسم توزيع beta إذا كان متاحًا، وإلا فارجع إلى `latest` |
| `--git-dir <path>`                    | دليل checkout (الافتراضي: `~/openclaw`). الاسم البديل: `--dir` |
| `--no-git-update`                     | تخطي `git pull` لعملية checkout موجودة                    |
| `--no-prompt`                         | تعطيل المطالبات                                           |
| `--no-onboard`                        | تخطي الإعداد الأولي                                      |
| `--onboard`                           | تفعيل الإعداد الأولي                                     |
| `--dry-run`                           | طباعة الإجراءات بدون تطبيق التغييرات                      |
| `--verbose`                           | تفعيل مخرجات التصحيح (`set -x`، وسجلات npm بمستوى notice) |
| `--help`                              | عرض الاستخدام (`-h`)                                     |

  </Accordion>

  <Accordion title="مرجع متغيرات البيئة">

| المتغير                                                | الوصف                                      |
| ------------------------------------------------------ | ------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                     | طريقة التثبيت                              |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | إصدار npm أو وسم التوزيع أو مواصفة الحزمة |
| `OPENCLAW_BETA=0\|1`                                   | استخدام beta إذا كان متاحًا                |
| `OPENCLAW_GIT_DIR=<path>`                              | دليل checkout                              |
| `OPENCLAW_GIT_UPDATE=0\|1`                             | تبديل تحديثات git                          |
| `OPENCLAW_NO_PROMPT=1`                                 | تعطيل المطالبات                            |
| `OPENCLAW_NO_ONBOARD=1`                                | تخطي الإعداد الأولي                       |
| `OPENCLAW_DRY_RUN=1`                                   | وضع التشغيل التجريبي                       |
| `OPENCLAW_VERBOSE=1`                                   | وضع التصحيح                                |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`            | مستوى سجل npm                              |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                     | التحكم في سلوك sharp/libvips (الافتراضي: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
مصمم للبيئات التي تريد فيها وضع كل شيء تحت بادئة محلية
(الافتراضي `~/.openclaw`) وبدون اعتماد على Node النظام. يدعم تثبيتات npm
افتراضيًا، بالإضافة إلى تثبيتات git-checkout ضمن تدفق البادئة نفسه.
</Info>

### التدفق (install-cli.sh)

<Steps>
  <Step title="تثبيت وقت تشغيل Node محلي">
    ينزّل أرشيف tarball مثبتًا لإصدار Node LTS مدعوم (الإصدار مضمّن في النص البرمجي ويُحدَّث بشكل مستقل) إلى `<prefix>/tools/node-v<version>` ويتحقق من SHA-256.
  </Step>
  <Step title="ضمان Git">
    إذا كان Git مفقودًا، يحاول التثبيت عبر apt/dnf/yum على Linux أو Homebrew على macOS.
  </Step>
  <Step title="تثبيت OpenClaw تحت البادئة">
    - طريقة `npm` (الافتراضية): يثبّت تحت البادئة باستخدام npm، ثم يكتب الغلاف إلى `<prefix>/bin/openclaw`
    - طريقة `git`: يستنسخ/يحدّث checkout (الافتراضي `~/openclaw`) ولا يزال يكتب الغلاف إلى `<prefix>/bin/openclaw`

  </Step>
  <Step title="تحديث خدمة Gateway المحمّلة">
    إذا كانت خدمة Gateway محمّلة بالفعل من البادئة نفسها، فسيشغّل النص البرمجي
    `openclaw gateway install --force`، ثم `openclaw gateway restart`، و
    يفحص صحة Gateway على أساس أفضل جهد.
  </Step>
</Steps>

### أمثلة (install-cli.sh)

<Tabs>
  <Tab title="الافتراضي">
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
  <Tab title="مخرجات JSON للأتمتة">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="تشغيل الإعداد الأولي">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="مرجع العلامات">

| العلامة                      | الوصف                                                                        |
| --------------------------- | ----------------------------------------------------------------------------- |
| `--prefix <path>`           | بادئة التثبيت (الافتراضي: `~/.openclaw`)                                      |
| `--install-method npm\|git` | اختر طريقة التثبيت (الافتراضي: `npm`). الاسم البديل: `--method`              |
| `--npm`                     | اختصار لطريقة npm                                                            |
| `--git`, `--github`         | اختصار لطريقة git                                                            |
| `--git-dir <path>`          | دليل checkout الخاص بـ Git (الافتراضي: `~/openclaw`). الاسم البديل: `--dir`  |
| `--version <ver>`           | إصدار OpenClaw أو وسم التوزيع (الافتراضي: `latest`)                          |
| `--node-version <ver>`      | إصدار Node (الافتراضي: `22.22.0`)                                            |
| `--json`                    | إصدار أحداث NDJSON                                                           |
| `--onboard`                 | تشغيل `openclaw onboard` بعد التثبيت                                          |
| `--no-onboard`              | تخطي الإعداد الأولي (افتراضيًا)                                               |
| `--set-npm-prefix`          | على Linux، فرض بادئة npm إلى `~/.npm-global` إذا كانت البادئة الحالية غير قابلة للكتابة |
| `--help`                    | عرض الاستخدام (`-h`)                                                          |

  </Accordion>

  <Accordion title="مرجع متغيرات البيئة">

| المتغير                                    | الوصف                                   |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | بادئة التثبيت                                |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | طريقة التثبيت                                |
| `OPENCLAW_VERSION=<ver>`                    | إصدار OpenClaw أو dist-tag                  |
| `OPENCLAW_NODE_VERSION=<ver>`               | إصدار Node                                  |
| `OPENCLAW_GIT_DIR=<path>`                   | دليل سحب Git لتثبيتات git       |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | تبديل تحديثات git لنسخ السحب الموجودة     |
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
  <Step title="تأكد من بيئة PowerShell + Windows">
    يتطلب PowerShell 5+.
  </Step>
  <Step title="تأكد من Node.js 24 افتراضيًا">
    إذا كان مفقودًا، يحاول التثبيت عبر winget، ثم Chocolatey، ثم Scoop. يظل Node 22 LTS، حاليًا `22.14+`، مدعومًا للتوافق.
  </Step>
  <Step title="ثبّت OpenClaw">
    - طريقة `npm` (الافتراضية): تثبيت npm عام باستخدام `-Tag` المحدد
    - طريقة `git`: استنساخ/تحديث المستودع، والتثبيت/البناء باستخدام pnpm، وتثبيت الغلاف في `%USERPROFILE%\.local\bin\openclaw.cmd`

  </Step>
  <Step title="مهام ما بعد التثبيت">
    - يضيف دليل bin المطلوب إلى PATH الخاص بالمستخدم عندما يكون ذلك ممكنًا
    - يحدّث خدمة Gateway محمّلة بأفضل جهد (`openclaw gateway install --force`، ثم إعادة التشغيل)
    - يشغّل `openclaw doctor --non-interactive` عند الترقيات وتثبيتات git (بأفضل جهد)

  </Step>
  <Step title="التعامل مع الإخفاقات">
    يبلّغ `iwr ... | iex` وتثبيتات scriptblock عن خطأ مُنهٍ دون إغلاق جلسة PowerShell الحالية. لا تزال تثبيتات `powershell -File` / `pwsh -File` المباشرة تخرج برمز غير صفري للأتمتة.
  </Step>
</Steps>

### أمثلة (install.ps1)

<Tabs>
  <Tab title="الافتراضي">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="تثبيت Git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="GitHub main عبر npm">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
    ```
  </Tab>
  <Tab title="دليل git مخصص">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="تشغيل تجريبي">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="تتبع التصحيح">
    ```powershell
    # لا يحتوي install.ps1 بعد على علم -Verbose مخصص.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="مرجع الأعلام">

| العلم                        | الوصف                                                |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | طريقة التثبيت (الافتراضي: `npm`)                            |
| `-Tag <tag\|version\|spec>` | dist-tag أو إصدار npm أو مواصفة الحزمة (الافتراضي: `latest`) |
| `-GitDir <path>`            | دليل السحب (الافتراضي: `%USERPROFILE%\openclaw`)     |
| `-NoOnboard`                | تخطي الإعداد الأولي                                            |
| `-NoGitUpdate`              | تخطي `git pull`                                            |
| `-DryRun`                   | طباعة الإجراءات فقط                                         |

  </Accordion>

  <Accordion title="مرجع متغيرات البيئة">

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
إذا استُخدم `-InstallMethod git` وكان Git مفقودًا، يخرج السكربت ويطبع رابط Git for Windows.
</Note>

---

## CI والأتمتة

استخدم الأعلام/متغيرات البيئة غير التفاعلية لعمليات تشغيل قابلة للتنبؤ.

<Tabs>
  <Tab title="install.sh (npm غير تفاعلي)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (git غير تفاعلي)">
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
  <Tab title="install.ps1 (تخطي الإعداد الأولي)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لماذا Git مطلوب؟">
    Git مطلوب لطريقة تثبيت `git`. بالنسبة إلى تثبيتات `npm`، لا يزال يجري فحص/تثبيت Git لتجنب إخفاقات `spawn git ENOENT` عندما تستخدم التبعيات عناوين URL من git.
  </Accordion>

  <Accordion title="لماذا يصطدم npm بخطأ EACCES على Linux؟">
    تشير بعض إعدادات Linux إلى بادئة npm العامة في مسارات مملوكة للجذر. يمكن لـ `install.sh` تبديل البادئة إلى `~/.npm-global` وإلحاق صادرات PATH بملفات rc الخاصة بالصدفة (عندما تكون تلك الملفات موجودة).
  </Accordion>

  <Accordion title="مشكلات sharp/libvips">
    تضبط السكربتات `SHARP_IGNORE_GLOBAL_LIBVIPS=1` افتراضيًا لتجنب بناء sharp مقابل libvips النظام. للتجاوز:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    ثبّت Git for Windows، وأعد فتح PowerShell، ثم أعد تشغيل المثبّت.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    شغّل `npm config get prefix` وأضف ذلك الدليل إلى PATH الخاص بالمستخدم لديك (لا حاجة إلى لاحقة `\bin` على Windows)، ثم أعد فتح PowerShell.
  </Accordion>

  <Accordion title="Windows: كيفية الحصول على مخرجات مثبّت مفصلة">
    لا يعرّض `install.ps1` حاليًا مفتاح `-Verbose`.
    استخدم تتبع PowerShell لتشخيصات على مستوى السكربت:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="لم يتم العثور على openclaw بعد التثبيت">
    عادةً ما تكون مشكلة PATH. راجع [استكشاف أخطاء Node.js وإصلاحها](/ar/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [التحديث](/ar/install/updating)
- [إلغاء التثبيت](/ar/install/uninstall)

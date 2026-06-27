---
read_when:
    - تريد فهم `openclaw.ai/install.sh`
    - تريد أتمتة عمليات التثبيت (CI / بدون واجهة)
    - تريد التثبيت من نسخة GitHub محلية
summary: كيفية عمل سكربتات التثبيت (install.sh، install-cli.sh، install.ps1)، والخيارات، والأتمتة
title: داخليات المثبّت
x-i18n:
    generated_at: "2026-06-27T17:52:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72182472f423e64b33afa071feda76c2c9abdf896bffa269f2148124c49a451c
    source_path: install/installer.md
    workflow: 16
---

يشحن OpenClaw ثلاثة سكربتات تثبيت، تُقدَّم من `openclaw.ai`.

| السكربت                           | المنصة                | ما يفعله                                                                                                   |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | يثبّت Node عند الحاجة، ويثبّت OpenClaw عبر npm (افتراضيًا) أو git، ويمكنه تشغيل الإعداد الأولي.                   |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | يثبّت Node + OpenClaw داخل بادئة محلية (`~/.openclaw`) باستخدام أوضاع npm أو git checkout. لا يتطلب صلاحيات root. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | يثبّت Node عند الحاجة، ويثبّت OpenClaw عبر npm (افتراضيًا) أو git، ويمكنه تشغيل الإعداد الأولي.                   |

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
إذا نجح التثبيت لكن لم يتم العثور على `openclaw` في طرفية جديدة، فراجع [استكشاف أخطاء Node.js وإصلاحها](/ar/install/node#troubleshooting).
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
    يدعم macOS وLinux (بما في ذلك WSL).
  </Step>
  <Step title="ضمان Node.js 24 افتراضيًا">
    يتحقق من إصدار Node ويثبّت Node 24 عند الحاجة (Homebrew على macOS، وسكربتات إعداد NodeSource على Linux apt/dnf/yum). على macOS، لا يتم تثبيت Homebrew إلا عندما يحتاجه المثبّت من أجل Node أو Git. لا يزال OpenClaw يدعم Node 22 LTS، حاليًا `22.19+`، للتوافق.
    على Alpine/musl Linux، يستخدم المثبّت حزم apk بدلًا من NodeSource؛ يجب أن توفّر مستودعات Alpine المضبوطة Node `22.19+` (Alpine 3.21 أو أحدث وقت كتابة هذا النص).
  </Step>
  <Step title="ضمان Git">
    يثبّت Git إذا كان مفقودًا باستخدام مدير الحزم المكتشف، بما في ذلك Homebrew على macOS وapk على Alpine.
  </Step>
  <Step title="تثبيت OpenClaw">
    - طريقة `npm` (افتراضيًا): تثبيت npm عام
    - طريقة `git`: استنساخ/تحديث المستودع، وتثبيت الاعتماديات باستخدام pnpm، والبناء، ثم تثبيت الغلاف في `~/.local/bin/openclaw`

  </Step>
  <Step title="مهام ما بعد التثبيت">
    - يحدّث خدمة gateway محمّلة بأفضل جهد (`openclaw gateway install --force`، ثم إعادة التشغيل)
    - يشغّل `openclaw doctor --non-interactive` عند الترقيات وتثبيتات git (بأفضل جهد)
    - يحاول تشغيل الإعداد الأولي عند ملاءمة ذلك (توفر TTY، وعدم تعطيل الإعداد الأولي، ونجاح فحوصات bootstrap/config)

  </Step>
</Steps>

### اكتشاف checkout المصدر

إذا شُغّل داخل checkout لـ OpenClaw (`package.json` + `pnpm-workspace.yaml`)، يقدّم السكربت:

- استخدام checkout (`git`)، أو
- استخدام التثبيت العام (`npm`)

إذا لم تكن TTY متاحة ولم تُضبط طريقة تثبيت، فسيستخدم `npm` افتراضيًا ويعرض تحذيرًا.

ينهي السكربت التنفيذ بالرمز `2` عند اختيار طريقة غير صالحة أو قيم `--install-method` غير صالحة.

### أمثلة (install.sh)

<Tabs>
  <Tab title="افتراضي">
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
  <Tab title="GitHub main checkout">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
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

| العلامة                               | الوصف                                                |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | اختر طريقة التثبيت (افتراضيًا: `npm`). الاسم البديل: `--method`  |
| `--npm`                               | اختصار لطريقة npm                                    |
| `--git`                               | اختصار لطريقة git. الاسم البديل: `--github`                 |
| `--version <version\|dist-tag\|spec>` | إصدار npm، أو dist-tag، أو مواصفة الحزمة (افتراضيًا: `latest`) |
| `--beta`                              | استخدام beta dist-tag إن كان متاحًا، وإلا الرجوع إلى `latest`  |
| `--git-dir <path>`                    | دليل checkout (افتراضيًا: `~/openclaw`). الاسم البديل: `--dir` |
| `--no-git-update`                     | تخطي `git pull` لـ checkout موجود                      |
| `--no-prompt`                         | تعطيل المطالبات                                            |
| `--no-onboard`                        | تخطي الإعداد الأولي                                            |
| `--onboard`                           | تفعيل الإعداد الأولي                                          |
| `--dry-run`                           | طباعة الإجراءات دون تطبيق التغييرات                     |
| `--verbose`                           | تفعيل مخرجات التصحيح (`set -x`، وسجلات npm بمستوى notice)      |
| `--help`                              | عرض الاستخدام (`-h`)                                          |

  </Accordion>

  <Accordion title="مرجع متغيرات البيئة">

| المتغير                                           | الوصف                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | طريقة التثبيت                                                     |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | إصدار npm، أو dist-tag، أو مواصفة الحزمة                             |
| `OPENCLAW_BETA=0\|1`                              | استخدام beta إذا كان متاحًا                                              |
| `OPENCLAW_HOME=<path>`                            | الدليل الأساسي لحالة OpenClaw ومسارات git/الإعداد الأولي الافتراضية |
| `OPENCLAW_GIT_DIR=<path>`                         | دليل checkout                                                 |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | تبديل تحديثات git                                                 |
| `OPENCLAW_NO_PROMPT=1`                            | تعطيل المطالبات                                                    |
| `OPENCLAW_NO_ONBOARD=1`                           | تخطي الإعداد الأولي                                                    |
| `OPENCLAW_DRY_RUN=1`                              | وضع التشغيل التجريبي                                                       |
| `OPENCLAW_VERBOSE=1`                              | وضع التصحيح                                                         |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | مستوى سجل npm                                                      |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
مصمم للبيئات التي تريد فيها وضع كل شيء تحت بادئة محلية
(افتراضيًا `~/.openclaw`) ودون اعتماد على Node في النظام. يدعم تثبيتات npm
افتراضيًا، بالإضافة إلى تثبيتات git-checkout ضمن تدفق البادئة نفسه.
</Info>

### التدفق (install-cli.sh)

<Steps>
  <Step title="تثبيت وقت تشغيل Node محلي">
    ينزّل أرشيف tarball مثبتًا ومدعومًا من Node LTS (الإصدار مضمن في السكربت ويُحدّث بشكل مستقل) إلى `<prefix>/tools/node-v<version>` ويتحقق من SHA-256.
    على Alpine/musl Linux، حيث لا ينشر Node أرشيفات tarball متوافقة مع وقت التشغيل المثبت، يثبّت `nodejs` و`npm` باستخدام `apk` ويربط وقت التشغيل هذا بمسار غلاف البادئة. يجب أن توفّر مستودعات Alpine إصدار Node `22.19+`؛ استخدم Alpine 3.21 أو أحدث إذا كانت المستودعات الأقدم لا توفّر إلا Node 20 أو 21.
  </Step>
  <Step title="ضمان Git">
    إذا كان Git مفقودًا، يحاول تثبيته عبر apt/dnf/yum/apk على Linux أو Homebrew على macOS.
  </Step>
  <Step title="تثبيت OpenClaw تحت البادئة">
    - طريقة `npm` (افتراضيًا): تثبّت تحت البادئة باستخدام npm، ثم تكتب الغلاف إلى `<prefix>/bin/openclaw`
    - طريقة `git`: تستنسخ/تحدّث checkout (افتراضيًا `~/openclaw`) ولا تزال تكتب الغلاف إلى `<prefix>/bin/openclaw`

  </Step>
  <Step title="تحديث خدمة gateway المحمّلة">
    إذا كانت خدمة gateway محمّلة بالفعل من البادئة نفسها، يشغّل السكربت
    `openclaw gateway install --force`، ثم `openclaw gateway restart`، و
    يتحقق من صحة gateway بأفضل جهد.
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

| العلم                       | الوصف                                                                 |
| --------------------------- | --------------------------------------------------------------------- |
| `--prefix <path>`           | بادئة التثبيت (الافتراضي: `~/.openclaw`)                              |
| `--install-method npm\|git` | اختر طريقة التثبيت (الافتراضي: `npm`). الاسم البديل: `--method`        |
| `--npm`                     | اختصار لطريقة npm                                                      |
| `--git`, `--github`         | اختصار لطريقة git                                                      |
| `--git-dir <path>`          | دليل سحب Git (الافتراضي: `~/openclaw`). الاسم البديل: `--dir`          |
| `--version <ver>`           | إصدار OpenClaw أو وسم التوزيع (الافتراضي: `latest`)                    |
| `--node-version <ver>`      | إصدار Node (الافتراضي: `22.22.0`)                                     |
| `--json`                    | إصدار أحداث NDJSON                                                     |
| `--onboard`                 | تشغيل `openclaw onboard` بعد التثبيت                                   |
| `--no-onboard`              | تخطي الإعداد الأولي (الافتراضي)                                        |
| `--set-npm-prefix`          | على Linux، فرض بادئة npm إلى `~/.npm-global` إذا كانت البادئة الحالية غير قابلة للكتابة |
| `--help`                    | عرض الاستخدام (`-h`)                                                   |

  </Accordion>

  <Accordion title="مرجع متغيرات البيئة">

| المتغير                                     | الوصف                                                            |
| ------------------------------------------- | ---------------------------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | بادئة التثبيت                                                    |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | طريقة التثبيت                                                    |
| `OPENCLAW_VERSION=<ver>`                    | إصدار OpenClaw أو وسم التوزيع                                    |
| `OPENCLAW_NODE_VERSION=<ver>`               | إصدار Node                                                       |
| `OPENCLAW_HOME=<path>`                      | الدليل الأساسي لحالة OpenClaw ومسارات git/الإعداد الأولي الافتراضية |
| `OPENCLAW_GIT_DIR=<path>`                   | دليل سحب Git لتثبيتات git                                        |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | تبديل تحديثات git للسحوبات الموجودة                              |
| `OPENCLAW_NO_ONBOARD=1`                     | تخطي الإعداد الأولي                                              |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | مستوى سجل npm                                                    |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### التدفق (install.ps1)

<Steps>
  <Step title="التأكد من بيئة PowerShell + Windows">
    يتطلب PowerShell 5+.
  </Step>
  <Step title="التأكد من Node.js 24 افتراضيا">
    إذا كان مفقودا، يحاول التثبيت عبر winget، ثم Chocolatey، ثم Scoop. إذا لم يكن أي مدير حزم متاحا، ينزل السكربت ملف zip الرسمي لـ Node.js على Windows إلى `%LOCALAPPDATA%\OpenClaw\deps\portable-node` ويضيفه إلى PATH للعملية الحالية والمستخدم. يظل Node 22 LTS، حاليا `22.19+`، مدعوما للتوافق.
  </Step>
  <Step title="تثبيت OpenClaw">
    - طريقة `npm` (الافتراضية): تثبيت npm عالمي باستخدام `-Tag` المحدد، ويشغل من دليل مؤقت قابل للكتابة للمثبت لكي تظل الأصداف المفتوحة في مجلدات محمية مثل `C:\` تعمل
    - طريقة `git`: استنساخ/تحديث المستودع، التثبيت/البناء باستخدام pnpm، وتثبيت المغلف في `%USERPROFILE%\.local\bin\openclaw.cmd`. إذا كان Git مفقودا، يمهد السكربت MinGit محليا للمستخدم ضمن `%LOCALAPPDATA%\OpenClaw\deps\portable-git` ويضيفه إلى PATH للعملية الحالية والمستخدم.

  </Step>
  <Step title="مهام ما بعد التثبيت">
    - يضيف دليل bin المطلوب إلى PATH المستخدم عندما يكون ذلك ممكنا
    - ينعش خدمة Gateway محملة بأفضل جهد (`openclaw gateway install --force`، ثم إعادة التشغيل)
    - يشغل `openclaw doctor --non-interactive` عند الترقيات وتثبيتات git (بأفضل جهد)

  </Step>
  <Step title="معالجة حالات الفشل">
    تثبيتات `iwr ... | iex` وscriptblock تبلغ عن خطأ منته دون إغلاق جلسة PowerShell الحالية. تثبيتات `powershell -File` / `pwsh -File` المباشرة لا تزال تخرج برمز غير صفري للأتمتة.
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
  <Tab title="سحب GitHub main">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
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
  <Tab title="تتبع تصحيح الأخطاء">
    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="مرجع الأعلام">

| العلم                       | الوصف                                                       |
| --------------------------- | ----------------------------------------------------------- |
| `-InstallMethod npm\|git`   | طريقة التثبيت (الافتراضي: `npm`)                            |
| `-Tag <tag\|version\|spec>` | وسم توزيع npm أو الإصدار أو مواصفة الحزمة (الافتراضي: `latest`) |
| `-GitDir <path>`            | دليل السحب (الافتراضي: `%USERPROFILE%\openclaw`)            |
| `-NoOnboard`                | تخطي الإعداد الأولي                                         |
| `-NoGitUpdate`              | تخطي `git pull`                                             |
| `-DryRun`                   | طباعة الإجراءات فقط                                         |

  </Accordion>

  <Accordion title="مرجع متغيرات البيئة">

| المتغير                            | الوصف              |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | طريقة التثبيت      |
| `OPENCLAW_GIT_DIR=<path>`          | دليل السحب         |
| `OPENCLAW_NO_ONBOARD=1`            | تخطي الإعداد الأولي |
| `OPENCLAW_GIT_UPDATE=0`            | تعطيل git pull     |
| `OPENCLAW_DRY_RUN=1`               | وضع التشغيل التجريبي |

  </Accordion>
</AccordionGroup>

<Note>
إذا استُخدم `-InstallMethod git` وكان Git مفقودا، يحاول السكربت تمهيد MinGit محليا للمستخدم قبل طباعة رابط Git for Windows.
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
    Git مطلوب لطريقة تثبيت `git`. بالنسبة إلى تثبيتات `npm`، لا يزال Git يُفحص/يُثبت لتجنب حالات فشل `spawn git ENOENT` عندما تستخدم التبعيات عناوين URL من git.
  </Accordion>

  <Accordion title="لماذا يصادف npm خطأ EACCES على Linux؟">
    تشير بعض إعدادات Linux ببادئة npm العالمية إلى مسارات مملوكة للمستخدم root. يمكن لـ `install.sh` تبديل البادئة إلى `~/.npm-global` وإلحاق تصديرات PATH بملفات rc الخاصة بالصدفة (عندما تكون تلك الملفات موجودة).
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    أعد تشغيل المثبت لكي يتمكن من تمهيد MinGit محليا للمستخدم، أو ثبت Git for Windows وأعد فتح PowerShell.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    شغل `npm config get prefix` وأضف ذلك الدليل إلى PATH المستخدم لديك (لا حاجة إلى لاحقة `\bin` على Windows)، ثم أعد فتح PowerShell.
  </Accordion>

  <Accordion title="Windows: كيفية الحصول على خرج مثبت مفصل">
    لا يعرض `install.ps1` حاليا مفتاح `-Verbose`.
    استخدم تتبع PowerShell لتشخيصات مستوى السكربت:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw غير موجود بعد التثبيت">
    عادة ما تكون المشكلة متعلقة بـ PATH. راجع [استكشاف أخطاء Node.js وإصلاحها](/ar/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install)
- [التحديث](/ar/install/updating)
- [إلغاء التثبيت](/ar/install/uninstall)

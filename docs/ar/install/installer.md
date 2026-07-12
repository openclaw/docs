---
read_when:
    - تريد فهم `openclaw.ai/install.sh`
    - تريد أتمتة عمليات التثبيت (CI / دون واجهة رسومية)
    - تريد التثبيت من نسخة مستنسخة من GitHub
summary: كيفية عمل البرامج النصية للتثبيت (`install.sh` و`install-cli.sh` و`install.ps1`)، والعلامات، والأتمتة
title: البنية الداخلية لبرنامج التثبيت
x-i18n:
    generated_at: "2026-07-12T06:04:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 59b38a2eecbf15cc966beada81acf1824229a3825c73ae33ea0f8e89612bdf5b
    source_path: install/installer.md
    workflow: 16
---

يوفّر OpenClaw ثلاثة نصوص برمجية للتثبيت، تُقدَّم من `openclaw.ai`.

| النص البرمجي                         | المنصة                 | ما يفعله                                                                                                  |
| ------------------------------------ | ---------------------- | --------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)           | macOS / Linux / WSL    | يثبّت Node عند الحاجة، ويثبّت OpenClaw عبر npm (افتراضيًا) أو git، ويمكنه تشغيل الإعداد الأولي.           |
| [`install-cli.sh`](#install-clish)   | macOS / Linux / WSL    | يثبّت Node وOpenClaw ضمن بادئة محلية (`~/.openclaw`) عبر npm أو git. لا يتطلب صلاحيات الجذر.             |
| [`install.ps1`](#installps1)         | Windows (PowerShell)   | يثبّت Node عند الحاجة، ويثبّت OpenClaw عبر npm (افتراضيًا) أو git، ويمكنه تشغيل الإعداد الأولي.           |

تدعم النصوص البرمجية الثلاثة Node بالإصدارات **22.19+ أو 23.11+ أو 24+**؛ ويُعد Node 24 الهدف الافتراضي لعمليات التثبيت الجديدة.

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
إذا نجح التثبيت ولكن تعذّر العثور على `openclaw` في طرفية جديدة، فراجع [استكشاف أخطاء Node.js وإصلاحها](/ar/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
موصى به لمعظم عمليات التثبيت التفاعلية على macOS وLinux وWSL.
</Tip>

### سير العمل (install.sh)

<Steps>
  <Step title="اكتشاف نظام التشغيل">
    يدعم macOS وLinux (بما في ذلك WSL).
  </Step>
  <Step title="ضمان توفر Node.js 24 افتراضيًا">
    يتحقق من إصدار Node ويثبّت Node 24 عند الحاجة (عبر Homebrew على macOS، ونصوص إعداد NodeSource على توزيعات Linux التي تستخدم apt أو dnf أو yum). على macOS، لا يُثبَّت Homebrew إلا عندما يحتاج إليه برنامج التثبيت لتثبيت Node أو Git. يظل Node 22.19+ و23.11+ مدعومين للتوافق.
    على Alpine/Linux الذي يستخدم musl، يستخدم برنامج التثبيت حزم apk بدلًا من NodeSource؛ ويجب أن توفّر مستودعات Alpine المُعدّة إصدارًا مدعومًا من Node (Alpine 3.21 أو أحدث وقت كتابة هذه الوثيقة).
  </Step>
  <Step title="ضمان توفر Git">
    يثبّت Git إذا كان مفقودًا باستخدام مدير الحزم المكتشف، بما في ذلك Homebrew على macOS وapk على Alpine.
  </Step>
  <Step title="تثبيت OpenClaw">
    - طريقة `npm` (الافتراضية): تثبيت npm عمومي
    - طريقة `git`: استنساخ المستودع أو تحديثه، وتثبيت الاعتماديات باستخدام pnpm، والبناء، ثم تثبيت الغلاف في `~/.local/bin/openclaw`

  </Step>
  <Step title="مهام ما بعد التثبيت">
    - يحدّد ملف `openclaw` التنفيذي الذي ثُبّت للتو لاستخدامه في الأوامر اللاحقة
    - عند عدم تهيئة التثبيت، يبدأ الإعداد الأولي قبل فحوصات doctor أو Gateway. عند استخدام `--no-onboard` أو عدم توفر TTY، يطبع الأمر اللازم لإكمال الإعداد لاحقًا.
    - عند تهيئة التثبيت، يحدّث خدمة Gateway المحمّلة ويعيد تشغيلها بأفضل جهد ممكن، ثم يشغّل doctor. تحدّث الترقيات Plugins عندما يكون ذلك ممكنًا، أو تطبع الأمر اليدوي في تشغيل دون واجهة مع تمكين المطالبات.
    - عند تشغيل `--verify`، يتحقق من الإصدار المثبّت، ولا يتحقق من سلامة Gateway إلا بعد وجود التهيئة.

  </Step>
</Steps>

### اكتشاف نسخة العمل المصدرية

إذا شُغّل النص البرمجي داخل نسخة عمل من OpenClaw (`package.json` + `pnpm-workspace.yaml`)، فإنه يعرض:

- استخدام نسخة العمل (`git`)، أو
- استخدام التثبيت العمومي (`npm`)

إذا لم يتوفر TTY ولم تُحدَّد طريقة تثبيت، يستخدم `npm` افتراضيًا ويعرض تحذيرًا.

ينتهي النص البرمجي برمز الخروج `2` عند اختيار طريقة غير صالحة أو تمرير قيم غير صالحة إلى `--install-method`.

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
  <Tab title="التثبيت عبر Git">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="نسخة عمل الفرع main من GitHub">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="تشغيل تجريبي">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
  <Tab title="التحقق بعد التثبيت">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard --verify
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="مرجع العلامات">

| العلامة                                 | الوصف                                                                                  |
| --------------------------------------- | -------------------------------------------------------------------------------------- |
| `--install-method \| --method npm\|git` | اختيار طريقة التثبيت (الافتراضي: `npm`)                                                |
| `--npm`                                 | اختصار لطريقة npm                                                                      |
| `--git \| --github`                     | اختصار لطريقة git                                                                      |
| `--version <version\|dist-tag\|spec>`   | إصدار npm أو وسم التوزيع أو مواصفات الحزمة (الافتراضي: `latest`)                       |
| `--beta`                                | استخدام وسم التوزيع التجريبي إن كان متاحًا، وإلا فالرجوع إلى `latest`                  |
| `--git-dir \| --dir <path>`             | دليل نسخة العمل (الافتراضي: `~/openclaw`)                                              |
| `--no-git-update`                       | تخطي `git pull` لنسخة العمل الموجودة                                                   |
| `--no-prompt`                           | تعطيل المطالبات                                                                        |
| `--no-onboard`                          | تخطي الإعداد الأولي                                                                    |
| `--onboard`                             | تمكين الإعداد الأولي                                                                   |
| `--verify`                              | تشغيل تحقق دخاني بعد التثبيت (`--version` وسلامة Gateway إذا كانت محمّلة)              |
| `--dry-run`                             | طباعة الإجراءات دون تطبيق التغييرات                                                    |
| `--verbose`                             | تمكين مخرجات تصحيح الأخطاء (`set -x` وسجلات npm بمستوى notice)                         |
| `--help \| -h`                          | عرض طريقة الاستخدام                                                                    |

  </Accordion>

  <Accordion title="مرجع متغيرات البيئة">

| المتغير                                           | الوصف                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | طريقة التثبيت                                                            |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | إصدار npm أو وسم التوزيع أو مواصفات الحزمة                              |
| `OPENCLAW_BETA=0\|1`                              | استخدام الإصدار التجريبي إن كان متاحًا                                  |
| `OPENCLAW_HOME=<path>`                            | الدليل الأساسي لحالة OpenClaw ومسارات git والإعداد الأولي الافتراضية    |
| `OPENCLAW_GIT_DIR=<path>`                         | دليل نسخة العمل                                                          |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | تبديل تحديثات git                                                        |
| `OPENCLAW_NO_PROMPT=1`                            | تعطيل المطالبات                                                          |
| `OPENCLAW_VERIFY_INSTALL=1`                       | تشغيل التحقق الدخاني بعد التثبيت                                         |
| `OPENCLAW_NO_ONBOARD=1`                           | تخطي الإعداد الأولي                                                      |
| `OPENCLAW_DRY_RUN=1`                              | وضع التشغيل التجريبي                                                     |
| `OPENCLAW_VERBOSE=1`                              | وضع تصحيح الأخطاء                                                        |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | مستوى سجل npm (الافتراضي: `error`، ويخفي ضوضاء إشعارات الإهمال من npm)   |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
مصمم للبيئات التي تريد فيها وضع كل شيء ضمن بادئة محلية
(الافتراضية `~/.openclaw`) دون اعتماد على Node على مستوى النظام. يدعم تثبيتات npm
افتراضيًا، بالإضافة إلى تثبيتات نسخة العمل عبر git ضمن سير عمل البادئة نفسه.
</Info>

### سير العمل (install-cli.sh)

<Steps>
  <Step title="تثبيت بيئة تشغيل Node محلية">
    ينزّل أرشيف tar مثبت الإصدار ومدعومًا من Node LTS (الإصدار مضمّن في النص البرمجي ويُحدَّث بشكل مستقل، والافتراضي `22.22.2`) إلى `<prefix>/tools/node-v<version>` ويتحقق من SHA-256.
    على Alpine/Linux الذي يستخدم musl، حيث لا ينشر Node أرشيفات tar متوافقة مع بيئة التشغيل مثبتة الإصدار، يثبّت `nodejs` و`npm` باستخدام `apk` ويربط بيئة التشغيل تلك بمسار غلاف البادئة. يجب أن توفّر مستودعات Alpine إصدارًا مدعومًا من Node (22.19+ أو 23.11+ أو 24+)؛ استخدم Alpine 3.21 أو أحدث إذا كانت المستودعات الأقدم لا توفّر سوى Node 20 أو 21.
  </Step>
  <Step title="ضمان توفر Git">
    إذا كان Git مفقودًا، يحاول تثبيته عبر apt أو dnf أو yum أو apk على Linux، أو Homebrew على macOS.
  </Step>
  <Step title="تثبيت OpenClaw ضمن البادئة">
    - طريقة `npm` (الافتراضية): تثبّته ضمن البادئة باستخدام npm، ثم تكتب الغلاف في `<prefix>/bin/openclaw`
    - طريقة `git`: تستنسخ نسخة عمل أو تحدّثها (الافتراضي `~/openclaw`)، وتظل تكتب الغلاف في `<prefix>/bin/openclaw`

  </Step>
  <Step title="تحديث خدمة Gateway المحمّلة">
    إذا كانت خدمة Gateway محمّلة بالفعل من البادئة نفسها، يشغّل النص البرمجي
    `openclaw gateway install --force`، ثم `openclaw gateway restart`،
    ويفحص سلامة Gateway بأفضل جهد ممكن.
  </Step>
</Steps>

### أمثلة (install-cli.sh)

<Tabs>
  <Tab title="الافتراضي">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="بادئة وإصدار مخصصان">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="التثبيت عبر Git">
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

| العَلَم                                    | الوصف                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`                       | بادئة التثبيت (الافتراضي: `~/.openclaw`)                                         |
| `--install-method \| --method npm\|git` | اختيار طريقة التثبيت (الافتراضي: `npm`)                                          |
| `--npm`                                 | اختصار لطريقة npm                                                         |
| `--git \| --github`                     | اختصار لطريقة git                                                         |
| `--git-dir \| --dir <path>`             | دليل نسخة Git العاملة (الافتراضي: `~/openclaw`)                                  |
| `--version <ver>`                       | إصدار OpenClaw أو وسم التوزيع (الافتراضي: `latest`)                                |
| `--node-version <ver>`                  | إصدار Node (الافتراضي: `22.22.2`)                                               |
| `--json`                                | إخراج أحداث NDJSON                                                              |
| `--onboard`                             | تشغيل `openclaw onboard` بعد التثبيت                                            |
| `--no-onboard`                          | تخطي الإعداد الأولي (الافتراضي)                                                       |
| `--set-npm-prefix`                      | على Linux، فرض بادئة npm على `~/.npm-global` إذا كانت البادئة الحالية غير قابلة للكتابة |
| `--help \| -h`                          | عرض طريقة الاستخدام                                                                      |

  </Accordion>

  <Accordion title="مرجع متغيرات البيئة">

| المتغير                                    | الوصف                                                        |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | بادئة التثبيت                                                     |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | طريقة التثبيت                                                     |
| `OPENCLAW_VERSION=<ver>`                    | إصدار OpenClaw أو وسم التوزيع                                       |
| `OPENCLAW_NODE_VERSION=<ver>`               | إصدار Node                                                       |
| `OPENCLAW_HOME=<path>`                      | الدليل الأساسي لحالة OpenClaw ومسارات git والإعداد الأولي الافتراضية |
| `OPENCLAW_GIT_DIR=<path>`                   | دليل نسخة Git العاملة لعمليات التثبيت عبر git                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | تبديل تحديثات git لنسخ العمل الحالية                          |
| `OPENCLAW_NO_ONBOARD=1`                     | تخطي الإعداد الأولي                                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | مستوى سجل npm (الافتراضي: `error`)                                   |

  </Accordion>
</AccordionGroup>

<Note>
لا تُعد `openclaw@main` ومواصفات مصدر GitHub الأخرى أهدافًا صالحة للخيار `--version` في عمليات التثبيت عبر npm. استخدم بدلًا منها `--install-method git --version main`.
</Note>

---

<a id="installps1"></a>

## install.ps1

### سير العمل (install.ps1)

<Steps>
  <Step title="التأكد من بيئة PowerShell وWindows">
    يتطلب PowerShell 5 أو أحدث.
  </Step>
  <Step title="التأكد من توفر Node.js 24 افتراضيًا">
    إذا لم يكن متوفرًا، يحاول تثبيته عبر winget، ثم Chocolatey، ثم Scoop. إذا لم يتوفر أي مدير حزم، ينزّل البرنامج النصي ملف zip الرسمي لـ Node.js 24 على Windows إلى `%LOCALAPPDATA%\OpenClaw\deps\portable-node` ويضيفه إلى PATH للعملية الحالية والمستخدم. يظل الإصداران Node 22.19+ و23.11+ مدعومين لأغراض التوافق.
  </Step>
  <Step title="تثبيت OpenClaw">
    - طريقة `npm` (الافتراضية): تثبيت npm عام باستخدام `-Tag` المحدد، ويُشغّل من دليل مؤقت قابل للكتابة للمثبّت، بحيث تظل الصدفات المفتوحة في مجلدات محمية مثل `C:\` قابلة للعمل
    - طريقة `git`: استنساخ المستودع أو تحديثه، ثم التثبيت والبناء باستخدام pnpm، وتثبيت الغلاف في `%USERPROFILE%\.local\bin\openclaw.cmd`. إذا لم يكن Git متوفرًا، يُمهّد البرنامج النصي MinGit محليًا للمستخدم ضمن `%LOCALAPPDATA%\OpenClaw\deps\portable-git` ويضيفه إلى PATH للعملية الحالية والمستخدم.

  </Step>
  <Step title="مهام ما بعد التثبيت">
    - إضافة دليل الملفات التنفيذية المطلوب إلى PATH الخاص بالمستخدم متى أمكن
    - تحديث خدمة Gateway المحمّلة بأفضل جهد ممكن (`openclaw gateway install --force`، ثم إعادة التشغيل)
    - تشغيل `openclaw doctor --non-interactive` عند الترقيات وعمليات التثبيت عبر git (بأفضل جهد ممكن)

  </Step>
  <Step title="معالجة حالات الفشل">
    تُبلّغ عمليات التثبيت باستخدام `iwr ... | iex` وكتلة البرنامج النصي عن خطأ مُنهٍ دون إغلاق جلسة PowerShell الحالية. أما عمليات التثبيت المباشرة باستخدام `powershell -File` / `pwsh -File` فتظل تنهي التنفيذ برمز غير صفري لأغراض الأتمتة.
  </Step>
</Steps>

### أمثلة (install.ps1)

<Tabs>
  <Tab title="الافتراضي">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="التثبيت عبر Git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="نسخة العمل الرئيسية من GitHub">
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
</Tabs>

<AccordionGroup>
  <Accordion title="مرجع الأعلام">

| العَلَم                        | الوصف                                                |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | طريقة التثبيت (الافتراضي: `npm`)                            |
| `-Tag <tag\|version\|spec>` | وسم توزيع npm أو الإصدار أو مواصفة الحزمة (الافتراضي: `latest`) |
| `-GitDir <path>`            | دليل نسخة العمل (الافتراضي: `%USERPROFILE%\openclaw`)     |
| `-NoOnboard`                | تخطي الإعداد الأولي                                            |
| `-NoGitUpdate`              | تخطي `git pull`                                            |
| `-DryRun`                   | طباعة الإجراءات فقط                                         |

  </Accordion>

  <Accordion title="مرجع متغيرات البيئة">

| المتغير                           | الوصف        |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | طريقة التثبيت     |
| `OPENCLAW_GIT_DIR=<path>`          | دليل نسخة العمل |
| `OPENCLAW_NO_ONBOARD=1`            | تخطي الإعداد الأولي    |
| `OPENCLAW_GIT_UPDATE=0`            | تعطيل git pull   |
| `OPENCLAW_DRY_RUN=1`               | وضع التشغيل التجريبي       |

  </Accordion>
</AccordionGroup>

<Note>
إذا استُخدم `-InstallMethod git` ولم يكن Git متوفرًا، يحاول البرنامج النصي تمهيد MinGit محليًا للمستخدم قبل طباعة رابط Git for Windows.
</Note>

---

## التكامل المستمر والأتمتة

استخدم الأعلام ومتغيرات البيئة غير التفاعلية للحصول على عمليات تشغيل يمكن التنبؤ بها.

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
  <Accordion title="لماذا يلزم Git؟">
    يلزم Git لطريقة التثبيت `git`. وبالنسبة إلى عمليات التثبيت عبر `npm`، يستمر التحقق من Git أو تثبيته لتجنب حالات فشل `spawn git ENOENT` عندما تستخدم التبعيات عناوين URL لـ git.
  </Accordion>

  <Accordion title="لماذا يواجه npm الخطأ EACCES على Linux؟">
    تشير بعض إعدادات Linux ببادئة npm العامة إلى مسارات مملوكة للمستخدم الجذر. يمكن لـ `install.sh` تبديل البادئة إلى `~/.npm-global` وإلحاق عمليات تصدير PATH بملفات rc الخاصة بالصدفة (عند وجود تلك الملفات).
  </Accordion>

  <Accordion title='Windows: "خطأ npm: spawn git / ENOENT"'>
    أعد تشغيل المثبّت ليتمكن من تمهيد MinGit محليًا للمستخدم، أو ثبّت Git for Windows وأعد فتح PowerShell.
  </Accordion>

  <Accordion title='Windows: "لم يتم التعرف على openclaw"'>
    شغّل `npm config get prefix` وأضف ذلك الدليل إلى PATH الخاص بالمستخدم (لا حاجة إلى اللاحقة `\bin` على Windows)، ثم أعد فتح PowerShell.
  </Accordion>

  <Accordion title="Windows: كيفية الحصول على مخرجات تفصيلية للمثبّت">
    لا يوفر `install.ps1` مفتاح `-Verbose`.
    استخدم تتبع PowerShell لتشخيصات مستوى البرنامج النصي:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="تعذر العثور على openclaw بعد التثبيت">
    عادةً ما تكون المشكلة في PATH. راجع [استكشاف أخطاء Node.js وإصلاحها](/ar/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install)
- [التحديث](/ar/install/updating)
- [إلغاء التثبيت](/ar/install/uninstall)

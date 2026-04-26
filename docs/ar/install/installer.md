---
read_when:
    - أنت تريد فهم `openclaw.ai/install.sh`
    - أنت تريد أتمتة التثبيتات (CI / بدون واجهة)
    - أنت تريد التثبيت من GitHub checkout
summary: كيف تعمل سكربتات التثبيت (`install.sh` و`install-cli.sh` و`install.ps1`)، والأعلام، والأتمتة
title: الآليات الداخلية للمثبّت
x-i18n:
    generated_at: "2026-04-26T11:33:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1f932fb3713e8ecfa75215b05d7071b3b75e6d1135d7c326313739f294023e2
    source_path: install/installer.md
    workflow: 15
---

يشحن OpenClaw ثلاثة سكربتات تثبيت، تُقدَّم من `openclaw.ai`.

| السكربت                             | المنصة             | ما الذي يفعله                                                                                                   |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | يثبّت Node عند الحاجة، ويثبّت OpenClaw عبر npm (افتراضيًا) أو git، ويمكنه تشغيل التهيئة الأولى.                   |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | يثبّت Node + OpenClaw داخل بادئة محلية (`~/.openclaw`) باستخدام npm أو أوضاع git checkout. لا يتطلب root. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | يثبّت Node عند الحاجة، ويثبّت OpenClaw عبر npm (افتراضيًا) أو git، ويمكنه تشغيل التهيئة الأولى.                   |

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
إذا نجح التثبيت لكن لم يتم العثور على `openclaw` في نافذة طرفية جديدة، فراجع [Node.js troubleshooting](/ar/install/node#troubleshooting).
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
    يدعم macOS وLinux (بما في ذلك WSL). وإذا تم اكتشاف macOS، فسيثبّت Homebrew إذا كان مفقودًا.
  </Step>
  <Step title="ضمان Node.js 24 افتراضيًا">
    يتحقق من إصدار Node ويثبّت Node 24 عند الحاجة (Homebrew على macOS، وسكربتات إعداد NodeSource على Linux ‏apt/dnf/yum). وما يزال OpenClaw يدعم Node 22 LTS، حاليًا `22.14+`، للتوافق.
  </Step>
  <Step title="ضمان Git">
    يثبّت Git إذا كان مفقودًا.
  </Step>
  <Step title="تثبيت OpenClaw">
    - طريقة `npm` (الافتراضية): تثبيت npm عالمي
    - طريقة `git`: استنساخ/تحديث المستودع، وتثبيت الاعتماديات باستخدام pnpm، والبناء، ثم تثبيت wrapper عند `~/.local/bin/openclaw`
  </Step>
  <Step title="مهام ما بعد التثبيت">
    - يحدّث خدمة gateway المحمّلة بأفضل جهد (`openclaw gateway install --force`، ثم إعادة التشغيل)
    - يشغّل `openclaw doctor --non-interactive` عند الترقيات وتثبيتات git (best effort)
    - يحاول تشغيل التهيئة الأولى عندما يكون ذلك مناسبًا (وجود TTY، وعدم تعطيل التهيئة الأولى، واجتياز فحوصات bootstrap/config)
    - يضبط افتراضيًا `SHARP_IGNORE_GLOBAL_LIBVIPS=1`
  </Step>
</Steps>

### اكتشاف source checkout

إذا تم تشغيله داخل OpenClaw checkout ‏(`package.json` + `pnpm-workspace.yaml`)، فسيعرض السكربت:

- استخدام checkout ‏(`git`)، أو
- استخدام التثبيت العالمي (`npm`)

إذا لم يكن TTY متاحًا ولم يتم ضبط طريقة تثبيت، فسيستخدم `npm` افتراضيًا مع تحذير.

يخرج السكربت بالرمز `2` عند اختيار طريقة غير صالحة أو عند تمرير قيم غير صالحة إلى `--install-method`.

### أمثلة (install.sh)

<Tabs>
  <Tab title="الافتراضي">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="تخطي التهيئة الأولى">
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
  <Accordion title="مرجع الأعلام">

| العلم                                  | الوصف                                                |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | اختر طريقة التثبيت (الافتراضي: `npm`). الاسم البديل: `--method`  |
| `--npm`                               | اختصار لطريقة npm                                    |
| `--git`                               | اختصار لطريقة git. الاسم البديل: `--github`                 |
| `--version <version\|dist-tag\|spec>` | إصدار npm، أو dist-tag، أو package spec (الافتراضي: `latest`) |
| `--beta`                              | استخدم beta dist-tag إذا كان متاحًا، وإلا فارجع إلى `latest`  |
| `--git-dir <path>`                    | دليل checkout (الافتراضي: `~/openclaw`). الاسم البديل: `--dir` |
| `--no-git-update`                     | تخطَّ `git pull` للـ checkout الموجودة                      |
| `--no-prompt`                         | عطّل المطالبات                                            |
| `--no-onboard`                        | تخطَّ التهيئة الأولى                                            |
| `--onboard`                           | فعّل التهيئة الأولى                                          |
| `--dry-run`                           | اطبع الإجراءات من دون تطبيق التغييرات                     |
| `--verbose`                           | فعّل مخرجات التصحيح (`set -x`، وسجلات npm بمستوى notice)      |
| `--help`                              | اعرض الاستخدام (`-h`)                                          |

  </Accordion>

  <Accordion title="مرجع متغيرات البيئة">

| المتغير                                                | الوصف                                   |
| ------------------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | طريقة التثبيت                                |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | إصدار npm، أو dist-tag، أو package spec        |
| `OPENCLAW_BETA=0\|1`                                    | استخدم beta إذا كان متاحًا                         |
| `OPENCLAW_GIT_DIR=<path>`                               | دليل checkout                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | تبديل تحديثات git                            |
| `OPENCLAW_NO_PROMPT=1`                                  | تعطيل المطالبات                               |
| `OPENCLAW_NO_ONBOARD=1`                                 | تخطي التهيئة الأولى                               |
| `OPENCLAW_DRY_RUN=1`                                    | وضع التشغيل التجريبي                                  |
| `OPENCLAW_VERBOSE=1`                                    | وضع التصحيح                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | مستوى سجل npm                                 |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | التحكم في سلوك sharp/libvips (الافتراضي: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
مصمم للبيئات التي تريد فيها كل شيء تحت بادئة محلية
(الافتراضي `~/.openclaw`) ومن دون اعتماد على Node النظام. يدعم تثبيتات npm
افتراضيًا، بالإضافة إلى تثبيتات git-checkout تحت تدفق البادئة نفسه.
</Info>

### التدفق (install-cli.sh)

<Steps>
  <Step title="تثبيت وقت تشغيل Node محلي">
    ينزّل tarball مثبتًا لإصدار Node LTS مدعوم (الإصدار مضمن في السكربت ويُحدّث بشكل مستقل) إلى `<prefix>/tools/node-v<version>` ويتحقق من SHA-256.
  </Step>
  <Step title="ضمان Git">
    إذا كان Git مفقودًا، يحاول التثبيت عبر apt/dnf/yum على Linux أو Homebrew على macOS.
  </Step>
  <Step title="تثبيت OpenClaw تحت البادئة">
    - طريقة `npm` (الافتراضية): يثبّت تحت البادئة باستخدام npm، ثم يكتب wrapper إلى `<prefix>/bin/openclaw`
    - طريقة `git`: يستنسخ/يحدّث checkout ‏(الافتراضي `~/openclaw`) ويكتب أيضًا wrapper إلى `<prefix>/bin/openclaw`
  </Step>
  <Step title="تحديث خدمة gateway المحمّلة">
    إذا كانت خدمة gateway محمّلة بالفعل من نفس البادئة، يشغّل السكربت
    `openclaw gateway install --force`، ثم `openclaw gateway restart`،
    ويفحص صحة gateway بأفضل جهد.
  </Step>
</Steps>

### أمثلة (install-cli.sh)

<Tabs>
  <Tab title="الافتراضي">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="بادئة + إصدار مخصصان">
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
  <Tab title="تشغيل التهيئة الأولى">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="مرجع الأعلام">

| العلم                        | الوصف                                                                     |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | بادئة التثبيت (الافتراضي: `~/.openclaw`)                                         |
| `--install-method npm\|git` | اختر طريقة التثبيت (الافتراضي: `npm`). الاسم البديل: `--method`                       |
| `--npm`                     | اختصار لطريقة npm                                                         |
| `--git`, `--github`         | اختصار لطريقة git                                                         |
| `--git-dir <path>`          | دليل Git checkout ‏(الافتراضي: `~/openclaw`). الاسم البديل: `--dir`                  |
| `--version <ver>`           | إصدار OpenClaw أو dist-tag ‏(الافتراضي: `latest`)                                |
| `--node-version <ver>`      | إصدار Node ‏(الافتراضي: `22.22.0`)                                               |
| `--json`                    | أخرج أحداث NDJSON                                                              |
| `--onboard`                 | شغّل `openclaw onboard` بعد التثبيت                                            |
| `--no-onboard`              | تخطَّ التهيئة الأولى (الافتراضي)                                                       |
| `--set-npm-prefix`          | على Linux، افرض بادئة npm إلى `~/.npm-global` إذا كانت البادئة الحالية غير قابلة للكتابة |
| `--help`                    | اعرض الاستخدام (`-h`)                                                               |

  </Accordion>

  <Accordion title="مرجع متغيرات البيئة">

| المتغير                                    | الوصف                                   |
| ------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | بادئة التثبيت                                |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | طريقة التثبيت                                |
| `OPENCLAW_VERSION=<ver>`                    | إصدار OpenClaw أو dist-tag                  |
| `OPENCLAW_NODE_VERSION=<ver>`               | إصدار Node                                  |
| `OPENCLAW_GIT_DIR=<path>`                   | دليل Git checkout لتثبيتات git       |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | تبديل تحديثات git للـ checkouts الموجودة     |
| `OPENCLAW_NO_ONBOARD=1`                     | تخطي التهيئة الأولى                               |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | مستوى سجل npm                                 |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | التحكم في سلوك sharp/libvips (الافتراضي: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### التدفق (install.ps1)

<Steps>
  <Step title="ضمان PowerShell + بيئة Windows">
    يتطلب PowerShell 5+.
  </Step>
  <Step title="ضمان Node.js 24 افتراضيًا">
    إذا كان مفقودًا، يحاول التثبيت عبر winget، ثم Chocolatey، ثم Scoop. ويظل Node 22 LTS، حاليًا `22.14+`، مدعومًا للتوافق.
  </Step>
  <Step title="تثبيت OpenClaw">
    - طريقة `npm` (الافتراضية): تثبيت npm عالمي باستخدام `-Tag` المحدد
    - طريقة `git`: استنساخ/تحديث المستودع، والتثبيت/البناء باستخدام pnpm، وتثبيت wrapper عند `%USERPROFILE%\.local\bin\openclaw.cmd`
  </Step>
  <Step title="مهام ما بعد التثبيت">
    - يضيف دليل bin المطلوب إلى PATH الخاص بالمستخدم متى أمكن
    - يحدّث خدمة gateway المحمّلة بأفضل جهد (`openclaw gateway install --force`، ثم إعادة التشغيل)
    - يشغّل `openclaw doctor --non-interactive` عند الترقيات وتثبيتات git (best effort)
  </Step>
  <Step title="التعامل مع الإخفاقات">
    تبلغ عمليات التثبيت من نوع `iwr ... | iex` وscriptblock عن خطأ منهي من دون إغلاق جلسة PowerShell الحالية. أما عمليات التثبيت المباشرة عبر `powershell -File` / `pwsh -File` فتخرج بقيمة غير صفرية من أجل الأتمتة.
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
  <Tab title="دليل Git مخصص">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="تشغيل تجريبي">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="أثر تصحيح">
    ```powershell
    # لا يحتوي install.ps1 على علم -Verbose مخصص حتى الآن.
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
| `-Tag <tag\|version\|spec>` | npm dist-tag، أو إصدار، أو package spec (الافتراضي: `latest`) |
| `-GitDir <path>`            | دليل checkout (الافتراضي: `%USERPROFILE%\openclaw`)     |
| `-NoOnboard`                | تخطَّ التهيئة الأولى                                            |
| `-NoGitUpdate`              | تخطَّ `git pull`                                            |
| `-DryRun`                   | اطبع الإجراءات فقط                                         |

  </Accordion>

  <Accordion title="مرجع متغيرات البيئة">

| المتغير                           | الوصف        |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | طريقة التثبيت     |
| `OPENCLAW_GIT_DIR=<path>`          | دليل checkout |
| `OPENCLAW_NO_ONBOARD=1`            | تخطي التهيئة الأولى    |
| `OPENCLAW_GIT_UPDATE=0`            | تعطيل git pull   |
| `OPENCLAW_DRY_RUN=1`               | وضع التشغيل التجريبي       |

  </Accordion>
</AccordionGroup>

<Note>
إذا تم استخدام `-InstallMethod git` وكان Git مفقودًا، فسيخرج السكربت ويطبع رابط Git for Windows.
</Note>

---

## CI والأتمتة

استخدم الأعلام/متغيرات البيئة غير التفاعلية للحصول على تشغيلات متوقعة.

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
  <Tab title="install.ps1 (تخطي التهيئة الأولى)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لماذا Git مطلوب؟">
    Git مطلوب لطريقة التثبيت `git`. وبالنسبة إلى تثبيتات `npm`، ما يزال Git يُفحص/يُثبّت لتجنب إخفاقات `spawn git ENOENT` عندما تستخدم الاعتماديات عناوين git URL.
  </Accordion>

  <Accordion title="لماذا يظهر npm الخطأ EACCES على Linux؟">
    تشير بعض إعدادات Linux ببادئة npm العالمية إلى مسارات مملوكة لـ root. يمكن لـ `install.sh` تبديل البادئة إلى `~/.npm-global` وإضافة تصديرات PATH إلى ملفات rc الخاصة بالـ shell (عندما تكون هذه الملفات موجودة).
  </Accordion>

  <Accordion title="مشكلات sharp/libvips">
    تضبط السكربتات افتراضيًا `SHARP_IGNORE_GLOBAL_LIBVIPS=1` لتجنب بناء sharp مقابل libvips النظام. للتجاوز:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    ثبّت Git for Windows، وأعد فتح PowerShell، ثم أعد تشغيل المثبّت.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    شغّل `npm config get prefix` وأضف ذلك الدليل إلى PATH الخاص بالمستخدم (لا حاجة إلى اللاحقة `\bin` على Windows)، ثم أعد فتح PowerShell.
  </Accordion>

  <Accordion title="Windows: كيف أحصل على مخرجات مثبّت verbose">
    لا يوفّر `install.ps1` حاليًا مفتاح `-Verbose`.
    استخدم تتبع PowerShell لتشخيصات على مستوى السكربت:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="لم يتم العثور على openclaw بعد التثبيت">
    تكون المشكلة عادةً في PATH. راجع [Node.js troubleshooting](/ar/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## ذو صلة

- [Install overview](/ar/install)
- [Updating](/ar/install/updating)
- [Uninstall](/ar/install/uninstall)

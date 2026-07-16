---
read_when:
    - يجب تثبيت Node.js قبل تثبيت OpenClaw
    - لقد ثبّتَّ OpenClaw، لكن الأمر `openclaw` غير موجود
    - يفشل `npm install -g` بسبب مشكلات في الأذونات أو `PATH`
summary: تثبيت Node.js وتهيئته لـ OpenClaw - متطلبات الإصدار وخيارات التثبيت واستكشاف أخطاء PATH وإصلاحها
title: Node.js
x-i18n:
    generated_at: "2026-07-16T14:31:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ef4df255c24a11a549c757b597a07b00852e60973a5e513bdcf60796037a462a
    source_path: install/node.md
    workflow: 16
---

يتطلب OpenClaw إصدار **Node 22.22.3+، أو Node 24.15+، أو Node 25.9+**. يُعد **Node 24 بيئة التشغيل الافتراضية والموصى بها** لعمليات التثبيت وCI وسير عمل الإصدارات؛ ويظل Node 22 مدعومًا عبر خط LTS النشط. Node 23 غير مدعوم. يكتشف [برنامج التثبيت النصي](/ar/install#alternative-install-methods) Node ويثبّته تلقائيًا — استخدم هذه الصفحة عندما تريد إعداد Node بنفسك (الإصدارات، وPATH، وعمليات التثبيت العامة).

## التحقق من الإصدار

```bash
node -v
```

يُعد `v24.15.0` أو إصدار 24.x أحدث الخيار الافتراضي الموصى به. ويُعد `v22.22.3` أو إصدار 22.x أحدث مسار Node 22 LTS المدعوم؛ كما أن Node `v25.9.0+` مدعوم أيضًا. Node 23 غير مدعوم. إذا كان Node غير مثبت أو خارج النطاق المدعوم، فاختر إحدى طرق التثبيت أدناه.

## تثبيت Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (موصى به):

    ```bash
    brew install node
    ```

    أو نزّل برنامج تثبيت macOS من [nodejs.org](https://nodejs.org/).

  </Tab>
  <Tab title="Linux">
    **Ubuntu / Debian:**

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

    **Fedora / RHEL:**

    ```bash
    sudo dnf install nodejs
    ```

    أو استخدم مدير إصدارات (انظر أدناه).

  </Tab>
  <Tab title="Windows">
    **winget** (موصى به):

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey:**

    ```powershell
    choco install nodejs-lts
    ```

    أو نزّل برنامج تثبيت Windows من [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="استخدام مدير إصدارات (nvm، وfnm، وmise، وasdf)">
  تتيح لك برامج إدارة الإصدارات التبديل بسهولة بين إصدارات Node. من الخيارات الشائعة:

- [**fnm**](https://github.com/Schniz/fnm) - سريع ومتعدد المنصات
- [**nvm**](https://github.com/nvm-sh/nvm) - واسع الاستخدام على macOS/Linux
- [**mise**](https://mise.jdx.dev/) - متعدد اللغات (Node، وPython، وRuby، وغيرها)

مثال باستخدام fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  هيّئ مدير الإصدارات في ملف بدء تشغيل الصدفة (`~/.zshrc` أو `~/.bashrc`). إذا تخطيت ذلك، فقد لا يتم العثور على `openclaw` في جلسات الطرفية الجديدة لأن PATH لن يتضمن دليل الملفات التنفيذية لـ Node.
  </Warning>
</Accordion>

## استكشاف الأخطاء وإصلاحها

### `openclaw: command not found`

يعني هذا في الغالب أن دليل الملفات التنفيذية العامة لـ npm غير موجود في PATH.

<Steps>
  <Step title="العثور على بادئة npm العامة">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="التحقق من وجودها في PATH">
    ```bash
    echo "$PATH"
    ```

    ابحث عن `<npm-prefix>/bin` ‏(macOS/Linux) أو `<npm-prefix>` ‏(Windows) في المخرجات.

  </Step>
  <Step title="إضافتها إلى ملف بدء تشغيل الصدفة">
    <Tabs>
      <Tab title="macOS / Linux">
        أضف إلى `~/.zshrc` أو `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        ثم افتح طرفية جديدة (أو شغّل `rehash` في zsh / ‏`hash -r` في bash).
      </Tab>
      <Tab title="Windows">
        أضف مخرجات `npm prefix -g` إلى PATH للنظام عبر Settings → System → Environment Variables.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### أخطاء الأذونات في `npm install -g` ‏(Linux)

إذا ظهرت أخطاء `EACCES`، فغيّر البادئة العامة لـ npm إلى دليل يمكن للمستخدم الكتابة فيه:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

أضف السطر `export PATH=...` إلى `~/.bashrc` أو `~/.zshrc` لجعل التغيير دائمًا.

## مواضيع ذات صلة

- [نظرة عامة على التثبيت](/ar/install) - جميع طرق التثبيت
- [التحديث](/ar/install/updating) - إبقاء OpenClaw محدّثًا
- [بدء الاستخدام](/ar/start/getting-started) - الخطوات الأولى بعد التثبيت

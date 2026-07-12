---
read_when:
    - تحتاج إلى تثبيت Node.js قبل تثبيت OpenClaw
    - لقد ثبّتَّ OpenClaw، لكن الأمر `openclaw` غير موجود
    - يفشل الأمر `npm install -g` بسبب مشكلات في الأذونات أو `PATH`
summary: تثبيت Node.js وتهيئته لـ OpenClaw - متطلبات الإصدار وخيارات التثبيت واستكشاف أخطاء PATH وإصلاحها
title: Node.js
x-i18n:
    generated_at: "2026-07-12T06:00:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 410686b714fe2830a0c6d77a52850eab5720a97747b9579bd730808db23a9dda
    source_path: install/node.md
    workflow: 16
---

يتطلب OpenClaw الإصدار **Node 22.19+‎ أو Node 23.11+‎ أو Node 24+‎**. يُعد **Node 24 بيئة التشغيل الافتراضية والموصى بها** لعمليات التثبيت وCI وسير عمل الإصدارات؛ ويظل Node 22 مدعومًا عبر مسار LTS النشط. يكتشف [برنامج التثبيت النصي](/ar/install#alternative-install-methods) Node ويثبّته تلقائيًا — استخدم هذه الصفحة عندما تريد إعداد Node بنفسك (الإصدارات وPATH وعمليات التثبيت العامة).

## التحقق من إصدارك

```bash
node -v
```

الإصدار `v24.x.x` أو أحدث هو الخيار الافتراضي الموصى به. والإصدار `v22.19.x` أو أحدث هو مسار Node 22 LTS المدعوم (رقِّ إلى Node 24 عندما يكون ذلك مناسبًا). إصدارات Node 23 السابقة للإصدار `v23.11.0` غير مدعومة. إذا لم يكن Node مثبتًا أو كان إصداره خارج النطاق المدعوم، فاختر إحدى طرق التثبيت أدناه.

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

<Accordion title="استخدام مدير إصدارات (nvm وfnm وmise وasdf)">
  تتيح لك أدوات إدارة الإصدارات التبديل بسهولة بين إصدارات Node. من الخيارات الشائعة:

- [**fnm**](https://github.com/Schniz/fnm) - سريع ومتعدد المنصات
- [**nvm**](https://github.com/nvm-sh/nvm) - شائع الاستخدام على macOS وLinux
- [**mise**](https://mise.jdx.dev/) - متعدد اللغات (Node وPython وRuby وغيرها)

مثال باستخدام fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  هيّئ مدير الإصدارات في ملف بدء تشغيل الصدفة (`~/.zshrc` أو `~/.bashrc`). إذا تخطيت ذلك، فقد يتعذر العثور على `openclaw` في جلسات الطرفية الجديدة لأن PATH لن يتضمن دليل الملفات التنفيذية الخاص بـ Node.
  </Warning>
</Accordion>

## استكشاف الأخطاء وإصلاحها

### `openclaw: command not found`

يعني هذا في الغالب أن دليل الملفات التنفيذية العامة الخاص بـ npm غير موجود في PATH.

<Steps>
  <Step title="العثور على بادئة npm العامة">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="التحقق مما إذا كانت موجودة في PATH">
    ```bash
    echo "$PATH"
    ```

    ابحث عن `<npm-prefix>/bin` (على macOS وLinux) أو `<npm-prefix>` (على Windows) في المخرجات.

  </Step>
  <Step title="إضافتها إلى ملف بدء تشغيل الصدفة">
    <Tabs>
      <Tab title="macOS / Linux">
        أضف ما يلي إلى `~/.zshrc` أو `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        ثم افتح طرفية جديدة (أو شغّل `rehash` في zsh أو `hash -r` في bash).
      </Tab>
      <Tab title="Windows">
        أضف ناتج `npm prefix -g` إلى PATH الخاص بالنظام عبر Settings → System → Environment Variables.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### أخطاء الأذونات عند تشغيل `npm install -g` ‏(Linux)

إذا ظهرت أخطاء `EACCES`، فغيّر البادئة العامة لـ npm إلى دليل يمكن للمستخدم الكتابة فيه:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

أضف السطر `export PATH=...` إلى `~/.bashrc` أو `~/.zshrc` لجعل التغيير دائمًا.

## صفحات ذات صلة

- [نظرة عامة على التثبيت](/ar/install) - جميع طرق التثبيت
- [التحديث](/ar/install/updating) - إبقاء OpenClaw محدّثًا
- [بدء الاستخدام](/ar/start/getting-started) - الخطوات الأولى بعد التثبيت

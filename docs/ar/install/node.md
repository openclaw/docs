---
read_when:
    - يجب تثبيت Node.js قبل تثبيت OpenClaw
    - ثبّت OpenClaw ولكن `openclaw` أمر غير موجود
    - يفشل npm install -g بسبب مشكلات في الأذونات أو PATH
summary: تثبيت Node.js وتكوينه لـ OpenClaw - متطلبات الإصدار، وخيارات التثبيت، واستكشاف مشكلات PATH وإصلاحها
title: Node.js
x-i18n:
    generated_at: "2026-05-06T08:01:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: fa445f3b9e6472af755c2fc4c3f08b6134e308f290ab750549411f12d8d247db
    source_path: install/node.md
    workflow: 16
---

يتطلب OpenClaw **Node 22.14 أو أحدث**. **Node 24 هو وقت التشغيل الافتراضي والموصى به** لعمليات التثبيت وCI وسير عمل الإصدارات. يظل Node 22 مدعومًا عبر خط LTS النشط. سيكتشف [نص التثبيت](/ar/install#alternative-install-methods) Node ويثبته تلقائيًا - هذه الصفحة مخصصة عندما تريد إعداد Node بنفسك والتأكد من توصيل كل شيء بشكل صحيح (الإصدارات، PATH، عمليات التثبيت العامة).

## تحقق من إصدارك

```bash
node -v
```

إذا طبع هذا `v24.x.x` أو أعلى، فأنت تستخدم الإعداد الافتراضي الموصى به. إذا طبع `v22.14.x` أو أعلى، فأنت تستخدم مسار Node 22 LTS المدعوم، لكننا ما زلنا نوصي بالترقية إلى Node 24 عندما يكون ذلك مناسبًا. إذا لم يكن Node مثبتًا أو كان الإصدار قديمًا جدًا، فاختر إحدى طرق التثبيت أدناه.

## تثبيت Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (موصى به):

    ```bash
    brew install node
    ```

    أو نزّل مثبت macOS من [nodejs.org](https://nodejs.org/).

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

    أو نزّل مثبت Windows من [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="Using a version manager (nvm, fnm, mise, asdf)">
  تتيح لك مديرات الإصدارات التبديل بين إصدارات Node بسهولة. الخيارات الشائعة:

- [**fnm**](https://github.com/Schniz/fnm) - سريع، ومتعدد المنصات
- [**nvm**](https://github.com/nvm-sh/nvm) - مستخدم على نطاق واسع على macOS/Linux
- [**mise**](https://mise.jdx.dev/) - متعدد اللغات (Node وPython وRuby وما إلى ذلك)

مثال باستخدام fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  تأكد من تهيئة مدير الإصدارات في ملف بدء تشغيل الصدفة لديك (`~/.zshrc` أو `~/.bashrc`). إذا لم يكن كذلك، فقد لا يتم العثور على `openclaw` في جلسات الطرفية الجديدة لأن PATH لن يتضمن دليل bin الخاص بـ Node.
  </Warning>
</Accordion>

## استكشاف الأخطاء وإصلاحها

### `openclaw: command not found`

يعني هذا دائمًا تقريبًا أن دليل bin العام الخاص بـ npm غير موجود في PATH لديك.

<Steps>
  <Step title="Find your global npm prefix">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Check if it's on your PATH">
    ```bash
    echo "$PATH"
    ```

    ابحث عن `<npm-prefix>/bin` (macOS/Linux) أو `<npm-prefix>` (Windows) في الناتج.

  </Step>
  <Step title="Add it to your shell startup file">
    <Tabs>
      <Tab title="macOS / Linux">
        أضف إلى `~/.zshrc` أو `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        ثم افتح طرفية جديدة (أو شغّل `rehash` في zsh / `hash -r` في bash).
      </Tab>
      <Tab title="Windows">
        أضف ناتج `npm prefix -g` إلى PATH الخاص بالنظام عبر Settings → System → Environment Variables.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### أخطاء الأذونات عند `npm install -g` (Linux)

إذا رأيت أخطاء `EACCES`، فبدّل البادئة العامة لـ npm إلى دليل قابل للكتابة من قبل المستخدم:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

أضف سطر `export PATH=...` إلى `~/.bashrc` أو `~/.zshrc` لديك لجعله دائمًا.

## ذات صلة

- [نظرة عامة على التثبيت](/ar/install) - جميع طرق التثبيت
- [التحديث](/ar/install/updating) - إبقاء OpenClaw محدّثًا
- [بدء الاستخدام](/ar/start/getting-started) - الخطوات الأولى بعد التثبيت

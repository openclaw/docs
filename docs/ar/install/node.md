---
read_when:
    - تحتاج إلى تثبيت Node.js قبل تثبيت OpenClaw
    - لقد ثبّت OpenClaw لكن `openclaw` يظهر على أنه command not found
    - يفشل `npm install -g` بسبب مشكلات الأذونات أو PATH
summary: تثبيت Node.js وتهيئته لـ OpenClaw — متطلبات الإصدار، وخيارات التثبيت، واستكشاف أخطاء PATH وإصلاحها
title: Node.js
x-i18n:
    generated_at: "2026-04-24T07:49:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99c72b917fa8beba136ee6010799c0183cff8b2420b5a1bd256d9155e50f065a
    source_path: install/node.md
    workflow: 15
---

يتطلب OpenClaw **Node 22.14 أو أحدث**. ويُعد **Node 24 هو وقت التشغيل الافتراضي والمُوصى به** للتثبيتات، وCI، وتدفقات الإصدار. ولا يزال Node 22 مدعومًا عبر خط LTS النشط. وسيكتشف [سكربت التثبيت](/ar/install#alternative-install-methods) Node ويثبّته تلقائيًا — وهذه الصفحة مخصصة للحالات التي تريد فيها إعداد Node بنفسك والتأكد من أن كل شيء موصول بشكل صحيح (الإصدارات، وPATH، والتثبيتات العامة).

## تحقق من إصدارك

```bash
node -v
```

إذا طبع هذا `v24.x.x` أو أحدث، فأنت تستخدم الإعداد الافتراضي الموصى به. وإذا طبع `v22.14.x` أو أحدث، فأنت تستخدم مسار Node 22 LTS المدعوم، لكننا لا نزال نوصي بالترقية إلى Node 24 عندما يكون ذلك مناسبًا. وإذا لم يكن Node مثبتًا أو كان الإصدار قديمًا جدًا، فاختر إحدى طرق التثبيت أدناه.

## تثبيت Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** ‏(موصى به):

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

    أو استخدم مدير إصدارات (راجع أدناه).

  </Tab>
  <Tab title="Windows">
    **winget** ‏(موصى به):

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

<Accordion title="استخدام مدير إصدارات (nvm, fnm, mise, asdf)">
  تتيح لك أدوات إدارة الإصدارات التبديل بين إصدارات Node بسهولة. ومن الخيارات الشائعة:

- [**fnm**](https://github.com/Schniz/fnm) — سريع ومتعدد المنصات
- [**nvm**](https://github.com/nvm-sh/nvm) — واسع الاستخدام على macOS/Linux
- [**mise**](https://mise.jdx.dev/) — متعدد اللغات (Node، وPython، وRuby، وغير ذلك)

مثال باستخدام fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  تأكد من تهيئة مدير الإصدارات في ملف بدء تشغيل shell الخاص بك (`~/.zshrc` أو `~/.bashrc`). وإذا لم تفعل ذلك، فقد لا يتم العثور على `openclaw` في جلسات الطرفية الجديدة لأن PATH لن يتضمن دليل bin الخاص بـ Node.
  </Warning>
</Accordion>

## استكشاف الأخطاء وإصلاحها

### `openclaw: command not found`

هذا يعني في الغالب أن دليل npm العام الخاص بـ bin غير موجود على PATH.

<Steps>
  <Step title="اعثر على npm prefix العام لديك">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="تحقق مما إذا كان موجودًا على PATH">
    ```bash
    echo "$PATH"
    ```

    ابحث عن `<npm-prefix>/bin` ‏(macOS/Linux) أو `<npm-prefix>` ‏(Windows) في المخرجات.

  </Step>
  <Step title="أضفه إلى ملف بدء تشغيل shell">
    <Tabs>
      <Tab title="macOS / Linux">
        أضف إلى `~/.zshrc` أو `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        ثم افتح طرفية جديدة (أو شغّل `rehash` في zsh أو `hash -r` في bash).
      </Tab>
      <Tab title="Windows">
        أضف مخرجات `npm prefix -g` إلى PATH النظام عبر Settings → System → Environment Variables.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### أخطاء الأذونات عند `npm install -g` ‏(Linux)

إذا رأيت أخطاء `EACCES`، فحوّل npm global prefix إلى دليل يمكن للمستخدم الكتابة فيه:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

أضف سطر `export PATH=...` إلى `~/.bashrc` أو `~/.zshrc` لجعله دائمًا.

## ذو صلة

- [نظرة عامة على التثبيت](/ar/install) — جميع طرق التثبيت
- [التحديث](/ar/install/updating) — إبقاء OpenClaw محدثًا
- [البدء](/ar/start/getting-started) — الخطوات الأولى بعد التثبيت

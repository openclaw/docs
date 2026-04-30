---
read_when:
    - البحث عن Skills أو Plugin أو تثبيت أيٍّ منها أو تحديثه
    - نشر Skills أو Plugins إلى السجل
    - تكوين CLI الخاص بـ clawhub أو تجاوزات البيئة الخاصة به
sidebarTitle: ClawHub
summary: 'ClawHub: سجل عام لـ OpenClaw Skills وPlugins، وتدفقات تثبيت أصلية، وواجهة CLI الخاصة بـ clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-30T08:28:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ec09a3c76820137eb1f7ca829a184fc1ed6392d3b32a327ecbda4d2cad7a78d
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub هو السجل العام لـ **OpenClaw Skills وPlugins**.

- استخدم أوامر `openclaw` الأصلية للبحث عن Skills وتثبيتها وتحديثها، ولتثبيت Plugins من ClawHub.
- استخدم CLI المنفصل `clawhub` لمصادقة السجل والنشر والحذف/إلغاء الحذف ومهام المزامنة.

الموقع: [clawhub.ai](https://clawhub.ai)

## البدء السريع

<Steps>
  <Step title="البحث">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="التثبيت">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="الاستخدام">
    ابدأ جلسة OpenClaw جديدة — ستلتقط Skill الجديدة.
  </Step>
  <Step title="النشر (اختياري)">
    لمهام سير العمل التي تتطلب مصادقة السجل (النشر، المزامنة، الإدارة)، ثبّت
    CLI المنفصل `clawhub`:

    ```bash
    npm i -g clawhub
    # or
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## تدفقات OpenClaw الأصلية

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    تثبّت أوامر `openclaw` الأصلية في مساحة العمل النشطة لديك وتحفظ
    بيانات تعريف المصدر حتى تتمكن استدعاءات `update` اللاحقة من البقاء على ClawHub.

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    تتم أيضًا تجربة مواصفات Plugin البسيطة والآمنة لـ npm عبر ClawHub قبل npm:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    استخدم `npm:<package>` عندما تريد حلاً عبر npm فقط من دون
    بحث في ClawHub:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    تتحقق عمليات تثبيت Plugin من توافق `pluginApi` و
    `minGatewayVersion` المعلنين قبل تشغيل تثبيت الأرشيف، لذلك
    تفشل المضيفات غير المتوافقة مبكرًا وبإغلاق آمن بدلًا من تثبيت
    الحزمة جزئيًا.

  </Tab>
</Tabs>

<Note>
لا يقبل `openclaw plugins install clawhub:...` إلا عائلات Plugin
القابلة للتثبيت. إذا كانت حزمة ClawHub في الواقع Skill، فسيتوقف OpenClaw
ويوجهك إلى `openclaw skills install <slug>` بدلًا من ذلك.

تفشل أيضًا عمليات تثبيت ClawHub Plugin المجهولة بإغلاق آمن للحزم الخاصة.
يمكن لقنوات المجتمع أو القنوات غير الرسمية الأخرى أن تظل قابلة للتثبيت، لكن OpenClaw
يحذّر حتى يتمكن المشغلون من مراجعة المصدر والتحقق قبل تفعيلها.
</Note>

## ما هو ClawHub

- سجل عام لـ OpenClaw Skills وPlugins.
- مخزن ذو إصدارات لحزم Skills وبياناتها الوصفية.
- واجهة اكتشاف للبحث والوسوم وإشارات الاستخدام.

عادةً ما تكون Skill حزمة ملفات ذات إصدار تتضمن:

- ملف `SKILL.md` يحتوي على الوصف الأساسي وطريقة الاستخدام.
- إعدادات اختيارية أو نصوص برمجية أو ملفات داعمة تستخدمها Skill.
- بيانات وصفية مثل الوسوم والملخص ومتطلبات التثبيت.

يستخدم ClawHub البيانات الوصفية لتشغيل الاكتشاف وعرض قدرات Skill
بأمان. يتتبع السجل إشارات الاستخدام (النجوم، التنزيلات) لتحسين الترتيب
والظهور. ينشئ كل نشر إصدار semver جديدًا، ويحتفظ السجل بسجل الإصدارات
حتى يتمكن المستخدمون من تدقيق التغييرات.

## مساحة العمل وتحميل Skills

يثبّت CLI المنفصل `clawhub` أيضًا Skills في `./skills` ضمن
دليل العمل الحالي لديك. إذا كانت مساحة عمل OpenClaw مهيأة،
فإن `clawhub` يعود إلى مساحة العمل تلك ما لم تتجاوز `--workdir`
(أو `CLAWHUB_WORKDIR`). يحمّل OpenClaw Skills الخاصة بمساحة العمل من
`<workspace>/skills` ويلتقطها في الجلسة **التالية**.

إذا كنت تستخدم بالفعل `~/.openclaw/skills` أو Skills المضمّنة، فإن Skills
الخاصة بمساحة العمل تأخذ الأولوية. لمزيد من التفاصيل حول كيفية تحميل Skills
ومشاركتها وحوكمتها، راجع [Skills](/ar/tools/skills).

## ميزات الخدمة

| الميزة                  | ملاحظات                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| التصفح العام          | يمكن عرض Skills ومحتوى `SKILL.md` الخاص بها علنًا.          |
| البحث                   | مدعوم بالتضمينات (بحث متجهي)، وليس بالكلمات المفتاحية فقط.               |
| إدارة الإصدارات               | semver، وسجلات التغييرات، والوسوم (بما في ذلك `latest`).                  |
| التنزيلات                | ملف Zip لكل إصدار.                                                    |
| النجوم والتعليقات       | ملاحظات المجتمع.                                                 |
| ملخصات فحص الأمان  | تعرض صفحات التفاصيل أحدث حالة فحص قبل التثبيت أو التنزيل. |
| صفحات تفاصيل الماسح     | تحتوي نتائج VirusTotal وClawScan والتحليل الثابت على روابط عميقة.  |
| لوحة استرداد المالك | يمكن للناشرين رؤية المحتوى المملوك والمحجوز للفحص من `/dashboard`.       |
| عمليات إعادة الفحص بطلب المالك  | يمكن للمالكين طلب عمليات إعادة فحص محدودة لاسترداد النتائج الإيجابية الكاذبة.     |
| الإشراف               | الموافقات والتدقيقات.                                               |
| API ملائم لـ CLI         | مناسب للأتمتة والبرمجة النصية.                              |

## الأمان والإشراف

ClawHub مفتوح افتراضيًا — يمكن لأي شخص رفع Skills، لكن يجب أن يكون حساب GitHub
بعمر **أسبوع واحد على الأقل** للنشر. يبطئ هذا إساءة الاستخدام من دون حظر
المساهمين الشرعيين.

<AccordionGroup>
  <Accordion title="فحوصات الأمان">
    يجري ClawHub فحوصات أمان مؤتمتة على Skills المنشورة وإصدارات Plugin.
    تلخص صفحات التفاصيل العامة النتيجة الحالية، وتربط صفوف الماسح
    بصفحات تفاصيل مخصصة لـ VirusTotal وClawScan والتحليل الثابت.

    قد تكون الإصدارات المحجوزة للفحص أو المحظورة غير متاحة في الكتالوج العام
    وواجهات التثبيت، مع بقائها مرئية لمالكها في `/dashboard`.

  </Accordion>
  <Accordion title="الإبلاغ">
    - يمكن لأي مستخدم مسجّل الدخول الإبلاغ عن Skill.
    - أسباب الإبلاغ مطلوبة ويتم تسجيلها.
    - يمكن لكل مستخدم امتلاك ما يصل إلى 20 بلاغًا نشطًا في الوقت نفسه.
    - يتم إخفاء Skills التي لديها أكثر من 3 بلاغات فريدة تلقائيًا افتراضيًا.

  </Accordion>
  <Accordion title="الإشراف">
    - يمكن للمشرفين عرض Skills المخفية، أو إظهارها، أو حذفها، أو حظر المستخدمين.
    - يمكن أن تؤدي إساءة استخدام ميزة الإبلاغ إلى حظر الحساب.
    - هل ترغب في أن تصبح مشرفًا؟ اسأل في OpenClaw Discord وتواصل مع مشرف أو مشرف صيانة.

  </Accordion>
</AccordionGroup>

## ClawHub CLI

لا تحتاج إلى هذا إلا لمهام سير العمل التي تتطلب مصادقة السجل مثل
النشر/المزامنة.

### الخيارات العامة

<ParamField path="--workdir <dir>" type="string">
  دليل العمل. الافتراضي: الدليل الحالي؛ يعود إلى مساحة عمل OpenClaw.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  دليل Skills، نسبةً إلى workdir.
</ParamField>
<ParamField path="--site <url>" type="string">
  عنوان URL الأساسي للموقع (تسجيل الدخول عبر المتصفح).
</ParamField>
<ParamField path="--registry <url>" type="string">
  عنوان URL الأساسي لـ API السجل.
</ParamField>
<ParamField path="--no-input" type="boolean">
  تعطيل المطالبات (غير تفاعلي).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  طباعة إصدار CLI.
</ParamField>

### الأوامر

<AccordionGroup>
  <Accordion title="المصادقة (تسجيل الدخول / تسجيل الخروج / من أنا)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    خيارات تسجيل الدخول:

    - `--token <token>` — الصق رمز API.
    - `--label <label>` — تسمية مخزنة لرموز تسجيل الدخول عبر المتصفح (الافتراضي: `CLI token`).
    - `--no-browser` — لا تفتح متصفحًا (يتطلب `--token`).

  </Accordion>
  <Accordion title="البحث">
    ```bash
    clawhub search "query"
    ```

    يبحث في Skills. لاكتشاف Plugin/الحزم، استخدم `clawhub package explore`.

    - `--limit <n>` — الحد الأقصى للنتائج.

  </Accordion>
  <Accordion title="تصفح / فحص Plugins">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` و`package inspect` هما واجهتا ClawHub CLI لاكتشاف Plugin/الحزم وفحص البيانات الوصفية. لا تزال تثبيتات OpenClaw الأصلية تستخدم `openclaw plugins install clawhub:<package>`.

    الخيارات:

    - `--family skill|code-plugin|bundle-plugin` — تصفية عائلة الحزمة.
    - `--official` — عرض الحزم الرسمية فقط.
    - `--executes-code` — عرض الحزم التي تنفذ كودًا فقط.
    - `--version <version>` / `--tag <tag>` — فحص إصدار محدد من الحزمة.
    - `--versions`، `--files`، `--file <path>` — فحص سجل الحزمة وملفاتها.
    - `--json` — مخرجات قابلة للقراءة آليًا.

  </Accordion>
  <Accordion title="التثبيت / التحديث / القائمة">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    الخيارات:

    - `--version <version>` — تثبيت إصدار محدد أو التحديث إليه (slug واحد فقط عند `update`).
    - `--force` — الكتابة فوق المجلد إذا كان موجودًا بالفعل، أو عندما لا تطابق الملفات المحلية أي إصدار منشور.
    - يقرأ `clawhub list` الملف `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="نشر Skills">
    ```bash
    clawhub skill publish <path>
    ```

    الخيارات:

    - `--slug <slug>` — slug الخاص بـ Skill.
    - `--name <name>` — اسم العرض.
    - `--version <version>` — إصدار semver.
    - `--changelog <text>` — نص سجل التغييرات (يمكن أن يكون فارغًا).
    - `--tags <tags>` — وسوم مفصولة بفواصل (الافتراضي: `latest`).

  </Accordion>
  <Accordion title="نشر Plugins">
    ```bash
    clawhub package publish <source>
    ```

    يمكن أن يكون `<source>` مجلدًا محليًا، أو `owner/repo`، أو `owner/repo@ref`، أو
    عنوان URL من GitHub.

    الخيارات:

    - `--dry-run` — بناء خطة النشر الدقيقة من دون رفع أي شيء.
    - `--json` — إصدار مخرجات قابلة للقراءة آليًا لـ CI.
    - `--source-repo`، `--source-commit`، `--source-ref` — تجاوزات اختيارية عندما لا يكون الاكتشاف التلقائي كافيًا.

  </Accordion>
  <Accordion title="طلب إعادة الفحص">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    تتطلب أوامر إعادة الفحص رمز مالك مسجل الدخول وتستهدف أحدث
    إصدار Skill منشور أو إصدار Plugin. في عمليات التشغيل غير التفاعلية، مرّر
    `--yes`.

    تتضمن استجابات JSON نوع الهدف، والاسم، والإصدار، وحالة إعادة الفحص، و
    أعداد الطلبات المتبقية/القصوى لذلك الإصدار أو ذلك الإصدار المنشور.

  </Accordion>
  <Accordion title="الحذف / إلغاء الحذف (المالك أو المسؤول)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="المزامنة (فحص المحلي + نشر الجديد أو المحدّث)">
    ```bash
    clawhub sync
    ```

    الخيارات:

    - `--root <dir...>` — جذور فحص إضافية.
    - `--all` — رفع كل شيء من دون مطالبات.
    - `--dry-run` — عرض ما سيتم رفعه.
    - `--bump <type>` — `patch|minor|major` للتحديثات (الافتراضي: `patch`).
    - `--changelog <text>` — سجل تغييرات للتحديثات غير التفاعلية.
    - `--tags <tags>` — وسوم مفصولة بفواصل (الافتراضي: `latest`).
    - `--concurrency <n>` — فحوصات السجل (الافتراضي: `4`).

  </Accordion>
</AccordionGroup>

## مهام سير العمل الشائعة

<Tabs>
  <Tab title="بحث">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="العثور على Plugin">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "memory" --family code-plugin
    clawhub package inspect episodic-claw
    ```
  </Tab>
  <Tab title="تثبيت">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="تحديث الكل">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="نشر مهارة واحدة">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="مزامنة مهارات عديدة">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="نشر Plugin من GitHub">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### بيانات تعريف حزمة Plugin

يجب أن تتضمن Plugins البرمجية بيانات تعريف OpenClaw المطلوبة في
`package.json`:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

ينبغي أن تشحن الحزم المنشورة **JavaScript مبنيًا** وأن تشير
`runtimeExtensions` إلى ذلك الناتج. لا تزال تثبيتات Git checkout قادرة
على الرجوع إلى مصدر TypeScript عندما لا توجد ملفات مبنية، لكن إدخالات
وقت التشغيل المبنية تتجنب ترجمة TypeScript في وقت التشغيل ضمن مسارات
بدء التشغيل، وdoctor، وتحميل Plugin.

## الإصدارات وملف القفل والقياسات

<AccordionGroup>
  <Accordion title="الإصدارات والوسوم">
    - ينشئ كل نشر إصدار **semver** جديدًا من `SkillVersion`.
    - تشير الوسوم (مثل `latest`) إلى إصدار؛ ويتيح لك نقل الوسوم الرجوع إلى إصدار سابق.
    - تُرفق سجلات التغييرات بكل إصدار ويمكن أن تكون فارغة عند مزامنة التحديثات أو نشرها.

  </Accordion>
  <Accordion title="التغييرات المحلية مقابل إصدارات السجل">
    تقارن التحديثات محتويات المهارة المحلية بإصدارات السجل باستخدام
    تجزئة محتوى. إذا لم تطابق الملفات المحلية أي إصدار منشور، فإن
    CLI يسأل قبل الاستبدال (أو يتطلب `--force` في
    عمليات التشغيل غير التفاعلية).
  </Accordion>
  <Accordion title="فحص المزامنة وجذور الرجوع الاحتياطي">
    يفحص `clawhub sync` دليل العمل الحالي أولًا. إذا لم يعثر على أي مهارات،
    فإنه يرجع إلى مواقع قديمة معروفة (على سبيل المثال
    `~/openclaw/skills` و`~/.openclaw/skills`). صُمم هذا
    للعثور على تثبيتات المهارات الأقدم دون علامات إضافية.
  </Accordion>
  <Accordion title="التخزين وملف القفل">
    - تُسجل المهارات المثبتة في `.clawhub/lock.json` ضمن دليل عملك.
    - تُخزن رموز المصادقة في ملف إعداد CLI الخاص بـ ClawHub (يمكن التجاوز عبر `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="القياسات (أعداد التثبيت)">
    عند تشغيل `clawhub sync` أثناء تسجيل الدخول، يرسل CLI لقطة
    بسيطة لحساب أعداد التثبيت. يمكنك تعطيل ذلك بالكامل:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## متغيرات البيئة

| المتغير                      | التأثير                                          |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | تجاوز URL الموقع.                          |
| `CLAWHUB_REGISTRY`            | تجاوز URL واجهة API للسجل.                  |
| `CLAWHUB_CONFIG_PATH`         | تجاوز مكان تخزين CLI للرمز/الإعدادات. |
| `CLAWHUB_WORKDIR`             | تجاوز دليل العمل الافتراضي.                   |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تعطيل القياسات عند `sync`.                    |

## ذات صلة

- [Plugins المجتمع](/ar/plugins/community)
- [Plugins](/ar/tools/plugin)
- [Skills](/ar/tools/skills)

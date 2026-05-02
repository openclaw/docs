---
read_when:
    - البحث عن Skills أو Plugins أو تثبيتها أو تحديثها
    - نشر Skills أو Plugins في السجل
    - تكوين CLI لـ clawhub أو تجاوزات البيئة الخاصة به
sidebarTitle: ClawHub
summary: 'ClawHub: السجل العام لـ Skills وplugins الخاصة بـ OpenClaw، وتدفقات التثبيت الأصلية، وCLI الخاص بـ clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-05-02T21:04:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd422cb3e7e53fcc6d2b8a557ebc569debb0b470d5fcf141d90499c03fb4d7b3
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub هو السجل العام لـ **Skills وPlugins الخاصة بـ OpenClaw**.

- استخدم أوامر `openclaw` الأصلية للبحث عن Skills وتثبيتها وتحديثها، ولتثبيت Plugins من ClawHub.
- استخدم CLI المنفصل `clawhub` لمصادقة السجل، والنشر، والحذف/إلغاء الحذف، وسير عمل المزامنة.

الموقع: [clawhub.ai](https://clawhub.ai)

## البدء السريع

<Steps>
  <Step title="بحث">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="تثبيت">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="استخدام">
    ابدأ جلسة OpenClaw جديدة — وستلتقط Skill الجديدة.
  </Step>
  <Step title="نشر (اختياري)">
    لسير العمل الموثّق مع السجل (النشر، المزامنة، الإدارة)، ثبّت
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

    تثبّت أوامر `openclaw` الأصلية داخل مساحة العمل النشطة لديك
    وتحفظ بيانات تعريف المصدر حتى تتمكن استدعاءات `update` اللاحقة من البقاء على ClawHub.

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    يستعلم `plugins search` عن كتالوج Plugins في ClawHub ويطبع أسماء حزم
    جاهزة للتثبيت. استخدم `clawhub:<package>` عندما تريد الحل عبر ClawHub.
    مواصفات Plugins العارية والآمنة لـ npm تُثبَّت من npm أثناء مرحلة الانتقال إلى الإطلاق:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    `npm:<package>` مخصص أيضًا لـ npm فقط ومفيد عندما قد تكون المواصفة
    ملتبسة بخلاف ذلك:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    تتحقق عمليات تثبيت Plugins من توافق `pluginApi` و
    `minGatewayVersion` المعلن قبل تشغيل تثبيت الأرشيف، بحيث
    تفشل المضيفات غير المتوافقة مبكرًا وبوضع مغلق بدل تثبيت
    الحزمة جزئيًا. عندما ينشر إصدار حزمة أثرًا من ClawPack،
    يفضّل OpenClaw ملف npm-pack `.tgz` المرفوع بدقة، ويتحقق من ترويسة
    ملخص ClawHub والبايتات المنزّلة، ويسجل نوع الأثر، وتكامل npm،
    وshasum الخاص بـ npm، واسم tarball، وبيانات تعريف ملخص ClawPack للتحديثات
    اللاحقة. إصدارات الحزم الأقدم التي لا تحتوي على بيانات تعريف ClawPack لا تزال تستخدم
    مسار التحقق القديم من أرشيف الحزمة.

  </Tab>
</Tabs>

<Note>
لا يقبل `openclaw plugins install clawhub:...` إلا عائلات Plugins
القابلة للتثبيت. إذا كانت حزمة ClawHub هي Skill فعليًا، يوقف OpenClaw العملية
ويوجهك إلى `openclaw skills install <slug>` بدلًا من ذلك.

تفشل عمليات تثبيت Plugins المجهولة من ClawHub أيضًا بوضع مغلق للحزم الخاصة.
يمكن للقنوات المجتمعية أو غير الرسمية الأخرى أن تظل قابلة للتثبيت، لكن OpenClaw
يعرض تحذيرًا حتى يتمكن المشغلون من مراجعة المصدر والتحقق قبل تمكينها.
</Note>

## ما هو ClawHub

- سجل عام لـ Skills وPlugins الخاصة بـ OpenClaw.
- مخزن مُصدَّر لحزم Skills وبياناتها التعريفية.
- واجهة اكتشاف للبحث والوسوم وإشارات الاستخدام.

تكون Skill النموذجية حزمة ملفات مُصدَّرة تتضمن:

- ملف `SKILL.md` يحتوي على الوصف الأساسي وطريقة الاستخدام.
- إعدادات أو سكربتات أو ملفات داعمة اختيارية تستخدمها Skill.
- بيانات تعريف مثل الوسوم والملخص ومتطلبات التثبيت.

يستخدم ClawHub البيانات التعريفية لتشغيل الاكتشاف وعرض قدرات Skills
بأمان. يتتبع السجل إشارات الاستخدام (النجوم، التنزيلات) لتحسين
الترتيب والظهور. كل عملية نشر تنشئ إصدار semver جديدًا،
ويحتفظ السجل بسجل الإصدارات حتى يتمكن المستخدمون من تدقيق
التغييرات.

## مساحة العمل وتحميل Skills

يثبّت CLI المنفصل `clawhub` أيضًا Skills داخل `./skills` ضمن
دليل العمل الحالي لديك. إذا كانت مساحة عمل OpenClaw مهيأة،
فإن `clawhub` يعود إلى مساحة العمل تلك ما لم تتجاوز ذلك باستخدام `--workdir`
(أو `CLAWHUB_WORKDIR`). يحمّل OpenClaw Skills الخاصة بمساحة العمل من
`<workspace>/skills` ويلتقطها في الجلسة **التالية**.

إذا كنت تستخدم بالفعل `~/.openclaw/skills` أو Skills المضمّنة، فإن Skills
الخاصة بمساحة العمل تكون لها الأولوية. لمزيد من التفاصيل حول كيفية تحميل Skills
ومشاركتها وضبط الوصول إليها، راجع [Skills](/ar/tools/skills).

## ميزات الخدمة

| الميزة                  | الملاحظات                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| التصفح العام          | يمكن عرض Skills ومحتوى `SKILL.md` الخاص بها علنًا.          |
| البحث                   | مدعوم بالتضمينات (بحث متجهي)، وليس بالكلمات المفتاحية فقط.               |
| الإصدارات               | Semver، وسجلات التغيير، والوسوم (بما في ذلك `latest`).                  |
| التنزيلات                | ملف Zip لكل إصدار.                                                    |
| النجوم والتعليقات       | ملاحظات المجتمع.                                                 |
| ملخصات فحص الأمان  | تعرض صفحات التفاصيل أحدث حالة فحص قبل التثبيت أو التنزيل. |
| صفحات تفاصيل الفاحص     | تتضمن نتائج VirusTotal وClawScan والتحليل الثابت روابط عميقة.  |
| لوحة استرداد المالك | يمكن للناشرين رؤية المحتوى المملوك المحتجز بسبب الفحص من `/dashboard`.       |
| طلبات إعادة الفحص من المالك  | يمكن للمالكين طلب عمليات إعادة فحص محدودة لاسترداد حالات الإيجابيات الكاذبة.     |
| الإشراف               | الموافقات والتدقيقات.                                               |
| API ملائمة لـ CLI         | مناسبة للأتمتة والسكربتات.                              |

## الأمان والإشراف

ClawHub مفتوح افتراضيًا — يمكن لأي شخص رفع Skills، لكن يجب أن يكون حساب GitHub
قد بلغ **أسبوعًا واحدًا على الأقل** للنشر. يبطئ هذا إساءة الاستخدام
من دون حظر المساهمين الشرعيين.

<AccordionGroup>
  <Accordion title="فحوصات الأمان">
    يجري ClawHub فحوصات أمان مؤتمتة على Skills المنشورة وإصدارات Plugins.
    تلخص صفحات التفاصيل العامة النتيجة الحالية، وترتبط صفوف الفاحص
    بصفحات تفاصيل مخصصة لـ VirusTotal وClawScan والتحليل الثابت.

    قد تكون الإصدارات المحتجزة بسبب الفحص أو المحظورة غير متاحة في الكتالوج العام
    وواجهات التثبيت، مع بقائها مرئية لمالكها في `/dashboard`.

  </Accordion>
  <Accordion title="الإبلاغ">
    - يمكن لأي مستخدم مسجل الدخول الإبلاغ عن Skill.
    - أسباب الإبلاغ مطلوبة وتُسجَّل.
    - يمكن لكل مستخدم امتلاك ما يصل إلى 20 بلاغًا نشطًا في الوقت نفسه.
    - تُخفى Skills التي لديها أكثر من 3 بلاغات فريدة تلقائيًا افتراضيًا.

  </Accordion>
  <Accordion title="الإشراف">
    - يمكن للمشرفين عرض Skills المخفية، وإظهارها، وحذفها، أو حظر المستخدمين.
    - قد يؤدي إساءة استخدام ميزة الإبلاغ إلى حظر الحسابات.
    - هل ترغب في أن تصبح مشرفًا؟ اسأل في Discord الخاص بـ OpenClaw وتواصل مع مشرف أو مسؤول صيانة.

  </Accordion>
</AccordionGroup>

## CLI الخاص بـ ClawHub

تحتاج إلى هذا فقط لسير العمل الموثّق مع السجل مثل
النشر/المزامنة.

### الخيارات العامة

<ParamField path="--workdir <dir>" type="string">
  دليل العمل. الافتراضي: الدليل الحالي؛ ويعود إلى مساحة عمل OpenClaw.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  دليل Skills، نسبيًا إلى دليل العمل.
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
  <Accordion title="المصادقة (login / logout / whoami)">
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
  <Accordion title="بحث">
    ```bash
    clawhub search "query"
    ```

    يبحث في Skills. لاكتشاف Plugins/الحزم، استخدم `clawhub package explore`.

    - `--limit <n>` — الحد الأقصى للنتائج.

  </Accordion>
  <Accordion title="تصفح / فحص Plugins">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` و`package inspect` هما واجهتا CLI الخاص بـ ClawHub لاكتشاف Plugins/الحزم وفحص البيانات التعريفية. لا تزال عمليات التثبيت الأصلية في OpenClaw تستخدم `openclaw plugins install clawhub:<package>`.

    الخيارات:

    - `--family skill|code-plugin|bundle-plugin` — تصفية عائلة الحزمة.
    - `--official` — عرض الحزم الرسمية فقط.
    - `--executes-code` — عرض الحزم التي تنفذ كودًا فقط.
    - `--version <version>` / `--tag <tag>` — فحص إصدار حزمة محدد.
    - `--versions`, `--files`, `--file <path>` — فحص سجل الحزمة وملفاتها.
    - `--json` — مخرجات قابلة للقراءة آليًا.

  </Accordion>
  <Accordion title="التثبيت / التحديث / العرض">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    الخيارات:

    - `--version <version>` — التثبيت أو التحديث إلى إصدار محدد (slug واحد فقط في `update`).
    - `--force` — الكتابة فوقه إذا كان المجلد موجودًا بالفعل، أو عندما لا تطابق الملفات المحلية أي إصدار منشور.
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
    عنوان URL على GitHub.

    الخيارات:

    - `--dry-run` — بناء خطة النشر الدقيقة من دون رفع أي شيء.
    - `--json` — إصدار مخرجات قابلة للقراءة آليًا من أجل CI.
    - `--source-repo`, `--source-commit`, `--source-ref` — تجاوزات اختيارية عندما لا يكون الاكتشاف التلقائي كافيًا.

  </Accordion>
  <Accordion title="طلب إعادة الفحص">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    تتطلب أوامر إعادة الفحص رمز مالك مسجل الدخول وتستهدف أحدث
    إصدار منشور من Skill أو إصدار Plugin. في التشغيلات غير التفاعلية، مرّر
    `--yes`.

    تتضمن استجابات JSON نوع الهدف، والاسم، والإصدار، وحالة إعادة الفحص، وعدد
    الطلبات المتبقية/الأقصى لذلك الإصدار أو ذلك الإصدار المنشور.

  </Accordion>
  <Accordion title="حذف / إلغاء الحذف (المالك أو المسؤول)">
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
    - `--dry-run` — عرض ما كان سيرفع.
    - `--bump <type>` — `patch|minor|major` للتحديثات (الافتراضي: `patch`).
    - `--changelog <text>` — سجل التغييرات للتحديثات غير التفاعلية.
    - `--tags <tags>` — وسوم مفصولة بفواصل (الافتراضي: `latest`).
    - `--concurrency <n>` — فحوصات السجل (الافتراضي: `4`).

  </Accordion>
</AccordionGroup>

## سير العمل الشائعة

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
  <Tab title="نشر Skill واحدة">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="مزامنة Skills عديدة">
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

ينبغي أن تشحن الحزم المنشورة **JavaScript مبنياً** وأن تشير
`runtimeExtensions` إلى ذلك الناتج. ما تزال تثبيتات Git checkout قادرة على الرجوع إلى مصدر TypeScript عند عدم وجود ملفات مبنية، لكن إدخالات وقت التشغيل المبنية تتجنب تجميع TypeScript في وقت التشغيل ضمن مسارات بدء التشغيل وdoctor وتحميل Plugin.

## تحديد الإصدارات وملف القفل والقياسات

<AccordionGroup>
  <Accordion title="تحديد الإصدارات والوسوم">
    - ينشئ كل نشر `SkillVersion` جديداً وفق **semver**.
    - تشير الوسوم (مثل `latest`) إلى إصدار؛ ويتيح لك نقل الوسوم التراجع.
    - تُرفق سجلات التغيير بكل إصدار ويمكن أن تكون فارغة عند مزامنة التحديثات أو نشرها.

  </Accordion>
  <Accordion title="التغييرات المحلية مقابل إصدارات السجل">
    تقارن التحديثات محتويات Skill المحلية بإصدارات السجل باستخدام
    تجزئة المحتوى. إذا لم تطابق الملفات المحلية أي إصدار منشور، فإن
    CLI يسأل قبل الكتابة فوقها (أو يتطلب `--force` في
    عمليات التشغيل غير التفاعلية).
  </Accordion>
  <Accordion title="فحص المزامنة وجذور الرجوع الاحتياطي">
    يفحص `clawhub sync` دليل العمل الحالي لديك أولاً. إذا لم يُعثر على Skills،
    فإنه يرجع إلى المواقع القديمة المعروفة (على سبيل المثال
    `~/openclaw/skills` و`~/.openclaw/skills`). صُمم هذا للعثور على
    تثبيتات Skill الأقدم من دون أعلام إضافية.
  </Accordion>
  <Accordion title="التخزين وملف القفل">
    - تُسجل Skills المثبتة في `.clawhub/lock.json` ضمن دليل العمل لديك.
    - تُخزن رموز المصادقة في ملف إعدادات ClawHub CLI (يمكن التجاوز عبر `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="القياسات (أعداد التثبيت)">
    عند تشغيل `clawhub sync` وأنت مسجل الدخول، يرسل CLI لقطة مصغرة
    لحساب أعداد التثبيت. يمكنك تعطيل هذا بالكامل:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## متغيرات البيئة

| المتغير                       | الأثر                                           |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | تجاوز عنوان URL للموقع.                         |
| `CLAWHUB_REGISTRY`            | تجاوز عنوان URL لواجهة API الخاصة بالسجل.       |
| `CLAWHUB_CONFIG_PATH`         | تجاوز مكان تخزين CLI للرمز/الإعدادات.          |
| `CLAWHUB_WORKDIR`             | تجاوز دليل العمل الافتراضي.                    |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تعطيل القياسات عند `sync`.                     |

## ذات صلة

- [Plugins المجتمع](/ar/plugins/community)
- [Plugins](/ar/tools/plugin)
- [Skills](/ar/tools/skills)

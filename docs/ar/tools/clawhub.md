---
read_when:
    - البحث عن Skills أو Plugin أو تثبيتها أو تحديثها
    - نشر Skills أو Plugins إلى السجل
    - تكوين CLI الخاص بـ ClawHub أو تجاوزات البيئة الخاصة به
sidebarTitle: ClawHub
summary: 'ClawHub: سجل عام لـ Skills وPlugins الخاصة بـ OpenClaw، وتدفقات تثبيت أصلية، وواجهة clawhub CLI'
title: ClawHub
x-i18n:
    generated_at: "2026-05-02T07:44:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 353b224ccfb8096c270b7896e640e9e419fcb50c265298102a5ce0173566933e
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub هو السجل العام لـ **OpenClaw Skills وplugins**.

- استخدم أوامر `openclaw` الأصلية للبحث عن Skills وتثبيتها وتحديثها، ولتثبيت plugins من ClawHub.
- استخدم CLI المنفصل `clawhub` للمصادقة في السجل، والنشر، والحذف/إلغاء الحذف، وسير عمل المزامنة.

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
    لسير العمل المصادق عليه في السجل (النشر، المزامنة، الإدارة)، ثبّت
    CLI المنفصل `clawhub`:

    ```bash
    npm i -g clawhub
    # or
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## مسارات OpenClaw الأصلية

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    تثبّت أوامر `openclaw` الأصلية داخل مساحة العمل النشطة لديك وتحفظ
    بيانات تعريف المصدر بحيث يمكن لاستدعاءات `update` اللاحقة البقاء على ClawHub.

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    يستعلم `plugins search` من كتالوج Plugin في ClawHub ويطبع أسماء
    الحزم الجاهزة للتثبيت. تتم أيضًا تجربة مواصفات Plugin العارية الآمنة لـ npm
    مقابل ClawHub قبل npm:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    استخدم `npm:<package>` عندما تريد حصر الحل في npm فقط دون
    بحث في ClawHub:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    تتحقق عمليات تثبيت Plugin من توافق `pluginApi` و
    `minGatewayVersion` المعلن عنهما قبل تشغيل تثبيت الأرشيف، لذلك
    تفشل المضيفات غير المتوافقة مبكرًا وبشكل مغلق بدلًا من تثبيت
    الحزمة جزئيًا. عندما ينشر إصدار حزمة أداة ClawPack،
    يفضّل OpenClaw تلك الأداة، ويتحقق من ترويسة ملخص ClawHub والبايتات
    المنزّلة، ويسجل بيانات تعريف ملخص ClawPack للتحديثات اللاحقة.
    تستمر إصدارات الحزم الأقدم التي لا تحتوي بيانات تعريف ClawPack في استخدام
    مسار التحقق القديم من أرشيف الحزمة.

  </Tab>
</Tabs>

<Note>
لا يقبل `openclaw plugins install clawhub:...` إلا عائلات Plugin
القابلة للتثبيت. إذا كانت حزمة ClawHub هي في الواقع Skill، يتوقف OpenClaw
ويوجهك إلى `openclaw skills install <slug>` بدلًا من ذلك.

تفشل عمليات تثبيت Plugin المجهولة من ClawHub أيضًا بشكل مغلق للحزم الخاصة.
لا يزال بإمكان القنوات المجتمعية أو غير الرسمية الأخرى التثبيت، لكن OpenClaw
يعرض تحذيرًا كي يتمكن المشغلون من مراجعة المصدر والتحقق قبل تمكينها.
</Note>

## ما هو ClawHub

- سجل عام لـ OpenClaw Skills وplugins.
- مخزن بإصدارات لحزم Skills وبياناتها التعريفية.
- سطح اكتشاف للبحث والوسوم وإشارات الاستخدام.

تتكون Skill النموذجية من حزمة ملفات ذات إصدار تشمل:

- ملف `SKILL.md` يحتوي على الوصف والاستخدام الأساسيين.
- إعدادات أو scripts اختيارية أو ملفات داعمة تستخدمها Skill.
- بيانات تعريفية مثل الوسوم والملخص ومتطلبات التثبيت.

يستخدم ClawHub البيانات التعريفية لتشغيل الاكتشاف وعرض قدرات Skill
بأمان. يتتبع السجل إشارات الاستخدام (النجوم، التنزيلات) لتحسين
الترتيب والظهور. ينشئ كل نشر إصدار semver جديدًا، ويحتفظ السجل
بسجل الإصدارات حتى يتمكن المستخدمون من تدقيق التغييرات.

## مساحة العمل وتحميل Skill

يثبّت CLI المنفصل `clawhub` أيضًا Skills داخل `./skills` ضمن
دليل العمل الحالي لديك. إذا كانت مساحة عمل OpenClaw مهيأة،
يرجع `clawhub` إلى تلك المساحة ما لم تتجاوز ذلك باستخدام `--workdir`
(أو `CLAWHUB_WORKDIR`). يحمّل OpenClaw Skills مساحة العمل من
`<workspace>/skills` ويلتقطها في الجلسة **التالية**.

إذا كنت تستخدم بالفعل `~/.openclaw/skills` أو Skills المضمّنة، فإن
Skills مساحة العمل لها الأولوية. لمزيد من التفاصيل حول كيفية تحميل Skills
ومشاركتها وضبط بواباتها، راجع [Skills](/ar/tools/skills).

## ميزات الخدمة

| الميزة                  | الملاحظات                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| التصفح العام          | يمكن عرض Skills ومحتوى `SKILL.md` الخاص بها علنًا.          |
| البحث                   | مدعوم بالتضمينات (بحث متجهي)، وليس بالكلمات المفتاحية فقط.               |
| الإصدارات               | Semver، وسجلات التغيير، والوسوم (بما في ذلك `latest`).                  |
| التنزيلات                | Zip لكل إصدار.                                                    |
| النجوم والتعليقات       | ملاحظات المجتمع.                                                 |
| ملخصات الفحص الأمني  | تعرض صفحات التفاصيل أحدث حالة فحص قبل التثبيت أو التنزيل. |
| صفحات تفاصيل الفاحص     | تحتوي نتائج VirusTotal وClawScan والتحليل الثابت على روابط عميقة.  |
| لوحة استرداد المالك | يمكن للناشرين رؤية المحتوى المملوك والمحتجز بسبب الفحص من `/dashboard`.       |
| إعادة الفحص بطلب المالك  | يمكن للمالكين طلب عمليات إعادة فحص محدودة لاسترداد النتائج الإيجابية الكاذبة.     |
| الإشراف               | الموافقات والتدقيقات.                                               |
| API ملائمة لـ CLI         | مناسبة للأتمتة والبرمجة النصية.                              |

## الأمان والإشراف

ClawHub مفتوح افتراضيًا — يمكن لأي شخص رفع Skills، لكن يجب أن يكون
حساب GitHub **بعمر أسبوع واحد على الأقل** للنشر. هذا يبطئ
إساءة الاستخدام دون حظر المساهمين الشرعيين.

<AccordionGroup>
  <Accordion title="الفحوصات الأمنية">
    يجري ClawHub فحوصات أمنية آلية على Skills المنشورة وإصدارات Plugin.
    تلخص صفحات التفاصيل العامة النتيجة الحالية، وترتبط صفوف الفاحص
    بصفحات تفاصيل مخصصة لـ VirusTotal وClawScan والتحليل الثابت.

    قد لا تكون الإصدارات المحتجزة بسبب الفحص أو المحظورة متاحة في الكتالوج العام
    وأسطح التثبيت، مع بقائها مرئية لمالكها في `/dashboard`.

  </Accordion>
  <Accordion title="الإبلاغ">
    - يمكن لأي مستخدم مسجّل الدخول الإبلاغ عن Skill.
    - أسباب الإبلاغ مطلوبة ويتم تسجيلها.
    - يمكن لكل مستخدم امتلاك ما يصل إلى 20 بلاغًا نشطًا في الوقت نفسه.
    - يتم إخفاء Skills التي لديها أكثر من 3 بلاغات فريدة تلقائيًا افتراضيًا.

  </Accordion>
  <Accordion title="الإشراف">
    - يمكن للمشرفين عرض Skills المخفية، أو إظهارها، أو حذفها، أو حظر المستخدمين.
    - يمكن أن يؤدي إساءة استخدام ميزة الإبلاغ إلى حظر الحساب.
    - هل ترغب في أن تصبح مشرفًا؟ اسأل في Discord الخاص بـ OpenClaw وتواصل مع مشرف أو مشرف صيانة.

  </Accordion>
</AccordionGroup>

## CLI الخاص بـ ClawHub

تحتاج إلى هذا فقط لسير العمل المصادق عليه في السجل مثل
النشر/المزامنة.

### الخيارات العامة

<ParamField path="--workdir <dir>" type="string">
  دليل العمل. الافتراضي: الدليل الحالي؛ يرجع إلى مساحة عمل OpenClaw.
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

    - `--token <token>` — ألصق رمز API.
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

    `package explore` و`package inspect` هما سطحا CLI الخاص بـ ClawHub لاكتشاف Plugin/الحزم وفحص البيانات التعريفية. لا تزال عمليات تثبيت OpenClaw الأصلية تستخدم `openclaw plugins install clawhub:<package>`.

    الخيارات:

    - `--family skill|code-plugin|bundle-plugin` — تصفية عائلة الحزمة.
    - `--official` — عرض الحزم الرسمية فقط.
    - `--executes-code` — عرض الحزم التي تنفّذ الكود فقط.
    - `--version <version>` / `--tag <tag>` — فحص إصدار حزمة محدد.
    - `--versions`, `--files`, `--file <path>` — فحص سجل الحزمة والملفات.
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

    - `--version <version>` — التثبيت أو التحديث إلى إصدار محدد (slug واحد فقط عند `update`).
    - `--force` — الاستبدال إذا كان المجلد موجودًا بالفعل، أو عندما لا تطابق الملفات المحلية أي إصدار منشور.
    - يقرأ `clawhub list` من `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="نشر Skills">
    ```bash
    clawhub skill publish <path>
    ```

    الخيارات:

    - `--slug <slug>` — slug الخاص بـ Skill.
    - `--name <name>` — اسم العرض.
    - `--version <version>` — إصدار semver.
    - `--changelog <text>` — نص سجل التغيير (يمكن أن يكون فارغًا).
    - `--tags <tags>` — وسوم مفصولة بفواصل (الافتراضي: `latest`).

  </Accordion>
  <Accordion title="نشر Plugins">
    ```bash
    clawhub package publish <source>
    ```

    يمكن أن يكون `<source>` مجلدًا محليًا، أو `owner/repo`، أو `owner/repo@ref`، أو
    عنوان URL من GitHub.

    الخيارات:

    - `--dry-run` — بناء خطة النشر الدقيقة دون رفع أي شيء.
    - `--json` — إخراج مخرجات قابلة للقراءة آليًا لـ CI.
    - `--source-repo`, `--source-commit`, `--source-ref` — تجاوزات اختيارية عندما لا يكون الاكتشاف التلقائي كافيًا.

  </Accordion>
  <Accordion title="طلب إعادة الفحص">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    تتطلب أوامر إعادة الفحص رمز مالك مسجّل الدخول وتستهدف أحدث
    إصدار Skill منشور أو إصدار Plugin. في التشغيل غير التفاعلي، مرّر
    `--yes`.

    تتضمن استجابات JSON نوع الهدف واسمه وإصداره وحالة إعادة الفحص
    وأعداد الطلبات المتبقية/القصوى لذلك الإصدار أو الإصدار المنشور.

  </Accordion>
  <Accordion title="الحذف / إلغاء الحذف (المالك أو المسؤول)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="المزامنة (فحص المحلي + نشر الجديد أو المحدث)">
    ```bash
    clawhub sync
    ```

    الخيارات:

    - `--root <dir...>` — جذور فحص إضافية.
    - `--all` — رفع كل شيء دون مطالبات.
    - `--dry-run` — عرض ما سيتم رفعه.
    - `--bump <type>` — `patch|minor|major` للتحديثات (الافتراضي: `patch`).
    - `--changelog <text>` — سجل التغيير للتحديثات غير التفاعلية.
    - `--tags <tags>` — وسوم مفصولة بفواصل (الافتراضي: `latest`).
    - `--concurrency <n>` — فحوصات السجل (الافتراضي: `4`).

  </Accordion>
</AccordionGroup>

## سير العمل الشائعة

<Tabs>
  <Tab title="Search">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Find a plugin">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "memory" --family code-plugin
    clawhub package inspect episodic-claw
    ```
  </Tab>
  <Tab title="Install">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="Update all">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="Publish a single skill">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="Sync many skills">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="Publish a plugin from GitHub">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### بيانات تعريف حزمة Plugin

يجب أن تتضمن إضافات الشيفرة بيانات تعريف OpenClaw المطلوبة في
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
`runtimeExtensions` إلى ذلك الناتج. لا تزال تثبيتات Git checkout قادرة على الرجوع
إلى مصدر TypeScript عند عدم وجود ملفات مبنية، لكن إدخالات وقت التشغيل المبنية
تتجنب تجميع TypeScript في وقت التشغيل ضمن مسارات بدء التشغيل، وdoctor، وتحميل
Plugin.

## تحديد الإصدارات، وملف القفل، والقياسات

<AccordionGroup>
  <Accordion title="Versioning and tags">
    - ينشئ كل نشر `SkillVersion` جديداً وفق **semver**.
    - تشير الوسوم (مثل `latest`) إلى إصدار؛ ويتيح لك نقل الوسوم الرجوع إلى إصدار سابق.
    - تُرفق سجلات التغييرات بكل إصدار، ويمكن أن تكون فارغة عند مزامنة التحديثات أو نشرها.

  </Accordion>
  <Accordion title="Local changes vs registry versions">
    تقارن التحديثات محتويات المهارة المحلية بإصدارات السجل باستخدام
    تجزئة محتوى. إذا لم تطابق الملفات المحلية أي إصدار منشور، يطلب
    CLI التأكيد قبل الاستبدال (أو يتطلب `--force` في
    عمليات التشغيل غير التفاعلية).
  </Accordion>
  <Accordion title="Sync scanning and fallback roots">
    يفحص `clawhub sync` دليل العمل الحالي لديك أولاً. إذا لم يعثر على أي مهارات،
    فإنه يرجع إلى مواقع قديمة معروفة (على سبيل المثال
    `~/openclaw/skills` و`~/.openclaw/skills`). صُمم هذا
    للعثور على تثبيتات المهارات الأقدم دون أعلام إضافية.
  </Accordion>
  <Accordion title="Storage and lockfile">
    - تُسجل المهارات المثبتة في `.clawhub/lock.json` ضمن دليل العمل لديك.
    - تُخزن رموز المصادقة في ملف إعدادات ClawHub CLI (يمكن التجاوز عبر `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Telemetry (install counts)">
    عند تشغيل `clawhub sync` أثناء تسجيل الدخول، يرسل CLI لقطة
    حدية لحساب أعداد التثبيت. يمكنك تعطيل ذلك بالكامل:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## متغيرات البيئة

| المتغير                       | التأثير                                        |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | تجاوز عنوان URL للموقع.                        |
| `CLAWHUB_REGISTRY`            | تجاوز عنوان URL لواجهة API الخاصة بالسجل.      |
| `CLAWHUB_CONFIG_PATH`         | تجاوز مكان تخزين CLI للرمز/الإعدادات.          |
| `CLAWHUB_WORKDIR`             | تجاوز دليل العمل الافتراضي.                    |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تعطيل القياسات عند `sync`.                     |

## ذات صلة

- [إضافات المجتمع](/ar/plugins/community)
- [Plugins](/ar/tools/plugin)
- [Skills](/ar/tools/skills)

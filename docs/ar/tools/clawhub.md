---
read_when:
    - البحث عن Skills أو Plugins أو تثبيتها أو تحديثها
    - نشر Skills أو Plugins إلى السجل
    - تكوين CLI الخاص بـ clawhub أو تجاوزات البيئة الخاصة به
sidebarTitle: ClawHub
summary: 'ClawHub: السجل العام لـ Skills وPlugins في OpenClaw، وتدفقات التثبيت الأصلية، وواجهة CLI الخاصة بـ clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-05-06T08:16:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78ccf1911344d71b3b1c2c94691e15108305348e09db62aaaf1d03d852984acd
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub هو السجل العام لـ **Skills وPlugins في OpenClaw**.

- استخدم أوامر `openclaw` الأصلية للبحث عن Skills وتثبيتها وتحديثها، ولتثبيت Plugins من ClawHub.
- استخدم CLI المنفصل `clawhub` لسير عمل مصادقة السجل، والنشر، والحذف/إلغاء الحذف، والمزامنة.

الموقع: [clawhub.ai](https://clawhub.ai)

## البدء السريع

<Steps>
  <Step title="Search">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="Install">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="Use">
    ابدأ جلسة OpenClaw جديدة - ستلتقط المهارة الجديدة.
  </Step>
  <Step title="Publish (optional)">
    لسير العمل الموثق في السجل (النشر، المزامنة، الإدارة)، ثبّت
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

    تثبّت أوامر `openclaw` الأصلية في مساحة العمل النشطة لديك
    وتحفظ بيانات تعريف المصدر بحيث يمكن لاستدعاءات `update` اللاحقة أن تبقى على ClawHub.

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    يستعلم `plugins search` من كتالوج Plugins في ClawHub ويطبع أسماء حزم
    جاهزة للتثبيت. استخدم `clawhub:<package>` عندما تريد حل ClawHub.
    مواصفات Plugins العارية الآمنة لـ npm تُثبّت من npm أثناء انتقال الإطلاق:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    `npm:<package>` خاص أيضًا بـ npm فقط ومفيد عندما يمكن أن تكون المواصفة
    ملتبسة بطريقة أخرى:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    تتحقق عمليات تثبيت Plugins من توافق `pluginApi` و
    `minGatewayVersion` المعلن عنهما قبل تشغيل تثبيت الأرشيف، لذلك
    تفشل المضيفات غير المتوافقة مبكرًا وبشكل مغلق بدلًا من تثبيت
    الحزمة جزئيًا. عندما تنشر نسخة حزمة عنصر ClawPack،
    يفضّل OpenClaw ملف `.tgz` المحمّل المطابق لحزمة npm، ويتحقق من ترويسة
    ملخص ClawHub والبايتات المنزّلة، ويسجل نوع العنصر، وتكامل npm،
    وshasum الخاص بـ npm، واسم tarball، وبيانات تعريف ملخص ClawPack للتحديثات
    اللاحقة. لا تزال نسخ الحزم الأقدم التي لا تحتوي على بيانات تعريف ClawPack تستخدم
    مسار التحقق القديم من أرشيف الحزمة.

  </Tab>
</Tabs>

<Note>
لا يقبل `openclaw plugins install clawhub:...` إلا عائلات Plugins
القابلة للتثبيت. إذا كانت حزمة ClawHub في الواقع مهارة، يتوقف OpenClaw
ويوجهك إلى `openclaw skills install <slug>` بدلًا من ذلك.

تفشل أيضًا عمليات تثبيت Plugins المجهولة من ClawHub بشكل مغلق للحزم الخاصة.
لا يزال بإمكان القنوات المجتمعية أو غير الرسمية الأخرى التثبيت، لكن OpenClaw
يحذر حتى يتمكن المشغلون من مراجعة المصدر والتحقق قبل تمكينها.
</Note>

## ما هو ClawHub

- سجل عام لـ Skills وPlugins الخاصة بـ OpenClaw.
- مخزن بإصدارات لحزم Skills وبياناتها التعريفية.
- سطح اكتشاف للبحث والوسوم وإشارات الاستخدام.

المهارة النموذجية هي حزمة ملفات بإصدار تتضمن:

- ملف `SKILL.md` يحتوي على الوصف الأساسي والاستخدام.
- إعدادات اختيارية أو نصوص برمجية أو ملفات داعمة تستخدمها المهارة.
- بيانات تعريف مثل الوسوم والملخص ومتطلبات التثبيت.

يستخدم ClawHub البيانات التعريفية لتشغيل الاكتشاف وعرض قدرات Skills
بأمان. يتتبع السجل إشارات الاستخدام (النجوم، التنزيلات) لتحسين
الترتيب والظهور. ينشئ كل نشر إصدار semver جديدًا، ويحتفظ السجل بسجل
الإصدارات حتى يتمكن المستخدمون من تدقيق التغييرات.

## مساحة العمل وتحميل Skills

يثبّت CLI المنفصل `clawhub` أيضًا Skills في `./skills` ضمن
دليل العمل الحالي لديك. إذا كانت مساحة عمل OpenClaw مهيأة،
يتراجع `clawhub` إلى مساحة العمل تلك ما لم تتجاوز `--workdir`
(أو `CLAWHUB_WORKDIR`). يحمّل OpenClaw Skills الخاصة بمساحة العمل من
`<workspace>/skills` ويلتقطها في الجلسة **التالية**.

إذا كنت تستخدم بالفعل `~/.openclaw/skills` أو Skills المضمّنة، فستكون
Skills الخاصة بمساحة العمل لها الأولوية. لمزيد من التفاصيل حول كيفية تحميل Skills
ومشاركتها وضبط بواباتها، راجع [Skills](/ar/tools/skills).

## ميزات الخدمة

| الميزة                  | ملاحظات                                                               |
| ------------------------ | ------------------------------------------------------------------- |
| التصفح العام          | يمكن عرض Skills ومحتوى `SKILL.md` الخاص بها علنًا.          |
| البحث                   | مدعوم بالتضمينات (بحث متجهي)، وليس كلمات مفتاحية فقط.               |
| إدارة الإصدارات               | semver، وسجلات التغييرات، والوسوم (بما في ذلك `latest`).                  |
| التنزيلات                | ملف Zip لكل إصدار.                                                    |
| النجوم والتعليقات       | ملاحظات المجتمع.                                                 |
| ملخصات الفحص الأمني  | تعرض صفحات التفاصيل أحدث حالة فحص قبل التثبيت أو التنزيل. |
| صفحات تفاصيل الماسح     | تحتوي نتائج VirusTotal وClawScan والتحليل الثابت على روابط عميقة.  |
| لوحة استرداد المالك | يمكن للناشرين رؤية المحتوى المملوك المحتجز للفحص من `/dashboard`.       |
| عمليات إعادة الفحص بطلب المالك  | يمكن للمالكين طلب عمليات إعادة فحص محدودة لاسترداد النتائج الإيجابية الكاذبة.     |
| الإشراف               | الموافقات والتدقيقات.                                               |
| API ملائم لـ CLI         | مناسب للأتمتة والبرمجة النصية.                              |

## الأمان والإشراف

ClawHub مفتوح افتراضيًا - يمكن لأي شخص تحميل Skills، لكن يجب أن يكون حساب GitHub
**عمره أسبوع واحد على الأقل** للنشر. يبطئ هذا إساءة الاستخدام
من دون حظر المساهمين الشرعيين.

<AccordionGroup>
  <Accordion title="Security scans">
    يشغّل ClawHub فحوصات أمان آلية على Skills وإصدارات Plugins المنشورة.
    تلخص صفحات التفاصيل العامة النتيجة الحالية، وتربط صفوف الماسحات
    بصفحات تفاصيل مخصصة لـ VirusTotal وClawScan والتحليل الثابت.

    قد لا تكون الإصدارات المحتجزة للفحص أو المحظورة متاحة في الكتالوج العام
    وأسطح التثبيت بينما تظل مرئية لمالكها في `/dashboard`.

  </Accordion>
  <Accordion title="Reporting">
    - يمكن لأي مستخدم مسجل الدخول الإبلاغ عن مهارة.
    - أسباب البلاغات مطلوبة ويتم تسجيلها.
    - يمكن لكل مستخدم أن يكون لديه ما يصل إلى 20 بلاغًا نشطًا في الوقت نفسه.
    - يتم إخفاء Skills التي لديها أكثر من 3 بلاغات فريدة تلقائيًا افتراضيًا.

  </Accordion>
  <Accordion title="Moderation">
    - يمكن للمشرفين عرض Skills المخفية، وإظهارها، وحذفها، أو حظر المستخدمين.
    - قد يؤدي إساءة استخدام ميزة الإبلاغ إلى حظر الحساب.
    - هل أنت مهتم بأن تصبح مشرفًا؟ اسأل في Discord الخاص بـ OpenClaw وتواصل مع مشرف أو مشرف صيانة.

  </Accordion>
</AccordionGroup>

## CLI الخاص بـ ClawHub

تحتاج إلى هذا فقط لسير العمل الموثق في السجل مثل
النشر/المزامنة.

### الخيارات العامة

<ParamField path="--workdir <dir>" type="string">
  دليل العمل. الافتراضي: الدليل الحالي؛ يتراجع إلى مساحة عمل OpenClaw.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  دليل Skills، نسبيًا إلى workdir.
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
  <Accordion title="Auth (login / logout / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    خيارات تسجيل الدخول:

    - `--token <token>` - الصق رمز API.
    - `--label <label>` - تسمية مخزنة لرموز تسجيل الدخول عبر المتصفح (الافتراضي: `CLI token`).
    - `--no-browser` - لا تفتح متصفحًا (يتطلب `--token`).

  </Accordion>
  <Accordion title="Search">
    ```bash
    clawhub search "query"
    ```

    يبحث في Skills. لاكتشاف Plugins/الحزم، استخدم `clawhub package explore`.

    - `--limit <n>` - الحد الأقصى للنتائج.

  </Accordion>
  <Accordion title="Browse / inspect plugins">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` و`package inspect` هما سطحا CLI الخاص بـ ClawHub لاكتشاف Plugins/الحزم وفحص البيانات التعريفية. لا تزال عمليات تثبيت OpenClaw الأصلية تستخدم `openclaw plugins install clawhub:<package>`.

    الخيارات:

    - `--family skill|code-plugin|bundle-plugin` - تصفية عائلة الحزمة.
    - `--official` - إظهار الحزم الرسمية فقط.
    - `--executes-code` - إظهار الحزم التي تنفذ التعليمات البرمجية فقط.
    - `--version <version>` / `--tag <tag>` - فحص إصدار حزمة محدد.
    - `--versions`، `--files`، `--file <path>` - فحص تاريخ الحزمة وملفاتها.
    - `--json` - مخرجات قابلة للقراءة آليًا.

  </Accordion>
  <Accordion title="Install / update / list">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    الخيارات:

    - `--version <version>` - التثبيت أو التحديث إلى إصدار محدد (slug واحد فقط في `update`).
    - `--force` - الكتابة فوقه إذا كان المجلد موجودًا بالفعل، أو عندما لا تطابق الملفات المحلية أي إصدار منشور.
    - يقرأ `clawhub list` من `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Publish skills">
    ```bash
    clawhub skill publish <path>
    ```

    الخيارات:

    - `--slug <slug>` - slug المهارة.
    - `--name <name>` - اسم العرض.
    - `--version <version>` - إصدار semver.
    - `--changelog <text>` - نص سجل التغييرات (يمكن أن يكون فارغًا).
    - `--tags <tags>` - وسوم مفصولة بفواصل (الافتراضي: `latest`).

  </Accordion>
  <Accordion title="Publish plugins">
    ```bash
    clawhub package publish <source>
    ```

    يمكن أن يكون `<source>` مجلدًا محليًا، أو `owner/repo`، أو `owner/repo@ref`، أو
    عنوان URL على GitHub.

    الخيارات:

    - `--dry-run` - بناء خطة النشر الدقيقة من دون رفع أي شيء.
    - `--json` - إصدار مخرجات قابلة للقراءة آليًا لـ CI.
    - `--source-repo`، `--source-commit`، `--source-ref` - تجاوزات اختيارية عندما لا يكون الاكتشاف التلقائي كافيًا.

  </Accordion>
  <Accordion title="Request rescans">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    تتطلب أوامر إعادة الفحص رمز مالك مسجل الدخول وتستهدف أحدث
    إصدار مهارة منشور أو إصدار Plugin. في التشغيلات غير التفاعلية، مرّر
    `--yes`.

    تتضمن استجابات JSON نوع الهدف، واسمه، وإصداره، وحالة إعادة الفحص، وعدد
    الطلبات المتبقية/الحد الأقصى لذلك الإصدار أو ذلك الإصدار المنشور.

  </Accordion>
  <Accordion title="Delete / undelete (owner or admin)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Sync (scan local + publish new or updated)">
    ```bash
    clawhub sync
    ```

    الخيارات:

    - `--root <dir...>` - جذور فحص إضافية.
    - `--all` - رفع كل شيء من دون مطالبات.
    - `--dry-run` - إظهار ما سيتم رفعه.
    - `--bump <type>` - `patch|minor|major` للتحديثات (الافتراضي: `patch`).
    - `--changelog <text>` - سجل تغييرات للتحديثات غير التفاعلية.
    - `--tags <tags>` - وسوم مفصولة بفواصل (الافتراضي: `latest`).
    - `--concurrency <n>` - فحوصات السجل (الافتراضي: `4`).

  </Accordion>
</AccordionGroup>

## سير العمل الشائع

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
  <Tab title="مزامنة عدة Skills">
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
`runtimeExtensions` إلى ذلك الناتج. لا تزال تثبيتات Git checkout قادرة على الرجوع
إلى مصدر TypeScript عند عدم وجود ملفات مبنية، لكن إدخالات وقت التشغيل المبنية
تتجنب تجميع TypeScript في وقت التشغيل ضمن مسارات بدء التشغيل، وdoctor، وتحميل
Plugin.

## تعيين الإصدارات، وملف القفل، والقياس عن بُعد

<AccordionGroup>
  <Accordion title="تعيين الإصدارات والوسوم">
    - ينشئ كل نشر إصدار **semver** جديدًا من `SkillVersion`.
    - تشير الوسوم (مثل `latest`) إلى إصدار؛ ويتيح لك نقل الوسوم التراجع.
    - تُرفق سجلات التغييرات بكل إصدار ويمكن أن تكون فارغة عند مزامنة التحديثات أو نشرها.

  </Accordion>
  <Accordion title="التغييرات المحلية مقابل إصدارات السجل">
    تقارن التحديثات محتويات Skill المحلية بإصدارات السجل باستخدام
    تجزئة محتوى. إذا لم تطابق الملفات المحلية أي إصدار منشور، فإن
    CLI يطلب التأكيد قبل الاستبدال (أو يتطلب `--force` في
    عمليات التشغيل غير التفاعلية).
  </Accordion>
  <Accordion title="فحص المزامنة وجذور الرجوع الاحتياطية">
    يفحص `clawhub sync` دليل العمل الحالي أولًا. إذا لم يتم العثور على أي Skills،
    فإنه يرجع إلى مواقع قديمة معروفة (على سبيل المثال
    `~/openclaw/skills` و`~/.openclaw/skills`). صُمم ذلك
    للعثور على تثبيتات Skills القديمة من دون أعلام إضافية.
  </Accordion>
  <Accordion title="التخزين وملف القفل">
    - تُسجل Skills المثبتة في `.clawhub/lock.json` ضمن دليل العمل لديك.
    - تُخزن رموز المصادقة في ملف إعدادات ClawHub CLI (يمكن التجاوز عبر `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="القياس عن بُعد (أعداد التثبيت)">
    عند تشغيل `clawhub sync` أثناء تسجيل الدخول، يرسل CLI لقطة حدّية
    لحساب أعداد التثبيت. يمكنك تعطيل ذلك بالكامل:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## متغيرات البيئة

| المتغير                       | التأثير                                         |
| ----------------------------- | ----------------------------------------------- |
| `CLAWHUB_SITE`                | تجاوز عنوان URL للموقع.                        |
| `CLAWHUB_REGISTRY`            | تجاوز عنوان URL لواجهة API الخاصة بالسجل.       |
| `CLAWHUB_CONFIG_PATH`         | تجاوز المكان الذي يخزن فيه CLI الرمز/الإعدادات. |
| `CLAWHUB_WORKDIR`             | تجاوز دليل العمل الافتراضي.                    |
| `CLAWHUB_DISABLE_TELEMETRY=1` | تعطيل القياس عن بُعد عند `sync`.               |

## ذات صلة

- [Plugins المجتمع](/ar/plugins/community)
- [Plugins](/ar/tools/plugin)
- [Skills](/ar/tools/skills)

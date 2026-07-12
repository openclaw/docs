---
read_when:
    - إضافة Skills أو تعديلها
    - تغيير شروط إتاحة Skills أو قوائم السماح أو قواعد التحميل
    - فهم أسبقية Skills وسلوك اللقطة المرحلية
sidebarTitle: Skills
summary: تُعلِّم Skills وكيلك كيفية استخدام الأدوات. تعرّف على كيفية تحميلها، وكيف تعمل الأولوية، وكيفية إعداد التقييد وقوائم السماح وحقن متغيرات البيئة.
title: Skills
x-i18n:
    generated_at: "2026-07-12T06:37:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9eb87daab8a10caab2823e35d68293fe306d11a951e8a2b264cbbe3f2c3e8fff
    source_path: tools/skills.md
    workflow: 16
---

Skills هي ملفات تعليمات بصيغة Markdown تعلّم الوكيل كيفية استخدام
الأدوات ومتى يستخدمها. توجد كل مهارة في دليل يحتوي على ملف `SKILL.md` يتضمن
بيانات YAML أمامية ونصًا بصيغة Markdown. يحمّل OpenClaw المهارات المضمّنة إلى جانب أي
تجاوزات محلية، ويرشّحها وقت التحميل استنادًا إلى البيئة والإعدادات
وتوفّر الملفات الثنائية.

<CardGroup cols={2}>
  <Card title="إنشاء المهارات" href="/ar/tools/creating-skills" icon="hammer">
    أنشئ مهارة مخصصة من الصفر واختبرها.
  </Card>
  <Card title="ورشة المهارات" href="/ar/tools/skill-workshop" icon="flask">
    راجع مقترحات المهارات التي صاغها الوكيل ووافق عليها.
  </Card>
  <Card title="إعدادات المهارات" href="/ar/tools/skills-config" icon="gear">
    مخطط إعدادات `skills.*` الكامل وقوائم السماح الخاصة بالوكلاء.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    تصفّح مهارات المجتمع وثبّتها.
  </Card>
</CardGroup>

## ترتيب التحميل

يحمّل OpenClaw من هذه المصادر، **بدءًا بالأعلى أولوية**. عندما يظهر اسم
المهارة نفسه في مواضع متعددة، تكون الغلبة للمصدر الأعلى.

| الأولوية    | المصدر                 | المسار                                    |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — الأعلى | مهارات مساحة العمل       | `<workspace>/skills`                    |
| 2           | مهارات وكيل المشروع   | `<workspace>/.agents/skills`            |
| 3           | مهارات الوكيل الشخصية  | `~/.agents/skills`                      |
| 4           | المهارات المُدارة / المحلية | `~/.openclaw/skills`                    |
| 5           | المهارات المضمّنة         | تُشحن مع التثبيت                |
| 6 — الأدنى  | الأدلة الإضافية      | `skills.load.extraDirs` + مهارات Plugin |

تدعم جذور المهارات التخطيطات المجمّعة. يكتشف OpenClaw أي مهارة كلما
ظهر `SKILL.md` في أي موضع ضمن جذر مُعدّ (حتى عمق 6 مستويات):

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

يُستخدم مسار المجلد للتنظيم فقط. يأتي اسم المهارة وأمر الشرطة المائلة
من حقل البيانات الأمامية `name` (أو من اسم الدليل عند غياب `name`).
كما تطابق قوائم السماح الخاصة بالوكلاء (أدناه) قيمة `name` هذه.

<Note>
  دليل `$CODEX_HOME/skills` الأصلي في Codex CLI **ليس** جذر مهارات
  في OpenClaw. استخدم `openclaw migrate plan codex` لجرد تلك المهارات، ثم
  `openclaw migrate codex` لنسخها إلى مساحة عمل OpenClaw.
</Note>

## المهارات المستضافة على Node

يمكن لـ Node متصل بلا واجهة رسومية نشر المهارات المثبّتة في دليل مهارات OpenClaw
النشط لديه (`~/.openclaw/skills` افتراضيًا؛ وتُطبّق تجاوزات بيئة الملف
التعريفي). تظهر هذه المهارات في قائمة مهارات الوكيل العادية ما دام Node متصلًا
وتختفي عند انقطاع اتصاله. تحتفظ المهارة المحلية أو مهارة Gateway باسمها عند
التعارض؛ وتتلقى مهارة Node اسمًا حتميًا مسبوقًا بمعرّف Node.
يتطلب الإصدار الأول من المهارات المستضافة على Node أن يطابق اسم الدليل حقل
البيانات الأمامية `name` الخاص بالمهارة.

يتضمن إدخال المهارة محدِّد موقع Node. وتوجد ملفاتها ومراجعها النسبية
وملفاتها الثنائية على Node، لذا حمّلها ونفّذها باستخدام
`exec host=node node=<node-id>`. أعد تشغيل مضيف Node بعد تغيير ملفات
المهارة. راجع [العُقد](/ar/nodes#node-hosted-skills) لمعرفة الاقتران وخيارات التعطيل.

## المهارات الخاصة بكل وكيل مقابل المهارات المشتركة

في إعدادات الوكلاء المتعددين، تكون لكل وكيل مساحة عمل خاصة به. استخدم المسار الذي
يطابق مستوى الظهور المطلوب:

| النطاق          | المسار                         | مرئي لـ                  |
| -------------- | ---------------------------- | --------------------------- |
| خاص بالوكيل      | `<workspace>/skills`         | ذلك الوكيل فقط             |
| وكيل المشروع  | `<workspace>/.agents/skills` | وكيل مساحة العمل تلك فقط |
| الوكيل الشخصي | `~/.agents/skills`           | جميع الوكلاء على هذا الجهاز  |
| مُدار ومشترك | `~/.openclaw/skills`         | جميع الوكلاء على هذا الجهاز  |
| الأدلة الإضافية     | `skills.load.extraDirs`      | جميع الوكلاء على هذا الجهاز  |

## قوائم السماح الخاصة بالوكلاء

يمثّل **موقع** المهارة (الأولوية) و**ظهورها** (الوكيل الذي يمكنه
استخدامها) عنصرَي تحكم منفصلين. استخدم قوائم السماح لتقييد المهارات التي يراها الوكيل،
بغض النظر عن مصدر تحميلها.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // shared baseline
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults entirely
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="قواعد قائمة السماح">
    - احذف `agents.defaults.skills` لترك جميع المهارات بلا قيود افتراضيًا.
    - احذف `agents.list[].skills` لوراثة `agents.defaults.skills`.
    - عيّن `agents.list[].skills: []` لعدم إظهار أي مهارات لذلك الوكيل.
    - تمثّل قائمة `agents.list[].skills` غير الفارغة المجموعة **النهائية** — ولا
      تُدمج مع القيم الافتراضية.
    - تُطبّق قائمة السماح الفعلية على بناء المطالبات واكتشاف أوامر الشرطة المائلة
      ومزامنة صندوق العزل ولقطات المهارات.
    - لا يمثّل ذلك حدًا لتفويض صدفة المضيف. إذا كان الوكيل نفسه يستطيع
      استخدام `exec`، فقيّد تلك الصدفة بشكل منفصل باستخدام صندوق العزل، وعزل
      مستخدم نظام التشغيل، وقوائم المنع/السماح لتنفيذ الأوامر، وبيانات اعتماد خاصة بكل مورد.
  </Accordion>
</AccordionGroup>

## الإضافات والمهارات

يمكن للإضافات شحن مهاراتها الخاصة من خلال إدراج أدلة `skills` في
`openclaw.plugin.json` (بمسارات نسبية إلى جذر Plugin). تُحمّل مهارات Plugin
عند تمكين Plugin — فعلى سبيل المثال، يشحن Plugin المتصفح مهارة
`browser-automation` للتحكم متعدد الخطوات في المتصفح.

تُدمج أدلة مهارات Plugin عند مستوى الأولوية المنخفض نفسه الخاص بـ
`skills.load.extraDirs`، ولذلك تتجاوزها أي مهارة تحمل الاسم نفسه وكانت مضمّنة أو
مُدارة أو خاصة بوكيل أو بمساحة عمل. اضبط أهلية مهارة Plugin نفسها عبر
`metadata.openclaw.requires` في بياناتها الأمامية، كما تفعل مع أي مهارة أخرى.

راجع [الإضافات](/ar/tools/plugin) و[الأدوات](/ar/tools) للاطلاع على نظام الإضافات الكامل.

## ورشة المهارات

[ورشة المهارات](/ar/tools/skill-workshop) هي قائمة انتظار للمقترحات بين الوكيل
وملفات المهارات النشطة لديك. عندما يكتشف الوكيل عملًا قابلًا لإعادة الاستخدام، يصوغ
مقترحًا بدلًا من الكتابة مباشرةً إلى `SKILL.md`. تراجعه وتوافق عليه
قبل أن يتغير أي شيء.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

راجع [ورشة المهارات](/ar/tools/skill-workshop) للاطلاع على دورة الحياة الكاملة ومرجع
CLI والإعدادات.

## التثبيت من ClawHub

يمثّل [ClawHub](https://clawhub.ai) السجل العام للمهارات. استخدم أوامر
`openclaw skills` للتثبيت والتحديث، أو CLI‏ `clawhub` للنشر والمزامنة.

| الإجراء                             | الأمر                                                |
| ---------------------------------- | ------------------------------------------------------ |
| تثبيت مهارة في مساحة العمل | `openclaw skills install @owner/<slug>`                |
| التثبيت من مستودع Git      | `openclaw skills install git:owner/repo@ref`           |
| تثبيت دليل مهارة محلي    | `openclaw skills install ./path/to/skill --as my-tool` |
| التثبيت لجميع الوكلاء المحليين       | `openclaw skills install @owner/<slug> --global`       |
| تحديث جميع مهارات مساحة العمل        | `openclaw skills update --all`                         |
| تحديث مهارة مشتركة مُدارة      | `openclaw skills update @owner/<slug> --global`        |
| تحديث جميع المهارات المشتركة المُدارة   | `openclaw skills update --all --global`                |
| التحقق من نطاق الثقة لمهارة    | `openclaw skills verify @owner/<slug>`                 |
| طباعة بطاقة المهارة المُنشأة     | `openclaw skills verify @owner/<slug> --card`          |
| النشر / المزامنة عبر CLI‏ ClawHub     | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="تفاصيل التثبيت">
    يثبّت `openclaw skills install` افتراضيًا في دليل `skills/`
    الخاص بمساحة العمل النشطة. أضف `--global` للتثبيت في دليل
    `~/.openclaw/skills` المشترك، المرئي لجميع الوكلاء المحليين ما لم
    تضيّق قوائم السماح الخاصة بالوكلاء نطاقه.

    تتوقع عمليات التثبيت من Git والمصادر المحلية وجود `SKILL.md` في جذر المصدر.
    يأتي المعرّف المختصر من قيمة `name` في البيانات الأمامية لملف `SKILL.md` عندما تكون صالحة،
    ثم يُستخدم اسم الدليل أو المستودع عند تعذّر ذلك. استخدم `--as <slug>` للتجاوز.
    يتتبّع `openclaw skills update` عمليات تثبيت ClawHub فقط — أعد تثبيت مصادر Git أو
    المصادر المحلية لتحديثها.

  </Accordion>
  <Accordion title="التحقق والفحص الأمني">
    يطلب `openclaw skills verify @owner/<slug>` من ClawHub نطاق الثقة
    `clawhub.skill.verify.v1` الخاص بالمهارة. يجري التحقق من مهارات ClawHub المثبّتة
    مقابل الإصدار والسجل المسجّلين في `.clawhub/origin.json`.
    تظل المعرّفات المختصرة غير المؤهلة مقبولة للمهارات المثبّتة حاليًا أو غير الملتبسة، لكن
    المراجع المؤهلة باسم المالك تتجنب التباس الناشر.

    تعرض صفحات مهارات ClawHub حالة أحدث فحص أمني قبل التثبيت،
    مع صفحات تفاصيل لـ VirusTotal وClawScan والتحليل الساكن. يخرج
    الأمر برمز غير صفري عندما يضع ClawHub علامة فشل على التحقق. ويمكن للناشرين
    معالجة النتائج الإيجابية الكاذبة عبر لوحة معلومات ClawHub أو
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="عمليات التثبيت من أرشيف خاص">
    يمكن لعملاء Gateway الذين يحتاجون إلى تسليم لا يعتمد على ClawHub تجهيز أرشيف مهارة مضغوط
    باستخدام `skills.upload.begin` و`skills.upload.chunk` و`skills.upload.commit`،
    ثم تثبيته باستخدام `skills.install({ source: "upload", ... })`. هذا المسار
    معطّل افتراضيًا ويتطلب `skills.install.allowUploadedArchives: true` في
    `openclaw.json`. لا تحتاج عمليات تثبيت ClawHub العادية إلى هذا الإعداد مطلقًا.
  </Accordion>
</AccordionGroup>

## الأمان

<Warning>
  تعامل مع مهارات الجهات الخارجية باعتبارها **تعليمات برمجية غير موثوقة**. اقرأها قبل تمكينها.
  فضّل التشغيل داخل صندوق عزل للمدخلات غير الموثوقة والأدوات عالية المخاطر. راجع
  [العزل](/ar/gateway/sandboxing) للاطلاع على عناصر التحكم من جانب الوكيل.
</Warning>

<AccordionGroup>
  <Accordion title="احتواء المسارات">
    لا يقبل اكتشاف مهارات مساحة العمل ووكيل المشروع والأدلة الإضافية إلا جذور المهارات
    التي يظل مسارها الحقيقي المحلول داخل الجذر المُعدّ، ما لم
    يثق `skills.load.allowSymlinkTargets` صراحةً بجذر مستهدف.
    لا تكتب ورشة المهارات عبر تلك الأهداف الموثوقة إلا عند تمكين
    `skills.workshop.allowSymlinkTargetWrites`.
    قد تحتوي أدلة `~/.openclaw/skills` المُدارة و`~/.agents/skills` الشخصية على
    مجلدات مهارات مرتبطة رمزيًا، لكن يجب أن يظل المسار الحقيقي لكل `SKILL.md`
    داخل دليل المهارة المحلول الخاص به.
  </Accordion>
  <Accordion title="سياسة تثبيت المشغّل">
    اضبط `security.installPolicy` لتشغيل أمر سياسة محلي موثوق
    قبل متابعة تثبيت المهارات. تتلقى السياسة البيانات الوصفية ومسار
    المصدر المُجهّز، وتُطبّق على مسارات ClawHub والرفع وGit والمصادر المحلية والتحديث
    ومثبّت التبعيات، وتفشل بشكل مغلق عندما يتعذر على الأمر إرجاع
    قرار صالح.
  </Accordion>
  <Accordion title="نطاق حقن الأسرار">
    يحقن `skills.entries.*.env` و`skills.entries.*.apiKey` الأسرار في عملية
    **المضيف** لدورة الوكيل تلك فقط — وليس في صندوق العزل. أبقِ
    الأسرار خارج المطالبات والسجلات.
  </Accordion>
</AccordionGroup>

للاطلاع على نموذج التهديد الأوسع وقوائم التحقق الأمنية، راجع
[الأمان](/ar/gateway/security).

## تنسيق SKILL.md

تحتاج كل مهارة، كحد أدنى، إلى `name` و`description` في البيانات الأمامية:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  يتبع OpenClaw مواصفة [AgentSkills](https://agentskills.io). تُحلَّل الترويسة
  أولًا بصيغة YAML؛ وإذا فشل ذلك، يُستخدم محلل يقتصر على سطر واحد
  فقط. تُسطَّح كتل `metadata` المتداخلة (بما فيها تعيينات YAML متعددة الأسطر)
  إلى سلسلة JSON ثم يُعاد تحليلها بصيغة JSON5، ولذلك تعمل صيغة الكتلة الموضحة
  ضمن [التقييد](#gating). استخدم `{baseDir}` في المتن للإشارة إلى مسار
  مجلد المهارة.
</Note>

### مفاتيح الترويسة الاختيارية

<ParamField path="homepage" type="string">
  عنوان URL يظهر باسم "Website" في واجهة Skills على macOS. وهو مدعوم أيضًا عبر
  `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  عندما تكون القيمة `true`، تُعرض المهارة كأمر شرطة مائلة يمكن للمستخدم استدعاؤه.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  عندما تكون القيمة `true`، يستبعد OpenClaw تعليمات المهارة من الموجّه المعتاد
  للوكيل. وتظل المهارة متاحة كأمر شرطة مائلة عندما تكون قيمة `user-invocable`
  أيضًا `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  عند ضبطه على `tool`، يتجاوز أمر الشرطة المائلة النموذج ويوجَّه
  مباشرةً إلى أداة مسجَّلة.
</ParamField>

<ParamField path="command-tool" type="string">
  اسم الأداة المراد استدعاؤها عند ضبط `command-dispatch: tool`.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  عند التوجيه إلى أداة، يمرر سلسلة الوسائط الخام إلى الأداة من دون
  تحليل أساسي. تتلقى الأداة
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## التقييد

يرشّح OpenClaw المهارات عند التحميل باستخدام `metadata.openclaw` (كائن JSON5
مضمَّن في الترويسة، راجع ملاحظة التحليل أعلاه). تكون المهارة التي لا تحتوي على
كتلة `metadata.openclaw` مؤهلة دائمًا ما لم تُعطَّل صراحةً.

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

<ParamField path="always" type="boolean">
  عندما تكون القيمة `true`، تُضمَّن المهارة دائمًا وتُتجاوز جميع القيود الأخرى.
</ParamField>

<ParamField path="emoji" type="string">
  رمز تعبيري اختياري يظهر في واجهة Skills على macOS.
</ParamField>

<ParamField path="homepage" type="string">
  عنوان URL اختياري يظهر باسم "Website" في واجهة Skills على macOS.
</ParamField>

<ParamField path="os" type='("darwin" | "linux" | "win32")[]'>
  مرشح المنصة. عند ضبطه، لا تكون المهارة مؤهلة إلا على نظام تشغيل مدرج.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  يجب أن يتوفر كل ملف تنفيذي ضمن `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  يجب أن يتوفر ملف تنفيذي واحد على الأقل ضمن `PATH`.
</ParamField>

<ParamField path="requires.env" type="string[]">
  يجب أن يتوفر كل متغير بيئة في العملية أو أن يُوفَّر عبر الإعداد.
</ParamField>

<ParamField path="requires.config" type="string[]">
  يجب أن تكون قيمة كل مسار في `openclaw.json` صادقة.
</ParamField>

<ParamField path="primaryEnv" type="string">
  اسم متغير البيئة المرتبط بـ `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  مواصفات تثبيت اختيارية تستخدمها واجهة Skills على macOS ‏(brew / node / go / uv / download).
</ParamField>

<Note>
  تظل كتل `metadata.clawdbot` القديمة مقبولة عند غياب
  `metadata.openclaw`، حتى تحتفظ المهارات القديمة المثبَّتة بقيود
  تبعياتها وتلميحات التثبيت. ينبغي للمهارات الجديدة استخدام
  `metadata.openclaw`.
</Note>

### مواصفات التثبيت

تحدد مواصفات التثبيت لواجهة Skills على macOS كيفية تثبيت تبعية:

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="قواعد اختيار المُثبِّت">
    - عند إدراج عدة مُثبِّتات، يختار Gateway خيارًا مفضّلًا واحدًا
      (brew عند توفره، وإلا node).
    - إذا كانت جميع المُثبِّتات من النوع `download`، يسرد OpenClaw كل إدخال لتتمكن من
      رؤية جميع الملفات المتاحة.
    - يمكن أن تتضمن المواصفات `os: ["darwin"|"linux"|"win32"]` للتصفية حسب المنصة.
    - تحترم عمليات تثبيت Node الإعداد `skills.install.nodeManager` في `openclaw.json`
      (الافتراضي: npm؛ الخيارات: npm / pnpm / yarn / bun). يؤثر هذا فقط في عمليات
      تثبيت المهارات؛ ويجب أن يظل وقت تشغيل Gateway هو Node.
    - ترتيب تفضيل مُثبِّت Gateway: ‏Homebrew ← uv ← مدير node المضبوط ←
      go ← download.
  </Accordion>
  <Accordion title="تفاصيل كل مُثبِّت">
    - **Homebrew:** لا يثبّت OpenClaw ‏Homebrew تلقائيًا ولا يحوّل صيغ brew
      إلى أوامر حزم النظام. في حاويات Linux التي لا تحتوي على
      `brew`، تُخفى المُثبِّتات التي تعتمد على brew فقط؛ استخدم صورة مخصصة أو ثبّت
      التبعية يدويًا.
    - **Go:** يتطلب OpenClaw الإصدار Go 1.21 أو أحدث لتثبيت المهارات تلقائيًا.
      إذا كان `go` مفقودًا وكان Homebrew متاحًا، يثبّت OpenClaw ‏Go عبر
      Homebrew أولًا؛ وعلى Linux من دون Homebrew يمكنه بدلًا من ذلك استخدام `apt-get`
      بصفة root أو عبر `sudo` من دون كلمة مرور، عندما تستوفي حزمة `golang-go`
      المحدَّثة الحد الأدنى للإصدار. يستهدف أمر `go install` الفعلي الخاص
      بالتبعية دائمًا دليل ملفات تنفيذية مخصصًا يديره OpenClaw
      (دليل `bin` الخاص بـ Homebrew في التثبيت الجديد، وإلا `~/.local/bin`) بدلًا من
      `GOBIN` المضبوط لديك — تُقرأ متغيرات البيئة `GOBIN` و`GOPATH` و`GOTOOLCHAIN`
      الخاصة بك، لكنها لا تُستبدل مطلقًا.
    - **التنزيل:** `url` (مطلوب)، و`archive` ‏(`tar.gz` | `tar.bz2` | `zip`)،
      و`extract` (الافتراضي: تلقائي عند اكتشاف أرشيف)، و`stripComponents`،
      و`targetDir` (الافتراضي: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="ملاحظات العزل">
    يُتحقق من `requires.bins` على **المضيف** عند تحميل المهارة. إذا كان الوكيل
    يعمل في بيئة معزولة، فيجب أن يتوفر الملف التنفيذي أيضًا **داخل الحاوية**.
    ثبّته عبر `agents.defaults.sandbox.docker.setupCommand` أو صورة
    مخصصة. يُشغَّل `setupCommand` مرة واحدة بعد إنشاء الحاوية، ويتطلب
    اتصالًا صادرًا بالشبكة ونظام ملفات جذريًا قابلًا للكتابة ومستخدم root في البيئة المعزولة.
  </Accordion>
</AccordionGroup>

## تجاوزات الإعداد

فعّل المهارات المضمَّنة أو المُدارة واضبطها ضمن `skills.entries` في
`~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<ParamField path="enabled" type="boolean">
  تؤدي القيمة `false` إلى تعطيل المهارة حتى إن كانت مضمَّنة أو مثبَّتة. المهارة المضمَّنة
  `coding-agent` اختيارية — اضبط `skills.entries.coding-agent.enabled: true`
  وتأكد من تثبيت أحد `claude` أو `codex` أو `opencode` أو أي CLI آخر
  مدعوم، ومن مصادقته.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  حقل ملائم للمهارات التي تعلن `metadata.openclaw.primaryEnv`.
  يدعم سلسلة نص عادي أو كائن SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  متغيرات البيئة التي تُحقن لتشغيل الوكيل. لا تُحقن إلا عندما لا يكون
  المتغير مضبوطًا مسبقًا في العملية.
</ParamField>

<ParamField path="config" type="object">
  حاوية اختيارية لحقول الإعداد المخصصة لكل مهارة.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  قائمة سماح اختيارية للمهارات **المضمَّنة** فقط. عند ضبطها، لا تكون إلا المهارات المضمَّنة
  الموجودة في القائمة مؤهلة. ولا تتأثر المهارات المُدارة ومهارات مساحة العمل.
</ParamField>

<Note>
  تتطابق مفاتيح الإعداد افتراضيًا مع **اسم المهارة**. إذا عرّفت مهارة
  `metadata.openclaw.skillKey`، فاستخدم ذلك المفتاح ضمن `skills.entries` بدلًا منه.
  ضع الأسماء التي تحتوي على واصلات بين علامتي اقتباس: تسمح JSON5 بالمفاتيح المقتبسة.
</Note>

## حقن متغيرات البيئة

عند بدء تشغيل وكيل، ينفّذ OpenClaw ما يلي:

<Steps>
  <Step title="قراءة بيانات المهارات الوصفية">
    يحل OpenClaw قائمة المهارات الفعلية للوكيل، مع تطبيق قواعد التقييد
    وقوائم السماح وتجاوزات الإعداد.
  </Step>
  <Step title="حقن متغيرات البيئة ومفاتيح API">
    تُطبَّق `skills.entries.<key>.env` و`skills.entries.<key>.apiKey` على
    `process.env` طوال مدة التشغيل.
  </Step>
  <Step title="إنشاء موجّه النظام">
    تُجمَّع المهارات المؤهلة في كتلة XML مضغوطة وتُحقن في
    موجّه النظام.
  </Step>
  <Step title="استعادة البيئة">
    بعد انتهاء التشغيل، تُستعاد البيئة الأصلية.
  </Step>
</Steps>

<Warning>
  يقتصر حقن متغيرات البيئة على تشغيل الوكيل على **المضيف**، وليس البيئة المعزولة. داخل
  البيئة المعزولة، لا يكون لـ `env` و`apiKey` أي تأثير. راجع
  [إعداد Skills](/ar/tools/skills-config#sandboxed-skills-and-env-vars) لمعرفة كيفية
  تمرير الأسرار إلى عمليات التشغيل المعزولة.
</Warning>

بالنسبة إلى الواجهة الخلفية المضمَّنة `claude-cli`، ينشئ OpenClaw أيضًا نسخة
المهارات المؤهلة نفسها في صورة Plugin مؤقت لـ Claude Code ويمررها عبر
`--plugin-dir`. تستخدم واجهات CLI الخلفية الأخرى كتالوج الموجّه فقط.

## اللقطات والتحديث

يلتقط OpenClaw لقطة للمهارات المؤهلة **عند بدء الجلسة** ويعيد استخدام تلك
القائمة لجميع الأدوار اللاحقة في الجلسة. تسري تغييرات المهارات أو الإعداد
في الجلسة الجديدة التالية.

تُحدَّث Skills في منتصف الجلسة في حالتين:

- يكتشف مراقب المهارات تغييرًا في `SKILL.md`.
- تتصل عقدة بعيدة مؤهلة جديدة.

تُعتمد القائمة المحدَّثة في دورة الوكيل التالية. إذا تغيرت قائمة السماح الفعلية
للوكيل، يحدّث OpenClaw اللقطة للحفاظ على اتساق المهارات المرئية.

<AccordionGroup>
  <Accordion title="مراقب Skills">
    يراقب OpenClaw افتراضيًا مجلدات المهارات ويحدّث اللقطة عند تغير
    ملفات `SKILL.md`. اضبط ذلك ضمن `skills.load`:

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true, // default
          watchDebounceMs: 250, // default
        },
      },
    }
    ```

    استخدم `allowSymlinkTargets` للتخطيطات المقصودة ذات الروابط الرمزية، حيث يشير رابط رمزي
    لجذر مهارة إلى خارج الجذر المضبوط، مثل
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    لا تفعّل `skills.workshop.allowSymlinkTargetWrites` إلا عندما ينبغي لـ Skill Workshop
    أيضًا تطبيق المقترحات عبر تلك المسارات الموثوقة ذات الروابط الرمزية.

  </Accordion>
  <Accordion title="عُقد macOS البعيدة (Gateway على Linux)">
    إذا كان Gateway يعمل على Linux، لكن توجد **عقدة macOS** متصلة ويُسمح فيها
    بـ `system.run`، فيمكن لـ OpenClaw اعتبار المهارات الخاصة بـ macOS مؤهلة عندما
    تتوفر الملفات التنفيذية المطلوبة على تلك العقدة. ينبغي للوكيل تشغيل تلك
    المهارات عبر أداة `exec` مع `host=node`.

    لا تجعل العقد غير المتصلة المهارات البعيدة فقط مرئية. إذا توقفت عقدة عن
    الاستجابة لفحوصات الملفات التنفيذية، يمسح OpenClaw مطابقات الملفات التنفيذية المخزنة مؤقتًا لها.

  </Accordion>
</AccordionGroup>

## تأثير الرموز

عندما تكون المهارات مؤهلة، يحقن OpenClaw كتلة XML مضغوطة في موجّه
النظام. تكون التكلفة حتمية وتتزايد خطيًا لكل مهارة:

- **الحمل الأساسي** (فقط عند أهلية مهارة واحدة أو أكثر): كتلة ثابتة من النص
  التمهيدي بالإضافة إلى الغلاف `<available_skills>`.
- **لكل مهارة:** نحو 97 محرفًا بالإضافة إلى أطوال حقول `name` و`description` و`location`
  الخاصة بك.
- يؤدي تهريب XML إلى توسيع `& < > " '` إلى كيانات، مما يضيف بضعة محارف لكل
  ظهور.
- عند نحو 4 محارف لكل رمز، فإن 97 محرفًا ≈ 24 رمزًا لكل مهارة قبل أطوال الحقول.

إذا كانت الكتلة المعروضة ستتجاوز ميزانية الموجّه المضبوطة
(`skills.limits.maxSkillsPromptChars`)، يحافظ OpenClaw أولًا على أكبر عدد ممكن من
هويات Skills (الاسم والموقع والإصدار) مما يمكن أن يستوعبه التنسيق المضغوط الخالي
من الأوصاف. ثم يستخدم أي ميزانية متبقية للأوصاف المختصرة. وإذا لم تتبقَّ أي
ميزانية للأوصاف، تُحذف الأوصاف. يتضمن الموجّه ملاحظة تشير إلى
`openclaw skills check` كلما كان التنسيق المضغوط أو اقتطاع القائمة مطلوبًا.

اجعل الأوصاف قصيرة وواضحة لتقليل العبء الإضافي على الموجّه.

## ذو صلة

<CardGroup cols={2}>
  <Card title="إنشاء Skills" href="/ar/tools/creating-skills" icon="hammer">
    دليل تفصيلي خطوة بخطوة لإنشاء Skill مخصصة.
  </Card>
  <Card title="ورشة Skills" href="/ar/tools/skill-workshop" icon="flask">
    قائمة انتظار المقترحات الخاصة بـ Skills التي تصوغها الوكلاء.
  </Card>
  <Card title="إعدادات Skills" href="/ar/tools/skills-config" icon="gear">
    مخطط إعدادات `skills.*` الكامل وقوائم السماح الخاصة بالوكلاء.
  </Card>
  <Card title="أوامر الشرطة المائلة" href="/ar/tools/slash-commands" icon="terminal">
    كيفية تسجيل أوامر الشرطة المائلة الخاصة بـ Skills وتوجيهها.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    تصفّح Skills وانشرها في السجل العام.
  </Card>
  <Card title="Plugins" href="/ar/tools/plugin" icon="plug">
    يمكن لـ Plugins تضمين Skills إلى جانب الأدوات التي توثّقها.
  </Card>
</CardGroup>

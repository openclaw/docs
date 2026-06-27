---
read_when:
    - إضافة Skills أو تعديلها
    - تغيير بوابات Skills أو قوائم السماح أو قواعد التحميل
    - فهم أسبقية المهارات وسلوك اللقطات
sidebarTitle: Skills
summary: تعلّم Skills وكيلك كيفية استخدام الأدوات. تعرّف على كيفية تحميلها، وكيفية عمل الأسبقية، وكيفية تكوين الضبط المشروط، وقوائم السماح، وحقن البيئة.
title: Skills
x-i18n:
    generated_at: "2026-06-27T18:44:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e42d89d47125a4d92f68a20d754de571d5582858a9c44618b999a27335e78ab2
    source_path: tools/skills.md
    workflow: 16
---

Skills هي ملفات تعليمات بصيغة Markdown تعلّم الوكيل كيف ومتى يستخدم
الأدوات. توجد كل Skill في دليل يحتوي على ملف `SKILL.md` يتضمن frontmatter
بصيغة YAML ومتنًا بصيغة Markdown. يحمّل OpenClaw الـ Skills المضمّنة إضافة إلى
أي تجاوزات محلية، ويرشّحها وقت التحميل بناءً على البيئة والإعدادات ووجود
الثنائيات.

<CardGroup cols={2}>
  <Card title="إنشاء Skills" href="/ar/tools/creating-skills" icon="hammer">
    ابنِ واختبر Skill مخصصة من الصفر.
  </Card>
  <Card title="ورشة Skill" href="/ar/tools/skill-workshop" icon="flask">
    راجع واعتمد مقترحات Skills التي صاغها الوكيل.
  </Card>
  <Card title="إعدادات Skills" href="/ar/tools/skills-config" icon="gear">
    مخطط إعدادات `skills.*` الكامل وقوائم السماح للوكلاء.
  </Card>
  <Card title="ClawHub" href="/ar/clawhub" icon="cloud">
    تصفح وثبّت Skills المجتمع.
  </Card>
</CardGroup>

## ترتيب التحميل

يحمّل OpenClaw من هذه المصادر، **بأعلى أولوية أولًا**. عندما يظهر اسم Skill نفسه
في عدة أماكن، يفوز المصدر الأعلى.

| الأولوية      | المصدر                         | المسار                                  |
| ------------- | ------------------------------ | --------------------------------------- |
| 1 — الأعلى    | Skills مساحة العمل             | `<workspace>/skills`                    |
| 2             | Skills وكيل المشروع            | `<workspace>/.agents/skills`            |
| 3             | Skills الوكيل الشخصية          | `~/.agents/skills`                      |
| 4             | Skills مُدارة / محلية          | `~/.openclaw/skills`                    |
| 5             | Skills مضمنة                   | مرفقة مع التثبيت                        |
| 6 — الأدنى    | أدلة إضافية                    | `skills.load.extraDirs` + Skills Plugin |

تدعم جذور Skills التخطيطات المجمعة. يكتشف OpenClaw أي Skill عندما يظهر
`SKILL.md` في أي مكان تحت جذر مُعدّ:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

مسار المجلد للتنظيم فقط. يأتي اسم Skill وأمر الشرطة المائلة ومفتاح قائمة السماح
كلها من حقل frontmatter المسمى `name` (أو من اسم الدليل عندما يكون `name`
مفقودًا).

<Note>
  دليل `$CODEX_HOME/skills` الأصلي في Codex CLI **ليس** جذر Skill في OpenClaw.
  استخدم `openclaw migrate plan codex` لحصر تلك Skills، ثم
  `openclaw migrate codex` لنسخها إلى مساحة عمل OpenClaw لديك.
</Note>

## Skills لكل وكيل مقابل Skills مشتركة

في إعدادات تعدد الوكلاء، يمتلك كل وكيل مساحة عمل خاصة به. استخدم المسار الذي
يطابق مستوى الظهور المطلوب:

| النطاق          | المسار                       | مرئي لـ                         |
| --------------- | ---------------------------- | ------------------------------- |
| لكل وكيل        | `<workspace>/skills`         | ذلك الوكيل فقط                  |
| وكيل المشروع    | `<workspace>/.agents/skills` | وكيل مساحة العمل تلك فقط        |
| الوكيل الشخصي   | `~/.agents/skills`           | جميع الوكلاء على هذا الجهاز     |
| مُدار مشترك     | `~/.openclaw/skills`         | جميع الوكلاء على هذا الجهاز     |
| أدلة إضافية     | `skills.load.extraDirs`      | جميع الوكلاء على هذا الجهاز     |

## قوائم سماح الوكلاء

**موقع** Skill (الأولوية) و**ظهور** Skill (أي وكيل يستطيع استخدامها) عنصران
منفصلان للتحكم. استخدم قوائم السماح لتقييد Skills التي يراها الوكيل، بغض النظر
عن مكان تحميلها منه.

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
    - احذف `agents.defaults.skills` لترك جميع Skills غير مقيّدة افتراضيًا.
    - احذف `agents.list[].skills` لوراثة `agents.defaults.skills`.
    - اضبط `agents.list[].skills: []` لعدم عرض أي Skills لذلك الوكيل.
    - قائمة `agents.list[].skills` غير الفارغة هي المجموعة **النهائية** — ولا
      تندمج مع الافتراضيات.
    - تنطبق قائمة السماح الفعالة على بناء المطالبات، واكتشاف أوامر الشرطة
      المائلة، ومزامنة الصندوق الرملي، ولقطات Skills.
  </Accordion>
</AccordionGroup>

## Plugins و Skills

يمكن لـ Plugins شحن Skills خاصة بها عبر إدراج أدلة `skills` في
`openclaw.plugin.json` (مسارات نسبية إلى جذر Plugin). تُحمّل Skills الخاصة
بـ Plugin عندما يكون Plugin مفعّلًا — على سبيل المثال، يشحن Plugin المتصفح
Skill باسم `browser-automation` للتحكم متعدد الخطوات في المتصفح.

تندمج أدلة Skills الخاصة بـ Plugin عند مستوى الأولوية المنخفض نفسه مثل
`skills.load.extraDirs`، لذلك فإن أي Skill مضمنة أو مُدارة أو خاصة بوكيل أو
بمساحة عمل تحمل الاسم نفسه تتجاوزها. بوّبها عبر
`metadata.openclaw.requires.config` في إدخال إعدادات Plugin.

راجع [Plugins](/ar/tools/plugin) و[الأدوات](/ar/tools) للاطلاع على نظام Plugin الكامل.

## ورشة Skill

[ورشة Skill](/ar/tools/skill-workshop) هي طابور مقترحات بين الوكيل وملفات Skills
النشطة لديك. عندما يرصد الوكيل عملًا قابلًا لإعادة الاستخدام، يصوغ مقترحًا بدلًا
من الكتابة مباشرة إلى `SKILL.md`. تراجعه وتعتمده قبل أن يتغير أي شيء.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

راجع [ورشة Skill](/ar/tools/skill-workshop) للاطلاع على دورة الحياة الكاملة ومرجع
CLI والإعدادات.

## التثبيت من ClawHub

[ClawHub](https://clawhub.ai) هو سجل Skills العام. استخدم أوامر
`openclaw skills` للتثبيت والتحديث، أو CLI `clawhub` للنشر والمزامنة.

| الإجراء                              | الأمر                                                  |
| ------------------------------------ | ------------------------------------------------------ |
| تثبيت Skill في مساحة العمل           | `openclaw skills install @owner/<slug>`                |
| التثبيت من مستودع Git                | `openclaw skills install git:owner/repo@ref`           |
| تثبيت دليل Skill محلي                | `openclaw skills install ./path/to/skill --as my-tool` |
| التثبيت لجميع الوكلاء المحليين       | `openclaw skills install @owner/<slug> --global`       |
| تحديث جميع Skills في مساحة العمل     | `openclaw skills update --all`                         |
| تحديث Skill مشتركة مُدارة            | `openclaw skills update @owner/<slug> --global`        |
| تحديث جميع Skills المشتركة المُدارة  | `openclaw skills update --all --global`                |
| التحقق من غلاف ثقة Skill             | `openclaw skills verify @owner/<slug>`                 |
| طباعة Skill Card المُولّدة           | `openclaw skills verify @owner/<slug> --card`          |
| النشر / المزامنة عبر ClawHub CLI     | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="تفاصيل التثبيت">
    يثبّت `openclaw skills install` في دليل `skills/` الخاص بمساحة العمل النشطة
    افتراضيًا. أضف `--global` للتثبيت في دليل `~/.openclaw/skills` المشترك،
    والمرئي لجميع الوكلاء المحليين ما لم تضيق قوائم سماح الوكلاء ذلك.

    تتوقع تثبيتات Git والتثبيتات المحلية وجود `SKILL.md` في جذر المصدر. يأتي
    slug من frontmatter `SKILL.md` الحقل `name` عندما يكون صالحًا، ثم يعود إلى
    اسم الدليل أو المستودع. استخدم `--as <slug>` للتجاوز.
    يتتبع `openclaw skills update` تثبيتات ClawHub فقط — أعد تثبيت مصادر Git أو
    المصادر المحلية لتحديثها.

  </Accordion>
  <Accordion title="التحقق والفحص الأمني">
    يطلب `openclaw skills verify @owner/<slug>` من ClawHub غلاف ثقة Skill
    `clawhub.skill.verify.v1`. تتحقق Skills المثبتة من ClawHub مقابل الإصدار
    والسجل المسجلين في `.clawhub/origin.json`. تبقى slugs العارية مقبولة لـ
    Skills المثبتة الموجودة أو غير الملتبسة، لكن المراجع المؤهلة بالمالك تتجنب
    التباس الناشر.

    تعرض صفحات Skills في ClawHub أحدث حالة فحص أمني قبل التثبيت، مع صفحات
    تفصيلية لـ VirusTotal وClawScan والتحليل الثابت. يخرج الأمر بقيمة غير صفرية
    عندما يضع ClawHub علامة فشل على التحقق. يستعيد الناشرون النتائج الإيجابية
    الكاذبة عبر لوحة تحكم ClawHub أو
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="تثبيتات الأرشيفات الخاصة">
    يمكن لعملاء Gateway الذين يحتاجون إلى تسليم غير ClawHub تجهيز أرشيف Skill
    بصيغة zip باستخدام `skills.upload.begin` و`skills.upload.chunk` و
    `skills.upload.commit`، ثم التثبيت باستخدام
    `skills.install({ source: "upload", ... })`. هذا المسار معطل افتراضيًا
    ويتطلب `skills.install.allowUploadedArchives: true` في `openclaw.json`.
    تثبيتات ClawHub العادية لا تحتاج إلى هذا الإعداد أبدًا.
  </Accordion>
</AccordionGroup>

## الأمان

<Warning>
  تعامل مع Skills الجهات الخارجية باعتبارها **تعليمات برمجية غير موثوقة**.
  اقرأها قبل التفعيل. فضّل التشغيل داخل صندوق رملي للمدخلات غير الموثوقة
  والأدوات عالية المخاطر. راجع [العزل الرملي](/ar/gateway/sandboxing) لعناصر
  التحكم من جهة الوكيل.
</Warning>

<AccordionGroup>
  <Accordion title="احتواء المسار">
    لا يقبل اكتشاف Skills لمساحة العمل ووكيل المشروع والأدلة الإضافية إلا جذور
    Skills التي يبقى realpath المحلول الخاص بها داخل الجذر المُعدّ، ما لم يثق
    `skills.load.allowSymlinkTargets` صراحةً بجذر هدف. تكتب ورشة Skill عبر تلك
    الأهداف الموثوقة فقط عندما يكون
    `skills.workshop.allowSymlinkTargetWrites` مفعّلًا. قد تحتوي الأدلة المُدارة
    `~/.openclaw/skills` والشخصية `~/.agents/skills` على مجلدات Skills مرتبطة
    رمزيًا، لكن يجب أن يبقى realpath لكل `SKILL.md` داخل دليل Skill المحلول
    الخاص به.
  </Accordion>
  <Accordion title="سياسة تثبيت المشغل">
    اضبط `security.installPolicy` لتشغيل أمر سياسة محلي موثوق قبل استمرار
    تثبيتات Skills. تتلقى السياسة بيانات وصفية ومسار المصدر المُجهّز، وتنطبق
    على مسارات ClawHub والمرفوعة وGit والمحلية والتحديث ومثبت التبعيات، وتفشل
    بإغلاق عندما لا يستطيع الأمر إرجاع قرار صالح.
  </Accordion>
  <Accordion title="نطاق حقن الأسرار">
    يحقن `skills.entries.*.env` و`skills.entries.*.apiKey` الأسرار في عملية
    **المضيف** لدورة ذلك الوكيل فقط — وليس في الصندوق الرملي. أبقِ الأسرار خارج
    المطالبات والسجلات.
  </Accordion>
</AccordionGroup>

للاطلاع على نموذج التهديد الأوسع وقوائم فحص الأمان، راجع
[الأمان](/ar/gateway/security).

## تنسيق SKILL.md

تحتاج كل Skill في الحد الأدنى إلى `name` و`description` في frontmatter:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  يتبع OpenClaw مواصفة [AgentSkills](https://agentskills.io). يدعم محلل
  frontmatter **مفاتيح السطر الواحد فقط** — يجب أن تكون `metadata` كائن JSON
  في سطر واحد. استخدم `{baseDir}` في المتن للإشارة إلى مسار مجلد Skill.
</Note>

### مفاتيح frontmatter الاختيارية

<ParamField path="homepage" type="string">
  عنوان URL المعروض باسم "موقع الويب" في واجهة Skills على macOS. مدعوم أيضًا
  عبر `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  عندما تكون `true`، تُعرض Skill كأمر شرطة مائلة يمكن للمستخدم استدعاؤه.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  عندما تكون `true`، يُبقي OpenClaw تعليمات Skill خارج المطالبة العادية للوكيل.
  تبقى Skill متاحة كأمر شرطة مائلة عندما تكون `user-invocable` أيضًا `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  عند ضبطه على `tool`، يتجاوز أمر الشرطة المائلة النموذج ويرسل مباشرة إلى أداة
  مسجلة.
</ParamField>

<ParamField path="command-tool" type="string">
  اسم الأداة المطلوب استدعاؤها عند ضبط `command-dispatch: tool`.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  لإرسال الأداة، يمرر سلسلة الوسيطات الخام إلى الأداة من دون تحليل أساسي.
  تتلقى الأداة
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## البوابة

يقوم OpenClaw بتصفية Skills وقت التحميل باستخدام `metadata.openclaw` (JSON بسطر واحد
في frontmatter). تكون Skill التي لا تحتوي على كتلة `metadata.openclaw` مؤهلة دائمًا
ما لم يتم تعطيلها صراحةً.

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
  عندما تكون `true`، أدرج Skill دائمًا وتجاوز جميع البوابات الأخرى.
</ParamField>

<ParamField path="emoji" type="string">
  رمز تعبيري اختياري يظهر في واجهة macOS Skills.
</ParamField>

<ParamField path="homepage" type="string">
  عنوان URL اختياري يظهر باسم "موقع الويب" في واجهة macOS Skills.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  مرشح المنصة. عند ضبطه، تكون Skill مؤهلة فقط على أنظمة التشغيل المدرجة.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  يجب أن يكون كل ملف ثنائي موجودًا على `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  يجب أن يكون ملف ثنائي واحد على الأقل موجودًا على `PATH`.
</ParamField>

<ParamField path="requires.env" type="string[]">
  يجب أن يكون كل متغير بيئة موجودًا في العملية أو موفرًا عبر الإعدادات.
</ParamField>

<ParamField path="requires.config" type="string[]">
  يجب أن يكون كل مسار `openclaw.json` ذا قيمة truthy.
</ParamField>

<ParamField path="primaryEnv" type="string">
  اسم متغير البيئة المرتبط بـ `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  مواصفات تثبيت اختيارية تستخدمها واجهة macOS Skills (brew / node / go / uv / download).
</ParamField>

<Note>
  لا تزال كتل `metadata.clawdbot` القديمة مقبولة عندما تكون
  `metadata.openclaw` غائبة، لذلك تحتفظ Skills المثبتة الأقدم ببوابات
  الاعتماد وتلميحات المثبت الخاصة بها. يجب أن تستخدم Skills الجديدة
  `metadata.openclaw`.
</Note>

### مواصفات المثبت

تخبر مواصفات المثبت واجهة macOS Skills بكيفية تثبيت اعتماد:

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
  <Accordion title="قواعد اختيار المثبت">
    - عند إدراج عدة مثبتات، يختار Gateway خيارًا مفضلًا واحدًا
      (brew عند توفره، وإلا node).
    - إذا كانت جميع المثبتات `download`، يسرد OpenClaw كل إدخال حتى تتمكن من
      رؤية جميع الأرتيفاكتات المتاحة.
    - يمكن أن تتضمن المواصفات `os: ["darwin"|"linux"|"win32"]` للتصفية حسب المنصة.
    - تحترم تثبيتات Node قيمة `skills.install.nodeManager` في `openclaw.json`
      (الافتراضي: npm؛ الخيارات: npm / pnpm / yarn / bun). يؤثر هذا فقط في
      تثبيتات Skill؛ يجب أن يظل وقت تشغيل Gateway هو Node.
    - تفضيل مثبت Gateway: Homebrew → uv → مدير node المضبوط →
      go → download.
  </Accordion>
  <Accordion title="تفاصيل كل مثبت">
    - **Homebrew:** لا يثبّت OpenClaw Homebrew تلقائيًا ولا يترجم صيغ brew
      إلى أوامر حزم النظام. في حاويات Linux التي لا تحتوي على
      `brew`، تكون المثبتات التي تعتمد على brew فقط مخفية؛ استخدم صورة مخصصة أو ثبّت
      الاعتماد يدويًا.
    - **Go:** إذا كان `go` مفقودًا وكان `brew` متاحًا، يثبّت Gateway
      Go عبر Homebrew أولًا ويضبط `GOBIN` على `bin` الخاص بـ Homebrew.
    - **Download:** `url` (مطلوب)، `archive` (`tar.gz` | `tar.bz2` | `zip`)،
      `extract` (الافتراضي: تلقائي عند اكتشاف أرشيف)، `stripComponents`،
      `targetDir` (الافتراضي: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="ملاحظات وضع الحماية">
    يتم فحص `requires.bins` على **المضيف** وقت تحميل Skill. إذا كان الوكيل
    يعمل في sandbox، فيجب أن يكون الملف الثنائي موجودًا أيضًا **داخل الحاوية**.
    ثبّته عبر `agents.defaults.sandbox.docker.setupCommand` أو صورة مخصصة.
    يعمل `setupCommand` مرة واحدة بعد إنشاء الحاوية ويتطلب
    خروجًا إلى الشبكة، ونظام ملفات جذر قابلًا للكتابة، ومستخدمًا جذرًا في sandbox.
  </Accordion>
</AccordionGroup>

## تجاوزات الإعدادات

بدّل واضبط Skills المضمنة أو المُدارة تحت `skills.entries` في
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
  تؤدي `false` إلى تعطيل Skill حتى عندما تكون مضمنة أو مثبتة. Skill المضمنة
  `coding-agent` اختيارية التفعيل — اضبط `skills.entries.coding-agent.enabled: true`
  وتأكد من تثبيت ومصادقة أحد `claude` أو `codex` أو `opencode` أو CLI
  آخر مدعوم.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  حقل تسهيلي لـ Skills التي تعلن `metadata.openclaw.primaryEnv`.
  يدعم سلسلة نص عادي أو كائن SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  متغيرات البيئة المحقونة لتشغيل الوكيل. تُحقن فقط عندما لا يكون
  المتغير مضبوطًا مسبقًا في العملية.
</ParamField>

<ParamField path="config" type="object">
  حاوية اختيارية لحقول إعداد مخصصة لكل Skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  قائمة سماح اختيارية لـ Skills **المضمنة** فقط. عند ضبطها، تكون Skills المضمنة
  الموجودة في القائمة فقط مؤهلة. لا تتأثر Skills المُدارة وSkills مساحة العمل.
</ParamField>

<Note>
  تطابق مفاتيح الإعدادات **اسم Skill** افتراضيًا. إذا عرّفت Skill
  `metadata.openclaw.skillKey`، فاستخدم ذلك المفتاح تحت `skills.entries`. ضع
  الأسماء التي تحتوي على واصلات بين علامات اقتباس: يتيح JSON5 المفاتيح المقتبسة.
</Note>

## حقن البيئة

عند بدء تشغيل وكيل، يقوم OpenClaw بما يلي:

<Steps>
  <Step title="قراءة بيانات Skill الوصفية">
    يحل OpenClaw قائمة Skills الفعالة للوكيل، مع تطبيق قواعد البوابات،
    وقوائم السماح، وتجاوزات الإعدادات.
  </Step>
  <Step title="حقن البيئة ومفاتيح API">
    يتم تطبيق `skills.entries.<key>.env` و`skills.entries.<key>.apiKey` على
    `process.env` طوال مدة التشغيل.
  </Step>
  <Step title="بناء مطالبة النظام">
    تُجمّع Skills المؤهلة في كتلة XML مضغوطة وتُحقن في
    مطالبة النظام.
  </Step>
  <Step title="استعادة البيئة">
    بعد انتهاء التشغيل، تتم استعادة البيئة الأصلية.
  </Step>
</Steps>

<Warning>
  حقن البيئة محدود النطاق إلى تشغيل الوكيل على **المضيف**، وليس sandbox. داخل
  sandbox، لا يكون لـ `env` و`apiKey` أي تأثير. راجع
  [إعدادات Skills](/ar/tools/skills-config#sandboxed-skills-and-env-vars) لمعرفة كيفية
  تمرير الأسرار إلى التشغيلات داخل sandbox.
</Warning>

بالنسبة إلى خلفية `claude-cli` المضمنة، يقوم OpenClaw أيضًا بتجسيد لقطة
Skill المؤهلة نفسها كـ Plugin مؤقت لـ Claude Code ويمررها عبر
`--plugin-dir`. تستخدم خلفيات CLI الأخرى كتالوج المطالبات فقط.

## اللقطات والتحديث

يلتقط OpenClaw لقطة لـ Skills المؤهلة **عند بدء الجلسة** ويعيد استخدام تلك
القائمة لكل الأدوار اللاحقة في الجلسة. تسري التغييرات على Skills أو الإعدادات
في الجلسة الجديدة التالية.

تُحدّث Skills أثناء الجلسة في حالتين:

- يكتشف مراقب Skills تغييرًا في `SKILL.md`.
- تتصل عقدة بعيدة مؤهلة جديدة.

تُستخدم القائمة المحدثة في دور الوكيل التالي. إذا تغيرت قائمة السماح الفعالة
للوكيل، يحدّث OpenClaw اللقطة لإبقاء Skills المرئية متسقة.

<AccordionGroup>
  <Accordion title="مراقب Skills">
    يراقب OpenClaw افتراضيًا مجلدات Skill ويرفع إصدار اللقطة عندما
    تتغير ملفات `SKILL.md`. اضبط ذلك تحت `skills.load`:

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true,
          watchDebounceMs: 250,
        },
      },
    }
    ```

    استخدم `allowSymlinkTargets` للتخطيطات المرتبطة رمزيًا عن قصد حيث يشير رابط رمزي
    لجذر Skill إلى خارج الجذر المضبوط، على سبيل المثال
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    فعّل `skills.workshop.allowSymlinkTargetWrites` فقط عندما ينبغي لـ Skill Workshop
    أيضًا تطبيق المقترحات عبر تلك المسارات المرتبطة رمزيًا والموثوقة.

  </Accordion>
  <Accordion title="عقد macOS البعيدة (Gateway على Linux)">
    إذا كان Gateway يعمل على Linux ولكن **عقدة macOS** متصلة مع السماح بـ
    `system.run`، يمكن لـ OpenClaw اعتبار Skills الخاصة بـ macOS فقط مؤهلة عندما
    تكون الملفات الثنائية المطلوبة موجودة على تلك العقدة. يجب أن يشغّل الوكيل تلك
    Skills عبر أداة `exec` مع `host=node`.

    لا تجعل العقد غير المتصلة Skills البعيدة فقط مرئية. إذا توقفت عقدة عن
    الرد على فحوصات الملفات الثنائية، يمسح OpenClaw مطابقات الملفات الثنائية المخزنة مؤقتًا لها.

  </Accordion>
</AccordionGroup>

## تأثير الرموز

عندما تكون Skills مؤهلة، يحقن OpenClaw كتلة XML مضغوطة في مطالبة النظام.
التكلفة حتمية:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **الكلفة الأساسية** (فقط عند وجود ≥ 1 Skill): نحو 195 حرفًا
- **لكل Skill:** نحو 97 حرفًا + أطوال حقول `name` و`description` و`location` لديك
- يوسع هروب XML الرموز `& < > " '` إلى كيانات، مضيفًا بضعة أحرف لكل ظهور
- عند نحو 4 أحرف/رمز، 97 حرفًا ≈ 24 رمزًا لكل Skill قبل أطوال الحقول

اجعل الأوصاف قصيرة ووصفية لتقليل كلفة المطالبة.

## ذات صلة

<CardGroup cols={2}>
  <Card title="إنشاء Skills" href="/ar/tools/creating-skills" icon="hammer">
    دليل خطوة بخطوة لتأليف Skill مخصصة.
  </Card>
  <Card title="Skill Workshop" href="/ar/tools/skill-workshop" icon="flask">
    طابور مقترحات لـ Skills التي يصوغها الوكيل.
  </Card>
  <Card title="إعدادات Skills" href="/ar/tools/skills-config" icon="gear">
    مخطط إعدادات `skills.*` الكامل وقوائم السماح للوكيل.
  </Card>
  <Card title="أوامر الشرطة المائلة" href="/ar/tools/slash-commands" icon="terminal">
    كيفية تسجيل أوامر الشرطة المائلة الخاصة بـ Skill وتوجيهها.
  </Card>
  <Card title="ClawHub" href="/ar/clawhub" icon="cloud">
    تصفح Skills وانشرها في السجل العام.
  </Card>
  <Card title="Plugins" href="/ar/tools/plugin" icon="plug">
    يمكن لـ Plugins شحن Skills إلى جانب الأدوات التي توثقها.
  </Card>
</CardGroup>

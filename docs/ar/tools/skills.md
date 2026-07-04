---
read_when:
    - إضافة Skills أو تعديلها
    - تغيير تقييد Skills أو قوائم السماح أو قواعد التحميل
    - فهم أسبقية Skills وسلوك اللقطات
sidebarTitle: Skills
summary: تعلّم Skills وكيلك كيفية استخدام الأدوات. تعرّف على كيفية تحميلها، وكيف تعمل الأسبقية، وكيفية تكوين ضوابط البوابة، وقوائم السماح، وحقن البيئة.
title: Skills
x-i18n:
    generated_at: "2026-07-04T06:34:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81b0f8dfc6522994b2dba865e236d1de3220fe265698506332d3139e38d9c929
    source_path: tools/skills.md
    workflow: 16
---

Skills هي ملفات تعليمات بصيغة Markdown تعلّم الوكيل كيف ومتى يستخدم
الأدوات. تعيش كل مهارة في دليل يحتوي على ملف `SKILL.md` مع frontmatter بصيغة YAML
ومتن Markdown. يحمّل OpenClaw المهارات المضمّنة بالإضافة إلى أي تجاوزات محلية،
ويفلترها وقت التحميل بناءً على البيئة، والإعدادات، ووجود الملفات الثنائية.

<CardGroup cols={2}>
  <Card title="Creating skills" href="/ar/tools/creating-skills" icon="hammer">
    ابنِ مهارة مخصصة واختبرها من الصفر.
  </Card>
  <Card title="Skill Workshop" href="/ar/tools/skill-workshop" icon="flask">
    راجع مقترحات المهارات التي صاغها الوكيل واعتمدها.
  </Card>
  <Card title="Skills config" href="/ar/tools/skills-config" icon="gear">
    مخطط إعدادات `skills.*` الكامل وقوائم السماح للوكلاء.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    تصفّح مهارات المجتمع وثبّتها.
  </Card>
</CardGroup>

## ترتيب التحميل

يحمّل OpenClaw من هذه المصادر، **مع أعلى أسبقية أولًا**. عندما يظهر اسم المهارة نفسه
في مواضع متعددة، يفوز المصدر الأعلى.

| الأولوية | المصدر | المسار |
| ----------- | ---------------------- | --------------------------------------- |
| 1 — الأعلى | مهارات مساحة العمل | `<workspace>/skills` |
| 2 | مهارات وكيل المشروع | `<workspace>/.agents/skills` |
| 3 | مهارات الوكيل الشخصية | `~/.agents/skills` |
| 4 | المهارات المُدارة / المحلية | `~/.openclaw/skills` |
| 5 | المهارات المضمّنة | مشحونة مع التثبيت |
| 6 — الأدنى | أدلة إضافية | `skills.load.extraDirs` + مهارات Plugin |

تدعم جذور المهارات التخطيطات المجمّعة. يكتشف OpenClaw مهارة كلما ظهر
`SKILL.md` في أي مكان تحت جذر مضبوط:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

مسار المجلد للتنظيم فقط. يأتي اسم المهارة، وأمر الشرطة المائلة، ومفتاح قائمة السماح
كلها من حقل frontmatter باسم `name` (أو من اسم الدليل عندما يكون `name` مفقودًا).

<Note>
  دليل `$CODEX_HOME/skills` الأصلي الخاص بـ Codex CLI **ليس** جذر مهارات في OpenClaw.
  استخدم `openclaw migrate plan codex` لجرد تلك المهارات، ثم
  `openclaw migrate codex` لنسخها إلى مساحة عمل OpenClaw لديك.
</Note>

## مهارات لكل وكيل مقابل مهارات مشتركة

في إعدادات الوكلاء المتعددين، يكون لكل وكيل مساحة عمل خاصة به. استخدم المسار الذي
يطابق مستوى الظهور المطلوب لديك:

| النطاق | المسار | مرئي لـ |
| -------------- | ---------------------------- | --------------------------- |
| لكل وكيل | `<workspace>/skills` | ذلك الوكيل فقط |
| وكيل المشروع | `<workspace>/.agents/skills` | وكيل مساحة العمل تلك فقط |
| وكيل شخصي | `~/.agents/skills` | جميع الوكلاء على هذا الجهاز |
| مُدار مشترك | `~/.openclaw/skills` | جميع الوكلاء على هذا الجهاز |
| أدلة إضافية | `skills.load.extraDirs` | جميع الوكلاء على هذا الجهاز |

## قوائم السماح للوكلاء

**موقع** المهارة (الأسبقية) و**ظهور** المهارة (أي وكيل يمكنه استخدامها) عنصران
منفصلان للتحكم. استخدم قوائم السماح لتقييد المهارات التي يراها الوكيل، بغض النظر
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
  <Accordion title="Allowlist rules">
    - احذف `agents.defaults.skills` لترك كل المهارات غير مقيّدة افتراضيًا.
    - احذف `agents.list[].skills` لوراثة `agents.defaults.skills`.
    - اضبط `agents.list[].skills: []` لعدم إظهار أي مهارات لذلك الوكيل.
    - قائمة `agents.list[].skills` غير الفارغة هي المجموعة **النهائية** — فهي لا
      تُدمج مع القيم الافتراضية.
    - تنطبق قائمة السماح الفعالة عبر بناء الموجهات، واكتشاف أوامر الشرطة المائلة،
      ومزامنة sandbox، ولقطات المهارات.
    - هذا ليس حدّ تفويض لقشرة المضيف. إذا كان الوكيل نفسه يستطيع استخدام `exec`،
      فقيّد تلك القشرة بشكل منفصل باستخدام sandboxing، وعزل مستخدم نظام التشغيل،
      وقوائم منع/سماح exec، وبيانات اعتماد لكل مورد.
  </Accordion>
</AccordionGroup>

## Plugins والمهارات

يمكن لـ Plugins شحن مهاراتها الخاصة عبر سرد أدلة `skills` في
`openclaw.plugin.json` (مسارات نسبية إلى جذر Plugin). تُحمّل مهارات Plugin
عندما يكون Plugin مفعّلًا — على سبيل المثال، يشحن Plugin المتصفح مهارة
`browser-automation` للتحكم متعدد الخطوات في المتصفح.

تندمج أدلة مهارات Plugin عند مستوى الأسبقية المنخفض نفسه مثل
`skills.load.extraDirs`، لذا تتجاوزها أي مهارة مضمّنة أو مُدارة أو خاصة بوكيل أو
بمساحة عمل لها الاسم نفسه. احجبها عبر `metadata.openclaw.requires.config` في
مدخل إعدادات Plugin.

راجع [Plugins](/ar/tools/plugin) و[الأدوات](/ar/tools) للاطلاع على نظام Plugin الكامل.

## ورشة المهارات

[ورشة المهارات](/ar/tools/skill-workshop) هي طابور مقترحات بين الوكيل وملفات المهارات
النشطة لديك. عندما يلاحظ الوكيل عملًا قابلًا لإعادة الاستخدام، يصوغ مقترحًا بدلًا
من الكتابة مباشرة إلى `SKILL.md`. تراجع أنت وتعتمد قبل أن يتغير أي شيء.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

راجع [ورشة المهارات](/ar/tools/skill-workshop) للاطلاع على دورة الحياة الكاملة ومرجع
CLI والإعدادات.

## التثبيت من ClawHub

[ClawHub](https://clawhub.ai) هو سجل المهارات العام. استخدم أوامر
`openclaw skills` للتثبيت والتحديث، أو CLI باسم `clawhub` للنشر والمزامنة.

| الإجراء | الأمر |
| ---------------------------------- | ------------------------------------------------------ |
| تثبيت مهارة في مساحة العمل | `openclaw skills install @owner/<slug>` |
| التثبيت من مستودع Git | `openclaw skills install git:owner/repo@ref` |
| تثبيت دليل مهارة محلي | `openclaw skills install ./path/to/skill --as my-tool` |
| التثبيت لكل الوكلاء المحليين | `openclaw skills install @owner/<slug> --global` |
| تحديث كل مهارات مساحة العمل | `openclaw skills update --all` |
| تحديث مهارة مُدارة مشتركة | `openclaw skills update @owner/<slug> --global` |
| تحديث كل المهارات المُدارة المشتركة | `openclaw skills update --all --global` |
| التحقق من غلاف ثقة مهارة | `openclaw skills verify @owner/<slug>` |
| طباعة بطاقة Skill المولّدة | `openclaw skills verify @owner/<slug> --card` |
| النشر / المزامنة عبر ClawHub CLI | `clawhub sync --all` |

<AccordionGroup>
  <Accordion title="Install details">
    يثبّت `openclaw skills install` افتراضيًا في دليل `skills/` لمساحة العمل
    النشطة. أضف `--global` للتثبيت في دليل `~/.openclaw/skills` المشترك، المرئي
    لكل الوكلاء المحليين ما لم تضيّقه قوائم السماح للوكلاء.

    تتوقع تثبيتات Git والتثبيتات المحلية وجود `SKILL.md` في جذر المصدر. يأتي slug
    من frontmatter `SKILL.md` باسم `name` عندما يكون صالحًا، ثم يعود إلى اسم
    الدليل أو المستودع. استخدم `--as <slug>` للتجاوز.
    يتتبع `openclaw skills update` تثبيتات ClawHub فقط — أعد تثبيت مصادر Git أو
    المصادر المحلية لتحديثها.

  </Accordion>
  <Accordion title="Verification and security scanning">
    يطلب `openclaw skills verify @owner/<slug>` من ClawHub غلاف ثقة
    `clawhub.skill.verify.v1` الخاص بالمهارة. تتحقق مهارات ClawHub المثبتة مقابل
    الإصدار والسجل المسجلين في `.clawhub/origin.json`. تبقى slugs المجردة مقبولة
    للمهارات المثبتة الحالية أو غير الملتبسة، لكن المراجع المؤهلة بالمالك تتجنب
    التباس الناشر.

    تعرض صفحات مهارات ClawHub أحدث حالة فحص أمني قبل التثبيت، مع صفحات تفصيلية
    لـ VirusTotal وClawScan والتحليل الثابت. يخرج الأمر برمز غير صفري عندما يضع
    ClawHub علامة فشل على التحقق. يتعافى الناشرون من الإيجابيات الكاذبة عبر لوحة
    ClawHub أو `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Private archive installs">
    يمكن لعملاء Gateway الذين يحتاجون تسليمًا خارج ClawHub تجهيز أرشيف مهارة zip
    باستخدام `skills.upload.begin` و`skills.upload.chunk` و`skills.upload.commit`،
    ثم التثبيت باستخدام `skills.install({ source: "upload", ... })`. هذا المسار
    معطّل افتراضيًا ويتطلب `skills.install.allowUploadedArchives: true` في
    `openclaw.json`. لا تحتاج تثبيتات ClawHub العادية إلى هذا الإعداد أبدًا.
  </Accordion>
</AccordionGroup>

## الأمان

<Warning>
  تعامل مع مهارات الجهات الخارجية على أنها **تعليمات برمجية غير موثوقة**. اقرأها
  قبل التفعيل. فضّل التشغيل داخل sandbox للمدخلات غير الموثوقة والأدوات عالية
  المخاطر. راجع [Sandboxing](/ar/gateway/sandboxing) لعناصر التحكم من جهة الوكيل.
</Warning>

<AccordionGroup>
  <Accordion title="Path containment">
    لا يقبل اكتشاف مهارات مساحة العمل، ووكيل المشروع، والدليل الإضافي إلا جذور
    المهارات التي يبقى realpath المحلول الخاص بها داخل الجذر المضبوط، ما لم يكن
    `skills.load.allowSymlinkTargets` يثق صراحة بجذر هدف. تكتب ورشة المهارات عبر
    تلك الأهداف الموثوقة فقط عندما يكون
    `skills.workshop.allowSymlinkTargetWrites` مفعّلًا.
    قد يحتوي `~/.openclaw/skills` المُدار و`~/.agents/skills` الشخصي على مجلدات
    مهارات مرتبطة رمزيًا، لكن يجب أن يبقى realpath لكل `SKILL.md` داخل دليل
    المهارة المحلول الخاص به.
  </Accordion>
  <Accordion title="Operator install policy">
    اضبط `security.installPolicy` لتشغيل أمر سياسة محلي موثوق قبل متابعة تثبيتات
    المهارات. تتلقى السياسة metadata ومسار المصدر المجهّز، وتنطبق على مسارات
    ClawHub، والمرفوع، وGit، والمحلي، والتحديث، ومثبت الاعتماديات، وتفشل بإغلاق
    عندما لا يستطيع الأمر إرجاع قرار صالح.
  </Accordion>
  <Accordion title="Secret injection scope">
    يحقن `skills.entries.*.env` و`skills.entries.*.apiKey` الأسرار في عملية
    **المضيف** لدورة ذلك الوكيل فقط — وليس في sandbox. أبقِ الأسرار خارج الموجهات
    والسجلات.
  </Accordion>
</AccordionGroup>

للاطلاع على نموذج التهديد الأوسع وقوائم التحقق الأمنية، راجع
[الأمان](/ar/gateway/security).

## تنسيق SKILL.md

تحتاج كل مهارة كحد أدنى إلى `name` و`description` في frontmatter:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  يتبع OpenClaw مواصفة [AgentSkills](https://agentskills.io). يدعم محلل
  frontmatter **مفاتيح بسطر واحد فقط** — يجب أن يكون `metadata` كائن JSON بسطر
  واحد. استخدم `{baseDir}` في المتن للإشارة إلى مسار مجلد المهارة.
</Note>

### مفاتيح frontmatter اختيارية

<ParamField path="homepage" type="string">
  عنوان URL المعروض باسم "موقع الويب" في واجهة Skills على macOS. مدعوم أيضًا عبر
  `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  عندما تكون القيمة `true`، تُعرض المهارة كأمر شرطة مائلة يمكن للمستخدم استدعاؤه.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  عندما تكون القيمة `true`، يبقي OpenClaw تعليمات المهارة خارج الموجه العادي
  للوكيل. تظل المهارة متاحة كأمر شرطة مائلة عندما تكون `user-invocable` أيضًا
  `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  عند ضبطها على `tool`، يتجاوز أمر الشرطة المائلة النموذج ويُرسَل مباشرة إلى أداة
  مسجلة.
</ParamField>

<ParamField path="command-tool" type="string">
  اسم الأداة المراد استدعاؤها عند ضبط `command-dispatch: tool`.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  لإرسال الأدوات، يمرّر سلسلة الوسيطات الخام إلى الأداة من دون
  تحليل أساسي. تتلقى الأداة
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## الضبط

يرشّح OpenClaw المهارات عند وقت التحميل باستخدام `metadata.openclaw` (JSON بسطر واحد
في frontmatter). تكون المهارة التي لا تحتوي على كتلة `metadata.openclaw` مؤهلة دائمًا
ما لم يتم تعطيلها صراحة.

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
  عندما تكون `true`، أدرج المهارة دائمًا وتجاوز كل البوابات الأخرى.
</ParamField>

<ParamField path="emoji" type="string">
  رمز تعبيري اختياري يُعرض في واجهة Skills على macOS.
</ParamField>

<ParamField path="homepage" type="string">
  عنوان URL اختياري يُعرض باسم "موقع الويب" في واجهة Skills على macOS.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  مرشح النظام الأساسي. عند ضبطه، تكون المهارة مؤهلة فقط على أنظمة التشغيل المدرجة.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  يجب أن يوجد كل ملف تنفيذي على `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  يجب أن يوجد ملف تنفيذي واحد على الأقل على `PATH`.
</ParamField>

<ParamField path="requires.env" type="string[]">
  يجب أن يوجد كل متغير بيئة في العملية أو أن يُوفَّر عبر الإعدادات.
</ParamField>

<ParamField path="requires.config" type="string[]">
  يجب أن يكون كل مسار `openclaw.json` ذا قيمة صادقة.
</ParamField>

<ParamField path="primaryEnv" type="string">
  اسم متغير البيئة المرتبط بـ `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  مواصفات مثبّت اختيارية تستخدمها واجهة Skills على macOS (brew / node / go / uv / download).
</ParamField>

<Note>
  لا تزال كتل `metadata.clawdbot` القديمة مقبولة عند غياب
  `metadata.openclaw`، بحيث تحتفظ المهارات الأقدم المثبّتة
  ببوابات الاعتمادات وتلميحات المثبّت. يجب أن تستخدم المهارات الجديدة
  `metadata.openclaw`.
</Note>

### مواصفات المثبّت

تخبر مواصفات المثبّت واجهة Skills على macOS بكيفية تثبيت اعتماد:

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
  <Accordion title="قواعد اختيار المثبّت">
    - عند إدراج عدة مثبّتات، يختار Gateway خيارًا مفضّلًا واحدًا
      (brew عند توفره، وإلا node).
    - إذا كانت كل المثبّتات `download`، يعرض OpenClaw كل إدخال حتى تتمكن من
      رؤية كل العناصر المتاحة.
    - يمكن أن تتضمن المواصفات `os: ["darwin"|"linux"|"win32"]` للتصفية حسب النظام الأساسي.
    - تحترم تثبيتات Node القيمة `skills.install.nodeManager` في `openclaw.json`
      (الافتراضي: npm؛ الخيارات: npm / pnpm / yarn / bun). يؤثر هذا فقط على تثبيتات
      المهارات؛ يجب أن يظل وقت تشغيل Gateway هو Node.
    - تفضيل مثبّت Gateway: Homebrew ← uv ← مدير node المضبوط ←
      go ← download.
  </Accordion>
  <Accordion title="تفاصيل لكل مثبّت">
    - **Homebrew:** لا يثبّت OpenClaw Homebrew تلقائيًا ولا يترجم صيغ brew
      إلى أوامر حزم النظام. في حاويات Linux من دون
      `brew`، تُخفى المثبّتات التي تعتمد على brew فقط؛ استخدم صورة مخصصة أو ثبّت
      الاعتماد يدويًا.
    - **Go:** يتطلب OpenClaw الإصدار Go 1.21 أو أحدث لتثبيتات المهارات التلقائية و
      يحافظ على إعدادات `GOBIN` و`GOPATH` و`GOTOOLCHAIN` الحالية. إذا كانت
      سلسلة الأدوات المضبوطة لا تستطيع تلبية إصدار Go المطلوب لوحدة ما،
      يجمع الإعداد الأولي المهارة مع متطلبات Go اليدوية بعد محاولة التثبيت.
      إذا كان `go` مفقودًا وكان Homebrew متاحًا، يثبّت OpenClaw
      Go عبر Homebrew أولًا ويضبط `GOBIN` إلى `bin` الخاص بـ Homebrew. على Linux،
      يمكن لـ OpenClaw بدلًا من ذلك استخدام `apt-get` بصفة root أو عبر `sudo` من دون كلمة مرور
      عندما يلبّي مرشح `golang-go` المحدّث الحد الأدنى للإصدار.
    - **Download:** `url` (مطلوب)، `archive` (`tar.gz` | `tar.bz2` | `zip`)،
      `extract` (الافتراضي: تلقائي عند اكتشاف أرشيف)، `stripComponents`،
      `targetDir` (الافتراضي: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="ملاحظات العزل">
    يُفحص `requires.bins` على **المضيف** عند وقت تحميل المهارة. إذا كان الوكيل
    يعمل داخل صندوق عزل، فيجب أن يوجد الملف التنفيذي أيضًا **داخل الحاوية**.
    ثبّته عبر `agents.defaults.sandbox.docker.setupCommand` أو صورة
    مخصصة. يعمل `setupCommand` مرة واحدة بعد إنشاء الحاوية ويتطلب
    خروجًا شبكيًا، ونظام ملفات جذريًا قابلًا للكتابة، ومستخدم root في صندوق العزل.
  </Accordion>
</AccordionGroup>

## تجاوزات الإعدادات

بدّل واضبط المهارات المضمّنة أو المُدارة ضمن `skills.entries` في
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
  يعطّل `false` المهارة حتى عند تضمينها أو تثبيتها. مهارة `coding-agent`
  المضمّنة اختيارية الاشتراك — اضبط `skills.entries.coding-agent.enabled: true`
  وتأكد من تثبيت ومصادقة أحد `claude` أو `codex` أو `opencode` أو CLI آخر مدعوم.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  حقل ملائم للمهارات التي تعلن `metadata.openclaw.primaryEnv`.
  يدعم سلسلة نصية صريحة أو كائن SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  متغيرات البيئة المحقونة لتشغيل الوكيل. تُحقن فقط عندما لا يكون
  المتغير مضبوطًا مسبقًا في العملية.
</ParamField>

<ParamField path="config" type="object">
  حزمة اختيارية لحقول إعداد مخصصة لكل مهارة.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  قائمة سماح اختيارية للمهارات **المضمّنة** فقط. عند ضبطها، تكون المهارات المضمّنة
  الموجودة في القائمة فقط مؤهلة. لا تتأثر المهارات المُدارة ومهارات مساحة العمل.
</ParamField>

<Note>
  تطابق مفاتيح الإعدادات **اسم المهارة** افتراضيًا. إذا عرّفت مهارة
  `metadata.openclaw.skillKey`، فاستخدم ذلك المفتاح ضمن `skills.entries`. ضع
  الأسماء التي تحتوي على واصلات بين علامات اقتباس: يسمح JSON5 بالمفاتيح المقتبسة.
</Note>

## حقن البيئة

عند بدء تشغيل وكيل، يقوم OpenClaw بما يلي:

<Steps>
  <Step title="قراءة بيانات المهارة الوصفية">
    يحل OpenClaw قائمة المهارات الفعالة للوكيل، مع تطبيق قواعد الضبط
    وقوائم السماح وتجاوزات الإعدادات.
  </Step>
  <Step title="حقن البيئة ومفاتيح API">
    تُطبّق `skills.entries.<key>.env` و`skills.entries.<key>.apiKey` على
    `process.env` طوال مدة التشغيل.
  </Step>
  <Step title="بناء موجه النظام">
    تُجمع المهارات المؤهلة في كتلة XML مضغوطة وتُحقن في
    موجه النظام.
  </Step>
  <Step title="استعادة البيئة">
    بعد انتهاء التشغيل، تُستعاد البيئة الأصلية.
  </Step>
</Steps>

<Warning>
  حقن البيئة محدود بتشغيل وكيل **المضيف**، وليس صندوق العزل. داخل
  صندوق العزل، لا يكون لـ `env` و`apiKey` أي تأثير. راجع
  [إعدادات Skills](/ar/tools/skills-config#sandboxed-skills-and-env-vars) لمعرفة كيفية
  تمرير الأسرار إلى عمليات التشغيل المعزولة.
</Warning>

بالنسبة للواجهة الخلفية المضمّنة `claude-cli`، يجسّد OpenClaw أيضًا لقطة
المهارات المؤهلة نفسها على شكل Plugin مؤقت لـ Claude Code ويمرّرها عبر
`--plugin-dir`. تستخدم واجهات CLI الخلفية الأخرى كتالوج الموجهات فقط.

## اللقطات والتحديث

يلتقط OpenClaw المهارات المؤهلة **عند بدء الجلسة** ويعيد استخدام تلك
القائمة لكل الأدوار اللاحقة في الجلسة. تسري التغييرات على المهارات أو الإعدادات
في الجلسة الجديدة التالية.

تُحدّث Skills في منتصف الجلسة في حالتين:

- يكتشف مراقب Skills تغييرًا في `SKILL.md`.
- تتصل عقدة بعيدة مؤهلة جديدة.

تُستخدم القائمة المحدّثة في دور الوكيل التالي. إذا تغيّرت قائمة السماح الفعالة
للوكيل، يحدّث OpenClaw اللقطة لإبقاء المهارات المرئية
متوافقة.

<AccordionGroup>
  <Accordion title="مراقب Skills">
    افتراضيًا، يراقب OpenClaw مجلدات المهارات ويرفع إصدار اللقطة عندما
    تتغير ملفات `SKILL.md`. اضبط ذلك ضمن `skills.load`:

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

    استخدم `allowSymlinkTargets` للتخطيطات الرمزية المقصودة حيث يشير رابط رمزي
    لجذر مهارة إلى خارج الجذر المضبوط، مثل
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    فعّل `skills.workshop.allowSymlinkTargetWrites` فقط عندما يجب على Skill Workshop
    أن يطبق المقترحات أيضًا عبر تلك المسارات الرمزية الموثوقة.

  </Accordion>
  <Accordion title="عقد macOS البعيدة (Linux gateway)">
    إذا كان Gateway يعمل على Linux ولكن **عقدة macOS** متصلة مع السماح بـ
    `system.run`، فيمكن لـ OpenClaw اعتبار المهارات الخاصة بـ macOS فقط مؤهلة عندما
    تكون الملفات التنفيذية المطلوبة موجودة على تلك العقدة. يجب أن يشغّل الوكيل تلك
    المهارات عبر أداة `exec` مع `host=node`.

    لا تجعل العقد غير المتصلة المهارات البعيدة فقط مرئية. إذا توقفت عقدة عن
    الرد على فحوصات الملفات التنفيذية، يمسح OpenClaw مطابقات الملفات التنفيذية المخزنة مؤقتًا لها.

  </Accordion>
</AccordionGroup>

## أثر الرموز

عندما تكون المهارات مؤهلة، يحقن OpenClaw كتلة XML مضغوطة في موجه
النظام. التكلفة حتمية:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **الكلفة الأساسية** (فقط عند وجود ≥ 1 مهارة): نحو 195 حرفًا
- **لكل مهارة:** نحو 97 حرفًا + أطوال حقول `name` و`description` و`location`
- يوسّع تهريب XML المحارف `& < > " '` إلى كيانات، مما يضيف بضعة محارف لكل ظهور
- عند نحو 4 محارف/رمز، فإن 97 حرفًا ≈ 24 رمزًا لكل مهارة قبل أطوال الحقول

اجعل الأوصاف قصيرة ووصفية لتقليل كلفة الموجه.

## ذات صلة

<CardGroup cols={2}>
  <Card title="إنشاء Skills" href="/ar/tools/creating-skills" icon="hammer">
    دليل خطوة بخطوة لتأليف مهارة مخصصة.
  </Card>
  <Card title="Skill Workshop" href="/ar/tools/skill-workshop" icon="flask">
    قائمة انتظار مقترحات للمهارات التي يصوغها الوكيل.
  </Card>
  <Card title="إعدادات Skills" href="/ar/tools/skills-config" icon="gear">
    مخطط إعدادات `skills.*` الكامل وقوائم سماح الوكلاء.
  </Card>
  <Card title="أوامر الشرطة المائلة" href="/ar/tools/slash-commands" icon="terminal">
    كيف تُسجّل أوامر الشرطة المائلة للمهارات وتُوجّه.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    تصفح المهارات وانشرها في السجل العام.
  </Card>
  <Card title="Plugins" href="/ar/tools/plugin" icon="plug">
    يمكن لـ Plugins شحن مهارات إلى جانب الأدوات التي توثقها.
  </Card>
</CardGroup>

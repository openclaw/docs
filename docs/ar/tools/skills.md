---
read_when:
    - إضافة Skills أو تعديلها
    - تغيير حظر Skills أو قوائم السماح أو قواعد التحميل
    - فهم أولوية Skills وسلوك اللقطات snapshot
sidebarTitle: Skills
summary: 'Skills: المُدارة مقابل مساحة العمل، وقواعد الحظر، وقوائم السماح الخاصة بالوكيل، وربط التكوين'
title: Skills
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:42:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19fd880e88051db9d4d9090a64123a2dc5a16a6211fa46879ddecaa86f25149c
    source_path: tools/skills.md
    workflow: 15
---

يستخدم OpenClaw مجلدات Skills المتوافقة مع **[AgentSkills](https://agentskills.io)** لتعليم الوكيل كيفية استخدام الأدوات. كل Skill عبارة عن دليل
يحتوي على `SKILL.md` مع YAML frontmatter وتعليمات. يقوم OpenClaw
بتحميل Skills المضمّنة بالإضافة إلى التجاوزات المحلية الاختيارية، ثم يرشّحها
أثناء التحميل استنادًا إلى البيئة، والتكوين، ووجود الملفات الثنائية.

## المواقع والأولوية

يحمّل OpenClaw Skills من هذه المصادر، **من الأعلى أولوية إلى الأقل**:

| #   | المصدر | المسار |
| --- | --------------------- | -------------------------------- |
| 1   | Skills مساحة العمل | `<workspace>/skills` |
| 2   | Skills وكيل المشروع | `<workspace>/.agents/skills` |
| 3   | Skills الوكيل الشخصية | `~/.agents/skills` |
| 4   | Skills المُدارة/المحلية | `~/.openclaw/skills` |
| 5   | Skills المضمّنة | تُشحن مع التثبيت |
| 6   | مجلدات Skills الإضافية | `skills.load.extraDirs` (التكوين) |

إذا كان هناك تعارض في اسم Skill، يفوز المصدر الأعلى.

## Skills لكل وكيل مقابل Skills المشتركة

في إعدادات **الوكلاء المتعددين** يكون لكل وكيل مساحة عمل خاصة به:

| النطاق | المسار | مرئي لـ |
| -------------------- | ------------------------------------------- | --------------------------- |
| لكل وكيل | `<workspace>/skills` | ذلك الوكيل فقط |
| وكيل المشروع | `<workspace>/.agents/skills` | وكيل مساحة العمل تلك فقط |
| وكيل شخصي | `~/.agents/skills` | جميع الوكلاء على ذلك الجهاز |
| مُدار/محلي مشترك | `~/.openclaw/skills` | جميع الوكلاء على ذلك الجهاز |
| أدلة إضافية مشتركة | `skills.load.extraDirs` (الأقل أولوية) | جميع الوكلاء على ذلك الجهاز |

الاسم نفسه في عدة أماكن → يفوز المصدر الأعلى. مساحة العمل تتغلب على
وكيل المشروع، والذي يتغلب على الوكيل الشخصي، والذي يتغلب على المُدار/المحلي، والذي يتغلب على المضمّن،
والذي يتغلب على الأدلة الإضافية.

## قوائم السماح لـ Skills الخاصة بالوكيل

**موقع** Skill و**رؤية** Skill هما عنصران منفصلان.
الموقع/الأولوية يحددان أي نسخة من Skill ذات الاسم نفسه تفوز؛ أما
قوائم السماح الخاصة بالوكيل فتحدد أي Skills يمكن للوكيل استخدامها فعليًا.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // يرث github وweather
      { id: "docs", skills: ["docs-search"] }, // يستبدل الإعدادات الافتراضية
      { id: "locked-down", skills: [] }, // بلا Skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="قواعد قائمة السماح">
    - احذف `agents.defaults.skills` للحصول على Skills غير مقيّدة افتراضيًا.
    - احذف `agents.list[].skills` لوراثة `agents.defaults.skills`.
    - عيّن `agents.list[].skills: []` لعدم وجود Skills.
    - تمثل قائمة `agents.list[].skills` غير الفارغة المجموعة **النهائية** لذلك
      الوكيل — ولا تُدمج مع الإعدادات الافتراضية.
    - تنطبق قائمة السماح الفعّالة على مستوى بناء الموجّه، واكتشاف أوامر الشرطة المائلة الخاصة بالـ Skill،
      والمزامنة مع sandbox، ولقطات snapshot الخاصة بالـ Skill.
  </Accordion>
</AccordionGroup>

## Plugins وSkills

يمكن لـ Plugins شحن Skills خاصة بها عبر إدراج أدلة `skills` في
`openclaw.plugin.json` (بمسارات نسبة إلى جذر Plugin). يتم تحميل Skills الخاصة بالـ Plugin
عندما يكون الـ Plugin مفعّلًا. هذا هو المكان الصحيح لأدلة التشغيل
الخاصة بالأداة والتي تكون أطول من أن توضع في وصف الأداة ولكن ينبغي
أن تكون متاحة كلما كان الـ Plugin مثبتًا — على سبيل المثال، يشحن
Plugin المتصفح Skill باسم `browser-automation` للتحكم متعدد الخطوات في المتصفح.

تُدمج أدلة Skills الخاصة بالـ Plugin في نفس المسار منخفض الأولوية مثل
`skills.load.extraDirs`، لذا فإن Skill بنفس الاسم من النوع المضمّن أو المُدار أو الخاص بالوكيل أو بمساحة العمل سيتجاوزها. يمكنك تقييدها عبر
`metadata.openclaw.requires.config` في إدخال تكوين الـ Plugin.

راجع [Plugins](/ar/tools/plugin) للاكتشاف/التكوين و[Tools](/ar/tools) لسطح
الأدوات الذي تعلّمه هذه Skills.

## Skill Workshop

يمكن لـ Plugin **Skill Workshop** الاختياري والتجريبي إنشاء Skills لمساحة العمل
أو تحديثها انطلاقًا من إجراءات قابلة لإعادة الاستخدام لوحظت أثناء عمل الوكيل. وهو
معطّل افتراضيًا ويجب تمكينه صراحةً عبر
`plugins.entries.skill-workshop`.

يكتب Skill Workshop فقط إلى `<workspace>/skills`، ويفحص
المحتوى المُنشأ، ويدعم الموافقة المعلّقة أو الكتابات الآمنة التلقائية، ويعزل
الاقتراحات غير الآمنة، ويحدّث لقطة snapshot الخاصة بالـ Skill بعد نجاح
الكتابات حتى تصبح Skills الجديدة متاحة دون إعادة تشغيل Gateway.

استخدمه لتصحيحات مثل _"في المرة القادمة، تحقّق من إسناد GIF"_ أو
لسير العمل المكتسب بشق الأنفس مثل قوائم التحقق الخاصة بضمان جودة الوسائط. ابدأ
بالموافقة المعلّقة؛ واستخدم الكتابات التلقائية فقط في مساحات العمل الموثوقة بعد مراجعة
اقتراحاته. الدليل الكامل: [Plugin Skill Workshop](/ar/plugins/skill-workshop).

## ClawHub (التثبيت والمزامنة)

[ClawHub](https://clawhub.ai) هو سجل Skills العام لـ OpenClaw.
استخدم أوامر `openclaw skills` الأصلية للاكتشاف/التثبيت/التحديث، أو
استخدم CLI المنفصل `clawhub` لسير عمل النشر/المزامنة. الدليل الكامل:
[ClawHub](/ar/tools/clawhub).

| الإجراء | الأمر |
| ---------------------------------- | -------------------------------------- |
| تثبيت Skill في مساحة العمل | `openclaw skills install <skill-slug>` |
| تحديث جميع Skills المثبتة | `openclaw skills update --all` |
| مزامنة (فحص + نشر التحديثات) | `clawhub sync --all` |

يقوم `openclaw skills install` الأصلي بالتثبيت في دليل
`skills/` الخاص بمساحة العمل النشطة. كما يثبّت CLI المنفصل `clawhub`
في `./skills` ضمن دليل العمل الحالي لديك (أو يعود إلى
مساحة العمل المكوّنة في OpenClaw). يلتقط OpenClaw ذلك على أنه
`<workspace>/skills` في الجلسة التالية.

## الأمان

<Warning>
تعامل مع Skills التابعة لجهات خارجية على أنها **شيفرة غير موثوقة**. اقرأها قبل التمكين.
فضّل التشغيل داخل sandbox للمدخلات غير الموثوقة والأدوات الخطرة. راجع
[Sandboxing](/ar/gateway/sandboxing) لعناصر التحكم الخاصة بالوكيل.
</Warning>

- لا يقبل اكتشاف Skills في مساحة العمل والأدلة الإضافية إلا جذور Skills وملفات `SKILL.md` التي يبقى realpath المحلول لها داخل الجذر المكوَّن.
- تقوم عمليات تثبيت تبعيات Skill المعتمدة على Gateway (`skills.install`، والإعداد الأولي، وواجهة إعدادات Skills) بتشغيل ماسح الشيفرة الخطرة المضمّن قبل تنفيذ بيانات التثبيت الوصفية. يتم حظر نتائج `critical` افتراضيًا ما لم يعيّن المستدعي تجاوز الخطر صراحةً؛ أما النتائج المشبوهة فتعطي تحذيرًا فقط.
- يختلف `openclaw skills install <slug>` — فهو ينزّل مجلد Skill من ClawHub إلى مساحة العمل ولا يستخدم مسار بيانات التثبيت الوصفية المذكور أعلاه.
- يقوم `skills.entries.*.env` و`skills.entries.*.apiKey` بحقن الأسرار في عملية **المضيف** لذلك الدور الخاص بالوكيل (وليس في sandbox). أبقِ الأسرار خارج الموجّهات والسجلات.

للاطلاع على نموذج تهديد أوسع وقوائم التحقق، راجع [الأمان](/ar/gateway/security).

## تنسيق `SKILL.md`

يجب أن يتضمن `SKILL.md` على الأقل:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

يتبع OpenClaw مواصفة AgentSkills من حيث التخطيط/الغاية. ويَدعم المحلّل المستخدم
في الوكيل المضمّن مفاتيح frontmatter **أحادية السطر** فقط؛
ويجب أن تكون قيمة `metadata` **كائن JSON أحادي السطر**. استخدم `{baseDir}` في
التعليمات للإشارة إلى مسار مجلد Skill.

### مفاتيح frontmatter الاختيارية

<ParamField path="homepage" type="string">
  عنوان URL يظهر كـ "Website" في واجهة macOS الخاصة بالـ Skills. ومدعوم أيضًا عبر `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  عندما تكون القيمة `true`، يتم عرض Skill كأمر شرطة مائلة للمستخدم.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  عندما تكون القيمة `true`، تُستبعد Skill من موجّه النموذج (مع بقائها متاحة عبر استدعاء المستخدم).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  عند ضبطها إلى `tool`، يتجاوز أمر الشرطة المائلة النموذج ويُرسَل مباشرةً إلى أداة.
</ParamField>
<ParamField path="command-tool" type="string">
  اسم الأداة المطلوب استدعاؤها عندما يتم تعيين `command-dispatch: tool`.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  بالنسبة إلى توجيه الأداة، يمرّر سلسلة الوسائط الخام إلى الأداة (من دون تحليل في core). يتم استدعاء الأداة بالقيمة `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## الحظر (مرشحات وقت التحميل)

يقوم OpenClaw بترشيح Skills أثناء التحميل باستخدام `metadata` ‏(JSON أحادي السطر):

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

الحقول ضمن `metadata.openclaw`:

<ParamField path="always" type="boolean">
  عندما تكون القيمة `true`، تُضمَّن Skill دائمًا (مع تخطي بقية شروط الحظر).
</ParamField>
<ParamField path="emoji" type="string">
  رمز تعبيري اختياري تستخدمه واجهة macOS الخاصة بالـ Skills.
</ParamField>
<ParamField path="homepage" type="string">
  عنوان URL اختياري يظهر كـ "Website" في واجهة macOS الخاصة بالـ Skills.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  قائمة اختيارية للمنصات. إذا تم تعيينها، تكون Skill مؤهلة فقط على أنظمة التشغيل تلك.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  يجب أن يكون كل منها موجودًا على `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  يجب أن يوجد واحد منها على الأقل على `PATH`.
</ParamField>
<ParamField path="requires.env" type="string[]">
  يجب أن يوجد متغيّر البيئة أو يتم توفيره في التكوين.
</ParamField>
<ParamField path="requires.config" type="string[]">
  قائمة بمسارات `openclaw.json` التي يجب أن تكون truthy.
</ParamField>
<ParamField path="primaryEnv" type="string">
  اسم متغيّر البيئة المرتبط بـ `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  مواصفات تثبيت اختيارية تستخدمها واجهة macOS الخاصة بالـ Skills ‏(brew/node/go/uv/download).
</ParamField>

إذا لم يكن هناك `metadata.openclaw`، تكون Skill مؤهلة دائمًا (ما لم
تُعطَّل في التكوين أو تُحظر بواسطة `skills.allowBundled` بالنسبة إلى Skills المضمّنة).

<Note>
لا تزال كتل `metadata.clawdbot` القديمة مقبولة عندما يكون
`metadata.openclaw` غير موجود، بحيث تستمر Skills المثبتة الأقدم في
الاحتفاظ بشروط التبعيات وتلميحات التثبيت الخاصة بها. يجب أن تستخدم
Skills الجديدة والمحدّثة `metadata.openclaw`.
</Note>

### ملاحظات حول sandboxing

- يتم التحقق من `requires.bins` على **المضيف** أثناء وقت تحميل Skill.
- إذا كان الوكيل داخل sandbox، فيجب أن يكون الملف الثنائي موجودًا أيضًا **داخل الحاوية**. قم بتثبيته عبر `agents.defaults.sandbox.docker.setupCommand` (أو عبر صورة مخصّصة). يعمل `setupCommand` مرة واحدة بعد إنشاء الحاوية. كما تتطلب عمليات تثبيت الحزم خروجًا شبكيًا، ونظام ملفات جذريًا قابلًا للكتابة، ومستخدم root داخل sandbox.
- مثال: تحتاج Skill ‏`summarize` ‏(`skills/summarize/SKILL.md`) إلى وجود CLI ‏`summarize` داخل حاوية sandbox لكي تعمل هناك.

### مواصفات التثبيت

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
  <Accordion title="قواعد اختيار أداة التثبيت">
    - إذا كانت هناك عدة أدوات تثبيت مدرجة، يختار Gateway خيارًا مفضّلًا واحدًا (brew عند توفره، وإلا node).
    - إذا كانت جميع أدوات التثبيت من نوع `download`، يعرض OpenClaw كل إدخال حتى تتمكن من رؤية الملفات المتاحة.
    - يمكن أن تتضمن مواصفات أدوات التثبيت `os: ["darwin"|"linux"|"win32"]` لتصفية الخيارات حسب المنصة.
    - تحترم تثبيتات Node القيمة `skills.install.nodeManager` في `openclaw.json` (الافتراضي: npm؛ الخيارات: npm/pnpm/yarn/bun). يؤثر هذا فقط في تثبيتات Skills؛ ويجب أن يظل وقت تشغيل Gateway هو Node — ولا يُنصح باستخدام Bun مع WhatsApp/Telegram.
    - يعتمد اختيار أداة التثبيت المدعوم من Gateway على التفضيل: عندما تمزج مواصفات التثبيت بين أنواع متعددة، يفضّل OpenClaw Homebrew عندما يكون `skills.install.preferBrew` مفعّلًا ويكون `brew` موجودًا، ثم `uv`، ثم مدير node المكوَّن، ثم البدائل الأخرى مثل `go` أو `download`.
    - إذا كانت كل مواصفات التثبيت من نوع `download`، يعرض OpenClaw جميع خيارات التنزيل بدلًا من اختزالها إلى أداة تثبيت مفضلة واحدة.
  </Accordion>
  <Accordion title="تفاصيل كل أداة تثبيت">
    - **تثبيتات Go:** إذا لم يكن `go` موجودًا وكان `brew` متاحًا، يقوم Gateway بتثبيت Go عبر Homebrew أولًا ويعيّن `GOBIN` إلى `bin` الخاص بـ Homebrew عند الإمكان.
    - **تثبيتات التنزيل:** `url` (مطلوب)، و`archive` (`tar.gz` | `tar.bz2` | `zip`)، و`extract` (الافتراضي: تلقائي عند اكتشاف أرشيف)، و`stripComponents`، و`targetDir` (الافتراضي: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
</AccordionGroup>

## تجاوزات التكوين

يمكن تبديل Skills المضمّنة والمُدارة وتزويدها بقيم env
تحت `skills.entries` في `~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // أو سلسلة نصية صريحة
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
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
  تؤدي القيمة `false` إلى تعطيل Skill حتى لو كانت مضمّنة أو مثبتة.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  تسهيل للـ Skills التي تعلن `metadata.openclaw.primaryEnv`. تدعم نصًا صريحًا أو SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  يتم حقنها فقط إذا لم يكن المتغيّر معيّنًا بالفعل في العملية.
</ParamField>
<ParamField path="config" type="object">
  كيس اختياري لحقول مخصصة لكل Skill. يجب أن تعيش المفاتيح المخصصة هنا.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  قائمة سماح اختيارية لـ Skills **المضمّنة** فقط. إذا تم تعيينها، تكون Skills المضمّنة المدرجة فقط مؤهلة (ولا تتأثر Skills المُدارة/Skills مساحة العمل).
</ParamField>

إذا كان اسم Skill يحتوي على شرطات، فضع المفتاح بين علامتي اقتباس (تسمح JSON5
بالمفاتيح المقتبسة). تتطابق مفاتيح التكوين مع **اسم Skill**
افتراضيًا — إذا كانت Skill تعرّف `metadata.openclaw.skillKey`، فاستخدم
ذلك المفتاح تحت `skills.entries`.

<Note>
بالنسبة إلى إنشاء/تعديل الصور القياسي داخل OpenClaw، استخدم
أداة `image_generate` الأساسية مع `agents.defaults.imageGenerationModel` بدلًا
من Skill مضمّنة. أمثلة Skills هنا مخصصة لسير العمل المخصص أو التابع لجهات خارجية.
ولتحليل الصور الأصلي استخدم أداة `image` مع
`agents.defaults.imageModel`. إذا اخترت `openai/*` أو `google/*` أو
`fal/*` أو أي نموذج صور خاص بموفّر آخر، فأضف أيضًا
مفتاح المصادقة/API الخاص بذلك الموفّر.
</Note>

## حقن البيئة

عند بدء تشغيل وكيل، يقوم OpenClaw بما يلي:

1. قراءة بيانات Skill الوصفية.
2. تطبيق `skills.entries.<key>.env` و`skills.entries.<key>.apiKey` على `process.env`.
3. بناء موجّه النظام باستخدام Skills **المؤهلة**.
4. استعادة البيئة الأصلية بعد انتهاء التشغيل.

يكون حقن البيئة **محصورًا في تشغيل الوكيل**، وليس بيئة shell
عالمية.

بالنسبة إلى الواجهة الخلفية المضمّنة `claude-cli`، يقوم OpenClaw أيضًا بتحويل
اللقطة snapshot المؤهلة نفسها إلى Plugin مؤقت لـ Claude Code ويمرّرها
مع `--plugin-dir`. يمكن عندها لـ Claude Code استخدام محلّل Skills الأصلي لديه بينما
يحتفظ OpenClaw بملكية الأولوية، وقوائم السماح لكل وكيل، والحظر، وحقن env/API key
ضمن `skills.entries.*`. أما الواجهات الخلفية الأخرى القائمة على CLI فتستخدم
كتالوج الموجّهات فقط.

## اللقطات snapshot والتحديث

يلتقط OpenClaw Snapshot للـ Skills المؤهلة **عند بدء الجلسة**
ويعيد استخدام تلك القائمة للأدوار اللاحقة ضمن الجلسة نفسها. تسري تغييرات
Skills أو التكوين في الجلسة الجديدة التالية.

يمكن تحديث Skills أثناء الجلسة في حالتين:

- يكون مراقب Skills مفعّلًا.
- تظهر Node بعيدة مؤهلة جديدة.

فكّر في هذا على أنه **إعادة تحميل ساخنة**: تُلتقط القائمة المحدّثة في
دور الوكيل التالي. إذا تغيّرت قائمة السماح الفعالة الخاصة بمهارات الوكيل لتلك
الجلسة، يقوم OpenClaw بتحديث اللقطة snapshot حتى تبقى Skills المرئية متوافقة
مع الوكيل الحالي.

### مراقب Skills

افتراضيًا، يراقب OpenClaw مجلدات Skills ويرفع لقطة snapshot الخاصة بالـ Skills
عندما تتغير ملفات `SKILL.md`. قم بالتكوين تحت `skills.load`:

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

### Nodes macOS البعيدة (Gateway على Linux)

إذا كان Gateway يعمل على Linux لكن **Node بنظام macOS** متصلة مع
السماح بـ `system.run` (وكانت إعدادات أمان Exec approvals ليست `deny`)،
يمكن لـ OpenClaw اعتبار Skills الخاصة بـ macOS فقط مؤهلة عندما تكون الملفات
الثنائية المطلوبة موجودة على تلك الـ Node. ينبغي على الوكيل تنفيذ هذه Skills
عبر أداة `exec` مع `host=node`.

يعتمد هذا على أن تقوم الـ Node بالإبلاغ عن دعم الأوامر الخاصة بها وعلى فحص الملفات الثنائية
عبر `system.which` أو `system.run`. الـ Nodes غير المتصلة **لا**
تجعل Skills البعيدة فقط مرئية. وإذا توقفت Node متصلة عن الرد على فحوصات
الملفات الثنائية، يمسح OpenClaw مطابقات الملفات الثنائية المخزّنة مؤقتًا حتى لا يرى الوكلاء
Skills لا يمكن تشغيلها حاليًا هناك.

## تأثير الرموز

عندما تكون Skills مؤهلة، يحقن OpenClaw قائمة XML مضغوطة بالـ Skills
المتاحة داخل موجّه النظام (عبر `formatSkillsForPrompt` في
`pi-coding-agent`). تكون التكلفة حتمية:

- **الحمل الأساسي** (فقط عند وجود ≥1 Skill): ‏195 حرفًا.
- **لكل Skill:** ‏97 حرفًا + طول القيم بعد تهريب XML لكل من `<name>` و`<description>` و`<location>`.

الصيغة (بالأحرف):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

يؤدي تهريب XML إلى توسيع `& < > " '` إلى كيانات (`&amp;` و`&lt;` وغيرها)،
مما يزيد الطول. تختلف أعداد الرموز حسب محلّل النموذج. وتقدير تقريبي
على نمط OpenAI هو نحو 4 أحرف/رمز، لذا فإن **97 حرفًا ≈ 24 رمزًا** لكل
Skill بالإضافة إلى الأطوال الفعلية لحقولك.

## دورة حياة Skills المُدارة

يشحن OpenClaw مجموعة أساسية من Skills بوصفها **Skills مضمّنة**
مع التثبيت (حزمة npm أو OpenClaw.app). يوجد `~/.openclaw/skills` من أجل
التجاوزات المحلية — مثلًا لتثبيت إصدار معيّن من Skill أو ترقيعها دون
تغيير النسخة المضمّنة. أما Skills مساحة العمل فهي مملوكة للمستخدم وتتجاوز
كليهما عند تعارض الأسماء.

## هل تبحث عن المزيد من Skills؟

تصفح [https://clawhub.ai](https://clawhub.ai). مخطط التكوين الكامل:
[تكوين Skills](/ar/tools/skills-config).

## ذو صلة

- [ClawHub](/ar/tools/clawhub) — سجل Skills العام
- [إنشاء Skills](/ar/tools/creating-skills) — بناء Skills مخصصة
- [Plugins](/ar/tools/plugin) — نظرة عامة على نظام Plugins
- [Plugin Skill Workshop](/ar/plugins/skill-workshop) — إنشاء Skills من عمل الوكيل
- [تكوين Skills](/ar/tools/skills-config) — مرجع تكوين Skills
- [أوامر الشرطة المائلة](/ar/tools/slash-commands) — جميع أوامر الشرطة المائلة المتاحة

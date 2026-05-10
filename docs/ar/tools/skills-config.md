---
read_when:
    - إضافة إعدادات Skills أو تعديلها
    - تعديل قائمة السماح المضمّنة أو سلوك التثبيت
summary: مخطط إعدادات Skills وأمثلة
title: تكوين Skills
x-i18n:
    generated_at: "2026-05-10T20:05:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7dad312d69c93544d8e7f9537fdd50f02345166ea629291160a30f19f0a8b340
    source_path: tools/skills-config.md
    workflow: 16
---

توجد معظم إعدادات تحميل/تثبيت Skills ضمن `skills` في
`~/.openclaw/openclaw.json`. وتوجد رؤية Skills الخاصة بالوكيل ضمن
`agents.defaults.skills` و`agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime still Node; bun not recommended)
      allowUploadedArchives: false,
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

لإنشاء/تحرير الصور المدمج، فضّل `agents.defaults.imageGenerationModel`
مع أداة `image_generate` الأساسية. يُستخدم `skills.entries.*` فقط لسير عمل Skills المخصصة أو التابعة
لجهات خارجية.

إذا اخترت مزود/نموذج صور محددًا، فاضبط أيضًا مفتاح المصادقة/API لذلك المزود.
أمثلة نموذجية: `GEMINI_API_KEY` أو `GOOGLE_API_KEY` لـ
`google/*`، و`OPENAI_API_KEY` لـ `openai/*`، و`FAL_KEY` لـ `fal/*`.

أمثلة:

- إعداد أصلي بنمط Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- إعداد أصلي لـ fal: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## قوائم سماح Skills للوكيل

استخدم إعدادات الوكيل عندما تريد جذور Skills نفسها للجهاز/مساحة العمل، لكن
مع مجموعة Skills مرئية مختلفة لكل وكيل.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits defaults -> github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

القواعد:

- `agents.defaults.skills`: قائمة سماح أساسية مشتركة للوكلاء الذين يحذفون
  `agents.list[].skills`.
- احذف `agents.defaults.skills` لترك Skills غير مقيدة افتراضيًا.
- `agents.list[].skills`: مجموعة Skills النهائية الصريحة لذلك الوكيل؛ لا
  تُدمج مع الإعدادات الافتراضية.
- `agents.list[].skills: []`: لا تعرض أي Skills لذلك الوكيل.

## الحقول

- تتضمن جذور Skills المدمجة دائمًا `~/.openclaw/skills` و`~/.agents/skills`
  و`<workspace>/.agents/skills` و`<workspace>/skills`.
- `allowBundled`: قائمة سماح اختيارية لـ Skills **المجمعة** فقط. عند ضبطها، تكون
  Skills المجمعة الموجودة في القائمة فقط مؤهلة (لا تتأثر Skills المُدارة أو الخاصة بالوكيل أو مساحة العمل).
- `load.extraDirs`: أدلة Skills إضافية للمسح (أدنى أسبقية).
- `load.allowSymlinkTargets`: أدلة أهداف حقيقية موثوقة يمكن لمجلدات
  Skills ذات الروابط الرمزية أن تُحل إليها حتى عندما يكون الرابط الرمزي خارج جذر
  ذلك الهدف. استخدم هذا لتخطيطات المستودعات الشقيقة المقصودة مثل
  `~/.agents/skills/manager -> ~/Projects/manager/skills`.
- `load.watch`: راقب مجلدات Skills وحدّث لقطة Skills (الافتراضي: true).
- `load.watchDebounceMs`: تأخير إزالة الارتداد لأحداث مراقب Skills بالميلي ثانية (الافتراضي: 250).
- `install.preferBrew`: فضّل مثبتات brew عند توفرها (الافتراضي: true).
- `install.nodeManager`: تفضيل مثبت node (`npm` | `pnpm` | `yarn` | `bun`، الافتراضي: npm).
  يؤثر هذا فقط في **تثبيتات Skills**؛ يجب أن يظل وقت تشغيل Gateway هو Node
  (لا يُوصى بـ Bun لـ WhatsApp/Telegram).
  - `openclaw setup --node-manager` أضيق نطاقًا ويقبل حاليًا `npm` أو
    `pnpm` أو `bun`. اضبط `skills.install.nodeManager: "yarn"` يدويًا إذا كنت
    تريد تثبيتات Skills مدعومة بـ Yarn.
- `install.allowUploadedArchives`: اسمح لعملاء Gateway الموثوقين من نوع `operator.admin`
  بتثبيت أرشيفات zip خاصة مُهيأة عبر `skills.upload.*`
  (الافتراضي: false). يفعّل هذا مسار الأرشيفات المرفوعة فقط؛ ولا تتطلب
  تثبيتات ClawHub العادية ذلك.
- `entries.<skillKey>`: تجاوزات لكل Skill.
- `agents.defaults.skills`: قائمة سماح Skills افتراضية اختيارية يرثها الوكلاء
  الذين يحذفون `agents.list[].skills`.
- `agents.list[].skills`: قائمة سماح Skills نهائية اختيارية لكل وكيل؛ تستبدل
  القوائم الصريحة الإعدادات الافتراضية الموروثة بدلًا من دمجها.

## المستودعات الشقيقة ذات الروابط الرمزية

افتراضيًا، يُعد كل جذر Skills حد احتواء. إذا كان مجلد Skill ضمن
`~/.agents/skills` رابطًا رمزيًا يُحل خارج `~/.agents/skills`،
يتخطاه OpenClaw ويسجل `Skipping escaped skill path outside its configured
root`.

احتفظ بتخطيط الرابط الرمزي واسمح فقط بجذر الهدف الموثوق:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

مع هذا الإعداد، يُقبل رابط رمزي مثل
`~/.agents/skills/manager -> ~/Projects/manager/skills` بعد
حل realpath. يمسح `extraDirs` أيضًا المستودع الشقيق مباشرة، بينما
يحافظ `allowSymlinkTargets` على المسار ذي الرابط الرمزي لتخطيطات Skills الخاصة بالوكلاء
القائمة. أبقِ إدخالات الأهداف ضيقة؛ لا تُشر إلى جذور واسعة مثل `~` أو
`~/Projects` إلا إذا كانت كل شجرة Skills تحت ذلك الجذر موثوقة.

حقول كل Skill:

- `enabled`: اضبطها على `false` لتعطيل Skill حتى إذا كانت مجمعة/مثبتة.
- `env`: متغيرات البيئة المحقونة لتشغيل الوكيل (فقط إذا لم تكن مضبوطة مسبقًا).
- `apiKey`: تسهيل اختياري لـ Skills التي تعلن متغير env أساسيًا.
  يدعم سلسلة نصية عادية أو كائن SecretRef (`{ source, provider, id }`).

## ملاحظات

- تُطابق المفاتيح ضمن `entries` اسم Skill افتراضيًا. إذا عرّفت Skill
  `metadata.openclaw.skillKey`، فاستخدم ذلك المفتاح بدلًا من ذلك.
- أسبقية التحميل هي `<workspace>/skills` ← `<workspace>/.agents/skills` ←
  `~/.agents/skills` ← `~/.openclaw/skills` ← Skills المجمعة ←
  `skills.load.extraDirs`.
- تُلتقط التغييرات على Skills في دورة الوكيل التالية عندما يكون المراقب مفعّلًا.

### Skills المعزولة ومتغيرات env

عندما تكون الجلسة **معزولة**، تعمل عمليات Skill داخل واجهة sandbox الخلفية المضبوطة. لا يرث sandbox `process.env` الخاص بالمضيف.

<Warning>
  تنطبق `env` العامة و`skills.entries.<skill>.env`/`apiKey` على تشغيلات **المضيف** فقط. داخل sandbox لا يكون لها أي تأثير، لذلك ستفشل Skill التي تعتمد على `GEMINI_API_KEY` برسالة `apiKey not configured` ما لم يُعطَ sandbox المتغير بشكل منفصل.
</Warning>

استخدم واحدًا من:

- `agents.defaults.sandbox.docker.env` لواجهة Docker الخلفية (أو `agents.list[].sandbox.docker.env` لكل وكيل).
- ادمج env في صورة sandbox المخصصة أو بيئة sandbox البعيدة.

## ذو صلة

<CardGroup cols={2}>
  <Card title="Skills" href="/ar/tools/skills" icon="puzzle-piece">
    ما هي Skills وكيف تُحمّل.
  </Card>
  <Card title="إنشاء Skills" href="/ar/tools/creating-skills" icon="hammer">
    تأليف حزم Skills مخصصة.
  </Card>
  <Card title="أوامر slash" href="/ar/tools/slash-commands" icon="terminal">
    كتالوج الأوامر الأصلي وتوجيهات الدردشة.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط `skills` و`agents.skills` الكامل.
  </Card>
</CardGroup>

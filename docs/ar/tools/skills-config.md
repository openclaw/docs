---
read_when:
    - إضافة تكوين Skills أو تعديله
    - ضبط قائمة السماح المضمّنة أو سلوك التثبيت
summary: مخطط تكوين Skills وأمثلة
title: إعدادات Skills
x-i18n:
    generated_at: "2026-05-06T08:18:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8996b3df73a9f0176b541c5d3f9670615f9a879a41838cf5d35d0a455e9f5088
    source_path: tools/skills-config.md
    workflow: 16
---

معظم إعدادات تحميل/تثبيت Skills موجودة ضمن `skills` في
`~/.openclaw/openclaw.json`. توجد إعدادات إظهار Skills الخاصة بكل وكيل ضمن
`agents.defaults.skills` و`agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime still Node; bun not recommended)
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

لإنشاء/تحرير الصور المدمج، يُفضّل استخدام `agents.defaults.imageGenerationModel`
مع أداة `image_generate` الأساسية. يُستخدم `skills.entries.*` فقط لتدفقات عمل Skills
المخصصة أو التابعة لجهات خارجية.

إذا اخترت مزوّد/نموذج صور محددًا، فاضبط أيضًا مفتاح المصادقة/API لذلك المزوّد.
أمثلة شائعة: `GEMINI_API_KEY` أو `GOOGLE_API_KEY` لـ
`google/*`، و`OPENAI_API_KEY` لـ `openai/*`، و`FAL_KEY` لـ `fal/*`.

أمثلة:

- إعداد أصلي بأسلوب Nano Banana Pro: `agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- إعداد fal أصلي: `agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## قوائم السماح بـ Skills للوكيل

استخدم إعدادات الوكيل عندما تريد جذور Skills نفسها للجهاز/مساحة العمل، لكن مع
مجموعة Skills مرئية مختلفة لكل وكيل.

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
- احذف `agents.defaults.skills` لترك Skills غير مقيّدة افتراضيًا.
- `agents.list[].skills`: مجموعة Skills نهائية صريحة لذلك الوكيل؛ لا تُدمج
  مع الإعدادات الافتراضية.
- `agents.list[].skills: []`: لا تعرض أي Skills لذلك الوكيل.

## الحقول

- تتضمن جذور Skills المدمجة دائمًا `~/.openclaw/skills` و`~/.agents/skills`
  و`<workspace>/.agents/skills` و`<workspace>/skills`.
- `allowBundled`: قائمة سماح اختيارية لـ Skills **المرفقة** فقط. عند ضبطها، تكون
  Skills المرفقة الموجودة في القائمة فقط مؤهلة (لا تتأثر Skills المُدارة، والخاصة بالوكيل، والخاصة بمساحة العمل).
- `load.extraDirs`: أدلة Skills إضافية لفحصها (أدنى أولوية).
- `load.watch`: راقب مجلدات Skills وحدّث لقطة Skills (الافتراضي: true).
- `load.watchDebounceMs`: مهلة إزالة الارتداد لأحداث مراقب Skills بالمللي ثانية (الافتراضي: 250).
- `install.preferBrew`: فضّل مثبّتات brew عند توفرها (الافتراضي: true).
- `install.nodeManager`: تفضيل مثبّت Node (`npm` | `pnpm` | `yarn` | `bun`، الافتراضي: npm).
  يؤثر هذا فقط في **تثبيت Skills**؛ يجب أن يظل وقت تشغيل Gateway هو Node
  (لا يُنصح باستخدام Bun مع WhatsApp/Telegram).
  - `openclaw setup --node-manager` أضيق نطاقًا ويقبل حاليًا `npm` أو
    `pnpm` أو `bun`. اضبط `skills.install.nodeManager: "yarn"` يدويًا إذا كنت
    تريد تثبيت Skills مدعومًا بـ Yarn.
- `entries.<skillKey>`: تجاوزات لكل Skill.
- `agents.defaults.skills`: قائمة سماح افتراضية اختيارية لـ Skills يرثها الوكلاء
  الذين يحذفون `agents.list[].skills`.
- `agents.list[].skills`: قائمة سماح نهائية اختيارية لكل وكيل لـ Skills؛ تستبدل
  القوائم الصريحة الإعدادات الافتراضية الموروثة بدلًا من دمجها.

حقول كل Skill:

- `enabled`: اضبطه على `false` لتعطيل Skill حتى لو كانت مرفقة/مثبتة.
- `env`: متغيرات البيئة المُحقنة لتشغيل الوكيل (فقط إذا لم تكن مضبوطة مسبقًا).
- `apiKey`: خيار ملائم اختياري لـ Skills التي تعلن متغير بيئة أساسيًا.
  يدعم سلسلة نصية صريحة أو كائن SecretRef (`{ source, provider, id }`).

## ملاحظات

- ترتبط المفاتيح ضمن `entries` باسم Skill افتراضيًا. إذا عرّفت Skill
  `metadata.openclaw.skillKey`، فاستخدم ذلك المفتاح بدلًا من ذلك.
- أولوية التحميل هي `<workspace>/skills` ← `<workspace>/.agents/skills` ←
  `~/.agents/skills` ← `~/.openclaw/skills` ← Skills المرفقة ←
  `skills.load.extraDirs`.
- تُلتقط التغييرات على Skills في دورة الوكيل التالية عندما يكون المراقب مفعّلًا.

### Skills المعزولة ومتغيرات البيئة

عندما تكون الجلسة **معزولة**، تعمل عمليات Skills داخل خلفية العزل المضبوطة. لا يرث العزل `process.env` الخاص بالمضيف.

<Warning>
  لا تنطبق `env` العامة و`skills.entries.<skill>.env`/`apiKey` إلا على تشغيلات **المضيف**. داخل العزل لا يكون لها أي تأثير، لذلك ستفشل أي Skill تعتمد على `GEMINI_API_KEY` مع `apiKey not configured` ما لم يُمنح العزل المتغير بشكل منفصل.
</Warning>

استخدم أحد الخيارات التالية:

- `agents.defaults.sandbox.docker.env` لخلفية Docker (أو `agents.list[].sandbox.docker.env` لكل وكيل).
- ادمج متغير البيئة في صورة العزل المخصصة لديك أو بيئة العزل البعيدة.

## ذو صلة

<CardGroup cols={2}>
  <Card title="Skills" href="/ar/tools/skills" icon="puzzle-piece">
    ما هي Skills وكيفية تحميلها.
  </Card>
  <Card title="Creating skills" href="/ar/tools/creating-skills" icon="hammer">
    تأليف حزم Skills مخصصة.
  </Card>
  <Card title="Slash commands" href="/ar/tools/slash-commands" icon="terminal">
    كتالوج الأوامر الأصلية وتوجيهات الدردشة.
  </Card>
  <Card title="Configuration reference" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط `skills` و`agents.skills` الكامل.
  </Card>
</CardGroup>

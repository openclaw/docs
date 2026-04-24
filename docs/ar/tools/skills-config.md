---
read_when:
    - إضافة تهيئة Skills أو تعديلها
    - ضبط allowlist المضمنة أو سلوك التثبيت
summary: مخطط تهيئة Skills وأمثلة
title: تهيئة Skills
x-i18n:
    generated_at: "2026-04-24T08:10:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d5e156adb9b88d7ade1976005c11faffe5107661e4f3da5d878cc0ac648bcbb
    source_path: tools/skills-config.md
    workflow: 15
---

توجد معظم إعدادات تحميل/تثبيت Skills ضمن `skills` في
`~/.openclaw/openclaw.json`. أما ظهور Skills الخاصة بكل وكيل فيوجد ضمن
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

بالنسبة إلى توليد/تحرير الصور المضمنين، ففضّل
`agents.defaults.imageGenerationModel` مع الأداة الأساسية `image_generate`.
أما `skills.entries.*` فهي مخصصة فقط لتدفقات العمل المخصصة أو الخاصة بـ Skills
التابعة لجهات خارجية.

إذا اخترت موفّر/نموذج صور محددًا، فاضبط أيضًا
المصادقة/مفتاح API الخاص بذلك الموفّر. ومن الأمثلة الشائعة: `GEMINI_API_KEY` أو `GOOGLE_API_KEY` لـ
`google/*`، و`OPENAI_API_KEY` لـ `openai/*`، و`FAL_KEY` لـ `fal/*`.

أمثلة:

- إعداد أصلي على نمط Nano Banana Pro: ‏`agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- إعداد fal أصلي: ‏`agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## قوائم السماح الخاصة بـ Skills لكل وكيل

استخدم تهيئة الوكيل عندما تريد الجذور نفسها لـ Skills على مستوى الجهاز/مساحة العمل، لكن
مع مجموعة Skills ظاهرة مختلفة لكل وكيل.

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

- `agents.defaults.skills`: allowlist أساسية مشتركة للوكلاء الذين يحذفون
  `agents.list[].skills`.
- احذف `agents.defaults.skills` لترك Skills غير مقيّدة افتراضيًا.
- `agents.list[].skills`: مجموعة Skills النهائية الصريحة لذلك الوكيل؛ وهي لا
  تندمج مع الإعدادات الافتراضية.
- `agents.list[].skills: []`: لا تعرض أي Skills لذلك الوكيل.

## الحقول

- تتضمن جذور Skills المضمنة دائمًا `~/.openclaw/skills` و`~/.agents/skills`،
  و`<workspace>/.agents/skills` و`<workspace>/skills`.
- `allowBundled`: allowlist اختيارية لـ **Skills المضمنة** فقط. وعند ضبطها، تكون
  Skills المضمنة الموجودة في القائمة فقط مؤهلة (ولا تتأثر Skills المُدارة أو Skills الوكيل أو Skills مساحة العمل).
- `load.extraDirs`: أدلة Skills إضافية للفحص (أدنى أولوية).
- `load.watch`: مراقبة مجلدات Skills وتحديث snapshot الخاص بـ Skills ‏(الافتراضي: true).
- `load.watchDebounceMs`: إزالة الارتداد لأحداث مراقب Skills بالميلي ثانية (الافتراضي: 250).
- `install.preferBrew`: تفضيل مثبّتات brew عند توفرها (الافتراضي: true).
- `install.nodeManager`: تفضيل مثبّت Node ‏(`npm` | `pnpm` | `yarn` | `bun`، الافتراضي: npm).
  وهذا يؤثر فقط في **تثبيتات Skills**؛ بينما ينبغي أن يظل Gateway runtime هو Node
  (ولا يُنصح بـ Bun مع WhatsApp/Telegram).
  - يكون `openclaw setup --node-manager` أضيق نطاقًا ويقبل حاليًا `npm`،
    و`pnpm`، أو `bun`. اضبط `skills.install.nodeManager: "yarn"` يدويًا إذا
    أردت تثبيتات Skills مدعومة بـ Yarn.
- `entries.<skillKey>`: تجاوزات لكل Skill.
- `agents.defaults.skills`: allowlist افتراضية اختيارية لـ Skills يرثها الوكلاء
  الذين يحذفون `agents.list[].skills`.
- `agents.list[].skills`: allowlist نهائية اختيارية لـ Skills لكل وكيل؛ إذ تستبدل
  القوائم الصريحة الإعدادات الافتراضية الموروثة بدلًا من الاندماج معها.

الحقول لكل Skill:

- `enabled`: اضبطه على `false` لتعطيل Skill حتى لو كانت مضمّنة/مثبّتة.
- `env`: متغيرات بيئة تُحقن أثناء تشغيل الوكيل (فقط إذا لم تكن مضبوطة بالفعل).
- `apiKey`: وسيلة ملائمة اختيارية لـ Skills التي تعلن عن متغير env أساسي.
  ويدعم سلسلة نصية صريحة أو كائن SecretRef ‏(`{ source, provider, id }`).

## ملاحظات

- تُربط المفاتيح ضمن `entries` باسم Skill افتراضيًا. وإذا كانت Skill تعرّف
  `metadata.openclaw.skillKey`، فاستخدم هذا المفتاح بدلًا من ذلك.
- ترتيب أولوية التحميل هو `<workspace>/skills` ← `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → Skills المضمنة →
  `skills.load.extraDirs`.
- تُلتقط التغييرات على Skills في الدور التالي للوكيل عندما تكون المراقبة مفعّلة.

### Skills ضمن sandbox + متغيرات env

عندما تكون الجلسة **ضمن sandbox**، تعمل عمليات Skill داخل
الواجهة الخلفية المهيأة لـ sandbox. ولا ترث sandbox متغير `process.env` الخاص بالمضيف.

استخدم أحد الخيارين التاليين:

- `agents.defaults.sandbox.docker.env` بالنسبة إلى الواجهة الخلفية Docker (أو `agents.list[].sandbox.docker.env` لكل وكيل)
- ضمّن env داخل صورة sandbox المخصصة لديك أو ضمن بيئة sandbox البعيدة

ينطبق `env` العام و`skills.entries.<skill>.env/apiKey` على عمليات **المضيف** فقط.

## ذو صلة

- [Skills](/ar/tools/skills)
- [إنشاء Skills](/ar/tools/creating-skills)
- [Slash commands](/ar/tools/slash-commands)

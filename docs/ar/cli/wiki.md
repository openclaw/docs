---
read_when:
    - تريد استخدام CLI الخاص بـ memory-wiki
    - أنت توثّق أو تغيّر `openclaw wiki`
summary: مرجع CLI لـ `openclaw wiki` (حالة خزانة memory-wiki، والبحث، والترجمة، والفحص، والتطبيق، والجسر، ومساعدات Obsidian)
title: ويكي
x-i18n:
    generated_at: "2026-06-27T17:26:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c6679a5aad41a19dbcad6075c190c3eb533e3ba13a6d5018d56988a23b2d9023
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

افحص وصُن خزنة `memory-wiki`.

يوفره Plugin المضمّن `memory-wiki`.

ذات صلة:

- [Plugin ويكي الذاكرة](/ar/plugins/memory-wiki)
- [نظرة عامة على الذاكرة](/ar/concepts/memory)
- [CLI: الذاكرة](/ar/cli/memory)

## الغرض منه

استخدم `openclaw wiki` عندما تريد خزنة معرفة مجمّعة تحتوي على:

- بحث وقراءة صفحات بطابع الويكي
- تركيبات غنية بالمصدرية
- تقارير التناقض والحداثة
- استيرادات جسر من Plugin الذاكرة النشطة
- مساعدات اختيارية لـ Obsidian CLI

## الأوامر الشائعة

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki okf import ./knowledge-catalog/okf/bundles/ga4
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki search "who should I ask about Teams?" --mode route-question
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha Summary" \
  --body "Short synthesis body" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Still active?"

openclaw wiki bridge import
openclaw wiki unsafe-local import

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## الأوامر

### `wiki status`

افحص وضع الخزنة الحالي، وسلامتها، وتوفر Obsidian CLI.

استخدم هذا أولاً عندما لا تكون متأكدًا مما إذا كانت الخزنة مهيّأة، أو ما إذا كان وضع الجسر
سليمًا، أو ما إذا كان تكامل Obsidian متاحًا.

عندما يكون وضع الجسر نشطًا ومهيأً لقراءة عناصر الذاكرة، فإن هذا الأمر
يستعلم Gateway قيد التشغيل بحيث يرى سياق Plugin الذاكرة النشطة نفسه كما تراه
ذاكرة الوكيل/وقت التشغيل.

### `wiki doctor`

شغّل فحوصات سلامة الويكي واعرض مشكلات التكوين أو الخزنة.

عندما يكون وضع الجسر نشطًا ومهيأً لقراءة عناصر الذاكرة، فإن هذا الأمر
يستعلم Gateway قيد التشغيل قبل بناء التقرير. تظل استيرادات الجسر المعطلة
وتكوينات الجسر التي لا تقرأ عناصر الذاكرة محلية/غير متصلة.

تشمل المشكلات النموذجية:

- تفعيل وضع الجسر دون عناصر ذاكرة عامة
- تخطيط خزنة غير صالح أو مفقود
- فقدان Obsidian CLI الخارجي عندما يكون وضع Obsidian متوقعًا

### `wiki init`

أنشئ تخطيط خزنة الويكي وصفحات البداية.

يهيئ هذا البنية الجذرية، بما في ذلك الفهارس عالية المستوى وأدلة
التخزين المؤقت.

### `wiki ingest <path-or-url>`

استورد المحتوى إلى طبقة مصدر الويكي.

ملاحظات:

- يتحكم `ingest.allowUrlIngest` في استيراد URL
- تحتفظ صفحات المصدر المستوردة بالمصدرية في frontmatter
- يمكن تشغيل التجميع التلقائي بعد الاستيراد عند تفعيله

### `wiki okf import <path>`

استورد حزمة Open Knowledge Format غير مضغوطة إلى صفحات مفاهيم الويكي.

يقرأ المستورِد كل مستند مفهوم `.md` غير محجوز في شجرة دليل OKF،
ويتطلب حقل `type` غير فارغ، ويتعامل مع قيم `type` غير المعروفة في OKF
كمفاهيم عامة. لا تُستورد ملفات OKF المحجوزة `index.md` و`log.md`
كمفاهيم.

تُسطّح الصفحات المستوردة تحت `concepts/` بحيث تراها فورًا تدفقات تجميع الويكي،
والبحث، والجلب، والملخص، ولوحة المعلومات الحالية. يُحفظ معرّف مفهوم OKF الأصلي،
و`type`، و`resource`، و`tags`، والطابع الزمني، ومسار المصدر، وfrontmatter الكامل
في frontmatter الصفحة. تُعاد كتابة روابط Markdown الداخلية في OKF إلى صفحات الويكي
المولدة؛ وتُترك الروابط المعطلة أو الخارجية دون تغيير.

أمثلة:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

أعد بناء الفهارس والكتل ذات الصلة ولوحات المعلومات والملخصات المجمّعة.

يكتب هذا عناصر مستقرة موجهة للآلة تحت:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

إذا كان `render.createDashboards` مفعّلًا، فإن التجميع يحدّث أيضًا صفحات التقارير.

### `wiki lint`

افحص الخزنة وأبلغ عن:

- مشكلات بنيوية
- فجوات المصدرية
- تناقضات
- أسئلة مفتوحة
- صفحات/ادعاءات منخفضة الثقة
- صفحات/ادعاءات قديمة

شغّل هذا بعد تحديثات ويكي ذات معنى.

### `wiki search <query>`

ابحث في محتوى الويكي.

يعتمد السلوك على التكوين:

- `search.backend`: `shared` أو `local`
- `search.corpus`: `wiki`، أو `memory`، أو `all`
- `--mode`: `auto`، أو `find-person`، أو `route-question`، أو `source-evidence`، أو
  `raw-claim`

استخدم `wiki search` عندما تريد ترتيبًا خاصًا بالويكي أو تفاصيل المصدرية.
لتمرير استدعاء مشترك واسع واحد، فضّل `openclaw memory search` عندما
يعرض Plugin الذاكرة النشطة البحث المشترك.

تساعد أوضاع البحث الوكيل على اختيار السطح الصحيح:

- `find-person`: الأسماء المستعارة، والمقابض، والحسابات الاجتماعية، والمعرّفات القانونية، وصفحات الأشخاص
- `route-question`: تلميحات مَن يُسأل/أفضل استخدام وسياق العلاقات
- `source-evidence`: صفحات المصدر وحقول الأدلة المنظمة
- `raw-claim`: نص الادعاء المنظم مع بيانات الادعاء/الدليل الوصفية

أمثلة:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

يتضمن إخراج النص أسطر `Claim:` و`Evidence:` عندما تطابق نتيجة
ادعاءً منظمًا. ويعرض إخراج JSON أيضًا `matchedClaimId`،
و`matchedClaimStatus`، و`matchedClaimConfidence`، و`evidenceKinds`، و
`evidenceSourceIds` للتنقيب من جهة الوكيل.

### `wiki get <lookup>`

اقرأ صفحة ويكي بواسطة المعرّف أو المسار النسبي.

أمثلة:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

طبّق تعديلات ضيقة دون جراحة حرة في الصفحة.

تشمل التدفقات المدعومة:

- إنشاء/تحديث صفحة تركيب
- تحديث بيانات الصفحة الوصفية
- إرفاق معرّفات المصدر
- إضافة أسئلة
- إضافة تناقضات
- تحديث الثقة/الحالة
- كتابة ادعاءات منظمة

يوجد هذا الأمر لكي يتطور الويكي بأمان دون تحرير الكتل المُدارة يدويًا.

### `wiki bridge import`

استورد عناصر الذاكرة العامة من Plugin الذاكرة النشطة إلى صفحات مصدر مدعومة بالجسر.

استخدم هذا في وضع `bridge` عندما تريد سحب أحدث عناصر الذاكرة المصدّرة
إلى خزنة الويكي.

لقراءات عناصر الجسر النشطة، يوجه CLI الاستيراد عبر Gateway RPC
بحيث يستخدم الاستيراد سياق Plugin ذاكرة وقت التشغيل. إذا كانت استيرادات الجسر
معطلة أو كانت قراءات العناصر متوقفة، يحافظ الأمر على سلوك عدم الاستيراد
المحلي/غير المتصل.

### `wiki unsafe-local import`

استورد من مسارات محلية مهيأة صراحةً في وضع `unsafe-local`.

هذا تجريبي عمدًا ومخصص للجهاز نفسه فقط.

### `wiki obsidian ...`

أوامر مساعدة لـ Obsidian للخزنات التي تعمل في وضع متوافق مع Obsidian.

الأوامر الفرعية:

- `status`
- `search`
- `open`
- `command`
- `daily`

تتطلب هذه الأوامر CLI الرسمي `obsidian` على `PATH` عندما يكون
`obsidian.useOfficialCli` مفعّلًا.

## إرشادات الاستخدام العملية

- استخدم `wiki search` + `wiki get` عندما تهم المصدرية وهوية الصفحة.
- استخدم `wiki apply` بدلًا من تحرير الأقسام المولدة المُدارة يدويًا.
- استخدم `wiki lint` قبل الوثوق بمحتوى متناقض أو منخفض الثقة.
- استخدم `wiki compile` بعد الاستيرادات الكبيرة أو تغييرات المصدر عندما تريد
  لوحات معلومات وملخصات مجمّعة حديثة فورًا.
- استخدم `wiki okf import` عندما يصدر كتالوج بيانات أو تصدير توثيق أو مسار
  إثراء وكيل بالفعل حزم OKF Markdown.
- استخدم `wiki bridge import` عندما يعتمد وضع الجسر على عناصر ذاكرة مصدّرة حديثًا.

## روابط التكوين

يتشكل سلوك `openclaw wiki` بواسطة:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

راجع [Plugin ويكي الذاكرة](/ar/plugins/memory-wiki) للاطلاع على نموذج التكوين الكامل.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [ويكي الذاكرة](/ar/plugins/memory-wiki)

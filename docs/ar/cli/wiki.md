---
read_when:
    - تريد استخدام CLI الخاص بـ memory-wiki
    - أنت توثّق أو تغيّر `openclaw wiki`
summary: مرجع CLI للأمر `openclaw wiki` (حالة خزنة memory-wiki والبحث والتجميع والتحقق والتطبيق والجسر واستيراد ChatGPT وأدوات Obsidian المساعدة)
title: ويكي
x-i18n:
    generated_at: "2026-07-12T05:45:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e817fdd101c3fbe8c3c2aa51ab6a5e8e3bc35ce61376e746b7fceb0b87d0154
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

افحص مخزن `memory-wiki` وصِنه. يوفّره Plugin ‏`memory-wiki` المضمّن.

ذو صلة: [Plugin ويكي الذاكرة](/ar/plugins/memory-wiki)، [نظرة عامة على الذاكرة](/ar/concepts/memory)، [CLI: الذاكرة](/ar/cli/memory)

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
openclaw wiki chatgpt import --export ./chatgpt-export --dry-run
openclaw wiki chatgpt rollback <run-id>

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## اختيار الوكيل

عندما تكون قيمة `plugins.entries.memory-wiki.config.vault.scope` هي `agent`، حدّد
المخزن باستخدام الخيار ذي المستوى الأعلى `--agent <id>`:

```bash
openclaw wiki --agent support status
openclaw wiki --agent support search "refund policy"
openclaw wiki --agent marketing ingest ./campaign-notes.md
```

في إعداد يضم عدة وكلاء مهيّئين، يكون `--agent` مطلوبًا لعمليات CLI
حتى لا يتمكن أي أمر من القراءة من مخزن افتراضي اعتباطي أو الكتابة إليه. إذا
كان هناك وكيل واحد فقط مهيّأ، يظل ذلك الوكيل هو الافتراضي. تفشل معرّفات الوكلاء
غير المعروفة قبل بدء عملية المخزن. لا يغيّر الخيار المسار المحدد
عندما تكون قيمة `vault.scope` هي `global`.

تتبع عملاء Gateway القاعدة نفسها: مرّر `agentId` في طلبات `wiki.*`
المدعومة بالمخزن ضمن إعداد متعدد الوكلاء ومحدّد النطاق حسب الوكيل. يُعد المعرّف
المفقود أو غير المعروف خطأً. تحمل أدوار الوكيل وأدوات الويكي وإضافات مجموعة
الذاكرة وملخصات المطالبات المجمّعة سياق وكيل وقت التشغيل النشط بالفعل.

## الأوامر

### `wiki status`

اعرض وضع المخزن ونطاقه والوكيل المحسوم وحالته الصحية ومدى توفر CLI الخاص بـ Obsidian. استخدم هذا الأمر أولًا للتحقق مما إذا كان المخزن المقصود قد هُيّئ، أو كان وضع الجسر سليمًا، أو كان تكامل Obsidian متاحًا.

عندما يكون وضع الجسر نشطًا ومهيّأً لقراءة عناصر الذاكرة، يستعلم هذا الأمر من Gateway قيد التشغيل لكي يرى سياق Plugin الذاكرة النشط نفسه الذي تراه ذاكرة الوكيل/وقت التشغيل.

### `wiki doctor`

شغّل فحوصات سلامة الويكي وأبلغ عن الإصلاحات القابلة للتنفيذ. يخرج برمز غير صفري عندما تكون الحالة غير سليمة.

عندما يكون وضع الجسر نشطًا ومهيّأً لقراءة عناصر الذاكرة، يستعلم هذا الأمر من Gateway قيد التشغيل قبل إنشاء التقرير. تظل عمليات استيراد الجسر المعطّلة وتهيئات الجسر التي لا تقرأ عناصر الذاكرة محلية/غير متصلة.

المشكلات المعتادة:

- تفعيل وضع الجسر من دون عناصر ذاكرة عامة
- تخطيط مخزن غير صالح أو مفقود
- غياب CLI الخارجي الخاص بـ Obsidian عندما يكون وضع Obsidian متوقعًا

### `wiki init`

أنشئ تخطيط مخزن الويكي وصفحات البداية، بما يشمل الفهارس ذات المستوى الأعلى وأدلة ذاكرة التخزين المؤقت.

### `wiki ingest <path>`

استورد ملف Markdown أو ملفًا نصيًا محليًا إلى مجلد `sources/` في الويكي بوصفه صفحة مصدر. يجب أن يكون `<path>` مسار ملف محليًا؛ ولا يتوفر حاليًا استيعاب من عنوان URL. يرفض الملفات الثنائية.

تحمل صفحات المصدر المستوردة بيانات مصدرية في الواجهة الأمامية (`sourceType: local-file` و`sourcePath` و`ingestedAt`). يعيد الاستيعاب دائمًا تجميع المخزن بعد ذلك.

العلامات: يتجاوز `--title <title>` عنوان المصدر (الافتراضي: مشتق من اسم الملف).

### `wiki okf import <path>`

استورد حزمة Open Knowledge Format مفكوكة إلى صفحات مفاهيم الويكي.

يقرأ المستورد كل مستند مفاهيم `.md` غير محجوز في شجرة دليل OKF، ويتطلب حقل `type` غير فارغ، ويعامل قيم `type` غير المعروفة في OKF بوصفها مفاهيم عامة. لا تُستورد ملفات OKF المحجوزة `index.md` و`log.md` بوصفها مفاهيم.

تُسطّح الصفحات المستوردة ضمن `concepts/` حتى تتمكن مسارات التجميع والبحث والجلب والملخص ولوحة المعلومات الحالية في الويكي من رؤيتها فورًا. يُحتفظ بمعرّف مفهوم OKF الأصلي و`type` و`resource` و`tags` والطابع الزمني ومسار المصدر والواجهة الأمامية كاملةً في الواجهة الأمامية للصفحة. تُعاد كتابة روابط Markdown الداخلية في OKF لتشير إلى صفحات الويكي المُنشأة؛ وتُترك الروابط المعطلة أو الخارجية من دون تغيير. تعيد عملية الاستيراد دائمًا تجميع المخزن بعد ذلك.

أمثلة:

```bash
openclaw wiki okf import ./bundles/ga4
openclaw wiki okf import ./bundles/ga4 --json
openclaw wiki search "BigQuery Table" --mode source-evidence --json
openclaw wiki get <path-from-json-result>
```

### `wiki compile`

أعِد بناء الفهارس والكتل ذات الصلة ولوحات المعلومات والملخصات المجمّعة. يكتب عناصر مستقرة موجّهة للآلة ضمن:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

إذا كان `render.createDashboards` مفعّلًا، فإن التجميع يحدّث صفحات التقارير أيضًا.

### `wiki lint`

دقّق المخزن واكتب تقريرًا يغطي:

- المشكلات الهيكلية (الروابط المعطلة، والمعرّفات المفقودة/المكررة، ونوع الصفحة أو عنوانها المفقود، والواجهة الأمامية غير الصالحة)
- فجوات المصدر (معرّفات المصدر المفقودة، وبيانات مصدر الاستيراد المفقودة)
- التناقضات (التناقضات المعلَّمة، والادعاءات المتعارضة)
- الأسئلة المفتوحة
- الصفحات والادعاءات منخفضة الثقة
- الصفحات والادعاءات القديمة

شغّل هذا بعد إجراء تحديثات جوهرية على الويكي.

### `wiki search <query>`

ابحث في محتوى الويكي. يعتمد السلوك على التهيئة:

- `search.backend`:‏ `shared` أو `local`
- `search.corpus`:‏ `wiki` أو `memory` أو `all`
- `--mode`:‏ `auto` أو `find-person` أو `route-question` أو `source-evidence` أو `raw-claim`

استخدم `wiki search` للحصول على ترتيب وبيانات مصدر خاصة بالويكي. ولإجراء عملية استرجاع مشتركة واسعة واحدة، فضّل `openclaw memory search` عندما يوفّر Plugin الذاكرة النشط بحثًا مشتركًا.

أوضاع البحث:

- `find-person`: الأسماء البديلة، والمعرّفات، وحسابات التواصل الاجتماعي، والمعرّفات الأساسية، وصفحات الأشخاص
- `route-question`: تلميحات الجهة التي ينبغي سؤالها/أفضل مجالات الاستخدام، وسياق العلاقات
- `source-evidence`: صفحات المصدر وحقول الأدلة المنظّمة
- `raw-claim`: نص الادعاء المنظّم مع بيانات الادعاء/الأدلة الوصفية

أمثلة:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

يتضمن الإخراج النصي سطري `Claim:` و`Evidence:` عندما تتطابق نتيجة مع ادعاء منظّم. ويعرض إخراج JSON أيضًا `matchedClaimId` و`matchedClaimStatus` و`matchedClaimConfidence` و`evidenceKinds` و`evidenceSourceIds` لتمكين الوكيل من التعمق في التفاصيل.

### `wiki get <lookup>`

اقرأ صفحة ويكي حسب المعرّف أو المسار النسبي.

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

طبّق تعديلات محدودة من دون إجراء جراحة حرة على الصفحة:

- `apply synthesis <title>`: أنشئ صفحة توليف أو حدّثها باستخدام متن ملخص مُدار
- `apply metadata <lookup>`: حدّث البيانات الوصفية في صفحة موجودة

يقبل كلاهما `--source-id` و`--contradiction` و`--question` (يمكن تكرار كل منها)، و`--confidence <n>` ‏(0-1)، و`--status <status>`. يقبل `apply metadata` أيضًا `--clear-confidence` لإزالة قيمة ثقة مخزنة. هذه هي الطريقة المدعومة لتطوير صفحات الويكي بحيث تظل الكتل المُنشأة والمُدارة سليمة.

### `wiki bridge import`

استورد عناصر الذاكرة العامة من Plugin الذاكرة النشط إلى صفحات مصدر مدعومة بالجسر. استخدم هذا في وضع `bridge` لسحب أحدث عناصر الذاكرة المصدّرة إلى مخزن الويكي.

بالنسبة إلى عمليات القراءة النشطة لعناصر الجسر، يوجّه CLI الاستيراد عبر RPC الخاص بـ Gateway حتى يستخدم سياق Plugin الذاكرة في وقت التشغيل. إذا كانت عمليات استيراد الجسر معطلة أو كانت قراءة العناصر متوقفة، يحتفظ الأمر بسلوك الاستيراد الصفري المحلي/غير المتصل. يخضع تحديث الفهرس بعد الاستيراد لإعداد `ingest.autoCompile`.

### `wiki unsafe-local import`

استورد من المسارات المحلية المهيّأة صراحةً (`unsafeLocal.paths`) في وضع `unsafe-local`. هذا الوضع تجريبي عمدًا ومخصص للجهاز نفسه فقط. يخضع تحديث الفهرس بعد الاستيراد لإعداد `ingest.autoCompile`.

### `wiki chatgpt import`

استورد عملية تصدير من ChatGPT إلى مسودات صفحات مصدر الويكي.

```bash
openclaw wiki chatgpt import --export ./chatgpt-export
openclaw wiki chatgpt import --export ./conversations.json --dry-run
```

| العلامة            | الافتراضي   | الوصف                                                          |
| ----------------- | ---------- | ------------------------------------------------------------- |
| `--export <path>` | (مطلوب)    | دليل تصدير ChatGPT أو مسار `conversations.json`.              |
| `--dry-run`       | `false`    | عاين أعداد العناصر المُنشأة/المحدّثة/المتخطاة من دون كتابة صفحات. |

تسجّل عملية الاستيراد غير التجريبية التي تغيّر أي صفحة معرّف تشغيل للاستيراد، يُطبع في الملخص ويكون مطلوبًا للتراجع.

### `wiki chatgpt rollback <run-id>`

تراجع عن تشغيل استيراد ChatGPT طُبّق سابقًا، بإزالة الصفحات التي أنشأها واستعادة الصفحات التي استبدلها. لا ينفّذ شيئًا (ويبلغ عن `alreadyRolledBack`) إذا كان قد تم التراجع عن التشغيل بالفعل.

### `wiki obsidian ...`

أوامر Obsidian المساعدة للمخازن التي تعمل في وضع متوافق مع Obsidian:‏ `status` و`search` و`open` و`command` و`daily`. تتطلب هذه الأوامر CLI الرسمي `obsidian` ضمن `PATH` عندما يكون `obsidian.useOfficialCli` مفعّلًا.

يرفض التحقق من صحة التهيئة القيمة `obsidian.useOfficialCli: true` عندما
تكون قيمة `vault.scope` هي `agent` لأن `obsidian.vaultName` إعداد عام واحد،
وليست تعيينًا لكل وكيل. يظل عرض Markdown المتوافق مع Obsidian
متاحًا.

## إرشادات الاستخدام العملية

- استخدم `wiki search` مع `wiki get` عندما تكون بيانات المصدر وهوية الصفحة مهمتين.
- استخدم `wiki apply` بدلًا من تحرير الأقسام المُنشأة والمُدارة يدويًا.
- استخدم `wiki lint` قبل الوثوق بمحتوى متناقض أو منخفض الثقة.
- استخدم `wiki compile` بعد عمليات الاستيراد المجمّعة أو تغييرات المصدر عندما تريد لوحات معلومات وملخصات مجمّعة محدثة فورًا.
- استخدم `wiki okf import` عندما يُنتج كتالوج بيانات أو تصدير وثائق أو مسار إثراء وكيل حزم Markdown بتنسيق OKF بالفعل.
- استخدم `wiki bridge import` عندما يعتمد وضع الجسر على عناصر ذاكرة مصدّرة حديثًا.

## ارتباطات التهيئة

يتشكّل سلوك `openclaw wiki` وفقًا لما يلي:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.vault.scope`
- `plugins.entries.memory-wiki.config.vault.path`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.ingest.autoCompile`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

راجع [Plugin ويكي الذاكرة](/ar/plugins/memory-wiki) للاطلاع على نموذج التهيئة الكامل.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [ويكي الذاكرة](/ar/plugins/memory-wiki)

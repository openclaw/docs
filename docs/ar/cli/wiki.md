---
read_when:
    - تريد استخدام CLI الخاص بـ memory-wiki
    - أنت توثق `openclaw wiki` أو تغيّره
summary: مرجع CLI لـ `openclaw wiki` (حالة خزينة memory-wiki، والبحث، وcompile، وlint، وapply، وbridge، ومساعدات Obsidian)
title: الويكي
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T07:36:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: c25f7046ef0c29ed74204a5349edc2aa20ce79a355f49211a0ba0df4a5e4db3a
    source_path: cli/wiki.md
    workflow: 15
---

# `openclaw wiki`

افحص خزينة `memory-wiki` وصُنها.

يوفّره Plugin المضمّن `memory-wiki`.

ذو صلة:

- [Plugin الذاكرة الويكي](/ar/plugins/memory-wiki)
- [نظرة عامة على الذاكرة](/ar/concepts/memory)
- [CLI: memory](/ar/cli/memory)

## الغرض منه

استخدم `openclaw wiki` عندما تريد خزينة معرفة مُجمّعة تتضمن:

- بحثًا أصليًا خاصًا بالويكي وقراءات للصفحات
- توليفات غنية بالمصدر
- تقارير عن التناقضات وحداثة المعلومات
- استيرادات bridge من Plugin الذاكرة النشط
- مساعدات CLI اختيارية لـ Obsidian

## أوامر شائعة

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
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

افحص وضع الخزينة الحالي، وسلامتها، وتوفر Obsidian CLI.

استخدم هذا أولًا عندما لا تكون متأكدًا مما إذا كانت الخزينة قد تمت تهيئتها، أو ما إذا كان وضع bridge
سليمًا، أو ما إذا كان تكامل Obsidian متاحًا.

### `wiki doctor`

شغّل فحوصات سلامة الويكي وأظهر مشكلات التهيئة أو الخزينة.

تشمل المشكلات النموذجية:

- تفعيل وضع bridge دون عناصر ذاكرة عامة
- تخطيط خزينة غير صالح أو مفقود
- غياب Obsidian CLI الخارجي عند توقع وضع Obsidian

### `wiki init`

أنشئ تخطيط خزينة الويكي وصفحات البداية.

يهيّئ هذا البنية الجذرية، بما في ذلك الفهارس العليا
ودلائل cache.

### `wiki ingest <path-or-url>`

استورد المحتوى إلى طبقة مصادر الويكي.

ملاحظات:

- يخضع الاستيراد من URL إلى `ingest.allowUrlIngest`
- تحتفظ صفحات المصادر المستوردة بالمصدر في frontmatter
- يمكن تشغيل compile تلقائيًا بعد الاستيراد عند تفعيله

### `wiki compile`

أعِد بناء الفهارس، والكتل ذات الصلة، ولوحات المعلومات، والملخصات المجمّعة.

يكتب هذا عناصر مستقرة موجهة للآلة تحت:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

إذا كانت `render.createDashboards` مفعّلة، فسيقوم compile أيضًا بتحديث صفحات التقارير.

### `wiki lint`

دقّق الخزينة وأبلغ عن:

- المشكلات البنيوية
- فجوات المصدر
- التناقضات
- الأسئلة المفتوحة
- الصفحات/الادعاءات منخفضة الثقة
- الصفحات/الادعاءات القديمة

شغّل هذا بعد التحديثات المهمة على الويكي.

### `wiki search <query>`

ابحث في محتوى الويكي.

يعتمد السلوك على التهيئة:

- `search.backend`: ‏`shared` أو `local`
- `search.corpus`: ‏`wiki` أو `memory` أو `all`

استخدم `wiki search` عندما تريد ترتيبًا خاصًا بالويكي أو تفاصيل عن المصدر.
وللحصول على مرور استدعاء مشترك واسع واحد، فضّل `openclaw memory search` عندما
يكشف Plugin الذاكرة النشط بحثًا مشتركًا.

### `wiki get <lookup>`

اقرأ صفحة ويكي حسب المعرّف أو المسار النسبي.

أمثلة:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

طبّق تغييرات ضيقة دون جراحة حرة على الصفحة.

تشمل التدفقات المدعومة:

- إنشاء/تحديث صفحة synthesis
- تحديث بيانات الصفحة الوصفية
- إرفاق معرّفات المصادر
- إضافة أسئلة
- إضافة تناقضات
- تحديث الثقة/الحالة
- كتابة claims منظّمة

يوجد هذا الأمر حتى تتطور الويكي بأمان من دون تحرير يدوي
للكتل المُدارة.

### `wiki bridge import`

استورد عناصر الذاكرة العامة من Plugin الذاكرة النشط إلى صفحات المصادر
المدعومة بـ bridge.

استخدم هذا في وضع `bridge` عندما تريد سحب أحدث عناصر الذاكرة المصدّرة
إلى خزينة الويكي.

### `wiki unsafe-local import`

استورد من مسارات محلية مهيأة صراحةً في وضع `unsafe-local`.

وهذا تجريبي عمدًا ويقتصر على الجهاز نفسه فقط.

### `wiki obsidian ...`

أوامر مساعدة Obsidian للخزائن التي تعمل في وضع متوافق مع Obsidian.

الأوامر الفرعية:

- `status`
- `search`
- `open`
- `command`
- `daily`

تتطلب هذه الأوامر وجود `obsidian` CLI الرسمي على `PATH` عندما
يكون `obsidian.useOfficialCli` مفعّلًا.

## إرشادات عملية للاستخدام

- استخدم `wiki search` + `wiki get` عندما تكون هوية الصفحة والمصدر مهمتين.
- استخدم `wiki apply` بدلًا من التحرير اليدوي للأقسام المُدارة والمولدة.
- استخدم `wiki lint` قبل الوثوق بالمحتوى المتناقض أو منخفض الثقة.
- استخدم `wiki compile` بعد الاستيرادات الجماعية أو تغييرات المصادر عندما تريد
  لوحات معلومات وملخصات مجمّعة حديثة فورًا.
- استخدم `wiki bridge import` عندما يعتمد وضع bridge على عناصر
  ذاكرة مُصدّرة حديثًا.

## الارتباطات مع التهيئة

يتشكل سلوك `openclaw wiki` بواسطة:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

راجع [Plugin الذاكرة الويكي](/ar/plugins/memory-wiki) للاطلاع على نموذج التهيئة الكامل.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [الذاكرة الويكي](/ar/plugins/memory-wiki)

---
read_when:
    - تريد استخدام CLI الخاص بـ memory-wiki
    - أنت توثّق أو تعدّل `openclaw wiki`
summary: مرجع CLI لـ `openclaw wiki` (حالة خزنة memory-wiki، والبحث، والتجميع، والتدقيق، والتطبيق، والجسر، ومساعدات Obsidian)
title: ويكي
x-i18n:
    generated_at: "2026-04-30T07:50:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67fe56c9bff7b24570f890733314857dd261fca8233051681a83c171656ff27d
    source_path: cli/wiki.md
    workflow: 16
---

# `openclaw wiki`

افحص خزنة `memory-wiki` وصُنها.

يوفرها Plugin المضمّن `memory-wiki`.

ذات صلة:

- [Plugin ويكي الذاكرة](/ar/plugins/memory-wiki)
- [نظرة عامة على الذاكرة](/ar/concepts/memory)
- [CLI: الذاكرة](/ar/cli/memory)

## ما الغرض منه

استخدم `openclaw wiki` عندما تريد خزنة معرفة مجمّعة تتضمن:

- بحثًا أصليًا للويكي وقراءة الصفحات
- تركيبات غنية بالمصدرية
- تقارير التعارض والحداثة
- عمليات استيراد جسرية من Plugin الذاكرة النشطة
- أدوات مساعدة اختيارية لـ CLI الخاص بـ Obsidian

## الأوامر الشائعة

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
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

افحص وضع الخزنة الحالي وصحتها وتوفر CLI الخاص بـ Obsidian.

استخدم هذا أولًا عندما لا تكون متأكدًا مما إذا كانت الخزنة مهيأة، أو وضع الجسر
سليمًا، أو تكامل Obsidian متاحًا.

عندما يكون وضع الجسر نشطًا ومهيأً لقراءة عناصر الذاكرة، يستعلم هذا الأمر من
Gateway الجاري تشغيله لكي يرى سياق Plugin الذاكرة النشطة نفسه مثل
ذاكرة الوكيل/وقت التشغيل.

### `wiki doctor`

شغّل فحوصات صحة الويكي واعرض مشكلات التهيئة أو الخزنة.

عندما يكون وضع الجسر نشطًا ومهيأً لقراءة عناصر الذاكرة، يستعلم هذا الأمر من
Gateway الجاري تشغيله قبل بناء التقرير. تبقى عمليات استيراد الجسر المعطلة
وتهيئات الجسر التي لا تقرأ عناصر الذاكرة محلية/غير متصلة.

تشمل المشكلات المعتادة:

- تفعيل وضع الجسر دون عناصر ذاكرة عامة
- تخطيط خزنة غير صالح أو مفقود
- غياب CLI الخارجي لـ Obsidian عندما يكون وضع Obsidian متوقعًا

### `wiki init`

أنشئ تخطيط خزنة الويكي وصفحات البداية.

يهيئ هذا البنية الجذرية، بما في ذلك الفهارس العليا ومجلدات التخزين المؤقت.

### `wiki ingest <path-or-url>`

استورد المحتوى إلى طبقة مصادر الويكي.

ملاحظات:

- يتحكم `ingest.allowUrlIngest` في استيراد URL
- تحتفظ صفحات المصادر المستوردة بالمصدرية في الواجهة الأمامية
- يمكن أن يعمل التجميع التلقائي بعد الاستيراد عند تفعيله

### `wiki compile`

أعد بناء الفهارس والكتل ذات الصلة ولوحات المعلومات والملخصات المجمّعة.

يكتب هذا عناصر مستقرة موجهة للآلة ضمن:

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

إذا كان `render.createDashboards` مفعّلًا، يحدّث التجميع أيضًا صفحات التقارير.

### `wiki lint`

افحص الخزنة وأبلغ عن:

- مشكلات بنيوية
- فجوات في المصدرية
- التعارضات
- الأسئلة المفتوحة
- الصفحات/الادعاءات منخفضة الثقة
- الصفحات/الادعاءات القديمة

شغّل هذا بعد تحديثات مهمة على الويكي.

### `wiki search <query>`

ابحث في محتوى الويكي.

يعتمد السلوك على التهيئة:

- `search.backend`: `shared` أو `local`
- `search.corpus`: `wiki` أو `memory` أو `all`
- `--mode`: `auto` أو `find-person` أو `route-question` أو `source-evidence` أو
  `raw-claim`

استخدم `wiki search` عندما تريد ترتيبًا خاصًا بالويكي أو تفاصيل مصدرية.
لإجراء استرجاع مشترك واسع واحد، فضّل `openclaw memory search` عندما يوفّر
Plugin الذاكرة النشطة بحثًا مشتركًا.

تساعد أوضاع البحث الوكيل في اختيار السطح الصحيح:

- `find-person`: الأسماء البديلة والمعرّفات الاجتماعية ومعرفات الوسائط والمعرفات القياسية وصفحات الأشخاص
- `route-question`: تلميحات مَن تسأل/أفضل استخدام وسياق العلاقات
- `source-evidence`: صفحات المصادر وحقول الأدلة المنظمة
- `raw-claim`: نص ادعاء منظم مع بيانات تعريف الادعاء/الدليل

أمثلة:

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

يتضمن إخراج النص أسطر `Claim:` و`Evidence:` عندما تطابق نتيجة ما ادعاءً
منظمًا. يعرض إخراج JSON أيضًا `matchedClaimId` و`matchedClaimStatus`
و`matchedClaimConfidence` و`evidenceKinds` و`evidenceSourceIds` للتعمق من جهة الوكيل.

### `wiki get <lookup>`

اقرأ صفحة ويكي حسب المعرف أو المسار النسبي.

أمثلة:

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

طبّق تعديلات ضيقة دون جراحة صفحات حرة الصياغة.

تشمل التدفقات المدعومة:

- إنشاء/تحديث صفحة تركيب
- تحديث بيانات تعريف الصفحة
- إرفاق معرفات المصادر
- إضافة أسئلة
- إضافة تعارضات
- تحديث الثقة/الحالة
- كتابة ادعاءات منظمة

يوجد هذا الأمر لكي يتمكن الويكي من التطور بأمان دون تحرير الكتل المُدارة يدويًا.

### `wiki bridge import`

استورد عناصر الذاكرة العامة من Plugin الذاكرة النشطة إلى صفحات مصادر مدعومة بالجسر.

استخدم هذا في وضع `bridge` عندما تريد سحب أحدث عناصر الذاكرة المصدّرة
إلى خزنة الويكي.

لقراءات عناصر الجسر النشطة، يوجّه CLI الاستيراد عبر Gateway RPC لكي يستخدم
الاستيراد سياق Plugin الذاكرة في وقت التشغيل. إذا كانت عمليات استيراد الجسر
معطلة أو قراءات العناصر متوقفة، يحافظ الأمر على سلوك الاستيراد الصفري
المحلي/غير المتصل.

### `wiki unsafe-local import`

استورد من مسارات محلية مهيأة صراحة في وضع `unsafe-local`.

هذا تجريبي عمدًا ومخصص للجهاز نفسه فقط.

### `wiki obsidian ...`

أوامر مساعدة لـ Obsidian للخزنات العاملة في وضع ملائم لـ Obsidian.

الأوامر الفرعية:

- `status`
- `search`
- `open`
- `command`
- `daily`

تتطلب هذه الأوامر CLI الرسمي `obsidian` على `PATH` عندما يكون
`obsidian.useOfficialCli` مفعّلًا.

## إرشادات الاستخدام العملية

- استخدم `wiki search` + `wiki get` عندما تكون المصدرية وهوية الصفحة مهمتين.
- استخدم `wiki apply` بدلًا من التحرير اليدوي للأقسام المُدارة والمولدة.
- استخدم `wiki lint` قبل الثقة بمحتوى متعارض أو منخفض الثقة.
- استخدم `wiki compile` بعد عمليات الاستيراد الضخمة أو تغييرات المصادر عندما تريد
  لوحات معلومات وملخصات مجمّعة حديثة فورًا.
- استخدم `wiki bridge import` عندما يعتمد وضع الجسر على عناصر ذاكرة مصدّرة حديثًا.

## روابط التهيئة

يتشكل سلوك `openclaw wiki` بواسطة:

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

راجع [Plugin ويكي الذاكرة](/ar/plugins/memory-wiki) للاطلاع على نموذج التهيئة الكامل.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [ويكي الذاكرة](/ar/plugins/memory-wiki)

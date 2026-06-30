---
read_when:
    - تريد فهرسة الذاكرة الدلالية أو البحث فيها
    - تقوم بتصحيح أخطاء توفر الذاكرة أو الفهرسة
    - تريد ترقية الذاكرة قصيرة المدى المستدعاة إلى `MEMORY.md`
summary: مرجع CLI لـ `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: الذاكرة
x-i18n:
    generated_at: "2026-06-30T14:03:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74b85d7299cc12e6133a10678f7c8fe17ee704e029993aebea417727ba94e629
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

إدارة فهرسة الذاكرة الدلالية والبحث فيها.
يوفرها Plugin المضمّن `memory-core`. يكون الأمر متاحًا عندما يحدد
`plugins.slots.memory` القيمة `memory-core` (الافتراضي)؛ وتعرض Plugins الذاكرة الأخرى
مساحات أسماء CLI الخاصة بها.

ذات صلة:

- مفهوم الذاكرة: [الذاكرة](/ar/concepts/memory)
- ويكي الذاكرة: [ويكي الذاكرة](/ar/plugins/memory-wiki)
- CLI الويكي: [wiki](/ar/cli/wiki)
- Plugins: [Plugins](/ar/tools/plugin)

## أمثلة

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory status --fix
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory promote --limit 10 --min-score 0.75
openclaw memory promote --apply
openclaw memory promote --json --min-recall-count 0 --min-unique-queries 0
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
openclaw memory rem-harness
openclaw memory rem-harness --json
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## الخيارات

`memory status` و`memory index`:

- `--agent <id>`: حصر النطاق في وكيل واحد. من دونه، تعمل هذه الأوامر لكل وكيل مُكوَّن؛ وإذا لم تكن قائمة الوكلاء مُكوَّنة، فإنها تعود إلى الوكيل الافتراضي.
- `--verbose`: إخراج سجلات تفصيلية أثناء الفحوصات والفهرسة.

`memory status`:

- `--deep`: فحص جاهزية مخزن المتجهات المحلي، وجاهزية موفر التضمينات، وجاهزية البحث الدلالي بالمتجهات. يبقى `memory status` العادي سريعًا ولا يشغّل عمل تضمين مباشر أو اكتشاف موفرين؛ وتعني حالة مخزن المتجهات أو المتجه الدلالي غير المعروفة أنها لم تُفحص في ذلك الأمر. يتجاوز QMD lexical `searchMode: "search"` فحوصات المتجهات الدلالية وصيانة التضمينات حتى مع `--deep`.
- `--index`: تشغيل إعادة فهرسة إذا كان المخزن متسخًا (يتضمن `--deep`).
- `--fix`: إصلاح أقفال الاستدعاء القديمة وتطبيع بيانات تعريف الترويج.
- `--json`: طباعة مخرجات JSON.

إذا عرض `memory status` الحالة `Dreaming status: blocked`، فهذا يعني أن Cron المُدار لـ Dreaming مفعّل لكن Heartbeat الذي يشغّله لا يعمل للوكيل الافتراضي. راجع [Dreaming لا يعمل أبدًا](/ar/concepts/dreaming#dreaming-never-runs-status-shows-blocked) لمعرفة السببين الشائعين.

`memory index`:

- `--force`: فرض إعادة فهرسة كاملة.

`memory search`:

- إدخال الاستعلام: مرّر إما `[query]` موضعيًا أو `--query <text>`.
- إذا قُدّما معًا، تكون الأولوية لـ `--query`.
- إذا لم يُقدَّم أي منهما، يخرج الأمر بخطأ.
- `--agent <id>`: حصر النطاق في وكيل واحد (الافتراضي: الوكيل الافتراضي).
- `--max-results <n>`: تحديد عدد النتائج المُعادة.
- `--min-score <n>`: تصفية المطابقات ذات الدرجات المنخفضة.
- `--json`: طباعة نتائج JSON.

`memory promote`:

معاينة ترقيات الذاكرة قصيرة الأمد وتطبيقها.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- كتابة الترقيات إلى `MEMORY.md` (الافتراضي: معاينة فقط).
- `--limit <n>` -- تحديد الحد الأقصى لعدد المرشحين المعروضين.
- `--include-promoted` -- تضمين الإدخالات التي رُقّيت بالفعل في الدورات السابقة.

الخيارات الكاملة:

- يرتّب المرشحين قصيري الأمد من `memory/YYYY-MM-DD.md` باستخدام إشارات ترويج موزونة (`frequency`، `relevance`، `query diversity`، `recency`، `consolidation`، `conceptual richness`).
- يستخدم إشارات قصيرة الأمد من استدعاءات الذاكرة ومرورات الإدخال اليومية، إضافة إلى إشارات التعزيز في مرحلتي light/REM.
- عند تفعيل Dreaming، يدير `memory-core` تلقائيًا مهمة Cron واحدة تُشغّل مسحًا كاملًا (`light -> REM -> deep`) في الخلفية (لا يلزم تنفيذ `openclaw cron add` يدويًا).
- `--agent <id>`: حصر النطاق في وكيل واحد (الافتراضي: الوكيل الافتراضي).
- `--limit <n>`: الحد الأقصى للمرشحين المطلوب إرجاعهم/تطبيقهم.
- `--min-score <n>`: الحد الأدنى لدرجة الترويج الموزونة.
- `--min-recall-count <n>`: الحد الأدنى المطلوب لعدد الاستدعاءات للمرشح.
- `--min-unique-queries <n>`: الحد الأدنى المطلوب لعدد الاستعلامات المميزة للمرشح.
- `--apply`: إلحاق المرشحين المحددين في `MEMORY.md` ووضع علامة أنهم رُقّوا.
- `--include-promoted`: تضمين المرشحين الذين رُقّوا بالفعل في المخرجات.
- `--json`: طباعة مخرجات JSON.

`memory promote-explain`:

شرح مرشح ترويج محدد وتفصيل درجته.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: مفتاح المرشح، أو جزء من المسار، أو جزء من مقتطف للبحث عنه.
- `--agent <id>`: حصر النطاق في وكيل واحد (الافتراضي: الوكيل الافتراضي).
- `--include-promoted`: تضمين المرشحين الذين رُقّوا بالفعل.
- `--json`: طباعة مخرجات JSON.

`memory rem-harness`:

معاينة تأملات REM، والحقائق المرشحة، ومخرجات الترويج العميق من دون كتابة أي شيء.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: حصر النطاق في وكيل واحد (الافتراضي: الوكيل الافتراضي).
- `--include-promoted`: تضمين المرشحين العميقين الذين رُقّوا بالفعل.
- `--json`: طباعة مخرجات JSON.

## Dreaming

Dreaming هو نظام توحيد الذاكرة في الخلفية بثلاث مراحل متعاونة:
**light** (فرز/تجهيز المواد قصيرة الأمد)، و**deep** (ترقية الحقائق الدائمة
إلى `MEMORY.md`)، و**REM** (التأمل وإبراز الموضوعات).

- فعّله باستخدام `plugins.entries.memory-core.config.dreaming.enabled: true`.
- بدّله من المحادثة باستخدام `/dreaming on|off` (أو افحصه باستخدام `/dreaming status`).
  يجب أن يكون مستدعو القناة مالكين لتغيير الإعداد؛ ويحتاج عملاء Gateway إلى
  `operator.admin`. تظل حالة القراءة فقط والمساعدة متاحتين لمرسلي الأوامر
  المخولين.
- يعمل Dreaming على جدول مسح مُدار واحد (`dreaming.frequency`) وينفّذ المراحل بالترتيب: light، REM، deep.
- مرحلة deep فقط هي التي تكتب الذاكرة الدائمة إلى `MEMORY.md`.
- تُكتب مخرجات المراحل المقروءة بشريًا وإدخالات اليوميات إلى `DREAMS.md` (أو `dreams.md` الموجود)، مع تقارير اختيارية لكل مرحلة في `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- يستخدم الترتيب إشارات موزونة: تكرار الاستدعاء، صلة الاسترجاع، تنوع الاستعلامات، الحداثة الزمنية، التوحيد عبر الأيام، وثراء المفاهيم المشتق.
- يعيد الترويج قراءة الملاحظة اليومية الحية قبل الكتابة إلى `MEMORY.md`، لذلك لا تُرقّى المقتطفات قصيرة الأمد التي عُدّلت أو حُذفت من لقطات قديمة لمخزن الاستدعاء.
- تشترك عمليات `memory promote` المجدولة واليدوية في الإعدادات الافتراضية نفسها لمرحلة deep ما لم تمرر تجاوزات عتبات عبر CLI.
- تتوسع العمليات التلقائية عبر مساحات عمل الذاكرة المُكوَّنة.

الجدولة الافتراضية:

- **وتيرة المسح**: `dreaming.frequency = 0 3 * * *`
- **عتبات deep**: `minScore=0.8`، `minRecallCount=3`، `minUniqueQueries=3`، `recencyHalfLifeDays=14`، `maxAgeDays=30`

مثال:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

ملاحظات:

- يطبع `memory index --verbose` تفاصيل لكل مرحلة (الموفر، النموذج، المصادر، نشاط الدُفعات).
- يتضمن `memory status` أي مسارات إضافية مُكوَّنة عبر `memorySearch.extraPaths`.
- إذا كانت حقول مفاتيح واجهة API البعيدة لـ Active Memory الفعالة مُكوَّنة كـ SecretRefs، فإن الأمر يحل تلك القيم من لقطة Gateway النشطة. إذا كان Gateway غير متاح، يفشل الأمر بسرعة.
- ملاحظة انحراف إصدار Gateway: يتطلب مسار الأمر هذا Gateway يدعم `secrets.resolve`؛ وتعيد Gateways الأقدم خطأ طريقة غير معروفة.
- اضبط وتيرة المسح المجدول باستخدام `dreaming.frequency`. بخلاف ذلك، تكون سياسة الترويج العميق داخلية باستثناء `dreaming.phases.deep.maxPromotedSnippetTokens`، الذي يحد طول المقتطف المُرقّى مع إبقاء الأصل ظاهرًا. استخدم علامات CLI في `memory promote` عندما تحتاج إلى تجاوزات عتبات يدوية لمرة واحدة.
- يعاين `memory rem-harness --path <file-or-dir> --grounded` عناصر `What Happened` و`Reflections` و`Possible Lasting Updates` المؤسَّسة من الملاحظات اليومية التاريخية من دون كتابة أي شيء.
- يكتب `memory rem-backfill --path <file-or-dir>` إدخالات يوميات مؤسَّسة وقابلة للعكس في `DREAMS.md` لمراجعة واجهة المستخدم.
- يقوم `memory rem-backfill --path <file-or-dir> --stage-short-term` أيضًا بزرع مرشحين دائمين مؤسَّسين في مخزن الترويج قصير الأمد الحي حتى تتمكن مرحلة deep العادية من ترتيبهم.
- يزيل `memory rem-backfill --rollback` إدخالات اليوميات المؤسَّسة المكتوبة سابقًا، ويزيل `memory rem-backfill --rollback-short-term` المرشحين المؤسَّسين قصيري الأمد الذين جرى تجهيزهم سابقًا.
- راجع [Dreaming](/ar/concepts/dreaming) للاطلاع على أوصاف المراحل الكاملة ومرجع التكوين.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [نظرة عامة على الذاكرة](/ar/concepts/memory)

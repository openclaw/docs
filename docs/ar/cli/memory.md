---
read_when:
    - تريد فهرسة الذاكرة الدلالية أو البحث فيها
    - أنت تستكشف أخطاء توفر الذاكرة أو الفهرسة
    - تريد ترقية الذاكرة قصيرة المدى المسترجعة إلى `MEMORY.md`
summary: مرجع CLI لـ `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: الذاكرة
x-i18n:
    generated_at: "2026-04-30T07:48:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53301e82d4ebe72b161b3a58078e7b75b9e499bc55cbceec5032c7e410619bd4
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

إدارة فهرسة الذاكرة الدلالية والبحث فيها.
يوفره Plugin الذاكرة النشطة (الافتراضي: `memory-core`؛ عيّن `plugins.slots.memory = "none"` للتعطيل).

ذات صلة:

- مفهوم الذاكرة: [الذاكرة](/ar/concepts/memory)
- ويكي الذاكرة: [ويكي الذاكرة](/ar/plugins/memory-wiki)
- Wiki CLI: [wiki](/ar/cli/wiki)
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

- `--agent <id>`: حصر النطاق في وكيل واحد. بدونه، تعمل هذه الأوامر لكل وكيل مكوّن؛ وإذا لم تكن قائمة الوكلاء مكوّنة، فإنها تعود إلى الوكيل الافتراضي.
- `--verbose`: إصدار سجلات مفصلة أثناء الفحوصات والفهرسة.

`memory status`:

- `--deep`: فحص توفر المتجه + التضمين. يبقى `memory status` العادي سريعًا ولا يشغّل اختبار تضمين حيًا. يتخطى البحث المعجمي QMD ‏`searchMode: "search"` فحوصات المتجه الدلالي وصيانة التضمينات حتى مع `--deep`.
- `--index`: تشغيل إعادة فهرسة إذا كان المخزن متسخًا (يتضمن `--deep`).
- `--fix`: إصلاح أقفال الاستدعاء القديمة وتطبيع بيانات الترويج الوصفية.
- `--json`: طباعة مخرجات JSON.

إذا أظهر `memory status` الحالة `Dreaming status: blocked`، فهذا يعني أن Cron المدار الخاص بـ Dreaming مفعّل لكن Heartbeat الذي يشغّله لا يعمل للوكيل الافتراضي. راجع [Dreaming لا يعمل أبدًا](/ar/concepts/dreaming#dreaming-never-runs-status-shows-blocked) لمعرفة السببين الشائعين.

`memory index`:

- `--force`: فرض إعادة فهرسة كاملة.

`memory search`:

- إدخال الاستعلام: مرّر إما `[query]` موضعيًا أو `--query <text>`.
- إذا تم توفير كليهما، فسيكون لـ`--query` الأسبقية.
- إذا لم يتم توفير أي منهما، يخرج الأمر بخطأ.
- `--agent <id>`: حصر النطاق في وكيل واحد (الافتراضي: الوكيل الافتراضي).
- `--max-results <n>`: تقييد عدد النتائج المُعادة.
- `--min-score <n>`: تصفية المطابقات ذات الدرجة المنخفضة.
- `--json`: طباعة نتائج JSON.

`memory promote`:

معاينة ترقيات الذاكرة قصيرة المدى وتطبيقها.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- كتابة الترقيات إلى `MEMORY.md` (الافتراضي: المعاينة فقط).
- `--limit <n>` -- تحديد الحد الأقصى لعدد المرشحين المعروضين.
- `--include-promoted` -- تضمين الإدخالات التي تمت ترقيتها بالفعل في الدورات السابقة.

الخيارات الكاملة:

- يرتّب المرشحين قصيري المدى من `memory/YYYY-MM-DD.md` باستخدام إشارات ترقية موزونة (`frequency`، `relevance`، `query diversity`، `recency`، `consolidation`، `conceptual richness`).
- يستخدم إشارات قصيرة المدى من كل من استدعاءات الذاكرة وعمليات الاستيعاب اليومية، إضافة إلى إشارات تعزيز مرحلة light/REM.
- عند تفعيل Dreaming، يدير `memory-core` تلقائيًا مهمة Cron واحدة تشغّل مسحًا كاملًا (`light -> REM -> deep`) في الخلفية (لا يلزم تنفيذ `openclaw cron add` يدويًا).
- `--agent <id>`: حصر النطاق في وكيل واحد (الافتراضي: الوكيل الافتراضي).
- `--limit <n>`: الحد الأقصى للمرشحين المراد إرجاعهم/تطبيقهم.
- `--min-score <n>`: الحد الأدنى لدرجة الترقية الموزونة.
- `--min-recall-count <n>`: الحد الأدنى لعدد الاستدعاءات المطلوب للمرشح.
- `--min-unique-queries <n>`: الحد الأدنى لعدد الاستعلامات المميزة المطلوب للمرشح.
- `--apply`: إلحاق المرشحين المحددين بـ`MEMORY.md` ووضع علامة عليهم بأنهم تمت ترقيتهم.
- `--include-promoted`: تضمين المرشحين الذين تمت ترقيتهم بالفعل في المخرجات.
- `--json`: طباعة مخرجات JSON.

`memory promote-explain`:

شرح مرشح ترقية محدد وتفصيل درجته.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: مفتاح المرشح أو جزء من المسار أو جزء من المقتطف للبحث عنه.
- `--agent <id>`: حصر النطاق في وكيل واحد (الافتراضي: الوكيل الافتراضي).
- `--include-promoted`: تضمين المرشحين الذين تمت ترقيتهم بالفعل.
- `--json`: طباعة مخرجات JSON.

`memory rem-harness`:

معاينة تأملات REM والحقائق المرشحة ومخرجات الترقية العميقة دون كتابة أي شيء.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: حصر النطاق في وكيل واحد (الافتراضي: الوكيل الافتراضي).
- `--include-promoted`: تضمين المرشحين العميقين الذين تمت ترقيتهم بالفعل.
- `--json`: طباعة مخرجات JSON.

## Dreaming

Dreaming هو نظام دمج الذاكرة في الخلفية بثلاث مراحل متعاونة:
**light** (فرز/تهيئة المواد قصيرة المدى)، و**deep** (ترقية الحقائق المتينة
إلى `MEMORY.md`)، و**REM** (التأمل وإبراز السمات).

- فعّله باستخدام `plugins.entries.memory-core.config.dreaming.enabled: true`.
- بدّله من الدردشة باستخدام `/dreaming on|off` (أو افحصه باستخدام `/dreaming status`).
- يعمل Dreaming وفق جدول مسح مدار واحد (`dreaming.frequency`) وينفّذ المراحل بالترتيب: light، REM، deep.
- تكتب مرحلة deep فقط الذاكرة المتينة إلى `MEMORY.md`.
- تُكتب مخرجات المراحل القابلة للقراءة البشرية وإدخالات اليوميات إلى `DREAMS.md` (أو `dreams.md` الموجود)، مع تقارير اختيارية لكل مرحلة في `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- يستخدم الترتيب إشارات موزونة: تكرار الاستدعاء، صلة الاسترجاع، تنوع الاستعلامات، الحداثة الزمنية، الدمج عبر الأيام، والغنى المفاهيمي المشتق.
- تعيد الترقية قراءة الملاحظة اليومية الحية قبل الكتابة إلى `MEMORY.md`، لذلك لا تتم ترقية المقتطفات قصيرة المدى المعدلة أو المحذوفة من لقطات مخزن الاستدعاء القديمة.
- تشترك عمليات `memory promote` المجدولة واليدوية في الإعدادات الافتراضية نفسها لمرحلة deep ما لم تمرر تجاوزات العتبات عبر CLI.
- تتوسع عمليات التشغيل التلقائية عبر مساحات عمل الذاكرة المكوّنة.

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
- يتضمن `memory status` أي مسارات إضافية مكوّنة عبر `memorySearch.extraPaths`.
- إذا كانت حقول مفتاح API البعيد للذاكرة النشطة فعليًا مكوّنة كـSecretRefs، يحل الأمر هذه القيم من لقطة Gateway النشطة. إذا لم يكن Gateway متاحًا، يفشل الأمر بسرعة.
- ملاحظة انحراف إصدار Gateway: يتطلب مسار الأمر هذا Gateway يدعم `secrets.resolve`؛ تعيد Gateways الأقدم خطأ طريقة غير معروفة.
- اضبط وتيرة المسح المجدول باستخدام `dreaming.frequency`. سياسة ترقية deep داخلية بخلاف ذلك؛ استخدم أعلام CLI على `memory promote` عندما تحتاج إلى تجاوزات يدوية لمرة واحدة.
- يعاين `memory rem-harness --path <file-or-dir> --grounded` أقسام `What Happened` و`Reflections` و`Possible Lasting Updates` المؤسَّسة من الملاحظات اليومية التاريخية دون كتابة أي شيء.
- يكتب `memory rem-backfill --path <file-or-dir>` إدخالات يوميات مؤسَّسة قابلة للعكس في `DREAMS.md` لمراجعة الواجهة.
- يقوم `memory rem-backfill --path <file-or-dir> --stage-short-term` أيضًا بزرع مرشحين متينين مؤسَّسين في مخزن الترقية قصيرة المدى الحي حتى تتمكن مرحلة deep العادية من ترتيبهم.
- يزيل `memory rem-backfill --rollback` إدخالات اليوميات المؤسَّسة المكتوبة سابقًا، ويزيل `memory rem-backfill --rollback-short-term` المرشحين المؤسَّسين قصيري المدى الذين تمت تهيئتهم سابقًا.
- راجع [Dreaming](/ar/concepts/dreaming) للاطلاع على أوصاف المراحل الكاملة ومرجع التكوين.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [نظرة عامة على الذاكرة](/ar/concepts/memory)

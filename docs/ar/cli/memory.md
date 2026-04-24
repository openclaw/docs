---
read_when:
    - أنت تريد فهرسة Memory الدلالية أو البحث فيها
    - أنت بصدد تصحيح أخطاء توفر Memory أو الفهرسة
    - أنت تريد ترقية Memory قصيرة الأمد المسترجعة إلى `MEMORY.md`
summary: مرجع CLI لـ `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Memory
x-i18n:
    generated_at: "2026-04-24T07:35:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4bcb1af05ecddceef7cd1d3244c8f0e4fc740d6d41fc5e9daa37177d1bfe3674
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

إدارة فهرسة Memory الدلالية والبحث فيها.
يتم توفيرها بواسطة Plugin الذاكرة النشط (الافتراضي: `memory-core`؛ اضبط `plugins.slots.memory = "none"` لتعطيلها).

ذو صلة:

- مفهوم Memory: [Memory](/ar/concepts/memory)
- ويكي Memory: [Memory Wiki](/ar/plugins/memory-wiki)
- CLI الخاصة بالويكي: [wiki](/ar/cli/wiki)
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

- `--agent <id>`: حصر النطاق على وكيل واحد. من دونه، تعمل هذه الأوامر لكل وكيل مُعدّ؛ وإذا لم تكن هناك قائمة وكلاء مُعدّة، فإنها تعود إلى الوكيل الافتراضي.
- `--verbose`: إصدار سجلات تفصيلية أثناء الفحص والفهرسة.

`memory status`:

- `--deep`: فحص توفر vector + embedding.
- `--index`: تشغيل إعادة فهرسة إذا كان المخزن متّسخًا (يتضمن `--deep`).
- `--fix`: إصلاح أقفال الاستدعاء القديمة وتسوية بيانات الترقية الوصفية.
- `--json`: طباعة خرج JSON.

إذا أظهر `memory status` الرسالة `Dreaming status: blocked`، فهذا يعني أن Cron المدار الخاص بـ Dreaming مفعّل لكن Heartbeat الذي يقوده لا يعمل للوكيل الافتراضي. راجع [Dreaming never runs](/ar/concepts/dreaming#dreaming-never-runs-status-shows-blocked) للاطلاع على السببين الشائعين.

`memory index`:

- `--force`: فرض إعادة فهرسة كاملة.

`memory search`:

- إدخال الاستعلام: مرّر إما `[query]` الموضعي أو `--query <text>`.
- إذا تم تمرير الاثنين معًا، تكون الأولوية لـ `--query`.
- إذا لم يتم تمرير أي منهما، يخرج الأمر بخطأ.
- `--agent <id>`: حصر النطاق على وكيل واحد (الافتراضي: الوكيل الافتراضي).
- `--max-results <n>`: تحديد عدد النتائج المعادة.
- `--min-score <n>`: تصفية المطابقات ذات الدرجات المنخفضة.
- `--json`: طباعة نتائج JSON.

`memory promote`:

معاينة وتطبيق ترقيات Memory قصيرة الأمد.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- كتابة الترقيات إلى `MEMORY.md` (الافتراضي: معاينة فقط).
- `--limit <n>` -- وضع حد أقصى لعدد المرشحين المعروضين.
- `--include-promoted` -- تضمين الإدخالات التي تمت ترقيتها بالفعل في الدورات السابقة.

الخيارات الكاملة:

- يرتب المرشحين قصيري الأمد من `memory/YYYY-MM-DD.md` باستخدام إشارات ترقية موزونة (`frequency` و`relevance` و`query diversity` و`recency` و`consolidation` و`conceptual richness`).
- يستخدم الإشارات قصيرة الأمد من كل من استدعاءات الذاكرة وعمليات الإدخال اليومية، بالإضافة إلى إشارات التعزيز الخفيفة/REM.
- عند تفعيل Dreaming، يقوم `memory-core` بإدارة وظيفة Cron واحدة تلقائيًا تشغّل عملية مسح كاملة (`light -> REM -> deep`) في الخلفية (لا حاجة إلى `openclaw cron add` يدوي).
- `--agent <id>`: حصر النطاق على وكيل واحد (الافتراضي: الوكيل الافتراضي).
- `--limit <n>`: الحد الأقصى للمرشحين المراد إرجاعهم/تطبيقهم.
- `--min-score <n>`: الحد الأدنى لدرجة الترقية الموزونة.
- `--min-recall-count <n>`: الحد الأدنى المطلوب لعدد مرات الاستدعاء للمرشح.
- `--min-unique-queries <n>`: الحد الأدنى المطلوب لعدد الاستعلامات المميزة للمرشح.
- `--apply`: إلحاق المرشحين المحددين إلى `MEMORY.md` ووضع علامة عليهم كمُرقّين.
- `--include-promoted`: تضمين المرشحين الذين تمت ترقيتهم بالفعل في الخرج.
- `--json`: طباعة خرج JSON.

`memory promote-explain`:

شرح مرشح ترقية محدد وتفصيل توزيع درجته.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: مفتاح المرشح، أو جزء من المسار، أو جزء من المقتطف المطلوب البحث عنه.
- `--agent <id>`: حصر النطاق على وكيل واحد (الافتراضي: الوكيل الافتراضي).
- `--include-promoted`: تضمين المرشحين الذين تمت ترقيتهم بالفعل.
- `--json`: طباعة خرج JSON.

`memory rem-harness`:

معاينة انعكاسات REM، والحقائق المرشحة، وخرج الترقية العميقة من دون كتابة أي شيء.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: حصر النطاق على وكيل واحد (الافتراضي: الوكيل الافتراضي).
- `--include-promoted`: تضمين المرشحين العميقين الذين تمت ترقيتهم بالفعل.
- `--json`: طباعة خرج JSON.

## Dreaming

Dreaming هو نظام دمج Memory في الخلفية ويتألف من ثلاث مراحل
متعاونة: **light** (فرز/تهيئة المواد قصيرة الأمد)، و**deep** (ترقية
الحقائق المستقرة إلى `MEMORY.md`)، و**REM** (التأمل وإبراز السمات).

- فعّله باستخدام `plugins.entries.memory-core.config.dreaming.enabled: true`.
- بدّله من الدردشة باستخدام `/dreaming on|off` (أو افحصه باستخدام `/dreaming status`).
- يعمل Dreaming وفق جدول مسح مُدار واحد (`dreaming.frequency`) وينفذ المراحل بالترتيب: light ثم REM ثم deep.
- المرحلة deep فقط هي التي تكتب Memory دائمة إلى `MEMORY.md`.
- تتم كتابة خرج المراحل المقروء بشريًا وإدخالات اليوميات إلى `DREAMS.md` (أو `dreams.md` الموجود)، مع تقارير اختيارية لكل مرحلة في `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- يستخدم الترتيب إشارات موزونة: تكرار الاستدعاء، وأهمية الاسترجاع، وتنوع الاستعلامات، والحداثة الزمنية، والدمج عبر الأيام، وغنى المفاهيم المستنتج.
- تعيد الترقية قراءة الملاحظة اليومية الحية قبل الكتابة إلى `MEMORY.md`، لذلك لا تتم ترقية المقتطفات قصيرة الأمد المعدلة أو المحذوفة من لقطات قديمة في مخزن الاستدعاء.
- تشترك تشغيلات `memory promote` المجدولة واليدوية في الإعدادات الافتراضية نفسها للمرحلة deep ما لم تمرر تجاوزات حدود CLI.
- تتشعب التشغيلات التلقائية عبر مساحات عمل Memory المُعدّة.

الجدولة الافتراضية:

- **وتيرة المسح**: `dreaming.frequency = 0 3 * * *`
- **حدود المرحلة deep**: `minScore=0.8` و`minRecallCount=3` و`minUniqueQueries=3` و`recencyHalfLifeDays=14` و`maxAgeDays=30`

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

- يقوم `memory index --verbose` بطباعة تفاصيل كل مرحلة (المزوّد، النموذج، المصادر، نشاط الدفعات).
- يتضمن `memory status` أي مسارات إضافية مُعدّة عبر `memorySearch.extraPaths`.
- إذا كانت حقول مفاتيح API البعيدة الخاصة بـ Active Memory الفعالة مُعدّة كـ SecretRefs، فإن الأمر يحل هذه القيم من لقطة gateway النشطة. وإذا كانت gateway غير متاحة، يفشل الأمر بسرعة.
- ملاحظة حول عدم توافق إصدار gateway: يتطلب مسار هذا الأمر gateway تدعم `secrets.resolve`؛ أما الـ gateways الأقدم فتعيد خطأ unknown-method.
- اضبط وتيرة المسح المجدول باستخدام `dreaming.frequency`. أما سياسة الترقية deep فهي داخلية بخلاف ذلك؛ استخدم أعلام CLI على `memory promote` عندما تحتاج إلى تجاوزات يدوية لمرة واحدة.
- يقوم `memory rem-harness --path <file-or-dir> --grounded` بمعاينة نواتج `What Happened` و`Reflections` و`Possible Lasting Updates` المرتكزة على الملاحظات اليومية التاريخية من دون كتابة أي شيء.
- يقوم `memory rem-backfill --path <file-or-dir>` بكتابة إدخالات يوميات مرتكزة قابلة للعكس في `DREAMS.md` لمراجعتها في UI.
- يقوم `memory rem-backfill --path <file-or-dir> --stage-short-term` أيضًا ببذر مرشحين مستقرين مرتكزين في مخزن الترقية قصير الأمد الحي بحيث يمكن للمرحلة deep العادية ترتيبهم.
- يقوم `memory rem-backfill --rollback` بإزالة إدخالات اليوميات المرتكزة المكتوبة سابقًا، ويقوم `memory rem-backfill --rollback-short-term` بإزالة المرشحين قصيري الأمد المرتكزين الذين تم تجهيزهم سابقًا.
- راجع [Dreaming](/ar/concepts/dreaming) للاطلاع على الوصف الكامل للمراحل ومرجع الإعداد.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [نظرة عامة على Memory](/ar/concepts/memory)

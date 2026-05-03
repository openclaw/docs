---
read_when:
    - تريد فهرسة الذاكرة الدلالية أو البحث فيها
    - أنت تقوم باستكشاف أخطاء توفر الذاكرة أو الفهرسة وإصلاحها
    - تريد ترقية الذاكرة قصيرة المدى المسترجعة إلى `MEMORY.md`
summary: مرجع CLI لـ `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: الذاكرة
x-i18n:
    generated_at: "2026-05-03T21:29:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: a33b848272c8853dd1a83e942124f0df30e096312e58a395c0ea08058e41f8fe
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

إدارة فهرسة الذاكرة الدلالية والبحث فيها.
يوفرها Plugin الذاكرة النشطة (الافتراضي: `memory-core`؛ اضبط `plugins.slots.memory = "none"` لتعطيلها).

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

- `--agent <id>`: حصر النطاق في وكيل واحد. من دونه، تعمل هذه الأوامر لكل وكيل مُكوَّن؛ وإذا لم تكن هناك قائمة وكلاء مُكوَّنة، فستعود إلى الوكيل الافتراضي.
- `--verbose`: إصدار سجلات تفصيلية أثناء عمليات الفحص والفهرسة.

`memory status`:

- `--deep`: فحص جاهزية مخزن المتجهات المحلي، وجاهزية موفر التضمينات، وجاهزية البحث الدلالي بالمتجهات. يبقى `memory status` العادي سريعًا ولا يشغّل تضمينًا مباشرًا أو عمل اكتشاف للموفر؛ وتعني حالة مخزن المتجهات أو المتجهات الدلالية غير المعروفة أنها لم تُفحص في ذلك الأمر. يتجاوز `searchMode: "search"` المعجمي في QMD فحوص المتجهات الدلالية وصيانة التضمينات حتى مع `--deep`.
- `--index`: تشغيل إعادة فهرسة إذا كان المخزن غير نظيف (يتضمن `--deep`).
- `--fix`: إصلاح أقفال الاستدعاء القديمة وتطبيع بيانات الترويج الوصفية.
- `--json`: طباعة مخرجات JSON.

إذا عرض `memory status` العبارة `Dreaming status: blocked`، فهذا يعني أن Cron المُدار لـ Dreaming مفعّل، لكن Heartbeat الذي يشغّله لا يعمل للوكيل الافتراضي. راجع [Dreaming لا يعمل أبدًا](/ar/concepts/dreaming#dreaming-never-runs-status-shows-blocked) لمعرفة السببين الشائعين.

`memory index`:

- `--force`: فرض إعادة فهرسة كاملة.

`memory search`:

- إدخال الاستعلام: مرّر إما `[query]` الموضعي أو `--query <text>`.
- إذا قُدّم كلاهما، تكون الأولوية لـ`--query`.
- إذا لم يُقدّم أي منهما، يخرج الأمر بخطأ.
- `--agent <id>`: حصر النطاق في وكيل واحد (الافتراضي: الوكيل الافتراضي).
- `--max-results <n>`: تحديد عدد النتائج المُعادة.
- `--min-score <n>`: تصفية التطابقات ذات الدرجات المنخفضة.
- `--json`: طباعة نتائج JSON.

`memory promote`:

معاينة وتطبيق ترقيات الذاكرة قصيرة المدى.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- كتابة الترقيات إلى `MEMORY.md` (الافتراضي: المعاينة فقط).
- `--limit <n>` -- تحديد الحد الأقصى لعدد المرشحين المعروضين.
- `--include-promoted` -- تضمين الإدخالات التي رُقّيت بالفعل في دورات سابقة.

الخيارات الكاملة:

- يرتّب المرشحين قصيري المدى من `memory/YYYY-MM-DD.md` باستخدام إشارات ترقية موزونة (`frequency`، `relevance`، `query diversity`، `recency`، `consolidation`، `conceptual richness`).
- يستخدم إشارات قصيرة المدى من كل من استدعاءات الذاكرة وتمريرات الإدخال اليومية، إضافة إلى إشارات التعزيز في مرحلتي light/REM.
- عند تفعيل Dreaming، يدير `memory-core` تلقائيًا مهمة Cron واحدة تشغّل مسحًا كاملًا (`light -> REM -> deep`) في الخلفية (لا يلزم تنفيذ `openclaw cron add` يدويًا).
- `--agent <id>`: حصر النطاق في وكيل واحد (الافتراضي: الوكيل الافتراضي).
- `--limit <n>`: الحد الأقصى للمرشحين المراد إرجاعهم/تطبيقهم.
- `--min-score <n>`: الحد الأدنى لدرجة الترقية الموزونة.
- `--min-recall-count <n>`: الحد الأدنى لعدد الاستدعاءات المطلوبة للمرشح.
- `--min-unique-queries <n>`: الحد الأدنى لعدد الاستعلامات المميزة المطلوبة للمرشح.
- `--apply`: إلحاق المرشحين المحددين بـ`MEMORY.md` ووضع علامة أنهم رُقّوا.
- `--include-promoted`: تضمين المرشحين الذين رُقّوا بالفعل في المخرجات.
- `--json`: طباعة مخرجات JSON.

`memory promote-explain`:

شرح مرشح ترقية محدد وتفصيل درجته.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: مفتاح المرشح، أو جزء من المسار، أو جزء من مقتطف للبحث عنه.
- `--agent <id>`: حصر النطاق في وكيل واحد (الافتراضي: الوكيل الافتراضي).
- `--include-promoted`: تضمين المرشحين الذين رُقّوا بالفعل.
- `--json`: طباعة مخرجات JSON.

`memory rem-harness`:

معاينة تأملات REM، والحقائق المرشحة، ومخرجات الترقية العميقة دون كتابة أي شيء.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: حصر النطاق في وكيل واحد (الافتراضي: الوكيل الافتراضي).
- `--include-promoted`: تضمين المرشحين العميقين الذين رُقّوا بالفعل.
- `--json`: طباعة مخرجات JSON.

## Dreaming

Dreaming هو نظام دمج الذاكرة في الخلفية بثلاث مراحل تعاونية:
**light** (فرز/تجهيز مواد قصيرة المدى)، و**deep** (ترقية الحقائق الدائمة
إلى `MEMORY.md`)، و**REM** (التأمل وإبراز السمات).

- فعّله باستخدام `plugins.entries.memory-core.config.dreaming.enabled: true`.
- بدّله من الدردشة باستخدام `/dreaming on|off` (أو افحصه باستخدام `/dreaming status`).
- يعمل Dreaming وفق جدول مسح مُدار واحد (`dreaming.frequency`) وينفّذ المراحل بالترتيب: light، ثم REM، ثم deep.
- المرحلة deep فقط هي التي تكتب الذاكرة الدائمة إلى `MEMORY.md`.
- تُكتب مخرجات المراحل القابلة للقراءة وإدخالات اليوميات إلى `DREAMS.md` (أو `dreams.md` الموجود)، مع تقارير اختيارية لكل مرحلة في `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- يستخدم الترتيب إشارات موزونة: تكرار الاستدعاء، صلة الاسترجاع، تنوع الاستعلامات، الحداثة الزمنية، الدمج عبر الأيام، وثراء المفاهيم المشتق.
- تعيد الترقية قراءة الملاحظة اليومية المباشرة قبل الكتابة إلى `MEMORY.md`، حتى لا تُرقّى المقتطفات قصيرة المدى المعدّلة أو المحذوفة من لقطات قديمة لمخزن الاستدعاء.
- تشترك عمليات `memory promote` المجدولة واليدوية في إعدادات مرحلة deep الافتراضية نفسها ما لم تمرّر تجاوزات عتبات عبر CLI.
- تنتشر عمليات التشغيل التلقائية عبر مساحات عمل الذاكرة المُكوَّنة.

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
- إذا كانت حقول مفاتيح API البعيدة للذاكرة النشطة الفعلية مُكوَّنة كـSecretRefs، يحل الأمر تلك القيم من لقطة Gateway النشطة. إذا لم يكن Gateway متاحًا، يفشل الأمر بسرعة.
- ملاحظة انحراف إصدار Gateway: يتطلب مسار الأمر هذا Gateway يدعم `secrets.resolve`؛ وتعيد البوابات الأقدم خطأ طريقة غير معروفة.
- اضبط وتيرة المسح المجدول باستخدام `dreaming.frequency`. أما سياسة الترقية العميقة فهي داخلية بخلاف ذلك؛ استخدم أعلام CLI على `memory promote` عندما تحتاج إلى تجاوزات يدوية لمرة واحدة.
- يعاين `memory rem-harness --path <file-or-dir> --grounded` أقسام `What Happened` و`Reflections` و`Possible Lasting Updates` المستندة إلى ملاحظات يومية تاريخية دون كتابة أي شيء.
- يكتب `memory rem-backfill --path <file-or-dir>` إدخالات يوميات مستندة وقابلة للعكس في `DREAMS.md` لمراجعة واجهة المستخدم.
- يزرع `memory rem-backfill --path <file-or-dir> --stage-short-term` أيضًا مرشحين دائمين مستندين في مخزن الترقية قصير المدى المباشر حتى تتمكن مرحلة deep العادية من ترتيبهم.
- يزيل `memory rem-backfill --rollback` إدخالات اليوميات المستندة المكتوبة سابقًا، ويزيل `memory rem-backfill --rollback-short-term` المرشحين قصيري المدى المستندين الذين جرى تجهيزهم سابقًا.
- راجع [Dreaming](/ar/concepts/dreaming) للاطلاع على أوصاف المراحل الكاملة ومرجع التهيئة.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [نظرة عامة على الذاكرة](/ar/concepts/memory)

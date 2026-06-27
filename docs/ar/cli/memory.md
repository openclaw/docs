---
read_when:
    - تريد فهرسة الذاكرة الدلالية أو البحث فيها
    - أنت تصحّح أخطاء توفر الذاكرة أو الفهرسة
    - تريد ترقية الذاكرة قصيرة المدى المسترجعة إلى `MEMORY.md`
summary: مرجع CLI لـ `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: الذاكرة
x-i18n:
    generated_at: "2026-06-27T17:22:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 553c69ccc92d398e765a33bfadb8cc9a0bf9e0f86b319fb4fcff05464ebebe7c
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

إدارة فهرسة الذاكرة الدلالية والبحث فيها.
يوفرها Plugin المضمّن `memory-core`. يكون الأمر متاحًا عندما
يحدد `plugins.slots.memory` الخيار `memory-core` (الإعداد الافتراضي)؛ وتعرض Plugins الذاكرة الأخرى
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

- `--agent <id>`: حصر النطاق في وكيل واحد. بدونه، تعمل هذه الأوامر لكل وكيل مكوّن؛ وإذا لم تكن هناك قائمة وكلاء مكوّنة، فإنها تعود إلى الوكيل الافتراضي.
- `--verbose`: إخراج سجلات تفصيلية أثناء الفحوصات والفهرسة.

`memory status`:

- `--deep`: فحص جاهزية مخزن المتجهات المحلي، وجاهزية موفّر التضمينات، وجاهزية بحث المتجهات الدلالي. يبقى `memory status` العادي سريعًا ولا يشغّل عمل تضمين مباشرًا أو اكتشافًا للموفّرين؛ وتعني حالة مخزن المتجهات أو المتجهات الدلالية غير المعروفة أنها لم تُفحص في ذلك الأمر. يتخطى `searchMode: "search"` المعجمي في QMD فحوصات المتجهات الدلالية وصيانة التضمينات حتى مع `--deep`.
- `--index`: تشغيل إعادة فهرسة إذا كان المخزن متسخًا (يتضمن `--deep`).
- `--fix`: إصلاح أقفال الاستدعاء القديمة وتطبيع بيانات تعريف الترقية.
- `--json`: طباعة مخرجات JSON.

إذا عرض `memory status` الحالة `Dreaming status: blocked`، فهذا يعني أن Cron المدار الخاص بـ Dreaming مفعّل لكن Heartbeat الذي يقوده لا يعمل للوكيل الافتراضي. راجع [Dreaming لا يعمل أبدًا](/ar/concepts/dreaming#dreaming-never-runs-status-shows-blocked) لمعرفة السببين الشائعين.

`memory index`:

- `--force`: فرض إعادة فهرسة كاملة.

`memory search`:

- إدخال الاستعلام: مرّر إما `[query]` الموضعي أو `--query <text>`.
- إذا قُدّم كلاهما، فإن `--query` تكون لها الأسبقية.
- إذا لم يقدّم أي منهما، يخرج الأمر بخطأ.
- `--agent <id>`: حصر النطاق في وكيل واحد (الافتراضي: الوكيل الافتراضي).
- `--max-results <n>`: تحديد عدد النتائج المُعادة.
- `--min-score <n>`: تصفية المطابقات منخفضة الدرجة.
- `--json`: طباعة نتائج JSON.

`memory promote`:

معاينة ترقيات الذاكرة قصيرة المدى وتطبيقها.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- كتابة الترقيات إلى `MEMORY.md` (الافتراضي: المعاينة فقط).
- `--limit <n>` -- تحديد الحد الأقصى لعدد المرشحين المعروضين.
- `--include-promoted` -- تضمين الإدخالات التي سبق ترقيتها في دورات سابقة.

الخيارات الكاملة:

- يرتّب المرشحين قصيري المدى من `memory/YYYY-MM-DD.md` باستخدام إشارات ترقية موزونة (`frequency`، `relevance`، `query diversity`، `recency`، `consolidation`، `conceptual richness`).
- يستخدم إشارات قصيرة المدى من استدعاءات الذاكرة ومرّات الاستيعاب اليومية، بالإضافة إلى إشارات تعزيز مرحلتي light/REM.
- عندما يكون Dreaming مفعّلًا، يدير `memory-core` تلقائيًا مهمة Cron واحدة تشغّل مسحًا كاملًا (`light -> REM -> deep`) في الخلفية (لا يلزم تشغيل `openclaw cron add` يدويًا).
- `--agent <id>`: حصر النطاق في وكيل واحد (الافتراضي: الوكيل الافتراضي).
- `--limit <n>`: الحد الأقصى للمرشحين المراد إرجاعهم/تطبيقهم.
- `--min-score <n>`: الحد الأدنى لدرجة الترقية الموزونة.
- `--min-recall-count <n>`: الحد الأدنى لعدد الاستدعاءات المطلوبة للمرشح.
- `--min-unique-queries <n>`: الحد الأدنى لعدد الاستعلامات المميزة المطلوبة للمرشح.
- `--apply`: إلحاق المرشحين المحددين إلى `MEMORY.md` ووضع علامة عليهم كمرقّين.
- `--include-promoted`: تضمين المرشحين الذين سبق ترقيتهم في المخرجات.
- `--json`: طباعة مخرجات JSON.

`memory promote-explain`:

شرح مرشح ترقية محدد وتفصيل درجته.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: مفتاح المرشح، أو جزء من المسار، أو جزء من مقتطف للبحث عنه.
- `--agent <id>`: حصر النطاق في وكيل واحد (الافتراضي: الوكيل الافتراضي).
- `--include-promoted`: تضمين المرشحين الذين سبق ترقيتهم.
- `--json`: طباعة مخرجات JSON.

`memory rem-harness`:

معاينة تأملات REM، والحقائق المرشحة، ومخرجات الترقية العميقة دون كتابة أي شيء.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: حصر النطاق في وكيل واحد (الافتراضي: الوكيل الافتراضي).
- `--include-promoted`: تضمين المرشحين العميقين الذين سبق ترقيتهم.
- `--json`: طباعة مخرجات JSON.

## Dreaming

Dreaming هو نظام دمج الذاكرة في الخلفية بثلاث مراحل متعاونة:
**light** (فرز/تهيئة المادة قصيرة المدى)، و**deep** (ترقية الحقائق المتينة
إلى `MEMORY.md`)، و**REM** (التأمل وإبراز السمات).

- فعّله باستخدام `plugins.entries.memory-core.config.dreaming.enabled: true`.
- بدّل حالته من الدردشة باستخدام `/dreaming on|off` (أو افحصه باستخدام `/dreaming status`).
- يعمل Dreaming وفق جدول مسح مدار واحد (`dreaming.frequency`) وينفّذ المراحل بالترتيب: light، وREM، وdeep.
- مرحلة deep وحدها تكتب الذاكرة المتينة إلى `MEMORY.md`.
- تُكتب مخرجات المراحل وإدخالات اليوميات القابلة للقراءة البشرية إلى `DREAMS.md` (أو `dreams.md` الموجود)، مع تقارير اختيارية لكل مرحلة في `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- يستخدم الترتيب إشارات موزونة: تكرار الاستدعاء، وملاءمة الاسترجاع، وتنوع الاستعلامات، والحداثة الزمنية، والدمج عبر الأيام، والثراء المفاهيمي المشتق.
- تعيد الترقية قراءة الملاحظة اليومية المباشرة قبل الكتابة إلى `MEMORY.md`، لذلك لا تُرقّى المقتطفات قصيرة المدى المحررة أو المحذوفة من لقطات مخزن الاستدعاء القديمة.
- تشترك عمليات `memory promote` المجدولة واليدوية في إعدادات مرحلة deep الافتراضية نفسها ما لم تمرر تجاوزات عتبات CLI.
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

- يطبع `memory index --verbose` تفاصيل لكل مرحلة (الموفّر، والنموذج، والمصادر، ونشاط الدُفعات).
- يتضمن `memory status` أي مسارات إضافية مكوّنة عبر `memorySearch.extraPaths`.
- إذا كانت حقول مفاتيح Active Memory remote API الفعّالة مكوّنة كـ SecretRefs، فإن الأمر يحل تلك القيم من لقطة Gateway النشطة. إذا كان Gateway غير متاح، يفشل الأمر بسرعة.
- ملاحظة انحراف إصدار Gateway: يتطلب مسار الأمر هذا Gateway يدعم `secrets.resolve`؛ وتعيد Gateways الأقدم خطأ unknown-method.
- اضبط وتيرة المسح المجدول باستخدام `dreaming.frequency`. أما سياسة ترقية deep فهي داخلية بخلاف `dreaming.phases.deep.maxPromotedSnippetTokens`، الذي يحد طول المقتطف المُرقّى مع إبقاء المصدر مرئيًا. استخدم أعلام CLI على `memory promote` عندما تحتاج إلى تجاوزات يدوية لمرة واحدة للعتبات.
- يعاين `memory rem-harness --path <file-or-dir> --grounded` أقسام `What Happened` و`Reflections` و`Possible Lasting Updates` المؤسَّسة من الملاحظات اليومية التاريخية دون كتابة أي شيء.
- يكتب `memory rem-backfill --path <file-or-dir>` إدخالات يوميات مؤسَّسة وقابلة للعكس إلى `DREAMS.md` لمراجعة UI.
- يزرع `memory rem-backfill --path <file-or-dir> --stage-short-term` أيضًا مرشحين متينين مؤسَّسين في مخزن الترقية قصير المدى المباشر كي تتمكن مرحلة deep العادية من ترتيبهم.
- يزيل `memory rem-backfill --rollback` إدخالات اليوميات المؤسَّسة المكتوبة سابقًا، ويزيل `memory rem-backfill --rollback-short-term` المرشحين المؤسَّسين قصيري المدى الذين جرى تهيئتهم سابقًا.
- راجع [Dreaming](/ar/concepts/dreaming) للاطلاع على أوصاف المراحل الكاملة ومرجع التكوين.

## ذات صلة

- [مرجع CLI](/ar/cli)
- [نظرة عامة على الذاكرة](/ar/concepts/memory)

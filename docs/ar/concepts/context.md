---
read_when:
    - تريد فهم ما يعنيه "السياق" في OpenClaw
    - أنت تصحّح سبب "معرفة" النموذج لشيء ما (أو نسيانه)
    - تريد تقليل حمل السياق (/context و/status و/compact)
summary: 'السياق: ما يراه النموذج، وكيف يُبنى، وكيفية فحصه'
title: السياق
x-i18n:
    generated_at: "2026-04-24T07:37:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 537c989d1578a186a313698d3b97d75111fedb641327fb7a8b72e47b71b84b85
    source_path: concepts/context.md
    workflow: 15
---

يشير “السياق” إلى **كل ما يرسله OpenClaw إلى النموذج أثناء تشغيل واحد**. ويحدّه **سياق النافذة** الخاص بالنموذج (حد الرموز).

نموذج ذهني للمبتدئين:

- **توجيه النظام** (يبنيه OpenClaw): القواعد، والأدوات، وقائمة Skills، والوقت/وقت التشغيل، وملفات workspace المحقونة.
- **سجل المحادثة**: رسائلك + رسائل المساعد الخاصة بهذه الجلسة.
- **استدعاءات/نتائج الأدوات + المرفقات**: مخرجات الأوامر، وقراءات الملفات، والصور/الصوت، إلخ.

السياق _ليس هو نفسه_ “الذاكرة”: إذ يمكن تخزين الذاكرة على القرص وإعادة تحميلها لاحقًا؛ أما السياق فهو ما يوجد داخل النافذة الحالية للنموذج.

## البدء السريع (فحص السياق)

- `/status` → عرض سريع لـ “إلى أي مدى امتلأت نافذتي؟” + إعدادات الجلسة.
- `/context list` → ما الذي تم حقنه + أحجام تقريبية (لكل ملف + الإجماليات).
- `/context detail` → تفصيل أعمق: لكل ملف، وأحجام schema لكل أداة، وأحجام إدخالات Skills، وحجم توجيه النظام.
- `/usage tokens` → إلحاق تذييل استخدام لكل رد مع الردود العادية.
- `/compact` → تلخيص السجل الأقدم في إدخال مضغوط لتفريغ مساحة من النافذة.

راجع أيضًا: [أوامر الشرطة المائلة](/ar/tools/slash-commands)، [استخدام الرموز والتكاليف](/ar/reference/token-use)، [Compaction](/ar/concepts/compaction).

## مثال على المخرجات

تختلف القيم حسب النموذج، والمزوّد، وسياسة الأدوات، وما يوجد في workspace لديك.

### `/context list`

```
🧠 Context breakdown
Workspace: <workspaceDir>
Bootstrap max/file: 12,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Injected workspace files:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Skills list (system prompt text): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool list (system prompt text): 1,032 chars (~258 tok)
Tool schemas (JSON): 31,988 chars (~7,997 tok) (counts toward context; not shown as text)
Tools: (same as above)

Session tokens (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Context breakdown (detailed)
…
Top skills (prompt entry size):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Top tools (schema size):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

## ما الذي يُحتسب ضمن نافذة السياق

كل ما يتلقاه النموذج يُحتسب، بما في ذلك:

- توجيه النظام (كل الأقسام).
- سجل المحادثة.
- استدعاءات الأدوات + نتائج الأدوات.
- المرفقات/النصوص المنسوخة (الصور/الصوت/الملفات).
- ملخصات Compaction وعناصر التقليم.
- “أغلفة” المزوّد أو الترويسات المخفية (غير مرئية، لكنها لا تزال تُحتسب).

## كيف يبني OpenClaw توجيه النظام

إن توجيه النظام **مملوك لـ OpenClaw** ويُعاد بناؤه في كل تشغيل. ويتضمن:

- قائمة الأدوات + أوصاف قصيرة.
- قائمة Skills ‏(بيانات وصفية فقط؛ راجع أدناه).
- موقع workspace.
- الوقت (UTC + وقت المستخدم المُحوَّل إذا كان مهيأ).
- بيانات وقت التشغيل الوصفية (المضيف/نظام التشغيل/النموذج/التفكير).
- ملفات bootstrap الخاصة بـ workspace المحقونة تحت **Project Context**.

التفصيل الكامل: [System Prompt](/ar/concepts/system-prompt).

## ملفات workspace المحقونة (Project Context)

افتراضيًا، يحقن OpenClaw مجموعة ثابتة من ملفات workspace ‏(إن وُجدت):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` ‏(في التشغيل الأول فقط)

تُقتطع الملفات الكبيرة لكل ملف باستخدام `agents.defaults.bootstrapMaxChars` ‏(الافتراضي `12000` حرفًا). كما يفرض OpenClaw حدًا إجماليًا لحقن bootstrap عبر الملفات باستخدام `agents.defaults.bootstrapTotalMaxChars` ‏(الافتراضي `60000` حرفًا). ويعرض `/context` الأحجام **الخام مقابل المحقون** وما إذا حدث اقتطاع.

عند حدوث اقتطاع، يمكن لوقت التشغيل حقن كتلة تحذير داخل prompt تحت Project Context. اضبط هذا عبر `agents.defaults.bootstrapPromptTruncationWarning` ‏(`off` أو `once` أو `always`؛ الافتراضي `once`).

## Skills: محقونة أم محمّلة عند الطلب

يتضمن توجيه النظام **قائمة Skills** مدمجة (الاسم + الوصف + الموقع). وهذه القائمة لها حمل حقيقي.

لا تُضمَّن تعليمات Skill _افتراضيًا_. بل يُتوقع من النموذج أن يقرأ `SKILL.md` الخاص بالـ skill عبر `read` **فقط عند الحاجة**.

## الأدوات: هناك كلفتان

تؤثر الأدوات في السياق بطريقتين:

1. **نص قائمة الأدوات** في توجيه النظام (ما تراه على أنه “Tooling”).
2. **Tool schemas** ‏(JSON). تُرسل هذه إلى النموذج كي يتمكن من استدعاء الأدوات. وهي تُحتسب ضمن السياق رغم أنك لا تراها كنص عادي.

يفصّل `/context detail` أكبر tool schemas حتى تتمكن من رؤية ما يهيمن.

## الأوامر، والتوجيهات، و"الاختصارات المضمنة"

تعالج Gateway أوامر الشرطة المائلة. وهناك عدة سلوكيات مختلفة:

- **الأوامر المستقلة**: الرسالة التي تحتوي فقط على `/...` تُشغَّل كأمر.
- **التوجيهات**: تتم إزالة `/think` و`/verbose` و`/trace` و`/reasoning` و`/elevated` و`/model` و`/queue` قبل أن يرى النموذج الرسالة.
  - تحفظ الرسائل التي تحتوي على التوجيه فقط إعدادات الجلسة.
  - تعمل التوجيهات المضمنة داخل رسالة عادية كتلميحات خاصة بالرسالة.
- **الاختصارات المضمنة** (للمرسلين المدرجين في قائمة السماح فقط): يمكن لبعض رموز `/...` داخل رسالة عادية أن تعمل فورًا (مثال: “hey /status”)، وتُزال قبل أن يرى النموذج النص المتبقي.

التفاصيل: [أوامر الشرطة المائلة](/ar/tools/slash-commands).

## الجلسات، وCompaction، والتقليم (ما الذي يستمر)

يعتمد ما يستمر عبر الرسائل على الآلية:

- **السجل العادي** يستمر في transcript الجلسة إلى أن يتم ضغطه/تقليمه حسب السياسة.
- **Compaction** يحفظ ملخصًا في transcript ويُبقي الرسائل الحديثة كما هي.
- **التقليم** يُسقط نتائج الأدوات القديمة من prompt _داخل الذاكرة_ لتفريغ مساحة من نافذة السياق، لكنه لا يعيد كتابة transcript الجلسة — إذ لا يزال السجل الكامل قابلًا للفحص على القرص.

الوثائق: [الجلسة](/ar/concepts/session)، [Compaction](/ar/concepts/compaction)، [تقليم الجلسة](/ar/concepts/session-pruning).

افتراضيًا، يستخدم OpenClaw محرك السياق المضمّن `legacy` من أجل التجميع و
Compaction. وإذا ثبّتَّ Plugin يوفّر `kind: "context-engine"` و
اخترته عبر `plugins.slots.contextEngine`، فسيفوض OpenClaw
تجميع السياق، و`/compact`، وخطافات دورة حياة سياق الوكيل الفرعي ذات الصلة إلى ذلك
المحرك بدلًا من ذلك. ولا يؤدي `ownsCompaction: false` إلى الرجوع التلقائي إلى
المحرك القديم؛ إذ يجب على المحرك النشط أن يطبق `compact()` بشكل صحيح. راجع
[Context Engine](/ar/concepts/context-engine) للاطلاع على الواجهة الكاملة
القابلة للتوصيل، وخطافات دورة الحياة، والتهيئة.

## ما الذي يبلّغ عنه `/context` فعليًا

يفضّل `/context` أحدث تقرير لتوجيه النظام **مبني أثناء التشغيل** عندما يكون متاحًا:

- `System prompt (run)` = تم التقاطه من آخر تشغيل مضمّن (قادر على استخدام الأدوات) وحُفظ في مخزن الجلسة.
- `System prompt (estimate)` = يُحسب عند الطلب عندما لا يوجد تقرير تشغيل (أو عند التشغيل عبر واجهة CLI خلفية لا تُنشئ التقرير).

وفي كلتا الحالتين، يبلّغ عن الأحجام وأكبر المساهمين؛ لكنه **لا** يفرغ توجيه النظام الكامل أو tool schemas.

## ذو صلة

- [Context Engine](/ar/concepts/context-engine) — حقن سياق مخصص عبر Plugins
- [Compaction](/ar/concepts/compaction) — تلخيص المحادثات الطويلة
- [System Prompt](/ar/concepts/system-prompt) — كيف يُبنى توجيه النظام
- [Agent Loop](/ar/concepts/agent-loop) — دورة تنفيذ الوكيل الكاملة

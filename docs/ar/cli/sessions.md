---
read_when:
    - تريد عرض الجلسات المخزنة والاطلاع على النشاط الأخير
summary: مرجع CLI لـ `openclaw sessions` (عرض الجلسات المخزنة + الاستخدام)
title: الجلسات
x-i18n:
    generated_at: "2026-07-16T13:51:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e00d846229dfad1ada1a8c9a548e26f26247d3f7e5a35106903f6cd4818878b5
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

اعرض جلسات المحادثة المخزنة.

قوائم الجلسات ليست فحوصات للتأكد من نشاط القناة/المزوّد. فهي تعرض صفوف
المحادثات الدائمة من مخازن الجلسات. يمكن لقناة Discord أو Slack أو Telegram
أو أي قناة أخرى هادئة إعادة الاتصال بنجاح من دون إنشاء صف جلسة جديد
حتى تتم معالجة رسالة. استخدم `openclaw channels status --probe`،
أو `openclaw status --deep`، أو `openclaw health --verbose` عندما تحتاج إلى اتصال
مباشر بالقناة.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --store ./tmp/sessions.json
openclaw sessions --json
```

العلامات:

| العلامة                 | الوصف                                                            |
| -------------------- | ---------------------------------------------------------------------- |
| `--agent <id>`       | مخزن وكيل واحد مهيأ (الافتراضي: الوكيل الافتراضي المهيأ).        |
| `--all-agents`       | اجمع كل مخازن الوكلاء المهيأة.                                 |
| `--store <path>`     | مسار مخزن صريح (لا يمكن دمجه مع `--agent` أو `--all-agents`). |
| `--active <minutes>` | اعرض فقط الجلسات التي حُدّثت خلال آخر N دقيقة.                  |
| `--limit <n\|all>`   | الحد الأقصى للصفوف في المخرجات (الافتراضي `100`؛ يعيد `all` المخرجات الكاملة).        |
| `--json`             | مخرجات قابلة للقراءة آليًا.                                               |
| `--verbose`          | تسجيل تفصيلي.                                                       |

يكون `openclaw sessions` واستدعاء RPC ‏`sessions.list` في Gateway محدودَين افتراضيًا
حتى لا تستحوذ المخازن الكبيرة طويلة العمر على عملية CLI أو حلقة أحداث
Gateway. يعيد CLI أحدث 100 جلسة افتراضيًا؛ مرّر `--limit <n>`
لنافذة أصغر/أكبر أو `--limit all` عندما تحتاج عمدًا إلى
المخزن الكامل. تتضمن استجابات JSON ‏`totalCount` و`limitApplied` و`hasMore`
عندما يحتاج المستدعون إلى إظهار وجود مزيد من الصفوف.

يمكن لعملاء RPC تمرير `configuredAgentsOnly: true` للإبقاء على مصدر
الاكتشاف المدمج الواسع مع إعادة صفوف الوكلاء الموجودين حاليًا في الإعدادات فقط.
تستخدم واجهة التحكم هذا الوضع افتراضيًا حتى لا تظهر مخازن الوكلاء المحذوفة
أو الموجودة على القرص فقط مجددًا في عرض الجلسات.

يقرأ `--all-agents` مخازن الوكلاء المهيأة. اكتشاف جلسات Gateway وACP
أوسع نطاقًا: فهو يتضمن أيضًا مخازن SQLite التي تُحل من
جذور الوكلاء المهيأة أو جذر `session.store` ذي القالب. يجب أن تُحل مسارات
المحدد القديمة داخل جذر الوكيل؛ وتُتخطى الروابط الرمزية والمسارات الواقعة
خارج الجذر.

`openclaw sessions --all-agents --json`:

```json
{
  "path": null,
  "stores": [
    { "agentId": "main", "path": "/home/user/.openclaw/agents/main/sessions/sessions.json" },
    { "agentId": "work", "path": "/home/user/.openclaw/agents/work/sessions/sessions.json" }
  ],
  "allAgents": true,
  "count": 2,
  "totalCount": 2,
  "limitApplied": 100,
  "hasMore": false,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "openai/gpt-5.6-sol" },
    { "agentId": "work", "key": "agent:work:main", "model": "anthropic/claude-sonnet-4-6" }
  ]
}
```

## تتبّع تقدم المسار

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

يعرض `openclaw sessions tail` أحداث مسار وقت التشغيل الحديثة كسطور
تقدم موجزة. من دون `--session-key`، يتتبّع الجلسات قيد التشغيل أولًا، ثم
أحدث جلسة مخزنة. يتحكم `--tail <count>` في عدد الأحداث الموجودة التي
تُطبع قبل وضع المتابعة؛ الافتراضي `80`، ويبدأ `0` من النهاية الحالية.
يواصل `--follow` مراقبة الجلسة المحددة المدعومة بـSQLite أو ملف
مسار قديم صريح.

عرض التقدم متحفظ عمدًا: لا يُطبع نص الموجّه، ولا وسائط الأدوات،
ولا محتويات نتائج الأدوات. تعرض استدعاءات الأدوات اسم الأداة مع
`{...redacted...}`؛ وتعرض نتائج الأدوات حالة مثل `ok`، أو `error`، أو `done`؛
وتعرض سطور إكمال النموذج المزوّد/النموذج والحالة النهائية.

## تصدير حزمة مسار

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

هذا هو مسار الأمر الذي يستخدمه أمر الشرطة المائلة `/export-trajectory` بعد
موافقة المالك على طلب التنفيذ. يُحل دليل المخرجات دائمًا
داخل `.openclaw/trajectory-exports/` ضمن مساحة العمل المحددة.

## صيانة التنظيف

شغّل الصيانة الآن بدلًا من انتظار دورة الكتابة التالية:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

يستخدم `openclaw sessions cleanup` إعدادات `session.maintenance` من الإعدادات
([مرجع الإعدادات](/ar/gateway/config-agents#session)):

- ملاحظة النطاق: يصون `openclaw sessions cleanup` مخازن الجلسات،
  والنصوص المنسوخة، وصفوف المسارات، والملفات الجانبية القديمة للمسارات. ولا
  يحذف سجل تشغيل Cron، الذي يحتفظ تلقائيًا بأحدث 2000 صف لكل مهمة
  ([إعداد Cron](/ar/automation/cron-jobs#configuration)).
- يحذف التنظيف أيضًا عناصر النصوص المنسوخة القديمة/المؤرشفة غير المُشار إليها،
  ونقاط تحقق Compaction، والملفات الجانبية للمسارات الأقدم من
  `session.maintenance.pruneAfter`؛ وتُحفظ العناصر التي لا تزال صفوف جلسات
  SQLite تشير إليها.
- يُبلغ التنظيف بصورة منفصلة عن تنظيف عمليات فحص تشغيل نموذج Gateway قصيرة العمر
  باسم `modelRunPruned`. لا يطابق هذا إلا المفاتيح الصريحة الصارمة ذات الشكل
  `agent:*:explicit:model-run-<uuid>`. مدة الاحتفاظ ثابتة عند `24h` وهي
  مرتبطة بالضغط: لا تزيل صفوف الفحص القديمة إلا عند بلوغ ضغط
  صيانة/حد إدخالات الجلسات. وعند تشغيلها، يحدث تنظيف تشغيل النموذج
  قبل التنظيف العام للبيانات القديمة وفرض الحد الأقصى.

العلامات:

| العلامة                 | الوصف                                                                                                                                                                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run`          | عاين عدد الإدخالات التي ستُحذف/يُفرض عليها الحد الأقصى من دون كتابة. في الوضع النصي، يطبع جدول إجراءات لكل جلسة (`Action`، و`Key`، و`Age`، و`Model`، و`Flags`) بالإضافة إلى ملخص مجمّع حسب تسمية الجلسة.                                                                                                       |
| `--enforce`          | طبّق الصيانة حتى عندما تكون قيمة `session.maintenance.mode` هي `warn`.                                                                                                                                                                                                                                          |
| `--fix-missing`      | أزل الإدخالات القديمة التي تكون عناصر النصوص المنسوخة المؤرشفة الخاصة بها مفقودة أو مقتصرة على الترويسة/فارغة، حتى إذا لم تكن ستخرج عادةً بسبب العمر/العدد بعد.                                                                                                                                                             |
| `--fix-dm-scope`     | عندما تكون قيمة `session.dmScope` هي `main`، أوقف صفوف الرسائل المباشرة القديمة المرتبطة بمفاتيح النظراء التي خلّفها توجيه `per-peer` أو `per-channel-peer` أو `per-account-channel-peer` السابق. استخدم `--dry-run` أولًا؛ يؤدي التطبيق إلى إزالة تلك الصفوف من SQLite والحفاظ على عناصر نصوصها المنسوخة القديمة كمحفوظات محذوفة. |
| `--active-key <key>` | احمِ مفتاحًا نشطًا محددًا من الإزالة بسبب ميزانية القرص. ويُحتفظ أيضًا بمؤشرات المحادثات الخارجية الدائمة، مثل جلسات المجموعات وجلسات الدردشة محددة النطاق بسلاسل المحادثات، أثناء صيانة العمر/العدد/ميزانية القرص.                                                                                               |
| `--agent <id>`       | شغّل التنظيف لمخزن وكيل مهيأ واحد.                                                                                                                                                                                                                                                                |
| `--all-agents`       | شغّل التنظيف لجميع مخازن الوكلاء المهيأة.                                                                                                                                                                                                                                                               |
| `--store <path>`     | شغّل التنظيف على مسار محدد لمحدد مخزن قديم.                                                                                                                                                                                                                                                         |
| `--json`             | اطبع ملخصًا بصيغة JSON. مع `--all-agents`، تتضمن المخرجات ملخصًا واحدًا لكل مخزن.                                                                                                                                                                                                                          |

عندما يمكن الوصول إلى Gateway، يُرسل التنظيف غير التجريبي لمخازن الوكلاء
المهيأة عبر Gateway كي يستخدم كاتب مخزن الجلسات نفسه الذي تستخدمه حركة
وقت التشغيل. استخدم `--store <path>` للإصلاح الصريح دون اتصال لمحدد
مخزن قديم.

`openclaw sessions cleanup --all-agents --dry-run --json`:

```json
{
  "allAgents": true,
  "mode": "warn",
  "dryRun": true,
  "stores": [
    {
      "agentId": "main",
      "storePath": "/home/user/.openclaw/agents/main/sessions/sessions.json",
      "beforeCount": 120,
      "afterCount": 80,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

## ضغط جلسة

استعد ميزانية السياق لجلسة عالقة أو مفرطة الحجم. يُعد `openclaw sessions
compact <key>` الغلاف الأساسي حول استدعاء RPC ‏`sessions.compact`
في Gateway ويتطلب Gateway قيد التشغيل.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- من دون `--max-lines`، يلخّص نموذج اللغة الكبير في Gateway النص المنسوخ. لا
  يفرض CLI مهلة نهائية للعميل افتراضيًا؛ إذ يدير Gateway دورة حياة
  Compaction المهيأة.
- مع `--max-lines <n>`، يقتطع النص المنسوخ إلى آخر `n` سطرًا
  ويؤرشف النص المنسوخ السابق كملف جانبي `.bak`.
- `--agent <id>`: الوكيل الذي يملك الجلسة؛ مطلوب لمفاتيح `global`.
- `--url` / `--token` / `--password`: تجاوزات اتصال Gateway.
- `--timeout <ms>`: مهلة اختيارية لاستدعاء RPC من جانب العميل بالمللي ثانية.
- `--json`: اطبع حمولة RPC الأولية.

يخرج الأمر برمز غير صفري عندما يُبلغ Gateway عن فشل Compaction أو يتعذر
الوصول إليه، لذا لا تعتبر مهام Cron والبرامج النصية أبدًا أن عدم تنفيذ أي إجراء بصمت نجاحًا.

<Note>
`openclaw agent --message '/compact ...'` **ليس** مسارًا لإجراء Compaction. تُرفض أوامر الشرطة المائلة
الصادرة من CLI بواسطة فحص المرسل المصرّح له؛ وينتهي هذا الاستدعاء برمز غير صفري
مع إرشادات تشير إلى هنا بدلًا من عدم تنفيذ أي إجراء بصمت.
</Note>

### استدعاء RPC ‏sessions.compact

يقبل `openclaw gateway call sessions.compact --params '<json>'` ما يلي:

| الحقل      | النوع        | مطلوب | الوصف                                                |
| ---------- | ----------- | -------- | ---------------------------------------------------------- |
| `key`      | سلسلة نصية      | نعم      | مفتاح الجلسة المراد إجراء Compaction لها (مثل `agent:main:main`).    |
| `agentId`  | سلسلة نصية      | لا       | معرّف الوكيل الذي يملك الجلسة (لمفاتيح `global`).        |
| `maxLines` | عدد صحيح ≥ 1 | لا       | الاقتطاع إلى آخر N سطرًا بدلًا من التلخيص باستخدام LLM. |

مثال على استجابة التلخيص باستخدام LLM:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

مثال على استجابة الاقتطاع (`--max-lines 200`):

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "archived": "/home/user/.openclaw/agents/main/sessions/transcripts/<id>.jsonl.bak",
  "kept": 200
}
```

## ذو صلة

- [إعداد الجلسة](/ar/gateway/config-agents#session)
- [إدارة الجلسات](/ar/concepts/session)
- [Compaction](/ar/concepts/compaction)
- [مرجع CLI](/ar/cli)

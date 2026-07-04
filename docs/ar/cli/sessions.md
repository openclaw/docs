---
read_when:
    - تريد عرض الجلسات المخزنة والاطلاع على النشاط الأخير
summary: مرجع CLI لـ `openclaw sessions` (عرض الجلسات المخزنة + الاستخدام)
title: الجلسات
x-i18n:
    generated_at: "2026-07-04T20:33:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c24ee8a632998624ee41945b26ace3bfe37cadf9447f7632c373784a9301bde
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

اعرض جلسات المحادثة المخزنة.

قوائم الجلسات ليست فحوصات لحيوية القناة/المزوّد. فهي تعرض صفوف
المحادثات المحفوظة من مخازن الجلسات. يمكن لقناة Discord أو Slack أو Telegram
أو أي قناة أخرى هادئة أن تعيد الاتصال بنجاح من دون إنشاء صف جلسة جديد
إلى أن تتم معالجة رسالة. استخدم `openclaw channels status --probe`،
أو `openclaw status --deep`، أو `openclaw health --verbose` عندما تحتاج إلى
اتصال قناة حي.

استجابات `openclaw sessions` و Gateway `sessions.list` محدودة
افتراضياً حتى لا تتمكن المخازن الكبيرة طويلة العمر من احتكار عملية CLI أو
حلقة أحداث Gateway. يعيد CLI أحدث 100 جلسة افتراضياً؛ مرّر
`--limit <n>` لنافذة أصغر/أكبر أو `--limit all` عندما تحتاج عمداً إلى
المخزن الكامل. تتضمن استجابات JSON الحقول `totalCount` و`limitApplied` و
`hasMore` عندما يحتاج المستدعون إلى إظهار أن هناك صفوفاً إضافية.

يمكن لعملاء RPC تمرير `configuredAgentsOnly: true` للإبقاء على مصدر
الاكتشاف المدمج الواسع مع إرجاع الصفوف الخاصة بالوكلاء الموجودين حالياً في
الإعداد فقط. يستخدم Control UI هذا الوضع افتراضياً حتى لا تظهر مخازن الوكلاء
المحذوفة أو الموجودة على القرص فقط من جديد في عرض الجلسات.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --verbose
openclaw sessions --json
```

اختيار النطاق:

- الافتراضي: مخزن الوكيل الافتراضي المكوّن
- `--verbose`: تسجيل مفصل
- `--agent <id>`: مخزن وكيل مكوّن واحد
- `--all-agents`: تجميع كل مخازن الوكلاء المكوّنة
- `--store <path>`: مسار مخزن صريح (لا يمكن دمجه مع `--agent` أو `--all-agents`)
- `--limit <n|all>`: الحد الأقصى للصفوف المراد إخراجها (الافتراضي `100`؛ يعيد `all` الإخراج الكامل)

تتبّع تقدم المسار النصي القابل للقراءة للجلسات المخزنة:

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

يعرض `openclaw sessions tail` أحداث JSONL الأخيرة للمسار كسطور تقدم مضغوطة. من دون `--session-key`، يتتبّع الجلسات الجارية أولاً، ثم أحدث جلسة مخزنة. يتحكم `--tail <count>` في عدد الأحداث الموجودة التي تُطبع قبل وضع المتابعة؛ الافتراضي هو `80`، و`0` يبدأ من النهاية الحالية. يبقي `--follow` مراقبة ملفات المسار المحددة، بما في ذلك الملفات المنقولة المشار إليها بواسطة `<session>.trajectory-path.json`.

عرض التقدم محافظ عمداً: لا تُطبع نصوص المطالبات ولا وسائط الأدوات ولا نصوص نتائج الأدوات. تعرض استدعاءات الأدوات اسم الأداة مع `{...redacted...}`؛ وتعرض نتائج الأدوات حالة مثل `ok` أو `error` أو `done`؛ وتعرض أسطر إكمال النموذج المزوّد/النموذج والحالة النهائية.

صدّر حزمة مسار لجلسة مخزنة:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

هذا هو مسار الأمر الذي يستخدمه أمر الشرطة المائلة `/export-trajectory` بعد
أن يوافق المالك على طلب exec. يُحل دليل الإخراج دائماً
داخل `.openclaw/trajectory-exports/` ضمن مساحة العمل المحددة.

يقرأ `openclaw sessions --all-agents` مخازن الوكلاء المكوّنة. أما اكتشاف جلسات Gateway و ACP
فهو أوسع: فهو يتضمن أيضاً المخازن الموجودة على القرص فقط تحت
جذر `agents/` الافتراضي أو جذر `session.store` المعتمد على قالب. يجب أن
تُحل هذه المخازن المكتشفة إلى ملفات `sessions.json` عادية داخل
جذر الوكيل؛ ويتم تخطي الروابط الرمزية والمسارات الخارجة عن الجذر.

أمثلة JSON:

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
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## صيانة التنظيف

شغّل الصيانة الآن (بدلاً من انتظار دورة الكتابة التالية):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

يستخدم `openclaw sessions cleanup` إعدادات `session.maintenance` من الإعداد:

- ملاحظة النطاق: يحافظ `openclaw sessions cleanup` على مخازن الجلسات، والنصوص المنسوخة، وملفات المسار الجانبية. لا يشذّب سجل تشغيل Cron، الذي يديره `cron.runLog.keepLines` في [إعداد Cron](/ar/automation/cron-jobs#configuration) والمشروح في [صيانة Cron](/ar/automation/cron-jobs#maintenance).
- يشذّب التنظيف أيضاً النصوص المنسوخة الأساسية غير المشار إليها، ونقاط تحقق Compaction، وملفات المسار الجانبية الأقدم من `session.maintenance.pruneAfter`؛ وتُحفظ الملفات التي ما زال `sessions.json` يشير إليها.
- يبلّغ التنظيف عن تنظيف اختبارات تشغيل نموذج Gateway قصيرة العمر بشكل منفصل باسم `modelRunPruned`. يطابق هذا فقط المفاتيح الصريحة الصارمة بالشكل `agent:*:explicit:model-run-<uuid>`. مدة الاحتفاظ الثابتة هي `24h`، لكنها مقيّدة بالضغط: فهي لا تزيل صفوف الاختبار القديمة إلا عند بلوغ ضغط صيانة/حد إدخالات الجلسات. عندما يعمل، يحدث تنظيف تشغيل النموذج قبل التنظيف العام للقديم وقبل التحديد بالسقف.

- `--dry-run`: معاينة عدد الإدخالات التي ستُشذّب/تُقيّد بالسقف من دون كتابة.
  - في وضع النص، يطبع dry-run جدول إجراءات لكل جلسة (`Action` و`Key` و`Age` و`Model` و`Flags`) إضافة إلى ملخص مجمّع حسب تسمية الجلسة حتى تتمكن من رؤية ما سيُحفظ مقابل ما سيُزال.
- `--enforce`: طبّق الصيانة حتى عندما يكون `session.maintenance.mode` هو `warn`.
- `--fix-missing`: أزل الإدخالات التي تكون ملفات نصوصها المنسوخة مفقودة أو تحتوي على ترويسة فقط/فارغة، حتى إن لم تكن ستخرج عادةً بسبب العمر/العدد بعد.
- `--fix-dm-scope`: عندما يكون `session.dmScope` هو `main`، قم بإحالة صفوف direct-DM القديمة المفتاحية بالنظير إلى التقاعد والتي خلّفتها توجيهات `per-peer` أو `per-channel-peer` أو `per-account-channel-peer` السابقة. استخدم `--dry-run` أولاً؛ يؤدي تطبيق التنظيف إلى إزالة تلك الصفوف من `sessions.json` ويحفظ نصوصها المنسوخة كأرشيفات محذوفة.
- `--active-key <key>`: احم مفتاحاً نشطاً محدداً من الإخلاء بسبب ميزانية القرص. تُبقي صيانة العمر/العدد/ميزانية القرص أيضاً مؤشرات المحادثة الخارجية الدائمة، مثل جلسات المجموعات وجلسات الدردشة محددة الخيط.
- `--agent <id>`: شغّل التنظيف لمخزن وكيل مكوّن واحد.
- `--all-agents`: شغّل التنظيف لكل مخازن الوكلاء المكوّنة.
- `--store <path>`: شغّل على ملف `sessions.json` محدد.
- `--json`: اطبع ملخص JSON. مع `--all-agents`، يتضمن الإخراج ملخصاً واحداً لكل مخزن.

عندما يكون Gateway قابلاً للوصول، يُرسل التنظيف غير الجاف لمخازن الوكلاء المكوّنة
عبر Gateway حتى يشارك كاتب مخزن الجلسات نفسه الذي تستخدمه حركة وقت التشغيل.
استخدم `--store <path>` للإصلاح الصريح دون اتصال لملف مخزن.

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

استعد ميزانية السياق لجلسة عالقة أو كبيرة جداً. `openclaw sessions compact <key>` هو الغلاف الأساسي حول Gateway RPC `sessions.compact` ويتطلب Gateway قيد التشغيل.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- من دون `--max-lines`، يلخص Gateway النص المنسوخ باستخدام LLM. لا يفرض CLI موعداً نهائياً من جهة العميل افتراضياً؛ يملك Gateway دورة حياة Compaction المكوّنة.
- مع `--max-lines <n>`، يقتطع إلى آخر `n` سطور من النص المنسوخ ويؤرشف النص السابق كملف جانبي `.bak`.
- `--agent <id>`: الوكيل الذي يملك الجلسة؛ مطلوب لمفاتيح `global`.
- `--url` / `--token` / `--password`: تجاوزات اتصال Gateway.
- `--timeout <ms>`: مهلة اختيارية من جهة العميل لـ RPC بالميلي ثانية.
- `--json`: اطبع حمولة RPC الخام.

يخرج الأمر برمز غير صفري عندما يبلّغ Gateway عن فشل Compaction أو يكون غير قابل للوصول، حتى لا تخلط Crons والسكربتات أبداً بين عدم تنفيذ صامت ونجاح.

> ملاحظة: `openclaw agent --message '/compact ...'` **ليس** مسار Compaction. تُرفض أوامر الشرطة المائلة من CLI بواسطة فحص المرسل المخوّل؛ ويخرج هذا الاستدعاء برمز غير صفري مع إرشاد يشير إلى هنا بدلاً من عدم التنفيذ بصمت.

### sessions.compact RPC

يقبل `openclaw gateway call sessions.compact --params '<json>'`:

| الحقل      | النوع        | مطلوب | الوصف                                                |
| ---------- | ----------- | -------- | ---------------------------------------------------------- |
| `key`      | string      | نعم      | مفتاح الجلسة المراد ضغطها (مثلاً `agent:main:main`).    |
| `agentId`  | string      | لا       | معرّف الوكيل الذي يملك الجلسة (لمفاتيح `global`).        |
| `maxLines` | integer ≥ 1 | لا       | اقتطع إلى آخر N أسطر بدلاً من تلخيص LLM. |

مثال استجابة تلخيص LLM:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

مثال استجابة الاقتطاع (`--max-lines 200`):

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

- إعداد الجلسة: [مرجع الإعداد](/ar/gateway/config-agents#session)
- [مرجع CLI](/ar/cli)
- [إدارة الجلسات](/ar/concepts/session)

---
read_when:
    - تريد سرد الجلسات المخزنة ورؤية النشاط الأخير
summary: مرجع CLI لـ `openclaw sessions` (سرد الجلسات المخزنة + الاستخدام)
title: الجلسات
x-i18n:
    generated_at: "2026-06-27T17:24:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b9454e4b6ef925f8f90b5e8beceb6bea6404539f460cb78bcf82e241dff168d
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

يسرد جلسات المحادثة المخزنة.

قوائم الجلسات ليست فحوصات حيوية للقناة/المزوّد. إنها تعرض صفوف المحادثات المستمرة من مخازن الجلسات. يمكن لقناة Discord أو Slack أو Telegram أو قناة أخرى هادئة أن تعيد الاتصال بنجاح دون إنشاء صف جلسة جديد حتى تتم معالجة رسالة. استخدم `openclaw channels status --probe` أو `openclaw status --deep` أو `openclaw health --verbose` عندما تحتاج إلى اتصال حي بالقناة.

تكون استجابات `openclaw sessions` وGateway `sessions.list` محدودة افتراضيًا حتى لا تحتكر المخازن الكبيرة طويلة العمر عملية CLI أو حلقة أحداث Gateway. تُرجع CLI أحدث 100 جلسة افتراضيًا؛ مرّر `--limit <n>` لنافذة أصغر/أكبر أو `--limit all` عندما تحتاج عمدًا إلى المخزن الكامل. تتضمن استجابات JSON الحقول `totalCount` و`limitApplied` و`hasMore` عندما يحتاج المستدعون إلى إظهار وجود صفوف إضافية.

يمكن لعملاء RPC تمرير `configuredAgentsOnly: true` للإبقاء على مصدر الاكتشاف المدمج الواسع، مع إرجاع الصفوف الخاصة بالوكلاء الموجودين حاليًا في الإعدادات فقط. تستخدم Control UI هذا الوضع افتراضيًا حتى لا تظهر مخازن الوكلاء المحذوفة أو الموجودة على القرص فقط من جديد في عرض Sessions.

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

- default: مخزن الوكيل الافتراضي المكوّن
- `--verbose`: تسجيل تفصيلي
- `--agent <id>`: مخزن وكيل مكوّن واحد
- `--all-agents`: تجميع جميع مخازن الوكلاء المكوّنة
- `--store <path>`: مسار مخزن صريح (لا يمكن دمجه مع `--agent` أو `--all-agents`)
- `--limit <n|all>`: الحد الأقصى للصفوف المخرجة (الافتراضي `100`؛ يعيد `all` الإخراج الكامل)

تابع تقدم المسار القابل للقراءة بشريًا للجلسات المخزنة:

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

يعرض `openclaw sessions tail` أحداث JSONL الحديثة للمسار كسطور تقدم موجزة. من دون `--session-key`، يتابع الجلسات قيد التشغيل أولًا، ثم أحدث جلسة مخزنة. يتحكم `--tail <count>` في عدد الأحداث الموجودة التي تُطبع قبل وضع المتابعة؛ الافتراضي هو `80`، و`0` يبدأ من النهاية الحالية. يبقي `--follow` مراقبة ملفات المسار المحددة، بما في ذلك الملفات المنقولة المشار إليها بواسطة `<session>.trajectory-path.json`.

عرض التقدم محافظ عمدًا: لا تُطبع نصوص المطالبات ولا وسائط الأدوات ولا نصوص نتائج الأدوات. تُظهر استدعاءات الأدوات اسم الأداة مع `{...redacted...}`؛ وتُظهر نتائج الأدوات حالة مثل `ok` أو `error` أو `done`؛ وتُظهر سطور اكتمال النموذج المزوّد/النموذج والحالة النهائية.

صدّر حزمة مسار لجلسة مخزنة:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

هذا هو مسار الأمر الذي يستخدمه أمر الشرطة المائلة `/export-trajectory` بعد أن يوافق المالك على طلب التنفيذ. يُحل دليل الإخراج دائمًا داخل `.openclaw/trajectory-exports/` ضمن مساحة العمل المحددة.

يقرأ `openclaw sessions --all-agents` مخازن الوكلاء المكوّنة. اكتشاف جلسات Gateway وACP أوسع: فهو يتضمن أيضًا المخازن الموجودة على القرص فقط التي تُعثر عليها تحت جذر `agents/` الافتراضي أو جذر `session.store` القالبي. يجب أن تتحلل تلك المخازن المكتشفة إلى ملفات `sessions.json` عادية داخل جذر الوكيل؛ ويتم تخطي الروابط الرمزية والمسارات خارج الجذر.

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

شغّل الصيانة الآن (بدلًا من انتظار دورة الكتابة التالية):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

يستخدم `openclaw sessions cleanup` إعدادات `session.maintenance` من الإعدادات:

- ملاحظة النطاق: يصون `openclaw sessions cleanup` مخازن الجلسات والنصوص النصية وملفات المسار الجانبية. لا يقلّم سجل تشغيل Cron، إذ يديره `cron.runLog.keepLines` في [إعداد Cron](/ar/automation/cron-jobs#configuration) ويُشرح في [صيانة Cron](/ar/automation/cron-jobs#maintenance).
- يقلّم التنظيف أيضًا النصوص النصية الأساسية غير المشار إليها، ونقاط تحقق Compaction، وملفات المسار الجانبية الأقدم من `session.maintenance.pruneAfter`؛ وتُحفظ الملفات التي ما زالت مشارًا إليها بواسطة `sessions.json`.
- يبلّغ التنظيف عن تنظيف مجسّات تشغيل نموذج Gateway القصيرة العمر بشكل منفصل باسم `modelRunPruned`. يطابق هذا فقط المفاتيح الصريحة الصارمة بالشكل `agent:*:explicit:model-run-<uuid>`. مدة الاحتفاظ الثابتة هي `24h`، لكنها مقيّدة بالضغط: فهي لا تزيل صفوف المجسّات القديمة إلا عند بلوغ ضغط صيانة/حد إدخالات الجلسات. عند تشغيله، يحدث تنظيف تشغيل النموذج قبل التنظيف العام للعناصر القديمة وتطبيق الحدود.

- `--dry-run`: معاينة عدد الإدخالات التي ستُقلّم/تُحدّ دون كتابة.
  - في وضع النص، يطبع التشغيل الجاف جدول إجراءات لكل جلسة (`Action`، `Key`، `Age`، `Model`، `Flags`) إضافةً إلى ملخص مجمّع حسب تسمية الجلسة حتى ترى ما سيُبقى مقابل ما سيُزال.
- `--enforce`: تطبيق الصيانة حتى عندما يكون `session.maintenance.mode` هو `warn`.
- `--fix-missing`: إزالة الإدخالات التي تكون ملفات نصوصها النصية مفقودة أو تحتوي على ترويسة فقط/فارغة، حتى إذا لم تكن ستنتهي عادةً بسبب العمر/العدد بعد.
- `--fix-dm-scope`: عندما يكون `session.dmScope` هو `main`، أوقف صفوف الرسائل المباشرة القديمة ذات مفاتيح النظراء التي خلّفها توجيه `per-peer` أو `per-channel-peer` أو `per-account-channel-peer` السابق. استخدم `--dry-run` أولًا؛ يؤدي تطبيق التنظيف إلى إزالة تلك الصفوف من `sessions.json` وحفظ نصوصها النصية كأرشيفات محذوفة.
- `--active-key <key>`: حماية مفتاح نشط محدد من الإخلاء بسبب ميزانية القرص. تُحفظ أيضًا مؤشرات المحادثات الخارجية المتينة، مثل جلسات المجموعات وجلسات الدردشة محددة الخيط، بواسطة صيانة العمر/العدد/ميزانية القرص.
- `--agent <id>`: تشغيل التنظيف لمخزن وكيل مكوّن واحد.
- `--all-agents`: تشغيل التنظيف لجميع مخازن الوكلاء المكوّنة.
- `--store <path>`: التشغيل على ملف `sessions.json` محدد.
- `--json`: طباعة ملخص JSON. مع `--all-agents`، يتضمن الإخراج ملخصًا واحدًا لكل مخزن.

عندما يكون Gateway قابلًا للوصول، يُرسل التنظيف غير الجاف لمخازن الوكلاء المكوّنة عبر Gateway حتى يشارك كاتب مخزن الجلسات نفسه الذي تستخدمه حركة وقت التشغيل. استخدم `--store <path>` للإصلاح الصريح دون اتصال لملف مخزن.

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

استعد ميزانية السياق لجلسة عالقة أو متضخمة. `openclaw sessions compact <key>` هو الغلاف من الدرجة الأولى حول RPC الخاص بـGateway `sessions.compact` ويتطلب Gateway قيد التشغيل.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- من دون `--max-lines`، يلخّص Gateway النص النصي باستخدام LLM. قد يكون هذا بطيئًا، لذلك فإن `--timeout` الافتراضي هو `180000` مللي ثانية.
- مع `--max-lines <n>`، يقتطع إلى آخر `n` سطور من النص النصي ويؤرشف النص السابق كملف جانبي `.bak`.
- `--agent <id>`: الوكيل الذي يملك الجلسة؛ مطلوب لمفاتيح `global`.
- `--url` / `--token` / `--password`: تجاوزات اتصال Gateway.
- `--timeout <ms>`: مهلة RPC بالمللي ثانية.
- `--json`: طباعة حمولة RPC الخام.

يخرج الأمر برمز غير صفري عندما يبلّغ Gateway عن فشل Compaction أو يتعذر الوصول إليه، بحيث لا تخلط crons والسكربتات أبدًا بين عدم تنفيذ صامت والنجاح.

> ملاحظة: `openclaw agent --message '/compact ...'` **ليس** مسار Compaction. ترفض فحوصات المرسل المخوّل أوامر الشرطة المائلة من CLI؛ ويخرج ذلك الاستدعاء برمز غير صفري مع إرشاد يشير إلى هنا بدلًا من عدم التنفيذ بصمت.

### RPC الخاص بـsessions.compact

يقبل `openclaw gateway call sessions.compact --params '<json>'`:

| الحقل      | النوع        | مطلوب | الوصف                                                |
| ---------- | ----------- | -------- | ---------------------------------------------------------- |
| `key`      | سلسلة نصية      | نعم      | مفتاح الجلسة المطلوب ضغطها (مثلًا `agent:main:main`).    |
| `agentId`  | سلسلة نصية      | لا       | معرّف الوكيل الذي يملك الجلسة (لمفاتيح `global`).        |
| `maxLines` | عدد صحيح ≥ 1 | لا       | الاقتطاع إلى آخر N سطور بدلًا من تلخيص LLM. |

مثال على استجابة تلخيص LLM:

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

- إعداد الجلسة: [مرجع الإعدادات](/ar/gateway/config-agents#session)
- [مرجع CLI](/ar/cli)
- [إدارة الجلسات](/ar/concepts/session)

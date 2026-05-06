---
read_when:
    - إعداد تكاملات بيئات التطوير المتكاملة المستندة إلى ACP
    - استكشاف أخطاء توجيه جلسات ACP إلى Gateway وإصلاحها
summary: شغّل جسر ACP لتكاملات IDE
title: ACP
x-i18n:
    generated_at: "2026-05-06T07:45:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: c91de534078b4d49b2776d7a85264d2ba8d7bdd7a3cd715ce615b4b4b26c6528
    source_path: cli/acp.md
    workflow: 16
---

شغّل جسر [بروتوكول عميل الوكيل (ACP)](https://agentclientprotocol.com/) الذي يتحدث إلى OpenClaw Gateway.

يتحدث هذا الأمر ACP عبر stdio من أجل بيئات IDE ويمرر المطالبات إلى Gateway
عبر WebSocket. ويحافظ على ربط جلسات ACP بمفاتيح جلسات Gateway.

`openclaw acp` هو جسر ACP مدعوم من Gateway، وليس وقت تشغيل محرر كاملًا
أصليًا لـ ACP. يركز على توجيه الجلسات، وتسليم المطالبات، وتحديثات البث
الأساسية.

إذا أردت أن يتحدث عميل MCP خارجي مباشرةً إلى محادثات قنوات OpenClaw
بدلًا من استضافة جلسة عدة ACP، فاستخدم
[`openclaw mcp serve`](/ar/cli/mcp) بدلًا من ذلك.

## ما لا يمثله هذا

غالبًا ما تُخلط هذه الصفحة مع جلسات عدة ACP.

يعني `openclaw acp`:

- يعمل OpenClaw كخادم ACP
- تتصل بيئة IDE أو عميل ACP بـ OpenClaw
- يمرر OpenClaw ذلك العمل إلى جلسة Gateway

يختلف هذا عن [وكلاء ACP](/ar/tools/acp-agents)، حيث يشغّل OpenClaw عدة
خارجية مثل Codex أو Claude Code من خلال `acpx`.

قاعدة سريعة:

- يريد المحرر/العميل التحدث بـ ACP إلى OpenClaw: استخدم `openclaw acp`
- يجب أن يشغّل OpenClaw Codex/Claude/Gemini كعدة ACP: استخدم `/acp spawn` و[وكلاء ACP](/ar/tools/acp-agents)

## مصفوفة التوافق

| منطقة ACP                                                              | الحالة      | ملاحظات                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | منفّذ | تدفق الجسر الأساسي عبر stdio إلى دردشة/إرسال Gateway + الإجهاض.                                                                                                                                                                                        |
| `listSessions`, أوامر الشرطة المائلة                                        | منفّذ | تعمل قائمة الجلسات مقابل حالة جلسة Gateway؛ وتُعلن الأوامر عبر `available_commands_update`.                                                                                                                                       |
| `loadSession`                                                         | جزئي     | يعيد ربط جلسة ACP بمفتاح جلسة Gateway ويعيد تشغيل سجل نصوص المستخدم/المساعد المخزن. لم يُعد بناء سجل الأدوات/النظام بعد.                                                                                                   |
| محتوى المطالبة (`text`، و`resource` المضمّن، والصور)                  | جزئي     | تُسطّح النصوص/الموارد داخل إدخال الدردشة؛ وتصبح الصور مرفقات Gateway.                                                                                                                                                                 |
| أوضاع الجلسة                                                         | جزئي     | `session/set_mode` مدعوم، ويعرض الجسر عناصر تحكم أولية للجلسة مدعومة من Gateway لمستوى التفكير، وإسهاب الأدوات، والاستدلال، وتفاصيل الاستخدام، والإجراءات المرفوعة. لا تزال أسطح الأوضاع/الإعدادات الأوسع والأصلية لـ ACP خارج النطاق. |
| معلومات الجلسة وتحديثات الاستخدام                                        | جزئي     | يصدر الجسر إشعارات `session_info_update` و`usage_update` بأفضل جهد من لقطات جلسات Gateway المخزنة مؤقتًا. الاستخدام تقريبي ولا يُرسل إلا عندما تُعلَّم إجماليات رموز Gateway بأنها حديثة.                                        |
| بث الأدوات                                                        | جزئي     | تتضمن أحداث `tool_call` / `tool_call_update` إدخال/إخراجًا خامًا، ومحتوى نصيًا، ومواقع ملفات بأفضل جهد عندما تعرض وسيطات/نتائج أدوات Gateway ذلك. لا تزال الطرفيات المضمّنة والمخرجات الأصلية للفروقات الأكثر ثراءً غير معروضة.                        |
| خوادم MCP لكل جلسة (`mcpServers`)                                | غير مدعوم | يرفض وضع الجسر طلبات خادم MCP لكل جلسة. اضبط MCP على OpenClaw gateway أو الوكيل بدلًا من ذلك.                                                                                                                                     |
| أساليب نظام ملفات العميل (`fs/read_text_file`, `fs/write_text_file`) | غير مدعوم | لا يستدعي الجسر أساليب نظام ملفات عميل ACP.                                                                                                                                                                                          |
| أساليب طرفية العميل (`terminal/*`)                                | غير مدعوم | لا ينشئ الجسر طرفيات عميل ACP ولا يبث معرفات الطرفية عبر استدعاءات الأدوات.                                                                                                                                                       |
| خطط الجلسة / بث التفكير                                     | غير مدعوم | يصدر الجسر حاليًا نص الإخراج وحالة الأدوات، وليس تحديثات خطة ACP أو التفكير.                                                                                                                                                         |

## القيود المعروفة

- يعيد `loadSession` تشغيل سجل نصوص المستخدم والمساعد المخزن، لكنه لا
  يعيد بناء استدعاءات الأدوات التاريخية، أو إشعارات النظام، أو أنواع أحداث
  ACP الأصلية الأكثر ثراءً.
- إذا شارك عدة عملاء ACP مفتاح جلسة Gateway نفسه، فإن توجيه الأحداث والإلغاء
  يكون بأفضل جهد بدلًا من أن يكون معزولًا بصرامة لكل عميل. فضّل جلسات
  `acp:<uuid>` المعزولة الافتراضية عندما تحتاج إلى أدوار محلية نظيفة
  للمحرر.
- تُترجم حالات إيقاف Gateway إلى أسباب إيقاف ACP، لكن ذلك الربط أقل
  تعبيرًا من وقت تشغيل أصلي بالكامل لـ ACP.
- تعرض عناصر تحكم الجلسة الأولية حاليًا مجموعة مركزة من مقابض Gateway:
  مستوى التفكير، وإسهاب الأدوات، والاستدلال، وتفاصيل الاستخدام، والإجراءات
  المرفوعة. لم تُعرض بعد عناصر اختيار النموذج والتحكم بمضيف التنفيذ كخيارات
  إعداد ACP.
- تُشتق `session_info_update` و`usage_update` من لقطات جلسات Gateway،
  وليس من محاسبة وقت تشغيل أصلية حية لـ ACP. الاستخدام تقريبي،
  ولا يحمل بيانات تكلفة، ولا يُصدر إلا عندما يعلّم Gateway بيانات إجمالي
  الرموز بأنها حديثة.
- بيانات متابعة الأدوات تكون بأفضل جهد. يستطيع الجسر إظهار مسارات الملفات
  التي تظهر في وسيطات/نتائج الأدوات المعروفة، لكنه لا يصدر بعد طرفيات ACP
  أو فروقات ملفات مهيكلة.

## الاستخدام

```bash
openclaw acp

# Remote Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Remote Gateway (token from file)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Attach to an existing session key
openclaw acp --session agent:main:main

# Attach by label (must already exist)
openclaw acp --session-label "support inbox"

# Reset the session key before the first prompt
openclaw acp --session agent:main:main --reset-session
```

## عميل ACP (تصحيح الأخطاء)

استخدم عميل ACP المدمج لإجراء فحص سلامة للجسر دون بيئة IDE.
يشغّل جسر ACP ويتيح لك كتابة المطالبات تفاعليًا.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

نموذج الأذونات (وضع تصحيح أخطاء العميل):

- الموافقة التلقائية قائمة على قائمة سماح ولا تنطبق إلا على معرفات أدوات النواة الموثوقة.
- تنحصر الموافقة التلقائية لـ `read` في دليل العمل الحالي (`--cwd` عند تعيينه).
- لا يوافق ACP تلقائيًا إلا على فئات ضيقة للقراءة فقط: استدعاءات `read` محددة النطاق تحت cwd النشط بالإضافة إلى أدوات البحث للقراءة فقط (`search`, `web_search`, `memory_search`). الأدوات غير المعروفة/غير الأساسية، والقراءات خارج النطاق، والأدوات القادرة على التنفيذ، وأدوات مستوى التحكم، والأدوات المعدِّلة، والتدفقات التفاعلية تتطلب دائمًا موافقة صريحة على المطالبة.
- يُعامل `toolCall.kind` المقدم من الخادم كبيانات وصفية غير موثوقة (وليس كمصدر تفويض).
- سياسة جسر ACP هذه منفصلة عن أذونات عدة ACPX. إذا شغّلت OpenClaw من خلال خلفية `acpx`، فإن `plugins.entries.acpx.config.permissionMode=approve-all` هو مفتاح الطوارئ "yolo" لجلسة تلك العدة.

## كيفية استخدام هذا

استخدم ACP عندما تتحدث بيئة IDE (أو عميل آخر) بروتوكول Agent Client Protocol وتريد
منها قيادة جلسة OpenClaw Gateway.

1. تأكد من أن Gateway يعمل (محليًا أو عن بُعد).
2. اضبط هدف Gateway (الإعداد أو الأعلام).
3. وجّه بيئة IDE لديك لتشغيل `openclaw acp` عبر stdio.

مثال إعداد (مستمر):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

مثال تشغيل مباشر (دون كتابة إعداد):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## اختيار الوكلاء

لا يختار ACP الوكلاء مباشرةً. إنه يوجّه حسب مفتاح جلسة Gateway.

استخدم مفاتيح جلسات محددة بنطاق الوكيل لاستهداف وكيل معين:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

تُربط كل جلسة ACP بمفتاح جلسة Gateway واحد. يمكن لوكيل واحد أن يملك جلسات
كثيرة؛ ويفترض ACP افتراضيًا جلسة `acp:<uuid>` معزولة ما لم تتجاوز
المفتاح أو التسمية.

لا تُدعم `mcpServers` لكل جلسة في وضع الجسر. إذا أرسلها عميل ACP أثناء
`newSession` أو `loadSession`، يعيد الجسر خطأ واضحًا بدلًا من تجاهلها
بصمت.

إذا أردت أن ترى الجلسات المدعومة من ACPX أدوات OpenClaw Plugin أو أدوات
مدمجة مختارة مثل `cron`، ففعّل جسور ACPX MCP من جهة gateway بدلًا
من محاولة تمرير `mcpServers` لكل جلسة. راجع
[وكلاء ACP](/ar/tools/acp-agents-setup#plugin-tools-mcp-bridge) و
[جسر أدوات OpenClaw MCP](/ar/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## الاستخدام من `acpx` (Codex، Claude، وعملاء ACP آخرون)

إذا أردت أن يتحدث وكيل برمجة مثل Codex أو Claude Code إلى روبوت
OpenClaw لديك عبر ACP، فاستخدم `acpx` مع هدف `openclaw` المدمج فيه.

التدفق المعتاد:

1. شغّل Gateway وتأكد من أن جسر ACP يستطيع الوصول إليه.
2. وجّه `acpx openclaw` إلى `openclaw acp`.
3. استهدف مفتاح جلسة OpenClaw الذي تريد أن يستخدمه وكيل البرمجة.

أمثلة:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

إذا أردت أن يستهدف `acpx openclaw` Gateway ومفتاح جلسة محددين في كل
مرة، فتجاوز أمر وكيل `openclaw` في `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

بالنسبة إلى نسخة OpenClaw محلية داخل مستودع، استخدم نقطة دخول CLI المباشرة بدلًا من
مشغّل التطوير حتى يبقى دفق ACP نظيفًا. على سبيل المثال:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

هذه هي أسهل طريقة للسماح لـ Codex أو Claude Code أو عميل آخر واعٍ بـ ACP
بسحب معلومات سياقية من وكيل OpenClaw دون كشط طرفية.

## إعداد محرر Zed

أضف وكيل ACP مخصصًا في `~/.config/zed/settings.json` (أو استخدم واجهة إعدادات Zed):

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

لاستهداف Gateway أو وكيل محدد:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

في Zed، افتح لوحة الوكيل وحدد "OpenClaw ACP" لبدء سلسلة محادثة.

## تعيين الجلسات

افتراضيًا، تحصل جلسات ACP على مفتاح جلسة Gateway معزول بالبادئة `acp:`.
لإعادة استخدام جلسة معروفة، مرر مفتاح جلسة أو تسمية:

- `--session <key>`: استخدم مفتاح جلسة Gateway محددًا.
- `--session-label <label>`: حل جلسة موجودة حسب التسمية.
- `--reset-session`: أنشئ معرف جلسة جديدًا لذلك المفتاح (المفتاح نفسه، وسجل محادثة جديد).

إذا كان عميل ACP لديك يدعم البيانات الوصفية، يمكنك التجاوز لكل جلسة:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

تعرّف على المزيد حول مفاتيح الجلسات في [/concepts/session](/ar/concepts/session).

## الخيارات

- `--url <url>`: عنوان WebSocket لـ Gateway (يفترض القيمة gateway.remote.url عند تكوينها).
- `--token <token>`: رمز مصادقة Gateway.
- `--token-file <path>`: اقرأ رمز مصادقة Gateway من ملف.
- `--password <password>`: كلمة مرور مصادقة Gateway.
- `--password-file <path>`: اقرأ كلمة مرور مصادقة Gateway من ملف.
- `--session <key>`: مفتاح الجلسة الافتراضي.
- `--session-label <label>`: تسمية الجلسة الافتراضية المطلوب حلها.
- `--require-existing`: افشل إذا لم يكن مفتاح/تسمية الجلسة موجودًا.
- `--reset-session`: أعد ضبط مفتاح الجلسة قبل أول استخدام.
- `--no-prefix-cwd`: لا تضف دليل العمل كبادئة للمطالبات.
- `--provenance <off|meta|meta+receipt>`: ضمّن بيانات وصفية أو إيصالات لمنشأ ACP.
- `--verbose, -v`: تسجيل تفصيلي إلى stderr.

ملاحظة أمنية:

- يمكن أن يظهر `--token` و`--password` في قوائم العمليات المحلية على بعض الأنظمة.
- فضّل `--token-file`/`--password-file` أو متغيرات البيئة (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- يتبع حل مصادقة Gateway العقد المشترك الذي يستخدمه عملاء Gateway الآخرون:
  - الوضع المحلي: متغيرات البيئة (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> الاحتياطي `gateway.remote.*` فقط عندما يكون `gateway.auth.*` غير معيّن (تفشل SecretRefs المحلية المكوّنة لكن غير المحلولة بشكل مغلق)
  - الوضع البعيد: `gateway.remote.*` مع احتياطي متغيرات البيئة/التكوين حسب قواعد أسبقية الوضع البعيد
  - `--url` آمن للتجاوز ولا يعيد استخدام بيانات اعتماد التكوين/البيئة الضمنية؛ مرر `--token`/`--password` صراحةً (أو صيغ الملفات)
- تتلقى العمليات الفرعية الخلفية لوقت تشغيل ACP القيمة `OPENCLAW_SHELL=acp`، ويمكن استخدامها لقواعد الصدفة/الملف الشخصي الخاصة بالسياق.
- يعيّن `openclaw acp client` القيمة `OPENCLAW_SHELL=acp-client` على عملية الجسر التي يتم إنشاؤها.

### خيارات `acp client`

- `--cwd <dir>`: دليل العمل لجلسة ACP.
- `--server <command>`: أمر خادم ACP (الافتراضي: `openclaw`).
- `--server-args <args...>`: وسيطات إضافية تمرر إلى خادم ACP.
- `--server-verbose`: فعّل التسجيل التفصيلي على خادم ACP.
- `--verbose, -v`: تسجيل تفصيلي للعميل.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [وكلاء ACP](/ar/tools/acp-agents)

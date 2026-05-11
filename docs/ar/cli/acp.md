---
read_when:
    - إعداد تكاملات بيئات التطوير المتكاملة المستندة إلى ACP
    - تصحيح أخطاء توجيه جلسات ACP إلى Gateway
summary: تشغيل جسر ACP لتكاملات IDE
title: ACP
x-i18n:
    generated_at: "2026-05-11T20:26:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c94877b97cf6fb8deb6f16ec3f7225dfe931b78b25ad966d4350bdb20e25d9a
    source_path: cli/acp.md
    workflow: 16
---

شغّل جسر [بروتوكول عميل الوكيل (ACP)](https://agentclientprotocol.com/) الذي يتواصل مع OpenClaw Gateway.

يتحدث هذا الأمر ببروتوكول ACP عبر stdio لأدوات IDE ويمرر المطالبات إلى Gateway
عبر WebSocket. ويحافظ على ربط جلسات ACP بمفاتيح جلسات Gateway.

`openclaw acp` هو جسر ACP مدعوم بـ Gateway، وليس بيئة تشغيل محرر كاملة أصلية
لـ ACP. يركز على توجيه الجلسات، وتسليم المطالبات، وتحديثات البث الأساسية.

إذا أردت أن يتواصل عميل MCP خارجي مباشرة مع محادثات قنوات OpenClaw
بدلا من استضافة جلسة حزام ACP، فاستخدم
[`openclaw mcp serve`](/ar/cli/mcp) بدلا من ذلك.

## ما ليس عليه هذا

غالبا ما يحدث خلط بين هذه الصفحة وجلسات حزام ACP.

يعني `openclaw acp` ما يلي:

- يعمل OpenClaw كخادم ACP
- تتصل أداة IDE أو عميل ACP بـ OpenClaw
- يمرر OpenClaw ذلك العمل إلى جلسة Gateway

يختلف هذا عن [وكلاء ACP](/ar/tools/acp-agents)، حيث يشغل OpenClaw حزاما
خارجيا مثل Codex أو Claude Code عبر `acpx`.

قاعدة سريعة:

- يريد المحرر/العميل التحدث ببروتوكول ACP إلى OpenClaw: استخدم `openclaw acp`
- يجب أن يشغل OpenClaw Codex/Claude/Gemini كحزام ACP: استخدم `/acp spawn` و[وكلاء ACP](/ar/tools/acp-agents)

## مصفوفة التوافق

| مجال ACP                                                              | الحالة      | ملاحظات                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | منفذ | تدفق الجسر الأساسي عبر stdio إلى دردشة/إرسال Gateway + الإلغاء.                                                                                                                                                                                        |
| `listSessions`, أوامر الشرطة المائلة                                        | منفذ | تعمل قائمة الجلسات مقابل حالة جلسات Gateway مع ترقيم صفحات بمؤشر محدود وتصفية `cwd` عندما تحمل صفوف جلسات Gateway بيانات وصفية لمساحة العمل؛ وتعلن الأوامر عبر `available_commands_update`.                                |
| بيانات وصفية لتسلسل نسب الجلسة                                              | منفذ | تتضمن قوائم الجلسات ولقطات معلومات الجلسة تسلسل نسب الوالد والابن في OpenClaw داخل `_meta` حتى يتمكن عملاء ACP من عرض رسوم بيانية للوكلاء الفرعيين دون قنوات جانبية خاصة في Gateway.                                                                |
| `resumeSession`, `closeSession`                                       | منفذ | تعيد الاستئنافات ربط جلسة ACP بجلسة Gateway موجودة دون إعادة تشغيل السجل. يلغي الإغلاق عمل الجسر النشط، ويحل المطالبات المعلقة على أنها ملغاة، ويحرر حالة جلسة الجسر.                                              |
| `loadSession`                                                         | جزئي     | يعيد ربط جلسة ACP بمفتاح جلسة Gateway ويعيد تشغيل سجل أحداث ACP للجلسات التي أنشأها الجسر. تعود الجلسات الأقدم/بلا سجل إلى نص المستخدم/المساعد المخزن.                                                             |
| محتوى المطالبة (`text`، `resource` مضمن، الصور)                  | جزئي     | يتم تسطيح النص/الموارد في إدخال الدردشة؛ وتصبح الصور مرفقات Gateway.                                                                                                                                                                 |
| أوضاع الجلسة                                                         | جزئي     | `session/set_mode` مدعوم، ويعرض الجسر عناصر تحكم أولية مدعومة بـ Gateway للجلسة لمستوى التفكير، وإسهاب الأدوات، والاستدلال، وتفاصيل الاستخدام، والإجراءات المرتفعة. ما زالت أسطح الوضع/التكوين الأوسع الأصلية لـ ACP خارج النطاق. |
| معلومات الجلسة وتحديثات الاستخدام                                        | جزئي     | يصدر الجسر إشعارات `session_info_update` و`usage_update` بأفضل جهد من لقطات جلسات Gateway المخزنة مؤقتا. الاستخدام تقريبي ولا يرسل إلا عندما تكون إجماليات رموز Gateway مميزة بأنها حديثة.                                        |
| بث الأدوات                                                        | جزئي     | تتضمن أحداث `tool_call` / `tool_call_update` الإدخال/الإخراج الخام، ومحتوى النص، ومواقع الملفات بأفضل جهد عندما تكشف وسائط/نتائج أدوات Gateway عنها. لا تزال الطرفيات المضمنة والمخرجات الأصلية الأكثر ثراء للفروقات غير مكشوفة.                        |
| موافقات التنفيذ                                                        | جزئي     | يتم تمرير مطالبات موافقة تنفيذ Gateway أثناء دورات مطالبات ACP النشطة إلى عميل ACP باستخدام `session/request_permission`.                                                                                                                    |
| خوادم MCP لكل جلسة (`mcpServers`)                                | غير مدعوم | يرفض وضع الجسر طلبات خادم MCP لكل جلسة. كوّن MCP على OpenClaw Gateway أو الوكيل بدلا من ذلك.                                                                                                                                     |
| طرق نظام ملفات العميل (`fs/read_text_file`, `fs/write_text_file`) | غير مدعوم | لا يستدعي الجسر طرق نظام ملفات عميل ACP.                                                                                                                                                                                          |
| طرق طرفية العميل (`terminal/*`)                                | غير مدعوم | لا ينشئ الجسر طرفيات عميل ACP ولا يبث معرفات الطرفية عبر استدعاءات الأدوات.                                                                                                                                                       |
| خطط الجلسة / بث التفكير                                     | غير مدعوم | يصدر الجسر حاليا نص الإخراج وحالة الأداة، وليس تحديثات خطط ACP أو التفكير.                                                                                                                                                         |

## القيود المعروفة

- يمكن لـ `loadSession` إعادة تشغيل سجل أحداث ACP الكامل فقط للجلسات
  التي أنشأها الجسر. ما زالت الجلسات الأقدم/بلا سجل تستخدم احتياطيا
  للنسخة النصية ولا تعيد بناء استدعاءات الأدوات أو الإشعارات النظامية التاريخية.
- إذا شارك عدة عملاء ACP مفتاح جلسة Gateway نفسه، يكون توجيه الأحداث والإلغاء
  بأفضل جهد بدلا من عزله بصرامة لكل عميل. فضّل جلسات
  `acp:<uuid>` المعزولة الافتراضية عندما تحتاج إلى أدوار محرر محلية
  نظيفة.
- تتم ترجمة حالات إيقاف Gateway إلى أسباب إيقاف ACP، لكن ذلك الربط
  أقل تعبيرا من بيئة تشغيل أصلية بالكامل لـ ACP.
- تعرض عناصر تحكم الجلسة الأولية حاليا مجموعة مركزة من مقابض Gateway:
  مستوى التفكير، وإسهاب الأدوات، والاستدلال، وتفاصيل الاستخدام، والإجراءات
  المرتفعة. لم يتم بعد كشف اختيار النموذج وعناصر تحكم مضيف التنفيذ كخيارات
  تكوين ACP.
- يتم اشتقاق `session_info_update` و`usage_update` من لقطات جلسات Gateway،
  وليس من محاسبة بيئة تشغيل أصلية مباشرة لـ ACP. الاستخدام تقريبي،
  ولا يحمل بيانات تكلفة، ولا يصدر إلا عندما يميز Gateway بيانات إجمالي الرموز
  بأنها حديثة.
- بيانات متابعة الأدوات بأفضل جهد. يمكن للجسر إظهار مسارات الملفات التي
  تظهر في وسائط/نتائج الأدوات المعروفة، لكنه لا يصدر بعد طرفيات ACP أو
  فروقات ملفات منظمة.
- يقتصر تمرير موافقة التنفيذ على دورة مطالبة ACP النشطة؛ ويتم تجاهل الموافقات
  من جلسات Gateway الأخرى.

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

استخدم عميل ACP المضمن للتحقق السريع من سلامة الجسر دون أداة IDE.
يشغل جسر ACP ويتيح لك كتابة المطالبات تفاعليا.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

نموذج الأذونات (وضع تصحيح أخطاء العميل):

- تعتمد الموافقة التلقائية على قائمة سماح ولا تنطبق إلا على معرفات أدوات النواة الموثوقة.
- تقتصر الموافقة التلقائية لـ `read` على دليل العمل الحالي (`--cwd` عند ضبطه).
- لا يوافق ACP تلقائيا إلا على فئات ضيقة للقراءة فقط: استدعاءات `read` ذات النطاق ضمن cwd النشط بالإضافة إلى أدوات البحث للقراءة فقط (`search`, `web_search`, `memory_search`). الأدوات المجهولة/غير الأساسية، والقراءات خارج النطاق، والأدوات القادرة على التنفيذ، وأدوات مستوى التحكم، والأدوات المعدلة، والتدفقات التفاعلية تتطلب دائما موافقة صريحة على المطالبة.
- يتم التعامل مع `toolCall.kind` المقدم من الخادم كبيانات وصفية غير موثوقة (وليس كمصدر تفويض).
- سياسة جسر ACP هذه منفصلة عن أذونات حزام ACPX. إذا شغلت OpenClaw عبر خلفية `acpx`، فإن `plugins.entries.acpx.config.permissionMode=approve-all` هو مفتاح الطوارئ "yolo" لجلسة الحزام تلك.

## اختبار دخان البروتوكول

لتصحيح الأخطاء على مستوى البروتوكول، ابدأ Gateway بحالة معزولة وقُد
`openclaw acp` عبر stdio باستخدام عميل ACP JSON-RPC. غطِّ `initialize`،
و`session/new`، و`session/list` مع `cwd` مطلق، و`session/resume`،
و`session/close`، والإغلاق المكرر، والاستئناف المفقود.

يجب أن يتضمن الإثبات إمكانات دورة الحياة المعلن عنها، وصف جلسة مدعوما بـ Gateway،
وإشعارات التحديث، وسجل `sessions.list` في Gateway:

```json
{
  "initialize": {
    "protocolVersion": 1,
    "agentCapabilities": {
      "sessionCapabilities": {
        "list": {},
        "resume": {},
        "close": {}
      }
    }
  },
  "listSessions": {
    "sessions": [
      {
        "sessionId": "agent:main:acp-smoke",
        "cwd": "/path/to/workspace",
        "_meta": {
          "sessionKey": "agent:main:acp-smoke",
          "kind": "direct"
        }
      }
    ],
    "nextCursor": null
  },
  "notifications": ["session_info_update", "available_commands_update", "usage_update"],
  "gatewayLogTail": ["[gateway] ready", "[ws] ⇄ res ✓ sessions.list 305ms"]
}
```

تجنب استخدام `openclaw gateway call sessions.list` كإثبات ACP الوحيد. قد
يطلب مسار CLI هذا ترقية نطاق مشغل برمز حديث؛ يتم إثبات صحة جسر ACP
بإطارات stdio الخاصة بـ ACP بالإضافة إلى سجل `sessions.list` في Gateway.

## كيفية استخدام هذا

استخدم ACP عندما تتحدث أداة IDE (أو عميل آخر) ببروتوكول عميل الوكيل وتريد
منها قيادة جلسة OpenClaw Gateway.

1. تأكد من أن Gateway يعمل (محليا أو عن بعد).
2. كوّن هدف Gateway (التكوين أو الأعلام).
3. وجّه أداة IDE لديك لتشغيل `openclaw acp` عبر stdio.

مثال تكوين (مستمر):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

مثال تشغيل مباشر (دون كتابة تكوين):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## اختيار الوكلاء

لا يختار ACP الوكلاء مباشرة. إنه يوجه حسب مفتاح جلسة Gateway.

استخدم مفاتيح جلسات ذات نطاق وكيل لاستهداف وكيل محدد:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

ترتبط كل جلسة ACP بمفتاح جلسة Gateway واحد. يمكن أن يكون للوكيل الواحد عدة
جلسات؛ ويستخدم ACP افتراضيًا جلسة `acp:<uuid>` معزولة ما لم تتجاوز
المفتاح أو التسمية.

لا تُدعم `mcpServers` لكل جلسة في وضع الجسر. إذا أرسلها عميل ACP
أثناء `newSession` أو `loadSession`، فسيعيد الجسر خطأ واضحًا
بدلًا من تجاهلها بصمت.

إذا أردت أن ترى الجلسات المدعومة بـ ACPX أدوات Plugin في OpenClaw أو
أدوات مدمجة محددة مثل `cron`، فمكّن جسور ACPX MCP على جانب Gateway بدلًا
من محاولة تمرير `mcpServers` لكل جلسة. راجع
[وكلاء ACP](/ar/tools/acp-agents-setup#plugin-tools-mcp-bridge) و
[جسر MCP لأدوات OpenClaw](/ar/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## الاستخدام من `acpx` (Codex وClaude وعملاء ACP آخرون)

إذا أردت أن يتحدث وكيل برمجة مثل Codex أو Claude Code مع روبوت
OpenClaw عبر ACP، فاستخدم `acpx` مع هدف `openclaw` المدمج فيه.

التدفق المعتاد:

1. شغّل Gateway وتأكد من أن جسر ACP يمكنه الوصول إليه.
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

إذا أردت أن يستهدف `acpx openclaw` Gateway محددًا ومفتاح جلسة محددًا في كل
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
مشغّل التطوير حتى يبقى تدفق ACP نظيفًا. على سبيل المثال:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

هذه هي أسهل طريقة للسماح لـ Codex أو Claude Code أو عميل آخر يدعم ACP
بسحب المعلومات السياقية من وكيل OpenClaw دون كشط طرفية.

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

## ربط الجلسات

افتراضيًا، تحصل جلسات ACP على مفتاح جلسة Gateway معزول ببادئة `acp:`.
لإعادة استخدام جلسة معروفة، مرّر مفتاح جلسة أو تسمية:

- `--session <key>`: استخدم مفتاح جلسة Gateway محددًا.
- `--session-label <label>`: حلّ جلسة موجودة حسب التسمية.
- `--reset-session`: أنشئ معرّف جلسة جديدًا لهذا المفتاح (المفتاح نفسه، ونص جلسة جديد).

إذا كان عميل ACP لديك يدعم البيانات الوصفية، فيمكنك التجاوز لكل جلسة:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

تعرّف على المزيد عن مفاتيح الجلسات في [/concepts/session](/ar/concepts/session).

## الخيارات

- `--url <url>`: عنوان URL لـ Gateway WebSocket (يكون افتراضيًا gateway.remote.url عند تكوينه).
- `--token <token>`: رمز مصادقة Gateway.
- `--token-file <path>`: قراءة رمز مصادقة Gateway من ملف.
- `--password <password>`: كلمة مرور مصادقة Gateway.
- `--password-file <path>`: قراءة كلمة مرور مصادقة Gateway من ملف.
- `--session <key>`: مفتاح الجلسة الافتراضي.
- `--session-label <label>`: تسمية الجلسة الافتراضية المطلوب حلها.
- `--require-existing`: الإخفاق إذا لم يكن مفتاح/تسمية الجلسة موجودًا.
- `--reset-session`: إعادة ضبط مفتاح الجلسة قبل أول استخدام.
- `--no-prefix-cwd`: عدم إضافة دليل العمل كبادئة للمطالبات.
- `--provenance <off|meta|meta+receipt>`: تضمين بيانات وصفية أو إيصالات لمنشأ ACP.
- `--verbose, -v`: تسجيل مفصل إلى stderr.

ملاحظة أمنية:

- يمكن أن يكون `--token` و`--password` مرئيين في قوائم العمليات المحلية على بعض الأنظمة.
- فضّل `--token-file`/`--password-file` أو متغيرات البيئة (`OPENCLAW_GATEWAY_TOKEN`، `OPENCLAW_GATEWAY_PASSWORD`).
- يتبع حل مصادقة Gateway العقد المشترك المستخدم من عملاء Gateway الآخرين:
  - الوضع المحلي: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> الرجوع إلى `gateway.remote.*` فقط عندما لا يكون `gateway.auth.*` معينًا (تفشل SecretRefs المحلية المكوّنة وغير المحلولة بإغلاق آمن)
  - الوضع البعيد: `gateway.remote.*` مع الرجوع إلى env/config وفق قواعد أولوية الوضع البعيد
  - `--url` آمن للتجاوز ولا يعيد استخدام بيانات اعتماد ضمنية من config/env؛ مرّر `--token`/`--password` صريحين (أو بدائل الملفات)
- تتلقى العمليات الفرعية لخلفية تشغيل ACP `OPENCLAW_SHELL=acp`، ويمكن استخدام ذلك لقواعد shell/profile خاصة بالسياق.
- يعيّن `openclaw acp client` القيمة `OPENCLAW_SHELL=acp-client` على عملية الجسر التي يتم إنشاؤها.

### خيارات `acp client`

- `--cwd <dir>`: دليل العمل لجلسة ACP.
- `--server <command>`: أمر خادم ACP (الافتراضي: `openclaw`).
- `--server-args <args...>`: وسيطات إضافية تُمرر إلى خادم ACP.
- `--server-verbose`: تمكين التسجيل المفصل على خادم ACP.
- `--verbose, -v`: تسجيل عميل مفصل.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [وكلاء ACP](/ar/tools/acp-agents)

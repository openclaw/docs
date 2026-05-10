---
read_when:
    - إعداد تكاملات بيئات التطوير المتكاملة المستندة إلى ACP
    - تصحيح أخطاء توجيه جلسات ACP إلى Gateway
summary: تشغيل جسر ACP لتكاملات بيئات التطوير المتكاملة
title: ACP
x-i18n:
    generated_at: "2026-05-10T19:28:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0614b40723ef8374c5bc26d92516ac5725ae2d8ef5e8f4db360b2259879fe320
    source_path: cli/acp.md
    workflow: 16
---

شغّل جسر [بروتوكول عميل الوكيل (ACP)](https://agentclientprotocol.com/) الذي يتخاطب مع OpenClaw Gateway.

يتحدث هذا الأمر ACP عبر stdio لبيئات IDE ويمرر المطالبات إلى Gateway
عبر WebSocket. ويحافظ على ربط جلسات ACP بمفاتيح جلسات Gateway.

`openclaw acp` هو جسر ACP مدعوم بـ Gateway، وليس بيئة تشغيل محرر كاملة
وأصلية لـ ACP. يركز على توجيه الجلسات، وتسليم المطالبات، وتحديثات البث
الأساسية.

إذا كنت تريد من عميل MCP خارجي أن يتحدث مباشرة مع محادثات قنوات OpenClaw
بدلا من استضافة جلسة حزمة ACP، فاستخدم
[`openclaw mcp serve`](/ar/cli/mcp) بدلا من ذلك.

## ما ليس عليه هذا

غالبا ما يحدث خلط بين هذه الصفحة وجلسات حزمة ACP.

يعني `openclaw acp`:

- يعمل OpenClaw كخادم ACP
- تتصل بيئة IDE أو عميل ACP بـ OpenClaw
- يمرر OpenClaw هذا العمل إلى جلسة Gateway

وهذا يختلف عن [وكلاء ACP](/ar/tools/acp-agents)، حيث يشغّل OpenClaw
حزمة خارجية مثل Codex أو Claude Code عبر `acpx`.

قاعدة سريعة:

- يريد المحرر/العميل التحدث بـ ACP إلى OpenClaw: استخدم `openclaw acp`
- يجب أن يطلق OpenClaw Codex/Claude/Gemini كحزمة ACP: استخدم `/acp spawn` و[وكلاء ACP](/ar/tools/acp-agents)

## مصفوفة التوافق

| مجال ACP                                                              | الحالة      | ملاحظات                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | منفذ | تدفق الجسر الأساسي عبر stdio إلى دردشة/إرسال Gateway مع الإلغاء.                                                                                                                                                                                        |
| `listSessions`, أوامر الشرطة المائلة                                        | منفذ | تعمل قائمة الجلسات مقابل حالة جلسات Gateway مع ترقيم صفحات بمؤشر محدود وتصفية `cwd` حيث تحمل صفوف جلسات Gateway بيانات وصفية لمساحة العمل؛ ويتم الإعلان عن الأوامر عبر `available_commands_update`.                                |
| `resumeSession`, `closeSession`                                       | منفذ | تعيد الاستئناف ربط جلسة ACP بجلسة Gateway موجودة من دون إعادة تشغيل السجل. ويلغي الإغلاق عمل الجسر النشط، ويحل المطالبات المعلقة باعتبارها ملغاة، ويحرر حالة جلسة الجسر.                                              |
| `loadSession`                                                         | جزئي     | يعيد ربط جلسة ACP بمفتاح جلسة Gateway ويعيد تشغيل سجل أحداث ACP للجلسات التي أنشأها الجسر. تعود الجلسات الأقدم/بلا سجل أحداث إلى نص المستخدم/المساعد المخزن.                                                             |
| محتوى المطالبة (`text`, `resource` مضمّن، الصور)                  | جزئي     | يتم تسطيح النص/الموارد في إدخال الدردشة؛ وتصبح الصور مرفقات Gateway.                                                                                                                                                                 |
| أوضاع الجلسة                                                         | جزئي     | `session/set_mode` مدعوم ويعرض الجسر عناصر تحكم أولية مدعومة بـ Gateway للجلسة لمستوى التفكير، وإسهاب الأداة، والاستدلال، وتفاصيل الاستخدام، والإجراءات المرتفعة. لا تزال أسطح الوضع/الإعداد الأصلية الأوسع لـ ACP خارج النطاق. |
| معلومات الجلسة وتحديثات الاستخدام                                        | جزئي     | يصدر الجسر إشعارات `session_info_update` و`usage_update` بأفضل جهد من لقطات جلسات Gateway المخزنة مؤقتا. الاستخدام تقريبي ولا يرسل إلا عندما يشار إلى أن إجماليات رموز Gateway محدثة.                                        |
| بث الأدوات                                                        | جزئي     | تتضمن أحداث `tool_call` / `tool_call_update` الإدخال/الإخراج الخام، ومحتوى النص، ومواقع الملفات بأفضل جهد عندما تكشف وسائط/نتائج أدوات Gateway عنها. لا تزال الطرفيات المضمّنة والمخرجات الأغنى الأصلية للفروق غير مكشوفة.                        |
| موافقات التنفيذ                                                        | جزئي     | تُرحّل مطالبات موافقة تنفيذ Gateway أثناء دورات مطالبة ACP النشطة إلى عميل ACP باستخدام `session/request_permission`.                                                                                                                    |
| خوادم MCP لكل جلسة (`mcpServers`)                                | غير مدعوم | يرفض وضع الجسر طلبات خوادم MCP لكل جلسة. اضبط MCP على OpenClaw gateway أو الوكيل بدلا من ذلك.                                                                                                                                     |
| طرق نظام ملفات العميل (`fs/read_text_file`, `fs/write_text_file`) | غير مدعوم | لا يستدعي الجسر طرق نظام ملفات عميل ACP.                                                                                                                                                                                          |
| طرق طرفية العميل (`terminal/*`)                                | غير مدعوم | لا ينشئ الجسر طرفيات عميل ACP ولا يبث معرفات الطرفية عبر استدعاءات الأدوات.                                                                                                                                                       |
| خطط الجلسة / بث التفكير                                     | غير مدعوم | يصدر الجسر حاليا نص المخرجات وحالة الأدوات، وليس تحديثات خطة ACP أو التفكير.                                                                                                                                                         |

## القيود المعروفة

- يستطيع `loadSession` إعادة تشغيل سجل أحداث ACP الكامل فقط للجلسات التي
  أنشأها الجسر. لا تزال الجلسات الأقدم/بلا سجل أحداث تستخدم الرجوع إلى النص
  ولا تعيد بناء استدعاءات الأدوات أو الإشعارات النظامية التاريخية.
- إذا شارك عدة عملاء ACP مفتاح جلسة Gateway نفسه، فإن توجيه الأحداث والإلغاء
  يكون بأفضل جهد بدلا من أن يكون معزولا بدقة لكل عميل. فضّل جلسات
  `acp:<uuid>` الافتراضية المعزولة عندما تحتاج إلى دورات محلية نظيفة للمحرر.
- تُترجم حالات إيقاف Gateway إلى أسباب إيقاف ACP، لكن هذا الربط أقل تعبيرا
  من بيئة تشغيل أصلية بالكامل لـ ACP.
- تعرض عناصر التحكم الأولية للجلسة حاليا مجموعة مركزة من مقابض Gateway:
  مستوى التفكير، وإسهاب الأداة، والاستدلال، وتفاصيل الاستخدام، والإجراءات
  المرتفعة. لم تُكشف بعد خيارات اختيار النموذج والتحكم بمضيف التنفيذ كخيارات
  إعداد ACP.
- تُشتق `session_info_update` و`usage_update` من لقطات جلسات Gateway،
  وليس من محاسبة بيئة تشغيل أصلية حية لـ ACP. الاستخدام تقريبي، ولا يحمل
  بيانات تكلفة، ولا يصدر إلا عندما يحدد Gateway أن بيانات إجمالي الرموز حديثة.
- بيانات متابعة الأدوات بأفضل جهد. يستطيع الجسر إظهار مسارات الملفات التي
  تظهر في وسائط/نتائج أدوات معروفة، لكنه لا يصدر بعد طرفيات ACP أو فروق
  ملفات منظمة.
- ترحيل موافقات التنفيذ محدود بدورة مطالبة ACP النشطة؛ ويتم تجاهل الموافقات
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

استخدم عميل ACP المدمج للتحقق السريع من الجسر من دون IDE.
يطلق جسر ACP ويتيح لك كتابة المطالبات تفاعليا.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

نموذج الأذونات (وضع تصحيح أخطاء العميل):

- الموافقة التلقائية قائمة على قائمة سماح ولا تنطبق إلا على معرفات أدوات النواة الموثوقة.
- الموافقة التلقائية على `read` محدودة بدليل العمل الحالي (`--cwd` عند ضبطه).
- لا يوافق ACP تلقائيا إلا على فئات ضيقة للقراءة فقط: استدعاءات `read` المحددة النطاق تحت cwd النشط إضافة إلى أدوات البحث للقراءة فقط (`search`, `web_search`, `memory_search`). تتطلب الأدوات المجهولة/غير الأساسية، والقراءات خارج النطاق، والأدوات القادرة على التنفيذ، وأدوات مستوى التحكم، والأدوات المعدّلة، والتدفقات التفاعلية دائما موافقة صريحة على المطالبة.
- يُعامل `toolCall.kind` المقدم من الخادم كبيانات وصفية غير موثوقة (وليس مصدرا للتفويض).
- سياسة جسر ACP هذه منفصلة عن أذونات حزمة ACPX. إذا شغّلت OpenClaw عبر خلفية `acpx`، فإن `plugins.entries.acpx.config.permissionMode=approve-all` هو مفتاح الطوارئ "yolo" لتلك جلسة الحزمة.

## اختبار دخان البروتوكول

لتصحيح الأخطاء على مستوى البروتوكول، ابدأ Gateway بحالة معزولة وشغّل
`openclaw acp` عبر stdio باستخدام عميل ACP JSON-RPC. غطِّ `initialize`،
و`session/new`، و`session/list` مع `cwd` مطلق، و`session/resume`،
و`session/close`، والإغلاق المكرر، والاستئناف المفقود.

يجب أن يتضمن الدليل قدرات دورة الحياة المعلنة، وصف جلسة مدعوما بـ Gateway،
وإشعارات التحديث، وسجل `sessions.list` الخاص بـ Gateway:

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

تجنب استخدام `openclaw gateway call sessions.list` كدليل ACP الوحيد. فقد
يطلب مسار CLI هذا ترقية نطاق مشغل برمز حديث؛ وتُثبت صحة جسر ACP من خلال
إطارات stdio الخاصة بـ ACP إضافة إلى سجل `sessions.list` في Gateway.

## كيفية استخدام هذا

استخدم ACP عندما تتحدث IDE (أو عميل آخر) بروتوكول عميل الوكيل وتريد
منه تشغيل جلسة OpenClaw Gateway.

1. تأكد من أن Gateway قيد التشغيل (محليا أو عن بعد).
2. اضبط هدف Gateway (الإعداد أو الأعلام).
3. وجّه IDE لديك لتشغيل `openclaw acp` عبر stdio.

مثال إعداد (مستمر):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

مثال تشغيل مباشر (بلا كتابة إعداد):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## اختيار الوكلاء

لا يختار ACP الوكلاء مباشرة. إنه يوجه حسب مفتاح جلسة Gateway.

استخدم مفاتيح جلسات محددة بنطاق الوكيل لاستهداف وكيل معين:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

ترتبط كل جلسة ACP بمفتاح جلسة Gateway واحد. يمكن أن يكون لوكيل واحد جلسات
عديدة؛ ويستخدم ACP افتراضيا جلسة `acp:<uuid>` معزولة ما لم تتجاوز المفتاح
أو التسمية.

لا تُدعم `mcpServers` لكل جلسة في وضع الجسر. إذا أرسلها عميل ACP
أثناء `newSession` أو `loadSession`، يعيد الجسر خطأ واضحًا
بدلًا من تجاهلها بصمت.

إذا أردت أن ترى الجلسات المدعومة بـ ACPX أدوات Plugin الخاصة بـ OpenClaw أو أدوات
مدمجة محددة مثل `cron`، فمكّن جسور ACPX MCP من جهة Gateway بدلًا من
محاولة تمرير `mcpServers` لكل جلسة. راجع
[وكلاء ACP](/ar/tools/acp-agents-setup#plugin-tools-mcp-bridge) و
[جسر MCP لأدوات OpenClaw](/ar/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## الاستخدام من `acpx` (Codex وClaude وعملاء ACP آخرون)

إذا أردت أن يتحدث وكيل برمجة مثل Codex أو Claude Code إلى بوت
OpenClaw الخاص بك عبر ACP، فاستخدم `acpx` مع هدفه المدمج `openclaw`.

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

بالنسبة إلى نسخة OpenClaw محلية في المستودع، استخدم نقطة دخول CLI المباشرة بدلًا من
مشغّل التطوير لكي يبقى دفق ACP نظيفًا. على سبيل المثال:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

هذه أسهل طريقة للسماح لـ Codex أو Claude Code أو عميل آخر مدرك لـ ACP
بسحب معلومات سياقية من وكيل OpenClaw دون استخراجها من الطرفية.

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

في Zed، افتح لوحة الوكيل وحدد "OpenClaw ACP" لبدء سلسلة.

## ربط الجلسات

افتراضيًا، تحصل جلسات ACP على مفتاح جلسة Gateway معزول ببادئة `acp:`.
لإعادة استخدام جلسة معروفة، مرّر مفتاح جلسة أو تسمية:

- `--session <key>`: استخدم مفتاح جلسة Gateway محددًا.
- `--session-label <label>`: حلّل جلسة موجودة حسب التسمية.
- `--reset-session`: أنشئ معرف جلسة جديدًا لذلك المفتاح (نفس المفتاح، نص جلسة جديد).

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

- `--url <url>`: عنوان URL لـ WebSocket الخاص بـ Gateway (يكون افتراضيًا gateway.remote.url عند تكوينه).
- `--token <token>`: رمز مصادقة Gateway.
- `--token-file <path>`: اقرأ رمز مصادقة Gateway من ملف.
- `--password <password>`: كلمة مرور مصادقة Gateway.
- `--password-file <path>`: اقرأ كلمة مرور مصادقة Gateway من ملف.
- `--session <key>`: مفتاح الجلسة الافتراضي.
- `--session-label <label>`: تسمية الجلسة الافتراضية لحلّها.
- `--require-existing`: افشل إذا لم يكن مفتاح/تسمية الجلسة موجودًا.
- `--reset-session`: أعد ضبط مفتاح الجلسة قبل أول استخدام.
- `--no-prefix-cwd`: لا تسبق المطالبات بدليل العمل.
- `--provenance <off|meta|meta+receipt>`: ضمّن بيانات وصفية أو إيصالات منشأ ACP.
- `--verbose, -v`: تسجيل مفصل إلى stderr.

ملاحظة أمنية:

- يمكن أن يكون `--token` و`--password` مرئيين في قوائم العمليات المحلية على بعض الأنظمة.
- فضّل `--token-file`/`--password-file` أو متغيرات البيئة (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- يتبع حلّ مصادقة Gateway العقد المشترك الذي يستخدمه عملاء Gateway الآخرون:
  - الوضع المحلي: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> رجوع احتياطي إلى `gateway.remote.*` فقط عندما يكون `gateway.auth.*` غير مضبوط (تفشل SecretRefs المحلية المكوّنة لكن غير المحلولة بإغلاق آمن)
  - الوضع البعيد: `gateway.remote.*` مع رجوع احتياطي إلى env/config حسب قواعد أسبقية البعيد
  - `--url` آمن للتجاوز ولا يعيد استخدام بيانات اعتماد config/env الضمنية؛ مرّر `--token`/`--password` صريحًا (أو بدائل الملفات)
- تتلقى عمليات الأبناء لخلفية تشغيل ACP المتغير `OPENCLAW_SHELL=acp`، ويمكن استخدامه لقواعد shell/profile الخاصة بالسياق.
- يضبط `openclaw acp client` المتغير `OPENCLAW_SHELL=acp-client` على عملية الجسر المُنشأة.

### خيارات `acp client`

- `--cwd <dir>`: دليل العمل لجلسة ACP.
- `--server <command>`: أمر خادم ACP (الافتراضي: `openclaw`).
- `--server-args <args...>`: وسيطات إضافية تُمرَّر إلى خادم ACP.
- `--server-verbose`: مكّن التسجيل المفصل على خادم ACP.
- `--verbose, -v`: تسجيل مفصل للعميل.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [وكلاء ACP](/ar/tools/acp-agents)

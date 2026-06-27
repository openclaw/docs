---
read_when:
    - إعداد تكاملات IDE المستندة إلى ACP
    - تصحيح أخطاء توجيه جلسات ACP إلى Gateway
summary: شغّل جسر ACP لتكاملات IDE
title: ACP
x-i18n:
    generated_at: "2026-06-27T17:19:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 79fa816811f78c3fa59577342e568868ef63e88f5262fd954e346ed46b02afc3
    source_path: cli/acp.md
    workflow: 16
---

شغّل جسر [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) الذي يتواصل مع OpenClaw Gateway.

يتحدث هذا الأمر ACP عبر stdio للـ IDEs ويمرّر المطالبات إلى Gateway
عبر WebSocket. ويحافظ على ربط جلسات ACP بمفاتيح جلسات Gateway.

`openclaw acp` هو جسر ACP مدعوم بـ Gateway، وليس runtime محرر أصليًا كاملًا
لـ ACP. يركّز على توجيه الجلسات، وتسليم المطالبات، وتحديثات البث الأساسية.

إذا كنت تريد أن يتحدث عميل MCP خارجي مباشرةً إلى محادثات قنوات OpenClaw
بدلًا من استضافة جلسة harness لـ ACP، فاستخدم
[`openclaw mcp serve`](/ar/cli/mcp) بدلًا من ذلك.

## ما ليس عليه هذا

غالبًا ما يتم الخلط بين هذه الصفحة وبين جلسات ACP harness.

يعني `openclaw acp`:

- يعمل OpenClaw كخادم ACP
- يتصل IDE أو عميل ACP بـ OpenClaw
- يمرّر OpenClaw ذلك العمل إلى جلسة Gateway

وهذا يختلف عن [ACP Agents](/ar/tools/acp-agents)، حيث يشغّل OpenClaw
harness خارجيًا مثل Codex أو Claude Code عبر `acpx`.

قاعدة سريعة:

- يريد المحرر/العميل التحدث بـ ACP إلى OpenClaw: استخدم `openclaw acp`
- يجب أن يشغّل OpenClaw Codex/Claude/Gemini كـ ACP harness: استخدم `/acp spawn` و[ACP Agents](/ar/tools/acp-agents)

## مصفوفة التوافق

| منطقة ACP                                                             | الحالة     | ملاحظات                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | منفّذ       | تدفق الجسر الأساسي عبر stdio إلى دردشة/إرسال Gateway + الإجهاض.                                                                                                                                                                                   |
| `listSessions`, أوامر slash                                           | منفّذ       | تعمل قائمة الجلسات مقابل حالة جلسات Gateway مع ترقيم صفحات محدود بالمؤشر وتصفية `cwd` عندما تحمل صفوف جلسات Gateway بيانات وصفية لمساحة العمل؛ ويتم الإعلان عن الأوامر عبر `available_commands_update`.                                    |
| بيانات وصفية لسلالة الجلسة                                            | منفّذ       | تتضمن قوائم الجلسات ولقطات معلومات الجلسات سلالة الأصل والفرع في OpenClaw ضمن `_meta` حتى يتمكن عملاء ACP من عرض مخططات الوكلاء الفرعيين دون قنوات جانبية خاصة بـ Gateway.                                                                  |
| `resumeSession`, `closeSession`                                       | منفّذ       | يعيد الاستئناف ربط جلسة ACP بجلسة Gateway موجودة دون إعادة تشغيل السجل. ويُلغي الإغلاق عمل الجسر النشط، ويحسم المطالبات المعلّقة كملغاة، ويحرر حالة جلسة الجسر.                                                                              |
| `loadSession`                                                         | جزئي        | يعيد ربط جلسة ACP بمفتاح جلسة Gateway ويعيد تشغيل سجل أحداث ACP للجلسات المنشأة عبر الجسر. تعود الجلسات الأقدم/التي لا تحتوي على سجل إلى نص المستخدم/المساعد المخزّن.                                                                        |
| محتوى المطالبة (`text`، و`resource` مضمّن، والصور)                    | جزئي        | يتم تسطيح النصوص/الموارد إلى إدخال الدردشة؛ وتصبح الصور مرفقات Gateway.                                                                                                                                                                          |
| أوضاع الجلسة                                                          | جزئي        | يتم دعم `session/set_mode` ويعرض الجسر عناصر تحكم أولية مدعومة بـ Gateway للجلسة لمستوى التفكير، وإسهاب الأدوات، والاستدلال، وتفاصيل الاستخدام، والإجراءات المرتفعة. لا تزال أسطح الأوضاع/الإعدادات الأوسع الأصلية لـ ACP خارج النطاق. |
| معلومات الجلسة وتحديثات الاستخدام                                    | جزئي        | يصدر الجسر إشعارات `session_info_update` و`usage_update` بأفضل جهد من لقطات جلسات Gateway المخزنة مؤقتًا. الاستخدام تقريبي ولا يُرسل إلا عندما تُوسم إجماليات رموز Gateway بأنها حديثة.                                                     |
| بث الأدوات                                                            | جزئي        | تتضمن أحداث `tool_call` / `tool_call_update` إدخال/إخراجًا خامًا، ومحتوى نصيًا، ومواقع ملفات بأفضل جهد عندما تعرض وسيطات/نتائج أدوات Gateway ذلك. لا تزال الطرفيات المضمّنة والمخرجات الأصلية للفرق الأكثر ثراءً غير مكشوفة.              |
| موافقات exec                                                          | جزئي        | يتم ترحيل مطالبات موافقة exec من Gateway أثناء أدوار مطالبة ACP النشطة إلى عميل ACP باستخدام `session/request_permission`.                                                                                                                      |
| خوادم MCP لكل جلسة (`mcpServers`)                                     | غير مدعوم   | يرفض وضع الجسر طلبات خادم MCP لكل جلسة. اضبط MCP على OpenClaw gateway أو الوكيل بدلًا من ذلك.                                                                                                                                                  |
| طرق نظام ملفات العميل (`fs/read_text_file`, `fs/write_text_file`)    | غير مدعوم   | لا يستدعي الجسر طرق نظام ملفات عميل ACP.                                                                                                                                                                                                         |
| طرق طرفية العميل (`terminal/*`)                                       | غير مدعوم   | لا ينشئ الجسر طرفيات عميل ACP ولا يبث معرّفات الطرفيات عبر استدعاءات الأدوات.                                                                                                                                                                   |
| خطط الجلسة / بث التفكير                                               | غير مدعوم   | يصدر الجسر حاليًا نص المخرجات وحالة الأدوات، وليس تحديثات خطة ACP أو التفكير.                                                                                                                                                                   |

## القيود المعروفة

- يمكن لـ `loadSession` إعادة تشغيل سجل أحداث ACP الكامل فقط للجلسات
  المنشأة عبر الجسر. لا تزال الجلسات الأقدم/التي لا تحتوي على سجل تستخدم
  بديل النص ولا تعيد بناء استدعاءات الأدوات التاريخية أو إشعارات النظام.
- إذا شارك عدة عملاء ACP مفتاح جلسة Gateway نفسه، يكون توجيه الأحداث والإلغاء
  بأفضل جهد بدلًا من أن يكون معزولًا بدقة لكل عميل. فضّل الجلسات المعزولة
  الافتراضية `acp-bridge:<uuid>` عندما تحتاج إلى أدوار محلية نظيفة للمحرر.
- تُترجم حالات إيقاف Gateway إلى أسباب إيقاف ACP، لكن هذا الربط أقل تعبيرًا
  من runtime أصلي كامل لـ ACP.
- تعرض عناصر التحكم الأولية للجلسة حاليًا مجموعة مركزة من مقابض Gateway:
  مستوى التفكير، وإسهاب الأدوات، والاستدلال، وتفاصيل الاستخدام، والإجراءات
  المرتفعة. لم تُعرض بعد عناصر اختيار النموذج والتحكم بمضيف exec كخيارات
  إعداد ACP.
- يتم اشتقاق `session_info_update` و`usage_update` من لقطات جلسات Gateway،
  وليس من محاسبة runtime أصلية مباشرة لـ ACP. الاستخدام تقريبي، ولا يحمل
  بيانات تكلفة، ولا يصدر إلا عندما يوسم Gateway بيانات إجمالي الرموز بأنها
  حديثة.
- بيانات متابعة الأدوات بأفضل جهد. يمكن للجسر عرض مسارات الملفات التي تظهر
  في وسيطات/نتائج الأدوات المعروفة، لكنه لا يصدر بعد طرفيات ACP أو فروق ملفات
  منظمة.
- يقتصر ترحيل موافقة exec على دور مطالبة ACP النشط؛ ويتم تجاهل الموافقات من
  جلسات Gateway الأخرى.

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

استخدم عميل ACP المضمّن للتحقق السريع من سلامة الجسر دون IDE.
يشغّل جسر ACP ويتيح لك كتابة المطالبات تفاعليًا.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

نموذج الأذونات (وضع تصحيح أخطاء العميل):

- الموافقة التلقائية قائمة على قائمة سماح ولا تنطبق إلا على معرّفات أدوات النواة الموثوقة.
- تقتصر الموافقة التلقائية على `read` على دليل العمل الحالي (`--cwd` عند تعيينه).
- لا يوافق ACP تلقائيًا إلا على فئات ضيقة للقراءة فقط: استدعاءات `read` المحددة النطاق ضمن cwd النشط، إضافةً إلى أدوات البحث للقراءة فقط (`search`, `web_search`, `memory_search`). تتطلب الأدوات غير المعروفة/غير الأساسية، وعمليات القراءة خارج النطاق، والأدوات القادرة على exec، وأدوات مستوى التحكم، والأدوات المعدِّلة، والتدفقات التفاعلية دائمًا موافقة صريحة على المطالبة.
- تُعامل `toolCall.kind` المقدمة من الخادم كبيانات وصفية غير موثوقة (وليست مصدر تفويض).
- سياسة جسر ACP هذه منفصلة عن أذونات ACPX harness. إذا شغّلت OpenClaw عبر خلفية `acpx`، فإن `plugins.entries.acpx.config.permissionMode=approve-all` هو مفتاح "yolo" الطارئ لتلك الجلسة من harness.

## اختبار smoke للبروتوكول

لتصحيح الأخطاء على مستوى البروتوكول، ابدأ Gateway بحالة معزولة وقُد
`openclaw acp` عبر stdio باستخدام عميل ACP JSON-RPC. غطِّ `initialize`،
و`session/new`، و`session/list` مع `cwd` مطلق، و`session/resume`،
و`session/close`، والإغلاق المكرر، والاستئناف المفقود.

يجب أن يتضمن الإثبات قدرات دورة الحياة المعلنة، وصف جلسة مدعومًا بـ Gateway،
وإشعارات التحديث، وسجل Gateway `sessions.list`:

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
يطلب مسار CLI هذا ترقية نطاق مشغّل لرمز حديث؛ يتم إثبات صحة جسر ACP عبر
إطارات ACP stdio بالإضافة إلى سجل Gateway `sessions.list`.

## كيفية استخدام هذا

استخدم ACP عندما يتحدث IDE (أو عميل آخر) ببروتوكول Agent Client Protocol وتريد
منه قيادة جلسة OpenClaw Gateway.

1. تأكد من أن Gateway يعمل (محليًا أو عن بُعد).
2. اضبط هدف Gateway (الإعدادات أو الأعلام).
3. وجّه IDE لتشغيل `openclaw acp` عبر stdio.

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

استخدم مفاتيح جلسات محددة بنطاق الوكيل لاستهداف وكيل معيّن:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

تُربط كل جلسة ACP بمفتاح جلسة Gateway واحد. يمكن أن يمتلك الوكيل الواحد عدة
جلسات؛ ويستخدم ACP افتراضيا جلسة `acp-bridge:<uuid>` معزولة ما لم تتجاوز
المفتاح أو التسمية.

لا تُدعم `mcpServers` الخاصة بكل جلسة في وضع الجسر. إذا أرسلها عميل ACP
أثناء `newSession` أو `loadSession`، فسيعيد الجسر خطأ واضحا بدلا من تجاهلها
بصمت.

إذا أردت أن ترى الجلسات المدعومة بـ ACPX أدوات Plugin الخاصة بـ OpenClaw أو
أدوات مدمجة محددة مثل `cron`، ففعّل جسور ACPX MCP على جانب Gateway بدلا من
محاولة تمرير `mcpServers` لكل جلسة. راجع
[وكلاء ACP](/ar/tools/acp-agents-setup#plugin-tools-mcp-bridge) و
[جسر MCP لأدوات OpenClaw](/ar/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## الاستخدام من `acpx` (Codex وClaude وعملاء ACP آخرون)

إذا أردت أن يتواصل وكيل برمجة مثل Codex أو Claude Code مع روبوت
OpenClaw لديك عبر ACP، فاستخدم `acpx` مع هدفه المدمج `openclaw`.

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

بالنسبة إلى نسخة OpenClaw محلية داخل المستودع، استخدم نقطة دخول CLI المباشرة
بدلا من مشغّل التطوير حتى يبقى دفق ACP نظيفا. على سبيل المثال:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

هذه أسهل طريقة تتيح لـ Codex أو Claude Code أو أي عميل آخر مدرك لـ ACP
سحب المعلومات السياقية من وكيل OpenClaw دون استخراجها من الطرفية.

## إعداد محرر Zed

أضف وكيلا مخصصا لـ ACP في `~/.config/zed/settings.json` (أو استخدم واجهة إعدادات Zed):

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

افتراضيا، تحصل جلسات جسر ACP على مفتاح جلسة Gateway معزول ببادئة
`acp-bridge:`. جلسات الجسر ذات النموذج العادي هذه اصطناعية وتخضع لتنظيف
الإدخالات القديمة وحدود عدد الإدخالات. لإعادة استخدام جلسة معروفة، مرر مفتاح
جلسة أو تسمية:

- `--session <key>`: استخدم مفتاح جلسة Gateway محددا.
- `--session-label <label>`: حل جلسة موجودة بواسطة التسمية.
- `--reset-session`: أنشئ معرّف جلسة جديدا لذلك المفتاح (المفتاح نفسه، وسجل محادثة جديد).

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

تعلّم المزيد عن مفاتيح الجلسات في [/concepts/session](/ar/concepts/session).

## الخيارات

- `--url <url>`: عنوان URL لـ WebSocket الخاص بـ Gateway (يستخدم افتراضيا gateway.remote.url عند ضبطه).
- `--token <token>`: رمز مصادقة Gateway.
- `--token-file <path>`: قراءة رمز مصادقة Gateway من ملف.
- `--password <password>`: كلمة مرور مصادقة Gateway.
- `--password-file <path>`: قراءة كلمة مرور مصادقة Gateway من ملف.
- `--session <key>`: مفتاح الجلسة الافتراضي.
- `--session-label <label>`: تسمية الجلسة الافتراضية المراد حلها.
- `--require-existing`: افشل إذا لم يكن مفتاح/تسمية الجلسة موجودا.
- `--reset-session`: أعد ضبط مفتاح الجلسة قبل أول استخدام.
- `--no-prefix-cwd`: لا تضف دليل العمل كبادئة للمطالبات.
- `--provenance <off|meta|meta+receipt>`: تضمين بيانات وصفية أو إيصالات لمصدر ACP.
- `--verbose, -v`: تسجيل مفصل إلى stderr.

ملاحظة أمنية:

- يمكن أن يكون `--token` و`--password` مرئيين في قوائم العمليات المحلية على بعض الأنظمة.
- فضّل `--token-file`/`--password-file` أو متغيرات البيئة (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- يتبع حل مصادقة Gateway العقد المشترك الذي يستخدمه عملاء Gateway الآخرون:
  - الوضع المحلي: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> الرجوع إلى `gateway.remote.*` فقط عندما لا يكون `gateway.auth.*` معيّنا (تفشل SecretRefs المحلية المضبوطة لكن غير المحلولة بإغلاق آمن)
  - الوضع البعيد: `gateway.remote.*` مع رجوع env/config حسب قواعد أسبقية البعيد
  - `--url` آمن للتجاوز ولا يعيد استخدام بيانات اعتماد config/env الضمنية؛ مرر `--token`/`--password` صريحين (أو بدائل الملفات)
- تتلقى العمليات الفرعية لخلفية تشغيل ACP `OPENCLAW_SHELL=acp`، ويمكن استخدام ذلك لقواعد shell/profile الخاصة بالسياق.
- يعيّن `openclaw acp client` القيمة `OPENCLAW_SHELL=acp-client` على عملية الجسر التي يتم إنشاؤها.

### خيارات `acp client`

- `--cwd <dir>`: دليل العمل لجلسة ACP.
- `--server <command>`: أمر خادم ACP (الافتراضي: `openclaw`).
- `--server-args <args...>`: وسائط إضافية تُمرر إلى خادم ACP.
- `--server-verbose`: تمكين التسجيل المفصل على خادم ACP.
- `--verbose, -v`: تسجيل مفصل للعميل.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [وكلاء ACP](/ar/tools/acp-agents)

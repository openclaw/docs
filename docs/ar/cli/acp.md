---
read_when:
    - إعداد تكاملات بيئات التطوير المتكاملة المستندة إلى ACP
    - تصحيح أخطاء توجيه جلسات ACP إلى Gateway
summary: شغّل جسر ACP لعمليات التكامل مع بيئات التطوير المتكاملة
title: ACP
x-i18n:
    generated_at: "2026-07-12T05:39:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: becdcfdd1cc62b206cc92e9b8248c79a2ff63cfc3779d8a124b9713e779ad33c
    source_path: cli/acp.md
    workflow: 16
---

شغّل جسر [بروتوكول عميل الوكيل (ACP)](https://agentclientprotocol.com/) الذي يتواصل مع Gateway تابع لـ OpenClaw.

يتحدث `openclaw acp` ببروتوكول ACP عبر stdio لبيئات التطوير المتكاملة، ويمرّر المطالبات إلى Gateway عبر WebSocket، مع إبقاء جلسات ACP مرتبطة بمفاتيح جلسات Gateway. وهو جسر ACP مدعوم بـ Gateway، وليس بيئة تشغيل محرر أصلية متكاملة لـ ACP: إذ يركز على توجيه الجلسات، وتسليم المطالبات، وبث التحديثات.

إذا أردت أن يتواصل عميل MCP خارجي مباشرةً مع محادثات قنوات OpenClaw بدلًا من استضافة جلسة بيئة ACP، فاستخدم [`openclaw mcp serve`](/ar/cli/mcp) بدلًا منه.

## ما ليس عليه هذا الأمر

يعني `openclaw acp` أن OpenClaw يعمل خادم ACP: تتصل بيئة تطوير متكاملة أو عميل ACP بـ OpenClaw، ويمرّر OpenClaw ذلك العمل إلى جلسة Gateway.

يختلف هذا عن [وكلاء ACP](/ar/tools/acp-agents)، حيث يشغّل OpenClaw بيئة خارجية مثل Codex أو Claude Code من خلال `acpx`.

قاعدة سريعة:

- إذا كان المحرر/العميل يريد التواصل مع OpenClaw عبر ACP: فاستخدم `openclaw acp`
- إذا كان ينبغي لـ OpenClaw تشغيل Codex/Claude/Gemini كبيئة ACP: فاستخدم `/acp spawn` و[وكلاء ACP](/ar/tools/acp-agents)

## مصفوفة التوافق

| مجال ACP                                                              | الحالة      | ملاحظات                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`، و`newSession`، و`prompt`، و`cancel`                        | منفّذ | تدفق الجسر الأساسي عبر stdio إلى محادثة Gateway/الإرسال + الإلغاء.                                                                                                                                                                             |
| `listSessions`، والأوامر المسبوقة بشرطة مائلة                                        | منفّذ | تعمل قائمة الجلسات مع حالة جلسات Gateway باستخدام ترقيم صفحات محدود بالمؤشر وترشيح `cwd` حيث تتضمن صفوف جلسات Gateway بيانات تعريف مساحة العمل؛ ويُعلن عن الأوامر عبر `available_commands_update`.                     |
| بيانات تعريف تسلسل الجلسات                                              | منفّذ | تتضمن قوائم الجلسات ولقطات معلومات الجلسة تسلسل الجلسات الأصل والفرعية في OpenClaw داخل `_meta`، حتى تتمكن عملاء ACP من عرض مخططات الوكلاء الفرعيين دون قنوات جانبية خاصة بـ Gateway.                                                     |
| `resumeSession`، و`closeSession`                                       | منفّذ | تعيد الاستئناف ربط جلسة ACP بجلسة Gateway موجودة دون إعادة تشغيل السجل. ويلغي الإغلاق عمل الجسر النشط، ويحل المطالبات المعلقة بوصفها ملغاة، ويحرر حالة جلسة الجسر.                                   |
| `loadSession`                                                         | جزئي     | يعيد ربط جلسة ACP بمفتاح جلسة Gateway ويعيد تشغيل سجل أحداث ACP للجلسات التي أنشأها الجسر. أما الجلسات الأقدم أو التي لا تحتوي على سجل فتعود إلى نص المستخدم/المساعد المخزّن.                                                  |
| محتوى المطالبة (`text`، و`resource` المضمّن، والصور)                  | جزئي     | تُدمج النصوص/الموارد في إدخال المحادثة؛ وتصبح الصور مرفقات Gateway.                                                                                                                                                            |
| أوضاع الجلسة                                                         | جزئي     | الأمر `session/set_mode` مدعوم؛ ويعرض الجسر عناصر تحكم في الجلسة مدعومة بـ Gateway لمستوى التفكير، وإسهاب الأدوات، والاستدلال، وتفاصيل الاستخدام، والإجراءات ذات الصلاحيات المرتفعة. ولا تزال أسطح الأوضاع/الإعدادات الأصلية الأوسع لـ ACP خارج النطاق. |
| بث التفكير                                                     | منفّذ | يُبث محتوى تفكير النموذج كتحديثات جلسة `agent_thought_chunk`. ولا تُصدر خطط الجلسة الأصلية لـ ACP.                                                                                                                    |
| معلومات الجلسة وتحديثات الاستخدام                                        | جزئي     | يُصدر الجسر إشعارات `session_info_update` و`usage_update` بأفضل جهد من لقطات جلسات Gateway المخزنة مؤقتًا. ويكون الاستخدام تقريبيًا ولا يُرسل إلا عندما تُعلَّم إجماليات رموز Gateway بأنها حديثة.                             |
| بث الأدوات                                                        | جزئي     | تتضمن أحداث `tool_call`/`tool_call_update` الإدخال/الإخراج الخام، والمحتوى النصي، ومواقع الملفات بأفضل جهد عندما تعرضها وسائط/نتائج أداة Gateway. ولا تُعرض الطرفيات المضمّنة أو المخرجات الأصلية الأكثر ثراءً للفروقات.                     |
| موافقات التنفيذ                                                        | جزئي     | تُمرَّر مطالبات موافقة التنفيذ من Gateway أثناء أدوار مطالبة ACP النشطة إلى عميل ACP باستخدام `session/request_permission`.                                                                                                               |
| خوادم MCP لكل جلسة (`mcpServers`)                                | غير مدعوم | يرفض وضع الجسر طلبات خادم MCP لكل جلسة. اضبط MCP على Gateway الخاص بـ OpenClaw أو على الوكيل بدلًا من ذلك.                                                                                                                          |
| أساليب نظام ملفات العميل (`fs/read_text_file`، و`fs/write_text_file`) | غير مدعوم | لا يستدعي الجسر أساليب نظام ملفات عميل ACP.                                                                                                                                                                               |
| أساليب طرفية العميل (`terminal/*`)                                | غير مدعوم | لا ينشئ الجسر طرفيات عميل ACP ولا يبث معرّفات الطرفيات عبر استدعاءات الأدوات.                                                                                                                                            |

## القيود المعروفة

- يعيد `loadSession` تشغيل سجل أحداث ACP الكامل فقط للجلسات التي أنشأها الجسر. تستخدم الجلسات الأقدم أو التي لا تحتوي على سجل نسخة احتياطية من النص ولا تعيد بناء استدعاءات الأدوات التاريخية أو إشعارات النظام.
- إذا شاركت عدة عملاء ACP مفتاح جلسة Gateway نفسه، فإن توجيه الأحداث والإلغاء يكون بأفضل جهد بدلًا من العزل الصارم لكل عميل. فضّل جلسات `acp-bridge:<uuid>` المعزولة الافتراضية عندما تحتاج إلى أدوار محلية نظيفة للمحرر.
- تُترجم حالات توقف Gateway إلى أسباب توقف ACP، لكن هذا الربط أقل تعبيرًا من بيئة تشغيل أصلية بالكامل لـ ACP.
- تعرض عناصر التحكم في الجلسة مجموعة مركزة من مقابض Gateway: مستوى التفكير، وإسهاب الأدوات، والاستدلال، وتفاصيل الاستخدام، والإجراءات ذات الصلاحيات المرتفعة. لا يُعرض اختيار النموذج وعناصر التحكم في مضيف التنفيذ كخيارات إعداد ACP.
- يُشتق `session_info_update` و`usage_update` من لقطات جلسات Gateway، وليس من محاسبة بيئة تشغيل أصلية وحية لـ ACP. ويكون الاستخدام تقريبيًا، ولا يتضمن بيانات التكلفة، ولا يُصدر إلا عندما يعلّم Gateway إجمالي بيانات الرموز بأنها حديثة.
- بيانات متابعة الأدوات بأفضل جهد: يعرض الجسر مسارات الملفات التي تظهر في وسائط/نتائج الأدوات المعروفة، لكنه لا يصدر طرفيات ACP أو فروقات ملفات منظّمة.
- يقتصر تمرير موافقة التنفيذ على دور مطالبة ACP النشط؛ وتُتجاهل الموافقات من جلسات Gateway الأخرى.

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

استخدم عميل ACP المضمّن لإجراء فحص سلامة للجسر دون بيئة تطوير متكاملة. فهو يشغّل جسر ACP ويتيح لك كتابة المطالبات تفاعليًا.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

نموذج الأذونات (وضع تصحيح أخطاء العميل):

- تعتمد الموافقة التلقائية على قائمة سماح، ولا تنطبق إلا على معرّفات أدوات النواة الموثوقة.
- تقتصر الموافقة التلقائية على `read` على دليل العمل الحالي (`--cwd` عند تعيينه).
- لا يوافق ACP تلقائيًا إلا على فئات ضيقة للقراءة فقط: استدعاءات `read` المحددة النطاق ضمن دليل العمل الحالي النشط، بالإضافة إلى أدوات البحث للقراءة فقط (`search`، و`web_search`، و`memory_search`). وتتطلب الأدوات غير المعروفة/غير الأساسية، وعمليات القراءة خارج النطاق، والأدوات القادرة على التنفيذ، وأدوات مستوى التحكم، والأدوات المعدِّلة، والتدفقات التفاعلية دائمًا موافقة صريحة على المطالبة.
- تُعامل `toolCall.kind` التي يوفرها الخادم كبيانات تعريف غير موثوقة، وليس كمصدر للتفويض.
- سياسة جسر ACP هذه منفصلة عن أذونات بيئة ACPX. إذا شغّلت OpenClaw من خلال الواجهة الخلفية `acpx`، فإن `plugins.entries.acpx.config.permissionMode=approve-all` هو مفتاح الطوارئ "yolo" لجلسة البيئة تلك.

## اختبار الدخان للبروتوكول

لتصحيح الأخطاء على مستوى البروتوكول، شغّل Gateway بحالة معزولة وتحكّم في `openclaw acp` عبر stdio باستخدام عميل ACP JSON-RPC. غطِّ `initialize`، و`session/new`، و`session/list` مع `cwd` مطلق، و`session/resume`، و`session/close`، والإغلاق المكرر، والاستئناف المفقود.

يجب أن يتضمن الإثبات إمكانات دورة الحياة المُعلَن عنها، وصف جلسة مدعومًا بـ Gateway، وإشعارات التحديث، وسجل `sessions.list` الخاص بـ Gateway:

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

تجنّب استخدام `openclaw gateway call sessions.list` بوصفه إثبات ACP الوحيد. فقد يطلب مسار CLI هذا ترقية نطاق المشغّل لرمز حديث؛ وتُثبت صحة جسر ACP بواسطة إطارات ACP عبر stdio إضافةً إلى سجل `sessions.list` الخاص بـ Gateway.

## كيفية استخدام هذا

استخدم ACP عندما تتحدث بيئة تطوير متكاملة (أو عميل آخر) ببروتوكول عميل الوكيل وتريدها أن تقود جلسة Gateway خاصة بـ OpenClaw.

1. تأكد من تشغيل Gateway (محليًا أو عن بُعد).
2. اضبط هدف Gateway (عبر الإعداد أو العلامات).
3. وجّه بيئة التطوير المتكاملة لتشغيل `openclaw acp` عبر stdio.

مثال على الإعداد (محفوظ):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

مثال على التشغيل المباشر (دون كتابة إعداد):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## اختيار الوكلاء

لا يختار ACP الوكلاء مباشرةً. بل يوجّه حسب مفتاح جلسة Gateway. استخدم مفاتيح جلسات محددة النطاق بالوكيل لاستهداف وكيل معين:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

ترتبط كل جلسة ACP بمفتاح جلسة Gateway واحد. ويمكن أن يكون للوكيل الواحد جلسات عديدة؛ ويستخدم ACP افتراضيًا جلسة `acp-bridge:<uuid>` معزولة ما لم تتجاوز المفتاح أو التسمية.

لا تُدعم إعدادات `mcpServers` الخاصة بكل جلسة في وضع الجسر. إذا أرسلها عميل ACP أثناء `newSession` أو `loadSession`، فسيُرجع الجسر خطأً واضحًا بدلًا من تجاهلها بصمت.

إذا أردت أن تتمكن الجلسات المدعومة بـ ACPX من رؤية أدوات Plugins في OpenClaw أو أدوات مضمّنة محددة مثل `cron`، ففعّل جسور ACPX MCP على جانب Gateway بدلًا من محاولة تمرير `mcpServers` لكل جلسة. راجع [وكلاء ACP](/ar/tools/acp-agents-setup#plugin-tools-mcp-bridge) و[جسر MCP لأدوات OpenClaw](/ar/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## الاستخدام من `acpx` ‏(Codex وClaude وعملاء ACP الآخرون)

إذا أردت أن يتواصل وكيل برمجة مثل Codex أو Claude Code مع روبوت OpenClaw لديك عبر ACP، فاستخدم `acpx` مع هدفه المضمّن `openclaw`.

المسار المعتاد:

1. شغّل Gateway وتأكد من إمكانية وصول جسر ACP إليه.
2. وجّه `acpx openclaw` إلى `openclaw acp`.
3. حدّد مفتاح جلسة OpenClaw الذي تريد أن يستخدمه وكيل البرمجة.

أمثلة:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

إذا أردت أن يستهدف `acpx openclaw` في كل مرة Gateway ومفتاح جلسة محددين، فتجاوز أمر وكيل `openclaw` في `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

بالنسبة إلى نسخة OpenClaw محلية ضمن المستودع، استخدم نقطة دخول CLI المباشرة بدلًا من مشغّل التطوير لكي يظل تدفق ACP نظيفًا:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

هذه أسهل طريقة لتمكين Codex أو Claude Code أو أي عميل آخر يدعم ACP من سحب معلومات سياقية من وكيل OpenClaw دون استخراجها من طرفية.

## إعداد محرر Zed

أضف وكيل ACP مخصصًا في `~/.config/zed/settings.json` (أو استخدم واجهة Settings في Zed):

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

في Zed، افتح لوحة Agent وحدد "OpenClaw ACP" لبدء سلسلة محادثة.

## ربط الجلسات

افتراضيًا، تحصل جلسات جسر ACP على مفتاح جلسة Gateway معزول ذي بادئة `acp-bridge:`. جلسات الجسر هذه التي تستخدم النموذج العادي اصطناعية وقابلة للتخلص منها: فهي تخضع لتنقية الإدخالات القديمة، ولا تُعامل كأسطح محادثات بشرية محمية. لإعادة استخدام جلسة معروفة، مرّر مفتاح جلسة أو تسمية:

- `--session <key>`: استخدام مفتاح جلسة Gateway محدد.
- `--session-label <label>`: العثور على جلسة موجودة حسب التسمية.
- `--reset-session`: إنشاء معرّف جلسة جديد لذلك المفتاح (المفتاح نفسه، وسجل محادثة جديد).

إذا كان عميل ACP لديك يدعم البيانات الوصفية، فيمكنك تجاوز الإعداد لكل جلسة:

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

- `--url <url>`: عنوان WebSocket الخاص بـ Gateway (الإعداد الافتراضي هو `gateway.remote.url` عند ضبطه).
- `--token <token>`: رمز مصادقة Gateway.
- `--token-file <path>`: قراءة رمز مصادقة Gateway من ملف.
- `--password <password>`: كلمة مرور مصادقة Gateway.
- `--password-file <path>`: قراءة كلمة مرور مصادقة Gateway من ملف.
- `--session <key>`: مفتاح الجلسة الافتراضي.
- `--session-label <label>`: تسمية الجلسة الافتراضية المطلوب العثور عليها.
- `--require-existing`: الإخفاق إذا لم يكن مفتاح الجلسة أو تسميتها موجودًا.
- `--reset-session`: إعادة تعيين مفتاح الجلسة قبل الاستخدام الأول.
- `--no-prefix-cwd`: عدم إضافة دليل العمل كبادئة للمطالبات.
- `--provenance <off|meta|meta+receipt>`: تضمين بيانات منشأ ACP الوصفية أو الإيصالات.
- `--verbose, -v`: تسجيل تفصيلي في stderr.

ملاحظة أمنية:

- قد يظهر `--token` و`--password` في قوائم العمليات المحلية على بعض الأنظمة. يُفضّل استخدام `--token-file`/`--password-file` أو متغيرات البيئة (`OPENCLAW_GATEWAY_TOKEN` و`OPENCLAW_GATEWAY_PASSWORD`).
- يتبع تحديد مصادقة Gateway العقد المشترك الذي يستخدمه عملاء Gateway الآخرون:
  - الوضع المحلي: متغيرات البيئة (`OPENCLAW_GATEWAY_*`) ثم `gateway.auth.*`، مع الرجوع إلى `gateway.remote.*` فقط عندما لا تكون `gateway.auth.*` مضبوطة (يفشل SecretRef محلي مضبوط لكن يتعذر حله على نحو مغلق بدلًا من الرجوع بصمت)
  - الوضع البعيد: `gateway.remote.*` مع الرجوع إلى متغيرات البيئة/الإعدادات وفق قواعد أولوية الوضع البعيد
  - يمكن تجاوز `--url` بأمان، وهو لا يعيد استخدام بيانات اعتماد ضمنية من الإعدادات/متغيرات البيئة؛ مرّر `--token`/`--password` صراحةً (أو الصيغ التي تستخدم ملفات)

### خيارات `acp client`

- `--cwd <dir>`: دليل العمل لجلسة ACP.
- `--server <command>`: أمر خادم ACP (الافتراضي: `openclaw`).
- `--server-args <args...>`: وسيطات إضافية تُمرّر إلى خادم ACP.
- `--server-verbose`: تمكين التسجيل التفصيلي على خادم ACP.
- `--verbose, -v`: تسجيل تفصيلي للعميل.
- يضبط `openclaw acp client` المتغير `OPENCLAW_SHELL=acp-client` على عملية الجسر المُنشأة، ويمكن استخدامه لقواعد الصدفة/الملف الشخصي الخاصة بالسياق.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [وكلاء ACP](/ar/tools/acp-agents)

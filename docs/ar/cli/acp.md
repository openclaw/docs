---
read_when:
    - إعداد تكاملات IDE المعتمدة على ACP
    - تصحيح أخطاء توجيه جلسات ACP إلى Gateway
summary: تشغيل جسر ACP لتكاملات IDE
title: ACP
x-i18n:
    generated_at: "2026-04-24T07:33:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88b4d5de9e8e7464fd929ace0471af7d85afc94789c0c45a1f4a00d39b7871e1
    source_path: cli/acp.md
    workflow: 15
---

شغّل جسر [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) الذي يتحدث إلى OpenClaw Gateway.

يتحدث هذا الأمر ACP عبر stdio لبيئات IDE ويعيد توجيه المطالبات إلى Gateway
عبر WebSocket. كما يحافظ على ربط جلسات ACP بمفاتيح جلسات Gateway.

إن `openclaw acp` هو جسر ACP مدعوم بـ Gateway، وليس بيئة تشغيل تحرير
أصلية كاملة لـ ACP. فهو يركز على توجيه الجلسات، وتسليم المطالبات، وتحديثات
البث الأساسية.

إذا كنت تريد أن يتحدث عميل MCP خارجي مباشرةً إلى محادثات قنوات OpenClaw
بدلًا من استضافة جلسة harness خاصة بـ ACP، فاستخدم
[`openclaw mcp serve`](/ar/cli/mcp) بدلًا من ذلك.

## ما ليس عليه هذا الأمر

غالبًا ما يختلط هذا الصفحة مع جلسات harness الخاصة بـ ACP.

يعني `openclaw acp` ما يلي:

- يعمل OpenClaw كخادم ACP
- يتصل IDE أو عميل ACP بـ OpenClaw
- يعيد OpenClaw توجيه هذا العمل إلى جلسة Gateway

وهذا يختلف عن [وكلاء ACP](/ar/tools/acp-agents)، حيث يشغّل OpenClaw
حزمة harness خارجية مثل Codex أو Claude Code عبر `acpx`.

قاعدة سريعة:

- إذا كان المحرر/العميل يريد التحدث عبر ACP إلى OpenClaw: استخدم `openclaw acp`
- إذا كان يجب على OpenClaw تشغيل Codex/Claude/Gemini كـ ACP harness: استخدم `/acp spawn` و[وكلاء ACP](/ar/tools/acp-agents)

## مصفوفة التوافق

| مجال ACP                                                              | الحالة      | ملاحظات                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize` و`newSession` و`prompt` و`cancel`                        | مُنفَّذ     | تدفق الجسر الأساسي عبر stdio إلى Gateway chat/send + abort.                                                                                                                                                                            |
| `listSessions` وأوامر slash                                           | مُنفَّذ     | يعمل سرد الجلسات مقابل حالة جلسات Gateway؛ ويتم الإعلان عن الأوامر عبر `available_commands_update`.                                                                                                                                   |
| `loadSession`                                                         | جزئي        | يعيد ربط جلسة ACP بمفتاح جلسة Gateway ويعيد تشغيل سجل النصوص المخزنة للمستخدم/المساعد. ولم يُعَد إنشاء سجل الأدوات/النظام بعد.                                                                                                      |
| محتوى المطالبة (`text` و`resource` المضمّن والصور)                    | جزئي        | تُسطَّح النصوص/الموارد إلى مدخلات الدردشة؛ وتصبح الصور مرفقات Gateway.                                                                                                                                                                |
| أوضاع الجلسة                                                          | جزئي        | `session/set_mode` مدعوم، ويكشف الجسر عن عناصر تحكم أولية للجلسة مدعومة بـ Gateway لمستوى التفكير، وإسهاب الأدوات، والاستدلال، وتفاصيل الاستخدام، والإجراءات المرفوعة. أما الأسطح الأوسع لوضع/إعدادات ACP الأصلية فما تزال خارج النطاق. |
| تحديثات معلومات الجلسة والاستخدام                                     | جزئي        | يصدر الجسر إشعارات `session_info_update` و`usage_update` بأفضل جهد من لقطات جلسة Gateway المخزنة مؤقتًا. ويكون الاستخدام تقريبيًا ولا يُرسل إلا عندما يضع Gateway إجماليات الرموز على أنها حديثة.                                |
| بث الأدوات                                                            | جزئي        | تتضمن أحداث `tool_call` / `tool_call_update` الإدخال/الإخراج الخام، ومحتوى النص، ومواقع الملفات بأفضل جهد عندما تكشف وسائط/نتائج أدوات Gateway عنها. ولا تزال الطرفيات المضمّنة ومخرجات diff الأصلية الأكثر غنى غير مكشوفة.      |
| خوادم MCP لكل جلسة (`mcpServers`)                                     | غير مدعوم   | يرفض وضع الجسر طلبات خادم MCP لكل جلسة. اضبط MCP على OpenClaw gateway أو الوكيل بدلًا من ذلك.                                                                                                                                         |
| أساليب نظام ملفات العميل (`fs/read_text_file` و`fs/write_text_file`) | غير مدعوم   | لا يستدعي الجسر أساليب نظام ملفات عميل ACP.                                                                                                                                                                                            |
| أساليب طرفية العميل (`terminal/*`)                                   | غير مدعوم   | لا ينشئ الجسر طرفيات عميل ACP ولا يبث معرّفات الطرفيات عبر استدعاءات الأدوات.                                                                                                                                                         |
| خطط الجلسة / بث الأفكار                                               | غير مدعوم   | يصدر الجسر حاليًا نص المخرجات وحالة الأدوات، وليس تحديثات خطط ACP أو الأفكار.                                                                                                                                                         |

## القيود المعروفة

- يعيد `loadSession` تشغيل سجل النصوص المخزنة للمستخدم والمساعد، لكنه لا
  يعيد إنشاء استدعاءات الأدوات التاريخية، أو إشعارات النظام، أو أنواع
  أحداث ACP الأصلية الأكثر غنى.
- إذا شارك عدة عملاء ACP مفتاح جلسة Gateway نفسه، فإن توجيه الأحداث
  والإلغاء يكون بأفضل جهد بدلًا من العزل الصارم لكل عميل. لذا فضّل جلسات
  `acp:<uuid>` المعزولة الافتراضية عندما تحتاج إلى دورات محلية نظيفة للمحرر.
- تُترجم حالات إيقاف Gateway إلى أسباب إيقاف ACP، لكن هذا الربط أقل
  تعبيرًا من بيئة تشغيل أصلية كاملة لـ ACP.
- تكشف عناصر التحكم الأولية للجلسة حاليًا عن مجموعة مركزة من مفاتيح Gateway:
  مستوى التفكير، وإسهاب الأدوات، والاستدلال، وتفاصيل الاستخدام، والإجراءات
  المرفوعة. أما اختيار النموذج وعناصر تحكم exec-host فلم تُكشف بعد
  كخيارات إعداد لـ ACP.
- تُشتق `session_info_update` و`usage_update` من لقطات جلسات Gateway،
  وليس من محاسبة وقت تشغيل أصلية مباشرة لـ ACP. والاستخدام تقريبي،
  ولا يتضمن بيانات التكلفة، ولا يُصدر إلا عندما يعلّم Gateway بيانات
  إجمالي الرموز على أنها حديثة.
- بيانات متابعة الأدوات تكون بأفضل جهد. يمكن للجسر إظهار مسارات الملفات
  التي تظهر في وسائط/نتائج الأدوات المعروفة، لكنه لا يصدر بعد طرفيات ACP
  أو فروق ملفات منظَّمة.

## الاستخدام

```bash
openclaw acp

# Gateway بعيد
openclaw acp --url wss://gateway-host:18789 --token <token>

# Gateway بعيد (الرمز من ملف)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# الإرفاق بمفتاح جلسة موجود
openclaw acp --session agent:main:main

# الإرفاق حسب التسمية (يجب أن تكون موجودة بالفعل)
openclaw acp --session-label "support inbox"

# إعادة تعيين مفتاح الجلسة قبل أول مطالبة
openclaw acp --session agent:main:main --reset-session
```

## عميل ACP (تصحيح الأخطاء)

استخدم عميل ACP المدمج للتحقق السريع من الجسر من دون IDE.
فهو يشغّل جسر ACP ويتيح لك كتابة المطالبات بشكل تفاعلي.

```bash
openclaw acp client

# توجيه الجسر المُشغَّل إلى Gateway بعيد
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# تجاوز أمر الخادم (الافتراضي: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

نموذج الأذونات (وضع تصحيح العميل):

- تعتمد الموافقة التلقائية على allowlist ولا تنطبق إلا على معرّفات أدوات core الموثوقة.
- يقتصر `read` المعتمد تلقائيًا على دليل العمل الحالي (`--cwd` عند تعيينه).
- لا يعتمد ACP تلقائيًا إلا فئات ضيقة للقراءة فقط: استدعاءات `read` ضمن cwd النشط بالإضافة إلى أدوات البحث للقراءة فقط (`search` و`web_search` و`memory_search`). أما الأدوات غير المعروفة/غير الأساسية، وعمليات القراءة خارج النطاق، والأدوات القادرة على exec، وأدوات control-plane، والأدوات المعدِّلة، والتدفقات التفاعلية فتتطلب دائمًا موافقة صريحة عبر مطالبة.
- تُعامل القيمة `toolCall.kind` المقدمة من الخادم على أنها بيانات وصفية غير موثوقة (وليست مصدر تفويض).
- سياسة جسر ACP هذه منفصلة عن أذونات ACPX harness. إذا شغّلت OpenClaw عبر الواجهة الخلفية `acpx`، فإن `plugins.entries.acpx.config.permissionMode=approve-all` هو مفتاح الطوارئ “yolo” لتلك الجلسة الخاصة بالـ harness.

## كيفية استخدام هذا

استخدم ACP عندما يكون IDE (أو عميل آخر) يتحدث Agent Client Protocol وتريد
أن يقود جلسة OpenClaw Gateway.

1. تأكد من أن Gateway يعمل (محليًا أو عن بُعد).
2. اضبط هدف Gateway (إعدادات أو علامات).
3. وجّه IDE لديك لتشغيل `openclaw acp` عبر stdio.

مثال إعداد (محفوظ):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

مثال تشغيل مباشر (من دون كتابة إعدادات):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# مفضل لسلامة العمليات المحلية
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## اختيار الوكلاء

لا يختار ACP الوكلاء مباشرةً. بل يوجّه حسب مفتاح جلسة Gateway.

استخدم مفاتيح جلسات على مستوى الوكيل لاستهداف وكيل محدد:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

ترتبط كل جلسة ACP بمفتاح جلسة Gateway واحد. ويمكن لوكيل واحد أن يملك عدة
جلسات؛ ويستخدم ACP افتراضيًا جلسة معزولة `acp:<uuid>` ما لم تتجاوز
المفتاح أو التسمية.

لا يتم دعم `mcpServers` لكل جلسة في وضع الجسر. وإذا أرسلها عميل ACP
أثناء `newSession` أو `loadSession`، فسيعيد الجسر خطأ واضحًا بدلًا من تجاهلها
بشكل صامت.

إذا كنت تريد أن ترى الجلسات المدعومة بـ ACPX أدوات Plugin الخاصة بـ OpenClaw أو أدوات
مدمجة محددة مثل `cron`، فقم بتمكين جسور ACPX MCP على جانب gateway بدلًا
من محاولة تمرير `mcpServers` لكل جلسة. راجع
[وكلاء ACP](/ar/tools/acp-agents-setup#plugin-tools-mcp-bridge) و
[جسر MCP لأدوات OpenClaw](/ar/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## الاستخدام من `acpx` ‏(Codex وClaude وعملاء ACP آخرين)

إذا كنت تريد أن يتحدث وكيل برمجة مثل Codex أو Claude Code إلى
بوت OpenClaw الخاص بك عبر ACP، فاستخدم `acpx` مع الهدف المدمج `openclaw`.

التدفق المعتاد:

1. شغّل Gateway وتأكد من أن جسر ACP يمكنه الوصول إليه.
2. وجّه `acpx openclaw` إلى `openclaw acp`.
3. استهدف مفتاح جلسة OpenClaw الذي تريد أن يستخدمه وكيل البرمجة.

أمثلة:

```bash
# طلب لمرة واحدة إلى جلسة OpenClaw ACP الافتراضية
acpx openclaw exec "Summarize the active OpenClaw session state."

# جلسة مسماة دائمة لأدوار المتابعة
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

إذا كنت تريد أن يستهدف `acpx openclaw` دائمًا Gateway ومفتاح جلسة محددين،
فتجاوز أمر الوكيل `openclaw` في `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

بالنسبة إلى سحب OpenClaw محلي خاص بالمستودع، استخدم نقطة دخول CLI المباشرة بدلًا من
مشغّل التطوير بحيث يبقى تدفق ACP نظيفًا. على سبيل المثال:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

هذه هي أسهل طريقة لتمكين Codex أو Claude Code أو أي عميل آخر يدعم ACP
من سحب المعلومات السياقية من وكيل OpenClaw من دون كشط طرفية.

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

لاستهداف Gateway أو وكيل معيّن:

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

في Zed، افتح لوحة Agent وحدد "OpenClaw ACP" لبدء سلسلة.

## ربط الجلسات

افتراضيًا، تحصل جلسات ACP على مفتاح جلسة Gateway معزول ببادئة `acp:`.
ولإعادة استخدام جلسة معروفة، مرّر مفتاح جلسة أو تسمية:

- `--session <key>`: استخدم مفتاح جلسة Gateway محددًا.
- `--session-label <label>`: حل جلسة موجودة بحسب التسمية.
- `--reset-session`: أنشئ معرّف جلسة جديدًا لذلك المفتاح (المفتاح نفسه، وسجل جديد).

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

تعرّف على المزيد حول مفاتيح الجلسات في [/concepts/session](/ar/concepts/session).

## الخيارات

- `--url <url>`: عنوان URL الخاص بـ Gateway WebSocket (يستخدم افتراضيًا `gateway.remote.url` عند إعداده).
- `--token <token>`: رمز مصادقة Gateway.
- `--token-file <path>`: قراءة رمز مصادقة Gateway من ملف.
- `--password <password>`: كلمة مرور مصادقة Gateway.
- `--password-file <path>`: قراءة كلمة مرور مصادقة Gateway من ملف.
- `--session <key>`: مفتاح الجلسة الافتراضي.
- `--session-label <label>`: تسمية الجلسة الافتراضية المطلوب حلها.
- `--require-existing`: الفشل إذا لم يكن مفتاح/تسمية الجلسة موجودًا.
- `--reset-session`: إعادة تعيين مفتاح الجلسة قبل أول استخدام.
- `--no-prefix-cwd`: عدم إضافة دليل العمل الحالي كبادئة إلى المطالبات.
- `--provenance <off|meta|meta+receipt>`: تضمين البيانات الوصفية أو الإيصالات الخاصة بمصدر ACP.
- `--verbose, -v`: تسجيلات تفصيلية إلى stderr.

ملاحظة أمنية:

- قد يكون `--token` و`--password` مرئيين في قوائم العمليات المحلية على بعض الأنظمة.
- يُفضّل استخدام `--token-file`/`--password-file` أو متغيرات البيئة (`OPENCLAW_GATEWAY_TOKEN` و`OPENCLAW_GATEWAY_PASSWORD`).
- يتبع حل مصادقة Gateway العقد المشترك المستخدم من قبل عملاء Gateway الآخرين:
  - الوضع المحلي: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> الرجوع الاحتياطي إلى `gateway.remote.*` فقط عندما لا يكون `gateway.auth.*` معيّنًا (تفشل SecretRefs المحلية المهيأة ولكن غير المحلولة بشكل مغلق)
  - الوضع البعيد: `gateway.remote.*` مع الرجوع الاحتياطي env/config وفق قواعد أولوية الوضع البعيد
  - يُعد `--url` آمنًا للتجاوز ولا يعيد استخدام بيانات الاعتماد الضمنية من config/env؛ مرّر `--token`/`--password` صراحةً (أو نُسخهما المعتمدة على الملفات)
- تتلقى العمليات الفرعية للواجهة الخلفية لوقت تشغيل ACP متغير `OPENCLAW_SHELL=acp`، ويمكن استخدامه لقواعد shell/profile الخاصة بالسياق.
- يضبط `openclaw acp client` القيمة `OPENCLAW_SHELL=acp-client` على عملية الجسر التي يتم تشغيلها.

### خيارات `acp client`

- `--cwd <dir>`: دليل العمل لجلسة ACP.
- `--server <command>`: أمر خادم ACP (الافتراضي: `openclaw`).
- `--server-args <args...>`: وسائط إضافية تُمرَّر إلى خادم ACP.
- `--server-verbose`: تمكين التسجيلات التفصيلية على خادم ACP.
- `--verbose, -v`: تسجيلات عميل تفصيلية.

## ذو صلة

- [مرجع CLI](/ar/cli)
- [وكلاء ACP](/ar/tools/acp-agents)

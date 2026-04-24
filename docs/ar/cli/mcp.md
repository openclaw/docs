---
read_when:
    - ربط Codex أو Claude Code أو عميل MCP آخر بالقنوات المدعومة من OpenClaw
    - تشغيل `openclaw mcp serve`
    - إدارة تعريفات خوادم MCP المحفوظة في OpenClaw
summary: كشف محادثات قنوات OpenClaw عبر MCP وإدارة تعريفات خوادم MCP المحفوظة
title: MCP
x-i18n:
    generated_at: "2026-04-24T07:35:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9df42ebc547f07698f84888d8cd6125340d0f0e02974a965670844589e1fbf8
    source_path: cli/mcp.md
    workflow: 15
---

لدى `openclaw mcp` مهمتان:

- تشغيل OpenClaw كخادم MCP باستخدام `openclaw mcp serve`
- إدارة تعريفات خوادم MCP الصادرة والمملوكة لـ OpenClaw باستخدام `list` و`show` و
  `set` و`unset`

بعبارة أخرى:

- `serve` تعني أن OpenClaw يعمل كخادم MCP
- `list` / `show` / `set` / `unset` تعني أن OpenClaw يعمل كسجل
  طرف عميل MCP لخوادم MCP أخرى قد تستهلكها أوقات تشغيله لاحقًا

استخدم [`openclaw acp`](/ar/cli/acp) عندما ينبغي لـ OpenClaw أن يستضيف جلسة
coding harness بنفسه ويوجه وقت التشغيل هذا عبر ACP.

## OpenClaw كخادم MCP

هذا هو مسار `openclaw mcp serve`.

## متى تستخدم `serve`

استخدم `openclaw mcp serve` عندما:

- ينبغي أن يتحدث Codex أو Claude Code أو عميل MCP آخر مباشرةً إلى
  محادثات القنوات المدعومة من OpenClaw
- تكون لديك بالفعل Gateway محلية أو بعيدة لـ OpenClaw مع جلسات موجهة
- تريد خادم MCP واحدًا يعمل عبر الواجهات الخلفية لقنوات OpenClaw بدلًا
  من تشغيل جسور منفصلة لكل قناة

استخدم [`openclaw acp`](/ar/cli/acp) بدلًا من ذلك عندما ينبغي لـ OpenClaw أن يستضيف
وقت تشغيل coding بنفسه ويحافظ على جلسة الوكيل داخل OpenClaw.

## كيف يعمل

يبدأ `openclaw mcp serve` خادم MCP عبر stdio. ويتولى عميل MCP ملكية
هذه العملية. وطوال احتفاظ العميل بجلسة stdio مفتوحة، يتصل الجسر بـ
Gateway محلية أو بعيدة لـ OpenClaw عبر WebSocket ويكشف محادثات القنوات
الموجهة عبر MCP.

دورة الحياة:

1. يبدأ عميل MCP العملية `openclaw mcp serve`
2. يتصل الجسر بـ Gateway
3. تصبح الجلسات الموجهة محادثات MCP وأدوات transcript/history
4. تُصفّ الأحداث الحية في الذاكرة بينما يكون الجسر متصلًا
5. إذا كان وضع قناة Claude مفعّلًا، يمكن للجلسة نفسها أيضًا أن تتلقى
   إشعارات دفع خاصة بـ Claude

سلوك مهم:

- تبدأ حالة الصف الحي عند اتصال الجسر
- يُقرأ سجل transcript الأقدم باستخدام `messages_read`
- لا توجد إشعارات دفع Claude إلا ما دامت جلسة MCP حية
- عند قطع اتصال العميل، يخرج الجسر ويزول الصف الحي
- تُغلَق خوادم stdio MCP التي يبدأها OpenClaw (المضمّنة أو التي يهيئها المستخدم)
  كشجرة عمليات عند الإيقاف، بحيث لا تبقى العمليات الفرعية التي بدأها
  الخادم بعد خروج عميل stdio الأصل
- يؤدي حذف الجلسة أو إعادة تعيينها إلى التخلص من عملاء MCP الخاصين بتلك الجلسة عبر
  مسار التنظيف المشترك لوقت التشغيل، لذلك لا تبقى أي اتصالات stdio عالقة
  مرتبطة بجلسة تمت إزالتها

## اختر وضع عميل

استخدم الجسر نفسه بطريقتين مختلفتين:

- عملاء MCP العامون: أدوات MCP القياسية فقط. استخدم `conversations_list`,
  و`messages_read`, و`events_poll`, و`events_wait`, و`messages_send`, و
  أدوات الموافقات.
- Claude Code: أدوات MCP القياسية بالإضافة إلى مهايئ القناة الخاص بـ Claude.
  فعّل `--claude-channel-mode on` أو اترك القيمة الافتراضية `auto`.

اليوم، يتصرف `auto` بالطريقة نفسها التي يتصرف بها `on`. ولا يوجد حتى الآن
اكتشاف لقدرات العميل.

## ما الذي يكشفه `serve`

يستخدم الجسر بيانات تعريف توجيه الجلسة الموجودة في Gateway أصلًا لكشف
المحادثات المدعومة بالقنوات. وتظهر المحادثة عندما تكون لدى OpenClaw بالفعل حالة
جلسة ذات مسار معروف مثل:

- `channel`
- بيانات تعريف المستلم أو الوجهة
- `accountId` اختياري
- `threadId` اختياري

وهذا يمنح عملاء MCP مكانًا واحدًا لـ:

- إدراج المحادثات الموجهة الحديثة
- قراءة سجل transcript الحديث
- انتظار الأحداث الواردة الجديدة
- إرسال رد عبر المسار نفسه
- رؤية طلبات الموافقة التي تصل بينما يكون الجسر متصلًا

## الاستخدام

```bash
# Local Gateway
openclaw mcp serve

# Remote Gateway
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Remote Gateway with password auth
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# Enable verbose bridge logs
openclaw mcp serve --verbose

# Disable Claude-specific push notifications
openclaw mcp serve --claude-channel-mode off
```

## أدوات الجسر

يكشف الجسر الحالي أدوات MCP التالية:

- `conversations_list`
- `conversation_get`
- `messages_read`
- `attachments_fetch`
- `events_poll`
- `events_wait`
- `messages_send`
- `permissions_list_open`
- `permissions_respond`

### `conversations_list`

يعرض المحادثات الحديثة المدعومة بالجلسات والتي تحتوي أصلًا على بيانات تعريف التوجيه في
حالة جلسة Gateway.

عوامل التصفية المفيدة:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

يعيد محادثة واحدة حسب `session_key`.

### `messages_read`

يقرأ رسائل transcript الحديثة لمحادثة واحدة مدعومة بالجلسة.

### `attachments_fetch`

يستخرج كتل محتوى الرسائل غير النصية من رسالة transcript واحدة. وهذا
عرض للبيانات الوصفية فوق محتوى transcript، وليس مخزنًا مستقلًا ودائمًا
لـ attachment blob.

### `events_poll`

يقرأ الأحداث الحية المصطفة منذ مؤشر رقمي.

### `events_wait`

ينفذ long-polling إلى أن يصل الحدث التالي المطابق في الصف أو تنتهي المهلة.

استخدم هذا عندما يحتاج عميل MCP عام إلى تسليم شبه آني من دون
بروتوكول دفع خاص بـ Claude.

### `messages_send`

يرسل النص مرة أخرى عبر المسار نفسه المسجل مسبقًا في الجلسة.

السلوك الحالي:

- يتطلب مسار محادثة موجودًا
- يستخدم channel وrecipient وaccount id وthread id الخاصة بالجلسة
- يرسل النص فقط

### `permissions_list_open`

يعرض طلبات موافقة exec/Plugin المعلقة التي رصدها الجسر منذ
اتصاله بـ Gateway.

### `permissions_respond`

يعالج طلب موافقة exec/Plugin معلقًا واحدًا باستخدام:

- `allow-once`
- `allow-always`
- `deny`

## نموذج الأحداث

يحتفظ الجسر بصف أحداث داخل الذاكرة بينما يكون متصلًا.

أنواع الأحداث الحالية:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

حدود مهمة:

- الصف حي فقط؛ يبدأ عند بدء جسر MCP
- لا تعيد `events_poll` و`events_wait` تشغيل سجل Gateway الأقدم
  من تلقاء نفسيهما
- يجب قراءة التراكم الدائم باستخدام `messages_read`

## إشعارات قناة Claude

يمكن للجسر أيضًا كشف إشعارات قناة خاصة بـ Claude. وهذا هو
المكافئ في OpenClaw لمهايئ قناة Claude Code: تبقى أدوات MCP القياسية
متاحة، لكن الرسائل الواردة الحية يمكن أن تصل أيضًا كإشعارات MCP خاصة بـ Claude.

العلامات:

- `--claude-channel-mode off`: أدوات MCP القياسية فقط
- `--claude-channel-mode on`: تفعيل إشعارات قناة Claude
- `--claude-channel-mode auto`: الافتراضي الحالي؛ نفس سلوك الجسر الخاص بـ `on`

عندما يكون وضع قناة Claude مفعّلًا، يعلن الخادم عن قدرات Claude
التجريبية ويمكنه إصدار:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

سلوك الجسر الحالي:

- تُمرَّر رسائل transcript الواردة من نوع `user` كـ
  `notifications/claude/channel`
- تُتتبَّع طلبات أذونات Claude المستلمة عبر MCP داخل الذاكرة
- إذا أرسلت المحادثة المرتبطة لاحقًا `yes abcde` أو `no abcde`، فإن الجسر
  يحوّل ذلك إلى `notifications/claude/channel/permission`
- هذه الإشعارات خاصة بالجلسة الحية فقط؛ وإذا قطع عميل MCP الاتصال،
  فلا يوجد هدف دفع

هذا مقصود ليكون خاصًا بالعميل. ويجب على عملاء MCP العامين الاعتماد على
أدوات الاستطلاع القياسية.

## تهيئة عميل MCP

مثال على تهيئة عميل stdio:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

بالنسبة إلى معظم عملاء MCP العامين، ابدأ بسطح الأدوات القياسي وتجاهل
وضع Claude. ولا تفعّل وضع Claude إلا للعملاء الذين يفهمون فعلًا
طرائق الإشعار الخاصة بـ Claude.

## الخيارات

يدعم `openclaw mcp serve` ما يلي:

- `--url <url>`: عنوان URL لـ Gateway WebSocket
- `--token <token>`: رمز Gateway
- `--token-file <path>`: قراءة الرمز من ملف
- `--password <password>`: كلمة مرور Gateway
- `--password-file <path>`: قراءة كلمة المرور من ملف
- `--claude-channel-mode <auto|on|off>`: وضع إشعارات Claude
- `-v`, `--verbose`: سجلات تفصيلية على stderr

يفضَّل استخدام `--token-file` أو `--password-file` بدلًا من الأسرار المضمنة متى أمكن.

## الأمان وحدود الثقة

لا يخترع الجسر التوجيه. فهو يكشف فقط المحادثات التي تعرف Gateway
بالفعل كيف توجهها.

وهذا يعني:

- لا تزال قوائم سماح المرسلين، والاقتران، والثقة على مستوى القناة تتبع
  تهيئة قناة OpenClaw الأساسية
- لا يمكن لـ `messages_send` إلا الرد عبر مسار مخزن موجود
- تكون حالة الموافقات حية/داخل الذاكرة فقط لجلسة الجسر الحالية
- ينبغي أن تستخدم مصادقة الجسر نفس ضوابط رمز Gateway أو كلمة المرور التي
  ستثق بها لأي عميل Gateway بعيد آخر

إذا كانت محادثة مفقودة من `conversations_list`, فالسبب المعتاد ليس
تهيئة MCP. بل هو غياب بيانات تعريف التوجيه أو عدم اكتمالها في
جلسة Gateway الأساسية.

## الاختبار

يشحن OpenClaw اختبار smoke حتميًا في Docker لهذا الجسر:

```bash
pnpm test:docker:mcp-channels
```

هذا الاختبار:

- يبدأ حاوية Gateway مزروعة مسبقًا
- يبدأ حاوية ثانية تشغّل `openclaw mcp serve`
- يتحقق من اكتشاف المحادثات، وقراءة transcript، وقراءة بيانات attachment الوصفية،
  وسلوك صف الأحداث الحية، وتوجيه الإرسال الصادر
- يتحقق من إشعارات القناة والأذونات بأسلوب Claude عبر جسر stdio MCP الحقيقي

هذه أسرع طريقة لإثبات أن الجسر يعمل من دون ربط حساب Telegram أو Discord أو iMessage
حقيقي بعملية الاختبار.

للاطلاع على سياق اختبار أوسع، راجع [الاختبار](/ar/help/testing).

## استكشاف الأخطاء وإصلاحها

### لم يتم إرجاع أي محادثات

هذا يعني عادةً أن جلسة Gateway غير قابلة للتوجيه أصلًا. تأكد من أن
الجلسة الأساسية لديها channel/provider وrecipient و
بيانات تعريف account/thread الاختيارية مخزنة للتوجيه.

### تفوّت `events_poll` أو `events_wait` الرسائل الأقدم

هذا متوقع. يبدأ الصف الحي عند اتصال الجسر. اقرأ سجل transcript الأقدم
باستخدام `messages_read`.

### لا تظهر إشعارات Claude

تحقق من كل ما يلي:

- أبقى العميل جلسة stdio MCP مفتوحة
- قيمة `--claude-channel-mode` هي `on` أو `auto`
- العميل يفهم بالفعل طرائق الإشعار الخاصة بـ Claude
- حدثت الرسالة الواردة بعد اتصال الجسر

### الموافقات مفقودة

يعرض `permissions_list_open` فقط طلبات الموافقة التي رُصدت بينما كان الجسر
متصلًا. إنه ليس API لسجل موافقات دائم.

## OpenClaw كسجل عميل MCP

هذا هو مسار `openclaw mcp list`, و`show`, و`set`, و`unset`.

لا تكشف هذه الأوامر OpenClaw عبر MCP. بل تدير تعريفات خوادم MCP
المملوكة لـ OpenClaw تحت `mcp.servers` في تهيئة OpenClaw.

هذه التعريفات المحفوظة مخصصة لأوقات التشغيل التي يبدأها OpenClaw أو يهيئها
لاحقًا، مثل Pi المضمّن ومهايئات وقت التشغيل الأخرى. ويخزن OpenClaw
التعريفات مركزيًا حتى لا تحتاج تلك الأوقات التشغيلية إلى الاحتفاظ
بقوائم خوادم MCP مكررة خاصة بها.

سلوك مهم:

- هذه الأوامر تقرأ أو تكتب تهيئة OpenClaw فقط
- لا تتصل بخادم MCP الهدف
- لا تتحقق مما إذا كان الأمر أو عنوان URL أو النقل البعيد
  قابلًا للوصول الآن
- تحدد مهايئات وقت التشغيل أشكال النقل التي تدعمها فعلًا في
  وقت التنفيذ
- يكشف Pi المضمّن أدوات MCP المهيأة ضمن ملفي الأدوات العاديين `coding` و`messaging`
  ؛ ولا يزال `minimal` يخفيها، ويعطّلها `tools.deny: ["bundle-mcp"]`
  صراحةً

## تعريفات خوادم MCP المحفوظة

يخزن OpenClaw أيضًا سجلًا خفيفًا لخوادم MCP في التهيئة للأسطح
التي تريد تعريفات MCP مُدارة من OpenClaw.

الأوامر:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

ملاحظات:

- يرتّب `list` أسماء الخوادم.
- يطبع `show` بدون اسم كائن خادم MCP المهيأ كاملًا.
- يتوقع `set` قيمة كائن JSON واحدة على سطر الأوامر.
- يفشل `unset` إذا لم يكن الخادم المسمى موجودًا.

أمثلة:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

مثال على شكل التهيئة:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com"
      }
    }
  }
}
```

### نقل Stdio

يشغّل عملية فرعية محلية ويتواصل عبر stdin/stdout.

| الحقل                      | الوصف                              |
| -------------------------- | ---------------------------------- |
| `command`                  | الملف التنفيذي الذي سيُشغَّل (مطلوب) |
| `args`                     | مصفوفة من وسائط سطر الأوامر         |
| `env`                      | متغيرات بيئة إضافية                |
| `cwd` / `workingDirectory` | دليل العمل الخاص بالعملية           |

#### عامل تصفية أمان env في Stdio

يرفض OpenClaw مفاتيح env الخاصة ببدء تشغيل المفسّر التي يمكنها تغيير طريقة بدء خادم stdio MCP قبل أول RPC، حتى إذا ظهرت في كتلة `env` الخاصة بالخادم. وتتضمن المفاتيح المحظورة `NODE_OPTIONS` و`PYTHONSTARTUP` و`PYTHONPATH` و`PERL5OPT` و`RUBYOPT` و`SHELLOPTS` و`PS4` ومتغيرات مماثلة للتحكم بوقت التشغيل. ترفض عملية البدء هذه المفاتيح بخطأ في التهيئة حتى لا تتمكن من حقن تمهيد ضمني، أو تبديل المفسّر، أو تفعيل مصحح أخطاء على عملية stdio. ولا تتأثر متغيرات البيئة العادية الخاصة ببيانات الاعتماد والوكيل والخادم المحدد (`GITHUB_TOKEN` و`HTTP_PROXY` و`*_API_KEY` المخصصة، إلخ).

إذا كان خادم MCP الخاص بك يحتاج فعلًا إلى أحد المتغيرات المحظورة، فاضبطه على عملية مضيف Gateway بدلًا من وضعه ضمن `env` الخاصة بخادم stdio.

### نقل SSE / HTTP

يتصل بخادم MCP بعيد عبر HTTP Server-Sent Events.

| الحقل                 | الوصف                                                           |
| --------------------- | --------------------------------------------------------------- |
| `url`                 | عنوان URL لـ HTTP أو HTTPS الخاص بالخادم البعيد (مطلوب)         |
| `headers`             | خريطة اختيارية لمفاتيح/قيم ترويسات HTTP (مثل رموز المصادقة)     |
| `connectionTimeoutMs` | مهلة اتصال لكل خادم بالميلي ثانية (اختياري)                    |

مثال:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

تُحجَب القيم الحساسة في `url` ‏(userinfo) و`headers` في السجلات
ومخرجات الحالة.

### نقل Streamable HTTP

يُعد `streamable-http` خيار نقل إضافيًا إلى جانب `sse` و`stdio`. ويستخدم تدفق HTTP للاتصال ثنائي الاتجاه مع خوادم MCP البعيدة.

| الحقل                 | الوصف                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------- |
| `url`                 | عنوان URL لـ HTTP أو HTTPS الخاص بالخادم البعيد (مطلوب)                                |
| `transport`           | اضبطه على `"streamable-http"` لاختيار هذا النقل؛ وعند حذفه يستخدم OpenClaw `sse`      |
| `headers`             | خريطة اختيارية لمفاتيح/قيم ترويسات HTTP (مثل رموز المصادقة)                            |
| `connectionTimeoutMs` | مهلة اتصال لكل خادم بالميلي ثانية (اختياري)                                            |

مثال:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

تدير هذه الأوامر التهيئة المحفوظة فقط. وهي لا تبدأ جسر القناة،
ولا تفتح جلسة عميل MCP حية، ولا تثبت أن الخادم الهدف يمكن الوصول إليه.

## الحدود الحالية

توثق هذه الصفحة الجسر كما يُشحن اليوم.

الحدود الحالية:

- يعتمد اكتشاف المحادثات على بيانات تعريف توجيه جلسة Gateway الموجودة
- لا يوجد بروتوكول دفع عام يتجاوز المهايئ الخاص بـ Claude
- لا توجد بعد أدوات لتعديل الرسائل أو إضافة التفاعلات
- يتصل نقل HTTP/SSE/streamable-http بخادم بعيد واحد؛ ولا يوجد بعد مصدر علوي متعدد الإرسال
- يتضمن `permissions_list_open` فقط الموافقات التي لوحظت بينما كان الجسر
  متصلًا

## ذو صلة

- [مرجع CLI](/ar/cli)
- [Plugins](/ar/cli/plugins)

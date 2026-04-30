---
read_when:
    - ربط Codex أو Claude Code أو عميل MCP آخر بالقنوات المدعومة من OpenClaw
    - تشغيل `openclaw mcp serve`
    - إدارة تعريفات خوادم MCP المحفوظة في OpenClaw
sidebarTitle: MCP
summary: إتاحة محادثات قنوات OpenClaw عبر MCP وإدارة تعريفات خوادم MCP المحفوظة
title: MCP
x-i18n:
    generated_at: "2026-04-30T07:48:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: d66ec20b81ab3894c7202ee1c1c6666bd9cdeffc8d48a280b1f298bb358887ef
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` له مهمتان:

- تشغيل OpenClaw كخادم MCP باستخدام `openclaw mcp serve`
- إدارة تعريفات خوادم MCP الصادرة المملوكة من OpenClaw باستخدام `list` و`show` و`set` و`unset`

بعبارة أخرى:

- `serve` يعني أن OpenClaw يعمل كخادم MCP
- `list` / `show` / `set` / `unset` تعني أن OpenClaw يعمل كسجل من جهة عميل MCP لخوادم MCP أخرى قد تستهلكها بيئات التشغيل الخاصة به لاحقًا

استخدم [`openclaw acp`](/ar/cli/acp) عندما ينبغي أن يستضيف OpenClaw جلسة بيئة ترميز بنفسه ويوجّه بيئة التشغيل تلك عبر ACP.

## OpenClaw كخادم MCP

هذا هو مسار `openclaw mcp serve`.

### متى تستخدم `serve`

استخدم `openclaw mcp serve` عندما:

- ينبغي أن يتواصل Codex أو Claude Code أو عميل MCP آخر مباشرةً مع محادثات القنوات المدعومة من OpenClaw
- لديك بالفعل Gateway محلي أو بعيد من OpenClaw مع جلسات موجهة
- تريد خادم MCP واحدًا يعمل عبر خلفيات قنوات OpenClaw بدلًا من تشغيل جسور منفصلة لكل قناة

استخدم [`openclaw acp`](/ar/cli/acp) بدلًا من ذلك عندما ينبغي أن يستضيف OpenClaw بيئة تشغيل الترميز نفسها وأن يُبقي جلسة الوكيل داخل OpenClaw.

### كيف يعمل

يبدأ `openclaw mcp serve` خادم MCP عبر stdio. يمتلك عميل MCP تلك العملية. وبينما يُبقي العميل جلسة stdio مفتوحة، يتصل الجسر بـ Gateway محلي أو بعيد من OpenClaw عبر WebSocket ويعرض محادثات القنوات الموجهة عبر MCP.

<Steps>
  <Step title="ينشئ العميل الجسر">
    ينشئ عميل MCP العملية `openclaw mcp serve`.
  </Step>
  <Step title="يتصل الجسر بـ Gateway">
    يتصل الجسر بـ Gateway الخاص بـ OpenClaw عبر WebSocket.
  </Step>
  <Step title="تصبح الجلسات محادثات MCP">
    تصبح الجلسات الموجهة محادثات MCP وأدوات للنص/السجل.
  </Step>
  <Step title="اصطفاف الأحداث المباشرة">
    تُصفّ الأحداث المباشرة في الذاكرة أثناء اتصال الجسر.
  </Step>
  <Step title="دفع Claude اختياري">
    إذا كان وضع قناة Claude مفعّلًا، فيمكن للجلسة نفسها أيضًا تلقي إشعارات دفع خاصة بـ Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="سلوك مهم">
    - تبدأ حالة قائمة الانتظار المباشرة عندما يتصل الجسر
    - يُقرأ سجل النصوص الأقدم باستخدام `messages_read`
    - لا توجد إشعارات دفع Claude إلا أثناء بقاء جلسة MCP حيّة
    - عندما يقطع العميل الاتصال، يخرج الجسر وتختفي قائمة الانتظار المباشرة
    - نقاط دخول الوكيل أحادية التشغيل مثل `openclaw agent` و`openclaw infer model run` تُنهي أي بيئات تشغيل MCP مضمّنة تفتحها عند اكتمال الرد، لذلك لا تؤدي عمليات التشغيل النصية المتكررة إلى تراكم عمليات stdio MCP فرعية
    - خوادم stdio MCP التي يطلقها OpenClaw، سواء كانت مضمّنة أو مهيأة من المستخدم، تُنهى كشجرة عمليات عند الإيقاف، لذلك لا تبقى العمليات الفرعية التي بدأها الخادم بعد خروج عميل stdio الأب
    - يؤدي حذف جلسة أو إعادة ضبطها إلى التخلص من عملاء MCP الخاصين بتلك الجلسة عبر مسار تنظيف بيئة التشغيل المشترك، لذلك لا تبقى اتصالات stdio عالقة مرتبطة بجلسة أُزيلت

  </Accordion>
</AccordionGroup>

### اختر وضع العميل

استخدم الجسر نفسه بطريقتين مختلفتين:

<Tabs>
  <Tab title="عملاء MCP العامون">
    أدوات MCP القياسية فقط. استخدم `conversations_list` و`messages_read` و`events_poll` و`events_wait` و`messages_send` وأدوات الموافقة.
  </Tab>
  <Tab title="Claude Code">
    أدوات MCP القياسية بالإضافة إلى موائم القناة الخاص بـ Claude. فعّل `--claude-channel-mode on` أو اترك الإعداد الافتراضي `auto`.
  </Tab>
</Tabs>

<Note>
اليوم، يتصرف `auto` بالطريقة نفسها مثل `on`. لا يوجد اكتشاف لقدرات العميل حتى الآن.
</Note>

### ما الذي يعرضه `serve`

يستخدم الجسر بيانات تعريف مسارات جلسات Gateway الموجودة لعرض المحادثات المدعومة بالقنوات. تظهر محادثة عندما تكون لدى OpenClaw بالفعل حالة جلسة ذات مسار معروف مثل:

- `channel`
- بيانات تعريف المستلم أو الوجهة
- `accountId` اختياري
- `threadId` اختياري

يمنح هذا عملاء MCP مكانًا واحدًا من أجل:

- سرد المحادثات الموجهة الحديثة
- قراءة سجل النصوص الحديث
- انتظار أحداث واردة جديدة
- إرسال رد عبر المسار نفسه
- رؤية طلبات الموافقة التي تصل أثناء اتصال الجسر

### الاستخدام

<Tabs>
  <Tab title="Gateway محلي">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Gateway بعيد (رمز)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Gateway بعيد (كلمة مرور)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="تفصيلي / إيقاف Claude">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### أدوات الجسر

يعرض الجسر الحالي أدوات MCP هذه:

<AccordionGroup>
  <Accordion title="conversations_list">
    يسرد المحادثات الحديثة المدعومة بالجلسات التي لديها بالفعل بيانات تعريف مسار في حالة جلسة Gateway.

    عوامل تصفية مفيدة:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    يعيد محادثة واحدة حسب `session_key`.
  </Accordion>
  <Accordion title="messages_read">
    يقرأ رسائل النصوص الحديثة لمحادثة واحدة مدعومة بجلسة.
  </Accordion>
  <Accordion title="attachments_fetch">
    يستخرج كتل محتوى الرسائل غير النصية من رسالة نصية واحدة. هذه طريقة عرض للبيانات التعريفية فوق محتوى النصوص، وليست مخزن كتل مرفقات دائمًا مستقلًا.
  </Accordion>
  <Accordion title="events_poll">
    يقرأ الأحداث المباشرة المصطفة منذ مؤشر رقمي.
  </Accordion>
  <Accordion title="events_wait">
    ينفّذ استقصاءً طويلًا حتى يصل الحدث المصطف المطابق التالي أو تنتهي مهلة الانتظار.

    استخدم هذا عندما يحتاج عميل MCP عام إلى تسليم شبه فوري من دون بروتوكول دفع خاص بـ Claude.

  </Accordion>
  <Accordion title="messages_send">
    يرسل نصًا عبر المسار نفسه المسجل مسبقًا في الجلسة.

    السلوك الحالي:

    - يتطلب مسار محادثة موجودًا
    - يستخدم قناة الجلسة والمستلم ومعرّف الحساب ومعرّف سلسلة المحادثة
    - يرسل النص فقط

  </Accordion>
  <Accordion title="permissions_list_open">
    يسرد طلبات موافقة exec/Plugin المعلقة التي رصدها الجسر منذ اتصاله بـ Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    يحل طلب موافقة exec/Plugin معلقًا واحدًا باستخدام:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### نموذج الأحداث

يحتفظ الجسر بقائمة انتظار أحداث في الذاكرة أثناء اتصاله.

أنواع الأحداث الحالية:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- قائمة الانتظار مباشرة فقط؛ تبدأ عندما يبدأ جسر MCP
- لا يعيد `events_poll` و`events_wait` تشغيل سجل Gateway الأقدم تلقائيًا
- ينبغي قراءة السجل الدائم باستخدام `messages_read`

</Warning>

### إشعارات قناة Claude

يمكن للجسر أيضًا عرض إشعارات قناة خاصة بـ Claude. هذا هو مكافئ OpenClaw لموائم قناة Claude Code: تبقى أدوات MCP القياسية متاحة، لكن الرسائل الواردة المباشرة يمكن أن تصل أيضًا كإشعارات MCP خاصة بـ Claude.

<Tabs>
  <Tab title="إيقاف">
    `--claude-channel-mode off`: أدوات MCP القياسية فقط.
  </Tab>
  <Tab title="تشغيل">
    `--claude-channel-mode on`: تفعيل إشعارات قناة Claude.
  </Tab>
  <Tab title="تلقائي (الافتراضي)">
    `--claude-channel-mode auto`: الإعداد الافتراضي الحالي؛ سلوك الجسر نفسه مثل `on`.
  </Tab>
</Tabs>

عند تفعيل وضع قناة Claude، يعلن الخادم قدرات Claude التجريبية ويمكنه إصدار:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

سلوك الجسر الحالي:

- تُمرر رسائل النصوص الواردة من نوع `user` على أنها `notifications/claude/channel`
- تُتبع طلبات أذونات Claude المستلمة عبر MCP في الذاكرة
- إذا أرسلت المحادثة المرتبطة لاحقًا `yes abcde` أو `no abcde`، يحول الجسر ذلك إلى `notifications/claude/channel/permission`
- هذه الإشعارات خاصة بالجلسة المباشرة فقط؛ إذا قطع عميل MCP الاتصال، فلا يوجد هدف دفع

هذا مقصود لعميل محدد. ينبغي لعملاء MCP العامين الاعتماد على أدوات الاستقصاء القياسية.

### تهيئة عميل MCP

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

بالنسبة إلى معظم عملاء MCP العامين، ابدأ بسطح الأدوات القياسي وتجاهل وضع Claude. شغّل وضع Claude فقط للعملاء الذين يفهمون بالفعل طرق الإشعارات الخاصة بـ Claude.

### الخيارات

يدعم `openclaw mcp serve` ما يلي:

<ParamField path="--url" type="string">
  عنوان URL الخاص بـ WebSocket لـ Gateway.
</ParamField>
<ParamField path="--token" type="string">
  رمز Gateway.
</ParamField>
<ParamField path="--token-file" type="string">
  قراءة الرمز من ملف.
</ParamField>
<ParamField path="--password" type="string">
  كلمة مرور Gateway.
</ParamField>
<ParamField path="--password-file" type="string">
  قراءة كلمة المرور من ملف.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  وضع إشعارات Claude.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  سجلات تفصيلية على stderr.
</ParamField>

<Tip>
يفضل استخدام `--token-file` أو `--password-file` بدلًا من الأسرار المضمنة متى أمكن.
</Tip>

### الأمان وحدود الثقة

لا يخترع الجسر التوجيه. إنه لا يعرض إلا المحادثات التي يعرف Gateway بالفعل كيفية توجيهها.

هذا يعني:

- قوائم السماح للمرسلين والاقتران والثقة على مستوى القناة تبقى تابعة لتهيئة قناة OpenClaw الأساسية
- لا يستطيع `messages_send` إلا الرد عبر مسار مخزن موجود
- حالة الموافقة مباشرة/في الذاكرة فقط لجلسة الجسر الحالية
- ينبغي أن تستخدم مصادقة الجسر عناصر التحكم نفسها لرمز Gateway أو كلمة مروره التي تثق بها لأي عميل Gateway بعيد آخر

إذا كانت محادثة مفقودة من `conversations_list`، فالسبب المعتاد ليس تهيئة MCP. بل هو بيانات تعريف مسار مفقودة أو غير مكتملة في جلسة Gateway الأساسية.

### الاختبار

يوفر OpenClaw اختبار Docker smoke حتميًا لهذا الجسر:

```bash
pnpm test:docker:mcp-channels
```

هذا الاختبار:

- يبدأ حاوية Gateway ذات بيانات أولية
- يبدأ حاوية ثانية تنشئ `openclaw mcp serve`
- يتحقق من اكتشاف المحادثات، وقراءات النصوص، وقراءات بيانات تعريف المرفقات، وسلوك قائمة انتظار الأحداث المباشرة، وتوجيه الإرسال الصادر
- يتحقق من إشعارات القناة والأذونات بأسلوب Claude عبر جسر stdio MCP الحقيقي

هذه أسرع طريقة لإثبات أن الجسر يعمل من دون ربط حساب Telegram أو Discord أو iMessage حقيقي بتشغيل الاختبار.

لمزيد من سياق الاختبار، راجع [الاختبار](/ar/help/testing).

### استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لم تُعد أي محادثات">
    يعني هذا عادةً أن جلسة Gateway ليست قابلة للتوجيه مسبقًا. تأكد من أن الجلسة الأساسية لديها بيانات تعريف مسار مخزنة للقناة/الموفر والمستلم وبيانات الحساب/سلسلة المحادثة الاختيارية.
  </Accordion>
  <Accordion title="يفوت events_poll أو events_wait الرسائل الأقدم">
    متوقع. تبدأ قائمة الانتظار المباشرة عندما يتصل الجسر. اقرأ سجل النصوص الأقدم باستخدام `messages_read`.
  </Accordion>
  <Accordion title="لا تظهر إشعارات Claude">
    تحقق من كل ما يلي:

    - أبقى العميل جلسة stdio MCP مفتوحة
    - `--claude-channel-mode` مضبوط على `on` أو `auto`
    - يفهم العميل بالفعل طرق الإشعارات الخاصة بـ Claude
    - حدثت الرسالة الواردة بعد اتصال الجسر

  </Accordion>
  <Accordion title="الموافقات مفقودة">
    يعرض `permissions_list_open` فقط طلبات الموافقة التي رُصدت أثناء اتصال الجسر. إنه ليس API لسجل موافقات دائم.
  </Accordion>
</AccordionGroup>

## OpenClaw كسجل عميل MCP

هذا هو مسار `openclaw mcp list` و`show` و`set` و`unset`.

لا تعرض هذه الأوامر OpenClaw عبر MCP. إنها تدير تعريفات خوادم MCP المملوكة لـ OpenClaw ضمن `mcp.servers` في إعدادات OpenClaw.

هذه التعريفات المحفوظة مخصصة لبيئات التشغيل التي يطلقها OpenClaw أو يهيئها لاحقا، مثل Pi المضمّن ومحوّلات بيئات التشغيل الأخرى. يخزن OpenClaw التعريفات مركزيا حتى لا تحتاج تلك البيئات إلى الاحتفاظ بقوائم خوادم MCP مكررة خاصة بها.

<AccordionGroup>
  <Accordion title="سلوك مهم">
    - هذه الأوامر تقرأ إعدادات OpenClaw أو تكتبها فقط
    - لا تتصل بخادم MCP الهدف
    - لا تتحقق مما إذا كان الأمر أو عنوان URL أو النقل البعيد قابلا للوصول الآن
    - تحدد محوّلات بيئات التشغيل أشكال النقل التي تدعمها فعليا في وقت التنفيذ
    - يعرض Pi المضمّن أدوات MCP المهيأة في ملفات تعريف الأدوات العادية `coding` و`messaging`؛ لا يزال `minimal` يخفيها، ويعطلها `tools.deny: ["bundle-mcp"]` صراحة
    - تتم إزالة بيئات تشغيل MCP المجمعة محددة الجلسة بعد `mcp.sessionIdleTtlMs` مللي ثانية من وقت الخمول (الافتراضي 10 دقائق؛ عيّن `0` للتعطيل) وتنظفها عمليات التشغيل المضمّنة لمرة واحدة عند نهاية التشغيل

  </Accordion>
</AccordionGroup>

قد تطبع محوّلات بيئات التشغيل هذا السجل المشترك في الشكل الذي يتوقعه العميل التابع لها. على سبيل المثال، يستهلك Pi المضمّن قيم `transport` الخاصة بـ OpenClaw مباشرة، بينما يتلقى Claude Code وGemini قيم `type` أصلية في CLI مثل `http` أو `sse` أو `stdio`.

### تعريفات خوادم MCP المحفوظة

يخزن OpenClaw أيضا سجل خوادم MCP خفيفا في الإعدادات للأسطح التي تريد تعريفات MCP مُدارة من OpenClaw.

الأوامر:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

ملاحظات:

- يرتب `list` أسماء الخوادم.
- يطبع `show` بدون اسم كائن خادم MCP المهيأ بالكامل.
- يتوقع `set` قيمة كائن JSON واحدة في سطر الأوامر.
- استخدم `transport: "streamable-http"` لخوادم Streamable HTTP MCP. يطبع `openclaw mcp set` أيضا `type: "http"` الأصلي في CLI إلى شكل الإعدادات القياسي نفسه للتوافق.
- يفشل `unset` إذا لم يكن الخادم المسمى موجودا.

أمثلة:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp unset context7
```

مثال على شكل الإعدادات:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com",
        "transport": "streamable-http"
      }
    }
  }
}
```

### نقل Stdio

يطلق عملية فرعية محلية ويتواصل عبر stdin/stdout.

| الحقل                      | الوصف                       |
| -------------------------- | --------------------------------- |
| `command`                  | الملف التنفيذي المراد تشغيله (مطلوب)    |
| `args`                     | مصفوفة وسائط سطر الأوامر   |
| `env`                      | متغيرات بيئة إضافية       |
| `cwd` / `workingDirectory` | دليل العمل للعملية |

<Warning>
**مرشح أمان بيئة Stdio**

يرفض OpenClaw مفاتيح البيئة الخاصة ببدء تشغيل المفسر التي يمكن أن تغير كيفية بدء خادم stdio MCP قبل أول RPC، حتى إذا ظهرت في كتلة `env` الخاصة بالخادم. تشمل المفاتيح المحظورة `NODE_OPTIONS` و`PYTHONSTARTUP` و`PYTHONPATH` و`PERL5OPT` و`RUBYOPT` و`SHELLOPTS` و`PS4` ومتغيرات التحكم في بيئة التشغيل المشابهة. يرفض بدء التشغيل هذه المفاتيح بخطأ إعدادات حتى لا تتمكن من حقن تمهيد ضمني أو تبديل المفسر أو تمكين مصحح أخطاء على عملية stdio. لا تتأثر متغيرات البيئة العادية الخاصة بالاعتمادات والوكيل والخادم (`GITHUB_TOKEN` و`HTTP_PROXY` و`*_API_KEY` مخصص، وما إلى ذلك).

إذا كان خادم MCP الخاص بك يحتاج فعلا إلى أحد المتغيرات المحظورة، فعيّنه على عملية مضيف Gateway بدلا من وضعه تحت `env` الخاص بخادم stdio.
</Warning>

### نقل SSE / HTTP

يتصل بخادم MCP بعيد عبر HTTP Server-Sent Events.

| الحقل                 | الوصف                                                      |
| --------------------- | ---------------------------------------------------------------- |
| `url`                 | عنوان URL بخاصية HTTP أو HTTPS للخادم البعيد (مطلوب)                |
| `headers`             | خريطة اختيارية من مفاتيح وقيم لترويسات HTTP (مثل رموز المصادقة) |
| `connectionTimeoutMs` | مهلة اتصال لكل خادم بالمللي ثانية (اختياري)                   |

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

تُحجب القيم الحساسة في `url` (userinfo) و`headers` في السجلات ومخرجات الحالة.

### نقل Streamable HTTP

`streamable-http` خيار نقل إضافي إلى جانب `sse` و`stdio`. يستخدم بث HTTP للتواصل ثنائي الاتجاه مع خوادم MCP البعيدة.

| الحقل                 | الوصف                                                                            |
| --------------------- | -------------------------------------------------------------------------------------- |
| `url`                 | عنوان URL بخاصية HTTP أو HTTPS للخادم البعيد (مطلوب)                                      |
| `transport`           | اضبطه على `"streamable-http"` لاختيار هذا النقل؛ عند حذفه، يستخدم OpenClaw `sse` |
| `headers`             | خريطة اختيارية من مفاتيح وقيم لترويسات HTTP (مثل رموز المصادقة)                       |
| `connectionTimeoutMs` | مهلة اتصال لكل خادم بالمللي ثانية (اختياري)                                         |

تستخدم إعدادات OpenClaw `transport: "streamable-http"` كالصياغة القياسية. تُقبل قيم MCP الأصلية في CLI مثل `type: "http"` عند حفظها عبر `openclaw mcp set` ويتم إصلاحها بواسطة `openclaw doctor --fix` في الإعدادات الموجودة، لكن `transport` هو ما يستهلكه Pi المضمّن مباشرة.

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

<Note>
تدير هذه الأوامر الإعدادات المحفوظة فقط. لا تبدأ جسر القناة، ولا تفتح جلسة عميل MCP مباشرة، ولا تثبت أن الخادم الهدف قابل للوصول.
</Note>

## الحدود الحالية

توثق هذه الصفحة الجسر كما هو مشحون اليوم.

الحدود الحالية:

- يعتمد اكتشاف المحادثات على بيانات تعريف مسار جلسة Gateway الموجودة
- لا يوجد بروتوكول دفع عام يتجاوز المحوّل الخاص بـ Claude
- لا توجد أدوات تعديل الرسائل أو التفاعل معها بعد
- يتصل نقل HTTP/SSE/streamable-http بخادم بعيد واحد؛ لا يوجد تدفق علوي متعدد الإرسال بعد
- يتضمن `permissions_list_open` فقط الموافقات التي تمت ملاحظتها أثناء اتصال الجسر

## ذو صلة

- [مرجع CLI](/ar/cli)
- [Plugins](/ar/cli/plugins)

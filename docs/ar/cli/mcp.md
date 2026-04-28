---
read_when:
    - ربط Codex أو Claude Code أو عميل MCP آخر بقنوات مدعومة من OpenClaw
    - تشغيل `openclaw mcp serve`
    - إدارة تعريفات خوادم MCP المحفوظة في OpenClaw
sidebarTitle: MCP
summary: اعرض محادثات قنوات OpenClaw عبر MCP وأدر تعريفات خوادم MCP المحفوظة
title: MCP
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:26:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e003d974a7ae989f240d7608470ddcf2f37e20ca342cf4569c14677dc6fc1d8
    source_path: cli/mcp.md
    workflow: 15
---

لدى `openclaw mcp` مهمتان:

- تشغيل OpenClaw كخادم MCP باستخدام `openclaw mcp serve`
- إدارة تعريفات خوادم MCP الصادرة المملوكة لـ OpenClaw باستخدام `list` و`show` و`set` و`unset`

بعبارة أخرى:

- `serve` يعني أن OpenClaw يعمل كخادم MCP
- `list` / `show` / `set` / `unset` تعني أن OpenClaw يعمل كسجل جهة عميل MCP لخوادم MCP الأخرى التي قد تستخدمها بيئات تشغيله لاحقًا

استخدم [`openclaw acp`](/ar/cli/acp) عندما يجب على OpenClaw استضافة جلسة coding harness بنفسه وتمرير وقت التشغيل هذا عبر ACP.

## OpenClaw كخادم MCP

هذا هو مسار `openclaw mcp serve`.

### متى تستخدم `serve`

استخدم `openclaw mcp serve` عندما:

- يجب أن يتحدث Codex أو Claude Code أو عميل MCP آخر مباشرةً مع محادثات القنوات المدعومة من OpenClaw
- يكون لديك بالفعل Gateway محلي أو بعيد لـ OpenClaw مع جلسات موجّهة
- تريد خادم MCP واحدًا يعمل عبر واجهات القنوات الخلفية في OpenClaw بدلًا من تشغيل جسور منفصلة لكل قناة

استخدم [`openclaw acp`](/ar/cli/acp) بدلًا من ذلك عندما يجب على OpenClaw استضافة وقت تشغيل البرمجة بنفسه والإبقاء على جلسة الوكيل داخل OpenClaw.

### كيف يعمل

يبدأ `openclaw mcp serve` خادم MCP عبر stdio. يمتلك عميل MCP هذه العملية. وبينما يُبقي العميل جلسة stdio مفتوحة، يتصل الجسر بـ OpenClaw Gateway المحلي أو البعيد عبر WebSocket ويعرض محادثات القنوات الموجّهة عبر MCP.

<Steps>
  <Step title="العميل يشغّل الجسر">
    يقوم عميل MCP بتشغيل `openclaw mcp serve`.
  </Step>
  <Step title="الجسر يتصل بـ Gateway">
    يتصل الجسر بـ OpenClaw Gateway عبر WebSocket.
  </Step>
  <Step title="تتحول الجلسات إلى محادثات MCP">
    تتحول الجلسات الموجّهة إلى محادثات MCP وأدوات transcript/history.
  </Step>
  <Step title="طابور الأحداث الحية">
    يتم وضع الأحداث الحية في طابور في الذاكرة بينما يكون الجسر متصلًا.
  </Step>
  <Step title="دفع Claude الاختياري">
    إذا كان وضع قناة Claude مفعّلًا، فيمكن للجلسة نفسها أيضًا تلقي إشعارات دفع خاصة بـ Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="سلوك مهم">
    - تبدأ حالة الطابور الحي عندما يتصل الجسر
    - تتم قراءة transcript history الأقدم باستخدام `messages_read`
    - لا توجد إشعارات دفع Claude إلا أثناء بقاء جلسة MCP حية
    - عند فصل العميل، يخرج الجسر ويختفي الطابور الحي
    - نقاط دخول الوكيل ذات التشغيل لمرة واحدة مثل `openclaw agent` و`openclaw infer model run` تُنهي أي بيئات تشغيل MCP مضمّنة تفتحها عند اكتمال الرد، لذلك لا تؤدي عمليات التشغيل البرمجية المتكررة إلى تراكم عمليات stdio MCP الفرعية
    - يتم إيقاف خوادم stdio MCP التي يشغّلها OpenClaw (سواء كانت مضمّنة أو مهيأة من المستخدم) كشجرة عمليات عند الإغلاق، لذلك لا تبقى العمليات الفرعية التي يبدأها الخادم بعد خروج عميل stdio الأصلي
    - يؤدي حذف الجلسة أو إعادة تعيينها إلى التخلص من عملاء MCP الخاصين بتلك الجلسة عبر مسار التنظيف المشترك لوقت التشغيل، لذلك لا تبقى اتصالات stdio عالقة مرتبطة بجلسة تمت إزالتها
  </Accordion>
</AccordionGroup>

### اختر وضع العميل

استخدم الجسر نفسه بطريقتين مختلفتين:

<Tabs>
  <Tab title="عملاء MCP العامّون">
    أدوات MCP القياسية فقط. استخدم `conversations_list` و`messages_read` و`events_poll` و`events_wait` و`messages_send` وأدوات الموافقة.
  </Tab>
  <Tab title="Claude Code">
    أدوات MCP القياسية بالإضافة إلى مهايئ القناة الخاص بـ Claude. فعّل `--claude-channel-mode on` أو اترك القيمة الافتراضية `auto`.
  </Tab>
</Tabs>

<Note>
حاليًا، يتصرف `auto` بالطريقة نفسها مثل `on`. لا يوجد بعد اكتشاف لقدرات العميل.
</Note>

### ما الذي يعرضه `serve`

يستخدم الجسر بيانات تعريف مسار الجلسة الموجودة بالفعل في Gateway لعرض المحادثات المدعومة بالقنوات. وتظهر المحادثة عندما يكون لدى OpenClaw بالفعل حالة جلسة بمسار معروف مثل:

- `channel`
- بيانات تعريف المستلم أو الوجهة
- `accountId` اختياري
- `threadId` اختياري

وهذا يمنح عملاء MCP مكانًا واحدًا من أجل:

- إدراج المحادثات الموجّهة الحديثة
- قراءة transcript history الحديث
- انتظار الأحداث الواردة الجديدة
- إرسال رد مرة أخرى عبر المسار نفسه
- رؤية طلبات الموافقة التي تصل بينما يكون الجسر متصلًا

### الاستخدام

<Tabs>
  <Tab title="Gateway محلي">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Gateway بعيد (token)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Gateway بعيد (password)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="Verbose / تعطيل Claude">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### أدوات الجسر

يعرض الجسر الحالي أدوات MCP التالية:

<AccordionGroup>
  <Accordion title="conversations_list">
    يسرد المحادثات الحديثة المدعومة بالجلسات والتي لديها بالفعل بيانات تعريف مسار في حالة جلسة Gateway.

    عوامل التصفية المفيدة:

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
    يقرأ رسائل transcript الحديثة لمحادثة واحدة مدعومة بجلسة.
  </Accordion>
  <Accordion title="attachments_fetch">
    يستخرج كتل محتوى الرسائل غير النصية من رسالة transcript واحدة. هذا عرض بيانات وصفية فوق محتوى transcript، وليس مخزنًا مستقلاً دائمًا لكائنات المرفقات.
  </Accordion>
  <Accordion title="events_poll">
    يقرأ الأحداث الحية الموضوعة في الطابور منذ مؤشر رقمي.
  </Accordion>
  <Accordion title="events_wait">
    ينفذ long-poll حتى يصل الحدث التالي المطابق في الطابور أو تنتهي المهلة.

    استخدم هذا عندما يحتاج عميل MCP عام إلى تسليم شبه فوري بدون بروتوكول دفع خاص بـ Claude.

  </Accordion>
  <Accordion title="messages_send">
    يرسل نصًا مرة أخرى عبر نفس المسار المسجل بالفعل على الجلسة.

    السلوك الحالي:

    - يتطلب مسار محادثة موجودًا
    - يستخدم channel الخاص بالجلسة والمستلم ومعرّف الحساب ومعرّف السلسلة
    - يرسل نصًا فقط

  </Accordion>
  <Accordion title="permissions_list_open">
    يسرد طلبات موافقة exec/plugin المعلقة التي رصدها الجسر منذ اتصاله بـ Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    يحسم طلب موافقة exec/plugin معلق واحد باستخدام:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### نموذج الأحداث

يحتفظ الجسر بطابور أحداث داخل الذاكرة أثناء اتصاله.

أنواع الأحداث الحالية:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- الطابور حي فقط؛ يبدأ عندما يبدأ جسر MCP
- لا يعيد `events_poll` و`events_wait` تشغيل سجل Gateway الأقدم من تلقاء نفسيهما
- يجب قراءة السجل الدائم المؤجل باستخدام `messages_read`
</Warning>

### إشعارات قناة Claude

يمكن للجسر أيضًا عرض إشعارات قناة خاصة بـ Claude. وهذا هو مكافئ OpenClaw لمهايئ قناة Claude Code: تبقى أدوات MCP القياسية متاحة، لكن الرسائل الواردة الحية يمكن أن تصل أيضًا كإشعارات MCP خاصة بـ Claude.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: أدوات MCP القياسية فقط.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: تفعيل إشعارات قناة Claude.
  </Tab>
  <Tab title="auto (افتراضي)">
    `--claude-channel-mode auto`: الافتراضي الحالي؛ نفس سلوك الجسر مثل `on`.
  </Tab>
</Tabs>

عند تفعيل وضع قناة Claude، يعلن الخادم عن قدرات Claude التجريبية ويمكنه إرسال:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

سلوك الجسر الحالي:

- تُمرَّر رسائل transcript الواردة من النوع `user` على أنها `notifications/claude/channel`
- يتم تتبع طلبات صلاحيات Claude المستلمة عبر MCP داخل الذاكرة
- إذا أرسلت المحادثة المرتبطة لاحقًا `yes abcde` أو `no abcde`، فإن الجسر يحول ذلك إلى `notifications/claude/channel/permission`
- هذه الإشعارات خاصة بالجلسة الحية فقط؛ وإذا فصل عميل MCP الاتصال، فلن يكون هناك هدف للدفع

هذا مقصود ليكون خاصًا بالعميل. أما عملاء MCP العامّون فيجب أن يعتمدوا على أدوات polling القياسية.

### إعداد عميل MCP

مثال على إعداد عميل stdio:

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

بالنسبة إلى معظم عملاء MCP العامّين، ابدأ بسطح الأدوات القياسي وتجاهل وضع Claude. فعّل وضع Claude فقط للعملاء الذين يفهمون بالفعل أساليب الإشعارات الخاصة بـ Claude.

### الخيارات

يدعم `openclaw mcp serve` ما يلي:

<ParamField path="--url" type="string">
  URL الخاص بـ Gateway WebSocket.
</ParamField>
<ParamField path="--token" type="string">
  token الخاص بـ Gateway.
</ParamField>
<ParamField path="--token-file" type="string">
  قراءة token من ملف.
</ParamField>
<ParamField path="--password" type="string">
  password الخاص بـ Gateway.
</ParamField>
<ParamField path="--password-file" type="string">
  قراءة password من ملف.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  وضع إشعارات Claude.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  سجلات Verbose على stderr.
</ParamField>

<Tip>
فضّل استخدام `--token-file` أو `--password-file` بدلًا من الأسرار المضمنة مباشرة كلما أمكن.
</Tip>

### الأمان وحدود الثقة

لا يخترع الجسر التوجيه. إنه يعرض فقط المحادثات التي يعرف Gateway بالفعل كيفية توجيهها.

وهذا يعني أن:

- لا تزال قوائم سماح المرسلين والاقتران والثقة على مستوى القناة تابعة لإعدادات قناة OpenClaw الأساسية
- لا يمكن لـ `messages_send` الرد إلا عبر مسار مخزن موجود
- تكون حالة الموافقة حية/داخل الذاكرة فقط لجلسة الجسر الحالية
- يجب أن تستخدم مصادقة الجسر عناصر تحكم token أو password الخاصة بـ Gateway نفسها التي تثق بها لأي عميل Gateway بعيد آخر

إذا كانت محادثة مفقودة من `conversations_list`، فالسبب المعتاد ليس إعداد MCP. بل هو غياب أو نقص بيانات تعريف المسار في جلسة Gateway الأساسية.

### الاختبار

يشحن OpenClaw اختبار smoke حتميًا عبر Docker لهذا الجسر:

```bash
pnpm test:docker:mcp-channels
```

ويقوم اختبار smoke هذا بما يلي:

- يبدأ حاوية Gateway مُهيأة مسبقًا
- يبدأ حاوية ثانية تشغّل `openclaw mcp serve`
- يتحقق من اكتشاف المحادثات وقراءات transcript وقراءات البيانات الوصفية للمرفقات وسلوك طابور الأحداث الحية وتوجيه الإرسال الصادر
- يتحقق من صحة إشعارات القناة والصلاحيات بأسلوب Claude عبر جسر stdio MCP الحقيقي

هذه هي أسرع طريقة لإثبات أن الجسر يعمل دون ربط حساب Telegram أو Discord أو iMessage حقيقي بعملية الاختبار.

للحصول على سياق اختبار أوسع، راجع [الاختبار](/ar/help/testing).

### استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لم يتم إرجاع أي محادثات">
    يعني هذا عادةً أن جلسة Gateway ليست قابلة للتوجيه بالفعل. تأكد من أن الجلسة الأساسية تحتوي على بيانات تعريف مسار مخزنة للقناة/المزوّد والمستلم، وبيانات تعريف اختيارية للحساب/السلسلة.
  </Accordion>
  <Accordion title="يفوّت `events_poll` أو `events_wait` الرسائل الأقدم">
    هذا متوقع. يبدأ الطابور الحي عندما يتصل الجسر. اقرأ transcript history الأقدم باستخدام `messages_read`.
  </Accordion>
  <Accordion title="لا تظهر إشعارات Claude">
    تحقّق من كل ما يلي:

    - أبقى العميل جلسة stdio MCP مفتوحة
    - قيمة `--claude-channel-mode` هي `on` أو `auto`
    - يفهم العميل بالفعل أساليب الإشعارات الخاصة بـ Claude
    - حدثت الرسالة الواردة بعد اتصال الجسر

  </Accordion>
  <Accordion title="الموافقات مفقودة">
    يعرض `permissions_list_open` فقط طلبات الموافقة التي تمت ملاحظتها بينما كان الجسر متصلًا. وليس API لسجل موافقات دائم.
  </Accordion>
</AccordionGroup>

## OpenClaw كسجل عميل MCP

هذا هو مسار `openclaw mcp list` و`show` و`set` و`unset`.

لا تعرض هذه الأوامر OpenClaw عبر MCP. إنها تدير تعريفات خوادم MCP المملوكة لـ OpenClaw تحت `mcp.servers` في إعدادات OpenClaw.

هذه التعريفات المحفوظة مخصصة لبيئات التشغيل التي يشغّلها OpenClaw أو يهيئها لاحقًا، مثل Pi المضمّن ومهايئات وقت التشغيل الأخرى. ويخزن OpenClaw التعريفات مركزيًا حتى لا تحتاج تلك البيئات إلى الاحتفاظ بقوائم خوادم MCP مكررة خاصة بها.

<AccordionGroup>
  <Accordion title="سلوك مهم">
    - تقرأ هذه الأوامر إعدادات OpenClaw أو تكتبها فقط
    - لا تتصل بخادم MCP المستهدف
    - لا تتحقق مما إذا كان الأمر أو URL أو النقل البعيد قابلاً للوصول الآن
    - تقرر مهايئات وقت التشغيل أشكال النقل التي تدعمها فعليًا وقت التنفيذ
    - يعرّض Pi المضمّن أدوات MCP المهيأة في ملفات الأدوات العادية `coding` و`messaging`؛ بينما يظل `minimal` يخفيها، كما أن `tools.deny: ["bundle-mcp"]` يعطلها صراحةً
    - تتم إعادة جمع بيئات تشغيل MCP المضمّنة ذات نطاق الجلسة بعد `mcp.sessionIdleTtlMs` ميلي ثانية من الخمول (الافتراضي 10 دقائق؛ اضبط القيمة `0` للتعطيل)، وتقوم عمليات التشغيل المضمّنة لمرة واحدة بتنظيفها عند نهاية التشغيل
  </Accordion>
</AccordionGroup>

قد تقوم مهايئات وقت التشغيل بتسوية هذا السجل المشترك إلى الشكل الذي يتوقعه العميل التابع لها. على سبيل المثال، يستهلك Pi المضمّن قيم `transport` الخاصة بـ OpenClaw مباشرةً، بينما تتلقى Claude Code وGemini قيم `type` الأصلية في CLI مثل `http` أو `sse` أو `stdio`.

### تعريفات خوادم MCP المحفوظة

يخزن OpenClaw أيضًا سجلًا خفيفًا لخوادم MCP في الإعدادات للواجهات التي تريد تعريفات MCP مُدارة من OpenClaw.

الأوامر:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

ملاحظات:

- يقوم `list` بترتيب أسماء الخوادم.
- يطبع `show` بدون اسم كائن خوادم MCP المهيأ بالكامل.
- يتوقع `set` قيمة كائن JSON واحدة في سطر الأوامر.
- يفشل `unset` إذا لم يكن الخادم المسمى موجودًا.

أمثلة:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
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
        "url": "https://mcp.example.com"
      }
    }
  }
}
```

### نقل Stdio

يشغّل عملية فرعية محلية ويتواصل عبر stdin/stdout.

| الحقل                      | الوصف                            |
| -------------------------- | -------------------------------- |
| `command`                  | الملف التنفيذي المراد تشغيله (مطلوب) |
| `args`                     | مصفوفة من وسيطات سطر الأوامر     |
| `env`                      | متغيرات بيئة إضافية              |
| `cwd` / `workingDirectory` | دليل العمل للعملية               |

<Warning>
**مرشح أمان env لـ Stdio**

يرفض OpenClaw مفاتيح بيئة بدء تشغيل المفسر التي يمكنها تغيير طريقة بدء خادم stdio MCP قبل أول RPC، حتى إذا ظهرت في كتلة `env` الخاصة بالخادم. تشمل المفاتيح المحظورة `NODE_OPTIONS` و`PYTHONSTARTUP` و`PYTHONPATH` و`PERL5OPT` و`RUBYOPT` و`SHELLOPTS` و`PS4` ومتغيرات مشابهة للتحكم بوقت التشغيل. ويرفض بدء التشغيل هذه المفاتيح بخطأ إعدادات حتى لا تتمكن من حقن مقدمة ضمنية أو تبديل المفسر أو تفعيل مصحح أخطاء على عملية stdio. ولا تتأثر متغيرات البيئة العادية الخاصة ببيانات الاعتماد والوكيل والخادم، مثل `GITHUB_TOKEN` و`HTTP_PROXY` و`*_API_KEY` المخصصة، وما شابه ذلك.

إذا كان خادم MCP لديك يحتاج فعلًا إلى أحد المتغيرات المحظورة، فقم بتعيينه على عملية مضيف Gateway بدلًا من وضعه تحت `env` الخاصة بخادم stdio.
</Warning>

### نقل SSE / HTTP

يتصل بخادم MCP بعيد عبر HTTP Server-Sent Events.

| الحقل                 | الوصف                                                           |
| --------------------- | --------------------------------------------------------------- |
| `url`                 | عنوان URL بخادم HTTP أو HTTPS للخادم البعيد (مطلوب)             |
| `headers`             | خريطة اختيارية من أزواج مفاتيح-قيم لرؤوس HTTP (مثل رموز المصادقة) |
| `connectionTimeoutMs` | مهلة الاتصال لكل خادم بالميلي ثانية (اختياري)                  |

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

يتم حجب القيم الحساسة في `url` (userinfo) و`headers` في السجلات ومخرجات الحالة.

### نقل HTTP القابل للبث

`streamable-http` هو خيار نقل إضافي إلى جانب `sse` و`stdio`. ويستخدم بث HTTP للاتصال ثنائي الاتجاه مع خوادم MCP البعيدة.

| الحقل                 | الوصف                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------- |
| `url`                 | عنوان URL بخادم HTTP أو HTTPS للخادم البعيد (مطلوب)                                      |
| `transport`           | عيّنه إلى `"streamable-http"` لاختيار هذا النقل؛ وعند حذفه، يستخدم OpenClaw `sse`        |
| `headers`             | خريطة اختيارية من أزواج مفاتيح-قيم لرؤوس HTTP (مثل رموز المصادقة)                         |
| `connectionTimeoutMs` | مهلة الاتصال لكل خادم بالميلي ثانية (اختياري)                                            |

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
تدير هذه الأوامر الإعدادات المحفوظة فقط. فهي لا تبدأ جسر القناة، ولا تفتح جلسة عميل MCP حية، ولا تثبت أن الخادم المستهدف قابل للوصول.
</Note>

## الحدود الحالية

توثق هذه الصفحة الجسر كما هو مشحون اليوم.

الحدود الحالية:

- يعتمد اكتشاف المحادثات على بيانات تعريف مسار جلسة Gateway الموجودة
- لا يوجد بروتوكول دفع عام بخلاف المهايئ الخاص بـ Claude
- لا توجد حتى الآن أدوات لتحرير الرسائل أو التفاعل معها
- يتصل نقل HTTP/SSE/streamable-http بخادم بعيد واحد؛ ولا يوجد بعد upstream متعدد الإرسال
- يتضمن `permissions_list_open` فقط الموافقات التي تمت ملاحظتها بينما كان الجسر متصلًا

## ذو صلة

- [مرجع CLI](/ar/cli)
- [Plugins](/ar/cli/plugins)

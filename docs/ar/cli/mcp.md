---
read_when:
    - ربط Codex أو Claude Code أو عميل MCP آخر بقنوات مدعومة من OpenClaw
    - تشغيل `openclaw mcp serve`
    - إدارة تعريفات خوادم MCP المحفوظة بواسطة OpenClaw
sidebarTitle: MCP
summary: اعرض محادثات قنوات OpenClaw عبر MCP وأدِر تعريفات خوادم MCP المحفوظة
title: MCP
x-i18n:
    generated_at: "2026-06-27T17:21:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2bf7050a3a712f761e3008c978f14a7576c9c6fa69d139894acbdcc0f20894b
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` له مهمتان:

- تشغيل OpenClaw كخادم MCP باستخدام `openclaw mcp serve`
- إدارة تعريفات خوادم MCP الصادرة المُدارة بواسطة OpenClaw باستخدام `list` و`show` و`status` و`doctor` و`probe` و`add` و`set` و`configure` و`tools` و`login` و`logout` و`reload` و`unset`

بعبارة أخرى:

- `serve` هو OpenClaw وهو يعمل كخادم MCP
- الأوامر الفرعية الأخرى هي OpenClaw وهو يعمل كسجل من جهة عميل MCP لخوادم MCP التي قد تستهلكها بيئات تشغيله لاحقًا

<Note>
  لا تقرأ `list` و`show` و`set` و`unset` ولا تكتب إلا إدخالات `mcp.servers` المُدارة بواسطة OpenClaw في إعدادات OpenClaw. وهي لا تتضمن خوادم mcporter من `config/mcporter.json`؛ استخدم `mcporter list` لذلك السجل.
</Note>

استخدم [`openclaw acp`](/ar/cli/acp) عندما يجب أن يستضيف OpenClaw جلسة حزمة ترميز بنفسه ويوجه بيئة التشغيل تلك عبر ACP.

## اختيار مسار MCP الصحيح

لدى OpenClaw عدة أسطح MCP. اختر السطح الذي يطابق الجهة التي تملك بيئة تشغيل الوكيل والجهة التي تملك الأدوات.

| الهدف                                                                | الاستخدام                                                                  | السبب                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| السماح لعميل MCP خارجي بقراءة/إرسال محادثات قنوات OpenClaw | `openclaw mcp serve`                                                 | يكون OpenClaw هو خادم MCP ويكشف المحادثات المدعومة بـ Gateway عبر stdio.                                 |
| حفظ خوادم MCP تابعة لأطراف خارجية لتشغيلات وكلاء مُدارة بواسطة OpenClaw        | `openclaw mcp add` و`set` و`configure` و`tools` و`login`             | يكون OpenClaw هو سجل جهة عميل MCP ثم يُسقط تلك الخوادم لاحقًا في بيئات التشغيل المؤهلة.               |
| فحص خادم محفوظ دون تشغيل دورة وكيل                  | `openclaw mcp status` و`doctor` و`probe`                             | يفحص `status` و`doctor` الإعدادات؛ ويفتح `probe` اتصال MCP مباشرًا ويسرد القدرات.               |
| تحرير إعداد MCP من متصفح                                      | واجهة التحكم `/mcp`                                                    | تعرض الصفحة الجرد، والتمكين، وملخصات OAuth/المرشحات، وتلميحات الأوامر، ومحرر `mcp` محدود النطاق.         |
| منح خادم تطبيق Codex خادم MCP أصليًا محدود النطاق                    | `mcp.servers.<name>.codex`                                           | لا تؤثر كتلة `codex` إلا في إسقاط خيط خادم تطبيق Codex وتُزال قبل تسليم الإعدادات الأصلية. |
| تشغيل جلسات حزمة مستضافة عبر ACP                                     | [`openclaw acp`](/ar/cli/acp) و[وكلاء ACP](/ar/tools/acp-agents-setup) | لا يقبل وضع جسر ACP حقن خادم MCP لكل جلسة؛ اضبط جسور Gateway/Plugin بدلًا من ذلك.     |

<Tip>
إذا لم تكن متأكدًا من المسار الذي تحتاجه، ابدأ بـ `openclaw mcp status --verbose`. يعرض ما حفظه OpenClaw دون بدء أي خوادم MCP.
</Tip>

## OpenClaw كخادم MCP

هذا هو مسار `openclaw mcp serve`.

### متى تستخدم `serve`

استخدم `openclaw mcp serve` عندما:

- يجب أن يتحدث Codex أو Claude Code أو عميل MCP آخر مباشرةً إلى محادثات القنوات المدعومة من OpenClaw
- لديك بالفعل Gateway محلي أو بعيد من OpenClaw مع جلسات موجهة
- تريد خادم MCP واحدًا يعمل عبر خلفيات قنوات OpenClaw بدلًا من تشغيل جسور منفصلة لكل قناة

استخدم [`openclaw acp`](/ar/cli/acp) بدلًا من ذلك عندما يجب أن يستضيف OpenClaw بيئة تشغيل الترميز نفسها ويحافظ على جلسة الوكيل داخل OpenClaw.

### كيف يعمل

يبدأ `openclaw mcp serve` خادم MCP عبر stdio. يملك عميل MCP تلك العملية. ما دام العميل يُبقي جلسة stdio مفتوحة، يتصل الجسر بـ Gateway محلي أو بعيد من OpenClaw عبر WebSocket ويكشف محادثات القنوات الموجهة عبر MCP.

<Steps>
  <Step title="يشغّل العميل الجسر">
    يشغّل عميل MCP الأمر `openclaw mcp serve`.
  </Step>
  <Step title="يتصل الجسر بـ Gateway">
    يتصل الجسر بـ OpenClaw Gateway عبر WebSocket.
  </Step>
  <Step title="تصبح الجلسات محادثات MCP">
    تصبح الجلسات الموجهة محادثات MCP وأدوات النصوص/السجل.
  </Step>
  <Step title="تصطف الأحداث المباشرة في الطابور">
    تُصفّ الأحداث المباشرة في الذاكرة أثناء اتصال الجسر.
  </Step>
  <Step title="دفع Claude اختياري">
    إذا كان وضع قناة Claude مفعّلًا، يمكن للجلسة نفسها أيضًا تلقي إشعارات دفع خاصة بـ Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="سلوك مهم">
    - تبدأ حالة الطابور المباشر عندما يتصل الجسر
    - يُقرأ سجل النصوص الأقدم باستخدام `messages_read`
    - لا توجد إشعارات دفع Claude إلا أثناء بقاء جلسة MCP حية
    - عند قطع اتصال العميل، يخرج الجسر ويختفي الطابور المباشر
    - تُوقف نقاط دخول الوكيل ذات التشغيل الواحد مثل `openclaw agent` و`openclaw infer model run` أي بيئات تشغيل MCP مضمنة تفتحها عند اكتمال الرد، لذلك لا تُراكم التشغيلات النصية المتكررة عمليات stdio فرعية لـ MCP
    - تُفكك خوادم stdio MCP التي يطلقها OpenClaw (مضمنة أو مُعدة من المستخدم) كشجرة عمليات عند إيقاف التشغيل، لذلك لا تبقى العمليات الفرعية التي بدأها الخادم بعد خروج عميل stdio الأب
    - يؤدي حذف جلسة أو إعادة تعيينها إلى التخلص من عملاء MCP لتلك الجلسة عبر مسار تنظيف بيئة التشغيل المشترك، لذلك لا تبقى اتصالات stdio عالقة مرتبطة بجلسة تمت إزالتها

  </Accordion>
</AccordionGroup>

### اختيار وضع العميل

استخدم الجسر نفسه بطريقتين مختلفتين:

<Tabs>
  <Tab title="عملاء MCP عامون">
    أدوات MCP القياسية فقط. استخدم `conversations_list` و`messages_read` و`events_poll` و`events_wait` و`messages_send` وأدوات الموافقة.
  </Tab>
  <Tab title="Claude Code">
    أدوات MCP القياسية بالإضافة إلى موائم القناة الخاص بـ Claude. فعّل `--claude-channel-mode on` أو اترك الإعداد الافتراضي `auto`.
  </Tab>
</Tabs>

<Note>
اليوم، يتصرف `auto` مثل `on`. لا يوجد اكتشاف لقدرات العميل بعد.
</Note>

### ما يكشفه `serve`

يستخدم الجسر بيانات تعريف مسار جلسة Gateway الحالية لكشف المحادثات المدعومة بالقنوات. تظهر المحادثة عندما تكون لدى OpenClaw بالفعل حالة جلسة ذات مسار معروف مثل:

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
  <Tab title="تفصيلي / Claude متوقف">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### أدوات الجسر

يكشف الجسر الحالي أدوات MCP هذه:

<AccordionGroup>
  <Accordion title="conversations_list">
    يسرد المحادثات الحديثة المدعومة بجلسات والتي لديها بالفعل بيانات تعريف مسار في حالة جلسة Gateway.

    مرشحات مفيدة:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    يعيد محادثة واحدة حسب `session_key` باستخدام بحث مباشر في جلسة Gateway.
  </Accordion>
  <Accordion title="messages_read">
    يقرأ رسائل النصوص الحديثة لمحادثة واحدة مدعومة بجلسة.
  </Accordion>
  <Accordion title="attachments_fetch">
    يستخرج كتل محتوى الرسائل غير النصية من رسالة نصية واحدة. هذا عرض بيانات تعريف فوق محتوى النصوص، وليس مخزن كتل مرفقات متينًا مستقلًا.
  </Accordion>
  <Accordion title="events_poll">
    يقرأ الأحداث المباشرة الموضوعة في الطابور منذ مؤشر رقمي.
  </Accordion>
  <Accordion title="events_wait">
    يجري استطلاعًا طويلًا حتى وصول الحدث التالي المطابق في الطابور أو انتهاء المهلة.

    استخدم هذا عندما يحتاج عميل MCP عام إلى تسليم شبه فوري دون بروتوكول دفع خاص بـ Claude.

  </Accordion>
  <Accordion title="messages_send">
    يرسل نصًا عبر المسار نفسه المسجل بالفعل في الجلسة.

    السلوك الحالي:

    - يتطلب مسار محادثة موجودًا
    - يستخدم قناة الجلسة، والمستلم، ومعرف الحساب، ومعرف الخيط
    - يرسل نصًا فقط

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

يحتفظ الجسر بطابور أحداث في الذاكرة أثناء اتصاله.

أنواع الأحداث الحالية:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- الطابور مباشر فقط؛ يبدأ عند بدء جسر MCP
- لا يعيد `events_poll` و`events_wait` تشغيل سجل Gateway الأقدم بنفسيهما
- يجب قراءة السجل المتين باستخدام `messages_read`

</Warning>

### إشعارات قناة Claude

يمكن للجسر أيضًا كشف إشعارات قناة خاصة بـ Claude. هذا هو مكافئ OpenClaw لموائم قناة Claude Code: تظل أدوات MCP القياسية متاحة، لكن يمكن أن تصل الرسائل الواردة المباشرة أيضًا كإشعارات MCP خاصة بـ Claude.

<Tabs>
  <Tab title="متوقف">
    `--claude-channel-mode off`: أدوات MCP القياسية فقط.
  </Tab>
  <Tab title="مفعّل">
    `--claude-channel-mode on`: تفعيل إشعارات قناة Claude.
  </Tab>
  <Tab title="auto (افتراضي)">
    `--claude-channel-mode auto`: الافتراضي الحالي؛ سلوك الجسر نفسه كما في `on`.
  </Tab>
</Tabs>

عند تفعيل وضع قناة Claude، يعلن الخادم عن قدرات Claude التجريبية ويمكنه إصدار:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

سلوك الجسر الحالي:

- تُمرر رسائل نصوص `user` الواردة كـ `notifications/claude/channel`
- تُتعقب طلبات إذن Claude المستلمة عبر MCP في الذاكرة
- إذا أرسلت المحادثة المرتبطة لاحقًا `yes abcde` أو `no abcde`، يحول الجسر ذلك إلى `notifications/claude/channel/permission`
- هذه الإشعارات خاصة بالجلسة المباشرة فقط؛ إذا قطع عميل MCP الاتصال، فلا يوجد هدف دفع

هذا مقصود أن يكون خاصًا بالعميل. ينبغي لعملاء MCP العامين الاعتماد على أدوات الاستطلاع القياسية.

### إعداد عميل MCP

مثال إعداد عميل stdio:

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

بالنسبة لمعظم عملاء MCP العامين، ابدأ بسطح الأدوات القياسي وتجاهل وضع Claude. شغّل وضع Claude فقط للعملاء الذين يفهمون فعلًا طرائق الإشعار الخاصة بـ Claude.

### الخيارات

يدعم `openclaw mcp serve`:

<ParamField path="--url" type="string">
  عنوان URL لـ WebSocket الخاص بـ Gateway.
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
فضّل `--token-file` أو `--password-file` على الأسرار المضمّنة مباشرة عندما يكون ذلك ممكنًا.
</Tip>

### الأمان وحدود الثقة

لا يخترع الجسر التوجيه. إنه يكشف فقط المحادثات التي يعرف Gateway أصلًا كيفية توجيهها.

هذا يعني:

- قوائم السماح للمرسلين، والإقران، والثقة على مستوى القناة تظل تابعة لإعدادات قناة OpenClaw الأساسية
- لا يمكن لـ `messages_send` الرد إلا عبر مسار مخزّن موجود
- حالة الموافقة مباشرة/داخل الذاكرة فقط لجلسة الجسر الحالية
- يجب أن تستخدم مصادقة الجسر عناصر التحكم نفسها في رمز Gateway أو كلمة مروره التي تثق بها لأي عميل Gateway بعيد آخر

إذا كانت محادثة مفقودة من `conversations_list`، فالسبب المعتاد ليس إعدادات MCP. بل بيانات تعريف مسار مفقودة أو غير مكتملة في جلسة Gateway الأساسية.

### الاختبار

يشحن OpenClaw اختبار دخان Docker حتميًا لهذا الجسر:

```bash
pnpm test:docker:mcp-channels
```

هذا اختبار الدخان:

- يبدأ حاوية Gateway مهيأة ببذرة
- يبدأ حاوية ثانية تنشئ `openclaw mcp serve`
- يتحقق من اكتشاف المحادثات، وقراءات النصوص، وقراءات بيانات تعريف المرفقات، وسلوك قائمة انتظار الأحداث المباشرة، وتوجيه الإرسال الصادر
- يتحقق من إشعارات القناة والأذونات بأسلوب Claude عبر جسر MCP الحقيقي المستند إلى stdio

هذه أسرع طريقة لإثبات أن الجسر يعمل من دون ربط حساب Telegram أو Discord أو iMessage حقيقي بتشغيل الاختبار.

لمزيد من سياق الاختبار، راجع [الاختبار](/ar/help/testing).

### استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="No conversations returned">
    يعني عادةً أن جلسة Gateway ليست قابلة للتوجيه مسبقًا. تأكد من أن الجلسة الأساسية لديها بيانات تعريف مسار مخزّنة للقناة/الموفر، والمستلم، والحساب/الخيط الاختياري.
  </Accordion>
  <Accordion title="events_poll or events_wait misses older messages">
    متوقع. تبدأ قائمة الانتظار المباشرة عندما يتصل الجسر. اقرأ سجل النصوص الأقدم باستخدام `messages_read`.
  </Accordion>
  <Accordion title="Claude notifications do not show up">
    تحقق من كل ما يلي:

    - أبقى العميل جلسة MCP عبر stdio مفتوحة
    - `--claude-channel-mode` هو `on` أو `auto`
    - يفهم العميل فعليًا طرق الإشعار الخاصة بـ Claude
    - حدثت الرسالة الواردة بعد اتصال الجسر

  </Accordion>
  <Accordion title="Approvals are missing">
    يعرض `permissions_list_open` فقط طلبات الموافقة التي تمت ملاحظتها أثناء اتصال الجسر. إنه ليس API دائمًا لسجل الموافقات.
  </Accordion>
</AccordionGroup>

## OpenClaw كسجل عملاء MCP

هذا هو مسار `openclaw mcp list` و`show` و`status` و`doctor` و`probe` و`add` و`set`
و`configure` و`tools` و`login` و`logout` و`reload` و`unset`.

لا تكشف هذه الأوامر OpenClaw عبر MCP. إنها تدير تعريفات خوادم MCP التي يديرها OpenClaw ضمن `mcp.servers` في إعدادات OpenClaw. وهي لا تقرأ خوادم mcporter من `config/mcporter.json`.

هذه التعريفات المحفوظة مخصصة لبيئات التشغيل التي يشغّلها OpenClaw أو يهيئها لاحقًا، مثل OpenClaw المضمّن ومحوّلات بيئات التشغيل الأخرى. يخزن OpenClaw التعريفات مركزيًا حتى لا تحتاج تلك البيئات إلى الاحتفاظ بقوائم خوادم MCP مكررة خاصة بها.

<AccordionGroup>
  <Accordion title="Important behavior">
    - هذه الأوامر تقرأ إعدادات OpenClaw أو تكتبها فقط
    - `status` و`list` و`show` و`doctor` من دون `--probe` و`set` و`configure` و`tools` و`logout` و`reload` و`unset` لا تتصل بخادم MCP الهدف
    - ينفذ `login` تدفق شبكة OAuth الخاص بـ MCP للخادم HTTP المهيأ ويحفظ بيانات الاعتماد المحلية الناتجة
    - يطبع `status --verbose` تلميحات النقل، والمصادقة، والمهلة، والفلتر، واستدعاء الأدوات المتوازي بعد حلها من دون اتصال
    - يتحقق `doctor` من التعريفات المحفوظة بحثًا عن مشكلات إعداد محلية مثل أوامر stdio المفقودة، وأدلة العمل غير الصالحة، وملفات TLS المفقودة، والخوادم المعطلة، وقيم الرأس/البيئة الحساسة الحرفية، وتفويض OAuth غير المكتمل
    - يضيف `doctor --probe` إثبات الاتصال المباشر نفسه مثل `probe` بعد نجاح الفحوصات الثابتة
    - يتصل `probe` بالخادم المحدد أو بكل الخوادم المهيأة، ويسرد الأدوات، ويبلغ عن القدرات/التشخيصات
    - يبني `add` تعريفًا من العلامات ويفحصه قبل الحفظ إلا إذا تم تعيين `--no-probe` أو كانت مصادقة OAuth مطلوبة أولًا
    - تقرر محوّلات بيئة التشغيل أشكال النقل التي تدعمها فعليًا وقت التنفيذ
    - يبقي `enabled: false` الخادم محفوظًا لكنه يستثنيه من اكتشاف بيئة التشغيل المضمّنة
    - يعيّن `timeout` و`connectTimeout` مهل الطلب والاتصال لكل خادم بالثواني
    - يعلّم `supportsParallelToolCalls: true` الخوادم التي تستطيع المحوّلات استدعاءها بالتوازي
    - يمكن لخوادم HTTP استخدام رؤوس ثابتة، وتسجيل دخول OAuth، والتحكم في تحقق TLS، ومسارات شهادة/مفتاح mTLS
    - يكشف OpenClaw المضمّن أدوات MCP المهيأة في ملفات تعريف الأدوات العادية `coding` و`messaging`؛ لا يزال `minimal` يخفيها، ويعطلها `tools.deny: ["bundle-mcp"]` صراحة
    - يرشح `toolFilter.include` و`toolFilter.exclude` لكل خادم أدوات MCP المكتشفة قبل أن تصبح أدوات OpenClaw
    - الخوادم التي تعلن موارد أو مطالبات تكشف أيضًا أدوات مساعدة لسرد/قراءة الموارد وسرد/جلب المطالبات؛ تستخدم أسماء الأدوات المساعدة المولّدة (`resources_list` و`resources_read` و`prompts_list` و`prompts_get`) فلتر التضمين/الاستبعاد نفسه
    - تغييرات قائمة أدوات MCP الديناميكية تبطل الكتالوج المخزّن مؤقتًا لتلك الجلسة؛ يحدّث الاكتشاف/الاستخدام التالي من الخادم
    - تؤدي إخفاقات طلب/بروتوكول أدوات MCP المتكررة إلى إيقاف ذلك الخادم مؤقتًا لفترة وجيزة حتى لا يستهلك خادم معطّل واحد كامل الدور
    - تُجمع بيئات تشغيل MCP المجمعة ذات نطاق الجلسة بعد `mcp.sessionIdleTtlMs` مللي ثانية من الخمول (الافتراضي 10 دقائق؛ عيّن `0` للتعطيل)، وتنظفها التشغيلات المضمّنة أحادية الاستخدام عند نهاية التشغيل

  </Accordion>
</AccordionGroup>

قد تطبع محوّلات بيئة التشغيل هذا السجل المشترك بالشكل الذي يتوقعه العميل التابع لها. على سبيل المثال، يستهلك OpenClaw المضمّن قيم `transport` في OpenClaw مباشرة، بينما يتلقى Claude Code وGemini قيم `type` الأصلية في CLI مثل `http` أو `sse` أو `stdio`.

يحترم خادم تطبيق Codex أيضًا كتلة `codex` اختيارية على كل خادم. هذه
بيانات تعريف إسقاط من OpenClaw لخيوط خادم تطبيق Codex فقط؛ ولا تغيّر
جلسات ACP، أو إعدادات حاضنة Codex العامة، أو محوّلات بيئات التشغيل الأخرى.
استخدم `codex.agents` غير الفارغة لإسقاط خادم فقط إلى معرّفات وكلاء OpenClaw
المحددة. تُرفض قوائم الوكلاء الفارغة أو البيضاء أو غير الصالحة بواسطة تحقق
الإعدادات، ويحذفها مسار إسقاط بيئة التشغيل بدل أن تصبح
عامة. استخدم `codex.defaultToolsApprovalMode` (`auto` أو `prompt` أو `approve`)
لإصدار `default_tools_approval_mode` الأصلي في Codex لخادم موثوق.
يزيل OpenClaw بيانات تعريف `codex` قبل تمرير إعدادات `mcp_servers`
الأصلية إلى Codex.

### تعريفات خوادم MCP المحفوظة

يخزّن OpenClaw أيضًا سجل خوادم MCP خفيفًا في الإعدادات للأسطح التي تريد تعريفات MCP يديرها OpenClaw.

الأوامر:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp status [--verbose]`
- `openclaw mcp doctor [name] [--probe]`
- `openclaw mcp probe [name]`
- `openclaw mcp add <name> [flags]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp configure <name> [flags]`
- `openclaw mcp tools <name> [--include csv] [--exclude csv] [--clear]`
- `openclaw mcp login <name> [--code code]`
- `openclaw mcp logout <name>`
- `openclaw mcp reload`
- `openclaw mcp unset <name>`

ملاحظات:

- يفرز `list` أسماء الخوادم.
- يطبع `show` من دون اسم كائن خادم MCP المهيأ كاملًا.
- يصنف `status` وسائل النقل المهيأة من دون اتصال. يتضمن `--verbose` تفاصيل التشغيل، والمهلة، وOAuth، والفلتر، والاستدعاءات المتوازية بعد حلها.
- ينفذ `doctor` فحوصات ثابتة من دون اتصال. أضف `--probe` عندما يجب أن يتحقق الأمر أيضًا من اتصال الخوادم المفعلة.
- يتصل `probe` ويبلغ عن أعداد الأدوات، ودعم الموارد/المطالبات، ودعم تغيير القائمة، والتشخيصات.
- يقبل `add` علامات stdio مثل `--command` و`--arg` و`--env` و`--cwd`، أو علامات HTTP مثل `--url` و`--transport` و`--header` و`--auth oauth` وTLS والمهلة وعلامات اختيار الأدوات.
- يتوقع `set` قيمة كائن JSON واحدة في سطر الأوامر.
- يحدّث `configure` التفعيل، وفلاتر الأدوات، والمهل، وOAuth، وTLS، وتلميحات استدعاء الأدوات المتوازي من دون استبدال تعريف الخادم كاملًا.
- يحدّث `tools` فلاتر الأدوات لكل خادم. إدخالات التضمين/الاستبعاد هي أسماء أدوات MCP وأنماط `*` بسيطة.
- يشغّل `login` تدفق OAuth لخوادم HTTP المهيأة بـ `auth: "oauth"`. يطبع التشغيل الأول عنوان URL للتفويض؛ أعد التشغيل باستخدام `--code` بعد الموافقة.
- يمسح `logout` بيانات اعتماد OAuth المخزنة للخادم المسمى من دون إزالة تعريف الخادم المحفوظ.
- يتخلص `reload` من بيئات تشغيل MCP المخزنة مؤقتًا داخل العملية. لا تزال عمليات Gateway أو الوكلاء في عملية أخرى تحتاج إلى مسار إعادة تحميل أو إعادة تشغيل خاص بها.
- استخدم `transport: "streamable-http"` لخوادم MCP من نوع Streamable HTTP. يطبّع `openclaw mcp set` أيضًا `type: "http"` الأصلي في CLI إلى شكل الإعدادات القانوني نفسه للتوافق.
- يفشل `unset` إذا لم يكن الخادم المسمى موجودًا.

أمثلة:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp status --verbose
openclaw mcp doctor --probe
openclaw mcp probe context7 --json
openclaw mcp add memory --command npx --arg -y --arg @modelcontextprotocol/server-memory
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp tools context7 --include 'resolve-library-id,get-library-docs'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp configure docs --timeout 20 --connect-timeout 5 --include 'search,read_*'
openclaw mcp configure docs --auth oauth --oauth-scope 'docs.read'
openclaw mcp login docs
openclaw mcp logout docs
openclaw mcp unset context7
```

### وصفات الخوادم الشائعة

تحفظ هذه الأمثلة تعريفات الخوادم فقط. شغّل `openclaw mcp doctor --probe` بعد ذلك لإثبات أن الخادم يبدأ ويكشف الأدوات.

<Tabs>
  <Tab title="Filesystem">
    ```bash
    openclaw mcp add files \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-filesystem \
      --arg "$HOME/Documents" \
      --include 'read_file,list_directory,search_files'
    openclaw mcp doctor files --probe
    ```

    قصر نطاق خوادم نظام الملفات على أصغر شجرة أدلة يجب أن يقرأها الوكيل أو يحررها.

  </Tab>
  <Tab title="Memory">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    استخدم فلتر أدوات إذا كان الخادم يكشف أدوات كتابة لا ينبغي إتاحتها للوكلاء العاديين.

  </Tab>
  <Tab title="Local script">
    ```bash
    openclaw mcp add local-tools \
      --command node \
      --arg ./dist/mcp-server.js \
      --cwd /srv/openclaw-tools \
      --env API_BASE=https://internal.example
    openclaw mcp status --verbose
    ```

    يتحقق `doctor` من أن `cwd` موجود وأن الأمر يُحل من البيئة المهيأة.

  </Tab>
  <Tab title="HTTP بعيد">
    ```bash
    openclaw mcp add docs \
      --url https://mcp.example.com/mcp \
      --transport streamable-http \
      --auth oauth \
      --oauth-scope docs.read \
      --timeout 20 \
      --connect-timeout 5 \
      --include 'search,read_*'
    openclaw mcp doctor docs --probe
    ```

    استخدم OAuth عندما يدعمه الخادم البعيد. إذا كان الخادم يتطلب ترويسات ثابتة، فتجنب تثبيت رموز الحامل الحرفية في المستودع.

  </Tab>
  <Tab title="سطح المكتب/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    ترث خوادم التحكم المباشر بسطح المكتب أذونات العملية التي تشغلها. استخدم مرشحات أدوات ضيقة ومطالبات الأذونات على مستوى نظام التشغيل.

  </Tab>
</Tabs>

### أشكال مخرجات JSON

استخدم `--json` للسكربتات ولوحات المعلومات. يمكن أن تنمو مجموعات الحقول بمرور الوقت، لذلك ينبغي للمستهلكين تجاهل المفاتيح غير المعروفة.

<AccordionGroup>
  <Accordion title="status --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "configured": true,
          "enabled": true,
          "ok": true,
          "transport": "streamable-http",
          "launch": "streamable-http https://mcp.example.com/mcp",
          "auth": "oauth",
          "authStatus": {
            "hasTokens": true,
            "hasClientInformation": true,
            "hasCodeVerifier": false,
            "hasDiscoveryState": true,
            "hasLastAuthorizationUrl": false
          },
          "requestTimeoutMs": 20000,
          "connectionTimeoutMs": 5000,
          "toolFilter": {
            "include": ["search", "read_*"],
            "exclude": []
          },
          "supportsParallelToolCalls": true
        }
      ]
    }
    ```
  </Accordion>
  <Accordion title="doctor --json">
    ```json
    {
      "ok": false,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": false,
          "issues": [
            {
              "level": "error",
              "message": "OAuth credentials are not authorized; run openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    يخرج `doctor --json` بقيمة غير صفرية عندما يحتوي أي خادم ممكّن تم فحصه على خطأ. تُبلّغ التحذيرات لكنها لا تجعل الأمر يفشل وحدها.

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
          "prompts": false,
          "listChanged": {
            "tools": true,
            "resources": false,
            "prompts": false
          }
        }
      },
      "tools": ["docs__read_page", "docs__search"],
      "diagnostics": []
    }
    ```

    يفتح `probe` جلسة عميل MCP مباشرة. استخدمه لإثبات قابلية الوصول والقدرات، لا لتدقيقات الإعدادات الثابتة.

  </Accordion>
</AccordionGroup>

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
        "transport": "streamable-http",
        "timeout": 20,
        "connectTimeout": 5,
        "supportsParallelToolCalls": true,
        "auth": "oauth",
        "oauth": {
          "scope": "docs.read"
        },
        "sslVerify": true,
        "clientCert": "/path/to/client.crt",
        "clientKey": "/path/to/client.key",
        "toolFilter": {
          "include": ["search_*"],
          "exclude": ["admin_*"]
        }
      }
    }
  }
}
```

### نقل Stdio

يشغّل عملية فرعية محلية ويتواصل عبر stdin/stdout.

| الحقل                      | الوصف                       |
| -------------------------- | --------------------------------- |
| `command`                  | الملف التنفيذي المراد تشغيله (مطلوب)    |
| `args`                     | مصفوفة وسائط سطر الأوامر   |
| `env`                      | متغيرات بيئة إضافية       |
| `cwd` / `workingDirectory` | دليل العمل للعملية |

<Warning>
**مرشح أمان بيئة Stdio**

يرفض OpenClaw مفاتيح بيئة بدء تشغيل المفسّر التي يمكنها تغيير طريقة بدء خادم MCP عبر stdio قبل أول RPC، حتى إذا ظهرت في كتلة `env` الخاصة بالخادم. تشمل المفاتيح المحظورة `BASHOPTS` و`FPATH` و`KSH_ENV` و`NODE_OPTIONS` و`NODE_REDIRECT_WARNINGS` و`NODE_REPL_EXTERNAL_MODULE` و`NODE_REPL_HISTORY` و`NODE_V8_COVERAGE` و`PYTHONSTARTUP` و`PYTHONPATH` و`PERL5OPT` و`RUBYOPT` و`SHELLOPTS` و`PS4` و`TCLLIBPATH` ومتغيرات التحكم في وقت التشغيل المشابهة. يرفض بدء التشغيل هذه المفاتيح بخطأ إعدادات حتى لا تتمكن من حقن تمهيد ضمني، أو استبدال المفسّر، أو تمكين مصحح أخطاء، أو إعادة توجيه مخرجات وقت التشغيل ضد عملية stdio. لا تتأثر متغيرات البيئة العادية الخاصة ببيانات الاعتماد والوكيل والخادم (`GITHUB_TOKEN` و`HTTP_PROXY` و`*_API_KEY` المخصصة، إلخ).

إذا كان خادم MCP لديك يحتاج حقًا إلى أحد المتغيرات المحظورة، فعيّنه على عملية مضيف Gateway بدلًا من وضعه تحت `env` الخاص بخادم stdio.
</Warning>

### نقل SSE / HTTP

يتصل بخادم MCP بعيد عبر HTTP Server-Sent Events.

| الحقل                          | الوصف                                                      |
| ------------------------------ | ---------------------------------------------------------------- |
| `url`                          | عنوان URL لخادم بعيد عبر HTTP أو HTTPS (مطلوب)                |
| `headers`                      | خريطة اختيارية من مفتاح إلى قيمة لترويسات HTTP (مثل رموز المصادقة) |
| `connectionTimeoutMs`          | مهلة الاتصال لكل خادم بالمللي ثانية (اختياري)                   |
| `connectTimeout`               | مهلة الاتصال لكل خادم بالثواني (اختياري)              |
| `timeout` / `requestTimeoutMs` | مهلة طلب MCP لكل خادم بالثواني أو المللي ثانية                  |
| `auth: "oauth"`                | استخدم تخزين رموز OAuth الخاص بـ MCP و`openclaw mcp login`             |
| `sslVerify`                    | عيّنها إلى false فقط لنقاط نهاية HTTPS خاصة موثوقة صراحة    |
| `clientCert` / `clientKey`     | مسارات شهادة ومفتاح عميل mTLS                            |
| `supportsParallelToolCalls`    | تلميح إلى أن الاستدعاءات المتزامنة آمنة لهذا الخادم              |

مثال:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "auth": "oauth",
        "timeout": 20,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

تُنقّح القيم الحساسة في `url` (معلومات المستخدم) و`headers` في السجلات ومخرجات الحالة. يحذر `openclaw mcp doctor` عندما تحتوي إدخالات `headers` أو `env` التي تبدو حساسة على قيم حرفية، حتى يتمكن المشغلون من نقل تلك القيم خارج الإعدادات المثبتة في المستودع.

### سير عمل OAuth

OAuth مخصص لخوادم MCP عبر HTTP التي تعلن عن تدفق OAuth الخاص بـ MCP. تُتجاهل ترويسات `Authorization` الثابتة للخادم أثناء تمكين `auth: "oauth"`.

<Steps>
  <Step title="حفظ الخادم">
    أضف الخادم أو حدّثه باستخدام `auth: "oauth"` وأي بيانات وصفية اختيارية لـ OAuth.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

  </Step>
  <Step title="بدء تسجيل الدخول">
    شغّل تسجيل الدخول لإنشاء طلب التفويض.

    ```bash
    openclaw mcp login docs
    ```

    يطبع OpenClaw عنوان URL للتفويض ويخزن حالة متحقق OAuth المؤقتة ضمن دليل حالة OpenClaw.

  </Step>
  <Step title="الإكمال باستخدام الرمز">
    بعد الموافقة في المتصفح، مرر الرمز المُعاد إلى OpenClaw.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="التحقق من التفويض">
    استخدم الحالة أو doctor لتأكيد وجود الرموز.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="مسح بيانات الاعتماد">
    يزيل تسجيل الخروج بيانات اعتماد OAuth المخزنة لكنه يبقي تعريف الخادم المحفوظ.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

إذا قام الموفر بتدوير الرموز أو علقت حالة التفويض، فشغّل `openclaw mcp logout <name>`، ثم كرر `login`. يمكن لـ`logout` مسح بيانات الاعتماد لخادم HTTP محفوظ حتى بعد إزالة `auth: "oauth"` من الإعدادات، طالما لا يزال اسم الخادم وعنوان URL يحددان إدخال مخزن بيانات الاعتماد.

### نقل HTTP قابل للتدفق

`streamable-http` خيار نقل إضافي إلى جانب `sse` و`stdio`. يستخدم تدفق HTTP للاتصال ثنائي الاتجاه مع خوادم MCP البعيدة.

| الحقل                          | الوصف                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `url`                          | عنوان URL لخادم بعيد عبر HTTP أو HTTPS (مطلوب)                                      |
| `transport`                    | عيّنه إلى `"streamable-http"` لاختيار هذا النقل؛ عند حذفه، يستخدم OpenClaw `sse` |
| `headers`                      | خريطة اختيارية من مفتاح إلى قيمة لترويسات HTTP (مثل رموز المصادقة)                       |
| `connectionTimeoutMs`          | مهلة الاتصال لكل خادم بالمللي ثانية (اختياري)                                         |
| `connectTimeout`               | مهلة الاتصال لكل خادم بالثواني (اختياري)                                    |
| `timeout` / `requestTimeoutMs` | مهلة طلب MCP لكل خادم بالثواني أو المللي ثانية                                        |
| `auth: "oauth"`                | استخدم تخزين رموز OAuth الخاص بـ MCP و`openclaw mcp login`                                   |
| `sslVerify`                    | عيّنها إلى false فقط لنقاط نهاية HTTPS خاصة موثوقة صراحة                          |
| `clientCert` / `clientKey`     | مسارات شهادة ومفتاح عميل mTLS                                                  |
| `supportsParallelToolCalls`    | تلميح إلى أن الاستدعاءات المتزامنة آمنة لهذا الخادم                                    |

تستخدم إعدادات OpenClaw الصياغة `transport: "streamable-http"` باعتبارها الصياغة المعتمدة. تُقبل قيم MCP الأصلية في CLI من نوع `type: "http"` عند حفظها عبر `openclaw mcp set` وتُصلح بواسطة `openclaw doctor --fix` في الإعدادات الحالية، لكن `transport` هو ما يستهلكه OpenClaw المضمّن مباشرة.

مثال:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectTimeout": 10,
        "timeout": 30,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
لا تبدأ أوامر السجل جسر القناة. فقط `probe` و`doctor --probe` يفتحان جلسة عميل MCP مباشرة لإثبات أن الخادم الهدف قابل للوصول.
</Note>

## واجهة التحكم

تتضمن واجهة التحكم في المتصفح صفحة إعدادات MCP مخصصة على `/mcp`. تعرض عدد الخوادم المهيأة، وملخصات التمكين/OAuth/المرشحات، وصفوف النقل لكل خادم، وعناصر التحكم في التمكين/التعطيل، وأوامر CLI الشائعة، ومحررًا محدود النطاق لقسم إعدادات `mcp`.

استخدم الصفحة لتعديلات المشغل والجرد السريع. استخدم `openclaw mcp doctor --probe` أو `openclaw mcp probe` عندما تحتاج إلى إثبات مباشر للخادم.

سير عمل المشغل:

1. افتح واجهة التحكم واختر **MCP**.
2. راجع بطاقات الملخص لإجمالي الخوادم، والممكّنة منها، وخوادم OAuth، والخوادم المصفّاة.
3. استخدم كل صف خادم لعرض تلميحات النقل، والمصادقة، والتصفية، والمهلة، والأوامر.
4. بدّل التمكين عندما تريد الاحتفاظ بتعريف مع استبعاده من اكتشاف وقت التشغيل.
5. عدّل قسم إعدادات `mcp` محدود النطاق للتغييرات البنيوية مثل الخوادم الجديدة، أو الرؤوس، أو TLS، أو بيانات OAuth الوصفية، أو مرشحات الأدوات.
6. اختر **حفظ** للاحتفاظ بالإعدادات فقط، أو **حفظ ونشر** لتطبيقها عبر مسار إعدادات Gateway.
7. شغّل `openclaw mcp doctor --probe` عندما تحتاج إلى إثبات مباشر بأن الخادم المعدّل يبدأ ويسرد الأدوات.

ملاحظات:

- تقتبس مقتطفات الأوامر أسماء الخوادم كي تظل الأسماء غير المعتادة قابلة للنسخ في الصدفة
- تُحجب القيم المعروضة الشبيهة بعناوين URL قبل عرضها عندما تحتوي على بيانات اعتماد مضمّنة
- لا تبدأ الصفحة عمليات نقل MCP بنفسها
- قد تحتاج أوقات التشغيل النشطة إلى `openclaw mcp reload`، أو نشر إعدادات Gateway، أو إعادة تشغيل العملية، حسب العملية التي تملك عملاء MCP

## الحدود الحالية

توثّق هذه الصفحة الجسر كما هو مشحون اليوم.

الحدود الحالية:

- يعتمد اكتشاف المحادثات على بيانات وصفية حالية لمسار جلسة Gateway
- لا يوجد بروتوكول دفع عام خارج المحوّل الخاص بـ Claude
- لا توجد أدوات لتعديل الرسائل أو التفاعل معها بعد
- يتصل نقل HTTP/SSE/streamable-http بخادم بعيد واحد؛ ولا يوجد تعدد إرسال للمنبع بعد
- لا يتضمن `permissions_list_open` إلا الموافقات التي تمت ملاحظتها أثناء اتصال الجسر

## ذات صلة

- [مرجع CLI](/ar/cli)
- [Plugins](/ar/cli/plugins)

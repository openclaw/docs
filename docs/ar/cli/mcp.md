---
read_when:
    - ربط Codex أو Claude Code أو عميل MCP آخر بالقنوات المدعومة من OpenClaw
    - تشغيل `openclaw mcp serve`
    - إدارة تعريفات خوادم MCP المحفوظة في OpenClaw
sidebarTitle: MCP
summary: اعرض محادثات قنوات OpenClaw عبر MCP وأدر تعريفات خوادم MCP المحفوظة
title: MCP
x-i18n:
    generated_at: "2026-06-30T22:18:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e979654cb17f5cb25b936039f9e4690ecfda41bc58ae073426a9e42978fa85dc
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` لديه مهمتان:

- تشغيل OpenClaw كخادم MCP باستخدام `openclaw mcp serve`
- إدارة تعريفات خوادم MCP الصادرة المُدارة من OpenClaw باستخدام `list` و`show` و`status` و`doctor` و`probe` و`add` و`set` و`configure` و`tools` و`login` و`logout` و`reload` و`unset`

بعبارة أخرى:

- `serve` يعني أن OpenClaw يعمل كخادم MCP
- الأوامر الفرعية الأخرى تعني أن OpenClaw يعمل كسجل من جهة عميل MCP لخوادم MCP التي قد تستهلكها بيئات تشغيله لاحقًا

<Note>
  يقرأ `list` و`show` و`set` و`unset` ويكتبون فقط إدخالات `mcp.servers` المُدارة من OpenClaw في إعدادات OpenClaw. وهي لا تتضمن خوادم mcporter من `config/mcporter.json`؛ استخدم `mcporter list` لذلك السجل.
</Note>

استخدم [`openclaw acp`](/ar/cli/acp) عندما ينبغي أن يستضيف OpenClaw جلسة حاضنة برمجة بنفسه ويوجه بيئة التشغيل تلك عبر ACP.

## اختر مسار MCP المناسب

لدى OpenClaw عدة أسطح MCP. اختر السطح الذي يطابق من يملك بيئة تشغيل الوكيل ومن يملك الأدوات.

| الهدف                                                                | الاستخدام                                                                  | السبب                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| السماح لعميل MCP خارجي بقراءة/إرسال محادثات قنوات OpenClaw | `openclaw mcp serve`                                                 | OpenClaw هو خادم MCP ويعرض محادثات مدعومة من Gateway عبر stdio.                                 |
| حفظ خوادم MCP من أطراف ثالثة لتشغيلات وكلاء مُدارة من OpenClaw        | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw هو سجل جهة عميل MCP ويعرض تلك الخوادم لاحقًا على بيئات التشغيل المؤهلة.               |
| فحص خادم محفوظ دون تشغيل دورة وكيل                  | `openclaw mcp status`, `doctor`, `probe`                             | يفحص `status` و`doctor` الإعدادات؛ ويفتح `probe` اتصال MCP حيًا ويسرد القدرات.               |
| تعديل إعدادات MCP من متصفح                                      | Control UI `/mcp`                                                    | تعرض الصفحة المخزون، والتمكين، وملخصات OAuth/المرشحات، وتلميحات الأوامر، ومحرر `mcp` محدود النطاق.         |
| منح خادم تطبيق Codex خادم MCP أصليًا محدود النطاق                    | `mcp.servers.<name>.codex`                                           | تؤثر كتلة `codex` فقط في عرض خيوط خادم تطبيق Codex وتُزال قبل تسليم الإعدادات الأصلية. |
| تشغيل جلسات حاضنة مستضافة عبر ACP                                     | [`openclaw acp`](/ar/cli/acp) و[وكلاء ACP](/ar/tools/acp-agents-setup) | لا يقبل وضع جسر ACP حقن خادم MCP لكل جلسة؛ اضبط جسور Gateway/Plugin بدلًا من ذلك.     |

<Tip>
إذا لم تكن متأكدًا من المسار الذي تحتاجه، فابدأ بـ `openclaw mcp status --verbose`. يعرض ما حفظه OpenClaw دون بدء أي خوادم MCP.
</Tip>

## OpenClaw كخادم MCP

هذا هو مسار `openclaw mcp serve`.

### متى تستخدم `serve`

استخدم `openclaw mcp serve` عندما:

- ينبغي أن يتحدث Codex أو Claude Code أو عميل MCP آخر مباشرةً إلى محادثات القنوات المدعومة من OpenClaw
- لديك بالفعل Gateway محلي أو بعيد لـ OpenClaw مع جلسات موجهة
- تريد خادم MCP واحدًا يعمل عبر خلفيات قنوات OpenClaw بدلًا من تشغيل جسور منفصلة لكل قناة

استخدم [`openclaw acp`](/ar/cli/acp) بدلًا من ذلك عندما ينبغي أن يستضيف OpenClaw بيئة تشغيل البرمجة بنفسه وأن يبقي جلسة الوكيل داخل OpenClaw.

### كيف يعمل

يبدأ `openclaw mcp serve` خادم MCP عبر stdio. يملك عميل MCP تلك العملية. بينما يُبقي العميل جلسة stdio مفتوحة، يتصل الجسر بـ Gateway محلي أو بعيد لـ OpenClaw عبر WebSocket ويعرض محادثات القنوات الموجهة عبر MCP.

<Steps>
  <Step title="ينشئ العميل الجسر">
    ينشئ عميل MCP العملية `openclaw mcp serve`.
  </Step>
  <Step title="يتصل الجسر بـ Gateway">
    يتصل الجسر بـ OpenClaw Gateway عبر WebSocket.
  </Step>
  <Step title="تصبح الجلسات محادثات MCP">
    تصبح الجلسات الموجهة محادثات MCP وأدوات النصوص/السجل.
  </Step>
  <Step title="طابور الأحداث الحية">
    تُوضع الأحداث الحية في الذاكرة بينما يكون الجسر متصلًا.
  </Step>
  <Step title="دفع Claude اختياري">
    إذا كان وضع قناة Claude مُمكّنًا، فيمكن للجلسة نفسها أيضًا تلقي إشعارات دفع خاصة بـ Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="سلوك مهم">
    - تبدأ حالة الطابور الحي عندما يتصل الجسر
    - يُقرأ سجل النصوص الأقدم باستخدام `messages_read`
    - توجد إشعارات دفع Claude فقط أثناء بقاء جلسة MCP حية
    - عندما ينقطع اتصال العميل، يخرج الجسر ويزول الطابور الحي
    - تُنهي نقاط دخول الوكيل أحادية التنفيذ مثل `openclaw agent` و`openclaw infer model run` أي بيئات تشغيل MCP مضمّنة تفتحها عند اكتمال الرد، لذلك لا تؤدي التشغيلات النصية المتكررة إلى تراكم عمليات stdio MCP الفرعية
    - تُفكك خوادم stdio MCP التي يشغّلها OpenClaw (المضمّنة أو المضبوطة من المستخدم) كشجرة عمليات عند الإيقاف، لذلك لا تبقى العمليات الفرعية التي يبدأها الخادم بعد خروج عميل stdio الأصل
    - يؤدي حذف جلسة أو إعادة تعيينها إلى التخلص من عملاء MCP لتلك الجلسة عبر مسار تنظيف بيئة التشغيل المشترك، لذلك لا تبقى اتصالات stdio عالقة مرتبطة بجلسة مُزالة

  </Accordion>
</AccordionGroup>

### اختر وضع عميل

استخدم الجسر نفسه بطريقتين مختلفتين:

<Tabs>
  <Tab title="عملاء MCP عامون">
    أدوات MCP القياسية فقط. استخدم `conversations_list` و`messages_read` و`events_poll` و`events_wait` و`messages_send` وأدوات الموافقة.
  </Tab>
  <Tab title="Claude Code">
    أدوات MCP القياسية بالإضافة إلى محول القناة الخاص بـ Claude. فعّل `--claude-channel-mode on` أو اترك القيمة الافتراضية `auto`.
  </Tab>
</Tabs>

<Note>
اليوم، يتصرف `auto` بالطريقة نفسها مثل `on`. لا يوجد اكتشاف لقدرات العميل بعد.
</Note>

### ما الذي يعرضه `serve`

يستخدم الجسر بيانات تعريف مسار جلسة Gateway الحالية لعرض المحادثات المدعومة بالقنوات. تظهر المحادثة عندما تكون لدى OpenClaw بالفعل حالة جلسة ذات مسار معروف مثل:

- `channel`
- بيانات تعريف المستلم أو الوجهة
- `accountId` اختياري
- `threadId` اختياري

يمنح هذا عملاء MCP مكانًا واحدًا من أجل:

- سرد المحادثات الموجهة الأخيرة
- قراءة سجل النصوص الأخير
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

يعرض الجسر الحالي أدوات MCP التالية:

<AccordionGroup>
  <Accordion title="conversations_list">
    يسرد المحادثات الأخيرة المدعومة بالجلسات التي لديها بالفعل بيانات تعريف المسار في حالة جلسة Gateway.

    مرشحات مفيدة:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    يعيد محادثة واحدة حسب `session_key` باستخدام بحث مباشر عن جلسة Gateway.
  </Accordion>
  <Accordion title="messages_read">
    يقرأ رسائل النصوص الأخيرة لمحادثة واحدة مدعومة بالجلسة.
  </Accordion>
  <Accordion title="attachments_fetch">
    يستخرج كتل محتوى الرسائل غير النصية من رسالة نصية واحدة. هذا عرض بيانات تعريف فوق محتوى النصوص، وليس مخزن كتل مرفقات دائمًا مستقلًا.
  </Accordion>
  <Accordion title="events_poll">
    يقرأ الأحداث الحية الموضوعة في الطابور منذ مؤشر رقمي.
  </Accordion>
  <Accordion title="events_wait">
    يجري استطلاعًا طويلًا حتى يصل الحدث التالي المطابق الموضوع في الطابور أو تنتهي المهلة.

    استخدم هذا عندما يحتاج عميل MCP عام إلى تسليم شبه فوري دون بروتوكول دفع خاص بـ Claude.

  </Accordion>
  <Accordion title="messages_send">
    يرسل نصًا عبر المسار نفسه المسجل بالفعل في الجلسة.

    السلوك الحالي:

    - يتطلب مسار محادثة موجودًا
    - يستخدم قناة الجلسة والمستلم ومعرّف الحساب ومعرّف الخيط
    - يرسل نصًا فقط

  </Accordion>
  <Accordion title="permissions_list_open">
    يسرد طلبات الموافقة المعلقة للتنفيذ/Plugin التي لاحظها الجسر منذ اتصاله بـ Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    يحل طلب موافقة تنفيذ/Plugin معلقًا واحدًا باستخدام:

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
- الطابور حي فقط؛ يبدأ عند بدء جسر MCP
- لا يعيد `events_poll` و`events_wait` تشغيل سجل Gateway الأقدم بمفردهما
- يجب قراءة السجل الدائم باستخدام `messages_read`

</Warning>

### إشعارات قناة Claude

يمكن للجسر أيضًا عرض إشعارات قناة خاصة بـ Claude. هذا هو مكافئ OpenClaw لمحول قناة Claude Code: تبقى أدوات MCP القياسية متاحة، لكن الرسائل الواردة الحية يمكن أن تصل أيضًا كإشعارات MCP خاصة بـ Claude.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: أدوات MCP القياسية فقط.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: تفعيل إشعارات قناة Claude.
  </Tab>
  <Tab title="auto (default)">
    `--claude-channel-mode auto`: القيمة الافتراضية الحالية؛ سلوك الجسر نفسه مثل `on`.
  </Tab>
</Tabs>

عند تفعيل وضع قناة Claude، يعلن الخادم قدرات Claude التجريبية ويمكنه إصدار:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

سلوك الجسر الحالي:

- تُمرر رسائل نصوص `user` الواردة كـ `notifications/claude/channel`
- تُتبع طلبات أذونات Claude المستلمة عبر MCP في الذاكرة
- إذا أرسل مالك الأمر في المحادثة المرتبطة لاحقًا `yes abcde` أو `no abcde`، يحوّل الجسر ذلك إلى `notifications/claude/channel/permission`
- هذه الإشعارات خاصة بالجلسة الحية فقط؛ إذا انقطع اتصال عميل MCP، فلا يوجد هدف دفع

هذا مقصود أن يكون خاصًا بالعميل. ينبغي لعملاء MCP العامين الاعتماد على أدوات الاستطلاع القياسية.

### إعدادات عميل MCP

مثال لإعداد عميل stdio:

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

بالنسبة لمعظم عملاء MCP العامين، ابدأ بسطح الأدوات القياسي وتجاهل وضع Claude. فعّل وضع Claude فقط للعملاء الذين يفهمون فعليًا طرق الإشعارات الخاصة بـ Claude.

### الخيارات

يدعم `openclaw mcp serve`:

<ParamField path="--url" type="string">
  عنوان URL لـ WebSocket في Gateway.
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
فضّل `--token-file` أو `--password-file` على الأسرار المضمّنة مباشرةً متى أمكن.
</Tip>

### الأمان وحدود الثقة

لا يخترع الجسر التوجيه. إنه لا يكشف إلا المحادثات التي يعرف Gateway بالفعل كيفية توجيهها.

وهذا يعني:

- تظل قوائم السماح للمرسلين، والاقتران، والثقة على مستوى القناة تابعة لإعدادات قناة OpenClaw الأساسية
- لا يستطيع `messages_send` الرد إلا عبر مسار مخزّن موجود
- حالة الموافقة مباشرة/داخل الذاكرة فقط لجلسة الجسر الحالية
- ينبغي أن تستخدم مصادقة الجسر نفس ضوابط رمز Gateway أو كلمة المرور التي تثق بها لأي عميل Gateway بعيد آخر

إذا كانت محادثة مفقودة من `conversations_list`، فالسبب المعتاد ليس إعداد MCP. بل تكون بيانات تعريف المسار مفقودة أو غير مكتملة في جلسة Gateway الأساسية.

### الاختبار

يوفّر OpenClaw اختبار Docker smoke حتميًا لهذا الجسر:

```bash
pnpm test:docker:mcp-channels
```

يتولى هذا الاختبار:

- تشغيل حاوية Gateway مهيأة ببيانات أولية
- تشغيل حاوية ثانية تستدعي `openclaw mcp serve`
- التحقق من اكتشاف المحادثات، وقراءة النصوص، وقراءة بيانات تعريف المرفقات، وسلوك طابور الأحداث المباشر، وتوجيه الإرسال الصادر
- التحقق من إشعارات القنوات والأذونات بأسلوب Claude عبر جسر stdio MCP الحقيقي

هذه أسرع طريقة لإثبات أن الجسر يعمل دون ربط حساب Telegram أو Discord أو iMessage حقيقي بتشغيل الاختبار.

للمزيد من سياق الاختبار، راجع [الاختبار](/ar/help/testing).

### استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="No conversations returned">
    يعني ذلك عادةً أن جلسة Gateway ليست قابلة للتوجيه مسبقًا. تأكد من أن الجلسة الأساسية تحتوي على بيانات تعريف المسار المخزّنة للقناة/المزوّد، والمستلم، والحساب/السلسلة الاختياريين.
  </Accordion>
  <Accordion title="events_poll or events_wait misses older messages">
    هذا متوقع. يبدأ الطابور المباشر عندما يتصل الجسر. اقرأ سجل النصوص الأقدم باستخدام `messages_read`.
  </Accordion>
  <Accordion title="Claude notifications do not show up">
    تحقق من كل ما يلي:

    - أبقى العميل جلسة stdio MCP مفتوحة
    - `--claude-channel-mode` هو `on` أو `auto`
    - يفهم العميل فعليًا طرق الإشعار الخاصة بـ Claude
    - حدثت الرسالة الواردة بعد اتصال الجسر

  </Accordion>
  <Accordion title="Approvals are missing">
    لا يعرض `permissions_list_open` إلا طلبات الموافقة التي رُصدت أثناء اتصال الجسر. إنه ليس واجهة API دائمة لسجل الموافقات.
  </Accordion>
</AccordionGroup>

## OpenClaw كسجل عملاء MCP

هذا هو مسار `openclaw mcp list` و`show` و`status` و`doctor` و`probe` و`add` و`set`
و`configure` و`tools` و`login` و`logout` و`reload` و`unset`.

لا تكشف هذه الأوامر OpenClaw عبر MCP. إنها تدير تعريفات خوادم MCP المُدارة بواسطة OpenClaw ضمن `mcp.servers` في إعدادات OpenClaw. ولا تقرأ خوادم mcporter من `config/mcporter.json`.

هذه التعريفات المحفوظة مخصصة لبيئات التشغيل التي يشغّلها OpenClaw أو يهيئها لاحقًا، مثل OpenClaw المضمّن ومحوّلات بيئات التشغيل الأخرى. يخزّن OpenClaw التعريفات مركزيًا حتى لا تضطر تلك البيئات إلى الاحتفاظ بقوائم خوادم MCP مكررة خاصة بها.

<AccordionGroup>
  <Accordion title="Important behavior">
    - تقرأ هذه الأوامر إعدادات OpenClaw أو تكتبها فقط
    - لا يتصل `status` و`list` و`show` و`doctor` دون `--probe` و`set` و`configure` و`tools` و`logout` و`reload` و`unset` بخادم MCP المستهدف
    - ينفّذ `login` تدفق شبكة MCP OAuth للخادم HTTP المهيأ ويحفظ بيانات الاعتماد المحلية الناتجة
    - يطبع `status --verbose` تلميحات النقل والمصادقة والمهلة والمرشح واستدعاء الأدوات المتوازي التي تم حلها دون الاتصال
    - يتحقق `doctor` من التعريفات المحفوظة بحثًا عن مشكلات الإعداد المحلي مثل أوامر stdio المفقودة، وأدلة العمل غير الصالحة، وملفات TLS المفقودة، والخوادم المعطلة، وقيم الترويسات/البيئة الحساسة الحرفية، وتفويض OAuth غير المكتمل
    - يضيف `doctor --probe` إثبات الاتصال المباشر نفسه مثل `probe` بعد نجاح الفحوصات الثابتة
    - يتصل `probe` بالخادم المحدد أو بكل الخوادم المهيأة، ويسرد الأدوات، ويبلغ عن القدرات/التشخيصات
    - يبني `add` تعريفًا من الأعلام ويجري الفحص قبل الحفظ ما لم يُعيّن `--no-probe` أو تكن هناك حاجة إلى تفويض OAuth أولًا
    - تقرر محوّلات بيئة التشغيل أشكال النقل التي تدعمها فعليًا وقت التنفيذ
    - يبقي `enabled: false` الخادم محفوظًا لكنه يستبعده من اكتشاف بيئة التشغيل المضمّنة
    - يضبط `timeout` و`connectTimeout` مهل الطلبات والاتصال لكل خادم بالثواني
    - يعلّم `supportsParallelToolCalls: true` الخوادم التي تستطيع المحوّلات استدعاءها بالتوازي
    - يمكن لخوادم HTTP استخدام ترويسات ثابتة، وتسجيل دخول OAuth، والتحكم في التحقق من TLS، ومسارات شهادة/مفتاح mTLS
    - يكشف OpenClaw المضمّن أدوات MCP المهيأة في ملفات تعريف الأدوات العادية `coding` و`messaging`؛ لا يزال `minimal` يخفيها، ويعطلها `tools.deny: ["bundle-mcp"]` صراحةً
    - يرشّح `toolFilter.include` و`toolFilter.exclude` لكل خادم أدوات MCP المكتشفة قبل أن تصبح أدوات OpenClaw
    - الخوادم التي تعلن عن موارد أو مطالبات تكشف أيضًا أدوات مساعدة لسرد/قراءة الموارد وسرد/جلب المطالبات؛ وتستخدم أسماء الأدوات المساعدة المولّدة (`resources_list` و`resources_read` و`prompts_list` و`prompts_get`) مرشح التضمين/الاستبعاد نفسه
    - تؤدي تغييرات قائمة أدوات MCP الديناميكية إلى إبطال الكتالوج المخبأ لتلك الجلسة؛ ويحدّث الاكتشاف/الاستخدام التالي البيانات من الخادم
    - تؤدي إخفاقات طلبات/بروتوكول أدوات MCP المتكررة إلى إيقاف ذلك الخادم مؤقتًا لفترة وجيزة حتى لا يستهلك خادم معطّل واحد الدور كله
    - تُزال بيئات تشغيل MCP المجمعة محددة النطاق للجلسة بعد `mcp.sessionIdleTtlMs` ميلي ثانية من الخمول (الافتراضي 10 دقائق؛ عيّن `0` للتعطيل)، وتنظفها التشغيلات المضمّنة أحادية الاستخدام عند نهاية التشغيل

  </Accordion>
</AccordionGroup>

قد تطبّع محوّلات بيئة التشغيل هذا السجل المشترك إلى الشكل الذي يتوقعه عميلها اللاحق. على سبيل المثال، يستهلك OpenClaw المضمّن قيم `transport` الخاصة بـ OpenClaw مباشرةً، بينما يتلقى Claude Code وGemini قيم `type` أصلية للـ CLI مثل `http` أو `sse` أو `stdio`.

يحترم Codex app-server أيضًا كتلة `codex` اختيارية على كل خادم. هذه بيانات تعريف إسقاط OpenClaw لسلاسل Codex app-server فقط؛ ولا تغيّر جلسات ACP أو إعدادات حزمة Codex العامة أو محوّلات بيئات التشغيل الأخرى.
استخدم `codex.agents` غير الفارغة لإسقاط خادم إلى معرّفات وكلاء OpenClaw محددة فقط. تُرفض قوائم الوكلاء الفارغة أو البيضاء أو غير الصالحة بواسطة تحقق الإعدادات وتُحذف بواسطة مسار إسقاط بيئة التشغيل بدلًا من أن تصبح عامة. استخدم `codex.defaultToolsApprovalMode` (`auto` أو `prompt` أو `approve`) لإصدار `default_tools_approval_mode` الأصلي لـ Codex لخادم موثوق.
يزيل OpenClaw بيانات تعريف `codex` قبل تسليم إعدادات `mcp_servers` الأصلية إلى Codex.

### تعريفات خوادم MCP المحفوظة

يخزّن OpenClaw أيضًا سجل خوادم MCP خفيفًا في الإعدادات للأسطح التي تريد تعريفات MCP مُدارة بواسطة OpenClaw.

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

- يرتّب `list` أسماء الخوادم.
- يطبع `show` دون اسم كائن خادم MCP المهيأ بالكامل.
- يصنّف `status` وسائل النقل المهيأة دون الاتصال. يتضمن `--verbose` تفاصيل التشغيل والمهلة وOAuth والمرشح والاستدعاء المتوازي التي تم حلها.
- ينفّذ `doctor` فحوصات ثابتة دون الاتصال. أضف `--probe` عندما ينبغي للأمر أن يتحقق أيضًا من اتصال الخوادم المفعّلة.
- يتصل `probe` ويبلغ عن أعداد الأدوات، ودعم الموارد/المطالبات، ودعم تغيّر القوائم، والتشخيصات.
- يقبل `add` أعلام stdio مثل `--command` و`--arg` و`--env` و`--cwd`، أو أعلام HTTP مثل `--url` و`--transport` و`--header` و`--auth oauth` وTLS والمهلة وأعلام اختيار الأدوات.
- يتوقع `set` قيمة كائن JSON واحدة على سطر الأوامر.
- يحدّث `configure` التفعيل، ومرشحات الأدوات، والمهل، وOAuth، وTLS، وتلميحات استدعاء الأدوات المتوازي دون استبدال تعريف الخادم كله.
- يحدّث `tools` مرشحات الأدوات لكل خادم. إدخالات التضمين/الاستبعاد هي أسماء أدوات MCP وأنماط `*` بسيطة.
- يشغّل `login` تدفق OAuth لخوادم HTTP المهيأة بـ `auth: "oauth"`. يطبع التشغيل الأول عنوان URL للتفويض؛ أعد التشغيل مع `--code` بعد الموافقة.
- يمحو `logout` بيانات اعتماد OAuth المخزنة للخادم المسمى دون إزالة تعريف الخادم المحفوظ.
- يتخلص `reload` من بيئات تشغيل MCP المخبأة داخل العملية. لا تزال عمليات Gateway أو الوكلاء في عملية أخرى تحتاج إلى مسار إعادة تحميل أو إعادة تشغيل خاص بها.
- استخدم `transport: "streamable-http"` لخوادم Streamable HTTP MCP. يطبّع `openclaw mcp set` أيضًا `type: "http"` الأصلي للـ CLI إلى شكل الإعدادات القانوني نفسه للتوافق.
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

تحفظ هذه الأمثلة تعريفات الخوادم فقط. شغّل `openclaw mcp doctor --probe` بعدها لإثبات أن الخادم يبدأ ويكشف الأدوات.

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

    اجعل نطاق خوادم نظام الملفات محصورًا في أصغر شجرة أدلة ينبغي للوكيل قراءتها أو تعديلها.

  </Tab>
  <Tab title="Memory">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    استخدم مرشح أدوات إذا كان الخادم يكشف أدوات كتابة لا ينبغي أن تكون متاحة للوكلاء العاديين.

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

    يتحقق `doctor` من أن `cwd` موجود وأن الأمر يمكن حله من البيئة المهيأة.

  </Tab>
  <Tab title="Remote HTTP">
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

    استخدم OAuth عندما يدعمه الخادم البعيد. إذا كان الخادم يتطلب ترويسات ثابتة، فتجنب تثبيت رموز الحامل النصية الصريحة.

  </Tab>
  <Tab title="Desktop/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    ترث خوادم التحكم المباشر بسطح المكتب أذونات العملية التي تطلقها. استخدم مرشحات أدوات ضيقة ومطالبات أذونات على مستوى نظام التشغيل.

  </Tab>
</Tabs>

### أشكال إخراج JSON

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

    يخرج `doctor --json` برمز غير صفري عندما يحتوي أي خادم مفعّل خاضع للفحص على خطأ. تُبلّغ التحذيرات، لكنها لا تجعل الأمر يفشل وحدها.

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

    يفتح `probe` جلسة عميل MCP حية. استخدمه لإثبات قابلية الوصول والإمكانات، لا لتدقيق التكوين الثابت.

  </Accordion>
</AccordionGroup>

مثال على شكل التكوين:

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

يطلق عملية فرعية محلية ويتواصل عبر stdin/stdout.

| الحقل                      | الوصف                       |
| -------------------------- | --------------------------------- |
| `command`                  | الملف التنفيذي المراد تشغيله (مطلوب)    |
| `args`                     | مصفوفة وسيطات سطر الأوامر   |
| `env`                      | متغيرات بيئة إضافية       |
| `cwd` / `workingDirectory` | دليل العمل للعملية |

<Warning>
**مرشح أمان بيئة Stdio**

يرفض OpenClaw مفاتيح البيئة الخاصة ببدء تشغيل المفسر التي يمكنها تغيير كيفية بدء خادم MCP عبر stdio قبل أول RPC، حتى إذا ظهرت في كتلة `env` الخاصة بالخادم. تشمل المفاتيح المحظورة `BASHOPTS` و`FPATH` و`KSH_ENV` و`NODE_OPTIONS` و`NODE_REDIRECT_WARNINGS` و`NODE_REPL_EXTERNAL_MODULE` و`NODE_REPL_HISTORY` و`NODE_V8_COVERAGE` و`PYTHONSTARTUP` و`PYTHONPATH` و`PERL5OPT` و`RUBYOPT` و`SHELLOPTS` و`PS4` و`TCLLIBPATH` ومتغيرات التحكم في وقت التشغيل المشابهة. يرفض بدء التشغيل هذه المفاتيح بخطأ تكوين حتى لا تتمكن من حقن تمهيد ضمني، أو تبديل المفسر، أو تمكين مصحح أخطاء، أو إعادة توجيه إخراج وقت التشغيل ضد عملية stdio. لا تتأثر متغيرات البيئة العادية الخاصة ببيانات الاعتماد والوكيل والخادم (`GITHUB_TOKEN` و`HTTP_PROXY` و`*_API_KEY` المخصصة، وما إلى ذلك).

إذا كان خادم MCP لديك يحتاج حقا إلى أحد المتغيرات المحظورة، فاضبطه على عملية مضيف Gateway بدلا من وضعه تحت `env` الخاص بخادم stdio.
</Warning>

### نقل SSE / HTTP

يتصل بخادم MCP بعيد عبر HTTP Server-Sent Events.

| الحقل                          | الوصف                                                      |
| ------------------------------ | ---------------------------------------------------------------- |
| `url`                          | عنوان URL بنمط HTTP أو HTTPS للخادم البعيد (مطلوب)                |
| `headers`                      | خريطة اختيارية من مفاتيح وقيم لترويسات HTTP (مثل رموز المصادقة) |
| `connectionTimeoutMs`          | مهلة الاتصال لكل خادم بالمللي ثانية (اختياري)                   |
| `connectTimeout`               | مهلة الاتصال لكل خادم بالثواني (اختياري)              |
| `timeout` / `requestTimeoutMs` | مهلة طلب MCP لكل خادم بالثواني أو المللي ثانية                  |
| `auth: "oauth"`                | استخدم تخزين رموز MCP OAuth و`openclaw mcp login`             |
| `sslVerify`                    | عيّنها إلى false فقط لنقاط نهاية HTTPS خاصة موثوق بها صراحة    |
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

تُنقّح القيم الحساسة في `url` (userinfo) و`headers` في السجلات وإخراج الحالة. يحذر `openclaw mcp doctor` عندما تحتوي إدخالات `headers` أو `env` التي تبدو حساسة على قيم نصية صريحة، حتى يتمكن المشغلون من نقل تلك القيم خارج التكوين المثبت.

### سير عمل OAuth

OAuth مخصص لخوادم MCP عبر HTTP التي تعلن عن تدفق MCP OAuth. تُتجاهل ترويسات `Authorization` الثابتة لخادم ما أثناء تفعيل `auth: "oauth"`.

<Steps>
  <Step title="Save the server">
    أضف الخادم أو حدّثه باستخدام `auth: "oauth"` وأي بيانات وصفية اختيارية لـ OAuth.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

  </Step>
  <Step title="Start login">
    شغّل تسجيل الدخول لإنشاء طلب التفويض.

    ```bash
    openclaw mcp login docs
    ```

    يطبع OpenClaw عنوان URL للتفويض ويخزن حالة محقق OAuth المؤقتة تحت دليل حالة OpenClaw.

  </Step>
  <Step title="Finish with the code">
    بعد الموافقة في المتصفح، مرر الرمز المُعاد إلى OpenClaw.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Check authorization">
    استخدم الحالة أو doctor لتأكيد وجود الرموز.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Clear credentials">
    يزيل تسجيل الخروج بيانات اعتماد OAuth المخزنة لكنه يبقي تعريف الخادم المحفوظ.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

إذا كان المزود يدوّر الرموز أو علقت حالة التفويض، فشغّل `openclaw mcp logout <name>`، ثم كرر `login`. يستطيع `logout` مسح بيانات الاعتماد لخادم HTTP محفوظ حتى بعد إزالة `auth: "oauth"` من التكوين، ما دام اسم الخادم وعنوان URL لا يزالان يحددان إدخال مخزن بيانات الاعتماد.

### نقل Streamable HTTP

`streamable-http` خيار نقل إضافي إلى جانب `sse` و`stdio`. يستخدم بث HTTP للتواصل ثنائي الاتجاه مع خوادم MCP البعيدة.

| الحقل                          | الوصف                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `url`                          | عنوان URL بنمط HTTP أو HTTPS للخادم البعيد (مطلوب)                                      |
| `transport`                    | اضبطه على `"streamable-http"` لاختيار هذا النقل؛ عند إغفاله، يستخدم OpenClaw `sse` |
| `headers`                      | خريطة اختيارية من مفاتيح وقيم لترويسات HTTP (مثل رموز المصادقة)                       |
| `connectionTimeoutMs`          | مهلة الاتصال لكل خادم بالمللي ثانية (اختياري)                                         |
| `connectTimeout`               | مهلة الاتصال لكل خادم بالثواني (اختياري)                                    |
| `timeout` / `requestTimeoutMs` | مهلة طلب MCP لكل خادم بالثواني أو المللي ثانية                                        |
| `auth: "oauth"`                | استخدم تخزين رموز MCP OAuth و`openclaw mcp login`                                   |
| `sslVerify`                    | عيّنها إلى false فقط لنقاط نهاية HTTPS خاصة موثوق بها صراحة                          |
| `clientCert` / `clientKey`     | مسارات شهادة ومفتاح عميل mTLS                                                  |
| `supportsParallelToolCalls`    | تلميح إلى أن الاستدعاءات المتزامنة آمنة لهذا الخادم                                    |

يستخدم تكوين OpenClaw `transport: "streamable-http"` كتهجئة معيارية. تُقبل قيم MCP الأصلية في CLI من نوع `type: "http"` عند حفظها عبر `openclaw mcp set` ويصلحها `openclaw doctor --fix` في التكوين الموجود، لكن `transport` هو ما يستهلكه OpenClaw المضمّن مباشرة.

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
لا تبدأ أوامر السجل جسر القناة. فقط `probe` و`doctor --probe` يفتحان جلسة عميل MCP حية لإثبات أن الخادم الهدف قابل للوصول.
</Note>

## واجهة التحكم

تتضمن واجهة التحكم في المتصفح صفحة مخصصة لإعدادات MCP على `/mcp`. تعرض الصفحة أعداد الخوادم المكوّنة، وملخصات التفعيل/OAuth/المرشحات، وصفوف النقل لكل خادم، وعناصر تحكم التفعيل/التعطيل، وأوامر CLI الشائعة، ومحررا محدود النطاق لقسم تكوين `mcp`.

استخدم الصفحة لتعديلات المشغل والجرد السريع. استخدم `openclaw mcp doctor --probe` أو `openclaw mcp probe` عندما تحتاج إلى إثبات حي للخادم.

سير عمل المشغل:

1. افتح واجهة التحكم واختر **MCP**.
2. راجع بطاقات الملخص لإجمالي الخوادم والمفعّلة منها وخوادم OAuth والخوادم التي تمت تصفيتها.
3. استخدم كل صف خادم للاطلاع على تلميحات النقل والمصادقة والمرشح والمهلة والأوامر.
4. بدّل التفعيل عندما تريد الاحتفاظ بتعريف مع استبعاده من اكتشاف وقت التشغيل.
5. حرّر قسم تكوين `mcp` محدود النطاق لإجراء تغييرات بنيوية مثل إضافة خوادم أو ترويسات أو TLS أو بيانات OAuth الوصفية أو مرشحات الأدوات.
6. اختر **حفظ** للاحتفاظ بالتكوين فقط، أو **حفظ ونشر** للتطبيق عبر مسار تكوين Gateway.
7. شغّل `openclaw mcp doctor --probe` عندما تحتاج إلى إثبات مباشر بأن الخادم المحرر يبدأ العمل ويعرض الأدوات.

ملاحظات:

- تقتبس مقتطفات الأوامر أسماء الخوادم حتى تظل الأسماء غير المعتادة قابلة للنسخ في الصدفة
- تُحجب القيم التي تبدو كعناوين URL قبل العرض عندما تحتوي على بيانات اعتماد مضمّنة
- لا تبدأ الصفحة عمليات نقل MCP من تلقاء نفسها
- قد تحتاج أوقات التشغيل النشطة إلى `openclaw mcp reload` أو نشر تكوين Gateway أو إعادة تشغيل العملية، بحسب العملية التي تملك عملاء MCP

## الحدود الحالية

توثّق هذه الصفحة الجسر كما هو مشحون اليوم.

الحدود الحالية:

- يعتمد اكتشاف المحادثات على بيانات وصفية موجودة لمسار جلسة Gateway
- لا يوجد بروتوكول دفع عام يتجاوز المحوّل الخاص بـ Claude
- لا توجد أدوات لتعديل الرسائل أو التفاعل معها بعد
- يتصل نقل HTTP/SSE/streamable-http بخادم بعيد واحد؛ ولا يوجد منبع متعدد الإرسال بعد
- لا يتضمن `permissions_list_open` سوى الموافقات التي تمت ملاحظتها أثناء اتصال الجسر

## ذات صلة

- [مرجع CLI](/ar/cli)
- [Plugins](/ar/cli/plugins)

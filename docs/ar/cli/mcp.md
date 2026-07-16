---
read_when:
    - ربط Codex أو Claude Code أو عميل MCP آخر بالقنوات المدعومة من OpenClaw
    - تشغيل `openclaw mcp serve`
    - إدارة تعريفات خوادم MCP المحفوظة في OpenClaw
sidebarTitle: MCP
summary: إتاحة محادثات قنوات OpenClaw عبر MCP وإدارة تعريفات خوادم MCP المحفوظة
title: MCP
x-i18n:
    generated_at: "2026-07-16T14:01:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f62657954709e3f25eb7031dafca9c4050f2420443587f76ce2b2db23f187987
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` له مهمتان:

- تشغيل OpenClaw كخادم MCP باستخدام `openclaw mcp serve`
- إدارة تعريفات خوادم MCP الصادرة التي يديرها OpenClaw باستخدام `list` و`show` و`status` و`doctor` و`probe` و`add` و`set` و`configure` و`tools` و`login` و`logout` و`reload` و`unset`

يمثل `serve` عمل OpenClaw كخادم MCP. أما الأوامر الفرعية الأخرى فتمثل عمل OpenClaw كسجل من جانب عميل MCP للخوادم التي قد تستهلكها بيئات التشغيل الخاصة به لاحقًا.

<Note>
  لا تقرأ `list` و`show` و`set` و`unset` إلا إدخالات `mcp.servers` التي يديرها OpenClaw في إعدادات OpenClaw ولا تكتب إلا إليها. وهي لا تتضمن خوادم mcporter من `config/mcporter.json`؛ استخدم `mcporter list` لذلك السجل.
</Note>

استخدم [`openclaw acp`](/ar/cli/acp) عندما ينبغي أن يستضيف OpenClaw جلسة بيئة برمجة بنفسه ويوجّه بيئة التشغيل تلك عبر ACP.

## اختيار مسار MCP المناسب

| الهدف                                                                | الاستخدام                                                                  | السبب                                                                                                             |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| السماح لعميل MCP خارجي بقراءة محادثات قنوات OpenClaw وإرسال الرسائل فيها | `openclaw mcp serve`                                                 | يكون OpenClaw خادم MCP ويعرض المحادثات المدعومة من Gateway عبر stdio.                                 |
| حفظ خوادم MCP التابعة لجهات خارجية لتشغيلات الوكلاء التي يديرها OpenClaw        | `openclaw mcp add` و`set` و`configure` و`tools` و`login`             | يكون OpenClaw سجلًا من جانب عميل MCP، ثم يُسقط تلك الخوادم لاحقًا في بيئات التشغيل المؤهلة.               |
| التحقق من خادم محفوظ دون تشغيل دورة وكيل                  | `openclaw mcp status` و`doctor` و`probe`                             | يفحص `status` و`doctor` الإعدادات؛ ويفتح `probe` اتصال MCP مباشرًا ويسرد الإمكانات.               |
| تعديل إعدادات MCP من متصفح                                      | واجهة التحكم `/settings/mcp` (الاسم المستعار `/mcp`)                            | تعرض الصفحة المخزون وحالة التمكين وملخصات OAuth/عوامل التصفية وتلميحات الأوامر ومحرر `mcp` محدود النطاق.         |
| منح خادم تطبيق Codex خادم MCP أصليًا محدود النطاق                    | `mcp.servers.<name>.codex`                                           | لا تؤثر كتلة `codex` إلا في إسقاط سلاسل خادم تطبيق Codex، وتُزال قبل تسليم الإعدادات الأصلية. |
| تشغيل جلسات بيئة برمجة مستضافة عبر ACP                                     | [`openclaw acp`](/ar/cli/acp) و[وكلاء ACP](/ar/tools/acp-agents-setup) | لا يقبل وضع جسر ACP حقن خادم MCP لكل جلسة؛ اضبط جسور Gateway/Plugin بدلًا من ذلك.     |

<Tip>
إذا لم تكن متأكدًا من المسار الذي تحتاج إليه، فابدأ بـ `openclaw mcp status --verbose`. فهو يعرض ما حفظه OpenClaw دون تشغيل أي خوادم MCP.
</Tip>

## OpenClaw كخادم MCP

هذا هو مسار `openclaw mcp serve`.

### متى تستخدم serve

استخدم `openclaw mcp serve` عندما:

- ينبغي أن يتواصل Codex أو Claude Code أو عميل MCP آخر مباشرةً مع محادثات القنوات المدعومة من OpenClaw
- لديك بالفعل Gateway محلي أو بعيد لـ OpenClaw مع جلسات موجّهة
- تريد خادم MCP واحدًا يعمل عبر الواجهات الخلفية لقنوات OpenClaw بدلًا من تشغيل جسور منفصلة لكل قناة

استخدم [`openclaw acp`](/ar/cli/acp) بدلًا من ذلك عندما ينبغي أن يستضيف OpenClaw بيئة تشغيل البرمجة بنفسه ويُبقي جلسة الوكيل داخل OpenClaw.

### آلية العمل

يبدأ `openclaw mcp serve` خادم MCP يعمل عبر stdio. يمتلك عميل MCP تلك العملية. وطالما أبقى العميل جلسة stdio مفتوحة، يتصل الجسر بـ Gateway محلي أو بعيد لـ OpenClaw عبر WebSocket ويعرض محادثات القنوات الموجّهة عبر MCP.

<Steps>
  <Step title="العميل يشغّل الجسر">
    يشغّل عميل MCP ‏`openclaw mcp serve`.
  </Step>
  <Step title="الجسر يتصل بـ Gateway">
    يتصل الجسر بـ Gateway الخاص بـ OpenClaw عبر WebSocket.
  </Step>
  <Step title="الجلسات تصبح محادثات MCP">
    تصبح الجلسات الموجّهة محادثات MCP وأدوات للنصوص المنسوخة/السجل.
  </Step>
  <Step title="إدراج الأحداث المباشرة في قائمة انتظار">
    توضع الأحداث المباشرة في قائمة انتظار بالذاكرة أثناء اتصال الجسر.
  </Step>
  <Step title="دفع Claude الاختياري">
    إذا كان وضع قناة Claude مفعّلًا، يمكن للجلسة نفسها أيضًا تلقي إشعارات دفع خاصة بـ Claude.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="سلوك مهم">
    - تبدأ حالة قائمة الانتظار المباشرة عند اتصال الجسر
    - يُقرأ سجل النصوص المنسوخة الأقدم باستخدام `messages_read`
    - لا توجد إشعارات دفع Claude إلا أثناء بقاء جلسة MCP نشطة
    - عندما ينقطع اتصال العميل، ينهي الجسر عمله وتزول قائمة الانتظار المباشرة
    - تنهي نقاط دخول الوكيل أحادية التنفيذ، مثل `openclaw agent` و`openclaw infer model run`، أي بيئات تشغيل MCP مضمّنة تفتحها عند اكتمال الرد، ولذلك لا تتراكم عمليات MCP الفرعية العاملة عبر stdio مع التشغيلات البرمجية المتكررة
    - تُنهى خوادم MCP العاملة عبر stdio التي يشغّلها OpenClaw (سواء كانت مضمّنة أو أعدّها المستخدم) كشجرة عمليات عند إيقاف التشغيل، ولذلك لا تستمر العمليات الفرعية التي بدأها الخادم بعد خروج عميل stdio الأب
    - يؤدي حذف جلسة أو إعادة تعيينها إلى التخلص من عملاء MCP لتلك الجلسة عبر مسار تنظيف بيئة التشغيل المشترك، ولذلك لا تبقى اتصالات stdio عالقة ومرتبطة بجلسة أُزيلت

  </Accordion>
</AccordionGroup>

### اختيار وضع العميل

<Tabs>
  <Tab title="عملاء MCP العامّون">
    أدوات MCP القياسية فقط. استخدم `conversations_list` و`messages_read` و`events_poll` و`events_wait` و`messages_send` وأدوات الموافقة.
  </Tab>
  <Tab title="Claude Code">
    أدوات MCP القياسية بالإضافة إلى محوّل القناة الخاص بـ Claude. فعّل `--claude-channel-mode on` أو اترك الإعداد الافتراضي `auto`.
  </Tab>
</Tabs>

<Note>
حاليًا، يتصرف `auto` بالطريقة نفسها التي يتصرف بها `on`. لا يوجد حتى الآن اكتشاف لإمكانات العميل.
</Note>

### ما يعرضه serve

يستخدم الجسر بيانات تعريف مسار جلسة Gateway الحالية لعرض المحادثات المدعومة بالقنوات. تظهر المحادثة عندما تكون لدى OpenClaw بالفعل حالة جلسة ذات مسار معروف، مثل:

- `channel`
- بيانات تعريف المستلم أو الوجهة
- `accountId` اختياري
- `threadId` اختياري

يمنح ذلك عملاء MCP مكانًا واحدًا من أجل:

- سرد المحادثات الموجّهة الحديثة
- قراءة سجل النصوص المنسوخة الحديث
- انتظار الأحداث الواردة الجديدة
- إرسال رد عبر المسار نفسه
- رؤية طلبات الموافقة التي تصل أثناء اتصال الجسر

### الاستخدام

<Tabs>
  <Tab title="Gateway محلي">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Gateway بعيد (رمز مميز)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Gateway بعيد (كلمة مرور)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="إخراج تفصيلي / تعطيل Claude">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### أدوات الجسر

<AccordionGroup>
  <Accordion title="conversations_list">
    يسرد المحادثات الحديثة المدعومة بالجلسات التي لديها بالفعل بيانات تعريف للمسار في حالة جلسة Gateway.

    عوامل التصفية: `limit` (بحد أقصى 500)، و`search`، و`channel`، و`includeDerivedTitles`، و`includeLastMessage`.

  </Accordion>
  <Accordion title="conversation_get">
    يعيد محادثة واحدة حسب `session_key` باستخدام بحث مباشر عن جلسة Gateway.
  </Accordion>
  <Accordion title="messages_read">
    يقرأ رسائل النصوص المنسوخة الحديثة لمحادثة واحدة مدعومة بجلسة. القيمة الافتراضية لـ `limit` هي 20، والحد الأقصى 200.
  </Accordion>
  <Accordion title="attachments_fetch">
    يستخرج كتل محتوى الرسالة غير النصية من رسالة واحدة في النص المنسوخ. هذا عرض لبيانات التعريف فوق محتوى النص المنسوخ، وليس مخزنًا مستقلًا ودائمًا لكتل المرفقات.
  </Accordion>
  <Accordion title="events_poll">
    يقرأ الأحداث المباشرة الموضوعة في قائمة الانتظار منذ مؤشر رقمي. الحد الأقصى لـ `limit` هو 200.
  </Accordion>
  <Accordion title="events_wait">
    يجري استقصاءً طويلًا حتى يصل الحدث المطابق التالي في قائمة الانتظار أو تنتهي المهلة (الافتراضي 30s، والحد الأقصى 300s).

    استخدم هذا عندما يحتاج عميل MCP عام إلى تسليم شبه فوري دون بروتوكول دفع خاص بـ Claude.

  </Accordion>
  <Accordion title="messages_send">
    يرسل نصًا عبر المسار نفسه المسجّل بالفعل في الجلسة.

    السلوك الحالي:

    - يتطلب مسار محادثة موجودًا
    - يستخدم قناة الجلسة والمستلم ومعرّف الحساب ومعرّف سلسلة المحادثة
    - يرسل النص فقط

  </Accordion>
  <Accordion title="permissions_list_open">
    يسرد طلبات الموافقة المعلقة للتنفيذ/Plugin التي رصدها الجسر منذ اتصاله بـ Gateway.
  </Accordion>
  <Accordion title="permissions_respond">
    يحسم طلب موافقة واحدًا معلقًا للتنفيذ/Plugin باستخدام:

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
- قائمة الانتظار مباشرة فقط؛ وتبدأ عند بدء جسر MCP
- لا يعيد `events_poll` و`events_wait` تشغيل سجل Gateway الأقدم من تلقاء نفسيهما
- ينبغي قراءة الأعمال المتراكمة الدائمة باستخدام `messages_read`

</Warning>

### إشعارات قناة Claude

يمكن للجسر أيضًا عرض إشعارات قناة خاصة بـ Claude. وهذا هو مكافئ OpenClaw لمحوّل قناة Claude Code: تظل أدوات MCP القياسية متاحة، لكن يمكن أن تصل الرسائل الواردة المباشرة أيضًا كإشعارات MCP خاصة بـ Claude.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: أدوات MCP القياسية فقط.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: تفعيل إشعارات قناة Claude.
  </Tab>
  <Tab title="auto (الافتراضي)">
    `--claude-channel-mode auto`: الإعداد الافتراضي الحالي؛ سلوك الجسر نفسه كما في `on`.
  </Tab>
</Tabs>

عندما يكون وضع قناة Claude مفعّلًا، يعلن الخادم عن إمكانات Claude التجريبية ويمكنه إصدار:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

سلوك الجسر الحالي:

- تُعاد توجيه رسائل النصوص المنسوخة الواردة من النوع `user` بصفتها `notifications/claude/channel`
- يتم تتبع طلبات أذونات Claude الواردة عبر MCP في الذاكرة
- إذا أرسل مالك الأمر في المحادثة المرتبطة لاحقًا `yes <id>` أو `no <id>` (يمثل `<id>` معرّف الطلب المكوّن من 5 أحرف، باستثناء `l`) يحوّل الجسر ذلك إلى `notifications/claude/channel/permission`
- هذه الإشعارات خاصة بالجلسة المباشرة فقط؛ وإذا انقطع اتصال عميل MCP، فلن توجد وجهة للدفع

هذا خاص بالعميل عن قصد. ينبغي أن تعتمد عملاء MCP العامة على أدوات الاستقصاء القياسية.

### إعدادات عميل MCP

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

بالنسبة إلى معظم عملاء MCP العامّين، ابدأ بواجهة الأدوات القياسية وتجاهل وضع Claude. فعّل وضع Claude فقط للعملاء الذين يفهمون فعليًا أساليب الإشعارات الخاصة بـ Claude.

### الخيارات

يدعم `openclaw mcp serve` ما يلي:

<ParamField path="--url" type="string">
  عنوان URL الخاص بـ WebSocket في Gateway. القيمة الافتراضية هي `gateway.remote.url` عند ضبطه.
</ParamField>
<ParamField path="--token" type="string">
  رمز Gateway المميز.
</ParamField>
<ParamField path="--token-file" type="string">
  قراءة الرمز المميز من ملف.
</ParamField>
<ParamField path="--password" type="string">
  كلمة مرور Gateway.
</ParamField>
<ParamField path="--password-file" type="string">
  قراءة كلمة المرور من ملف.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  وضع إشعارات Claude. القيمة الافتراضية `auto`.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  سجلات تفصيلية على stderr.
</ParamField>

<Tip>
يفضّل استخدام `--token-file` أو `--password-file` بدلًا من الأسرار المضمّنة متى أمكن.
</Tip>

### حدود الأمان والثقة

لا ينشئ الجسر مسارات توجيه من تلقاء نفسه. بل يعرض فقط المحادثات التي يعرف Gateway بالفعل كيفية توجيهها.

وهذا يعني:

- تظل قوائم السماح بالمرسلين والاقتران والثقة على مستوى القناة تابعة لإعداد قناة OpenClaw الأساسية
- لا يستطيع `messages_send` الرد إلا عبر مسار مخزّن موجود
- تكون حالة الموافقات مباشرة/في الذاكرة فقط لجلسة الجسر الحالية
- يجب أن تستخدم مصادقة الجسر ضوابط رمز Gateway المميز أو كلمة المرور نفسها التي تثق بها لأي عميل Gateway بعيد آخر

إذا كانت إحدى المحادثات مفقودة من `conversations_list`، فعادةً لا يكون السبب إعداد MCP، بل بيانات تعريف مسار مفقودة أو غير مكتملة في جلسة Gateway الأساسية.

### الاختبار

يتضمن OpenClaw اختبار Docker تمهيديًا حتميًا لهذا الجسر:

```bash
pnpm test:docker:mcp-channels
```

يشغّل هذا الاختبار حاوية واحدة: يهيئ حالة المحادثة، ويبدأ Gateway، ثم ينشئ `openclaw mcp serve` كعملية stdio فرعية ويتحكم فيه بصفته عميل MCP. ويتحقق من اكتشاف المحادثات، وقراءة النصوص المنسوخة، وقراءة بيانات تعريف المرفقات، وسلوك طابور الأحداث المباشرة، وإشعارات القنوات والأذونات بأسلوب Claude عبر جسر stdio MCP الحقيقي. ويُغطّى توجيه الإرسال الصادر (`messages_send` الذي يعيد استخدام مسار المحادثة المخزّن) بشكل منفصل بواسطة اختبارات الوحدة في `src/mcp/channel-server.test.ts`.

هذه أسرع طريقة لإثبات عمل الجسر دون ربط حساب Telegram أو Discord أو iMessage حقيقي بتشغيل الاختبار.

للاطلاع على سياق أوسع للاختبارات، راجع [الاختبار](/ar/help/testing).

### استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="لم تُرجع أي محادثات">
    يعني ذلك عادةً أن جلسة Gateway غير قابلة للتوجيه مسبقًا. تأكد من أن الجلسة الأساسية تتضمن بيانات تعريف مخزّنة للقناة/المزوّد والمستلِم، وبيانات تعريف اختيارية لمسار الحساب/سلسلة الرسائل.
  </Accordion>
  <Accordion title="يفوّت events_poll أو events_wait الرسائل الأقدم">
    هذا متوقع. يبدأ الطابور المباشر عند اتصال الجسر. اقرأ سجل النصوص المنسوخة الأقدم باستخدام `messages_read`.
  </Accordion>
  <Accordion title="لا تظهر إشعارات Claude">
    تحقق من كل ما يلي:

    - أبقى العميل جلسة stdio MCP مفتوحة
    - تكون قيمة `--claude-channel-mode` هي `on` أو `auto`
    - يفهم العميل فعليًا أساليب الإشعارات الخاصة بـ Claude
    - وصلت الرسالة الواردة بعد اتصال الجسر

  </Accordion>
  <Accordion title="الموافقات مفقودة">
    لا يعرض `permissions_list_open` إلا طلبات الموافقة التي رُصدت أثناء اتصال الجسر. وهو ليس واجهة API دائمة لسجل الموافقات.
  </Accordion>
</AccordionGroup>

## OpenClaw كسجل لعملاء MCP

هذا هو مسار `openclaw mcp list` و`show` و`status` و`doctor` و`probe` و`add` و`set`،
و`configure` و`tools` و`login` و`logout` و`reload` و`unset`.

لا تعرض هذه الأوامر OpenClaw عبر MCP. بل تدير تعريفات خوادم MCP التي يديرها OpenClaw ضمن `mcp.servers` في إعداد OpenClaw. وهي لا تقرأ خوادم mcporter من `config/mcporter.json`.

هذه التعريفات المحفوظة مخصصة لبيئات التشغيل التي يشغّلها OpenClaw أو يضبطها لاحقًا، مثل OpenClaw المضمّن ومهايئات بيئات التشغيل الأخرى. يخزّن OpenClaw التعريفات مركزيًا كي لا تضطر بيئات التشغيل هذه إلى الاحتفاظ بقوائم مكررة خاصة بها لخوادم MCP.

<AccordionGroup>
  <Accordion title="سلوك مهم">
    - لا تقرأ هذه الأوامر إلا إعداد OpenClaw أو تكتب فيه
    - لا يتصل `status` و`list` و`show` و`doctor` من دون `--probe` و`set` و`configure` و`tools` و`logout` و`reload` و`unset` بخادم MCP المستهدف
    - ينفّذ `login` تدفق شبكة OAuth الخاص بـ MCP لخادم HTTP المضبوط ويحفظ بيانات الاعتماد المحلية الناتجة
    - يطبع `status --verbose` تلميحات النقل والمصادقة والمهلة والمرشّح واستدعاء الأدوات المتوازي بعد حلّها، دون اتصال
    - يفحص `doctor` التعريفات المحفوظة بحثًا عن مشكلات الإعداد المحلي، مثل أوامر stdio المفقودة، وأدلة العمل غير الصالحة، وملفات TLS المفقودة، والخوادم المعطلة، وقيم الترويسات/متغيرات البيئة الحساسة المكتوبة حرفيًا، وتفويض OAuth غير المكتمل
    - يضيف `doctor --probe` إثبات الاتصال المباشر نفسه الذي يضيفه `probe` بعد نجاح الفحوصات الثابتة
    - يتصل `probe` بالخادم المحدد أو بجميع الخوادم المضبوطة، ويسرد الأدوات، ويبلغ عن الإمكانات/التشخيصات
    - ينشئ `add` تعريفًا من العلامات ويختبره قبل الحفظ، ما لم يُضبط `--no-probe` أو يلزم إجراء تفويض OAuth أولًا
    - تقرر مهايئات بيئات التشغيل أشكال النقل التي تدعمها فعليًا في وقت التنفيذ
    - يبقي `enabled: false` الخادم محفوظًا، لكنه يستبعده من اكتشاف بيئة التشغيل المضمّنة
    - يضبط `timeout` و`connectTimeout` مهلتي الطلب والاتصال لكل خادم بالثواني
    - يميّز `supportsParallelToolCalls: true` الخوادم التي تستطيع المهايئات استدعاءها بالتزامن
    - يمكن لخوادم HTTP استخدام ترويسات ثابتة، وتسجيل الدخول عبر OAuth، والتحكم في التحقق من TLS، ومسارات شهادة/مفتاح mTLS
    - يعرض OpenClaw المضمّن أدوات MCP المضبوطة ضمن ملفي الأدوات العاديين `coding` و`messaging`؛ ويظل `minimal` يخفيها، بينما يعطلها `tools.deny: ["bundle-mcp"]` صراحةً
    - يرشّح `toolFilter.include` و`toolFilter.exclude` لكل خادم أدوات MCP المكتشفة قبل أن تصبح أدوات OpenClaw
    - تعرض الخوادم التي تعلن عن موارد أو مطالبات أيضًا أدوات مساعدة لسرد الموارد/قراءتها ولسرد المطالبات/جلبها؛ وتستخدم أسماء الأدوات المساعدة المُنشأة هذه (`resources_list` و`resources_read` و`prompts_list` و`prompts_get`) مرشّح التضمين/الاستبعاد نفسه
    - تؤدي التغييرات الديناميكية في قائمة أدوات MCP إلى إبطال الكتالوج المخزّن مؤقتًا لتلك الجلسة؛ ويؤدي الاكتشاف/الاستخدام التالي إلى تحديثه من الخادم
    - تؤدي حالات الفشل المتكررة في طلبات أدوات MCP/البروتوكول إلى إيقاف ذلك الخادم مؤقتًا لفترة وجيزة، كي لا يستهلك خادم معطّل واحد دورة التفاعل كاملة
    - تُنهى بيئات تشغيل MCP المضمّنة ذات نطاق الجلسة بعد `mcp.sessionIdleTtlMs` ملّي ثانية من الخمول (القيمة الافتراضية 10 دقائق؛ اضبط `0` للتعطيل)، كما تنظّفها عمليات التشغيل المضمّنة أحادية التنفيذ عند انتهائها

  </Accordion>
</AccordionGroup>

قد تطبّع مهايئات بيئات التشغيل هذا السجل المشترك إلى الشكل الذي يتوقعه عميلها اللاحق. على سبيل المثال، يستهلك OpenClaw المضمّن قيم `transport` الخاصة بـ OpenClaw مباشرةً، بينما يتلقى Claude Code وGemini قيم `type` الأصلية للـ CLI، مثل `http` أو `sse` أو `stdio`.

يحترم خادم تطبيق Codex أيضًا كتلة `codex` اختيارية في كل خادم. هذه
بيانات تعريف إسقاط OpenClaw لسلاسل رسائل خادم تطبيق Codex فقط؛ وهي لا
تغيّر جلسات ACP أو إعداد حاضنة Codex العامة أو مهايئات بيئات التشغيل الأخرى.
استخدم `codex.agents` غير فارغ لإسقاط خادم في معرّفات وكلاء OpenClaw
المحددة فقط. ترفض عملية التحقق من الإعداد قوائم الوكلاء الفارغة أو الخالية أو غير الصالحة،
ويحذفها مسار إسقاط بيئة التشغيل بدلًا من جعلها
عامة. استخدم `codex.defaultToolsApprovalMode` ‏(`auto` أو `prompt` أو `approve`)
لإصدار `default_tools_approval_mode` الأصلي الخاص بـ Codex لخادم موثوق.
يزيل OpenClaw بيانات تعريف `codex` قبل تسليم إعداد `mcp_servers`
الأصلي إلى Codex.

### تعريفات خوادم MCP المحفوظة

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
- يطبع `show` من دون اسم كائن خادم MCP المضبوط كاملًا.
- يصنّف `status` وسائل النقل المضبوطة دون اتصال. ويتضمن `--verbose` تفاصيل التشغيل والمهلة وOAuth والمرشّح والاستدعاء المتوازي بعد حلّها.
- ينفّذ `doctor` فحوصات ثابتة دون اتصال. أضف `--probe` عندما ينبغي للأمر أيضًا التحقق من اتصال الخوادم المفعّلة.
- يتصل `probe` ويبلغ عن أعداد الأدوات، ودعم الموارد/المطالبات، ودعم تغيّر القوائم، والتشخيصات.
- يقبل `add` علامات stdio مثل `--command` و`--arg` و`--env` و`--cwd`، أو علامات HTTP مثل `--url` و`--transport` و`--header` و`--auth oauth`، إلى جانب علامات TLS والمهلة واختيار الأدوات.
- يتوقع `set` قيمة كائن JSON واحدة في سطر الأوامر.
- يحدّث `configure` التمكين ومرشّحات الأدوات والمهل وOAuth وTLS وتلميحات استدعاء الأدوات المتوازي دون استبدال تعريف الخادم كاملًا. أضف `--probe` للتحقق من الخادم المحدّث قبل الحفظ.
- يحدّث `tools` مرشّحات الأدوات لكل خادم. تكون إدخالات التضمين/الاستبعاد أسماء أدوات MCP وأنماط `*` عامة بسيطة.
- يشغّل `login` تدفق OAuth لخوادم HTTP المضبوطة باستخدام `auth: "oauth"`. تطبع عملية التشغيل الأولى عنوان URL للتفويض؛ أعد التشغيل باستخدام `--code` بعد الموافقة.
- يمسح `logout` بيانات اعتماد OAuth المخزّنة للخادم المسمى دون إزالة تعريف الخادم المحفوظ.
- يتخلص `reload` من بيئات تشغيل MCP المخبأة داخل العملية لعملية CLI الحالية فقط. ولا تزال عمليات Gateway أو الوكلاء الموجودة في عملية أخرى بحاجة إلى مسار إعادة التحميل أو إعادة التشغيل الخاص بها.
- استخدم `transport: "streamable-http"` لخوادم Streamable HTTP MCP. كما يطبّع `openclaw mcp set` قيمة `type: "http"` الأصلية للـ CLI إلى شكل الإعداد القياسي نفسه لأغراض التوافق.
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

### وصفات شائعة للخوادم

تحفظ هذه الأمثلة تعريفات الخوادم فقط. شغّل `openclaw mcp doctor --probe` بعدها لإثبات أن الخادم يبدأ ويعرض الأدوات.

<Tabs>
  <Tab title="نظام الملفات">
    ```bash
    openclaw mcp add files \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-filesystem \
      --arg "$HOME/Documents" \
      --include 'read_file,list_directory,search_files'
    openclaw mcp doctor files --probe
    ```

    احصر نطاق خوادم نظام الملفات في أصغر شجرة أدلة ينبغي للوكيل قراءتها أو تعديلها.

  </Tab>
  <Tab title="الذاكرة">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    استخدم مرشح أدوات إذا كان الخادم يعرض أدوات كتابة لا ينبغي إتاحتها للوكلاء العاديين.

  </Tab>
  <Tab title="برنامج نصي محلي">
    ```bash
    openclaw mcp add local-tools \
      --command node \
      --arg ./dist/mcp-server.js \
      --cwd /srv/openclaw-tools \
      --env API_BASE=https://internal.example
    openclaw mcp status --verbose
    ```

    يتحقق `doctor` من وجود `cwd` ومن إمكانية حل الأمر من البيئة المضبوطة.

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

    استخدم OAuth عندما يدعمه الخادم البعيد. إذا كان الخادم يتطلب ترويسات ثابتة، فتجنب إيداع رموز حامل حرفية.

  </Tab>
  <Tab title="سطح المكتب/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    ترث خوادم التحكم المباشر بسطح المكتب أذونات العملية التي تشغّلها. استخدم مرشحات أدوات ضيقة ومطالبات أذونات على مستوى نظام التشغيل.

  </Tab>
</Tabs>

### أشكال مخرجات JSON

استخدم `--json` للبرامج النصية ولوحات المعلومات. قد تتوسع مجموعات الحقول بمرور الوقت، لذا ينبغي للمستهلكين تجاهل المفاتيح غير المعروفة.

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
      "ok": true,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": true,
          "issues": [
            {
              "level": "warning",
              "message": "بيانات اعتماد OAuth غير مخوّلة؛ شغّل openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    ينتهي `doctor --json` برمز غير صفري عندما يحتوي أي خادم مفعّل جرى فحصه على مشكلة بمستوى `error`. تُبلّغ مشكلات `warning` و`info`، لكنها لا تتسبب وحدها في فشل الأمر.

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
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

    يفتح `probe --json` جلسة عميل MCP حية ويطبع نتيجتها مباشرةً؛ وعلى خلاف `status`/`doctor`، لا تحتوي المخرجات على حقل `path` في المستوى الأعلى. لا تظهر مفاتيح `resources` و`prompts` إلا عندما يعلن الخادم فعليًا عن تلك الإمكانية (فالخادم الذي لا يدعم المطالبات يحذف مفتاح `prompts` بدلًا من الإبلاغ عن `false`). استخدم `probe` لإثبات إمكانية الوصول والإمكانات، لا لتدقيق الإعدادات الثابتة.

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
| `args`                     | مصفوفة من معاملات سطر الأوامر   |
| `env`                      | متغيرات بيئة إضافية       |
| `cwd` / `workingDirectory` | دليل العمل للعملية |

<Warning>
**مرشح أمان بيئة Stdio**

يرفض OpenClaw مفاتيح البيئة الخاصة ببدء تشغيل المفسر واختطاف أداة التحميل وتهيئة الصدفة قبل تشغيل خادم MCP عبر stdio، حتى إذا ظهرت في كتلة `env` الخاصة بالخادم. يستخدم ذلك سياسة أمان بيئة المضيف نفسها المطبقة على العمليات الأخرى التي يشغّلها OpenClaw: فهو يحظر خطافات بدء تشغيل المفسرات المعروفة (على سبيل المثال `NODE_OPTIONS` و`PYTHONSTARTUP` و`PERL5OPT` و`RUBYOPT` و`BASHOPTS` و`KSH_ENV`) وبادئات حقن المكتبات المشتركة والدوال (`DYLD_*` و`LD_*` و`BASH_FUNC_*`) ومتغيرات التحكم المشابهة في وقت التشغيل. يُسقط بدء التشغيل هذه المتغيرات بصمت ويسجل تحذيرًا حتى لا تتمكن من حقن تمهيد ضمني أو تبديل المفسر أو تمكين مصحح أخطاء أو اختطاف الرابط الديناميكي ضد عملية stdio. وتُبقي قائمة سماح صريحة متغيرات بيئة بيانات اعتماد MCP العادية قابلة للاستخدام (`GITHUB_TOKEN` و`GH_TOKEN` و`GITLAB_TOKEN` و`NPM_TOKEN` و`NODE_AUTH_TOKEN` و`DATABASE_URL` و`MONGODB_URI` و`REDIS_URL` و`AMQP_URL` و`AWS_ACCESS_KEY_ID` و`AWS_SECRET_ACCESS_KEY` و`AWS_SESSION_TOKEN` و`AZURE_CLIENT_ID` و`AZURE_CLIENT_SECRET`) إلى جانب متغيرات بيئة الوكيل العادية والمتغيرات الخاصة بالخادم (`HTTP_PROXY` و`*_API_KEY` المخصصة وما إلى ذلك). تظل مفاتيح `AWS_*` الأخرى مثل `AWS_CONFIG_FILE` و`AWS_SHARED_CREDENTIALS_FILE` محظورة لأنها تشير إلى ملفات بيانات اعتماد بدلًا من حمل قيمة بيانات اعتماد مباشرةً.

إذا كان خادم MCP يحتاج فعلًا إلى أحد المتغيرات المحظورة، فاضبطه في عملية مضيف Gateway بدلًا من وضعه ضمن `env` الخاص بخادم stdio.
</Warning>

### نقل SSE / HTTP

يتصل بخادم MCP بعيد عبر أحداث HTTP المرسلة من الخادم.

| الحقل                          | الوصف                                                      |
| ------------------------------ | ---------------------------------------------------------------- |
| `url`                          | عنوان URL باستخدام HTTP أو HTTPS للخادم البعيد (مطلوب)                |
| `headers`                      | خريطة اختيارية لأزواج مفاتيح وقيم ترويسات HTTP (مثل رموز المصادقة) |
| `connectionTimeoutMs`          | مهلة اتصال لكل خادم بالمللي ثانية (اختيارية)                   |
| `connectTimeout`               | مهلة اتصال لكل خادم بالثواني (اختيارية)              |
| `timeout` / `requestTimeoutMs` | مهلة طلب MCP لكل خادم بالثواني أو المللي ثانية                  |
| `auth: "oauth"`                | استخدام بيانات اعتماد MCP لـ OAuth المحفوظة بواسطة `openclaw mcp login`          |
| `sslVerify`                    | اضبطه على false فقط لنقاط نهاية HTTPS الخاصة الموثوقة صراحةً    |
| `clientCert` / `clientKey`     | مسارا شهادة عميل mTLS ومفتاحه                            |
| `supportsParallelToolCalls`    | إشارة إلى أن الاستدعاءات المتزامنة آمنة لهذا الخادم              |

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

تُنقّح القيم الحساسة في `url` (معلومات المستخدم) و`headers` في السجلات ومخرجات الحالة. يحذر `openclaw mcp doctor` عندما تحتوي إدخالات `headers` أو `env` التي تبدو حساسة على قيم حرفية، بحيث يستطيع المشغّلون نقل تلك القيم خارج الإعدادات المودعة.

### سير عمل OAuth

يُستخدم OAuth لخوادم MCP عبر HTTP التي تعلن عن تدفق MCP لـ OAuth. تُتجاهل ترويسات `Authorization` الثابتة للخادم ما دام `auth: "oauth"` مفعّلًا. تعمل بيانات الاعتماد المحفوظة بواسطة `openclaw mcp login` مع MCP المضمّن ومشغّلات CLI وخادم تطبيق Codex المحلي.

إلى أن تتوفر بيانات الاعتماد، يحذف OpenClaw خادم MCP ذاك فقط من وقت تشغيل الوكيل بدلًا من إفشال دورة الوكيل. ويمكن للمشغّل، أو لوكيل لديه وصول إلى الصدفة، تشغيل `openclaw mcp login <name>` ثم استخدام الخادم في دورة لاحقة.

عندما تكون خدمة MCP بعيدة مدعومة بالفعل بملف تعريف مصادقة منفصل في OpenClaw قادر على التحديث، يمكنك اختياريًا ضبط `oauth.authProfileId`. يحدّث OpenClaw أيًا من مصدري بيانات الاعتماد قبل إسقاط وقت التشغيل، ولا يمرر إلى عميل MCP اللاحق سوى رمز الوصول الحالي.

<Steps>
  <Step title="حفظ الخادم">
    أضف الخادم أو حدّثه باستخدام `auth: "oauth"` وأي بيانات وصفية اختيارية لـ OAuth.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

    لحامل مدعوم بملف تعريف مصادقة، احفظ ربط ملف التعريف:

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"authProfileId":"docs:mcp"}}'
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
    بعد الموافقة في المتصفح، مرّر الرمز المُعاد إلى OpenClaw.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="التحقق من التفويض">
    استخدم status أو doctor للتأكد من وجود الرموز المميزة.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="مسح بيانات الاعتماد">
    يزيل تسجيل الخروج بيانات اعتماد OAuth المخزنة، لكنه يُبقي تعريف الخادم المحفوظ.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

إذا أجرى المزوّد تدويرًا للرموز المميزة أو علقت حالة التفويض، فشغّل `openclaw mcp logout <name>`، ثم كرر `login`. يمكن للأمر `logout` مسح بيانات اعتماد خادم HTTP محفوظ حتى بعد إزالة `auth: "oauth"` من الإعداد، ما دام اسم الخادم وعنوان URL لا يزالان يحددان إدخال مخزن بيانات الاعتماد.

### نقل HTTP القابل للبث

يُعد `streamable-http` خيار نقل إضافيًا إلى جانب `sse` و`stdio`. ويستخدم بث HTTP للاتصال ثنائي الاتجاه بخوادم MCP البعيدة.

| الحقل                          | الوصف                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `url`                          | عنوان URL لخادم HTTP أو HTTPS البعيد (مطلوب)                                      |
| `transport`                    | اضبطه على `"streamable-http"` لاختيار هذا النقل؛ وعند حذفه، يستخدم OpenClaw ‏`sse` |
| `headers`                      | خريطة اختيارية من أزواج المفتاح والقيمة لترويسات HTTP (مثل رموز المصادقة المميزة)                       |
| `connectionTimeoutMs`          | مهلة الاتصال لكل خادم بالمللي ثانية (اختياري)                                         |
| `connectTimeout`               | مهلة الاتصال لكل خادم بالثواني (اختياري)                                    |
| `timeout` / `requestTimeoutMs` | مهلة طلب MCP لكل خادم بالثواني أو المللي ثانية                                        |
| `auth: "oauth"`                | استخدم بيانات اعتماد MCP OAuth المحفوظة بواسطة `openclaw mcp login`                                |
| `sslVerify`                    | اضبطه على false فقط لنقاط نهاية HTTPS الخاصة والموثوق بها صراحةً                          |
| `clientCert` / `clientKey`     | مسارا شهادة عميل mTLS ومفتاحه                                                  |
| `supportsParallelToolCalls`    | تلميح إلى أن الاستدعاءات المتزامنة آمنة لهذا الخادم                                    |

يستخدم إعداد OpenClaw الصيغة `transport: "streamable-http"` بوصفها الصيغة القياسية. تُقبل قيم MCP الأصلية في CLI ‏`type: "http"` عند حفظها عبر `openclaw mcp set`، ويُصلحها `openclaw doctor --fix` في الإعداد الحالي، لكن `transport` هو ما يستهلكه OpenClaw المضمّن مباشرةً.

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
لا تبدأ أوامر السجل جسر القناة. لا يفتح جلسة عميل MCP حية لإثبات إمكانية الوصول إلى الخادم المستهدف سوى `probe` و`doctor --probe`.
</Note>

## واجهة التحكم

تتضمن واجهة التحكم في المتصفح صفحة مخصصة لإعدادات MCP في `/settings/mcp`؛ ويظل المسار السابق `/mcp` اسمًا مستعارًا. تعرض الصفحة أعداد الخوادم المضبوطة، وملخصات التمكين وOAuth والتصفية، وصفوف النقل لكل خادم، وعناصر التحكم في التمكين والتعطيل، وأوامر CLI الشائعة، ومحررًا محدد النطاق لقسم الإعداد `mcp`.

استخدم الصفحة لإجراء تعديلات المشغّل والجرد السريع. استخدم `openclaw mcp doctor --probe` أو `openclaw mcp probe` عندما تحتاج إلى إثبات حي للخادم.

سير عمل المشغّل:

1. افتح واجهة التحكم واختر **MCP**.
2. راجع بطاقات الملخص لإجمالي الخوادم والممكّنة منها وخوادم OAuth والخوادم المصفّاة.
3. استخدم صف كل خادم للاطلاع على تلميحات النقل والمصادقة والتصفية والمهلة والأوامر.
4. بدّل حالة التمكين عندما تريد الاحتفاظ بتعريف مع استبعاده من اكتشاف وقت التشغيل.
5. حرّر قسم الإعداد محدد النطاق `mcp` لإجراء تغييرات بنيوية، مثل إضافة خوادم أو ترويسات أو TLS أو بيانات OAuth الوصفية أو مرشحات الأدوات.
6. اختر **حفظ** للاحتفاظ بالإعداد فقط، أو **حفظ ونشر** لتطبيقه عبر مسار إعداد Gateway.
7. شغّل `openclaw mcp doctor --probe` عندما تحتاج إلى إثبات حي على أن الخادم المعدّل يبدأ ويسرد الأدوات.

ملاحظات:

- تضع مقتطفات الأوامر أسماء الخوادم بين علامتي اقتباس لكي تظل الأسماء غير المعتادة قابلة للنسخ في الصدفة
- تُنقّح القيم المعروضة الشبيهة بعناوين URL قبل التصيير عندما تحتوي على بيانات اعتماد مضمنة
- لا تبدأ الصفحة عمليات نقل MCP بنفسها
- قد تحتاج أوقات التشغيل النشطة إلى `openclaw mcp reload` أو نشر إعداد Gateway أو إعادة تشغيل العملية، بحسب العملية المالكة لعملاء MCP

## تطبيقات MCP

يمكن لـ OpenClaw تصيير الأدوات التي تنفذ [امتداد تطبيقات MCP](https://modelcontextprotocol.io/extensions/apps) المستقر. تكون التطبيقات اختيارية لأن HTML الخاص بها يأتي من خادم MCP المضبوط، ويمكنه طلب أدوات أو موارد مرئية للتطبيق من الخادم نفسه.

مكّن جسر المضيف:

```bash
openclaw config set mcp.apps.enabled true --strict-json
```

أعد تشغيل Gateway بعد تغيير هذا الإعداد. عند التمكين، يبدأ OpenClaw مستمع HTTP(S) خاصًا بصندوق العزل على منفذ Gateway زائد واحد (بالنسبة إلى Gateway الافتراضي، `18790`). تحمّل واجهة التحكم التطبيقات من ذلك الأصل المنفصل؛ ولا يقدم المستمع مطلقًا واجهة التحكم أو مسارات Gateway المصادَق عليها أو بيانات المستخدم.

تحتاج الاتصالات المباشرة بـ Gateway إلى الوصول إلى كلا المنفذين. إذا كشف وكيل عكسي أو مُنهي TLS واجهة التحكم، فامنح التطبيقات أصلًا عامًا مخصصًا، ومرّر ذلك الأصل وحده إلى مستمع صندوق العزل:

```json5
{
  mcp: {
    apps: {
      enabled: true,
      sandboxOrigin: "https://mcp-apps.example.com",
      sandboxPort: 18790,
    },
  },
}
```

يجب أن يختلف أصل صندوق العزل عن أصل واجهة التحكم. لا تستضف عليه أي محتوى آخر مصادَق عليه أو حساس.

على سبيل المثال، يمكن ضبط العرض التوضيحي الرسمي الأساسي المبني باستخدام React على النحو الآتي:

```json5
{
  mcp: {
    apps: { enabled: true },
    servers: {
      "basic-react": {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-basic-react", "--stdio"],
      },
    },
  },
}
```

السلوك والحدود الأمنية:

- لا يعلن OpenClaw عن امتداد `io.modelcontextprotocol/ui` إلا عند تمكين التطبيقات.
- لا تُصيّر سوى موارد `ui://` ذات نوع MIME المطابق تمامًا لـ `text/html;profile=mcp-app`.
- تُحدد موارد واجهة المستخدم بحد أقصى قدره 2 MiB، وتوضع خلف وكيل ذي إطاري iframe متداخلين على أصل خارجي مخصص، وتُحمّل في أصل تطبيق داخلي مبهم، وتُقيّد بواسطة CSP مشتقة من البيانات الوصفية للمورد.
- تظل الأدوات الخاصة بالتطبيق فقط (`_meta.ui.visibility: ["app"]`) خارج قوائم أدوات النموذج. ولا يمكن للتطبيقات استدعاء سوى الأدوات المرئية للتطبيق على الخادم المالك لها، التي تجتاز أيضًا سياسة أدوات OpenClaw الفعلية للتشغيل الذي أنشأ طريقة العرض.
- لا تُمنح أذونات التطبيقات المرتبطة بالأصل، مثل الكاميرا والميكروفون والموقع الجغرافي، ما دامت مستندات التطبيقات الداخلية تستخدم أصولًا مبهمة للعزل بين التطبيقات.
- يظل HTML الخاص بالتطبيق ووسائط الأدوات الكاملة والنتائج الأولية ضمن مدة إيجار محدودة لطريقة العرض في الذاكرة مقدارها عشر دقائق، ولا تُكتب إلى القرص ولا تُنسخ إلى بيانات المعاينة الوصفية للنص المنسوخ. لا يخزّن النص المنسوخ سوى واصف محدود للخادم والأداة والمورد مرتبط بمعرّف استدعاء الأداة الأصلي. بعد إعادة تشغيل Gateway، يمكن لواجهة التحكم التحقق من ذلك الواصف مقابل النص المنسوخ للجلسة المصادَق عليها وإعادة جلب مورد `ui://`؛ وتكون طرق العرض المُعاد إنشاؤها للقراءة فقط إلى أن ينشئ تشغيل جديد أذونات الأدوات الحالية.
- يحذّر `openclaw security audit` أثناء تمكين الجسر. عطّله باستخدام `openclaw config set mcp.apps.enabled false --strict-json` عندما لا تكون هناك حاجة إليه.

## الحدود الحالية

توثّق هذه الصفحة الجسر كما هو متاح حاليًا.

الحدود الحالية:

- يعتمد اكتشاف المحادثات على البيانات الوصفية الحالية لمسار جلسة Gateway
- لا يوجد بروتوكول دفع عام يتجاوز المحوّل الخاص بـ Claude
- لا تتوفر بعد أدوات لتعديل الرسائل أو إضافة تفاعلات إليها
- يتصل نقل HTTP/SSE/streamable-http بخادم بعيد واحد؛ ولا تتوفر بعد اتصالات صاعدة متعددة الإرسال
- لا يتضمن `permissions_list_open` سوى الموافقات المرصودة أثناء اتصال الجسر

## ذو صلة

- [مرجع CLI](/ar/cli)
- [Plugins](/ar/cli/plugins)

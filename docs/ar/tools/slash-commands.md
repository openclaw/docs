---
read_when:
    - استخدام أو تكوين أوامر الدردشة
    - استكشاف أخطاء توجيه الأوامر أو الأذونات وإصلاحها
sidebarTitle: Slash commands
summary: 'أوامر الشرطة المائلة: النصية مقابل الأصلية، والتكوين، والأوامر المدعومة'
title: أوامر الشرطة المائلة
x-i18n:
    generated_at: "2026-05-10T20:06:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: e97154facfa481b0c0d4b595f595d3698ee3e92c0a197794d12d75030a12ecb7
    source_path: tools/slash-commands.md
    workflow: 16
---

تتولى Gateway معالجة الأوامر. يجب إرسال معظم الأوامر كرسالة **مستقلة** تبدأ بـ `/`. يستخدم أمر دردشة bash الخاص بالمضيف `! <cmd>` (مع `/bash <cmd>` كاسم بديل).

عندما تكون محادثة أو سلسلة مرتبطة بجلسة ACP، يُوجَّه نص المتابعة العادي إلى ذلك الحاضن ACP. تبقى أوامر إدارة Gateway محلية: يصل `/acp ...` دائما إلى معالج أوامر OpenClaw ACP، ويبقيان `/status` و`/unfocus` محليين كلما كانت معالجة الأوامر مفعلة للسطح.

يوجد نظامان مرتبطان:

<AccordionGroup>
  <Accordion title="الأوامر">
    رسائل `/...` المستقلة.
  </Accordion>
  <Accordion title="التوجيهات">
    `/think`، `/fast`، `/verbose`، `/trace`، `/reasoning`، `/elevated`، `/exec`، `/model`، `/queue`.

    - تُزال التوجيهات من الرسالة قبل أن يراها النموذج.
    - في رسائل الدردشة العادية (وليست الرسائل التي تحتوي على توجيهات فقط)، تُعامل كـ "تلميحات مضمنة" ولا تستمر في إعدادات الجلسة.
    - في الرسائل التي تحتوي على توجيهات فقط (تحتوي الرسالة على توجيهات فقط)، تستمر في الجلسة وترد بإقرار.
    - لا تُطبق التوجيهات إلا على **المرسلين المصرح لهم**. إذا تم تعيين `commands.allowFrom`، فهي قائمة السماح الوحيدة المستخدمة؛ وإلا يأتي التصريح من قوائم سماح/إقران القنوات بالإضافة إلى `commands.useAccessGroups`. يرى المرسلون غير المصرح لهم التوجيهات كنص عادي.

  </Accordion>
  <Accordion title="الاختصارات المضمنة">
    المرسلون الموجودون في قائمة السماح/المصرح لهم فقط: `/help`، `/commands`، `/status`، `/whoami` (`/id`).

    تُشغل فورا، وتُزال قبل أن يرى النموذج الرسالة، ويستمر النص المتبقي عبر التدفق العادي.

  </Accordion>
</AccordionGroup>

## الإعداد

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<ParamField path="commands.text" type="boolean" default="true">
  يفعّل تحليل `/...` في رسائل الدردشة. على الأسطح التي لا تتضمن أوامر أصلية (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams)، تستمر الأوامر النصية في العمل حتى إذا عينت هذا إلى `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  يسجل الأوامر الأصلية. تلقائي: مفعّل لـ Discord/Telegram؛ متوقف لـ Slack (حتى تضيف أوامر شرطة مائلة)؛ يُتجاهل لمزودي الخدمة من دون دعم أصلي. عيّن `channels.discord.commands.native` أو `channels.telegram.commands.native` أو `channels.slack.commands.native` للتجاوز لكل مزود (قيمة منطقية أو `"auto"`). على Discord، يتخطى `false` تسجيل أوامر الشرطة المائلة وتنظيفها أثناء بدء التشغيل؛ قد تبقى الأوامر المسجلة سابقا ظاهرة حتى تزيلها من تطبيق Discord. تُدار أوامر Slack في تطبيق Slack ولا تُزال تلقائيا.
</ParamField>
على Discord، قد تتضمن مواصفات الأوامر الأصلية `descriptionLocalizations`، والتي تنشرها OpenClaw كـ `description_localizations` في Discord وتدرجها في مقارنات المطابقة.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  يسجل أوامر **Skills** أصليا عند دعمها. تلقائي: مفعّل لـ Discord/Telegram؛ متوقف لـ Slack (يتطلب Slack إنشاء أمر شرطة مائلة لكل Skill). عيّن `channels.discord.commands.nativeSkills` أو `channels.telegram.commands.nativeSkills` أو `channels.slack.commands.nativeSkills` للتجاوز لكل مزود (قيمة منطقية أو `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  يفعّل `! <cmd>` لتشغيل أوامر صدفة المضيف (`/bash <cmd>` اسم بديل؛ يتطلب قوائم سماح `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  يتحكم في مدة انتظار bash قبل التبديل إلى وضع الخلفية (`0` ينقله إلى الخلفية فورا).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  يفعّل `/config` (يقرأ/يكتب `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  يفعّل `/mcp` (يقرأ/يكتب إعداد MCP المدار من OpenClaw ضمن `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  يفعّل `/plugins` (اكتشاف Plugin/حالته بالإضافة إلى عناصر تحكم التثبيت والتفعيل/التعطيل).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  يفعّل `/debug` (تجاوزات وقت التشغيل فقط).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  يفعّل `/restart` بالإضافة إلى إجراءات أداة إعادة تشغيل Gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  يعيّن قائمة السماح الصريحة للمالك لأسطح الأوامر/الأدوات الخاصة بالمالك فقط. هذا هو حساب المشغل البشري الذي يمكنه الموافقة على الإجراءات الخطرة وتشغيل أوامر مثل `/diagnostics` و`/export-trajectory` و`/config`. وهو منفصل عن `commands.allowFrom` وعن وصول إقران الرسائل المباشرة.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  لكل قناة: يجعل الأوامر الخاصة بالمالك فقط تتطلب **هوية المالك** للتشغيل على ذلك السطح. عندما تكون `true`، يجب أن يطابق المرسل إما مرشح مالك محلول (مثل إدخال في `commands.ownerAllowFrom` أو بيانات مالك أصلية من المزود) أو يملك نطاق `operator.admin` داخليا على قناة رسائل داخلية. إدخال البدل في `allowFrom` للقناة، أو قائمة مرشحي مالك فارغة/غير محلولة، **ليس** كافيا — تفشل أوامر المالك فقط بإغلاق على تلك القناة. اترك هذا متوقفا إذا كنت تريد حراسة أوامر المالك فقط بواسطة `ownerAllowFrom` وقوائم سماح الأوامر القياسية فقط.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  يتحكم في كيفية ظهور معرفات المالك في موجه النظام.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  يعيّن اختياريا سر HMAC المستخدم عند `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  قائمة سماح لكل مزود لتصريح الأوامر. عند تهيئتها، تكون مصدر التصريح الوحيد للأوامر والتوجيهات (تُتجاهل قوائم سماح/إقران القنوات و`commands.useAccessGroups`). استخدم `"*"` كافتراضي عام؛ تتجاوزه المفاتيح الخاصة بالمزود.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  يفرض قوائم السماح/السياسات للأوامر عندما لا يكون `commands.allowFrom` معينا.
</ParamField>

## قائمة الأوامر

مصدر الحقيقة الحالي:

- تأتي المضمنات الأساسية من `src/auto-reply/commands-registry.shared.ts`
- تأتي أوامر اللوحة المولدة من `src/auto-reply/commands-registry.data.ts`
- تأتي أوامر Plugin من استدعاءات `registerCommand()` الخاصة بالـ Plugin
- لا يزال التوفر الفعلي على gateway لديك يعتمد على أعلام الإعدادات، وسطح القناة، والـ plugins المثبتة/المفعلة

### الأوامر الأساسية المضمنة

<AccordionGroup>
  <Accordion title="الجلسات وعمليات التشغيل">
    - يبدأ `/new [model]` جلسة جديدة؛ و`/reset` هو اسم إعادة الضبط البديل.
    - تعترض واجهة Control الأمر المكتوب `/new` لإنشاء جلسة لوحة معلومات جديدة والتبديل إليها، إلا عندما يكون `session.dmScope: "main"` مهيأ وتكون الجلسة الأصلية الحالية هي الجلسة الرئيسية للوكيل؛ في تلك الحالة يعيد `/new` ضبط الجلسة الرئيسية في مكانها. لا يزال `/reset` المكتوب يشغل إعادة الضبط في المكان الخاصة بـ Gateway.
    - يحافظ `/reset soft [message]` على النص الحالي، ويسقط معرفات جلسات واجهة CLI الخلفية المعاد استخدامها، ويعيد تشغيل تحميل بدء التشغيل/موجه النظام في المكان.
    - يضغط `/compact [instructions]` سياق الجلسة. راجع [Compaction](/ar/concepts/compaction).
    - يجهض `/stop` عملية التشغيل الحالية.
    - يدير `/session idle <duration|off>` و`/session max-age <duration|off>` انتهاء صلاحية ربط السلسلة.
    - يصدّر `/export-session [path]` الجلسة الحالية إلى HTML. الاسم البديل: `/export`.
    - يطلب `/export-trajectory [path]` موافقة exec، ثم يصدّر [حزمة مسار](/ar/tools/trajectory) بصيغة JSONL للجلسة الحالية. استخدمه عندما تحتاج إلى الجدول الزمني للموجه، والأداة، والنص لجلسة OpenClaw واحدة. في دردشات المجموعات، يذهب موجه الموافقة ونتيجة التصدير إلى المالك بشكل خاص. الاسم البديل: `/trajectory`.

  </Accordion>
  <Accordion title="عناصر تحكم النموذج والتشغيل">
    - يعيّن `/think <level|default>` مستوى التفكير أو يمسح تجاوز الجلسة. تأتي الخيارات من ملف تعريف مزود النموذج النشط؛ المستويات الشائعة هي `off` و`minimal` و`low` و`medium` و`high`، مع مستويات مخصصة مثل `xhigh` أو `adaptive` أو `max`، أو الثنائية `on` فقط حيث تكون مدعومة. الأسماء البديلة: `/thinking`، `/t`.
    - يبدّل `/verbose on|off|full` الإخراج المطول. الاسم البديل: `/v`.
    - يبدّل `/trace on|off` إخراج تتبع Plugin للجلسة الحالية.
    - يعرض `/fast [status|on|off|default]` الوضع السريع أو يعيّنه أو يمسحه.
    - يبدّل `/reasoning [on|off|stream]` رؤية الاستدلال. الاسم البديل: `/reason`.
    - يبدّل `/elevated [on|off|ask|full]` الوضع المرتفع. الاسم البديل: `/elev`.
    - يعرض `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` افتراضيات exec أو يعيّنها.
    - يعرض `/model [name|#|status]` النموذج أو يعيّنه.
    - يسرد `/models [provider] [page] [limit=<n>|size=<n>|all]` المزودين المهيئين/المتوفرين بالمصادقة أو نماذج مزود؛ أضف `all` لاستعراض الكتالوج الكامل لذلك المزود. تجعل إدخالات `provider/*` في `agents.defaults.models` الأمرين `/model` و`/models` يعرضان النماذج المكتشفة لهؤلاء المزودين فقط.
    - يدير `/queue <mode>` سلوك قائمة الانتظار (`steer`، و`queue` القديم، و`followup`، و`collect`، و`steer-backlog`، و`interrupt`) بالإضافة إلى خيارات مثل `debounce:0.5s cap:25 drop:summarize`؛ يمسح `/queue default` أو `/queue reset` تجاوز الجلسة. راجع [قائمة انتظار الأوامر](/ar/concepts/queue) و[قائمة انتظار التوجيه](/ar/concepts/queue-steering).
    - يحقن `/steer <message>` إرشادا في عملية التشغيل النشطة للجلسة الحالية، مستقلا عن وضع `/queue`. لا يبدأ عملية تشغيل جديدة عندما تكون الجلسة خاملة. الاسم البديل: `/tell`. راجع [التوجيه](/ar/tools/steer).

  </Accordion>
  <Accordion title="الاكتشاف والحالة">
    - يعرض `/help` ملخص المساعدة القصير.
    - يعرض `/commands` كتالوج الأوامر المولد.
    - يعرض `/tools [compact|verbose]` ما يمكن للوكيل الحالي استخدامه الآن.
    - يعرض `/status` حالة التنفيذ/وقت التشغيل، ومدة تشغيل Gateway والنظام، بالإضافة إلى استخدام/حصة المزود عند توفرها.
    - `/diagnostics [note]` هو تدفق تقرير الدعم الخاص بالمالك فقط لأخطاء Gateway وعمليات تشغيل حاضن Codex. يطلب موافقة exec صريحة في كل مرة قبل تشغيل `openclaw gateway diagnostics export --json`؛ لا توافق على التشخيصات بقاعدة سماح للكل. بعد الموافقة، يرسل تقريرا قابلا للصق يتضمن مسار الحزمة المحلي، وملخص البيان، وملاحظات الخصوصية، ومعرفات الجلسات ذات الصلة. في دردشات المجموعات، يذهب موجه الموافقة والتقرير إلى المالك بشكل خاص. عندما تستخدم الجلسة النشطة حاضن OpenAI Codex، ترسل الموافقة نفسها أيضا ملاحظات Codex ذات الصلة إلى خوادم OpenAI وتدرج الاستجابة المكتملة معرفات جلسات OpenClaw، ومعرفات سلاسل Codex، وأوامر `codex resume <thread-id>`. راجع [تصدير التشخيصات](/ar/gateway/diagnostics).
    - يشغل `/crestodian <request>` مساعد إعداد وإصلاح Crestodian من رسالة مباشرة للمالك.
    - يسرد `/tasks` المهام الخلفية النشطة/الحديثة للجلسة الحالية.
    - يشرح `/context [list|detail|map|json]` كيفية تجميع السياق. يرسل `map` صورة خريطة شجرية لسياق الجلسة الحالية.
    - يعرض `/whoami` معرف المرسل الخاص بك. الاسم البديل: `/id`.
    - يتحكم `/usage off|tokens|full|cost` في تذييل الاستخدام لكل استجابة أو يطبع ملخص تكلفة محليا.

  </Accordion>
  <Accordion title="Skills، قوائم السماح، الموافقات">
    - يشغّل `/skill <name> [input]` Skill بالاسم.
    - يدير `/allowlist [list|add|remove] ...` إدخالات قائمة السماح. نصي فقط.
    - يحلّ `/approve <id> <decision>` مطالبات موافقة exec.
    - يطرح `/btw <question>` سؤالًا جانبيًا من دون تغيير سياق الجلسة المستقبلي. الاسم المستعار: `/side`. راجع [بالمناسبة](/ar/tools/btw).

  </Accordion>
  <Accordion title="الوكلاء الفرعيون و ACP">
    - يدير `/subagents list|kill|log|info|send|steer|spawn` تشغيلات الوكلاء الفرعيين للجلسة الحالية.
    - يدير `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` جلسات ACP وخيارات وقت التشغيل.
    - يربط `/focus <target>` سلسلة Discord الحالية أو موضوع/محادثة Telegram بهدف جلسة.
    - يزيل `/unfocus` الربط الحالي.
    - يسرد `/agents` الوكلاء المرتبطين بالسلاسل للجلسة الحالية.
    - يوقف `/kill <id|#|all>` وكيلًا فرعيًا واحدًا قيد التشغيل أو كل الوكلاء الفرعيين.
    - يرسل `/subagents steer <id|#> <message>` توجيهًا إلى وكيل فرعي قيد التشغيل. راجع [التوجيه](/ar/tools/steer).

  </Accordion>
  <Accordion title="كتابات المالك فقط والإدارة">
    - يقرأ أو يكتب `/config show|get|set|unset` ملف `openclaw.json`. للمالك فقط. يتطلب `commands.config: true`.
    - يقرأ أو يكتب `/mcp show|get|set|unset` إعداد خادم MCP المُدار بواسطة OpenClaw ضمن `mcp.servers`. للمالك فقط. يتطلب `commands.mcp: true`.
    - يفحص أو يغيّر `/plugins list|inspect|show|get|install|enable|disable` حالة plugin. `/plugin` اسم مستعار. الكتابة للمالك فقط. يتطلب `commands.plugins: true`.
    - يدير `/debug show|set|unset|reset` تجاوزات الإعداد المخصّصة لوقت التشغيل فقط. للمالك فقط. يتطلب `commands.debug: true`.
    - يعيد `/restart` تشغيل OpenClaw عند تمكينه. الافتراضي: مُمكّن؛ عيّن `commands.restart: false` لتعطيله.
    - يعيّن `/send on|off|inherit` سياسة الإرسال. للمالك فقط.

  </Accordion>
  <Accordion title="الصوت، TTS، والتحكم في القنوات">
    - يتحكم `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` في TTS. راجع [TTS](/ar/tools/tts).
    - يعيّن `/activation mention|always` وضع تفعيل المجموعات.
    - يشغّل `/bash <command>` أمر shell على المضيف. نصي فقط. الاسم المستعار: `! <command>`. يتطلب `commands.bash: true` بالإضافة إلى قوائم السماح `tools.elevated`.
    - يتحقق `!poll [sessionId]` من مهمة bash في الخلفية.
    - يوقف `!stop [sessionId]` مهمة bash في الخلفية.

  </Accordion>
</AccordionGroup>

### أوامر الإرساء المُنشأة

تبدّل أوامر الإرساء مسار رد الجلسة الحالية إلى قناة مرتبطة أخرى. راجع [إرساء القنوات](/ar/concepts/channel-docking) للإعداد والأمثلة واستكشاف الأخطاء وإصلاحها.

تُنشأ أوامر الإرساء من plugins القنوات التي تدعم الأوامر الأصلية. المجموعة المضمّنة الحالية:

- `/dock-discord` (الاسم المستعار: `/dock_discord`)
- `/dock-mattermost` (الاسم المستعار: `/dock_mattermost`)
- `/dock-slack` (الاسم المستعار: `/dock_slack`)
- `/dock-telegram` (الاسم المستعار: `/dock_telegram`)

استخدم أوامر الإرساء من محادثة مباشرة لتبديل مسار رد الجلسة الحالية إلى قناة مرتبطة أخرى. يحتفظ الوكيل بسياق الجلسة نفسه، لكن الردود المستقبلية لتلك الجلسة تُسلّم إلى نظير القناة المحدد.

تتطلب أوامر الإرساء `session.identityLinks`. يجب أن يكون المرسل المصدر والنظير الهدف في مجموعة الهوية نفسها، مثل `["telegram:123", "discord:456"]`. إذا أرسل مستخدم Telegram بالمعرّف `123` الأمر `/dock_discord`، يخزّن OpenClaw القيمتين `lastChannel: "discord"` و`lastTo: "456"` في الجلسة النشطة. إذا لم يكن المرسل مرتبطًا بنظير Discord، يرد الأمر بتلميح إعداد بدلًا من المرور إلى المحادثة العادية.

يغيّر الإرساء مسار الجلسة النشطة فقط. لا ينشئ حسابات قنوات، ولا يمنح وصولًا، ولا يتجاوز قوائم سماح القنوات، ولا ينقل سجل النصوص إلى جلسة أخرى. استخدم `/dock-telegram` أو `/dock-slack` أو `/dock-mattermost` أو أمر إرساء مُنشأ آخر لتبديل المسار مرة أخرى.

### أوامر plugins المضمّنة

يمكن أن تضيف plugins المضمّنة مزيدًا من أوامر الشرطة المائلة. الأوامر المضمّنة الحالية في هذا المستودع:

- يبدّل `/dreaming [on|off|status|help]` Dreaming الذاكرة. راجع [Dreaming](/ar/concepts/dreaming).
- يدير `/pair [qr|status|pending|approve|cleanup|notify]` تدفق إقران/إعداد الجهاز. راجع [الإقران](/ar/channels/pairing).
- يسلّح `/phone status|arm <camera|screen|writes|all> [duration]|disarm` أوامر عقدة الهاتف عالية الخطورة مؤقتًا.
- يدير `/voice status|list [limit]|set <voiceId|name>` إعداد Talk الصوتي. على Discord، اسم الأمر الأصلي هو `/talkvoice`.
- يرسل `/card ...` إعدادات LINE المسبقة للبطاقات الغنية. راجع [LINE](/ar/channels/line).
- يفحص ويتحكم `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` في حزمة تطبيق الخادم Codex المضمّنة. راجع [حزمة Codex](/ar/plugins/codex-harness).
- أوامر QQBot فقط:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### أوامر Skills الديناميكية

تُعرَض Skills القابلة للاستدعاء من المستخدم أيضًا كأوامر شرطة مائلة:

- يعمل `/skill <name> [input]` دائمًا كنقطة دخول عامة.
- قد تظهر skills أيضًا كأوامر مباشرة مثل `/prose` عندما تسجلها skill/plugin.
- يتحكم `commands.nativeSkills` و`channels.<provider>.commands.nativeSkills` في تسجيل أوامر skills الأصلية.
- يمكن لمواصفات الأوامر توفير `descriptionLocalizations` للواجهات الأصلية التي تدعم الأوصاف المترجمة، بما في ذلك Discord.

<AccordionGroup>
  <Accordion title="ملاحظات الوسائط والمحلل">
    - تقبل الأوامر علامة `:` اختيارية بين الأمر والوسائط (مثل `/think: high`، و`/send: on`، و`/help:`).
    - يقبل `/new <model>` اسمًا مستعارًا للنموذج، أو `provider/model`، أو اسم موفّر (مطابقة تقريبية)؛ وإذا لم توجد مطابقة، يُعامل النص كمتن الرسالة.
    - للحصول على تفصيل كامل لاستخدام الموفّر، استخدم `openclaw status --usage`.
    - يتطلب `/allowlist add|remove` القيمة `commands.config=true` ويحترم `configWrites` الخاصة بالقناة.
    - في القنوات متعددة الحسابات، تحترم أيضًا أوامر `/allowlist --account <id>` المستهدفة للإعداد و`/config set channels.<provider>.accounts.<id>...` قيمة `configWrites` للحساب الهدف.
    - يتحكم `/usage` في تذييل الاستخدام لكل رد؛ ويطبع `/usage cost` ملخص تكلفة محليًا من سجلات جلسات OpenClaw.
    - يكون `/restart` مُمكّنًا افتراضيًا؛ عيّن `commands.restart: false` لتعطيله.
    - يقبل `/plugins install <spec>` مواصفات plugin نفسها التي يقبلها `openclaw plugins install`: مسار/أرشيف محلي، أو حزمة npm، أو `git:<repo>`، أو `clawhub:<pkg>`، ثم يطلب إعادة تشغيل Gateway لأن وحدات مصدر plugin تغيّرت.
    - يحدّث `/plugins enable|disable` إعداد plugin ويُشغّل إعادة تحميل Gateway plugins لجولات الوكيل الجديدة.

  </Accordion>
  <Accordion title="سلوك خاص بالقنوات">
    - أمر أصلي خاص بـ Discord: يتحكم `/vc join|leave|status` في قنوات الصوت (غير متاح كنص). يتطلب `join` نقابة وقناة صوت/مسرح محددة. يتطلب `channels.discord.voice` والأوامر الأصلية.
    - تتطلب أوامر ربط سلاسل Discord (`/focus`، و`/unfocus`، و`/agents`، و`/session idle`، و`/session max-age`) تمكين عمليات ربط السلاسل الفعالة (`session.threadBindings.enabled` و/أو `channels.discord.threadBindings.enabled`).
    - مرجع أوامر ACP وسلوك وقت التشغيل: [وكلاء ACP](/ar/tools/acp-agents).

  </Accordion>
  <Accordion title="السلامة في الإسهاب / التتبع / السرعة / الاستدلال">
    - صُمم `/verbose` للتصحيح والرؤية الإضافية؛ أبقه **متوقفًا** في الاستخدام العادي.
    - `/trace` أضيق من `/verbose`: فهو يكشف فقط أسطر التتبع/التصحيح المملوكة لـ plugin ويبقي ثرثرة الأدوات الإسهابية العادية متوقفة.
    - يحفظ `/fast on|off` تجاوزًا للجلسة. استخدم خيار `inherit` في واجهة الجلسات لمسحه والعودة إلى افتراضيات الإعداد.
    - `/fast` خاص بالموفّر: يعيّنه OpenAI/OpenAI Codex إلى `service_tier=priority` على نقاط نهاية Responses الأصلية، بينما تعيّنه طلبات Anthropic العامة المباشرة، بما في ذلك الحركة المصادق عليها عبر OAuth والمرسلة إلى `api.anthropic.com`، إلى `service_tier=auto` أو `standard_only`. راجع [OpenAI](/ar/providers/openai) و[Anthropic](/ar/providers/anthropic).
    - تظل ملخصات فشل الأدوات ظاهرة عند اللزوم، لكن نص الفشل المفصل لا يُضمّن إلا عندما يكون `/verbose` مضبوطًا على `on` أو `full`.
    - تُعد `/reasoning` و`/verbose` و`/trace` محفوفة بالمخاطر في إعدادات المجموعات: قد تكشف استدلالًا داخليًا، أو مخرجات أدوات، أو تشخيصات plugin لم تكن تقصد عرضها. يُفضّل إبقاؤها متوقفة، خصوصًا في محادثات المجموعات.

  </Accordion>
  <Accordion title="تبديل النموذج">
    - يحفظ `/model` نموذج الجلسة الجديد فورًا.
    - إذا كان الوكيل خاملًا، يستخدمه التشغيل التالي فورًا.
    - إذا كان هناك تشغيل نشط بالفعل، يعلّم OpenClaw التبديل المباشر كقيد الانتظار ولا يعيد التشغيل إلى النموذج الجديد إلا عند نقطة إعادة محاولة نظيفة.
    - إذا بدأ نشاط الأدوات أو مخرجات الرد بالفعل، يمكن أن يبقى التبديل المعلّق في قائمة الانتظار حتى فرصة إعادة محاولة لاحقة أو جولة المستخدم التالية.
    - في TUI المحلي، يعيد `/crestodian [request]` من TUI الوكيل العادي إلى Crestodian. هذا منفصل عن وضع إنقاذ قنوات الرسائل ولا يمنح صلاحية إعداد عن بُعد.

  </Accordion>
  <Accordion title="المسار السريع والاختصارات المضمّنة">
    - **المسار السريع:** تُعالَج الرسائل التي تحتوي أوامر فقط من المرسلين المدرجين في قائمة السماح فورًا (تجاوز قائمة الانتظار + النموذج).
    - **بوابة ذكر المجموعة:** تتجاوز الرسائل التي تحتوي أوامر فقط من المرسلين المدرجين في قائمة السماح متطلبات الذكر.
    - **الاختصارات المضمّنة (للمرسلين المدرجين في قائمة السماح فقط):** تعمل أوامر معينة أيضًا عند تضمينها في رسالة عادية وتُزال قبل أن يرى النموذج النص المتبقي.
      - مثال: يشغّل `hey /status` رد حالة، ويواصل النص المتبقي المرور عبر التدفق العادي.
    - حاليًا: `/help`، و`/commands`، و`/status`، و`/whoami` (`/id`).
    - تُتجاهل الرسائل غير المصرح بها التي تحتوي أوامر فقط بصمت، وتُعامل رموز `/...` المضمّنة كنص عادي.

  </Accordion>
  <Accordion title="أوامر Skills والوسائط الأصلية">
    - **أوامر Skills:** تُعرض Skills من نوع `user-invocable` كأوامر شرطة مائلة. تُنظّف الأسماء إلى `a-z0-9_` (بحد أقصى 32 حرفًا)؛ وتحصل التصادمات على لواحق رقمية (مثل `_2`).
      - يشغّل `/skill <name> [input]` Skill بالاسم (مفيد عندما تمنع حدود الأوامر الأصلية إنشاء أوامر لكل Skill).
      - افتراضيًا، تُمرّر أوامر Skills إلى النموذج كطلب عادي.
      - يمكن لـ Skills اختياريًا إعلان `command-dispatch: tool` لتوجيه الأمر مباشرة إلى أداة (حتمي، بلا نموذج).
      - مثال: `/prose` (OpenProse plugin) — راجع [OpenProse](/ar/prose).
    - **وسائط الأوامر الأصلية:** يستخدم Discord الإكمال التلقائي للخيارات الديناميكية (وقوائم الأزرار عند حذف الوسائط المطلوبة). يعرض Telegram وSlack قائمة أزرار عندما يدعم أمر ما اختيارات وتحذف الوسيطة. تُحلّ الاختيارات الديناميكية وفق نموذج الجلسة الهدف، لذلك تتبع الخيارات الخاصة بالنماذج، مثل مستويات `/think`، تجاوز `/model` لتلك الجلسة.

  </Accordion>
</AccordionGroup>

## `/tools`

يجيب `/tools` عن سؤال وقت تشغيل، لا عن سؤال إعداد: **ما الذي يمكن لهذا الوكيل استخدامه الآن في هذه المحادثة**.

- يكون `/tools` الافتراضي مضغوطًا ومحسّنًا للفحص السريع.
- يضيف `/tools verbose` أوصافًا قصيرة.
- تعرض واجهات الأوامر الأصلية التي تدعم الوسائط مفتاح الوضع نفسه مثل `compact|verbose`.
- النتائج محددة بنطاق الجلسة، لذلك يمكن أن يؤدي تغيير الوكيل أو القناة أو السلسلة أو تخويل المرسل أو النموذج إلى تغيير المخرجات.
- يتضمن `/tools` الأدوات التي يمكن الوصول إليها فعليًا وقت التشغيل، بما في ذلك أدوات النواة، وأدوات plugins المتصلة، والأدوات المملوكة للقنوات.

لتحرير الملف الشخصي والتجاوزات، استخدم لوحة أدوات واجهة التحكم أو واجهات الإعداد/الفهرس بدلًا من التعامل مع `/tools` كفهرس ثابت.

## واجهات الاستخدام (ما يظهر أين)

- تظهر **استخدام/حصة المزوّد** (مثال: "Claude 80% متبقٍ") في `/status` لمزوّد النموذج الحالي عند تفعيل تتبّع الاستخدام. يطبّع OpenClaw نوافذ المزوّدين إلى `% left`؛ وبالنسبة إلى MiniMax، تُعكس حقول النسبة المئوية التي تعبّر عن المتبقّي فقط قبل العرض، وتفضّل استجابات `model_remains` إدخال نموذج الدردشة مع تسمية خطة موسومة بالنموذج.
- يمكن أن تتراجع **أسطر الرموز/التخزين المؤقت** في `/status` إلى أحدث إدخال استخدام في النص المنسوخ عندما تكون لقطة الجلسة الحية محدودة. تظل القيم الحية غير الصفرية الموجودة هي المعتمدة، ويمكن للتراجع إلى النص المنسوخ أيضًا استعادة تسمية نموذج وقت التشغيل النشط مع إجمالي أكبر موجّه للمطالبة عندما تكون الإجماليات المخزّنة مفقودة أو أصغر.
- **التنفيذ مقابل وقت التشغيل:** يعرض `/status` قيمة `Execution` لمسار sandbox الفعّال و`Runtime` لمن يشغّل الجلسة فعليًا: `OpenClaw Pi Default`، أو `OpenAI Codex`، أو خلفية CLI، أو خلفية ACP.
- تتحكم `/usage off|tokens|full` في **الرموز/التكلفة لكل استجابة** (تُضاف إلى الردود العادية).
- يتعلق `/model status` بـ **النماذج/المصادقة/نقاط النهاية**، وليس الاستخدام.

## اختيار النموذج (`/model`)

يُنفّذ `/model` كتوجيه.

أمثلة:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

ملاحظات:

- يعرض `/model` و`/model list` منتقيًا مرقمًا وموجزًا (عائلة النموذج + المزوّدون المتاحون).
- على Discord، يفتح `/model` و`/models` منتقيًا تفاعليًا يتضمن قوائم منسدلة للمزوّد والنموذج، إضافة إلى خطوة Submit. يحترم المنتقي `agents.defaults.models`، بما في ذلك إدخالات `provider/*`، لذلك يمكن للاكتشاف المحدد بنطاق المزوّد إبقاء المنتقي دون حد مكوّنات Discord البالغ 25 خيارًا.
- يختار `/model <#>` من ذلك المنتقي (ويفضّل المزوّد الحالي عندما يكون ذلك ممكنًا).
- يعرض `/model status` العرض التفصيلي، بما في ذلك نقطة نهاية المزوّد المضبوطة (`baseUrl`) ووضع API (`api`) عند توفرهما.

## تجاوزات التصحيح

يتيح لك `/debug` ضبط تجاوزات إعداد **وقت التشغيل فقط** (في الذاكرة، وليس على القرص). للمالك فقط. معطّل افتراضيًا؛ فعّله باستخدام `commands.debug: true`.

أمثلة:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
تُطبّق التجاوزات فورًا على قراءات الإعداد الجديدة، لكنها لا تكتب إلى `openclaw.json`. استخدم `/debug reset` لمسح كل التجاوزات والعودة إلى الإعداد الموجود على القرص.
</Note>

## مخرجات تتبّع Plugin

يتيح لك `/trace` تبديل **أسطر تتبّع/تصحيح Plugin المحددة بنطاق الجلسة** دون تشغيل وضع الإسهاب الكامل.

أمثلة:

```text
/trace
/trace on
/trace off
```

ملاحظات:

- يعرض `/trace` من دون وسيطة حالة تتبّع الجلسة الحالية.
- يفعّل `/trace on` أسطر تتبّع Plugin للجلسة الحالية.
- يعطّلها `/trace off` مرة أخرى.
- يمكن أن تظهر أسطر تتبّع Plugin في `/status` وكـرسالة تشخيص لاحقة بعد رد المساعد العادي.
- لا يستبدل `/trace` الأمر `/debug`؛ فما يزال `/debug` يدير تجاوزات إعداد وقت التشغيل فقط.
- لا يستبدل `/trace` الأمر `/verbose`؛ فما تزال مخرجات الأداة/الحالة العادية المفصّلة تابعة لـ `/verbose`.

## تحديثات الإعداد

يكتب `/config` إلى إعدادك الموجود على القرص (`openclaw.json`). للمالك فقط. معطّل افتراضيًا؛ فعّله باستخدام `commands.config: true`.

أمثلة:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
يُتحقق من صحة الإعداد قبل الكتابة؛ وتُرفض التغييرات غير الصالحة. تستمر تحديثات `/config` عبر عمليات إعادة التشغيل.
</Note>

## تحديثات MCP

يكتب `/mcp` تعريفات خوادم MCP التي يديرها OpenClaw ضمن `mcp.servers`. للمالك فقط. معطّل افتراضيًا؛ فعّله باستخدام `commands.mcp: true`.

أمثلة:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
يخزّن `/mcp` الإعداد في إعداد OpenClaw، وليس في إعدادات المشروع المملوكة لـ Pi. تحدد محوّلات وقت التشغيل وسائل النقل القابلة للتنفيذ فعليًا.
</Note>

## تحديثات Plugin

يتيح `/plugins` للمشغّلين فحص plugins المكتشفة وتبديل تفعيلها في الإعداد. يمكن لتدفقات القراءة فقط استخدام `/plugin` كاسم بديل. معطّل افتراضيًا؛ فعّله باستخدام `commands.plugins: true`.

أمثلة:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- يستخدم `/plugins list` و`/plugins show` اكتشاف Plugin حقيقيًا مقابل مساحة العمل الحالية مع الإعداد الموجود على القرص.
- يثبّت `/plugins install` من ClawHub، وnpm، وgit، والأدلة المحلية، والأرشيفات.
- يحدّث `/plugins enable|disable` إعداد Plugin فقط؛ ولا يثبّت plugins أو يلغي تثبيتها.
- تؤدي تغييرات التفعيل والتعطيل إلى إعادة تحميل أسطح وقت تشغيل Plugin في Gateway دون انقطاع لجولات الوكيل الجديدة؛ أما التثبيت فيطلب إعادة تشغيل Gateway لأن وحدات مصدر Plugin تغيّرت.

</Note>

## ملاحظات الأسطح

<AccordionGroup>
  <Accordion title="Sessions per surface">
    - تعمل **الأوامر النصية** في جلسة الدردشة العادية (تشارك الرسائل المباشرة `main`، وللمجموعات جلستها الخاصة).
    - تستخدم **الأوامر الأصلية** جلسات معزولة:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (البادئة قابلة للضبط عبر `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (تستهدف جلسة الدردشة عبر `CommandTargetSessionKey`)
    - يستهدف **`/stop`** جلسة الدردشة النشطة حتى يتمكن من إيقاف التشغيل الحالي.

  </Accordion>
  <Accordion title="Slack specifics">
    ما يزال `channels.slack.slashCommand` مدعومًا لأمر واحد بنمط `/openclaw`. إذا فعّلت `commands.native`، فيجب عليك إنشاء أمر slash واحد في Slack لكل أمر مضمّن (بالأسماء نفسها مثل `/help`). تُسلَّم قوائم وسيطات الأوامر في Slack كأزرار Block Kit عابرة.

    استثناء Slack الأصلي: سجّل `/agentstatus` (وليس `/status`) لأن Slack يحجز `/status`. ما يزال نص `/status` يعمل في رسائل Slack.

  </Accordion>
</AccordionGroup>

## أسئلة جانبية BTW

`/btw` هو **سؤال جانبي** سريع عن الجلسة الحالية. `/side` اسم بديل.

على خلاف الدردشة العادية:

- يستخدم الجلسة الحالية كسياق خلفية،
- يعمل كاستدعاء منفصل **بلا أدوات** ولمرة واحدة،
- لا يغيّر سياق الجلسة المستقبلي،
- لا يُكتب إلى سجل النص المنسوخ،
- يُسلَّم كنتيجة جانبية حية بدلًا من رسالة مساعد عادية.

هذا يجعل `/btw` مفيدًا عندما تريد توضيحًا مؤقتًا بينما تستمر المهمة الرئيسية.

مثال:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

راجع [أسئلة BTW الجانبية](/ar/tools/btw) لمعرفة السلوك الكامل وتفاصيل تجربة العميل.

## ذو صلة

- [إنشاء Skills](/ar/tools/creating-skills)
- [Skills](/ar/tools/skills)
- [إعداد Skills](/ar/tools/skills-config)

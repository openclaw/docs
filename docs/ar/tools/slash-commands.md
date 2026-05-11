---
read_when:
    - استخدام أو تكوين أوامر الدردشة
    - تصحيح أخطاء توجيه الأوامر أو الأذونات
sidebarTitle: Slash commands
summary: 'الأوامر المسبوقة بشرطة مائلة: النصية مقابل الأصلية، والإعدادات، والأوامر المدعومة'
title: أوامر الشرطة المائلة
x-i18n:
    generated_at: "2026-05-11T20:44:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a9030d88abd04c395369f8f6587632b53f3249ea95a26726fb1f165dae2d0f6
    source_path: tools/slash-commands.md
    workflow: 16
---

تتولى Gateway معالجة الأوامر. يجب إرسال معظم الأوامر كرسالة **مستقلة** تبدأ بـ `/`. يستخدم أمر دردشة bash الخاص بالمضيف فقط `! <cmd>` (مع `/bash <cmd>` كاسم بديل).

عندما تكون محادثة أو سلسلة مرتبطة بجلسة ACP، يتم توجيه نص المتابعة العادي إلى حاضنة ACP تلك. تبقى أوامر إدارة Gateway محلية: يصل `/acp ...` دائمًا إلى معالج أوامر ACP في OpenClaw، ويبقى `/status` و`/unfocus` محليين كلما كانت معالجة الأوامر مفعلة للسطح.

هناك نظامان مترابطان:

<AccordionGroup>
  <Accordion title="الأوامر">
    رسائل `/...` المستقلة.
  </Accordion>
  <Accordion title="التوجيهات">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - تُزال التوجيهات من الرسالة قبل أن يراها النموذج.
    - في رسائل الدردشة العادية (وليست المخصصة للتوجيهات فقط)، تُعامل كـ "تلميحات ضمنية" ولا تحفظ إعدادات الجلسة.
    - في الرسائل المخصصة للتوجيهات فقط (عندما تحتوي الرسالة على توجيهات فقط)، تحفظ في الجلسة وترد بإقرار.
    - لا تُطبق التوجيهات إلا على **المرسلين المخولين**. إذا تم ضبط `commands.allowFrom`، فهي قائمة السماح الوحيدة المستخدمة؛ وإلا يأتي التخويل من قوائم السماح/الإقران الخاصة بالقناة بالإضافة إلى `commands.useAccessGroups`. يرى المرسلون غير المخولين التوجيهات كنص عادي.

  </Accordion>
  <Accordion title="الاختصارات المضمنة">
    للمرسلين الموجودين في قائمة السماح/المخولين فقط: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    تعمل فورًا، وتُزال قبل أن يرى النموذج الرسالة، ويستمر النص المتبقي عبر التدفق العادي.

  </Accordion>
</AccordionGroup>

## الإعدادات

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
  يفعّل تحليل `/...` في رسائل الدردشة. على الأسطح التي لا تحتوي على أوامر أصلية (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams)، تظل الأوامر النصية تعمل حتى إذا ضبطت هذا على `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  يسجل الأوامر الأصلية. تلقائي: مفعّل لـ Discord/Telegram؛ معطّل لـ Slack (إلى أن تضيف أوامر slash)؛ يتم تجاهله لموفري الخدمة الذين لا يدعمون الأوامر الأصلية. اضبط `channels.discord.commands.native` أو `channels.telegram.commands.native` أو `channels.slack.commands.native` للتجاوز حسب الموفر (bool أو `"auto"`). في Discord، يتخطى `false` تسجيل أوامر slash وتنظيفها أثناء بدء التشغيل؛ قد تظل الأوامر المسجلة سابقًا مرئية حتى تزيلها من تطبيق Discord. تُدار أوامر Slack في تطبيق Slack ولا تُزال تلقائيًا.
</ParamField>
في Discord، قد تتضمن مواصفات الأوامر الأصلية `descriptionLocalizations`، والتي ينشرها OpenClaw كـ Discord `description_localizations` ويدرجها في مقارنات المطابقة.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  يسجل أوامر **Skills** بشكل أصلي عند دعمها. تلقائي: مفعّل لـ Discord/Telegram؛ معطّل لـ Slack (يتطلب Slack إنشاء أمر slash لكل Skill). اضبط `channels.discord.commands.nativeSkills` أو `channels.telegram.commands.nativeSkills` أو `channels.slack.commands.nativeSkills` للتجاوز حسب الموفر (bool أو `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  يفعّل `! <cmd>` لتشغيل أوامر صدفة المضيف (`/bash <cmd>` اسم بديل؛ يتطلب قوائم سماح `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  يتحكم في مدة انتظار bash قبل التحول إلى وضع الخلفية (`0` ينقله إلى الخلفية فورًا).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  يفعّل `/config` (يقرأ/يكتب `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  يفعّل `/mcp` (يقرأ/يكتب إعداد MCP الذي يديره OpenClaw ضمن `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  يفعّل `/plugins` (اكتشاف/حالة Plugins بالإضافة إلى عناصر تحكم التثبيت والتفعيل/التعطيل).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  يفعّل `/debug` (تجاوزات وقت التشغيل فقط).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  يفعّل `/restart` بالإضافة إلى إجراءات أداة إعادة تشغيل Gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  يضبط قائمة سماح المالك الصريحة لأسطح الأوامر/الأدوات الخاصة بالمالك فقط. هذا هو حساب المشغل البشري الذي يمكنه الموافقة على الإجراءات الخطرة وتشغيل أوامر مثل `/diagnostics` و`/export-trajectory` و`/config`. وهو منفصل عن `commands.allowFrom` وعن وصول إقران الرسائل المباشرة.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  لكل قناة: يجعل الأوامر الخاصة بالمالك فقط تتطلب **هوية المالك** لتشغيلها على ذلك السطح. عندما تكون `true`، يجب أن يطابق المرسل إما مرشح مالك محلولًا (مثل إدخال في `commands.ownerAllowFrom` أو بيانات تعريف مالك أصلية للموفر) أو يمتلك نطاق `operator.admin` الداخلي على قناة رسائل داخلية. لا يكفي إدخال wildcard في `allowFrom` الخاصة بالقناة، أو قائمة مرشحي مالك فارغة/غير محلولة — تفشل الأوامر الخاصة بالمالك فقط مغلقة على تلك القناة. اترك هذا معطلًا إذا كنت تريد حراسة الأوامر الخاصة بالمالك فقط عبر `ownerAllowFrom` وقوائم السماح القياسية للأوامر.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  يتحكم في كيفية ظهور معرفات المالك في مطالبة النظام.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  يضبط اختياريًا سر HMAC المستخدم عندما يكون `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  قائمة سماح لكل موفر لتخويل الأوامر. عند إعدادها، تكون مصدر التخويل الوحيد للأوامر والتوجيهات (يتم تجاهل قوائم السماح/الإقران الخاصة بالقناة و`commands.useAccessGroups`). استخدم `"*"` كإعداد افتراضي عام؛ وتتجاوزه المفاتيح الخاصة بالموفر.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  يفرض قوائم السماح/السياسات للأوامر عندما لا يتم ضبط `commands.allowFrom`.
</ParamField>

## قائمة الأوامر

مصدر الحقيقة الحالي:

- تأتي الأوامر المدمجة الأساسية من `src/auto-reply/commands-registry.shared.ts`
- تأتي أوامر dock المولدة من `src/auto-reply/commands-registry.data.ts`
- تأتي أوامر Plugin من استدعاءات `registerCommand()` الخاصة بـ Plugin
- لا يزال التوفر الفعلي على Gateway لديك يعتمد على أعلام الإعداد، وسطح القناة، وPlugins المثبتة/المفعلة

### الأوامر الأساسية المدمجة

<AccordionGroup>
  <Accordion title="الجلسات والتشغيلات">
    - يبدأ `/new [model]` جلسة جديدة؛ و`/reset` هو اسم إعادة الضبط البديل.
    - تعترض واجهة التحكم المكتوب `/new` لإنشاء جلسة لوحة معلومات جديدة والتبديل إليها، إلا عندما يتم إعداد `session.dmScope: "main"` ويكون الأصل الحالي هو الجلسة الرئيسية للوكيل؛ في تلك الحالة يعيد `/new` ضبط الجلسة الرئيسية في مكانها. يظل `/reset` المكتوب يشغل إعادة الضبط في مكانها الخاصة بـ Gateway.
    - يحافظ `/reset soft [message]` على النص الحالي، ويسقط معرفات جلسات الواجهة الخلفية CLI المعاد استخدامها، ويعيد تشغيل تحميل بدء التشغيل/مطالبة النظام في المكان نفسه.
    - يضغط `/compact [instructions]` سياق الجلسة. راجع [Compaction](/ar/concepts/compaction).
    - يوقف `/stop` التشغيل الحالي.
    - يدير `/session idle <duration|off>` و`/session max-age <duration|off>` انتهاء صلاحية ربط السلسلة.
    - يصدر `/export-session [path]` الجلسة الحالية إلى HTML. الاسم البديل: `/export`.
    - يطلب `/export-trajectory [path]` موافقة exec، ثم يصدر [حزمة trajectory](/ar/tools/trajectory) بصيغة JSONL للجلسة الحالية. استخدمه عندما تحتاج إلى المخطط الزمني للمطالبة والأداة والنص لجلسة OpenClaw واحدة. في الدردشات الجماعية، يذهب طلب الموافقة ونتيجة التصدير إلى المالك بشكل خاص. الاسم البديل: `/trajectory`.

  </Accordion>
  <Accordion title="عناصر تحكم النموذج والتشغيل">
    - يضبط `/think <level|default>` مستوى التفكير أو يمسح تجاوز الجلسة. تأتي الخيارات من ملف تعريف موفر النموذج النشط؛ المستويات الشائعة هي `off` و`minimal` و`low` و`medium` و`high`، مع مستويات مخصصة مثل `xhigh` أو `adaptive` أو `max` أو القيمة الثنائية `on` فقط حيث تكون مدعومة. الأسماء البديلة: `/thinking`, `/t`.
    - يبدل `/verbose on|off|full` الإخراج المطول. الاسم البديل: `/v`.
    - يبدل `/trace on|off` إخراج تتبع Plugin للجلسة الحالية.
    - يعرض `/fast [status|on|off|default]` الوضع السريع أو يضبطه أو يمسحه.
    - يبدل `/reasoning [on|off|stream]` رؤية الاستدلال. الاسم البديل: `/reason`.
    - يبدل `/elevated [on|off|ask|full]` الوضع المرتفع. الاسم البديل: `/elev`.
    - يعرض `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` افتراضيات exec أو يضبطها.
    - يعرض `/model [name|#|status]` النموذج أو يضبطه.
    - يعرض `/models [provider] [page] [limit=<n>|size=<n>|all]` الموفرين المعدين/المتاحين بالمصادقة أو النماذج لموفر؛ أضف `all` لتصفح الفهرس الكامل لذلك الموفر. تجعل إدخالات `provider/*` في `agents.defaults.models` الأمرين `/model` و`/models` يعرضان النماذج المكتشفة لهؤلاء الموفرين فقط.
    - يدير `/queue <mode>` سلوك الطابور (`steer`، و`queue` القديم، و`followup`، و`collect`، و`steer-backlog`، و`interrupt`) بالإضافة إلى خيارات مثل `debounce:0.5s cap:25 drop:summarize`؛ يمسح `/queue default` أو `/queue reset` تجاوز الجلسة. راجع [طابور الأوامر](/ar/concepts/queue) و[طابور التوجيه](/ar/concepts/queue-steering).
    - يحقن `/steer <message>` إرشادًا في التشغيل النشط للجلسة الحالية، بشكل مستقل عن وضع `/queue`. لا يبدأ تشغيلًا جديدًا عندما تكون الجلسة خاملة. الاسم البديل: `/tell`. راجع [التوجيه](/ar/tools/steer).

  </Accordion>
  <Accordion title="الاكتشاف والحالة">
    - يعرض `/help` ملخص المساعدة القصير.
    - يعرض `/commands` فهرس الأوامر المولد.
    - يعرض `/tools [compact|verbose]` ما يستطيع الوكيل الحالي استخدامه الآن.
    - يعرض `/status` حالة التنفيذ/وقت التشغيل، ومدة تشغيل Gateway والنظام، بالإضافة إلى استخدام/حصة الموفر عند توفرها.
    - `/diagnostics [note]` هو تدفق تقرير الدعم الخاص بالمالك فقط لأخطاء Gateway وتشغيلات حاضنة Codex. يطلب موافقة exec صريحة في كل مرة قبل تشغيل `openclaw gateway diagnostics export --json`؛ لا توافق على التشخيصات بقاعدة سماح كاملة. بعد الموافقة، يرسل تقريرًا قابلًا للصق يحتوي على مسار الحزمة المحلي، وملخص البيان، وملاحظات الخصوصية، ومعرفات الجلسات ذات الصلة. في الدردشات الجماعية، يذهب طلب الموافقة والتقرير إلى المالك بشكل خاص. عندما تستخدم الجلسة النشطة حاضنة OpenAI Codex، ترسل الموافقة نفسها أيضًا ملاحظات Codex ذات الصلة إلى خوادم OpenAI، وتسرد الاستجابة المكتملة معرفات جلسات OpenClaw، ومعرفات سلاسل Codex، وأوامر `codex resume <thread-id>`. راجع [تصدير التشخيصات](/ar/gateway/diagnostics).
    - يشغل `/crestodian <request>` مساعد إعداد وإصلاح Crestodian من رسالة مباشرة للمالك.
    - يعرض `/tasks` المهام الخلفية النشطة/الأخيرة للجلسة الحالية.
    - يشرح `/context [list|detail|map|json]` كيفية تجميع السياق. يرسل `map` صورة خريطة شجرية لسياق الجلسة الحالية.
    - يعرض `/whoami` معرف المرسل الخاص بك. الاسم البديل: `/id`.
    - يتحكم `/usage off|tokens|full|cost` في تذييل الاستخدام لكل استجابة أو يطبع ملخص تكلفة محلي.

  </Accordion>
  <Accordion title="Skills, allowlists, approvals">
    - يشغّل `/skill <name> [input]` Skill حسب الاسم.
    - يدير `/allowlist [list|add|remove] ...` إدخالات قائمة السماح. نص فقط.
    - يحلّ `/approve <id> <decision>` مطالبات موافقة التنفيذ.
    - يطرح `/btw <question>` سؤالاً جانبياً دون تغيير سياق الجلسة المستقبلي. الاسم البديل: `/side`. راجع [BTW](/ar/tools/btw).

  </Accordion>
  <Accordion title="Subagents and ACP">
    - يدير `/subagents list|kill|log|info|send|steer|spawn` تشغيلات الوكلاء الفرعيين للجلسة الحالية.
    - يدير `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` جلسات ACP وخيارات وقت التشغيل.
    - يربط `/focus <target>` سلسلة Discord الحالية أو موضوع/محادثة Telegram بهدف جلسة.
    - يزيل `/unfocus` الربط الحالي.
    - يعرض `/agents` الوكلاء المرتبطين بالسلسلة للجلسة الحالية.
    - يوقف `/kill <id|#|all>` وكيلاً فرعياً واحداً أو جميع الوكلاء الفرعيين قيد التشغيل.
    - يرسل `/subagents steer <id|#> <message>` توجيهاً إلى وكيل فرعي قيد التشغيل. راجع [Steer](/ar/tools/steer).

  </Accordion>
  <Accordion title="Owner-only writes and admin">
    - يقرأ `/config show|get|set|unset` أو يكتب `openclaw.json`. للمالك فقط. يتطلب `commands.config: true`.
    - يقرأ `/mcp show|get|set|unset` أو يكتب إعداد خادم MCP المدار بواسطة OpenClaw ضمن `mcp.servers`. للمالك فقط. يتطلب `commands.mcp: true`.
    - يفحص `/plugins list|inspect|show|get|install|enable|disable` حالة Plugin أو يغيّرها. `/plugin` اسم بديل. الكتابة للمالك فقط. يتطلب `commands.plugins: true`.
    - يدير `/debug show|set|unset|reset` تجاوزات الإعداد الخاصة بوقت التشغيل فقط. للمالك فقط. يتطلب `commands.debug: true`.
    - يعيد `/restart` تشغيل OpenClaw عند التفعيل. الافتراضي: مفعّل؛ عيّن `commands.restart: false` لتعطيله.
    - يعيّن `/send on|off|inherit` سياسة الإرسال. للمالك فقط.

  </Accordion>
  <Accordion title="Voice, TTS, channel control">
    - يتحكم `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` في TTS. راجع [TTS](/ar/tools/tts).
    - يعيّن `/activation mention|always` وضع تفعيل المجموعة.
    - يشغّل `/bash <command>` أمر صدفة على المضيف. نص فقط. الاسم البديل: `! <command>`. يتطلب `commands.bash: true` إضافةً إلى قوائم سماح `tools.elevated`.
    - يتحقق `!poll [sessionId]` من مهمة bash في الخلفية.
    - يوقف `!stop [sessionId]` مهمة bash في الخلفية.

  </Accordion>
</AccordionGroup>

### أوامر الإرساء المولّدة

تبدّل أوامر الإرساء مسار رد الجلسة الحالية إلى قناة مرتبطة أخرى.
راجع [إرساء القنوات](/ar/concepts/channel-docking) للإعداد،
والأمثلة، واستكشاف الأخطاء وإصلاحها.

تُولَّد أوامر الإرساء من Plugins القنوات التي تدعم الأوامر الأصلية. المجموعة المضمّنة الحالية:

- `/dock-discord` (الاسم البديل: `/dock_discord`)
- `/dock-mattermost` (الاسم البديل: `/dock_mattermost`)
- `/dock-slack` (الاسم البديل: `/dock_slack`)
- `/dock-telegram` (الاسم البديل: `/dock_telegram`)

استخدم أوامر الإرساء من دردشة مباشرة لتبديل مسار رد الجلسة الحالية إلى قناة مرتبطة أخرى. يحتفظ الوكيل بسياق الجلسة نفسه، لكن الردود المستقبلية لتلك الجلسة تُسلَّم إلى نظير القناة المحدد.

تتطلب أوامر الإرساء `session.identityLinks`. يجب أن يكون المرسل المصدر والنظير الهدف في مجموعة الهوية نفسها، مثلاً `["telegram:123", "discord:456"]`. إذا أرسل مستخدم Telegram بالمعرّف `123` الأمر `/dock_discord`، يخزّن OpenClaw القيمتين `lastChannel: "discord"` و`lastTo: "456"` في الجلسة النشطة. إذا لم يكن المرسل مرتبطاً بنظير Discord، يرد الأمر بتلميح إعداد بدلاً من الانتقال إلى الدردشة العادية.

يغيّر الإرساء مسار الجلسة النشطة فقط. لا ينشئ حسابات قنوات، ولا يمنح وصولاً، ولا يتجاوز قوائم سماح القنوات، ولا ينقل سجل المحادثة إلى جلسة أخرى. استخدم `/dock-telegram` أو `/dock-slack` أو `/dock-mattermost` أو أمر إرساء مولّد آخر لتبديل المسار مرة أخرى.

### أوامر Plugins المضمّنة

يمكن لـ Plugins المضمّنة إضافة المزيد من أوامر الشرطة المائلة. الأوامر المضمّنة الحالية في هذا المستودع:

- يبدّل `/dreaming [on|off|status|help]` Dreaming الذاكرة. راجع [Dreaming](/ar/concepts/dreaming).
- يدير `/pair [qr|status|pending|approve|cleanup|notify]` تدفق إقران/إعداد الجهاز. راجع [الإقران](/ar/channels/pairing).
- يسلّح `/phone status|arm <camera|screen|writes|all> [duration]|disarm` مؤقتاً أوامر عقدة الهاتف عالية المخاطر.
- يدير `/voice status|list [limit]|set <voiceId|name>` إعداد صوت Talk. في Discord، اسم الأمر الأصلي هو `/talkvoice`.
- يرسل `/card ...` إعدادات بطاقات LINE الغنية المسبقة. راجع [LINE](/ar/channels/line).
- يفحص `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` ويتحكم في حزام خادم التطبيق Codex المضمّن. راجع [حزام Codex](/ar/plugins/codex-harness).
- أوامر خاصة بـ QQBot فقط:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### أوامر Skills الديناميكية

تُعرَض Skills القابلة للاستدعاء من المستخدم أيضاً كأوامر شرطة مائلة:

- يعمل `/skill <name> [input]` دائماً كنقطة دخول عامة.
- قد تظهر Skills أيضاً كأوامر مباشرة مثل `/prose` عندما تسجلها Skill/Plugin.
- يتحكم `commands.nativeSkills` و`channels.<provider>.commands.nativeSkills` في تسجيل أوامر Skills الأصلية.
- يمكن لمواصفات الأوامر توفير `descriptionLocalizations` للواجهات الأصلية التي تدعم الأوصاف المحلية، بما في ذلك Discord.

<AccordionGroup>
  <Accordion title="Argument and parser notes">
    - تقبل الأوامر الرمز `:` اختيارياً بين الأمر والوسائط (مثلاً `/think: high`، و`/send: on`، و`/help:`).
    - يقبل `/new <model>` اسماً بديلاً للنموذج، أو `provider/model`، أو اسم مزوّد (مطابقة تقريبية)؛ وإذا لم توجد مطابقة، يُعامَل النص على أنه نص الرسالة.
    - للحصول على تفصيل كامل لاستخدام المزوّد، استخدم `openclaw status --usage`.
    - يتطلب `/allowlist add|remove` وجود `commands.config=true` ويحترم `configWrites` الخاصة بالقناة.
    - في القنوات متعددة الحسابات، تحترم أيضاً أوامر `/allowlist --account <id>` الموجّهة للإعداد و`/config set channels.<provider>.accounts.<id>...` قيمة `configWrites` الخاصة بالحساب الهدف.
    - يتحكم `/usage` في تذييل الاستخدام لكل رد؛ ويطبع `/usage cost` ملخص تكلفة محلياً من سجلات جلسات OpenClaw.
    - يكون `/restart` مفعّلاً افتراضياً؛ عيّن `commands.restart: false` لتعطيله.
    - يقبل `/plugins install <spec>` مواصفات Plugin نفسها مثل `openclaw plugins install`: مسار/أرشيف محلي، أو حزمة npm، أو `git:<repo>`، أو `clawhub:<pkg>`، ثم يطلب إعادة تشغيل Gateway لأن وحدات مصدر Plugin تغيّرت.
    - يحدّث `/plugins enable|disable` إعداد Plugin ويشغّل إعادة تحميل Plugins في Gateway لدورات الوكيل الجديدة.

  </Accordion>
  <Accordion title="Channel-specific behavior">
    - أمر أصلي خاص بـ Discord فقط: يتحكم `/vc join|leave|status` في قنوات الصوت (غير متاح كنص). يتطلب `join` خادماً وقناة صوت/مسرح محددة. يتطلب `channels.discord.voice` والأوامر الأصلية.
    - تتطلب أوامر ربط سلاسل Discord (`/focus`، و`/unfocus`، و`/agents`، و`/session idle`، و`/session max-age`) تفعيل روابط السلاسل الفعالة (`session.threadBindings.enabled` و/أو `channels.discord.threadBindings.enabled`).
    - مرجع أوامر ACP وسلوك وقت التشغيل: [وكلاء ACP](/ar/tools/acp-agents).

  </Accordion>
  <Accordion title="Verbose / trace / fast / reasoning safety">
    - الغرض من `/verbose` هو التصحيح وزيادة الرؤية؛ أبقه **متوقفاً** في الاستخدام العادي.
    - `/trace` أضيق من `/verbose`: فهو يكشف فقط أسطر التتبع/التصحيح المملوكة لـ Plugin ويُبقي ضجيج الأدوات المطوّل العادي متوقفاً.
    - يحفظ `/fast on|off` تجاوزاً للجلسة. استخدم خيار `inherit` في واجهة Sessions لمسحه والرجوع إلى افتراضيات الإعداد.
    - `/fast` خاص بالمزوّد: يربطه OpenAI/OpenAI Codex بالقيمة `service_tier=priority` على نقاط نهاية Responses الأصلية، بينما تربطه طلبات Anthropic العامة المباشرة، بما في ذلك حركة المرور الموثقة عبر OAuth المرسلة إلى `api.anthropic.com`، بالقيمة `service_tier=auto` أو `standard_only`. راجع [OpenAI](/ar/providers/openai) و[Anthropic](/ar/providers/anthropic).
    - تظل ملخصات فشل الأدوات ظاهرة عند الحاجة، لكن نص الفشل المفصل لا يُضمَّن إلا عندما يكون `/verbose` مضبوطاً على `on` أو `full`.
    - تُعد `/reasoning` و`/verbose` و`/trace` خطرة في إعدادات المجموعات: فقد تكشف استدلالاً داخلياً أو مخرجات أدوات أو تشخيصات Plugin لم تكن تنوي كشفها. يُفضّل تركها متوقفة، خصوصاً في دردشات المجموعات.

  </Accordion>
  <Accordion title="Model switching">
    - يحفظ `/model` نموذج الجلسة الجديد فوراً.
    - إذا كان الوكيل خاملاً، يستخدمه التشغيل التالي مباشرة.
    - إذا كان تشغيل نشطاً بالفعل، يعلّم OpenClaw التبديل الحي على أنه معلّق ولا يعيد التشغيل بالنموذج الجديد إلا عند نقطة إعادة محاولة نظيفة.
    - إذا كان نشاط الأدوات أو إخراج الرد قد بدأ بالفعل، فقد يبقى التبديل المعلّق في قائمة الانتظار حتى فرصة إعادة محاولة لاحقة أو دورة المستخدم التالية.
    - في TUI المحلية، يعيد `/crestodian [request]` من TUI الوكيل العادية إلى Crestodian. هذا منفصل عن وضع إنقاذ قناة الرسائل ولا يمنح صلاحية إعداد عن بُعد.

  </Accordion>
  <Accordion title="Fast path and inline shortcuts">
    - **المسار السريع:** تُعالَج الرسائل التي تحتوي على أوامر فقط من المرسلين الموجودين في قائمة السماح فوراً (تتجاوز الطابور + النموذج).
    - **بوابة ذكر المجموعة:** تتجاوز الرسائل التي تحتوي على أوامر فقط من المرسلين الموجودين في قائمة السماح متطلبات الذكر.
    - **اختصارات مضمنة (للمرسلين الموجودين في قائمة السماح فقط):** تعمل بعض الأوامر أيضاً عندما تكون مضمّنة في رسالة عادية وتُزال قبل أن يرى النموذج النص المتبقي.
      - مثال: يشغّل `hey /status` رداً بالحالة، ويستمر النص المتبقي عبر التدفق العادي.
    - حالياً: `/help`، و`/commands`، و`/status`، و`/whoami` (`/id`).
    - تُتجاهَل الرسائل غير المصرح بها التي تحتوي على أوامر فقط بصمت، وتُعامَل رموز `/...` المضمّنة كنص عادي.

  </Accordion>
  <Accordion title="Skill commands and native arguments">
    - **أوامر Skills:** تُعرَض Skills ذات `user-invocable` كأوامر شرطة مائلة. تُنقّى الأسماء إلى `a-z0-9_` (بحد أقصى 32 حرفاً)؛ وتحصل التعارضات على لواحق رقمية (مثلاً `_2`).
      - يشغّل `/skill <name> [input]` Skill حسب الاسم (مفيد عندما تمنع حدود الأوامر الأصلية إنشاء أوامر لكل Skill).
      - افتراضياً، تُمرَّر أوامر Skills إلى النموذج كطلب عادي.
      - قد تعلن Skills اختيارياً `command-dispatch: tool` لتوجيه الأمر مباشرة إلى أداة (حتمي، بلا نموذج).
      - مثال: `/prose` (Plugin OpenProse) — راجع [OpenProse](/ar/prose).
    - **وسائط الأوامر الأصلية:** يستخدم Discord الإكمال التلقائي للخيارات الديناميكية (وقوائم الأزرار عندما تُغفل الوسائط المطلوبة). يعرض Telegram وSlack قائمة أزرار عندما يدعم الأمر خيارات وتُغفل الوسيطة. تُحل الخيارات الديناميكية مقابل نموذج الجلسة الهدف، لذا فإن الخيارات الخاصة بالنموذج مثل مستويات `/think` تتبع تجاوز `/model` لتلك الجلسة.

  </Accordion>
</AccordionGroup>

## `/tools`

يجيب `/tools` عن سؤال وقت التشغيل، لا عن سؤال الإعداد: **ما الذي يستطيع هذا الوكيل استخدامه الآن في هذه المحادثة**.

- يكون `/tools` الافتراضي موجزاً ومحسّناً للمسح السريع.
- يضيف `/tools verbose` أوصافاً قصيرة.
- تعرض واجهات الأوامر الأصلية التي تدعم الوسائط مفتاح تبديل الوضع نفسه كـ `compact|verbose`.
- النتائج محددة بنطاق الجلسة، لذلك قد يؤدي تغيير الوكيل، أو القناة، أو السلسلة، أو تفويض المرسل، أو النموذج إلى تغيير المخرجات.
- يتضمن `/tools` الأدوات التي يمكن الوصول إليها فعلياً في وقت التشغيل، بما في ذلك أدوات النواة، وأدوات Plugins المتصلة، والأدوات المملوكة للقناة.

لتحرير الملف الشخصي والتجاوزات، استخدم لوحة Tools في واجهة Control أو واجهات الإعداد/الفهرس بدلاً من التعامل مع `/tools` كفهرس ثابت.

## واجهات الاستخدام (ما يظهر وأين)

- يظهر **استخدام/حصة المزوّد** (مثال: "Claude 80% متبقٍ") في `/status` لمزوّد النموذج الحالي عند تفعيل تتبّع الاستخدام. يطبّع OpenClaw نوافذ المزوّد إلى `% متبقٍ`؛ وبالنسبة إلى MiniMax، تُعكس حقول النسبة المئوية الخاصة بالمتبقي فقط قبل العرض، وتفضّل استجابات `model_remains` إدخال نموذج المحادثة مع تسمية خطة موسومة بالنموذج.
- يمكن أن تعود **أسطر الرموز/ذاكرة التخزين المؤقت** في `/status` إلى أحدث إدخال استخدام في النص المنقول عندما تكون لقطة الجلسة الحية شحيحة. تظل القيم الحية غير الصفرية الحالية هي الغالبة، ويمكن للرجوع إلى النص المنقول أيضًا استعادة تسمية نموذج وقت التشغيل النشط مع إجمالي أكبر موجّه للمطالبة عندما تكون الإجماليات المخزنة مفقودة أو أصغر.
- **التنفيذ مقابل وقت التشغيل:** يعرض `/status` قيمة `Execution` لمسار sandbox الفعلي، و`Runtime` لمن يشغّل الجلسة فعليًا: `OpenClaw Pi Default` أو `OpenAI Codex` أو واجهة خلفية CLI أو واجهة خلفية ACP.
- تتحكم `/usage off|tokens|full` في **رموز/تكلفة كل استجابة** (وتُضاف إلى الردود العادية).
- يتعلق `/model status` بـ **النماذج/المصادقة/نقاط النهاية**، وليس بالاستخدام.

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

- تعرض `/model` و`/model list` منتقيًا مرقمًا ومختصرًا (عائلة النموذج + المزوّدون المتاحون).
- على Discord، تفتح `/model` و`/models` منتقيًا تفاعليًا يحتوي على قوائم منسدلة للمزوّد والنموذج مع خطوة Submit. يحترم المنتقي `agents.defaults.models`، بما في ذلك إدخالات `provider/*`، بحيث يمكن للاكتشاف المحدد بنطاق المزوّد إبقاء المنتقي دون حد Discord البالغ 25 خيارًا للمكوّن.
- تختار `/model <#>` من ذلك المنتقي (وتفضّل المزوّد الحالي عندما يكون ذلك ممكنًا).
- يعرض `/model status` العرض التفصيلي، بما في ذلك نقطة نهاية المزوّد المكوّنة (`baseUrl`) ووضع API (`api`) عند توفرهما.

## تجاوزات التصحيح

تتيح لك `/debug` ضبط تجاوزات إعداد **خاصة بوقت التشغيل فقط** (في الذاكرة، لا على القرص). للمالك فقط. معطلة افتراضيًا؛ فعّلها باستخدام `commands.debug: true`.

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

تتيح لك `/trace` تبديل **أسطر تتبّع/تصحيح Plugin محددة بنطاق الجلسة** دون تشغيل الوضع المطوّل الكامل.

أمثلة:

```text
/trace
/trace on
/trace off
```

ملاحظات:

- تعرض `/trace` دون وسيطة حالة تتبّع الجلسة الحالية.
- تفعّل `/trace on` أسطر تتبّع Plugin للجلسة الحالية.
- تعطلها `/trace off` مرة أخرى.
- يمكن أن تظهر أسطر تتبّع Plugin في `/status` وكرسالة تشخيصية لاحقة بعد رد المساعد العادي.
- لا تستبدل `/trace` بـ `/debug`؛ فما زالت `/debug` تدير تجاوزات الإعداد الخاصة بوقت التشغيل فقط.
- لا تستبدل `/trace` بـ `/verbose`؛ فما زالت مخرجات الأدوات/الحالة المطوّلة العادية تندرج تحت `/verbose`.

## تحديثات الإعداد

تكتب `/config` إلى إعدادك الموجود على القرص (`openclaw.json`). للمالك فقط. معطلة افتراضيًا؛ فعّلها باستخدام `commands.config: true`.

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

تكتب `/mcp` تعريفات خوادم MCP المُدارة من OpenClaw تحت `mcp.servers`. للمالك فقط. معطلة افتراضيًا؛ فعّلها باستخدام `commands.mcp: true`.

أمثلة:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
تخزّن `/mcp` الإعداد في إعداد OpenClaw، وليس إعدادات المشروع المملوكة لـ Pi. تقرر محولات وقت التشغيل أي وسائل نقل قابلة للتنفيذ فعليًا.
</Note>

## تحديثات Plugin

تتيح `/plugins` للمشغلين فحص Plugins المكتشفة وتبديل التمكين في الإعداد. يمكن لتدفقات القراءة فقط استخدام `/plugin` كاسم مستعار. معطلة افتراضيًا؛ فعّلها باستخدام `commands.plugins: true`.

أمثلة:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- تستخدم `/plugins list` و`/plugins show` اكتشاف Plugin حقيقيًا مقابل مساحة العمل الحالية مع الإعداد الموجود على القرص.
- تثبّت `/plugins install` من ClawHub وnpm وgit والأدلة المحلية والأرشيفات.
- تحدّث `/plugins enable|disable` إعداد Plugin فقط؛ فهي لا تثبّت Plugins ولا تزيل تثبيتها.
- تعيد تغييرات التفعيل والتعطيل تحميل أسطح وقت تشغيل Gateway Plugin الساخنة لدورات الوكيل الجديدة؛ ويطلب التثبيت إعادة تشغيل Gateway لأن وحدات مصدر Plugin تغيّرت.

</Note>

## ملاحظات السطح

<AccordionGroup>
  <Accordion title="الجلسات لكل سطح">
    - تعمل **الأوامر النصية** في جلسة المحادثة العادية (تشترك الرسائل المباشرة في `main`، وللمجموعات جلستها الخاصة).
    - تستخدم **الأوامر الأصلية** جلسات معزولة:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (يمكن تكوين البادئة عبر `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (تستهدف جلسة المحادثة عبر `CommandTargetSessionKey`)
    - تستهدف **`/stop`** جلسة المحادثة النشطة حتى تتمكن من إلغاء التشغيل الحالي.

  </Accordion>
  <Accordion title="تفاصيل Slack">
    ما زال `channels.slack.slashCommand` مدعومًا لأمر واحد على نمط `/openclaw`. إذا فعّلت `commands.native`، فيجب إنشاء أمر Slack slash واحد لكل أمر مدمج (بالأسماء نفسها كما في `/help`). تُسلّم قوائم وسيطات الأوامر لـ Slack كأزرار Block Kit مؤقتة.

    استثناء Slack الأصلي: سجّل `/agentstatus` (وليس `/status`) لأن Slack يحجز `/status`. ما زال النص `/status` يعمل في رسائل Slack.

  </Accordion>
</AccordionGroup>

## أسئلة جانبية BTW

`/btw` هو **سؤال جانبي** سريع حول الجلسة الحالية. `/side` اسم مستعار.

على خلاف المحادثة العادية:

- يستخدم الجلسة الحالية كسياق خلفي،
- في جلسات Codex harness، يعمل كسلسلة جانبية مؤقتة من Codex مع
  أذونات Codex الحالية وسطح الأدوات الأصلي،
- في الجلسات غير الخاصة بـ Codex، يحتفظ بسلوك الاستدعاء الجانبي المباشر لمرة واحدة الأقدم،
- لا يغيّر سياق الجلسة المستقبلي،
- لا يُكتب في سجل النص المنقول،
- يُسلّم كنتيجة جانبية حية بدلًا من رسالة مساعد عادية.

يجعل ذلك `/btw` مفيدًا عندما تريد توضيحًا مؤقتًا بينما تستمر المهمة الرئيسية.

مثال:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

راجع [أسئلة BTW الجانبية](/ar/tools/btw) للاطلاع على السلوك الكامل وتفاصيل تجربة مستخدم العميل.

## ذو صلة

- [إنشاء Skills](/ar/tools/creating-skills)
- [Skills](/ar/tools/skills)
- [إعدادات Skills](/ar/tools/skills-config)

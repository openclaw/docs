---
read_when:
    - استخدام أو إعداد أوامر الدردشة
    - تصحيح أخطاء توجيه الأوامر أو الأذونات
sidebarTitle: Slash commands
summary: 'أوامر الشرطة المائلة: النصية مقابل الأصلية، والتكوين، والأوامر المدعومة'
title: أوامر الشرطة المائلة
x-i18n:
    generated_at: "2026-05-04T07:11:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49eb41674c8d0a01dbd28a2df783eb9aba3dde18d8425951a266cede825e9a84
    source_path: tools/slash-commands.md
    workflow: 16
---

تُعالَج الأوامر بواسطة Gateway. يجب إرسال معظم الأوامر كرسالة **مستقلة** تبدأ بـ `/`. يستخدم أمر دردشة bash الخاص بالمضيف فقط `! <cmd>` (مع `/bash <cmd>` كاسم مستعار).

عندما تكون محادثة أو سلسلة مرتبطة بجلسة ACP، يُوجَّه نص المتابعة العادي إلى حزام ACP ذلك. تظل أوامر إدارة Gateway محلية: يصل `/acp ...` دائمًا إلى معالج أوامر OpenClaw ACP، ويظل `/status` و`/unfocus` محليين كلما كان التعامل مع الأوامر مفعّلًا للسطح.

يوجد نظامان مرتبطان:

<AccordionGroup>
  <Accordion title="الأوامر">
    رسائل `/...` المستقلة.
  </Accordion>
  <Accordion title="التوجيهات">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - تُزال التوجيهات من الرسالة قبل أن يراها النموذج.
    - في رسائل الدردشة العادية (غير المقتصرة على التوجيهات)، تُعامَل على أنها "تلميحات مضمنة" ولا تستمر في إعدادات الجلسة.
    - في الرسائل المقتصرة على التوجيهات (تحتوي الرسالة على توجيهات فقط)، تستمر في الجلسة وتُرجِع إقرارًا.
    - لا تُطبَّق التوجيهات إلا على **المرسلين المصرح لهم**. إذا عُيّن `commands.allowFrom`، فهو قائمة السماح الوحيدة المستخدمة؛ وإلا يأتي التفويض من قوائم السماح/الإقران الخاصة بالقناة إضافة إلى `commands.useAccessGroups`. يرى المرسلون غير المصرح لهم التوجيهات كنص عادي.

  </Accordion>
  <Accordion title="الاختصارات المضمنة">
    للمرسلين الموجودين في قائمة السماح/المصرح لهم فقط: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    تُشغَّل فورًا، وتُزال قبل أن يرى النموذج الرسالة، ويواصل النص المتبقي التدفق العادي.

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
  يفعّل تحليل `/...` في رسائل الدردشة. على الأسطح التي لا تحتوي على أوامر أصلية (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams)، تظل أوامر النص تعمل حتى إذا عيّنت هذا إلى `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  يسجل الأوامر الأصلية. تلقائي: مفعّل لـ Discord/Telegram؛ غير مفعّل لـ Slack (إلى أن تضيف أوامر مائلة)؛ يُتجاهل للموفرين الذين لا يملكون دعمًا أصليًا. عيّن `channels.discord.commands.native` أو `channels.telegram.commands.native` أو `channels.slack.commands.native` للتجاوز لكل موفر (قيمة منطقية أو `"auto"`). على Discord، يتخطى `false` تسجيل أوامر الشرطة المائلة وتنظيفها أثناء بدء التشغيل؛ وقد تظل الأوامر المسجلة سابقًا مرئية إلى أن تزيلها من تطبيق Discord. تُدار أوامر Slack في تطبيق Slack ولا تُزال تلقائيًا.
</ParamField>
على Discord، قد تتضمن مواصفات الأوامر الأصلية `descriptionLocalizations`، التي ينشرها OpenClaw كـ `description_localizations` في Discord ويدرجها في مقارنات التسوية.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  يسجل أوامر **skill** أصليًا عندما تكون مدعومة. تلقائي: مفعّل لـ Discord/Telegram؛ غير مفعّل لـ Slack (يتطلب Slack إنشاء أمر مائل لكل skill). عيّن `channels.discord.commands.nativeSkills` أو `channels.telegram.commands.nativeSkills` أو `channels.slack.commands.nativeSkills` للتجاوز لكل موفر (قيمة منطقية أو `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  يفعّل `! <cmd>` لتشغيل أوامر صدفة المضيف (`/bash <cmd>` اسم مستعار؛ يتطلب قوائم سماح `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  يتحكم في مدة انتظار bash قبل التحول إلى وضع الخلفية (`0` ينقلها إلى الخلفية فورًا).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  يفعّل `/config` (يقرأ/يكتب `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  يفعّل `/mcp` (يقرأ/يكتب إعداد MCP المدار بواسطة OpenClaw تحت `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  يفعّل `/plugins` (اكتشاف Plugin/الحالة إضافة إلى عناصر التحكم في التثبيت والتمكين/التعطيل).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  يفعّل `/debug` (تجاوزات وقت التشغيل فقط).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  يفعّل `/restart` إضافة إلى إجراءات أداة إعادة تشغيل gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  يعيّن قائمة السماح الصريحة للمالك لأسطح الأوامر/الأدوات المخصصة للمالك فقط. هذا هو حساب المشغل البشري الذي يمكنه الموافقة على الإجراءات الخطرة وتشغيل أوامر مثل `/diagnostics` و`/export-trajectory` و`/config`. وهو منفصل عن `commands.allowFrom` وعن وصول إقران الرسائل المباشرة.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  لكل قناة: يجعل أوامر المالك فقط تتطلب **هوية المالك** للتشغيل على ذلك السطح. عند `true`، يجب أن يطابق المرسل إما مرشح مالك محلولًا (مثل إدخال في `commands.ownerAllowFrom` أو بيانات تعريف مالك أصلية لدى الموفر) أو يمتلك نطاق `operator.admin` داخليًا على قناة رسائل داخلية. لا يكفي إدخال بدل عام في `allowFrom` الخاصة بالقناة، أو قائمة مرشحي مالك فارغة/غير محلولة — تفشل أوامر المالك فقط مغلقة على تلك القناة. اترك هذا معطّلًا إذا كنت تريد حراسة أوامر المالك فقط بواسطة `ownerAllowFrom` وقوائم سماح الأوامر القياسية فقط.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  يتحكم في كيفية ظهور معرفات المالك في موجه النظام.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  يعيّن اختياريًا سر HMAC المستخدم عندما يكون `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  قائمة سماح لكل موفر لتفويض الأوامر. عند تكوينها، تكون مصدر التفويض الوحيد للأوامر والتوجيهات (تُتجاهل قوائم السماح/الإقران الخاصة بالقناة و`commands.useAccessGroups`). استخدم `"*"` كافتراضي عام؛ وتتجاوزه المفاتيح الخاصة بالموفر.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  يفرض قوائم السماح/السياسات للأوامر عندما لا يكون `commands.allowFrom` معيّنًا.
</ParamField>

## قائمة الأوامر

مصدر الحقيقة الحالي:

- تأتي العناصر المضمنة الأساسية من `src/auto-reply/commands-registry.shared.ts`
- تأتي أوامر dock المولّدة من `src/auto-reply/commands-registry.data.ts`
- تأتي أوامر Plugin من استدعاءات `registerCommand()` الخاصة بـ Plugin
- لا يزال التوفر الفعلي على gateway الخاص بك يعتمد على أعلام الإعداد وسطح القناة وPlugins المثبتة/المفعّلة

### الأوامر الأساسية المضمنة

<AccordionGroup>
  <Accordion title="الجلسات والتشغيلات">
    - يبدأ `/new [model]` جلسة جديدة؛ و`/reset` هو اسم مستعار لإعادة الضبط.
    - تعترض Control UI الأمر المكتوب `/new` لإنشاء جلسة لوحة معلومات جديدة والتبديل إليها؛ بينما لا يزال الأمر المكتوب `/reset` يشغّل إعادة الضبط الموضعية الخاصة بـ Gateway.
    - يحتفظ `/reset soft [message]` بالنص الحالي، ويسقط معرفات جلسات خلفية CLI المعاد استخدامها، ويعيد تشغيل تحميل بدء التشغيل/موجه النظام في الموضع نفسه.
    - يضغط `/compact [instructions]` سياق الجلسة. راجع [Compaction](/ar/concepts/compaction).
    - يُجهض `/stop` التشغيل الحالي.
    - يدير `/session idle <duration|off>` و`/session max-age <duration|off>` انتهاء صلاحية ربط السلسلة.
    - يصدّر `/export-session [path]` الجلسة الحالية إلى HTML. الاسم المستعار: `/export`.
    - يطلب `/export-trajectory [path]` موافقة exec، ثم يصدّر [حزمة مسار](/ar/tools/trajectory) JSONL للجلسة الحالية. استخدمه عندما تحتاج إلى الخط الزمني للموجه والأداة والنص لجلسة OpenClaw واحدة. في الدردشات الجماعية، يذهب طلب الموافقة ونتيجة التصدير إلى المالك بشكل خاص. الاسم المستعار: `/trajectory`.

  </Accordion>
  <Accordion title="النموذج وعناصر التحكم في التشغيل">
    - يعيّن `/think <level>` مستوى التفكير. تأتي الخيارات من ملف تعريف موفر النموذج النشط؛ المستويات الشائعة هي `off` و`minimal` و`low` و`medium` و`high`، مع مستويات مخصصة مثل `xhigh` و`adaptive` و`max`، أو المستوى الثنائي `on` حيث يكون مدعومًا فقط. الأسماء المستعارة: `/thinking`, `/t`.
    - يبدّل `/verbose on|off|full` الإخراج المطوّل. الاسم المستعار: `/v`.
    - يبدّل `/trace on|off` إخراج تتبع Plugin للجلسة الحالية.
    - يعرض `/fast [status|on|off]` الوضع السريع أو يعيّنه.
    - يبدّل `/reasoning [on|off|stream]` رؤية الاستدلال. الاسم المستعار: `/reason`.
    - يبدّل `/elevated [on|off|ask|full]` الوضع المرتفع. الاسم المستعار: `/elev`.
    - يعرض `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` افتراضيات exec أو يعيّنها.
    - يعرض `/model [name|#|status]` النموذج أو يعيّنه.
    - يسرد `/models [provider] [page] [limit=<n>|size=<n>|all]` الموفرين المكوّنين/المتاحين بالمصادقة أو نماذج موفر معيّن؛ أضف `all` لتصفح الفهرس الكامل لذلك الموفر.
    - يدير `/queue <mode>` سلوك الطابور (`steer`، و`queue` القديم، و`followup`، و`collect`، و`steer-backlog`، و`interrupt`) إضافة إلى خيارات مثل `debounce:0.5s cap:25 drop:summarize`؛ ويمسح `/queue default` أو `/queue reset` تجاوز الجلسة. راجع [طابور الأوامر](/ar/concepts/queue) و[طابور التوجيه](/ar/concepts/queue-steering).
    - يحقن `/steer <message>` إرشادًا في التشغيل النشط للجلسة الحالية، بشكل مستقل عن وضع `/queue`. لا يبدأ تشغيلًا جديدًا عندما تكون الجلسة خاملة. الاسم المستعار: `/tell`. راجع [التوجيه](/ar/tools/steer).

  </Accordion>
  <Accordion title="الاكتشاف والحالة">
    - يعرض `/help` ملخص المساعدة القصير.
    - يعرض `/commands` فهرس الأوامر المولّد.
    - يعرض `/tools [compact|verbose]` ما يمكن للوكيل الحالي استخدامه الآن.
    - يعرض `/status` حالة التنفيذ/وقت التشغيل، بما في ذلك تسميات `Execution`/`Runtime` واستخدام/حصة الموفر عند توفرها.
    - `/diagnostics [note]` هو تدفق تقرير الدعم المخصص للمالك فقط لأخطاء Gateway وتشغيلات حزام Codex. يطلب موافقة exec صريحة في كل مرة قبل تشغيل `openclaw gateway diagnostics export --json`؛ لا توافق على التشخيصات بقاعدة سماح شاملة. بعد الموافقة، يرسل تقريرًا قابلًا للصق يتضمن مسار الحزمة المحلي وملخص البيان وملاحظات الخصوصية ومعرفات الجلسات ذات الصلة. في الدردشات الجماعية، يذهب طلب الموافقة والتقرير إلى المالك بشكل خاص. عندما تستخدم الجلسة النشطة حزام OpenAI Codex، ترسل الموافقة نفسها أيضًا ملاحظات Codex ذات الصلة إلى خوادم OpenAI، وتسرد الاستجابة المكتملة معرفات جلسات OpenClaw ومعرفات سلاسل Codex وأوامر `codex resume <thread-id>`. راجع [تصدير التشخيصات](/ar/gateway/diagnostics).
    - يشغّل `/crestodian <request>` مساعد إعداد وإصلاح Crestodian من رسالة مباشرة للمالك.
    - يسرد `/tasks` المهام الخلفية النشطة/الأخيرة للجلسة الحالية.
    - يشرح `/context [list|detail|json]` كيفية تجميع السياق.
    - يعرض `/whoami` معرف المرسل الخاص بك. الاسم المستعار: `/id`.
    - يتحكم `/usage off|tokens|full|cost` في تذييل الاستخدام لكل استجابة أو يطبع ملخص تكلفة محليًا.

  </Accordion>
  <Accordion title="Skills، قوائم السماح، الموافقات">
    - يشغّل `/skill <name> [input]` skill بالاسم.
    - يدير `/allowlist [list|add|remove] ...` إدخالات قائمة السماح. نصي فقط.
    - يحل `/approve <id> <decision>` طلبات موافقة exec.
    - يطرح `/btw <question>` سؤالًا جانبيًا دون تغيير سياق الجلسة المستقبلي. الاسم المستعار: `/side`. راجع [بالمناسبة](/ar/tools/btw).

  </Accordion>
  <Accordion title="الوكلاء الفرعيون وACP">
    - يدير `/subagents list|kill|log|info|send|steer|spawn` تشغيلات الوكلاء الفرعيين للجلسة الحالية.
    - يدير `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` جلسات ACP وخيارات وقت التشغيل.
    - يربط `/focus <target>` سلسلة Discord الحالية أو موضوع/محادثة Telegram بهدف جلسة.
    - يزيل `/unfocus` الربط الحالي.
    - يسرد `/agents` الوكلاء المرتبطين بالسلسلة للجلسة الحالية.
    - يجهض `/kill <id|#|all>` وكيلا فرعيا واحدا قيد التشغيل أو جميع الوكلاء الفرعيين قيد التشغيل.
    - يرسل `/subagents steer <id|#> <message>` توجيها إلى وكيل فرعي قيد التشغيل. راجع [التوجيه](/ar/tools/steer).

  </Accordion>
  <Accordion title="الكتابات المقتصرة على المالك والإدارة">
    - يقرأ `/config show|get|set|unset` أو يكتب `openclaw.json`. مقتصر على المالك. يتطلب `commands.config: true`.
    - يقرأ `/mcp show|get|set|unset` أو يكتب إعداد خادم MCP المُدار بواسطة OpenClaw ضمن `mcp.servers`. مقتصر على المالك. يتطلب `commands.mcp: true`.
    - يفحص `/plugins list|inspect|show|get|install|enable|disable` حالة Plugin أو يعدّلها. `/plugin` اسم بديل. الكتابات مقتصرة على المالك. يتطلب `commands.plugins: true`.
    - يدير `/debug show|set|unset|reset` تجاوزات الإعداد الخاصة بوقت التشغيل فقط. مقتصر على المالك. يتطلب `commands.debug: true`.
    - يعيد `/restart` تشغيل OpenClaw عند تمكينه. الافتراضي: ممكّن؛ اضبط `commands.restart: false` لتعطيله.
    - يضبط `/send on|off|inherit` سياسة الإرسال. مقتصر على المالك.

  </Accordion>
  <Accordion title="الصوت وTTS والتحكم بالقناة">
    - يتحكم `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` في TTS. راجع [TTS](/ar/tools/tts).
    - يضبط `/activation mention|always` وضع تفعيل المجموعة.
    - يشغّل `/bash <command>` أمر صدفة على المضيف. نص فقط. الاسم البديل: `! <command>`. يتطلب `commands.bash: true` بالإضافة إلى قوائم السماح `tools.elevated`.
    - يفحص `!poll [sessionId]` مهمة bash في الخلفية.
    - يوقف `!stop [sessionId]` مهمة bash في الخلفية.

  </Accordion>
</AccordionGroup>

### أوامر الإرساء المولدة

تبدّل أوامر الإرساء مسار رد الجلسة الحالية إلى قناة مرتبطة أخرى. راجع [إرساء القنوات](/ar/concepts/channel-docking) للإعداد والأمثلة واستكشاف الأخطاء وإصلاحها.

تُولّد أوامر الإرساء من Plugins القنوات التي تدعم الأوامر الأصلية. المجموعة المضمّنة الحالية:

- `/dock-discord` (الاسم البديل: `/dock_discord`)
- `/dock-mattermost` (الاسم البديل: `/dock_mattermost`)
- `/dock-slack` (الاسم البديل: `/dock_slack`)
- `/dock-telegram` (الاسم البديل: `/dock_telegram`)

استخدم أوامر الإرساء من محادثة مباشرة لتبديل مسار رد الجلسة الحالية إلى قناة مرتبطة أخرى. يحتفظ الوكيل بسياق الجلسة نفسه، لكن الردود المستقبلية لتلك الجلسة تُسلَّم إلى نظير القناة المحدد.

تتطلب أوامر الإرساء `session.identityLinks`. يجب أن يكون المرسل المصدر والنظير الهدف في مجموعة الهوية نفسها، مثلا `["telegram:123", "discord:456"]`. إذا أرسل مستخدم Telegram بالمعرّف `123` الأمر `/dock_discord`، يخزن OpenClaw `lastChannel: "discord"` و`lastTo: "456"` في الجلسة النشطة. إذا لم يكن المرسل مرتبطا بنظير Discord، يرد الأمر بتلميح إعداد بدلا من المتابعة إلى الدردشة العادية.

يغيّر الإرساء مسار الجلسة النشطة فقط. لا ينشئ حسابات قنوات، ولا يمنح وصولا، ولا يتجاوز قوائم السماح للقنوات، ولا ينقل سجل النصوص إلى جلسة أخرى. استخدم `/dock-telegram` أو `/dock-slack` أو `/dock-mattermost` أو أمر إرساء مولدا آخر لتبديل المسار مرة أخرى.

### أوامر Plugins المضمّنة

يمكن أن تضيف Plugins المضمّنة مزيدا من أوامر الشرطة المائلة. الأوامر المضمّنة الحالية في هذا المستودع:

- يبدّل `/dreaming [on|off|status|help]` Dreaming للذاكرة. راجع [Dreaming](/ar/concepts/dreaming).
- يدير `/pair [qr|status|pending|approve|cleanup|notify]` تدفق إقران/إعداد الجهاز. راجع [الإقران](/ar/channels/pairing).
- يسلّح `/phone status|arm <camera|screen|writes|all> [duration]|disarm` مؤقتا أوامر عقدة الهاتف عالية المخاطر.
- يدير `/voice status|list [limit]|set <voiceId|name>` إعداد صوت Talk. على Discord، اسم الأمر الأصلي هو `/talkvoice`.
- يرسل `/card ...` إعدادات مسبقة لبطاقات LINE الغنية. راجع [LINE](/ar/channels/line).
- يفحص `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` ويتحكم في منصة خادم تطبيقات Codex المضمّنة. راجع [منصة Codex](/ar/plugins/codex-harness).
- أوامر خاصة بـQQBot فقط:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### أوامر Skills الديناميكية

تُعرَض Skills القابلة للاستدعاء من المستخدم أيضا كأوامر شرطة مائلة:

- يعمل `/skill <name> [input]` دائما كنقطة دخول عامة.
- قد تظهر Skills أيضا كأوامر مباشرة مثل `/prose` عندما يسجلها Skill/Plugin.
- يتحكم `commands.nativeSkills` و`channels.<provider>.commands.nativeSkills` في تسجيل أوامر Skills الأصلية.
- يمكن أن توفر مواصفات الأوامر `descriptionLocalizations` للأسطح الأصلية التي تدعم الأوصاف المترجمة، بما في ذلك Discord.

<AccordionGroup>
  <Accordion title="ملاحظات الوسائط والمحلل">
    - تقبل الأوامر اختياريا `:` بين الأمر والوسائط (مثلا `/think: high` و`/send: on` و`/help:`).
    - يقبل `/new <model>` اسما بديلا للنموذج، أو `provider/model`، أو اسم موفّر (مطابقة تقريبية)؛ وإذا لم توجد مطابقة، يُعامل النص كمتن الرسالة.
    - للحصول على تفصيل كامل لاستخدام الموفّر، استخدم `openclaw status --usage`.
    - يتطلب `/allowlist add|remove` ‏`commands.config=true` ويحترم `configWrites` للقناة.
    - في القنوات متعددة الحسابات، يحترم أيضا `/allowlist --account <id>` المستهدف للإعداد و`/config set channels.<provider>.accounts.<id>...` قيمة `configWrites` للحساب الهدف.
    - يتحكم `/usage` في تذييل الاستخدام لكل رد؛ ويطبع `/usage cost` ملخص تكلفة محليا من سجلات جلسات OpenClaw.
    - يكون `/restart` ممكنا افتراضيا؛ اضبط `commands.restart: false` لتعطيله.
    - يقبل `/plugins install <spec>` مواصفات Plugin نفسها التي يقبلها `openclaw plugins install`: مسار/أرشيف محلي، حزمة npm، أو `git:<repo>`، أو `clawhub:<pkg>`، ثم يطلب إعادة تشغيل Gateway لأن وحدات مصدر Plugin تغيرت.
    - يحدّث `/plugins enable|disable` إعداد Plugin ويشغّل إعادة تحميل Plugins في Gateway لدورات الوكيل الجديدة.

  </Accordion>
  <Accordion title="سلوك خاص بالقنوات">
    - أمر أصلي خاص بـDiscord فقط: يتحكم `/vc join|leave|status` في قنوات الصوت (غير متاح كنص). يتطلب `join` خادما وقناة صوت/منصة محددة. يتطلب `channels.discord.voice` وأوامر أصلية.
    - تتطلب أوامر ربط سلاسل Discord (`/focus`، `/unfocus`، `/agents`، `/session idle`، `/session max-age`) تمكين ربط السلاسل الفعّال (`session.threadBindings.enabled` و/أو `channels.discord.threadBindings.enabled`).
    - مرجع أوامر ACP وسلوك وقت التشغيل: [وكلاء ACP](/ar/tools/acp-agents).

  </Accordion>
  <Accordion title="سلامة الإسهاب / التتبع / السرعة / الاستدلال">
    - الغرض من `/verbose` هو التصحيح وزيادة الرؤية؛ أبقه **موقوفا** في الاستخدام العادي.
    - `/trace` أضيق من `/verbose`: فهو لا يكشف إلا أسطر التتبع/التصحيح المملوكة من Plugin ويبقي ضوضاء الأدوات الإسهابية العادية متوقفة.
    - يحفظ `/fast on|off` تجاوزا للجلسة. استخدم خيار `inherit` في واجهة الجلسات لمسحه والعودة إلى إعدادات التكوين الافتراضية.
    - يعتمد `/fast` على الموفّر: يربطه OpenAI/OpenAI Codex بـ`service_tier=priority` على نقاط نهاية Responses الأصلية، بينما تربطه طلبات Anthropic العامة المباشرة، بما في ذلك حركة المرور الموثقة عبر OAuth المرسلة إلى `api.anthropic.com`، بـ`service_tier=auto` أو `standard_only`. راجع [OpenAI](/ar/providers/openai) و[Anthropic](/ar/providers/anthropic).
    - تظل ملخصات فشل الأدوات معروضة عند اللزوم، لكن نص الفشل التفصيلي لا يُضمَّن إلا عندما يكون `/verbose` على `on` أو `full`.
    - تُعد `/reasoning` و`/verbose` و`/trace` محفوفة بالمخاطر في إعدادات المجموعات: فقد تكشف استدلالا داخليا، أو مخرجات أدوات، أو تشخيصات Plugin لم تقصد كشفها. يفضّل إبقاؤها متوقفة، خاصة في دردشات المجموعات.

  </Accordion>
  <Accordion title="تبديل النموذج">
    - يحفظ `/model` نموذج الجلسة الجديد فورا.
    - إذا كان الوكيل خاملا، فسيستخدمه التشغيل التالي مباشرة.
    - إذا كان تشغيل نشطا بالفعل، يضع OpenClaw علامة على التبديل المباشر كقيد الانتظار ولا يعيد التشغيل بالنموذج الجديد إلا عند نقطة إعادة محاولة نظيفة.
    - إذا كان نشاط الأدوات أو إخراج الرد قد بدأ بالفعل، فيمكن أن يظل التبديل المعلّق في قائمة الانتظار حتى فرصة إعادة محاولة لاحقة أو دورة المستخدم التالية.
    - في TUI المحلي، يعيد `/crestodian [request]` من TUI الوكيل العادي إلى Crestodian. هذا منفصل عن وضع الإنقاذ في قنوات الرسائل ولا يمنح صلاحية إعداد عن بُعد.

  </Accordion>
  <Accordion title="المسار السريع والاختصارات المضمّنة">
    - **المسار السريع:** تُعالَج الرسائل التي تحتوي على أوامر فقط من المرسلين المدرجين في قائمة السماح فورا (تجاوز الطابور + النموذج).
    - **بوابة ذكر المجموعة:** تتجاوز الرسائل التي تحتوي على أوامر فقط من المرسلين المدرجين في قائمة السماح متطلبات الذكر.
    - **الاختصارات المضمّنة (للمرسلين المدرجين في قائمة السماح فقط):** تعمل بعض الأوامر أيضا عند تضمينها في رسالة عادية وتُزال قبل أن يرى النموذج النص المتبقي.
      - مثال: يؤدي `hey /status` إلى تشغيل رد حالة، ويستمر النص المتبقي عبر التدفق العادي.
    - حاليا: `/help`، `/commands`، `/status`، `/whoami` (`/id`).
    - تُتجاهل الرسائل غير المصرح بها التي تحتوي على أوامر فقط بصمت، وتُعامَل رموز `/...` المضمّنة كنص عادي.

  </Accordion>
  <Accordion title="أوامر Skills والوسائط الأصلية">
    - **أوامر Skills:** تُعرَض Skills من نوع `user-invocable` كأوامر شرطة مائلة. تُنظَّف الأسماء إلى `a-z0-9_` (بحد أقصى 32 حرفا)؛ وتحصل التعارضات على لواحق رقمية (مثلا `_2`).
      - يشغّل `/skill <name> [input]` مهارة بالاسم (مفيد عندما تمنع حدود الأوامر الأصلية إنشاء أوامر لكل Skill).
      - افتراضيا، تُمرَّر أوامر Skills إلى النموذج كطلب عادي.
      - يمكن أن تعلن Skills اختياريا `command-dispatch: tool` لتوجيه الأمر مباشرة إلى أداة (حتمي، بلا نموذج).
      - مثال: `/prose` (OpenProse Plugin) — راجع [OpenProse](/ar/prose).
    - **وسائط الأوامر الأصلية:** يستخدم Discord الإكمال التلقائي للخيارات الديناميكية (وقوائم الأزرار عند حذف الوسائط المطلوبة). يعرض Telegram وSlack قائمة أزرار عندما يدعم الأمر اختيارات وتحذف الوسيط. تُحل الخيارات الديناميكية مقابل نموذج الجلسة الهدف، لذلك تتبع الخيارات الخاصة بالنموذج، مثل مستويات `/think`، تجاوز `/model` لتلك الجلسة.

  </Accordion>
</AccordionGroup>

## `/tools`

يجيب `/tools` عن سؤال وقت التشغيل، لا عن سؤال إعداد: **ما الذي يمكن لهذا الوكيل استخدامه الآن في هذه المحادثة**.

- يكون `/tools` الافتراضي موجزا ومحسنا للمسح السريع.
- يضيف `/tools verbose` أوصافا قصيرة.
- تعرض أسطح الأوامر الأصلية التي تدعم الوسائط مفتاح الوضع نفسه مثل `compact|verbose`.
- النتائج محصورة بنطاق الجلسة، لذلك قد يغيّر تبديل الوكيل أو القناة أو السلسلة أو تفويض المرسل أو النموذج المخرجات.
- يتضمن `/tools` الأدوات التي يمكن الوصول إليها فعليا وقت التشغيل، بما في ذلك الأدوات الأساسية، وأدوات Plugin المتصلة، والأدوات المملوكة للقناة.

لتحرير الملفات الشخصية والتجاوزات، استخدم لوحة أدوات واجهة التحكم أو أسطح الإعداد/الفهرس بدلا من التعامل مع `/tools` كفهرس ثابت.

## أسطح الاستخدام (ما يظهر أين)

- **استخدام/حصة المزوّد** (مثال: "Claude 80% متبقٍ") تظهر في `/status` لمزوّد النموذج الحالي عند تمكين تتبع الاستخدام. يطبّع OpenClaw نوافذ المزوّد إلى `% left`؛ بالنسبة إلى MiniMax، تُعكس حقول النسبة المئوية التي تعرض المتبقي فقط قبل العرض، وتفضّل استجابات `model_remains` إدخال نموذج الدردشة مع تسمية خطة موسومة بالنموذج.
- **أسطر الرموز/ذاكرة التخزين المؤقت** في `/status` يمكن أن تعود إلى أحدث إدخال لاستخدام النص المنقول عندما تكون لقطة الجلسة الحية محدودة. تظل القيم الحية غير الصفرية الحالية هي الأسبق، ويمكن للرجوع إلى النص المنقول أيضًا استعادة تسمية نموذج وقت التشغيل النشط مع إجمالي أكبر موجه للمطالبة عندما تكون الإجماليات المخزنة مفقودة أو أصغر.
- **التنفيذ مقابل وقت التشغيل:** يعرض `/status` `Execution` لمسار العزل الفعّال و`Runtime` للجهة التي تشغّل الجلسة فعليًا: `OpenClaw Pi Default` أو `OpenAI Codex` أو خلفية CLI أو خلفية ACP.
- **الرموز/التكلفة لكل استجابة** يتحكم بها `/usage off|tokens|full` (تُضاف إلى الردود العادية).
- `/model status` يتعلق بـ **النماذج/المصادقة/نقاط النهاية**، وليس الاستخدام.

## اختيار النموذج (`/model`)

يُنفَّذ `/model` كتوجيه.

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

- يعرض `/model` و`/model list` منتقيًا مدمجًا ومرقمًا (عائلة النموذج + المزوّدون المتاحون).
- على Discord، يفتح `/model` و`/models` منتقيًا تفاعليًا يتضمن قوائم منسدلة للمزوّد والنموذج إضافة إلى خطوة إرسال.
- يختار `/model <#>` من ذلك المنتقي (ويفضّل المزوّد الحالي عندما يكون ذلك ممكنًا).
- يعرض `/model status` العرض التفصيلي، بما في ذلك نقطة نهاية المزوّد المكوّنة (`baseUrl`) ووضع API (`api`) عند توفرهما.

## تجاوزات التصحيح

يتيح لك `/debug` ضبط تجاوزات إعداد **وقت التشغيل فقط** (في الذاكرة، لا على القرص). للمالك فقط. معطّل افتراضيًا؛ فعّله باستخدام `commands.debug: true`.

أمثلة:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
تُطبَّق التجاوزات فورًا على قراءات الإعداد الجديدة، لكنها لا تكتب إلى `openclaw.json`. استخدم `/debug reset` لمسح كل التجاوزات والعودة إلى الإعداد الموجود على القرص.
</Note>

## مخرجات تتبع Plugin

يتيح لك `/trace` تبديل **أسطر تتبع/تصحيح Plugin المحددة بنطاق الجلسة** من دون تشغيل الوضع المطوّل الكامل.

أمثلة:

```text
/trace
/trace on
/trace off
```

ملاحظات:

- يعرض `/trace` من دون وسيطة حالة تتبع الجلسة الحالية.
- يفعّل `/trace on` أسطر تتبع Plugin للجلسة الحالية.
- يعطّلها `/trace off` مرة أخرى.
- يمكن أن تظهر أسطر تتبع Plugin في `/status` وكرسالة تشخيصية لاحقة بعد رد المساعد العادي.
- لا يستبدل `/trace` الأمر `/debug`؛ فما زال `/debug` يدير تجاوزات إعداد وقت التشغيل فقط.
- لا يستبدل `/trace` الأمر `/verbose`؛ فما زالت مخرجات الأدوات/الحالة المطوّلة العادية تابعة لـ `/verbose`.

## تحديثات الإعداد

يكتب `/config` إلى الإعداد الموجود على القرص (`openclaw.json`). للمالك فقط. معطّل افتراضيًا؛ فعّله باستخدام `commands.config: true`.

أمثلة:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
يُتحقَّق من صحة الإعداد قبل الكتابة؛ وتُرفض التغييرات غير الصالحة. تستمر تحديثات `/config` بعد عمليات إعادة التشغيل.
</Note>

## تحديثات MCP

يكتب `/mcp` تعريفات خوادم MCP التي يديرها OpenClaw تحت `mcp.servers`. للمالك فقط. معطّل افتراضيًا؛ فعّله باستخدام `commands.mcp: true`.

أمثلة:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
يخزّن `/mcp` الإعداد في إعداد OpenClaw، وليس في إعدادات المشروع المملوكة لـ Pi. تقرر محولات وقت التشغيل وسائل النقل القابلة للتنفيذ فعليًا.
</Note>

## تحديثات Plugin

يتيح `/plugins` للمشغلين فحص Plugins المكتشفة وتبديل التمكين في الإعداد. يمكن لتدفقات القراءة فقط استخدام `/plugin` كاسم مستعار. معطّل افتراضيًا؛ فعّله باستخدام `commands.plugins: true`.

أمثلة:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- يستخدم `/plugins list` و`/plugins show` اكتشاف Plugin الحقيقي مقابل مساحة العمل الحالية بالإضافة إلى الإعداد الموجود على القرص.
- يثبّت `/plugins install` من ClawHub وnpm وgit والأدلة المحلية والأرشيفات.
- يحدّث `/plugins enable|disable` إعداد Plugin فقط؛ ولا يثبّت Plugins أو يلغي تثبيتها.
- تعيد تغييرات التمكين والتعطيل تحميل أسطح وقت تشغيل Gateway Plugin بشكل ساخن لدورات الوكيل الجديدة؛ ويطلب التثبيت إعادة تشغيل Gateway لأن وحدات مصدر Plugin تغيّرت.

</Note>

## ملاحظات الأسطح

<AccordionGroup>
  <Accordion title="Sessions per surface">
    - تعمل **الأوامر النصية** في جلسة الدردشة العادية (تشارك الرسائل المباشرة `main`، وللمجموعات جلستها الخاصة).
    - تستخدم **الأوامر الأصلية** جلسات معزولة:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (البادئة قابلة للتهيئة عبر `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (تستهدف جلسة الدردشة عبر `CommandTargetSessionKey`)
    - يستهدف **`/stop`** جلسة الدردشة النشطة حتى يتمكن من إيقاف التشغيل الحالي.

  </Accordion>
  <Accordion title="Slack specifics">
    ما زال `channels.slack.slashCommand` مدعومًا لأمر واحد بنمط `/openclaw`. إذا فعّلت `commands.native`، فيجب إنشاء أمر شرطة مائلة واحد في Slack لكل أمر مضمّن (بالأسماء نفسها كما في `/help`). تُسلَّم قوائم وسيطات الأوامر في Slack كأزرار Block Kit مؤقتة.

    استثناء Slack الأصلي: سجّل `/agentstatus` (وليس `/status`) لأن Slack يحجز `/status`. ما زال الأمر النصي `/status` يعمل في رسائل Slack.

  </Accordion>
</AccordionGroup>

## أسئلة جانبية بالمناسبة

`/btw` هو **سؤال جانبي** سريع حول الجلسة الحالية. `/side` هو اسم مستعار.

بخلاف الدردشة العادية:

- يستخدم الجلسة الحالية كسياق خلفي،
- يعمل كاستدعاء منفصل لمرة واحدة **بلا أدوات**،
- لا يغيّر سياق الجلسة المستقبلي،
- لا يُكتب في سجل النص المنقول،
- يُسلَّم كنتيجة جانبية حية بدلًا من رسالة مساعد عادية.

هذا يجعل `/btw` مفيدًا عندما تريد توضيحًا مؤقتًا بينما تستمر المهمة الرئيسية.

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

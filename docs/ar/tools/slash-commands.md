---
read_when:
    - استخدام أو تكوين أوامر الدردشة
    - تصحيح أخطاء توجيه الأوامر أو الأذونات
sidebarTitle: Slash commands
summary: 'أوامر الشرطة المائلة: النصية مقابل الأصلية، والتكوين، والأوامر المدعومة'
title: أوامر الشرطة المائلة
x-i18n:
    generated_at: "2026-04-30T08:32:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: d87471982fd03fb35bcb44ae62c9f9e40ec38ad17059c88a1e990194a296fbbd
    source_path: tools/slash-commands.md
    workflow: 16
---

تتعامل Gateway مع الأوامر. يجب إرسال معظم الأوامر كرسالة **مستقلة** تبدأ بـ `/`. يستخدم أمر محادثة bash المخصص للمضيف فقط `! <cmd>` (مع `/bash <cmd>` كاسم مستعار).

عندما تكون محادثة أو سلسلة مرتبطة بجلسة ACP، يتم توجيه نص المتابعة العادي إلى حزام ACP ذلك. تظل أوامر إدارة Gateway محلية: يصل `/acp ...` دائمًا إلى معالج أوامر OpenClaw ACP، ويبقى `/status` و`/unfocus` محليين كلما كانت معالجة الأوامر مفعلة للسطح.

يوجد نظامان مترابطان:

<AccordionGroup>
  <Accordion title="الأوامر">
    رسائل `/...` المستقلة.
  </Accordion>
  <Accordion title="التوجيهات">
    `/think`، `/fast`، `/verbose`، `/trace`، `/reasoning`، `/elevated`، `/exec`، `/model`، `/queue`.

    - تُزال التوجيهات من الرسالة قبل أن يراها النموذج.
    - في رسائل المحادثة العادية (وليست الرسائل التي تحتوي على توجيهات فقط)، تُعامل باعتبارها "تلميحات مضمنة" ولا تستمر في إعدادات الجلسة.
    - في الرسائل التي تحتوي على توجيهات فقط (أي أن الرسالة تحتوي على التوجيهات وحدها)، تستمر في الجلسة وتُرسل ردًا بالإقرار.
    - لا تُطبّق التوجيهات إلا على **المرسلين المصرح لهم**. إذا تم تعيين `commands.allowFrom`، فستكون قائمة السماح الوحيدة المستخدمة؛ وإلا يأتي التفويض من قوائم السماح/الاقتران الخاصة بالقناة بالإضافة إلى `commands.useAccessGroups`. يرى المرسلون غير المصرح لهم التوجيهات كنص عادي.

  </Accordion>
  <Accordion title="الاختصارات المضمنة">
    للمرسلين الموجودين في قائمة السماح/المصرح لهم فقط: `/help`، `/commands`، `/status`، `/whoami` (`/id`).

    تُشغّل فورًا، وتُزال قبل أن يرى النموذج الرسالة، ويستمر النص المتبقي عبر التدفق العادي.

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
  يفعّل تحليل `/...` في رسائل المحادثة. على الأسطح التي لا تحتوي على أوامر أصلية (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams)، تظل الأوامر النصية تعمل حتى إذا عيّنت هذا إلى `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  يسجّل الأوامر الأصلية. تلقائي: مفعّل لـ Discord/Telegram؛ متوقف لـ Slack (حتى تضيف أوامر slash)؛ يتم تجاهله لموفري الخدمة الذين لا يدعمون الأوامر الأصلية. عيّن `channels.discord.commands.native` أو `channels.telegram.commands.native` أو `channels.slack.commands.native` للتجاوز لكل موفر (قيمة منطقية أو `"auto"`). تؤدي `false` إلى مسح الأوامر المسجلة سابقًا على Discord/Telegram عند بدء التشغيل. تُدار أوامر Slack في تطبيق Slack ولا تُزال تلقائيًا.
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  يسجّل أوامر **skill** أصليًا عند دعمها. تلقائي: مفعّل لـ Discord/Telegram؛ متوقف لـ Slack (يتطلب Slack إنشاء أمر slash لكل skill). عيّن `channels.discord.commands.nativeSkills` أو `channels.telegram.commands.nativeSkills` أو `channels.slack.commands.nativeSkills` للتجاوز لكل موفر (قيمة منطقية أو `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  يفعّل `! <cmd>` لتشغيل أوامر صدفة المضيف (`/bash <cmd>` اسم مستعار؛ يتطلب قوائم سماح `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  يتحكم في مدة انتظار bash قبل الانتقال إلى وضع الخلفية (`0` يجعله يعمل في الخلفية فورًا).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  يفعّل `/config` (يقرأ/يكتب `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  يفعّل `/mcp` (يقرأ/يكتب إعدادات MCP المُدارة بواسطة OpenClaw ضمن `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  يفعّل `/plugins` (اكتشاف/حالة plugins بالإضافة إلى عناصر التحكم في التثبيت والتفعيل/التعطيل).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  يفعّل `/debug` (تجاوزات وقت التشغيل فقط).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  يفعّل `/restart` بالإضافة إلى إجراءات أدوات إعادة تشغيل gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  يعيّن قائمة السماح الصريحة للمالك لأسطح الأوامر/الأدوات المخصصة للمالك فقط. هذا هو حساب المشغّل البشري الذي يمكنه الموافقة على الإجراءات الخطرة وتشغيل أوامر مثل `/diagnostics` و`/export-trajectory` و`/config`. وهو منفصل عن `commands.allowFrom` وعن وصول اقتران الرسائل المباشرة.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  لكل قناة: يجعل الأوامر المخصصة للمالك فقط تتطلب **هوية المالك** للتشغيل على ذلك السطح. عند `true`، يجب أن يطابق المرسل إما مرشح مالك محلولًا (مثل إدخال في `commands.ownerAllowFrom` أو بيانات تعريف المالك الأصلية لدى الموفر) أو أن يحمل نطاق `operator.admin` داخليًا على قناة رسائل داخلية. لا يكفي إدخال wildcard في `allowFrom` الخاصة بالقناة، أو قائمة مرشحي مالك فارغة/غير محلولة — تفشل الأوامر المخصصة للمالك فقط بشكل مغلق على تلك القناة. اترك هذا الخيار متوقفًا إذا كنت تريد حجب الأوامر المخصصة للمالك فقط بواسطة `ownerAllowFrom` وقوائم سماح الأوامر القياسية فقط.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  يتحكم في كيفية ظهور معرّفات المالك في مطالبة النظام.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  يعيّن اختياريًا سر HMAC المستخدم عندما تكون `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  قائمة سماح لكل موفر لتفويض الأوامر. عند تكوينها، تكون مصدر التفويض الوحيد للأوامر والتوجيهات (يتم تجاهل قوائم السماح/الاقتران الخاصة بالقناة و`commands.useAccessGroups`). استخدم `"*"` كافتراضي عام؛ وتقوم المفاتيح الخاصة بالموفر بتجاوزه.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  يفرض قوائم السماح/السياسات للأوامر عندما لا يتم تعيين `commands.allowFrom`.
</ParamField>

## قائمة الأوامر

مصدر الحقيقة الحالي:

- تأتي الأوامر المضمنة الأساسية من `src/auto-reply/commands-registry.shared.ts`
- تأتي أوامر dock المُولّدة من `src/auto-reply/commands-registry.data.ts`
- تأتي أوامر plugin من استدعاءات `registerCommand()` الخاصة بـ plugin
- لا يزال التوفر الفعلي على gateway لديك يعتمد على أعلام الإعدادات وسطح القناة وplugins المثبتة/المفعلة

### الأوامر المضمنة الأساسية

<AccordionGroup>
  <Accordion title="الجلسات والتشغيلات">
    - يبدأ `/new [model]` جلسة جديدة؛ و`/reset` هو اسم إعادة الضبط المستعار.
    - يحافظ `/reset soft [message]` على النص الحالي، ويسقط معرّفات جلسات خلفية CLI المعاد استخدامها، ويعيد تشغيل تحميل بدء التشغيل/مطالبة النظام في الموضع نفسه.
    - يضغط `/compact [instructions]` سياق الجلسة. راجع [Compaction](/ar/concepts/compaction).
    - يجهض `/stop` التشغيل الحالي.
    - يدير `/session idle <duration|off>` و`/session max-age <duration|off>` انتهاء صلاحية ربط السلاسل.
    - يصدّر `/export-session [path]` الجلسة الحالية إلى HTML. الاسم المستعار: `/export`.
    - يطلب `/export-trajectory [path]` موافقة exec، ثم يصدّر [حزمة مسار](/ar/tools/trajectory) JSONL للجلسة الحالية. استخدمه عندما تحتاج إلى الخط الزمني للمطالبة والأداة والنص لجلسة OpenClaw واحدة. في المحادثات الجماعية، تذهب مطالبة الموافقة ونتيجة التصدير إلى المالك على نحو خاص. الاسم المستعار: `/trajectory`.

  </Accordion>
  <Accordion title="النموذج وعناصر التحكم في التشغيل">
    - يعيّن `/think <level>` مستوى التفكير. تأتي الخيارات من ملف موفر النموذج النشط؛ المستويات الشائعة هي `off` و`minimal` و`low` و`medium` و`high`، مع مستويات مخصصة مثل `xhigh` أو `adaptive` أو `max` أو الثنائي `on` فقط حيث تكون مدعومة. الأسماء المستعارة: `/thinking`، `/t`.
    - يبدّل `/verbose on|off|full` الإخراج التفصيلي. الاسم المستعار: `/v`.
    - يبدّل `/trace on|off` إخراج تتبع plugin للجلسة الحالية.
    - يعرض `/fast [status|on|off]` الوضع السريع أو يعيّنه.
    - يبدّل `/reasoning [on|off|stream]` ظهور الاستدلال. الاسم المستعار: `/reason`.
    - يبدّل `/elevated [on|off|ask|full]` الوضع المرتفع. الاسم المستعار: `/elev`.
    - يعرض `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` افتراضيات exec أو يعيّنها.
    - يعرض `/model [name|#|status]` النموذج أو يعيّنه.
    - يسرد `/models [provider] [page] [limit=<n>|size=<n>|all]` الموفرين المكوّنين/المتاحين عبر المصادقة أو نماذج موفر؛ أضف `all` لتصفح الفهرس الكامل لذلك الموفر.
    - يدير `/queue <mode>` سلوك قائمة الانتظار (`steer` و`queue` القديم و`followup` و`collect` و`steer-backlog` و`interrupt`) بالإضافة إلى خيارات مثل `debounce:0.5s cap:25 drop:summarize`؛ يمسح `/queue default` أو `/queue reset` تجاوز الجلسة. راجع [قائمة انتظار الأوامر](/ar/concepts/queue) و[قائمة انتظار التوجيه](/ar/concepts/queue-steering).

  </Accordion>
  <Accordion title="الاكتشاف والحالة">
    - يعرض `/help` ملخص المساعدة القصير.
    - يعرض `/commands` فهرس الأوامر المُولّد.
    - يعرض `/tools [compact|verbose]` ما يمكن للوكيل الحالي استخدامه الآن.
    - يعرض `/status` حالة التنفيذ/وقت التشغيل، بما في ذلك تسميات `Execution`/`Runtime` واستخدام/حصة الموفر عند توفرها.
    - `/diagnostics [note]` هو تدفق تقرير الدعم المخصص للمالك فقط لأخطاء Gateway وتشغيلات حزام Codex. يطلب موافقة exec صريحة في كل مرة قبل تشغيل `openclaw gateway diagnostics export --json`؛ لا توافق على التشخيصات بقاعدة تسمح بكل شيء. بعد الموافقة، يرسل تقريرًا قابلًا للصق يتضمن مسار الحزمة المحلية وملخص البيان وملاحظات الخصوصية ومعرّفات الجلسات ذات الصلة. في المحادثات الجماعية، تذهب مطالبة الموافقة والتقرير إلى المالك على نحو خاص. عندما تستخدم الجلسة النشطة حزام OpenAI Codex، ترسل الموافقة نفسها أيضًا ملاحظات Codex ذات الصلة إلى خوادم OpenAI، وتسرد الرسالة المكتملة معرّفات جلسات OpenClaw ومعرّفات سلاسل Codex وأوامر `codex resume <thread-id>`. راجع [تصدير التشخيصات](/ar/gateway/diagnostics).
    - يشغّل `/crestodian <request>` مساعد إعداد وإصلاح Crestodian من رسالة مباشرة للمالك.
    - يسرد `/tasks` مهام الخلفية النشطة/الأخيرة للجلسة الحالية.
    - يشرح `/context [list|detail|json]` كيفية تجميع السياق.
    - يعرض `/whoami` معرّف المرسل الخاص بك. الاسم المستعار: `/id`.
    - يتحكم `/usage off|tokens|full|cost` في تذييل الاستخدام لكل رد أو يطبع ملخص تكلفة محليًا.

  </Accordion>
  <Accordion title="Skills، قوائم السماح، الموافقات">
    - يشغّل `/skill <name> [input]` skill بالاسم.
    - يدير `/allowlist [list|add|remove] ...` إدخالات قائمة السماح. نصي فقط.
    - يحل `/approve <id> <decision>` مطالبات موافقة exec.
    - يطرح `/btw <question>` سؤالًا جانبيًا دون تغيير سياق الجلسة المستقبلي. راجع [BTW](/ar/tools/btw).

  </Accordion>
  <Accordion title="الوكلاء الفرعيون وACP">
    - يدير `/subagents list|kill|log|info|send|steer|spawn` تشغيلات الوكلاء الفرعيين للجلسة الحالية.
    - يدير `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` جلسات ACP وخيارات وقت التشغيل.
    - يربط `/focus <target>` سلسلة Discord الحالية أو موضوع/محادثة Telegram بهدف جلسة.
    - يزيل `/unfocus` الربط الحالي.
    - يسرد `/agents` الوكلاء المرتبطين بالسلسلة للجلسة الحالية.
    - يجهض `/kill <id|#|all>` وكيلًا فرعيًا واحدًا قيد التشغيل أو جميع الوكلاء الفرعيين.
    - يرسل `/steer <id|#> <message>` توجيهًا إلى وكيل فرعي قيد التشغيل. الاسم المستعار: `/tell`.

  </Accordion>
  <Accordion title="الكتابة الخاصة بالمالك فقط والإدارة">
    - يقرأ `/config show|get|set|unset` أو يكتب `openclaw.json`. خاص بالمالك فقط. يتطلب `commands.config: true`.
    - يقرأ `/mcp show|get|set|unset` أو يكتب إعداد خادم MCP المُدار من OpenClaw ضمن `mcp.servers`. خاص بالمالك فقط. يتطلب `commands.mcp: true`.
    - يفحص `/plugins list|inspect|show|get|install|enable|disable` حالة Plugin أو يغيّرها. `/plugin` اسم بديل. الكتابة خاصة بالمالك فقط. يتطلب `commands.plugins: true`.
    - يدير `/debug show|set|unset|reset` تجاوزات الإعداد الخاصة بوقت التشغيل فقط. خاص بالمالك فقط. يتطلب `commands.debug: true`.
    - يعيد `/restart` تشغيل OpenClaw عند تفعيله. الافتراضي: مفعّل؛ عيّن `commands.restart: false` لتعطيله.
    - يضبط `/send on|off|inherit` سياسة الإرسال. خاص بالمالك فقط.

  </Accordion>
  <Accordion title="الصوت وTTS والتحكم في القناة">
    - يتحكم `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` في TTS. راجع [TTS](/ar/tools/tts).
    - يضبط `/activation mention|always` وضع تنشيط المجموعة.
    - يشغّل `/bash <command>` أمر shell على المضيف. نص فقط. الاسم البديل: `! <command>`. يتطلب `commands.bash: true` بالإضافة إلى قوائم السماح في `tools.elevated`.
    - يتحقق `!poll [sessionId]` من مهمة bash في الخلفية.
    - يوقف `!stop [sessionId]` مهمة bash في الخلفية.

  </Accordion>
</AccordionGroup>

### أوامر الإرساء المُولَّدة

تبدّل أوامر الإرساء مسار رد الجلسة الحالية إلى قناة مرتبطة أخرى. راجع [إرساء القنوات](/ar/concepts/channel-docking) للإعداد والأمثلة واستكشاف الأخطاء وإصلاحها.

تُولَّد أوامر الإرساء من Plugins القنوات التي تدعم الأوامر الأصلية. المجموعة المضمنة الحالية:

- `/dock-discord` (الاسم البديل: `/dock_discord`)
- `/dock-mattermost` (الاسم البديل: `/dock_mattermost`)
- `/dock-slack` (الاسم البديل: `/dock_slack`)
- `/dock-telegram` (الاسم البديل: `/dock_telegram`)

استخدم أوامر الإرساء من محادثة مباشرة لتبديل مسار رد الجلسة الحالية إلى قناة مرتبطة أخرى. يحتفظ الوكيل بسياق الجلسة نفسه، لكن الردود المستقبلية لتلك الجلسة تُسلَّم إلى النظير المحدد في القناة.

تتطلب أوامر الإرساء `session.identityLinks`. يجب أن يكون المرسل المصدر والنظير الهدف ضمن مجموعة الهوية نفسها، على سبيل المثال `["telegram:123", "discord:456"]`. إذا أرسل مستخدم Telegram بالمعرّف `123` الأمر `/dock_discord`، يخزّن OpenClaw ‏`lastChannel: "discord"` و`lastTo: "456"` في الجلسة النشطة. إذا لم يكن المرسل مرتبطًا بنظير Discord، يرد الأمر بتلميح إعداد بدلًا من متابعة المحادثة العادية.

يغيّر الإرساء مسار الجلسة النشطة فقط. ولا ينشئ حسابات قنوات، أو يمنح وصولًا، أو يتجاوز قوائم السماح للقنوات، أو ينقل سجل النصوص إلى جلسة أخرى. استخدم `/dock-telegram` أو `/dock-slack` أو `/dock-mattermost` أو أمر إرساء مُولَّدًا آخر لتبديل المسار مجددًا.

### أوامر Plugin المضمنة

يمكن أن تضيف Plugins المضمنة المزيد من أوامر الشرطة المائلة. الأوامر المضمنة الحالية في هذا المستودع:

- يبدّل `/dreaming [on|off|status|help]` Dreaming الذاكرة. راجع [Dreaming](/ar/concepts/dreaming).
- يدير `/pair [qr|status|pending|approve|cleanup|notify]` تدفق إقران/إعداد الجهاز. راجع [الإقران](/ar/channels/pairing).
- يسلّح `/phone status|arm <camera|screen|writes|all> [duration]|disarm` أوامر عقدة الهاتف عالية المخاطر مؤقتًا.
- يدير `/voice status|list [limit]|set <voiceId|name>` إعداد صوت Talk. في Discord، اسم الأمر الأصلي هو `/talkvoice`.
- يرسل `/card ...` إعدادات بطاقات LINE الغنية. راجع [LINE](/ar/channels/line).
- يفحص `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` ويتحكم في حزمة تشغيل خادم تطبيق Codex المضمنة. راجع [حزمة تشغيل Codex](/ar/plugins/codex-harness).
- أوامر خاصة بـ QQBot فقط:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### أوامر Skills الديناميكية

تُعرَض Skills القابلة للاستدعاء من المستخدم أيضًا كأوامر شرطة مائلة:

- يعمل `/skill <name> [input]` دائمًا كنقطة دخول عامة.
- قد تظهر Skills أيضًا كأوامر مباشرة مثل `/prose` عندما تسجلها Skill/Plugin.
- يتحكم `commands.nativeSkills` و`channels.<provider>.commands.nativeSkills` في تسجيل أوامر Skills الأصلية.

<AccordionGroup>
  <Accordion title="ملاحظات الوسيطات والمحلل">
    - تقبل الأوامر وجود `:` اختياري بين الأمر والوسيطات (مثل `/think: high` و`/send: on` و`/help:`).
    - يقبل `/new <model>` اسمًا بديلًا للنموذج، أو `provider/model`، أو اسم مزوّد (مطابقة تقريبية)؛ إذا لم توجد مطابقة، يُعامَل النص كمتن الرسالة.
    - للحصول على تفصيل كامل لاستخدام المزوّد، استخدم `openclaw status --usage`.
    - يتطلب `/allowlist add|remove` ‏`commands.config=true` ويحترم `configWrites` الخاصة بالقناة.
    - في القنوات متعددة الحسابات، تحترم أوامر `/allowlist --account <id>` الموجهة للإعدادات و`/config set channels.<provider>.accounts.<id>...` أيضًا `configWrites` الخاصة بالحساب الهدف.
    - يتحكم `/usage` في تذييل الاستخدام لكل رد؛ يطبع `/usage cost` ملخص تكلفة محليًا من سجلات جلسات OpenClaw.
    - `/restart` مفعّل افتراضيًا؛ عيّن `commands.restart: false` لتعطيله.
    - يقبل `/plugins install <spec>` مواصفات Plugin نفسها التي يقبلها `openclaw plugins install`: مسار/أرشيف محلي، أو حزمة npm، أو `clawhub:<pkg>`.
    - يحدّث `/plugins enable|disable` إعداد Plugin وقد يطلب إعادة التشغيل.

  </Accordion>
  <Accordion title="سلوك خاص بالقناة">
    - أمر أصلي خاص بـ Discord فقط: يتحكم `/vc join|leave|status` في قنوات الصوت (غير متاح كنص). يتطلب `join` وجود guild وقناة صوت/منصة محددة. يتطلب `channels.discord.voice` والأوامر الأصلية.
    - تتطلب أوامر ربط خيوط Discord (`/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age`) تفعيل ربط الخيوط الفعّال (`session.threadBindings.enabled` و/أو `channels.discord.threadBindings.enabled`).
    - مرجع أوامر ACP وسلوك وقت التشغيل: [وكلاء ACP](/ar/tools/acp-agents).

  </Accordion>
  <Accordion title="السلامة في verbose / trace / fast / reasoning">
    - الغرض من `/verbose` هو التصحيح وزيادة الرؤية؛ أبقه **متوقفًا** في الاستخدام العادي.
    - `/trace` أضيق من `/verbose`: فهو يكشف فقط أسطر التتبع/التصحيح المملوكة لـ Plugin ويبقي ثرثرة الأدوات verbose العادية متوقفة.
    - يحفظ `/fast on|off` تجاوزًا للجلسة. استخدم خيار `inherit` في واجهة Sessions لمسحه والرجوع إلى افتراضيات الإعداد.
    - `/fast` خاص بالمزوّد: يربطه OpenAI/OpenAI Codex بـ `service_tier=priority` على نقاط نهاية Responses الأصلية، بينما تربطه طلبات Anthropic العامة المباشرة، بما في ذلك حركة المرور المصادق عليها عبر OAuth والمرسلة إلى `api.anthropic.com`، بـ `service_tier=auto` أو `standard_only`. راجع [OpenAI](/ar/providers/openai) و[Anthropic](/ar/providers/anthropic).
    - تظل ملخصات فشل الأدوات معروضة عند اللزوم، لكن نص الفشل التفصيلي لا يُضمَّن إلا عندما يكون `/verbose` بقيمة `on` أو `full`.
    - تُعد `/reasoning` و`/verbose` و`/trace` خطرة في إعدادات المجموعات: فقد تكشف تفكيرًا داخليًا أو مخرجات أدوات أو تشخيصات Plugin لم تكن تنوي كشفها. يُفضّل تركها متوقفة، خصوصًا في محادثات المجموعات.

  </Accordion>
  <Accordion title="تبديل النموذج">
    - يحفظ `/model` نموذج الجلسة الجديد فورًا.
    - إذا كان الوكيل خاملًا، يستخدمه التشغيل التالي مباشرة.
    - إذا كان هناك تشغيل نشط بالفعل، يضع OpenClaw التبديل الحي في حالة معلّقة ولا يعيد التشغيل إلى النموذج الجديد إلا عند نقطة إعادة محاولة نظيفة.
    - إذا بدأ نشاط الأدوات أو إخراج الرد بالفعل، يمكن أن يبقى التبديل المعلّق في قائمة الانتظار إلى فرصة إعادة محاولة لاحقة أو إلى دور المستخدم التالي.
    - في TUI المحلية، يعيد `/crestodian [request]` من TUI الوكيل العادية إلى Crestodian. هذا منفصل عن وضع إنقاذ قناة الرسائل ولا يمنح صلاحية إعداد عن بُعد.

  </Accordion>
  <Accordion title="المسار السريع والاختصارات المضمنة">
    - **المسار السريع:** تُعالَج الرسائل التي تحتوي أوامر فقط من المرسلين المسموح لهم فورًا (تجاوز قائمة الانتظار + النموذج).
    - **بوابة الإشارة في المجموعات:** تتجاوز الرسائل التي تحتوي أوامر فقط من المرسلين المسموح لهم متطلبات الإشارة.
    - **الاختصارات المضمنة (للمرسلين المسموح لهم فقط):** تعمل بعض الأوامر أيضًا عند تضمينها في رسالة عادية وتُزال قبل أن يرى النموذج النص المتبقي.
      - مثال: يؤدي `hey /status` إلى رد حالة، ويستمر النص المتبقي عبر التدفق العادي.
    - حاليًا: `/help` و`/commands` و`/status` و`/whoami` (`/id`).
    - يتم تجاهل الرسائل غير المصرح بها التي تحتوي أوامر فقط بصمت، وتُعامَل رموز `/...` المضمنة كنص عادي.

  </Accordion>
  <Accordion title="أوامر Skills والوسيطات الأصلية">
    - **أوامر Skills:** تُعرَض Skills ‏`user-invocable` كأوامر شرطة مائلة. تُنظَّف الأسماء إلى `a-z0-9_` (بحد أقصى 32 حرفًا)؛ وتحصل التصادمات على لواحق رقمية (مثل `_2`).
      - يشغّل `/skill <name> [input]` Skill بالاسم (مفيد عندما تمنع حدود الأوامر الأصلية أوامر منفصلة لكل Skill).
      - افتراضيًا، تُمرَّر أوامر Skills إلى النموذج كطلب عادي.
      - يمكن لـ Skills اختياريًا إعلان `command-dispatch: tool` لتوجيه الأمر مباشرة إلى أداة (حتمي، بلا نموذج).
      - مثال: `/prose` (OpenProse plugin) — راجع [OpenProse](/ar/prose).
    - **وسيطات الأوامر الأصلية:** يستخدم Discord الإكمال التلقائي للخيارات الديناميكية (وقوائم الأزرار عند حذف الوسيطات المطلوبة). يعرض Telegram وSlack قائمة أزرار عندما يدعم الأمر خيارات وتترك الوسيطة. تُحل الخيارات الديناميكية مقابل نموذج الجلسة الهدف، لذا تتبع الخيارات الخاصة بالنموذج مثل مستويات `/think` تجاوز `/model` الخاص بتلك الجلسة.

  </Accordion>
</AccordionGroup>

## `/tools`

يجيب `/tools` عن سؤال وقت التشغيل، لا سؤال الإعداد: **ما الذي يمكن لهذا الوكيل استخدامه الآن في هذه المحادثة**.

- يكون `/tools` الافتراضي موجزًا ومحسنًا للفحص السريع.
- يضيف `/tools verbose` أوصافًا قصيرة.
- تعرض أسطح الأوامر الأصلية التي تدعم الوسيطات مفتاح الوضع نفسه مثل `compact|verbose`.
- النتائج محددة بنطاق الجلسة، لذا يمكن أن يغيّر تغيير الوكيل أو القناة أو الخيط أو تفويض المرسل أو النموذج الناتج.
- يتضمن `/tools` الأدوات القابلة للوصول فعليًا في وقت التشغيل، بما في ذلك أدوات النواة، وأدوات Plugin المتصلة، والأدوات المملوكة للقناة.

لتحرير الملفات الشخصية والتجاوزات، استخدم لوحة Tools في Control UI أو أسطح الإعداد/الفهرس بدلًا من التعامل مع `/tools` كفهرس ثابت.

## أسطح الاستخدام (ما يظهر وأين)

- يظهر **استخدام/حصة المزوّد** (مثال: "Claude 80% left") في `/status` لمزوّد النموذج الحالي عند تفعيل تتبع الاستخدام. يطبّع OpenClaw نوافذ المزوّد إلى `% left`؛ وبالنسبة إلى MiniMax، تُعكَس حقول النسبة المئوية الخاصة بالمتبقي فقط قبل العرض، وتفضّل استجابات `model_remains` إدخال نموذج المحادثة بالإضافة إلى تسمية خطة موسومة بالنموذج.
- يمكن أن تتراجع **أسطر الرموز المميزة/الذاكرة المؤقتة** في `/status` إلى أحدث إدخال استخدام في سجل النصوص عندما تكون لقطة الجلسة الحية شحيحة. تظل القيم الحية غير الصفرية الحالية هي الغالبة، ويمكن أن يستعيد التراجع إلى سجل النصوص أيضًا تسمية نموذج وقت التشغيل النشط بالإضافة إلى إجمالي أكبر موجه نحو المطالبة عندما تكون الإجماليات المخزنة مفقودة أو أصغر.
- **التنفيذ مقابل وقت التشغيل:** يعرض `/status` ‏`Execution` لمسار sandbox الفعّال و`Runtime` لمن يشغّل الجلسة فعليًا: `OpenClaw Pi Default` أو `OpenAI Codex` أو خلفية CLI أو خلفية ACP.
- يتحكم `/usage off|tokens|full` في **الرموز المميزة/التكلفة لكل رد** (تُلحَق بالردود العادية).
- يتعلق `/model status` بـ **النماذج/المصادقة/نقاط النهاية**، وليس بالاستخدام.

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

- يعرض `/model` و`/model list` منتقيًا موجزًا ومرقّمًا (عائلة النموذج + المزوّدون المتاحون).
- في Discord، يفتح `/model` و`/models` منتقيًا تفاعليًا يتضمن قوائم منسدلة للمزوّد والنموذج بالإضافة إلى خطوة Submit.
- يختار `/model <#>` من ذلك المنتقي (ويفضّل المزوّد الحالي عند الإمكان).
- يعرض `/model status` العرض التفصيلي، بما في ذلك نقطة نهاية المزوّد المُعدة (`baseUrl`) ووضع API (`api`) عند توفرهما.

## تجاوزات التصحيح

`/debug` يتيح لك ضبط تجاوزات الإعدادات **الخاصة بوقت التشغيل فقط** (في الذاكرة، لا على القرص). للمالك فقط. معطّل افتراضيًا؛ فعّله باستخدام `commands.debug: true`.

أمثلة:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
تُطبَّق التجاوزات فورًا على قراءات الإعدادات الجديدة، لكنها **لا** تكتب إلى `openclaw.json`. استخدم `/debug reset` لمسح كل التجاوزات والعودة إلى الإعدادات الموجودة على القرص.
</Note>

## مخرجات تتبع Plugin

`/trace` يتيح لك تبديل **أسطر تتبع/تصحيح أخطاء Plugin ضمن نطاق الجلسة** من دون تشغيل وضع الإسهاب الكامل.

أمثلة:

```text
/trace
/trace on
/trace off
```

ملاحظات:

- يعرض `/trace` بلا وسيط حالة التتبع الحالية للجلسة.
- يفعّل `/trace on` أسطر تتبع Plugin للجلسة الحالية.
- يعطّلها `/trace off` مرة أخرى.
- يمكن أن تظهر أسطر تتبع Plugin في `/status` وكرسالة تشخيصية لاحقة بعد رد المساعد المعتاد.
- لا يستبدل `/trace` الأمر `/debug`؛ فما زال `/debug` يدير تجاوزات الإعدادات الخاصة بوقت التشغيل فقط.
- لا يستبدل `/trace` الأمر `/verbose`؛ فما زالت مخرجات الأدوات/الحالة الإسهابية العادية تابعة لـ `/verbose`.

## تحديثات الإعدادات

`/config` يكتب إلى إعداداتك الموجودة على القرص (`openclaw.json`). للمالك فقط. معطّل افتراضيًا؛ فعّله باستخدام `commands.config: true`.

أمثلة:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
تُتحقق صحة الإعدادات قبل الكتابة؛ وتُرفض التغييرات غير الصالحة. تستمر تحديثات `/config` بعد إعادة التشغيل.
</Note>

## تحديثات MCP

`/mcp` يكتب تعريفات خوادم MCP المُدارة من OpenClaw ضمن `mcp.servers`. للمالك فقط. معطّل افتراضيًا؛ فعّله باستخدام `commands.mcp: true`.

أمثلة:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
يخزّن `/mcp` الإعدادات في إعدادات OpenClaw، وليس في إعدادات المشروع المملوكة من Pi. تحدد محوّلات وقت التشغيل وسائل النقل القابلة للتنفيذ فعليًا.
</Note>

## تحديثات Plugin

`/plugins` يتيح للمشغّلين فحص Plugins المكتشفة وتبديل تمكينها في الإعدادات. يمكن لتدفقات القراءة فقط استخدام `/plugin` كاسم مستعار. معطّل افتراضيًا؛ فعّله باستخدام `commands.plugins: true`.

أمثلة:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- يستخدم `/plugins list` و`/plugins show` اكتشاف Plugin الحقيقي مقابل مساحة العمل الحالية مع الإعدادات الموجودة على القرص.
- يحدّث `/plugins enable|disable` إعدادات Plugin فقط؛ ولا يثبّت Plugins أو يلغي تثبيتها.
- بعد تغييرات التمكين/التعطيل، أعد تشغيل Gateway لتطبيقها.

</Note>

## ملاحظات السطح

<AccordionGroup>
  <Accordion title="Sessions per surface">
    - تعمل **الأوامر النصية** في جلسة الدردشة العادية (تشارك الرسائل المباشرة `main`، وللمجموعات جلستها الخاصة).
    - تستخدم **الأوامر الأصلية** جلسات معزولة:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (البادئة قابلة للضبط عبر `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (تستهدف جلسة الدردشة عبر `CommandTargetSessionKey`)
    - يستهدف **`/stop`** جلسة الدردشة النشطة لكي يتمكن من إيقاف التشغيل الحالي.

  </Accordion>
  <Accordion title="Slack specifics">
    ما زال `channels.slack.slashCommand` مدعومًا لأمر واحد بنمط `/openclaw`. إذا فعّلت `commands.native`، فيجب إنشاء أمر Slack slash واحد لكل أمر مدمج (بالأسماء نفسها كما في `/help`). تُسلَّم قوائم وسائط الأوامر لـ Slack كأزرار Block Kit مؤقتة.

    استثناء Slack الأصلي: سجّل `/agentstatus` (وليس `/status`) لأن Slack يحجز `/status`. ما زال `/status` النصي يعمل في رسائل Slack.

  </Accordion>
</AccordionGroup>

## أسئلة BTW الجانبية

`/btw` هو **سؤال جانبي** سريع عن الجلسة الحالية.

بخلاف الدردشة العادية:

- يستخدم الجلسة الحالية كسياق خلفي،
- يعمل كاستدعاء منفصل لمرة واحدة **بلا أدوات**،
- لا يغيّر سياق الجلسة المستقبلي،
- لا يُكتب في سجل النصوص،
- يُسلَّم كنتيجة جانبية مباشرة بدلًا من رسالة مساعد عادية.

هذا يجعل `/btw` مفيدًا عندما تريد توضيحًا مؤقتًا بينما تستمر المهمة الرئيسية.

مثال:

```text
/btw what are we doing right now?
```

راجع [أسئلة BTW الجانبية](/ar/tools/btw) لمعرفة السلوك الكامل وتفاصيل تجربة العميل.

## ذو صلة

- [إنشاء Skills](/ar/tools/creating-skills)
- [Skills](/ar/tools/skills)
- [إعدادات Skills](/ar/tools/skills-config)

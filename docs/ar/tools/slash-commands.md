---
read_when:
    - استخدام أو تكوين أوامر الدردشة
    - تصحيح أخطاء توجيه الأوامر أو الأذونات
sidebarTitle: Slash commands
summary: 'أوامر الشرطة المائلة: النصية مقابل الأصلية، والتكوين، والأوامر المدعومة'
title: أوامر الشرطة المائلة
x-i18n:
    generated_at: "2026-05-05T06:20:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a0234bd94cafe242fc692a5b9d457047e483e2a434cc92ab26046e6ddec55ce
    source_path: tools/slash-commands.md
    workflow: 16
---

تتولى Gateway معالجة الأوامر. يجب إرسال معظم الأوامر كرسالة **مستقلة** تبدأ بـ `/`. يستخدم أمر محادثة bash الخاص بالمضيف فقط الصيغة `! <cmd>` (مع `/bash <cmd>` كاسم مستعار).

عندما تكون محادثة أو سلسلة محادثات مرتبطة بجلسة ACP، يُوجَّه نص المتابعة العادي إلى حزمة ACP تلك. تبقى أوامر إدارة Gateway محلية: يصل `/acp ...` دائمًا إلى معالج أوامر OpenClaw ACP، ويبقى `/status` مع `/unfocus` محليين كلما كانت معالجة الأوامر مفعّلة للسطح.

يوجد نظامان مرتبطان:

<AccordionGroup>
  <Accordion title="Commands">
    رسائل `/...` مستقلة.
  </Accordion>
  <Accordion title="Directives">
    `/think`، `/fast`، `/verbose`، `/trace`، `/reasoning`، `/elevated`، `/exec`، `/model`، `/queue`.

    - تُزال التوجيهات من الرسالة قبل أن يراها النموذج.
    - في رسائل المحادثة العادية (وليست الرسائل التي تحتوي على توجيهات فقط)، تُعامل باعتبارها "تلميحات مضمنة" ولا تُبقي إعدادات الجلسة.
    - في الرسائل التي تحتوي على توجيهات فقط (تحتوي الرسالة على التوجيهات فقط)، تُحفظ في الجلسة وترد بإقرار.
    - تُطبَّق التوجيهات فقط على **المرسلين المخوّلين**. إذا عُيّن `commands.allowFrom`، فهو قائمة السماح الوحيدة المستخدمة؛ وإلا يأتي التخويل من قوائم سماح/اقتران القناة إضافة إلى `commands.useAccessGroups`. يرى المرسلون غير المخوّلين التوجيهات كنص عادي.

  </Accordion>
  <Accordion title="Inline shortcuts">
    للمرسلين المدرجين في قائمة السماح/المخوّلين فقط: `/help`، `/commands`، `/status`، `/whoami` (`/id`).

    تعمل فورًا، وتُزال قبل أن يراها النموذج، ويستمر النص المتبقي عبر المسار العادي.

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
  يسجّل الأوامر الأصلية. تلقائيًا: مفعّل لـ Discord/Telegram؛ معطّل لـ Slack (إلى أن تضيف أوامر الشرطة المائلة)؛ ويتم تجاهله لدى المزوّدين الذين لا يدعمون الدعم الأصلي. عيّن `channels.discord.commands.native` أو `channels.telegram.commands.native` أو `channels.slack.commands.native` للتجاوز لكل مزوّد (قيمة منطقية أو `"auto"`). على Discord، يتخطى `false` تسجيل أوامر الشرطة المائلة وتنظيفها أثناء بدء التشغيل؛ وقد تبقى الأوامر المسجلة سابقًا مرئية إلى أن تزيلها من تطبيق Discord. تُدار أوامر Slack في تطبيق Slack ولا تُزال تلقائيًا.
</ParamField>
على Discord، قد تتضمن مواصفات الأوامر الأصلية `descriptionLocalizations`، التي ينشرها OpenClaw بصيغة Discord `description_localizations` ويدرجها في مقارنات التسوية.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  يسجّل أوامر **Skills** أصليًا عندما يكون ذلك مدعومًا. تلقائيًا: مفعّل لـ Discord/Telegram؛ معطّل لـ Slack (يتطلب Slack إنشاء أمر شرطة مائلة لكل skill). عيّن `channels.discord.commands.nativeSkills` أو `channels.telegram.commands.nativeSkills` أو `channels.slack.commands.nativeSkills` للتجاوز لكل مزوّد (قيمة منطقية أو `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  يفعّل `! <cmd>` لتشغيل أوامر صدفة المضيف (`/bash <cmd>` اسم مستعار؛ يتطلب قوائم سماح `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  يتحكم في مدة انتظار bash قبل التحويل إلى وضع الخلفية (`0` ينقلها إلى الخلفية فورًا).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  يفعّل `/config` (يقرأ/يكتب `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  يفعّل `/mcp` (يقرأ/يكتب إعدادات MCP التي يديرها OpenClaw ضمن `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  يفعّل `/plugins` (اكتشاف Plugin/حالته إضافة إلى عناصر التحكم في التثبيت والتمكين/التعطيل).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  يفعّل `/debug` (تجاوزات وقت التشغيل فقط).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  يفعّل `/restart` إضافة إلى إجراءات أداة إعادة تشغيل Gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  يعيّن قائمة سماح المالك الصريحة لأسطح الأوامر/الأدوات الخاصة بالمالك فقط. هذا هو حساب المشغّل البشري الذي يمكنه الموافقة على الإجراءات الخطرة وتشغيل أوامر مثل `/diagnostics` و`/export-trajectory` و`/config`. وهو منفصل عن `commands.allowFrom` وعن وصول اقتران الرسائل المباشرة.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  لكل قناة: يجعل الأوامر الخاصة بالمالك فقط تتطلب **هوية المالك** لتعمل على ذلك السطح. عندما تكون `true`، يجب أن يطابق المرسل إما مرشح مالك محلولًا (مثل إدخال في `commands.ownerAllowFrom` أو بيانات تعريف مالك أصلية من المزوّد) أو أن يمتلك نطاق `operator.admin` الداخلي على قناة رسائل داخلية. لا يكفي إدخال بدل في `allowFrom` الخاصة بالقناة، أو قائمة مرشحي مالك فارغة/غير محلولة — تفشل الأوامر الخاصة بالمالك فقط بوضع مغلق على تلك القناة. اترك هذا معطّلًا إذا أردت أن تكون الأوامر الخاصة بالمالك فقط محكومة بـ `ownerAllowFrom` وقوائم سماح الأوامر القياسية فقط.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  يتحكم في كيفية ظهور معرّفات المالك في مطالبة النظام.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  يعيّن اختياريًا سر HMAC المستخدم عندما تكون `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  قائمة سماح لكل مزوّد لتخويل الأوامر. عند تكوينها، تكون مصدر التخويل الوحيد للأوامر والتوجيهات (تُتجاهل قوائم سماح/اقتران القنوات و`commands.useAccessGroups`). استخدم `"*"` كافتراضي عام؛ وتتجاوزه المفاتيح الخاصة بالمزوّد.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  يفرض قوائم السماح/السياسات للأوامر عندما لا يكون `commands.allowFrom` معيّنًا.
</ParamField>

## قائمة الأوامر

مصدر الحقيقة الحالي:

- تأتي الأوامر المضمنة الأساسية من `src/auto-reply/commands-registry.shared.ts`
- تأتي أوامر الرصيف المولّدة من `src/auto-reply/commands-registry.data.ts`
- تأتي أوامر Plugin من استدعاءات `registerCommand()` الخاصة بالـ Plugin
- لا يزال التوفر الفعلي على Gateway لديك يعتمد على أعلام الإعدادات وسطح القناة والـ Plugins المثبتة/الممكّنة

### الأوامر الأساسية المضمنة

<AccordionGroup>
  <Accordion title="Sessions and runs">
    - يبدأ `/new [model]` جلسة جديدة؛ و`/reset` هو اسم إعادة التعيين المستعار.
    - تعترض Control UI النص المكتوب `/new` لإنشاء جلسة لوحة معلومات جديدة والتبديل إليها؛ أما النص المكتوب `/reset` فيظل يشغّل إعادة التعيين الموضعية في Gateway.
    - يحافظ `/reset soft [message]` على النص الحالي، ويسقط معرّفات جلسات واجهة CLI الخلفية المعاد استخدامها، ويعيد تشغيل تحميل بدء التشغيل/مطالبة النظام في الموضع.
    - يضغط `/compact [instructions]` سياق الجلسة. راجع [Compaction](/ar/concepts/compaction).
    - يجهض `/stop` التشغيل الحالي.
    - يدير `/session idle <duration|off>` و`/session max-age <duration|off>` انتهاء صلاحية ربط سلسلة المحادثة.
    - يصدّر `/export-session [path]` الجلسة الحالية إلى HTML. الاسم المستعار: `/export`.
    - يطلب `/export-trajectory [path]` موافقة exec، ثم يصدّر [حزمة مسار](/ar/tools/trajectory) JSONL للجلسة الحالية. استخدمه عندما تحتاج إلى الخط الزمني للمطالبة والأداة والنص لجلسة OpenClaw واحدة. في محادثات المجموعات، تنتقل مطالبة الموافقة ونتيجة التصدير إلى المالك بشكل خاص. الاسم المستعار: `/trajectory`.

  </Accordion>
  <Accordion title="Model and run controls">
    - يعيّن `/think <level>` مستوى التفكير. تأتي الخيارات من ملف مزوّد النموذج النشط؛ المستويات الشائعة هي `off` و`minimal` و`low` و`medium` و`high`، مع مستويات مخصصة مثل `xhigh` أو `adaptive` أو `max` أو الثنائية `on` فقط حيث تكون مدعومة. الأسماء المستعارة: `/thinking`، `/t`.
    - يبدّل `/verbose on|off|full` الإخراج المطوّل. الاسم المستعار: `/v`.
    - يبدّل `/trace on|off` إخراج تتبع Plugin للجلسة الحالية.
    - يعرض `/fast [status|on|off]` الوضع السريع أو يعيّنه.
    - يبدّل `/reasoning [on|off|stream]` ظهور الاستدلال. الاسم المستعار: `/reason`.
    - يبدّل `/elevated [on|off|ask|full]` الوضع المرتفع. الاسم المستعار: `/elev`.
    - يعرض `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` افتراضيات exec أو يعيّنها.
    - يعرض `/model [name|#|status]` النموذج أو يعيّنه.
    - يسرد `/models [provider] [page] [limit=<n>|size=<n>|all]` المزوّدين أو النماذج المكوّنة/المتاحة بالمصادقة لمزوّد؛ أضف `all` لتصفح الفهرس الكامل لذلك المزوّد.
    - يدير `/queue <mode>` سلوك قائمة الانتظار (`steer`، و`queue` القديم، و`followup`، و`collect`، و`steer-backlog`، و`interrupt`) إضافة إلى خيارات مثل `debounce:0.5s cap:25 drop:summarize`؛ يمسح `/queue default` أو `/queue reset` تجاوز الجلسة. راجع [قائمة انتظار الأوامر](/ar/concepts/queue) و[قائمة انتظار التوجيه](/ar/concepts/queue-steering).
    - يحقن `/steer <message>` إرشادًا في التشغيل النشط للجلسة الحالية، بشكل مستقل عن وضع `/queue`. لا يبدأ تشغيلًا جديدًا عندما تكون الجلسة خاملة. الاسم المستعار: `/tell`. راجع [التوجيه](/ar/tools/steer).

  </Accordion>
  <Accordion title="Discovery and status">
    - يعرض `/help` ملخص المساعدة القصير.
    - يعرض `/commands` فهرس الأوامر المولّد.
    - يعرض `/tools [compact|verbose]` ما يمكن للوكيل الحالي استخدامه الآن.
    - يعرض `/status` حالة التنفيذ/وقت التشغيل، ووقت تشغيل Gateway والنظام، إضافة إلى استخدام/حصة المزوّد عند توفرها.
    - `/diagnostics [note]` هو تدفق تقرير الدعم الخاص بالمالك فقط لأخطاء Gateway وتشغيلات حزمة Codex. يطلب موافقة exec صريحة كل مرة قبل تشغيل `openclaw gateway diagnostics export --json`؛ لا توافق على التشخيصات بقاعدة سماح للجميع. بعد الموافقة، يرسل تقريرًا قابلًا للصق يتضمن مسار الحزمة المحلي، وملخص البيان، وملاحظات الخصوصية، ومعرّفات الجلسات ذات الصلة. في محادثات المجموعات، تنتقل مطالبة الموافقة والتقرير إلى المالك بشكل خاص. عندما تستخدم الجلسة النشطة حزمة OpenAI Codex، ترسل الموافقة نفسها أيضًا ملاحظات Codex ذات الصلة إلى خوادم OpenAI، وتدرج الاستجابة المكتملة معرّفات جلسات OpenClaw، ومعرّفات سلاسل Codex، وأوامر `codex resume <thread-id>`. راجع [تصدير التشخيصات](/ar/gateway/diagnostics).
    - يشغّل `/crestodian <request>` مساعد إعداد Crestodian وإصلاحه من رسالة مباشرة مع المالك.
    - يسرد `/tasks` المهام الخلفية النشطة/الأخيرة للجلسة الحالية.
    - يشرح `/context [list|detail|json]` كيفية تجميع السياق.
    - يعرض `/whoami` معرّف المرسل الخاص بك. الاسم المستعار: `/id`.
    - يتحكم `/usage off|tokens|full|cost` في تذييل الاستخدام لكل استجابة أو يطبع ملخص تكلفة محليًا.

  </Accordion>
  <Accordion title="Skills, allowlists, approvals">
    - يشغّل `/skill <name> [input]` Skill حسب الاسم.
    - يدير `/allowlist [list|add|remove] ...` إدخالات قائمة السماح. نص فقط.
    - يحل `/approve <id> <decision>` مطالبات موافقة exec.
    - يطرح `/btw <question>` سؤالًا جانبيًا دون تغيير سياق الجلسة المستقبلي. الاسم المستعار: `/side`. راجع [BTW](/ar/tools/btw).

  </Accordion>
  <Accordion title="Subagents and ACP">
    - يدير `/subagents list|kill|log|info|send|steer|spawn` تشغيلات الوكلاء الفرعيين للجلسة الحالية.
    - يدير `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` جلسات ACP وخيارات وقت التشغيل.
    - يربط `/focus <target>` سلسلة Discord الحالية أو موضوع/محادثة Telegram بهدف جلسة.
    - يزيل `/unfocus` الربط الحالي.
    - يعرض `/agents` الوكلاء المرتبطين بالسلسلة للجلسة الحالية.
    - يجهض `/kill <id|#|all>` وكيلا فرعيا واحدا قيد التشغيل أو جميع الوكلاء الفرعيين قيد التشغيل.
    - يرسل `/subagents steer <id|#> <message>` توجيها إلى وكيل فرعي قيد التشغيل. راجع [التوجيه](/ar/tools/steer).

  </Accordion>
  <Accordion title="Owner-only writes and admin">
    - يقرأ `/config show|get|set|unset` أو يكتب `openclaw.json`. للمالك فقط. يتطلب `commands.config: true`.
    - يقرأ `/mcp show|get|set|unset` أو يكتب إعداد خادم MCP المُدار بواسطة OpenClaw تحت `mcp.servers`. للمالك فقط. يتطلب `commands.mcp: true`.
    - يفحص `/plugins list|inspect|show|get|install|enable|disable` حالة Plugin أو يعدلها. `/plugin` اسم مستعار. الكتابة للمالك فقط. يتطلب `commands.plugins: true`.
    - يدير `/debug show|set|unset|reset` تجاوزات الإعداد الخاصة بوقت التشغيل فقط. للمالك فقط. يتطلب `commands.debug: true`.
    - يعيد `/restart` تشغيل OpenClaw عند تفعيله. الافتراضي: مفعّل؛ اضبط `commands.restart: false` لتعطيله.
    - يضبط `/send on|off|inherit` سياسة الإرسال. للمالك فقط.

  </Accordion>
  <Accordion title="Voice, TTS, channel control">
    - يتحكم `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` في TTS. راجع [TTS](/ar/tools/tts).
    - يضبط `/activation mention|always` وضع تفعيل المجموعة.
    - يشغل `/bash <command>` أمرا في صدفة المضيف. نصي فقط. الاسم المستعار: `! <command>`. يتطلب `commands.bash: true` بالإضافة إلى قوائم السماح `tools.elevated`.
    - يتحقق `!poll [sessionId]` من مهمة bash في الخلفية.
    - يوقف `!stop [sessionId]` مهمة bash في الخلفية.

  </Accordion>
</AccordionGroup>

### أوامر الإرساء المولّدة

تبدّل أوامر الإرساء مسار رد الجلسة الحالية إلى قناة أخرى مرتبطة.
راجع [إرساء القنوات](/ar/concepts/channel-docking) للإعداد،
والأمثلة، واستكشاف الأخطاء وإصلاحها.

تُنشأ أوامر الإرساء من Plugins القنوات التي تدعم الأوامر الأصلية. المجموعة المضمنة الحالية:

- `/dock-discord` (الاسم المستعار: `/dock_discord`)
- `/dock-mattermost` (الاسم المستعار: `/dock_mattermost`)
- `/dock-slack` (الاسم المستعار: `/dock_slack`)
- `/dock-telegram` (الاسم المستعار: `/dock_telegram`)

استخدم أوامر الإرساء من دردشة مباشرة لتبديل مسار رد الجلسة الحالية إلى قناة أخرى مرتبطة. يحتفظ الوكيل بسياق الجلسة نفسه، لكن الردود المستقبلية لتلك الجلسة تُسلَّم إلى نظير القناة المحدد.

تتطلب أوامر الإرساء `session.identityLinks`. يجب أن يكون المرسل المصدر والنظير الهدف ضمن مجموعة الهوية نفسها، على سبيل المثال `["telegram:123", "discord:456"]`. إذا أرسل مستخدم Telegram بالمعرّف `123` الأمر `/dock_discord`، يخزن OpenClaw `lastChannel: "discord"` و`lastTo: "456"` في الجلسة النشطة. إذا لم يكن المرسل مرتبطا بنظير Discord، يرد الأمر بتلميح إعداد بدلا من الانتقال إلى الدردشة العادية.

يغيّر الإرساء مسار الجلسة النشطة فقط. لا ينشئ حسابات قنوات، ولا يمنح وصولا، ولا يتجاوز قوائم سماح القنوات، ولا ينقل سجل النص إلى جلسة أخرى. استخدم `/dock-telegram` أو `/dock-slack` أو `/dock-mattermost` أو أمرا آخر مولدا للإرساء لتبديل المسار مرة أخرى.

### أوامر Plugins المضمنة

يمكن أن تضيف Plugins المضمنة مزيدا من أوامر الشرطة المائلة. الأوامر المضمنة الحالية في هذا المستودع:

- يبدّل `/dreaming [on|off|status|help]` Dreaming الذاكرة. راجع [Dreaming](/ar/concepts/dreaming).
- يدير `/pair [qr|status|pending|approve|cleanup|notify]` مسار إقران/إعداد الجهاز. راجع [الإقران](/ar/channels/pairing).
- يسلّح `/phone status|arm <camera|screen|writes|all> [duration]|disarm` أوامر عقدة الهاتف عالية المخاطر مؤقتا.
- يدير `/voice status|list [limit]|set <voiceId|name>` إعداد صوت Talk. في Discord، اسم الأمر الأصلي هو `/talkvoice`.
- يرسل `/card ...` إعدادات مسبقة لبطاقات LINE الغنية. راجع [LINE](/ar/channels/line).
- يفحص `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` ويتحكم في مشغل خادم تطبيق Codex المضمن. راجع [مشغل Codex](/ar/plugins/codex-harness).
- أوامر QQBot فقط:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### أوامر Skills الديناميكية

تُعرض Skills التي يمكن للمستخدم استدعاؤها أيضا كأوامر شرطة مائلة:

- يعمل `/skill <name> [input]` دائما كنقطة دخول عامة.
- قد تظهر Skills أيضا كأوامر مباشرة مثل `/prose` عندما تسجلها Skill/Plugin.
- يتحكم `commands.nativeSkills` و`channels.<provider>.commands.nativeSkills` في تسجيل أوامر Skills الأصلية.
- يمكن لمواصفات الأوامر توفير `descriptionLocalizations` للأسطح الأصلية التي تدعم الأوصاف المترجمة، بما في ذلك Discord.

<AccordionGroup>
  <Accordion title="Argument and parser notes">
    - تقبل الأوامر علامة `:` اختيارية بين الأمر والوسائط (مثل `/think: high`، و`/send: on`، و`/help:`).
    - يقبل `/new <model>` اسما مستعارا للنموذج، أو `provider/model`، أو اسم موفر (مطابقة تقريبية)؛ وإذا لم توجد مطابقة، يُعامل النص على أنه متن الرسالة.
    - للحصول على تفصيل كامل لاستخدام الموفر، استخدم `openclaw status --usage`.
    - يتطلب `/allowlist add|remove` الإعداد `commands.config=true` ويحترم `configWrites` الخاصة بالقناة.
    - في القنوات متعددة الحسابات، تحترم أيضا أوامر `/allowlist --account <id>` الموجهة للإعداد و`/config set channels.<provider>.accounts.<id>...` قيمة `configWrites` للحساب الهدف.
    - يتحكم `/usage` في تذييل الاستخدام لكل رد؛ يطبع `/usage cost` ملخص تكلفة محليا من سجلات جلسات OpenClaw.
    - يكون `/restart` مفعلا افتراضيا؛ اضبط `commands.restart: false` لتعطيله.
    - يقبل `/plugins install <spec>` مواصفات Plugin نفسها التي يقبلها `openclaw plugins install`: مسار/أرشيف محلي، حزمة npm، أو `git:<repo>`، أو `clawhub:<pkg>`، ثم يطلب إعادة تشغيل Gateway لأن وحدات مصدر Plugin تغيّرت.
    - يحدّث `/plugins enable|disable` إعداد Plugin ويشغّل إعادة تحميل Plugins في Gateway للدورات الجديدة للوكيل.

  </Accordion>
  <Accordion title="Channel-specific behavior">
    - أمر أصلي خاص بـ Discord فقط: يتحكم `/vc join|leave|status` في قنوات الصوت (غير متاح كنص). يتطلب `join` خادما وقناة صوت/منصة محددة. يتطلب `channels.discord.voice` والأوامر الأصلية.
    - تتطلب أوامر ربط سلاسل Discord (`/focus`، و`/unfocus`، و`/agents`، و`/session idle`، و`/session max-age`) تفعيل روابط السلاسل الفعلية (`session.threadBindings.enabled` و/أو `channels.discord.threadBindings.enabled`).
    - مرجع أوامر ACP وسلوك وقت التشغيل: [وكلاء ACP](/ar/tools/acp-agents).

  </Accordion>
  <Accordion title="Verbose / trace / fast / reasoning safety">
    - الغرض من `/verbose` هو التصحيح وتوفير رؤية إضافية؛ أبقه **متوقفا** في الاستخدام العادي.
    - `/trace` أضيق من `/verbose`: فهو يكشف فقط أسطر التتبع/التصحيح المملوكة لـ Plugin ويبقي ثرثرة الأدوات التفصيلية العادية متوقفة.
    - يحفظ `/fast on|off` تجاوزا للجلسة. استخدم خيار `inherit` في واجهة جلسات المستخدم لمسحه والعودة إلى الإعدادات الافتراضية.
    - يعتمد `/fast` على الموفر: تربطه OpenAI/OpenAI Codex بـ `service_tier=priority` على نقاط نهاية Responses الأصلية، بينما تربطه طلبات Anthropic العامة المباشرة، بما في ذلك الحركة الموثقة عبر OAuth والمُرسلة إلى `api.anthropic.com`، بـ `service_tier=auto` أو `standard_only`. راجع [OpenAI](/ar/providers/openai) و[Anthropic](/ar/providers/anthropic).
    - تظل ملخصات فشل الأدوات ظاهرة عند اللزوم، لكن نص الفشل التفصيلي لا يُدرج إلا عندما يكون `/verbose` على `on` أو `full`.
    - تُعد `/reasoning` و`/verbose` و`/trace` محفوفة بالمخاطر في إعدادات المجموعات: فقد تكشف عن استدلال داخلي، أو مخرجات أدوات، أو تشخيصات Plugin لم تكن تقصد عرضها. يفضل إبقاؤها متوقفة، خصوصا في دردشات المجموعات.

  </Accordion>
  <Accordion title="Model switching">
    - يحفظ `/model` نموذج الجلسة الجديد فورا.
    - إذا كان الوكيل خاملا، يستخدمه التشغيل التالي على الفور.
    - إذا كان هناك تشغيل نشط بالفعل، يضع OpenClaw علامة على التبديل الحي كقيد الانتظار ولا يعيد التشغيل بالنموذج الجديد إلا عند نقطة إعادة محاولة نظيفة.
    - إذا كان نشاط الأدوات أو إخراج الرد قد بدأ بالفعل، فقد يبقى التبديل المعلّق في قائمة الانتظار حتى فرصة إعادة محاولة لاحقة أو دور المستخدم التالي.
    - في TUI المحلي، يعيد `/crestodian [request]` من TUI الوكيل العادي إلى Crestodian. هذا منفصل عن وضع الإنقاذ لقنوات الرسائل ولا يمنح صلاحية إعداد عن بعد.

  </Accordion>
  <Accordion title="Fast path and inline shortcuts">
    - **المسار السريع:** تُعالج الرسائل التي تحتوي على أوامر فقط من المرسلين المدرجين في قائمة السماح فورا (تتجاوز قائمة الانتظار + النموذج).
    - **بوابة ذكر المجموعة:** تتجاوز الرسائل التي تحتوي على أوامر فقط من المرسلين المدرجين في قائمة السماح متطلبات الذكر.
    - **الاختصارات المضمنة (للمرسلين المدرجين في قائمة السماح فقط):** تعمل بعض الأوامر أيضا عند تضمينها في رسالة عادية وتُزال قبل أن يرى النموذج النص المتبقي.
      - مثال: يشغّل `hey /status` ردا بالحالة، ويستمر النص المتبقي عبر المسار العادي.
    - حاليا: `/help`، و`/commands`، و`/status`، و`/whoami` (`/id`).
    - تُتجاهل الرسائل غير المصرح بها التي تحتوي على أوامر فقط بصمت، وتُعامل رموز `/...` المضمنة كنص عادي.

  </Accordion>
  <Accordion title="Skill commands and native arguments">
    - **أوامر Skills:** تُعرض Skills ذات `user-invocable` كأوامر شرطة مائلة. تُنقّى الأسماء إلى `a-z0-9_` (بحد أقصى 32 حرفا)؛ وتحصل التعارضات على لواحق رقمية (مثل `_2`).
      - يشغّل `/skill <name> [input]` Skill بالاسم (مفيد عندما تمنع حدود الأوامر الأصلية إنشاء أوامر لكل Skill).
      - افتراضيا، تُمرر أوامر Skills إلى النموذج كطلب عادي.
      - يمكن لـ Skills اختياريا إعلان `command-dispatch: tool` لتوجيه الأمر مباشرة إلى أداة (حتمي، بلا نموذج).
      - مثال: `/prose` (OpenProse plugin) — راجع [OpenProse](/ar/prose).
    - **وسائط الأوامر الأصلية:** يستخدم Discord الإكمال التلقائي للخيارات الديناميكية (وقوائم الأزرار عند حذف الوسائط المطلوبة). يعرض Telegram وSlack قائمة أزرار عندما يدعم أمر ما الاختيارات وتحذف الوسيطة. تُحل الاختيارات الديناميكية مقابل نموذج الجلسة الهدف، لذلك تتبع الخيارات الخاصة بالنموذج مثل مستويات `/think` تجاوز `/model` لتلك الجلسة.

  </Accordion>
</AccordionGroup>

## `/tools`

يجيب `/tools` عن سؤال وقت التشغيل، وليس سؤال إعداد: **ما الذي يمكن لهذا الوكيل استخدامه الآن في هذه المحادثة**.

- يكون `/tools` الافتراضي موجزا ومحسنا للمسح السريع.
- يضيف `/tools verbose` أوصافا قصيرة.
- تعرض أسطح الأوامر الأصلية التي تدعم الوسائط مفتاح تبديل الوضع نفسه مثل `compact|verbose`.
- تكون النتائج محصورة بنطاق الجلسة، لذلك قد يغيّر تغيير الوكيل أو القناة أو السلسلة أو تفويض المرسل أو النموذج الإخراج.
- يتضمن `/tools` الأدوات التي يمكن الوصول إليها فعليا في وقت التشغيل، بما في ذلك الأدوات الأساسية، وأدوات Plugins المتصلة، والأدوات المملوكة للقنوات.

لتحرير الملفات الشخصية والتجاوزات، استخدم لوحة أدوات واجهة التحكم أو أسطح الإعداد/الفهرس بدلا من التعامل مع `/tools` كفهرس ثابت.

## أسطح الاستخدام (ما يظهر وأين)

- يظهر **استخدام/حصة المزوّد** (مثال: "Claude 80% متبقٍ") في `/status` لمزوّد النموذج الحالي عند تفعيل تتبّع الاستخدام. يطبّع OpenClaw نوافذ المزوّدين إلى `% متبقٍ`؛ وبالنسبة إلى MiniMax، تُعكس حقول النسبة المئوية الخاصة بالمتبقي فقط قبل العرض، وتفضّل استجابات `model_remains` إدخال نموذج الدردشة مع تسمية خطة موسومة بالنموذج.
- يمكن أن تعود **أسطر الرموز/ذاكرة التخزين المؤقت** في `/status` إلى أحدث إدخال استخدام في السجل عندما تكون لقطة الجلسة الحية قليلة البيانات. تظل القيم الحية غير الصفرية الحالية هي المعتمدة، ويمكن لاحتياطي السجل أيضًا استعادة تسمية نموذج وقت التشغيل النشط مع إجمالي أكبر موجّه للمطالبة عندما تكون الإجماليات المخزنة مفقودة أو أصغر.
- **التنفيذ مقابل وقت التشغيل:** يعرض `/status` قيمة `Execution` لمسار وضع الحماية الفعّال وقيمة `Runtime` لمن يشغّل الجلسة فعليًا: `OpenClaw Pi Default` أو `OpenAI Codex` أو خلفية CLI أو خلفية ACP.
- يتحكم `/usage off|tokens|full` في **الرموز/التكلفة لكل استجابة** (تُضاف إلى الردود العادية).
- يتعلق `/model status` بـ **النماذج/المصادقة/نقاط النهاية**، وليس الاستخدام.

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

- يعرض `/model` و`/model list` منتقيًا مرقمًا ومختصرًا (عائلة النموذج + المزوّدون المتاحون).
- في Discord، يفتح `/model` و`/models` منتقيًا تفاعليًا يحتوي على قوائم منسدلة للمزوّد والنموذج مع خطوة Submit.
- يختار `/model <#>` من ذلك المنتقي (ويفضّل المزوّد الحالي عندما يكون ذلك ممكنًا).
- يعرض `/model status` العرض التفصيلي، بما في ذلك نقطة نهاية المزوّد المهيأة (`baseUrl`) ووضع API (`api`) عند توفرهما.

## تجاوزات التصحيح

يتيح لك `/debug` ضبط تجاوزات إعدادات **خاصة بوقت التشغيل فقط** (في الذاكرة، وليس على القرص). للمالك فقط. معطل افتراضيًا؛ فعّله باستخدام `commands.debug: true`.

أمثلة:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
تُطبّق التجاوزات فورًا على قراءات الإعدادات الجديدة، لكنها لا تكتب إلى `openclaw.json`. استخدم `/debug reset` لمسح كل التجاوزات والعودة إلى الإعدادات المخزنة على القرص.
</Note>

## مخرجات تتبّع Plugin

يتيح لك `/trace` تبديل **أسطر تتبّع/تصحيح Plugin ضمن نطاق الجلسة** من دون تشغيل وضع الإسهاب الكامل.

أمثلة:

```text
/trace
/trace on
/trace off
```

ملاحظات:

- يعرض `/trace` من دون وسيطة حالة التتبّع الحالية للجلسة.
- يفعّل `/trace on` أسطر تتبّع Plugin للجلسة الحالية.
- يعطّلها `/trace off` مرة أخرى.
- يمكن أن تظهر أسطر تتبّع Plugin في `/status` وكراسلة تشخيص متابعة بعد رد المساعد العادي.
- لا يحل `/trace` محل `/debug`؛ لا يزال `/debug` يدير تجاوزات الإعدادات الخاصة بوقت التشغيل فقط.
- لا يحل `/trace` محل `/verbose`؛ لا تزال مخرجات الأدوات/الحالة الإسهابية العادية تابعة لـ `/verbose`.

## تحديثات الإعدادات

يكتب `/config` إلى إعداداتك المخزنة على القرص (`openclaw.json`). للمالك فقط. معطل افتراضيًا؛ فعّله باستخدام `commands.config: true`.

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

يكتب `/mcp` تعريفات خوادم MCP التي يديرها OpenClaw ضمن `mcp.servers`. للمالك فقط. معطل افتراضيًا؛ فعّله باستخدام `commands.mcp: true`.

أمثلة:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
يخزّن `/mcp` الإعدادات في إعدادات OpenClaw، وليس في إعدادات المشروع المملوكة لـ Pi. تحدد محولات وقت التشغيل وسائل النقل القابلة للتنفيذ فعليًا.
</Note>

## تحديثات Plugin

يتيح `/plugins` للمشغلين فحص Plugins المكتشفة وتبديل التفعيل في الإعدادات. يمكن للتدفقات للقراءة فقط استخدام `/plugin` كاسم بديل. معطل افتراضيًا؛ فعّله باستخدام `commands.plugins: true`.

أمثلة:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- يستخدم `/plugins list` و`/plugins show` اكتشاف Plugin الحقيقي مقابل مساحة العمل الحالية بالإضافة إلى الإعدادات المخزنة على القرص.
- يثبّت `/plugins install` من ClawHub وnpm وgit والأدلة المحلية والأرشيفات.
- يحدّث `/plugins enable|disable` إعدادات Plugin فقط؛ ولا يثبّت Plugins أو يزيل تثبيتها.
- تؤدي تغييرات التفعيل والتعطيل إلى إعادة تحميل ساخنة لأسطح وقت تشغيل Gateway الخاصة بـ Plugin لدورات الوكيل الجديدة؛ أما التثبيت فيطلب إعادة تشغيل Gateway لأن وحدات مصدر Plugin تغيّرت.

</Note>

## ملاحظات الأسطح

<AccordionGroup>
  <Accordion title="الجلسات لكل سطح">
    - تعمل **الأوامر النصية** في جلسة الدردشة العادية (تشارك الرسائل المباشرة `main`، وللمجموعات جلستها الخاصة).
    - تستخدم **الأوامر الأصلية** جلسات معزولة:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (يمكن تهيئة البادئة عبر `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (تستهدف جلسة الدردشة عبر `CommandTargetSessionKey`)
    - يستهدف **`/stop`** جلسة الدردشة النشطة حتى يتمكن من إيقاف التشغيل الحالي.

  </Accordion>
  <Accordion title="تفاصيل Slack">
    لا يزال `channels.slack.slashCommand` مدعومًا لأمر واحد بنمط `/openclaw`. إذا فعّلت `commands.native`، فيجب إنشاء أمر Slack slash واحد لكل أمر مدمج (بالأسماء نفسها كما في `/help`). تُسلَّم قوائم وسيطات الأوامر في Slack كأزرار Block Kit مؤقتة.

    استثناء Slack الأصلي: سجّل `/agentstatus` (وليس `/status`) لأن Slack يحجز `/status`. لا يزال نص `/status` يعمل في رسائل Slack.

  </Accordion>
</AccordionGroup>

## أسئلة BTW الجانبية

`/btw` هو **سؤال جانبي** سريع عن الجلسة الحالية. `/side` اسم بديل.

بخلاف الدردشة العادية:

- يستخدم الجلسة الحالية كسياق خلفي،
- يعمل كاستدعاء مستقل لمرة واحدة **بلا أدوات**،
- لا يغير سياق الجلسة المستقبلية،
- لا يُكتب في سجل المحادثة،
- يُسلَّم كنتيجة جانبية حية بدلًا من رسالة مساعد عادية.

وهذا يجعل `/btw` مفيدًا عندما تريد توضيحًا مؤقتًا بينما تستمر المهمة الرئيسية.

مثال:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

راجع [أسئلة BTW الجانبية](/ar/tools/btw) للاطلاع على السلوك الكامل وتفاصيل تجربة العميل.

## ذات صلة

- [إنشاء Skills](/ar/tools/creating-skills)
- [Skills](/ar/tools/skills)
- [إعدادات Skills](/ar/tools/skills-config)

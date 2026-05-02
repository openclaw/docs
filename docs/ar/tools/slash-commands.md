---
read_when:
    - استخدام أو تهيئة أوامر الدردشة
    - استكشاف أخطاء توجيه الأوامر أو الأذونات وإصلاحها
sidebarTitle: Slash commands
summary: 'أوامر الشرطة المائلة: النصية مقابل الأصلية، التكوين، والأوامر المدعومة'
title: أوامر الشرطة المائلة
x-i18n:
    generated_at: "2026-05-02T07:46:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00a00619cc0eff25b81b475eab5b0b3d808bf067e6e004a491a90ec3982149b7
    source_path: tools/slash-commands.md
    workflow: 16
---

تتعامل Gateway مع الأوامر. يجب إرسال معظم الأوامر كرسالة **مستقلة** تبدأ بـ `/`. يستخدم أمر دردشة bash الخاص بالمضيف `! <cmd>` (مع `/bash <cmd>` كاسم مستعار).

عندما تكون محادثة أو سلسلة مرتبطة بجلسة ACP، يُوجَّه نص المتابعة العادي إلى حزام ACP ذلك. تظل أوامر إدارة Gateway محلية: يصل `/acp ...` دائمًا إلى معالج أوامر OpenClaw ACP، ويبقى `/status` مع `/unfocus` محليين كلما كانت معالجة الأوامر مفعلة للسطح.

يوجد نظامان مرتبطان:

<AccordionGroup>
  <Accordion title="Commands">
    رسائل `/...` المستقلة.
  </Accordion>
  <Accordion title="Directives">
    `/think`، `/fast`، `/verbose`، `/trace`، `/reasoning`، `/elevated`، `/exec`، `/model`، `/queue`.

    - تُزال التوجيهات من الرسالة قبل أن يراها النموذج.
    - في رسائل الدردشة العادية (وليست الرسائل المكوّنة من توجيهات فقط)، تُعامل على أنها "تلميحات مضمنة" ولا تستمر في إعدادات الجلسة.
    - في الرسائل المكوّنة من توجيهات فقط (تحتوي الرسالة على توجيهات فقط)، تستمر في الجلسة وترد بإقرار.
    - لا تُطبق التوجيهات إلا على **المرسلين المصرح لهم**. إذا كان `commands.allowFrom` مضبوطًا، فهو قائمة السماح الوحيدة المستخدمة؛ وإلا يأتي التفويض من قوائم سماح/إقران القنوات بالإضافة إلى `commands.useAccessGroups`. يرى المرسلون غير المصرح لهم التوجيهات كنص عادي.

  </Accordion>
  <Accordion title="Inline shortcuts">
    المرسلون الموجودون في قائمة السماح/المصرح لهم فقط: `/help`، `/commands`، `/status`، `/whoami` (`/id`).

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
  يسجل الأوامر الأصلية. تلقائي: مفعّل لـ Discord/Telegram؛ معطّل لـ Slack (حتى تضيف أوامر slash)؛ يُتجاهل للمزودين الذين لا يملكون دعمًا أصليًا. اضبط `channels.discord.commands.native` أو `channels.telegram.commands.native` أو `channels.slack.commands.native` للتجاوز لكل مزود (قيمة منطقية أو `"auto"`). تمسح `false` الأوامر المسجلة سابقًا على Discord/Telegram عند بدء التشغيل. تُدار أوامر Slack في تطبيق Slack ولا تُزال تلقائيًا.
</ParamField>
على Discord، قد تتضمن مواصفات الأوامر الأصلية `descriptionLocalizations`، والتي ينشرها OpenClaw كـ `description_localizations` ويتضمنها في مقارنات التوفيق.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  يسجل أوامر **Skills** أصليًا عند دعمها. تلقائي: مفعّل لـ Discord/Telegram؛ معطّل لـ Slack (يتطلب Slack إنشاء أمر slash لكل مهارة). اضبط `channels.discord.commands.nativeSkills` أو `channels.telegram.commands.nativeSkills` أو `channels.slack.commands.nativeSkills` للتجاوز لكل مزود (قيمة منطقية أو `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  يفعّل `! <cmd>` لتشغيل أوامر صدفة المضيف (`/bash <cmd>` اسم مستعار؛ يتطلب قوائم سماح `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  يتحكم في مدة انتظار bash قبل التحول إلى وضع الخلفية (`0` يضعه في الخلفية فورًا).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  يفعّل `/config` (يقرأ/يكتب `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  يفعّل `/mcp` (يقرأ/يكتب إعداد MCP المُدار من OpenClaw ضمن `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  يفعّل `/plugins` (اكتشاف/حالة Plugin بالإضافة إلى عناصر تحكم التثبيت + التمكين/التعطيل).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  يفعّل `/debug` (تجاوزات وقت التشغيل فقط).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  يفعّل `/restart` بالإضافة إلى إجراءات أداة إعادة تشغيل Gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  يضبط قائمة السماح الصريحة للمالك لأسطح الأوامر/الأدوات الخاصة بالمالك فقط. هذا هو حساب المشغل البشري الذي يمكنه الموافقة على الإجراءات الخطرة وتشغيل أوامر مثل `/diagnostics` و`/export-trajectory` و`/config`. وهو منفصل عن `commands.allowFrom` وعن وصول إقران الرسائل الخاصة.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  لكل قناة: يجعل أوامر المالك فقط تتطلب **هوية المالك** للتشغيل على ذلك السطح. عندما تكون `true`، يجب أن يطابق المرسل إما مرشح مالك تم حله (مثل إدخال في `commands.ownerAllowFrom` أو بيانات تعريف مالك أصلية لدى المزود) أو يمتلك نطاق `operator.admin` داخليًا على قناة رسائل داخلية. إدخال wildcard في `allowFrom` للقناة، أو قائمة مرشحي مالك فارغة/غير محلولة، **ليس** كافيًا — تفشل أوامر المالك فقط مغلقة على تلك القناة. اترك هذا معطّلًا إذا كنت تريد حراسة أوامر المالك فقط عبر `ownerAllowFrom` وقوائم سماح الأوامر القياسية فقط.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  يتحكم في كيفية ظهور معرفات المالك في مطالبة النظام.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  يضبط اختياريًا سر HMAC المستخدم عندما يكون `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  قائمة سماح لكل مزود لتفويض الأوامر. عند ضبطها، تكون مصدر التفويض الوحيد للأوامر والتوجيهات (تُتجاهل قوائم سماح/إقران القنوات و`commands.useAccessGroups`). استخدم `"*"` كإعداد افتراضي عام؛ وتتجاوزه المفاتيح الخاصة بالمزود.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  يفرض قوائم السماح/السياسات للأوامر عندما لا يكون `commands.allowFrom` مضبوطًا.
</ParamField>

## قائمة الأوامر

مصدر الحقيقة الحالي:

- تأتي المضمنات الأساسية من `src/auto-reply/commands-registry.shared.ts`
- تأتي أوامر dock المولدة من `src/auto-reply/commands-registry.data.ts`
- تأتي أوامر Plugin من استدعاءات `registerCommand()` الخاصة بـ Plugin
- لا يزال التوفر الفعلي على gateway لديك يعتمد على أعلام الإعداد وسطح القناة وPlugin المثبتة/المفعلة

### الأوامر الأساسية المضمنة

<AccordionGroup>
  <Accordion title="Sessions and runs">
    - يبدأ `/new [model]` جلسة جديدة؛ و`/reset` هو الاسم المستعار لإعادة الضبط.
    - يحافظ `/reset soft [message]` على النص الحالي، ويتخلى عن معرفات جلسات خلفية CLI المعاد استخدامها، ويعيد تشغيل تحميل بدء التشغيل/مطالبة النظام في مكانه.
    - يضغط `/compact [instructions]` سياق الجلسة. راجع [Compaction](/ar/concepts/compaction).
    - يجهض `/stop` التشغيل الحالي.
    - يدير `/session idle <duration|off>` و`/session max-age <duration|off>` انتهاء صلاحية ربط السلاسل.
    - يصدّر `/export-session [path]` الجلسة الحالية إلى HTML. الاسم المستعار: `/export`.
    - يطلب `/export-trajectory [path]` موافقة exec، ثم يصدّر [حزمة مسار](/ar/tools/trajectory) JSONL للجلسة الحالية. استخدمه عندما تحتاج إلى الجدول الزمني للمطالبة والأدوات والنص لجلسة OpenClaw واحدة. في دردشات المجموعات، تذهب مطالبة الموافقة ونتيجة التصدير إلى المالك بشكل خاص. الاسم المستعار: `/trajectory`.

  </Accordion>
  <Accordion title="Model and run controls">
    - يضبط `/think <level>` مستوى التفكير. تأتي الخيارات من ملف تعريف مزود النموذج النشط؛ المستويات الشائعة هي `off` و`minimal` و`low` و`medium` و`high`، مع مستويات مخصصة مثل `xhigh` أو `adaptive` أو `max`، أو `on` ثنائي فقط حيث يكون مدعومًا. الأسماء المستعارة: `/thinking`، `/t`.
    - يبدل `/verbose on|off|full` الإخراج المطول. الاسم المستعار: `/v`.
    - يبدل `/trace on|off` إخراج تتبع Plugin للجلسة الحالية.
    - يعرض `/fast [status|on|off]` أو يضبط الوضع السريع.
    - يبدل `/reasoning [on|off|stream]` رؤية الاستدلال. الاسم المستعار: `/reason`.
    - يبدل `/elevated [on|off|ask|full]` الوضع المرتفع. الاسم المستعار: `/elev`.
    - يعرض `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` أو يضبط الإعدادات الافتراضية لـ exec.
    - يعرض `/model [name|#|status]` أو يضبط النموذج.
    - يسرد `/models [provider] [page] [limit=<n>|size=<n>|all]` المزودين أو النماذج المضبوطة/المتاحة بالمصادقة لمزود؛ أضف `all` لتصفح الفهرس الكامل لذلك المزود.
    - يدير `/queue <mode>` سلوك قائمة الانتظار (`steer`، و`queue` القديم، و`followup`، و`collect`، و`steer-backlog`، و`interrupt`) بالإضافة إلى خيارات مثل `debounce:0.5s cap:25 drop:summarize`؛ يمسح `/queue default` أو `/queue reset` تجاوز الجلسة. راجع [قائمة انتظار الأوامر](/ar/concepts/queue) و[قائمة انتظار التوجيه](/ar/concepts/queue-steering).

  </Accordion>
  <Accordion title="Discovery and status">
    - يعرض `/help` ملخص المساعدة القصير.
    - يعرض `/commands` فهرس الأوامر المولد.
    - يعرض `/tools [compact|verbose]` ما يستطيع الوكيل الحالي استخدامه الآن.
    - يعرض `/status` حالة التنفيذ/وقت التشغيل، بما في ذلك تسميات `Execution`/`Runtime` واستخدام/حصة المزود عند توفرها.
    - `/diagnostics [note]` هو تدفق تقرير الدعم الخاص بالمالك فقط لأخطاء Gateway وتشغيلات حزام Codex. يطلب موافقة exec صريحة في كل مرة قبل تشغيل `openclaw gateway diagnostics export --json`؛ لا توافق على التشخيصات بقاعدة السماح للكل. بعد الموافقة، يرسل تقريرًا قابلًا للصق يتضمن مسار الحزمة المحلي وملخص البيان وملاحظات الخصوصية ومعرفات الجلسات ذات الصلة. في دردشات المجموعات، تذهب مطالبة الموافقة والتقرير إلى المالك بشكل خاص. عندما تستخدم الجلسة النشطة حزام OpenAI Codex، ترسل الموافقة نفسها أيضًا ملاحظات Codex ذات الصلة إلى خوادم OpenAI، وتسرد الاستجابة المكتملة معرفات جلسات OpenClaw ومعرفات سلاسل Codex وأوامر `codex resume <thread-id>`. راجع [تصدير التشخيصات](/ar/gateway/diagnostics).
    - يشغل `/crestodian <request>` مساعد إعداد وإصلاح Crestodian من رسالة خاصة للمالك.
    - يسرد `/tasks` مهام الخلفية النشطة/الأخيرة للجلسة الحالية.
    - يشرح `/context [list|detail|json]` كيفية تجميع السياق.
    - يعرض `/whoami` معرف المرسل الخاص بك. الاسم المستعار: `/id`.
    - يتحكم `/usage off|tokens|full|cost` في تذييل الاستخدام لكل استجابة أو يطبع ملخص تكلفة محليًا.

  </Accordion>
  <Accordion title="Skills, allowlists, approvals">
    - يشغل `/skill <name> [input]` Skill بالاسم.
    - يدير `/allowlist [list|add|remove] ...` إدخالات قائمة السماح. نص فقط.
    - يحل `/approve <id> <decision>` مطالبات موافقة exec.
    - يطرح `/btw <question>` سؤالًا جانبيًا دون تغيير سياق الجلسة المستقبلي. راجع [BTW](/ar/tools/btw).

  </Accordion>
  <Accordion title="Subagents and ACP">
    - يدير `/subagents list|kill|log|info|send|steer|spawn` تشغيلات الوكلاء الفرعيين للجلسة الحالية.
    - يدير `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` جلسات ACP وخيارات وقت التشغيل.
    - يربط `/focus <target>` سلسلة Discord الحالية أو موضوع/محادثة Telegram بهدف جلسة.
    - يزيل `/unfocus` الربط الحالي.
    - يسرد `/agents` الوكلاء المرتبطين بالسلسلة للجلسة الحالية.
    - يجهض `/kill <id|#|all>` وكيلًا فرعيًا قيد التشغيل أو جميعها.
    - يرسل `/steer <id|#> <message>` توجيهًا إلى وكيل فرعي قيد التشغيل. الاسم المستعار: `/tell`.

  </Accordion>
  <Accordion title="كتابات المالك فقط والإدارة">
    - يقرأ أو يكتب `/config show|get|set|unset` ملف `openclaw.json`. للمالك فقط. يتطلب `commands.config: true`.
    - يقرأ أو يكتب `/mcp show|get|set|unset` تكوين خادم MCP المُدار بواسطة OpenClaw ضمن `mcp.servers`. للمالك فقط. يتطلب `commands.mcp: true`.
    - يفحص أو يغيّر `/plugins list|inspect|show|get|install|enable|disable` حالة Plugin. `/plugin` اسم بديل. الكتابة للمالك فقط. يتطلب `commands.plugins: true`.
    - يدير `/debug show|set|unset|reset` تجاوزات التكوين الخاصة بوقت التشغيل فقط. للمالك فقط. يتطلب `commands.debug: true`.
    - يعيد `/restart` تشغيل OpenClaw عند تمكينه. الافتراضي: مفعّل؛ اضبط `commands.restart: false` لتعطيله.
    - يضبط `/send on|off|inherit` سياسة الإرسال. للمالك فقط.

  </Accordion>
  <Accordion title="الصوت وTTS والتحكم في القناة">
    - يتحكم `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` في TTS. راجع [TTS](/ar/tools/tts).
    - يضبط `/activation mention|always` وضع تفعيل المجموعة.
    - يشغّل `/bash <command>` أمر صدفة على المضيف. نص فقط. الاسم البديل: `! <command>`. يتطلب `commands.bash: true` بالإضافة إلى قوائم السماح في `tools.elevated`.
    - يتحقق `!poll [sessionId]` من مهمة bash تعمل في الخلفية.
    - يوقف `!stop [sessionId]` مهمة bash تعمل في الخلفية.

  </Accordion>
</AccordionGroup>

### أوامر الإرساء المُولَّدة

تبدّل أوامر الإرساء مسار رد الجلسة الحالية إلى قناة مرتبطة أخرى. راجع [إرساء القنوات](/ar/concepts/channel-docking) للإعداد والأمثلة واستكشاف الأخطاء وإصلاحها.

تُولَّد أوامر الإرساء من Plugin القنوات التي تدعم الأوامر الأصلية. المجموعة المضمنة الحالية:

- `/dock-discord` (الاسم البديل: `/dock_discord`)
- `/dock-mattermost` (الاسم البديل: `/dock_mattermost`)
- `/dock-slack` (الاسم البديل: `/dock_slack`)
- `/dock-telegram` (الاسم البديل: `/dock_telegram`)

استخدم أوامر الإرساء من محادثة مباشرة لتبديل مسار رد الجلسة الحالية إلى قناة مرتبطة أخرى. يحتفظ الوكيل بسياق الجلسة نفسه، لكن الردود المستقبلية لتلك الجلسة تُسلَّم إلى نظير القناة المحدد.

تتطلب أوامر الإرساء `session.identityLinks`. يجب أن يكون المُرسِل المصدر والنظير الهدف في مجموعة الهوية نفسها، مثل `["telegram:123", "discord:456"]`. إذا أرسل مستخدم Telegram بالمعرّف `123` الأمر `/dock_discord`، يخزن OpenClaw القيمتين `lastChannel: "discord"` و`lastTo: "456"` في الجلسة النشطة. إذا لم يكن المُرسِل مرتبطًا بنظير Discord، يرد الأمر بتلميح إعداد بدلًا من الرجوع إلى المحادثة العادية.

يغير الإرساء مسار الجلسة النشطة فقط. ولا ينشئ حسابات قنوات، أو يمنح وصولًا، أو يتجاوز قوائم سماح القنوات، أو ينقل سجل النصوص إلى جلسة أخرى. استخدم `/dock-telegram` أو `/dock-slack` أو `/dock-mattermost` أو أمر إرساء مُولَّدًا آخر لتبديل المسار مجددًا.

### أوامر Plugin المضمنة

يمكن أن تضيف Plugin المضمنة المزيد من أوامر الشرطة المائلة. الأوامر المضمنة الحالية في هذا المستودع:

- يبدّل `/dreaming [on|off|status|help]` Dreaming الذاكرة. راجع [Dreaming](/ar/concepts/dreaming).
- يدير `/pair [qr|status|pending|approve|cleanup|notify]` تدفق إقران/إعداد الجهاز. راجع [الإقران](/ar/channels/pairing).
- يسلّح `/phone status|arm <camera|screen|writes|all> [duration]|disarm` مؤقتًا أوامر عقدة الهاتف عالية المخاطر.
- يدير `/voice status|list [limit]|set <voiceId|name>` تكوين صوت Talk. في Discord، اسم الأمر الأصلي هو `/talkvoice`.
- يرسل `/card ...` إعدادات بطاقات LINE الغنية المسبقة. راجع [LINE](/ar/channels/line).
- يفحص ويتحكم `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` في حزام خادم تطبيق Codex المضمن. راجع [حزام Codex](/ar/plugins/codex-harness).
- أوامر خاصة بـ QQBot فقط:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### أوامر Skills الديناميكية

تُعرض Skills التي يمكن للمستخدم استدعاؤها أيضًا كأوامر شرطة مائلة:

- يعمل `/skill <name> [input]` دائمًا كنقطة دخول عامة.
- قد تظهر skills أيضًا كأوامر مباشرة مثل `/prose` عندما تسجلها skill/Plugin.
- يتحكم `commands.nativeSkills` و`channels.<provider>.commands.nativeSkills` في تسجيل أوامر skills الأصلية.
- يمكن لمواصفات الأوامر توفير `descriptionLocalizations` للأسطح الأصلية التي تدعم الأوصاف المترجمة، بما في ذلك Discord.

<AccordionGroup>
  <Accordion title="ملاحظات الوسيط والمحلل">
    - تقبل الأوامر علامة `:` اختيارية بين الأمر والوسائط (مثل `/think: high` و`/send: on` و`/help:`).
    - يقبل `/new <model>` اسمًا بديلًا للنموذج، أو `provider/model`، أو اسم موفر (مطابقة تقريبية)؛ إذا لم توجد مطابقة، يُعامل النص كمتن الرسالة.
    - لتفصيل استخدام الموفرين بالكامل، استخدم `openclaw status --usage`.
    - يتطلب `/allowlist add|remove` القيمة `commands.config=true` ويحترم `configWrites` الخاصة بالقناة.
    - في القنوات متعددة الحسابات، تحترم أيضًا أوامر `/allowlist --account <id>` المستهدفة للتكوين و`/config set channels.<provider>.accounts.<id>...` قيمة `configWrites` الخاصة بالحساب الهدف.
    - يتحكم `/usage` في تذييل الاستخدام لكل رد؛ يطبع `/usage cost` ملخص تكلفة محليًا من سجلات جلسات OpenClaw.
    - يكون `/restart` مفعّلًا افتراضيًا؛ اضبط `commands.restart: false` لتعطيله.
    - يقبل `/plugins install <spec>` مواصفات Plugin نفسها التي يقبلها `openclaw plugins install`: مسار/أرشيف محلي، أو حزمة npm، أو `git:<repo>`، أو `clawhub:<pkg>`.
    - يحدّث `/plugins enable|disable` تكوين Plugin وقد يطلب إعادة تشغيل.

  </Accordion>
  <Accordion title="سلوك خاص بالقناة">
    - أمر أصلي خاص بـ Discord فقط: يتحكم `/vc join|leave|status` في قنوات الصوت (غير متاح كنص). يتطلب `join` خادمًا وقناة صوت/منصة محددة. يتطلب `channels.discord.voice` والأوامر الأصلية.
    - تتطلب أوامر ربط خيوط Discord (`/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age`) تمكين روابط الخيوط الفعالة (`session.threadBindings.enabled` و/أو `channels.discord.threadBindings.enabled`).
    - مرجع أوامر ACP وسلوك وقت التشغيل: [وكلاء ACP](/ar/tools/acp-agents).

  </Accordion>
  <Accordion title="السلامة في الإسهاب / التتبع / السرعة / الاستدلال">
    - الغرض من `/verbose` هو التصحيح وزيادة الرؤية؛ أبقه **معطّلًا** في الاستخدام العادي.
    - `/trace` أضيق من `/verbose`: فهو يكشف فقط أسطر التتبع/التصحيح المملوكة لـ Plugin ويبقي ثرثرة الأدوات الإسهابية العادية معطّلة.
    - يحفظ `/fast on|off` تجاوزًا للجلسة. استخدم خيار `inherit` في واجهة Sessions لمسحه والرجوع إلى افتراضيات التكوين.
    - `/fast` خاص بالموفر: يربطه OpenAI/OpenAI Codex بالقيمة `service_tier=priority` في نقاط نهاية Responses الأصلية، بينما تربطه طلبات Anthropic العامة المباشرة، بما في ذلك حركة المرور الموثقة عبر OAuth والمرسلة إلى `api.anthropic.com`، بالقيمة `service_tier=auto` أو `standard_only`. راجع [OpenAI](/ar/providers/openai) و[Anthropic](/ar/providers/anthropic).
    - تظل ملخصات فشل الأدوات معروضة عند صلتها، لكن نص الفشل المفصل لا يُدرج إلا عندما يكون `/verbose` بالقيمة `on` أو `full`.
    - تكون `/reasoning` و`/verbose` و`/trace` محفوفة بالمخاطر في إعدادات المجموعات: فقد تكشف استدلالًا داخليًا، أو مخرجات أدوات، أو تشخيصات Plugin لم تكن تقصد إظهارها. يُفضّل إبقاؤها معطّلة، خصوصًا في محادثات المجموعات.

  </Accordion>
  <Accordion title="تبديل النماذج">
    - يحفظ `/model` نموذج الجلسة الجديد فورًا.
    - إذا كان الوكيل خاملًا، يستخدمه التشغيل التالي مباشرة.
    - إذا كان تشغيل جارٍ نشطًا بالفعل، يضع OpenClaw علامة على التبديل الحي كعملية معلّقة ولا يعيد التشغيل إلى النموذج الجديد إلا عند نقطة إعادة محاولة نظيفة.
    - إذا بدأ نشاط الأدوات أو إخراج الرد بالفعل، فقد يبقى التبديل المعلّق في قائمة الانتظار حتى فرصة إعادة محاولة لاحقة أو دور المستخدم التالي.
    - في TUI المحلي، يعيد `/crestodian [request]` من TUI الوكيل العادي إلى Crestodian. هذا منفصل عن وضع إنقاذ قنوات الرسائل ولا يمنح صلاحية تكوين عن بُعد.

  </Accordion>
  <Accordion title="المسار السريع والاختصارات المضمنة">
    - **المسار السريع:** تُعالج الرسائل التي تحتوي على أوامر فقط من مُرسلين في قائمة السماح فورًا (تجاوز قائمة الانتظار + النموذج).
    - **بوابة الإشارة في المجموعات:** تتجاوز الرسائل التي تحتوي على أوامر فقط من مُرسلين في قائمة السماح متطلبات الإشارة.
    - **الاختصارات المضمنة (للمُرسلين في قائمة السماح فقط):** تعمل بعض الأوامر أيضًا عند تضمينها في رسالة عادية وتُزال قبل أن يرى النموذج النص المتبقي.
      - مثال: يؤدي `hey /status` إلى تشغيل رد حالة، ويستمر النص المتبقي عبر التدفق العادي.
    - حاليًا: `/help` و`/commands` و`/status` و`/whoami` (`/id`).
    - تُتجاهل بصمت الرسائل غير المصرح بها التي تحتوي على أوامر فقط، وتُعامل رموز `/...` المضمنة كنص عادي.

  </Accordion>
  <Accordion title="أوامر Skills والوسائط الأصلية">
    - **أوامر Skills:** تُعرض skills من نوع `user-invocable` كأوامر شرطة مائلة. تُنقّى الأسماء إلى `a-z0-9_` (بحد أقصى 32 حرفًا)؛ وتحصل التصادمات على لواحق رقمية (مثل `_2`).
      - يشغّل `/skill <name> [input]` skill بالاسم (مفيد عندما تمنع حدود الأوامر الأصلية إنشاء أوامر لكل skill).
      - افتراضيًا، تُمرر أوامر skills إلى النموذج كطلب عادي.
      - قد تعلن Skills اختياريًا `command-dispatch: tool` لتوجيه الأمر مباشرة إلى أداة (حتمي، بلا نموذج).
      - مثال: `/prose` (Plugin OpenProse) — راجع [OpenProse](/ar/prose).
    - **وسائط الأوامر الأصلية:** يستخدم Discord الإكمال التلقائي للخيارات الديناميكية (وقوائم الأزرار عند حذف الوسائط المطلوبة). يعرض Telegram وSlack قائمة أزرار عندما يدعم أمر ما اختيارات وتحذف الوسيط. تُحل الاختيارات الديناميكية مقابل نموذج الجلسة الهدف، لذلك تتبع الخيارات الخاصة بالنموذج مثل مستويات `/think` تجاوز `/model` لتلك الجلسة.

  </Accordion>
</AccordionGroup>

## `/tools`

يجيب `/tools` عن سؤال وقت تشغيل، لا عن سؤال تكوين: **ما الذي يستطيع هذا الوكيل استخدامه الآن في هذه المحادثة**.

- يكون `/tools` الافتراضي مضغوطًا ومحسّنًا للمسح السريع.
- يضيف `/tools verbose` أوصافًا قصيرة.
- تعرض أسطح الأوامر الأصلية التي تدعم الوسائط مفتاح الوضع نفسه مثل `compact|verbose`.
- النتائج مقيّدة بنطاق الجلسة، لذلك قد يؤدي تغيير الوكيل، أو القناة، أو الخيط، أو تفويض المُرسِل، أو النموذج إلى تغيير الإخراج.
- يتضمن `/tools` الأدوات القابلة للوصول فعليًا في وقت التشغيل، بما في ذلك الأدوات الأساسية، وأدوات Plugin المتصلة، والأدوات المملوكة للقناة.

لتحرير الملفات الشخصية والتجاوزات، استخدم لوحة Tools في واجهة Control UI أو أسطح التكوين/الكتالوج بدلًا من التعامل مع `/tools` ككتالوج ثابت.

## أسطح الاستخدام (ما يظهر وأين)

- يظهر **استخدام/حصة الموفر** (مثال: "Claude 80% left") في `/status` لموفر النموذج الحالي عند تمكين تتبع الاستخدام. يطبّع OpenClaw نوافذ الموفرين إلى `% left`؛ بالنسبة إلى MiniMax، تُعكس حقول النسبة المئوية المتبقية فقط قبل العرض، وتُفضّل استجابات `model_remains` إدخال نموذج الدردشة بالإضافة إلى تسمية خطة موسومة بالنموذج.
- يمكن أن ترجع **أسطر الرموز/التخزين المؤقت** في `/status` إلى أحدث إدخال استخدام في سجل النصوص عندما تكون لقطة الجلسة الحية قليلة البيانات. تظل القيم الحية غير الصفرية الحالية هي الغالبة، ويمكن للرجوع إلى سجل النصوص أيضًا استرداد تسمية نموذج وقت التشغيل النشط بالإضافة إلى إجمالي أكبر موجه للطلب عندما تكون الإجماليات المخزنة مفقودة أو أصغر.
- **التنفيذ مقابل وقت التشغيل:** يعرض `/status` قيمة `Execution` لمسار sandbox الفعلي وقيمة `Runtime` لمن يشغّل الجلسة فعليًا: `OpenClaw Pi Default`، أو `OpenAI Codex`، أو خلفية CLI، أو خلفية ACP.
- تتحكم `/usage off|tokens|full` في **الرموز/التكلفة لكل رد** (تُلحق بالردود العادية).
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

- يعرض `/model` و`/model list` منتقيًا مضغوطًا ومرقمًا (عائلة النموذج + المزوّدون المتاحون).
- على Discord، يفتح `/model` و`/models` منتقيًا تفاعليًا يتضمن قوائم منسدلة للمزوّد والنموذج، إضافة إلى خطوة إرسال.
- يختار `/model <#>` من ذلك المنتقي (ويفضّل المزوّد الحالي عندما يكون ذلك ممكنًا).
- يعرض `/model status` العرض التفصيلي، بما في ذلك نقطة نهاية المزوّد المضبوطة (`baseUrl`) ووضع API (`api`) عند توفرهما.

## تجاوزات التصحيح

يتيح لك `/debug` ضبط تجاوزات إعداد **خاصة بوقت التشغيل فقط** (في الذاكرة، لا على القرص). للمالك فقط. معطّل افتراضيًا؛ فعّله باستخدام `commands.debug: true`.

أمثلة:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
تُطبّق التجاوزات فورًا على قراءات الإعداد الجديدة، لكنها **لا** تكتب إلى `openclaw.json`. استخدم `/debug reset` لمسح كل التجاوزات والعودة إلى الإعداد الموجود على القرص.
</Note>

## مخرجات تتبّع Plugin

يتيح لك `/trace` تبديل **أسطر تتبّع/تصحيح Plugin المحددة بنطاق الجلسة** دون تشغيل الوضع المطوّل الكامل.

أمثلة:

```text
/trace
/trace on
/trace off
```

ملاحظات:

- يعرض `/trace` بلا وسيطة حالة التتبّع الحالية للجلسة.
- يفعّل `/trace on` أسطر تتبّع Plugin للجلسة الحالية.
- يعطّلها `/trace off` مرة أخرى.
- يمكن أن تظهر أسطر تتبّع Plugin في `/status` وكرسالة تشخيصية لاحقة بعد رد المساعد العادي.
- لا يحل `/trace` محل `/debug`؛ إذ يظل `/debug` يدير تجاوزات الإعداد الخاصة بوقت التشغيل فقط.
- لا يحل `/trace` محل `/verbose`؛ فما تزال مخرجات الأدوات/الحالة المطوّلة العادية تابعة لـ`/verbose`.

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
يتم التحقق من صحة الإعداد قبل الكتابة؛ وتُرفض التغييرات غير الصالحة. تبقى تحديثات `/config` محفوظة بعد إعادة التشغيل.
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
يخزّن `/mcp` الإعداد في إعداد OpenClaw، لا في إعدادات المشروع المملوكة لـPi. تقرر محوّلات وقت التشغيل أي وسائل النقل قابلة للتنفيذ فعليًا.
</Note>

## تحديثات Plugin

يتيح `/plugins` للمشغّلين فحص Plugins المكتشفة وتبديل تفعيلها في الإعداد. يمكن للتدفقات المخصصة للقراءة فقط استخدام `/plugin` كاسم بديل. معطّل افتراضيًا؛ فعّله باستخدام `commands.plugins: true`.

أمثلة:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- يستخدم `/plugins list` و`/plugins show` اكتشاف Plugin فعليًا مقابل مساحة العمل الحالية إضافة إلى الإعداد الموجود على القرص.
- يحدّث `/plugins enable|disable` إعداد Plugin فقط؛ ولا يثبّت Plugins أو يلغي تثبيتها.
- بعد تغييرات التفعيل/التعطيل، أعد تشغيل Gateway لتطبيقها.

</Note>

## ملاحظات الأسطح

<AccordionGroup>
  <Accordion title="الجلسات لكل سطح">
    - تعمل **الأوامر النصية** في جلسة الدردشة العادية (تشارك الرسائل المباشرة `main`، وتملك المجموعات جلستها الخاصة).
    - تستخدم **الأوامر الأصلية** جلسات معزولة:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (البادئة قابلة للضبط عبر `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (تستهدف جلسة الدردشة عبر `CommandTargetSessionKey`)
    - يستهدف **`/stop`** جلسة الدردشة النشطة كي يتمكن من إيقاف التشغيل الحالي.

  </Accordion>
  <Accordion title="تفاصيل Slack">
    لا يزال `channels.slack.slashCommand` مدعومًا لأمر واحد بأسلوب `/openclaw`. إذا فعّلت `commands.native`، فيجب إنشاء أمر Slack مائل واحد لكل أمر مدمج (بالأسماء نفسها الموجودة في `/help`). تُسلّم قوائم وسيطات الأوامر في Slack على هيئة أزرار Block Kit مؤقتة.

    استثناء Slack الأصلي: سجّل `/agentstatus` (وليس `/status`) لأن Slack يحجز `/status`. ما يزال نص `/status` يعمل في رسائل Slack.

  </Accordion>
</AccordionGroup>

## أسئلة BTW الجانبية

`/btw` هو **سؤال جانبي** سريع عن الجلسة الحالية.

بخلاف الدردشة العادية:

- يستخدم الجلسة الحالية كسياق خلفية،
- يعمل كاستدعاء منفصل **بلا أدوات** ولمرة واحدة،
- لا يغيّر سياق الجلسة المستقبلي،
- لا يُكتب إلى سجل النصوص،
- يُسلّم كنتيجة جانبية مباشرة بدلًا من رسالة مساعد عادية.

يجعل ذلك `/btw` مفيدًا عندما تريد توضيحًا مؤقتًا بينما تستمر المهمة الرئيسية.

مثال:

```text
/btw what are we doing right now?
```

راجع [أسئلة BTW الجانبية](/ar/tools/btw) للاطلاع على السلوك الكامل وتفاصيل تجربة المستخدم في العميل.

## ذو صلة

- [إنشاء Skills](/ar/tools/creating-skills)
- [Skills](/ar/tools/skills)
- [إعداد Skills](/ar/tools/skills-config)

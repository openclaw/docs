---
read_when:
    - استخدام أو تكوين أوامر الدردشة
    - استكشاف أخطاء توجيه الأوامر أو الأذونات وإصلاحها
sidebarTitle: Slash commands
summary: 'أوامر الشرطة المائلة: النصية مقابل الأصلية، والتكوين، والأوامر المدعومة'
title: أوامر الشرطة المائلة
x-i18n:
    generated_at: "2026-05-03T21:43:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fbdd76ccd43159cabfbc3f15f7bddd2a7ada07fcd6eea2e169d2d88df18f28c
    source_path: tools/slash-commands.md
    workflow: 16
---

تُعالَج الأوامر بواسطة Gateway. يجب إرسال معظم الأوامر كرسالة **مستقلة** تبدأ بـ `/`. يستخدم أمر دردشة bash الخاص بالمضيف فقط الصيغة `! <cmd>` (مع `/bash <cmd>` كاسم مستعار).

عندما تكون محادثة أو سلسلة مرتبطة بجلسة ACP، يُوجَّه نص المتابعة العادي إلى ذلك المشغّل ACP. تبقى أوامر إدارة Gateway محلية: يصل `/acp ...` دائمًا إلى معالج أوامر OpenClaw ACP، ويبقى `/status` مع `/unfocus` محليين كلما كان التعامل مع الأوامر مفعّلًا على السطح.

يوجد نظامان مرتبطان:

<AccordionGroup>
  <Accordion title="Commands">
    رسائل `/...` مستقلة.
  </Accordion>
  <Accordion title="Directives">
    `/think`، `/fast`، `/verbose`، `/trace`، `/reasoning`، `/elevated`، `/exec`، `/model`، `/queue`.

    - تُزال التوجيهات من الرسالة قبل أن يراها النموذج.
    - في رسائل الدردشة العادية (وليست رسائل توجيهات فقط)، تُعامل كـ "تلميحات مضمنة" ولا تُثبت إعدادات الجلسة.
    - في رسائل التوجيهات فقط (عندما تحتوي الرسالة على توجيهات فقط)، تُثبت في الجلسة وترد بإقرار.
    - لا تُطبَّق التوجيهات إلا على **المرسلين المخوّلين**. إذا كان `commands.allowFrom` مضبوطًا، فهو قائمة السماح الوحيدة المستخدمة؛ وإلا يأتي التخويل من قوائم السماح/الاقتران الخاصة بالقناة إضافة إلى `commands.useAccessGroups`. يرى المرسلون غير المخوّلين التوجيهات كنص عادي.

  </Accordion>
  <Accordion title="Inline shortcuts">
    للمرسلين المدرجين في قائمة السماح/المخوّلين فقط: `/help`، `/commands`، `/status`، `/whoami` (`/id`).

    تُنفَّذ فورًا، وتُزال قبل أن يرى النموذج الرسالة، ويستمر النص المتبقي عبر التدفق العادي.

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
  يفعّل تحليل `/...` في رسائل الدردشة. على الأسطح التي لا تدعم أوامر أصلية (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams)، تظل الأوامر النصية تعمل حتى إذا ضبطت هذا على `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  يسجّل الأوامر الأصلية. تلقائيًا: مفعّل لـ Discord/Telegram؛ معطّل لـ Slack (حتى تضيف أوامر شرطة مائلة)؛ يُتجاهل لمزوّدي الخدمة الذين لا يملكون دعمًا أصليًا. اضبط `channels.discord.commands.native` أو `channels.telegram.commands.native` أو `channels.slack.commands.native` للتجاوز لكل مزوّد (قيمة منطقية أو `"auto"`). على Discord، يتجاوز `false` تسجيل أوامر الشرطة المائلة وتنظيفها أثناء بدء التشغيل؛ قد تبقى الأوامر المسجلة سابقًا مرئية حتى تزيلها من تطبيق Discord. تُدار أوامر Slack في تطبيق Slack ولا تُزال تلقائيًا.
</ParamField>
على Discord، قد تتضمن مواصفات الأوامر الأصلية `descriptionLocalizations`، والتي ينشرها OpenClaw بصيغة Discord `description_localizations` ويدرجها في مقارنات التسوية.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  يسجّل أوامر **Skills** أصليًا عند دعمها. تلقائيًا: مفعّل لـ Discord/Telegram؛ معطّل لـ Slack (يتطلب Slack إنشاء أمر شرطة مائلة لكل Skill). اضبط `channels.discord.commands.nativeSkills` أو `channels.telegram.commands.nativeSkills` أو `channels.slack.commands.nativeSkills` للتجاوز لكل مزوّد (قيمة منطقية أو `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  يفعّل `! <cmd>` لتشغيل أوامر صدفة المضيف (`/bash <cmd>` اسم مستعار؛ يتطلب قوائم سماح `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  يتحكم في مدة انتظار bash قبل التحول إلى وضع الخلفية (`0` يجعله في الخلفية فورًا).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  يفعّل `/config` (يقرأ/يكتب `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  يفعّل `/mcp` (يقرأ/يكتب إعداد MCP المُدار بواسطة OpenClaw ضمن `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  يفعّل `/plugins` (اكتشاف/حالة Plugin إضافة إلى عناصر تحكم التثبيت والتفعيل/التعطيل).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  يفعّل `/debug` (تجاوزات وقت التشغيل فقط).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  يفعّل `/restart` إضافة إلى إجراءات أداة إعادة تشغيل Gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  يضبط قائمة سماح المالك الصريحة لأسطح الأوامر/الأدوات الخاصة بالمالك فقط. هذا هو حساب المشغّل البشري الذي يمكنه الموافقة على الإجراءات الخطرة وتشغيل أوامر مثل `/diagnostics` و`/export-trajectory` و`/config`. وهو منفصل عن `commands.allowFrom` وعن وصول اقتران الرسائل الخاصة.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  لكل قناة: يجعل الأوامر الخاصة بالمالك فقط تتطلب **هوية المالك** للتشغيل على ذلك السطح. عند `true`، يجب أن يطابق المرسل مرشح مالك محلولًا (مثل إدخال في `commands.ownerAllowFrom` أو بيانات تعريف مالك أصلية لدى المزوّد) أو أن يمتلك نطاق `operator.admin` داخليًا على قناة رسائل داخلية. لا يكفي إدخال بدل شامل في `allowFrom` الخاصة بالقناة، ولا قائمة مرشحي مالك فارغة/غير محلولة — تفشل الأوامر الخاصة بالمالك فقط في وضع مغلق على تلك القناة. اترك هذا معطّلًا إذا أردت حصر الأوامر الخاصة بالمالك فقط بواسطة `ownerAllowFrom` وقوائم سماح الأوامر القياسية.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  يتحكم في طريقة ظهور معرّفات المالك في مطالبة النظام.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  يضبط اختياريًا سر HMAC المستخدم عند `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  قائمة سماح لكل مزوّد لتخويل الأوامر. عند تهيئتها، تكون هي مصدر التخويل الوحيد للأوامر والتوجيهات (تُتجاهل قوائم سماح/اقتران القنوات و`commands.useAccessGroups`). استخدم `"*"` كافتراضي عام؛ وتتجاوزه المفاتيح الخاصة بالمزوّد.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  يفرض قوائم السماح/السياسات للأوامر عندما لا يكون `commands.allowFrom` مضبوطًا.
</ParamField>

## قائمة الأوامر

مصدر الحقيقة الحالي:

- تأتي الأوامر المضمنة الأساسية من `src/auto-reply/commands-registry.shared.ts`
- تأتي أوامر dock المولّدة من `src/auto-reply/commands-registry.data.ts`
- تأتي أوامر Plugin من استدعاءات `registerCommand()` في Plugin
- لا يزال التوفر الفعلي على gateway لديك يعتمد على رايات الإعداد، وسطح القناة، والـ plugins المثبتة/المفعّلة

### الأوامر المضمنة الأساسية

<AccordionGroup>
  <Accordion title="Sessions and runs">
    - يبدأ `/new [model]` جلسة جديدة؛ و`/reset` هو اسم إعادة الضبط المستعار.
    - تعترض واجهة التحكم `/new` المكتوب لإنشاء جلسة لوحة معلومات جديدة والتبديل إليها؛ بينما يظل `/reset` المكتوب يشغّل إعادة الضبط الموضعية الخاصة بـ Gateway.
    - يحافظ `/reset soft [message]` على النص الحالي، ويسقط معرّفات جلسات خلفية CLI المعاد استخدامها، ويعيد تشغيل تحميل بدء التشغيل/مطالبة النظام في الموضع نفسه.
    - يضغط `/compact [instructions]` سياق الجلسة. راجع [Compaction](/ar/concepts/compaction).
    - يوقف `/stop` التشغيل الحالي.
    - يدير `/session idle <duration|off>` و`/session max-age <duration|off>` انتهاء صلاحية ربط السلسلة.
    - يصدّر `/export-session [path]` الجلسة الحالية إلى HTML. الاسم المستعار: `/export`.
    - يطلب `/export-trajectory [path]` موافقة exec، ثم يصدّر [حزمة مسار](/ar/tools/trajectory) بصيغة JSONL للجلسة الحالية. استخدمه عندما تحتاج إلى الخط الزمني للمطالبة والأداة والنص لجلسة OpenClaw واحدة. في دردشات المجموعات، تذهب مطالبة الموافقة ونتيجة التصدير إلى المالك بشكل خاص. الاسم المستعار: `/trajectory`.

  </Accordion>
  <Accordion title="Model and run controls">
    - يضبط `/think <level>` مستوى التفكير. تأتي الخيارات من ملف تعريف مزوّد النموذج النشط؛ والمستويات الشائعة هي `off` و`minimal` و`low` و`medium` و`high`، مع مستويات مخصصة مثل `xhigh` أو `adaptive` أو `max` أو الثنائي `on` حيثما يكون مدعومًا فقط. الأسماء المستعارة: `/thinking`، `/t`.
    - يبدّل `/verbose on|off|full` الإخراج التفصيلي. الاسم المستعار: `/v`.
    - يبدّل `/trace on|off` إخراج تتبع Plugin للجلسة الحالية.
    - يعرض `/fast [status|on|off]` الوضع السريع أو يضبطه.
    - يبدّل `/reasoning [on|off|stream]` ظهور الاستدلال. الاسم المستعار: `/reason`.
    - يبدّل `/elevated [on|off|ask|full]` الوضع المرتفع. الاسم المستعار: `/elev`.
    - يعرض `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` إعدادات exec الافتراضية أو يضبطها.
    - يعرض `/model [name|#|status]` النموذج أو يضبطه.
    - يسرد `/models [provider] [page] [limit=<n>|size=<n>|all]` المزوّدين المهيئين/المتاحين بالمصادقة أو النماذج لمزوّد؛ أضف `all` لتصفح الفهرس الكامل لذلك المزوّد.
    - يدير `/queue <mode>` سلوك قائمة الانتظار (`steer`، و`queue` القديم، و`followup`، و`collect`، و`steer-backlog`، و`interrupt`) إضافة إلى خيارات مثل `debounce:0.5s cap:25 drop:summarize`؛ يمسح `/queue default` أو `/queue reset` تجاوز الجلسة. راجع [قائمة انتظار الأوامر](/ar/concepts/queue) و[قائمة انتظار التوجيه](/ar/concepts/queue-steering).

  </Accordion>
  <Accordion title="Discovery and status">
    - يعرض `/help` ملخص المساعدة القصير.
    - يعرض `/commands` فهرس الأوامر المولّد.
    - يعرض `/tools [compact|verbose]` ما يمكن للوكيل الحالي استخدامه الآن.
    - يعرض `/status` حالة التنفيذ/وقت التشغيل، بما في ذلك تسميات `Execution`/`Runtime` واستخدام/حصة المزوّد عند توفرها.
    - `/diagnostics [note]` هو تدفق تقرير الدعم الخاص بالمالك فقط لأخطاء Gateway وتشغيلات مشغّل Codex. يطلب موافقة exec صريحة في كل مرة قبل تشغيل `openclaw gateway diagnostics export --json`؛ لا توافق على التشخيصات بقاعدة سماح شاملة. بعد الموافقة، يرسل تقريرًا قابلًا للصق يتضمن مسار الحزمة المحلي، وملخص البيان، وملاحظات الخصوصية، ومعرّفات الجلسات ذات الصلة. في دردشات المجموعات، تذهب مطالبة الموافقة والتقرير إلى المالك بشكل خاص. عندما تستخدم الجلسة النشطة مشغّل OpenAI Codex، ترسل الموافقة نفسها أيضًا ملاحظات Codex ذات الصلة إلى خوادم OpenAI، ويسرد الرد المكتمل معرّفات جلسات OpenClaw، ومعرّفات سلاسل Codex، وأوامر `codex resume <thread-id>`. راجع [تصدير التشخيصات](/ar/gateway/diagnostics).
    - يشغّل `/crestodian <request>` مساعد إعداد وإصلاح Crestodian من رسالة خاصة للمالك.
    - يسرد `/tasks` مهام الخلفية النشطة/الأخيرة للجلسة الحالية.
    - يشرح `/context [list|detail|json]` كيفية تجميع السياق.
    - يعرض `/whoami` معرّف المرسل الخاص بك. الاسم المستعار: `/id`.
    - يتحكم `/usage off|tokens|full|cost` في تذييل الاستخدام لكل رد أو يطبع ملخص تكلفة محليًا.

  </Accordion>
  <Accordion title="Skills, allowlists, approvals">
    - يشغّل `/skill <name> [input]` Skill بالاسم.
    - يدير `/allowlist [list|add|remove] ...` إدخالات قائمة السماح. نص فقط.
    - يحسم `/approve <id> <decision>` مطالبات موافقة exec.
    - يطرح `/btw <question>` سؤالًا جانبيًا دون تغيير سياق الجلسة المستقبلي. الاسم المستعار: `/side`. راجع [BTW](/ar/tools/btw).

  </Accordion>
  <Accordion title="الوكلاء الفرعيون و ACP">
    - يدير `/subagents list|kill|log|info|send|steer|spawn` تشغيلات الوكلاء الفرعيين للجلسة الحالية.
    - يدير `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` جلسات ACP وخيارات وقت التشغيل.
    - يربط `/focus <target>` سلسلة Discord الحالية أو موضوع/محادثة Telegram بهدف جلسة.
    - يزيل `/unfocus` الربط الحالي.
    - يعرض `/agents` الوكلاء المرتبطين بالسلسلة للجلسة الحالية.
    - يوقف `/kill <id|#|all>` وكيلا فرعيا واحدا قيد التشغيل أو جميع الوكلاء الفرعيين.
    - يرسل `/steer <id|#> <message>` توجيها إلى وكيل فرعي قيد التشغيل. الاسم البديل: `/tell`.

  </Accordion>
  <Accordion title="كتابات المالك فقط والإدارة">
    - يقرأ `/config show|get|set|unset` أو يكتب `openclaw.json`. للمالك فقط. يتطلب `commands.config: true`.
    - يقرأ `/mcp show|get|set|unset` أو يكتب إعدادات خادم MCP المُدارة من OpenClaw ضمن `mcp.servers`. للمالك فقط. يتطلب `commands.mcp: true`.
    - يفحص `/plugins list|inspect|show|get|install|enable|disable` حالة Plugin أو يغيّرها. `/plugin` اسم بديل. الكتابة للمالك فقط. يتطلب `commands.plugins: true`.
    - يدير `/debug show|set|unset|reset` تجاوزات الإعدادات الخاصة بوقت التشغيل فقط. للمالك فقط. يتطلب `commands.debug: true`.
    - يعيد `/restart` تشغيل OpenClaw عند تمكينه. الافتراضي: مُمكّن؛ اضبط `commands.restart: false` لتعطيله.
    - يضبط `/send on|off|inherit` سياسة الإرسال. للمالك فقط.

  </Accordion>
  <Accordion title="الصوت و TTS والتحكم في القناة">
    - يتحكم `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` في TTS. راجع [TTS](/ar/tools/tts).
    - يضبط `/activation mention|always` وضع تفعيل المجموعة.
    - يشغّل `/bash <command>` أمر صدفة على المضيف. نص فقط. الاسم البديل: `! <command>`. يتطلب `commands.bash: true` بالإضافة إلى قوائم سماح `tools.elevated`.
    - يتحقق `!poll [sessionId]` من مهمة bash في الخلفية.
    - يوقف `!stop [sessionId]` مهمة bash في الخلفية.

  </Accordion>
</AccordionGroup>

### أوامر الإرساء المُولَّدة

تبدّل أوامر الإرساء مسار رد الجلسة الحالية إلى قناة مرتبطة أخرى. راجع [إرساء القنوات](/ar/concepts/channel-docking) للإعداد والأمثلة واستكشاف الأخطاء وإصلاحها.

تُولَّد أوامر الإرساء من Plugins القنوات التي تدعم الأوامر الأصلية. المجموعة المضمّنة الحالية:

- `/dock-discord` (الاسم البديل: `/dock_discord`)
- `/dock-mattermost` (الاسم البديل: `/dock_mattermost`)
- `/dock-slack` (الاسم البديل: `/dock_slack`)
- `/dock-telegram` (الاسم البديل: `/dock_telegram`)

استخدم أوامر الإرساء من محادثة مباشرة لتبديل مسار رد الجلسة الحالية إلى قناة مرتبطة أخرى. يحتفظ الوكيل بسياق الجلسة نفسه، لكن الردود المستقبلية لتلك الجلسة تُسلَّم إلى نظير القناة المحدد.

تتطلب أوامر الإرساء `session.identityLinks`. يجب أن يكون المرسل المصدر والنظير الهدف ضمن مجموعة الهوية نفسها، مثلا `["telegram:123", "discord:456"]`. إذا أرسل مستخدم Telegram بالمعرّف `123` الأمر `/dock_discord`، يخزن OpenClaw القيمتين `lastChannel: "discord"` و `lastTo: "456"` في الجلسة النشطة. إذا لم يكن المرسل مرتبطا بنظير Discord، يرد الأمر بتلميح إعداد بدلا من المرور إلى الدردشة العادية.

يغيّر الإرساء مسار الجلسة النشطة فقط. لا ينشئ حسابات قنوات، ولا يمنح وصولا، ولا يتجاوز قوائم سماح القنوات، ولا ينقل سجل النص إلى جلسة أخرى. استخدم `/dock-telegram` أو `/dock-slack` أو `/dock-mattermost` أو أمر إرساء مُولَّدا آخر لتبديل المسار مرة أخرى.

### أوامر Plugin المضمّنة

يمكن لـ Plugins المضمّنة إضافة المزيد من أوامر الشرطة المائلة. الأوامر المضمّنة الحالية في هذا المستودع:

- يبدّل `/dreaming [on|off|status|help]` Dreaming الذاكرة. راجع [Dreaming](/ar/concepts/dreaming).
- يدير `/pair [qr|status|pending|approve|cleanup|notify]` مسار إقران/إعداد الجهاز. راجع [الإقران](/ar/channels/pairing).
- يفعّل `/phone status|arm <camera|screen|writes|all> [duration]|disarm` مؤقتا أوامر عقدة الهاتف عالية الخطورة.
- يدير `/voice status|list [limit]|set <voiceId|name>` إعدادات صوت Talk. على Discord، اسم الأمر الأصلي هو `/talkvoice`.
- يرسل `/card ...` إعدادات مسبقة لبطاقات LINE الغنية. راجع [LINE](/ar/channels/line).
- يفحص `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` ويتحكم في حزام خادم تطبيق Codex المضمّن. راجع [حزام Codex](/ar/plugins/codex-harness).
- أوامر QQBot فقط:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### أوامر Skills الديناميكية

تُعرَض Skills التي يمكن للمستخدم استدعاؤها أيضا كأوامر شرطة مائلة:

- يعمل `/skill <name> [input]` دائما كنقطة دخول عامة.
- قد تظهر Skills أيضا كأوامر مباشرة مثل `/prose` عندما تسجلها Skill/Plugin.
- يتحكم `commands.nativeSkills` و `channels.<provider>.commands.nativeSkills` في تسجيل أوامر Skills الأصلية.
- يمكن لمواصفات الأوامر توفير `descriptionLocalizations` للواجهات الأصلية التي تدعم الأوصاف المترجمة، بما في ذلك Discord.

<AccordionGroup>
  <Accordion title="ملاحظات الوسيطات والمحلل">
    - تقبل الأوامر علامة `:` اختيارية بين الأمر والوسيطات (مثل `/think: high` و `/send: on` و `/help:`).
    - يقبل `/new <model>` اسما بديلا للنموذج أو `provider/model` أو اسم موفر (مطابقة تقريبية)؛ إذا لم توجد مطابقة، يُعامل النص كمتن الرسالة.
    - للحصول على تفصيل كامل لاستخدام الموفر، استخدم `openclaw status --usage`.
    - يتطلب `/allowlist add|remove` القيمة `commands.config=true` ويحترم `configWrites` الخاصة بالقناة.
    - في القنوات متعددة الحسابات، تحترم أيضا أوامر `/allowlist --account <id>` المستهدفة للإعدادات و `/config set channels.<provider>.accounts.<id>...` قيمة `configWrites` الخاصة بالحساب الهدف.
    - يتحكم `/usage` في تذييل الاستخدام لكل رد؛ يطبع `/usage cost` ملخص تكلفة محليا من سجلات جلسات OpenClaw.
    - يكون `/restart` مُمكّنا افتراضيا؛ اضبط `commands.restart: false` لتعطيله.
    - يقبل `/plugins install <spec>` مواصفات Plugin نفسها التي يقبلها `openclaw plugins install`: مسار/أرشيف محلي، أو حزمة npm، أو `git:<repo>`، أو `clawhub:<pkg>`، ثم يطلب إعادة تشغيل Gateway لأن وحدات مصدر Plugin تغيّرت.
    - يحدّث `/plugins enable|disable` إعدادات Plugin ويشغّل إعادة تحميل Plugin في Gateway لدورات الوكيل الجديدة.

  </Accordion>
  <Accordion title="سلوك خاص بالقناة">
    - أمر أصلي خاص بـ Discord فقط: يتحكم `/vc join|leave|status` في قنوات الصوت (غير متاح كنص). يتطلب `join` خادما وقناة صوت/مسرحا محددة. يتطلب `channels.discord.voice` والأوامر الأصلية.
    - تتطلب أوامر ربط سلاسل Discord (`/focus` و `/unfocus` و `/agents` و `/session idle` و `/session max-age`) تمكين روابط السلاسل الفعالة (`session.threadBindings.enabled` و/أو `channels.discord.threadBindings.enabled`).
    - مرجع أوامر ACP وسلوك وقت التشغيل: [وكلاء ACP](/ar/tools/acp-agents).

  </Accordion>
  <Accordion title="سلامة الإسهاب / التتبع / السرعة / الاستدلال">
    - الغرض من `/verbose` هو التصحيح وتوفير رؤية إضافية؛ أبقه **معطلا** في الاستخدام العادي.
    - `/trace` أضيق نطاقا من `/verbose`: فهو يكشف فقط أسطر التتبع/التصحيح المملوكة لـ Plugin ويبقي ضجيج الأدوات التفصيلي العادي معطلا.
    - يحفظ `/fast on|off` تجاوزا للجلسة. استخدم خيار `inherit` في واجهة الجلسات لمسحه والعودة إلى افتراضيات الإعدادات.
    - `/fast` خاص بالموفر: يربطه OpenAI/OpenAI Codex بالقيمة `service_tier=priority` على نقاط نهاية Responses الأصلية، بينما تربطه طلبات Anthropic العامة المباشرة، بما فيها الحركة المرسلة إلى `api.anthropic.com` والمصادق عليها عبر OAuth، بالقيمة `service_tier=auto` أو `standard_only`. راجع [OpenAI](/ar/providers/openai) و [Anthropic](/ar/providers/anthropic).
    - ما زالت ملخصات فشل الأدوات تُعرض عند ملاءمتها، لكن نص الفشل التفصيلي لا يُضمَّن إلا عندما يكون `/verbose` على `on` أو `full`.
    - تُعد `/reasoning` و `/verbose` و `/trace` خطرة في إعدادات المجموعات: فقد تكشف استدلالا داخليا أو مخرجات أدوات أو تشخيصات Plugin لم تكن تنوي عرضها. يُفضّل تركها معطلة، خاصة في محادثات المجموعات.

  </Accordion>
  <Accordion title="تبديل النموذج">
    - يحفظ `/model` نموذج الجلسة الجديد فورا.
    - إذا كان الوكيل خاملا، تستخدمه الجولة التالية مباشرة.
    - إذا كانت جولة قيد النشاط بالفعل، يعلّم OpenClaw التبديل الحي على أنه معلّق، ولا يعيد التشغيل إلى النموذج الجديد إلا عند نقطة إعادة محاولة نظيفة.
    - إذا بدأ نشاط الأدوات أو إخراج الرد بالفعل، يمكن أن يبقى التبديل المعلّق في الطابور حتى فرصة إعادة محاولة لاحقة أو دورة المستخدم التالية.
    - في TUI المحلي، يعيد `/crestodian [request]` من TUI الوكيل العادي إلى Crestodian. هذا منفصل عن وضع إنقاذ قناة الرسائل ولا يمنح صلاحية إعدادات عن بُعد.

  </Accordion>
  <Accordion title="المسار السريع والاختصارات المضمنة">
    - **المسار السريع:** تُعالَج الرسائل التي تحتوي على أوامر فقط من المرسلين المدرجين في قائمة السماح فورا (تجاوز الطابور + النموذج).
    - **بوابة الإشارة في المجموعة:** تتجاوز الرسائل التي تحتوي على أوامر فقط من المرسلين المدرجين في قائمة السماح متطلبات الإشارة.
    - **الاختصارات المضمنة (للمرسلين المدرجين في قائمة السماح فقط):** تعمل أوامر معينة أيضا عندما تكون مضمّنة في رسالة عادية، وتُزال قبل أن يرى النموذج النص المتبقي.
      - مثال: يؤدي `hey /status` إلى تشغيل رد حالة، ويستمر النص المتبقي عبر المسار العادي.
    - حاليا: `/help` و `/commands` و `/status` و `/whoami` (`/id`).
    - تُتجاهَل الرسائل غير المصرح بها التي تحتوي على أوامر فقط بصمت، وتُعامل رموز `/...` المضمنة كنص عادي.

  </Accordion>
  <Accordion title="أوامر Skills والوسيطات الأصلية">
    - **أوامر Skills:** تُعرَض Skills من نوع `user-invocable` كأوامر شرطة مائلة. تُنظَّف الأسماء إلى `a-z0-9_` (بحد أقصى 32 حرفا)؛ وتحصل التصادمات على لواحق رقمية (مثل `_2`).
      - يشغّل `/skill <name> [input]` Skill بالاسم (مفيد عندما تمنع حدود الأوامر الأصلية إنشاء أوامر لكل Skill).
      - افتراضيا، تُمرَّر أوامر Skills إلى النموذج كطلب عادي.
      - يمكن لـ Skills اختياريا إعلان `command-dispatch: tool` لتوجيه الأمر مباشرة إلى أداة (حتمي، بلا نموذج).
      - مثال: `/prose` (OpenProse Plugin) — راجع [OpenProse](/ar/prose).
    - **وسيطات الأوامر الأصلية:** يستخدم Discord الإكمال التلقائي للخيارات الديناميكية (وقوائم الأزرار عندما تحذف الوسيطات المطلوبة). يعرض Telegram و Slack قائمة أزرار عندما يدعم أمر ما اختيارات وتحذف الوسيطة. تُحل الاختيارات الديناميكية مقابل نموذج الجلسة الهدف، لذلك تتبع الخيارات الخاصة بالنموذج مثل مستويات `/think` تجاوز `/model` الخاص بتلك الجلسة.

  </Accordion>
</AccordionGroup>

## `/tools`

يجيب `/tools` عن سؤال وقت تشغيل، لا عن سؤال إعدادات: **ما الذي يمكن لهذا الوكيل استخدامه الآن في هذه المحادثة**.

- يكون `/tools` الافتراضي مضغوطا ومُحسّنا للمسح السريع.
- يضيف `/tools verbose` أوصافا قصيرة.
- تعرض واجهات الأوامر الأصلية التي تدعم الوسيطات مفتاح الوضع نفسه بصيغة `compact|verbose`.
- النتائج مقيّدة بنطاق الجلسة، لذلك قد يؤدي تغيير الوكيل أو القناة أو السلسلة أو تفويض المرسل أو النموذج إلى تغيير المخرجات.
- يتضمن `/tools` الأدوات التي يمكن الوصول إليها فعليا في وقت التشغيل، بما في ذلك الأدوات الأساسية، وأدوات Plugin المتصلة، والأدوات المملوكة للقناة.

لتحرير الملفات الشخصية والتجاوزات، استخدم لوحة أدوات Control UI أو واجهات الإعدادات/الفهرس بدلا من التعامل مع `/tools` كفهرس ثابت.

## واجهات الاستخدام (ما الذي يظهر وأين)

- يظهر **استخدام/حصة الموفّر** (مثال: "Claude 80% متبقٍّ") في `/status` لموفّر النموذج الحالي عند تمكين تتبّع الاستخدام. يطبّع OpenClaw نوافذ الموفّر إلى `% متبقٍّ`؛ وبالنسبة إلى MiniMax، تُعكس حقول النسبة المئوية الخاصة بالباقي فقط قبل العرض، وتفضّل استجابات `model_remains` إدخال نموذج المحادثة مع تسمية خطة موسومة بالنموذج.
- يمكن أن تعود **أسطر الرموز/التخزين المؤقت** في `/status` إلى أحدث إدخال استخدام في السجل عندما تكون لقطة الجلسة المباشرة قليلة البيانات. تظل القيم المباشرة غير الصفرية الحالية هي الأَولى، ويمكن لاحتياطي السجل أيضًا استعادة تسمية نموذج وقت التشغيل النشط إضافة إلى إجمالي أكبر موجّه للمطالبة عندما تكون الإجماليات المخزنة مفقودة أو أصغر.
- **التنفيذ مقابل وقت التشغيل:** يبلّغ `/status` عن `Execution` لمسار وضع الحماية الفعلي وعن `Runtime` لمن يشغّل الجلسة فعليًا: `OpenClaw Pi Default` أو `OpenAI Codex` أو واجهة خلفية لـ CLI أو واجهة خلفية لـ ACP.
- تتحكم `/usage off|tokens|full` في **الرموز/التكلفة لكل استجابة** (تُضاف إلى الردود العادية).
- يهتم `/model status` بـ **النماذج/المصادقة/نقاط النهاية**، وليس الاستخدام.

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

- يعرض `/model` و`/model list` منتقيًا مضغوطًا ومرقّمًا (عائلة النموذج + الموفّرون المتاحون).
- على Discord، يفتح `/model` و`/models` منتقيًا تفاعليًا مع قوائم منسدلة للموفّر والنموذج إضافة إلى خطوة إرسال.
- يختار `/model <#>` من ذلك المنتقي (ويفضّل الموفّر الحالي عندما يكون ذلك ممكنًا).
- يعرض `/model status` العرض التفصيلي، بما في ذلك نقطة نهاية الموفّر المكوّنة (`baseUrl`) ووضع API (`api`) عند توفرهما.

## تجاوزات التصحيح

يتيح لك `/debug` تعيين تجاوزات إعداد **خاصة بوقت التشغيل فقط** (في الذاكرة، لا على القرص). للمالك فقط. معطّل افتراضيًا؛ فعّله باستخدام `commands.debug: true`.

أمثلة:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
تُطبَّق التجاوزات فورًا على قراءات الإعداد الجديدة، لكنها **لا** تُكتب إلى `openclaw.json`. استخدم `/debug reset` لمسح كل التجاوزات والعودة إلى الإعداد الموجود على القرص.
</Note>

## مخرجات تتبّع Plugin

يتيح لك `/trace` تبديل **أسطر تتبّع/تصحيح Plugin المحددة بنطاق الجلسة** من دون تشغيل الوضع المطوّل الكامل.

أمثلة:

```text
/trace
/trace on
/trace off
```

ملاحظات:

- يعرض `/trace` بلا وسيطة حالة تتبّع الجلسة الحالية.
- يفعّل `/trace on` أسطر تتبّع Plugin للجلسة الحالية.
- يعطّلها `/trace off` مرة أخرى.
- يمكن أن تظهر أسطر تتبّع Plugin في `/status` وكرسالة تشخيصية لاحقة بعد رد المساعد العادي.
- لا يستبدل `/trace` الأمر `/debug`؛ فما زال `/debug` يدير تجاوزات الإعداد الخاصة بوقت التشغيل فقط.
- لا يستبدل `/trace` الأمر `/verbose`؛ فما زالت مخرجات الأداة/الحالة المطوّلة العادية تابعة لـ `/verbose`.

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
يُتحقَّق من الإعداد قبل الكتابة؛ وتُرفض التغييرات غير الصالحة. تستمر تحديثات `/config` عبر عمليات إعادة التشغيل.
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
يخزّن `/mcp` الإعداد في إعداد OpenClaw، وليس في إعدادات المشروع المملوكة لـ Pi. وتقرر محوّلات وقت التشغيل أي وسائل النقل قابلة للتنفيذ فعليًا.
</Note>

## تحديثات Plugin

يتيح `/plugins` للمشغّلين فحص Plugins المكتشفة وتبديل تمكينها في الإعداد. يمكن للتدفقات الخاصة بالقراءة فقط استخدام `/plugin` كاسم بديل. معطّل افتراضيًا؛ فعّله باستخدام `commands.plugins: true`.

أمثلة:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- يستخدم `/plugins list` و`/plugins show` اكتشاف Plugin حقيقيًا مقابل مساحة العمل الحالية إضافة إلى الإعداد الموجود على القرص.
- يثبّت `/plugins install` من ClawHub وnpm وgit والأدلة المحلية والأرشيفات.
- يحدّث `/plugins enable|disable` إعداد Plugin فقط؛ ولا يثبّت Plugins أو يزيل تثبيتها.
- تؤدي تغييرات التمكين والتعطيل إلى إعادة تحميل ساخنة لأسطح وقت تشغيل Gateway Plugin لأدوار الوكيل الجديدة؛ أما التثبيت فيطلب إعادة تشغيل Gateway لأن وحدات مصدر Plugin تغيّرت.

</Note>

## ملاحظات الأسطح

<AccordionGroup>
  <Accordion title="الجلسات لكل سطح">
    - تعمل **الأوامر النصية** في جلسة المحادثة العادية (تشترك الرسائل الخاصة في `main`، وتملك المجموعات جلستها الخاصة).
    - تستخدم **الأوامر الأصلية** جلسات معزولة:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (البادئة قابلة للتهيئة عبر `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (تستهدف جلسة المحادثة عبر `CommandTargetSessionKey`)
    - يستهدف **`/stop`** جلسة المحادثة النشطة كي يتمكن من إيقاف التشغيل الحالي.

  </Accordion>
  <Accordion title="تفاصيل Slack">
    ما زال `channels.slack.slashCommand` مدعومًا لأمر واحد بنمط `/openclaw`. إذا فعّلت `commands.native`، فيجب إنشاء أمر شرطة مائلة واحد في Slack لكل أمر مضمّن (بالأسماء نفسها مثل `/help`). تُسلَّم قوائم وسيطات الأوامر لـ Slack كأزرار Block Kit عابرة.

    استثناء Slack الأصلي: سجّل `/agentstatus` (وليس `/status`) لأن Slack يحجز `/status`. ما زال نص `/status` يعمل في رسائل Slack.

  </Accordion>
</AccordionGroup>

## أسئلة جانبية BTW

`/btw` هو **سؤال جانبي** سريع عن الجلسة الحالية. `/side` اسم بديل.

بخلاف المحادثة العادية:

- يستخدم الجلسة الحالية كسياق خلفية،
- يعمل كاستدعاء منفصل **بلا أدوات** ولمرة واحدة،
- لا يغيّر سياق الجلسة المستقبلي،
- لا يُكتب في سجل المحادثة،
- يُسلَّم كنتيجة جانبية مباشرة بدلًا من رسالة مساعد عادية.

هذا يجعل `/btw` مفيدًا عندما تريد توضيحًا مؤقتًا بينما تواصل المهمة الرئيسية التقدم.

مثال:

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

راجع [أسئلة BTW الجانبية](/ar/tools/btw) للاطلاع على السلوك الكامل وتفاصيل تجربة العميل.

## ذات صلة

- [إنشاء Skills](/ar/tools/creating-skills)
- [Skills](/ar/tools/skills)
- [إعداد Skills](/ar/tools/skills-config)

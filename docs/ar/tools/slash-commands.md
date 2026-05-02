---
read_when:
    - استخدام أو تكوين أوامر الدردشة
    - استكشاف أخطاء توجيه الأوامر أو الأذونات وإصلاحها
sidebarTitle: Slash commands
summary: 'أوامر الشرطة المائلة: النصية مقابل الأصلية، التكوين، والأوامر المدعومة'
title: أوامر الشرطة المائلة
x-i18n:
    generated_at: "2026-05-02T21:05:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2829a33601eb53a63b914ad1a6c3bf51be4298fe3bd34faf6475f60a2d491d2
    source_path: tools/slash-commands.md
    workflow: 16
---

تعالج الأوامر بواسطة Gateway. يجب إرسال معظم الأوامر كرسالة **مستقلة** تبدأ بـ `/`. يستخدم أمر محادثة bash الخاص بالمضيف فقط `! <cmd>` (مع `/bash <cmd>` كاسم بديل).

عندما تكون محادثة أو سلسلة رسائل مرتبطة بجلسة ACP، يوجه نص المتابعة العادي إلى حزمة ACP تلك. تظل أوامر إدارة Gateway محلية: يصل `/acp ...` دائمًا إلى معالج أوامر OpenClaw ACP، ويظل `/status` مع `/unfocus` محليين كلما كانت معالجة الأوامر مفعلة للسطح.

هناك نظامان مرتبطان:

<AccordionGroup>
  <Accordion title="الأوامر">
    رسائل `/...` مستقلة.
  </Accordion>
  <Accordion title="التوجيهات">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - تزال التوجيهات من الرسالة قبل أن يراها النموذج.
    - في رسائل المحادثة العادية (وليست رسائل التوجيهات فقط)، تعامل على أنها "تلميحات مضمنة" ولا تحفظ إعدادات الجلسة.
    - في رسائل التوجيهات فقط (الرسالة تحتوي على توجيهات فقط)، تحفظ في الجلسة وترد بإقرار.
    - لا تطبق التوجيهات إلا على **المرسلين المخولين**. إذا تم تعيين `commands.allowFrom`، فهي قائمة السماح الوحيدة المستخدمة؛ وإلا فيأتي التفويض من قوائم سماح/إقران القناة مع `commands.useAccessGroups`. يرى المرسلون غير المخولين التوجيهات كنص عادي.

  </Accordion>
  <Accordion title="الاختصارات المضمنة">
    للمرسلين المدرجين في قائمة السماح/المخولين فقط: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    تعمل فورًا، وتزال قبل أن يرى النموذج الرسالة، ويستمر النص المتبقي عبر التدفق العادي.

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
  يفعّل تحليل `/...` في رسائل المحادثة. على الأسطح التي لا تحتوي على أوامر أصلية (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams)، تظل الأوامر النصية تعمل حتى إذا عينت هذا إلى `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  يسجل الأوامر الأصلية. تلقائي: مفعّل لـ Discord/Telegram؛ معطل لـ Slack (حتى تضيف أوامر الشرطة المائلة)؛ يتجاهل للموفرين الذين لا يدعمون الأوامر الأصلية. عيّن `channels.discord.commands.native` أو `channels.telegram.commands.native` أو `channels.slack.commands.native` لتجاوز ذلك لكل موفر (قيمة منطقية أو `"auto"`). تمسح `false` الأوامر المسجلة سابقًا على Discord/Telegram عند بدء التشغيل. تدار أوامر Slack في تطبيق Slack ولا تزال تلقائيًا.
</ParamField>
على Discord، قد تتضمن مواصفات الأوامر الأصلية `descriptionLocalizations`، والتي ينشرها OpenClaw باسم `description_localizations` في Discord ويدرجها في مقارنات التسوية.
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  يسجل أوامر **Skills** بشكل أصلي عندما يكون ذلك مدعومًا. تلقائي: مفعّل لـ Discord/Telegram؛ معطل لـ Slack (يتطلب Slack إنشاء أمر شرطة مائلة لكل Skill). عيّن `channels.discord.commands.nativeSkills` أو `channels.telegram.commands.nativeSkills` أو `channels.slack.commands.nativeSkills` لتجاوز ذلك لكل موفر (قيمة منطقية أو `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  يفعّل `! <cmd>` لتشغيل أوامر صدفة المضيف (`/bash <cmd>` اسم بديل؛ يتطلب قوائم سماح `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  يتحكم في مدة انتظار bash قبل التبديل إلى وضع الخلفية (`0` ينقله إلى الخلفية فورًا).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  يفعّل `/config` (يقرأ/يكتب `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  يفعّل `/mcp` (يقرأ/يكتب إعدادات MCP التي يديرها OpenClaw ضمن `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  يفعّل `/plugins` (اكتشاف/حالة Plugin مع عناصر تحكم التثبيت + التفعيل/التعطيل).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  يفعّل `/debug` (تجاوزات وقت التشغيل فقط).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  يفعّل `/restart` مع إجراءات أداة إعادة تشغيل gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  يعيّن قائمة السماح الصريحة للمالك لأسطح الأوامر/الأدوات الخاصة بالمالك فقط. هذا هو حساب المشغل البشري الذي يمكنه الموافقة على الإجراءات الخطرة وتشغيل أوامر مثل `/diagnostics` و`/export-trajectory` و`/config`. وهي منفصلة عن `commands.allowFrom` وعن وصول إقران الرسائل الخاصة.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  لكل قناة: يجعل الأوامر الخاصة بالمالك فقط تتطلب **هوية المالك** للتشغيل على ذلك السطح. عندما تكون `true`، يجب أن يطابق المرسل إما مرشح مالك محلولًا (على سبيل المثال إدخالًا في `commands.ownerAllowFrom` أو بيانات تعريف مالك أصلية من الموفر) أو يمتلك نطاق `operator.admin` داخليًا على قناة رسائل داخلية. إدخال حرف بدل في `allowFrom` الخاصة بالقناة، أو قائمة مرشحي مالك فارغة/غير محلولة، **ليس** كافيًا — تفشل الأوامر الخاصة بالمالك فقط بشكل مغلق على تلك القناة. اترك هذا معطلًا إذا أردت أن تكون الأوامر الخاصة بالمالك فقط محكومة بـ `ownerAllowFrom` وقوائم سماح الأوامر القياسية فقط.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  يتحكم في كيفية ظهور معرفات المالك في موجّه النظام.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  يعيّن اختياريًا سر HMAC المستخدم عندما تكون `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  قائمة سماح لكل موفر لتفويض الأوامر. عند تكوينها، تكون مصدر التفويض الوحيد للأوامر والتوجيهات (يتم تجاهل قوائم سماح/إقران القناة و`commands.useAccessGroups`). استخدم `"*"` كافتراضي عام؛ وتتجاوزه المفاتيح الخاصة بالموفر.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  يفرض قوائم السماح/السياسات للأوامر عندما لا تكون `commands.allowFrom` معينة.
</ParamField>

## قائمة الأوامر

مصدر الحقيقة الحالي:

- تأتي المضمنات الأساسية من `src/auto-reply/commands-registry.shared.ts`
- تأتي أوامر اللوحة المنشأة من `src/auto-reply/commands-registry.data.ts`
- تأتي أوامر Plugin من استدعاءات `registerCommand()` الخاصة بـ Plugin
- لا يزال التوفر الفعلي على gateway الخاص بك يعتمد على علامات الإعدادات، وسطح القناة، وPlugins المثبتة/المفعلة

### الأوامر الأساسية المضمنة

<AccordionGroup>
  <Accordion title="الجلسات والتشغيلات">
    - يبدأ `/new [model]` جلسة جديدة؛ و`/reset` هو اسم بديل لإعادة التعيين.
    - تعترض Control UI الأمر `/new` المكتوب لإنشاء جلسة لوحة معلومات جديدة والتبديل إليها؛ بينما يظل `/reset` المكتوب يشغل إعادة التعيين الموضعية الخاصة بـ Gateway.
    - يحتفظ `/reset soft [message]` بالنص الحالي، ويسقط معرفات جلسات خلفية CLI المعاد استخدامها، ويعيد تشغيل تحميل بدء التشغيل/موجّه النظام موضعيًا.
    - يضغط `/compact [instructions]` سياق الجلسة. راجع [Compaction](/ar/concepts/compaction).
    - يلغي `/stop` التشغيل الحالي.
    - يدير `/session idle <duration|off>` و`/session max-age <duration|off>` انتهاء صلاحية ربط سلسلة الرسائل.
    - يصدر `/export-session [path]` الجلسة الحالية إلى HTML. الاسم البديل: `/export`.
    - يطلب `/export-trajectory [path]` موافقة exec، ثم يصدر [حزمة مسار](/ar/tools/trajectory) JSONL للجلسة الحالية. استخدمه عندما تحتاج إلى موجّه وتسلسل أدوات ونص جلسة OpenClaw واحدة. في المحادثات الجماعية، يذهب طلب الموافقة ونتيجة التصدير إلى المالك بشكل خاص. الاسم البديل: `/trajectory`.

  </Accordion>
  <Accordion title="عناصر التحكم في النموذج والتشغيل">
    - يعيّن `/think <level>` مستوى التفكير. تأتي الخيارات من ملف تعريف موفر النموذج النشط؛ المستويات الشائعة هي `off` و`minimal` و`low` و`medium` و`high`، مع مستويات مخصصة مثل `xhigh` أو `adaptive` أو `max` أو القيمة الثنائية `on` حيث تكون مدعومة فقط. الأسماء البديلة: `/thinking`, `/t`.
    - يبدّل `/verbose on|off|full` الإخراج المطول. الاسم البديل: `/v`.
    - يبدّل `/trace on|off` إخراج تتبع Plugin للجلسة الحالية.
    - يعرض `/fast [status|on|off]` الوضع السريع أو يعيّنه.
    - يبدّل `/reasoning [on|off|stream]` رؤية الاستدلال. الاسم البديل: `/reason`.
    - يبدّل `/elevated [on|off|ask|full]` الوضع المرتفع. الاسم البديل: `/elev`.
    - يعرض `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` إعدادات exec الافتراضية أو يعيّنها.
    - يعرض `/model [name|#|status]` النموذج أو يعيّنه.
    - يسرد `/models [provider] [page] [limit=<n>|size=<n>|all]` الموفرين المكوّنين/المتاحين عبر المصادقة أو النماذج لموفر؛ أضف `all` لتصفح الكتالوج الكامل لذلك الموفر.
    - يدير `/queue <mode>` سلوك قائمة الانتظار (`steer`، و`queue` القديم، و`followup`، و`collect`، و`steer-backlog`، و`interrupt`) مع خيارات مثل `debounce:0.5s cap:25 drop:summarize`؛ يمسح `/queue default` أو `/queue reset` تجاوز الجلسة. راجع [قائمة انتظار الأوامر](/ar/concepts/queue) و[قائمة انتظار التوجيه](/ar/concepts/queue-steering).

  </Accordion>
  <Accordion title="الاكتشاف والحالة">
    - يعرض `/help` ملخص المساعدة القصير.
    - يعرض `/commands` كتالوج الأوامر المنشأ.
    - يعرض `/tools [compact|verbose]` ما يمكن للوكيل الحالي استخدامه الآن.
    - يعرض `/status` حالة التنفيذ/وقت التشغيل، بما في ذلك تسميات `Execution`/`Runtime` واستخدام/حصة الموفر عند توفرها.
    - `/diagnostics [note]` هو تدفق تقرير الدعم الخاص بالمالك فقط لأخطاء Gateway وتشغيلات حزمة Codex. يطلب موافقة exec صريحة في كل مرة قبل تشغيل `openclaw gateway diagnostics export --json`؛ لا توافق على التشخيصات بقاعدة تسمح بكل شيء. بعد الموافقة، يرسل تقريرًا قابلًا للصق يتضمن مسار الحزمة المحلي، وملخص البيان، وملاحظات الخصوصية، ومعرفات الجلسات ذات الصلة. في المحادثات الجماعية، يذهب طلب الموافقة والتقرير إلى المالك بشكل خاص. عندما تستخدم الجلسة النشطة حزمة OpenAI Codex، ترسل الموافقة نفسها أيضًا ملاحظات Codex ذات الصلة إلى خوادم OpenAI، ويسرد الرد المكتمل معرفات جلسات OpenClaw، ومعرفات سلاسل Codex، وأوامر `codex resume <thread-id>`. راجع [تصدير التشخيصات](/ar/gateway/diagnostics).
    - يشغل `/crestodian <request>` مساعد إعداد وإصلاح Crestodian من رسالة خاصة للمالك.
    - يسرد `/tasks` المهام الخلفية النشطة/الأخيرة للجلسة الحالية.
    - يشرح `/context [list|detail|json]` كيفية تجميع السياق.
    - يعرض `/whoami` معرف المرسل الخاص بك. الاسم البديل: `/id`.
    - يتحكم `/usage off|tokens|full|cost` في تذييل الاستخدام لكل رد أو يطبع ملخص تكلفة محليًا.

  </Accordion>
  <Accordion title="Skills، وقوائم السماح، والموافقات">
    - يشغل `/skill <name> [input]` Skill بالاسم.
    - يدير `/allowlist [list|add|remove] ...` إدخالات قائمة السماح. نصي فقط.
    - يحل `/approve <id> <decision>` طلبات موافقة exec.
    - يطرح `/btw <question>` سؤالًا جانبيًا دون تغيير سياق الجلسة المستقبلي. راجع [BTW](/ar/tools/btw).

  </Accordion>
  <Accordion title="الوكلاء الفرعيون وACP">
    - يدير `/subagents list|kill|log|info|send|steer|spawn` تشغيلات الوكلاء الفرعيين للجلسة الحالية.
    - يدير `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` جلسات ACP وخيارات وقت التشغيل.
    - يربط `/focus <target>` سلسلة Discord الحالية أو موضوع/محادثة Telegram بهدف جلسة.
    - يزيل `/unfocus` الربط الحالي.
    - يسرد `/agents` الوكلاء المرتبطين بالسلسلة للجلسة الحالية.
    - يوقف `/kill <id|#|all>` وكيلا فرعيا واحدا قيد التشغيل أو كل الوكلاء الفرعيين.
    - يرسل `/steer <id|#> <message>` توجيها إلى وكيل فرعي قيد التشغيل. الاسم البديل: `/tell`.

  </Accordion>
  <Accordion title="الكتابات الخاصة بالمالك والإدارة">
    - يقرأ `/config show|get|set|unset` أو يكتب `openclaw.json`. للمالك فقط. يتطلب `commands.config: true`.
    - يقرأ `/mcp show|get|set|unset` أو يكتب إعداد خادم MCP المُدار بواسطة OpenClaw ضمن `mcp.servers`. للمالك فقط. يتطلب `commands.mcp: true`.
    - يفحص `/plugins list|inspect|show|get|install|enable|disable` حالة plugin أو يغيرها. `/plugin` هو اسم بديل. الكتابة للمالك فقط. يتطلب `commands.plugins: true`.
    - يدير `/debug show|set|unset|reset` تجاوزات الإعداد الخاصة بوقت التشغيل فقط. للمالك فقط. يتطلب `commands.debug: true`.
    - يعيد `/restart` تشغيل OpenClaw عند تفعيله. الافتراضي: مفعّل؛ اضبط `commands.restart: false` لتعطيله.
    - يضبط `/send on|off|inherit` سياسة الإرسال. للمالك فقط.

  </Accordion>
  <Accordion title="الصوت وTTS والتحكم بالقناة">
    - يتحكم `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` في TTS. راجع [TTS](/ar/tools/tts).
    - يضبط `/activation mention|always` وضع تفعيل المجموعة.
    - يشغّل `/bash <command>` أمرا في صدفة المضيف. نص فقط. الاسم البديل: `! <command>`. يتطلب `commands.bash: true` بالإضافة إلى قوائم سماح `tools.elevated`.
    - يفحص `!poll [sessionId]` مهمة bash في الخلفية.
    - يوقف `!stop [sessionId]` مهمة bash في الخلفية.

  </Accordion>
</AccordionGroup>

### أوامر الإرساء المولدة

تبدّل أوامر الإرساء مسار رد الجلسة الحالية إلى قناة أخرى مرتبطة.
راجع [إرساء القنوات](/ar/concepts/channel-docking) للإعداد
والأمثلة واستكشاف الأخطاء وإصلاحها.

تُولد أوامر الإرساء من channel plugins التي تدعم الأوامر الأصلية. المجموعة المضمّنة الحالية:

- `/dock-discord` (الاسم البديل: `/dock_discord`)
- `/dock-mattermost` (الاسم البديل: `/dock_mattermost`)
- `/dock-slack` (الاسم البديل: `/dock_slack`)
- `/dock-telegram` (الاسم البديل: `/dock_telegram`)

استخدم أوامر الإرساء من محادثة مباشرة لتبديل مسار رد الجلسة الحالية إلى قناة أخرى مرتبطة. يحتفظ الوكيل بسياق الجلسة نفسه، لكن الردود المستقبلية لتلك الجلسة تُسلّم إلى النظير المحدد في القناة.

تتطلب أوامر الإرساء `session.identityLinks`. يجب أن يكون المرسل المصدر والنظير الهدف ضمن مجموعة الهوية نفسها، مثلا `["telegram:123", "discord:456"]`. إذا أرسل مستخدم Telegram بالمعرف `123` الأمر `/dock_discord`، يخزن OpenClaw القيمتين `lastChannel: "discord"` و`lastTo: "456"` في الجلسة النشطة. إذا لم يكن المرسل مرتبطا بنظير Discord، يرد الأمر بتلميح إعداد بدلا من المتابعة إلى المحادثة العادية.

يغير الإرساء مسار الجلسة النشطة فقط. لا ينشئ حسابات قنوات، ولا يمنح وصولا، ولا يتجاوز قوائم سماح القنوات، ولا ينقل سجل النصوص إلى جلسة أخرى. استخدم `/dock-telegram` أو `/dock-slack` أو `/dock-mattermost` أو أمر إرساء مولدا آخر لتبديل المسار مرة أخرى.

### أوامر plugins المضمّنة

يمكن أن تضيف plugins المضمّنة مزيدا من أوامر الشرطة المائلة. الأوامر المضمّنة الحالية في هذا المستودع:

- يبدّل `/dreaming [on|off|status|help]` Dreaming الذاكرة. راجع [Dreaming](/ar/concepts/dreaming).
- يدير `/pair [qr|status|pending|approve|cleanup|notify]` تدفق إقران/إعداد الأجهزة. راجع [الإقران](/ar/channels/pairing).
- يسلّح `/phone status|arm <camera|screen|writes|all> [duration]|disarm` أوامر عقدة الهاتف عالية الخطورة مؤقتا.
- يدير `/voice status|list [limit]|set <voiceId|name>` إعداد صوت Talk. في Discord، اسم الأمر الأصلي هو `/talkvoice`.
- يرسل `/card ...` إعدادات بطاقات LINE الغنية الجاهزة. راجع [LINE](/ar/channels/line).
- يفحص `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills` ويتحكم في حزمة خادم التطبيق Codex المضمّنة. راجع [حزمة Codex](/ar/plugins/codex-harness).
- أوامر QQBot فقط:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### أوامر Skills الديناميكية

تُعرض Skills التي يمكن للمستخدم استدعاؤها أيضا كأوامر شرطة مائلة:

- يعمل `/skill <name> [input]` دائما كنقطة الدخول العامة.
- قد تظهر skills أيضا كأوامر مباشرة مثل `/prose` عندما تسجلها skill/plugin.
- يتحكم `commands.nativeSkills` و`channels.<provider>.commands.nativeSkills` في تسجيل أوامر skills الأصلية.
- يمكن لمواصفات الأوامر توفير `descriptionLocalizations` للأسطح الأصلية التي تدعم الأوصاف المترجمة، بما في ذلك Discord.

<AccordionGroup>
  <Accordion title="ملاحظات الوسائط والمحلل">
    - تقبل الأوامر علامة `:` اختيارية بين الأمر والوسائط (مثلا `/think: high`، `/send: on`، `/help:`).
    - يقبل `/new <model>` اسما بديلا للنموذج، أو `provider/model`، أو اسم موفر (تطابق تقريبي)؛ وإذا لم يوجد تطابق، يُعامل النص كمتن الرسالة.
    - للحصول على تفصيل كامل لاستخدام الموفر، استخدم `openclaw status --usage`.
    - يتطلب `/allowlist add|remove` القيمة `commands.config=true` ويحترم `configWrites` الخاصة بالقناة.
    - في القنوات متعددة الحسابات، تحترم أيضا أوامر `/allowlist --account <id>` الموجهة للإعداد و`/config set channels.<provider>.accounts.<id>...` القيمة `configWrites` الخاصة بالحساب الهدف.
    - يتحكم `/usage` في تذييل الاستخدام لكل رد؛ ويطبع `/usage cost` ملخص تكلفة محليا من سجلات جلسات OpenClaw.
    - يكون `/restart` مفعلا افتراضيا؛ اضبط `commands.restart: false` لتعطيله.
    - يقبل `/plugins install <spec>` مواصفات Plugin نفسها التي يقبلها `openclaw plugins install`: مسار/أرشيف محلي، أو حزمة npm، أو `git:<repo>`، أو `clawhub:<pkg>`، ثم يطلب إعادة تشغيل Gateway لأن وحدات مصدر plugin تغيرت.
    - يحدّث `/plugins enable|disable` إعداد plugin ويشغّل إعادة تحميل Gateway plugins للمنعطفات الجديدة للوكيل.

  </Accordion>
  <Accordion title="السلوك الخاص بالقناة">
    - أمر أصلي خاص بـ Discord فقط: يتحكم `/vc join|leave|status` في قنوات الصوت (غير متاح كنص). يتطلب `join` خادما وقناة صوت/مسرح محددة. يتطلب `channels.discord.voice` وأوامر أصلية.
    - تتطلب أوامر ربط سلاسل Discord (`/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age`) تفعيل روابط السلاسل الفعالة (`session.threadBindings.enabled` و/أو `channels.discord.threadBindings.enabled`).
    - مرجع أوامر ACP وسلوك وقت التشغيل: [وكلاء ACP](/ar/tools/acp-agents).

  </Accordion>
  <Accordion title="سلامة الإسهاب / التتبع / السرعة / الاستدلال">
    - الغرض من `/verbose` هو التصحيح وإتاحة رؤية إضافية؛ أبقه **متوقفا** في الاستخدام العادي.
    - `/trace` أضيق من `/verbose`: فهو يكشف فقط أسطر التتبع/التصحيح المملوكة لـ plugin ويبقي ضجيج الأدوات الإسهابي العادي متوقفا.
    - يحفظ `/fast on|off` تجاوزا للجلسة. استخدم خيار `inherit` في واجهة جلسات المستخدم لمسحه والرجوع إلى الإعدادات الافتراضية.
    - `/fast` خاص بالموفر: يعيّنه OpenAI/OpenAI Codex إلى `service_tier=priority` على نقاط نهاية Responses الأصلية، بينما تعيّنه طلبات Anthropic العامة المباشرة، بما في ذلك حركة المرور المرسلة إلى `api.anthropic.com` والمصادق عليها عبر OAuth، إلى `service_tier=auto` أو `standard_only`. راجع [OpenAI](/ar/providers/openai) و[Anthropic](/ar/providers/anthropic).
    - لا تزال ملخصات فشل الأدوات تظهر عند الصلة، لكن نص الفشل التفصيلي لا يُضمّن إلا عندما يكون `/verbose` بالقيمة `on` أو `full`.
    - `/reasoning` و`/verbose` و`/trace` محفوفة بالمخاطر في إعدادات المجموعات: قد تكشف استدلالا داخليا أو مخرجات أدوات أو تشخيصات plugins لم تكن تقصد كشفها. يفضل تركها متوقفة، خصوصا في دردشات المجموعات.

  </Accordion>
  <Accordion title="تبديل النموذج">
    - يحفظ `/model` نموذج الجلسة الجديد فورا.
    - إذا كان الوكيل خاملا، يستخدمه التشغيل التالي مباشرة.
    - إذا كان هناك تشغيل نشط بالفعل، يضع OpenClaw التبديل الحي في حالة انتظار ولا يعيد التشغيل بالنموذج الجديد إلا عند نقطة إعادة محاولة نظيفة.
    - إذا بدأ نشاط الأداة أو إخراج الرد بالفعل، فقد يبقى التبديل المعلق في قائمة الانتظار حتى فرصة إعادة محاولة لاحقة أو منعطف المستخدم التالي.
    - في TUI المحلي، يعيدك `/crestodian [request]` من TUI الوكيل العادي إلى Crestodian. هذا منفصل عن وضع إنقاذ قنوات الرسائل ولا يمنح صلاحية إعداد عن بُعد.

  </Accordion>
  <Accordion title="المسار السريع والاختصارات المضمنة">
    - **المسار السريع:** تُعالج الرسائل التي تحتوي على أوامر فقط من مرسلين موجودين في قائمة السماح فورا (تجاوز الطابور + النموذج).
    - **بوابة إشارات المجموعات:** تتجاوز الرسائل التي تحتوي على أوامر فقط من مرسلين موجودين في قائمة السماح متطلبات الإشارة.
    - **الاختصارات المضمنة (للمرسلين الموجودين في قائمة السماح فقط):** تعمل بعض الأوامر أيضا عند تضمينها في رسالة عادية وتُزال قبل أن يرى النموذج النص المتبقي.
      - مثال: يطلق `hey /status` رد حالة، ويواصل النص المتبقي التدفق العادي.
    - حاليا: `/help` و`/commands` و`/status` و`/whoami` (`/id`).
    - تُتجاهل بصمت الرسائل غير المصرح بها التي تحتوي على أوامر فقط، وتُعامل رموز `/...` المضمنة كنص عادي.

  </Accordion>
  <Accordion title="أوامر Skills والوسائط الأصلية">
    - **أوامر Skills:** تُعرض skills ذات `user-invocable` كأوامر شرطة مائلة. تُنظف الأسماء إلى `a-z0-9_` (بحد أقصى 32 حرفا)؛ وتحصل التصادمات على لواحق رقمية (مثلا `_2`).
      - يشغّل `/skill <name> [input]` skill بالاسم (مفيد عندما تمنع حدود الأوامر الأصلية إنشاء أوامر لكل skill).
      - افتراضيا، تُمرر أوامر skills إلى النموذج كطلب عادي.
      - قد تعلن Skills اختياريا `command-dispatch: tool` لتوجيه الأمر مباشرة إلى أداة (حتمي، بلا نموذج).
      - مثال: `/prose` (OpenProse plugin) — راجع [OpenProse](/ar/prose).
    - **وسائط الأوامر الأصلية:** يستخدم Discord الإكمال التلقائي للخيارات الديناميكية (وقوائم الأزرار عندما تحذف الوسائط المطلوبة). يعرض Telegram وSlack قائمة أزرار عندما يدعم الأمر اختيارات وتحذف الوسيط. تُحل الاختيارات الديناميكية مقابل نموذج الجلسة الهدف، لذلك تتبع الخيارات الخاصة بالنموذج مثل مستويات `/think` تجاوز `/model` لتلك الجلسة.

  </Accordion>
</AccordionGroup>

## `/tools`

يجيب `/tools` عن سؤال وقت تشغيل، لا عن سؤال إعداد: **ما الذي يستطيع هذا الوكيل استخدامه الآن في هذه المحادثة**.

- يكون `/tools` الافتراضي مضغوطا ومحسنا للمسح السريع.
- يضيف `/tools verbose` أوصافا قصيرة.
- تعرض أسطح الأوامر الأصلية التي تدعم الوسائط مفتاح الوضع نفسه مثل `compact|verbose`.
- تكون النتائج محددة بنطاق الجلسة، لذلك قد يغير تبديل الوكيل أو القناة أو السلسلة أو تفويض المرسل أو النموذج الناتج.
- يتضمن `/tools` الأدوات المتاحة فعليا في وقت التشغيل، بما في ذلك الأدوات الأساسية وأدوات plugins المتصلة والأدوات المملوكة للقناة.

لتحرير الملفات الشخصية والتجاوزات، استخدم لوحة أدوات واجهة التحكم أو أسطح الإعداد/الفهرس بدلا من التعامل مع `/tools` كفهرس ثابت.

## أسطح الاستخدام (ما يظهر وأين)

- **استخدام/حصة المزوّد** (مثال: "Claude 80% متبقية") يظهر في `/status` لمزوّد النموذج الحالي عند تمكين تتبع الاستخدام. يوحّد OpenClaw نوافذ المزوّدين إلى `% متبقية`؛ وبالنسبة إلى MiniMax، تُعكس حقول النسبة المئوية التي تعرض المتبقي فقط قبل العرض، وتفضّل استجابات `model_remains` إدخال نموذج المحادثة مع تسمية خطة موسومة بالنموذج.
- **أسطر الرموز/التخزين المؤقت** في `/status` يمكن أن ترجع إلى أحدث إدخال لاستخدام السجل النصي عندما تكون لقطة الجلسة الحية شحيحة. تظل القيم الحية غير الصفرية الحالية هي الأسبق، ويمكن لاحتياطي السجل النصي أيضًا استعادة تسمية نموذج وقت التشغيل النشط مع إجمالي أكبر موجه نحو الموجهات عندما تكون الإجماليات المخزنة مفقودة أو أصغر.
- **التنفيذ مقابل وقت التشغيل:** يعرض `/status` قيمة `Execution` لمسار صندوق العزل الفعّال و`Runtime` لمن يشغّل الجلسة فعليًا: `OpenClaw Pi Default` أو `OpenAI Codex` أو واجهة CLI خلفية أو واجهة ACP خلفية.
- **الرموز/التكلفة لكل استجابة** يتحكم بها `/usage off|tokens|full` (تُضاف إلى الردود العادية).
- `/model status` يتعلق بـ **النماذج/المصادقة/نقاط النهاية**، وليس الاستخدام.

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

- يعرض `/model` و`/model list` منتقيًا مضغوطًا ومرقمًا (عائلة النموذج + المزوّدون المتاحون).
- على Discord، يفتح `/model` و`/models` منتقيًا تفاعليًا مع قوائم منسدلة للمزوّد والنموذج إضافةً إلى خطوة Submit.
- يختار `/model <#>` من ذلك المنتقي (ويفضّل المزوّد الحالي عندما يكون ذلك ممكنًا).
- يعرض `/model status` العرض التفصيلي، بما في ذلك نقطة نهاية المزوّد المكوّنة (`baseUrl`) ووضع API (`api`) عند توفرهما.

## تجاوزات التصحيح

يتيح لك `/debug` تعيين تجاوزات إعدادات **وقت التشغيل فقط** (في الذاكرة، لا على القرص). للمالك فقط. معطل افتراضيًا؛ فعّله باستخدام `commands.debug: true`.

أمثلة:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
تُطبّق التجاوزات فورًا على قراءات الإعدادات الجديدة، لكنها لا تكتب إلى `openclaw.json`. استخدم `/debug reset` لمسح جميع التجاوزات والعودة إلى إعدادات القرص.
</Note>

## مخرجات تتبع Plugin

يتيح لك `/trace` تبديل **أسطر تتبع/تصحيح Plugin على نطاق الجلسة** دون تشغيل الوضع المطوّل الكامل.

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
- لا يستبدل `/trace` الأمر `/debug`؛ فما زال `/debug` يدير تجاوزات إعدادات وقت التشغيل فقط.
- لا يستبدل `/trace` الأمر `/verbose`؛ فما زالت مخرجات الأداة/الحالة المطوّلة العادية تخص `/verbose`.

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
تُتحقق صحة الإعدادات قبل الكتابة؛ وتُرفض التغييرات غير الصالحة. تستمر تحديثات `/config` عبر عمليات إعادة التشغيل.
</Note>

## تحديثات MCP

يكتب `/mcp` تعريفات خوادم MCP المُدارة من OpenClaw ضمن `mcp.servers`. للمالك فقط. معطل افتراضيًا؛ فعّله باستخدام `commands.mcp: true`.

أمثلة:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
يخزن `/mcp` الإعدادات في إعدادات OpenClaw، وليس في إعدادات المشروع المملوكة لـ Pi. تقرر مهايئات وقت التشغيل أي وسائل النقل قابلة للتنفيذ فعليًا.
</Note>

## تحديثات Plugin

يتيح `/plugins` للمشغّلين فحص Plugins المكتشفة وتبديل التمكين في الإعدادات. يمكن لتدفقات القراءة فقط استخدام `/plugin` كاسم مستعار. معطل افتراضيًا؛ فعّله باستخدام `commands.plugins: true`.

أمثلة:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- يستخدم `/plugins list` و`/plugins show` اكتشافًا حقيقيًا للـ Plugins مقابل مساحة العمل الحالية وإعدادات القرص.
- يثبّت `/plugins install` من ClawHub وnpm وgit والأدلة المحلية والأرشيفات.
- يحدّث `/plugins enable|disable` إعدادات Plugin فقط؛ ولا يثبّت Plugins أو يزيل تثبيتها.
- تؤدي تغييرات التمكين والتعطيل إلى إعادة تحميل ساخنة لأسطح وقت تشغيل Gateway الخاصة بـ Plugin للدورات الجديدة للوكيل؛ أما التثبيت فيطلب إعادة تشغيل Gateway لأن وحدات مصدر Plugin تغيّرت.

</Note>

## ملاحظات الأسطح

<AccordionGroup>
  <Accordion title="Sessions per surface">
    - تعمل **الأوامر النصية** في جلسة المحادثة العادية (تشارك الرسائل المباشرة `main`، وللمجموعات جلساتها الخاصة).
    - تستخدم **الأوامر الأصلية** جلسات معزولة:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (البادئة قابلة للتهيئة عبر `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: `telegram:slash:<userId>` (تستهدف جلسة المحادثة عبر `CommandTargetSessionKey`)
    - يستهدف **`/stop`** جلسة المحادثة النشطة كي يتمكن من إجهاض التشغيل الحالي.

  </Accordion>
  <Accordion title="Slack specifics">
    ما زال `channels.slack.slashCommand` مدعومًا لأمر واحد بنمط `/openclaw`. إذا فعّلت `commands.native`، فيجب إنشاء أمر Slack slash واحد لكل أمر مدمج (بنفس أسماء `/help`). تُسلّم قوائم وسيطات الأوامر في Slack كأزرار Block Kit مؤقتة.

    استثناء Slack الأصلي: سجّل `/agentstatus` (وليس `/status`) لأن Slack يحجز `/status`. ما زال النص `/status` يعمل في رسائل Slack.

  </Accordion>
</AccordionGroup>

## أسئلة جانبية BTW

`/btw` هو **سؤال جانبي** سريع عن الجلسة الحالية.

بخلاف المحادثة العادية:

- يستخدم الجلسة الحالية كسياق خلفي،
- يعمل كاستدعاء منفصل لمرة واحدة **بلا أدوات**،
- لا يغيّر سياق الجلسة المستقبلية،
- لا يُكتب في سجل النصوص،
- يُسلّم كنتيجة جانبية حية بدلًا من رسالة مساعد عادية.

يجعل ذلك `/btw` مفيدًا عندما تريد توضيحًا مؤقتًا بينما تستمر المهمة الرئيسية.

مثال:

```text
/btw what are we doing right now?
```

راجع [أسئلة BTW الجانبية](/ar/tools/btw) للاطلاع على السلوك الكامل وتفاصيل تجربة مستخدم العميل.

## ذات صلة

- [إنشاء Skills](/ar/tools/creating-skills)
- [Skills](/ar/tools/skills)
- [إعدادات Skills](/ar/tools/skills-config)

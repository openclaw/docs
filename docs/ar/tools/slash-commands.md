---
read_when:
    - استخدام أو تهيئة أوامر الدردشة
    - تصحيح توجيه الأوامر أو الأذونات
summary: 'أوامر الشرطة المائلة: النصية مقابل الأصلية، والإعدادات، والأوامر المدعومة'
title: أوامر الشرطة المائلة
x-i18n:
    generated_at: "2026-04-24T08:11:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: f708cb3c4c22dc7a97b62ce5e2283b4ecfa5c44f72eb501934e80f80181953b7
    source_path: tools/slash-commands.md
    workflow: 15
---

تتم معالجة الأوامر بواسطة Gateway. ويجب إرسال معظم الأوامر كرسالة **مستقلة** تبدأ بـ `/`.
أما أمر bash الخاص بالدردشة على المضيف فقط فيستخدم `! <cmd>` ‏(مع `/bash <cmd>` كاسم مستعار).

هناك نظامان مرتبطان:

- **الأوامر**: رسائل مستقلة من الشكل `/...`.
- **التوجيهات**: ‏`/think` و`/fast` و`/verbose` و`/trace` و`/reasoning` و`/elevated` و`/exec` و`/model` و`/queue`.
  - تتم إزالة التوجيهات من الرسالة قبل أن يراها النموذج.
  - في رسائل الدردشة العادية (وليست رسائل توجيهات فقط)، تُعامل على أنها "تلميحات ضمنية" ولا **تستمر** كإعدادات للجلسة.
  - في الرسائل التي تحتوي على توجيهات فقط (أي أن الرسالة لا تحتوي إلا على توجيهات)، تستمر في الجلسة وترد بإقرار.
  - لا تُطبّق التوجيهات إلا على **المرسلين المخولين**. وإذا تم ضبط `commands.allowFrom`، فهي قائمة
    السماح الوحيدة المستخدمة؛ وإلا يأتي التفويض من قوائم السماح/الاقتران الخاصة بالقنوات بالإضافة إلى `commands.useAccessGroups`.
    أما المرسلون غير المخولين فيرون التوجيهات كنص عادي.

وهناك أيضًا بعض **الاختصارات المضمنة** (للمرسلين المدرجين في قائمة السماح/المخولين فقط): ‏`/help` و`/commands` و`/status` و`/whoami` ‏(`/id`).
تعمل هذه فورًا، وتُزال قبل أن يرى النموذج الرسالة، ويستمر النص المتبقي عبر المسار العادي.

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

- يؤدي `commands.text` ‏(الافتراضي `true`) إلى تفعيل تحليل `/...` في رسائل الدردشة.
  - على الأسطح التي لا تدعم الأوامر الأصلية (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams)، تظل الأوامر النصية تعمل حتى إذا ضبطت هذا على `false`.
- يقوم `commands.native` ‏(الافتراضي `"auto"`) بتسجيل الأوامر الأصلية.
  - الوضع التلقائي: مفعّل في Discord/Telegram؛ ومعطل في Slack ‏(إلى أن تضيف slash commands)؛ ويتم تجاهله في providers التي لا تدعم الأوامر الأصلية.
  - اضبط `channels.discord.commands.native` أو `channels.telegram.commands.native` أو `channels.slack.commands.native` للتجاوز لكل provider ‏(قيمة منطقية أو `"auto"`).
  - تؤدي القيمة `false` إلى مسح الأوامر المسجلة سابقًا في Discord/Telegram عند بدء التشغيل. أما أوامر Slack فتُدار في تطبيق Slack ولا تتم إزالتها تلقائيًا.
- يقوم `commands.nativeSkills` ‏(الافتراضي `"auto"`) بتسجيل أوامر **Skills** بشكل أصلي عندما يكون ذلك مدعومًا.
  - الوضع التلقائي: مفعّل في Discord/Telegram؛ ومعطل في Slack ‏(يتطلب Slack إنشاء slash command لكل Skill).
  - اضبط `channels.discord.commands.nativeSkills` أو `channels.telegram.commands.nativeSkills` أو `channels.slack.commands.nativeSkills` للتجاوز لكل provider ‏(قيمة منطقية أو `"auto"`).
- يؤدي `commands.bash` ‏(الافتراضي `false`) إلى تفعيل `! <cmd>` لتشغيل أوامر shell على المضيف (`/bash <cmd>` اسم مستعار؛ ويتطلب قوائم السماح `tools.elevated`).
- يتحكم `commands.bashForegroundMs` ‏(الافتراضي `2000`) في المدة التي ينتظرها bash قبل التحول إلى وضع الخلفية (`0` ينقلها إلى الخلفية فورًا).
- يؤدي `commands.config` ‏(الافتراضي `false`) إلى تفعيل `/config` ‏(لقراءة/كتابة `openclaw.json`).
- يؤدي `commands.mcp` ‏(الافتراضي `false`) إلى تفعيل `/mcp` ‏(لقراءة/كتابة إعدادات MCP التي يديرها OpenClaw تحت `mcp.servers`).
- يؤدي `commands.plugins` ‏(الافتراضي `false`) إلى تفعيل `/plugins` ‏(اكتشاف/حالة Plugins بالإضافة إلى أدوات التثبيت + التفعيل/التعطيل).
- يؤدي `commands.debug` ‏(الافتراضي `false`) إلى تفعيل `/debug` ‏(تجاوزات وقت التشغيل فقط).
- يؤدي `commands.restart` ‏(الافتراضي `true`) إلى تفعيل `/restart` بالإضافة إلى إجراءات أداة إعادة تشغيل gateway.
- تضبط `commands.ownerAllowFrom` ‏(اختياري) قائمة السماح الصريحة للمالك لأسطح الأوامر/الأدوات الخاصة بالمالك فقط. وهي منفصلة عن `commands.allowFrom`.
- تجعل القيمة `channels.<channel>.commands.enforceOwnerForCommands` لكل قناة ‏(اختيارية، والافتراضي `false`) الأوامر الخاصة بالمالك تتطلب **هوية المالك** للتشغيل على ذلك السطح. وعندما تكون `true`، يجب أن يطابق المرسل إما مرشح مالك محلولًا (مثل إدخال في `commands.ownerAllowFrom` أو بيانات تعريف أصلية للمالك في provider) أو أن يمتلك النطاق الداخلي `operator.admin` على قناة رسائل داخلية. ولا يكفي إدخال wildcard في `allowFrom` الخاصة بالقناة، أو قائمة مرشحين فارغة/غير محلولة — إذ تفشل الأوامر الخاصة بالمالك في وضع مغلق على تلك القناة. اترك هذا معطلًا إذا كنت تريد أن تكون الأوامر الخاصة بالمالك محكومة فقط بواسطة `ownerAllowFrom` وقوائم السماح القياسية للأوامر.
- تتحكم `commands.ownerDisplay` في كيفية ظهور معرّفات المالك في system prompt: ‏`raw` أو `hash`.
- تضبط `commands.ownerDisplaySecret` اختياريًا سر HMAC المستخدم عندما تكون `commands.ownerDisplay="hash"`.
- تضبط `commands.allowFrom` ‏(اختياري) قائمة سماح لكل provider لتفويض الأوامر. وعند ضبطها، تكون هي
  مصدر التفويض الوحيد للأوامر والتوجيهات (ويتم تجاهل قوائم السماح/الاقتران الخاصة بالقنوات و`commands.useAccessGroups`).
  استخدم `"*"` كافتراضي عام؛ وتقوم المفاتيح الخاصة بكل provider بتجاوزه.
- تفرض `commands.useAccessGroups` ‏(الافتراضي `true`) قوائم السماح/السياسات على الأوامر عندما لا تكون `commands.allowFrom` مضبوطة.

## قائمة الأوامر

المصدر الحالي للحقيقة:

- تأتي الأوامر الأساسية المضمنة من `src/auto-reply/commands-registry.shared.ts`
- تأتي أوامر dock المولّدة من `src/auto-reply/commands-registry.data.ts`
- تأتي أوامر Plugins من استدعاءات Plugin لـ `registerCommand()`
- لا يزال التوفر الفعلي على Gateway لديك يعتمد على أعلام الإعدادات، وسطح القناة، وPlugins المثبتة/المفعلة

### الأوامر الأساسية المضمنة

الأوامر المضمنة المتاحة اليوم:

- يبدأ `/new [model]` جلسة جديدة؛ و`/reset` هو الاسم المستعار لإعادة التعيين.
- يحتفظ `/reset soft [message]` بنص الجلسة الحالي، ويسقط معرّفات جلسات CLI backend المعاد استخدامها، ويعيد تشغيل تحميل startup/system-prompt في المكان نفسه.
- يقوم `/compact [instructions]` بإجراء Compaction لسياق الجلسة. راجع [/concepts/compaction](/ar/concepts/compaction).
- يوقف `/stop` التشغيل الحالي.
- يدير `/session idle <duration|off>` و`/session max-age <duration|off>` انتهاء صلاحية thread-binding.
- يضبط `/think <level>` مستوى التفكير. تأتي الخيارات من ملف provider الخاص بالنموذج النشط؛ وتشمل المستويات الشائعة `off` و`minimal` و`low` و`medium` و`high`، مع مستويات مخصصة مثل `xhigh` و`adaptive` و`max` أو الثنائية `on` فقط عند الدعم. الأسماء المستعارة: `/thinking` و`/t`.
- يبدّل `/verbose on|off|full` الإخراج المفصل. الاسم المستعار: `/v`.
- يبدّل `/trace on|off` مخرجات تتبع Plugin للجلسة الحالية.
- يعرض `/fast [status|on|off]` الوضع السريع أو يضبطه.
- يبدّل `/reasoning [on|off|stream]` إظهار الاستدلال. الاسم المستعار: `/reason`.
- يبدّل `/elevated [on|off|ask|full]` وضع Elevated. الاسم المستعار: `/elev`.
- يعرض `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` إعدادات exec الافتراضية أو يضبطها.
- يعرض `/model [name|#|status]` النموذج أو يضبطه.
- يسرد `/models [provider] [page] [limit=<n>|size=<n>|all]` providers أو نماذج provider.
- يدير `/queue <mode>` سلوك الطابور (`steer` و`interrupt` و`followup` و`collect` و`steer-backlog`) بالإضافة إلى خيارات مثل `debounce:2s cap:25 drop:summarize`.
- يعرض `/help` ملخص المساعدة القصير.
- يعرض `/commands` فهرس الأوامر المولّد.
- يعرض `/tools [compact|verbose]` ما الذي يمكن للوكيل الحالي استخدامه الآن.
- يعرض `/status` حالة وقت التشغيل، بما في ذلك تسميات `Runtime`/`Runner` واستخدام/حصة provider عند التوفر.
- يسرد `/tasks` مهام الخلفية النشطة/الحديثة للجلسة الحالية.
- يشرح `/context [list|detail|json]` كيفية تجميع السياق.
- يصدّر `/export-session [path]` الجلسة الحالية إلى HTML. الاسم المستعار: `/export`.
- يصدّر `/export-trajectory [path]` [trajectory bundle](/ar/tools/trajectory) بصيغة JSONL للجلسة الحالية. الاسم المستعار: `/trajectory`.
- يعرض `/whoami` معرّف المرسل الخاص بك. الاسم المستعار: `/id`.
- يشغّل `/skill <name> [input]` Skill بالاسم.
- يدير `/allowlist [list|add|remove] ...` إدخالات قائمة السماح. نصي فقط.
- يعالج `/approve <id> <decision>` مطالبات موافقة exec.
- يطرح `/btw <question>` سؤالًا جانبيًا دون تغيير سياق الجلسة المستقبلي. راجع [/tools/btw](/ar/tools/btw).
- يدير `/subagents list|kill|log|info|send|steer|spawn` تشغيلات الوكلاء الفرعيين للجلسة الحالية.
- يدير `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` جلسات ACP وخيارات وقت التشغيل.
- يربط `/focus <target>` سلسلة Discord الحالية أو موضوع/محادثة Telegram بهدف جلسة.
- يزيل `/unfocus` الربط الحالي.
- يسرد `/agents` الوكلاء المرتبطين بالسلسلة للجلسة الحالية.
- يوقف `/kill <id|#|all>` وكيلًا فرعيًا واحدًا أو جميع الوكلاء الجاري تشغيلهم.
- يرسل `/steer <id|#> <message>` توجيهًا إلى وكيل فرعي قيد التشغيل. الاسم المستعار: `/tell`.
- يقرأ `/config show|get|set|unset` ملف `openclaw.json` أو يكتبه. للمالك فقط. ويتطلب `commands.config: true`.
- يقرأ `/mcp show|get|set|unset` إعدادات خادم MCP التي يديرها OpenClaw تحت `mcp.servers` أو يكتبها. للمالك فقط. ويتطلب `commands.mcp: true`.
- يفحص `/plugins list|inspect|show|get|install|enable|disable` حالة Plugins أو يغيّرها. و`/plugin` اسم مستعار. الكتابة للمالك فقط. ويتطلب `commands.plugins: true`.
- يدير `/debug show|set|unset|reset` تجاوزات إعدادات وقت التشغيل فقط. للمالك فقط. ويتطلب `commands.debug: true`.
- يتحكم `/usage off|tokens|full|cost` في تذييل الاستخدام لكل استجابة أو يطبع ملخصًا محليًا للتكلفة.
- يتحكم `/tts on|off|status|provider|limit|summary|audio|help` في TTS. راجع [/tools/tts](/ar/tools/tts).
- يعيد `/restart` تشغيل OpenClaw عندما يكون ذلك مفعّلًا. الافتراضي: مفعّل؛ اضبط `commands.restart: false` لتعطيله.
- يضبط `/activation mention|always` وضع تفعيل المجموعة.
- يضبط `/send on|off|inherit` سياسة الإرسال. للمالك فقط.
- يشغّل `/bash <command>` أمر shell على المضيف. نصي فقط. الاسم المستعار: `! <command>`. ويتطلب `commands.bash: true` بالإضافة إلى قوائم السماح `tools.elevated`.
- يتحقق `!poll [sessionId]` من مهمة bash في الخلفية.
- يوقف `!stop [sessionId]` مهمة bash في الخلفية.

### أوامر dock المولّدة

يتم توليد أوامر dock من Plugins القنوات التي تدعم الأوامر الأصلية. المجموعة المضمنة الحالية:

- `/dock-discord` ‏(الاسم المستعار: `/dock_discord`)
- `/dock-mattermost` ‏(الاسم المستعار: `/dock_mattermost`)
- `/dock-slack` ‏(الاسم المستعار: `/dock_slack`)
- `/dock-telegram` ‏(الاسم المستعار: `/dock_telegram`)

### أوامر Plugins المضمنة

يمكن لـ Plugins المضمنة إضافة المزيد من أوامر الشرطة المائلة. الأوامر المضمنة الحالية في هذا المستودع:

- يبدّل `/dreaming [on|off|status|help]` Dreaming في الذاكرة. راجع [Dreaming](/ar/concepts/dreaming).
- يدير `/pair [qr|status|pending|approve|cleanup|notify]` تدفق اقتران/إعداد الأجهزة. راجع [الاقتران](/ar/channels/pairing).
- يقوم `/phone status|arm <camera|screen|writes|all> [duration]|disarm` بتسليح أوامر phone node عالية الخطورة مؤقتًا.
- يدير `/voice status|list [limit]|set <voiceId|name>` إعدادات صوت Talk. وفي Discord، يكون اسم الأمر الأصلي هو `/talkvoice`.
- يرسل `/card ...` بطاقات LINE الغنية الجاهزة. راجع [LINE](/ar/channels/line).
- يفحص `/codex status|models|threads|resume|compact|review|account|mcp|skills` ويضبط Codex app-server harness المضمّن. راجع [Codex Harness](/ar/plugins/codex-harness).
- أوامر QQBot فقط:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### أوامر Skills الديناميكية

تُكشف Skills القابلة للاستدعاء من المستخدم أيضًا كأوامر شرطة مائلة:

- يعمل `/skill <name> [input]` دائمًا كنقطة دخول عامة.
- قد تظهر Skills أيضًا كأوامر مباشرة مثل `/prose` عندما تقوم Skill/Plugin بتسجيلها.
- يتم التحكم في تسجيل أوامر Skills الأصلية بواسطة `commands.nativeSkills` و`channels.<provider>.commands.nativeSkills`.

ملاحظات:

- تقبل الأوامر اختياريًا وجود `:` بين الأمر والوسيطات (مثل `/think: high` و`/send: on` و`/help:`).
- يقبل `/new <model>` اسمًا مستعارًا للنموذج، أو `provider/model`، أو اسم provider ‏(مطابقة ضبابية)؛ وإذا لم توجد مطابقة، فيُعامل النص على أنه جسم الرسالة.
- للحصول على تفصيل كامل لاستخدام provider، استخدم `openclaw status --usage`.
- يتطلب `/allowlist add|remove` وجود `commands.config=true` ويحترم `configWrites` الخاصة بالقناة.
- في القنوات متعددة الحسابات، تحترم أوامر `/allowlist --account <id>` المستهدِفة للإعدادات و`/config set channels.<provider>.accounts.<id>...` أيضًا قيمة `configWrites` للحساب المستهدف.
- يتحكم `/usage` في تذييل الاستخدام لكل استجابة؛ ويطبع `/usage cost` ملخصًا محليًا للتكلفة من سجلات جلسات OpenClaw.
- يكون `/restart` مفعّلًا افتراضيًا؛ اضبط `commands.restart: false` لتعطيله.
- يقبل `/plugins install <spec>` مواصفات Plugins نفسها التي يقبلها `openclaw plugins install`: مسار/أرشيف محلي، أو حزمة npm، أو `clawhub:<pkg>`.
- يقوم `/plugins enable|disable` بتحديث إعدادات Plugin وقد يطالب بإعادة التشغيل.
- أمر أصلي خاص بـ Discord فقط: ‏`/vc join|leave|status` يتحكم في القنوات الصوتية (ويتطلب `channels.discord.voice` والأوامر الأصلية؛ وليس متاحًا كنص).
- تتطلب أوامر الربط بالسلاسل في Discord ‏(`/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age`) أن تكون روابط السلاسل الفعالة مفعلة (`session.threadBindings.enabled` و/أو `channels.discord.threadBindings.enabled`).
- مرجع أوامر ACP وسلوك وقت التشغيل: [وكلاء ACP](/ar/tools/acp-agents).
- المقصود من `/verbose` هو التصحيح وزيادة الرؤية؛ فأبقِه **معطلًا** في الاستخدام العادي.
- يُعد `/trace` أضيق من `/verbose`: فهو يكشف فقط أسطر التتبع/التصحيح المملوكة للـ Plugin ويحافظ على ضجيج الأدوات المفصل العادي معطلًا.
- يؤدي `/fast on|off` إلى حفظ تجاوز للجلسة. استخدم خيار `inherit` في واجهة Sessions لمسحه والرجوع إلى افتراضيات الإعدادات.
- يكون `/fast` خاصًا بالـ provider: حيث يربطه OpenAI/OpenAI Codex إلى `service_tier=priority` على نقاط نهاية Responses الأصلية، بينما تربطه طلبات Anthropic العامة المباشرة، بما في ذلك الحركة الموثقة عبر OAuth المرسلة إلى `api.anthropic.com`، إلى `service_tier=auto` أو `standard_only`. راجع [OpenAI](/ar/providers/openai) و[Anthropic](/ar/providers/anthropic).
- لا تزال ملخصات فشل الأدوات تُعرض عند الاقتضاء، لكن نص الفشل التفصيلي لا يُدرج إلا عندما يكون `/verbose` في وضع `on` أو `full`.
- تُعد `/reasoning` و`/verbose` و`/trace` خطرة في إعدادات المجموعات: فقد تكشف استدلالًا داخليًا أو مخرجات أدوات أو تشخيصات Plugin لم تكن تنوي كشفها. ففضّل تركها معطلة، خصوصًا في دردشات المجموعات.
- يحفظ `/model` النموذج الجديد للجلسة فورًا.
- إذا كان الوكيل خاملاً، فإن التشغيل التالي يستخدمه مباشرة.
- وإذا كان تشغيل ما نشطًا بالفعل، فإن OpenClaw يعلّم التبديل الحي على أنه معلّق ولا يعيد التشغيل إلى النموذج الجديد إلا عند نقطة إعادة محاولة نظيفة.
- إذا كان نشاط الأدوات أو إخراج الرد قد بدأ بالفعل، فقد يبقى التبديل المعلّق في الطابور حتى فرصة إعادة محاولة لاحقة أو حتى دور المستخدم التالي.
- **المسار السريع:** تتم معالجة الرسائل التي تحتوي على أوامر فقط من المرسلين المدرجين في قائمة السماح فورًا (تتجاوز الطابور + النموذج).
- **بوابة الإشارة في المجموعات:** تتجاوز الرسائل التي تحتوي على أوامر فقط من المرسلين المدرجين في قائمة السماح متطلبات الإشارة.
- **الاختصارات المضمنة (للمرسلين المدرجين في قائمة السماح فقط):** تعمل بعض الأوامر أيضًا عندما تكون مضمنة داخل رسالة عادية ويتم تجريدها قبل أن يرى النموذج النص المتبقي.
  - مثال: `hey /status` يطلق رد الحالة، ويستمر النص المتبقي عبر التدفق العادي.
- حاليًا: ‏`/help` و`/commands` و`/status` و`/whoami` ‏(`/id`).
- يتم تجاهل الرسائل التي تحتوي على أوامر فقط من المرسلين غير المخولين بصمت، وتُعامل الرموز المضمنة `/...` كنص عادي.
- **أوامر Skills:** تُكشف Skills القابلة للاستدعاء من المستخدم كأوامر شرطة مائلة. وتُطهَّر الأسماء إلى `a-z0-9_` ‏(بحد أقصى 32 حرفًا)؛ وتُحل التصادمات عبر لواحق رقمية (مثل `_2`).
  - يقوم `/skill <name> [input]` بتشغيل Skill بالاسم (وهو مفيد عندما تمنع حدود الأوامر الأصلية وجود أوامر مستقلة لكل Skill).
  - افتراضيًا، يتم تمرير أوامر Skills إلى النموذج كطلب عادي.
  - يمكن لـ Skills اختياريًا إعلان `command-dispatch: tool` لتوجيه الأمر مباشرة إلى أداة (حتمي، ومن دون نموذج).
  - مثال: ‏`/prose` ‏(Plugin OpenProse) — راجع [OpenProse](/ar/prose).
- **وسيطات الأوامر الأصلية:** يستخدم Discord الإكمال التلقائي للخيارات الديناميكية (وأيضًا قوائم أزرار عندما تحذف الوسيطات المطلوبة). أما Telegram وSlack فيعرضان قائمة أزرار عندما يدعم الأمر الاختيارات وتحذف الوسيطة.

## `/tools`

يجيب `/tools` عن سؤال وقت تشغيل، وليس عن سؤال إعدادات: **ما الذي يمكن لهذا الوكيل استخدامه الآن في
هذه المحادثة**.

- يكون `/tools` الافتراضي مضغوطًا ومُحسَّنًا للفحص السريع.
- يضيف `/tools verbose` أوصافًا قصيرة.
- تكشف أسطح الأوامر الأصلية التي تدعم الوسيطات عن مفتاح الوضع نفسه `compact|verbose`.
- تكون النتائج ضمن نطاق الجلسة، لذا فإن تغيير الوكيل، أو القناة، أو السلسلة، أو تفويض المرسل، أو النموذج قد
  يغيّر المخرجات.
- يتضمن `/tools` الأدوات القابلة للوصول فعليًا في وقت التشغيل، بما في ذلك الأدوات الأساسية، وأدوات
  Plugins المتصلة، والأدوات المملوكة للقنوات.

أما بالنسبة إلى تحرير الملفات الشخصية والتجاوزات، فاستخدم لوحة Tools في Control UI أو أسطح الإعدادات/الفهارس بدلًا
من التعامل مع `/tools` على أنه فهرس ثابت.

## أسطح الاستخدام (ما الذي يظهر وأين)

- **استخدام/حصة provider** ‏(مثل: "Claude 80% left") يظهر في `/status` لمزود النموذج الحالي عندما
  يكون تتبع الاستخدام مفعّلًا. ويطبّع OpenClaw نوافذ providers إلى `% left`; وبالنسبة إلى MiniMax، يتم عكس حقول النسبة المئوية التي تعرض المتبقي فقط قبل العرض، وتفضل استجابات `model_remains` إدخال chat-model بالإضافة إلى تسمية خطة مرفقة بالنموذج.
- **أسطر الرموز/الذاكرة المؤقتة** في `/status` يمكن أن تعود إلى أحدث إدخال استخدام في السجل عندما تكون لقطة الجلسة الحية شحيحة. وتظل القيم الحية غير الصفرية الموجودة هي الغالبة، كما يمكن للرجوع الاحتياطي إلى السجل أيضًا استعادة تسمية نموذج وقت التشغيل النشط بالإضافة إلى إجمالي أكبر موجه إلى prompt عندما تكون المجاميع المخزنة مفقودة أو أصغر.
- **وقت التشغيل مقابل runner:** يعرض `/status` قيمة `Runtime` لمسار التنفيذ الفعّال وحالة sandbox، وقيمة `Runner` لمن يشغّل الجلسة فعليًا: Pi المضمن، أو provider معتمد على CLI، أو ACP harness/backend.
- **الرموز/التكلفة لكل استجابة** يتم التحكم فيها بواسطة `/usage off|tokens|full` ‏(وتُلحق بالردود العادية).
- إن `/model status` يتعلق بـ **النماذج/المصادقة/نقاط النهاية**، وليس بالاستخدام.

## اختيار النموذج (`/model`)

يتم تنفيذ `/model` كتوجيه.

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

- يعرض `/model` و`/model list` محددًا مضغوطًا ومرقّمًا (عائلة النموذج + providers المتاحة).
- في Discord، يفتح `/model` و`/models` محددًا تفاعليًا مع قوائم منسدلة للـ provider والنموذج بالإضافة إلى خطوة Submit.
- يختار `/model <#>` من ذلك المحدد (ويفضّل الـ provider الحالي عندما يكون ذلك ممكنًا).
- يعرض `/model status` العرض التفصيلي، بما في ذلك نقطة نهاية provider المضبوطة (`baseUrl`) ووضع API ‏(`api`) عند التوفر.

## تجاوزات التصحيح

يتيح لك `/debug` ضبط تجاوزات إعدادات **وقت التشغيل فقط** ‏(في الذاكرة، وليس على القرص). للمالك فقط. وهو معطل افتراضيًا؛ فعّله باستخدام `commands.debug: true`.

أمثلة:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

ملاحظات:

- تُطبَّق التجاوزات فورًا على قراءات الإعدادات الجديدة، لكنها **لا** تكتب إلى `openclaw.json`.
- استخدم `/debug reset` لمسح جميع التجاوزات والعودة إلى الإعدادات الموجودة على القرص.

## مخرجات تتبع Plugin

يتيح لك `/trace` تبديل **أسطر التتبع/التصحيح الخاصة بالـ Plugin ضمن نطاق الجلسة** من دون تشغيل الوضع المفصل الكامل.

أمثلة:

```text
/trace
/trace on
/trace off
```

ملاحظات:

- يعرض `/trace` من دون وسيطة حالة التتبع الحالية للجلسة.
- يؤدي `/trace on` إلى تفعيل أسطر تتبع Plugin للجلسة الحالية.
- يؤدي `/trace off` إلى تعطيلها مجددًا.
- يمكن أن تظهر أسطر تتبع Plugin في `/status` وكـ رسالة تشخيص متابعة بعد رد المساعد العادي.
- لا يحل `/trace` محل `/debug`; إذ لا يزال `/debug` يدير تجاوزات إعدادات وقت التشغيل فقط.
- لا يحل `/trace` محل `/verbose`; إذ لا تزال مخرجات الأدوات/الحالة المفصلة العادية تخص `/verbose`.

## تحديثات الإعدادات

يكتب `/config` إلى الإعدادات الموجودة على القرص (`openclaw.json`). للمالك فقط. وهو معطل افتراضيًا؛ فعّله باستخدام `commands.config: true`.

أمثلة:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

ملاحظات:

- يتم التحقق من الإعدادات قبل الكتابة؛ وتُرفض التغييرات غير الصالحة.
- تستمر تحديثات `/config` عبر عمليات إعادة التشغيل.

## تحديثات MCP

يكتب `/mcp` تعريفات خوادم MCP التي يديرها OpenClaw تحت `mcp.servers`. للمالك فقط. وهو معطل افتراضيًا؛ فعّله باستخدام `commands.mcp: true`.

أمثلة:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

ملاحظات:

- يخزّن `/mcp` الإعدادات داخل إعدادات OpenClaw، وليس في إعدادات المشروع المملوكة لـ Pi.
- تحدد مهايئات وقت التشغيل أي النقلات قابلة للتنفيذ فعليًا.

## تحديثات Plugins

يتيح `/plugins` للمشغلين فحص Plugins المكتشفة وتبديل التفعيل في الإعدادات. ويمكن لتدفقات القراءة فقط استخدام `/plugin` كاسم مستعار. وهو معطل افتراضيًا؛ فعّله باستخدام `commands.plugins: true`.

أمثلة:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

ملاحظات:

- يستخدم `/plugins list` و`/plugins show` اكتشافًا حقيقيًا للـ Plugins مقابل مساحة العمل الحالية بالإضافة إلى الإعدادات الموجودة على القرص.
- يقوم `/plugins enable|disable` بتحديث إعدادات Plugin فقط؛ ولا يثبت أو يزيل Plugins.
- بعد تغييرات التفعيل/التعطيل، أعد تشغيل gateway لتطبيقها.

## ملاحظات حول الأسطح

- تعمل **الأوامر النصية** داخل جلسة الدردشة العادية (تشارك الرسائل المباشرة الجلسة `main`، بينما تمتلك المجموعات جلساتها الخاصة).
- تستخدم **الأوامر الأصلية** جلسات معزولة:
  - Discord: ‏`agent:<agentId>:discord:slash:<userId>`
  - Slack: ‏`agent:<agentId>:slack:slash:<userId>` ‏(والبادئة قابلة للتهيئة عبر `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: ‏`telegram:slash:<userId>` ‏(وتستهدف جلسة الدردشة عبر `CommandTargetSessionKey`)
- يستهدف **`/stop`** جلسة الدردشة النشطة حتى يتمكن من إجهاض التشغيل الحالي.
- **Slack:** لا تزال `channels.slack.slashCommand` مدعومة لأمر واحد من نمط `/openclaw`. وإذا فعّلت `commands.native`، فيجب عليك إنشاء أمر slash واحد في Slack لكل أمر مضمّن (بالأسماء نفسها مثل `/help`). ويتم تسليم قوائم وسيطات الأوامر في Slack كأزرار Block Kit مؤقتة.
  - استثناء أصلي في Slack: سجّل `/agentstatus` ‏(وليس `/status`) لأن Slack تحتفظ بـ `/status`. أما `/status` النصي فلا يزال يعمل في رسائل Slack.

## أسئلة BTW الجانبية

يُعد `/btw` **سؤالًا جانبيًا** سريعًا حول الجلسة الحالية.

وعلى خلاف الدردشة العادية:

- فإنه يستخدم الجلسة الحالية كسياق خلفي،
- ويعمل كاستدعاء مستقل **من دون أدوات** ولمرة واحدة،
- ولا يغيّر سياق الجلسة المستقبلي،
- ولا يُكتب في سجل النص،
- ويُسلَّم كنتيجة جانبية مباشرة بدلًا من رسالة مساعد عادية.

وهذا يجعل `/btw` مفيدًا عندما تريد توضيحًا مؤقتًا بينما تواصل
المهمة الرئيسية التقدم.

مثال:

```text
/btw what are we doing right now?
```

راجع [أسئلة BTW الجانبية](/ar/tools/btw) لمعرفة السلوك الكامل وتجربة المستخدم لدى العميل
بالتفصيل.

## ذو صلة

- [Skills](/ar/tools/skills)
- [إعدادات Skills](/ar/tools/skills-config)
- [إنشاء Skills](/ar/tools/creating-skills)

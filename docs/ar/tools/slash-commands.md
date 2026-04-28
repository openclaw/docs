---
read_when:
    - استخدام أو تهيئة أوامر الدردشة
    - تصحيح أخطاء توجيه الأوامر أو الصلاحيات
sidebarTitle: Slash commands
summary: 'الأوامر المائلة: النصية مقابل الأصلية، والإعدادات، والأوامر المدعومة'
title: الأوامر المائلة
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-26T11:42:31Z"
  model: gpt-5.4
  provider: openai
  source_hash: 75bf58d02738e30bfdc00ad1c264b2f066eebd2819f4ea0209f504f279755993
  source_path: tools/slash-commands.md
  workflow: 15
---

تُعالَج الأوامر بواسطة Gateway. ويجب إرسال معظم الأوامر كرسالة **مستقلة** تبدأ بـ `/`. ويستخدم أمر دردشة bash الخاص بالمضيف فقط الصيغة `! <cmd>` ‏(مع `/bash <cmd>` كاسم بديل).

عندما تكون محادثة أو خيط مرتبطًا بجلسة ACP، يُوجَّه نص المتابعة العادي إلى تلك ACP harness. أما أوامر إدارة Gateway فتبقى محلية: إذ يصل `/acp ...` دائمًا إلى معالج أوامر ACP في OpenClaw، كما يبقى `/status` و`/unfocus` محليين متى كان التعامل مع الأوامر مفعّلًا لذلك السطح.

هناك نظامان مترابطان:

<AccordionGroup>
  <Accordion title="الأوامر">
    رسائل مستقلة من نوع `/...`.
  </Accordion>
  <Accordion title="التوجيهات">
    `/think` و`/fast` و`/verbose` و`/trace` و`/reasoning` و`/elevated` و`/exec` و`/model` و`/queue`.

    - تُزال التوجيهات من الرسالة قبل أن يراها النموذج.
    - في رسائل الدردشة العادية (وليست رسائل توجيهات فقط)، تُعامَل على أنها "تلميحات مضمنة" ولا **تستمر** كإعدادات جلسة.
    - في رسائل التوجيهات فقط (أي عندما تحتوي الرسالة على توجيهات فقط)، تستمر في الجلسة وترد بإقرار.
    - لا تُطبَّق التوجيهات إلا على **المرسلين المصرح لهم**. وإذا تم تعيين `commands.allowFrom`، فهي قائمة السماح الوحيدة المستخدمة؛ وإلا فتأتي المصادقة من قوائم سماح القناة/الاقتران بالإضافة إلى `commands.useAccessGroups`. ويرى المرسلون غير المصرح لهم التوجيهات على أنها نص عادي.

  </Accordion>
  <Accordion title="اختصارات مضمنة">
    للمرسلين المدرجين في قائمة السماح/المصرح لهم فقط: `/help` و`/commands` و`/status` و`/whoami` ‏(`/id`).

    تُشغَّل فورًا، وتُزال قبل أن يرى النموذج الرسالة، ويستمر النص المتبقي عبر التدفق العادي.

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
  يفعّل تحليل `/...` في رسائل الدردشة. وعلى الأسطح التي لا تدعم الأوامر الأصلية (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams)، تظل الأوامر النصية تعمل حتى لو ضبطت هذا على `false`.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  يسجّل الأوامر الأصلية. الوضع التلقائي: مفعّل لـ Discord/Telegram؛ ومعطّل لـ Slack (إلى أن تضيف slash commands)؛ ويُتجاهل للمزوّدين الذين لا يدعمون الأوامر الأصلية. اضبط `channels.discord.commands.native` أو `channels.telegram.commands.native` أو `channels.slack.commands.native` للتجاوز لكل مزوّد (قيمة منطقية أو `"auto"`). تؤدي القيمة `false` إلى مسح الأوامر المسجلة سابقًا على Discord/Telegram عند بدء التشغيل. أما أوامر Slack فتُدار داخل تطبيق Slack ولا تُزال تلقائيًا.
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  يسجّل أوامر **Skills** بشكل أصلي عندما يكون ذلك مدعومًا. الوضع التلقائي: مفعّل لـ Discord/Telegram؛ ومعطّل لـ Slack (إذ يتطلب Slack إنشاء slash command لكل Skill). اضبط `channels.discord.commands.nativeSkills` أو `channels.telegram.commands.nativeSkills` أو `channels.slack.commands.nativeSkills` للتجاوز لكل مزوّد (قيمة منطقية أو `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  يفعّل `! <cmd>` لتشغيل أوامر shell على المضيف ‏(`/bash <cmd>` اسم بديل؛ ويتطلب قوائم السماح `tools.elevated`).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  يتحكم في المدة التي ينتظرها bash قبل التحول إلى وضع الخلفية (`0` ينقلها إلى الخلفية فورًا).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  يفعّل `/config` ‏(لقراءة/كتابة `openclaw.json`).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  يفعّل `/mcp` ‏(لقراءة/كتابة إعدادات MCP التي يديرها OpenClaw تحت `mcp.servers`).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  يفعّل `/plugins` ‏(اكتشاف Plugins/حالته بالإضافة إلى أدوات التثبيت + التمكين/التعطيل).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  يفعّل `/debug` ‏(تجاوزات وقت التشغيل فقط).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  يفعّل `/restart` بالإضافة إلى إجراءات أداة إعادة تشغيل gateway.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  يضبط قائمة السماح الصريحة للمالك لأسطح الأوامر/الأدوات الخاصة بالمالك فقط. وهي منفصلة عن `commands.allowFrom`.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  لكل قناة: يجعل الأوامر الخاصة بالمالك تتطلب **هوية المالك** للتشغيل على ذلك السطح. وعندما تكون `true`، يجب أن يطابق المرسِل إما مرشح مالك محلولًا (مثل إدخال في `commands.ownerAllowFrom` أو بيانات تعريف المالك الأصلية للمزوّد) أو أن يملك النطاق الداخلي `operator.admin` على قناة رسائل داخلية. إن إدخال wildcard في `allowFrom` الخاصة بالقناة، أو قائمة مرشحين للمالك فارغة/غير محلولة، **لا** يكفي — إذ تفشل الأوامر الخاصة بالمالك بشكل مغلق على تلك القناة. اترك هذا معطلًا إذا كنت تريد أن تُقيد الأوامر الخاصة بالمالك فقط بواسطة `ownerAllowFrom` وقوائم السماح القياسية للأوامر.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  يتحكم في كيفية ظهور معرّفات المالك في system prompt.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  يضبط اختياريًا سر HMAC المستخدم عندما تكون `commands.ownerDisplay="hash"`.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  قائمة سماح لكل مزوّد من أجل تفويض الأوامر. وعند تهيئتها، تكون المصدر الوحيد للتفويض الخاص بالأوامر والتوجيهات (ويُتجاهل كل من قوائم سماح القناة/الاقتران و`commands.useAccessGroups`). استخدم `"*"` كافتراضي عام؛ وتُتجاوز به المفاتيح الخاصة بكل مزوّد.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  يفرض قوائم السماح/السياسات الخاصة بالأوامر عندما لا يكون `commands.allowFrom` معيّنًا.
</ParamField>

## قائمة الأوامر

مصدر الحقيقة الحالي:

- تأتي الأوامر الأساسية المضمّنة من `src/auto-reply/commands-registry.shared.ts`
- تأتي أوامر dock المولّدة من `src/auto-reply/commands-registry.data.ts`
- تأتي أوامر Plugins من استدعاءات `registerCommand()` الخاصة بالـ Plugin
- لا يزال التوفر الفعلي على gateway الخاصة بك يعتمد على أعلام الإعدادات، وسطح القناة، والـ Plugins المثبتة/المفعّلة

### الأوامر الأساسية المضمّنة

<AccordionGroup>
  <Accordion title="الجلسات والتشغيلات">
    - يبدأ `/new [model]` جلسة جديدة؛ و`/reset` هو الاسم البديل لإعادة الضبط.
    - يحتفظ `/reset soft [message]` بالنص الحالي، ويحذف معرّفات جلسات الواجهة الخلفية لـ CLI المعاد استخدامها، ويعيد تشغيل تحميل startup/system-prompt في مكانه.
    - يضغط `/compact [instructions]` سياق الجلسة. راجع [Compaction](/ar/concepts/compaction).
    - يجهض `/stop` التشغيل الحالي.
    - يدير `/session idle <duration|off>` و`/session max-age <duration|off>` انتهاء صلاحية ربط الخيط.
    - يصدّر `/export-session [path]` الجلسة الحالية إلى HTML. الاسم البديل: `/export`.
    - يصدّر `/export-trajectory [path]` حزمة [trajectory](/ar/tools/trajectory) بصيغة JSONL للجلسة الحالية. الاسم البديل: `/trajectory`.
  </Accordion>
  <Accordion title="عناصر التحكم في النموذج والتشغيل">
    - يضبط `/think <level>` مستوى التفكير. وتأتي الخيارات من ملف تعريف مزوّد النموذج النشط؛ والمستويات الشائعة هي `off` و`minimal` و`low` و`medium` و`high`، مع مستويات مخصصة مثل `xhigh` و`adaptive` و`max` أو الثنائي `on` فقط عندما يكون ذلك مدعومًا. الأسماء البديلة: `/thinking`, `/t`.
    - يبدّل `/verbose on|off|full` المخرجات المطوّلة. الاسم البديل: `/v`.
    - يبدّل `/trace on|off` مخرجات تتبع Plugins للجلسة الحالية.
    - يعرض `/fast [status|on|off]` الوضع السريع أو يضبطه.
    - يبدّل `/reasoning [on|off|stream]` إظهار التفكير. الاسم البديل: `/reason`.
    - يبدّل `/elevated [on|off|ask|full]` الوضع Elevated. الاسم البديل: `/elev`.
    - يعرض `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` الإعدادات الافتراضية لـ exec أو يضبطها.
    - يعرض `/model [name|#|status]` النموذج أو يضبطه.
    - يسرد `/models [provider] [page] [limit=<n>|size=<n>|all]` المزوّدين أو النماذج الخاصة بمزوّد.
    - يدير `/queue <mode>` سلوك قائمة الانتظار (`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`) بالإضافة إلى خيارات مثل `debounce:2s cap:25 drop:summarize`.
  </Accordion>
  <Accordion title="الاكتشاف والحالة">
    - يعرض `/help` ملخص المساعدة القصير.
    - يعرض `/commands` فهرس الأوامر المولّد.
    - يعرض `/tools [compact|verbose]` ما الذي يستطيع الوكيل الحالي استخدامه الآن.
    - يعرض `/status` حالة التنفيذ/وقت التشغيل، بما في ذلك تسميات `Execution`/`Runtime` واستخدام/حصة المزوّد عند توفرها.
    - يشغّل `/crestodian <request>` مساعد الإعداد والإصلاح Crestodian من رسالة مباشرة للمالك.
    - يسرد `/tasks` المهام النشطة/الحديثة في الخلفية للجلسة الحالية.
    - يشرح `/context [list|detail|json]` كيفية تجميع السياق.
    - يعرض `/whoami` معرّف المُرسِل الخاص بك. الاسم البديل: `/id`.
    - يتحكم `/usage off|tokens|full|cost` في تذييل الاستخدام لكل استجابة أو يطبع ملخص تكلفة محليًا.
  </Accordion>
  <Accordion title="Skills، وقوائم السماح، والموافقات">
    - يشغّل `/skill <name> [input]` Skill بالاسم.
    - يدير `/allowlist [list|add|remove] ...` إدخالات قائمة السماح. نصي فقط.
    - يحل `/approve <id> <decision>` مطالبات موافقة exec.
    - يطرح `/btw <question>` سؤالًا جانبيًا دون تغيير سياق الجلسة المستقبلي. راجع [BTW](/ar/tools/btw).
  </Accordion>
  <Accordion title="الوكلاء الفرعيون وACP">
    - يدير `/subagents list|kill|log|info|send|steer|spawn` تشغيلات الوكيل الفرعي للجلسة الحالية.
    - يدير `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` جلسات ACP وخيارات وقت التشغيل.
    - يربط `/focus <target>` خيط Discord الحالي أو موضوع/محادثة Telegram بهدف جلسة.
    - يزيل `/unfocus` الربط الحالي.
    - يسرد `/agents` الوكلاء المرتبطين بالخيط للجلسة الحالية.
    - يجهض `/kill <id|#|all>` وكيلًا فرعيًا واحدًا أو جميع الوكلاء الفرعيين العاملين.
    - يرسل `/steer <id|#> <message>` توجيهًا إلى وكيل فرعي عامل. الاسم البديل: `/tell`.
  </Accordion>
  <Accordion title="كتابات المالك فقط والإدارة">
    - يقرأ `/config show|get|set|unset` ملف `openclaw.json` أو يكتبه. للمالك فقط. ويتطلب `commands.config: true`.
    - يقرأ `/mcp show|get|set|unset` إعدادات خادم MCP الذي يديره OpenClaw تحت `mcp.servers` أو يكتبها. للمالك فقط. ويتطلب `commands.mcp: true`.
    - يفحص `/plugins list|inspect|show|get|install|enable|disable` حالة Plugin أو يعدلها. و`/plugin` اسم بديل. عمليات الكتابة للمالك فقط. ويتطلب `commands.plugins: true`.
    - يدير `/debug show|set|unset|reset` تجاوزات الإعدادات الخاصة بوقت التشغيل فقط. للمالك فقط. ويتطلب `commands.debug: true`.
    - يعيد `/restart` تشغيل OpenClaw عندما يكون مفعّلًا. الافتراضي: مفعّل؛ اضبط `commands.restart: false` لتعطيله.
    - يضبط `/send on|off|inherit` سياسة الإرسال. للمالك فقط.
  </Accordion>
  <Accordion title="الصوت، وTTS، والتحكم في القناة">
    - يتحكم `/tts on|off|status|chat|latest|provider|limit|summary|audio|help` في TTS. راجع [TTS](/ar/tools/tts).
    - يضبط `/activation mention|always` وضع التفعيل في المجموعات.
    - يشغّل `/bash <command>` أمر shell على المضيف. نصي فقط. الاسم البديل: `! <command>`. ويتطلب `commands.bash: true` بالإضافة إلى قوائم السماح `tools.elevated`.
    - يتحقق `!poll [sessionId]` من مهمة bash في الخلفية.
    - يوقف `!stop [sessionId]` مهمة bash في الخلفية.
  </Accordion>
</AccordionGroup>

### أوامر dock المولّدة

تُولَّد أوامر dock من Plugins القنوات التي تدعم الأوامر الأصلية. المجموعة المضمّنة الحالية:

- `/dock-discord` ‏(الاسم البديل: `/dock_discord`)
- `/dock-mattermost` ‏(الاسم البديل: `/dock_mattermost`)
- `/dock-slack` ‏(الاسم البديل: `/dock_slack`)
- `/dock-telegram` ‏(الاسم البديل: `/dock_telegram`)

### أوامر Plugins المضمّنة

يمكن للـ Plugins المضمّنة إضافة المزيد من slash commands. أوامر Plugins المضمّنة الحالية في هذا المستودع:

- يبدّل `/dreaming [on|off|status|help]` حالة Dreaming الخاصة بالذاكرة. راجع [Dreaming](/ar/concepts/dreaming).
- يدير `/pair [qr|status|pending|approve|cleanup|notify]` تدفّق اقتران/إعداد الجهاز. راجع [الاقتران](/ar/channels/pairing).
- يضبط `/phone status|arm <camera|screen|writes|all> [duration]|disarm` مؤقتًا أوامر node الهاتفية عالية المخاطر.
- يدير `/voice status|list [limit]|set <voiceId|name>` إعدادات صوت Talk. وعلى Discord، يكون اسم الأمر الأصلي هو `/talkvoice`.
- يرسل `/card ...` إعدادات LINE rich card المسبقة. راجع [LINE](/ar/channels/line).
- يفحص `/codex status|models|threads|resume|compact|review|account|mcp|skills` ‏Codex app-server harness المضمّنة ويتحكم فيها. راجع [Codex harness](/ar/plugins/codex-harness).
- أوامر QQBot فقط:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### أوامر Skills الديناميكية

تُكشف Skills القابلة للاستدعاء من المستخدم أيضًا كأوامر مائلة:

- يعمل `/skill <name> [input]` دائمًا كنقطة دخول عامة.
- قد تظهر skills أيضًا كأوامر مباشرة مثل `/prose` عندما تسجلها الـ Skill/Plugin.
- يتحكم كل من `commands.nativeSkills` و`channels.<provider>.commands.nativeSkills` في التسجيل الأصلي لأوامر Skills.

<AccordionGroup>
  <Accordion title="ملاحظات عن الوسيطات والمحلل">
    - تقبل الأوامر وجود `:` اختياري بين الأمر والوسيطات (مثل `/think: high` أو `/send: on` أو `/help:`).
    - يقبل `/new <model>` اسمًا مستعارًا للنموذج، أو `provider/model`، أو اسم مزوّد (مطابقة ضبابية)؛ وإذا لم توجد مطابقة، فسيُعامَل النص على أنه متن الرسالة.
    - للحصول على تفصيل كامل لاستخدام المزوّد، استخدم `openclaw status --usage`.
    - يتطلب `/allowlist add|remove` القيمة `commands.config=true` ويراعي `configWrites` الخاصة بالقناة.
    - في القنوات متعددة الحسابات، تراعي الأوامر `/allowlist --account <id>` و`/config set channels.<provider>.accounts.<id>...` الموجهة إلى الإعدادات أيضًا `configWrites` الخاصة بالحساب المستهدف.
    - يتحكم `/usage` في تذييل الاستخدام لكل استجابة؛ ويطبع `/usage cost` ملخص تكلفة محليًا من سجلات جلسات OpenClaw.
    - يكون `/restart` مفعّلًا افتراضيًا؛ اضبط `commands.restart: false` لتعطيله.
    - يقبل `/plugins install <spec>` مواصفات Plugins نفسها التي يقبلها `openclaw plugins install`: مسار/أرشيف محلي، أو حزمة npm، أو `clawhub:<pkg>`.
    - يحدّث `/plugins enable|disable` إعدادات Plugin وقد يطالب بإعادة تشغيل.
  </Accordion>
  <Accordion title="سلوك خاص بالقناة">
    - الأمر الأصلي على Discord فقط: يتحكم `/vc join|leave|status` في قنوات الصوت (غير متاح نصيًا). ويتطلب `join` وجود guild وقناة صوت/مسرح محددة. ويتطلب `channels.discord.voice` والأوامر الأصلية.
    - تتطلب أوامر ربط الخيوط في Discord ‏(`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`) أن تكون روابط الخيوط الفعلية مفعّلة (`session.threadBindings.enabled` و/أو `channels.discord.threadBindings.enabled`).
    - مرجع أوامر ACP وسلوك وقت التشغيل: [وكلاء ACP](/ar/tools/acp-agents).
  </Accordion>
  <Accordion title="أمان verbose / trace / fast / reasoning">
    - إن `/verbose` مخصص للتصحيح وإظهار المزيد من التفاصيل؛ أبقه **معطلًا** في الاستخدام العادي.
    - إن `/trace` أضيق من `/verbose`: فهو يكشف فقط أسطر التتبع/التصحيح المملوكة للـ Plugin ويبقي ضجيج الأدوات المطول العادي معطلًا.
    - يحتفظ `/fast on|off` بتجاوز على مستوى الجلسة. استخدم خيار `inherit` في Sessions UI لمسحه والرجوع إلى افتراضيات الإعدادات.
    - إن `/fast` خاص بالمزوّد: إذ تربطه OpenAI/OpenAI Codex إلى `service_tier=priority` على نقاط نهاية Responses الأصلية، بينما تربط الطلبات العامة المباشرة إلى Anthropic، بما في ذلك الحركة المصادَق عليها عبر OAuth المرسلة إلى `api.anthropic.com`، إلى `service_tier=auto` أو `standard_only`. راجع [OpenAI](/ar/providers/openai) و[Anthropic](/ar/providers/anthropic).
    - ما تزال ملخصات فشل الأدوات تُعرض عند الاقتضاء، لكن يُدرج نص الفشل التفصيلي فقط عندما تكون `/verbose` على `on` أو `full`.
    - تُعد `/reasoning` و`/verbose` و`/trace` خطِرة في إعدادات المجموعات: إذ قد تكشف تفكيرًا داخليًا، أو مخرجات أدوات، أو تشخيصات Plugins لم تكن تنوي كشفها. فضّل إبقاءها معطلة، خاصة في دردشات المجموعات.
  </Accordion>
  <Accordion title="تبديل النموذج">
    - يحتفظ `/model` بالنموذج الجديد للجلسة فورًا.
    - إذا كان الوكيل في حالة خمول، فسيستخدمه التشغيل التالي مباشرة.
    - إذا كان هناك تشغيل نشط بالفعل، يضع OpenClaw علامة على التبديل الحي على أنه معلق ولا يعيد التشغيل إلى النموذج الجديد إلا عند نقطة إعادة محاولة نظيفة.
    - إذا كان نشاط الأدوات أو مخرجات الرد قد بدأ بالفعل، فقد يبقى التبديل المعلق في قائمة الانتظار حتى فرصة إعادة محاولة لاحقة أو دور المستخدم التالي.
    - في TUI المحلية، يعيد `/crestodian [request]` من TUI الوكيل العادية إلى Crestodian. وهذا منفصل عن وضع الإنقاذ في قناة الرسائل ولا يمنح سلطة إعدادات عن بُعد.
  </Accordion>
  <Accordion title="المسار السريع والاختصارات المضمنة">
    - **المسار السريع:** تُعالَج الرسائل التي تحتوي على أوامر فقط من مرسلين ضمن قائمة السماح فورًا (تتجاوز قائمة الانتظار + النموذج).
    - **تقييد الإشارة في المجموعات:** تتجاوز الرسائل التي تحتوي على أوامر فقط من مرسلين ضمن قائمة السماح متطلبات الإشارة.
    - **الاختصارات المضمنة (للمرسلين المدرجين في قائمة السماح فقط):** تعمل بعض الأوامر أيضًا عندما تكون مضمّنة في رسالة عادية وتُزال قبل أن يرى النموذج النص المتبقي.
      - مثال: يؤدي `hey /status` إلى رد حالة، ويستمر النص المتبقي عبر التدفق العادي.
    - حاليًا: `/help` و`/commands` و`/status` و`/whoami` ‏(`/id`).
    - تُتجاهل رسائل الأوامر فقط غير المصرح بها بصمت، وتُعامَل الرموز المضمنة `/...` على أنها نص عادي.
  </Accordion>
  <Accordion title="أوامر Skills والوسيطات الأصلية">
    - **أوامر Skills:** تُكشف Skills من نوع `user-invocable` كأوامر مائلة. وتُنظّف الأسماء إلى `a-z0-9_` ‏(بحد أقصى 32 حرفًا)؛ وتُضاف لاحقات رقمية عند التصادمات (مثل `_2`).
      - يشغّل `/skill <name> [input]` Skill بالاسم (وهو مفيد عندما تمنع حدود الأوامر الأصلية وجود أوامر لكل Skill).
      - افتراضيًا، تُمرَّر أوامر Skills إلى النموذج كطلب عادي.
      - يمكن للـ Skills أن تعلن اختياريًا `command-dispatch: tool` لتوجيه الأمر مباشرة إلى أداة (بشكل حتمي، ومن دون نموذج).
      - مثال: `/prose` ‏(Plugin OpenProse) — راجع [OpenProse](/ar/prose).
    - **وسيطات الأوامر الأصلية:** يستخدم Discord الإكمال التلقائي للخيارات الديناميكية (وقوائم الأزرار عندما تحذف وسيطات مطلوبة). ويعرض Telegram وSlack قائمة أزرار عندما يدعم الأمر خيارات وتحذف الوسيطة. وتُحل الخيارات الديناميكية مقابل نموذج الجلسة المستهدفة، لذلك تتبع الخيارات الخاصة بالنموذج مثل مستويات `/think` تجاوز `/model` الخاص بتلك الجلسة.
  </Accordion>
</AccordionGroup>

## `/tools`

يجيب `/tools` عن سؤال وقت تشغيل، وليس سؤال إعدادات: **ما الذي يستطيع هذا الوكيل استخدامه الآن في هذه المحادثة**.

- يكون `/tools` الافتراضي مضغوطًا ومحسّنًا للمسح السريع.
- يضيف `/tools verbose` أوصافًا قصيرة.
- تكشف أسطح الأوامر الأصلية التي تدعم الوسيطات تبديل الوضع نفسه على هيئة `compact|verbose`.
- تكون النتائج ضمن نطاق الجلسة، لذلك قد يؤدي تغيير الوكيل أو القناة أو الخيط أو تفويض المرسِل أو النموذج إلى تغيير المخرجات.
- يتضمن `/tools` الأدوات القابلة للوصول فعلًا في وقت التشغيل، بما في ذلك الأدوات الأساسية، وأدوات Plugins المتصلة، والأدوات المملوكة للقنوات.

بالنسبة إلى تحرير ملفات التعريف والتجاوزات، استخدم لوحة Tools في Control UI أو أسطح الإعدادات/الفهرس بدلًا من التعامل مع `/tools` باعتباره فهرسًا ثابتًا.

## أسطح الاستخدام (ما الذي يظهر وأين)

- **استخدام/حصة المزوّد** ‏(مثل: "Claude 80% left") يظهر في `/status` للمزوّد الخاص بالنموذج الحالي عندما يكون تتبع الاستخدام مفعّلًا. ويطبّع OpenClaw نوافذ المزوّد إلى `% left`؛ وبالنسبة إلى MiniMax، تُقلب حقول النسبة المئوية الخاصة بالمقدار المتبقي فقط قبل العرض، كما أن استجابات `model_remains` تفضّل إدخال chat-model بالإضافة إلى تسمية خطة موسومة بالنموذج.
- يمكن لأسطر **الرموز/الذاكرة المؤقتة** في `/status` أن ترجع إلى أحدث إدخال استخدام في transcript عندما تكون اللقطة الحية للجلسة شحيحة. وما تزال القيم الحية غير الصفرية الموجودة هي الفائزة، كما يمكن للرجوع إلى transcript أيضًا أن يستعيد تسمية نموذج وقت التشغيل النشط بالإضافة إلى إجمالي أكبر موجّه نحو prompt عندما تكون الإجماليات المخزنة مفقودة أو أصغر.
- **التنفيذ مقابل وقت التشغيل:** يبلّغ `/status` عن `Execution` لمسار sandbox الفعلي و`Runtime` للجهة التي تشغّل الجلسة بالفعل: `OpenClaw Pi Default`، أو `OpenAI Codex`، أو واجهة خلفية لـ CLI، أو واجهة خلفية لـ ACP.
- يتحكم `/usage off|tokens|full` في **الرموز/التكلفة لكل استجابة** ‏(وتُلحق بالردود العادية).
- يدور `/model status` حول **النماذج/المصادقة/نقاط النهاية**، وليس حول الاستخدام.

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

- يعرض `/model` و`/model list` منتقيًا مضغوطًا ومرقّمًا (عائلة النموذج + المزوّدون المتاحون).
- يفتح `/model` و`/models` على Discord منتقيًا تفاعليًا مع قوائم منسدلة للمزوّد والنموذج بالإضافة إلى خطوة Submit.
- يختار `/model <#>` من ذلك المنتقي (ويفضّل المزوّد الحالي عندما يكون ذلك ممكنًا).
- يعرض `/model status` العرض التفصيلي، بما في ذلك `baseUrl` الخاصة بنقطة نهاية المزوّد و`api` عند توفرهما.

## تجاوزات التصحيح

يتيح لك `/debug` ضبط تجاوزات إعدادات **وقت التشغيل فقط** ‏(في الذاكرة، وليس على القرص). للمالك فقط. وهو معطل افتراضيًا؛ فعّله عبر `commands.debug: true`.

أمثلة:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
تُطبَّق التجاوزات فورًا على قراءات الإعدادات الجديدة، لكنها **لا** تكتب إلى `openclaw.json`. استخدم `/debug reset` لمسح جميع التجاوزات والعودة إلى الإعدادات الموجودة على القرص.
</Note>

## مخرجات تتبع Plugin

يتيح لك `/trace` تبديل **أسطر التتبع/التصحيح الخاصة بالـ Plugin ضمن نطاق الجلسة** من دون تشغيل الوضع المطول الكامل.

أمثلة:

```text
/trace
/trace on
/trace off
```

ملاحظات:

- يعرض `/trace` من دون وسيطة حالة التتبع الحالية للجلسة.
- يفعّل `/trace on` أسطر تتبع Plugins للجلسة الحالية.
- يعطّلها `/trace off` مجددًا.
- قد تظهر أسطر تتبع Plugins في `/status` وكـ رسالة تشخيص متابعة بعد رد المساعد العادي.
- لا يستبدل `/trace` الأمر `/debug`؛ إذ يظل `/debug` يدير تجاوزات الإعدادات الخاصة بوقت التشغيل فقط.
- لا يستبدل `/trace` الأمر `/verbose`؛ فما تزال مخرجات الأدوات/الحالة المطولة العادية تتبع `/verbose`.

## تحديثات الإعدادات

يكتب `/config` إلى الإعدادات الموجودة على القرص (`openclaw.json`). للمالك فقط. وهو معطل افتراضيًا؛ فعّله عبر `commands.config: true`.

أمثلة:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
يُتحقق من الإعدادات قبل الكتابة؛ وتُرفض التغييرات غير الصالحة. وتستمر تحديثات `/config` عبر عمليات إعادة التشغيل.
</Note>

## تحديثات MCP

يكتب `/mcp` تعريفات خادم MCP التي يديرها OpenClaw تحت `mcp.servers`. للمالك فقط. وهو معطل افتراضيًا؛ فعّله عبر `commands.mcp: true`.

أمثلة:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
يخزّن `/mcp` الإعدادات في إعدادات OpenClaw، وليس في إعدادات المشروع المملوكة لـ Pi. وتحدد مهايئات وقت التشغيل أي وسائل نقل تكون قابلة للتنفيذ فعليًا.
</Note>

## تحديثات Plugins

يتيح `/plugins` للمشغّلين فحص Plugins المكتشفة وتبديل التمكين في الإعدادات. ويمكن للتدفقات التي للقراءة فقط استخدام `/plugin` كاسم بديل. وهو معطل افتراضيًا؛ فعّله عبر `commands.plugins: true`.

أمثلة:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- يستخدم `/plugins list` و`/plugins show` اكتشاف Plugins الحقيقي مقابل مساحة العمل الحالية والإعدادات الموجودة على القرص.
- يقوم `/plugins enable|disable` بتحديث إعدادات Plugin فقط؛ ولا يثبت أو يزيل Plugins.
- بعد تغييرات enable/disable، أعد تشغيل gateway لتطبيقها.
</Note>

## ملاحظات عن الأسطح

<AccordionGroup>
  <Accordion title="الجلسات لكل سطح">
    - تعمل **الأوامر النصية** في جلسة الدردشة العادية (تتشارك الرسائل المباشرة `main`، بينما تملك المجموعات جلساتها الخاصة).
    - تستخدم **الأوامر الأصلية** جلسات معزولة:
      - Discord: ‏`agent:<agentId>:discord:slash:<userId>`
      - Slack: ‏`agent:<agentId>:slack:slash:<userId>` ‏(البادئة قابلة للتهيئة عبر `channels.slack.slashCommand.sessionPrefix`)
      - Telegram: ‏`telegram:slash:<userId>` ‏(ويستهدف جلسة الدردشة عبر `CommandTargetSessionKey`)
    - يستهدف **`/stop`** جلسة الدردشة النشطة حتى يتمكن من إجهاض التشغيل الحالي.
  </Accordion>
  <Accordion title="تفاصيل خاصة بـ Slack">
    ما يزال `channels.slack.slashCommand` مدعومًا لأمر واحد بنمط `/openclaw`. وإذا فعّلت `commands.native`، فيجب عليك إنشاء Slack slash command واحدة لكل أمر مضمّن (بالأسماء نفسها مثل `/help`). وتُسلَّم قوائم وسائط الأوامر الخاصة بـ Slack كأزرار Block Kit مؤقتة.

    استثناء Slack الأصلي: سجّل `/agentstatus` ‏(وليس `/status`) لأن Slack تحجز `/status`. ولا يزال `/status` النصي يعمل في رسائل Slack.

  </Accordion>
</AccordionGroup>

## الأسئلة الجانبية BTW

يمثل `/btw` **سؤالًا جانبيًا** سريعًا عن الجلسة الحالية.

وعلى خلاف الدردشة العادية:

- فإنه يستخدم الجلسة الحالية كسياق خلفي،
- ويعمل كاستدعاء منفصل أحادي الاستخدام **من دون أدوات**،
- ولا يغير سياق الجلسة المستقبلي،
- ولا يُكتب في سجل transcript،
- ويُسلَّم كنتيجة جانبية حية بدلًا من رسالة مساعد عادية.

وهذا يجعل `/btw` مفيدًا عندما تريد توضيحًا مؤقتًا بينما يستمر العمل الرئيسي.

مثال:

```text
/btw what are we doing right now?
```

راجع [الأسئلة الجانبية BTW](/ar/tools/btw) للاطلاع على السلوك الكامل وتفاصيل تجربة العميل.

## ذو صلة

- [إنشاء Skills](/ar/tools/creating-skills)
- [Skills](/ar/tools/skills)
- [إعدادات Skills](/ar/tools/skills-config)

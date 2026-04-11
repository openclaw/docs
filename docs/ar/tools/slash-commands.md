---
read_when:
    - استخدام أو تهيئة أوامر الدردشة
    - تصحيح توجيه الأوامر أو الأذونات
summary: 'الأوامر المائلة: النصية مقابل الأصلية، والإعدادات، والأوامر المدعومة'
title: الأوامر المائلة
x-i18n:
    generated_at: "2026-04-11T02:48:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2cc346361c3b1a63aae9ec0f28706f4cb0b866b6c858a3999101f6927b923b4a
    source_path: tools/slash-commands.md
    workflow: 15
---

# الأوامر المائلة

تتم معالجة الأوامر بواسطة Gateway. يجب إرسال معظم الأوامر كرسالة **مستقلة** تبدأ بـ `/`.
ويستخدم أمر bash الخاص بالدردشة على المضيف فقط الصيغة `! <cmd>` (مع `/bash <cmd>` كاسم مستعار).

يوجد نظامان مرتبطان:

- **الأوامر**: رسائل مستقلة من نوع `/...`.
- **التوجيهات**: `/think` و`/fast` و`/verbose` و`/reasoning` و`/elevated` و`/exec` و`/model` و`/queue`.
  - تتم إزالة التوجيهات من الرسالة قبل أن يراها النموذج.
  - في رسائل الدردشة العادية (وليست رسائل توجيهات فقط)، يتم التعامل معها على أنها "تلميحات مضمّنة" ولا **تستمر** كإعدادات للجلسة.
  - في الرسائل التي تحتوي على توجيهات فقط (أي عندما تحتوي الرسالة على توجيهات فقط)، فإنها تستمر في الجلسة وترد بإقرار.
  - لا يتم تطبيق التوجيهات إلا على **المرسلين المصرّح لهم**. وإذا تم تعيين `commands.allowFrom`، فهي قائمة السماح الوحيدة
    المستخدمة؛ وإلا فإن التفويض يأتي من قوائم السماح/الاقتران الخاصة بالقنوات بالإضافة إلى `commands.useAccessGroups`.
    ويرى المرسلون غير المصرّح لهم التوجيهات على أنها نص عادي.

كما توجد بعض **الاختصارات المضمّنة** (للمرسلين المدرجين في قائمة السماح/المصرّح لهم فقط): `/help` و`/commands` و`/status` و`/whoami` (`/id`).
ويتم تشغيلها فورًا، وتُزال قبل أن يراها النموذج، ثم يستمر النص المتبقي عبر التدفق العادي.

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

- يفعّل `commands.text` (الافتراضي `true`) تحليل `/...` في رسائل الدردشة.
  - على الأسطح التي لا تدعم الأوامر الأصلية (WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams)، ستظل الأوامر النصية تعمل حتى إذا عيّنت هذا الخيار إلى `false`.
- يقوم `commands.native` (الافتراضي `"auto"`) بتسجيل الأوامر الأصلية.
  - تلقائي: مفعّل في Discord/Telegram؛ ومعطّل في Slack (إلى أن تضيف أوامر مائلة)؛ ويتم تجاهله لدى الموفّرين الذين لا يدعمون الأوامر الأصلية.
  - عيّن `channels.discord.commands.native` أو `channels.telegram.commands.native` أو `channels.slack.commands.native` للتجاوز لكل موفّر (قيمة منطقية أو `"auto"`).
  - تؤدي القيمة `false` إلى مسح الأوامر المسجّلة سابقًا على Discord/Telegram عند بدء التشغيل. أما أوامر Slack فتدار في تطبيق Slack ولا تتم إزالتها تلقائيًا.
- يقوم `commands.nativeSkills` (الافتراضي `"auto"`) بتسجيل أوامر **Skills** بشكل أصلي عند الدعم.
  - تلقائي: مفعّل في Discord/Telegram؛ ومعطّل في Slack (يتطلب Slack إنشاء أمر مائل لكل Skill).
  - عيّن `channels.discord.commands.nativeSkills` أو `channels.telegram.commands.nativeSkills` أو `channels.slack.commands.nativeSkills` للتجاوز لكل موفّر (قيمة منطقية أو `"auto"`).
- يفعّل `commands.bash` (الافتراضي `false`) الصيغة `! <cmd>` لتشغيل أوامر shell على المضيف (`/bash <cmd>` اسم مستعار؛ ويتطلب قوائم السماح `tools.elevated`).
- يتحكم `commands.bashForegroundMs` (الافتراضي `2000`) في مدة انتظار bash قبل التبديل إلى وضع الخلفية (`0` ينقله إلى الخلفية فورًا).
- يفعّل `commands.config` (الافتراضي `false`) الأمر `/config` (قراءة/كتابة `openclaw.json`).
- يفعّل `commands.mcp` (الافتراضي `false`) الأمر `/mcp` (قراءة/كتابة إعدادات MCP التي يديرها OpenClaw تحت `mcp.servers`).
- يفعّل `commands.plugins` (الافتراضي `false`) الأمر `/plugins` (اكتشاف الإضافات/الحالة بالإضافة إلى التثبيت + عناصر التحكم في التمكين/التعطيل).
- يفعّل `commands.debug` (الافتراضي `false`) الأمر `/debug` (تجاوزات وقت التشغيل فقط).
- يفعّل `commands.restart` (الافتراضي `true`) الأمر `/restart` بالإضافة إلى إجراءات أداة إعادة تشغيل gateway.
- يعيّن `commands.ownerAllowFrom` (اختياري) قائمة السماح الصريحة للمالك لأسطح الأوامر/الأدوات الخاصة بالمالك فقط. وهذا منفصل عن `commands.allowFrom`.
- يتحكم `commands.ownerDisplay` في كيفية ظهور معرّفات المالك في مطالبة النظام: `raw` أو `hash`.
- يعيّن `commands.ownerDisplaySecret` اختياريًا سر HMAC المستخدم عندما تكون `commands.ownerDisplay="hash"`.
- يعيّن `commands.allowFrom` (اختياري) قائمة سماح لكل موفّر لتفويض الأوامر. وعند تهيئتها، فإنها تكون
  مصدر التفويض الوحيد للأوامر والتوجيهات (ويتم تجاهل قوائم سماح القنوات/الاقتران و`commands.useAccessGroups`). استخدم `"*"` كافتراضي عام؛ وتقوم المفاتيح الخاصة بكل موفّر بتجاوزه.
- يفرض `commands.useAccessGroups` (الافتراضي `true`) قوائم السماح/السياسات على الأوامر عندما لا يتم تعيين `commands.allowFrom`.

## قائمة الأوامر

المصدر الحالي للحقيقة:

- الأوامر الأساسية المضمّنة تأتي من `src/auto-reply/commands-registry.shared.ts`
- أوامر dock المولّدة تأتي من `src/auto-reply/commands-registry.data.ts`
- أوامر الإضافات تأتي من استدعاءات `registerCommand()` داخل الإضافات
- لا يزال التوفر الفعلي على gateway لديك يعتمد على إشارات الإعدادات، وسطح القناة، والإضافات المثبتة/المفعّلة

### الأوامر الأساسية المضمّنة

الأوامر المضمّنة المتاحة حاليًا:

- يبدأ `/new [model]` جلسة جديدة؛ و`/reset` هو الاسم المستعار لإعادة التعيين.
- يضغط `/compact [instructions]` سياق الجلسة. راجع [/concepts/compaction](/ar/concepts/compaction).
- يقوم `/stop` بإيقاف التشغيل الحالي.
- يدير `/session idle <duration|off>` و`/session max-age <duration|off>` انتهاء صلاحية ربط السلسلة.
- يضبط `/think <off|minimal|low|medium|high|xhigh>` مستوى التفكير. الأسماء المستعارة: `/thinking` و`/t`.
- يبدّل `/verbose on|off|full` المخرجات التفصيلية. الاسم المستعار: `/v`.
- يعرض `/fast [status|on|off]` وضع السرعة أو يضبطه.
- يبدّل `/reasoning [on|off|stream]` رؤية الاستدلال. الاسم المستعار: `/reason`.
- يبدّل `/elevated [on|off|ask|full]` الوضع المرتفع. الاسم المستعار: `/elev`.
- يعرض `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>` القيم الافتراضية للتنفيذ أو يضبطها.
- يعرض `/model [name|#|status]` النموذج أو يضبطه.
- يسرد `/models [provider] [page] [limit=<n>|size=<n>|all]` الموفّرين أو نماذج موفّر معيّن.
- يدير `/queue <mode>` سلوك الطابور (`steer` و`interrupt` و`followup` و`collect` و`steer-backlog`) بالإضافة إلى خيارات مثل `debounce:2s cap:25 drop:summarize`.
- يعرض `/help` ملخص المساعدة القصير.
- يعرض `/commands` فهرس الأوامر المولّد.
- يعرض `/tools [compact|verbose]` ما الذي يمكن للعامل الحالي استخدامه الآن.
- يعرض `/status` حالة وقت التشغيل، بما في ذلك استخدام/حصة الموفّر عند توفرها.
- يسرد `/tasks` المهام النشطة/الحديثة في الخلفية للجلسة الحالية.
- يشرح `/context [list|detail|json]` كيفية تجميع السياق.
- يصدّر `/export-session [path]` الجلسة الحالية إلى HTML. الاسم المستعار: `/export`.
- يعرض `/whoami` معرّف المرسِل الخاص بك. الاسم المستعار: `/id`.
- يشغّل `/skill <name> [input]` Skill بالاسم.
- يدير `/allowlist [list|add|remove] ...` إدخالات قائمة السماح. نصّي فقط.
- يحسم `/approve <id> <decision>` مطالبات الموافقة على التنفيذ.
- يطرح `/btw <question>` سؤالًا جانبيًا دون تغيير سياق الجلسة المستقبلي. راجع [/tools/btw](/ar/tools/btw).
- يدير `/subagents list|kill|log|info|send|steer|spawn` عمليات sub-agent للجلسة الحالية.
- يدير `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help` جلسات ACP وخيارات وقت التشغيل.
- يربط `/focus <target>` سلسلة Discord الحالية أو موضوع/محادثة Telegram بهدف جلسة.
- يزيل `/unfocus` الربط الحالي.
- يسرد `/agents` العوامل المرتبطة بالسلسلة للجلسة الحالية.
- يوقف `/kill <id|#|all>` عاملًا فرعيًا قيد التشغيل أو جميع العوامل الفرعية.
- يرسل `/steer <id|#> <message>` توجيهًا إلى عامل فرعي قيد التشغيل. الاسم المستعار: `/tell`.
- يقرأ `/config show|get|set|unset` أو يكتب `openclaw.json`. خاص بالمالك فقط. ويتطلب `commands.config: true`.
- يقرأ `/mcp show|get|set|unset` أو يكتب إعدادات خادم MCP التي يديرها OpenClaw تحت `mcp.servers`. خاص بالمالك فقط. ويتطلب `commands.mcp: true`.
- يفحص `/plugins list|inspect|show|get|install|enable|disable` حالة الإضافات أو يغيّرها. و`/plugin` اسم مستعار. والكتابة خاصة بالمالك فقط. ويتطلب `commands.plugins: true`.
- يدير `/debug show|set|unset|reset` تجاوزات الإعدادات الخاصة بوقت التشغيل فقط. خاص بالمالك فقط. ويتطلب `commands.debug: true`.
- يتحكم `/usage off|tokens|full|cost` في تذييل الاستخدام لكل استجابة أو يطبع ملخص تكلفة محليًا.
- يتحكم `/tts on|off|status|provider|limit|summary|audio|help` في TTS. راجع [/tools/tts](/ar/tools/tts).
- يعيد `/restart` تشغيل OpenClaw عند التمكين. الافتراضي: مفعّل؛ عيّن `commands.restart: false` لتعطيله.
- يضبط `/activation mention|always` وضع التفعيل في المجموعات.
- يضبط `/send on|off|inherit` سياسة الإرسال. خاص بالمالك فقط.
- يشغّل `/bash <command>` أمر shell على المضيف. نصّي فقط. الاسم المستعار: `! <command>`. ويتطلب `commands.bash: true` بالإضافة إلى قوائم السماح `tools.elevated`.
- يتحقق `!poll [sessionId]` من مهمة bash في الخلفية.
- يوقف `!stop [sessionId]` مهمة bash في الخلفية.

### أوامر dock المولّدة

يتم توليد أوامر dock من إضافات القنوات التي تدعم الأوامر الأصلية. المجموعة المضمّنة الحالية:

- `/dock-discord` (الاسم المستعار: `/dock_discord`)
- `/dock-mattermost` (الاسم المستعار: `/dock_mattermost`)
- `/dock-slack` (الاسم المستعار: `/dock_slack`)
- `/dock-telegram` (الاسم المستعار: `/dock_telegram`)

### أوامر الإضافات المضمّنة

يمكن للإضافات المضمّنة إضافة مزيد من الأوامر المائلة. الأوامر المضمّنة الحالية في هذا المستودع:

- يبدّل `/dreaming [on|off|status|help]` الحلم الخاص بالذاكرة. راجع [Dreaming](/ar/concepts/dreaming).
- يدير `/pair [qr|status|pending|approve|cleanup|notify]` تدفق اقتران/إعداد الجهاز. راجع [الاقتران](/ar/channels/pairing).
- يفعّل `/phone status|arm <camera|screen|writes|all> [duration]|disarm` مؤقتًا أوامر عقدة الهاتف عالية الخطورة.
- يدير `/voice status|list [limit]|set <voiceId|name>` إعدادات الصوت في Talk. على Discord، اسم الأمر الأصلي هو `/talkvoice`.
- يرسل `/card ...` إعدادات مسبقة للبطاقات الغنية الخاصة بـ LINE. راجع [LINE](/ar/channels/line).
- يفحص `/codex status|models|threads|resume|compact|review|account|mcp|skills` ويضبط حزمة خادم التطبيق Codex المضمّنة. راجع [Codex Harness](/ar/plugins/codex-harness).
- أوامر مخصّصة لـ QQBot فقط:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### أوامر Skills الديناميكية

يتم أيضًا إتاحة Skills القابلة للاستدعاء من قبل المستخدم كأوامر مائلة:

- يعمل `/skill <name> [input]` دائمًا كنقطة دخول عامة.
- قد تظهر Skills أيضًا كأوامر مباشرة مثل `/prose` عندما تقوم Skill/الإضافة بتسجيلها.
- يتحكم `commands.nativeSkills` و`channels.<provider>.commands.nativeSkills` في تسجيل أوامر Skills الأصلية.

ملاحظات:

- تقبل الأوامر وضع `:` اختياري بين الأمر والمعاملات (مثل `/think: high` و`/send: on` و`/help:`).
- يقبل `/new <model>` اسمًا مستعارًا للنموذج، أو `provider/model`، أو اسم موفّر (مطابقة تقريبية)؛ وإذا لم توجد مطابقة، فسيُعامل النص على أنه نص الرسالة.
- للحصول على تفصيل كامل لاستخدام الموفّر، استخدم `openclaw status --usage`.
- يتطلب `/allowlist add|remove` ضبط `commands.config=true` ويحترم `configWrites` الخاصة بالقناة.
- في القنوات متعددة الحسابات، يحترم كل من `/allowlist --account <id>` الموجّه للإعدادات و`/config set channels.<provider>.accounts.<id>...` أيضًا `configWrites` الخاصة بالحساب المستهدف.
- يتحكم `/usage` في تذييل الاستخدام لكل استجابة؛ ويطبع `/usage cost` ملخص تكلفة محليًا من سجلات جلسات OpenClaw.
- يكون `/restart` مفعّلًا افتراضيًا؛ عيّن `commands.restart: false` لتعطيله.
- يقبل `/plugins install <spec>` نفس مواصفات الإضافة التي يقبلها `openclaw plugins install`: مسار/أرشيف محلي، أو حزمة npm، أو `clawhub:<pkg>`.
- يحدّث `/plugins enable|disable` إعدادات الإضافة وقد يطلب إعادة تشغيل.
- أمر أصلي خاص بـ Discord فقط: يتحكم `/vc join|leave|status` في القنوات الصوتية (ويتطلب `channels.discord.voice` والأوامر الأصلية؛ وهو غير متاح كنص).
- تتطلب أوامر ربط السلاسل في Discord (`/focus` و`/unfocus` و`/agents` و`/session idle` و`/session max-age`) تفعيل ربط السلاسل فعليًا (`session.threadBindings.enabled` و/أو `channels.discord.threadBindings.enabled`).
- مرجع أوامر ACP وسلوك وقت التشغيل: [عوامل ACP](/ar/tools/acp-agents).
- الغرض من `/verbose` هو التصحيح وإتاحة رؤية إضافية؛ أبقه **معطّلًا** في الاستخدام العادي.
- يؤدي `/fast on|off` إلى استمرار تجاوز الجلسة. استخدم خيار `inherit` في واجهة Sessions لمسحه والرجوع إلى إعدادات التهيئة الافتراضية.
- إن `/fast` خاص بالموفّر: يربطه OpenAI/OpenAI Codex بـ `service_tier=priority` على نقاط نهاية Responses الأصلية، بينما تربطه طلبات Anthropic العامة المباشرة، بما فيها الحركة المصادق عليها عبر OAuth والمرسلة إلى `api.anthropic.com`، بـ `service_tier=auto` أو `standard_only`. راجع [OpenAI](/ar/providers/openai) و[Anthropic](/ar/providers/anthropic).
- لا تزال ملخصات فشل الأدوات تُعرض عند الاقتضاء، لكن نص الفشل التفصيلي لا يُضمَّن إلا عندما تكون `/verbose` على `on` أو `full`.
- تُعد `/reasoning` (و`/verbose`) محفوفة بالمخاطر في إعدادات المجموعات: فقد تكشف استدلالًا داخليًا أو ناتج أدوات لم تكن تنوي كشفه. ويُفضَّل تركها معطّلة، خاصة في المحادثات الجماعية.
- يؤدي `/model` إلى استمرار نموذج الجلسة الجديد فورًا.
- إذا كان العامل في وضع الخمول، فسيستخدمه التشغيل التالي مباشرة.
- إذا كان هناك تشغيل نشط بالفعل، يضع OpenClaw تبديلًا حيًا على أنه معلّق ولا يعيد التشغيل إلى النموذج الجديد إلا عند نقطة إعادة محاولة نظيفة.
- إذا كان نشاط الأدوات أو إخراج الرد قد بدأ بالفعل، فقد يبقى التبديل المعلّق في الطابور حتى فرصة إعادة محاولة لاحقة أو حتى دورة المستخدم التالية.
- **المسار السريع:** تتم معالجة الرسائل التي تحتوي على أوامر فقط من المرسلين المدرجين في قائمة السماح فورًا (تتجاوز الطابور + النموذج).
- **بوابة الإشارة في المجموعات:** تتجاوز الرسائل التي تحتوي على أوامر فقط من المرسلين المدرجين في قائمة السماح متطلبات الإشارة.
- **الاختصارات المضمّنة (للمرسلين المدرجين في قائمة السماح فقط):** تعمل بعض الأوامر أيضًا عندما تكون مضمّنة داخل رسالة عادية، وتُزال قبل أن يرى النموذج النص المتبقي.
  - مثال: يؤدي `hey /status` إلى تشغيل رد الحالة، ويستمر النص المتبقي عبر التدفق العادي.
- حاليًا: `/help` و`/commands` و`/status` و`/whoami` (`/id`).
- يتم تجاهل الرسائل غير المصرّح بها التي تحتوي على أوامر فقط بصمت، وتُعامل الرموز المضمّنة `/...` كنص عادي.
- **أوامر Skills:** يتم عرض Skills `user-invocable` كأوامر مائلة. وتُنقّى الأسماء إلى `a-z0-9_` (بحد أقصى 32 محرفًا)؛ وتحصل التصادمات على لاحقات رقمية (مثل `_2`).
  - يشغّل `/skill <name> [input]` Skill بالاسم (وهذا مفيد عندما تمنع قيود الأوامر الأصلية إنشاء أمر لكل Skill).
  - افتراضيًا، تُمرَّر أوامر Skills إلى النموذج كطلب عادي.
  - يمكن لـ Skills اختياريًا إعلان `command-dispatch: tool` لتوجيه الأمر مباشرة إلى أداة (حتمي، ومن دون نموذج).
  - مثال: `/prose` (إضافة OpenProse) — راجع [OpenProse](/ar/prose).
- **معاملات الأوامر الأصلية:** يستخدم Discord الإكمال التلقائي للخيارات الديناميكية (وقوائم الأزرار عند حذف المعاملات المطلوبة). ويعرض Telegram وSlack قائمة أزرار عندما يدعم الأمر خيارات وتحذف المعامل.

## `/tools`

يجيب `/tools` عن سؤال متعلق بوقت التشغيل، وليس سؤالًا متعلقًا بالإعدادات: **ما الذي يمكن لهذا العامل استخدامه الآن
في هذه المحادثة**.

- يكون `/tools` الافتراضي موجزًا ومحسّنًا للمسح السريع.
- يضيف `/tools verbose` أوصافًا قصيرة.
- تعرض أسطح الأوامر الأصلية التي تدعم المعاملات نفس تبديل الوضع `compact|verbose`.
- تكون النتائج مقيّدة بنطاق الجلسة، لذا فإن تغيير العامل، أو القناة، أو السلسلة، أو تفويض المرسِل، أو النموذج يمكن
  أن يغيّر الناتج.
- يتضمن `/tools` الأدوات التي يمكن الوصول إليها فعليًا في وقت التشغيل، بما في ذلك الأدوات الأساسية، وأدوات
  الإضافات المتصلة، والأدوات المملوكة للقنوات.

بالنسبة إلى تحرير الملفات الشخصية والتجاوزات، استخدم لوحة Tools في واجهة Control UI أو أسطح الإعدادات/الفهرس بدلًا
من التعامل مع `/tools` على أنه فهرس ثابت.

## أسطح الاستخدام (ما الذي يظهر وأين)

- **استخدام/حصة الموفّر** (مثال: "Claude متبقٍ منه 80%") يظهر في `/status` لموفّر النموذج الحالي عند تفعيل تتبع الاستخدام. ويطبّع OpenClaw نوافذ الموفّرين إلى `% left`؛ وبالنسبة إلى MiniMax، يتم عكس حقول النسبة المئوية التي تُرجع المتبقي فقط قبل العرض، كما أن استجابات `model_remains` تفضّل إدخال نموذج الدردشة بالإضافة إلى تسمية خطة موسومة بالنموذج.
- يمكن أن تعود **أسطر الرموز/التخزين المؤقت** في `/status` إلى أحدث إدخال استخدام في النص المفرّغ عندما تكون لقطة الجلسة الحية قليلة البيانات. وتظل القيم الحية غير الصفرية الموجودة هي الفائزة، كما يمكن لهذا الرجوع إلى النص المفرّغ أيضًا استعادة تسمية نموذج وقت التشغيل النشط بالإضافة إلى إجمالي أكبر موجّه للمطالبة عندما تكون الإجماليات المخزنة مفقودة أو أصغر.
- يتم التحكم في **الرموز/التكلفة لكل استجابة** بواسطة `/usage off|tokens|full` (تُضاف إلى الردود العادية).
- يتعلق `/model status` بـ **النماذج/المصادقة/نقاط النهاية**، وليس بالاستخدام.

## اختيار النموذج (`/model`)

يتم تنفيذ `/model` على أنه توجيه.

أمثلة:

```text
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

ملاحظات:

- يعرض `/model` و`/model list` منتقيًا موجزًا مرقّمًا (عائلة النموذج + الموفّرين المتاحين).
- في Discord، يفتح `/model` و`/models` منتقيًا تفاعليًا مع قوائم منسدلة للموفّر والنموذج بالإضافة إلى خطوة Submit.
- يختار `/model <#>` من ذلك المنتقي (ويفضّل الموفّر الحالي عند الإمكان).
- يعرض `/model status` العرض التفصيلي، بما في ذلك نقطة نهاية الموفّر المهيأة (`baseUrl`) ووضع API (`api`) عند توفرهما.

## تجاوزات التصحيح

يتيح لك `/debug` تعيين تجاوزات إعدادات **وقت التشغيل فقط** (في الذاكرة، وليس على القرص). وهو خاص بالمالك فقط. ويكون معطّلًا افتراضيًا؛ قم بتمكينه عبر `commands.debug: true`.

أمثلة:

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

ملاحظات:

- تُطبّق التجاوزات فورًا على قراءات الإعدادات الجديدة، لكنها **لا** تكتب إلى `openclaw.json`.
- استخدم `/debug reset` لمسح جميع التجاوزات والرجوع إلى الإعدادات الموجودة على القرص.

## تحديثات الإعدادات

يكتب `/config` إلى إعداداتك الموجودة على القرص (`openclaw.json`). وهو خاص بالمالك فقط. ويكون معطّلًا افتراضيًا؛ قم بتمكينه عبر `commands.config: true`.

أمثلة:

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

ملاحظات:

- يتم التحقق من صحة الإعدادات قبل الكتابة؛ وتُرفض التغييرات غير الصالحة.
- تستمر تحديثات `/config` عبر عمليات إعادة التشغيل.

## تحديثات MCP

يكتب `/mcp` تعريفات خوادم MCP التي يديرها OpenClaw تحت `mcp.servers`. وهو خاص بالمالك فقط. ويكون معطّلًا افتراضيًا؛ قم بتمكينه عبر `commands.mcp: true`.

أمثلة:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

ملاحظات:

- يخزّن `/mcp` الإعدادات في إعدادات OpenClaw، وليس في إعدادات المشروع المملوكة لـ Pi.
- تحدد محوّلات وقت التشغيل أي وسائل نقل قابلة للتنفيذ فعليًا.

## تحديثات الإضافات

يتيح `/plugins` للمشغّلين فحص الإضافات المكتشفة وتبديل حالة التمكين في الإعدادات. ويمكن للتدفقات للقراءة فقط استخدام `/plugin` كاسم مستعار. وهو معطّل افتراضيًا؛ قم بتمكينه عبر `commands.plugins: true`.

أمثلة:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

ملاحظات:

- يستخدم `/plugins list` و`/plugins show` اكتشافًا فعليًا للإضافات في مساحة العمل الحالية بالإضافة إلى الإعدادات الموجودة على القرص.
- يحدّث `/plugins enable|disable` إعدادات الإضافة فقط؛ ولا يقوم بتثبيت الإضافات أو إلغاء تثبيتها.
- بعد تغييرات التمكين/التعطيل، أعد تشغيل gateway لتطبيقها.

## ملاحظات السطح

- تعمل **الأوامر النصية** في جلسة الدردشة العادية (تشارك الرسائل المباشرة `main`، وللمجموعات جلساتها الخاصة).
- تستخدم **الأوامر الأصلية** جلسات معزولة:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (البادئة قابلة للتهيئة عبر `channels.slack.slashCommand.sessionPrefix`)
  - Telegram: `telegram:slash:<userId>` (تستهدف جلسة الدردشة عبر `CommandTargetSessionKey`)
- يستهدف **`/stop`** جلسة الدردشة النشطة حتى يتمكن من إيقاف التشغيل الحالي.
- **Slack:** لا يزال `channels.slack.slashCommand` مدعومًا لأمر واحد بنمط `/openclaw`. وإذا قمت بتمكين `commands.native`، فيجب عليك إنشاء أمر مائل واحد في Slack لكل أمر مضمّن (بنفس أسماء `/help`). وتُسلَّم قوائم معاملات الأوامر في Slack كأزرار Block Kit مؤقتة.
  - استثناء Slack الأصلي: سجّل `/agentstatus` (وليس `/status`) لأن Slack يحجز `/status`. بينما يظل `/status` النصي يعمل في رسائل Slack.

## أسئلة BTW الجانبية

يُعد `/btw` **سؤالًا جانبيًا** سريعًا حول الجلسة الحالية.

وعلى عكس الدردشة العادية:

- فإنه يستخدم الجلسة الحالية كسياق في الخلفية،
- ويعمل كاستدعاء منفصل **من دون أدوات** ولمرة واحدة،
- ولا يغيّر سياق الجلسة المستقبلي،
- ولا يُكتب في سجل النص المفرّغ،
- ويُسلَّم كنتيجة جانبية حية بدلًا من رسالة مساعد عادية.

وهذا يجعل `/btw` مفيدًا عندما تريد توضيحًا مؤقتًا بينما تستمر
المهمة الرئيسية.

مثال:

```text
/btw ما الذي نفعله الآن؟
```

راجع [أسئلة BTW الجانبية](/ar/tools/btw) للاطلاع على السلوك الكامل
وتفاصيل تجربة العميل.

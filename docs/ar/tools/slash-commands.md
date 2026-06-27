---
read_when:
    - استخدام أو تكوين أوامر الدردشة
    - تصحيح أخطاء توجيه الأوامر أو الأذونات
    - فهم كيفية تسجيل أوامر Skills
sidebarTitle: Slash commands
summary: جميع أوامر الشرطة المائلة والتوجيهات والاختصارات المضمنة المتاحة — الإعداد والتوجيه والسلوك لكل سطح.
title: أوامر الشرطة المائلة
x-i18n:
    generated_at: "2026-06-27T18:45:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5f53a5209d1c99c593d646b4ecc12e7074f72766cf3d1278c4d13511369d29bc
    source_path: tools/slash-commands.md
    workflow: 16
---

يتعامل Gateway مع الأوامر المرسلة كرسائل مستقلة تبدأ بـ `/`.
تستخدم أوامر bash الخاصة بالمضيف فقط `! <cmd>` (مع `/bash <cmd>` كاسم مستعار).

عندما تكون محادثة مرتبطة بجلسة ACP، يوجَّه النص العادي إلى
حزمة ACP. تبقى أوامر إدارة Gateway محلية: يصل `/acp ...` دائمًا إلى
معالج أوامر OpenClaw، ويبقى `/status` مع `/unfocus` محليين كلما
كان التعامل مع الأوامر مفعّلًا للسطح.

## ثلاثة أنواع من الأوامر

<CardGroup cols={3}>
  <Card title="Commands" icon="terminal">
    رسائل `/...` المستقلة التي يتعامل معها Gateway. يجب أن تُرسل
    باعتبارها المحتوى الوحيد في الرسالة.
  </Card>
  <Card title="Directives" icon="sliders">
    `/think`، `/fast`، `/verbose`، `/trace`، `/reasoning`، `/elevated`،
    `/exec`، `/model`، `/queue` — تُزال من الرسالة قبل أن يراها النموذج.
    تحفظ إعدادات الجلسة عند إرسالها وحدها؛ وتعمل كتلميحات مضمنة
    عند إرسالها مع نص آخر.
  </Card>
  <Card title="Inline shortcuts" icon="bolt">
    `/help`، `/commands`، `/status`، `/whoami` — تُشغَّل فورًا وتُزال
    قبل أن يرى النموذج النص المتبقي. للمرسلين المخوّلين فقط.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="Directive behavior details">
    - تُزال التوجيهات من الرسالة قبل أن يراها النموذج.
    - في رسائل **التوجيهات فقط** (عندما تكون الرسالة توجيهات فقط)، تُحفظ
      في الجلسة وتردّ بإقرار.
    - في رسائل **الدردشة العادية** التي تحتوي على نص آخر، تعمل كتلميحات مضمنة
      ولا تحفظ إعدادات الجلسة.
    - لا تنطبق التوجيهات إلا على **المرسلين المخوّلين**. إذا كان `commands.allowFrom`
      مضبوطًا، فهو قائمة السماح الوحيدة المستخدمة؛ وإلا يأتي التخويل من
      قوائم سماح/اقتران القنوات بالإضافة إلى `commands.useAccessGroups`. يرى
      المرسلون غير المخوّلين التوجيهات كنص عادي.
  </Accordion>
</AccordionGroup>

## التكوين

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
  يفعّل تحليل `/...` في رسائل الدردشة. على الأسطح التي لا تحتوي على أوامر أصلية
  (WhatsApp وWebChat وSignal وiMessage وGoogle Chat وMicrosoft Teams)، تعمل
  الأوامر النصية حتى عند ضبطه على `false`.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  يسجّل الأوامر الأصلية. تلقائيًا: مفعّل لـ Discord/Telegram؛ ومعطّل لـ Slack؛
  ويُتجاهل للموفّرين الذين لا يدعمون الأوامر الأصلية. يمكنك التجاوز لكل قناة باستخدام
  `channels.<provider>.commands.native`. في Discord، يتخطى `false` تسجيل أوامر الشرطة
  المائلة؛ وقد تبقى الأوامر المسجلة سابقًا مرئية إلى أن تُزال.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  يسجّل أوامر Skills بصورة أصلية عند دعمها. تلقائيًا: مفعّل لـ
  Discord/Telegram؛ ومعطّل لـ Slack. يمكنك التجاوز باستخدام
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  يفعّل `! <cmd>` لتشغيل أوامر صدفة المضيف (الاسم المستعار `/bash <cmd>`). يتطلب
  قوائم سماح `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  مدة انتظار bash قبل الانتقال إلى وضع الخلفية (`0` يرسلها إلى الخلفية
  فورًا).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  يفعّل `/config` (يقرأ/يكتب `openclaw.json`). للمالك فقط.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  يفعّل `/mcp` (يقرأ/يكتب تكوين MCP المُدار بواسطة OpenClaw ضمن `mcp.servers`). للمالك فقط.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  يفعّل `/plugins` (اكتشاف/حالة Plugin بالإضافة إلى التثبيت + التفعيل/التعطيل). الكتابة للمالك فقط.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  يفعّل `/debug` (تجاوزات تكوين وقت التشغيل فقط). للمالك فقط.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  يفعّل `/restart` وإجراءات أدوات إعادة تشغيل Gateway.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  قائمة سماح صريحة للمالك لأسطح الأوامر الخاصة بالمالك فقط. منفصلة عن
  `commands.allowFrom` ووصول اقتران الرسائل الخاصة.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  لكل قناة: يتطلب هوية المالك للأوامر الخاصة بالمالك فقط. عندما تكون `true`،
  يجب أن يطابق المرسل `commands.ownerAllowFrom` أو يحمل نطاق `operator.admin`
  الداخلي. إدخال wildcard في `allowFrom` **غير** كافٍ.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  يتحكم في كيفية ظهور معرّفات المالك في موجه النظام.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  سر HMAC المستخدم عند `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  قائمة سماح لكل موفّر لتخويل الأوامر. عند تكوينها، تكون هي
  مصدر التخويل **الوحيد** للأوامر والتوجيهات. استخدم `"*"` لافتراضي
  عام؛ وتتجاوزه المفاتيح الخاصة بالموفّر.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  يفرض قوائم السماح/السياسات على الأوامر عندما لا يكون `commands.allowFrom` مضبوطًا.
</ParamField>

## قائمة الأوامر

تأتي الأوامر من ثلاثة مصادر:

- **المضمنة في النواة:** `src/auto-reply/commands-registry.shared.ts`
- **أوامر dock المولّدة:** `src/auto-reply/commands-registry.data.ts`
- **أوامر Plugin:** استدعاءات `registerCommand()` الخاصة بـ Plugin

يعتمد التوفر على أعلام التكوين، وسطح القناة، وPlugins المثبتة/المفعّلة.

### أوامر النواة

<AccordionGroup>
  <Accordion title="Sessions and runs">
    | الأمر | الوصف |
    | --- | --- |
    | `/new [model]` | أرشف الجلسة الحالية وابدأ جلسة جديدة |
    | `/reset [soft [message]]` | أعد ضبط الجلسة الحالية في مكانها. يحتفظ `soft` بالسجل، ويسقط معرّفات جلسات خلفية CLI المعاد استخدامها، ويعيد تشغيل بدء التشغيل |
    | `/name <title>` | سمِّ الجلسة الحالية أو أعد تسميتها. احذف العنوان لرؤية الاسم الحالي واقتراح |
    | `/compact [instructions]` | اضغط سياق الجلسة. راجع [Compaction](/ar/concepts/compaction) |
    | `/stop` | أوقف التشغيل الحالي |
    | `/session idle <duration\|off>` | أدر انتهاء صلاحية خمول ربط السلسلة |
    | `/session max-age <duration\|off>` | أدر انتهاء صلاحية الحد الأقصى لعمر ربط السلسلة |
    | `/export-session [path]` | صدّر الجلسة الحالية إلى HTML. الاسم المستعار: `/export` |
    | `/export-trajectory [path]` | صدّر حزمة مسار JSONL للجلسة الحالية. الاسم المستعار: `/trajectory` |

    <Note>
      تعترض واجهة التحكم `/new` المكتوب لإنشاء جلسة لوحة معلومات جديدة
      والتبديل إليها، إلا عندما يكون `session.dmScope: "main"` مكوّنًا
      ويكون الأصل الحالي هو الجلسة الرئيسية للوكيل — في هذه الحالة يعيد `/new`
      ضبط الجلسة الرئيسية في مكانها. لا يزال `/reset` المكتوب يشغّل إعادة الضبط
      الموضعية الخاصة بـ Gateway. استخدم `/model default` عندما تريد مسح
      اختيار نموذج جلسة مثبت.
    </Note>

  </Accordion>

  <Accordion title="Model and run controls">
    | الأمر | الوصف |
    | --- | --- |
    | `/think <level\|default>` | اضبط مستوى التفكير أو امسح تجاوز الجلسة. الأسماء المستعارة: `/thinking`، `/t` |
    | `/verbose on\|off\|full` | بدّل الإخراج المطوّل. الاسم المستعار: `/v` |
    | `/trace on\|off` | بدّل إخراج تتبع Plugin للجلسة الحالية |
    | `/fast [status\|auto\|on\|off\|default]` | اعرض وضع السرعة أو اضبطه أو امسحه |
    | `/reasoning [on\|off\|stream]` | بدّل رؤية الاستدلال. الاسم المستعار: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | بدّل الوضع المرتفع. الاسم المستعار: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | اعرض افتراضيات exec أو اضبطها |
    | `/model [name\|#\|status]` | اعرض النموذج أو اضبطه |
    | `/models [provider] [page] [limit=<n>\|all]` | اسرد الموفّرين أو النماذج المكوّنة/المتاحة بالمصادقة |
    | `/queue <mode>` | أدر سلوك طابور التشغيل النشط. راجع [Queue](/ar/concepts/queue) و[Queue steering](/ar/concepts/queue-steering) |
    | `/steer <message>` | احقن إرشادًا في التشغيل النشط. الاسم المستعار: `/tell`. راجع [Steer](/ar/tools/steer) |

    <AccordionGroup>
      <Accordion title="verbose / trace / fast / reasoning safety">
        - `/verbose` مخصص للتصحيح — اتركه **معطّلًا** في الاستخدام العادي.
        - يكشف `/trace` فقط أسطر التتبع/التصحيح المملوكة لـ Plugin؛ وتبقى الثرثرة المطوّلة العادية معطّلة.
        - يحفظ `/fast auto|on|off` تجاوزًا للجلسة؛ استخدم خيار `inherit` في واجهة الجلسات لمسحه.
        - `/fast` خاص بالموفّر: يربطه OpenAI/Codex بـ `service_tier=priority`؛ وتربطه طلبات Anthropic المباشرة بـ `service_tier=auto` أو `standard_only`.
        - `/reasoning` و`/verbose` و`/trace` محفوفة بالمخاطر في إعدادات المجموعات — فقد تكشف الاستدلال الداخلي أو تشخيصات Plugin. أبقها معطّلة في دردشات المجموعات.

      </Accordion>
      <Accordion title="Model switching details">
        - يحفظ `/model` النموذج الجديد فورًا في الجلسة.
        - إذا كان الوكيل خاملاً، يستخدمه التشغيل التالي مباشرة.
        - إذا كان هناك تشغيل نشط، تُعلَّم عملية التبديل كمعلّقة وتُطبَّق عند نقطة إعادة المحاولة النظيفة التالية.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="Discovery and status">
    | الأمر | الوصف |
    | --- | --- |
    | `/help` | اعرض ملخص المساعدة القصير |
    | `/commands` | اعرض كتالوج الأوامر المولّد |
    | `/tools [compact\|verbose]` | اعرض ما يمكن للوكيل الحالي استخدامه الآن |
    | `/status` | اعرض حالة التنفيذ/وقت التشغيل، ومدة تشغيل Gateway والنظام، وصحة Plugin، بالإضافة إلى استخدام/حصة الموفّر |
    | `/status plugins` | اعرض صحة Plugin بالتفصيل: أخطاء التحميل، الحجر، إخفاقات القنوات، مشكلات الاعتماديات، إشعارات التوافق |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | أدر [الهدف](/ar/tools/goal) الدائم للجلسة الحالية |
    | `/diagnostics [note]` | تدفق تقرير دعم للمالك فقط. يطلب موافقة exec في كل مرة |
    | `/crestodian <request>` | شغّل مساعد إعداد وإصلاح Crestodian من رسالة خاصة للمالك |
    | `/tasks` | اسرد المهام الخلفية النشطة/الأخيرة للجلسة الحالية |
    | `/context [list\|detail\|map\|json]` | اشرح كيف يُجمَّع السياق |
    | `/whoami` | اعرض معرّف المرسل الخاص بك. الاسم المستعار: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | تحكّم في تذييل الاستخدام لكل رد (`reset`/`inherit`/`clear`/`default` يمسح تجاوز الجلسة لإعادة وراثة الافتراضي المكوّن) أو اطبع ملخص تكلفة محليًا |
  </Accordion>

  <Accordion title="Skills, allowlists, approvals">
    | الأمر | الوصف |
    | --- | --- |
    | `/skill <name> [input]` | شغّل Skill بالاسم |
    | `/allowlist [list\|add\|remove] ...` | أدر إدخالات قائمة السماح. نص فقط |
    | `/approve <id> <decision>` | حُلّ مطالبات موافقة exec أو Plugin |
    | `/btw <question>` | اطرح سؤالًا جانبيًا دون تغيير سياق الجلسة. الاسم المستعار: `/side`. راجع [BTW](/ar/tools/btw) |
  </Accordion>

  <Accordion title="الوكلاء الفرعيون وACP">
    | الأمر | الوصف |
    | --- | --- |
    | `/subagents list\|log\|info` | افحص تشغيلات الوكيل الفرعي للجلسة الحالية |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | أدر جلسات ACP وخيارات وقت التشغيل |
    | `/focus <target>` | اربط سلسلة Discord الحالية أو موضوع Telegram بهدف جلسة |
    | `/unfocus` | أزل ربط السلسلة الحالية |
    | `/agents` | اعرض الوكلاء المرتبطين بالسلسلة للجلسة الحالية |
  </Accordion>

  <Accordion title="كتابات المالك فقط والإدارة">
    | الأمر | يتطلب | الوصف |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | اقرأ أو اكتب `openclaw.json`. للمالك فقط |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | اقرأ أو اكتب إعداد خادم MCP المُدار من OpenClaw. للمالك فقط |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | افحص حالة Plugin أو عدّلها. للكتابات: المالك فقط. الاسم البديل: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | تجاوزات إعدادات وقت التشغيل فقط. للمالك فقط |
    | `/restart` | `commands.restart: true` (افتراضي) | أعد تشغيل OpenClaw |
    | `/send on\|off\|inherit` | المالك | اضبط سياسة الإرسال |
  </Accordion>

  <Accordion title="الصوت وTTS والتحكم في القناة">
    | الأمر | الوصف |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | تحكّم في TTS. راجع [TTS](/ar/tools/tts) |
    | `/activation mention\|always` | اضبط وضع تفعيل المجموعة |
    | `/bash <command>` | شغّل أمر صدفة على المضيف. الاسم البديل: `! <command>`. يتطلب `commands.bash: true` |
    | `!poll [sessionId]` | تحقّق من مهمة bash في الخلفية |
    | `!stop [sessionId]` | أوقف مهمة bash في الخلفية |
  </Accordion>
</AccordionGroup>

### أوامر Dock

تبدّل أوامر Dock مسار رد الجلسة النشطة إلى قناة مرتبطة أخرى.
راجع [إرساء القنوات](/ar/concepts/channel-docking) للإعداد واستكشاف الأخطاء وإصلاحها.

مولّدة من Plugins القنوات التي تدعم الأوامر الأصلية:

- `/dock-discord` (الاسم البديل: `/dock_discord`)
- `/dock-mattermost` (الاسم البديل: `/dock_mattermost`)
- `/dock-slack` (الاسم البديل: `/dock_slack`)
- `/dock-telegram` (الاسم البديل: `/dock_telegram`)

تتطلب أوامر Dock وجود `session.identityLinks`. يجب أن يكون المرسل المصدر والنظير الهدف
ضمن مجموعة الهوية نفسها.

### أوامر Plugin المضمّنة

| الأمر                                                                                      | الوصف                                                                       |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | بدّل Dreaming الذاكرة. راجع [Dreaming](/ar/concepts/dreaming)                        |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | أدر إقران الأجهزة. راجع [الإقران](/ar/channels/pairing)                           |
| `/phone status\|arm ...\|disarm`                                                             | سلّح أوامر عقدة الهاتف عالية المخاطر مؤقتًا                                     |
| `/voice status\|list\|set <voiceId>`                                                         | أدر إعداد صوت Talk. الاسم الأصلي في Discord: `/talkvoice`                       |
| `/card ...`                                                                                  | أرسل إعدادات بطاقات LINE الغنية المسبقة. راجع [LINE](/ar/channels/line)                           |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | تحكّم في حزمة خادم تطبيق Codex. راجع [حزمة Codex](/ar/plugins/codex-harness) |

QQBot فقط: `/bot-ping`، `/bot-version`، `/bot-help`، `/bot-upgrade`، `/bot-logs`

### أوامر Skills

تُعرض Skills التي يمكن للمستخدم استدعاؤها كأوامر شرطة مائلة:

- يعمل `/skill <name> [input]` دائمًا كنقطة دخول عامة.
- يمكن أن تُسجّل Skills كأوامر مباشرة (مثل `/prose` لـ OpenProse).
- يتحكم `commands.nativeSkills` و
  `channels.<provider>.commands.nativeSkills` في تسجيل أوامر Skills الأصلية.
- تُنظّف الأسماء إلى `a-z0-9_` (بحد أقصى 32 حرفًا)؛ وتحصل التصادمات على لواحق رقمية.

<AccordionGroup>
  <Accordion title="توجيه أمر Skill">
    افتراضيًا، تُوجَّه أوامر Skill إلى النموذج كطلب عادي.

    يمكن أن تعلن Skills عن `command-dispatch: tool` للتوجيه مباشرة إلى أداة
    (حتمي، بلا تدخل من النموذج). مثال: `/prose` ‏(OpenProse plugin)
    — راجع [OpenProse](/ar/prose).

  </Accordion>
  <Accordion title="وسائط الأمر الأصلي">
    يستخدم Discord الإكمال التلقائي للخيارات الديناميكية وقوائم الأزرار عند حذف
    الوسائط المطلوبة. يعرض Telegram وSlack قائمة أزرار للأوامر التي تحتوي على
    اختيارات. تُحل الاختيارات الديناميكية مقابل نموذج الجلسة الهدف، لذلك تتبع
    الخيارات الخاصة بالنموذج مثل مستويات `/think` تجاوز `/model` للجلسة.
  </Accordion>
</AccordionGroup>

## `/tools` — ما يمكن للوكيل استخدامه الآن

يجيب `/tools` عن سؤال وقت التشغيل: **ما الذي يمكن لهذا الوكيل استخدامه الآن في هذه
المحادثة** — وليس فهرس إعدادات ثابتًا.

```text
/tools         # عرض موجز
/tools verbose # مع أوصاف قصيرة
```

النتائج محددة بنطاق الجلسة. يمكن أن يؤدي تغيير الوكيل أو القناة أو السلسلة أو تفويض
المرسل أو النموذج إلى تغيير المخرجات. لتحرير الملفات الشخصية والتجاوزات،
استخدم لوحة أدوات Control UI أو أسطح الإعدادات.

## `/model` — اختيار النموذج

```text
/model             # إظهار منتقي النموذج
/model list        # الشيء نفسه
/model 3           # الاختيار بالرقم من المنتقي
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # مسح اختيار نموذج الجلسة
/model status      # عرض مفصل يتضمن نقطة النهاية ووضع API
```

على Discord، يفتح `/model` و`/models` منتقيًا تفاعليًا يتضمن قوائم منسدلة
للمزوّد والنموذج. يحترم المنتقي `agents.defaults.models`، بما في ذلك
إدخالات `provider/*`.

## `/config` — كتابات الإعدادات على القرص

<Note>
  للمالك فقط. معطّل افتراضيًا — فعّله باستخدام `commands.config: true`.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

يُتحقق من الإعداد قبل الكتابة. تُرفض التغييرات غير الصالحة. تستمر تحديثات `/config`
بعد عمليات إعادة التشغيل.

## `/mcp` — إعداد خادم MCP

<Note>
  للمالك فقط. معطّل افتراضيًا — فعّله باستخدام `commands.mcp: true`.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

يخزن `/mcp` الإعداد في إعداد OpenClaw، وليس في إعدادات مشروع الوكيل المضمّن.

## `/debug` — تجاوزات وقت التشغيل فقط

<Note>
  للمالك فقط. معطّل افتراضيًا — فعّله باستخدام `commands.debug: true`.
  تُطبّق التجاوزات فورًا على قراءات الإعدادات الجديدة لكنها **لا** تكتب إلى القرص.
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins` — إدارة Plugin

<Note>
  للكتابات: المالك فقط. معطّل افتراضيًا — فعّله باستخدام `commands.plugins: true`.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

يحدّث `/plugins enable|disable` إعداد Plugin ويعيد تحميل وقت تشغيل Plugin في Gateway
بشكل ساخن لأدوار الوكيل الجديدة. يعيد `/plugins install` تشغيل Gateways المُدارة
تلقائيًا لأن وحدات مصدر Plugin تغيّرت.

## `/trace` — مخرجات تتبّع Plugin

```text
/trace          # إظهار حالة التتبع الحالية
/trace on
/trace off
```

يكشف `/trace` أسطر تتبع/تصحيح Plugin محددة بنطاق الجلسة من دون وضع الإسهاب الكامل.
ولا يستبدل `/debug` (تجاوزات وقت التشغيل) أو `/verbose` (مخرجات الأدوات العادية).

## `/btw` — أسئلة جانبية

`/btw` سؤال جانبي سريع عن سياق الجلسة الحالية. الاسم البديل: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

بخلاف الرسالة العادية:

- يستخدم الجلسة الحالية كسياق خلفي.
- في جلسات حزمة Codex، يعمل كسلسلة Codex جانبية مؤقتة.
- **لا** يغيّر سياق الجلسة المستقبلي.
- لا يُكتب في سجل المحادثة.

راجع [أسئلة BTW الجانبية](/ar/tools/btw) لمعرفة السلوك الكامل.

## ملاحظات السطح

<AccordionGroup>
  <Accordion title="نطاق الجلسة لكل سطح">
    - **الأوامر النصية:** تعمل في جلسة الدردشة العادية (تشارك الرسائل الخاصة `main`، وللمجموعات جلساتها الخاصة).
    - **أوامر Discord الأصلية:** `agent:<agentId>:discord:slash:<userId>`
    - **أوامر Slack الأصلية:** `agent:<agentId>:slack:slash:<userId>` (البادئة قابلة للضبط عبر `channels.slack.slashCommand.sessionPrefix`)
    - **أوامر Telegram الأصلية:** `telegram:slash:<userId>` (تستهدف جلسة الدردشة عبر `CommandTargetSessionKey`)
    - **`/stop`** يستهدف جلسة الدردشة النشطة لإجهاض التشغيل الحالي.

  </Accordion>
  <Accordion title="تفاصيل Slack">
    يدعم `channels.slack.slashCommand` أمرًا واحدًا بأسلوب `/openclaw`.
    مع `commands.native: true`، أنشئ أمر Slack بشرطة مائلة واحدًا لكل أمر
    مضمّن. سجّل `/agentstatus` (وليس `/status`) لأن Slack يحجز
    `/status`. يظل `/status` النصي يعمل في رسائل Slack.
  </Accordion>
  <Accordion title="المسار السريع والاختصارات المضمنة">
    - تُعالج الرسائل التي تحتوي على أمر فقط من المرسلين المدرجين في قائمة السماح فورًا (تجاوز قائمة الانتظار + النموذج).
    - تعمل الاختصارات المضمنة (`/help`، `/commands`، `/status`، `/whoami`) أيضًا داخل الرسائل العادية وتُزال قبل أن يرى النموذج النص المتبقي.
    - تُتجاهل بصمت الرسائل غير المصرح بها التي تحتوي على أمر فقط؛ وتُعامل رموز `/...` المضمنة كنص عادي.

  </Accordion>
  <Accordion title="ملاحظات الوسائط">
    - تقبل الأوامر `:` اختياريًا بين الأمر والوسائط (`/think: high`، `/send: on`).
    - يقبل `/new <model>` اسمًا بديلًا للنموذج أو `provider/model` أو اسم مزوّد (مطابقة تقريبية)؛ وإذا لم توجد مطابقة، يُعامل النص كمتن الرسالة.
    - يتطلب `/allowlist add|remove` وجود `commands.config: true` ويحترم `configWrites` للقناة.

  </Accordion>
</AccordionGroup>

## استخدام المزوّد والحالة

- يظهر **استخدام/حصة المزوّد** (مثل "Claude 80% left") في `/status` لمزوّد النموذج الحالي عند تفعيل تتبع الاستخدام.
- يمكن أن تعود **أسطر الرموز/ذاكرة التخزين المؤقت** في `/status` إلى أحدث إدخال استخدام في سجل المحادثة عندما تكون لقطة الجلسة الحية محدودة.
- **التنفيذ مقابل وقت التشغيل:** يبلّغ `/status` عن `Execution` لمسار بيئة العزل الفعّال وعن `Runtime` لمن يشغّل الجلسة: `OpenClaw Default` أو `OpenAI Codex` أو واجهة خلفية CLI أو واجهة خلفية ACP.
- **الرموز/التكلفة لكل استجابة:** يتحكم بها `/usage off|tokens|full`.
- يتعلق `/model status` بالنماذج/المصادقة/نقاط النهاية، وليس بالاستخدام.

## ذو صلة

<CardGroup cols={2}>
  <Card title="Skills" href="/ar/tools/skills" icon="puzzle-piece">
    كيفية تسجيل أوامر Skills ذات الشرطة المائلة وتقييدها.
  </Card>
  <Card title="إنشاء Skills" href="/ar/tools/creating-skills" icon="hammer">
    ابنِ Skill تسجّل أمر الشرطة المائلة الخاص بها.
  </Card>
  <Card title="BTW" href="/ar/tools/btw" icon="comments">
    أسئلة جانبية من دون تغيير سياق الجلسة.
  </Card>
  <Card title="Steer" href="/ar/tools/steer" icon="compass">
    وجّه الوكيل في منتصف التشغيل باستخدام `/steer`.
  </Card>
</CardGroup>

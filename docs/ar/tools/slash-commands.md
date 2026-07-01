---
read_when:
    - استخدام أو تكوين أوامر الدردشة
    - تصحيح أخطاء توجيه الأوامر أو الأذونات
    - فهم كيفية تسجيل أوامر Skills
sidebarTitle: Slash commands
summary: جميع أوامر الشرطة المائلة والتوجيهات والاختصارات المضمنة المتاحة — التكوين والتوجيه والسلوك لكل سطح.
title: أوامر الشرطة المائلة
x-i18n:
    generated_at: "2026-07-01T20:23:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f9b74740baad038d667ccb8d80fc46af686111785b585ea1cb8cde13f41d98f
    source_path: tools/slash-commands.md
    workflow: 16
---

يتعامل Gateway مع الأوامر المرسلة كرسائل مستقلة تبدأ بـ `/`.
تستخدم أوامر bash الخاصة بالمضيف فقط الصيغة `! <cmd>` (مع `/bash <cmd>` كاسم مستعار).

عند ربط محادثة بجلسة ACP، يوجَّه النص العادي إلى حاضنة ACP. تبقى أوامر إدارة Gateway محلية: يصل `/acp ...` دائما إلى معالج أوامر OpenClaw، ويبقى `/status` و`/unfocus` محليين كلما كان التعامل مع الأوامر مفعلا للسطح.

## ثلاثة أنواع من الأوامر

<CardGroup cols={3}>
  <Card title="الأوامر" icon="terminal">
    رسائل `/...` مستقلة يتعامل معها Gateway. يجب أن تكون المحتوى الوحيد في الرسالة.
  </Card>
  <Card title="التوجيهات" icon="sliders">
    `/think`، `/fast`، `/verbose`، `/trace`، `/reasoning`، `/elevated`،
    `/exec`، `/model`، `/queue` — تزال من الرسالة قبل أن يراها النموذج.
    تحفظ إعدادات الجلسة عند إرسالها وحدها؛ وتعمل كتلميحات مضمنة عند إرسالها مع نص آخر.
  </Card>
  <Card title="اختصارات مضمنة" icon="bolt">
    `/help`، `/commands`، `/status`، `/whoami` — تعمل فورا وتزال قبل أن يرى النموذج النص المتبقي. للمرسلين المصرح لهم فقط.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="تفاصيل سلوك التوجيهات">
    - تزال التوجيهات من الرسالة قبل أن يراها النموذج.
    - في رسائل **التوجيهات فقط** (تكون الرسالة توجيهات فقط)، تحفظ في الجلسة وترد بإقرار.
    - في رسائل **الدردشة العادية** مع نص آخر، تعمل كتلميحات مضمنة ولا تحفظ إعدادات الجلسة.
    - تنطبق التوجيهات فقط على **المرسلين المصرح لهم**. إذا تم ضبط `commands.allowFrom`، فهو قائمة السماح الوحيدة المستخدمة؛ وإلا يأتي التفويض من قوائم سماح/اقتران القناة إضافة إلى `commands.useAccessGroups`. يرى المرسلون غير المصرح لهم التوجيهات كنص عادي.
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
  يفعّل تحليل `/...` في رسائل الدردشة. على الأسطح التي لا تحتوي على أوامر أصلية
  (WhatsApp، WebChat، Signal، iMessage، Google Chat، Microsoft Teams)، تعمل الأوامر النصية حتى عند ضبطه على `false`.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  يسجل الأوامر الأصلية. تلقائي: مفعّل لـ Discord/Telegram؛ معطل لـ Slack؛
  ومتجاهل للموفرين الذين لا يدعمون ذلك أصليا. يمكن تجاوزه لكل قناة باستخدام
  `channels.<provider>.commands.native`. في Discord، تؤدي `false` إلى تخطي تسجيل أوامر الشرطة المائلة؛ وقد تبقى الأوامر المسجلة سابقا مرئية حتى تزال.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  يسجل أوامر Skills أصليا عند دعم ذلك. تلقائي: مفعّل لـ
  Discord/Telegram؛ معطل لـ Slack. يمكن تجاوزه باستخدام
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  يفعّل `! <cmd>` لتشغيل أوامر صدفة المضيف (الاسم المستعار `/bash <cmd>`). يتطلب
  قوائم سماح `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  مدة انتظار bash قبل التحول إلى وضع الخلفية (`0` يضعه في الخلفية فورا).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  يفعّل `/config` (يقرأ/يكتب `openclaw.json`). للمالك فقط.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  يفعّل `/mcp` (يقرأ/يكتب إعداد MCP الذي يديره OpenClaw تحت `mcp.servers`). للمالك فقط.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  يفعّل `/plugins` (اكتشاف/حالة plugins إضافة إلى التثبيت + التفعيل/التعطيل). الكتابة للمالك فقط.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  يفعّل `/debug` (تجاوزات إعدادات وقت التشغيل فقط). للمالك فقط.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  يفعّل `/restart` وإجراءات أداة إعادة تشغيل Gateway.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  قائمة سماح صريحة للمالك لأسطح الأوامر الخاصة بالمالك فقط. منفصلة عن
  `commands.allowFrom` ووصول اقتران الرسائل المباشرة.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  لكل قناة: يتطلب هوية المالك للأوامر الخاصة بالمالك فقط. عند `true`،
  يجب أن يطابق المرسل `commands.ownerAllowFrom` أو يحمل نطاق `operator.admin`
  الداخلي. إدخال بدل شامل في `allowFrom` **ليس** كافيا.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  يتحكم في كيفية ظهور معرفات المالك في موجه النظام.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  سر HMAC المستخدم عند `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  قائمة سماح لكل موفر لتفويض الأوامر. عند ضبطها، تكون هي
  مصدر التفويض **الوحيد** للأوامر والتوجيهات. استخدم `"*"` لقيمة افتراضية
  عامة؛ وتتجاوزها المفاتيح الخاصة بالموفر.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  يفرض قوائم السماح/السياسات للأوامر عندما لا يكون `commands.allowFrom` مضبوطا.
</ParamField>

## قائمة الأوامر

تأتي الأوامر من ثلاثة مصادر:

- **الأوامر المضمنة في النواة:** `src/auto-reply/commands-registry.shared.ts`
- **أوامر dock المولدة:** `src/auto-reply/commands-registry.data.ts`
- **أوامر Plugin:** استدعاءات `registerCommand()` في plugin

يعتمد التوفر على أعلام الإعدادات، وسطح القناة، وplugins المثبتة/المفعلة.

### أوامر النواة

<AccordionGroup>
  <Accordion title="الجلسات والتشغيلات">
    | الأمر | الوصف |
    | --- | --- |
    | `/new [model]` | أرشف الجلسة الحالية وابدأ جلسة جديدة |
    | `/reset [soft [message]]` | أعد ضبط الجلسة الحالية في مكانها. يحافظ `soft` على النص، ويسقط معرفات جلسات واجهة CLI الخلفية المعاد استخدامها، ويعيد تشغيل بدء التشغيل |
    | `/name <title>` | سمّ الجلسة الحالية أو أعد تسميتها. احذف العنوان لرؤية الاسم الحالي واقتراح |
    | `/compact [instructions]` | اضغط سياق الجلسة. راجع [Compaction](/ar/concepts/compaction) |
    | `/stop` | أوقف التشغيل الحالي |
    | `/session idle <duration\|off>` | أدِر انتهاء الخمول لربط الخيط |
    | `/session max-age <duration\|off>` | أدِر انتهاء الحد الأقصى للعمر لربط الخيط |
    | `/export-session [path]` | صدّر الجلسة الحالية إلى HTML. الاسم المستعار: `/export` |
    | `/export-trajectory [path]` | صدّر حزمة مسار JSONL للجلسة الحالية. الاسم المستعار: `/trajectory` |

    <Note>
      تعترض واجهة التحكم أمر `/new` المكتوب لإنشاء جلسة لوحة معلومات جديدة والتبديل إليها،
      إلا عندما يكون `session.dmScope: "main"` مضبوطا
      ويكون الأصل الحالي هو الجلسة الرئيسية للوكيل — في هذه الحالة يعيد `/new`
      ضبط الجلسة الرئيسية في مكانها. لا يزال `/reset` المكتوب يشغّل إعادة الضبط
      الموضعية في Gateway. استخدم `/model default` عندما تريد مسح
      اختيار نموذج جلسة مثبت.
    </Note>

  </Accordion>

  <Accordion title="النموذج وعناصر التحكم في التشغيل">
    | الأمر | الوصف |
    | --- | --- |
    | `/think <level\|default>` | اضبط مستوى التفكير أو امسح تجاوز الجلسة. الأسماء المستعارة: `/thinking`، `/t` |
    | `/verbose on\|off\|full` | بدّل الإخراج المفصل. الاسم المستعار: `/v` |
    | `/trace on\|off` | بدّل إخراج تتبع plugin للجلسة الحالية |
    | `/fast [status\|auto\|on\|off\|default]` | اعرض وضع السرعة أو اضبطه أو امسحه |
    | `/reasoning [on\|off\|stream]` | بدّل ظهور الاستدلال. الاسم المستعار: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | بدّل الوضع المرفوع. الاسم المستعار: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | اعرض افتراضيات exec أو اضبطها |
    | `/login [codex\|openai\|openai-codex]` | اقرن تسجيل دخول Codex/OpenAI من دردشة خاصة أو جلسة واجهة ويب. للمالك/المسؤول فقط |
    | `/model [name\|#\|status]` | اعرض النموذج أو اضبطه |
    | `/models [provider] [page] [limit=<n>\|all]` | اسرد الموفرين أو النماذج المضبوطة/المتاحة بالمصادقة |
    | `/queue <mode>` | أدِر سلوك قائمة انتظار التشغيل النشط. راجع [قائمة الانتظار](/ar/concepts/queue) و[توجيه قائمة الانتظار](/ar/concepts/queue-steering) |
    | `/steer <message>` | أدخل إرشادا في التشغيل النشط. الاسم المستعار: `/tell`. راجع [التوجيه](/ar/tools/steer) |

    <AccordionGroup>
      <Accordion title="أمان verbose / trace / fast / reasoning">
        - يستخدم `/verbose` للتصحيح — أبقه **معطلا** في الاستخدام العادي.
        - يكشف `/trace` فقط أسطر التتبع/التصحيح المملوكة لـ plugin؛ ويبقى الكلام التفصيلي العادي معطلا.
        - يحفظ `/fast auto|on|off` تجاوزا للجلسة؛ استخدم خيار `inherit` في واجهة الجلسات لمسحه.
        - `/fast` خاص بالموفر: يربطه OpenAI/Codex بـ `service_tier=priority`؛ وتربطه طلبات Anthropic المباشرة بـ `service_tier=auto` أو `standard_only`.
        - `/reasoning` و`/verbose` و`/trace` محفوفة بالمخاطر في إعدادات المجموعات — فقد تكشف الاستدلال الداخلي أو تشخيصات plugin. أبقها معطلة في محادثات المجموعات.

      </Accordion>
      <Accordion title="تفاصيل تبديل النموذج">
        - يحفظ `/model` النموذج الجديد فورا في الجلسة.
        - إذا كان الوكيل خاملا، يستخدمه التشغيل التالي مباشرة.
        - إذا كان هناك تشغيل نشط، يوضع التبديل كقيد الانتظار ويطبق عند نقطة إعادة المحاولة النظيفة التالية.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="الاكتشاف والحالة">
    | الأمر | الوصف |
    | --- | --- |
    | `/help` | اعرض ملخص المساعدة القصير |
    | `/commands` | اعرض كتالوج الأوامر المولد |
    | `/tools [compact\|verbose]` | اعرض ما يمكن للوكيل الحالي استخدامه الآن |
    | `/status` | اعرض حالة التنفيذ/وقت التشغيل، وزمن تشغيل Gateway والنظام، وصحة plugin، إضافة إلى استخدام/حصة الموفر |
    | `/status plugins` | اعرض صحة plugin بالتفصيل: أخطاء التحميل، العزل، فشل القنوات، مشكلات الاعتماديات، إشعارات التوافق |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | أدِر [هدف](/ar/tools/goal) الجلسة الحالية الدائم |
    | `/diagnostics [note]` | تدفق تقرير دعم للمالك فقط. يطلب موافقة exec كل مرة |
    | `/crestodian <request>` | شغّل مساعد إعداد وإصلاح Crestodian من رسالة مباشرة للمالك |
    | `/tasks` | اسرد المهام الخلفية النشطة/الأخيرة للجلسة الحالية |
    | `/context [list\|detail\|map\|json]` | اشرح كيفية تجميع السياق |
    | `/whoami` | اعرض معرف المرسل الخاص بك. الاسم المستعار: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | تحكم في تذييل الاستخدام لكل استجابة (`reset`/`inherit`/`clear`/`default` يمسح تجاوز الجلسة لإعادة وراثة الافتراضي المضبوط) أو اطبع ملخص تكلفة محليا |
  </Accordion>

  <Accordion title="Skills، قوائم السماح، الموافقات">
    | الأمر | الوصف |
    | --- | --- |
    | `/skill <name> [input]` | شغّل Skill بالاسم |
    | `/allowlist [list\|add\|remove] ...` | أدِر إدخالات قائمة السماح. نص فقط |
    | `/approve <id> <decision>` | حل مطالبات موافقة exec أو plugin |
    | `/btw <question>` | اطرح سؤالا جانبيا دون تغيير سياق الجلسة. الاسم المستعار: `/side`. راجع [بالمناسبة](/ar/tools/btw) |
  </Accordion>

  <Accordion title="الوكلاء الفرعيون وACP">
    | الأمر | الوصف |
    | --- | --- |
    | `/subagents list\|log\|info` | فحص تشغيلات الوكلاء الفرعيين للجلسة الحالية |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | إدارة جلسات ACP وخيارات وقت التشغيل. تتطلب عناصر التحكم في وقت التشغيل مالكًا خارجيًا أو هوية مسؤول Gateway داخلية |
    | `/focus <target>` | ربط سلسلة Discord الحالية أو موضوع Telegram بهدف جلسة |
    | `/unfocus` | إزالة ربط السلسلة الحالية |
    | `/agents` | سرد الوكلاء المرتبطين بالسلاسل للجلسة الحالية |
  </Accordion>

  <Accordion title="الكتابات الخاصة بالمالك فقط والإدارة">
    | الأمر | يتطلب | الوصف |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | قراءة `openclaw.json` أو الكتابة إليه. للمالك فقط |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | قراءة إعدادات خادم MCP المُدارة بواسطة OpenClaw أو الكتابة إليها. للمالك فقط |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | فحص حالة Plugin أو تعديلها. الكتابات للمالك فقط. الاسم المستعار: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | تجاوزات إعدادات وقت التشغيل فقط. للمالك فقط |
    | `/restart` | `commands.restart: true` (افتراضي) | إعادة تشغيل OpenClaw |
    | `/send on\|off\|inherit` | المالك | تعيين سياسة الإرسال |
  </Accordion>

  <Accordion title="الصوت، TTS، التحكم في القناة">
    | الأمر | الوصف |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | التحكم في TTS. راجع [TTS](/ar/tools/tts) |
    | `/activation mention\|always` | تعيين وضع تفعيل المجموعة |
    | `/bash <command>` | تشغيل أمر صدفة على المضيف. الاسم المستعار: `! <command>`. يتطلب `commands.bash: true` |
    | `!poll [sessionId]` | التحقق من مهمة bash في الخلفية |
    | `!stop [sessionId]` | إيقاف مهمة bash في الخلفية |
  </Accordion>
</AccordionGroup>

### أوامر Dock

تبدّل أوامر Dock مسار رد الجلسة النشطة إلى قناة مرتبطة أخرى.
راجع [إرساء القنوات](/ar/concepts/channel-docking) للإعداد واستكشاف الأخطاء وإصلاحها.

مُولّدة من Plugins القنوات التي تدعم الأوامر الأصلية:

- `/dock-discord` (الاسم المستعار: `/dock_discord`)
- `/dock-mattermost` (الاسم المستعار: `/dock_mattermost`)
- `/dock-slack` (الاسم المستعار: `/dock_slack`)
- `/dock-telegram` (الاسم المستعار: `/dock_telegram`)

تتطلب أوامر Dock وجود `session.identityLinks`. يجب أن يكون المرسل المصدر والنظير الهدف
ضمن مجموعة الهوية نفسها.

### أوامر Plugin المضمّنة

| الأمر                                                                                      | الوصف                                                                         |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | تبديل Dreaming للذاكرة (المالك أو مسؤول Gateway). راجع [Dreaming](/ar/concepts/dreaming) |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | إدارة إقران الأجهزة. راجع [الإقران](/ar/channels/pairing)                             |
| `/phone status\|arm ...\|disarm`                                                             | تسليح أوامر عقدة الهاتف عالية الخطورة مؤقتًا                                       |
| `/voice status\|list\|set <voiceId>`                                                         | إدارة إعداد صوت Talk. الاسم الأصلي في Discord: `/talkvoice`                         |
| `/card ...`                                                                                  | إرسال إعدادات بطاقات LINE الغنية المسبقة. راجع [LINE](/ar/channels/line)                             |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | التحكم في حاضنة خادم تطبيق Codex. راجع [حاضنة Codex](/ar/plugins/codex-harness)   |

خاص بـ QQBot فقط: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### أوامر Skill

تُعرض Skills التي يمكن للمستخدم استدعاؤها كأوامر بشرطة مائلة:

- يعمل `/skill <name> [input]` دائمًا كنقطة دخول عامة.
- قد تُسجّل Skills كأوامر مباشرة (مثل `/prose` لـ OpenProse).
- يتحكم `commands.nativeSkills` و
  `channels.<provider>.commands.nativeSkills` في تسجيل أوامر Skills الأصلية.
- تُنظَّف الأسماء إلى `a-z0-9_` (بحد أقصى 32 حرفًا)؛ وتحصل التصادمات على لاحقات رقمية.

<AccordionGroup>
  <Accordion title="توجيه أمر Skill">
    افتراضيًا، تُوجَّه أوامر Skills إلى النموذج كطلب عادي.

    يمكن لـ Skills إعلان `command-dispatch: tool` للتوجيه مباشرة إلى أداة
    (حتمي، دون تدخل النموذج). مثال: `/prose` (Plugin OpenProse)
    — راجع [OpenProse](/ar/prose).

  </Accordion>
  <Accordion title="وسائط الأوامر الأصلية">
    يستخدم Discord الإكمال التلقائي للخيارات الديناميكية وقوائم الأزرار عند حذف
    الوسائط المطلوبة. يعرض Telegram وSlack قائمة أزرار للأوامر ذات
    الاختيارات. تُحل الاختيارات الديناميكية مقابل نموذج الجلسة الهدف، لذا تتبع الخيارات
    الخاصة بالنموذج مثل مستويات `/think` تجاوز `/model` الخاص بالجلسة.
  </Accordion>
</AccordionGroup>

## `/tools` — ما يمكن للوكيل استخدامه الآن

يجيب `/tools` عن سؤال وقت التشغيل: **ما الذي يمكن لهذا الوكيل استخدامه الآن في هذه
المحادثة** — وليس كتالوج إعدادات ثابتًا.

```text
/tools         # compact view
/tools verbose # with short descriptions
```

تكون النتائج محددة بنطاق الجلسة. قد يؤدي تغيير الوكيل أو القناة أو السلسلة أو تفويض
المرسل أو النموذج إلى تغيير المخرجات. لتحرير الملفات الشخصية والتجاوزات،
استخدم لوحة Tools في واجهة التحكم أو أسطح الإعدادات.

## `/model` — اختيار النموذج

```text
/model             # show model picker
/model list        # same
/model 3           # select by number from picker
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # clear the session model selection
/model status      # detailed view with endpoint and API mode
```

على Discord، يفتح `/model` و`/models` منتقيًا تفاعليًا مع قوائم منسدلة للمزوّد و
النموذج. يحترم المنتقي `agents.defaults.models`، بما في ذلك
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

تُتحقق الإعدادات قبل الكتابة. تُرفض التغييرات غير الصالحة. تستمر تحديثات `/config`
بعد إعادة التشغيل.

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

يخزّن `/mcp` الإعدادات في إعدادات OpenClaw، وليس في إعدادات مشروع الوكيل المضمّن.

## `/debug` — تجاوزات وقت التشغيل فقط

<Note>
  للمالك فقط. معطّل افتراضيًا — فعّله باستخدام `commands.debug: true`.
  تنطبق التجاوزات فورًا على قراءات الإعدادات الجديدة لكنها **لا** تكتب إلى القرص.
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
  الكتابة للمالك فقط. معطّل افتراضيًا — فعّله باستخدام `commands.plugins: true`.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

يحدّث `/plugins enable|disable` إعدادات Plugin ويعيد تحميل وقت تشغيل Plugin في Gateway
مباشرةً لدورات الوكيل الجديدة. يعيد `/plugins install` تشغيل Gateways المُدارة
تلقائيًا لأن وحدات مصدر Plugin تغيّرت.

## `/trace` — مخرجات تتبع Plugin

```text
/trace          # show current trace state
/trace on
/trace off
```

يكشف `/trace` أسطر تتبع/تصحيح Plugin المحددة بنطاق الجلسة دون وضع الإسهاب الكامل.
ولا يحل محل `/debug` (تجاوزات وقت التشغيل) أو `/verbose` (مخرجات
الأدوات العادية).

## `/btw` — أسئلة جانبية

`/btw` سؤال جانبي سريع حول سياق الجلسة الحالية. الاسم المستعار: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

بخلاف الرسالة العادية:

- يستخدم الجلسة الحالية كسياق خلفية.
- في جلسات حاضنة Codex، يعمل كسلسلة جانبية مؤقتة في Codex.
- **لا** يغير سياق الجلسة المستقبلي.
- لا يُكتب في سجل النصوص.

راجع [أسئلة BTW الجانبية](/ar/tools/btw) للاطلاع على السلوك الكامل.

## ملاحظات السطح

<AccordionGroup>
  <Accordion title="نطاق الجلسة لكل سطح">
    - **الأوامر النصية:** تعمل في جلسة الدردشة العادية (تشترك الرسائل الخاصة في `main`، وللمجموعات جلساتها الخاصة).
    - **أوامر Discord الأصلية:** `agent:<agentId>:discord:slash:<userId>`
    - **أوامر Slack الأصلية:** `agent:<agentId>:slack:slash:<userId>` (يمكن ضبط البادئة عبر `channels.slack.slashCommand.sessionPrefix`)
    - **أوامر Telegram الأصلية:** `telegram:slash:<userId>` (تستهدف جلسة الدردشة عبر `CommandTargetSessionKey`)
    - **`/login codex`** يرسل رموز إقران الأجهزة فقط عبر الدردشة الخاصة أو مسارات استجابة واجهة الويب. تطلب استدعاءات مجموعات/مواضيع Telegram من المالك مراسلة البوت مباشرة بدلًا من ذلك.
    - **`/stop`** يستهدف جلسة الدردشة النشطة لإجهاض التشغيل الحالي.

  </Accordion>
  <Accordion title="تفاصيل Slack">
    يدعم `channels.slack.slashCommand` أمرًا واحدًا على نمط `/openclaw`.
    مع `commands.native: true`، أنشئ أمر Slack بشرطة مائلة واحدًا لكل أمر
    مضمّن. سجّل `/agentstatus` (وليس `/status`) لأن Slack يحجز
    `/status`. لا يزال نص `/status` يعمل في رسائل Slack.
  </Accordion>
  <Accordion title="المسار السريع والاختصارات المضمنة">
    - تُعالَج الرسائل التي تحتوي على أوامر فقط من المرسلين المدرجين في قائمة السماح فورًا (تجاوز الطابور + النموذج).
    - تعمل الاختصارات المضمنة (`/help`, `/commands`, `/status`, `/whoami`) أيضًا داخل الرسائل العادية وتُزال قبل أن يرى النموذج النص المتبقي.
    - تُتجاهل الرسائل غير المصرح بها التي تحتوي على أوامر فقط بصمت؛ وتُعامل رموز `/...` المضمنة كنص عادي.

  </Accordion>
  <Accordion title="ملاحظات الوسائط">
    - تقبل الأوامر `:` اختياريًا بين الأمر والوسائط (`/think: high`, `/send: on`).
    - يقبل `/new <model>` اسمًا مستعارًا للنموذج، أو `provider/model`، أو اسم مزوّد (مطابقة تقريبية)؛ وإذا لم توجد مطابقة، فيُعامل النص كمتن الرسالة.
    - يتطلب `/allowlist add|remove` وجود `commands.config: true` ويحترم `configWrites` الخاصة بالقناة.

  </Accordion>
</AccordionGroup>

## استخدام المزوّد والحالة

- يظهر **استخدام/حصة المزوّد** (مثل "Claude 80% left") في `/status` لمزوّد النموذج الحالي عند تفعيل تتبع الاستخدام.
- يمكن أن تعود **أسطر الرموز/ذاكرة التخزين المؤقت** في `/status` إلى أحدث إدخال استخدام في سجل النصوص عندما تكون لقطة الجلسة المباشرة قليلة التفاصيل.
- **التنفيذ مقابل وقت التشغيل:** يبلّغ `/status` عن `Execution` لمسار sandbox الفعلي و`Runtime` لمن يشغّل الجلسة: `OpenClaw Default` أو `OpenAI Codex` أو خلفية CLI أو خلفية ACP.
- **الرموز/التكلفة لكل رد:** يتحكم بها `/usage off|tokens|full`.
- يتعلق `/model status` بالنماذج/المصادقة/نقاط النهاية، وليس الاستخدام.

## ذو صلة

<CardGroup cols={2}>
  <Card title="Skills" href="/ar/tools/skills" icon="puzzle-piece">
    كيفية تسجيل أوامر Skills بشرطة مائلة والتحكم في إتاحتها.
  </Card>
  <Card title="إنشاء Skills" href="/ar/tools/creating-skills" icon="hammer">
    أنشئ Skill تسجّل أمرها الخاص بشرطة مائلة.
  </Card>
  <Card title="BTW" href="/ar/tools/btw" icon="comments">
    أسئلة جانبية دون تغيير سياق الجلسة.
  </Card>
  <Card title="التوجيه" href="/ar/tools/steer" icon="compass">
    وجّه الوكيل أثناء التشغيل باستخدام `/steer`.
  </Card>
</CardGroup>

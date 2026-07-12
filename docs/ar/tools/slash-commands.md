---
read_when:
    - استخدام أو تكوين أوامر الدردشة
    - تصحيح أخطاء توجيه الأوامر أو الأذونات
    - فهم كيفية تسجيل أوامر Skills
sidebarTitle: Slash commands
summary: جميع أوامر الشرطة المائلة والتوجيهات والاختصارات المضمنة المتاحة — الإعداد والتوجيه والسلوك الخاص بكل واجهة.
title: أوامر الشرطة المائلة
x-i18n:
    generated_at: "2026-07-12T06:44:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0017f229610ff5b1f4ff4a11a77814575835cfd07c7d4dbcce8b0d51ed4f4dd1
    source_path: tools/slash-commands.md
    workflow: 16
---

يتولى Gateway معالجة الأوامر المُرسلة كرسائل مستقلة تبدأ بـ `/`.
تستخدم أوامر bash الخاصة بالمضيف الصيغة `! <cmd>` (مع `/bash <cmd>` كاسم مستعار).

عندما تكون محادثة مرتبطة بجلسة ACP، يُوجَّه النص العادي إلى أداة ACP
التنسيقية. تظل أوامر إدارة Gateway محلية: يصل `/acp ...` دائمًا إلى
معالج أوامر OpenClaw، ويظل `/status` مع `/unfocus` محليين متى كانت
معالجة الأوامر مفعّلة للواجهة.

## ثلاثة أنواع من الأوامر

<CardGroup cols={3}>
  <Card title="الأوامر" icon="terminal">
    رسائل `/...` مستقلة يعالجها Gateway. يجب إرسالها بوصفها
    المحتوى الوحيد في الرسالة.
  </Card>
  <Card title="التوجيهات" icon="sliders">
    `/think` و`/fast` و`/verbose` و`/trace` و`/reasoning` و`/elevated`
    و`/exec` و`/model` و`/queue` — تُزال من الرسالة قبل أن
    يراها النموذج. تحتفظ بإعدادات الجلسة عند إرسالها وحدها؛ وتعمل كتلميحات
    مضمّنة عند إرسالها مع نص آخر.
  </Card>
  <Card title="الاختصارات المضمّنة" icon="bolt">
    `/help` و`/commands` و`/status` و`/whoami` — تُنفَّذ فورًا
    وتُزال قبل أن يرى النموذج النص المتبقي. للمرسلين المخوّلين فقط.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="تفاصيل سلوك التوجيهات">
    - تُزال التوجيهات من الرسالة قبل أن يراها النموذج.
    - في الرسائل التي تحتوي على **توجيهات فقط** (أي لا تحتوي الرسالة إلا على توجيهات)،
      تُحفَظ في الجلسة ويُرد عليها بإقرار.
    - في رسائل **الدردشة العادية** التي تحتوي على نص آخر، تعمل كتلميحات مضمّنة
      ولا تحتفظ **بإعدادات الجلسة**.
    - لا تنطبق التوجيهات إلا على **المرسلين المخوّلين**. إذا ضُبط `commands.allowFrom`،
      فتكون هذه قائمة السماح الوحيدة المستخدمة؛ وإلا فيأتي التخويل من
      قوائم السماح للقناة/الاقتران بالإضافة إلى `commands.useAccessGroups`. تُعامَل
      التوجيهات للمرسلين غير المخوّلين كنص عادي.
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
  يفعّل تحليل `/...` في رسائل الدردشة. على الواجهات التي لا تتضمن أوامر أصلية
  (WhatsApp وWebChat وSignal وiMessage وGoogle Chat وMicrosoft Teams)، تعمل الأوامر
  النصية حتى عند ضبطه على `false`.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  يسجّل الأوامر الأصلية. الوضع التلقائي: مفعّل في Discord/Telegram؛ ومعطّل في Slack؛
  ويُتجاهل لموفّري الخدمة الذين لا يدعمون الأوامر الأصلية. يمكن تجاوزه لكل قناة باستخدام
  `channels.<provider>.commands.native`. في Discord، يؤدي `false` إلى تخطي تسجيل
  أوامر الشرطة المائلة؛ وقد تظل الأوامر المسجلة سابقًا ظاهرة حتى تُزال.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  يسجّل أوامر Skills بوصفها أوامر أصلية عند دعم ذلك. الوضع التلقائي: مفعّل في
  Discord/Telegram؛ ومعطّل في Slack. يمكن تجاوزه باستخدام
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  يفعّل `! <cmd>` لتشغيل أوامر صدفة المضيف (مع `/bash <cmd>` كاسم مستعار). يتطلب
  قوائم السماح في `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  مدة انتظار bash قبل الانتقال إلى وضع الخلفية (تؤدي القيمة `0` إلى الانتقال
  إلى الخلفية فورًا).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  يفعّل `/config` (لقراءة/كتابة `openclaw.json`). للمالك فقط.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  يفعّل `/mcp` (لقراءة/كتابة إعداد MCP الذي يديره OpenClaw ضمن `mcp.servers`). للمالك فقط.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  يفعّل `/plugins` (اكتشاف Plugin/حالته، بالإضافة إلى التثبيت والتفعيل/التعطيل). الكتابة للمالك فقط.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  يفعّل `/debug` (تجاوزات الإعداد وقت التشغيل فقط). للمالك فقط.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  يفعّل `/restart` وإجراءات أداة إعادة تشغيل Gateway.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  قائمة سماح صريحة للمالك لواجهات الأوامر المخصصة للمالك فقط. وهي منفصلة عن
  `commands.allowFrom` وإمكانية الوصول عبر اقتران الرسائل المباشرة.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  لكل قناة: يشترط هوية المالك للأوامر المخصصة للمالك فقط. عندما تكون القيمة `true`،
  يجب أن يطابق المرسل `commands.ownerAllowFrom` أو يمتلك نطاق `operator.admin`
  الداخلي. ولا يكفي إدخال حرف بدل في `allowFrom`.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  يتحكم في كيفية ظهور معرّفات المالك في موجّه النظام.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  سر HMAC المستخدم عندما تكون قيمة `commands.ownerDisplay` هي `"hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  قائمة سماح لكل موفّر لتخويل الأوامر. عند ضبطها، تصبح مصدر التخويل
  **الوحيد** للأوامر والتوجيهات. استخدم `"*"` كقيمة افتراضية عامة؛ وتتجاوزها
  المفاتيح الخاصة بالموفّرين.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  يفرض قوائم السماح/السياسات على الأوامر عندما لا تكون `commands.allowFrom` مضبوطة.
</ParamField>

## قائمة الأوامر

تأتي الأوامر من ثلاثة مصادر:

- **الأوامر الأساسية المضمّنة:** `src/auto-reply/commands-registry.shared.ts`
- **أوامر dock المُنشأة:** `src/auto-reply/commands-registry.data.ts`
- **أوامر Plugin:** استدعاءات `registerCommand()` الخاصة بالـ plugin

يعتمد التوفّر على علامات الإعداد، وواجهة القناة، والـ plugins المثبّتة/المفعّلة.

### الأوامر الأساسية

<AccordionGroup>
  <Accordion title="الجلسات وعمليات التشغيل">
    | الأمر | الوصف |
    | --- | --- |
    | `/new [model]` | أرشفة الجلسة الحالية وبدء جلسة جديدة |
    | `/reset [soft [message]]` | إعادة ضبط الجلسة الحالية في موضعها. يحافظ `soft` على سجل المحادثة، ويتخلص من معرّفات جلسات الواجهة الخلفية لـ CLI المعاد استخدامها، ويعيد تشغيل التهيئة |
    | `/name <title>` | تسمية الجلسة الحالية أو إعادة تسميتها. احذف العنوان لرؤية الاسم الحالي واقتراح |
    | `/compact [instructions]` | ضغط سياق الجلسة. راجع [Compaction](/ar/concepts/compaction) |
    | `/stop` | إلغاء عملية التشغيل الحالية |
    | `/session idle <duration\|off>` | إدارة انتهاء صلاحية ربط الخيط بسبب الخمول |
    | `/session max-age <duration\|off>` | إدارة انتهاء صلاحية ربط الخيط بسبب الحد الأقصى للعمر |
    | `/export-session [path]` | تصدير الجلسة الحالية إلى HTML. الاسم البديل: `/export` |
    | `/export-trajectory [path]` | تصدير حزمة مسار JSONL للجلسة الحالية. الاسم البديل: `/trajectory` |

    <Note>
      تعترض واجهة التحكم الأمر `/new` المكتوب لإنشاء جلسة لوحة معلومات جديدة
      والتبديل إليها، إلا عند ضبط `session.dmScope: "main"` وكون الأصل الحالي
      هو الجلسة الرئيسية للوكيل — ففي هذه الحالة يعيد `/new` ضبط الجلسة الرئيسية
      في موضعها. يظل `/reset` المكتوب يشغّل إعادة الضبط الموضعية في Gateway.
      استخدم `/model default` عندما تريد مسح اختيار نموذج مثبّت للجلسة.
    </Note>

  </Accordion>

  <Accordion title="عناصر التحكم في النموذج والتشغيل">
    | الأمر | الوصف |
    | --- | --- |
    | `/think <level\|default>` | تعيين مستوى التفكير أو مسح تجاوز الجلسة. الأسماء البديلة: `/thinking`، `/t` |
    | `/verbose on\|off\|full` | تبديل الإخراج المطوّل. الاسم البديل: `/v` |
    | `/trace on\|off` | تبديل إخراج تتبّع الـ plugin للجلسة الحالية |
    | `/fast [status\|auto\|on\|off\|default]` | عرض الوضع السريع أو تعيينه أو مسحه |
    | `/reasoning [on\|off\|stream]` | تبديل ظهور الاستدلال. الاسم البديل: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | تبديل الوضع ذي الصلاحيات المرتفعة. الاسم البديل: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | عرض الإعدادات الافتراضية للتنفيذ أو تعيينها |
    | `/login [codex\|openai\|openai-codex]` | إقران تسجيل دخول Codex/OpenAI من محادثة خاصة أو جلسة واجهة الويب. للمالك/المسؤول فقط |
    | `/model [name\|#\|status]` | عرض النموذج أو تعيينه |
    | `/models [provider] [page] [limit=<n>\|all]` | سرد الموفّرين أو النماذج المضبوطة/المتاحة بالمصادقة |
    | `/queue <mode>` | إدارة سلوك قائمة انتظار التشغيل النشط. راجع [قائمة الانتظار](/ar/concepts/queue) و[توجيه قائمة الانتظار](/ar/concepts/queue-steering) |
    | `/steer <message>` | حقن إرشادات في عملية التشغيل النشطة. الاسم البديل: `/tell`. راجع [التوجيه](/ar/tools/steer) |

    <AccordionGroup>
      <Accordion title="سلامة الإخراج المطوّل / التتبّع / الوضع السريع / الاستدلال">
        - يُستخدم `/verbose` لتصحيح الأخطاء — أبقه **معطّلًا** في الاستخدام العادي.
        - يكشف `/trace` فقط أسطر التتبّع/تصحيح الأخطاء التي يملكها الـ plugin؛ وتظل الرسائل المطوّلة العادية معطّلة.
        - يحفظ `/fast auto|on|off` تجاوزًا للجلسة؛ استخدم خيار `inherit` في واجهة الجلسات لمسحه.
        - يعتمد `/fast` على الموفّر: يربطه OpenAI/Codex بـ `service_tier=priority`؛ بينما تربطه طلبات Anthropic المباشرة بـ `service_tier=auto` أو `standard_only`.
        - تشكّل `/reasoning` و`/verbose` و`/trace` مخاطرة في إعدادات المجموعات — فقد تكشف الاستدلال الداخلي أو تشخيصات الـ plugin. أبقها معطّلة في المحادثات الجماعية.

      </Accordion>
      <Accordion title="تفاصيل تبديل النموذج">
        - يحفظ `/model` النموذج الجديد فورًا في الجلسة.
        - إذا كان الوكيل خاملًا، تستخدمه عملية التشغيل التالية فورًا.
        - إذا كانت هناك عملية تشغيل نشطة، يُعلّم التبديل بأنه معلّق ويُطبّق عند نقطة إعادة المحاولة النظيفة التالية.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="الاكتشاف والحالة">
    | الأمر | الوصف |
    | --- | --- |
    | `/help` | عرض ملخص المساعدة المختصر |
    | `/commands` | عرض دليل الأوامر المُنشأ |
    | `/tools [compact\|verbose]` | عرض ما يمكن للوكيل الحالي استخدامه الآن |
    | `/status` | عرض حالة التنفيذ/وقت التشغيل، ومدة تشغيل Gateway والنظام، وسلامة الـ plugin، بالإضافة إلى استخدام الموفّر/الحصة |
    | `/status plugins` | عرض تفاصيل سلامة الـ plugin: أخطاء التحميل، والعزل، وإخفاقات plugins القنوات، ومشكلات التبعيات، وإشعارات التوافق. يتطلب `commands.plugins: true` |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | إدارة [الهدف](/ar/tools/goal) الدائم للجلسة الحالية |
    | `/diagnostics [note]` | مسار تقرير دعم للمالك فقط. يطلب الموافقة على التنفيذ في كل مرة |
    | `/crestodian <request>` | تشغيل مساعد إعداد Crestodian وإصلاحه من رسالة مباشرة للمالك |
    | `/tasks` | سرد المهام الخلفية النشطة/الحديثة للجلسة الحالية |
    | `/context [list\|detail\|map\|json]` | شرح كيفية تجميع السياق |
    | `/whoami` | عرض معرّف المُرسل الخاص بك. الاسم البديل: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | التحكم في تذييل الاستخدام لكل استجابة (`reset`/`inherit`/`clear`/`default` يمسح تجاوز الجلسة لإعادة وراثة القيمة الافتراضية المضبوطة) أو طباعة ملخص محلي للتكلفة |
  </Accordion>

  <Accordion title="Skills وقوائم السماح والموافقات">
    | الأمر | الوصف |
    | --- | --- |
    | `/skill <name> [input]` | تشغيل Skill بالاسم |
    | `/learn [request]` | صياغة Skill واحدة قابلة للمراجعة من المحادثة الحالية أو المصادر المسماة من خلال [ورشة Skills](/ar/tools/skill-workshop) |
    | `/allowlist [list\|add\|remove] ...` | إدارة إدخالات قائمة السماح. نص فقط |
    | `/approve <id> <decision>` | معالجة مطالبات الموافقة على التنفيذ أو الـ plugin |
    | `/btw <question>` | طرح سؤال جانبي دون تغيير سياق الجلسة. الاسم البديل: `/side`. راجع [بالمناسبة](/ar/tools/btw) |
  </Accordion>

  <Accordion title="الوكلاء الفرعيون وACP">
    | الأمر | الوصف |
    | --- | --- |
    | `/subagents list\|log\|info` | فحص عمليات تشغيل الوكلاء الفرعيين للجلسة الحالية |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | إدارة جلسات ACP وخيارات وقت التشغيل. تتطلب عناصر التحكم في وقت التشغيل هوية مالك خارجي أو مسؤول Gateway داخلي |
    | `/focus <target>` | ربط سلسلة Discord الحالية أو موضوع Telegram بهدف جلسة |
    | `/unfocus` | إزالة ربط السلسلة الحالي |
    | `/agents` | سرد الوكلاء المرتبطين بالسلسلة للجلسة الحالية |
  </Accordion>

  <Accordion title="عمليات الكتابة والمسؤول المقصورة على المالك">
    | الأمر | المتطلبات | الوصف |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | قراءة `openclaw.json` أو الكتابة إليه. للمالك فقط |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | قراءة إعداد خادم MCP المُدار بواسطة OpenClaw أو الكتابة إليه. للمالك فقط |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | فحص حالة Plugin أو تعديلها. الكتابة للمالك فقط. الاسم البديل: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | تجاوزات الإعداد لوقت التشغيل فقط. للمالك فقط |
    | `/restart` | `commands.restart: true` (افتراضيًا) | إعادة تشغيل OpenClaw |
    | `/send on\|off\|inherit` | المالك | تعيين سياسة الإرسال |
  </Accordion>

  <Accordion title="الصوت وتحويل النص إلى كلام والتحكم في القناة">
    | الأمر | الوصف |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | التحكم في تحويل النص إلى كلام. راجع [تحويل النص إلى كلام](/ar/tools/tts) |
    | `/activation mention\|always` | تعيين وضع تنشيط المجموعة |
    | `/bash <command>` | تشغيل أمر صدفة على المضيف. الاسم البديل: `! <command>`. يتطلب `commands.bash: true` |
    | `!poll [sessionId]` | التحقق من مهمة bash تعمل في الخلفية |
    | `!stop [sessionId]` | إيقاف مهمة bash تعمل في الخلفية |
  </Accordion>
</AccordionGroup>

### أوامر الإرساء

تُبدّل أوامر الإرساء مسار رد الجلسة النشطة إلى قناة أخرى مرتبطة.
راجع [إرساء القنوات](/ar/concepts/channel-docking) لمعرفة الإعداد واستكشاف الأخطاء وإصلاحها.

تُنشأ من Plugins القنوات التي تدعم الأوامر الأصلية:

- `/dock-discord` (الاسم البديل: `/dock_discord`)
- `/dock-mattermost` (الاسم البديل: `/dock_mattermost`)
- `/dock-slack` (الاسم البديل: `/dock_slack`)
- `/dock-telegram` (الاسم البديل: `/dock_telegram`)

تتطلب أوامر الإرساء `session.identityLinks`. يجب أن يكون المرسِل المصدر والنظير
المستهدف ضمن مجموعة الهوية نفسها.

### أوامر Plugins المضمّنة

| الأمر                                                   | الوصف                                                                                                                                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | تبديل Dreaming للذاكرة (المالك أو مسؤول Gateway). راجع [Dreaming](/ar/concepts/dreaming)                                                                                                                        |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | إدارة إقران الأجهزة. راجع [الإقران](/ar/channels/pairing)                                                                                                                                                        |
| `/phone status\|arm ...\|disarm`                        | تمكين أوامر Node عالية المخاطر مؤقتًا (الكاميرا/الشاشة/الحاسوب/الكتابة). راجع [استخدام الحاسوب](/ar/nodes/computer-use)                                                                                         |
| `/voice status\|list\|set <voiceId>`                    | إدارة إعداد صوت Talk. الاسم الأصلي في Discord: `/talkvoice`                                                                                                                                                   |
| `/card ...`                                             | إرسال إعدادات مسبقة لبطاقات LINE الغنية. راجع [LINE](/ar/channels/line)                                                                                                                                          |
| `/codex <action> ...`                                   | ربط أداة خادم تطبيق Codex وتوجيهها وفحصها (الحالة، والسلاسل، والاستئناف، والنموذج، والوضع السريع، والأذونات، والضغط، والمراجعة، وMCP، وSkills، والمزيد). راجع [أداة Codex](/ar/plugins/codex-harness) |

خاص بـ QQBot فقط: `/bot-ping`، و`/bot-version`، و`/bot-help`، و`/bot-upgrade`، و`/bot-logs`

### أوامر Skills

تُعرض Skills التي يمكن للمستخدم استدعاؤها كأوامر شرطة مائلة:

- يعمل `/skill <name> [input]` دائمًا كنقطة دخول عامة.
- يمكن لـ Skills التسجيل كأوامر مباشرة (مثل `/prose` لـ OpenProse).
- يتحكم `commands.nativeSkills` و
  `channels.<provider>.commands.nativeSkills` في تسجيل أوامر Skills الأصلية.
- تُنقّى الأسماء إلى `a-z0-9_` (بحد أقصى 32 محرفًا)؛ وتحصل التعارضات على لواحق رقمية.

<AccordionGroup>
  <Accordion title="توجيه أوامر Skills">
    تُوجّه أوامر Skills افتراضيًا إلى النموذج كطلب عادي.

    يمكن لـ Skills التصريح بـ `command-dispatch: tool` للتوجيه مباشرةً إلى أداة
    (بصورة حتمية، من دون تدخل النموذج). مثال: `/prose` (Plugin ‏OpenProse)
    — راجع [OpenProse](/ar/prose).

  </Accordion>
  <Accordion title="وسائط الأوامر الأصلية">
    يستخدم Discord الإكمال التلقائي للخيارات الديناميكية وقوائم الأزرار عند حذف
    الوسائط المطلوبة. يعرض Telegram وSlack قائمة أزرار للأوامر التي تتضمن
    خيارات. تُحلّ الخيارات الديناميكية وفق نموذج الجلسة المستهدفة، لذلك تتبع
    الخيارات الخاصة بالنموذج، مثل مستويات `/think`، تجاوز `/model` للجلسة.
  </Accordion>
</AccordionGroup>

## `/tools`: ما يمكن للوكيل استخدامه الآن

يجيب `/tools` عن سؤال متعلق بوقت التشغيل: **ما الذي يمكن لهذا الوكيل استخدامه الآن في هذه
المحادثة** — وليس كتالوج إعداد ثابتًا.

```text
/tools         # عرض موجز
/tools verbose # مع أوصاف قصيرة
```

تقتصر النتائج على نطاق الجلسة. قد يؤدي تغيير الوكيل أو القناة أو السلسلة أو تخويل
المرسِل أو النموذج إلى تغيير المخرجات. لتحرير ملف التعريف والتجاوزات،
استخدم لوحة الأدوات في واجهة التحكم أو واجهات الإعداد.

## `/model`: اختيار النموذج

```text
/model             # عرض منتقي النماذج
/model list        # الأمر نفسه
/model 3           # الاختيار حسب الرقم من المنتقي
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # مسح اختيار نموذج الجلسة
/model status      # عرض تفصيلي يتضمن نقطة النهاية ووضع API
```

في Discord، يفتح `/model` و`/models` منتقيًا تفاعليًا يتضمن قوائم منسدلة لمزوّد الخدمة
والنموذج. يحترم المنتقي `agents.defaults.models`، بما في ذلك
إدخالات `provider/*`.

## `/config`: الكتابة إلى الإعداد على القرص

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

يُتحقق من صحة الإعداد قبل الكتابة. تُرفض التغييرات غير الصالحة. تستمر تحديثات `/config`
بعد عمليات إعادة التشغيل.

## `/mcp`: إعداد خادم MCP

<Note>
  للمالك فقط. معطّل افتراضيًا — فعّله باستخدام `commands.mcp: true`.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

يخزّن `/mcp` الإعداد في إعداد OpenClaw، وليس في إعدادات مشروع الوكيل المضمّن.
يحجب `/mcp show` الحقول التي تحمل بيانات اعتماد، وقيم علامات بيانات الاعتماد
المعروفة، والوسائط المعروفة بأنها تشبه الأسرار. عند تشغيله من مجموعة، يُرسل
الإعداد إلى المالك بصورة خاصة؛ وإذا لم يتوفر مسار خاص إلى المالك،
يفشل الأمر بصورة مغلقة ويطلب من المالك إعادة المحاولة من محادثة
مباشرة.

## `/debug`: تجاوزات لوقت التشغيل فقط

<Note>
  للمالك فقط. معطّل افتراضيًا — فعّله باستخدام `commands.debug: true`.
  تُطبّق التجاوزات فورًا على قراءات الإعداد الجديدة، لكنها **لا** تكتب إلى القرص.
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins`: إدارة Plugins

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

يحدّث `/plugins enable|disable` إعداد Plugin ويعيد تحميل وقت تشغيل Plugins في Gateway
لحظيًا لدورات الوكيل الجديدة. يعيد `/plugins install` تشغيل بوابات Gateway المُدارة
تلقائيًا لأن وحدات مصدر Plugin قد تغيرت.

## `/trace`: مخرجات تتبع Plugin

```text
/trace          # عرض حالة التتبع الحالية
/trace on
/trace off
```

يكشف `/trace` أسطر تتبع/تنقيح Plugin ضمن نطاق الجلسة من دون الوضع المطوّل
الكامل. ولا يحل محل `/debug` (تجاوزات وقت التشغيل) أو `/verbose` (مخرجات
الأدوات العادية).

## `/btw`: الأسئلة الجانبية

`/btw` هو سؤال جانبي سريع عن سياق الجلسة الحالية. الاسم البديل: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

على خلاف الرسالة العادية:

- يستخدم الجلسة الحالية كسياق خلفي.
- يعمل كسلسلة Codex جانبية مؤقتة في جلسات أداة Codex.
- **لا** يغيّر سياق الجلسة المستقبلي.
- لا يُكتب في سجل النص.

راجع [الأسئلة الجانبية في BTW](/ar/tools/btw) لمعرفة السلوك الكامل.

## ملاحظات الواجهات

<AccordionGroup>
  <Accordion title="تحديد نطاق الجلسة لكل واجهة">
    - **الأوامر النصية:** تعمل في جلسة المحادثة العادية (تتشارك الرسائل المباشرة `main`، وللمجموعات جلساتها الخاصة).
    - **أوامر Discord الأصلية:** `agent:<agentId>:discord:slash:<userId>`
    - **أوامر Slack الأصلية:** `agent:<agentId>:slack:slash:<userId>` (يمكن ضبط البادئة عبر `channels.slack.slashCommand.sessionPrefix`)
    - **أوامر Telegram الأصلية:** `telegram:slash:<userId>` (تستهدف جلسة المحادثة عبر `CommandTargetSessionKey`)
    - يرسل **`/login codex`** رموز إقران الجهاز عبر المحادثة الخاصة أو مسارات استجابة واجهة الويب فقط. تطلب الاستدعاءات من مجموعة/موضوع Telegram من المالك مراسلة البوت مباشرةً بدلًا من ذلك.
    - يستهدف **`/stop`** جلسة المحادثة النشطة لإلغاء التشغيل الحالي.

  </Accordion>
  <Accordion title="تفاصيل Slack">
    يدعم `channels.slack.slashCommand` أمرًا واحدًا بنمط `/openclaw`.
    عند استخدام `commands.native: true`، أنشئ أمر شرطة مائلة واحدًا في Slack لكل أمر
    مضمّن. سجّل `/agentstatus` (وليس `/status`) لأن Slack يحجز
    `/status`. يظل الأمر النصي `/status` يعمل في رسائل Slack.
  </Accordion>
  <Accordion title="المسار السريع والاختصارات المضمّنة">
    - تُعالج الرسائل التي تحتوي على أمر فقط من المرسِلين المدرجين في قائمة السماح فورًا (مع تجاوز قائمة الانتظار + النموذج).
    - تعمل الاختصارات المضمّنة (`/help`، و`/commands`، و`/status`، و`/whoami`) أيضًا داخل الرسائل العادية، وتُزال قبل أن يرى النموذج النص المتبقي.
    - تُتجاهل بصمت الرسائل التي تحتوي على أمر فقط من جهات غير مخوّلة؛ وتُعامل رموز `/...` المضمّنة كنص عادي.

  </Accordion>
  <Accordion title="ملاحظات الوسائط">
    - تقبل الأوامر `:` اختياريًا بين الأمر والوسائط (`/think: high`، و`/send: on`).
    - يقبل `/new <model>` اسمًا بديلًا للنموذج، أو `provider/model`، أو اسم مزوّد خدمة (مطابقة تقريبية)؛ وإذا لم توجد مطابقة، يُعامل النص على أنه نص الرسالة.
    - يتطلب `/allowlist add|remove` القيمة `commands.config: true` ويحترم `configWrites` الخاصة بالقناة.

  </Accordion>
</AccordionGroup>

## استخدام مزوّد الخدمة وحالته

- **استخدام المزوّد/الحصة** (مثلًا، "Claude متبقٍ منه 80%") يظهر في `/status` لمزوّد النموذج الحالي عند تمكين تتبّع الاستخدام.
- يمكن أن **تعود أسطر الرموز/ذاكرة التخزين المؤقت** في `/status` إلى أحدث إدخال لاستخدام السجل عندما تكون لقطة الجلسة المباشرة شحيحة.
- **التنفيذ مقابل وقت التشغيل:** يعرض `/status` القيمة `Execution` لمسار البيئة المعزولة الفعلي، والقيمة `Runtime` للجهة التي تشغّل الجلسة: `OpenClaw Default` أو `OpenAI Codex` أو واجهة CLI خلفية أو واجهة ACP خلفية.
- **الرموز/التكلفة لكل استجابة:** يتحكم بها `/usage off|tokens|full`.
- يتعلق `/model status` بالنماذج/المصادقة/نقاط النهاية، وليس بالاستخدام.

## ذو صلة

<CardGroup cols={2}>
  <Card title="Skills" href="/ar/tools/skills" icon="puzzle-piece">
    كيفية تسجيل أوامر الشرطة المائلة الخاصة بالمهارات وتقييدها.
  </Card>
  <Card title="إنشاء المهارات" href="/ar/tools/creating-skills" icon="hammer">
    أنشئ مهارة تسجّل أمر الشرطة المائلة الخاص بها.
  </Card>
  <Card title="BTW" href="/ar/tools/btw" icon="comments">
    أسئلة جانبية من دون تغيير سياق الجلسة.
  </Card>
  <Card title="التوجيه" href="/ar/tools/steer" icon="compass">
    وجّه الوكيل في أثناء التشغيل باستخدام `/steer`.
  </Card>
</CardGroup>

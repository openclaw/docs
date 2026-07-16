---
read_when:
    - استخدام أو إعداد أوامر الدردشة
    - تصحيح أخطاء توجيه الأوامر أو الأذونات
    - فهم كيفية تسجيل أوامر Skills
sidebarTitle: Slash commands
summary: جميع أوامر الشرطة المائلة والتوجيهات والاختصارات المضمّنة المتاحة — الإعداد والتوجيه والسلوك الخاص بكل واجهة.
title: أوامر الشرطة المائلة
x-i18n:
    generated_at: "2026-07-16T15:01:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e3a50447f4776d606476f3e8511595fd27bcb889d1e9e2620b1f062ac63fb3a0
    source_path: tools/slash-commands.md
    workflow: 16
---

يتولى Gateway معالجة الأوامر المرسلة كرسائل مستقلة تبدأ بـ `/`.
تستخدم أوامر bash الخاصة بالمضيف فقط `! <cmd>` (مع `/bash <cmd>` كاسم مستعار).

عندما تكون محادثة مرتبطة بجلسة ACP، يُوجَّه النص العادي إلى
حاضنة ACP. تظل أوامر إدارة Gateway محلية: يصل `/acp ...` دائمًا إلى
معالج أوامر OpenClaw، ويظل `/status` و`/unfocus` محليين كلما
كانت معالجة الأوامر مفعّلة للواجهة.

## ثلاثة أنواع من الأوامر

<CardGroup cols={3}>
  <Card title="الأوامر" icon="terminal">
    رسائل `/...` المستقلة التي يعالجها Gateway. يجب إرسالها بوصفها
    المحتوى الوحيد في الرسالة.
  </Card>
  <Card title="التوجيهات" icon="sliders">
    `/think`، و`/fast`، و`/verbose`، و`/trace`، و`/reasoning`، و`/elevated`،
    و`/exec`، و`/model`، و`/queue` — تُزال من الرسالة قبل أن
    يراها النموذج. تحفظ إعدادات الجلسة عند إرسالها منفردة، وتعمل كتلميحات مضمّنة
    عند إرسالها مع نص آخر.
  </Card>
  <Card title="الاختصارات المضمّنة" icon="bolt">
    `/help`، و`/commands`، و`/status`، و`/whoami` — تُنفّذ فورًا وتُزال
    قبل أن يرى النموذج النص المتبقي. للمرسلين المخوّلين فقط.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="تفاصيل سلوك التوجيهات">
    - تُزال التوجيهات من الرسالة قبل أن يراها النموذج.
    - في الرسائل التي تحتوي على **توجيهات فقط** (أي لا تحتوي الرسالة إلا على توجيهات)،
      تُحفظ في الجلسة ويُرد عليها بإقرار.
    - في رسائل **الدردشة العادية** التي تحتوي على نص آخر، تعمل كتلميحات مضمّنة
      ولا تحفظ إعدادات الجلسة.
    - لا تنطبق التوجيهات إلا على **المرسلين المخوّلين**. إذا تم تعيين `commands.allowFrom`،
      فهي قائمة السماح الوحيدة المستخدمة؛ وإلا فيُستمد التخويل من
      قوائم السماح/الاقتران الخاصة بالقناة بالإضافة إلى `commands.useAccessGroups`. يتعامل
      المرسلون غير المخوّلين مع التوجيهات كنص عادي.
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
  يفعّل تحليل `/...` في رسائل الدردشة. على الواجهات التي لا تتوفر فيها أوامر أصلية
  (WhatsApp وWebChat وSignal وiMessage وGoogle Chat وMicrosoft Teams)، تعمل الأوامر
  النصية حتى عند تعيينه على `false`.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  يسجّل الأوامر الأصلية. تلقائي: مفعّل لـ Discord/Telegram؛ ومعطّل لـ Slack؛
  ويُتجاهل مع المزوّدين الذين لا يدعمون الأوامر الأصلية. يمكن تجاوزه لكل قناة باستخدام
  `channels.<provider>.commands.native`. في Discord، يتخطى `false` تسجيل أوامر الشرطة المائلة؛
  وقد تظل الأوامر المسجّلة سابقًا ظاهرة حتى تُزال.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  يسجّل أوامر المهارات كأوامر أصلية عند دعم ذلك. تلقائي: مفعّل لـ
  Discord/Telegram؛ ومعطّل لـ Slack. يمكن تجاوزه باستخدام
  `channels.<provider>.commands.nativeSkills`.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  يفعّل `! <cmd>` لتشغيل أوامر صدفة المضيف (الاسم المستعار `/bash <cmd>`). يتطلب
  قوائم السماح `tools.elevated`.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  مدة انتظار bash قبل الانتقال إلى وضع الخلفية (ينتقل `0` إلى الخلفية
  فورًا).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  يفعّل `/config` (يقرأ/يكتب `openclaw.json`). للمالك فقط.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  يفعّل `/mcp` (يقرأ/يكتب إعداد MCP المُدار بواسطة OpenClaw ضمن `mcp.servers`). للمالك فقط.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  يفعّل `/plugins` (اكتشاف الإضافات/حالتها بالإضافة إلى التثبيت والتفعيل/التعطيل). عمليات الكتابة للمالك فقط.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  يفعّل `/debug` (تجاوزات الإعداد الخاصة بوقت التشغيل فقط). للمالك فقط.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  يفعّل `/restart` وطلبات إعادة التشغيل الخارجية `SIGUSR1`.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  قائمة سماح صريحة للمالك لواجهات الأوامر المقتصرة على المالك. منفصلة عن
  `commands.allowFrom` والوصول عبر اقتران الرسائل المباشرة.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  لكل قناة: يتطلب هوية المالك للأوامر المقتصرة على المالك. عندما تكون `true`،
  يجب أن يطابق المرسل `commands.ownerAllowFrom` أو يمتلك نطاق `operator.admin`
  الداخلي. إدخال حرف البدل `allowFrom` **غير** كافٍ.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  يتحكم في كيفية ظهور معرّفات المالك في موجّه النظام.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  سر HMAC المستخدم عندما تكون `commands.ownerDisplay: "hash"`.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  قائمة سماح لكل مزوّد لتخويل الأوامر. عند إعدادها، تكون
  مصدر التخويل **الوحيد** للأوامر والتوجيهات. استخدم `"*"` كإعداد
  افتراضي عام؛ وتتجاوزه المفاتيح الخاصة بالمزوّد.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  يفرض قوائم السماح/السياسات للأوامر عندما لا تكون `commands.allowFrom` معيّنة.
</ParamField>

## قائمة الأوامر

تأتي الأوامر من ثلاثة مصادر:

- **الأوامر الأساسية المضمّنة:** `src/auto-reply/commands-registry.shared.ts`
- **أوامر dock المُنشأة:** `src/auto-reply/commands-registry.data.ts`
- **أوامر الإضافات:** استدعاءات الإضافة `registerCommand()`

يعتمد التوفر على علامات الإعداد وواجهة القناة والإضافات
المثبّتة/المفعّلة.

### الأوامر الأساسية

<AccordionGroup>
  <Accordion title="الجلسات وعمليات التشغيل">
    | الأمر | الوصف |
    | --- | --- |
    | `/new [model]` | أرشفة الجلسة الحالية وبدء جلسة جديدة |
    | `/reset [soft [message]]` | إعادة ضبط الجلسة الحالية في مكانها. يحتفظ `soft` بالسجل، ويتخلص من معرّفات جلسات الواجهة الخلفية لـ CLI المعاد استخدامها، ويعيد تشغيل بدء التشغيل |
    | `/name <title>` | تسمية الجلسة الحالية أو إعادة تسميتها. احذف العنوان لرؤية الاسم الحالي واقتراح |
    | `/compact [instructions]` | ضغط سياق الجلسة. راجع [Compaction](/ar/concepts/compaction) |
    | `/stop` | إلغاء عملية التشغيل الحالية |
    | `/session idle <duration\|off>` | إدارة انتهاء صلاحية الخمول لربط الخيط |
    | `/session max-age <duration\|off>` | إدارة انتهاء صلاحية الحد الأقصى لعمر ربط الخيط |
    | `/export-session [path]` | للمالك فقط. تصدير الجلسة الحالية إلى HTML داخل مساحة العمل. الاسم المستعار: `/export` |
    | `/export-trajectory [path]` | تصدير حزمة مسار JSONL للجلسة الحالية. الاسم المستعار: `/trajectory` |

    تستبدل مسارات `/export-session` الصريحة الملفات الموجودة داخل
    مساحة العمل. احذف المسار لإنشاء اسم ملف آمن من التعارضات.

    <Note>
      تعترض واجهة Control UI النص المكتوب `/new` لإنشاء جلسة
      لوحة معلومات جديدة والتبديل إليها، إلا عندما يكون `session.dmScope: "main"` معدًّا
      ويكون الأصل الحالي هو الجلسة الرئيسية للوكيل — في هذه الحالة يعيد `/new`
      ضبط الجلسة الرئيسية في مكانها. يظل النص المكتوب `/reset` يشغّل إعادة الضبط
      الموضعية في Gateway. استخدم `/model default` عندما تريد مسح
      اختيار نموذج مثبّت للجلسة.
    </Note>

  </Accordion>

  <Accordion title="عناصر التحكم في النموذج والتشغيل">
    | الأمر | الوصف |
    | --- | --- |
    | `/think <level\|default>` | تعيين مستوى التفكير أو مسح تجاوز الجلسة. الأسماء المستعارة: `/thinking`، `/t` |
    | `/verbose on\|off\|full` | تبديل الإخراج المطوّل. الاسم المستعار: `/v` |
    | `/trace on\|off` | تبديل إخراج تتبع الإضافة للجلسة الحالية |
    | `/fast [status\|auto\|on\|off\|default]` | عرض الوضع السريع أو تعيينه أو مسحه |
    | `/reasoning [on\|off\|stream]` | تبديل إظهار الاستدلال. الاسم المستعار: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | تبديل الوضع المرتفع الصلاحيات. الاسم المستعار: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | عرض إعدادات exec الافتراضية أو تعيينها |
    | `/login [codex\|openai\|openai-codex]` | إقران تسجيل دخول Codex/OpenAI من دردشة خاصة أو جلسة Web UI. للمالك/المسؤول فقط |
    | `/model [name\|#\|status]` | عرض النموذج أو تعيينه |
    | `/models [provider] [page] [limit=<n>\|all]` | سرد المزوّدين أو النماذج المعدّة/المتاحة بالمصادقة |
    | `/queue <mode>` | إدارة سلوك طابور عملية التشغيل النشطة. راجع [الطابور](/ar/concepts/queue) و[توجيه الطابور](/ar/concepts/queue-steering) |
    | `/steer <message>` | حقن إرشادات في عملية التشغيل النشطة. الاسم المستعار: `/tell`. راجع [التوجيه](/ar/tools/steer) |

    <AccordionGroup>
      <Accordion title="سلامة الإطالة / التتبع / السرعة / الاستدلال">
        - `/verbose` مخصّص لتصحيح الأخطاء — أبقه **معطّلًا** في الاستخدام العادي.
        - لا يكشف `/trace` إلا أسطر التتبع/تصحيح الأخطاء التي تملكها الإضافة؛ وتظل الرسائل المطوّلة العادية معطّلة.
        - يحفظ `/fast auto|on|off` تجاوزًا للجلسة؛ استخدم خيار `inherit` في واجهة الجلسات لمسحه.
        - يعتمد `/fast` على المزوّد: يربطه OpenAI/Codex بـ `service_tier=priority`؛ وتربطه طلبات Anthropic المباشرة بـ `service_tier=auto` أو `standard_only`.
        - تُعد `/reasoning` و`/verbose` و`/trace` محفوفة بالمخاطر في إعدادات المجموعات — فقد تكشف الاستدلال الداخلي أو تشخيصات الإضافات. أبقها معطّلة في الدردشات الجماعية.

      </Accordion>
      <Accordion title="تفاصيل تبديل النموذج">
        - يحفظ `/model` النموذج الجديد فورًا في الجلسة.
        - إذا كان الوكيل خاملًا، تستخدمه عملية التشغيل التالية فورًا.
        - إذا كانت هناك عملية تشغيل نشطة، يُعلَّم التبديل على أنه معلّق ويُطبّق عند نقطة إعادة المحاولة النظيفة التالية.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="الاكتشاف والحالة">
    | الأمر | الوصف |
    | --- | --- |
    | `/help` | عرض ملخص المساعدة القصير |
    | `/commands` | عرض كتالوج الأوامر المُنشأ |
    | `/tools [compact\|verbose]` | عرض ما يمكن للوكيل الحالي استخدامه الآن |
    | `/status` | عرض حالة التنفيذ/وقت التشغيل، ومدة تشغيل Gateway والنظام، وصحة الإضافات، بالإضافة إلى استخدام المزوّد/الحصة |
    | `/status plugins` | عرض صحة الإضافات بالتفصيل: أخطاء التحميل، والحجر، وأعطال إضافات القنوات، ومشكلات التبعيات، وإشعارات التوافق. يتطلب `commands.plugins: true` |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | إدارة [الهدف](/ar/tools/goal) الدائم للجلسة الحالية |
    | `/diagnostics [note]` | مسار تقرير دعم للمالك فقط. يطلب الموافقة على exec في كل مرة |
    | `/openclaw <request>` | تشغيل مساعد إعداد OpenClaw وإصلاحه من رسالة مباشرة للمالك |
    | `/tasks` | سرد مهام الخلفية النشطة/الحديثة للجلسة الحالية |
    | `/context [list\|detail\|map\|json]` | شرح كيفية تجميع السياق |
    | `/whoami` | عرض معرّف المرسل الخاص بك. الاسم المستعار: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | التحكم في تذييل الاستخدام لكل استجابة (`reset`/`inherit`/`clear`/`default` يمسح تجاوز الجلسة لإعادة وراثة الإعداد الافتراضي المعدّ) أو طباعة ملخص تكلفة محلي |
  </Accordion>

  <Accordion title="Skills، وقوائم السماح، والموافقات">
    | الأمر | الوصف |
    | --- | --- |
    | `/skill <name> [input]` | تشغيل مهارة بالاسم |
    | `/learn [request]` | صياغة مهارة واحدة قابلة للمراجعة من المحادثة الحالية أو المصادر المسماة عبر [ورشة المهارات](/ar/tools/skill-workshop) |
    | `/allowlist [list\|add\|remove] ...` | إدارة إدخالات قائمة السماح. نص فقط |
    | `/approve <id> <decision>` | معالجة مطالبات الموافقة على التنفيذ أو Plugin |
    | `/btw <question>` | طرح سؤال جانبي من دون تغيير سياق الجلسة. الاسم المستعار: `/side`. راجع [BTW](/ar/tools/btw) |
  </Accordion>

  <Accordion title="الوكلاء الفرعيون وACP">
    | الأمر | الوصف |
    | --- | --- |
    | `/subagents list\|log\|info` | فحص عمليات تشغيل الوكلاء الفرعيين للجلسة الحالية |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | إدارة جلسات ACP وخيارات وقت التشغيل. تتطلب عناصر التحكم في وقت التشغيل هوية مالك خارجي أو مسؤول Gateway داخلي |
    | `/focus <target>` | ربط سلسلة Discord الحالية أو موضوع Telegram بهدف جلسة |
    | `/unfocus` | إزالة ربط السلسلة الحالية |
    | `/agents` | سرد الوكلاء المرتبطين بالسلسلة للجلسة الحالية |
  </Accordion>

  <Accordion title="عمليات الكتابة والإدارة الخاصة بالمالك">
    | الأمر | يتطلب | الوصف |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | قراءة `openclaw.json` أو كتابته. للمالك فقط |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | قراءة إعداد خادم MCP المُدار بواسطة OpenClaw أو كتابته. للمالك فقط |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | فحص حالة Plugin أو تعديلها. عمليات الكتابة للمالك فقط. الاسم المستعار: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | تجاوزات إعداد خاصة بوقت التشغيل فقط. للمالك فقط |
    | `/restart` | `commands.restart: true` (افتراضي) | إعادة تشغيل OpenClaw |
    | `/send on\|off\|inherit` | المالك | تعيين سياسة الإرسال |
  </Accordion>

  <Accordion title="الصوت وTTS والتحكم في القناة">
    | الأمر | الوصف |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | التحكم في TTS. راجع [TTS](/ar/tools/tts) |
    | `/activation mention\|always` | تعيين وضع تنشيط المجموعة |
    | `/bash <command>` | تشغيل أمر shell على المضيف. الاسم المستعار: `! <command>`. يتطلب `commands.bash: true` |
    | `!poll [sessionId]` | التحقق من مهمة bash تعمل في الخلفية |
    | `!stop [sessionId]` | إيقاف مهمة bash تعمل في الخلفية |
  </Accordion>
</AccordionGroup>

### أوامر الإرساء

تبدّل أوامر الإرساء مسار الرد للجلسة النشطة إلى قناة مرتبطة أخرى.
راجع [إرساء القنوات](/ar/concepts/channel-docking) للإعداد واستكشاف الأخطاء وإصلاحها.

يتم إنشاؤها من Plugins القنوات التي تدعم الأوامر الأصلية:

- `/dock-discord` (الاسم المستعار: `/dock_discord`)
- `/dock-mattermost` (الاسم المستعار: `/dock_mattermost`)
- `/dock-slack` (الاسم المستعار: `/dock_slack`)
- `/dock-telegram` (الاسم المستعار: `/dock_telegram`)

تتطلب أوامر الإرساء `session.identityLinks`. يجب أن يكون المرسل المصدر والنظير الهدف
ضمن مجموعة الهوية نفسها.

### أوامر Plugins المضمّنة

| الأمر                                                 | الوصف                                                                                                                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | تبديل Dreaming للذاكرة (المالك أو مسؤول Gateway). راجع [Dreaming](/ar/concepts/dreaming)                                                                                                            |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | إدارة إقران الأجهزة. راجع [الإقران](/ar/channels/pairing)                                                                                                                                        |
| `/phone status\|arm ...\|disarm`                        | تفعيل أوامر Node عالية المخاطر مؤقتًا (الكاميرا/الشاشة/الحاسوب/الكتابة). راجع [استخدام الحاسوب](/ar/nodes/computer-use)                                                                               |
| `/voice status\|list\|set <voiceId>`                    | إدارة إعداد صوت Talk. الاسم الأصلي في Discord: `/talkvoice`                                                                                                                                    |
| `/card ...`                                             | إرسال إعدادات بطاقات LINE الغنية المسبقة. راجع [LINE](/ar/channels/line)                                                                                                                                        |
| `/codex <action> ...`                                   | ربط أداة خادم تطبيق Codex وتوجيهها وفحصها (الحالة، والسلاسل، والاستئناف، والنموذج، والوضع السريع، والأذونات، والضغط، والمراجعة، وMCP، والمهارات، والمزيد). راجع [أداة Codex](/ar/plugins/codex-harness) |

خاص بـ QQBot فقط: `/bot-ping`، `/bot-version`، `/bot-help`، `/bot-upgrade`، `/bot-logs`

### أوامر المهارات

تُعرض المهارات التي يمكن للمستخدم استدعاؤها في صورة أوامر شرطة مائلة:

- `/skill <name> [input]` يعمل دائمًا كنقطة الدخول العامة.
- قد تُسجَّل المهارات كأوامر مباشرة (مثل `/prose` لـ OpenProse).
- يتحكم `commands.nativeSkills` و
  `channels.<provider>.commands.nativeSkills` في تسجيل أوامر المهارات الأصلية.
- تُعقَّم الأسماء إلى `a-z0-9_` (بحد أقصى 32 حرفًا)؛ وتحصل التصادمات على لواحق رقمية.

<AccordionGroup>
  <Accordion title="توجيه أوامر المهارات">
    افتراضيًا، تُوجَّه أوامر المهارات إلى النموذج كطلب عادي.

    يمكن للمهارات إعلان `command-dispatch: tool` للتوجيه مباشرة إلى أداة
    (بشكل حتمي، من دون مشاركة النموذج). مثال: `/prose` (Plugin ‏OpenProse)
    — راجع [OpenProse](/ar/prose).

  </Accordion>
  <Accordion title="وسيطات الأوامر الأصلية">
    يستخدم Discord الإكمال التلقائي للخيارات الديناميكية وقوائم الأزرار عند حذف
    الوسيطات المطلوبة. يعرض Telegram وSlack قائمة أزرار للأوامر التي تحتوي على
    خيارات. تُحل الخيارات الديناميكية وفق نموذج الجلسة الهدف، لذلك تتبع الخيارات
    الخاصة بالنموذج، مثل مستويات `/think`، تجاوز `/model` الخاص بالجلسة.
  </Accordion>
</AccordionGroup>

## `/tools`: ما يمكن للوكيل استخدامه الآن

يجيب `/tools` عن سؤال في وقت التشغيل: **ما الذي يمكن لهذا الوكيل استخدامه الآن في هذه
المحادثة** — وليس فهرس إعداد ثابتًا.

```text
/tools         # عرض موجز
/tools verbose # مع أوصاف قصيرة
```

تقتصر النتائج على نطاق الجلسة. قد يؤدي تغيير الوكيل أو القناة أو السلسلة أو
تفويض المرسل أو النموذج إلى تغيير المخرجات. لتحرير الملف التعريفي والتجاوزات،
استخدم لوحة الأدوات في واجهة التحكم أو واجهات الإعداد.

## `/model`: اختيار النموذج

```text
/model             # عرض منتقي النماذج
/model list        # الأمر نفسه
/model 3           # الاختيار بالرقم من المنتقي
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # مسح اختيار نموذج الجلسة
/model status      # عرض مفصل يتضمن نقطة النهاية ووضع API
```

في Discord، يفتح `/model` و`/models` منتقيًا تفاعليًا يتضمن قوائم منسدلة
لمزوّد الخدمة والنموذج. يراعي المنتقي `agents.defaults.models`، بما في ذلك
إدخالات `provider/*`.

## `/config`: كتابة الإعداد على القرص

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

يُتحقق من صحة الإعداد قبل كتابته. تُرفض التغييرات غير الصالحة. تستمر تحديثات `/config`
عبر عمليات إعادة التشغيل.

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
يحجب `/mcp show` الحقول التي تحتوي على بيانات اعتماد، وقيم علامات بيانات
الاعتماد المعروفة، والوسيطات المعروفة ذات الهيئة السرية. عند تشغيله من مجموعة،
يُرسل الإعداد إلى المالك بشكل خاص؛ وإذا لم يتوفر مسار خاص إلى المالك،
يفشل الأمر بصورة مغلقة ويطلب من المالك إعادة المحاولة من محادثة
مباشرة.

## `/debug`: تجاوزات خاصة بوقت التشغيل فقط

<Note>
  للمالك فقط. معطّل افتراضيًا — فعّله باستخدام `commands.debug: true`.
  تُطبّق التجاوزات فورًا على قراءات الإعداد الجديدة، لكنها **لا** تكتب على القرص.
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
  عمليات الكتابة للمالك فقط. معطّل افتراضيًا — فعّله باستخدام `commands.plugins: true`.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install clawhub:<package>
/plugins install npm:@openclaw/<official-package>
/plugins install npm:<package> --force
/plugins install git:<repository>@<ref> --force
```

يحدّث `/plugins enable|disable` إعداد Plugin ويعيد تحميل وقت تشغيل Plugins في Gateway
بشكل فوري لدورات الوكيل الجديدة. يعيد `/plugins install` تشغيل Gateways المُدارة
تلقائيًا لأن وحدات مصدر Plugin قد تغيرت. لا تتطلب عمليات التثبيت الموثوقة من ClawHub
والفهرس الرسمي إقرارًا إضافيًا. تعرض مصادر npm الاعتباطية وgit والأرشيف
و`npm-pack:` والمسارات المحلية تحذيرًا بشأن المصدر،
وتتطلب `--force` في النهاية بعد مراجعة المصدر. تُقر هذه العلامة
بالمصدر وتسمح باستبدال تثبيت موجود؛ لكنها لا تتجاوز
`security.installPolicy` أو فحوصات أمان أداة التثبيت. لا تزال إصدارات ClawHub التي
تتضمن تحذيرات مخاطر تتطلب العلامة المنفصلة الخاصة بـ shell فقط
`--acknowledge-clawhub-risk`. كما تظل عمليات التثبيت من السوق والمرتبطة والمثبّتة
خاصة بـ shell فقط.

## `/trace`: مخرجات تتبع Plugin

```text
/trace          # عرض حالة التتبع الحالية
/trace on
/trace off
```

يكشف `/trace` أسطر تتبع/تصحيح Plugin الخاصة بنطاق الجلسة من دون الوضع
المطوّل الكامل. ولا يحل محل `/debug` (تجاوزات وقت التشغيل) أو `/verbose` (مخرجات
الأدوات العادية).

## `/btw`: الأسئلة الجانبية

`/btw` سؤال جانبي سريع عن سياق الجلسة الحالية. الاسم المستعار: `/side`.

```text
/btw ماذا نفعل الآن؟
/side ما الذي تغير بينما استمر التشغيل الرئيسي؟
```

بخلاف الرسالة العادية:

- يستخدم الجلسة الحالية كسياق خلفي.
- يعمل في جلسات أداة Codex كسلسلة Codex جانبية مؤقتة.
- **لا** يغيّر سياق الجلسة المستقبلي.
- لا يُكتب في سجل النص.

راجع [أسئلة BTW الجانبية](/ar/tools/btw) للاطلاع على السلوك الكامل.

## ملاحظات الواجهات

<AccordionGroup>
  <Accordion title="تحديد نطاق الجلسة لكل واجهة">
    - **الأوامر النصية:** تعمل في جلسة المحادثة العادية (تشارك الرسائل الخاصة `main`، وللمجموعات جلساتها الخاصة).
    - **أوامر Discord الأصلية:** `agent:<agentId>:discord:slash:<userId>`
    - **أوامر Slack الأصلية:** `agent:<agentId>:slack:slash:<userId>` (يمكن ضبط البادئة عبر `channels.slack.slashCommand.sessionPrefix`)
    - **أوامر Telegram الأصلية:** `telegram:slash:<userId>` (تستهدف جلسة المحادثة عبر `CommandTargetSessionKey`)
    - يرسل **`/login codex`** رموز إقران الأجهزة فقط عبر المحادثة الخاصة أو مسارات استجابة واجهة الويب. تطلب عمليات الاستدعاء في مجموعات/موضوعات Telegram من المالك مراسلة البوت مباشرة بدلًا من ذلك.
    - يستهدف **`/stop`** جلسة المحادثة النشطة لإلغاء التشغيل الحالي.

  </Accordion>
  <Accordion title="تفاصيل Slack">
    يدعم `channels.slack.slashCommand` أمرًا واحدًا بنمط `/openclaw`.
    مع `commands.native: true`، أنشئ أمر شرطة مائلة واحدًا في Slack لكل أمر
    مضمّن. سجّل `/agentstatus` (وليس `/status`) لأن Slack يحجز
    `/status`. ويظل النص `/status` يعمل في رسائل Slack.
  </Accordion>
  <Accordion title="المسار السريع والاختصارات المضمّنة">
    - تُعالج فورًا الرسائل التي تقتصر على أوامر والمرسلة من مرسلين مدرجين في قائمة السماح (مع تجاوز قائمة الانتظار + النموذج).
    - تعمل أيضًا الاختصارات المضمّنة (`/help`، `/commands`، `/status`، `/whoami`) عند تضمينها في الرسائل العادية، وتُزال قبل أن يرى النموذج النص المتبقي.
    - تُتجاهل بصمت الرسائل غير المصرّح بها التي تقتصر على أوامر؛ وتُعامل رموز `/...` المضمّنة كنص عادي.

  </Accordion>
  <Accordion title="ملاحظات حول الوسائط">
    - تقبل الأوامر `:` اختياريًا بين الأمر والوسائط (`/think: high`، `/send: on`).
    - يقبل `/new <model>` اسمًا مستعارًا للنموذج أو `provider/model` أو اسم موفّر (بمطابقة تقريبية)؛ وإذا لم توجد مطابقة، يُعامل النص كمحتوى الرسالة.
    - يتطلب `/allowlist add|remove` القيمة `commands.config: true` ويلتزم بإعداد القناة `configWrites`.

  </Accordion>
</AccordionGroup>

## استخدام الموفّر وحالته

- يظهر **استخدام الموفّر/الحصة** (مثل "Claude، متبقٍ 80%") في `/status` لموفّر النموذج الحالي عند تمكين تتبّع الاستخدام.
- يمكن أن ترجع **أسطر الرموز/ذاكرة التخزين المؤقت** في `/status` إلى أحدث إدخال لاستخدام نص الجلسة عندما تكون اللقطة المباشرة للجلسة شحيحة البيانات.
- **التنفيذ مقابل بيئة التشغيل:** يُبلغ `/status` عن `Execution` لمسار وضع الحماية الفعلي، وعن `Runtime` لتحديد الجهة التي تشغّل الجلسة: `OpenClaw Default` أو `OpenAI Codex` أو واجهة خلفية لـ CLI أو واجهة خلفية لـ ACP.
- **الرموز/التكلفة لكل استجابة:** يتحكم فيها `/usage off|tokens|full`.
- يتعلق `/model status` بالنماذج/المصادقة/نقاط النهاية، وليس بالاستخدام.

## ذو صلة

<CardGroup cols={2}>
  <Card title="Skills" href="/ar/tools/skills" icon="puzzle-piece">
    كيفية تسجيل أوامر الشرطة المائلة الخاصة بالمهارات والتحكم في إتاحتها.
  </Card>
  <Card title="إنشاء المهارات" href="/ar/tools/creating-skills" icon="hammer">
    أنشئ مهارة تسجّل أمر الشرطة المائلة الخاص بها.
  </Card>
  <Card title="بالمناسبة" href="/ar/tools/btw" icon="comments">
    اطرح أسئلة جانبية من دون تغيير سياق الجلسة.
  </Card>
  <Card title="التوجيه" href="/ar/tools/steer" icon="compass">
    وجّه الوكيل في أثناء التشغيل باستخدام `/steer`.
  </Card>
</CardGroup>

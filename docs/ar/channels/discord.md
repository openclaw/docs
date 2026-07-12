---
read_when:
    - العمل على ميزات قناة Discord
summary: إعداد بوت Discord، ومفاتيح الإعداد، والمكوّنات، والصوت، واستكشاف الأخطاء وإصلاحها
title: Discord
x-i18n:
    generated_at: "2026-07-12T05:34:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ae3682462003a04e57acbdc98a3713e5ef83f89384b7f3b79633c344855b715
    source_path: channels/discord.md
    workflow: 16
---

يتصل OpenClaw بـ Discord بصفته روبوتًا عبر Discord gateway الرسمي. وتُدعم الرسائل الخاصة وقنوات الخوادم.

<CardGroup cols={3}>
  <Card title="الإقران" icon="link" href="/ar/channels/pairing">
    تستخدم رسائل Discord الخاصة وضع الإقران افتراضيًا.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلية ودليل الأوامر.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    مسار التشخيص والإصلاح عبر القنوات.
  </Card>
</CardGroup>

## الإعداد السريع

أنشئ تطبيق Discord يتضمن روبوتًا، وأضف الروبوت إلى خادمك، ثم اقرنه بـ OpenClaw. استخدم خادمًا خاصًا إن أمكن؛ [أنشئ واحدًا أولًا](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (**Create My Own > For me and my friends**) عند الحاجة.

<Steps>
  <Step title="إنشاء تطبيق Discord وروبوت">
    في [بوابة مطوري Discord](https://discord.com/developers/applications)، انقر على **New Application** وامنحه اسمًا (مثل "OpenClaw").

    افتح **Bot** في الشريط الجانبي واضبط **Username** على اسم وكيلك.

  </Step>

  <Step title="تمكين النوايا ذات الامتيازات">
    وأنت لا تزال في صفحة **Bot**، فعّل ما يلي ضمن **Privileged Gateway Intents**:

    - **Message Content Intent** (مطلوب)
    - **Server Members Intent** (موصى به؛ ومطلوب لقوائم السماح القائمة على الأدوار، ومطابقة الأسماء بالمعرّفات، ومجموعات الوصول إلى جمهور القناة)
    - **Presence Intent** (اختياري؛ لتحديثات حالة الحضور فقط)

  </Step>

  <Step title="نسخ رمز روبوتك">
    في صفحة **Bot**، انقر على **Reset Token** وانسخ الرمز.

    <Note>
    رغم التسمية، يؤدي هذا إلى إنشاء رمزك الأول، ولا تتم «إعادة تعيين» أي شيء.
    </Note>

  </Step>

  <Step title="إنشاء عنوان URL للدعوة وإضافة الروبوت إلى خادمك">
    افتح **OAuth2** في الشريط الجانبي. في **OAuth2 URL Generator**، فعّل النطاقات التالية:

    - `bot`
    - `applications.commands`

    في قسم **Bot Permissions** الذي يظهر، فعّل ما يلي على الأقل:

    **الأذونات العامة**
      - View Channels

    **أذونات النصوص**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (اختياري)

    هذا هو الحد الأساسي للقنوات النصية العادية. إذا كان الروبوت سينشر في سلاسل المحادثات، بما في ذلك تدفقات عمل قنوات المنتديات أو الوسائط التي تنشئ سلسلة محادثات أو تتابعها، ففعّل أيضًا **Send Messages in Threads**.

    انسخ عنوان URL الناتج، وافتحه في متصفح، وحدد خادمك، ثم انقر على **Continue**. ينبغي أن يظهر الروبوت الآن في خادمك.

  </Step>

  <Step title="تمكين وضع المطور وجمع معرّفاتك">
    في تطبيق Discord، فعّل وضع المطور كي تتمكن من نسخ المعرّفات:

    1. **User Settings** (أيقونة الترس) → **Developer** → فعّل **Developer Mode**
       *(على الهاتف المحمول: **App Settings** → **Advanced**)*
    2. انقر بزر الماوس الأيمن على **أيقونة خادمك** → **Copy Server ID**
    3. انقر بزر الماوس الأيمن على **صورتك الرمزية** → **Copy User ID**

    احتفظ بمعرّف الخادم ومعرّف المستخدم مع رمز روبوتك؛ ستحتاج إلى الثلاثة في الخطوة التالية.

  </Step>

  <Step title="السماح بالرسائل الخاصة من أعضاء الخادم">
    لكي يعمل الإقران، يجب أن يسمح Discord للروبوت بإرسال رسالة خاصة إليك. انقر بزر الماوس الأيمن على **أيقونة خادمك** → **Privacy Settings** → فعّل **Direct Messages**.

    اترك هذا الخيار مفعّلًا إذا كنت تستخدم رسائل Discord الخاصة مع OpenClaw. وإذا كنت تستخدم قنوات الخادم فقط، فيمكنك تعطيله بعد الإقران.

  </Step>

  <Step title="ضبط رمز روبوتك بأمان (لا ترسله في الدردشة)">
    رمز الروبوت سر. اضبطه على الجهاز الذي يشغّل OpenClaw قبل مراسلة وكيلك:

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
cat > discord.patch.json5 <<'JSON5'
{
  channels: {
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./discord.patch.json5 --dry-run
openclaw config patch --file ./discord.patch.json5
openclaw gateway
```

    إذا كان OpenClaw يعمل بالفعل كخدمة في الخلفية، فأعد تشغيله عبر تطبيق OpenClaw لنظام Mac أو بإيقاف عملية `openclaw gateway run` وإعادة تشغيلها.
    بالنسبة إلى عمليات التثبيت المُدارة كخدمة، شغّل `openclaw gateway install` من صدفة تكون فيها قيمة `DISCORD_BOT_TOKEN` مضبوطة، أو خزّن المتغير في `~/.openclaw/.env` حتى تتمكن الخدمة من تحليل مرجع السر في البيئة بعد إعادة التشغيل.
    إذا كان مضيفك محظورًا أو خاضعًا لتحديد المعدل عند بحث Discord عن التطبيق أثناء بدء التشغيل، فاضبط معرّف التطبيق/العميل من بوابة المطورين حتى يمكن لبدء التشغيل تجاوز استدعاء REST هذا: استخدم `channels.discord.applicationId` للحساب الافتراضي، أو `channels.discord.accounts.<accountId>.applicationId` لكل روبوت.

  </Step>

  <Step title="تهيئة OpenClaw وإجراء الإقران">

    <Tabs>
      <Tab title="اطلب من وكيلك">
        تحدث مع وكيل OpenClaw عبر قناة موجودة (مثل Telegram) وأخبره بذلك. إذا كانت Discord قناتك الأولى، فاستخدم تبويب CLI / التهيئة بدلًا من ذلك.

        > "لقد ضبطت بالفعل رمز روبوت Discord في التهيئة. يُرجى إكمال إعداد Discord باستخدام معرّف المستخدم `<user_id>` ومعرّف الخادم `<server_id>`."
      </Tab>
      <Tab title="CLI / التهيئة">
        التهيئة المستندة إلى ملف:

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: {
        source: "env",
        provider: "default",
        id: "DISCORD_BOT_TOKEN",
      },
    },
  },
}
```

        القيمة الاحتياطية من البيئة للحساب الافتراضي:

```bash
DISCORD_BOT_TOKEN=...
```

        للإعداد البرمجي أو البعيد، اكتب كتلة JSON5 نفسها باستخدام `openclaw config patch --file ./discord.patch.json5 --dry-run`، ثم أعد التشغيل من دون `--dry-run`. تعمل سلاسل `token` النصية الصريحة أيضًا، كما تُدعم قيم SecretRef في `channels.discord.token` عبر موفري البيئة/الملفات/التنفيذ. راجع [إدارة الأسرار](/ar/gateway/secrets).

        عند استخدام عدة روبوتات Discord، احتفظ برمز كل روبوت ومعرّف تطبيقه ضمن حسابه. ترث الحسابات قيمة `channels.discord.applicationId` في المستوى الأعلى، لذا لا تضبطها هناك إلا عندما تستخدم جميع الحسابات معرّف التطبيق نفسه.

```json5
{
  channels: {
    discord: {
      enabled: true,
      accounts: {
        personal: {
          token: { source: "env", provider: "default", id: "DISCORD_PERSONAL_TOKEN" },
          applicationId: "111111111111111111",
        },
        work: {
          token: { source: "env", provider: "default", id: "DISCORD_WORK_TOKEN" },
          applicationId: "222222222222222222",
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="الموافقة على إقران الرسالة الخاصة الأولى">
    بعد تشغيل Gateway، أرسل رسالة خاصة إلى روبوتك في Discord. سيرد برمز إقران.

    <Tabs>
      <Tab title="اطلب من وكيلك">
        أرسل رمز الإقران إلى وكيلك عبر قناتك الحالية:

        > "وافق على رمز إقران Discord هذا: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    تنتهي صلاحية رموز الإقران بعد ساعة واحدة. بعد الموافقة، تحدث مع وكيلك في رسالة Discord خاصة.

  </Step>
</Steps>

<Note>
يراعي تحليل الرمز الحساب. تتغلب قيم الرمز في التهيئة على القيمة الاحتياطية من البيئة، ولا يُستخدم `DISCORD_BOT_TOKEN` إلا للحساب الافتراضي.
إذا تم تحليل حسابين مفعّلين في Discord إلى رمز الروبوت نفسه، فلن يشغّل OpenClaw سوى مراقب Gateway واحد لذلك الرمز: يتغلب الرمز الآتي من التهيئة على القيمة الاحتياطية من البيئة؛ وفي غير ذلك يفوز أول حساب مفعّل، ويُبلّغ عن تعطيل الحساب المكرر مع السبب `duplicate bot token`.
بالنسبة إلى الاستدعاءات الصادرة المتقدمة (أداة الرسائل/إجراءات القنوات)، يُستخدم `token` صريح لكل استدعاء في ذلك الاستدعاء. ينطبق هذا على إجراءات الإرسال وإجراءات القراءة/الاستقصاء (القراءة/البحث/الجلب/سلسلة المحادثات/العناصر المثبتة/الأذونات). وتظل إعدادات سياسة الحساب وإعادة المحاولة مأخوذة من الحساب المحدد في لقطة وقت التشغيل النشطة.
</Note>

## موصى به: إعداد مساحة عمل على خادم

بعد أن تعمل الرسائل الخاصة، يمكنك تحويل خادمك إلى مساحة عمل كاملة تحصل فيها كل قناة على جلسة وكيل مستقلة بسياقها الخاص. يُوصى بذلك للخوادم الخاصة التي لا تضم سوى أنت وروبوتك.

<Steps>
  <Step title="إضافة خادمك إلى قائمة السماح للخوادم">
    يتيح هذا لوكيلك الرد في أي قناة على خادمك، وليس في الرسائل الخاصة فقط.

    <Tabs>
      <Tab title="اطلب من وكيلك">
        > "أضف معرّف خادم Discord الخاص بي `<server_id>` إلى قائمة السماح للخوادم"
      </Tab>
      <Tab title="التهيئة">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="السماح بالردود من دون @إشارة">
    افتراضيًا، لا يرد الوكيل في قنوات الخادم إلا عند الإشارة إليه باستخدام @. وعلى خادم خاص، سترغب على الأرجح في أن يرد على كل رسالة.

    في قنوات الخادم، تُنشر الردود العادية تلقائيًا بشكل افتراضي. بالنسبة إلى الغرف المشتركة دائمة النشاط، فعّل `messages.groupChat.visibleReplies: "message_tool"` كي يتمكن الوكيل من المتابعة بصمت وألا ينشر إلا عندما يقرر أن الرد في القناة مفيد. يعمل هذا بأفضل شكل مع نماذج الجيل الأحدث الموثوقة في استخدام الأدوات، مثل GPT-5.6 Sol. وتظل أحداث الغرفة المحيطة صامتة ما لم تُرسل الأداة رسالة. راجع [أحداث الغرفة المحيطة](/ar/channels/ambient-room-events) للاطلاع على التهيئة الكاملة لوضع المتابعة الصامتة.

    إذا أظهر Discord مؤشر الكتابة وأظهرت السجلات استخدام الرموز، لكن لم تُنشر أي رسالة، فتحقق مما إذا كان الدور قد هُيئ كحدث غرفة محيطة أو فُعّلت فيه الردود المرئية عبر أداة الرسائل.

    <Tabs>
      <Tab title="اطلب من وكيلك">
        > "اسمح لوكيلي بالرد على هذا الخادم من دون الحاجة إلى الإشارة إليه باستخدام @"
      </Tab>
      <Tab title="التهيئة">
        اضبط `requireMention: false` في تهيئة خادمك:

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

        لفرض استخدام أداة الرسائل في الردود المرئية ضمن المجموعات/القنوات، اضبط `messages.groupChat.visibleReplies: "message_tool"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="التخطيط للذاكرة في قنوات الخادم">
    لا تُحمّل الذاكرة طويلة الأمد (`MEMORY.md`) تلقائيًا إلا في جلسات الرسائل الخاصة؛ ولا تحمّلها قنوات الخادم.

    <Tabs>
      <Tab title="اطلب من وكيلك">
        > "عندما أطرح أسئلة في قنوات Discord، استخدم memory_search أو memory_get إذا احتجت إلى سياق طويل الأمد من MEMORY.md."
      </Tab>
      <Tab title="يدوي">
        لمشاركة السياق في كل قناة، ضع التعليمات الثابتة في `AGENTS.md` أو `USER.md` (تُحقن في كل جلسة). واحتفظ بالملاحظات طويلة الأمد في `MEMORY.md`، ثم صِل إليها عند الطلب باستخدام أدوات الذاكرة.
      </Tab>
    </Tabs>

  </Step>
</Steps>

أنشئ الآن القنوات وابدأ المحادثة. يرى الوكيل اسم القناة، وتكون كل قناة جلسة معزولة؛ يمكنك إعداد `#coding` أو `#home` أو `#research` أو أي أسماء تناسب سير عملك.

## نموذج وقت التشغيل

- يملك Gateway اتصال Discord.
- توجيه الردود حتمي: تعود الردود الواردة من Discord إلى Discord.
- تُضاف البيانات الوصفية لخادم/قناة Discord إلى مطالبة النموذج كسياق غير موثوق، لا كبادئة رد مرئية للمستخدم. إذا نسخ نموذج ذلك الغلاف إلى الرد، يزيل OpenClaw البيانات الوصفية المنسوخة من الردود الصادرة ومن سياق إعادة التشغيل المستقبلي.
- افتراضيًا (`session.dmScope=main`)، تشترك المحادثات المباشرة في الجلسة الرئيسية للوكيل (`agent:main:main`).
- لقنوات الخوادم مفاتيح جلسات معزولة (`agent:<agentId>:discord:channel:<channelId>`).
- تُتجاهل الرسائل الخاصة الجماعية افتراضيًا (`channels.discord.dm.groupEnabled=false`).
- تعمل أوامر الشرطة المائلة الأصلية في جلسات أوامر معزولة (`agent:<agentId>:discord:slash:<userId>`)، مع استمرار حمل `CommandTargetSessionKey` إلى جلسة المحادثة الموجّهة.
- يُختزل تسليم الإعلانات النصية فقط من Cron/Heartbeat إلى Discord إلى الإجابة النهائية المرئية من المساعد، وتُرسل مرة واحدة. أما حمولات الوسائط والمكوّنات المنظمة فتظل متعددة الرسائل عندما يصدر الوكيل عدة حمولات قابلة للتسليم.

## قنوات المنتديات

لا تقبل قنوات المنتديات والوسائط في Discord سوى منشورات سلاسل المحادثات. يدعم OpenClaw طريقتين لإنشائها:

- أرسل رسالة إلى أصل المنتدى (`channel:<forumId>`) لإنشاء سلسلة نقاش تلقائيًا. يكون عنوان سلسلة النقاش هو أول سطر غير فارغ من الرسالة (مع اقتطاعه وفق حد Discord البالغ 100 محرف لأسماء سلاسل النقاش).
- استخدم `openclaw message thread create` لإنشاء سلسلة نقاش مباشرةً. لا تمرّر `--message-id` لقنوات المنتدى.

أرسل إلى أصل المنتدى لإنشاء سلسلة نقاش:

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

أنشئ سلسلة نقاش في المنتدى صراحةً:

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

لا تقبل أصول المنتديات مكوّنات Discord. إذا كنت تحتاج إلى مكوّنات، فأرسلها إلى سلسلة النقاش نفسها (`channel:<threadId>`).

## المكوّنات التفاعلية

يدعم OpenClaw حاويات مكوّنات Discord بالإصدار 2 لرسائل الوكيل. استخدم أداة الرسائل مع حمولة `components`. تُوجَّه نتائج التفاعل مجددًا إلى الوكيل كرسائل واردة عادية وتتبع إعدادات Discord الحالية في `replyToMode`.

الكتل المدعومة:

- `text` و`section` و`separator` و`actions` و`media-gallery` و`file`
- تسمح صفوف الإجراءات بما يصل إلى 5 أزرار أو قائمة تحديد واحدة
- أنواع التحديد: `string` و`user` و`role` و`mentionable` و`channel`

تكون المكوّنات أحادية الاستخدام افتراضيًا. عيّن `components.reusable=true` للسماح باستخدام الأزرار وقوائم التحديد والنماذج عدة مرات حتى انتهاء صلاحيتها.

لتقييد من يمكنه النقر على زر، عيّن `allowedUsers` في ذلك الزر (معرّفات مستخدمي Discord أو الوسوم أو `*`). يتلقى المستخدمون غير المطابقين رفضًا مؤقتًا.

تنتهي صلاحية استدعاءات المكوّنات بعد 30 دقيقة افتراضيًا. عيّن `channels.discord.agentComponents.ttlMs` لتغيير مدة بقاء سجل الاستدعاءات للحساب الافتراضي، أو `channels.discord.accounts.<accountId>.agentComponents.ttlMs` لكل حساب. تمثل القيمة أجزاء من ألف من الثانية، ويجب أن تكون عددًا صحيحًا موجبًا، وبحد أقصى `86400000` (24 ساعة). تناسب مدد الصلاحية الأطول سير عمل المراجعة والموافقة الذي يحتاج إلى بقاء الأزرار قابلة للاستخدام، لكنها توسّع النافذة التي يمكن خلالها لرسالة Discord قديمة أن تفعّل إجراءً. فضّل أقصر مدة صلاحية مناسبة، واحتفظ بالقيمة الافتراضية عندما تكون الاستدعاءات القديمة غير متوقعة.

يفتح أمرا الشرطة المائلة `/model` و`/models` منتقي نماذج تفاعليًا يتضمن قوائم منسدلة لمزوّد الخدمة والنموذج وبيئات التشغيل المتوافقة، بالإضافة إلى خطوة Submit. أصبح `/models add` مهمَلًا ويعيد رسالة إهمال بدلًا من تسجيل النماذج من المحادثة. يكون رد المنتقي مؤقتًا ولا يمكن استخدامه إلا بواسطة المستخدم الذي استدعاه. تقتصر قوائم تحديد Discord على 25 خيارًا، لذا أضف إدخالات `provider/*` إلى `agents.defaults.models` عندما تريد أن يعرض المنتقي النماذج المكتشفة ديناميكيًا لمزوّدي خدمات محددين فقط، مثل `openai` أو `vllm`.

مرفقات الملفات:

- يجب أن تشير كتل `file` إلى مرجع مرفق (`attachment://<filename>`)
- وفّر المرفق عبر `media` أو `path` أو `filePath` (ملف واحد)؛ واستخدم `media-gallery` لملفات متعددة
- استخدم `filename` لتجاوز اسم الرفع عندما ينبغي أن يطابق مرجع المرفق

النماذج المشروطة:

- أضف `components.modal` بما يصل إلى 5 حقول
- أنواع الحقول: `text` و`checkbox` و`radio` و`select` و`role-select` و`user-select`
- يضيف OpenClaw زر تشغيل تلقائيًا

مثال:

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optional fallback text",
  components: {
    reusable: true,
    text: "Choose a path",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approve",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "Decline", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Pick an option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Open form",
      fields: [
        { type: "text", label: "Requester" },
        {
          type: "select",
          label: "Priority",
          options: [
            { label: "Low", value: "low" },
            { label: "High", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## التحكم في الوصول والتوجيه

<Tabs>
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.discord.dmPolicy` في الوصول عبر الرسائل المباشرة. تمثل `channels.discord.allowFrom` قائمة السماح الأساسية للرسائل المباشرة.

    - `pairing` (الافتراضي)
    - `allowlist` (يتطلب مرسلًا واحدًا على الأقل في `allowFrom`)
    - `open` (يتطلب أن تتضمن `channels.discord.allowFrom` القيمة `"*"`)
    - `disabled`

    إذا لم تكن سياسة الرسائل المباشرة مفتوحة، فسيُحظر المستخدمون غير المعروفين (أو ستُطلب منهم عملية الاقتران في وضع `pairing`).

    أسبقية الحسابات المتعددة:

    - لا ينطبق `channels.discord.accounts.default.allowFrom` إلا على حساب `default`.
    - بالنسبة إلى حساب واحد، تكون لـ`allowFrom` الأسبقية على `dm.allowFrom` القديمة.
    - ترث الحسابات المسماة `channels.discord.allowFrom` عندما لا تكون `allowFrom` الخاصة بها ولا `dm.allowFrom` القديمة معيّنتين.
    - لا ترث الحسابات المسماة `channels.discord.accounts.default.allowFrom`.

    تستمر قراءة `channels.discord.dm.policy` و`channels.discord.dm.allowFrom` القديمتين لأغراض التوافق. ينقلهما `openclaw doctor --fix` إلى `dmPolicy` و`allowFrom` عندما يستطيع فعل ذلك دون تغيير الوصول.

    تنسيق وجهة الرسائل المباشرة للتسليم:

    - `user:<id>`
    - الإشارة `<@id>`

    تُفسَّر المعرّفات الرقمية المجرّدة عادةً كمعرّفات قنوات عندما يكون إعداد افتراضي للقناة نشطًا، لكن المعرّفات المدرجة في `allowFrom` الفعّالة للرسائل المباشرة في الحساب تُعامل كوجهات رسائل مباشرة للمستخدمين لأغراض التوافق.

  </Tab>

  <Tab title="مجموعات الوصول">
    يمكن للرسائل المباشرة في Discord وتخويل الأوامر النصية استخدام إدخالات `accessGroup:<name>` الديناميكية في `channels.discord.allowFrom`.

    تكون أسماء مجموعات الوصول مشتركة عبر قنوات الرسائل. استخدم `type: "message.senders"` لمجموعة ثابتة يُعبَّر عن أعضائها بصيغة `allowFrom` المعتادة لكل قناة، أو `type: "discord.channelAudience"` عندما ينبغي أن يحدد جمهور `ViewChannel` الحالي لقناة Discord العضوية ديناميكيًا. سلوك مجموعات الوصول المشتركة: [مجموعات الوصول](/ar/channels/access-groups).

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

    لا تحتوي قناة Discord النصية على قائمة أعضاء منفصلة. يصوغ `type: "discord.channelAudience"` العضوية كما يلي: يكون مرسل الرسالة المباشرة عضوًا في الخادم المضبوط، ولديه حاليًا إذن `ViewChannel` فعّال في القناة المضبوطة بعد تطبيق تجاوزات الأدوار والقنوات.

    مثال: اسمح لأي شخص يمكنه رؤية `#maintainers` بإرسال رسالة مباشرة إلى الروبوت، مع إبقاء الرسائل المباشرة مغلقة أمام الجميع سواه.

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

    يمكنك مزج الإدخالات الديناميكية والثابتة:

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers", "discord:123456789012345678"],
    },
  },
}
```

    تُغلق عمليات البحث عند الفشل. إذا أعاد Discord القيمة `Missing Access`، أو فشل البحث عن العضو، أو كانت القناة تابعة لخادم مختلف، فيُعامل مرسل الرسالة المباشرة على أنه غير مخوّل.

    فعّل **Server Members Intent** في Discord Developer Portal عند استخدام مجموعات الوصول المستندة إلى جمهور القنوات. لا تتضمن الرسائل المباشرة حالة العضو في الخادم، لذا يستعلم OpenClaw عن العضو عبر Discord REST وقت التخويل.

  </Tab>

  <Tab title="سياسة الخادم">
    يتحكم `channels.discord.groupPolicy` في معالجة الخوادم:

    - `open`
    - `allowlist`
    - `disabled`

    خط الأساس الآمن عند وجود `channels.discord` هو `allowlist`.

    سلوك `allowlist`:

    - يجب أن يطابق الخادم `channels.discord.guilds` (يُفضّل `id`، ويُقبل المعرّف النصي)
    - قوائم سماح اختيارية للمرسلين: `users` (يُنصح بالمعرّفات الثابتة) و`roles` (معرّفات الأدوار فقط)؛ إذا ضُبط أي منهما، يُسمح للمرسلين عندما يطابقون `users` أو `roles`
    - تكون المطابقة المباشرة للأسماء والوسوم معطّلة افتراضيًا؛ فعّل `channels.discord.dangerouslyAllowNameMatching: true` فقط كوضع توافق للطوارئ
    - تُدعم الأسماء والوسوم في `users`، لكن المعرّفات أكثر أمانًا؛ ويحذّر `openclaw security audit` عند استخدام إدخالات الأسماء أو الوسوم
    - إذا ضُبطت `channels` لخادم، فستُرفض القنوات غير المدرجة
    - إذا لم يحتوِ الخادم على كتلة `channels`، فسيُسمح بكل القنوات في ذلك الخادم المدرج في قائمة السماح

    مثال:

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          ignoreOtherMentions: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { enabled: true },
            help: { enabled: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    ينقل `openclaw doctor --fix` المفتاح القديم `allow` الخاص بكل قناة إلى `enabled`.

    إذا عيّنت `DISCORD_BOT_TOKEN` فقط ولم تنشئ كتلة `channels.discord`، فستكون القيمة الاحتياطية أثناء التشغيل هي `groupPolicy="allowlist"` (مع تحذير في السجلات)، حتى إذا كانت `channels.defaults.groupPolicy` تساوي `open`.

  </Tab>

  <Tab title="الإشارات والرسائل المباشرة الجماعية">
    تتطلب رسائل الخادم الإشارة افتراضيًا.

    يشمل اكتشاف الإشارات:

    - إشارة صريحة إلى الروبوت
    - أنماط الإشارات المضبوطة (`agents.list[].groupChat.mentionPatterns`، مع الرجوع إلى `messages.groupChat.mentionPatterns`)
    - السلوك الضمني للرد على الروبوت في الحالات المدعومة

    عند كتابة رسائل Discord صادرة، استخدم صيغة الإشارة الأساسية: `<@USER_ID>` للمستخدمين و`<#CHANNEL_ID>` للقنوات و`<@&ROLE_ID>` للأدوار. لا تستخدم صيغة الإشارة القديمة للألقاب `<@!USER_ID>`.

    يُضبط `requireMention` لكل خادم أو قناة (`channels.discord.guilds...`).
    يتيح `ignoreOtherMentions` اختياريًا إسقاط الرسائل التي تشير إلى مستخدم أو دور آخر دون الإشارة إلى الروبوت (باستثناء @everyone و@here).

    الرسائل المباشرة الجماعية:

    - الافتراضي: تُتجاهل (`dm.groupEnabled=false`)
    - قائمة سماح اختيارية عبر `dm.groupChannels` (معرّفات القنوات أو معرّفاتها النصية)

  </Tab>
</Tabs>

### توجيه الوكلاء المستند إلى الأدوار

استخدم `bindings[].match.roles` لتوجيه أعضاء خادم Discord إلى وكلاء مختلفين حسب معرّف الدور. لا تقبل الارتباطات المستندة إلى الأدوار إلا معرّفات الأدوار، وتُقيَّم بعد ارتباطات النظير أو النظير الأصل وقبل الارتباطات الخاصة بالخادم فقط. إذا عيّن ارتباط أيضًا حقول مطابقة أخرى (مثل `peer` مع `guildId` و`roles`)، فيجب أن تتطابق جميع الحقول المضبوطة.

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## الأوامر الأصلية وتخويل الأوامر

- الإعداد الافتراضي لـ `commands.native` هو `"auto"`، وهو مفعّل لـ Discord.
- التجاوز الخاص بكل قناة: `channels.discord.commands.native`.
- يؤدي `commands.native=false` إلى تخطي تسجيل أوامر الشرطة المائلة في Discord وتنظيفها أثناء بدء التشغيل. قد تظل الأوامر المسجّلة سابقًا ظاهرة في Discord حتى تزيلها من تطبيق Discord.
- تستخدم مصادقة الأوامر الأصلية قوائم السماح والسياسات نفسها في Discord التي تستخدمها معالجة الرسائل العادية.
- قد تظل الأوامر ظاهرة في واجهة Discord للمستخدمين غير المصرّح لهم؛ يفرض التنفيذ مصادقة OpenClaw ويردّ بالنص "غير مصرّح".
- إعدادات أوامر الشرطة المائلة الافتراضية: `ephemeral: true` ‏(`channels.discord.slashCommand.ephemeral`).

راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands) للاطلاع على دليل الأوامر وسلوكها.

## تفاصيل الميزات

<AccordionGroup>
  <Accordion title="وسوم الرد والردود الأصلية">
    يدعم Discord وسوم الرد في مخرجات الوكيل:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    يتحكم فيها `channels.discord.replyToMode`:

    - `off` (الافتراضي): لا توجد سلاسل رد ضمنية؛ مع الاستمرار في مراعاة وسوم `[[reply_to_*]]` الصريحة
    - `first`: يرفق مرجع الرد الأصلي الضمني بأول رسالة Discord صادرة في الدور
    - `all`: يرفقه بكل رسالة صادرة
    - `batched`: يرفقه فقط عندما يكون الحدث الوارد دفعةً مؤجّلة من رسائل متعددة — وهذا مفيد عندما تريد الردود الأصلية أساسًا للمحادثات المتدفقة الملتبسة، لا لكل دور يتضمن رسالة واحدة

    تظهر معرّفات الرسائل في السياق/السجل كي تتمكن الوكلاء من استهداف رسائل محددة.

  </Accordion>

  <Accordion title="معاينات الروابط">
    ينشئ Discord افتراضيًا تضمينات غنية للروابط من عناوين URL. يحجب OpenClaw افتراضيًا هذه التضمينات المُنشأة في رسائل Discord الصادرة، بحيث تبقى عناوين URL التي يرسلها الوكيل روابط عادية ما لم تفعّلها صراحةً:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    اضبط `channels.discord.accounts.<id>.suppressEmbeds` لتجاوز الإعداد لحساب واحد. ويمكن أيضًا لعمليات الإرسال عبر أداة الرسائل الخاصة بالوكيل تمرير `suppressEmbeds: false` لرسالة واحدة. لا يحجب إعداد معاينة الروابط الافتراضي حمولات `embeds` الصريحة في Discord.

  </Accordion>

  <Accordion title="معاينة البث المباشر">
    يمكن لـ OpenClaw بث مسودات الردود عبر إرسال رسالة مؤقتة وتحريرها مع وصول النص. يقبل `channels.discord.streaming.mode` القيم `off` | `partial` | `block` | `progress` (الافتراضي عند عدم تعيين المفتاح `streaming` أو المفتاح القديم `streamMode`). يمثّل `streamMode` اسمًا مستعارًا قديمًا؛ شغّل `openclaw doctor --fix` لإعادة كتابة الإعداد المحفوظ إلى بنية `streaming` المتداخلة القياسية.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: true,
          commentary: false,
        },
      },
    },
  },
}
```

    - يعطّل `off` تعديلات المعاينة في Discord.
    - يعدّل `partial` رسالة معاينة واحدة مع وصول الرموز.
    - يصدر `block` أجزاءً بحجم المسودة؛ اضبط الحجم ونقاط الفصل باستخدام `streaming.preview.chunk` ‏(`minChars` و`maxChars` و`breakPreference`)، مع تقييدها بـ `textChunkLimit`. عند تفعيل البث بالكتل صراحةً، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.
    - يحتفظ `progress` بمسودة حالة واحدة قابلة للتحرير ويحدّثها بتقدّم الأدوات حتى التسليم النهائي؛ وتكون تسمية البدء المشتركة سطرًا متحركًا، لذا تختفي بالتمرير مثل بقية المحتوى بعد ظهور قدر كافٍ من العمل.
    - تؤدي النتائج النهائية التي تتضمن وسائط أو أخطاء أو ردودًا صريحة إلى إلغاء تعديلات المعاينة المعلّقة.
    - يتحكم `streaming.preview.toolProgress` (الافتراضي `true`) فيما إذا كانت تحديثات الأداة/التقدّم تعيد استخدام رسالة المعاينة.
    - تُعرض صفوف الأداة/التقدّم بشكل مضغوط يتكوّن من رمز تعبيري + عنوان + تفاصيل عند توفرها، مثل `🛠️ Bash: تشغيل الاختبارات` أو `🔎 Web Search: عن "الاستعلام"`.
    - يفعّل `streaming.progress.commentary` (الافتراضي `false`) نص تعليقات/تمهيد المساعد في مسودة التقدّم المؤقتة. يُنقّى التعليق قبل عرضه، ويظل مؤقتًا، ولا يغيّر تسليم الإجابة النهائية.
    - يتحكم `streaming.progress.maxLineChars` في الحد المخصص لكل سطر في معاينة التقدّم. يُختصر النثر عند حدود الكلمات؛ بينما تحتفظ تفاصيل الأوامر والمسارات باللواحق المفيدة.
    - يتحكم `streaming.preview.commandText` / `streaming.progress.commandText` في تفاصيل الأوامر/التنفيذ ضمن أسطر التقدّم المضغوطة: `raw` (الافتراضي) أو `status` (تسمية الأداة فقط).

    أخفِ نص الأوامر/التنفيذ الخام مع الإبقاء على أسطر التقدّم المضغوطة:

    ```json
    {
      "channels": {
        "discord": {
          "streaming": {
            "mode": "progress",
            "progress": {
              "toolProgress": true,
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    يقتصر بث المعاينة على النص؛ وتعود ردود الوسائط إلى التسليم العادي.

  </Accordion>

  <Accordion title="السجل والسياق وسلوك سلاسل المحادثة">
    سياق سجل الخادم:

    - القيمة الافتراضية لـ `channels.discord.historyLimit` هي `20`
    - الاحتياطي: `messages.groupChat.historyLimit`
    - تؤدي القيمة `0` إلى التعطيل

    عناصر التحكم في سجل الرسائل الخاصة:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    سلوك سلاسل المحادثة:

    - تُوجَّه سلاسل محادثات Discord على أنها جلسات قناة وترث إعداد القناة الأم ما لم يُتجاوز.
    - ترث جلسات سلاسل المحادثة تحديد `/model` على مستوى جلسة القناة الأم كخيار احتياطي للنموذج فقط؛ وتحظى تحديدات `/model` المحلية في سلسلة المحادثة بالأولوية، ولا يُنسخ سجل نص المحادثة الأم ما لم يُفعّل توارث نص المحادثة.
    - يتيح `channels.discord.thread.inheritParent` (الافتراضي `false`) لسلاسل المحادثة التلقائية الجديدة البدء من نص محادثة القناة الأم. التجاوز الخاص بكل حساب: `channels.discord.accounts.<id>.thread.inheritParent`.
    - يمكن لتفاعلات أداة الرسائل تحليل أهداف الرسائل الخاصة من النوع `user:<id>`.
    - يُحتفظ بـ `guilds.<guild>.channels.<channel>.requireMention: false` أثناء الرجوع الاحتياطي لتفعيل مرحلة الرد.

    تُدرج موضوعات القنوات كسياق **غير موثوق**. تتحكم قوائم السماح في من يمكنه تشغيل الوكيل، ولا تمثّل حدًا كاملًا لتنقيح السياق الإضافي.

  </Accordion>

  <Accordion title="الجلسات المرتبطة بسلاسل المحادثة للوكلاء الفرعيين">
    يمكن لـ Discord ربط سلسلة محادثة بهدف جلسة بحيث تستمر الرسائل اللاحقة في تلك السلسلة بالتوجيه إلى الجلسة نفسها (بما في ذلك جلسات الوكلاء الفرعيين).

    الأوامر:

    - `/focus <target>` ربط سلسلة المحادثة الحالية/الجديدة بهدف وكيل فرعي/جلسة
    - `/unfocus` إزالة ارتباط سلسلة المحادثة الحالية
    - `/agents` عرض عمليات التشغيل النشطة وحالة الارتباط
    - `/session idle <duration|off>` فحص/تحديث إلغاء التركيز التلقائي بسبب عدم النشاط للارتباطات المركّزة
    - `/session max-age <duration|off>` فحص/تحديث الحد الأقصى الصارم لعمر الارتباطات المركّزة

    الإعداد:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSessions: true,
        defaultSpawnContext: "fork",
      },
    },
  },
}
```

    ملاحظات:

    - يعيّن `session.threadBindings.*` الإعدادات الافتراضية العامة؛ ويتجاوز `channels.discord.threadBindings.*` سلوك Discord.
    - يتحكم `spawnSessions` في الإنشاء/الربط التلقائي لسلاسل المحادثة من أجل `sessions_spawn({ thread: true })` وعمليات إنشاء سلاسل ACP. الافتراضي: `true`.
    - يتحكم `defaultSpawnContext` في سياق الوكيل الفرعي الأصلي لعمليات الإنشاء المرتبطة بسلاسل المحادثة. الافتراضي: `"fork"`.
    - يرحّل `openclaw doctor --fix` المفتاحين المهملين `spawnSubagentSessions` و`spawnAcpSessions`.
    - إذا كانت ارتباطات سلاسل المحادثة معطّلة لحساب، فلن يتوفر `/focus` ولا عمليات ربط سلاسل المحادثة ذات الصلة.

    راجع [الوكلاء الفرعيين](/ar/tools/subagents) و[وكلاء ACP](/ar/tools/acp-agents) و[مرجع الإعداد](/ar/gateway/configuration-reference).

  </Accordion>

  <Accordion title="ارتباطات قنوات ACP الدائمة">
    لمساحات عمل ACP المستقرة و"دائمة التشغيل"، اضبط ارتباطات ACP محددة النوع في المستوى الأعلى تستهدف محادثات Discord.

    مسار الإعداد: `bindings[]` مع `type: "acp"` و`match.channel: "discord"`.

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    ملاحظات:

    - يربط `/acp spawn codex --bind here` القناة أو سلسلة المحادثة الحالية في موضعها، ويُبقي الرسائل المستقبلية على جلسة ACP نفسها. ترث رسائل سلسلة المحادثة ارتباط القناة الأم.
    - في قناة أو سلسلة محادثة مرتبطة، يعيد `/new` و`/reset` ضبط جلسة ACP نفسها في موضعها. ويمكن لارتباطات سلاسل المحادثة المؤقتة تجاوز تحليل الهدف ما دامت نشطة.
    - يتحكم `spawnSessions` في إنشاء/ربط سلاسل المحادثة الفرعية عبر `--thread auto|here`.

    راجع [وكلاء ACP](/ar/tools/acp-agents) للاطلاع على تفاصيل سلوك الارتباط.

  </Accordion>

  <Accordion title="إشعارات التفاعلات">
    وضع إشعارات التفاعلات لكل خادم (`guilds.<id>.reactionNotifications`):

    - `off`
    - `own` (الافتراضي)
    - `all`
    - `allowlist` (يستخدم `guilds.<id>.users`)

    تُحوّل أحداث التفاعل إلى أحداث نظام وتُرفق بجلسة Discord الموجّهة.

  </Accordion>

  <Accordion title="تفاعلات الإقرار">
    يرسل `ackReaction` رمزًا تعبيريًا للإقرار بينما يعالج OpenClaw رسالة واردة.

    ترتيب التحليل:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - الرجوع إلى الرمز التعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يقبل Discord الرموز التعبيرية الموحّدة أو أسماء الرموز التعبيرية المخصصة.
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

    **النطاق (`messages.ackReactionScope`):**

    القيم: `"all"` (الرسائل الخاصة + المجموعات، بما في ذلك أحداث الغرف المحيطة)، و`"direct"` (الرسائل الخاصة فقط)، و`"group-all"` (كل رسالة جماعية باستثناء أحداث الغرف المحيطة، من دون رسائل خاصة)، و`"group-mentions"` (المجموعات عند الإشارة إلى البوت؛ **من دون رسائل خاصة**، الافتراضي)، و`"off"` / `"none"` (معطّل).

    <Note>
    لا يشغّل النطاق الافتراضي (`"group-mentions"`) تفاعلات الإقرار في الرسائل المباشرة أو أحداث الغرف المحيطة. للحصول على تفاعل إقرار على رسائل Discord الخاصة الواردة وأحداث الغرف الهادئة، اضبط `messages.ackReactionScope` على `"all"`.
    </Note>

  </Accordion>

  <Accordion title="كتابة الإعداد">
    تكون عمليات كتابة الإعداد التي تبدأها القناة مفعّلة افتراضيًا. يؤثر هذا في مسارات `/config set|unset` (عندما تكون ميزات الأوامر مفعّلة).

    للتعطيل:

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="وكيل Gateway">
    وجّه حركة WebSocket الخاصة بـ Gateway في Discord وعمليات بحث REST عند بدء التشغيل (معرّف التطبيق + تحليل قائمة السماح) عبر وكيل HTTP(S) باستخدام `channels.discord.proxy`.
    استخدام وكيل لحركة WebSocket الخاصة بـ Gateway في Discord صريح؛ ولا ترث اتصالات WebSocket متغيرات بيئة الوكيل المحيطة من عملية Gateway. تستخدم عمليات بحث REST عند بدء التشغيل هذا الوكيل عند ضبط `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    التجاوز الخاص بكل حساب:

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="دعم PluralKit">
    فعّل تحليل PluralKit لربط الرسائل المرسلة بالوكالة بهوية عضو النظام:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // اختياري؛ مطلوب للأنظمة الخاصة
      },
    },
  },
}
```

    ملاحظات:

    - يمكن لقوائم السماح استخدام `pk:<memberId>`
    - تُطابَق أسماء العرض للأعضاء بالاسم/المعرّف النصي فقط عندما تكون `channels.discord.dangerouslyAllowNameMatching: true`
    - تستعلم عمليات البحث من واجهة PluralKit API باستخدام معرّف الرسالة الأصلي
    - إذا فشل البحث، تُعامل الرسائل الممرَّرة بالوكالة كرسائل روبوت وتُسقَط ما لم يسمح `allowBots` بمرورها

  </Accordion>

  <Accordion title="الأسماء المستعارة للإشارات الصادرة">
    استخدم `mentionAliases` عندما تحتاج الوكلاء إلى إشارات صادرة حتمية لمستخدمي Discord المعروفين. المفاتيح هي المعرّفات من دون السابقة `@`؛ والقيم هي معرّفات مستخدمي Discord. تُترك المعرّفات غير المعروفة و`@everyone` و`@here` والإشارات داخل مقاطع شيفرة Markdown بلا تغيير.

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        SupportLead: "123456789012345678",
      },
      accounts: {
        ops: {
          mentionAliases: {
            OpsLead: "234567890123456789",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="إعداد حالة الحضور">
    تُطبَّق تحديثات حالة الحضور عند تعيين حقل للحالة أو النشاط، أو عند تمكين الحضور التلقائي.

    الحالة فقط:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    النشاط (الحالة المخصصة هي نوع النشاط الافتراضي عند تعيين `activity`):

```json5
{
  channels: {
    discord: {
      activity: "وقت التركيز",
      activityType: 4,
    },
  },
}
```

    البث المباشر:

```json5
{
  channels: {
    discord: {
      activity: "برمجة مباشرة",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    خريطة أنواع النشاط:

    - 0: يلعب
    - 1: يبث مباشرة (يتطلب `activityUrl`؛ ويتطلب `activityUrl` بدوره `activityType: 1`)
    - 2: يستمع
    - 3: يشاهد
    - 4: مخصص (يستخدم نص النشاط بوصفه حالة الحضور؛ والرمز التعبيري اختياري)
    - 5: يتنافس

    الحضور التلقائي (إشارة سلامة وقت التشغيل):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "نفد الرمز المميز",
      },
    },
  },
}
```

    يربط الحضور التلقائي توفر وقت التشغيل بحالة Discord: سليم => متصل، متدهور أو غير معروف => خامل، مستنفد أو غير متاح => عدم الإزعاج. القيم الافتراضية: `intervalMs` تساوي 30000، و`minUpdateIntervalMs` تساوي 15000 (ويجب أن تكون أقل من `intervalMs` أو مساوية لها). تجاوزات النص الاختيارية:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (يدعم العنصر النائب `{reason}`)

  </Accordion>

  <Accordion title="الموافقات في Discord">
    يدعم Discord معالجة الموافقات المستندة إلى الأزرار في الرسائل الخاصة، ويمكنه اختياريًا نشر مطالبات الموافقة في القناة التي نشأ منها الطلب.

    مسار الإعداد:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختياري؛ يعود إلى `commands.ownerAllowFrom` عند الإمكان)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
    - `agentFilter`، و`sessionFilter`، و`cleanupAfterResolve`

    يمكّن Discord موافقات التنفيذ الأصلية تلقائيًا عندما لا تكون `enabled` معيّنة أو تكون `"auto"` ويمكن تحديد موافِق واحد على الأقل، إما من `execApprovals.approvers` أو من `commands.ownerAllowFrom`. لا يستنتج Discord موافقي التنفيذ من `allowFrom` الخاصة بالقناة، أو `dm.allowFrom` القديمة، أو `defaultTo` للرسائل المباشرة. عيّن `enabled: false` لتعطيل Discord صراحةً بوصفه عميل موافقة أصليًا.

    بالنسبة إلى أوامر المجموعات الحساسة والمقصورة على المالك مثل `/diagnostics` و`/export-trajectory`، يرسل OpenClaw مطالبات الموافقة والنتائج النهائية على نحو خاص. يحاول أولًا استخدام رسالة Discord خاصة عندما يكون للمالك المستدعي مسار مالك في Discord؛ وإلا فيعود إلى أول مسار مالك متاح من `commands.ownerAllowFrom`، مثل Telegram.

    عندما تكون `target` هي `channel` أو `both`، تظهر مطالبة الموافقة في القناة. لا يمكن استخدام الأزرار إلا بواسطة الموافِقين المحددين؛ ويتلقى المستخدمون الآخرون رفضًا مؤقتًا لا يظهر إلا لهم. تتضمن مطالبات الموافقة نص الأمر، لذا لا تمكّن التسليم إلى القناة إلا في القنوات الموثوقة. إذا تعذر اشتقاق معرّف القناة من مفتاح الجلسة، يعود OpenClaw إلى التسليم عبر الرسائل الخاصة.

    يعرض Discord أزرار الموافقة المشتركة التي تستخدمها قنوات الدردشة الأخرى؛ ويضيف محول Discord الأصلي أساسًا توجيه الرسائل الخاصة إلى الموافِقين والتوزيع على القنوات. عند وجود هذه الأزرار، تكون هي تجربة المستخدم الأساسية للموافقة؛ ولا ينبغي لـ OpenClaw تضمين أمر `/approve` يدوي إلا عندما تشير نتيجة الأداة إلى أن موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد. إذا لم يكن وقت تشغيل الموافقة الأصلي في Discord نشطًا، يُبقي OpenClaw مطالبة `/approve <id> <decision>` المحلية والحتمية ظاهرة. وإذا كان وقت التشغيل نشطًا لكن تعذر تسليم بطاقة أصلية إلى أي وجهة، يرسل OpenClaw إشعارًا احتياطيًا في الدردشة نفسها يتضمن أمر `/approve` الدقيق من الموافقة المعلّقة.

    تتبع مصادقة Gateway وحل الموافقات عقد عميل Gateway المشترك (تُحل معرّفات `plugin:` عبر `plugin.approval.resolve`؛ والمعرّفات الأخرى عبر `exec.approval.resolve`). تنتهي صلاحية الموافقات بعد 30 دقيقة افتراضيًا.

    راجع [موافقات التنفيذ](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## الأدوات وبوابات الإجراءات

تغطي إجراءات رسائل Discord المراسلة وإدارة القنوات والإشراف والحضور والبيانات الوصفية.

أمثلة أساسية:

- المراسلة: `sendMessage`، و`readMessages`، و`editMessage`، و`deleteMessage`، و`threadReply`
- التفاعلات: `react`، و`reactions`، و`emojiList`
- الإشراف: `timeout`، و`kick`، و`ban`
- الحضور: `setPresence`

يقبل الإجراء `event-create` معامل `image` اختياريًا (عنوان URL أو مسار ملف محلي) لتعيين صورة غلاف الحدث المجدول.

توجد بوابات الإجراءات ضمن `channels.discord.actions.*`.

سلوك البوابات الافتراضي:

| مجموعة الإجراءات                                                                                                                                                             | الافتراضي  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| `reactions`، و`messages`، و`threads`، و`pins`، و`polls`، و`search`، و`memberInfo`، و`roleInfo`، و`channelInfo`، و`channels`، و`voiceStatus`، و`events`، و`stickers`، و`emojiUploads`، و`stickerUploads`، و`permissions` | مُمكَّنة  |
| `roles`                                                                                                                                                                    | معطّلة |
| `moderation`                                                                                                                                                               | معطّلة |
| `presence`                                                                                                                                                                 | معطّلة |

## واجهة مستخدم المكونات بالإصدار الثاني

يستخدم OpenClaw مكونات Discord بالإصدار الثاني لموافقات التنفيذ وعلامات السياقات المتقاطعة. ويمكن لإجراءات رسائل Discord أيضًا قبول `components` لإنشاء واجهة مستخدم مخصصة (متقدم؛ يتطلب إنشاء حمولة مكونات عبر أداة Discord)، بينما تظل `embeds` القديمة متاحة لكن لا يُنصح بها.

- يعيّن `channels.discord.ui.components.accentColor` لون التمييز الذي تستخدمه حاويات مكونات Discord (بالصيغة السداسية العشرية). لكل حساب: `channels.discord.accounts.<id>.ui.components.accentColor`.
- يتحكم `channels.discord.agentComponents.ttlMs` في مدة بقاء استدعاءات مكونات Discord المُرسلة مسجلة (الافتراضي `1800000`، والحد الأقصى `86400000`). لكل حساب: `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- تُتجاهل `embeds` عند وجود مكونات الإصدار الثاني.
- تُمنع معاينات عناوين URL العادية افتراضيًا. عيّن `suppressEmbeds: false` في إجراء رسالة عندما ينبغي توسيع رابط صادر واحد.

مثال:

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## الصوت

يحتوي Discord على سطحين صوتيين متميزين: **القنوات الصوتية** في الوقت الفعلي (محادثات مستمرة) و**مرفقات الرسائل الصوتية** (تنسيق معاينة الشكل الموجي). يدعم Gateway كليهما.

### القنوات الصوتية

قائمة تحقق الإعداد:

1. فعّل Message Content Intent في Discord Developer Portal.
2. فعّل Server Members Intent عند استخدام قوائم السماح للأدوار/المستخدمين.
3. ادعُ الروبوت باستخدام النطاقين `bot` و`applications.commands`.
4. امنح أذونات Connect وSpeak وSend Messages وRead Message History في القناة الصوتية المستهدفة.
5. فعّل الأوامر الأصلية (`commands.native` أو `channels.discord.commands.native`).
6. اضبط `channels.discord.voice`.

استخدم `/vc join|leave|status` للتحكم في الجلسات. يستخدم الأمر الوكيل الافتراضي للحساب ويتبع قواعد قوائم السماح وسياسات المجموعات نفسها المتبعة في أوامر Discord الأخرى.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

لفحص الأذونات الفعلية للروبوت قبل الانضمام:

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

مثال على الانضمام التلقائي:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.6-sol",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

ملاحظات:

- يُعد صوت Discord ميزة اختيارية في إعدادات النص فقط؛ اضبط `channels.discord.voice.enabled=true` (أو احتفظ بكتلة `channels.discord.voice` موجودة) لتمكين أوامر `/vc`، وبيئة تشغيل الصوت، وهدف Gateway المسمى `GuildVoiceStates`. يمكن لـ `channels.discord.intents.voiceStates` تجاوز الاشتراك في الهدف صراحةً؛ اتركه من دون ضبط ليتبع حالة التمكين الفعلية للصوت.
- يتحكم `voice.mode` في مسار المحادثة. الوضع الافتراضي هو `agent-proxy`: تتولى واجهة صوتية أمامية في الوقت الفعلي توقيت الأدوار، والمقاطعة، والتشغيل، وتفوّض العمل الجوهري إلى وكيل OpenClaw الموجّه عبر `openclaw_agent_consult`، وتتعامل مع النتيجة كموجّه Discord مكتوب صادر عن ذلك المتحدث. يحتفظ `stt-tts` بمسار التحويل الدفعي الأقدم من الكلام إلى نص ثم من النص إلى كلام. يتيح `bidi` للنموذج في الوقت الفعلي إجراء المحادثة مباشرةً مع إتاحة `openclaw_agent_consult` لعقل OpenClaw.
- يتحكم `voice.agentSession` في محادثة OpenClaw التي تستقبل الأدوار الصوتية. اتركه من دون ضبط لاستخدام جلسة القناة الصوتية نفسها، أو اضبطه على `{ mode: "target", target: "channel:<text-channel-id>" }` لجعل القناة الصوتية تعمل امتدادًا للميكروفون/مكبر الصوت لجلسة قناة نصية موجودة في Discord مثل `#maintainers`.
- يتجاوز `voice.model` عقل وكيل OpenClaw المستخدم لردود Discord الصوتية والاستشارات في الوقت الفعلي. اتركه من دون ضبط ليرث نموذج الوكيل الموجّه. وهو منفصل عن `voice.realtime.model`.
- يتيح `voice.followUsers` للبوت الانضمام إلى صوت Discord والتنقل فيه ومغادرته مع مستخدمين محددين. راجع [متابعة المستخدمين في الصوت](#follow-users-in-voice).
- يوجّه `agent-proxy` الكلام عبر `discord-voice`، مما يحافظ على تفويض المالك/الأدوات المعتاد للمتحدث والجلسة المستهدفة، لكنه يخفي أداة الوكيل `tts` لأن صوت Discord يتولى التشغيل. افتراضيًا، يمنح `agent-proxy` الاستشارة وصولًا كاملًا إلى الأدوات مكافئًا لوصول المالك للمتحدثين المالكين (`voice.realtime.toolPolicy: "owner"`)، ويفضّل بشدة استشارة وكيل OpenClaw قبل تقديم الإجابات الجوهرية (`voice.realtime.consultPolicy: "always"`). في وضع `always` الافتراضي هذا، لا تنطق طبقة الوقت الفعلي تلقائيًا بكلام حشو قبل إجابة الاستشارة؛ بل تلتقط الكلام وتحوّله إلى نص، ثم تنطق إجابة OpenClaw الموجّهة. إذا اكتملت عدة إجابات استشارة إلزامية بينما لا يزال Discord يشغّل الإجابة الأولى، توضع إجابات النطق الحرفي اللاحقة في طابور حتى يصبح التشغيل خاملًا بدلًا من استبدال الكلام في منتصف الجملة.
- في وضع `stt-tts`، يستخدم التحويل من الكلام إلى نص `tools.media.audio`؛ ولا يؤثر `voice.model` في النسخ النصي.
- في أوضاع الوقت الفعلي، تضبط `voice.realtime.provider` و`voice.realtime.model` و`voice.realtime.speakerVoice` جلسة الصوت في الوقت الفعلي. لاستخدام OpenAI Realtime 2.1 مع عقل Codex، استخدم `voice.realtime.model: "gpt-realtime-2.1"` و`voice.model: "openai/gpt-5.6-sol"`.
- تتضمن أوضاع الصوت في الوقت الفعلي افتراضيًا ملفات التعريف الصغيرة `IDENTITY.md` و`USER.md` و`SOUL.md` ضمن تعليمات مزوّد الوقت الفعلي، بحيث تحافظ الأدوار المباشرة السريعة على الهوية نفسها، والارتكاز إلى المستخدم، والشخصية نفسها الخاصة بوكيل OpenClaw الموجّه. اضبط `voice.realtime.bootstrapContextFiles` على مجموعة فرعية لتخصيص ذلك، أو على `[]` لتعطيله. لا تُدعم سوى ملفات التعريف هذه؛ ويبقى `AGENTS.md` ضمن سياق الوكيل المعتاد. لا يحل سياق التعريف المحقون محل `openclaw_agent_consult` عند تنفيذ أعمال مساحة العمل، أو جلب الحقائق الحالية، أو البحث في الذاكرة، أو تنفيذ الإجراءات المدعومة بالأدوات.
- في وضع الوقت الفعلي `agent-proxy` لدى OpenAI، اضبط `voice.realtime.requireWakeName: true` لإبقاء صوت Discord في الوقت الفعلي صامتًا حتى يبدأ النسخ النصي أو ينتهي باسم تنبيه. يجب أن تتكون أسماء التنبيه المضبوطة من كلمة أو كلمتين. إذا لم يُضبط `voice.realtime.wakeNames`، يستخدم OpenClaw قيمة `name` للوكيل الموجّه إضافةً إلى `OpenClaw`، مع الرجوع إلى معرّف الوكيل إضافةً إلى `OpenClaw` عند التعذر. يؤدي التقييد باسم التنبيه إلى تعطيل الاستجابة التلقائية لمزوّد الوقت الفعلي، وتوجيه الأدوار المقبولة عبر مسار استشارة وكيل OpenClaw، وتقديم إقرار صوتي قصير عند التعرّف على اسم تنبيه في البداية من النسخ الجزئي قبل وصول النسخ النهائي.
- يقبل مزوّد OpenAI للوقت الفعلي أسماء أحداث Realtime 2 الحالية والأسماء البديلة القديمة المتوافقة مع Codex لأحداث إخراج الصوت والنسخ النصي، بحيث يمكن أن تنحرف لقطات المزوّد المتوافقة من دون إسقاط صوت المساعد.
- يتحكم `voice.realtime.bargeIn` في ما إذا كانت أحداث بدء المتحدث في Discord تقاطع التشغيل النشط في الوقت الفعلي. إذا لم يُضبط، فإنه يتبع إعداد مقاطعة صوت الإدخال لدى مزوّد الوقت الفعلي.
- يتحكم `voice.realtime.minBargeInAudioEndMs` في الحد الأدنى لمدة تشغيل المساعد قبل أن تؤدي مقاطعة في الوقت الفعلي من OpenAI إلى اقتطاع الصوت. القيمة الافتراضية: `250`. اضبطه على `0` للمقاطعة الفورية في الغرف منخفضة الصدى، أو ارفعه لإعدادات مكبرات الصوت ذات الصدى الشديد.
- يتجاوز `voice.tts` قيمة `messages.tts` لتشغيل الصوت في وضع `stt-tts` فقط؛ وتستخدم أوضاع الوقت الفعلي `voice.realtime.speakerVoice` بدلًا منه. لاستخدام صوت من OpenAI في تشغيل Discord، اضبط `voice.tts.provider: "openai"` واختر صوتًا لتحويل النص إلى كلام ضمن `voice.tts.providers.openai.speakerVoice`. يُعد `cedar` خيارًا جيدًا ذا طابع صوتي ذكوري في نموذج OpenAI الحالي لتحويل النص إلى كلام.
- تنطبق تجاوزات `systemPrompt` الخاصة بكل قناة في Discord على أدوار النسخ الصوتي لتلك القناة الصوتية.
- تستمد أدوار النسخ الصوتي حالة المالك من `allowFrom` في Discord (أو `dm.allowFrom`) للأوامر وإجراءات القنوات المقيّدة بالمالك. ويتبع ظهور أدوات الوكيل سياسة الأدوات المضبوطة للجلسة الموجّهة.
- إذا احتوى `voice.autoJoin` على عدة إدخالات للخادم نفسه، ينضم OpenClaw إلى آخر قناة مضبوطة لذلك الخادم.
- تمثل `voice.allowedChannels` قائمة سماح اختيارية للإقامة. اتركها من دون ضبط للسماح للأمر `/vc join` بالانضمام إلى أي قناة صوتية مصرّح بها في Discord. عند ضبطها، تُقيّد عمليات `/vc join` والانضمام التلقائي عند بدء التشغيل وتنقلات الحالة الصوتية للبوت إلى إدخالات `{ guildId, channelId }` المدرجة. اضبطها على مصفوفة فارغة لمنع جميع عمليات الانضمام إلى صوت Discord. إذا نقل Discord البوت خارج قائمة السماح، يغادر OpenClaw تلك القناة ويعيد الانضمام إلى هدف الانضمام التلقائي المضبوط عند توفره.
- تُمرَّر `voice.daveEncryption` و`voice.decryptionFailureTolerance` إلى خيارات الانضمام في `@discordjs/voice`؛ والقيم الافتراضية في المصدر الأعلى هي `daveEncryption=true` و`decryptionFailureTolerance=24`.
- يستخدم OpenClaw برنامج الترميز المضمّن `libopus-wasm` لاستقبال صوت Discord وتشغيل PCM الخام في الوقت الفعلي. وهو يتضمن إصدارًا مثبتًا من libopus المبني باستخدام WebAssembly ولا يتطلب إضافات opus أصلية.
- يتحكم `voice.connectTimeoutMs` في مدة الانتظار الأولية لحالة `@discordjs/voice` المسماة Ready لمحاولات `/vc join` والانضمام التلقائي. القيمة الافتراضية: `30000`.
- يتحكم `voice.reconnectGraceMs` في المدة التي ينتظرها OpenClaw حتى تبدأ جلسة صوتية منقطعة الاتصال بإعادة الاتصال قبل إتلافها. القيمة الافتراضية: `15000`.
- في وضع `stt-tts`، لا يتوقف تشغيل الصوت لمجرد أن مستخدمًا آخر بدأ الكلام. لتجنب حلقات التغذية الراجعة، يتجاهل OpenClaw التقاط صوت جديد أثناء تشغيل تحويل النص إلى كلام؛ تحدث بعد انتهاء التشغيل لبدء الدور التالي. تمرر أوضاع الوقت الفعلي بدايات المتحدثين كإشارات مقاطعة إلى مزوّد الوقت الفعلي.
- في أوضاع الوقت الفعلي، قد يبدو صدى مكبرات الصوت الداخل إلى ميكروفون مفتوح كمقاطعة ويوقف التشغيل. في غرف Discord شديدة الصدى، اضبط `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` لمنع OpenAI من المقاطعة التلقائية عند وجود صوت إدخال. أضف `voice.realtime.bargeIn: true` إذا كنت لا تزال تريد أن تقاطع أحداث بدء المتحدث في Discord التشغيل النشط. يتجاهل جسر OpenAI للوقت الفعلي اقتطاعات التشغيل الأقصر من `voice.realtime.minBargeInAudioEndMs` باعتبارها على الأرجح صدى/ضوضاء، ويسجلها كمتخطاة بدلًا من مسح تشغيل Discord.
- يتحكم `voice.captureSilenceGraceMs` في المدة التي ينتظرها OpenClaw بعد أن يبلغ Discord عن توقف متحدث، قبل إنهاء ذلك المقطع الصوتي لتحويل الكلام إلى نص. القيمة الافتراضية: `2000`؛ ارفعها إذا كان Discord يقسم فترات التوقف الطبيعية إلى نسخ جزئية متقطعة.
- عندما يكون ElevenLabs هو مزوّد تحويل النص إلى كلام المحدد، يستخدم تشغيل صوت Discord تحويل النص إلى كلام بالتدفق ويبدأ من تدفق استجابة المزوّد. أما المزوّدون الذين لا يدعمون التدفق فيرجعون إلى مسار الملف المؤقت المُركّب.
- يراقب OpenClaw حالات فشل فك تشفير الاستقبال ويتعافى تلقائيًا عبر مغادرة القناة الصوتية وإعادة الانضمام إليها بعد تكرر حالات الفشل ضمن فترة قصيرة.
- إذا أظهرت سجلات الاستقبال مرارًا `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` بعد التحديث، فاجمع تقريرًا عن الاعتماديات والسجلات. يتضمن إصدار `@discordjs/voice` المضمّن إصلاح الحشو من طلب السحب رقم #11449 في discord.js، الذي أغلق المشكلة رقم #11419 في discord.js.
- تُعد أحداث الاستقبال `The operation was aborted` متوقعة عندما ينهي OpenClaw مقطعًا ملتقطًا للمتحدث؛ وهي تشخيصات تفصيلية وليست تحذيرات.
- تتضمن سجلات صوت Discord التفصيلية معاينة محدودة من سطر واحد لنسخ التحويل من الكلام إلى نص لكل مقطع متحدث مقبول، بحيث يُظهر تصحيح الأخطاء جانب المستخدم وجانب رد الوكيل من دون تفريغ نص نسخ غير محدود.
- في وضع `agent-proxy`، يتخطى الرجوع إلى الاستشارة الإلزامية أجزاء النسخ التي يُرجّح أنها غير مكتملة، مثل النص المنتهي بـ `...` أو بأداة ربط ختامية مثل "و"، إضافةً إلى العبارات الختامية الواضحة التي لا تتطلب إجراءً مثل "سأعود حالًا" أو "وداعًا". تعرض السجلات `forced agent consult skipped reason=...` عندما يمنع ذلك إجابة قديمة في الطابور.

### متابعة المستخدمين في الصوت

استخدم `voice.followUsers` عندما تريد أن يبقى بوت صوت Discord مع مستخدم واحد أو أكثر من مستخدمي Discord المعروفين بدلًا من الانضمام إلى قناة ثابتة عند بدء التشغيل أو انتظار `/vc join`.

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        followUsersEnabled: true,
        followUsers: ["discord:123456789012345678"],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
      },
    },
  },
}
```

السلوك:

- يقبل `followUsers` معرّفات مستخدمي Discord الخام وقيم `discord:<id>`. يوحّد OpenClaw كلا الشكلين قبل مطابقة أحداث الحالة الصوتية.
- تكون القيمة الافتراضية لـ `followUsersEnabled` هي `true` عند ضبط `followUsers`. اضبطها على `false` للاحتفاظ بالقائمة المحفوظة مع إيقاف المتابعة الصوتية التلقائية.
- عندما ينضم مستخدم متابَع إلى قناة صوتية مسموح بها، ينضم OpenClaw إلى تلك القناة. وعندما ينتقل المستخدم، ينتقل OpenClaw معه. وعندما ينقطع اتصال المستخدم المتابَع النشط، يغادر OpenClaw.
- إذا كان عدة مستخدمين متابَعين في الخادم نفسه وغادر المستخدم المتابَع النشط، ينتقل OpenClaw إلى قناة مستخدم متابَع آخر يجري تتبعه قبل مغادرة الخادم. وإذا انتقل عدة مستخدمين متابَعين في الوقت نفسه، يفوز آخر حدث حالة صوتية تمت ملاحظته.
- تظل `allowedChannels` سارية. يُتجاهل المستخدم المتابَع الموجود في قناة غير مسموح بها، وتنتقل الجلسة المملوكة للمتابعة إلى مستخدم متابَع آخر أو تغادر.
- يوفّق OpenClaw أحداث الحالة الصوتية الفائتة عند بدء التشغيل وعلى فاصل زمني محدود. تأخذ عملية التوفيق عينات من الخوادم المضبوطة وتضع حدًا لعمليات بحث REST في كل تشغيل، لذا قد تحتاج قوائم `followUsers` الكبيرة جدًا إلى أكثر من فاصل زمني واحد للوصول إلى الحالة المتسقة.
- إذا نقل Discord أو مسؤول البوت أثناء متابعته لمستخدم، يعيد OpenClaw بناء الجلسة الصوتية ويحافظ على ملكية المتابعة عندما تكون الوجهة مسموحًا بها. وإذا نُقل البوت خارج `allowedChannels`، يغادر OpenClaw ويعيد الانضمام إلى الهدف المضبوط عند وجوده.
- قد يغادر تعافي استقبال DAVE القناة نفسها ويعيد الانضمام إليها بعد تكرر حالات فشل فك التشفير. تحتفظ الجلسات المملوكة للمتابعة بملكية المتابعة عبر مسار التعافي هذا، ولذلك يؤدي انقطاع مستخدم متابَع لاحقًا إلى مغادرة القناة.

اختر بين أوضاع الانضمام:

- استخدم `followUsers` للإعدادات الشخصية أو إعدادات المشغّلين التي ينبغي أن يوجد فيها البوت تلقائيًا في الصوت عندما تكون موجودًا.
- استخدم `autoJoin` لبوتات الغرف الثابتة التي ينبغي أن تبقى حاضرة حتى عندما لا يكون أي مستخدم متتبَّع في الصوت.
- استخدم `/vc join` لعمليات الانضمام لمرة واحدة أو للغرف التي سيكون فيها الوجود الصوتي التلقائي مفاجئًا.

برنامج ترميز صوت Discord:

- تعرض سجلات استقبال الصوت `discord voice: opus decoder: libopus-wasm`.
- يرمّز التشغيل في الوقت الفعلي PCM ستيريو خامًا بتردد 48 كيلوهرتز إلى Opus باستخدام حزمة `libopus-wasm` المضمّنة نفسها قبل تسليم الحزم إلى `@discordjs/voice`.
- يحوّل تشغيل الملفات وتدفقات المزوّد إلى PCM ستيريو خام بتردد 48 كيلوهرتز باستخدام ffmpeg، ثم يستخدم `libopus-wasm` لتدفق حزم Opus المرسلة إلى Discord.

مسار التحويل من الكلام إلى نص إضافةً إلى تحويل النص إلى كلام:

- يُحوَّل التقاط PCM من Discord إلى ملف WAV مؤقت.
- تتولى `tools.media.audio` تحويل الكلام إلى نص (STT)، مثل `openai/gpt-4o-mini-transcribe`.
- تُرسل النسخة النصية عبر مسار الإدخال والتوجيه في Discord، بينما يعمل نموذج اللغة الكبير للاستجابة وفق سياسة إخراج صوتي تُخفي أداة الوكيل `tts` وتطلب إرجاع النص، لأن صوت Discord يتولى تشغيل تحويل النص إلى كلام (TTS) النهائي.
- عند تعيين `voice.model`، فإنه يتجاوز نموذج اللغة الكبير للاستجابة لهذه الجولة في القناة الصوتية فقط.
- يُدمج `voice.tts` فوق `messages.tts`؛ وتغذي الجهات الموفرة الداعمة للبث المشغّل مباشرةً، وإلا فيُشغَّل ملف الصوت الناتج في القناة المنضم إليها.

مثال على جلسة قناة صوتية افتراضية بواسطة وكيل وسيط:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.6-sol",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

عند عدم وجود كتلة `voice.agentSession`، تحصل كل قناة صوتية على جلسة OpenClaw موجّهة خاصة بها. على سبيل المثال، يتحدث `/vc join channel:234567890123456789` إلى جلسة قناة Discord الصوتية تلك. نموذج الوقت الفعلي ليس سوى واجهة الصوت الأمامية؛ أما الطلبات الجوهرية فتُحال إلى وكيل OpenClaw المُعدّ. إذا أنتج نموذج الوقت الفعلي نسخة نصية نهائية دون استدعاء أداة الاستشارة، يفرض OpenClaw الاستشارة بوصفها إجراءً احتياطيًا كي يظل السلوك الافتراضي مماثلًا للتحدث إلى الوكيل.

مثال قديم لتحويل الكلام إلى نص ثم النص إلى كلام:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "stt-tts",
        model: "openai/gpt-5.4-mini",
        tts: {
          provider: "openai",
          providers: {
            openai: {
              model: "gpt-4o-mini-tts",
              speakerVoice: "cedar",
            },
          },
        },
      },
    },
  },
}
```

مثال ثنائي الاتجاه في الوقت الفعلي:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

استخدام الصوت امتدادًا لجلسة قناة Discord موجودة:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai/gpt-5.6-sol",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

في وضع `agent-proxy`، ينضم الروبوت إلى القناة الصوتية المُعدّة، لكن جولات وكيل OpenClaw تستخدم الجلسة الموجّهة العادية للقناة المستهدفة ووكيلها. تنطق جلسة الصوت في الوقت الفعلي النتيجة المُعادة داخل القناة الصوتية. لا يزال بإمكان الوكيل المشرف استخدام أدوات الرسائل العادية وفق سياسة أدواته، بما في ذلك إرسال رسالة Discord منفصلة إذا كان ذلك هو الإجراء المناسب.

أثناء نشاط تشغيل OpenClaw مفوّض، تُعامل النسخ النصية الصوتية الجديدة من Discord بوصفها تحكمًا مباشرًا في التشغيل قبل بدء جولة وكيل أخرى. تُصنّف عبارات مثل «الحالة» أو «ألغِ ذلك» أو «استخدم الإصلاح الأصغر» أو «عندما تنتهي، تحقّق أيضًا من الاختبارات» بوصفها إدخالًا للاستعلام عن الحالة أو الإلغاء أو التوجيه أو المتابعة للجلسة النشطة. تُنطق نتائج الحالة والإلغاء والتوجيه المقبول والمتابعة داخل القناة الصوتية كي يعرف المتصل ما إذا كان OpenClaw قد عالج الطلب.

صيغ أهداف مفيدة:

- يوجّه `target: "channel:123456789012345678"` عبر جلسة قناة نصية في Discord.
- يُعامل `target: "123456789012345678"` بوصفه هدف قناة.
- يوجّه `target: "dm:123456789012345678"` أو `target: "user:123456789012345678"` عبر جلسة الرسائل المباشرة تلك.

مثال OpenAI Realtime للبيئات كثيرة الصدى:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.6-sol",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
          bargeIn: true,
          minBargeInAudioEndMs: 500,
          consultPolicy: "always",
          providers: {
            openai: {
              interruptResponseOnInputAudio: false,
            },
          },
        },
      },
    },
  },
}
```

استخدم هذا عندما يسمع النموذج تشغيله الصوتي من Discord عبر ميكروفون مفتوح، مع استمرار رغبتك في مقاطعته بالكلام. يمنع OpenClaw خدمة OpenAI من المقاطعة التلقائية بسبب صوت الإدخال الخام، بينما يتيح `bargeIn: true` لأحداث بدء المتحدث في Discord وصوت المتحدث النشط بالفعل إلغاء استجابات الوقت الفعلي النشطة قبل وصول الجولة الملتقطة التالية إلى OpenAI. تُعامل إشارات المقاطعة الكلامية المبكرة جدًا التي تكون فيها قيمة `audioEndMs` أقل من `minBargeInAudioEndMs` بوصفها صدى أو ضوضاء محتملة وتُتجاهل كي لا يتوقف النموذج عند أول إطار تشغيل.

سجلات الصوت المتوقعة:

- عند الانضمام: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- عند بدء الوقت الفعلي: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- عند صوت المتحدث: `discord voice: realtime speaker turn opened ...` و`discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` و`discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- عند تخطي كلام قديم: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` أو `reason=non-actionable-closing ...`
- عند اكتمال استجابة الوقت الفعلي: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- عند إيقاف التشغيل أو إعادة ضبطه: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- عند استشارة الوقت الفعلي: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- عند إجابة الوكيل: `discord voice: agent turn answer ...`
- عند إدراج كلام مطابق في قائمة الانتظار: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`، ثم `discord voice: realtime exact speech dequeued reason=player-idle ...`
- عند اكتشاف المقاطعة الكلامية: `discord voice: realtime barge-in detected source=speaker-start ...` أو `discord voice: realtime barge-in detected source=active-speaker-audio ...`، ثم `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- عند مقاطعة الوقت الفعلي: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`، ثم إما `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` أو `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- عند تجاهل الصدى أو الضوضاء: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- عند تعطيل المقاطعة الكلامية: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- عند خمول التشغيل: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

لتصحيح مشكلة انقطاع الصوت، اقرأ سجلات الصوت في الوقت الفعلي بوصفها خطًا زمنيًا:

1. يعني `realtime audio playback started` أن Discord بدأ تشغيل صوت المساعد. يبدأ الجسر من هذه النقطة عدّ مقاطع خرج المساعد وبايتات PCM الخاصة بـDiscord وبايتات الوقت الفعلي للجهة الموفرة ومدة الصوت المُركّب.
2. يشير `realtime speaker turn opened` إلى أن أحد المتحدثين في Discord أصبح نشطًا. إذا كان التشغيل نشطًا بالفعل وكان `bargeIn` مفعّلًا، فقد يتبعه `barge-in detected source=speaker-start`.
3. يشير `realtime input audio started` إلى أول إطار صوتي فعلي يُستقبل لجولة المتحدث تلك. تعني `outputActive=true` أو قيمة `outputAudioMs` غير الصفرية هنا أن الميكروفون يرسل إدخالًا بينما لا يزال تشغيل المساعد نشطًا.
4. يعني `barge-in detected source=active-speaker-audio` أن OpenClaw رصد صوت متحدث مباشرًا أثناء نشاط تشغيل المساعد. يفيد ذلك في التمييز بين مقاطعة حقيقية وحدث بدء متحدث في Discord دون صوت مفيد.
5. يعني `barge-in requested reason=...` أن OpenClaw طلب من جهة توفير الوقت الفعلي إلغاء الاستجابة النشطة أو اقتطاعها. ويتضمن `outputAudioMs` و`outputActive` و`playbackChunks` كي تتمكن من معرفة مقدار صوت المساعد الذي شُغّل فعليًا قبل المقاطعة.
6. يمثّل `realtime audio playback stopped reason=...` نقطة إعادة ضبط تشغيل Discord المحلي. يوضّح السبب من أوقف التشغيل: `barge-in` أو `player-idle` أو `provider-clear-audio` أو `forced-agent-consult` أو `stream-close` أو `session-close`.
7. يلخّص `realtime speaker turn closed` جولة الإدخال الملتقطة. تعني `chunks=0` أو `hasAudio=false` أن جولة المتحدث فُتحت، لكن لم يصل أي صوت صالح للاستخدام إلى جسر الوقت الفعلي. وتعني `interruptedPlayback=true` أن جولة الإدخال تلك تداخلت مع خرج المساعد وشغّلت منطق المقاطعة الكلامية.

حقول مفيدة:

- `outputAudioMs`: مدة صوت المساعد التي أنشأتها جهة توفير الوقت الفعلي قبل سطر السجل.
- `audioMs`: مدة صوت المساعد التي عدّها OpenClaw قبل توقف التشغيل.
- `elapsedMs`: الزمن الفعلي المنقضي بين فتح تدفق التشغيل أو جولة المتحدث وإغلاقهما.
- `discordBytes`: بايتات PCM استيريو بتردد 48 كيلوهرتز المُرسلة إلى صوت Discord أو المستلمة منه.
- `realtimeBytes`: بايتات PCM بتنسيق الجهة الموفرة المُرسلة إلى جهة توفير الوقت الفعلي أو المستلمة منها.
- `playbackChunks`: مقاطع صوت المساعد المُمررة إلى Discord للاستجابة النشطة.
- `sinceLastAudioMs`: الفاصل بين آخر إطار صوتي ملتقط من المتحدث وإغلاق جولة المتحدث.

أنماط شائعة:

- يشير الانقطاع الفوري مع `source=active-speaker-audio` وقيمة `outputAudioMs` صغيرة ووجود المستخدم نفسه بالقرب من الجهاز عادةً إلى دخول صدى مكبر الصوت إلى الميكروفون. ارفع قيمة `voice.realtime.minBargeInAudioEndMs` أو اخفض مستوى صوت مكبر الصوت أو استخدم سماعات رأس أو عيّن `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- يعني ظهور `source=speaker-start` متبوعًا بـ`speaker turn closed ... hasAudio=false` أن Discord أبلغ عن بدء متحدث، لكن لم يصل أي صوت إلى OpenClaw. قد يكون ذلك حدثًا عابرًا في صوت Discord أو سلوك بوابة الضوضاء أو فتح العميل للميكروفون لوقت وجيز.
- يعني ظهور `audio playback stopped reason=stream-close` دون مقاطعة كلامية قريبة أو `provider-clear-audio` أن تدفق تشغيل Discord المحلي انتهى على نحو غير متوقع. تحقّق من سجلات الجهة الموفرة ومشغّل Discord السابقة.
- يعني `capture ignored during playback (barge-in disabled)` أن OpenClaw أسقط الإدخال عمدًا أثناء نشاط صوت المساعد. فعّل `voice.realtime.bargeIn` إذا أردت أن يقاطع الكلامُ التشغيلَ.
- يعني `barge-in ignored ... outputActive=false` أن اكتشاف النشاط الصوتي في Discord أو لدى الجهة الموفرة أبلغ عن كلام، لكن لم يكن لدى OpenClaw تشغيل نشط لمقاطعته. لا ينبغي أن يؤدي ذلك إلى قطع الصوت.

تُحل بيانات الاعتماد لكل مكوّن على حدة: مصادقة مسار نموذج اللغة الكبير لـ`voice.model`، ومصادقة تحويل الكلام إلى نص لـ`tools.media.audio`، ومصادقة تحويل النص إلى كلام لـ`messages.tts`/`voice.tts`، ومصادقة جهة توفير الوقت الفعلي لـ`voice.realtime.providers` أو إعداد المصادقة العادي للجهة الموفرة.

### الرسائل الصوتية

تعرض رسائل Discord الصوتية معاينة للموجة الصوتية وتتطلب صوتًا بتنسيق OGG/Opus. ينشئ OpenClaw الموجة الصوتية تلقائيًا، لكنه يحتاج إلى `ffmpeg` و`ffprobe` على مضيف Gateway لفحص الصوت وتحويله.

- وفّر **مسار ملف محليًا** (تُرفض عناوين URL).
- احذف المحتوى النصي (يرفض Discord النص والرسالة الصوتية في الحمولة نفسها).
- يُقبل أي تنسيق صوتي؛ ويحوّله OpenClaw إلى OGG/Opus عند الحاجة.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="استُخدمت مقاصد غير مسموح بها أو لا يرى الروبوت رسائل الخادم">

    - فعّل Message Content Intent
    - فعّل Server Members Intent عندما تعتمد على التعرّف على المستخدمين/الأعضاء
    - أعد تشغيل Gateway بعد تغيير intents

  </Accordion>

  <Accordion title="حظر رسائل الخادم بشكل غير متوقع">

    - تحقّق من `groupPolicy`
    - تحقّق من قائمة السماح للخادم ضمن `channels.discord.guilds`
    - إذا وُجدت خريطة `channels` لخادم، فلن يُسمح إلا بالقنوات المدرجة
    - تحقّق من سلوك `requireMention` وأنماط الإشارة

    فحوصات مفيدة:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="تعطيل اشتراط الإشارة مع استمرار الحظر">
    الأسباب الشائعة:

    - ضبط `groupPolicy="allowlist"` دون قائمة سماح مطابقة للخادم/القناة
    - ضبط `requireMention` في موضع خاطئ (يجب أن يكون ضمن `channels.discord.guilds` أو إدخال قناة)
    - حظر المُرسِل بواسطة قائمة السماح `users` للخادم/القناة

  </Accordion>

  <Accordion title="استغراق تفاعلات Discord وقتًا طويلًا أو تكرار الردود">

    السجلات المعتادة:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    إعدادات طابور Discord Gateway:

    - حساب واحد: `channels.discord.eventQueue.listenerTimeout`
    - حسابات متعددة: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - يتحكم هذا في عمل مستمع Discord Gateway فقط، وليس في مدة تفاعل الوكيل

    لا يطبّق Discord مهلة زمنية مملوكة للقناة على تفاعلات الوكيل الموضوعة في الطابور. تُسلّم مستمعات الرسائل العمل فورًا، وتحافظ عمليات تشغيل Discord الموضوعة في الطابور على الترتيب الخاص بكل جلسة حتى تكتمل دورة حياة الجلسة/الأداة/وقت التشغيل أو تُجهض العمل.

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="تحذيرات انتهاء مهلة البحث عن بيانات Gateway الوصفية">
    يجلب OpenClaw بيانات Discord الوصفية من `/gateway/bot` قبل الاتصال. عند حدوث إخفاقات عابرة، يُستخدم عنوان URL الافتراضي لـ Discord Gateway كخيار احتياطي، ويُحدّ من معدل تسجيل هذه الإخفاقات.

    إعدادات مهلة البيانات الوصفية:

    - حساب واحد: `channels.discord.gatewayInfoTimeoutMs`
    - حسابات متعددة: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - متغير البيئة الاحتياطي عند عدم ضبط الإعداد: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - القيمة الافتراضية: `30000` (30 ثانية)، والحد الأقصى: `120000`

  </Accordion>

  <Accordion title="إعادات التشغيل بسبب انتهاء مهلة READY في Gateway">
    ينتظر OpenClaw حدث `READY` من Discord Gateway أثناء بدء التشغيل وبعد عمليات إعادة الاتصال في وقت التشغيل. قد تحتاج إعدادات الحسابات المتعددة التي تستخدم تدرّج بدء التشغيل إلى نافذة READY أطول من القيمة الافتراضية أثناء بدء التشغيل.

    إعدادات مهلة READY:

    - بدء التشغيل لحساب واحد: `channels.discord.gatewayReadyTimeoutMs`
    - بدء التشغيل لحسابات متعددة: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - متغير البيئة الاحتياطي لبدء التشغيل عند عدم ضبط الإعداد: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - القيمة الافتراضية لبدء التشغيل: `15000` (15 ثانية)، والحد الأقصى: `120000`
    - وقت التشغيل لحساب واحد: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - وقت التشغيل لحسابات متعددة: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - متغير البيئة الاحتياطي لوقت التشغيل عند عدم ضبط الإعداد: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - القيمة الافتراضية لوقت التشغيل: `30000` (30 ثانية)، والحد الأقصى: `120000`

  </Accordion>

  <Accordion title="حالات عدم التطابق في تدقيق الأذونات">
    لا تعمل فحوصات أذونات `channels status --probe` إلا مع معرّفات القنوات الرقمية.

    إذا استخدمت مفاتيح الأسماء المختصرة، فقد تظل المطابقة في وقت التشغيل تعمل، لكن الفحص لا يستطيع التحقق من الأذونات بالكامل.

  </Accordion>

  <Accordion title="مشكلات الرسائل المباشرة والإقران">

    - الرسائل المباشرة معطّلة: `channels.discord.dm.enabled=false`
    - سياسة الرسائل المباشرة معطّلة: `channels.discord.dmPolicy="disabled"` (قديم: `channels.discord.dm.policy`)
    - انتظار الموافقة على الإقران في وضع `pairing`

  </Accordion>

  <Accordion title="حلقات التواصل بين البوتات">
    تُتجاهل افتراضيًا الرسائل التي ترسلها البوتات.

    إذا ضبطت `channels.discord.allowBots=true`، فاستخدم قواعد صارمة للإشارة وقوائم السماح لتجنّب سلوك الحلقات.
    يُفضّل استخدام `channels.discord.allowBots="mentions"` لقبول رسائل البوتات التي تشير إلى البوت فقط.

    يتضمن OpenClaw أيضًا [حماية مشتركة من حلقات البوتات](/ar/channels/bot-loop-protection). كلما سمح `allowBots` بوصول الرسائل الصادرة عن البوتات إلى التوجيه، يحوّل Discord الحدث الوارد إلى حقائق `(الحساب، القناة، زوج البوتات)`، ويمنع حارس الأزواج العام الزوج بعد تجاوزه ميزانية الأحداث المضبوطة. يمنع الحارس حلقات البوتين المنفلتة التي كان لا بد سابقًا من إيقافها بواسطة حدود معدل Discord؛ ولا يؤثر في عمليات النشر التي تستخدم بوتًا واحدًا أو ردود البوت لمرة واحدة التي تبقى ضمن الميزانية.

    الإعدادات الافتراضية (تكون نشطة عند ضبط `allowBots`):

    - `maxEventsPerWindow: 20` -- يمكن لزوج البوتات تبادل 20 رسالة ضمن النافذة المنزلقة
    - `windowSeconds: 60` -- طول النافذة المنزلقة
    - `cooldownSeconds: 60` -- بعد تجاوز الميزانية، تُسقط لمدة دقيقة كل رسالة إضافية بين البوتين في أي من الاتجاهين

    اضبط القيمة الافتراضية المشتركة مرة واحدة ضمن `channels.defaults.botLoopProtection`، ثم تجاوز إعداد Discord عندما يحتاج سير عمل مشروع إلى هامش أكبر. ترتيب الأولوية هو:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - القيم الافتراضية المضمّنة

    يستخدم Discord المفاتيح العامة `maxEventsPerWindow` و`windowSeconds` و`cooldownSeconds`.

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
    discord: {
      // تجاوز اختياري على مستوى Discord بالكامل. تتجاوز كتل الحسابات الحقول الفردية
      // وترث الحقول المحذوفة من هنا.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        alpha: {
          // يستمع Alpha إلى البوتات الأخرى فقط عندما تشير إليه.
          allowBots: "mentions",
        },
        bravo: {
          // يستمع Bravo إلى جميع رسائل Discord الصادرة عن البوتات.
          allowBots: true,
          mentionAliases: {
            // يتيح لـ Bravo كتابة إشارة Discord إلى Alpha باستخدام معرّف المستخدم المضبوط.
            Alpha: "ALPHA_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // السماح بما يصل إلى خمس رسائل في الدقيقة قبل منع الزوج.
            maxEventsPerWindow: 5,
            windowSeconds: 60,
            cooldownSeconds: 90,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="انقطاع تحويل الصوت إلى نص مع DecryptionFailed(...)">

    - حافظ على تحديث OpenClaw (`openclaw update`) لضمان توفر منطق استرداد استقبال صوت Discord
    - تأكّد من `channels.discord.voice.daveEncryption=true` (القيمة الافتراضية)
    - ابدأ بالقيمة `channels.discord.voice.decryptionFailureTolerance=24` (القيمة الافتراضية للمنبع)، ولا تعدّلها إلا عند الحاجة
    - راقب السجلات بحثًا عن:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - إذا استمرت الإخفاقات بعد إعادة الانضمام التلقائية، فاجمع السجلات وقارنها بسجل استقبال DAVE في المنبع ضمن [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) و[discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## مرجع الإعدادات

المرجع الأساسي: [مرجع الإعدادات - Discord](/ar/gateway/config-channels#discord).

<Accordion title="حقول Discord عالية الأهمية">

- بدء التشغيل/المصادقة: `enabled`، `token`، `applicationId`، `accounts.*`، `allowBots`
- السياسة: `groupPolicy`، `dmPolicy`، `allowFrom`، `dm.*`، `guilds.*`، `guilds.*.channels.*`
- الأوامر: `commands.native`، `commands.useAccessGroups` (عام)، `configWrites`، `slashCommand.ephemeral`
- طابور الأحداث: `eventQueue.listenerTimeout` (ميزانية المستمع، القيمة الافتراضية `120000`)، `eventQueue.maxQueueSize` (القيمة الافتراضية `10000`)، `eventQueue.maxConcurrency` (القيمة الافتراضية `50`)
- Gateway: `proxy`، `gatewayInfoTimeoutMs`، `gatewayReadyTimeoutMs`، `gatewayRuntimeReadyTimeoutMs`
- الرد/السجل: `replyToMode`، `historyLimit`، `dmHistoryLimit`، `dms.*.historyLimit`
- التسليم: `textChunkLimit` (القيمة الافتراضية `2000`)، `maxLinesPerMessage` (القيمة الافتراضية `17`)
- البث: `streaming.mode`، `streaming.chunkMode`، `streaming.preview.*`، `streaming.progress.*`، `streaming.block.*` (يُرحّل `openclaw doctor --fix` المفاتيح المسطحة القديمة `streamMode` و`draftChunk` و`blockStreaming` و`blockStreamingCoalesce` و`chunkMode` إلى `streaming.*`)
- الوسائط/إعادة المحاولة: `mediaMaxMb` (يضع حدًا أقصى لعمليات الرفع الصادرة إلى Discord، والقيمة الافتراضية `100`)، `retry`
- الإجراءات: `actions.*`
- الحضور: `activity`، `status`، `activityType`، `activityUrl`، `autoPresence.*`
- واجهة المستخدم: `ui.components.accentColor`
- الميزات: `threadBindings`، و`bindings[]` في المستوى الأعلى (`type: "acp"`)، و`pluralkit`، و`execApprovals`، و`intents`، و`agentComponents.enabled`، و`agentComponents.ttlMs`، و`heartbeat`، و`responsePrefix`

</Accordion>

## السلامة والتشغيل

- تعامل مع رموز البوت بوصفها أسرارًا (يُفضّل `DISCORD_BOT_TOKEN` في البيئات الخاضعة للإشراف).
- امنح أذونات Discord وفق مبدأ أقل قدر من الامتيازات.
- إذا كانت حالة نشر الأوامر/حالَتها قديمة، فأعد تشغيل Gateway ثم أعد التحقق باستخدام `openclaw channels status --probe`.

## مواضيع ذات صلة

<CardGroup cols={2}>
  <Card title="الإقران" icon="link" href="/ar/channels/pairing">
    اقرن مستخدم Discord مع Gateway.
  </Card>
  <Card title="المجموعات" icon="users" href="/ar/channels/groups">
    سلوك الدردشة الجماعية وقائمة السماح.
  </Card>
  <Card title="توجيه القنوات" icon="route" href="/ar/channels/channel-routing">
    وجّه الرسائل الواردة إلى الوكلاء.
  </Card>
  <Card title="الأمان" icon="shield" href="/ar/gateway/security">
    نموذج التهديد والتقوية الأمنية.
  </Card>
  <Card title="التوجيه متعدد الوكلاء" icon="sitemap" href="/ar/concepts/multi-agent">
    اربط الخوادم والقنوات بالوكلاء.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلية.
  </Card>
</CardGroup>

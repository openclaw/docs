---
read_when:
    - العمل على ميزات قناة Discord
summary: حالة دعم بوت Discord وإمكاناته وإعداده
title: Discord
x-i18n:
    generated_at: "2026-04-26T11:22:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68f4e1885aab2438c38ef3735b752968b7e1ed70795d1c3903fad20ff183d3ca
    source_path: channels/discord.md
    workflow: 15
---

جاهز للرسائل الخاصة والقنوات الجماعية عبر Discord gateway الرسمي.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    تستخدم الرسائل الخاصة في Discord وضع الاقتران بشكل افتراضي.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وكتالوج الأوامر.
  </Card>
  <Card title="استكشاف أخطاء القناة وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    التشخيص عبر القنوات ومسار الإصلاح.
  </Card>
</CardGroup>

## الإعداد السريع

ستحتاج إلى إنشاء تطبيق جديد يتضمن بوتًا، ثم إضافة البوت إلى خادمك، ثم إقرانه مع OpenClaw. نوصي بإضافة البوت إلى خادمك الخاص. إذا لم يكن لديك خادم بعد، [فأنشئ واحدًا أولًا](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (اختر **Create My Own > For me and my friends**).

<Steps>
  <Step title="إنشاء تطبيق Discord وبوت">
    انتقل إلى [Discord Developer Portal](https://discord.com/developers/applications) وانقر على **New Application**. سمّه باسم مثل "OpenClaw".

    انقر على **Bot** في الشريط الجانبي. اضبط **Username** على الاسم الذي تستخدمه لوكيل OpenClaw الخاص بك.

  </Step>

  <Step title="تفعيل الامتيازات المطلوبة">
    بينما لا تزال في صفحة **Bot**، مرر لأسفل إلى **Privileged Gateway Intents** وفعّل ما يلي:

    - **Message Content Intent** (مطلوب)
    - **Server Members Intent** (موصى به؛ ومطلوب لقوائم السماح الخاصة بالأدوار ولمطابقة الاسم مع المعرّف)
    - **Presence Intent** (اختياري؛ مطلوب فقط لتحديثات الحالة)

  </Step>

  <Step title="نسخ رمز البوت المميز">
    مرر مرة أخرى إلى أعلى صفحة **Bot** وانقر على **Reset Token**.

    <Note>
    رغم التسمية، يؤدي هذا إلى إنشاء أول رمز مميز لك — لا يتم "إعادة تعيين" أي شيء.
    </Note>

    انسخ الرمز المميز واحفظه في مكان ما. هذا هو **Bot Token** الخاص بك وستحتاج إليه بعد قليل.

  </Step>

  <Step title="إنشاء رابط دعوة وإضافة البوت إلى خادمك">
    انقر على **OAuth2** في الشريط الجانبي. ستنشئ رابط دعوة بالأذونات المناسبة لإضافة البوت إلى خادمك.

    مرر لأسفل إلى **OAuth2 URL Generator** وفعّل:

    - `bot`
    - `applications.commands`

    سيظهر قسم **Bot Permissions** أدناه. فعّل على الأقل:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (اختياري)

    هذه هي المجموعة الأساسية للقنوات النصية العادية. إذا كنت تخطط للنشر في سلاسل Discord، بما في ذلك سير عمل قنوات المنتدى أو الوسائط التي تُنشئ سلسلة أو تتابعها، ففعّل أيضًا **Send Messages in Threads**.
    انسخ الرابط الذي تم إنشاؤه في الأسفل، والصقه في المتصفح، وحدد خادمك، ثم انقر على **Continue** للاتصال. ينبغي أن ترى الآن البوت الخاص بك في خادم Discord.

  </Step>

  <Step title="تفعيل وضع المطور وجمع المعرّفات الخاصة بك">
    بالعودة إلى تطبيق Discord، تحتاج إلى تفعيل وضع المطور حتى تتمكن من نسخ المعرّفات الداخلية.

    1. انقر على **User Settings** (أيقونة الترس بجانب صورتك الرمزية) → **Advanced** → فعّل **Developer Mode**
    2. انقر بزر الماوس الأيمن على **أيقونة الخادم** في الشريط الجانبي → **Copy Server ID**
    3. انقر بزر الماوس الأيمن على **صورتك الرمزية** → **Copy User ID**

    احفظ **Server ID** و**User ID** إلى جانب Bot Token — سترسل الثلاثة جميعًا إلى OpenClaw في الخطوة التالية.

  </Step>

  <Step title="السماح بالرسائل الخاصة من أعضاء الخادم">
    لكي يعمل الاقتران، يجب أن يسمح Discord للبوت الخاص بك بإرسال رسائل خاصة إليك. انقر بزر الماوس الأيمن على **أيقونة الخادم** → **Privacy Settings** → فعّل **Direct Messages**.

    يتيح هذا لأعضاء الخادم (بما في ذلك البوتات) إرسال رسائل خاصة إليك. أبقِ هذا الخيار مفعّلًا إذا كنت تريد استخدام الرسائل الخاصة في Discord مع OpenClaw. إذا كنت تخطط لاستخدام القنوات الجماعية فقط، فيمكنك تعطيل الرسائل الخاصة بعد الاقتران.

  </Step>

  <Step title="تعيين رمز البوت المميز بأمان (لا ترسله في الدردشة)">
    رمز بوت Discord المميز هو سر (مثل كلمة المرور). قم بتعيينه على الجهاز الذي يشغّل OpenClaw قبل مراسلة وكيلك.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    إذا كان OpenClaw يعمل بالفعل كخدمة في الخلفية، فأعد تشغيله عبر تطبيق OpenClaw على Mac أو من خلال إيقاف عملية `openclaw gateway run` ثم تشغيلها من جديد.

  </Step>

  <Step title="تهيئة OpenClaw والاقتران">

    <Tabs>
      <Tab title="اسأل وكيلك">
        تحدّث مع وكيل OpenClaw الخاص بك على أي قناة موجودة (مثل Telegram) وأخبره بذلك. إذا كانت Discord هي قناتك الأولى، فاستخدم تبويب CLI / config بدلًا من ذلك.

        > "لقد قمت بالفعل بتعيين Discord bot token في الإعدادات. يرجى إكمال إعداد Discord باستخدام User ID `<user_id>` وServer ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        إذا كنت تفضّل الإعداد القائم على الملفات، فاضبط ما يلي:

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

        الاحتياط إلى متغير البيئة للحساب الافتراضي:

```bash
DISCORD_BOT_TOKEN=...
```

        قيم `token` النصية الصريحة مدعومة. كما أن قيم SecretRef مدعومة أيضًا لـ `channels.discord.token` عبر موفري env/file/exec. راجع [Secrets Management](/ar/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="الموافقة على أول اقتران عبر الرسائل الخاصة">
    انتظر حتى تكون Gateway قيد التشغيل، ثم أرسل رسالة خاصة إلى البوت في Discord. سيرد برمز اقتران.

    <Tabs>
      <Tab title="اسأل وكيلك">
        أرسل رمز الاقتران إلى وكيلك على قناتك الحالية:

        > "وافق على رمز اقتران Discord هذا: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    تنتهي صلاحية رموز الاقتران بعد ساعة واحدة.

    ينبغي أن تتمكن الآن من التحدث مع وكيلك في Discord عبر الرسائل الخاصة.

  </Step>
</Steps>

<Note>
تحليل الرمز المميز يعتمد على الحساب. تفوز قيم الرمز المميز في الإعدادات على الاحتياط من متغيرات البيئة. لا يُستخدم `DISCORD_BOT_TOKEN` إلا للحساب الافتراضي.
بالنسبة للاستدعاءات الصادرة المتقدمة (إجراءات أداة الرسائل/القناة)، يُستخدم `token` صريح لكل استدعاء لتلك العملية. ينطبق هذا على إجراءات الإرسال والقراءة/التحقق مثل (على سبيل المثال read/search/fetch/thread/pins/permissions). ومع ذلك، تظل إعدادات سياسة الحساب/إعادة المحاولة مأخوذة من الحساب المحدد في اللقطة النشطة لوقت التشغيل.
</Note>

## موصى به: إعداد مساحة عمل جماعية

بمجرد أن تعمل الرسائل الخاصة، يمكنك إعداد خادم Discord الخاص بك كمساحة عمل كاملة حيث تحصل كل قناة على جلسة وكيل خاصة بها وسياقها الخاص. يُوصى بهذا للخوادم الخاصة التي تضمك أنت والبوت فقط.

<Steps>
  <Step title="إضافة خادمك إلى قائمة السماح الخاصة بالخوادم">
    يتيح هذا لوكيلك الرد في أي قناة على خادمك، وليس فقط في الرسائل الخاصة.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "أضف Discord Server ID الخاص بي `<server_id>` إلى قائمة السماح الخاصة بالخوادم"
      </Tab>
      <Tab title="الإعدادات">

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

  <Step title="السماح بالردود بدون @mention">
    بشكل افتراضي، لا يرد وكيلك في القنوات الجماعية إلا عند الإشارة إليه باستخدام @. بالنسبة إلى خادم خاص، فمن المحتمل أنك تريد منه الرد على كل رسالة.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "اسمح لوكيلي بالرد على هذا الخادم دون الحاجة إلى الإشارة إليه باستخدام @"
      </Tab>
      <Tab title="الإعدادات">
        اضبط `requireMention: false` في إعدادات الخادم الخاصة بك:

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

      </Tab>
    </Tabs>

  </Step>

  <Step title="التخطيط للذاكرة في القنوات الجماعية">
    بشكل افتراضي، لا يتم تحميل الذاكرة طويلة الأمد (`MEMORY.md`) إلا في جلسات الرسائل الخاصة. القنوات الجماعية لا تحمّل `MEMORY.md` تلقائيًا.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "عندما أطرح أسئلة في قنوات Discord، استخدم memory_search أو memory_get إذا كنت بحاجة إلى سياق طويل الأمد من `MEMORY.md`."
      </Tab>
      <Tab title="يدوي">
        إذا كنت بحاجة إلى سياق مشترك في كل قناة، فضع التعليمات الثابتة في `AGENTS.md` أو `USER.md` (إذ يتم حقنهما في كل جلسة). واحتفظ بالملاحظات طويلة الأمد في `MEMORY.md` واصل إليها عند الحاجة باستخدام أدوات الذاكرة.
      </Tab>
    </Tabs>

  </Step>
</Steps>

أنشئ الآن بعض القنوات على خادم Discord الخاص بك وابدأ الدردشة. يمكن لوكيلك رؤية اسم القناة، وتحصل كل قناة على جلسة معزولة خاصة بها — لذا يمكنك إعداد `#coding` أو `#home` أو `#research` أو أي شيء يناسب سير عملك.

## نموذج وقت التشغيل

- تمتلك Gateway اتصال Discord.
- توجيه الردود حتمي: ترد الرسائل الواردة من Discord مرة أخرى إلى Discord.
- تتم إضافة بيانات Discord الوصفية الخاصة بالخادم/القناة إلى مطالبة النموذج باعتبارها
  سياقًا غير موثوق، وليس كبادئة رد مرئية للمستخدم. إذا نسخ نموذج ما ذلك الغلاف
  الوصفي إلى الرد، فإن OpenClaw يزيل البيانات الوصفية المنسوخة من الردود الصادرة ومن
  سياق إعادة التشغيل المستقبلي.
- بشكل افتراضي (`session.dmScope=main`)، تشارك المحادثات المباشرة الجلسة الرئيسية للوكيل (`agent:main:main`).
- القنوات الجماعية تستخدم مفاتيح جلسات معزولة (`agent:<agentId>:discord:channel:<channelId>`).
- يتم تجاهل الرسائل الخاصة الجماعية بشكل افتراضي (`channels.discord.dm.groupEnabled=false`).
- تعمل أوامر الشرطة المائلة الأصلية في جلسات أوامر معزولة (`agent:<agentId>:discord:slash:<userId>`)، مع الاستمرار في حمل `CommandTargetSessionKey` إلى جلسة المحادثة الموجّهة.
- يستخدم تسليم إعلانات Cron/Heartbeat النصية فقط إلى Discord
  الإجابة النهائية المرئية للمساعد مرة واحدة. وتبقى حمولات الوسائط والمكونات
  المنظمة متعددة الرسائل عندما يصدر الوكيل عدة حمولات قابلة للتسليم.

## قنوات المنتدى

لا تقبل قنوات المنتدى والوسائط في Discord سوى المنشورات ضمن السلاسل. يدعم OpenClaw طريقتين لإنشائها:

- أرسل رسالة إلى أصل المنتدى (`channel:<forumId>`) لإنشاء سلسلة تلقائيًا. يستخدم عنوان السلسلة أول سطر غير فارغ من رسالتك.
- استخدم `openclaw message thread create` لإنشاء سلسلة مباشرة. لا تمرر `--message-id` لقنوات المنتدى.

مثال: الإرسال إلى أصل المنتدى لإنشاء سلسلة

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

مثال: إنشاء سلسلة منتدى بشكل صريح

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

لا تقبل أصول المنتديات مكونات Discord. إذا كنت بحاجة إلى مكونات، فأرسل إلى السلسلة نفسها (`channel:<threadId>`).

## المكونات التفاعلية

يدعم OpenClaw حاويات Discord components v2 لرسائل الوكيل. استخدم أداة الرسائل مع حمولة `components`. يتم توجيه نتائج التفاعل مرة أخرى إلى الوكيل كرسائل واردة عادية وتتبع إعدادات Discord `replyToMode` الحالية.

الكتل المدعومة:

- `text` و`section` و`separator` و`actions` و`media-gallery` و`file`
- تسمح صفوف الإجراءات بما يصل إلى 5 أزرار أو قائمة تحديد واحدة
- أنواع التحديد: `string` و`user` و`role` و`mentionable` و`channel`

بشكل افتراضي، تكون المكونات للاستخدام مرة واحدة. اضبط `components.reusable=true` للسماح باستخدام الأزرار وعمليات التحديد والنماذج عدة مرات حتى تنتهي صلاحيتها.

لتقييد من يمكنه النقر على زر، اضبط `allowedUsers` لذلك الزر (معرّفات مستخدمي Discord أو الوسوم أو `*`). عند التهيئة، يتلقى المستخدمون غير المطابقين رفضًا مؤقتًا مرئيًا لهم فقط.

تفتح أوامر الشرطة المائلة `/model` و`/models` منتقي نماذج تفاعليًا يتضمن قوائم منسدلة لموفّر الخدمة والنموذج وبيئات التشغيل المتوافقة، بالإضافة إلى خطوة Submit. أصبح `/models add` مهجورًا ويعيد الآن رسالة توضح الإهمال بدلًا من تسجيل النماذج من الدردشة. يكون رد المنتقي مؤقتًا ومرئيًا فقط للمستخدم الذي استدعاه، وهو وحده من يمكنه استخدامه.

مرفقات الملفات:

- يجب أن تشير كتل `file` إلى مرجع مرفق (`attachment://<filename>`)
- وفّر المرفق عبر `media`/`path`/`filePath` (ملف واحد)؛ واستخدم `media-gallery` لعدة ملفات
- استخدم `filename` لتجاوز اسم الرفع عندما يجب أن يطابق مرجع المرفق

نماذج Modal:

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
  <Tab title="سياسة الرسائل الخاصة">
    يتحكم `channels.discord.dmPolicy` في الوصول إلى الرسائل الخاصة (الاسم القديم: `channels.discord.dm.policy`):

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `channels.discord.allowFrom` القيمة `"*"`؛ الاسم القديم: `channels.discord.dm.allowFrom`)
    - `disabled`

    إذا لم تكن سياسة الرسائل الخاصة مفتوحة، فسيتم حظر المستخدمين غير المعروفين (أو مطالبتهم بالاقتران في وضع `pairing`).

    أسبقية تعدد الحسابات:

    - ينطبق `channels.discord.accounts.default.allowFrom` على الحساب `default` فقط.
    - ترث الحسابات المسماة `channels.discord.allowFrom` عندما لا تكون قيمة `allowFrom` الخاصة بها مضبوطة.
    - لا ترث الحسابات المسماة `channels.discord.accounts.default.allowFrom`.

    تنسيق هدف الرسائل الخاصة للتسليم:

    - `user:<id>`
    - الإشارة `<@id>`

    تكون المعرّفات الرقمية المجردة ملتبسة ويتم رفضها ما لم يتم توفير نوع هدف مستخدم/قناة صريح.

  </Tab>

  <Tab title="سياسة الخوادم الجماعية">
    يتم التحكم في التعامل مع الخوادم الجماعية بواسطة `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    خط الأساس الآمن عند وجود `channels.discord` هو `allowlist`.

    سلوك `allowlist`:

    - يجب أن يطابق الخادم `channels.discord.guilds` (يُفضّل `id`، ويُقبل slug)
    - قوائم السماح الاختيارية للمرسلين: `users` (يُنصح باستخدام المعرّفات الثابتة) و`roles` (معرّفات الأدوار فقط)؛ إذا تم إعداد أي منهما، فسيُسمح للمرسلين عندما يطابقون `users` أو `roles`
    - تكون المطابقة المباشرة للاسم/الوسم معطلة افتراضيًا؛ فعّل `channels.discord.dangerouslyAllowNameMatching: true` فقط كوضع توافق طارئ
    - الأسماء/الوسوم مدعومة في `users`، لكن المعرّفات أكثر أمانًا؛ ويحذر `openclaw security audit` عند استخدام إدخالات الاسم/الوسم
    - إذا كان لدى الخادم `channels` مضبوطة، فسيتم رفض القنوات غير المدرجة
    - إذا لم يكن لدى الخادم كتلة `channels`، فستُسمح كل القنوات في ذلك الخادم المدرج في قائمة السماح

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
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    إذا قمت فقط بتعيين `DISCORD_BOT_TOKEN` ولم تنشئ كتلة `channels.discord`، فسيكون احتياط وقت التشغيل هو `groupPolicy="allowlist"` (مع تحذير في السجلات)، حتى لو كانت قيمة `channels.defaults.groupPolicy` هي `open`.

  </Tab>

  <Tab title="الإشارات والرسائل الخاصة الجماعية">
    تكون رسائل الخوادم الجماعية مقيّدة بالإشارة بشكل افتراضي.

    يتضمن اكتشاف الإشارة ما يلي:

    - إشارة صريحة إلى البوت
    - أنماط الإشارة المهيأة (`agents.list[].groupChat.mentionPatterns`، والاحتياط هو `messages.groupChat.mentionPatterns`)
    - سلوك الرد الضمني إلى البوت في الحالات المدعومة

    تتم تهيئة `requireMention` لكل خادم/قناة (`channels.discord.guilds...`).
    يسقط `ignoreOtherMentions` اختياريًا الرسائل التي تشير إلى مستخدم/دور آخر ولكن ليس إلى البوت (باستثناء @everyone/@here).

    الرسائل الخاصة الجماعية:

    - الافتراضي: يتم تجاهلها (`dm.groupEnabled=false`)
    - قائمة سماح اختيارية عبر `dm.groupChannels` (معرّفات القنوات أو slugs)

  </Tab>
</Tabs>

### توجيه الوكيل المعتمد على الأدوار

استخدم `bindings[].match.roles` لتوجيه أعضاء خوادم Discord الجماعية إلى وكلاء مختلفين حسب معرّف الدور. تقبل عمليات الربط المعتمدة على الأدوار معرّفات الأدوار فقط، ويتم تقييمها بعد عمليات الربط peer أو parent-peer وقبل عمليات الربط الخاصة بالخادم فقط. إذا كان الربط يضبط أيضًا حقول مطابقة أخرى (مثل `peer` + `guildId` + `roles`)، فيجب أن تتطابق جميع الحقول المهيأة.

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

## الأوامر الأصلية ومصادقة الأوامر

- القيمة الافتراضية لـ `commands.native` هي `"auto"` وتكون مفعّلة لـ Discord.
- تجاوز لكل قناة: `channels.discord.commands.native`.
- يؤدي `commands.native=false` إلى مسح أوامر Discord الأصلية المسجلة سابقًا بشكل صريح.
- تستخدم مصادقة الأوامر الأصلية قوائم السماح/السياسات نفسها في Discord كما في معالجة الرسائل العادية.
- قد تظل الأوامر مرئية في واجهة Discord للمستخدمين غير المصرّح لهم؛ لكن التنفيذ يظل يفرض مصادقة OpenClaw ويعيد "غير مصرّح".

راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands) للحصول على كتالوج الأوامر والسلوك.

إعدادات أوامر الشرطة المائلة الافتراضية:

- `ephemeral: true`

## تفاصيل الميزة

<AccordionGroup>
  <Accordion title="وسوم الردود والردود الأصلية">
    يدعم Discord وسوم الردود في مخرجات الوكيل:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    ويتم التحكم فيها بواسطة `channels.discord.replyToMode`:

    - `off` (افتراضي)
    - `first`
    - `all`
    - `batched`

    ملاحظة: يؤدي `off` إلى تعطيل ترابط الردود الضمني. ومع ذلك، تظل وسوم `[[reply_to_*]]` الصريحة محترمة.
    يقوم `first` دائمًا بإرفاق مرجع الرد الأصلي الضمني لأول رسالة Discord صادرة في ذلك الدور.
    يقوم `batched` بإرفاق مرجع الرد الأصلي الضمني من Discord فقط عندما
    يكون الدور الوارد دفعة مؤجلة من عدة رسائل. ويكون هذا مفيدًا
    عندما تريد الردود الأصلية أساسًا للمحادثات المتدفقة والملتبسة، وليس لكل
    دور رسالة مفردة.

    يتم إظهار معرّفات الرسائل في السياق/السجل حتى تتمكن الوكلاء من استهداف رسائل محددة.

  </Accordion>

  <Accordion title="معاينة البث المباشر">
    يمكن لـ OpenClaw بث المسودات بإرسال رسالة مؤقتة وتحريرها مع وصول النص. يقبل `channels.discord.streaming` القيم `off` (افتراضي) | `partial` | `block` | `progress`. ويتم تعيين `progress` إلى `partial` على Discord؛ أما `streamMode` فهو اسم بديل قديم وتتم ترقيته تلقائيًا.

    يبقى الافتراضي `off` لأن تعديلات معاينة Discord تصطدم سريعًا بحدود المعدل عندما تتشارك عدة بوتات أو Gateways الحساب نفسه.

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    - يقوم `partial` بتحرير رسالة معاينة واحدة مع وصول الرموز.
    - يقوم `block` بإخراج أجزاء بحجم المسودة (استخدم `draftChunk` لضبط الحجم ونقاط التقسيم، مع تقييدها إلى `textChunkLimit`).
    - تؤدي الردود النهائية الخاصة بالوسائط أو الأخطاء أو الردود الصريحة إلى إلغاء تعديلات المعاينة المعلقة.
    - يتحكم `streaming.preview.toolProgress` (الافتراضي `true`) في ما إذا كانت تحديثات الأدوات/التقدم ستعيد استخدام رسالة المعاينة.

    بث المعاينة نصّي فقط؛ وتعود ردود الوسائط إلى التسليم العادي. وعند تفعيل بث `block` صراحةً، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

  </Accordion>

  <Accordion title="السجل والسياق وسلوك السلاسل">
    سياق سجل الخوادم الجماعية:

    - القيمة الافتراضية لـ `channels.discord.historyLimit` هي `20`
    - الاحتياط: `messages.groupChat.historyLimit`
    - يؤدي `0` إلى التعطيل

    عناصر التحكم في سجل الرسائل الخاصة:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    سلوك السلاسل:

    - يتم توجيه سلاسل Discord كجلسات قنوات وترث إعدادات القناة الأصلية ما لم يتم تجاوزها.
    - يتيح `channels.discord.thread.inheritParent` (الافتراضي `false`) للسلاسل التلقائية الجديدة أن تبدأ من نص القناة الأصلية. توجد عمليات التجاوز لكل حساب تحت `channels.discord.accounts.<id>.thread.inheritParent`.
    - يمكن لتفاعلات أداة الرسائل حل أهداف الرسائل الخاصة `user:<id>`.
    - يتم الحفاظ على `guilds.<guild>.channels.<channel>.requireMention: false` أثناء احتياط تفعيل مرحلة الرد.

    يتم حقن مواضيع القنوات باعتبارها سياقًا **غير موثوق**. تتحكم قوائم السماح في من يمكنه تشغيل الوكيل، وليست حدًا كاملًا لتنقيح السياق التكميلي.

  </Accordion>

  <Accordion title="جلسات مرتبطة بالسلسلة للوكلاء الفرعيين">
    يمكن لـ Discord ربط سلسلة بهدف جلسة بحيث تستمر الرسائل اللاحقة في تلك السلسلة في التوجيه إلى الجلسة نفسها (بما في ذلك جلسات الوكلاء الفرعيين).

    الأوامر:

    - `/focus <target>` ربط السلسلة الحالية/الجديدة بهدف وكيل فرعي/جلسة
    - `/unfocus` إزالة ربط السلسلة الحالية
    - `/agents` عرض عمليات التشغيل النشطة وحالة الربط
    - `/session idle <duration|off>` فحص/تحديث إلغاء التركيز التلقائي عند عدم النشاط لعمليات الربط المركّزة
    - `/session max-age <duration|off>` فحص/تحديث الحد الأقصى الصارم للعمر لعمليات الربط المركّزة

    الإعدادات:

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
        spawnSubagentSessions: false, // opt-in
      },
    },
  },
}
```

    ملاحظات:

    - يضبط `session.threadBindings.*` الإعدادات الافتراضية العامة.
    - يتجاوز `channels.discord.threadBindings.*` سلوك Discord.
    - يجب أن تكون `spawnSubagentSessions` مساوية لـ true لإنشاء/ربط السلاسل تلقائيًا مع `sessions_spawn({ thread: true })`.
    - يجب أن تكون `spawnAcpSessions` مساوية لـ true لإنشاء/ربط السلاسل تلقائيًا مع ACP (`/acp spawn ... --thread ...` أو `sessions_spawn({ runtime: "acp", thread: true })`).
    - إذا تم تعطيل عمليات ربط السلاسل لحساب ما، فلن تتوفر `/focus` وعمليات ربط السلاسل ذات الصلة.

    راجع [الوكلاء الفرعيون](/ar/tools/subagents) و[وكلاء ACP](/ar/tools/acp-agents) و[مرجع الإعدادات](/ar/gateway/configuration-reference).

  </Accordion>

  <Accordion title="عمليات ربط قنوات ACP الدائمة">
    لمساحات عمل ACP الثابتة "الدائمة التشغيل"، قم بتهيئة عمليات ربط ACP مكتوبة على المستوى الأعلى تستهدف محادثات Discord.

    مسار الإعدادات:

    - `bindings[]` مع `type: "acp"` و`match.channel: "discord"`

    مثال:

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

    - يربط `/acp spawn codex --bind here` القناة أو السلسلة الحالية في مكانها ويحافظ على توجيه الرسائل المستقبلية إلى جلسة ACP نفسها. وترث رسائل السلسلة ربط القناة الأصلية.
    - في قناة أو سلسلة مرتبطة، يقوم `/new` و`/reset` بإعادة تعيين جلسة ACP نفسها في مكانها. ويمكن لعمليات ربط السلاسل المؤقتة تجاوز تحليل الهدف أثناء نشاطها.
    - لا تكون `spawnAcpSessions` مطلوبة إلا عندما يحتاج OpenClaw إلى إنشاء/ربط سلسلة فرعية عبر `--thread auto|here`.

    راجع [وكلاء ACP](/ar/tools/acp-agents) للحصول على تفاصيل سلوك الربط.

  </Accordion>

  <Accordion title="إشعارات التفاعلات">
    وضع إشعارات التفاعلات لكل خادم:

    - `off`
    - `own` (افتراضي)
    - `all`
    - `allowlist` (يستخدم `guilds.<id>.users`)

    يتم تحويل أحداث التفاعل إلى أحداث نظام وإرفاقها بجلسة Discord الموجّهة.

  </Accordion>

  <Accordion title="تفاعلات الإقرار">
    يرسل `ackReaction` رمزًا تعبيريًا للإقرار بينما يعالج OpenClaw رسالة واردة.

    ترتيب التحليل:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - احتياط الرمز التعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا `"👀"`)

    ملاحظات:

    - يقبل Discord الرموز التعبيرية Unicode أو أسماء الرموز التعبيرية المخصصة.
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="كتابات الإعدادات">
    تكون كتابات الإعدادات التي تبدأ من القناة مفعّلة بشكل افتراضي.

    يؤثر هذا في تدفقات `/config set|unset` (عندما تكون ميزات الأوامر مفعّلة).

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
    وجّه حركة WebSocket الخاصة بـ Discord gateway وعمليات بحث REST عند بدء التشغيل (معرّف التطبيق + تحليل قائمة السماح) عبر وكيل HTTP(S) باستخدام `channels.discord.proxy`.

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    تجاوز لكل حساب:

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
    فعّل تحليل PluralKit لربط الرسائل الممررة بهوية عضو النظام:

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // optional; needed for private systems
      },
    },
  },
}
```

    ملاحظات:

    - يمكن أن تستخدم قوائم السماح `pk:<memberId>`
    - تتم مطابقة أسماء عرض الأعضاء بالاسم/slug فقط عندما تكون `channels.discord.dangerouslyAllowNameMatching: true`
    - تستخدم عمليات البحث معرّف الرسالة الأصلي وتكون مقيّدة بنافذة زمنية
    - إذا فشل البحث، فسيتم التعامل مع الرسائل الممررة على أنها رسائل بوت وسيتم إسقاطها ما لم يكن `allowBots=true`

  </Accordion>

  <Accordion title="إعدادات الحالة">
    يتم تطبيق تحديثات الحالة عند تعيين حقل status أو activity، أو عند تفعيل auto presence.

    مثال على الحالة فقط:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    مثال على النشاط (نوع النشاط الافتراضي هو الحالة المخصصة):

```json5
{
  channels: {
    discord: {
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    مثال على البث:

```json5
{
  channels: {
    discord: {
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    خريطة أنواع النشاط:

    - 0: Playing
    - 1: Streaming (يتطلب `activityUrl`)
    - 2: Listening
    - 3: Watching
    - 4: Custom (يستخدم نص النشاط باعتباره حالة status؛ والرمز التعبيري اختياري)
    - 5: Competing

    مثال على auto presence (إشارة صحة وقت التشغيل):

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token exhausted",
      },
    },
  },
}
```

    يربط auto presence مدى توفر وقت التشغيل بحالة Discord: healthy => online، وdegraded أو unknown => idle، وexhausted أو unavailable => dnd. تجاوزات النص الاختيارية:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (يدعم العنصر النائب `{reason}`)

  </Accordion>

  <Accordion title="الموافقات في Discord">
    يدعم Discord معالجة الموافقات المعتمدة على الأزرار في الرسائل الخاصة، ويمكنه اختياريًا نشر مطالبات الموافقة في القناة الأصلية.

    مسار الإعدادات:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختياري؛ يعود احتياطيًا إلى `commands.ownerAllowFrom` عندما يكون ذلك ممكنًا)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
    - `agentFilter` و`sessionFilter` و`cleanupAfterResolve`

    يفعّل Discord موافقات التنفيذ الأصلية تلقائيًا عندما تكون `enabled` غير مضبوطة أو تساوي `"auto"` ويمكن تحليل معتمد واحد على الأقل، إما من `execApprovals.approvers` أو من `commands.ownerAllowFrom`. لا يستنتج Discord معتمدي التنفيذ من `allowFrom` الخاصة بالقناة، أو `dm.allowFrom` القديمة، أو `defaultTo` الخاصة بالرسائل المباشرة. اضبط `enabled: false` لتعطيل Discord كعميل موافقات أصلي بشكل صريح.

    عندما تكون قيمة `target` هي `channel` أو `both`، تكون مطالبة الموافقة مرئية في القناة. لا يمكن إلا للمعتمدين الذين تم تحليلهم استخدام الأزرار؛ أما المستخدمون الآخرون فيتلقون رفضًا مؤقتًا مرئيًا لهم فقط. تتضمن مطالبات الموافقة نص الأمر، لذا لا تفعّل التسليم إلى القناة إلا في القنوات الموثوقة. إذا تعذر اشتقاق معرّف القناة من مفتاح الجلسة، يعود OpenClaw إلى التسليم عبر الرسائل الخاصة.

    يعرض Discord أيضًا أزرار الموافقة المشتركة المستخدمة من قبل قنوات الدردشة الأخرى. ويضيف مهايئ Discord الأصلي بشكل أساسي توجيه الرسائل الخاصة للمعتمدين والتوزيع على القنوات.
    عندما تكون هذه الأزرار موجودة، فهي الواجهة الأساسية لتجربة الموافقة؛ ويجب على OpenClaw
    ألا يتضمن أمر `/approve` يدويًا إلا عندما تشير نتيجة الأداة إلى
    أن موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.

    تتبع مصادقة Gateway وتحليل الموافقات عقد عميل Gateway المشترك (`plugin:` IDs يتم تحليلها عبر `plugin.approval.resolve`؛ والمعرّفات الأخرى عبر `exec.approval.resolve`). تنتهي صلاحية الموافقات بعد 30 دقيقة بشكل افتراضي.

    راجع [موافقات Exec](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## الأدوات وبوابات الإجراءات

تتضمن إجراءات رسائل Discord المراسلة وإدارة القنوات والإشراف والحالة وإجراءات البيانات الوصفية.

أمثلة أساسية:

- المراسلة: `sendMessage` و`readMessages` و`editMessage` و`deleteMessage` و`threadReply`
- التفاعلات: `react` و`reactions` و`emojiList`
- الإشراف: `timeout` و`kick` و`ban`
- الحالة: `setPresence`

يقبل الإجراء `event-create` معلمة `image` اختيارية (URL أو مسار ملف محلي) لتعيين صورة غلاف الحدث المجدول.

توجد بوابات الإجراءات تحت `channels.discord.actions.*`.

سلوك البوابة الافتراضي:

| مجموعة الإجراءات                                                                                                                                                         | الافتراضي |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | مفعّل     |
| roles                                                                                                                                                                    | معطّل     |
| moderation                                                                                                                                                               | معطّل     |
| presence                                                                                                                                                                 | معطّل     |

## واجهة Components v2

يستخدم OpenClaw Discord components v2 لموافقات التنفيذ وعلامات السياق المتقاطع. يمكن لإجراءات رسائل Discord أيضًا قبول `components` لواجهة مستخدم مخصصة (متقدم؛ ويتطلب إنشاء حمولة مكونات عبر أداة discord)، بينما تظل `embeds` القديمة متاحة لكنها غير موصى بها.

- يضبط `channels.discord.ui.components.accentColor` لون التمييز المستخدم بواسطة حاويات مكونات Discord (hex).
- عيّنه لكل حساب عبر `channels.discord.accounts.<id>.ui.components.accentColor`.
- يتم تجاهل `embeds` عند وجود components v2.

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

يحتوي Discord على سطحين صوتيين مختلفين: **القنوات الصوتية** الفورية (محادثات مستمرة) و**مرفقات الرسائل الصوتية** (تنسيق معاينة الموجة الصوتية). تدعم Gateway كليهما.

### القنوات الصوتية

قائمة التحقق من الإعداد:

1. فعّل Message Content Intent في Discord Developer Portal.
2. فعّل Server Members Intent عند استخدام قوائم السماح المعتمدة على الأدوار/المستخدمين.
3. ادعُ البوت باستخدام النطاقين `bot` و`applications.commands`.
4. امنح أذونات Connect وSpeak وSend Messages وRead Message History في القناة الصوتية المستهدفة.
5. فعّل الأوامر الأصلية (`commands.native` أو `channels.discord.commands.native`).
6. هيّئ `channels.discord.voice`.

استخدم `/vc join|leave|status` للتحكم في الجلسات. يستخدم الأمر وكيل الحساب الافتراضي ويتبع قواعد قائمة السماح وسياسة المجموعات نفسها مثل أوامر Discord الأخرى.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

مثال على الانضمام التلقائي:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.4-mini",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "onyx" },
        },
      },
    },
  },
}
```

ملاحظات:

- تتجاوز `voice.tts` قيمة `messages.tts` لتشغيل الصوت فقط.
- تتجاوز `voice.model` نموذج LLM المستخدم فقط لردود القنوات الصوتية في Discord. اتركها غير مضبوطة لوراثة نموذج الوكيل الموجّه.
- يستخدم STT `tools.media.audio`؛ ولا تؤثر `voice.model` في التفريغ النصي.
- تستمد أدوار نصوص المحادثات الصوتية حالة المالك من `allowFrom` في Discord (أو `dm.allowFrom`)؛ ولا يمكن للمتحدثين غير المالكين الوصول إلى الأدوات المخصصة للمالك فقط (مثل `gateway` و`cron`).
- يكون الصوت مفعّلًا بشكل افتراضي؛ اضبط `channels.discord.voice.enabled=false` لتعطيله.
- يتم تمرير `voice.daveEncryption` و`voice.decryptionFailureTolerance` إلى خيارات الانضمام في `@discordjs/voice`.
- القيم الافتراضية في `@discordjs/voice` هي `daveEncryption=true` و`decryptionFailureTolerance=24` إذا لم يتم ضبطها.
- يراقب OpenClaw أيضًا إخفاقات فك التشفير عند الاستقبال ويستعيد تلقائيًا عبر مغادرة القناة الصوتية ثم الانضمام إليها مجددًا بعد تكرار الإخفاقات خلال نافذة قصيرة.
- إذا أظهرت سجلات الاستقبال مرارًا `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` بعد التحديث، فاجمع تقرير التبعيات والسجلات. يتضمن مسار `@discordjs/voice` المضمّن إصلاح الحشو من المصدر upstream من discord.js PR #11449، والذي أغلق المشكلة discord.js issue #11419.

مسار القناة الصوتية:

- يتم تحويل التقاط Discord PCM إلى ملف WAV مؤقت.
- يتولى `tools.media.audio` عملية STT، مثل `openai/gpt-4o-mini-transcribe`.
- يتم إرسال النص المفرغ عبر مسار الإدخال والتوجيه العادي في Discord.
- عند تعيين `voice.model`، فإنه يتجاوز فقط نموذج LLM الخاص بالاستجابة لهذا الدور في القناة الصوتية.
- يتم دمج `voice.tts` فوق `messages.tts`؛ ويُشغَّل الصوت الناتج في القناة التي تم الانضمام إليها.

يتم تحليل بيانات الاعتماد لكل مكوّن على حدة: مصادقة مسار LLM لـ `voice.model`، ومصادقة STT لـ `tools.media.audio`، ومصادقة TTS لـ `messages.tts`/`voice.tts`.

### الرسائل الصوتية

تعرض الرسائل الصوتية في Discord معاينة بشكل موجة صوتية، وتتطلب صوتًا بصيغة OGG/Opus. ينشئ OpenClaw الموجة الصوتية تلقائيًا، لكنه يحتاج إلى `ffmpeg` و`ffprobe` على مضيف Gateway للفحص والتحويل.

- وفّر **مسار ملف محلي** (يتم رفض عناوين URL).
- احذف المحتوى النصي (يرفض Discord النص + الرسالة الصوتية في الحمولة نفسها).
- تُقبل أي صيغة صوتية؛ ويحوّل OpenClaw الصوت إلى OGG/Opus عند الحاجة.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="تم استخدام امتيازات intents غير مسموح بها أو أن البوت لا يرى رسائل الخادم الجماعي">

    - فعّل Message Content Intent
    - فعّل Server Members Intent عندما تعتمد على تحليل المستخدم/العضو
    - أعد تشغيل Gateway بعد تغيير intents

  </Accordion>

  <Accordion title="يتم حظر رسائل الخادم الجماعي بشكل غير متوقع">

    - تحقّق من `groupPolicy`
    - تحقّق من قائمة السماح الخاصة بالخوادم تحت `channels.discord.guilds`
    - إذا وُجدت خريطة `channels` للخادم، فستُسمح القنوات المدرجة فقط
    - تحقّق من سلوك `requireMention` وأنماط الإشارة

    فحوصات مفيدة:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="تم تعيين require mention إلى false لكنه لا يزال محظورًا">
    الأسباب الشائعة:

    - `groupPolicy="allowlist"` بدون قائمة سماح مطابقة للخادم/القناة
    - تم إعداد `requireMention` في المكان الخطأ (يجب أن يكون تحت `channels.discord.guilds` أو ضمن إدخال القناة)
    - تم حظر المرسل بواسطة قائمة السماح `users` الخاصة بالخادم/القناة

  </Accordion>

  <Accordion title="تنتهي مهلة المعالجات طويلة التشغيل أو تظهر ردود مكررة">

    السجلات النموذجية:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    إعداد ميزانية المستمع:

    - حساب واحد: `channels.discord.eventQueue.listenerTimeout`
    - حسابات متعددة: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    إعداد مهلة تشغيل العامل:

    - حساب واحد: `channels.discord.inboundWorker.runTimeoutMs`
    - حسابات متعددة: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - الافتراضي: `1800000` (30 دقيقة)؛ اضبطه على `0` للتعطيل

    خط الأساس الموصى به:

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
          inboundWorker: {
            runTimeoutMs: 1800000,
          },
        },
      },
    },
  },
}
```

    استخدم `eventQueue.listenerTimeout` لإعداد المستمعات البطيئة، و`inboundWorker.runTimeoutMs`
    فقط إذا كنت تريد صمام أمان منفصلًا لأدوار الوكيل الموضوعة في الطابور.

  </Accordion>

  <Accordion title="عدم تطابق تدقيق الأذونات">
    تعمل فحوصات الأذونات في `channels status --probe` فقط مع معرّفات القنوات الرقمية.

    إذا كنت تستخدم مفاتيح slug، فقد يظل التطابق في وقت التشغيل يعمل، لكن probe لا يمكنه التحقق الكامل من الأذونات.

  </Accordion>

  <Accordion title="مشكلات الرسائل الخاصة والاقتران">

    - الرسائل الخاصة معطّلة: `channels.discord.dm.enabled=false`
    - سياسة الرسائل الخاصة معطّلة: `channels.discord.dmPolicy="disabled"` (الاسم القديم: `channels.discord.dm.policy`)
    - بانتظار الموافقة على الاقتران في وضع `pairing`

  </Accordion>

  <Accordion title="حلقات بوت إلى بوت">
    بشكل افتراضي، يتم تجاهل الرسائل التي يكتبها بوت.

    إذا قمت بتعيين `channels.discord.allowBots=true`، فاستخدم قواعد صارمة للإشارة وقائمة السماح لتجنب سلوك الحلقات.
    يُفضّل `channels.discord.allowBots="mentions"` لقبول رسائل البوت التي تشير إلى البوت فقط.

  </Accordion>

  <Accordion title="يتم إسقاط STT الصوتي مع DecryptionFailed(...)">

    - حافظ على تحديث OpenClaw (`openclaw update`) حتى تكون منطقية استرداد الاستقبال الصوتي في Discord موجودة
    - أكّد أن `channels.discord.voice.daveEncryption=true` (افتراضي)
    - ابدأ من `channels.discord.voice.decryptionFailureTolerance=24` (القيمة الافتراضية في upstream) واضبط فقط عند الحاجة
    - راقب السجلات بحثًا عن:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - إذا استمرت الإخفاقات بعد إعادة الانضمام التلقائية، فاجمع السجلات وقارنها بسجل استقبال DAVE في upstream ضمن [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) و[discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## مرجع الإعدادات

المرجع الأساسي: [مرجع الإعدادات - Discord](/ar/gateway/config-channels#discord).

<Accordion title="حقول Discord عالية الأهمية">

- بدء التشغيل/المصادقة: `enabled` و`token` و`accounts.*` و`allowBots`
- السياسة: `groupPolicy` و`dm.*` و`guilds.*` و`guilds.*.channels.*`
- الأوامر: `commands.native` و`commands.useAccessGroups` و`configWrites` و`slashCommand.*`
- طابور الأحداث: `eventQueue.listenerTimeout` (ميزانية المستمع) و`eventQueue.maxQueueSize` و`eventQueue.maxConcurrency`
- العامل الوارد: `inboundWorker.runTimeoutMs`
- الرد/السجل: `replyToMode` و`historyLimit` و`dmHistoryLimit` و`dms.*.historyLimit`
- التسليم: `textChunkLimit` و`chunkMode` و`maxLinesPerMessage`
- البث: `streaming` (الاسم البديل القديم: `streamMode`) و`streaming.preview.toolProgress` و`draftChunk` و`blockStreaming` و`blockStreamingCoalesce`
- الوسائط/إعادة المحاولة: `mediaMaxMb` (يضع حدًا أقصى للرفع الصادر إلى Discord، الافتراضي `100MB`) و`retry`
- الإجراءات: `actions.*`
- الحالة: `activity` و`status` و`activityType` و`activityUrl`
- واجهة المستخدم: `ui.components.accentColor`
- الميزات: `threadBindings` و`bindings[]` على المستوى الأعلى (`type: "acp"`) و`pluralkit` و`execApprovals` و`intents` و`agentComponents` و`heartbeat` و`responsePrefix`

</Accordion>

## السلامة والعمليات

- تعامل مع رموز البوت المميزة كأسرار (ويُفضّل `DISCORD_BOT_TOKEN` في البيئات الخاضعة للإشراف).
- امنح أقل قدر ممكن من أذونات Discord.
- إذا كانت حالة/نشر الأوامر قديمة، فأعد تشغيل Gateway ثم أعد التحقق باستخدام `openclaw channels status --probe`.

## ذو صلة

<CardGroup cols={2}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    اقترن بمستخدم Discord إلى Gateway.
  </Card>
  <Card title="المجموعات" icon="users" href="/ar/channels/groups">
    سلوك الدردشة الجماعية وقائمة السماح.
  </Card>
  <Card title="توجيه القنوات" icon="route" href="/ar/channels/channel-routing">
    وجّه الرسائل الواردة إلى الوكلاء.
  </Card>
  <Card title="الأمان" icon="shield" href="/ar/gateway/security">
    نموذج التهديد والتقوية.
  </Card>
  <Card title="التوجيه متعدد الوكلاء" icon="sitemap" href="/ar/concepts/multi-agent">
    اربط الخوادم والقنوات بالوكلاء.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلية.
  </Card>
</CardGroup>

---
read_when:
    - العمل على ميزات قناة Discord
summary: حالة دعم بوت Discord وإمكاناته وإعداده
title: Discord
x-i18n:
    generated_at: "2026-04-24T07:29:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce73e0e6995702f3b2453b2e5ab4e55b02190e64fdf5805f53b4002be63140a2
    source_path: channels/discord.md
    workflow: 15
---

جاهز للرسائل الخاصة والقنوات داخل الخوادم عبر Discord gateway الرسمي.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    تكون الرسائل الخاصة في Discord في وضع الاقتران افتراضيًا.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وكتالوج الأوامر.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    التشخيص والإصلاح عبر القنوات المختلفة.
  </Card>
</CardGroup>

## إعداد سريع

ستحتاج إلى إنشاء تطبيق جديد يحتوي على بوت، وإضافة البوت إلى خادمك، ثم إقرانه مع OpenClaw. نوصي بإضافة البوت إلى خادمك الخاص. إذا لم يكن لديك خادم بعد، [فأنشئ واحدًا أولًا](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (اختر **Create My Own > For me and my friends**).

<Steps>
  <Step title="إنشاء تطبيق Discord وبوت">
    انتقل إلى [Discord Developer Portal](https://discord.com/developers/applications) وانقر على **New Application**. امنحه اسمًا مثل "OpenClaw".

    انقر على **Bot** في الشريط الجانبي. اضبط **Username** على الاسم الذي تطلقه على وكيل OpenClaw الخاص بك.

  </Step>

  <Step title="تمكين النوايا المميزة">
    وأنت لا تزال في صفحة **Bot**، مرّر إلى أسفل إلى **Privileged Gateway Intents** وقم بتمكين ما يلي:

    - **Message Content Intent** (مطلوب)
    - **Server Members Intent** (موصى به؛ مطلوب لقوائم السماح الخاصة بالأدوار ولمطابقة الاسم مع المعرّف)
    - **Presence Intent** (اختياري؛ مطلوب فقط لتحديثات الحالة)

  </Step>

  <Step title="نسخ رمز البوت المميز">
    مرّر مرة أخرى إلى أعلى صفحة **Bot** وانقر على **Reset Token**.

    <Note>
    على الرغم من الاسم، فإن هذا يُنشئ أول رمز مميز لك — لا تتم "إعادة تعيين" أي شيء.
    </Note>

    انسخ الرمز المميز واحفظه في مكان ما. هذا هو **Bot Token** الخاص بك، وستحتاج إليه بعد قليل.

  </Step>

  <Step title="إنشاء رابط دعوة وإضافة البوت إلى خادمك">
    انقر على **OAuth2** في الشريط الجانبي. ستُنشئ رابط دعوة بالأذونات المناسبة لإضافة البوت إلى خادمك.

    مرّر إلى أسفل إلى **OAuth2 URL Generator** وقم بتمكين:

    - `bot`
    - `applications.commands`

    سيظهر قسم **Bot Permissions** في الأسفل. قم بتمكين ما يلي على الأقل:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (اختياري)

    هذه هي المجموعة الأساسية للقنوات النصية العادية. إذا كنت تخطط للنشر في سلاسل Discord، بما في ذلك تدفقات العمل في قنوات المنتدى أو الوسائط التي تنشئ سلسلة أو تواصلها، فقم أيضًا بتمكين **Send Messages in Threads**.
    انسخ الرابط الذي تم إنشاؤه في الأسفل، والصقه في متصفحك، واختر خادمك، ثم انقر **Continue** للاتصال. ينبغي أن ترى الآن البوت في خادم Discord.

  </Step>

  <Step title="تمكين وضع المطور وجمع المعرّفات">
    بالعودة إلى تطبيق Discord، تحتاج إلى تمكين Developer Mode حتى تتمكن من نسخ المعرّفات الداخلية.

    1. انقر على **User Settings** (أيقونة الترس بجوار صورتك الرمزية) → **Advanced** → فعّل **Developer Mode**
    2. انقر بزر الماوس الأيمن على **أيقونة الخادم** في الشريط الجانبي → **Copy Server ID**
    3. انقر بزر الماوس الأيمن على **صورتك الرمزية** → **Copy User ID**

    احفظ **Server ID** و**User ID** إلى جانب Bot Token — سترسل الثلاثة جميعًا إلى OpenClaw في الخطوة التالية.

  </Step>

  <Step title="السماح بالرسائل الخاصة من أعضاء الخادم">
    لكي يعمل الاقتران، يجب أن يسمح Discord للبوت بإرسال رسائل خاصة إليك. انقر بزر الماوس الأيمن على **أيقونة الخادم** → **Privacy Settings** → فعّل **Direct Messages**.

    يتيح هذا لأعضاء الخادم (بمن فيهم البوتات) إرسال رسائل خاصة إليك. أبقِ هذا الإعداد مفعّلًا إذا كنت تريد استخدام الرسائل الخاصة في Discord مع OpenClaw. إذا كنت تخطط لاستخدام قنوات الخادم فقط، فيمكنك تعطيل الرسائل الخاصة بعد الاقتران.

  </Step>

  <Step title="ضبط Bot Token الخاص بك بشكل آمن (لا ترسله في الدردشة)">
    رمز بوت Discord المميز الخاص بك سرّي (مثل كلمة المرور). اضبطه على الجهاز الذي يشغّل OpenClaw قبل مراسلة وكيلك.

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    إذا كان OpenClaw يعمل بالفعل كخدمة في الخلفية، فأعد تشغيله عبر تطبيق OpenClaw على Mac أو بإيقاف عملية `openclaw gateway run` ثم تشغيلها من جديد.

  </Step>

  <Step title="إعداد OpenClaw وإقرانه">

    <Tabs>
      <Tab title="اسأل وكيلك">
        تحدّث مع وكيل OpenClaw الخاص بك على أي قناة موجودة بالفعل (مثل Telegram) وأخبره بذلك. إذا كانت Discord هي قناتك الأولى، فاستخدم تبويب CLI / config بدلًا من ذلك.

        > "لقد قمت بالفعل بضبط Discord bot token في الإعدادات. يُرجى إكمال إعداد Discord باستخدام User ID `<user_id>` وServer ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        إذا كنت تفضل الإعدادات المعتمدة على الملفات، فاضبط ما يلي:

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

        الرجوع إلى متغيرات البيئة للحساب الافتراضي:

```bash
DISCORD_BOT_TOKEN=...
```

        قيم `token` النصية الصريحة مدعومة. كما أن قيم SecretRef مدعومة أيضًا لـ `channels.discord.token` عبر موفري env/file/exec. راجع [إدارة الأسرار](/ar/gateway/secrets).

      </Tab>
    </Tabs>

  </Step>

  <Step title="الموافقة على أول اقتران عبر رسالة خاصة">
    انتظر حتى يعمل Gateway، ثم أرسل رسالة خاصة إلى البوت في Discord. سيرد عليك برمز اقتران.

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

    يجب أن تتمكن الآن من التحدث مع وكيلك في Discord عبر الرسائل الخاصة.

  </Step>
</Steps>

<Note>
يتم حل الرمز المميز مع مراعاة الحساب. تفوز قيم الرموز المميزة في الإعدادات على الرجوع إلى متغيرات البيئة. يُستخدم `DISCORD_BOT_TOKEN` فقط للحساب الافتراضي.
بالنسبة لاستدعاءات الخروج المتقدمة (أداة الرسائل/إجراءات القناة)، يُستخدم `token` صريح لكل استدعاء لتلك العملية. ينطبق ذلك على إجراءات الإرسال وكذلك إجراءات القراءة/التحقق (مثل read/search/fetch/thread/pins/permissions). تظل إعدادات السياسة/إعادة المحاولة الخاصة بالحساب قادمة من الحساب المحدد في اللقطة النشطة لوقت التشغيل.
</Note>

## موصى به: إعداد مساحة عمل للخادم

بمجرد أن تعمل الرسائل الخاصة، يمكنك إعداد خادم Discord الخاص بك كمساحة عمل كاملة حيث تحصل كل قناة على جلسة وكيل خاصة بها وسياقها الخاص. يُوصى بهذا للخوادم الخاصة التي تكون أنت والبوت فقط فيها.

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

  <Step title="السماح بالردود من دون @mention">
    افتراضيًا، لا يرد وكيلك في قنوات الخادم إلا عند الإشارة إليه عبر @mention. بالنسبة إلى خادم خاص، من المحتمل أنك تريد أن يرد على كل رسالة.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "اسمح لوكيلي بالرد على هذا الخادم من دون الحاجة إلى @mentioned"
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

  <Step title="التخطيط لاستخدام الذاكرة في قنوات الخادم">
    افتراضيًا، لا يتم تحميل الذاكرة طويلة الأمد (MEMORY.md) إلا في جلسات الرسائل الخاصة. لا تقوم قنوات الخادم بتحميل MEMORY.md تلقائيًا.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "عندما أطرح أسئلة في قنوات Discord، استخدم memory_search أو memory_get إذا كنت بحاجة إلى سياق طويل الأمد من MEMORY.md."
      </Tab>
      <Tab title="يدويًا">
        إذا كنت بحاجة إلى سياق مشترك في كل قناة، فضع التعليمات الثابتة في `AGENTS.md` أو `USER.md` (يتم حقنهما في كل جلسة). واحتفظ بالملاحظات طويلة الأمد في `MEMORY.md` وادخل إليها عند الطلب باستخدام أدوات الذاكرة.
      </Tab>
    </Tabs>

  </Step>
</Steps>

أنشئ الآن بعض القنوات على خادم Discord الخاص بك وابدأ الدردشة. يمكن لوكيلك رؤية اسم القناة، وتحصل كل قناة على جلسة معزولة خاصة بها — لذا يمكنك إعداد `#coding` أو `#home` أو `#research` أو أي شيء يناسب سير عملك.

## نموذج وقت التشغيل

- يتولى Gateway اتصال Discord.
- توجيه الردود حتمي: الردود الواردة من Discord تعود إلى Discord.
- افتراضيًا (`session.dmScope=main`)، تشارك الدردشات المباشرة الجلسة الرئيسية للوكيل (`agent:main:main`).
- قنوات الخادم عبارة عن مفاتيح جلسات معزولة (`agent:<agentId>:discord:channel:<channelId>`).
- يتم تجاهل الرسائل الخاصة الجماعية افتراضيًا (`channels.discord.dm.groupEnabled=false`).
- تعمل أوامر الشرطة المائلة الأصلية في جلسات أوامر معزولة (`agent:<agentId>:discord:slash:<userId>`)، مع الاستمرار في حمل `CommandTargetSessionKey` إلى جلسة المحادثة الموجّهة.

## قنوات المنتدى

لا تقبل قنوات المنتدى والوسائط في Discord إلا المنشورات ضمن سلاسل. يدعم OpenClaw طريقتين لإنشائها:

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

لا تقبل أصول المنتدى مكونات Discord. إذا كنت بحاجة إلى مكونات، فأرسل إلى السلسلة نفسها (`channel:<threadId>`).

## المكونات التفاعلية

يدعم OpenClaw حاويات مكونات Discord v2 لرسائل الوكيل. استخدم أداة الرسائل مع حمولة `components`. يتم توجيه نتائج التفاعل مرة أخرى إلى الوكيل كرسائل واردة عادية وتتبع إعدادات Discord `replyToMode` الحالية.

الكتل المدعومة:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- تسمح صفوف الإجراءات بما يصل إلى 5 أزرار أو قائمة تحديد واحدة
- أنواع التحديد: `string`, `user`, `role`, `mentionable`, `channel`

افتراضيًا، تكون المكونات للاستخدام مرة واحدة. اضبط `components.reusable=true` للسماح باستخدام الأزرار والقوائم والنماذج عدة مرات حتى تنتهي صلاحيتها.

لتقييد من يمكنه النقر على زر، اضبط `allowedUsers` على ذلك الزر (معرّفات مستخدمي Discord أو العلامات أو `*`). عند الإعداد، يتلقى المستخدمون غير المطابقين رفضًا سريع الزوال.

يفتح الأمران `/model` و`/models` منتقي نماذج تفاعليًا مع قوائم منسدلة لموفر الخدمة والنموذج بالإضافة إلى خطوة Submit. ما لم يكن `commands.modelsWrite=false`، يدعم `/models add` أيضًا إضافة إدخال جديد لموفر/نموذج من الدردشة، وتظهر النماذج المضافة حديثًا من دون إعادة تشغيل Gateway. يكون رد المنتقي سريع الزوال ولا يمكن استخدامه إلا من قبل المستخدم الذي استدعاه.

مرفقات الملفات:

- يجب أن تشير كتل `file` إلى مرجع مرفق (`attachment://<filename>`)
- وفّر المرفق عبر `media`/`path`/`filePath` (ملف واحد)؛ استخدم `media-gallery` لعدة ملفات
- استخدم `filename` لتجاوز اسم الرفع عندما يجب أن يطابق مرجع المرفق

النماذج المنبثقة:

- أضف `components.modal` بما يصل إلى 5 حقول
- أنواع الحقول: `text`, `checkbox`, `radio`, `select`, `role-select`, `user-select`
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
    يتحكم `channels.discord.dmPolicy` في الوصول إلى الرسائل الخاصة (قديمًا: `channels.discord.dm.policy`):

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `channels.discord.allowFrom` القيمة `"*"`؛ قديمًا: `channels.discord.dm.allowFrom`)
    - `disabled`

    إذا لم تكن سياسة الرسائل الخاصة مفتوحة، فسيتم حظر المستخدمين غير المعروفين (أو مطالبتهم بالاقتران في وضع `pairing`).

    أسبقية تعدد الحسابات:

    - ينطبق `channels.discord.accounts.default.allowFrom` على الحساب `default` فقط.
    - ترث الحسابات المسماة `channels.discord.allowFrom` عندما لا يكون `allowFrom` الخاص بها مضبوطًا.
    - لا ترث الحسابات المسماة `channels.discord.accounts.default.allowFrom`.

    تنسيق هدف الرسائل الخاصة للتسليم:

    - `user:<id>`
    - الإشارة `<@id>`

    المعرّفات الرقمية المجردة ملتبسة ويتم رفضها ما لم يتم توفير نوع هدف مستخدم/قناة صريح.

  </Tab>

  <Tab title="سياسة الخادم">
    يتم التحكم في التعامل مع الخوادم بواسطة `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    خط الأساس الآمن عند وجود `channels.discord` هو `allowlist`.

    سلوك `allowlist`:

    - يجب أن يطابق الخادم `channels.discord.guilds` (يُفضَّل `id`، ويُقبل slug)
    - قوائم سماح اختيارية للمرسل: `users` (يُوصى بالمعرّفات الثابتة) و`roles` (معرّفات الأدوار فقط)؛ إذا تم ضبط أي منهما، يُسمح للمرسلين عندما يطابقون `users` أو `roles`
    - تكون مطابقة الاسم/العلامة المباشرة معطلة افتراضيًا؛ فعّل `channels.discord.dangerouslyAllowNameMatching: true` فقط كوضع توافق طارئ
    - الأسماء/العلامات مدعومة في `users`، لكن المعرّفات أكثر أمانًا؛ ويحذر `openclaw security audit` عند استخدام إدخالات الاسم/العلامة
    - إذا كان لدى خادم ما `channels` مضبوطة، فسيتم رفض القنوات غير المدرجة
    - إذا لم يكن لدى الخادم كتلة `channels`، فستُسمح جميع القنوات في ذلك الخادم المدرج في قائمة السماح

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

    إذا قمت فقط بضبط `DISCORD_BOT_TOKEN` ولم تنشئ كتلة `channels.discord`، فسيكون الرجوع في وقت التشغيل إلى `groupPolicy="allowlist"` (مع تحذير في السجلات)، حتى إذا كانت `channels.defaults.groupPolicy` تساوي `open`.

  </Tab>

  <Tab title="الإشارات والرسائل الخاصة الجماعية">
    رسائل الخادم مقيدة بالإشارة افتراضيًا.

    يتضمن اكتشاف الإشارة:

    - إشارة صريحة إلى البوت
    - أنماط الإشارة المضبوطة (`agents.list[].groupChat.mentionPatterns`، مع الرجوع إلى `messages.groupChat.mentionPatterns`)
    - سلوك الرد الضمني على البوت في الحالات المدعومة

    يتم ضبط `requireMention` لكل خادم/قناة على حدة (`channels.discord.guilds...`).
    يقوم `ignoreOtherMentions` اختياريًا بإسقاط الرسائل التي تشير إلى مستخدم/دور آخر ولكن ليس إلى البوت (باستثناء @everyone/@here).

    الرسائل الخاصة الجماعية:

    - افتراضيًا: يتم تجاهلها (`dm.groupEnabled=false`)
    - قائمة سماح اختيارية عبر `dm.groupChannels` (معرّفات القنوات أو slugs)

  </Tab>
</Tabs>

### توجيه الوكيل المستند إلى الأدوار

استخدم `bindings[].match.roles` لتوجيه أعضاء خوادم Discord إلى وكلاء مختلفين حسب معرّف الدور. تقبل الارتباطات المستندة إلى الأدوار معرّفات الأدوار فقط، ويتم تقييمها بعد ارتباطات النظير أو نظير الأصل وقبل الارتباطات الخاصة بالخادم فقط. إذا كان الارتباط يضبط أيضًا حقول مطابقة أخرى (مثل `peer` + `guildId` + `roles`)، فيجب أن تتطابق كل الحقول المضبوطة.

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

- القيمة الافتراضية لـ `commands.native` هي `"auto"`، وهي ممكّنة لـ Discord.
- تجاوز لكل قناة: `channels.discord.commands.native`.
- يقوم `commands.native=false` صراحةً بمسح أوامر Discord الأصلية المسجَّلة سابقًا.
- تستخدم مصادقة الأوامر الأصلية نفس قوائم السماح/السياسات الخاصة بـ Discord المستخدمة في معالجة الرسائل العادية.
- قد تظل الأوامر مرئية في واجهة Discord للمستخدمين غير المصرح لهم؛ لكن التنفيذ يفرض مصادقة OpenClaw مع إرجاع "غير مصرح".

راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands) للاطلاع على كتالوج الأوامر وسلوكها.

إعدادات أوامر الشرطة المائلة الافتراضية:

- `ephemeral: true`

## تفاصيل الميزات

<AccordionGroup>
  <Accordion title="وسوم الردود والردود الأصلية">
    يدعم Discord وسوم الردود في مخرجات الوكيل:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    يتحكم فيها `channels.discord.replyToMode`:

    - `off` (افتراضي)
    - `first`
    - `all`
    - `batched`

    ملاحظة: يعطّل `off` تسلسل الردود الضمني. لا تزال وسوم `[[reply_to_*]]` الصريحة محترمة.
    يرفق `first` دائمًا مرجع الرد الأصلي الضمني بأول رسالة Discord صادرة في الدور.
    يرفق `batched` مرجع الرد الأصلي الضمني في Discord فقط عندما
    يكون الدور الوارد دفعة مؤجلة من عدة رسائل. وهذا مفيد
    عندما تريد الردود الأصلية أساسًا للمحادثات المتدفقة والملتبسة، لا لكل
    دور رسالة واحدة.

    يتم إظهار معرّفات الرسائل في السياق/السجل حتى تتمكن الوكلاء من استهداف رسائل محددة.

  </Accordion>

  <Accordion title="معاينة البث المباشر">
    يمكن لـ OpenClaw بث مسودات الردود عبر إرسال رسالة مؤقتة وتحريرها مع وصول النص. يقبل `channels.discord.streaming` القيم `off` (افتراضي) | `partial` | `block` | `progress`. يتم تعيين `progress` إلى `partial` في Discord؛ و`streamMode` اسم مستعار قديم تتم ترحيلته تلقائيًا.

    تبقى القيمة الافتراضية `off` لأن تعديلات معاينة Discord تصطدم بسرعة بحدود المعدل عندما تشارك عدة بوتات أو Gateways الحساب نفسه.

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
    - يصدر `block` أجزاء بحجم المسودة (استخدم `draftChunk` لضبط الحجم ونقاط التقسيم، مع تقييدها إلى `textChunkLimit`).
    - تؤدي الوسائط والأخطاء والردود النهائية الصريحة إلى إلغاء تعديلات المعاينة المعلقة.
    - يتحكم `streaming.preview.toolProgress` (افتراضيًا `true`) في ما إذا كانت تحديثات الأدوات/التقدم ستعيد استخدام رسالة المعاينة.

    بث المعاينة نصي فقط؛ وتعود ردود الوسائط إلى التسليم العادي. عند تمكين بث `block` صراحةً، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

  </Accordion>

  <Accordion title="السجل والسياق وسلوك السلاسل">
    سياق سجل الخادم:

    - القيمة الافتراضية لـ `channels.discord.historyLimit` هي `20`
    - الرجوع إلى: `messages.groupChat.historyLimit`
    - `0` للتعطيل

    عناصر التحكم في سجل الرسائل الخاصة:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    سلوك السلاسل:

    - يتم توجيه سلاسل Discord كجلسات قنوات وترث إعدادات القناة الأصل ما لم يتم تجاوزها.
    - يضمّن `channels.discord.thread.inheritParent` (افتراضيًا `false`) السلاسل التلقائية الجديدة في التهيئة من سجل الأصل. توجد التجاوزات لكل حساب تحت `channels.discord.accounts.<id>.thread.inheritParent`.
    - يمكن لتفاعلات أداة الرسائل حل أهداف الرسائل الخاصة `user:<id>`.
    - يتم الحفاظ على `guilds.<guild>.channels.<channel>.requireMention: false` أثناء الرجوع إلى تنشيط مرحلة الرد.

    يتم حقن مواضيع القنوات كسياق **غير موثوق**. تتحكم قوائم السماح في من يمكنه تشغيل الوكيل، وليست حدًا كاملًا لتنقيح السياق الإضافي.

  </Accordion>

  <Accordion title="جلسات مرتبطة بالسلاسل للوكلاء الفرعيين">
    يمكن لـ Discord ربط سلسلة بهدف جلسة بحيث تستمر الرسائل اللاحقة في تلك السلسلة في التوجيه إلى الجلسة نفسها (بما في ذلك جلسات الوكلاء الفرعيين).

    الأوامر:

    - `/focus <target>` ربط السلسلة الحالية/الجديدة بهدف وكيل فرعي/جلسة
    - `/unfocus` إزالة الربط الحالي للسلسلة
    - `/agents` عرض العمليات النشطة وحالة الربط
    - `/session idle <duration|off>` فحص/تحديث إلغاء التركيز التلقائي عند الخمول للارتباطات المركزة
    - `/session max-age <duration|off>` فحص/تحديث الحد الأقصى الصارم للعمر للارتباطات المركزة

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

    - يضبط `session.threadBindings.*` القيم الافتراضية العامة.
    - يتجاوز `channels.discord.threadBindings.*` سلوك Discord.
    - يجب أن تكون `spawnSubagentSessions` بقيمة true لإنشاء/ربط السلاسل تلقائيًا لـ `sessions_spawn({ thread: true })`.
    - يجب أن تكون `spawnAcpSessions` بقيمة true لإنشاء/ربط السلاسل تلقائيًا لـ ACP (`/acp spawn ... --thread ...` أو `sessions_spawn({ runtime: "acp", thread: true })`).
    - إذا كانت ارتباطات السلاسل معطلة لحساب ما، فلن تكون `/focus` وعمليات ربط السلاسل ذات الصلة متاحة.

    راجع [الوكلاء الفرعيون](/ar/tools/subagents) و[وكلاء ACP](/ar/tools/acp-agents) و[مرجع الإعدادات](/ar/gateway/configuration-reference).

  </Accordion>

  <Accordion title="ارتباطات قناة ACP الدائمة">
    لمساحات عمل ACP المستقرة "قيد التشغيل دائمًا"، قم بإعداد ارتباطات ACP مكتوبة على المستوى الأعلى تستهدف محادثات Discord.

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

    - يقوم `/acp spawn codex --bind here` بربط القناة أو السلسلة الحالية في مكانها ويحافظ على توجيه الرسائل المستقبلية إلى جلسة ACP نفسها. وترث رسائل السلسلة ارتباط القناة الأصل.
    - في قناة أو سلسلة مرتبطة، يعيد `/new` و`/reset` تعيين جلسة ACP نفسها في مكانها. ويمكن لارتباطات السلاسل المؤقتة تجاوز تحديد الهدف أثناء نشاطها.
    - لا تكون `spawnAcpSessions` مطلوبة إلا عندما يحتاج OpenClaw إلى إنشاء/ربط سلسلة فرعية عبر `--thread auto|here`.

    راجع [وكلاء ACP](/ar/tools/acp-agents) للاطلاع على تفاصيل سلوك الارتباط.

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
    يرسل `ackReaction` رمزًا تعبيريًا للإقرار أثناء معالجة OpenClaw لرسالة واردة.

    ترتيب الحل:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - الرجوع إلى الرمز التعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا `"👀"`)

    ملاحظات:

    - يقبل Discord الرموز التعبيرية الموحّدة أو أسماء الرموز التعبيرية المخصصة.
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="كتابات الإعدادات">
    تكون كتابات الإعدادات التي تبدأ من القناة مفعلة افتراضيًا.

    يؤثر هذا في تدفقات `/config set|unset` (عندما تكون ميزات الأوامر مفعلة).

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
    قم بتوجيه حركة WebSocket الخاصة بـ Discord gateway وعمليات بحث REST عند البدء (معرّف التطبيق + حل قائمة السماح) عبر وكيل HTTP(S) باستخدام `channels.discord.proxy`.

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
    قم بتمكين حل PluralKit لربط الرسائل الممررة بهوية عضو النظام:

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
    - تتم مطابقة الأسماء المعروضة للأعضاء بالاسم/slug فقط عندما تكون `channels.discord.dangerouslyAllowNameMatching: true`
    - تستخدم عمليات البحث معرّف الرسالة الأصلي وتكون مقيدة بنافذة زمنية
    - إذا فشل البحث، تُعامل الرسائل الممررة كرسائل بوت ويتم إسقاطها ما لم تكن `allowBots=true`

  </Accordion>

  <Accordion title="إعداد الحالة">
    يتم تطبيق تحديثات الحالة عند تعيين حقل حالة أو نشاط، أو عند تمكين الحالة التلقائية.

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

    مثال على النشاط (الحالة المخصصة هي نوع النشاط الافتراضي):

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
    - 4: Custom (يستخدم نص النشاط بوصفه حالة النشاط؛ والرمز التعبيري اختياري)
    - 5: Competing

    مثال على الحالة التلقائية (إشارة سلامة وقت التشغيل):

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

    تربط الحالة التلقائية إتاحة وقت التشغيل بحالة Discord: healthy => online، وdegraded أو unknown => idle، وexhausted أو unavailable => dnd. تجاوزات النص الاختيارية:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (يدعم العنصر النائب `{reason}`)

  </Accordion>

  <Accordion title="الموافقات في Discord">
    يدعم Discord معالجة الموافقات المعتمدة على الأزرار في الرسائل الخاصة، ويمكنه اختياريًا نشر مطالبات الموافقة في القناة الأصلية.

    مسار الإعدادات:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختياري؛ يرجع إلى `commands.ownerAllowFrom` عندما يكون ذلك ممكنًا)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    يقوم Discord بتمكين موافقات exec الأصلية تلقائيًا عندما تكون `enabled` غير مضبوطة أو تساوي `"auto"` ويمكن حل مُوافق واحد على الأقل، إما من `execApprovals.approvers` أو من `commands.ownerAllowFrom`. لا يستنتج Discord الموافقين على exec من `allowFrom` الخاصة بالقناة، أو `dm.allowFrom` القديمة، أو `defaultTo` للرسائل المباشرة. اضبط `enabled: false` لتعطيل Discord بوصفه عميل موافقة أصليًا بشكل صريح.

    عندما تكون `target` هي `channel` أو `both`، تكون مطالبة الموافقة مرئية في القناة. ولا يمكن سوى للموافقين الذين تم حلهم استخدام الأزرار؛ ويتلقى المستخدمون الآخرون رفضًا سريع الزوال. تتضمن مطالبات الموافقة نص الأمر، لذا فعّل التسليم إلى القناة فقط في القنوات الموثوقة. إذا تعذر اشتقاق معرّف القناة من مفتاح الجلسة، يعود OpenClaw إلى التسليم عبر الرسائل الخاصة.

    يعرض Discord أيضًا أزرار الموافقة المشتركة التي تستخدمها قنوات الدردشة الأخرى. ويضيف محول Discord الأصلي أساسًا توجيه الرسائل الخاصة للموافقين والتوزيع على القنوات.
    عند وجود هذه الأزرار، تكون هي تجربة الموافقة الأساسية؛ ويجب على OpenClaw
    تضمين أمر `/approve` يدوي فقط عندما تشير نتيجة الأداة إلى
    أن موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.

    تتبع مصادقة Gateway وحل الموافقات عقد عميل Gateway المشترك (`plugin:` IDs يتم حلها عبر `plugin.approval.resolve`؛ والمعرّفات الأخرى عبر `exec.approval.resolve`). تنتهي صلاحية الموافقات بعد 30 دقيقة افتراضيًا.

    راجع [موافقات Exec](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## الأدوات وبوابات الإجراءات

تتضمن إجراءات رسائل Discord المراسلة، وإدارة القنوات، والإشراف، والحالة، وإجراءات البيانات الوصفية.

أمثلة أساسية:

- المراسلة: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- التفاعلات: `react`, `reactions`, `emojiList`
- الإشراف: `timeout`, `kick`, `ban`
- الحالة: `setPresence`

يقبل الإجراء `event-create` معاملاً اختياريًا `image` (URL أو مسار ملف محلي) لتعيين صورة غلاف الحدث المجدول.

توجد بوابات الإجراءات تحت `channels.discord.actions.*`.

سلوك بوابات الإجراءات الافتراضي:

| مجموعة الإجراءات                                                                                                                                                         | الافتراضي |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | مفعّل     |
| roles                                                                                                                                                                    | معطّل     |
| moderation                                                                                                                                                               | معطّل     |
| presence                                                                                                                                                                 | معطّل     |

## واجهة مكونات v2

يستخدم OpenClaw مكونات Discord v2 لموافقات exec وعلامات السياق المتقاطع. كما يمكن لإجراءات رسائل Discord قبول `components` لواجهة مستخدم مخصصة (متقدم؛ يتطلب إنشاء حمولة مكونات عبر أداة discord)، بينما تظل `embeds` القديمة متاحة ولكن لا يُنصح بها.

- يضبط `channels.discord.ui.components.accentColor` لون التمييز المستخدم من قبل حاويات مكونات Discord (hex).
- اضبطه لكل حساب باستخدام `channels.discord.accounts.<id>.ui.components.accentColor`.
- يتم تجاهل `embeds` عند وجود مكونات v2.

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

يحتوي Discord على سطحين صوتيين متميزين: **القنوات الصوتية** في الوقت الفعلي (محادثات مستمرة) و**مرفقات الرسائل الصوتية** (تنسيق معاينة الموجة). يدعم Gateway كليهما.

### القنوات الصوتية

المتطلبات:

- فعّل الأوامر الأصلية (`commands.native` أو `channels.discord.commands.native`).
- اضبط `channels.discord.voice`.
- يحتاج البوت إلى أذونات Connect وSpeak في القناة الصوتية المستهدفة.

استخدم `/vc join|leave|status` للتحكم في الجلسات. يستخدم الأمر الوكيل الافتراضي للحساب ويتبع قواعد قائمة السماح وسياسة المجموعات نفسها مثل أوامر Discord الأخرى.

مثال على الانضمام التلقائي:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
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
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

ملاحظات:

- يتجاوز `voice.tts` القيمة `messages.tts` لتشغيل الصوت فقط.
- تستمد أدوار ملكية المحادثات الصوتية من `allowFrom` الخاصة بـ Discord (أو `dm.allowFrom`)؛ ولا يمكن للمتحدثين غير المالكين الوصول إلى الأدوات المخصصة للمالك فقط (مثل `gateway` و`cron`).
- يكون الصوت مفعلاً افتراضيًا؛ اضبط `channels.discord.voice.enabled=false` لتعطيله.
- تمرَّر `voice.daveEncryption` و`voice.decryptionFailureTolerance` إلى خيارات الانضمام الخاصة بـ `@discordjs/voice`.
- تكون القيم الافتراضية لـ `@discordjs/voice` هي `daveEncryption=true` و`decryptionFailureTolerance=24` إذا لم يتم ضبطها.
- يراقب OpenClaw أيضًا حالات فشل فك التشفير عند الاستقبال ويستعيد تلقائيًا عبر مغادرة القناة الصوتية وإعادة الانضمام إليها بعد حالات فشل متكررة خلال نافذة زمنية قصيرة.
- إذا أظهرت سجلات الاستقبال بشكل متكرر `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`، فقد يكون هذا هو خلل الاستقبال في `@discordjs/voice` لدى المصدر العلوي والمتتبع في [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419).

### الرسائل الصوتية

تعرض الرسائل الصوتية في Discord معاينة موجية وتتطلب صوت OGG/Opus. ينشئ OpenClaw الموجة تلقائيًا، لكنه يحتاج إلى `ffmpeg` و`ffprobe` على مضيف Gateway للفحص والتحويل.

- وفّر **مسار ملف محلي** (يتم رفض عناوين URL).
- احذف المحتوى النصي (يرفض Discord النص + الرسالة الصوتية في الحمولة نفسها).
- يُقبل أي تنسيق صوتي؛ ويحوّل OpenClaw إلى OGG/Opus عند الحاجة.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="تم استخدام نوايا غير مسموح بها أو أن البوت لا يرى رسائل الخادم">

    - فعّل Message Content Intent
    - فعّل Server Members Intent عندما تعتمد على حل المستخدم/العضو
    - أعد تشغيل Gateway بعد تغيير النوايا

  </Accordion>

  <Accordion title="يتم حظر رسائل الخادم بشكل غير متوقع">

    - تحقّق من `groupPolicy`
    - تحقّق من قائمة السماح الخاصة بالخادم ضمن `channels.discord.guilds`
    - إذا كانت خريطة `channels` الخاصة بالخادم موجودة، فلن يُسمح إلا بالقنوات المدرجة
    - تحقّق من سلوك `requireMention` وأنماط الإشارة

    فحوصات مفيدة:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="تم ضبط requireMention على false لكنه لا يزال محظورًا">
    الأسباب الشائعة:

    - `groupPolicy="allowlist"` من دون قائمة سماح مطابقة للخادم/القناة
    - تم ضبط `requireMention` في المكان الخطأ (يجب أن يكون تحت `channels.discord.guilds` أو إدخال القناة)
    - تم حظر المرسل بواسطة قائمة السماح `users` الخاصة بالخادم/القناة

  </Accordion>

  <Accordion title="تنتهي مهلة المعالجات طويلة التشغيل أو تتكرر الردود">

    السجلات النموذجية:

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    مقبض ميزانية المستمع:

    - حساب واحد: `channels.discord.eventQueue.listenerTimeout`
    - عدة حسابات: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    مقبض مهلة تشغيل العامل:

    - حساب واحد: `channels.discord.inboundWorker.runTimeoutMs`
    - عدة حسابات: `channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
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

    استخدم `eventQueue.listenerTimeout` لإعداد المستمع البطيء و`inboundWorker.runTimeoutMs`
    فقط إذا كنت تريد صمام أمان منفصلًا لأدوار الوكيل الموضوعة في قائمة الانتظار.

  </Accordion>

  <Accordion title="عدم تطابق تدقيق الأذونات">
    تعمل فحوصات الأذونات في `channels status --probe` فقط مع معرّفات القنوات الرقمية.

    إذا كنت تستخدم مفاتيح slug، فلا يزال التطابق في وقت التشغيل قادرًا على العمل، لكن الفحص لا يمكنه التحقق الكامل من الأذونات.

  </Accordion>

  <Accordion title="مشكلات الرسائل الخاصة والاقتران">

    - تعطيل الرسائل الخاصة: `channels.discord.dm.enabled=false`
    - تعطيل سياسة الرسائل الخاصة: `channels.discord.dmPolicy="disabled"` (قديمًا: `channels.discord.dm.policy`)
    - انتظار الموافقة على الاقتران في وضع `pairing`

  </Accordion>

  <Accordion title="حلقات بوت إلى بوت">
    افتراضيًا، يتم تجاهل الرسائل التي يؤلفها بوت.

    إذا قمت بضبط `channels.discord.allowBots=true`، فاستخدم قواعد صارمة للإشارات وقوائم السماح لتجنب سلوك الحلقات.
    ويفضَّل استخدام `channels.discord.allowBots="mentions"` لقبول رسائل البوت التي تشير إلى البوت فقط.

  </Accordion>

  <Accordion title="انقطاع STT الصوتي مع DecryptionFailed(...)">

    - حافظ على تحديث OpenClaw (`openclaw update`) حتى يكون منطق استرداد استقبال صوت Discord موجودًا
    - أكّد أن `channels.discord.voice.daveEncryption=true` (افتراضي)
    - ابدأ من `channels.discord.voice.decryptionFailureTolerance=24` (الافتراضي في المصدر العلوي) واضبطه فقط عند الحاجة
    - راقب السجلات بحثًا عن:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - إذا استمرت حالات الفشل بعد إعادة الانضمام التلقائية، فاجمع السجلات وقارنها مع [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419)

  </Accordion>
</AccordionGroup>

## مرجع الإعدادات

المرجع الأساسي: [مرجع الإعدادات - Discord](/ar/gateway/config-channels#discord).

<Accordion title="حقول Discord عالية الأهمية">

- البدء/المصادقة: `enabled`, `token`, `accounts.*`, `allowBots`
- السياسة: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- الأمر: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- قائمة انتظار الأحداث: `eventQueue.listenerTimeout` (ميزانية المستمع)، `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- العامل الوارد: `inboundWorker.runTimeoutMs`
- الرد/السجل: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- التسليم: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- البث: `streaming` (اسم مستعار قديم: `streamMode`)، `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- الوسائط/إعادة المحاولة: `mediaMaxMb` (يقيّد عمليات الرفع الصادرة إلى Discord، الافتراضي `100MB`)، `retry`
- الإجراءات: `actions.*`
- الحالة: `activity`, `status`, `activityType`, `activityUrl`
- واجهة المستخدم: `ui.components.accentColor`
- الميزات: `threadBindings`, المستوى الأعلى `bindings[]` (`type: "acp"`)، `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## السلامة والعمليات

- تعامل مع رموز البوت المميزة كأسرار (ويُفضَّل `DISCORD_BOT_TOKEN` في البيئات الخاضعة للإشراف).
- امنح أذونات Discord بأقل قدر من الامتيازات.
- إذا كانت حالة/نشر الأوامر قديمة، فأعد تشغيل Gateway وتحقق مرة أخرى باستخدام `openclaw channels status --probe`.

## ذو صلة

<CardGroup cols={2}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    إقران مستخدم Discord مع Gateway.
  </Card>
  <Card title="المجموعات" icon="users" href="/ar/channels/groups">
    سلوك الدردشة الجماعية وقائمة السماح.
  </Card>
  <Card title="توجيه القنوات" icon="route" href="/ar/channels/channel-routing">
    توجيه الرسائل الواردة إلى الوكلاء.
  </Card>
  <Card title="الأمان" icon="shield" href="/ar/gateway/security">
    نموذج التهديد والتقوية.
  </Card>
  <Card title="التوجيه متعدد الوكلاء" icon="sitemap" href="/ar/concepts/multi-agent">
    ربط الخوادم والقنوات بالوكلاء.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي.
  </Card>
</CardGroup>

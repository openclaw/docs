---
read_when:
    - العمل على ميزات قناة Discord
summary: حالة دعم روبوت Discord وإمكاناته وتكوينه
title: Discord
x-i18n:
    generated_at: "2026-05-07T01:50:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0422fe8a25a7c40d49c4a8c6ec5683c729c09b79d5d03daefc0fcf032f6d75c2
    source_path: channels/discord.md
    workflow: 16
---

جاهز للرسائل المباشرة وقنوات الخوادم عبر Gateway الرسمي الخاص بـ Discord.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/ar/channels/pairing">
    تكون رسائل Discord المباشرة في وضع الاقتران افتراضياً.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وفهرس الأوامر.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات متعددة القنوات وتدفق الإصلاح.
  </Card>
</CardGroup>

## الإعداد السريع

ستحتاج إلى إنشاء تطبيق جديد مع بوت، وإضافة البوت إلى خادمك، ثم إقرانه بـ OpenClaw. نوصي بإضافة البوت إلى خادمك الخاص. إذا لم يكن لديك خادم بعد، [أنشئ واحداً أولاً](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (اختر **Create My Own > For me and my friends**).

<Steps>
  <Step title="Create a Discord application and bot">
    انتقل إلى [بوابة مطوري Discord](https://discord.com/developers/applications) وانقر على **New Application**. سمّه شيئاً مثل "OpenClaw".

    انقر على **Bot** في الشريط الجانبي. اضبط **Username** على الاسم الذي تطلقه على وكيل OpenClaw الخاص بك.

  </Step>

  <Step title="Enable privileged intents">
    بينما لا تزال في صفحة **Bot**، مرر إلى أسفل حتى **Privileged Gateway Intents** وفعّل:

    - **Message Content Intent** (مطلوب)
    - **Server Members Intent** (موصى به؛ مطلوب لقوائم السماح بالأدوار ومطابقة الاسم مع المعرّف)
    - **Presence Intent** (اختياري؛ مطلوب فقط لتحديثات الحضور)

  </Step>

  <Step title="Copy your bot token">
    مرر مجدداً إلى أعلى صفحة **Bot** وانقر على **Reset Token**.

    <Note>
    رغم الاسم، فهذا ينشئ أول رمز لك — لا يتم "إعادة تعيين" أي شيء.
    </Note>

    انسخ الرمز واحفظه في مكان ما. هذا هو **Bot Token** وستحتاج إليه بعد قليل.

  </Step>

  <Step title="Generate an invite URL and add the bot to your server">
    انقر على **OAuth2** في الشريط الجانبي. ستنشئ عنوان URL للدعوة بالصلاحيات الصحيحة لإضافة البوت إلى خادمك.

    مرر إلى أسفل حتى **OAuth2 URL Generator** وفعّل:

    - `bot`
    - `applications.commands`

    سيظهر قسم **Bot Permissions** أدناه. فعّل على الأقل:

    **General Permissions**
      - عرض القنوات
    **Text Permissions**
      - إرسال الرسائل
      - قراءة سجل الرسائل
      - تضمين الروابط
      - إرفاق الملفات
      - إضافة التفاعلات (اختياري)

    هذه هي المجموعة الأساسية لقنوات النص العادية. إذا كنت تخطط للنشر في سلاسل Discord، بما في ذلك مسارات عمل قنوات المنتدى أو الوسائط التي تنشئ سلسلة أو تتابعها، ففعّل أيضاً **Send Messages in Threads**.
    انسخ عنوان URL المُنشأ في الأسفل، والصقه في متصفحك، وحدد خادمك، وانقر على **Continue** للاتصال. يجب أن ترى الآن البوت في خادم Discord.

  </Step>

  <Step title="Enable Developer Mode and collect your IDs">
    بالعودة إلى تطبيق Discord، تحتاج إلى تفعيل وضع المطور حتى تتمكن من نسخ المعرّفات الداخلية.

    1. انقر على **User Settings** (أيقونة الترس بجانب صورتك الرمزية) → **Advanced** → فعّل **Developer Mode**
    2. انقر بزر الماوس الأيمن على **أيقونة الخادم** في الشريط الجانبي → **Copy Server ID**
    3. انقر بزر الماوس الأيمن على **صورتك الرمزية** → **Copy User ID**

    احفظ **Server ID** و**User ID** بجانب Bot Token — سترسل الثلاثة كلها إلى OpenClaw في الخطوة التالية.

  </Step>

  <Step title="Allow DMs from server members">
    لكي يعمل الاقتران، يحتاج Discord إلى السماح للبوت بإرسال رسالة مباشرة إليك. انقر بزر الماوس الأيمن على **أيقونة الخادم** → **Privacy Settings** → فعّل **Direct Messages**.

    يتيح هذا لأعضاء الخادم (بما في ذلك البوتات) إرسال رسائل مباشرة إليك. أبقِ هذا مفعلاً إذا كنت تريد استخدام رسائل Discord المباشرة مع OpenClaw. إذا كنت تخطط لاستخدام قنوات الخادم فقط، يمكنك تعطيل الرسائل المباشرة بعد الاقتران.

  </Step>

  <Step title="Set your bot token securely (do not send it in chat)">
    رمز بوت Discord الخاص بك سرّي (مثل كلمة المرور). اضبطه على الجهاز الذي يشغل OpenClaw قبل مراسلة وكيلك.

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
    بالنسبة لتثبيتات الخدمة المُدارة، شغّل `openclaw gateway install` من shell يوجد فيه `DISCORD_BOT_TOKEN`، أو خزّن المتغير في `~/.openclaw/.env`، حتى تتمكن الخدمة من حل SecretRef الخاص بالبيئة بعد إعادة التشغيل.
    إذا كان مضيفك محظوراً أو محدود المعدل بسبب بحث Discord عن تطبيق بدء التشغيل، فاضبط معرّف تطبيق/عميل Discord من بوابة المطورين حتى يتمكن بدء التشغيل من تجاوز استدعاء REST هذا. استخدم `channels.discord.applicationId` للحساب الافتراضي، أو `channels.discord.accounts.<accountId>.applicationId` عند تشغيل عدة بوتات Discord.

  </Step>

  <Step title="Configure OpenClaw and pair">

    <Tabs>
      <Tab title="Ask your agent">
        تحدّث مع وكيل OpenClaw الخاص بك على أي قناة موجودة (مثل Telegram) وأخبره. إذا كان Discord هو قناتك الأولى، فاستخدم تبويب CLI / config بدلاً من ذلك.

        > "لقد ضبطت رمز بوت Discord الخاص بي في الإعدادات بالفعل. يرجى إكمال إعداد Discord باستخدام User ID `<user_id>` وServer ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        إذا كنت تفضل الإعداد المستند إلى الملفات، فاضبط:

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

        رجوع البيئة للحساب الافتراضي:

```bash
DISCORD_BOT_TOKEN=...
```

        للإعداد المُبرمج أو البعيد، اكتب كتلة JSON5 نفسها باستخدام `openclaw config patch --file ./discord.patch.json5 --dry-run` ثم أعد التشغيل دون `--dry-run`. قيم `token` النصية الصريحة مدعومة. كما أن قيم SecretRef مدعومة أيضاً لـ `channels.discord.token` عبر موفري env/file/exec. راجع [إدارة الأسرار](/ar/gateway/secrets).

        بالنسبة لعدة بوتات Discord، احتفظ برمز كل بوت ومعرّف تطبيقه ضمن حسابه. يرث الحساب `channels.discord.applicationId` من المستوى الأعلى، لذلك لا تضبطه هناك إلا عندما يجب أن تستخدم كل الحسابات معرّف التطبيق نفسه.

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

  <Step title="Approve first DM pairing">
    انتظر حتى يعمل Gateway، ثم أرسل رسالة مباشرة إلى البوت في Discord. سيرد برمز اقتران.

    <Tabs>
      <Tab title="Ask your agent">
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

    يجب أن تتمكن الآن من الدردشة مع وكيلك في Discord عبر رسالة مباشرة.

  </Step>
</Steps>

<Note>
حل الرموز واعٍ بالحسابات. تفوز قيم رمز الإعداد على رجوع البيئة. لا يُستخدم `DISCORD_BOT_TOKEN` إلا للحساب الافتراضي.
إذا كان حسابان مفعّلان في Discord يحلان إلى رمز البوت نفسه، يبدأ OpenClaw مراقب Gateway واحداً فقط لذلك الرمز. يفوز الرمز المستند إلى الإعدادات على رجوع البيئة الافتراضي؛ وإلا يفوز أول حساب مفعّل ويُبلّغ عن الحساب المكرر على أنه معطّل.
بالنسبة إلى الاستدعاءات الصادرة المتقدمة (أداة الرسائل/إجراءات القناة)، يُستخدم `token` صريح لكل استدعاء لذلك الاستدعاء. ينطبق هذا على إجراءات الإرسال والقراءة/الفحص (مثل read/search/fetch/thread/pins/permissions). لا تزال إعدادات سياسة الحساب/إعادة المحاولة تأتي من الحساب المحدد في لقطة وقت التشغيل النشطة.
</Note>

## موصى به: إعداد مساحة عمل للخادم

بعد أن تعمل الرسائل المباشرة، يمكنك إعداد خادم Discord الخاص بك كمساحة عمل كاملة حيث تحصل كل قناة على جلسة وكيل خاصة بها وسياقها الخاص. يوصى بهذا للخوادم الخاصة التي تضمك أنت والبوت فقط.

<Steps>
  <Step title="Add your server to the guild allowlist">
    يتيح هذا لوكيلك الرد في أي قناة على خادمك، وليس في الرسائل المباشرة فقط.

    <Tabs>
      <Tab title="Ask your agent">
        > "أضف Server ID الخاص بـ Discord `<server_id>` إلى قائمة السماح للخوادم"
      </Tab>
      <Tab title="Config">

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

  <Step title="Allow responses without @mention">
    افتراضياً، لا يرد وكيلك في قنوات الخادم إلا عند ذكره بـ @. بالنسبة لخادم خاص، سترغب غالباً في أن يرد على كل رسالة.

    في قنوات الخادم، تبقى الردود النهائية العادية للمساعد خاصة افتراضياً. يجب إرسال مخرجات Discord المرئية صراحة باستخدام أداة `message`، حتى يتمكن الوكيل من المراقبة افتراضياً والنشر فقط عندما يقرر أن رد القناة مفيد.

    هذا يعني أن النموذج المحدد يجب أن يستدعي الأدوات بشكل موثوق. إذا أظهر Discord حالة الكتابة وأظهرت السجلات استخدام الرموز لكن لم تُنشر أي رسالة، فتحقق من سجل الجلسة بحثاً عن نص المساعد مع `didSendViaMessagingTool: false`. يعني ذلك أن النموذج أنتج إجابة نهائية خاصة بدلاً من استدعاء `message(action=send)`. انتقل إلى نموذج أقوى في استدعاء الأدوات، أو استخدم الإعداد أدناه لاستعادة الردود النهائية التلقائية القديمة.

    <Tabs>
      <Tab title="Ask your agent">
        > "اسمح لوكيلي بالرد على هذا الخادم دون الحاجة إلى ذكره بـ @"
      </Tab>
      <Tab title="Config">
        اضبط `requireMention: false` في إعداد الخادم لديك:

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

        لاستعادة الردود النهائية التلقائية القديمة لغرف المجموعات/القنوات، اضبط `messages.groupChat.visibleReplies: "automatic"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="Plan for memory in guild channels">
    افتراضياً، لا تُحمّل الذاكرة طويلة الأمد (MEMORY.md) إلا في جلسات الرسائل المباشرة. لا تُحمّل قنوات الخادم MEMORY.md تلقائياً.

    <Tabs>
      <Tab title="Ask your agent">
        > "عندما أطرح أسئلة في قنوات Discord، استخدم memory_search أو memory_get إذا كنت تحتاج إلى سياق طويل الأمد من MEMORY.md."
      </Tab>
      <Tab title="Manual">
        إذا كنت تحتاج إلى سياق مشترك في كل قناة، فضع التعليمات الثابتة في `AGENTS.md` أو `USER.md` (يتم حقنها في كل جلسة). احتفظ بالملاحظات طويلة الأمد في `MEMORY.md` وادخل إليها عند الطلب باستخدام أدوات الذاكرة.
      </Tab>
    </Tabs>

  </Step>
</Steps>

أنشئ الآن بعض القنوات على خادم Discord الخاص بك وابدأ الدردشة. يمكن لوكيلك رؤية اسم القناة، وتحصل كل قناة على جلستها المعزولة الخاصة — لذا يمكنك إعداد `#coding` أو `#home` أو `#research` أو أي شيء يناسب سير عملك.

## نموذج وقت التشغيل

- Gateway يملك اتصال Discord.
- توجيه الردود حتمي: ردود Discord الواردة تعود إلى Discord.
- تُضاف بيانات تعريف الخادم/القناة في Discord إلى موجه النموذج كسياق غير موثوق،
  وليس كبادئة رد مرئية للمستخدم. إذا نسخ نموذج هذا الغلاف
  في الرد، يزيل OpenClaw بيانات التعريف المنسوخة من الردود الصادرة ومن
  سياق إعادة التشغيل المستقبلي.
- افتراضيًا (`session.dmScope=main`)، تشارك المحادثات المباشرة جلسة الوكيل الرئيسية (`agent:main:main`).
- قنوات الخوادم مفاتيح جلسات معزولة (`agent:<agentId>:discord:channel:<channelId>`).
- يتم تجاهل الرسائل المباشرة الجماعية افتراضيًا (`channels.discord.dm.groupEnabled=false`).
- تعمل أوامر الشرطة المائلة الأصلية في جلسات أوامر معزولة (`agent:<agentId>:discord:slash:<userId>`)، مع استمرار حمل `CommandTargetSessionKey` إلى جلسة المحادثة الموجهة.
- يستخدم تسليم إعلانات cron/heartbeat النصية فقط إلى Discord إجابة
  المساعد النهائية المرئية مرة واحدة. تبقى حمولات الوسائط والمكونات المنظمة
  متعددة الرسائل عندما يصدر الوكيل عدة حمولات قابلة للتسليم.

## قنوات المنتدى

لا تقبل قنوات المنتدى والوسائط في Discord إلا منشورات السلاسل. يدعم OpenClaw طريقتين لإنشائها:

- أرسل رسالة إلى أصل المنتدى (`channel:<forumId>`) لإنشاء سلسلة تلقائيًا. يستخدم عنوان السلسلة أول سطر غير فارغ من رسالتك.
- استخدم `openclaw message thread create` لإنشاء سلسلة مباشرة. لا تمرر `--message-id` لقنوات المنتدى.

مثال: الإرسال إلى أصل المنتدى لإنشاء سلسلة

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

مثال: إنشاء سلسلة منتدى صراحةً

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

لا تقبل أصول المنتديات مكونات Discord. إذا كنت تحتاج إلى مكونات، فأرسل إلى السلسلة نفسها (`channel:<threadId>`).

## المكونات التفاعلية

يدعم OpenClaw حاويات مكونات Discord v2 لرسائل الوكيل. استخدم أداة الرسائل مع حمولة `components`. تُوجَّه نتائج التفاعل إلى الوكيل كرسائل واردة عادية وتتبع إعدادات `replyToMode` الحالية في Discord.

الكتل المدعومة:

- `text`، `section`، `separator`، `actions`، `media-gallery`، `file`
- تسمح صفوف الإجراءات بما يصل إلى 5 أزرار أو قائمة تحديد واحدة
- أنواع التحديد: `string`، `user`، `role`، `mentionable`، `channel`

تكون المكونات، افتراضيًا، للاستخدام مرة واحدة. اضبط `components.reusable=true` للسماح باستخدام الأزرار والتحديدات والنماذج عدة مرات حتى تنتهي صلاحيتها.

لتقييد من يمكنه النقر على زر، اضبط `allowedUsers` على ذلك الزر (معرّفات مستخدمي Discord أو الوسوم أو `*`). عند تكوين ذلك، يتلقى المستخدمون غير المطابقين رفضًا مؤقتًا.

تفتح أوامر الشرطة المائلة `/model` و`/models` منتقي نماذج تفاعليًا يتضمن قوائم منسدلة للمزود والنموذج ووقت التشغيل المتوافق، بالإضافة إلى خطوة إرسال. أصبح `/models add` مهملاً، ويعيد الآن رسالة إهمال بدلًا من تسجيل النماذج من المحادثة. رد المنتقي مؤقت ولا يمكن استخدامه إلا من المستخدم الذي استدعاه.

مرفقات الملفات:

- يجب أن تشير كتل `file` إلى مرجع مرفق (`attachment://<filename>`)
- وفّر المرفق عبر `media`/`path`/`filePath` (ملف واحد)؛ استخدم `media-gallery` لعدة ملفات
- استخدم `filename` لتجاوز اسم الرفع عندما يجب أن يطابق مرجع المرفق

النماذج المنبثقة:

- أضف `components.modal` بما يصل إلى 5 حقول
- أنواع الحقول: `text`، `checkbox`، `radio`، `select`، `role-select`، `user-select`
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
  <Tab title="DM policy">
    يتحكم `channels.discord.dmPolicy` في وصول الرسائل المباشرة. `channels.discord.allowFrom` هي قائمة السماح الأساسية للرسائل المباشرة.

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `channels.discord.allowFrom` القيمة `"*"`)
    - `disabled`

    إذا لم تكن سياسة الرسائل المباشرة مفتوحة، يتم حظر المستخدمين المجهولين (أو مطالبتهم بالإقران في وضع `pairing`).

    أسبقية الحسابات المتعددة:

    - ينطبق `channels.discord.accounts.default.allowFrom` على الحساب `default` فقط.
    - لحساب واحد، تكون أولوية `allowFrom` أعلى من `dm.allowFrom` القديمة.
    - ترث الحسابات المسماة `channels.discord.allowFrom` عندما لا تكون `allowFrom` الخاصة بها و`dm.allowFrom` القديمة معينتين.
    - لا ترث الحسابات المسماة `channels.discord.accounts.default.allowFrom`.

    لا تزال `channels.discord.dm.policy` و`channels.discord.dm.allowFrom` القديمتان تُقرآن للتوافق. يرحلهما `openclaw doctor --fix` إلى `dmPolicy` و`allowFrom` عندما يمكنه فعل ذلك دون تغيير الوصول.

    تنسيق هدف الرسائل المباشرة للتسليم:

    - `user:<id>`
    - إشارة `<@id>`

    عادةً ما تُحل المعرّفات الرقمية المجردة كمعرّفات قنوات عندما يكون افتراضي القناة نشطًا، لكن المعرّفات المدرجة في `allowFrom` الفعالة للرسائل المباشرة في الحساب تُعامل كأهداف رسائل مباشرة للمستخدمين من أجل التوافق.

  </Tab>

  <Tab title="DM access groups">
    يمكن لرسائل Discord المباشرة استخدام إدخالات `accessGroup:<name>` ديناميكية في `channels.discord.allowFrom`.

    تتم مشاركة أسماء مجموعات الوصول عبر قنوات الرسائل. استخدم `type: "message.senders"` لمجموعة ثابتة يُعبَّر عن أعضائها بصيغة `allowFrom` العادية لكل قناة، أو `type: "discord.channelAudience"` عندما يجب أن يحدد جمهور `ViewChannel` الحالي لقناة Discord العضوية ديناميكيًا. سلوك مجموعات الوصول المشتركة موثق هنا: [مجموعات الوصول](/ar/channels/access-groups).

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

    لا تحتوي قناة Discord النصية على قائمة أعضاء منفصلة. يمثّل `type: "discord.channelAudience"` العضوية على النحو التالي: مرسل الرسالة المباشرة عضو في الخادم المكوّن ولديه حاليًا إذن `ViewChannel` فعّال على القناة المكوّنة بعد تطبيق أدوار القناة وتجاوزاتها.

    مثال: اسمح لأي شخص يمكنه رؤية `#maintainers` بإرسال رسالة مباشرة إلى البوت، مع إبقاء الرسائل المباشرة مغلقة أمام الجميع غيرهم.

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

    تفشل عمليات البحث بوضع الإغلاق. إذا أعاد Discord الخطأ `Missing Access`، أو فشل البحث عن العضو، أو كانت القناة تابعة لخادم مختلف، فيُعامل مرسل الرسالة المباشرة على أنه غير مخول.

    فعّل **Server Members Intent** في بوابة مطوري Discord للبوت عند استخدام مجموعات وصول جمهور القناة. لا تتضمن الرسائل المباشرة حالة عضو الخادم، لذلك يحل OpenClaw العضو عبر Discord REST وقت التفويض.

  </Tab>

  <Tab title="Guild policy">
    يتحكم `channels.discord.groupPolicy` في معالجة الخوادم:

    - `open`
    - `allowlist`
    - `disabled`

    خط الأساس الآمن عند وجود `channels.discord` هو `allowlist`.

    سلوك `allowlist`:

    - يجب أن يطابق الخادم `channels.discord.guilds` (يُفضّل `id`، ويُقبل الاسم المختصر)
    - قوائم سماح اختيارية للمرسلين: `users` (يوصى بالمعرّفات الثابتة) و`roles` (معرّفات الأدوار فقط)؛ إذا تم تكوين أي منهما، يُسمح للمرسلين عندما يطابقون `users` أو `roles`
    - تكون مطابقة الاسم/الوسم المباشرة معطلة افتراضيًا؛ فعّل `channels.discord.dangerouslyAllowNameMatching: true` فقط كوضع توافق للطوارئ
    - الأسماء/الوسوم مدعومة لـ `users`، لكن المعرّفات أكثر أمانًا؛ يحذر `openclaw security audit` عند استخدام إدخالات الاسم/الوسم
    - إذا كان الخادم لديه `channels` مكوّنة، تُرفض القنوات غير المدرجة
    - إذا لم يكن لدى الخادم كتلة `channels`، يُسمح بكل القنوات في ذلك الخادم الموجود في قائمة السماح

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

    إذا عيّنت `DISCORD_BOT_TOKEN` فقط ولم تنشئ كتلة `channels.discord`، فإن الرجوع الاحتياطي وقت التشغيل هو `groupPolicy="allowlist"` (مع تحذير في السجلات)، حتى لو كانت `channels.defaults.groupPolicy` هي `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    رسائل الخوادم مقيدة بالإشارة افتراضيًا.

    يتضمن اكتشاف الإشارة:

    - إشارة صريحة إلى البوت
    - أنماط الإشارة المكوّنة (`agents.list[].groupChat.mentionPatterns`، والاحتياطي `messages.groupChat.mentionPatterns`)
    - سلوك الرد الضمني على البوت في الحالات المدعومة

    عند كتابة رسائل Discord صادرة، استخدم صيغة الإشارة الأساسية: `<@USER_ID>` للمستخدمين، و`<#CHANNEL_ID>` للقنوات، و`<@&ROLE_ID>` للأدوار. لا تستخدم صيغة إشارة اللقب القديمة `<@!USER_ID>`.

    يتم تكوين `requireMention` لكل خادم/قناة (`channels.discord.guilds...`).
    يُسقط `ignoreOtherMentions` اختياريًا الرسائل التي تشير إلى مستخدم/دور آخر لكن لا تشير إلى البوت (باستثناء @everyone/@here).

    الرسائل المباشرة الجماعية:

    - افتراضيًا: يتم تجاهلها (`dm.groupEnabled=false`)
    - قائمة سماح اختيارية عبر `dm.groupChannels` (معرّفات القنوات أو الأسماء المختصرة)

  </Tab>
</Tabs>

### توجيه الوكلاء حسب الأدوار

استخدم `bindings[].match.roles` لتوجيه أعضاء خادم Discord إلى وكلاء مختلفين حسب معرّف الدور. لا تقبل الروابط القائمة على الأدوار إلا معرّفات الأدوار، ويتم تقييمها بعد روابط النظراء أو روابط النظراء الأصلية وقبل روابط الخادم فقط. إذا عيّن رابط أيضًا حقول مطابقة أخرى (على سبيل المثال `peer` + `guildId` + `roles`)، فيجب أن تطابق كل الحقول المكوّنة.

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

- القيمة الافتراضية لـ `commands.native` هي `"auto"`، وهي مفعّلة لـ Discord.
- تجاوز لكل قناة: `channels.discord.commands.native`.
- يؤدي `commands.native=false` إلى تخطي تسجيل أوامر Discord المائلة وتنظيفها أثناء بدء التشغيل. قد تبقى الأوامر المسجلة سابقًا مرئية في Discord إلى أن تزيلها من تطبيق Discord.
- يستخدم تفويض الأوامر الأصلية قوائم السماح/السياسات نفسها الخاصة بـ Discord مثل معالجة الرسائل العادية.
- قد تظل الأوامر مرئية في واجهة Discord للمستخدمين غير المصرح لهم؛ ويظل التنفيذ يفرض تفويض OpenClaw ويعيد "غير مصرّح".

راجع [الأوامر المائلة](/ar/tools/slash-commands) لمعرفة كتالوج الأوامر وسلوكها.

إعدادات الأوامر المائلة الافتراضية:

- `ephemeral: true`

## تفاصيل الميزة

<AccordionGroup>
  <Accordion title="وسوم الردود والردود الأصلية">
    يدعم Discord وسوم الرد في مخرجات الوكيل:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    يتم التحكم بها عبر `channels.discord.replyToMode`:

    - `off` (افتراضي)
    - `first`
    - `all`
    - `batched`

    ملاحظة: يعطّل `off` ترابط الردود الضمني. ما زال يتم احترام وسوم `[[reply_to_*]]` الصريحة.
    يرفق `first` دائمًا مرجع الرد الأصلي الضمني بأول رسالة Discord صادرة للدور.
    يرفق `batched` مرجع الرد الأصلي الضمني في Discord فقط عندما يكون
    الدور الوارد دفعة مؤجلة من عدة رسائل. هذا مفيد
    عندما تريد الردود الأصلية أساسًا للمحادثات المتدفقة الغامضة، وليس لكل
    دور برسالة واحدة.

    تُعرض معرّفات الرسائل في السياق/السجل حتى تتمكن الوكلاء من استهداف رسائل محددة.

  </Accordion>

  <Accordion title="معاينة البث المباشر">
    يستطيع OpenClaw بث مسودات الردود بإرسال رسالة مؤقتة وتعديلها عند وصول النص. يأخذ `channels.discord.streaming` القيم `off` | `partial` | `block` | `progress` (افتراضي). يحتفظ `progress` بمسودة حالة واحدة قابلة للتعديل ويحدّثها بتقدم الأداة حتى التسليم النهائي؛ ويُعد `streamMode` اسمًا بديلًا قديمًا لوقت التشغيل. شغّل `openclaw doctor --fix` لإعادة كتابة الإعدادات المستمرة إلى المفتاح القياسي.

    اضبط `channels.discord.streaming.mode` على `off` لتعطيل تعديلات معاينة Discord. إذا تم تمكين بث كتل Discord صراحةً، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          toolProgress: true,
        },
      },
    },
  },
}
```

    - يحرر `partial` رسالة معاينة واحدة عند وصول الرموز.
    - يصدر `block` أجزاء بحجم المسودة (استخدم `draftChunk` لضبط الحجم ونقاط الفصل، مع تقييده بـ `textChunkLimit`).
    - تلغي النهايات الخاصة بالوسائط والأخطاء والردود الصريحة تعديلات المعاينة المعلقة.
    - يتحكم `streaming.preview.toolProgress` (افتراضيًا `true`) في ما إذا كانت تحديثات الأداة/التقدم تعيد استخدام رسالة المعاينة.
    - يتحكم `streaming.preview.commandText` / `streaming.progress.commandText` في تفاصيل الأمر/التنفيذ ضمن أسطر التقدم المدمجة: `raw` (افتراضي) أو `status` (تسمية الأداة فقط).

    إخفاء نص الأمر/التنفيذ الخام مع الإبقاء على أسطر التقدم المدمجة:

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

    بث المعاينة نصي فقط؛ وتعود ردود الوسائط إلى التسليم العادي. عند تمكين بث `block` صراحةً، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

  </Accordion>

  <Accordion title="السجل والسياق وسلوك الخيوط">
    سياق سجل الخادم:

    - القيمة الافتراضية لـ `channels.discord.historyLimit` هي `20`
    - الاحتياطي: `messages.groupChat.historyLimit`
    - يعطّل `0`

    عناصر التحكم في سجل الرسائل المباشرة:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    سلوك الخيوط:

    - تُوجّه خيوط Discord كجلسات قناة وترث إعدادات القناة الأصلية ما لم يتم تجاوزها.
    - ترث جلسات الخيط اختيار `/model` على مستوى جلسة القناة الأصلية كخيار احتياطي للنموذج فقط؛ ما تزال اختيارات `/model` المحلية للخيط لها الأولوية ولا يتم نسخ سجل النص الأصلي إلا إذا تم تمكين وراثة النص.
    - يختار `channels.discord.thread.inheritParent` (افتراضيًا `false`) الخيوط التلقائية الجديدة للبذر من النص الأصلي. توجد التجاوزات لكل حساب ضمن `channels.discord.accounts.<id>.thread.inheritParent`.
    - يمكن لتفاعلات أداة الرسائل حل أهداف الرسائل المباشرة `user:<id>`.
    - يتم الحفاظ على `guilds.<guild>.channels.<channel>.requireMention: false` أثناء الرجوع الاحتياطي لتفعيل مرحلة الرد.

    تُحقن موضوعات القناة كسياق **غير موثوق**. تتحكم قوائم السماح في من يمكنه تشغيل الوكيل، وليست حدًا كاملًا لتنقيح السياق التكميلي.

  </Accordion>

  <Accordion title="جلسات مرتبطة بالخيوط للوكلاء الفرعيين">
    يمكن لـ Discord ربط خيط بهدف جلسة بحيث تستمر رسائل المتابعة في ذلك الخيط بالتوجيه إلى الجلسة نفسها (بما في ذلك جلسات الوكلاء الفرعيين).

    الأوامر:

    - `/focus <target>` ربط الخيط الحالي/الجديد بهدف وكيل فرعي/جلسة
    - `/unfocus` إزالة ربط الخيط الحالي
    - `/agents` عرض التشغيلات النشطة وحالة الربط
    - `/session idle <duration|off>` فحص/تحديث إلغاء التركيز التلقائي عند عدم النشاط للروابط المركزة
    - `/session max-age <duration|off>` فحص/تحديث الحد الأقصى الصارم للعمر للروابط المركزة

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
        spawnSessions: true,
        defaultSpawnContext: "fork",
      },
    },
  },
}
```

    ملاحظات:

    - يعيّن `session.threadBindings.*` الإعدادات الافتراضية العامة.
    - يتجاوز `channels.discord.threadBindings.*` سلوك Discord.
    - يتحكم `spawnSessions` في إنشاء/ربط الخيوط تلقائيًا لـ `sessions_spawn({ thread: true })` وعمليات إنشاء خيوط ACP. الافتراضي: `true`.
    - يتحكم `defaultSpawnContext` في سياق الوكيل الفرعي الأصلي لعمليات الإنشاء المرتبطة بالخيوط. الافتراضي: `"fork"`.
    - تُرحّل مفاتيح `spawnSubagentSessions`/`spawnAcpSessions` المهملة بواسطة `openclaw doctor --fix`.
    - إذا كانت روابط الخيوط معطّلة لحساب، فلن تكون `/focus` وعمليات ربط الخيوط ذات الصلة متاحة.

    راجع [الوكلاء الفرعيين](/ar/tools/subagents)، و[وكلاء ACP](/ar/tools/acp-agents)، و[مرجع الإعدادات](/ar/gateway/configuration-reference).

  </Accordion>

  <Accordion title="روابط قنوات ACP المستمرة">
    لمساحات عمل ACP المستقرة "دائمة التشغيل"، اضبط روابط ACP المكتوبة ذات المستوى الأعلى التي تستهدف محادثات Discord.

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

    - يربط `/acp spawn codex --bind here` القناة الحالية أو الخيط الحالي في مكانه ويبقي الرسائل المستقبلية على جلسة ACP نفسها. ترث رسائل الخيط ربط القناة الأصلية.
    - في قناة أو خيط مربوط، يعيد `/new` و`/reset` تعيين جلسة ACP نفسها في مكانها. يمكن لروابط الخيوط المؤقتة تجاوز حل الهدف أثناء نشاطها.
    - يتحكم `spawnSessions` في إنشاء/ربط الخيوط الفرعية عبر `--thread auto|here`.

    راجع [وكلاء ACP](/ar/tools/acp-agents) لتفاصيل سلوك الربط.

  </Accordion>

  <Accordion title="إشعارات التفاعل">
    وضع إشعارات التفاعل لكل خادم:

    - `off`
    - `own` (افتراضي)
    - `all`
    - `allowlist` (يستخدم `guilds.<id>.users`)

    تُحوّل أحداث التفاعل إلى أحداث نظام وتُرفق بجلسة Discord الموجّهة.

  </Accordion>

  <Accordion title="تفاعلات الإقرار">
    يرسل `ackReaction` رمزًا تعبيريًا للإقرار أثناء معالجة OpenClaw لرسالة واردة.

    ترتيب الحل:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - الرجوع الاحتياطي إلى رمز تعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يقبل Discord الرموز التعبيرية الموحدة أو أسماء الرموز التعبيرية المخصصة.
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="كتابات الإعدادات">
    تكون كتابات الإعدادات التي تبدأها القناة مفعّلة افتراضيًا.

    يؤثر هذا في تدفقات `/config set|unset` (عند تمكين ميزات الأوامر).

    التعطيل:

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
    وجّه حركة مرور Discord gateway WebSocket وعمليات بحث REST عند بدء التشغيل (معرّف التطبيق + حل قائمة السماح) عبر وكيل HTTP(S) باستخدام `channels.discord.proxy`.

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
    فعّل حل PluralKit لربط الرسائل الموكّلة بهوية عضو النظام:

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

    - يمكن لقوائم السماح استخدام `pk:<memberId>`
    - تتم مطابقة أسماء عرض الأعضاء بالاسم/الاسم المختصر فقط عندما تكون `channels.discord.dangerouslyAllowNameMatching: true`
    - تستخدم عمليات البحث معرّف الرسالة الأصلي وتكون مقيدة بنافذة زمنية
    - إذا فشل البحث، تُعامل الرسائل الموكّلة كرسائل روبوت ويتم إسقاطها ما لم يكن `allowBots=true`

  </Accordion>

  <Accordion title="أسماء مستعارة للإشارات الصادرة">
    استخدم `mentionAliases` عندما تحتاج الوكلاء إلى إشارات صادرة حتمية لمستخدمي Discord المعروفين. المفاتيح هي مقابض بدون `@` البادئة؛ والقيم هي معرّفات مستخدمي Discord. تُترك المقابض غير المعروفة، و`@everyone`، و`@here`، والإشارات داخل نطاقات كود Markdown بدون تغيير.

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        Vladislava: "123456789012345678",
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

  <Accordion title="إعداد الحضور">
    تُطبّق تحديثات الحضور عند تعيين حقل حالة أو نشاط، أو عند تمكين الحضور التلقائي.

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

    خريطة نوع النشاط:

    - 0: قيد اللعب
    - 1: بث (يتطلب `activityUrl`)
    - 2: يستمع
    - 3: يشاهد
    - 4: مخصص (يستخدم نص النشاط كحالة؛ الرمز التعبيري اختياري)
    - 5: يتنافس

    مثال على الحضور التلقائي (إشارة صحة وقت التشغيل):

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

    يربط الحضور التلقائي إتاحة وقت التشغيل بحالة Discord: سليم => متصل، متدهور أو غير معروف => خامل، مستنفد أو غير متاح => عدم الإزعاج. تجاوزات النص الاختيارية:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (يدعم العنصر النائب `{reason}`)

  </Accordion>

  <Accordion title="الموافقات في Discord">
    يدعم Discord معالجة الموافقات المستندة إلى الأزرار في الرسائل المباشرة، ويمكنه اختياريًا نشر مطالبات الموافقة في القناة الأصلية.

    مسار الإعداد:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختياري؛ يعود إلى `commands.ownerAllowFrom` عند الإمكان)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
    - `agentFilter`, `sessionFilter`, `cleanupAfterResolve`

    يفعّل Discord موافقات التنفيذ الأصلية تلقائيًا عندما تكون `enabled` غير مضبوطة أو `"auto"` ويمكن حلّ موافق واحد على الأقل، إما من `execApprovals.approvers` أو من `commands.ownerAllowFrom`. لا يستنتج Discord موافقي التنفيذ من `allowFrom` الخاصة بالقناة، أو `dm.allowFrom` القديمة، أو `defaultTo` الخاصة بالرسائل المباشرة. اضبط `enabled: false` لتعطيل Discord صراحةً كعميل موافقة أصلي.

    بالنسبة إلى أوامر المجموعات الحساسة المخصصة للمالك فقط مثل `/diagnostics` و`/export-trajectory`، يرسل OpenClaw مطالبات الموافقة والنتائج النهائية بشكل خاص. يحاول استخدام رسالة Discord مباشرة أولًا عندما يكون لدى المالك المستدعي مسار مالك في Discord؛ إذا لم يكن ذلك متاحًا، يعود إلى أول مسار مالك متاح من `commands.ownerAllowFrom`، مثل Telegram.

    عندما يكون `target` هو `channel` أو `both`، تكون مطالبة الموافقة مرئية في القناة. لا يمكن استخدام الأزرار إلا من قبل الموافقين الذين تم حلّهم؛ يتلقى المستخدمون الآخرون رفضًا عابرًا. تتضمن مطالبات الموافقة نص الأمر، لذلك لا تفعّل التسليم إلى القناة إلا في القنوات الموثوقة. إذا تعذر اشتقاق معرّف القناة من مفتاح الجلسة، يعود OpenClaw إلى التسليم عبر الرسائل المباشرة.

    يعرض Discord أيضًا أزرار الموافقة المشتركة التي تستخدمها قنوات الدردشة الأخرى. يضيف محوّل Discord الأصلي أساسًا توجيه الرسائل المباشرة للموافقين والتوزيع إلى القنوات.
    عند وجود هذه الأزرار، تكون هي تجربة الموافقة الأساسية؛ ويجب على OpenClaw
    ألا يضمّن أمر `/approve` يدويًا إلا عندما تشير نتيجة الأداة إلى
    أن موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.
    إذا لم يكن وقت تشغيل الموافقة الأصلي في Discord نشطًا، يبقي OpenClaw
    مطالبة `/approve <id> <decision>` المحلية الحتمية مرئية. إذا كان
    وقت التشغيل نشطًا ولكن لا يمكن تسليم بطاقة أصلية إلى أي هدف،
    يرسل OpenClaw إشعارًا احتياطيًا في الدردشة نفسها يتضمن أمر `/approve`
    الدقيق من الموافقة المعلّقة.

    تتبع مصادقة Gateway وحل الموافقات عقد عميل Gateway المشترك (تُحل معرّفات `plugin:` عبر `plugin.approval.resolve`؛ وتُحل المعرّفات الأخرى عبر `exec.approval.resolve`). تنتهي صلاحية الموافقات بعد 30 دقيقة افتراضيًا.

    راجع [موافقات التنفيذ](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## الأدوات وبوابات الإجراء

تشمل إجراءات رسائل Discord المراسلة، وإدارة القنوات، والإشراف، والحضور، وإجراءات البيانات الوصفية.

أمثلة أساسية:

- المراسلة: `sendMessage`, `readMessages`, `editMessage`, `deleteMessage`, `threadReply`
- التفاعلات: `react`, `reactions`, `emojiList`
- الإشراف: `timeout`, `kick`, `ban`
- الحضور: `setPresence`

يقبل إجراء `event-create` معامل `image` اختياريًا (عنوان URL أو مسار ملف محلي) لتعيين صورة غلاف الحدث المجدول.

توجد بوابات الإجراءات ضمن `channels.discord.actions.*`.

سلوك البوابة الافتراضي:

| مجموعة الإجراء                                                                                                                                                           | الافتراضي |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | مفعّل    |
| roles                                                                                                                                                                    | معطّل    |
| moderation                                                                                                                                                               | معطّل    |
| presence                                                                                                                                                                 | معطّل    |

## واجهة مكونات الإصدار 2

يستخدم OpenClaw مكونات Discord الإصدار 2 لموافقات التنفيذ وعلامات السياقات المتقاطعة. يمكن لإجراءات رسائل Discord أيضًا قبول `components` لواجهة مخصصة (متقدم؛ يتطلب إنشاء حمولة مكوّن عبر أداة discord)، بينما تبقى `embeds` القديمة متاحة لكنها غير موصى بها.

- يضبط `channels.discord.ui.components.accentColor` لون التمييز الذي تستخدمه حاويات مكونات Discord (hex).
- اضبطه لكل حساب باستخدام `channels.discord.accounts.<id>.ui.components.accentColor`.
- يتم تجاهل `embeds` عند وجود مكونات الإصدار 2.

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

لدى Discord سطحان صوتيان متميزان: **القنوات الصوتية** في الوقت الفعلي (محادثات مستمرة) و**مرفقات الرسائل الصوتية** (تنسيق معاينة الموجة). يدعم Gateway كليهما.

### القنوات الصوتية

قائمة التحقق للإعداد:

1. فعّل Message Content Intent في Discord Developer Portal.
2. فعّل Server Members Intent عند استخدام قوائم سماح الأدوار/المستخدمين.
3. ادعُ الروبوت بنطاقي `bot` و`applications.commands`.
4. امنح أذونات Connect وSpeak وSend Messages وRead Message History في القناة الصوتية المستهدفة.
5. فعّل الأوامر الأصلية (`commands.native` أو `channels.discord.commands.native`).
6. اضبط `channels.discord.voice`.

استخدم `/vc join|leave|status` للتحكم في الجلسات. يستخدم الأمر الوكيل الافتراضي للحساب ويتبع قواعد قائمة السماح وسياسة المجموعة نفسها مثل أوامر Discord الأخرى.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

مثال الانضمام التلقائي:

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
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
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

- يتجاوز `voice.tts` قيمة `messages.tts` لتشغيل الصوت فقط.
- يتجاوز `voice.model` نموذج LLM المستخدم لاستجابات قنوات Discord الصوتية فقط. اتركه غير مضبوط ليرث نموذج الوكيل الموجّه.
- يستخدم STT `tools.media.audio`؛ لا يؤثر `voice.model` في النسخ.
- تنطبق تجاوزات `systemPrompt` الخاصة بكل قناة في Discord على دورات نصوص الصوت لتلك القناة الصوتية.
- تستمد دورات نصوص الصوت حالة المالك من `allowFrom` في Discord (أو `dm.allowFrom`)؛ لا يمكن للمتحدثين غير المالكين الوصول إلى الأدوات المخصصة للمالك فقط (مثل `gateway` و`cron`).
- صوت Discord اختياري لإعدادات النص فقط؛ اضبط `channels.discord.voice.enabled=true` (أو أبقِ كتلة `channels.discord.voice` موجودة) لتفعيل أوامر `/vc`، ووقت تشغيل الصوت، ونية Gateway `GuildVoiceStates`.
- يمكن لـ `channels.discord.intents.voiceStates` تجاوز الاشتراك في نية حالة الصوت صراحةً. اتركه غير مضبوط كي تتبع النية تفعيل الصوت الفعّال.
- يتم تمرير `voice.daveEncryption` و`voice.decryptionFailureTolerance` إلى خيارات الانضمام في `@discordjs/voice`.
- افتراضيات `@discordjs/voice` هي `daveEncryption=true` و`decryptionFailureTolerance=24` إذا لم تُضبط.
- يتحكم `voice.connectTimeoutMs` في انتظار Ready الأولي لـ `@discordjs/voice` لمحاولات `/vc join` والانضمام التلقائي. الافتراضي: `30000`.
- يتحكم `voice.reconnectGraceMs` في مدة انتظار OpenClaw لجلسة صوتية منقطعة كي تبدأ إعادة الاتصال قبل إتلافها. الافتراضي: `15000`.
- يراقب OpenClaw أيضًا حالات فشل فك تشفير الاستقبال ويتعافى تلقائيًا بمغادرة القناة الصوتية وإعادة الانضمام إليها بعد حالات فشل متكررة خلال نافذة قصيرة.
- إذا أظهرت سجلات الاستقبال مرارًا `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` بعد التحديث، فاجمع تقرير تبعيات وسجلات. يتضمن سطر `@discordjs/voice` المضمّن إصلاح الحشو من المصدر الأعلى في PR #11449 لـ discord.js، والذي أغلق issue #11419 في discord.js.

مسار معالجة القناة الصوتية:

- يتم تحويل التقاط PCM من Discord إلى ملف WAV مؤقت.
- يتولى `tools.media.audio` معالجة STT، مثل `openai/gpt-4o-mini-transcribe`.
- يُرسل النص عبر دخول Discord والتوجيه بينما يعمل LLM الخاص بالاستجابة بسياسة إخراج صوتي تخفي أداة `tts` الخاصة بالوكيل وتطلب نصًا مرجعًا، لأن صوت Discord يملك تشغيل TTS النهائي.
- عندما يكون `voice.model` مضبوطًا، فإنه يتجاوز فقط LLM الخاص بالاستجابة لهذه الدورة في القناة الصوتية.
- يتم دمج `voice.tts` فوق `messages.tts`؛ ويُشغّل الصوت الناتج في القناة المنضم إليها.

تُحل بيانات الاعتماد لكل مكوّن: مصادقة مسار LLM لـ `voice.model`، ومصادقة STT لـ `tools.media.audio`، ومصادقة TTS لـ `messages.tts`/`voice.tts`.

### الرسائل الصوتية

تعرض رسائل Discord الصوتية معاينة موجة وتتطلب صوت OGG/Opus. ينشئ OpenClaw الموجة تلقائيًا، لكنه يحتاج إلى `ffmpeg` و`ffprobe` على مضيف Gateway للفحص والتحويل.

- قدّم **مسار ملف محليًا** (تُرفض عناوين URL).
- احذف محتوى النص (يرفض Discord النص + الرسالة الصوتية في الحمولة نفسها).
- يُقبل أي تنسيق صوتي؛ يحوّله OpenClaw إلى OGG/Opus عند الحاجة.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="استُخدمت نوايا غير مسموح بها أو أن الروبوت لا يرى رسائل الخادم">

    - فعّل Message Content Intent
    - فعّل Server Members Intent عندما تعتمد على حل المستخدم/العضو
    - أعد تشغيل Gateway بعد تغيير النوايا

  </Accordion>

  <Accordion title="حُظرت رسائل الخادم بشكل غير متوقع">

    - تحقق من `groupPolicy`
    - تحقق من قائمة سماح الخادم ضمن `channels.discord.guilds`
    - إذا كانت خريطة `channels` للخادم موجودة، فلن يُسمح إلا بالقنوات المدرجة
    - تحقق من سلوك `requireMention` وأنماط الإشارة

    فحوصات مفيدة:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="الإشارة المطلوبة false لكنها لا تزال محظورة">
    الأسباب الشائعة:

    - `groupPolicy="allowlist"` بدون قائمة سماح مطابقة للخادم/القناة
    - تم ضبط `requireMention` في المكان الخطأ (يجب أن يكون ضمن `channels.discord.guilds` أو إدخال القناة)
    - المرسل محظور بواسطة قائمة سماح `users` للخادم/القناة

  </Accordion>

  <Accordion title="دورات Discord طويلة التشغيل أو ردود مكررة">

    سجلات نموذجية:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    مقابض قائمة انتظار Gateway في Discord:

    - حساب واحد: `channels.discord.eventQueue.listenerTimeout`
    - حسابات متعددة: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - يتحكم هذا فقط في عمل مستمع Gateway في Discord، وليس عمر دورة الوكيل

    لا يطبق Discord مهلة مملوكة للقناة على دورات الوكيل الموضوعة في قائمة الانتظار. يسلّم مستمعو الرسائل العمل فورًا، وتحافظ تشغيلات Discord الموضوعة في قائمة الانتظار على الترتيب لكل جلسة حتى يكتمل أو يُلغى مسار حياة الجلسة/الأداة/وقت التشغيل.

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

  <Accordion title="تحذيرات مهلة البحث عن بيانات Gateway الوصفية">
    يجلب OpenClaw بيانات Discord `/gateway/bot` الوصفية قبل الاتصال. تعود حالات الفشل العابرة إلى عنوان URL الافتراضي لـ Gateway الخاص بـ Discord، وتكون محدودة المعدل في السجلات.

    عناصر ضبط مهلة البيانات الوصفية:

    - حساب واحد: `channels.discord.gatewayInfoTimeoutMs`
    - حسابات متعددة: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - بديل env عندما لا يكون الضبط معينا: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - الافتراضي: `30000` (30 ثانية)، الحد الأقصى: `120000`

  </Accordion>

  <Accordion title="إعادة التشغيل عند انتهاء مهلة READY في Gateway">
    ينتظر OpenClaw حدث `READY` الخاص بـ Gateway في Discord أثناء بدء التشغيل وبعد عمليات إعادة الاتصال وقت التشغيل. قد تحتاج إعدادات الحسابات المتعددة مع التدرج في بدء التشغيل إلى نافذة READY أطول لبدء التشغيل من الافتراضية.

    عناصر ضبط مهلة READY:

    - بدء التشغيل لحساب واحد: `channels.discord.gatewayReadyTimeoutMs`
    - بدء التشغيل لحسابات متعددة: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - بديل env لبدء التشغيل عندما لا يكون الضبط معينا: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - افتراضي بدء التشغيل: `15000` (15 ثانية)، الحد الأقصى: `120000`
    - وقت التشغيل لحساب واحد: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - وقت التشغيل لحسابات متعددة: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - بديل env وقت التشغيل عندما لا يكون الضبط معينا: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - افتراضي وقت التشغيل: `30000` (30 ثانية)، الحد الأقصى: `120000`

  </Accordion>

  <Accordion title="عدم تطابق تدقيق الأذونات">
    لا تعمل فحوصات أذونات `channels status --probe` إلا مع معرفات القنوات الرقمية.

    إذا كنت تستخدم مفاتيح slug، فقد تظل المطابقة وقت التشغيل تعمل، لكن probe لا يستطيع التحقق الكامل من الأذونات.

  </Accordion>

  <Accordion title="مشكلات الرسائل المباشرة والاقتران">

    - الرسائل المباشرة معطلة: `channels.discord.dm.enabled=false`
    - سياسة الرسائل المباشرة معطلة: `channels.discord.dmPolicy="disabled"` (قديم: `channels.discord.dm.policy`)
    - انتظار موافقة الاقتران في وضع `pairing`

  </Accordion>

  <Accordion title="حلقات البوت إلى البوت">
    افتراضيا، يتم تجاهل الرسائل المنشأة بواسطة البوتات.

    إذا عينت `channels.discord.allowBots=true`، فاستخدم قواعد ذكر وقائمة سماح صارمة لتجنب سلوك الحلقات.
    يفضل استخدام `channels.discord.allowBots="mentions"` لقبول رسائل البوتات التي تذكر البوت فقط.

```json5
{
  channels: {
    discord: {
      accounts: {
        mantis: {
          // يستمع Mantis إلى البوتات الأخرى فقط عندما تذكره.
          allowBots: "mentions",
        },
        molty: {
          // يستمع Molty إلى جميع رسائل Discord المنشأة بواسطة البوتات.
          allowBots: true,
          mentionAliases: {
            // يتيح لـ Molty كتابة "@Mantis" وإرسال ذكر Discord حقيقي.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="إسقاطات STT الصوتية مع DecryptionFailed(...)">

    - أبق OpenClaw محدثا (`openclaw update`) حتى يكون منطق استرداد استقبال صوت Discord موجودا
    - تأكد من `channels.discord.voice.daveEncryption=true` (افتراضي)
    - ابدأ من `channels.discord.voice.decryptionFailureTolerance=24` (افتراضي upstream) واضبطه فقط عند الحاجة
    - راقب السجلات بحثا عن:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - إذا استمرت حالات الفشل بعد إعادة الانضمام التلقائية، فاجمع السجلات وقارنها بسجل استقبال DAVE في upstream في [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) و[discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## مرجع الضبط

المرجع الأساسي: [مرجع الضبط - Discord](/ar/gateway/config-channels#discord).

<Accordion title="حقول Discord عالية الإشارة">

- بدء التشغيل/المصادقة: `enabled`, `token`, `accounts.*`, `allowBots`
- السياسة: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- الأمر: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- قائمة انتظار الأحداث: `eventQueue.listenerTimeout` (ميزانية المستمع)، `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- الرد/السجل: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- التسليم: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- البث: `streaming` (اسم مستعار قديم: `streamMode`)، `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- الوسائط/إعادة المحاولة: `mediaMaxMb` (يحد من تحميلات Discord الصادرة، الافتراضي `100MB`)، `retry`
- الإجراءات: `actions.*`
- الحضور: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- الميزات: `threadBindings`, المستوى الأعلى `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## السلامة والعمليات

- تعامل مع رموز البوتات باعتبارها أسرارا (يفضل `DISCORD_BOT_TOKEN` في البيئات الخاضعة للإشراف).
- امنح أذونات Discord وفق مبدأ أقل امتياز.
- إذا كانت حالة نشر الأوامر/الحالة قديمة، فأعد تشغيل Gateway وأعد الفحص باستخدام `openclaw channels status --probe`.

## ذات صلة

<CardGroup cols={2}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    اربط مستخدم Discord بـ Gateway.
  </Card>
  <Card title="المجموعات" icon="users" href="/ar/channels/groups">
    سلوك دردشة المجموعة وقائمة السماح.
  </Card>
  <Card title="توجيه القنوات" icon="route" href="/ar/channels/channel-routing">
    وجه الرسائل الواردة إلى الوكلاء.
  </Card>
  <Card title="الأمان" icon="shield" href="/ar/gateway/security">
    نموذج التهديد والتقوية.
  </Card>
  <Card title="توجيه الوكلاء المتعددين" icon="sitemap" href="/ar/concepts/multi-agent">
    اربط الخوادم والقنوات بالوكلاء.
  </Card>
  <Card title="أوامر Slash" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلية.
  </Card>
</CardGroup>

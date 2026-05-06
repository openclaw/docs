---
read_when:
    - العمل على ميزات قناة Discord
summary: حالة دعم بوت Discord وإمكاناته وتكوينه
title: Discord
x-i18n:
    generated_at: "2026-05-06T17:52:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 11cc911dbc569db7a31ce4a16de167bc8ea771d1dd7842cb151f666f3cb9285b
    source_path: channels/discord.md
    workflow: 16
---

جاهز للرسائل المباشرة وقنوات الخادم عبر Gateway الرسمي لـ Discord.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/ar/channels/pairing">
    تستخدم الرسائل المباشرة في Discord وضع الاقتران افتراضيًا.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وفهرس الأوامر.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عابرة للقنوات وتدفق الإصلاح.
  </Card>
</CardGroup>

## الإعداد السريع

ستحتاج إلى إنشاء تطبيق جديد مع بوت، وإضافة البوت إلى خادمك، وإقرانه مع OpenClaw. نوصي بإضافة البوت إلى خادمك الخاص. إذا لم يكن لديك واحد بعد، [أنشئ واحدًا أولًا](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (اختر **Create My Own > For me and my friends**).

<Steps>
  <Step title="Create a Discord application and bot">
    انتقل إلى [بوابة مطوري Discord](https://discord.com/developers/applications) وانقر على **New Application**. سمّه باسم مثل "OpenClaw".

    انقر على **Bot** في الشريط الجانبي. اضبط **Username** على الاسم الذي تطلقه على وكيل OpenClaw الخاص بك.

  </Step>

  <Step title="Enable privileged intents">
    بينما لا تزال في صفحة **Bot**، مرر لأسفل إلى **Privileged Gateway Intents** وفعّل:

    - **Message Content Intent** (مطلوب)
    - **Server Members Intent** (موصى به؛ مطلوب لقوائم السماح للأدوار ومطابقة الاسم بالمعرّف)
    - **Presence Intent** (اختياري؛ لا يلزم إلا لتحديثات الحضور)

  </Step>

  <Step title="Copy your bot token">
    مرر مجددًا إلى أعلى صفحة **Bot** وانقر على **Reset Token**.

    <Note>
    رغم الاسم، يؤدي هذا إلى إنشاء الرمز المميز الأول لك — لا تتم "إعادة ضبط" أي شيء.
    </Note>

    انسخ الرمز المميز واحفظه في مكان ما. هذا هو **Bot Token** الخاص بك وستحتاج إليه بعد قليل.

  </Step>

  <Step title="Generate an invite URL and add the bot to your server">
    انقر على **OAuth2** في الشريط الجانبي. ستنشئ عنوان URL للدعوة بالصلاحيات المناسبة لإضافة البوت إلى خادمك.

    مرر لأسفل إلى **OAuth2 URL Generator** وفعّل:

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

    هذه هي المجموعة الأساسية لقنوات النص العادية. إذا كنت تخطط للنشر في سلاسل Discord، بما في ذلك سير عمل قنوات المنتدى أو الوسائط التي تنشئ سلسلة أو تواصلها، ففعّل أيضًا **Send Messages in Threads**.
    انسخ عنوان URL الذي تم إنشاؤه في الأسفل، والصقه في متصفحك، وحدد خادمك، ثم انقر على **Continue** للاتصال. يجب أن ترى الآن البوت في خادم Discord.

  </Step>

  <Step title="Enable Developer Mode and collect your IDs">
    بالعودة إلى تطبيق Discord، تحتاج إلى تفعيل وضع المطوّر حتى تتمكن من نسخ المعرّفات الداخلية.

    1. انقر على **User Settings** (أيقونة الترس بجوار صورتك الرمزية) → **Advanced** → فعّل **Developer Mode**
    2. انقر بزر الماوس الأيمن على **أيقونة الخادم** في الشريط الجانبي → **Copy Server ID**
    3. انقر بزر الماوس الأيمن على **صورتك الرمزية** → **Copy User ID**

    احفظ **Server ID** و**User ID** بجانب Bot Token — سترسل الثلاثة جميعًا إلى OpenClaw في الخطوة التالية.

  </Step>

  <Step title="Allow DMs from server members">
    لكي يعمل الاقتران، يجب أن يسمح Discord للبوت بإرسال رسالة مباشرة إليك. انقر بزر الماوس الأيمن على **أيقونة الخادم** → **Privacy Settings** → فعّل **Direct Messages**.

    يتيح هذا لأعضاء الخادم (بما في ذلك البوتات) إرسال رسائل مباشرة إليك. أبقِ هذا مفعّلًا إذا كنت تريد استخدام رسائل Discord المباشرة مع OpenClaw. إذا كنت تخطط لاستخدام قنوات الخادم فقط، فيمكنك تعطيل الرسائل المباشرة بعد الاقتران.

  </Step>

  <Step title="Set your bot token securely (do not send it in chat)">
    رمز بوت Discord المميز سرّي (مثل كلمة المرور). اضبطه على الجهاز الذي يشغّل OpenClaw قبل مراسلة وكيلك.

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

    إذا كان OpenClaw يعمل بالفعل كخدمة في الخلفية، فأعد تشغيله عبر تطبيق OpenClaw على Mac أو عبر إيقاف عملية `openclaw gateway run` وإعادة تشغيلها.
    بالنسبة لتثبيتات الخدمة المُدارة، شغّل `openclaw gateway install` من صدفة يتوفر فيها `DISCORD_BOT_TOKEN`، أو خزّن المتغير في `~/.openclaw/.env`، حتى تتمكن الخدمة من حل SecretRef الخاص بالبيئة بعد إعادة التشغيل.
    إذا كان مضيفك محظورًا أو محدود المعدّل بسبب بحث Discord عن تطبيق بدء التشغيل، فاضبط معرّف تطبيق/عميل Discord من بوابة المطورين حتى يتمكن بدء التشغيل من تخطي استدعاء REST هذا. استخدم `channels.discord.applicationId` للحساب الافتراضي، أو `channels.discord.accounts.<accountId>.applicationId` عند تشغيل عدة بوتات Discord.

  </Step>

  <Step title="Configure OpenClaw and pair">

    <Tabs>
      <Tab title="Ask your agent">
        تحدّث مع وكيل OpenClaw الخاص بك على أي قناة موجودة (مثل Telegram) وأخبره بذلك. إذا كان Discord هو قناتك الأولى، فاستخدم تبويب CLI / config بدلًا من ذلك.

        > "لقد ضبطت بالفعل رمز بوت Discord المميز في الإعدادات. يرجى إكمال إعداد Discord باستخدام User ID `<user_id>` وServer ID `<server_id>`."
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

        بديل البيئة للحساب الافتراضي:

```bash
DISCORD_BOT_TOKEN=...
```

        للإعداد البرمجي أو البعيد، اكتب كتلة JSON5 نفسها باستخدام `openclaw config patch --file ./discord.patch.json5 --dry-run` ثم أعد التشغيل بدون `--dry-run`. قيم `token` النصية الصريحة مدعومة. كما أن قيم SecretRef مدعومة أيضًا لـ `channels.discord.token` عبر موفري env/file/exec. راجع [إدارة الأسرار](/ar/gateway/secrets).

        بالنسبة لعدة بوتات Discord، احتفظ برمز كل بوت ومعرّف التطبيق تحت حسابه. يتم توريث `channels.discord.applicationId` ذي المستوى الأعلى بواسطة الحسابات، لذلك لا تضبطه هناك إلا عندما يجب أن يستخدم كل حساب معرّف التطبيق نفسه.

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

    يجب أن تكون قادرًا الآن على الدردشة مع وكيلك في Discord عبر رسالة مباشرة.

  </Step>
</Steps>

<Note>
حل الرمز المميز واعٍ بالحساب. تتقدم قيم الرمز المميز في الإعدادات على بديل البيئة. يُستخدم `DISCORD_BOT_TOKEN` للحساب الافتراضي فقط.
إذا حُلّ حسابان مفعّلان في Discord إلى رمز البوت نفسه، فسيبدأ OpenClaw مراقب Gateway واحدًا فقط لذلك الرمز. يتقدم الرمز القادم من الإعدادات على بديل البيئة الافتراضي؛ وإلا يفوز أول حساب مفعّل ويتم الإبلاغ عن الحساب المكرر على أنه معطّل.
بالنسبة للاستدعاءات الصادرة المتقدمة (أداة الرسائل/إجراءات القناة)، يُستخدم `token` صريح لكل استدعاء لذلك الاستدعاء. ينطبق هذا على إجراءات الإرسال والقراءة/الفحص (مثل read/search/fetch/thread/pins/permissions). لا تزال إعدادات سياسة الحساب/إعادة المحاولة تأتي من الحساب المحدد في لقطة وقت التشغيل النشطة.
</Note>

## موصى به: إعداد مساحة عمل للخادم

بعد أن تعمل الرسائل المباشرة، يمكنك إعداد خادم Discord كمساحة عمل كاملة حيث تحصل كل قناة على جلسة وكيل خاصة بها مع سياقها الخاص. يوصى بهذا للخوادم الخاصة التي تضمك أنت والبوت فقط.

<Steps>
  <Step title="Add your server to the guild allowlist">
    يتيح هذا لوكيلك الرد في أي قناة على خادمك، وليس فقط في الرسائل المباشرة.

    <Tabs>
      <Tab title="Ask your agent">
        > "أضف Discord Server ID الخاص بي `<server_id>` إلى قائمة السماح للخوادم"
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
    افتراضيًا، لا يرد وكيلك في قنوات الخادم إلا عند ذكره باستخدام @. بالنسبة لخادم خاص، من المرجح أنك تريد أن يرد على كل رسالة.

    في قنوات الخادم، تبقى ردود المساعد النهائية العادية خاصة افتراضيًا. يجب إرسال مخرجات Discord المرئية صراحة باستخدام أداة `message`، حتى يتمكن الوكيل من المراقبة افتراضيًا والنشر فقط عندما يقرر أن الرد في القناة مفيد.

    هذا يعني أن النموذج المحدد يجب أن يستدعي الأدوات بموثوقية. إذا أظهر Discord حالة الكتابة وأظهرت السجلات استخدام الرموز المميزة لكن لم تُنشر أي رسالة، فتحقق من سجل الجلسة بحثًا عن نص المساعد مع `didSendViaMessagingTool: false`. يعني ذلك أن النموذج أنتج إجابة نهائية خاصة بدلًا من استدعاء `message(action=send)`. بدّل إلى نموذج أقوى في استدعاء الأدوات، أو استخدم الإعداد أدناه لاستعادة الردود النهائية التلقائية القديمة.

    <Tabs>
      <Tab title="Ask your agent">
        > "اسمح لوكيلي بالرد على هذا الخادم دون الحاجة إلى ذكره باستخدام @"
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
    افتراضيًا، لا تُحمّل الذاكرة طويلة الأمد (MEMORY.md) إلا في جلسات الرسائل المباشرة. لا تُحمّل قنوات الخادم MEMORY.md تلقائيًا.

    <Tabs>
      <Tab title="Ask your agent">
        > "عندما أطرح أسئلة في قنوات Discord، استخدم memory_search أو memory_get إذا احتجت إلى سياق طويل الأمد من MEMORY.md."
      </Tab>
      <Tab title="Manual">
        إذا كنت بحاجة إلى سياق مشترك في كل قناة، فضع التعليمات الثابتة في `AGENTS.md` أو `USER.md` (يتم حقنها في كل جلسة). احتفظ بالملاحظات طويلة الأمد في `MEMORY.md` وادخل إليها عند الطلب باستخدام أدوات الذاكرة.
      </Tab>
    </Tabs>

  </Step>
</Steps>

أنشئ الآن بعض القنوات على خادم Discord الخاص بك وابدأ الدردشة. يستطيع وكيلك رؤية اسم القناة، وتحصل كل قناة على جلستها المعزولة الخاصة — لذا يمكنك إعداد `#coding` أو `#home` أو `#research` أو أي شيء يناسب سير عملك.

## نموذج وقت التشغيل

- يملك Gateway اتصال Discord.
- توجيه الردود حتمي: ترد الردود الواردة من Discord إلى Discord.
- تُضاف بيانات تعريف خادم/قناة Discord إلى موجه النموذج كسياق غير موثوق
  به، وليس كبادئة رد مرئية للمستخدم. إذا نسخ نموذج ذلك الغلاف
  في الرد، يزيل OpenClaw بيانات التعريف المنسوخة من الردود الصادرة ومن
  سياق إعادة التشغيل المستقبلي.
- افتراضيًا (`session.dmScope=main`)، تشترك المحادثات المباشرة في جلسة الوكيل الرئيسية (`agent:main:main`).
- قنوات الخادم هي مفاتيح جلسات معزولة (`agent:<agentId>:discord:channel:<channelId>`).
- يتم تجاهل الرسائل المباشرة الجماعية افتراضيًا (`channels.discord.dm.groupEnabled=false`).
- تعمل أوامر الشرطة المائلة الأصلية في جلسات أوامر معزولة (`agent:<agentId>:discord:slash:<userId>`)، مع استمرار حمل `CommandTargetSessionKey` إلى جلسة المحادثة الموجّهة.
- يستخدم تسليم إعلانات cron/heartbeat النصية فقط إلى Discord الإجابة النهائية
  المرئية للمساعد مرة واحدة. تظل حمولات الوسائط والمكونات المنظمة
  متعددة الرسائل عندما يصدر الوكيل عدة حمولات قابلة للتسليم.

## قنوات المنتدى

تقبل قنوات المنتدى والوسائط في Discord منشورات السلاسل فقط. يدعم OpenClaw طريقتين لإنشائها:

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

يدعم OpenClaw حاويات مكونات Discord v2 لرسائل الوكيل. استخدم أداة الرسائل مع حمولة `components`. تُوجّه نتائج التفاعل مرة أخرى إلى الوكيل كرسائل واردة عادية وتتبع إعدادات Discord `replyToMode` الحالية.

الكتل المدعومة:

- `text`، `section`، `separator`، `actions`، `media-gallery`، `file`
- تسمح صفوف الإجراءات بما يصل إلى 5 أزرار أو قائمة تحديد واحدة
- أنواع التحديد: `string`، `user`، `role`، `mentionable`، `channel`

افتراضيًا، تُستخدم المكونات مرة واحدة. اضبط `components.reusable=true` للسماح باستخدام الأزرار والتحديدات والنماذج عدة مرات حتى تنتهي صلاحيتها.

لتقييد من يمكنه النقر على زر، اضبط `allowedUsers` على ذلك الزر (معرفات مستخدمي Discord أو الوسوم أو `*`). عند التهيئة، يتلقى المستخدمون غير المطابقين رفضًا مؤقتًا.

تفتح أوامر الشرطة المائلة `/model` و`/models` منتقي نموذج تفاعليًا مع قوائم منسدلة للمزوّد والنموذج وبيئة التشغيل المتوافقة، إضافة إلى خطوة إرسال. تم إهمال `/models add` وأصبح يعيد الآن رسالة إهمال بدلًا من تسجيل النماذج من الدردشة. يكون رد المنتقي مؤقتًا ولا يمكن استخدامه إلا من قبل المستخدم الذي استدعاه.

مرفقات الملفات:

- يجب أن تشير كتل `file` إلى مرجع مرفق (`attachment://<filename>`)
- قدّم المرفق عبر `media`/`path`/`filePath` (ملف واحد)؛ استخدم `media-gallery` لملفات متعددة
- استخدم `filename` لتجاوز اسم الرفع عندما يجب أن يطابق مرجع المرفق

نماذج النوافذ المنبثقة:

- أضف `components.modal` مع ما يصل إلى 5 حقول
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
    يتحكم `channels.discord.dmPolicy` في الوصول إلى الرسائل المباشرة. `channels.discord.allowFrom` هي قائمة السماح الأساسية للرسائل المباشرة.

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `channels.discord.allowFrom` القيمة `"*"`)
    - `disabled`

    إذا لم تكن سياسة الرسائل المباشرة مفتوحة، يتم حظر المستخدمين غير المعروفين (أو يُطلب منهم الاقتران في وضع `pairing`).

    أسبقية الحسابات المتعددة:

    - ينطبق `channels.discord.accounts.default.allowFrom` على الحساب `default` فقط.
    - لحساب واحد، تكون أسبقية `allowFrom` على `dm.allowFrom` القديم.
    - ترث الحسابات المسماة `channels.discord.allowFrom` عندما لا تكون قيمتا `allowFrom` و`dm.allowFrom` القديمتان الخاصتان بها مضبوطتين.
    - لا ترث الحسابات المسماة `channels.discord.accounts.default.allowFrom`.

    لا تزال `channels.discord.dm.policy` و`channels.discord.dm.allowFrom` القديمتان تُقرآن للتوافق. ينقلهما `openclaw doctor --fix` إلى `dmPolicy` و`allowFrom` عندما يمكنه فعل ذلك دون تغيير الوصول.

    تنسيق هدف الرسائل المباشرة للتسليم:

    - `user:<id>`
    - إشارة `<@id>`

    تُحلّ المعرفات الرقمية المجردة عادةً كمعرفات قنوات عندما يكون افتراض قناة نشطًا، لكن المعرفات المدرجة في `allowFrom` الفعالة للرسائل المباشرة للحساب تُعامل كأهداف رسائل مباشرة للمستخدمين للتوافق.

  </Tab>

  <Tab title="DM access groups">
    يمكن لرسائل Discord المباشرة استخدام إدخالات `accessGroup:<name>` الديناميكية في `channels.discord.allowFrom`.

    تتم مشاركة أسماء مجموعات الوصول عبر قنوات الرسائل. استخدم `type: "message.senders"` لمجموعة ثابتة يُعبّر عن أعضائها بصيغة `allowFrom` العادية لكل قناة، أو `type: "discord.channelAudience"` عندما يجب أن يحدد جمهور `ViewChannel` الحالي لقناة Discord العضوية ديناميكيًا. تم توثيق سلوك مجموعات الوصول المشتركة هنا: [مجموعات الوصول](/ar/channels/access-groups).

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

    لا تملك قناة Discord النصية قائمة أعضاء منفصلة. يمثّل `type: "discord.channelAudience"` العضوية على النحو التالي: مرسل الرسالة المباشرة عضو في الخادم المهيأ ولديه حاليًا إذن `ViewChannel` فعّال على القناة المهيأة بعد تطبيق أدوار القناة وعمليات تجاوزها.

    مثال: اسمح لأي شخص يمكنه رؤية `#maintainers` بإرسال رسالة مباشرة إلى الروبوت، مع إبقاء الرسائل المباشرة مغلقة أمام الجميع غيرهم.

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

    تفشل عمليات البحث بالإغلاق. إذا أعاد Discord القيمة `Missing Access`، أو فشل البحث عن العضو، أو كانت القناة تنتمي إلى خادم مختلف، يُعامل مرسل الرسالة المباشرة على أنه غير مخول.

    فعّل **Server Members Intent** في Discord Developer Portal للروبوت عند استخدام مجموعات وصول جمهور القناة. لا تتضمن الرسائل المباشرة حالة عضو الخادم، لذلك يحل OpenClaw العضو عبر Discord REST وقت التفويض.

  </Tab>

  <Tab title="Guild policy">
    يتم التحكم في التعامل مع الخوادم عبر `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    خط الأساس الآمن عند وجود `channels.discord` هو `allowlist`.

    سلوك `allowlist`:

    - يجب أن يطابق الخادم `channels.discord.guilds` (يُفضّل `id`، ويُقبل الاسم اللطيف)
    - قوائم سماح اختيارية للمرسلين: `users` (يوصى بالمعرفات الثابتة) و`roles` (معرفات الأدوار فقط)؛ إذا تم تهيئة أي منهما، يُسمح للمرسلين عندما يطابقون `users` أو `roles`
    - يتم تعطيل مطابقة الاسم/الوسم المباشرة افتراضيًا؛ فعّل `channels.discord.dangerouslyAllowNameMatching: true` فقط كوضع توافق للطوارئ
    - الأسماء/الوسوم مدعومة لـ`users`، لكن المعرفات أكثر أمانًا؛ يحذر `openclaw security audit` عند استخدام إدخالات الاسم/الوسم
    - إذا كان الخادم يحتوي على `channels` مهيأة، تُرفض القنوات غير المدرجة
    - إذا لم يكن لدى الخادم كتلة `channels`، يُسمح بجميع القنوات في ذلك الخادم المدرج في قائمة السماح

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

    إذا ضبطت `DISCORD_BOT_TOKEN` فقط ولم تنشئ كتلة `channels.discord`، يكون احتياطي وقت التشغيل هو `groupPolicy="allowlist"` (مع تحذير في السجلات)، حتى إذا كانت `channels.defaults.groupPolicy` هي `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    تخضع رسائل الخادم لبوابة الإشارة افتراضيًا.

    يتضمن اكتشاف الإشارات:

    - إشارة صريحة إلى الروبوت
    - أنماط الإشارة المهيأة (`agents.list[].groupChat.mentionPatterns`، والاحتياطي `messages.groupChat.mentionPatterns`)
    - سلوك الرد الضمني على الروبوت في الحالات المدعومة

    عند كتابة رسائل Discord الصادرة، استخدم صيغة الإشارة الأساسية: `<@USER_ID>` للمستخدمين، و`<#CHANNEL_ID>` للقنوات، و`<@&ROLE_ID>` للأدوار. لا تستخدم صيغة إشارة اللقب القديمة `<@!USER_ID>`.

    يتم تهيئة `requireMention` لكل خادم/قناة (`channels.discord.guilds...`).
    يسقط `ignoreOtherMentions` اختياريًا الرسائل التي تشير إلى مستخدم/دور آخر لكن لا تشير إلى الروبوت (باستثناء @everyone/@here).

    الرسائل المباشرة الجماعية:

    - الافتراضي: يتم تجاهلها (`dm.groupEnabled=false`)
    - قائمة سماح اختيارية عبر `dm.groupChannels` (معرفات القنوات أو الأسماء اللطيفة)

  </Tab>
</Tabs>

### توجيه الوكلاء بناءً على الدور

استخدم `bindings[].match.roles` لتوجيه أعضاء خادم Discord إلى وكلاء مختلفين حسب معرف الدور. تقبل الارتباطات القائمة على الأدوار معرفات الأدوار فقط وتُقيّم بعد ارتباطات النظير أو النظير الأب وقبل الارتباطات الخاصة بالخادم فقط. إذا ضبط ارتباط أيضًا حقول مطابقة أخرى (على سبيل المثال `peer` + `guildId` + `roles`)، يجب أن تطابق جميع الحقول المهيأة.

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

- القيمة الافتراضية لـ `commands.native` هي `"auto"` وهي مفعلة لـ Discord.
- التجاوز لكل قناة: `channels.discord.commands.native`.
- يؤدي `commands.native=false` إلى تخطي تسجيل أوامر الشرطة المائلة في Discord وتنظيفها أثناء بدء التشغيل. قد تبقى الأوامر المسجلة سابقا مرئية في Discord إلى أن تزيلها من تطبيق Discord.
- تستخدم مصادقة الأوامر الأصلية قوائم السماح/السياسات نفسها الخاصة بـ Discord مثل معالجة الرسائل العادية.
- قد تظل الأوامر مرئية في واجهة Discord للمستخدمين غير المصرح لهم؛ يظل التنفيذ يفرض مصادقة OpenClaw ويعيد "غير مصرح".

راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands) للاطلاع على كتالوج الأوامر وسلوكها.

إعدادات أوامر الشرطة المائلة الافتراضية:

- `ephemeral: true`

## تفاصيل الميزة

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    يدعم Discord وسوم الرد في مخرجات الوكيل:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    يتم التحكم به عبر `channels.discord.replyToMode`:

    - `off` (افتراضي)
    - `first`
    - `all`
    - `batched`

    ملاحظة: يعطل `off` تسلسل الردود الضمني. تظل وسوم `[[reply_to_*]]` الصريحة محترمة.
    يرفق `first` دائما مرجع الرد الأصلي الضمني بأول رسالة Discord صادرة للدور.
    لا يرفق `batched` مرجع الرد الأصلي الضمني الخاص بـ Discord إلا عندما يكون
    الدور الوارد دفعة مؤجلة من عدة رسائل. يكون هذا مفيدا
    عندما تريد الردود الأصلية أساسا للمحادثات المتدفقة الغامضة، وليس لكل
    دور من رسالة واحدة.

    تظهر معرفات الرسائل في السياق/السجل حتى تتمكن الوكلاء من استهداف رسائل محددة.

  </Accordion>

  <Accordion title="Live stream preview">
    يمكن لـ OpenClaw بث مسودات الردود بإرسال رسالة مؤقتة وتحريرها عند وصول النص. يقبل `channels.discord.streaming` القيم `off` (افتراضي) | `partial` | `block` | `progress`. يحتفظ `progress` بمسودة حالة واحدة قابلة للتحرير ويحدثها بتقدم الأدوات حتى التسليم النهائي؛ `streamMode` اسم مستعار قديم في وقت التشغيل. شغل `openclaw doctor --fix` لإعادة كتابة الإعدادات المحفوظة إلى المفتاح القياسي.

    تبقى القيمة الافتراضية `off` لأن تعديلات معاينة Discord تصل إلى حدود المعدل بسرعة عندما تشترك عدة بوتات أو Gateways في حساب واحد.

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

    - يحرر `partial` رسالة معاينة واحدة عند وصول الرموز.
    - يصدر `block` قطعا بحجم المسودة (استخدم `draftChunk` لضبط الحجم ونقاط الفصل، مع تقييدها بـ `textChunkLimit`).
    - تلغي النهايات الخاصة بالوسائط والأخطاء والردود الصريحة تعديلات المعاينة المعلقة.
    - يتحكم `streaming.preview.toolProgress` (افتراضيا `true`) فيما إذا كانت تحديثات الأدوات/التقدم تعيد استخدام رسالة المعاينة.
    - يتحكم `streaming.preview.commandText` / `streaming.progress.commandText` في تفاصيل الأمر/التنفيذ داخل أسطر التقدم المختصرة: `raw` (افتراضي) أو `status` (تسمية الأداة فقط).

    إخفاء نص الأمر/التنفيذ الخام مع إبقاء أسطر التقدم المختصرة:

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

    بث المعاينة نصي فقط؛ تعود ردود الوسائط إلى التسليم العادي. عند تفعيل بث `block` صراحة، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    سياق سجل الخادم:

    - القيمة الافتراضية لـ `channels.discord.historyLimit` هي `20`
    - الاحتياطي: `messages.groupChat.historyLimit`
    - يعطل `0` ذلك

    عناصر التحكم في سجل الرسائل المباشرة:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    سلوك السلاسل:

    - يتم توجيه سلاسل Discord كجلسات قناة وترث إعدادات القناة الأصلية ما لم يتم تجاوزها.
    - ترث جلسات السلاسل اختيار `/model` على مستوى جلسة القناة الأصلية كاحتياطي للنموذج فقط؛ تظل اختيارات `/model` المحلية للسلسلة ذات أولوية ولا يتم نسخ سجل المحادثة الأصلي إلا إذا تم تفعيل وراثة سجل المحادثة.
    - يختار `channels.discord.thread.inheritParent` (افتراضيا `false`) تهيئة السلاسل التلقائية الجديدة من سجل محادثة الأصل. توجد التجاوزات لكل حساب تحت `channels.discord.accounts.<id>.thread.inheritParent`.
    - يمكن لتفاعلات أداة الرسائل حل أهداف الرسائل المباشرة `user:<id>`.
    - يتم الحفاظ على `guilds.<guild>.channels.<channel>.requireMention: false` أثناء احتياطي تفعيل مرحلة الرد.

    يتم إدخال مواضيع القناة كسياق **غير موثوق**. تتحكم قوائم السماح في من يمكنه تشغيل الوكيل، وليست حدا كاملا لتنقيح السياق التكميلي.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    يمكن لـ Discord ربط سلسلة بهدف جلسة حتى تستمر الرسائل اللاحقة في تلك السلسلة بالتوجيه إلى الجلسة نفسها (بما في ذلك جلسات الوكلاء الفرعيين).

    الأوامر:

    - `/focus <target>` ربط السلسلة الحالية/الجديدة بهدف وكيل فرعي/جلسة
    - `/unfocus` إزالة ربط السلسلة الحالية
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

    - يضبط `session.threadBindings.*` القيم الافتراضية العامة.
    - يتجاوز `channels.discord.threadBindings.*` سلوك Discord.
    - يتحكم `spawnSessions` في إنشاء/ربط السلاسل تلقائيا لـ `sessions_spawn({ thread: true })` وعمليات إنشاء سلاسل ACP. الافتراضي: `true`.
    - يتحكم `defaultSpawnContext` في سياق الوكيل الفرعي الأصلي لعمليات الإنشاء المرتبطة بالسلاسل. الافتراضي: `"fork"`.
    - يتم ترحيل المفاتيح المهملة `spawnSubagentSessions`/`spawnAcpSessions` بواسطة `openclaw doctor --fix`.
    - إذا كانت روابط السلاسل معطلة لحساب، فلن تكون `/focus` وعمليات ربط السلاسل ذات الصلة متاحة.

    راجع [الوكلاء الفرعيون](/ar/tools/subagents)، و[وكلاء ACP](/ar/tools/acp-agents)، و[مرجع الإعدادات](/ar/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    لمساحات عمل ACP المستقرة "الدائمة التشغيل"، قم بتهيئة روابط ACP المtyped على المستوى الأعلى التي تستهدف محادثات Discord.

    مسار الإعداد:

    - `bindings[]` مع `type: "acp"` و `match.channel: "discord"`

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

    - يربط `/acp spawn codex --bind here` القناة أو السلسلة الحالية في مكانها ويبقي الرسائل المستقبلية على جلسة ACP نفسها. ترث رسائل السلسلة ربط القناة الأصلية.
    - في قناة أو سلسلة مربوطة، يعيد `/new` و `/reset` ضبط جلسة ACP نفسها في مكانها. يمكن لروابط السلاسل المؤقتة تجاوز حل الهدف أثناء نشاطها.
    - يتحكم `spawnSessions` في إنشاء/ربط السلاسل الفرعية عبر `--thread auto|here`.

    راجع [وكلاء ACP](/ar/tools/acp-agents) للاطلاع على تفاصيل سلوك الربط.

  </Accordion>

  <Accordion title="Reaction notifications">
    وضع إشعارات التفاعل لكل خادم:

    - `off`
    - `own` (افتراضي)
    - `all`
    - `allowlist` (يستخدم `guilds.<id>.users`)

    يتم تحويل أحداث التفاعل إلى أحداث نظام وإرفاقها بجلسة Discord الموجهة.

  </Accordion>

  <Accordion title="Ack reactions">
    يرسل `ackReaction` رمزا تعبيريا للإقرار أثناء معالجة OpenClaw لرسالة واردة.

    ترتيب الحل:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - احتياطي رمز تعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يقبل Discord الرموز التعبيرية Unicode أو أسماء الرموز التعبيرية المخصصة.
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="Config writes">
    عمليات كتابة الإعدادات التي تبدأها القناة مفعلة افتراضيا.

    يؤثر هذا في تدفقات `/config set|unset` (عند تفعيل ميزات الأوامر).

    تعطيل:

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

  <Accordion title="Gateway proxy">
    وجّه حركة مرور WebSocket الخاصة بـ Discord gateway وعمليات البحث REST عند بدء التشغيل (معرف التطبيق + حل قائمة السماح) عبر وكيل HTTP(S) باستخدام `channels.discord.proxy`.

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

  <Accordion title="PluralKit support">
    فعّل حل PluralKit لربط الرسائل الممررة بهوية عضو النظام:

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
    - تتم مطابقة أسماء عرض الأعضاء بالاسم/المعرف اللطيف فقط عندما يكون `channels.discord.dangerouslyAllowNameMatching: true`
    - تستخدم عمليات البحث معرف الرسالة الأصلي وتكون مقيدة بنافذة زمنية
    - إذا فشل البحث، تعامل الرسائل الممررة كرسائل بوت ويتم إسقاطها ما لم يكن `allowBots=true`

  </Accordion>

  <Accordion title="Outbound mention aliases">
    استخدم `mentionAliases` عندما تحتاج الوكلاء إلى إشارات صادرة حتمية لمستخدمي Discord المعروفين. المفاتيح هي مقابض بدون `@` البادئة؛ القيم هي معرفات مستخدمي Discord. تترك المقابض غير المعروفة و `@everyone` و `@here` والإشارات داخل امتدادات كود Markdown دون تغيير.

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

  <Accordion title="Presence configuration">
    يتم تطبيق تحديثات الحضور عند تعيين حقل حالة أو نشاط، أو عند تفعيل الحضور التلقائي.

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

    - 0: قيد اللعب
    - 1: بث (يتطلب `activityUrl`)
    - 2: استماع
    - 3: مشاهدة
    - 4: مخصص (يستخدم نص النشاط كحالة الحالة؛ الرمز التعبيري اختياري)
    - 5: منافسة

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

    يربط الحضور التلقائي إتاحة وقت التشغيل بحالة Discord: سليم => متصل، متدهور أو غير معروف => خامل، مستنفد أو غير متاح => dnd. تجاوزات النص الاختيارية:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (يدعم العنصر النائب `{reason}`)

  </Accordion>

  <Accordion title="الموافقات في Discord">
    يدعم Discord معالجة الموافقات المستندة إلى الأزرار في الرسائل الخاصة، ويمكنه اختياريًا نشر مطالبات الموافقة في القناة الأصلية.

    مسار الإعدادات:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختياري؛ يرجع إلى `commands.ownerAllowFrom` عندما يكون ذلك ممكنًا)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
    - `agentFilter`، `sessionFilter`، `cleanupAfterResolve`

    يفعّل Discord موافقات التنفيذ الأصلية تلقائيًا عندما يكون `enabled` غير معيّن أو `"auto"` ويمكن حلّ موافق واحد على الأقل، إما من `execApprovals.approvers` أو من `commands.ownerAllowFrom`. لا يستنتج Discord موافقي التنفيذ من `allowFrom` الخاصة بالقناة، أو `dm.allowFrom` القديمة، أو `defaultTo` للرسائل المباشرة. عيّن `enabled: false` لتعطيل Discord كعميل موافقة أصلي بشكل صريح.

    بالنسبة إلى أوامر المجموعات الحساسة الخاصة بالمالك فقط مثل `/diagnostics` و`/export-trajectory`، يرسل OpenClaw مطالبات الموافقة والنتائج النهائية بشكل خاص. يحاول أولًا استخدام رسالة Discord خاصة عندما يكون لدى المالك المستدعي مسار مالك على Discord؛ وإذا لم يكن ذلك متاحًا، يرجع إلى أول مسار مالك متاح من `commands.ownerAllowFrom`، مثل Telegram.

    عندما تكون `target` هي `channel` أو `both`، تكون مطالبة الموافقة مرئية في القناة. يمكن للموافقين الذين تم حلّهم فقط استخدام الأزرار؛ ويتلقى المستخدمون الآخرون رفضًا عابرًا. تتضمن مطالبات الموافقة نص الأمر، لذلك لا تفعّل التسليم إلى القناة إلا في القنوات الموثوقة. إذا تعذّر اشتقاق معرف القناة من مفتاح الجلسة، يرجع OpenClaw إلى التسليم عبر الرسائل الخاصة.

    يعرض Discord أيضًا أزرار الموافقة المشتركة التي تستخدمها قنوات الدردشة الأخرى. يضيف محوّل Discord الأصلي أساسًا توجيه الرسائل الخاصة للموافقين والتوزيع على القنوات.
    عند وجود هذه الأزرار، تكون هي تجربة الموافقة الأساسية؛ ويجب أن يضمّن OpenClaw
    أمر `/approve` يدويًا فقط عندما تشير نتيجة الأداة إلى أن موافقات الدردشة
    غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.
    إذا لم يكن وقت تشغيل الموافقة الأصلي في Discord نشطًا، يبقي OpenClaw
    مطالبة `/approve <id> <decision>` المحلية والحتمية مرئية. وإذا كان
    وقت التشغيل نشطًا لكن تعذّر تسليم بطاقة أصلية إلى أي هدف،
    يرسل OpenClaw إشعارًا احتياطيًا في الدردشة نفسها يتضمن أمر `/approve`
    الدقيق من الموافقة المعلّقة.

    تتبع مصادقة Gateway وحلّ الموافقة عقد عميل Gateway المشترك (معرفات `plugin:` تُحل عبر `plugin.approval.resolve`؛ والمعرفات الأخرى عبر `exec.approval.resolve`). تنتهي صلاحية الموافقات بعد 30 دقيقة افتراضيًا.

    راجع [موافقات التنفيذ](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## الأدوات وبوابات الإجراءات

تتضمن إجراءات رسائل Discord إجراءات المراسلة، وإدارة القنوات، والإشراف، والحضور، والبيانات الوصفية.

أمثلة أساسية:

- المراسلة: `sendMessage`، `readMessages`، `editMessage`، `deleteMessage`، `threadReply`
- التفاعلات: `react`، `reactions`، `emojiList`
- الإشراف: `timeout`، `kick`، `ban`
- الحضور: `setPresence`

يقبل الإجراء `event-create` معلمة `image` اختيارية (رابط URL أو مسار ملف محلي) لتعيين صورة غلاف الحدث المجدول.

توجد بوابات الإجراءات تحت `channels.discord.actions.*`.

سلوك البوابة الافتراضي:

| مجموعة الإجراءات                                                                                                                                                         | الافتراضي |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| التفاعلات، الرسائل، السلاسل، التثبيتات، الاستطلاعات، البحث، معلومات الأعضاء، معلومات الأدوار، معلومات القنوات، القنوات، حالة الصوت، الأحداث، الملصقات، رفع الرموز التعبيرية، رفع الملصقات، الأذونات | مفعّل |
| الأدوار                                                                                                                                                                  | معطّل |
| الإشراف                                                                                                                                                                  | معطّل |
| الحضور                                                                                                                                                                   | معطّل |

## واجهة مستخدم Components v2

يستخدم OpenClaw مكونات Discord v2 لموافقات التنفيذ وعلامات السياقات المتقاطعة. يمكن لإجراءات رسائل Discord أيضًا قبول `components` لواجهة مستخدم مخصصة (متقدم؛ يتطلب إنشاء حمولة مكوّن عبر أداة discord)، بينما تظل `embeds` القديمة متاحة لكنها غير موصى بها.

- يعيّن `channels.discord.ui.components.accentColor` لون التمييز المستخدم في حاويات مكونات Discord (hex).
- عيّنه لكل حساب باستخدام `channels.discord.accounts.<id>.ui.components.accentColor`.
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

لدى Discord سطحان صوتيان متميزان: **قنوات الصوت** الفورية (محادثات مستمرة) و**مرفقات الرسائل الصوتية** (تنسيق معاينة الموجة). يدعم Gateway كليهما.

### قنوات الصوت

قائمة التحقق للإعداد:

1. فعّل Message Content Intent في Discord Developer Portal.
2. فعّل Server Members Intent عند استخدام قوائم السماح للأدوار/المستخدمين.
3. ادعُ البوت مع نطاقي `bot` و`applications.commands`.
4. امنح أذونات Connect وSpeak وSend Messages وRead Message History في قناة الصوت المستهدفة.
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
- يتجاوز `voice.model` نموذج LLM المستخدم لاستجابات قناة الصوت في Discord فقط. اتركه غير معيّن ليرث نموذج الوكيل الموجّه.
- يستخدم STT `tools.media.audio`؛ ولا يؤثر `voice.model` في النسخ.
- تنطبق تجاوزات `systemPrompt` الخاصة بكل قناة في Discord على أدوار نصوص الصوت لتلك القناة الصوتية.
- تستمد أدوار نصوص الصوت حالة المالك من `allowFrom` في Discord (أو `dm.allowFrom`)؛ ولا يمكن للمتحدثين غير المالكين الوصول إلى الأدوات الخاصة بالمالك فقط (مثل `gateway` و`cron`).
- صوت Discord اختياري لإعدادات النص فقط؛ عيّن `channels.discord.voice.enabled=true` (أو أبقِ كتلة `channels.discord.voice` موجودة) لتفعيل أوامر `/vc`، ووقت تشغيل الصوت، وهدف Gateway `GuildVoiceStates`.
- يمكن لـ `channels.discord.intents.voiceStates` تجاوز الاشتراك في هدف حالة الصوت صراحةً. اتركه غير معيّن ليتبع الهدف التفعيل الفعلي للصوت.
- تمرّر `voice.daveEncryption` و`voice.decryptionFailureTolerance` إلى خيارات الانضمام في `@discordjs/voice`.
- القيم الافتراضية لـ `@discordjs/voice` هي `daveEncryption=true` و`decryptionFailureTolerance=24` إذا لم تُعيّن.
- يتحكم `voice.connectTimeoutMs` في انتظار Ready الأولي الخاص بـ `@discordjs/voice` لمحاولات `/vc join` والانضمام التلقائي. الافتراضي: `30000`.
- يتحكم `voice.reconnectGraceMs` في المدة التي ينتظرها OpenClaw حتى تبدأ جلسة صوتية منقطعة بإعادة الاتصال قبل تدميرها. الافتراضي: `15000`.
- يراقب OpenClaw أيضًا حالات فشل فك تشفير الاستقبال ويتعافى تلقائيًا عبر مغادرة قناة الصوت وإعادة الانضمام إليها بعد تكرار حالات الفشل ضمن نافذة قصيرة.
- إذا أظهرت سجلات الاستقبال بشكل متكرر `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` بعد التحديث، فاجمع تقرير تبعية وسجلات. يتضمن خط `@discordjs/voice` المضمّن إصلاح الحشو من المنبع من PR #11449 في discord.js، الذي أغلق issue #11419 في discord.js.

مسار معالجة قناة الصوت:

- يتم تحويل التقاط Discord PCM إلى ملف WAV مؤقت.
- يتولى `tools.media.audio` معالجة STT، مثل `openai/gpt-4o-mini-transcribe`.
- يُرسل النص عبر دخول Discord وتوجيهه بينما يعمل LLM الخاص بالاستجابة مع سياسة إخراج صوتي تخفي أداة `tts` الخاصة بالوكيل وتطلب نصًا مُعادًا، لأن صوت Discord يملك تشغيل TTS النهائي.
- عند تعيين `voice.model`، فإنه يتجاوز LLM الخاص بالاستجابة فقط لهذا الدور في قناة الصوت.
- يتم دمج `voice.tts` فوق `messages.tts`؛ ويُشغّل الصوت الناتج في القناة المنضم إليها.

تُحل بيانات الاعتماد لكل مكوّن: مصادقة مسار LLM لـ `voice.model`، ومصادقة STT لـ `tools.media.audio`، ومصادقة TTS لـ `messages.tts`/`voice.tts`.

### الرسائل الصوتية

تعرض رسائل Discord الصوتية معاينة موجة وتتطلب صوت OGG/Opus. ينشئ OpenClaw الموجة تلقائيًا، لكنه يحتاج إلى `ffmpeg` و`ffprobe` على مضيف Gateway للفحص والتحويل.

- وفّر **مسار ملف محليًا** (يتم رفض عناوين URL).
- احذف محتوى النص (يرفض Discord النص + الرسالة الصوتية في الحمولة نفسها).
- يُقبل أي تنسيق صوت؛ ويحوّله OpenClaw إلى OGG/Opus عند الحاجة.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="استُخدمت أهداف غير مسموح بها أو لا يرى البوت رسائل النقابة">

    - فعّل Message Content Intent
    - فعّل Server Members Intent عندما تعتمد على حلّ المستخدم/العضو
    - أعد تشغيل Gateway بعد تغيير الأهداف

  </Accordion>

  <Accordion title="رسائل النقابة محظورة بشكل غير متوقع">

    - تحقق من `groupPolicy`
    - تحقق من قائمة السماح للنقابة تحت `channels.discord.guilds`
    - إذا كانت خريطة `channels` الخاصة بالنقابة موجودة، فلا يُسمح إلا للقنوات المدرجة
    - تحقق من سلوك `requireMention` وأنماط الإشارة

    فحوصات مفيدة:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false لكن ما زال محظورًا">
    أسباب شائعة:

    - `groupPolicy="allowlist"` بدون قائمة سماح مطابقة للنقابة/القناة
    - تم ضبط `requireMention` في المكان الخطأ (يجب أن يكون تحت `channels.discord.guilds` أو إدخال القناة)
    - المُرسل محظور بواسطة قائمة السماح `users` الخاصة بالنقابة/القناة

  </Accordion>

  <Accordion title="أدوار Discord طويلة التشغيل أو ردود مكررة">

    سجلات نموذجية:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    مقابض قائمة انتظار Gateway في Discord:

    - حساب واحد: `channels.discord.eventQueue.listenerTimeout`
    - عدة حسابات: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - يتحكم هذا فقط في عمل مستمع Gateway في Discord، وليس عمر دور الوكيل

    لا يطبّق Discord مهلة مملوكة للقناة على أدوار الوكيل الموضوعة في قائمة الانتظار. تسلّم مستمعات الرسائل العمل فورًا، وتحافظ تشغيلات Discord الموضوعة في قائمة الانتظار على ترتيب كل جلسة إلى أن تكتمل دورة حياة الجلسة/الأداة/وقت التشغيل أو يتم إجهاض العمل.

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
    يجلب OpenClaw بيانات Discord `/gateway/bot` الوصفية قبل الاتصال. تعود حالات الفشل العابرة إلى عنوان URL الافتراضي لـ Gateway في Discord، وتخضع لتحديد المعدل في السجلات.

    مفاتيح ضبط مهلة البيانات الوصفية:

    - حساب واحد: `channels.discord.gatewayInfoTimeoutMs`
    - حسابات متعددة: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - بديل البيئة عند عدم ضبط الإعداد: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - الافتراضي: `30000` (30 ثانية)، الحد الأقصى: `120000`

  </Accordion>

  <Accordion title="إعادات التشغيل بسبب مهلة READY في Gateway">
    ينتظر OpenClaw حدث `READY` في Gateway الخاص بـ Discord أثناء بدء التشغيل وبعد إعادة الاتصال وقت التشغيل. قد تحتاج إعدادات الحسابات المتعددة مع تدرج بدء التشغيل إلى نافذة READY أطول عند بدء التشغيل من القيمة الافتراضية.

    مفاتيح ضبط مهلة READY:

    - بدء التشغيل لحساب واحد: `channels.discord.gatewayReadyTimeoutMs`
    - بدء التشغيل لحسابات متعددة: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - بديل بيئة بدء التشغيل عند عدم ضبط الإعداد: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - افتراضي بدء التشغيل: `15000` (15 ثانية)، الحد الأقصى: `120000`
    - وقت التشغيل لحساب واحد: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - وقت التشغيل لحسابات متعددة: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - بديل بيئة وقت التشغيل عند عدم ضبط الإعداد: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - افتراضي وقت التشغيل: `30000` (30 ثانية)، الحد الأقصى: `120000`

  </Accordion>

  <Accordion title="عدم تطابق تدقيق الأذونات">
    تعمل فحوصات أذونات `channels status --probe` فقط مع معرّفات القنوات الرقمية.

    إذا كنت تستخدم مفاتيح مختصرة نصية، فقد تستمر المطابقة وقت التشغيل في العمل، لكن الفحص لا يمكنه التحقق الكامل من الأذونات.

  </Accordion>

  <Accordion title="مشكلات الرسائل الخاصة والاقتران">

    - الرسائل الخاصة معطلة: `channels.discord.dm.enabled=false`
    - سياسة الرسائل الخاصة معطلة: `channels.discord.dmPolicy="disabled"` (قديم: `channels.discord.dm.policy`)
    - انتظار موافقة الاقتران في وضع `pairing`

  </Accordion>

  <Accordion title="حلقات البوت إلى البوت">
    افتراضيًا، يتم تجاهل الرسائل المنشأة بواسطة البوتات.

    إذا ضبطت `channels.discord.allowBots=true`، فاستخدم قواعد إشارة وقوائم سماح صارمة لتجنب سلوك الحلقات.
    فضّل `channels.discord.allowBots="mentions"` لقبول رسائل البوتات فقط عندما تشير إلى البوت.

```json5
{
  channels: {
    discord: {
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write "@Mantis" and send a real Discord mention.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="إسقاطات تحويل الصوت إلى نص مع DecryptionFailed(...)">

    - أبقِ OpenClaw محدثًا (`openclaw update`) حتى يكون منطق استرداد استقبال صوت Discord موجودًا
    - تأكد من `channels.discord.voice.daveEncryption=true` (الافتراضي)
    - ابدأ من `channels.discord.voice.decryptionFailureTolerance=24` (افتراضي المنبع) واضبطه فقط عند الحاجة
    - راقب السجلات بحثًا عن:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - إذا استمرت حالات الفشل بعد إعادة الانضمام التلقائية، فاجمع السجلات وقارنها بتاريخ استقبال DAVE في المنبع ضمن [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) و[discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## مرجع الإعدادات

المرجع الأساسي: [مرجع الإعدادات - Discord](/ar/gateway/config-channels#discord).

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
- واجهة المستخدم: `ui.components.accentColor`
- الميزات: `threadBindings`، `bindings[]` في المستوى الأعلى (`type: "acp"`)، `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## السلامة والعمليات

- تعامل مع رموز البوت كأسرار (يفضّل `DISCORD_BOT_TOKEN` في البيئات الخاضعة للإشراف).
- امنح أذونات Discord بأقل امتيازات ممكنة.
- إذا كانت حالة نشر/أوامر الأوامر قديمة، فأعد تشغيل Gateway وأعد الفحص باستخدام `openclaw channels status --probe`.

## ذو صلة

<CardGroup cols={2}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    اقرن مستخدم Discord بـ Gateway.
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
  <Card title="توجيه متعدد الوكلاء" icon="sitemap" href="/ar/concepts/multi-agent">
    عيّن النقابات والقنوات إلى الوكلاء.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلية.
  </Card>
</CardGroup>

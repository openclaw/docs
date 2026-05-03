---
read_when:
    - العمل على ميزات قناة Discord
summary: حالة دعم بوت Discord وإمكاناته وتكوينه
title: Discord
x-i18n:
    generated_at: "2026-05-03T21:27:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a38cb3c8e25c1f3d6b7ddfc35a0445dc264be74d74b08d0051528b462b743a3
    source_path: channels/discord.md
    workflow: 16
---

جاهز للرسائل المباشرة وقنوات الخوادم عبر Discord Gateway الرسمي.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    تدخل رسائل Discord المباشرة وضع الاقتران افتراضيًا.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وفهرس الأوامر.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات وإصلاحات عابرة للقنوات.
  </Card>
</CardGroup>

## الإعداد السريع

ستحتاج إلى إنشاء تطبيق جديد مع بوت، وإضافة البوت إلى خادمك، وإقرانه مع OpenClaw. نوصي بإضافة البوت إلى خادمك الخاص. إذا لم يكن لديك واحد بعد، [أنشئ واحدًا أولًا](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (اختر **Create My Own > For me and my friends**).

<Steps>
  <Step title="إنشاء تطبيق Discord وبوت">
    انتقل إلى [Discord Developer Portal](https://discord.com/developers/applications) وانقر **New Application**. سمّه شيئًا مثل "OpenClaw".

    انقر **Bot** في الشريط الجانبي. اضبط **Username** على الاسم الذي تطلقه على وكيل OpenClaw لديك.

  </Step>

  <Step title="تمكين النوايا ذات الامتيازات">
    وأنت لا تزال في صفحة **Bot**، مرّر إلى أسفل حتى **Privileged Gateway Intents** ومكّن:

    - **Message Content Intent** (مطلوب)
    - **Server Members Intent** (موصى به؛ مطلوب لقوائم السماح بالأدوار ومطابقة الاسم مع المعرّف)
    - **Presence Intent** (اختياري؛ مطلوب فقط لتحديثات الحضور)

  </Step>

  <Step title="نسخ رمز البوت">
    مرّر إلى أعلى مجددًا في صفحة **Bot** وانقر **Reset Token**.

    <Note>
    رغم الاسم، يؤدي هذا إلى إنشاء أول رمز لك — لا يتم "إعادة ضبط" أي شيء.
    </Note>

    انسخ الرمز واحفظه في مكان ما. هذا هو **Bot Token** وستحتاج إليه قريبًا.

  </Step>

  <Step title="إنشاء رابط دعوة وإضافة البوت إلى خادمك">
    انقر **OAuth2** في الشريط الجانبي. ستنشئ رابط دعوة بالصلاحيات المناسبة لإضافة البوت إلى خادمك.

    مرّر إلى أسفل حتى **OAuth2 URL Generator** ومكّن:

    - `bot`
    - `applications.commands`

    سيظهر قسم **Bot Permissions** أدناه. مكّن على الأقل:

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions (اختياري)

    هذه هي المجموعة الأساسية لقنوات النص العادية. إذا كنت تخطط للنشر في سلاسل Discord، بما في ذلك سير عمل قنوات المنتدى أو الوسائط التي تنشئ سلسلة أو تتابعها، فمكّن أيضًا **Send Messages in Threads**.
    انسخ الرابط المنشأ في الأسفل، والصقه في متصفحك، وحدد خادمك، وانقر **Continue** للاتصال. ينبغي أن ترى الآن البوت في خادم Discord.

  </Step>

  <Step title="تمكين وضع المطور وجمع معرّفاتك">
    بالعودة إلى تطبيق Discord، تحتاج إلى تمكين وضع المطور حتى تتمكن من نسخ المعرّفات الداخلية.

    1. انقر **User Settings** (أيقونة الترس بجانب صورتك الرمزية) → **Advanced** → فعّل **Developer Mode**
    2. انقر بزر الماوس الأيمن على **أيقونة الخادم** في الشريط الجانبي → **Copy Server ID**
    3. انقر بزر الماوس الأيمن على **صورتك الرمزية** → **Copy User ID**

    احفظ **Server ID** و**User ID** إلى جانب Bot Token لديك — سترسل الثلاثة جميعًا إلى OpenClaw في الخطوة التالية.

  </Step>

  <Step title="السماح بالرسائل المباشرة من أعضاء الخادم">
    لكي يعمل الاقتران، يحتاج Discord إلى السماح للبوت بإرسال رسالة مباشرة إليك. انقر بزر الماوس الأيمن على **أيقونة الخادم** → **Privacy Settings** → فعّل **Direct Messages**.

    يتيح هذا لأعضاء الخادم (بما في ذلك البوتات) إرسال رسائل مباشرة إليك. أبقِ هذا مفعّلًا إذا كنت تريد استخدام رسائل Discord المباشرة مع OpenClaw. إذا كنت تخطط لاستخدام قنوات الخادم فقط، يمكنك تعطيل الرسائل المباشرة بعد الاقتران.

  </Step>

  <Step title="ضبط رمز البوت بأمان (لا ترسله في الدردشة)">
    رمز بوت Discord لديك سرّي (مثل كلمة المرور). اضبطه على الجهاز الذي يشغّل OpenClaw قبل مراسلة وكيلك.

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

    إذا كان OpenClaw يعمل بالفعل كخدمة في الخلفية، فأعد تشغيله عبر تطبيق OpenClaw على Mac أو بإيقاف عملية `openclaw gateway run` وإعادة تشغيلها.
    بالنسبة إلى عمليات تثبيت الخدمات المُدارة، شغّل `openclaw gateway install` من صدفة يكون فيها `DISCORD_BOT_TOKEN` موجودًا، أو خزّن المتغير في `~/.openclaw/.env`، حتى تتمكن الخدمة من حل SecretRef الخاص بالبيئة بعد إعادة التشغيل.
    إذا كان مضيفك محظورًا أو خاضعًا لتحديد معدل بواسطة بحث تطبيق بدء التشغيل في Discord، فاضبط معرّف تطبيق/عميل Discord من Developer Portal حتى يتمكن بدء التشغيل من تخطي استدعاء REST هذا. استخدم `channels.discord.applicationId` للحساب الافتراضي، أو `channels.discord.accounts.<accountId>.applicationId` عند تشغيل عدة بوتات Discord.

  </Step>

  <Step title="تكوين OpenClaw والاقتران">

    <Tabs>
      <Tab title="اسأل وكيلك">
        تحدث مع وكيل OpenClaw لديك على أي قناة موجودة (مثل Telegram) وأخبره. إذا كانت Discord هي قناتك الأولى، فاستخدم تبويب CLI / config بدلًا من ذلك.

        > "لقد ضبطت بالفعل رمز بوت Discord في التكوين. يُرجى إنهاء إعداد Discord باستخدام User ID `<user_id>` وServer ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        إذا كنت تفضل التكوين المستند إلى الملفات، فاضبط:

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

        الرجوع الاحتياطي إلى البيئة للحساب الافتراضي:

```bash
DISCORD_BOT_TOKEN=...
```

        للإعداد البرمجي أو عن بُعد، اكتب كتلة JSON5 نفسها باستخدام `openclaw config patch --file ./discord.patch.json5 --dry-run` ثم أعد التشغيل دون `--dry-run`. قيم `token` النصية الصريحة مدعومة. قيم SecretRef مدعومة أيضًا لـ `channels.discord.token` عبر مزودي env/file/exec. راجع [إدارة الأسرار](/ar/gateway/secrets).

        لعدة بوتات Discord، احتفظ برمز كل بوت ومعرّف التطبيق تحت حسابه. يتم توريث `channels.discord.applicationId` في المستوى الأعلى بواسطة الحسابات، لذا لا تضبطه هناك إلا عندما ينبغي لكل حساب استخدام معرّف التطبيق نفسه.

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

  <Step title="الموافقة على أول اقتران عبر الرسائل المباشرة">
    انتظر حتى يعمل Gateway، ثم أرسل رسالة مباشرة إلى البوت في Discord. سيرد برمز اقتران.

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

    ينبغي أن تتمكن الآن من الدردشة مع وكيلك في Discord عبر الرسائل المباشرة.

  </Step>
</Steps>

<Note>
حل الرمز يراعي الحساب. قيم رمز التكوين تتغلب على الرجوع الاحتياطي للبيئة. يُستخدم `DISCORD_BOT_TOKEN` للحساب الافتراضي فقط.
إذا تم حل حسابين مفعّلين في Discord إلى رمز البوت نفسه، فإن OpenClaw يبدأ مراقب Gateway واحدًا فقط لذلك الرمز. يتغلب الرمز القادم من التكوين على الرجوع الاحتياطي الافتراضي للبيئة؛ وإلا فإن أول حساب مفعّل هو الذي يفوز ويتم الإبلاغ عن الحساب المكرر كمعطّل.
بالنسبة إلى الاستدعاءات الصادرة المتقدمة (أداة الرسائل/إجراءات القناة)، يُستخدم `token` صريح لكل استدعاء لذلك الاستدعاء. ينطبق هذا على إجراءات الإرسال والقراءة/الفحص (مثل read/search/fetch/thread/pins/permissions). لا تزال إعدادات سياسة الحساب/إعادة المحاولة تأتي من الحساب المحدد في لقطة وقت التشغيل النشطة.
</Note>

## موصى به: إعداد مساحة عمل للخادم

بعد أن تعمل الرسائل المباشرة، يمكنك إعداد خادم Discord كمساحة عمل كاملة حيث تحصل كل قناة على جلسة وكيل خاصة بها وبسياقها الخاص. يُوصى بهذا للخوادم الخاصة حيث لا يوجد إلا أنت والبوت.

<Steps>
  <Step title="إضافة خادمك إلى قائمة السماح للخوادم">
    يتيح هذا لوكيلك الرد في أي قناة على خادمك، وليس الرسائل المباشرة فقط.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "أضف Discord Server ID الخاص بي `<server_id>` إلى قائمة السماح للخوادم"
      </Tab>
      <Tab title="التكوين">

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

  <Step title="السماح بالردود دون @mention">
    افتراضيًا، لا يرد وكيلك في قنوات الخادم إلا عند @mentioned. بالنسبة إلى خادم خاص، سترغب على الأرجح في أن يرد على كل رسالة.

    في قنوات الخادم، تبقى ردود المساعد النهائية العادية خاصة افتراضيًا. يجب إرسال مخرجات Discord المرئية صراحةً باستخدام أداة `message`، حتى يتمكن الوكيل من المراقبة بصمت افتراضيًا والنشر فقط عندما يقرر أن الرد في القناة مفيد.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "اسمح لوكيلي بالرد على هذا الخادم دون الحاجة إلى @mentioned"
      </Tab>
      <Tab title="التكوين">
        اضبط `requireMention: false` في تكوين الخادم لديك:

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

  <Step title="التخطيط للذاكرة في قنوات الخادم">
    افتراضيًا، لا تُحمّل الذاكرة طويلة الأمد (MEMORY.md) إلا في جلسات الرسائل المباشرة. لا تُحمّل قنوات الخادم MEMORY.md تلقائيًا.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "عندما أطرح أسئلة في قنوات Discord، استخدم memory_search أو memory_get إذا احتجت إلى سياق طويل الأمد من MEMORY.md."
      </Tab>
      <Tab title="يدوي">
        إذا كنت تحتاج إلى سياق مشترك في كل قناة، فضع التعليمات الثابتة في `AGENTS.md` أو `USER.md` (يتم حقنها في كل جلسة). احتفظ بالملاحظات طويلة الأمد في `MEMORY.md` واصل إليها عند الطلب باستخدام أدوات الذاكرة.
      </Tab>
    </Tabs>

  </Step>
</Steps>

أنشئ الآن بعض القنوات على خادم Discord وابدأ الدردشة. يستطيع وكيلك رؤية اسم القناة، وتحصل كل قناة على جلستها المعزولة الخاصة — بحيث يمكنك إعداد `#coding` أو `#home` أو `#research` أو أي شيء يناسب سير عملك.

## نموذج وقت التشغيل

- يملك Gateway اتصال Discord.
- توجيه الردود حتمي: تعود الردود الواردة من Discord إلى Discord.
- تُضاف بيانات guild/channel الوصفية في Discord إلى موجه النموذج كسياق غير موثوق
  به، وليس كبادئة رد مرئية للمستخدم. إذا نسخ النموذج ذلك الغلاف
  مرة أخرى، يزيل OpenClaw البيانات الوصفية المنسوخة من الردود الصادرة ومن
  سياق إعادة التشغيل المستقبلي.
- افتراضيًا (`session.dmScope=main`)، تشارك المحادثات المباشرة جلسة الوكيل الرئيسية (`agent:main:main`).
- قنوات الخوادم هي مفاتيح جلسات معزولة (`agent:<agentId>:discord:channel:<channelId>`).
- يتم تجاهل Group DMs افتراضيًا (`channels.discord.dm.groupEnabled=false`).
- تعمل أوامر الشرطة المائلة الأصلية في جلسات أوامر معزولة (`agent:<agentId>:discord:slash:<userId>`)، مع استمرار حمل `CommandTargetSessionKey` إلى جلسة المحادثة الموجّهة.
- يستخدم تسليم إعلانات cron/heartbeat النصية فقط إلى Discord الإجابة النهائية
  المرئية للمساعد مرة واحدة. تبقى حمولات الوسائط والمكونات المنظمة
  متعددة الرسائل عندما يرسل الوكيل عدة حمولات قابلة للتسليم.

## قنوات المنتديات

لا تقبل قنوات المنتديات والوسائط في Discord إلا منشورات سلاسل النقاش. يدعم OpenClaw طريقتين لإنشائها:

- أرسل رسالة إلى أصل المنتدى (`channel:<forumId>`) لإنشاء سلسلة نقاش تلقائيًا. يستخدم عنوان سلسلة النقاش أول سطر غير فارغ من رسالتك.
- استخدم `openclaw message thread create` لإنشاء سلسلة نقاش مباشرة. لا تمرر `--message-id` لقنوات المنتديات.

مثال: الإرسال إلى أصل المنتدى لإنشاء سلسلة نقاش

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

مثال: إنشاء سلسلة نقاش منتدى صراحةً

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

لا تقبل أصول المنتديات مكونات Discord. إذا احتجت إلى مكونات، فأرسل إلى سلسلة النقاش نفسها (`channel:<threadId>`).

## المكونات التفاعلية

يدعم OpenClaw حاويات مكونات Discord v2 لرسائل الوكيل. استخدم أداة الرسائل مع حمولة `components`. تُوجّه نتائج التفاعل مرة أخرى إلى الوكيل كرسائل واردة عادية وتتبع إعدادات Discord `replyToMode` الحالية.

الكتل المدعومة:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- تسمح صفوف الإجراءات بما يصل إلى 5 أزرار أو قائمة اختيار واحدة
- أنواع الاختيار: `string`, `user`, `role`, `mentionable`, `channel`

افتراضيًا، تكون المكونات للاستخدام مرة واحدة. اضبط `components.reusable=true` للسماح باستخدام الأزرار والاختيارات والنماذج عدة مرات حتى تنتهي صلاحيتها.

لتقييد من يمكنه النقر على زر، اضبط `allowedUsers` على ذلك الزر (معرّفات مستخدمي Discord أو الوسوم أو `*`). عند التكوين، يتلقى المستخدمون غير المطابقين رفضًا مؤقتًا.

تفتح أوامر الشرطة المائلة `/model` و`/models` منتقي نماذج تفاعليًا يتضمن قوائم منسدلة للمزوّد والنموذج وبيئة التشغيل المتوافقة، بالإضافة إلى خطوة إرسال. تم إهمال `/models add` وهو يعيد الآن رسالة إهمال بدلًا من تسجيل النماذج من المحادثة. رد المنتقي مؤقت ولا يمكن استخدامه إلا بواسطة المستخدم الذي استدعاه.

مرفقات الملفات:

- يجب أن تشير كتل `file` إلى مرجع مرفق (`attachment://<filename>`)
- وفّر المرفق عبر `media`/`path`/`filePath` (ملف واحد)؛ استخدم `media-gallery` لعدة ملفات
- استخدم `filename` لتجاوز اسم الرفع عندما ينبغي أن يطابق مرجع المرفق

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
  <Tab title="سياسة DM">
    يتحكم `channels.discord.dmPolicy` في وصول DM. `channels.discord.allowFrom` هي قائمة السماح القانونية لـ DM.

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `channels.discord.allowFrom` القيمة `"*"`)
    - `disabled`

    إذا لم تكن سياسة DM مفتوحة، يتم حظر المستخدمين غير المعروفين (أو يُطلب منهم الاقتران في وضع `pairing`).

    أسبقية الحسابات المتعددة:

    - ينطبق `channels.discord.accounts.default.allowFrom` فقط على حساب `default`.
    - لحساب واحد، تكون أولوية `allowFrom` أعلى من `dm.allowFrom` القديم.
    - ترث الحسابات المسماة `channels.discord.allowFrom` عندما لا تكون `allowFrom` الخاصة بها و`dm.allowFrom` القديم مضبوطين.
    - لا ترث الحسابات المسماة `channels.discord.accounts.default.allowFrom`.

    لا يزال `channels.discord.dm.policy` و`channels.discord.dm.allowFrom` القديمان يُقرآن للتوافق. يرحّلهما `openclaw doctor --fix` إلى `dmPolicy` و`allowFrom` عندما يمكنه فعل ذلك دون تغيير الوصول.

    تنسيق هدف DM للتسليم:

    - `user:<id>`
    - ذكر `<@id>`

    عادةً ما تُحل معرّفات الأرقام المجردة كمعرّفات قنوات عندما يكون افتراضي القناة نشطًا، لكن المعرّفات المدرجة في `allowFrom` الفعّالة لـ DM في الحساب تُعامل كأهداف DM لمستخدمين من أجل التوافق.

  </Tab>

  <Tab title="مجموعات وصول DM">
    يمكن أن تستخدم رسائل Discord DM إدخالات `accessGroup:<name>` ديناميكية في `channels.discord.allowFrom`.

    أسماء مجموعات الوصول مشتركة بين قنوات الرسائل. استخدم `type: "message.senders"` لمجموعة ثابتة يُعبَّر عن أعضائها بصيغة `allowFrom` العادية لكل قناة، أو `type: "discord.channelAudience"` عندما ينبغي أن يحدد جمهور `ViewChannel` الحالي لقناة Discord العضوية ديناميكيًا. تم توثيق سلوك مجموعات الوصول المشتركة هنا: [مجموعات الوصول](/ar/channels/access-groups).

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

    لا تملك قناة نصية في Discord قائمة أعضاء منفصلة. يصوغ `type: "discord.channelAudience"` العضوية كما يلي: يكون مرسل DM عضوًا في الخادم المكوَّن ولديه حاليًا إذن `ViewChannel` فعّال على القناة المكوَّنة بعد تطبيق أدوار القناة وتجاوزاتها.

    مثال: السماح لأي شخص يستطيع رؤية `#maintainers` بإرسال DM إلى البوت، مع إبقاء DMs مغلقة أمام الجميع غيره.

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

    تفشل عمليات البحث وهي مغلقة. إذا أعاد Discord `Missing Access`، أو فشل بحث العضو، أو كانت القناة تنتمي إلى خادم مختلف، فيُعامل مرسل DM كغير مصرّح له.

    فعّل **Server Members Intent** في Discord Developer Portal للبوت عند استخدام مجموعات الوصول المستندة إلى جمهور القناة. لا تتضمن DMs حالة عضو الخادم، لذلك يحل OpenClaw العضو عبر Discord REST وقت التفويض.

  </Tab>

  <Tab title="سياسة الخادم">
    يتم التحكم في التعامل مع الخوادم بواسطة `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    خط الأساس الآمن عند وجود `channels.discord` هو `allowlist`.

    سلوك `allowlist`:

    - يجب أن يطابق الخادم `channels.discord.guilds` (يفضل `id`، ويُقبل slug)
    - قوائم سماح اختيارية للمرسلين: `users` (يوصى بالمعرّفات الثابتة) و`roles` (معرّفات الأدوار فقط)؛ إذا تم تكوين أي منهما، يُسمح للمرسلين عندما يطابقون `users` أو `roles`
    - مطابقة الاسم/الوسم المباشرة معطلة افتراضيًا؛ فعّل `channels.discord.dangerouslyAllowNameMatching: true` فقط كوضع توافق لكسر الزجاج
    - الأسماء/الوسوم مدعومة لـ `users`، لكن المعرّفات أكثر أمانًا؛ يحذر `openclaw security audit` عند استخدام إدخالات الاسم/الوسم
    - إذا كان لدى خادم `channels` مكوَّنة، تُرفض القنوات غير المدرجة
    - إذا لم يكن لدى خادم كتلة `channels`، يُسمح بكل القنوات في ذلك الخادم المدرج في قائمة السماح

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

    إذا ضبطت `DISCORD_BOT_TOKEN` فقط ولم تُنشئ كتلة `channels.discord`، فإن الرجوع الاحتياطي وقت التشغيل هو `groupPolicy="allowlist"` (مع تحذير في السجلات)، حتى إذا كانت `channels.defaults.groupPolicy` هي `open`.

  </Tab>

  <Tab title="الإشارات وGroup DMs">
    تكون رسائل الخوادم محكومة بالإشارة افتراضيًا.

    يتضمن اكتشاف الإشارة:

    - إشارة صريحة إلى البوت
    - أنماط الإشارة المكوَّنة (`agents.list[].groupChat.mentionPatterns`، والاحتياطي `messages.groupChat.mentionPatterns`)
    - سلوك الرد الضمني على البوت في الحالات المدعومة

    عند كتابة رسائل Discord صادرة، استخدم صيغة الإشارة القانونية: `<@USER_ID>` للمستخدمين، و`<#CHANNEL_ID>` للقنوات، و`<@&ROLE_ID>` للأدوار. لا تستخدم صيغة إشارة اللقب القديمة `<@!USER_ID>`.

    يتم تكوين `requireMention` لكل خادم/قناة (`channels.discord.guilds...`).
    يسقط `ignoreOtherMentions` اختياريًا الرسائل التي تشير إلى مستخدم/دور آخر ولكن لا تشير إلى البوت (باستثناء @everyone/@here).

    Group DMs:

    - افتراضي: يتم تجاهلها (`dm.groupEnabled=false`)
    - قائمة سماح اختيارية عبر `dm.groupChannels` (معرّفات القنوات أو slugs)

  </Tab>
</Tabs>

### توجيه الوكلاء المستند إلى الأدوار

استخدم `bindings[].match.roles` لتوجيه أعضاء خادم Discord إلى وكلاء مختلفين حسب معرّف الدور. لا تقبل الارتباطات المستندة إلى الأدوار إلا معرّفات الأدوار، ويتم تقييمها بعد ارتباطات النظير أو النظير الأصل وقبل ارتباطات الخادم فقط. إذا ضبط ارتباط حقول مطابقة أخرى أيضًا (مثل `peer` + `guildId` + `roles`)، فيجب أن تطابق كل الحقول المكوَّنة.

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
- تجاوز لكل قناة: `channels.discord.commands.native`.
- يؤدي `commands.native=false` إلى تخطي تسجيل أوامر الشرطة المائلة في Discord وتنظيفها أثناء بدء التشغيل. قد تظل الأوامر المسجلة سابقا مرئية في Discord إلى أن تزيلها من تطبيق Discord.
- تستخدم مصادقة الأوامر الأصلية قوائم السماح والسياسات نفسها الخاصة بـ Discord مثل معالجة الرسائل العادية.
- قد تظل الأوامر مرئية في واجهة Discord للمستخدمين غير المصرح لهم؛ ومع ذلك يظل التنفيذ يفرض مصادقة OpenClaw ويعيد "not authorized".

راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands) للاطلاع على كتالوج الأوامر وسلوكها.

إعدادات أوامر الشرطة المائلة الافتراضية:

- `ephemeral: true`

## تفاصيل الميزة

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    يدعم Discord وسوم الرد في مخرجات الوكيل:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    يتم التحكم بها عبر `channels.discord.replyToMode`:

    - `off` (الافتراضي)
    - `first`
    - `all`
    - `batched`

    ملاحظة: يؤدي `off` إلى تعطيل تسلسل الردود الضمني. لا تزال وسوم `[[reply_to_*]]` الصريحة محترمة.
    يرفق `first` دائما مرجع الرد الأصلي الضمني بأول رسالة Discord صادرة في الدور.
    يرفق `batched` مرجع الرد الأصلي الضمني في Discord فقط عندما يكون
    الدور الوارد دفعة مؤجلة من عدة رسائل. يكون هذا مفيدا
    عندما تريد الردود الأصلية أساسا للمحادثات المتدفقة الملتبسة، وليس لكل
    دور يتكون من رسالة واحدة.

    تظهر معرفات الرسائل في السياق/السجل حتى تتمكن الوكلاء من استهداف رسائل محددة.

  </Accordion>

  <Accordion title="Live stream preview">
    يمكن لـ OpenClaw بث مسودات الردود عبر إرسال رسالة مؤقتة وتحريرها عند وصول النص. يقبل `channels.discord.streaming` القيم `off` (الافتراضي) | `partial` | `block` | `progress`. يحتفظ `progress` بمسودة حالة واحدة قابلة للتحرير ويحدثها بتقدم الأدوات حتى التسليم النهائي؛ `streamMode` اسم مستعار قديم ويتم ترحيله تلقائيا.

    تبقى القيمة الافتراضية `off` لأن تعديلات المعاينة في Discord تصل إلى حدود المعدل بسرعة عندما تتشارك عدة بوتات أو Gateways حسابا واحدا.

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

    - يحرر `partial` رسالة معاينة واحدة مع وصول الرموز.
    - يصدر `block` قطعا بحجم المسودة (استخدم `draftChunk` لضبط الحجم ونقاط الفصل، مع التقييد إلى `textChunkLimit`).
    - تؤدي النهايات التي تحتوي على وسائط أو أخطاء أو ردود صريحة إلى إلغاء تعديلات المعاينة المعلقة.
    - يتحكم `streaming.preview.toolProgress` (افتراضيا `true`) فيما إذا كانت تحديثات الأداة/التقدم تعيد استخدام رسالة المعاينة.

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

    - يتم توجيه سلاسل Discord كجلسات قنوات وترث إعدادات القناة الأصلية ما لم يتم تجاوزها.
    - ترث جلسات السلاسل اختيار `/model` على مستوى جلسة القناة الأصلية كخيار احتياطي للنموذج فقط؛ تظل اختيارات `/model` المحلية للسلسلة ذات أولوية ولا يتم نسخ سجل النص الأصلي ما لم يتم تفعيل وراثة النص.
    - يجعل `channels.discord.thread.inheritParent` (افتراضيا `false`) السلاسل التلقائية الجديدة تبدأ من نص القناة الأصلية. توجد التجاوزات لكل حساب تحت `channels.discord.accounts.<id>.thread.inheritParent`.
    - يمكن لتفاعلات أداة الرسائل حل أهداف الرسائل المباشرة `user:<id>`.
    - يتم الحفاظ على `guilds.<guild>.channels.<channel>.requireMention: false` أثناء الرجوع الاحتياطي لتفعيل مرحلة الرد.

    يتم حقن موضوعات القنوات كسياق **غير موثوق**. تتحكم قوائم السماح بمن يمكنه تشغيل الوكيل، وليست حد تنقيح كامل للسياق التكميلي.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    يمكن لـ Discord ربط سلسلة بهدف جلسة بحيث تستمر رسائل المتابعة في تلك السلسلة بالتوجيه إلى الجلسة نفسها (بما في ذلك جلسات الوكلاء الفرعيين).

    الأوامر:

    - `/focus <target>` اربط السلسلة الحالية/الجديدة بهدف وكيل فرعي/جلسة
    - `/unfocus` أزل ربط السلسلة الحالية
    - `/agents` اعرض التشغيلات النشطة وحالة الربط
    - `/session idle <duration|off>` افحص/حدث إلغاء التركيز التلقائي بسبب عدم النشاط للروابط المركزة
    - `/session max-age <duration|off>` افحص/حدث الحد الأقصى الصارم للعمر للروابط المركزة

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

    - يضبط `session.threadBindings.*` القيم الافتراضية العامة.
    - يتجاوز `channels.discord.threadBindings.*` سلوك Discord.
    - يتحكم `spawnSessions` في إنشاء/ربط السلاسل تلقائيا لـ `sessions_spawn({ thread: true })` وعمليات إنشاء سلاسل ACP. الافتراضي: `true`.
    - يتحكم `defaultSpawnContext` في سياق الوكيل الفرعي الأصلي لعمليات الإنشاء المرتبطة بالسلاسل. الافتراضي: `"fork"`.
    - يتم ترحيل مفاتيح `spawnSubagentSessions`/`spawnAcpSessions` المهملة بواسطة `openclaw doctor --fix`.
    - إذا كانت روابط السلاسل معطلة لحساب ما، فلن تتوفر `/focus` وعمليات ربط السلاسل ذات الصلة.

    راجع [الوكلاء الفرعيين](/ar/tools/subagents)، و[وكلاء ACP](/ar/tools/acp-agents)، و[مرجع التكوين](/ar/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    لمساحات عمل ACP الثابتة "الدائمة التشغيل"، اضبط روابط ACP المكتوبة على المستوى الأعلى لاستهداف محادثات Discord.

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

    راجع [وكلاء ACP](/ar/tools/acp-agents) للحصول على تفاصيل سلوك الربط.

  </Accordion>

  <Accordion title="Reaction notifications">
    وضع إشعارات التفاعل لكل خادم:

    - `off`
    - `own` (الافتراضي)
    - `all`
    - `allowlist` (يستخدم `guilds.<id>.users`)

    يتم تحويل أحداث التفاعل إلى أحداث نظام وإرفاقها بجلسة Discord الموجهة.

  </Accordion>

  <Accordion title="Ack reactions">
    يرسل `ackReaction` رمز تعبير إقرار أثناء معالجة OpenClaw لرسالة واردة.

    ترتيب الحل:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - احتياطي رمز تعبير هوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يقبل Discord رموز تعبير يونيكود أو أسماء رموز تعبير مخصصة.
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="Config writes">
    عمليات كتابة الإعداد التي تبدأها القناة مفعلة افتراضيا.

    يؤثر هذا في مسارات `/config set|unset` (عندما تكون ميزات الأوامر مفعلة).

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

  <Accordion title="Gateway proxy">
    وجه حركة WebSocket الخاصة بـ Discord gateway وعمليات بحث REST عند بدء التشغيل (معرف التطبيق + حل قائمة السماح) عبر وكيل HTTP(S) باستخدام `channels.discord.proxy`.

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
    فعل حل PluralKit لربط الرسائل الممررة بهوية عضو النظام:

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
    - تتم مطابقة أسماء عرض الأعضاء بالاسم/الاسم المختصر فقط عندما يكون `channels.discord.dangerouslyAllowNameMatching: true`
    - تستخدم عمليات البحث معرف الرسالة الأصلي وهي مقيدة بنافذة زمنية
    - إذا فشل البحث، تعامل الرسائل الممررة كرسائل بوت ويتم إسقاطها ما لم يكن `allowBots=true`

  </Accordion>

  <Accordion title="Outbound mention aliases">
    استخدم `mentionAliases` عندما تحتاج الوكلاء إلى إشارات صادرة حتمية لمستخدمي Discord المعروفين. المفاتيح هي المعرفات دون `@` البادئة؛ والقيم هي معرفات مستخدمي Discord. تترك المعرفات غير المعروفة و `@everyone` و `@here` والإشارات داخل مسافات كود Markdown دون تغيير.

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

    مثال للحالة فقط:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    مثال للنشاط (الحالة المخصصة هي نوع النشاط الافتراضي):

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

    مثال للبث:

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

    - 0: اللعب
    - 1: البث (يتطلب `activityUrl`)
    - 2: الاستماع
    - 3: المشاهدة
    - 4: مخصص (يستخدم نص النشاط كحالة؛ رمز التعبير اختياري)
    - 5: التنافس

    مثال للحضور التلقائي (إشارة صحة وقت التشغيل):

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

    يربط الحضور التلقائي توفر وقت التشغيل بحالة Discord: سليم => متصل، متدهور أو غير معروف => خامل، مستنفد أو غير متوفر => عدم الإزعاج. تجاوزات النص الاختيارية:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (يدعم عنصر نائب `{reason}`)

  </Accordion>

  <Accordion title="Approvals in Discord">
    يدعم Discord معالجة الموافقات المستندة إلى الأزرار في الرسائل المباشرة، ويمكنه اختياريا نشر مطالبات الموافقة في القناة الأصلية.

    مسار الإعداد:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختياري؛ يعود إلى `commands.ownerAllowFrom` عند الإمكان)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
    - `agentFilter`، `sessionFilter`، `cleanupAfterResolve`

    يفعّل Discord موافقات التنفيذ الأصلية تلقائيا عندما يكون `enabled` غير معيّن أو `"auto"` ويمكن حلّ موافق واحد على الأقل، إما من `execApprovals.approvers` أو من `commands.ownerAllowFrom`. لا يستنتج Discord موافقي التنفيذ من `allowFrom` الخاصة بالقناة، أو `dm.allowFrom` القديمة، أو `defaultTo` الخاصة بالرسائل المباشرة. عيّن `enabled: false` لتعطيل Discord كعميل موافقات أصلي صراحة.

    بالنسبة لأوامر المجموعات الحساسة المقتصرة على المالك، مثل `/diagnostics` و`/export-trajectory`، يرسل OpenClaw مطالبات الموافقة والنتائج النهائية بشكل خاص. يجرّب رسالة Discord المباشرة أولا عندما يكون للمالك المستدعي مسار مالك على Discord؛ وإذا لم يكن ذلك متاحا، يعود إلى أول مسار مالك متاح من `commands.ownerAllowFrom`، مثل Telegram.

    عندما تكون `target` هي `channel` أو `both`، تكون مطالبة الموافقة مرئية في القناة. يمكن للموافقين الذين تم حلّهم فقط استخدام الأزرار؛ ويتلقى المستخدمون الآخرون رفضا عابرا. تتضمن مطالبات الموافقة نص الأمر، لذلك لا تفعّل التسليم إلى القناة إلا في القنوات الموثوقة. إذا تعذّر اشتقاق معرّف القناة من مفتاح الجلسة، يعود OpenClaw إلى التسليم عبر الرسائل المباشرة.

    يعرض Discord أيضا أزرار الموافقة المشتركة التي تستخدمها قنوات الدردشة الأخرى. يضيف محوّل Discord الأصلي أساسا توجيه الرسائل المباشرة للموافقين والتوزيع إلى القنوات.
    عندما تكون تلك الأزرار موجودة، فهي تجربة الموافقة الأساسية؛ وينبغي أن يضمّن OpenClaw
    أمر `/approve` يدويا فقط عندما تقول نتيجة الأداة
    إن موافقات الدردشة غير متاحة أو إن الموافقة اليدوية هي المسار الوحيد.
    إذا لم يكن وقت تشغيل موافقات Discord الأصلية نشطا، يُبقي OpenClaw
    مطالبة `/approve <id> <decision>` المحلية والحتمية مرئية. إذا كان
    وقت التشغيل نشطا ولكن تعذّر تسليم بطاقة أصلية إلى أي هدف،
    يرسل OpenClaw إشعارا احتياطيا في الدردشة نفسها مع أمر `/approve`
    الدقيق من الموافقة المعلقة.

    تتبع مصادقة Gateway وحل الموافقات عقد عميل Gateway المشترك (تُحل معرّفات `plugin:` عبر `plugin.approval.resolve`؛ وتُحل المعرّفات الأخرى عبر `exec.approval.resolve`). تنتهي صلاحية الموافقات بعد 30 دقيقة افتراضيا.

    راجع [موافقات التنفيذ](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## الأدوات وبوابات الإجراءات

تشمل إجراءات رسائل Discord المراسلة، وإدارة القنوات، والإشراف، والحضور، وإجراءات البيانات الوصفية.

أمثلة أساسية:

- المراسلة: `sendMessage`، `readMessages`، `editMessage`، `deleteMessage`، `threadReply`
- التفاعلات: `react`، `reactions`، `emojiList`
- الإشراف: `timeout`، `kick`، `ban`
- الحضور: `setPresence`

يقبل إجراء `event-create` معامل `image` اختياريا (عنوان URL أو مسار ملف محلي) لتعيين صورة غلاف الحدث المجدول.

توجد بوابات الإجراءات ضمن `channels.discord.actions.*`.

سلوك البوابة الافتراضي:

| مجموعة الإجراءات                                                                                                                                                             | الافتراضي |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | مفعّل    |
| roles                                                                                                                                                                    | معطّل    |
| moderation                                                                                                                                                               | معطّل    |
| presence                                                                                                                                                                 | معطّل    |

## واجهة مكونات v2

يستخدم OpenClaw مكونات Discord v2 لموافقات التنفيذ وعلامات السياقات المتقاطعة. يمكن لإجراءات رسائل Discord أيضا قبول `components` لواجهة مخصصة (متقدم؛ يتطلب إنشاء حمولة مكوّن عبر أداة discord)، بينما تظل `embeds` القديمة متاحة لكنها غير موصى بها.

- يعيّن `channels.discord.ui.components.accentColor` لون التمييز المستخدم في حاويات مكوّنات Discord (hex).
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

لدى Discord سطحان صوتيان متميزان: **قنوات صوتية** فورية (محادثات مستمرة) و**مرفقات رسائل صوتية** (تنسيق معاينة الموجة). يدعم Gateway كليهما.

### القنوات الصوتية

قائمة إعداد:

1. فعّل Message Content Intent في Discord Developer Portal.
2. فعّل Server Members Intent عند استخدام قوائم السماح للأدوار/المستخدمين.
3. ادعُ الروبوت بنطاقي `bot` و`applications.commands`.
4. امنح Connect وSpeak وSend Messages وRead Message History في القناة الصوتية المستهدفة.
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

- يتجاوز `voice.tts` إعداد `messages.tts` لتشغيل الصوت فقط.
- يتجاوز `voice.model` نموذج LLM المستخدم لاستجابات قنوات Discord الصوتية فقط. اتركه غير معيّن ليرث نموذج الوكيل الموجّه.
- يستخدم STT ‏`tools.media.audio`؛ ولا يؤثر `voice.model` في النسخ.
- تنطبق تجاوزات `systemPrompt` الخاصة بكل قناة Discord على دورات نص المحادثة الصوتية لتلك القناة الصوتية.
- تستمد دورات نص المحادثة الصوتية حالة المالك من `allowFrom` الخاصة بـ Discord (أو `dm.allowFrom`)؛ ولا يمكن للمتحدثين غير المالكين الوصول إلى الأدوات المقتصرة على المالك (مثل `gateway` و`cron`).
- صوت Discord اختياري للإعدادات النصية فقط؛ عيّن `channels.discord.voice.enabled=true` (أو احتفظ بكتلة `channels.discord.voice` موجودة) لتفعيل أوامر `/vc`، ووقت تشغيل الصوت، وهدف Gateway ‏`GuildVoiceStates`.
- يمكن لـ `channels.discord.intents.voiceStates` تجاوز الاشتراك في هدف حالة الصوت صراحة. اتركه غير معيّن كي يتبع الهدف التفعيل الصوتي الفعّال.
- يمرّر `voice.daveEncryption` و`voice.decryptionFailureTolerance` إلى خيارات الانضمام في `@discordjs/voice`.
- القيم الافتراضية في `@discordjs/voice` هي `daveEncryption=true` و`decryptionFailureTolerance=24` إذا لم تكن معيّنة.
- يتحكم `voice.connectTimeoutMs` في انتظار Ready الأولي من `@discordjs/voice` لمحاولات `/vc join` والانضمام التلقائي. الافتراضي: `30000`.
- يتحكم `voice.reconnectGraceMs` في مدة انتظار OpenClaw لجلسة صوتية منقطعة كي تبدأ إعادة الاتصال قبل تدميرها. الافتراضي: `15000`.
- يراقب OpenClaw أيضا حالات فشل فك تشفير الاستقبال ويتعافى تلقائيا بمغادرة القناة الصوتية وإعادة الانضمام إليها بعد تكرار الفشل خلال نافذة قصيرة.
- إذا أظهرت سجلات الاستقبال بشكل متكرر `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` بعد التحديث، فاجمع تقرير تبعيات وسجلات. يتضمن سطر `@discordjs/voice` المضمّن إصلاح الحشو من المنبع في PR #11449 الخاصة بـ discord.js، والتي أغلقت issue #11419 الخاصة بـ discord.js.

مسار القناة الصوتية:

- يتم تحويل التقاط PCM من Discord إلى ملف WAV مؤقت.
- يتولى `tools.media.audio` معالجة STT، مثل `openai/gpt-4o-mini-transcribe`.
- يُرسل النص عبر مدخل Discord والتوجيه بينما يعمل LLM للاستجابة بسياسة إخراج صوتي تخفي أداة `tts` الخاصة بالوكيل وتطلب نصا مُعادا، لأن صوت Discord يملك تشغيل TTS النهائي.
- عند تعيين `voice.model`، فإنه يتجاوز فقط LLM للاستجابة لهذه الدورة الصوتية في القناة.
- يتم دمج `voice.tts` فوق `messages.tts`؛ ويتم تشغيل الصوت الناتج في القناة المنضم إليها.

تُحل بيانات الاعتماد لكل مكوّن: مصادقة مسار LLM لـ `voice.model`، ومصادقة STT لـ `tools.media.audio`، ومصادقة TTS لـ `messages.tts`/`voice.tts`.

### الرسائل الصوتية

تعرض رسائل Discord الصوتية معاينة موجية وتتطلب صوت OGG/Opus. ينشئ OpenClaw الموجة تلقائيا، لكنه يحتاج إلى `ffmpeg` و`ffprobe` على مضيف Gateway للفحص والتحويل.

- قدّم **مسار ملف محلي** (يتم رفض عناوين URL).
- احذف المحتوى النصي (يرفض Discord النص + الرسالة الصوتية في الحمولة نفسها).
- يُقبل أي تنسيق صوتي؛ يحوّل OpenClaw إلى OGG/Opus عند الحاجة.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="تم استخدام أهداف غير مسموحة أو لا يرى الروبوت رسائل النقابة">

    - فعّل Message Content Intent
    - فعّل Server Members Intent عندما تعتمد على حل المستخدم/العضو
    - أعد تشغيل Gateway بعد تغيير الأهداف

  </Accordion>

  <Accordion title="رسائل النقابة محظورة على نحو غير متوقع">

    - تحقق من `groupPolicy`
    - تحقق من قائمة سماح النقابة ضمن `channels.discord.guilds`
    - إذا كانت خريطة `channels` الخاصة بالنقابة موجودة، فلا يُسمح إلا بالقنوات المدرجة
    - تحقق من سلوك `requireMention` وأنماط الإشارة

    فحوص مفيدة:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="طلب الإشارة false ولكن الحظر ما زال يحدث">
    أسباب شائعة:

    - `groupPolicy="allowlist"` من دون قائمة سماح مطابقة للنقابة/القناة
    - ضبط `requireMention` في المكان الخطأ (يجب أن يكون ضمن `channels.discord.guilds` أو إدخال القناة)
    - حظر المرسل بواسطة قائمة سماح `users` الخاصة بالنقابة/القناة

  </Accordion>

  <Accordion title="دورات Discord طويلة التشغيل أو ردود مكررة">

    سجلات نموذجية:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    مفاتيح ضبط طابور Gateway الخاص بـ Discord:

    - حساب واحد: `channels.discord.eventQueue.listenerTimeout`
    - حسابات متعددة: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - يتحكم هذا فقط في عمل مستمع Gateway الخاص بـ Discord، وليس عمر دورة الوكيل

    لا يطبق Discord مهلة مملوكة للقناة على دورات الوكيل الموضوعة في الطابور. تسلّم مستمعات الرسائل العمل فورا، وتحافظ تشغيلات Discord الموضوعة في الطابور على ترتيب كل جلسة حتى تكتمل دورة حياة الجلسة/الأداة/وقت التشغيل أو تلغي العمل.

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
    يجلب OpenClaw بيانات Discord الوصفية `/gateway/bot` قبل الاتصال. تعود حالات الفشل العابرة إلى عنوان Gateway الافتراضي الخاص بـ Discord ويتم تقييدها بمعدل في السجلات.

    مفاتيح ضبط مهلة البيانات الوصفية:

    - حساب واحد: `channels.discord.gatewayInfoTimeoutMs`
    - حسابات متعددة: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - احتياطي env عندما لا يكون الإعداد معيّنا: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - الافتراضي: `30000` (30 ثانية)، الحد الأقصى: `120000`

  </Accordion>

  <Accordion title="إعادات تشغيل مهلة READY في Gateway">
    ينتظر OpenClaw حدث `READY` الخاص بـ Gateway في Discord أثناء بدء التشغيل وبعد عمليات إعادة الاتصال في وقت التشغيل. قد تحتاج إعدادات الحسابات المتعددة مع التدرج في بدء التشغيل إلى نافذة READY أطول لبدء التشغيل من الافتراضية.

    مفاتيح ضبط مهلة READY:

    - بدء التشغيل لحساب واحد: `channels.discord.gatewayReadyTimeoutMs`
    - بدء التشغيل لعدة حسابات: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - بديل بيئة بدء التشغيل عند عدم ضبط الإعداد: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - القيمة الافتراضية لبدء التشغيل: `15000` (15 ثانية)، الحد الأقصى: `120000`
    - وقت التشغيل لحساب واحد: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - وقت التشغيل لعدة حسابات: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - بديل بيئة وقت التشغيل عند عدم ضبط الإعداد: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - القيمة الافتراضية لوقت التشغيل: `30000` (30 ثانية)، الحد الأقصى: `120000`

  </Accordion>

  <Accordion title="عدم تطابق تدقيق الأذونات">
    تعمل فحوصات أذونات `channels status --probe` فقط مع معرّفات القنوات الرقمية.

    إذا كنت تستخدم مفاتيح slug، فقد تظل المطابقة في وقت التشغيل تعمل، لكن الفحص لا يستطيع التحقق من الأذونات بالكامل.

  </Accordion>

  <Accordion title="مشكلات DM والاقتران">

    - DM معطل: `channels.discord.dm.enabled=false`
    - سياسة DM معطلة: `channels.discord.dmPolicy="disabled"` (قديم: `channels.discord.dm.policy`)
    - انتظار موافقة الاقتران في وضع `pairing`

  </Accordion>

  <Accordion title="حلقات bot إلى bot">
    افتراضيًا، يتم تجاهل الرسائل المكتوبة بواسطة bots.

    إذا ضبطت `channels.discord.allowBots=true`، فاستخدم قواعد ذكر وقائمة سماح صارمة لتجنب سلوك الحلقات.
    يفضل استخدام `channels.discord.allowBots="mentions"` لقبول رسائل bot فقط عندما تذكر bot.

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

  <Accordion title="انقطاع Voice STT مع DecryptionFailed(...)">

    - أبقِ OpenClaw محدثًا (`openclaw update`) حتى يكون منطق الاسترداد الخاص باستقبال صوت Discord موجودًا
    - تأكد من `channels.discord.voice.daveEncryption=true` (افتراضي)
    - ابدأ من `channels.discord.voice.decryptionFailureTolerance=24` (افتراضي upstream) واضبطه فقط عند الحاجة
    - راقب السجلات بحثًا عن:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - إذا استمرت الإخفاقات بعد إعادة الانضمام التلقائية، فاجمع السجلات وقارنها بسجل استقبال DAVE في upstream ضمن [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) و[discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

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
- البث: `streaming` (الاسم البديل القديم: `streamMode`)، `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- الوسائط/إعادة المحاولة: `mediaMaxMb` (يحد من تحميلات Discord الصادرة، الافتراضي `100MB`)، `retry`
- الإجراءات: `actions.*`
- الحضور: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- الميزات: `threadBindings`, المستوى العلوي `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## السلامة والعمليات

- عامل رموز bot كأسرار (يفضل `DISCORD_BOT_TOKEN` في البيئات الخاضعة للإشراف).
- امنح أذونات Discord وفق مبدأ أقل صلاحية.
- إذا كانت حالة/نشر الأوامر قديمة، فأعد تشغيل Gateway وأعد الفحص باستخدام `openclaw channels status --probe`.

## ذو صلة

<CardGroup cols={2}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    إقران مستخدم Discord مع Gateway.
  </Card>
  <Card title="المجموعات" icon="users" href="/ar/channels/groups">
    سلوك دردشة المجموعة وقائمة السماح.
  </Card>
  <Card title="توجيه القنوات" icon="route" href="/ar/channels/channel-routing">
    توجيه الرسائل الواردة إلى الوكلاء.
  </Card>
  <Card title="الأمان" icon="shield" href="/ar/gateway/security">
    نموذج التهديد والتقوية.
  </Card>
  <Card title="توجيه الوكلاء المتعددين" icon="sitemap" href="/ar/concepts/multi-agent">
    ربط guilds والقنوات بالوكلاء.
  </Card>
  <Card title="أوامر Slash" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلية.
  </Card>
</CardGroup>

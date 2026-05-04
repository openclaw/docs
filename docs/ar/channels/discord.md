---
read_when:
    - العمل على ميزات قناة Discord
summary: حالة دعم بوت Discord وقدراته وتكوينه
title: Discord
x-i18n:
    generated_at: "2026-05-04T07:02:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e00f9d9b134296ac1ca52bb4058fc62ea7a95c4d46d9478648b2ecdd448652a
    source_path: channels/discord.md
    workflow: 16
---

جاهز للرسائل الخاصة وقنوات الخوادم عبر Gateway الرسمي لـ Discord.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    تعتمد رسائل Discord الخاصة وضع الاقتران افتراضيًا.
  </Card>
  <Card title="أوامر Slash" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وفهرس الأوامر.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عبر القنوات وتدفق الإصلاح.
  </Card>
</CardGroup>

## الإعداد السريع

ستحتاج إلى إنشاء تطبيق جديد مع bot، وإضافة bot إلى خادمك، وإقرانه بـ OpenClaw. نوصي بإضافة bot إلى خادمك الخاص. إذا لم يكن لديك واحد بعد، [أنشئ واحدًا أولًا](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (اختر **Create My Own > For me and my friends**).

<Steps>
  <Step title="إنشاء تطبيق Discord وbot">
    انتقل إلى [بوابة مطوري Discord](https://discord.com/developers/applications) وانقر على **New Application**. سمّه اسمًا مثل "OpenClaw".

    انقر على **Bot** في الشريط الجانبي. عيّن **Username** إلى الاسم الذي تطلقه على وكيل OpenClaw لديك.

  </Step>

  <Step title="تفعيل النوايا ذات الامتيازات">
    مع بقائك في صفحة **Bot**، مرّر لأسفل إلى **Privileged Gateway Intents** وفعّل:

    - **Message Content Intent** (مطلوب)
    - **Server Members Intent** (موصى به؛ مطلوب لقوائم السماح بالأدوار ومطابقة الاسم إلى المعرّف)
    - **Presence Intent** (اختياري؛ مطلوب فقط لتحديثات الحضور)

  </Step>

  <Step title="نسخ رمز bot الخاص بك">
    مرّر للأعلى مرة أخرى في صفحة **Bot** وانقر على **Reset Token**.

    <Note>
    على الرغم من الاسم، فإن هذا ينشئ أول رمز لك — ولا يتم "إعادة تعيين" أي شيء.
    </Note>

    انسخ الرمز واحفظه في مكان ما. هذا هو **Bot Token** الخاص بك وستحتاج إليه بعد قليل.

  </Step>

  <Step title="إنشاء عنوان URL للدعوة وإضافة bot إلى خادمك">
    انقر على **OAuth2** في الشريط الجانبي. ستنشئ عنوان URL للدعوة بالصلاحيات الصحيحة لإضافة bot إلى خادمك.

    مرّر لأسفل إلى **OAuth2 URL Generator** وفعّل:

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

    هذه هي المجموعة الأساسية لقنوات النص العادية. إذا كنت تخطط للنشر في سلاسل Discord، بما في ذلك تدفقات عمل قنوات المنتدى أو الوسائط التي تنشئ سلسلة أو تتابعها، ففعّل أيضًا **Send Messages in Threads**.
    انسخ عنوان URL المولّد في الأسفل، والصقه في متصفحك، وحدد خادمك، وانقر على **Continue** للاتصال. يجب أن ترى الآن bot الخاص بك في خادم Discord.

  </Step>

  <Step title="تفعيل وضع المطور وجمع معرّفاتك">
    في تطبيق Discord، تحتاج إلى تفعيل وضع المطور كي تتمكن من نسخ المعرّفات الداخلية.

    1. انقر على **User Settings** (أيقونة الترس بجانب صورتك الرمزية) → **Advanced** → فعّل **Developer Mode**
    2. انقر بزر الماوس الأيمن على **أيقونة الخادم** في الشريط الجانبي → **Copy Server ID**
    3. انقر بزر الماوس الأيمن على **صورتك الرمزية** → **Copy User ID**

    احفظ **Server ID** و**User ID** بجانب Bot Token الخاص بك — سترسل الثلاثة جميعًا إلى OpenClaw في الخطوة التالية.

  </Step>

  <Step title="السماح بالرسائل الخاصة من أعضاء الخادم">
    لكي يعمل الاقتران، يحتاج Discord إلى السماح لـ bot الخاص بك بإرسال رسالة خاصة إليك. انقر بزر الماوس الأيمن على **أيقونة الخادم** → **Privacy Settings** → فعّل **Direct Messages**.

    يتيح هذا لأعضاء الخادم (بما في ذلك bots) إرسال رسائل خاصة إليك. اتركه مفعّلًا إذا كنت تريد استخدام رسائل Discord الخاصة مع OpenClaw. إذا كنت تخطط لاستخدام قنوات الخادم فقط، يمكنك تعطيل الرسائل الخاصة بعد الاقتران.

  </Step>

  <Step title="تعيين رمز bot بأمان (لا ترسله في الدردشة)">
    رمز Discord bot الخاص بك سرّي (مثل كلمة المرور). عيّنه على الجهاز الذي يشغّل OpenClaw قبل مراسلة وكيلك.

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
    بالنسبة إلى تثبيتات الخدمة المُدارة، شغّل `openclaw gateway install` من shell حيث يكون `DISCORD_BOT_TOKEN` موجودًا، أو خزّن المتغير في `~/.openclaw/.env`، كي تتمكن الخدمة من حل SecretRef الخاص بالبيئة بعد إعادة التشغيل.
    إذا كان مضيفك محظورًا أو محدود المعدل بسبب بحث Discord عن تطبيق بدء التشغيل، فعيّن معرّف تطبيق/عميل Discord من بوابة المطورين حتى يتمكن بدء التشغيل من تخطي استدعاء REST ذلك. استخدم `channels.discord.applicationId` للحساب الافتراضي، أو `channels.discord.accounts.<accountId>.applicationId` عند تشغيل عدة bots لـ Discord.

  </Step>

  <Step title="تكوين OpenClaw والاقتران">

    <Tabs>
      <Tab title="اسأل وكيلك">
        تحدّث مع وكيل OpenClaw لديك على أي قناة موجودة (مثل Telegram) وأخبره. إذا كان Discord هو قناتك الأولى، فاستخدم تبويب CLI / config بدلًا من ذلك.

        > "لقد عيّنت بالفعل رمز Discord bot الخاص بي في التكوين. يُرجى إكمال إعداد Discord باستخدام User ID `<user_id>` وServer ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        إذا كنت تفضّل التكوين المستند إلى الملفات، فعيّن:

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

        بديل env للحساب الافتراضي:

```bash
DISCORD_BOT_TOKEN=...
```

        للإعداد المبرمج أو عن بُعد، اكتب كتلة JSON5 نفسها باستخدام `openclaw config patch --file ./discord.patch.json5 --dry-run` ثم أعد التشغيل بدون `--dry-run`. قيم `token` النصية الصريحة مدعومة. قيم SecretRef مدعومة أيضًا لـ `channels.discord.token` عبر موفري env/file/exec. راجع [إدارة الأسرار](/ar/gateway/secrets).

        لعدة bots لـ Discord، احتفظ بكل رمز bot ومعرّف تطبيق ضمن حسابه. يتم توريث `channels.discord.applicationId` على المستوى الأعلى بواسطة الحسابات، لذا عيّنه هناك فقط عندما يجب أن يستخدم كل حساب معرّف التطبيق نفسه.

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

  <Step title="الموافقة على أول اقتران عبر الرسائل الخاصة">
    انتظر حتى يعمل Gateway، ثم أرسل رسالة خاصة إلى bot الخاص بك في Discord. سيرد برمز اقتران.

    <Tabs>
      <Tab title="اسأل وكيلك">
        أرسل رمز الاقتران إلى وكيلك على قناتك الموجودة:

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

    يجب أن تتمكن الآن من الدردشة مع وكيلك في Discord عبر رسالة خاصة.

  </Step>
</Steps>

<Note>
حل الرموز واعٍ بالحساب. قيم رموز التكوين لها الأولوية على بديل env. يُستخدم `DISCORD_BOT_TOKEN` للحساب الافتراضي فقط.
إذا تم حل حسابين مفعّلين في Discord إلى رمز bot نفسه، يبدأ OpenClaw مراقب Gateway واحدًا فقط لذلك الرمز. الرمز القادم من التكوين له الأولوية على بديل env الافتراضي؛ وإلا يفوز أول حساب مفعّل ويُبلّغ عن تعطيل الحساب المكرر.
للاستدعاءات الصادرة المتقدمة (أداة الرسائل/إجراءات القناة)، يُستخدم `token` صريح لكل استدعاء لذلك الاستدعاء. ينطبق هذا على إجراءات الإرسال والقراءة/الفحص (مثل read/search/fetch/thread/pins/permissions). لا تزال سياسة الحساب/إعدادات إعادة المحاولة تأتي من الحساب المحدد في لقطة وقت التشغيل النشطة.
</Note>

## موصى به: إعداد مساحة عمل خادم

بعد أن تعمل الرسائل الخاصة، يمكنك إعداد خادم Discord كمساحة عمل كاملة حيث تحصل كل قناة على جلسة وكيل خاصة بها وبسياقها الخاص. يوصى بهذا للخوادم الخاصة حيث تكون أنت وbot الخاص بك فقط.

<Steps>
  <Step title="إضافة خادمك إلى قائمة سماح الخوادم">
    يتيح هذا لوكيلك الرد في أي قناة على خادمك، وليس الرسائل الخاصة فقط.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "أضف Discord Server ID الخاص بي `<server_id>` إلى قائمة سماح الخوادم"
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

  <Step title="السماح بالردود بدون @mention">
    افتراضيًا، لا يرد وكيلك في قنوات الخادم إلا عند الإشارة إليه بـ @mention. بالنسبة إلى خادم خاص، ربما تريد أن يرد على كل رسالة.

    في قنوات الخادم، تبقى الردود النهائية العادية للمساعد خاصة افتراضيًا. يجب إرسال إخراج Discord المرئي صراحةً باستخدام أداة `message`، بحيث يمكن للوكيل المراقبة بصمت افتراضيًا والنشر فقط عندما يقرر أن رد القناة مفيد.

    يعني هذا أن النموذج المحدد يجب أن يستدعي الأدوات بموثوقية. إذا أظهر Discord الكتابة وأظهرت السجلات استخدام الرموز ولكن لم تظهر رسالة منشورة، فتحقق من سجل الجلسة بحثًا عن نص المساعد مع `didSendViaMessagingTool: false`. يعني ذلك أن النموذج أنتج إجابة نهائية خاصة بدلًا من استدعاء `message(action=send)`. انتقل إلى نموذج أقوى في استدعاء الأدوات، أو استخدم التكوين أدناه لاستعادة الردود النهائية التلقائية القديمة.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "اسمح لوكيلي بالرد على هذا الخادم دون الحاجة إلى الإشارة إليه بـ @mentioned"
      </Tab>
      <Tab title="التكوين">
        عيّن `requireMention: false` في تكوين الخادم لديك:

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

        لاستعادة الردود النهائية التلقائية القديمة لغرف المجموعات/القنوات، عيّن `messages.groupChat.visibleReplies: "automatic"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="التخطيط للذاكرة في قنوات الخادم">
    افتراضيًا، لا تُحمّل الذاكرة طويلة الأمد (MEMORY.md) إلا في جلسات الرسائل الخاصة. لا تحمّل قنوات الخادم MEMORY.md تلقائيًا.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "عندما أطرح أسئلة في قنوات Discord، استخدم memory_search أو memory_get إذا كنت بحاجة إلى سياق طويل الأمد من MEMORY.md."
      </Tab>
      <Tab title="يدوي">
        إذا كنت بحاجة إلى سياق مشترك في كل قناة، فضع التعليمات الثابتة في `AGENTS.md` أو `USER.md` (يتم حقنها في كل جلسة). احتفظ بالملاحظات طويلة الأمد في `MEMORY.md` واصل إليها عند الطلب باستخدام أدوات الذاكرة.
      </Tab>
    </Tabs>

  </Step>
</Steps>

أنشئ الآن بعض القنوات على خادم Discord وابدأ الدردشة. يستطيع وكيلك رؤية اسم القناة، وتحصل كل قناة على جلستها المعزولة الخاصة — لذا يمكنك إعداد `#coding` أو `#home` أو `#research` أو ما يناسب تدفق عملك.

## نموذج وقت التشغيل

- يملك Gateway اتصال Discord.
- توجيه الردود حتمي: تعود الردود الواردة من Discord إلى Discord.
- تُضاف بيانات guild/channel الوصفية في Discord إلى موجّه النموذج كسياق غير موثوق
  وليس كبادئة رد مرئية للمستخدم. إذا نسخ النموذج ذلك الغلاف
  مرة أخرى، يزيل OpenClaw البيانات الوصفية المنسوخة من الردود الصادرة ومن
  سياق إعادة التشغيل المستقبلي.
- افتراضيًا (`session.dmScope=main`)، تشارك المحادثات المباشرة جلسة الوكيل الرئيسية (`agent:main:main`).
- تُعزل قنوات Guild في مفاتيح جلسات (`agent:<agentId>:discord:channel:<channelId>`).
- يتم تجاهل رسائل DM الجماعية افتراضيًا (`channels.discord.dm.groupEnabled=false`).
- تعمل أوامر slash الأصلية في جلسات أوامر معزولة (`agent:<agentId>:discord:slash:<userId>`)، مع الاستمرار في حمل `CommandTargetSessionKey` إلى جلسة المحادثة الموجّهة.
- يستخدم تسليم إعلانات cron/heartbeat النصية فقط إلى Discord الإجابة النهائية
  المرئية للمساعد مرة واحدة. تظل حمولات الوسائط والمكوّنات المنظمة
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

لا تقبل أصول المنتديات مكوّنات Discord. إذا كنت تحتاج إلى مكوّنات، فأرسل إلى السلسلة نفسها (`channel:<threadId>`).

## المكوّنات التفاعلية

يدعم OpenClaw حاويات مكوّنات Discord v2 لرسائل الوكيل. استخدم أداة الرسائل مع حمولة `components`. تُوجّه نتائج التفاعل إلى الوكيل مرة أخرى كرسائل واردة عادية وتتبع إعدادات Discord الحالية الخاصة بـ `replyToMode`.

الكتل المدعومة:

- `text`، `section`، `separator`، `actions`، `media-gallery`، `file`
- تسمح صفوف الإجراءات بما يصل إلى 5 أزرار أو قائمة اختيار واحدة
- أنواع الاختيار: `string`، `user`، `role`، `mentionable`، `channel`

افتراضيًا، تُستخدم المكوّنات مرة واحدة. عيّن `components.reusable=true` للسماح باستخدام الأزرار والاختيارات والنماذج عدة مرات حتى تنتهي صلاحيتها.

لتقييد من يمكنه النقر على زر، عيّن `allowedUsers` على ذلك الزر (معرّفات مستخدمي Discord أو الوسوم أو `*`). عند التهيئة، يتلقى المستخدمون غير المطابقين رفضًا مؤقتًا.

تفتح أوامر slash‏ `/model` و`/models` منتقي نماذج تفاعليًا يحتوي على قوائم منسدلة للمزوّد والنموذج وبيئة التشغيل المتوافقة، بالإضافة إلى خطوة إرسال. أصبح `/models add` مهملًا ويعيد الآن رسالة إهمال بدلًا من تسجيل النماذج من الدردشة. رد المنتقي مؤقت ولا يمكن استخدامه إلا من قبل المستخدم الذي استدعاه.

مرفقات الملفات:

- يجب أن تشير كتل `file` إلى مرجع مرفق (`attachment://<filename>`)
- وفّر المرفق عبر `media`/`path`/`filePath` (ملف واحد)؛ استخدم `media-gallery` لعدة ملفات
- استخدم `filename` لتجاوز اسم الرفع عندما يجب أن يطابق مرجع المرفق

النماذج المنبثقة:

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
    يتحكم `channels.discord.dmPolicy` في الوصول عبر DM. تُعد `channels.discord.allowFrom` قائمة السماح الأساسية لرسائل DM.

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن تتضمن `channels.discord.allowFrom` القيمة `"*"`)
    - `disabled`

    إذا لم تكن سياسة DM مفتوحة، يُحظر المستخدمون غير المعروفين (أو يُطلب منهم الاقتران في وضع `pairing`).

    أسبقية الحسابات المتعددة:

    - ينطبق `channels.discord.accounts.default.allowFrom` على الحساب `default` فقط.
    - بالنسبة إلى حساب واحد، تكون لـ `allowFrom` أسبقية على `dm.allowFrom` القديم.
    - ترث الحسابات المسماة `channels.discord.allowFrom` عندما لا تكون `allowFrom` الخاصة بها و`dm.allowFrom` القديم معيّنين.
    - لا ترث الحسابات المسماة `channels.discord.accounts.default.allowFrom`.

    لا يزال `channels.discord.dm.policy` و`channels.discord.dm.allowFrom` القديمان يُقرآن للتوافق. ينقلهما `openclaw doctor --fix` إلى `dmPolicy` و`allowFrom` عندما يمكنه فعل ذلك دون تغيير الوصول.

    تنسيق هدف DM للتسليم:

    - `user:<id>`
    - ذكر `<@id>`

    تُحلّ المعرّفات الرقمية المجردة عادةً كمعرّفات قنوات عندما يكون افتراضي قناة نشطًا، لكن المعرّفات المدرجة في `allowFrom` الفعالة لرسائل DM في الحساب تُعامل كأهداف DM للمستخدمين من أجل التوافق.

  </Tab>

  <Tab title="DM access groups">
    يمكن لرسائل DM في Discord استخدام إدخالات `accessGroup:<name>` ديناميكية في `channels.discord.allowFrom`.

    تُشارك أسماء مجموعات الوصول عبر قنوات الرسائل. استخدم `type: "message.senders"` لمجموعة ثابتة يُعبّر عن أعضائها بصيغة `allowFrom` العادية لكل قناة، أو `type: "discord.channelAudience"` عندما يجب أن يحدد جمهور `ViewChannel` الحالي لقناة Discord العضوية ديناميكيًا. سلوك مجموعات الوصول المشتركة موثق هنا: [مجموعات الوصول](/ar/channels/access-groups).

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

    لا تملك قناة Discord النصية قائمة أعضاء منفصلة. يمثّل `type: "discord.channelAudience"` العضوية على النحو التالي: مرسل DM عضو في Guild المهيأ ولديه حاليًا إذن `ViewChannel` فعّال على القناة المهيأة بعد تطبيق أدوار القناة وتجاوزاتها.

    مثال: السماح لأي شخص يستطيع رؤية `#maintainers` بإرسال DM إلى الروبوت، مع إبقاء رسائل DM مغلقة أمام الجميع.

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

    تفشل عمليات البحث على نحو مغلق. إذا أعاد Discord القيمة `Missing Access`، أو فشل البحث عن العضو، أو كانت القناة تابعة لـ Guild مختلفة، يُعامل مرسل DM على أنه غير مصرّح له.

    فعّل **Server Members Intent** في بوابة مطوري Discord للروبوت عند استخدام مجموعات الوصول المستندة إلى جمهور القناة. لا تتضمن رسائل DM حالة عضو Guild، لذلك يحل OpenClaw العضو عبر Discord REST وقت التفويض.

  </Tab>

  <Tab title="Guild policy">
    يتم التحكم في معالجة Guild بواسطة `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    خط الأساس الآمن عند وجود `channels.discord` هو `allowlist`.

    سلوك `allowlist`:

    - يجب أن تطابق Guild‏ `channels.discord.guilds` (يُفضّل `id`، ويُقبل الاسم المختصر)
    - قوائم سماح اختيارية للمرسلين: `users` (يوصى بالمعرّفات الثابتة) و`roles` (معرّفات الأدوار فقط)؛ إذا تمت تهيئة أي منهما، يُسمح للمرسلين عندما يطابقون `users` أو `roles`
    - مطابقة الاسم/الوسم مباشرةً معطلة افتراضيًا؛ فعّل `channels.discord.dangerouslyAllowNameMatching: true` فقط كوضع توافق للطوارئ
    - الأسماء/الوسوم مدعومة في `users`، لكن المعرّفات أكثر أمانًا؛ يحذر `openclaw security audit` عند استخدام إدخالات الاسم/الوسم
    - إذا كانت Guild تحتوي على `channels` مهيأة، تُرفض القنوات غير المدرجة
    - إذا لم تكن Guild تحتوي على كتلة `channels`، فيُسمح بجميع القنوات في تلك Guild المدرجة في قائمة السماح

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

    إذا عيّنت `DISCORD_BOT_TOKEN` فقط ولم تنشئ كتلة `channels.discord`، يكون احتياطي وقت التشغيل هو `groupPolicy="allowlist"` (مع تحذير في السجلات)، حتى إذا كانت `channels.defaults.groupPolicy` هي `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    تُقيّد رسائل Guild بالذكر افتراضيًا.

    يشمل اكتشاف الذكر:

    - ذكر الروبوت صراحةً
    - أنماط الذكر المهيأة (`agents.list[].groupChat.mentionPatterns`، والاحتياطي `messages.groupChat.mentionPatterns`)
    - سلوك الرد الضمني على الروبوت في الحالات المدعومة

    عند كتابة رسائل Discord الصادرة، استخدم صيغة الذكر الأساسية: `<@USER_ID>` للمستخدمين، و`<#CHANNEL_ID>` للقنوات، و`<@&ROLE_ID>` للأدوار. لا تستخدم صيغة ذكر اللقب القديمة `<@!USER_ID>`.

    تتم تهيئة `requireMention` لكل Guild/قناة (`channels.discord.guilds...`).
    يُسقط `ignoreOtherMentions` اختياريًا الرسائل التي تذكر مستخدمًا/دورًا آخر لكن لا تذكر الروبوت (باستثناء @everyone/@here).

    رسائل DM الجماعية:

    - الافتراضي: يتم تجاهلها (`dm.groupEnabled=false`)
    - قائمة سماح اختيارية عبر `dm.groupChannels` (معرّفات القنوات أو الأسماء المختصرة)

  </Tab>
</Tabs>

### توجيه الوكيل المستند إلى الدور

استخدم `bindings[].match.roles` لتوجيه أعضاء Discord Guild إلى وكلاء مختلفين حسب معرّف الدور. لا تقبل الارتباطات المستندة إلى الدور إلا معرّفات الأدوار، وتُقيّم بعد ارتباطات الند أو الند الأصل وقبل ارتباطات Guild فقط. إذا عيّن ارتباط أيضًا حقول مطابقة أخرى (مثل `peer` + `guildId` + `roles`)، فيجب أن تطابق جميع الحقول المهيأة.

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

- يتم تعيين `commands.native` افتراضياً إلى `"auto"` ويكون مفعلاً لـ Discord.
- التجاوز لكل قناة: `channels.discord.commands.native`.
- يؤدي `commands.native=false` إلى تخطي تسجيل أوامر الشرطة المائلة في Discord وتنظيفها أثناء بدء التشغيل. قد تظل الأوامر المسجلة سابقاً مرئية في Discord إلى أن تزيلها من تطبيق Discord.
- يستخدم تفويض الأوامر الأصلية قوائم السماح/السياسات نفسها الخاصة بـ Discord مثل معالجة الرسائل العادية.
- قد تظل الأوامر مرئية في واجهة Discord للمستخدمين غير المصرح لهم؛ ومع ذلك يظل التنفيذ يفرض تفويض OpenClaw ويعيد "غير مصرح".

راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands) للاطلاع على كتالوج الأوامر وسلوكها.

إعدادات أوامر الشرطة المائلة الافتراضية:

- `ephemeral: true`

## تفاصيل الميزة

<AccordionGroup>
  <Accordion title="وسوم الردود والردود الأصلية">
    يدعم Discord وسوم الرد في مخرجات الوكيل:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    يتم التحكم فيه بواسطة `channels.discord.replyToMode`:

    - `off` (افتراضي)
    - `first`
    - `all`
    - `batched`

    ملاحظة: يعطل `off` تسلسل الردود الضمني. تظل وسوم `[[reply_to_*]]` الصريحة معتمدة.
    يرفق `first` دائماً مرجع الرد الأصلي الضمني بأول رسالة Discord صادرة للدور.
    يرفق `batched` مرجع الرد الأصلي الضمني الخاص بـ Discord فقط عندما يكون
    الدور الوارد دفعة مؤجلة من رسائل متعددة. يكون هذا مفيداً
    عندما تريد الردود الأصلية أساساً للمحادثات المتدفقة الملتبسة، وليس لكل
    دور ذي رسالة واحدة.

    تُعرض معرّفات الرسائل في السياق/السجل حتى تتمكن الوكلاء من استهداف رسائل محددة.

  </Accordion>

  <Accordion title="معاينة البث المباشر">
    يمكن لـ OpenClaw بث مسودات الردود عبر إرسال رسالة مؤقتة وتعديلها مع وصول النص. يأخذ `channels.discord.streaming` القيم `off` (افتراضي) | `partial` | `block` | `progress`. يحتفظ `progress` بمسودة حالة واحدة قابلة للتعديل ويحدّثها بتقدم الأدوات حتى التسليم النهائي؛ `streamMode` اسم مستعار قديم ويُرحّل تلقائياً.

    يظل الافتراضي `off` لأن تعديلات معاينة Discord تصل إلى حدود المعدل بسرعة عندما تشترك عدة روبوتات أو Gateways في حساب واحد.

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

    - يعدّل `partial` رسالة معاينة واحدة مع وصول الرموز.
    - يصدر `block` أجزاء بحجم المسودة (استخدم `draftChunk` لضبط الحجم ونقاط الفصل، مع تقييدها بـ `textChunkLimit`).
    - تلغي النهايات الخاصة بالوسائط والأخطاء والردود الصريحة تعديلات المعاينة المعلقة.
    - يتحكم `streaming.preview.toolProgress` (افتراضي `true`) فيما إذا كانت تحديثات الأداة/التقدم تعيد استخدام رسالة المعاينة.
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

  <Accordion title="السجل والسياق وسلوك السلاسل">
    سياق سجل الخادم:

    - الافتراضي `channels.discord.historyLimit` هو `20`
    - الاحتياطي: `messages.groupChat.historyLimit`
    - يعطل `0` ذلك

    عناصر التحكم في سجل الرسائل الخاصة:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    سلوك السلاسل:

    - تُوجّه سلاسل Discord كجلسات قناة وترث إعدادات القناة الأصلية ما لم يتم تجاوزها.
    - ترث جلسات السلاسل اختيار `/model` على مستوى جلسة القناة الأصلية كاحتياطي للنموذج فقط؛ تظل اختيارات `/model` المحلية للسلسلة ذات أولوية ولا يُنسخ سجل النص الأصلي إلا إذا كان توريث النص مفعلاً.
    - يختار `channels.discord.thread.inheritParent` (افتراضي `false`) السلاسل التلقائية الجديدة للبذر من نص القناة الأصلية. توجد التجاوزات لكل حساب ضمن `channels.discord.accounts.<id>.thread.inheritParent`.
    - يمكن لتفاعلات أداة الرسائل حل أهداف الرسائل الخاصة `user:<id>`.
    - يتم الحفاظ على `guilds.<guild>.channels.<channel>.requireMention: false` أثناء احتياطي تفعيل مرحلة الرد.

    تُحقن مواضيع القناة كسياق **غير موثوق**. تضبط قوائم السماح من يمكنه تشغيل الوكيل، لكنها ليست حد تنقيح كاملاً للسياق التكميلي.

  </Accordion>

  <Accordion title="جلسات مرتبطة بالسلاسل للوكلاء الفرعيين">
    يمكن لـ Discord ربط سلسلة بهدف جلسة حتى تستمر رسائل المتابعة في تلك السلسلة في التوجيه إلى الجلسة نفسها (بما في ذلك جلسات الوكلاء الفرعيين).

    الأوامر:

    - `/focus <target>` اربط السلسلة الحالية/الجديدة بهدف وكيل فرعي/جلسة
    - `/unfocus` أزل ربط السلسلة الحالية
    - `/agents` اعرض التشغيلات النشطة وحالة الربط
    - `/session idle <duration|off>` افحص/حدّث إلغاء التركيز التلقائي بسبب عدم النشاط للروابط المركزة
    - `/session max-age <duration|off>` افحص/حدّث الحد الأقصى الصلب للعمر للروابط المركزة

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

    - يضبط `session.threadBindings.*` الافتراضيات العامة.
    - يتجاوز `channels.discord.threadBindings.*` سلوك Discord.
    - يتحكم `spawnSessions` في إنشاء/ربط السلاسل تلقائياً لـ `sessions_spawn({ thread: true })` وعمليات توليد سلاسل ACP. الافتراضي: `true`.
    - يتحكم `defaultSpawnContext` في سياق الوكيل الفرعي الأصلي لعمليات التوليد المرتبطة بالسلاسل. الافتراضي: `"fork"`.
    - تُرحّل مفاتيح `spawnSubagentSessions`/`spawnAcpSessions` المهملة بواسطة `openclaw doctor --fix`.
    - إذا كانت روابط السلاسل معطلة لحساب، فلن تكون `/focus` وعمليات ربط السلاسل ذات الصلة متاحة.

    راجع [الوكلاء الفرعيون](/ar/tools/subagents) و[وكلاء ACP](/ar/tools/acp-agents) و[مرجع الإعدادات](/ar/gateway/configuration-reference).

  </Accordion>

  <Accordion title="روابط قنوات ACP المستمرة">
    لمساحات عمل ACP المستقرة "الدائمة التشغيل"، اضبط روابط ACP المtyped في المستوى الأعلى التي تستهدف محادثات Discord.

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
    - في قناة أو سلسلة مربوطة، يعيد `/new` و`/reset` ضبط جلسة ACP نفسها في مكانها. يمكن لروابط السلاسل المؤقتة تجاوز حل الهدف أثناء نشاطها.
    - يتحكم `spawnSessions` في إنشاء/ربط السلاسل الفرعية عبر `--thread auto|here`.

    راجع [وكلاء ACP](/ar/tools/acp-agents) لتفاصيل سلوك الربط.

  </Accordion>

  <Accordion title="إشعارات التفاعل">
    وضع إشعار التفاعل لكل خادم:

    - `off`
    - `own` (افتراضي)
    - `all`
    - `allowlist` (يستخدم `guilds.<id>.users`)

    تتحول أحداث التفاعل إلى أحداث نظام وتُرفق بجلسة Discord الموجّهة.

  </Accordion>

  <Accordion title="تفاعلات الإقرار">
    يرسل `ackReaction` رمزاً تعبيرياً للإقرار أثناء معالجة OpenClaw لرسالة واردة.

    ترتيب الحل:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - احتياطي رمز تعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يقبل Discord الرموز التعبيرية unicode أو أسماء الرموز التعبيرية المخصصة.
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="كتابات الإعدادات">
    كتابات الإعدادات التي تبدأها القناة مفعلة افتراضياً.

    يؤثر هذا في تدفقات `/config set|unset` (عند تفعيل ميزات الأوامر).

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
    وجّه حركة WebSocket الخاصة بـ Discord gateway وعمليات بحث REST عند بدء التشغيل (معرّف التطبيق + حل قائمة السماح) عبر وكيل HTTP(S) باستخدام `channels.discord.proxy`.

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
    فعّل حل PluralKit لتعيين الرسائل الموكلة إلى هوية عضو النظام:

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
    - تُطابق أسماء عرض الأعضاء بالاسم/المعرّف اللطيف فقط عندما يكون `channels.discord.dangerouslyAllowNameMatching: true`
    - تستخدم عمليات البحث معرّف الرسالة الأصلي وتكون مقيّدة بنافذة زمنية
    - إذا فشل البحث، تُعامل الرسائل الموكلة كرسائل روبوت وتُسقط ما لم يكن `allowBots=true`

  </Accordion>

  <Accordion title="أسماء مستعارة للإشارات الصادرة">
    استخدم `mentionAliases` عندما تحتاج الوكلاء إلى إشارات صادرة حتمية لمستخدمي Discord المعروفين. المفاتيح هي مقابض دون `@` في البداية؛ والقيم هي معرّفات مستخدمي Discord. تترك المقابض غير المعروفة و`@everyone` و`@here` والإشارات داخل مقاطع كود Markdown دون تغيير.

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
    تُطبّق تحديثات الحضور عندما تضبط حقل حالة أو نشاطاً، أو عندما تفعّل الحضور التلقائي.

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

    - 0: اللعب
    - 1: البث (يتطلب `activityUrl`)
    - 2: الاستماع
    - 3: المشاهدة
    - 4: مخصص (يستخدم نص النشاط كحالة الحالة؛ الرمز التعبيري اختياري)
    - 5: المنافسة

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

    تربط ميزة الحضور التلقائي توفر وقت التشغيل بحالة Discord: healthy => online، degraded أو unknown => idle، exhausted أو unavailable => dnd. تجاوزات النص الاختيارية:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (يدعم العنصر النائب `{reason}`)

  </Accordion>

  <Accordion title="الموافقات في Discord">
    يدعم Discord معالجة الموافقات القائمة على الأزرار في الرسائل المباشرة، ويمكنه اختياريا نشر مطالبات الموافقة في القناة الأصلية.

    مسار الإعدادات:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختياري؛ يعود إلى `commands.ownerAllowFrom` عندما يكون ذلك ممكنا)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
    - `agentFilter`، `sessionFilter`، `cleanupAfterResolve`

    يفعّل Discord موافقات التنفيذ الأصلية تلقائيا عندما لا تكون `enabled` معيّنة أو تكون `"auto"` ويمكن حل معتمد واحد على الأقل، إما من `execApprovals.approvers` أو من `commands.ownerAllowFrom`. لا يستنتج Discord معتمدي التنفيذ من `allowFrom` الخاصة بالقناة، أو `dm.allowFrom` القديمة، أو `defaultTo` الخاصة بالرسائل المباشرة. عيّن `enabled: false` لتعطيل Discord صراحة كعميل موافقات أصلي.

    بالنسبة إلى أوامر المجموعات الحساسة الخاصة بالمالك فقط مثل `/diagnostics` و`/export-trajectory`، يرسل OpenClaw مطالبات الموافقة والنتائج النهائية بشكل خاص. يحاول استخدام رسالة Discord مباشرة أولا عندما يملك المالك المستدعي مسار مالك في Discord؛ وإذا لم يكن ذلك متاحا، فإنه يعود إلى أول مسار مالك متاح من `commands.ownerAllowFrom`، مثل Telegram.

    عندما تكون `target` هي `channel` أو `both`، تظهر مطالبة الموافقة في القناة. لا يمكن استخدام الأزرار إلا للمعتمدين الذين تم حلهم؛ ويتلقى المستخدمون الآخرون رفضا مؤقتا. تتضمن مطالبات الموافقة نص الأمر، لذلك لا تفعّل التسليم إلى القناة إلا في القنوات الموثوقة. إذا تعذر اشتقاق معرّف القناة من مفتاح الجلسة، يعود OpenClaw إلى التسليم عبر الرسائل المباشرة.

    يعرض Discord أيضا أزرار الموافقة المشتركة التي تستخدمها قنوات الدردشة الأخرى. يضيف محوّل Discord الأصلي أساسا توجيه الرسائل المباشرة للمعتمدين والتوزيع إلى القنوات.
    عندما تكون هذه الأزرار موجودة، تكون هي تجربة الموافقة الأساسية؛ ويجب على OpenClaw
    تضمين أمر `/approve` يدوي فقط عندما تشير نتيجة الأداة إلى
    أن موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.
    إذا لم يكن وقت تشغيل الموافقات الأصلي في Discord نشطا، يبقي OpenClaw
    مطالبة `/approve <id> <decision>` المحلية الحتمية ظاهرة. إذا كان
    وقت التشغيل نشطا لكن تعذر تسليم بطاقة أصلية إلى أي هدف،
    يرسل OpenClaw إشعارا احتياطيا في الدردشة نفسها يتضمن أمر `/approve`
    الدقيق من الموافقة المعلقة.

    تتبع مصادقة Gateway وحل الموافقات عقد عميل Gateway المشترك (يتم حل معرّفات `plugin:` عبر `plugin.approval.resolve`؛ والمعرّفات الأخرى عبر `exec.approval.resolve`). تنتهي صلاحية الموافقات بعد 30 دقيقة افتراضيا.

    راجع [موافقات التنفيذ](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## الأدوات وبوابات الإجراءات

تتضمن إجراءات رسائل Discord المراسلة، وإدارة القنوات، والإشراف، والحضور، وإجراءات البيانات الوصفية.

أمثلة أساسية:

- المراسلة: `sendMessage`، `readMessages`، `editMessage`، `deleteMessage`، `threadReply`
- التفاعلات: `react`، `reactions`، `emojiList`
- الإشراف: `timeout`، `kick`، `ban`
- الحضور: `setPresence`

يقبل إجراء `event-create` معاملا اختياريا هو `image` (URL أو مسار ملف محلي) لتعيين صورة غلاف الحدث المجدول.

توجد بوابات الإجراءات ضمن `channels.discord.actions.*`.

سلوك البوابة الافتراضي:

| مجموعة الإجراءات                                                                                                                                                             | الافتراضي  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | مفعّل  |
| roles                                                                                                                                                                    | معطّل |
| moderation                                                                                                                                                               | معطّل |
| presence                                                                                                                                                                 | معطّل |

## واجهة مكونات v2

يستخدم OpenClaw مكونات Discord v2 لموافقات التنفيذ وعلامات السياقات المتقاطعة. يمكن لإجراءات رسائل Discord أيضا قبول `components` لواجهة مستخدم مخصصة (متقدم؛ يتطلب إنشاء حمولة مكونات عبر أداة discord)، بينما تظل `embeds` القديمة متاحة لكنها غير موصى بها.

- يعيّن `channels.discord.ui.components.accentColor` لون التمييز المستخدم بواسطة حاويات مكونات Discord (hex).
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

قائمة إعداد:

1. فعّل Message Content Intent في Discord Developer Portal.
2. فعّل Server Members Intent عند استخدام قوائم السماح للأدوار/المستخدمين.
3. ادعُ البوت بنطاقي `bot` و`applications.commands`.
4. امنح Connect وSpeak وSend Messages وRead Message History في قناة الصوت الهدف.
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
- يتجاوز `voice.model` نموذج LLM المستخدم لردود قناة صوت Discord فقط. اتركه غير معيّن ليرث نموذج الوكيل الموجّه.
- يستخدم STT `tools.media.audio`؛ ولا يؤثر `voice.model` في النسخ.
- تنطبق تجاوزات `systemPrompt` الخاصة بكل قناة Discord على أدوار نص جلسة الصوت لتلك القناة الصوتية.
- تستمد أدوار نص جلسة الصوت حالة المالك من `allowFrom` الخاصة بـ Discord (أو `dm.allowFrom`)؛ ولا يمكن للمتحدثين غير المالكين الوصول إلى الأدوات الخاصة بالمالك فقط (على سبيل المثال `gateway` و`cron`).
- صوت Discord اختياري للإعدادات النصية فقط؛ عيّن `channels.discord.voice.enabled=true` (أو أبقِ كتلة `channels.discord.voice` موجودة) لتفعيل أوامر `/vc` ووقت تشغيل الصوت وهدف Gateway `GuildVoiceStates`.
- يمكن لـ `channels.discord.intents.voiceStates` تجاوز الاشتراك في هدف حالة الصوت صراحة. اتركه غير معيّن لكي يتبع الهدف التفعيل الفعلي للصوت.
- يتم تمرير `voice.daveEncryption` و`voice.decryptionFailureTolerance` إلى خيارات الانضمام في `@discordjs/voice`.
- افتراضات `@discordjs/voice` هي `daveEncryption=true` و`decryptionFailureTolerance=24` إذا لم تكن معيّنة.
- يتحكم `voice.connectTimeoutMs` في انتظار Ready الأولي في `@discordjs/voice` لمحاولات `/vc join` والانضمام التلقائي. الافتراضي: `30000`.
- يتحكم `voice.reconnectGraceMs` في مدة انتظار OpenClaw لجلسة صوت منقطعة حتى تبدأ إعادة الاتصال قبل تدميرها. الافتراضي: `15000`.
- يراقب OpenClaw أيضا إخفاقات فك تشفير الاستقبال ويتعافى تلقائيا عبر مغادرة قناة الصوت وإعادة الانضمام إليها بعد إخفاقات متكررة ضمن نافذة قصيرة.
- إذا أظهرت سجلات الاستقبال مرارا `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` بعد التحديث، فاجمع تقرير تبعيات وسجلات. يتضمن مسار `@discordjs/voice` المضمّن إصلاح الحشو من المنبع من PR #11449 في discord.js، الذي أغلق issue #11419 في discord.js.

مسار قناة الصوت:

- يتم تحويل التقاط PCM من Discord إلى ملف WAV مؤقت.
- يتولى `tools.media.audio` معالجة STT، على سبيل المثال `openai/gpt-4o-mini-transcribe`.
- يتم إرسال النص عبر دخول Discord والتوجيه بينما يعمل نموذج LLM للرد بسياسة إخراج صوتي تخفي أداة `tts` الخاصة بالوكيل وتطلب نصا معادا، لأن صوت Discord يملك تشغيل TTS النهائي.
- يتجاوز `voice.model`، عند تعيينه، نموذج LLM للرد فقط في دور قناة الصوت هذا.
- يتم دمج `voice.tts` فوق `messages.tts`؛ ويتم تشغيل الصوت الناتج في القناة المنضم إليها.

تُحل بيانات الاعتماد لكل مكوّن: مصادقة مسار LLM لـ `voice.model`، ومصادقة STT لـ `tools.media.audio`، ومصادقة TTS لـ `messages.tts`/`voice.tts`.

### الرسائل الصوتية

تعرض رسائل Discord الصوتية معاينة موجة وتتطلب صوت OGG/Opus. ينشئ OpenClaw الموجة تلقائيا، لكنه يحتاج إلى `ffmpeg` و`ffprobe` على مضيف Gateway للفحص والتحويل.

- وفّر **مسار ملف محلي** (يتم رفض عناوين URL).
- احذف محتوى النص (يرفض Discord النص + الرسالة الصوتية في الحمولة نفسها).
- يتم قبول أي تنسيق صوتي؛ يحوّل OpenClaw إلى OGG/Opus عند الحاجة.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="تم استخدام أهداف غير مسموح بها أو لا يرى البوت رسائل النقابة">

    - فعّل Message Content Intent
    - فعّل Server Members Intent عندما تعتمد على حل المستخدم/العضو
    - أعد تشغيل Gateway بعد تغيير الأهداف

  </Accordion>

  <Accordion title="تم حظر رسائل النقابة بشكل غير متوقع">

    - تحقق من `groupPolicy`
    - تحقق من قائمة السماح للنقابة ضمن `channels.discord.guilds`
    - إذا كانت خريطة `channels` الخاصة بالنقابة موجودة، فلا يُسمح إلا بالقنوات المدرجة
    - تحقق من سلوك `requireMention` وأنماط الإشارة

    فحوصات مفيدة:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="الإشارة المطلوبة false لكن ما زال الحظر قائما">
    أسباب شائعة:

    - `groupPolicy="allowlist"` من دون قائمة سماح مطابقة للنقابة/القناة
    - تم ضبط `requireMention` في المكان الخطأ (يجب أن يكون ضمن `channels.discord.guilds` أو إدخال القناة)
    - تم حظر المرسل بواسطة قائمة سماح `users` الخاصة بالنقابة/القناة

  </Accordion>

  <Accordion title="أدوار Discord طويلة التشغيل أو ردود مكررة">

    سجلات نموذجية:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    مقابض ضبط صف Gateway في Discord:

    - حساب واحد: `channels.discord.eventQueue.listenerTimeout`
    - عدة حسابات: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - يتحكم هذا فقط في عمل مستمع Gateway في Discord، وليس عمر دور الوكيل

    لا يطبق Discord مهلة مملوكة للقناة على أدوار الوكيل الموضوعة في الصف. تسلم مستمعات الرسائل العمل فورا، وتحافظ عمليات تشغيل Discord الموضوعة في الصف على ترتيب كل جلسة حتى تكتمل دورة حياة الجلسة/الأداة/وقت التشغيل أو يتم إيقاف العمل.

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
    يجلب OpenClaw بيانات Discord `/gateway/bot` الوصفية قبل الاتصال. تعود حالات الفشل العابرة إلى عنوان URL الافتراضي لـ Gateway الخاص بـ Discord، وتكون محدودة المعدل في السجلات.

    إعدادات مهلة البيانات الوصفية:

    - الحساب الفردي: `channels.discord.gatewayInfoTimeoutMs`
    - الحسابات المتعددة: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - احتياطي البيئة عند عدم ضبط التكوين: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - الافتراضي: `30000` (30 ثانية)، الحد الأقصى: `120000`

  </Accordion>

  <Accordion title="إعادات التشغيل بسبب انتهاء مهلة READY في Gateway">
    ينتظر OpenClaw حدث `READY` من Gateway الخاص بـ Discord أثناء بدء التشغيل وبعد عمليات إعادة الاتصال في وقت التشغيل. قد تحتاج إعدادات الحسابات المتعددة مع تدرج بدء التشغيل إلى نافذة READY أطول عند بدء التشغيل من الافتراضي.

    إعدادات مهلة READY:

    - بدء التشغيل للحساب الفردي: `channels.discord.gatewayReadyTimeoutMs`
    - بدء التشغيل للحسابات المتعددة: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - احتياطي بيئة بدء التشغيل عند عدم ضبط التكوين: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - افتراضي بدء التشغيل: `15000` (15 ثانية)، الحد الأقصى: `120000`
    - وقت التشغيل للحساب الفردي: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - وقت التشغيل للحسابات المتعددة: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - احتياطي بيئة وقت التشغيل عند عدم ضبط التكوين: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - افتراضي وقت التشغيل: `30000` (30 ثانية)، الحد الأقصى: `120000`

  </Accordion>

  <Accordion title="عدم تطابق تدقيق الأذونات">
    تعمل فحوصات أذونات `channels status --probe` فقط مع معرّفات القنوات الرقمية.

    إذا كنت تستخدم مفاتيح slug، فقد تظل المطابقة في وقت التشغيل تعمل، لكن probe لا يستطيع التحقق الكامل من الأذونات.

  </Accordion>

  <Accordion title="مشكلات الرسائل المباشرة والإقران">

    - الرسائل المباشرة معطلة: `channels.discord.dm.enabled=false`
    - سياسة الرسائل المباشرة معطلة: `channels.discord.dmPolicy="disabled"` (قديم: `channels.discord.dm.policy`)
    - انتظار موافقة الإقران في وضع `pairing`

  </Accordion>

  <Accordion title="حلقات bot إلى bot">
    افتراضيًا، يتم تجاهل الرسائل التي يكتبها bot.

    إذا ضبطت `channels.discord.allowBots=true`، فاستخدم قواعد إشارات وقوائم سماح صارمة لتجنب سلوك الحلقات.
    فضّل `channels.discord.allowBots="mentions"` لقبول رسائل bot التي تشير إلى bot فقط.

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

  <Accordion title="انقطاع STT الصوتي مع DecryptionFailed(...)">

    - أبقِ OpenClaw محدّثًا (`openclaw update`) حتى يكون منطق استرداد استقبال صوت Discord موجودًا
    - تأكد من `channels.discord.voice.daveEncryption=true` (افتراضي)
    - ابدأ من `channels.discord.voice.decryptionFailureTolerance=24` (افتراضي upstream) واضبطه فقط عند الحاجة
    - راقب السجلات بحثًا عن:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - إذا استمرت حالات الفشل بعد إعادة الانضمام التلقائية، فاجمع السجلات وقارنها بسجل استقبال DAVE في upstream ضمن [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) و[discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## مرجع التكوين

المرجع الأساسي: [مرجع التكوين - Discord](/ar/gateway/config-channels#discord).

<Accordion title="حقول Discord عالية الإشارة">

- بدء التشغيل/المصادقة: `enabled`, `token`, `accounts.*`, `allowBots`
- السياسة: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- الأمر: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- قائمة انتظار الأحداث: `eventQueue.listenerTimeout` (ميزانية المستمع)، `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- الرد/السجل: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- التسليم: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- البث: `streaming` (اسم مستعار قديم: `streamMode`)، `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- الوسائط/إعادة المحاولة: `mediaMaxMb` (يحد من عمليات رفع Discord الصادرة، الافتراضي `100MB`)، `retry`
- الإجراءات: `actions.*`
- الحضور: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- الميزات: `threadBindings`، `bindings[]` على المستوى الأعلى (`type: "acp"`)، `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## السلامة والتشغيل

- تعامل مع رموز bot كأسرار (يُفضّل `DISCORD_BOT_TOKEN` في البيئات الخاضعة للإشراف).
- امنح أذونات Discord وفق مبدأ أقل امتياز.
- إذا كانت حالة نشر/أوامر الأوامر قديمة، فأعد تشغيل Gateway وتحقق مجددًا باستخدام `openclaw channels status --probe`.

## ذات صلة

<CardGroup cols={2}>
  <Card title="الإقران" icon="link" href="/ar/channels/pairing">
    اربط مستخدم Discord بـ Gateway.
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
    اربط guilds والقنوات بالوكلاء.
  </Card>
  <Card title="أوامر Slash" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلية.
  </Card>
</CardGroup>

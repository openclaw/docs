---
read_when:
    - جارٍ العمل على ميزات قناة Discord
summary: حالة دعم روبوت Discord وإمكاناته وتكوينه
title: Discord
x-i18n:
    generated_at: "2026-05-02T20:41:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 42223982a8bfd288d29a1f402b37141557718a407537011956b878b91b894e62
    source_path: channels/discord.md
    workflow: 16
---

جاهز للرسائل المباشرة وقنوات الخوادم عبر Gateway الرسمي لـ Discord.

<CardGroup cols={3}>
  <Card title="الإقران" icon="link" href="/ar/channels/pairing">
    تنتقل الرسائل المباشرة في Discord افتراضياً إلى وضع الإقران.
  </Card>
  <Card title="أوامر Slash" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وفهرس الأوامر.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات متعددة القنوات ومسار الإصلاح.
  </Card>
</CardGroup>

## الإعداد السريع

ستحتاج إلى إنشاء تطبيق جديد مع بوت، وإضافة البوت إلى خادمك، وإقرانه بـ OpenClaw. نوصي بإضافة البوت إلى خادمك الخاص. إذا لم يكن لديك خادم بعد، [أنشئ واحداً أولاً](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (اختر **Create My Own > For me and my friends**).

<Steps>
  <Step title="إنشاء تطبيق وبوت في Discord">
    انتقل إلى [بوابة مطوري Discord](https://discord.com/developers/applications) وانقر على **New Application**. سمّه شيئاً مثل "OpenClaw".

    انقر على **Bot** في الشريط الجانبي. اضبط **Username** على الاسم الذي تطلقه على وكيل OpenClaw الخاص بك.

  </Step>

  <Step title="تفعيل النوايا ذات الامتيازات">
    وأنت ما زلت في صفحة **Bot**، مرّر لأسفل إلى **Privileged Gateway Intents** وفعّل:

    - **Message Content Intent** (مطلوب)
    - **Server Members Intent** (موصى به؛ مطلوب لقوائم السماح بالأدوار ومطابقة الأسماء مع المعرّفات)
    - **Presence Intent** (اختياري؛ مطلوب فقط لتحديثات الحضور)

  </Step>

  <Step title="نسخ رمز البوت">
    مرّر مجدداً إلى أعلى صفحة **Bot** وانقر على **Reset Token**.

    <Note>
    رغم الاسم، سيؤدي هذا إلى إنشاء أول رمز لك — لا تتم "إعادة ضبط" أي شيء.
    </Note>

    انسخ الرمز واحفظه في مكان ما. هذا هو **Bot Token** الخاص بك وستحتاج إليه بعد قليل.

  </Step>

  <Step title="إنشاء عنوان URL للدعوة وإضافة البوت إلى خادمك">
    انقر على **OAuth2** في الشريط الجانبي. ستنشئ عنوان URL للدعوة بالصلاحيات المناسبة لإضافة البوت إلى خادمك.

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
      - إضافة تفاعلات (اختياري)

    هذه هي المجموعة الأساسية لقنوات النص العادية. إذا كنت تخطط للنشر في سلاسل Discord، بما في ذلك سير عمل قنوات المنتديات أو الوسائط التي تنشئ سلسلة أو تتابعها، ففعّل أيضاً **Send Messages in Threads**.
    انسخ عنوان URL الذي تم إنشاؤه في الأسفل، والصقه في متصفحك، وحدد خادمك، ثم انقر على **Continue** للاتصال. يجب أن ترى الآن البوت في خادم Discord.

  </Step>

  <Step title="تفعيل وضع المطور وجمع معرّفاتك">
    في تطبيق Discord، تحتاج إلى تفعيل وضع المطور حتى تتمكن من نسخ المعرّفات الداخلية.

    1. انقر على **User Settings** (رمز الترس بجانب صورتك الرمزية) → **Advanced** → فعّل **Developer Mode**
    2. انقر بزر الماوس الأيمن على **أيقونة الخادم** في الشريط الجانبي → **Copy Server ID**
    3. انقر بزر الماوس الأيمن على **صورتك الرمزية** → **Copy User ID**

    احفظ **Server ID** و**User ID** بجانب Bot Token الخاص بك — سترسل الثلاثة إلى OpenClaw في الخطوة التالية.

  </Step>

  <Step title="السماح بالرسائل المباشرة من أعضاء الخادم">
    حتى يعمل الإقران، يحتاج Discord إلى السماح للبوت بإرسال رسالة مباشرة إليك. انقر بزر الماوس الأيمن على **أيقونة الخادم** → **Privacy Settings** → فعّل **Direct Messages**.

    يتيح هذا لأعضاء الخادم (بما في ذلك البوتات) إرسال رسائل مباشرة إليك. أبقِ هذا مفعلاً إذا أردت استخدام رسائل Discord المباشرة مع OpenClaw. إذا كنت تخطط لاستخدام قنوات الخادم فقط، يمكنك تعطيل الرسائل المباشرة بعد الإقران.

  </Step>

  <Step title="تعيين رمز البوت بأمان (لا ترسله في الدردشة)">
    رمز بوت Discord الخاص بك سرّي (مثل كلمة مرور). عيّنه على الجهاز الذي يشغّل OpenClaw قبل مراسلة وكيلك.

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

    إذا كان OpenClaw يعمل بالفعل كخدمة في الخلفية، فأعد تشغيله عبر تطبيق OpenClaw على Mac أو بإيقاف عملية `openclaw gateway run` ثم إعادة تشغيلها.
    بالنسبة إلى تثبيتات الخدمات المُدارة، شغّل `openclaw gateway install` من صدفة يتوفر فيها `DISCORD_BOT_TOKEN`، أو خزّن المتغير في `~/.openclaw/.env`، حتى تتمكن الخدمة من حل SecretRef للبيئة بعد إعادة التشغيل.
    إذا كان مضيفك محظوراً أو محدود المعدل عند بحث Discord عن تطبيق بدء التشغيل، فعيّن معرّف تطبيق/عميل Discord من بوابة المطورين حتى يتمكن بدء التشغيل من تخطي استدعاء REST هذا. استخدم `channels.discord.applicationId` للحساب الافتراضي، أو `channels.discord.accounts.<accountId>.applicationId` عند تشغيل عدة بوتات Discord.

  </Step>

  <Step title="تهيئة OpenClaw والإقران">

    <Tabs>
      <Tab title="اسأل وكيلك">
        دردش مع وكيل OpenClaw الخاص بك على أي قناة موجودة (مثل Telegram) وأخبره. إذا كان Discord هو قناتك الأولى، فاستخدم تبويب CLI / الإعداد بدلاً من ذلك.

        > "لقد عيّنت بالفعل رمز بوت Discord الخاص بي في الإعداد. يرجى إنهاء إعداد Discord باستخدام User ID `<user_id>` وServer ID `<server_id>`."
      </Tab>
      <Tab title="CLI / الإعداد">
        إذا كنت تفضل الإعداد المعتمد على الملفات، فعيّن:

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

        الرجوع الاحتياطي للبيئة للحساب الافتراضي:

```bash
DISCORD_BOT_TOKEN=...
```

        للإعداد عبر السكربتات أو الإعداد البعيد، اكتب كتلة JSON5 نفسها باستخدام `openclaw config patch --file ./discord.patch.json5 --dry-run` ثم أعد التشغيل بدون `--dry-run`. قيم `token` بالنص الصريح مدعومة. كما أن قيم SecretRef مدعومة أيضاً لـ `channels.discord.token` عبر موفري env/file/exec. راجع [إدارة الأسرار](/ar/gateway/secrets).

        بالنسبة إلى عدة بوتات Discord، احتفظ برمز كل بوت ومعرّف تطبيقه ضمن حسابه. يرث كل حساب `channels.discord.applicationId` من المستوى الأعلى، لذلك عيّنه هناك فقط عندما يجب أن تستخدم كل الحسابات معرّف التطبيق نفسه.

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

  <Step title="الموافقة على أول إقران برسالة مباشرة">
    انتظر حتى يعمل Gateway، ثم أرسل رسالة مباشرة إلى البوت في Discord. سيرد برمز إقران.

    <Tabs>
      <Tab title="اسأل وكيلك">
        أرسل رمز الإقران إلى وكيلك على قناتك الحالية:

        > "وافق على رمز إقران Discord هذا: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    تنتهي صلاحية رموز الإقران بعد ساعة واحدة.

    يجب أن تتمكن الآن من الدردشة مع وكيلك في Discord عبر رسالة مباشرة.

  </Step>
</Steps>

<Note>
حل الرموز يراعي الحسابات. قيم رمز الإعداد تتقدم على الرجوع الاحتياطي للبيئة. يُستخدم `DISCORD_BOT_TOKEN` للحساب الافتراضي فقط.
إذا كان حسابان مفعّلان في Discord يُحلان إلى رمز البوت نفسه، فسيبدأ OpenClaw مراقب Gateway واحداً فقط لذلك الرمز. الرمز المستمد من الإعداد يتقدم على الرجوع الاحتياطي الافتراضي للبيئة؛ وإلا يفوز أول حساب مفعّل ويتم الإبلاغ عن الحساب المكرر على أنه معطّل.
بالنسبة إلى الاستدعاءات الصادرة المتقدمة (أداة الرسائل/إجراءات القناة)، يُستخدم `token` صريح لكل استدعاء لذلك الاستدعاء. ينطبق هذا على إجراءات الإرسال والقراءة/التحقق، مثل read/search/fetch/thread/pins/permissions. تظل إعدادات سياسة الحساب/إعادة المحاولة آتية من الحساب المحدد في لقطة وقت التشغيل النشطة.
</Note>

## موصى به: إعداد مساحة عمل خادم

بمجرد أن تعمل الرسائل المباشرة، يمكنك إعداد خادم Discord كمساحة عمل كاملة حيث تحصل كل قناة على جلسة وكيل خاصة بها مع سياقها الخاص. يوصى بهذا للخوادم الخاصة التي تضمك أنت والبوت فقط.

<Steps>
  <Step title="إضافة خادمك إلى قائمة السماح للخوادم">
    يتيح هذا لوكيلك الرد في أي قناة على خادمك، وليس الرسائل المباشرة فقط.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "أضف Discord Server ID `<server_id>` الخاص بي إلى قائمة السماح للخوادم"
      </Tab>
      <Tab title="الإعداد">

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
    افتراضياً، لا يرد وكيلك في قنوات الخادم إلا عند الإشارة إليه باستخدام @. بالنسبة إلى خادم خاص، قد ترغب غالباً في أن يرد على كل رسالة.

    في قنوات الخادم، تبقى الردود النهائية العادية للمساعد خاصة افتراضياً. يجب إرسال مخرجات Discord المرئية صراحة باستخدام أداة `message`، حتى يتمكن الوكيل من المراقبة افتراضياً والنشر فقط عندما يقرر أن الرد في القناة مفيد.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "اسمح لوكيلي بالرد على هذا الخادم دون الحاجة إلى الإشارة إليه باستخدام @"
      </Tab>
      <Tab title="الإعداد">
        عيّن `requireMention: false` في إعداد الخادم لديك:

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
    افتراضياً، لا تُحمّل الذاكرة طويلة الأمد (MEMORY.md) إلا في جلسات الرسائل المباشرة. لا تحمّل قنوات الخادم MEMORY.md تلقائياً.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "عندما أطرح أسئلة في قنوات Discord، استخدم memory_search أو memory_get إذا كنت تحتاج إلى سياق طويل الأمد من MEMORY.md."
      </Tab>
      <Tab title="يدوي">
        إذا كنت تحتاج إلى سياق مشترك في كل قناة، فضع التعليمات الثابتة في `AGENTS.md` أو `USER.md` (يتم حقنها في كل جلسة). احتفظ بالملاحظات طويلة الأمد في `MEMORY.md` وادخل إليها عند الطلب باستخدام أدوات الذاكرة.
      </Tab>
    </Tabs>

  </Step>
</Steps>

أنشئ الآن بعض القنوات على خادم Discord وابدأ الدردشة. يمكن لوكيلك رؤية اسم القناة، وتحصل كل قناة على جلستها المعزولة الخاصة — لذلك يمكنك إعداد `#coding` أو `#home` أو `#research` أو أي شيء يناسب سير عملك.

## نموذج وقت التشغيل

- يملك Gateway اتصال Discord.
- توجيه الردود حتمي: تعود ردود Discord الواردة إلى Discord.
- تُضاف بيانات guild/channel الوصفية الخاصة بـ Discord إلى مطالبة النموذج كسياق غير موثوق
  وليس كبادئة رد ظاهرة للمستخدم. إذا نسخ نموذج ذلك الغلاف
  مرة أخرى، يزيل OpenClaw البيانات الوصفية المنسوخة من الردود الصادرة ومن
  سياق إعادة التشغيل المستقبلي.
- افتراضياً (`session.dmScope=main`)، تشارك المحادثات المباشرة جلسة الوكيل الرئيسية (`agent:main:main`).
- قنوات Guild هي مفاتيح جلسات معزولة (`agent:<agentId>:discord:channel:<channelId>`).
- يتم تجاهل رسائل DM الجماعية افتراضياً (`channels.discord.dm.groupEnabled=false`).
- تعمل أوامر slash الأصلية في جلسات أوامر معزولة (`agent:<agentId>:discord:slash:<userId>`)، مع استمرار حمل `CommandTargetSessionKey` إلى جلسة المحادثة الموجَّهة.
- يستخدم تسليم إعلانات cron/heartbeat النصية فقط إلى Discord الإجابة النهائية
  المرئية للمساعد مرة واحدة. تبقى حمولات الوسائط والمكونات المنظمة
  متعددة الرسائل عندما يصدر الوكيل عدة حمولات قابلة للتسليم.

## قنوات المنتديات

لا تقبل قنوات منتديات ووسائط Discord إلا منشورات سلاسل المحادثات. يدعم OpenClaw طريقتين لإنشائها:

- أرسل رسالة إلى أصل المنتدى (`channel:<forumId>`) لإنشاء سلسلة محادثات تلقائياً. يستخدم عنوان سلسلة المحادثات أول سطر غير فارغ من رسالتك.
- استخدم `openclaw message thread create` لإنشاء سلسلة محادثات مباشرة. لا تمرر `--message-id` لقنوات المنتديات.

مثال: الإرسال إلى أصل المنتدى لإنشاء سلسلة محادثات

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

مثال: إنشاء سلسلة محادثات منتدى صراحةً

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

لا تقبل أصول المنتديات مكونات Discord. إذا كنت تحتاج إلى مكونات، فأرسل إلى سلسلة المحادثات نفسها (`channel:<threadId>`).

## المكونات التفاعلية

يدعم OpenClaw حاويات مكونات Discord v2 لرسائل الوكلاء. استخدم أداة الرسائل مع حمولة `components`. تُوجَّه نتائج التفاعل مرة أخرى إلى الوكيل كرسائل واردة عادية وتتبع إعدادات Discord الحالية لـ `replyToMode`.

الكتل المدعومة:

- `text`، `section`، `separator`، `actions`، `media-gallery`، `file`
- تسمح صفوف الإجراءات بما يصل إلى 5 أزرار أو قائمة اختيار واحدة
- أنواع الاختيار: `string`، `user`، `role`، `mentionable`، `channel`

افتراضياً، تكون المكونات للاستخدام مرة واحدة. عيّن `components.reusable=true` للسماح باستخدام الأزرار، والاختيارات، والنماذج عدة مرات حتى تنتهي صلاحيتها.

لتقييد من يمكنه النقر على زر، عيّن `allowedUsers` على ذلك الزر (معرّفات مستخدمي Discord أو الوسوم أو `*`). عند التهيئة، يتلقى المستخدمون غير المطابقين رفضاً مؤقتاً.

تفتح أوامر slash `/model` و`/models` منتقي نماذج تفاعلياً يتضمن قوائم منسدلة للموفر، والنموذج، وبيئة التشغيل المتوافقة، إضافة إلى خطوة إرسال. أصبح `/models add` مهملاً ويعيد الآن رسالة إهمال بدلاً من تسجيل النماذج من المحادثة. رد المنتقي مؤقت ولا يمكن استخدامه إلا من المستخدم الذي استدعاه.

مرفقات الملفات:

- يجب أن تشير كتل `file` إلى مرجع مرفق (`attachment://<filename>`)
- وفّر المرفق عبر `media`/`path`/`filePath` (ملف واحد)؛ استخدم `media-gallery` لعدة ملفات
- استخدم `filename` لتجاوز اسم الرفع عندما يجب أن يطابق مرجع المرفق

نماذج Modal:

- أضف `components.modal` بما يصل إلى 5 حقول
- أنواع الحقول: `text`، `checkbox`، `radio`، `select`، `role-select`، `user-select`
- يضيف OpenClaw زر تشغيل تلقائياً

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
    يتحكم `channels.discord.dmPolicy` في وصول DM. تُعد `channels.discord.allowFrom` قائمة السماح الأساسية لـ DM.

    - `pairing` (الافتراضي)
    - `allowlist`
    - `open` (يتطلب أن تتضمن `channels.discord.allowFrom` القيمة `"*"`)
    - `disabled`

    إذا لم تكن سياسة DM مفتوحة، فسيتم حظر المستخدمين المجهولين (أو مطالبتهم بالاقتران في وضع `pairing`).

    أسبقية الحسابات المتعددة:

    - ينطبق `channels.discord.accounts.default.allowFrom` على حساب `default` فقط.
    - لحساب واحد، يكون لـ `allowFrom` أسبقية على `dm.allowFrom` القديم.
    - ترث الحسابات المسماة `channels.discord.allowFrom` عندما لا يتم تعيين `allowFrom` الخاص بها و`dm.allowFrom` القديم.
    - لا ترث الحسابات المسماة `channels.discord.accounts.default.allowFrom`.

    لا يزال `channels.discord.dm.policy` و`channels.discord.dm.allowFrom` القديمان يُقرآن للتوافق. يرحّلهما `openclaw doctor --fix` إلى `dmPolicy` و`allowFrom` عندما يمكنه فعل ذلك من دون تغيير الوصول.

    تنسيق هدف DM للتسليم:

    - `user:<id>`
    - إشارة `<@id>`

    عادةً ما تُحل المعرفات الرقمية المجردة كمعرفات قنوات عندما يكون افتراضي القناة نشطاً، لكن المعرفات المدرجة في `allowFrom` الفعّالة لـ DM الخاصة بالحساب تُعامل كأهداف DM لمستخدمين من أجل التوافق.

  </Tab>

  <Tab title="DM access groups">
    يمكن أن تستخدم رسائل Discord DM إدخالات `accessGroup:<name>` ديناميكية في `channels.discord.allowFrom`.

    تتم مشاركة أسماء مجموعات الوصول عبر قنوات الرسائل. استخدم `type: "message.senders"` لمجموعة ثابتة يُعبّر عن أعضائها بصيغة `allowFrom` العادية لكل قناة، أو `type: "discord.channelAudience"` عندما يجب أن يحدد جمهور `ViewChannel` الحالي لقناة Discord العضوية ديناميكياً. سلوك مجموعات الوصول المشتركة موثق هنا: [مجموعات الوصول](/ar/channels/access-groups).

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

    لا تحتوي قناة Discord النصية على قائمة أعضاء منفصلة. يمثل `type: "discord.channelAudience"` العضوية على النحو التالي: يكون مرسل DM عضواً في الـ guild المهيأة ولديه حالياً إذن `ViewChannel` فعّال على القناة المهيأة بعد تطبيق أدوار القناة وتجاوزاتها.

    مثال: السماح لأي شخص يمكنه رؤية `#maintainers` بإرسال DM إلى الروبوت، مع إبقاء DM مغلقة أمام الجميع غير ذلك.

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

    تفشل عمليات البحث بشكل مغلق. إذا أعاد Discord رسالة `Missing Access`، أو فشل بحث العضو، أو كانت القناة تنتمي إلى guild مختلفة، فيُعامل مرسل DM كغير مخوّل.

    فعّل **Server Members Intent** للروبوت في Discord Developer Portal عند استخدام مجموعات وصول جمهور القناة. لا تتضمن رسائل DM حالة عضو guild، لذلك يحل OpenClaw العضو عبر Discord REST عند وقت التفويض.

  </Tab>

  <Tab title="Guild policy">
    يتم التحكم في معالجة Guild بواسطة `channels.discord.groupPolicy`:

    - `open`
    - `allowlist`
    - `disabled`

    خط الأساس الآمن عندما يكون `channels.discord` موجوداً هو `allowlist`.

    سلوك `allowlist`:

    - يجب أن تطابق الـ guild قيمة `channels.discord.guilds` (يُفضّل `id`، ويُقبل slug)
    - قوائم سماح اختيارية للمرسلين: `users` (يوصى بالمعرفات الثابتة) و`roles` (معرفات الأدوار فقط)؛ إذا تم تكوين أي منهما، يُسمح للمرسلين عندما يطابقون `users` أو `roles`
    - مطابقة الاسم/الوسم المباشرة معطّلة افتراضياً؛ فعّل `channels.discord.dangerouslyAllowNameMatching: true` فقط كوضع توافق طارئ
    - الأسماء/الوسوم مدعومة في `users`، لكن المعرفات أكثر أماناً؛ يحذر `openclaw security audit` عند استخدام إدخالات الاسم/الوسم
    - إذا كانت لدى guild قيمة `channels` مهيأة، تُرفض القنوات غير المدرجة
    - إذا لم تكن لدى guild كتلة `channels`، فيُسمح بجميع القنوات في تلك الـ guild المدرجة في قائمة السماح

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

    إذا قمت بتعيين `DISCORD_BOT_TOKEN` فقط ولم تنشئ كتلة `channels.discord`، فإن القيمة الاحتياطية وقت التشغيل هي `groupPolicy="allowlist"` (مع تحذير في السجلات)، حتى إذا كانت `channels.defaults.groupPolicy` هي `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    تخضع رسائل Guild لبوابة الإشارات افتراضياً.

    يشمل اكتشاف الإشارة:

    - إشارة صريحة إلى الروبوت
    - أنماط الإشارة المهيأة (`agents.list[].groupChat.mentionPatterns`، مع الرجوع إلى `messages.groupChat.mentionPatterns`)
    - سلوك الرد الضمني على الروبوت في الحالات المدعومة

    عند كتابة رسائل Discord صادرة، استخدم صيغة الإشارة الأساسية: `<@USER_ID>` للمستخدمين، و`<#CHANNEL_ID>` للقنوات، و`<@&ROLE_ID>` للأدوار. لا تستخدم صيغة إشارة اللقب القديمة `<@!USER_ID>`.

    تتم تهيئة `requireMention` لكل guild/channel (`channels.discord.guilds...`).
    يزيل `ignoreOtherMentions` اختيارياً الرسائل التي تشير إلى مستخدم/دور آخر وليس إلى الروبوت (باستثناء @everyone/@here).

    رسائل DM الجماعية:

    - الافتراضي: يتم تجاهلها (`dm.groupEnabled=false`)
    - قائمة سماح اختيارية عبر `dm.groupChannels` (معرفات القنوات أو slugs)

  </Tab>
</Tabs>

### توجيه الوكلاء المستند إلى الأدوار

استخدم `bindings[].match.roles` لتوجيه أعضاء Discord guild إلى وكلاء مختلفين حسب معرّف الدور. لا تقبل الربوط المستندة إلى الأدوار إلا معرفات الأدوار، ويتم تقييمها بعد ربوط النظير أو النظير الأصلي وقبل الربوط الخاصة بالـ guild فقط. إذا عيّن ربط أيضاً حقول مطابقة أخرى (مثل `peer` + `guildId` + `roles`)، فيجب أن تتطابق جميع الحقول المهيأة.

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

- القيمة الافتراضية لـ `commands.native` هي `"auto"` وهي مفعّلة لـ Discord.
- تجاوز لكل قناة: `channels.discord.commands.native`.
- يؤدي `commands.native=false` إلى مسح أوامر Discord الأصلية المسجّلة سابقًا صراحةً.
- يستخدم تفويض الأوامر الأصلية قوائم السماح/السياسات نفسها في Discord مثل معالجة الرسائل العادية.
- قد تظل الأوامر مرئية في واجهة Discord للمستخدمين غير المصرّح لهم؛ لكن التنفيذ يظل يفرض تفويض OpenClaw ويعيد "غير مصرّح".

راجع [أوامر Slash](/ar/tools/slash-commands) للاطلاع على كتالوج الأوامر وسلوكها.

إعدادات أوامر Slash الافتراضية:

- `ephemeral: true`

## تفاصيل الميزة

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    يدعم Discord وسوم الرد في مخرجات الوكيل:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    يتم التحكم فيها عبر `channels.discord.replyToMode`:

    - `off` (افتراضي)
    - `first`
    - `all`
    - `batched`

    ملاحظة: يعطّل `off` تسلسل الردود الضمني. لا تزال وسوم `[[reply_to_*]]` الصريحة محترمة.
    يرفق `first` دائمًا مرجع الرد الأصلي الضمني بأول رسالة Discord صادرة للدور.
    لا يرفق `batched` مرجع الرد الأصلي الضمني من Discord إلا عندما يكون
    الدور الوارد دفعة مؤجلة من عدة رسائل. هذا مفيد
    عندما تريد الردود الأصلية أساسًا للمحادثات الاندفاعية الملتبسة، وليس لكل
    دور برسالة واحدة.

    تُعرض معرّفات الرسائل في السياق/السجل حتى تتمكن الوكلاء من استهداف رسائل محددة.

  </Accordion>

  <Accordion title="Live stream preview">
    يمكن لـ OpenClaw بث مسودات الردود عن طريق إرسال رسالة مؤقتة وتعديلها مع وصول النص. يأخذ `channels.discord.streaming` القيم `off` (افتراضي) | `partial` | `block` | `progress`. تُطابق `progress` القيمة `partial` على Discord؛ و`streamMode` اسم بديل قديم ويُرحّل تلقائيًا.

    تبقى القيمة الافتراضية `off` لأن تعديلات المعاينة في Discord تصل إلى حدود المعدل بسرعة عندما تشترك عدة روبوتات أو Gateways في حساب واحد.

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

    - يحرّر `partial` رسالة معاينة واحدة مع وصول الرموز.
    - يصدر `block` مقاطع بحجم المسودة (استخدم `draftChunk` لضبط الحجم ونقاط الفصل، مع تقييدها بـ `textChunkLimit`).
    - تلغي النهايات التي تحتوي وسائط أو أخطاء أو ردودًا صريحة تعديلات المعاينة المعلّقة.
    - يتحكم `streaming.preview.toolProgress` (افتراضيًا `true`) فيما إذا كانت تحديثات الأدوات/التقدم تعيد استخدام رسالة المعاينة.

    بث المعاينة نصّي فقط؛ أما ردود الوسائط فتعود إلى التسليم العادي. عند تفعيل بث `block` صراحةً، يتجاوز OpenClaw بث المعاينة لتجنب البث المزدوج.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    سياق سجل الخادم:

    - القيمة الافتراضية لـ `channels.discord.historyLimit` هي `20`
    - البديل الاحتياطي: `messages.groupChat.historyLimit`
    - تعطل القيمة `0` ذلك

    عناصر التحكم في سجل الرسائل الخاصة:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    سلوك السلاسل:

    - تُوجّه سلاسل Discord كجلسات قناة وترث إعدادات القناة الأصلية ما لم تُتجاوز.
    - ترث جلسات السلاسل اختيار `/model` على مستوى جلسة القناة الأصلية كبديل للنموذج فقط؛ ولا تزال اختيارات `/model` المحلية للسلسلة لها الأولوية، ولا يُنسخ سجل النصوص للأصل ما لم يُفعّل توريث النصوص.
    - يختار `channels.discord.thread.inheritParent` (افتراضيًا `false`) إدخال السلاسل التلقائية الجديدة في البذر من نص الأصل. توجد التجاوزات لكل حساب تحت `channels.discord.accounts.<id>.thread.inheritParent`.
    - يمكن لتفاعلات أداة الرسائل حل أهداف الرسائل الخاصة `user:<id>`.
    - يتم الحفاظ على `guilds.<guild>.channels.<channel>.requireMention: false` أثناء بديل تفعيل مرحلة الرد.

    تُحقن مواضيع القنوات كسياق **غير موثوق**. تضبط قوائم السماح من يمكنه تشغيل الوكيل، وليست حدًّا كاملًا لتنقيح السياق الإضافي.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    يمكن لـ Discord ربط سلسلة بهدف جلسة بحيث تستمر رسائل المتابعة في تلك السلسلة بالتوجيه إلى الجلسة نفسها (بما في ذلك جلسات الوكلاء الفرعيين).

    الأوامر:

    - `/focus <target>` ربط السلسلة الحالية/الجديدة بهدف وكيل فرعي/جلسة
    - `/unfocus` إزالة ربط السلسلة الحالية
    - `/agents` عرض التشغيلات النشطة وحالة الربط
    - `/session idle <duration|off>` فحص/تحديث إلغاء التركيز التلقائي عند الخمول للروابط المركّزة
    - `/session max-age <duration|off>` فحص/تحديث الحد الأقصى الصارم للعمر للروابط المركّزة

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
    - يتحكم `spawnSessions` في إنشاء/ربط السلاسل تلقائيًا لـ `sessions_spawn({ thread: true })` وعمليات إنشاء سلاسل ACP. الافتراضي: `true`.
    - يتحكم `defaultSpawnContext` في سياق الوكيل الفرعي الأصلي لعمليات الإنشاء المرتبطة بالسلاسل. الافتراضي: `"fork"`.
    - تُرحّل المفاتيح المهملة `spawnSubagentSessions`/`spawnAcpSessions` بواسطة `openclaw doctor --fix`.
    - إذا كانت روابط السلاسل معطّلة لحساب ما، فلن تتوفر `/focus` وعمليات ربط السلاسل ذات الصلة.

    راجع [الوكلاء الفرعيون](/ar/tools/subagents)، و[وكلاء ACP](/ar/tools/acp-agents)، و[مرجع الإعدادات](/ar/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    لمساحات عمل ACP مستقرة و"دائمة التشغيل"، اضبط روابط ACP typed على المستوى الأعلى التي تستهدف محادثات Discord.

    مسار الإعداد:

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

    - يربط `/acp spawn codex --bind here` القناة أو السلسلة الحالية في مكانها ويبقي الرسائل المستقبلية على جلسة ACP نفسها. ترث رسائل السلسلة ربط القناة الأصلية.
    - في قناة أو سلسلة مرتبطة، يعيد `/new` و`/reset` ضبط جلسة ACP نفسها في مكانها. يمكن لروابط السلاسل المؤقتة تجاوز حل الهدف أثناء نشاطها.
    - يضبط `spawnSessions` إنشاء/ربط السلاسل الفرعية عبر `--thread auto|here`.

    راجع [وكلاء ACP](/ar/tools/acp-agents) لتفاصيل سلوك الربط.

  </Accordion>

  <Accordion title="Reaction notifications">
    وضع إشعارات التفاعل لكل خادم:

    - `off`
    - `own` (افتراضي)
    - `all`
    - `allowlist` (يستخدم `guilds.<id>.users`)

    تُحوّل أحداث التفاعل إلى أحداث نظام وتُرفق بجلسة Discord الموجّهة.

  </Accordion>

  <Accordion title="Ack reactions">
    يرسل `ackReaction` رمزًا تعبيريًا للإقرار أثناء معالجة OpenClaw لرسالة واردة.

    ترتيب الحل:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - بديل رمز تعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يقبل Discord الرموز التعبيرية Unicode أو أسماء الرموز التعبيرية المخصصة.
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="Config writes">
    عمليات كتابة الإعدادات التي تبدأها القناة مفعّلة افتراضيًا.

    يؤثر هذا في تدفقات `/config set|unset` (عندما تكون ميزات الأوامر مفعّلة).

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

  <Accordion title="PluralKit support">
    فعّل حل PluralKit لربط الرسائل الممرّرة بهوية عضو النظام:

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
    - تستخدم عمليات البحث معرّف الرسالة الأصلي وتكون مقيّدة بنافذة زمنية
    - إذا فشل البحث، تُعامل الرسائل الممرّرة كرسائل روبوت وتُسقط ما لم تكن `allowBots=true`

  </Accordion>

  <Accordion title="Outbound mention aliases">
    استخدم `mentionAliases` عندما تحتاج الوكلاء إلى إشارات صادرة حتمية لمستخدمي Discord المعروفين. المفاتيح هي مقابض دون `@` في البداية؛ والقيم هي معرّفات مستخدمي Discord. تُترك المقابض غير المعروفة، و`@everyone`، و`@here`، والإشارات داخل مقاطع كود Markdown دون تغيير.

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
    تُطبّق تحديثات الحضور عند تعيين حقل حالة أو نشاط، أو عند تفعيل الحضور التلقائي.

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

    - 0: يلعب
    - 1: يبث (يتطلب `activityUrl`)
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

  <Accordion title="Approvals in Discord">
    يدعم Discord معالجة الموافقات القائمة على الأزرار في الرسائل الخاصة، ويمكنه اختياريًا نشر مطالبات الموافقة في القناة الأصلية.

    مسار الإعداد:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختياري؛ يعود إلى `commands.ownerAllowFrom` عند الإمكان)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
    - `agentFilter`، `sessionFilter`، `cleanupAfterResolve`

    يفعّل Discord موافقات التنفيذ الأصلية تلقائياً عندما تكون `enabled` غير معيّنة أو مضبوطة على `"auto"` ويمكن حلّ موافِق واحد على الأقل، إما من `execApprovals.approvers` أو من `commands.ownerAllowFrom`. لا يستنتج Discord موافقي التنفيذ من `allowFrom` الخاصة بالقناة، أو `dm.allowFrom` القديمة، أو `defaultTo` الخاصة بالرسائل المباشرة. اضبط `enabled: false` لتعطيل Discord صراحةً كعميل موافقة أصلي.

    بالنسبة إلى أوامر المجموعات الحساسة المخصصة للمالك فقط، مثل `/diagnostics` و`/export-trajectory`، يرسل OpenClaw مطالبات الموافقة والنتائج النهائية بشكل خاص. يجرّب رسائل Discord المباشرة أولاً عندما يكون لدى المالك الذي استدعى الأمر مسار مالك في Discord؛ وإذا لم يكن ذلك متاحاً، يعود إلى أول مسار مالك متاح من `commands.ownerAllowFrom`، مثل Telegram.

    عندما تكون `target` هي `channel` أو `both`، تكون مطالبة الموافقة مرئية في القناة. لا يمكن استخدام الأزرار إلا للموافقين الذين تم حلّهم؛ ويتلقى المستخدمون الآخرون رفضاً مؤقتاً. تتضمن مطالبات الموافقة نص الأمر، لذلك لا تفعّل التسليم إلى القناة إلا في القنوات الموثوقة. إذا تعذر اشتقاق معرّف القناة من مفتاح الجلسة، يعود OpenClaw إلى التسليم عبر الرسائل المباشرة.

    يعرض Discord أيضاً أزرار الموافقة المشتركة التي تستخدمها قنوات الدردشة الأخرى. يضيف محوّل Discord الأصلي أساساً توجيه رسائل الموافقين المباشرة والتوزيع إلى القنوات.
    عند وجود هذه الأزرار، تكون هي تجربة الموافقة الأساسية؛ ويجب أن يضمّن OpenClaw
    أمر `/approve` يدوياً فقط عندما تشير نتيجة الأداة إلى أن موافقات الدردشة
    غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.
    إذا لم يكن وقت تشغيل الموافقات الأصلية في Discord نشطاً، يُبقي OpenClaw
    مطالبة `/approve <id> <decision>` المحلية والحتمية مرئية. إذا كان
    وقت التشغيل نشطاً ولكن لا يمكن تسليم بطاقة أصلية إلى أي هدف،
    يرسل OpenClaw إشعار رجوع في الدردشة نفسها يتضمن أمر `/approve`
    الدقيق من الموافقة المعلقة.

    تتبع مصادقة Gateway وحل الموافقة عقد عميل Gateway المشترك (تُحل معرّفات `plugin:` عبر `plugin.approval.resolve`؛ وتُحل المعرّفات الأخرى عبر `exec.approval.resolve`). تنتهي صلاحية الموافقات بعد 30 دقيقة افتراضياً.

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

يقبل إجراء `event-create` وسيط `image` اختيارياً (URL أو مسار ملف محلي) لتعيين صورة غلاف الحدث المجدول.

توجد بوابات الإجراءات ضمن `channels.discord.actions.*`.

سلوك البوابة الافتراضي:

| مجموعة الإجراءات                                                                                                                                                             | الافتراضي |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | مفعّل    |
| roles                                                                                                                                                                    | معطّل    |
| moderation                                                                                                                                                               | معطّل    |
| presence                                                                                                                                                                 | معطّل    |

## واجهة مكونات v2

يستخدم OpenClaw مكونات Discord v2 لموافقات التنفيذ وعلامات السياقات المتقاطعة. يمكن لإجراءات رسائل Discord أيضاً قبول `components` لواجهة مخصصة (متقدم؛ يتطلب إنشاء حمولة مكون عبر أداة discord)، بينما تظل `embeds` القديمة متاحة لكنها غير موصى بها.

- يضبط `channels.discord.ui.components.accentColor` لون التمييز المستخدم في حاويات مكونات Discord (hex).
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

لدى Discord سطحان صوتيان مختلفان: **قنوات صوتية** آنية (محادثات مستمرة) و**مرفقات رسائل صوتية** (تنسيق معاينة الموجة). يدعم Gateway كليهما.

### قنوات الصوت

قائمة إعداد:

1. فعّل Message Content Intent في Discord Developer Portal.
2. فعّل Server Members Intent عند استخدام قوائم السماح للأدوار/المستخدمين.
3. ادعُ الروبوت بنطاقي `bot` و`applications.commands`.
4. امنح أذونات Connect وSpeak وSend Messages وRead Message History في قناة الصوت المستهدفة.
5. فعّل الأوامر الأصلية (`commands.native` أو `channels.discord.commands.native`).
6. اضبط `channels.discord.voice`.

استخدم `/vc join|leave|status` للتحكم في الجلسات. يستخدم الأمر وكيل الحساب الافتراضي ويتبع قواعد قائمة السماح وسياسة المجموعة نفسها مثل أوامر Discord الأخرى.

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
- يتجاوز `voice.model` نموذج LLM المستخدم لاستجابات قناة صوت Discord فقط. اتركه غير معيّن ليرث نموذج الوكيل الموجّه.
- يستخدم STT `tools.media.audio`؛ ولا يؤثر `voice.model` في النسخ.
- تنطبق تجاوزات `systemPrompt` الخاصة بكل قناة Discord على أدوار نص الصوت لقناة الصوت تلك.
- تستمد أدوار نص الصوت حالة المالك من `allowFrom` في Discord (أو `dm.allowFrom`)؛ ولا يمكن للمتحدثين غير المالكين الوصول إلى الأدوات المخصصة للمالك فقط (مثل `gateway` و`cron`).
- صوت Discord اختياري لإعدادات النص فقط؛ اضبط `channels.discord.voice.enabled=true` (أو أبقِ كتلة `channels.discord.voice` موجودة) لتفعيل أوامر `/vc`، ووقت تشغيل الصوت، وهدف Gateway `GuildVoiceStates`.
- يمكن لـ `channels.discord.intents.voiceStates` تجاوز الاشتراك في هدف حالة الصوت صراحةً. اتركه غير معيّن حتى يتبع الهدف التفعيل الفعلي للصوت.
- تمرّر `voice.daveEncryption` و`voice.decryptionFailureTolerance` إلى خيارات الانضمام في `@discordjs/voice`.
- افتراضيات `@discordjs/voice` هي `daveEncryption=true` و`decryptionFailureTolerance=24` إذا لم تُعيّن.
- يتحكم `voice.connectTimeoutMs` في انتظار Ready الأولي الخاص بـ `@discordjs/voice` لمحاولات `/vc join` والانضمام التلقائي. الافتراضي: `30000`.
- يتحكم `voice.reconnectGraceMs` في مدة انتظار OpenClaw لجلسة صوتية منقطعة كي تبدأ بإعادة الاتصال قبل تدميرها. الافتراضي: `15000`.
- يراقب OpenClaw أيضاً حالات فشل فك تشفير الاستقبال ويتعافى تلقائياً عبر مغادرة قناة الصوت وإعادة الانضمام إليها بعد تكرر الفشل خلال نافذة قصيرة.
- إذا أظهرت سجلات الاستقبال مراراً `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` بعد التحديث، فاجمع تقرير تبعيات وسجلات. يتضمن سطر `@discordjs/voice` المضمّن إصلاح الحشو من المنبع من discord.js PR #11449، الذي أغلق مشكلة discord.js رقم #11419.

مسار معالجة قناة الصوت:

- يتم تحويل التقاط Discord PCM إلى ملف WAV مؤقت.
- يتعامل `tools.media.audio` مع STT، مثل `openai/gpt-4o-mini-transcribe`.
- يُرسل النص عبر دخول Discord والتوجيه، بينما يعمل LLM الخاص بالاستجابة بسياسة إخراج صوتي تخفي أداة `tts` الخاصة بالوكيل وتطلب نصاً مُعاداً، لأن صوت Discord يملك تشغيل TTS النهائي.
- عندما يكون `voice.model` معيّناً، فإنه يتجاوز LLM الخاص بالاستجابة فقط لهذا الدور في قناة الصوت.
- يتم دمج `voice.tts` فوق `messages.tts`؛ ثم يُشغّل الصوت الناتج في القناة المنضم إليها.

تُحل بيانات الاعتماد لكل مكون: مصادقة مسار LLM لـ `voice.model`، ومصادقة STT لـ `tools.media.audio`، ومصادقة TTS لـ `messages.tts`/`voice.tts`.

### الرسائل الصوتية

تعرض رسائل Discord الصوتية معاينة موجة وتتطلب صوت OGG/Opus. ينشئ OpenClaw الموجة تلقائياً، لكنه يحتاج إلى `ffmpeg` و`ffprobe` على مضيف Gateway للفحص والتحويل.

- وفّر **مسار ملف محلي** (يتم رفض عناوين URL).
- احذف محتوى النص (يرفض Discord النص + الرسالة الصوتية في الحمولة نفسها).
- يتم قبول أي تنسيق صوتي؛ ويحوّل OpenClaw إلى OGG/Opus عند الحاجة.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="استخدام أهداف غير مسموح بها أو أن الروبوت لا يرى رسائل الخادم">

    - فعّل Message Content Intent
    - فعّل Server Members Intent عندما تعتمد على حل المستخدم/العضو
    - أعد تشغيل Gateway بعد تغيير الأهداف

  </Accordion>

  <Accordion title="حُظرت رسائل الخادم بشكل غير متوقع">

    - تحقق من `groupPolicy`
    - تحقق من قائمة سماح الخادم ضمن `channels.discord.guilds`
    - إذا كانت خريطة `channels` الخاصة بالخادم موجودة، فلا يُسمح إلا بالقنوات المدرجة
    - تحقق من سلوك `requireMention` وأنماط الإشارة

    فحوصات مفيدة:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="الإشارة مطلوبة مضبوطة على false لكن الحظر ما زال قائماً">
    أسباب شائعة:

    - `groupPolicy="allowlist"` من دون قائمة سماح مطابقة للخادم/القناة
    - تم ضبط `requireMention` في المكان الخطأ (يجب أن يكون ضمن `channels.discord.guilds` أو إدخال القناة)
    - المرسل محظور بسبب قائمة السماح `users` الخاصة بالخادم/القناة

  </Accordion>

  <Accordion title="أدوار Discord طويلة التشغيل أو ردود مكررة">

    سجلات نموذجية:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    مقابض طابور Gateway في Discord:

    - حساب واحد: `channels.discord.eventQueue.listenerTimeout`
    - حسابات متعددة: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - يتحكم هذا فقط في عمل مستمع Gateway في Discord، وليس في مدة دور الوكيل

    لا يطبق Discord مهلة مملوكة للقناة على أدوار الوكيل الموضوعة في الطابور. تسلّم مستمعات الرسائل العمل فوراً، وتحافظ تشغيلات Discord الموضوعة في الطابور على ترتيب كل جلسة حتى تكتمل دورة حياة الجلسة/الأداة/وقت التشغيل أو تُجهض العمل.

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
    يجلب OpenClaw بيانات Discord الوصفية من `/gateway/bot` قبل الاتصال. تعود حالات الفشل العابرة إلى عنوان Gateway الافتراضي في Discord وتكون محدودة المعدل في السجلات.

    مقابض مهلة البيانات الوصفية:

    - حساب واحد: `channels.discord.gatewayInfoTimeoutMs`
    - حسابات متعددة: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - رجوع env عندما لا تكون الإعدادات معيّنة: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - الافتراضي: `30000` (30 ثانية)، الحد الأقصى: `120000`

  </Accordion>

  <Accordion title="إعادة تشغيل مهلة READY في Gateway">
    ينتظر OpenClaw حدث `READY` الخاص بـ Discord في Gateway أثناء بدء التشغيل وبعد عمليات إعادة الاتصال وقت التشغيل. قد تحتاج إعدادات الحسابات المتعددة مع التدرج في بدء التشغيل إلى نافذة READY أطول عند بدء التشغيل من القيمة الافتراضية.

    مفاتيح ضبط مهلة READY:

    - حساب واحد عند بدء التشغيل: `channels.discord.gatewayReadyTimeoutMs`
    - حسابات متعددة عند بدء التشغيل: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - احتياطي متغير البيئة عند بدء التشغيل عندما لا يكون الإعداد مضبوطا: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - الافتراضي عند بدء التشغيل: `15000` (15 ثانية)، الحد الأقصى: `120000`
    - حساب واحد وقت التشغيل: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - حسابات متعددة وقت التشغيل: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - احتياطي متغير البيئة وقت التشغيل عندما لا يكون الإعداد مضبوطا: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - الافتراضي وقت التشغيل: `30000` (30 ثانية)، الحد الأقصى: `120000`

  </Accordion>

  <Accordion title="حالات عدم تطابق تدقيق الأذونات">
    تعمل فحوصات الأذونات في `channels status --probe` فقط مع معرفات القنوات الرقمية.

    إذا كنت تستخدم مفاتيح slug، فقد تظل المطابقة وقت التشغيل تعمل، لكن الفحص لا يستطيع التحقق من الأذونات بالكامل.

  </Accordion>

  <Accordion title="مشكلات الرسائل المباشرة والاقتران">

    - الرسائل المباشرة معطلة: `channels.discord.dm.enabled=false`
    - سياسة الرسائل المباشرة معطلة: `channels.discord.dmPolicy="disabled"` (قديم: `channels.discord.dm.policy`)
    - انتظار موافقة الاقتران في وضع `pairing`

  </Accordion>

  <Accordion title="حلقات من بوت إلى بوت">
    بشكل افتراضي، يتم تجاهل الرسائل المنشأة بواسطة البوتات.

    إذا ضبطت `channels.discord.allowBots=true`، فاستخدم قواعد صارمة للإشارات وقائمة السماح لتجنب سلوك الحلقات.
    يفضل استخدام `channels.discord.allowBots="mentions"` لقبول رسائل البوتات التي تشير إلى البوت فقط.

  </Accordion>

  <Accordion title="سقوط STT الصوتية مع DecryptionFailed(...)">

    - أبق OpenClaw محدثا (`openclaw update`) حتى يكون منطق استرداد استقبال صوت Discord موجودا
    - تأكد من `channels.discord.voice.daveEncryption=true` (افتراضي)
    - ابدأ من `channels.discord.voice.decryptionFailureTolerance=24` (الافتراضي من المنبع) واضبطه فقط عند الحاجة
    - راقب السجلات بحثا عن:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - إذا استمرت الإخفاقات بعد إعادة الانضمام التلقائية، فاجمع السجلات وقارنها بسجل استقبال DAVE في المنبع في [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) و[discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## مرجع التكوين

المرجع الأساسي: [مرجع التكوين - Discord](/ar/gateway/config-channels#discord).

<Accordion title="حقول Discord عالية الأهمية">

- بدء التشغيل/المصادقة: `enabled`, `token`, `accounts.*`, `allowBots`
- السياسة: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- الأمر: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- طابور الأحداث: `eventQueue.listenerTimeout` (ميزانية المستمع)، `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
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

- تعامل مع رموز البوت على أنها أسرار (يفضل `DISCORD_BOT_TOKEN` في البيئات الخاضعة للإشراف).
- امنح أذونات Discord بأقل امتيازات لازمة.
- إذا كانت حالة/نشر الأوامر قديمة، فأعد تشغيل Gateway وأعد التحقق باستخدام `openclaw channels status --probe`.

## ذات صلة

<CardGroup cols={2}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    اقرن مستخدم Discord بالـ Gateway.
  </Card>
  <Card title="المجموعات" icon="users" href="/ar/channels/groups">
    سلوك الدردشة الجماعية وقائمة السماح.
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
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلية.
  </Card>
</CardGroup>

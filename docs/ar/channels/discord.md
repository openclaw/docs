---
read_when:
    - العمل على ميزات قناة Discord
summary: حالة دعم بوت Discord وإمكاناته وتكوينه
title: Discord
x-i18n:
    generated_at: "2026-05-02T07:17:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5526523b55dc2c861206eaf6b016c025da33bc5c47d196ba7aed6fb4c3e6595
    source_path: channels/discord.md
    workflow: 16
---

جاهز للرسائل المباشرة وقنوات الخوادم عبر Discord Gateway الرسمي.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    تنتقل رسائل Discord المباشرة افتراضيًا إلى وضع الاقتران.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وفهرس الأوامر.
  </Card>
  <Card title="استكشاف مشكلات القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات متعددة القنوات ومسار الإصلاح.
  </Card>
</CardGroup>

## الإعداد السريع

ستحتاج إلى إنشاء تطبيق جديد مع روبوت، وإضافة الروبوت إلى خادمك، وإقرانه بـ OpenClaw. نوصي بإضافة الروبوت إلى خادمك الخاص. إذا لم يكن لديك واحد بعد، [أنشئ واحدًا أولًا](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (اختر **Create My Own > For me and my friends**).

<Steps>
  <Step title="أنشئ تطبيق Discord وروبوتًا">
    انتقل إلى [Discord Developer Portal](https://discord.com/developers/applications) وانقر على **New Application**. سمّه شيئًا مثل "OpenClaw".

    انقر على **Bot** في الشريط الجانبي. اضبط **Username** على الاسم الذي تطلقه على وكيل OpenClaw لديك.

  </Step>

  <Step title="فعّل النوايا ذات الامتيازات">
    بينما لا تزال في صفحة **Bot**، مرّر لأسفل إلى **Privileged Gateway Intents** وفعّل:

    - **Message Content Intent** (مطلوب)
    - **Server Members Intent** (موصى به؛ مطلوب لقوائم السماح بالأدوار ومطابقة الأسماء بالمعرّفات)
    - **Presence Intent** (اختياري؛ مطلوب فقط لتحديثات الحضور)

  </Step>

  <Step title="انسخ رمز الروبوت">
    مرّر إلى الأعلى مجددًا في صفحة **Bot** وانقر على **Reset Token**.

    <Note>
    رغم الاسم، يؤدي هذا إلى إنشاء أول رمز لك — لا تتم "إعادة تعيين" أي شيء.
    </Note>

    انسخ الرمز واحفظه في مكان ما. هذا هو **Bot Token** الخاص بك وستحتاج إليه بعد قليل.

  </Step>

  <Step title="أنشئ عنوان URL للدعوة وأضف الروبوت إلى خادمك">
    انقر على **OAuth2** في الشريط الجانبي. ستنشئ عنوان URL للدعوة بالأذونات الصحيحة لإضافة الروبوت إلى خادمك.

    مرّر لأسفل إلى **OAuth2 URL Generator** وفعّل:

    - `bot`
    - `applications.commands`

    سيظهر قسم **Bot Permissions** أدناه. فعّل على الأقل:

    **الأذونات العامة**
      - عرض القنوات
    **أذونات النص**
      - إرسال الرسائل
      - قراءة سجل الرسائل
      - تضمين الروابط
      - إرفاق الملفات
      - إضافة تفاعلات (اختياري)

    هذه هي المجموعة الأساسية لقنوات النص العادية. إذا كنت تخطط للنشر في سلاسل Discord، بما في ذلك سير عمل قنوات المنتديات أو الوسائط التي تنشئ سلسلة أو تتابعها، ففعّل أيضًا **Send Messages in Threads**.
    انسخ عنوان URL المُنشأ في الأسفل، والصقه في متصفحك، واختر خادمك، وانقر على **Continue** للاتصال. من المفترض أن ترى الآن روبوتك في خادم Discord.

  </Step>

  <Step title="فعّل وضع المطوّر واجمع معرّفاتك">
    بالعودة إلى تطبيق Discord، تحتاج إلى تفعيل وضع المطوّر حتى تتمكن من نسخ المعرّفات الداخلية.

    1. انقر على **User Settings** (أيقونة الترس بجانب صورتك الرمزية) → **Advanced** → فعّل **Developer Mode**
    2. انقر بزر الفأرة الأيمن على **أيقونة الخادم** في الشريط الجانبي → **Copy Server ID**
    3. انقر بزر الفأرة الأيمن على **صورتك الرمزية** → **Copy User ID**

    احفظ **Server ID** و**User ID** إلى جانب Bot Token لديك — سترسل الثلاثة جميعًا إلى OpenClaw في الخطوة التالية.

  </Step>

  <Step title="اسمح بالرسائل المباشرة من أعضاء الخادم">
    لكي يعمل الاقتران، يحتاج Discord إلى السماح لروبوتك بإرسال رسالة مباشرة إليك. انقر بزر الفأرة الأيمن على **أيقونة الخادم** → **Privacy Settings** → فعّل **Direct Messages**.

    يتيح هذا لأعضاء الخادم (بما في ذلك الروبوتات) إرسال رسائل مباشرة إليك. أبقِ هذا مفعّلًا إذا كنت تريد استخدام رسائل Discord المباشرة مع OpenClaw. إذا كنت تخطط لاستخدام قنوات الخادم فقط، فيمكنك تعطيل الرسائل المباشرة بعد الاقتران.

  </Step>

  <Step title="اضبط رمز الروبوت بأمان (لا ترسله في الدردشة)">
    رمز روبوت Discord الخاص بك سرّ (مثل كلمة المرور). اضبطه على الجهاز الذي يشغّل OpenClaw قبل مراسلة وكيلك.

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
    بالنسبة لتثبيتات الخدمة المُدارة، شغّل `openclaw gateway install` من صدفة يكون فيها `DISCORD_BOT_TOKEN` موجودًا، أو خزّن المتغير في `~/.openclaw/.env`، حتى تتمكن الخدمة من حل SecretRef الخاص بالبيئة بعد إعادة التشغيل.
    إذا كان مضيفك محظورًا أو مقيّد المعدل بسبب بحث تطبيق Discord عند بدء التشغيل، فاضبط معرّف تطبيق/عميل Discord من Developer Portal حتى يتمكن بدء التشغيل من تخطي استدعاء REST هذا. استخدم `channels.discord.applicationId` للحساب الافتراضي، أو `channels.discord.accounts.<accountId>.applicationId` عند تشغيل عدة روبوتات Discord.

  </Step>

  <Step title="اضبط OpenClaw واقرنه">

    <Tabs>
      <Tab title="اسأل وكيلك">
        دردش مع وكيل OpenClaw لديك على أي قناة موجودة (مثل Telegram) وأخبره. إذا كانت Discord هي قناتك الأولى، فاستخدم تبويب CLI / config بدلًا من ذلك.

        > "لقد ضبطت بالفعل رمز روبوت Discord في الإعدادات. يرجى إكمال إعداد Discord باستخدام User ID `<user_id>` وServer ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        إذا كنت تفضّل الإعداد المستند إلى الملفات، فاضبط:

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

        احتياطي البيئة للحساب الافتراضي:

```bash
DISCORD_BOT_TOKEN=...
```

        للإعداد البرمجي أو البعيد، اكتب كتلة JSON5 نفسها باستخدام `openclaw config patch --file ./discord.patch.json5 --dry-run` ثم أعد التشغيل بدون `--dry-run`. قيم `token` بالنص الصريح مدعومة. قيم SecretRef مدعومة أيضًا لـ `channels.discord.token` عبر مزوّدي البيئة/الملف/التنفيذ. راجع [إدارة الأسرار](/ar/gateway/secrets).

        لعدة روبوتات Discord، احتفظ برمز كل روبوت ومعرّف التطبيق ضمن حسابه. يتم توريث `channels.discord.applicationId` ذي المستوى الأعلى بواسطة الحسابات، لذلك لا تضبطه هناك إلا عندما ينبغي لكل حساب استخدام معرّف التطبيق نفسه.

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

  <Step title="وافق على أول اقتران عبر رسالة مباشرة">
    انتظر حتى يعمل Gateway، ثم أرسل رسالة مباشرة إلى روبوتك في Discord. سيرد برمز اقتران.

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

    من المفترض أن تتمكن الآن من الدردشة مع وكيلك في Discord عبر رسالة مباشرة.

  </Step>
</Steps>

<Note>
حل الرموز يراعي الحساب. قيم رمز الإعداد لها الأولوية على احتياطي البيئة. يُستخدم `DISCORD_BOT_TOKEN` للحساب الافتراضي فقط.
إذا تم حل حسابين Discord مفعّلين إلى رمز الروبوت نفسه، يبدأ OpenClaw مراقب Gateway واحدًا فقط لذلك الرمز. يفوز الرمز القادم من الإعدادات على احتياطي البيئة الافتراضي؛ وإلا فيفوز أول حساب مفعّل ويتم الإبلاغ عن تعطيل الحساب المكرر.
بالنسبة للاستدعاءات الصادرة المتقدمة (أداة الرسائل/إجراءات القناة)، يُستخدم `token` صريح لكل استدعاء لذلك الاستدعاء. ينطبق هذا على إجراءات الإرسال والقراءة/الفحص (على سبيل المثال القراءة/البحث/الجلب/السلسلة/الدبابيس/الأذونات). تظل إعدادات سياسة الحساب/إعادة المحاولة آتية من الحساب المحدد في لقطة وقت التشغيل النشطة.
</Note>

## موصى به: إعداد مساحة عمل للخادم

بعد عمل الرسائل المباشرة، يمكنك إعداد خادم Discord الخاص بك كمساحة عمل كاملة يحصل فيها كل قناة على جلسة وكيل خاصة بها مع سياقها الخاص. يوصى بهذا للخوادم الخاصة حيث تكون أنت وروبوتك فقط.

<Steps>
  <Step title="أضف خادمك إلى قائمة السماح للخوادم">
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

  <Step title="اسمح بالردود بدون @mention">
    افتراضيًا، لا يرد وكيلك في قنوات الخادم إلا عند @ذكره. بالنسبة لخادم خاص، غالبًا ستريده أن يرد على كل رسالة.

    في قنوات الخادم، تبقى الردود النهائية العادية للمساعد خاصة افتراضيًا. يجب إرسال مخرجات Discord المرئية صراحةً باستخدام أداة `message`، حتى يتمكن الوكيل من البقاء صامتًا افتراضيًا والنشر فقط عندما يقرر أن الرد في القناة مفيد.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "اسمح لوكيلي بالرد على هذا الخادم بدون الحاجة إلى @ذكره"
      </Tab>
      <Tab title="الإعداد">
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

  <Step title="خطط للذاكرة في قنوات الخادم">
    افتراضيًا، لا تُحمّل الذاكرة طويلة الأمد (MEMORY.md) إلا في جلسات الرسائل المباشرة. لا تُحمّل قنوات الخادم MEMORY.md تلقائيًا.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "عندما أطرح أسئلة في قنوات Discord، استخدم memory_search أو memory_get إذا احتجت إلى سياق طويل الأمد من MEMORY.md."
      </Tab>
      <Tab title="يدوي">
        إذا كنت تحتاج إلى سياق مشترك في كل قناة، فضع التعليمات الثابتة في `AGENTS.md` أو `USER.md` (يتم حقنهما في كل جلسة). احتفظ بالملاحظات طويلة الأمد في `MEMORY.md` وادخل إليها عند الطلب باستخدام أدوات الذاكرة.
      </Tab>
    </Tabs>

  </Step>
</Steps>

أنشئ الآن بعض القنوات على خادم Discord وابدأ الدردشة. يستطيع وكيلك رؤية اسم القناة، وتحصل كل قناة على جلسة معزولة خاصة بها — لذلك يمكنك إعداد `#coding` أو `#home` أو `#research` أو أي شيء يناسب سير عملك.

## نموذج وقت التشغيل

- يمتلك Gateway اتصال Discord.
- توجيه الردود حتمي: تعود الردود الواردة من Discord إلى Discord.
- تُضاف بيانات تعريف خادم/قناة Discord إلى مطالبة النموذج كسياق غير موثوق
  وليس كبادئة رد مرئية للمستخدم. إذا نسخ نموذج ذلك الغلاف
  مرة أخرى، يزيل OpenClaw بيانات التعريف المنسوخة من الردود الصادرة ومن
  سياق إعادة التشغيل المستقبلي.
- افتراضيًا (`session.dmScope=main`)، تشارك المحادثات المباشرة الجلسة الرئيسية للوكيل (`agent:main:main`).
- قنوات الخوادم هي مفاتيح جلسات معزولة (`agent:<agentId>:discord:channel:<channelId>`).
- تُتجاهل رسائل المجموعة المباشرة افتراضيًا (`channels.discord.dm.groupEnabled=false`).
- تعمل الأوامر المائلة الأصلية في جلسات أوامر معزولة (`agent:<agentId>:discord:slash:<userId>`)، مع استمرارها في حمل `CommandTargetSessionKey` إلى جلسة المحادثة الموجّهة.
- يستخدم تسليم إعلانات cron/heartbeat النصية فقط إلى Discord الإجابة النهائية
  المرئية للمساعد مرة واحدة. تظل حمولات الوسائط والمكونات المنظمة
  متعددة الرسائل عندما يصدر الوكيل عدة حمولات قابلة للتسليم.

## قنوات المنتديات

لا تقبل قنوات المنتديات والوسائط في Discord إلا منشورات الخيوط. يدعم OpenClaw طريقتين لإنشائها:

- أرسل رسالة إلى أصل المنتدى (`channel:<forumId>`) لإنشاء خيط تلقائيًا. يستخدم عنوان الخيط أول سطر غير فارغ من رسالتك.
- استخدم `openclaw message thread create` لإنشاء خيط مباشرة. لا تمرر `--message-id` لقنوات المنتديات.

مثال: الإرسال إلى أصل المنتدى لإنشاء خيط

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

مثال: إنشاء خيط منتدى صراحة

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

لا تقبل أصول المنتديات مكونات Discord. إذا كنت تحتاج إلى مكونات، فأرسل إلى الخيط نفسه (`channel:<threadId>`).

## المكونات التفاعلية

يدعم OpenClaw حاويات مكونات Discord v2 لرسائل الوكيل. استخدم أداة الرسائل مع حمولة `components`. تُوجّه نتائج التفاعل مرة أخرى إلى الوكيل كرسائل واردة عادية وتتبع إعدادات Discord `replyToMode` الحالية.

الكتل المدعومة:

- `text`، `section`، `separator`، `actions`، `media-gallery`، `file`
- تسمح صفوف الإجراءات بما يصل إلى 5 أزرار أو قائمة اختيار واحدة
- أنواع الاختيار: `string`، `user`، `role`، `mentionable`، `channel`

افتراضيًا، تكون المكونات للاستخدام مرة واحدة. عيّن `components.reusable=true` للسماح باستخدام الأزرار وقوائم الاختيار والنماذج عدة مرات حتى تنتهي صلاحيتها.

لتقييد من يمكنه النقر على زر، عيّن `allowedUsers` على ذلك الزر (معرّفات مستخدمي Discord أو الوسوم أو `*`). عند تكوين ذلك، يتلقى المستخدمون غير المطابقين رفضًا عابرًا.

يفتح الأمران المائلان `/model` و`/models` منتقي نماذج تفاعليًا يتضمن قوائم منسدلة للموفّر والنموذج ووقت التشغيل المتوافق، بالإضافة إلى خطوة إرسال. أصبح `/models add` مهملًا ويعيد الآن رسالة إهمال بدلًا من تسجيل النماذج من الدردشة. رد المنتقي عابر ولا يمكن استخدامه إلا من المستخدم الذي استدعاه.

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
    يتحكم `channels.discord.dmPolicy` في الوصول إلى الرسائل المباشرة. `channels.discord.allowFrom` هي قائمة السماح الأساسية للرسائل المباشرة.

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `channels.discord.allowFrom` القيمة `"*"`)
    - `disabled`

    إذا لم تكن سياسة الرسائل المباشرة مفتوحة، فسيُحظر المستخدمون غير المعروفين (أو يُطلب منهم الاقتران في وضع `pairing`).

    أسبقية الحسابات المتعددة:

    - ينطبق `channels.discord.accounts.default.allowFrom` فقط على حساب `default`.
    - في الحساب الواحد، تكون لـ `allowFrom` أسبقية على `dm.allowFrom` القديم.
    - ترث الحسابات المسماة `channels.discord.allowFrom` عندما لا تكون `allowFrom` الخاصة بها ولا `dm.allowFrom` القديم معيّنة.
    - لا ترث الحسابات المسماة `channels.discord.accounts.default.allowFrom`.

    لا يزال `channels.discord.dm.policy` و`channels.discord.dm.allowFrom` القديمان يُقرآن للتوافق. يرحّلهما `openclaw doctor --fix` إلى `dmPolicy` و`allowFrom` عندما يمكنه ذلك دون تغيير الوصول.

    تنسيق هدف الرسائل المباشرة للتسليم:

    - `user:<id>`
    - إشارة `<@id>`

    تُحل معرّفات الأرقام المجردة عادة كمعرّفات قنوات عندما يكون افتراضي قناة نشطًا، لكن المعرّفات المدرجة في `allowFrom` الفعالة للرسائل المباشرة في الحساب تُعامل كأهداف رسائل مباشرة للمستخدمين لأغراض التوافق.

  </Tab>

  <Tab title="DM access groups">
    يمكن أن تستخدم رسائل Discord المباشرة إدخالات `accessGroup:<name>` ديناميكية في `channels.discord.allowFrom`.

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

    لا تحتوي قناة نصية في Discord على قائمة أعضاء منفصلة. يمثّل `type: "discord.channelAudience"` العضوية كالتالي: مرسل الرسالة المباشرة عضو في الخادم المكوّن ولديه حاليًا إذن `ViewChannel` فعّال على القناة المكوّنة بعد تطبيق أدوار القناة وتجاوزاتها.

    مثال: السماح لأي شخص يمكنه رؤية `#maintainers` بمراسلة الروبوت مباشرة، مع إبقاء الرسائل المباشرة مغلقة أمام الجميع.

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

    تفشل عمليات البحث بإغلاق الوصول. إذا أعاد Discord `Missing Access`، أو فشل البحث عن العضو، أو كانت القناة تنتمي إلى خادم مختلف، فيُعامل مرسل الرسالة المباشرة كغير مخوّل.

    فعّل **Server Members Intent** في بوابة مطوري Discord للروبوت عند استخدام مجموعات الوصول القائمة على جمهور القناة. لا تتضمن الرسائل المباشرة حالة عضو الخادم، لذلك يحل OpenClaw العضو عبر Discord REST وقت التفويض.

  </Tab>

  <Tab title="Guild policy">
    يتحكم `channels.discord.groupPolicy` في معالجة الخوادم:

    - `open`
    - `allowlist`
    - `disabled`

    خط الأساس الآمن عند وجود `channels.discord` هو `allowlist`.

    سلوك `allowlist`:

    - يجب أن يطابق الخادم `channels.discord.guilds` (يفضّل `id`، ويُقبل slug)
    - قوائم سماح اختيارية للمرسلين: `users` (يوصى بالمعرّفات الثابتة) و`roles` (معرّفات الأدوار فقط)؛ إذا تم تكوين أي منهما، يُسمح للمرسلين عندما يطابقون `users` أو `roles`
    - مطابقة الاسم/الوسم المباشرة معطلة افتراضيًا؛ فعّل `channels.discord.dangerouslyAllowNameMatching: true` فقط كوضع توافق لكسر الحظر عند الضرورة
    - الأسماء/الوسوم مدعومة لـ `users`، لكن المعرّفات أكثر أمانًا؛ يحذّر `openclaw security audit` عند استخدام إدخالات الاسم/الوسم
    - إذا كان للخادم `channels` مكوّنة، فستُرفض القنوات غير المدرجة
    - إذا لم يكن للخادم كتلة `channels`، فتُسمح كل القنوات في ذلك الخادم الموجود في قائمة السماح

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

    إذا عيّنت `DISCORD_BOT_TOKEN` فقط ولم تنشئ كتلة `channels.discord`، فإن التراجع وقت التشغيل يكون `groupPolicy="allowlist"` (مع تحذير في السجلات)، حتى إذا كان `channels.defaults.groupPolicy` هو `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    تُقيّد رسائل الخوادم بالإشارات افتراضيًا.

    يتضمن اكتشاف الإشارات:

    - إشارة صريحة إلى الروبوت
    - أنماط الإشارة المكوّنة (`agents.list[].groupChat.mentionPatterns`، مع تراجع إلى `messages.groupChat.mentionPatterns`)
    - سلوك الرد الضمني على الروبوت في الحالات المدعومة

    يتم تكوين `requireMention` لكل خادم/قناة (`channels.discord.guilds...`).
    يسقط `ignoreOtherMentions` اختياريًا الرسائل التي تشير إلى مستخدم/دور آخر دون الروبوت (باستثناء @everyone/@here).

    الرسائل المباشرة الجماعية:

    - الافتراضي: متجاهلة (`dm.groupEnabled=false`)
    - قائمة سماح اختيارية عبر `dm.groupChannels` (معرّفات القنوات أو slugs)

  </Tab>
</Tabs>

### توجيه الوكلاء بناءً على الأدوار

استخدم `bindings[].match.roles` لتوجيه أعضاء خادم Discord إلى وكلاء مختلفين حسب معرّف الدور. لا تقبل الروابط القائمة على الأدوار إلا معرّفات الأدوار، وتُقيّم بعد روابط النظير أو النظير الأصل وقبل الروابط الخاصة بالخادم فقط. إذا عيّن رابط حقول مطابقة أخرى أيضًا (مثل `peer` + `guildId` + `roles`)، فيجب أن تطابق جميع الحقول المكوّنة.

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

## الأوامر الأصلية وتفويض الأوامر

- تكون `commands.native` افتراضيًا `"auto"` ومفعّلة لـ Discord.
- التجاوز لكل قناة: `channels.discord.commands.native`.
- يؤدي `commands.native=false` إلى مسح أوامر Discord الأصلية المسجلة سابقًا صراحة.
- يستخدم تفويض الأوامر الأصلية قوائم السماح/السياسات نفسها في Discord مثل معالجة الرسائل العادية.
- قد تظل الأوامر مرئية في واجهة Discord للمستخدمين غير المخوّلين؛ ومع ذلك يفرض التنفيذ تفويض OpenClaw ويعيد "not authorized".

راجع [الأوامر المائلة](/ar/tools/slash-commands) للاطلاع على كتالوج الأوامر وسلوكها.

إعدادات أوامر الشرطة المائلة الافتراضية:

- `ephemeral: true`

## تفاصيل الميزة

<AccordionGroup>
  <Accordion title="وسوم الردود والردود الأصلية">
    يدعم Discord وسوم الرد في مخرجات الوكيل:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    يتم التحكم فيها عبر `channels.discord.replyToMode`:

    - `off` (الافتراضي)
    - `first`
    - `all`
    - `batched`

    ملاحظة: يعطّل `off` إنشاء سلاسل الردود الضمنية. تظل وسوم `[[reply_to_*]]` الصريحة محترمة.
    يرفق `first` دائمًا مرجع الرد الأصلي الضمني بأول رسالة Discord صادرة للدور.
    يرفق `batched` مرجع الرد الأصلي الضمني في Discord فقط عندما يكون
    الدور الوارد دفعة مؤجلة من عدة رسائل. يفيد هذا
    عندما تريد الردود الأصلية أساسًا للمحادثات المتدفقة الملتبسة، لا لكل
    دور من رسالة واحدة.

    تُعرض معرّفات الرسائل في السياق/السجل حتى تتمكن الوكلاء من استهداف رسائل محددة.

  </Accordion>

  <Accordion title="معاينة البث المباشر">
    يستطيع OpenClaw بث مسودات الردود عبر إرسال رسالة مؤقتة وتعديلها مع وصول النص. يأخذ `channels.discord.streaming` القيم `off` (الافتراضي) | `partial` | `block` | `progress`. تُطابق `progress` إلى `partial` على Discord؛ و`streamMode` اسم بديل قديم ويُرحّل تلقائيًا.

    يبقى الافتراضي `off` لأن تعديلات المعاينة في Discord تصل إلى حدود المعدل بسرعة عندما تتشارك عدة بوتات أو Gateways حسابًا واحدًا.

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
    - يصدر `block` أجزاء بحجم المسودة (استخدم `draftChunk` لضبط الحجم ونقاط الفصل، مع تقييده إلى `textChunkLimit`).
    - تلغي الوسائط والأخطاء والردود النهائية الصريحة الرد تعديلات المعاينة المعلّقة.
    - يتحكم `streaming.preview.toolProgress` (الافتراضي `true`) فيما إذا كانت تحديثات الأداة/التقدم تعيد استخدام رسالة المعاينة.

    بث المعاينة نصي فقط؛ تعود ردود الوسائط إلى التسليم العادي. عند تفعيل بث `block` صراحةً، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

  </Accordion>

  <Accordion title="السجل والسياق وسلوك السلاسل">
    سياق سجل الخادم:

    - القيمة الافتراضية لـ `channels.discord.historyLimit` هي `20`
    - الاحتياطي: `messages.groupChat.historyLimit`
    - يعطّل `0` ذلك

    عناصر التحكم في سجل الرسائل المباشرة:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    سلوك السلاسل:

    - تُوجّه سلاسل Discord كجلسات قنوات وترث إعدادات القناة الأصلية ما لم يتم تجاوزها.
    - ترث جلسات السلاسل اختيار `/model` على مستوى جلسة القناة الأصلية كاحتياطي للنموذج فقط؛ تظل اختيارات `/model` المحلية للسلسلة ذات أولوية، ولا يُنسخ سجل النصوص الأصلية ما لم يكن وراثة النصوص مفعلة.
    - يختار `channels.discord.thread.inheritParent` (الافتراضي `false`) إدخال السلاسل التلقائية الجديدة في التهيئة من نص القناة الأصلية. توجد التجاوزات الخاصة بكل حساب تحت `channels.discord.accounts.<id>.thread.inheritParent`.
    - يمكن لتفاعلات أداة الرسائل حل أهداف الرسائل المباشرة `user:<id>`.
    - يُحفظ `guilds.<guild>.channels.<channel>.requireMention: false` أثناء احتياطي تفعيل مرحلة الرد.

    تُحقن مواضيع القنوات كسياق **غير موثوق**. تتحكم قوائم السماح في من يستطيع تشغيل الوكيل، وليست حدًا كاملًا لتنقيح السياق التكميلي.

  </Accordion>

  <Accordion title="جلسات مربوطة بالسلاسل للوكلاء الفرعيين">
    يستطيع Discord ربط سلسلة بهدف جلسة بحيث تستمر رسائل المتابعة في تلك السلسلة في التوجيه إلى الجلسة نفسها (بما في ذلك جلسات الوكلاء الفرعيين).

    الأوامر:

    - `/focus <target>` اربط السلسلة الحالية/الجديدة بهدف وكيل فرعي/جلسة
    - `/unfocus` أزل ربط السلسلة الحالية
    - `/agents` اعرض التشغيلات النشطة وحالة الربط
    - `/session idle <duration|off>` افحص/حدّث إلغاء التركيز التلقائي عند عدم النشاط للروابط المركزة
    - `/session max-age <duration|off>` افحص/حدّث الحد الأقصى الصارم للعمر للروابط المركزة

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

    - يضبط `session.threadBindings.*` الافتراضيات العامة.
    - يتجاوز `channels.discord.threadBindings.*` سلوك Discord.
    - يتحكم `spawnSessions` في إنشاء/ربط السلاسل تلقائيًا لـ `sessions_spawn({ thread: true })` وعمليات إنشاء سلاسل ACP. الافتراضي: `true`.
    - يتحكم `defaultSpawnContext` في سياق الوكيل الفرعي الأصلي لعمليات الإنشاء المربوطة بالسلاسل. الافتراضي: `"fork"`.
    - تُرحّل المفاتيح المهملة `spawnSubagentSessions`/`spawnAcpSessions` بواسطة `openclaw doctor --fix`.
    - إذا كانت روابط السلاسل معطلة لحساب ما، فلن تتوفر `/focus` وعمليات ربط السلاسل ذات الصلة.

    راجع [الوكلاء الفرعيون](/ar/tools/subagents)، و[وكلاء ACP](/ar/tools/acp-agents)، و[مرجع التكوين](/ar/gateway/configuration-reference).

  </Accordion>

  <Accordion title="روابط قنوات ACP المستمرة">
    لمساحات عمل ACP مستقرة "دائمة التشغيل"، كوّن روابط ACP مكتوبة على المستوى الأعلى تستهدف محادثات Discord.

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

    - يربط `/acp spawn codex --bind here` القناة أو السلسلة الحالية في مكانها، ويُبقي الرسائل المستقبلية على جلسة ACP نفسها. ترث رسائل السلسلة ربط القناة الأصلية.
    - في قناة أو سلسلة مربوطة، يعيد `/new` و`/reset` تعيين جلسة ACP نفسها في مكانها. يمكن لروابط السلاسل المؤقتة تجاوز حل الهدف أثناء نشاطها.
    - يتحكم `spawnSessions` في إنشاء/ربط السلاسل التابعة عبر `--thread auto|here`.

    راجع [وكلاء ACP](/ar/tools/acp-agents) لتفاصيل سلوك الربط.

  </Accordion>

  <Accordion title="إشعارات التفاعلات">
    وضع إشعارات التفاعلات لكل خادم:

    - `off`
    - `own` (الافتراضي)
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
    - احتياطي رمز تعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يقبل Discord الرموز التعبيرية الموحّدة أو أسماء الرموز التعبيرية المخصصة.
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="كتابات الإعدادات">
    تكون كتابات الإعدادات التي تبدأها القناة مفعلة افتراضيًا.

    يؤثر هذا في تدفقات `/config set|unset` (عندما تكون ميزات الأوامر مفعلة).

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
    - تُطابق أسماء عرض الأعضاء بالاسم/المعرّف النصي فقط عندما تكون `channels.discord.dangerouslyAllowNameMatching: true`
    - تستخدم عمليات البحث معرّف الرسالة الأصلي وتكون مقيدة بنافذة زمنية
    - إذا فشل البحث، تُعامل الرسائل الممررة كرسائل بوت وتُسقط ما لم يكن `allowBots=true`

  </Accordion>

  <Accordion title="أسماء مستعارة للإشارات الصادرة">
    استخدم `mentionAliases` عندما تحتاج الوكلاء إلى إشارات صادرة حتمية لمستخدمي Discord معروفين. المفاتيح هي المعالجات من دون `@` البادئة؛ والقيم هي معرّفات مستخدمي Discord. تُترك المعالجات غير المعروفة و`@everyone` و`@here` والإشارات داخل نطاقات كود Markdown دون تغيير.

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

  <Accordion title="تكوين الحضور">
    تُطبق تحديثات الحضور عند ضبط حقل حالة أو نشاط، أو عند تفعيل الحضور التلقائي.

    مثال الحالة فقط:

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    مثال النشاط (الحالة المخصصة هي نوع النشاط الافتراضي):

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

    مثال البث:

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
    - 2: يستمع
    - 3: يشاهد
    - 4: مخصص (يستخدم نص النشاط كحالة الحالة؛ الرمز التعبيري اختياري)
    - 5: ينافس

    مثال الحضور التلقائي (إشارة صحة وقت التشغيل):

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

    يطابق الحضور التلقائي توفر وقت التشغيل مع حالة Discord: سليم => متصل، متدهور أو غير معروف => خامل، مستنفد أو غير متاح => عدم الإزعاج. تجاوزات النص الاختيارية:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (يدعم العنصر النائب `{reason}`)

  </Accordion>

  <Accordion title="الموافقات في Discord">
    يدعم Discord التعامل مع الموافقات المستندة إلى الأزرار في الرسائل المباشرة، ويمكنه اختياريًا نشر مطالبات الموافقة في القناة الأصلية.

    مسار الإعداد:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختياري؛ يعود إلى `commands.ownerAllowFrom` عندما يكون ذلك ممكنًا)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
    - `agentFilter`، و`sessionFilter`، و`cleanupAfterResolve`

    يفعّل Discord موافقات التنفيذ الأصلية تلقائيًا عندما يكون `enabled` غير مضبوط أو `"auto"` ويمكن حل موافق واحد على الأقل، إما من `execApprovals.approvers` أو من `commands.ownerAllowFrom`. لا يستنتج Discord موافقي التنفيذ من `allowFrom` الخاصة بالقناة، أو `dm.allowFrom` القديمة، أو `defaultTo` الخاصة بالرسائل المباشرة. اضبط `enabled: false` لتعطيل Discord صراحةً كعميل موافقة أصلي.

    بالنسبة إلى أوامر المجموعات الحساسة المقتصرة على المالك فقط مثل `/diagnostics` و`/export-trajectory`، يرسل OpenClaw مطالبات الموافقة والنتائج النهائية بشكل خاص. يحاول استخدام رسالة Discord مباشرة أولاً عندما يكون للمالك المستدعي مسار مالك عبر Discord؛ وإذا لم يكن ذلك متاحاً، يعود إلى أول مسار مالك متاح من `commands.ownerAllowFrom`، مثل Telegram.

    عندما تكون قيمة `target` هي `channel` أو `both`، تكون مطالبة الموافقة مرئية في القناة. يمكن للموافقين المحلولين فقط استخدام الأزرار؛ ويتلقى المستخدمون الآخرون رفضاً عابراً. تتضمن مطالبات الموافقة نص الأمر، لذلك لا تفعّل تسليم القناة إلا في القنوات الموثوقة. إذا تعذر اشتقاق معرّف القناة من مفتاح الجلسة، يعود OpenClaw إلى التسليم عبر رسالة مباشرة.

    يعرض Discord أيضاً أزرار الموافقة المشتركة التي تستخدمها قنوات الدردشة الأخرى. يضيف محوّل Discord الأصلي بشكل أساسي توجيه الرسائل المباشرة للموافقين والتوزيع على القنوات.
    عندما تكون هذه الأزرار موجودة، فهي تجربة الموافقة الأساسية؛ ويجب على OpenClaw
    تضمين أمر `/approve` يدوي فقط عندما تشير نتيجة الأداة إلى أن
    موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.
    إذا لم يكن وقت تشغيل الموافقة الأصلي في Discord نشطاً، يبقي OpenClaw مطالبة
    `/approve <id> <decision>` المحلية الحتمية مرئية. وإذا كان
    وقت التشغيل نشطاً ولكن تعذر تسليم بطاقة أصلية إلى أي هدف،
    يرسل OpenClaw إشعار رجوع في الدردشة نفسها يتضمن أمر `/approve`
    الدقيق من الموافقة المعلّقة.

    تتبع مصادقة Gateway وحلّ الموافقات عقد عميل Gateway المشترك (تُحل معرّفات `plugin:` عبر `plugin.approval.resolve`؛ وتُحل المعرّفات الأخرى عبر `exec.approval.resolve`). تنتهي صلاحية الموافقات بعد 30 دقيقة افتراضياً.

    راجع [موافقات Exec](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## الأدوات وبوابات الإجراءات

تتضمن إجراءات رسائل Discord إجراءات المراسلة وإدارة القنوات والإشراف والحضور والبيانات الوصفية.

أمثلة أساسية:

- المراسلة: `sendMessage`، `readMessages`، `editMessage`، `deleteMessage`، `threadReply`
- التفاعلات: `react`، `reactions`، `emojiList`
- الإشراف: `timeout`، `kick`، `ban`
- الحضور: `setPresence`

يقبل الإجراء `event-create` معلمة اختيارية `image` (عنوان URL أو مسار ملف محلي) لتعيين صورة غلاف الحدث المجدول.

توجد بوابات الإجراءات ضمن `channels.discord.actions.*`.

سلوك البوابة الافتراضي:

| مجموعة الإجراءات                                                                                                                                                             | الافتراضي  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| التفاعلات، الرسائل، السلاسل، التثبيتات، استطلاعات الرأي، البحث، معلومات الأعضاء، معلومات الأدوار، معلومات القنوات، القنوات، حالة الصوت، الأحداث، الملصقات، تحميلات الرموز التعبيرية، تحميلات الملصقات، الأذونات | مفعّل  |
| الأدوار                                                                                                                                                                    | معطّل |
| الإشراف                                                                                                                                                               | معطّل |
| الحضور                                                                                                                                                                 | معطّل |

## واجهة مستخدم المكوّنات v2

يستخدم OpenClaw مكوّنات Discord v2 لموافقات exec وعلامات السياقات المتقاطعة. يمكن لإجراءات رسائل Discord أيضاً قبول `components` لواجهة مستخدم مخصصة (متقدم؛ يتطلب إنشاء حمولة مكوّن عبر أداة discord)، بينما تظل `embeds` القديمة متاحة لكنها غير موصى بها.

- يعيّن `channels.discord.ui.components.accentColor` لون التمييز المستخدم في حاويات مكوّنات Discord (hex).
- عيّنه لكل حساب باستخدام `channels.discord.accounts.<id>.ui.components.accentColor`.
- يتم تجاهل `embeds` عند وجود المكوّنات v2.

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
2. فعّل Server Members Intent عند استخدام قوائم سماح الأدوار/المستخدمين.
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
- يتجاوز `voice.model` نموذج LLM المستخدم لاستجابات قناة Discord الصوتية فقط. اتركه غير معيّن ليرث نموذج الوكيل الموجّه.
- يستخدم STT `tools.media.audio`؛ ولا يؤثر `voice.model` في النسخ.
- تنطبق تجاوزات `systemPrompt` الخاصة بكل قناة في Discord على أدوار نسخ الصوت لتلك القناة الصوتية.
- تستمد أدوار نسخ الصوت حالة المالك من `allowFrom` في Discord (أو `dm.allowFrom`)؛ ولا يمكن للمتحدثين غير المالكين الوصول إلى أدوات المالك فقط (مثل `gateway` و`cron`).
- صوت Discord اختياري لإعدادات النص فقط؛ عيّن `channels.discord.voice.enabled=true` (أو أبقِ كتلة `channels.discord.voice` موجودة) لتفعيل أوامر `/vc` ووقت تشغيل الصوت وهدف Gateway `GuildVoiceStates`.
- يمكن لـ `channels.discord.intents.voiceStates` تجاوز اشتراك هدف حالة الصوت صراحة. اتركه غير معيّن ليتبع الهدف تفعيل الصوت الفعّال.
- يمرر `voice.daveEncryption` و`voice.decryptionFailureTolerance` إلى خيارات الانضمام في `@discordjs/voice`.
- القيم الافتراضية لـ `@discordjs/voice` هي `daveEncryption=true` و`decryptionFailureTolerance=24` إذا لم تُعيّن.
- يتحكم `voice.connectTimeoutMs` في انتظار Ready الأولي لـ `@discordjs/voice` عند محاولات `/vc join` والانضمام التلقائي. الافتراضي: `30000`.
- يتحكم `voice.reconnectGraceMs` في مدة انتظار OpenClaw لجلسة صوتية منقطعة كي تبدأ إعادة الاتصال قبل تدميرها. الافتراضي: `15000`.
- يراقب OpenClaw أيضاً إخفاقات فك تشفير الاستقبال ويتعافى تلقائياً بمغادرة قناة الصوت وإعادة الانضمام إليها بعد إخفاقات متكررة ضمن نافذة قصيرة.
- إذا أظهرت سجلات الاستقبال مراراً `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` بعد التحديث، فاجمع تقرير اعتماديات وسجلات. يتضمن سطر `@discordjs/voice` المضمّن إصلاح الحشو من المصدر العلوي في PR #11449 الخاص بـ discord.js، والذي أغلق issue #11419 في discord.js.

مسار معالجة قناة الصوت:

- يتم تحويل التقاط Discord PCM إلى ملف WAV مؤقت.
- يتولى `tools.media.audio` معالجة STT، مثل `openai/gpt-4o-mini-transcribe`.
- يُرسل النص المنسوخ عبر إدخال Discord والتوجيه بينما يعمل LLM الاستجابة بسياسة إخراج صوتي تخفي أداة `tts` الخاصة بالوكيل وتطلب نصاً مُعاداً، لأن صوت Discord يملك تشغيل TTS النهائي.
- عند تعيين `voice.model`، فإنه يتجاوز LLM الاستجابة فقط لهذا الدور في قناة الصوت.
- يُدمج `voice.tts` فوق `messages.tts`؛ ويتم تشغيل الصوت الناتج في القناة المنضم إليها.

تُحل بيانات الاعتماد لكل مكوّن: مصادقة مسار LLM لـ `voice.model`، ومصادقة STT لـ `tools.media.audio`، ومصادقة TTS لـ `messages.tts`/`voice.tts`.

### الرسائل الصوتية

تعرض رسائل Discord الصوتية معاينة موجة وتتطلب صوت OGG/Opus. ينشئ OpenClaw الموجة تلقائياً، لكنه يحتاج إلى `ffmpeg` و`ffprobe` على مضيف Gateway للفحص والتحويل.

- وفّر **مسار ملف محلي** (تُرفض عناوين URL).
- احذف محتوى النص (يرفض Discord النص + الرسالة الصوتية في الحمولة نفسها).
- يُقبل أي تنسيق صوتي؛ يحوّله OpenClaw إلى OGG/Opus عند الحاجة.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="استخدام intents غير مسموح بها أو لا يرى البوت رسائل guild">

    - فعّل Message Content Intent
    - فعّل Server Members Intent عندما تعتمد على حل المستخدم/العضو
    - أعد تشغيل Gateway بعد تغيير intents

  </Accordion>

  <Accordion title="حُظرت رسائل guild بشكل غير متوقع">

    - تحقق من `groupPolicy`
    - تحقق من قائمة سماح guild ضمن `channels.discord.guilds`
    - إذا كانت خريطة `channels` الخاصة بـ guild موجودة، فلا يُسمح إلا بالقنوات المدرجة
    - تحقق من سلوك `requireMention` وأنماط الإشارة

    فحوصات مفيدة:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false but still blocked">
    أسباب شائعة:

    - `groupPolicy="allowlist"` من دون قائمة سماح مطابقة لـ guild/القناة
    - تم ضبط `requireMention` في المكان الخطأ (يجب أن يكون ضمن `channels.discord.guilds` أو إدخال القناة)
    - المرسل محظور بواسطة قائمة سماح `users` الخاصة بـ guild/القناة

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    سجلات نموذجية:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    مقابض ضبط قائمة انتظار Discord Gateway:

    - حساب واحد: `channels.discord.eventQueue.listenerTimeout`
    - حسابات متعددة: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - يتحكم هذا فقط في عمل مستمع Discord Gateway، وليس عمر دور الوكيل

    لا يطبق Discord مهلة مملوكة للقناة على أدوار الوكيل الموضوعة في قائمة الانتظار. يسلّم مستمعو الرسائل فوراً، وتحافظ عمليات Discord الموضوعة في قائمة الانتظار على ترتيب كل جلسة حتى تكتمل دورة حياة الجلسة/الأداة/وقت التشغيل أو تُجهض العمل.

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

  <Accordion title="Gateway metadata lookup timeout warnings">
    يجلب OpenClaw بيانات Discord `/gateway/bot` الوصفية قبل الاتصال. تعود الإخفاقات العابرة إلى عنوان URL الافتراضي لـ Gateway في Discord وتكون محدودة المعدل في السجلات.

    مقابض ضبط مهلة البيانات الوصفية:

    - حساب واحد: `channels.discord.gatewayInfoTimeoutMs`
    - حسابات متعددة: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - بديل env عند عدم تعيين الإعداد: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - الافتراضي: `30000` (30 ثانية)، الحد الأقصى: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    ينتظر OpenClaw حدث `READY` الخاص بـ Gateway في Discord أثناء بدء التشغيل وبعد إعادة اتصال وقت التشغيل. قد تحتاج إعدادات الحسابات المتعددة مع تدرّج بدء التشغيل إلى نافذة READY أطول عند بدء التشغيل من الافتراضي.

    مقابض ضبط مهلة READY:

    - بدء التشغيل بحساب واحد: `channels.discord.gatewayReadyTimeoutMs`
    - بدء التشغيل بحسابات متعددة: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - الرجوع إلى متغير البيئة عند بدء التشغيل عندما لا يكون الإعداد مضبوطا: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - القيمة الافتراضية عند بدء التشغيل: `15000` (15 ثانية)، الحد الأقصى: `120000`
    - وقت التشغيل بحساب واحد: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - وقت التشغيل بحسابات متعددة: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - الرجوع إلى متغير البيئة في وقت التشغيل عندما لا يكون الإعداد مضبوطا: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - القيمة الافتراضية في وقت التشغيل: `30000` (30 ثانية)، الحد الأقصى: `120000`

  </Accordion>

  <Accordion title="عدم تطابقات تدقيق الأذونات">
    لا تعمل فحوصات أذونات `channels status --probe` إلا مع معرفات القنوات الرقمية.

    إذا استخدمت مفاتيح slug، فقد تظل المطابقة في وقت التشغيل تعمل، لكن probe لا يمكنه التحقق من الأذونات بالكامل.

  </Accordion>

  <Accordion title="مشكلات الرسائل المباشرة والاقتران">

    - الرسائل المباشرة معطلة: `channels.discord.dm.enabled=false`
    - سياسة الرسائل المباشرة معطلة: `channels.discord.dmPolicy="disabled"` (قديم: `channels.discord.dm.policy`)
    - بانتظار موافقة الاقتران في وضع `pairing`

  </Accordion>

  <Accordion title="حلقات Bot إلى Bot">
    افتراضيا، يتم تجاهل الرسائل التي يكتبها Bot.

    إذا ضبطت `channels.discord.allowBots=true`، فاستخدم قواعد صارمة للذكر وقائمة السماح لتجنب سلوك الحلقات.
    يفضل استخدام `channels.discord.allowBots="mentions"` لقبول رسائل Bot التي تذكر Bot فقط.

  </Accordion>

  <Accordion title="سقوط Voice STT مع DecryptionFailed(...)">

    - أبق OpenClaw محدثا (`openclaw update`) حتى يكون منطق استعادة استقبال صوت Discord موجودا
    - تأكد من `channels.discord.voice.daveEncryption=true` (افتراضي)
    - ابدأ من `channels.discord.voice.decryptionFailureTolerance=24` (افتراضي upstream) واضبطه فقط عند الحاجة
    - راقب السجلات بحثا عن:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - إذا استمرت الإخفاقات بعد إعادة الانضمام التلقائية، فاجمع السجلات وقارنها بسجل استقبال DAVE upstream في [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) و[discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

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
- البث: `streaming` (اسم بديل قديم: `streamMode`)، `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- الوسائط/إعادة المحاولة: `mediaMaxMb` (يحد من تحميلات Discord الصادرة، الافتراضي `100MB`)، `retry`
- الإجراءات: `actions.*`
- الحضور: `activity`, `status`, `activityType`, `activityUrl`
- واجهة المستخدم: `ui.components.accentColor`
- الميزات: `threadBindings`, المستوى الأعلى `bindings[]` (`type: "acp"`)، `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## السلامة والعمليات

- تعامل مع رموز Bot كأسرار (يفضل `DISCORD_BOT_TOKEN` في البيئات الخاضعة للإشراف).
- امنح أذونات Discord بأقل صلاحية لازمة.
- إذا كانت حالة نشر/حالة الأوامر قديمة، فأعد تشغيل Gateway وأعد الفحص باستخدام `openclaw channels status --probe`.

## ذات صلة

<CardGroup cols={2}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    قم بإقران مستخدم Discord مع Gateway.
  </Card>
  <Card title="المجموعات" icon="users" href="/ar/channels/groups">
    سلوك دردشة المجموعات وقائمة السماح.
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
  <Card title="أوامر Slash" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي.
  </Card>
</CardGroup>

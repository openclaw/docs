---
read_when:
    - العمل على ميزات قناة Discord
summary: حالة دعم بوت Discord وإمكاناته وتكوينه
title: Discord
x-i18n:
    generated_at: "2026-05-07T13:13:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 805a093452b7af1c844919cdf776d898c6fd39f63f1bf363967dd471842eebd5
    source_path: channels/discord.md
    workflow: 16
---

جاهز للرسائل المباشرة وقنوات الخادم عبر Gateway الرسمي لـ Discord.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    تنتقل رسائل Discord المباشرة افتراضيًا إلى وضع الاقتران.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وفهرس الأوامر.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    التشخيصات عبر القنوات ومسار الإصلاح.
  </Card>
</CardGroup>

## الإعداد السريع

ستحتاج إلى إنشاء تطبيق جديد يحتوي على بوت، وإضافة البوت إلى خادمك، وإقرانه مع OpenClaw. نوصي بإضافة البوت إلى خادمك الخاص. إذا لم يكن لديك خادم بعد، [فأنشئ واحدًا أولًا](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (اختر **إنشاء خادمي الخاص > لي ولأصدقائي**).

<Steps>
  <Step title="إنشاء تطبيق Discord وبوت">
    انتقل إلى [بوابة مطوري Discord](https://discord.com/developers/applications) وانقر **تطبيق جديد**. سمّه باسم مثل "OpenClaw".

    انقر **البوت** في الشريط الجانبي. اضبط **اسم المستخدم** على الاسم الذي تطلقه على وكيل OpenClaw لديك.

  </Step>

  <Step title="تفعيل النوايا المميزة">
    وأنت لا تزال في صفحة **البوت**، مرّر لأسفل إلى **Privileged Gateway Intents** وفعّل:

    - **Message Content Intent** (مطلوب)
    - **Server Members Intent** (موصى به؛ مطلوب لقوائم السماح المستندة إلى الأدوار ومطابقة الاسم مع المعرّف)
    - **Presence Intent** (اختياري؛ مطلوب فقط لتحديثات الحضور)

  </Step>

  <Step title="نسخ رمز البوت">
    مرّر إلى أعلى صفحة **البوت** مجددًا وانقر **إعادة تعيين الرمز**.

    <Note>
    على الرغم من الاسم، سيؤدي ذلك إلى إنشاء رمزك الأول — لا يتم "إعادة تعيين" أي شيء.
    </Note>

    انسخ الرمز واحفظه في مكان ما. هذا هو **رمز البوت** وستحتاج إليه بعد قليل.

  </Step>

  <Step title="إنشاء عنوان URL للدعوة وإضافة البوت إلى خادمك">
    انقر **OAuth2** في الشريط الجانبي. ستنشئ عنوان URL للدعوة بالصلاحيات المناسبة لإضافة البوت إلى خادمك.

    مرّر لأسفل إلى **مولّد عنوان URL لـ OAuth2** وفعّل:

    - `bot`
    - `applications.commands`

    سيظهر قسم **صلاحيات البوت** أدناه. فعّل على الأقل:

    **الصلاحيات العامة**
      - عرض القنوات
    **صلاحيات النصوص**
      - إرسال الرسائل
      - قراءة سجل الرسائل
      - تضمين الروابط
      - إرفاق الملفات
      - إضافة التفاعلات (اختياري)

    هذه هي المجموعة الأساسية للقنوات النصية العادية. إذا كنت تخطط للنشر في سلاسل Discord، بما في ذلك سير عمل قنوات المنتديات أو الوسائط التي تنشئ سلسلة أو تتابعها، ففعّل أيضًا **إرسال الرسائل في السلاسل**.
    انسخ عنوان URL المُنشأ في الأسفل، والصقه في متصفحك، وحدد خادمك، ثم انقر **متابعة** للاتصال. يجب أن ترى الآن البوت في خادم Discord.

  </Step>

  <Step title="تفعيل وضع المطور وجمع معرّفاتك">
    في تطبيق Discord، تحتاج إلى تفعيل وضع المطور حتى تتمكن من نسخ المعرّفات الداخلية.

    1. انقر **إعدادات المستخدم** (أيقونة الترس بجوار صورتك الرمزية) → **متقدم** → فعّل **وضع المطور**
    2. انقر بزر الفأرة الأيمن على **أيقونة الخادم** في الشريط الجانبي → **نسخ معرّف الخادم**
    3. انقر بزر الفأرة الأيمن على **صورتك الرمزية** → **نسخ معرّف المستخدم**

    احفظ **معرّف الخادم** و**معرّف المستخدم** بجانب رمز البوت — سترسل الثلاثة كلها إلى OpenClaw في الخطوة التالية.

  </Step>

  <Step title="السماح بالرسائل المباشرة من أعضاء الخادم">
    لكي يعمل الاقتران، يحتاج Discord إلى السماح للبوت بإرسال رسالة مباشرة إليك. انقر بزر الفأرة الأيمن على **أيقونة الخادم** → **إعدادات الخصوصية** → فعّل **الرسائل المباشرة**.

    يتيح هذا لأعضاء الخادم (بما في ذلك البوتات) إرسال رسائل مباشرة إليك. أبقِ هذا مفعّلًا إذا كنت تريد استخدام رسائل Discord المباشرة مع OpenClaw. إذا كنت تخطط لاستخدام قنوات الخادم فقط، يمكنك تعطيل الرسائل المباشرة بعد الاقتران.

  </Step>

  <Step title="ضبط رمز البوت بأمان (لا ترسله في المحادثة)">
    رمز بوت Discord لديك سرّ (مثل كلمة مرور). اضبطه على الجهاز الذي يشغّل OpenClaw قبل مراسلة وكيلك.

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
    بالنسبة إلى عمليات تثبيت الخدمة المُدارة، شغّل `openclaw gateway install` من صدفة يتوفر فيها `DISCORD_BOT_TOKEN`، أو خزّن المتغير في `~/.openclaw/.env`، حتى تتمكن الخدمة من حل SecretRef الخاص بالبيئة بعد إعادة التشغيل.
    إذا كان مضيفك محظورًا أو محدود المعدل بسبب بحث Discord عن تطبيق بدء التشغيل، فاضبط معرّف تطبيق/عميل Discord من بوابة المطورين حتى يتخطى بدء التشغيل استدعاء REST ذلك. استخدم `channels.discord.applicationId` للحساب الافتراضي، أو `channels.discord.accounts.<accountId>.applicationId` عند تشغيل عدة بوتات Discord.

  </Step>

  <Step title="تكوين OpenClaw والاقتران">

    <Tabs>
      <Tab title="اسأل وكيلك">
        تحدّث مع وكيل OpenClaw لديك على أي قناة موجودة (مثل Telegram) وأخبره. إذا كانت Discord هي قناتك الأولى، فاستخدم تبويب CLI / التكوين بدلًا من ذلك.

        > "لقد ضبطت بالفعل رمز بوت Discord في التكوين. يُرجى إكمال إعداد Discord باستخدام معرّف المستخدم `<user_id>` ومعرّف الخادم `<server_id>`."
      </Tab>
      <Tab title="CLI / التكوين">
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

        بديل env للحساب الافتراضي:

```bash
DISCORD_BOT_TOKEN=...
```

        للإعداد البرمجي أو البعيد، اكتب كتلة JSON5 نفسها باستخدام `openclaw config patch --file ./discord.patch.json5 --dry-run` ثم أعد التشغيل بدون `--dry-run`. قيم `token` النصية العادية مدعومة. قيم SecretRef مدعومة أيضًا لـ `channels.discord.token` عبر موفري env/file/exec. راجع [إدارة الأسرار](/ar/gateway/secrets).

        بالنسبة إلى عدة بوتات Discord، أبقِ رمز كل بوت ومعرّف التطبيق الخاص به ضمن حسابه. يرث كل حساب `channels.discord.applicationId` من المستوى الأعلى، لذا لا تضبطه هناك إلا عندما يجب أن يستخدم كل حساب معرّف التطبيق نفسه.

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
    انتظر حتى يكون Gateway قيد التشغيل، ثم أرسل رسالة مباشرة إلى البوت في Discord. سيرد برمز اقتران.

    <Tabs>
      <Tab title="اسأل وكيلك">
        أرسل رمز الاقتران إلى وكيلك على قناتك الحالية:

        > "وافِق على رمز اقتران Discord هذا: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    تنتهي صلاحية رموز الاقتران بعد ساعة واحدة.

    يجب أن تكون الآن قادرًا على الدردشة مع وكيلك في Discord عبر الرسائل المباشرة.

  </Step>
</Steps>

<Note>
حل الرموز يراعي الحسابات. قيم رمز التكوين لها الأولوية على بديل env. يُستخدم `DISCORD_BOT_TOKEN` للحساب الافتراضي فقط.
إذا كان حسابا Discord مفعّلان يحلان إلى رمز البوت نفسه، فسيبدأ OpenClaw مراقب Gateway واحدًا فقط لذلك الرمز. الرمز الآتي من التكوين له الأولوية على بديل env الافتراضي؛ وإلا يفوز أول حساب مفعّل ويتم الإبلاغ عن تعطيل الحساب المكرر.
بالنسبة إلى الاستدعاءات الصادرة المتقدمة (أداة الرسائل/إجراءات القنوات)، يُستخدم `token` صريح لكل استدعاء لذلك الاستدعاء. ينطبق هذا على إجراءات نمط الإرسال والقراءة/الفحص (مثل read/search/fetch/thread/pins/permissions). لا تزال إعدادات سياسة الحساب/إعادة المحاولة تأتي من الحساب المحدد في لقطة وقت التشغيل النشطة.
</Note>

## موصى به: إعداد مساحة عمل للخادم

بعد أن تعمل الرسائل المباشرة، يمكنك إعداد خادم Discord لديك كمساحة عمل كاملة حيث تحصل كل قناة على جلسة وكيل خاصة بها مع سياقها الخاص. يوصى بهذا للخوادم الخاصة التي لا يوجد فيها إلا أنت وبوتك.

<Steps>
  <Step title="إضافة خادمك إلى قائمة سماح الخوادم">
    يتيح هذا لوكيلك الرد في أي قناة على خادمك، وليس الرسائل المباشرة فقط.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "أضف معرّف خادم Discord الخاص بي `<server_id>` إلى قائمة سماح الخوادم"
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

  <Step title="السماح بالردود دون @إشارة">
    افتراضيًا، لا يرد وكيلك في قنوات الخادم إلا عند الإشارة إليه باستخدام @. بالنسبة إلى خادم خاص، سترغب غالبًا في أن يرد على كل رسالة.

    في قنوات الخادم، تبقى الردود النهائية العادية للمساعد خاصة افتراضيًا. يجب إرسال مخرجات Discord المرئية صراحةً باستخدام أداة `message`، حتى يتمكن الوكيل من البقاء مراقبًا افتراضيًا والنشر فقط عندما يقرر أن الرد في القناة مفيد.

    يعني هذا أن النموذج المحدد يجب أن يستدعي الأدوات بشكل موثوق. إذا أظهر Discord حالة الكتابة وأظهرت السجلات استخدام الرموز لكن لم تُنشر أي رسالة، فتحقق من سجل الجلسة بحثًا عن نص المساعد مع `didSendViaMessagingTool: false`. يعني ذلك أن النموذج أنتج إجابة نهائية خاصة بدلًا من استدعاء `message(action=send)`. انتقل إلى نموذج أقوى في استدعاء الأدوات، أو استخدم التكوين أدناه لاستعادة الردود النهائية التلقائية القديمة.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "اسمح لوكيلي بالرد على هذا الخادم دون الحاجة إلى الإشارة إليه باستخدام @"
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
        إذا احتجت إلى سياق مشترك في كل قناة، فضع التعليمات الثابتة في `AGENTS.md` أو `USER.md` (يتم حقنها في كل جلسة). احتفظ بالملاحظات طويلة الأمد في `MEMORY.md` وادخل إليها عند الطلب باستخدام أدوات الذاكرة.
      </Tab>
    </Tabs>

  </Step>
</Steps>

أنشئ الآن بعض القنوات على خادم Discord لديك وابدأ الدردشة. يستطيع وكيلك رؤية اسم القناة، وتحصل كل قناة على جلستها المعزولة الخاصة — لذا يمكنك إعداد `#coding` أو `#home` أو `#research` أو أي شيء يناسب سير عملك.

## نموذج وقت التشغيل

- يملك Gateway اتصال Discord.
- توجيه الردود حتمي: الردود الواردة من Discord تعود إلى Discord.
- تُضاف بيانات تعريف خادم/قناة Discord إلى مطالبة النموذج كسياق غير موثوق،
  وليس كبادئة رد مرئية للمستخدم. إذا نسخ النموذج ذلك الغلاف
  مرة أخرى، يزيل OpenClaw بيانات التعريف المنسوخة من الردود الصادرة ومن
  سياق إعادة التشغيل المستقبلي.
- افتراضيًا (`session.dmScope=main`)، تشارك المحادثات المباشرة جلسة الوكيل الرئيسية (`agent:main:main`).
- قنوات الخادم هي مفاتيح جلسات معزولة (`agent:<agentId>:discord:channel:<channelId>`).
- تُتجاهل الرسائل المباشرة الجماعية افتراضيًا (`channels.discord.dm.groupEnabled=false`).
- تعمل أوامر الشرطة المائلة الأصلية في جلسات أوامر معزولة (`agent:<agentId>:discord:slash:<userId>`)، مع استمرار حمل `CommandTargetSessionKey` إلى جلسة المحادثة الموجّهة.
- يستخدم تسليم إعلانات Cron/Heartbeat النصية فقط إلى Discord الإجابة النهائية
  المرئية للمساعد مرة واحدة. تبقى حمولات الوسائط والمكوّنات المنظمة
  متعددة الرسائل عندما يصدر الوكيل عدة حمولات قابلة للتسليم.

## قنوات المنتديات

تقبل قنوات منتديات ووسائط Discord منشورات السلاسل فقط. يدعم OpenClaw طريقتين لإنشائها:

- أرسل رسالة إلى أصل المنتدى (`channel:<forumId>`) لإنشاء سلسلة تلقائيًا. يستخدم عنوان السلسلة أول سطر غير فارغ من رسالتك.
- استخدم `openclaw message thread create` لإنشاء سلسلة مباشرة. لا تمرّر `--message-id` لقنوات المنتديات.

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

يدعم OpenClaw حاويات مكوّنات Discord v2 لرسائل الوكيل. استخدم أداة الرسائل مع حمولة `components`. تُوجّه نتائج التفاعل مرة أخرى إلى الوكيل كرسائل واردة عادية وتتبع إعدادات Discord `replyToMode` الحالية.

الكتل المدعومة:

- `text`، `section`، `separator`، `actions`، `media-gallery`، `file`
- تسمح صفوف الإجراءات بما يصل إلى 5 أزرار أو قائمة اختيار واحدة
- أنواع الاختيار: `string`، `user`، `role`، `mentionable`، `channel`

افتراضيًا، تُستخدم المكوّنات مرة واحدة. اضبط `components.reusable=true` للسماح باستخدام الأزرار والاختيارات والنماذج عدة مرات إلى أن تنتهي صلاحيتها.

لتقييد من يمكنه النقر على زر، اضبط `allowedUsers` على ذلك الزر (معرّفات مستخدمي Discord أو الوسوم أو `*`). عند تهيئته، يتلقى المستخدمون غير المطابقين رفضًا سريع الزوال.

تفتح أوامر الشرطة المائلة `/model` و`/models` منتقي نماذج تفاعليًا يتضمن قوائم منسدلة للمزوّد والنموذج وبيئة التشغيل المتوافقة، بالإضافة إلى خطوة إرسال. أصبح `/models add` مهملًا ويعيد الآن رسالة إهمال بدلًا من تسجيل النماذج من المحادثة. يكون رد المنتقي سريع الزوال ولا يمكن استخدامه إلا من قبل المستخدم الذي استدعاه.

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
    يتحكم `channels.discord.dmPolicy` في الوصول عبر الرسائل المباشرة. `channels.discord.allowFrom` هي قائمة السماح الأساسية للرسائل المباشرة.

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن تتضمن `channels.discord.allowFrom` القيمة `"*"`)
    - `disabled`

    إذا لم تكن سياسة الرسائل المباشرة مفتوحة، فسيُحظر المستخدمون غير المعروفين (أو يُطلب منهم الاقتران في وضع `pairing`).

    أولوية الحسابات المتعددة:

    - ينطبق `channels.discord.accounts.default.allowFrom` فقط على الحساب `default`.
    - للحساب الواحد، تكون أولوية `allowFrom` أعلى من `dm.allowFrom` القديم.
    - ترث الحسابات المسماة `channels.discord.allowFrom` عندما لا تكون `allowFrom` الخاصة بها ولا `dm.allowFrom` القديم مضبوطين.
    - لا ترث الحسابات المسماة `channels.discord.accounts.default.allowFrom`.

    لا تزال `channels.discord.dm.policy` و`channels.discord.dm.allowFrom` القديمتان تُقرآن للتوافق. يرحّلهما `openclaw doctor --fix` إلى `dmPolicy` و`allowFrom` عندما يستطيع فعل ذلك دون تغيير الوصول.

    تنسيق هدف الرسائل المباشرة للتسليم:

    - `user:<id>`
    - إشارة `<@id>`

    عادةً ما تُحلّ المعرّفات الرقمية المجردة كمعرّفات قنوات عندما يكون افتراض قناة نشطًا، لكن المعرّفات المدرجة في `allowFrom` الفعالة للرسائل المباشرة في الحساب تُعامل كأهداف رسائل مباشرة للمستخدمين لأجل التوافق.

  </Tab>

  <Tab title="DM access groups">
    يمكن لرسائل Discord المباشرة استخدام إدخالات `accessGroup:<name>` ديناميكية في `channels.discord.allowFrom`.

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

    لا تملك قناة نصية في Discord قائمة أعضاء منفصلة. يصمم `type: "discord.channelAudience"` العضوية على النحو التالي: مرسل الرسالة المباشرة عضو في الخادم المهيأ ولديه حاليًا إذن `ViewChannel` فعّال على القناة المهيأة بعد تطبيق أدوار القناة وتجاوزاتها.

    مثال: اسمح لأي شخص يمكنه رؤية `#maintainers` بإرسال رسالة مباشرة إلى البوت، مع إبقاء الرسائل المباشرة مغلقة أمام الجميع.

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

    تفشل عمليات البحث في وضع مغلق. إذا أعاد Discord القيمة `Missing Access`، أو فشل بحث العضو، أو كانت القناة تابعة لخادم مختلف، فيُعامل مرسل الرسالة المباشرة كغير مصرّح له.

    فعّل **Server Members Intent** في Discord Developer Portal للبوت عند استخدام مجموعات وصول قائمة على جمهور القناة. لا تتضمن الرسائل المباشرة حالة عضو الخادم، لذلك يحل OpenClaw العضو عبر Discord REST وقت التفويض.

  </Tab>

  <Tab title="Guild policy">
    يتحكم `channels.discord.groupPolicy` في التعامل مع الخوادم:

    - `open`
    - `allowlist`
    - `disabled`

    خط الأساس الآمن عند وجود `channels.discord` هو `allowlist`.

    سلوك `allowlist`:

    - يجب أن يطابق الخادم `channels.discord.guilds` (`id` مفضل، والاسم المختصر مقبول)
    - قوائم سماح اختيارية للمرسلين: `users` (تُوصى بالمعرّفات المستقرة) و`roles` (معرّفات الأدوار فقط)؛ إذا ضُبط أي منهما، يُسمح للمرسلين عندما يطابقون `users` أو `roles`
    - مطابقة الاسم/الوسم المباشرة معطلة افتراضيًا؛ فعّل `channels.discord.dangerouslyAllowNameMatching: true` فقط كوضع توافق للطوارئ
    - الأسماء/الوسوم مدعومة في `users`، لكن المعرّفات أكثر أمانًا؛ يحذر `openclaw security audit` عند استخدام إدخالات الاسم/الوسم
    - إذا كان لدى خادم `channels` مهيأة، تُرفض القنوات غير المدرجة
    - إذا لم يكن لدى خادم كتلة `channels`، فيُسمح بكل القنوات في ذلك الخادم المدرج في قائمة السماح

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

    إذا ضبطت `DISCORD_BOT_TOKEN` فقط ولم تنشئ كتلة `channels.discord`، فإن الاحتياطي وقت التشغيل هو `groupPolicy="allowlist"` (مع تحذير في السجلات)، حتى إذا كانت `channels.defaults.groupPolicy` هي `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    رسائل الخادم مقيدة بالإشارات افتراضيًا.

    يتضمن كشف الإشارات:

    - إشارة صريحة إلى البوت
    - أنماط الإشارة المهيأة (`agents.list[].groupChat.mentionPatterns`، مع الاحتياطي `messages.groupChat.mentionPatterns`)
    - سلوك الرد الضمني على البوت في الحالات المدعومة

    عند كتابة رسائل Discord صادرة، استخدم صيغة الإشارة القياسية: `<@USER_ID>` للمستخدمين، و`<#CHANNEL_ID>` للقنوات، و`<@&ROLE_ID>` للأدوار. لا تستخدم صيغة إشارة اللقب القديمة `<@!USER_ID>`.

    يُهيأ `requireMention` لكل خادم/قناة (`channels.discord.guilds...`).
    يحذف `ignoreOtherMentions` اختياريًا الرسائل التي تشير إلى مستخدم/دور آخر ولكن ليس إلى البوت (باستثناء @everyone/@here).

    الرسائل المباشرة الجماعية:

    - افتراضيًا: متجاهلة (`dm.groupEnabled=false`)
    - قائمة سماح اختيارية عبر `dm.groupChannels` (معرّفات القنوات أو الأسماء المختصرة)

  </Tab>
</Tabs>

### توجيه الوكلاء بناءً على الأدوار

استخدم `bindings[].match.roles` لتوجيه أعضاء خوادم Discord إلى وكلاء مختلفين حسب معرّف الدور. تقبل الروابط القائمة على الأدوار معرّفات الأدوار فقط، وتُقيّم بعد روابط النظير أو النظير الأصلية وقبل روابط الخادم فقط. إذا ضبط رابط أيضًا حقول مطابقة أخرى (على سبيل المثال `peer` + `guildId` + `roles`)، فيجب أن تطابق كل الحقول المهيأة.

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

- تكون القيمة الافتراضية لـ `commands.native` هي `"auto"` وتكون مفعلة لـ Discord.
- تجاوز لكل قناة: `channels.discord.commands.native`.
- يؤدي `commands.native=false` إلى تخطي تسجيل أوامر الشرطة المائلة في Discord وتنظيفها أثناء بدء التشغيل. قد تبقى الأوامر المسجلة سابقا مرئية في Discord إلى أن تزيلها من تطبيق Discord.
- يستخدم تفويض الأوامر الأصلية قوائم السماح/السياسات نفسها في Discord مثل معالجة الرسائل العادية.
- قد تظل الأوامر مرئية في واجهة Discord للمستخدمين غير المصرح لهم؛ ما يزال التنفيذ يفرض تفويض OpenClaw ويعيد "غير مصرح".

راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands) للاطلاع على كتالوج الأوامر وسلوكها.

إعدادات أوامر الشرطة المائلة الافتراضية:

- `ephemeral: true`

## تفاصيل الميزة

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    يدعم Discord وسوم الرد في مخرجات الوكيل:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    يتم التحكم فيه عبر `channels.discord.replyToMode`:

    - `off` (الافتراضي)
    - `first`
    - `all`
    - `batched`

    ملاحظة: يعطل `off` تسلسل الردود الضمني. تظل وسوم `[[reply_to_*]]` الصريحة محترمة.
    يرفق `first` دائما مرجع الرد الأصلي الضمني بأول رسالة صادرة إلى Discord في الدور.
    يرفق `batched` مرجع الرد الأصلي الضمني الخاص بـ Discord فقط عندما يكون
    الدور الوارد دفعة مؤجلة من عدة رسائل. يكون هذا مفيدا
    عندما تريد الردود الأصلية أساسا للمحادثات المتدفقة الغامضة، وليس لكل
    دور برسالة واحدة.

    تعرض معرفات الرسائل في السياق/السجل حتى تتمكن الوكلاء من استهداف رسائل محددة.

  </Accordion>

  <Accordion title="Live stream preview">
    يمكن لـ OpenClaw بث مسودات الردود بإرسال رسالة مؤقتة وتعديلها مع وصول النص. يأخذ `channels.discord.streaming` القيم `off` | `partial` | `block` | `progress` (الافتراضي). يحافظ `progress` على مسودة حالة واحدة قابلة للتحرير ويحدثها بتقدم الأدوات حتى التسليم النهائي؛ و`streamMode` اسم مستعار قديم وقت التشغيل. شغل `openclaw doctor --fix` لإعادة كتابة الإعدادات المحفوظة إلى المفتاح القياسي.

    اضبط `channels.discord.streaming.mode` على `off` لتعطيل تعديلات معاينة Discord. إذا تم تفعيل بث الكتل في Discord صراحة، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

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

    - يعدل `partial` رسالة معاينة واحدة مع وصول الرموز.
    - يصدر `block` مقاطع بحجم مسودة (استخدم `draftChunk` لضبط الحجم ونقاط الفصل، مع تقييدها بـ `textChunkLimit`).
    - تلغي النهائيات التي تحتوي على وسائط أو خطأ أو رد صريح تعديلات المعاينة المعلقة.
    - يتحكم `streaming.preview.toolProgress` (افتراضيا `true`) فيما إذا كانت تحديثات الأداة/التقدم تعيد استخدام رسالة المعاينة.
    - يتحكم `streaming.preview.commandText` / `streaming.progress.commandText` في تفاصيل الأمر/التنفيذ ضمن أسطر التقدم الموجزة: `raw` (الافتراضي) أو `status` (تسمية الأداة فقط).

    إخفاء نص الأمر/التنفيذ الخام مع الإبقاء على أسطر التقدم الموجزة:

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
    - يعطل `0`

    عناصر التحكم في سجل الرسائل المباشرة:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    سلوك السلاسل:

    - توجه سلاسل Discord كجلسات قناة وترث إعدادات القناة الأصلية ما لم يتم تجاوزها.
    - ترث جلسات السلاسل اختيار `/model` على مستوى جلسة القناة الأصلية كاحتياطي للنموذج فقط؛ ما تزال اختيارات `/model` المحلية للسلسلة لها الأولوية ولا ينسخ سجل النصوص من الأصل إلا إذا تم تفعيل وراثة النصوص.
    - يختار `channels.discord.thread.inheritParent` (افتراضيا `false`) السلاسل التلقائية الجديدة للبذر من نص الأصل. توجد التجاوزات لكل حساب ضمن `channels.discord.accounts.<id>.thread.inheritParent`.
    - يمكن لتفاعلات أداة الرسائل حل أهداف الرسائل المباشرة `user:<id>`.
    - يتم الحفاظ على `guilds.<guild>.channels.<channel>.requireMention: false` أثناء احتياطي تفعيل مرحلة الرد.

    تحقن موضوعات القنوات كسياق **غير موثوق**. تتحكم قوائم السماح بمن يمكنه تشغيل الوكيل، وليست حد تنقيح كامل للسياق الإضافي.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    يستطيع Discord ربط سلسلة بهدف جلسة بحيث تستمر رسائل المتابعة في تلك السلسلة بالتوجيه إلى الجلسة نفسها (بما في ذلك جلسات الوكلاء الفرعيين).

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

    - يضبط `session.threadBindings.*` الافتراضيات العامة.
    - يتجاوز `channels.discord.threadBindings.*` سلوك Discord.
    - يتحكم `spawnSessions` في إنشاء/ربط السلاسل تلقائيا لـ `sessions_spawn({ thread: true })` وعمليات إنشاء سلاسل ACP. الافتراضي: `true`.
    - يتحكم `defaultSpawnContext` في سياق الوكيل الفرعي الأصلي لعمليات الإنشاء المرتبطة بالسلاسل. الافتراضي: `"fork"`.
    - يتم ترحيل مفاتيح `spawnSubagentSessions`/`spawnAcpSessions` المهملة بواسطة `openclaw doctor --fix`.
    - إذا كانت روابط السلاسل معطلة لحساب ما، فلن تكون `/focus` وعمليات ربط السلاسل ذات الصلة متاحة.

    راجع [الوكلاء الفرعيون](/ar/tools/subagents)، و[وكلاء ACP](/ar/tools/acp-agents)، و[مرجع الإعدادات](/ar/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    لمساحات عمل ACP الثابتة "الدائمة التشغيل"، اضبط روابط ACP المكتوبة على المستوى الأعلى التي تستهدف محادثات Discord.

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

    - يربط `/acp spawn codex --bind here` القناة أو السلسلة الحالية في مكانها ويحافظ على الرسائل المستقبلية في جلسة ACP نفسها. ترث رسائل السلسلة ربط القناة الأصلية.
    - في قناة أو سلسلة مربوطة، يعيد `/new` و`/reset` ضبط جلسة ACP نفسها في مكانها. يمكن لروابط السلاسل المؤقتة تجاوز حل الهدف أثناء نشاطها.
    - يتحكم `spawnSessions` في إنشاء/ربط السلاسل الفرعية عبر `--thread auto|here`.

    راجع [وكلاء ACP](/ar/tools/acp-agents) لتفاصيل سلوك الربط.

  </Accordion>

  <Accordion title="Reaction notifications">
    وضع إشعارات التفاعلات لكل خادم:

    - `off`
    - `own` (الافتراضي)
    - `all`
    - `allowlist` (يستخدم `guilds.<id>.users`)

    تحول أحداث التفاعل إلى أحداث نظام وتلحق بجلسة Discord الموجهة.

  </Accordion>

  <Accordion title="Ack reactions">
    يرسل `ackReaction` رمزا تعبيريا للإقرار أثناء معالجة OpenClaw لرسالة واردة.

    ترتيب الحل:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - احتياطي الرمز التعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يقبل Discord الرموز التعبيرية اليونيكود أو أسماء الرموز التعبيرية المخصصة.
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="Config writes">
    تكون عمليات كتابة الإعدادات التي تبدأها القناة مفعلة افتراضيا.

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

  <Accordion title="Gateway proxy">
    وجه حركة WebSocket الخاصة ببوابة Discord وعمليات بحث REST عند بدء التشغيل (معرف التطبيق + حل قائمة السماح) عبر وكيل HTTP(S) باستخدام `channels.discord.proxy`.

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
    فعل حل PluralKit لربط الرسائل الموكلة بهوية عضو النظام:

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
    - لا تطابق أسماء عرض الأعضاء حسب الاسم/الاسم المختصر إلا عندما تكون `channels.discord.dangerouslyAllowNameMatching: true`
    - تستخدم عمليات البحث معرف الرسالة الأصلي وتكون مقيدة بنافذة زمنية
    - إذا فشل البحث، تعامل الرسائل الموكلة كرسائل بوت ويتم إسقاطها ما لم يكن `allowBots=true`

  </Accordion>

  <Accordion title="Outbound mention aliases">
    استخدم `mentionAliases` عندما تحتاج الوكلاء إلى إشارات صادرة حتمية لمستخدمي Discord معروفين. المفاتيح هي المعالجات دون `@` البادئة؛ والقيم هي معرفات مستخدمي Discord. تبقى المعالجات غير المعروفة، و`@everyone`، و`@here`، والإشارات داخل مسافات كود Markdown دون تغيير.

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
    تطبق تحديثات الحضور عندما تضبط حقل حالة أو نشاط، أو عندما تفعل الحضور التلقائي.

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

    - 0: تشغيل
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

    يربط الحضور التلقائي توفّر وقت التشغيل بحالة Discord: healthy => online، degraded أو unknown => idle، exhausted أو unavailable => dnd. تجاوزات النص الاختيارية:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (يدعم العنصر النائب `{reason}`)

  </Accordion>

  <Accordion title="Approvals in Discord">
    يدعم Discord التعامل مع الموافقات المستندة إلى الأزرار في الرسائل الخاصة، ويمكنه اختياريًا نشر مطالبات الموافقة في القناة الأصلية.

    مسار الإعداد:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختياري؛ يعود إلى `commands.ownerAllowFrom` عند الإمكان)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
    - `agentFilter`، و`sessionFilter`، و`cleanupAfterResolve`

    يفعّل Discord تلقائيًا موافقات التنفيذ الأصلية عندما تكون `enabled` غير مضبوطة أو تساوي `"auto"` وكان يمكن حلّ موافِق واحد على الأقل، إما من `execApprovals.approvers` أو من `commands.ownerAllowFrom`. لا يستنتج Discord موافقي التنفيذ من `allowFrom` الخاصة بالقناة، أو `dm.allowFrom` القديمة، أو `defaultTo` للرسائل المباشرة. اضبط `enabled: false` لتعطيل Discord صراحةً كعميل موافقة أصلي.

    بالنسبة إلى أوامر المجموعات الحساسة الخاصة بالمالك فقط، مثل `/diagnostics` و`/export-trajectory`، يرسل OpenClaw مطالبات الموافقة والنتائج النهائية بشكل خاص. يحاول أولًا استخدام رسالة Discord خاصة عندما يكون لدى المالك المستدعي مسار مالك في Discord؛ وإذا لم يكن ذلك متاحًا، فإنه يعود إلى أول مسار مالك متاح من `commands.ownerAllowFrom`، مثل Telegram.

    عندما تكون `target` هي `channel` أو `both`، تكون مطالبة الموافقة مرئية في القناة. يمكن للموافقين الذين تم حلّهم فقط استخدام الأزرار؛ ويتلقى المستخدمون الآخرون رفضًا مؤقتًا. تتضمن مطالبات الموافقة نص الأمر، لذلك لا تفعّل التسليم إلى القناة إلا في القنوات الموثوقة. إذا تعذّر اشتقاق معرّف القناة من مفتاح الجلسة، يعود OpenClaw إلى التسليم عبر رسالة خاصة.

    يعرض Discord أيضًا أزرار الموافقة المشتركة التي تستخدمها قنوات الدردشة الأخرى. يضيف محوّل Discord الأصلي أساسًا توجيه رسائل الموافقة الخاصة إلى الموافقين والتوزيع إلى القنوات.
    عند وجود هذه الأزرار، تكون هي تجربة الموافقة الأساسية؛ ويجب على OpenClaw
    أن يضمّن أمر `/approve` يدويًا فقط عندما تشير نتيجة الأداة إلى
    أن موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.
    إذا لم يكن وقت تشغيل الموافقة الأصلي في Discord نشطًا، يبقي OpenClaw
    مطالبة `/approve <id> <decision>` المحلية الحتمية مرئية. إذا كان
    وقت التشغيل نشطًا ولكن تعذّر تسليم بطاقة أصلية إلى أي هدف،
    يرسل OpenClaw إشعار احتياط في الدردشة نفسها يتضمن أمر `/approve`
    الدقيق من الموافقة المعلّقة.

    تتبع مصادقة Gateway وحلّ الموافقة عقد عميل Gateway المشترك (تُحلّ معرّفات `plugin:` عبر `plugin.approval.resolve`؛ وتُحلّ المعرّفات الأخرى عبر `exec.approval.resolve`). تنتهي صلاحية الموافقات بعد 30 دقيقة افتراضيًا.

    راجع [موافقات التنفيذ](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## الأدوات وبوابات الإجراءات

تتضمن إجراءات رسائل Discord إجراءات المراسلة، وإدارة القنوات، والإشراف، والحضور، والبيانات الوصفية.

أمثلة أساسية:

- المراسلة: `sendMessage`، و`readMessages`، و`editMessage`، و`deleteMessage`، و`threadReply`
- التفاعلات: `react`، و`reactions`، و`emojiList`
- الإشراف: `timeout`، و`kick`، و`ban`
- الحضور: `setPresence`

يقبل إجراء `event-create` معامل `image` اختياريًا (عنوان URL أو مسار ملف محلي) لتعيين صورة غلاف الحدث المجدول.

توجد بوابات الإجراءات ضمن `channels.discord.actions.*`.

سلوك البوابة الافتراضي:

| مجموعة الإجراءات                                                                                                                                                         | الافتراضي |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | مفعّل    |
| roles                                                                                                                                                                    | معطّل    |
| moderation                                                                                                                                                               | معطّل    |
| presence                                                                                                                                                                 | معطّل    |

## واجهة مستخدم Components v2

يستخدم OpenClaw مكوّنات Discord v2 لموافقات التنفيذ وعلامات السياقات المتقاطعة. يمكن لإجراءات رسائل Discord أيضًا قبول `components` لواجهة مستخدم مخصصة (متقدم؛ يتطلب إنشاء حمولة مكوّن عبر أداة discord)، بينما تبقى `embeds` القديمة متاحة لكنها غير موصى بها.

- يضبط `channels.discord.ui.components.accentColor` لون التمييز المستخدم في حاويات مكوّنات Discord (hex).
- اضبط لكل حساب باستخدام `channels.discord.accounts.<id>.ui.components.accentColor`.
- يتم تجاهل `embeds` عند وجود مكوّنات v2.

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

لدى Discord سطحان صوتيان متميزان: **قنوات الصوت** الفورية (محادثات مستمرة) و**مرفقات الرسائل الصوتية** (تنسيق معاينة الموجة الصوتية). يدعم Gateway كليهما.

### قنوات الصوت

قائمة إعداد:

1. فعّل Message Content Intent في Discord Developer Portal.
2. فعّل Server Members Intent عند استخدام قوائم السماح للأدوار/المستخدمين.
3. ادعُ الروبوت بنطاقي `bot` و`applications.commands`.
4. امنح أذونات Connect، وSpeak، وSend Messages، وRead Message History في قناة الصوت المستهدفة.
5. فعّل الأوامر الأصلية (`commands.native` أو `channels.discord.commands.native`).
6. اضبط `channels.discord.voice`.

استخدم `/vc join|leave|status` للتحكم في الجلسات. يستخدم الأمر وكيل الحساب الافتراضي ويتبع قواعد قائمة السماح وسياسة المجموعة نفسها مثل أوامر Discord الأخرى.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

لفحص الأذونات الفعلية للروبوت قبل الانضمام، شغّل:

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
- يتجاوز `voice.model` نموذج LLM المستخدم لردود قناة صوت Discord فقط. اتركه غير مضبوط ليرث نموذج الوكيل الموجّه.
- يستخدم STT `tools.media.audio`؛ ولا يؤثر `voice.model` في النسخ.
- تنطبق تجاوزات `systemPrompt` الخاصة بكل قناة Discord على أدوار نصّ الصوت لقناة الصوت تلك.
- تستمد أدوار نصّ الصوت حالة المالك من `allowFrom` في Discord (أو `dm.allowFrom`)؛ ولا يمكن للمتحدثين غير المالكين الوصول إلى الأدوات الخاصة بالمالك فقط (مثل `gateway` و`cron`).
- صوت Discord اختياري للإعدادات النصية فقط؛ اضبط `channels.discord.voice.enabled=true` (أو أبقِ كتلة `channels.discord.voice` موجودة) لتفعيل أوامر `/vc`، ووقت تشغيل الصوت، وهدف Gateway `GuildVoiceStates`.
- يمكن لـ `channels.discord.intents.voiceStates` تجاوز الاشتراك في هدف حالة الصوت صراحةً. اتركه غير مضبوط ليتبع الهدف تفعيل الصوت الفعلي.
- يمرّر `voice.daveEncryption` و`voice.decryptionFailureTolerance` إلى خيارات الانضمام في `@discordjs/voice`.
- افتراضيات `@discordjs/voice` هي `daveEncryption=true` و`decryptionFailureTolerance=24` إذا تُركت غير مضبوطة.
- يتحكم `voice.connectTimeoutMs` في انتظار Ready الأولي من `@discordjs/voice` لمحاولات `/vc join` والانضمام التلقائي. الافتراضي: `30000`.
- يتحكم `voice.reconnectGraceMs` في مدة انتظار OpenClaw لجلسة صوت منقطعة حتى تبدأ إعادة الاتصال قبل تدميرها. الافتراضي: `15000`.
- لا يتوقف تشغيل الصوت لمجرد أن مستخدمًا آخر بدأ بالتحدث. لتجنب حلقات التغذية الراجعة، يتجاهل OpenClaw التقاط الصوت الجديد أثناء تشغيل TTS؛ تحدث بعد انتهاء التشغيل للدور التالي.
- يتحكم `voice.captureSilenceGraceMs` في مدة انتظار OpenClaw بعد أن يبلّغ Discord بأن متحدثًا توقف قبل إنهاء مقطع الصوت ذاك من أجل STT. الافتراضي: `2500`؛ ارفع هذه القيمة إذا كان Discord يقسم فترات التوقف الطبيعية إلى نصوص جزئية متقطعة.
- عند اختيار ElevenLabs كمزوّد TTS، يستخدم تشغيل صوت Discord TTS بالبث ويبدأ من دفق استجابة المزوّد. تعود المزوّدات التي لا تدعم البث إلى مسار الملف المؤقت المُركّب.
- يراقب OpenClaw أيضًا إخفاقات فك تشفير الاستقبال ويتعافى تلقائيًا عبر مغادرة قناة الصوت وإعادة الانضمام إليها بعد إخفاقات متكررة في نافذة قصيرة.
- إذا أظهرت سجلات الاستقبال مرارًا `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` بعد التحديث، اجمع تقرير تبعيات وسجلات. يتضمن سطر `@discordjs/voice` المضمّن إصلاح الحشو من المنبع من PR #11449 في discord.js، والذي أغلق issue #11419 في discord.js.
- أحداث استقبال `The operation was aborted` متوقعة عندما ينهي OpenClaw مقطع متحدث ملتقطًا؛ فهي تشخيصات تفصيلية وليست تحذيرات.

مسار قناة الصوت:

- يتم تحويل التقاط PCM من Discord إلى ملف WAV مؤقت.
- يتعامل `tools.media.audio` مع STT، مثل `openai/gpt-4o-mini-transcribe`.
- يُرسل النص عبر إدخال Discord والتوجيه بينما يعمل LLM الخاص بالاستجابة بسياسة إخراج صوتي تخفي أداة `tts` الخاصة بالوكيل وتطلب نصًا مُعادًا، لأن صوت Discord يملك تشغيل TTS النهائي.
- عند ضبط `voice.model`، فإنه يتجاوز LLM الخاص بالاستجابة فقط لهذا الدور في قناة الصوت.
- يتم دمج `voice.tts` فوق `messages.tts`؛ وتغذي المزوّدات القادرة على البث المشغّل مباشرة، وإلا يُشغّل ملف الصوت الناتج في القناة المنضم إليها.

تُحل بيانات الاعتماد حسب كل مكوّن: مصادقة مسار LLM لـ `voice.model`، ومصادقة STT لـ `tools.media.audio`، ومصادقة TTS لـ `messages.tts`/`voice.tts`.

### الرسائل الصوتية

تعرض رسائل Discord الصوتية معاينة موجة صوتية وتتطلب صوت OGG/Opus. ينشئ OpenClaw الموجة الصوتية تلقائيًا، لكنه يحتاج إلى `ffmpeg` و`ffprobe` على مضيف Gateway للفحص والتحويل.

- وفّر **مسار ملف محليًا** (تُرفض عناوين URL).
- احذف محتوى النص (يرفض Discord النص + الرسالة الصوتية في الحمولة نفسها).
- يُقبل أي تنسيق صوتي؛ ويحوّله OpenClaw إلى OGG/Opus عند الحاجة.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - فعّل Message Content Intent
    - فعّل Server Members Intent عندما تعتمد على حلّ المستخدم/العضو
    - أعد تشغيل Gateway بعد تغيير الأهداف

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - تحقق من `groupPolicy`
    - تحقق من قائمة السماح للخادم ضمن `channels.discord.guilds`
    - إذا كانت خريطة `channels` للخادم موجودة، فلا يُسمح إلا بالقنوات المدرجة
    - تحقق من سلوك `requireMention` وأنماط الإشارة

    فحوصات مفيدة:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="تعيين require mention إلى false ولكن لا يزال محظورًا">
    الأسباب الشائعة:

    - `groupPolicy="allowlist"` من دون قائمة سماح مطابقة للخادم/القناة
    - تكوين `requireMention` في المكان الخطأ (يجب أن يكون ضمن `channels.discord.guilds` أو إدخال القناة)
    - حظر المرسل بواسطة قائمة سماح `users` الخاصة بالخادم/القناة

  </Accordion>

  <Accordion title="أدوار Discord طويلة التشغيل أو الردود المكررة">

    السجلات المعتادة:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    إعدادات ضبط صف Gateway في Discord:

    - حساب واحد: `channels.discord.eventQueue.listenerTimeout`
    - حسابات متعددة: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - يتحكم هذا فقط في عمل مستمع Gateway الخاص بـ Discord، وليس عمر دور الوكيل

    لا يطبق Discord مهلة مملوكة للقناة على أدوار الوكيل الموضوعة في الصف. تسلم مستمعات الرسائل العمل فورًا، وتحافظ تشغيلات Discord الموضوعة في الصف على الترتيب لكل جلسة حتى تكتمل دورة حياة الجلسة/الأداة/وقت التشغيل أو يتم إجهاض العمل.

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
    يجلب OpenClaw بيانات Discord الوصفية `/gateway/bot` قبل الاتصال. تعود حالات الفشل العابرة إلى عنوان URL الافتراضي لـ Gateway الخاص بـ Discord، ويتم تقييد معدلها في السجلات.

    إعدادات ضبط مهلة البيانات الوصفية:

    - حساب واحد: `channels.discord.gatewayInfoTimeoutMs`
    - حسابات متعددة: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - بديل متغير البيئة عندما يكون التكوين غير معين: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - الافتراضي: `30000` (30 ثانية)، الحد الأقصى: `120000`

  </Accordion>

  <Accordion title="إعادات التشغيل بسبب انتهاء مهلة READY في Gateway">
    ينتظر OpenClaw حدث `READY` الخاص بـ Gateway في Discord أثناء بدء التشغيل وبعد إعادة الاتصال في وقت التشغيل. قد تحتاج إعدادات الحسابات المتعددة مع التدرج في بدء التشغيل إلى نافذة READY أطول عند بدء التشغيل من القيمة الافتراضية.

    إعدادات ضبط مهلة READY:

    - بدء التشغيل لحساب واحد: `channels.discord.gatewayReadyTimeoutMs`
    - بدء التشغيل لحسابات متعددة: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - بديل متغير البيئة عند بدء التشغيل عندما يكون التكوين غير معين: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - الافتراضي عند بدء التشغيل: `15000` (15 ثانية)، الحد الأقصى: `120000`
    - وقت التشغيل لحساب واحد: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - وقت التشغيل لحسابات متعددة: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - بديل متغير البيئة في وقت التشغيل عندما يكون التكوين غير معين: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - الافتراضي في وقت التشغيل: `30000` (30 ثانية)، الحد الأقصى: `120000`

  </Accordion>

  <Accordion title="عدم تطابق تدقيق الأذونات">
    لا تعمل فحوصات أذونات `channels status --probe` إلا مع معرفات القنوات الرقمية.

    إذا كنت تستخدم مفاتيح slug، فقد تظل المطابقة في وقت التشغيل تعمل، لكن probe لا يمكنه التحقق من الأذونات بالكامل.

  </Accordion>

  <Accordion title="مشكلات الرسائل المباشرة والاقتران">

    - الرسائل المباشرة معطلة: `channels.discord.dm.enabled=false`
    - سياسة الرسائل المباشرة معطلة: `channels.discord.dmPolicy="disabled"` (قديم: `channels.discord.dm.policy`)
    - انتظار موافقة الاقتران في وضع `pairing`

  </Accordion>

  <Accordion title="حلقات روبوت إلى روبوت">
    افتراضيا، يتم تجاهل الرسائل التي يكتبها الروبوت.

    إذا عيّنت `channels.discord.allowBots=true`، فاستخدم قواعد إشارة وقائمة سماح صارمة لتجنب سلوك الحلقات.
    فضّل `channels.discord.allowBots="mentions"` لقبول رسائل الروبوتات فقط عندما تشير إلى الروبوت.

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

    - أبقِ OpenClaw محدثا (`openclaw update`) حتى يكون منطق استرداد استقبال صوت Discord موجودا
    - تأكد من `channels.discord.voice.daveEncryption=true` (الافتراضي)
    - ابدأ من `channels.discord.voice.decryptionFailureTolerance=24` (الافتراضي في المنبع) واضبطه فقط عند الحاجة
    - راقب السجلات بحثا عن:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - إذا استمرت الإخفاقات بعد إعادة الانضمام التلقائية، فاجمع السجلات وقارنها بسجل استقبال DAVE في المنبع في [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) و[discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

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
- الميزات: `threadBindings`، و`bindings[]` على المستوى الأعلى (`type: "acp"`)، `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## السلامة والعمليات

- تعامل مع رموز الروبوتات كأسرار (يفضل `DISCORD_BOT_TOKEN` في البيئات الخاضعة للإشراف).
- امنح أذونات Discord بأقل امتيازات ممكنة.
- إذا كانت حالة نشر الأوامر قديمة، فأعد تشغيل Gateway وأعد التحقق باستخدام `openclaw channels status --probe`.

## ذو صلة

<CardGroup cols={2}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    اقرن مستخدم Discord مع Gateway.
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
    اربط النقابات والقنوات بالوكلاء.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلية.
  </Card>
</CardGroup>

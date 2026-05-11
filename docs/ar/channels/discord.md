---
read_when:
    - العمل على ميزات قناة Discord
summary: حالة دعم روبوت Discord وإمكاناته وتكوينه
title: Discord
x-i18n:
    generated_at: "2026-05-11T20:20:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 70107cf53c44f80e42f99f670aacf6eed8b77d839c05bccc853cd91a7273e5aa
    source_path: channels/discord.md
    workflow: 16
---

جاهز للرسائل المباشرة وقنوات النقابة عبر Gateway الرسمي لـ Discord.

<CardGroup cols={3}>
  <Card title="الإقران" icon="link" href="/ar/channels/pairing">
    تُضبط رسائل Discord المباشرة افتراضيًا على وضع الإقران.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وفهرس الأوامر.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات متعددة القنوات ومسار الإصلاح.
  </Card>
</CardGroup>

## الإعداد السريع

ستحتاج إلى إنشاء تطبيق جديد مع روبوت، وإضافة الروبوت إلى خادمك، وإقرانه بـ OpenClaw. نوصي بإضافة روبوتك إلى خادمك الخاص. إذا لم يكن لديك واحد بعد، [أنشئ واحدًا أولًا](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (اختر **Create My Own > For me and my friends**).

<Steps>
  <Step title="إنشاء تطبيق وروبوت Discord">
    انتقل إلى [Discord Developer Portal](https://discord.com/developers/applications) وانقر على **New Application**. سمّه شيئًا مثل "OpenClaw".

    انقر على **Bot** في الشريط الجانبي. اضبط **Username** على الاسم الذي تطلقه على وكيل OpenClaw لديك.

  </Step>

  <Step title="تمكين النوايا ذات الامتيازات">
    وأنت ما زلت في صفحة **Bot**، مرّر لأسفل إلى **Privileged Gateway Intents** ومكّن:

    - **Message Content Intent** (مطلوب)
    - **Server Members Intent** (موصى به؛ مطلوب لقوائم السماح بالأدوار ومطابقة الاسم بالمعرّف)
    - **Presence Intent** (اختياري؛ مطلوب فقط لتحديثات الحضور)

  </Step>

  <Step title="نسخ رمز الروبوت">
    مرّر للأعلى مرة أخرى في صفحة **Bot** وانقر على **Reset Token**.

    <Note>
    رغم الاسم، فهذا ينشئ رمزك الأول — لا يتم "إعادة تعيين" أي شيء.
    </Note>

    انسخ الرمز واحفظه في مكان ما. هذا هو **Bot Token** الخاص بك وستحتاج إليه بعد قليل.

  </Step>

  <Step title="إنشاء عنوان URL للدعوة وإضافة الروبوت إلى خادمك">
    انقر على **OAuth2** في الشريط الجانبي. ستنشئ عنوان URL للدعوة بالصلاحيات المناسبة لإضافة الروبوت إلى خادمك.

    مرّر لأسفل إلى **OAuth2 URL Generator** ومكّن:

    - `bot`
    - `applications.commands`

    سيظهر قسم **Bot Permissions** أدناه. مكّن على الأقل:

    **الأذونات العامة**
      - عرض القنوات
    **أذونات النص**
      - إرسال الرسائل
      - قراءة سجل الرسائل
      - تضمين الروابط
      - إرفاق الملفات
      - إضافة التفاعلات (اختياري)

    هذه هي المجموعة الأساسية للقنوات النصية العادية. إذا كنت تخطط للنشر في سلاسل Discord، بما في ذلك سير عمل قنوات المنتدى أو الوسائط التي تنشئ سلسلة أو تتابعها، فمكّن أيضًا **Send Messages in Threads**.
    انسخ عنوان URL الذي تم إنشاؤه في الأسفل، والصقه في متصفحك، وحدد خادمك، ثم انقر على **Continue** للاتصال. يجب أن ترى الآن روبوتك في خادم Discord.

  </Step>

  <Step title="تمكين وضع المطور وجمع معرّفاتك">
    في تطبيق Discord، تحتاج إلى تمكين وضع المطور حتى تتمكن من نسخ المعرّفات الداخلية.

    1. انقر على **User Settings** (أيقونة الترس بجانب صورتك الرمزية) → **Advanced** → فعّل **Developer Mode**
    2. انقر بزر الماوس الأيمن على **أيقونة الخادم** في الشريط الجانبي → **Copy Server ID**
    3. انقر بزر الماوس الأيمن على **صورتك الرمزية** → **Copy User ID**

    احفظ **Server ID** و **User ID** بجانب Bot Token — سترسل الثلاثة جميعًا إلى OpenClaw في الخطوة التالية.

  </Step>

  <Step title="السماح بالرسائل المباشرة من أعضاء الخادم">
    لكي يعمل الإقران، يحتاج Discord إلى السماح لروبوتك بإرسال رسالة مباشرة إليك. انقر بزر الماوس الأيمن على **أيقونة الخادم** → **Privacy Settings** → فعّل **Direct Messages**.

    يتيح هذا لأعضاء الخادم (بما في ذلك الروبوتات) إرسال رسائل مباشرة إليك. أبقِ هذا ممكّنًا إذا كنت تريد استخدام رسائل Discord المباشرة مع OpenClaw. إذا كنت تخطط لاستخدام قنوات النقابة فقط، فيمكنك تعطيل الرسائل المباشرة بعد الإقران.

  </Step>

  <Step title="ضبط رمز الروبوت بأمان (لا ترسله في الدردشة)">
    رمز روبوت Discord الخاص بك سرّي (مثل كلمة المرور). اضبطه على الجهاز الذي يشغّل OpenClaw قبل مراسلة وكيلك.

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
    بالنسبة لتثبيتات الخدمة المُدارة، شغّل `openclaw gateway install` من صدفة يكون فيها `DISCORD_BOT_TOKEN` موجودًا، أو خزّن المتغير في `~/.openclaw/.env`، حتى تتمكن الخدمة من حل env SecretRef بعد إعادة التشغيل.
    إذا كان مضيفك محظورًا أو محدود المعدل بسبب بحث تطبيق بدء التشغيل في Discord، فاضبط معرّف تطبيق/عميل Discord من Developer Portal حتى يتمكن بدء التشغيل من تخطي استدعاء REST هذا. استخدم `channels.discord.applicationId` للحساب الافتراضي، أو `channels.discord.accounts.<accountId>.applicationId` عند تشغيل عدة روبوتات Discord.

  </Step>

  <Step title="تكوين OpenClaw والإقران">

    <Tabs>
      <Tab title="اسأل وكيلك">
        تحدّث مع وكيل OpenClaw لديك على أي قناة حالية (مثل Telegram) وأخبره. إذا كانت Discord هي قناتك الأولى، فاستخدم تبويب CLI / التكوين بدلًا من ذلك.

        > "لقد ضبطت بالفعل رمز روبوت Discord الخاص بي في التكوين. يُرجى إكمال إعداد Discord باستخدام User ID `<user_id>` و Server ID `<server_id>`."
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

        رجوع env للحساب الافتراضي:

```bash
DISCORD_BOT_TOKEN=...
```

        للإعداد المبرمج أو البعيد، اكتب كتلة JSON5 نفسها باستخدام `openclaw config patch --file ./discord.patch.json5 --dry-run` ثم أعد التشغيل بدون `--dry-run`. قيم `token` النصية الصريحة مدعومة. قيم SecretRef مدعومة أيضًا لـ `channels.discord.token` عبر مزودي env/file/exec. راجع [إدارة الأسرار](/ar/gateway/secrets).

        لعدة روبوتات Discord، احتفظ برمز كل روبوت ومعرّف التطبيق تحت حسابه. يتم توريث `channels.discord.applicationId` ذي المستوى الأعلى بواسطة الحسابات، لذا لا تضبطه هناك إلا عندما يجب أن يستخدم كل حساب معرّف التطبيق نفسه.

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
    انتظر حتى يعمل Gateway، ثم أرسل رسالة مباشرة إلى روبوتك في Discord. سيرد برمز إقران.

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
حل الرمز يراعي الحساب. قيم رمز التكوين تتقدم على رجوع env. يُستخدم `DISCORD_BOT_TOKEN` للحساب الافتراضي فقط.
إذا تم حل حسابي Discord ممكّنين إلى رمز الروبوت نفسه، يبدأ OpenClaw مراقب Gateway واحدًا فقط لذلك الرمز. الرمز القادم من التكوين يتقدم على رجوع env الافتراضي؛ وإلا يفوز أول حساب ممكّن ويتم الإبلاغ عن الحساب المكرر كمعطّل.
بالنسبة للاستدعاءات الصادرة المتقدمة (أداة الرسائل/إجراءات القنوات)، يُستخدم `token` صريح لكل استدعاء لذلك الاستدعاء. ينطبق هذا على إجراءات الإرسال والقراءة/الفحص (على سبيل المثال read/search/fetch/thread/pins/permissions). لا تزال إعدادات سياسة الحساب/إعادة المحاولة تأتي من الحساب المحدد في لقطة وقت التشغيل النشطة.
</Note>

## موصى به: إعداد مساحة عمل للنقابة

بعد أن تعمل الرسائل المباشرة، يمكنك إعداد خادم Discord الخاص بك كمساحة عمل كاملة حيث تحصل كل قناة على جلسة وكيل خاصة بها بسياقها الخاص. يوصى بهذا للخوادم الخاصة التي تضمك أنت وروبوتك فقط.

<Steps>
  <Step title="إضافة خادمك إلى قائمة السماح للنقابة">
    يتيح هذا لوكيلك الرد في أي قناة على خادمك، وليس فقط في الرسائل المباشرة.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "أضف Discord Server ID `<server_id>` الخاص بي إلى قائمة السماح للنقابة"
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
    افتراضيًا، لا يرد وكيلك في قنوات النقابة إلا عند الإشارة إليه بـ @. بالنسبة لخادم خاص، ربما تريد أن يرد على كل رسالة.

    في قنوات النقابة، تبقى الردود النهائية العادية للمساعد خاصة افتراضيًا. يجب إرسال مخرجات Discord المرئية صراحة باستخدام أداة `message`، حتى يتمكن الوكيل من المراقبة افتراضيًا والنشر فقط عندما يقرر أن ردًا في القناة مفيد.

    يعني هذا أن النموذج المحدد يجب أن يستدعي الأدوات بموثوقية. إذا أظهر Discord حالة الكتابة وأظهرت السجلات استخدام الرموز ولكن لم تُنشر أي رسالة، فتحقق من سجل الجلسة بحثًا عن نص المساعد مع `didSendViaMessagingTool: false`. يعني هذا أن النموذج أنشأ إجابة نهائية خاصة بدلًا من استدعاء `message(action=send)`. انتقل إلى نموذج أقوى في استدعاء الأدوات، أو استخدم التكوين أدناه لاستعادة الردود النهائية التلقائية القديمة.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "اسمح لوكيلي بالرد على هذا الخادم بدون الحاجة إلى أن تتم الإشارة إليه بـ @"
      </Tab>
      <Tab title="التكوين">
        اضبط `requireMention: false` في تكوين النقابة لديك:

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

  <Step title="التخطيط للذاكرة في قنوات النقابة">
    افتراضيًا، لا تُحمّل الذاكرة طويلة المدى (MEMORY.md) إلا في جلسات الرسائل المباشرة. لا تُحمّل قنوات النقابة MEMORY.md تلقائيًا.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "عندما أطرح أسئلة في قنوات Discord، استخدم memory_search أو memory_get إذا كنت تحتاج إلى سياق طويل المدى من MEMORY.md."
      </Tab>
      <Tab title="يدوي">
        إذا كنت تحتاج إلى سياق مشترك في كل قناة، فضع التعليمات الثابتة في `AGENTS.md` أو `USER.md` (يتم حقنها في كل جلسة). احتفظ بالملاحظات طويلة المدى في `MEMORY.md` وادخل إليها عند الطلب باستخدام أدوات الذاكرة.
      </Tab>
    </Tabs>

  </Step>
</Steps>

أنشئ الآن بعض القنوات على خادم Discord وابدأ الدردشة. يستطيع وكيلك رؤية اسم القناة، وتحصل كل قناة على جلستها المعزولة الخاصة — بحيث يمكنك إعداد `#coding` أو `#home` أو `#research` أو أي شيء يناسب سير عملك.

## نموذج وقت التشغيل

- يملك Gateway اتصال Discord.
- توجيه الردود حتمي: تعود الردود الواردة من Discord إلى Discord.
- تُضاف بيانات تعريف خادم/قناة Discord إلى موجّه النموذج كسياق غير موثوق
  به، وليس كبادئة رد مرئية للمستخدم. إذا نسخ نموذج ذلك الغلاف
  مرة أخرى، يزيل OpenClaw بيانات التعريف المنسوخة من الردود الصادرة ومن
  سياق إعادة التشغيل المستقبلي.
- افتراضيًا (`session.dmScope=main`)، تشارك المحادثات المباشرة جلسة الوكيل الرئيسية (`agent:main:main`).
- قنوات الخوادم هي مفاتيح جلسات معزولة (`agent:<agentId>:discord:channel:<channelId>`).
- تُتجاهل الرسائل المباشرة الجماعية افتراضيًا (`channels.discord.dm.groupEnabled=false`).
- تعمل أوامر slash الأصلية في جلسات أوامر معزولة (`agent:<agentId>:discord:slash:<userId>`)، مع الاستمرار في حمل `CommandTargetSessionKey` إلى جلسة المحادثة الموجّهة.
- يستخدم تسليم إعلانات cron/heartbeat النصية فقط إلى Discord الإجابة النهائية
  المرئية للمساعد مرة واحدة. تبقى حمولات الوسائط والمكوّنات المهيكلة
  متعددة الرسائل عندما يصدر الوكيل عدة حمولات قابلة للتسليم.

## قنوات المنتديات

تقبل قنوات المنتديات والوسائط في Discord منشورات السلاسل فقط. يدعم OpenClaw طريقتين لإنشائها:

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

يدعم OpenClaw حاويات مكوّنات Discord v2 لرسائل الوكيل. استخدم أداة الرسائل مع حمولة `components`. تُوجَّه نتائج التفاعل مرة أخرى إلى الوكيل كرسائل واردة عادية وتتبع إعدادات Discord `replyToMode` الحالية.

الكتل المدعومة:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- تسمح صفوف الإجراءات بما يصل إلى 5 أزرار أو قائمة اختيار واحدة
- أنواع الاختيار: `string`, `user`, `role`, `mentionable`, `channel`

افتراضيًا، تكون المكوّنات للاستخدام مرة واحدة. عيّن `components.reusable=true` للسماح باستخدام الأزرار والاختيارات والنماذج عدة مرات حتى تنتهي صلاحيتها.

لتقييد من يمكنه النقر على زر، عيّن `allowedUsers` على ذلك الزر (معرّفات مستخدمي Discord أو الوسوم أو `*`). عند التهيئة، يتلقى المستخدمون غير المطابقين رفضًا عابرًا.

تفتح أوامر slash `/model` و`/models` منتقي نماذج تفاعليًا مع قوائم منسدلة لمزوّد الخدمة والنموذج وبيئة التشغيل المتوافقة، إضافة إلى خطوة إرسال. أصبح `/models add` مهمَلًا، ويعيد الآن رسالة إهمال بدلًا من تسجيل النماذج من الدردشة. يكون رد المنتقي عابرًا ولا يمكن استخدامه إلا للمستخدم الذي استدعاه. قوائم اختيار Discord محدودة بـ 25 خيارًا، لذا أضف إدخالات `provider/*` إلى `agents.defaults.models` عندما تريد أن يعرض المنتقي النماذج المكتشفة ديناميكيًا فقط لمزوّدي خدمات محددين مثل `openai-codex` أو `vllm`.

مرفقات الملفات:

- يجب أن تشير كتل `file` إلى مرجع مرفق (`attachment://<filename>`)
- وفّر المرفق عبر `media`/`path`/`filePath` (ملف واحد)؛ استخدم `media-gallery` لعدة ملفات
- استخدم `filename` لتجاوز اسم الرفع عندما يجب أن يطابق مرجع المرفق

نماذج Modal:

- أضف `components.modal` مع ما يصل إلى 5 حقول
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
  <Tab title="DM policy">
    يتحكم `channels.discord.dmPolicy` في الوصول إلى الرسائل المباشرة. `channels.discord.allowFrom` هي قائمة السماح الأساسية للرسائل المباشرة.

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `channels.discord.allowFrom` القيمة `"*"`)
    - `disabled`

    إذا لم تكن سياسة الرسائل المباشرة مفتوحة، يُحظر المستخدمون غير المعروفين (أو يُطلب منهم الاقتران في وضع `pairing`).

    أسبقية الحسابات المتعددة:

    - ينطبق `channels.discord.accounts.default.allowFrom` فقط على حساب `default`.
    - لحساب واحد، يكون لـ `allowFrom` أسبقية على `dm.allowFrom` القديم.
    - ترث الحسابات المسماة `channels.discord.allowFrom` عندما لا تكون قيمتا `allowFrom` الخاصة بها و`dm.allowFrom` القديمة معيّنتين.
    - لا ترث الحسابات المسماة `channels.discord.accounts.default.allowFrom`.

    ما زالت قيمتا `channels.discord.dm.policy` و`channels.discord.dm.allowFrom` القديمتان تُقرآن للتوافق. يرحّلهما `openclaw doctor --fix` إلى `dmPolicy` و`allowFrom` عندما يستطيع فعل ذلك دون تغيير الوصول.

    تنسيق هدف الرسائل المباشرة للتسليم:

    - `user:<id>`
    - إشارة `<@id>`

    عادةً ما تُحل معرّفات الأرقام المجردة كمعرّفات قنوات عندما تكون قناة افتراضية نشطة، لكن المعرّفات المدرجة في `allowFrom` الفعّالة للرسائل المباشرة في الحساب تُعامل كأهداف رسائل مباشرة للمستخدمين لأغراض التوافق.

  </Tab>

  <Tab title="Access groups">
    يمكن لتفويض رسائل Discord المباشرة وأوامر النص استخدام إدخالات `accessGroup:<name>` الديناميكية في `channels.discord.allowFrom`.

    تتم مشاركة أسماء مجموعات الوصول عبر قنوات الرسائل. استخدم `type: "message.senders"` لمجموعة ثابتة يُعبَّر عن أعضائها ببنية `allowFrom` العادية لكل قناة، أو `type: "discord.channelAudience"` عندما يجب أن يحدد جمهور `ViewChannel` الحالي لقناة Discord العضوية ديناميكيًا. سلوك مجموعات الوصول المشتركة موثق هنا: [مجموعات الوصول](/ar/channels/access-groups).

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

    لا تحتوي قناة نصية في Discord على قائمة أعضاء منفصلة. يمثّل `type: "discord.channelAudience"` العضوية على النحو التالي: يكون مرسل الرسالة المباشرة عضوًا في الخادم المهيأ ولديه حاليًا إذن `ViewChannel` فعّال على القناة المهيأة بعد تطبيق تجاوزات الأدوار والقنوات.

    مثال: السماح لأي شخص يستطيع رؤية `#maintainers` بمراسلة البوت مباشرة، مع إبقاء الرسائل المباشرة مغلقة أمام الجميع غير ذلك.

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

    تفشل عمليات البحث بإغلاق الوصول. إذا أعاد Discord القيمة `Missing Access`، أو فشل بحث العضو، أو كانت القناة تنتمي إلى خادم مختلف، يُعامل مرسل الرسالة المباشرة كغير مصرّح له.

    فعّل **Server Members Intent** في Discord Developer Portal للبوت عند استخدام مجموعات وصول جمهور القناة. لا تتضمن الرسائل المباشرة حالة عضو الخادم، لذلك يحل OpenClaw العضو عبر Discord REST وقت التفويض.

  </Tab>

  <Tab title="Guild policy">
    يتحكم `channels.discord.groupPolicy` في معالجة الخوادم:

    - `open`
    - `allowlist`
    - `disabled`

    خط الأساس الآمن عندما يكون `channels.discord` موجودًا هو `allowlist`.

    سلوك `allowlist`:

    - يجب أن يطابق الخادم `channels.discord.guilds` (يُفضّل `id`، ويُقبل slug)
    - قوائم سماح اختيارية للمرسلين: `users` (يُوصى بالمعرّفات الثابتة) و`roles` (معرّفات الأدوار فقط)؛ إذا تمت تهيئة أي منهما، يُسمح للمرسلين عندما يطابقون `users` أو `roles`
    - تكون المطابقة المباشرة بالاسم/الوسم معطلة افتراضيًا؛ فعّل `channels.discord.dangerouslyAllowNameMatching: true` فقط كوضع توافق لكسر الزجاج
    - الأسماء/الوسوم مدعومة لـ `users`، لكن المعرّفات أكثر أمانًا؛ يحذّر `openclaw security audit` عند استخدام إدخالات الاسم/الوسم
    - إذا كان لدى خادم `channels` مهيأة، تُرفض القنوات غير المدرجة
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

    إذا عيّنت `DISCORD_BOT_TOKEN` فقط ولم تنشئ كتلة `channels.discord`، يكون الرجوع في وقت التشغيل هو `groupPolicy="allowlist"` (مع تحذير في السجلات)، حتى إذا كان `channels.defaults.groupPolicy` هو `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    تكون رسائل الخوادم محكومة بالإشارات افتراضيًا.

    يتضمن كشف الإشارات:

    - إشارة صريحة إلى البوت
    - أنماط الإشارة المهيأة (`agents.list[].groupChat.mentionPatterns`، والاحتياطي `messages.groupChat.mentionPatterns`)
    - سلوك الرد الضمني على البوت في الحالات المدعومة

    عند كتابة رسائل Discord صادرة، استخدم بنية الإشارة الأساسية: `<@USER_ID>` للمستخدمين، و`<#CHANNEL_ID>` للقنوات، و`<@&ROLE_ID>` للأدوار. لا تستخدم صيغة إشارة اللقب القديمة `<@!USER_ID>`.

    تتم تهيئة `requireMention` لكل خادم/قناة (`channels.discord.guilds...`).
    يزيل `ignoreOtherMentions` اختياريًا الرسائل التي تشير إلى مستخدم/دور آخر ولكن لا تشير إلى البوت (باستثناء @everyone/@here).

    الرسائل المباشرة الجماعية:

    - افتراضيًا: متجاهلة (`dm.groupEnabled=false`)
    - قائمة سماح اختيارية عبر `dm.groupChannels` (معرّفات قنوات أو slugs)

  </Tab>
</Tabs>

### توجيه الوكلاء المستند إلى الأدوار

استخدم `bindings[].match.roles` لتوجيه أعضاء خوادم Discord إلى وكلاء مختلفين حسب معرّف الدور. تقبل الارتباطات المستندة إلى الأدوار معرّفات الأدوار فقط، وتُقيَّم بعد ارتباطات النظير أو النظير الأصل وقبل ارتباطات الخادم فقط. إذا عيّن ارتباط حقول مطابقة أخرى أيضًا (مثلًا `peer` + `guildId` + `roles`)، فيجب أن تتطابق كل الحقول المهيأة.

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

- يتم تعيين القيمة الافتراضية لـ `commands.native` إلى `"auto"` ويكون مفعلا لـ Discord.
- التجاوز لكل قناة: `channels.discord.commands.native`.
- يؤدي `commands.native=false` إلى تخطي تسجيل أوامر الشرطة المائلة في Discord وتنظيفها أثناء بدء التشغيل. قد تبقى الأوامر المسجلة سابقا مرئية في Discord إلى أن تزيلها من تطبيق Discord.
- تستخدم مصادقة الأوامر الأصلية قوائم السماح/السياسات نفسها في Discord مثل معالجة الرسائل العادية.
- قد تظل الأوامر مرئية في واجهة Discord للمستخدمين غير المصرح لهم؛ لكن التنفيذ يظل يفرض مصادقة OpenClaw ويعيد "غير مصرح".

راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands) لمعرفة كتالوج الأوامر وسلوكها.

إعدادات أوامر الشرطة المائلة الافتراضية:

- `ephemeral: true`

## تفاصيل الميزة

<AccordionGroup>
  <Accordion title="وسوم الرد والردود الأصلية">
    يدعم Discord وسوم الرد في مخرجات الوكيل:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    يتم التحكم فيها بواسطة `channels.discord.replyToMode`:

    - `off` (الافتراضي)
    - `first`
    - `all`
    - `batched`

    ملاحظة: يعطل `off` تسلسل الردود الضمني. تظل وسوم `[[reply_to_*]]` الصريحة محترمة.
    يرفق `first` دائما مرجع الرد الأصلي الضمني بأول رسالة صادرة في Discord لذلك الدور.
    لا يرفق `batched` مرجع الرد الأصلي الضمني في Discord إلا عندما يكون
    الدور الوارد دفعة مؤجلة من رسائل متعددة. يكون هذا مفيدا
    عندما تريد الردود الأصلية أساسا للمحادثات المتدفقة الملتبسة، وليس لكل
    دور ذي رسالة واحدة.

    تظهر معرفات الرسائل في السياق/السجل حتى يتمكن الوكلاء من استهداف رسائل محددة.

  </Accordion>

  <Accordion title="معاينة البث المباشر">
    يمكن لـ OpenClaw بث مسودات الردود عبر إرسال رسالة مؤقتة وتعديلها مع وصول النص. يأخذ `channels.discord.streaming` القيم `off` | `partial` | `block` | `progress` (الافتراضي). يحتفظ `progress` بمسودة حالة واحدة قابلة للتعديل ويحدثها بتقدم الأدوات حتى التسليم النهائي؛ تسمية البدء المشتركة سطر متحرك، لذلك تختفي بالتمرير مثل البقية بمجرد ظهور عمل كاف. `streamMode` اسم مستعار قديم وقت التشغيل. شغل `openclaw doctor --fix` لإعادة كتابة الإعدادات المحفوظة إلى المفتاح القانوني.

    عيّن `channels.discord.streaming.mode` إلى `off` لتعطيل تعديلات معاينة Discord. إذا تم تفعيل بث كتل Discord صراحة، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

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
    - يصدر `block` أجزاء بحجم المسودة (استخدم `draftChunk` لضبط الحجم ونقاط الفصل، مع تقييدها إلى `textChunkLimit`).
    - تؤدي نهائيات الوسائط والأخطاء والردود الصريحة إلى إلغاء تعديلات المعاينة المعلقة.
    - يتحكم `streaming.preview.toolProgress` (الافتراضي `true`) فيما إذا كانت تحديثات الأداة/التقدم تعيد استخدام رسالة المعاينة.
    - تعرض صفوف الأداة/التقدم كرمز تعبيري مضغوط + عنوان + تفاصيل عند توفرها، مثلا `🛠️ Bash: run tests` أو `🔎 Web Search: for "query"`.
    - يتحكم `streaming.preview.commandText` / `streaming.progress.commandText` في تفاصيل الأمر/التنفيذ في أسطر التقدم المضغوطة: `raw` (الافتراضي) أو `status` (تسمية الأداة فقط).

    إخفاء نص الأمر/التنفيذ الخام مع الإبقاء على أسطر التقدم المضغوطة:

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

    بث المعاينة نصي فقط؛ تعود ردود الوسائط إلى التسليم العادي. عندما يتم تفعيل بث `block` صراحة، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

  </Accordion>

  <Accordion title="السجل والسياق وسلوك سلاسل المحادثة">
    سياق سجل الخادم:

    - الافتراضي `channels.discord.historyLimit` هو `20`
    - البديل: `messages.groupChat.historyLimit`
    - `0` يعطل

    عناصر التحكم في سجل الرسائل الخاصة:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    سلوك سلاسل المحادثة:

    - يتم توجيه سلاسل Discord كجلسات قناة وترث إعدادات القناة الأصلية ما لم يتم تجاوزها.
    - ترث جلسات سلسلة المحادثة اختيار `/model` على مستوى جلسة القناة الأصلية كبديل خاص بالنموذج فقط؛ تظل اختيارات `/model` المحلية للسلسلة ذات أولوية، ولا يتم نسخ سجل النصوص الأصلي ما لم يتم تفعيل وراثة النصوص.
    - يختار `channels.discord.thread.inheritParent` (الافتراضي `false`) سلاسل المحادثة التلقائية الجديدة لتهيئتها من نص القناة الأصلية. توجد التجاوزات لكل حساب ضمن `channels.discord.accounts.<id>.thread.inheritParent`.
    - يمكن لتفاعلات أداة الرسائل حل أهداف الرسائل الخاصة `user:<id>`.
    - يتم الحفاظ على `guilds.<guild>.channels.<channel>.requireMention: false` أثناء بديل تفعيل مرحلة الرد.

    يتم حقن مواضيع القنوات كسياق **غير موثوق**. تتحكم قوائم السماح في من يستطيع تشغيل الوكيل، وليست حد تنقيح كامل لسياق تكميلي.

  </Accordion>

  <Accordion title="جلسات مرتبطة بسلسلة المحادثة للوكلاء الفرعيين">
    يمكن لـ Discord ربط سلسلة محادثة بهدف جلسة بحيث تستمر الرسائل اللاحقة في تلك السلسلة بالتوجيه إلى الجلسة نفسها (بما في ذلك جلسات الوكيل الفرعي).

    الأوامر:

    - `/focus <target>` ربط سلسلة المحادثة الحالية/الجديدة بهدف وكيل فرعي/جلسة
    - `/unfocus` إزالة ربط سلسلة المحادثة الحالية
    - `/agents` عرض التشغيلات النشطة وحالة الربط
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
        spawnSessions: true,
        defaultSpawnContext: "fork",
      },
    },
  },
}
```

    ملاحظات:

    - يحدد `session.threadBindings.*` القيم الافتراضية العامة.
    - يتجاوز `channels.discord.threadBindings.*` سلوك Discord.
    - يتحكم `spawnSessions` في الإنشاء/الربط التلقائي لسلاسل المحادثة لـ `sessions_spawn({ thread: true })` وعمليات إنشاء سلاسل ACP. الافتراضي: `true`.
    - يتحكم `defaultSpawnContext` في سياق الوكيل الفرعي الأصلي لعمليات الإنشاء المرتبطة بسلسلة المحادثة. الافتراضي: `"fork"`.
    - يتم ترحيل مفاتيح `spawnSubagentSessions`/`spawnAcpSessions` المهملة بواسطة `openclaw doctor --fix`.
    - إذا كانت ارتباطات سلاسل المحادثة معطلة لحساب، فإن `/focus` وعمليات ربط سلاسل المحادثة ذات الصلة لا تكون متاحة.

    راجع [الوكلاء الفرعيين](/ar/tools/subagents)، و[وكلاء ACP](/ar/tools/acp-agents)، و[مرجع الإعدادات](/ar/gateway/configuration-reference).

  </Accordion>

  <Accordion title="ارتباطات قنوات ACP المستمرة">
    لمساحات عمل ACP مستقرة "دائمة التشغيل"، اضبط ارتباطات ACP المكتوبة على المستوى الأعلى التي تستهدف محادثات Discord.

    مسار الإعدادات:

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

    - يربط `/acp spawn codex --bind here` القناة أو سلسلة المحادثة الحالية في مكانها ويحافظ على الرسائل المستقبلية في جلسة ACP نفسها. ترث رسائل سلسلة المحادثة ربط القناة الأصلية.
    - في قناة أو سلسلة محادثة مرتبطة، يعيد `/new` و`/reset` ضبط جلسة ACP نفسها في مكانها. يمكن لارتباطات سلسلة المحادثة المؤقتة تجاوز حل الهدف أثناء نشاطها.
    - يتحكم `spawnSessions` في إنشاء/ربط سلاسل المحادثة الفرعية عبر `--thread auto|here`.

    راجع [وكلاء ACP](/ar/tools/acp-agents) للحصول على تفاصيل سلوك الربط.

  </Accordion>

  <Accordion title="إشعارات التفاعلات">
    وضع إشعار التفاعل لكل خادم:

    - `off`
    - `own` (الافتراضي)
    - `all`
    - `allowlist` (يستخدم `guilds.<id>.users`)

    يتم تحويل أحداث التفاعل إلى أحداث نظام وإرفاقها بجلسة Discord الموجهة.

  </Accordion>

  <Accordion title="تفاعلات الإقرار">
    يرسل `ackReaction` رمزا تعبيريا للإقرار أثناء معالجة OpenClaw لرسالة واردة.

    ترتيب الحل:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - بديل الرمز التعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يقبل Discord الرموز التعبيرية الموحّدة أو أسماء الرموز التعبيرية المخصصة.
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="كتابات الإعدادات">
    يتم تفعيل كتابات الإعدادات التي تبدأها القناة افتراضيا.

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
    وجّه حركة WebSocket الخاصة بـ Gateway في Discord وعمليات بحث REST عند بدء التشغيل (معرف التطبيق + حل قائمة السماح) عبر وكيل HTTP(S) باستخدام `channels.discord.proxy`.

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
    - تتم مطابقة أسماء عرض الأعضاء بالاسم/الاسم المختصر فقط عندما يكون `channels.discord.dangerouslyAllowNameMatching: true`
    - تستخدم عمليات البحث معرف الرسالة الأصلي وتكون مقيدة بنافذة زمنية
    - إذا فشلت عملية البحث، تعامل الرسائل الموكلة كرسائل بوت ويتم إسقاطها ما لم يكن `allowBots=true`

  </Accordion>

  <Accordion title="أسماء مستعارة للإشارات الصادرة">
    استخدم `mentionAliases` عندما يحتاج الوكلاء إلى إشارات صادرة حتمية لمستخدمي Discord معروفين. المفاتيح هي مقابض دون `@` البادئة؛ والقيم هي معرفات مستخدمي Discord. تترك المقابض غير المعروفة، و`@everyone`، و`@here`، والإشارات داخل مقاطع كود Markdown دون تغيير.

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

  <Accordion title="إعدادات الحضور">
    يتم تطبيق تحديثات الحضور عندما تضبط حقل حالة أو نشاط، أو عندما تفعّل الحضور التلقائي.

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

    خريطة نوع النشاط:

    - 0: اللعب
    - 1: البث (يتطلب `activityUrl`)
    - 2: الاستماع
    - 3: المشاهدة
    - 4: مخصص (يستخدم نص النشاط كحالة للحالة؛ الرمز التعبيري اختياري)
    - 5: المنافسة

    مثال الحضور التلقائي (إشارة سلامة وقت التشغيل):

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
    يدعم Discord التعامل مع الموافقات المستندة إلى الأزرار في الرسائل الخاصة، ويمكنه اختياريًا نشر مطالبات الموافقة في القناة الأصلية.

    مسار الإعداد:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختياري؛ يعود إلى `commands.ownerAllowFrom` عندما يكون ذلك ممكنًا)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
    - `agentFilter`، `sessionFilter`، `cleanupAfterResolve`

    يفعّل Discord موافقات التنفيذ الأصلية تلقائيًا عندما يكون `enabled` غير معيّن أو `"auto"` ويمكن حل موافق واحد على الأقل، إما من `execApprovals.approvers` أو من `commands.ownerAllowFrom`. لا يستنتج Discord موافقي التنفيذ من `allowFrom` الخاصة بالقناة، أو `dm.allowFrom` القديمة، أو `defaultTo` الخاصة بالرسائل المباشرة. عيّن `enabled: false` لتعطيل Discord كعميل موافقة أصلي صراحةً.

    بالنسبة إلى أوامر المجموعات الحساسة المخصصة للمالك فقط مثل `/diagnostics` و`/export-trajectory`، يرسل OpenClaw مطالبات الموافقة والنتائج النهائية بشكل خاص. يحاول استخدام رسالة Discord خاصة أولًا عندما يكون للمالك المستدعي مسار مالك على Discord؛ وإذا لم يكن ذلك متاحًا، يعود إلى أول مسار مالك متاح من `commands.ownerAllowFrom`، مثل Telegram.

    عندما تكون `target` هي `channel` أو `both`، تكون مطالبة الموافقة مرئية في القناة. لا يمكن استخدام الأزرار إلا للموافقين الذين تم حلهم؛ ويتلقى المستخدمون الآخرون رفضًا عابرًا. تتضمن مطالبات الموافقة نص الأمر، لذلك لا تفعّل التسليم إلى القناة إلا في القنوات الموثوقة. إذا تعذر اشتقاق معرّف القناة من مفتاح الجلسة، يعود OpenClaw إلى التسليم عبر الرسائل الخاصة.

    يعرض Discord أيضًا أزرار الموافقة المشتركة التي تستخدمها قنوات الدردشة الأخرى. يضيف محوّل Discord الأصلي بشكل أساسي توجيه الرسائل الخاصة للموافقين والتوزيع إلى القنوات.
    عند وجود هذه الأزرار، تكون هي تجربة الموافقة الأساسية؛ ويجب على OpenClaw
    تضمين أمر `/approve` يدوي فقط عندما تفيد نتيجة الأداة بأن
    موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.
    إذا لم يكن وقت تشغيل الموافقة الأصلي في Discord نشطًا، يبقي OpenClaw
    مطالبة `/approve <id> <decision>` الحتمية المحلية مرئية. إذا كان
    وقت التشغيل نشطًا ولكن تعذر تسليم بطاقة أصلية إلى أي هدف،
    يرسل OpenClaw إشعار رجوع في الدردشة نفسها يتضمن أمر `/approve`
    الدقيق من الموافقة المعلقة.

    تتبع مصادقة Gateway وحل الموافقات عقد عميل Gateway المشترك (تُحل معرّفات `plugin:` عبر `plugin.approval.resolve`؛ وتُحل المعرّفات الأخرى عبر `exec.approval.resolve`). تنتهي صلاحية الموافقات بعد 30 دقيقة افتراضيًا.

    راجع [موافقات التنفيذ](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## الأدوات وبوابات الإجراءات

تتضمن إجراءات رسائل Discord إجراءات المراسلة وإدارة القنوات والإشراف والحضور والبيانات الوصفية.

أمثلة أساسية:

- المراسلة: `sendMessage`، `readMessages`، `editMessage`، `deleteMessage`، `threadReply`
- التفاعلات: `react`، `reactions`، `emojiList`
- الإشراف: `timeout`، `kick`، `ban`
- الحضور: `setPresence`

يقبل الإجراء `event-create` معلمة `image` اختيارية (URL أو مسار ملف محلي) لتعيين صورة غلاف الحدث المجدول.

توجد بوابات الإجراءات ضمن `channels.discord.actions.*`.

سلوك البوابة الافتراضي:

| مجموعة الإجراءات                                                                                                                                                         | الافتراضي |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions، messages، threads، pins، polls، search، memberInfo، roleInfo، channelInfo، channels، voiceStatus، events، stickers، emojiUploads، stickerUploads، permissions | مفعّل    |
| roles                                                                                                                                                                    | معطّل    |
| moderation                                                                                                                                                               | معطّل    |
| presence                                                                                                                                                                 | معطّل    |

## واجهة مستخدم Components v2

يستخدم OpenClaw مكونات Discord v2 لموافقات التنفيذ وعلامات السياقات المتعددة. يمكن لإجراءات رسائل Discord أيضًا قبول `components` لواجهة مستخدم مخصصة (متقدم؛ يتطلب إنشاء حمولة مكوّن عبر أداة discord)، بينما تظل `embeds` القديمة متاحة لكنها غير موصى بها.

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

لدى Discord سطحان صوتيان متميزان: **قنوات الصوت** في الوقت الفعلي (محادثات مستمرة) و**مرفقات الرسائل الصوتية** (تنسيق معاينة الموجة). يدعم Gateway كليهما.

### قنوات الصوت

قائمة التحقق للإعداد:

1. فعّل Message Content Intent في Discord Developer Portal.
2. فعّل Server Members Intent عند استخدام قوائم السماح للأدوار/المستخدمين.
3. ادعُ الروبوت باستخدام نطاقي `bot` و`applications.commands`.
4. امنح أذونات Connect وSpeak وSend Messages وRead Message History في قناة الصوت الهدف.
5. فعّل الأوامر الأصلية (`commands.native` أو `channels.discord.commands.native`).
6. اضبط `channels.discord.voice`.

استخدم `/vc join|leave|status` للتحكم في الجلسات. يستخدم الأمر الوكيل الافتراضي للحساب ويتبع قواعد قائمة السماح وسياسة المجموعات نفسها مثل أوامر Discord الأخرى.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

لفحص الأذونات الفعلية للروبوت قبل الانضمام، شغّل:

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

مثال الانضمام التلقائي:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai-codex/gpt-5.5",
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
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

ملاحظات:

- يتجاوز `voice.tts` إعداد `messages.tts` لتشغيل الصوت في `stt-tts` فقط. تستخدم أوضاع الوقت الحقيقي `voice.realtime.voice`.
- يتحكم `voice.mode` في مسار المحادثة. القيمة الافتراضية هي `agent-proxy`: تتولى واجهة صوتية في الوقت الحقيقي إدارة توقيت الأدوار، والمقاطعة، والتشغيل، وتفوّض العمل الجوهري إلى وكيل OpenClaw الموجّه عبر `openclaw_agent_consult`، وتتعامل مع النتيجة كما لو كانت مطالبة Discord مكتوبة من ذلك المتحدث. يحتفظ `stt-tts` بالتدفق الأقدم القائم على STT الدفعي مع TTS. يتيح `bidi` لنموذج الوقت الحقيقي المحادثة مباشرة مع إتاحة `openclaw_agent_consult` لعقل OpenClaw.
- يتحكم `voice.agentSession` في محادثة OpenClaw التي تستقبل أدوار الصوت. اتركه غير معيّن لاستخدام جلسة قناة الصوت نفسها، أو اضبط `{ mode: "target", target: "channel:<text-channel-id>" }` لجعل قناة الصوت تعمل كامتداد ميكروفون/مكبر صوت لجلسة قناة نصية موجودة في Discord مثل `#maintainers`.
- يتجاوز `voice.model` عقل وكيل OpenClaw لاستجابات Discord الصوتية والاستشارات في الوقت الحقيقي. اتركه غير معيّن ليرث نموذج الوكيل الموجّه. وهو منفصل عن `voice.realtime.model`.
- يوجّه `agent-proxy` الكلام عبر `discord-voice`، ما يحافظ على تفويض المالك/الأدوات العادي للمتحدث والجلسة المستهدفة لكنه يخفي أداة الوكيل `tts` لأن صوت Discord يمتلك التشغيل. افتراضياً، يمنح `agent-proxy` الاستشارة وصولاً كاملاً إلى الأدوات بمستوى مكافئ للمالك للمتحدثين المالكين (`voice.realtime.toolPolicy: "owner"`) ويفضل بشدة استشارة وكيل OpenClaw قبل الإجابات الجوهرية (`voice.realtime.consultPolicy: "always"`). في وضع `always` الافتراضي هذا، لا تنطق طبقة الوقت الحقيقي كلاماً حشوياً تلقائياً قبل إجابة الاستشارة؛ بل تلتقط الكلام وتنسخه، ثم تنطق إجابة OpenClaw الموجّهة. إذا انتهت عدة إجابات استشارة مفروضة بينما لا يزال Discord يشغل الإجابة الأولى، تُصفّ إجابات الكلام الدقيقة اللاحقة حتى يصبح التشغيل خاملاً بدلاً من استبدال الكلام في منتصف الجملة.
- في وضع `stt-tts`، يستخدم STT `tools.media.audio`؛ ولا يؤثر `voice.model` في النسخ.
- في أوضاع الوقت الحقيقي، تضبط `voice.realtime.provider` و`voice.realtime.model` و`voice.realtime.voice` جلسة الصوت في الوقت الحقيقي. لاستخدام OpenAI Realtime 2 مع عقل Codex، استخدم `voice.realtime.model: "gpt-realtime-2"` و`voice.model: "openai-codex/gpt-5.5"`.
- يقبل موفر الوقت الحقيقي في OpenAI أسماء أحداث Realtime 2 الحالية والأسماء المستعارة القديمة المتوافقة مع Codex لأحداث صوت المخرجات والنص المنسوخ، بحيث يمكن أن تنحرف لقطات الموفر المتوافقة دون إسقاط صوت المساعد.
- يتحكم `voice.realtime.bargeIn` فيما إذا كانت أحداث بدء المتحدث في Discord تقاطع التشغيل النشط في الوقت الحقيقي. إذا تُرك غير معيّن، فإنه يتبع إعداد مقاطعة صوت الإدخال لدى موفر الوقت الحقيقي.
- يتحكم `voice.realtime.minBargeInAudioEndMs` في الحد الأدنى لمدة تشغيل المساعد قبل أن تقطع مقاطعة OpenAI في الوقت الحقيقي الصوت. الافتراضي: `250`. اضبط `0` للمقاطعة الفورية في الغرف منخفضة الصدى، أو ارفعه لإعدادات مكبرات الصوت كثيرة الصدى.
- لاستخدام صوت OpenAI في تشغيل Discord، اضبط `voice.tts.provider: "openai"` واختر صوت تحويل نص إلى كلام ضمن `voice.tts.openai.voice` أو `voice.tts.providers.openai.voice`. يُعد `cedar` خياراً جيداً ذا طابع صوتي ذكوري على نموذج TTS الحالي من OpenAI.
- تنطبق تجاوزات `systemPrompt` في Discord لكل قناة على أدوار نصوص الصوت المنسوخة لتلك القناة الصوتية.
- تستمد أدوار نصوص الصوت المنسوخة حالة المالك من `allowFrom` في Discord (أو `dm.allowFrom`)؛ ولا يمكن للمتحدثين غير المالكين الوصول إلى الأدوات المخصصة للمالك فقط (مثل `gateway` و`cron`).
- صوت Discord اختياري للإعدادات النصية فقط؛ اضبط `channels.discord.voice.enabled=true` (أو أبقِ كتلة `channels.discord.voice` موجودة) لتمكين أوامر `/vc`، ووقت تشغيل الصوت، وقصد Gateway `GuildVoiceStates`.
- يمكن لـ `channels.discord.intents.voiceStates` تجاوز اشتراك قصد حالة الصوت صراحةً. اتركه غير معيّن ليتبع القصد حالة تمكين الصوت الفعلية.
- إذا احتوى `voice.autoJoin` على عدة إدخالات للنقابة نفسها، ينضم OpenClaw إلى آخر قناة مهيأة لتلك النقابة.
- `voice.allowedChannels` قائمة سماح اختيارية للإقامة. اتركها غير معيّنة للسماح لـ `/vc join` بالدخول إلى أي قناة صوتية مصرّح بها في Discord. عند تعيينها، تُقيّد عمليات `/vc join` والانضمام التلقائي عند بدء التشغيل ونقل حالة صوت البوت بالإدخالات المدرجة `{ guildId, channelId }`. اضبطها على مصفوفة فارغة لرفض جميع عمليات انضمام Discord الصوتية. إذا نقل Discord البوت خارج قائمة السماح، يغادر OpenClaw تلك القناة ويعيد الانضمام إلى هدف الانضمام التلقائي المهيأ عندما يكون متاحاً.
- يمرر `voice.daveEncryption` و`voice.decryptionFailureTolerance` إلى خيارات الانضمام في `@discordjs/voice`.
- الإعدادات الافتراضية لـ `@discordjs/voice` هي `daveEncryption=true` و`decryptionFailureTolerance=24` إذا تُركت غير معيّنة.
- يستخدم OpenClaw افتراضياً مفكك ترميز `opusscript` المكتوب بـ JS فقط لاستقبال صوت Discord. يتجاهل repo حزمة `@discordjs/opus` الأصلية الاختيارية وفق سياسة تثبيت pnpm، بحيث لا تقوم عمليات التثبيت العادية ومسارات Docker والاختبارات غير ذات الصلة بتجميع إضافة أصلية. يمكن لمضيفي أداء الصوت المخصصين الاشتراك عبر `OPENCLAW_DISCORD_OPUS_DECODER=native` بعد تثبيت الإضافة الأصلية.
- يتحكم `voice.connectTimeoutMs` في انتظار Ready الأولي الخاص بـ `@discordjs/voice` لمحاولات `/vc join` والانضمام التلقائي. الافتراضي: `30000`.
- يتحكم `voice.reconnectGraceMs` في مدة انتظار OpenClaw لجلسة صوتية منقطعة كي تبدأ إعادة الاتصال قبل تدميرها. الافتراضي: `15000`.
- في وضع `stt-tts`، لا يتوقف تشغيل الصوت لمجرد أن مستخدماً آخر بدأ الكلام. لتجنب حلقات التغذية الراجعة، يتجاهل OpenClaw التقاط الصوت الجديد أثناء تشغيل TTS؛ تحدث بعد انتهاء التشغيل للدور التالي. تمرر أوضاع الوقت الحقيقي بدايات المتحدث كإشارات مقاطعة إلى موفر الوقت الحقيقي.
- في أوضاع الوقت الحقيقي، قد يبدو الصدى من مكبرات الصوت إلى ميكروفون مفتوح كمقاطعة ويقاطع التشغيل. لغرف Discord كثيرة الصدى، اضبط `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` لمنع OpenAI من المقاطعة التلقائية عند صوت الإدخال. أضف `voice.realtime.bargeIn: true` إذا كنت لا تزال تريد أن تقاطع أحداث بدء المتحدث في Discord التشغيل النشط. يتجاهل جسر OpenAI في الوقت الحقيقي عمليات اقتطاع التشغيل الأقصر من `voice.realtime.minBargeInAudioEndMs` باعتبارها غالباً صدى/ضجيجاً ويسجلها كمتخطاة بدلاً من مسح تشغيل Discord.
- يتحكم `voice.captureSilenceGraceMs` في مدة انتظار OpenClaw بعد أن يبلغ Discord بأن المتحدث توقف قبل إنهاء ذلك المقطع الصوتي لـ STT. الافتراضي: `2500`؛ ارفع هذه القيمة إذا كان Discord يقسم الوقفات الطبيعية إلى نصوص منسوخة جزئية متقطعة.
- عندما يكون ElevenLabs هو موفر TTS المحدد، يستخدم تشغيل صوت Discord TTS بالتدفق ويبدأ من تدفق استجابة الموفر. تعود الموفرات التي لا تدعم التدفق إلى مسار الملف المؤقت المركّب.
- يراقب OpenClaw أيضاً حالات فشل فك تشفير الاستقبال ويتعافى تلقائياً عبر مغادرة/إعادة الانضمام إلى القناة الصوتية بعد إخفاقات متكررة ضمن نافذة قصيرة.
- إذا أظهرت سجلات الاستقبال بشكل متكرر `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` بعد التحديث، فاجمع تقرير اعتماديات وسجلات. يتضمن خط `@discordjs/voice` المرفق إصلاح الحشو upstream من PR #11449 في discord.js، الذي أغلق issue #11419 في discord.js.
- أحداث استقبال `The operation was aborted` متوقعة عندما ينهي OpenClaw مقطع متحدث ملتقطاً؛ وهي تشخيصات مطولة، لا تحذيرات.
- تتضمن سجلات صوت Discord المطولة معاينة محدودة من سطر واحد لنص STT المنسوخ لكل مقطع متحدث مقبول، بحيث يعرض التصحيح جانب المستخدم وجانب رد الوكيل دون تفريغ نصوص منسوخة غير محدودة.
- في وضع `agent-proxy`، يتخطى رجوع الاستشارة المفروضة أجزاء النص المنسوخ التي تبدو غير مكتملة مثل النص المنتهي بـ `...` أو واصل لاحق مثل `and`، إضافة إلى عبارات الإغلاق الواضحة غير القابلة للتنفيذ مثل “سأعود حالاً” أو “وداعاً”. تعرض السجلات `forced agent consult skipped reason=...` عندما يمنع ذلك إجابة قديمة في الطابور.

إعداد opus الأصلي لنسخ المصدر:

```bash
pnpm install
mise exec node@22 -- pnpm discord:opus:install
```

استخدم Node 22 للـ Gateway عندما تريد الإضافة الأصلية المبنية مسبقاً upstream لنظام macOS arm64. إذا استخدمت وقت تشغيل Node آخر، فقد يحتاج المثبت الاختياري إلى سلسلة أدوات بناء مصدر محلية لـ `node-gyp`.

بعد تثبيت الإضافة الأصلية، ابدأ Gateway باستخدام:

```bash
OPENCLAW_DISCORD_OPUS_DECODER=native pnpm gateway:watch
```

ينبغي أن تعرض سجلات الصوت المطولة `discord voice: opus decoder: @discordjs/opus`. من دون الاشتراك عبر متغير البيئة، أو إذا كانت الإضافة الأصلية مفقودة أو لا يمكن تحميلها على المضيف، يسجل OpenClaw `discord voice: opus decoder: opusscript` ويواصل استقبال الصوت عبر بديل JS الصرف.

مسار STT مع TTS:

- يتم تحويل التقاط PCM من Discord إلى ملف WAV مؤقت.
- يتولى `tools.media.audio` معالجة STT، على سبيل المثال `openai/gpt-4o-mini-transcribe`.
- يُرسل النص المنسوخ عبر مدخل Discord والتوجيه بينما يعمل LLM للاستجابة بسياسة إخراج صوتي تخفي أداة الوكيل `tts` وتطلب نصاً مُعاداً، لأن صوت Discord يمتلك تشغيل TTS النهائي.
- عند تعيين `voice.model`، فإنه يتجاوز فقط LLM الخاص بالاستجابة لهذا الدور في القناة الصوتية.
- يُدمج `voice.tts` فوق `messages.tts`؛ تغذي الموفرات القادرة على التدفق المشغل مباشرة، وإلا فيُشغل ملف الصوت الناتج في القناة المنضم إليها.

مثال جلسة قناة صوتية افتراضية للوكيل الوكيل:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

من دون كتلة `voice.agentSession`، تحصل كل قناة صوتية على جلسة OpenClaw موجّهة خاصة بها. على سبيل المثال، يتحدث `/vc join channel:234567890123456789` إلى الجلسة الخاصة بتلك القناة الصوتية في Discord. نموذج الوقت الحقيقي هو واجهة الصوت فقط؛ وتُسلّم الطلبات الجوهرية إلى وكيل OpenClaw المهيأ. إذا أنتج نموذج الوقت الحقيقي نصاً نهائياً منسوخاً من دون استدعاء أداة الاستشارة، يفرض OpenClaw الاستشارة كرجوع بحيث يظل السلوك الافتراضي مشابهاً للتحدث إلى الوكيل.

مثال STT مع TTS القديم:

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
          openai: {
            model: "gpt-4o-mini-tts",
            voice: "cedar",
          },
        },
      },
    },
  },
}
```

مثال bidi في الوقت الحقيقي:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

الصوت كامتداد لجلسة قناة Discord موجودة:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai-codex/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

في وضع `agent-proxy`، ينضم البوت إلى القناة الصوتية المهيأة، لكن أدوار وكيل OpenClaw تستخدم الجلسة والوكيل الموجّهين العاديين للقناة المستهدفة. تنطق جلسة الصوت في الوقت الحقيقي النتيجة المعادة داخل القناة الصوتية. لا يزال بإمكان وكيل الإشراف استخدام أدوات الرسائل العادية وفقاً لسياسة أدواته، بما في ذلك إرسال رسالة Discord منفصلة إذا كان ذلك هو الإجراء الصحيح.

صيغ الأهداف المفيدة:

- يوجّه `target: "channel:123456789012345678"` عبر جلسة قناة نصية في Discord.
- يُعامل `target: "123456789012345678"` كهدف قناة.
- يوجّه `target: "dm:123456789012345678"` أو `target: "user:123456789012345678"` عبر جلسة الرسائل المباشرة تلك.

مثال OpenAI Realtime للبيئات كثيرة الصدى:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
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

استخدم هذا عندما يسمع النموذج تشغيل Discord الخاص به عبر ميكروفون مفتوح، لكنك لا تزال تريد مقاطعته بالتحدث. يمنع OpenClaw OpenAI من المقاطعة التلقائية عند إدخال صوت خام، بينما يتيح `bargeIn: true` لأحداث بدء متحدث Discord وصوت المتحدث النشط بالفعل إلغاء استجابات الوقت الفعلي النشطة قبل أن تصل اللفة الملتقطة التالية إلى OpenAI. تُعامل إشارات المقاطعة المبكرة جدًا التي يكون فيها `audioEndMs` أقل من `minBargeInAudioEndMs` على أنها صدى/ضجيج محتمل ويتم تجاهلها حتى لا ينقطع النموذج عند أول إطار تشغيل.

سجلات الصوت المتوقعة:

- عند الانضمام: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- عند بدء الوقت الفعلي: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- عند صوت المتحدث: `discord voice: realtime speaker turn opened ...`، و`discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`، و`discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- عند تخطي كلام قديم: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` أو `reason=non-actionable-closing ...`
- عند اكتمال استجابة الوقت الفعلي: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- عند إيقاف/إعادة ضبط التشغيل: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- عند استشارة الوقت الفعلي: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- عند إجابة الوكيل: `discord voice: agent turn answer ...`
- عند الكلام المطابق المدرج في الطابور: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`، يتبعه `discord voice: realtime exact speech dequeued reason=player-idle ...`
- عند اكتشاف المقاطعة: `discord voice: realtime barge-in detected source=speaker-start ...` أو `discord voice: realtime barge-in detected source=active-speaker-audio ...`، يتبعه `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- عند مقاطعة الوقت الفعلي: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`، يتبعه إما `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` أو `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- عند تجاهل الصدى/الضجيج: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- عند تعطيل المقاطعة: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- عند التشغيل الخامل: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

لتصحيح الصوت المنقطع، اقرأ سجلات الصوت في الوقت الفعلي كخط زمني:

1. يعني `realtime audio playback started` أن Discord بدأ تشغيل صوت المساعد. يبدأ الجسر من هذه النقطة في عد أجزاء مخرجات المساعد، وبايتات Discord PCM، وبايتات موفر الوقت الفعلي، ومدة الصوت المركب.
2. يحدد `realtime speaker turn opened` أن متحدث Discord أصبح نشطًا. إذا كان التشغيل نشطًا بالفعل وكان `bargeIn` مفعّلًا، فقد يتبعه `barge-in detected source=speaker-start`.
3. يحدد `realtime input audio started` أول إطار صوت فعلي تم استلامه لتلك اللفة من المتحدث. يعني `outputActive=true` أو قيمة غير صفرية لـ `outputAudioMs` هنا أن الميكروفون يرسل إدخالًا بينما لا يزال تشغيل المساعد نشطًا.
4. يعني `barge-in detected source=active-speaker-audio` أن OpenClaw رأى صوت متحدث مباشرًا بينما كان تشغيل المساعد نشطًا. يفيد هذا في التمييز بين مقاطعة حقيقية وحدث بدء متحدث في Discord بلا صوت مفيد.
5. يعني `barge-in requested reason=...` أن OpenClaw طلب من موفر الوقت الفعلي إلغاء الاستجابة النشطة أو اقتطاعها. ويتضمن `outputAudioMs`، و`outputActive`، و`playbackChunks` حتى تتمكن من رؤية مقدار صوت المساعد الذي تم تشغيله فعليًا قبل المقاطعة.
6. `realtime audio playback stopped reason=...` هو نقطة إعادة ضبط تشغيل Discord المحلية. يوضح السبب من أوقف التشغيل: `barge-in`، أو `player-idle`، أو `provider-clear-audio`، أو `forced-agent-consult`، أو `stream-close`، أو `session-close`.
7. يلخص `realtime speaker turn closed` لفة الإدخال الملتقطة. يعني `chunks=0` أو `hasAudio=false` أن لفة المتحدث فُتحت لكن لم يصل أي صوت قابل للاستخدام إلى جسر الوقت الفعلي. ويعني `interruptedPlayback=true` أن لفة الإدخال تلك تداخلت مع مخرجات المساعد وشغّلت منطق المقاطعة.

حقول مفيدة:

- `outputAudioMs`: مدة صوت المساعد التي أنشأها موفر الوقت الفعلي قبل سطر السجل.
- `audioMs`: مدة صوت المساعد التي عدّها OpenClaw قبل توقف التشغيل.
- `elapsedMs`: وقت الساعة الفعلي بين فتح وإغلاق دفق التشغيل أو لفة المتحدث.
- `discordBytes`: بايتات PCM ستيريو بتردد 48 كيلوهرتز المرسلة إلى Discord voice أو المستلمة منه.
- `realtimeBytes`: بايتات PCM بتنسيق الموفر المرسلة إلى موفر الوقت الفعلي أو المستلمة منه.
- `playbackChunks`: أجزاء صوت المساعد الممررة إلى Discord للاستجابة النشطة.
- `sinceLastAudioMs`: الفجوة بين آخر إطار صوت متحدث ملتقط وإغلاق لفة المتحدث.

أنماط شائعة:

- غالبًا ما يشير الانقطاع الفوري مع `source=active-speaker-audio` و`outputAudioMs` صغير ووجود المستخدم نفسه بالقرب إلى دخول صدى السماعة إلى الميكروفون. ارفع `voice.realtime.minBargeInAudioEndMs`، أو اخفض مستوى صوت السماعة، أو استخدم سماعات رأس، أو عيّن `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- يعني `source=speaker-start` متبوعًا بـ `speaker turn closed ... hasAudio=false` أن Discord أبلغ عن بدء متحدث لكن لم يصل أي صوت إلى OpenClaw. قد يكون ذلك حدث Discord voice عابرًا، أو سلوك بوابة ضجيج، أو عميلًا يفعّل الميكروفون للحظة قصيرة.
- يعني `audio playback stopped reason=stream-close` دون مقاطعة قريبة أو `provider-clear-audio` أن دفق تشغيل Discord المحلي انتهى بشكل غير متوقع. تحقق من سجلات الموفر ومشغل Discord السابقة.
- يعني `capture ignored during playback (barge-in disabled)` أن OpenClaw أسقط الإدخال عمدًا بينما كان صوت المساعد نشطًا. فعّل `voice.realtime.bargeIn` إذا كنت تريد أن يقاطع الكلام التشغيل.
- يعني `barge-in ignored ... outputActive=false` أن Discord أو VAD الخاص بالموفر أبلغ عن كلام، لكن لم يكن لدى OpenClaw تشغيل نشط لمقاطعته. لا ينبغي أن يؤدي هذا إلى قطع الصوت.

تُحل بيانات الاعتماد لكل مكون: مصادقة مسار LLM لـ `voice.model`، ومصادقة STT لـ `tools.media.audio`، ومصادقة TTS لـ `messages.tts`/`voice.tts`، ومصادقة موفر الوقت الفعلي لـ `voice.realtime.providers` أو إعدادات المصادقة العادية الخاصة بالموفر.

### رسائل الصوت

تعرض رسائل الصوت في Discord معاينة موجية وتتطلب صوت OGG/Opus. ينشئ OpenClaw الموجة تلقائيًا، لكنه يحتاج إلى `ffmpeg` و`ffprobe` على مضيف Gateway للفحص والتحويل.

- وفّر **مسار ملف محليًا** (تُرفض عناوين URL).
- احذف محتوى النص (يرفض Discord النص + رسالة صوتية في الحمولة نفسها).
- يُقبل أي تنسيق صوت؛ يحوّله OpenClaw إلى OGG/Opus حسب الحاجة.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="استُخدمت نوايا غير مسموح بها أو لا يرى البوت رسائل النقابة">

    - فعّل Message Content Intent
    - فعّل Server Members Intent عندما تعتمد على حل المستخدم/العضو
    - أعد تشغيل Gateway بعد تغيير النوايا

  </Accordion>

  <Accordion title="حُظرت رسائل النقابة بشكل غير متوقع">

    - تحقق من `groupPolicy`
    - تحقق من قائمة السماح للنقابة ضمن `channels.discord.guilds`
    - إذا كانت خريطة `channels` للنقابة موجودة، فلا يُسمح إلا بالقنوات المدرجة
    - تحقق من سلوك `requireMention` وأنماط الإشارة

    فحوصات مفيدة:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false لكنه لا يزال محظورًا">
    الأسباب الشائعة:

    - `groupPolicy="allowlist"` دون قائمة سماح مطابقة للنقابة/القناة
    - تهيئة `requireMention` في الموضع الخطأ (يجب أن تكون ضمن `channels.discord.guilds` أو إدخال القناة)
    - المرسل محظور بواسطة قائمة سماح `users` الخاصة بالنقابة/القناة

  </Accordion>

  <Accordion title="لفات Discord طويلة التشغيل أو ردود مكررة">

    سجلات نموذجية:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    مفاتيح ضبط طابور Discord Gateway:

    - حساب واحد: `channels.discord.eventQueue.listenerTimeout`
    - حسابات متعددة: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - يتحكم هذا فقط في عمل مستمع Discord Gateway، وليس عمر لفة الوكيل

    لا يطبق Discord مهلة مملوكة للقناة على لفات الوكيل المدرجة في الطابور. يسلّم مستمعو الرسائل العمل فورًا، وتحافظ تشغيلات Discord المدرجة في الطابور على ترتيب كل جلسة حتى تكتمل دورة حياة الجلسة/الأداة/وقت التشغيل أو يُجهض العمل.

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
    يجلب OpenClaw بيانات Discord `/gateway/bot` الوصفية قبل الاتصال. تعود حالات الفشل العابرة إلى عنوان URL الافتراضي لـ Gateway في Discord وتخضع لتحديد معدل في السجلات.

    مفاتيح ضبط مهلة البيانات الوصفية:

    - حساب واحد: `channels.discord.gatewayInfoTimeoutMs`
    - حسابات متعددة: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - بديل البيئة عندما لا تكون التهيئة مضبوطة: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - الافتراضي: `30000` (30 ثانية)، الحد الأقصى: `120000`

  </Accordion>

  <Accordion title="إعادات تشغيل بسبب مهلة Gateway READY">
    ينتظر OpenClaw حدث `READY` من Discord gateway أثناء بدء التشغيل وبعد عمليات إعادة الاتصال في وقت التشغيل. قد تحتاج إعدادات الحسابات المتعددة مع تدرج بدء التشغيل إلى نافذة READY أطول عند بدء التشغيل من الافتراضية.

    مفاتيح ضبط مهلة READY:

    - بدء تشغيل حساب واحد: `channels.discord.gatewayReadyTimeoutMs`
    - بدء تشغيل حسابات متعددة: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - بديل بيئة بدء التشغيل عندما لا تكون التهيئة مضبوطة: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - افتراضي بدء التشغيل: `15000` (15 ثانية)، الحد الأقصى: `120000`
    - وقت تشغيل حساب واحد: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - وقت تشغيل حسابات متعددة: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - بديل بيئة وقت التشغيل عندما لا تكون التهيئة مضبوطة: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - افتراضي وقت التشغيل: `30000` (30 ثانية)، الحد الأقصى: `120000`

  </Accordion>

  <Accordion title="عدم تطابقات تدقيق الأذونات">
    تعمل فحوصات أذونات `channels status --probe` فقط مع معرفات القنوات الرقمية.

    إذا كنت تستخدم مفاتيح slug، فقد تستمر المطابقة في وقت التشغيل بالعمل، لكن لا يستطيع الفحص التحقق من الأذونات بالكامل.

  </Accordion>

  <Accordion title="مشكلات الرسائل الخاصة والاقتران">

    - الرسائل الخاصة معطلة: `channels.discord.dm.enabled=false`
    - سياسة الرسائل الخاصة معطلة: `channels.discord.dmPolicy="disabled"` (قديم: `channels.discord.dm.policy`)
    - انتظار موافقة الاقتران في وضع `pairing`

  </Accordion>

  <Accordion title="حلقات بوت إلى بوت">
    افتراضيًا، تُتجاهل الرسائل التي يكتبها بوت.

    إذا عيّنت `channels.discord.allowBots=true`، فاستخدم قواعد صارمة للإشارة وقائمة السماح لتجنب سلوك الحلقات.
    يفضّل استخدام `channels.discord.allowBots="mentions"` لقبول رسائل البوتات فقط عندما تشير إلى البوت.

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

  <Accordion title="Voice STT drops with DecryptionFailed(...)">

    - أبقِ OpenClaw محدثًا (`openclaw update`) حتى يكون منطق استرداد استقبال صوت Discord موجودًا
    - تأكد من `channels.discord.voice.daveEncryption=true` (الافتراضي)
    - ابدأ من `channels.discord.voice.decryptionFailureTolerance=24` (افتراضي المصدر الأعلى) واضبطه فقط عند الحاجة
    - راقب السجلات بحثًا عن:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - إذا استمرت الإخفاقات بعد إعادة الانضمام التلقائية، فاجمع السجلات وقارنها بسجل استقبال DAVE في المصدر الأعلى في [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) و[discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## مرجع التكوين

المرجع الأساسي: [مرجع التكوين - Discord](/ar/gateway/config-channels#discord).

<Accordion title="High-signal Discord fields">

- بدء التشغيل/المصادقة: `enabled`, `token`, `accounts.*`, `allowBots`
- السياسة: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- الأمر: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- طابور الأحداث: `eventQueue.listenerTimeout` (ميزانية المستمع), `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- الرد/السجل: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- التسليم: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- البث: `streaming` (اسم مستعار قديم: `streamMode`), `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- الوسائط/إعادة المحاولة: `mediaMaxMb` (يحد من تحميلات Discord الصادرة، الافتراضي `100MB`), `retry`
- الإجراءات: `actions.*`
- الحضور: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- الميزات: `threadBindings`, المستوى الأعلى `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## السلامة والعمليات

- تعامل مع رموز البوتات كأسرار (يفضل `DISCORD_BOT_TOKEN` في البيئات الخاضعة للإشراف).
- امنح أذونات Discord بأقل امتيازات ممكنة.
- إذا كانت حالة نشر الأوامر/الحالة قديمة، فأعد تشغيل Gateway ثم أعد الفحص باستخدام `openclaw channels status --probe`.

## ذات صلة

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/ar/channels/pairing">
    اربط مستخدم Discord بـ Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/ar/channels/groups">
    سلوك دردشة المجموعات وقائمة السماح.
  </Card>
  <Card title="Channel routing" icon="route" href="/ar/channels/channel-routing">
    وجّه الرسائل الواردة إلى الوكلاء.
  </Card>
  <Card title="Security" icon="shield" href="/ar/gateway/security">
    نموذج التهديد والتقوية.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/ar/concepts/multi-agent">
    اربط الخوادم والقنوات بالوكلاء.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي.
  </Card>
</CardGroup>

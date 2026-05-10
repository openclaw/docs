---
read_when:
    - العمل على ميزات قناة Discord
summary: حالة دعم روبوت Discord وإمكاناته وتكوينه
title: Discord
x-i18n:
    generated_at: "2026-05-10T19:21:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 121b0b46bfb0d438f6ebfba4c93410c2ecfe8f99aa257e362b8767bf0aac27ce
    source_path: channels/discord.md
    workflow: 16
---

جاهز للرسائل المباشرة وقنوات الخوادم عبر Gateway الرسمي لـ Discord.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    تكون رسائل Discord المباشرة في وضع الاقتران افتراضياً.
  </Card>
  <Card title="أوامر Slash" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وفهرس الأوامر.
  </Card>
  <Card title="استكشاف مشكلات القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات متعددة القنوات ومسار الإصلاح.
  </Card>
</CardGroup>

## الإعداد السريع

ستحتاج إلى إنشاء تطبيق جديد مع بوت، وإضافة البوت إلى خادمك، وإقرانه بـ OpenClaw. نوصي بإضافة البوت إلى خادمك الخاص. إذا لم يكن لديك واحد بعد، [أنشئ واحداً أولاً](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (اختر **Create My Own > For me and my friends**).

<Steps>
  <Step title="إنشاء تطبيق وبوت Discord">
    انتقل إلى [Discord Developer Portal](https://discord.com/developers/applications) وانقر على **New Application**. سمّه باسم مثل "OpenClaw".

    انقر على **Bot** في الشريط الجانبي. اضبط **Username** على أي اسم تطلقه على وكيل OpenClaw لديك.

  </Step>

  <Step title="تفعيل المقاصد ذات الامتيازات">
    وأنت لا تزال في صفحة **Bot**، مرّر لأسفل إلى **Privileged Gateway Intents** وفعّل:

    - **Message Content Intent** (مطلوب)
    - **Server Members Intent** (موصى به؛ مطلوب لقوائم السماح بالأدوار ومطابقة الاسم بالمعرّف)
    - **Presence Intent** (اختياري؛ مطلوب فقط لتحديثات الحضور)

  </Step>

  <Step title="نسخ رمز البوت الخاص بك">
    مرّر مجدداً إلى أعلى صفحة **Bot** وانقر على **Reset Token**.

    <Note>
    رغم الاسم، فهذا ينشئ رمزك الأول — لا يتم "إعادة تعيين" أي شيء.
    </Note>

    انسخ الرمز واحفظه في مكان ما. هذا هو **Bot Token** الخاص بك وستحتاج إليه قريباً.

  </Step>

  <Step title="إنشاء عنوان URL للدعوة وإضافة البوت إلى خادمك">
    انقر على **OAuth2** في الشريط الجانبي. ستنشئ عنوان URL للدعوة بالأذونات المناسبة لإضافة البوت إلى خادمك.

    مرّر لأسفل إلى **OAuth2 URL Generator** وفعّل:

    - `bot`
    - `applications.commands`

    سيظهر قسم **Bot Permissions** في الأسفل. فعّل على الأقل:

    **الأذونات العامة**
      - عرض القنوات
    **أذونات النص**
      - إرسال الرسائل
      - قراءة سجل الرسائل
      - تضمين الروابط
      - إرفاق الملفات
      - إضافة التفاعلات (اختياري)

    هذه هي المجموعة الأساسية للقنوات النصية العادية. إذا كنت تخطط للنشر في سلاسل Discord، بما في ذلك مسارات عمل قنوات المنتديات أو الوسائط التي تنشئ سلسلة أو تتابعها، ففعّل أيضاً **Send Messages in Threads**.
    انسخ عنوان URL الذي تم إنشاؤه في الأسفل، والصقه في متصفحك، وحدد خادمك، ثم انقر على **Continue** للاتصال. يجب أن ترى الآن البوت في خادم Discord.

  </Step>

  <Step title="تفعيل وضع المطور وجمع معرّفاتك">
    بالعودة إلى تطبيق Discord، تحتاج إلى تفعيل وضع المطور حتى تتمكن من نسخ المعرّفات الداخلية.

    1. انقر على **User Settings** (رمز الترس بجانب صورتك الرمزية) → **Advanced** → فعّل **Developer Mode**
    2. انقر بزر الماوس الأيمن على **أيقونة الخادم** في الشريط الجانبي → **Copy Server ID**
    3. انقر بزر الماوس الأيمن على **صورتك الرمزية** → **Copy User ID**

    احفظ **Server ID** و**User ID** إلى جانب Bot Token الخاص بك — سترسل الثلاثة كلها إلى OpenClaw في الخطوة التالية.

  </Step>

  <Step title="السماح بالرسائل المباشرة من أعضاء الخادم">
    لكي يعمل الاقتران، يحتاج Discord إلى السماح للبوت بإرسال رسالة مباشرة إليك. انقر بزر الماوس الأيمن على **أيقونة الخادم** → **Privacy Settings** → فعّل **Direct Messages**.

    يتيح هذا لأعضاء الخادم (بما في ذلك البوتات) إرسال رسائل مباشرة إليك. أبقِ هذا مفعلاً إذا كنت تريد استخدام رسائل Discord المباشرة مع OpenClaw. إذا كنت تخطط لاستخدام قنوات الخادم فقط، يمكنك تعطيل الرسائل المباشرة بعد الاقتران.

  </Step>

  <Step title="تعيين رمز البوت بأمان (لا ترسله في الدردشة)">
    رمز بوت Discord الخاص بك سرّي (مثل كلمة المرور). عيّنه على الجهاز الذي يشغّل OpenClaw قبل مراسلة وكيلك.

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
    بالنسبة إلى تثبيتات الخدمات المُدارة، شغّل `openclaw gateway install` من صدفة يكون فيها `DISCORD_BOT_TOKEN` موجوداً، أو خزّن المتغير في `~/.openclaw/.env`، حتى تتمكن الخدمة من حل SecretRef الخاص بالبيئة بعد إعادة التشغيل.
    إذا كان مضيفك محظوراً أو محدود المعدل بسبب بحث تطبيق بدء تشغيل Discord، فعيّن معرّف تطبيق/عميل Discord من Developer Portal حتى يتمكن بدء التشغيل من تخطي استدعاء REST هذا. استخدم `channels.discord.applicationId` للحساب الافتراضي، أو `channels.discord.accounts.<accountId>.applicationId` عندما تشغّل عدة بوتات Discord.

  </Step>

  <Step title="تكوين OpenClaw والاقتران">

    <Tabs>
      <Tab title="اسأل وكيلك">
        تحدث مع وكيل OpenClaw لديك على أي قناة موجودة (مثل Telegram) وأخبره. إذا كان Discord هو قناتك الأولى، فاستخدم تبويب CLI / config بدلاً من ذلك.

        > "لقد عيّنت بالفعل رمز بوت Discord في التكوين. يرجى إكمال إعداد Discord باستخدام User ID `<user_id>` وServer ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        إذا كنت تفضل التكوين المستند إلى الملفات، فعيّن:

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

        للإعداد البرمجي أو البعيد، اكتب كتلة JSON5 نفسها باستخدام `openclaw config patch --file ./discord.patch.json5 --dry-run` ثم أعد التشغيل بدون `--dry-run`. قيم `token` بالنص الصريح مدعومة. قيم SecretRef مدعومة أيضاً لـ `channels.discord.token` عبر موفري البيئة/الملف/التنفيذ. راجع [إدارة الأسرار](/ar/gateway/secrets).

        بالنسبة إلى عدة بوتات Discord، احتفظ بكل رمز بوت ومعرّف تطبيق تحت حسابه. يتم توريث `channels.discord.applicationId` في المستوى الأعلى بواسطة الحسابات، لذلك لا تعيّنه هناك إلا عندما يجب أن يستخدم كل حساب معرّف التطبيق نفسه.

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

  <Step title="اعتماد اقتران أول رسالة مباشرة">
    انتظر حتى يعمل Gateway، ثم أرسل رسالة مباشرة إلى بوتك في Discord. سيرد برمز اقتران.

    <Tabs>
      <Tab title="اسأل وكيلك">
        أرسل رمز الاقتران إلى وكيلك على قناتك الموجودة:

        > "اعتمد رمز اقتران Discord هذا: `<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    تنتهي صلاحية رموز الاقتران بعد ساعة واحدة.

    يجب أن تكون الآن قادراً على الدردشة مع وكيلك في Discord عبر الرسائل المباشرة.

  </Step>
</Steps>

<Note>
حل الرموز يراعي الحسابات. تفوز قيم رموز التكوين على احتياطي البيئة. لا يُستخدم `DISCORD_BOT_TOKEN` إلا للحساب الافتراضي.
إذا تم حل حسابين مفعّلين في Discord إلى رمز البوت نفسه، يبدأ OpenClaw مراقب Gateway واحداً فقط لذلك الرمز. يفوز الرمز القادم من التكوين على احتياطي البيئة الافتراضي؛ وإلا يفوز أول حساب مفعّل ويتم الإبلاغ عن الحساب المكرر كمعطّل.
بالنسبة إلى الاستدعاءات الصادرة المتقدمة (أداة الرسائل/إجراءات القنوات)، يُستخدم `token` صريح لكل استدعاء لذلك الاستدعاء. ينطبق هذا على إجراءات الإرسال والقراءة/التحقق (مثل read/search/fetch/thread/pins/permissions). لا تزال إعدادات سياسة الحساب/إعادة المحاولة تأتي من الحساب المحدد في لقطة وقت التشغيل النشطة.
</Note>

## موصى به: إعداد مساحة عمل للخادم

بمجرد أن تعمل الرسائل المباشرة، يمكنك إعداد خادم Discord كمساحة عمل كاملة حيث تحصل كل قناة على جلسة وكيل خاصة بها مع سياقها الخاص. يوصى بهذا للخوادم الخاصة حيث تكون أنت وبوتك فقط.

<Steps>
  <Step title="إضافة خادمك إلى قائمة السماح للخوادم">
    يتيح هذا لوكيلك الرد في أي قناة على خادمك، وليس فقط الرسائل المباشرة.

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

  <Step title="السماح بالردود بدون @mention">
    افتراضياً، لا يرد وكيلك في قنوات الخادم إلا عند @mentioned. بالنسبة إلى خادم خاص، ربما تريد منه الرد على كل رسالة.

    في قنوات الخادم، تبقى الردود النهائية العادية للمساعد خاصة افتراضياً. يجب إرسال مخرجات Discord المرئية صراحة باستخدام أداة `message`، حتى يتمكن الوكيل من المراقبة افتراضياً ولا ينشر إلا عندما يقرر أن الرد في القناة مفيد.

    يعني هذا أن النموذج المحدد يجب أن يستدعي الأدوات بشكل موثوق. إذا أظهر Discord الكتابة وأظهرت السجلات استخدام الرموز لكن لم تُنشر أي رسالة، فتحقق من سجل الجلسة بحثاً عن نص المساعد مع `didSendViaMessagingTool: false`. يعني ذلك أن النموذج أنتج إجابة نهائية خاصة بدلاً من استدعاء `message(action=send)`. بدّل إلى نموذج أقوى في استدعاء الأدوات، أو استخدم التكوين أدناه لاستعادة الردود النهائية التلقائية القديمة.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "اسمح لوكيلي بالرد على هذا الخادم دون الحاجة إلى أن تتم الإشارة إليه بـ @mention"
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

أنشئ الآن بعض القنوات على خادم Discord وابدأ الدردشة. يمكن لوكيلك رؤية اسم القناة، وتحصل كل قناة على جلستها المعزولة الخاصة — بحيث يمكنك إعداد `#coding` أو `#home` أو `#research` أو أي شيء يناسب سير عملك.

## نموذج وقت التشغيل

- Gateway يملك اتصال Discord.
- توجيه الردود حتمي: تعود ردود Discord الواردة إلى Discord.
- تُضاف بيانات تعريف خادم/قناة Discord إلى موجه النموذج كسياق غير موثوق،
  وليس كبادئة رد مرئية للمستخدم. إذا نسخ نموذج ذلك الغلاف
  مرة أخرى، يزيل OpenClaw بيانات التعريف المنسوخة من الردود الصادرة ومن
  سياق إعادة التشغيل المستقبلي.
- افتراضيًا (`session.dmScope=main`)، تشترك المحادثات المباشرة في جلسة الوكيل الرئيسية (`agent:main:main`).
- تُعزل قنوات الخادم في مفاتيح جلسات (`agent:<agentId>:discord:channel:<channelId>`).
- تُتجاهل رسائل DM الجماعية افتراضيًا (`channels.discord.dm.groupEnabled=false`).
- تعمل أوامر الشرطة المائلة الأصلية في جلسات أوامر معزولة (`agent:<agentId>:discord:slash:<userId>`)، مع الاستمرار في حمل `CommandTargetSessionKey` إلى جلسة المحادثة الموجّهة.
- يستخدم تسليم إعلانات cron/heartbeat النصية فقط إلى Discord الإجابة النهائية
  المرئية للمساعد مرة واحدة. وتبقى حمولات الوسائط والمكوّنات المنظمة
  متعددة الرسائل عندما يصدر الوكيل عدة حمولات قابلة للتسليم.

## قنوات المنتدى

لا تقبل قنوات المنتدى والوسائط في Discord إلا منشورات سلاسل المحادثات. يدعم OpenClaw طريقتين لإنشائها:

- أرسل رسالة إلى أصل المنتدى (`channel:<forumId>`) لإنشاء سلسلة محادثات تلقائيًا. يستخدم عنوان سلسلة المحادثات أول سطر غير فارغ من رسالتك.
- استخدم `openclaw message thread create` لإنشاء سلسلة محادثات مباشرة. لا تمرر `--message-id` لقنوات المنتدى.

مثال: الإرسال إلى أصل المنتدى لإنشاء سلسلة محادثات

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

مثال: إنشاء سلسلة منتدى صراحةً

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

لا تقبل أصول المنتديات مكوّنات Discord. إذا كنت تحتاج إلى مكوّنات، فأرسل إلى سلسلة المحادثات نفسها (`channel:<threadId>`).

## المكوّنات التفاعلية

يدعم OpenClaw حاويات مكوّنات Discord v2 لرسائل الوكيل. استخدم أداة الرسائل مع حمولة `components`. تُوجّه نتائج التفاعل مرة أخرى إلى الوكيل كرسائل واردة عادية وتتبع إعدادات Discord `replyToMode` الحالية.

الكتل المدعومة:

- `text`, `section`, `separator`, `actions`, `media-gallery`, `file`
- تسمح صفوف الإجراءات بما يصل إلى 5 أزرار أو قائمة تحديد واحدة
- أنواع التحديد: `string`, `user`, `role`, `mentionable`, `channel`

افتراضيًا، تكون المكوّنات للاستخدام مرة واحدة. اضبط `components.reusable=true` للسماح باستخدام الأزرار وقوائم التحديد والنماذج عدة مرات إلى أن تنتهي صلاحيتها.

لتقييد من يمكنه النقر على زر، اضبط `allowedUsers` على ذلك الزر (معرّفات مستخدمي Discord أو الوسوم أو `*`). عند التهيئة، يتلقى المستخدمون غير المطابقين رفضًا مؤقتًا.

يفتح أمرا الشرطة المائلة `/model` و`/models` منتقي نماذج تفاعليًا يتضمن قوائم منسدلة للموفر والنموذج ووقت التشغيل المتوافق، بالإضافة إلى خطوة إرسال. أصبح `/models add` مهملاً ويعيد الآن رسالة إهمال بدلًا من تسجيل النماذج من المحادثة. يكون رد المنتقي مؤقتًا ولا يستطيع استخدامه إلا المستخدم الذي استدعاه. تقتصر قوائم التحديد في Discord على 25 خيارًا، لذا أضف إدخالات `provider/*` إلى `agents.defaults.models` عندما تريد أن يعرض المنتقي النماذج المكتشفة ديناميكيًا فقط للموفرين المحددين مثل `openai-codex` أو `vllm`.

مرفقات الملفات:

- يجب أن تشير كتل `file` إلى مرجع مرفق (`attachment://<filename>`)
- وفّر المرفق عبر `media`/`path`/`filePath` (ملف واحد)؛ استخدم `media-gallery` لعدة ملفات
- استخدم `filename` لتجاوز اسم الرفع عندما ينبغي أن يطابق مرجع المرفق

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
    يتحكم `channels.discord.dmPolicy` في وصول DM. تُعد `channels.discord.allowFrom` قائمة السماح الأساسية لـ DM.

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن تتضمن `channels.discord.allowFrom` القيمة `"*"`)
    - `disabled`

    إذا لم تكن سياسة DM مفتوحة، فسيُحظر المستخدمون غير المعروفين (أو يُطلب منهم الاقتران في وضع `pairing`).

    أسبقية الحسابات المتعددة:

    - ينطبق `channels.discord.accounts.default.allowFrom` على حساب `default` فقط.
    - لحساب واحد، تكون لـ `allowFrom` الأسبقية على `dm.allowFrom` القديم.
    - ترث الحسابات المسماة `channels.discord.allowFrom` عندما تكون `allowFrom` الخاصة بها و`dm.allowFrom` القديم غير معيّنين.
    - لا ترث الحسابات المسماة `channels.discord.accounts.default.allowFrom`.

    لا تزال `channels.discord.dm.policy` و`channels.discord.dm.allowFrom` القديمتان تُقرأان للتوافق. يرحلهما `openclaw doctor --fix` إلى `dmPolicy` و`allowFrom` عندما يستطيع فعل ذلك دون تغيير الوصول.

    تنسيق هدف DM للتسليم:

    - `user:<id>`
    - إشارة `<@id>`

    تُحلّ المعرّفات الرقمية المجردة عادةً كمعرّفات قنوات عندما يكون افتراضي قناة نشطًا، لكن المعرّفات المدرجة في `allowFrom` الفعّالة لـ DM في الحساب تُعامل كأهداف DM للمستخدمين من أجل التوافق.

  </Tab>

  <Tab title="Access groups">
    يمكن أن تستخدم رسائل Discord المباشرة وتفويض أوامر النص إدخالات `accessGroup:<name>` ديناميكية في `channels.discord.allowFrom`.

    تتم مشاركة أسماء مجموعات الوصول عبر قنوات الرسائل. استخدم `type: "message.senders"` لمجموعة ثابتة يُعبّر عن أعضائها بصيغة `allowFrom` العادية لكل قناة، أو `type: "discord.channelAudience"` عندما ينبغي أن يحدد جمهور `ViewChannel` الحالي لقناة Discord العضوية ديناميكيًا. سلوك مجموعة الوصول المشتركة موثق هنا: [مجموعات الوصول](/ar/channels/access-groups).

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

    لا تحتوي قناة نصية في Discord على قائمة أعضاء منفصلة. يصوغ `type: "discord.channelAudience"` العضوية على النحو التالي: مرسل DM عضو في الخادم المهيأ ولديه حاليًا إذن `ViewChannel` فعّال على القناة المهيأة بعد تطبيق أدوار وتجاوزات القناة.

    مثال: السماح لأي شخص يمكنه رؤية `#maintainers` بإرسال DM إلى الروبوت، مع إبقاء رسائل DM مغلقة أمام أي شخص آخر.

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

    تفشل عمليات البحث على وضع الإغلاق. إذا أعاد Discord القيمة `Missing Access`، أو فشل بحث العضو، أو كانت القناة تنتمي إلى خادم مختلف، فيُعامل مرسل DM على أنه غير مصرّح له.

    فعّل **Server Members Intent** في Discord Developer Portal للروبوت عند استخدام مجموعات الوصول المستندة إلى جمهور القناة. لا تتضمن رسائل DM حالة عضو الخادم، لذلك يحل OpenClaw العضو عبر Discord REST وقت التفويض.

  </Tab>

  <Tab title="Guild policy">
    يتحكم `channels.discord.groupPolicy` في التعامل مع الخوادم:

    - `open`
    - `allowlist`
    - `disabled`

    خط الأساس الآمن عند وجود `channels.discord` هو `allowlist`.

    سلوك `allowlist`:

    - يجب أن يطابق الخادم `channels.discord.guilds` (يفضّل `id`، ويُقبل slug)
    - قوائم سماح اختيارية للمرسلين: `users` (يوصى بالمعرّفات المستقرة) و`roles` (معرّفات الأدوار فقط)؛ إذا كان أي منهما مهيأ، فيُسمح للمرسلين عندما يطابقون `users` أو `roles`
    - مطابقة الاسم/الوسم المباشرة معطلة افتراضيًا؛ فعّل `channels.discord.dangerouslyAllowNameMatching: true` فقط كوضع توافق لكسر الزجاج
    - الأسماء/الوسوم مدعومة لـ `users`، لكن المعرّفات أكثر أمانًا؛ يحذر `openclaw security audit` عند استخدام إدخالات اسم/وسم
    - إذا كان لدى خادم `channels` مهيأة، تُرفض القنوات غير المدرجة
    - إذا لم يكن لدى خادم كتلة `channels`، فيُسمح بكل القنوات في ذلك الخادم الموجود في قائمة السماح

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

    إذا ضبطت `DISCORD_BOT_TOKEN` فقط ولم تنشئ كتلة `channels.discord`، فسيكون احتياطي وقت التشغيل `groupPolicy="allowlist"` (مع تحذير في السجلات)، حتى إذا كانت `channels.defaults.groupPolicy` هي `open`.

  </Tab>

  <Tab title="Mentions and group DMs">
    تُقيّد رسائل الخادم بالإشارة افتراضيًا.

    يتضمن اكتشاف الإشارات:

    - إشارة صريحة إلى الروبوت
    - أنماط الإشارة المهيأة (`agents.list[].groupChat.mentionPatterns`، والاحتياطي `messages.groupChat.mentionPatterns`)
    - سلوك الرد الضمني على الروبوت في الحالات المدعومة

    عند كتابة رسائل Discord صادرة، استخدم صيغة الإشارة الأساسية: `<@USER_ID>` للمستخدمين، و`<#CHANNEL_ID>` للقنوات، و`<@&ROLE_ID>` للأدوار. لا تستخدم صيغة إشارة اللقب القديمة `<@!USER_ID>`.

    يُهيأ `requireMention` لكل خادم/قناة (`channels.discord.guilds...`).
    يُسقط `ignoreOtherMentions` اختياريًا الرسائل التي تشير إلى مستخدم/دور آخر ولكن لا تشير إلى الروبوت (باستثناء @everyone/@here).

    رسائل DM الجماعية:

    - الافتراضي: تُتجاهل (`dm.groupEnabled=false`)
    - قائمة سماح اختيارية عبر `dm.groupChannels` (معرّفات قنوات أو slugs)

  </Tab>
</Tabs>

### توجيه الوكيل المستند إلى الأدوار

استخدم `bindings[].match.roles` لتوجيه أعضاء خادم Discord إلى وكلاء مختلفين حسب معرّف الدور. لا تقبل الارتباطات المستندة إلى الأدوار إلا معرّفات الأدوار، وتُقيّم بعد ارتباطات النظير أو النظير الأصل وقبل ارتباطات الخادم فقط. إذا ضبط ارتباط أيضًا حقول مطابقة أخرى (على سبيل المثال `peer` + `guildId` + `roles`)، فيجب أن تتطابق كل الحقول المهيأة.

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

- القيمة الافتراضية لـ `commands.native` هي `"auto"` وهي مفعلة لـ Discord.
- التجاوز لكل قناة: `channels.discord.commands.native`.
- يؤدي `commands.native=false` إلى تخطي تسجيل أوامر الشرطة المائلة في Discord وتنظيفها أثناء بدء التشغيل. قد تبقى الأوامر المسجلة سابقا مرئية في Discord إلى أن تزيلها من تطبيق Discord.
- يستخدم تخويل الأوامر الأصلية قوائم السماح/السياسات نفسها في Discord مثل معالجة الرسائل العادية.
- قد تظل الأوامر مرئية في واجهة Discord للمستخدمين غير المخولين؛ يظل التنفيذ يفرض تخويل OpenClaw ويعيد "غير مخول".

راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands) للاطلاع على كتالوج الأوامر وسلوكها.

إعدادات أوامر الشرطة المائلة الافتراضية:

- `ephemeral: true`

## تفاصيل الميزة

<AccordionGroup>
  <Accordion title="وسوم الردود والردود الأصلية">
    يدعم Discord وسوم الردود في مخرجات الوكيل:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    يتم التحكم بها عبر `channels.discord.replyToMode`:

    - `off` (افتراضي)
    - `first`
    - `all`
    - `batched`

    ملاحظة: يعطل `off` إنشاء سلاسل الردود الضمني. تظل وسوم `[[reply_to_*]]` الصريحة محترمة.
    يرفق `first` دائما مرجع الرد الأصلي الضمني بأول رسالة Discord صادرة للدورة.
    يرفق `batched` مرجع الرد الأصلي الضمني في Discord فقط عندما تكون
    الدورة الواردة دفعة مؤجلة من رسائل متعددة. هذا مفيد
    عندما تريد الردود الأصلية بشكل أساسي للمحادثات المتدفقة الملتبسة، لا لكل
    دورة ذات رسالة واحدة.

    تظهر معرفات الرسائل في السياق/السجل حتى يتمكن الوكلاء من استهداف رسائل محددة.

  </Accordion>

  <Accordion title="معاينة البث المباشر">
    يستطيع OpenClaw بث مسودات الردود عبر إرسال رسالة مؤقتة وتحريرها مع وصول النص. يقبل `channels.discord.streaming` القيم `off` | `partial` | `block` | `progress` (افتراضي). يحافظ `progress` على مسودة حالة واحدة قابلة للتحرير ويحدثها بتقدم الأدوات حتى التسليم النهائي؛ تسمية البداية المشتركة سطر متحرك، لذلك تختفي بالتمرير مثل الباقي عندما يظهر عمل كاف. `streamMode` اسم مستعار قديم وقت التشغيل. شغل `openclaw doctor --fix` لإعادة كتابة الإعدادات المحفوظة إلى المفتاح القياسي.

    اضبط `channels.discord.streaming.mode` على `off` لتعطيل تعديلات معاينة Discord. إذا تم تفعيل بث كتل Discord صراحة، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

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

    - يحرر `partial` رسالة معاينة واحدة مع وصول الرموز.
    - يصدر `block` أجزاء بحجم المسودة (استخدم `draftChunk` لضبط الحجم ونقاط الفصل، مع التقييد إلى `textChunkLimit`).
    - تلغي الردود النهائية للوسائط والأخطاء والردود الصريحة تعديلات المعاينة المعلقة.
    - يتحكم `streaming.preview.toolProgress` (افتراضي `true`) فيما إذا كانت تحديثات الأداة/التقدم تعيد استخدام رسالة المعاينة.
    - تظهر صفوف الأداة/التقدم كرمز تعبيري مضغوط + عنوان + تفاصيل عند توفرها، مثل `🛠️ Bash: run tests` أو `🔎 Web Search: for "query"`.
    - يتحكم `streaming.preview.commandText` / `streaming.progress.commandText` في تفاصيل الأمر/التنفيذ ضمن أسطر التقدم المضغوطة: `raw` (افتراضي) أو `status` (تسمية الأداة فقط).

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

    بث المعاينة نصي فقط؛ تعود ردود الوسائط إلى التسليم العادي. عند تفعيل بث `block` صراحة، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

  </Accordion>

  <Accordion title="السجل والسياق وسلوك السلاسل">
    سياق سجل الخادم:

    - القيمة الافتراضية لـ `channels.discord.historyLimit` هي `20`
    - البديل الاحتياطي: `messages.groupChat.historyLimit`
    - يعطل `0` ذلك

    عناصر التحكم في سجل الرسائل المباشرة:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    سلوك السلاسل:

    - يتم توجيه سلاسل Discord كجلسات قناة وترث إعدادات القناة الأصلية ما لم يتم تجاوزها.
    - ترث جلسات السلاسل اختيار `/model` على مستوى جلسة القناة الأصلية كبديل خاص بالنموذج فقط؛ تظل اختيارات `/model` المحلية للسلسلة ذات أولوية، ولا يتم نسخ سجل النص الأصلي إلا إذا تم تفعيل وراثة النص.
    - يختار `channels.discord.thread.inheritParent` (افتراضي `false`) للسلاسل التلقائية الجديدة البذر من النص الأصلي. توجد التجاوزات لكل حساب تحت `channels.discord.accounts.<id>.thread.inheritParent`.
    - يمكن لتفاعلات أداة الرسائل حل أهداف الرسائل المباشرة `user:<id>`.
    - يتم الحفاظ على `guilds.<guild>.channels.<channel>.requireMention: false` أثناء بديل تفعيل مرحلة الرد.

    يتم إدخال مواضيع القناة كسياق **غير موثوق**. تتحكم قوائم السماح في من يستطيع تشغيل الوكيل، وليست حد تنقيح كامل للسياق التكميلي.

  </Accordion>

  <Accordion title="جلسات مرتبطة بالسلاسل للوكلاء الفرعيين">
    يستطيع Discord ربط سلسلة بهدف جلسة حتى تستمر رسائل المتابعة في تلك السلسلة بالتوجيه إلى الجلسة نفسها (بما في ذلك جلسات الوكلاء الفرعيين).

    الأوامر:

    - `/focus <target>` ربط السلسلة الحالية/الجديدة بهدف وكيل فرعي/جلسة
    - `/unfocus` إزالة ربط السلسلة الحالية
    - `/agents` عرض التشغيلات النشطة وحالة الربط
    - `/session idle <duration|off>` فحص/تحديث إلغاء التركيز التلقائي عند عدم النشاط للروابط المركزة
    - `/session max-age <duration|off>` فحص/تحديث الحد الأقصى الصلب للعمر للروابط المركزة

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

    - يضبط `session.threadBindings.*` الافتراضات العامة.
    - يتجاوز `channels.discord.threadBindings.*` سلوك Discord.
    - يتحكم `spawnSessions` في الإنشاء/الربط التلقائي للسلاسل لـ `sessions_spawn({ thread: true })` وعمليات إنشاء سلاسل ACP. الافتراضي: `true`.
    - يتحكم `defaultSpawnContext` في سياق الوكيل الفرعي الأصلي لعمليات الإنشاء المرتبطة بسلاسل. الافتراضي: `"fork"`.
    - يتم ترحيل المفاتيح المهملة `spawnSubagentSessions`/`spawnAcpSessions` بواسطة `openclaw doctor --fix`.
    - إذا تم تعطيل روابط السلاسل لحساب، فلن تكون `/focus` وعمليات ربط السلاسل ذات الصلة متاحة.

    راجع [الوكلاء الفرعيون](/ar/tools/subagents)، و[وكلاء ACP](/ar/tools/acp-agents)، و[مرجع الإعدادات](/ar/gateway/configuration-reference).

  </Accordion>

  <Accordion title="روابط قناة ACP الدائمة">
    لمساحات عمل ACP مستقرة "دائمة التشغيل"، اضبط روابط ACP المكتوبة ذات المستوى الأعلى التي تستهدف محادثات Discord.

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

    - يربط `/acp spawn codex --bind here` القناة أو السلسلة الحالية في مكانها ويحافظ على الرسائل المستقبلية في جلسة ACP نفسها. ترث رسائل السلاسل ربط القناة الأصلية.
    - في قناة أو سلسلة مرتبطة، يعيد `/new` و`/reset` ضبط جلسة ACP نفسها في مكانها. يمكن لروابط السلاسل المؤقتة تجاوز حل الهدف أثناء نشاطها.
    - يتحكم `spawnSessions` في إنشاء/ربط سلاسل فرعية عبر `--thread auto|here`.

    راجع [وكلاء ACP](/ar/tools/acp-agents) للحصول على تفاصيل سلوك الربط.

  </Accordion>

  <Accordion title="إشعارات التفاعل">
    وضع إشعار التفاعل لكل خادم:

    - `off`
    - `own` (افتراضي)
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
    - بديل رمز تعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يقبل Discord الرموز التعبيرية الموحدة أو أسماء الرموز التعبيرية المخصصة.
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="كتابات الإعدادات">
    كتابات الإعدادات التي تبدأها القناة مفعلة افتراضيا.

    يؤثر هذا على تدفقات `/config set|unset` (عند تفعيل ميزات الأوامر).

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

  <Accordion title="وكيل Gateway">
    وجه حركة WebSocket الخاصة بـ Gateway في Discord وعمليات بحث REST عند بدء التشغيل (معرف التطبيق + حل قائمة السماح) عبر وكيل HTTP(S) باستخدام `channels.discord.proxy`.

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
    فعل حل PluralKit لربط الرسائل الممثلة عبر وكيل بهوية عضو النظام:

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
    - تتم مطابقة أسماء عرض الأعضاء بالاسم/المعرف النصي فقط عندما يكون `channels.discord.dangerouslyAllowNameMatching: true`
    - تستخدم عمليات البحث معرف الرسالة الأصلي وتكون مقيدة بنافذة زمنية
    - إذا فشل البحث، تعامل الرسائل الممثلة عبر وكيل كرسائل بوت ويتم إسقاطها ما لم يكن `allowBots=true`

  </Accordion>

  <Accordion title="أسماء مستعارة للإشارات الصادرة">
    استخدم `mentionAliases` عندما يحتاج الوكلاء إلى إشارات صادرة حتمية لمستخدمي Discord المعروفين. المفاتيح هي مقابض بدون `@` البادئة؛ والقيم هي معرفات مستخدمي Discord. تترك المقابض غير المعروفة، و`@everyone`، و`@here`، والإشارات داخل امتدادات كود Markdown دون تغيير.

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

    خريطة نوع النشاط:

    - 0: قيد اللعب
    - 1: البث (يتطلب `activityUrl`)
    - 2: الاستماع
    - 3: المشاهدة
    - 4: مخصص (يستخدم نص النشاط كحالة الحالة؛ الرمز التعبيري اختياري)
    - 5: المنافسة

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

    يربط الحضور التلقائي توفر وقت التشغيل بحالة Discord: سليم => متصل، متدهور أو غير معروف => خامل، مستنفد أو غير متاح => عدم الإزعاج. تجاوزات النص الاختيارية:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (يدعم العنصر النائب `{reason}`)

  </Accordion>

  <Accordion title="الموافقات في Discord">
    يدعم Discord معالجة الموافقات القائمة على الأزرار في الرسائل الخاصة، ويمكنه اختياريًا نشر مطالبات الموافقة في القناة الأصلية.

    مسار الإعداد:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختياري؛ يعود إلى `commands.ownerAllowFrom` عند الإمكان)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
    - `agentFilter`، `sessionFilter`، `cleanupAfterResolve`

    يفعّل Discord موافقات التنفيذ الأصلية تلقائيًا عندما تكون `enabled` غير مضبوطة أو `"auto"` ويمكن حلّ موافِق واحد على الأقل، إما من `execApprovals.approvers` أو من `commands.ownerAllowFrom`. لا يستنتج Discord موافقي التنفيذ من قناة `allowFrom` أو `dm.allowFrom` القديمة أو `defaultTo` للرسائل المباشرة. اضبط `enabled: false` لتعطيل Discord صراحةً كعميل موافقة أصلي.

    بالنسبة إلى أوامر المجموعات الحساسة الخاصة بالمالك فقط مثل `/diagnostics` و`/export-trajectory`، يرسل OpenClaw مطالبات الموافقة والنتائج النهائية بشكل خاص. يحاول رسالة Discord خاصة أولًا عندما يكون لدى المالك المستدعي مسار مالك Discord؛ وإذا لم يكن ذلك متاحًا، يعود إلى أول مسار مالك متاح من `commands.ownerAllowFrom`، مثل Telegram.

    عندما يكون `target` هو `channel` أو `both`، تكون مطالبة الموافقة مرئية في القناة. لا يمكن استخدام الأزرار إلا للموافقين الذين تم حلّهم؛ ويتلقى المستخدمون الآخرون رفضًا عابرًا. تتضمن مطالبات الموافقة نص الأمر، لذلك لا تفعّل التسليم إلى القناة إلا في القنوات الموثوقة. إذا تعذّر اشتقاق معرّف القناة من مفتاح الجلسة، يعود OpenClaw إلى التسليم عبر الرسائل الخاصة.

    يعرض Discord أيضًا أزرار الموافقة المشتركة التي تستخدمها قنوات الدردشة الأخرى. يضيف محوّل Discord الأصلي أساسًا توجيه الرسائل الخاصة للموافقين والتوزيع إلى القنوات.
    عند وجود هذه الأزرار، تكون هي تجربة مستخدم الموافقة الأساسية؛ ويجب أن يضمّن OpenClaw
    أمر `/approve` يدويًا فقط عندما تشير نتيجة الأداة إلى أن
    موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.
    إذا لم يكن وقت تشغيل الموافقة الأصلي في Discord نشطًا، يبقي OpenClaw
    مطالبة `/approve <id> <decision>` المحلية الحتمية مرئية. إذا كان
    وقت التشغيل نشطًا ولكن لا يمكن تسليم بطاقة أصلية إلى أي هدف،
    يرسل OpenClaw إشعارًا احتياطيًا في الدردشة نفسها يتضمن أمر `/approve`
    الدقيق من الموافقة المعلّقة.

    تتبع مصادقة Gateway وحل الموافقات عقد عميل Gateway المشترك (يتم حل معرّفات `plugin:` عبر `plugin.approval.resolve`؛ والمعرّفات الأخرى عبر `exec.approval.resolve`). تنتهي صلاحية الموافقات بعد 30 دقيقة افتراضيًا.

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

يقبل إجراء `event-create` معامل `image` اختياريًا (URL أو مسار ملف محلي) لتعيين صورة غلاف الحدث المجدول.

توجد بوابات الإجراءات ضمن `channels.discord.actions.*`.

سلوك البوابة الافتراضي:

| مجموعة الإجراءات                                                                                                                                                        | الافتراضي |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | ممكّن    |
| roles                                                                                                                                                                    | معطّل    |
| moderation                                                                                                                                                               | معطّل    |
| presence                                                                                                                                                                 | معطّل    |

## واجهة مستخدم المكونات v2

يستخدم OpenClaw مكونات Discord v2 لموافقات التنفيذ وعلامات السياق المتقاطع. يمكن لإجراءات رسائل Discord أيضًا قبول `components` لواجهة مستخدم مخصصة (متقدم؛ يتطلب إنشاء حمولة مكونات عبر أداة discord)، بينما تظل `embeds` القديمة متاحة ولكن لا يوصى بها.

- يضبط `channels.discord.ui.components.accentColor` لون التمييز المستخدم بواسطة حاويات مكونات Discord (hex).
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

لدى Discord سطحان صوتيان متميزان: **قنوات الصوت** الفورية (محادثات مستمرة) و**مرفقات الرسائل الصوتية** (تنسيق معاينة شكل الموجة). يدعم Gateway كليهما.

### قنوات الصوت

قائمة تحقق الإعداد:

1. فعّل Message Content Intent في Discord Developer Portal.
2. فعّل Server Members Intent عند استخدام قوائم السماح للأدوار/المستخدمين.
3. ادعُ البوت بنطاقي `bot` و`applications.commands`.
4. امنح أذونات Connect وSpeak وSend Messages وRead Message History في قناة الصوت الهدف.
5. فعّل الأوامر الأصلية (`commands.native` أو `channels.discord.commands.native`).
6. اضبط `channels.discord.voice`.

استخدم `/vc join|leave|status` للتحكم في الجلسات. يستخدم الأمر الوكيل الافتراضي للحساب ويتبع قواعد قائمة السماح وسياسة المجموعة نفسها مثل أوامر Discord الأخرى.

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

لفحص الأذونات الفعلية للبوت قبل الانضمام، شغّل:

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
- يتحكم `voice.mode` في مسار المحادثة. الافتراضي هو `agent-proxy`: واجهة صوتية أمامية في الوقت الحقيقي تتولى توقيت الأدوار، والمقاطعة، والتشغيل، وتفوّض العمل الجوهري إلى وكيل OpenClaw الموجّه عبر `openclaw_agent_consult`، وتتعامل مع النتيجة كمطالبة Discord مكتوبة من ذلك المتحدث. يحافظ `stt-tts` على تدفق STT الدفعي الأقدم مع TTS. يتيح `bidi` للنموذج في الوقت الحقيقي المحادثة مباشرة مع إتاحة `openclaw_agent_consult` لعقل OpenClaw.
- يتحكم `voice.agentSession` في محادثة OpenClaw التي تستقبل أدوار الصوت. اتركه غير معيّن لاستخدام جلسة قناة الصوت نفسها، أو اضبط `{ mode: "target", target: "channel:<text-channel-id>" }` لجعل قناة الصوت تعمل كامتداد ميكروفون/مكبر صوت لجلسة قناة نصية حالية في Discord مثل `#maintainers`.
- يتجاوز `voice.model` عقل وكيل OpenClaw لاستجابات Discord الصوتية والاستشارات في الوقت الحقيقي. اتركه غير معيّن ليرث نموذج الوكيل الموجّه. وهو منفصل عن `voice.realtime.model`.
- يوجّه `agent-proxy` الكلام عبر `discord-voice`، ما يحافظ على تفويض المالك/الأدوات العادي للمتحدث والجلسة المستهدفة، لكنه يخفي أداة الوكيل `tts` لأن Discord voice يملك التشغيل. افتراضيًا، يمنح `agent-proxy` الاستشارة وصولًا كاملًا للأدوات مكافئًا للمالك للمتحدثين المالكين (`voice.realtime.toolPolicy: "owner"`) ويفضّل بشدة استشارة وكيل OpenClaw قبل الإجابات الجوهرية (`voice.realtime.consultPolicy: "always"`). في وضع `always` الافتراضي هذا، لا تنطق طبقة الوقت الحقيقي تلقائيًا كلامًا تمهيديًا قبل إجابة الاستشارة؛ بل تلتقط الكلام وتنسخه، ثم تنطق إجابة OpenClaw الموجّهة. إذا اكتملت عدة إجابات استشارية قسرية بينما لا يزال Discord يشغّل الإجابة الأولى، تُصف الإجابات اللاحقة ذات الكلام الدقيق حتى يخمد التشغيل بدلًا من استبدال الكلام في منتصف الجملة.
- في وضع `stt-tts`، يستخدم STT `tools.media.audio`؛ ولا يؤثر `voice.model` في النسخ.
- في أوضاع الوقت الحقيقي، تضبط `voice.realtime.provider` و`voice.realtime.model` و`voice.realtime.voice` جلسة الصوت في الوقت الحقيقي. لاستخدام OpenAI Realtime 2 مع عقل Codex، استخدم `voice.realtime.model: "gpt-realtime-2"` و`voice.model: "openai-codex/gpt-5.5"`.
- يقبل مزوّد OpenAI للوقت الحقيقي أسماء أحداث Realtime 2 الحالية والأسماء المستعارة القديمة المتوافقة مع Codex لأحداث صوت الخرج والنصوص المنسوخة، بحيث يمكن للقطات المزوّد المتوافقة أن تنحرف دون إسقاط صوت المساعد.
- يتحكم `voice.realtime.bargeIn` فيما إذا كانت أحداث بدء متحدث Discord تقاطع تشغيل الوقت الحقيقي النشط. إذا لم يُعيّن، فإنه يتبع إعداد مقاطعة صوت الإدخال لدى مزوّد الوقت الحقيقي.
- يتحكم `voice.realtime.minBargeInAudioEndMs` في الحد الأدنى لمدة تشغيل المساعد قبل أن تؤدي مقاطعة OpenAI في الوقت الحقيقي إلى اقتطاع الصوت. الافتراضي: `250`. اضبطه على `0` للمقاطعة الفورية في الغرف منخفضة الصدى، أو ارفعه لإعدادات مكبرات الصوت كثيفة الصدى.
- لصوت OpenAI على تشغيل Discord، اضبط `voice.tts.provider: "openai"` واختر صوت Text-to-speech ضمن `voice.tts.openai.voice` أو `voice.tts.providers.openai.voice`. يُعد `cedar` خيارًا جيدًا ذا طابع ذكوري على نموذج OpenAI TTS الحالي.
- تنطبق تجاوزات `systemPrompt` الخاصة بكل قناة في Discord على أدوار نصوص الصوت المنسوخة لتلك القناة الصوتية.
- تستمد أدوار نصوص الصوت المنسوخة حالة المالك من `allowFrom` في Discord (أو `dm.allowFrom`)؛ ولا يمكن للمتحدثين غير المالكين الوصول إلى الأدوات الخاصة بالمالك فقط (مثلًا `gateway` و`cron`).
- صوت Discord اختياري للإعدادات النصية فقط؛ اضبط `channels.discord.voice.enabled=true` (أو احتفظ بكتلة `channels.discord.voice` حالية) لتمكين أوامر `/vc`، ووقت تشغيل الصوت، وهدف Gateway `GuildVoiceStates`.
- يمكن لـ `channels.discord.intents.voiceStates` أن يتجاوز صراحةً الاشتراك في هدف حالة الصوت. اتركه غير معيّن ليتبع الهدف التمكين الفعّال للصوت.
- إذا كان لدى `voice.autoJoin` عدة إدخالات للنقابة نفسها، ينضم OpenClaw إلى آخر قناة مضبوطة لتلك النقابة.
- يمرر `voice.daveEncryption` و`voice.decryptionFailureTolerance` إلى خيارات الانضمام في `@discordjs/voice`.
- افتراضيات `@discordjs/voice` هي `daveEncryption=true` و`decryptionFailureTolerance=24` إذا لم تُعيّن.
- يعتمد OpenClaw افتراضيًا على مفكك ترميز `opusscript` المكتوب بالكامل بـ JS لاستقبال صوت Discord. يتجاهل نهج تثبيت pnpm في المستودع الحزمة الأصلية الاختيارية `@discordjs/opus` حتى لا تبني التثبيتات العادية، ومسارات Docker، والاختبارات غير المرتبطة إضافة أصلية. يمكن لمضيفي أداء الصوت المخصصين الاشتراك باستخدام `OPENCLAW_DISCORD_OPUS_DECODER=native` بعد تثبيت الإضافة الأصلية.
- يتحكم `voice.connectTimeoutMs` في انتظار Ready الأولي لـ `@discordjs/voice` لمحاولات `/vc join` والانضمام التلقائي. الافتراضي: `30000`.
- يتحكم `voice.reconnectGraceMs` في المدة التي ينتظرها OpenClaw لجلسة صوتية منقطعة كي تبدأ إعادة الاتصال قبل إتلافها. الافتراضي: `15000`.
- في وضع `stt-tts`، لا يتوقف تشغيل الصوت لمجرد أن مستخدمًا آخر بدأ الكلام. لتجنب حلقات التغذية الراجعة، يتجاهل OpenClaw التقاط الصوت الجديد أثناء تشغيل TTS؛ تحدث بعد انتهاء التشغيل للدور التالي. تمرر أوضاع الوقت الحقيقي بدايات المتحدثين كإشارات مقاطعة إلى مزوّد الوقت الحقيقي.
- في أوضاع الوقت الحقيقي، قد يبدو الصدى من مكبرات الصوت إلى ميكروفون مفتوح كمقاطعة ويوقف التشغيل. لغرف Discord كثيفة الصدى، اضبط `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` لمنع OpenAI من المقاطعة التلقائية عند صوت الإدخال. أضف `voice.realtime.bargeIn: true` إذا كنت لا تزال تريد أن تقاطع أحداث بدء متحدث Discord التشغيل النشط. يتجاهل جسر OpenAI للوقت الحقيقي اقتطاعات التشغيل الأقصر من `voice.realtime.minBargeInAudioEndMs` باعتبارها على الأرجح صدى/ضجيجًا، ويسجلها كمتخطاة بدلًا من مسح تشغيل Discord.
- يتحكم `voice.captureSilenceGraceMs` في المدة التي ينتظرها OpenClaw بعد أن يبلغ Discord عن توقف متحدث قبل إنهاء ذلك المقطع الصوتي لـ STT. الافتراضي: `2500`؛ ارفع هذه القيمة إذا كان Discord يقسم الوقفات الطبيعية إلى نصوص جزئية متقطعة.
- عندما يكون ElevenLabs هو مزوّد TTS المحدد، يستخدم تشغيل صوت Discord بث TTS ويبدأ من بث استجابة المزوّد. تعود المزوّدات التي لا تدعم البث إلى مسار الملف المؤقت المركّب.
- يراقب OpenClaw أيضًا إخفاقات فك تشفير الاستقبال ويتعافى تلقائيًا بمغادرة قناة الصوت وإعادة الانضمام إليها بعد إخفاقات متكررة ضمن نافذة قصيرة.
- إذا أظهرت سجلات الاستقبال بشكل متكرر `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` بعد التحديث، اجمع تقرير تبعيات وسجلات. يتضمن سطر `@discordjs/voice` المضمّن إصلاح الحشو upstream من PR #11449 في discord.js، والذي أغلق issue #11419 في discord.js.
- أحداث الاستقبال `The operation was aborted` متوقعة عندما ينهي OpenClaw مقطع متحدث ملتقط؛ إنها تشخيصات مطوّلة وليست تحذيرات.
- تتضمن سجلات صوت Discord المطوّلة معاينة محدودة من سطر واحد لنص STT المنسوخ لكل مقطع متحدث مقبول، بحيث يعرض التصحيح كلًا من جانب المستخدم وجانب رد الوكيل دون تفريغ نصوص منسوخة غير محدودة.
- في وضع `agent-proxy`، يتخطى الرجوع الاحتياطي للاستشارة القسرية شذرات النصوص المنسوخة التي يُرجح أنها غير مكتملة، مثل النص المنتهي بـ `...` أو رابط لاحق مثل `and`، بالإضافة إلى الخواتيم الواضحة غير القابلة للتنفيذ مثل “سأعود حالًا” أو “وداعًا”. تعرض السجلات `forced agent consult skipped reason=...` عندما يمنع ذلك إجابة قديمة في الصف.

إعداد opus الأصلي لنسخ المصدر:

```bash
pnpm install
mise exec node@22 -- pnpm discord:opus:install
```

استخدم Node 22 للـ Gateway عندما تريد الإضافة الأصلية upstream المبنية مسبقًا لـ macOS arm64. إذا استخدمت وقت تشغيل Node آخر، فقد يحتاج مثبّت الاشتراك الاختياري إلى سلسلة أدوات بناء مصدر محلية لـ `node-gyp`.

بعد تثبيت الإضافة الأصلية، ابدأ Gateway باستخدام:

```bash
OPENCLAW_DISCORD_OPUS_DECODER=native pnpm gateway:watch
```

ينبغي أن تعرض سجلات الصوت المطوّلة `discord voice: opus decoder: @discordjs/opus`. دون الاشتراك الاختياري عبر env، أو إذا كانت الإضافة الأصلية مفقودة أو لا يمكن تحميلها على المضيف، يسجل OpenClaw `discord voice: opus decoder: opusscript` ويواصل استقبال الصوت عبر رجوع pure-JS الاحتياطي.

مسار STT مع TTS:

- يُحوّل التقاط PCM من Discord إلى ملف WAV مؤقت.
- يتولى `tools.media.audio` معالجة STT، مثل `openai/gpt-4o-mini-transcribe`.
- يُرسل النص المنسوخ عبر دخول Discord والتوجيه بينما يعمل LLM للاستجابة بنهج خرج صوتي يخفي أداة الوكيل `tts` ويطلب نصًا مُعادًا، لأن Discord voice يملك تشغيل TTS النهائي.
- عند ضبط `voice.model`، لا يتجاوز إلا LLM للاستجابة لهذا الدور في قناة الصوت.
- يُدمج `voice.tts` فوق `messages.tts`؛ تغذي المزوّدات القادرة على البث المشغّل مباشرة، وإلا يُشغّل ملف الصوت الناتج في القناة المنضم إليها.

مثال جلسة قناة صوتية افتراضية لـ agent-proxy:

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

دون كتلة `voice.agentSession`، تحصل كل قناة صوتية على جلسة OpenClaw موجّهة خاصة بها. على سبيل المثال، يتحدث `/vc join channel:234567890123456789` إلى جلسة تلك القناة الصوتية في Discord. نموذج الوقت الحقيقي هو الواجهة الصوتية الأمامية فقط؛ تُسلّم الطلبات الجوهرية إلى وكيل OpenClaw المضبوط. إذا أنتج نموذج الوقت الحقيقي نصًا منسوخًا نهائيًا دون استدعاء أداة الاستشارة، يفرض OpenClaw الاستشارة كرجوع احتياطي بحيث يظل الافتراضي يتصرف كأنه حديث مع الوكيل.

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

الصوت كامتداد لجلسة قناة Discord حالية:

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

في وضع `agent-proxy`، ينضم البوت إلى قناة الصوت المضبوطة، لكن أدوار وكيل OpenClaw تستخدم الجلسة والوكيل الموجّهين العاديين للقناة المستهدفة. تنطق جلسة الصوت في الوقت الحقيقي النتيجة المُعادة داخل قناة الصوت. لا يزال بإمكان الوكيل المشرف استخدام أدوات الرسائل العادية وفقًا لنهج أدواته، بما في ذلك إرسال رسالة Discord منفصلة إذا كان ذلك هو الإجراء الصحيح.

صيغ الأهداف المفيدة:

- يوجّه `target: "channel:123456789012345678"` عبر جلسة قناة نصية في Discord.
- يُعامل `target: "123456789012345678"` كهدف قناة.
- يوجّه `target: "dm:123456789012345678"` أو `target: "user:123456789012345678"` عبر جلسة الرسائل المباشرة تلك.

مثال OpenAI Realtime كثيف الصدى:

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

استخدم هذا عندما يسمع النموذج تشغيل Discord الخاص به عبر ميكروفون مفتوح، لكنك لا تزال تريد مقاطعته بالكلام. يمنع OpenClaw OpenAI من المقاطعة التلقائية بناء على صوت الإدخال الخام، بينما يتيح `bargeIn: true` لأحداث بدء مكبر Discord وصوت المتحدث النشط بالفعل إلغاء استجابات الوقت الفعلي النشطة قبل أن تصل الدورة الملتقطة التالية إلى OpenAI. تعامل إشارات المقاطعة المبكرة جدا ذات `audioEndMs` الأقل من `minBargeInAudioEndMs` على أنها صدى/ضجيج محتمل ويتم تجاهلها حتى لا ينقطع النموذج عند أول إطار تشغيل.

سجلات الصوت المتوقعة:

- عند الانضمام: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- عند بدء الوقت الفعلي: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- عند صوت المتحدث: `discord voice: realtime speaker turn opened ...` و`discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` و`discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- عند تخطي كلام قديم: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` أو `reason=non-actionable-closing ...`
- عند اكتمال استجابة الوقت الفعلي: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- عند إيقاف/إعادة ضبط التشغيل: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- عند استشارة الوقت الفعلي: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- عند إجابة الوكيل: `discord voice: agent turn answer ...`
- عند وضع الكلام المطابق في قائمة الانتظار: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`، متبوعا بـ `discord voice: realtime exact speech dequeued reason=player-idle ...`
- عند اكتشاف المقاطعة: `discord voice: realtime barge-in detected source=speaker-start ...` أو `discord voice: realtime barge-in detected source=active-speaker-audio ...`، متبوعا بـ `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- عند مقاطعة الوقت الفعلي: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`، متبوعا إما بـ `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` أو `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- عند تجاهل الصدى/الضجيج: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- عند تعطيل المقاطعة: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- عند التشغيل الخامل: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

لتصحيح الصوت المنقطع، اقرأ سجلات صوت الوقت الفعلي كتسلسل زمني:

1. يعني `realtime audio playback started` أن Discord بدأ تشغيل صوت المساعد. يبدأ الجسر من هذه النقطة في عد مقاطع خرج المساعد، وبايتات PCM الخاصة بـ Discord، وبايتات الوقت الفعلي الخاصة بالمزود، ومدة الصوت المركب.
2. يحدد `realtime speaker turn opened` أن متحدثا في Discord أصبح نشطا. إذا كان التشغيل نشطا بالفعل وكان `bargeIn` مفعلا، فقد يتبعه `barge-in detected source=speaker-start`.
3. يحدد `realtime input audio started` أول إطار صوت فعلي تم استلامه لدورة المتحدث هذه. يعني `outputActive=true` أو وجود `outputAudioMs` غير صفري هنا أن الميكروفون يرسل إدخالا بينما لا يزال تشغيل المساعد نشطا.
4. يعني `barge-in detected source=active-speaker-audio` أن OpenClaw رأى صوت متحدث حيا بينما كان تشغيل المساعد نشطا. هذا مفيد لتمييز المقاطعة الحقيقية عن حدث بدء متحدث في Discord بلا صوت مفيد.
5. يعني `barge-in requested reason=...` أن OpenClaw طلب من مزود الوقت الفعلي إلغاء الاستجابة النشطة أو اقتطاعها. يتضمن `outputAudioMs` و`outputActive` و`playbackChunks` حتى تتمكن من رؤية مقدار صوت المساعد الذي تم تشغيله فعليا قبل المقاطعة.
6. `realtime audio playback stopped reason=...` هو نقطة إعادة ضبط تشغيل Discord المحلية. يوضح السبب من أوقف التشغيل: `barge-in` أو `player-idle` أو `provider-clear-audio` أو `forced-agent-consult` أو `stream-close` أو `session-close`.
7. يلخص `realtime speaker turn closed` دورة الإدخال الملتقطة. يعني `chunks=0` أو `hasAudio=false` أن دورة المتحدث فُتحت لكن لم يصل أي صوت صالح للاستخدام إلى جسر الوقت الفعلي. يعني `interruptedPlayback=true` أن دورة الإدخال هذه تداخلت مع خرج المساعد وشغلت منطق المقاطعة.

حقول مفيدة:

- `outputAudioMs`: مدة صوت المساعد التي ولدها مزود الوقت الفعلي قبل سطر السجل.
- `audioMs`: مدة صوت المساعد التي عدها OpenClaw قبل توقف التشغيل.
- `elapsedMs`: وقت ساعة الحائط بين فتح وإغلاق تدفق التشغيل أو دورة المتحدث.
- `discordBytes`: بايتات PCM ستيريو 48 kHz المرسلة إلى صوت Discord أو المستلمة منه.
- `realtimeBytes`: بايتات PCM بتنسيق المزود المرسلة إلى مزود الوقت الفعلي أو المستلمة منه.
- `playbackChunks`: مقاطع صوت المساعد المعاد توجيهها إلى Discord للاستجابة النشطة.
- `sinceLastAudioMs`: الفاصل بين آخر إطار صوت متحدث ملتقط وإغلاق دورة المتحدث.

أنماط شائعة:

- يشير الانقطاع الفوري مع `source=active-speaker-audio` و`outputAudioMs` صغير والمستخدم نفسه قريبا عادة إلى دخول صدى مكبر الصوت إلى الميكروفون. ارفع `voice.realtime.minBargeInAudioEndMs` أو اخفض مستوى صوت مكبر الصوت أو استخدم سماعات رأس أو اضبط `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- يعني `source=speaker-start` متبوعا بـ `speaker turn closed ... hasAudio=false` أن Discord أبلغ عن بدء متحدث لكن لم يصل أي صوت إلى OpenClaw. قد يكون ذلك حدث صوت Discord عابرا أو سلوك بوابة الضجيج أو عميلا يفتح الميكروفون لفترة وجيزة.
- يعني `audio playback stopped reason=stream-close` دون مقاطعة قريبة أو `provider-clear-audio` أن تدفق تشغيل Discord المحلي انتهى بشكل غير متوقع. تحقق من سجلات المزود ومشغل Discord السابقة.
- يعني `capture ignored during playback (barge-in disabled)` أن OpenClaw أسقط الإدخال عمدا بينما كان صوت المساعد نشطا. فعّل `voice.realtime.bargeIn` إذا أردت أن يقاطع الكلام التشغيل.
- يعني `barge-in ignored ... outputActive=false` أن Discord أو VAD الخاص بالمزود أبلغ عن كلام، لكن لم يكن لدى OpenClaw تشغيل نشط لمقاطعته. لا ينبغي أن يؤدي هذا إلى قطع الصوت.

تحل بيانات الاعتماد لكل مكون: مصادقة مسار LLM لـ `voice.model`، ومصادقة STT لـ `tools.media.audio`، ومصادقة TTS لـ `messages.tts`/`voice.tts`، ومصادقة مزود الوقت الفعلي لـ `voice.realtime.providers` أو إعدادات المصادقة العادية الخاصة بالمزود.

### رسائل الصوت

تعرض رسائل صوت Discord معاينة موجية وتتطلب صوت OGG/Opus. ينشئ OpenClaw الموجة تلقائيا، لكنه يحتاج إلى `ffmpeg` و`ffprobe` على مضيف Gateway للفحص والتحويل.

- وفر **مسار ملف محلي** (يتم رفض عناوين URL).
- احذف محتوى النص (يرفض Discord النص + رسالة صوت في الحمولة نفسها).
- يقبل أي تنسيق صوتي؛ يحوله OpenClaw إلى OGG/Opus عند الحاجة.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="Used disallowed intents or bot sees no guild messages">

    - فعّل Message Content Intent
    - فعّل Server Members Intent عندما تعتمد على حل المستخدم/العضو
    - أعد تشغيل Gateway بعد تغيير intents

  </Accordion>

  <Accordion title="Guild messages blocked unexpectedly">

    - تحقق من `groupPolicy`
    - تحقق من قائمة السماح للخادم ضمن `channels.discord.guilds`
    - إذا كانت خريطة `channels` الخاصة بالخادم موجودة، فلا يسمح إلا بالقنوات المدرجة
    - تحقق من سلوك `requireMention` وأنماط الإشارة

    فحوص مفيدة:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false but still blocked">
    أسباب شائعة:

    - `groupPolicy="allowlist"` دون قائمة سماح مطابقة للخادم/القناة
    - تكوين `requireMention` في الموضع الخطأ (يجب أن يكون ضمن `channels.discord.guilds` أو إدخال القناة)
    - المرسل محظور بواسطة قائمة سماح `users` الخاصة بالخادم/القناة

  </Accordion>

  <Accordion title="Long-running Discord turns or duplicate replies">

    سجلات نموذجية:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    مفاتيح ضبط قائمة انتظار Discord Gateway:

    - حساب واحد: `channels.discord.eventQueue.listenerTimeout`
    - حسابات متعددة: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - يتحكم هذا فقط في عمل مستمع Discord Gateway، وليس مدة دورة الوكيل

    لا يطبق Discord مهلة مملوكة للقناة على دورات الوكيل الموضوعة في قائمة الانتظار. تسلم مستمعات الرسائل العمل فورا، وتحافظ تشغيلات Discord الموضوعة في قائمة الانتظار على ترتيب كل جلسة إلى أن تكتمل دورة حياة الجلسة/الأداة/وقت التشغيل أو يتم إجهاض العمل.

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
    يجلب OpenClaw بيانات تعريف Discord `/gateway/bot` قبل الاتصال. تعود حالات الفشل العابرة إلى عنوان URL الافتراضي لـ Gateway الخاص بـ Discord وتخضع لمعدل محدود في السجلات.

    مفاتيح ضبط مهلة بيانات التعريف:

    - حساب واحد: `channels.discord.gatewayInfoTimeoutMs`
    - حسابات متعددة: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - بديل env عندما لا يكون التكوين مضبوطا: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - الافتراضي: `30000` (30 ثانية)، الحد الأقصى: `120000`

  </Accordion>

  <Accordion title="Gateway READY timeout restarts">
    ينتظر OpenClaw حدث `READY` الخاص بـ Gateway في Discord أثناء بدء التشغيل وبعد إعادة اتصالات وقت التشغيل. قد تحتاج الإعدادات متعددة الحسابات مع تدرج بدء التشغيل إلى نافذة READY أطول عند بدء التشغيل من الافتراضي.

    مفاتيح ضبط مهلة READY:

    - بدء تشغيل بحساب واحد: `channels.discord.gatewayReadyTimeoutMs`
    - بدء تشغيل بحسابات متعددة: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - بديل env لبدء التشغيل عندما لا يكون التكوين مضبوطا: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - افتراضي بدء التشغيل: `15000` (15 ثانية)، الحد الأقصى: `120000`
    - وقت التشغيل بحساب واحد: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - وقت التشغيل بحسابات متعددة: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - بديل env لوقت التشغيل عندما لا يكون التكوين مضبوطا: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - افتراضي وقت التشغيل: `30000` (30 ثانية)، الحد الأقصى: `120000`

  </Accordion>

  <Accordion title="Permissions audit mismatches">
    لا تعمل فحوص أذونات `channels status --probe` إلا مع معرفات القنوات الرقمية.

    إذا استخدمت مفاتيح slug، فقد يظل التطابق في وقت التشغيل يعمل، لكن probe لا يستطيع التحقق الكامل من الأذونات.

  </Accordion>

  <Accordion title="DM and pairing issues">

    - DM معطل: `channels.discord.dm.enabled=false`
    - سياسة DM معطلة: `channels.discord.dmPolicy="disabled"` (قديم: `channels.discord.dm.policy`)
    - انتظار موافقة الاقتران في وضع `pairing`

  </Accordion>

  <Accordion title="Bot to bot loops">
    بشكل افتراضي يتم تجاهل الرسائل التي يكتبها bot.

    إذا ضبطت `channels.discord.allowBots=true`، فاستخدم قواعد صارمة للإشارات وقائمة السماح لتجنب سلوك الحلقات.
    يفضَّل استخدام `channels.discord.allowBots="mentions"` لقبول رسائل البوتات فقط عندما تشير إلى البوت.

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

    - أبقِ OpenClaw محدَّثًا (`openclaw update`) حتى تكون منطق استرداد استقبال صوت Discord موجودًا
    - تأكّد من `channels.discord.voice.daveEncryption=true` (الافتراضي)
    - ابدأ من `channels.discord.voice.decryptionFailureTolerance=24` (افتراضي المنبع) ولا تضبطه إلا عند الحاجة
    - راقب السجلات بحثًا عن:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - إذا استمرت الإخفاقات بعد إعادة الانضمام التلقائية، فاجمع السجلات وقارنها بتاريخ استقبال DAVE في المنبع في [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) و[discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## مرجع التهيئة

المرجع الأساسي: [مرجع التهيئة - Discord](/ar/gateway/config-channels#discord).

<Accordion title="High-signal Discord fields">

- بدء التشغيل/المصادقة: `enabled`, `token`, `accounts.*`, `allowBots`
- السياسة: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- الأمر: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- طابور الأحداث: `eventQueue.listenerTimeout` (ميزانية المستمع)، `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- الرد/السجل: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- التسليم: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- البث: `streaming` (الاسم المستعار القديم: `streamMode`)، `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- الوسائط/إعادة المحاولة: `mediaMaxMb` (يحد تحميلات Discord الصادرة، الافتراضي `100MB`)، `retry`
- الإجراءات: `actions.*`
- الحضور: `activity`, `status`, `activityType`, `activityUrl`
- واجهة المستخدم: `ui.components.accentColor`
- الميزات: `threadBindings`، و`bindings[]` على المستوى الأعلى (`type: "acp"`)، `pluralkit`, `execApprovals`, `intents`, `agentComponents`, `heartbeat`, `responsePrefix`

</Accordion>

## السلامة والعمليات

- تعامل مع رموز البوتات كأسرار (يُفضَّل `DISCORD_BOT_TOKEN` في البيئات الخاضعة للإشراف).
- امنح أقل أذونات Discord اللازمة.
- إذا كانت حالة نشر الأوامر أو حالتها قديمة، فأعد تشغيل Gateway وأعد التحقق باستخدام `openclaw channels status --probe`.

## ذو صلة

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/ar/channels/pairing">
    اربط مستخدم Discord بالـ Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/ar/channels/groups">
    سلوك دردشة المجموعات وقائمة السماح.
  </Card>
  <Card title="Channel routing" icon="route" href="/ar/channels/channel-routing">
    وجّه الرسائل الواردة إلى الوكلاء.
  </Card>
  <Card title="Security" icon="shield" href="/ar/gateway/security">
    نموذج التهديدات والتقوية.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/ar/concepts/multi-agent">
    اربط الخوادم والقنوات بالوكلاء.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلية.
  </Card>
</CardGroup>

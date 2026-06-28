---
read_when:
    - العمل على ميزات قناة Discord
summary: حالة دعم بوت Discord وإمكاناته وتكوينه
title: Discord
x-i18n:
    generated_at: "2026-06-28T20:41:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91bda14cfdd7bf5045413d97c56936ea7150b396e0e7ecd4ac300e1a811377cb
    source_path: channels/discord.md
    workflow: 16
---

جاهز للرسائل المباشرة وقنوات الخوادم عبر Discord gateway الرسمي.

<CardGroup cols={3}>
  <Card title="الإقران" icon="link" href="/ar/channels/pairing">
    تكون رسائل Discord المباشرة في وضع الإقران افتراضياً.
  </Card>
  <Card title="أوامر Slash" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلية وفهرس الأوامر.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عبر القنوات وتدفق الإصلاح.
  </Card>
</CardGroup>

## الإعداد السريع

ستحتاج إلى إنشاء تطبيق جديد مع بوت، وإضافة البوت إلى خادمك، وإقرانه مع OpenClaw. نوصي بإضافة البوت إلى خادمك الخاص. إذا لم يكن لديك خادم بعد، [أنشئ واحداً أولاً](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (اختر **Create My Own > For me and my friends**).

<Steps>
  <Step title="إنشاء تطبيق Discord وبوت">
    انتقل إلى [Discord Developer Portal](https://discord.com/developers/applications) وانقر **New Application**. سمّه شيئاً مثل "OpenClaw".

    انقر **Bot** في الشريط الجانبي. اضبط **Username** على الاسم الذي تطلقه على وكيل OpenClaw لديك.

  </Step>

  <Step title="تفعيل الصلاحيات المميزة">
    أثناء وجودك في صفحة **Bot**، مرّر لأسفل إلى **Privileged Gateway Intents** وفعّل:

    - **Message Content Intent** (مطلوب)
    - **Server Members Intent** (موصى به؛ مطلوب لقوائم السماح حسب الدور ولمطابقة الاسم مع المعرّف)
    - **Presence Intent** (اختياري؛ مطلوب فقط لتحديثات الحضور)

  </Step>

  <Step title="نسخ رمز البوت">
    مرّر للأعلى مرة أخرى في صفحة **Bot** وانقر **Reset Token**.

    <Note>
    رغم الاسم، سيؤدي هذا إلى إنشاء أول رمز لك — لا يتم "إعادة ضبط" أي شيء.
    </Note>

    انسخ الرمز واحفظه في مكان ما. هذا هو **Bot Token** الخاص بك وستحتاج إليه بعد قليل.

  </Step>

  <Step title="إنشاء عنوان URL للدعوة وإضافة البوت إلى خادمك">
    انقر **OAuth2** في الشريط الجانبي. ستنشئ عنوان URL للدعوة بالصلاحيات الصحيحة لإضافة البوت إلى خادمك.

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
      - إضافة ردود الفعل (اختياري)

    هذه هي المجموعة الأساسية لقنوات النص العادية. إذا كنت تخطط للنشر في سلاسل Discord، بما في ذلك تدفقات عمل قنوات المنتدى أو الوسائط التي تنشئ سلسلة أو تتابعها، ففعّل أيضاً **Send Messages in Threads**.
    انسخ عنوان URL المُنشأ في الأسفل، والصقه في متصفحك، وحدد خادمك، وانقر **Continue** للاتصال. يجب أن ترى الآن البوت في خادم Discord.

  </Step>

  <Step title="تفعيل وضع المطور وجمع معرّفاتك">
    بالعودة إلى تطبيق Discord، تحتاج إلى تفعيل وضع المطور حتى تتمكن من نسخ المعرّفات الداخلية.

    1. انقر **User Settings** (أيقونة الترس بجانب صورتك الرمزية) ← مرّر إلى **Developer** في الشريط الجانبي ← فعّل **Developer Mode**

        *(ملاحظة: في تطبيق Discord للجوال، يوجد وضع المطور تحت **App Settings** ← **Advanced**)*

    2. انقر بزر الفأرة الأيمن على **أيقونة الخادم** في الشريط الجانبي ← **Copy Server ID**
    3. انقر بزر الفأرة الأيمن على **صورتك الرمزية** ← **Copy User ID**

    احفظ **Server ID** و **User ID** بجانب Bot Token لديك — سترسل الثلاثة جميعاً إلى OpenClaw في الخطوة التالية.

  </Step>

  <Step title="السماح بالرسائل المباشرة من أعضاء الخادم">
    لكي يعمل الإقران، يحتاج Discord إلى السماح للبوت بإرسال رسالة مباشرة إليك. انقر بزر الفأرة الأيمن على **أيقونة الخادم** ← **Privacy Settings** ← فعّل **Direct Messages**.

    يتيح هذا لأعضاء الخادم (بما في ذلك البوتات) إرسال رسائل مباشرة إليك. أبقِ هذا مفعلاً إذا كنت تريد استخدام رسائل Discord المباشرة مع OpenClaw. إذا كنت تخطط لاستخدام قنوات الخادم فقط، يمكنك تعطيل الرسائل المباشرة بعد الإقران.

  </Step>

  <Step title="تعيين رمز البوت بأمان (لا ترسله في الدردشة)">
    رمز بوت Discord الخاص بك سرّ (مثل كلمة مرور). عيّنه على الجهاز الذي يشغّل OpenClaw قبل مراسلة وكيلك.

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

    إذا كان OpenClaw يعمل بالفعل كخدمة في الخلفية، فأعد تشغيله عبر تطبيق OpenClaw Mac أو بإيقاف عملية `openclaw gateway run` وإعادة تشغيلها.
    لتثبيتات الخدمة المُدارة، شغّل `openclaw gateway install` من صدفة يتوفر فيها `DISCORD_BOT_TOKEN`، أو خزّن المتغير في `~/.openclaw/.env`، حتى تتمكن الخدمة من حل SecretRef الخاص بالبيئة بعد إعادة التشغيل.
    إذا كان مضيفك محظوراً أو مقيّداً بالمعدل بسبب بحث تطبيق Discord عند بدء التشغيل، فعيّن معرّف تطبيق/عميل Discord من Developer Portal حتى يتمكن بدء التشغيل من تخطي نداء REST هذا. استخدم `channels.discord.applicationId` للحساب الافتراضي، أو `channels.discord.accounts.<accountId>.applicationId` عند تشغيل عدة بوتات Discord.

  </Step>

  <Step title="تكوين OpenClaw والإقران">

    <Tabs>
      <Tab title="اسأل وكيلك">
        تحدّث مع وكيل OpenClaw لديك على أي قناة موجودة (مثل Telegram) وأخبره. إذا كان Discord هو قناتك الأولى، فاستخدم تبويب CLI / config بدلاً من ذلك.

        > "لقد عيّنت بالفعل رمز بوت Discord في التكوين. يُرجى إنهاء إعداد Discord باستخدام User ID `<user_id>` و Server ID `<server_id>`."
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

        للإعداد النصي أو البعيد، اكتب كتلة JSON5 نفسها باستخدام `openclaw config patch --file ./discord.patch.json5 --dry-run` ثم أعد التشغيل بدون `--dry-run`. قيم `token` ذات النص الصريح مدعومة. قيم SecretRef مدعومة أيضاً لـ `channels.discord.token` عبر مزودي env/file/exec. راجع [إدارة الأسرار](/ar/gateway/secrets).

        لعدة بوتات Discord، احتفظ برمز كل بوت ومعرّف التطبيق تحت حسابه. يتم توريث `channels.discord.applicationId` على المستوى الأعلى بواسطة الحسابات، لذا لا تضبطه هناك إلا عندما يجب أن يستخدم كل حساب معرّف التطبيق نفسه.

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

  <Step title="الموافقة على إقران الرسالة المباشرة الأول">
    انتظر حتى يعمل Gateway، ثم أرسل رسالة مباشرة إلى البوت في Discord. سيرد برمز إقران.

    <Tabs>
      <Tab title="اسأل وكيلك">
        أرسل رمز الإقران إلى وكيلك على قناتك الموجودة:

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
حلّ الرموز يراعي الحساب. قيم رموز التكوين تتغلب على احتياطي البيئة. لا يُستخدم `DISCORD_BOT_TOKEN` إلا للحساب الافتراضي.
إذا حُلّ حسابا Discord مفعّلان إلى رمز البوت نفسه، يبدأ OpenClaw مراقب Gateway واحداً فقط لذلك الرمز. يتغلب الرمز القادم من التكوين على احتياطي البيئة الافتراضي؛ وإلا فإن أول حساب مفعّل هو الذي يتغلب ويُبلّغ عن الحساب المكرر كمعطّل.
للاستدعاءات الصادرة المتقدمة (أداة الرسائل/إجراءات القنوات)، يُستخدم `token` صريح لكل استدعاء لذلك الاستدعاء. ينطبق هذا على إجراءات الإرسال والقراءة/الفحص (على سبيل المثال read/search/fetch/thread/pins/permissions). لا تزال إعدادات سياسة الحساب/إعادة المحاولة تأتي من الحساب المحدد في لقطة وقت التشغيل النشطة.
</Note>

## موصى به: إعداد مساحة عمل للخادم

بمجرد أن تعمل الرسائل المباشرة، يمكنك إعداد خادم Discord لديك كمساحة عمل كاملة حيث تحصل كل قناة على جلسة وكيل خاصة بها مع سياقها الخاص. يوصى بذلك للخوادم الخاصة التي لا تضم إلا أنت والبوت الخاص بك.

<Steps>
  <Step title="إضافة خادمك إلى قائمة سماح الخوادم">
    يتيح هذا لوكيلك الرد في أي قناة على خادمك، وليس الرسائل المباشرة فقط.

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

  <Step title="السماح بالردود دون @mention">
    افتراضياً، لا يرد وكيلك في قنوات الخادم إلا عند @mentioned. بالنسبة إلى خادم خاص، ربما تريد أن يرد على كل رسالة.

    في قنوات الخادم، تُنشر الردود العادية تلقائياً افتراضياً. للغرف المشتركة العاملة دائماً، فعّل `messages.groupChat.visibleReplies: "message_tool"` حتى يتمكن الوكيل من المراقبة بهدوء والنشر فقط عندما يقرر أن الرد في القناة مفيد. يعمل هذا بأفضل شكل مع نماذج الجيل الأحدث الموثوقة في الأدوات مثل GPT 5.5. تبقى أحداث الغرفة المحيطة صامتة ما لم ترسل الأداة. راجع [أحداث الغرفة المحيطة](/ar/channels/ambient-room-events) للحصول على تكوين وضع المراقبة الكامل.

    إذا أظهر Discord الكتابة وأظهرت السجلات استخدام الرموز لكن لم تُنشر أي رسالة، فتحقق مما إذا كانت الجولة مكوّنة كحدث غرفة محيط أو اختارت ردوداً مرئية عبر أداة الرسائل.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "اسمح لوكيلي بالرد على هذا الخادم دون الحاجة إلى ذكره بـ @"
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

        لاشتراط إرسال أداة الرسائل للردود المرئية في المجموعات/القنوات، عيّن `messages.groupChat.visibleReplies: "message_tool"`.

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
        إذا كنت تحتاج إلى سياق مشترك في كل قناة، فضع التعليمات الثابتة في `AGENTS.md` أو `USER.md` (يتم حقنها في كل جلسة). احتفظ بالملاحظات طويلة الأمد في `MEMORY.md` واصل إليها عند الطلب باستخدام أدوات الذاكرة.
      </Tab>
    </Tabs>

  </Step>
</Steps>

أنشئ الآن بعض القنوات على خادم Discord لديك وابدأ الدردشة. يمكن لوكيلك رؤية اسم القناة، وتحصل كل قناة على جلستها المعزولة الخاصة — لذا يمكنك إعداد `#coding` أو `#home` أو `#research` أو أي شيء يناسب سير عملك.

## نموذج وقت التشغيل

- يمتلك Gateway اتصال Discord.
- يكون توجيه الردود حتميًا: تعود الردود الواردة من Discord إلى Discord.
- تُضاف بيانات تعريف خادم/قناة Discord إلى موجه النموذج كسياق غير موثوق
  به، وليس كبادئة رد مرئية للمستخدم. إذا نسخ نموذج ذلك الغلاف
  مرة أخرى، يزيل OpenClaw بيانات التعريف المنسوخة من الردود الصادرة ومن
  سياق إعادة التشغيل المستقبلي.
- افتراضيًا (`session.dmScope=main`)، تشارك المحادثات المباشرة جلسة العميل الرئيسية (`agent:main:main`).
- قنوات الخادم هي مفاتيح جلسات معزولة (`agent:<agentId>:discord:channel:<channelId>`).
- تُتجاهل الرسائل المباشرة الجماعية افتراضيًا (`channels.discord.dm.groupEnabled=false`).
- تعمل أوامر الشرطة المائلة الأصلية في جلسات أوامر معزولة (`agent:<agentId>:discord:slash:<userId>`)، مع استمرار حمل `CommandTargetSessionKey` إلى جلسة المحادثة الموجهة.
- يستخدم تسليم إعلانات cron/heartbeat النصية فقط إلى Discord الإجابة النهائية
  المرئية للمساعد مرة واحدة. وتبقى حمولات الوسائط والمكونات المنظمة
  متعددة الرسائل عندما يصدر العميل عدة حمولات قابلة للتسليم.

## قنوات المنتدى

لا تقبل قنوات المنتدى والوسائط في Discord إلا منشورات السلاسل. يدعم OpenClaw طريقتين لإنشائها:

- أرسل رسالة إلى أصل المنتدى (`channel:<forumId>`) لإنشاء سلسلة تلقائيًا. يستخدم عنوان السلسلة أول سطر غير فارغ من رسالتك.
- استخدم `openclaw message thread create` لإنشاء سلسلة مباشرة. لا تمرر `--message-id` لقنوات المنتدى.

مثال: الإرسال إلى أصل المنتدى لإنشاء سلسلة

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

مثال: إنشاء سلسلة منتدى صراحة

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

لا تقبل أصول المنتديات مكونات Discord. إذا كنت تحتاج إلى مكونات، فأرسل إلى السلسلة نفسها (`channel:<threadId>`).

## المكونات التفاعلية

يدعم OpenClaw حاويات مكونات Discord v2 لرسائل العميل. استخدم أداة الرسائل مع حمولة `components`. تُوجّه نتائج التفاعل مرة أخرى إلى العميل كرسائل واردة عادية وتتبع إعدادات `replyToMode` الحالية في Discord.

الكتل المدعومة:

- `text` و`section` و`separator` و`actions` و`media-gallery` و`file`
- تتيح صفوف الإجراءات ما يصل إلى 5 أزرار أو قائمة تحديد واحدة
- أنواع التحديد: `string` و`user` و`role` و`mentionable` و`channel`

افتراضيًا، تكون المكونات للاستخدام مرة واحدة. عيّن `components.reusable=true` للسماح باستخدام الأزرار والتحديدات والنماذج عدة مرات حتى تنتهي صلاحيتها.

لتقييد من يمكنه النقر على زر، عيّن `allowedUsers` على ذلك الزر (معرفات مستخدمي Discord أو الوسوم أو `*`). عند التهيئة، يتلقى المستخدمون غير المطابقين رفضًا مؤقتًا.

تنتهي صلاحية استدعاءات المكونات بعد 30 دقيقة افتراضيًا. عيّن `channels.discord.agentComponents.ttlMs` لتغيير مدة حياة سجل الاستدعاءات هذا لحساب Discord الافتراضي، أو `channels.discord.accounts.<accountId>.agentComponents.ttlMs` لتجاوز حساب واحد في إعداد متعدد الحسابات. القيمة بالمللي ثانية، ويجب أن تكون عددًا صحيحًا موجبًا، ومحددة بحد أقصى `86400000` (24 ساعة). تفيد مدد TTL الأطول في سير عمل المراجعة أو الموافقة التي تحتاج إلى بقاء الأزرار قابلة للاستخدام، لكنها تمدد أيضًا النافذة التي يمكن فيها لرسالة Discord قديمة أن تظل قادرة على تشغيل إجراء. فضّل أقصر TTL يناسب سير العمل، وأبق الإعداد الافتراضي عندما تكون الاستدعاءات القديمة مفاجئة.

تفتح أوامر الشرطة المائلة `/model` و`/models` منتقي نماذج تفاعليًا يتضمن قوائم منسدلة للمزود والنموذج ووقت التشغيل المتوافق بالإضافة إلى خطوة إرسال. أصبح `/models add` مهجورًا ويعيد الآن رسالة إهمال بدلًا من تسجيل النماذج من المحادثة. يكون رد المنتقي مؤقتًا ولا يمكن استخدامه إلا من المستخدم الذي استدعاه. تقتصر قوائم التحديد في Discord على 25 خيارًا، لذا أضف إدخالات `provider/*` إلى `agents.defaults.models` عندما تريد أن يعرض المنتقي النماذج المكتشفة ديناميكيًا فقط للمزودين المحددين مثل `openai` أو `vllm`.

مرفقات الملفات:

- يجب أن تشير كتل `file` إلى مرجع مرفق (`attachment://<filename>`)
- وفّر المرفق عبر `media`/`path`/`filePath` (ملف واحد)؛ استخدم `media-gallery` لعدة ملفات
- استخدم `filename` لتجاوز اسم الرفع عندما يجب أن يطابق مرجع المرفق

نماذج Modal:

- أضف `components.modal` مع ما يصل إلى 5 حقول
- أنواع الحقول: `text` و`checkbox` و`radio` و`select` و`role-select` و`user-select`
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
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.discord.dmPolicy` في وصول الرسائل المباشرة. `channels.discord.allowFrom` هي قائمة السماح الأساسية للرسائل المباشرة.

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `channels.discord.allowFrom` القيمة `"*"`)
    - `disabled`

    إذا لم تكن سياسة الرسائل المباشرة مفتوحة، يُحظر المستخدمون غير المعروفين (أو يُطلب منهم الاقتران في وضع `pairing`).

    أسبقية الحسابات المتعددة:

    - ينطبق `channels.discord.accounts.default.allowFrom` على حساب `default` فقط.
    - في حساب واحد، تكون لـ`allowFrom` الأسبقية على `dm.allowFrom` القديم.
    - ترث الحسابات المسماة `channels.discord.allowFrom` عندما لا يكون لديها `allowFrom` خاص بها ولا `dm.allowFrom` القديم.
    - لا ترث الحسابات المسماة `channels.discord.accounts.default.allowFrom`.

    ما زال `channels.discord.dm.policy` و`channels.discord.dm.allowFrom` القديمان يُقرآن للتوافق. يرحلهما `openclaw doctor --fix` إلى `dmPolicy` و`allowFrom` عندما يمكنه فعل ذلك دون تغيير الوصول.

    تنسيق هدف الرسائل المباشرة للتسليم:

    - `user:<id>`
    - إشارة `<@id>`

    تُحل المعرفات الرقمية المجردة عادةً كمعرفات قنوات عندما يكون افتراضي قناة نشطًا، لكن المعرفات المدرجة في `allowFrom` الفعّالة للرسائل المباشرة للحساب تُعامل كأهداف رسائل مباشرة للمستخدمين للتوافق.

  </Tab>

  <Tab title="مجموعات الوصول">
    يمكن لتفويض الرسائل المباشرة وأوامر النص في Discord استخدام إدخالات `accessGroup:<name>` ديناميكية في `channels.discord.allowFrom`.

    تُشارك أسماء مجموعات الوصول عبر قنوات الرسائل. استخدم `type: "message.senders"` لمجموعة ثابتة يُعبّر عن أعضائها بصيغة `allowFrom` العادية لكل قناة، أو `type: "discord.channelAudience"` عندما يجب أن يحدد جمهور `ViewChannel` الحالي لقناة Discord العضوية ديناميكيًا. وُثق سلوك مجموعات الوصول المشتركة هنا: [مجموعات الوصول](/ar/channels/access-groups).

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

    لا تملك قناة نصية في Discord قائمة أعضاء منفصلة. يمثّل `type: "discord.channelAudience"` العضوية كالتالي: مرسل الرسالة المباشرة عضو في الخادم المهيأ ولديه حاليًا إذن `ViewChannel` فعّال على القناة المهيأة بعد تطبيق أدوار القناة وعمليات الاستبدال.

    مثال: السماح لأي شخص يمكنه رؤية `#maintainers` بإرسال رسالة مباشرة إلى البوت، مع إبقاء الرسائل المباشرة مغلقة أمام الجميع غير ذلك.

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

    تفشل عمليات البحث بإغلاق الوصول. إذا أعاد Discord القيمة `Missing Access`، أو فشل البحث عن العضو، أو كانت القناة تنتمي إلى خادم مختلف، يُعامل مرسل الرسالة المباشرة على أنه غير مصرح له.

    فعّل **Server Members Intent** في Discord Developer Portal للبوت عند استخدام مجموعات وصول جمهور القناة. لا تتضمن الرسائل المباشرة حالة عضو الخادم، لذا يحل OpenClaw العضو عبر Discord REST وقت التفويض.

  </Tab>

  <Tab title="سياسة الخادم">
    تتحكم `channels.discord.groupPolicy` في التعامل مع الخوادم:

    - `open`
    - `allowlist`
    - `disabled`

    يكون خط الأساس الآمن عند وجود `channels.discord` هو `allowlist`.

    سلوك `allowlist`:

    - يجب أن يطابق الخادم `channels.discord.guilds` (يُفضّل `id`، ويُقبل slug)
    - قوائم سماح اختيارية للمرسلين: `users` (يوصى بالمعرفات المستقرة) و`roles` (معرفات الأدوار فقط)؛ إذا هُيئ أي منهما، يُسمح للمرسلين عندما يطابقون `users` أو `roles`
    - تكون مطابقة الاسم/الوسم المباشرة معطلة افتراضيًا؛ فعّل `channels.discord.dangerouslyAllowNameMatching: true` فقط كوضع توافق لكسر الزجاج عند الطوارئ
    - الأسماء/الوسوم مدعومة في `users`، لكن المعرفات أكثر أمانًا؛ يحذر `openclaw security audit` عند استخدام إدخالات اسم/وسم
    - إذا كان للخادم `channels` مهيأة، تُرفض القنوات غير المدرجة
    - إذا لم يكن للخادم كتلة `channels`، يُسمح بكل القنوات في ذلك الخادم المدرج في قائمة السماح

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

    إذا عيّنت `DISCORD_BOT_TOKEN` فقط ولم تنشئ كتلة `channels.discord`، يكون الاحتياط في وقت التشغيل `groupPolicy="allowlist"` (مع تحذير في السجلات)، حتى لو كانت `channels.defaults.groupPolicy` هي `open`.

  </Tab>

  <Tab title="الإشارات والرسائل المباشرة الجماعية">
    تخضع رسائل الخادم لبوابة الإشارة افتراضيًا.

    يشمل اكتشاف الإشارة:

    - إشارة صريحة إلى البوت
    - أنماط الإشارة المهيأة (`agents.list[].groupChat.mentionPatterns`، مع الاحتياطي `messages.groupChat.mentionPatterns`)
    - سلوك الرد الضمني على البوت في الحالات المدعومة

    عند كتابة رسائل Discord الصادرة، استخدم صيغة الإشارة الأساسية: `<@USER_ID>` للمستخدمين، و`<#CHANNEL_ID>` للقنوات، و`<@&ROLE_ID>` للأدوار. لا تستخدم صيغة إشارة اللقب القديمة `<@!USER_ID>`.

    يُهيأ `requireMention` لكل خادم/قناة (`channels.discord.guilds...`).
    يُسقط `ignoreOtherMentions` اختياريًا الرسائل التي تشير إلى مستخدم/دور آخر وليس إلى البوت (باستثناء @everyone/@here).

    الرسائل المباشرة الجماعية:

    - الافتراضي: متجاهلة (`dm.groupEnabled=false`)
    - قائمة سماح اختيارية عبر `dm.groupChannels` (معرفات قنوات أو slugs)

  </Tab>
</Tabs>

### التوجيه القائم على الأدوار للعملاء

استخدم `bindings[].match.roles` لتوجيه أعضاء خادم Discord إلى وكلاء مختلفين حسب معرّف الدور. تقبل الارتباطات المستندة إلى الأدوار معرّفات الأدوار فقط، وتُقيَّم بعد ارتباطات النظير أو النظير الأصل وقبل ارتباطات الخادم فقط. إذا عيّن ارتباطٌ ما حقول مطابقة أخرى أيضًا (مثل `peer` + `guildId` + `roles`)، فيجب أن تتطابق كل الحقول المضبوطة.

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

- القيمة الافتراضية لـ `commands.native` هي `"auto"`، وهي مفعّلة لـ Discord.
- تجاوز لكل قناة: `channels.discord.commands.native`.
- يتخطى `commands.native=false` تسجيل أوامر Discord بشرطة مائلة وتنظيفها أثناء بدء التشغيل. قد تبقى الأوامر المسجلة سابقًا مرئية في Discord إلى أن تزيلها من تطبيق Discord.
- يستخدم تفويض الأوامر الأصلية قوائم السماح/السياسات نفسها في Discord مثل معالجة الرسائل العادية.
- قد تبقى الأوامر مرئية في واجهة Discord للمستخدمين غير المصرّح لهم؛ لكن التنفيذ يظل يفرض تفويض OpenClaw ويعيد "غير مصرّح".

راجع [الأوامر بشرطة مائلة](/ar/tools/slash-commands) للاطلاع على كتالوج الأوامر وسلوكها.

إعدادات الأمر بشرطة مائلة الافتراضية:

- `ephemeral: true`

## تفاصيل الميزات

<AccordionGroup>
  <Accordion title="وسوم الردود والردود الأصلية">
    يدعم Discord وسوم الردود في مخرجات الوكيل:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    تتحكم بها `channels.discord.replyToMode`:

    - `off` (افتراضي)
    - `first`
    - `all`
    - `batched`

    ملاحظة: يعطّل `off` سَلسَلة الردود الضمنية. تظل وسوم `[[reply_to_*]]` الصريحة محترمة.
    يرفق `first` دائمًا مرجع الرد الأصلي الضمني بأول رسالة Discord صادرة في الدور.
    يرفق `batched` مرجع الرد الأصلي الضمني الخاص بـ Discord فقط عندما يكون
    الحدث الوارد دفعة مؤجلة من رسائل متعددة. يكون هذا مفيدًا
    عندما تريد الردود الأصلية أساسًا للمحادثات المتدفقة الملتبسة، وليس لكل
    دور برسالة واحدة.

    تُعرض معرّفات الرسائل في السياق/السجل حتى تتمكن الوكلاء من استهداف رسائل محددة.

  </Accordion>

  <Accordion title="معاينات الروابط">
    ينشئ Discord تضمينات روابط غنية لعناوين URL افتراضيًا. يثبط OpenClaw هذه التضمينات المُنشأة في رسائل Discord الصادرة افتراضيًا، لذلك تبقى عناوين URL التي يرسلها الوكيل روابط عادية ما لم تختر تفعيلها:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    عيّن `channels.discord.accounts.<id>.suppressEmbeds` لتجاوز حساب واحد. يمكن أيضًا لإرسالات أداة الرسائل الخاصة بالوكيل تمرير `suppressEmbeds: false` لرسالة واحدة. لا تُثبَّط حمولات `embeds` الصريحة في Discord بإعداد معاينة الروابط الافتراضي.

  </Accordion>

  <Accordion title="معاينة البث المباشر">
    يمكن لـ OpenClaw بث مسودات الردود بإرسال رسالة مؤقتة وتحريرها مع وصول النص. تقبل `channels.discord.streaming` القيم `off` | `partial` | `block` | `progress` (افتراضي). يحتفظ `progress` بمسودة حالة واحدة قابلة للتحرير ويحدّثها بتقدم الأدوات حتى التسليم النهائي؛ وتكون تسمية البدء المشتركة سطرًا متحركًا، لذلك تمرّ خارج العرض مثل البقية بعد ظهور قدر كافٍ من العمل. `streamMode` اسم بديل قديم في وقت التشغيل. شغّل `openclaw doctor --fix` لإعادة كتابة التكوين المحفوظ إلى المفتاح القياسي.

    عيّن `channels.discord.streaming.mode` إلى `off` لتعطيل تحريرات معاينة Discord. إذا تم تفعيل بث كتل Discord صراحةً، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: true,
          commentary: false,
        },
      },
    },
  },
}
```

    - يحرّر `partial` رسالة معاينة واحدة مع وصول الرموز.
    - يصدر `block` مقاطع بحجم المسودة (استخدم `draftChunk` لضبط الحجم ونقاط الفصل، مع تقييدها بـ `textChunkLimit`).
    - تلغي النهائيات الخاصة بالوسائط والأخطاء والردود الصريحة تحريرات المعاينة المعلقة.
    - يتحكم `streaming.preview.toolProgress` (افتراضيًا `true`) في ما إذا كانت تحديثات الأدوات/التقدم تعيد استخدام رسالة المعاينة.
    - تُعرض صفوف الأدوات/التقدم كرمز تعبيري مضغوط + عنوان + تفصيل عند توفرها، مثل `🛠️ Bash: run tests` أو `🔎 Web Search: for "query"`.
    - يتيح `streaming.progress.commentary` (افتراضيًا `false`) إدراج نص تعليق/تمهيد المساعد في مسودة التقدم المؤقتة. يُنظَّف التعليق قبل العرض، ويبقى عابرًا، ولا يغير تسليم الإجابة النهائية.
    - يتحكم `streaming.progress.maxLineChars` في ميزانية معاينة التقدم لكل سطر. يُختصر النثر عند حدود الكلمات؛ وتحتفظ تفاصيل الأوامر والمسارات باللواحق المفيدة.
    - يتحكم `streaming.preview.commandText` / `streaming.progress.commandText` في تفاصيل الأوامر/التنفيذ في أسطر التقدم المضغوطة: `raw` (افتراضي) أو `status` (تسمية الأداة فقط).

    أخفِ نص الأمر/التنفيذ الخام مع الإبقاء على أسطر التقدم المضغوطة:

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

    بث المعاينة نصي فقط؛ تعود ردود الوسائط إلى التسليم العادي. عند تفعيل بث `block` صراحةً، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

  </Accordion>

  <Accordion title="السجل والسياق وسلوك السلاسل">
    سياق سجل الخادم:

    - القيمة الافتراضية لـ `channels.discord.historyLimit` هي `20`
    - الرجوع الاحتياطي: `messages.groupChat.historyLimit`
    - يعطّل `0`

    عناصر التحكم في سجل الرسائل المباشرة:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    سلوك السلاسل:

    - تُوجّه سلاسل Discord كجلسات قناة وترث تكوين القناة الأصل ما لم يتم تجاوزه.
    - ترث جلسات السلاسل اختيار `/model` على مستوى جلسة القناة الأصل كخيار احتياطي للنموذج فقط؛ تظل اختيارات `/model` المحلية للسلسلة لها الأولوية، ولا يُنسخ سجل نص القناة الأصل ما لم يتم تفعيل وراثة النص.
    - يتيح `channels.discord.thread.inheritParent` (افتراضيًا `false`) للسلاسل التلقائية الجديدة البذر من نص القناة الأصل. توجد التجاوزات لكل حساب تحت `channels.discord.accounts.<id>.thread.inheritParent`.
    - يمكن لتفاعلات أداة الرسائل حل أهداف الرسائل المباشرة `user:<id>`.
    - يُحافظ على `guilds.<guild>.channels.<channel>.requireMention: false` أثناء الرجوع الاحتياطي لتنشيط مرحلة الرد.

    تُحقن موضوعات القنوات كسياق **غير موثوق**. تتحكم قوائم السماح في من يمكنه تشغيل الوكيل، وليست حدًا كاملًا لتنقيح السياق التكميلي.

  </Accordion>

  <Accordion title="جلسات مرتبطة بالسلاسل للوكلاء الفرعيين">
    يمكن لـ Discord ربط سلسلة بهدف جلسة بحيث تستمر رسائل المتابعة في تلك السلسلة في التوجيه إلى الجلسة نفسها (بما في ذلك جلسات الوكلاء الفرعيين).

    الأوامر:

    - `/focus <target>` اربط السلسلة الحالية/الجديدة بهدف وكيل فرعي/جلسة
    - `/unfocus` أزل ارتباط السلسلة الحالية
    - `/agents` اعرض عمليات التشغيل النشطة وحالة الارتباط
    - `/session idle <duration|off>` افحص/حدّث إلغاء التركيز التلقائي عند الخمول للارتباطات المركزة
    - `/session max-age <duration|off>` افحص/حدّث الحد الأقصى الصارم للعمر للارتباطات المركزة

    التكوين:

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

    - يعيّن `session.threadBindings.*` الافتراضات العامة.
    - يتجاوز `channels.discord.threadBindings.*` سلوك Discord.
    - يتحكم `spawnSessions` في إنشاء/ربط السلاسل تلقائيًا لـ `sessions_spawn({ thread: true })` وعمليات إنشاء سلاسل ACP. الافتراضي: `true`.
    - يتحكم `defaultSpawnContext` في سياق الوكيل الفرعي الأصلي لعمليات الإنشاء المرتبطة بالسلاسل. الافتراضي: `"fork"`.
    - تُرحَّل المفاتيح المهملة `spawnSubagentSessions`/`spawnAcpSessions` بواسطة `openclaw doctor --fix`.
    - إذا كانت ارتباطات السلاسل معطلة لحساب ما، فلن تتوفر `/focus` وعمليات ارتباط السلاسل ذات الصلة.

    راجع [الوكلاء الفرعيون](/ar/tools/subagents)، و[وكلاء ACP](/ar/tools/acp-agents)، و[مرجع التكوين](/ar/gateway/configuration-reference).

  </Accordion>

  <Accordion title="ارتباطات قنوات ACP الدائمة">
    لمساحات عمل ACP مستقرة "دائمة التشغيل"، اضبط ارتباطات ACP مكتوبة في المستوى الأعلى تستهدف محادثات Discord.

    مسار التكوين:

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

    - يربط `/acp spawn codex --bind here` القناة أو السلسلة الحالية في مكانها ويحافظ على الرسائل المستقبلية في جلسة ACP نفسها. ترث رسائل السلاسل ارتباط القناة الأصل.
    - في قناة أو سلسلة مرتبطة، يعيد `/new` و`/reset` ضبط جلسة ACP نفسها في مكانها. يمكن لارتباطات السلاسل المؤقتة تجاوز حل الهدف أثناء نشاطها.
    - يتحكم `spawnSessions` في إنشاء/ربط السلاسل الفرعية عبر `--thread auto|here`.

    راجع [وكلاء ACP](/ar/tools/acp-agents) لتفاصيل سلوك الارتباط.

  </Accordion>

  <Accordion title="إشعارات التفاعل">
    وضع إشعارات التفاعل لكل خادم:

    - `off`
    - `own` (افتراضي)
    - `all`
    - `allowlist` (يستخدم `guilds.<id>.users`)

    تُحوَّل أحداث التفاعل إلى أحداث نظام وتُرفق بجلسة Discord الموجّهة.

  </Accordion>

  <Accordion title="تفاعلات الإقرار">
    يرسل `ackReaction` رمزًا تعبيريًا للإقرار أثناء معالجة OpenClaw لرسالة واردة.

    ترتيب الحل:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - الرجوع الاحتياطي إلى رمز تعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يقبل Discord رموز unicode التعبيرية أو أسماء الرموز التعبيرية المخصصة.
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="كتابات التكوين">
    تكون كتابات التكوين التي تبدأها القناة مفعّلة افتراضيًا.

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
    وجّه حركة WebSocket الخاصة بـ Gateway في Discord وعمليات بحث REST عند بدء التشغيل (معرّف التطبيق + حل قائمة السماح) عبر وكيل HTTP(S) باستخدام `channels.discord.proxy`.

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
    - تتم مطابقة أسماء عرض الأعضاء بالاسم/المعرّف النصي فقط عندما تكون `channels.discord.dangerouslyAllowNameMatching: true`
    - تستخدم عمليات البحث معرّف الرسالة الأصلي وتكون مقيّدة بنافذة زمنية
    - إذا فشل البحث، تُعامل الرسائل الممرّرة عبر الوكيل كرسائل بوت وتُسقط ما لم يكن `allowBots=true`

  </Accordion>

  <Accordion title="الأسماء البديلة للإشارات الصادرة">
    استخدم `mentionAliases` عندما تحتاج الوكلاء إلى إشارات صادرة حتمية لمستخدمي Discord المعروفين. المفاتيح هي المعالجات من دون بادئة `@`؛ والقيم هي معرّفات مستخدمي Discord. تُترك المعالجات غير المعروفة، و`@everyone`، و`@here`، والإشارات داخل أسطر كود Markdown كما هي من دون تغيير.

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
    تُطبَّق تحديثات الحضور عند تعيين حقل حالة أو نشاط، أو عند تمكين الحضور التلقائي.

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

    يربط الحضور التلقائي توفر وقت التشغيل بحالة Discord: سليم => متصل، متدهور أو غير معروف => خامل، مستنفد أو غير متاح => عدم الإزعاج. تجاوزات النص الاختيارية:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (يدعم العنصر النائب `{reason}`)

  </Accordion>

  <Accordion title="الموافقات في Discord">
    يدعم Discord معالجة الموافقات المعتمدة على الأزرار في الرسائل المباشرة، ويمكنه اختياريًا نشر مطالبات الموافقة في القناة الأصلية.

    مسار الإعداد:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختياري؛ يعود إلى `commands.ownerAllowFrom` عندما يكون ذلك ممكنًا)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
    - `agentFilter`، `sessionFilter`، `cleanupAfterResolve`

    يفعّل Discord موافقات التنفيذ الأصلية تلقائيًا عندما تكون `enabled` غير معيّنة أو `"auto"` ويمكن حل موافق واحد على الأقل، إما من `execApprovals.approvers` أو من `commands.ownerAllowFrom`. لا يستنتج Discord موافقي التنفيذ من `allowFrom` الخاصة بالقناة، أو `dm.allowFrom` القديمة، أو `defaultTo` الخاصة بالرسائل المباشرة. عيّن `enabled: false` لتعطيل Discord صراحة كعميل موافقة أصلي.

    للأوامر الجماعية الحساسة المخصصة للمالك فقط مثل `/diagnostics` و`/export-trajectory`، يرسل OpenClaw مطالبات الموافقة والنتائج النهائية بشكل خاص. يحاول Discord DM أولًا عندما يكون لدى المالك المستدعي مسار مالك في Discord؛ وإذا لم يكن ذلك متاحًا، يعود إلى أول مسار مالك متاح من `commands.ownerAllowFrom`، مثل Telegram.

    عندما تكون `target` هي `channel` أو `both`، تكون مطالبة الموافقة مرئية في القناة. يستطيع الموافقون المحلولون فقط استخدام الأزرار؛ ويتلقى المستخدمون الآخرون رفضًا عابرًا. تتضمن مطالبات الموافقة نص الأمر، لذلك لا تفعّل تسليم القناة إلا في القنوات الموثوقة. إذا تعذر اشتقاق معرّف القناة من مفتاح الجلسة، يعود OpenClaw إلى التسليم عبر الرسائل المباشرة.

    يعرض Discord أيضًا أزرار الموافقة المشتركة التي تستخدمها قنوات الدردشة الأخرى. يضيف محوّل Discord الأصلي أساسًا توجيه الرسائل المباشرة للموافقين والتوزيع على القنوات.
    عند وجود هذه الأزرار، تكون هي تجربة المستخدم الأساسية للموافقة؛ ويجب على OpenClaw
    ألا يضمّن أمر `/approve` يدويًا إلا عندما تفيد نتيجة الأداة بأن
    موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.
    إذا لم يكن وقت تشغيل الموافقة الأصلية في Discord نشطًا، يبقي OpenClaw
    مطالبة `/approve <id> <decision>` الحتمية المحلية مرئية. إذا كان
    وقت التشغيل نشطًا ولكن تعذر تسليم بطاقة أصلية إلى أي هدف،
    يرسل OpenClaw إشعار رجوع في الدردشة نفسها مع أمر `/approve`
    الدقيق من الموافقة المعلقة.

    تتبع مصادقة Gateway وحل الموافقات عقد عميل Gateway المشترك (تُحل معرّفات `plugin:` عبر `plugin.approval.resolve`؛ وتُحل المعرّفات الأخرى عبر `exec.approval.resolve`). تنتهي صلاحية الموافقات بعد 30 دقيقة افتراضيًا.

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

يقبل إجراء `event-create` معامل `image` اختياريًا (عنوان URL أو مسار ملف محلي) لتعيين صورة غلاف الحدث المجدول.

توجد بوابات الإجراءات تحت `channels.discord.actions.*`.

سلوك البوابة الافتراضي:

| مجموعة الإجراءات                                                                                                                                                             | الافتراضي  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| التفاعلات، الرسائل، السلاسل، التثبيتات، الاستطلاعات، البحث، معلومات الأعضاء، معلومات الأدوار، معلومات القنوات، القنوات، حالة الصوت، الأحداث، الملصقات، تحميلات الرموز التعبيرية، تحميلات الملصقات، الأذونات | مفعّل  |
| الأدوار                                                                                                                                                                    | معطّل |
| الإشراف                                                                                                                                                               | معطّل |
| الحضور                                                                                                                                                                 | معطّل |

## واجهة مستخدم المكونات v2

يستخدم OpenClaw مكونات Discord v2 لموافقات التنفيذ وعلامات السياقات المتقاطعة. يمكن لإجراءات رسائل Discord أيضًا قبول `components` لواجهة مستخدم مخصصة (متقدم؛ يتطلب إنشاء حمولة مكوّن عبر أداة discord)، بينما تظل `embeds` القديمة متاحة ولكن لا يُنصح بها.

- يعيّن `channels.discord.ui.components.accentColor` لون التمييز المستخدم في حاويات مكوّنات Discord (hex).
- عيّنه لكل حساب باستخدام `channels.discord.accounts.<id>.ui.components.accentColor`.
- يتحكم `channels.discord.agentComponents.ttlMs` في مدة بقاء استدعاءات مكوّنات Discord المرسلة مسجلة (الافتراضي `1800000`، والحد الأقصى `86400000`). عيّنه لكل حساب باستخدام `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- يتم تجاهل `embeds` عند وجود مكونات v2.
- يتم كتم معاينات عناوين URL العادية افتراضيًا. عيّن `suppressEmbeds: false` على إجراء رسالة عندما ينبغي توسيع رابط صادر واحد.

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
3. ادعُ البوت بنطاقي `bot` و`applications.commands`.
4. امنح أذونات Connect وSpeak وSend Messages وRead Message History في القناة الصوتية المستهدفة.
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

مثال على الانضمام التلقائي:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.5",
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
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

ملاحظات:

- يتجاوز `voice.tts` إعداد `messages.tts` لتشغيل صوت `stt-tts` فقط. تستخدم أوضاع الوقت الفعلي `voice.realtime.speakerVoice`.
- يتحكم `voice.mode` في مسار المحادثة. الافتراضي هو `agent-proxy`: تتولى واجهة صوتية في الوقت الفعلي توقيت الأدوار، والمقاطعة، والتشغيل، وتفوّض العمل الجوهري إلى وكيل OpenClaw الموجّه عبر `openclaw_agent_consult`، وتتعامل مع النتيجة كما لو كانت مطالبة Discord مكتوبة من ذلك المتحدث. يحافظ `stt-tts` على تدفق STT الدفعي الأقدم بالإضافة إلى TTS. يتيح `bidi` للنموذج في الوقت الفعلي التحاور مباشرة مع إتاحة `openclaw_agent_consult` لعقل OpenClaw.
- يتحكم `voice.agentSession` في محادثة OpenClaw التي تستقبل أدوار الصوت. اتركه غير مضبوط لجلسة قناة الصوت نفسها، أو اضبط `{ mode: "target", target: "channel:<text-channel-id>" }` لجعل قناة الصوت تعمل كامتداد للميكروفون/السماعة لجلسة قناة نصية موجودة في Discord مثل `#maintainers`.
- يتجاوز `voice.model` عقل وكيل OpenClaw لاستجابات صوت Discord والاستشارات في الوقت الفعلي. اتركه غير مضبوط ليرث نموذج الوكيل الموجّه. وهو منفصل عن `voice.realtime.model`.
- يتيح `voice.followUsers` للبوت الانضمام إلى صوت Discord، والتنقل، والمغادرة مع مستخدمين محددين. راجع [متابعة المستخدمين في الصوت](#follow-users-in-voice) لقواعد السلوك والأمثلة.
- يوجّه `agent-proxy` الكلام عبر `discord-voice`، مما يحافظ على تفويض المالك/الأدوات المعتاد للمتحدث والجلسة الهدف، لكنه يخفي أداة الوكيل `tts` لأن صوت Discord يملك التشغيل. افتراضياً، يمنح `agent-proxy` الاستشارة وصولاً كاملاً إلى الأدوات بما يعادل المالك للمتحدثين المالكين (`voice.realtime.toolPolicy: "owner"`) ويفضل بقوة استشارة وكيل OpenClaw قبل الإجابات الجوهرية (`voice.realtime.consultPolicy: "always"`). في وضع `always` الافتراضي هذا، لا تنطق طبقة الوقت الفعلي كلاماً تمهيدياً تلقائياً قبل جواب الاستشارة؛ بل تلتقط الكلام وتنسخه، ثم تنطق جواب OpenClaw الموجّه. إذا اكتملت عدة إجابات استشارة مفروضة بينما لا يزال Discord يشغل الإجابة الأولى، تُصف إجابات الكلام المطابق اللاحقة حتى يصبح التشغيل خاملاً بدلاً من استبدال الكلام في منتصف الجملة.
- في وضع `stt-tts`، يستخدم STT `tools.media.audio`؛ ولا يؤثر `voice.model` في النسخ.
- في أوضاع الوقت الفعلي، تضبط `voice.realtime.provider` و`voice.realtime.model` و`voice.realtime.speakerVoice` جلسة الصوت في الوقت الفعلي. لاستخدام OpenAI Realtime 2 مع عقل Codex، استخدم `voice.realtime.model: "gpt-realtime-2"` و`voice.model: "openai/gpt-5.5"`.
- تتضمن أوضاع الصوت في الوقت الفعلي افتراضياً ملفات ملفات التعريف الصغيرة `IDENTITY.md` و`USER.md` و`SOUL.md` في تعليمات موفر الوقت الفعلي، بحيث تحافظ الأدوار المباشرة السريعة على الهوية نفسها، وتأصيل المستخدم، والشخصية مثل وكيل OpenClaw الموجّه. اضبط `voice.realtime.bootstrapContextFiles` على مجموعة فرعية لتخصيص ذلك، أو `[]` لتعطيله. تقتصر ملفات تمهيد الوقت الفعلي المدعومة على ملفات التعريف هذه؛ ويبقى `AGENTS.md` في سياق الوكيل العادي. لا يحل سياق ملف التعريف المحقون محل `openclaw_agent_consult` لعمل مساحة العمل، أو الحقائق الحالية، أو البحث في الذاكرة، أو الإجراءات المدعومة بالأدوات.
- في وضع OpenAI `agent-proxy` في الوقت الفعلي، اضبط `voice.realtime.requireWakeName: true` لإبقاء صوت Discord في الوقت الفعلي صامتاً حتى يبدأ النص المنسوخ أو ينتهي باسم إيقاظ. يجب أن تكون أسماء الإيقاظ المضبوطة كلمة أو كلمتين. إذا لم يكن `voice.realtime.wakeNames` مضبوطاً، يستخدم OpenClaw `name` للوكيل الموجّه مع `OpenClaw`، مع الرجوع إلى معرّف الوكيل مع `OpenClaw`. تعطل بوابة اسم الإيقاظ الاستجابة التلقائية من موفر الوقت الفعلي، وتوجّه الأدوار المقبولة عبر مسار استشارة وكيل OpenClaw، وتعطي إقراراً صوتياً قصيراً عند التعرف على اسم إيقاظ في البداية من النسخ الجزئي قبل وصول النص النهائي.
- يقبل موفر OpenAI في الوقت الفعلي أسماء أحداث Realtime 2 الحالية والأسماء البديلة القديمة المتوافقة مع Codex لأحداث الصوت الناتج والنص المنسوخ، بحيث يمكن أن تنحرف لقطات الموفر المتوافقة دون إسقاط صوت المساعد.
- يتحكم `voice.realtime.bargeIn` فيما إذا كانت أحداث بدء المتحدث في Discord تقاطع التشغيل النشط في الوقت الفعلي. إذا لم يُضبط، فإنه يتبع إعداد مقاطعة صوت الإدخال لدى موفر الوقت الفعلي.
- يتحكم `voice.realtime.minBargeInAudioEndMs` في الحد الأدنى لمدة تشغيل المساعد قبل أن يؤدي التداخل في OpenAI في الوقت الفعلي إلى اقتطاع الصوت. الافتراضي: `250`. اضبطه على `0` للمقاطعة الفورية في الغرف منخفضة الصدى، أو ارفعه لإعدادات السماعات كثيرة الصدى.
- لاستخدام صوت OpenAI عند التشغيل في Discord، اضبط `voice.tts.provider: "openai"` واختر صوت تحويل النص إلى كلام ضمن `voice.tts.providers.openai.speakerVoice`. يعد `cedar` خياراً جيداً بصوت ذكوري على نموذج OpenAI TTS الحالي.
- تنطبق تجاوزات `systemPrompt` الخاصة بقنوات Discord على أدوار نصوص الصوت المنسوخة لتلك القناة الصوتية.
- تستمد أدوار نصوص الصوت المنسوخة حالة المالك من `allowFrom` في Discord (أو `dm.allowFrom`) للأوامر وإجراءات القنوات المحكومة بالمالك. وتتبع رؤية أدوات الوكيل سياسة الأدوات المضبوطة للجلسة الموجّهة.
- صوت Discord اختياري في الإعدادات النصية فقط؛ اضبط `channels.discord.voice.enabled=true` (أو أبقِ كتلة `channels.discord.voice` موجودة) لتفعيل أوامر `/vc`، ووقت تشغيل الصوت، وهدف Gateway `GuildVoiceStates`.
- يمكن لـ `channels.discord.intents.voiceStates` تجاوز اشتراك هدف حالة الصوت صراحة. اتركه غير مضبوط ليتبع الهدف التفعيل الفعلي للصوت.
- إذا كان لدى `voice.autoJoin` عدة إدخالات للنقابة نفسها، ينضم OpenClaw إلى آخر قناة مضبوطة لتلك النقابة.
- `voice.allowedChannels` قائمة سماح اختيارية للإقامة. اتركها غير مضبوطة للسماح لـ `/vc join` بالدخول إلى أي قناة صوت Discord مصرح بها. عند ضبطها، تُقيّد `/vc join`، والانضمام التلقائي عند بدء التشغيل، وتنقلات حالة صوت البوت إلى إدخالات `{ guildId, channelId }` المدرجة. اضبطها على مصفوفة فارغة لمنع كل انضمامات صوت Discord. إذا نقل Discord البوت إلى خارج قائمة السماح، يغادر OpenClaw تلك القناة ويعيد الانضمام إلى هدف الانضمام التلقائي المضبوط عندما يتوفر.
- يمرر `voice.daveEncryption` و`voice.decryptionFailureTolerance` إلى خيارات انضمام `@discordjs/voice`.
- افتراضيات `@discordjs/voice` هي `daveEncryption=true` و`decryptionFailureTolerance=24` إذا لم تُضبط.
- يستخدم OpenClaw ترميز `libopus-wasm` المضمّن لاستقبال صوت Discord وتشغيل PCM الخام في الوقت الفعلي. وهو يشحن بنية WebAssembly مثبتة من libopus ولا يتطلب إضافات opus أصلية.
- يتحكم `voice.connectTimeoutMs` في انتظار Ready الأولي لـ `@discordjs/voice` لمحاولات `/vc join` والانضمام التلقائي. الافتراضي: `30000`.
- يتحكم `voice.reconnectGraceMs` في مدة انتظار OpenClaw لجلسة صوت مفصولة كي تبدأ بإعادة الاتصال قبل تدميرها. الافتراضي: `15000`.
- في وضع `stt-tts`، لا يتوقف تشغيل الصوت فقط لأن مستخدماً آخر بدأ الكلام. لتجنب حلقات التغذية الراجعة، يتجاهل OpenClaw التقاط الصوت الجديد أثناء تشغيل TTS؛ تحدث بعد انتهاء التشغيل للدور التالي. تمرر أوضاع الوقت الفعلي بدايات المتحدث كإشارات تداخل إلى موفر الوقت الفعلي.
- في أوضاع الوقت الفعلي، يمكن أن يبدو صدى السماعات داخل ميكروفون مفتوح كتداخل ويقاطع التشغيل. لغرف Discord كثيرة الصدى، اضبط `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` لمنع OpenAI من المقاطعة التلقائية عند صوت الإدخال. أضف `voice.realtime.bargeIn: true` إذا كنت لا تزال تريد أن تقاطع أحداث بدء المتحدث في Discord التشغيل النشط. يتجاهل جسر OpenAI في الوقت الفعلي اقتطاعات التشغيل الأقصر من `voice.realtime.minBargeInAudioEndMs` باعتبارها صدى/ضجيجاً مرجحاً، ويسجلها كمتخطاة بدلاً من مسح تشغيل Discord.
- يتحكم `voice.captureSilenceGraceMs` في مدة انتظار OpenClaw بعد أن يبلغ Discord عن توقف المتحدث قبل إنهاء ذلك المقطع الصوتي لـ STT. الافتراضي: `2000`؛ ارفع هذه القيمة إذا كان Discord يقسم التوقفات الطبيعية إلى نصوص جزئية متقطعة.
- عندما يكون ElevenLabs هو موفر TTS المحدد، يستخدم تشغيل صوت Discord بث TTS ويبدأ من تدفق استجابة الموفر. الموفرون الذين لا يدعمون البث يرجعون إلى مسار الملف المؤقت المركّب.
- يراقب OpenClaw أيضاً فشل فك تشفير الاستقبال ويتعافى تلقائياً بمغادرة قناة الصوت وإعادة الانضمام إليها بعد تكرار حالات الفشل في نافذة قصيرة.
- إذا أظهرت سجلات الاستقبال مراراً `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` بعد التحديث، فاجمع تقرير تبعيات وسجلات. يتضمن سطر `@discordjs/voice` المضمّن إصلاح الحشو upstream من PR #11449 في discord.js، والذي أغلق issue #11419 في discord.js.
- أحداث استقبال `The operation was aborted` متوقعة عندما ينهي OpenClaw مقطع متحدث ملتقطاً؛ فهي تشخيصات مطولة وليست تحذيرات.
- تتضمن سجلات صوت Discord المطولة معاينة محدودة من سطر واحد لنص STT المنسوخ لكل مقطع متحدث مقبول، بحيث يعرض التصحيح جانب المستخدم وجانب رد الوكيل دون تفريغ نص منسوخ غير محدود.
- في وضع `agent-proxy`، يتجاوز الرجوع إلى الاستشارة المفروضة أجزاء النص المنسوخ التي تبدو غير مكتملة، مثل النص المنتهي بـ `...` أو رابط لاحق مثل `and`، بالإضافة إلى الخواتيم الواضحة غير القابلة للتنفيذ مثل “be right back” أو “bye”. تعرض السجلات `forced agent consult skipped reason=...` عندما يمنع ذلك إجابة قديمة في الصف.

### متابعة المستخدمين في الصوت

استخدم `voice.followUsers` عندما تريد أن يبقى بوت صوت Discord مع مستخدم واحد أو أكثر معروفين في Discord بدلاً من الانضمام إلى قناة ثابتة عند بدء التشغيل أو انتظار `/vc join`.

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        followUsersEnabled: true,
        followUsers: ["discord:123456789012345678"],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
      },
    },
  },
}
```

السلوك:

- يقبل `followUsers` معرّفات مستخدمي Discord الخام وقيم `discord:<id>`. يطبّع OpenClaw كلا الشكلين قبل مطابقة أحداث حالة الصوت.
- تكون القيمة الافتراضية لـ `followUsersEnabled` هي `true` عند ضبط `followUsers`. اضبطها على `false` للاحتفاظ بالقائمة المحفوظة مع إيقاف المتابعة الصوتية التلقائية.
- عندما ينضم مستخدم متابَع إلى قناة صوت مسموح بها، ينضم OpenClaw إلى تلك القناة. عندما ينتقل المستخدم، ينتقل OpenClaw معه. عندما ينقطع المستخدم المتابَع النشط، يغادر OpenClaw.
- إذا كان عدة مستخدمين متابَعين في النقابة نفسها وغادر المستخدم المتابَع النشط، ينتقل OpenClaw إلى قناة مستخدم متابَع آخر متعقَّب قبل مغادرة النقابة. إذا انتقل عدة مستخدمين متابَعين في الوقت نفسه، يفوز أحدث حدث حالة صوت مرصود.
- لا يزال `allowedChannels` مطبقاً. يُتجاهل المستخدم المتابَع في قناة غير مسموح بها، وتنتقل الجلسة المملوكة للمتابعة إلى مستخدم متابَع آخر أو تغادر.
- يوفق OpenClaw أحداث حالة الصوت الفائتة عند بدء التشغيل وعلى فاصل زمني محدود. تأخذ الموفقة عينات من النقابات المضبوطة وتحد من عمليات بحث REST في كل تشغيل، لذلك قد تحتاج قوائم `followUsers` الكبيرة جداً إلى أكثر من فاصل واحد للتقارب.
- إذا نقل Discord أو مسؤول البوت أثناء متابعته لمستخدم، يعيد OpenClaw بناء جلسة الصوت ويحافظ على ملكية المتابعة عندما تكون الوجهة مسموحاً بها. إذا نُقل البوت إلى خارج `allowedChannels`، يغادر OpenClaw ويعيد الانضمام إلى الهدف المضبوط عند وجوده.
- قد تغادر استعادة استقبال DAVE القناة نفسها وتعيد الانضمام إليها بعد تكرار حالات فشل فك التشفير. تحتفظ الجلسات المملوكة للمتابعة بملكية المتابعة عبر مسار الاستعادة هذا، لذلك يظل انقطاع مستخدم متابَع لاحقاً يؤدي إلى مغادرة القناة.

اختر بين أوضاع الانضمام:

- استخدم `followUsers` للإعدادات الشخصية أو إعدادات المشغل حيث يجب أن يكون البوت تلقائياً في الصوت عندما تكون أنت فيه.
- استخدم `autoJoin` لبوتات الغرف الثابتة التي يجب أن تكون موجودة حتى عندما لا يكون أي مستخدم متعقَّب في الصوت.
- استخدم `/vc join` للانضمامات لمرة واحدة أو للغرف التي سيكون فيها الحضور الصوتي التلقائي مفاجئاً.

ترميز صوت Discord:

- تعرض سجلات استقبال الصوت `discord voice: opus decoder: libopus-wasm`.
- يشفر التشغيل في الوقت الفعلي صوت PCM خامًا ستيريو بتردد 48 kHz إلى Opus باستخدام حزمة `libopus-wasm` المضمّنة نفسها قبل تسليم الحزم إلى `@discordjs/voice`.
- يحوّل تشغيل الملفات وتدفقات المزوّد إلى PCM خام ستيريو بتردد 48 kHz باستخدام ffmpeg، ثم يستخدم `libopus-wasm` لتدفق حزم Opus المرسلة إلى Discord.

مسار STT مع TTS:

- يتم تحويل التقاط PCM من Discord إلى ملف WAV مؤقت.
- يتولى `tools.media.audio` معالجة STT، مثل `openai/gpt-4o-mini-transcribe`.
- تُرسل النسخة النصية عبر مدخل Discord والتوجيه بينما يعمل LLM الخاص بالاستجابة بسياسة إخراج صوتي تخفي أداة الوكيل `tts` وتطلب نصًا مُعادًا، لأن صوت Discord يملك تشغيل TTS النهائي.
- عند ضبط `voice.model`، فإنه يتجاوز فقط LLM الخاص بالاستجابة لهذه النوبة في قناة الصوت.
- يتم دمج `voice.tts` فوق `messages.tts`؛ يمرر المزوّدون القادرون على البث الصوتي إلى المشغل مباشرة، وإلا فيتم تشغيل ملف الصوت الناتج في القناة المنضم إليها.

مثال جلسة قناة صوتية افتراضية بنمط وكيل وسيط:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai/gpt-5.5",
        followUsersEnabled: true,
        followUsers: ["123456789012345678"],
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

دون كتلة `voice.agentSession`، تحصل كل قناة صوتية على جلسة OpenClaw موجّهة خاصة بها. على سبيل المثال، يتحدث `/vc join channel:234567890123456789` إلى الجلسة الخاصة بقناة صوت Discord تلك. نموذج الوقت الفعلي هو واجهة الصوت فقط؛ أما الطلبات الجوهرية فتُسلّم إلى وكيل OpenClaw المُعد. إذا أنتج نموذج الوقت الفعلي نسخة نصية نهائية دون استدعاء أداة الاستشارة، يفرض OpenClaw الاستشارة كمسار احتياطي بحيث يظل السلوك الافتراضي مشابهًا للتحدث إلى الوكيل.

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
          providers: {
            openai: {
              model: "gpt-4o-mini-tts",
              speakerVoice: "cedar",
            },
          },
        },
      },
    },
  },
}
```

مثال ثنائي الاتجاه في الوقت الفعلي:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
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
        model: "openai/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
        },
      },
    },
  },
}
```

في وضع `agent-proxy` ينضم البوت إلى قناة الصوت المُعدّة، لكن نوبات وكيل OpenClaw تستخدم الجلسة والوكيل الموجّهين العاديين للقناة الهدف. تتحدث جلسة الصوت في الوقت الفعلي بالنتيجة المُعادة داخل قناة الصوت. لا يزال بإمكان الوكيل المشرف استخدام أدوات الرسائل العادية وفقًا لسياسة أدواته، بما في ذلك إرسال رسالة Discord منفصلة إذا كان ذلك هو الإجراء الصحيح.

أثناء نشاط تشغيل OpenClaw مفوض، تُعامل النسخ النصية الصوتية الجديدة من Discord كتحكم مباشر في التشغيل قبل بدء نوبة وكيل أخرى. تُصنّف عبارات مثل "الحالة"، أو "ألغِ ذلك"، أو "استخدم الإصلاح الأصغر"، أو "عند الانتهاء افحص الاختبارات أيضًا" كإدخال حالة، أو إلغاء، أو توجيه، أو متابعة للجلسة النشطة. تُنطق نتائج الحالة، والإلغاء، والتوجيه المقبول، والمتابعة مرة أخرى في قناة الصوت حتى يعرف المتصل ما إذا كان OpenClaw قد عالج الطلب.

أشكال الهدف المفيدة:

- يوجّه `target: "channel:123456789012345678"` عبر جلسة قناة نصية في Discord.
- يُعامل `target: "123456789012345678"` كهدف قناة.
- يوجّه `target: "dm:123456789012345678"` أو `target: "user:123456789012345678"` عبر جلسة الرسائل المباشرة تلك.

مثال OpenAI Realtime كثير الصدى:

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          speakerVoice: "cedar",
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

استخدم هذا عندما يسمع النموذج تشغيل Discord الخاص به عبر ميكروفون مفتوح، لكنك لا تزال تريد مقاطعته بالكلام. يمنع OpenClaw OpenAI من المقاطعة التلقائية عند صوت الإدخال الخام، بينما يسمح `bargeIn: true` لأحداث بدء المتحدث في Discord وصوت المتحدث النشط بالفعل بإلغاء استجابات الوقت الفعلي النشطة قبل أن تصل النوبة الملتقطة التالية إلى OpenAI. تُعامل إشارات المقاطعة المبكرة جدًا ذات `audioEndMs` الأقل من `minBargeInAudioEndMs` كصدى أو ضوضاء محتملة ويتم تجاهلها حتى لا ينقطع النموذج عند أول إطار تشغيل.

سجلات الصوت المتوقعة:

- عند الانضمام: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- عند بدء الوقت الفعلي: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- عند صوت المتحدث: `discord voice: realtime speaker turn opened ...`، و`discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`، و`discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- عند تخطي كلام قديم: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` أو `reason=non-actionable-closing ...`
- عند اكتمال استجابة الوقت الفعلي: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- عند إيقاف/إعادة ضبط التشغيل: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- عند استشارة الوقت الفعلي: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- عند إجابة الوكيل: `discord voice: agent turn answer ...`
- عند وضع الكلام المطابق في قائمة الانتظار: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`، متبوعًا بـ `discord voice: realtime exact speech dequeued reason=player-idle ...`
- عند اكتشاف المقاطعة: `discord voice: realtime barge-in detected source=speaker-start ...` أو `discord voice: realtime barge-in detected source=active-speaker-audio ...`، متبوعًا بـ `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- عند مقاطعة الوقت الفعلي: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`، متبوعًا إما بـ `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` أو `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- عند تجاهل الصدى/الضوضاء: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- عند تعطيل المقاطعة: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- عند التشغيل الخامل: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

لتصحيح الصوت المقطوع، اقرأ سجلات الصوت في الوقت الفعلي كخط زمني:

1. يعني `realtime audio playback started` أن Discord بدأ تشغيل صوت المساعد. يبدأ الجسر من هذه النقطة بعدّ أجزاء إخراج المساعد، وبايتات PCM في Discord، وبايتات المزوّد في الوقت الفعلي، ومدة الصوت المُركّب.
2. يحدد `realtime speaker turn opened` لحظة نشاط متحدث في Discord. إذا كان التشغيل نشطًا بالفعل وكان `bargeIn` مفعّلًا، فقد يتبع ذلك `barge-in detected source=speaker-start`.
3. يحدد `realtime input audio started` أول إطار صوت فعلي تم استلامه لنوبة المتحدث تلك. يعني `outputActive=true` أو وجود قيمة غير صفرية في `outputAudioMs` هنا أن الميكروفون يرسل إدخالًا بينما لا يزال تشغيل المساعد نشطًا.
4. يعني `barge-in detected source=active-speaker-audio` أن OpenClaw رأى صوت متحدث مباشرًا بينما كان تشغيل المساعد نشطًا. هذا مفيد لتمييز المقاطعة الحقيقية عن حدث بدء متحدث في Discord بلا صوت مفيد.
5. يعني `barge-in requested reason=...` أن OpenClaw طلب من مزوّد الوقت الفعلي إلغاء الاستجابة النشطة أو اقتطاعها. ويتضمن `outputAudioMs` و`outputActive` و`playbackChunks` حتى تتمكن من رؤية مقدار صوت المساعد الذي تم تشغيله فعلًا قبل المقاطعة.
6. `realtime audio playback stopped reason=...` هي نقطة إعادة ضبط تشغيل Discord المحلية. يوضح السبب مَن أوقف التشغيل: `barge-in`، أو `player-idle`، أو `provider-clear-audio`، أو `forced-agent-consult`، أو `stream-close`، أو `session-close`.
7. يلخص `realtime speaker turn closed` نوبة الإدخال الملتقطة. يعني `chunks=0` أو `hasAudio=false` أن نوبة المتحدث فُتحت لكن لم يصل أي صوت قابل للاستخدام إلى جسر الوقت الفعلي. يعني `interruptedPlayback=true` أن نوبة الإدخال تلك تداخلت مع إخراج المساعد وشغّلت منطق المقاطعة.

حقول مفيدة:

- `outputAudioMs`: مدة صوت المساعد التي أنشأها مزوّد الوقت الفعلي قبل سطر السجل.
- `audioMs`: مدة صوت المساعد التي حسبها OpenClaw قبل توقف التشغيل.
- `elapsedMs`: الوقت الفعلي بين فتح وإغلاق تدفق التشغيل أو نوبة المتحدث.
- `discordBytes`: بايتات PCM ستيريو بتردد 48 kHz المرسلة إلى صوت Discord أو المستلمة منه.
- `realtimeBytes`: بايتات PCM بتنسيق المزوّد المرسلة إلى مزوّد الوقت الفعلي أو المستلمة منه.
- `playbackChunks`: أجزاء صوت المساعد المُمررة إلى Discord للاستجابة النشطة.
- `sinceLastAudioMs`: الفجوة بين آخر إطار صوت متحدث ملتقط وإغلاق نوبة المتحدث.

أنماط شائعة:

- يشير الانقطاع الفوري مع `source=active-speaker-audio`، وقيمة `outputAudioMs` صغيرة، والمستخدم نفسه قريبًا عادةً إلى دخول صدى السماعة إلى الميكروفون. ارفع `voice.realtime.minBargeInAudioEndMs`، أو اخفض مستوى صوت السماعة، أو استخدم سماعات رأس، أو اضبط `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- يعني `source=speaker-start` متبوعًا بـ `speaker turn closed ... hasAudio=false` أن Discord أبلغ عن بدء متحدث لكن لم يصل أي صوت إلى OpenClaw. قد يكون ذلك حدثًا صوتيًا عابرًا في Discord، أو سلوك بوابة ضوضاء، أو قيام عميل بتنشيط الميكروفون لفترة وجيزة.
- يعني `audio playback stopped reason=stream-close` دون مقاطعة قريبة أو `provider-clear-audio` أن تدفق تشغيل Discord المحلي انتهى على نحو غير متوقع. افحص سجلات المزوّد ومشغل Discord السابقة.
- يعني `capture ignored during playback (barge-in disabled)` أن OpenClaw أسقط الإدخال عمدًا بينما كان صوت المساعد نشطًا. فعّل `voice.realtime.bargeIn` إذا كنت تريد أن يقاطع الكلام التشغيل.
- يعني `barge-in ignored ... outputActive=false` أن Discord أو VAD الخاص بالمزوّد أبلغ عن كلام، لكن لم يكن لدى OpenClaw تشغيل نشط لمقاطعته. لا ينبغي أن يؤدي هذا إلى قطع الصوت.

تُحل بيانات الاعتماد لكل مكوّن على حدة: مصادقة مسار LLM لـ `voice.model`، ومصادقة STT لـ `tools.media.audio`، ومصادقة TTS لـ `messages.tts`/`voice.tts`، ومصادقة مزوّد الوقت الفعلي لـ `voice.realtime.providers` أو إعدادات المصادقة العادية للمزوّد.

### الرسائل الصوتية

تعرض رسائل Discord الصوتية معاينة موجية وتتطلب صوت OGG/Opus. ينشئ OpenClaw الشكل الموجي تلقائيًا، لكنه يحتاج إلى `ffmpeg` و`ffprobe` على مضيف Gateway للفحص والتحويل.

- وفّر **مسار ملف محلي** (تُرفض عناوين URL).
- احذف المحتوى النصي (يرفض Discord النص + الرسالة الصوتية في الحمولة نفسها).
- يُقبل أي تنسيق صوتي؛ يحوّله OpenClaw إلى OGG/Opus عند الحاجة.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="استخدام نوايا غير مسموح بها أو أن البوت لا يرى رسائل النقابات">

    - فعّل Message Content Intent
    - فعّل Server Members Intent عندما تعتمد على حلّ المستخدمين/الأعضاء
    - أعد تشغيل gateway بعد تغيير النوايا

  </Accordion>

  <Accordion title="حظر رسائل النقابة بشكل غير متوقع">

    - تحقّق من `groupPolicy`
    - تحقّق من قائمة السماح للنقابات ضمن `channels.discord.guilds`
    - إذا كانت خريطة `channels` للنقابة موجودة، فلا يُسمح إلا بالقنوات المدرجة
    - تحقّق من سلوك `requireMention` وأنماط الإشارة

    فحوصات مفيدة:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="طلب الإشارة false لكن الحظر ما زال يحدث">
    الأسباب الشائعة:

    - `groupPolicy="allowlist"` من دون قائمة سماح مطابقة للنقابة/القناة
    - إعداد `requireMention` في المكان الخطأ (يجب أن يكون ضمن `channels.discord.guilds` أو إدخال القناة)
    - حظر المرسل عبر قائمة سماح `users` للنقابة/القناة

  </Accordion>

  <Accordion title="دورات Discord طويلة التشغيل أو ردود مكررة">

    سجلات نموذجية:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    مقابض قائمة انتظار Discord gateway:

    - حساب واحد: `channels.discord.eventQueue.listenerTimeout`
    - حسابات متعددة: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - يتحكم هذا فقط في عمل مستمع Discord gateway، وليس في عمر دورة الوكيل

    لا يطبّق Discord مهلة مملوكة للقناة على دورات الوكيل الموضوعة في قائمة الانتظار. يسلّم مستمعو الرسائل العمل فورًا، وتحافظ تشغيلات Discord الموضوعة في قائمة الانتظار على ترتيب كل جلسة إلى أن تكتمل دورة حياة الجلسة/الأداة/وقت التشغيل أو تُجهض العمل.

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
    يجلب OpenClaw بيانات Discord `/gateway/bot` الوصفية قبل الاتصال. تعود الإخفاقات العابرة إلى عنوان Gateway الافتراضي في Discord وتكون محدودة المعدل في السجلات.

    مقابض مهلة البيانات الوصفية:

    - حساب واحد: `channels.discord.gatewayInfoTimeoutMs`
    - حسابات متعددة: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - بديل env عندما لا يكون الإعداد مضبوطًا: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - الافتراضي: `30000` (30 ثانية)، الحد الأقصى: `120000`

  </Accordion>

  <Accordion title="إعادة التشغيل بسبب مهلة READY في Gateway">
    ينتظر OpenClaw حدث `READY` من Gateway الخاص بـ Discord أثناء بدء التشغيل وبعد إعادة اتصال وقت التشغيل. قد تحتاج إعدادات الحسابات المتعددة مع التدرّج في بدء التشغيل إلى نافذة READY أطول لبدء التشغيل من الافتراضي.

    مقابض مهلة READY:

    - بدء التشغيل لحساب واحد: `channels.discord.gatewayReadyTimeoutMs`
    - بدء التشغيل لحسابات متعددة: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - بديل env لبدء التشغيل عندما لا يكون الإعداد مضبوطًا: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - افتراضي بدء التشغيل: `15000` (15 ثانية)، الحد الأقصى: `120000`
    - وقت التشغيل لحساب واحد: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - وقت التشغيل لحسابات متعددة: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - بديل env لوقت التشغيل عندما لا يكون الإعداد مضبوطًا: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - افتراضي وقت التشغيل: `30000` (30 ثانية)، الحد الأقصى: `120000`

  </Accordion>

  <Accordion title="عدم تطابق تدقيق الأذونات">
    لا تعمل فحوصات أذونات `channels status --probe` إلا مع معرّفات القنوات الرقمية.

    إذا استخدمت مفاتيح slug، فقد تظل مطابقة وقت التشغيل تعمل، لكن probe لا يستطيع التحقق الكامل من الأذونات.

  </Accordion>

  <Accordion title="مشكلات الرسائل المباشرة والاقتران">

    - الرسائل المباشرة معطّلة: `channels.discord.dm.enabled=false`
    - سياسة الرسائل المباشرة معطّلة: `channels.discord.dmPolicy="disabled"` (قديم: `channels.discord.dm.policy`)
    - انتظار موافقة الاقتران في وضع `pairing`

  </Accordion>

  <Accordion title="حلقات بوت إلى بوت">
    افتراضيًا، تُتجاهل الرسائل التي كتبها بوت.

    إذا ضبطت `channels.discord.allowBots=true`، فاستخدم قواعد إشارة وقوائم سماح صارمة لتجنّب سلوك الحلقات.
    فضّل `channels.discord.allowBots="mentions"` لقبول رسائل البوتات التي تشير إلى البوت فقط.

    يشحن OpenClaw أيضًا [حماية حلقات البوت](/ar/channels/bot-loop-protection) المشتركة. عندما يسمح `allowBots` للرسائل التي كتبها بوت بالوصول إلى الإرسال، يربط Discord الحدث الوارد بحقائق `(account, channel, bot pair)`، ويمنع حارس الأزواج العام الزوج بعد تجاوزه ميزانية الأحداث المضبوطة. يمنع الحارس حلقات البوتين المنفلتة التي كان يجب إيقافها سابقًا عبر حدود معدل Discord؛ ولا يؤثر في عمليات النشر ذات البوت الواحد أو ردود البوت لمرة واحدة التي تبقى دون الميزانية.

    الإعدادات الافتراضية (نشطة عند ضبط `allowBots`):

    - `maxEventsPerWindow: 20` -- يمكن لزوج البوتات تبادل 20 رسالة ضمن النافذة المنزلقة
    - `windowSeconds: 60` -- طول النافذة المنزلقة
    - `cooldownSeconds: 60` -- بعد تجاوز الميزانية، تُسقط كل رسالة بوت إلى بوت إضافية في أي اتجاه لمدة دقيقة واحدة

    اضبط الافتراضي المشترك مرة واحدة ضمن `channels.defaults.botLoopProtection`، ثم تجاوز Discord عندما يحتاج سير عمل مشروع إلى هامش أكبر. الأسبقية هي:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - الافتراضيات المدمجة

    يستخدم Discord مفاتيح `maxEventsPerWindow` و`windowSeconds` و`cooldownSeconds` العامة.

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
    discord: {
      // Optional Discord-wide override. Account blocks override individual
      // fields and inherit omitted fields from here.
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        mantis: {
          // Mantis listens to other bots only when they mention her.
          allowBots: "mentions",
        },
        molty: {
          // Molty listens to all bot-authored Discord messages.
          allowBots: true,
          mentionAliases: {
            // Lets Molty write a Mantis Discord mention with the configured user id.
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // Allow up to five messages per minute before suppressing the pair.
            maxEventsPerWindow: 5,
            windowSeconds: 60,
            cooldownSeconds: 90,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="إسقاطات Voice STT مع DecryptionFailed(...)">

    - أبقِ OpenClaw محدّثًا (`openclaw update`) حتى يكون منطق استرداد استقبال صوت Discord موجودًا
    - أكّد أن `channels.discord.voice.daveEncryption=true` (الافتراضي)
    - ابدأ من `channels.discord.voice.decryptionFailureTolerance=24` (افتراضي المصدر) واضبطه فقط عند الحاجة
    - راقب السجلات بحثًا عن:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - إذا استمرت الإخفاقات بعد إعادة الانضمام التلقائية، فاجمع السجلات وقارنها بسجل استقبال DAVE في المصدر في [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) و[discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## مرجع التكوين

المرجع الأساسي: [مرجع التكوين - Discord](/ar/gateway/config-channels#discord).

<Accordion title="حقول Discord عالية القيمة">

- بدء التشغيل/المصادقة: `enabled`, `token`, `accounts.*`, `allowBots`
- السياسة: `groupPolicy`, `dm.*`, `guilds.*`, `guilds.*.channels.*`
- الأمر: `commands.native`, `commands.useAccessGroups`, `configWrites`, `slashCommand.*`
- قائمة انتظار الأحداث: `eventQueue.listenerTimeout` (ميزانية المستمع)، `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- الرد/السجل: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- التسليم: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- البث: `streaming` (اسم مستعار قديم: `streamMode`)، `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- الوسائط/إعادة المحاولة: `mediaMaxMb` (يحدّ من تحميلات Discord الصادرة، الافتراضي `100MB`)، `retry`
- الإجراءات: `actions.*`
- الحضور: `activity`, `status`, `activityType`, `activityUrl`
- واجهة المستخدم: `ui.components.accentColor`
- الميزات: `threadBindings`، المستوى العلوي `bindings[]` (`type: "acp"`)، `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## السلامة والعمليات

- تعامل مع رموز البوتات كأسرار (`DISCORD_BOT_TOKEN` مفضّل في البيئات المُدارة).
- امنح أذونات Discord بأقل امتيازات ممكنة.
- إذا كانت حالة/نشر الأوامر قديمة، فأعد تشغيل gateway وأعد الفحص باستخدام `openclaw channels status --probe`.

## ذات صلة

<CardGroup cols={2}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    اربط مستخدم Discord بـ gateway.
  </Card>
  <Card title="المجموعات" icon="users" href="/ar/channels/groups">
    سلوك دردشة المجموعات وقوائم السماح.
  </Card>
  <Card title="توجيه القنوات" icon="route" href="/ar/channels/channel-routing">
    وجّه الرسائل الواردة إلى الوكلاء.
  </Card>
  <Card title="الأمان" icon="shield" href="/ar/gateway/security">
    نموذج التهديد والتحصين.
  </Card>
  <Card title="توجيه متعدد الوكلاء" icon="sitemap" href="/ar/concepts/multi-agent">
    اربط النقابات والقنوات بالوكلاء.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلية.
  </Card>
</CardGroup>

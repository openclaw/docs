---
read_when:
    - العمل على ميزات قناة Discord
summary: حالة دعم بوت Discord وإمكاناته وتكوينه
title: Discord
x-i18n:
    generated_at: "2026-06-30T14:01:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74244c721bfd752bf4ce73a6739503c902a14d07edef5ca6300c87f717669a7e
    source_path: channels/discord.md
    workflow: 16
---

جاهز للرسائل الخاصة وقنوات الخوادم عبر Discord gateway الرسمي.

<CardGroup cols={3}>
  <Card title="الإقران" icon="link" href="/ar/channels/pairing">
    تنتقل رسائل Discord الخاصة افتراضيًا إلى وضع الإقران.
  </Card>
  <Card title="أوامر Slash" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وكتالوج الأوامر.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات متعددة القنوات ومسار الإصلاح.
  </Card>
</CardGroup>

## الإعداد السريع

ستحتاج إلى إنشاء تطبيق جديد مع بوت، وإضافة البوت إلى خادمك، وإقرانه مع OpenClaw. نوصي بإضافة البوت إلى خادمك الخاص. إذا لم يكن لديك خادم بعد، [أنشئ واحدًا أولًا](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (اختر **Create My Own > For me and my friends**).

<Steps>
  <Step title="إنشاء تطبيق Discord وبوت">
    انتقل إلى [Discord Developer Portal](https://discord.com/developers/applications) وانقر على **New Application**. سمّه باسم مثل "OpenClaw".

    انقر على **Bot** في الشريط الجانبي. اضبط **Username** على الاسم الذي تطلقه على وكيل OpenClaw لديك.

  </Step>

  <Step title="تفعيل النوايا المميزة">
    مع بقائك في صفحة **Bot**، مرّر لأسفل إلى **Privileged Gateway Intents** وفعّل:

    - **Message Content Intent** (مطلوب)
    - **Server Members Intent** (موصى به؛ مطلوب لقوائم السماح بالأدوار ومطابقة الاسم مع المعرّف)
    - **Presence Intent** (اختياري؛ مطلوب فقط لتحديثات الحضور)

  </Step>

  <Step title="نسخ رمز البوت">
    مرّر مرة أخرى إلى أعلى صفحة **Bot** وانقر على **Reset Token**.

    <Note>
    رغم الاسم، سيؤدي هذا إلى إنشاء أول رمز لك — لا تتم "إعادة ضبط" أي شيء.
    </Note>

    انسخ الرمز واحفظه في مكان ما. هذا هو **Bot Token** الخاص بك وستحتاج إليه قريبًا.

  </Step>

  <Step title="إنشاء عنوان URL للدعوة وإضافة البوت إلى خادمك">
    انقر على **OAuth2** في الشريط الجانبي. ستنشئ عنوان URL للدعوة بالصلاحيات المناسبة لإضافة البوت إلى خادمك.

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
      - إضافة التفاعلات (اختياري)

    هذه هي المجموعة الأساسية لقنوات النص العادية. إذا كنت تخطط للنشر في سلاسل Discord، بما في ذلك سير عمل قنوات المنتديات أو الوسائط التي تنشئ سلسلة أو تواصلها، ففعّل أيضًا **Send Messages in Threads**.
    انسخ عنوان URL الذي تم إنشاؤه في الأسفل، والصقه في متصفحك، وحدد خادمك، وانقر على **Continue** للاتصال. يجب أن ترى الآن البوت في خادم Discord.

  </Step>

  <Step title="تفعيل وضع المطور وجمع معرّفاتك">
    في تطبيق Discord مجددًا، تحتاج إلى تفعيل وضع المطور حتى تتمكن من نسخ المعرّفات الداخلية.

    1. انقر على **User Settings** (أيقونة الترس بجانب صورتك الرمزية) ← مرّر إلى **Developer** في الشريط الجانبي ← فعّل **Developer Mode**

        *(ملاحظة: في تطبيق Discord للجوّال، يوجد وضع المطور ضمن **App Settings** ← **Advanced**)*

    2. انقر بزر الفأرة الأيمن على **أيقونة الخادم** في الشريط الجانبي ← **Copy Server ID**
    3. انقر بزر الفأرة الأيمن على **صورتك الرمزية** ← **Copy User ID**

    احفظ **Server ID** و**User ID** بجانب Bot Token — سترسل الثلاثة جميعًا إلى OpenClaw في الخطوة التالية.

  </Step>

  <Step title="السماح بالرسائل الخاصة من أعضاء الخادم">
    لكي يعمل الإقران، يحتاج Discord إلى السماح للبوت بإرسال رسالة خاصة إليك. انقر بزر الفأرة الأيمن على **أيقونة الخادم** ← **Privacy Settings** ← فعّل **Direct Messages**.

    يتيح هذا لأعضاء الخادم (بما في ذلك البوتات) إرسال رسائل خاصة إليك. أبقِ هذا مفعّلًا إذا كنت تريد استخدام رسائل Discord الخاصة مع OpenClaw. إذا كنت تخطط لاستخدام قنوات الخادم فقط، فيمكنك تعطيل الرسائل الخاصة بعد الإقران.

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
    بالنسبة لتثبيتات الخدمات المُدارة، شغّل `openclaw gateway install` من صدفة يتوفر فيها `DISCORD_BOT_TOKEN`، أو خزّن المتغير في `~/.openclaw/.env`، حتى تتمكن الخدمة من حل SecretRef للبيئة بعد إعادة التشغيل.
    إذا كان مضيفك محظورًا أو محدود المعدل بسبب بحث تطبيق بدء التشغيل في Discord، فاضبط معرّف تطبيق/عميل Discord من Developer Portal حتى يمكن لبدء التشغيل تخطي استدعاء REST هذا. استخدم `channels.discord.applicationId` للحساب الافتراضي، أو `channels.discord.accounts.<accountId>.applicationId` عند تشغيل عدة بوتات Discord.

  </Step>

  <Step title="تكوين OpenClaw والإقران">

    <Tabs>
      <Tab title="اسأل وكيلك">
        تحدّث مع وكيل OpenClaw على أي قناة موجودة (مثل Telegram) وأخبره. إذا كان Discord هو قناتك الأولى، فاستخدم تبويب CLI / config بدلًا من ذلك.

        > "لقد ضبطت بالفعل رمز بوت Discord في التكوين. يُرجى إنهاء إعداد Discord باستخدام User ID `<user_id>` وServer ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        إذا كنت تفضّل التكوين المعتمد على الملفات، فاضبط:

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

        للإعداد النصي أو عن بُعد، اكتب كتلة JSON5 نفسها باستخدام `openclaw config patch --file ./discord.patch.json5 --dry-run` ثم أعد التشغيل من دون `--dry-run`. قيم `token` بالنص الصريح مدعومة. قيم SecretRef مدعومة أيضًا لـ `channels.discord.token` عبر موفري env/file/exec. راجع [إدارة الأسرار](/ar/gateway/secrets).

        لعدة بوتات Discord، احتفظ بكل رمز بوت ومعرّف تطبيق ضمن حسابه. يتم توريث `channels.discord.applicationId` على المستوى الأعلى بواسطة الحسابات، لذلك لا تضبطه هناك إلا عندما ينبغي لكل حساب استخدام معرّف التطبيق نفسه.

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

  <Step title="الموافقة على أول إقران عبر الرسائل الخاصة">
    انتظر حتى يعمل Gateway، ثم أرسل رسالة خاصة إلى البوت في Discord. سيرد برمز إقران.

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

    يجب أن تكون الآن قادرًا على الدردشة مع وكيلك في Discord عبر رسالة خاصة.

  </Step>
</Steps>

<Note>
حل الرموز يراعي الحساب. تتغلب قيم رمز التكوين على احتياطي البيئة. يُستخدم `DISCORD_BOT_TOKEN` للحساب الافتراضي فقط.
إذا تحوّل حسابان مفعّلان في Discord إلى رمز البوت نفسه، يبدأ OpenClaw مراقب Gateway واحدًا فقط لذلك الرمز. يتغلب الرمز من مصدر التكوين على احتياطي البيئة الافتراضي؛ وإلا يفوز أول حساب مفعّل ويُبلَّغ عن تعطيل الحساب المكرر.
للاستدعاءات الصادرة المتقدمة (أداة الرسائل/إجراءات القنوات)، يُستخدم `token` صريح لكل استدعاء لذلك الاستدعاء. ينطبق هذا على إجراءات الإرسال والقراءة/الفحص (مثل القراءة/البحث/الجلب/السلسلة/التثبيتات/الأذونات). لا تزال إعدادات سياسة الحساب/إعادة المحاولة تأتي من الحساب المحدد في لقطة وقت التشغيل النشطة.
</Note>

## موصى به: إعداد مساحة عمل للخادم

بمجرد أن تعمل الرسائل الخاصة، يمكنك إعداد خادم Discord الخاص بك كمساحة عمل كاملة حيث تحصل كل قناة على جلسة وكيل خاصة بها مع سياقها الخاص. يُوصى بهذا للخوادم الخاصة التي تضمك أنت والبوت فقط.

<Steps>
  <Step title="إضافة خادمك إلى قائمة السماح للخوادم">
    يتيح هذا لوكيلك الرد في أي قناة على خادمك، وليس الرسائل الخاصة فقط.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "أضف Discord Server ID `<server_id>` الخاص بي إلى قائمة السماح للخوادم"
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

  <Step title="السماح بالردود من دون @mention">
    افتراضيًا، لا يرد وكيلك في قنوات الخادم إلا عند @mentioned. بالنسبة لخادم خاص، ربما تريد أن يرد على كل رسالة.

    في قنوات الخادم، تُنشر الردود العادية تلقائيًا بشكل افتراضي. بالنسبة للغرف المشتركة الدائمة، اختر `messages.groupChat.visibleReplies: "message_tool"` حتى يتمكن الوكيل من المراقبة بهدوء والنشر فقط عندما يقرر أن رد القناة مفيد. يعمل هذا بشكل أفضل مع نماذج الجيل الأحدث الموثوقة في استخدام الأدوات، مثل GPT 5.5. تبقى أحداث الغرفة المحيطة صامتة ما لم ترسل الأداة. راجع [أحداث الغرفة المحيطة](/ar/channels/ambient-room-events) لتكوين وضع المراقبة الكامل.

    إذا أظهر Discord مؤشر الكتابة وأظهرت السجلات استخدام الرموز ولكن لم تُنشر أي رسالة، فتحقق مما إذا كانت الجولة قد كُوّنت كحدث غرفة محيطة أو اختيرت للردود المرئية عبر أداة الرسائل.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "اسمح لوكيلي بالرد على هذا الخادم من دون الحاجة إلى ذكره بـ @"
      </Tab>
      <Tab title="التكوين">
        اضبط `requireMention: false` في تكوين الخادم:

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

        لطلب الإرسال عبر أداة الرسائل للردود المرئية في المجموعات/القنوات، اضبط `messages.groupChat.visibleReplies: "message_tool"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="التخطيط للذاكرة في قنوات الخادم">
    افتراضيًا، لا تُحمَّل الذاكرة طويلة الأمد (MEMORY.md) إلا في جلسات الرسائل الخاصة. لا تُحمّل قنوات الخادم MEMORY.md تلقائيًا.

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

أنشئ الآن بعض القنوات على خادم Discord وابدأ الدردشة. يمكن لوكيلك رؤية اسم القناة، وتحصل كل قناة على جلستها المعزولة الخاصة — لذا يمكنك إعداد `#coding` أو `#home` أو `#research` أو أي شيء يناسب سير عملك.

## نموذج وقت التشغيل

- يمتلك Gateway اتصال Discord.
- توجيه الردود حتمي: تعود الردود الواردة من Discord إلى Discord.
- تُضاف بيانات تعريف خادم/قناة Discord إلى موجّه النموذج كسياق غير موثوق
  وليس كبادئة رد مرئية للمستخدم. إذا نسخ النموذج ذلك الغلاف
  مرة أخرى، يزيل OpenClaw بيانات التعريف المنسوخة من الردود الصادرة ومن
  سياق إعادة التشغيل المستقبلي.
- افتراضيًا (`session.dmScope=main`)، تشارك المحادثات المباشرة جلسة الوكيل الرئيسية (`agent:main:main`).
- تُعزل قنوات الخادم في مفاتيح جلسات (`agent:<agentId>:discord:channel:<channelId>`).
- يتم تجاهل الرسائل المباشرة الجماعية افتراضيًا (`channels.discord.dm.groupEnabled=false`).
- تعمل أوامر الشرطة المائلة الأصلية في جلسات أوامر معزولة (`agent:<agentId>:discord:slash:<userId>`)، مع استمرار حمل `CommandTargetSessionKey` إلى جلسة المحادثة الموجّهة.
- يستخدم تسليم إعلانات cron/heartbeat النصية فقط إلى Discord الإجابة النهائية
  المرئية للمساعد مرة واحدة. تظل حمولات الوسائط والمكوّنات المنظمة
  متعددة الرسائل عندما يصدر الوكيل عدة حمولات قابلة للتسليم.

## قنوات المنتدى

لا تقبل قنوات منتديات ووسائط Discord إلا منشورات الخيوط. يدعم OpenClaw طريقتين لإنشائها:

- أرسل رسالة إلى أصل المنتدى (`channel:<forumId>`) لإنشاء خيط تلقائيًا. يستخدم عنوان الخيط أول سطر غير فارغ من رسالتك.
- استخدم `openclaw message thread create` لإنشاء خيط مباشرةً. لا تمرر `--message-id` لقنوات المنتدى.

مثال: الإرسال إلى أصل المنتدى لإنشاء خيط

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

مثال: إنشاء خيط منتدى صراحةً

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

لا تقبل أصول المنتديات مكوّنات Discord. إذا احتجت إلى مكوّنات، فأرسل إلى الخيط نفسه (`channel:<threadId>`).

## المكوّنات التفاعلية

يدعم OpenClaw حاويات مكوّنات Discord v2 لرسائل الوكيل. استخدم أداة الرسائل مع حمولة `components`. تُوجّه نتائج التفاعل مرة أخرى إلى الوكيل كرسائل واردة عادية وتتبع إعدادات Discord الحالية لـ `replyToMode`.

الكتل المدعومة:

- `text`، `section`، `separator`، `actions`، `media-gallery`، `file`
- تسمح صفوف الإجراءات بما يصل إلى 5 أزرار أو قائمة اختيار واحدة
- أنواع الاختيار: `string`، `user`، `role`، `mentionable`، `channel`

افتراضيًا، تكون المكوّنات أحادية الاستخدام. عيّن `components.reusable=true` للسماح باستخدام الأزرار والاختيارات والنماذج عدة مرات حتى تنتهي صلاحيتها.

لتقييد من يمكنه النقر على زر، عيّن `allowedUsers` على ذلك الزر (معرّفات مستخدمي Discord أو الوسوم أو `*`). عند التهيئة، يتلقى المستخدمون غير المطابقين رفضًا عابرًا.

تنتهي صلاحية استدعاءات المكوّنات بعد 30 دقيقة افتراضيًا. عيّن `channels.discord.agentComponents.ttlMs` لتغيير مدة حياة سجل الاستدعاءات هذا لحساب Discord الافتراضي، أو `channels.discord.accounts.<accountId>.agentComponents.ttlMs` لتجاوز حساب واحد في إعداد متعدد الحسابات. القيمة بالمللي ثانية، ويجب أن تكون عددًا صحيحًا موجبًا، وتُحد عند `86400000` (24 ساعة). تُعد مدد TTL الأطول مفيدة لسير عمل المراجعة أو الموافقة التي تحتاج إلى بقاء الأزرار قابلة للاستخدام، لكنها تمدد أيضًا النافذة التي يمكن فيها لرسالة Discord قديمة أن تظل قادرة على تشغيل إجراء. فضّل أقصر TTL يناسب سير العمل، واحتفظ بالافتراضي عندما تكون الاستدعاءات القديمة مفاجئة.

تفتح أوامر الشرطة المائلة `/model` و`/models` منتقي نماذج تفاعليًا مع قوائم منسدلة للموفّر والنموذج ووقت التشغيل المتوافق بالإضافة إلى خطوة إرسال. أصبح `/models add` مهجورًا ويعيد الآن رسالة إهمال بدلًا من تسجيل النماذج من المحادثة. رد المنتقي عابر ولا يمكن استخدامه إلا من المستخدم الذي استدعاه. تقتصر قوائم اختيار Discord على 25 خيارًا، لذا أضف إدخالات `provider/*` إلى `agents.defaults.models` عندما تريد أن يعرض المنتقي النماذج المكتشفة ديناميكيًا فقط للموفّرين المحددين مثل `openai` أو `vllm`.

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
  <Tab title="سياسة الرسائل المباشرة">
    يتحكم `channels.discord.dmPolicy` في الوصول إلى الرسائل المباشرة. `channels.discord.allowFrom` هي قائمة السماح الأساسية للرسائل المباشرة.

    - `pairing` (افتراضي)
    - `allowlist`
    - `open` (يتطلب أن يتضمن `channels.discord.allowFrom` القيمة `"*"`)
    - `disabled`

    إذا لم تكن سياسة الرسائل المباشرة مفتوحة، يُحظر المستخدمون غير المعروفين (أو يُطلب منهم الاقتران في وضع `pairing`).

    أسبقية الحسابات المتعددة:

    - ينطبق `channels.discord.accounts.default.allowFrom` فقط على الحساب `default`.
    - لحساب واحد، تكون أسبقية `allowFrom` على `dm.allowFrom` القديم.
    - ترث الحسابات المسماة `channels.discord.allowFrom` عندما لا تكون `allowFrom` الخاصة بها و`dm.allowFrom` القديمة معيّنتين.
    - لا ترث الحسابات المسماة `channels.discord.accounts.default.allowFrom`.

    لا يزال `channels.discord.dm.policy` و`channels.discord.dm.allowFrom` القديمان يُقرآن للتوافق. ينقلهما `openclaw doctor --fix` إلى `dmPolicy` و`allowFrom` عندما يمكنه فعل ذلك دون تغيير الوصول.

    تنسيق هدف الرسائل المباشرة للتسليم:

    - `user:<id>`
    - إشارة `<@id>`

    تُحل عادةً المعرّفات الرقمية الصرفة كمعرّفات قنوات عندما يكون افتراضي قناة نشطًا، لكن المعرّفات المدرجة في `allowFrom` الفعّالة للرسائل المباشرة في الحساب تُعامل كأهداف رسائل مباشرة للمستخدمين من أجل التوافق.

  </Tab>

  <Tab title="مجموعات الوصول">
    يمكن لتفويض رسائل Discord المباشرة والأوامر النصية استخدام إدخالات `accessGroup:<name>` ديناميكية في `channels.discord.allowFrom`.

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

    لا تملك قناة Discord النصية قائمة أعضاء منفصلة. يصوغ `type: "discord.channelAudience"` العضوية على النحو التالي: يكون مرسل الرسالة المباشرة عضوًا في الخادم المهيأ ولديه حاليًا إذن `ViewChannel` فعّال على القناة المهيأة بعد تطبيق تجاوزات الأدوار والقنوات.

    مثال: السماح لأي شخص يمكنه رؤية `#maintainers` بإرسال رسالة مباشرة إلى البوت، مع إبقاء الرسائل المباشرة مغلقة أمام الجميع غيره.

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

    تفشل عمليات البحث في وضع مغلق. إذا أعاد Discord القيمة `Missing Access`، أو فشل البحث عن العضو، أو كانت القناة تنتمي إلى خادم مختلف، يُعامل مرسل الرسالة المباشرة على أنه غير مصرح له.

    فعّل **Server Members Intent** في Discord Developer Portal للبوت عند استخدام مجموعات وصول جمهور القناة. لا تتضمن الرسائل المباشرة حالة عضو الخادم، لذلك يحل OpenClaw العضو عبر Discord REST في وقت التفويض.

  </Tab>

  <Tab title="سياسة الخادم">
    يتحكم `channels.discord.groupPolicy` في التعامل مع الخوادم:

    - `open`
    - `allowlist`
    - `disabled`

    خط الأساس الآمن عندما يكون `channels.discord` موجودًا هو `allowlist`.

    سلوك `allowlist`:

    - يجب أن يطابق الخادم `channels.discord.guilds` (يُفضّل `id`، ويُقبل slug)
    - قوائم سماح اختيارية للمرسلين: `users` (يوصى بالمعرّفات المستقرة) و`roles` (معرّفات الأدوار فقط)؛ إذا ضُبط أي منهما، يُسمح للمرسلين عندما يطابقون `users` أو `roles`
    - مطابقة الاسم/الوسم المباشرة معطلة افتراضيًا؛ فعّل `channels.discord.dangerouslyAllowNameMatching: true` فقط كوضع توافق طارئ
    - الأسماء/الوسوم مدعومة في `users`، لكن المعرّفات أكثر أمانًا؛ يحذر `openclaw security audit` عند استخدام إدخالات الاسم/الوسم
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

    إذا عيّنت `DISCORD_BOT_TOKEN` فقط ولم تنشئ كتلة `channels.discord`، يكون احتياطي وقت التشغيل هو `groupPolicy="allowlist"` (مع تحذير في السجلات)، حتى إذا كانت `channels.defaults.groupPolicy` هي `open`.

  </Tab>

  <Tab title="الإشارات والرسائل المباشرة الجماعية">
    تكون رسائل الخادم مقيدة بالإشارة افتراضيًا.

    يتضمن اكتشاف الإشارات:

    - إشارة صريحة إلى البوت
    - أنماط الإشارة المهيأة (`agents.list[].groupChat.mentionPatterns`، والاحتياطي `messages.groupChat.mentionPatterns`)
    - سلوك الرد الضمني على البوت في الحالات المدعومة

    عند كتابة رسائل Discord الصادرة، استخدم صيغة الإشارة الأساسية: `<@USER_ID>` للمستخدمين، و`<#CHANNEL_ID>` للقنوات، و`<@&ROLE_ID>` للأدوار. لا تستخدم صيغة إشارة اللقب القديمة `<@!USER_ID>`.

    يُهيأ `requireMention` لكل خادم/قناة (`channels.discord.guilds...`).
    يُسقط `ignoreOtherMentions` اختياريًا الرسائل التي تشير إلى مستخدم/دور آخر لكن لا تشير إلى البوت (باستثناء @everyone/@here).

    الرسائل المباشرة الجماعية:

    - الافتراضي: يتم تجاهلها (`dm.groupEnabled=false`)
    - قائمة سماح اختيارية عبر `dm.groupChannels` (معرّفات القنوات أو slugs)

  </Tab>
</Tabs>

### توجيه الوكيل المستند إلى الأدوار

استخدم `bindings[].match.roles` لتوجيه أعضاء نقابة Discord إلى وكلاء مختلفين حسب معرّف الدور. تقبل الارتباطات المستندة إلى الأدوار معرّفات الأدوار فقط، ويتم تقييمها بعد ارتباطات النظير أو النظير الأصل وقبل ارتباطات النقابة فقط. إذا ضبط ارتباط أيضًا حقول مطابقة أخرى (على سبيل المثال `peer` + `guildId` + `roles`)، فيجب أن تتطابق كل الحقول المضبوطة.

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

- تكون القيمة الافتراضية لـ `commands.native` هي `"auto"` وتكون مفعّلة لـ Discord.
- تجاوز لكل قناة: `channels.discord.commands.native`.
- يتجاوز `commands.native=false` تسجيل أوامر Discord slash وتنظيفها أثناء بدء التشغيل. قد تبقى الأوامر المسجلة سابقًا مرئية في Discord إلى أن تزيلها من تطبيق Discord.
- تستخدم مصادقة الأوامر الأصلية قوائم السماح/السياسات نفسها في Discord مثل معالجة الرسائل العادية.
- قد تظل الأوامر مرئية في واجهة Discord للمستخدمين غير المصرح لهم؛ لكن التنفيذ يظل يفرض مصادقة OpenClaw ويُرجع "غير مصرح".

راجع [أوامر Slash](/ar/tools/slash-commands) للاطلاع على كتالوج الأوامر وسلوكها.

إعدادات أمر slash الافتراضية:

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

    ملاحظة: يعطّل `off` ترابط الردود الضمني. تظل وسوم `[[reply_to_*]]` الصريحة محترمة.
    يرفق `first` دائمًا مرجع الرد الأصلي الضمني بأول رسالة Discord صادرة للدورة.
    يرفق `batched` مرجع الرد الأصلي الضمني في Discord فقط عندما يكون
    الحدث الوارد دفعة مؤجلة من عدة رسائل. يفيد هذا عندما تريد
    الردود الأصلية أساسًا للمحادثات المتدفقة الغامضة، وليس لكل
    دورة ذات رسالة واحدة.

    تُعرض معرّفات الرسائل في السياق/السجل كي تتمكن الوكلاء من استهداف رسائل محددة.

  </Accordion>

  <Accordion title="Link previews">
    ينشئ Discord تضمينات روابط غنية لعناوين URL افتراضيًا. يكبت OpenClaw تلك التضمينات المُنشأة في رسائل Discord الصادرة افتراضيًا، ولذلك تبقى عناوين URL التي يرسلها الوكيل روابط عادية ما لم تختَر تفعيلها:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    اضبط `channels.discord.accounts.<id>.suppressEmbeds` لتجاوز حساب واحد. يمكن أيضًا لرسائل أداة الرسائل الخاصة بالوكيل تمرير `suppressEmbeds: false` لرسالة واحدة. لا يتم كبت حمولات Discord `embeds` الصريحة بواسطة إعداد معاينة الروابط الافتراضي.

  </Accordion>

  <Accordion title="Live stream preview">
    يستطيع OpenClaw بث مسودات الردود عبر إرسال رسالة مؤقتة وتحريرها مع وصول النص. يأخذ `channels.discord.streaming` القيم `off` | `partial` | `block` | `progress` (الافتراضي). يحتفظ `progress` بمسودة حالة واحدة قابلة للتحرير ويحدّثها بتقدم الأدوات إلى حين التسليم النهائي؛ وتكون تسمية البداية المشتركة سطرًا متحركًا، لذا تمر بعيدًا مثل البقية عند ظهور عمل كاف. `streamMode` هو اسم مستعار قديم وقت التشغيل. شغّل `openclaw doctor --fix` لإعادة كتابة الإعدادات المستمرة إلى المفتاح المعياري.

    اضبط `channels.discord.streaming.mode` على `off` لتعطيل تعديلات معاينة Discord. إذا تم تفعيل بث الكتل في Discord صراحةً، يتجاوز OpenClaw بث المعاينة لتجنب البث المزدوج.

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

    - يحرر `partial` رسالة معاينة واحدة مع وصول الرموز.
    - يصدر `block` مقاطع بحجم المسودة (استخدم `draftChunk` لضبط الحجم ونقاط الفصل، مع تقييدها إلى `textChunkLimit`).
    - تلغي النهايات الخاصة بالوسائط والأخطاء والردود الصريحة تعديلات المعاينة المعلقة.
    - يتحكم `streaming.preview.toolProgress` (افتراضيًا `true`) في ما إذا كانت تحديثات الأداة/التقدم تعيد استخدام رسالة المعاينة.
    - تُعرض صفوف الأداة/التقدم كرمز تعبيري مضغوط + عنوان + تفصيل عند توفره، مثل `🛠️ Bash: run tests` أو `🔎 Web Search: for "query"`.
    - يفعّل `streaming.progress.commentary` (افتراضيًا `false`) نص تعليق/تمهيد المساعد في مسودة التقدم المؤقتة. يتم تنظيف التعليق قبل العرض، ويبقى عابرًا، ولا يغير تسليم الإجابة النهائية.
    - يتحكم `streaming.progress.maxLineChars` في ميزانية معاينة التقدم لكل سطر. تُقصَّر النثر على حدود الكلمات؛ وتحتفظ تفاصيل الأوامر والمسارات باللواحق المفيدة.
    - يتحكم `streaming.preview.commandText` / `streaming.progress.commandText` في تفاصيل الأمر/التنفيذ في أسطر التقدم المضغوطة: `raw` (الافتراضي) أو `status` (تسمية الأداة فقط).

    إخفاء نص الأمر/التنفيذ الخام مع إبقاء أسطر التقدم المضغوطة:

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

    بث المعاينة نصي فقط؛ تعود ردود الوسائط إلى التسليم العادي. عند تفعيل بث `block` صراحةً، يتجاوز OpenClaw بث المعاينة لتجنب البث المزدوج.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    سياق سجل النقابة:

    - القيمة الافتراضية لـ `channels.discord.historyLimit` هي `20`
    - بديل احتياطي: `messages.groupChat.historyLimit`
    - يعطّل `0`

    عناصر التحكم في سجل الرسائل المباشرة:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    سلوك الخيوط:

    - تُوجّه خيوط Discord كجلسات قناة وترث إعدادات القناة الأصلية ما لم يتم تجاوزها.
    - ترث جلسات الخيط اختيار `/model` على مستوى جلسة القناة الأصلية كخيار احتياطي للنموذج فقط؛ تظل اختيارات `/model` المحلية للخيط ذات أولوية، ولا يتم نسخ سجل النص الأصل ما لم يتم تفعيل وراثة النص.
    - يفعّل `channels.discord.thread.inheritParent` (افتراضيًا `false`) للخيوط التلقائية الجديدة التهيئة من نص القناة الأصلية. توجد التجاوزات لكل حساب تحت `channels.discord.accounts.<id>.thread.inheritParent`.
    - يمكن لتفاعلات أداة الرسائل حل أهداف الرسائل المباشرة `user:<id>`.
    - يتم الحفاظ على `guilds.<guild>.channels.<channel>.requireMention: false` أثناء بديل التنشيط في مرحلة الرد.

    تُحقن مواضيع القناة كسياق **غير موثوق**. تتحكم قوائم السماح في من يمكنه تشغيل الوكيل، وليست حدًا كاملًا لتنقيح السياق التكميلي.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    يستطيع Discord ربط خيط بهدف جلسة بحيث تظل رسائل المتابعة في ذلك الخيط موجّهة إلى الجلسة نفسها (بما في ذلك جلسات الوكلاء الفرعيين).

    الأوامر:

    - يربط `/focus <target>` الخيط الحالي/الجديد بهدف وكيل فرعي/جلسة
    - يزيل `/unfocus` ارتباط الخيط الحالي
    - يعرض `/agents` التشغيلات النشطة وحالة الارتباط
    - يفحص/يحدّث `/session idle <duration|off>` إلغاء التركيز التلقائي بسبب الخمول للارتباطات المركزة
    - يفحص/يحدّث `/session max-age <duration|off>` الحد الأقصى الصارم للعمر للارتباطات المركزة

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

    - يضبط `session.threadBindings.*` الإعدادات الافتراضية العامة.
    - يتجاوز `channels.discord.threadBindings.*` سلوك Discord.
    - يتحكم `spawnSessions` في الإنشاء/الربط التلقائي للخيوط عبر `sessions_spawn({ thread: true })` وعمليات إنشاء خيوط ACP. الافتراضي: `true`.
    - يتحكم `defaultSpawnContext` في سياق الوكيل الفرعي الأصلي لعمليات الإنشاء المرتبطة بالخيوط. الافتراضي: `"fork"`.
    - يرحّل `openclaw doctor --fix` المفاتيح المهملة `spawnSubagentSessions`/`spawnAcpSessions`.
    - إذا كانت ارتباطات الخيوط معطلة لحساب ما، فلن تكون `/focus` وعمليات ارتباط الخيوط ذات الصلة متاحة.

    راجع [الوكلاء الفرعيون](/ar/tools/subagents)، و[وكلاء ACP](/ar/tools/acp-agents)، و[مرجع الإعدادات](/ar/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    لمساحات عمل ACP مستقرة "دائمة التشغيل"، اضبط ارتباطات ACP typed على المستوى الأعلى لاستهداف محادثات Discord.

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

    - يربط `/acp spawn codex --bind here` القناة الحالية أو الخيط الحالي في مكانه ويبقي الرسائل المستقبلية على جلسة ACP نفسها. ترث رسائل الخيط ارتباط القناة الأصلية.
    - في قناة أو خيط مرتبطين، يعيد `/new` و `/reset` ضبط جلسة ACP نفسها في مكانها. يمكن لارتباطات الخيوط المؤقتة تجاوز حل الهدف أثناء نشاطها.
    - يتحكم `spawnSessions` في إنشاء/ربط الخيوط الفرعية عبر `--thread auto|here`.

    راجع [وكلاء ACP](/ar/tools/acp-agents) لتفاصيل سلوك الارتباط.

  </Accordion>

  <Accordion title="Reaction notifications">
    وضع إشعارات التفاعل لكل نقابة:

    - `off`
    - `own` (الافتراضي)
    - `all`
    - `allowlist` (يستخدم `guilds.<id>.users`)

    تُحوَّل أحداث التفاعل إلى أحداث نظام وتُرفق بجلسة Discord الموجّهة.

  </Accordion>

  <Accordion title="Ack reactions">
    يرسل `ackReaction` رمزًا تعبيريًا للإقرار أثناء معالجة OpenClaw لرسالة واردة.

    ترتيب الحل:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - بديل الرمز التعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يقبل Discord الرموز التعبيرية Unicode أو أسماء الرموز التعبيرية المخصصة.
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="Config writes">
    تكون عمليات كتابة الإعدادات التي تبدأها القناة مفعّلة افتراضيًا.

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
    - تتم مطابقة أسماء عرض الأعضاء بالاسم/المعرّف النصي فقط عندما تكون `channels.discord.dangerouslyAllowNameMatching: true`
    - تستخدم عمليات البحث معرّف الرسالة الأصلي وتكون مقيّدة بنافذة زمنية
    - إذا فشل البحث، تُعامل الرسائل الممرّرة عبر الوكيل كرسائل بوت وتُسقط ما لم يكن `allowBots=true`

  </Accordion>

  <Accordion title="أسماء بديلة للإشارات الصادرة">
    استخدم `mentionAliases` عندما يحتاج الوكلاء إلى إشارات صادرة حتمية لمستخدمي Discord المعروفين. المفاتيح هي المعرّفات من دون علامة `@` البادئة؛ والقيم هي معرّفات مستخدمي Discord. تظل المعرّفات غير المعروفة، و`@everyone`، و`@here`، والإشارات داخل امتدادات كود Markdown بلا تغيير.

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
    تُطبّق تحديثات الحضور عندما تضبط حقل حالة أو نشاط، أو عندما تفعّل الحضور التلقائي.

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

    - 0: يلعب
    - 1: يبث (يتطلب `activityUrl`)
    - 2: يستمع
    - 3: يشاهد
    - 4: مخصص (يستخدم نص النشاط كحالة؛ الرمز التعبيري اختياري)
    - 5: يتنافس

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

    يربط الحضور التلقائي إتاحة وقت التشغيل بحالة Discord: سليم => متصل، متدهور أو غير معروف => خامل، مستنفد أو غير متاح => عدم الإزعاج. تجاوزات النص الاختيارية:

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText` (يدعم العنصر النائب `{reason}`)

  </Accordion>

  <Accordion title="الموافقات في Discord">
    يدعم Discord معالجة الموافقات القائمة على الأزرار في الرسائل الخاصة، ويمكنه اختياريًا نشر مطالبات الموافقة في القناة الأصلية.

    مسار الإعداد:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختياري؛ يعود إلى `commands.ownerAllowFrom` عندما يكون ذلك ممكنًا)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
    - `agentFilter`، و`sessionFilter`، و`cleanupAfterResolve`

    يفعّل Discord موافقات التنفيذ الأصلية تلقائيًا عندما تكون `enabled` غير مضبوطة أو `"auto"` ويمكن حل معتمِد واحد على الأقل، إما من `execApprovals.approvers` أو من `commands.ownerAllowFrom`. لا يستنتج Discord معتمدي التنفيذ من `allowFrom` الخاصة بالقناة، أو `dm.allowFrom` القديمة، أو `defaultTo` الخاصة بالرسائل المباشرة. اضبط `enabled: false` لتعطيل Discord صراحةً كعميل موافقة أصلي.

    بالنسبة إلى أوامر المجموعات الحساسة المقتصرة على المالك، مثل `/diagnostics` و`/export-trajectory`، يرسل OpenClaw مطالبات الموافقة والنتائج النهائية بشكل خاص. يحاول Discord DM أولًا عندما يكون لدى المالك المستدعي مسار مالك على Discord؛ وإذا لم يكن ذلك متاحًا، يعود إلى أول مسار مالك متاح من `commands.ownerAllowFrom`، مثل Telegram.

    عندما تكون `target` هي `channel` أو `both`، تكون مطالبة الموافقة مرئية في القناة. يمكن للمعتمدين الذين تم حلهم فقط استخدام الأزرار؛ ويتلقى المستخدمون الآخرون رفضًا عابرًا. تتضمن مطالبات الموافقة نص الأمر، لذلك لا تفعّل التسليم إلى القناة إلا في القنوات الموثوقة. إذا تعذر اشتقاق معرّف القناة من مفتاح الجلسة، يعود OpenClaw إلى التسليم عبر الرسائل الخاصة.

    يعرض Discord أيضًا أزرار الموافقة المشتركة التي تستخدمها قنوات الدردشة الأخرى. يضيف محوّل Discord الأصلي أساسًا توجيه الرسائل الخاصة للمعتمدين والتوزيع إلى القنوات.
    عندما تكون هذه الأزرار موجودة، فهي تجربة الموافقة الأساسية؛ ويجب على OpenClaw
    ألا يضمّن أمر `/approve` يدويًا إلا عندما تشير نتيجة الأداة إلى
    أن موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.
    إذا لم يكن وقت تشغيل موافقة Discord الأصلية نشطًا، يبقي OpenClaw
    مطالبة `/approve <id> <decision>` المحلية والحتمية مرئية. وإذا كان
    وقت التشغيل نشطًا لكن لا يمكن تسليم بطاقة أصلية إلى أي هدف،
    يرسل OpenClaw إشعار رجوع في الدردشة نفسها يتضمن أمر `/approve`
    الدقيق من الموافقة المعلّقة.

    تتبع مصادقة Gateway وحل الموافقات عقد عميل Gateway المشترك (تُحل معرّفات `plugin:` عبر `plugin.approval.resolve`؛ وتُحل المعرّفات الأخرى عبر `exec.approval.resolve`). تنتهي صلاحية الموافقات بعد 30 دقيقة افتراضيًا.

    راجع [موافقات التنفيذ](/ar/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## الأدوات وبوابات الإجراءات

تشمل إجراءات رسائل Discord المراسلة، وإدارة القنوات، والإشراف، والحضور، وإجراءات البيانات الوصفية.

أمثلة أساسية:

- المراسلة: `sendMessage`، و`readMessages`، و`editMessage`، و`deleteMessage`، و`threadReply`
- التفاعلات: `react`، و`reactions`، و`emojiList`
- الإشراف: `timeout`، و`kick`، و`ban`
- الحضور: `setPresence`

يقبل إجراء `event-create` معلمة `image` اختيارية (URL أو مسار ملف محلي) لتعيين صورة غلاف الحدث المجدول.

توجد بوابات الإجراءات تحت `channels.discord.actions.*`.

سلوك البوابة الافتراضي:

| مجموعة الإجراءات                                                                                                                                                         | الافتراضي |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | مفعّل    |
| roles                                                                                                                                                                    | معطّل    |
| moderation                                                                                                                                                               | معطّل    |
| presence                                                                                                                                                                 | معطّل    |

## واجهة مكونات v2

يستخدم OpenClaw مكونات Discord v2 لموافقات التنفيذ وعلامات السياقات المتقاطعة. يمكن لإجراءات رسائل Discord أيضًا قبول `components` لواجهة مستخدم مخصصة (متقدم؛ يتطلب إنشاء حمولة مكون عبر أداة discord)، بينما تظل `embeds` القديمة متاحة لكنها غير موصى بها.

- يضبط `channels.discord.ui.components.accentColor` لون التمييز المستخدم في حاويات مكونات Discord (ست عشري).
- اضبطه لكل حساب باستخدام `channels.discord.accounts.<id>.ui.components.accentColor`.
- يتحكم `channels.discord.agentComponents.ttlMs` في مدة بقاء استدعاءات مكونات Discord المرسلة مسجلة (الافتراضي `1800000`، والحد الأقصى `86400000`). اضبطه لكل حساب باستخدام `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- يتم تجاهل `embeds` عند وجود مكونات v2.
- تُحجب معاينات URL العادية افتراضيًا. اضبط `suppressEmbeds: false` على إجراء الرسالة عندما يجب توسيع رابط صادر واحد.

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

لدى Discord سطحان صوتيان مميزان: **قنوات صوتية** في الوقت الحقيقي (محادثات مستمرة) و**مرفقات رسائل صوتية** (تنسيق معاينة الموجة). يدعم Gateway كليهما.

### القنوات الصوتية

قائمة إعداد مختصرة:

1. فعّل Message Content Intent في Discord Developer Portal.
2. فعّل Server Members Intent عند استخدام قوائم سماح الأدوار/المستخدمين.
3. ادعُ البوت بنطاقي `bot` و`applications.commands`.
4. امنح أذونات الاتصال، والتحدث، وإرسال الرسائل، وقراءة سجل الرسائل في القناة الصوتية المستهدفة.
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

- يتجاوز `voice.tts` إعداد `messages.tts` لتشغيل الصوت في `stt-tts` فقط. تستخدم أوضاع الوقت الفعلي `voice.realtime.speakerVoice`.
- يتحكم `voice.mode` في مسار المحادثة. القيمة الافتراضية هي `agent-proxy`: تتولى واجهة صوتية أمامية في الوقت الفعلي توقيت الأدوار، والمقاطعة، والتشغيل، وتفوّض العمل الجوهري إلى وكيل OpenClaw الموجّه عبر `openclaw_agent_consult`، وتتعامل مع النتيجة كموجه Discord مكتوب من ذلك المتحدث. يحافظ `stt-tts` على تدفق STT الدفعي الأقدم بالإضافة إلى TTS. يتيح `bidi` لنموذج الوقت الفعلي إجراء المحادثة مباشرة مع إتاحة `openclaw_agent_consult` لعقل OpenClaw.
- يتحكم `voice.agentSession` في محادثة OpenClaw التي تتلقى أدوار الصوت. اتركه غير معيّن لجلسة قناة الصوت نفسها، أو عيّنه إلى `{ mode: "target", target: "channel:<text-channel-id>" }` لجعل قناة الصوت تعمل كامتداد ميكروفون/مكبر صوت لجلسة قناة نصية موجودة في Discord مثل `#maintainers`.
- يتجاوز `voice.model` عقل وكيل OpenClaw لاستجابات صوت Discord والاستشارات في الوقت الفعلي. اتركه غير معيّن ليرث نموذج الوكيل الموجّه. وهو منفصل عن `voice.realtime.model`.
- يتيح `voice.followUsers` للبوت الانضمام إلى صوت Discord والانتقال والمغادرة مع مستخدمين محددين. راجع [متابعة المستخدمين في الصوت](#follow-users-in-voice) لقواعد السلوك والأمثلة.
- يوجّه `agent-proxy` الكلام عبر `discord-voice`، مما يحافظ على تفويض المالك/الأدوات العادي للمتحدث والجلسة المستهدفة، لكنه يخفي أداة الوكيل `tts` لأن صوت Discord يملك التشغيل. افتراضيًا، يمنح `agent-proxy` الاستشارة وصولًا كاملًا إلى الأدوات مكافئًا للمالك للمتحدثين المالكين (`voice.realtime.toolPolicy: "owner"`) ويفضل بشدة استشارة وكيل OpenClaw قبل الإجابات الجوهرية (`voice.realtime.consultPolicy: "always"`). في وضع `always` الافتراضي هذا، لا تنطق طبقة الوقت الفعلي حشوًا تلقائيًا قبل إجابة الاستشارة؛ بل تلتقط الكلام وتنسخه، ثم تنطق إجابة OpenClaw الموجّهة. إذا اكتملت عدة إجابات استشارة إجبارية بينما لا يزال Discord يشغل الإجابة الأولى، تُضاف إجابات الكلام المطابق اللاحقة إلى الطابور حتى يصبح التشغيل خاملًا بدلًا من استبدال الكلام في منتصف الجملة.
- في وضع `stt-tts`، يستخدم STT `tools.media.audio`؛ ولا يؤثر `voice.model` في النسخ.
- في أوضاع الوقت الفعلي، تضبط `voice.realtime.provider` و`voice.realtime.model` و`voice.realtime.speakerVoice` جلسة الصوت في الوقت الفعلي. لاستخدام OpenAI Realtime 2 مع عقل Codex، استخدم `voice.realtime.model: "gpt-realtime-2"` و`voice.model: "openai/gpt-5.5"`.
- تتضمن أوضاع الصوت في الوقت الفعلي افتراضيًا ملفات تعريف صغيرة `IDENTITY.md` و`USER.md` و`SOUL.md` في تعليمات مزود الوقت الفعلي، بحيث تحافظ الأدوار المباشرة السريعة على الهوية نفسها، وتأصيل المستخدم، والشخصية نفسها مثل وكيل OpenClaw الموجّه. عيّن `voice.realtime.bootstrapContextFiles` إلى مجموعة فرعية لتخصيص ذلك، أو `[]` لتعطيله. تقتصر ملفات تمهيد الوقت الفعلي المدعومة على ملفات التعريف تلك؛ ويبقى `AGENTS.md` في سياق الوكيل العادي. لا يستبدل سياق التعريف المحقون `openclaw_agent_consult` لعمل مساحة العمل، أو الحقائق الحالية، أو البحث في الذاكرة، أو الإجراءات المدعومة بالأدوات.
- في وضع الوقت الفعلي `agent-proxy` من OpenAI، عيّن `voice.realtime.requireWakeName: true` لإبقاء صوت Discord في الوقت الفعلي صامتًا حتى يبدأ النص أو ينتهي باسم تنبيه. يجب أن تكون أسماء التنبيه المضبوطة كلمة واحدة أو كلمتين. إذا لم يكن `voice.realtime.wakeNames` معيّنًا، يستخدم OpenClaw اسم `name` للوكيل الموجّه بالإضافة إلى `OpenClaw`، مع الرجوع إلى معرّف الوكيل بالإضافة إلى `OpenClaw`. يعطل حجب اسم التنبيه الاستجابة التلقائية لمزود الوقت الفعلي، ويوجه الأدوار المقبولة عبر مسار استشارة وكيل OpenClaw، ويعطي إقرارًا منطوقًا قصيرًا عند التعرف على اسم تنبيه في البداية من النسخ الجزئي قبل وصول النص النهائي.
- يقبل مزود OpenAI للوقت الفعلي أسماء أحداث Realtime 2 الحالية والأسماء المستعارة القديمة المتوافقة مع Codex لأحداث صوت المخرجات والنص، بحيث يمكن أن تنحرف لقطات المزود المتوافقة دون إسقاط صوت المساعد.
- يتحكم `voice.realtime.bargeIn` فيما إذا كانت أحداث بدء المتحدث في Discord تقاطع تشغيل الوقت الفعلي النشط. إذا لم يكن معيّنًا، فإنه يتبع إعداد مقاطعة صوت الإدخال الخاص بمزود الوقت الفعلي.
- يتحكم `voice.realtime.minBargeInAudioEndMs` في الحد الأدنى لمدة تشغيل المساعد قبل أن يؤدي تداخل الكلام في الوقت الفعلي من OpenAI إلى اقتطاع الصوت. الافتراضي: `250`. عيّنه إلى `0` للمقاطعة الفورية في الغرف منخفضة الصدى، أو ارفعه لإعدادات مكبرات الصوت كثيرة الصدى.
- لاستخدام صوت OpenAI في تشغيل Discord، عيّن `voice.tts.provider: "openai"` واختر صوت تحويل النص إلى كلام ضمن `voice.tts.providers.openai.speakerVoice`. يعد `cedar` اختيارًا جيدًا بصوت ذكوري على نموذج TTS الحالي من OpenAI.
- تنطبق تجاوزات `systemPrompt` لكل قناة في Discord على أدوار نص الصوت لتلك القناة الصوتية.
- تستمد أدوار نص الصوت حالة المالك من `allowFrom` في Discord (أو `dm.allowFrom`) للأوامر والإجراءات القنوية المحجوبة بالمالك. تتبع رؤية أدوات الوكيل سياسة الأدوات المضبوطة للجلسة الموجّهة.
- صوت Discord اختياري لإعدادات النص فقط؛ عيّن `channels.discord.voice.enabled=true` (أو احتفظ بكتلة `channels.discord.voice` موجودة) لتفعيل أوامر `/vc`، ووقت تشغيل الصوت، وهدف Gateway `GuildVoiceStates`.
- يمكن لـ `channels.discord.intents.voiceStates` تجاوز الاشتراك في هدف حالة الصوت صراحة. اتركه غير معيّن ليتبع الهدف التفعيل الفعلي للصوت.
- إذا كان لدى `voice.autoJoin` عدة إدخالات للنقابة نفسها، ينضم OpenClaw إلى آخر قناة مضبوطة لتلك النقابة.
- `voice.allowedChannels` هي قائمة سماح اختيارية للإقامة. اتركها غير معيّنة للسماح لـ `/vc join` بالدخول إلى أي قناة صوت Discord مصرح بها. عند تعيينها، تُقيّد أوامر `/vc join`، والانضمام التلقائي عند بدء التشغيل، وانتقالات حالة صوت البوت، بالإدخالات المدرجة `{ guildId, channelId }`. عيّنها إلى مصفوفة فارغة لرفض جميع انضمامات صوت Discord. إذا نقل Discord البوت خارج قائمة السماح، يغادر OpenClaw تلك القناة ويعيد الانضمام إلى هدف الانضمام التلقائي المضبوط عندما يكون متاحًا.
- يمرر `voice.daveEncryption` و`voice.decryptionFailureTolerance` إلى خيارات انضمام `@discordjs/voice`.
- القيم الافتراضية لـ `@discordjs/voice` هي `daveEncryption=true` و`decryptionFailureTolerance=24` إذا لم تكن معيّنة.
- يستخدم OpenClaw برنامج الترميز المضمن `libopus-wasm` لاستقبال صوت Discord وتشغيل PCM الخام في الوقت الفعلي. وهو يشحن بنية WebAssembly مثبتة من libopus ولا يتطلب إضافات opus أصلية.
- يتحكم `voice.connectTimeoutMs` في انتظار Ready الأولي لـ `@discordjs/voice` لمحاولات `/vc join` والانضمام التلقائي. الافتراضي: `30000`.
- يتحكم `voice.reconnectGraceMs` في مدة انتظار OpenClaw لجلسة صوتية منقطعة لتبدأ إعادة الاتصال قبل إتلافها. الافتراضي: `15000`.
- في وضع `stt-tts`، لا يتوقف تشغيل الصوت لمجرد أن مستخدمًا آخر بدأ الكلام. لتجنب حلقات التغذية الراجعة، يتجاهل OpenClaw التقاط الصوت الجديد أثناء تشغيل TTS؛ تحدث بعد انتهاء التشغيل للدور التالي. تمرر أوضاع الوقت الفعلي بدايات المتحدث كإشارات تداخل كلام إلى مزود الوقت الفعلي.
- في أوضاع الوقت الفعلي، قد يبدو الصدى من مكبرات الصوت إلى ميكروفون مفتوح كتداخل كلام ويقاطع التشغيل. لغرف Discord كثيرة الصدى، عيّن `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` لمنع OpenAI من المقاطعة التلقائية عند صوت الإدخال. أضف `voice.realtime.bargeIn: true` إذا كنت لا تزال تريد من أحداث بدء المتحدث في Discord مقاطعة التشغيل النشط. يتجاهل جسر الوقت الفعلي من OpenAI اقتطاعات التشغيل الأقصر من `voice.realtime.minBargeInAudioEndMs` بوصفها صدى/ضجيجًا محتملًا ويسجلها كمتخطاة بدلًا من مسح تشغيل Discord.
- يتحكم `voice.captureSilenceGraceMs` في مدة انتظار OpenClaw بعد أن يبلغ Discord أن متحدثًا توقف قبل إنهاء ذلك المقطع الصوتي لـ STT. الافتراضي: `2000`؛ ارفع هذه القيمة إذا كان Discord يقسم الوقفات العادية إلى نصوص جزئية متقطعة.
- عندما يكون ElevenLabs هو مزود TTS المحدد، يستخدم تشغيل صوت Discord TTS المتدفق ويبدأ من دفق استجابة المزود. تعود المزودات التي لا تدعم التدفق إلى مسار ملف مؤقت مُصنّع.
- يراقب OpenClaw أيضًا حالات فشل فك تشفير الاستقبال ويتعافى تلقائيًا عبر مغادرة/إعادة الانضمام إلى قناة الصوت بعد حالات فشل متكررة في نافذة قصيرة.
- إذا أظهرت سجلات الاستقبال بشكل متكرر `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` بعد التحديث، فاجمع تقرير تبعيات وسجلات. يتضمن سطر `@discordjs/voice` المضمن إصلاح الحشو من المنبع من PR رقم #11449 في discord.js، والذي أغلق issue رقم #11419 في discord.js.
- أحداث الاستقبال `The operation was aborted` متوقعة عندما ينهي OpenClaw مقطع متحدث ملتقط؛ فهي تشخيصات مفصلة، وليست تحذيرات.
- تتضمن سجلات صوت Discord المفصلة معاينة محدودة من سطر واحد لنص STT لكل مقطع متحدث مقبول، بحيث يوضح التصحيح كلاً من جانب المستخدم وجانب رد الوكيل دون تفريغ نص غير محدود.
- في وضع `agent-proxy`، يتخطى رجوع الاستشارة الإجبارية أجزاء النص التي تبدو غير مكتملة مثل النص المنتهي بـ `...` أو موصل لاحق مثل `and`، بالإضافة إلى عبارات الإغلاق الواضحة غير القابلة للتنفيذ مثل “be right back” أو “bye”. تعرض السجلات `forced agent consult skipped reason=...` عندما يمنع ذلك إجابة قديمة في الطابور.

### متابعة المستخدمين في الصوت

استخدم `voice.followUsers` عندما تريد أن يبقى بوت صوت Discord مع مستخدم Discord معروف واحد أو أكثر بدلًا من الانضمام إلى قناة ثابتة عند بدء التشغيل أو انتظار `/vc join`.

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
- القيمة الافتراضية لـ `followUsersEnabled` هي `true` عند ضبط `followUsers`. عيّنها إلى `false` للاحتفاظ بالقائمة المحفوظة مع إيقاف المتابعة الصوتية التلقائية.
- عندما ينضم مستخدم متابَع إلى قناة صوت مسموح بها، ينضم OpenClaw إلى تلك القناة. عندما ينتقل المستخدم، ينتقل OpenClaw معه. عندما ينقطع المستخدم المتابَع النشط، يغادر OpenClaw.
- إذا كان عدة مستخدمين متابَعين في النقابة نفسها وغادر المستخدم المتابَع النشط، ينتقل OpenClaw إلى قناة مستخدم متابَع آخر متعقَّب قبل مغادرة النقابة. إذا انتقل عدة مستخدمين متابَعين في وقت واحد، يفوز أحدث حدث حالة صوت تمت ملاحظته.
- لا يزال `allowedChannels` مطبقًا. يتم تجاهل المستخدم المتابَع في قناة غير مسموح بها، وتنتقل الجلسة المملوكة للمتابعة إلى مستخدم متابَع آخر أو تغادر.
- يصالح OpenClaw أحداث حالة الصوت الفائتة عند بدء التشغيل وعلى فاصل محدود. تأخذ المصالحة عينات من النقابات المضبوطة وتحد من عمليات بحث REST لكل تشغيل، لذلك قد تحتاج قوائم `followUsers` الكبيرة جدًا إلى أكثر من فاصل واحد لتتقارب.
- إذا نقل Discord أو مسؤول البوت أثناء متابعته مستخدمًا، يعيد OpenClaw بناء جلسة الصوت ويحافظ على ملكية المتابعة عندما تكون الوجهة مسموحًا بها. إذا نُقل البوت خارج `allowedChannels`، يغادر OpenClaw ويعيد الانضمام إلى الهدف المضبوط عند وجوده.
- قد يغادر استرداد استقبال DAVE القناة نفسها ويعيد الانضمام إليها بعد حالات فشل فك تشفير متكررة. تحتفظ الجلسات المملوكة للمتابعة بملكية المتابعة عبر مسار الاسترداد هذا، لذلك لا يزال انقطاع مستخدم متابَع لاحق يغادر القناة.

اختر بين أوضاع الانضمام:

- استخدم `followUsers` لإعدادات شخصية أو تشغيلية حيث يجب أن يكون البوت تلقائيًا في الصوت عندما تكون أنت فيه.
- استخدم `autoJoin` للبوتات ذات الغرف الثابتة التي يجب أن تكون موجودة حتى عندما لا يكون أي مستخدم متعقَّب في الصوت.
- استخدم `/vc join` للانضمامات لمرة واحدة أو الغرف التي سيكون فيها الوجود الصوتي التلقائي مفاجئًا.

برنامج ترميز صوت Discord:

- تُظهر سجلات استقبال الصوت `discord voice: opus decoder: libopus-wasm`.
- يرمّز التشغيل في الوقت الحقيقي PCM خامًا ستيريو بتردد 48 kHz إلى Opus باستخدام حزمة `libopus-wasm` المضمّنة نفسها قبل تسليم الحزم إلى `@discordjs/voice`.
- يحوّل تشغيل الملفات وتدفقات المزوّد إلى PCM خام ستيريو بتردد 48 kHz باستخدام ffmpeg، ثم يستخدم `libopus-wasm` لتدفق حزم Opus المرسل إلى Discord.

مسار STT مع TTS:

- يُحوَّل التقاط PCM من Discord إلى ملف WAV مؤقت.
- يتولى `tools.media.audio` معالجة STT، مثل `openai/gpt-4o-mini-transcribe`.
- تُرسل النسخة النصية عبر دخول Discord والتوجيه بينما يعمل LLM الخاص بالاستجابة بسياسة إخراج صوتي تخفي أداة الوكيل `tts` وتطلب نصًا مُعادًا، لأن صوت Discord يملك تشغيل TTS النهائي.
- عند ضبط `voice.model`، فإنه يتجاوز فقط LLM الخاص بالاستجابة لهذه الدورة في قناة الصوت.
- يُدمج `voice.tts` فوق `messages.tts`؛ يزوّد المزوّدون الداعمون للبث المشغّل مباشرة، وإلا فيُشغَّل ملف الصوت الناتج في القناة المنضم إليها.

مثال افتراضي لجلسة قناة صوتية عبر وكيل الوكيل:

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

من دون كتلة `voice.agentSession`، تحصل كل قناة صوتية على جلسة OpenClaw موجّهة خاصة بها. على سبيل المثال، يتحدث `/vc join channel:234567890123456789` إلى الجلسة الخاصة بتلك القناة الصوتية في Discord. نموذج الوقت الحقيقي هو الواجهة الصوتية فقط؛ أما الطلبات الجوهرية فتُسلَّم إلى وكيل OpenClaw المُكوَّن. إذا أنتج نموذج الوقت الحقيقي نسخة نصية نهائية من دون استدعاء أداة الاستشارة، يفرض OpenClaw الاستشارة كآلية احتياطية حتى يظل السلوك الافتراضي مماثلًا للتحدث إلى الوكيل.

مثال STT مع TTS قديم:

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

مثال ثنائي الاتجاه في الوقت الحقيقي:

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

في وضع `agent-proxy` ينضم البوت إلى قناة الصوت المُكوَّنة، لكن دورات وكيل OpenClaw تستخدم الجلسة والوكيل الموجّهين العاديين للقناة الهدف. تنطق جلسة الصوت في الوقت الحقيقي النتيجة المُعادة داخل قناة الصوت. لا يزال بإمكان وكيل الإشراف استخدام أدوات الرسائل العادية وفقًا لسياسة أدواته، بما في ذلك إرسال رسالة Discord منفصلة إذا كان ذلك هو الإجراء الصحيح.

أثناء نشاط تشغيل OpenClaw مفوّض، تُعامل نسخ Discord الصوتية الجديدة كتحكم مباشر في التشغيل قبل بدء دورة وكيل أخرى. تُصنَّف عبارات مثل "الحالة"، أو "ألغِ ذلك"، أو "استخدم الإصلاح الأصغر"، أو "عند الانتهاء تحقق أيضًا من الاختبارات" كمدخلات حالة أو إلغاء أو توجيه أو متابعة للجلسة النشطة. تُنطق نتائج الحالة والإلغاء والتوجيه المقبول والمتابعة داخل قناة الصوت حتى يعرف المتصل ما إذا كان OpenClaw قد عالج الطلب.

أشكال الأهداف المفيدة:

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

استخدم هذا عندما يسمع النموذج تشغيله الخاص في Discord عبر ميكروفون مفتوح، لكنك لا تزال تريد مقاطعته بالكلام. يمنع OpenClaw OpenAI من المقاطعة التلقائية عند الصوت الخام الداخل، بينما يسمح `bargeIn: true` لأحداث بدء المتحدث في Discord وصوت المتحدث النشط مسبقًا بإلغاء استجابات الوقت الحقيقي النشطة قبل وصول الدورة الملتقطة التالية إلى OpenAI. تُعامل إشارات المقاطعة المبكرة جدًا ذات `audioEndMs` الأقل من `minBargeInAudioEndMs` على أنها على الأرجح صدى/ضجيج وتُتجاهل حتى لا يقطع النموذج عند أول إطار تشغيل.

سجلات الصوت المتوقعة:

- عند الانضمام: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- عند بدء الوقت الحقيقي: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- عند صوت المتحدث: `discord voice: realtime speaker turn opened ...`، و`discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`، و`discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- عند تخطي كلام قديم: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` أو `reason=non-actionable-closing ...`
- عند اكتمال استجابة الوقت الحقيقي: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- عند إيقاف/إعادة ضبط التشغيل: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- عند استشارة الوقت الحقيقي: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- عند إجابة الوكيل: `discord voice: agent turn answer ...`
- عند وضع كلام مطابق في الطابور: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`، متبوعًا بـ `discord voice: realtime exact speech dequeued reason=player-idle ...`
- عند اكتشاف المقاطعة: `discord voice: realtime barge-in detected source=speaker-start ...` أو `discord voice: realtime barge-in detected source=active-speaker-audio ...`، متبوعًا بـ `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- عند مقاطعة الوقت الحقيقي: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`، متبوعًا إما بـ `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` أو `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- عند تجاهل الصدى/الضجيج: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- عند تعطيل المقاطعة: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- عند التشغيل الخامل: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

لتصحيح الصوت المقطوع، اقرأ سجلات الصوت في الوقت الحقيقي كخط زمني:

1. يعني `realtime audio playback started` أن Discord بدأ تشغيل صوت المساعد. يبدأ الجسر من هذه النقطة في عدّ مقاطع إخراج المساعد، وبايتات PCM الخاصة بـ Discord، وبايتات مزوّد الوقت الحقيقي، ومدة الصوت المركّب.
2. يحدد `realtime speaker turn opened` أن متحدثًا في Discord أصبح نشطًا. إذا كان التشغيل نشطًا بالفعل وكان `bargeIn` مفعّلًا، فقد يتبعه `barge-in detected source=speaker-start`.
3. يحدد `realtime input audio started` أول إطار صوت فعلي مستلَم لتلك دورة المتحدث. يعني `outputActive=true` أو قيمة غير صفرية لـ `outputAudioMs` هنا أن الميكروفون يرسل إدخالًا بينما لا يزال تشغيل المساعد نشطًا.
4. يعني `barge-in detected source=active-speaker-audio` أن OpenClaw رأى صوت متحدث حيًا بينما كان تشغيل المساعد نشطًا. هذا مفيد للتمييز بين مقاطعة حقيقية وحدث بدء متحدث في Discord بلا صوت مفيد.
5. يعني `barge-in requested reason=...` أن OpenClaw طلب من مزوّد الوقت الحقيقي إلغاء الاستجابة النشطة أو اقتطاعها. ويتضمن `outputAudioMs` و`outputActive` و`playbackChunks` حتى تتمكن من معرفة مقدار صوت المساعد الذي شُغّل فعليًا قبل المقاطعة.
6. يمثل `realtime audio playback stopped reason=...` نقطة إعادة ضبط تشغيل Discord المحلية. يوضح السبب من أوقف التشغيل: `barge-in`، أو `player-idle`، أو `provider-clear-audio`، أو `forced-agent-consult`، أو `stream-close`، أو `session-close`.
7. يلخص `realtime speaker turn closed` دورة الإدخال الملتقطة. تعني `chunks=0` أو `hasAudio=false` أن دورة المتحدث فُتحت لكن لم يصل صوت قابل للاستخدام إلى جسر الوقت الحقيقي. تعني `interruptedPlayback=true` أن دورة الإدخال تلك تداخلت مع إخراج المساعد وشغّلت منطق المقاطعة.

حقول مفيدة:

- `outputAudioMs`: مدة صوت المساعد التي ولّدها مزوّد الوقت الحقيقي قبل سطر السجل.
- `audioMs`: مدة صوت المساعد التي عدّها OpenClaw قبل توقف التشغيل.
- `elapsedMs`: وقت الساعة الفعلي بين فتح وإغلاق تدفق التشغيل أو دورة المتحدث.
- `discordBytes`: بايتات PCM ستيريو بتردد 48 kHz المُرسلة إلى صوت Discord أو المستلمة منه.
- `realtimeBytes`: بايتات PCM بصيغة المزوّد المُرسلة إلى مزوّد الوقت الحقيقي أو المستلمة منه.
- `playbackChunks`: مقاطع صوت المساعد المُمررة إلى Discord للاستجابة النشطة.
- `sinceLastAudioMs`: الفجوة بين آخر إطار صوت متحدث ملتقط وإغلاق دورة المتحدث.

أنماط شائعة:

- يشير الانقطاع الفوري مع `source=active-speaker-audio` و`outputAudioMs` صغير والمستخدم نفسه قريبًا عادةً إلى دخول صدى السماعة إلى الميكروفون. ارفع `voice.realtime.minBargeInAudioEndMs`، أو اخفض مستوى صوت السماعة، أو استخدم سماعات الرأس، أو اضبط `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- يعني `source=speaker-start` متبوعًا بـ `speaker turn closed ... hasAudio=false` أن Discord أبلغ عن بدء متحدث لكن لم يصل أي صوت إلى OpenClaw. قد يكون ذلك حدث صوت Discord عابرًا، أو سلوك بوابة ضجيج، أو تشغيل العميل للميكروفون لفترة وجيزة.
- يعني `audio playback stopped reason=stream-close` من دون مقاطعة قريبة أو `provider-clear-audio` أن تدفق تشغيل Discord المحلي انتهى على نحو غير متوقع. تحقق من سجلات المزوّد ومشغّل Discord السابقة.
- يعني `capture ignored during playback (barge-in disabled)` أن OpenClaw أسقط الإدخال عمدًا بينما كان صوت المساعد نشطًا. فعّل `voice.realtime.bargeIn` إذا أردت أن يقاطع الكلام التشغيل.
- يعني `barge-in ignored ... outputActive=false` أن Discord أو VAD الخاص بالمزوّد أبلغ عن كلام، لكن لم يكن لدى OpenClaw تشغيل نشط لمقاطعته. لا ينبغي أن يقطع هذا الصوت.

تُحل بيانات الاعتماد لكل مكوّن: مصادقة مسار LLM لـ `voice.model`، ومصادقة STT لـ `tools.media.audio`، ومصادقة TTS لـ `messages.tts`/`voice.tts`، ومصادقة مزوّد الوقت الحقيقي لـ `voice.realtime.providers` أو إعداد مصادقة المزوّد العادي.

### الرسائل الصوتية

تعرض رسائل Discord الصوتية معاينة شكل موجي وتتطلب صوت OGG/Opus. ينشئ OpenClaw الشكل الموجي تلقائيًا، لكنه يحتاج إلى `ffmpeg` و`ffprobe` على مضيف Gateway للفحص والتحويل.

- وفّر **مسار ملف محليًا** (تُرفض عناوين URL).
- احذف محتوى النص (يرفض Discord النص + الرسالة الصوتية في الحمولة نفسها).
- يُقبل أي تنسيق صوتي؛ يحوّل OpenClaw إلى OGG/Opus عند الحاجة.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="استخدام نوايا غير مسموح بها أو عدم رؤية البوت رسائل الخادم">

    - فعّل Message Content Intent
    - فعّل Server Members Intent عندما تعتمد على حلّ المستخدم/العضو
    - أعد تشغيل Gateway بعد تغيير النوايا

  </Accordion>

  <Accordion title="حظر رسائل الخادم بشكل غير متوقع">

    - تحقّق من `groupPolicy`
    - تحقّق من قائمة سماح الخوادم ضمن `channels.discord.guilds`
    - إذا كانت خريطة `channels` للخادم موجودة، فلن يُسمح إلا بالقنوات المدرجة
    - تحقّق من سلوك `requireMention` وأنماط الإشارة

    فحوصات مفيدة:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="طلب الإشارة معطّل لكن الحظر ما زال يحدث">
    الأسباب الشائعة:

    - `groupPolicy="allowlist"` من دون قائمة سماح مطابقة للخادم/القناة
    - تكوين `requireMention` في الموضع الخطأ (يجب أن يكون ضمن `channels.discord.guilds` أو إدخال القناة)
    - حظر المُرسل بواسطة قائمة سماح `users` للخادم/القناة

  </Accordion>

  <Accordion title="دورات Discord طويلة التشغيل أو ردود مكررة">

    السجلات النموذجية:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    عناصر ضبط طابور Discord Gateway:

    - حساب واحد: `channels.discord.eventQueue.listenerTimeout`
    - حسابات متعددة: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - يتحكم هذا فقط في عمل مستمع Discord Gateway، وليس في عمر دورة الوكيل

    لا يطبّق Discord مهلة مملوكة للقناة على دورات الوكيل الموضوعة في الطابور. يسلّم مستمعو الرسائل العمل فورًا، وتحافظ عمليات تشغيل Discord الموضوعة في الطابور على الترتيب لكل جلسة إلى أن تكتمل دورة حياة الجلسة/الأداة/وقت التشغيل أو تُجهض العمل.

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
    يجلب OpenClaw بيانات Discord الوصفية `/gateway/bot` قبل الاتصال. تعود حالات الفشل العابرة إلى عنوان Gateway الافتراضي لدى Discord وتُقيَّد في السجلات بمعدل محدد.

    عناصر ضبط مهلة البيانات الوصفية:

    - حساب واحد: `channels.discord.gatewayInfoTimeoutMs`
    - حسابات متعددة: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - احتياطي env عندما لا يكون التكوين معيّنًا: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - الافتراضي: `30000` (30 ثانية)، الحد الأقصى: `120000`

  </Accordion>

  <Accordion title="إعادات تشغيل مهلة READY في Gateway">
    ينتظر OpenClaw حدث `READY` من Gateway الخاص بـ Discord أثناء بدء التشغيل وبعد إعادة اتصال وقت التشغيل. قد تحتاج إعدادات الحسابات المتعددة مع تدرّج بدء التشغيل إلى نافذة READY أطول عند بدء التشغيل من القيمة الافتراضية.

    عناصر ضبط مهلة READY:

    - بدء التشغيل لحساب واحد: `channels.discord.gatewayReadyTimeoutMs`
    - بدء التشغيل لحسابات متعددة: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - احتياطي env لبدء التشغيل عندما لا يكون التكوين معيّنًا: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - افتراضي بدء التشغيل: `15000` (15 ثانية)، الحد الأقصى: `120000`
    - وقت التشغيل لحساب واحد: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - وقت التشغيل لحسابات متعددة: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - احتياطي env لوقت التشغيل عندما لا يكون التكوين معيّنًا: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - افتراضي وقت التشغيل: `30000` (30 ثانية)، الحد الأقصى: `120000`

  </Accordion>

  <Accordion title="عدم تطابق تدقيق الأذونات">
    لا تعمل فحوصات أذونات `channels status --probe` إلا مع معرّفات القنوات الرقمية.

    إذا كنت تستخدم مفاتيح slug، فقد تستمر المطابقة في وقت التشغيل بالعمل، لكن لا يستطيع الفحص التحقّق الكامل من الأذونات.

  </Accordion>

  <Accordion title="مشكلات الرسائل المباشرة والاقتران">

    - الرسائل المباشرة معطّلة: `channels.discord.dm.enabled=false`
    - سياسة الرسائل المباشرة معطّلة: `channels.discord.dmPolicy="disabled"` (قديم: `channels.discord.dm.policy`)
    - في انتظار موافقة الاقتران في وضع `pairing`

  </Accordion>

  <Accordion title="حلقات بوت إلى بوت">
    تُتجاهل افتراضيًا الرسائل المنشأة بواسطة البوتات.

    إذا عيّنت `channels.discord.allowBots=true`، فاستخدم قواعد صارمة للإشارات وقوائم السماح لتجنب سلوك الحلقات.
    فضّل `channels.discord.allowBots="mentions"` لقبول رسائل البوتات التي تشير إلى البوت فقط.

    يشحن OpenClaw أيضًا [حماية حلقات البوتات](/ar/channels/bot-loop-protection) المشتركة. كلما سمح `allowBots` للرسائل المنشأة بواسطة البوتات بالوصول إلى الإرسال، يربط Discord الحدث الوارد بحقائق `(account, channel, bot pair)` ويمنع حارس الزوج العام الزوج بعد تجاوزه ميزانية الأحداث المكوّنة. يمنع الحارس حلقات بوتين جامحة كان يجب إيقافها سابقًا عبر حدود معدل Discord؛ ولا يؤثر في عمليات نشر بوت واحد أو ردود البوت لمرة واحدة التي تبقى ضمن الميزانية.

    الإعدادات الافتراضية (نشطة عند تعيين `allowBots`):

    - `maxEventsPerWindow: 20` -- يمكن لزوج البوتات تبادل 20 رسالة ضمن النافذة المنزلقة
    - `windowSeconds: 60` -- طول النافذة المنزلقة
    - `cooldownSeconds: 60` -- بمجرد تجاوز الميزانية، تُسقط كل رسالة إضافية من بوت إلى بوت في أي اتجاه لمدة دقيقة واحدة

    كوّن الإعداد الافتراضي المشترك مرة واحدة ضمن `channels.defaults.botLoopProtection`، ثم تجاوز Discord عندما يحتاج سير عمل مشروع إلى مساحة أكبر. تكون الأسبقية:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - الإعدادات الافتراضية المضمنة

    يستخدم Discord المفاتيح العامة `maxEventsPerWindow` و`windowSeconds` و`cooldownSeconds`.

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

  <Accordion title="إسقاطات STT الصوتية مع DecryptionFailed(...)">

    - أبقِ OpenClaw محدّثًا (`openclaw update`) لضمان وجود منطق استعادة استقبال صوت Discord
    - أكّد أن `channels.discord.voice.daveEncryption=true` (افتراضي)
    - ابدأ من `channels.discord.voice.decryptionFailureTolerance=24` (افتراضي المنبع) واضبطه فقط عند الحاجة
    - راقب السجلات بحثًا عن:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - إذا استمرت حالات الفشل بعد إعادة الانضمام التلقائية، فاجمع السجلات وقارنها بسجل استقبال DAVE في المنبع في [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) و[discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## مرجع التكوين

المرجع الأساسي: [مرجع التكوين - Discord](/ar/gateway/config-channels#discord).

<Accordion title="حقول Discord عالية الأهمية">

- بدء التشغيل/المصادقة: `enabled`، `token`، `accounts.*`، `allowBots`
- السياسة: `groupPolicy`، `dm.*`، `guilds.*`، `guilds.*.channels.*`
- الأمر: `commands.native`، `commands.useAccessGroups`، `configWrites`، `slashCommand.*`
- طابور الأحداث: `eventQueue.listenerTimeout` (ميزانية المستمع)، `eventQueue.maxQueueSize`، `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`، `gatewayReadyTimeoutMs`، `gatewayRuntimeReadyTimeoutMs`
- الرد/السجل: `replyToMode`، `historyLimit`، `dmHistoryLimit`، `dms.*.historyLimit`
- التسليم: `textChunkLimit`، `chunkMode`، `maxLinesPerMessage`
- البث: `streaming` (اسم مستعار قديم: `streamMode`)، `streaming.preview.toolProgress`، `draftChunk`، `blockStreaming`، `blockStreamingCoalesce`
- الوسائط/إعادة المحاولة: `mediaMaxMb` (يحدّ رفع ملفات Discord الصادرة، الافتراضي `100MB`)، `retry`
- الإجراءات: `actions.*`
- الحضور: `activity`، `status`، `activityType`، `activityUrl`
- واجهة المستخدم: `ui.components.accentColor`
- الميزات: `threadBindings`، `bindings[]` في المستوى الأعلى (`type: "acp"`)، `pluralkit`، `execApprovals`، `intents`، `agentComponents.enabled`، `agentComponents.ttlMs`، `heartbeat`، `responsePrefix`

</Accordion>

## السلامة والتشغيل

- تعامل مع رموز البوتات كأسرار (يُفضّل `DISCORD_BOT_TOKEN` في البيئات الخاضعة للإشراف).
- امنح أذونات Discord بأقل صلاحية لازمة.
- إذا كانت حالة نشر/أوامر الأوامر قديمة، فأعد تشغيل Gateway وأعد التحقق باستخدام `openclaw channels status --probe`.

## ذات صلة

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
    اربط الخوادم والقنوات بالوكلاء.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلية.
  </Card>
</CardGroup>

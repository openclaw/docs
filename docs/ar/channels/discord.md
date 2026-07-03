---
read_when:
    - العمل على ميزات قناة Discord
summary: حالة دعم بوت Discord وإمكاناته وتكوينه
title: Discord
x-i18n:
    generated_at: "2026-07-03T02:47:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b7e8724b02baa1a2dba1ac932e20533c9293b6021f30b1a79107349c34f195e5
    source_path: channels/discord.md
    workflow: 16
---

جاهز للرسائل المباشرة وقنوات الخوادم عبر Gateway الرسمي لـ Discord.

<CardGroup cols={3}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    تستخدم رسائل Discord المباشرة وضع الاقتران افتراضيًا.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلية وفهرس الأوامر.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عبر القنوات ومسار الإصلاح.
  </Card>
</CardGroup>

## الإعداد السريع

ستحتاج إلى إنشاء تطبيق جديد مع بوت، وإضافة البوت إلى خادمك، وإقرانه مع OpenClaw. نوصي بإضافة البوت إلى خادمك الخاص. إذا لم يكن لديك خادم بعد، [أنشئ واحدًا أولًا](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (اختر **Create My Own > For me and my friends**).

<Steps>
  <Step title="إنشاء تطبيق Discord وبوت">
    انتقل إلى [بوابة مطوري Discord](https://discord.com/developers/applications) وانقر على **New Application**. سمّه شيئًا مثل "OpenClaw".

    انقر على **Bot** في الشريط الجانبي. اضبط **Username** على أي اسم تطلقه على وكيل OpenClaw لديك.

  </Step>

  <Step title="تفعيل النوايا ذات الامتيازات">
    بينما لا تزال في صفحة **Bot**، مرّر لأسفل إلى **Privileged Gateway Intents** وفعّل:

    - **Message Content Intent** (مطلوب)
    - **Server Members Intent** (موصى به؛ مطلوب لقوائم السماح بالأدوار ومطابقة الاسم بالمعرّف)
    - **Presence Intent** (اختياري؛ مطلوب فقط لتحديثات الحضور)

  </Step>

  <Step title="نسخ رمز البوت">
    مرّر للأعلى مرة أخرى في صفحة **Bot** وانقر على **Reset Token**.

    <Note>
    رغم الاسم، فهذا ينشئ رمزك الأول — لا يتم "إعادة تعيين" أي شيء.
    </Note>

    انسخ الرمز واحفظه في مكان ما. هذا هو **Bot Token** الخاص بك وستحتاج إليه قريبًا.

  </Step>

  <Step title="إنشاء عنوان URL للدعوة وإضافة البوت إلى خادمك">
    انقر على **OAuth2** في الشريط الجانبي. ستنشئ عنوان URL للدعوة بالأذونات الصحيحة لإضافة البوت إلى خادمك.

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

    هذه هي المجموعة الأساسية لقنوات النص العادية. إذا كنت تخطط للنشر في سلاسل Discord، بما في ذلك تدفقات عمل قنوات المنتدى أو الوسائط التي تنشئ سلسلة أو تتابعها، ففعّل أيضًا **Send Messages in Threads**.
    انسخ عنوان URL الذي تم إنشاؤه في الأسفل، والصقه في متصفحك، وحدد خادمك، وانقر على **Continue** للاتصال. يجب أن ترى الآن البوت في خادم Discord.

  </Step>

  <Step title="تفعيل وضع المطور وجمع معرّفاتك">
    في تطبيق Discord مرة أخرى، تحتاج إلى تفعيل وضع المطور حتى تتمكن من نسخ المعرّفات الداخلية.

    1. انقر على **User Settings** (أيقونة الترس بجانب صورتك الرمزية) ← مرّر إلى **Developer** في الشريط الجانبي ← فعّل **Developer Mode**

        *(ملاحظة: في تطبيق Discord للجوال، يوجد وضع المطور تحت **App Settings** ← **Advanced**)*

    2. انقر بزر الماوس الأيمن على **أيقونة الخادم** في الشريط الجانبي ← **Copy Server ID**
    3. انقر بزر الماوس الأيمن على **صورتك الرمزية** ← **Copy User ID**

    احفظ **Server ID** و**User ID** بجانب Bot Token — سترسل الثلاثة جميعًا إلى OpenClaw في الخطوة التالية.

  </Step>

  <Step title="السماح بالرسائل المباشرة من أعضاء الخادم">
    لكي يعمل الاقتران، يحتاج Discord إلى السماح للبوت بإرسال رسالة مباشرة إليك. انقر بزر الماوس الأيمن على **أيقونة الخادم** ← **Privacy Settings** ← فعّل **Direct Messages**.

    يتيح هذا لأعضاء الخادم (بما في ذلك البوتات) إرسال رسائل مباشرة إليك. أبقِ هذا مفعّلًا إذا كنت تريد استخدام رسائل Discord المباشرة مع OpenClaw. إذا كنت تخطط لاستخدام قنوات الخادم فقط، يمكنك تعطيل الرسائل المباشرة بعد الاقتران.

  </Step>

  <Step title="تعيين رمز البوت بأمان (لا ترسله في المحادثة)">
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
    لتثبيتات الخدمة المُدارة، شغّل `openclaw gateway install` من صدفة يكون فيها `DISCORD_BOT_TOKEN` موجودًا، أو خزّن المتغير في `~/.openclaw/.env`، حتى تتمكن الخدمة من حل SecretRef الخاص بالبيئة بعد إعادة التشغيل.
    إذا كان مضيفك محظورًا أو محدود المعدل بسبب بحث تطبيق بدء التشغيل في Discord، فعيّن معرّف تطبيق/عميل Discord من بوابة المطورين حتى يتمكن بدء التشغيل من تخطي استدعاء REST هذا. استخدم `channels.discord.applicationId` للحساب الافتراضي، أو `channels.discord.accounts.<accountId>.applicationId` عند تشغيل عدة بوتات Discord.

  </Step>

  <Step title="تكوين OpenClaw والاقتران">

    <Tabs>
      <Tab title="اسأل وكيلك">
        تحدّث مع وكيل OpenClaw عبر أي قناة موجودة (مثل Telegram) وأخبره. إذا كان Discord هو قناتك الأولى، فاستخدم تبويب CLI / config بدلًا من ذلك.

        > "لقد عيّنت بالفعل رمز بوت Discord الخاص بي في التكوين. يُرجى إكمال إعداد Discord باستخدام User ID `<user_id>` وServer ID `<server_id>`."
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

        للإعداد البرمجي أو البعيد، اكتب كتلة JSON5 نفسها باستخدام `openclaw config patch --file ./discord.patch.json5 --dry-run` ثم أعد التشغيل بدون `--dry-run`. قيم `token` بنص صريح مدعومة. قيم SecretRef مدعومة أيضًا لـ `channels.discord.token` عبر موفري env/file/exec. راجع [إدارة الأسرار](/ar/gateway/secrets).

        لعدة بوتات Discord، احتفظ بكل رمز بوت ومعرّف تطبيق تحت حسابه. يرث الحسابان `channels.discord.applicationId` في المستوى الأعلى، لذا عيّنه هناك فقط عندما ينبغي أن يستخدم كل حساب معرّف التطبيق نفسه.

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

  <Step title="الموافقة على أول اقتران عبر رسالة مباشرة">
    انتظر حتى يكون Gateway قيد التشغيل، ثم أرسل رسالة مباشرة إلى البوت في Discord. سيرد برمز اقتران.

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

    يجب أن تتمكن الآن من الدردشة مع وكيلك في Discord عبر رسالة مباشرة.

  </Step>
</Steps>

<Note>
حل الرمز يراعي الحساب. قيم رمز التكوين تتفوق على احتياطي البيئة. يُستخدم `DISCORD_BOT_TOKEN` للحساب الافتراضي فقط.
إذا تم حل حسابين مفعّلين في Discord إلى رمز البوت نفسه، يبدأ OpenClaw مراقب Gateway واحدًا فقط لذلك الرمز. يتفوق الرمز المأخوذ من التكوين على احتياطي البيئة الافتراضي؛ وإلا يفوز أول حساب مفعّل ويتم الإبلاغ عن تعطيل الحساب المكرر.
للاستدعاءات الصادرة المتقدمة (إجراءات أداة الرسائل/القنوات)، يُستخدم `token` صريح لكل استدعاء لذلك الاستدعاء. ينطبق هذا على إجراءات الإرسال والقراءة/التحقق مثل (على سبيل المثال read/search/fetch/thread/pins/permissions). لا تزال إعدادات سياسة الحساب/إعادة المحاولة تأتي من الحساب المحدد في لقطة وقت التشغيل النشطة.
</Note>

## موصى به: إعداد مساحة عمل للخادم

بعد أن تعمل الرسائل المباشرة، يمكنك إعداد خادم Discord الخاص بك كمساحة عمل كاملة حيث تحصل كل قناة على جلسة وكيل خاصة بها وسياق خاص بها. يُوصى بهذا للخوادم الخاصة التي تكون لك أنت وبوتك فقط.

<Steps>
  <Step title="إضافة خادمك إلى قائمة السماح للخوادم">
    يتيح هذا لوكيلك الرد في أي قناة على خادمك، وليس فقط في الرسائل المباشرة.

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
    افتراضيًا، لا يرد وكيلك في قنوات الخادم إلا عند @ذكره. بالنسبة إلى خادم خاص، ربما تريد أن يرد على كل رسالة.

    في قنوات الخادم، تُنشر الردود العادية تلقائيًا افتراضيًا. بالنسبة إلى الغرف المشتركة الدائمة التشغيل، اختر `messages.groupChat.visibleReplies: "message_tool"` حتى يتمكن الوكيل من الترقب والنشر فقط عندما يقرر أن الرد في القناة مفيد. يعمل هذا بأفضل شكل مع أحدث جيل من النماذج الموثوقة في الأدوات مثل GPT 5.5. تبقى أحداث الغرفة المحيطة صامتة ما لم ترسل الأداة. راجع [أحداث الغرفة المحيطة](/ar/channels/ambient-room-events) للتكوين الكامل لوضع الترقب.

    إذا عرض Discord الكتابة وأظهرت السجلات استخدام الرمز المميز ولكن لم تُنشر أي رسالة، فتحقق مما إذا كانت الدورة مكوّنة كحدث غرفة محيط أو اختارت الردود المرئية عبر أداة الرسائل.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "اسمح لوكيلي بالرد على هذا الخادم دون الحاجة إلى @ذكره"
      </Tab>
      <Tab title="التكوين">
        عيّن `requireMention: false` في تكوين الخادم:

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

        لاشتراط الإرسال عبر أداة الرسائل للردود المرئية في المجموعة/القناة، عيّن `messages.groupChat.visibleReplies: "message_tool"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="التخطيط للذاكرة في قنوات الخادم">
    افتراضيًا، لا تُحمّل الذاكرة طويلة الأمد (MEMORY.md) إلا في جلسات الرسائل المباشرة. لا تُحمّل قنوات الخادم MEMORY.md تلقائيًا.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "عندما أطرح أسئلة في قنوات Discord، استخدم memory_search أو memory_get إذا كنت بحاجة إلى سياق طويل الأمد من MEMORY.md."
      </Tab>
      <Tab title="يدوي">
        إذا كنت تحتاج إلى سياق مشترك في كل قناة، فضع التعليمات الثابتة في `AGENTS.md` أو `USER.md` (يتم حقنها في كل جلسة). احتفظ بالملاحظات طويلة الأمد في `MEMORY.md` واصل إليها عند الطلب باستخدام أدوات الذاكرة.
      </Tab>
    </Tabs>

  </Step>
</Steps>

أنشئ الآن بعض القنوات على خادم Discord وابدأ الدردشة. يمكن لوكيلك رؤية اسم القناة، وتحصل كل قناة على جلستها المعزولة الخاصة بها — لذا يمكنك إعداد `#coding` أو `#home` أو `#research` أو أي شيء يناسب سير عملك.

## نموذج وقت التشغيل

- يملك Gateway اتصال Discord.
- توجيه الردود حتمي: تعود الردود الواردة من Discord إلى Discord.
- تُضاف بيانات تعريف خادم/قناة Discord إلى مطالبة النموذج كسياق غير موثوق
  به، لا كبادئة رد مرئية للمستخدم. إذا نسخ النموذج ذلك الغلاف
  مرة أخرى، يزيل OpenClaw بيانات التعريف المنسوخة من الردود الصادرة ومن
  سياق إعادة التشغيل المستقبلي.
- افتراضيًا (`session.dmScope=main`)، تشارك المحادثات المباشرة جلسة الوكيل الرئيسية (`agent:main:main`).
- تُعزل قنوات الخادم في مفاتيح جلسات (`agent:<agentId>:discord:channel:<channelId>`).
- تُتجاهل رسائل DM الجماعية افتراضيًا (`channels.discord.dm.groupEnabled=false`).
- تعمل أوامر الشرطة المائلة الأصلية في جلسات أوامر معزولة (`agent:<agentId>:discord:slash:<userId>`)، مع الاستمرار في حمل `CommandTargetSessionKey` إلى جلسة المحادثة الموجّهة.
- يستخدم تسليم إعلانات cron/Heartbeat النصية فقط إلى Discord الإجابة النهائية
  المرئية للمساعد مرة واحدة. وتبقى حمولات الوسائط والمكوّنات المنظمة
  متعددة الرسائل عندما يصدر الوكيل عدة حمولات قابلة للتسليم.

## قنوات المنتديات

لا تقبل قنوات المنتديات والوسائط في Discord إلا منشورات السلاسل. يدعم OpenClaw طريقتين لإنشائها:

- أرسل رسالة إلى أصل المنتدى (`channel:<forumId>`) لإنشاء سلسلة تلقائيًا. يستخدم عنوان السلسلة أول سطر غير فارغ من رسالتك.
- استخدم `openclaw message thread create` لإنشاء سلسلة مباشرة. لا تمرر `--message-id` لقنوات المنتديات.

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

يدعم OpenClaw حاويات مكوّنات Discord v2 لرسائل الوكيل. استخدم أداة الرسائل مع حمولة `components`. تُوجّه نتائج التفاعل إلى الوكيل كرسائل واردة عادية وتتبع إعدادات Discord الحالية `replyToMode`.

الكتل المدعومة:

- `text`، `section`، `separator`، `actions`، `media-gallery`، `file`
- تسمح صفوف الإجراءات بما يصل إلى 5 أزرار أو قائمة اختيار واحدة
- أنواع الاختيار: `string`، `user`، `role`، `mentionable`، `channel`

افتراضيًا، تكون المكوّنات للاستخدام مرة واحدة. عيّن `components.reusable=true` للسماح باستخدام الأزرار، وقوائم الاختيار، والنماذج مرات متعددة حتى تنتهي صلاحيتها.

لتقييد من يمكنه النقر على زر، عيّن `allowedUsers` على ذلك الزر (معرّفات مستخدمي Discord، أو الوسوم، أو `*`). عند التهيئة، يتلقى المستخدمون غير المطابقين رفضًا عابرًا.

تنتهي صلاحية استدعاءات المكوّنات بعد 30 دقيقة افتراضيًا. عيّن `channels.discord.agentComponents.ttlMs` لتغيير عمر سجل الاستدعاءات هذا لحساب Discord الافتراضي، أو `channels.discord.accounts.<accountId>.agentComponents.ttlMs` لتجاوز حساب واحد في إعداد متعدد الحسابات. القيمة بالمللي ثانية، ويجب أن تكون عددًا صحيحًا موجبًا، ومحددة بسقف `86400000` (24 ساعة). تفيد مدد TTL الأطول في سير عمل المراجعة أو الموافقة التي تحتاج إلى أن تبقى الأزرار قابلة للاستخدام، لكنها توسّع أيضًا النافذة التي يمكن فيها لرسالة Discord قديمة أن تظل قادرة على تشغيل إجراء. فضّل أقصر TTL يناسب سير العمل، واحتفظ بالقيمة الافتراضية عندما تكون الاستدعاءات القديمة مفاجئة.

تفتح أوامر الشرطة المائلة `/model` و`/models` منتقي نماذج تفاعليًا يتضمن قوائم منسدلة للموفّر، والنموذج، ووقت التشغيل المتوافق، إضافة إلى خطوة إرسال. أصبح `/models add` مهجورًا ويعيد الآن رسالة إهمال بدلًا من تسجيل النماذج من المحادثة. رد المنتقي عابر ولا يمكن استخدامه إلا من المستخدم الذي استدعاه. تقتصر قوائم اختيار Discord على 25 خيارًا، لذا أضف إدخالات `provider/*` إلى `agents.defaults.models` عندما تريد أن يعرض المنتقي النماذج المكتشفة ديناميكيًا فقط للموفّرين المحددين مثل `openai` أو `vllm`.

مرفقات الملفات:

- يجب أن تشير كتل `file` إلى مرجع مرفق (`attachment://<filename>`)
- وفّر المرفق عبر `media`/`path`/`filePath` (ملف واحد)؛ استخدم `media-gallery` لعدة ملفات
- استخدم `filename` لتجاوز اسم الرفع عندما يجب أن يطابق مرجع المرفق

نماذج النوافذ:

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
  <Tab title="سياسة DM">
    يتحكم `channels.discord.dmPolicy` في الوصول عبر DM. تُعد `channels.discord.allowFrom` قائمة السماح الأساسية للـ DM.

    - `pairing` (الافتراضي)
    - `allowlist`
    - `open` (يتطلب أن تتضمن `channels.discord.allowFrom` القيمة `"*"`)
    - `disabled`

    إذا لم تكن سياسة DM مفتوحة، يُحظر المستخدمون غير المعروفين (أو يُطلب منهم الاقتران في وضع `pairing`).

    أسبقية الحسابات المتعددة:

    - ينطبق `channels.discord.accounts.default.allowFrom` فقط على الحساب `default`.
    - لحساب واحد، تكون لـ `allowFrom` أسبقية على `dm.allowFrom` القديم.
    - ترث الحسابات المسماة `channels.discord.allowFrom` عندما لا تكون `allowFrom` الخاصة بها و`dm.allowFrom` القديم معيّنتين.
    - لا ترث الحسابات المسماة `channels.discord.accounts.default.allowFrom`.

    ما زال `channels.discord.dm.policy` و`channels.discord.dm.allowFrom` القديمان يُقرآن للتوافق. يرحّلهما `openclaw doctor --fix` إلى `dmPolicy` و`allowFrom` عندما يمكنه فعل ذلك من دون تغيير الوصول.

    تنسيق هدف DM للتسليم:

    - `user:<id>`
    - إشارة `<@id>`

    تُحلّ المعرّفات الرقمية المجردة عادةً كمعرّفات قنوات عندما يكون افتراض قناة نشطًا، لكن المعرّفات المدرجة في `allowFrom` الفعالة للـ DM في الحساب تُعامل كأهداف DM لمستخدمين لأجل التوافق.

  </Tab>

  <Tab title="مجموعات الوصول">
    يمكن لتفويض رسائل DM وأوامر النص في Discord استخدام إدخالات `accessGroup:<name>` ديناميكية في `channels.discord.allowFrom`.

    تُشارك أسماء مجموعات الوصول عبر قنوات الرسائل. استخدم `type: "message.senders"` لمجموعة ثابتة يُعبّر عن أعضائها بصيغة `allowFrom` العادية لكل قناة، أو `type: "discord.channelAudience"` عندما يجب أن يحدد جمهور `ViewChannel` الحالي لقناة Discord العضوية ديناميكيًا. وُثّق سلوك مجموعات الوصول المشتركة هنا: [مجموعات الوصول](/ar/channels/access-groups).

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

    لا تحتوي قناة نصية في Discord على قائمة أعضاء منفصلة. يمثّل `type: "discord.channelAudience"` العضوية كالآتي: مرسل DM عضو في الخادم المهيأ ولديه حاليًا إذن `ViewChannel` فعّال على القناة المهيأة بعد تطبيق أدوار القناة وتجاوزاتها.

    مثال: السماح لأي شخص يمكنه رؤية `#maintainers` بإرسال DM إلى البوت، مع إبقاء رسائل DM مغلقة أمام الجميع غيرهم.

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

    تفشل عمليات البحث وهي مغلقة. إذا أعاد Discord القيمة `Missing Access`، أو فشل البحث عن العضو، أو كانت القناة تابعة لخادم مختلف، فيُعامل مرسل DM كغير مخوّل.

    فعّل **Server Members Intent** في بوابة مطوّري Discord للبوت عند استخدام مجموعات وصول جمهور القناة. لا تتضمن رسائل DM حالة عضو الخادم، لذلك يحل OpenClaw العضو عبر Discord REST وقت التفويض.

  </Tab>

  <Tab title="سياسة الخادم">
    يتحكم `channels.discord.groupPolicy` في التعامل مع الخوادم:

    - `open`
    - `allowlist`
    - `disabled`

    خط الأساس الآمن عندما يكون `channels.discord` موجودًا هو `allowlist`.

    سلوك `allowlist`:

    - يجب أن يطابق الخادم `channels.discord.guilds` (يُفضّل `id`، ويُقبل الاسم المختصر)
    - قوائم سماح مرسلين اختيارية: `users` (تُوصى المعرّفات الثابتة) و`roles` (معرّفات الأدوار فقط)؛ إذا هُيّئ أي منهما، يُسمح للمرسلين عندما يطابقون `users` أو `roles`
    - تكون مطابقة الاسم/الوسم المباشرة معطلة افتراضيًا؛ فعّل `channels.discord.dangerouslyAllowNameMatching: true` فقط كوضع توافق للطوارئ
    - تُدعم الأسماء/الوسوم لـ `users`، لكن المعرّفات أكثر أمانًا؛ يحذر `openclaw security audit` عند استخدام إدخالات اسم/وسم
    - إذا كان لدى خادم `channels` مهيأة، تُرفض القنوات غير المدرجة
    - إذا لم يكن لدى خادم كتلة `channels`، يُسمح بجميع القنوات في ذلك الخادم المدرج في قائمة السماح

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

    إذا عيّنت `DISCORD_BOT_TOKEN` فقط ولم تنشئ كتلة `channels.discord`، يكون احتياطي وقت التشغيل هو `groupPolicy="allowlist"` (مع تحذير في السجلات)، حتى لو كان `channels.defaults.groupPolicy` هو `open`.

  </Tab>

  <Tab title="الإشارات ورسائل DM الجماعية">
    تُقيّد رسائل الخادم بالإشارات افتراضيًا.

    يتضمن اكتشاف الإشارات:

    - إشارة صريحة إلى البوت
    - أنماط الإشارة المهيأة (`agents.list[].groupChat.mentionPatterns`، والاحتياطي `messages.groupChat.mentionPatterns`)
    - سلوك الرد الضمني على البوت في الحالات المدعومة

    عند كتابة رسائل Discord صادرة، استخدم صيغة الإشارة الأساسية: `<@USER_ID>` للمستخدمين، و`<#CHANNEL_ID>` للقنوات، و`<@&ROLE_ID>` للأدوار. لا تستخدم صيغة إشارة اللقب القديمة `<@!USER_ID>`.

    يُهيّأ `requireMention` لكل خادم/قناة (`channels.discord.guilds...`).
    يحذف `ignoreOtherMentions` اختياريًا الرسائل التي تشير إلى مستخدم/دور آخر لكن لا تشير إلى البوت (باستثناء @everyone/@here).

    رسائل DM الجماعية:

    - الافتراضي: متجاهلة (`dm.groupEnabled=false`)
    - قائمة سماح اختيارية عبر `dm.groupChannels` (معرّفات قنوات أو أسماء مختصرة)

  </Tab>
</Tabs>

### توجيه الوكلاء المستند إلى الأدوار

استخدم `bindings[].match.roles` لتوجيه أعضاء خادم Discord إلى وكلاء مختلفين حسب معرّف الدور. تقبل الارتباطات المستندة إلى الأدوار معرّفات الأدوار فقط، وتُقيَّم بعد ارتباطات النظير أو النظير الأصل وقبل ارتباطات الخادم فقط. إذا عيّن ارتباطٌ ما حقول مطابقة أخرى أيضًا (على سبيل المثال `peer` + `guildId` + `roles`)، فيجب أن تتطابق جميع الحقول المضبوطة.

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
- التجاوز لكل قناة: `channels.discord.commands.native`.
- يؤدي `commands.native=false` إلى تخطي تسجيل أوامر Discord المائلة وتنظيفها أثناء بدء التشغيل. قد تظل الأوامر المسجلة سابقًا مرئية في Discord إلى أن تزيلها من تطبيق Discord.
- تستخدم مصادقة الأوامر الأصلية قوائم السماح/السياسات نفسها في Discord مثل معالجة الرسائل العادية.
- قد تظل الأوامر مرئية في واجهة Discord للمستخدمين غير المصرح لهم؛ لكن التنفيذ يظل يفرض مصادقة OpenClaw ويعيد "غير مصرح".

راجع [الأوامر المائلة](/ar/tools/slash-commands) للاطلاع على كتالوج الأوامر وسلوكها.

إعدادات الأوامر المائلة الافتراضية:

- `ephemeral: true`

## تفاصيل الميزة

<AccordionGroup>
  <Accordion title="وسوم الردود والردود الأصلية">
    يدعم Discord وسوم الرد في مخرجات الوكيل:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    يتم التحكم بها عبر `channels.discord.replyToMode`:

    - `off` (افتراضي)
    - `first`
    - `all`
    - `batched`

    ملاحظة: يعطّل `off` ربط الردود الضمني كسلاسل. ولا تزال وسوم `[[reply_to_*]]` الصريحة محترمة.
    يرفق `first` دائمًا مرجع الرد الأصلي الضمني بأول رسالة Discord صادرة في الدور.
    يرفق `batched` مرجع الرد الأصلي الضمني في Discord فقط عندما يكون
    الحدث الوارد دفعة مؤجلة من رسائل متعددة. يكون هذا مفيدًا
    عندما تريد الردود الأصلية أساسًا للمحادثات المتدفقة الملتبسة، وليس لكل
    دور ذي رسالة واحدة.

    تظهر معرّفات الرسائل في السياق/السجل حتى يتمكن الوكلاء من استهداف رسائل محددة.

  </Accordion>

  <Accordion title="معاينات الروابط">
    ينشئ Discord تضمينات روابط غنية لعناوين URL افتراضيًا. يوقف OpenClaw هذه التضمينات المُنشأة في رسائل Discord الصادرة افتراضيًا، لذلك تبقى عناوين URL التي يرسلها الوكيل روابط عادية ما لم تختَر تفعيلها:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    عيّن `channels.discord.accounts.<id>.suppressEmbeds` لتجاوز حساب واحد. ويمكن لعمليات الإرسال عبر أداة رسائل الوكيل أيضًا تمرير `suppressEmbeds: false` لرسالة واحدة. لا تُكبت حمولات `embeds` الصريحة في Discord بواسطة إعداد معاينة الروابط الافتراضي.

  </Accordion>

  <Accordion title="معاينة البث المباشر">
    يمكن لـ OpenClaw بث مسودات الردود بإرسال رسالة مؤقتة وتحريرها مع وصول النص. تقبل `channels.discord.streaming` القيم `off` | `partial` | `block` | `progress` (افتراضي). يحتفظ `progress` بمسودة حالة واحدة قابلة للتحرير ويحدّثها بتقدم الأدوات حتى التسليم النهائي؛ وتكون تسمية البداية المشتركة سطرًا متحركًا، لذلك تمر بعيدًا مثل الباقي عندما يظهر عمل كافٍ. `streamMode` اسم بديل قديم لوقت التشغيل. شغّل `openclaw doctor --fix` لإعادة كتابة الإعدادات المحفوظة إلى المفتاح القياسي.

    عيّن `channels.discord.streaming.mode` إلى `off` لتعطيل تعديلات معاينة Discord. إذا كان بث الكتل في Discord مفعّلًا صراحةً، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

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
    - يصدر `block` أجزاء بحجم المسودة (استخدم `draftChunk` لضبط الحجم ونقاط القطع، مع تقييدها بـ `textChunkLimit`).
    - تلغي النتائج النهائية للوسائط والأخطاء والردود الصريحة تعديلات المعاينة المعلقة.
    - يتحكم `streaming.preview.toolProgress` (افتراضيًا `true`) فيما إذا كانت تحديثات الأداة/التقدم تعيد استخدام رسالة المعاينة.
    - تُعرض صفوف الأداة/التقدم كرمز تعبيري مضغوط + عنوان + تفاصيل عند توفرها، مثل `🛠️ Bash: run tests` أو `🔎 Web Search: for "query"`.
    - يفعّل `streaming.progress.commentary` (افتراضيًا `false`) نص تعليق/تمهيد المساعد في مسودة التقدم المؤقتة. يُنظف التعليق قبل العرض، ويبقى عابرًا، ولا يغيّر تسليم الإجابة النهائية.
    - يتحكم `streaming.progress.maxLineChars` في ميزانية معاينة التقدم لكل سطر. يُختصر النثر عند حدود الكلمات؛ وتحتفظ تفاصيل الأوامر والمسارات باللواحق المفيدة.
    - يتحكم `streaming.preview.commandText` / `streaming.progress.commandText` في تفاصيل الأمر/التنفيذ ضمن أسطر التقدم المضغوطة: `raw` (افتراضي) أو `status` (تسمية الأداة فقط).

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

    بث المعاينة نصي فقط؛ وتعود ردود الوسائط إلى التسليم العادي. عندما يكون بث `block` مفعّلًا صراحةً، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

  </Accordion>

  <Accordion title="السجل والسياق وسلوك السلاسل">
    سياق سجل الخادم:

    - القيمة الافتراضية لـ `channels.discord.historyLimit` هي `20`
    - الاحتياطي: `messages.groupChat.historyLimit`
    - يعطّل `0`

    عناصر التحكم في سجل الرسائل المباشرة:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    سلوك السلاسل:

    - تُوجَّه سلاسل Discord كجلسات قناة وترث إعدادات القناة الأصل ما لم يتم تجاوزها.
    - ترث جلسات السلاسل اختيار `/model` على مستوى جلسة القناة الأصل كخيار احتياطي للنموذج فقط؛ ولا تزال اختيارات `/model` المحلية للسلسلة لها الأولوية، ولا يُنسخ سجل نص القناة الأصل إلا إذا كان توريث النص مفعّلًا.
    - يختار `channels.discord.thread.inheritParent` (افتراضيًا `false`) إدخال السلاسل التلقائية الجديدة من نص القناة الأصل. توجد التجاوزات لكل حساب ضمن `channels.discord.accounts.<id>.thread.inheritParent`.
    - يمكن لتفاعلات أداة الرسائل حل أهداف الرسائل المباشرة `user:<id>`.
    - يُحافَظ على `guilds.<guild>.channels.<channel>.requireMention: false` أثناء احتياطي تفعيل مرحلة الرد.

    تُحقن موضوعات القناة كسياق **غير موثوق**. تحدد قوائم السماح من يمكنه تشغيل الوكيل، وليست حدًا كاملًا لتنقيح السياق التكميلي.

  </Accordion>

  <Accordion title="جلسات مرتبطة بالسلاسل للوكلاء الفرعيين">
    يمكن لـ Discord ربط سلسلة بهدف جلسة بحيث تظل رسائل المتابعة في تلك السلسلة موجهة إلى الجلسة نفسها (بما في ذلك جلسات الوكلاء الفرعيين).

    الأوامر:

    - `/focus <target>` ربط السلسلة الحالية/الجديدة بهدف وكيل فرعي/جلسة
    - `/unfocus` إزالة ربط السلسلة الحالية
    - `/agents` عرض عمليات التشغيل النشطة وحالة الربط
    - `/session idle <duration|off>` فحص/تحديث إلغاء التركيز التلقائي عند عدم النشاط للارتباطات المركزة
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

    - يعيّن `session.threadBindings.*` القيم الافتراضية العامة.
    - يتجاوز `channels.discord.threadBindings.*` سلوك Discord.
    - يتحكم `spawnSessions` في الإنشاء/الربط التلقائي للسلاسل من أجل `sessions_spawn({ thread: true })` وعمليات إنشاء سلاسل ACP. الافتراضي: `true`.
    - يتحكم `defaultSpawnContext` في سياق الوكيل الفرعي الأصلي لعمليات الإنشاء المرتبطة بالسلاسل. الافتراضي: `"fork"`.
    - تتم ترحيل مفاتيح `spawnSubagentSessions`/`spawnAcpSessions` المهملة بواسطة `openclaw doctor --fix`.
    - إذا كانت ارتباطات السلاسل معطّلة لحساب ما، فلن تكون `/focus` وعمليات ربط السلاسل ذات الصلة متاحة.

    راجع [الوكلاء الفرعيون](/ar/tools/subagents)، و[وكلاء ACP](/ar/tools/acp-agents)، و[مرجع الإعدادات](/ar/gateway/configuration-reference).

  </Accordion>

  <Accordion title="ارتباطات قنوات ACP المستمرة">
    لمساحات عمل ACP المستقرة "الدائمة التشغيل"، اضبط ارتباطات ACP typed من المستوى الأعلى التي تستهدف محادثات Discord.

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

    - يربط `/acp spawn codex --bind here` القناة أو السلسلة الحالية في مكانها ويبقي الرسائل المستقبلية على جلسة ACP نفسها. ترث رسائل السلاسل ارتباط القناة الأصل.
    - في قناة أو سلسلة مرتبطة، يعيد `/new` و `/reset` ضبط جلسة ACP نفسها في مكانها. يمكن لارتباطات السلاسل المؤقتة تجاوز حل الهدف أثناء نشاطها.
    - يتحكم `spawnSessions` في إنشاء/ربط السلاسل الفرعية عبر `--thread auto|here`.

    راجع [وكلاء ACP](/ar/tools/acp-agents) لتفاصيل سلوك الربط.

  </Accordion>

  <Accordion title="إشعارات التفاعلات">
    وضع إشعارات التفاعل لكل خادم:

    - `off`
    - `own` (افتراضي)
    - `all`
    - `allowlist` (يستخدم `guilds.<id>.users`)

    تُحوَّل أحداث التفاعل إلى أحداث نظام وتُرفق بجلسة Discord الموجَّهة.

  </Accordion>

  <Accordion title="تفاعلات الإقرار">
    يرسل `ackReaction` رمزًا تعبيريًا للإقرار أثناء معالجة OpenClaw لرسالة واردة.

    ترتيب الحل:

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - احتياطي الرمز التعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يقبل Discord رموز Unicode التعبيرية أو أسماء الرموز التعبيرية المخصصة.
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="كتابات الإعدادات">
    تكون كتابات الإعدادات التي تبدأها القناة مفعّلة افتراضيًا.

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

  <Accordion title="وكيل Gateway">
    وجّه حركة WebSocket الخاصة بـ Gateway في Discord وعمليات بحث REST عند بدء التشغيل (معرّف التطبيق + حل قائمة السماح) عبر وكيل HTTP(S) باستخدام `channels.discord.proxy`.
    توكيل WebSocket الخاص بـ Discord Gateway صريح؛ لا ترث اتصالات WebSocket متغيرات بيئة الوكيل المحيطة من عملية Gateway. تستخدم عمليات بحث REST عند بدء التشغيل هذا الوكيل عند ضبط `channels.discord.proxy`.

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
    فعّل حلّ PluralKit لربط الرسائل الموكّلة بهوية عضو النظام:

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
    - إذا فشل البحث، تُعامل الرسائل الموكّلة كرسائل بوت ويتم إسقاطها ما لم تكن `allowBots=true`

  </Accordion>

  <Accordion title="Outbound mention aliases">
    استخدم `mentionAliases` عندما تحتاج الوكلاء إلى إشارات صادرة حتمية لمستخدمي Discord المعروفين. المفاتيح هي المعرّفات دون علامة `@` البادئة؛ والقيم هي معرّفات مستخدمي Discord. تُترك المعرّفات غير المعروفة، و`@everyone`، و`@here`، والإشارات داخل مقاطع كود Markdown دون تغيير.

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
    تُطبّق تحديثات الحضور عندما تضبط حقل حالة أو نشاط، أو عندما تفعّل الحضور التلقائي.

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

    مثال نشاط (الحالة المخصصة هي نوع النشاط الافتراضي):

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

    مثال بث:

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
    - 4: مخصص (يستخدم نص النشاط كحالة؛ الرمز التعبيري اختياري)
    - 5: تنافس

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

  <Accordion title="Approvals in Discord">
    يدعم Discord التعامل مع الموافقات عبر الأزرار في الرسائل المباشرة، ويمكنه اختياريًا نشر مطالبات الموافقة في القناة الأصلية.

    مسار الإعداد:

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers` (اختياري؛ يعود إلى `commands.ownerAllowFrom` عندما يكون ذلك ممكنًا)
    - `channels.discord.execApprovals.target` (`dm` | `channel` | `both`، الافتراضي: `dm`)
    - `agentFilter`، و`sessionFilter`، و`cleanupAfterResolve`

    يفعّل Discord موافقات التنفيذ الأصلية تلقائيًا عندما تكون `enabled` غير مضبوطة أو `"auto"` ويمكن حلّ موافق واحد على الأقل، إما من `execApprovals.approvers` أو من `commands.ownerAllowFrom`. لا يستنتج Discord موافقي التنفيذ من `allowFrom` الخاصة بالقناة، أو `dm.allowFrom` القديمة، أو `defaultTo` الخاصة بالرسائل المباشرة. اضبط `enabled: false` لتعطيل Discord صراحةً كعميل موافقة أصلي.

    بالنسبة إلى أوامر المجموعات الحساسة الخاصة بالمالك فقط مثل `/diagnostics` و`/export-trajectory`، يرسل OpenClaw مطالبات الموافقة والنتائج النهائية بشكل خاص. يحاول Discord DM أولًا عندما يكون للمالك المستدعي مسار مالك في Discord؛ وإذا لم يكن ذلك متاحًا، فإنه يعود إلى أول مسار مالك متاح من `commands.ownerAllowFrom`، مثل Telegram.

    عندما تكون `target` هي `channel` أو `both`، تكون مطالبة الموافقة مرئية في القناة. لا يستطيع استخدام الأزرار إلا الموافقون المحلولون؛ ويتلقى المستخدمون الآخرون رفضًا مؤقتًا. تتضمن مطالبات الموافقة نص الأمر، لذلك لا تفعّل التسليم إلى القناة إلا في القنوات الموثوقة. إذا تعذر اشتقاق معرّف القناة من مفتاح الجلسة، يعود OpenClaw إلى التسليم عبر الرسائل المباشرة.

    يعرض Discord أيضًا أزرار الموافقة المشتركة التي تستخدمها قنوات الدردشة الأخرى. يضيف محوّل Discord الأصلي أساسًا توجيه الرسائل المباشرة للموافقين والتوزيع إلى القنوات.
    عندما تكون هذه الأزرار موجودة، فهي تجربة الموافقة الأساسية؛ ويجب على OpenClaw
    تضمين أمر `/approve` يدوي فقط عندما تشير نتيجة الأداة إلى
    أن موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.
    إذا لم يكن وقت تشغيل الموافقة الأصلية في Discord نشطًا، يُبقي OpenClaw
    مطالبة `/approve <id> <decision>` المحلية الحتمية مرئية. إذا كان
    وقت التشغيل نشطًا لكن لا يمكن تسليم بطاقة أصلية إلى أي هدف،
    يرسل OpenClaw إشعارًا احتياطيًا في الدردشة نفسها يتضمن أمر `/approve`
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

يقبل الإجراء `event-create` معلمة `image` اختيارية (URL أو مسار ملف محلي) لتعيين صورة غلاف الحدث المجدول.

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

- يضبط `channels.discord.ui.components.accentColor` لون التمييز المستخدم في حاويات مكوّنات Discord (سداسي).
- اضبطه لكل حساب باستخدام `channels.discord.accounts.<id>.ui.components.accentColor`.
- يتحكم `channels.discord.agentComponents.ttlMs` في مدة بقاء استدعاءات مكوّنات Discord المرسلة مسجلة (الافتراضي `1800000`، الحد الأقصى `86400000`). اضبطه لكل حساب باستخدام `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- يتم تجاهل `embeds` عند وجود مكوّنات v2.
- يتم كبت معاينات URL العادية افتراضيًا. اضبط `suppressEmbeds: false` على إجراء رسالة عندما ينبغي توسيع رابط صادر واحد.

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

1. فعّل Message Content Intent في بوابة مطوري Discord.
2. فعّل Server Members Intent عند استخدام قوائم السماح للأدوار/المستخدمين.
3. ادعُ البوت بنطاقي `bot` و`applications.commands`.
4. امنح أذونات Connect، وSpeak، وSend Messages، وRead Message History في القناة الصوتية الهدف.
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
- يتحكم `voice.mode` في مسار المحادثة. الوضع الافتراضي هو `agent-proxy`: تتولى واجهة صوتية أمامية في الوقت الفعلي توقيت الدور، والمقاطعة، والتشغيل، وتفوّض العمل الجوهري إلى وكيل OpenClaw الموجّه عبر `openclaw_agent_consult`، وتتعامل مع النتيجة كموجّه Discord مكتوب من ذلك المتحدث. يحافظ `stt-tts` على تدفق STT الدفعي الأقدم مع TTS. يتيح `bidi` لنموذج الوقت الفعلي التحدث مباشرة مع كشف `openclaw_agent_consult` لعقل OpenClaw.
- يتحكم `voice.agentSession` في محادثة OpenClaw التي تتلقى الأدوار الصوتية. اتركه غير مضبوط لجلسة قناة الصوت نفسها، أو اضبط `{ mode: "target", target: "channel:<text-channel-id>" }` لجعل قناة الصوت تعمل كامتداد ميكروفون/مكبر صوت لجلسة قناة نصية موجودة في Discord مثل `#maintainers`.
- يتجاوز `voice.model` عقل وكيل OpenClaw لردود Discord الصوتية والاستشارات في الوقت الفعلي. اتركه غير مضبوط ليرث نموذج الوكيل الموجّه. وهو منفصل عن `voice.realtime.model`.
- يتيح `voice.followUsers` للبوت الانضمام إلى صوت Discord والانتقال والمغادرة مع مستخدمين محددين. راجع [متابعة المستخدمين في الصوت](#follow-users-in-voice) لقواعد السلوك والأمثلة.
- يوجّه `agent-proxy` الكلام عبر `discord-voice`، ما يحافظ على تفويض المالك/الأدوات المعتاد للمتحدث والجلسة الهدف، لكنه يخفي أداة الوكيل `tts` لأن صوت Discord يملك التشغيل. افتراضياً، يمنح `agent-proxy` الاستشارة وصولاً كاملاً إلى الأدوات مكافئاً للمالك للمتحدثين المالكين (`voice.realtime.toolPolicy: "owner"`) ويفضل بشدة استشارة وكيل OpenClaw قبل الإجابات الجوهرية (`voice.realtime.consultPolicy: "always"`). في وضع `always` الافتراضي هذا، لا تنطق طبقة الوقت الفعلي حشواً تلقائياً قبل إجابة الاستشارة؛ بل تلتقط الكلام وتنسخه، ثم تنطق إجابة OpenClaw الموجّهة. إذا اكتملت عدة إجابات استشارة مفروضة بينما لا يزال Discord يشغل الإجابة الأولى، تُصف إجابات الكلام المطابق اللاحقة في قائمة انتظار حتى يصبح التشغيل خاملاً بدلاً من استبدال الكلام في منتصف الجملة.
- في وضع `stt-tts`، يستخدم STT `tools.media.audio`؛ ولا يؤثر `voice.model` في النسخ.
- في أوضاع الوقت الفعلي، تضبط `voice.realtime.provider` و`voice.realtime.model` و`voice.realtime.speakerVoice` جلسة الصوت في الوقت الفعلي. لاستخدام OpenAI Realtime 2 مع عقل Codex، استخدم `voice.realtime.model: "gpt-realtime-2"` و`voice.model: "openai/gpt-5.5"`.
- تتضمن أوضاع الصوت في الوقت الفعلي ملفات ملف تعريف صغيرة `IDENTITY.md` و`USER.md` و`SOUL.md` في تعليمات مزود الوقت الفعلي افتراضياً حتى تحافظ الأدوار المباشرة السريعة على الهوية نفسها، وتأريض المستخدم، والشخصية نفسها مثل وكيل OpenClaw الموجّه. اضبط `voice.realtime.bootstrapContextFiles` على مجموعة فرعية لتخصيص ذلك، أو `[]` لتعطيله. تقتصر ملفات التمهيد المدعومة للوقت الفعلي على ملفات ملف التعريف تلك؛ ويبقى `AGENTS.md` في سياق الوكيل العادي. لا يستبدل سياق ملف التعريف المحقون `openclaw_agent_consult` لعمل مساحة العمل، أو الحقائق الحالية، أو البحث في الذاكرة، أو الإجراءات المدعومة بالأدوات.
- في وضع الوقت الفعلي `agent-proxy` من OpenAI، اضبط `voice.realtime.requireWakeName: true` لإبقاء صوت Discord في الوقت الفعلي صامتاً حتى يبدأ النسخ أو ينتهي باسم تنبيه. يجب أن تكون أسماء التنبيه المضبوطة كلمة واحدة أو كلمتين. إذا كان `voice.realtime.wakeNames` غير مضبوط، يستخدم OpenClaw `name` للوكيل الموجّه بالإضافة إلى `OpenClaw`، مع الرجوع إلى معرف الوكيل بالإضافة إلى `OpenClaw`. يعطل شرط اسم التنبيه الاستجابة التلقائية لمزود الوقت الفعلي، ويوجّه الأدوار المقبولة عبر مسار استشارة وكيل OpenClaw، ويعطي إقراراً صوتياً قصيراً عند التعرف على اسم تنبيه بادئ من نسخ جزئي قبل وصول النسخة النهائية.
- يقبل مزود OpenAI في الوقت الفعلي أسماء أحداث Realtime 2 الحالية والأسماء المستعارة القديمة المتوافقة مع Codex لأحداث صوت الإخراج والنص المنسوخ، بحيث يمكن أن تنحرف لقطات المزود المتوافقة دون إسقاط صوت المساعد.
- يتحكم `voice.realtime.bargeIn` فيما إذا كانت أحداث بدء متحدث Discord تقاطع تشغيل الوقت الفعلي النشط. إذا كان غير مضبوط، فإنه يتبع إعداد مقاطعة صوت الإدخال لمزود الوقت الفعلي.
- يتحكم `voice.realtime.minBargeInAudioEndMs` في الحد الأدنى لمدة تشغيل المساعد قبل أن يقتطع تداخل OpenAI في الوقت الفعلي الصوت. الافتراضي: `250`. اضبطه على `0` للمقاطعة الفورية في الغرف منخفضة الصدى، أو ارفعه لإعدادات مكبرات الصوت كثيرة الصدى.
- لاستخدام صوت OpenAI في تشغيل Discord، اضبط `voice.tts.provider: "openai"` واختر صوت Text-to-speech ضمن `voice.tts.providers.openai.speakerVoice`. يُعد `cedar` خياراً جيداً ذا وقع ذكوري في نموذج OpenAI TTS الحالي.
- تنطبق تجاوزات `systemPrompt` لكل قناة في Discord على أدوار النص المنسوخ الصوتية لتلك القناة الصوتية.
- تستمد أدوار النص المنسوخ الصوتية حالة المالك من `allowFrom` في Discord (أو `dm.allowFrom`) للأوامر وإجراءات القنوات المقيدة بالمالك. تتبع مرئية أدوات الوكيل سياسة الأدوات المضبوطة للجلسة الموجّهة.
- صوت Discord اختياري لإعدادات النص فقط؛ اضبط `channels.discord.voice.enabled=true` (أو احتفظ بكتلة `channels.discord.voice` موجودة) لتمكين أوامر `/vc`، وبيئة تشغيل الصوت، وهدف Gateway `GuildVoiceStates`.
- يمكن لـ `channels.discord.intents.voiceStates` تجاوز اشتراك هدف حالة الصوت صراحةً. اتركه غير مضبوط ليتبع الهدف التمكين الصوتي الفعلي.
- إذا كان لدى `voice.autoJoin` عدة إدخالات للنقابة نفسها، ينضم OpenClaw إلى آخر قناة مضبوطة لتلك النقابة.
- `voice.allowedChannels` هي قائمة سماح إقامة اختيارية. اتركها غير مضبوطة للسماح لـ `/vc join` بالدخول إلى أي قناة صوت Discord مخوّلة. عند ضبطها، تُقيَّد `/vc join` والانضمام التلقائي عند بدء التشغيل وانتقالات حالة صوت البوت إلى إدخالات `{ guildId, channelId }` المدرجة. اضبطها على مصفوفة فارغة لرفض كل انضمامات صوت Discord. إذا نقل Discord البوت إلى خارج قائمة السماح، يغادر OpenClaw تلك القناة ويعيد الانضمام إلى هدف الانضمام التلقائي المضبوط عند توفره.
- يمرر `voice.daveEncryption` و`voice.decryptionFailureTolerance` إلى خيارات انضمام `@discordjs/voice`.
- افتراضيات `@discordjs/voice` هي `daveEncryption=true` و`decryptionFailureTolerance=24` إذا كانت غير مضبوطة.
- يستخدم OpenClaw مرمّز `libopus-wasm` المضمّن لاستقبال صوت Discord وتشغيل PCM الخام في الوقت الفعلي. يشحن بناء WebAssembly مثبتاً من libopus ولا يتطلب إضافات opus أصلية.
- يتحكم `voice.connectTimeoutMs` في انتظار Ready الأولي لـ `@discordjs/voice` لمحاولات `/vc join` والانضمام التلقائي. الافتراضي: `30000`.
- يتحكم `voice.reconnectGraceMs` في مدة انتظار OpenClaw لجلسة صوت منقطعة حتى تبدأ إعادة الاتصال قبل تدميرها. الافتراضي: `15000`.
- في وضع `stt-tts`، لا يتوقف تشغيل الصوت لمجرد أن مستخدماً آخر بدأ الكلام. لتجنب حلقات التغذية الراجعة، يتجاهل OpenClaw التقاط الصوت الجديد أثناء تشغيل TTS؛ تحدث بعد انتهاء التشغيل للدور التالي. تمرر أوضاع الوقت الفعلي بدايات المتحدثين كإشارات تداخل إلى مزود الوقت الفعلي.
- في أوضاع الوقت الفعلي، يمكن أن يبدو الصدى من مكبرات الصوت إلى ميكروفون مفتوح كتداخل ويقاطع التشغيل. لغرف Discord كثيرة الصدى، اضبط `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` لمنع OpenAI من المقاطعة التلقائية عند صوت الإدخال. أضف `voice.realtime.bargeIn: true` إذا كنت لا تزال تريد أن تقاطع أحداث بدء متحدث Discord التشغيل النشط. يتجاهل جسر OpenAI في الوقت الفعلي اقتطاعات التشغيل الأقصر من `voice.realtime.minBargeInAudioEndMs` باعتبارها صدى/ضجيجاً محتملاً ويسجلها كمتخطاة بدلاً من مسح تشغيل Discord.
- يتحكم `voice.captureSilenceGraceMs` في مدة انتظار OpenClaw بعد أن يبلّغ Discord عن توقف متحدث قبل إنهاء ذلك المقطع الصوتي لـ STT. الافتراضي: `2000`؛ ارفع هذا إذا كان Discord يقسم الوقفات العادية إلى نصوص جزئية متقطعة.
- عندما يكون ElevenLabs هو مزود TTS المحدد، يستخدم تشغيل صوت Discord بث TTS ويبدأ من تدفق استجابة المزود. تعود المزودات التي لا تدعم البث إلى مسار الملف المؤقت المصطنع.
- يراقب OpenClaw أيضاً فشل فك تشفير الاستقبال ويتعافى تلقائياً بمغادرة القناة الصوتية وإعادة الانضمام إليها بعد إخفاقات متكررة في نافذة قصيرة.
- إذا أظهرت سجلات الاستقبال مراراً `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` بعد التحديث، فاجمع تقرير تبعية وسجلات. يتضمن سطر `@discordjs/voice` المضمّن إصلاح الحشو الصاعد من PR #11449 في discord.js، الذي أغلق issue #11419 في discord.js.
- أحداث استقبال `The operation was aborted` متوقعة عندما ينهي OpenClaw مقطع متحدث ملتقطاً؛ وهي تشخيصات مسهبة، لا تحذيرات.
- تتضمن سجلات صوت Discord المسهبة معاينة محدودة بسطر واحد لنص STT المنسوخ لكل مقطع متحدث مقبول، بحيث يُظهر التصحيح كلاً من جانب المستخدم وجانب رد الوكيل دون تفريغ نص منسوخ غير محدود.
- في وضع `agent-proxy`، يتخطى رجوع الاستشارة المفروضة أجزاء النص المنسوخ التي تبدو غير مكتملة، مثل النص المنتهي بـ `...` أو رابط لاحق مثل `and`، إضافة إلى الخواتيم الواضحة غير القابلة للتنفيذ مثل "سأعود حالاً" أو "إلى اللقاء". تعرض السجلات `forced agent consult skipped reason=...` عندما يمنع هذا إجابة قديمة مصطفة.

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
- يكون `followUsersEnabled` افتراضياً `true` عند ضبط `followUsers`. اضبطه على `false` للاحتفاظ بالقائمة المحفوظة مع إيقاف المتابعة الصوتية التلقائية.
- عندما ينضم مستخدم مُتابَع إلى قناة صوتية مسموحة، ينضم OpenClaw إلى تلك القناة. عندما ينتقل المستخدم، ينتقل OpenClaw معه. عندما ينقطع المستخدم المُتابَع النشط، يغادر OpenClaw.
- إذا كان عدة مستخدمين مُتابَعين في النقابة نفسها وغادر المستخدم المُتابَع النشط، ينتقل OpenClaw إلى قناة مستخدم مُتابَع آخر متعقَّب قبل مغادرة النقابة. إذا انتقل عدة مستخدمين مُتابَعين في الوقت نفسه، يفوز أحدث حدث حالة صوت مرصود.
- لا يزال `allowedChannels` مطبقاً. يُتجاهل المستخدم المُتابَع في قناة غير مسموحة، وتنتقل جلسة مملوكة للمتابعة إلى مستخدم مُتابَع آخر أو تغادر.
- يوفق OpenClaw أحداث حالة الصوت الفائتة عند بدء التشغيل وبفاصل زمني محدود. تأخذ المصالحة عينات من النقابات المضبوطة وتحد من عمليات بحث REST لكل تشغيل، لذلك قد تحتاج قوائم `followUsers` الكبيرة جداً إلى أكثر من فاصل واحد حتى تتقارب.
- إذا نقل Discord أو مسؤول البوت أثناء متابعته لمستخدم، يعيد OpenClaw بناء جلسة الصوت ويحافظ على ملكية المتابعة عندما تكون الوجهة مسموحة. إذا نُقل البوت إلى خارج `allowedChannels`، يغادر OpenClaw ويعيد الانضمام إلى الهدف المضبوط عند وجوده.
- قد يغادر تعافي استقبال DAVE القناة نفسها ويعيد الانضمام إليها بعد إخفاقات فك تشفير متكررة. تحتفظ الجلسات المملوكة للمتابعة بملكية المتابعة عبر مسار التعافي هذا، لذلك لا يزال انقطاع مستخدم مُتابَع لاحق يغادر القناة.

اختر بين أوضاع الانضمام:

- استخدم `followUsers` للإعدادات الشخصية أو إعدادات المشغّل حيث يجب أن يكون البوت في الصوت تلقائياً عندما تكون أنت هناك.
- استخدم `autoJoin` للبوتات ذات الغرف الثابتة التي يجب أن تكون حاضرة حتى عندما لا يكون أي مستخدم متعقَّب في الصوت.
- استخدم `/vc join` للانضمامات لمرة واحدة أو للغرف التي سيكون فيها الحضور الصوتي التلقائي مفاجئاً.

مرمّز صوت Discord:

- تعرض سجلات استقبال الصوت `discord voice: opus decoder: libopus-wasm`.
- يشفر تشغيل الوقت الفعلي صوت PCM خاما بتردد 48 كيلوهرتز وبقناتين إلى Opus باستخدام حزمة `libopus-wasm` المضمنة نفسها قبل تسليم الحزم إلى `@discordjs/voice`.
- يحول تشغيل الملفات وتدفقات المزود إلى PCM خام بتردد 48 كيلوهرتز وبقناتين باستخدام ffmpeg، ثم يستخدم `libopus-wasm` لتدفق حزم Opus المرسل إلى Discord.

مسار تحويل الكلام إلى نص (STT) مع تحويل النص إلى كلام (TTS):

- يتم تحويل التقاط PCM من Discord إلى ملف WAV مؤقت.
- يتولى `tools.media.audio` تحويل الكلام إلى نص، مثل `openai/gpt-4o-mini-transcribe`.
- يتم إرسال النص المفرغ عبر إدخال Discord والتوجيه بينما يعمل نموذج اللغة الكبير للاستجابة بسياسة إخراج صوتي تخفي أداة الوكيل `tts` وتطلب نصا مرجعا، لأن صوت Discord يملك تشغيل TTS النهائي.
- عند ضبط `voice.model`، فإنه يتجاوز فقط نموذج اللغة الكبير للاستجابة في دورة قناة الصوت هذه.
- يتم دمج `voice.tts` فوق `messages.tts`؛ المزودون القادرون على البث يغذون المشغل مباشرة، وإلا فيتم تشغيل ملف الصوت الناتج في القناة المنضم إليها.

مثال لجلسة قناة صوتية افتراضية عبر وكيل الوكيل:

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

من دون كتلة `voice.agentSession`، تحصل كل قناة صوتية على جلسة OpenClaw موجهة خاصة بها. على سبيل المثال، يتحدث `/vc join channel:234567890123456789` إلى الجلسة الخاصة بتلك القناة الصوتية في Discord. نموذج الوقت الفعلي هو واجهة الصوت فقط؛ أما الطلبات الجوهرية فتسلم إلى وكيل OpenClaw المهيأ. إذا أنتج نموذج الوقت الفعلي تفريغا نهائيا من دون استدعاء أداة الاستشارة، يفرض OpenClaw الاستشارة كمسار احتياطي بحيث يظل السلوك الافتراضي شبيها بالتحدث إلى الوكيل.

مثال قديم لتحويل الكلام إلى نص مع تحويل النص إلى كلام:

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

مثال للاتصال ثنائي الاتجاه في الوقت الفعلي:

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

في وضع `agent-proxy` ينضم الروبوت إلى القناة الصوتية المهيأة، لكن دورات وكيل OpenClaw تستخدم الجلسة والوكيل الموجهين العاديين للقناة الهدف. تنطق جلسة الصوت في الوقت الفعلي النتيجة المرجعة داخل القناة الصوتية. لا يزال بإمكان وكيل الإشراف استخدام أدوات الرسائل العادية وفقا لسياسة أدواته، بما في ذلك إرسال رسالة Discord منفصلة إذا كان ذلك هو الإجراء الصحيح.

أثناء نشاط تشغيل OpenClaw مفوض، تعامل تفريغات صوت Discord الجديدة كتحكم مباشر في التشغيل قبل بدء دورة وكيل أخرى. تصنف عبارات مثل "status" أو "cancel that" أو "use the smaller fix" أو "when you're done also check tests" كإدخال حالة أو إلغاء أو توجيه أو متابعة للجلسة النشطة. يتم نطق نتائج الحالة والإلغاء والتوجيه المقبول والمتابعة داخل القناة الصوتية حتى يعرف المتصل ما إذا كان OpenClaw قد عالج الطلب.

أشكال الأهداف المفيدة:

- يوجه `target: "channel:123456789012345678"` عبر جلسة قناة نصية في Discord.
- يعامل `target: "123456789012345678"` كهدف قناة.
- يوجه `target: "dm:123456789012345678"` أو `target: "user:123456789012345678"` عبر جلسة الرسائل المباشرة تلك.

مثال OpenAI Realtime كثيف الصدى:

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

استخدم هذا عندما يسمع النموذج تشغيل Discord الخاص به عبر ميكروفون مفتوح، لكنك ما زلت تريد مقاطعته بالكلام. يمنع OpenClaw OpenAI من المقاطعة التلقائية عند صوت الإدخال الخام، بينما يسمح `bargeIn: true` لأحداث بدء متحدث Discord وصوت المتحدث النشط بالفعل بإلغاء استجابات الوقت الفعلي النشطة قبل أن تصل الدورة الملتقطة التالية إلى OpenAI. تعامل إشارات المقاطعة المبكرة جدا التي يكون فيها `audioEndMs` أقل من `minBargeInAudioEndMs` كصدى أو ضجيج مرجح ويتم تجاهلها حتى لا يتوقف النموذج عند أول إطار تشغيل.

سجلات الصوت المتوقعة:

- عند الانضمام: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- عند بدء الوقت الفعلي: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- عند صوت المتحدث: `discord voice: realtime speaker turn opened ...`، و`discord voice: realtime input audio started ... outputAudioMs=... outputActive=...`، و`discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- عند تخطي كلام قديم: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` أو `reason=non-actionable-closing ...`
- عند اكتمال استجابة الوقت الفعلي: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- عند إيقاف/إعادة ضبط التشغيل: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- عند استشارة الوقت الفعلي: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- عند إجابة الوكيل: `discord voice: agent turn answer ...`
- عند وضع كلام مطابق في الطابور: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`، متبوعا بـ `discord voice: realtime exact speech dequeued reason=player-idle ...`
- عند اكتشاف المقاطعة: `discord voice: realtime barge-in detected source=speaker-start ...` أو `discord voice: realtime barge-in detected source=active-speaker-audio ...`، متبوعا بـ `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- عند مقاطعة الوقت الفعلي: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`، متبوعا إما بـ `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` أو `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- عند تجاهل الصدى/الضجيج: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- عند تعطيل المقاطعة: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- عند التشغيل الخامل: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

لتصحيح الصوت المقطوع، اقرأ سجلات صوت الوقت الفعلي كتسلسل زمني:

1. يعني `realtime audio playback started` أن Discord بدأ تشغيل صوت المساعد. يبدأ الجسر من هذه النقطة في عد مقاطع إخراج المساعد، وبايتات PCM الخاصة بـ Discord، وبايتات مزود الوقت الفعلي، ومدة الصوت المركب.
2. يحدد `realtime speaker turn opened` لحظة يصبح فيها متحدث Discord نشطا. إذا كان التشغيل نشطا بالفعل وكان `bargeIn` مفعلا، فقد يتبعه `barge-in detected source=speaker-start`.
3. يحدد `realtime input audio started` أول إطار صوت فعلي مستلم لدورة المتحدث تلك. تعني `outputActive=true` أو قيمة غير صفرية في `outputAudioMs` هنا أن الميكروفون يرسل إدخالا بينما لا يزال تشغيل المساعد نشطا.
4. يعني `barge-in detected source=active-speaker-audio` أن OpenClaw رأى صوت متحدث مباشرا أثناء نشاط تشغيل المساعد. وهذا مفيد للتمييز بين مقاطعة حقيقية وحدث بدء متحدث من Discord بلا صوت مفيد.
5. يعني `barge-in requested reason=...` أن OpenClaw طلب من مزود الوقت الفعلي إلغاء الاستجابة النشطة أو اقتطاعها. ويتضمن `outputAudioMs` و`outputActive` و`playbackChunks` حتى تتمكن من رؤية مقدار صوت المساعد الذي شغل فعليا قبل المقاطعة.
6. يمثل `realtime audio playback stopped reason=...` نقطة إعادة ضبط تشغيل Discord المحلية. يوضح السبب من أوقف التشغيل: `barge-in` أو `player-idle` أو `provider-clear-audio` أو `forced-agent-consult` أو `stream-close` أو `session-close`.
7. يلخص `realtime speaker turn closed` دورة الإدخال الملتقطة. تعني `chunks=0` أو `hasAudio=false` أن دورة المتحدث بدأت لكن لم يصل أي صوت قابل للاستخدام إلى جسر الوقت الفعلي. وتعني `interruptedPlayback=true` أن دورة الإدخال تلك تداخلت مع إخراج المساعد وشغلت منطق المقاطعة.

حقول مفيدة:

- `outputAudioMs`: مدة صوت المساعد التي ولدها مزود الوقت الفعلي قبل سطر السجل.
- `audioMs`: مدة صوت المساعد التي عدها OpenClaw قبل توقف التشغيل.
- `elapsedMs`: زمن الساعة الفعلي بين فتح وإغلاق تدفق التشغيل أو دورة المتحدث.
- `discordBytes`: بايتات PCM بتردد 48 كيلوهرتز وبقناتين المرسلة إلى صوت Discord أو المستلمة منه.
- `realtimeBytes`: بايتات PCM بتنسيق المزود المرسلة إلى مزود الوقت الفعلي أو المستلمة منه.
- `playbackChunks`: مقاطع صوت المساعد المعاد توجيهها إلى Discord للاستجابة النشطة.
- `sinceLastAudioMs`: الفجوة بين آخر إطار صوت متحدث ملتقط وإغلاق دورة المتحدث.

أنماط شائعة:

- غالبا ما يشير القطع الفوري مع `source=active-speaker-audio` و`outputAudioMs` صغيرة والمستخدم نفسه قريبا إلى دخول صدى السماعة إلى الميكروفون. ارفع `voice.realtime.minBargeInAudioEndMs`، أو اخفض مستوى صوت السماعة، أو استخدم سماعات رأس، أو اضبط `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- يعني `source=speaker-start` متبوعا بـ `speaker turn closed ... hasAudio=false` أن Discord أبلغ عن بدء متحدث لكن لم يصل أي صوت إلى OpenClaw. قد يكون ذلك حدثا عابرا في صوت Discord، أو سلوك بوابة ضجيج، أو قيام عميل بتفعيل الميكروفون للحظة قصيرة.
- يعني `audio playback stopped reason=stream-close` من دون مقاطعة قريبة أو `provider-clear-audio` أن تدفق تشغيل Discord المحلي انتهى بشكل غير متوقع. تحقق من سجلات المزود ومشغل Discord السابقة.
- يعني `capture ignored during playback (barge-in disabled)` أن OpenClaw أسقط الإدخال عمدا أثناء نشاط صوت المساعد. فعل `voice.realtime.bargeIn` إذا أردت أن يقطع الكلام التشغيل.
- يعني `barge-in ignored ... outputActive=false` أن Discord أو VAD الخاص بالمزود أبلغ عن كلام، لكن لم يكن لدى OpenClaw تشغيل نشط لمقاطعته. لا ينبغي أن يؤدي هذا إلى قطع الصوت.

تحل بيانات الاعتماد لكل مكون على حدة: مصادقة مسار نموذج اللغة الكبير لـ `voice.model`، ومصادقة STT لـ `tools.media.audio`، ومصادقة TTS لـ `messages.tts`/`voice.tts`، ومصادقة مزود الوقت الفعلي لـ `voice.realtime.providers` أو إعداد مصادقة المزود العادي.

### الرسائل الصوتية

تعرض الرسائل الصوتية في Discord معاينة موجية وتتطلب صوت OGG/Opus. ينشئ OpenClaw الموجة تلقائيا، لكنه يحتاج إلى `ffmpeg` و`ffprobe` على مضيف Gateway للفحص والتحويل.

- وفّر **مسار ملف محليًا** (تُرفض عناوين URL).
- احذف محتوى النص (يرفض Discord النص + الرسالة الصوتية في الحمولة نفسها).
- يُقبل أي تنسيق صوتي؛ يحوّل OpenClaw إلى OGG/Opus عند الحاجة.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="استخدام intents غير مسموح بها أو أن البوت لا يرى رسائل guild">

    - فعّل Message Content Intent
    - فعّل Server Members Intent عندما تعتمد على حل المستخدم/العضو
    - أعد تشغيل gateway بعد تغيير intents

  </Accordion>

  <Accordion title="حظر رسائل guild بشكل غير متوقع">

    - تحقق من `groupPolicy`
    - تحقق من allowlist الخاصة بـ guild ضمن `channels.discord.guilds`
    - إذا كانت خريطة `channels` الخاصة بـ guild موجودة، فلن يُسمح إلا بالقنوات المدرجة
    - تحقق من سلوك `requireMention` وأنماط الإشارة

    فحوصات مفيدة:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false لكن ما زال الحظر قائمًا">
    الأسباب الشائعة:

    - `groupPolicy="allowlist"` بدون allowlist مطابقة لـ guild/channel
    - تكوين `requireMention` في المكان الخطأ (يجب أن يكون ضمن `channels.discord.guilds` أو إدخال القناة)
    - حظر المرسل بواسطة allowlist الخاصة بـ guild/channel `users`

  </Accordion>

  <Accordion title="أدوار Discord طويلة التشغيل أو ردود مكررة">

    السجلات المعتادة:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    مفاتيح ضبط طابور Discord Gateway:

    - حساب واحد: `channels.discord.eventQueue.listenerTimeout`
    - عدة حسابات: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - يتحكم هذا فقط في عمل مستمع Discord Gateway، وليس عمر دور الوكيل

    لا يطبّق Discord مهلة مملوكة للقناة على أدوار الوكيل الموضوعة في الطابور. تسلّم مستمعات الرسائل العمل فورًا، وتحافظ تشغيلات Discord الموضوعة في الطابور على ترتيب كل جلسة إلى أن تكتمل دورة حياة الجلسة/الأداة/وقت التشغيل أو تُجهض العمل.

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
    يجلب OpenClaw بيانات Discord `/gateway/bot` الوصفية قبل الاتصال. تعود حالات الفشل العابرة إلى عنوان URL الافتراضي لـ Discord gateway وتُقيّد معدلاتها في السجلات.

    مفاتيح ضبط مهلة البيانات الوصفية:

    - حساب واحد: `channels.discord.gatewayInfoTimeoutMs`
    - عدة حسابات: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - بديل env عند عدم تعيين التكوين: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - الافتراضي: `30000` (30 ثانية)، الحد الأقصى: `120000`

  </Accordion>

  <Accordion title="إعادة التشغيل بسبب انتهاء مهلة Gateway READY">
    ينتظر OpenClaw حدث Discord gateway `READY` أثناء بدء التشغيل وبعد إعادة اتصال وقت التشغيل. قد تحتاج إعدادات الحسابات المتعددة ذات التدرج في بدء التشغيل إلى نافذة READY أطول من الافتراضية عند بدء التشغيل.

    مفاتيح ضبط مهلة READY:

    - بدء التشغيل لحساب واحد: `channels.discord.gatewayReadyTimeoutMs`
    - بدء التشغيل لعدة حسابات: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - بديل env لبدء التشغيل عند عدم تعيين التكوين: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - افتراضي بدء التشغيل: `15000` (15 ثانية)، الحد الأقصى: `120000`
    - وقت التشغيل لحساب واحد: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - وقت التشغيل لعدة حسابات: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - بديل env لوقت التشغيل عند عدم تعيين التكوين: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - افتراضي وقت التشغيل: `30000` (30 ثانية)، الحد الأقصى: `120000`

  </Accordion>

  <Accordion title="عدم تطابق تدقيق الأذونات">
    تعمل فحوصات أذونات `channels status --probe` فقط مع معرّفات القنوات الرقمية.

    إذا استخدمت مفاتيح slug، فقد تظل المطابقة في وقت التشغيل تعمل، لكن probe لا يمكنه التحقق الكامل من الأذونات.

  </Accordion>

  <Accordion title="مشكلات DM والاقتران">

    - DM معطّل: `channels.discord.dm.enabled=false`
    - سياسة DM معطّلة: `channels.discord.dmPolicy="disabled"` (قديم: `channels.discord.dm.policy`)
    - انتظار موافقة الاقتران في وضع `pairing`

  </Accordion>

  <Accordion title="حلقات البوت إلى البوت">
    افتراضيًا، تُتجاهل الرسائل المنشأة بواسطة البوتات.

    إذا عيّنت `channels.discord.allowBots=true`، فاستخدم قواعد إشارة وallowlist صارمة لتجنب سلوك الحلقات.
    يُفضّل استخدام `channels.discord.allowBots="mentions"` لقبول رسائل البوتات التي تشير إلى البوت فقط.

    يوفّر OpenClaw أيضًا [حماية حلقات البوت](/ar/channels/bot-loop-protection) المشتركة. كلما سمح `allowBots` للرسائل المنشأة بواسطة البوتات بالوصول إلى الإرسال، يربط Discord الحدث الوارد بحقائق `(account, channel, bot pair)`، ويقوم حارس الأزواج العام بكبت الزوج بعد تجاوزه ميزانية الأحداث المكوّنة. يمنع الحارس حلقات البوتين المنفلتة التي كان يجب إيقافها سابقًا بواسطة حدود معدل Discord؛ ولا يؤثر في عمليات النشر ذات البوت الواحد أو ردود البوت لمرة واحدة التي تبقى دون الميزانية.

    الإعدادات الافتراضية (نشطة عند تعيين `allowBots`):

    - `maxEventsPerWindow: 20` -- يمكن لزوج البوتات تبادل 20 رسالة ضمن النافذة المنزلقة
    - `windowSeconds: 60` -- طول النافذة المنزلقة
    - `cooldownSeconds: 60` -- بمجرد تجاوز الميزانية، تُسقط كل رسالة إضافية بين البوتات في أي اتجاه لمدة دقيقة واحدة

    كوّن الإعداد الافتراضي المشترك مرة واحدة ضمن `channels.defaults.botLoopProtection`، ثم تجاوز Discord عندما يحتاج سير عمل مشروع إلى مساحة أكبر. تكون الأولوية:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - الإعدادات الافتراضية المضمنة

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

  <Accordion title="إسقاطات STT الصوتية مع DecryptionFailed(...)">

    - أبقِ OpenClaw محدثًا (`openclaw update`) حتى تكون منطقية استعادة استقبال صوت Discord موجودة
    - تأكد من `channels.discord.voice.daveEncryption=true` (الافتراضي)
    - ابدأ من `channels.discord.voice.decryptionFailureTolerance=24` (افتراضي upstream) واضبط فقط عند الحاجة
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
- طابور الأحداث: `eventQueue.listenerTimeout` (ميزانية المستمع)، `eventQueue.maxQueueSize`, `eventQueue.maxConcurrency`
- Gateway: `gatewayInfoTimeoutMs`, `gatewayReadyTimeoutMs`, `gatewayRuntimeReadyTimeoutMs`
- الرد/السجل: `replyToMode`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- التسليم: `textChunkLimit`, `chunkMode`, `maxLinesPerMessage`
- البث: `streaming` (اسم بديل قديم: `streamMode`)، `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- الوسائط/إعادة المحاولة: `mediaMaxMb` (يحد تحميلات Discord الصادرة، الافتراضي `100MB`)، `retry`
- الإجراءات: `actions.*`
- الحضور: `activity`, `status`, `activityType`, `activityUrl`
- UI: `ui.components.accentColor`
- الميزات: `threadBindings`, المستوى الأعلى `bindings[]` (`type: "acp"`), `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## السلامة والعمليات

- تعامل مع رموز البوتات كأسرار (يُفضّل `DISCORD_BOT_TOKEN` في البيئات الخاضعة للإشراف).
- امنح أذونات Discord بأقل امتياز.
- إذا كانت حالة نشر/أوامر الأمر قديمة، فأعد تشغيل gateway وأعد الفحص باستخدام `openclaw channels status --probe`.

## ذو صلة

<CardGroup cols={2}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    اربط مستخدم Discord بالـ gateway.
  </Card>
  <Card title="المجموعات" icon="users" href="/ar/channels/groups">
    سلوك دردشة المجموعة وallowlist.
  </Card>
  <Card title="توجيه القنوات" icon="route" href="/ar/channels/channel-routing">
    وجّه الرسائل الواردة إلى الوكلاء.
  </Card>
  <Card title="الأمان" icon="shield" href="/ar/gateway/security">
    نموذج التهديد والتقوية.
  </Card>
  <Card title="توجيه عدة وكلاء" icon="sitemap" href="/ar/concepts/multi-agent">
    اربط guilds والقنوات بالوكلاء.
  </Card>
  <Card title="أوامر Slash" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلية.
  </Card>
</CardGroup>

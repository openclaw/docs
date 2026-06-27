---
read_when:
    - العمل على ميزات قناة Discord
summary: حالة دعم بوت Discord وإمكاناته وتكوينه
title: Discord
x-i18n:
    generated_at: "2026-06-27T17:09:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90ed02258347113ca5b1dfcc5169a48190e3b4e1273d27a8a5c45f0f930cdbbf
    source_path: channels/discord.md
    workflow: 16
---

جاهز للرسائل المباشرة وقنوات الخوادم عبر Discord gateway الرسمي.

<CardGroup cols={3}>
  <Card title="الإقران" icon="link" href="/ar/channels/pairing">
    تنتقل رسائل Discord المباشرة افتراضيًا إلى وضع الإقران.
  </Card>
  <Card title="أوامر الشرطة المائلة" icon="terminal" href="/ar/tools/slash-commands">
    سلوك الأوامر الأصلي وكتالوج الأوامر.
  </Card>
  <Card title="استكشاف أخطاء القنوات وإصلاحها" icon="wrench" href="/ar/channels/troubleshooting">
    تشخيصات عابرة للقنوات وتدفق الإصلاح.
  </Card>
</CardGroup>

## الإعداد السريع

ستحتاج إلى إنشاء تطبيق جديد مع بوت، وإضافة البوت إلى خادمك، وإقرانه مع OpenClaw. نوصي بإضافة البوت إلى خادمك الخاص. إذا لم يكن لديك خادم بعد، [أنشئ واحدًا أولًا](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server) (اختر **Create My Own > For me and my friends**).

<Steps>
  <Step title="إنشاء تطبيق Discord وبوت">
    انتقل إلى [Discord Developer Portal](https://discord.com/developers/applications) وانقر **New Application**. سمّه شيئًا مثل "OpenClaw".

    انقر **Bot** في الشريط الجانبي. اضبط **Username** على أي اسم تطلقه على وكيل OpenClaw لديك.

  </Step>

  <Step title="تفعيل النوايا ذات الامتياز">
    بينما لا تزال في صفحة **Bot**، مرّر لأسفل إلى **Privileged Gateway Intents** وفعّل:

    - **Message Content Intent** (مطلوب)
    - **Server Members Intent** (موصى به؛ مطلوب لقوائم السماح بالأدوار ومطابقة الأسماء مع المعرّفات)
    - **Presence Intent** (اختياري؛ مطلوب فقط لتحديثات الحضور)

  </Step>

  <Step title="نسخ رمز البوت">
    مرّر مجددًا إلى أعلى صفحة **Bot** وانقر **Reset Token**.

    <Note>
    رغم الاسم، فهذا ينشئ أول رمز لك — لا تتم "إعادة ضبط" أي شيء.
    </Note>

    انسخ الرمز واحفظه في مكان ما. هذا هو **Bot Token** وستحتاج إليه بعد قليل.

  </Step>

  <Step title="إنشاء عنوان URL للدعوة وإضافة البوت إلى خادمك">
    انقر **OAuth2** في الشريط الجانبي. ستنشئ عنوان URL للدعوة بالأذونات الصحيحة لإضافة البوت إلى خادمك.

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

    هذه هي المجموعة الأساسية لقنوات النص العادية. إذا كنت تخطط للنشر في سلاسل Discord، بما في ذلك سير عمل قنوات المنتديات أو الوسائط التي تنشئ سلسلة أو تتابعها، فعّل أيضًا **Send Messages in Threads**.
    انسخ عنوان URL المُنشأ في الأسفل، والصقه في متصفحك، وحدد خادمك، وانقر **Continue** للاتصال. يجب أن ترى الآن البوت في خادم Discord.

  </Step>

  <Step title="تفعيل وضع المطوّر وجمع معرّفاتك">
    بالعودة إلى تطبيق Discord، تحتاج إلى تفعيل وضع المطوّر حتى تتمكن من نسخ المعرّفات الداخلية.

    1. انقر **User Settings** (أيقونة الترس بجانب صورتك الرمزية) → **Advanced** → فعّل **Developer Mode**
    2. انقر بزر الماوس الأيمن على **أيقونة الخادم** في الشريط الجانبي → **Copy Server ID**
    3. انقر بزر الماوس الأيمن على **صورتك الرمزية** → **Copy User ID**

    احفظ **Server ID** و**User ID** إلى جانب Bot Token — سترسل الثلاثة جميعًا إلى OpenClaw في الخطوة التالية.

  </Step>

  <Step title="السماح بالرسائل المباشرة من أعضاء الخادم">
    لكي يعمل الإقران، يحتاج Discord إلى السماح للبوت بإرسال رسالة مباشرة إليك. انقر بزر الماوس الأيمن على **أيقونة الخادم** → **Privacy Settings** → فعّل **Direct Messages**.

    يتيح هذا لأعضاء الخادم (بما في ذلك البوتات) إرسال رسائل مباشرة إليك. أبقِ هذا مفعّلًا إذا كنت تريد استخدام رسائل Discord المباشرة مع OpenClaw. إذا كنت تخطط لاستخدام قنوات الخادم فقط، يمكنك تعطيل الرسائل المباشرة بعد الإقران.

  </Step>

  <Step title="تعيين رمز البوت بأمان (لا ترسله في الدردشة)">
    رمز بوت Discord لديك سرّي (مثل كلمة المرور). عيّنه على الجهاز الذي يشغّل OpenClaw قبل مراسلة وكيلك.

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
    لتثبيتات الخدمة المُدارة، شغّل `openclaw gateway install` من صدفة يتوفر فيها `DISCORD_BOT_TOKEN`، أو خزّن المتغير في `~/.openclaw/.env`، حتى تتمكن الخدمة من حلّ SecretRef للبيئة بعد إعادة التشغيل.
    إذا كان مضيفك محظورًا أو محدود المعدل بسبب بحث تطبيق بدء التشغيل في Discord، فعيّن معرّف تطبيق/عميل Discord من Developer Portal حتى يتمكن بدء التشغيل من تخطي استدعاء REST ذلك. استخدم `channels.discord.applicationId` للحساب الافتراضي، أو `channels.discord.accounts.<accountId>.applicationId` عندما تشغّل عدة بوتات Discord.

  </Step>

  <Step title="تكوين OpenClaw والإقران">

    <Tabs>
      <Tab title="اسأل وكيلك">
        تحدث مع وكيل OpenClaw لديك على أي قناة موجودة (مثل Telegram) وأخبره بذلك. إذا كانت Discord قناتك الأولى، فاستخدم تبويب CLI / config بدلًا من ذلك.

        > "لقد عيّنت بالفعل رمز بوت Discord في الإعداد. يُرجى إكمال إعداد Discord باستخدام User ID `<user_id>` و Server ID `<server_id>`."
      </Tab>
      <Tab title="CLI / config">
        إذا كنت تفضّل الإعداد المستند إلى ملف، فعيّن:

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

        للإعداد البرمجي أو البعيد، اكتب كتلة JSON5 نفسها باستخدام `openclaw config patch --file ./discord.patch.json5 --dry-run` ثم أعد التشغيل من دون `--dry-run`. قيم `token` بالنص الصريح مدعومة. كما تُدعم قيم SecretRef لـ `channels.discord.token` عبر مزوّدي env/file/exec. راجع [إدارة الأسرار](/ar/gateway/secrets).

        لعدة بوتات Discord، احتفظ برمز كل بوت ومعرّف التطبيق الخاص به ضمن حسابه. يرث كل حساب `channels.discord.applicationId` من المستوى الأعلى، لذا لا تعيّنه هناك إلا عندما ينبغي لكل حساب استخدام معرّف التطبيق نفسه.

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
    انتظر حتى يصبح Gateway قيد التشغيل، ثم أرسل رسالة مباشرة إلى بوتك في Discord. سيرد برمز إقران.

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

    ينبغي أن تتمكن الآن من الدردشة مع وكيلك في Discord عبر رسالة مباشرة.

  </Step>
</Steps>

<Note>
حلّ الرمز يراعي الحساب. قيم رمز الإعداد لها الأولوية على احتياطي البيئة. يُستخدم `DISCORD_BOT_TOKEN` للحساب الافتراضي فقط.
إذا تم حلّ حسابي Discord مفعّلين إلى رمز البوت نفسه، فإن OpenClaw يبدأ مراقب Gateway واحدًا فقط لذلك الرمز. الرمز القادم من الإعداد يفوز على احتياطي البيئة الافتراضي؛ وإلا يفوز أول حساب مفعّل ويُبلّغ عن الحساب المكرر على أنه معطّل.
للاستدعاءات الصادرة المتقدمة (أداة الرسائل/إجراءات القناة)، يُستخدم `token` صريح لكل استدعاء لذلك الاستدعاء. ينطبق هذا على إجراءات الإرسال والقراءة/الفحص (مثل read/search/fetch/thread/pins/permissions). لا تزال سياسة الحساب/إعدادات إعادة المحاولة تأتي من الحساب المحدد في لقطة وقت التشغيل النشطة.
</Note>

## موصى به: إعداد مساحة عمل للخادم

بعد أن تعمل الرسائل المباشرة، يمكنك إعداد خادم Discord لديك كمساحة عمل كاملة يحصل فيها كل قناة على جلسة وكيل خاصة بها مع سياقها الخاص. يوصى بهذا للخوادم الخاصة التي تضمك أنت وبوتك فقط.

<Steps>
  <Step title="إضافة خادمك إلى قائمة السماح للخوادم">
    يمكّن هذا وكيلك من الرد في أي قناة على خادمك، وليس فقط الرسائل المباشرة.

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

  <Step title="السماح بالردود من دون @mention">
    افتراضيًا، لا يرد وكيلك في قنوات الخادم إلا عند @mentioned. بالنسبة إلى خادم خاص، سترغب غالبًا في أن يرد على كل رسالة.

    في قنوات الخادم، تُنشر الردود العادية تلقائيًا افتراضيًا. بالنسبة إلى الغرف المشتركة الدائمة التشغيل، اختر `messages.groupChat.visibleReplies: "message_tool"` حتى يستطيع الوكيل المراقبة بصمت ولا ينشر إلا عندما يقرر أن رد القناة مفيد. يعمل هذا بأفضل شكل مع نماذج الجيل الأحدث الموثوقة في الأدوات مثل GPT 5.5. تبقى أحداث الغرفة المحيطة صامتة ما لم تُرسل الأداة. راجع [أحداث الغرفة المحيطة](/ar/channels/ambient-room-events) للحصول على إعداد وضع المراقبة الكامل.

    إذا أظهر Discord مؤشر الكتابة وأظهرت السجلات استخدام الرموز ولكن لم تُنشر أي رسالة، فتحقق مما إذا كانت الجولة مُكوّنة كحدث غرفة محيطة أو اختارت الردود المرئية عبر أداة الرسائل.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "اسمح لوكيلي بالرد على هذا الخادم من دون الحاجة إلى أن تتم الإشارة إليه بـ @"
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

        لطلب إرسال أداة الرسائل للردود المرئية في المجموعات/القنوات، عيّن `messages.groupChat.visibleReplies: "message_tool"`.

      </Tab>
    </Tabs>

  </Step>

  <Step title="التخطيط للذاكرة في قنوات الخادم">
    افتراضيًا، تُحمّل الذاكرة طويلة الأمد (MEMORY.md) في جلسات الرسائل المباشرة فقط. لا تحمّل قنوات الخادم MEMORY.md تلقائيًا.

    <Tabs>
      <Tab title="اسأل وكيلك">
        > "عندما أطرح أسئلة في قنوات Discord، استخدم memory_search أو memory_get إذا كنت بحاجة إلى سياق طويل الأمد من MEMORY.md."
      </Tab>
      <Tab title="يدوي">
        إذا كنت بحاجة إلى سياق مشترك في كل قناة، فضع التعليمات المستقرة في `AGENTS.md` أو `USER.md` (يتم حقنها في كل جلسة). احتفظ بالملاحظات طويلة الأمد في `MEMORY.md` وادخل إليها عند الطلب باستخدام أدوات الذاكرة.
      </Tab>
    </Tabs>

  </Step>
</Steps>

الآن أنشئ بعض القنوات على خادم Discord لديك وابدأ الدردشة. يستطيع وكيلك رؤية اسم القناة، وتحصل كل قناة على جلستها المعزولة الخاصة — لذا يمكنك إعداد `#coding` أو `#home` أو `#research` أو أي شيء يناسب سير عملك.

## نموذج وقت التشغيل

- يملك Gateway اتصال Discord.
- توجيه الردود حتمي: تعود الردود الواردة من Discord إلى Discord.
- تُضاف بيانات تعريف خادم/قناة Discord إلى موجه النموذج كسياق غير موثوق،
  وليس كبادئة رد مرئية للمستخدم. إذا نسخ نموذج ذلك الغلاف
  مرة أخرى، يزيل OpenClaw بيانات التعريف المنسوخة من الردود الصادرة ومن
  سياق إعادة التشغيل المستقبلي.
- افتراضيًا (`session.dmScope=main`)، تشارك المحادثات المباشرة جلسة الوكيل الرئيسية (`agent:main:main`).
- قنوات الخوادم هي مفاتيح جلسات معزولة (`agent:<agentId>:discord:channel:<channelId>`).
- تُتجاهل الرسائل المباشرة الجماعية افتراضيًا (`channels.discord.dm.groupEnabled=false`).
- تعمل أوامر الشرطة المائلة الأصلية في جلسات أوامر معزولة (`agent:<agentId>:discord:slash:<userId>`)، مع استمرار حمل `CommandTargetSessionKey` إلى جلسة المحادثة الموجّهة.
- يستخدم تسليم إعلانات cron/heartbeat النصية فقط إلى Discord الإجابة النهائية
  المرئية للمساعد مرة واحدة. تظل وسائط وحمولات المكونات المنظمة
  متعددة الرسائل عندما يصدر الوكيل حمولات متعددة قابلة للتسليم.

## قنوات المنتدى

لا تقبل قنوات منتدى ووسائط Discord إلا منشورات الخيوط. يدعم OpenClaw طريقتين لإنشائها:

- أرسل رسالة إلى أصل المنتدى (`channel:<forumId>`) لإنشاء خيط تلقائيًا. يستخدم عنوان الخيط أول سطر غير فارغ من رسالتك.
- استخدم `openclaw message thread create` لإنشاء خيط مباشرة. لا تمرر `--message-id` لقنوات المنتدى.

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

لا تقبل أصول المنتديات مكونات Discord. إذا كنت تحتاج إلى مكونات، فأرسل إلى الخيط نفسه (`channel:<threadId>`).

## المكونات التفاعلية

يدعم OpenClaw حاويات مكونات Discord v2 لرسائل الوكيل. استخدم أداة الرسائل مع حمولة `components`. تُوجّه نتائج التفاعل إلى الوكيل كرسائل واردة عادية وتتبع إعدادات Discord `replyToMode` الحالية.

الكتل المدعومة:

- `text`، `section`، `separator`، `actions`، `media-gallery`، `file`
- تسمح صفوف الإجراءات بما يصل إلى 5 أزرار أو قائمة تحديد واحدة
- أنواع التحديد: `string`، `user`، `role`، `mentionable`، `channel`

افتراضيًا، تكون المكونات للاستخدام مرة واحدة. عيّن `components.reusable=true` للسماح باستخدام الأزرار والتحديدات والنماذج عدة مرات حتى تنتهي صلاحيتها.

لتقييد من يمكنه النقر على زر، عيّن `allowedUsers` على ذلك الزر (معرّفات مستخدمي Discord أو الوسوم أو `*`). عند التهيئة، يتلقى المستخدمون غير المطابقين رفضًا عابرًا.

تنتهي صلاحية استدعاءات المكونات بعد 30 دقيقة افتراضيًا. عيّن `channels.discord.agentComponents.ttlMs` لتغيير مدة سجل الاستدعاءات هذه لحساب Discord الافتراضي، أو `channels.discord.accounts.<accountId>.agentComponents.ttlMs` لتجاوز حساب واحد في إعداد متعدد الحسابات. القيمة بالمللي ثانية، ويجب أن تكون عددًا صحيحًا موجبًا، ومحددة بسقف `86400000` (24 ساعة). تفيد مدد TTL الأطول لسير عمل المراجعة أو الموافقة التي تحتاج إلى بقاء الأزرار قابلة للاستخدام، لكنها توسّع أيضًا النافذة التي يمكن فيها لرسالة Discord قديمة أن تستمر في تشغيل إجراء. فضّل أقصر TTL يناسب سير العمل، واحتفظ بالافتراضي عندما تكون الاستدعاءات القديمة مفاجئة.

تفتح أوامر الشرطة المائلة `/model` و`/models` منتقي نماذج تفاعليًا مع قوائم منسدلة للمزوّد والنموذج ووقت التشغيل المتوافق إضافة إلى خطوة إرسال. أصبح `/models add` مهملاً ويعيد الآن رسالة إهمال بدلًا من تسجيل النماذج من المحادثة. رد المنتقي عابر ولا يمكن استخدامه إلا من قبل المستخدم المستدعي. تقتصر قوائم تحديد Discord على 25 خيارًا، لذا أضف إدخالات `provider/*` إلى `agents.defaults.models` عندما تريد أن يعرض المنتقي النماذج المكتشفة ديناميكيًا فقط للمزوّدين المحددين مثل `openai` أو `vllm`.

مرفقات الملفات:

- يجب أن تشير كتل `file` إلى مرجع مرفق (`attachment://<filename>`)
- وفّر المرفق عبر `media`/`path`/`filePath` (ملف واحد)؛ استخدم `media-gallery` لملفات متعددة
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

    إذا لم تكن سياسة الرسائل المباشرة مفتوحة، فسيُحظر المستخدمون غير المعروفين (أو يُطلب منهم الاقتران في وضع `pairing`).

    أسبقية الحسابات المتعددة:

    - ينطبق `channels.discord.accounts.default.allowFrom` فقط على الحساب `default`.
    - لحساب واحد، تكون أسبقية `allowFrom` على `dm.allowFrom` القديم.
    - ترث الحسابات المسماة `channels.discord.allowFrom` عندما لا تكون `allowFrom` الخاصة بها و`dm.allowFrom` القديمة معيّنتين.
    - لا ترث الحسابات المسماة `channels.discord.accounts.default.allowFrom`.

    ما زال `channels.discord.dm.policy` و`channels.discord.dm.allowFrom` القديمان يُقرآن للتوافق. يرحّلهما `openclaw doctor --fix` إلى `dmPolicy` و`allowFrom` عندما يمكنه فعل ذلك دون تغيير الوصول.

    تنسيق هدف الرسائل المباشرة للتسليم:

    - `user:<id>`
    - إشارة `<@id>`

    عادةً ما تُحل معرّفات الأرقام الصرفة كمعرّفات قنوات عندما يكون افتراضي قناة نشطًا، لكن المعرّفات المدرجة في `allowFrom` الفعّالة للرسائل المباشرة للحساب تُعامل كأهداف رسائل مباشرة للمستخدمين من أجل التوافق.

  </Tab>

  <Tab title="مجموعات الوصول">
    يمكن أن تستخدم رسائل Discord المباشرة وتفويض الأوامر النصية إدخالات `accessGroup:<name>` ديناميكية في `channels.discord.allowFrom`.

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

    لا تحتوي قناة Discord النصية على قائمة أعضاء منفصلة. يصوغ `type: "discord.channelAudience"` العضوية على النحو التالي: مرسل الرسالة المباشرة عضو في الخادم المهيأ ولديه حاليًا إذن `ViewChannel` فعّال على القناة المهيأة بعد تطبيق أدوار القناة وتجاوزاتها.

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

    تفشل عمليات البحث بشكل مغلق. إذا أعاد Discord الخطأ `Missing Access`، أو فشل البحث عن العضو، أو كانت القناة تنتمي إلى خادم مختلف، فيُعامل مرسل الرسالة المباشرة كغير مصرح له.

    فعّل **Server Members Intent** في Discord Developer Portal للروبوت عند استخدام مجموعات وصول جمهور القناة. لا تتضمن الرسائل المباشرة حالة عضو الخادم، لذلك يحل OpenClaw العضو عبر Discord REST وقت التفويض.

  </Tab>

  <Tab title="سياسة الخادم">
    يتحكم `channels.discord.groupPolicy` في التعامل مع الخوادم:

    - `open`
    - `allowlist`
    - `disabled`

    خط الأساس الآمن عند وجود `channels.discord` هو `allowlist`.

    سلوك `allowlist`:

    - يجب أن يطابق الخادم `channels.discord.guilds` (يُفضّل `id`، ويُقبل الاسم المختصر)
    - قوائم سماح اختيارية للمرسلين: `users` (يوصى بالمعرّفات الثابتة) و`roles` (معرّفات الأدوار فقط)؛ إذا هُيئ أي منهما، يُسمح للمرسلين عند مطابقتهم `users` أو `roles`
    - تكون مطابقة الاسم/الوسم المباشرة معطلة افتراضيًا؛ فعّل `channels.discord.dangerouslyAllowNameMatching: true` فقط كوضع توافق لكسر الطوارئ
    - الأسماء/الوسوم مدعومة لـ `users`، لكن المعرّفات أكثر أمانًا؛ يحذر `openclaw security audit` عند استخدام إدخالات الاسم/الوسم
    - إذا كان لدى خادم `channels` مهيأة، تُرفض القنوات غير المدرجة
    - إذا لم يكن لدى خادم كتلة `channels`، يُسمح بكل القنوات في ذلك الخادم الموجود في قائمة السماح

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

    إذا عيّنت `DISCORD_BOT_TOKEN` فقط ولم تنشئ كتلة `channels.discord`، فإن احتياطي وقت التشغيل هو `groupPolicy="allowlist"` (مع تحذير في السجلات)، حتى لو كان `channels.defaults.groupPolicy` هو `open`.

  </Tab>

  <Tab title="الإشارات والرسائل المباشرة الجماعية">
    تخضع رسائل الخادم لبوابة الإشارة افتراضيًا.

    يتضمن اكتشاف الإشارة:

    - إشارة صريحة إلى الروبوت
    - أنماط الإشارة المهيأة (`agents.list[].groupChat.mentionPatterns`، والاحتياطي `messages.groupChat.mentionPatterns`)
    - سلوك الرد الضمني على الروبوت في الحالات المدعومة

    عند كتابة رسائل Discord صادرة، استخدم صيغة الإشارة الأساسية: `<@USER_ID>` للمستخدمين، و`<#CHANNEL_ID>` للقنوات، و`<@&ROLE_ID>` للأدوار. لا تستخدم صيغة إشارة اللقب القديمة `<@!USER_ID>`.

    يُهيّأ `requireMention` لكل خادم/قناة (`channels.discord.guilds...`).
    يسقط `ignoreOtherMentions` اختياريًا الرسائل التي تشير إلى مستخدم/دور آخر لكن لا تشير إلى الروبوت (باستثناء @everyone/@here).

    الرسائل المباشرة الجماعية:

    - الافتراضي: تُتجاهل (`dm.groupEnabled=false`)
    - قائمة سماح اختيارية عبر `dm.groupChannels` (معرّفات القنوات أو الأسماء المختصرة)

  </Tab>
</Tabs>

### توجيه الوكيل المستند إلى الدور

استخدم `bindings[].match.roles` لتوجيه أعضاء خادم Discord إلى وكلاء مختلفين حسب معرف الدور. تقبل الارتباطات القائمة على الأدوار معرفات الأدوار فقط، وتُقيَّم بعد ارتباطات النظير أو النظير الأصل وقبل الارتباطات الخاصة بالخادم فقط. إذا عيّن ارتباط ما حقول مطابقة أخرى أيضًا (على سبيل المثال `peer` + `guildId` + `roles`)، فيجب أن تتطابق كل الحقول المكوّنة.

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
- التجاوز حسب القناة: `channels.discord.commands.native`.
- يتخطى `commands.native=false` تسجيل أوامر الشرطة المائلة في Discord وتنظيفها أثناء بدء التشغيل. قد تبقى الأوامر المسجلة سابقًا ظاهرة في Discord حتى تزيلها من تطبيق Discord.
- تستخدم مصادقة الأوامر الأصلية قوائم السماح/السياسات نفسها في Discord مثل معالجة الرسائل العادية.
- قد تظل الأوامر ظاهرة في واجهة Discord للمستخدمين غير المصرح لهم؛ لكن التنفيذ يظل يفرض مصادقة OpenClaw ويعيد "غير مصرح به".

راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands) لمعرفة فهرس الأوامر وسلوكها.

إعدادات أوامر الشرطة المائلة الافتراضية:

- `ephemeral: true`

## تفاصيل الميزة

<AccordionGroup>
  <Accordion title="Reply tags and native replies">
    يدعم Discord وسوم الرد في مخرجات الوكيل:

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    يتحكم فيها `channels.discord.replyToMode`:

    - `off` (افتراضي)
    - `first`
    - `all`
    - `batched`

    ملاحظة: يعطّل `off` إنشاء خيوط الرد الضمنية. لا تزال وسوم `[[reply_to_*]]` الصريحة محترمة.
    يرفق `first` دائمًا مرجع الرد الأصلي الضمني بأول رسالة Discord صادرة للدور.
    لا يرفق `batched` مرجع الرد الأصلي الضمني في Discord إلا عندما يكون
    الحدث الوارد دفعة مؤجلة من رسائل متعددة. يفيد ذلك
    عندما تريد الردود الأصلية أساسًا للمحادثات المتدفقة الملتبسة، وليس لكل
    دور برسالة واحدة.

    تظهر معرفات الرسائل في السياق/السجل حتى تتمكن الوكلاء من استهداف رسائل محددة.

  </Accordion>

  <Accordion title="Link previews">
    ينشئ Discord تضمينات روابط غنية لعناوين URL افتراضيًا. يكبح OpenClaw تلك التضمينات المُنشأة في رسائل Discord الصادرة افتراضيًا، لذلك تبقى عناوين URL التي يرسلها الوكيل روابط عادية ما لم تختر تفعيلها:

```json5
{
  channels: {
    discord: {
      suppressEmbeds: false,
    },
  },
}
```

    عيّن `channels.discord.accounts.<id>.suppressEmbeds` لتجاوز حساب واحد. يمكن لإرسالات أداة رسائل الوكيل أيضًا تمرير `suppressEmbeds: false` لرسالة واحدة. لا تُكبح حمولات `embeds` الصريحة في Discord بواسطة إعداد معاينة الروابط الافتراضي.

  </Accordion>

  <Accordion title="Live stream preview">
    يستطيع OpenClaw بث مسودات الردود بإرسال رسالة مؤقتة وتحريرها أثناء وصول النص. يقبل `channels.discord.streaming` القيم `off` | `partial` | `block` | `progress` (افتراضي). يحتفظ `progress` بمسودة حالة واحدة قابلة للتحرير ويحدّثها بتقدم الأدوات حتى التسليم النهائي؛ تسمية البدء المشتركة سطر متحرك، لذلك تمر بعيدًا مثل البقية عندما يظهر عمل كاف. `streamMode` اسم بديل قديم في وقت التشغيل. شغّل `openclaw doctor --fix` لإعادة كتابة الإعدادات المحفوظة إلى المفتاح القانوني.

    عيّن `channels.discord.streaming.mode` إلى `off` لتعطيل تعديلات المعاينة في Discord. إذا فُعّل بث الكتل في Discord صراحةً، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

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

    - يحرر `partial` رسالة معاينة واحدة أثناء وصول الرموز.
    - يصدر `block` أجزاء بحجم المسودة (استخدم `draftChunk` لضبط الحجم ونقاط الفصل، مع تقييده بـ `textChunkLimit`).
    - تلغي النهايات الخاصة بالوسائط والخطأ والرد الصريح تعديلات المعاينة المعلّقة.
    - يتحكم `streaming.preview.toolProgress` (افتراضيًا `true`) فيما إذا كانت تحديثات الأداة/التقدم تعيد استخدام رسالة المعاينة.
    - تُعرض صفوف الأداة/التقدم كرمز تعبيري مضغوط + عنوان + تفصيل عند توفرها، مثل `🛠️ Bash: run tests` أو `🔎 Web Search: for "query"`.
    - يختار `streaming.progress.commentary` (افتراضيًا `false`) تضمين نص تعليق/مقدمة المساعد في مسودة التقدم المؤقتة. يُنظّف التعليق قبل العرض، ويبقى مؤقتًا، ولا يغيّر تسليم الإجابة النهائية.
    - يتحكم `streaming.progress.maxLineChars` في ميزانية معاينة التقدم لكل سطر. تُقصّر النثر عند حدود الكلمات؛ وتحتفظ تفاصيل الأوامر والمسارات باللواحق المفيدة.
    - يتحكم `streaming.preview.commandText` / `streaming.progress.commandText` في تفاصيل الأمر/التنفيذ ضمن أسطر التقدم المضغوطة: `raw` (افتراضي) أو `status` (تسمية الأداة فقط).

    أخفِ نص الأمر/التنفيذ الخام مع إبقاء أسطر التقدم المضغوطة:

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

    بث المعاينة نصي فقط؛ تعود ردود الوسائط إلى التسليم العادي. عندما يكون بث `block` مفعّلًا صراحةً، يتخطى OpenClaw بث المعاينة لتجنب البث المزدوج.

  </Accordion>

  <Accordion title="History, context, and thread behavior">
    سياق سجل الخادم:

    - `channels.discord.historyLimit` الافتراضي `20`
    - الرجوع الاحتياطي: `messages.groupChat.historyLimit`
    - `0` يعطّل

    عناصر التحكم في سجل الرسائل المباشرة:

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    سلوك الخيوط:

    - تُوجّه خيوط Discord كجلسات قنوات وترث إعدادات القناة الأصل ما لم تُتجاوز.
    - ترث جلسات الخيوط اختيار `/model` على مستوى جلسة القناة الأصل كرجوع احتياطي للنموذج فقط؛ لا تزال اختيارات `/model` المحلية للخيط لها الأولوية ولا يُنسخ سجل نص القناة الأصل ما لم يُفعّل توريث النص.
    - يختار `channels.discord.thread.inheritParent` (افتراضيًا `false`) بذور الخيوط التلقائية الجديدة من نص القناة الأصل. توجد التجاوزات حسب الحساب تحت `channels.discord.accounts.<id>.thread.inheritParent`.
    - يمكن لتفاعلات أداة الرسائل حل أهداف الرسائل المباشرة `user:<id>`.
    - يُحفظ `guilds.<guild>.channels.<channel>.requireMention: false` أثناء رجوع تفعيل مرحلة الرد.

    تُحقن مواضيع القناة كسياق **غير موثوق**. تضبط قوائم السماح من يمكنه تشغيل الوكيل، وليست حدًا كاملًا لتنقيح السياق التكميلي.

  </Accordion>

  <Accordion title="Thread-bound sessions for subagents">
    يستطيع Discord ربط خيط بهدف جلسة بحيث تستمر رسائل المتابعة في ذلك الخيط بالتوجيه إلى الجلسة نفسها (بما في ذلك جلسات الوكلاء الفرعيين).

    الأوامر:

    - `/focus <target>` اربط الخيط الحالي/الجديد بهدف وكيل فرعي/جلسة
    - `/unfocus` أزل ارتباط الخيط الحالي
    - `/agents` اعرض عمليات التشغيل النشطة وحالة الارتباط
    - `/session idle <duration|off>` افحص/حدّث إلغاء التركيز التلقائي عند الخمول للارتباطات المركّزة
    - `/session max-age <duration|off>` افحص/حدّث الحد الأقصى الصارم للعمر للارتباطات المركّزة

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

    - يعيّن `session.threadBindings.*` الافتراضات العامة.
    - يتجاوز `channels.discord.threadBindings.*` سلوك Discord.
    - يتحكم `spawnSessions` في إنشاء/ربط الخيوط تلقائيًا لـ `sessions_spawn({ thread: true })` وعمليات إنشاء خيوط ACP. الافتراضي: `true`.
    - يتحكم `defaultSpawnContext` في سياق الوكيل الفرعي الأصلي لعمليات الإنشاء المرتبطة بالخيوط. الافتراضي: `"fork"`.
    - تُرحَّل المفاتيح المهملة `spawnSubagentSessions`/`spawnAcpSessions` بواسطة `openclaw doctor --fix`.
    - إذا كانت ارتباطات الخيوط معطلة لحساب ما، فلن تكون `/focus` وعمليات ارتباط الخيوط ذات الصلة متاحة.

    راجع [الوكلاء الفرعيون](/ar/tools/subagents)، و[وكلاء ACP](/ar/tools/acp-agents)، و[مرجع الإعدادات](/ar/gateway/configuration-reference).

  </Accordion>

  <Accordion title="Persistent ACP channel bindings">
    لمساحات عمل ACP المستقرة "دائمة التشغيل"، كوّن ارتباطات ACP مكتوبة على المستوى الأعلى تستهدف محادثات Discord.

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

    - يربط `/acp spawn codex --bind here` القناة أو الخيط الحالي في موضعه ويبقي الرسائل المستقبلية على جلسة ACP نفسها. ترث رسائل الخيوط ارتباط القناة الأصل.
    - في قناة أو خيط مرتبط، يعيد `/new` و`/reset` تعيين جلسة ACP نفسها في موضعها. يمكن لارتباطات الخيوط المؤقتة تجاوز حل الهدف أثناء نشاطها.
    - يضبط `spawnSessions` إنشاء/ربط الخيط الفرعي عبر `--thread auto|here`.

    راجع [وكلاء ACP](/ar/tools/acp-agents) لمعرفة تفاصيل سلوك الارتباط.

  </Accordion>

  <Accordion title="Reaction notifications">
    وضع إشعارات التفاعلات لكل خادم:

    - `off`
    - `own` (افتراضي)
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
    - رجوع احتياطي إلى رمز تعبيري لهوية الوكيل (`agents.list[].identity.emoji`، وإلا "👀")

    ملاحظات:

    - يقبل Discord الرموز التعبيرية الموحدة أو أسماء الرموز التعبيرية المخصصة.
    - استخدم `""` لتعطيل التفاعل لقناة أو حساب.

  </Accordion>

  <Accordion title="Config writes">
    كتابات الإعدادات التي تبدأها القناة مفعّلة افتراضيًا.

    يؤثر ذلك في تدفقات `/config set|unset` (عند تفعيل ميزات الأوامر).

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

    تجاوز حسب الحساب:

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
    - تتم مطابقة أسماء عرض الأعضاء حسب الاسم/المعرّف المختصر فقط عندما تكون `channels.discord.dangerouslyAllowNameMatching: true`
    - تستخدم عمليات البحث معرّف الرسالة الأصلي وتكون مقيّدة بنافذة زمنية
    - إذا فشل البحث، تُعامل الرسائل الممرّرة عبر الوكيل كرسائل بوت ويتم إسقاطها ما لم تكن `allowBots=true`

  </Accordion>

  <Accordion title="أسماء مستعارة للإشارات الصادرة">
    استخدم `mentionAliases` عندما يحتاج الوكلاء إلى إشارات صادرة حتمية لمستخدمي Discord معروفين. المفاتيح هي المعرّفات دون `@` البادئة؛ والقيم هي معرّفات مستخدمي Discord. تُترك المعرّفات غير المعروفة، و`@everyone`، و`@here`، والإشارات داخل مقاطع كود Markdown دون تغيير.

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
    تُطبّق تحديثات الحضور عند ضبط حقل الحالة أو النشاط، أو عند تفعيل الحضور التلقائي.

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
    - 4: مخصص (يستخدم نص النشاط كحالة الحالة؛ الرمز التعبيري اختياري)
    - 5: المنافسة

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

    يفعّل Discord موافقات التنفيذ الأصلية تلقائيًا عندما تكون `enabled` غير مضبوطة أو `"auto"` ويمكن حلّ موافق واحد على الأقل، إما من `execApprovals.approvers` أو من `commands.ownerAllowFrom`. لا يستنتج Discord موافقي التنفيذ من `allowFrom` الخاصة بالقناة، أو `dm.allowFrom` القديمة، أو `defaultTo` الخاصة بالرسائل المباشرة. اضبط `enabled: false` لتعطيل Discord صراحةً كعميل موافقة أصلي.

    بالنسبة إلى أوامر المجموعات الحساسة الخاصة بالمالك فقط مثل `/diagnostics` و`/export-trajectory`، يرسل OpenClaw مطالبات الموافقة والنتائج النهائية بشكل خاص. يحاول أولًا استخدام رسالة Discord خاصة عندما يكون للمالك المستدعي مسار مالك في Discord؛ وإذا لم يكن ذلك متاحًا، يعود إلى أول مسار مالك متاح من `commands.ownerAllowFrom`، مثل Telegram.

    عندما تكون `target` هي `channel` أو `both`، تكون مطالبة الموافقة مرئية في القناة. يمكن للموافقين الذين تم حلّهم فقط استخدام الأزرار؛ ويتلقى المستخدمون الآخرون رفضًا عابرًا. تتضمن مطالبات الموافقة نص الأمر، لذلك فعّل تسليم القناة في القنوات الموثوقة فقط. إذا تعذر اشتقاق معرّف القناة من مفتاح الجلسة، يعود OpenClaw إلى التسليم عبر الرسائل الخاصة.

    يعرض Discord أيضًا أزرار الموافقة المشتركة التي تستخدمها قنوات الدردشة الأخرى. يضيف موائم Discord الأصلي أساسًا توجيه الرسائل الخاصة للموافقين والتوزيع على القنوات.
    عند وجود هذه الأزرار، تكون هي تجربة الموافقة الأساسية؛ وينبغي أن يضمّن OpenClaw
    أمر `/approve` يدويًا فقط عندما تشير نتيجة الأداة إلى
    أن موافقات الدردشة غير متاحة أو أن الموافقة اليدوية هي المسار الوحيد.
    إذا لم يكن وقت تشغيل الموافقة الأصلي في Discord نشطًا، يُبقي OpenClaw
    مطالبة `/approve <id> <decision>` المحلية الحتمية مرئية. إذا كان
    وقت التشغيل نشطًا ولكن تعذر تسليم بطاقة أصلية إلى أي هدف،
    يرسل OpenClaw إشعار عودة في الدردشة نفسها يتضمن أمر `/approve`
    الدقيق من الموافقة المعلّقة.

    تتبع مصادقة Gateway وحلّ الموافقات عقد عميل Gateway المشترك (تُحل معرّفات `plugin:` عبر `plugin.approval.resolve`؛ والمعرّفات الأخرى عبر `exec.approval.resolve`). تنتهي صلاحية الموافقات بعد 30 دقيقة افتراضيًا.

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

يقبل إجراء `event-create` معامل `image` اختياريًا (رابط URL أو مسار ملف محلي) لتعيين صورة غلاف الحدث المجدول.

توجد بوابات الإجراءات ضمن `channels.discord.actions.*`.

سلوك البوابة الافتراضي:

| مجموعة الإجراءات                                                                                                                                                         | الافتراضي |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | مفعّل    |
| roles                                                                                                                                                                    | معطّل    |
| moderation                                                                                                                                                               | معطّل    |
| presence                                                                                                                                                                 | معطّل    |

## واجهة مستخدم المكونات v2

يستخدم OpenClaw مكونات Discord v2 لموافقات التنفيذ وعلامات السياق المتقاطع. يمكن لإجراءات رسائل Discord أيضًا قبول `components` لواجهة مستخدم مخصصة (متقدم؛ يتطلب إنشاء حمولة مكوّن عبر أداة discord)، بينما تظل `embeds` القديمة متاحة لكنها غير موصى بها.

- يضبط `channels.discord.ui.components.accentColor` لون التمييز المستخدم في حاويات مكونات Discord (سداسي عشري).
- اضبطه لكل حساب باستخدام `channels.discord.accounts.<id>.ui.components.accentColor`.
- يتحكم `channels.discord.agentComponents.ttlMs` في مدة بقاء استدعاءات مكونات Discord المرسلة مسجلة (الافتراضي `1800000`، والحد الأقصى `86400000`). اضبطه لكل حساب باستخدام `channels.discord.accounts.<id>.agentComponents.ttlMs`.
- يتم تجاهل `embeds` عند وجود مكونات v2.
- يتم كبت معاينات روابط URL العادية افتراضيًا. اضبط `suppressEmbeds: false` على إجراء رسالة عندما ينبغي توسيع رابط صادر واحد.

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

يحتوي Discord على سطحين صوتيين متميزين: **قنوات الصوت** الفورية (محادثات مستمرة) و**مرفقات الرسائل الصوتية** (تنسيق معاينة الموجة). يدعم Gateway كليهما.

### قنوات الصوت

قائمة إعداد:

1. فعّل Message Content Intent في Discord Developer Portal.
2. فعّل Server Members Intent عند استخدام قوائم السماح للأدوار/المستخدمين.
3. ادعُ البوت بنطاقي `bot` و`applications.commands`.
4. امنح أذونات Connect وSpeak وSend Messages وRead Message History في قناة الصوت المستهدفة.
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

مثال للانضمام التلقائي:

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
- يتحكم `voice.mode` في مسار المحادثة. الإعداد الافتراضي هو `agent-proxy`: تتولى واجهة صوتية أمامية في الوقت الفعلي توقيت الدور، والمقاطعة، والتشغيل، وتفوّض العمل الجوهري إلى وكيل OpenClaw الموجّه عبر `openclaw_agent_consult`، وتتعامل مع النتيجة كما لو كانت مطالبة Discord مكتوبة من ذلك المتحدث. يحافظ `stt-tts` على تدفق STT الدفعي الأقدم مع TTS. يتيح `bidi` للنموذج في الوقت الفعلي التحدث مباشرة مع إتاحة `openclaw_agent_consult` لعقل OpenClaw.
- يتحكم `voice.agentSession` في محادثة OpenClaw التي تستقبل أدوار الصوت. اتركه غير مضبوط لجلسة قناة الصوت نفسها، أو اضبط `{ mode: "target", target: "channel:<text-channel-id>" }` لجعل قناة الصوت تعمل كامتداد ميكروفون/مكبر صوت لجلسة قناة نصية موجودة في Discord مثل `#maintainers`.
- يتجاوز `voice.model` عقل وكيل OpenClaw لاستجابات Discord الصوتية والاستشارات في الوقت الفعلي. اتركه غير مضبوط ليرث نموذج الوكيل الموجّه. وهو منفصل عن `voice.realtime.model`.
- يتيح `voice.followUsers` للبوت الانضمام إلى صوت Discord والانتقال والمغادرة مع مستخدمين محددين. راجع [متابعة المستخدمين في الصوت](#follow-users-in-voice) لقواعد السلوك والأمثلة.
- يوجّه `agent-proxy` الكلام عبر `discord-voice`، ما يحافظ على تفويض المالك/الأدوات المعتاد للمتحدث والجلسة الهدف، لكنه يخفي أداة الوكيل `tts` لأن صوت Discord يملك التشغيل. افتراضيًا، يمنح `agent-proxy` الاستشارة وصولًا كاملًا إلى الأدوات بما يعادل المالك للمتحدثين المالكين (`voice.realtime.toolPolicy: "owner"`) ويفضل بشدة استشارة وكيل OpenClaw قبل الإجابات الجوهرية (`voice.realtime.consultPolicy: "always"`). في وضع `always` الافتراضي هذا، لا تنطق طبقة الوقت الفعلي حشوًا تلقائيًا قبل إجابة الاستشارة؛ بل تلتقط الكلام وتنسخه، ثم تنطق إجابة OpenClaw الموجّهة. إذا اكتملت عدة إجابات استشارة إجبارية بينما لا يزال Discord يشغّل الإجابة الأولى، تُصف إجابات الكلام المطابق اللاحقة في طابور حتى يصبح التشغيل خاملاً بدلًا من استبدال الكلام في منتصف الجملة.
- في وضع `stt-tts`، يستخدم STT `tools.media.audio`؛ ولا يؤثر `voice.model` في النسخ.
- في أوضاع الوقت الفعلي، تضبط `voice.realtime.provider` و`voice.realtime.model` و`voice.realtime.speakerVoice` جلسة الصوت في الوقت الفعلي. لاستخدام OpenAI Realtime 2 مع عقل Codex، استخدم `voice.realtime.model: "gpt-realtime-2"` و`voice.model: "openai/gpt-5.5"`.
- تتضمن أوضاع الصوت في الوقت الفعلي ملفات ملف تعريف صغيرة `IDENTITY.md` و`USER.md` و`SOUL.md` في تعليمات مزود الوقت الفعلي افتراضيًا، بحيث تحافظ الأدوار المباشرة السريعة على الهوية نفسها، وتأريض المستخدم، والشخصية مثل وكيل OpenClaw الموجّه. اضبط `voice.realtime.bootstrapContextFiles` على مجموعة فرعية لتخصيص ذلك، أو `[]` لتعطيله. تقتصر ملفات تمهيد الوقت الفعلي المدعومة على ملفات ملف التعريف تلك؛ ويبقى `AGENTS.md` في سياق الوكيل العادي. لا يستبدل سياق ملف التعريف المحقون `openclaw_agent_consult` لأعمال مساحة العمل، أو الحقائق الحالية، أو البحث في الذاكرة، أو الإجراءات المدعومة بالأدوات.
- في وضع الوقت الفعلي `agent-proxy` الخاص بـ OpenAI، اضبط `voice.realtime.requireWakeName: true` لإبقاء صوت Discord في الوقت الفعلي صامتًا حتى يبدأ النص المنسوخ أو ينتهي باسم تنبيه. يجب أن تكون أسماء التنبيه المضبوطة من كلمة واحدة أو كلمتين. إذا كان `voice.realtime.wakeNames` غير مضبوط، يستخدم OpenClaw `name` للوكيل الموجّه بالإضافة إلى `OpenClaw`، مع الرجوع إلى معرف الوكيل بالإضافة إلى `OpenClaw`. تعطّل بوابة اسم التنبيه الاستجابة التلقائية من مزود الوقت الفعلي، وتوجّه الأدوار المقبولة عبر مسار استشارة وكيل OpenClaw، وتقدم إقرارًا صوتيًا قصيرًا عند التعرف على اسم تنبيه في البداية من النسخ الجزئي قبل وصول النسخ النهائي.
- يقبل مزود OpenAI في الوقت الفعلي أسماء أحداث Realtime 2 الحالية والأسماء المستعارة القديمة المتوافقة مع Codex لأحداث صوت الإخراج والنصوص المنسوخة، بحيث يمكن أن تنحرف لقطات المزود المتوافقة دون إسقاط صوت المساعد.
- يتحكم `voice.realtime.bargeIn` فيما إذا كانت أحداث بدء المتحدث في Discord تقاطع تشغيل الوقت الفعلي النشط. إذا لم يُضبط، فإنه يتبع إعداد مقاطعة صوت الإدخال لدى مزود الوقت الفعلي.
- يتحكم `voice.realtime.minBargeInAudioEndMs` في الحد الأدنى لمدة تشغيل المساعد قبل أن تؤدي مقاطعة OpenAI في الوقت الفعلي إلى اقتطاع الصوت. الافتراضي: `250`. اضبطه على `0` للمقاطعة الفورية في الغرف منخفضة الصدى، أو ارفعه لإعدادات مكبرات الصوت كثيرة الصدى.
- لاستخدام صوت OpenAI عند تشغيل Discord، اضبط `voice.tts.provider: "openai"` واختر صوت تحويل النص إلى كلام ضمن `voice.tts.providers.openai.speakerVoice`. يعد `cedar` خيارًا جيدًا بصوت ذكوري على نموذج TTS الحالي من OpenAI.
- تنطبق تجاوزات `systemPrompt` الخاصة بكل قناة Discord على أدوار النصوص المنسوخة الصوتية لتلك القناة الصوتية.
- تستمد أدوار النصوص المنسوخة الصوتية حالة المالك من Discord `allowFrom` (أو `dm.allowFrom`) للأوامر المحكومة بالمالك وإجراءات القناة. تتبع رؤية أدوات الوكيل سياسة الأدوات المضبوطة للجلسة الموجّهة.
- صوت Discord اختياري للتكوينات النصية فقط؛ اضبط `channels.discord.voice.enabled=true` (أو احتفظ بكتلة `channels.discord.voice` موجودة) لتمكين أوامر `/vc`، ووقت تشغيل الصوت، وهدف Gateway `GuildVoiceStates`.
- يمكن لـ `channels.discord.intents.voiceStates` تجاوز الاشتراك في هدف حالة الصوت صراحة. اتركه غير مضبوط ليتبع الهدف التمكين الفعلي للصوت.
- إذا كان لدى `voice.autoJoin` عدة إدخالات للنقابة نفسها، ينضم OpenClaw إلى آخر قناة مضبوطة لتلك النقابة.
- `voice.allowedChannels` هي قائمة سماح اختيارية للإقامة. اتركها غير مضبوطة للسماح لـ `/vc join` بالدخول إلى أي قناة صوت Discord مصرح بها. عند ضبطها، تُقيّد `/vc join`، والانضمام التلقائي عند بدء التشغيل، وحركات حالة صوت البوت بالإدخالات المدرجة `{ guildId, channelId }`. اضبطها على مصفوفة فارغة لمنع جميع انضمامات صوت Discord. إذا نقل Discord البوت خارج قائمة السماح، يغادر OpenClaw تلك القناة ويعيد الانضمام إلى هدف الانضمام التلقائي المضبوط عند توفره.
- يمرر `voice.daveEncryption` و`voice.decryptionFailureTolerance` إلى خيارات الانضمام في `@discordjs/voice`.
- افتراضيات `@discordjs/voice` هي `daveEncryption=true` و`decryptionFailureTolerance=24` إذا لم تُضبط.
- يستخدم OpenClaw برنامج الترميز المضمّن `libopus-wasm` لاستقبال صوت Discord وتشغيل PCM الخام في الوقت الفعلي. يوزع بناء WebAssembly مثبتًا من libopus ولا يتطلب إضافات opus أصلية.
- يتحكم `voice.connectTimeoutMs` في انتظار Ready الأولي من `@discordjs/voice` لمحاولات `/vc join` والانضمام التلقائي. الافتراضي: `30000`.
- يتحكم `voice.reconnectGraceMs` في مدة انتظار OpenClaw لجلسة صوت منفصلة حتى تبدأ إعادة الاتصال قبل تدميرها. الافتراضي: `15000`.
- في وضع `stt-tts`، لا يتوقف تشغيل الصوت لمجرد أن مستخدمًا آخر بدأ الكلام. لتجنب حلقات التغذية الراجعة، يتجاهل OpenClaw التقاط الصوت الجديد أثناء تشغيل TTS؛ تحدث بعد انتهاء التشغيل للدور التالي. تمرر أوضاع الوقت الفعلي بدايات المتحدثين كإشارات مقاطعة إلى مزود الوقت الفعلي.
- في أوضاع الوقت الفعلي، قد يبدو الصدى من مكبرات الصوت إلى ميكروفون مفتوح كمقاطعة ويوقف التشغيل. لغرف Discord كثيرة الصدى، اضبط `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` لمنع OpenAI من المقاطعة التلقائية عند صوت الإدخال. أضف `voice.realtime.bargeIn: true` إذا كنت لا تزال تريد أن تقاطع أحداث بدء المتحدث في Discord التشغيل النشط. يتجاهل جسر OpenAI في الوقت الفعلي اقتطاعات التشغيل الأقصر من `voice.realtime.minBargeInAudioEndMs` باعتبارها غالبًا صدى/ضوضاء ويسجلها على أنها متخطاة بدلًا من مسح تشغيل Discord.
- يتحكم `voice.captureSilenceGraceMs` في مدة انتظار OpenClaw بعد أن يبلغ Discord عن توقف المتحدث قبل إنهاء ذلك المقطع الصوتي لـ STT. الافتراضي: `2000`؛ ارفع هذه القيمة إذا كان Discord يقسم الوقفات الطبيعية إلى نصوص جزئية متقطعة.
- عندما يكون ElevenLabs هو مزود TTS المحدد، يستخدم تشغيل صوت Discord TTS المتدفق ويبدأ من دفق استجابة المزود. تعود المزودات التي لا تدعم البث إلى مسار الملف المؤقت المركب.
- يراقب OpenClaw أيضًا حالات فشل فك تشفير الاستقبال ويتعافى تلقائيًا بمغادرة قناة الصوت وإعادة الانضمام إليها بعد حالات فشل متكررة في نافذة قصيرة.
- إذا أظهرت سجلات الاستقبال مرارًا `DecryptionFailed(UnencryptedWhenPassthroughDisabled)` بعد التحديث، فاجمع تقرير تبعيات وسجلات. يتضمن سطر `@discordjs/voice` المضمّن إصلاح الحشو upstream من PR #11449 في discord.js، والذي أغلق issue #11419 في discord.js.
- أحداث الاستقبال `The operation was aborted` متوقعة عندما ينهي OpenClaw مقطع متحدث ملتقطًا؛ وهي تشخيصات مطولة، وليست تحذيرات.
- تتضمن سجلات صوت Discord المطولة معاينة محدودة بسطر واحد لنص STT المنسوخ لكل مقطع متحدث مقبول، بحيث يظهر التصحيح جانب المستخدم وجانب رد الوكيل دون تفريغ نص منسوخ غير محدود.
- في وضع `agent-proxy`، يتخطى رجوع الاستشارة الإجبارية أجزاء النصوص المنسوخة التي يُحتمل أنها غير مكتملة، مثل النص المنتهي بـ `...` أو موصل لاحق مثل `and`، بالإضافة إلى الإغلاقات الواضحة غير القابلة للتنفيذ مثل “be right back” أو “bye”. تعرض السجلات `forced agent consult skipped reason=...` عندما يمنع ذلك إجابة قديمة في الطابور.

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

- يقبل `followUsers` معرفات مستخدمي Discord الخام وقيم `discord:<id>`. يطبّع OpenClaw كلا الشكلين قبل مطابقة أحداث حالة الصوت.
- القيمة الافتراضية لـ `followUsersEnabled` هي `true` عند ضبط `followUsers`. اضبطها على `false` للاحتفاظ بالقائمة المحفوظة مع إيقاف المتابعة الصوتية التلقائية.
- عندما ينضم مستخدم متابَع إلى قناة صوت مسموح بها، ينضم OpenClaw إلى تلك القناة. عندما ينتقل المستخدم، ينتقل OpenClaw معه. عندما ينقطع اتصال المستخدم المتابَع النشط، يغادر OpenClaw.
- إذا كان عدة مستخدمين متابَعين في النقابة نفسها وغادر المستخدم المتابَع النشط، ينتقل OpenClaw إلى قناة مستخدم متابَع آخر مُتعقَّب قبل مغادرة النقابة. إذا انتقل عدة مستخدمين متابَعين في الوقت نفسه، يفوز آخر حدث حالة صوت مرصود.
- لا يزال `allowedChannels` ينطبق. يتم تجاهل المستخدم المتابَع في قناة غير مسموح بها، وتنتقل الجلسة المملوكة للمتابعة إلى مستخدم متابَع آخر أو تغادر.
- يوفق OpenClaw أحداث حالة الصوت الفائتة عند بدء التشغيل وعلى فاصل زمني محدود. تأخذ المطابقة عينات من النقابات المضبوطة وتضع حدًا لعمليات بحث REST في كل تشغيل، لذلك قد تحتاج قوائم `followUsers` الكبيرة جدًا إلى أكثر من فاصل زمني واحد حتى تتقارب.
- إذا نقل Discord أو مشرف البوت أثناء متابعته مستخدمًا، يعيد OpenClaw بناء جلسة الصوت ويحافظ على ملكية المتابعة عندما تكون الوجهة مسموحًا بها. إذا نُقل البوت خارج `allowedChannels`، يغادر OpenClaw ويعيد الانضمام إلى الهدف المضبوط عند وجوده.
- قد تغادر عملية تعافي استقبال DAVE القناة نفسها وتعيد الانضمام إليها بعد حالات فشل فك تشفير متكررة. تحافظ الجلسات المملوكة للمتابعة على ملكية المتابعة عبر مسار التعافي هذا، لذلك لا يزال انقطاع اتصال مستخدم متابَع لاحقًا يؤدي إلى مغادرة القناة.

اختر بين أوضاع الانضمام:

- استخدم `followUsers` للإعدادات الشخصية أو إعدادات المشغّل حيث يجب أن يكون البوت تلقائيًا في الصوت عندما تكون أنت موجودًا.
- استخدم `autoJoin` للبوتات ذات الغرف الثابتة التي يجب أن تكون موجودة حتى عندما لا يكون أي مستخدم مُتعقَّب في الصوت.
- استخدم `/vc join` للانضمامات لمرة واحدة أو للغرف التي سيكون فيها الحضور الصوتي التلقائي مفاجئًا.

برنامج ترميز صوت Discord:

- تُظهر سجلات استقبال الصوت `discord voice: opus decoder: libopus-wasm`.
- يرمّز التشغيل الفوري PCM خامًا ستيريو بتردد 48 kHz إلى Opus باستخدام حزمة `libopus-wasm` المضمّنة نفسها قبل تسليم الحزم إلى `@discordjs/voice`.
- يحوّل تشغيل الملفات وتدفقات المزوّد إلى PCM خام ستيريو بتردد 48 kHz باستخدام ffmpeg، ثم يستخدم `libopus-wasm` لتدفق حزم Opus المرسلة إلى Discord.

مسار STT مع TTS:

- يُحوَّل التقاط PCM من Discord إلى ملف WAV مؤقت.
- يتولى `tools.media.audio` معالجة STT، مثل `openai/gpt-4o-mini-transcribe`.
- تُرسل النسخة النصية عبر دخول Discord والتوجيه بينما يعمل LLM الخاص بالاستجابة بسياسة إخراج صوتي تخفي أداة الوكيل `tts` وتطلب نصًا مُعادًا، لأن صوت Discord يملك تشغيل TTS النهائي.
- عند ضبط `voice.model`، فإنه يتجاوز فقط LLM الخاص بالاستجابة لهذا الدور في قناة الصوت.
- يُدمَج `voice.tts` فوق `messages.tts`؛ المزوّدون القادرون على البث يغذّون المشغّل مباشرة، وإلا فسيُشغَّل ملف الصوت الناتج في القناة المنضم إليها.

مثال جلسة قناة صوتية افتراضية لوكيل وسيط:

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

بدون كتلة `voice.agentSession`، تحصل كل قناة صوتية على جلسة OpenClaw موجّهة خاصة بها. على سبيل المثال، يتحدث `/vc join channel:234567890123456789` إلى الجلسة الخاصة بقناة صوت Discord تلك. نموذج الوقت الفعلي هو واجهة الصوت فقط؛ تُسلَّم الطلبات الجوهرية إلى وكيل OpenClaw المُكوَّن. إذا أنتج نموذج الوقت الفعلي نسخة نصية نهائية بدون استدعاء أداة الاستشارة، يفرض OpenClaw الاستشارة كخطة رجوع بحيث يظل السلوك الافتراضي مماثلًا للتحدث إلى الوكيل.

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

مثال ثنائي الاتجاه بالوقت الفعلي:

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

الصوت بوصفه امتدادًا لجلسة قناة Discord موجودة:

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

في وضع `agent-proxy` ينضم الروبوت إلى قناة الصوت المُكوَّنة، لكن أدوار وكيل OpenClaw تستخدم الجلسة والوكيل الموجّهين العاديين للقناة الهدف. تنطق جلسة الصوت بالوقت الفعلي النتيجة المُعادة داخل قناة الصوت. لا يزال بإمكان الوكيل المشرف استخدام أدوات الرسائل العادية وفقًا لسياسة أدواته، بما في ذلك إرسال رسالة Discord منفصلة إذا كان ذلك هو الإجراء الصحيح.

أثناء نشاط تشغيل OpenClaw مفوَّض، تُعامل نسخ Discord الصوتية النصية الجديدة كتحكم مباشر في التشغيل قبل بدء دور وكيل آخر. تُصنَّف عبارات مثل "status"، أو "cancel that"، أو "use the smaller fix"، أو "when you're done also check tests" كإدخال حالة أو إلغاء أو توجيه أو متابعة للجلسة النشطة. تُنطق نتائج الحالة والإلغاء والتوجيه المقبول والمتابعة مرة أخرى داخل قناة الصوت حتى يعرف المتصل ما إذا كان OpenClaw قد عالج الطلب.

صيغ الأهداف المفيدة:

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

استخدم هذا عندما يسمع النموذج تشغيل Discord الخاص به عبر ميكروفون مفتوح، لكنك لا تزال تريد مقاطعته بالكلام. يمنع OpenClaw OpenAI من المقاطعة التلقائية عند الصوت الخام الداخل، بينما يسمح `bargeIn: true` لأحداث بدء المتحدث في Discord وصوت المتحدث النشط أصلًا بإلغاء استجابات الوقت الفعلي النشطة قبل أن يصل الدور الملتقط التالي إلى OpenAI. تُعامل إشارات المقاطعة المبكرة جدًا التي يكون فيها `audioEndMs` أقل من `minBargeInAudioEndMs` كصدى أو ضوضاء محتملين وتُتجاهل حتى لا يتوقف النموذج عند أول إطار تشغيل.

سجلات الصوت المتوقعة:

- عند الانضمام: `discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- عند بدء الوقت الفعلي: `discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- عند صوت المتحدث: `discord voice: realtime speaker turn opened ...` و`discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` و`discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- عند تخطي كلام قديم: `discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` أو `reason=non-actionable-closing ...`
- عند اكتمال استجابة الوقت الفعلي: `discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- عند إيقاف التشغيل أو إعادة ضبطه: `discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- عند استشارة الوقت الفعلي: `discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- عند إجابة الوكيل: `discord voice: agent turn answer ...`
- عند إدراج كلام مطابق في الطابور: `discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`، متبوعًا بـ `discord voice: realtime exact speech dequeued reason=player-idle ...`
- عند اكتشاف المقاطعة: `discord voice: realtime barge-in detected source=speaker-start ...` أو `discord voice: realtime barge-in detected source=active-speaker-audio ...`، متبوعًا بـ `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- عند مقاطعة الوقت الفعلي: `discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`، متبوعًا إما بـ `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` أو `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- عند تجاهل الصدى أو الضوضاء: `discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- عند تعطيل المقاطعة: `discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- عند التشغيل الخامل: `discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

لتصحيح الصوت المقطوع، اقرأ سجلات الصوت بالوقت الفعلي كخط زمني:

1. يعني `realtime audio playback started` أن Discord بدأ تشغيل صوت المساعد. يبدأ الجسر من هذه النقطة عدّ أجزاء إخراج المساعد، وبايتات PCM في Discord، وبايتات الوقت الفعلي للمزوّد، ومدة الصوت المُولَّد.
2. يحدد `realtime speaker turn opened` أن متحدثًا في Discord أصبح نشطًا. إذا كان التشغيل نشطًا بالفعل وكان `bargeIn` مفعّلًا، فقد يتبعه `barge-in detected source=speaker-start`.
3. يحدد `realtime input audio started` أول إطار صوت فعلي مستلم لذلك الدور من المتحدث. وجود `outputActive=true` أو قيمة غير صفرية في `outputAudioMs` هنا يعني أن الميكروفون يرسل إدخالًا بينما لا يزال تشغيل المساعد نشطًا.
4. يعني `barge-in detected source=active-speaker-audio` أن OpenClaw رأى صوت متحدث حيًا بينما كان تشغيل المساعد نشطًا. هذا مفيد للتمييز بين مقاطعة حقيقية وحدث بدء متحدث في Discord بلا صوت مفيد.
5. يعني `barge-in requested reason=...` أن OpenClaw طلب من مزوّد الوقت الفعلي إلغاء الاستجابة النشطة أو اقتطاعها. يتضمن `outputAudioMs` و`outputActive` و`playbackChunks` حتى تتمكن من رؤية مقدار صوت المساعد الذي شُغِّل فعليًا قبل المقاطعة.
6. يُعد `realtime audio playback stopped reason=...` نقطة إعادة ضبط تشغيل Discord المحلية. يوضح السبب من أوقف التشغيل: `barge-in`، أو `player-idle`، أو `provider-clear-audio`، أو `forced-agent-consult`، أو `stream-close`، أو `session-close`.
7. يلخص `realtime speaker turn closed` دور الإدخال الملتقط. تعني `chunks=0` أو `hasAudio=false` أن دور المتحدث فُتح لكن لم يصل صوت قابل للاستخدام إلى جسر الوقت الفعلي. تعني `interruptedPlayback=true` أن دور الإدخال ذاك تداخل مع إخراج المساعد وشغّل منطق المقاطعة.

حقول مفيدة:

- `outputAudioMs`: مدة صوت المساعد التي أنشأها مزوّد الوقت الفعلي قبل سطر السجل.
- `audioMs`: مدة صوت المساعد التي عدّها OpenClaw قبل توقف التشغيل.
- `elapsedMs`: وقت الساعة الفعلي بين فتح وإغلاق تدفق التشغيل أو دور المتحدث.
- `discordBytes`: بايتات PCM ستيريو بتردد 48 kHz المرسلة إلى صوت Discord أو المستلمة منه.
- `realtimeBytes`: بايتات PCM بتنسيق المزوّد المرسلة إلى مزوّد الوقت الفعلي أو المستلمة منه.
- `playbackChunks`: أجزاء صوت المساعد المُمرَّرة إلى Discord للاستجابة النشطة.
- `sinceLastAudioMs`: الفجوة بين آخر إطار صوت متحدث ملتقط وإغلاق دور المتحدث.

أنماط شائعة:

- يشير الانقطاع الفوري مع `source=active-speaker-audio` وقيمة `outputAudioMs` صغيرة ووجود المستخدم نفسه قريبًا عادةً إلى دخول صدى السماعة إلى الميكروفون. ارفع `voice.realtime.minBargeInAudioEndMs`، أو اخفض مستوى صوت السماعة، أو استخدم سماعات رأس، أو اضبط `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`.
- يعني `source=speaker-start` متبوعًا بـ `speaker turn closed ... hasAudio=false` أن Discord أبلغ عن بدء متحدث لكن لم يصل أي صوت إلى OpenClaw. قد يكون ذلك حدث صوت Discord عابرًا، أو سلوك بوابة ضوضاء، أو عميلًا فعّل الميكروفون للحظة وجيزة.
- يعني `audio playback stopped reason=stream-close` بدون مقاطعة قريبة أو `provider-clear-audio` أن تدفق تشغيل Discord المحلي انتهى على نحو غير متوقع. تحقق من سجلات المزوّد ومشغل Discord السابقة.
- يعني `capture ignored during playback (barge-in disabled)` أن OpenClaw أسقط الإدخال عمدًا بينما كان صوت المساعد نشطًا. فعّل `voice.realtime.bargeIn` إذا كنت تريد أن تقاطع الكلام التشغيل.
- يعني `barge-in ignored ... outputActive=false` أن Discord أو VAD الخاص بالمزوّد أبلغ عن كلام، لكن لم يكن لدى OpenClaw تشغيل نشط لمقاطعته. لا ينبغي أن يقطع هذا الصوت.

تُحل بيانات الاعتماد لكل مكوّن: مصادقة مسار LLM لـ `voice.model`، ومصادقة STT لـ `tools.media.audio`، ومصادقة TTS لـ `messages.tts`/`voice.tts`، ومصادقة مزوّد الوقت الفعلي لـ `voice.realtime.providers` أو تكوين المصادقة العادي للمزوّد.

### الرسائل الصوتية

تعرض رسائل Discord الصوتية معاينة لشكل الموجة وتتطلب صوت OGG/Opus. ينشئ OpenClaw شكل الموجة تلقائيًا، لكنه يحتاج إلى `ffmpeg` و`ffprobe` على مضيف Gateway للفحص والتحويل.

- وفّر **مسار ملف محلي** (تُرفض عناوين URL).
- احذف محتوى النص (يرفض Discord النص + الرسالة الصوتية في الحمولة نفسها).
- يُقبل أي تنسيق صوتي؛ يحوّل OpenClaw إلى OGG/Opus حسب الحاجة.

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="استخدام نوايا غير مسموحة أو عدم رؤية البوت لرسائل الخادم">

    - فعّل نية محتوى الرسائل
    - فعّل نية أعضاء الخادم عندما تعتمد على حلّ المستخدم/العضو
    - أعد تشغيل Gateway بعد تغيير النوايا

  </Accordion>

  <Accordion title="حظر رسائل الخادم بشكل غير متوقع">

    - تحقّق من `groupPolicy`
    - تحقّق من قائمة السماح للخوادم ضمن `channels.discord.guilds`
    - إذا كانت خريطة `channels` الخاصة بالخادم موجودة، فلن يُسمح إلا بالقنوات المدرجة
    - تحقّق من سلوك `requireMention` وأنماط الإشارة

    فحوصات مفيدة:

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="الإشارة المطلوبة مضبوطة على false ولكن الحظر مستمر">
    الأسباب الشائعة:

    - `groupPolicy="allowlist"` دون قائمة سماح مطابقة للخادم/القناة
    - ضبط `requireMention` في المكان الخاطئ (يجب أن يكون ضمن `channels.discord.guilds` أو إدخال القناة)
    - حظر المرسل بواسطة قائمة سماح `users` الخاصة بالخادم/القناة

  </Accordion>

  <Accordion title="دورات Discord طويلة التشغيل أو ردود مكررة">

    سجلات نموذجية:

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    مفاتيح ضبط طابور Discord Gateway:

    - حساب واحد: `channels.discord.eventQueue.listenerTimeout`
    - حسابات متعددة: `channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - يتحكم هذا فقط في عمل مستمع Discord Gateway، وليس مدة دورة الوكيل

    لا يطبّق Discord مهلة مملوكة للقناة على دورات الوكيل الموضوعة في الطابور. تسلّم مستمعات الرسائل العمل فورًا، وتحافظ تشغيلات Discord الموضوعة في الطابور على الترتيب لكل جلسة حتى تكتمل دورة حياة الجلسة/الأداة/وقت التشغيل أو تُجهض العمل.

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
    يجلب OpenClaw بيانات Discord `/gateway/bot` الوصفية قبل الاتصال. تعود حالات الفشل العابرة إلى عنوان Gateway الافتراضي في Discord وتُقيَّد معدلاتها في السجلات.

    مفاتيح ضبط مهلة البيانات الوصفية:

    - حساب واحد: `channels.discord.gatewayInfoTimeoutMs`
    - حسابات متعددة: `channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - بديل env عند عدم ضبط التكوين: `OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - الافتراضي: `30000` (30 ثانية)، الحد الأقصى: `120000`

  </Accordion>

  <Accordion title="إعادات التشغيل بسبب انتهاء مهلة READY في Gateway">
    ينتظر OpenClaw حدث `READY` من Gateway الخاصة بـ Discord أثناء بدء التشغيل وبعد إعادة الاتصال في وقت التشغيل. قد تحتاج إعدادات الحسابات المتعددة مع تباعد بدء التشغيل إلى نافذة READY أطول عند بدء التشغيل من الافتراضية.

    مفاتيح ضبط مهلة READY:

    - بدء التشغيل لحساب واحد: `channels.discord.gatewayReadyTimeoutMs`
    - بدء التشغيل لحسابات متعددة: `channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - بديل env لبدء التشغيل عند عدم ضبط التكوين: `OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - افتراضي بدء التشغيل: `15000` (15 ثانية)، الحد الأقصى: `120000`
    - وقت التشغيل لحساب واحد: `channels.discord.gatewayRuntimeReadyTimeoutMs`
    - وقت التشغيل لحسابات متعددة: `channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - بديل env لوقت التشغيل عند عدم ضبط التكوين: `OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - افتراضي وقت التشغيل: `30000` (30 ثانية)، الحد الأقصى: `120000`

  </Accordion>

  <Accordion title="عدم تطابق تدقيق الأذونات">
    تعمل فحوصات أذونات `channels status --probe` فقط مع معرّفات القنوات الرقمية.

    إذا استخدمت مفاتيح slug، فقد تظل المطابقة في وقت التشغيل تعمل، لكن probe لا يمكنه التحقق الكامل من الأذونات.

  </Accordion>

  <Accordion title="مشكلات الرسائل الخاصة والاقتران">

    - الرسائل الخاصة معطلة: `channels.discord.dm.enabled=false`
    - سياسة الرسائل الخاصة معطلة: `channels.discord.dmPolicy="disabled"` (قديم: `channels.discord.dm.policy`)
    - انتظار موافقة الاقتران في وضع `pairing`

  </Accordion>

  <Accordion title="حلقات البوت إلى البوت">
    افتراضيًا، تُتجاهل الرسائل التي يؤلفها البوت.

    إذا ضبطت `channels.discord.allowBots=true`، فاستخدم قواعد إشارة وقوائم سماح صارمة لتجنب سلوك الحلقات.
    فضّل `channels.discord.allowBots="mentions"` لقبول رسائل البوت فقط عندما تشير إلى البوت.

    يوفّر OpenClaw أيضًا [حماية مشتركة من حلقات البوتات](/ar/channels/bot-loop-protection). عندما يسمح `allowBots` بوصول رسائل مؤلفة بواسطة بوت إلى الإرسال، يربط Discord الحدث الوارد بحقائق `(account, channel, bot pair)` ويقمع حارس الأزواج العام الزوج بعد تجاوزه ميزانية الأحداث المضبوطة. يمنع الحارس حلقات بوتين خارجة عن السيطرة كان يجب إيقافها سابقًا بواسطة حدود معدل Discord؛ ولا يؤثر في عمليات النشر ذات البوت الواحد أو ردود البوت لمرة واحدة التي تبقى دون الميزانية.

    الإعدادات الافتراضية (نشطة عند ضبط `allowBots`):

    - `maxEventsPerWindow: 20` -- يمكن لزوج البوتات تبادل 20 رسالة داخل النافذة المنزلقة
    - `windowSeconds: 60` -- طول النافذة المنزلقة
    - `cooldownSeconds: 60` -- بمجرد تجاوز الميزانية، تُسقط كل رسالة بوت إلى بوت إضافية في أي اتجاه لمدة دقيقة واحدة

    اضبط الافتراضي المشترك مرة واحدة ضمن `channels.defaults.botLoopProtection`، ثم تجاوز Discord عندما يحتاج سير عمل مشروع إلى هامش أكبر. ترتيب الأولوية هو:

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - الافتراضيات المضمنة

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

    - حافظ على تحديث OpenClaw (`openclaw update`) لضمان وجود منطق استرداد استقبال صوت Discord
    - تأكد من `channels.discord.voice.daveEncryption=true` (الافتراضي)
    - ابدأ من `channels.discord.voice.decryptionFailureTolerance=24` (افتراضي المنبع) واضبطه فقط عند الحاجة
    - راقب السجلات من أجل:
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - إذا استمرت حالات الفشل بعد إعادة الانضمام التلقائية، فاجمع السجلات وقارنها بتاريخ استقبال DAVE في المنبع ضمن [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) و[discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

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
- البث: `streaming` (اسم مستعار قديم: `streamMode`)، `streaming.preview.toolProgress`, `draftChunk`, `blockStreaming`, `blockStreamingCoalesce`
- الوسائط/إعادة المحاولة: `mediaMaxMb` (يقيّد تحميلات Discord الصادرة، الافتراضي `100MB`)، `retry`
- الإجراءات: `actions.*`
- الحضور: `activity`, `status`, `activityType`, `activityUrl`
- واجهة المستخدم: `ui.components.accentColor`
- الميزات: `threadBindings`, `bindings[]` في المستوى الأعلى (`type: "acp"`)، `pluralkit`, `execApprovals`, `intents`, `agentComponents.enabled`, `agentComponents.ttlMs`, `heartbeat`, `responsePrefix`

</Accordion>

## السلامة والعمليات

- تعامل مع رموز البوتات كأسرار (يُفضّل `DISCORD_BOT_TOKEN` في البيئات المُدارة).
- امنح أذونات Discord وفق مبدأ أقل امتياز.
- إذا كانت حالة نشر/أوامر الأوامر قديمة، فأعد تشغيل Gateway وأعد الفحص باستخدام `openclaw channels status --probe`.

## ذو صلة

<CardGroup cols={2}>
  <Card title="الاقتران" icon="link" href="/ar/channels/pairing">
    اربط مستخدم Discord بـ Gateway.
  </Card>
  <Card title="المجموعات" icon="users" href="/ar/channels/groups">
    سلوك دردشة المجموعات وقائمة السماح.
  </Card>
  <Card title="توجيه القنوات" icon="route" href="/ar/channels/channel-routing">
    وجّه الرسائل الواردة إلى الوكلاء.
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

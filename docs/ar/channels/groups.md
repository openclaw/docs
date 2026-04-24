---
read_when:
    - تغيير سلوك الدردشة الجماعية أو بوابة الإشارة بالاسم
summary: سلوك الدردشة الجماعية عبر الأسطح المختلفة (Discord وiMessage وMatrix وMicrosoft Teams وSignal وSlack وTelegram وWhatsApp وZalo)
title: المجموعات
x-i18n:
    generated_at: "2026-04-24T07:30:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: c014d6e08649c8dfd221640435b1d5cf93758bf10b4b6c1a536532e07f622d7b
    source_path: channels/groups.md
    workflow: 15
---

يعامل OpenClaw الدردشات الجماعية بشكل متسق عبر الأسطح المختلفة: Discord وiMessage وMatrix وMicrosoft Teams وSignal وSlack وTelegram وWhatsApp وZalo.

## مقدمة للمبتدئين (دقيقتان)

يعيش OpenClaw على حسابات المراسلة الخاصة بك. لا يوجد مستخدم bot منفصل على WhatsApp.
إذا كنت **أنت** في مجموعة، يمكن لـ OpenClaw رؤية تلك المجموعة والرد فيها.

السلوك الافتراضي:

- المجموعات مقيّدة (`groupPolicy: "allowlist"`).
- تتطلب الردود إشارة بالاسم ما لم تقم صراحةً بتعطيل بوابة الإشارة.

الترجمة العملية: يمكن للمرسلين المدرجين في قائمة السماح تشغيل OpenClaw عبر الإشارة إليه.

> باختصار
>
> - يتم التحكم في **الوصول عبر الرسائل المباشرة** بواسطة `*.allowFrom`.
> - يتم التحكم في **الوصول إلى المجموعات** بواسطة `*.groupPolicy` + قوائم السماح (`*.groups` و`*.groupAllowFrom`).
> - يتم التحكم في **تشغيل الردود** بواسطة بوابة الإشارة (`requireMention` و`/activation`).

التدفق السريع (ما الذي يحدث لرسالة مجموعة):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## رؤية السياق وقوائم السماح

هناك عنصران مختلفان يدخلان في أمان المجموعات:

- **تفويض التشغيل**: من يمكنه تشغيل الوكيل (`groupPolicy` و`groups` و`groupAllowFrom` وقوائم السماح الخاصة بكل قناة).
- **رؤية السياق**: ما السياق الإضافي الذي يُحقن في النموذج (نص الرد، والاقتباسات، وسجل سلسلة المحادثات، وبيانات إعادة التوجيه).

بشكل افتراضي، يعطي OpenClaw الأولوية لسلوك الدردشة الطبيعي ويحافظ على السياق في الغالب كما تم استلامه. وهذا يعني أن قوائم السماح تحدد أساسًا من يمكنه تشغيل الإجراءات، وليست حدًا شاملًا للإخفاء لكل مقتطف مقتبس أو تاريخي.

السلوك الحالي خاص بكل قناة:

- تطبق بعض القنوات بالفعل تصفية قائمة على المرسل على السياق الإضافي في مسارات محددة (على سبيل المثال، تهيئة سلاسل Slack وعمليات بحث الردود/السلاسل في Matrix).
- لا تزال قنوات أخرى تمرر سياق الاقتباس/الرد/إعادة التوجيه كما تم استلامه.

اتجاه التعزيز الأمني (مخطط له):

- يحافظ `contextVisibility: "all"` (الافتراضي) على السلوك الحالي كما تم استلامه.
- يقوم `contextVisibility: "allowlist"` بتصفية السياق الإضافي إلى المرسلين المدرجين في قائمة السماح.
- `contextVisibility: "allowlist_quote"` هو `allowlist` مع استثناء صريح واحد للاقتباس/الرد.

إلى أن يتم تنفيذ نموذج التعزيز هذا بشكل متسق عبر القنوات، توقّع وجود اختلافات حسب السطح.

![تدفق رسالة المجموعة](/images/groups-flow.svg)

إذا كنت تريد...

| الهدف | ما الذي يجب ضبطه |
| ---- | ---------------- |
| السماح بكل المجموعات لكن الرد فقط عند @mentions | `groups: { "*": { requireMention: true } }` |
| تعطيل كل الردود في المجموعات | `groupPolicy: "disabled"` |
| مجموعات محددة فقط | `groups: { "<group-id>": { ... } }` (بدون المفتاح `"*"`) |
| أنت فقط من يمكنه التشغيل داخل المجموعات | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## مفاتيح الجلسات

- تستخدم جلسات المجموعات مفاتيح جلسات بالشكل `agent:<agentId>:<channel>:group:<id>` (وتستخدم الغرف/القنوات `agent:<agentId>:<channel>:channel:<id>`).
- تضيف موضوعات منتدى Telegram ‎`:topic:<threadId>` إلى معرّف المجموعة بحيث يكون لكل موضوع جلسته الخاصة.
- تستخدم الدردشات المباشرة الجلسة الرئيسية (أو جلسة لكل مرسل إذا تم ضبط ذلك).
- يتم تخطي Heartbeat لجلسات المجموعات.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## النمط: الرسائل المباشرة الشخصية + المجموعات العامة (وكيل واحد)

نعم — يعمل هذا جيدًا إذا كانت حركة المرور "الشخصية" لديك هي **الرسائل المباشرة** وكانت حركة المرور "العامة" لديك هي **المجموعات**.

السبب: في وضع الوكيل الواحد، تصل الرسائل المباشرة عادةً إلى مفتاح الجلسة **الرئيسية** (`agent:main:main`)، بينما تستخدم المجموعات دائمًا مفاتيح جلسات **غير رئيسية** (`agent:main:<channel>:group:<id>`). إذا فعّلت العزل باستخدام `mode: "non-main"`، فستعمل جلسات المجموعات تلك في backend العزل المضبوط بينما تبقى جلسة الرسائل المباشرة الرئيسية لديك على المضيف. ويكون Docker هو backend الافتراضي إذا لم تختر واحدًا.

يمنحك هذا "عقل" وكيل واحدًا (مساحة عمل + ذاكرة مشتركتان)، ولكن مع وضعي تنفيذ:

- **الرسائل المباشرة**: أدوات كاملة (المضيف)
- **المجموعات**: sandbox + أدوات مراسلة مقيّدة

> إذا كنت تحتاج إلى مساحات عمل/شخصيات منفصلة تمامًا ("شخصي" و"عام" يجب ألا يختلطا أبدًا)، فاستخدم وكيلًا ثانيًا + bindings. راجع [توجيه متعدد الوكلاء](/ar/concepts/multi-agent).

مثال (الرسائل المباشرة على المضيف، والمجموعات داخل sandbox + أدوات مراسلة فقط):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // groups/channels are non-main -> sandboxed
        scope: "session", // strongest isolation (one container per group/channel)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // If allow is non-empty, everything else is blocked (deny still wins).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

هل تريد "يمكن للمجموعات رؤية المجلد X فقط" بدلًا من "لا يوجد وصول إلى المضيف"؟ أبقِ `workspaceAccess: "none"` وقم بربط المسارات المدرجة في قائمة السماح فقط داخل sandbox:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
        docker: {
          binds: [
            // hostPath:containerPath:mode
            "/home/user/FriendsShared:/data:ro",
          ],
        },
      },
    },
  },
}
```

ذو صلة:

- مفاتيح الإعدادات والقيم الافتراضية: [إعدادات Gateway](/ar/gateway/config-agents#agentsdefaultssandbox)
- تصحيح سبب حظر أداة: [Sandbox مقابل سياسة الأدوات مقابل Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated)
- تفاصيل bind mounts: [العزل](/ar/gateway/sandboxing#custom-bind-mounts)

## تسميات العرض

- تستخدم تسميات واجهة المستخدم `displayName` عند توفره، وتُنسق بالشكل `<channel>:<token>`.
- `#room` محجوز للغرف/القنوات؛ وتستخدم الدردشات الجماعية `g-<slug>` (أحرف صغيرة، المسافات -> `-`، مع الاحتفاظ بـ `#@+._-`).

## سياسة المجموعات

تحكم في كيفية التعامل مع رسائل المجموعات/الغرف لكل قناة:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeric Telegram user id (wizard can resolve @username)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| السياسة | السلوك |
| ------- | ------ |
| `"open"` | تتجاوز المجموعات قوائم السماح؛ ولا تزال بوابة الإشارة تُطبّق. |
| `"disabled"` | حظر جميع رسائل المجموعات بالكامل. |
| `"allowlist"` | السماح فقط بالمجموعات/الغرف التي تطابق قائمة السماح المضبوطة. |

ملاحظات:

- `groupPolicy` منفصلة عن بوابة الإشارة (التي تتطلب @mentions).
- WhatsApp وTelegram وSignal وiMessage وMicrosoft Teams وZalo: استخدم `groupAllowFrom` (والرجوع الاحتياطي إلى `allowFrom` الصريحة).
- تنطبق موافقات اقتران الرسائل المباشرة (إدخالات التخزين `*-allowFrom`) على وصول الرسائل المباشرة فقط؛ ويظل تفويض مرسل المجموعات صريحًا عبر قوائم سماح المجموعات.
- Discord: تستخدم قائمة السماح `channels.discord.guilds.<id>.channels`.
- Slack: تستخدم قائمة السماح `channels.slack.channels`.
- Matrix: تستخدم قائمة السماح `channels.matrix.groups`. فضّل معرّفات الغرف أو الأسماء المستعارة؛ فالبحث عن أسماء الغرف المنضم إليها هو أفضل جهد، ويتم تجاهل الأسماء غير المحلولة وقت التشغيل. استخدم `channels.matrix.groupAllowFrom` لتقييد المرسلين؛ كما أن قوائم السماح `users` لكل غرفة مدعومة أيضًا.
- يتم التحكم في Group DMs بشكل منفصل (`channels.discord.dm.*` و`channels.slack.dm.*`).
- يمكن لقائمة سماح Telegram مطابقة معرّفات المستخدمين (`"123456789"` أو `"telegram:123456789"` أو `"tg:123456789"`) أو أسماء المستخدمين (`"@alice"` أو `"alice"`); prefixes غير حساسة لحالة الأحرف.
- القيمة الافتراضية هي `groupPolicy: "allowlist"`؛ وإذا كانت قائمة سماح المجموعة فارغة، فسيتم حظر رسائل المجموعات.
- أمان وقت التشغيل: عند غياب كتلة provider بالكامل (`channels.<provider>` غير موجودة)، تعود سياسة المجموعات إلى وضع مغلق افتراضيًا عند الفشل (عادةً `allowlist`) بدلًا من وراثة `channels.defaults.groupPolicy`.

نموذج ذهني سريع (ترتيب التقييم لرسائل المجموعات):

1. `groupPolicy` ‏(open/disabled/allowlist)
2. قوائم سماح المجموعات (`*.groups` و`*.groupAllowFrom` وقائمة السماح الخاصة بالقناة)
3. بوابة الإشارة (`requireMention` و`/activation`)

## بوابة الإشارة (الافتراضي)

تتطلب رسائل المجموعات إشارة ما لم يتم تجاوز ذلك لكل مجموعة. توجد القيم الافتراضية لكل نظام فرعي تحت `*.groups."*"`.

يُعد الرد على رسالة bot بمثابة إشارة ضمنية عندما تدعم القناة
بيانات تعريف الرد. كما يمكن أن يُعد اقتباس رسالة bot إشارة ضمنية
على القنوات التي تكشف بيانات تعريف الاقتباس. تشمل الحالات المضمنة الحالية
Telegram وWhatsApp وSlack وDiscord وMicrosoft Teams وZaloUser.

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

ملاحظات:

- `mentionPatterns` هي أنماط regex آمنة وغير حساسة لحالة الأحرف؛ ويتم تجاهل الأنماط غير الصالحة وأشكال التكرار المتداخل غير الآمنة.
- الأسطح التي توفر إشارات صريحة تظل تعمل؛ والأنماط هي حل احتياطي.
- تجاوز لكل وكيل: `agents.list[].groupChat.mentionPatterns` (مفيد عندما تشترك عدة وكلاء في مجموعة).
- لا يتم فرض بوابة الإشارة إلا عندما يكون اكتشاف الإشارة ممكنًا (إشارات أصلية أو تم ضبط `mentionPatterns`).
- توجد إعدادات Discord الافتراضية في `channels.discord.guilds."*"` (وقابلة للتجاوز لكل خادم/قناة).
- يتم تغليف سياق سجل المجموعات بشكل موحد عبر القنوات وهو **معلّق فقط** (الرسائل التي تم تخطيها بسبب بوابة الإشارة)؛ استخدم `messages.groupChat.historyLimit` للقيمة الافتراضية العامة و`channels.<channel>.historyLimit` (أو `channels.<channel>.accounts.*.historyLimit`) للتجاوزات. اضبط `0` للتعطيل.

## قيود أدوات المجموعة/القناة (اختياري)

تدعم بعض إعدادات القنوات تقييد الأدوات المتاحة **داخل مجموعة/غرفة/قناة محددة**.

- `tools`: السماح/المنع للأدوات للمجموعة كلها.
- `toolsBySender`: تجاوزات لكل مرسل داخل المجموعة.
  استخدم prefixes صريحة للمفاتيح:
  `id:<senderId>` و`e164:<phone>` و`username:<handle>` و`name:<displayName>` وبطاقة `"*"` العامة.
  لا تزال المفاتيح القديمة غير المسبوقة بـ prefix مقبولة وتُطابق كـ `id:` فقط.

ترتيب الحلّ (الأكثر تحديدًا يفوز):

1. تطابق `toolsBySender` للمجموعة/القناة
2. `tools` للمجموعة/القناة
3. تطابق `toolsBySender` الافتراضي (`"*"` )
4. `tools` الافتراضي (`"*"`)

مثال (Telegram):

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

ملاحظات:

- تُطبَّق قيود أدوات المجموعة/القناة بالإضافة إلى سياسة الأدوات العامة/الخاصة بالوكيل (ويظل المنع هو الحاسم).
- تستخدم بعض القنوات تداخلًا مختلفًا للغرف/القنوات (مثل Discord ‏`guilds.*.channels.*`، وSlack ‏`channels.*`، وMicrosoft Teams ‏`teams.*.channels.*`).

## قوائم سماح المجموعات

عند ضبط `channels.whatsapp.groups` أو `channels.telegram.groups` أو `channels.imessage.groups`، تعمل المفاتيح كقائمة سماح للمجموعات. استخدم `"*"` للسماح بكل المجموعات مع الاستمرار في ضبط سلوك الإشارة الافتراضي.

التباس شائع: موافقة اقتران الرسائل المباشرة ليست هي نفسها تفويض المجموعات.
بالنسبة إلى القنوات التي تدعم اقتران الرسائل المباشرة، فإن مخزن الاقتران يفتح الرسائل المباشرة فقط. ولا تزال أوامر المجموعات تتطلب تفويضًا صريحًا لمرسل المجموعة من قوائم السماح في الإعدادات مثل `groupAllowFrom` أو آلية الرجوع الاحتياطي الموثقة لذلك channel.

الأهداف الشائعة (نسخ/لصق):

1. تعطيل كل الردود في المجموعات

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. السماح لمجموعات محددة فقط (WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "123@g.us": { requireMention: true },
        "456@g.us": { requireMention: false },
      },
    },
  },
}
```

3. السماح بكل المجموعات لكن مع طلب الإشارة (بشكل صريح)

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. المالك فقط يمكنه التشغيل داخل المجموعات (WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
      groups: { "*": { requireMention: true } },
    },
  },
}
```

## التفعيل (للمالك فقط)

يمكن لمالكي المجموعات تبديل التفعيل لكل مجموعة:

- `/activation mention`
- `/activation always`

يتم تحديد المالك بواسطة `channels.whatsapp.allowFrom` (أو E.164 الخاص بالبوت نفسه عند عدم ضبطه). أرسل الأمر كرسالة مستقلة. وتتجاهل الأسطح الأخرى حاليًا `/activation`.

## حقول السياق

تضبط حمولات الإدخال الواردة للمجموعات ما يلي:

- `ChatType=group`
- `GroupSubject` (إن كان معروفًا)
- `GroupMembers` (إن كانوا معروفين)
- `WasMentioned` (نتيجة بوابة الإشارة)
- تتضمن موضوعات منتدى Telegram أيضًا `MessageThreadId` و`IsForum`.

ملاحظات خاصة بالقنوات:

- يمكن لـ BlueBubbles اختياريًا إثراء المشاركين غير المسمّين في مجموعات macOS من قاعدة بيانات Contacts المحلية قبل تعبئة `GroupMembers`. يكون هذا معطلًا افتراضيًا ولا يعمل إلا بعد اجتياز بوابة المجموعات العادية.

يتضمن system prompt الخاص بالوكيل مقدمة للمجموعات في أول دور من جلسة مجموعة جديدة. وهي تذكّر النموذج بأن يرد كإنسان، ويتجنب جداول Markdown، ويقلل الأسطر الفارغة، ويتبع تباعد الدردشة العادي، ويتجنب كتابة تسلسلات `\n` الحرفية. وتُعرَض أسماء المجموعات القادمة من القنوات وتسميات المشاركين كبيانات تعريف غير موثوقة داخل fenced code blocks، وليس كتعليمات نظام مضمنة.

## تفاصيل iMessage

- فضّل `chat_id:<id>` عند التوجيه أو الإدراج في قائمة السماح.
- اعرض قائمة الدردشات: `imsg chats --limit 20`.
- تعود ردود المجموعات دائمًا إلى `chat_id` نفسه.

## system prompts الخاصة بـ WhatsApp

راجع [WhatsApp](/ar/channels/whatsapp#system-prompts) للحصول على قواعد system prompt الرسمية الخاصة بـ WhatsApp، بما في ذلك حل prompt للمجموعات والمباشر، وسلوك wildcard، ودلالات تجاوز الحساب.

## تفاصيل WhatsApp

راجع [رسائل المجموعات](/ar/channels/group-messages) لمعرفة السلوك الخاص بـ WhatsApp فقط (حقن السجل، وتفاصيل التعامل مع الإشارات).

## ذو صلة

- [رسائل المجموعات](/ar/channels/group-messages)
- [مجموعات البث](/ar/channels/broadcast-groups)
- [توجيه القنوات](/ar/channels/channel-routing)
- [الاقتران](/ar/channels/pairing)

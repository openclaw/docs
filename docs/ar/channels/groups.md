---
read_when:
    - تغيير سلوك الدردشة الجماعية أو تقييد الإشارات
sidebarTitle: Groups
summary: سلوك الدردشة الجماعية عبر الواجهات (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: المجموعات
x-i18n:
    generated_at: "2026-04-30T16:27:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed9cba03cf4546a20d473e8095a54858530869b27f8934f2680e8dbe987dbf5e
    source_path: channels/groups.md
    workflow: 16
---

يعامل OpenClaw محادثات المجموعات باتساق عبر السطوح: Discord، iMessage، Matrix، Microsoft Teams، Signal، Slack، Telegram، WhatsApp، Zalo.

## مقدمة للمبتدئين (دقيقتان)

"يعيش" OpenClaw على حسابات المراسلة الخاصة بك. لا يوجد مستخدم بوت WhatsApp منفصل. إذا كنت **أنت** في مجموعة، فيمكن لـ OpenClaw رؤية تلك المجموعة والرد فيها.

السلوك الافتراضي:

- المجموعات مقيدة (`groupPolicy: "allowlist"`).
- تتطلب الردود إشارة ما لم تعطل بوابة الإشارات صراحة.
- الردود النهائية العادية في المجموعات/القنوات خاصة افتراضيا. يستخدم الإخراج المرئي في الغرفة أداة `message`.

المعنى: يمكن للمرسلين المدرجين في قائمة السماح تشغيل OpenClaw بالإشارة إليه.

<Note>
**الخلاصة**

- يتحكم `*.allowFrom` في **الوصول عبر الرسائل المباشرة**.
- تتحكم `*.groupPolicy` + قوائم السماح (`*.groups`, `*.groupAllowFrom`) في **الوصول عبر المجموعات**.
- تتحكم بوابة الإشارات (`requireMention`, `/activation`) في **تشغيل الردود**.

</Note>

التدفق السريع (ما يحدث لرسالة مجموعة):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## الردود المرئية

بالنسبة إلى غرف المجموعات/القنوات، يكون OpenClaw مضبوطا افتراضيا على `messages.groupChat.visibleReplies: "message_tool"`.
يعني ذلك أن الوكيل لا يزال يعالج الدور ويمكنه تحديث حالة الذاكرة/الجلسة، لكن إجابته النهائية العادية لا تنشر تلقائيا مرة أخرى في الغرفة. للتحدث بشكل مرئي، يستخدم الوكيل `message(action=send)`.

بالنسبة إلى المحادثات المباشرة وأي دور مصدر آخر، استخدم `messages.visibleReplies: "message_tool"` لتطبيق سلوك الرد المرئي عبر الأداة فقط نفسه عالميا. يظل `messages.groupChat.visibleReplies` التجاوز الأكثر تخصيصا لغرف المجموعات/القنوات.

يستبدل هذا النمط القديم المتمثل في إجبار النموذج على الإجابة بـ `NO_REPLY` لمعظم أدوار وضع الترقب. في وضع الأداة فقط، يعني عدم فعل أي شيء مرئي ببساطة عدم استدعاء أداة الرسائل.

لا تزال مؤشرات الكتابة ترسل أثناء عمل الوكيل في وضع الأداة فقط. تمت ترقية وضع كتابة المجموعة الافتراضي من "message" إلى "instant" لهذه الأدوار لأنه قد لا يكون هناك نص رسالة مساعد عادي أبدا قبل أن يقرر الوكيل ما إذا كان سيستدعي أداة الرسائل. يظل إعداد وضع الكتابة الصريح هو الفائز.

لاستعادة الردود النهائية التلقائية القديمة لغرف المجموعات/القنوات:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

يعيد Gateway تحميل إعدادات `messages` بشكل ساخن بعد حفظ الملف. أعد التشغيل فقط
عندما تكون مراقبة الملفات أو إعادة تحميل الإعدادات معطلة في النشر.

لاشتراط مرور الإخراج المرئي عبر أداة الرسائل لكل محادثة مصدر:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

تتجاوز أوامر الشرطة المائلة الأصلية (Discord وTelegram والسطوح الأخرى ذات دعم الأوامر الأصلي) `visibleReplies: "message_tool"` وترد دائما بشكل مرئي بحيث تحصل واجهة أوامر القناة الأصلية على الاستجابة التي تتوقعها. ينطبق هذا على أدوار الأوامر الأصلية المتحقق منها فقط؛ لا تزال أوامر `/...` المكتوبة نصيا وأدوار المحادثة العادية تتبع الإعداد الافتراضي للمجموعة المكوّن.

## رؤية السياق وقوائم السماح

يوجد عنصران مختلفان للتحكم في أمان المجموعات:

- **تفويض التشغيل**: من يمكنه تشغيل الوكيل (`groupPolicy`, `groups`, `groupAllowFrom`, قوائم السماح الخاصة بالقناة).
- **رؤية السياق**: ما السياق التكميلي الذي يحقن في النموذج (نص الرد، الاقتباسات، سجل السلسلة، بيانات التعريف المعاد توجيهها).

افتراضيا، يعطي OpenClaw الأولوية لسلوك المحادثة الطبيعي ويحافظ على السياق في الغالب كما تم استلامه. يعني هذا أن قوائم السماح تقرر أساسا من يمكنه تشغيل الإجراءات، وليست حد تنقيح عاما لكل مقتطف مقتبس أو تاريخي.

<AccordionGroup>
  <Accordion title="السلوك الحالي خاص بالقناة">
    - تطبق بعض القنوات بالفعل تصفية مبنية على المرسل للسياق التكميلي في مسارات محددة (مثل تهيئة سلاسل Slack وعمليات البحث عن الردود/السلاسل في Matrix).
    - لا تزال قنوات أخرى تمرر سياق الاقتباس/الرد/إعادة التوجيه كما تم استلامه.

  </Accordion>
  <Accordion title="اتجاه التقوية (مخطط)">
    - يحافظ `contextVisibility: "all"` (الافتراضي) على السلوك الحالي كما تم استلامه.
    - يصفي `contextVisibility: "allowlist"` السياق التكميلي إلى المرسلين المدرجين في قائمة السماح.
    - `contextVisibility: "allowlist_quote"` هو `allowlist` مع استثناء صريح واحد للاقتباس/الرد.

    إلى أن ينفذ نموذج التقوية هذا باتساق عبر القنوات، توقع وجود اختلافات حسب السطح.

  </Accordion>
</AccordionGroup>

![تدفق رسالة المجموعة](/images/groups-flow.svg)

إذا كنت تريد...

| الهدف                                         | ما يجب ضبطه                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| السماح بكل المجموعات لكن الرد فقط عند @الإشارات | `groups: { "*": { requireMention: true } }`                |
| تعطيل كل ردود المجموعات                    | `groupPolicy: "disabled"`                                  |
| مجموعات محددة فقط                         | `groups: { "<group-id>": { ... } }` (لا يوجد مفتاح `"*"` )         |
| أنت فقط يمكنك التشغيل في المجموعات               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## مفاتيح الجلسة

- تستخدم جلسات المجموعات مفاتيح جلسة `agent:<agentId>:<channel>:group:<id>` (تستخدم الغرف/القنوات `agent:<agentId>:<channel>:channel:<id>`).
- تضيف موضوعات منتديات Telegram `:topic:<threadId>` إلى معرف المجموعة بحيث يكون لكل موضوع جلسته الخاصة.
- تستخدم المحادثات المباشرة الجلسة الرئيسية (أو لكل مرسل إذا تم تكوين ذلك).
- يتم تخطي Heartbeats لجلسات المجموعات.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## النمط: الرسائل المباشرة الشخصية + المجموعات العامة (وكيل واحد)

نعم — يعمل هذا جيدا إذا كانت الحركة "الشخصية" لديك هي **رسائل مباشرة** وكانت الحركة "العامة" لديك هي **مجموعات**.

السبب: في وضع الوكيل الواحد، تصل الرسائل المباشرة عادة إلى مفتاح الجلسة **الرئيسي** (`agent:main:main`)، بينما تستخدم المجموعات دائما مفاتيح جلسة **غير رئيسية** (`agent:main:<channel>:group:<id>`). إذا مكّنت العزل باستخدام `mode: "non-main"`، تعمل جلسات المجموعات تلك في خلفية العزل المكوّنة بينما تبقى جلسة الرسائل المباشرة الرئيسية على المضيف. Docker هو الخلفية الافتراضية إذا لم تختر واحدة.

يمنحك هذا "عقل" وكيل واحدا (مساحة عمل + ذاكرة مشتركتان)، لكن بوضعيتين للتنفيذ:

- **الرسائل المباشرة**: أدوات كاملة (المضيف)
- **المجموعات**: عزل + أدوات مقيدة

<Note>
إذا كنت تحتاج إلى مساحات عمل/شخصيات منفصلة حقا (يجب ألا تختلط "الشخصية" و"العامة" أبدا)، فاستخدم وكيلا ثانيا + ارتباطات. راجع [التوجيه متعدد الوكلاء](/ar/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="الرسائل المباشرة على المضيف، والمجموعات معزولة">
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
  </Tab>
  <Tab title="ترى المجموعات مجلدا مدرجا في قائمة السماح فقط">
    هل تريد "يمكن للمجموعات رؤية المجلد X فقط" بدلا من "لا وصول إلى المضيف"؟ أبق `workspaceAccess: "none"` واربط المسارات المدرجة في قائمة السماح فقط داخل العزل:

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

  </Tab>
</Tabs>

ذات صلة:

- مفاتيح الإعدادات والقيم الافتراضية: [إعدادات Gateway](/ar/gateway/config-agents#agentsdefaultssandbox)
- تصحيح سبب حظر أداة: [العزل مقابل سياسة الأدوات مقابل الرفع](/ar/gateway/sandbox-vs-tool-policy-vs-elevated)
- تفاصيل ربط التحميل: [العزل](/ar/gateway/sandboxing#custom-bind-mounts)

## تسميات العرض

- تستخدم تسميات واجهة المستخدم `displayName` عند توفره، منسقا كـ `<channel>:<token>`.
- `#room` محجوز للغرف/القنوات؛ تستخدم محادثات المجموعات `g-<slug>` (أحرف صغيرة، المسافات -> `-`، مع إبقاء `#@+._-`).

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

| السياسة        | السلوك                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | تتجاوز المجموعات قوائم السماح؛ ولا تزال بوابة الإشارات مطبقة.      |
| `"disabled"`  | حظر كل رسائل المجموعات بالكامل.                           |
| `"allowlist"` | السماح فقط بالمجموعات/الغرف التي تطابق قائمة السماح المكوّنة. |

<AccordionGroup>
  <Accordion title="ملاحظات لكل قناة">
    - `groupPolicy` منفصل عن بوابة الإشارات (التي تتطلب @الإشارات).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: استخدم `groupAllowFrom` (احتياطي: `allowFrom` الصريح).
    - Signal: يمكن أن يطابق `groupAllowFrom` إما معرف مجموعة Signal الوارد أو هاتف/UUID المرسل.
    - تنطبق موافقات إقران الرسائل المباشرة (إدخالات مخزن `*-allowFrom`) على الوصول عبر الرسائل المباشرة فقط؛ يبقى تفويض مرسلي المجموعات صريحا لقوائم السماح للمجموعات.
    - Discord: تستخدم قائمة السماح `channels.discord.guilds.<id>.channels`.
    - Slack: تستخدم قائمة السماح `channels.slack.channels`.
    - Matrix: تستخدم قائمة السماح `channels.matrix.groups`. فضّل معرفات الغرف أو الأسماء المستعارة؛ البحث عن اسم الغرفة المنضم إليها يبذل أفضل جهد، ويتم تجاهل الأسماء غير المحلولة في وقت التشغيل. استخدم `channels.matrix.groupAllowFrom` لتقييد المرسلين؛ كما تدعم قوائم سماح `users` لكل غرفة.
    - يتم التحكم في الرسائل المباشرة الجماعية بشكل منفصل (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - يمكن أن تطابق قائمة السماح في Telegram معرفات المستخدمين (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) أو أسماء المستخدمين (`"@alice"` أو `"alice"`); البادئات غير حساسة لحالة الأحرف.
    - الافتراضي هو `groupPolicy: "allowlist"`؛ إذا كانت قائمة سماح المجموعات لديك فارغة، فسيتم حظر رسائل المجموعات.
    - أمان وقت التشغيل: عندما تكون كتلة مزود مفقودة بالكامل (`channels.<provider>` غائبة)، تعود سياسة المجموعات إلى وضع مغلق عند الفشل (عادة `allowlist`) بدلا من وراثة `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

النموذج الذهني السريع (ترتيب التقييم لرسائل المجموعات):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="قوائم السماح للمجموعات">
    قوائم السماح للمجموعات (`*.groups`, `*.groupAllowFrom`, قائمة السماح الخاصة بالقناة).
  </Step>
  <Step title="بوابة الإشارات">
    بوابة الإشارات (`requireMention`, `/activation`).
  </Step>
</Steps>

## بوابة الإشارات (افتراضي)

تتطلب رسائل المجموعات إشارة ما لم يتم تجاوز ذلك لكل مجموعة. توجد القيم الافتراضية لكل نظام فرعي تحت `*.groups."*"`.

الرد على رسالة بوت يُحتسب كإشارة ضمنية عندما تدعم القناة بيانات وصفية للرد. ويمكن أن يُحتسب اقتباس رسالة بوت أيضًا كإشارة ضمنية في القنوات التي تعرض بيانات وصفية للاقتباس. تشمل الحالات المدمجة الحالية Telegram وWhatsApp وSlack وDiscord وMicrosoft Teams وZaloUser.

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

<AccordionGroup>
  <Accordion title="Mention gating notes">
    - `mentionPatterns` هي أنماط تعبيرات منتظمة آمنة وغير حساسة لحالة الأحرف؛ ويتم تجاهل الأنماط غير الصالحة وصيغ التكرار المتداخل غير الآمنة.
    - الأسطح التي توفر إشارات صريحة تظل تمر؛ فالأنماط آلية احتياطية.
    - تجاوز لكل وكيل: `agents.list[].groupChat.mentionPatterns` (مفيد عندما يشارك عدة وكلاء مجموعة واحدة).
    - لا يُفرض تقييد الإشارات إلا عندما يكون اكتشاف الإشارة ممكنًا (إشارات أصلية أو عند تكوين `mentionPatterns`).
    - السماح لمجموعة أو مُرسِل لا يعطل تقييد الإشارات؛ اضبط `requireMention` لتلك المجموعة على `false` عندما يجب أن تؤدي كل الرسائل إلى التشغيل.
    - يحمل سياق مطالبة دردشة المجموعة تعليمة الرد الصامت المحلولة في كل دورة؛ ويجب ألا تكرر ملفات مساحة العمل آليات `NO_REPLY`.
    - المجموعات التي يُسمح فيها بالردود الصامتة تتعامل مع دورات النموذج الفارغة النظيفة أو التي تحتوي على استدلال فقط كصامتة، بما يعادل `NO_REPLY`. تفعل الدردشات المباشرة الشيء نفسه فقط عندما تكون الردود الصامتة المباشرة مسموحًا بها صراحة؛ وإلا تظل الردود الفارغة دورات وكيل فاشلة.
    - توجد افتراضيات Discord في `channels.discord.guilds."*"` (قابلة للتجاوز لكل نقابة/قناة).
    - يُغلَّف سياق سجل المجموعة بشكل موحد عبر القنوات وهو **للمعلَّق فقط** (الرسائل التي تم تخطيها بسبب تقييد الإشارات)؛ استخدم `messages.groupChat.historyLimit` للافتراضي العام و`channels.<channel>.historyLimit` (أو `channels.<channel>.accounts.*.historyLimit`) للتجاوزات. اضبطه على `0` للتعطيل.

  </Accordion>
</AccordionGroup>

## قيود أدوات المجموعة/القناة (اختياري)

تدعم بعض تكوينات القنوات تقييد الأدوات المتاحة **داخل مجموعة/غرفة/قناة محددة**.

- `tools`: السماح بالأدوات أو رفضها للمجموعة كلها.
- `toolsBySender`: تجاوزات لكل مُرسِل داخل المجموعة. استخدم بادئات المفاتيح الصريحة: `id:<senderId>` و`e164:<phone>` و`username:<handle>` و`name:<displayName>` وحرف البدل `"*"`. لا تزال المفاتيح القديمة غير المسبوقة مقبولة وتُطابق باعتبارها `id:` فقط.

ترتيب الحل (الأكثر تحديدًا يفوز):

<Steps>
  <Step title="Group toolsBySender">
    تطابق `toolsBySender` للمجموعة/القناة.
  </Step>
  <Step title="Group tools">
    `tools` للمجموعة/القناة.
  </Step>
  <Step title="Default toolsBySender">
    تطابق `toolsBySender` الافتراضي (`"*"`).
  </Step>
  <Step title="Default tools">
    `tools` الافتراضي (`"*"`).
  </Step>
</Steps>

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

<Note>
تُطبَّق قيود أدوات المجموعة/القناة بالإضافة إلى سياسة الأدوات العامة/الخاصة بالوكيل (لا يزال الرفض يفوز). تستخدم بعض القنوات تداخلًا مختلفًا للغرف/القنوات (مثل Discord `guilds.*.channels.*` وSlack `channels.*` وMicrosoft Teams `teams.*.channels.*`).
</Note>

## قوائم السماح للمجموعات

عند تكوين `channels.whatsapp.groups` أو `channels.telegram.groups` أو `channels.imessage.groups`، تعمل المفاتيح كقائمة سماح للمجموعات. استخدم `"*"` للسماح بكل المجموعات مع الاستمرار في ضبط سلوك الإشارة الافتراضي.

<Warning>
التباس شائع: موافقة إقران الرسائل المباشرة ليست مماثلة لتخويل المجموعة. بالنسبة إلى القنوات التي تدعم إقران الرسائل المباشرة، يفتح مخزن الإقران الرسائل المباشرة فقط. لا تزال أوامر المجموعات تتطلب تخويلًا صريحًا لمُرسِل المجموعة من قوائم السماح في التكوين مثل `groupAllowFrom` أو رجوع التكوين الموثق لتلك القناة.
</Warning>

الأغراض الشائعة (انسخ/الصق):

<Tabs>
  <Tab title="Disable all group replies">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="Allow only specific groups (WhatsApp)">
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
  </Tab>
  <Tab title="Allow all groups but require mention">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Owner-only triggers (WhatsApp)">
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
  </Tab>
</Tabs>

## التفعيل (للمالك فقط)

يمكن لمالكي المجموعات تبديل التفعيل لكل مجموعة:

- `/activation mention`
- `/activation always`

يُحدد المالك بواسطة `channels.whatsapp.allowFrom` (أو رقم E.164 الذاتي للبوت عند عدم ضبطه). أرسل الأمر كرسالة مستقلة. تتجاهل الأسطح الأخرى حاليًا `/activation`.

## حقول السياق

تضبط حمولات المجموعة الواردة:

- `ChatType=group`
- `GroupSubject` (إذا كان معروفًا)
- `GroupMembers` (إذا كان معروفًا)
- `WasMentioned` (نتيجة تقييد الإشارات)
- تتضمن مواضيع منتديات Telegram أيضًا `MessageThreadId` و`IsForum`.

ملاحظات خاصة بالقناة:

- يمكن لـ BlueBubbles اختياريًا إثراء مشاركي مجموعات macOS غير المسماة من قاعدة بيانات جهات الاتصال المحلية قبل ملء `GroupMembers`. يكون هذا متوقفًا افتراضيًا ولا يعمل إلا بعد اجتياز تقييد المجموعة العادي.

تتضمن مطالبة نظام الوكيل مقدمة للمجموعة في الدورة الأولى لجلسة مجموعة جديدة. وهي تذكّر النموذج بالرد مثل إنسان، وتجنب جداول Markdown، وتقليل الأسطر الفارغة واتباع تباعد الدردشة العادي، وتجنب كتابة تسلسلات `\n` الحرفية. تُعرض أسماء المجموعات وتسميات المشاركين القادمة من القناة كبيانات وصفية غير موثوقة داخل سياج، وليست تعليمات نظام مضمنة.

## تفاصيل iMessage

- فضّل `chat_id:<id>` عند التوجيه أو السماح.
- سرد الدردشات: `imsg chats --limit 20`.
- تعود ردود المجموعة دائمًا إلى `chat_id` نفسه.

## مطالبات نظام WhatsApp

راجع [WhatsApp](/ar/channels/whatsapp#system-prompts) لقواعد مطالبة نظام WhatsApp المعيارية، بما في ذلك حل مطالبات المجموعة والمباشرة، وسلوك أحرف البدل، ودلالات تجاوز الحساب.

## تفاصيل WhatsApp

راجع [رسائل المجموعة](/ar/channels/group-messages) للسلوك الخاص بـ WhatsApp فقط (حقن السجل، وتفاصيل معالجة الإشارات).

## ذات صلة

- [مجموعات البث](/ar/channels/broadcast-groups)
- [توجيه القنوات](/ar/channels/channel-routing)
- [رسائل المجموعة](/ar/channels/group-messages)
- [الإقران](/ar/channels/pairing)

---
read_when:
    - تغيير سلوك الدردشة الجماعية أو بوابة الإشارات
    - تقييد mentionPatterns بمحادثات جماعية محددة
sidebarTitle: Groups
summary: سلوك الدردشة الجماعية عبر الأسطح (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: المجموعات
x-i18n:
    generated_at: "2026-06-27T17:10:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48660e36ac642956842d453fd4caf2cbd7f4193efee9ac864fd7cf700c3c43b6
    source_path: channels/groups.md
    workflow: 16
---

يتعامل OpenClaw مع محادثات المجموعات باتساق عبر الأسطح: Discord، iMessage، Matrix، Microsoft Teams، QQBot، Signal، Slack، Telegram، WhatsApp، Zalo.

للغرف دائمة التشغيل التي ينبغي أن توفر سياقًا هادئًا ما لم يرسل الوكيل رسالة مرئية صراحةً، راجع [أحداث الغرف المحيطة](/ar/channels/ambient-room-events).

## مقدمة للمبتدئين (دقيقتان)

"يعيش" OpenClaw على حسابات المراسلة الخاصة بك. لا يوجد مستخدم بوت WhatsApp منفصل. إذا كنت **أنت** موجودًا في مجموعة، يستطيع OpenClaw رؤية تلك المجموعة والرد فيها.

السلوك الافتراضي:

- المجموعات مقيّدة (`groupPolicy: "allowlist"`).
- تتطلب الردود إشارة ما لم تعطّل بوابة الإشارة صراحةً.
- تستخدم الردود المرئية في المجموعات/القنوات أداة `message` افتراضيًا.

الترجمة: يستطيع المرسلون الموجودون في قائمة السماح تشغيل OpenClaw عبر الإشارة إليه.

<Note>
**الخلاصة**

- يتحكم `*.allowFrom` في **وصول الرسائل المباشرة**.
- تتحكم `*.groupPolicy` + قوائم السماح (`*.groups`، `*.groupAllowFrom`) في **وصول المجموعات**.
- تتحكم بوابة الإشارة (`requireMention`، `/activation`) في **تشغيل الردود**.

</Note>

التدفق السريع (ما يحدث لرسالة مجموعة):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
mention/reply/command/DM -> user request
always-on group chatter -> user request, or room event when configured
```

## الردود المرئية

لطلبات المجموعات/القنوات العادية، يستخدم OpenClaw افتراضيًا `messages.groupChat.visibleReplies: "automatic"`. يُنشر نص المساعد النهائي عبر مسار الرد المرئي القديم ما لم تجعل الغرفة تستخدم إخراج أداة الرسائل فقط.

استخدم `messages.groupChat.visibleReplies: "message_tool"` عندما ينبغي لغرفة مشتركة أن تترك للوكيل قرار وقت التحدث عبر استدعاء `message(action=send)`. يعمل هذا أفضل مع غرف المجموعات المدعومة بنماذج الجيل الأحدث الموثوقة في استخدام الأدوات، مثل GPT 5.5. إذا فوّت النموذج تلك الأداة وأعاد نصًا نهائيًا ذا مضمون، يُبقي OpenClaw ذلك النص النهائي خاصًا بدلًا من نشره في الغرفة.

استخدم `"automatic"` للنماذج أو بيئات التشغيل الأضعف التي لا تفهم التسليم المعتمد على الأدوات فقط بموثوقية. في الوضع التلقائي، يكون نص المساعد النهائي هو مسار الرد المرئي المصدر، لذلك لا يزال بإمكان نموذج لا يستطيع استدعاء `message(action=send)` باستمرار أن يجيب بشكل عادي.

في الوضع التلقائي، تُنشر الردود النهائية النصية العادية مباشرةً في الغرفة. إذا كان الرد المرئي يحتاج إلى ملفات أو صور أو مرفقات أخرى، قد يظل الوكيل يستخدم `message(action=send)` لذلك المرفق بدلًا من محاولة تمريره عبر رد النص النهائي.

إذا لم تكن أداة الرسائل متاحة بموجب سياسة الأدوات النشطة، يعود OpenClaw
إلى الردود المرئية التلقائية بدلًا من كبت الاستجابة بصمت.
يحذّر `openclaw doctor` من عدم التطابق هذا.

للمحادثات المباشرة وأي حدث مصدر آخر، استخدم `messages.visibleReplies: "message_tool"` لتطبيق سلوك الرد المرئي المعتمد على الأداة فقط نفسه عالميًا. تستخدم أدوار WebChat المباشرة الداخلية افتراضيًا تسليم الرد النهائي التلقائي حتى يتلقى Pi وCodex عقد الرد المرئي نفسه. عيّن `messages.visibleReplies: "message_tool"` لطلب `message(action=send)` عمدًا للإخراج المرئي. يظل `messages.groupChat.visibleReplies` هو التجاوز الأكثر تحديدًا لغرف المجموعات/القنوات.

يستبدل هذا النمط القديم الذي كان يجبر النموذج على الإجابة بـ `NO_REPLY` لمعظم أدوار وضع الترقب. في وضع الأدوات فقط، لا يعرّف الموجه عقد `NO_REPLY`. عدم فعل أي شيء مرئي يعني ببساطة عدم استدعاء أداة الرسائل.

روابط المحادثات المملوكة من Plugin هي الاستثناء. بمجرد أن يربط Plugin سلسلة محادثة ويدّعي الدور الوارد، يكون الرد الذي يعيده Plugin هو استجابة الربط المرئية؛ ولا يحتاج إلى `message(action=send)`. ذلك الرد هو إخراج بيئة تشغيل Plugin، وليس نصًا نهائيًا خاصًا من النموذج.

لا تزال مؤشرات الكتابة تُرسل لطلبات المجموعات المباشرة. تظل أحداث الغرف المحيطة دائمة التشغيل، عند تمكينها، صارمة وهادئة ما لم يستدعِ الوكيل أداة الرسائل.

تكبت الجلسات ملخصات الأدوات/التقدم المطوّلة افتراضيًا. استخدم `/verbose on`
لإظهار تلك الملخصات للجلسة الحالية أثناء التصحيح، و
`/verbose off` للعودة إلى سلوك الرد النهائي فقط. تنطبق حالة الإسهاب نفسها
عبر المحادثات المباشرة والمجموعات والقنوات وموضوعات المنتديات.

لإرسال ثرثرة المجموعات دائمة التشغيل غير المشار إليها كسياق غرفة هادئ بدلًا من طلبات مستخدم، استخدم [أحداث الغرف المحيطة](/ar/channels/ambient-room-events):

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

القيمة الافتراضية هي `unmentionedInbound: "user_request"`.

تظل الرسائل المشار إليها، والأوامر، وطلبات الإيقاف، والرسائل المباشرة طلبات مستخدم.

لطلب مرور الإخراج المرئي عبر أداة الرسائل لطلبات المجموعات/القنوات:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

يعيد Gateway تحميل إعدادات `messages` تحميلًا ساخنًا بعد حفظ الملف. لا تعِد التشغيل إلا
عندما تكون مراقبة الملفات أو إعادة تحميل الإعدادات معطلة في النشر.

لطلب مرور الإخراج المرئي عبر أداة الرسائل لكل محادثة مصدر:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

تتجاوز أوامر الشرطة المائلة الأصلية (Discord وTelegram والأسطح الأخرى التي تدعم الأوامر الأصلية) `visibleReplies: "message_tool"` وترد دائمًا بشكل مرئي حتى تحصل واجهة أوامر القناة الأصلية على الاستجابة التي تتوقعها. ينطبق هذا على أدوار الأوامر الأصلية المتحقق منها فقط؛ أما أوامر `/...` المكتوبة نصيًا وأدوار الدردشة العادية فما زالت تتبع الإعداد الافتراضي المضبوط للمجموعة.

## ظهور السياق وقوائم السماح

هناك عنصران مختلفان للتحكم في أمان المجموعات:

- **تفويض التشغيل**: من يستطيع تشغيل الوكيل (`groupPolicy`، `groups`، `groupAllowFrom`، قوائم السماح الخاصة بالقنوات).
- **ظهور السياق**: ما السياق التكميلي الذي يُحقن في النموذج (نص الرد، الاقتباسات، سجل سلسلة المحادثة، بيانات التعريف المعاد توجيهها).

افتراضيًا، يعطي OpenClaw الأولوية لسلوك الدردشة العادي ويبقي السياق غالبًا كما استُلم. يعني هذا أن قوائم السماح تحدد بالأساس من يستطيع تشغيل الإجراءات، وليست حدًا عامًا للتنقيح لكل مقتطف مقتبس أو تاريخي.

<AccordionGroup>
  <Accordion title="Current behavior is channel-specific">
    - تطبق بعض القنوات بالفعل ترشيحًا قائمًا على المرسل للسياق التكميلي في مسارات محددة (مثل بذر سلاسل Slack، وعمليات البحث عن الردود/السلاسل في Matrix).
    - لا تزال قنوات أخرى تمرر سياق الاقتباس/الرد/إعادة التوجيه كما استُلم.

  </Accordion>
  <Accordion title="Hardening direction (planned)">
    - يحافظ `contextVisibility: "all"` (افتراضيًا) على السلوك الحالي كما استُلم.
    - يرشح `contextVisibility: "allowlist"` السياق التكميلي إلى المرسلين الموجودين في قائمة السماح.
    - `contextVisibility: "allowlist_quote"` هو `allowlist` بالإضافة إلى استثناء اقتباس/رد صريح واحد.

    إلى أن يُطبّق نموذج التقوية هذا باتساق عبر القنوات، توقّع اختلافات بحسب السطح.

  </Accordion>
</AccordionGroup>

![تدفق رسائل المجموعة](/images/groups-flow.svg)

إذا أردت...

| الهدف                                         | ما يجب ضبطه                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| السماح لكل المجموعات مع الرد فقط عند @الإشارات | `groups: { "*": { requireMention: true } }`                |
| تعطيل كل ردود المجموعات                    | `groupPolicy: "disabled"`                                  |
| مجموعات محددة فقط                         | `groups: { "<group-id>": { ... } }` (بدون مفتاح `"*"` )         |
| أنت فقط تستطيع التشغيل في المجموعات               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| إعادة استخدام مجموعة مرسلين موثوقة واحدة عبر القنوات | `groupAllowFrom: ["accessGroup:operators"]`                |

لقوائم سماح المرسلين القابلة لإعادة الاستخدام، راجع [مجموعات الوصول](/ar/channels/access-groups).

## مفاتيح الجلسات

- تستخدم جلسات المجموعات مفاتيح جلسة `agent:<agentId>:<channel>:group:<id>` (تستخدم الغرف/القنوات `agent:<agentId>:<channel>:channel:<id>`).
- تضيف موضوعات منتديات Telegram ‏`:topic:<threadId>` إلى معرف المجموعة بحيث يكون لكل موضوع جلسته الخاصة.
- تستخدم المحادثات المباشرة الجلسة الرئيسية (أو جلسة لكل مرسل إذا ضُبطت كذلك).
- يتم تخطي Heartbeats لجلسات المجموعات.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## النمط: رسائل مباشرة شخصية + مجموعات عامة (وكيل واحد)

نعم — يعمل هذا جيدًا إذا كانت حركة المرور "الشخصية" لديك هي **رسائل مباشرة** وكانت حركة المرور "العامة" لديك هي **مجموعات**.

السبب: في وضع الوكيل الواحد، تصل الرسائل المباشرة عادةً إلى مفتاح الجلسة **الرئيسي** (`agent:main:main`)، بينما تستخدم المجموعات دائمًا مفاتيح جلسة **غير رئيسية** (`agent:main:<channel>:group:<id>`). إذا فعّلت العزل باستخدام `mode: "non-main"`، تعمل جلسات المجموعات تلك في واجهة العزل الخلفية المضبوطة بينما تبقى جلسة الرسائل المباشرة الرئيسية لديك على المضيف. Docker هي الواجهة الخلفية الافتراضية إذا لم تختر واحدة.

يمنحك هذا "عقل" وكيل واحدًا (مساحة عمل + ذاكرة مشتركتان)، لكن بوضعَي تنفيذ:

- **الرسائل المباشرة**: أدوات كاملة (المضيف)
- **المجموعات**: عزل + أدوات مقيّدة

<Note>
إذا كنت تحتاج إلى مساحات عمل/شخصيات منفصلة حقًا (يجب ألا يختلط "الشخصي" و"العام" أبدًا)، فاستخدم وكيلًا ثانيًا + روابط. راجع [توجيه الوكلاء المتعددين](/ar/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DMs on host, groups sandboxed">
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
  <Tab title="Groups see only an allowlisted folder">
    هل تريد "يمكن للمجموعات رؤية المجلد X فقط" بدلًا من "لا وصول إلى المضيف"؟ أبقِ `workspaceAccess: "none"` واربط المسارات الموجودة في قائمة السماح فقط داخل العزل:

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

مرتبط:

- مفاتيح الإعدادات والقيم الافتراضية: [إعدادات Gateway](/ar/gateway/config-agents#agentsdefaultssandbox)
- تصحيح سبب حظر أداة: [العزل مقابل سياسة الأدوات مقابل الرفع](/ar/gateway/sandbox-vs-tool-policy-vs-elevated)
- تفاصيل روابط التحميل: [العزل](/ar/gateway/sandboxing#custom-bind-mounts)

## تسميات العرض

- تستخدم تسميات واجهة المستخدم `displayName` عندما تكون متاحة، منسقةً على شكل `<channel>:<token>`.
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

| السياسة       | السلوك                                                       |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | تتجاوز المجموعات قوائم السماح؛ ويظل تقييد الإشارة مطبقا.     |
| `"disabled"`  | حظر جميع رسائل المجموعات بالكامل.                            |
| `"allowlist"` | السماح فقط بالمجموعات/الغرف التي تطابق قائمة السماح المضبوطة. |

<AccordionGroup>
  <Accordion title="Per-channel notes">
    - `groupPolicy` منفصل عن تقييد الإشارة (الذي يتطلب @mentions).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: استخدم `groupAllowFrom` (الاحتياطي: `allowFrom` الصريح).
    - Signal: يمكن أن يطابق `groupAllowFrom` إما معرف مجموعة Signal الوارد أو هاتف/UUID المرسل.
    - تنطبق موافقات اقتران الرسائل المباشرة (إدخالات مخزن `*-allowFrom`) على الوصول إلى الرسائل المباشرة فقط؛ ويبقى تفويض مرسل المجموعة صريحا في قوائم سماح المجموعات.
    - Discord: تستخدم قائمة السماح `channels.discord.guilds.<id>.channels`.
    - Slack: تستخدم قائمة السماح `channels.slack.channels`.
    - Matrix: تستخدم قائمة السماح `channels.matrix.groups`. فضّل معرفات الغرف أو الأسماء المستعارة؛ البحث عن اسم الغرفة المنضم إليها هو أفضل محاولة، ويتم تجاهل الأسماء غير المحلولة وقت التشغيل. استخدم `channels.matrix.groupAllowFrom` لتقييد المرسلين؛ كما تدعم قوائم سماح `users` لكل غرفة.
    - تتم إدارة الرسائل المباشرة الجماعية بشكل منفصل (`channels.discord.dm.*`، `channels.slack.dm.*`).
    - يمكن لقائمة سماح Telegram مطابقة معرفات المستخدمين (`"123456789"`، `"telegram:123456789"`، `"tg:123456789"`) أو أسماء المستخدمين (`"@alice"` أو `"alice"`)، والبادئات غير حساسة لحالة الأحرف.
    - الافتراضي هو `groupPolicy: "allowlist"`؛ إذا كانت قائمة سماح مجموعتك فارغة، فستحظر رسائل المجموعة.
    - أمان وقت التشغيل: عندما تكون كتلة مزود مفقودة تماما (`channels.<provider>` غير موجودة)، تعود سياسة المجموعة إلى وضع فشل مغلق (عادة `allowlist`) بدلا من وراثة `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

نموذج ذهني سريع (ترتيب التقييم لرسائل المجموعات):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Group allowlists">
    قوائم سماح المجموعات (`*.groups`، `*.groupAllowFrom`، قائمة السماح الخاصة بالقناة).
  </Step>
  <Step title="Mention gating">
    تقييد الإشارة (`requireMention`، `/activation`).
  </Step>
</Steps>

## تقييد الإشارة (افتراضي)

تتطلب رسائل المجموعات إشارة ما لم يتم تجاوز ذلك لكل مجموعة. تعيش الإعدادات الافتراضية لكل نظام فرعي ضمن `*.groups."*"`.

يُحتسب الرد على رسالة بوت كإشارة ضمنية عندما تدعم القناة بيانات تعريف الرد. ويمكن أيضا أن يُحتسب اقتباس رسالة بوت كإشارة ضمنية في القنوات التي تكشف بيانات تعريف الاقتباس. تشمل الحالات المضمنة الحالية Telegram وWhatsApp وSlack وDiscord وMicrosoft Teams وZaloUser.

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

## تحديد نطاق أنماط الإشارة المضبوطة

تعد `mentionPatterns` المضبوطة محفزات احتياطية بتعابير نمطية. استخدمها عندما لا تكشف
المنصة عن إشارة بوت أصلية، أو عندما تريد أن يُحتسب نص عادي مثل
`openclaw:` كإشارة. إشارات المنصة الأصلية منفصلة:
عندما يمكن لـ Discord أو Slack أو Telegram أو Matrix أو قناة أخرى إثبات أن الرسالة
ذكرت البوت صراحة، فستظل تلك الإشارة الأصلية تشغل حتى إذا
تم رفض أنماط التعابير النمطية المضبوطة.

افتراضيا، تنطبق أنماط الإشارة المضبوطة في كل مكان تمرر فيه تلك القناة
حقائق المزود والمحادثة إلى كشف الإشارة. لمنع الأنماط الواسعة
من إيقاظ الوكيل في كل مجموعة، حدد نطاقها لكل قناة باستخدام
`channels.<channel>.mentionPatterns`.

استخدم `mode: "deny"` عندما ينبغي إيقاف أنماط الإشارة بالتعابير النمطية افتراضيا لقناة
ما، ثم فعّل غرفا محددة باستخدام `allowIn`:

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b", "\\bops bot\\b"],
    },
  },
  channels: {
    slack: {
      mentionPatterns: {
        mode: "deny",
        allowIn: ["C0123OPS"],
      },
    },
  },
}
```

استخدم `mode: "allow"` الافتراضي (أو احذف `mode`) عندما ينبغي أن تنطبق أنماط الإشارة
بالتعابير النمطية على نطاق واسع، ثم أوقفها في الغرف كثيرة الضجيج باستخدام `denyIn`:

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
  channels: {
    telegram: {
      mentionPatterns: {
        denyIn: ["-1001234567890", "-1001234567890:topic:42"],
      },
    },
  },
}
```

حل السياسة:

| الحقل           | التأثير                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | تكون أنماط الإشارة بالتعابير النمطية مفعلة ما لم يكن معرف المحادثة في `denyIn`. هذا هو الافتراضي.                    |
| `mode: "deny"`  | تكون أنماط الإشارة بالتعابير النمطية معطلة ما لم يكن معرف المحادثة في `allowIn`.                                      |
| `allowIn`       | معرفات المحادثات التي تكون فيها أنماط الإشارة بالتعابير النمطية مفعلة في وضع الرفض.                                  |
| `denyIn`        | معرفات المحادثات التي تكون فيها أنماط الإشارة بالتعابير النمطية معطلة. يتغلب `denyIn` على `allowIn` إذا تضمنا المعرف نفسه. |

سياسة التعابير النمطية محددة النطاق المدعومة حاليا:

| القناة   | المعرفات المستخدمة في `allowIn` / `denyIn`                         |
| -------- | ------------------------------------------------------------ |
| Discord  | معرفات قنوات Discord.                                       |
| Matrix   | معرفات غرف Matrix.                                          |
| Slack    | معرفات قنوات Slack.                                         |
| Telegram | معرفات محادثات المجموعات، أو `chatId:topic:threadId` لمواضيع المنتديات. |
| WhatsApp | معرفات محادثات WhatsApp مثل `123@g.us`.                     |

يمكن لإعدادات القناة على مستوى الحساب ضبط السياسة نفسها ضمن
`channels.<channel>.accounts.<accountId>.mentionPatterns` عندما تدعم تلك القناة
حسابات متعددة. تتقدم سياسة الحساب على سياسة القناة ذات المستوى الأعلى
لذلك الحساب.

<AccordionGroup>
  <Accordion title="Mention gating notes">
    - `mentionPatterns` هي أنماط تعابير نمطية آمنة وغير حساسة لحالة الأحرف؛ ويتم تجاهل الأنماط غير الصالحة وأشكال التكرار المتداخل غير الآمنة.
    - الأسطح التي توفر إشارات صريحة تظل تمر؛ والأنماط المضبوطة بالتعابير النمطية هي احتياطي.
    - `channels.<channel>.mentionPatterns.mode: "deny"` يعطل أنماط الإشارة المضبوطة افتراضيا لتلك القناة؛ أعد تفعيل محادثات محددة باستخدام `allowIn`.
    - `channels.<channel>.mentionPatterns.denyIn` يعطل أنماط الإشارة المضبوطة لمعرفات محادثات محددة بينما تظل @mentions الأصلية للمنصة تمر.
    - تجاوز لكل وكيل: `agents.list[].groupChat.mentionPatterns` (مفيد عندما يشترك عدة وكلاء في مجموعة).
    - لا يفرض تقييد الإشارة إلا عندما يكون كشف الإشارة ممكنا (إشارات أصلية أو تم ضبط `mentionPatterns`).
    - لا يعطل وضع مجموعة أو مرسل في قائمة السماح تقييد الإشارة؛ اضبط `requireMention` لتلك المجموعة على `false` عندما ينبغي أن تشغل جميع الرسائل.
    - يحمل سياق مطالبة محادثة المجموعة التلقائي تعليمة الرد الصامت المحلولة في كل دورة؛ ويجب ألا تكرر ملفات مساحة العمل آليات `NO_REPLY`.
    - المجموعات التي يسمح فيها بالردود الصامتة التلقائية تتعامل مع دورات النموذج الفارغة النظيفة أو المقتصرة على الاستدلال كصامتة، بما يعادل `NO_REPLY`. لا تتلقى المحادثات المباشرة أبدا إرشاد `NO_REPLY`، وتبقى ردود المجموعات المعتمدة على أداة الرسائل فقط صامتة بعدم استدعاء `message(action=send)`.
    - تستخدم ثرثرة المجموعات المحيطة والدائمة التشغيل دلالات طلب المستخدم افتراضيا. اضبط `messages.groupChat.unmentionedInbound: "room_event"` لإرسالها كسياق هادئ بدلا من ذلك. راجع [أحداث الغرف المحيطة](/ar/channels/ambient-room-events) للاطلاع على أمثلة الإعداد.
    - لا تخزن أحداث الغرف كطلبات مستخدم مزيفة، ولا يعاد تشغيل نص المساعد الخاص من أحداث الغرف بلا أداة رسائل كسجل محادثة.
    - تعيش إعدادات Discord الافتراضية في `channels.discord.guilds."*"` (قابلة للتجاوز لكل خادم/قناة).
    - يتم تغليف سياق سجل المجموعات بشكل موحد عبر القنوات. تحتفظ المجموعات المقيدة بالإشارة بالرسائل المتخطاة المعلقة؛ وقد تحتفظ المجموعات الدائمة التشغيل أيضا برسائل الغرفة المعالجة حديثا عندما تدعم القناة ذلك. استخدم `messages.groupChat.historyLimit` للإعداد الافتراضي العام و`channels.<channel>.historyLimit` (أو `channels.<channel>.accounts.*.historyLimit`) للتجاوزات. اضبط `0` للتعطيل.

  </Accordion>
</AccordionGroup>

## قيود أدوات المجموعة/القناة (اختياري)

تدعم بعض إعدادات القنوات تقييد الأدوات المتاحة **داخل مجموعة/غرفة/قناة محددة**.

- `tools`: السماح بالأدوات أو رفضها للمجموعة كلها.
- `toolsBySender`: تجاوزات لكل مرسل داخل المجموعة. استخدم بادئات مفاتيح صريحة: `channel:<channelId>:<senderId>`، و`id:<senderId>`، و`e164:<phone>`، و`username:<handle>`، و`name:<displayName>`، وحرف البدل `"*"`. تستخدم معرفات القنوات معرفات قنوات OpenClaw القياسية؛ ويتم تطبيع الأسماء المستعارة مثل `teams` إلى `msteams`. لا تزال المفاتيح القديمة غير المسبوقة مقبولة وتطابق كـ `id:` فقط.

ترتيب الحل (الأكثر تحديدا يفوز):

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
تطبق قيود أدوات المجموعة/القناة بالإضافة إلى سياسة الأدوات العامة/الخاصة بالوكيل (ولا يزال الرفض يتغلب). تستخدم بعض القنوات تداخلا مختلفا للغرف/القنوات (على سبيل المثال، Discord `guilds.*.channels.*`، وSlack `channels.*`، وMicrosoft Teams `teams.*.channels.*`).
</Note>

## قوائم سماح المجموعات

عند ضبط `channels.whatsapp.groups` أو `channels.telegram.groups` أو `channels.imessage.groups`، تعمل المفاتيح كقائمة سماح للمجموعات. استخدم `"*"` للسماح بجميع المجموعات مع الاستمرار في ضبط سلوك الإشارة الافتراضي.

<Warning>
التباس شائع: اعتماد إقران الرسائل المباشرة ليس هو نفسه تفويض المجموعة. بالنسبة إلى القنوات التي تدعم إقران الرسائل المباشرة، لا يفتح مخزن الإقران إلا الرسائل المباشرة. لا تزال أوامر المجموعة تتطلب تفويضًا صريحًا لمرسل المجموعة من قوائم السماح في الإعدادات مثل `groupAllowFrom` أو رجوع الإعدادات الموثق لتلك القناة.
</Warning>

الأهداف الشائعة (نسخ/لصق):

<Tabs>
  <Tab title="تعطيل كل ردود المجموعات">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="السماح بمجموعات محددة فقط (WhatsApp)">
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
  <Tab title="السماح بكل المجموعات مع اشتراط الإشارة">
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
  <Tab title="مشغلات المالك فقط (WhatsApp)">
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

## التفعيل (المالك فقط)

يمكن لمالكي المجموعات تبديل التفعيل لكل مجموعة:

- `/activation mention`
- `/activation always`

يُحدَّد المالك بواسطة `channels.whatsapp.allowFrom` (أو رقم E.164 الذاتي للبوت عند عدم ضبطه). أرسل الأمر كرسالة مستقلة. تتجاهل الأسطح الأخرى حاليًا `/activation`.

## حقول السياق

تضبط حمولات المجموعات الواردة:

- `ChatType=group`
- `GroupSubject` (إذا كان معروفًا)
- `GroupMembers` (إذا كان معروفًا)
- `WasMentioned` (نتيجة بوابة الإشارة)
- تتضمن موضوعات منتدى Telegram أيضًا `MessageThreadId` و`IsForum`.

تتضمن مطالبة نظام الوكيل مقدمة للمجموعة في أول دور من جلسة مجموعة جديدة. وهي تذكّر النموذج بأن يرد مثل الإنسان، ويقلل الأسطر الفارغة ويتبع تباعد الدردشة المعتاد، ويتجنب كتابة تسلسلات `\n` حرفية. كما تثبط المجموعات غير التابعة لـ Telegram استخدام جداول Markdown؛ أما إرشادات النص المنسق في Telegram فتأتي من مطالبة قناة Telegram. تُعرض أسماء المجموعات وتسميات المشاركين الواردة من القنوات كبيانات وصفية غير موثوقة داخل سياج، لا كتعليمات نظام مضمنة.

## تفاصيل iMessage

- فضّل `chat_id:<id>` عند التوجيه أو الإدراج في قائمة السماح.
- سرد الدردشات: `imsg chats --limit 20`.
- تعود ردود المجموعات دائمًا إلى نفس `chat_id`.

## مطالبات نظام WhatsApp

راجع [WhatsApp](/ar/channels/whatsapp#system-prompts) للاطلاع على قواعد مطالبات نظام WhatsApp الأساسية، بما في ذلك حل مطالبات المجموعات والمباشرة، وسلوك أحرف البدل، ودلالات تجاوز الحساب.

## تفاصيل WhatsApp

راجع [رسائل المجموعات](/ar/channels/group-messages) للاطلاع على السلوك الخاص بـ WhatsApp فقط (إدخال السجل، وتفاصيل التعامل مع الإشارات).

## ذو صلة

- [مجموعات البث](/ar/channels/broadcast-groups)
- [توجيه القنوات](/ar/channels/channel-routing)
- [رسائل المجموعات](/ar/channels/group-messages)
- [الإقران](/ar/channels/pairing)

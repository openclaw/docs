---
read_when:
    - تغيير سلوك الدردشة الجماعية أو تقييد الإشارات
sidebarTitle: Groups
summary: سلوك المحادثات الجماعية عبر الواجهات (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: المجموعات
x-i18n:
    generated_at: "2026-05-11T20:20:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19297ef9c3043b00c4785567a7c02266bd08fe5228c8275c3233e87e917dd09f
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw يتعامل مع محادثات المجموعات باتساق عبر الواجهات: Discord، iMessage، Matrix، Microsoft Teams، Signal، Slack، Telegram، WhatsApp، Zalo.

## مقدمة للمبتدئين (دقيقتان)

OpenClaw "يعيش" على حسابات المراسلة الخاصة بك. لا يوجد مستخدم بوت WhatsApp منفصل. إذا كنت **أنت** في مجموعة، فيمكن لـ OpenClaw رؤية تلك المجموعة والرد فيها.

السلوك الافتراضي:

- المجموعات مقيّدة (`groupPolicy: "allowlist"`).
- تتطلب الردود إشارة ما لم تعطّل بوابة الإشارات صراحة.
- الردود النهائية العادية في المجموعات/القنوات تكون خاصة افتراضيًا. يستخدم إخراج الغرفة المرئي أداة `message`.

الترجمة: يمكن للمرسلين المدرجين في قائمة السماح تشغيل OpenClaw عبر الإشارة إليه.

<Note>
**ملخص سريع**

- **الوصول إلى الرسائل المباشرة** تتحكم به `*.allowFrom`.
- **الوصول إلى المجموعات** تتحكم به `*.groupPolicy` + قوائم السماح (`*.groups`, `*.groupAllowFrom`).
- **تشغيل الردود** تتحكم به بوابة الإشارات (`requireMention`, `/activation`).

</Note>

تدفق سريع (ما يحدث لرسالة مجموعة):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## الردود المرئية

بالنسبة لغرف المجموعات/القنوات، يضبط OpenClaw افتراضيًا `messages.groupChat.visibleReplies: "message_tool"`.
يكتب `openclaw doctor --fix` هذا الإعداد الافتراضي في إعدادات القنوات المكوّنة التي لا تتضمنه.
يعني ذلك أن الوكيل لا يزال يعالج الدور ويمكنه تحديث حالة الذاكرة/الجلسة، لكن إجابته النهائية العادية لا تُنشر تلقائيًا مرة أخرى في الغرفة. للتحدث بشكل مرئي، يستخدم الوكيل `message(action=send)`.

يعتمد هذا الإعداد الافتراضي على نموذج/وقت تشغيل يستدعي الأدوات بشكل موثوق. إذا أظهرت السجلات
نص المساعد لكن `didSendViaMessagingTool: false`، فهذا يعني أن النموذج أجاب
بشكل خاص بدلًا من استدعاء أداة الرسائل. هذا ليس فشل إرسال في
Discord/Slack/Telegram. استخدم نموذجًا موثوقًا في استدعاء الأدوات
لجلسات المجموعات/القنوات، أو اضبط
`messages.groupChat.visibleReplies: "automatic"` لاستعادة الردود النهائية المرئية
القديمة.

إذا كانت أداة الرسائل غير متاحة ضمن سياسة الأدوات النشطة، يعود OpenClaw
إلى الردود المرئية التلقائية بدلًا من كتم الاستجابة بصمت.
يحذر `openclaw doctor` من عدم التطابق هذا.

بالنسبة للمحادثات المباشرة وأي دور مصدر آخر، استخدم `messages.visibleReplies: "message_tool"` لتطبيق سلوك الردود المرئية بالأداة فقط نفسه على مستوى عام. يمكن للحزم أيضًا اختيار هذا كإعداد افتراضي عند عدم ضبطه؛ تفعل حزمة Codex ذلك للمحادثات المباشرة في وضع Codex. يبقى `messages.groupChat.visibleReplies` التجاوز الأكثر تحديدًا لغرف المجموعات/القنوات.

يستبدل هذا النمط القديم الذي كان يجبر النموذج على الإجابة بـ `NO_REPLY` لمعظم أدوار وضع المراقبة. في وضع الأداة فقط، يعني عدم فعل شيء مرئي ببساطة عدم استدعاء أداة الرسائل.

لا تزال مؤشرات الكتابة تُرسل أثناء عمل الوكيل في وضع الأداة فقط. تتم ترقية وضع الكتابة الافتراضي للمجموعات من "message" إلى "instant" لهذه الأدوار لأنه قد لا يوجد أبدًا نص رسالة مساعد عادي قبل أن يقرر الوكيل ما إذا كان سيستدعي أداة الرسائل. لا يزال إعداد وضع الكتابة الصريح له الأولوية.

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

تتجاوز أوامر الشرطة المائلة الأصلية (Discord وTelegram والواجهات الأخرى التي تدعم الأوامر الأصلية) `visibleReplies: "message_tool"` وترد دائمًا بشكل مرئي حتى تحصل واجهة أوامر القناة الأصلية على الاستجابة التي تتوقعها. ينطبق هذا على أدوار الأوامر الأصلية المتحقق منها فقط؛ لا تزال أوامر `/...` المكتوبة كنص وأدوار الدردشة العادية تتبع الإعداد الافتراضي المكوّن للمجموعة.

## رؤية السياق وقوائم السماح

يتضمن أمان المجموعات عنصرين مختلفين للتحكم:

- **تفويض التشغيل**: من يمكنه تشغيل الوكيل (`groupPolicy`, `groups`, `groupAllowFrom`, قوائم السماح الخاصة بالقناة).
- **رؤية السياق**: ما السياق التكميلي الذي يُحقن في النموذج (نص الرد، الاقتباسات، سجل السلاسل، بيانات التعريف المعاد توجيهها).

افتراضيًا، يعطي OpenClaw الأولوية لسلوك الدردشة العادي ويبقي السياق غالبًا كما تم استلامه. يعني هذا أن قوائم السماح تحدد أساسًا من يمكنه تشغيل الإجراءات، وليست حدًا عامًا للتنقيح لكل مقتطف مقتبس أو تاريخي.

<AccordionGroup>
  <Accordion title="السلوك الحالي خاص بالقناة">
    - تطبق بعض القنوات بالفعل تصفية حسب المرسل للسياق التكميلي في مسارات محددة (مثل تهيئة سلاسل Slack، وعمليات البحث عن الرد/السلسلة في Matrix).
    - لا تزال قنوات أخرى تمرر سياق الاقتباس/الرد/إعادة التوجيه كما تم استلامه.

  </Accordion>
  <Accordion title="اتجاه التقوية (مخطط)">
    - `contextVisibility: "all"` (افتراضي) يبقي السلوك الحالي كما تم استلامه.
    - `contextVisibility: "allowlist"` يرشح السياق التكميلي إلى المرسلين المدرجين في قائمة السماح.
    - `contextVisibility: "allowlist_quote"` هو `allowlist` مع استثناء صريح واحد للاقتباس/الرد.

    إلى أن يُنفذ نموذج التقوية هذا باتساق عبر القنوات، توقع اختلافات حسب الواجهة.

  </Accordion>
</AccordionGroup>

![تدفق رسائل المجموعة](/images/groups-flow.svg)

إذا كنت تريد...

| الهدف                                         | ما يجب ضبطه                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| السماح بكل المجموعات لكن الرد فقط عند @mentions | `groups: { "*": { requireMention: true } }`                |
| تعطيل كل ردود المجموعات                    | `groupPolicy: "disabled"`                                  |
| مجموعات محددة فقط                         | `groups: { "<group-id>": { ... } }` (بدون مفتاح `"*"` )         |
| أنت فقط تستطيع التشغيل في المجموعات       | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| إعادة استخدام مجموعة مرسلين موثوقين عبر القنوات | `groupAllowFrom: ["accessGroup:operators"]`                |

لقوائم سماح المرسلين القابلة لإعادة الاستخدام، راجع [مجموعات الوصول](/ar/channels/access-groups).

## مفاتيح الجلسات

- تستخدم جلسات المجموعات مفاتيح جلسات `agent:<agentId>:<channel>:group:<id>` (تستخدم الغرف/القنوات `agent:<agentId>:<channel>:channel:<id>`).
- تضيف مواضيع منتدى Telegram `:topic:<threadId>` إلى معرّف المجموعة بحيث يكون لكل موضوع جلسته الخاصة.
- تستخدم المحادثات المباشرة الجلسة الرئيسية (أو حسب المرسل إذا كان مكوّنًا).
- يتم تخطي Heartbeats لجلسات المجموعات.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## النمط: رسائل مباشرة شخصية + مجموعات عامة (وكيل واحد)

نعم — يعمل هذا جيدًا إذا كان مرورك "الشخصي" هو **رسائل مباشرة** وكان مرورك "العام" هو **مجموعات**.

السبب: في وضع الوكيل الواحد، تصل الرسائل المباشرة عادةً إلى مفتاح الجلسة **الرئيسية** (`agent:main:main`)، بينما تستخدم المجموعات دائمًا مفاتيح جلسات **غير رئيسية** (`agent:main:<channel>:group:<id>`). إذا فعّلت العزل بـ `mode: "non-main"`، تعمل جلسات المجموعات تلك في خلفية العزل المكوّنة بينما تبقى جلسة الرسائل المباشرة الرئيسية على المضيف. Docker هو الخلفية الافتراضية إذا لم تختر واحدة.

يمنحك هذا "عقل" وكيل واحدًا (مساحة عمل + ذاكرة مشتركتان)، لكن وضعين للتنفيذ:

- **الرسائل المباشرة**: أدوات كاملة (المضيف)
- **المجموعات**: عزل + أدوات مقيّدة

<Note>
إذا كنت تحتاج إلى مساحات عمل/شخصيات منفصلة حقًا (يجب ألا يختلط "الشخصي" و"العام" أبدًا)، فاستخدم وكيلًا ثانيًا + ربطًا. راجع [توجيه متعدد الوكلاء](/ar/concepts/multi-agent).
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
  <Tab title="المجموعات ترى مجلدًا مدرجًا في قائمة السماح فقط">
    هل تريد "يمكن للمجموعات رؤية المجلد X فقط" بدلًا من "لا وصول إلى المضيف"؟ أبقِ `workspaceAccess: "none"` واربط فقط المسارات المدرجة في قائمة السماح داخل العزل:

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

- مفاتيح الإعدادات والافتراضيات: [إعدادات Gateway](/ar/gateway/config-agents#agentsdefaultssandbox)
- تصحيح سبب حظر أداة: [العزل مقابل سياسة الأدوات مقابل الصلاحيات المرتفعة](/ar/gateway/sandbox-vs-tool-policy-vs-elevated)
- تفاصيل الربط: [العزل](/ar/gateway/sandboxing#custom-bind-mounts)

## تسميات العرض

- تستخدم تسميات UI `displayName` عند توفره، منسقة على هيئة `<channel>:<token>`.
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
| `"open"`      | تتجاوز المجموعات قوائم السماح؛ تظل بوابة الإشارات مطبقة.      |
| `"disabled"`  | حظر كل رسائل المجموعات بالكامل.                           |
| `"allowlist"` | السماح فقط بالمجموعات/الغرف التي تطابق قائمة السماح المكوّنة. |

<AccordionGroup>
  <Accordion title="ملاحظات لكل قناة">
    - `groupPolicy` منفصلة عن بوابة الإشارات (التي تتطلب @mentions).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: استخدم `groupAllowFrom` (الاحتياطي: `allowFrom` صريح).
    - Signal: يمكن أن يطابق `groupAllowFrom` إما معرّف مجموعة Signal الواردة أو هاتف/UUID المرسل.
    - تنطبق موافقات إقران الرسائل المباشرة (إدخالات مخزن `*-allowFrom`) على الوصول إلى الرسائل المباشرة فقط؛ ويظل تفويض مرسل المجموعة صريحا لقوائم السماح الخاصة بالمجموعات.
    - Discord: تستخدم قائمة السماح `channels.discord.guilds.<id>.channels`.
    - Slack: تستخدم قائمة السماح `channels.slack.channels`.
    - Matrix: تستخدم قائمة السماح `channels.matrix.groups`. فضّل معرّفات الغرف أو الأسماء المستعارة؛ البحث عن اسم الغرفة المنضم إليها هو أفضل جهد ممكن، ويتم تجاهل الأسماء غير المحلولة وقت التشغيل. استخدم `channels.matrix.groupAllowFrom` لتقييد المرسلين؛ كما تدعم قوائم سماح `users` لكل غرفة.
    - تتحكم رسائل المجموعات المباشرة بشكل منفصل (`channels.discord.dm.*`، `channels.slack.dm.*`).
    - يمكن لقائمة سماح Telegram مطابقة معرّفات المستخدمين (`"123456789"`، `"telegram:123456789"`، `"tg:123456789"`) أو أسماء المستخدمين (`"@alice"` أو `"alice"`)، والبادئات غير حساسة لحالة الأحرف.
    - الافتراضي هو `groupPolicy: "allowlist"`؛ إذا كانت قائمة سماح المجموعات فارغة، فسيتم حظر رسائل المجموعة.
    - أمان وقت التشغيل: عندما تكون كتلة المزوّد مفقودة تماما (`channels.<provider>` غير موجودة)، تعود سياسة المجموعة إلى وضع مغلق عند الفشل (عادة `allowlist`) بدلا من وراثة `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

النموذج الذهني السريع (ترتيب التقييم لرسائل المجموعة):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="قوائم سماح المجموعات">
    قوائم سماح المجموعات (`*.groups`، `*.groupAllowFrom`، قائمة السماح الخاصة بالقناة).
  </Step>
  <Step title="بوابة الإشارات">
    بوابة الإشارات (`requireMention`، `/activation`).
  </Step>
</Steps>

## بوابة الإشارات (افتراضي)

تتطلب رسائل المجموعة إشارة ما لم يتم تجاوز ذلك لكل مجموعة. توجد الإعدادات الافتراضية لكل نظام فرعي تحت `*.groups."*"`.

يُعد الرد على رسالة بوت إشارة ضمنية عندما تدعم القناة بيانات الرد الوصفية. كما يمكن أن يُعد اقتباس رسالة بوت إشارة ضمنية في القنوات التي تعرض بيانات الاقتباس الوصفية. تشمل الحالات المدمجة الحالية Telegram وWhatsApp وSlack وDiscord وMicrosoft Teams وZaloUser.

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
  <Accordion title="ملاحظات بوابة الإشارات">
    - `mentionPatterns` هي أنماط تعبيرات منتظمة آمنة وغير حساسة لحالة الأحرف؛ يتم تجاهل الأنماط غير الصالحة وأشكال التكرار المتداخل غير الآمنة.
    - الأسطح التي توفر إشارات صريحة لا تزال تمر؛ الأنماط هي احتياطي.
    - تجاوز لكل وكيل: `agents.list[].groupChat.mentionPatterns` (مفيد عندما يشارك عدة وكلاء مجموعة واحدة).
    - لا يتم فرض بوابة الإشارات إلا عندما يكون اكتشاف الإشارات ممكنا (الإشارات الأصلية أو إعداد `mentionPatterns`).
    - لا يؤدي السماح لمجموعة أو مرسل إلى تعطيل بوابة الإشارات؛ اضبط `requireMention` لتلك المجموعة على `false` عندما يجب أن تؤدي كل الرسائل إلى التشغيل.
    - يحمل سياق موجه دردشة المجموعة تعليمة الرد الصامت المحلولة في كل دور؛ يجب ألا تكرر ملفات مساحة العمل آليات `NO_REPLY`.
    - تتعامل المجموعات التي تسمح بالردود الصامتة مع أدوار النموذج النظيفة الفارغة أو التي تحتوي على استدلال فقط على أنها صامتة، بما يعادل `NO_REPLY`. تفعل الدردشات المباشرة الشيء نفسه فقط عندما تكون الردود الصامتة المباشرة مسموحة صراحة؛ وإلا تظل الردود الفارغة أدوارا فاشلة للوكيل.
    - توجد إعدادات Discord الافتراضية في `channels.discord.guilds."*"` (قابلة للتجاوز لكل خادم/قناة).
    - يتم تغليف سياق سجل المجموعة بشكل موحد عبر القنوات. تحتفظ المجموعات الخاضعة لبوابة الإشارات بالرسائل المتخطاة المعلقة؛ وقد تحتفظ المجموعات الدائمة التشغيل أيضا برسائل الغرفة المعالجة حديثا عندما تدعم القناة ذلك. استخدم `messages.groupChat.historyLimit` للإعداد الافتراضي العام و`channels.<channel>.historyLimit` (أو `channels.<channel>.accounts.*.historyLimit`) للتجاوزات. اضبطه على `0` للتعطيل.

  </Accordion>
</AccordionGroup>

## قيود أدوات المجموعة/القناة (اختياري)

تدعم بعض إعدادات القنوات تقييد الأدوات المتاحة **داخل مجموعة/غرفة/قناة محددة**.

- `tools`: السماح بالأدوات أو رفضها للمجموعة بأكملها.
- `toolsBySender`: تجاوزات لكل مرسل داخل المجموعة. استخدم بادئات مفاتيح صريحة: `channel:<channelId>:<senderId>`، `id:<senderId>`، `e164:<phone>`، `username:<handle>`، `name:<displayName>`، وحرف البدل `"*"`. تستخدم معرّفات القنوات معرّفات قنوات OpenClaw القانونية؛ ويتم تطبيع الأسماء المستعارة مثل `teams` إلى `msteams`. لا تزال المفاتيح القديمة غير المسبوقة مقبولة وتتم مطابقتها كـ `id:` فقط.

ترتيب الحل (الأكثر تحديدا يفوز):

<Steps>
  <Step title="Group toolsBySender">
    تطابق `toolsBySender` للمجموعة/القناة.
  </Step>
  <Step title="أدوات المجموعة">
    `tools` للمجموعة/القناة.
  </Step>
  <Step title="Default toolsBySender">
    تطابق `toolsBySender` الافتراضي (`"*"`).
  </Step>
  <Step title="الأدوات الافتراضية">
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
تُطبّق قيود أدوات المجموعة/القناة بالإضافة إلى سياسة الأدوات العامة/الخاصة بالوكيل (لا يزال الرفض يفوز). تستخدم بعض القنوات تداخلا مختلفا للغرف/القنوات (مثل Discord `guilds.*.channels.*`، وSlack `channels.*`، وMicrosoft Teams `teams.*.channels.*`).
</Note>

## قوائم سماح المجموعات

عند إعداد `channels.whatsapp.groups` أو `channels.telegram.groups` أو `channels.imessage.groups`، تعمل المفاتيح كقائمة سماح للمجموعات. استخدم `"*"` للسماح بكل المجموعات مع الاستمرار في ضبط سلوك الإشارة الافتراضي.

<Warning>
التباس شائع: موافقة إقران الرسائل المباشرة ليست هي نفسها تفويض المجموعة. بالنسبة إلى القنوات التي تدعم إقران الرسائل المباشرة، يفتح مخزن الإقران الرسائل المباشرة فقط. لا تزال أوامر المجموعة تتطلب تفويضا صريحا لمرسل المجموعة من قوائم السماح في الإعدادات مثل `groupAllowFrom` أو احتياطي الإعدادات الموثق لتلك القناة.
</Warning>

النوايا الشائعة (نسخ/لصق):

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
  <Tab title="مشغلات للمالك فقط (WhatsApp)">
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

يتم تحديد المالك بواسطة `channels.whatsapp.allowFrom` (أو رقم E.164 الذاتي للبوت عند عدم ضبطه). أرسل الأمر كرسالة مستقلة. تتجاهل الأسطح الأخرى حاليا `/activation`.

## حقول السياق

تعيّن حمولات المجموعة الواردة:

- `ChatType=group`
- `GroupSubject` (إذا كان معروفا)
- `GroupMembers` (إذا كان معروفا)
- `WasMentioned` (نتيجة بوابة الإشارات)
- تتضمن مواضيع منتديات Telegram أيضا `MessageThreadId` و`IsForum`.

يتضمن موجه نظام الوكيل مقدمة مجموعة في أول دور من جلسة مجموعة جديدة. يذكّر النموذج بالرد مثل إنسان، وتجنب جداول Markdown، وتقليل الأسطر الفارغة واتباع تباعد الدردشة الطبيعي، وتجنب كتابة تسلسلات `\n` الحرفية. تُعرض أسماء المجموعات وتسميات المشاركين القادمة من القناة كبيانات وصفية غير موثوقة داخل أسوار، لا كتعليمات نظام مضمنة.

## تفاصيل iMessage

- فضّل `chat_id:<id>` عند التوجيه أو الإدراج في قائمة السماح.
- سرد الدردشات: `imsg chats --limit 20`.
- تعود ردود المجموعة دائما إلى `chat_id` نفسه.

## موجهات نظام WhatsApp

راجع [WhatsApp](/ar/channels/whatsapp#system-prompts) للاطلاع على قواعد موجه نظام WhatsApp القانونية، بما في ذلك حل الموجهات للمجموعات والمباشر، وسلوك حرف البدل، ودلالات تجاوز الحساب.

## تفاصيل WhatsApp

راجع [رسائل المجموعة](/ar/channels/group-messages) للاطلاع على سلوك WhatsApp فقط (إدخال السجل، وتفاصيل التعامل مع الإشارات).

## ذات صلة

- [مجموعات البث](/ar/channels/broadcast-groups)
- [توجيه القنوات](/ar/channels/channel-routing)
- [رسائل المجموعة](/ar/channels/group-messages)
- [الإقران](/ar/channels/pairing)

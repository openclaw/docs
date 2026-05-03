---
read_when:
    - تغيير سلوك الدردشة الجماعية أو تقييد الإشارات
sidebarTitle: Groups
summary: سلوك الدردشة الجماعية عبر الواجهات (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: المجموعات
x-i18n:
    generated_at: "2026-05-03T21:27:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fd4fcaa8335f1dc4b4b1a719d6654ab0c10530f74284269ed6205dd5f87c116
    source_path: channels/groups.md
    workflow: 16
---

يتعامل OpenClaw مع الدردشات الجماعية باتساق عبر الواجهات: Discord، وiMessage، وMatrix، وMicrosoft Teams، وSignal، وSlack، وTelegram، وWhatsApp، وZalo.

## مقدمة للمبتدئين (دقيقتان)

"يعيش" OpenClaw على حسابات المراسلة الخاصة بك. لا يوجد مستخدم بوت WhatsApp منفصل. إذا كنت **أنت** موجودًا في مجموعة، فيمكن لـ OpenClaw رؤية تلك المجموعة والرد فيها.

السلوك الافتراضي:

- المجموعات مقيدة (`groupPolicy: "allowlist"`).
- تتطلب الردود إشارة ما لم تعطل بوابة الإشارات صراحة.
- الردود النهائية العادية في المجموعات/القنوات تكون خاصة افتراضيًا. يستخدم الإخراج المرئي في الغرفة أداة `message`.

الترجمة: يمكن للمرسلين المدرجين في قائمة السماح تشغيل OpenClaw عبر الإشارة إليه.

<Note>
**الخلاصة**

- **وصول الرسائل المباشرة** تتحكم به `*.allowFrom`.
- **وصول المجموعات** تتحكم به `*.groupPolicy` + قوائم السماح (`*.groups`، `*.groupAllowFrom`).
- **تشغيل الرد** تتحكم به بوابة الإشارات (`requireMention`، `/activation`).

</Note>

تدفق سريع (ما يحدث لرسالة مجموعة):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## الردود المرئية

بالنسبة إلى غرف المجموعات/القنوات، يكون الإعداد الافتراضي في OpenClaw هو `messages.groupChat.visibleReplies: "message_tool"`.
يكتب `openclaw doctor --fix` هذا الإعداد الافتراضي في إعدادات القنوات المهيأة التي لا تتضمنه.
يعني ذلك أن الوكيل لا يزال يعالج الدور ويمكنه تحديث حالة الذاكرة/الجلسة، لكن إجابته النهائية العادية لا تُنشر تلقائيًا مرة أخرى في الغرفة. للتحدث بشكل مرئي، يستخدم الوكيل `message(action=send)`.

إذا لم تكن أداة الرسائل متاحة ضمن سياسة الأدوات النشطة، يعود OpenClaw
إلى الردود المرئية التلقائية بدلًا من كتم الاستجابة بصمت.
يحذر `openclaw doctor` من هذا التعارض.

بالنسبة إلى الدردشات المباشرة وأي دور مصدر آخر، استخدم `messages.visibleReplies: "message_tool"` لتطبيق السلوك نفسه للردود المرئية المعتمدة على الأداة فقط على مستوى عام. يمكن لحاضنات الاختبار أيضًا اختيار هذا كإعداد افتراضي عند عدم ضبطه؛ تفعل حاضنة Codex ذلك للدردشات المباشرة في وضع Codex. يظل `messages.groupChat.visibleReplies` التجاوز الأكثر تحديدًا لغرف المجموعات/القنوات.

يحل هذا محل النمط القديم الذي كان يفرض على النموذج الإجابة بـ `NO_REPLY` في معظم أدوار وضع المراقبة الصامتة. في وضع الأداة فقط، يعني عدم فعل أي شيء مرئي ببساطة عدم استدعاء أداة الرسائل.

لا تزال مؤشرات الكتابة تُرسل بينما يعمل الوكيل في وضع الأداة فقط. تتم ترقية وضع الكتابة الجماعي الافتراضي من "message" إلى "instant" لهذه الأدوار لأنه قد لا يكون هناك أي نص رسالة مساعد عادي قبل أن يقرر الوكيل ما إذا كان سيستدعي أداة الرسائل. تظل إعدادات وضع الكتابة الصريحة هي صاحبة الأولوية.

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

يعيد Gateway تحميل إعدادات `messages` تحميلًا ساخنًا بعد حفظ الملف. أعد التشغيل فقط
عندما تكون مراقبة الملفات أو إعادة تحميل الإعدادات معطلة في النشر.

لاشتراط أن يمر الإخراج المرئي عبر أداة الرسائل لكل دردشة مصدر:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

تتجاوز أوامر الشرطة المائلة الأصلية (Discord، وTelegram، والواجهات الأخرى التي تدعم الأوامر الأصلية) `visibleReplies: "message_tool"` وترد دائمًا بشكل مرئي كي تحصل واجهة أوامر القناة الأصلية على الاستجابة التي تتوقعها. ينطبق هذا على أدوار الأوامر الأصلية المتحقق منها فقط؛ أما أوامر `/...` المكتوبة نصيًا وأدوار الدردشة العادية فلا تزال تتبع الإعداد الافتراضي المهيأ للمجموعة.

## رؤية السياق وقوائم السماح

يوجد عنصران مختلفان للتحكم في أمان المجموعات:

- **تفويض التشغيل**: من يمكنه تشغيل الوكيل (`groupPolicy`، و`groups`، و`groupAllowFrom`، وقوائم السماح الخاصة بالقنوات).
- **رؤية السياق**: ما السياق التكميلي الذي يُحقن في النموذج (نص الرد، والاقتباسات، وسجل السلسلة، والبيانات الوصفية المعاد توجيهها).

افتراضيًا، يعطي OpenClaw الأولوية لسلوك الدردشة العادي ويحافظ على السياق غالبًا كما تم استلامه. يعني هذا أن قوائم السماح تحدد في المقام الأول من يمكنه تشغيل الإجراءات، وليست حدًا عامًا للتنقيح لكل مقتطف مقتبس أو تاريخي.

<AccordionGroup>
  <Accordion title="السلوك الحالي خاص بكل قناة">
    - تطبق بعض القنوات بالفعل تصفية مبنية على المرسل للسياق التكميلي في مسارات محددة (مثل تهيئة سلاسل Slack، وعمليات البحث عن ردود/سلاسل Matrix).
    - لا تزال قنوات أخرى تمرر سياق الاقتباس/الرد/إعادة التوجيه كما تم استلامه.

  </Accordion>
  <Accordion title="اتجاه التقوية (مخطط له)">
    - `contextVisibility: "all"` (افتراضي) يحافظ على السلوك الحالي كما تم استلامه.
    - `contextVisibility: "allowlist"` يرشح السياق التكميلي إلى المرسلين المدرجين في قائمة السماح.
    - `contextVisibility: "allowlist_quote"` هو `allowlist` مع استثناء صريح واحد للاقتباس/الرد.

    إلى أن يُنفذ نموذج التقوية هذا باتساق عبر القنوات، توقع اختلافات حسب الواجهة.

  </Accordion>
</AccordionGroup>

![تدفق رسالة المجموعة](/images/groups-flow.svg)

إذا كنت تريد...

| الهدف                                         | ما يجب ضبطه                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| السماح لكل المجموعات مع الرد فقط على إشارات @ | `groups: { "*": { requireMention: true } }`                |
| تعطيل كل ردود المجموعات                    | `groupPolicy: "disabled"`                                  |
| مجموعات محددة فقط                         | `groups: { "<group-id>": { ... } }` (بدون مفتاح `"*"` )         |
| يمكنك أنت فقط التشغيل في المجموعات               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| إعادة استخدام مجموعة مرسلين موثوقين عبر القنوات | `groupAllowFrom: ["accessGroup:operators"]`                |

لقوائم سماح المرسلين القابلة لإعادة الاستخدام، راجع [مجموعات الوصول](/ar/channels/access-groups).

## مفاتيح الجلسات

- تستخدم جلسات المجموعات مفاتيح جلسات `agent:<agentId>:<channel>:group:<id>` (تستخدم الغرف/القنوات `agent:<agentId>:<channel>:channel:<id>`).
- تضيف موضوعات منتديات Telegram `:topic:<threadId>` إلى معرف المجموعة بحيث يكون لكل موضوع جلسته الخاصة.
- تستخدم الدردشات المباشرة الجلسة الرئيسية (أو جلسة لكل مرسل إذا تمت تهيئتها).
- يتم تخطي رسائل Heartbeat لجلسات المجموعات.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## نمط: رسائل مباشرة شخصية + مجموعات عامة (وكيل واحد)

نعم — يعمل هذا جيدًا إذا كانت حركة المرور "الشخصية" لديك هي **رسائل مباشرة** وكانت حركة المرور "العامة" هي **مجموعات**.

السبب: في وضع الوكيل الواحد، تصل الرسائل المباشرة عادةً إلى مفتاح الجلسة **الرئيسية** (`agent:main:main`)، بينما تستخدم المجموعات دائمًا مفاتيح جلسات **غير رئيسية** (`agent:main:<channel>:group:<id>`). إذا فعّلت وضع العزل باستخدام `mode: "non-main"`، فستعمل جلسات المجموعات تلك في خلفية العزل المهيأة بينما تبقى جلسة الرسائل المباشرة الرئيسية لديك على المضيف. Docker هو الخلفية الافتراضية إذا لم تختر واحدة.

يمنحك هذا "عقل" وكيل واحدًا (مساحة عمل + ذاكرة مشتركتان)، لكن بوضعين للتنفيذ:

- **الرسائل المباشرة**: أدوات كاملة (المضيف)
- **المجموعات**: عزل + أدوات مقيدة

<Note>
إذا كنت تحتاج إلى مساحات عمل/شخصيات منفصلة تمامًا (يجب ألا تختلط "الشخصية" و"العامة" أبدًا)، فاستخدم وكيلًا ثانيًا + روابط. راجع [توجيه متعدد الوكلاء](/ar/concepts/multi-agent).
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
  <Tab title="ترى المجموعات مجلدًا مدرجًا في قائمة السماح فقط">
    هل تريد أن "تتمكن المجموعات من رؤية المجلد X فقط" بدلًا من "عدم الوصول إلى المضيف"؟ أبقِ `workspaceAccess: "none"` واربط فقط المسارات المدرجة في قائمة السماح داخل العزل:

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
- تصحيح سبب حظر أداة: [العزل مقابل سياسة الأدوات مقابل الصلاحيات المرتفعة](/ar/gateway/sandbox-vs-tool-policy-vs-elevated)
- تفاصيل روابط التحميل: [العزل](/ar/gateway/sandboxing#custom-bind-mounts)

## تسميات العرض

- تستخدم تسميات واجهة المستخدم `displayName` عند توفرها، منسقة كـ `<channel>:<token>`.
- `#room` محجوز للغرف/القنوات؛ تستخدم الدردشات الجماعية `g-<slug>` (أحرف صغيرة، المسافات -> `-`، مع الاحتفاظ بـ `#@+._-`).

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
| `"open"`      | تتجاوز المجموعات قوائم السماح؛ لا تزال بوابة الإشارات مطبقة.      |
| `"disabled"`  | حظر كل رسائل المجموعات بالكامل.                           |
| `"allowlist"` | السماح فقط بالمجموعات/الغرف التي تطابق قائمة السماح المهيأة. |

<AccordionGroup>
  <Accordion title="ملاحظات لكل قناة">
    - `groupPolicy` منفصلة عن بوابة الإشارات (التي تتطلب إشارات @).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: استخدم `groupAllowFrom` (احتياطيًا: `allowFrom` الصريح).
    - Signal: يمكن أن يطابق `groupAllowFrom` إما معرف مجموعة Signal الوارد أو هاتف/UUID المرسل.
    - تنطبق موافقات إقران الرسائل المباشرة (إدخالات مخزن `*-allowFrom`) على وصول الرسائل المباشرة فقط؛ يبقى تفويض مرسل المجموعة صريحًا لقوائم سماح المجموعات.
    - Discord: تستخدم قائمة السماح `channels.discord.guilds.<id>.channels`.
    - Slack: تستخدم قائمة السماح `channels.slack.channels`.
    - Matrix: تستخدم قائمة السماح `channels.matrix.groups`. فضّل معرفات الغرف أو الأسماء البديلة؛ البحث عن اسم الغرفة المنضم إليها يكون بأفضل جهد، ويتم تجاهل الأسماء غير المحلولة وقت التشغيل. استخدم `channels.matrix.groupAllowFrom` لتقييد المرسلين؛ كما تدعم قوائم سماح `users` لكل غرفة.
    - يتم التحكم في الرسائل المباشرة الجماعية بشكل منفصل (`channels.discord.dm.*`، `channels.slack.dm.*`).
    - يمكن لقائمة سماح Telegram مطابقة معرفات المستخدمين (`"123456789"`، `"telegram:123456789"`، `"tg:123456789"`) أو أسماء المستخدمين (`"@alice"` أو `"alice"`); البادئات غير حساسة لحالة الأحرف.
    - الإعداد الافتراضي هو `groupPolicy: "allowlist"`؛ إذا كانت قائمة سماح المجموعات لديك فارغة، فسيتم حظر رسائل المجموعات.
    - أمان وقت التشغيل: عندما تكون كتلة موفر مفقودة تمامًا (`channels.<provider>` غائبة)، تعود سياسة المجموعات إلى وضع مغلق عند الفشل (عادةً `allowlist`) بدلًا من وراثة `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

نموذج ذهني سريع (ترتيب التقييم لرسائل المجموعات):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (مفتوح/معطّل/قائمة سماح).
  </Step>
  <Step title="قوائم سماح المجموعات">
    قوائم سماح المجموعات (`*.groups`، `*.groupAllowFrom`، قائمة السماح الخاصة بالقناة).
  </Step>
  <Step title="بوابة الإشارة">
    بوابة الإشارة (`requireMention`، `/activation`).
  </Step>
</Steps>

## بوابة الإشارة (الافتراضية)

تتطلب رسائل المجموعات إشارة ما لم يتم تجاوز ذلك لكل مجموعة. توجد الإعدادات الافتراضية لكل نظام فرعي ضمن `*.groups."*"`.

يُعد الرد على رسالة بوت إشارة ضمنية عندما تدعم القناة بيانات تعريف الرد. ويمكن أن يُعد اقتباس رسالة بوت أيضًا إشارة ضمنية في القنوات التي تعرض بيانات تعريف الاقتباس. تشمل الحالات المدمجة الحالية Telegram وWhatsApp وSlack وDiscord وMicrosoft Teams وZaloUser.

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
  <Accordion title="ملاحظات بوابة الإشارة">
    - `mentionPatterns` هي أنماط regex آمنة وغير حساسة لحالة الأحرف؛ يتم تجاهل الأنماط غير الصالحة وأشكال التكرار المتداخل غير الآمنة.
    - الأسطح التي توفر إشارات صريحة تمررها مع ذلك؛ الأنماط وسيلة احتياطية.
    - تجاوز لكل وكيل: `agents.list[].groupChat.mentionPatterns` (مفيد عندما يشارك عدة وكلاء مجموعة واحدة).
    - لا تُفرض بوابة الإشارة إلا عندما يكون اكتشاف الإشارة ممكنًا (تم تكوين إشارات أصلية أو `mentionPatterns`).
    - لا يؤدي إدراج مجموعة أو مرسل في قائمة السماح إلى تعطيل بوابة الإشارة؛ اضبط `requireMention` لتلك المجموعة على `false` عندما ينبغي أن تؤدي كل الرسائل إلى التشغيل.
    - يحمل سياق مطالبة دردشة المجموعة تعليمة الرد الصامت المحلولة في كل دور؛ يجب ألا تكرر ملفات مساحة العمل آليات `NO_REPLY`.
    - تعامل المجموعات التي يُسمح فيها بالردود الصامتة أدوار النموذج النظيفة الفارغة أو التي تحتوي على استدلال فقط كصامتة، بما يعادل `NO_REPLY`. تفعل الدردشات المباشرة الشيء نفسه فقط عندما تكون الردود الصامتة المباشرة مسموحة صراحة؛ وإلا تظل الردود الفارغة أدوار وكيل فاشلة.
    - توجد إعدادات Discord الافتراضية في `channels.discord.guilds."*"` (قابلة للتجاوز لكل نقابة/قناة).
    - يُغلّف سياق سجل المجموعة بشكل موحد عبر القنوات وهو **للمعلّق فقط** (الرسائل التي تم تخطيها بسبب بوابة الإشارة)؛ استخدم `messages.groupChat.historyLimit` للإعداد الافتراضي العام و`channels.<channel>.historyLimit` (أو `channels.<channel>.accounts.*.historyLimit`) للتجاوزات. اضبطه على `0` للتعطيل.

  </Accordion>
</AccordionGroup>

## قيود أدوات المجموعة/القناة (اختياري)

تدعم بعض تكوينات القنوات تقييد الأدوات المتاحة **داخل مجموعة/غرفة/قناة محددة**.

- `tools`: السماح/الرفض للأدوات على مستوى المجموعة كلها.
- `toolsBySender`: تجاوزات لكل مرسل داخل المجموعة. استخدم بادئات مفاتيح صريحة: `id:<senderId>` و`e164:<phone>` و`username:<handle>` و`name:<displayName>` وحرف البدل `"*"`. لا تزال المفاتيح القديمة غير المسبوقة مقبولة وتتم مطابقتها كـ `id:` فقط.

ترتيب الحل (الأكثر تحديدًا يفوز):

<Steps>
  <Step title="أدوات المجموعة حسب المرسل">
    تطابق `toolsBySender` للمجموعة/القناة.
  </Step>
  <Step title="أدوات المجموعة">
    `tools` للمجموعة/القناة.
  </Step>
  <Step title="الأدوات الافتراضية حسب المرسل">
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
تُطبق قيود أدوات المجموعة/القناة إضافةً إلى سياسة الأدوات العامة/الخاصة بالوكيل (لا يزال الرفض يفوز). تستخدم بعض القنوات تداخلًا مختلفًا للغرف/القنوات (مثل Discord `guilds.*.channels.*` وSlack `channels.*` وMicrosoft Teams `teams.*.channels.*`).
</Note>

## قوائم سماح المجموعات

عند تكوين `channels.whatsapp.groups` أو `channels.telegram.groups` أو `channels.imessage.groups`، تعمل المفاتيح كقائمة سماح للمجموعات. استخدم `"*"` للسماح بكل المجموعات مع الاستمرار في تعيين سلوك الإشارة الافتراضي.

<Warning>
التباس شائع: موافقة إقران الرسائل المباشرة ليست هي نفسها تخويل المجموعة. بالنسبة إلى القنوات التي تدعم إقران الرسائل المباشرة، يفتح مخزن الإقران الرسائل المباشرة فقط. لا تزال أوامر المجموعة تتطلب تخويلًا صريحًا لمرسل المجموعة من قوائم سماح التكوين مثل `groupAllowFrom` أو بديل التكوين الموثق لتلك القناة.
</Warning>

النوايا الشائعة (انسخ/الصق):

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

## التفعيل (للمالك فقط)

يمكن لمالكي المجموعات تبديل التفعيل لكل مجموعة:

- `/activation mention`
- `/activation always`

يُحدد المالك بواسطة `channels.whatsapp.allowFrom` (أو E.164 الذاتي للبوت عند عدم تعيينه). أرسل الأمر كرسالة مستقلة. تتجاهل الأسطح الأخرى حاليًا `/activation`.

## حقول السياق

تضبط حمولات المجموعة الواردة:

- `ChatType=group`
- `GroupSubject` (إذا كان معروفًا)
- `GroupMembers` (إذا كان معروفًا)
- `WasMentioned` (نتيجة بوابة الإشارة)
- تتضمن مواضيع منتديات Telegram أيضًا `MessageThreadId` و`IsForum`.

ملاحظات خاصة بالقنوات:

- يمكن لـ BlueBubbles اختياريًا إثراء مشاركي مجموعات macOS غير المسمّين من قاعدة بيانات جهات الاتصال المحلية قبل ملء `GroupMembers`. يكون هذا متوقفًا افتراضيًا ولا يعمل إلا بعد اجتياز بوابة المجموعة العادية.

تتضمن مطالبة نظام الوكيل مقدمة للمجموعة في أول دور من جلسة مجموعة جديدة. وهي تذكّر النموذج بأن يرد مثل إنسان، وأن يتجنب جداول Markdown، وأن يقلل الأسطر الفارغة ويتبع تباعد الدردشة العادي، وأن يتجنب كتابة تسلسلات `\n` حرفيًا. تُعرض أسماء المجموعات وتسميات المشاركين المستمدة من القناة كبيانات تعريف غير موثوقة داخل كتل مسيجة، وليست تعليمات نظام مضمنة.

## تفاصيل iMessage

- فضّل `chat_id:<id>` عند التوجيه أو الإدراج في قائمة السماح.
- سرد الدردشات: `imsg chats --limit 20`.
- تعود ردود المجموعة دائمًا إلى `chat_id` نفسه.

## مطالبات نظام WhatsApp

راجع [WhatsApp](/ar/channels/whatsapp#system-prompts) للاطلاع على قواعد مطالبة نظام WhatsApp المعيارية، بما في ذلك حل مطالبات المجموعة والمباشرة، وسلوك أحرف البدل، ودلالات تجاوز الحساب.

## تفاصيل WhatsApp

راجع [رسائل المجموعات](/ar/channels/group-messages) للاطلاع على السلوك الخاص بـ WhatsApp فقط (حقن السجل، تفاصيل التعامل مع الإشارات).

## ذات صلة

- [مجموعات البث](/ar/channels/broadcast-groups)
- [توجيه القنوات](/ar/channels/channel-routing)
- [رسائل المجموعات](/ar/channels/group-messages)
- [الإقران](/ar/channels/pairing)

---
read_when:
    - تغيير سلوك الدردشة الجماعية أو اشتراط الإشارة
sidebarTitle: Groups
summary: سلوك الدردشة الجماعية عبر الواجهات (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: المجموعات
x-i18n:
    generated_at: "2026-05-01T07:37:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8580f98ab03c89770688102da776627d8ce18b7bd34c4a687009fd4aabb6213
    source_path: channels/groups.md
    workflow: 16
---

يتعامل OpenClaw مع المحادثات الجماعية باتساق عبر الواجهات: Discord، iMessage، Matrix، Microsoft Teams، Signal، Slack، Telegram، WhatsApp، Zalo.

## مقدمة للمبتدئين (دقيقتان)

"يعيش" OpenClaw على حسابات المراسلة الخاصة بك. لا يوجد مستخدم بوت WhatsApp منفصل. إذا كنت **أنت** في مجموعة، يستطيع OpenClaw رؤية تلك المجموعة والرد فيها.

السلوك الافتراضي:

- المجموعات مقيّدة (`groupPolicy: "allowlist"`).
- تتطلب الردود إشارة ما لم تعطّل تقييد الإشارة صراحةً.
- الردود النهائية العادية في المجموعات/القنوات تكون خاصة افتراضيًا. يستخدم الإخراج المرئي في الغرفة أداة `message`.

الترجمة العملية: يستطيع المرسلون المدرجون في قائمة السماح تشغيل OpenClaw عبر الإشارة إليه.

<Note>
**الخلاصة**

- يتم التحكم في **وصول الرسائل المباشرة** بواسطة `*.allowFrom`.
- يتم التحكم في **وصول المجموعات** بواسطة `*.groupPolicy` + قوائم السماح (`*.groups`، `*.groupAllowFrom`).
- يتم التحكم في **تشغيل الرد** بواسطة تقييد الإشارة (`requireMention`، `/activation`).

</Note>

التدفق السريع (ما يحدث لرسالة مجموعة):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## الردود المرئية

بالنسبة إلى غرف المجموعات/القنوات، يضبط OpenClaw الافتراضي على `messages.groupChat.visibleReplies: "message_tool"`.
يعني ذلك أن الوكيل لا يزال يعالج الدور ويمكنه تحديث حالة الذاكرة/الجلسة، لكن إجابته النهائية العادية لا تُنشر تلقائيًا في الغرفة. للتحدث بشكل مرئي، يستخدم الوكيل `message(action=send)`.

إذا كانت أداة الرسائل غير متاحة ضمن سياسة الأدوات النشطة، يعود OpenClaw إلى الردود المرئية التلقائية بدلًا من كتم الاستجابة بصمت.
يحذّر `openclaw doctor` من عدم التطابق هذا.

بالنسبة إلى المحادثات المباشرة وأي دور مصدر آخر، استخدم `messages.visibleReplies: "message_tool"` لتطبيق سلوك الرد المرئي المعتمد على الأداة فقط عالميًا. يظل `messages.groupChat.visibleReplies` التجاوز الأكثر تحديدًا لغرف المجموعات/القنوات.

يستبدل هذا النمط القديم المتمثل في إجبار النموذج على الإجابة بـ `NO_REPLY` لمعظم أدوار وضع الترقب. في وضع الأداة فقط، يعني عدم فعل شيء مرئي ببساطة عدم استدعاء أداة الرسائل.

تظل مؤشرات الكتابة تُرسل أثناء عمل الوكيل في وضع الأداة فقط. تتم ترقية وضع الكتابة الافتراضي للمجموعات من "message" إلى "instant" لهذه الأدوار لأنه قد لا يوجد نص رسالة مساعد عادي قبل أن يقرر الوكيل ما إذا كان سيستدعي أداة الرسائل. لا يزال إعداد وضع الكتابة الصريح هو الأعلى أولوية.

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

يعيد Gateway تحميل إعدادات `messages` فورًا بعد حفظ الملف. أعد التشغيل فقط عندما تكون مراقبة الملفات أو إعادة تحميل الإعدادات معطّلة في النشر.

لاشتراط مرور الإخراج المرئي عبر أداة الرسائل لكل محادثة مصدر:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

تتجاوز أوامر الشرطة المائلة الأصلية (Discord وTelegram والواجهات الأخرى التي تدعم الأوامر الأصلية) `visibleReplies: "message_tool"` وترد دائمًا بشكل مرئي حتى تحصل واجهة أوامر القناة الأصلية على الاستجابة التي تتوقعها. ينطبق هذا على أدوار الأوامر الأصلية المتحقق منها فقط؛ أما أوامر `/...` المكتوبة نصيًا وأدوار الدردشة العادية فتظل تتبع الافتراضي المضبوط للمجموعة.

## رؤية السياق وقوائم السماح

يوجد عنصران مختلفان للتحكم في سلامة المجموعات:

- **تفويض التشغيل**: من يستطيع تشغيل الوكيل (`groupPolicy`، `groups`، `groupAllowFrom`، قوائم السماح الخاصة بالقناة).
- **رؤية السياق**: ما السياق التكميلي الذي يُحقن في النموذج (نص الرد، الاقتباسات، سجل السلسلة، بيانات التعريف المعاد توجيهها).

افتراضيًا، يعطي OpenClaw الأولوية لسلوك الدردشة العادي ويحافظ على السياق غالبًا كما تم استلامه. يعني هذا أن قوائم السماح تحدد أساسًا من يستطيع تشغيل الإجراءات، وليست حدًا شاملًا للتنقيح لكل مقتطف مقتبس أو تاريخي.

<AccordionGroup>
  <Accordion title="السلوك الحالي خاص بكل قناة">
    - تطبق بعض القنوات بالفعل تصفية قائمة على المرسل للسياق التكميلي في مسارات محددة (مثل تمهيد سلاسل Slack وعمليات بحث الرد/السلسلة في Matrix).
    - لا تزال قنوات أخرى تمرر سياق الاقتباس/الرد/إعادة التوجيه كما تم استلامه.

  </Accordion>
  <Accordion title="اتجاه التقوية (مخطط)">
    - يحافظ `contextVisibility: "all"` (الافتراضي) على السلوك الحالي كما تم استلامه.
    - يرشح `contextVisibility: "allowlist"` السياق التكميلي إلى المرسلين المدرجين في قائمة السماح.
    - يكون `contextVisibility: "allowlist_quote"` هو `allowlist` مع استثناء اقتباس/رد صريح واحد.

    إلى أن يتم تنفيذ نموذج التقوية هذا باتساق عبر القنوات، توقّع وجود اختلافات حسب الواجهة.

  </Accordion>
</AccordionGroup>

![تدفق رسائل المجموعة](/images/groups-flow.svg)

إذا كنت تريد...

| الهدف                                         | ما يجب ضبطه                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| السماح بكل المجموعات مع الرد فقط عند @الإشارات | `groups: { "*": { requireMention: true } }`                |
| تعطيل كل ردود المجموعات                    | `groupPolicy: "disabled"`                                  |
| مجموعات محددة فقط                         | `groups: { "<group-id>": { ... } }` (بدون مفتاح `"*"` key)         |
| أنت فقط تستطيع التشغيل في المجموعات               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## مفاتيح الجلسات

- تستخدم جلسات المجموعات مفاتيح جلسات `agent:<agentId>:<channel>:group:<id>` (تستخدم الغرف/القنوات `agent:<agentId>:<channel>:channel:<id>`).
- تضيف موضوعات منتديات Telegram `:topic:<threadId>` إلى معرّف المجموعة بحيث يكون لكل موضوع جلسته الخاصة.
- تستخدم المحادثات المباشرة الجلسة الرئيسية (أو جلسة لكل مرسل إذا تم ضبط ذلك).
- يتم تخطي Heartbeats لجلسات المجموعات.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## النمط: رسائل مباشرة شخصية + مجموعات عامة (وكيل واحد)

نعم، يعمل هذا جيدًا إذا كانت حركة مرورك "الشخصية" هي **رسائل مباشرة** وكانت حركة مرورك "العامة" هي **مجموعات**.

السبب: في وضع الوكيل الواحد، تصل الرسائل المباشرة عادةً إلى مفتاح الجلسة **الرئيسي** (`agent:main:main`)، بينما تستخدم المجموعات دائمًا مفاتيح جلسات **غير رئيسية** (`agent:main:<channel>:group:<id>`). إذا فعّلت العزل باستخدام `mode: "non-main"`، تعمل جلسات المجموعات هذه في واجهة العزل الخلفية المضبوطة بينما تبقى جلسة الرسائل المباشرة الرئيسية على المضيف. Docker هو الواجهة الخلفية الافتراضية إذا لم تختر واحدة.

يمنحك هذا "عقل" وكيل واحد (مساحة عمل + ذاكرة مشتركة)، لكن بوضعَي تنفيذ:

- **الرسائل المباشرة**: أدوات كاملة (المضيف)
- **المجموعات**: عزل + أدوات مقيّدة

<Note>
إذا كنت تحتاج إلى مساحات عمل/شخصيات منفصلة حقًا (يجب ألا تختلط "الشخصية" و"العامة" أبدًا)، فاستخدم وكيلاً ثانيًا + ربطًا. راجع [توجيه الوكلاء المتعددين](/ar/concepts/multi-agent).
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
- تفاصيل ربط التحميل: [العزل](/ar/gateway/sandboxing#custom-bind-mounts)

## تسميات العرض

- تستخدم تسميات واجهة المستخدم `displayName` عند توفره، منسقًا بالشكل `<channel>:<token>`.
- يُحجز `#room` للغرف/القنوات؛ تستخدم المحادثات الجماعية `g-<slug>` (أحرف صغيرة، المسافات -> `-`، مع إبقاء `#@+._-`).

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
| `"open"`      | تتجاوز المجموعات قوائم السماح؛ يظل تقييد الإشارة مطبقًا.      |
| `"disabled"`  | حظر كل رسائل المجموعات بالكامل.                           |
| `"allowlist"` | السماح فقط بالمجموعات/الغرف التي تطابق قائمة السماح المضبوطة. |

<AccordionGroup>
  <Accordion title="ملاحظات لكل قناة">
    - `groupPolicy` منفصل عن تقييد الإشارة (الذي يتطلب @إشارات).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: استخدم `groupAllowFrom` (الاحتياطي: `allowFrom` صريح).
    - Signal: يمكن أن يطابق `groupAllowFrom` إما معرّف مجموعة Signal الوارد أو هاتف/UUID المرسل.
    - تنطبق موافقات إقران الرسائل المباشرة (إدخالات متجر `*-allowFrom`) على وصول الرسائل المباشرة فقط؛ يظل تفويض مرسل المجموعة صريحًا لقوائم السماح الخاصة بالمجموعات.
    - Discord: تستخدم قائمة السماح `channels.discord.guilds.<id>.channels`.
    - Slack: تستخدم قائمة السماح `channels.slack.channels`.
    - Matrix: تستخدم قائمة السماح `channels.matrix.groups`. فضّل معرّفات الغرف أو الأسماء المستعارة؛ البحث عن أسماء الغرف المنضم إليها هو أفضل جهد، ويتم تجاهل الأسماء غير المحلولة في وقت التشغيل. استخدم `channels.matrix.groupAllowFrom` لتقييد المرسلين؛ كما يتم دعم قوائم السماح `users` لكل غرفة.
    - يتم التحكم في الرسائل المباشرة الجماعية بشكل منفصل (`channels.discord.dm.*`، `channels.slack.dm.*`).
    - يمكن لقائمة سماح Telegram مطابقة معرّفات المستخدمين (`"123456789"`، `"telegram:123456789"`، `"tg:123456789"`) أو أسماء المستخدمين (`"@alice"` أو `"alice"`); البادئات غير حساسة لحالة الأحرف.
    - الافتراضي هو `groupPolicy: "allowlist"`؛ إذا كانت قائمة سماح المجموعات فارغة، يتم حظر رسائل المجموعات.
    - أمان وقت التشغيل: عندما تكون كتلة المزوّد مفقودة بالكامل (`channels.<provider>` غائبة)، تعود سياسة المجموعات إلى وضع مغلق عند الفشل (عادةً `allowlist`) بدلًا من وراثة `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

النموذج الذهني السريع (ترتيب التقييم لرسائل المجموعات):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (مفتوح/معطّل/قائمة السماح).
  </Step>
  <Step title="قوائم سماح المجموعات">
    قوائم سماح المجموعات (`*.groups`، و`*.groupAllowFrom`، وقائمة السماح الخاصة بالقناة).
  </Step>
  <Step title="بوابة الإشارة">
    بوابة الإشارة (`requireMention`، و`/activation`).
  </Step>
</Steps>

## بوابة الإشارة (الافتراضي)

تتطلب رسائل المجموعات إشارة ما لم يتم تجاوز ذلك لكل مجموعة. توجد الإعدادات الافتراضية لكل نظام فرعي ضمن `*.groups."*"`.

يُحتسب الرد على رسالة bot كإشارة ضمنية عندما تدعم القناة بيانات تعريف الرد. ويمكن أن يُحتسب اقتباس رسالة bot أيضًا كإشارة ضمنية في القنوات التي تكشف بيانات تعريف الاقتباس. تشمل الحالات المضمنة الحالية Telegram، وWhatsApp، وSlack، وDiscord، وMicrosoft Teams، وZaloUser.

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
    - `mentionPatterns` هي أنماط regex آمنة وغير حساسة لحالة الأحرف؛ يتم تجاهل الأنماط غير الصالحة وصيغ التكرار المتداخلة غير الآمنة.
    - الأسطح التي توفر إشارات صريحة لا تزال تمر؛ الأنماط هي مسار احتياطي.
    - تجاوز لكل وكيل: `agents.list[].groupChat.mentionPatterns` (مفيد عندما يتشارك عدة وكلاء مجموعة واحدة).
    - لا تُفرض بوابة الإشارة إلا عندما يكون اكتشاف الإشارة ممكنًا (تكون الإشارات الأصلية أو `mentionPatterns` مهيأة).
    - لا يؤدي وضع مجموعة أو مُرسل في قائمة السماح إلى تعطيل بوابة الإشارة؛ اضبط `requireMention` لتلك المجموعة على `false` عندما يجب أن تؤدي كل الرسائل إلى التشغيل.
    - يحمل سياق مطالبة دردشة المجموعة تعليمة الرد الصامت المحلولة في كل دورة؛ يجب ألا تكرر ملفات مساحة العمل آليات `NO_REPLY`.
    - تعامل المجموعات التي يُسمح فيها بالردود الصامتة دورات النموذج النظيفة الفارغة أو ذات التفكير فقط على أنها صامتة، بما يعادل `NO_REPLY`. تفعل الدردشات المباشرة الأمر نفسه فقط عندما تكون الردود الصامتة المباشرة مسموحًا بها صراحة؛ وإلا تبقى الردود الفارغة دورات وكيل فاشلة.
    - توجد افتراضيات Discord في `channels.discord.guilds."*"` (قابلة للتجاوز لكل خادم/قناة).
    - يُغلّف سياق سجل المجموعة بشكل موحّد عبر القنوات وهو **للمعلّق فقط** (الرسائل التي تم تخطيها بسبب بوابة الإشارة)؛ استخدم `messages.groupChat.historyLimit` للإعداد الافتراضي العام و`channels.<channel>.historyLimit` (أو `channels.<channel>.accounts.*.historyLimit`) للتجاوزات. اضبطه على `0` للتعطيل.

  </Accordion>
</AccordionGroup>

## قيود أدوات المجموعة/القناة (اختياري)

تدعم بعض إعدادات القنوات تقييد الأدوات المتاحة **داخل مجموعة/غرفة/قناة محددة**.

- `tools`: السماح بالأدوات أو حظرها للمجموعة كلها.
- `toolsBySender`: تجاوزات لكل مُرسل داخل المجموعة. استخدم بادئات مفاتيح صريحة: `id:<senderId>`، و`e164:<phone>`، و`username:<handle>`، و`name:<displayName>`، وحرف البدل `"*"`. لا تزال المفاتيح القديمة غير المسبوقة مقبولة وتطابق كـ `id:` فقط.

ترتيب الحل (الأكثر تحديدًا يفوز):

<Steps>
  <Step title="أدوات المجموعة حسب المُرسل">
    تطابق `toolsBySender` للمجموعة/القناة.
  </Step>
  <Step title="أدوات المجموعة">
    `tools` للمجموعة/القناة.
  </Step>
  <Step title="الأدوات الافتراضية حسب المُرسل">
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
تُطبّق قيود أدوات المجموعة/القناة بالإضافة إلى سياسة الأدوات العامة/الخاصة بالوكيل (لا يزال الحظر يفوز). تستخدم بعض القنوات بنية تداخل مختلفة للغرف/القنوات (مثل Discord `guilds.*.channels.*`، وSlack `channels.*`، وMicrosoft Teams `teams.*.channels.*`).
</Note>

## قوائم سماح المجموعات

عند تهيئة `channels.whatsapp.groups` أو `channels.telegram.groups` أو `channels.imessage.groups`، تعمل المفاتيح كقائمة سماح للمجموعات. استخدم `"*"` للسماح بكل المجموعات مع الاستمرار في ضبط سلوك الإشارة الافتراضي.

<Warning>
التباس شائع: موافقة إقران الرسائل المباشرة ليست مثل تفويض المجموعة. في القنوات التي تدعم إقران الرسائل المباشرة، يفتح مخزن الإقران الرسائل المباشرة فقط. لا تزال أوامر المجموعة تتطلب تفويضًا صريحًا لمُرسل المجموعة من قوائم سماح الإعدادات مثل `groupAllowFrom` أو مسار الاحتياط الموثق للإعدادات لتلك القناة.
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

يُحدد المالك بواسطة `channels.whatsapp.allowFrom` (أو E.164 الذاتي الخاص بـ bot عند عدم ضبطه). أرسل الأمر كرسالة مستقلة. تتجاهل الأسطح الأخرى حاليًا `/activation`.

## حقول السياق

تضبط حمولات المجموعات الواردة:

- `ChatType=group`
- `GroupSubject` (إذا كان معروفًا)
- `GroupMembers` (إذا كان معروفًا)
- `WasMentioned` (نتيجة بوابة الإشارة)
- تتضمن مواضيع منتديات Telegram أيضًا `MessageThreadId` و`IsForum`.

ملاحظات خاصة بالقنوات:

- يمكن لـ BlueBubbles اختياريًا إثراء مشاركي مجموعات macOS غير المسمّين من قاعدة بيانات جهات الاتصال المحلية قبل ملء `GroupMembers`. يكون هذا متوقفًا افتراضيًا ولا يعمل إلا بعد اجتياز بوابة المجموعة العادية.

تتضمن مطالبة نظام الوكيل مقدمة مجموعة في الدورة الأولى لجلسة مجموعة جديدة. تذكّر النموذج بأن يرد مثل الإنسان، ويتجنب جداول Markdown، ويقلل الأسطر الفارغة ويتبع تباعد الدردشة الطبيعي، ويتجنب كتابة تسلسلات `\n` حرفية. تُعرض أسماء المجموعات وتسميات المشاركين الآتية من القناة كبيانات تعريف غير موثوقة مسيجة، لا كتعليمات نظام مضمنة.

## تفاصيل iMessage

- فضّل `chat_id:<id>` عند التوجيه أو وضعه في قائمة السماح.
- سرد الدردشات: `imsg chats --limit 20`.
- تعود ردود المجموعات دائمًا إلى نفس `chat_id`.

## مطالبات نظام WhatsApp

راجع [WhatsApp](/ar/channels/whatsapp#system-prompts) لقواعد مطالبة نظام WhatsApp المرجعية، بما في ذلك حل مطالبات المجموعة والمباشرة، وسلوك أحرف البدل، ودلالات تجاوز الحساب.

## تفاصيل WhatsApp

راجع [رسائل المجموعات](/ar/channels/group-messages) للسلوك الخاص بـ WhatsApp فقط (حقن السجل، وتفاصيل معالجة الإشارة).

## ذات صلة

- [مجموعات البث](/ar/channels/broadcast-groups)
- [توجيه القنوات](/ar/channels/channel-routing)
- [رسائل المجموعات](/ar/channels/group-messages)
- [الإقران](/ar/channels/pairing)

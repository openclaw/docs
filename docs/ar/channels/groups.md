---
read_when:
    - تغيير سلوك الدردشة الجماعية أو تقييد الإشارات
sidebarTitle: Groups
summary: سلوك الدردشة الجماعية عبر الواجهات (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: المجموعات
x-i18n:
    generated_at: "2026-04-30T07:40:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 743dc1ce1a0e5dc5c6d66091854cdcbb8d2b8f7e06b5c1d13c272142265fc998
    source_path: channels/groups.md
    workflow: 16
---

يعامل OpenClaw الدردشات الجماعية بشكل متسق عبر الأسطح: Discord، iMessage، Matrix، Microsoft Teams، Signal، Slack، Telegram، WhatsApp، Zalo.

## مقدمة للمبتدئين (دقيقتان)

"يعيش" OpenClaw على حسابات المراسلة الخاصة بك. لا يوجد مستخدم بوت WhatsApp منفصل. إذا كنت **أنت** في مجموعة، يمكن لـ OpenClaw رؤية تلك المجموعة والرد فيها.

السلوك الافتراضي:

- المجموعات مقيدة (`groupPolicy: "allowlist"`).
- تتطلب الردود إشارة ما لم تعطّل بوابة الإشارات صراحة.
- الردود النهائية العادية في المجموعات/القنوات تكون خاصة افتراضيًا. يستخدم إخراج الغرفة المرئي أداة `message`.

الترجمة: يمكن للمرسلين الموجودين في قائمة السماح تشغيل OpenClaw عبر الإشارة إليه.

<Note>
**الخلاصة**

- يتم التحكم في **وصول الرسائل المباشرة** بواسطة `*.allowFrom`.
- يتم التحكم في **وصول المجموعات** بواسطة `*.groupPolicy` + قوائم السماح (`*.groups`، `*.groupAllowFrom`).
- يتم التحكم في **تشغيل الردود** بواسطة بوابة الإشارات (`requireMention`، `/activation`).

</Note>

التدفق السريع (ما يحدث لرسالة مجموعة):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## الردود المرئية

بالنسبة لغرف المجموعات/القنوات، يستخدم OpenClaw افتراضيًا `messages.groupChat.visibleReplies: "message_tool"`.
يعني ذلك أن الوكيل ما زال يعالج الدور ويمكنه تحديث حالة الذاكرة/الجلسة، لكن إجابته النهائية العادية لا تُنشر تلقائيًا مرة أخرى في الغرفة. للتحدث بشكل مرئي، يستخدم الوكيل `message(action=send)`.

بالنسبة للدردشات المباشرة وأي دور مصدر آخر، استخدم `messages.visibleReplies: "message_tool"` لتطبيق سلوك الرد المرئي المعتمد على الأداة فقط عالميًا. يظل `messages.groupChat.visibleReplies` هو التجاوز الأكثر تحديدًا لغرف المجموعات/القنوات.

يستبدل هذا النمط القديم الذي كان يفرض على النموذج الإجابة بـ `NO_REPLY` لمعظم أدوار وضع المراقبة. في وضع الأداة فقط، يعني عدم فعل أي شيء مرئي ببساطة عدم استدعاء أداة الرسائل.

ما تزال مؤشرات الكتابة تُرسل أثناء عمل الوكيل في وضع الأداة فقط. تتم ترقية وضع الكتابة الافتراضي للمجموعات من "message" إلى "instant" لهذه الأدوار لأنه قد لا يوجد أي نص رسالة مساعد عادي قبل أن يقرر الوكيل ما إذا كان سيستدعي أداة الرسائل. يظل إعداد وضع الكتابة الصريح هو صاحب الأولوية.

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

لاشتراط مرور الإخراج المرئي عبر أداة الرسائل لكل دردشة مصدر:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

تتجاوز أوامر الشرطة المائلة الأصلية (Discord وTelegram والأسطح الأخرى التي تدعم الأوامر الأصلية) إعداد `visibleReplies: "message_tool"` وترد دائمًا بشكل مرئي حتى تحصل واجهة أوامر القناة الأصلية على الاستجابة المتوقعة. ينطبق هذا فقط على أدوار الأوامر الأصلية التي تم التحقق منها؛ أما أوامر `/...` المكتوبة نصيًا وأدوار الدردشة العادية فما زالت تتبع الإعداد الافتراضي المكوّن للمجموعة.

## رؤية السياق وقوائم السماح

هناك عنصران مختلفان للتحكم في سلامة المجموعات:

- **تفويض التشغيل**: من يمكنه تشغيل الوكيل (`groupPolicy`، `groups`، `groupAllowFrom`، قوائم السماح الخاصة بالقنوات).
- **رؤية السياق**: ما السياق التكميلي الذي يُحقن في النموذج (نص الرد، الاقتباسات، سجل السلاسل، بيانات إعادة التوجيه الوصفية).

افتراضيًا، يعطي OpenClaw الأولوية لسلوك الدردشة الطبيعي ويحافظ على السياق غالبًا كما ورد. يعني هذا أن قوائم السماح تحدد أساسًا من يمكنه تشغيل الإجراءات، وليست حدًا عامًا للتنقيح لكل مقتطف مقتبس أو تاريخي.

<AccordionGroup>
  <Accordion title="السلوك الحالي خاص بكل قناة">
    - تطبق بعض القنوات بالفعل تصفية قائمة على المرسل للسياق التكميلي في مسارات محددة (مثل تهيئة سلاسل Slack، وعمليات البحث عن الردود/السلاسل في Matrix).
    - ما تزال قنوات أخرى تمرر سياق الاقتباس/الرد/إعادة التوجيه كما ورد.

  </Accordion>
  <Accordion title="اتجاه التقوية (مخطط)">
    - يحافظ `contextVisibility: "all"` (الافتراضي) على السلوك الحالي كما ورد.
    - يرشح `contextVisibility: "allowlist"` السياق التكميلي إلى المرسلين الموجودين في قائمة السماح.
    - `contextVisibility: "allowlist_quote"` هو `allowlist` بالإضافة إلى استثناء اقتباس/رد صريح واحد.

    إلى أن يُطبق نموذج التقوية هذا بشكل متسق عبر القنوات، توقع اختلافات حسب السطح.

  </Accordion>
</AccordionGroup>

![تدفق رسالة المجموعة](/images/groups-flow.svg)

إذا كنت تريد...

| الهدف                                         | ما يجب ضبطه                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| السماح لكل المجموعات مع الرد فقط عند إشارات @ | `groups: { "*": { requireMention: true } }`                |
| تعطيل كل ردود المجموعات                    | `groupPolicy: "disabled"`                                  |
| مجموعات محددة فقط                         | `groups: { "<group-id>": { ... } }` (بدون مفتاح `"*"` )         |
| أنت فقط يمكنك التشغيل في المجموعات               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## مفاتيح الجلسات

- تستخدم جلسات المجموعات مفاتيح جلسة `agent:<agentId>:<channel>:group:<id>` (تستخدم الغرف/القنوات `agent:<agentId>:<channel>:channel:<id>`).
- تضيف موضوعات منتديات Telegram الجزء `:topic:<threadId>` إلى معرف المجموعة بحيث يكون لكل موضوع جلسته الخاصة.
- تستخدم الدردشات المباشرة الجلسة الرئيسية (أو جلسة لكل مرسل إذا تم تكوين ذلك).
- يتم تخطي Heartbeats لجلسات المجموعات.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## نمط: الرسائل المباشرة الشخصية + المجموعات العامة (وكيل واحد)

نعم، يعمل هذا جيدًا إذا كانت حركة "الشخصية" لديك هي **رسائل مباشرة** وكانت حركة "العامة" لديك هي **مجموعات**.

السبب: في وضع الوكيل الواحد، تصل الرسائل المباشرة عادة إلى مفتاح الجلسة **الرئيسي** (`agent:main:main`)، بينما تستخدم المجموعات دائمًا مفاتيح جلسات **غير رئيسية** (`agent:main:<channel>:group:<id>`). إذا فعّلت العزل باستخدام `mode: "non-main"`، فستعمل جلسات المجموعات تلك في خلفية العزل المكوّنة بينما تبقى جلسة الرسائل المباشرة الرئيسية على المضيف. Docker هو الخلفية الافتراضية إذا لم تختر واحدة.

يمنحك هذا "عقل" وكيل واحد (مساحة عمل + ذاكرة مشتركتان)، لكن بوضعَي تنفيذ:

- **الرسائل المباشرة**: أدوات كاملة (المضيف)
- **المجموعات**: عزل + أدوات مقيدة

<Note>
إذا كنت تحتاج إلى مساحات عمل/شخصيات منفصلة حقًا (يجب ألا يختلط "الشخصي" و"العام" أبدًا)، فاستخدم وكيلًا ثانيًا + ربطًا. راجع [توجيه وكلاء متعددين](/ar/concepts/multi-agent).
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
  <Tab title="ترى المجموعات مجلدًا واحدًا في قائمة السماح فقط">
    هل تريد أن "تستطيع المجموعات رؤية المجلد X فقط" بدلًا من "عدم وجود وصول إلى المضيف"؟ أبقِ `workspaceAccess: "none"` واربط فقط المسارات الموجودة في قائمة السماح داخل العزل:

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

- مفاتيح التكوين والقيم الافتراضية: [تكوين Gateway](/ar/gateway/config-agents#agentsdefaultssandbox)
- تصحيح سبب حظر أداة: [العزل مقابل سياسة الأدوات مقابل الصلاحيات المرتفعة](/ar/gateway/sandbox-vs-tool-policy-vs-elevated)
- تفاصيل ربط المسارات: [العزل](/ar/gateway/sandboxing#custom-bind-mounts)

## تسميات العرض

- تستخدم تسميات الواجهة `displayName` عند توفره، منسقة كـ `<channel>:<token>`.
- `#room` محجوز للغرف/القنوات؛ تستخدم دردشات المجموعات `g-<slug>` (أحرف صغيرة، المسافات -> `-`، مع إبقاء `#@+._-`).

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
| `"open"`      | تتجاوز المجموعات قوائم السماح؛ ما تزال بوابة الإشارات مطبقة.      |
| `"disabled"`  | حظر كل رسائل المجموعات بالكامل.                           |
| `"allowlist"` | السماح فقط بالمجموعات/الغرف التي تطابق قائمة السماح المكوّنة. |

<AccordionGroup>
  <Accordion title="ملاحظات لكل قناة">
    - `groupPolicy` منفصل عن بوابة الإشارات (التي تتطلب إشارات @).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: استخدم `groupAllowFrom` (الاحتياطي: `allowFrom` الصريح).
    - تنطبق موافقات اقتران الرسائل المباشرة (إدخالات مخزن `*-allowFrom`) على وصول الرسائل المباشرة فقط؛ يبقى تفويض مرسلي المجموعات صريحًا في قوائم سماح المجموعات.
    - Discord: تستخدم قائمة السماح `channels.discord.guilds.<id>.channels`.
    - Slack: تستخدم قائمة السماح `channels.slack.channels`.
    - Matrix: تستخدم قائمة السماح `channels.matrix.groups`. فضّل معرفات الغرف أو الأسماء المستعارة؛ البحث عن أسماء الغرف المنضم إليها يتم بأفضل جهد، ويتم تجاهل الأسماء غير المحلولة وقت التشغيل. استخدم `channels.matrix.groupAllowFrom` لتقييد المرسلين؛ وتُدعم أيضًا قوائم سماح `users` لكل غرفة.
    - يتم التحكم في الرسائل المباشرة الجماعية بشكل منفصل (`channels.discord.dm.*`، `channels.slack.dm.*`).
    - يمكن لقائمة سماح Telegram مطابقة معرفات المستخدمين (`"123456789"`، `"telegram:123456789"`، `"tg:123456789"`) أو أسماء المستخدمين (`"@alice"` أو `"alice"`); البادئات غير حساسة لحالة الأحرف.
    - الافتراضي هو `groupPolicy: "allowlist"`؛ إذا كانت قائمة سماح المجموعات لديك فارغة، فسيتم حظر رسائل المجموعات.
    - سلامة وقت التشغيل: عندما تكون كتلة مزود مفقودة بالكامل (`channels.<provider>` غير موجودة)، تعود سياسة المجموعات إلى وضع مغلق عند الفشل (عادة `allowlist`) بدلًا من وراثة `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

النموذج الذهني السريع (ترتيب التقييم لرسائل المجموعات):

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

تتطلب رسائل المجموعات إشارة ما لم يتم تجاوز ذلك لكل مجموعة. توجد القيم الافتراضية لكل نظام فرعي تحت `*.groups."*"`.

تُحتسب الردود على رسالة bot كإشارة ضمنية عندما تدعم القناة بيانات تعريف الرد. ويمكن أيضًا أن يُحتسب اقتباس رسالة bot كإشارة ضمنية في القنوات التي تكشف بيانات تعريف الاقتباس. تشمل الحالات المدمجة الحالية Telegram وWhatsApp وSlack وDiscord وMicrosoft Teams وZaloUser.

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
    - أنماط `mentionPatterns` هي أنماط regex آمنة وغير حساسة لحالة الأحرف؛ يتم تجاهل الأنماط غير الصالحة وصيغ التكرار المتداخلة غير الآمنة.
    - الأسطح التي توفر إشارات صريحة تظل تمر؛ الأنماط مجرد خيار احتياطي.
    - تجاوز لكل agent: `agents.list[].groupChat.mentionPatterns` (مفيد عندما يشارك عدة agents مجموعة واحدة).
    - لا تُفرض بوابة الإشارة إلا عندما يكون اكتشاف الإشارة ممكنًا (إشارات أصلية أو تم تكوين `mentionPatterns`).
    - يحمل سياق موجه دردشة المجموعة تعليمة الرد الصامت التي تم حلها في كل دور؛ يجب ألا تكرر ملفات مساحة العمل آليات `NO_REPLY`.
    - المجموعات التي يُسمح فيها بالردود الصامتة تتعامل مع أدوار النموذج الفارغة النظيفة أو التي تحتوي على الاستدلال فقط على أنها صامتة، بما يعادل `NO_REPLY`. تفعل الدردشات المباشرة الشيء نفسه فقط عندما يُسمح صراحةً بالردود المباشرة الصامتة؛ وإلا تظل الردود الفارغة أدوار agent فاشلة.
    - توجد إعدادات Discord الافتراضية في `channels.discord.guilds."*"` (قابلة للتجاوز لكل guild/channel).
    - يُغلّف سياق سجل المجموعة بشكل موحد عبر القنوات وهو **معلّق فقط** (الرسائل التي تم تخطيها بسبب بوابة الإشارة)؛ استخدم `messages.groupChat.historyLimit` للإعداد الافتراضي العام و`channels.<channel>.historyLimit` (أو `channels.<channel>.accounts.*.historyLimit`) للتجاوزات. اضبطه على `0` للتعطيل.

  </Accordion>
</AccordionGroup>

## قيود أدوات المجموعة/القناة (اختياري)

تدعم بعض إعدادات القنوات تقييد الأدوات المتاحة **داخل مجموعة/غرفة/قناة محددة**.

- `tools`: السماح بالأدوات أو منعها للمجموعة كلها.
- `toolsBySender`: تجاوزات لكل مرسل داخل المجموعة. استخدم بادئات مفاتيح صريحة: `id:<senderId>` و`e164:<phone>` و`username:<handle>` و`name:<displayName>` وحرف البدل `"*"`. لا تزال المفاتيح القديمة غير المسبوقة مقبولة وتُطابق كـ `id:` فقط.

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
تُطبّق قيود أدوات المجموعة/القناة بالإضافة إلى سياسة الأدوات العامة/الخاصة بالـ agent (لا يزال المنع هو الغالب). تستخدم بعض القنوات تداخلاً مختلفًا للغرف/القنوات (مثل Discord `guilds.*.channels.*` وSlack `channels.*` وMicrosoft Teams `teams.*.channels.*`).
</Note>

## قوائم سماح المجموعات

عند تكوين `channels.whatsapp.groups` أو `channels.telegram.groups` أو `channels.imessage.groups`، تعمل المفاتيح كقائمة سماح للمجموعات. استخدم `"*"` للسماح بكل المجموعات مع الاستمرار في تعيين سلوك الإشارة الافتراضي.

<Warning>
لبس شائع: موافقة إقران الرسائل المباشرة ليست هي نفسها تخويل المجموعة. بالنسبة إلى القنوات التي تدعم إقران الرسائل المباشرة، لا يفتح مخزن الإقران إلا الرسائل المباشرة. لا تزال أوامر المجموعات تتطلب تخويلًا صريحًا لمرسل المجموعة من قوائم السماح في الإعدادات مثل `groupAllowFrom` أو خيار الإعداد الاحتياطي الموثق لتلك القناة.
</Warning>

الأهداف الشائعة (انسخ/الصق):

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

يُحدد المالك بواسطة `channels.whatsapp.allowFrom` (أو E.164 الخاص بالـ bot نفسه عند عدم ضبطه). أرسل الأمر كرسالة مستقلة. تتجاهل الأسطح الأخرى حاليًا `/activation`.

## حقول السياق

تعيّن الحمولات الواردة من المجموعات:

- `ChatType=group`
- `GroupSubject` (إذا كان معروفًا)
- `GroupMembers` (إذا كان معروفًا)
- `WasMentioned` (نتيجة بوابة الإشارة)
- تتضمن مواضيع منتدى Telegram أيضًا `MessageThreadId` و`IsForum`.

ملاحظات خاصة بالقنوات:

- يمكن لـ BlueBubbles اختياريًا إثراء مشاركي مجموعات macOS غير المسمّين من قاعدة بيانات Contacts المحلية قبل ملء `GroupMembers`. يكون هذا متوقفًا افتراضيًا ولا يعمل إلا بعد اجتياز بوابة المجموعة العادية.

يتضمن موجه نظام agent مقدمة للمجموعة في الدور الأول من جلسة مجموعة جديدة. يذكّر النموذج بالرد كإنسان، وتجنب جداول Markdown، وتقليل الأسطر الفارغة واتباع تباعد الدردشة الطبيعي، وتجنب كتابة تسلسلات `\n` حرفيًا. تُعرض أسماء المجموعات وتسميات المشاركين القادمة من القنوات كبيانات تعريف غير موثوقة داخل أسوار، وليست كتعليمات نظام مضمنة.

## تفاصيل iMessage

- فضّل `chat_id:<id>` عند التوجيه أو الإدراج في قائمة السماح.
- سرد الدردشات: `imsg chats --limit 20`.
- تعود ردود المجموعة دائمًا إلى `chat_id` نفسه.

## موجهات نظام WhatsApp

راجع [WhatsApp](/ar/channels/whatsapp#system-prompts) للاطلاع على قواعد موجه نظام WhatsApp المرجعية، بما في ذلك حل موجهات المجموعة والمباشرة، وسلوك أحرف البدل، ودلالات تجاوز الحساب.

## تفاصيل WhatsApp

راجع [رسائل المجموعات](/ar/channels/group-messages) للسلوك الخاص بـ WhatsApp فقط (حقن السجل، تفاصيل التعامل مع الإشارات).

## ذات صلة

- [مجموعات البث](/ar/channels/broadcast-groups)
- [توجيه القنوات](/ar/channels/channel-routing)
- [رسائل المجموعات](/ar/channels/group-messages)
- [الإقران](/ar/channels/pairing)

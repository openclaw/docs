---
read_when:
    - تغيير سلوك الدردشة الجماعية أو اشتراط الإشارة
sidebarTitle: Groups
summary: سلوك الدردشات الجماعية عبر الواجهات (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: المجموعات
x-i18n:
    generated_at: "2026-05-02T07:17:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5cc33dbbcf5504cae5caa003b7427d99f5c1a2d7c850dedd5d1f58a2fe44fa04
    source_path: channels/groups.md
    workflow: 16
---

يعامل OpenClaw محادثات المجموعات باتساق عبر الأسطح: Discord، iMessage، Matrix، Microsoft Teams، Signal، Slack، Telegram، WhatsApp، Zalo.

## مقدمة للمبتدئين (دقيقتان)

"يعيش" OpenClaw على حسابات المراسلة الخاصة بك. لا يوجد مستخدم بوت WhatsApp منفصل. إذا كنت **أنت** في مجموعة، يمكن لـ OpenClaw رؤية تلك المجموعة والرد فيها.

السلوك الافتراضي:

- المجموعات مقيّدة (`groupPolicy: "allowlist"`).
- تتطلب الردود إشارة إلا إذا عطّلت صراحةً بوابة الإشارة.
- الردود النهائية العادية في المجموعات/القنوات خاصة افتراضيًا. يستخدم إخراج الغرفة المرئي أداة `message`.

الترجمة: يمكن للمرسلين الموجودين في قائمة السماح تشغيل OpenClaw عبر الإشارة إليه.

<Note>
**الخلاصة**

- **الوصول عبر الرسائل المباشرة** يتحكم فيه `*.allowFrom`.
- **الوصول عبر المجموعات** يتحكم فيه `*.groupPolicy` + قوائم السماح (`*.groups`، `*.groupAllowFrom`).
- **تشغيل الرد** تتحكم فيه بوابة الإشارة (`requireMention`، `/activation`).

</Note>

التدفق السريع (ما يحدث لرسالة مجموعة):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## الردود المرئية

بالنسبة لغرف المجموعات/القنوات، يضبط OpenClaw الافتراضي على `messages.groupChat.visibleReplies: "message_tool"`.
يعني ذلك أن الوكيل لا يزال يعالج الدور ويمكنه تحديث حالة الذاكرة/الجلسة، لكن إجابته النهائية العادية لا تُنشر تلقائيًا مرة أخرى في الغرفة. للتحدث بشكل مرئي، يستخدم الوكيل `message(action=send)`.

إذا كانت أداة الرسائل غير متاحة ضمن سياسة الأدوات النشطة، يعود OpenClaw إلى الردود المرئية التلقائية بدلًا من كتم الاستجابة بصمت. يحذر `openclaw doctor` من عدم التطابق هذا.

بالنسبة للمحادثات المباشرة وأي دور آخر من المصدر، استخدم `messages.visibleReplies: "message_tool"` لتطبيق سلوك الرد المرئي عبر الأداة فقط نفسه عالميًا. يمكن للبيئات الاختبارية أيضًا اختيار هذا كإعدادها الافتراضي غير المعيّن؛ تفعل بيئة Codex ذلك للمحادثات المباشرة في وضع Codex. يظل `messages.groupChat.visibleReplies` هو التجاوز الأكثر تحديدًا لغرف المجموعات/القنوات.

يستبدل هذا النمط القديم الذي كان يجبر النموذج على الإجابة بـ `NO_REPLY` لمعظم أدوار وضع المراقبة الصامتة. في وضع الأداة فقط، يعني عدم فعل أي شيء مرئي ببساطة عدم استدعاء أداة الرسائل.

تظل مؤشرات الكتابة تُرسل أثناء عمل الوكيل في وضع الأداة فقط. تتم ترقية وضع الكتابة الافتراضي للمجموعة من "message" إلى "instant" لهذه الأدوار لأنه قد لا يوجد أبدًا نص رسالة مساعد عادي قبل أن يقرر الوكيل ما إذا كان سيستدعي أداة الرسائل. لا يزال إعداد وضع الكتابة الصريح هو صاحب الأولوية.

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

يعيد Gateway تحميل إعدادات `messages` تحميلًا ساخنًا بعد حفظ الملف. أعد التشغيل فقط عندما تكون مراقبة الملفات أو إعادة تحميل الإعدادات معطلة في النشر.

لاشتراط مرور الإخراج المرئي عبر أداة الرسائل لكل محادثة مصدر:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

تتجاوز أوامر الشرطة المائلة الأصلية (Discord وTelegram والأسطح الأخرى التي تدعم الأوامر الأصلية) `visibleReplies: "message_tool"` وترد دائمًا بشكل مرئي حتى تحصل واجهة أوامر القناة الأصلية على الاستجابة التي تتوقعها. ينطبق هذا على أدوار الأوامر الأصلية المتحقق منها فقط؛ أوامر `/...` المكتوبة كنص وأدوار المحادثة العادية لا تزال تتبع الإعداد الافتراضي المكوّن للمجموعة.

## رؤية السياق وقوائم السماح

يوجد عنصران مختلفان للتحكم في أمان المجموعات:

- **تفويض التشغيل**: من يمكنه تشغيل الوكيل (`groupPolicy`، `groups`، `groupAllowFrom`، قوائم السماح الخاصة بالقناة).
- **رؤية السياق**: ما السياق التكميلي الذي يُحقن في النموذج (نص الرد، الاقتباسات، سجل السلسلة، بيانات التعريف المعاد توجيهها).

افتراضيًا، يعطي OpenClaw الأولوية لسلوك المحادثة العادي ويبقي السياق غالبًا كما استُلم. يعني ذلك أن قوائم السماح تحدد أساسًا من يمكنه تشغيل الإجراءات، وليست حدًا عامًا للتنقيح لكل مقتطف مقتبس أو تاريخي.

<AccordionGroup>
  <Accordion title="السلوك الحالي خاص بكل قناة">
    - تطبق بعض القنوات بالفعل ترشيحًا قائمًا على المرسل للسياق التكميلي في مسارات محددة (على سبيل المثال تهيئة سلاسل Slack، وعمليات البحث عن الرد/السلسلة في Matrix).
    - لا تزال قنوات أخرى تمرر سياق الاقتباس/الرد/إعادة التوجيه كما استُلم.

  </Accordion>
  <Accordion title="اتجاه التقوية (مخطط)">
    - يبقي `contextVisibility: "all"` (الافتراضي) السلوك الحالي كما استُلم.
    - يرشح `contextVisibility: "allowlist"` السياق التكميلي إلى المرسلين الموجودين في قائمة السماح.
    - `contextVisibility: "allowlist_quote"` هو `allowlist` بالإضافة إلى استثناء اقتباس/رد صريح واحد.

    إلى أن يُنفذ نموذج التقوية هذا باتساق عبر القنوات، توقع اختلافات حسب السطح.

  </Accordion>
</AccordionGroup>

![تدفق رسالة المجموعة](/images/groups-flow.svg)

إذا كنت تريد...

| الهدف                                         | ما يجب ضبطه                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| السماح بكل المجموعات لكن الرد فقط عند @الإشارات | `groups: { "*": { requireMention: true } }`                |
| تعطيل كل ردود المجموعات                    | `groupPolicy: "disabled"`                                  |
| مجموعات محددة فقط                         | `groups: { "<group-id>": { ... } }` (من دون مفتاح `"*"` )         |
| أنت فقط يمكنك التشغيل في المجموعات               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| إعادة استخدام مجموعة مرسلين موثوقين واحدة عبر القنوات | `groupAllowFrom: ["accessGroup:operators"]`                |

لقوائم السماح القابلة لإعادة الاستخدام للمرسلين، راجع [مجموعات الوصول](/ar/channels/access-groups).

## مفاتيح الجلسة

- تستخدم جلسات المجموعات مفاتيح جلسة `agent:<agentId>:<channel>:group:<id>` (تستخدم الغرف/القنوات `agent:<agentId>:<channel>:channel:<id>`).
- تضيف مواضيع منتديات Telegram ‏`:topic:<threadId>` إلى معرّف المجموعة حتى تكون لكل موضوع جلسته الخاصة.
- تستخدم المحادثات المباشرة الجلسة الرئيسية (أو جلسة لكل مرسل إذا كانت مكوّنة).
- تُتخطى Heartbeats لجلسات المجموعات.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## نمط: رسائل مباشرة شخصية + مجموعات عامة (وكيل واحد)

نعم، يعمل هذا جيدًا إذا كان مرورك "الشخصي" هو **رسائل مباشرة** وكان مرورك "العام" هو **مجموعات**.

السبب: في وضع الوكيل الواحد، تصل الرسائل المباشرة عادةً إلى مفتاح الجلسة **الرئيسي** (`agent:main:main`)، بينما تستخدم المجموعات دائمًا مفاتيح جلسات **غير رئيسية** (`agent:main:<channel>:group:<id>`). إذا فعّلت العزل باستخدام `mode: "non-main"`، تعمل جلسات المجموعات تلك في خلفية العزل المكوّنة بينما تبقى جلسة رسائلك المباشرة الرئيسية على المضيف. Docker هو الخلفية الافتراضية إذا لم تختر واحدة.

يمنحك هذا "عقل" وكيل واحدًا (مساحة عمل + ذاكرة مشتركتان)، لكن وضعي تنفيذ:

- **الرسائل المباشرة**: أدوات كاملة (المضيف)
- **المجموعات**: عزل + أدوات مقيّدة

<Note>
إذا كنت تحتاج إلى مساحات عمل/شخصيات منفصلة حقًا ("الشخصي" و"العام" يجب ألا يختلطا أبدًا)، فاستخدم وكيلًا ثانيًا + ارتباطات. راجع [توجيه متعدد الوكلاء](/ar/concepts/multi-agent).
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
  <Tab title="ترى المجموعات مجلدًا موجودًا في قائمة السماح فقط">
    هل تريد "يمكن للمجموعات رؤية المجلد X فقط" بدلًا من "لا وصول إلى المضيف"؟ أبقِ `workspaceAccess: "none"` وثبّت فقط المسارات الموجودة في قائمة السماح داخل العزل:

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
- تفاصيل تثبيتات الربط: [العزل](/ar/gateway/sandboxing#custom-bind-mounts)

## تسميات العرض

- تستخدم تسميات واجهة المستخدم `displayName` عند توفره، بتنسيق `<channel>:<token>`.
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
| `"open"`      | تتجاوز المجموعات قوائم السماح؛ يظل اشتراط الإشارة مطبقًا.      |
| `"disabled"`  | حظر كل رسائل المجموعات بالكامل.                           |
| `"allowlist"` | السماح فقط بالمجموعات/الغرف التي تطابق قائمة السماح المكوّنة. |

<AccordionGroup>
  <Accordion title="ملاحظات لكل قناة">
    - `groupPolicy` منفصل عن بوابة الإشارة (التي تتطلب @إشارات).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: استخدم `groupAllowFrom` (الاحتياطي: `allowFrom` صريح).
    - Signal: يمكن أن يطابق `groupAllowFrom` إما معرّف مجموعة Signal الوارد أو هاتف/UUID المرسل.
    - تنطبق موافقات اقتران الرسائل المباشرة (إدخالات مخزن `*-allowFrom`) على الوصول عبر الرسائل المباشرة فقط؛ يبقى تفويض مرسل المجموعة صريحًا لقوائم سماح المجموعات.
    - Discord: تستخدم قائمة السماح `channels.discord.guilds.<id>.channels`.
    - Slack: تستخدم قائمة السماح `channels.slack.channels`.
    - Matrix: تستخدم قائمة السماح `channels.matrix.groups`. فضّل معرّفات الغرف أو الأسماء البديلة؛ البحث عن اسم الغرفة المنضم إليها يبذل أفضل جهد، ويتم تجاهل الأسماء غير المحلولة في وقت التشغيل. استخدم `channels.matrix.groupAllowFrom` لتقييد المرسلين؛ قوائم السماح `users` لكل غرفة مدعومة أيضًا.
    - تُدار الرسائل المباشرة الجماعية بشكل منفصل (`channels.discord.dm.*`، `channels.slack.dm.*`).
    - يمكن لقائمة سماح Telegram مطابقة معرّفات المستخدمين (`"123456789"`، `"telegram:123456789"`، `"tg:123456789"`) أو أسماء المستخدمين (`"@alice"` أو `"alice"`); البادئات غير حساسة لحالة الأحرف.
    - الافتراضي هو `groupPolicy: "allowlist"`؛ إذا كانت قائمة سماح مجموعتك فارغة، فستُحظر رسائل المجموعات.
    - أمان وقت التشغيل: عندما تكون كتلة المزوّد مفقودة تمامًا (`channels.<provider>` غير موجود)، تعود سياسة المجموعات إلى وضع مغلق عند الفشل (عادةً `allowlist`) بدلًا من وراثة `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

النموذج الذهني السريع (ترتيب التقييم لرسائل المجموعات):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (مفتوح/معطّل/قائمة سماح).
  </Step>
  <Step title="قوائم سماح المجموعات">
    قوائم سماح المجموعات (`*.groups`، `*.groupAllowFrom`، قائمة السماح الخاصة بالقناة).
  </Step>
  <Step title="تقييد الإشارات">
    تقييد الإشارات (`requireMention`، `/activation`).
  </Step>
</Steps>

## تقييد الإشارات (الإعداد الافتراضي)

تتطلب رسائل المجموعات إشارة ما لم يتم تجاوز ذلك لكل مجموعة. توجد الإعدادات الافتراضية لكل نظام فرعي تحت `*.groups."*"`.

يُحسب الرد على رسالة بوت كإشارة ضمنية عندما تدعم القناة بيانات تعريف الرد. ويمكن أن يُحسب اقتباس رسالة بوت أيضًا كإشارة ضمنية في القنوات التي تعرض بيانات تعريف الاقتباس. تشمل الحالات المضمّنة الحالية Telegram وWhatsApp وSlack وDiscord وMicrosoft Teams وZaloUser.

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
  <Accordion title="ملاحظات تقييد الإشارات">
    - `mentionPatterns` هي أنماط regex آمنة وغير حساسة لحالة الأحرف؛ يتم تجاهل الأنماط غير الصالحة وأشكال التكرار المتداخلة غير الآمنة.
    - الأسطح التي توفر إشارات صريحة لا تزال تمر؛ الأنماط هي خيار احتياطي.
    - تجاوز لكل وكيل: `agents.list[].groupChat.mentionPatterns` (مفيد عندما يتشارك عدة وكلاء مجموعة واحدة).
    - لا يُفرض تقييد الإشارات إلا عندما يكون اكتشاف الإشارة ممكنًا (تم تكوين إشارات أصلية أو `mentionPatterns`).
    - لا يؤدي إدراج مجموعة أو مرسل في قائمة السماح إلى تعطيل تقييد الإشارات؛ اضبط `requireMention` لتلك المجموعة على `false` عندما يجب أن تؤدي كل الرسائل إلى التشغيل.
    - يحمل سياق موجه دردشة المجموعة تعليمة الرد الصامت المحلولة في كل دورة؛ يجب ألا تكرر ملفات مساحة العمل آليات `NO_REPLY`.
    - تعامل المجموعات التي يُسمح فيها بالردود الصامتة دورات النموذج النظيفة الفارغة أو التي تحتوي على استدلال فقط كصامتة، بما يعادل `NO_REPLY`. تفعل الدردشات المباشرة الأمر نفسه فقط عندما يُسمح صراحة بالردود المباشرة الصامتة؛ وإلا تظل الردود الفارغة دورات وكيل فاشلة.
    - توجد إعدادات Discord الافتراضية في `channels.discord.guilds."*"` (قابلة للتجاوز لكل نقابة/قناة).
    - يُغلّف سياق سجل المجموعة بشكل موحّد عبر القنوات وهو **للمعلّق فقط** (الرسائل التي تم تخطيها بسبب تقييد الإشارات)؛ استخدم `messages.groupChat.historyLimit` للإعداد الافتراضي العام و`channels.<channel>.historyLimit` (أو `channels.<channel>.accounts.*.historyLimit`) للتجاوزات. اضبطه على `0` للتعطيل.

  </Accordion>
</AccordionGroup>

## قيود أدوات المجموعة/القناة (اختياري)

تدعم بعض تكوينات القنوات تقييد الأدوات المتاحة **داخل مجموعة/غرفة/قناة محددة**.

- `tools`: السماح بالأدوات أو رفضها للمجموعة كلها.
- `toolsBySender`: تجاوزات لكل مرسل داخل المجموعة. استخدم بادئات مفاتيح صريحة: `id:<senderId>` و`e164:<phone>` و`username:<handle>` و`name:<displayName>` وحرف البدل `"*"`. لا تزال المفاتيح القديمة غير مسبوقة البادئة مقبولة وتُطابق كـ `id:` فقط.

ترتيب الحل (الأكثر تحديدًا يفوز):

<Steps>
  <Step title="toolsBySender للمجموعة">
    تطابق `toolsBySender` للمجموعة/القناة.
  </Step>
  <Step title="أدوات المجموعة">
    `tools` للمجموعة/القناة.
  </Step>
  <Step title="toolsBySender الافتراضي">
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
تُطبّق قيود أدوات المجموعة/القناة بالإضافة إلى سياسة الأدوات العامة/سياسة أدوات الوكيل (يظل الرفض هو الغالب). تستخدم بعض القنوات تداخلاً مختلفًا للغرف/القنوات (مثل Discord `guilds.*.channels.*` وSlack `channels.*` وMicrosoft Teams `teams.*.channels.*`).
</Note>

## قوائم سماح المجموعات

عند تكوين `channels.whatsapp.groups` أو `channels.telegram.groups` أو `channels.imessage.groups`، تعمل المفاتيح كقائمة سماح للمجموعات. استخدم `"*"` للسماح بكل المجموعات مع الاستمرار في ضبط سلوك الإشارة الافتراضي.

<Warning>
التباس شائع: موافقة الاقتران للرسائل المباشرة ليست مماثلة لتخويل المجموعة. بالنسبة للقنوات التي تدعم اقتران الرسائل المباشرة، يفتح مخزن الاقتران الرسائل المباشرة فقط. لا تزال أوامر المجموعة تتطلب تخويلًا صريحًا لمرسل المجموعة من قوائم سماح التكوين مثل `groupAllowFrom` أو خيار الرجوع الموثق لتكوين تلك القناة.
</Warning>

الأغراض الشائعة (انسخ/الصق):

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

يُحدد المالك بواسطة `channels.whatsapp.allowFrom` (أو رقم E.164 الخاص بالبوت نفسه عند عدم ضبطه). أرسل الأمر كرسالة مستقلة. تتجاهل الأسطح الأخرى حاليًا `/activation`.

## حقول السياق

تضبط الحمولات الواردة للمجموعات:

- `ChatType=group`
- `GroupSubject` (إذا كان معروفًا)
- `GroupMembers` (إذا كان معروفًا)
- `WasMentioned` (نتيجة تقييد الإشارات)
- تتضمن موضوعات منتدى Telegram أيضًا `MessageThreadId` و`IsForum`.

ملاحظات خاصة بالقنوات:

- يمكن لـ BlueBubbles اختياريًا إثراء مشاركي مجموعات macOS غير المسمّين من قاعدة بيانات جهات الاتصال المحلية قبل ملء `GroupMembers`. يكون هذا معطلاً افتراضيًا ولا يعمل إلا بعد اجتياز تقييد المجموعة العادي.

يتضمن موجه نظام الوكيل مقدمة مجموعة في الدورة الأولى من جلسة مجموعة جديدة. وهو يذكّر النموذج بالرد مثل إنسان، وتجنب جداول Markdown، وتقليل الأسطر الفارغة واتباع تباعد الدردشة العادي، وتجنب كتابة تسلسلات `\n` الحرفية. تُعرض أسماء المجموعات وتسميات المشاركين القادمة من القنوات كبيانات تعريف غير موثوقة داخل كتل مسيّجة، وليست تعليمات نظام مضمنة.

## تفاصيل iMessage

- فضّل `chat_id:<id>` عند التوجيه أو الإدراج في قائمة السماح.
- عرض الدردشات: `imsg chats --limit 20`.
- تعود ردود المجموعة دائمًا إلى `chat_id` نفسه.

## موجهات نظام WhatsApp

راجع [WhatsApp](/ar/channels/whatsapp#system-prompts) للاطلاع على قواعد موجه نظام WhatsApp المعتمدة، بما في ذلك حل موجهات المجموعة والمباشرة، وسلوك أحرف البدل، ودلالات تجاوز الحساب.

## تفاصيل WhatsApp

راجع [رسائل المجموعات](/ar/channels/group-messages) للاطلاع على السلوك الخاص بـ WhatsApp فقط (حقن السجل، تفاصيل التعامل مع الإشارات).

## ذات صلة

- [مجموعات البث](/ar/channels/broadcast-groups)
- [توجيه القنوات](/ar/channels/channel-routing)
- [رسائل المجموعات](/ar/channels/group-messages)
- [الاقتران](/ar/channels/pairing)

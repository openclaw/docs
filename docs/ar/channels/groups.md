---
read_when:
    - تغيير سلوك الدردشة الجماعية أو تقييد الاستجابة بالإشارات
sidebarTitle: Groups
summary: سلوك الدردشة الجماعية عبر الواجهات (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: المجموعات
x-i18n:
    generated_at: "2026-05-10T19:21:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a040df975829cd35f45577522ea2813fd98fd8babbb42663e502cedde088d89
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw يتعامل مع محادثات المجموعات باتساق عبر الواجهات: Discord وiMessage وMatrix وMicrosoft Teams وSignal وSlack وTelegram وWhatsApp وZalo.

## مقدمة للمبتدئين (دقيقتان)

OpenClaw "يعيش" على حسابات المراسلة الخاصة بك. لا يوجد مستخدم روبوت WhatsApp منفصل. إذا كنت **أنت** في مجموعة، يمكن لـ OpenClaw رؤية تلك المجموعة والرد فيها.

السلوك الافتراضي:

- المجموعات مقيّدة (`groupPolicy: "allowlist"`).
- تتطلب الردود إشارة ما لم تعطل بوابة الإشارات صراحة.
- الردود النهائية العادية في المجموعات/القنوات تكون خاصة افتراضيا. يستخدم الإخراج المرئي في الغرفة أداة `message`.

الترجمة: يمكن للمرسلين المدرجين في قائمة السماح تشغيل OpenClaw عبر الإشارة إليه.

<Note>
**الخلاصة**

- **الوصول إلى الرسائل المباشرة** يتحكم به `*.allowFrom`.
- **الوصول إلى المجموعات** يتحكم به `*.groupPolicy` + قوائم السماح (`*.groups` و`*.groupAllowFrom`).
- **تشغيل الرد** تتحكم به بوابة الإشارات (`requireMention` و`/activation`).

</Note>

التدفق السريع (ما يحدث لرسالة مجموعة):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## الردود المرئية

بالنسبة لغرف المجموعات/القنوات، يضبط OpenClaw افتراضيا `messages.groupChat.visibleReplies: "message_tool"`.
يكتب `openclaw doctor --fix` هذا الإعداد الافتراضي في إعدادات القنوات المكوّنة التي لا تتضمنه.
هذا يعني أن الوكيل لا يزال يعالج الدور ويمكنه تحديث حالة الذاكرة/الجلسة، لكن إجابته النهائية العادية لا تُنشر تلقائيا مرة أخرى في الغرفة. للتحدث بشكل مرئي، يستخدم الوكيل `message(action=send)`.

يعتمد هذا الإعداد الافتراضي على نموذج/بيئة تشغيل تستدعي الأدوات على نحو موثوق. إذا أظهرت السجلات نص المساعد لكن `didSendViaMessagingTool: false`، فهذا يعني أن النموذج أجاب بشكل خاص بدلا من استدعاء أداة الرسائل. هذا ليس فشل إرسال في Discord/Slack/Telegram. استخدم نموذجا موثوقا في استدعاء الأدوات لجلسات المجموعات/القنوات، أو اضبط `messages.groupChat.visibleReplies: "automatic"` لاستعادة الردود النهائية المرئية القديمة.

إذا لم تكن أداة الرسائل متاحة بموجب سياسة الأدوات النشطة، يعود OpenClaw إلى الردود المرئية التلقائية بدلا من كتم الاستجابة بصمت. يحذر `openclaw doctor` من عدم التطابق هذا.

للمحادثات المباشرة وأي دور مصدر آخر، استخدم `messages.visibleReplies: "message_tool"` لتطبيق سلوك الرد المرئي بالأداة فقط نفسه عالميا. يمكن للحاضنات أيضا اختيار هذا كإعدادها الافتراضي غير المعيّن؛ يفعل حاضن Codex ذلك للمحادثات المباشرة في وضع Codex. يبقى `messages.groupChat.visibleReplies` التجاوز الأكثر تحديدا لغرف المجموعات/القنوات.

يحل هذا محل النمط القديم المتمثل في إجبار النموذج على الإجابة بـ `NO_REPLY` لمعظم أدوار وضع المراقبة. في وضع الأداة فقط، يعني عدم فعل أي شيء مرئي ببساطة عدم استدعاء أداة الرسائل.

لا تزال مؤشرات الكتابة تُرسل بينما يعمل الوكيل في وضع الأداة فقط. تتم ترقية وضع كتابة المجموعة الافتراضي من "message" إلى "instant" لهذه الأدوار، لأنه قد لا يوجد أبدا نص رسالة مساعد عادي قبل أن يقرر الوكيل ما إذا كان سيستدعي أداة الرسائل. لا يزال إعداد وضع الكتابة الصريح له الأسبقية.

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

يعيد Gateway تحميل إعدادات `messages` فوريا بعد حفظ الملف. أعد التشغيل فقط عندما تكون مراقبة الملفات أو إعادة تحميل الإعدادات معطلة في النشر.

لاشتراط مرور الإخراج المرئي عبر أداة الرسائل لكل محادثة مصدر:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

تتجاوز أوامر الشرطة المائلة الأصلية (Discord وTelegram والواجهات الأخرى التي تدعم الأوامر الأصلية) `visibleReplies: "message_tool"` وترد دائما بشكل مرئي بحيث تحصل واجهة أوامر القناة الأصلية على الاستجابة التي تتوقعها. ينطبق هذا فقط على أدوار الأوامر الأصلية المتحقق منها؛ أوامر `/...` المكتوبة نصيا وأدوار الدردشة العادية لا تزال تتبع الإعداد الافتراضي المكوّن للمجموعة.

## رؤية السياق وقوائم السماح

يوجد عنصران مختلفان للتحكم في أمان المجموعات:

- **تفويض التشغيل**: من يمكنه تشغيل الوكيل (`groupPolicy` و`groups` و`groupAllowFrom` وقوائم السماح الخاصة بالقنوات).
- **رؤية السياق**: ما السياق التكميلي الذي يُحقن في النموذج (نص الرد، الاقتباسات، سجل الخيط، البيانات الوصفية المعاد توجيهها).

افتراضيا، يعطي OpenClaw الأولوية لسلوك الدردشة العادي ويبقي السياق في الغالب كما تم استلامه. يعني هذا أن قوائم السماح تحدد أساسا من يمكنه تشغيل الإجراءات، وليست حد تنقيح شاملا لكل مقتطف مقتبس أو تاريخي.

<AccordionGroup>
  <Accordion title="Current behavior is channel-specific">
    - تطبق بعض القنوات بالفعل تصفية قائمة على المرسل للسياق التكميلي في مسارات محددة (على سبيل المثال تهيئة خيوط Slack وعمليات البحث عن الردود/الخيوط في Matrix).
    - لا تزال قنوات أخرى تمرر سياق الاقتباس/الرد/إعادة التوجيه كما تم استلامه.

  </Accordion>
  <Accordion title="Hardening direction (planned)">
    - يحافظ `contextVisibility: "all"` (الافتراضي) على السلوك الحالي كما تم استلامه.
    - يرشح `contextVisibility: "allowlist"` السياق التكميلي ليقتصر على المرسلين المدرجين في قائمة السماح.
    - `contextVisibility: "allowlist_quote"` هو `allowlist` مع استثناء اقتباس/رد صريح واحد إضافي.

    إلى أن يُنفذ نموذج التقوية هذا باتساق عبر القنوات، توقع وجود اختلافات حسب الواجهة.

  </Accordion>
</AccordionGroup>

![تدفق رسالة المجموعة](/images/groups-flow.svg)

إذا كنت تريد...

| الهدف                                         | ما يجب ضبطه                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| السماح بكل المجموعات مع الرد فقط عند إشارات @ | `groups: { "*": { requireMention: true } }`                |
| تعطيل كل ردود المجموعات                    | `groupPolicy: "disabled"`                                  |
| مجموعات محددة فقط                         | `groups: { "<group-id>": { ... } }` (بدون مفتاح `"*"` )         |
| أنت فقط تستطيع التشغيل في المجموعات               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| إعادة استخدام مجموعة مرسلين موثوقين واحدة عبر القنوات | `groupAllowFrom: ["accessGroup:operators"]`                |

لقوائم سماح المرسلين القابلة لإعادة الاستخدام، راجع [مجموعات الوصول](/ar/channels/access-groups).

## مفاتيح الجلسة

- تستخدم جلسات المجموعات مفاتيح جلسة `agent:<agentId>:<channel>:group:<id>` (تستخدم الغرف/القنوات `agent:<agentId>:<channel>:channel:<id>`).
- تضيف موضوعات منتديات Telegram `:topic:<threadId>` إلى معرف المجموعة بحيث يكون لكل موضوع جلسته الخاصة.
- تستخدم المحادثات المباشرة الجلسة الرئيسية (أو جلسة لكل مرسل إذا تم تكوين ذلك).
- يتم تخطي Heartbeat لجلسات المجموعات.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## النمط: رسائل مباشرة شخصية + مجموعات عامة (وكيل واحد)

نعم — يعمل هذا جيدا إذا كانت حركة "الشخصية" لديك هي **رسائل مباشرة** وحركة "العامة" لديك هي **مجموعات**.

السبب: في وضع الوكيل الواحد، تصل الرسائل المباشرة عادة إلى مفتاح الجلسة **الرئيسي** (`agent:main:main`)، بينما تستخدم المجموعات دائما مفاتيح جلسات **غير رئيسية** (`agent:main:<channel>:group:<id>`). إذا فعّلت العزل باستخدام `mode: "non-main"`، فستعمل جلسات المجموعات هذه في خلفية العزل المكوّنة بينما تبقى جلسة الرسائل المباشرة الرئيسية لديك على المضيف. Docker هو الخلفية الافتراضية إذا لم تختر واحدة.

يمنحك هذا "عقلا" واحدا للوكيل (مساحة عمل + ذاكرة مشتركتان)، لكن بوضعين للتنفيذ:

- **الرسائل المباشرة**: أدوات كاملة (المضيف)
- **المجموعات**: عزل + أدوات مقيّدة

<Note>
إذا كنت تحتاج إلى مساحات عمل/شخصيات منفصلة حقا (يجب ألا يختلط "الشخصي" و"العام" أبدا)، فاستخدم وكيلا ثانيا + روابط. راجع [توجيه متعدد الوكلاء](/ar/concepts/multi-agent).
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
    هل تريد أن "تستطيع المجموعات رؤية المجلد X فقط" بدلا من "عدم وجود وصول إلى المضيف"؟ أبقِ `workspaceAccess: "none"` وحمّل فقط المسارات المدرجة في قائمة السماح إلى العزل:

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
- تصحيح سبب حظر أداة: [العزل مقابل سياسة الأدوات مقابل المرفوع](/ar/gateway/sandbox-vs-tool-policy-vs-elevated)
- تفاصيل ربط التحميل: [العزل](/ar/gateway/sandboxing#custom-bind-mounts)

## تسميات العرض

- تستخدم تسميات الواجهة `displayName` عند توفره، منسقا كـ `<channel>:<token>`.
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
    - `groupPolicy` منفصل عن بوابة الذكر (التي تتطلب @mentions).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: استخدم `groupAllowFrom` (الخيار الاحتياطي: `allowFrom` الصريح).
    - Signal: يمكن أن يطابق `groupAllowFrom` إما معرّف مجموعة Signal الوارد أو هاتف/UUID المرسل.
    - تنطبق موافقات إقران الرسائل المباشرة (إدخالات مخزن `*-allowFrom`) على الوصول إلى الرسائل المباشرة فقط؛ يظل تخويل مرسل المجموعة صريحا عبر قوائم السماح للمجموعات.
    - Discord: تستخدم قائمة السماح `channels.discord.guilds.<id>.channels`.
    - Slack: تستخدم قائمة السماح `channels.slack.channels`.
    - Matrix: تستخدم قائمة السماح `channels.matrix.groups`. فضّل معرّفات الغرف أو الأسماء البديلة؛ البحث عن اسم الغرفة المنضم إليها يبذل أفضل جهد، ويتم تجاهل الأسماء غير المحلولة وقت التشغيل. استخدم `channels.matrix.groupAllowFrom` لتقييد المرسلين؛ كما تُدعم قوائم السماح `users` لكل غرفة.
    - تُدار الرسائل المباشرة الجماعية بشكل منفصل (`channels.discord.dm.*`، `channels.slack.dm.*`).
    - يمكن لقائمة السماح في Telegram مطابقة معرّفات المستخدمين (`"123456789"`، `"telegram:123456789"`، `"tg:123456789"`) أو أسماء المستخدمين (`"@alice"` أو `"alice"`); ولا تتحسس البادئات حالة الأحرف.
    - الافتراضي هو `groupPolicy: "allowlist"`؛ إذا كانت قائمة السماح للمجموعات فارغة، فسيتم حظر رسائل المجموعة.
    - أمان وقت التشغيل: عندما تكون كتلة موفر مفقودة بالكامل (`channels.<provider>` غائب)، تعود سياسة المجموعة إلى وضع الإغلاق الآمن عند الفشل (عادة `allowlist`) بدلا من وراثة `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

نموذج ذهني سريع (ترتيب التقييم لرسائل المجموعة):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="قوائم السماح للمجموعات">
    قوائم السماح للمجموعات (`*.groups`، `*.groupAllowFrom`، قائمة السماح الخاصة بالقناة).
  </Step>
  <Step title="بوابة الذكر">
    بوابة الذكر (`requireMention`، `/activation`).
  </Step>
</Steps>

## بوابة الذكر (افتراضي)

تتطلب رسائل المجموعة ذكرا ما لم يتم تجاوزه لكل مجموعة. توجد الإعدادات الافتراضية لكل نظام فرعي تحت `*.groups."*"`.

يُعد الرد على رسالة بوت ذكرا ضمنيا عندما تدعم القناة بيانات تعريف الرد. كما يمكن لاقتباس رسالة بوت أن يُعد ذكرا ضمنيا على القنوات التي تعرض بيانات تعريف الاقتباس. تشمل الحالات المضمنة الحالية Telegram وWhatsApp وSlack وDiscord وMicrosoft Teams وZaloUser.

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
  <Accordion title="ملاحظات بوابة الذكر">
    - `mentionPatterns` هي أنماط regex آمنة وغير حساسة لحالة الأحرف؛ يتم تجاهل الأنماط غير الصالحة وأشكال التكرار المتداخلة غير الآمنة.
    - الأسطح التي توفر ذكرا صريحا تظل تمر؛ الأنماط خيار احتياطي.
    - تجاوز لكل وكيل: `agents.list[].groupChat.mentionPatterns` (مفيد عندما يتشارك عدة وكلاء مجموعة).
    - لا تُفرض بوابة الذكر إلا عندما يكون اكتشاف الذكر ممكنا (تم تكوين الذكر الأصلي أو `mentionPatterns`).
    - لا يؤدي وضع مجموعة أو مرسل في قائمة السماح إلى تعطيل بوابة الذكر؛ اضبط `requireMention` لتلك المجموعة على `false` عندما ينبغي أن تؤدي كل الرسائل إلى التشغيل.
    - يحمل سياق موجه دردشة المجموعة تعليمة الرد الصامت المحلولة في كل دورة؛ يجب ألا تكرر ملفات مساحة العمل آليات `NO_REPLY`.
    - المجموعات التي يُسمح فيها بالردود الصامتة تتعامل مع دورات النموذج النظيفة الفارغة أو المعتمدة على الاستدلال فقط كدورات صامتة، بما يعادل `NO_REPLY`. تفعل الدردشات المباشرة الشيء نفسه فقط عندما تكون الردود الصامتة المباشرة مسموحة صراحة؛ وإلا تبقى الردود الفارغة دورات وكيل فاشلة.
    - توجد إعدادات Discord الافتراضية في `channels.discord.guilds."*"` (قابلة للتجاوز لكل خادم/قناة).
    - يُغلّف سياق سجل المجموعة بشكل موحد عبر القنوات. تحتفظ المجموعات التي تعمل ببوابة الذكر بالرسائل المتخطاة المعلقة؛ وقد تحتفظ المجموعات الدائمة التشغيل أيضا برسائل الغرفة الحديثة المعالجة عندما تدعم القناة ذلك. استخدم `messages.groupChat.historyLimit` للإعداد الافتراضي العام و`channels.<channel>.historyLimit` (أو `channels.<channel>.accounts.*.historyLimit`) للتجاوزات. اضبطه على `0` للتعطيل.

  </Accordion>
</AccordionGroup>

## قيود أدوات المجموعة/القناة (اختياري)

تدعم بعض تكوينات القنوات تقييد الأدوات المتاحة **داخل مجموعة/غرفة/قناة محددة**.

- `tools`: السماح بالأدوات أو منعها للمجموعة بأكملها.
- `toolsBySender`: تجاوزات لكل مرسل داخل المجموعة. استخدم بادئات مفاتيح صريحة: `id:<senderId>`، `e164:<phone>`، `username:<handle>`، `name:<displayName>`، وحرف البدل `"*"`. لا تزال المفاتيح القديمة غير المسبوقة مقبولة وتتم مطابقتها كـ `id:` فقط.

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
    `tools` الافتراضية (`"*"`).
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
تُطبق قيود أدوات المجموعة/القناة بالإضافة إلى سياسة الأدوات العامة/الخاصة بالوكيل (لا يزال المنع يفوز). تستخدم بعض القنوات تداخلا مختلفا للغرف/القنوات (مثل Discord `guilds.*.channels.*`، وSlack `channels.*`، وMicrosoft Teams `teams.*.channels.*`).
</Note>

## قوائم السماح للمجموعات

عند تكوين `channels.whatsapp.groups` أو `channels.telegram.groups` أو `channels.imessage.groups`، تعمل المفاتيح كقائمة سماح للمجموعات. استخدم `"*"` للسماح بكل المجموعات مع الاستمرار في ضبط سلوك الذكر الافتراضي.

<Warning>
التباس شائع: موافقة إقران الرسائل المباشرة ليست هي نفسها تخويل المجموعة. بالنسبة إلى القنوات التي تدعم إقران الرسائل المباشرة، لا يفتح مخزن الإقران إلا الرسائل المباشرة. لا تزال أوامر المجموعة تتطلب تخويلا صريحا لمرسل المجموعة من قوائم سماح التكوين مثل `groupAllowFrom` أو خيار التكوين الاحتياطي الموثق لتلك القناة.
</Warning>

نوايا شائعة (انسخ/الصق):

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
  <Tab title="السماح بكل المجموعات مع اشتراط الذكر">
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

## التنشيط (المالك فقط)

يمكن لمالكي المجموعات تبديل التنشيط لكل مجموعة:

- `/activation mention`
- `/activation always`

يُحدد المالك بواسطة `channels.whatsapp.allowFrom` (أو E.164 الذاتي للبوت عندما لا يكون معينا). أرسل الأمر كرسالة مستقلة. تتجاهل الأسطح الأخرى حاليا `/activation`.

## حقول السياق

تعيّن حمولات المجموعة الواردة:

- `ChatType=group`
- `GroupSubject` (إذا كان معروفا)
- `GroupMembers` (إذا كان معروفا)
- `WasMentioned` (نتيجة بوابة الذكر)
- تتضمن موضوعات منتدى Telegram أيضا `MessageThreadId` و`IsForum`.

يتضمن موجه نظام الوكيل مقدمة للمجموعة في أول دورة من جلسة مجموعة جديدة. يذكّر النموذج بالرد مثل إنسان، وتجنب جداول Markdown، وتقليل الأسطر الفارغة واتباع تباعد الدردشة الطبيعي، وتجنب كتابة تسلسلات `\n` حرفية. تُعرض أسماء المجموعات وتسميات المشاركين الصادرة من القناة كبيانات تعريف غير موثوقة داخل أسوار، وليست كتعليمات نظام مضمنة.

## تفاصيل iMessage

- فضّل `chat_id:<id>` عند التوجيه أو الإضافة إلى قائمة السماح.
- سرد الدردشات: `imsg chats --limit 20`.
- تعود ردود المجموعة دائما إلى `chat_id` نفسه.

## موجهات نظام WhatsApp

راجع [WhatsApp](/ar/channels/whatsapp#system-prompts) لقواعد موجه نظام WhatsApp المرجعية، بما في ذلك حل موجهات المجموعة والمباشر، وسلوك حرف البدل، ودلالات تجاوز الحساب.

## تفاصيل WhatsApp

راجع [رسائل المجموعة](/ar/channels/group-messages) للسلوك الخاص بWhatsApp فقط (حقن السجل، وتفاصيل معالجة الذكر).

## ذات صلة

- [مجموعات البث](/ar/channels/broadcast-groups)
- [توجيه القنوات](/ar/channels/channel-routing)
- [رسائل المجموعة](/ar/channels/group-messages)
- [الإقران](/ar/channels/pairing)

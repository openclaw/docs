---
read_when:
    - تغيير سلوك دردشة المجموعة أو ضبط بوابة الإشارات
sidebarTitle: Groups
summary: سلوك الدردشة الجماعية عبر الواجهات (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: المجموعات
x-i18n:
    generated_at: "2026-05-04T02:21:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: dea506c011a5d8f6155b2f56aacb236482cb8c5b7457001cb2171fd45932443d
    source_path: channels/groups.md
    workflow: 16
---

يتعامل OpenClaw مع الدردشات الجماعية بشكل متسق عبر الأسطح: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## مقدمة للمبتدئين (دقيقتان)

"يعيش" OpenClaw على حسابات المراسلة الخاصة بك. لا يوجد مستخدم بوت WhatsApp منفصل. إذا كنت **أنت** في مجموعة، يمكن لـ OpenClaw رؤية تلك المجموعة والرد فيها.

السلوك الافتراضي:

- المجموعات مقيّدة (`groupPolicy: "allowlist"`).
- تتطلب الردود إشارة ما لم تعطّل صراحةً بوابة الإشارات.
- الردود النهائية العادية في المجموعات/القنوات تكون خاصة افتراضياً. يستخدم الإخراج المرئي في الغرفة أداة `message`.

الترجمة: يمكن للمرسلين المدرجين في قائمة السماح تشغيل OpenClaw عبر الإشارة إليه.

<Note>
**خلاصة سريعة**

- يتم التحكم في **وصول الرسائل المباشرة** بواسطة `*.allowFrom`.
- يتم التحكم في **وصول المجموعات** بواسطة `*.groupPolicy` + قوائم السماح (`*.groups`, `*.groupAllowFrom`).
- يتم التحكم في **تشغيل الردود** بواسطة بوابة الإشارات (`requireMention`, `/activation`).

</Note>

تدفق سريع (ما يحدث لرسالة مجموعة):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## الردود المرئية

بالنسبة لغرف المجموعات/القنوات، يضبط OpenClaw افتراضياً `messages.groupChat.visibleReplies: "message_tool"`.
يكتب `openclaw doctor --fix` هذا الإعداد الافتراضي في إعدادات القنوات المكوّنة التي لا تتضمنه.
يعني ذلك أن الوكيل لا يزال يعالج الدور ويمكنه تحديث الذاكرة/حالة الجلسة، لكن إجابته النهائية العادية لا تُنشر تلقائياً مرة أخرى في الغرفة. للتحدث بشكل مرئي، يستخدم الوكيل `message(action=send)`.

يعتمد هذا الإعداد الافتراضي على نموذج/وقت تشغيل يستدعي الأدوات بشكل موثوق. إذا أظهرت السجلات نص المساعد لكن `didSendViaMessagingTool: false`، فهذا يعني أن النموذج أجاب بشكل خاص بدلاً من استدعاء أداة الرسائل. هذا ليس فشل إرسال في Discord/Slack/Telegram. استخدم نموذجاً موثوقاً في استدعاء الأدوات لجلسات المجموعات/القنوات، أو اضبط `messages.groupChat.visibleReplies: "automatic"` لاستعادة الردود النهائية المرئية القديمة.

إذا كانت أداة الرسائل غير متاحة ضمن سياسة الأدوات النشطة، يعود OpenClaw إلى الردود المرئية التلقائية بدلاً من كتم الاستجابة بصمت. يحذر `openclaw doctor` من عدم التطابق هذا.

بالنسبة للدردشات المباشرة وأي دور مصدر آخر، استخدم `messages.visibleReplies: "message_tool"` لتطبيق سلوك الردود المرئية المعتمد على الأداة فقط عالمياً. يمكن لأدوات الاختبار أيضاً اختيار هذا كإعداد افتراضي غير مضبوط لديها؛ تفعل أداة اختبار Codex ذلك للدردشات المباشرة في وضع Codex. يبقى `messages.groupChat.visibleReplies` التجاوز الأكثر تحديداً لغرف المجموعات/القنوات.

يستبدل هذا النمط القديم الذي كان يجبر النموذج على الإجابة بـ `NO_REPLY` لمعظم أدوار وضع الترقب. في وضع الأداة فقط، يعني عدم فعل أي شيء مرئي ببساطة عدم استدعاء أداة الرسائل.

لا تزال مؤشرات الكتابة تُرسل أثناء عمل الوكيل في وضع الأداة فقط. تتم ترقية وضع كتابة المجموعة الافتراضي من "message" إلى "instant" لهذه الأدوار لأنه قد لا يكون هناك أبداً نص رسالة مساعد عادي قبل أن يقرر الوكيل ما إذا كان سيستدعي أداة الرسائل. يبقى إعداد وضع الكتابة الصريح هو الحاكم.

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

يعيد Gateway تحميل إعدادات `messages` فورياً بعد حفظ الملف. أعد التشغيل فقط عندما تكون مراقبة الملفات أو إعادة تحميل الإعدادات معطلة في النشر.

لاشتراط مرور الإخراج المرئي عبر أداة الرسائل لكل دردشة مصدر:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

تتجاوز أوامر الشرطة المائلة الأصلية (Discord وTelegram والأسطح الأخرى ذات دعم الأوامر الأصلي) `visibleReplies: "message_tool"` وترد دائماً بشكل مرئي حتى تحصل واجهة أوامر القناة الأصلية على الاستجابة التي تتوقعها. ينطبق هذا على أدوار الأوامر الأصلية التي تم التحقق منها فقط؛ أما أوامر `/...` المكتوبة نصياً وأدوار الدردشة العادية فلا تزال تتبع الإعداد الافتراضي المكوّن للمجموعة.

## رؤية السياق وقوائم السماح

هناك عنصران مختلفان للتحكم في سلامة المجموعات:

- **تفويض التشغيل**: من يمكنه تشغيل الوكيل (`groupPolicy`, `groups`, `groupAllowFrom`, قوائم السماح الخاصة بالقنوات).
- **رؤية السياق**: ما السياق التكميلي الذي يُحقن في النموذج (نص الرد، الاقتباسات، سجل سلسلة المحادثة، بيانات التعريف المعاد توجيهها).

افتراضياً، يعطي OpenClaw الأولوية لسلوك الدردشة الطبيعي ويبقي السياق في الغالب كما ورد. يعني هذا أن قوائم السماح تحدد أساساً من يمكنه تشغيل الإجراءات، وليست حداً عاماً للتنقيح لكل مقتطف مقتبس أو تاريخي.

<AccordionGroup>
  <Accordion title="السلوك الحالي خاص بالقناة">
    - تطبق بعض القنوات بالفعل تصفية مستندة إلى المرسل للسياق التكميلي في مسارات محددة (على سبيل المثال تهيئة سلاسل Slack، وعمليات البحث عن الردود/السلاسل في Matrix).
    - لا تزال قنوات أخرى تمرر سياق الاقتباس/الرد/إعادة التوجيه كما ورد.

  </Accordion>
  <Accordion title="اتجاه التحصين (مخطط)">
    - يحافظ `contextVisibility: "all"` (الافتراضي) على السلوك الحالي كما ورد.
    - يرشح `contextVisibility: "allowlist"` السياق التكميلي إلى المرسلين المدرجين في قائمة السماح.
    - `contextVisibility: "allowlist_quote"` هو `allowlist` مع استثناء اقتباس/رد صريح واحد.

    إلى أن يتم تنفيذ نموذج التحصين هذا بشكل متسق عبر القنوات، توقع اختلافات حسب السطح.

  </Accordion>
</AccordionGroup>

![تدفق رسائل المجموعة](/images/groups-flow.svg)

إذا كنت تريد...

| الهدف                                         | ما يجب ضبطه                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| السماح بكل المجموعات لكن الرد فقط عند @الإشارات | `groups: { "*": { requireMention: true } }`                |
| تعطيل كل ردود المجموعات                    | `groupPolicy: "disabled"`                                  |
| مجموعات محددة فقط                         | `groups: { "<group-id>": { ... } }` (بلا مفتاح `"*"` )         |
| أنت فقط يمكنك التشغيل في المجموعات               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| إعادة استخدام مجموعة مرسلين موثوقة واحدة عبر القنوات | `groupAllowFrom: ["accessGroup:operators"]`                |

لقوائم سماح المرسلين القابلة لإعادة الاستخدام، راجع [مجموعات الوصول](/ar/channels/access-groups).

## مفاتيح الجلسات

- تستخدم جلسات المجموعات مفاتيح جلسات `agent:<agentId>:<channel>:group:<id>` (تستخدم الغرف/القنوات `agent:<agentId>:<channel>:channel:<id>`).
- تضيف مواضيع منتديات Telegram ‏`:topic:<threadId>` إلى معرّف المجموعة بحيث يكون لكل موضوع جلسته الخاصة.
- تستخدم الدردشات المباشرة الجلسة الرئيسية (أو لكل مرسل إذا تم تكوين ذلك).
- يتم تخطي Heartbeat لجلسات المجموعات.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## نمط: رسائل مباشرة شخصية + مجموعات عامة (وكيل واحد)

نعم — يعمل هذا جيداً إذا كانت حركة المرور "الشخصية" لديك هي **رسائل مباشرة** وكانت حركة المرور "العامة" لديك هي **مجموعات**.

السبب: في وضع الوكيل الواحد، تصل الرسائل المباشرة عادةً إلى مفتاح الجلسة **الرئيسي** (`agent:main:main`)، بينما تستخدم المجموعات دائماً مفاتيح جلسات **غير رئيسية** (`agent:main:<channel>:group:<id>`). إذا فعّلت العزل باستخدام `mode: "non-main"`، فستعمل جلسات المجموعات هذه في خلفية العزل المكوّنة بينما تبقى جلسة الرسائل المباشرة الرئيسية على المضيف. Docker هو الخلفية الافتراضية إذا لم تختر واحدة.

يعطيك هذا "عقلاً" واحداً للوكيل (مساحة عمل + ذاكرة مشتركتان)، لكن وضعين للتنفيذ:

- **الرسائل المباشرة**: أدوات كاملة (المضيف)
- **المجموعات**: عزل + أدوات مقيّدة

<Note>
إذا كنت بحاجة إلى مساحات عمل/شخصيات منفصلة حقاً (يجب ألا يختلط "الشخصي" و"العام" أبداً)، فاستخدم وكيلاً ثانياً + ربطاً. راجع [توجيه متعدد الوكلاء](/ar/concepts/multi-agent).
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
  <Tab title="ترى المجموعات مجلداً مدرجاً في قائمة السماح فقط">
    هل تريد "يمكن للمجموعات رؤية المجلد X فقط" بدلاً من "لا وصول إلى المضيف"؟ أبقِ `workspaceAccess: "none"` واربط المسارات المدرجة في قائمة السماح فقط داخل العزل:

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

ذو صلة:

- مفاتيح الإعدادات والقيم الافتراضية: [إعدادات Gateway](/ar/gateway/config-agents#agentsdefaultssandbox)
- تصحيح سبب حظر أداة: [العزل مقابل سياسة الأدوات مقابل الصلاحيات المرتفعة](/ar/gateway/sandbox-vs-tool-policy-vs-elevated)
- تفاصيل ربط المسارات: [العزل](/ar/gateway/sandboxing#custom-bind-mounts)

## تسميات العرض

- تستخدم تسميات واجهة المستخدم `displayName` عندما يكون متاحاً، منسقاً كـ `<channel>:<token>`.
- `#room` محجوز للغرف/القنوات؛ تستخدم دردشات المجموعات `g-<slug>` (أحرف صغيرة، المسافات -> `-`، مع إبقاء `#@+._-`).

## سياسة المجموعات

تحكم في كيفية معالجة رسائل المجموعات/الغرف لكل قناة:

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
| `"allowlist"` | السماح فقط بالمجموعات/الغرف التي تطابق قائمة السماح المكوّنة. |

<AccordionGroup>
  <Accordion title="ملاحظات لكل قناة">
    - `groupPolicy` منفصل عن اشتراط الإشارة (الذي يتطلب @mentions).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: استخدم `groupAllowFrom` (الاحتياطي: `allowFrom` صريح).
    - Signal: يمكن أن يطابق `groupAllowFrom` إما معرف مجموعة Signal الواردة أو هاتف/UUID المرسل.
    - تنطبق موافقات إقران الرسائل المباشرة (مدخلات تخزين `*-allowFrom`) على وصول الرسائل المباشرة فقط؛ ويبقى تفويض مرسل المجموعة صريحا عبر قوائم سماح المجموعات.
    - Discord: تستخدم قائمة السماح `channels.discord.guilds.<id>.channels`.
    - Slack: تستخدم قائمة السماح `channels.slack.channels`.
    - Matrix: تستخدم قائمة السماح `channels.matrix.groups`. فضّل معرفات الغرف أو الأسماء المستعارة؛ البحث عن اسم الغرفة المنضمة هو أفضل محاولة، ويتم تجاهل الأسماء غير المحلولة وقت التشغيل. استخدم `channels.matrix.groupAllowFrom` لتقييد المرسلين؛ قوائم سماح `users` لكل غرفة مدعومة أيضا.
    - يتم التحكم في الرسائل المباشرة الجماعية بشكل منفصل (`channels.discord.dm.*`، `channels.slack.dm.*`).
    - يمكن أن تطابق قائمة سماح Telegram معرفات المستخدمين (`"123456789"`، `"telegram:123456789"`، `"tg:123456789"`) أو أسماء المستخدمين (`"@alice"` أو `"alice"`); ولا تتحسس البادئات حالة الأحرف.
    - الافتراضي هو `groupPolicy: "allowlist"`؛ إذا كانت قائمة سماح مجموعتك فارغة، فسيتم حظر رسائل المجموعة.
    - سلامة وقت التشغيل: عندما تكون كتلة المزوّد مفقودة بالكامل (`channels.<provider>` غير موجودة)، تعود سياسة المجموعة إلى وضع مغلق عند الفشل (عادة `allowlist`) بدلا من وراثة `channels.defaults.groupPolicy`.

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
  <Step title="اشتراط الإشارة">
    اشتراط الإشارة (`requireMention`، `/activation`).
  </Step>
</Steps>

## اشتراط الإشارة (افتراضي)

تتطلب رسائل المجموعات إشارة ما لم يتم تجاوز ذلك لكل مجموعة. توجد الافتراضيات لكل نظام فرعي ضمن `*.groups."*"`.

يُحتسب الرد على رسالة bot كإشارة ضمنية عندما تدعم القناة بيانات تعريف الرد. ويمكن أن يُحتسب اقتباس رسالة bot أيضا كإشارة ضمنية على القنوات التي تكشف بيانات تعريف الاقتباس. تشمل الحالات المضمنة الحالية Telegram وWhatsApp وSlack وDiscord وMicrosoft Teams وZaloUser.

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
  <Accordion title="ملاحظات اشتراط الإشارة">
    - `mentionPatterns` هي أنماط regex آمنة وغير حساسة لحالة الأحرف؛ يتم تجاهل الأنماط غير الصالحة وأشكال التكرار المتداخل غير الآمنة.
    - الأسطح التي توفر إشارات صريحة تظل تمر؛ الأنماط هي احتياطي.
    - تجاوز لكل وكيل: `agents.list[].groupChat.mentionPatterns` (مفيد عندما يشارك عدة وكلاء مجموعة واحدة).
    - لا يتم فرض اشتراط الإشارة إلا عندما يكون اكتشاف الإشارة ممكنا (تم تكوين إشارات أصلية أو `mentionPatterns`).
    - لا يؤدي وضع مجموعة أو مرسل في قائمة السماح إلى تعطيل اشتراط الإشارة؛ اضبط `requireMention` لتلك المجموعة على `false` عندما يجب أن تؤدي كل الرسائل إلى التشغيل.
    - يحمل سياق مطالبة دردشة المجموعة تعليمة الرد الصامت المحلولة في كل دور؛ يجب ألا تكرر ملفات مساحة العمل آليات `NO_REPLY`.
    - تتعامل المجموعات التي تسمح بالردود الصامتة مع أدوار النموذج النظيفة الفارغة أو التي تحتوي على تفكير فقط كصامتة، بما يعادل `NO_REPLY`. تفعل الدردشات المباشرة الشيء نفسه فقط عندما تكون الردود الصامتة المباشرة مسموحة صراحة؛ وإلا تبقى الردود الفارغة أدوارا فاشلة للوكيل.
    - توجد افتراضيات Discord في `channels.discord.guilds."*"` (قابلة للتجاوز لكل خادم/قناة).
    - يتم تغليف سياق سجل المجموعة بشكل موحد عبر القنوات وهو **للمعلّق فقط** (الرسائل التي تم تخطيها بسبب اشتراط الإشارة)؛ استخدم `messages.groupChat.historyLimit` للافتراضي العام و`channels.<channel>.historyLimit` (أو `channels.<channel>.accounts.*.historyLimit`) للتجاوزات. اضبط `0` للتعطيل.

  </Accordion>
</AccordionGroup>

## قيود أدوات المجموعة/القناة (اختياري)

تدعم بعض تكوينات القنوات تقييد الأدوات المتاحة **داخل مجموعة/غرفة/قناة محددة**.

- `tools`: السماح بالأدوات أو منعها للمجموعة كلها.
- `toolsBySender`: تجاوزات لكل مرسل داخل المجموعة. استخدم بادئات مفاتيح صريحة: `id:<senderId>`، `e164:<phone>`، `username:<handle>`، `name:<displayName>`، وبدل `"*"` الشامل. لا تزال المفاتيح القديمة غير المسبوقة مقبولة وتطابق كـ `id:` فقط.

ترتيب الحل (الأكثر تحديدا يفوز):

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
تُطبق قيود أدوات المجموعة/القناة بالإضافة إلى سياسة الأدوات العامة/الخاصة بالوكيل (لا يزال المنع يفوز). تستخدم بعض القنوات تداخلا مختلفا للغرف/القنوات (مثل Discord `guilds.*.channels.*`، وSlack `channels.*`، وMicrosoft Teams `teams.*.channels.*`).
</Note>

## قوائم سماح المجموعات

عند تكوين `channels.whatsapp.groups` أو `channels.telegram.groups` أو `channels.imessage.groups`، تعمل المفاتيح كقائمة سماح للمجموعات. استخدم `"*"` للسماح بكل المجموعات مع الاستمرار في ضبط سلوك الإشارة الافتراضي.

<Warning>
لبس شائع: موافقة إقران الرسائل المباشرة ليست هي نفسها تفويض المجموعة. بالنسبة إلى القنوات التي تدعم إقران الرسائل المباشرة، يفتح مخزن الإقران الرسائل المباشرة فقط. لا تزال أوامر المجموعات تتطلب تفويضا صريحا لمرسل المجموعة من قوائم سماح التكوين مثل `groupAllowFrom` أو احتياطي التكوين الموثق لتلك القناة.
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

## التنشيط (للمالك فقط)

يمكن لمالكي المجموعات تبديل التنشيط لكل مجموعة:

- `/activation mention`
- `/activation always`

يُحدد المالك بواسطة `channels.whatsapp.allowFrom` (أو رقم E.164 الذاتي للبوت عندما لا يكون مضبوطا). أرسل الأمر كرسالة مستقلة. تتجاهل الأسطح الأخرى حاليا `/activation`.

## حقول السياق

تضبط حمولات المجموعات الواردة:

- `ChatType=group`
- `GroupSubject` (إذا كان معروفا)
- `GroupMembers` (إذا كان معروفا)
- `WasMentioned` (نتيجة اشتراط الإشارة)
- تتضمن مواضيع منتدى Telegram أيضا `MessageThreadId` و`IsForum`.

ملاحظات خاصة بالقنوات:

- يمكن لـ BlueBubbles اختياريا إثراء مشاركي مجموعات macOS غير المسماة من قاعدة بيانات جهات الاتصال المحلية قبل ملء `GroupMembers`. يكون هذا معطلا افتراضيا ولا يعمل إلا بعد نجاح بوابات المجموعة العادية.

تتضمن مطالبة نظام الوكيل مقدمة للمجموعة في الدور الأول لجلسة مجموعة جديدة. تذكّر النموذج بأن يرد كإنسان، ويتجنب جداول Markdown، ويقلل الأسطر الفارغة ويتبع تباعد الدردشة الطبيعي، ويتجنب كتابة تسلسلات `\n` حرفيا. تُعرض أسماء المجموعات وتسميات المشاركين المأخوذة من القنوات كبيانات تعريف غير موثوقة داخل كتل مسيجة، لا كتعليمات نظام مضمنة.

## تفاصيل iMessage

- فضّل `chat_id:<id>` عند التوجيه أو الإدراج في قائمة السماح.
- سرد الدردشات: `imsg chats --limit 20`.
- تعود ردود المجموعات دائما إلى `chat_id` نفسه.

## مطالبات نظام WhatsApp

راجع [WhatsApp](/ar/channels/whatsapp#system-prompts) للاطلاع على قواعد مطالبة نظام WhatsApp المرجعية، بما في ذلك حل مطالبات المجموعات والمباشرة، وسلوك البدل الشامل، ودلالات تجاوز الحساب.

## تفاصيل WhatsApp

راجع [رسائل المجموعات](/ar/channels/group-messages) لمعرفة السلوك الخاص بـ WhatsApp فقط (حقن السجل، تفاصيل التعامل مع الإشارات).

## ذو صلة

- [مجموعات البث](/ar/channels/broadcast-groups)
- [توجيه القنوات](/ar/channels/channel-routing)
- [رسائل المجموعات](/ar/channels/group-messages)
- [الإقران](/ar/channels/pairing)

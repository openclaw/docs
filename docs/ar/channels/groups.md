---
read_when:
    - تغيير سلوك الدردشة الجماعية أو تقييد الإشارات
sidebarTitle: Groups
summary: سلوك الدردشة الجماعية عبر الأسطح المختلفة (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: المجموعات
x-i18n:
    generated_at: "2026-04-26T11:23:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 837055b3cd044ebe3ef9aefe29e36f6471f48025d32169c43b9c5b04a8ac639c
    source_path: channels/groups.md
    workflow: 15
---

يتعامل OpenClaw مع الدردشات الجماعية بشكل متّسق عبر الأسطح المختلفة: Discord وiMessage وMatrix وMicrosoft Teams وSignal وSlack وTelegram وWhatsApp وZalo.

## مقدمة للمبتدئين (دقيقتان)

يعمل OpenClaw من خلال حسابات المراسلة الخاصة بك. لا يوجد مستخدم bot منفصل على WhatsApp. إذا كنت **أنت** ضمن مجموعة، يمكن لـ OpenClaw رؤية تلك المجموعة والرد فيها.

السلوك الافتراضي:

- المجموعات مقيّدة (`groupPolicy: "allowlist"`).
- تتطلب الردود إشارة mention ما لم تقم بتعطيل تقييد الإشارات صراحةً.

بمعنى آخر: يمكن للمرسلين الموجودين في allowlist تشغيل OpenClaw من خلال الإشارة إليه.

<Note>
**الخلاصة**

- يتم التحكم في **الوصول إلى الرسائل الخاصة DM** بواسطة `*.allowFrom`.
- يتم التحكم في **الوصول إلى المجموعات** بواسطة `*.groupPolicy` + allowlists (`*.groups`, `*.groupAllowFrom`).
- يتم التحكم في **تشغيل الردود** بواسطة تقييد الإشارات (`requireMention`, `/activation`).
</Note>

التدفق السريع (ما الذي يحدث لرسالة المجموعة):

```
groupPolicy? disabled -> تجاهل
groupPolicy? allowlist -> هل المجموعة مسموح بها؟ لا -> تجاهل
requireMention? yes -> هل توجد إشارة؟ لا -> خزّن للسياق فقط
otherwise -> رد
```

## رؤية السياق وallowlists

هناك عنصران مختلفان يدخلان في أمان المجموعات:

- **تفويض التشغيل**: من يمكنه تشغيل الوكيل (`groupPolicy`, `groups`, `groupAllowFrom`, وallowlists الخاصة بالقناة).
- **رؤية السياق**: ما السياق الإضافي الذي يُحقن في النموذج (نص الرد، والاقتباسات، وسجل الخيط، وبيانات إعادة التوجيه الوصفية).

افتراضيًا، يعطي OpenClaw الأولوية لسلوك الدردشة الطبيعي ويُبقي السياق في الغالب كما تم استلامه. هذا يعني أن allowlists تحدد أساسًا من يمكنه تشغيل الإجراءات، وليست حدًا شاملًا للتنقيح لكل مقتطف مقتبس أو تاريخي.

<AccordionGroup>
  <Accordion title="السلوك الحالي خاص بكل قناة">
    - تطبق بعض القنوات بالفعل تصفية قائمة على المرسل للسياق الإضافي في مسارات محددة (على سبيل المثال تهيئة خيوط Slack، وعمليات بحث الرد/الخيط في Matrix).
    - لا تزال قنوات أخرى تمرر سياق الاقتباس/الرد/إعادة التوجيه كما تم استلامه.
  </Accordion>
  <Accordion title="اتجاه التحصين (مخطط له)">
    - `contextVisibility: "all"` (الافتراضي) يُبقي السلوك الحالي كما تم استلامه.
    - `contextVisibility: "allowlist"` يرشّح السياق الإضافي إلى المرسلين الموجودين في allowlist.
    - `contextVisibility: "allowlist_quote"` هو `allowlist` مع استثناء صريح واحد للاقتباس/الرد.

    إلى أن يتم تنفيذ نموذج التحصين هذا بشكل متّسق عبر القنوات، توقّع وجود اختلافات حسب السطح.

  </Accordion>
</AccordionGroup>

![تدفق رسائل المجموعات](/images/groups-flow.svg)

إذا كنت تريد...

| الهدف | ما الذي يجب ضبطه |
| -------------------------------------------- | ---------------------------------------------------------- |
| السماح بجميع المجموعات ولكن الرد فقط عند @mentions | `groups: { "*": { requireMention: true } }` |
| تعطيل جميع الردود في المجموعات | `groupPolicy: "disabled"` |
| مجموعات محددة فقط | `groups: { "<group-id>": { ... } }` (بدون المفتاح `"*"`) |
| أنت فقط من يمكنه التشغيل داخل المجموعات | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## مفاتيح الجلسة

- تستخدم جلسات المجموعات مفاتيح جلسة بصيغة `agent:<agentId>:<channel>:group:<id>` (وتستخدم الغرف/القنوات `agent:<agentId>:<channel>:channel:<id>`).
- تضيف موضوعات منتدى Telegram اللاحقة `:topic:<threadId>` إلى معرّف المجموعة بحيث يكون لكل موضوع جلسته الخاصة.
- تستخدم الدردشات المباشرة الجلسة الرئيسية (أو جلسة لكل مرسل إذا تم ضبط ذلك).
- يتم تخطي Heartbeat لجلسات المجموعات.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## النمط: الرسائل الخاصة الشخصية + المجموعات العامة (وكيل واحد)

نعم — يعمل هذا جيدًا إذا كانت حركة المرور "الشخصية" لديك هي **الرسائل الخاصة DMs** وكانت حركة المرور "العامة" لديك هي **المجموعات**.

السبب: في وضع الوكيل الواحد، تصل الرسائل الخاصة عادةً إلى مفتاح الجلسة **الرئيسي** (`agent:main:main`)، بينما تستخدم المجموعات دائمًا مفاتيح جلسة **غير رئيسية** (`agent:main:<channel>:group:<id>`). إذا فعّلت sandboxing باستخدام `mode: "non-main"`، فستعمل جلسات المجموعات هذه داخل backend الـ sandbox المكوّن بينما تبقى جلسة الرسائل الخاصة الرئيسية على المضيف. ويكون Docker هو backend الافتراضي إذا لم تختر واحدًا.

يمنحك هذا "عقل" وكيل واحد (مساحة عمل + ذاكرة مشتركتان)، ولكن بوضعيتين مختلفتين للتنفيذ:

- **الرسائل الخاصة DMs**: أدوات كاملة (المضيف)
- **المجموعات**: sandbox + أدوات مقيّدة

<Note>
إذا كنت تحتاج إلى مساحات عمل/شخصيات منفصلة فعليًا (بحيث لا يجب أن يختلط "الشخصي" و"العام" أبدًا)، فاستخدم وكيلًا ثانيًا + bindings. راجع [Multi-Agent Routing](/ar/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="الرسائل الخاصة DMs على المضيف، والمجموعات داخل sandbox">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // المجموعات/القنوات غير رئيسية -> داخل sandbox
            scope: "session", // أقوى عزل (حاوية واحدة لكل مجموعة/قناة)
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // إذا كانت allow غير فارغة، فسيتم حظر كل شيء آخر (ويظل deny هو الغالب).
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="لا ترى المجموعات سوى مجلد مدرج في allowlist">
    هل تريد "يمكن للمجموعات رؤية المجلد X فقط" بدلًا من "لا يوجد وصول إلى المضيف"؟ أبقِ `workspaceAccess: "none"` وقم بربط المسارات المدرجة في allowlist فقط داخل sandbox:

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
- تصحيح سبب حظر أداة: [Sandbox vs Tool Policy vs Elevated](/ar/gateway/sandbox-vs-tool-policy-vs-elevated)
- تفاصيل bind mounts: [Sandboxing](/ar/gateway/sandboxing#custom-bind-mounts)

## تسميات العرض

- تستخدم تسميات واجهة المستخدم `displayName` عند توفره، بتنسيق `<channel>:<token>`.
- `#room` محجوز للغرف/القنوات؛ وتستخدم الدردشات الجماعية `g-<slug>` (أحرف صغيرة، وتتحول المسافات إلى `-`، مع الإبقاء على `#@+._-`).

## سياسة المجموعات

تحكّم في كيفية التعامل مع رسائل المجموعات/الغرف لكل قناة:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // معرّف مستخدم Telegram رقمي (يمكن للمعالج resolve @username)
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
| ------------- | ------------------------------------------------------------ |
| `"open"` | تتجاوز المجموعات allowlists؛ ويظل تقييد الإشارات مطبقًا. |
| `"disabled"` | حظر جميع رسائل المجموعات بالكامل. |
| `"allowlist"` | السماح فقط للمجموعات/الغرف التي تطابق allowlist المكوّن. |

<AccordionGroup>
  <Accordion title="ملاحظات لكل قناة">
    - `groupPolicy` منفصل عن تقييد الإشارات (الذي يتطلب @mentions).
    - WhatsApp وTelegram وSignal وiMessage وMicrosoft Teams وZalo: استخدم `groupAllowFrom` (والبديل الاحتياطي: `allowFrom` الصريح).
    - تنطبق موافقات إقران الرسائل الخاصة (`*-allowFrom` store entries) على وصول الرسائل الخاصة فقط؛ أما تفويض مرسل المجموعة فيظل صريحًا من خلال allowlists الخاصة بالمجموعات.
    - Discord: يستخدم allowlist القيمة `channels.discord.guilds.<id>.channels`.
    - Slack: يستخدم allowlist القيمة `channels.slack.channels`.
    - Matrix: يستخدم allowlist القيمة `channels.matrix.groups`. يُفضَّل استخدام معرّفات الغرف أو الأسماء المستعارة؛ أما البحث عن أسماء الغرف المنضم إليها فهو best-effort، ويتم تجاهل الأسماء غير المحلولة وقت التشغيل. استخدم `channels.matrix.groupAllowFrom` لتقييد المرسلين؛ كما أن allowlists `users` لكل غرفة مدعومة أيضًا.
    - يتم التحكم في الرسائل الخاصة الجماعية Group DMs بشكل منفصل (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - يمكن لـ Telegram allowlist مطابقة معرّفات المستخدمين (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) أو أسماء المستخدمين (`"@alice"` أو `"alice"`); والبادئات غير حساسة لحالة الأحرف.
    - القيمة الافتراضية هي `groupPolicy: "allowlist"`؛ وإذا كان allowlist الخاص بالمجموعة فارغًا، فسيتم حظر رسائل المجموعة.
    - أمان وقت التشغيل: عندما تكون كتلة المزوّد مفقودة بالكامل (`channels.<provider>` غير موجودة)، تعود سياسة المجموعات إلى وضع fail-closed (عادةً `allowlist`) بدلًا من وراثة `channels.defaults.groupPolicy`.
  </Accordion>
</AccordionGroup>

نموذج ذهني سريع (ترتيب التقييم لرسائل المجموعات):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="allowlists الخاصة بالمجموعات">
    allowlists الخاصة بالمجموعات (`*.groups`, `*.groupAllowFrom`, والـ allowlist الخاص بالقناة).
  </Step>
  <Step title="تقييد الإشارات">
    تقييد الإشارات (`requireMention`, `/activation`).
  </Step>
</Steps>

## تقييد الإشارات (الافتراضي)

تتطلب رسائل المجموعات إشارة mention ما لم يتم تجاوز ذلك لكل مجموعة. توجد القيم الافتراضية لكل نظام فرعي ضمن `*.groups."*"`.

يُحتسب الرد على رسالة bot كإشارة ضمنية عندما تدعم القناة بيانات الرد الوصفية. كما يمكن أن يُحتسب اقتباس رسالة bot كإشارة ضمنية على القنوات التي تكشف بيانات الاقتباس الوصفية. تشمل الحالات المضمنة الحالية Telegram وWhatsApp وSlack وDiscord وMicrosoft Teams وZaloUser.

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
    - `mentionPatterns` هي أنماط regex آمنة وغير حساسة لحالة الأحرف؛ ويتم تجاهل الأنماط غير الصالحة وأشكال التكرار المتداخل غير الآمنة.
    - الأسطح التي توفر إشارات صريحة تظل تعمل؛ والأنماط هي بديل احتياطي.
    - تجاوز لكل وكيل: `agents.list[].groupChat.mentionPatterns` (مفيد عندما تتشارك عدة وكلاء مجموعة واحدة).
    - لا يتم فرض تقييد الإشارات إلا عندما يكون اكتشاف الإشارات ممكنًا (إشارات أصلية أو عند تكوين `mentionPatterns`).
    - المجموعات التي يُسمح فيها بالردود الصامتة تتعامل مع أدوار النموذج الفارغة النظيفة أو التي تحتوي على reasoning فقط على أنها صامتة، بما يعادل `NO_REPLY`. أما الدردشات المباشرة فما زالت تتعامل مع الردود الفارغة على أنها دور وكيل فاشل.
    - توجد القيم الافتراضية لـ Discord ضمن `channels.discord.guilds."*"` (ويمكن تجاوزها لكل guild/channel).
    - يتم تغليف سياق سجل المجموعات بشكل موحّد عبر القنوات وهو **pending-only** (الرسائل التي تم تخطيها بسبب تقييد الإشارات)؛ استخدم `messages.groupChat.historyLimit` كقيمة افتراضية عامة و`channels.<channel>.historyLimit` (أو `channels.<channel>.accounts.*.historyLimit`) للتجاوزات. اضبط القيمة على `0` للتعطيل.
  </Accordion>
</AccordionGroup>

## قيود أدوات المجموعة/القناة (اختياري)

تدعم بعض إعدادات القنوات تقييد الأدوات المتاحة **داخل مجموعة/غرفة/قناة محددة**.

- `tools`: السماح/المنع للأدوات على مستوى المجموعة بالكامل.
- `toolsBySender`: تجاوزات لكل مرسل داخل المجموعة. استخدم بادئات مفاتيح صريحة: `id:<senderId>` و`e164:<phone>` و`username:<handle>` و`name:<displayName>` والرمز العام `"*"`. لا تزال المفاتيح القديمة غير المسبوقة مقبولة وتُطابق على أنها `id:` فقط.

ترتيب الحلّ (الأكثر تحديدًا يفوز):

<Steps>
  <Step title="Group toolsBySender">
    مطابقة `toolsBySender` للمجموعة/القناة.
  </Step>
  <Step title="Group tools">
    `tools` للمجموعة/القناة.
  </Step>
  <Step title="Default toolsBySender">
    مطابقة `toolsBySender` الافتراضية (`"*"`).
  </Step>
  <Step title="Default tools">
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
تُطبَّق قيود أدوات المجموعة/القناة بالإضافة إلى سياسة الأدوات العامة/سياسة الوكيل (ويظل `deny` هو الغالب). تستخدم بعض القنوات مستويات تعشيق مختلفة للغرف/القنوات (مثل Discord `guilds.*.channels.*` وSlack `channels.*` وMicrosoft Teams `teams.*.channels.*`).
</Note>

## allowlists الخاصة بالمجموعات

عند تكوين `channels.whatsapp.groups` أو `channels.telegram.groups` أو `channels.imessage.groups`، تعمل المفاتيح بوصفها allowlist للمجموعات. استخدم `"*"` للسماح بجميع المجموعات مع الاستمرار في ضبط سلوك الإشارة الافتراضي.

<Warning>
التباس شائع: موافقة إقران الرسائل الخاصة DM ليست هي نفسها تفويض المجموعة. بالنسبة إلى القنوات التي تدعم إقران الرسائل الخاصة، يفتح مخزن الإقران الرسائل الخاصة فقط. ولا تزال أوامر المجموعة تتطلب تفويضًا صريحًا لمرسل المجموعة من allowlists الإعدادات مثل `groupAllowFrom` أو البديل الاحتياطي الموثّق في الإعدادات لتلك القناة.
</Warning>

النيات الشائعة (نسخ/لصق):

<Tabs>
  <Tab title="تعطيل جميع الردود في المجموعات">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="السماح لمجموعات محددة فقط (WhatsApp)">
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
  <Tab title="السماح بجميع المجموعات ولكن مع اشتراط الإشارة">
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
  <Tab title="تشغيل من المالك فقط (WhatsApp)">
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

يُحدَّد المالك بواسطة `channels.whatsapp.allowFrom` (أو E.164 الذاتي الخاص بالـ bot عند عدم ضبطه). أرسل الأمر كرسالة مستقلة. وتتجاهل الأسطح الأخرى حاليًا `/activation`.

## حقول السياق

تضبط حمولات الإدخال الخاصة بالمجموعات ما يلي:

- `ChatType=group`
- `GroupSubject` (إذا كان معروفًا)
- `GroupMembers` (إذا كان معروفًا)
- `WasMentioned` (نتيجة تقييد الإشارات)
- تتضمن موضوعات منتدى Telegram أيضًا `MessageThreadId` و`IsForum`.

ملاحظات خاصة بالقنوات:

- يمكن لـ BlueBubbles اختياريًا إثراء المشاركين غير المسمّين في مجموعات macOS من قاعدة بيانات جهات الاتصال المحلية قبل تعبئة `GroupMembers`. هذا معطّل افتراضيًا ولا يعمل إلا بعد اجتياز تقييد المجموعة العادي.

يتضمن system prompt الخاص بالوكيل مقدمة للمجموعة في أول دور من جلسة مجموعة جديدة. ويذكّر النموذج بالرد مثل إنسان، وتجنب جداول Markdown، وتقليل الأسطر الفارغة، واتباع تباعد الدردشة العادي، وتجنب كتابة تسلسلات `\n` الحرفية. وتُعرض أسماء المجموعات وتسميات المشاركين المستمدة من القناة كبيانات وصفية غير موثوقة داخل fenced code blocks، وليس كتعليمات نظام مضمنة.

## تفاصيل iMessage

- يُفضَّل `chat_id:<id>` عند التوجيه أو الإدراج في allowlist.
- لسرد الدردشات: `imsg chats --limit 20`.
- تعود ردود المجموعات دائمًا إلى `chat_id` نفسه.

## system prompts الخاصة بـ WhatsApp

راجع [WhatsApp](/ar/channels/whatsapp#system-prompts) للاطلاع على القواعد المرجعية الخاصة بـ system prompt في WhatsApp، بما في ذلك حلّ prompt للمجموعات والرسائل المباشرة، وسلوك wildcard، ودلالات تجاوزات الحساب.

## تفاصيل WhatsApp

راجع [Group messages](/ar/channels/group-messages) للاطلاع على السلوك الخاص بـ WhatsApp فقط (حقن السجل، وتفاصيل التعامل مع الإشارات).

## ذو صلة

- [Broadcast groups](/ar/channels/broadcast-groups)
- [Channel routing](/ar/channels/channel-routing)
- [Group messages](/ar/channels/group-messages)
- [Pairing](/ar/channels/pairing)

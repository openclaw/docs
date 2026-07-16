---
read_when:
    - تريد ربط روبوت Feishu/Lark
    - أنت تقوم بإعداد قناة Feishu
summary: نظرة عامة على روبوت Feishu وميزاته وإعداده
title: Feishu
x-i18n:
    generated_at: "2026-07-16T13:18:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 007f3db63fe70b9e7f0267043e47555af7dd55e73c8fd78156b1c9190360b858
    source_path: channels/feishu.md
    workflow: 16
---

يتصل OpenClaw بمنصة Feishu/Lark (منصة التعاون المتكاملة) من خلال Plugin الرسمي `@openclaw/feishu`: الرسائل المباشرة مع البوت، ومحادثات المجموعات، وردود البطاقات المتدفقة، وأدوات مستندات Feishu والويكي والتخزين السحابي وBitable.

**الحالة:** جاهز للإنتاج للرسائل المباشرة مع البوت ومحادثات المجموعات. يُعد WebSocket وسيلة نقل الأحداث الافتراضية (ولا يلزم عنوان URL عام)؛ ووضع Webhook اختياري.

## البدء السريع

<Note>
يتطلب OpenClaw 2026.5.29 أو إصدارًا أحدث. شغّل `openclaw --version` للتحقق. رقِّ باستخدام `openclaw update`.
</Note>

<Steps>
  <Step title="تشغيل معالج إعداد القناة">
  ```bash
  openclaw channels login --channel feishu
  ```
  يؤدي هذا إلى تثبيت Plugin `@openclaw/feishu` إذا لم يكن موجودًا، ثم يرشدك خلال الإعداد:

- **الإعداد اليدوي**: الصق App ID وApp Secret من Feishu Open Platform ‏(`https://open.feishu.cn`) أو Lark Developer ‏(`https://open.larksuite.com`).
- **الإعداد عبر رمز QR**: امسح رمز QR ضوئيًا في تطبيق Feishu لإنشاء بوت تلقائيًا. تقصر هذه العملية الرسائل المباشرة على حسابك فقط (`dmPolicy: "allowlist"` باستخدام `open_id` الخاص بك).

يسألك المعالج أيضًا عن نطاق API ‏(Feishu أم Lark) وسياسة المجموعة. إذا لم يتفاعل تطبيق Feishu المحلي على الهاتف المحمول مع رمز QR، فأعد تشغيل الإعداد واختر الإعداد اليدوي.
</Step>

  <Step title="بعد اكتمال الإعداد، أعد تشغيل Gateway لتطبيق التغييرات">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

## التحكم في الوصول

### الرسائل المباشرة

اضبط `channels.feishu.dmPolicy` (الافتراضي: `pairing`) للتحكم في مَن يمكنه إرسال رسالة مباشرة إلى البوت:

| القيمة         | السلوك                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| `"pairing"`   | يتلقى المستخدمون غير المعروفين رمز إقران؛ وافق عليه عبر CLI                                                         |
| `"allowlist"` | لا يمكن الدردشة إلا للمستخدمين المدرجين في `allowFrom`                                                                     |
| `"open"`      | رسائل مباشرة عامة؛ يتطلب التحقق من صحة الإعدادات أن يتضمن `allowFrom` القيمة `"*"`. وتظل الإدخالات التي لا تستخدم حرف بدل تضيّق نطاق الوصول |

**الموافقة على طلب إقران:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### محادثات المجموعات

**سياسة المجموعة** (`channels.feishu.groupPolicy`، الافتراضي: `allowlist`):

| القيمة         | السلوك                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | الرد على جميع الرسائل في المجموعات                                                            |
| `"allowlist"` | الرد فقط على المجموعات الموجودة في `groupAllowFrom` أو المضبوطة صراحةً ضمن `groups.<chat_id>` |
| `"disabled"`  | تعطيل جميع رسائل المجموعات؛ لا تتجاوز إدخالات `groups.<chat_id>` الصريحة هذا الإعداد         |

**اشتراط الإشارة** (`channels.feishu.requireMention`):

- الافتراضي: يلزم توجيه @إشارة، إلا عندما تكون سياسة المجموعة الفعلية هي `"open"`؛ إذ تكون القيمة الافتراضية هناك `false` كي تظل الرسائل التي لا يمكن أن تتضمن إشارات (مثل الصور) تصل إلى الوكيل.
- اضبط `true` أو `false` صراحةً للتجاوز؛ والتجاوز لكل مجموعة هو: `channels.feishu.groups.<chat_id>.requireMention`.
- لا تُعامل إشارتا البث فقط `@all` و`@_all` على أنهما إشارتان إلى البوت. وتظل الرسالة التي تشير إلى كل من `@all` والبوت مباشرةً محسوبةً كإشارة إلى البوت.

## أمثلة على إعداد المجموعات

### السماح بجميع المجموعات، دون اشتراط @إشارة

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open", // القيمة الافتراضية لـ requireMention هي false ضمن "open"
    },
  },
}
```

### السماح بجميع المجموعات، مع استمرار اشتراط @إشارة

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### السماح بمجموعات محددة فقط

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // تبدو معرّفات المجموعات على النحو التالي: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

في وضع `allowlist`، يمكنك أيضًا قبول مجموعة بإضافة إدخال `groups.<chat_id>` صريح. لا تتجاوز الإدخالات الصريحة `groupPolicy: "disabled"`. تضبط الإعدادات الافتراضية ذات حرف البدل ضمن `groups.*` المجموعات المطابقة، لكنها لا تقبل المجموعات بمفردها.

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groups: {
        oc_xxx: {
          requireMention: false,
        },
      },
    },
  },
}
```

### تقييد المرسلين داخل مجموعة

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // تبدو قيم open_id للمستخدمين على النحو التالي: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

يضبط `channels.feishu.groupSenderAllowFrom` قائمة السماح نفسها للمرسلين في جميع المجموعات؛ ويكون لـ `allowFrom` الخاص بكل مجموعة الأولوية.

<a id="get-groupuser-ids"></a>

## الحصول على معرّفات المجموعات والمستخدمين

### معرّفات المجموعات (`chat_id`، التنسيق: `oc_xxx`)

افتح المجموعة في Feishu/Lark، وانقر على أيقونة القائمة في الزاوية العلوية اليمنى، ثم انتقل إلى **Settings**. يُدرج معرّف المجموعة (`chat_id`) في صفحة الإعدادات.

![الحصول على معرّف المجموعة](/images/feishu-get-group-id.png)

### معرّفات المستخدمين (`open_id`، التنسيق: `ou_xxx`)

شغّل Gateway، وأرسل رسالة مباشرة إلى البوت، ثم تحقق من السجلات:

```bash
openclaw logs --follow
```

ابحث عن `open_id` في مخرجات السجل. يمكنك أيضًا التحقق من طلبات الإقران المعلقة:

```bash
openclaw pairing list feishu
```

## الأوامر الشائعة

| الأمر   | الوصف                 |
| --------- | --------------------------- |
| `/status` | عرض حالة البوت             |
| `/reset`  | إعادة تعيين الجلسة الحالية   |
| `/model`  | عرض نموذج الذكاء الاصطناعي أو تبديله |

<Note>
لا يدعم Feishu/Lark قوائم أوامر الشرطة المائلة الأصلية، لذا أرسل هذه الأوامر كرسائل نصية عادية.
</Note>

## استكشاف الأخطاء وإصلاحها

### لا يستجيب البوت في محادثات المجموعات

1. تأكد من إضافة البوت إلى المجموعة
2. تأكد من توجيه @إشارة إلى البوت (مطلوب افتراضيًا)
3. تحقق من أن `groupPolicy` ليس `"disabled"`
4. تحقق من السجلات: `openclaw logs --follow`

### لا يتلقى البوت الرسائل

1. تأكد من نشر البوت والموافقة عليه في Feishu Open Platform / Lark Developer
2. تأكد من أن اشتراك الأحداث يتضمن `im.message.receive_v1`
3. تأكد من تحديد **persistent connection** ‏(WebSocket)
4. تأكد من منح جميع نطاقات الأذونات المطلوبة
5. تأكد من تشغيل Gateway: ‏`openclaw gateway status`
6. تحقق من السجلات: `openclaw logs --follow`

### لا يتفاعل إعداد رمز QR في تطبيق Feishu على الهاتف المحمول

1. أعد تشغيل الإعداد: `openclaw channels login --channel feishu`
2. اختر الإعداد اليدوي
3. أنشئ تطبيقًا ذاتي الإنشاء في Feishu Open Platform وانسخ App ID وApp Secret الخاصين به
4. الصق بيانات الاعتماد هذه في معالج الإعداد

### تسرّب App Secret

1. أعد تعيين App Secret في Feishu Open Platform / Lark Developer
2. حدّث القيمة في إعداداتك
3. أعد تشغيل Gateway: ‏`openclaw gateway restart`

## الإعداد المتقدم

### حسابات متعددة

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "البوت الأساسي",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "البوت الاحتياطي",
          enabled: false,
        },
      },
    },
  },
}
```

يتحكم `defaultAccount` في الحساب المستخدم عندما لا تحدد واجهات API الصادرة `accountId`. ترث إدخالات الحساب إعدادات المستوى الأعلى؛ ويمكن تجاوز معظم مفاتيح المستوى الأعلى لكل حساب.
يستخدم `accounts.<id>.tts` البنية نفسها التي يستخدمها `messages.tts`، ويُدمج بعمق فوق إعداد TTS العام، بحيث يمكن لإعدادات Feishu متعددة البوتات إبقاء بيانات اعتماد المزوّد المشتركة عامةً مع تجاوز الصوت أو النموذج أو الشخصية أو الوضع التلقائي فقط لكل حساب.

### حدود الرسائل

- `textChunkLimit` - حجم جزء النص الصادر (الافتراضي: `4000` حرفًا)
- `streaming.chunkMode` - يقسم `"length"` (الافتراضي) عند الحد؛ ويفضل `"newline"` حدود الأسطر الجديدة
- `mediaMaxMb` - حد رفع الوسائط وتنزيلها (الافتراضي: `30` ميغابايت)

### التدفق

يدعم Feishu/Lark الردود المتدفقة عبر البطاقات التفاعلية (واجهة Card Kit للتدفق). عند التمكين، يحدّث البوت البطاقة في الوقت الفعلي أثناء إنشاء النص.

```json5
{
  channels: {
    feishu: {
      streaming: {
        mode: "partial", // مخرجات بطاقة متدفقة (الافتراضي: "partial")
        block: { enabled: true }, // الاشتراك في تدفق الكتل المكتملة
      },
    },
  },
}
```

اضبط `streaming.mode: "off"` لإرسال الرد الكامل في رسالة واحدة؛ كما يعطّل `renderMode: "raw"` (نص عادي بدلًا من البطاقات) البطاقات المتدفقة. يكون `streaming.block.enabled` معطلًا افتراضيًا؛ ولا تمكّنه إلا عندما تريد إرسال كتل المساعد المكتملة قبل الرد النهائي. تُرحّل القيمة المنطقية القديمة `streaming` والمفاتيح المسطحة `blockStreaming` / `blockStreamingCoalesce` / `chunkMode` إلى هذه البنية المتداخلة عبر `openclaw doctor --fix`.

### تحسين الحصة

قلّل عدد استدعاءات API الخاصة بـ Feishu/Lark باستخدام علامتين اختياريتين:

- `typingIndicator` (الافتراضي `true`): اضبط `false` لتخطي استدعاءات تفاعل الكتابة
- `resolveSenderNames` (الافتراضي `true`): اضبط `false` لتخطي عمليات البحث عن الملف الشخصي للمرسل

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### نطاق جلسة المجموعة وسلاسل المواضيع

يتحكم `channels.feishu.groupSessionScope` (على المستوى الأعلى أو لكل حساب أو لكل مجموعة) في كيفية تعيين رسائل المجموعة إلى جلسات الوكيل:

| القيمة                  | الجلسة                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| `"group"` (الافتراضي)    | جلسة واحدة لكل محادثة مجموعة                                       |
| `"group_sender"`       | جلسة واحدة لكل (مجموعة + مرسل)                                 |
| `"group_topic"`        | جلسة واحدة لكل سلسلة موضوع؛ وترجع إلى جلسة المجموعة عند التعذر    |
| `"group_topic_sender"` | جلسة واحدة لكل (موضوع + مرسل)؛ وترجع إلى (مجموعة + مرسل) عند التعذر |

بالنسبة إلى نطاقات المواضيع، تستخدم مجموعات المواضيع الأصلية في Feishu/Lark الحدث `thread_id` ‏(`omt_*`) بوصفه مفتاح جلسة الموضوع الأساسي. إذا أغفل حدث بدء موضوع أصلي `thread_id`، فإن OpenClaw يجلبه من Feishu قبل توجيه الدور. تواصل ردود المجموعات العادية التي يحولها OpenClaw إلى سلاسل استخدام معرّف الرسالة الجذرية للرد (`om_*`) كي يظل الدور الأول والأدوار اللاحقة في الجلسة نفسها.

اضبط `replyInThread: "enabled"` (على المستوى الأعلى أو لكل مجموعة) لجعل ردود البوت تنشئ سلسلة موضوع في Feishu أو تتابعها بدلًا من الرد داخل السياق. يُعد `topicSessionMode` السلف المهمل لـ `groupSessionScope`؛ ويُفضّل `groupSessionScope`.

### أدوات مساحة عمل Feishu

يوفر Plugin أدوات للوكيل خاصة بمستندات Feishu والمحادثات وقاعدة المعرفة والتخزين السحابي والأذونات وBitable، بالإضافة إلى Skills المطابقة (`feishu-doc`، `feishu-drive`، `feishu-perm`، `feishu-wiki`). تخضع عائلات الأدوات للتحكم بواسطة `channels.feishu.tools`:

| المفتاح             | الأدوات                                         | القيمة الافتراضية             |
| --------------- | --------------------------------------------- | ------------------- |
| `tools.doc`     | عمليات المستندات في `feishu_doc`              | `true`              |
| `tools.chat`    | معلومات الدردشة واستعلامات الأعضاء في `feishu_chat`      | `true`              |
| `tools.wiki`    | قاعدة المعرفة في `feishu_wiki` (تتطلب `doc`) | `true`              |
| `tools.drive`   | التخزين السحابي في `feishu_drive`                  | `true`              |
| `tools.perm`    | إدارة الأذونات في `feishu_perm`           | `false` (حساس) |
| `tools.scopes`  | تشخيص نطاق التطبيق في `feishu_app_scopes`     | `true`              |
| `tools.bitable` | عمليات Bitable/Base في `feishu_bitable_*`    | `true`              |

يمثل `tools.base` اسمًا مستعارًا لـ `tools.bitable`؛ وتتغلب قيمة `bitable` الصريحة عند تعيين كليهما. توجد بوابات كل حساب ضمن `accounts.<id>.tools`.

امنح `drive:drive.metadata:readonly` لإجراء عمليات بحث مباشرة عن `feishu_drive info` خارج الدليل الجذر،
ما لم يكن التطبيق يمتلك بالفعل نطاق `drive:drive` الكامل. من دون أيٍّ من النطاقين، يُبقي `info`
البحث القديم في الدليل الجذر متاحًا عبر `drive:drive:readonly`.

### جلسات ACP

يدعم Feishu/Lark بروتوكول ACP للرسائل المباشرة ورسائل سلاسل المجموعات. يعتمد ACP في Feishu/Lark على الأوامر النصية، ولا توجد قوائم أصلية لأوامر الشرطة المائلة، لذا استخدم رسائل `/acp ...` مباشرةً في المحادثة.

#### ربط ACP دائم

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### إنشاء ACP من الدردشة

في رسالة مباشرة أو سلسلة على Feishu/Lark:

```text
/acp spawn codex --thread here
```

يعمل `--thread here` مع الرسائل المباشرة ورسائل سلاسل Feishu/Lark. تُوجَّه رسائل المتابعة في المحادثة المرتبطة مباشرةً إلى جلسة ACP تلك.

### التوجيه متعدد الوكلاء

استخدم `bindings` لتوجيه الرسائل المباشرة أو المجموعات في Feishu/Lark إلى وكلاء مختلفين.

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

حقول التوجيه:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (رسالة مباشرة) أو `"group"` (دردشة جماعية)
- `match.peer.id`: معرّف Open ID للمستخدم (`ou_xxx`) أو معرّف المجموعة (`oc_xxx`)

راجع [الحصول على معرّفات المجموعة/المستخدم](#get-groupuser-ids) للاطلاع على نصائح البحث.

## عزل الوكيل لكل مستخدم (إنشاء الوكيل الديناميكي)

فعّل `dynamicAgentCreation` لإنشاء **نسخ وكلاء معزولة** تلقائيًا لكل مستخدم للرسائل المباشرة. يحصل كل مستخدم على ما يلي:

- دليل مساحة عمل مستقل
- `USER.md` / `SOUL.md` / `MEMORY.md` منفصلة
- سجل محادثات خاص
- Skills وحالة معزولتان

هذا ضروري للروبوتات العامة عندما تريد أن يحظى كل مستخدم بتجربة مساعد ذكاء اصطناعي خاصة به.

<Note>
تتضمن الروابط الديناميكية قيمة Feishu الموحّدة `accountId`، بحيث توجّه الحسابات الافتراضية والمسمّاة كل مرسل إلى الوكيل الديناميكي الصحيح.

إذا أنشأ حساب مسمّى وكيلاً ديناميكيًا غير محدد النطاق في إصدار أقدم، فسيظل ذلك الوكيل القديم محسوبًا ضمن `maxAgents`. تأكد من أن الحساب الافتراضي لا يستخدمه قبل إزالته، أو زِد `maxAgents` مؤقتًا؛ لا يستطيع OpenClaw الاستدلال بأمان على الحساب الذي يملك الحالة القديمة الملتبسة.
</Note>

### الإعداد السريع

```json5
{
  channels: {
    feishu: {
      dmPolicy: "open",
      allowFrom: ["*"],
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // مهم: يجعل الرسائل المباشرة لكل مستخدم «جلسته الرئيسية»
    // يحمّل USER.md / SOUL.md / MEMORY.md تلقائيًا
    // لعزل أقوى، استخدم "per-channel-peer" بدلًا منه
    dmScope: "main",
  },
}
```

### آلية العمل

عندما يرسل مستخدم جديد رسالته المباشرة الأولى:

1. تُنشئ القناة `agentId` فريدًا: `feishu-{user_open_id}` للحساب الافتراضي، أو ملخص هوية محدودًا مسبوقًا بالحساب لحساب مُسمّى
2. تُنشئ مساحة عمل جديدة في مسار `workspaceTemplate`
3. تُسجّل الوكيل وتُنشئ ارتباطًا لهذا المستخدم
4. يضمن مساعد مساحة العمل وجود ملفات التمهيد (`AGENTS.md` و`SOUL.md` و`USER.md` وغيرها) عند الوصول الأول
5. تُوجّه جميع الرسائل المستقبلية من هذا المستخدم إلى وكيله المخصص

### خيارات الإعداد

| الإعداد                                                  | الوصف                                | القيمة الافتراضية                              |
| -------------------------------------------------------- | ------------------------------------------ | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | تفعيل الإنشاء التلقائي لوكيل لكل مستخدم   | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | قالب مسار مساحات عمل الوكلاء الديناميكيين | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | قالب اسم دليل الوكيل              | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | الحد الأقصى لعدد الوكلاء الديناميكيين المراد إنشاؤهم | غير محدود                            |

متغيرات القالب:

- `{agentId}` - معرّف الوكيل المُنشأ (مثل `feishu-ou_xxxxxx` أو `feishu-support-<identity_digest>`)
- `{userId}` - معرّف Feishu المفتوح للمرسل (مثل `ou_xxxxxx`)

### نطاق الجلسة

يتحكم `session.dmScope` في كيفية ربط الرسائل المباشرة بجلسات الوكيل. هذا **إعداد عام** يؤثر في جميع القنوات.

| القيمة                        | السلوك                                                            | الأنسب لـ                                                           |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `"main"`                     | تُربط الرسالة المباشرة لكل مستخدم بالجلسة الرئيسية لوكيله                   | روبوتات المستخدم الواحد التي تريد فيها تحميل `USER.md` / `SOUL.md` تلقائيًا |
| `"per-peer"`                 | يحصل كل نظير على جلسة منفصلة (بغض النظر عن القناة)           | العزل المستند إلى هوية المرسل فقط                            |
| `"per-channel-peer"`         | تحصل كل تركيبة (القناة + المستخدم) على جلسة منفصلة           | روبوتات عامة متعددة المستخدمين تحتاج إلى عزل أقوى                  |
| `"per-account-channel-peer"` | تحصل كل تركيبة (الحساب + القناة + المستخدم) على جلسة منفصلة | روبوتات متعددة الحسابات تحتاج إلى عزل الجلسات على مستوى الحساب         |

**المقايضة**: يتيح استخدام `"main"` التحميل التلقائي لملفات التمهيد (`USER.md` و`SOUL.md` و`MEMORY.md`)، لكنه يعني أن جميع الرسائل المباشرة عبر جميع القنوات تشترك في نمط مفتاح الجلسة نفسه. بالنسبة إلى الروبوتات العامة متعددة المستخدمين التي يكون فيها العزل أهم من التحميل التلقائي لملفات التمهيد، يُنصح باستخدام `"per-channel-peer"` وإدارة ملفات التمهيد يدويًا.

<Note>
استخدم `"per-account-channel-peer"` عندما ينبغي لحسابات Feishu المسماة الاحتفاظ بجلسات منفصلة للمرسل نفسه. تحافظ الارتباطات الديناميكية على نطاق الحساب.
</Note>

### نشر نموذجي متعدد المستخدمين

```json5
{
  channels: {
    feishu: {
      appId: "cli_xxx",
      appSecret: "xxx",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "open",
      requireMention: true,
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // اختر dmScope بناءً على احتياجات العزل لديك:
    // "main" للتحميل التلقائي للتهيئة الأولية، و"per-channel-peer" لعزل أقوى
    dmScope: "main",
  },
  bindings: [], // فارغة - ترتبط الوكلاء الديناميكيون تلقائيًا
}
```

### التحقق

تحقق من سجلات Gateway للتأكد من أن الإنشاء الديناميكي يعمل:

```text
feishu: جارٍ إنشاء الوكيل الديناميكي "feishu-ou_xxxxxx" للمستخدم ou_xxxxxx
  مساحة العمل: /home/user/.openclaw/workspace-feishu-ou_xxxxxx
  دليل الوكيل: /home/user/.openclaw/agents/feishu-ou_xxxxxx/agent
```

اعرض جميع مساحات العمل التي أُنشئت:

```bash
ls -la ~/.openclaw/workspace-*
```

### ملاحظات

- **عزل مساحة العمل**: يحصل كل مستخدم على دليل مساحة عمل ومثيل وكيل خاصين به. لا يمكن للمستخدمين رؤية سجل محادثات بعضهم أو ملفاتهم ضمن تدفق المراسلة المعتاد.
- **حدود الأمان**: هذه آلية لعزل سياق المراسلة، وليست حدود أمان بين مستأجرين مشتركين عدائيين. تشترك الحسابات في عملية الوكيل وبيئة المضيف.
- **يجب إبقاء الكتابة إلى الإعدادات مفعّلة**: يكتب إنشاء الوكلاء الديناميكيين الوكلاء والارتباطات في الإعدادات؛ ويُتخطى عندما تكون `channels.feishu.configWrites` بالقيمة `false` (الافتراضي: مفعّل).
- **يجب أن يكون `bindings` فارغًا**: تسجّل الوكلاء الديناميكية ارتباطاتها تلقائيًا
- **مسار الترقية**: تستمر الارتباطات اليدوية الحالية في العمل إلى جانب الوكلاء الديناميكيين
- **`session.dmScope` عام**: يؤثر هذا في جميع القنوات، وليس Feishu فقط

## مرجع الإعدادات

الإعدادات الكاملة: [إعدادات Gateway](/ar/gateway/configuration)

| الإعداد                                                  | الوصف                                                                          | القيمة الافتراضية                              |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| `channels.feishu.enabled`                                | تفعيل/تعطيل القناة                                                           | `true`                               |
| `channels.feishu.domain`                                 | نطاق API ‏(`feishu` أو `lark` أو عنوان URL أساسي من `https://`)                             | `feishu`                             |
| `channels.feishu.connectionMode`                         | نقل الأحداث (`websocket` أو `webhook`)                                           | `websocket`                          |
| `channels.feishu.defaultAccount`                         | الحساب الافتراضي للتوجيه الصادر                                                 | `default`                            |
| `channels.feishu.verificationToken`                      | مطلوب لوضع Webhook                                                            | -                                    |
| `channels.feishu.encryptKey`                             | مطلوب لوضع Webhook                                                            | -                                    |
| `channels.feishu.webhookPath`                            | مسار توجيه Webhook                                                                   | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | مضيف ربط Webhook                                                                    | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | منفذ ربط Webhook                                                                    | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | معرّف التطبيق                                                                               | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | سر التطبيق                                                                           | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | تجاوز النطاق لكل حساب                                                          | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | تجاوز TTS لكل حساب                                                             | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | سياسة الرسائل المباشرة (`pairing`، `allowlist`، `open`)                                           | `pairing`                            |
| `channels.feishu.allowFrom`                              | قائمة السماح للرسائل المباشرة (قائمة open_id)                                                          | -                                    |
| `channels.feishu.groupPolicy`                            | سياسة المجموعات (`open`، `allowlist`، `disabled`)                                       | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | قائمة السماح للمجموعات                                                                      | -                                    |
| `channels.feishu.groupSenderAllowFrom`                   | قائمة سماح للمرسلين تُطبَّق على جميع المجموعات                                               | -                                    |
| `channels.feishu.requireMention`                         | اشتراط الإشارة باستخدام @ في المجموعات                                                           | `true` (`false` عندما تكون السياسة `open`)  |
| `channels.feishu.groups.<chat_id>.requireMention`        | تجاوز اشتراط الإشارة باستخدام @ لكل مجموعة؛ كما تسمح المعرّفات الصريحة للمجموعة في وضع قائمة السماح     | موروث                            |
| `channels.feishu.groups.<chat_id>.enabled`               | تفعيل/تعطيل مجموعة محددة                                                      | `true`                               |
| `channels.feishu.groups.<chat_id>.allowFrom`             | قائمة سماح للمرسلين لكل مجموعة (تتجاوز `groupSenderAllowFrom`)                        | -                                    |
| `channels.feishu.groupSessionScope`                      | تعيين جلسات المجموعات (`group`، `group_sender`، `group_topic`، `group_topic_sender`) | `group`                              |
| `channels.feishu.replyInThread`                          | تُنشئ ردود البوت سلاسل مواضيع أو تتابعها (`disabled`، `enabled`)                    | `disabled`                           |
| `channels.feishu.reactionNotifications`                  | أحداث التفاعلات الواردة (`off`، `own`، `all`)                                        | `own`                                |
| `channels.feishu.dynamicAgentCreation.enabled`           | تفعيل الإنشاء التلقائي لوكيل لكل مستخدم                                             | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | قالب المسار لمساحات عمل الوكلاء الديناميكيين                                           | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | قالب اسم دليل الوكيل                                                        | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | الحد الأقصى لعدد الوكلاء الديناميكيين المراد إنشاؤهم                                           | غير محدود                            |
| `channels.feishu.textChunkLimit`                         | حجم مقطع الرسالة                                                                   | `4000`                               |
| `channels.feishu.streaming.chunkMode`                    | تقسيم المقاطع (`length` أو `newline`)                                              | `length`                             |
| `channels.feishu.mediaMaxMb`                             | حد حجم الوسائط                                                                     | `30`                                 |
| `channels.feishu.renderMode`                             | عرض الرد (`auto`، `raw`، `card`)                                              | `auto`                               |
| `channels.feishu.streaming.mode`                         | إخراج البطاقات المتدفق (`partial` أو `off`)                                           | `partial`                            |
| `channels.feishu.streaming.block.enabled`                | بث ردود الكتل المكتملة                                                      | `false`                              |
| `channels.feishu.typingIndicator`                        | إرسال تفاعلات الكتابة                                                                | `true`                               |
| `channels.feishu.resolveSenderNames`                     | استيضاح أسماء عرض المرسلين                                                         | `true`                               |
| `channels.feishu.configWrites`                           | السماح للقناة ببدء عمليات كتابة الإعدادات (مطلوب للوكلاء الديناميكيين)                     | `true`                               |
| `channels.feishu.tools.doc`                              | تفعيل أدوات المستندات                                                                | `true`                               |
| `channels.feishu.tools.chat`                             | تفعيل أدوات معلومات الدردشة                                                               | `true`                               |
| `channels.feishu.tools.wiki`                             | تفعيل أدوات قاعدة المعرفة (يتطلب `doc`)                                         | `true`                               |
| `channels.feishu.tools.drive`                            | تفعيل أدوات التخزين السحابي                                                           | `true`                               |
| `channels.feishu.tools.perm`                             | تفعيل أدوات إدارة الأذونات                                                   | `false`                              |
| `channels.feishu.tools.scopes`                           | تفعيل أداة تشخيص نطاقات التطبيق                                                    | `true`                               |
| `channels.feishu.tools.bitable`                          | تفعيل أدوات Bitable/Base                                                            | `true`                               |
| `channels.feishu.tools.base`                             | اسم مستعار لـ `channels.feishu.tools.bitable`؛ تكون الأولوية للقيمة الصريحة `bitable` عند تعيين كليهما     | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | بوابة أدوات Bitable/Base لكل حساب                                                   | موروث                            |
| `channels.feishu.accounts.<id>.tools.base`               | اسم مستعار لكل حساب لـ `tools.bitable`                                                | موروث                            |

## أنواع الرسائل المدعومة

### الاستقبال

- ✅ النص
- ✅ النص المنسّق (منشور)
- ✅ الصور
- ✅ الملفات
- ✅ الصوت
- ✅ الفيديو/الوسائط
- ✅ الملصقات

تُطبَّع رسائل Feishu/Lark الصوتية الواردة على هيئة عناصر نائبة للوسائط بدلًا
من بيانات JSON خام من `file_key`. عند تكوين `tools.media.audio`، ينزّل OpenClaw
مورد الملاحظة الصوتية ويشغّل النسخ الصوتي المشترك قبل دور
الوكيل، بحيث يتلقى الوكيل النص المنطوق المنسوخ. إذا ضمّن Feishu
نص النسخ مباشرةً في حمولة الصوت، يُستخدم ذلك النص دون
استدعاء ASR آخر. في غياب موفّر للنسخ الصوتي، يظل الوكيل يتلقى
العنصر النائب `<media:audio>` مع المرفق المحفوظ، وليس حمولة
مورد Feishu الخام.

### الإرسال

- ✅ النص
- ✅ الصور
- ✅ الملفات
- ✅ الصوت
- ✅ الفيديو/الوسائط
- ✅ البطاقات التفاعلية (بما في ذلك التحديثات المتدفقة)
- ⚠️ النص المنسّق (تنسيق بأسلوب المنشورات؛ لا يدعم إمكانات التأليف الكاملة في Feishu/Lark)

تستخدم فقاعات الصوت الأصلية في Feishu/Lark نوع الرسائل `audio` في Feishu وتتطلب
وسائط رفع Ogg/Opus ‏(`file_type: "opus"`). تُرسل وسائط `.opus` و`.ogg`
الموجودة مباشرةً كصوت أصلي. تُحوَّل صيغ MP3/WAV/M4A وغيرها من صيغ الصوت المحتملة
إلى Ogg/Opus بتردد 48kHz باستخدام `ffmpeg` فقط عندما يطلب الرد التسليم
الصوتي (`audioAsVoice` / أداة الرسائل `asVoice`، بما في ذلك ردود الملاحظات
الصوتية عبر TTS). تظل مرفقات MP3 العادية ملفات عادية. إذا كان `ffmpeg` مفقودًا أو
فشل التحويل، يعود OpenClaw إلى استخدام مرفق ملف ويسجّل السبب.

### سلاسل المواضيع والردود

- ✅ الردود المضمنة
- ✅ الردود ضمن سلاسل المواضيع
- ✅ تظل ردود الوسائط مرتبطة بسلسلة الموضوع عند الرد على رسالة ضمن سلسلة

تُغطّى آلية توجيه جلسات مجموعات المواضيع ضمن
[نطاق جلسة المجموعة وسلاسل المواضيع](#group-session-scope-and-topic-threads).

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) - جميع القنوات المدعومة
- [الإقران](/ar/channels/pairing) - مصادقة الرسائل المباشرة وتدفق الإقران
- [المجموعات](/ar/channels/groups) - سلوك الدردشة الجماعية وتقييد الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) - توجيه جلسات الرسائل
- [الأمان](/ar/gateway/security) - نموذج الوصول والتقوية

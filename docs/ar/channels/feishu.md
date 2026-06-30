---
read_when:
    - تريد ربط روبوت Feishu/Lark
    - أنت تهيئ قناة Feishu
summary: نظرة عامة على روبوت Feishu وميزاته وتكوينه
title: Feishu
x-i18n:
    generated_at: "2026-06-30T14:02:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 262dda9739de284e32b7e87edc336bdb5d16651dbf37148bad7593f3a6a6b951
    source_path: channels/feishu.md
    workflow: 16
---

Feishu/Lark منصة تعاون شاملة تتيح للفرق الدردشة ومشاركة المستندات وإدارة التقويمات وإنجاز العمل معًا.

**الحالة:** جاهز للإنتاج لرسائل الروبوت الخاصة + دردشات المجموعات. WebSocket هو الوضع الافتراضي؛ ووضع webhook اختياري.

---

## البدء السريع

<Note>
يتطلب OpenClaw 2026.5.29 أو أحدث. شغّل `openclaw --version` للتحقق. حدّث باستخدام `openclaw update`.
</Note>

<Steps>
  <Step title="شغّل معالج إعداد القناة">
  ```bash
  openclaw channels login --channel feishu
  ```
  اختر الإعداد اليدوي للصق App ID وApp Secret من Feishu Open Platform، أو اختر إعداد QR لإنشاء روبوت تلقائيًا. إذا لم يتفاعل تطبيق Feishu المحلي على الهاتف مع رمز QR، فأعد تشغيل الإعداد واختر الإعداد اليدوي.
  </Step>
  
  <Step title="بعد اكتمال الإعداد، أعد تشغيل gateway لتطبيق التغييرات">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## التحكم في الوصول

### الرسائل المباشرة

اضبط `dmPolicy` للتحكم في من يمكنه إرسال رسالة مباشرة إلى الروبوت:

- `"pairing"` - يتلقى المستخدمون غير المعروفين رمز اقتران؛ وافق عبر CLI
- `"allowlist"` - يمكن للمستخدمين المدرجين فقط في `allowFrom` الدردشة
- `"open"` - اسمح بالرسائل المباشرة العامة فقط عندما يتضمن `allowFrom` القيمة `"*"`؛ ومع الإدخالات المقيِّدة، يمكن للمستخدمين المطابقين فقط الدردشة

**الموافقة على طلب اقتران:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### دردشات المجموعات

**سياسة المجموعة** (`channels.feishu.groupPolicy`):

| القيمة        | السلوك                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------- |
| `"open"`      | الرد على جميع الرسائل في المجموعات                                                             |
| `"allowlist"` | الرد فقط على المجموعات الموجودة في `groupAllowFrom` أو المهيأة صراحةً ضمن `groups.<chat_id>` |
| `"disabled"`  | تعطيل جميع رسائل المجموعات؛ لا تتجاوز إدخالات `groups.<chat_id>` الصريحة ذلك                 |

الافتراضي: `allowlist`

**متطلب الإشارة** (`channels.feishu.requireMention`):

- `true` - يتطلب @mention (افتراضي)
- `false` - الرد بدون @mention
- تجاوز لكل مجموعة: `channels.feishu.groups.<chat_id>.requireMention`
- لا تُعامل `@all` و`@_all` المخصصتان للبث فقط كإشارات إلى الروبوت. تظل الرسالة التي تشير إلى كل من `@all` والروبوت مباشرةً محسوبة كإشارة إلى الروبوت.

---

## أمثلة تهيئة المجموعات

### السماح لجميع المجموعات، بدون الحاجة إلى @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### السماح لجميع المجموعات، مع استمرار طلب @mention

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
      // Group IDs look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

في وضع `allowlist`، يمكنك أيضًا قبول مجموعة بإضافة إدخال `groups.<chat_id>` صريح. لا تتجاوز الإدخالات الصريحة `groupPolicy: "disabled"`. تضبط افتراضات حرف البدل ضمن `groups.*` المجموعات المطابقة، لكنها لا تقبل المجموعات بذاتها.

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
          // User open_ids look like: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## الحصول على معرّفات المجموعة/المستخدم

### معرّفات المجموعات (`chat_id`، التنسيق: `oc_xxx`)

افتح المجموعة في Feishu/Lark، وانقر أيقونة القائمة في الزاوية العلوية اليمنى، وانتقل إلى **الإعدادات**. يظهر معرّف المجموعة (`chat_id`) في صفحة الإعدادات.

![الحصول على معرّف المجموعة](/images/feishu-get-group-id.png)

### معرّفات المستخدمين (`open_id`، التنسيق: `ou_xxx`)

ابدأ gateway، وأرسل رسالة مباشرة إلى الروبوت، ثم تحقق من السجلات:

```bash
openclaw logs --follow
```

ابحث عن `open_id` في مخرجات السجل. يمكنك أيضًا التحقق من طلبات الاقتران المعلقة:

```bash
openclaw pairing list feishu
```

---

## الأوامر الشائعة

| الأمر     | الوصف                           |
| --------- | ------------------------------- |
| `/status` | عرض حالة الروبوت                |
| `/reset`  | إعادة تعيين الجلسة الحالية      |
| `/model`  | عرض نموذج الذكاء الاصطناعي أو تبديله |

<Note>
لا يدعم Feishu/Lark قوائم أوامر الشرطة المائلة الأصلية، لذا أرسل هذه كرسائل نصية عادية.
</Note>

---

## استكشاف الأخطاء وإصلاحها

### الروبوت لا يرد في دردشات المجموعات

1. تأكد من إضافة الروبوت إلى المجموعة
2. تأكد من أنك تستخدم @mention للإشارة إلى الروبوت (مطلوب افتراضيًا)
3. تحقق من أن `groupPolicy` ليست `"disabled"`
4. تحقق من السجلات: `openclaw logs --follow`

### الروبوت لا يتلقى الرسائل

1. تأكد من نشر الروبوت والموافقة عليه في Feishu Open Platform / Lark Developer
2. تأكد من أن اشتراك الأحداث يتضمن `im.message.receive_v1`
3. تأكد من تحديد **الاتصال المستمر** (WebSocket)
4. تأكد من منح جميع نطاقات الأذونات المطلوبة
5. تأكد من أن gateway قيد التشغيل: `openclaw gateway status`
6. تحقق من السجلات: `openclaw logs --follow`

### إعداد QR لا يتفاعل في تطبيق Feishu للهاتف

1. أعد تشغيل الإعداد: `openclaw channels login --channel feishu`
2. اختر الإعداد اليدوي
3. في Feishu Open Platform، أنشئ تطبيقًا مبنيًا ذاتيًا وانسخ App ID وApp Secret الخاصين به
4. الصق بيانات الاعتماد هذه في معالج الإعداد

### تسرّب App Secret

1. أعد تعيين App Secret في Feishu Open Platform / Lark Developer
2. حدّث القيمة في ملف التهيئة لديك
3. أعد تشغيل gateway: `openclaw gateway restart`

---

## التهيئة المتقدمة

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
          name: "Primary bot",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

يتحكم `defaultAccount` في الحساب المستخدم عندما لا تحدد واجهات API الصادرة `accountId`.
يستخدم `accounts.<id>.tts` الشكل نفسه مثل `messages.tts` ويندمج دمجًا عميقًا فوق
تهيئة TTS العامة، بحيث يمكن لإعدادات Feishu متعددة الروبوتات إبقاء بيانات اعتماد
المزوّد المشتركة عامة مع تجاوز الصوت أو النموذج أو الشخصية أو الوضع التلقائي فقط
لكل حساب.

### حدود الرسائل

- `textChunkLimit` - حجم مقطع النص الصادر (افتراضي: `2000` حرف)
- `mediaMaxMb` - حد رفع/تنزيل الوسائط (افتراضي: `30` ميغابايت)

### البث

يدعم Feishu/Lark الردود المتدفقة عبر البطاقات التفاعلية. عند التمكين، يحدّث الروبوت البطاقة في الوقت الفعلي أثناء توليد النص.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default: true)
      blockStreaming: true, // opt into completed-block streaming
    },
  },
}
```

اضبط `streaming: false` لإرسال الرد الكامل في رسالة واحدة. يكون `blockStreaming` معطلاً افتراضيًا؛ فعّله فقط عندما تريد تفريغ كتل المساعد المكتملة قبل الرد النهائي.

### تحسين الحصة

قلّل عدد استدعاءات API الخاصة بـ Feishu/Lark باستخدام علمين اختياريين:

- `typingIndicator` (الافتراضي `true`): اضبط `false` لتخطي استدعاءات تفاعل الكتابة
- `resolveSenderNames` (الافتراضي `true`): اضبط `false` لتخطي عمليات البحث عن ملف تعريف المرسل

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

### جلسات ACP

يدعم Feishu/Lark ACP للرسائل المباشرة ورسائل سلاسل المجموعات. يعتمد ACP في Feishu/Lark على الأوامر النصية - لا توجد قوائم أوامر شرطة مائلة أصلية، لذا استخدم رسائل `/acp ...` مباشرةً في المحادثة.

#### ربط ACP مستمر

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

في رسالة مباشرة أو سلسلة في Feishu/Lark:

```text
/acp spawn codex --thread here
```

يعمل `--thread here` مع الرسائل المباشرة ورسائل السلاسل في Feishu/Lark. تُوجَّه رسائل المتابعة في المحادثة المرتبطة مباشرةً إلى جلسة ACP تلك.

### توجيه متعدد الوكلاء

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
- `match.peer.kind`: `"direct"` (رسالة مباشرة) أو `"group"` (دردشة مجموعة)
- `match.peer.id`: Open ID للمستخدم (`ou_xxx`) أو معرّف المجموعة (`oc_xxx`)

راجع [الحصول على معرّفات المجموعة/المستخدم](#get-groupuser-ids) لنصائح البحث.

---

## عزل الوكيل لكل مستخدم (إنشاء الوكيل الديناميكي)

فعّل `dynamicAgentCreation` لإنشاء **مثيلات وكيل معزولة** تلقائيًا لكل مستخدم رسائل مباشرة. يحصل كل مستخدم على ما يلي خاصًا به:

- دليل مساحة عمل مستقل
- ملفات `USER.md` / `SOUL.md` / `MEMORY.md` منفصلة
- سجل محادثة خاص
- Skills وحالة معزولة

هذا ضروري للروبوتات العامة عندما تريد أن يحصل كل مستخدم على تجربة مساعد ذكاء اصطناعي خاصة به.

<Note>
تتضمن الارتباطات الديناميكية `accountId` المطبّع في Feishu، بحيث يوجّه الحساب الافتراضي والحسابات المسماة كل مرسل إلى الوكيل الديناميكي الصحيح.

إذا أنشأ حساب مسمى وكيلًا ديناميكيًا غير محدد النطاق في إصدار أقدم، فسيظل ذلك الوكيل القديم محسوبًا ضمن `maxAgents`. تأكد من أنه لا يستخدمه الحساب الافتراضي قبل إزالته، أو زد `maxAgents` مؤقتًا؛ لا يستطيع OpenClaw استنتاج الحساب الذي يملك الحالة القديمة المبهمة بأمان.
</Note>

### إعداد سريع

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
    // Critical: makes each user's DM their "main session"
    // Automatically loads USER.md / SOUL.md / MEMORY.md
    // For stronger isolation, use "per-channel-peer" instead
    dmScope: "main",
  },
}
```

### كيف يعمل

عندما يرسل مستخدم جديد أول رسالة مباشرة له:

1. تولّد القناة `agentId` فريدًا: `feishu-{user_open_id}` للحساب الافتراضي، أو بصمة هوية محدودة ومسبوقة بالحساب لحساب مسمى
2. تنشئ مساحة عمل جديدة في مسار `workspaceTemplate`
3. تسجّل الوكيل وتنشئ ارتباطًا لهذا المستخدم
4. يضمن مساعد مساحة العمل وجود ملفات التمهيد (`AGENTS.md`، و`SOUL.md`، و`USER.md`، إلخ) عند أول وصول
5. توجّه جميع الرسائل المستقبلية من هذا المستخدم إلى وكيله المخصص

### خيارات التهيئة

| الإعداد                                                  | الوصف                                | الافتراضي                              |
| -------------------------------------------------------- | ------------------------------------------ | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | تفعيل إنشاء وكيل تلقائي لكل مستخدم   | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | قالب المسار لمساحات عمل الوكلاء الديناميكية | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | قالب اسم دليل الوكيل              | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | الحد الأقصى لعدد الوكلاء الديناميكيين المراد إنشاؤهم | غير محدود                            |

متغيرات القالب:

- `{agentId}` - معرّف الوكيل المُنشأ (مثل `feishu-ou_xxxxxx` أو `feishu-support-<identity_digest>`)
- `{userId}` - قيمة open_id الخاصة بمرسل Feishu (مثل `ou_xxxxxx`)

### نطاق الجلسة

يتحكم `session.dmScope` في كيفية ربط الرسائل المباشرة بجلسات الوكيل. هذا **إعداد عام** يؤثر في كل القنوات.

| القيمة                        | السلوك                                                            | الأنسب لـ                                                           |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `"main"`                     | تُربط الرسائل المباشرة لكل مستخدم بالجلسة الرئيسية لوكيله                   | روبوتات المستخدم الواحد التي تريد فيها تحميل `USER.md` / `SOUL.md` تلقائيًا |
| `"per-channel-peer"`         | تحصل كل تركيبة (قناة + مستخدم) على جلسة منفصلة           | روبوتات عامة متعددة المستخدمين تحتاج إلى عزل أقوى                  |
| `"per-account-channel-peer"` | تحصل كل تركيبة (حساب + قناة + مستخدم) على جلسة منفصلة | روبوتات متعددة الحسابات تحتاج إلى عزل الجلسات على مستوى الحساب         |

**المفاضلة**: يتيح استخدام `"main"` تحميل ملفات التمهيد تلقائيًا (`USER.md` و`SOUL.md` و`MEMORY.md`)، لكنه يعني أن كل الرسائل المباشرة عبر كل القنوات تشارك نمط مفتاح الجلسة نفسه. بالنسبة إلى الروبوتات العامة متعددة المستخدمين التي يكون فيها العزل أهم من التحميل التلقائي للتمهيد، فكّر في `"per-channel-peer"` وأدر ملفات التمهيد يدويًا.

<Note>
استخدم `"per-account-channel-peer"` عندما يجب أن تحتفظ حسابات Feishu المسماة بجلسات منفصلة للمرسل نفسه. تحافظ الارتباطات الديناميكية على نطاق الحساب.
</Note>

```json5
{
  session: {
    // For single-user personal bots: enables auto bootstrap loading
    dmScope: "main",

    // For public multi-user bots: stronger isolation
    // dmScope: "per-channel-peer",
  },
}
```

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
    // Choose dmScope based on your isolation needs:
    // "main" for bootstrap auto-loading, "per-channel-peer" for stronger isolation
    dmScope: "main",
  },
  bindings: [], // Empty - dynamic agents auto-bind
}
```

### التحقق

تحقق من سجلات Gateway للتأكد من أن الإنشاء الديناميكي يعمل:

```
feishu: creating dynamic agent "feishu-ou_xxxxxx" for user ou_xxxxxx
workspace: /Users/you/.openclaw/workspace-feishu-ou_xxxxxx
feishu: dynamic agent created, new route: agent:feishu-ou_xxxxxx:main
```

اعرض كل مساحات العمل المُنشأة:

```bash
ls -la ~/.openclaw/workspace-*
```

### ملاحظات

- **عزل مساحة العمل**: يحصل كل مستخدم على دليل مساحة عمل ومثيل وكيل خاصين به. لا يمكن للمستخدمين رؤية سجل محادثات بعضهم أو ملفاتهم ضمن تدفق المراسلة العادي.
- **حد الأمان**: هذه آلية عزل لسياق المراسلة، وليست حدًا أمنيًا ضد مستأجرين مشاركين عدائيين. عملية الوكيل وبيئة المضيف مشتركتان.
- **يجب أن تكون `bindings` فارغة**: يسجل الوكلاء الديناميكيون ارتباطاتهم تلقائيًا
- **مسار الترقية**: تستمر الارتباطات اليدوية الحالية في العمل إلى جانب الوكلاء الديناميكيين
- **`session.dmScope` عام**: يؤثر هذا في كل القنوات، وليس Feishu فقط

---

## مرجع التكوين

التكوين الكامل: [تكوين Gateway](/ar/gateway/configuration)

| الإعداد                                                  | الوصف                                                                      | الافتراضي                              |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------ |
| `channels.feishu.enabled`                                | تفعيل/تعطيل القناة                                                       | `true`                               |
| `channels.feishu.domain`                                 | نطاق API (`feishu` أو `lark`)                                                  | `feishu`                             |
| `channels.feishu.connectionMode`                         | نقل الأحداث (`websocket` أو `webhook`)                                       | `websocket`                          |
| `channels.feishu.defaultAccount`                         | الحساب الافتراضي للتوجيه الصادر                                             | `default`                            |
| `channels.feishu.verificationToken`                      | مطلوب لوضع webhook                                                        | -                                    |
| `channels.feishu.encryptKey`                             | مطلوب لوضع webhook                                                        | -                                    |
| `channels.feishu.webhookPath`                            | مسار توجيه Webhook                                                               | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | مضيف ربط Webhook                                                                | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | منفذ ربط Webhook                                                                | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | معرّف التطبيق                                                                           | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | سر التطبيق                                                                       | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | تجاوز النطاق لكل حساب                                                      | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | تجاوز TTS لكل حساب                                                         | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | سياسة الرسائل المباشرة                                                                        | `pairing`                            |
| `channels.feishu.allowFrom`                              | قائمة السماح للرسائل المباشرة (قائمة open_id)                                                      | -                                    |
| `channels.feishu.groupPolicy`                            | سياسة المجموعة                                                                     | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | قائمة السماح للمجموعات                                                                  | -                                    |
| `channels.feishu.requireMention`                         | طلب @mention في المجموعات                                                       | `true`                               |
| `channels.feishu.groups.<chat_id>.requireMention`        | تجاوز @mention لكل مجموعة؛ تسمح المعرفات الصريحة أيضًا بالمجموعة في وضع قائمة السماح | موروث                            |
| `channels.feishu.groups.<chat_id>.enabled`               | تفعيل/تعطيل مجموعة محددة                                                  | `true`                               |
| `channels.feishu.dynamicAgentCreation.enabled`           | تفعيل إنشاء وكيل تلقائي لكل مستخدم                                         | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | قالب المسار لمساحات عمل الوكلاء الديناميكية                                       | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | قالب اسم دليل الوكيل                                                    | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | الحد الأقصى لعدد الوكلاء الديناميكيين المراد إنشاؤهم                                       | غير محدود                            |
| `channels.feishu.textChunkLimit`                         | حجم مقطع الرسالة                                                               | `2000`                               |
| `channels.feishu.mediaMaxMb`                             | حد حجم الوسائط                                                                 | `30`                                 |
| `channels.feishu.streaming`                              | إخراج بطاقات البث                                                            | `true`                               |
| `channels.feishu.blockStreaming`                         | بث ردود الكتل المكتملة                                                  | `false`                              |
| `channels.feishu.typingIndicator`                        | إرسال تفاعلات الكتابة                                                            | `true`                               |
| `channels.feishu.resolveSenderNames`                     | حل أسماء العرض للمرسلين                                                     | `true`                               |
| `channels.feishu.tools.bitable`                          | تفعيل أدوات Bitable/Base                                                        | `true`                               |
| `channels.feishu.tools.base`                             | اسم مستعار لـ `channels.feishu.tools.bitable`؛ تكون قيمة `bitable` الصريحة هي المعتمدة عند ضبط الاثنين | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | بوابة أداة Bitable/Base لكل حساب                                               | موروث                            |
| `channels.feishu.accounts.<id>.tools.base`               | اسم مستعار لكل حساب لـ `tools.bitable`                                            | موروث                            |

---

## أنواع الرسائل المدعومة

### الاستقبال

- ✅ النص
- ✅ النص المنسق (post)
- ✅ الصور
- ✅ الملفات
- ✅ الصوت
- ✅ الفيديو/الوسائط
- ✅ الملصقات

تُطبَّع رسائل الصوت الواردة من Feishu/Lark كعناصر نائبة للوسائط بدلًا من JSON `file_key` الخام. عند تكوين `tools.media.audio`، ينزّل OpenClaw مورد الملاحظة الصوتية ويشغّل نسخ الصوت المشترك قبل دورة الوكيل، بحيث يتلقى الوكيل النص المنسوخ من الكلام. إذا تضمّن Feishu نص النسخ مباشرةً في حمولة الصوت، فيُستخدم ذلك النص من دون استدعاء ASR آخر. بدون موفر نسخ صوتي، يظل الوكيل يتلقى عنصرًا نائبًا `<media:audio>` بالإضافة إلى المرفق المحفوظ، وليس حمولة مورد Feishu الخام.

### الإرسال

- ✅ النص
- ✅ الصور
- ✅ الملفات
- ✅ الصوت
- ✅ الفيديو/الوسائط
- ✅ البطاقات التفاعلية (بما في ذلك تحديثات البث)
- ⚠️ النص المنسق (تنسيق بنمط المنشورات؛ لا يدعم إمكانات التأليف الكاملة في Feishu/Lark)

تستخدم فقاعات الصوت الأصلية في Feishu/Lark نوع رسالة Feishu `audio` وتتطلب
وسائط مرفوعة بتنسيق Ogg/Opus (`file_type: "opus"`). تُرسل وسائط `.opus` و`.ogg` الموجودة
مباشرة كصوت أصلي. تُحوَّل MP3/WAV/M4A وغيرها من تنسيقات الصوت المحتملة
إلى Ogg/Opus بتردد 48kHz باستخدام `ffmpeg` فقط عندما يطلب الرد تسليمًا صوتيًا
(`audioAsVoice` / أداة الرسائل `asVoice`، بما في ذلك ردود الملاحظات الصوتية عبر TTS).
تبقى مرفقات MP3 العادية كملفات عادية. إذا كان `ffmpeg` مفقودًا أو
فشل التحويل، يعود OpenClaw إلى مرفق ملف ويسجل السبب.

### السلاسل والردود

- ✅ الردود المضمنة
- ✅ ردود السلاسل
- ✅ تبقى ردود الوسائط مدركة للسلسلة عند الرد على رسالة ضمن سلسلة

بالنسبة إلى `groupSessionScope: "group_topic"` و`"group_topic_sender"`، تستخدم
مجموعات المواضيع الأصلية في Feishu/Lark قيمة `thread_id` (`omt_*`) الخاصة بالحدث كمفتاح
جلسة الموضوع الأساسي. إذا حذف حدث بدء موضوع أصلي `thread_id`، يملؤه OpenClaw
من Feishu قبل توجيه الدور. تستمر ردود المجموعة العادية التي
يحوّلها OpenClaw إلى سلاسل في استخدام معرّف رسالة جذر الرد (`om_*`) بحيث
يبقى الدور الأول ودور المتابعة في الجلسة نفسها.

---

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels) - جميع القنوات المدعومة
- [الإقران](/ar/channels/pairing) - مصادقة الرسائل المباشرة وتدفق الإقران
- [المجموعات](/ar/channels/groups) - سلوك دردشة المجموعات وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) - توجيه جلسات الرسائل
- [الأمان](/ar/gateway/security) - نموذج الوصول والتقوية

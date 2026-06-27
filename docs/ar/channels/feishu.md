---
read_when:
    - تريد ربط روبوت Feishu/Lark
    - أنت تقوم بتهيئة قناة Feishu
summary: نظرة عامة على بوت Feishu وميزاته وتكوينه
title: Feishu
x-i18n:
    generated_at: "2026-06-27T17:09:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a12e91ff42b17ee99f07c10933d65a407db8ed9de2ac7bc6028d7004aa4e346
    source_path: channels/feishu.md
    workflow: 16
---

Feishu/Lark منصة تعاون شاملة تتيح للفرق الدردشة ومشاركة المستندات وإدارة التقويمات وإنجاز العمل معا.

**الحالة:** جاهز للإنتاج للرسائل المباشرة مع البوت + دردشات المجموعات. وضع ويب سوكت هو الوضع الافتراضي؛ ووضع Webhook اختياري.

---

## البدء السريع

<Note>
يتطلب OpenClaw 2026.5.29 أو أحدث. شغّل `openclaw --version` للتحقق. رقّه باستخدام `openclaw update`.
</Note>

<Steps>
  <Step title="شغّل معالج إعداد القناة">
  ```bash
  openclaw channels login --channel feishu
  ```
  اختر الإعداد اليدوي للصق معرف التطبيق وسر التطبيق من Feishu Open Platform، أو اختر إعداد QR لإنشاء بوت تلقائيا. إذا لم يتفاعل تطبيق Feishu المحلي على الهاتف مع رمز QR، فأعد تشغيل الإعداد واختر الإعداد اليدوي.
  </Step>
  
  <Step title="بعد اكتمال الإعداد، أعد تشغيل Gateway لتطبيق التغييرات">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## التحكم في الوصول

### الرسائل المباشرة

اضبط `dmPolicy` للتحكم في من يمكنه مراسلة البوت مباشرة:

- `"pairing"` - يتلقى المستخدمون غير المعروفين رمز اقتران؛ وافق عليه عبر CLI
- `"allowlist"` - يمكن فقط للمستخدمين المدرجين في `allowFrom` الدردشة
- `"open"` - السماح بالرسائل المباشرة العامة فقط عندما يتضمن `allowFrom` القيمة `"*"`؛ مع الإدخالات المقيّدة، يمكن فقط للمستخدمين المطابقين الدردشة
- `"disabled"` - تعطيل كل الرسائل المباشرة

**الموافقة على طلب اقتران:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### دردشات المجموعات

**سياسة المجموعة** (`channels.feishu.groupPolicy`):

| القيمة        | السلوك                                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| `"open"`      | الرد على كل الرسائل في المجموعات                                                                             |
| `"allowlist"` | الرد فقط على المجموعات في `groupAllowFrom` أو المكوّنة صراحة ضمن `groups.<chat_id>`                         |
| `"disabled"`  | تعطيل كل رسائل المجموعات؛ لا تتجاوز إدخالات `groups.<chat_id>` الصريحة هذا                                  |

الافتراضي: `allowlist`

**متطلب الإشارة** (`channels.feishu.requireMention`):

- `true` - طلب @mention (افتراضي)
- `false` - الرد دون @mention
- تجاوز لكل مجموعة: `channels.feishu.groups.<chat_id>.requireMention`
- لا تُعامل `@all` و`@_all` المخصصتان للبث فقط كإشارات إلى البوت. الرسالة التي تشير إلى كل من `@all` والبوت مباشرة لا تزال تُحتسب كإشارة إلى البوت.

---

## أمثلة تكوين المجموعات

### السماح بكل المجموعات، دون الحاجة إلى @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### السماح بكل المجموعات، مع الاستمرار في طلب @mention

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

في وضع `allowlist`، يمكنك أيضا قبول مجموعة بإضافة إدخال `groups.<chat_id>` صريح. لا تتجاوز الإدخالات الصريحة `groupPolicy: "disabled"`. تضبط الافتراضيات ذات حرف البدل ضمن `groups.*` المجموعات المطابقة، لكنها لا تقبل المجموعات بمفردها.

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

## الحصول على معرفات المجموعات/المستخدمين

### معرفات المجموعات (`chat_id`، التنسيق: `oc_xxx`)

افتح المجموعة في Feishu/Lark، وانقر أيقونة القائمة في الزاوية العلوية اليمنى، وانتقل إلى **الإعدادات**. يظهر معرف المجموعة (`chat_id`) في صفحة الإعدادات.

![الحصول على معرف المجموعة](/images/feishu-get-group-id.png)

### معرفات المستخدمين (`open_id`، التنسيق: `ou_xxx`)

شغّل Gateway، وأرسل رسالة مباشرة إلى البوت، ثم تحقق من السجلات:

```bash
openclaw logs --follow
```

ابحث عن `open_id` في مخرجات السجل. يمكنك أيضا التحقق من طلبات الاقتران المعلقة:

```bash
openclaw pairing list feishu
```

---

## الأوامر الشائعة

| الأمر     | الوصف                                 |
| --------- | ------------------------------------- |
| `/status` | عرض حالة البوت                        |
| `/reset`  | إعادة ضبط الجلسة الحالية             |
| `/model`  | عرض نموذج الذكاء الاصطناعي أو تبديله |

<Note>
لا يدعم Feishu/Lark قوائم أوامر الشرطة المائلة الأصلية، لذلك أرسل هذه الأوامر كرسائل نصية عادية.
</Note>

---

## استكشاف الأخطاء وإصلاحها

### البوت لا يرد في دردشات المجموعات

1. تأكد من إضافة البوت إلى المجموعة
2. تأكد من @mention للبوت (مطلوب افتراضيا)
3. تحقق من أن `groupPolicy` ليست `"disabled"`
4. تحقق من السجلات: `openclaw logs --follow`

### البوت لا يستقبل الرسائل

1. تأكد من نشر البوت والموافقة عليه في Feishu Open Platform / Lark Developer
2. تأكد من أن اشتراك الأحداث يتضمن `im.message.receive_v1`
3. تأكد من اختيار **الاتصال المستمر** (ويب سوكت)
4. تأكد من منح كل نطاقات الأذونات المطلوبة
5. تأكد من أن Gateway قيد التشغيل: `openclaw gateway status`
6. تحقق من السجلات: `openclaw logs --follow`

### إعداد QR لا يستجيب في تطبيق Feishu للهاتف

1. أعد تشغيل الإعداد: `openclaw channels login --channel feishu`
2. اختر الإعداد اليدوي
3. في Feishu Open Platform، أنشئ تطبيقا ذاتي الإنشاء وانسخ معرف التطبيق وسر التطبيق الخاصين به
4. الصق بيانات الاعتماد تلك في معالج الإعداد

### تسرّب سر التطبيق

1. أعد ضبط سر التطبيق في Feishu Open Platform / Lark Developer
2. حدّث القيمة في التكوين
3. أعد تشغيل Gateway: `openclaw gateway restart`

---

## التكوين المتقدم

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
يستخدم `accounts.<id>.tts` الشكل نفسه مثل `messages.tts` ويدمجه بعمق فوق
تكوين TTS العام، لذلك يمكن لإعدادات Feishu متعددة البوتات الاحتفاظ ببيانات اعتماد
المزوّد المشتركة عالميا مع تجاوز الصوت أو النموذج أو الشخصية أو الوضع التلقائي فقط
لكل حساب.

### حدود الرسائل

- `textChunkLimit` - حجم مقطع النص الصادر (الافتراضي: `2000` حرف)
- `mediaMaxMb` - حد رفع/تنزيل الوسائط (الافتراضي: `30` ميغابايت)

### البث

يدعم Feishu/Lark الردود المتدفقة عبر البطاقات التفاعلية. عند تفعيله، يحدّث البوت البطاقة في الوقت الحقيقي أثناء توليد النص.

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

اضبط `streaming: false` لإرسال الرد الكامل في رسالة واحدة. يكون `blockStreaming` متوقفا افتراضيا؛ فعّله فقط عندما تريد دفع كتل المساعد المكتملة قبل الرد النهائي.

### تحسين الحصة

قلّل عدد استدعاءات API الخاصة بـ Feishu/Lark باستخدام علامتين اختياريتين:

- `typingIndicator` (الافتراضي `true`): اضبطه على `false` لتخطي استدعاءات تفاعل الكتابة
- `resolveSenderNames` (الافتراضي `true`): اضبطه على `false` لتخطي عمليات البحث عن ملف تعريف المرسل

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

يدعم Feishu/Lark ‏ACP للرسائل المباشرة ورسائل سلاسل المجموعات. يعتمد ACP في Feishu/Lark على الأوامر النصية - لا توجد قوائم أوامر شرطة مائلة أصلية، لذلك استخدم رسائل `/acp ...` مباشرة في المحادثة.

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

في رسالة مباشرة أو سلسلة Feishu/Lark:

```text
/acp spawn codex --thread here
```

يعمل `--thread here` للرسائل المباشرة ورسائل سلاسل Feishu/Lark. تُوجّه رسائل المتابعة في المحادثة المرتبطة مباشرة إلى جلسة ACP تلك.

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
- `match.peer.id`: معرف Open ID للمستخدم (`ou_xxx`) أو معرف المجموعة (`oc_xxx`)

راجع [الحصول على معرفات المجموعات/المستخدمين](#get-groupuser-ids) لنصائح البحث.

---

## عزل الوكيل لكل مستخدم (إنشاء وكيل ديناميكي)

فعّل `dynamicAgentCreation` لإنشاء **مثيلات وكيل معزولة** تلقائيا لكل مستخدم رسائل مباشرة. يحصل كل مستخدم على ما يلي:

- دليل مساحة عمل مستقل
- ملفات `USER.md` / `SOUL.md` / `MEMORY.md` منفصلة
- سجل محادثة خاص
- Skills وحالة معزولة

هذا ضروري للبوتات العامة عندما تريد أن يحصل كل مستخدم على تجربة مساعد ذكاء اصطناعي خاصة به.

<Note>
تتضمن الروابط الديناميكية `accountId` المطبّع في Feishu، لذلك توجّه الحسابات الافتراضية والمسمّاة كل مرسل إلى الوكيل الديناميكي الصحيح.

إذا أنشأ حساب مسمّى وكيلا ديناميكيا غير محدد النطاق في إصدار أقدم، فلا يزال ذلك الوكيل القديم يُحتسب ضمن `maxAgents`. تأكد من أنه غير مستخدم من الحساب الافتراضي قبل إزالته، أو زِد `maxAgents` مؤقتا؛ لا يستطيع OpenClaw استنتاج الحساب الذي يملك حالة قديمة ملتبسة بأمان.
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

1. تنشئ القناة `agentId` فريدا: `feishu-{user_open_id}` للحساب الافتراضي، أو ملخص هوية محدودا ذا بادئة الحساب للحساب المسمّى
2. تنشئ مساحة عمل جديدة في مسار `workspaceTemplate`
3. تسجّل الوكيل وتنشئ ربطا لهذا المستخدم
4. يضمن مساعد مساحة العمل ملفات التمهيد (`AGENTS.md`، `SOUL.md`، `USER.md`، إلخ) عند أول وصول
5. توجّه كل الرسائل المستقبلية من هذا المستخدم إلى وكيله المخصص

### خيارات التكوين

| الإعداد                                                  | الوصف                                | الافتراضي                              |
| -------------------------------------------------------- | ------------------------------------------ | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | تفعيل إنشاء وكيل تلقائي لكل مستخدم   | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | قالب المسار لمساحات عمل الوكلاء الديناميكية | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | قالب اسم دليل الوكيل              | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | الحد الأقصى لعدد الوكلاء الديناميكيين المراد إنشاؤهم | غير محدود                            |

متغيرات القالب:

- `{agentId}` - معرّف الوكيل المُنشأ (مثل `feishu-ou_xxxxxx` أو `feishu-support-<identity_digest>`)
- `{userId}` - قيمة open_id لمرسل Feishu (مثل `ou_xxxxxx`)

### نطاق الجلسة

يتحكم `session.dmScope` في كيفية ربط الرسائل المباشرة بجلسات الوكيل. هذا **إعداد عام** يؤثر في جميع القنوات.

| القيمة                        | السلوك                                                            | الأنسب لـ                                                           |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `"main"`                     | ترتبط الرسائل المباشرة لكل مستخدم بالجلسة الرئيسية لوكيله                   | روبوتات المستخدم الواحد حيث تريد تحميل `USER.md` / `SOUL.md` تلقائياً |
| `"per-channel-peer"`         | يحصل كل مزيج من (القناة + المستخدم) على جلسة منفصلة           | الروبوتات العامة متعددة المستخدمين التي تحتاج إلى عزل أقوى                  |
| `"per-account-channel-peer"` | يحصل كل مزيج من (الحساب + القناة + المستخدم) على جلسة منفصلة | الروبوتات متعددة الحسابات التي تحتاج إلى عزل جلسات على مستوى الحساب         |

**المفاضلة**: استخدام `"main"` يفعّل تحميل ملفات التمهيد تلقائياً (`USER.md` و`SOUL.md` و`MEMORY.md`)، لكنه يعني أن جميع الرسائل المباشرة عبر كل القنوات تشترك في نمط مفتاح الجلسة نفسه. بالنسبة إلى الروبوتات العامة متعددة المستخدمين حيث يكون العزل أهم من التحميل التلقائي لملفات التمهيد، فكّر في استخدام `"per-channel-peer"` وإدارة ملفات التمهيد يدوياً.

<Note>
استخدم `"per-account-channel-peer"` عندما ينبغي لحسابات Feishu المسماة الاحتفاظ بجلسات منفصلة للمرسل نفسه. تحافظ الارتباطات الديناميكية على نطاق الحساب.
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

تحقق من سجلات Gateway لتأكيد أن الإنشاء الديناميكي يعمل:

```
feishu: creating dynamic agent "feishu-ou_xxxxxx" for user ou_xxxxxx
workspace: /Users/you/.openclaw/workspace-feishu-ou_xxxxxx
feishu: dynamic agent created, new route: agent:feishu-ou_xxxxxx:main
```

اعرض جميع مساحات العمل المُنشأة:

```bash
ls -la ~/.openclaw/workspace-*
```

### ملاحظات

- **عزل مساحة العمل**: يحصل كل مستخدم على دليل مساحة عمل ومثيل وكيل خاصين به. لا يمكن للمستخدمين رؤية سجل محادثات بعضهم أو ملفاتهم ضمن تدفق المراسلة العادي.
- **حد الأمان**: هذه آلية عزل لسياق المراسلة، وليست حد أمان ضد مستأجر مشارك عدائي. عملية الوكيل وبيئة المضيف مشتركتان.
- **ينبغي أن تكون `bindings` فارغة**: تسجّل الوكلاء الديناميكية ارتباطاتها الخاصة تلقائياً
- **مسار الترقية**: تستمر الارتباطات اليدوية الحالية في العمل إلى جانب الوكلاء الديناميكية
- **`session.dmScope` عام**: يؤثر هذا في جميع القنوات، وليس Feishu فقط

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
| `channels.feishu.requireMention`                         | اشتراط @mention في المجموعات                                                       | `true`                               |
| `channels.feishu.groups.<chat_id>.requireMention`        | تجاوز @mention لكل مجموعة؛ تقبل المعرّفات الصريحة المجموعة أيضاً في وضع قائمة السماح | موروث                            |
| `channels.feishu.groups.<chat_id>.enabled`               | تفعيل/تعطيل مجموعة محددة                                                  | `true`                               |
| `channels.feishu.dynamicAgentCreation.enabled`           | تفعيل إنشاء وكيل تلقائي لكل مستخدم                                         | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | قالب المسار لمساحات عمل الوكلاء الديناميكية                                       | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | قالب اسم دليل الوكيل                                                    | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | الحد الأقصى لعدد الوكلاء الديناميكيين المراد إنشاؤهم                                       | غير محدود                            |
| `channels.feishu.textChunkLimit`                         | حجم جزء الرسالة                                                               | `2000`                               |
| `channels.feishu.mediaMaxMb`                             | حد حجم الوسائط                                                                 | `30`                                 |
| `channels.feishu.streaming`                              | إخراج البطاقة المتدفقة                                                            | `true`                               |
| `channels.feishu.blockStreaming`                         | بث رد الكتلة المكتملة                                                  | `false`                              |
| `channels.feishu.typingIndicator`                        | إرسال تفاعلات الكتابة                                                            | `true`                               |
| `channels.feishu.resolveSenderNames`                     | حل أسماء عرض المرسلين                                                     | `true`                               |
| `channels.feishu.tools.bitable`                          | تفعيل أدوات Bitable/Base                                                        | `true`                               |
| `channels.feishu.tools.base`                             | اسم مستعار لـ `channels.feishu.tools.bitable`؛ يفوز `bitable` الصريح عند ضبط كليهما | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | بوابة أداة Bitable/Base لكل حساب                                               | موروث                            |
| `channels.feishu.accounts.<id>.tools.base`               | اسم مستعار لكل حساب لـ `tools.bitable`                                            | موروث                            |

---

## أنواع الرسائل المدعومة

### الاستلام

- ✅ نص
- ✅ نص منسق (منشور)
- ✅ صور
- ✅ ملفات
- ✅ صوت
- ✅ فيديو/وسائط
- ✅ ملصقات

تُطبَّع رسائل Feishu/Lark الصوتية الواردة كعناصر نائبة للوسائط بدلاً
من JSON خام لـ `file_key`. عند تكوين `tools.media.audio`، يقوم OpenClaw
بتنزيل مورد الملاحظة الصوتية وتشغيل النسخ الصوتي المشترك قبل
دور الوكيل، بحيث يتلقى الوكيل النص المنطوق. إذا تضمّن Feishu
نص النسخ مباشرة في حمولة الصوت، يُستخدم ذلك النص من دون
استدعاء ASR آخر. ومن دون موفر نسخ صوتي، لا يزال الوكيل يتلقى
عنصراً نائباً `<media:audio>` إضافة إلى المرفق المحفوظ، وليس حمولة مورد Feishu
الخام.

### الإرسال

- ✅ النص
- ✅ الصور
- ✅ الملفات
- ✅ الصوت
- ✅ الفيديو/الوسائط
- ✅ البطاقات التفاعلية (بما في ذلك تحديثات البث)
- ⚠️ النص المنسق (تنسيق بنمط المنشورات؛ لا يدعم كامل إمكانات التأليف في Feishu/Lark)

تستخدم فقاعات الصوت الأصلية في Feishu/Lark نوع رسالة Feishu `audio` وتتطلب
وسائط رفع Ogg/Opus (`file_type: "opus"`). تُرسل وسائط `.opus` و`.ogg` الموجودة
مباشرة كصوت أصلي. تُحوَّل MP3/WAV/M4A وغيرها من تنسيقات الصوت المحتملة
إلى Ogg/Opus بتردد 48 كيلوهرتز باستخدام `ffmpeg` فقط عندما يطلب الرد تسليمًا
صوتيًا (`audioAsVoice` / أداة الرسائل `asVoice`، بما في ذلك ردود الملاحظات
الصوتية عبر TTS). تظل مرفقات MP3 العادية ملفات عادية. إذا كان `ffmpeg` غير
موجود أو فشل التحويل، يعود OpenClaw إلى مرفق ملف ويسجل السبب.

### سلاسل المحادثات والردود

- ✅ الردود المضمنة
- ✅ ردود سلاسل المحادثات
- ✅ تظل ردود الوسائط واعية بسلسلة المحادثة عند الرد على رسالة ضمن سلسلة

بالنسبة إلى `groupSessionScope: "group_topic"` و`"group_topic_sender"`، تستخدم
مجموعات الموضوعات الأصلية في Feishu/Lark قيمة `thread_id` (`omt_*`) للحدث كمفتاح
جلسة الموضوع المعياري. إذا حذف حدث بدء موضوع أصلي `thread_id`، يستكمله OpenClaw
من Feishu قبل توجيه الدور. تستمر ردود المجموعات العادية التي يحولها OpenClaw إلى
سلاسل محادثات في استخدام معرّف رسالة جذر الرد (`om_*`) بحيث يبقى الدور الأول
ودور المتابعة في الجلسة نفسها.

---

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) - جميع القنوات المدعومة
- [الإقران](/ar/channels/pairing) - مصادقة الرسائل المباشرة وتدفق الإقران
- [المجموعات](/ar/channels/groups) - سلوك دردشة المجموعات وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) - توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) - نموذج الوصول والتحصين

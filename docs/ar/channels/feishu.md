---
read_when:
    - تريد ربط بوت Feishu/Lark
    - أنت تقوم بإعداد قناة Feishu
summary: نظرة عامة على بوت Feishu وميزاته وإعداده
title: Feishu
x-i18n:
    generated_at: "2026-04-24T07:30:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: f68a03c457fb2be7654f298fbad759705983d9e673b7b7b950609694894bdcbc
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Lark هي منصة تعاون متكاملة حيث تتبادل الفرق الدردشة، وتشارك المستندات، وتدير التقويمات، وتنجز العمل معًا.

**الحالة:** جاهزة للإنتاج للرسائل المباشرة الخاصة بالبوت + دردشات المجموعات. يُعد WebSocket الوضع الافتراضي؛ ووضع Webhook اختياري.

---

## البدء السريع

> **يتطلب OpenClaw 2026.4.24 أو أحدث.** شغّل `openclaw --version` للتحقق. وقم بالترقية باستخدام `openclaw update`.

<Steps>
  <Step title="شغّل معالج إعداد القناة">
  ```bash
  openclaw channels login --channel feishu
  ```
  امسح رمز QR باستخدام تطبيق Feishu/Lark على هاتفك المحمول لإنشاء بوت Feishu/Lark تلقائيًا.
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

قم بإعداد `dmPolicy` للتحكم في من يمكنه إرسال رسائل مباشرة إلى البوت:

- `"pairing"` — يتلقى المستخدمون غير المعروفين رمز اقتران؛ وافق عليه عبر CLI
- `"allowlist"` — يمكن فقط للمستخدمين المدرجين في `allowFrom` الدردشة (الافتراضي: مالك البوت فقط)
- `"open"` — السماح لجميع المستخدمين
- `"disabled"` — تعطيل جميع الرسائل المباشرة

**الموافقة على طلب اقتران:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### دردشات المجموعات

**سياسة المجموعة** (`channels.feishu.groupPolicy`):

| القيمة         | السلوك                                      |
| ------------- | ------------------------------------------- |
| `"open"`      | الرد على جميع الرسائل في المجموعات          |
| `"allowlist"` | الرد فقط على المجموعات الموجودة في `groupAllowFrom` |
| `"disabled"`  | تعطيل جميع رسائل المجموعات                  |

الافتراضي: `allowlist`

**اشتراط الإشارة** (`channels.feishu.requireMention`):

- `true` — يتطلب @mention (الافتراضي)
- `false` — الرد بدون @mention
- تجاوز لكل مجموعة: `channels.feishu.groups.<chat_id>.requireMention`

---

## أمثلة على إعداد المجموعات

### السماح لجميع المجموعات، من دون اشتراط @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### السماح لجميع المجموعات، مع الاستمرار في اشتراط @mention

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

### السماح لمجموعات محددة فقط

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // تبدو معرّفات المجموعات هكذا: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
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
          // تبدو معرّفات open_id للمستخدمين هكذا: ou_xxx
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

افتح المجموعة في Feishu/Lark، وانقر على أيقونة القائمة في الزاوية العلوية اليمنى، ثم انتقل إلى **الإعدادات**. سيكون معرّف المجموعة (`chat_id`) مدرجًا في صفحة الإعدادات.

![الحصول على معرّف المجموعة](/images/feishu-get-group-id.png)

### معرّفات المستخدمين (`open_id`، التنسيق: `ou_xxx`)

ابدأ Gateway، ثم أرسل رسالة مباشرة إلى البوت، وبعد ذلك تحقّق من السجلات:

```bash
openclaw logs --follow
```

ابحث عن `open_id` في مخرجات السجل. يمكنك أيضًا التحقق من طلبات الاقتران المعلقة:

```bash
openclaw pairing list feishu
```

---

## الأوامر الشائعة

| الأمر   | الوصف                    |
| ------- | ------------------------ |
| `/status` | عرض حالة البوت           |
| `/reset`  | إعادة تعيين الجلسة الحالية |
| `/model`  | عرض نموذج الذكاء الاصطناعي أو التبديل إليه |

> لا يدعم Feishu/Lark قوائم slash-command الأصلية، لذا أرسل هذه الأوامر كرسائل نصية عادية.

---

## استكشاف الأخطاء وإصلاحها

### البوت لا يستجيب في دردشات المجموعات

1. تأكد من إضافة البوت إلى المجموعة
2. تأكد من أنك تشير إلى البوت باستخدام @mention (مطلوب افتراضيًا)
3. تحقق من أن `groupPolicy` ليست `"disabled"`
4. افحص السجلات: `openclaw logs --follow`

### البوت لا يستقبل الرسائل

1. تأكد من أن البوت منشور ومعتمد في Feishu Open Platform / Lark Developer
2. تأكد من أن اشتراك الأحداث يتضمن `im.message.receive_v1`
3. تأكد من اختيار **الاتصال الدائم** (WebSocket)
4. تأكد من منح جميع نطاقات الأذونات المطلوبة
5. تأكد من أن Gateway قيد التشغيل: `openclaw gateway status`
6. افحص السجلات: `openclaw logs --follow`

### تم تسريب App Secret

1. أعد تعيين App Secret في Feishu Open Platform / Lark Developer
2. حدّث القيمة في الإعدادات
3. أعد تشغيل Gateway: `openclaw gateway restart`

---

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
          name: "Primary bot",
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

### حدود الرسائل

- `textChunkLimit` — حجم مقطع النص الصادر (الافتراضي: `2000` حرف)
- `mediaMaxMb` — حد رفع/تنزيل الوسائط (الافتراضي: `30` ميجابايت)

### البث

يدعم Feishu/Lark الردود المتدفقة عبر البطاقات التفاعلية. وعند تفعيله، يحدّث البوت البطاقة في الوقت الفعلي أثناء إنشاء النص.

```json5
{
  channels: {
    feishu: {
      streaming: true, // تفعيل إخراج البطاقة المتدفقة (الافتراضي: true)
      blockStreaming: true, // تفعيل البث على مستوى الكتلة (الافتراضي: true)
    },
  },
}
```

اضبط `streaming: false` لإرسال الرد الكامل في رسالة واحدة.

### تحسين الحصة

قلّل عدد استدعاءات Feishu/Lark API باستخدام علامتين اختياريتين:

- `typingIndicator` (الافتراضي `true`): اضبطه على `false` لتخطي استدعاءات تفاعل الكتابة
- `resolveSenderNames` (الافتراضي `true`): اضبطه على `false` لتخطي عمليات البحث عن ملفات تعريف المرسلين

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

يدعم Feishu/Lark بروتوكول ACP للرسائل المباشرة ورسائل سلاسل المجموعات. ويعتمد ACP في Feishu/Lark على الأوامر النصية — فلا توجد قوائم slash-command أصلية، لذا استخدم رسائل `/acp ...` مباشرة داخل المحادثة.

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

#### تشغيل ACP من الدردشة

في رسالة مباشرة أو سلسلة رسائل في Feishu/Lark:

```text
/acp spawn codex --thread here
```

يعمل `--thread here` في الرسائل المباشرة ورسائل سلاسل Feishu/Lark. وتُوجَّه الرسائل اللاحقة في المحادثة المرتبطة مباشرة إلى جلسة ACP تلك.

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

راجع [الحصول على معرّفات المجموعة/المستخدم](#get-groupuser-ids) للاطلاع على نصائح البحث.

---

## مرجع الإعدادات

الإعداد الكامل: [إعدادات Gateway](/ar/gateway/configuration)

| الإعداد                                           | الوصف                                     | الافتراضي       |
| ------------------------------------------------- | ----------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | تفعيل/تعطيل القناة                        | `true`           |
| `channels.feishu.domain`                          | نطاق API (`feishu` أو `lark`)             | `feishu`         |
| `channels.feishu.connectionMode`                  | نقل الأحداث (`websocket` أو `webhook`)    | `websocket`      |
| `channels.feishu.defaultAccount`                  | الحساب الافتراضي للتوجيه الصادر           | `default`        |
| `channels.feishu.verificationToken`               | مطلوب لوضع Webhook                        | —                |
| `channels.feishu.encryptKey`                      | مطلوب لوضع Webhook                        | —                |
| `channels.feishu.webhookPath`                     | مسار توجيه Webhook                        | `/feishu/events` |
| `channels.feishu.webhookHost`                     | مضيف ربط Webhook                          | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | منفذ ربط Webhook                          | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                    | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                | —                |
| `channels.feishu.accounts.<id>.domain`            | تجاوز نطاق لكل حساب                       | `feishu`         |
| `channels.feishu.dmPolicy`                        | سياسة الرسائل المباشرة                    | `allowlist`      |
| `channels.feishu.allowFrom`                       | قائمة السماح للرسائل المباشرة (`open_id`) | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | سياسة المجموعات                           | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | قائمة السماح للمجموعات                    | —                |
| `channels.feishu.requireMention`                  | اشتراط @mention في المجموعات              | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | تجاوز @mention لكل مجموعة                 | inherited        |
| `channels.feishu.groups.<chat_id>.enabled`        | تفعيل/تعطيل مجموعة محددة                  | `true`           |
| `channels.feishu.textChunkLimit`                  | حجم مقطع الرسالة                          | `2000`           |
| `channels.feishu.mediaMaxMb`                      | حد حجم الوسائط                            | `30`             |
| `channels.feishu.streaming`                       | إخراج البطاقة المتدفقة                    | `true`           |
| `channels.feishu.blockStreaming`                  | البث على مستوى الكتلة                     | `true`           |
| `channels.feishu.typingIndicator`                 | إرسال تفاعلات الكتابة                     | `true`           |
| `channels.feishu.resolveSenderNames`              | تحليل أسماء عرض المرسلين                  | `true`           |

---

## أنواع الرسائل المدعومة

### الاستقبال

- ✅ نص
- ✅ نص منسق (post)
- ✅ صور
- ✅ ملفات
- ✅ صوت
- ✅ فيديو/وسائط
- ✅ ملصقات

### الإرسال

- ✅ نص
- ✅ صور
- ✅ ملفات
- ✅ صوت
- ✅ فيديو/وسائط
- ✅ بطاقات تفاعلية (بما في ذلك التحديثات المتدفقة)
- ⚠️ نص منسق (تنسيق على نمط post؛ لا يدعم كامل إمكانات التحرير في Feishu/Lark)

### سلاسل الرسائل والردود

- ✅ ردود مضمنة
- ✅ ردود ضمن السلاسل
- ✅ تبقى ردود الوسائط واعية بالسلسلة عند الرد على رسالة ضمن سلسلة

---

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك دردشات المجموعات وضبط اشتراط الإشارة
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية

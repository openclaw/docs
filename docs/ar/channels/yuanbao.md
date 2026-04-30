---
read_when:
    - تريد ربط بوت Yuanbao
    - أنت تقوم بتكوين قناة Yuanbao
summary: نظرة عامة على روبوت Yuanbao وميزاته وتكوينه
title: يوانباو
x-i18n:
    generated_at: "2026-04-30T07:45:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: d82b6d275ae8aa4cc5e62321772c5ba2b5044c6058be0d2e5215cdb1488118e9
    source_path: channels/yuanbao.md
    workflow: 16
---

# Yuanbao

Yuanbao من Tencent هي منصة مساعد الذكاء الاصطناعي من Tencent. يربط Plugin قناة OpenClaw
روبوتات Yuanbao بـ OpenClaw عبر WebSocket حتى تتمكن من التفاعل مع المستخدمين
عبر الرسائل المباشرة ودردشات المجموعات.

**الحالة:** جاهز للإنتاج للرسائل المباشرة مع الروبوت + دردشات المجموعات. WebSocket هو وضع الاتصال الوحيد المدعوم.

---

## البدء السريع

> **يتطلب OpenClaw 2026.4.10 أو أحدث.** شغّل `openclaw --version` للتحقق. حدّث باستخدام `openclaw update`.

<Steps>
  <Step title="أضف قناة Yuanbao باستخدام بيانات اعتمادك">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  تستخدم قيمة `--token` تنسيق `appKey:appSecret` المفصول بنقطتين. يمكنك الحصول عليهما من تطبيق Yuanbao بإنشاء روبوت في إعدادات تطبيقك.
  </Step>

  <Step title="بعد اكتمال الإعداد، أعد تشغيل Gateway لتطبيق التغييرات">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### الإعداد التفاعلي (بديل)

يمكنك أيضًا استخدام معالج الإعداد التفاعلي:

```bash
openclaw channels login --channel yuanbao
```

اتبع المطالبات لإدخال App ID وApp Secret.

---

## التحكم في الوصول

### الرسائل المباشرة

اضبط `dmPolicy` للتحكم في من يمكنه مراسلة الروبوت مباشرة:

- `"pairing"` — يتلقى المستخدمون غير المعروفين رمز اقتران؛ وافق عليه عبر CLI
- `"allowlist"` — يمكن فقط للمستخدمين المدرجين في `allowFrom` الدردشة
- `"open"` — السماح لجميع المستخدمين (الافتراضي)
- `"disabled"` — تعطيل جميع الرسائل المباشرة

**الموافقة على طلب اقتران:**

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### دردشات المجموعات

**متطلب الإشارة** (`channels.yuanbao.requireMention`):

- `true` — تتطلب @mention (الافتراضي)
- `false` — الرد بدون @mention

يُعامل الرد على رسالة الروبوت في دردشة مجموعة كإشارة ضمنية.

---

## أمثلة التكوين

### إعداد أساسي بسياسة رسائل مباشرة مفتوحة

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "open",
      },
    },
  },
}
```

### تقييد الرسائل المباشرة على مستخدمين محددين

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "allowlist",
        allowFrom: ["user_id_1", "user_id_2"],
      },
    },
  },
}
```

### تعطيل متطلب @mention في المجموعات

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

### تحسين تسليم الرسائل الصادرة

```json5
{
  channels: {
    yuanbao: {
      // Send each chunk immediately without buffering
      outboundQueueStrategy: "immediate",
    },
  },
}
```

### ضبط استراتيجية دمج النص

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // buffer until this many chars
      maxChars: 3000, // force split above this limit
      idleMs: 5000, // auto-flush after idle timeout (ms)
    },
  },
}
```

---

## الأوامر الشائعة

| الأمر      | الوصف                       |
| ---------- | --------------------------- |
| `/help`    | عرض الأوامر المتاحة         |
| `/status`  | عرض حالة الروبوت            |
| `/new`     | بدء جلسة جديدة              |
| `/stop`    | إيقاف التشغيل الحالي        |
| `/restart` | إعادة تشغيل OpenClaw        |
| `/compact` | ضغط سياق الجلسة             |

> يدعم Yuanbao قوائم أوامر الشرطة المائلة الأصلية. تتم مزامنة الأوامر إلى المنصة تلقائيًا عند بدء Gateway.

---

## استكشاف الأخطاء وإصلاحها

### الروبوت لا يرد في دردشات المجموعات

1. تأكد من إضافة الروبوت إلى المجموعة
2. تأكد من أنك تشير إلى الروبوت باستخدام @mention (مطلوب افتراضيًا)
3. تحقق من السجلات: `openclaw logs --follow`

### الروبوت لا يتلقى الرسائل

1. تأكد من إنشاء الروبوت والموافقة عليه في تطبيق Yuanbao
2. تأكد من تكوين `appKey` و`appSecret` بشكل صحيح
3. تأكد من أن Gateway قيد التشغيل: `openclaw gateway status`
4. تحقق من السجلات: `openclaw logs --follow`

### الروبوت يرسل ردودًا فارغة أو احتياطية

1. تحقق مما إذا كان نموذج الذكاء الاصطناعي يعيد محتوى صالحًا
2. الرد الاحتياطي الافتراضي هو: "暂时无法解答，你可以换个问题问问我哦"
3. خصصه عبر `channels.yuanbao.fallbackReply`

### تسرّب App Secret

1. أعد تعيين App Secret في YuanBao APP
2. حدّث القيمة في التكوين الخاص بك
3. أعد تشغيل Gateway: `openclaw gateway restart`

---

## التكوين المتقدم

### حسابات متعددة

```json5
{
  channels: {
    yuanbao: {
      defaultAccount: "main",
      accounts: {
        main: {
          appKey: "key_xxx",
          appSecret: "secret_xxx",
          name: "Primary bot",
        },
        backup: {
          appKey: "key_yyy",
          appSecret: "secret_yyy",
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

- `maxChars` — الحد الأقصى لعدد الأحرف في رسالة واحدة (الافتراضي: `3000` حرف)
- `mediaMaxMb` — حد رفع/تنزيل الوسائط (الافتراضي: `20` ميغابايت)
- `overflowPolicy` — السلوك عند تجاوز الرسالة للحد: `"split"` (الافتراضي) أو `"stop"`

### البث

يدعم Yuanbao إخراج البث على مستوى الكتل. عند تمكينه، يرسل الروبوت النص في أجزاء أثناء إنشائه.

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // block streaming enabled (default)
    },
  },
}
```

اضبط `disableBlockStreaming: true` لإرسال الرد الكامل في رسالة واحدة.

### سياق سجل دردشة المجموعة

تحكم في عدد الرسائل التاريخية المضمّنة في سياق الذكاء الاصطناعي لدردشات المجموعات:

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // default: 100, set 0 to disable
    },
  },
}
```

### وضع الرد على

تحكم في كيفية اقتباس الروبوت للرسائل عند الرد في دردشات المجموعات:

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (default: "first")
    },
  },
}
```

| القيمة    | السلوك                                                |
| --------- | ----------------------------------------------------- |
| `"off"`   | لا يوجد رد مقتبس                                     |
| `"first"` | اقتباس الرد الأول فقط لكل رسالة واردة (الافتراضي)    |
| `"all"`   | اقتباس كل رد                                         |

### حقن تلميح Markdown

بشكل افتراضي، يحقن الروبوت تعليمات في موجه النظام لمنع نموذج الذكاء الاصطناعي من تغليف الرد بالكامل في كتل كود markdown.

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // default: true
    },
  },
}
```

### وضع التصحيح

فعّل إخراج السجلات غير المنقّح لمعرّفات روبوت محددة:

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

### توجيه وكلاء متعددين

استخدم `bindings` لتوجيه الرسائل المباشرة أو المجموعات في Yuanbao إلى وكلاء مختلفين.

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
        channel: "yuanbao",
        peer: { kind: "direct", id: "user_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "yuanbao",
        peer: { kind: "group", id: "group_zzz" },
      },
    },
  ],
}
```

حقول التوجيه:

- `match.channel`: `"yuanbao"`
- `match.peer.kind`: `"direct"` (رسالة مباشرة) أو `"group"` (دردشة مجموعة)
- `match.peer.id`: معرّف المستخدم أو رمز المجموعة

---

## مرجع التكوين

التكوين الكامل: [تكوين Gateway](/ar/gateway/configuration)

| الإعداد                                    | الوصف                                             | الافتراضي                              |
| ------------------------------------------ | ------------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                 | تمكين/تعطيل القناة                                | `true`                                 |
| `channels.yuanbao.defaultAccount`          | الحساب الافتراضي للتوجيه الصادر                  | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key (يُستخدم للتوقيع وإنشاء التذاكر)         | —                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret (يُستخدم للتوقيع)                     | —                                      |
| `channels.yuanbao.accounts.<id>.token`     | رمز موقّع مسبقًا (يتجاوز توقيع التذاكر التلقائي) | —                                      |
| `channels.yuanbao.accounts.<id>.name`      | اسم عرض الحساب                                    | —                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | تمكين/تعطيل حساب محدد                            | `true`                                 |
| `channels.yuanbao.dm.policy`               | سياسة الرسائل المباشرة                            | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | قائمة السماح للرسائل المباشرة (قائمة معرّفات المستخدمين) | —                                      |
| `channels.yuanbao.requireMention`          | طلب @mention في المجموعات                         | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | التعامل مع الرسائل الطويلة (`split` أو `stop`)   | `split`                                |
| `channels.yuanbao.replyToMode`             | استراتيجية الرد في المجموعة (`off`، `first`، `all`) | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`   | الاستراتيجية الصادرة (`merge-text` أو `immediate`) | `merge-text`                           |
| `channels.yuanbao.minChars`                | دمج النص: الحد الأدنى من الأحرف لتشغيل الإرسال    | `2800`                                 |
| `channels.yuanbao.maxChars`                | دمج النص: الحد الأقصى للأحرف لكل رسالة            | `3000`                                 |
| `channels.yuanbao.idleMs`                  | دمج النص: مهلة الخمول قبل التفريغ التلقائي (ms)  | `5000`                                 |
| `channels.yuanbao.mediaMaxMb`              | حد حجم الوسائط (MB)                              | `20`                                   |
| `channels.yuanbao.historyLimit`            | إدخالات سياق سجل دردشة المجموعة                  | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`   | تعطيل إخراج البث على مستوى الكتل                 | `false`                                |
| `channels.yuanbao.fallbackReply`           | رد احتياطي عندما لا يعيد الذكاء الاصطناعي أي محتوى | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | حقن تعليمات منع تغليف markdown                    | `true`                                 |
| `channels.yuanbao.debugBotIds`             | معرّفات روبوتات قائمة السماح للتصحيح (سجلات غير منقّحة) | `[]`                                   |

---

## أنواع الرسائل المدعومة

### الاستلام

- ✅ نص
- ✅ صور
- ✅ ملفات
- ✅ صوت / رسالة صوتية
- ✅ فيديو
- ✅ ملصقات / رموز تعبيرية مخصصة
- ✅ عناصر مخصصة (بطاقات روابط، إلخ)

### الإرسال

- ✅ نص (مع دعم markdown)
- ✅ صور
- ✅ ملفات
- ✅ صوت
- ✅ فيديو
- ✅ ملصقات

### الخيوط والردود

- ✅ ردود مقتبسة (قابلة للتكوين عبر `replyToMode`)
- ❌ ردود الخيوط (غير مدعومة من المنصة)

---

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعة وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية

---
read_when:
    - تريد ربط روبوت Yuanbao
    - أنت تهيئ قناة Yuanbao
summary: نظرة عامة على بوت Yuanbao وميزاته وتكوينه
title: Yuanbao
x-i18n:
    generated_at: "2026-05-06T07:45:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3830af0206854e500132edfc9340724fe97f90ca60fa23ce05202d96d9cacf04
    source_path: channels/yuanbao.md
    workflow: 16
---

Tencent Yuanbao هي منصة مساعد الذكاء الاصطناعي من Tencent. يربط Plugin قناة OpenClaw
روبوتات Yuanbao بـ OpenClaw عبر WebSocket حتى تتمكن من التفاعل مع المستخدمين
من خلال الرسائل المباشرة ومحادثات المجموعات.

**الحالة:** جاهز للإنتاج للرسائل المباشرة للروبوت + محادثات المجموعات. WebSocket هو وضع الاتصال الوحيد المدعوم.

---

## البدء السريع

> **يتطلب OpenClaw 2026.4.10 أو أعلى.** شغّل `openclaw --version` للتحقق. قم بالترقية باستخدام `openclaw update`.

<Steps>
  <Step title="أضف قناة Yuanbao باستخدام بيانات اعتمادك">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  تستخدم قيمة `--token` صيغة `appKey:appSecret` مفصولة بنقطتين رأسيتين. يمكنك الحصول عليهما من تطبيق Yuanbao عبر إنشاء روبوت في إعدادات تطبيقك.
  </Step>

  <Step title="بعد اكتمال الإعداد، أعد تشغيل Gateway لتطبيق التغييرات">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### الإعداد التفاعلي (بديل)

يمكنك أيضًا استخدام المعالج التفاعلي:

```bash
openclaw channels login --channel yuanbao
```

اتبع المطالبات لإدخال App ID و App Secret.

---

## التحكم في الوصول

### الرسائل المباشرة

اضبط `dmPolicy` للتحكم في من يمكنه إرسال رسائل مباشرة إلى الروبوت:

- `"pairing"` - يتلقى المستخدمون غير المعروفين رمز إقران؛ وافق عليه عبر CLI
- `"allowlist"` - لا يمكن الدردشة إلا للمستخدمين المدرجين في `allowFrom`
- `"open"` - السماح لجميع المستخدمين (الافتراضي)
- `"disabled"` - تعطيل جميع الرسائل المباشرة

**الموافقة على طلب إقران:**

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### محادثات المجموعات

**متطلب الإشارة** (`channels.yuanbao.requireMention`):

- `true` - تتطلب @mention (الافتراضي)
- `false` - الرد دون @mention

تُعامل الإجابة على رسالة الروبوت في محادثة مجموعة كإشارة ضمنية.

---

## أمثلة الإعداد

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

| الأمر      | الوصف                          |
| ---------- | ------------------------------ |
| `/help`    | عرض الأوامر المتاحة            |
| `/status`  | عرض حالة الروبوت               |
| `/new`     | بدء جلسة جديدة                 |
| `/stop`    | إيقاف التشغيل الحالي           |
| `/restart` | إعادة تشغيل OpenClaw           |
| `/compact` | ضغط سياق الجلسة                |

> يدعم Yuanbao قوائم أوامر الشرطة المائلة الأصلية. تتم مزامنة الأوامر مع المنصة تلقائيًا عند بدء Gateway.

---

## استكشاف الأخطاء وإصلاحها

### لا يستجيب الروبوت في محادثات المجموعات

1. تأكد من إضافة الروبوت إلى المجموعة
2. تأكد من أنك تشير إلى الروبوت باستخدام @mention (مطلوب افتراضيًا)
3. تحقق من السجلات: `openclaw logs --follow`

### لا يتلقى الروبوت الرسائل

1. تأكد من إنشاء الروبوت والموافقة عليه في تطبيق Yuanbao
2. تأكد من تكوين `appKey` و `appSecret` بشكل صحيح
3. تأكد من تشغيل Gateway: `openclaw gateway status`
4. تحقق من السجلات: `openclaw logs --follow`

### يرسل الروبوت ردودًا فارغة أو احتياطية

1. تحقق مما إذا كان نموذج الذكاء الاصطناعي يعيد محتوى صالحًا
2. الرد الاحتياطي الافتراضي هو: "暂时无法解答，你可以换个问题问问我哦"
3. خصصه عبر `channels.yuanbao.fallbackReply`

### تسرّب App Secret

1. أعد تعيين App Secret في YuanBao APP
2. حدّث القيمة في إعدادك
3. أعد تشغيل Gateway: `openclaw gateway restart`

---

## الإعداد المتقدم

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

يتحكم `defaultAccount` في الحساب المستخدم عندما لا تحدد واجهات برمجة التطبيقات الصادرة `accountId`.

### حدود الرسائل

- `maxChars` - الحد الأقصى لعدد الأحرف في رسالة واحدة (الافتراضي: `3000` حرف)
- `mediaMaxMb` - حد رفع/تنزيل الوسائط (الافتراضي: `20` ميغابايت)
- `overflowPolicy` - السلوك عندما تتجاوز الرسالة الحد: `"split"` (الافتراضي) أو `"stop"`

### البث

يدعم Yuanbao إخراج البث على مستوى الكتلة. عند تمكينه، يرسل الروبوت النص في أجزاء أثناء إنشائه.

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // block streaming enabled (default)
    },
  },
}
```

عيّن `disableBlockStreaming: true` لإرسال الرد الكامل في رسالة واحدة.

### سياق سجل محادثة المجموعة

تحكم في عدد الرسائل التاريخية المضمنة في سياق الذكاء الاصطناعي لمحادثات المجموعات:

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

تحكم في كيفية اقتباس الروبوت للرسائل عند الرد في محادثات المجموعات:

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
| `"off"`   | لا يوجد رد مقتبس                                      |
| `"first"` | اقتباس الرد الأول فقط لكل رسالة واردة (الافتراضي)     |
| `"all"`   | اقتباس كل رد                                          |

### حقن تلميح Markdown

افتراضيًا، يحقن الروبوت تعليمات في موجه النظام لمنع نموذج الذكاء الاصطناعي من تغليف الرد بالكامل في كتل كود markdown.

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

فعّل إخراج السجلات غير المنقح لمعرفات روبوت محددة:

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

### توجيه الوكلاء المتعددين

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
- `match.peer.kind`: `"direct"` (رسالة مباشرة) أو `"group"` (محادثة مجموعة)
- `match.peer.id`: معرف المستخدم أو رمز المجموعة

---

## مرجع الإعدادات

الإعداد الكامل: [إعداد Gateway](/ar/gateway/configuration)

| الإعداد                                    | الوصف                                             | الافتراضي                              |
| ------------------------------------------ | ------------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                 | تمكين/تعطيل القناة                                | `true`                                 |
| `channels.yuanbao.defaultAccount`          | الحساب الافتراضي للتوجيه الصادر                   | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key (يُستخدم للتوقيع وإنشاء التذكرة)          | -                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret (يُستخدم للتوقيع)                      | -                                      |
| `channels.yuanbao.accounts.<id>.token`     | رمز موقّع مسبقًا (يتجاوز توقيع التذكرة تلقائيًا) | -                                      |
| `channels.yuanbao.accounts.<id>.name`      | اسم عرض الحساب                                    | -                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | تمكين/تعطيل حساب محدد                             | `true`                                 |
| `channels.yuanbao.dm.policy`               | سياسة الرسائل المباشرة                            | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | قائمة السماح للرسائل المباشرة (قائمة معرفات المستخدمين) | -                                      |
| `channels.yuanbao.requireMention`          | طلب @mention في المجموعات                         | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | معالجة الرسائل الطويلة (`split` أو `stop`)        | `split`                                |
| `channels.yuanbao.replyToMode`             | استراتيجية الرد على في المجموعات (`off`، `first`، `all`) | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`   | الاستراتيجية الصادرة (`merge-text` أو `immediate`) | `merge-text`                           |
| `channels.yuanbao.minChars`                | دمج النص: الحد الأدنى للأحرف لتشغيل الإرسال       | `2800`                                 |
| `channels.yuanbao.maxChars`                | دمج النص: الحد الأقصى للأحرف لكل رسالة            | `3000`                                 |
| `channels.yuanbao.idleMs`                  | دمج النص: مهلة الخمول قبل التفريغ التلقائي (مللي ثانية) | `5000`                                 |
| `channels.yuanbao.mediaMaxMb`              | حد حجم الوسائط (ميغابايت)                         | `20`                                   |
| `channels.yuanbao.historyLimit`            | إدخالات سياق سجل محادثة المجموعة                  | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`   | تعطيل إخراج البث على مستوى الكتلة                 | `false`                                |
| `channels.yuanbao.fallbackReply`           | رد احتياطي عندما لا يعيد الذكاء الاصطناعي أي محتوى | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | حقن تعليمات منع تغليف markdown                    | `true`                                 |
| `channels.yuanbao.debugBotIds`             | معرفات الروبوت في قائمة السماح للتصحيح (سجلات غير منقحة) | `[]`                                   |

---

## أنواع الرسائل المدعومة

### الاستلام

- ✅ النص
- ✅ الصور
- ✅ الملفات
- ✅ الصوت / الصوتيات
- ✅ الفيديو
- ✅ الملصقات / الرموز التعبيرية المخصصة
- ✅ العناصر المخصصة (بطاقات الروابط، إلخ)

### الإرسال

- ✅ النص (مع دعم markdown)
- ✅ الصور
- ✅ الملفات
- ✅ الصوت
- ✅ الفيديو
- ✅ الملصقات

### السلاسل والردود

- ✅ الردود المقتبسة (قابلة للتكوين عبر `replyToMode`)
- ❌ ردود السلاسل (غير مدعومة من المنصة)

---

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) - كل القنوات المدعومة
- [الإقران](/ar/channels/pairing) - مصادقة الرسائل المباشرة وتدفق الإقران
- [المجموعات](/ar/channels/groups) - سلوك محادثة المجموعة وبوابة الإشارة
- [توجيه القنوات](/ar/channels/channel-routing) - توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) - نموذج الوصول والتحصين

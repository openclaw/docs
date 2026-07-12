---
read_when:
    - تريد ربط بوت Yuanbao
    - أنت تقوم بإعداد قناة Yuanbao
summary: نظرة عامة على روبوت Yuanbao وميزاته وإعداده
title: يوانباو
x-i18n:
    generated_at: "2026-07-12T05:39:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43488834f588530206b290cb0fb185fd1fe2e1f214ab4a4ccccc49b9b549b6ac
    source_path: channels/yuanbao.md
    workflow: 16
---

Tencent Yuanbao هي منصة مساعد الذكاء الاصطناعي من Tencent. يربط Plugin ‏`openclaw-plugin-yuanbao`، الذي يديره المجتمع، روبوتات Yuanbao بـ OpenClaw عبر WebSocket للرسائل المباشرة ومحادثات المجموعات.

**الحالة:** جاهز للاستخدام في بيئة الإنتاج للرسائل المباشرة مع الروبوت ومحادثات المجموعات. WebSocket هو وضع الاتصال الوحيد المدعوم. يدير فريق Tencent Yuanbao هذا الـ Plugin بصفته إدخالًا خارجيًا في الكتالوج، وليس فريق OpenClaw الأساسي؛ وتأتي تفاصيل الإعدادات والسلوك أدناه (باستثناء التثبيت وواجهة CLI العامة) من وثائق الـ Plugin نفسه، ولم يُتحقق منها مقابل مصدر OpenClaw الأساسي.

## البدء السريع

يتطلب OpenClaw 2026.4.10 أو إصدارًا أحدث. تحقق باستخدام `openclaw --version`، ورقِّ باستخدام `openclaw update`.

<Steps>
  <Step title="أضف قناة Yuanbao باستخدام بيانات اعتمادك">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  يستخدم `--token` الصيغة `appKey:appSecret` المفصولة بنقطتين. احصل على هاتين القيمتين من تطبيق Yuanbao بإنشاء روبوت ضمن إعدادات تطبيقك.
  </Step>

  <Step title="أعد تشغيل Gateway لتطبيق التغيير">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### الإعداد التفاعلي (بديل)

```bash
openclaw channels login --channel yuanbao
```

اتبع المطالبات لإدخال معرّف التطبيق والسر الخاص بالتطبيق.

## التحكم في الوصول

### الرسائل المباشرة

`channels.yuanbao.dm.policy`:

| القيمة           | السلوك                                                    |
| ---------------- | --------------------------------------------------------- |
| `open` (افتراضي) | السماح لجميع المستخدمين                                   |
| `pairing`        | يحصل المستخدمون المجهولون على رمز إقران؛ وافق عبر CLI     |
| `allowlist`      | لا يمكن إلا للمستخدمين المدرجين في `allowFrom` الدردشة    |
| `disabled`       | تعطيل جميع الرسائل المباشرة                               |

للموافقة على طلب إقران:

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### محادثات المجموعات

`channels.yuanbao.requireMention` (القيمة الافتراضية `true`): يتطلب إشارة @ قبل أن يرد الروبوت في مجموعة. يُعامل الرد على رسالة الروبوت نفسه باعتباره إشارة ضمنية.

## أمثلة الإعدادات

إعداد أساسي مع سياسة رسائل مباشرة مفتوحة:

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

تقييد الرسائل المباشرة على مستخدمين محددين:

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

تعطيل متطلب الإشارة @ في المجموعات:

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

ضبط تسليم الرسائل الصادرة:

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // التخزين المؤقت حتى بلوغ هذا العدد من المحارف
      maxChars: 3000, // فرض التقسيم عند تجاوز هذا الحد
      idleMs: 5000, // الإرسال التلقائي بعد مهلة الخمول (مللي ثانية)
    },
  },
}
```

عيّن `outboundQueueStrategy: "immediate"` لإرسال كل جزء دون تخزين مؤقت.

## الأوامر الشائعة

| الأمر      | الوصف                         |
| ---------- | ----------------------------- |
| `/help`    | عرض الأوامر المتاحة           |
| `/status`  | عرض حالة الروبوت              |
| `/new`     | بدء جلسة جديدة                |
| `/stop`    | إيقاف التشغيل الحالي          |
| `/restart` | إعادة تشغيل OpenClaw          |
| `/compact` | ضغط سياق الجلسة               |

يدعم Yuanbao قوائم أوامر الشرطة المائلة الأصلية؛ وتُزامَن الأوامر تلقائيًا مع المنصة عند بدء تشغيل Gateway.

## استكشاف الأخطاء وإصلاحها

**لا يستجيب الروبوت في محادثات المجموعات:**

1. تأكد من إضافة الروبوت إلى المجموعة
2. تأكد من الإشارة إلى الروبوت باستخدام @ (مطلوبة افتراضيًا)
3. تحقق من السجلات: `openclaw logs --follow`

**لا يستقبل الروبوت الرسائل:**

1. تأكد من إنشاء الروبوت والموافقة عليه في تطبيق Yuanbao
2. تأكد من إعداد `appKey` و`appSecret` بصورة صحيحة
3. تأكد من تشغيل Gateway: ‏`openclaw gateway status`
4. تحقق من السجلات: `openclaw logs --follow`

**يرسل الروبوت ردودًا فارغة أو احتياطية:**

1. تحقق مما إذا كان نموذج الذكاء الاصطناعي يُرجع محتوى صالحًا
2. الرد الاحتياطي الافتراضي: "暂时无法解答，你可以换个问题问问我哦"
3. خصّصه باستخدام `channels.yuanbao.fallbackReply`

**تسرّب السر الخاص بالتطبيق:**

1. أعد تعيين السر الخاص بالتطبيق في تطبيق Yuanbao
2. حدّث القيمة في إعداداتك
3. أعد تشغيل Gateway: ‏`openclaw gateway restart`

## الإعدادات المتقدمة

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

يتحكم `defaultAccount` في الحساب المستخدم عندما لا تحدد واجهات API الصادرة قيمة `accountId`.

### حدود الرسائل

- `maxChars`: الحد الأقصى لعدد المحارف في الرسالة الواحدة (الافتراضي `3000`)
- `mediaMaxMb`: حد رفع/تنزيل الوسائط (الافتراضي `20` ميغابايت)
- `overflowPolicy`: السلوك عندما تتجاوز الرسالة الحد، إما `"split"` (الافتراضي) أو `"stop"`

### البث

يدعم Yuanbao إخراج البث على مستوى الكتل؛ يرسل الروبوت النص في أجزاء أثناء إنشائه.

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // بث الكتل مفعّل (افتراضيًا)
    },
  },
}
```

عيّن `disableBlockStreaming: true` لإرسال الرد الكامل في رسالة واحدة.

### سياق سجل محادثة المجموعة

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // الافتراضي: 100، عيّن 0 للتعطيل
    },
  },
}
```

يتحكم في عدد الرسائل السابقة المضمّنة في سياق الذكاء الاصطناعي لمحادثات المجموعات.

### وضع الرد على

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (الافتراضي: "first")
    },
  },
}
```

| القيمة  | السلوك                                                        |
| ------- | ------------------------------------------------------------- |
| `off`   | دون رد مقتبس                                                  |
| `first` | اقتباس الرد الأول فقط لكل رسالة واردة (افتراضي)               |
| `all`   | اقتباس كل رد                                                  |

### حقن تلميح Markdown

افتراضيًا، يحقن الروبوت تعليمة في مطالبة النظام لمنع النموذج من إحاطة الرد كاملًا بكتلة تعليمات برمجية بتنسيق Markdown.

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // الافتراضي: true
    },
  },
}
```

### وضع تصحيح الأخطاء

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

يُمكّن إخراج سجلات غير منقّح لمعرّفات الروبوتات المدرجة.

### توجيه الوكلاء المتعددين

استخدم `bindings` لتوجيه الرسائل المباشرة أو مجموعات Yuanbao إلى وكلاء مختلفين:

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

- `match.channel`: ‏`"yuanbao"`
- `match.peer.kind`: ‏`"direct"` (رسالة مباشرة) أو `"group"` (محادثة مجموعة)
- `match.peer.id`: معرّف المستخدم أو رمز المجموعة

## مرجع الإعدادات

الإعدادات الكاملة: [إعدادات Gateway](/ar/gateway/configuration)

| الإعداد                                    | الوصف                                                     | القيمة الافتراضية                       |
| ------------------------------------------ | --------------------------------------------------------- | --------------------------------------- |
| `channels.yuanbao.enabled`                 | تمكين/تعطيل القناة                                        | `true`                                  |
| `channels.yuanbao.defaultAccount`          | الحساب الافتراضي لتوجيه الرسائل الصادرة                   | `default`                               |
| `channels.yuanbao.accounts.<id>.appKey`    | مفتاح التطبيق (التوقيع + إنشاء التذكرة)                   | -                                       |
| `channels.yuanbao.accounts.<id>.appSecret` | السر الخاص بالتطبيق (التوقيع)                             | -                                       |
| `channels.yuanbao.accounts.<id>.token`     | رمز مميز موقّع مسبقًا (يتجاوز توقيع التذكرة التلقائي)     | -                                       |
| `channels.yuanbao.accounts.<id>.name`      | اسم عرض الحساب                                            | -                                       |
| `channels.yuanbao.accounts.<id>.enabled`   | تمكين/تعطيل حساب محدد                                     | `true`                                  |
| `channels.yuanbao.dm.policy`               | سياسة الرسائل المباشرة                                    | `open`                                  |
| `channels.yuanbao.dm.allowFrom`            | قائمة السماح للرسائل المباشرة (قائمة معرّفات المستخدمين)   | -                                       |
| `channels.yuanbao.requireMention`          | اشتراط الإشارة @ في المجموعات                             | `true`                                  |
| `channels.yuanbao.overflowPolicy`          | معالجة الرسائل الطويلة (`split` أو `stop`)                | `split`                                 |
| `channels.yuanbao.replyToMode`             | استراتيجية الرد على في المجموعات (`off` أو `first` أو `all`) | `first`                              |
| `channels.yuanbao.outboundQueueStrategy`   | استراتيجية الرسائل الصادرة (`merge-text` أو `immediate`) | `merge-text`                            |
| `channels.yuanbao.minChars`                | دمج النص: الحد الأدنى من المحارف لبدء الإرسال              | `2800`                                  |
| `channels.yuanbao.maxChars`                | دمج النص: الحد الأقصى من المحارف لكل رسالة                | `3000`                                  |
| `channels.yuanbao.idleMs`                  | دمج النص: مهلة الخمول قبل الإرسال التلقائي (مللي ثانية)   | `5000`                                  |
| `channels.yuanbao.mediaMaxMb`              | حد حجم الوسائط (ميغابايت)                                 | `20`                                    |
| `channels.yuanbao.historyLimit`            | عدد إدخالات سياق سجل محادثة المجموعة                     | `100`                                   |
| `channels.yuanbao.disableBlockStreaming`   | تعطيل إخراج البث على مستوى الكتل                           | `false`                                 |
| `channels.yuanbao.fallbackReply`           | الرد الاحتياطي عندما لا يُرجع النموذج أي محتوى             | `暂时无法解答，你可以换个问题问问我哦`  |
| `channels.yuanbao.markdownHintEnabled`     | حقن تعليمات منع الإحاطة بتنسيق Markdown                   | `true`                                  |
| `channels.yuanbao.debugBotIds`             | معرّفات روبوتات قائمة السماح لتصحيح الأخطاء (سجلات غير منقّحة) | `[]`                                |

## أنواع الرسائل المدعومة

**الاستقبال:** النصوص والصور والملفات والصوت/الرسائل الصوتية والفيديو والملصقات/الرموز التعبيرية المخصصة والعناصر المخصصة (بطاقات الروابط).

**الإرسال:** النصوص (Markdown) والصور والملفات والصوت والفيديو والملصقات.

**سلاسل المحادثات والردود:** الردود المقتبسة (قابلة للإعداد عبر `replyToMode`)؛ لا تدعم المنصة الردود ضمن سلاسل المحادثات.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) - جميع القنوات المدعومة
- [الإقران](/ar/channels/pairing) - مصادقة الرسائل المباشرة ومسار الإقران
- [المجموعات](/ar/channels/groups) - سلوك محادثات المجموعات والتحكم بشرط الإشارة
- [توجيه القنوات](/ar/channels/channel-routing) - توجيه جلسات الرسائل
- [الأمان](/ar/gateway/security) - نموذج الوصول والتحصين

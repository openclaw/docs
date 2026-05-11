---
read_when:
    - تريد ربط روبوت Feishu/Lark
    - أنت تُهيّئ قناة Feishu
summary: نظرة عامة على روبوت Feishu وميزاته وتكوينه
title: Feishu
x-i18n:
    generated_at: "2026-05-11T20:20:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d4e43c65072d44cb5973a1ed09cb5336f18d100d0cb5b43c5e31f37aecff329
    source_path: channels/feishu.md
    workflow: 16
---

Feishu/Lark هي منصة تعاون شاملة تتيح للفرق الدردشة ومشاركة المستندات وإدارة التقويمات وإنجاز العمل معا.

**الحالة:** جاهزة للإنتاج للرسائل المباشرة مع البوت + محادثات المجموعات. WebSocket هو الوضع الافتراضي؛ وضع Webhook اختياري.

---

## البدء السريع

<Note>
يتطلب OpenClaw 2026.4.25 أو أحدث. شغّل `openclaw --version` للتحقق. حدّث باستخدام `openclaw update`.
</Note>

<Steps>
  <Step title="شغّل معالج إعداد القناة">
  ```bash
  openclaw channels login --channel feishu
  ```
  اختر الإعداد اليدوي للصق App ID وApp Secret من Feishu Open Platform، أو اختر إعداد QR لإنشاء بوت تلقائيا. إذا لم يتفاعل تطبيق Feishu المحلي على الهاتف مع رمز QR، فأعد تشغيل الإعداد واختر الإعداد اليدوي.
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
- `"allowlist"` - يمكن فقط للمستخدمين المدرجين في `allowFrom` الدردشة (الافتراضي: مالك البوت فقط)
- `"open"` - اسمح بالرسائل المباشرة العامة فقط عندما يتضمن `allowFrom` القيمة `"*"`؛ مع الإدخالات المقيّدة، يمكن فقط للمستخدمين المطابقين الدردشة
- `"disabled"` - عطّل كل الرسائل المباشرة

**الموافقة على طلب اقتران:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### محادثات المجموعات

**سياسة المجموعة** (`channels.feishu.groupPolicy`):

| القيمة        | السلوك                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------- |
| `"open"`      | الرد على كل الرسائل في المجموعات                                                               |
| `"allowlist"` | الرد فقط على المجموعات في `groupAllowFrom` أو المكوّنة صراحة ضمن `groups.<chat_id>`            |
| `"disabled"`  | تعطيل كل رسائل المجموعات؛ لا تتجاوز إدخالات `groups.<chat_id>` الصريحة ذلك                    |

الافتراضي: `allowlist`

**متطلب الإشارة** (`channels.feishu.requireMention`):

- `true` - يتطلب @mention (الافتراضي)
- `false` - الرد دون @mention
- تجاوز لكل مجموعة: `channels.feishu.groups.<chat_id>.requireMention`
- لا تُعامل إشارات البث فقط `@all` و`@_all` كإشارات إلى البوت. الرسالة التي تشير إلى كل من `@all` والبوت مباشرة لا تزال تُحتسب كإشارة إلى البوت.

---

## أمثلة تكوين المجموعات

### السماح لكل المجموعات، دون الحاجة إلى @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### السماح لكل المجموعات، مع استمرار اشتراط @mention

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

في وضع `allowlist`، يمكنك أيضا قبول مجموعة بإضافة إدخال `groups.<chat_id>` صريح. لا تتجاوز الإدخالات الصريحة `groupPolicy: "disabled"`. تضبط الافتراضات العامة ضمن `groups.*` المجموعات المطابقة، لكنها لا تقبل المجموعات بمفردها.

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

## الحصول على معرّفات المجموعات/المستخدمين

### معرّفات المجموعات (`chat_id`، التنسيق: `oc_xxx`)

افتح المجموعة في Feishu/Lark، وانقر أيقونة القائمة في الزاوية العلوية اليمنى، وانتقل إلى **الإعدادات**. يظهر معرّف المجموعة (`chat_id`) في صفحة الإعدادات.

![الحصول على معرّف المجموعة](/images/feishu-get-group-id.png)

### معرّفات المستخدمين (`open_id`، التنسيق: `ou_xxx`)

ابدأ Gateway، وأرسل رسالة مباشرة إلى البوت، ثم تحقق من السجلات:

```bash
openclaw logs --follow
```

ابحث عن `open_id` في مخرجات السجل. يمكنك أيضا التحقق من طلبات الاقتران المعلقة:

```bash
openclaw pairing list feishu
```

---

## الأوامر الشائعة

| الأمر     | الوصف                         |
| --------- | ----------------------------- |
| `/status` | عرض حالة البوت                |
| `/reset`  | إعادة ضبط الجلسة الحالية      |
| `/model`  | عرض نموذج الذكاء الاصطناعي أو تبديله |

<Note>
لا يدعم Feishu/Lark قوائم أوامر الشرطة المائلة الأصلية، لذا أرسل هذه كرسائل نصية عادية.
</Note>

---

## استكشاف الأخطاء وإصلاحها

### البوت لا يرد في محادثات المجموعات

1. تأكد من إضافة البوت إلى المجموعة
2. تأكد من استخدام @mention للبوت (مطلوب افتراضيا)
3. تحقق من أن `groupPolicy` ليست `"disabled"`
4. تحقق من السجلات: `openclaw logs --follow`

### البوت لا يتلقى الرسائل

1. تأكد من نشر البوت والموافقة عليه في Feishu Open Platform / Lark Developer
2. تأكد من أن اشتراك الأحداث يتضمن `im.message.receive_v1`
3. تأكد من اختيار **الاتصال المستمر** (WebSocket)
4. تأكد من منح كل نطاقات الأذونات المطلوبة
5. تأكد من أن Gateway قيد التشغيل: `openclaw gateway status`
6. تحقق من السجلات: `openclaw logs --follow`

### إعداد QR لا يتفاعل في تطبيق Feishu للهاتف

1. أعد تشغيل الإعداد: `openclaw channels login --channel feishu`
2. اختر الإعداد اليدوي
3. في Feishu Open Platform، أنشئ تطبيقا ذاتي البناء وانسخ App ID وApp Secret الخاصين به
4. الصق بيانات الاعتماد هذه في معالج الإعداد

### تسرّب App Secret

1. أعد ضبط App Secret في Feishu Open Platform / Lark Developer
2. حدّث القيمة في تكوينك
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
يستخدم `accounts.<id>.tts` الشكل نفسه مثل `messages.tts` ويُدمج بعمق فوق
تكوين TTS العام، بحيث يمكن لإعدادات Feishu متعددة البوتات الاحتفاظ ببيانات اعتماد
الموفر المشتركة عالميا مع تجاوز الصوت أو النموذج أو الشخصية أو الوضع التلقائي فقط
لكل حساب.

### حدود الرسائل

- `textChunkLimit` - حجم مقطع النص الصادر (الافتراضي: `2000` حرف)
- `mediaMaxMb` - حد رفع/تنزيل الوسائط (الافتراضي: `30` ميغابايت)

### البث

يدعم Feishu/Lark الردود المتدفقة عبر البطاقات التفاعلية. عند التفعيل، يحدّث البوت البطاقة في الوقت الفعلي أثناء إنشاء النص.

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

قلّل عدد استدعاءات API في Feishu/Lark باستخدام علمين اختياريين:

- `typingIndicator` (الافتراضي `true`): اضبطه على `false` لتجاوز استدعاءات تفاعل الكتابة
- `resolveSenderNames` (الافتراضي `true`): اضبطه على `false` لتجاوز عمليات البحث عن ملف تعريف المرسل

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

يدعم Feishu/Lark استخدام ACP للرسائل المباشرة ورسائل سلاسل المجموعات. يعتمد ACP في Feishu/Lark على الأوامر النصية - لا توجد قوائم أوامر شرطة مائلة أصلية، لذا استخدم رسائل `/acp ...` مباشرة في المحادثة.

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

يعمل `--thread here` مع الرسائل المباشرة ورسائل السلاسل في Feishu/Lark. تُوجّه رسائل المتابعة في المحادثة المرتبطة مباشرة إلى جلسة ACP تلك.

### توجيه متعدد الوكلاء

استخدم `bindings` لتوجيه رسائل Feishu/Lark المباشرة أو المجموعات إلى وكلاء مختلفين.

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
- `match.peer.kind`: `"direct"` (رسالة مباشرة) أو `"group"` (محادثة مجموعة)
- `match.peer.id`: Open ID للمستخدم (`ou_xxx`) أو معرّف المجموعة (`oc_xxx`)

راجع [الحصول على معرّفات المجموعات/المستخدمين](#get-groupuser-ids) لنصائح البحث.

---

## مرجع التكوين

التكوين الكامل: [تكوين Gateway](/ar/gateway/configuration)

| الإعداد                                           | الوصف                                                                      | الافتراضي          |
| ------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | تفعيل/تعطيل القناة                                                       | `true`           |
| `channels.feishu.domain`                          | نطاق API (`feishu` أو `lark`)                                                  | `feishu`         |
| `channels.feishu.connectionMode`                  | نقل الأحداث (`websocket` أو `webhook`)                                       | `websocket`      |
| `channels.feishu.defaultAccount`                  | الحساب الافتراضي للتوجيه الصادر                                             | `default`        |
| `channels.feishu.verificationToken`               | مطلوب لوضع Webhook                                                        | -                |
| `channels.feishu.encryptKey`                      | مطلوب لوضع Webhook                                                        | -                |
| `channels.feishu.webhookPath`                     | مسار توجيه Webhook                                                               | `/feishu/events` |
| `channels.feishu.webhookHost`                     | مضيف ربط Webhook                                                                | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | منفذ ربط Webhook                                                                | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | معرّف التطبيق                                                                           | -                |
| `channels.feishu.accounts.<id>.appSecret`         | سر التطبيق                                                                       | -                |
| `channels.feishu.accounts.<id>.domain`            | تجاوز النطاق لكل حساب                                                      | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | تجاوز TTS لكل حساب                                                         | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | سياسة الرسائل المباشرة                                                                        | `allowlist`      |
| `channels.feishu.allowFrom`                       | قائمة السماح للرسائل المباشرة (قائمة open_id)                                                      | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | سياسة المجموعات                                                                     | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | قائمة السماح للمجموعات                                                                  | -                |
| `channels.feishu.requireMention`                  | اشتراط @mention في المجموعات                                                       | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | تجاوز @mention لكل مجموعة؛ تسمح المعرّفات الصريحة أيضًا بدخول المجموعة في وضع قائمة السماح | موروث        |
| `channels.feishu.groups.<chat_id>.enabled`        | تفعيل/تعطيل مجموعة محددة                                                  | `true`           |
| `channels.feishu.textChunkLimit`                  | حجم جزء الرسالة                                                               | `2000`           |
| `channels.feishu.mediaMaxMb`                      | حد حجم الوسائط                                                                 | `30`             |
| `channels.feishu.streaming`                       | إخراج البطاقة بالبث                                                            | `true`           |
| `channels.feishu.blockStreaming`                  | بث رد الكتلة المكتملة                                                  | `false`          |
| `channels.feishu.typingIndicator`                 | إرسال تفاعلات الكتابة                                                            | `true`           |
| `channels.feishu.resolveSenderNames`              | حل أسماء عرض المرسلين                                                     | `true`           |

---

## أنواع الرسائل المدعومة

### الاستقبال

- ✅ نص
- ✅ نص منسق (منشور)
- ✅ صور
- ✅ ملفات
- ✅ صوت
- ✅ فيديو/وسائط
- ✅ ملصقات

تُطبَّع رسائل Feishu/Lark الصوتية الواردة كعناصر نائبة للوسائط بدلًا من
JSON `file_key` الخام. عند تكوين `tools.media.audio`، ينزّل OpenClaw
مورد الملاحظة الصوتية ويشغّل نسخ الصوت المشترك قبل دور الوكيل، بحيث يتلقى الوكيل
النص المنسوخ للكلام. إذا تضمّن Feishu نص النسخ مباشرةً في حمولة الصوت،
فسيُستخدم ذلك النص دون استدعاء ASR آخر. من دون موفّر نسخ صوتي، يظل الوكيل يتلقى
عنصرًا نائبًا `<media:audio>` مع المرفق المحفوظ، وليس حمولة مورد Feishu الخام.

### الإرسال

- ✅ نص
- ✅ صور
- ✅ ملفات
- ✅ صوت
- ✅ فيديو/وسائط
- ✅ بطاقات تفاعلية (بما في ذلك تحديثات البث)
- ⚠️ نص منسق (تنسيق بنمط المنشورات؛ لا يدعم قدرات التأليف الكاملة في Feishu/Lark)

تستخدم فقاعات الصوت الأصلية في Feishu/Lark نوع رسالة Feishu `audio` وتتطلب
وسائط رفع Ogg/Opus (`file_type: "opus"`). تُرسل وسائط `.opus` و`.ogg` الموجودة
مباشرةً كصوت أصلي. تُحوَّل MP3/WAV/M4A والتنسيقات الصوتية المحتملة الأخرى
إلى Ogg/Opus بتردد 48kHz باستخدام `ffmpeg` فقط عندما يطلب الرد تسليمًا صوتيًا
(`audioAsVoice` / أداة الرسائل `asVoice`، بما في ذلك ردود الملاحظات الصوتية عبر TTS).
تبقى مرفقات MP3 العادية ملفات عادية. إذا كان `ffmpeg` مفقودًا أو فشل التحويل،
يتراجع OpenClaw إلى مرفق ملف ويسجل السبب.

### المحادثات والردود

- ✅ ردود مضمنة
- ✅ ردود ضمن المحادثة
- ✅ تظل ردود الوسائط مدركة للمحادثة عند الرد على رسالة ضمن محادثة

بالنسبة إلى `groupSessionScope: "group_topic"` و`"group_topic_sender"`، تستخدم
مجموعات المواضيع الأصلية في Feishu/Lark `thread_id` (`omt_*`) من الحدث كمفتاح
جلسة الموضوع الأساسي. إذا حذف حدث بدء موضوع أصلي `thread_id`، فسيستخرجه OpenClaw
من Feishu قبل توجيه الدور. تواصل ردود المجموعات العادية التي يحولها OpenClaw
إلى محادثات استخدام معرّف رسالة جذر الرد (`om_*`) بحيث يبقى الدور الأول ودور المتابعة
في الجلسة نفسها.

---

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels) - كل القنوات المدعومة
- [الاقتران](/ar/channels/pairing) - مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) - سلوك دردشة المجموعات وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) - توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) - نموذج الوصول والتقوية

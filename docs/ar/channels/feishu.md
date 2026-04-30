---
read_when:
    - تريد ربط روبوت Feishu/Lark
    - أنت تقوم بتكوين قناة Feishu
summary: نظرة عامة على بوت Feishu وميزاته وتكوينه
title: Feishu
x-i18n:
    generated_at: "2026-04-30T07:40:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37de7cbb12821f119ca1a06fcdb8e80a07752e1cbfc462344d24750fbf13147a
    source_path: channels/feishu.md
    workflow: 16
---

# فيشو / لارك

Feishu/Lark هي منصة تعاون شاملة تتيح للفرق الدردشة ومشاركة المستندات وإدارة التقويمات وإنجاز العمل معا.

**الحالة:** جاهز للإنتاج للرسائل المباشرة مع البوت ودردشات المجموعات. WebSocket هو الوضع الافتراضي؛ ووضع webhook اختياري.

---

## البدء السريع

<Note>
يتطلب OpenClaw 2026.4.25 أو أحدث. شغل `openclaw --version` للتحقق. حدّث باستخدام `openclaw update`.
</Note>

<Steps>
  <Step title="شغّل معالج إعداد القناة">
  ```bash
  openclaw channels login --channel feishu
  ```
  امسح رمز QR باستخدام تطبيق Feishu/Lark على هاتفك لإنشاء بوت Feishu/Lark تلقائيا.
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

اضبط `dmPolicy` للتحكم في من يمكنه إرسال رسالة مباشرة إلى البوت:

- `"pairing"` — يتلقى المستخدمون غير المعروفين رمز اقتران؛ وافق عليه عبر CLI
- `"allowlist"` — لا يمكن الدردشة إلا للمستخدمين المدرجين في `allowFrom` (الافتراضي: مالك البوت فقط)
- `"open"` — السماح بالرسائل المباشرة العامة فقط عندما يتضمن `allowFrom` القيمة `"*"`؛ ومع الإدخالات المقيّدة، لا يمكن الدردشة إلا للمستخدمين المطابقين
- `"disabled"` — تعطيل كل الرسائل المباشرة

**الموافقة على طلب اقتران:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### دردشات المجموعات

**سياسة المجموعة** (`channels.feishu.groupPolicy`):

| القيمة         | السلوك                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | الرد على كل الرسائل في المجموعات                                                            |
| `"allowlist"` | الرد فقط على المجموعات في `groupAllowFrom` أو المكوّنة صراحة ضمن `groups.<chat_id>` |
| `"disabled"`  | تعطيل كل رسائل المجموعات؛ لا تتجاوز إدخالات `groups.<chat_id>` الصريحة ذلك         |

الافتراضي: `allowlist`

**متطلب الإشارة** (`channels.feishu.requireMention`):

- `true` — يتطلب @mention (الافتراضي)
- `false` — الرد من دون @mention
- تجاوز لكل مجموعة: `channels.feishu.groups.<chat_id>.requireMention`
- لا تُعامل إشارات البث فقط `@all` و`@_all` كإشارات إلى البوت. الرسالة التي تشير إلى كل من `@all` والبوت مباشرة ما زالت تُحتسب كإشارة إلى البوت.

---

## أمثلة تكوين المجموعات

### السماح لكل المجموعات، من دون طلب @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### السماح لكل المجموعات، مع استمرار طلب @mention

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

في وضع `allowlist`، يمكنك أيضا قبول مجموعة بإضافة إدخال `groups.<chat_id>` صريح. لا تتجاوز الإدخالات الصريحة `groupPolicy: "disabled"`. تضبط الإعدادات الافتراضية ذات أحرف البدل ضمن `groups.*` المجموعات المطابقة، لكنها لا تقبل المجموعات بذاتها.

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

### معرّفات المجموعات (`chat_id`، الصيغة: `oc_xxx`)

افتح المجموعة في Feishu/Lark، وانقر أيقونة القائمة في الزاوية العلوية اليمنى، وانتقل إلى **الإعدادات**. يكون معرّف المجموعة (`chat_id`) مدرجا في صفحة الإعدادات.

![الحصول على معرّف المجموعة](/images/feishu-get-group-id.png)

### معرّفات المستخدمين (`open_id`، الصيغة: `ou_xxx`)

ابدأ تشغيل Gateway، وأرسل رسالة مباشرة إلى البوت، ثم تحقق من السجلات:

```bash
openclaw logs --follow
```

ابحث عن `open_id` في مخرجات السجل. يمكنك أيضا التحقق من طلبات الاقتران المعلّقة:

```bash
openclaw pairing list feishu
```

---

## الأوامر الشائعة

| الأمر   | الوصف                 |
| --------- | --------------------------- |
| `/status` | عرض حالة البوت             |
| `/reset`  | إعادة تعيين الجلسة الحالية   |
| `/model`  | عرض نموذج الذكاء الاصطناعي أو تبديله |

<Note>
لا يدعم Feishu/Lark قوائم أوامر الشرطة المائلة الأصلية، لذا أرسل هذه الأوامر كرسائل نصية عادية.
</Note>

---

## استكشاف الأخطاء وإصلاحها

### البوت لا يرد في دردشات المجموعات

1. تأكد من إضافة البوت إلى المجموعة
2. تأكد من استخدام @mention للإشارة إلى البوت (مطلوب افتراضيا)
3. تحقق من أن `groupPolicy` ليست `"disabled"`
4. تحقق من السجلات: `openclaw logs --follow`

### البوت لا يتلقى الرسائل

1. تأكد من نشر البوت والموافقة عليه في Feishu Open Platform / Lark Developer
2. تأكد من أن اشتراك الأحداث يتضمن `im.message.receive_v1`
3. تأكد من تحديد **الاتصال المستمر** (WebSocket)
4. تأكد من منح كل نطاقات الأذونات المطلوبة
5. تأكد من أن Gateway قيد التشغيل: `openclaw gateway status`
6. تحقق من السجلات: `openclaw logs --follow`

### تسرب App Secret

1. أعد تعيين App Secret في Feishu Open Platform / Lark Developer
2. حدّث القيمة في التكوين لديك
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
يستخدم `accounts.<id>.tts` الشكل نفسه مثل `messages.tts` ويدمج بعمق فوق
تكوين TTS العام، بحيث يمكن لإعدادات Feishu متعددة البوتات إبقاء بيانات اعتماد
الموفر المشتركة عامة مع تجاوز الصوت أو النموذج أو الشخصية أو الوضع التلقائي فقط
لكل حساب.

### حدود الرسائل

- `textChunkLimit` — حجم مقطع النص الصادر (الافتراضي: `2000` حرف)
- `mediaMaxMb` — حد رفع/تنزيل الوسائط (الافتراضي: `30` ميغابايت)

### البث

يدعم Feishu/Lark الردود المتدفقة عبر البطاقات التفاعلية. عند التمكين، يحدّث البوت البطاقة في الوقت الفعلي أثناء توليد النص.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default: true)
      blockStreaming: true, // enable block-level streaming (default: true)
    },
  },
}
```

اضبط `streaming: false` لإرسال الرد الكامل في رسالة واحدة.

### تحسين الحصة

قلل عدد استدعاءات Feishu/Lark API باستخدام علامتين اختياريتين:

- `typingIndicator` (الافتراضي `true`): اضبطه على `false` لتخطي استدعاءات تفاعل الكتابة
- `resolveSenderNames` (الافتراضي `true`): اضبطه على `false` لتخطي عمليات البحث عن ملف المرسل الشخصي

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

يدعم Feishu/Lark ‏ACP للرسائل المباشرة ورسائل سلاسل المجموعات. يكون ACP في Feishu/Lark قائما على الأوامر النصية — لا توجد قوائم أوامر شرطة مائلة أصلية، لذا استخدم رسائل `/acp ...` مباشرة في المحادثة.

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

تعمل `--thread here` للرسائل المباشرة ورسائل سلاسل Feishu/Lark. يتم توجيه رسائل المتابعة في المحادثة المرتبطة مباشرة إلى جلسة ACP تلك.

### توجيه عدة وكلاء

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
- `match.peer.kind`: `"direct"` (رسالة مباشرة) أو `"group"` (دردشة مجموعة)
- `match.peer.id`: معرّف Open ID للمستخدم (`ou_xxx`) أو معرّف المجموعة (`oc_xxx`)

راجع [الحصول على معرّفات المجموعة/المستخدم](#get-groupuser-ids) للحصول على نصائح البحث.

---

## مرجع التكوين

التكوين الكامل: [تكوين Gateway](/ar/gateway/configuration)

| الإعداد                                           | الوصف                                                                            | الافتراضي        |
| ------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | تفعيل/تعطيل القناة                                                               | `true`           |
| `channels.feishu.domain`                          | نطاق API (`feishu` أو `lark`)                                                    | `feishu`         |
| `channels.feishu.connectionMode`                  | نقل الأحداث (`websocket` أو `webhook`)                                           | `websocket`      |
| `channels.feishu.defaultAccount`                  | الحساب الافتراضي للتوجيه الصادر                                                 | `default`        |
| `channels.feishu.verificationToken`               | مطلوب لوضع Webhook                                                               | —                |
| `channels.feishu.encryptKey`                      | مطلوب لوضع Webhook                                                               | —                |
| `channels.feishu.webhookPath`                     | مسار توجيه Webhook                                                               | `/feishu/events` |
| `channels.feishu.webhookHost`                     | مضيف ربط Webhook                                                                 | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | منفذ ربط Webhook                                                                 | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | معرّف التطبيق                                                                    | —                |
| `channels.feishu.accounts.<id>.appSecret`         | سر التطبيق                                                                       | —                |
| `channels.feishu.accounts.<id>.domain`            | تجاوز النطاق لكل حساب                                                            | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | تجاوز TTS لكل حساب                                                               | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | سياسة الرسائل المباشرة                                                           | `allowlist`      |
| `channels.feishu.allowFrom`                       | قائمة السماح للرسائل المباشرة (قائمة open_id)                                    | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | سياسة المجموعة                                                                   | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | قائمة السماح للمجموعات                                                           | —                |
| `channels.feishu.requireMention`                  | اشتراط @mention في المجموعات                                                     | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | تجاوز @mention لكل مجموعة؛ تقبل المعرّفات الصريحة المجموعة أيضا في وضع قائمة السماح | موروث            |
| `channels.feishu.groups.<chat_id>.enabled`        | تفعيل/تعطيل مجموعة محددة                                                         | `true`           |
| `channels.feishu.textChunkLimit`                  | حجم مقطع الرسالة                                                                 | `2000`           |
| `channels.feishu.mediaMaxMb`                      | حد حجم الوسائط                                                                   | `30`             |
| `channels.feishu.streaming`                       | إخراج البطاقات المتدفقة                                                          | `true`           |
| `channels.feishu.blockStreaming`                  | التدفق على مستوى الكتلة                                                          | `true`           |
| `channels.feishu.typingIndicator`                 | إرسال تفاعلات الكتابة                                                            | `true`           |
| `channels.feishu.resolveSenderNames`              | حل أسماء عرض المرسلين                                                            | `true`           |

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

تُطبَّع رسائل Feishu/Lark الصوتية الواردة كعناصر نائبة للوسائط بدلا من
ملف JSON خام يحتوي على `file_key`. عند تكوين `tools.media.audio`، يقوم OpenClaw
بتنزيل مورد الملاحظة الصوتية وتشغيل النسخ الصوتي المشترك قبل دورة الوكيل، بحيث
يتلقى الوكيل نص الكلام المنسوخ. إذا ضمّن Feishu نص النسخ مباشرة في حمولة الصوت،
فسيُستخدم ذلك النص دون استدعاء ASR آخر. من دون مزود نسخ صوتي، سيظل الوكيل يتلقى
عنصرًا نائبًا `<media:audio>` مع المرفق المحفوظ، وليس حمولة مورد Feishu الخام.

### الإرسال

- ✅ نص
- ✅ صور
- ✅ ملفات
- ✅ صوت
- ✅ فيديو/وسائط
- ✅ بطاقات تفاعلية (بما في ذلك تحديثات التدفق)
- ⚠️ نص منسق (تنسيق بأسلوب المنشورات؛ لا يدعم كامل إمكانات التأليف في Feishu/Lark)

تستخدم فقاعات Feishu/Lark الصوتية الأصلية نوع رسالة Feishu `audio` وتتطلب
وسائط رفع Ogg/Opus (`file_type: "opus"`). تُرسل وسائط `.opus` و`.ogg` الموجودة
مباشرة كصوت أصلي. تُحوَّل MP3/WAV/M4A وغيرها من تنسيقات الصوت المحتملة إلى
Ogg/Opus بتردد 48kHz باستخدام `ffmpeg` فقط عندما يطلب الرد التسليم الصوتي
(`audioAsVoice` / أداة الرسائل `asVoice`، بما في ذلك ردود الملاحظات الصوتية
عبر TTS). تبقى مرفقات MP3 العادية ملفات عادية. إذا كان `ffmpeg` مفقودا أو
فشل التحويل، يعود OpenClaw إلى مرفق ملف ويسجل السبب.

### السلاسل والردود

- ✅ ردود مضمنة
- ✅ ردود ضمن السلاسل
- ✅ تظل ردود الوسائط واعية بالسلسلة عند الرد على رسالة ضمن سلسلة

بالنسبة إلى `groupSessionScope: "group_topic"` و`"group_topic_sender"`، تستخدم
مجموعات المواضيع الأصلية في Feishu/Lark قيمة الحدث `thread_id` (`omt_*`) كمفتاح
جلسة الموضوع الأساسي. أما ردود المجموعات العادية التي يحولها OpenClaw إلى سلاسل
فتستمر في استخدام معرّف رسالة جذر الرد (`om_*`) بحيث تبقى الدورة الأولى ودورة
المتابعة في الجلسة نفسها.

---

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الإقران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الإقران
- [المجموعات](/ar/channels/groups) — سلوك محادثة المجموعة وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية

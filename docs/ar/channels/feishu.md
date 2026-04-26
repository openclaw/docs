---
read_when:
    - تريد توصيل روبوت Feishu/Lark
    - أنت تقوم بتهيئة قناة Feishu
summary: نظرة عامة على روبوت Feishu وميزاته وتهيئته
title: Feishu
x-i18n:
    generated_at: "2026-04-26T11:22:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95a50a7cd7b290afe0a0db3a1b39c7305f6a0e7d0702597fb9a50b5a45afa855
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

يُعد Feishu/Lark منصة تعاون شاملة حيث تتبادل الفرق الدردشة، وتشارك المستندات، وتدير التقويمات، وتنجز العمل معًا.

**الحالة:** جاهز للإنتاج للرسائل المباشرة للروبوت + الدردشات الجماعية. يُعد WebSocket الوضع الافتراضي؛ ووضع Webhook اختياري.

---

## البدء السريع

> **يتطلب OpenClaw 2026.4.25 أو أحدث.** شغّل `openclaw --version` للتحقق. وقم بالترقية باستخدام `openclaw update`.

<Steps>
  <Step title="تشغيل معالج إعداد القناة">
  ```bash
  openclaw channels login --channel feishu
  ```
  امسح رمز QR باستخدام تطبيق Feishu/Lark على هاتفك لإنشاء روبوت Feishu/Lark تلقائيًا.
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

قم بتهيئة `dmPolicy` للتحكم في من يمكنه إرسال رسائل مباشرة إلى الروبوت:

- `"pairing"` — يتلقى المستخدمون غير المعروفين رمز اقتران؛ وتتم الموافقة عبر CLI
- `"allowlist"` — يمكن فقط للمستخدمين المدرجين في `allowFrom` الدردشة (الافتراضي: مالك الروبوت فقط)
- `"open"` — السماح لجميع المستخدمين
- `"disabled"` — تعطيل جميع الرسائل المباشرة

**الموافقة على طلب اقتران:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### الدردشات الجماعية

**سياسة المجموعات** (`channels.feishu.groupPolicy`):

| القيمة         | السلوك                                      |
| ------------- | ------------------------------------------- |
| `"open"`      | الرد على جميع الرسائل في المجموعات           |
| `"allowlist"` | الرد فقط على المجموعات المدرجة في `groupAllowFrom` |
| `"disabled"`  | تعطيل جميع رسائل المجموعات                  |

الافتراضي: `allowlist`

**اشتراط الإشارة** (`channels.feishu.requireMention`):

- `true` — تتطلب @mention (الافتراضي)
- `false` — الرد بدون @mention
- تجاوز لكل مجموعة: `channels.feishu.groups.<chat_id>.requireMention`

---

## أمثلة على تهيئة المجموعات

### السماح لجميع المجموعات، بدون اشتراط @mention

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

### السماح بمجموعات محددة فقط

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // تبدو معرّفات المجموعات بهذا الشكل: oc_xxx
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
          // تبدو open_ids للمستخدمين بهذا الشكل: ou_xxx
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

### معرّفات المجموعات (`chat_id`، بالتنسيق: `oc_xxx`)

افتح المجموعة في Feishu/Lark، وانقر على أيقونة القائمة في الزاوية العلوية اليمنى، ثم انتقل إلى **الإعدادات**. يتم إدراج معرّف المجموعة (`chat_id`) في صفحة الإعدادات.

![الحصول على معرّف المجموعة](/images/feishu-get-group-id.png)

### معرّفات المستخدمين (`open_id`، بالتنسيق: `ou_xxx`)

ابدأ Gateway، ثم أرسل رسالة مباشرة إلى الروبوت، وبعد ذلك تحقق من السجلات:

```bash
openclaw logs --follow
```

ابحث عن `open_id` في مخرجات السجل. يمكنك أيضًا التحقق من طلبات الاقتران المعلقة:

```bash
openclaw pairing list feishu
```

---

## الأوامر الشائعة

| الأمر   | الوصف                        |
| --------- | ---------------------------- |
| `/status` | عرض حالة الروبوت             |
| `/reset`  | إعادة تعيين الجلسة الحالية   |
| `/model`  | عرض نموذج الذكاء الاصطناعي أو تبديله |

> لا يدعم Feishu/Lark قوائم الأوامر المائلة الأصلية، لذا أرسل هذه الأوامر كرسائل نصية عادية.

---

## استكشاف الأخطاء وإصلاحها

### الروبوت لا يرد في الدردشات الجماعية

1. تأكد من إضافة الروبوت إلى المجموعة
2. تأكد من أنك تشير إلى الروبوت باستخدام @mention (مطلوب افتراضيًا)
3. تحقق من أن `groupPolicy` ليست `"disabled"`
4. تحقق من السجلات: `openclaw logs --follow`

### الروبوت لا يستقبل الرسائل

1. تأكد من نشر الروبوت والموافقة عليه في Feishu Open Platform / Lark Developer
2. تأكد من أن اشتراك الأحداث يتضمن `im.message.receive_v1`
3. تأكد من تحديد **persistent connection** (WebSocket)
4. تأكد من منح جميع نطاقات الأذونات المطلوبة
5. تأكد من أن Gateway قيد التشغيل: `openclaw gateway status`
6. تحقق من السجلات: `openclaw logs --follow`

### تسرّب App Secret

1. أعد تعيين App Secret في Feishu Open Platform / Lark Developer
2. حدّث القيمة في التهيئة الخاصة بك
3. أعد تشغيل Gateway: `openclaw gateway restart`

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

يتحكم `defaultAccount` في الحساب المستخدم عندما لا تحدد واجهات API الصادرة قيمة `accountId`.
يستخدم `accounts.<id>.tts` نفس البنية المستخدمة في `messages.tts` ويُدمج بعمق فوق
تهيئة TTS العامة، بحيث يمكن لإعدادات Feishu متعددة الروبوتات الاحتفاظ ببيانات اعتماد
مزوّد مشتركة على المستوى العام مع تجاوز الصوت أو النموذج أو الشخصية أو الوضع التلقائي فقط
لكل حساب.

### حدود الرسائل

- `textChunkLimit` — حجم مقطع النص الصادر (الافتراضي: `2000` حرف)
- `mediaMaxMb` — حد رفع/تنزيل الوسائط (الافتراضي: `30` ميغابايت)

### البث

يدعم Feishu/Lark الردود المتدفقة عبر البطاقات التفاعلية. وعند التمكين، يحدّث الروبوت البطاقة في الوقت الفعلي أثناء إنشاء النص.

```json5
{
  channels: {
    feishu: {
      streaming: true, // تمكين إخراج البطاقة المتدفقة (الافتراضي: true)
      blockStreaming: true, // تمكين البث على مستوى الكتل (الافتراضي: true)
    },
  },
}
```

عيّن `streaming: false` لإرسال الرد الكامل في رسالة واحدة.

### تحسين الحصة

قلّل عدد استدعاءات API الخاصة بـ Feishu/Lark باستخدام علمين اختياريين:

- `typingIndicator` (الافتراضي `true`): عيّنه إلى `false` لتخطي استدعاءات تفاعل الكتابة
- `resolveSenderNames` (الافتراضي `true`): عيّنه إلى `false` لتخطي عمليات البحث عن ملفات تعريف المرسلين

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

يدعم Feishu/Lark ‏ACP للرسائل المباشرة ورسائل سلاسل المجموعات. ويعتمد ACP في Feishu/Lark على أوامر نصية — لا توجد قوائم أوامر مائلة أصلية، لذا استخدم رسائل `/acp ...` مباشرة داخل المحادثة.

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

في رسالة مباشرة أو سلسلة محادثة في Feishu/Lark:

```text
/acp spawn codex --thread here
```

يعمل `--thread here` مع الرسائل المباشرة ورسائل سلاسل Feishu/Lark. ويتم توجيه الرسائل اللاحقة في المحادثة المرتبطة مباشرة إلى جلسة ACP تلك.

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
- `match.peer.kind`: `"direct"` (رسالة مباشرة) أو `"group"` (دردشة جماعية)
- `match.peer.id`: Open ID للمستخدم (`ou_xxx`) أو معرّف المجموعة (`oc_xxx`)

راجع [الحصول على معرّفات المجموعة/المستخدم](#get-groupuser-ids) للحصول على نصائح البحث.

---

## مرجع التهيئة

التهيئة الكاملة: [تهيئة Gateway](/ar/gateway/configuration)

| الإعداد                                           | الوصف                                      | الافتراضي       |
| ------------------------------------------------- | ------------------------------------------ | ---------------- |
| `channels.feishu.enabled`                         | تمكين/تعطيل القناة                         | `true`           |
| `channels.feishu.domain`                          | نطاق API (`feishu` أو `lark`)              | `feishu`         |
| `channels.feishu.connectionMode`                  | نقل الأحداث (`websocket` أو `webhook`)     | `websocket`      |
| `channels.feishu.defaultAccount`                  | الحساب الافتراضي للتوجيه الصادر            | `default`        |
| `channels.feishu.verificationToken`               | مطلوب لوضع Webhook                         | —                |
| `channels.feishu.encryptKey`                      | مطلوب لوضع Webhook                         | —                |
| `channels.feishu.webhookPath`                     | مسار توجيه Webhook                         | `/feishu/events` |
| `channels.feishu.webhookHost`                     | مضيف ربط Webhook                           | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | منفذ ربط Webhook                           | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                     | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                 | —                |
| `channels.feishu.accounts.<id>.domain`            | تجاوز النطاق لكل حساب                      | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | تجاوز TTS لكل حساب                         | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | سياسة الرسائل المباشرة                     | `allowlist`      |
| `channels.feishu.allowFrom`                       | قائمة السماح للرسائل المباشرة (`open_id`)  | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | سياسة المجموعات                            | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | قائمة السماح للمجموعات                     | —                |
| `channels.feishu.requireMention`                  | اشتراط @mention في المجموعات               | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | تجاوز @mention لكل مجموعة                  | موروث            |
| `channels.feishu.groups.<chat_id>.enabled`        | تمكين/تعطيل مجموعة محددة                   | `true`           |
| `channels.feishu.textChunkLimit`                  | حجم مقطع الرسالة                           | `2000`           |
| `channels.feishu.mediaMaxMb`                      | حد حجم الوسائط                             | `30`             |
| `channels.feishu.streaming`                       | إخراج البطاقة المتدفقة                     | `true`           |
| `channels.feishu.blockStreaming`                  | البث على مستوى الكتل                       | `true`           |
| `channels.feishu.typingIndicator`                 | إرسال تفاعلات الكتابة                      | `true`           |
| `channels.feishu.resolveSenderNames`              | تحليل أسماء عرض المرسلين                   | `true`           |

---

## أنواع الرسائل المدعومة

### الاستقبال

- ✅ نص
- ✅ نص منسّق (post)
- ✅ صور
- ✅ ملفات
- ✅ صوت
- ✅ فيديو/وسائط
- ✅ ملصقات

تُطبَّع رسائل الصوت الواردة من Feishu/Lark كعناصر نائبة للوسائط بدلاً من
بيانات JSON الخام الخاصة بـ `file_key`. عند تهيئة `tools.media.audio`، يقوم OpenClaw
بتنزيل مورد المذكرة الصوتية وتشغيل النسخ الصوتي المشترك قبل
دور الوكيل، بحيث يتلقى الوكيل النص المنطوق. وإذا تضمّن Feishu
نصًا منسوخًا مباشرة داخل حمولة الصوت، فسيُستخدم ذلك النص دون إجراء
استدعاء ASR آخر. ومن دون مزوّد نسخ صوتي، سيظل الوكيل يتلقى عنصرًا نائبًا
`<media:audio>` بالإضافة إلى المرفق المحفوظ، وليس حمولة مورد Feishu
الخام.

### الإرسال

- ✅ نص
- ✅ صور
- ✅ ملفات
- ✅ صوت
- ✅ فيديو/وسائط
- ✅ بطاقات تفاعلية (بما في ذلك التحديثات المتدفقة)
- ⚠️ نص منسق (تنسيق بأسلوب post؛ لا يدعم كامل إمكانات التأليف في Feishu/Lark)

تستخدم فقاعات الصوت الأصلية في Feishu/Lark نوع الرسائل `audio` في Feishu وتتطلب
وسائط مرفوعة بتنسيق Ogg/Opus (`file_type: "opus"`). يتم إرسال الوسائط الموجودة
بامتدادي `.opus` و`.ogg` مباشرة كصوت أصلي. أما MP3/WAV/M4A وغيرها من تنسيقات
الصوت المحتملة، فيتم تحويلها إلى 48kHz Ogg/Opus باستخدام `ffmpeg` فقط عندما
يطلب الرد التسليم الصوتي (`audioAsVoice` / أداة الرسائل `asVoice`، بما في ذلك ردود
المذكرات الصوتية المعتمدة على TTS). وتظل مرفقات MP3 العادية ملفات عادية. وإذا كان `ffmpeg`
غير موجود أو فشل التحويل، يعود OpenClaw إلى مرفق ملف ويسجل السبب.

### سلاسل المحادثات والردود

- ✅ ردود مضمنة
- ✅ ردود سلاسل المحادثات
- ✅ تظل ردود الوسائط مدركة لسلسلة المحادثات عند الرد على رسالة ضمن سلسلة

بالنسبة إلى `groupSessionScope: "group_topic"` و`"group_topic_sender"`، تستخدم
مجموعات الموضوعات الأصلية في Feishu/Lark الحدث `thread_id` (`omt_*`) باعتباره مفتاح
جلسة الموضوع الأساسي. أما ردود المجموعات العادية التي يحولها OpenClaw إلى سلاسل محادثات
فتستمر في استخدام معرّف رسالة جذر الرد (`om_*`) بحيث تظل الجولة الأولى والجولة
اللاحقة ضمن الجلسة نفسها.

---

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية وضبط الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية

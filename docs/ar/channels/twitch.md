---
read_when:
    - إعداد تكامل دردشة Twitch لـ OpenClaw
summary: إعداد وتكوين بوت دردشة Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-24T07:32:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 82b9176deec21344a7cd22f8818277f94bc564d06c4422b149d0fc163ee92d5f
    source_path: channels/twitch.md
    workflow: 15
---

دعم دردشة Twitch عبر اتصال IRC. يتصل OpenClaw كمستخدم Twitch (حساب بوت) لاستقبال الرسائل وإرسالها في القنوات.

## Plugin المضمّن

يأتي Twitch كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذلك لا تحتاج
الإصدارات المعبأة العادية إلى تثبيت منفصل.

إذا كنت تستخدم إصدارًا أقدم أو تثبيتًا مخصصًا يستثني Twitch، فثبّته
يدويًا:

التثبيت عبر CLI (سجل npm):

```bash
openclaw plugins install @openclaw/twitch
```

نسخة محلية (عند التشغيل من مستودع git):

```bash
openclaw plugins install ./path/to/local/twitch-plugin
```

التفاصيل: [Plugins](/ar/tools/plugin)

## إعداد سريع (للمبتدئين)

1. تأكد من أن Plugin Twitch متاح.
   - تتضمنه بالفعل إصدارات OpenClaw المعبأة الحالية.
   - يمكن للتثبيتات الأقدم/المخصصة إضافته يدويًا باستخدام الأوامر أعلاه.
2. أنشئ حساب Twitch مخصصًا للبوت (أو استخدم حسابًا موجودًا).
3. أنشئ بيانات الاعتماد: [Twitch Token Generator](https://twitchtokengenerator.com/)
   - اختر **Bot Token**
   - تأكد من تحديد النطاقين `chat:read` و`chat:write`
   - انسخ **Client ID** و**Access Token**
4. اعثر على معرّف مستخدم Twitch الخاص بك: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
5. اضبط الرمز:
   - البيئة: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (للحساب الافتراضي فقط)
   - أو الإعداد: `channels.twitch.accessToken`
   - إذا تم ضبط الاثنين، تكون الأولوية للإعداد (والبيئة بديل احتياطي للحساب الافتراضي فقط).
6. ابدأ gateway.

**⚠️ مهم:** أضف تحكمًا في الوصول (`allowFrom` أو `allowedRoles`) لمنع المستخدمين غير المصرح لهم من تشغيل البوت. القيمة الافتراضية لـ `requireMention` هي `true`.

إعداد أدنى:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // حساب Twitch الخاص بالبوت
      accessToken: "oauth:abc123...", // OAuth Access Token (أو استخدم متغير البيئة OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // Client ID من Token Generator
      channel: "vevisk", // قناة Twitch المطلوب الانضمام إلى دردشتها (مطلوب)
      allowFrom: ["123456789"], // (موصى به) معرّف مستخدم Twitch الخاص بك فقط - احصل عليه من https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## ما هو

- قناة Twitch يملكها Gateway.
- توجيه حتمي: تعود الردود دائمًا إلى Twitch.
- يطابق كل حساب مفتاح جلسة معزولًا بالشكل `agent:<agentId>:twitch:<accountName>`.
- `username` هو حساب البوت (الذي يصادق)، و`channel` هي غرفة الدردشة المطلوب الانضمام إليها.

## الإعداد (بالتفصيل)

### إنشاء بيانات الاعتماد

استخدم [Twitch Token Generator](https://twitchtokengenerator.com/):

- اختر **Bot Token**
- تأكد من تحديد النطاقين `chat:read` و`chat:write`
- انسخ **Client ID** و**Access Token**

لا حاجة إلى تسجيل تطبيق يدوي. تنتهي صلاحية الرموز بعد عدة ساعات.

### إعداد البوت

**متغير البيئة (للحساب الافتراضي فقط):**

```bash
OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
```

**أو الإعداد:**

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
    },
  },
}
```

إذا تم ضبط البيئة والإعداد معًا، تكون الأولوية للإعداد.

### التحكم في الوصول (موصى به)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (موصى به) معرّف مستخدم Twitch الخاص بك فقط
    },
  },
}
```

فضّل `allowFrom` لقائمة سماح صارمة. استخدم `allowedRoles` بدلًا من ذلك إذا كنت تريد وصولًا قائمًا على الأدوار.

**الأدوار المتاحة:** `"moderator"` و`"owner"` و`"vip"` و`"subscriber"` و`"all"`.

**لماذا معرّفات المستخدمين؟** يمكن لأسماء المستخدمين أن تتغير، مما يسمح بانتحال الهوية. أما معرّفات المستخدمين فهي دائمة.

اعثر على معرّف مستخدم Twitch الخاص بك: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (حوّل اسم مستخدم Twitch الخاص بك إلى معرّف)

## تحديث الرمز تلقائيًا (اختياري)

لا يمكن تحديث الرموز من [Twitch Token Generator](https://twitchtokengenerator.com/) تلقائيًا — أعد إنشاءها عند انتهاء صلاحيتها.

لتحديث الرمز تلقائيًا، أنشئ تطبيق Twitch خاصًا بك في [Twitch Developer Console](https://dev.twitch.tv/console) وأضف إلى الإعداد:

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

يقوم البوت تلقائيًا بتحديث الرموز قبل انتهاء صلاحيتها ويسجل أحداث التحديث.

## دعم الحسابات المتعددة

استخدم `channels.twitch.accounts` مع رموز لكل حساب. راجع [`gateway/configuration`](/ar/gateway/configuration) للنمط المشترك.

مثال (حساب بوت واحد في قناتين):

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

**ملاحظة:** يحتاج كل حساب إلى رمزه الخاص (رمز واحد لكل قناة).

## التحكم في الوصول

### قيود قائمة على الأدوار

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator", "vip"],
        },
      },
    },
  },
}
```

### قائمة سماح حسب معرّف المستخدم (الأكثر أمانًا)

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowFrom: ["123456789", "987654321"],
        },
      },
    },
  },
}
```

### وصول قائم على الأدوار (بديل)

يمثل `allowFrom` قائمة سماح صارمة. عند ضبطه، لا يُسمح إلا لمعرّفات المستخدمين تلك.
إذا كنت تريد وصولًا قائمًا على الأدوار، فاترك `allowFrom` غير مضبوط واضبط `allowedRoles` بدلًا منه:

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

### تعطيل متطلب @mention

افتراضيًا، تكون قيمة `requireMention` هي `true`. لتعطيلها والرد على جميع الرسائل:

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          requireMention: false,
        },
      },
    },
  },
}
```

## استكشاف الأخطاء وإصلاحها

أولًا، شغّل أوامر التشخيص:

```bash
openclaw doctor
openclaw channels status --probe
```

### البوت لا يرد على الرسائل

**تحقق من التحكم في الوصول:** تأكد من أن معرّف المستخدم الخاص بك موجود في `allowFrom`، أو أزل
`allowFrom` مؤقتًا واضبط `allowedRoles: ["all"]` للاختبار.

**تحقق من أن البوت موجود في القناة:** يجب أن ينضم البوت إلى القناة المحددة في `channel`.

### مشكلات الرمز

**"Failed to connect" أو أخطاء المصادقة:**

- تحقق من أن `accessToken` هو قيمة OAuth access token (وعادة ما يبدأ بالبادئة `oauth:`)
- تحقق من أن الرمز لديه النطاقان `chat:read` و`chat:write`
- إذا كنت تستخدم تحديث الرمز، فتحقق من ضبط `clientSecret` و`refreshToken`

### تحديث الرمز لا يعمل

**تحقق من السجلات لمعرفة أحداث التحديث:**

```text
Using env token source for mybot
Access token refreshed for user 123456 (expires in 14400s)
```

إذا رأيت "token refresh disabled (no refresh token)":

- تأكد من توفير `clientSecret`
- تأكد من توفير `refreshToken`

## الإعداد

**إعداد الحساب:**

- `username` - اسم مستخدم البوت
- `accessToken` - OAuth access token مع `chat:read` و`chat:write`
- `clientId` - Twitch Client ID (من Token Generator أو تطبيقك)
- `channel` - القناة المطلوب الانضمام إليها (مطلوب)
- `enabled` - تفعيل هذا الحساب (الافتراضي: `true`)
- `clientSecret` - اختياري: للتحديث التلقائي للرمز
- `refreshToken` - اختياري: للتحديث التلقائي للرمز
- `expiresIn` - وقت انتهاء الرمز بالثواني
- `obtainmentTimestamp` - الطابع الزمني للحصول على الرمز
- `allowFrom` - قائمة سماح بمعرّفات المستخدمين
- `allowedRoles` - تحكم في الوصول قائم على الأدوار (`"moderator" | "owner" | "vip" | "subscriber" | "all"`)
- `requireMention` - طلب @mention (الافتراضي: `true`)

**خيارات المزوّد:**

- `channels.twitch.enabled` - تفعيل/تعطيل بدء تشغيل القناة
- `channels.twitch.username` - اسم مستخدم البوت (إعداد مبسّط لحساب واحد)
- `channels.twitch.accessToken` - OAuth access token (إعداد مبسّط لحساب واحد)
- `channels.twitch.clientId` - Twitch Client ID (إعداد مبسّط لحساب واحد)
- `channels.twitch.channel` - القناة المطلوب الانضمام إليها (إعداد مبسّط لحساب واحد)
- `channels.twitch.accounts.<accountName>` - إعداد حسابات متعددة (جميع حقول الحساب أعلاه)

مثال كامل:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## إجراءات الأداة

يمكن للوكيل استدعاء `twitch` مع الإجراء:

- `send` - إرسال رسالة إلى قناة

مثال:

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## الأمان والتشغيل

- **تعامل مع الرموز كأنها كلمات مرور** - لا تلتزم بالرموز في git أبدًا
- **استخدم التحديث التلقائي للرمز** للبوتات طويلة التشغيل
- **استخدم قوائم السماح بمعرّفات المستخدمين** بدلًا من أسماء المستخدمين للتحكم في الوصول
- **راقب السجلات** لأحداث تحديث الرمز وحالة الاتصال
- **قلّل نطاقات الرموز** - اطلب فقط `chat:read` و`chat:write`
- **إذا علقت**: أعد تشغيل gateway بعد التأكد من عدم وجود عملية أخرى تملك الجلسة

## الحدود

- **500 حرف** لكل رسالة (تُقسَّم تلقائيًا عند حدود الكلمات)
- تتم إزالة Markdown قبل التقسيم
- لا يوجد تحديد معدل (يستخدم حدود المعدل المدمجة في Twitch)

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل الخاصة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية وضبط الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتدعيم

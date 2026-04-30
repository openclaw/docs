---
read_when:
    - إعداد تكامل دردشة Twitch مع OpenClaw
sidebarTitle: Twitch
summary: تكوين وإعداد روبوت دردشة Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-30T07:44:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 897079687a243c9c2ce2be63167e59f4413bbd89735fb79f03928547023bd787
    source_path: channels/twitch.md
    workflow: 16
---

دعم دردشة Twitch عبر اتصال IRC. يتصل OpenClaw كمستخدم Twitch (حساب بوت) لاستقبال الرسائل وإرسالها في القنوات.

## Plugin مضمّن

<Note>
يأتي Twitch كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذلك لا تحتاج الحزم العادية إلى تثبيت منفصل.
</Note>

إذا كنت تستخدم بناءً أقدم أو تثبيتًا مخصصًا يستثني Twitch، فثبّت حزمة npm حالية عند نشر واحدة:

<Tabs>
  <Tab title="سجل npm">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="نسخة محلية">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

إذا أبلغ npm أن الحزمة المملوكة لـ OpenClaw مهملة، فاستخدم بناء OpenClaw
حاليًا ومعبأً أو مسار النسخة المحلية إلى أن تُنشر حزمة npm أحدث.

التفاصيل: [Plugins](/ar/tools/plugin)

## إعداد سريع (للمبتدئين)

<Steps>
  <Step title="تأكد من توفر Plugin">
    إصدارات OpenClaw الحالية المعبأة تتضمنه بالفعل. يمكن للتثبيتات الأقدم/المخصصة إضافته يدويًا بالأوامر أعلاه.
  </Step>
  <Step title="أنشئ حساب بوت Twitch">
    أنشئ حساب Twitch مخصصًا للبوت (أو استخدم حسابًا موجودًا).
  </Step>
  <Step title="أنشئ بيانات الاعتماد">
    استخدم [Twitch Token Generator](https://twitchtokengenerator.com/):

    - اختر **Bot Token**
    - تحقق من تحديد النطاقين `chat:read` و`chat:write`
    - انسخ **Client ID** و**Access Token**

  </Step>
  <Step title="اعثر على معرف مستخدم Twitch الخاص بك">
    استخدم [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) لتحويل اسم مستخدم إلى معرف مستخدم Twitch.
  </Step>
  <Step title="اضبط الرمز">
    - متغير البيئة: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (الحساب الافتراضي فقط)
    - أو الإعداد: `channels.twitch.accessToken`

    إذا ضُبط كلاهما، تكون الأولوية للإعداد (الرجوع إلى متغير البيئة للحساب الافتراضي فقط).

  </Step>
  <Step title="ابدأ Gateway">
    ابدأ Gateway بالقناة المضبوطة.
  </Step>
</Steps>

<Warning>
أضف تحكمًا بالوصول (`allowFrom` أو `allowedRoles`) لمنع المستخدمين غير المصرح لهم من تشغيل البوت. القيمة الافتراضية لـ `requireMention` هي `true`.
</Warning>

إعداد بسيط:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Bot's Twitch account
      accessToken: "oauth:abc123...", // OAuth Access Token (or use OPENCLAW_TWITCH_ACCESS_TOKEN env var)
      clientId: "xyz789...", // Client ID from Token Generator
      channel: "vevisk", // Which Twitch channel's chat to join (required)
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only - get it from https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## ما هو

- قناة Twitch يملكها Gateway.
- توجيه حتمي: تعود الردود دائمًا إلى Twitch.
- يُربط كل حساب بمفتاح جلسة معزول `agent:<agentId>:twitch:<accountName>`.
- `username` هو حساب البوت (الذي يصادق)، و`channel` هي غرفة الدردشة التي سينضم إليها.

## الإعداد (تفصيلي)

### إنشاء بيانات الاعتماد

استخدم [Twitch Token Generator](https://twitchtokengenerator.com/):

- اختر **Bot Token**
- تحقق من تحديد النطاقين `chat:read` و`chat:write`
- انسخ **Client ID** و**Access Token**

<Note>
لا يلزم تسجيل تطبيق يدويًا. تنتهي صلاحية الرموز بعد عدة ساعات.
</Note>

### ضبط البوت

<Tabs>
  <Tab title="متغير بيئة (الحساب الافتراضي فقط)">
    ```bash
    OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
    ```
  </Tab>
  <Tab title="الإعداد">
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
  </Tab>
</Tabs>

إذا ضُبط كل من متغير البيئة والإعداد، تكون الأولوية للإعداد.

### التحكم بالوصول (موصى به)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only
    },
  },
}
```

فضّل `allowFrom` لقائمة سماح صارمة. استخدم `allowedRoles` بدلًا من ذلك إذا أردت وصولًا قائمًا على الأدوار.

**الأدوار المتاحة:** `"moderator"`، `"owner"`، `"vip"`، `"subscriber"`، `"all"`.

<Note>
**لماذا معرفات المستخدم؟** يمكن أن تتغير أسماء المستخدمين، مما يسمح بانتحال الشخصية. معرفات المستخدم دائمة.

اعثر على معرف مستخدم Twitch الخاص بك: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (حوّل اسم مستخدم Twitch الخاص بك إلى معرف)
</Note>

## تحديث الرمز (اختياري)

لا يمكن تحديث الرموز من [Twitch Token Generator](https://twitchtokengenerator.com/) تلقائيًا - أعد إنشاءها عند انتهاء صلاحيتها.

للتحديث التلقائي للرمز، أنشئ تطبيق Twitch الخاص بك في [Twitch Developer Console](https://dev.twitch.tv/console) وأضفه إلى الإعداد:

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

يحدّث البوت الرموز تلقائيًا قبل انتهاء الصلاحية ويسجل أحداث التحديث.

## دعم الحسابات المتعددة

استخدم `channels.twitch.accounts` مع رموز مخصصة لكل حساب. راجع [الإعدادات](/ar/gateway/configuration) للنمط المشترك.

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

<Note>
يحتاج كل حساب إلى رمزه الخاص (رمز واحد لكل قناة).
</Note>

## التحكم بالوصول

<Tabs>
  <Tab title="قائمة سماح معرفات المستخدمين (الأكثر أمانًا)">
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
  </Tab>
  <Tab title="قائم على الأدوار">
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

    `allowFrom` هي قائمة سماح صارمة. عند ضبطها، يُسمح لمعرفات المستخدمين هذه فقط. إذا أردت وصولًا قائمًا على الأدوار، فاترك `allowFrom` غير مضبوط واضبط `allowedRoles` بدلًا منه.

  </Tab>
  <Tab title="تعطيل متطلب @mention">
    افتراضيًا، تكون `requireMention` هي `true`. للتعطيل والرد على جميع الرسائل:

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

  </Tab>
</Tabs>

## استكشاف الأخطاء وإصلاحها

أولًا، شغّل أوامر التشخيص:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="البوت لا يرد على الرسائل">
    - **تحقق من التحكم بالوصول:** تأكد من أن معرف المستخدم الخاص بك موجود في `allowFrom`، أو أزل `allowFrom` مؤقتًا واضبط `allowedRoles: ["all"]` للاختبار.
    - **تحقق من أن البوت في القناة:** يجب أن ينضم البوت إلى القناة المحددة في `channel`.

  </Accordion>
  <Accordion title="مشكلات الرمز">
    أخطاء "فشل الاتصال" أو المصادقة:

    - تحقق من أن `accessToken` هو قيمة رمز وصول OAuth (يبدأ عادةً بالبادئة `oauth:`)
    - تحقق من أن الرمز لديه النطاقان `chat:read` و`chat:write`
    - إذا كنت تستخدم تحديث الرمز، فتحقق من ضبط `clientSecret` و`refreshToken`

  </Accordion>
  <Accordion title="تحديث الرمز لا يعمل">
    تحقق من السجلات بحثًا عن أحداث التحديث:

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    إذا رأيت "token refresh disabled (no refresh token)":

    - تأكد من توفير `clientSecret`
    - تأكد من توفير `refreshToken`

  </Accordion>
</AccordionGroup>

## الإعدادات

### إعداد الحساب

<ParamField path="username" type="string">
  اسم مستخدم البوت.
</ParamField>
<ParamField path="accessToken" type="string">
  رمز وصول OAuth مع `chat:read` و`chat:write`.
</ParamField>
<ParamField path="clientId" type="string">
  Twitch Client ID (من Token Generator أو تطبيقك).
</ParamField>
<ParamField path="channel" type="string" required>
  القناة التي سيتم الانضمام إليها.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  فعّل هذا الحساب.
</ParamField>
<ParamField path="clientSecret" type="string">
  اختياري: للتحديث التلقائي للرمز.
</ParamField>
<ParamField path="refreshToken" type="string">
  اختياري: للتحديث التلقائي للرمز.
</ParamField>
<ParamField path="expiresIn" type="number">
  انتهاء صلاحية الرمز بالثواني.
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  الطابع الزمني للحصول على الرمز.
</ParamField>
<ParamField path="allowFrom" type="string[]">
  قائمة سماح معرفات المستخدمين.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  التحكم بالوصول القائم على الأدوار.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  يتطلب @mention.
</ParamField>

### خيارات الموفر

- `channels.twitch.enabled` - تفعيل/تعطيل بدء تشغيل القناة
- `channels.twitch.username` - اسم مستخدم البوت (إعداد حساب واحد مبسط)
- `channels.twitch.accessToken` - رمز وصول OAuth (إعداد حساب واحد مبسط)
- `channels.twitch.clientId` - Twitch Client ID (إعداد حساب واحد مبسط)
- `channels.twitch.channel` - القناة التي سيتم الانضمام إليها (إعداد حساب واحد مبسط)
- `channels.twitch.accounts.<accountName>` - إعداد حسابات متعددة (كل حقول الحساب أعلاه)

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

## إجراءات الأدوات

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

## السلامة والتشغيل

- **عامل الرموز مثل كلمات المرور** — لا تلتزم الرموز أبدًا إلى git.
- **استخدم التحديث التلقائي للرمز** للبوتات طويلة التشغيل.
- **استخدم قوائم سماح معرفات المستخدمين** بدلًا من أسماء المستخدمين للتحكم بالوصول.
- **راقب السجلات** لأحداث تحديث الرمز وحالة الاتصال.
- **قلّل نطاقات الرموز إلى الحد الأدنى** — اطلب فقط `chat:read` و`chat:write`.
- **إذا علقت**: أعد تشغيل Gateway بعد التأكد من عدم امتلاك أي عملية أخرى للجلسة.

## الحدود

- **500 حرف** لكل رسالة (تُقسّم تلقائيًا عند حدود الكلمات).
- تُزال Markdown قبل التقسيم.
- لا يوجد تحديد معدل (يستخدم حدود المعدل المدمجة في Twitch).

## ذات صلة

- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [نظرة عامة على القنوات](/ar/channels) — كل القنوات المدعومة
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعات وبوابة الإشارات
- [الإقران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الإقران
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية

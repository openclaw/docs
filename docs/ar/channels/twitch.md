---
read_when:
    - إعداد تكامل دردشة Twitch مع OpenClaw
sidebarTitle: Twitch
summary: تكوين روبوت دردشة Twitch وإعداده
title: Twitch
x-i18n:
    generated_at: "2026-05-02T22:16:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0d5f16d1369e2783bec6e0c7b2d7bee8aae86f2a424b77b9adf14850de0f20b
    source_path: channels/twitch.md
    workflow: 16
---

دعم دردشة Twitch عبر اتصال IRC. يتصل OpenClaw بصفته مستخدم Twitch (حساب بوت) لاستقبال الرسائل وإرسالها في القنوات.

## Plugin مضمّن

<Note>
يأتي Twitch بصفته Plugin مضمّنًا في إصدارات OpenClaw الحالية، لذلك لا تحتاج الإصدارات المعبأة العادية إلى تثبيت منفصل.
</Note>

إذا كنت تستخدم إصدارًا أقدم أو تثبيتًا مخصصًا يستبعد Twitch، فثبّت حزمة npm مباشرة:

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

استخدم الحزمة المجردة لمتابعة وسم الإصدار الرسمي الحالي. ثبّت إصدارًا دقيقًا
فقط عندما تحتاج إلى تثبيت قابل لإعادة الإنتاج.

التفاصيل: [Plugins](/ar/tools/plugin)

## إعداد سريع (للمبتدئين)

<Steps>
  <Step title="تأكد من توفر Plugin">
    إصدارات OpenClaw المعبأة الحالية تضمنه بالفعل. يمكن للتثبيتات الأقدم/المخصصة إضافته يدويًا بالأوامر أعلاه.
  </Step>
  <Step title="أنشئ حساب بوت Twitch">
    أنشئ حساب Twitch مخصصًا للبوت (أو استخدم حسابًا موجودًا).
  </Step>
  <Step title="أنشئ بيانات الاعتماد">
    استخدم [مولّد رموز Twitch](https://twitchtokengenerator.com/):

    - اختر **رمز البوت**
    - تحقق من تحديد النطاقين `chat:read` و`chat:write`
    - انسخ **معرّف العميل** و**رمز الوصول**

  </Step>
  <Step title="اعثر على معرّف مستخدم Twitch الخاص بك">
    استخدم [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) لتحويل اسم مستخدم إلى معرّف مستخدم Twitch.
  </Step>
  <Step title="اضبط الرمز">
    - متغير البيئة: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (الحساب الافتراضي فقط)
    - أو الإعداد: `channels.twitch.accessToken`

    إذا تم ضبطهما معًا، تكون للأعداد أولوية (الرجوع إلى متغير البيئة للحساب الافتراضي فقط).

  </Step>
  <Step title="شغّل Gateway">
    شغّل Gateway بالقناة المضبوطة.
  </Step>
</Steps>

<Warning>
أضف تحكمًا في الوصول (`allowFrom` أو `allowedRoles`) لمنع المستخدمين غير المصرح لهم من تشغيل البوت. القيمة الافتراضية لـ`requireMention` هي `true`.
</Warning>

الحد الأدنى من الإعداد:

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
- يرتبط كل حساب بمفتاح جلسة معزول `agent:<agentId>:twitch:<accountName>`.
- `username` هو حساب البوت (الذي يصادق)، و`channel` هي غرفة الدردشة التي سينضم إليها.

## الإعداد (مفصل)

### إنشاء بيانات الاعتماد

استخدم [مولّد رموز Twitch](https://twitchtokengenerator.com/):

- اختر **رمز البوت**
- تحقق من تحديد النطاقين `chat:read` و`chat:write`
- انسخ **معرّف العميل** و**رمز الوصول**

<Note>
لا حاجة إلى تسجيل تطبيق يدوي. تنتهي صلاحية الرموز بعد عدة ساعات.
</Note>

### ضبط البوت

<Tabs>
  <Tab title="متغير البيئة (الحساب الافتراضي فقط)">
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

إذا تم ضبط متغير البيئة والإعداد معًا، تكون للأعداد أولوية.

### التحكم في الوصول (موصى به)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only
    },
  },
}
```

فضّل `allowFrom` لقائمة سماح صارمة. استخدم `allowedRoles` بدلًا من ذلك إذا كنت تريد وصولًا قائمًا على الأدوار.

**الأدوار المتاحة:** `"moderator"`، `"owner"`، `"vip"`، `"subscriber"`، `"all"`.

<Note>
**لماذا معرّفات المستخدمين؟** يمكن أن تتغير أسماء المستخدمين، مما يسمح بانتحال الهوية. معرّفات المستخدمين دائمة.

اعثر على معرّف مستخدم Twitch الخاص بك: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (حوّل اسم مستخدم Twitch الخاص بك إلى معرّف)
</Note>

## تحديث الرمز (اختياري)

لا يمكن تحديث الرموز من [مولّد رموز Twitch](https://twitchtokengenerator.com/) تلقائيًا - أعد إنشاءها عند انتهاء الصلاحية.

للتحديث التلقائي للرمز، أنشئ تطبيق Twitch الخاص بك في [وحدة تحكم مطوري Twitch](https://dev.twitch.tv/console) وأضفه إلى الإعداد:

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

استخدم `channels.twitch.accounts` مع رموز لكل حساب. راجع [الإعدادات](/ar/gateway/configuration) للنمط المشترك.

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

## التحكم في الوصول

<Tabs>
  <Tab title="قائمة سماح لمعرّفات المستخدمين (الأكثر أمانًا)">
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
  <Tab title="قائم على الدور">
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

    `allowFrom` هي قائمة سماح صارمة. عند ضبطها، يُسمح فقط لمعرّفات المستخدمين هذه. إذا كنت تريد وصولًا قائمًا على الأدوار، فاترك `allowFrom` غير مضبوطة واضبط `allowedRoles` بدلًا من ذلك.

  </Tab>
  <Tab title="تعطيل شرط @mention">
    افتراضيًا، `requireMention` هي `true`. للتعطيل والرد على جميع الرسائل:

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
    - **تحقق من التحكم في الوصول:** تأكد من وجود معرّف المستخدم الخاص بك في `allowFrom`، أو أزل `allowFrom` مؤقتًا واضبط `allowedRoles: ["all"]` للاختبار.
    - **تحقق من وجود البوت في القناة:** يجب أن ينضم البوت إلى القناة المحددة في `channel`.

  </Accordion>
  <Accordion title="مشكلات الرمز">
    أخطاء "فشل الاتصال" أو أخطاء المصادقة:

    - تحقق من أن `accessToken` هو قيمة رمز وصول OAuth (عادةً يبدأ بالبادئة `oauth:`)
    - تحقق من أن الرمز يحتوي على نطاقي `chat:read` و`chat:write`
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
  معرّف عميل Twitch (من مولّد الرموز أو تطبيقك).
</ParamField>
<ParamField path="channel" type="string" required>
  القناة المراد الانضمام إليها.
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
  قائمة سماح لمعرّفات المستخدمين.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  تحكم في الوصول قائم على الأدوار.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  يتطلب @mention.
</ParamField>

### خيارات المزوّد

- `channels.twitch.enabled` - تفعيل/تعطيل بدء تشغيل القناة
- `channels.twitch.username` - اسم مستخدم البوت (إعداد مبسط لحساب واحد)
- `channels.twitch.accessToken` - رمز وصول OAuth (إعداد مبسط لحساب واحد)
- `channels.twitch.clientId` - معرّف عميل Twitch (إعداد مبسط لحساب واحد)
- `channels.twitch.channel` - القناة المراد الانضمام إليها (إعداد مبسط لحساب واحد)
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

يمكن للوكيل استدعاء `twitch` بالإجراء:

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

## السلامة والعمليات

- **عامل الرموز مثل كلمات المرور** — لا تلتزم بالرموز في git أبدًا.
- **استخدم التحديث التلقائي للرموز** للبوتات طويلة التشغيل.
- **استخدم قوائم السماح لمعرّفات المستخدمين** بدلًا من أسماء المستخدمين للتحكم في الوصول.
- **راقب السجلات** لأحداث تحديث الرموز وحالة الاتصال.
- **اجعل نطاق الرموز في الحد الأدنى** — اطلب فقط `chat:read` و`chat:write`.
- **إذا تعثرت**: أعد تشغيل Gateway بعد التأكد من عدم امتلاك أي عملية أخرى للجلسة.

## الحدود

- **500 حرف** لكل رسالة (تقسيم تلقائي عند حدود الكلمات).
- تتم إزالة Markdown قبل التقسيم.
- لا يوجد تحديد معدل (يستخدم حدود المعدل المدمجة في Twitch).

## ذات صلة

- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [نظرة عامة على القنوات](/ar/channels) — كل القنوات المدعومة
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعات وبوابة الذكر
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية

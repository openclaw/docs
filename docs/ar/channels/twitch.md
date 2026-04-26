---
read_when:
    - إعداد تكامل دردشة Twitch لـ OpenClaw
sidebarTitle: Twitch
summary: تهيئة وإعداد روبوت دردشة Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-26T11:24:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d5f4bbad04e04cccc82fc1e2b1057acae3bf7b7684a8e7a4b1f54101731974a
    source_path: channels/twitch.md
    workflow: 15
---

دعم دردشة Twitch عبر اتصال IRC. يتصل OpenClaw كمستخدم Twitch (حساب روبوت) لاستقبال الرسائل وإرسالها في القنوات.

## Plugin المضمّن

<Note>
يأتي Twitch كـ Plugin مضمّن في إصدارات OpenClaw الحالية، لذلك لا تحتاج الإصدارات المعبأة العادية إلى تثبيت منفصل.
</Note>

إذا كنت تستخدم إصدارًا أقدم أو تثبيتًا مخصصًا لا يتضمن Twitch، فثبّته يدويًا:

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

التفاصيل: [Plugins](/ar/tools/plugin)

## إعداد سريع (للمبتدئين)

<Steps>
  <Step title="تأكد من توفر Plugin">
    تتضمنه بالفعل إصدارات OpenClaw المعبأة الحالية. ويمكن للتثبيتات القديمة/المخصصة إضافته يدويًا باستخدام الأوامر أعلاه.
  </Step>
  <Step title="أنشئ حساب روبوت على Twitch">
    أنشئ حساب Twitch مخصصًا للروبوت (أو استخدم حسابًا موجودًا).
  </Step>
  <Step title="أنشئ بيانات الاعتماد">
    استخدم [Twitch Token Generator](https://twitchtokengenerator.com/):

    - اختر **Bot Token**
    - تأكد من تحديد النطاقين `chat:read` و`chat:write`
    - انسخ **Client ID** و**Access Token**

  </Step>
  <Step title="اعثر على معرّف مستخدم Twitch الخاص بك">
    استخدم [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) لتحويل اسم المستخدم إلى معرّف مستخدم Twitch.
  </Step>
  <Step title="هيّئ الرمز">
    - متغير بيئة: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (للحساب الافتراضي فقط)
    - أو في الإعدادات: `channels.twitch.accessToken`

    إذا تم تعيين الاثنين، فتعطى الأفضلية للإعدادات (ويكون متغير البيئة بديلًا للحساب الافتراضي فقط).

  </Step>
  <Step title="شغّل Gateway">
    شغّل Gateway مع القناة المُهيأة.
  </Step>
</Steps>

<Warning>
أضف تحكمًا في الوصول (`allowFrom` أو `allowedRoles`) لمنع المستخدمين غير المصرح لهم من تشغيل الروبوت. تكون القيمة الافتراضية لـ `requireMention` هي `true`.
</Warning>

إعداد أدنى:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // حساب Twitch الخاص بالروبوت
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
- يُربط كل حساب بمفتاح جلسة معزول `agent:<agentId>:twitch:<accountName>`.
- يمثّل `username` حساب الروبوت (الذي يصادق)، بينما يحدد `channel` غرفة الدردشة المطلوب الانضمام إليها.

## الإعداد (بالتفصيل)

### إنشاء بيانات الاعتماد

استخدم [Twitch Token Generator](https://twitchtokengenerator.com/):

- اختر **Bot Token**
- تأكد من تحديد النطاقين `chat:read` و`chat:write`
- انسخ **Client ID** و**Access Token**

<Note>
لا حاجة إلى تسجيل تطبيق يدويًا. تنتهي صلاحية الرموز بعد عدة ساعات.
</Note>

### تهيئة الروبوت

<Tabs>
  <Tab title="متغير بيئة (للحساب الافتراضي فقط)">
    ```bash
    OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
    ```
  </Tab>
  <Tab title="الإعدادات">
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

إذا تم تعيين متغير البيئة والإعدادات معًا، فتعطى الأفضلية للإعدادات.

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

يُفضّل استخدام `allowFrom` لقائمة سماح صارمة. استخدم `allowedRoles` بدلًا منه إذا أردت وصولًا قائمًا على الأدوار.

**الأدوار المتاحة:** `"moderator"` و`"owner"` و`"vip"` و`"subscriber"` و`"all"`.

<Note>
**لماذا معرّفات المستخدمين؟** يمكن أن تتغير أسماء المستخدمين، مما يتيح الانتحال. أما معرّفات المستخدمين فهي دائمة.

اعثر على معرّف مستخدم Twitch الخاص بك: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (تحويل اسم مستخدم Twitch إلى معرّف)
</Note>

## تحديث الرمز تلقائيًا (اختياري)

لا يمكن تحديث الرموز من [Twitch Token Generator](https://twitchtokengenerator.com/) تلقائيًا — أعد إنشاءها عند انتهاء صلاحيتها.

للحصول على تحديث تلقائي للرمز، أنشئ تطبيق Twitch خاصًا بك في [Twitch Developer Console](https://dev.twitch.tv/console) وأضف إلى الإعدادات:

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

يحدّث الروبوت الرموز تلقائيًا قبل انتهاء صلاحيتها ويسجل أحداث التحديث.

## دعم الحسابات المتعددة

استخدم `channels.twitch.accounts` مع رموز مميزة لكل حساب. راجع [الإعدادات](/ar/gateway/configuration) للاطلاع على النمط المشترك.

مثال (حساب روبوت واحد في قناتين):

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
يحتاج كل حساب إلى الرمز الخاص به (رمز واحد لكل قناة).
</Note>

## التحكم في الوصول

<Tabs>
  <Tab title="قائمة سماح معرّفات المستخدمين (الأكثر أمانًا)">
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

    تمثّل `allowFrom` قائمة سماح صارمة. عند تعيينها، يُسمح فقط لمعرّفات المستخدمين تلك. وإذا أردت وصولًا قائمًا على الأدوار، فاترك `allowFrom` غير معيّن واضبط `allowedRoles` بدلًا منه.

  </Tab>
  <Tab title="تعطيل اشتراط @mention">
    تكون القيمة الافتراضية لـ `requireMention` هي `true`. ولتعطيلها والرد على جميع الرسائل:

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

شغّل أولًا أوامر التشخيص:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="الروبوت لا يستجيب للرسائل">
    - **تحقق من التحكم في الوصول:** تأكد من أن معرّف المستخدم الخاص بك موجود في `allowFrom`، أو أزل `allowFrom` مؤقتًا واضبط `allowedRoles: ["all"]` للاختبار.
    - **تحقق من وجود الروبوت في القناة:** يجب أن ينضم الروبوت إلى القناة المحددة في `channel`.
  </Accordion>
  <Accordion title="مشكلات الرمز">
    أخطاء "Failed to connect" أو أخطاء المصادقة:

    - تأكد من أن `accessToken` هو قيمة OAuth access token (ويبدأ عادةً بالبادئة `oauth:`)
    - تحقق من أن الرمز يملك النطاقين `chat:read` و`chat:write`
    - إذا كنت تستخدم تحديث الرمز، فتأكد من تعيين `clientSecret` و`refreshToken`

  </Accordion>
  <Accordion title="تحديث الرمز لا يعمل">
    تحقق من السجلات لمعرفة أحداث التحديث:

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

### إعدادات الحساب

<ParamField path="username" type="string">
  اسم مستخدم الروبوت.
</ParamField>
<ParamField path="accessToken" type="string">
  OAuth access token بالنطاقين `chat:read` و`chat:write`.
</ParamField>
<ParamField path="clientId" type="string">
  Twitch Client ID (من Token Generator أو من تطبيقك).
</ParamField>
<ParamField path="channel" type="string" required>
  القناة المطلوب الانضمام إليها.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  تمكين هذا الحساب.
</ParamField>
<ParamField path="clientSecret" type="string">
  اختياري: لتحديث الرمز تلقائيًا.
</ParamField>
<ParamField path="refreshToken" type="string">
  اختياري: لتحديث الرمز تلقائيًا.
</ParamField>
<ParamField path="expiresIn" type="number">
  مدة انتهاء صلاحية الرمز بالثواني.
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  الطابع الزمني للحصول على الرمز.
</ParamField>
<ParamField path="allowFrom" type="string[]">
  قائمة سماح معرّفات المستخدمين.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  التحكم في الوصول القائم على الأدوار.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  اشتراط @mention.
</ParamField>

### خيارات المزوّد

- `channels.twitch.enabled` - تمكين/تعطيل بدء تشغيل القناة
- `channels.twitch.username` - اسم مستخدم الروبوت (إعداد مبسط لحساب واحد)
- `channels.twitch.accessToken` - OAuth access token (إعداد مبسط لحساب واحد)
- `channels.twitch.clientId` - Twitch Client ID (إعداد مبسط لحساب واحد)
- `channels.twitch.channel` - القناة المطلوب الانضمام إليها (إعداد مبسط لحساب واحد)
- `channels.twitch.accounts.<accountName>` - إعداد الحسابات المتعددة (جميع حقول الحساب أعلاه)

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

## السلامة والتشغيل

- **تعامل مع الرموز كأنها كلمات مرور** — لا تلتزم بالرموز في git أبدًا.
- **استخدم تحديث الرمز التلقائي** للروبوتات طويلة التشغيل.
- **استخدم قوائم سماح معرّفات المستخدمين** بدلًا من أسماء المستخدمين للتحكم في الوصول.
- **راقب السجلات** لأحداث تحديث الرمز وحالة الاتصال.
- **قلّل نطاقات الرموز إلى الحد الأدنى** — اطلب فقط `chat:read` و`chat:write`.
- **إذا تعذر الأمر**: أعد تشغيل Gateway بعد التأكد من عدم وجود عملية أخرى تملك الجلسة.

## الحدود

- **500 حرف** لكل رسالة (مع التقسيم التلقائي عند حدود الكلمات).
- تُزال Markdown قبل التقسيم.
- لا يوجد تحديد لمعدل الطلبات (يستخدم حدود المعدل المضمنة في Twitch).

## ذو صلة

- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية وتقييد الإشارات
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفّق الاقتران
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية

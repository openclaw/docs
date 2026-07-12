---
read_when:
    - إعداد تكامل دردشة Twitch مع OpenClaw
sidebarTitle: Twitch
summary: 'روبوت دردشة Twitch: التثبيت، وبيانات الاعتماد، والتحكم في الوصول، وتحديث الرمز المميز'
title: Twitch
x-i18n:
    generated_at: "2026-07-12T05:38:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70890c0c6a648a06ad47c35016571a57c3e518296ef95311e75e32c81e60e2db
    source_path: channels/twitch.md
    workflow: 16
---

دعم دردشة Twitch عبر واجهة الدردشة (IRC) الخاصة بـ Twitch باستخدام عميل Twurple. يسجّل OpenClaw الدخول بحساب روبوت Twitch، وينضم إلى قناة واحدة لكل حساب مُعدّ، ويرد في تلك القناة.

## التثبيت

يُوزَّع Twitch بصفته Plugin رسميًا؛ وهو ليس جزءًا من التثبيت الأساسي.

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

يسجّل `plugins install` الـ Plugin ويفعّله. يؤدي اختيار Twitch أثناء `openclaw onboard` أو `openclaw channels add` إلى تثبيته عند الطلب. استخدم اسم الحزمة المجرّد لمتابعة الإصدار الحالي؛ ولا تثبّت إصدارًا محددًا بدقة إلا لعمليات التثبيت القابلة لإعادة الإنتاج. يتطلب OpenClaw 2026.4.10 أو إصدارًا أحدث.

التفاصيل: [Plugins](/ar/tools/plugin)

## الإعداد السريع

<Steps>
  <Step title="ثبّت الـ Plugin">
    راجع قسم [التثبيت](#install) أعلاه.
  </Step>
  <Step title="أنشئ حساب روبوت Twitch">
    أنشئ حساب Twitch مخصصًا للروبوت (أو استخدم حسابًا موجودًا).
  </Step>
  <Step title="أنشئ بيانات الاعتماد">
    استخدم [مولّد رموز Twitch](https://twitchtokengenerator.com/):

    - حدّد **Bot Token**
    - تحقّق من تحديد النطاقين `chat:read` و`chat:write`
    - انسخ **Client ID** و**Access Token**

  </Step>
  <Step title="اعثر على معرّف مستخدم Twitch الخاص بك">
    استخدم [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) لتحويل اسم مستخدم إلى معرّف مستخدم Twitch.
  </Step>
  <Step title="اضبط الرمز">
    - متغير البيئة: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (للحساب الافتراضي فقط)
    - أو الإعداد: `channels.twitch.accessToken`

    إذا ضُبط كلاهما، تكون الأولوية للإعداد (ومتغير البيئة مجرد خيار احتياطي للحساب الافتراضي).

  </Step>
  <Step title="شغّل Gateway">
    ```bash
    openclaw gateway run
    ```
  </Step>
</Steps>

<Warning>
أضف تحكمًا في الوصول (`allowFrom` أو `allowedRoles`) لمنع المستخدمين غير المصرّح لهم من تشغيل الروبوت. القيمة الافتراضية لـ `requireMention` هي `true`.
</Warning>

الحد الأدنى للإعداد:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Bot's Twitch account (authenticates)
      accessToken: "oauth:abc123...", // OAuth access token (or use OPENCLAW_TWITCH_ACCESS_TOKEN env var)
      clientId: "xyz789...", // Client ID from Token Generator
      channel: "yourchannel", // Which Twitch channel's chat to join (required)
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only
    },
  },
}
```

## ماهيته

- قناة Twitch يملكها Gateway.
- توجيه حتمي: تعود الردود دائمًا إلى قناة Twitch التي وردت منها الرسالة.
- ترتبط كل قناة منضم إليها بمفتاح جلسة مجموعة معزول `agent:<agentId>:twitch:group:<channel>`.
- يمثّل `username` حساب الروبوت (الذي يجري المصادقة)، بينما يحدد `channel` غرفة الدردشة المطلوب الانضمام إليها. ينضم كل إدخال حساب إلى قناة واحدة بالضبط.
- تعمل الرموز مع البادئة `oauth:` أو من دونها؛ يطبّع OpenClaw الصيغتين (ويتوقع معالج الإعداد الصيغة التي تتضمن `oauth:`).

## تحديث الرمز (اختياري)

لا يستطيع OpenClaw تحديث الرموز الصادرة من [مولّد رموز Twitch](https://twitchtokengenerator.com/)؛ أنشئها مجددًا عند انتهاء صلاحيتها (تدوم بضع ساعات، ولا يلزم تسجيل تطبيق).

للتحديث التلقائي، أنشئ تطبيقك الخاص في [لوحة مطوري Twitch](https://dev.twitch.tv/console) وأضف:

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

عند ضبط القيمتين، يستخدم الـ Plugin موفّر مصادقة قابلًا للتحديث، يجدّد الرموز قبل انتهاء صلاحيتها ويسجّل كل عملية تحديث. من دون `refreshToken` يسجّل `token refresh disabled (no refresh token)`؛ ومن دون `clientSecret` يعود إلى استخدام رمز ثابت (غير قابل للتحديث).

## دعم الحسابات المتعددة

استخدم `channels.twitch.accounts` مع بيانات اعتماد خاصة بكل حساب. راجع [الإعداد](/ar/gateway/configuration) لمعرفة النمط المشترك.

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
          channel: "yourchannel",
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
يحتاج كل إدخال حساب إلى `accessToken` خاص به (لا يغطي متغير البيئة سوى الحساب الافتراضي). ينضم كل حساب إلى قناة واحدة بالضبط، لذا يتطلب الانضمام إلى قناتين حسابين. يحدد `channels.twitch.defaultAccount` الحساب الافتراضي.
</Note>

## التحكم في الوصول

يمثّل `allowFrom` قائمة سماح صارمة لمعرّفات مستخدمي Twitch. عند ضبطه، يُتجاهل `allowedRoles`؛ اترك `allowFrom` من دون ضبط لاستخدام الوصول المستند إلى الأدوار بدلًا منه.

**الأدوار المتاحة:** `"moderator"`، و`"owner"`، و`"vip"`، و`"subscriber"`، و`"all"`.

<Tabs>
  <Tab title="قائمة سماح بمعرّفات المستخدمين (الأكثر أمانًا)">
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
  <Tab title="مستند إلى الأدوار">
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
  </Tab>
  <Tab title="تعطيل اشتراط الإشارة بـ @">
    القيمة الافتراضية لـ `requireMention` هي `true`. للرد على جميع الرسائل المسموح بها:

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

<Note>
**لماذا معرّفات المستخدمين؟** يمكن تغيير أسماء المستخدمين، مما يتيح انتحال الهوية. أما معرّفات المستخدمين فهي دائمة.

اعثر على معرّفك باستخدام [محوّل اسم المستخدم إلى معرّف](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/).
</Note>

## استكشاف الأخطاء وإصلاحها

شغّل أولًا أوامر التشخيص:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="الروبوت لا يستجيب للرسائل">
    - **تحقّق من التحكم في الوصول:** تأكد من وجود معرّف المستخدم الخاص بك في `allowFrom`، أو أزل `allowFrom` مؤقتًا واضبط `allowedRoles: ["all"]` للاختبار.
    - **تحقّق من بوابة الإشارة:** عند ضبط `requireMention: true` (القيمة الافتراضية)، يجب أن تشير الرسائل إلى اسم مستخدم الروبوت باستخدام @.
    - **تحقّق من وجود الروبوت في القناة:** لا ينضم الروبوت إلا إلى القناة المذكورة في `channel`.

  </Accordion>
  <Accordion title="مشكلات الرمز">
    أخطاء "فشل الاتصال" أو أخطاء المصادقة:

    - تحقّق من أن `accessToken` هو قيمة رمز وصول OAuth (البادئة `oauth:` اختيارية)
    - تحقّق من أن الرمز يتضمن النطاقين `chat:read` و`chat:write`
    - إذا كنت تستخدم تحديث الرمز، فتحقّق من ضبط `clientSecret` و`refreshToken`

  </Accordion>
  <Accordion title="تحديث الرمز لا يعمل">
    افحص السجلات بحثًا عن أحداث التحديث:

    ```text
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    إذا ظهر `token refresh disabled (no refresh token)`:

    - تأكد من توفير `clientSecret`
    - تأكد من توفير `refreshToken`

  </Accordion>
</AccordionGroup>

## الإعداد

### إعداد الحساب

<ParamField path="username" type="string" required>
  اسم مستخدم الروبوت (الحساب الذي يجري المصادقة).
</ParamField>
<ParamField path="accessToken" type="string" required>
  رمز وصول OAuth يتضمن `chat:read` و`chat:write` (عبر الإعداد أو متغير البيئة للحساب الافتراضي).
</ParamField>
<ParamField path="clientId" type="string" required>
  معرّف عميل Twitch (من مولّد الرموز أو تطبيقك). اختياري في المخطط، لكنه مطلوب للاتصال.
</ParamField>
<ParamField path="channel" type="string" required>
  القناة المطلوب الانضمام إليها.
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
  مدة صلاحية الرمز بالثواني (لتتبّع التحديث).
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  الطابع الزمني لوقت الحصول على الرمز (لتتبّع التحديث).
</ParamField>
<ParamField path="allowFrom" type="string[]">
  قائمة سماح لمعرّفات المستخدمين. عند ضبطها، تُتجاهل الأدوار.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  تحكم في الوصول مستند إلى الأدوار.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  اشترط الإشارة بـ @ لتشغيل الروبوت.
</ParamField>
<ParamField path="responsePrefix" type="string">
  تجاوز بادئة الردود الصادرة لهذا الحساب.
</ParamField>

### خيارات الموفّر

- `channels.twitch.enabled` - تفعيل/تعطيل بدء تشغيل القناة
- `channels.twitch.username` / `accessToken` / `clientId` / `channel` - إعداد مبسّط لحساب واحد (حساب `default` ضمني؛ وتكون له الأولوية على `accounts.default`)
- `channels.twitch.accounts.<accountName>` - إعداد حسابات متعددة (جميع حقول الحساب المذكورة أعلاه)
- `channels.twitch.defaultAccount` - اسم الحساب الافتراضي
- `channels.twitch.markdown.tables` - وضع عرض جداول Markdown (`off` | `bullets` | `code` | `block`)

مثال كامل:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "yourchannel",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      accounts: {
        second: {
          username: "mybot",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "your_channel",
          enabled: true,
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## إجراءات الأداة

يمكن للوكيل إرسال رسائل Twitch عبر الإجراء `send` لأداة الرسائل:

```json5
{
  channel: "twitch",
  action: "send",
  to: "#mychannel",
  message: "Hello Twitch!",
}
```

الحقل `to` اختياري، وتكون قيمته الافتراضية `channel` المضبوطة للحساب.

## الأمان والتشغيل

- **تعامل مع الرموز مثل كلمات المرور** - لا تُثبّت الرموز أبدًا في git.
- **استخدم التحديث التلقائي للرمز** للروبوتات التي تعمل لفترات طويلة.
- **استخدم قوائم السماح لمعرّفات المستخدمين** بدلًا من أسماء المستخدمين للتحكم في الوصول.
- **راقب السجلات** لمتابعة أحداث تحديث الرمز وحالة الاتصال.
- **قلّل نطاقات الرموز إلى الحد الأدنى** - لا تطلب سوى `chat:read` و`chat:write`.
- **إذا تعذّر عليك المتابعة**: أعد تشغيل Gateway بعد التأكد من عدم امتلاك أي عملية أخرى للجلسة.

## الحدود

- **500 حرف** لكل رسالة؛ تُقسّم الردود الأطول عند حدود الكلمات.
- تُزال صياغة Markdown قبل الإرسال (دردشة Twitch نص عادي؛ وتتحول الأسطر الجديدة إلى مسافات).
- لا يضيف OpenClaw أي تقييد لمعدل الطلبات من جانبه؛ يتولى عميل دردشة Twurple معالجة حدود معدل Twitch.

## ذو صلة

- [توجيه القنوات](/ar/channels/channel-routing) — توجيه جلسات الرسائل
- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعات وبوابة الإشارة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [الأمان](/ar/gateway/security) — نموذج الوصول والتعزيز الأمني

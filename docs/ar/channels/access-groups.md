---
read_when:
    - تهيئة قائمة السماح نفسها عبر قنوات مراسلة متعددة
    - مشاركة قواعد وصول المرسلين في الرسائل المباشرة والمجموعات
    - مراجعة التحكم في الوصول إلى قنوات المراسلة
summary: قوائم المرسلين المسموح لهم القابلة لإعادة الاستخدام لقنوات الرسائل
title: مجموعات الوصول
x-i18n:
    generated_at: "2026-07-12T05:33:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 099abc95e90d9a7b7006d19062c46b4ffdb2aecb1e8e714454a3182131a786d0
    source_path: channels/access-groups.md
    workflow: 16
---

مجموعات الوصول هي قوائم مسمّاة من المرسلين تُعرّفها مرة واحدة ضمن `accessGroups` وتشير إليها من قوائم السماح الخاصة بالقنوات باستخدام `accessGroup:<name>`.

استخدمها عندما ينبغي السماح للأشخاص أنفسهم عبر عدة قنوات مراسلة، أو عندما ينبغي تطبيق مجموعة موثوقة واحدة على كلٍ من تفويض مرسلي الرسائل المباشرة والمجموعات.

لا تمنح المجموعة أي صلاحية بحد ذاتها. ولا يكون لها تأثير إلا عندما يشير إليها حقل قائمة سماح.

## مجموعات مرسلي الرسائل الثابتة

تستخدم مجموعات المرسلين الثابتة `type: "message.senders"`. تُفهرس `members` حسب معرّف قناة المراسلة، بالإضافة إلى `"*"` للإدخالات المشتركة بين جميع القنوات:

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
}
```

| المفتاح                    | المعنى                                                                      |
| -------------------------- | --------------------------------------------------------------------------- |
| `"*"`                      | إدخالات مشتركة تُفحص لكل قناة مراسلة تشير إلى المجموعة.                     |
| `discord`، `telegram`، ... | إدخالات تُفحص فقط عند مطابقة قائمة السماح الخاصة بتلك القناة.                |

تُطابق الإدخالات باستخدام قواعد `allowFrom` العادية لقناة الوجهة. لا يحوّل OpenClaw معرّفات المرسلين بين القنوات: إذا كان لدى أليس معرّف Telegram ومعرّف Discord، فأدرج كلا المعرّفين ضمن مفتاحَي القناتين المطابقين.

## الإشارة إلى المجموعات من قوائم السماح

أشر إلى مجموعة باستخدام `accessGroup:<name>` في أي موضع يدعم فيه مسار قناة المراسلة قوائم السماح للمرسلين.

مثال على قائمة سماح الرسائل المباشرة:

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
    telegram: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

مثال على قائمة سماح مرسلي المجموعات:

```json5
{
  accessGroups: {
    oncall: {
      type: "message.senders",
      members: {
        whatsapp: ["+15551234567"],
        googlechat: ["users/1234567890"],
      },
    },
  },
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["accessGroup:oncall"],
    },
    googlechat: {
      groups: {
        "spaces/AAA": {
          users: ["accessGroup:oncall"],
        },
      },
    },
  },
}
```

يمكنك الجمع بين المجموعات والإدخالات المباشرة:

```json5
{
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators", "discord:123456789012345678"],
    },
  },
}
```

## مسارات قنوات المراسلة المدعومة

تعمل مجموعات الوصول في مسارات التفويض المشتركة لقنوات المراسلة:

- قوائم السماح لمرسلي الرسائل المباشرة، مثل `channels.<channel>.allowFrom`
- قوائم السماح لمرسلي المجموعات، مثل `channels.<channel>.groupAllowFrom`
- قوائم السماح للمرسلين لكل غرفة الخاصة بقناة بعينها والتي تستخدم قواعد مطابقة المرسلين نفسها (على سبيل المثال `groups.<space>.users` في Google Chat)
- مسارات تفويض الأوامر التي تعيد استخدام قوائم السماح لمرسلي قنوات المراسلة

يعتمد دعم القناة على ما إذا كانت تلك القناة موصولة بأدوات OpenClaw المساعدة المشتركة لتفويض المرسلين. يشمل الدعم المضمّن حاليًا ClickClack وDiscord وFeishu وGoogle Chat وiMessage وIRC وLINE وMattermost وMicrosoft Teams وNextcloud Talk وNostr وQQ Bot وSignal وSlack وSMS وTelegram وWhatsApp وZalo وZalo Personal. مجموعات `message.senders` الثابتة مستقلة عن القنوات، لذا تحصل قنوات المراسلة الجديدة على دعمها باستخدام أدوات دخول SDK المشتركة للـ Plugin بدلًا من توسيع قوائم السماح المخصص.

## جماهير قنوات Discord

يدعم Discord أيضًا نوعًا ديناميكيًا من مجموعات الوصول:

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

تعني `discord.channelAudience`: «السماح لمرسلي الرسائل المباشرة في Discord الذين يمكنهم حاليًا عرض قناة الخادم هذه». يتحقق OpenClaw من المرسل عبر Discord وقت التفويض ويطبّق قواعد إذن `ViewChannel` في Discord. الحقل `membership` اختياري وتكون قيمته الافتراضية `canViewChannel`.

استخدم هذا عندما تكون قناة Discord هي بالفعل مصدر الحقيقة لفريق، مثل `#maintainers` أو `#on-call`.

المتطلبات وسلوك الفشل:

- يحتاج البوت إلى الوصول إلى الخادم والقناة.
- يحتاج البوت إلى **Server Members Intent** في Discord Developer Portal.
- تفشل مجموعة الوصول بشكل مغلق عندما يعيد Discord الخطأ `Missing Access`، أو يتعذر التحقق من المرسل كعضو في الخادم، أو تنتمي القناة إلى خادم آخر.

مزيد من الأمثلة الخاصة بـ Discord: [التحكم في الوصول إلى Discord](/ar/channels/discord#access-control-and-routing)

## تشخيصات Plugin

يمكن لمؤلفي Plugin فحص حالة مجموعات الوصول المنظّمة دون توسيعها مرة أخرى إلى قائمة سماح مسطّحة:

```typescript
import { resolveAccessGroupAllowFromState } from "openclaw/plugin-sdk/access-groups";

const state = await resolveAccessGroupAllowFromState({
  accessGroups: cfg.accessGroups,
  allowFrom: channelConfig.allowFrom,
  channel: "my-channel",
  accountId: "default",
  senderId,
  isSenderAllowed,
});
```

تُبلغ النتيجة عن المجموعات المشار إليها والمطابقة والمفقودة وغير المدعومة والفاشلة. استخدمها للتشخيصات أو اختبارات المطابقة. لا تستخدم `expandAllowFromWithAccessGroups(...)` إلا لمسارات التوافق التي لا تزال تتوقع مصفوفة `allowFrom` مسطّحة.

## ملاحظات أمنية

- مجموعات الوصول هي أسماء بديلة لقوائم السماح وليست أدوارًا. وهي لا تنشئ مالكين، ولا توافق على طلبات الاقتران، ولا تمنح أذونات الأدوات بحد ذاتها.
- لا تزال `dmPolicy: "open"` تتطلب وجود `"*"` في قائمة السماح الفعّالة للرسائل المباشرة. الإشارة إلى مجموعة وصول لا تعادل الوصول العام.
- تفشل أسماء المجموعات المفقودة بشكل مغلق. إذا احتوت `allowFrom` على `accessGroup:operators` ولم تكن `accessGroups.operators` موجودة، فلن يفوّض ذلك الإدخال أي شخص.
- حافظ على ثبات معرّفات القنوات. فضّل المعرّفات الرقمية أو معرّفات المستخدمين على أسماء العرض عندما تدعم القناة كليهما.

## استكشاف الأخطاء وإصلاحها

إذا كان ينبغي أن يطابق مرسلٌ ما ولكنه محظور:

1. تأكد من أن حقل قائمة السماح يحتوي على المرجع `accessGroup:<name>` الدقيق.
2. تأكد من صحة `accessGroups.<name>.type`.
3. تأكد من إدراج معرّف المرسل ضمن مفتاح القناة المطابق، أو ضمن `"*"`.
4. تأكد من أن الإدخال يستخدم صيغة قائمة السماح العادية لتلك القناة.
5. بالنسبة إلى جماهير قنوات Discord، تأكد من أن البوت يستطيع رؤية قناة الخادم وأن Server Members Intent مفعّل.

شغّل `openclaw doctor` بعد تعديل إعدادات التحكم في الوصول. فهو يكتشف العديد من التركيبات غير الصالحة لقوائم السماح والسياسات قبل وقت التشغيل.

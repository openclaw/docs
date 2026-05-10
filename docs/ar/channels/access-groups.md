---
read_when:
    - تكوين قائمة السماح نفسها عبر قنوات رسائل متعددة
    - قواعد وصول المرسِل في الرسائل المباشرة والمجموعات عند المشاركة
    - مراجعة التحكم في الوصول إلى قنوات الرسائل
summary: قوائم سماح المرسلين القابلة لإعادة الاستخدام لقنوات الرسائل
title: مجموعات الوصول
x-i18n:
    generated_at: "2026-05-10T19:21:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1dba4fc84deb6e0c8c7b17ebc10182aa6e4bc2c821070e33df44f384e285266f
    source_path: channels/access-groups.md
    workflow: 16
---

مجموعات الوصول هي قوائم مرسلين مسماة تعرفها مرة واحدة وتشير إليها من قوائم السماح الخاصة بالقنوات باستخدام `accessGroup:<name>`.

استخدمها عندما ينبغي السماح للأشخاص أنفسهم عبر عدة قنوات رسائل، أو عندما ينبغي تطبيق مجموعة موثوقة واحدة على كل من تفويض مرسلي الرسائل المباشرة والمجموعات.

لا تمنح مجموعات الوصول حق الوصول بحد ذاتها. لا تصبح المجموعة مهمة إلا عندما يشير إليها حقل قائمة سماح.

## مجموعات مرسلي الرسائل الثابتة

تستخدم مجموعات المرسلين الثابتة `type: "message.senders"`.

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

تُفهرس قوائم الأعضاء حسب معرّف قناة الرسائل:

| المفتاح   | المعنى                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| `"*"`      | إدخالات مشتركة تُفحص لكل قناة رسائل تشير إلى المجموعة. |
| `discord`  | إدخالات تُفحص فقط لمطابقة قائمة سماح Discord.                    |
| `telegram` | إدخالات تُفحص فقط لمطابقة قائمة سماح Telegram.                   |
| `whatsapp` | إدخالات تُفحص فقط لمطابقة قائمة سماح WhatsApp.                   |

تتم مطابقة الإدخالات باستخدام قواعد `allowFrom` العادية لقناة الوجهة. لا يترجم OpenClaw معرّفات المرسلين بين القنوات. إذا كان لدى Alice معرّف Telegram ومعرّف Discord، فأدرج كلا المعرّفين تحت المفاتيح المناسبة.

## الإشارة إلى المجموعات من قوائم السماح

أشر إلى مجموعة باستخدام `accessGroup:<name>` في أي مكان يدعم فيه مسار قناة الرسائل قوائم سماح المرسلين.

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
      spaces: {
        "spaces/AAA": {
          users: ["accessGroup:oncall"],
        },
      },
    },
  },
}
```

يمكنك مزج المجموعات والإدخالات المباشرة:

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

## مسارات قنوات الرسائل المدعومة

تتوفر مجموعات الوصول في مسارات تفويض قنوات الرسائل المشتركة، بما في ذلك:

- قوائم سماح مرسلي الرسائل المباشرة مثل `channels.<channel>.allowFrom`
- قوائم سماح مرسلي المجموعات مثل `channels.<channel>.groupAllowFrom`
- قوائم سماح المرسلين لكل غرفة والخاصة بالقناة التي تستخدم قواعد مطابقة المرسلين نفسها
- مسارات تفويض الأوامر التي تعيد استخدام قوائم سماح مرسلي قنوات الرسائل

يعتمد دعم القناة على ما إذا كانت تلك القناة موصولة عبر أدوات تفويض المرسلين المشتركة في OpenClaw. يتضمن الدعم المضمّن الحالي Discord وFeishu وGoogle Chat وiMessage وLINE وMattermost وMicrosoft Teams وNextcloud Talk وNostr وQQBot وSignal وWhatsApp وZalo وZalo Personal. صُممت مجموعات `message.senders` الثابتة لتكون غير مرتبطة بقناة معينة، لذلك ينبغي أن تدعمها قنوات الرسائل الجديدة باستخدام مساعدات Plugin SDK المشتركة بدلاً من توسيع قوائم السماح المخصص.

## تشخيصات Plugin

يمكن لمؤلفي Plugin فحص حالة مجموعة الوصول المنظمة دون توسيعها مجددًا إلى قائمة سماح مسطحة:

```typescript
import { resolveAccessGroupAllowFromState } from "openclaw/plugin-sdk/security-runtime";

const state = await resolveAccessGroupAllowFromState({
  accessGroups: cfg.accessGroups,
  allowFrom: channelConfig.allowFrom,
  channel: "my-channel",
  accountId: "default",
  senderId,
  isSenderAllowed,
});
```

تُبلغ النتيجة عن المجموعات المشار إليها، والمطابقة، والمفقودة، وغير المدعومة، والفاشلة. استخدم هذا عندما تحتاج إلى تشخيصات أو اختبارات امتثال. استخدم `expandAllowFromWithAccessGroups(...)` فقط لمسارات التوافق التي لا تزال تتوقع مصفوفة `allowFrom` مسطحة.

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

يعني `discord.channelAudience` "السماح لمرسلي رسائل Discord المباشرة الذين يمكنهم حاليًا عرض قناة الخادم هذه." يحل OpenClaw المرسل عبر Discord في وقت التفويض ويطبق قواعد إذن `ViewChannel` في Discord.

استخدم هذا عندما تكون قناة Discord هي مصدر الحقيقة الحالي لفريق، مثل `#maintainers` أو `#on-call`.

المتطلبات وسلوك الفشل:

- يحتاج الروبوت إلى الوصول إلى الخادم والقناة.
- يحتاج الروبوت إلى **نية أعضاء الخادم** في بوابة مطوري Discord.
- تفشل مجموعة الوصول بشكل مغلق عندما يرجع Discord القيمة `Missing Access`، أو يتعذر حل المرسل كعضو في الخادم، أو تنتمي القناة إلى خادم آخر.

المزيد من أمثلة Discord الخاصة: [التحكم في وصول Discord](/ar/channels/discord#access-control-and-routing)

## ملاحظات الأمان

- مجموعات الوصول هي أسماء بديلة لقوائم السماح، وليست أدوارًا. فهي لا تنشئ مالكين، ولا توافق على طلبات الاقتران، ولا تمنح أذونات الأدوات بحد ذاتها.
- لا تزال `dmPolicy: "open"` تتطلب `"*"` في قائمة سماح الرسائل المباشرة الفعالة. الإشارة إلى مجموعة وصول ليست مثل الوصول العام.
- تفشل أسماء المجموعات المفقودة بشكل مغلق. إذا احتوى `allowFrom` على `accessGroup:operators` وكان `accessGroups.operators` غائبًا، فلن يفوض ذلك الإدخال أي شخص.
- أبقِ معرّفات القنوات مستقرة. فضّل المعرّفات الرقمية/معرّفات المستخدمين على أسماء العرض عندما تدعم القناة كليهما.

## استكشاف الأخطاء وإصلاحها

إذا كان ينبغي أن يطابق مرسل لكنه محظور:

1. تأكد من أن حقل قائمة السماح يحتوي على مرجع `accessGroup:<name>` الدقيق.
2. تأكد من أن `accessGroups.<name>.type` صحيح.
3. تأكد من أن معرّف المرسل مدرج تحت مفتاح القناة المطابق، أو تحت `"*"`.
4. تأكد من أن الإدخال يستخدم صياغة قائمة السماح العادية لتلك القناة.
5. بالنسبة إلى جماهير قنوات Discord، تأكد من أن الروبوت يمكنه رؤية قناة الخادم وأن نية أعضاء الخادم مفعلة.

شغّل `openclaw doctor` بعد تحرير إعدادات التحكم في الوصول. فهو يلتقط العديد من تركيبات قوائم السماح والسياسات غير الصالحة قبل وقت التشغيل.

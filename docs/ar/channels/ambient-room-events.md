---
read_when:
    - تكوين غرف المجموعات أو القنوات الدائمة التشغيل
    - تريد أن يراقب الوكيل دردشة الغرفة دون نشر النص النهائي تلقائيًا
    - استكشاف أخطاء الكتابة واستخدام الرموز المميزة بدون رسالة مرئية في الغرفة
sidebarTitle: Ambient room events
summary: دع غرف المجموعات المدعومة توفّر سياقًا هادئًا ما لم يرسل الوكيل باستخدام أداة الرسائل
title: أحداث الغرفة المحيطة
x-i18n:
    generated_at: "2026-06-27T17:09:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6423bea8aa1371fe53b610ae1ca794fc6d7866ecd767eee7b837a75004eebf83
    source_path: channels/ambient-room-events.md
    workflow: 16
---

تتيح أحداث الغرفة المحيطة لـ OpenClaw معالجة ثرثرة المجموعات أو القنوات التي لا تذكره كسياق هادئ. يمكن للوكيل تحديث الذاكرة وحالة الجلسة، لكن الغرفة تبقى صامتة ما لم يستدعِ الوكيل أداة `message` صراحة.

لدردشات المجموعات دائمة التشغيل، هذا هو الوضع الموصى به: اجمع بين `messages.groupChat.unmentionedInbound: "room_event"` و`messages.groupChat.visibleReplies: "message_tool"`. استخدمه عندما ينبغي للوكيل أن يستمع، ويقرر متى يكون الرد مفيدا، ويتجنب نمط المطالبة القديم الذي كان يجيب بـ `NO_REPLY`.

المدعوم اليوم: قنوات خوادم Discord، وقنوات Slack والقنوات الخاصة، ورسائل Slack المباشرة متعددة الأشخاص، ومجموعات Telegram أو المجموعات الفائقة. تحتفظ قنوات المجموعات الأخرى بسلوك المجموعات الحالي ما لم تذكر صفحة القناة أنها تدعم أحداث الغرفة المحيطة.

## الإعداد الموصى به

اضبط سلوك دردشة المجموعات العام:

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
}
```

ثم اضبط الغرفة نفسها لتكون دائمة التشغيل عبر تعطيل بوابة الذكر لتلك الغرفة. يجب أن تظل القناة مسموحا بها عبر `groupPolicy` العادية الخاصة بها، وقائمة السماح للغرفة، وقائمة السماح للمرسلين.

بعد حفظ الإعداد، يعيد Gateway تحميل إعدادات `messages` أثناء التشغيل. أعد التشغيل فقط عندما تكون مراقبة الملفات أو إعادة تحميل الإعداد معطلة.

## ما الذي يتغير

مع `messages.groupChat.unmentionedInbound: "room_event"`:

- تتحول رسائل المجموعة أو القناة المسموح بها التي لا تذكر الوكيل إلى أحداث غرفة هادئة
- تبقى الرسائل التي تذكر الوكيل طلبات مستخدم
- تبقى الأوامر النصية والأوامر الأصلية طلبات مستخدم
- تبقى طلبات الإلغاء أو الإيقاف طلبات مستخدم
- تبقى الرسائل المباشرة طلبات مستخدم

تستخدم أحداث الغرفة تسليما مرئيا صارما. يكون نص المساعد النهائي خاصا. يجب على الوكيل استدعاء `message(action=send)` للنشر في الغرفة.

## مثال Discord

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          requireMention: false,
          users: ["<YOUR_DISCORD_USER_ID>"],
        },
      },
    },
  },
}
```

استخدم إعداد Discord لكل قناة عندما ينبغي أن تكون قناة واحدة فقط محيطة:

```json5
{
  channels: {
    discord: {
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
              allow: true,
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

## مثال Slack

قوائم السماح لقنوات Slack تعتمد على المعرّف أولا. استخدم معرّفات القنوات مثل `C12345678`، وليس `#channel-name`.

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    slack: {
      groupPolicy: "allowlist",
      channels: {
        "<SLACK_CHANNEL_ID>": {
          allow: true,
          requireMention: false,
        },
      },
    },
  },
}
```

## مثال Telegram

بالنسبة إلى مجموعات Telegram، يجب أن يتمكن البوت من رؤية رسائل المجموعة العادية. إذا كان `requireMention: false`، فعطّل وضع الخصوصية في BotFather أو استخدم إعداد Telegram آخر يسلّم كل حركة رسائل المجموعة إلى البوت.

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    telegram: {
      groups: {
        "<TELEGRAM_GROUP_CHAT_ID>": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

عادة ما تكون معرّفات مجموعات Telegram أرقاما سالبة مثل `-1001234567890`. اقرأ `chat.id` من `openclaw logs --follow`، أو أعد توجيه رسالة مجموعة إلى بوت مساعد للمعرّفات، أو افحص Bot API `getUpdates`.

## سياسة خاصة بالوكيل

استخدم تجاوزا خاصا بالوكيل عندما يتشارك عدة وكلاء الغرفة نفسها، لكن ينبغي لوكيل واحد فقط التعامل مع الثرثرة التي لا تذكره كسياق محيط:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          unmentionedInbound: "room_event",
          mentionPatterns: ["@openclaw", "openclaw"],
        },
      },
    ],
  },
}
```

تتجاوز قيمة `agents.list[].groupChat.unmentionedInbound` الخاصة بالوكيل قيمة `messages.groupChat.unmentionedInbound` لذلك الوكيل.

## أوضاع الرد المرئي

القيمة الافتراضية لـ `messages.groupChat.visibleReplies` هي `"automatic"` لطلبات المستخدم العادية في المجموعات/القنوات. أبقِ تلك القيمة الافتراضية عندما تريد نشر نص المساعد النهائي بشكل مرئي من دون طلب استدعاء صريح لأداة الرسائل.

بالنسبة إلى الغرف المحيطة دائمة التشغيل، يظل `messages.groupChat.visibleReplies: "message_tool"` موصى به، خصوصا مع النماذج من الجيل الأحدث والموثوقة في استخدام الأدوات مثل GPT 5.5. يتيح ذلك للوكيل أن يقرر متى يتحدث عبر استدعاء أداة الرسائل. إذا أعاد النموذج نصا نهائيا من دون استدعاء الأداة، يبقي OpenClaw ذلك النص النهائي خاصا ويسجل بيانات تعريف التسليم المكبوت.

تبقى أحداث الغرفة صارمة حتى عندما تستخدم طلبات المجموعات الأخرى الردود التلقائية. لا تزال أحداث الغرفة المحيطة التي لا تذكر الوكيل تتطلب `message(action=send)` لإخراج مرئي.

## السجل

يتحكم `messages.groupChat.historyLimit` في القيمة الافتراضية العامة لسجل المجموعات. يمكن للقنوات تجاوزها باستخدام `channels.<channel>.historyLimit`، وتدعم بعض القنوات أيضا حدود سجل لكل حساب.

اضبط `historyLimit: 0` لتعطيل سياق سجل المجموعات.

تحتفظ قنوات أحداث الغرفة المدعومة برسائل الغرفة المحيطة الحديثة كسياق. يحتفظ Discord بسجل أحداث الغرفة حتى ينجح إرسال Discord مرئي، حتى لا يُفقد السياق الهادئ قبل التسليم عبر أداة الرسائل.

## استكشاف الأخطاء وإصلاحها

إذا أظهرت الغرفة حالة كتابة أو استخداما للرموز من دون رسالة مرئية:

1. تأكد أن الغرفة مسموح بها عبر قائمة السماح للقناة وقائمة السماح للمرسلين.
2. تأكد أن `requireMention: false` مضبوط على مستوى الغرفة الذي تتوقعه.
3. تحقق مما إذا كان `messages.groupChat.unmentionedInbound` أو تجاوز الوكيل هو `"room_event"`.
4. افحص السجلات بحثا عن بيانات تعريف الحمولة النهائية المكبوتة أو `didSendViaMessagingTool: false`.
5. بالنسبة إلى طلبات المجموعات العادية، أبقِ أو استعد `messages.groupChat.visibleReplies: "automatic"` إذا كنت تريد نشر الردود النهائية تلقائيا. بالنسبة إلى الغرف المحيطة التي تستخدم `message_tool`، استخدم نموذجا/تشغيلا يستدعي الأدوات بموثوقية.

إذا لم يتم تشغيل الغرف المحيطة في Telegram إطلاقا، فتحقق من وضع الخصوصية في BotFather وتأكد أن Gateway يتلقى رسائل المجموعة العادية.

إذا لم يتم تشغيل الغرف المحيطة في Slack، فتحقق من أن مفتاح القناة هو معرّف قناة Slack وأن التطبيق لديه نطاق `channels:history` أو `groups:history` المطلوب لنوع تلك الغرفة.

## ذات صلة

- [المجموعات](/ar/channels/groups)
- [Discord](/ar/channels/discord)
- [Slack](/ar/channels/slack)
- [Telegram](/ar/channels/telegram)
- [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting)
- [مرجع إعداد القنوات](/ar/gateway/config-channels)

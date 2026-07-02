---
read_when:
    - تكوين غرف المجموعات أو القنوات الدائمة التشغيل
    - تريد أن يراقب الوكيل أحاديث الغرفة دون نشر النص النهائي تلقائيًا
    - تصحيح أخطاء الكتابة واستخدام الرموز المميزة دون رسالة ظاهرة في الغرفة
sidebarTitle: Ambient room events
summary: اجعل غرف المجموعات المدعومة توفّر سياقًا هادئًا ما لم يرسل الوكيل باستخدام أداة الرسائل
title: أحداث الغرفة المحيطة
x-i18n:
    generated_at: "2026-07-02T17:37:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e3dcf5abab58d9bfd75b7cef6c8a55b98f6688a895774b8ba4a1ffc5723e0a6
    source_path: channels/ambient-room-events.md
    workflow: 16
---

تتيح أحداث الغرفة المحيطة لـ OpenClaw معالجة أحاديث المجموعات أو القنوات غير المذكورة كسياق هادئ. يمكن للوكيل تحديث الذاكرة وحالة الجلسة، لكن تبقى الغرفة صامتة ما لم يستدعِ الوكيل صراحة أداة `message`.

بالنسبة إلى محادثات المجموعات دائمة التشغيل، فهذا هو الوضع الموصى به: اجمع بين `messages.groupChat.unmentionedInbound: "room_event"` و`messages.groupChat.visibleReplies: "message_tool"`. استخدمه عندما يجب أن يستمع الوكيل، ويقرر متى تكون الاستجابة مفيدة، ويتجنب نمط المطالبة القديم المتمثل في الإجابة بـ `NO_REPLY`.

مدعوم اليوم: قنوات خوادم Discord، وقنوات Slack والقنوات الخاصة، ورسائل Slack المباشرة متعددة الأشخاص، ومجموعات Telegram أو المجموعات الفائقة. تحتفظ قنوات المجموعات الأخرى بسلوك المجموعة الحالي ما لم تذكر صفحة القناة أنها تدعم أحداث الغرفة المحيطة.

## الإعداد الموصى به

اضبط سلوك محادثات المجموعات العام:

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

ثم اضبط الغرفة نفسها لتكون دائمة التشغيل عبر تعطيل بوابة الذكر لتلك الغرفة. يجب أن تظل القناة مسموحًا بها عبر `groupPolicy` العادية الخاصة بها، وقائمة السماح للغرف، وقائمة السماح للمرسلين.

بعد حفظ التكوين، يعيد Gateway تحميل إعدادات `messages` تحميلًا ساخنًا. أعد التشغيل فقط عند تعطيل مراقبة الملفات أو إعادة تحميل التكوين.

## ما الذي يتغير

مع `messages.groupChat.unmentionedInbound: "room_event"`:

- تصبح رسائل المجموعة أو القناة المسموح بها وغير المذكورة أحداث غرفة هادئة
- تبقى الرسائل المذكورة طلبات مستخدم
- تبقى الأوامر النصية والأوامر الأصلية طلبات مستخدم
- تبقى طلبات الإجهاض أو الإيقاف طلبات مستخدم
- تبقى الرسائل المباشرة طلبات مستخدم

تستخدم أحداث الغرفة تسليمًا مرئيًا صارمًا. يكون نص المساعد النهائي خاصًا. يجب على الوكيل استدعاء `message(action=send)` للنشر في الغرفة.

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

استخدم تكوين Discord لكل قناة عندما يجب أن تكون قناة واحدة فقط محيطة:

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

قوائم السماح لقنوات Slack تعتمد على المعرّف أولًا. استخدم معرّفات القنوات مثل `C12345678`، وليس `#channel-name`.

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

بالنسبة إلى مجموعات Telegram، يجب أن يكون البوت قادرًا على رؤية رسائل المجموعة العادية. إذا كان `requireMention: false`، فعطّل وضع خصوصية BotFather أو استخدم إعداد Telegram آخر يسلّم حركة المجموعة الكاملة إلى البوت.

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

عادة ما تكون معرّفات مجموعات Telegram أرقامًا سالبة مثل `-1001234567890`. اقرأ `chat.id` من `openclaw logs --follow`، أو أعد توجيه رسالة مجموعة إلى بوت مساعد للمعرّفات، أو افحص `getUpdates` في Bot API.

## سياسة خاصة بالوكيل

استخدم تجاوزًا للوكيل عندما يتشارك عدة وكلاء الغرفة نفسها لكن يجب أن يتعامل وكيل واحد فقط مع الأحاديث غير المذكورة كسياق محيط:

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

تكون القيمة الافتراضية لـ `messages.groupChat.visibleReplies` هي `"automatic"` لطلبات المستخدم العادية في المجموعات/القنوات. أبقِ هذه القيمة الافتراضية عندما تريد نشر نص المساعد النهائي بشكل مرئي دون الحاجة إلى استدعاء صريح لأداة الرسائل.

بالنسبة إلى الغرف المحيطة دائمة التشغيل، لا يزال `messages.groupChat.visibleReplies: "message_tool"` موصى به، خصوصًا مع النماذج الأحدث الموثوقة في استخدام الأدوات مثل GPT 5.5. فهو يتيح للوكيل أن يقرر متى يتكلم عبر استدعاء أداة الرسائل. إذا أعاد النموذج نصًا نهائيًا دون استدعاء الأداة، يحتفظ OpenClaw بذلك النص النهائي خاصًا ويسجل بيانات تعريف التسليم المكبوت.

تبقى أحداث الغرفة صارمة حتى عندما تستخدم طلبات المجموعة الأخرى ردودًا تلقائية. لا تزال أحداث الغرفة المحيطة غير المذكورة تتطلب `message(action=send)` للإخراج المرئي.

## السجل

يتحكم `messages.groupChat.historyLimit` في الإعداد الافتراضي العام لسجل المجموعة. يمكن للقنوات تجاوزه باستخدام `channels.<channel>.historyLimit`، كما تدعم بعض القنوات أيضًا حدود سجل لكل حساب.

اضبط `historyLimit: 0` لتعطيل سياق سجل المجموعة.

تحتفظ قنوات أحداث الغرفة المدعومة برسائل الغرفة المحيطة الحديثة كسياق. يحتفظ Telegram بنافذة متداولة دائمة التشغيل لكل مجموعة ومحدودة بـ `historyLimit`؛ تختار دورات طلب المستخدم الإدخالات بعد آخر رد مسجل للبوت، بينما تتلقى دورات أحداث الغرفة النافذة الحديثة الكاملة حتى يتمكن النموذج من رؤية منشوراته الحديثة. تتم إزالة مفتاح وضع Telegram المتقاعد `includeGroupHistoryContext` بواسطة `openclaw doctor --fix`.

## استكشاف الأخطاء وإصلاحها

إذا أظهرت الغرفة كتابة أو استخدامًا للرموز لكن دون رسالة مرئية:

1. تأكد من أن الغرفة مسموح بها عبر قائمة السماح للقنوات وقائمة السماح للمرسلين.
2. تأكد من تعيين `requireMention: false` على مستوى الغرفة الذي تتوقعه.
3. تحقق مما إذا كان `messages.groupChat.unmentionedInbound` أو تجاوز الوكيل هو `"room_event"`.
4. افحص السجلات بحثًا عن بيانات تعريف الحمولة النهائية المكبوتة أو `didSendViaMessagingTool: false`.
5. بالنسبة إلى طلبات المجموعة العادية، أبقِ أو استعد `messages.groupChat.visibleReplies: "automatic"` إذا كنت تريد نشر الردود النهائية تلقائيًا. بالنسبة إلى الغرف المحيطة التي تستخدم `message_tool`، استخدم نموذجًا/وقت تشغيل يستدعي الأدوات بموثوقية.

إذا لم تُشغّل غرف Telegram المحيطة أي شيء على الإطلاق، فتحقق من وضع خصوصية BotFather وتأكد من أن Gateway يتلقى رسائل المجموعة العادية.

إذا لم تُشغّل غرف Slack المحيطة، فتحقق من أن مفتاح القناة هو معرّف قناة Slack وأن التطبيق لديه نطاق `channels:history` أو `groups:history` المطلوب لذلك النوع من الغرف.

## ذات صلة

- [المجموعات](/ar/channels/groups)
- [Discord](/ar/channels/discord)
- [Slack](/ar/channels/slack)
- [Telegram](/ar/channels/telegram)
- [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting)
- [مرجع تكوين القنوات](/ar/gateway/config-channels)

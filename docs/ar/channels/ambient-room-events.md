---
read_when:
    - تهيئة غرف المجموعات أو القنوات الدائمة التشغيل
    - تريد من الوكيل متابعة محادثات الغرفة دون نشر النص النهائي تلقائيًا
    - تصحيح أخطاء مؤشر الكتابة واستخدام الرموز عند عدم ظهور رسالة في الغرفة
sidebarTitle: Ambient room events
summary: اسمح لغرف المجموعات المدعومة بتوفير سياق صامت ما لم يُرسل الوكيل باستخدام أداة الرسائل
title: أحداث الغرفة المحيطة
x-i18n:
    generated_at: "2026-07-12T05:32:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f144b44c8ae0a78e756d741c7b4685632862c0eb15531185ddeb0c2ba801e1a
    source_path: channels/ambient-room-events.md
    workflow: 16
---

تتيح أحداث الغرفة المحيطة لـ OpenClaw معالجة أحاديث المجموعات أو القنوات التي لا تتضمن إشارة إليه بوصفها سياقًا هادئًا. يستطيع الوكيل تحديث الذاكرة وحالة الجلسة، لكن الغرفة تظل صامتة ما لم يستدعِ الوكيل أداة `message` صراحةً.

للمحادثات الجماعية دائمة التشغيل، ادمج `messages.groupChat.unmentionedInbound: "room_event"` مع `messages.groupChat.visibleReplies: "message_tool"`. يستمع الوكيل، ويقرر متى يكون الرد مفيدًا، ولا يحتاج أبدًا إلى نمط المطالبة القديم المتمثل في الإجابة بـ `NO_REPLY`.

المدعوم حاليًا: قنوات خوادم Discord، وقنوات Slack العامة والخاصة، والرسائل المباشرة متعددة الأشخاص في Slack، ومجموعات Telegram أو مجموعاته الفائقة. تحتفظ القنوات الجماعية الأخرى بسلوكها الجماعي الحالي ما لم تذكر صفحة القناة أنها تدعم أحداث الغرفة المحيطة.

## الإعداد الموصى به

اضبط سلوك المحادثات الجماعية العام:

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

ثم اجعل الغرفة دائمة التشغيل بتعطيل اشتراط الإشارة إليها في تلك الغرفة. ويجب أن تظل الغرفة مستوفيةً لقواعد `groupPolicy` المعتادة وقائمة الغرف المسموح بها وقائمة المرسلين المسموح بهم.

بعد حفظ الإعداد، يطبّق Gateway إعدادات `messages` فوريًا. أعد التشغيل فقط عند تعطيل مراقبة الملفات أو إعادة تحميل الإعداد (`gateway.reload.mode: "off"`).

## ما الذي يتغير

مع `messages.groupChat.unmentionedInbound: "room_event"`:

- تصبح رسائل المجموعات أو القنوات المسموح بها التي لا تتضمن إشارة أحداثًا هادئة للغرفة
- تظل الرسائل التي تتضمن إشارة طلبات مستخدم
- تظل أوامر التحكم النصية والأوامر الأصلية طلبات مستخدم
- تظل طلبات الإلغاء أو الإيقاف طلبات مستخدم
- تظل الرسائل المباشرة طلبات مستخدم

تستخدم أحداث الغرفة تسليمًا مرئيًا صارمًا. يظل النص النهائي للمساعد خاصًا. ويجب على الوكيل استدعاء `message(action=send)` للنشر في الغرفة.

تظل مؤشرات الكتابة وتفاعلات حالة دورة الحياة معطلة لأحداث الغرفة. والاستثناء الصريح الوحيد لإشعار الاستلام هو `messages.ackReactionScope: "all"`، الذي يرسل تفاعل الإقرار المضبوط؛ استخدم أي نطاق أضيق أو `"off"` عندما يجب أن تظل الغرفة صامتة تمامًا.

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

استخدم إعداد Discord الخاص بكل قناة عندما ينبغي أن تكون قناة واحدة فقط محيطة. ضمن `groupPolicy: "allowlist"`، إدراج القناة هو ما يسمح بها (`enabled: false` يعطّل إدخالًا):

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
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

تعتمد قوائم قنوات Slack المسموح بها على المعرّفات أولًا. استخدم معرّفات القنوات مثل `C12345678`، وليس `#channel-name`. إدراج القناة ضمن `channels.slack.channels` هو ما يسمح بها (`enabled: false` يعطّل إدخالًا):

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
          requireMention: false,
        },
      },
    },
  },
}
```

## مثال Telegram

بالنسبة إلى مجموعات Telegram، يجب أن يتمكن الروبوت من رؤية رسائل المجموعة العادية. إذا كان `requireMention: false`، فعطّل وضع الخصوصية في BotFather أو استخدم إعدادًا آخر لـ Telegram يسلّم حركة رسائل المجموعة كاملةً إلى الروبوت.

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

عادةً ما تكون معرّفات مجموعات Telegram أرقامًا سالبة مثل `-1001234567890`. اقرأ `chat.id` من `openclaw logs --follow`، أو أعد توجيه رسالة جماعية إلى روبوت مساعد للمعرّفات، أو افحص `getUpdates` في Bot API.

## سياسة خاصة بالوكيل

استخدم تجاوزًا خاصًا بالوكيل عندما يتشارك عدة وكلاء الغرفة نفسها، ولكن ينبغي لوكيل واحد فقط معاملة الأحاديث التي لا تتضمن إشارة بوصفها سياقًا محيطًا:

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

تكون القيمة الافتراضية لـ `messages.groupChat.visibleReplies` هي `"automatic"` لطلبات المستخدم العادية في المجموعات أو القنوات. احتفظ بهذه القيمة الافتراضية عندما ينبغي نشر النص النهائي للمساعد بصورة مرئية دون استدعاء صريح لأداة الرسائل.

بالنسبة إلى الغرف المحيطة دائمة التشغيل، يظل `messages.groupChat.visibleReplies: "message_tool"` موصى به، خصوصًا مع نماذج الجيل الأحدث الموثوقة في استخدام الأدوات مثل GPT-5.6 Sol. فهو يتيح للوكيل تحديد متى يتحدث من خلال استدعاء أداة الرسائل. إذا أعاد النموذج نصًا نهائيًا دون استدعاء الأداة، يحتفظ OpenClaw بذلك النص النهائي بصورة خاصة ويسجل بيانات وصفية للتسليم المحجوب.

تظل أحداث الغرفة صارمة حتى عندما تستخدم طلبات المجموعة الأخرى الردود التلقائية. تتطلب أحداث الغرفة المحيطة التي لا تتضمن إشارة دائمًا `message(action=send)` للحصول على مخرجات مرئية.

## السجل

يضبط `messages.groupChat.historyLimit` القيمة العامة الافتراضية لسجل المجموعة (50 عند عدم ضبطه؛ ويجب أن يكون عددًا صحيحًا موجبًا). يمكن للقنوات تجاوزها باستخدام `channels.<channel>.historyLimit`، كما تدعم بعض القنوات حدودًا للسجل خاصة بكل حساب. اضبط `historyLimit: 0` على مستوى القناة لتعطيل سياق سجل المجموعة لتلك القناة.

تحتفظ القنوات التي تدعم أحداث الغرفة برسائل الغرفة المحيطة الحديثة بوصفها سياقًا. يحتفظ Telegram بنافذة متجددة دائمة التشغيل لكل مجموعة ومحدودة بـ `historyLimit`؛ تحدد دورات طلبات المستخدم الإدخالات اللاحقة لآخر رد مسجل للروبوت، بينما تتلقى دورات أحداث الغرفة النافذة الحديثة كاملةً كي يتمكن النموذج من رؤية منشوراته الحديثة. يزيل `openclaw doctor --fix` مفتاح الوضع المتقاعد `includeGroupHistoryContext` الخاص بـ Telegram.

## استكشاف الأخطاء وإصلاحها

إذا أظهرت الغرفة مؤشر الكتابة أو استخدام الرموز المميزة من دون رسالة مرئية:

1. تأكد من أن قائمة القنوات المسموح بها وقائمة المرسلين المسموح بهم تسمحان بالغرفة.
2. تأكد من ضبط `requireMention: false` على مستوى الغرفة المتوقع.
3. تحقق مما إذا كانت قيمة `messages.groupChat.unmentionedInbound` أو تجاوز الوكيل هي `"room_event"`.
4. افحص السجلات بحثًا عن البيانات الوصفية للحمولة النهائية المحجوبة أو `didSendViaMessagingTool: false`.
5. بالنسبة إلى طلبات المجموعة العادية، احتفظ بـ `messages.groupChat.visibleReplies: "automatic"` أو استعدها إذا أردت نشر الردود النهائية تلقائيًا. وبالنسبة إلى الغرف المحيطة التي تستخدم `message_tool`، استخدم نموذجًا أو بيئة تشغيل يستدعي الأدوات بموثوقية.

إذا لم تُشغّل غرف Telegram المحيطة إطلاقًا، فتحقق من وضع الخصوصية في BotFather وتأكد من أن Gateway يتلقى رسائل المجموعة العادية.

إذا لم تُشغّل غرف Slack المحيطة، فتأكد من أن مفتاح القناة هو معرّف قناة Slack وأن التطبيق يمتلك نطاق السجل لنوع الغرفة المعني: `channels:history` (عامة)، أو `groups:history` (خاصة)، أو `mpim:history` (رسائل مباشرة متعددة الأشخاص).

## ذات صلة

- [المجموعات](/ar/channels/groups)
- [Discord](/ar/channels/discord)
- [Slack](/ar/channels/slack)
- [Telegram](/ar/channels/telegram)
- [استكشاف أخطاء القنوات وإصلاحها](/ar/channels/troubleshooting)
- [مرجع إعداد القنوات](/ar/gateway/config-channels)

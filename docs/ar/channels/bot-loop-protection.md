---
read_when:
    - تهيئة رسائل القنوات التي ينشئها البوت
    - ضبط الحماية من حلقات التفاعل بين البوتات
sidebarTitle: Bot loop protection
summary: الإعدادات الافتراضية للحماية من حلقات التواصل بين البوتات وتجاوزات القنوات
title: الحماية من حلقات البوتات
x-i18n:
    generated_at: "2026-07-12T05:32:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08637267cd3422d3154315e709c85c85fa57641f1adb0e8ef10c32e8a7b73312
    source_path: channels/bot-loop-protection.md
    workflow: 16
---

يمكن لـ OpenClaw قبول الرسائل التي تكتبها روبوتات أخرى في القنوات التي تدعم `allowBots`. عند تفعيل هذا المسار، تمنع الحماية من الحلقات بين الأزواج هويتَي روبوت من الرد إحداهما على الأخرى إلى أجل غير مسمى.

يفرض مشغّل الردود الواردة الأساسي آلية الحماية. وتحوّل كل قناة داعمة حدثها الوارد إلى حقائق عامة: الحساب أو النطاق، ومعرّف المحادثة، ومعرّف الروبوت المرسِل، ومعرّف الروبوت المستقبِل. يتعقب النظام الأساسي زوج المشاركين في كلا الاتجاهين (يُعدّ الانتقال من A إلى B ومن B إلى A الزوج نفسه)، ويطبّق حدًا ضمن نافذة منزلقة، ويمنع الزوج مؤقتًا خلال فترة تهدئة بعد تجاوز الحد.

## الإعدادات الافتراضية

تكون الحماية من الحلقات بين الأزواج نشطة كلما سمحت قناة للرسائل التي تنشئها الروبوتات بالوصول إلى التوجيه. الإعدادات الافتراضية المضمّنة:

| المفتاح              | القيمة الافتراضية | المعنى                                              |
| -------------------- | ------------------ | --------------------------------------------------- |
| `enabled`            | `true`             | تكون آلية الحماية نشطة للقنوات التي تدعمها.         |
| `maxEventsPerWindow` | `20`               | الأحداث التي يمكن لزوج روبوتات تبادلها ضمن النافذة. |
| `windowSeconds`      | `60`               | مدة النافذة المنزلقة.                               |
| `cooldownSeconds`    | `60`               | مدة المنع بعد تجاوز الزوج الحد.                     |

لا تؤثر آلية الحماية في الرسائل التي يكتبها البشر، أو عمليات النشر ذات الروبوت الواحد، أو تصفية الرسائل الذاتية، أو ردود الروبوتات التي تبقى دون الحد.

## تهيئة الإعدادات الافتراضية المشتركة

عيّن `channels.defaults.botLoopProtection` مرة واحدة لمنح كل قناة داعمة خط الأساس نفسه. ويمكن لتجاوزات القناة والحساب والغرفة مواصلة ضبط الأسطح الفردية.

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
  },
}
```

لا تعيّن `enabled: false` إلا عندما تسمح سياسة قناتك عمدًا بالمحادثات بين الروبوتات من دون منع تلقائي.

## التجاوز حسب القناة أو الحساب أو الغرفة

تضع القنوات الداعمة إعداداتها فوق الإعداد الافتراضي المشترك، مفتاحًا تلو الآخر. ترتيب الأولوية، بدءًا من الأضيق نطاقًا:

1. `channels.<channel>.<room-or-space>.botLoopProtection`، عندما تدعم القناة التجاوزات لكل محادثة
2. `channels.<channel>.accounts.<account>.botLoopProtection`، عندما تدعم القناة الحسابات
3. `channels.<channel>.botLoopProtection`، عندما تدعم القناة الإعدادات الافتراضية العليا
4. `channels.defaults.botLoopProtection`
5. الإعدادات الافتراضية المضمّنة

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
      },
    },
    discord: {
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
      accounts: {
        secondary: {
          allowBots: "mentions",
          botLoopProtection: {
            maxEventsPerWindow: 5,
            cooldownSeconds: 90,
          },
        },
      },
    },
    googlechat: {
      allowBots: true,
      groups: {
        "spaces/AAAA": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
    matrix: {
      allowBots: "mentions",
      groups: {
        "!roomid:example.org": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
    slack: {
      allowBots: "mentions",
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
    },
  },
}
```

## دعم القنوات

- Discord: حقائق `author.bot` الأصلية، مفهرسة حسب حساب Discord والقناة وزوج الروبوتات.
- Google Chat: حقائق `sender.type=BOT` الأصلية للرسائل المقبولة التي كتبتها الروبوتات، مفهرسة حسب الحساب والمساحة وزوج الروبوتات.
- Matrix: حسابات روبوتات Matrix المهيأة، مفهرسة حسب حساب Matrix والغرفة وزوج الروبوتات المهيأ.
- Slack: حقائق `bot_id` الأصلية للرسائل المقبولة التي كتبتها الروبوتات، مفهرسة حسب حساب Slack والقناة وزوج الروبوتات.

تواصل القنوات التي لا تعرض هوية موثوقة للروبوت الوارد استخدام مرشحاتها المعتادة للرسائل الذاتية وسياسة الوصول. وينبغي ألا تشترك في آلية الحماية هذه حتى تتمكن من تحديد كلا المشاركين في زوج الروبوتات.

راجع [وقت تشغيل SDK](/ar/plugins/sdk-runtime#reusable-runtime-utilities) للاطلاع على تفاصيل تنفيذ Plugin.

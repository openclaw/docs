---
read_when:
    - تريد ربط OpenClaw بقنوات IRC أو الرسائل المباشرة
    - أنت تُعِدّ قوائم السماح لـ IRC أو سياسة المجموعات أو تقييد الإشارات.
summary: إعداد Plugin ‏IRC، وضوابط الوصول، واستكشاف الأخطاء وإصلاحها
title: IRC
x-i18n:
    generated_at: "2026-07-12T05:33:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23e288f18a57a3ee74a433feb1ffb7dda0480f998cf74d4ec825bd7f3c0745c5
    source_path: channels/irc.md
    workflow: 16
---

استخدم IRC عندما تريد تشغيل OpenClaw في القنوات التقليدية (`#room`) والرسائل المباشرة.
ثبّت Plugin الرسمي لـ IRC، ثم اضبطه ضمن `channels.irc`.

## البدء السريع

1. ثبّت Plugin:

```bash
openclaw plugins install @openclaw/irc
```

2. عيّن على الأقل المضيف والاسم المستعار والقنوات المطلوب الانضمام إليها في `~/.openclaw/openclaw.json`:

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.example.com",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

3. شغّل Gateway أو أعد تشغيله:

```bash
openclaw gateway run
```

يُفضّل استخدام خادم IRC خاص لتنسيق عمل الروبوتات. إذا كنت تستخدم شبكة IRC عامة عن قصد، فمن الخيارات الشائعة Libera.Chat وOFTC وSnoonet. تجنّب القنوات العامة التي يسهل توقّعها لحركة اتصالات القناة الخلفية للروبوتات أو الأسراب.

## إعدادات الاتصال

| المفتاح                       | القيمة الافتراضية             | الملاحظات                                                   |
| ----------------------------- | ----------------------------- | ----------------------------------------------------------- |
| `host`                        | لا توجد (مطلوبة)              | اسم مضيف خادم IRC                                           |
| `port`                        | `6697` مع TLS، و`6667` بدونه  | 1-65535                                                     |
| `tls`                         | `true`                        | اضبطه على `false` فقط عند استخدام نص صريح عن قصد            |
| `nick`                        | لا توجد (مطلوبة)              | الاسم المستعار للروبوت                                      |
| `username`                    | الاسم المستعار، وإلا `openclaw` | اسم مستخدم IRC                                            |
| `realname`                    | `OpenClaw`                    | حقل الاسم الحقيقي/GECOS                                     |
| `password` / `passwordFile`   | لا توجد                       | كلمة مرور الخادم؛ يجب أن يكون الملف ملفًا عاديًا            |
| `channels`                    | لا توجد                       | القنوات المطلوب الانضمام إليها (`["#openclaw"]`)            |
| `accounts` / `defaultAccount` | لا توجد                       | إعداد حسابات متعددة؛ تملأ متغيرات البيئة الحساب الافتراضي فقط |

## إعدادات الأمان الافتراضية

- يستخدم IRC مقابس TCP/TLS خام خارج توجيه الوكيل الأمامي الذي يديره مشغّل OpenClaw. في عمليات النشر التي تشترط مرور كل حركة الخروج عبر ذلك الوكيل الأمامي، اضبط `channels.irc.enabled=false` ما لم تُعتمد حركة خروج IRC المباشرة صراحةً.
- تكون القيمة الافتراضية لـ `channels.irc.dmPolicy` هي `"pairing"`: يحصل مرسلو الرسائل المباشرة غير المعروفين على رمز إقران توافق عليه باستخدام `openclaw pairing approve irc <code>`.
- تكون القيمة الافتراضية لـ `channels.irc.groupPolicy` هي `"allowlist"`.
- عند استخدام `groupPolicy="allowlist"`، اضبط `channels.irc.groups` لتعريف القنوات المسموح بها.
- استخدم TLS (`channels.irc.tls=true`) ما لم تكن تقبل النقل بنص صريح عن قصد.

## التحكم في الوصول

توجد «بوابتان» منفصلتان لقنوات IRC:

1. **الوصول إلى القناة** (`groupPolicy` + `groups`): ما إذا كان الروبوت يقبل الرسائل من قناة ما أساسًا.
2. **وصول المرسل** (`groupAllowFrom` / ‏`groups["#channel"].allowFrom` لكل قناة): من يُسمح له بتشغيل الروبوت داخل تلك القناة.

مفاتيح الإعداد:

- قائمة السماح للرسائل المباشرة (وصول مرسل الرسائل المباشرة): `channels.irc.allowFrom`
- قائمة سماح مرسلي المجموعة (وصول مرسل القناة): `channels.irc.groupAllowFrom`
- عناصر التحكم لكل قناة (القناة + المرسل + قواعد الإشارة): `channels.irc.groups["#channel"]` مع `requireMention` و`allowFrom` و`enabled` و`tools` و`toolsBySender` و`skills` و`systemPrompt`
- يسمح `channels.irc.groupPolicy="open"` بالقنوات غير المضبوطة (**مع استمرار اشتراط الإشارة افتراضيًا**)

يجب أن تستخدم إدخالات قائمة السماح هويات مرسل ثابتة (`nick!user@host`).
يمكن تغيير المطابقة بالاسم المستعار وحده، ولا تُفعّل إلا عندما تكون `channels.irc.dangerouslyAllowNameMatching: true`.

### خطأ شائع: `allowFrom` للرسائل المباشرة وليس للقنوات

إذا رأيت سجلات مثل:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...فهذا يعني أن المرسل لم يكن مسموحًا له بإرسال رسائل **المجموعة/القناة**. أصلح ذلك بإحدى الطريقتين:

- ضبط `channels.irc.groupAllowFrom` (عام لجميع القنوات)، أو
- ضبط قوائم سماح المرسلين لكل قناة: `channels.irc.groups["#channel"].allowFrom`

مثال (السماح لأي شخص في `#openclaw` بالتحدث إلى الروبوت):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#openclaw": { allowFrom: ["*"] },
      },
    },
  },
}
```

## تشغيل الردود (الإشارات)

حتى إذا كانت القناة مسموحًا بها (عبر `groupPolicy` + `groups`) وكان المرسل مسموحًا له، يشترط OpenClaw افتراضيًا **الإشارة** في سياقات المجموعات. يُعدّ الروبوت مُشارًا إليه عندما تحتوي الرسالة على الاسم المستعار المتصل للروبوت أو تطابق أنماط الإشارة المضبوطة لديك.

يعني ذلك أنك قد ترى سجلات مثل `drop channel … (missing-mention)` ما لم تتضمن الرسالة نمط إشارة يطابق الروبوت.

لجعل الروبوت يرد في قناة IRC **من دون الحاجة إلى إشارة**، عطّل اشتراط الإشارة لتلك القناة:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#openclaw": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

أو للسماح **بجميع** قنوات IRC (من دون قائمة سماح لكل قناة) مع الاستمرار في الرد من دون إشارات:

```json5
{
  channels: {
    ir: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## ملاحظة أمنية (موصى بها للقنوات العامة)

إذا سمحت بـ `allowFrom: ["*"]` في قناة عامة، فيمكن لأي شخص توجيه مطالبات إلى الروبوت.
لتقليل المخاطر، قيّد الأدوات لتلك القناة.

### الأدوات نفسها لجميع الموجودين في القناة

```json5
{
  channels: {
    irc: {
      groups: {
        "#openclaw": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### أدوات مختلفة لكل مرسل (يحصل المالك على صلاحيات أكبر)

استخدم `toolsBySender` لتطبيق سياسة أكثر صرامة على `"*"` وسياسة أكثر تساهلًا على اسمك المستعار:

```json5
{
  channels: {
    irc: {
      groups: {
        "#openclaw": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:alice": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

ملاحظات:

- يجب أن تستخدم مفاتيح `toolsBySender` بادئات صريحة (`channel:` و`id:` و`e164:` و`username:` و`name:`). بالنسبة إلى IRC، استخدم `id:` مع قيمة هوية المرسل: `id:alice` أو `id:alice!~alice@203.0.113.7` لمطابقة أقوى.
- ما تزال المفاتيح القديمة بلا بادئات مقبولة، وتُطابق بوصفها `id:` فقط، وتصدر تحذير إيقاف تدريجي.
- تسود أول سياسة مرسل مطابقة؛ وتكون `"*"` هي الخيار الاحتياطي لحرف البدل.

لمزيد من المعلومات حول الوصول إلى المجموعات مقارنةً باشتراط الإشارة (وكيفية تفاعلهما)، راجع: [/channels/groups](/ar/channels/groups).

## NickServ

للتعريف لدى NickServ بعد الاتصال:

```json5
{
  channels: {
    irc: {
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "your-nickserv-password",
      },
    },
  },
}
```

يُنفّذ تعريف NickServ افتراضيًا كلما عُيّنت كلمة مرور (لا يلزم ضبط `enabled` على `false` إلا لإلغاء الاشتراك). تكون القيمة الافتراضية لـ `service` هي `NickServ`؛ ويُعد `passwordFile` بديلًا عن `password` المضمّنة.

تسجيل اختياري لمرة واحدة عند الاتصال (يتطلب `register: true` وجود `registerEmail`):

```json5
{
  channels: {
    irc: {
      nickserv: {
        register: true,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

عطّل `register` بعد تسجيل الاسم المستعار لتجنب محاولات REGISTER المتكررة.

## متغيرات البيئة

يدعم الحساب الافتراضي:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (مفصولة بفواصل)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

لا يمكن ضبط `IRC_HOST` من ملف `.env` لمساحة عمل؛ راجع [ملفات `.env` لمساحة العمل](/ar/gateway/security).

## استكشاف الأخطاء وإصلاحها

- إذا اتصل الروبوت لكنه لم يرد مطلقًا في القنوات، فتحقق من `channels.irc.groups` **ومن** احتمال إسقاط الرسائل بسبب اشتراط الإشارة (`missing-mention`). إذا أردته أن يرد من دون تنبيهات، فاضبط `requireMention:false` للقناة.
- إذا فشل تسجيل الدخول، فتحقق من توفر الاسم المستعار وكلمة مرور الخادم.
- إذا فشل TLS على شبكة مخصصة، فتحقق من إعدادات المضيف والمنفذ والشهادة.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الإقران](/ar/channels/pairing) — مصادقة الرسائل المباشرة ومسار الإقران
- [المجموعات](/ar/channels/groups) — سلوك المحادثات الجماعية واشتراط الإشارة
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه جلسات الرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتحصين

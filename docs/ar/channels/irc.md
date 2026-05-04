---
read_when:
    - تريد توصيل OpenClaw بقنوات IRC أو الرسائل المباشرة
    - أنت تقوم بتكوين قوائم السماح لـ IRC أو سياسة المجموعة أو تقييد الإشارات
summary: إعداد Plugin IRC، وضوابط الوصول، واستكشاف الأخطاء وإصلاحها
title: IRC
x-i18n:
    generated_at: "2026-05-04T02:21:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43c3098fe49a5e7405443df73e1bf752a579460dc0b2070c3d07f43b512bb555
    source_path: channels/irc.md
    workflow: 16
---

استخدم IRC عندما تريد OpenClaw في القنوات الكلاسيكية (`#room`) والرسائل المباشرة.
يأتي IRC كـ Plugin مضمّن، لكنه يُضبط في الإعداد الرئيسي ضمن `channels.irc`.

## البدء السريع

1. فعّل إعداد IRC في `~/.openclaw/openclaw.json`.
2. اضبط على الأقل:

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

فضّل خادم IRC خاصًا لتنسيق البوتات. إذا استخدمت شبكة IRC عامة عمدًا، فمن الخيارات الشائعة Libera.Chat وOFTC وSnoonet. تجنب القنوات العامة المتوقعة لحركة قناة الاتصال الخلفية للبوت أو السرب.

3. ابدأ/أعد تشغيل Gateway:

```bash
openclaw gateway run
```

## الإعدادات الأمنية الافتراضية

- يستخدم IRC مقابس TCP/TLS خامًا خارج توجيه الوكيل الأمامي المُدار من مشغّل OpenClaw. في عمليات النشر التي تتطلب مرور كل حركة الخروج عبر ذلك الوكيل الأمامي، اضبط `channels.irc.enabled=false` ما لم تتم الموافقة صراحةً على خروج IRC المباشر.
- القيمة الافتراضية لـ `channels.irc.dmPolicy` هي `"pairing"`.
- القيمة الافتراضية لـ `channels.irc.groupPolicy` هي `"allowlist"`.
- مع `groupPolicy="allowlist"`، اضبط `channels.irc.groups` لتعريف القنوات المسموح بها.
- استخدم TLS (`channels.irc.tls=true`) ما لم تكن تقبل عمدًا النقل بنص صريح.

## التحكم في الوصول

هناك «بوابتان» منفصلتان لقنوات IRC:

1. **وصول القناة** (`groupPolicy` + `groups`): ما إذا كان البوت يقبل الرسائل من قناة أصلًا.
2. **وصول المرسل** (`groupAllowFrom` / لكل قناة `groups["#channel"].allowFrom`): من يُسمح له بتشغيل البوت داخل تلك القناة.

مفاتيح الإعداد:

- قائمة السماح للرسائل المباشرة (وصول مرسل الرسائل المباشرة): `channels.irc.allowFrom`
- قائمة السماح لمرسلي المجموعة (وصول مرسل القناة): `channels.irc.groupAllowFrom`
- عناصر التحكم لكل قناة (القناة + المرسل + قواعد الإشارة): `channels.irc.groups["#channel"]`
- يسمح `channels.irc.groupPolicy="open"` بالقنوات غير المضبوطة (**مع بقاءها مقيّدة بالإشارة افتراضيًا**)

ينبغي أن تستخدم إدخالات قائمة السماح هويات مرسلين ثابتة (`nick!user@host`).
مطابقة الاسم المستعار فقط قابلة للتغير ولا تُفعّل إلا عند ضبط `channels.irc.dangerouslyAllowNameMatching: true`.

### خطأ شائع: `allowFrom` مخصص للرسائل المباشرة، لا للقنوات

إذا رأيت سجلات مثل:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

…فهذا يعني أن المرسل لم يكن مسموحًا له في رسائل **المجموعة/القناة**. أصلح ذلك بأحد الخيارين:

- ضبط `channels.irc.groupAllowFrom` (عام لكل القنوات)، أو
- ضبط قوائم سماح المرسلين لكل قناة: `channels.irc.groups["#channel"].allowFrom`

مثال (السماح لأي شخص في `#tuirc-dev` بالتحدث إلى البوت):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## تشغيل الرد (الإشارات)

حتى إذا كانت القناة مسموحًا بها (عبر `groupPolicy` + `groups`) وكان المرسل مسموحًا به، فإن OpenClaw يضبط افتراضيًا **التقييد بالإشارة** في سياقات المجموعات.

وهذا يعني أنك قد ترى سجلات مثل `drop channel … (missing-mention)` ما لم تتضمن الرسالة نمط إشارة يطابق البوت.

لجعل البوت يرد في قناة IRC **من دون الحاجة إلى إشارة**، عطّل التقييد بالإشارة لتلك القناة:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

أو للسماح **بكل** قنوات IRC (من دون قائمة سماح لكل قناة) مع الاستمرار في الرد من دون إشارات:

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## ملاحظة أمنية (موصى بها للقنوات العامة)

إذا سمحت بـ `allowFrom: ["*"]` في قناة عامة، فيمكن لأي شخص مطالبة البوت.
لتقليل المخاطر، قيّد الأدوات لتلك القناة.

### الأدوات نفسها لكل شخص في القناة

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
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

استخدم `toolsBySender` لتطبيق سياسة أكثر صرامة على `"*"` وسياسة أخف على اسمك المستعار:

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
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

- ينبغي أن تستخدم مفاتيح `toolsBySender` البادئة `id:` لقيم هوية مرسل IRC:
  `id:eigen` أو `id:eigen!~eigen@174.127.248.171` لمطابقة أقوى.
- لا تزال المفاتيح القديمة غير المسبوقة مقبولة وتُطابق كـ `id:` فقط.
- أول سياسة مرسل مطابقة هي التي تُطبّق؛ `"*"` هي بديل البدل.

لمزيد من المعلومات حول وصول المجموعات مقارنةً بالتقييد بالإشارة (وكيفية تفاعلهما)، راجع: [/channels/groups](/ar/channels/groups).

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

تسجيل اختياري لمرة واحدة عند الاتصال:

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

لا يمكن ضبط `IRC_HOST` من ملف `.env` لمساحة العمل؛ راجع [ملفات `.env` لمساحة العمل](/ar/gateway/security).

## استكشاف الأخطاء وإصلاحها

- إذا اتصل البوت لكنه لا يرد أبدًا في القنوات، فتحقق من `channels.irc.groups` **وكذلك** مما إذا كان التقييد بالإشارة يُسقط الرسائل (`missing-mention`). إذا أردته أن يرد من دون إشارات تنبيه، فاضبط `requireMention:false` للقناة.
- إذا فشل تسجيل الدخول، فتحقق من توفر الاسم المستعار وكلمة مرور الخادم.
- إذا فشل TLS على شبكة مخصصة، فتحقق من المضيف/المنفذ وإعداد الشهادة.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — كل القنوات المدعومة
- [الإقران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الإقران
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعات والتقييد بالإشارة
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية

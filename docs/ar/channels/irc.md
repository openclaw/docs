---
read_when:
    - تريد ربط OpenClaw بقنوات IRC أو الرسائل المباشرة
    - أنت تقوم بتكوين قوائم السماح لـ IRC أو سياسة المجموعة أو تقييد الإشارات
summary: إعداد Plugin IRC وضوابط الوصول واستكشاف الأخطاء وإصلاحها
title: IRC
x-i18n:
    generated_at: "2026-06-27T17:10:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7182796ff92f98bd1e6c24cbd456dd1037fa304e3fca4eee13f62eea8cd946f6
    source_path: channels/irc.md
    workflow: 16
---

استخدم IRC عندما تريد تشغيل OpenClaw في القنوات التقليدية (`#room`) والرسائل المباشرة.
ثبّت Plugin IRC الرسمي، ثم اضبطه ضمن `channels.irc`.

## البدء السريع

1. ثبّت Plugin:

```bash
openclaw plugins install @openclaw/irc
```

2. فعّل إعدادات IRC في `~/.openclaw/openclaw.json`.
3. اضبط على الأقل:

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

فضّل خادم IRC خاصًا لتنسيق البوتات. إذا كنت تستخدم شبكة IRC عامة عن قصد، فمن الخيارات الشائعة Libera.Chat وOFTC وSnoonet. تجنّب القنوات العامة سهلة التوقع لحركة البوت أو قناة الاتصال الخلفية للسرب.

4. ابدأ/أعد تشغيل Gateway:

```bash
openclaw gateway run
```

## الإعدادات الأمنية الافتراضية

- يستخدم IRC مآخذ TCP/TLS خامًا خارج توجيه وكيل التمرير الأمامي المُدار بواسطة مشغّل OpenClaw. في عمليات النشر التي تتطلب مرور كل الخروج عبر وكيل التمرير الأمامي هذا، اضبط `channels.irc.enabled=false` ما لم تتم الموافقة صراحةً على خروج IRC المباشر.
- القيمة الافتراضية لـ `channels.irc.dmPolicy` هي `"pairing"`.
- القيمة الافتراضية لـ `channels.irc.groupPolicy` هي `"allowlist"`.
- مع `groupPolicy="allowlist"`، اضبط `channels.irc.groups` لتعريف القنوات المسموح بها.
- استخدم TLS (`channels.irc.tls=true`) ما لم تكن تقبل النقل بنص صريح عن قصد.

## التحكم في الوصول

توجد «بوابتان» منفصلتان لقنوات IRC:

1. **الوصول إلى القناة** (`groupPolicy` + `groups`): ما إذا كان البوت يقبل الرسائل من قناة أصلًا.
2. **وصول المرسل** (`groupAllowFrom` / لكل قناة `groups["#channel"].allowFrom`): من يُسمح له بتشغيل البوت داخل تلك القناة.

مفاتيح الإعدادات:

- قائمة السماح للرسائل المباشرة (وصول مرسل الرسائل المباشرة): `channels.irc.allowFrom`
- قائمة السماح لمرسلي المجموعة (وصول مرسل القناة): `channels.irc.groupAllowFrom`
- عناصر التحكم لكل قناة (قواعد القناة + المرسل + الإشارة): `channels.irc.groups["#channel"]`
- يسمح `channels.irc.groupPolicy="open"` بالقنوات غير المضبوطة (**مع استمرار اشتراط الإشارة افتراضيًا**)

يجب أن تستخدم إدخالات قائمة السماح هويات مرسلين مستقرة (`nick!user@host`).
مطابقة الاسم المستعار وحده قابلة للتغير ولا تُفعّل إلا عند `channels.irc.dangerouslyAllowNameMatching: true`.

### خطأ شائع: `allowFrom` مخصص للرسائل المباشرة، وليس للقنوات

إذا رأيت سجلات مثل:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...فهذا يعني أن المرسل لم يكن مسموحًا له برسائل **المجموعة/القناة**. أصلح ذلك عبر أحد الخيارين:

- ضبط `channels.irc.groupAllowFrom` (عام لكل القنوات)، أو
- ضبط قوائم السماح للمرسلين لكل قناة: `channels.irc.groups["#channel"].allowFrom`

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

## تشغيل الردود (الإشارات)

حتى إذا كانت القناة مسموحًا بها (عبر `groupPolicy` + `groups`) وكان المرسل مسموحًا له، يعتمد OpenClaw افتراضيًا على **بوابة الإشارة** في سياقات المجموعات.

يعني ذلك أنك قد ترى سجلات مثل `drop channel … (missing-mention)` ما لم تتضمن الرسالة نمط إشارة يطابق البوت.

لجعل البوت يرد في قناة IRC **دون الحاجة إلى إشارة**، عطّل بوابة الإشارة لتلك القناة:

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

أو للسماح **بكل** قنوات IRC (دون قائمة سماح لكل قناة) مع الاستمرار في الرد دون إشارات:

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

إذا سمحت بـ `allowFrom: ["*"]` في قناة عامة، يمكن لأي شخص توجيه مطالبات إلى البوت.
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

- يجب أن تستخدم مفاتيح `toolsBySender` البادئة `id:` لقيم هوية مرسل IRC:
  `id:eigen` أو `id:eigen!~eigen@174.127.248.171` لمطابقة أقوى.
- لا تزال المفاتيح القديمة دون بادئة مقبولة وتُطابق على أنها `id:` فقط.
- أول سياسة مرسل مطابقة هي التي تفوز؛ ويمثل `"*"` خيار الرجوع الشامل.

لمزيد من المعلومات حول وصول المجموعات مقابل بوابة الإشارة (وكيفية تفاعلهما)، راجع: [/channels/groups](/ar/channels/groups).

## NickServ

للتعريف عبر NickServ بعد الاتصال:

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

عطّل `register` بعد تسجيل الاسم المستعار لتجنّب محاولات REGISTER المتكررة.

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

لا يمكن ضبط `IRC_HOST` من ملف `.env` في مساحة العمل؛ راجع [ملفات `.env` لمساحة العمل](/ar/gateway/security).

## استكشاف الأخطاء وإصلاحها

- إذا اتصل البوت لكنه لا يرد أبدًا في القنوات، فتحقق من `channels.irc.groups` **وكذلك** مما إذا كانت بوابة الإشارة تُسقط الرسائل (`missing-mention`). إذا كنت تريده أن يرد دون تنبيهات، فاضبط `requireMention:false` للقناة.
- إذا فشل تسجيل الدخول، فتحقق من توفر الاسم المستعار وكلمة مرور الخادم.
- إذا فشل TLS على شبكة مخصصة، فتحقق من المضيف/المنفذ وإعداد الشهادة.

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — كل القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل المباشرة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك دردشة المجموعات وبوابة الإشارة
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية

---
read_when:
    - تريد أن يتلقى OpenClaw الرسائل المباشرة عبر Nostr
    - أنت تُعدّ المراسلة اللامركزية
summary: قناة الرسائل المباشرة في Nostr عبر رسائل NIP-04 المشفرة
title: Nostr
x-i18n:
    generated_at: "2026-04-30T07:42:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 545d68077c9fe81d5fa5a17262d37e3688185a1fb12d67b8b1053b27b96c3c7f
    source_path: channels/nostr.md
    workflow: 16
---

**الحالة:** Plugin مضمّن اختياري (معطّل افتراضيًا حتى تتم تهيئته).

Nostr هو بروتوكول لامركزي للشبكات الاجتماعية. تتيح هذه القناة لـ OpenClaw تلقي الرسائل المباشرة المشفرة (DMs) والرد عليها عبر NIP-04.

## Plugin مضمّن

توفّر إصدارات OpenClaw الحالية Nostr بوصفه Plugin مضمّنًا، لذلك لا تحتاج الإصدارات المعبّأة العادية إلى تثبيت منفصل.

### عمليات التثبيت الأقدم/المخصصة

- ما زال الإعداد الأولي (`openclaw onboard`) و`openclaw channels add` يعرضان Nostr من كتالوج القنوات المشترك.
- إذا كان بناؤك يستبعد Nostr المضمّن، فثبّت حزمة npm حالية عند نشرها.

```bash
openclaw plugins install @openclaw/nostr
```

إذا أبلغ npm أن الحزمة المملوكة لـ OpenClaw مهملة، فاستخدم بناء OpenClaw معبّأًا حاليًا أو نسخة محلية حتى تُنشر حزمة npm أحدث.

استخدم نسخة محلية (تدفقات عمل التطوير):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

أعد تشغيل Gateway بعد تثبيت Plugins أو تمكينها.

### إعداد غير تفاعلي

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

استخدم `--use-env` لإبقاء `NOSTR_PRIVATE_KEY` في البيئة بدلًا من تخزين المفتاح في الإعدادات.

## إعداد سريع

1. أنشئ زوج مفاتيح Nostr (إذا لزم الأمر):

```bash
# Using nak
nak key generate
```

2. أضفه إلى الإعدادات:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
    },
  },
}
```

3. صدّر المفتاح:

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. أعد تشغيل Gateway.

## مرجع الإعدادات

| المفتاح     | النوع    | الافتراضي                                  | الوصف                              |
| ------------ | -------- | ------------------------------------------- | ----------------------------------- |
| `privateKey` | string   | مطلوب                                      | مفتاح خاص بتنسيق `nsec` أو hex |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | عناوين ترحيل URL (WebSocket)              |
| `dmPolicy`   | string   | `pairing`                                   | سياسة وصول DM                    |
| `allowFrom`  | string[] | `[]`                                        | مفاتيح pubkeys للمرسلين المسموح لهم              |
| `enabled`    | boolean  | `true`                                      | تمكين/تعطيل القناة              |
| `name`       | string   | -                                           | اسم العرض                        |
| `profile`    | object   | -                                           | بيانات تعريف ملف NIP-01 الشخصي             |

## بيانات تعريف الملف الشخصي

تُنشر بيانات الملف الشخصي كحدث NIP-01 `kind:0`. يمكنك إدارتها من Control UI (Channels -> Nostr -> Profile) أو ضبطها مباشرة في الإعدادات.

مثال:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Personal assistant DM bot",
        picture: "https://example.com/avatar.png",
        banner: "https://example.com/banner.png",
        website: "https://example.com",
        nip05: "openclaw@example.com",
        lud16: "openclaw@example.com",
      },
    },
  },
}
```

ملاحظات:

- يجب أن تستخدم عناوين URL للملف الشخصي `https://`.
- يؤدي الاستيراد من المرحلات إلى دمج الحقول والحفاظ على التجاوزات المحلية.

## التحكم في الوصول

### سياسات DM

- **pairing** (الافتراضي): يحصل المرسلون غير المعروفين على رمز إقران.
- **allowlist**: يمكن فقط للمفاتيح pubkeys الموجودة في `allowFrom` إرسال DM.
- **open**: رسائل DM واردة عامة (يتطلب `allowFrom: ["*"]`).
- **disabled**: تجاهل رسائل DM الواردة.

ملاحظات الإنفاذ:

- يتم التحقق من توقيعات الأحداث الواردة قبل سياسة المرسل وفك تشفير NIP-04، لذلك تُرفض الأحداث المزوّرة مبكرًا.
- تُرسل ردود الإقران من دون معالجة نص DM الأصلي.
- تُقيّد رسائل DM الواردة بمعدل محدد، وتُسقط الحمولات كبيرة الحجم قبل فك التشفير.

### مثال على allowlist

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      dmPolicy: "allowlist",
      allowFrom: ["npub1abc...", "npub1xyz..."],
    },
  },
}
```

## تنسيقات المفاتيح

التنسيقات المقبولة:

- **المفتاح الخاص:** `nsec...` أو hex بطول 64 حرفًا
- **Pubkeys (`allowFrom`):** `npub...` أو hex

## المرحلات

الافتراضيات: `relay.damus.io` و`nos.lol`.

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["wss://relay.damus.io", "wss://relay.primal.net", "wss://nostr.wine"],
    },
  },
}
```

نصائح:

- استخدم 2-3 مرحلات للتكرار الاحتياطي.
- تجنّب استخدام عدد كبير جدًا من المرحلات (زمن الانتقال، التكرار).
- يمكن للمرحلات المدفوعة تحسين الاعتمادية.
- المرحلات المحلية مناسبة للاختبار (`ws://localhost:7777`).

## دعم البروتوكول

| NIP    | الحالة    | الوصف                           |
| ------ | --------- | ------------------------------------- |
| NIP-01 | مدعوم | تنسيق الحدث الأساسي + بيانات تعريف الملف الشخصي |
| NIP-04 | مدعوم | رسائل DM مشفرة (`kind:4`)              |
| NIP-17 | مخطط له   | رسائل DM مغلفة كهدية                      |
| NIP-44 | مخطط له   | تشفير بإصدارات                  |

## الاختبار

### مرحّل محلي

```bash
# Start strfry
docker run -p 7777:7777 ghcr.io/hoytech/strfry
```

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["ws://localhost:7777"],
    },
  },
}
```

### اختبار يدوي

1. دوّن pubkey الخاص بالبوت (npub) من السجلات.
2. افتح عميل Nostr (Damus، Amethyst، إلخ).
3. أرسل DM إلى pubkey الخاص بالبوت.
4. تحقق من الاستجابة.

## استكشاف الأخطاء وإصلاحها

### عدم تلقي الرسائل

- تحقق من أن المفتاح الخاص صالح.
- تأكد من أن عناوين URL للمرحلات قابلة للوصول وتستخدم `wss://` (أو `ws://` للمحلي).
- تأكد من أن `enabled` ليست `false`.
- افحص سجلات Gateway بحثًا عن أخطاء الاتصال بالمرحلات.

### عدم إرسال الاستجابات

- تحقق من أن المرحّل يقبل عمليات الكتابة.
- تحقق من الاتصال الصادر.
- راقب حدود معدل المرحّل.

### استجابات مكررة

- هذا متوقع عند استخدام مرحلات متعددة.
- تُزال الرسائل المكررة حسب معرّف الحدث؛ ولا يؤدي إلا التسليم الأول إلى تشغيل استجابة.

## الأمان

- لا تلتزم أبدًا بالمفاتيح الخاصة.
- استخدم متغيرات البيئة للمفاتيح.
- فكّر في `allowlist` لبوتات الإنتاج.
- يتم التحقق من التوقيعات قبل سياسة المرسل، وتُنفّذ سياسة المرسل قبل فك التشفير، لذلك تُرفض الأحداث المزوّرة مبكرًا ولا يستطيع المرسلون غير المعروفين فرض عمل تشفير كامل.

## القيود (MVP)

- الرسائل المباشرة فقط (لا توجد محادثات جماعية).
- لا توجد مرفقات وسائط.
- NIP-04 فقط (تغليف NIP-17 كهدية مخطط له).

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الإقران](/ar/channels/pairing) — مصادقة DM وتدفق الإقران
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية

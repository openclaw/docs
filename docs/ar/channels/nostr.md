---
read_when:
    - تريد أن يتلقى OpenClaw الرسائل المباشرة عبر Nostr
    - أنت تُعدّ المراسلة اللامركزية
summary: قناة الرسائل المباشرة في Nostr عبر رسائل مشفرة وفق NIP-04
title: Nostr
x-i18n:
    generated_at: "2026-05-02T22:16:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6158c22c0ffc5aea56d0ac2b68955f30c3a785013dba5410cbd70f9b689dc3c
    source_path: channels/nostr.md
    workflow: 16
---

**الحالة:** Plugin مضمّن اختياري (معطّل افتراضيًا حتى تتم تهيئته).

Nostr هو بروتوكول لامركزي للتواصل الاجتماعي. تتيح هذه القناة لـ OpenClaw استقبال الرسائل المباشرة المشفّرة (DMs) والرد عليها عبر NIP-04.

## Plugin مضمّن

تتضمن إصدارات OpenClaw الحالية Nostr باعتباره Plugin مضمّنًا، لذلك لا تحتاج
الحزم المبنية العادية إلى تثبيت منفصل.

### التثبيتات الأقدم/المخصصة

- لا يزال الإعداد الأولي (`openclaw onboard`) و`openclaw channels add` يعرضان
  Nostr من كتالوج القنوات المشترك.
- إذا كان البناء لديك يستثني Nostr المضمّن، فثبّت حزمة npm مباشرة.

```bash
openclaw plugins install @openclaw/nostr
```

استخدم الحزمة المجردة لمتابعة وسم الإصدار الرسمي الحالي. ثبّت إصدارًا محددًا
فقط عندما تحتاج إلى تثبيت قابل لإعادة الإنتاج.

استخدم نسخة محلية (سير عمل التطوير):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

أعد تشغيل Gateway بعد تثبيت Plugins أو تمكينها.

### إعداد غير تفاعلي

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

استخدم `--use-env` للاحتفاظ بـ `NOSTR_PRIVATE_KEY` في البيئة بدلًا من تخزين المفتاح في الإعدادات.

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

| المفتاح       | النوع    | الافتراضي                                  | الوصف                                |
| ------------ | -------- | ------------------------------------------- | ----------------------------------- |
| `privateKey` | string   | مطلوب                                      | المفتاح الخاص بتنسيق `nsec` أو hex |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | عناوين Relay (WebSocket)            |
| `dmPolicy`   | string   | `pairing`                                   | سياسة الوصول إلى DM                 |
| `allowFrom`  | string[] | `[]`                                        | مفاتيح pubkey المرسلين المسموح بهم |
| `enabled`    | boolean  | `true`                                      | تمكين/تعطيل القناة                  |
| `name`       | string   | -                                           | اسم العرض                           |
| `profile`    | object   | -                                           | بيانات تعريف ملف NIP-01 الشخصي     |

## بيانات تعريف الملف الشخصي

تُنشر بيانات الملف الشخصي كحدث NIP-01 من نوع `kind:0`. يمكنك إدارتها من واجهة التحكم (القنوات -> Nostr -> الملف الشخصي) أو تعيينها مباشرة في الإعدادات.

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
- يدمج الاستيراد من Relays الحقول ويحافظ على التجاوزات المحلية.

## التحكم في الوصول

### سياسات DM

- **pairing** (الافتراضي): يحصل المرسلون غير المعروفين على رمز إقران.
- **allowlist**: لا يمكن إرسال DM إلا لمفاتيح pubkey الموجودة في `allowFrom`.
- **open**: رسائل DM واردة عامة (تتطلب `allowFrom: ["*"]`).
- **disabled**: تجاهل رسائل DM الواردة.

ملاحظات الإنفاذ:

- يتم التحقق من توقيعات الأحداث الواردة قبل سياسة المرسل وفك تشفير NIP-04، لذلك تُرفض الأحداث المزوّرة مبكرًا.
- تُرسل ردود الإقران دون معالجة متن DM الأصلي.
- تخضع رسائل DM الواردة لتحديد المعدل، ويتم إسقاط الحمولات كبيرة الحجم قبل فك التشفير.

### مثال على قائمة السماح

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
- **مفاتيح Pubkeys (`allowFrom`):** `npub...` أو hex

## Relays

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

- استخدم 2-3 Relays للتكرار الاحتياطي.
- تجنب استخدام عدد كبير جدًا من Relays (زمن انتقال، تكرار).
- يمكن أن تحسّن Relays المدفوعة الاعتمادية.
- Relays المحلية مناسبة للاختبار (`ws://localhost:7777`).

## دعم البروتوكول

| NIP    | الحالة    | الوصف                                  |
| ------ | --------- | -------------------------------------- |
| NIP-01 | مدعوم     | تنسيق الحدث الأساسي + بيانات تعريف الملف الشخصي |
| NIP-04 | مدعوم     | رسائل DM مشفّرة (`kind:4`)             |
| NIP-17 | مخطط له   | رسائل DM مغلّفة كهدية                 |
| NIP-44 | مخطط له   | تشفير بإصدارات                         |

## الاختبار

### Relay محلي

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

1. لاحظ pubkey الخاص بالبوت (npub) من السجلات.
2. افتح عميل Nostr (Damus، Amethyst، إلخ).
3. أرسل DM إلى pubkey الخاص بالبوت.
4. تحقق من الرد.

## استكشاف الأخطاء وإصلاحها

### عدم استقبال الرسائل

- تحقق من أن المفتاح الخاص صالح.
- تأكد من إمكانية الوصول إلى عناوين URL الخاصة بـ Relay وأنها تستخدم `wss://` (أو `ws://` للمحلي).
- تأكد من أن `enabled` ليست `false`.
- تحقق من سجلات Gateway بحثًا عن أخطاء اتصال Relay.

### عدم إرسال الردود

- تحقق من أن Relay يقبل الكتابة.
- تحقق من الاتصال الصادر.
- راقب حدود معدل Relay.

### الردود المكررة

- متوقعة عند استخدام عدة Relays.
- تُزال الرسائل المكررة حسب معرّف الحدث؛ ولا يؤدي إلا التسليم الأول إلى إطلاق رد.

## الأمان

- لا تقم أبدًا بإيداع المفاتيح الخاصة.
- استخدم متغيرات البيئة للمفاتيح.
- فكّر في استخدام `allowlist` لبوتات الإنتاج.
- يتم التحقق من التوقيعات قبل سياسة المرسل، وتُفرض سياسة المرسل قبل فك التشفير، لذلك تُرفض الأحداث المزوّرة مبكرًا ولا يستطيع المرسلون غير المعروفين فرض عمل التشفير الكامل.

## القيود (MVP)

- الرسائل المباشرة فقط (لا توجد محادثات جماعية).
- لا توجد مرفقات وسائط.
- NIP-04 فقط (التغليف كهدية عبر NIP-17 مخطط له).

## ذات صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الإقران](/ar/channels/pairing) — مصادقة DM وتدفق الإقران
- [المجموعات](/ar/channels/groups) — سلوك المحادثات الجماعية وبوابة الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتقوية

---
read_when:
    - أنت تريد أن يستقبل OpenClaw رسائل خاصة عبر Nostr
    - أنت بصدد إعداد مراسلة لامركزية
summary: قناة الرسائل الخاصة في Nostr عبر رسائل NIP-04 المشفرة
title: Nostr
x-i18n:
    generated_at: "2026-04-24T07:31:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f722bb4e1c5f2b3a9c1d58f5597aad2826a809cba3d165af7bf2faf72b68a0f
    source_path: channels/nostr.md
    workflow: 15
---

**الحالة:** Plugin مضمّن اختياري (معطّل افتراضيًا حتى تتم تهيئته).

Nostr هو بروتوكول لامركزي للتواصل الاجتماعي. تتيح هذه القناة لـ OpenClaw استقبال الرسائل الخاصة المشفرة (DMs) والرد عليها عبر NIP-04.

## Plugin المضمّن

تُشحن إصدارات OpenClaw الحالية مع Nostr كـ Plugin مضمّن، لذلك لا تحتاج الإصدارات المعبأة العادية إلى تثبيت منفصل.

### التثبيتات الأقدم/المخصصة

- لا يزال الإعداد الأولي (`openclaw onboard`) و`openclaw channels add` يعرضان
  Nostr من كتالوج القنوات المشترك.
- إذا كان إصدارك يستثني Nostr المضمّن، فثبّته يدويًا.

```bash
openclaw plugins install @openclaw/nostr
```

استخدم نسخة محلية (سير عمل التطوير):

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

أعد تشغيل Gateway بعد تثبيت plugins أو تفعيلها.

### إعداد غير تفاعلي

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

استخدم `--use-env` للاحتفاظ بـ `NOSTR_PRIVATE_KEY` في البيئة بدلًا من تخزين المفتاح في الإعداد.

## إعداد سريع

1. أنشئ زوج مفاتيح Nostr (إذا لزم الأمر):

```bash
# باستخدام nak
nak key generate
```

2. أضف إلى الإعداد:

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

## مرجع الإعداد

| المفتاح     | النوع    | الافتراضي                                  | الوصف                                 |
| ------------ | -------- | ------------------------------------------- | ------------------------------------- |
| `privateKey` | string   | مطلوب                                      | المفتاح الخاص بتنسيق `nsec` أو hex    |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | عناوين URL الخاصة بـ Relay (WebSocket) |
| `dmPolicy`   | string   | `pairing`                                   | سياسة الوصول إلى الرسائل الخاصة       |
| `allowFrom`  | string[] | `[]`                                        | المفاتيح العامة المسموح بها للمرسلين  |
| `enabled`    | boolean  | `true`                                      | تفعيل/تعطيل القناة                    |
| `name`       | string   | -                                           | اسم العرض                             |
| `profile`    | object   | -                                           | بيانات profile الوصفية لـ NIP-01      |

## البيانات الوصفية للملف الشخصي

تُنشر بيانات الملف الشخصي كحدث NIP-01 من النوع `kind:0`. يمكنك إدارتها من واجهة Control UI (Channels -> Nostr -> Profile) أو ضبطها مباشرة في الإعداد.

مثال:

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "بوت رسائل خاصة للمساعد الشخصي",
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

- يجب أن تستخدم عناوين URL الخاصة بالملف الشخصي `https://`.
- يؤدي الاستيراد من relays إلى دمج الحقول مع الحفاظ على التجاوزات المحلية.

## التحكم في الوصول

### سياسات الرسائل الخاصة

- **pairing** (الافتراضي): يحصل المرسلون غير المعروفين على رمز اقتران.
- **allowlist**: فقط المفاتيح العامة الموجودة في `allowFrom` يمكنها إرسال رسائل خاصة.
- **open**: رسائل خاصة واردة عامة (يتطلب `allowFrom: ["*"]`).
- **disabled**: تجاهل الرسائل الخاصة الواردة.

ملاحظات حول التطبيق:

- يتم التحقق من تواقيع الأحداث الواردة قبل سياسة المرسل وفك تشفير NIP-04، لذلك تُرفض الأحداث المزوّرة مبكرًا.
- تُرسل ردود الاقتران دون معالجة متن الرسالة الخاصة الأصلية.
- تخضع الرسائل الخاصة الواردة لتحديد المعدل، وتُسقط الحمولات كبيرة الحجم قبل فك التشفير.

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

- **المفتاح الخاص:** `nsec...` أو hex مكوّن من 64 حرفًا
- **المفاتيح العامة (`allowFrom`):** `npub...` أو hex

## Relays

القيم الافتراضية: `relay.damus.io` و`nos.lol`.

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

- استخدم 2-3 من relays لزيادة الاعتمادية.
- تجنب عددًا كبيرًا جدًا من relays (زمن الاستجابة، التكرار).
- يمكن أن تحسن relays المدفوعة الاعتمادية.
- relays المحلية مناسبة للاختبار (`ws://localhost:7777`).

## دعم البروتوكول

| NIP    | الحالة     | الوصف                                 |
| ------ | --------- | ------------------------------------- |
| NIP-01 | مدعوم     | تنسيق الأحداث الأساسي + بيانات profile الوصفية |
| NIP-04 | مدعوم     | رسائل خاصة مشفرة (`kind:4`)           |
| NIP-17 | مخطط له   | رسائل خاصة مغلّفة Gift-wrapped        |
| NIP-44 | مخطط له   | تشفير بإصدارات                        |

## الاختبار

### Relay محلية

```bash
# تشغيل strfry
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

1. لاحظ المفتاح العام للبوت (npub) من السجلات.
2. افتح عميل Nostr (Damus، Amethyst، إلخ).
3. أرسل رسالة خاصة إلى المفتاح العام للبوت.
4. تحقق من الرد.

## استكشاف الأخطاء وإصلاحها

### عدم استقبال الرسائل

- تحقق من صلاحية المفتاح الخاص.
- تأكد من أن عناوين URL الخاصة بـ relay قابلة للوصول وتستخدم `wss://` (أو `ws://` للمحلي).
- أكد أن `enabled` ليست `false`.
- تحقق من سجلات Gateway لمعرفة أخطاء اتصال relay.

### عدم إرسال الردود

- تحقق من أن relay تقبل عمليات الكتابة.
- تحقق من الاتصال الصادر.
- راقب حدود المعدل الخاصة بـ relay.

### ردود مكررة

- هذا متوقع عند استخدام relays متعددة.
- تُزال الرسائل المكررة حسب معرّف الحدث؛ ولا يؤدي إلا أول تسليم إلى تشغيل رد.

## الأمان

- لا تلتزم أبدًا بالمفاتيح الخاصة.
- استخدم متغيرات البيئة للمفاتيح.
- فكّر في استخدام `allowlist` لبوتات الإنتاج.
- يتم التحقق من التواقيع قبل سياسة المرسل، وتُطبّق سياسة المرسل قبل فك التشفير، لذلك تُرفض الأحداث المزوّرة مبكرًا ولا يمكن للمرسلين غير المعروفين فرض أعمال تشفير كاملة.

## القيود (MVP)

- الرسائل الخاصة فقط (لا توجد دردشات جماعية).
- لا توجد مرفقات وسائط.
- NIP-04 فقط (التغليف Gift-wrap في NIP-17 مخطط له).

## ذو صلة

- [نظرة عامة على القنوات](/ar/channels) — جميع القنوات المدعومة
- [الاقتران](/ar/channels/pairing) — مصادقة الرسائل الخاصة وتدفق الاقتران
- [المجموعات](/ar/channels/groups) — سلوك الدردشة الجماعية وضبط الإشارات
- [توجيه القنوات](/ar/channels/channel-routing) — توجيه الجلسات للرسائل
- [الأمان](/ar/gateway/security) — نموذج الوصول والتدعيم

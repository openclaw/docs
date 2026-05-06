---
read_when:
    - تريد دعم Zalo Personal (غير الرسمي) في OpenClaw
    - أنت تقوم بإعداد Plugin zalouser أو تطويره
summary: 'Plugin Zalo Personal: تسجيل الدخول عبر QR + المراسلة عبر zca-js الأصلي (تثبيت Plugin + إعداد القناة + الأداة)'
title: Plugin Zalo الشخصي
x-i18n:
    generated_at: "2026-05-06T18:02:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 423325f99ddb5b39bba4c5f3aa71215edfdc092c872f92b5d2f00b6ea691246f
    source_path: plugins/zalouser.md
    workflow: 16
---

دعم Zalo Personal لـ OpenClaw عبر Plugin، باستخدام `zca-js` الأصلي لأتمتة حساب مستخدم عادي على Zalo.

<Warning>
قد تؤدي الأتمتة غير الرسمية إلى تعليق الحساب أو حظره. استخدمها على مسؤوليتك الخاصة.
</Warning>

## التسمية

معرّف القناة هو `zalouser` لتوضيح أن هذا يؤتمت **حساب مستخدم شخصي على Zalo** (غير رسمي). نُبقي `zalo` محجوزًا لتكامل محتمل مستقبلاً مع API رسمي لـ Zalo.

## مكان التشغيل

يعمل هذا Plugin **داخل عملية Gateway**.

إذا كنت تستخدم Gateway بعيدًا، فثبّته/اضبطه على **الجهاز الذي يشغّل Gateway**، ثم أعد تشغيل Gateway.

لا يلزم أي ملف CLI ثنائي خارجي لـ `zca`/`openzca`.

## التثبيت

### الخيار أ: التثبيت من npm

```bash
openclaw plugins install @openclaw/zalouser
```

استخدم الحزمة الأساسية لمتابعة وسم الإصدار الرسمي الحالي. ثبّت إصدارًا
دقيقًا فقط عندما تحتاج إلى تثبيت قابل للتكرار.

أعد تشغيل Gateway بعد ذلك.

### الخيار ب: التثبيت من مجلد محلي (تطوير)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

أعد تشغيل Gateway بعد ذلك.

## الإعدادات

توجد إعدادات القناة ضمن `channels.zalouser` (وليس `plugins.entries.*`):

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory peers list --channel zalouser --query "name"
```

## أداة الوكيل

اسم الأداة: `zalouser`

الإجراءات: `send`، `image`، `link`، `friends`، `groups`، `me`، `status`

تدعم إجراءات رسائل القناة أيضًا `react` لتفاعلات الرسائل.

## ذو صلة

- [بناء Plugins](/ar/plugins/building-plugins)
- [Plugins المجتمع](/ar/plugins/community)

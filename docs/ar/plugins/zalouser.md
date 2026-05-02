---
read_when:
    - تريد دعم Zalo Personal (غير الرسمي) في OpenClaw
    - أنت تقوم بتهيئة Plugin zalouser أو تطويره
summary: 'Plugin Zalo Personal: تسجيل الدخول عبر QR + المراسلة عبر zca-js الأصلي (تثبيت Plugin + تهيئة القناة + أداة)'
title: Plugin Zalo الشخصي
x-i18n:
    generated_at: "2026-05-02T22:23:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: b8bcead1a6425587a2cae40e4e817c45b9adf8afbfce6dc673065cc98353f844
    source_path: plugins/zalouser.md
    workflow: 16
---

# Zalo Personal (Plugin)

دعم Zalo Personal لـ OpenClaw عبر Plugin، باستخدام `zca-js` الأصلي لأتمتة حساب مستخدم Zalo عادي.

<Warning>
قد تؤدي الأتمتة غير الرسمية إلى تعليق الحساب أو حظره. استخدمها على مسؤوليتك الخاصة.
</Warning>

## التسمية

معرّف القناة هو `zalouser` لتوضيح أن هذا يؤتمت **حساب مستخدم Zalo شخصيًا** (غير رسمي). نُبقي `zalo` محجوزًا لاحتمال تكامل رسمي مستقبلي مع API لـ Zalo.

## أين يعمل

يعمل هذا Plugin **داخل عملية Gateway**.

إذا كنت تستخدم Gateway بعيدًا، فثبّته/اضبطه على **الجهاز الذي يشغّل Gateway**، ثم أعد تشغيل Gateway.

لا يلزم وجود ملف CLI ثنائي خارجي من `zca`/`openzca`.

## التثبيت

### الخيار أ: التثبيت من npm

```bash
openclaw plugins install @openclaw/zalouser
```

استخدم الحزمة المجرّدة لمتابعة وسم الإصدار الرسمي الحالي. ثبّت إصدارًا دقيقًا فقط عندما تحتاج إلى تثبيت قابل لإعادة الإنتاج.

أعد تشغيل Gateway بعد ذلك.

### الخيار ب: التثبيت من مجلد محلي (تطوير)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

أعد تشغيل Gateway بعد ذلك.

## الإعداد

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

## ذات صلة

- [بناء Plugins](/ar/plugins/building-plugins)
- [Plugins المجتمع](/ar/plugins/community)

---
read_when:
    - تريد دعم Zalo Personal (غير الرسمي) في OpenClaw
    - أنت تقوم بتكوين Plugin zalouser أو تطويره
summary: 'Plugin Zalo Personal: تسجيل الدخول عبر QR + المراسلة عبر zca-js الأصلي (تثبيت Plugin + إعداد القناة + أداة)'
title: Plugin Zalo الشخصي
x-i18n:
    generated_at: "2026-04-30T08:19:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4cbf56d81d4137706fb03b516f65b20f51a4e40ce301c2eaa7923ddc9ac0787f
    source_path: plugins/zalouser.md
    workflow: 16
---

# Zalo Personal (Plugin)

دعم Zalo Personal لـ OpenClaw عبر Plugin، باستخدام `zca-js` الأصلي لأتمتة حساب مستخدم Zalo عادي.

<Warning>
قد تؤدي الأتمتة غير الرسمية إلى تعليق الحساب أو حظره. استخدمها على مسؤوليتك الخاصة.
</Warning>

## التسمية

معرّف القناة هو `zalouser` لتوضيح أن هذا يؤتمت **حساب مستخدم Zalo شخصيًا** (غير رسمي). نُبقي `zalo` محجوزًا لتكامل محتمل مستقبلاً مع واجهة Zalo API الرسمية.

## أين يعمل

يعمل هذا Plugin **داخل عملية Gateway**.

إذا كنت تستخدم Gateway بعيدًا، فثبّته/اضبطه على **الجهاز الذي يشغّل Gateway**، ثم أعد تشغيل Gateway.

لا يلزم وجود ملف CLI ثنائي خارجي لـ `zca`/`openzca`.

## التثبيت

### الخيار أ: التثبيت من npm

```bash
openclaw plugins install @openclaw/zalouser
```

إذا أبلغ npm أن الحزمة المملوكة لـ OpenClaw مهملة، فهذا يعني أن إصدار الحزمة هذا
من مسار حزم خارجي أقدم؛ استخدم بناء OpenClaw مُغلّفًا حاليًا أو
مسار المجلد المحلي إلى أن تُنشر حزمة npm أحدث.

أعد تشغيل Gateway بعد ذلك.

### الخيار ب: التثبيت من مجلد محلي (تطوير)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

أعد تشغيل Gateway بعد ذلك.

## الضبط

توجد تهيئة القناة ضمن `channels.zalouser` (وليس `plugins.entries.*`):

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

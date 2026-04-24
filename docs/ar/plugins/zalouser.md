---
read_when:
    - تريد دعم Zalo Personal ‏(غير الرسمي) في OpenClaw
    - أنت تضبط أو تطور Plugin ‏zalouser
summary: 'Plugin ‏Zalo Personal: تسجيل دخول عبر QR + مراسلة عبر `zca-js` الأصلي (تثبيت Plugin + إعداد القناة + الأداة)'
title: Plugin ‏Zalo Personal
x-i18n:
    generated_at: "2026-04-24T07:57:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: d678bd55fd405a9c689d1202870cc03bfb825a9314c433a0ab729d376e3b67a3
    source_path: plugins/zalouser.md
    workflow: 15
---

# Zalo Personal ‏(Plugin)

دعم Zalo Personal في OpenClaw عبر Plugin، باستخدام `zca-js` الأصلي لأتمتة حساب مستخدم Zalo عادي.

> **تحذير:** قد تؤدي الأتمتة غير الرسمية إلى تعليق الحساب/حظره. استخدمها على مسؤوليتك الخاصة.

## التسمية

معرّف القناة هو `zalouser` لتوضيح أن هذا يؤتمت **حساب مستخدم Zalo شخصي** ‏(غير رسمي). ونُبقي `zalo` محجوزًا لتكامل رسمي محتمل مع Zalo API في المستقبل.

## أين يعمل

يعمل هذا Plugin **داخل عملية Gateway**.

إذا كنت تستخدم Gateway بعيدة، فقم بتثبيته/إعداده على **الجهاز الذي يشغّل Gateway**، ثم أعد تشغيل Gateway.

لا حاجة إلى أي ملف CLI تنفيذي خارجي من `zca`/`openzca`.

## التثبيت

### الخيار A: التثبيت من npm

```bash
openclaw plugins install @openclaw/zalouser
```

أعد تشغيل Gateway بعد ذلك.

### الخيار B: التثبيت من مجلد محلي (للتطوير)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

أعد تشغيل Gateway بعد ذلك.

## الإعدادات

توجد إعدادات القناة تحت `channels.zalouser` ‏(وليس `plugins.entries.*`):

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

الإجراءات: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

تدعم إجراءات رسائل القناة أيضًا `react` لتفاعلات الرسائل.

## ذو صلة

- [بناء Plugins](/ar/plugins/building-plugins)
- [Plugins المجتمع](/ar/plugins/community)

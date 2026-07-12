---
read_when:
    - تريد دعم Zalo Personal (غير الرسمي) في OpenClaw
    - أنت تهيئ أو تطوّر Plugin ‏zalouser
summary: 'Plugin ‏Zalo Personal: تسجيل الدخول عبر رمز QR + المراسلة باستخدام zca-js الأصلي (تثبيت Plugin + إعداد القناة + الأداة)'
title: Plugin ‏Zalo الشخصي
x-i18n:
    generated_at: "2026-07-12T06:26:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb0bdaa10340b5d78dc32abf6b0520fda6cf5f65e2e17b551b4e9bd72acfbbf2
    source_path: plugins/zalouser.md
    workflow: 16
---

دعم Zalo Personal في OpenClaw عبر Plugin يستخدم مكتبة `zca-js` الأصلية
لأتمتة حساب مستخدم Zalo عادي. لا يلزم استخدام ملف CLI تنفيذي خارجي من نوع
`zca`/`openzca`.

<Warning>
قد تؤدي الأتمتة غير الرسمية إلى تعليق الحساب أو حظره. استخدمها على مسؤوليتك الخاصة.
</Warning>

## التسمية

معرّف القناة هو `zalouser` لتوضيح أن هذه القناة تؤتمت **حساب مستخدم Zalo
شخصيًا** (بشكل غير رسمي). أما معرّف القناة المنفصل `zalo` فهو لتكامل
Zalo Bot/Webhook الرسمي والمدمج؛ راجع [Zalo](/ar/channels/zalo).

## مكان التشغيل

يعمل هذا Plugin **داخل عملية Gateway**. عند استخدام Gateway بعيد،
ثبّته واضبطه على ذلك المضيف، ثم أعد تشغيل Gateway.

## التثبيت

### من npm

```bash
openclaw plugins install @openclaw/zalouser
```

استخدم الحزمة المجرّدة لمتابعة وسم الإصدار الرسمي الحالي؛ ولا تثبّت إصدارًا
محددًا بدقة إلا عندما تحتاج إلى تثبيت قابل لإعادة الإنتاج. أعد تشغيل Gateway
بعد ذلك.

### من مجلد محلي (للتطوير)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

أعد تشغيل Gateway بعد ذلك.

## الإعداد

يوجد إعداد القناة ضمن `channels.zalouser` (وليس `plugins.entries.*`):

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

راجع [إعداد قناة Zalo الشخصية](/ar/channels/zalouser) للتحكم في الوصول إلى الرسائل
المباشرة والمجموعات، وإعداد حسابات متعددة، ومتغيرات البيئة، واستكشاف الأخطاء وإصلاحها.

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels login --channel zalouser --account <name>
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "name"
openclaw directory groups members --channel zalouser --group-id <id>
```

## أداة الوكيل

اسم الأداة: `zalouser`

الإجراءات: `send`، و`image`، و`link`، و`friends`، و`groups`، و`me`، و`status`

تدعم إجراءات رسائل القناة أيضًا `react` للتفاعل مع الرسائل (وليس ضمن أداة الوكيل).

## ذو صلة

- [إعداد قناة Zalo الشخصية](/ar/channels/zalouser)
- [Zalo (قناة Bot/Webhook الرسمية)](/ar/channels/zalo)
- [إنشاء Plugins](/ar/plugins/building-plugins)
- [ClawHub](/clawhub)

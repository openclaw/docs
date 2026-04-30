---
read_when:
    - تريد الوصول إلى Gateway عبر Tailscale
    - تريد واجهة التحكم في المتصفح وتحرير الإعدادات
summary: 'واجهات الويب في Gateway: واجهة التحكم، أوضاع الربط، والأمان'
title: الويب
x-i18n:
    generated_at: "2026-04-30T08:34:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1e357d1e9f4ad0286b9412cd0a684b6428180e0586eef76577ecb2909212fb2
    source_path: web/index.md
    workflow: 16
---

يقدّم Gateway **واجهة تحكم عبر المتصفح** صغيرة (Vite + Lit) من المنفذ نفسه مثل Gateway WebSocket:

- الافتراضي: `http://<host>:18789/`
- مع `gateway.tls.enabled: true`: `https://<host>:18789/`
- بادئة اختيارية: عيّن `gateway.controlUi.basePath` (مثل `/openclaw`)

توجد الإمكانات في [واجهة التحكم](/ar/web/control-ui). تركز بقية هذه الصفحة على أوضاع الربط، والأمان، والأسطح المواجهة للويب.

## Webhooks

عندما تكون `hooks.enabled=true`، يوفّر Gateway أيضًا نقطة نهاية Webhook صغيرة على خادم HTTP نفسه.
راجع [إعدادات Gateway](/ar/gateway/configuration) ← `hooks` للمصادقة والحمولات.

## الإعدادات (مفعّلة افتراضيًا)

تكون واجهة التحكم **مفعّلة افتراضيًا** عند وجود الأصول (`dist/control-ui`).
يمكنك التحكم بها عبر الإعدادات:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## الوصول عبر Tailscale

### Serve مدمج (موصى به)

أبقِ Gateway على loopback ودع Tailscale Serve يعمل كوكيل له:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

ثم ابدأ تشغيل Gateway:

```bash
openclaw gateway
```

افتح:

- `https://<magicdns>/` (أو `gateway.controlUi.basePath` الذي أعددته)

### ربط Tailnet + رمز

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

ثم ابدأ تشغيل Gateway (يستخدم هذا المثال غير المعتمد على loopback مصادقة رمز
سر مشترك):

```bash
openclaw gateway
```

افتح:

- `http://<tailscale-ip>:18789/` (أو `gateway.controlUi.basePath` الذي أعددته)

### الإنترنت العام (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // or OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## ملاحظات الأمان

- مصادقة Gateway مطلوبة افتراضيًا (رمز، أو كلمة مرور، أو وكيل موثوق، أو ترويسات هوية Tailscale Serve عند تفعيلها).
- لا تزال عمليات الربط غير المعتمدة على loopback **تتطلب** مصادقة Gateway. عمليًا، يعني ذلك مصادقة الرمز/كلمة المرور أو وكيلاً عكسيًا مدركًا للهوية مع `gateway.auth.mode: "trusted-proxy"`.
- ينشئ المعالج مصادقة سر مشترك افتراضيًا، وغالبًا ما يولّد
  رمز Gateway (حتى على loopback).
- في وضع السر المشترك، ترسل واجهة المستخدم `connect.params.auth.token` أو
  `connect.params.auth.password`.
- عندما تكون `gateway.tls.enabled: true`، تعرض أدوات لوحة المعلومات المحلية والحالة
  عناوين URL للوحة المعلومات بصيغة `https://` وعناوين URL لـ WebSocket بصيغة `wss://`.
- في الأوضاع التي تحمل هوية مثل Tailscale Serve أو `trusted-proxy`، يتم استيفاء
  فحص مصادقة WebSocket من ترويسات الطلب بدلًا من ذلك.
- لعمليات نشر واجهة التحكم غير المعتمدة على loopback، عيّن `gateway.controlUi.allowedOrigins`
  صراحةً (الأصول الكاملة). بدون ذلك، يُرفض بدء تشغيل Gateway افتراضيًا.
- يفعّل `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
  وضع الرجوع إلى أصل ترويسة Host، لكنه تخفيض أمني خطير.
- مع Serve، يمكن لترويسات هوية Tailscale أن تستوفي مصادقة واجهة التحكم/WebSocket
  عندما تكون `gateway.auth.allowTailscale` هي `true` (بدون الحاجة إلى رمز/كلمة مرور).
  لا تستخدم نقاط نهاية HTTP API ترويسات هوية Tailscale هذه؛ بل تتبع
  وضع مصادقة HTTP العادي الخاص بـ Gateway بدلًا من ذلك. عيّن
  `gateway.auth.allowTailscale: false` لطلب بيانات اعتماد صريحة. راجع
  [Tailscale](/ar/gateway/tailscale) و[الأمان](/ar/gateway/security). يفترض هذا
  التدفق بلا رمز أن مضيف Gateway موثوق.
- يتطلب `gateway.tailscale.mode: "funnel"` أن يكون `gateway.auth.mode: "password"` (كلمة مرور مشتركة).

## بناء واجهة المستخدم

يقدّم Gateway الملفات الثابتة من `dist/control-ui`. ابنِها باستخدام:

```bash
pnpm ui:build
```

---
read_when:
    - تريد الوصول إلى Gateway عبر Tailscale
    - تريد واجهة Control UI في المتصفح وتحرير الإعدادات
summary: 'أسطح الويب في Gateway: Control UI، وأوضاع الربط، والأمان'
title: الويب
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-25T14:02:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 424704a35ce3a0f5960486372514751cc93ae90e4b75d0ed114e045664256d2d
    source_path: web/index.md
    workflow: 15
---

تقدّم Gateway **واجهة Control UI للمتصفح** صغيرة (Vite + Lit) من المنفذ نفسه الذي تستخدمه WebSocket الخاصة بـ Gateway:

- الافتراضي: `http://<host>:18789/`
- مع `gateway.tls.enabled: true`: ‏`https://<host>:18789/`
- بادئة اختيارية: اضبط `gateway.controlUi.basePath` (مثل `/openclaw`)

توجد الإمكانات في [Control UI](/ar/web/control-ui).
تركّز هذه الصفحة على أوضاع الربط، والأمان، والأسطح المواجهة للويب.

## Webhooks

عندما تكون `hooks.enabled=true`، تعرض Gateway أيضًا نقطة نهاية Webhook صغيرة على خادم HTTP نفسه.
راجع [إعدادات Gateway](/ar/gateway/configuration) ← `hooks` لمعرفة المصادقة + الحمولات.

## الإعدادات (مفعّلة افتراضيًا)

تكون Control UI **مفعّلة افتراضيًا** عند وجود الأصول (`dist/control-ui`).
يمكنك التحكم بها عبر الإعدادات:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath اختياري
  },
}
```

## الوصول عبر Tailscale

### Serve المدمج (موصى به)

أبقِ Gateway على loopback المحلي ودع Tailscale Serve يمرره عبر proxy:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

ثم ابدأ gateway:

```bash
openclaw gateway
```

افتح:

- `https://<magicdns>/` (أو `gateway.controlUi.basePath` الذي ضبطته)

### ربط Tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

ثم ابدأ gateway (يستخدم هذا المثال غير المعتمد على loopback
مصادقة token ذات سر مشترك):

```bash
openclaw gateway
```

افتح:

- `http://<tailscale-ip>:18789/` (أو `gateway.controlUi.basePath` الذي ضبطته)

### الإنترنت العام (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // أو OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## ملاحظات الأمان

- مصادقة Gateway مطلوبة افتراضيًا (token، أو password، أو trusted-proxy، أو ترويسات هوية Tailscale Serve عند تمكينها).
- ما تزال عمليات الربط غير المعتمدة على loopback **تتطلب** مصادقة gateway. وعمليًا يعني ذلك استخدام مصادقة token/password أو reverse proxy واعيًا بالهوية مع `gateway.auth.mode: "trusted-proxy"`.
- ينشئ المعالج مصادقة ذات سر مشترك افتراضيًا ويولّد عادةً
  token للـ gateway (حتى على loopback).
- في وضع السر المشترك، ترسل الواجهة `connect.params.auth.token` أو
  `connect.params.auth.password`.
- عندما تكون `gateway.tls.enabled: true`، تعرض مساعدات لوحة التحكم والحالة المحلية
  عناوين URL للوحة التحكم باستخدام `https://` وعناوين WebSocket باستخدام `wss://`.
- في الأوضاع الحاملة للهوية مثل Tailscale Serve أو `trusted-proxy`، يتحقق
  فحص مصادقة WebSocket من ترويسات الطلب بدلًا من ذلك.
- بالنسبة إلى عمليات نشر Control UI غير المعتمدة على loopback، اضبط `gateway.controlUi.allowedOrigins`
  صراحةً (كأصول كاملة). ومن دون ذلك، يُرفض بدء تشغيل gateway افتراضيًا.
- يفعّل `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
  وضع fallback لأصل Host-header، لكنه خفض خطير لمستوى الأمان.
- مع Serve، يمكن لترويسات هوية Tailscale أن تلبّي مصادقة Control UI/WebSocket
  عندما تكون `gateway.auth.allowTailscale` مساوية لـ `true` (من دون الحاجة إلى token/password).
  أما نقاط نهاية HTTP API فلا تستخدم ترويسات هوية Tailscale هذه؛ بل تتبع
  وضع مصادقة HTTP العادي الخاص بـ gateway بدلًا من ذلك. اضبط
  `gateway.auth.allowTailscale: false` لفرض بيانات اعتماد صريحة. راجع
  [Tailscale](/ar/gateway/tailscale) و[الأمان](/ar/gateway/security). ويفترض
  هذا التدفق من دون token أن مضيف gateway موثوق.
- يتطلب `gateway.tailscale.mode: "funnel"` القيمة `gateway.auth.mode: "password"` (كلمة مرور مشتركة).

## بناء الواجهة

تخدم Gateway الملفات الثابتة من `dist/control-ui`. ابنِها باستخدام:

```bash
pnpm ui:build
```

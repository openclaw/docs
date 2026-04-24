---
read_when:
    - أنت تريد الوصول إلى Gateway عبر Tailscale
    - أنت تريد Control UI في المتصفح وتحرير الإعدادات
summary: 'أسطح الويب الخاصة بـ Gateway: ‏Control UI، وأوضاع الربط، والأمان'
title: الويب
x-i18n:
    generated_at: "2026-04-24T08:12:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0336a6597cebf4a8a83d348abd3d59ff4b9bd7349a32c8a0a0093da0f656e97d
    source_path: web/index.md
    workflow: 15
---

تخدم Gateway **Control UI** صغيرة في المتصفح (Vite + Lit) من المنفذ نفسه الذي تستخدمه WebSocket الخاصة بـ Gateway:

- الافتراضي: `http://<host>:18789/`
- بادئة اختيارية: اضبط `gateway.controlUi.basePath` (مثل `/openclaw`)

توجد القدرات في [Control UI](/ar/web/control-ui).
تركّز هذه الصفحة على أوضاع الربط، والأمان، والأسطح المواجهة للويب.

## Webhooks

عندما تكون `hooks.enabled=true`، تكشف Gateway أيضًا نقطة نهاية Webhook صغيرة على خادم HTTP نفسه.
راجع [إعداد Gateway](/ar/gateway/configuration) ← `hooks` لمعرفة المصادقة والحمولات.

## الإعداد (مفعّل افتراضيًا)

تكون **Control UI مفعّلة افتراضيًا** عندما تكون الأصول موجودة (`dist/control-ui`).
ويمكنك التحكم فيها عبر الإعداد:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## الوصول عبر Tailscale

### Serve المدمجة (موصى بها)

أبقِ Gateway على loopback ودَع Tailscale Serve تعمل كـ proxy لها:

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

- `https://<magicdns>/` (أو القيمة المضبوطة في `gateway.controlUi.basePath`)

### ربط tailnet + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

ثم ابدأ gateway (هذا المثال غير loopback يستخدم مصادقة
token بمفتاح سري مشترك):

```bash
openclaw gateway
```

افتح:

- `http://<tailscale-ip>:18789/` (أو القيمة المضبوطة في `gateway.controlUi.basePath`)

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

- تكون مصادقة Gateway مطلوبة افتراضيًا (token، أو password، أو trusted-proxy، أو رؤوس هوية Tailscale Serve عند تفعيلها).
- ما تزال عمليات الربط غير loopback **تتطلب** مصادقة gateway. وعمليًا يعني ذلك مصادقة token/password أو reverse proxy واعية بالهوية مع `gateway.auth.mode: "trusted-proxy"`.
- ينشئ المعالج مصادقة بمفتاح سري مشترك افتراضيًا ويولّد عادةً
  gateway token (حتى على loopback).
- في وضع المفتاح السري المشترك، ترسل UI القيمة `connect.params.auth.token` أو
  `connect.params.auth.password`.
- في الأوضاع الحاملة للهوية مثل Tailscale Serve أو `trusted-proxy`، يتم
  استيفاء فحص مصادقة WebSocket من رؤوس الطلب بدلًا من ذلك.
- بالنسبة إلى عمليات نشر Control UI غير loopback، اضبط `gateway.controlUi.allowedOrigins`
  صراحةً (كأصول كاملة). ومن دون ذلك، يتم رفض بدء gateway افتراضيًا.
- يفعّل `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
  وضع fallback لأصل Host-header، لكنه خفض خطير لمستوى الأمان.
- مع Serve، يمكن لرؤوس هوية Tailscale أن تستوفي مصادقة Control UI/WebSocket
  عندما تكون `gateway.auth.allowTailscale` مساوية لـ `true` (من دون الحاجة إلى token/password).
  أما نقاط نهاية HTTP API فلا تستخدم رؤوس هوية Tailscale هذه؛ بل تتبع
  وضع مصادقة HTTP العادي الخاص بـ gateway بدلًا من ذلك. اضبط
  `gateway.auth.allowTailscale: false` لفرض بيانات اعتماد صريحة. راجع
  [Tailscale](/ar/gateway/tailscale) و[الأمان](/ar/gateway/security). ويفترض هذا
  التدفق من دون token أن مضيف gateway موثوق.
- تتطلب `gateway.tailscale.mode: "funnel"` القيمة `gateway.auth.mode: "password"` (كلمة مرور مشتركة).

## بناء UI

تخدم Gateway ملفات ثابتة من `dist/control-ui`. ابنِها باستخدام:

```bash
pnpm ui:build
```

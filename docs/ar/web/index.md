---
read_when:
    - تريد الوصول إلى Gateway عبر Tailscale
    - تريد واجهة التحكم في المتصفح وتحرير الإعدادات
summary: 'أسطح الويب في Gateway: واجهة التحكم، أوضاع الربط، والأمان'
title: الويب
x-i18n:
    generated_at: "2026-06-27T18:48:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c6b0c9f4ff53af295eb4eef7290d5d6b70c52543f57a9e83c7f8a635a2b35cd
    source_path: web/index.md
    workflow: 16
---

يقدّم Gateway **واجهة تحكم في المتصفح** صغيرة (Vite + Lit) من المنفذ نفسه الذي يستخدمه Gateway WebSocket:

- الافتراضي: `http://<host>:18789/`
- مع `gateway.tls.enabled: true`: `https://<host>:18789/`
- بادئة اختيارية: اضبط `gateway.controlUi.basePath` (مثل `/openclaw`)

توجد الإمكانات في [واجهة التحكم](/ar/web/control-ui). يركز باقي هذه الصفحة على أوضاع الربط، والأمان، والأسطح المواجهة للويب.

## Webhooks

عند ضبط `hooks.enabled=true`، يوفّر Gateway أيضًا نقطة نهاية Webhook صغيرة على خادم HTTP نفسه.
راجع [إعدادات Gateway](/ar/gateway/configuration) ← `hooks` للمصادقة + الحمولات.

## Admin HTTP RPC

يكشف Admin HTTP RPC طرائق مختارة من مستوى التحكم في Gateway عند `POST /api/v1/admin/rpc`.
وهو معطّل افتراضيًا ولا يُسجَّل إلا عند تفعيل Plugin `admin-http-rpc`.
راجع [Admin HTTP RPC](/ar/plugins/admin-http-rpc) لمعرفة نموذج المصادقة، والطرائق المسموح بها، والمقارنة مع WebSocket.

## الإعدادات (مفعّلة افتراضيًا)

تكون واجهة التحكم **مفعّلة افتراضيًا** عند وجود الأصول (`dist/control-ui`).
يمكنك التحكم فيها عبر الإعدادات:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath optional
  },
}
```

## الوصول عبر Tailscale

### Serve المدمج (موصى به)

أبقِ Gateway على loopback ودع Tailscale Serve يوكّله:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

ثم ابدأ Gateway:

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

ثم ابدأ Gateway (يستخدم هذا المثال غير القائم على loopback مصادقة رمز
سرّ مشترك):

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
- لا تزال عمليات الربط غير القائمة على loopback **تتطلب** مصادقة Gateway. عمليًا يعني ذلك مصادقة الرمز/كلمة المرور أو وكيلًا عكسيًا مدركًا للهوية مع `gateway.auth.mode: "trusted-proxy"`.
- ينشئ المعالج مصادقة سرّ مشترك افتراضيًا، وعادةً ما ينشئ
  رمز Gateway (حتى على loopback).
- في وضع السرّ المشترك، ترسل الواجهة `connect.params.auth.token` أو
  `connect.params.auth.password`.
- عند ضبط `gateway.tls.enabled: true`، تعرض مساعدات لوحة المعلومات والحالة المحلية
  عناوين URL للوحة المعلومات بصيغة `https://` وعناوين URL لـ WebSocket بصيغة `wss://`.
- في الأوضاع الحاملة للهوية مثل Tailscale Serve أو `trusted-proxy`، يُستوفى
  فحص مصادقة WebSocket من ترويسات الطلب بدلًا من ذلك.
- لنشرات واجهة التحكم العامة غير القائمة على loopback، اضبط `gateway.controlUi.allowedOrigins`
  صراحةً (الأصول الكاملة). تُقبل عمليات التحميل الخاصة من نفس الأصل عبر LAN/Tailnet لـ loopback،
  وRFC1918/link-local، و`.local`، و`.ts.net`، ومضيفي Tailscale CGNAT.
- يفعّل `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
  وضع الرجوع إلى أصل ترويسة Host، لكنه خفض خطير لمستوى الأمان.
- مع Serve، يمكن لترويسات هوية Tailscale استيفاء مصادقة واجهة التحكم/WebSocket
  عندما تكون `gateway.auth.allowTailscale` هي `true` (لا يلزم رمز/كلمة مرور).
  لا تستخدم نقاط نهاية HTTP API ترويسات هوية Tailscale تلك؛ بل تتبع
  وضع مصادقة HTTP المعتاد في Gateway بدلًا من ذلك. اضبط
  `gateway.auth.allowTailscale: false` لطلب بيانات اعتماد صريحة. راجع
  [Tailscale](/ar/gateway/tailscale) و[الأمان](/ar/gateway/security). يفترض
  هذا التدفق بلا رمز أن مضيف Gateway موثوق.
- يتطلب `gateway.tailscale.mode: "funnel"` ضبط `gateway.auth.mode: "password"` (كلمة مرور مشتركة).

## بناء الواجهة

يقدّم Gateway الملفات الثابتة من `dist/control-ui`. ابنها باستخدام:

```bash
pnpm ui:build
```

---
read_when:
    - تريد الوصول إلى Gateway عبر Tailscale
    - تريد واجهة التحكم في المتصفح وتحرير الإعدادات
summary: 'واجهات الويب في Gateway: واجهة التحكم، وأوضاع الربط، والأمان'
title: الويب
x-i18n:
    generated_at: "2026-07-12T06:44:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 413fb029d95241f5c6043b28825727cdee52b2fa8cbe998fbbd6e3ff7b81467b
    source_path: web/index.md
    workflow: 16
---

يقدّم Gateway **واجهة تحكم عبر المتصفح** صغيرة (Vite + Lit) من المنفذ نفسه الذي يستخدمه WebSocket الخاص بـ Gateway:

- الافتراضي: `http://<host>:18789/`
- مع `gateway.tls.enabled: true`: ‏`https://<host>:18789/`
- بادئة اختيارية: اضبط `gateway.controlUi.basePath` (مثلًا `/openclaw`)

توجد الإمكانات في [واجهة التحكم](/ar/web/control-ui). تتناول هذه الصفحة أوضاع الربط والأمان والأسطح الأخرى المتاحة عبر الويب.

## الإعداد (مفعّل افتراضيًا)

تكون واجهة التحكم **مفعّلة افتراضيًا** عند توفر الأصول (`dist/control-ui`):

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath اختياري
  },
}
```

## Webhook

عندما يكون `hooks.enabled=true`، يكشف Gateway أيضًا نقطة نهاية Webhook على خادم HTTP نفسه. راجع `hooks` في [مرجع إعداد Gateway](/ar/gateway/configuration-reference#hooks) للاطلاع على المصادقة والحمولات.

## استدعاء إجراءات HTTP عن بُعد للإدارة

يكشف `POST /api/v1/admin/rpc` أساليب مختارة من مستوى تحكم Gateway عبر HTTP. يكون معطّلًا افتراضيًا، ولا يُسجّل إلا عند تمكين Plugin ‏`admin-http-rpc`. راجع [استدعاء إجراءات HTTP عن بُعد للإدارة](/ar/plugins/admin-http-rpc) للاطلاع على نموذج المصادقة والأساليب المسموح بها والمقارنة مع واجهة WebSocket البرمجية.

## الوصول عبر Tailscale

<Tabs>
  <Tab title="التقديم المتكامل (موصى به)">
    أبقِ Gateway على local loopback، ودع Tailscale Serve يعمل وسيطًا له:

    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "serve" },
      },
    }
    ```

    شغّل Gateway:

    ```bash
    openclaw gateway
    ```

    افتح `https://<magicdns>/` (أو `gateway.controlUi.basePath` الذي أعددته).

  </Tab>
  <Tab title="ربط Tailnet + الرمز المميّز">
    ```json5
    {
      gateway: {
        bind: "tailnet",
        controlUi: { enabled: true },
        auth: { mode: "token", token: "your-token" },
      },
    }
    ```

    شغّل Gateway (يستخدم هذا المثال الذي لا يعتمد local loopback مصادقة برمز مميّز سري مشترك):

    ```bash
    openclaw gateway
    ```

    افتح `http://<tailscale-ip>:18789/` (أو `gateway.controlUi.basePath` الذي أعددته).

  </Tab>
  <Tab title="الإنترنت العام (Funnel)">
    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "funnel" },
        auth: { mode: "password" }, // أو OPENCLAW_GATEWAY_PASSWORD
      },
    }
    ```

    يتطلب `tailscale.mode: "funnel"` القيمة `gateway.auth.mode: "password"`؛ كما يتطلب كل من Serve وFunnel القيمة `gateway.bind: "loopback"`.

  </Tab>
</Tabs>

## ملاحظات الأمان

- مصادقة Gateway مطلوبة افتراضيًا: رمز مميّز أو كلمة مرور أو وكيل موثوق، أو ترويسات هوية Tailscale Serve عند تمكينها.
- تظل عمليات الربط التي لا تستخدم local loopback **تتطلب** مصادقة Gateway: مصادقة برمز مميّز/كلمة مرور، أو وكيل عكسي مدرك للهوية مع `gateway.auth.mode: "trusted-proxy"`.
- ينشئ معالج الإعداد الأولي مصادقة بسر مشترك افتراضيًا، وعادةً ما ينشئ رمزًا مميّزًا لـ Gateway، حتى على local loopback.
- في وضع السر المشترك، ترسل الواجهة `connect.params.auth.token` أو `connect.params.auth.password` أثناء مصافحة WebSocket.
- مع `gateway.tls.enabled: true`، تعرض أدوات لوحة المعلومات/الحالة المحلية عناوين URL باستخدام `https://` وعناوين WebSocket باستخدام `wss://`.
- في الأوضاع الحاملة للهوية (Tailscale Serve و`trusted-proxy`)، يُستوفى فحص مصادقة WebSocket من ترويسات الطلب بدلًا من سر مشترك.
- لعمليات نشر واجهة التحكم العامة التي لا تستخدم local loopback، اضبط `gateway.controlUi.allowedOrigins` صراحةً (أصول كاملة). تُقبل عمليات التحميل الخاصة من الأصل نفسه من دونه لمضيفي local loopback وRFC1918/الرابط المحلي و`.local` و`.ts.net` وTailscale CGNAT.
- يفعّل `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback: true` الرجوع الاحتياطي إلى أصل ترويسة Host؛ وهذا تخفيض خطير لمستوى الأمان.
- مع Serve، تستوفي ترويسات هوية Tailscale مصادقة واجهة التحكم/WebSocket عندما تكون `gateway.auth.allowTailscale: true` (لا يلزم رمز مميّز/كلمة مرور). لا تستخدم نقاط نهاية واجهة HTTP البرمجية ترويسات هوية Tailscale؛ بل تتبع دائمًا وضع مصادقة HTTP المعتاد لـ Gateway. اضبط `gateway.auth.allowTailscale: false` لطلب بيانات اعتماد صريحة حتى عبر Serve. يفترض هذا التدفق الخالي من الرموز المميّزة أن مضيف Gateway نفسه موثوق. راجع [Tailscale](/ar/gateway/tailscale) و[الأمان](/ar/gateway/security).

## بناء الواجهة

يقدّم Gateway الملفات الثابتة من `dist/control-ui`:

```bash
pnpm ui:build
```

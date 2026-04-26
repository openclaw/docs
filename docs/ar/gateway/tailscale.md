---
read_when:
    - إتاحة Control UI الخاصة بـ Gateway خارج localhost
    - أتمتة الوصول إلى لوحة التحكم عبر tailnet أو بشكل عام
summary: تكامل Tailscale Serve/Funnel مع لوحة تحكم Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-26T11:31:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5966490f8e85774b5149ed29cf7fd4b108eb438f94f5f74a3e5aa3e3b39568a
    source_path: gateway/tailscale.md
    workflow: 15
---

يمكن لـ OpenClaw تهيئة **Serve** ‏(tailnet) أو **Funnel** ‏(عام) في Tailscale تلقائيًا من أجل
لوحة تحكم Gateway ومنفذ WebSocket. ويُبقي هذا Gateway مرتبطًا بـ loopback بينما
يوفر Tailscale بروتوكول HTTPS والتوجيه و(في حالة Serve) ترويسات الهوية.

## الأوضاع

- `serve`: ‏Serve مخصص لـ tailnet فقط عبر `tailscale serve`. ويبقى Gateway على `127.0.0.1`.
- `funnel`: ‏HTTPS عام عبر `tailscale funnel`. ويتطلب OpenClaw كلمة مرور مشتركة.
- `off`: الافتراضي (من دون أتمتة Tailscale).

تستخدم مخرجات الحالة والتدقيق عبارة **تعريض Tailscale** لهذا الوضع الخاص بـ OpenClaw Serve/Funnel.
ويعني `off` أن OpenClaw لا يدير Serve أو Funnel؛ ولا يعني أن
برنامج Tailscale daemon المحلي متوقف أو مسجّل الخروج.

## المصادقة

اضبط `gateway.auth.mode` للتحكم في المصافحة:

- `none` (إدخال خاص فقط)
- `token` (الافتراضي عند ضبط `OPENCLAW_GATEWAY_TOKEN`)
- `password` (سر مشترك عبر `OPENCLAW_GATEWAY_PASSWORD` أو الإعدادات)
- `trusted-proxy` (reverse proxy واعٍ بالهوية؛ راجع [Trusted Proxy Auth](/ar/gateway/trusted-proxy-auth))

عندما تكون `tailscale.mode = "serve"` وتكون `gateway.auth.allowTailscale` مساوية لـ `true`،
يمكن أن تستخدم مصادقة Control UI/WebSocket ترويسات هوية Tailscale
(`tailscale-user-login`) من دون توفير token/password. ويتحقق OpenClaw من
الهوية من خلال حل عنوان `x-forwarded-for` عبر برنامج Tailscale daemon المحلي
(`tailscale whois`) ومطابقته مع الترويسة قبل قبوله.
ولا يعامل OpenClaw الطلب على أنه Serve إلا عندما يصل من loopback مع
ترويسات `x-forwarded-for` و`x-forwarded-proto` و`x-forwarded-host`
الخاصة بـ Tailscale.
وبالنسبة إلى جلسات المشغّل في Control UI التي تتضمن هوية جهاز المتصفح، فإن
هذا المسار المتحقق منه عبر Serve يتجاوز أيضًا رحلة device-pairing ذهابًا وإيابًا. لكنه لا يتجاوز
هوية جهاز المتصفح: فما زال العملاء الذين لا يملكون جهازًا يُرفضون، كما أن اتصالات WebSocket غير التابعة لـ Control UI أو ذات دور node
لا تزال تتبع فحوصات الاقتران والمصادقة العادية.
أما نقاط نهاية HTTP API (مثل `/v1/*` و`/tools/invoke` و`/api/channels/*`)
فلا تستخدم مصادقة ترويسات هوية Tailscale. بل تتبع وضع مصادقة HTTP
العادي في gateway: مصادقة السر المشترك افتراضيًا، أو إعداد
trusted-proxy / private-ingress `none` مضبوط عمدًا.
ويفترض هذا التدفق الخالي من token أن مضيف gateway موثوق. وإذا كان من المحتمل تشغيل
كود محلي غير موثوق على المضيف نفسه، فعطّل `gateway.auth.allowTailscale` واطلب
مصادقة token/password بدلًا من ذلك.
ولفرض بيانات اعتماد صريحة بسر مشترك، اضبط `gateway.auth.allowTailscale: false`
واستخدم `gateway.auth.mode: "token"` أو `"password"`.

## أمثلة على الإعدادات

### Tailnet فقط (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

افتح: `https://<magicdns>/` (أو `gateway.controlUi.basePath` المهيأ لديك)

### Tailnet فقط (الربط بعنوان Tailnet IP)

استخدم هذا عندما تريد أن يستمع Gateway مباشرةً على عنوان Tailnet IP (من دون Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

اتصل من جهاز Tailnet آخر:

- Control UI: ‏`http://<tailscale-ip>:18789/`
- WebSocket: ‏`ws://<tailscale-ip>:18789`

ملاحظة: لن يعمل loopback ‏(`http://127.0.0.1:18789`) **في هذا الوضع**.

### الإنترنت العام (Funnel + كلمة مرور مشتركة)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

يفضَّل استخدام `OPENCLAW_GATEWAY_PASSWORD` بدلًا من حفظ كلمة مرور على القرص.

## أمثلة CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## ملاحظات

- يتطلب Tailscale Serve/Funnel أن تكون CLI الخاصة بـ `tailscale` مثبتة ومسجّلًا الدخول فيها.
- يرفض `tailscale.mode: "funnel"` بدء التشغيل ما لم يكن وضع المصادقة `password` لتجنب التعريض العام.
- اضبط `gateway.tailscale.resetOnExit` إذا كنت تريد من OpenClaw التراجع عن إعدادات `tailscale serve`
  أو `tailscale funnel` عند الإيقاف.
- `gateway.bind: "tailnet"` هو ربط مباشر بـ Tailnet (من دون HTTPS، ومن دون Serve/Funnel).
- يفضّل `gateway.bind: "auto"` استخدام loopback؛ استخدم `tailnet` إذا كنت تريد Tailnet فقط.
- لا يعرّض Serve/Funnel إلا **Control UI + WS الخاصة بـ Gateway**. وتتصل العُقد عبر
  نقطة نهاية Gateway WS نفسها، لذا يمكن أن يعمل Serve أيضًا للوصول إلى العُقد.

## التحكم عبر المتصفح (Gateway بعيد + متصفح محلي)

إذا كنت تشغّل Gateway على جهاز وتريد قيادة متصفح على جهاز آخر،
فشغّل **node host** على جهاز المتصفح وأبقِ الجهازين على tailnet نفسها.
وسيقوم Gateway بتمرير إجراءات المتصفح إلى العقدة؛ ولا حاجة إلى خادم تحكم منفصل أو عنوان Serve URL.

تجنب Funnel للتحكم بالمتصفح؛ وتعامل مع اقتران العقدة على أنه وصول مشغّل.

## المتطلبات المسبقة والقيود الخاصة بـ Tailscale

- يتطلب Serve تمكين HTTPS في tailnet الخاصة بك؛ وتعرض CLI مطالبة إذا كان مفقودًا.
- يحقن Serve ترويسات هوية Tailscale؛ أما Funnel فلا يفعل ذلك.
- يتطلب Funnel إصدار Tailscale v1.38.3+ وMagicDNS وتمكين HTTPS وسمة funnel node.
- لا يدعم Funnel إلا المنافذ `443` و`8443` و`10000` عبر TLS.
- يتطلب Funnel على macOS استخدام إصدار تطبيق Tailscale مفتوح المصدر.

## تعلّم المزيد

- نظرة عامة على Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- أمر `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- نظرة عامة على Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- أمر `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## ذو صلة

- [الوصول عن بُعد](/ar/gateway/remote)
- [Discovery](/ar/gateway/discovery)
- [المصادقة](/ar/gateway/authentication)

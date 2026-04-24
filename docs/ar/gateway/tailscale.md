---
read_when:
    - كشف Control UI الخاصة بـ Gateway خارج localhost
    - أتمتة الوصول إلى dashboard عبر tailnet أو بشكل عام
summary: تكامل Tailscale Serve/Funnel من أجل Dashboard الخاصة بـ Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-24T07:44:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 30bfe5fa2c9295dcf7164a1a89876d2e097f54d42bd261dfde973fddbd9185ce
    source_path: gateway/tailscale.md
    workflow: 15
---

# Tailscale (Dashboard الخاصة بـ Gateway)

يمكن لـ OpenClaw إعداد Tailscale **Serve** (tailnet) أو **Funnel** (عام) تلقائيًا من أجل
Dashboard الخاصة بـ Gateway ومنفذ WebSocket. وهذا يُبقي Gateway مرتبطة بـ loopback بينما
يوفّر Tailscale بروتوكول HTTPS، والتوجيه، و(في حالة Serve) رؤوس الهوية.

## الأوضاع

- `serve`: خدمة Serve داخل tailnet فقط عبر `tailscale serve`. تبقى gateway على `127.0.0.1`.
- `funnel`: HTTPS عام عبر `tailscale funnel`. يتطلب OpenClaw كلمة مرور مشتركة.
- `off`: الافتراضي (من دون أتمتة Tailscale).

## المصادقة

اضبط `gateway.auth.mode` للتحكم في المصافحة:

- `none` (للإدخال الخاص فقط)
- `token` (الافتراضي عندما يكون `OPENCLAW_GATEWAY_TOKEN` مضبوطًا)
- `password` (سر مشترك عبر `OPENCLAW_GATEWAY_PASSWORD` أو الإعداد)
- `trusted-proxy` (reverse proxy مدرك للهوية؛ راجع [Trusted Proxy Auth](/ar/gateway/trusted-proxy-auth))

عندما تكون قيمة `tailscale.mode = "serve"` وكان `gateway.auth.allowTailscale` هو `true`،
فيمكن لمصادقة Control UI/WebSocket استخدام رؤوس هوية Tailscale
(`tailscale-user-login`) من دون تقديم token/password. ويتحقق OpenClaw من
الهوية عبر تحليل عنوان `x-forwarded-for` من خلال daemon المحلي لـ Tailscale
(`tailscale whois`) ومطابقته مع الرأس قبل قبوله.
ولا يتعامل OpenClaw مع الطلب على أنه Serve إلا عندما يصل من loopback مع
رؤوس Tailscale `x-forwarded-for` و`x-forwarded-proto` و`x-forwarded-host`.
أما نقاط نهاية HTTP API (مثل `/v1/*` و`/tools/invoke` و`/api/channels/*`)
فلا تستخدم مصادقة رؤوس هوية Tailscale. بل تتبع
وضع مصادقة HTTP العادي الخاص بـ gateway: مصادقة السر المشترك افتراضيًا، أو إعداد
`none` مقصود عبر trusted-proxy / private-ingress.
يفترض هذا التدفق من دون رمز أن مضيف gateway موثوق. وإذا كان من الممكن تشغيل شيفرة محلية غير موثوقة
على المضيف نفسه، فعطّل `gateway.auth.allowTailscale` واطلب
مصادقة token/password بدلًا من ذلك.
ولفرض بيانات اعتماد صريحة قائمة على السر المشترك، اضبط `gateway.auth.allowTailscale: false`
واستخدم `gateway.auth.mode: "token"` أو `"password"`.

## أمثلة الإعداد

### داخل Tailnet فقط (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

افتح: `https://<magicdns>/` (أو المسار الأساسي الذي أعددته في `gateway.controlUi.basePath`)

### داخل Tailnet فقط (الربط بعنوان Tailnet IP)

استخدم هذا عندما تريد أن تستمع Gateway مباشرة على عنوان Tailnet IP (من دون Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

اتصل من جهاز آخر داخل Tailnet:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

ملاحظة: لن يعمل loopback (`http://127.0.0.1:18789`) **في هذا الوضع**.

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

فضّل استخدام `OPENCLAW_GATEWAY_PASSWORD` بدلًا من حفظ كلمة مرور على القرص.

## أمثلة CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## ملاحظات

- يتطلب Tailscale Serve/Funnel أن تكون CLI الخاصة بـ `tailscale` مثبتة ومُسجّل الدخول فيها.
- يرفض `tailscale.mode: "funnel"` البدء ما لم يكن وضع المصادقة هو `password` لتجنب التعرض العام.
- اضبط `gateway.tailscale.resetOnExit` إذا كنت تريد من OpenClaw التراجع عن إعدادات `tailscale serve`
  أو `tailscale funnel` عند الإغلاق.
- `gateway.bind: "tailnet"` هو ربط مباشر داخل Tailnet (من دون HTTPS، ومن دون Serve/Funnel).
- يفضّل `gateway.bind: "auto"` loopback؛ استخدم `tailnet` إذا كنت تريد Tailnet فقط.
- لا يكشف Serve/Funnel إلا **Control UI + WS** الخاصة بـ Gateway. وتتصل Nodes عبر
  نقطة نهاية Gateway WS نفسها، لذلك يمكن لـ Serve أن يعمل أيضًا لوصول Nodes.

## التحكم في المتصفح (Gateway بعيدة + متصفح محلي)

إذا كنت تشغّل Gateway على جهاز وتريد التحكم بمتصفح على جهاز آخر،
فشغّل **مضيف node** على جهاز المتصفح وأبقِ الاثنين على الـ tailnet نفسها.
ستقوم Gateway بتمرير إجراءات المتصفح إلى node؛ ولا حاجة إلى خادم تحكم منفصل أو عنوان Serve.

تجنب Funnel للتحكم في المتصفح؛ وتعامل مع اقتران node كما تتعامل مع وصول operator.

## المتطلبات المسبقة والحدود الخاصة بـ Tailscale

- يتطلب Serve تفعيل HTTPS في tailnet الخاصة بك؛ وستطلب CLI ذلك إذا كان مفقودًا.
- يحقن Serve رؤوس هوية Tailscale؛ أما Funnel فلا يفعل.
- يتطلب Funnel إصدار Tailscale 1.38.3+، وMagicDNS، وHTTPS مفعّلًا، وميزة funnel node attribute.
- لا يدعم Funnel إلا المنافذ `443` و`8443` و`10000` عبر TLS.
- يتطلب Funnel على macOS إصدار تطبيق Tailscale مفتوح المصدر.

## تعلّم المزيد

- نظرة عامة على Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- أمر `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- نظرة عامة على Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- أمر `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## ذو صلة

- [الوصول البعيد](/ar/gateway/remote)
- [الاكتشاف](/ar/gateway/discovery)
- [المصادقة](/ar/gateway/authentication)

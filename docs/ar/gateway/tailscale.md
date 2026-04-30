---
read_when:
    - إتاحة واجهة تحكم Gateway خارج localhost
    - أتمتة الوصول إلى شبكة Tailscale الخاصة أو لوحة التحكم العامة
summary: دمج Tailscale Serve/Funnel في لوحة معلومات Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-04-30T08:02:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: e5bc0a90ce8105017f5f52bad4a40609711f4bd4538437916c020680d3e9eda4
    source_path: gateway/tailscale.md
    workflow: 16
---

يمكن لـ OpenClaw تكوين Tailscale **Serve** (tailnet) أو **Funnel** (عام) تلقائيًا لمنفذ
لوحة تحكم Gateway وWebSocket. يُبقي هذا Gateway مربوطًا بـ loopback بينما
يوفر Tailscale بروتوكول HTTPS والتوجيه و(بالنسبة إلى Serve) ترويسات الهوية.

## الأوضاع

- `serve`: Serve داخل Tailnet فقط عبر `tailscale serve`. يبقى Gateway على `127.0.0.1`.
- `funnel`: HTTPS عام عبر `tailscale funnel`. يتطلب OpenClaw كلمة مرور مشتركة.
- `off`: الافتراضي (لا توجد أتمتة لـ Tailscale).

تستخدم مخرجات الحالة والتدقيق **تعريض Tailscale** لوضع OpenClaw Serve/Funnel
هذا. يعني `off` أن OpenClaw لا يدير Serve أو Funnel؛ ولا يعني أن عفريت
Tailscale المحلي متوقف أو مسجّل الخروج.

## المصادقة

اضبط `gateway.auth.mode` للتحكم في المصافحة:

- `none` (دخول خاص فقط)
- `token` (الافتراضي عند ضبط `OPENCLAW_GATEWAY_TOKEN`)
- `password` (سر مشترك عبر `OPENCLAW_GATEWAY_PASSWORD` أو التكوين)
- `trusted-proxy` (وكيل عكسي مدرك للهوية؛ راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth))

عندما تكون `tailscale.mode = "serve"` ويكون `gateway.auth.allowTailscale` هو `true`،
يمكن لمصادقة واجهة التحكم/WebSocket استخدام ترويسات هوية Tailscale
(`tailscale-user-login`) دون تقديم رمز/كلمة مرور. يتحقق OpenClaw من
الهوية عبر حل عنوان `x-forwarded-for` باستخدام عفريت Tailscale المحلي
(`tailscale whois`) ومطابقته مع الترويسة قبل قبوله. لا يتعامل OpenClaw
مع الطلب على أنه Serve إلا عندما يصل من loopback مع ترويسات Tailscale
`x-forwarded-for` و`x-forwarded-proto` و`x-forwarded-host`.
بالنسبة إلى جلسات مشغّل واجهة التحكم التي تتضمن هوية جهاز المتصفح، يتجاوز
مسار Serve المتحقق هذا أيضًا رحلة إقران الجهاز. ولا يتجاوز هوية جهاز المتصفح:
فالعملاء بلا جهاز ما زالوا مرفوضين، كما أن اتصالات دور العقدة أو اتصالات
WebSocket غير التابعة لواجهة التحكم ما زالت تتبع فحوصات الإقران والمصادقة
العادية.
لا تستخدم نقاط نهاية HTTP API (على سبيل المثال `/v1/*` و`/tools/invoke` و`/api/channels/*`)
مصادقة ترويسة هوية Tailscale. فهي ما زالت تتبع وضع مصادقة HTTP العادي
في Gateway: مصادقة بالسر المشترك افتراضيًا، أو إعداد `none` لوكيل موثوق /
دخول خاص مكوّن عن قصد.
يفترض هذا التدفق بلا رمز أن مضيف Gateway موثوق. إذا كان من الممكن تشغيل
تعليمات برمجية محلية غير موثوقة على المضيف نفسه، فعطّل `gateway.auth.allowTailscale`
واطلب بدلًا من ذلك مصادقة بالرمز/كلمة المرور.
لطلب بيانات اعتماد صريحة بسر مشترك، اضبط `gateway.auth.allowTailscale: false`
واستخدم `gateway.auth.mode: "token"` أو `"password"`.

## أمثلة التكوين

### Tailnet فقط (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

افتح: `https://<magicdns>/` (أو `gateway.controlUi.basePath` المكوّن لديك)

### Tailnet فقط (الربط بعنوان IP الخاص بـ Tailnet)

استخدم هذا عندما تريد أن يستمع Gateway مباشرة على عنوان IP الخاص بـ Tailnet (من دون Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

اتصل من جهاز Tailnet آخر:

- واجهة التحكم: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
لن يعمل Loopback (`http://127.0.0.1:18789`) في هذا الوضع.
</Note>

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

فضّل `OPENCLAW_GATEWAY_PASSWORD` على تثبيت كلمة مرور على القرص.

## أمثلة CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## ملاحظات

- يتطلب Tailscale Serve/Funnel تثبيت CLI الخاص بـ `tailscale` وتسجيل الدخول.
- يرفض `tailscale.mode: "funnel"` البدء ما لم يكن وضع المصادقة `password` لتجنب التعريض العام.
- اضبط `gateway.tailscale.resetOnExit` إذا أردت أن يتراجع OpenClaw عن تكوين `tailscale serve`
  أو `tailscale funnel` عند إيقاف التشغيل.
- `gateway.bind: "tailnet"` هو ربط مباشر بـ Tailnet (من دون HTTPS، ومن دون Serve/Funnel).
- يفضّل `gateway.bind: "auto"` استخدام loopback؛ استخدم `tailnet` إذا كنت تريد Tailnet فقط.
- لا يعرّض Serve/Funnel إلا **واجهة تحكم Gateway + WS**. تتصل العقد عبر
  نقطة نهاية WS نفسها الخاصة بـ Gateway، لذلك يمكن أن يعمل Serve لوصول العقد.

## التحكم في المتصفح (Gateway بعيد + متصفح محلي)

إذا كنت تشغّل Gateway على جهاز واحد لكنك تريد التحكم في متصفح على جهاز آخر،
فشغّل **مضيف عقدة** على جهاز المتصفح وأبقِ الاثنين على tailnet نفسها.
سيقوم Gateway بتمرير إجراءات المتصفح إلى العقدة؛ ولا حاجة إلى خادم تحكم منفصل أو عنوان URL لـ Serve.

تجنب Funnel للتحكم في المتصفح؛ وتعامل مع إقران العقد مثل وصول المشغّل.

## متطلبات Tailscale المسبقة + الحدود

- يتطلب Serve تمكين HTTPS لـ tailnet الخاصة بك؛ يطالبك CLI إذا كان مفقودًا.
- يحقن Serve ترويسات هوية Tailscale؛ أما Funnel فلا يفعل ذلك.
- يتطلب Funnel إصدار Tailscale v1.38.3+، وMagicDNS، وتمكين HTTPS، وسمة عقدة Funnel.
- لا يدعم Funnel إلا المنافذ `443` و`8443` و`10000` عبر TLS.
- يتطلب Funnel على macOS متغير تطبيق Tailscale مفتوح المصدر.

## تعلّم المزيد

- نظرة عامة على Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- أمر `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- نظرة عامة على Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- أمر `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## ذو صلة

- [الوصول البعيد](/ar/gateway/remote)
- [الاكتشاف](/ar/gateway/discovery)
- [المصادقة](/ar/gateway/authentication)

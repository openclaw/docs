---
read_when:
    - إتاحة واجهة التحكم في Gateway خارج المضيف المحلي
    - أتمتة الوصول إلى شبكة Tailscale الخاصة أو لوحة المعلومات العامة
summary: Tailscale Serve/Funnel مدمج للوحة معلومات Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-05-06T17:58:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89a2094dc5d9250b3af2dcc991e83099bdf6fc4039c86358ca57f7e58899196d
    source_path: gateway/tailscale.md
    workflow: 16
---

يمكن لـ OpenClaw تهيئة Tailscale **Serve** (tailnet) أو **Funnel** (عام) تلقائيًا للوحة تحكم Gateway ومنفذ WebSocket. يُبقي هذا Gateway مرتبطًا بـ loopback بينما يوفّر Tailscale بروتوكول HTTPS والتوجيه، و(في حالة Serve) ترويسات الهوية.

## الأوضاع

- `serve`: Serve مخصص للـ Tailnet فقط عبر `tailscale serve`. يبقى Gateway على `127.0.0.1`.
- `funnel`: HTTPS عام عبر `tailscale funnel`. يتطلب OpenClaw كلمة مرور مشتركة.
- `off`: الإعداد الافتراضي (لا توجد أتمتة لـ Tailscale).

تستخدم مخرجات الحالة والتدقيق **تعرّض Tailscale** لوضع OpenClaw Serve/Funnel هذا. يعني `off` أن OpenClaw لا يدير Serve أو Funnel؛ ولا يعني أن عفريت Tailscale المحلي متوقف أو مسجّل الخروج.

## المصادقة

اضبط `gateway.auth.mode` للتحكم في المصافحة:

- `none` (دخول خاص فقط)
- `token` (الافتراضي عند ضبط `OPENCLAW_GATEWAY_TOKEN`)
- `password` (سر مشترك عبر `OPENCLAW_GATEWAY_PASSWORD` أو التكوين)
- `trusted-proxy` (وكيل عكسي واعٍ بالهوية؛ راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth))

عندما يكون `tailscale.mode = "serve"` و`gateway.auth.allowTailscale` هو `true`، يمكن لمصادقة Control UI/WebSocket استخدام ترويسات هوية Tailscale (`tailscale-user-login`) دون تقديم رمز مميز/كلمة مرور. يتحقق OpenClaw من الهوية بحل عنوان `x-forwarded-for` عبر عفريت Tailscale المحلي (`tailscale whois`) ومطابقته مع الترويسة قبل قبولها. لا يتعامل OpenClaw مع الطلب على أنه Serve إلا عندما يصل من loopback مع ترويسات Tailscale وهي `x-forwarded-for` و`x-forwarded-proto` و`x-forwarded-host`.
بالنسبة إلى جلسات مشغّل Control UI التي تتضمن هوية جهاز المتصفح، يتجاوز مسار Serve المتحقق هذا أيضًا رحلة اقتران الجهاز. لكنه لا يتجاوز هوية جهاز المتصفح: لا يزال العملاء بلا جهاز مرفوضين، ولا تزال اتصالات WebSocket الخاصة بدور العقدة أو غير الخاصة بـ Control UI تتبع فحوصات الاقتران والمصادقة العادية.
نقاط نهاية HTTP API (على سبيل المثال `/v1/*` و`/tools/invoke` و`/api/channels/*`) **لا** تستخدم مصادقة ترويسات هوية Tailscale. فهي لا تزال تتبع وضع مصادقة HTTP العادي للـ Gateway: مصادقة السر المشترك افتراضيًا، أو إعداد `none` موثوق الوكيل / الدخول الخاص الذي تم تكوينه عمدًا.
يفترض هذا التدفق بلا رمز مميز أن مضيف Gateway موثوق. إذا كان من الممكن تشغيل كود محلي غير موثوق على المضيف نفسه، فعطّل `gateway.auth.allowTailscale` واطلب بدلًا من ذلك مصادقة الرمز المميز/كلمة المرور.
لطلب بيانات اعتماد صريحة بسر مشترك، اضبط `gateway.auth.allowTailscale: false` واستخدم `gateway.auth.mode: "token"` أو `"password"`.

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

افتح: `https://<magicdns>/` (أو `gateway.controlUi.basePath` الذي قمت بتكوينه)

### Tailnet فقط (الربط بعنوان IP الخاص بـ Tailnet)

استخدم هذا عندما تريد أن يستمع Gateway مباشرة على عنوان IP الخاص بـ Tailnet (بدون Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

اتصل من جهاز Tailnet آخر:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
لن يعمل loopback (`http://127.0.0.1:18789`) في هذا الوضع.
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

فضّل `OPENCLAW_GATEWAY_PASSWORD` على تثبيت كلمة مرور في القرص.

## أمثلة CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## ملاحظات

- يتطلب Tailscale Serve/Funnel تثبيت CLI الخاص بـ `tailscale` وتسجيل الدخول إليه.
- يرفض `tailscale.mode: "funnel"` البدء ما لم يكن وضع المصادقة `password` لتجنب التعرض العام.
- اضبط `gateway.tailscale.resetOnExit` إذا كنت تريد من OpenClaw التراجع عن تكوين `tailscale serve` أو `tailscale funnel` عند إيقاف التشغيل.
- `gateway.bind: "tailnet"` هو ربط مباشر بـ Tailnet (لا HTTPS، ولا Serve/Funnel).
- يفضّل `gateway.bind: "auto"` استخدام loopback؛ استخدم `tailnet` إذا كنت تريد Tailnet فقط.
- لا يعرّض Serve/Funnel إلا **واجهة تحكم Gateway + WS**. تتصل العقد عبر نقطة نهاية Gateway WS نفسها، لذلك يمكن أن يعمل Serve للوصول إلى العقد.

## التحكم في المتصفح (Gateway بعيد + متصفح محلي)

إذا شغّلت Gateway على جهاز واحد لكنك تريد تشغيل متصفح على جهاز آخر، فشغّل **مضيف عقدة** على جهاز المتصفح وأبقِ كليهما على tailnet نفسها. سيقوم Gateway بتمرير إجراءات المتصفح إلى العقدة؛ لا حاجة إلى خادم تحكم منفصل أو عنوان URL خاص بـ Serve.

تجنب Funnel للتحكم في المتصفح؛ تعامل مع اقتران العقد مثل وصول المشغّل.

## متطلبات Tailscale المسبقة + الحدود

- يتطلب Serve تمكين HTTPS للـ tailnet الخاصة بك؛ يطلب CLI ذلك إذا كان مفقودًا.
- يحقن Serve ترويسات هوية Tailscale؛ أما Funnel فلا يفعل ذلك.
- يتطلب Funnel إصدار Tailscale v1.38.3+، وMagicDNS، وتمكين HTTPS، وسمة عقدة funnel.
- يدعم Funnel المنافذ `443` و`8443` و`10000` فقط عبر TLS.
- يتطلب Funnel على macOS متغير تطبيق Tailscale مفتوح المصدر.

## تعلّم المزيد

- نظرة عامة على Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- أمر `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- نظرة عامة على Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- أمر `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## ذات صلة

- [الوصول عن بُعد](/ar/gateway/remote)
- [الاكتشاف](/ar/gateway/discovery)
- [المصادقة](/ar/gateway/authentication)

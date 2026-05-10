---
read_when:
    - إتاحة واجهة التحكم في Gateway خارج localhost
    - أتمتة الوصول إلى شبكة tailnet أو لوحة المعلومات العامة
summary: دمج Tailscale Serve/Funnel للوحة معلومات Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-05-10T19:42:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: e3a90145b9884f31d43fabaddabe17e6ba017dabaec6e6e7d263dacefb33f1b6
    source_path: gateway/tailscale.md
    workflow: 16
---

يمكن لـ OpenClaw تكوين Tailscale **Serve** (tailnet) أو **Funnel** (عام) تلقائيًا للوحة معلومات Gateway ومنفذ WebSocket. يُبقي ذلك Gateway مرتبطًا بـ loopback بينما يوفّر Tailscale HTTPS والتوجيه و(في Serve) ترويسات الهوية.

## الأوضاع

- `serve`: Serve مقتصر على Tailnet عبر `tailscale serve`. يبقى gateway على `127.0.0.1`.
- `funnel`: HTTPS عام عبر `tailscale funnel`. يتطلب OpenClaw كلمة مرور مشتركة.
- `off`: الافتراضي (لا توجد أتمتة لـ Tailscale).

تستخدم مخرجات الحالة والتدقيق **تعرّض Tailscale** لوضع OpenClaw Serve/Funnel هذا. يعني `off` أن OpenClaw لا يدير Serve أو Funnel؛ ولا يعني أن عفريت Tailscale المحلي متوقف أو تم تسجيل خروجه.

## المصادقة

اضبط `gateway.auth.mode` للتحكم في المصافحة:

- `none` (دخول خاص فقط)
- `token` (الافتراضي عند تعيين `OPENCLAW_GATEWAY_TOKEN`)
- `password` (سر مشترك عبر `OPENCLAW_GATEWAY_PASSWORD` أو الإعدادات)
- `trusted-proxy` (وكيل عكسي مدرك للهوية؛ راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth))

عندما يكون `tailscale.mode = "serve"` و`gateway.auth.allowTailscale` هو `true`، يمكن لمصادقة Control UI/WebSocket استخدام ترويسات هوية Tailscale (`tailscale-user-login`) من دون تقديم رمز/كلمة مرور. يتحقق OpenClaw من الهوية عبر حل عنوان `x-forwarded-for` بواسطة عفريت Tailscale المحلي (`tailscale whois`) ومطابقته مع الترويسة قبل قبوله. لا يتعامل OpenClaw مع الطلب على أنه Serve إلا عندما يصل من loopback مع ترويسات Tailscale وهي `x-forwarded-for` و`x-forwarded-proto` و`x-forwarded-host`.
بالنسبة إلى جلسات مشغل Control UI التي تتضمن هوية جهاز المتصفح، يتخطى مسار Serve المتحقق هذا أيضًا رحلة إقران الجهاز. وهو لا يتجاوز هوية جهاز المتصفح: تظل العملاء من دون جهاز مرفوضة، وتظل اتصالات WebSocket ذات دور العقدة أو غير الخاصة بـ Control UI تتبع فحوص الإقران والمصادقة العادية.
لا تستخدم نقاط نهاية HTTP API (مثل `/v1/*` و`/tools/invoke` و`/api/channels/*`) مصادقة ترويسات هوية Tailscale. فهي لا تزال تتبع وضع مصادقة HTTP العادي لـ gateway: مصادقة السر المشترك افتراضيًا، أو إعداد `none` مكوّنًا عن قصد لوكيل موثوق / دخول خاص.
يفترض هذا التدفق بلا رمز أن مضيف gateway موثوق. إذا كان يمكن تشغيل كود محلي غير موثوق على المضيف نفسه، فعطّل `gateway.auth.allowTailscale` واشترط مصادقة الرمز/كلمة المرور بدلًا من ذلك.
لاشتراط بيانات اعتماد صريحة بسر مشترك، اضبط `gateway.auth.allowTailscale: false` واستخدم `gateway.auth.mode: "token"` أو `"password"`.

## أمثلة الإعدادات

### مقتصر على Tailnet (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

افتح: `https://<magicdns>/` (أو `gateway.controlUi.basePath` الذي قمت بتكوينه)

### مقتصر على Tailnet (الربط بعنوان IP الخاص بـ Tailnet)

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

- Control UI: `http://<tailscale-ip>:18789/`
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

فضّل `OPENCLAW_GATEWAY_PASSWORD` على حفظ كلمة مرور في القرص.

## أمثلة CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## ملاحظات

- يتطلب Tailscale Serve/Funnel تثبيت `tailscale` CLI وتسجيل الدخول.
- يرفض `tailscale.mode: "funnel"` البدء ما لم يكن وضع المصادقة `password` لتجنب التعرض العام.
- اضبط `gateway.tailscale.resetOnExit` إذا أردت أن يتراجع OpenClaw عن إعدادات `tailscale serve` أو `tailscale funnel` عند إيقاف التشغيل.
- اضبط `gateway.tailscale.preserveFunnel: true` للإبقاء على مسار `tailscale funnel` مكوّن خارجيًا نشطًا عبر عمليات إعادة تشغيل gateway. عند تمكين ذلك وتشغيل gateway في `mode: "serve"`، يتحقق OpenClaw من `tailscale funnel status` قبل إعادة تطبيق Serve ويتخطاه عندما يغطي مسار Funnel منفذ gateway بالفعل. لا تتغير سياسة Funnel المُدارة من OpenClaw والمقتصرة على كلمة المرور.
- `gateway.bind: "tailnet"` هو ربط مباشر بـ Tailnet (لا HTTPS، ولا Serve/Funnel).
- يفضل `gateway.bind: "auto"` loopback؛ استخدم `tailnet` إذا أردت Tailnet فقط.
- لا يكشف Serve/Funnel إلا **واجهة تحكم Gateway + WS**. تتصل العقد عبر نقطة نهاية Gateway WS نفسها، لذلك يمكن أن يعمل Serve للوصول إلى العقد.

## التحكم في المتصفح (Gateway بعيد + متصفح محلي)

إذا شغّلت Gateway على جهاز لكنك تريد تشغيل متصفح على جهاز آخر، فشغّل **مضيف عقدة** على جهاز المتصفح وأبقِ الاثنين على tailnet نفسها. سيوكّل Gateway إجراءات المتصفح إلى العقدة؛ لا حاجة إلى خادم تحكم منفصل أو عنوان URL لـ Serve.

تجنب Funnel للتحكم في المتصفح؛ عامل إقران العقد مثل وصول المشغل.

## متطلبات Tailscale المسبقة + الحدود

- يتطلب Serve تمكين HTTPS لـ tailnet الخاصة بك؛ يطلب CLI ذلك إذا كان مفقودًا.
- يحقن Serve ترويسات هوية Tailscale؛ أما Funnel فلا يفعل.
- يتطلب Funnel إصدار Tailscale v1.38.3+، وMagicDNS، وتمكين HTTPS، وسمة عقدة funnel.
- لا يدعم Funnel إلا المنافذ `443` و`8443` و`10000` عبر TLS.
- يتطلب Funnel على macOS متغير تطبيق Tailscale مفتوح المصدر.

## اعرف المزيد

- نظرة عامة على Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- أمر `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- نظرة عامة على Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- أمر `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## ذات صلة

- [الوصول عن بُعد](/ar/gateway/remote)
- [الاكتشاف](/ar/gateway/discovery)
- [المصادقة](/ar/gateway/authentication)

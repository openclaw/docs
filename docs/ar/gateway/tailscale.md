---
read_when:
    - إتاحة واجهة التحكم في Gateway خارج localhost
    - أتمتة الوصول إلى tailnet أو لوحة المعلومات العامة
summary: دمج Tailscale Serve/Funnel للوحة معلومات Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-06-27T17:44:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35944eba19cd82d373b25c602b66d1b76f35ad63aa90767bb1c7ef75549fe905
    source_path: gateway/tailscale.md
    workflow: 16
---

يمكن لـ OpenClaw تهيئة Tailscale **Serve** (tailnet) أو **Funnel** (عام) تلقائيًا لمنفذ
لوحة معلومات Gateway وWebSocket. يُبقي هذا Gateway مرتبطًا بـ loopback بينما
يوفر Tailscale HTTPS والتوجيه و(في Serve) رؤوس الهوية.

## الأوضاع

- `serve`: Serve مخصص للـ Tailnet فقط عبر `tailscale serve`. يبقى gateway على `127.0.0.1`.
- `funnel`: HTTPS عام عبر `tailscale funnel`. يتطلب OpenClaw كلمة مرور مشتركة.
- `off`: الافتراضي (بلا أتمتة Tailscale).

تستخدم مخرجات الحالة والتدقيق **تعريض Tailscale** لوضع OpenClaw Serve/Funnel هذا.
يعني `off` أن OpenClaw لا يدير Serve أو Funnel؛ ولا يعني أن عفريت Tailscale
المحلي متوقف أو مسجل الخروج.

## المصادقة

اضبط `gateway.auth.mode` للتحكم في المصافحة:

- `none` (دخول خاص فقط)
- `token` (الافتراضي عند ضبط `OPENCLAW_GATEWAY_TOKEN`)
- `password` (سر مشترك عبر `OPENCLAW_GATEWAY_PASSWORD` أو الإعدادات)
- `trusted-proxy` (وكيل عكسي واع بالهوية؛ راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth))

عندما يكون `tailscale.mode = "serve"` و`gateway.auth.allowTailscale` هو `true`،
يمكن لمصادقة Control UI/WebSocket استخدام رؤوس هوية Tailscale
(`tailscale-user-login`) من دون تقديم رمز/كلمة مرور. يتحقق OpenClaw من
الهوية عبر حل عنوان `x-forwarded-for` من خلال عفريت Tailscale المحلي
(`tailscale whois`) ومطابقته مع الرأس قبل قبوله.
لا يتعامل OpenClaw مع الطلب على أنه Serve إلا عندما يصل من loopback مع
رؤوس Tailscale وهي `x-forwarded-for` و`x-forwarded-proto` و`x-forwarded-host`.
بالنسبة لجلسات مشغل Control UI التي تتضمن هوية جهاز المتصفح، يتجاوز
مسار Serve المتحقق منه هذا أيضًا رحلة اقتران الجهاز. ولا يتجاوز
هوية جهاز المتصفح: لا يزال العملاء بلا جهاز مرفوضين، ولا تزال اتصالات
دور العقدة أو اتصالات WebSocket غير الخاصة بـ Control UI تتبع فحوصات
الاقتران والمصادقة المعتادة.
لا تستخدم نقاط نهاية HTTP API (على سبيل المثال `/v1/*` و`/tools/invoke` و`/api/channels/*`)
مصادقة رؤوس هوية Tailscale. فهي لا تزال تتبع وضع مصادقة HTTP العادي في gateway:
مصادقة السر المشترك افتراضيًا، أو إعداد `none` لدخول خاص / وكيل موثوق
مهيأ عمدًا.
يفترض هذا التدفق بلا رمز أن مضيف gateway موثوق. إذا كان من الممكن تشغيل
كود محلي غير موثوق على المضيف نفسه، فعطّل `gateway.auth.allowTailscale` واطلب
مصادقة الرمز/كلمة المرور بدلًا من ذلك.
لطلب بيانات اعتماد صريحة بسر مشترك، اضبط `gateway.auth.allowTailscale: false`
واستخدم `gateway.auth.mode: "token"` أو `"password"`.

## أمثلة الإعدادات

### Tailnet فقط (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

افتح: `https://<magicdns>/` (أو `gateway.controlUi.basePath` الذي ضبطته)

لتعريض Control UI عبر Tailscale Service مسماة بدلًا من اسم مضيف الجهاز،
اضبط `gateway.tailscale.serviceName` على اسم Service:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

باستخدام المثال أعلاه، يبلغ بدء التشغيل عن عنوان URL للـ Service باعتباره
`https://openclaw.<tailnet-name>.ts.net/` بدلًا من اسم مضيف الجهاز.
تتطلب Tailscale Services أن يكون المضيف عقدة موسومة ومعتمدة في
tailnet لديك. اضبط الوسم واعتمد Service في Tailscale قبل تمكين
هذا الخيار، وإلا سيفشل `tailscale serve --service=...` أثناء بدء تشغيل gateway.

### Tailnet فقط (الربط بعنوان IP الخاص بـ Tailnet)

استخدم هذا عندما تريد أن يستمع Gateway مباشرة على عنوان IP الخاص بـ Tailnet (بلا Serve/Funnel).

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

فضّل `OPENCLAW_GATEWAY_PASSWORD` على تثبيت كلمة مرور على القرص.

## أمثلة CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## ملاحظات

- يتطلب Tailscale Serve/Funnel تثبيت `tailscale` CLI وتسجيل الدخول إليه.
- يرفض `tailscale.mode: "funnel"` البدء ما لم يكن وضع المصادقة `password` لتجنب التعريض العام.
- ينطبق `gateway.tailscale.serviceName` على وضع Serve فقط ويمرر إلى
  `tailscale serve --service=<name>`. يجب أن تستخدم القيمة تنسيق اسم Service في Tailscale
  وهو `svc:<dns-label>`، على سبيل المثال `svc:openclaw`.
  يتطلب Tailscale أن تكون مضيفات Service عقدًا موسومة، وقد تحتاج Service
  إلى اعتماد في وحدة تحكم المسؤول قبل أن يتمكن Serve من نشرها.
- اضبط `gateway.tailscale.resetOnExit` إذا كنت تريد أن يتراجع OpenClaw عن إعداد
  `tailscale serve` أو `tailscale funnel` عند إيقاف التشغيل.
- اضبط `gateway.tailscale.preserveFunnel: true` للإبقاء على مسار
  `tailscale funnel` مهيأ خارجيًا نشطًا عبر عمليات إعادة تشغيل gateway. عند تمكينه وتشغيل
  gateway في `mode: "serve"`، يفحص OpenClaw حالة `tailscale funnel status`
  قبل إعادة تطبيق Serve ويتخطاه عندما يكون هناك مسار Funnel يغطي بالفعل
  منفذ gateway. تبقى سياسة Funnel المُدارة من OpenClaw والمقتصرة على كلمة المرور دون تغيير.
- `gateway.bind: "tailnet"` هو ربط مباشر بـ Tailnet (بلا HTTPS، وبلا Serve/Funnel).
- يفضل `gateway.bind: "auto"` استخدام loopback؛ استخدم `tailnet` إذا أردت Tailnet فقط.
- يعرّض Serve/Funnel **واجهة تحكم Gateway + WS** فقط. تتصل العقد عبر
  نقطة نهاية Gateway WS نفسها، لذلك يمكن أن يعمل Serve لوصول العقد.

## التحكم بالمتصفح (Gateway بعيد + متصفح محلي)

إذا شغّلت Gateway على جهاز واحد لكنك تريد قيادة متصفح على جهاز آخر،
فشغّل **مضيف عقدة** على جهاز المتصفح وأبقِ كليهما على tailnet نفسها.
سيقوم Gateway بتمرير إجراءات المتصفح إلى العقدة؛ ولا يلزم خادم تحكم منفصل أو عنوان URL خاص بـ Serve.

تجنب Funnel للتحكم بالمتصفح؛ وتعامل مع اقتران العقد مثل وصول المشغل.

## متطلبات Tailscale المسبقة + الحدود

- يتطلب Serve تمكين HTTPS للـ tailnet لديك؛ يطلب CLI ذلك إذا كان مفقودًا.
- يحقن Serve رؤوس هوية Tailscale؛ أما Funnel فلا يفعل.
- يتطلب Funnel إصدار Tailscale v1.38.3+ وMagicDNS وتمكين HTTPS وسمة عقدة funnel.
- يدعم Funnel فقط المنافذ `443` و`8443` و`10000` عبر TLS.
- يتطلب Funnel على macOS متغير تطبيق Tailscale مفتوح المصدر.

## تعلّم المزيد

- نظرة عامة على Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- أمر `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- نظرة عامة على Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- أمر `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## ذو صلة

- [الوصول عن بُعد](/ar/gateway/remote)
- [الاكتشاف](/ar/gateway/discovery)
- [المصادقة](/ar/gateway/authentication)

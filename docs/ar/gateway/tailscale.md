---
read_when:
    - إتاحة واجهة التحكم في Gateway خارج المضيف المحلي
    - أتمتة الوصول إلى لوحة المعلومات عبر tailnet أو العامة
summary: دمج Tailscale Serve/Funnel للوحة معلومات Gateway
title: Tailscale
x-i18n:
    generated_at: "2026-07-12T06:00:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e201a64ac427994401fae1b934d94e0c5afe976b4acd34d45b059978f5f1807e
    source_path: gateway/tailscale.md
    workflow: 16
---

يمكن لـ OpenClaw تهيئة Tailscale **Serve** (ضمن tailnet) أو **Funnel** (عام) تلقائيًا للوحة معلومات Gateway ومنفذ WebSocket. يُبقي هذا Gateway مرتبطًا بواجهة loopback، بينما يوفّر Tailscale بروتوكول HTTPS والتوجيه وترويسات الهوية (في حالة Serve).

## الأوضاع

`gateway.tailscale.mode`:

| الوضع           | السلوك                                                                             |
| --------------- | ---------------------------------------------------------------------------------- |
| `serve`         | خدمة Serve ضمن Tailnet فقط عبر `tailscale serve`. يظل Gateway على `127.0.0.1`.     |
| `funnel`        | بروتوكول HTTPS عام عبر `tailscale funnel`. يتطلب كلمة مرور مشتركة.                 |
| `off` (افتراضي) | لا توجد أتمتة لـ Tailscale.                                                        |

تستخدم مخرجات الحالة والتدقيق مصطلح **إتاحة Tailscale** لوضع Serve/Funnel هذا في OpenClaw. يعني `off` أن OpenClaw لا يدير Serve أو Funnel؛ ولا يعني أن عفريت Tailscale المحلي متوقف أو مسجّل الخروج.

## أمثلة التهيئة

### ضمن Tailnet فقط (Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

افتح: `https://<magicdns>/` (أو `gateway.controlUi.basePath` الذي هيّأته)

لإتاحة واجهة التحكم عبر خدمة Tailscale مسماة بدلًا من اسم مضيف الجهاز، اضبط `gateway.tailscale.serviceName` على اسم الخدمة:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve", serviceName: "svc:openclaw" },
  },
}
```

عندئذٍ يُبلّغ بدء التشغيل عن عنوان URL للخدمة بالشكل `https://openclaw.<tailnet-name>.ts.net/` بدلًا من اسم مضيف الجهاز. تتطلب خدمات Tailscale أن يكون المضيف عقدة موسومة معتمدة في شبكة tailnet لديك — هيّئ الوسم واعتمد الخدمة في Tailscale قبل تمكين ذلك، وإلا يفشل `tailscale serve --service=...` أثناء بدء تشغيل Gateway.

### ضمن Tailnet فقط (الربط بعنوان IP لشبكة Tailnet)

استخدم هذا لجعل Gateway يستمع مباشرةً على عنوان IP لشبكة Tailnet، من دون Serve/Funnel:

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

اتصل من جهاز آخر ضمن Tailnet:

- واجهة التحكم: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

<Note>
عند توفر عنوان IPv4 قابل للربط ضمن Tailnet، يتطلب Gateway أيضًا `http://127.0.0.1:18789` للعملاء المصادق عليهم على المضيف نفسه. إذا لم يتوفر عنوان Tailnet عند بدء التشغيل، فسيعود إلى loopback فقط؛ أعد التشغيل بعد توفر Tailscale لإضافة الوصول المباشر عبر Tailnet. لا يضيف أي من المسارين إتاحة عبر الشبكة المحلية أو للعامة.
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

فضّل `OPENCLAW_GATEWAY_PASSWORD` على حفظ كلمة مرور على القرص ضمن الملفات الملتزم بها.

## أمثلة CLI

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## المصادقة

يتحكم `gateway.auth.mode` في المصافحة:

| الوضع                                                 | حالة الاستخدام                                                                          |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `none`                                                | دخول خاص فقط                                                                             |
| `token` (الافتراضي عند ضبط `OPENCLAW_GATEWAY_TOKEN`) | رمز مميز مشترك                                                                           |
| `password`                                            | سر مشترك عبر `OPENCLAW_GATEWAY_PASSWORD` أو التهيئة                                      |
| `trusted-proxy`                                       | وكيل عكسي مدرك للهوية؛ راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth)        |

### ترويسات هوية Tailscale (Serve فقط)

عندما يكون `tailscale.mode: "serve"` و`gateway.auth.allowTailscale` مضبوطًا على `true`، يمكن لمصادقة واجهة التحكم/WebSocket استخدام ترويسات هوية Tailscale (`tailscale-user-login`) بدلًا من رمز مميز/كلمة مرور. يتحقق OpenClaw من الترويسة عبر تحليل عنوان `x-forwarded-for` الخاص بالطلب باستخدام عفريت Tailscale المحلي (`tailscale whois`) ومطابقته مع اسم تسجيل الدخول في الترويسة قبل قبوله. لا يتأهل الطلب لهذا المسار إلا عندما يصل من loopback حاملًا ترويسات Tailscale‏ `x-forwarded-for` و`x-forwarded-proto` و`x-forwarded-host`.

يفترض هذا التدفق الخالي من الرموز المميزة أن مضيف Gateway موثوق. إذا كان من الممكن تشغيل شيفرة محلية غير موثوقة على المضيف نفسه، فاضبط `gateway.auth.allowTailscale: false` واطلب بدلًا من ذلك المصادقة برمز مميز/كلمة مرور.

نطاق التجاوز:

- ينطبق فقط على سطح مصادقة WebSocket الخاص بواجهة التحكم. لا تستخدم نقاط نهاية واجهة HTTP API‏ (`/v1/*` و`/tools/invoke` و`/api/channels/*` وغيرها) مطلقًا مصادقة ترويسة هوية Tailscale؛ بل تتبع دائمًا وضع مصادقة HTTP المعتاد لـ Gateway.
- بالنسبة إلى جلسات مشغّل واجهة التحكم التي تحمل بالفعل هوية جهاز المتصفح، تتجاوز هوية Tailscale المتحقق منها رحلة إقران رمز التمهيد/رمز QR.
- لا يتجاوز ذلك هوية الجهاز نفسها: يظل العملاء الذين لا يملكون هوية جهاز مرفوضين، وتظل اتصالات أدوار العقد تمر عبر عمليات الإقران والتحقق من المصادقة المعتادة.

## ملاحظات

- يتطلب Tailscale Serve/Funnel تثبيت CLI الخاص بـ `tailscale` وتسجيل الدخول إليه.
- يرفض `tailscale.mode: "funnel"` بدء التشغيل ما لم يكن وضع المصادقة `password`، لتجنب الإتاحة العامة.
- ينطبق `gateway.tailscale.serviceName` على وضع Serve فقط ويُمرر إلى `tailscale serve --service=<name>`. يجب أن تستخدم القيمة تنسيق Tailscale‏ `svc:<dns-label>`، مثل `svc:openclaw`. يتطلب Tailscale أن تكون مضيفات الخدمة عقدًا موسومة، وقد تحتاج الخدمة إلى اعتماد من وحدة تحكم المشرف قبل أن يتمكن Serve من نشرها.
- يتراجع `gateway.tailscale.resetOnExit` عن تهيئة `tailscale serve`/`tailscale funnel` عند إيقاف التشغيل.
- يُبقي `gateway.tailscale.preserveFunnel: true` مسار `tailscale funnel` المهيأ خارجيًا نشطًا عبر عمليات إعادة تشغيل Gateway. مع `mode: "serve"`، يتحقق OpenClaw من `tailscale funnel status` قبل إعادة تطبيق Serve ويتخطاه عندما يغطي مسار Funnel منفذ Gateway بالفعل. تظل سياسة Funnel الذي يديره OpenClaw والقائمة على كلمة المرور فقط دون تغيير.
- يستخدم `gateway.bind: "tailnet"` ربطًا مباشرًا بشبكة Tailnet (من دون HTTPS أو Serve/Funnel) إضافةً إلى `127.0.0.1` المحلي المطلوب عند توفر عنوان IPv4 لشبكة Tailnet؛ وإلا فإنه يعود إلى loopback فقط.
- يفضّل `gateway.bind: "auto"` واجهة loopback؛ استخدم `tailnet` لقصر إتاحة الشبكة على Tailnet مع الاحتفاظ بوصول loopback على المضيف نفسه.
- لا يتيح Serve/Funnel سوى **واجهة تحكم Gateway + ‏WS**. تتصل العقد عبر نقطة نهاية WS نفسها في Gateway، لذا يعمل Serve للوصول إلى العقد أيضًا.

### متطلبات Tailscale وحدوده

- يتطلب Serve تمكين HTTPS لشبكة tailnet لديك؛ يعرض CLI مطالبة إذا لم يكن مفعّلًا.
- يحقن Serve ترويسات هوية Tailscale؛ أما Funnel فلا يفعل ذلك.
- يتطلب Funnel إصدار Tailscale‏ v1.38.3 أو أحدث وMagicDNS وتمكين HTTPS وسمة عقدة funnel.
- لا يدعم Funnel سوى المنافذ `443` و`8443` و`10000` عبر TLS.
- يتطلب Funnel على macOS إصدار تطبيق Tailscale مفتوح المصدر.

## التحكم في المتصفح (Gateway بعيد + متصفح محلي)

لتشغيل Gateway على جهاز والتحكم في متصفح على جهاز آخر، شغّل **مضيف عقدة** على جهاز المتصفح وأبقِ كليهما على شبكة tailnet نفسها. يمرر Gateway إجراءات المتصفح إلى العقدة؛ ولا حاجة إلى خادم تحكم منفصل أو عنوان URL لخدمة Serve.

تجنب Funnel للتحكم في المتصفح؛ وتعامل مع إقران العقدة مثل وصول المشغّل.

## معرفة المزيد

- نظرة عامة على Tailscale Serve: [https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- أمر `tailscale serve`: [https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- نظرة عامة على Tailscale Funnel: [https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- أمر `tailscale funnel`: [https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)

## ذو صلة

- [الوصول عن بُعد](/ar/gateway/remote)
- [الاكتشاف](/ar/gateway/discovery)
- [المصادقة](/ar/gateway/authentication)

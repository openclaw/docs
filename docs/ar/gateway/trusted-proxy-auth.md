---
read_when:
    - تشغيل OpenClaw خلف proxy مدرك للهوية
    - إعداد Pomerium أو Caddy أو nginx مع OAuth أمام OpenClaw
    - إصلاح أخطاء WebSocket 1008 unauthorized في إعدادات reverse proxy
    - تحديد المكان المناسب لضبط HSTS ورؤوس تدعيم HTTP الأخرى
summary: تفويض مصادقة Gateway إلى reverse proxy موثوق (Pomerium، وCaddy، وnginx + OAuth)
title: مصادقة trusted proxy
x-i18n:
    generated_at: "2026-04-24T07:44:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: af406f218fb91c5ae2fed04921670bfc4cd3d06f51b08eec91cddde4521bf771
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

> ⚠️ **ميزة حساسة أمنيًا.** يفوّض هذا الوضع المصادقة بالكامل إلى reverse proxy الخاص بك. وقد يؤدي الإعداد غير الصحيح إلى كشف Gateway لديك لوصول غير مصرح به. اقرأ هذه الصفحة بعناية قبل التفعيل.

## متى تستخدمه

استخدم وضع المصادقة `trusted-proxy` عندما:

- تشغّل OpenClaw خلف **proxy مدرك للهوية** (Pomerium، أو Caddy + OAuth، أو nginx + oauth2-proxy، أو Traefik + forward auth)
- يتولى proxy جميع المصادقة ويمرر هوية المستخدم عبر الرؤوس
- تكون في بيئة Kubernetes أو حاويات حيث يكون proxy هو المسار الوحيد إلى Gateway
- تواجه أخطاء WebSocket `1008 unauthorized` لأن المتصفحات لا تستطيع تمرير الرموز في حمولة WS

## متى **لا** تستخدمه

- إذا كان proxy لديك لا يصادق المستخدمين (بل هو مجرد منهي TLS أو موازن حمل)
- إذا وُجد أي مسار إلى Gateway يتجاوز proxy (ثغرات جدار ناري، أو وصول من الشبكة الداخلية)
- إذا لم تكن متأكدًا من أن proxy لديك يزيل/يستبدل الرؤوس المُمرَّرة بشكل صحيح
- إذا كنت تحتاج فقط إلى وصول شخصي لمستخدم واحد (فكّر في Tailscale Serve + loopback لإعداد أبسط)

## كيف يعمل

1. يقوم reverse proxy الخاص بك بمصادقة المستخدمين (OAuth، OIDC، SAML، إلخ)
2. يضيف proxy رأسًا يتضمن هوية المستخدم المصادق عليه (مثل `x-forwarded-user: nick@example.com`)
3. يتحقق OpenClaw من أن الطلب جاء من **عنوان IP لـ proxy موثوق** (مضبوط في `gateway.trustedProxies`)
4. يستخرج OpenClaw هوية المستخدم من الرأس المضبوط
5. إذا كان كل شيء صحيحًا، يُصرَّح بالطلب

## سلوك الاقتران في Control UI

عندما تكون قيمة `gateway.auth.mode = "trusted-proxy"` نشطة ويمر الطلب
بفحوصات trusted-proxy، يمكن لجلسات WebSocket الخاصة بـ Control UI الاتصال من دون
هوية اقتران جهاز.

الآثار المترتبة:

- لم يعد الاقتران هو البوابة الأساسية للوصول إلى Control UI في هذا الوضع.
- تصبح سياسة مصادقة reverse proxy لديك و`allowUsers` هما التحكم الفعلي في الوصول.
- أبقِ إدخال gateway مقيدًا بعناوين IP الخاصة بـ trusted proxy فقط (`gateway.trustedProxies` + جدار ناري).

## الإعداد

```json5
{
  gateway: {
    // تتوقع مصادقة trusted-proxy طلبات من مصدر trusted proxy غير loopback
    bind: "lan",

    // حرج: أضف فقط عناوين IP الخاصة بالـ proxy هنا
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // الرأس الذي يحتوي على هوية المستخدم المصادق عليه (مطلوب)
        userHeader: "x-forwarded-user",

        // اختياري: رؤوس يجب أن تكون موجودة (تحقق من الـ proxy)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // اختياري: القصر على مستخدمين محددين (فارغ = السماح للجميع)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

قاعدة وقت التشغيل المهمة:

- ترفض مصادقة trusted-proxy الطلبات القادمة من مصدر loopback (`127.0.0.1`، `::1`، وCIDRs الخاصة بـ loopback).
- لا تستوفي reverse proxies الموجودة على المضيف نفسه عبر loopback شروط مصادقة trusted-proxy.
- بالنسبة إلى إعدادات proxy عبر loopback على المضيف نفسه، استخدم بدلًا من ذلك مصادقة token/password، أو مرّر التوجيه عبر عنوان trusted proxy غير loopback يمكن لـ OpenClaw التحقق منه.
- ما تزال عمليات نشر Control UI غير loopback تحتاج إلى `gateway.controlUi.allowedOrigins` صريحة.
- **أدلة الرؤوس المُمرَّرة تتغلب على محلية loopback.** إذا وصل طلب على loopback لكنه يحمل رؤوس `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` تشير إلى أصل غير محلي، فإن هذا الدليل يُسقط ادعاء المحلية عبر loopback. يُعامل الطلب على أنه بعيد لأغراض الاقتران، ومصادقة trusted-proxy، وضبط هوية الجهاز في Control UI. وهذا يمنع proxy عبر loopback على المضيف نفسه من غسل هوية الرؤوس المُمرَّرة إلى مصادقة trusted-proxy.

### مرجع الإعداد

| الحقل                                       | مطلوب | الوصف                                                                      |
| ------------------------------------------- | ------ | -------------------------------------------------------------------------- |
| `gateway.trustedProxies`                    | نعم    | مصفوفة عناوين IP الخاصة بالـ proxy الموثوق. تُرفض الطلبات من عناوين أخرى. |
| `gateway.auth.mode`                         | نعم    | يجب أن يكون `"trusted-proxy"`                                              |
| `gateway.auth.trustedProxy.userHeader`      | نعم    | اسم الرأس الذي يحتوي على هوية المستخدم المصادق عليه                       |
| `gateway.auth.trustedProxy.requiredHeaders` | لا     | رؤوس إضافية يجب أن تكون موجودة حتى يُعتبر الطلب موثوقًا                  |
| `gateway.auth.trustedProxy.allowUsers`      | لا     | قائمة سماح لهويات المستخدمين. الفارغ يعني السماح لجميع المستخدمين المصادق عليهم. |

## إنهاء TLS وHSTS

استخدم نقطة إنهاء TLS واحدة وطبّق HSTS هناك.

### النمط الموصى به: إنهاء TLS في الـ proxy

عندما يتولى reverse proxy لديك HTTPS من أجل `https://control.example.com`، اضبط
`Strict-Transport-Security` في الـ proxy لهذا النطاق.

- مناسب جيدًا لعمليات النشر المواجهة للإنترنت.
- يُبقي الشهادة + سياسة تدعيم HTTP في مكان واحد.
- يمكن أن يبقى OpenClaw على loopback HTTP خلف الـ proxy.

مثال على قيمة الرأس:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### إنهاء TLS في Gateway

إذا كانت OpenClaw نفسها تخدم HTTPS مباشرة (من دون proxy ينهي TLS)، فاضبط:

```json5
{
  gateway: {
    tls: { enabled: true },
    http: {
      securityHeaders: {
        strictTransportSecurity: "max-age=31536000; includeSubDomains",
      },
    },
  },
}
```

يقبل `strictTransportSecurity` قيمة رأس كسلسلة نصية، أو `false` لتعطيله صراحةً.

### إرشادات الإطلاق

- ابدأ أولًا بقيمة max age قصيرة (مثل `max-age=300`) أثناء التحقق من حركة المرور.
- زدها إلى قيم طويلة الأمد (مثل `max-age=31536000`) فقط بعد ارتفاع الثقة.
- أضف `includeSubDomains` فقط إذا كان كل نطاق فرعي جاهزًا لـ HTTPS.
- استخدم preload فقط إذا كنت تستوفي عمدًا متطلبات preload لمجموعة نطاقاتك الكاملة.
- لا يستفيد التطوير المحلي المعتمد على loopback فقط من HSTS.

## أمثلة إعداد الـ Proxy

### Pomerium

يمرر Pomerium الهوية في `x-pomerium-claim-email` (أو رؤوس claims أخرى) وJWT في `x-pomerium-jwt-assertion`.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // عنوان IP الخاص بـ Pomerium
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-pomerium-claim-email",
        requiredHeaders: ["x-pomerium-jwt-assertion"],
      },
    },
  },
}
```

مقتطف إعداد Pomerium:

```yaml
routes:
  - from: https://openclaw.example.com
    to: http://openclaw-gateway:18789
    policy:
      - allow:
          or:
            - email:
                is: nick@example.com
    pass_identity_headers: true
```

### Caddy مع OAuth

يمكن لـ Caddy مع Plugin `caddy-security` مصادقة المستخدمين وتمرير رؤوس الهوية.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // عنوان IP الخاص بـ Caddy/sidecar proxy
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

مقتطف Caddyfile:

```text
openclaw.example.com {
    authenticate with oauth2_provider
    authorize with policy1

    reverse_proxy openclaw:18789 {
        header_up X-Forwarded-User {http.auth.user.email}
    }
}
```

### nginx + oauth2-proxy

يقوم oauth2-proxy بمصادقة المستخدمين ويمرر الهوية في `x-auth-request-email`.

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["10.0.0.1"], // عنوان IP الخاص بـ nginx/oauth2-proxy
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-auth-request-email",
      },
    },
  },
}
```

مقتطف إعداد nginx:

```nginx
location / {
    auth_request /oauth2/auth;
    auth_request_set $user $upstream_http_x_auth_request_email;

    proxy_pass http://openclaw:18789;
    proxy_set_header X-Auth-Request-Email $user;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

### Traefik مع Forward Auth

```json5
{
  gateway: {
    bind: "lan",
    trustedProxies: ["172.17.0.1"], // عنوان IP الخاص بحاوية Traefik
    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        userHeader: "x-forwarded-user",
      },
    },
  },
}
```

## إعداد token مختلط

يرفض OpenClaw الإعدادات الملتبسة التي يكون فيها كل من `gateway.auth.token` (أو `OPENCLAW_GATEWAY_TOKEN`) ووضع `trusted-proxy` نشطين في الوقت نفسه. يمكن أن تؤدي إعدادات token المختلطة إلى مصادقة طلبات loopback بصمت على مسار مصادقة غير صحيح.

إذا رأيت خطأ `mixed_trusted_proxy_token` عند بدء التشغيل:

- أزل token المشترك عند استخدام وضع trusted-proxy، أو
- بدّل `gateway.auth.mode` إلى `"token"` إذا كنت تقصد مصادقة قائمة على token.

كما تفشل مصادقة trusted-proxy عبر loopback بشكل مغلق: يجب على المستدعين من المضيف نفسه تمرير رؤوس الهوية المضبوطة عبر trusted proxy بدلًا من مصادقتهم بصمت.

## رأس Operator scopes

تُعد مصادقة trusted-proxy وضع HTTP **حاملًا للهوية**، لذا يمكن للمستدعين
اختياريًا إعلان operator scopes باستخدام `x-openclaw-scopes`.

أمثلة:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

السلوك:

- عند وجود الرأس، يحترم OpenClaw مجموعة scopes المُعلنة.
- عند وجود الرأس لكنه فارغ، فإن الطلب يعلن **عدم وجود** operator scopes.
- عند غياب الرأس، تعود واجهات HTTP APIs الحاملة للهوية العادية إلى مجموعة scopes الافتراضية القياسية الخاصة بـ operator.
- تكون **مسارات HTTP الخاصة بـ plugin والمصادقة عبر gateway** أضيق افتراضيًا: عند غياب `x-openclaw-scopes`، يعود نطاق وقت التشغيل فيها إلى `operator.write`.
- ما تزال طلبات HTTP ذات الأصل المتصفحي مطالبة باجتياز `gateway.controlUi.allowedOrigins` (أو وضع fallback المتعمَّد الخاص برأس Host) حتى بعد نجاح مصادقة trusted-proxy.

قاعدة عملية:

- أرسل `x-openclaw-scopes` صراحةً عندما تريد أن يكون طلب trusted-proxy
  أضيق من القيم الافتراضية، أو عندما يحتاج مسار gateway-auth plugin
  إلى شيء أقوى من نطاق write.

## قائمة التحقق الأمنية

قبل تفعيل مصادقة trusted-proxy، تحقق من الآتي:

- [ ] **الـ proxy هو المسار الوحيد**: منفذ Gateway محمي بجدار ناري من الجميع باستثناء الـ proxy
- [ ] **`trustedProxies` محددة بدقة**: فقط عناوين IP الفعلية الخاصة بالـ proxy، وليس شبكات فرعية كاملة
- [ ] **لا يوجد مصدر proxy عبر loopback**: تفشل مصادقة trusted-proxy بشكل مغلق للطلبات القادمة من مصدر loopback
- [ ] **الـ proxy يزيل الرؤوس**: يقوم الـ proxy لديك باستبدال رؤوس `x-forwarded-*` القادمة من العملاء (ولا يضيفها فقط)
- [ ] **إنهاء TLS**: يتولى الـ proxy لديك TLS؛ ويتصل المستخدمون عبر HTTPS
- [ ] **`allowedOrigins` صريحة**: تستخدم Control UI غير loopback قيمة `gateway.controlUi.allowedOrigins` صريحة
- [ ] **تم ضبط `allowUsers`** (موصى به): قيّد الوصول على مستخدمين معروفين بدلًا من السماح لأي شخص مصادق عليه
- [ ] **لا يوجد إعداد token مختلط**: لا تضبط كلًا من `gateway.auth.token` و`gateway.auth.mode: "trusted-proxy"`

## التدقيق الأمني

سيضع `openclaw security audit` علامة على مصادقة trusted-proxy بوصفها نتيجة ذات شدة **حرجة**. وهذا مقصود — فهي تذكير بأنك تفوض الأمان إلى إعداد الـ proxy لديك.

يتحقق التدقيق من:

- تحذير/تذكير أساسي `gateway.trusted_proxy_auth` ذو شدة critical
- غياب إعداد `trustedProxies`
- غياب إعداد `userHeader`
- كون `allowUsers` فارغة (ما يسمح لأي مستخدم مصادق عليه)
- سياسة أصل المتصفح wildcard أو المفقودة على أسطح Control UI المكشوفة

## استكشاف الأخطاء وإصلاحها

### `trusted_proxy_untrusted_source`

لم يأتِ الطلب من عنوان IP موجود في `gateway.trustedProxies`. تحقق من:

- هل عنوان IP الخاص بالـ proxy صحيح؟ (قد تتغير عناوين IP الخاصة بحاويات Docker)
- هل يوجد load balancer أمام الـ proxy؟
- استخدم `docker inspect` أو `kubectl get pods -o wide` للعثور على عناوين IP الفعلية

### `trusted_proxy_loopback_source`

رفض OpenClaw طلب trusted-proxy قادمًا من مصدر loopback.

تحقق من:

- هل يتصل الـ proxy من `127.0.0.1` / `::1`؟
- هل تحاول استخدام مصادقة trusted-proxy مع reverse proxy عبر loopback على المضيف نفسه؟

الإصلاح:

- استخدم مصادقة token/password في إعدادات proxy عبر loopback على المضيف نفسه، أو
- مرّر التوجيه عبر عنوان trusted proxy غير loopback واحتفظ بهذا العنوان في `gateway.trustedProxies`.

### `trusted_proxy_user_missing`

كان رأس المستخدم فارغًا أو مفقودًا. تحقق من:

- هل تم إعداد الـ proxy لديك لتمرير رؤوس الهوية؟
- هل اسم الرأس صحيح؟ (غير حساس لحالة الأحرف، لكن التهجئة مهمة)
- هل المستخدم مصادق عليه فعليًا في الـ proxy؟

### `trusted_proxy_missing_header_*`

لم يكن أحد الرؤوس المطلوبة موجودًا. تحقق من:

- إعداد الـ proxy لديك لتلك الرؤوس المحددة
- ما إذا كانت الرؤوس تُزال في مكان ما ضمن السلسلة

### `trusted_proxy_user_not_allowed`

المستخدم مصادق عليه لكنه غير موجود في `allowUsers`. أضفه أو أزل قائمة السماح.

### `trusted_proxy_origin_not_allowed`

نجحت مصادقة trusted-proxy، لكن رأس `Origin` الخاص بالمتصفح لم يجتز فحوص أصل Control UI.

تحقق من:

- أن `gateway.controlUi.allowedOrigins` تتضمن أصل المتصفح المطابق تمامًا
- أنك لا تعتمد على أصول wildcard ما لم تكن تريد عمدًا سلوك السماح للجميع
- إذا كنت تستخدم عمدًا وضع fallback الخاص برأس Host، فتأكد من ضبط `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` عن قصد

### ما زال WebSocket يفشل

تأكد من أن الـ proxy لديك:

- يدعم WebSocket upgrades (`Upgrade: websocket`, `Connection: upgrade`)
- يمرر رؤوس الهوية في طلبات ترقية WebSocket (وليس HTTP فقط)
- لا يملك مسار مصادقة منفصلًا لاتصالات WebSocket

## الترحيل من مصادقة Token

إذا كنت تنتقل من مصادقة token إلى trusted-proxy:

1. اضبط الـ proxy لديك لمصادقة المستخدمين وتمرير الرؤوس
2. اختبر إعداد الـ proxy بشكل مستقل (curl مع الرؤوس)
3. حدّث إعداد OpenClaw باستخدام مصادقة trusted-proxy
4. أعد تشغيل Gateway
5. اختبر اتصالات WebSocket من Control UI
6. شغّل `openclaw security audit` وراجع النتائج

## ذو صلة

- [الأمان](/ar/gateway/security) — دليل الأمان الكامل
- [الإعداد](/ar/gateway/configuration) — مرجع الإعداد
- [الوصول البعيد](/ar/gateway/remote) — أنماط أخرى للوصول البعيد
- [Tailscale](/ar/gateway/tailscale) — بديل أبسط للوصول داخل tailnet فقط

---
read_when:
    - تشغيل OpenClaw خلف وكيل واعٍ بالهوية
    - إعداد Pomerium أو Caddy أو nginx مع OAuth أمام OpenClaw
    - إصلاح أخطاء WebSocket 1008 غير المصرح بها مع إعدادات الوكيل العكسي
    - تحديد مكان ضبط HSTS وغيرها من ترويسات تقوية HTTP
sidebarTitle: Trusted proxy auth
summary: تفويض مصادقة البوابة إلى وكيل عكسي موثوق (Pomerium أو Caddy أو nginx + OAuth)
title: مصادقة الوكيل الموثوق
x-i18n:
    generated_at: "2026-06-27T17:45:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 498a8aca666f88201302af3895b11ba43ab9c0b1bff00a262145fc9e21e80fa7
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**ميزة حساسة أمنيًا.** يفوض هذا الوضع المصادقة بالكامل إلى الوكيل العكسي لديك. قد يؤدي سوء التهيئة إلى تعريض Gateway لديك لوصول غير مصرح به. اقرأ هذه الصفحة بعناية قبل التفعيل.
</Warning>

## متى تستخدمه

استخدم وضع مصادقة `trusted-proxy` عندما:

- تشغّل OpenClaw خلف **وكيل مدرك للهوية** (Pomerium، Caddy + OAuth، nginx + oauth2-proxy، Traefik + forward auth).
- يتولى الوكيل لديك كل المصادقة ويمرر هوية المستخدم عبر الترويسات.
- تكون في بيئة Kubernetes أو حاويات حيث يكون الوكيل هو المسار الوحيد إلى Gateway.
- تواجه أخطاء WebSocket ‏`1008 unauthorized` لأن المتصفحات لا يمكنها تمرير الرموز في حمولات WS.

## متى لا تستخدمه

- إذا كان الوكيل لديك لا يصادق المستخدمين (مجرد منهٍ لـ TLS أو موازن تحميل).
- إذا كان هناك أي مسار إلى Gateway يتجاوز الوكيل (ثغرات في الجدار الناري، وصول عبر الشبكة الداخلية).
- إذا لم تكن متأكدًا مما إذا كان الوكيل لديك يزيل/يستبدل الترويسات المعاد توجيهها بشكل صحيح.
- إذا كنت تحتاج فقط إلى وصول شخصي لمستخدم واحد (فكر في Tailscale Serve + loopback لإعداد أبسط).

## كيف يعمل

<Steps>
  <Step title="يصادق الوكيل المستخدم">
    يصادق الوكيل العكسي المستخدمين (OAuth، OIDC، SAML، وما إلى ذلك).
  </Step>
  <Step title="يضيف الوكيل ترويسة هوية">
    يضيف الوكيل ترويسة تحتوي على هوية المستخدم المصادق عليه (مثل `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="يتحقق Gateway من المصدر الموثوق">
    يتحقق OpenClaw من أن الطلب جاء من **عنوان IP لوكيل موثوق** (مهيأ في `gateway.trustedProxies`).
  </Step>
  <Step title="يستخرج Gateway الهوية">
    يستخرج OpenClaw هوية المستخدم من الترويسة المهيأة.
  </Step>
  <Step title="التفويض">
    إذا نجحت كل الفحوصات، يتم تفويض الطلب.
  </Step>
</Steps>

## سلوك الاقتران في واجهة التحكم

عندما يكون `gateway.auth.mode = "trusted-proxy"` نشطًا ويمر الطلب فحوصات الوكيل الموثوق، يمكن لجلسات WebSocket في واجهة التحكم الاتصال من دون هوية اقتران جهاز.

آثار النطاق:

- تتصل جلسات WebSocket لواجهة التحكم من دون جهاز، لكنها لا تتلقى أي نطاقات مشغّل افتراضيًا. يفرغ OpenClaw قائمة النطاقات المطلوبة إلى `[]` حتى لا تتمكن جلسة غير مرتبطة بجهاز/رمز مقترن وموافق عليه من إعلان الأذونات ذاتيًا.
- إذا فشلت الطرق مع `missing scope` بعد اتصال WebSocket ناجح، فاستخدم HTTPS حتى يتمكن المتصفح من إنشاء هوية جهاز وإكمال الاقتران. راجع [HTTP غير الآمن لواجهة التحكم](/ar/web/control-ui#insecure-http).
- لكسر الزجاج فقط: يحافظ `gateway.controlUi.dangerouslyDisableDeviceAuth=true` على النطاقات المطلوبة حتى من دون هوية جهاز. هذا خفض أمني شديد؛ تراجع عنه سريعًا. راجع [HTTP غير الآمن لواجهة التحكم](/ar/web/control-ui#insecure-http).

تحديد نطاقات الوكيل العكسي:

- إذا أرسل الوكيل لديك `x-openclaw-scopes` في طلب ترقية WebSocket لواجهة التحكم، فإن OpenClaw يحد نطاقات الجلسة إلى تقاطع النطاقات المطلوبة والنطاقات المعلنة. لا تمنح هذه الترويسة نطاقات؛ إنها تضيق فقط ما يمكن للجلسة امتلاكه.

الآثار:

- لم يعد الاقتران البوابة الأساسية للوصول إلى واجهة التحكم في هذا الوضع.
- تصبح سياسة مصادقة الوكيل العكسي و`allowUsers` لديك هي التحكم الفعلي في الوصول.
- أبقِ دخول Gateway مقصورًا على عناوين IP الخاصة بالوكلاء الموثوقين فقط (`gateway.trustedProxies` + الجدار الناري).

عملاء WebSocket المخصصون ليسوا جلسات واجهة التحكم. لا يمنح `gateway.controlUi.dangerouslyDisableDeviceAuth` نطاقات لعملاء عشوائيين بشكل `client.mode: "backend"` أو عملاء مشابهين لـ CLI. يجب أن تستخدم الأتمتة المخصصة هوية الجهاز/الاقتران، أو مسار مساعد backend المحلي المباشر المحجوز `client.id: "gateway-client"`، أو [Plugin ‏admin HTTP RPC](/ar/plugins/admin-http-rpc) عندما يكون سطح طلب/استجابة HTTP أكثر ملاءمة.

## التهيئة

```json5
{
  gateway: {
    // Trusted-proxy auth expects requests from a non-loopback trusted proxy source by default
    bind: "lan",

    // CRITICAL: Only add your proxy's IP(s) here
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header containing authenticated user identity (required)
        userHeader: "x-forwarded-user",

        // Optional: headers that MUST be present (proxy verification)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Optional: restrict to specific users (empty = allow all)
        allowUsers: ["nick@example.com", "admin@company.org"],

        // Optional: allow a same-host loopback proxy after explicit opt-in
        allowLoopback: false,
      },
    },
  },
}
```

<Warning>
**قواعد مهمة وقت التشغيل**

- ترفض مصادقة الوكيل الموثوق الطلبات ذات مصدر loopback ‏(`127.0.0.1`، `::1`، ونطاقات CIDR الخاصة بـ loopback) افتراضيًا.
- الوكلاء العكسيون عبر loopback على المضيف نفسه لا يستوفون مصادقة الوكيل الموثوق إلا إذا ضبطت صراحة `gateway.auth.trustedProxy.allowLoopback = true` وأدرجت عنوان loopback في `gateway.trustedProxies`.
- يثق `allowLoopback` بالعمليات المحلية على مضيف Gateway بالدرجة نفسها التي يثق بها بالوكيل العكسي. فعّله فقط عندما يظل Gateway محميًا بجدار ناري من الوصول البعيد المباشر، ويزيل الوكيل المحلي أو يستبدل ترويسات الهوية التي يزودها العميل.
- يجب على عملاء Gateway الداخليين الذين لا يمرون عبر الوكيل العكسي استخدام `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`، وليس ترويسات هوية الوكيل الموثوق.
- لا تزال عمليات نشر واجهة التحكم غير loopback تحتاج إلى `gateway.controlUi.allowedOrigins` صريح.
- **دليل الترويسات المعاد توجيهها يتجاوز محلية loopback للتراجع المحلي المباشر.** إذا وصل طلب عبر loopback لكنه حمل دليل ترويسة `Forwarded`، أو أي `X-Forwarded-*`، أو `X-Real-IP`، فإن ذلك الدليل يستبعد تراجع كلمة المرور المحلي المباشر وبوابة هوية الجهاز. مع `allowLoopback: true`، يمكن لمصادقة الوكيل الموثوق أن تقبل الطلب رغم ذلك كطلب وكيل على المضيف نفسه، بينما يستمر تطبيق `requiredHeaders` و`allowUsers`.

</Warning>

### مرجع التهيئة

<ParamField path="gateway.trustedProxies" type="string[]" required>
  مصفوفة عناوين IP للوكلاء المطلوب الوثوق بها. تُرفض الطلبات من عناوين IP الأخرى.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  يجب أن تكون `"trusted-proxy"`.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  اسم الترويسة التي تحتوي على هوية المستخدم المصادق عليه.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  ترويسات إضافية يجب أن تكون موجودة حتى يكون الطلب موثوقًا.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  قائمة سماح لهويات المستخدمين. الفراغ يعني السماح لكل المستخدمين المصادق عليهم.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean">
  دعم اختياري صريح للوكلاء العكسيين عبر loopback على المضيف نفسه. القيمة الافتراضية هي `false`.
</ParamField>

<Warning>
فعّل `allowLoopback` فقط عندما يكون الوكيل العكسي المحلي هو حد الثقة المقصود. يمكن لأي عملية محلية قادرة على الاتصال بـ Gateway محاولة إرسال ترويسات هوية الوكيل، لذلك أبقِ الوصول المباشر إلى Gateway خاصًا بالمضيف واطلب ترويسات يملكها الوكيل مثل `x-forwarded-proto` أو ترويسة تأكيد موقعة حيث يدعم الوكيل لديك ذلك.
</Warning>

## إنهاء TLS وHSTS

استخدم نقطة إنهاء TLS واحدة وطبق HSTS هناك.

<Tabs>
  <Tab title="إنهاء TLS عند الوكيل (موصى به)">
    عندما يتولى الوكيل العكسي لديك HTTPS لـ `https://control.example.com`، اضبط `Strict-Transport-Security` عند الوكيل لذلك النطاق.

    - مناسب لعمليات النشر المواجهة للإنترنت.
    - يبقي سياسة الشهادة وتقوية HTTP في مكان واحد.
    - يمكن أن يبقى OpenClaw على HTTP عبر loopback خلف الوكيل.

    مثال لقيمة الترويسة:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="إنهاء TLS عند Gateway">
    إذا كان OpenClaw نفسه يخدم HTTPS مباشرة (من دون وكيل ينهي TLS)، فاضبط:

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

    يقبل `strictTransportSecurity` قيمة ترويسة نصية، أو `false` للتعطيل الصريح.

  </Tab>
</Tabs>

### إرشادات الطرح

- ابدأ أولًا بعمر أقصى قصير (مثل `max-age=300`) أثناء التحقق من حركة المرور.
- ارفع إلى قيم طويلة الأمد (مثل `max-age=31536000`) فقط بعد ارتفاع الثقة.
- أضف `includeSubDomains` فقط إذا كان كل نطاق فرعي جاهزًا لـ HTTPS.
- استخدم التحميل المسبق فقط إذا كنت تستوفي عمدًا متطلبات التحميل المسبق لمجموعة نطاقاتك الكاملة.
- لا تستفيد بيئة التطوير المحلية عبر loopback فقط من HSTS.

## أمثلة إعداد الوكيل

<AccordionGroup>
  <Accordion title="Pomerium">
    يمرر Pomerium الهوية في `x-pomerium-claim-email` (أو ترويسات مطالبة أخرى) وJWT في `x-pomerium-jwt-assertion`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Pomerium's IP
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

    مقتطف تهيئة Pomerium:

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

  </Accordion>
  <Accordion title="Caddy مع OAuth">
    يمكن لـ Caddy مع Plugin ‏`caddy-security` مصادقة المستخدمين وتمرير ترويسات الهوية.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Caddy/sidecar proxy IP
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

    ```
    openclaw.example.com {
        authenticate with oauth2_provider
        authorize with policy1

        reverse_proxy openclaw:18789 {
            header_up X-Forwarded-User {http.auth.user.email}
        }
    }
    ```

  </Accordion>
  <Accordion title="nginx + oauth2-proxy">
    يصادق oauth2-proxy المستخدمين ويمرر الهوية في `x-auth-request-email`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // nginx/oauth2-proxy IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-auth-request-email",
          },
        },
      },
    }
    ```

    مقتطف تهيئة nginx:

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

  </Accordion>
  <Accordion title="Traefik مع forward auth">
    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["172.17.0.1"], // Traefik container IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## تهيئة الرموز المختلطة

يرفض OpenClaw التهيئات الملتبسة حيث يكون كل من `gateway.auth.token` (أو `OPENCLAW_GATEWAY_TOKEN`) ووضع `trusted-proxy` نشطين في الوقت نفسه. يمكن أن تتسبب تهيئات الرموز المختلطة في مصادقة طلبات loopback بصمت عبر مسار المصادقة الخاطئ.

إذا رأيت خطأ `mixed_trusted_proxy_token` عند بدء التشغيل:

- أزل الرمز المشترك عند استخدام وضع الوكيل الموثوق، أو
- بدّل `gateway.auth.mode` إلى `"token"` إذا كنت تقصد المصادقة القائمة على الرموز.

تظل ترويسات هوية الوكيل الموثوق عبر loopback تفشل مغلقة: لا تتم مصادقة المستدعين من المضيف نفسه بصمت كمستخدمي وكيل. يمكن لمستدعي OpenClaw الداخليين الذين يتجاوزون الوكيل المصادقة باستخدام `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` بدلا من ذلك. يظل الرجوع إلى الرمز غير مدعوم عمدا في وضع الوكيل الموثوق.

## ترويسة نطاقات المشغل

مصادقة الوكيل الموثوق هي وضع HTTP **حامل للهوية**، لذلك يمكن للمستدعين اختياريا إعلان نطاقات المشغل باستخدام `x-openclaw-scopes` في طلبات HTTP API.

ملاحظة: تحدد نطاقات WebSocket بواسطة مصافحة بروتوكول Gateway وربط هوية الجهاز. في طلبات ترقية WebSocket الخاصة بـ Control UI، يكون `x-openclaw-scopes` حدا أقصى لنطاقات الجلسة المتفاوض عليها فقط، وليس منحة. لمعرفة سلوك نطاق WebSocket مع الوكيل الموثوق، راجع [سلوك اقتران Control UI](#control-ui-pairing-behavior).

أمثلة:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

السلوك:

- عند وجود الترويسة، يحترم OpenClaw مجموعة النطاقات المعلنة.
- عند وجود الترويسة لكنها فارغة، يعلن الطلب عدم وجود نطاقات مشغل.
- عند غياب الترويسة، ترجع واجهات HTTP API العادية الحاملة للهوية إلى مجموعة نطاقات المشغل الافتراضية القياسية.
- تكون **مسارات HTTP الخاصة بالـ Plugin** لمصادقة Gateway أضيق افتراضيا: عند غياب `x-openclaw-scopes`، يرجع نطاق التشغيل لديها إلى `operator.write`.
- لا تزال طلبات HTTP من أصل المتصفح مطالبة باجتياز `gateway.controlUi.allowedOrigins` (أو وضع الرجوع المتعمد لترويسة Host) حتى بعد نجاح مصادقة الوكيل الموثوق.
- بالنسبة إلى جلسات WebSocket الخاصة بـ Control UI، يكون `x-openclaw-scopes` حدا أقصى للنطاق عند وجوده في طلب الترقية. تؤدي القيمة الفارغة إلى عدم وجود نطاقات.

قاعدة عملية: أرسل `x-openclaw-scopes` صراحة عندما تريد أن يكون طلب الوكيل الموثوق أضيق من الافتراضيات، أو عندما يحتاج مسار Plugin لمصادقة Gateway إلى شيء أقوى من نطاق الكتابة.

## قائمة تدقيق الأمان

قبل تفعيل مصادقة الوكيل الموثوق، تحقق مما يلي:

- [ ] **الوكيل هو المسار الوحيد**: منفذ Gateway محمي بجدار ناري من كل شيء باستثناء وكيلك.
- [ ] **trustedProxies في الحد الأدنى**: عناوين IP الخاصة بوكيلك الفعلي فقط، وليس شبكات فرعية كاملة.
- [ ] **مصدر وكيل loopback متعمد**: تفشل مصادقة الوكيل الموثوق مغلقة لطلبات مصدر loopback ما لم يتم تفعيل `gateway.auth.trustedProxy.allowLoopback` صراحة لوكيل على المضيف نفسه.
- [ ] **الوكيل يزيل الترويسات**: يكتب وكيلك فوق ترويسات `x-forwarded-*` الواردة من العملاء (ولا يضيف إليها).
- [ ] **إنهاء TLS**: يتولى وكيلك TLS؛ ويتصل المستخدمون عبر HTTPS.
- [ ] **allowedOrigins صريح**: يستخدم Control UI غير loopback قيمة `gateway.controlUi.allowedOrigins` صريحة.
- [ ] **allowUsers مضبوط** (مستحسن): قيد الوصول على المستخدمين المعروفين بدلا من السماح لأي شخص تمت مصادقته.
- [ ] **لا يوجد إعداد مختلط للرموز**: لا تضبط كلا من `gateway.auth.token` و `gateway.auth.mode: "trusted-proxy"`.
- [ ] **رجوع كلمة المرور المحلية خاص**: إذا هيأت `gateway.auth.password` للمستدعين الداخليين المباشرين، فأبق منفذ Gateway محميا بجدار ناري حتى لا يتمكن العملاء البعيدون غير المارين عبر الوكيل من الوصول إليه مباشرة.

## تدقيق الأمان

سيبلغ `openclaw security audit` عن مصادقة الوكيل الموثوق بنتيجة شدة **حرجة**. هذا مقصود، فهو تذكير بأنك تفوض الأمان إلى إعداد وكيلك.

يتحقق التدقيق من:

- تذكير/تحذير حرج أساسي `gateway.trusted_proxy_auth`
- إعداد `trustedProxies` مفقود
- إعداد `userHeader` مفقود
- `allowUsers` فارغ (يسمح لأي مستخدم تمت مصادقته)
- تفعيل `allowLoopback` لمصادر الوكيل على المضيف نفسه
- سياسة أصل المتصفح ذات بدل شامل أو مفقودة على أسطح Control UI المكشوفة

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    لم يأت الطلب من عنوان IP موجود في `gateway.trustedProxies`. تحقق مما يلي:

    - هل عنوان IP الخاص بالوكيل صحيح؟ (يمكن أن تتغير عناوين IP لحاويات Docker.)
    - هل يوجد موزع حمل أمام وكيلك؟
    - استخدم `docker inspect` أو `kubectl get pods -o wide` للعثور على عناوين IP الفعلية.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    رفض OpenClaw طلب وكيل موثوق مصدره loopback.

    تحقق مما يلي:

    - هل يتصل الوكيل من `127.0.0.1` / `::1`؟
    - هل تحاول استخدام مصادقة الوكيل الموثوق مع وكيل عكسي loopback على المضيف نفسه؟

    الإصلاح:

    - فضل مصادقة الرمز/كلمة المرور للعملاء الداخليين على المضيف نفسه الذين لا يمرون عبر الوكيل، أو
    - وجه عبر عنوان وكيل موثوق غير loopback وأبق ذلك العنوان في `gateway.trustedProxies`، أو
    - بالنسبة إلى وكيل عكسي متعمد على المضيف نفسه، اضبط `gateway.auth.trustedProxy.allowLoopback = true`، وأبق عنوان loopback في `gateway.trustedProxies`، وتأكد من أن الوكيل يزيل ترويسات الهوية أو يكتب فوقها.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    كانت ترويسة المستخدم فارغة أو مفقودة. تحقق مما يلي:

    - هل وكيلك مهيأ لتمرير ترويسات الهوية؟
    - هل اسم الترويسة صحيح؟ (غير حساس لحالة الأحرف، لكن التهجئة مهمة)
    - هل تمت مصادقة المستخدم فعلا عند الوكيل؟

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    لم تكن ترويسة مطلوبة موجودة. تحقق مما يلي:

    - إعداد وكيلك لتلك الترويسات المحددة.
    - ما إذا كانت الترويسات تزال في مكان ما ضمن السلسلة.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    تمت مصادقة المستخدم لكنه غير موجود في `allowUsers`. إما أن تضيفه أو تزيل قائمة السماح.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    نجحت مصادقة الوكيل الموثوق، لكن ترويسة `Origin` الخاصة بالمتصفح لم تجتز فحوصات أصل Control UI.

    تحقق مما يلي:

    - يتضمن `gateway.controlUi.allowedOrigins` أصل المتصفح الدقيق.
    - لا تعتمد على أصول بدل شامل إلا إذا كنت تريد عمدا سلوك السماح للجميع.
    - إذا كنت تستخدم عمدا وضع الرجوع إلى ترويسة Host، فتم ضبط `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` عن قصد.

  </Accordion>
  <Accordion title="Connection succeeds but methods report missing scope">
    يتصل WebSocket، لكن تفشل `chat.history` أو `sessions.list` أو
    `models.list` مع `missing scope: operator.read`.

    الأسباب الشائعة:

    - جلسة Control UI بلا جهاز: يمكن لمصادقة الوكيل الموثوق إدخال اتصال WebSocket بدون هوية جهاز، لكن OpenClaw يمسح النطاقات في الجلسات بلا جهاز حسب التصميم.
    - عميل خلفية مخصص: `gateway.controlUi.dangerouslyDisableDeviceAuth` محصور في Control UI ولا يمنح نطاقات لعملاء WebSocket عشوائيين من الخلفية أو بشكل شبيه بالـ CLI.
    - `x-openclaw-scopes` ضيق أكثر من اللازم: إذا كان وكيلك يحقن هذه الترويسة في طلب ترقية WebSocket الخاص بـ Control UI، فستكون نطاقات الجلسة محددة بتلك المجموعة. تؤدي قيمة الترويسة الفارغة إلى عدم وجود نطاقات.

    الإصلاح:

    - بالنسبة إلى Control UI، استخدم HTTPS حتى يتمكن المتصفح من إنشاء هوية جهاز وإكمال الاقتران.
    - بالنسبة إلى الأتمتة المخصصة، استخدم هوية الجهاز/الاقتران، أو مسار مساعد الخلفية `gateway-client` المباشر المحلي المحجوز، أو [HTTP RPC للمسؤول](/ar/plugins/admin-http-rpc).
    - استخدم `gateway.controlUi.dangerouslyDisableDeviceAuth: true` فقط كمسار مؤقت لكسر الزجاج في Control UI.

  </Accordion>
  <Accordion title="WebSocket still failing">
    تأكد من أن وكيلك:

    - يدعم ترقيات WebSocket (`Upgrade: websocket`, `Connection: upgrade`).
    - يمرر ترويسات الهوية في طلبات ترقية WebSocket (وليس HTTP فقط).
    - لا يملك مسارا منفصلا للمصادقة لاتصالات WebSocket.

  </Accordion>
</AccordionGroup>

## الترحيل من مصادقة الرمز

إذا كنت تنتقل من مصادقة الرمز إلى الوكيل الموثوق:

<Steps>
  <Step title="Configure the proxy">
    هيئ وكيلك لمصادقة المستخدمين وتمرير الترويسات.
  </Step>
  <Step title="Test the proxy independently">
    اختبر إعداد الوكيل بشكل مستقل (`curl` مع الترويسات).
  </Step>
  <Step title="Update OpenClaw config">
    حدث إعداد OpenClaw باستخدام مصادقة الوكيل الموثوق.
  </Step>
  <Step title="Restart the Gateway">
    أعد تشغيل Gateway.
  </Step>
  <Step title="Test WebSocket">
    اختبر اتصالات WebSocket من Control UI.
  </Step>
  <Step title="Audit">
    شغل `openclaw security audit` وراجع النتائج.
  </Step>
</Steps>

## ذات صلة

- [الإعداد](/ar/gateway/configuration) — مرجع الإعداد
- [الوصول البعيد](/ar/gateway/remote) — أنماط وصول بعيدة أخرى
- [الأمان](/ar/gateway/security) — دليل الأمان الكامل
- [Tailscale](/ar/gateway/tailscale) — بديل أبسط للوصول المحصور في tailnet

---
read_when:
    - تشغيل OpenClaw خلف وكيل مدرك للهوية
    - إعداد Pomerium أو Caddy أو nginx مع OAuth أمام OpenClaw
    - إصلاح أخطاء WebSocket 1008 غير المصرح بها في إعدادات الوكيل العكسي
    - تحديد مكان ضبط HSTS ورؤوس تقوية HTTP الأخرى
sidebarTitle: Trusted proxy auth
summary: فوّض مصادقة Gateway إلى وكيل عكسي موثوق (Pomerium، Caddy، nginx + OAuth)
title: مصادقة الوكيل الموثوق
x-i18n:
    generated_at: "2026-04-30T08:03:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 311498b822d2dbf9833c71ec070ab5cee5b4dd2dfb0eeaad1d758eee367a2df3
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**ميزة حساسة أمنيًا.** يفوّض هذا الوضع المصادقة بالكامل إلى الوكيل العكسي لديك. قد يؤدي سوء التهيئة إلى تعريض Gateway للوصول غير المصرح به. اقرأ هذه الصفحة بعناية قبل التمكين.
</Warning>

## متى تستخدمه

استخدم وضع مصادقة `trusted-proxy` عندما:

- تشغّل OpenClaw خلف **وكيل واعٍ بالهوية** (Pomerium، أو Caddy + OAuth، أو nginx + oauth2-proxy، أو Traefik + forward auth).
- يتولى الوكيل كل المصادقة ويمرر هوية المستخدم عبر الرؤوس.
- تكون في بيئة Kubernetes أو حاويات يكون فيها الوكيل هو المسار الوحيد إلى Gateway.
- تواجه أخطاء مقبس الويب `1008 unauthorized` لأن المتصفحات لا يمكنها تمرير الرموز في حمولات WS.

## متى لا تستخدمه

- إذا كان الوكيل لديك لا يصادق المستخدمين (مجرد منهٍ لـ TLS أو موازن تحميل).
- إذا كان هناك أي مسار إلى Gateway يتجاوز الوكيل (ثغرات جدار ناري، وصول عبر الشبكة الداخلية).
- إذا لم تكن متأكدًا مما إذا كان الوكيل لديك يزيل/يستبدل الرؤوس المعاد توجيهها بشكل صحيح.
- إذا كنت تحتاج فقط إلى وصول شخصي لمستخدم واحد (فكّر في Tailscale Serve + loopback لإعداد أبسط).

## كيف يعمل

<Steps>
  <Step title="يصادق الوكيل المستخدم">
    يصادق الوكيل العكسي المستخدمين (OAuth، وOIDC، وSAML، وما إلى ذلك).
  </Step>
  <Step title="يضيف الوكيل رأس هوية">
    يضيف الوكيل رأسًا يتضمن هوية المستخدم المصادق عليه (مثل `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="يتحقق Gateway من المصدر الموثوق">
    يتحقق OpenClaw من أن الطلب جاء من **عنوان IP لوكيل موثوق** (مهيأ في `gateway.trustedProxies`).
  </Step>
  <Step title="يستخرج Gateway الهوية">
    يستخرج OpenClaw هوية المستخدم من الرأس المهيأ.
  </Step>
  <Step title="التفويض">
    إذا نجحت كل عمليات التحقق، يُفوّض الطلب.
  </Step>
</Steps>

## سلوك إقران واجهة التحكم

عندما يكون `gateway.auth.mode = "trusted-proxy"` نشطًا ويجتاز الطلب فحوصات الوكيل الموثوق، يمكن لجلسات مقبس الويب الخاصة بواجهة التحكم الاتصال دون هوية إقران الجهاز.

الآثار:

- لم يعد الإقران بوابة الوصول الأساسية إلى واجهة التحكم في هذا الوضع.
- تصبح سياسة مصادقة الوكيل العكسي و`allowUsers` هما التحكم الفعلي في الوصول.
- أبقِ دخول Gateway مقفلًا على عناوين IP الخاصة بالوكيل الموثوق فقط (`gateway.trustedProxies` + جدار ناري).

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
**قواعد تشغيل مهمة**

- ترفض مصادقة الوكيل الموثوق الطلبات الصادرة من loopback (`127.0.0.1`، و`::1`، ونطاقات CIDR الخاصة بـ loopback) افتراضيًا.
- لا تستوفي الوكلاء العكسيون عبر loopback على المضيف نفسه مصادقة الوكيل الموثوق إلا إذا ضبطت صراحة `gateway.auth.trustedProxy.allowLoopback = true` وأدرجت عنوان loopback في `gateway.trustedProxies`.
- يثق `allowLoopback` بالعمليات المحلية على مضيف Gateway بالدرجة نفسها التي يثق بها بالوكيل العكسي. لا تمكّنه إلا عندما يكون Gateway ما زال محميًا بجدار ناري من الوصول البعيد المباشر، ويزيل الوكيل المحلي أو يستبدل رؤوس الهوية التي يرسلها العميل.
- يجب أن يستخدم عملاء Gateway الداخليون الذين لا يمرون عبر الوكيل العكسي `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`، وليس رؤوس هوية الوكيل الموثوق.
- ما زالت عمليات نشر واجهة التحكم غير المعتمدة على loopback تحتاج إلى `gateway.controlUi.allowedOrigins` صريح.
- **تتجاوز أدلة الرؤوس المعاد توجيهها محلية loopback في الرجوع المحلي المباشر.** إذا وصل طلب على loopback لكنه يحمل رؤوس `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` تشير إلى أصل غير محلي، فإن هذا الدليل يلغي أهلية الرجوع المحلي المباشر بكلمة مرور وبوابة هوية الجهاز. مع `allowLoopback: true`، يمكن لمصادقة الوكيل الموثوق أن تقبل الطلب رغم ذلك كطلب وكيل على المضيف نفسه، بينما يستمر تطبيق `requiredHeaders` و`allowUsers`.

</Warning>

### مرجع التهيئة

<ParamField path="gateway.trustedProxies" type="string[]" required>
  مصفوفة عناوين IP للوكلاء المطلوب الوثوق بها. تُرفض الطلبات الواردة من عناوين IP أخرى.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  يجب أن تكون `"trusted-proxy"`.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  اسم الرأس الذي يحتوي على هوية المستخدم المصادق عليه.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  رؤوس إضافية يجب أن تكون موجودة حتى يُعد الطلب موثوقًا.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  قائمة سماح لهويات المستخدمين. يعني الفراغ السماح لكل المستخدمين المصادق عليهم.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean">
  دعم اختياري صريح للوكلاء العكسيين عبر loopback على المضيف نفسه. القيمة الافتراضية `false`.
</ParamField>

<Warning>
لا تمكّن `allowLoopback` إلا عندما يكون الوكيل العكسي المحلي هو حد الثقة المقصود. يمكن لأي عملية محلية تستطيع الاتصال بـ Gateway أن تحاول إرسال رؤوس هوية الوكيل، لذا أبقِ الوصول المباشر إلى Gateway خاصًا بالمضيف، واشترط رؤوسًا مملوكة للوكيل مثل `x-forwarded-proto` أو رأس تأكيد موقّع حيث يدعم الوكيل لديك ذلك.
</Warning>

## إنهاء TLS وHSTS

استخدم نقطة إنهاء TLS واحدة وطبّق HSTS هناك.

<Tabs>
  <Tab title="إنهاء TLS عند الوكيل (موصى به)">
    عندما يتولى الوكيل العكسي لديك HTTPS لـ `https://control.example.com`، اضبط `Strict-Transport-Security` عند الوكيل لذلك النطاق.

    - مناسب جيدًا لعمليات النشر المواجهة للإنترنت.
    - يبقي سياسة الشهادة وتقوية HTTP في مكان واحد.
    - يمكن أن يبقى OpenClaw على HTTP عبر loopback خلف الوكيل.

    مثال لقيمة الرأس:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="إنهاء TLS عند Gateway">
    إذا كان OpenClaw نفسه يقدّم HTTPS مباشرة (دون وكيل ينهي TLS)، فاضبط:

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

    يقبل `strictTransportSecurity` قيمة رأس نصية، أو `false` للتعطيل الصريح.

  </Tab>
</Tabs>

### إرشادات الطرح

- ابدأ أولًا بمدة قصوى قصيرة (على سبيل المثال `max-age=300`) أثناء التحقق من حركة المرور.
- زد إلى قيم طويلة الأمد (على سبيل المثال `max-age=31536000`) فقط بعد ارتفاع الثقة.
- أضف `includeSubDomains` فقط إذا كان كل نطاق فرعي جاهزًا لـ HTTPS.
- استخدم التحميل المسبق فقط إذا كنت تستوفي عمدًا متطلبات التحميل المسبق لمجموعة نطاقاتك الكاملة.
- لا يستفيد التطوير المحلي المعتمد فقط على loopback من HSTS.

## أمثلة إعداد الوكيل

<AccordionGroup>
  <Accordion title="Pomerium">
    يمرر Pomerium الهوية في `x-pomerium-claim-email` (أو رؤوس مطالبات أخرى) وJWT في `x-pomerium-jwt-assertion`.

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
    يستطيع Caddy مع Plugin `caddy-security` مصادقة المستخدمين وتمرير رؤوس الهوية.

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

يرفض OpenClaw التهيئات المبهمة التي يكون فيها كل من `gateway.auth.token` (أو `OPENCLAW_GATEWAY_TOKEN`) ووضع `trusted-proxy` نشطين في الوقت نفسه. قد تجعل تهيئات الرموز المختلطة طلبات loopback تصادق بصمت عبر مسار المصادقة الخاطئ.

إذا رأيت خطأ `mixed_trusted_proxy_token` عند بدء التشغيل:

- أزِل الرمز المشترك عند استخدام وضع الوكيل الموثوق، أو
- بدّل `gateway.auth.mode` إلى `"token"` إذا كنت تقصد المصادقة المعتمدة على الرمز.

ما زالت رؤوس هوية الوكيل الموثوق عبر loopback تفشل بصورة مغلقة: لا تتم مصادقة المستدعين على المضيف نفسه بصمت كمستخدمي وكيل. يمكن لمستدعي OpenClaw الداخليين الذين يتجاوزون الوكيل أن يصادقوا باستخدام `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` بدلًا من ذلك. يظل الرجوع إلى الرمز غير مدعوم عمدًا في وضع الوكيل الموثوق.

## رأس نطاقات المشغل

مصادقة الوكيل الموثوق هي وضع HTTP **حامل للهوية**، لذا يمكن للمستدعين اختياريًا إعلان نطاقات المشغل باستخدام `x-openclaw-scopes`.

أمثلة:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

السلوك:

- عند وجود الرأس، يحترم OpenClaw مجموعة النطاقات المعلنة.
- عند وجود الرأس لكنه فارغ، يعلن الطلب **عدم وجود** نطاقات مشغل.
- عند غياب الرأس، تعود واجهات HTTP الحاملة للهوية العادية إلى مجموعة نطاقات المشغل الافتراضية القياسية.
- تكون **مسارات HTTP الخاصة بالـ Plugin** لمصادقة Gateway أضيق افتراضيًا: عند غياب `x-openclaw-scopes`، يعود نطاق وقت التشغيل الخاص بها إلى `operator.write`.
- ما زال يجب على طلبات HTTP ذات أصل المتصفح اجتياز `gateway.controlUi.allowedOrigins` (أو وضع الرجوع المتعمد لرأس Host) حتى بعد نجاح مصادقة الوكيل الموثوق.

قاعدة عملية: أرسل `x-openclaw-scopes` صراحة عندما تريد أن يكون طلب الوكيل الموثوق أضيق من الافتراضيات، أو عندما يحتاج مسار Plugin لمصادقة Gateway إلى ما هو أقوى من نطاق الكتابة.

## قائمة التحقق الأمنية

قبل تمكين مصادقة trusted-proxy، تحقّق مما يلي:

- [ ] **الوكيل هو المسار الوحيد**: منفذ Gateway محمي بجدار ناري من كل شيء باستثناء وكيلك.
- [ ] **trustedProxies في حدّه الأدنى**: عناوين IP الفعلية لوكيلك فقط، وليس شبكات فرعية كاملة.
- [ ] **مصدر وكيل loopback مقصود**: تفشل مصادقة trusted-proxy على نحو مغلق لطلبات مصدر loopback ما لم يتم تمكين `gateway.auth.trustedProxy.allowLoopback` صراحة لوكيل على المضيف نفسه.
- [ ] **الوكيل يزيل الرؤوس**: يكتب وكيلك فوق رؤوس `x-forwarded-*` الواردة من العملاء، ولا يضيف إليها.
- [ ] **إنهاء TLS**: يتعامل وكيلك مع TLS؛ ويتصل المستخدمون عبر HTTPS.
- [ ] **allowedOrigins صريح**: تستخدم واجهة التحكم غير العاملة عبر loopback قيمة صريحة لـ `gateway.controlUi.allowedOrigins`.
- [ ] **allowUsers مضبوط** (موصى به): قيّد الوصول بالمستخدمين المعروفين بدلا من السماح لأي شخص تمت مصادقته.
- [ ] **لا توجد تهيئة رموز مختلطة**: لا تضبط كلا من `gateway.auth.token` و`gateway.auth.mode: "trusted-proxy"`.
- [ ] **بديل كلمة المرور المحلية خاص**: إذا قمت بتهيئة `gateway.auth.password` للمتصلين الداخليين المباشرين، فأبق منفذ Gateway محميا بجدار ناري حتى لا يتمكن العملاء البعيدون غير المارين عبر الوكيل من الوصول إليه مباشرة.

## تدقيق الأمان

سيضع `openclaw security audit` علامة على مصادقة trusted-proxy بنتيجة ذات شدة **حرجة**. هذا مقصود؛ إنه تذكير بأنك تفوض الأمان إلى إعداد الوكيل لديك.

يتحقق التدقيق من:

- تذكير التحذير/الحرج الأساسي `gateway.trusted_proxy_auth`
- غياب تهيئة `trustedProxies`
- غياب تهيئة `userHeader`
- قيمة `allowUsers` فارغة (تسمح لأي مستخدم تمت مصادقته)
- تمكين `allowLoopback` لمصادر الوكيل على المضيف نفسه
- سياسة أصل المتصفح مفقودة أو تحتوي على أحرف بدل على أسطح واجهة التحكم المكشوفة

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    لم يأت الطلب من عنوان IP موجود في `gateway.trustedProxies`. تحقّق من:

    - هل عنوان IP الخاص بالوكيل صحيح؟ (يمكن أن تتغير عناوين IP لحاويات Docker.)
    - هل يوجد موزّع حمل أمام وكيلك؟
    - استخدم `docker inspect` أو `kubectl get pods -o wide` للعثور على عناوين IP الفعلية.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    رفض OpenClaw طلب trusted-proxy من مصدر loopback.

    تحقّق من:

    - هل يتصل الوكيل من `127.0.0.1` / `::1`؟
    - هل تحاول استخدام مصادقة trusted-proxy مع وكيل عكسي loopback على المضيف نفسه؟

    الإصلاح:

    - فضّل مصادقة الرمز/كلمة المرور للعملاء الداخليين على المضيف نفسه الذين لا يمرون عبر الوكيل، أو
    - وجّه عبر عنوان وكيل موثوق غير loopback وأبق ذلك العنوان في `gateway.trustedProxies`، أو
    - لوكيل عكسي مقصود على المضيف نفسه، اضبط `gateway.auth.trustedProxy.allowLoopback = true`، وأبق عنوان loopback في `gateway.trustedProxies`، وتأكد من أن الوكيل يزيل رؤوس الهوية أو يكتب فوقها.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    كان رأس المستخدم فارغا أو مفقودا. تحقّق من:

    - هل تم تهيئة وكيلك لتمرير رؤوس الهوية؟
    - هل اسم الرأس صحيح؟ (غير حساس لحالة الأحرف، لكن الإملاء مهم)
    - هل تمت مصادقة المستخدم فعلا لدى الوكيل؟

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    لم يكن أحد الرؤوس المطلوبة موجودا. تحقّق من:

    - تهيئة وكيلك لتلك الرؤوس المحددة.
    - ما إذا كانت الرؤوس تُزال في مكان ما ضمن السلسلة.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    تمت مصادقة المستخدم لكنه غير موجود في `allowUsers`. إما أن تضيفه أو تزيل قائمة السماح.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    نجحت مصادقة trusted-proxy، لكن رأس `Origin` الخاص بالمتصفح لم يجتز فحوصات أصل واجهة التحكم.

    تحقّق من:

    - يتضمن `gateway.controlUi.allowedOrigins` أصل المتصفح الدقيق.
    - أنك لا تعتمد على أصول أحرف البدل إلا إذا كنت تريد عمدا سلوك السماح للجميع.
    - إذا كنت تستخدم عمدا وضع الرجوع إلى رأس Host، فتأكد من ضبط `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` عن قصد.

  </Accordion>
  <Accordion title="WebSocket still failing">
    تأكد من أن وكيلك:

    - يدعم ترقيات WebSocket (`Upgrade: websocket`، `Connection: upgrade`).
    - يمرر رؤوس الهوية في طلبات ترقية WebSocket (وليس HTTP فقط).
    - لا يملك مسار مصادقة منفصلا لاتصالات WebSocket.

  </Accordion>
</AccordionGroup>

## الترحيل من مصادقة الرمز

إذا كنت تنتقل من مصادقة الرمز إلى trusted-proxy:

<Steps>
  <Step title="Configure the proxy">
    هيّئ وكيلك لمصادقة المستخدمين وتمرير الرؤوس.
  </Step>
  <Step title="Test the proxy independently">
    اختبر إعداد الوكيل بشكل مستقل (`curl` مع الرؤوس).
  </Step>
  <Step title="Update OpenClaw config">
    حدّث تهيئة OpenClaw بمصادقة trusted-proxy.
  </Step>
  <Step title="Restart the Gateway">
    أعد تشغيل Gateway.
  </Step>
  <Step title="Test WebSocket">
    اختبر اتصالات WebSocket من واجهة التحكم.
  </Step>
  <Step title="Audit">
    شغّل `openclaw security audit` وراجع النتائج.
  </Step>
</Steps>

## ذو صلة

- [التهيئة](/ar/gateway/configuration) — مرجع التهيئة
- [الوصول البعيد](/ar/gateway/remote) — أنماط أخرى للوصول البعيد
- [الأمان](/ar/gateway/security) — دليل الأمان الكامل
- [Tailscale](/ar/gateway/tailscale) — بديل أبسط للوصول المحصور في tailnet

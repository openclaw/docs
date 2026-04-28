---
read_when:
    - تشغيل OpenClaw خلف reverse proxy مدرك للهوية
    - إعداد Pomerium أو Caddy أو nginx مع OAuth أمام OpenClaw
    - إصلاح أخطاء WebSocket 1008 غير المصرّح بها في إعدادات reverse proxy
    - تحديد مكان تعيين HSTS وترويسات تقوية HTTP الأخرى
sidebarTitle: Trusted proxy auth
summary: فوّض مصادقة Gateway إلى reverse proxy موثوق (Pomerium أو Caddy أو nginx + OAuth)
title: مصادقة reverse proxy الموثوق
x-i18n:
    generated_at: "2026-04-26T11:32:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64e0f4dee942aedec548135f0408e7773e7b498f8262af13a4d0eff262cae646
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

<Warning>
**ميزة حساسة أمنيًا.** يفوض هذا الوضع المصادقة بالكامل إلى reverse proxy الخاص بك. وقد يؤدي سوء الإعداد إلى تعريض Gateway للوصول غير المصرح به. اقرأ هذه الصفحة بعناية قبل التمكين.
</Warning>

## متى يُستخدم

استخدم وضع المصادقة `trusted-proxy` عندما:

- تشغّل OpenClaw خلف **proxy مدرك للهوية** (Pomerium، أو Caddy + OAuth، أو nginx + oauth2-proxy، أو Traefik + forward auth).
- يتولى proxy جميع عمليات المصادقة ويمرر هوية المستخدم عبر الترويسات.
- تكون في بيئة Kubernetes أو حاويات حيث يكون proxy هو المسار الوحيد إلى Gateway.
- تواجه أخطاء WebSocket ‏`1008 unauthorized` لأن المتصفحات لا تستطيع تمرير الرموز داخل حمولات WS.

## متى لا يُستخدم

- إذا كان proxy لا يصادق المستخدمين (مجرد مُنهٍ لـ TLS أو موازن تحميل).
- إذا كان هناك أي مسار إلى Gateway يتجاوز proxy (ثغرات جدار ناري، وصول من الشبكة الداخلية).
- إذا لم تكن متأكدًا من أن proxy يزيل/يستبدل ترويسات التحويل بشكل صحيح.
- إذا كنت تحتاج فقط إلى وصول شخصي لمستخدم واحد (فكّر في Tailscale Serve + loopback لإعداد أبسط).

## كيف يعمل

<Steps>
  <Step title="يقوم Proxy بمصادقة المستخدم">
    يقوم reverse proxy بمصادقة المستخدمين (OAuth أو OIDC أو SAML أو غير ذلك).
  </Step>
  <Step title="يضيف Proxy ترويسة هوية">
    يضيف Proxy ترويسة تحتوي على هوية المستخدم المصادق عليه (مثل `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="يتحقق Gateway من المصدر الموثوق">
    يتحقق OpenClaw من أن الطلب جاء من **عنوان IP لـ proxy موثوق** (مُهيّأ في `gateway.trustedProxies`).
  </Step>
  <Step title="يستخرج Gateway الهوية">
    يستخرج OpenClaw هوية المستخدم من الترويسة المهيأة.
  </Step>
  <Step title="التفويض">
    إذا كان كل شيء صحيحًا، تتم إجازة الطلب.
  </Step>
</Steps>

## سلوك الاقتران في Control UI

عندما يكون `gateway.auth.mode = "trusted-proxy"` نشطًا ويمر الطلب بفحوصات trusted-proxy، يمكن لجلسات WebSocket الخاصة بـ Control UI الاتصال دون هوية اقتران الجهاز.

الآثار المترتبة:

- لم يعد الاقتران هو البوابة الأساسية للوصول إلى Control UI في هذا الوضع.
- تصبح سياسة مصادقة reverse proxy وقيمة `allowUsers` هما آلية التحكم الفعلية في الوصول.
- أبقِ دخول Gateway مقصورًا على عناوين IP الخاصة بالـ proxy الموثوق فقط (`gateway.trustedProxies` + جدار ناري).

## التهيئة

```json5
{
  gateway: {
    // تتوقع مصادقة trusted-proxy طلبات من مصدر proxy موثوق غير loopback
    bind: "lan",

    // هام جدًا: أضف هنا فقط عناوين IP الخاصة بالـ proxy
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // الترويسة التي تحتوي على هوية المستخدم المصادق عليه (مطلوبة)
        userHeader: "x-forwarded-user",

        // اختياري: ترويسات يجب أن تكون موجودة (للتحقق من proxy)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // اختياري: القصر على مستخدمين محددين (الفارغ = السماح للجميع)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

<Warning>
**قواعد وقت التشغيل المهمة**

- ترفض مصادقة trusted-proxy الطلبات القادمة من loopback (`127.0.0.1` و`::1` وCIDRs الخاصة بـ loopback).
- لا تستوفي reverse proxies على loopback في المضيف نفسه متطلبات مصادقة trusted-proxy.
- في إعدادات proxy على loopback في المضيف نفسه، استخدم بدلًا من ذلك مصادقة الرمز/كلمة المرور، أو مرّر الحركة عبر عنوان trusted proxy غير loopback يستطيع OpenClaw التحقق منه.
- تظل عمليات نشر Control UI غير المعتمدة على loopback بحاجة إلى `gateway.controlUi.allowedOrigins` صريحة.
- **تتغلب أدلة الترويسات المحوّلة على محلية loopback.** إذا وصل طلب على loopback لكنه يحمل ترويسات `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` تشير إلى مصدر غير محلي، فإن هذا الدليل يُسقط ادعاء المحلية على loopback. ويُعامل الطلب على أنه بعيد لأغراض الاقتران، ومصادقة trusted-proxy، وضبط هوية الجهاز في Control UI. وهذا يمنع proxy على loopback في المضيف نفسه من تمرير هوية الترويسات المحوّلة إلى مصادقة trusted-proxy.
</Warning>

### مرجع التهيئة

<ParamField path="gateway.trustedProxies" type="string[]" required>
  مصفوفة عناوين IP الخاصة بالـ proxy التي يجب الوثوق بها. وتُرفض الطلبات من عناوين IP الأخرى.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  يجب أن تكون `"trusted-proxy"`.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  اسم الترويسة التي تحتوي على هوية المستخدم المصادق عليه.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  ترويسات إضافية يجب أن تكون موجودة حتى يُعتبر الطلب موثوقًا.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  قائمة سماح لهويات المستخدمين. والفارغ يعني السماح لكل المستخدمين المصادق عليهم.
</ParamField>

## إنهاء TLS وHSTS

استخدم نقطة إنهاء TLS واحدة وطبّق HSTS هناك.

<Tabs>
  <Tab title="إنهاء TLS في Proxy (موصى به)">
    عندما يتولى reverse proxy التعامل مع HTTPS لـ `https://control.example.com`، عيّن `Strict-Transport-Security` في proxy لذلك النطاق.

    - مناسب جيدًا لعمليات النشر المواجهة للإنترنت.
    - يبقي الشهادة + سياسة تقوية HTTP في مكان واحد.
    - يمكن لـ OpenClaw أن يبقى على HTTP عبر loopback خلف proxy.

    مثال على قيمة الترويسة:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="إنهاء TLS في Gateway">
    إذا كان OpenClaw نفسه يقدّم HTTPS مباشرة (من دون proxy ينهي TLS)، فعيّن:

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

    تقبل `strictTransportSecurity` قيمة ترويسة نصية، أو `false` لتعطيلها صراحة.

  </Tab>
</Tabs>

### إرشادات الطرح

- ابدأ أولًا بعمر أقصى قصير (مثل `max-age=300`) أثناء التحقق من الحركة.
- ارفع إلى قيم طويلة الأمد (مثل `max-age=31536000`) فقط بعد ارتفاع مستوى الثقة.
- أضف `includeSubDomains` فقط إذا كانت كل النطاقات الفرعية جاهزة لـ HTTPS.
- استخدم preload فقط إذا كنت تستوفي عمدًا متطلبات preload لمجموعة نطاقاتك الكاملة.
- لا تستفيد بيئات التطوير المحلية المعتمدة على loopback فقط من HSTS.

## أمثلة على إعدادات Proxy

<AccordionGroup>
  <Accordion title="Pomerium">
    يمرر Pomerium الهوية في `x-pomerium-claim-email` (أو ترويسات claims أخرى) وJWT في `x-pomerium-jwt-assertion`.

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

    مقتطف من تهيئة Pomerium:

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
    يستطيع Caddy مع Plugin `caddy-security` مصادقة المستخدمين وتمرير ترويسات الهوية.

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

    مقتطف من Caddyfile:

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

    مقتطف من تهيئة nginx:

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
        trustedProxies: ["172.17.0.1"], // عنوان IP لحاوية Traefik
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

يرفض OpenClaw التهيئات الملتبسة حيث يكون كل من `gateway.auth.token` (أو `OPENCLAW_GATEWAY_TOKEN`) ووضع `trusted-proxy` نشطين في الوقت نفسه. وقد تتسبب تهيئات الرموز المختلطة في أن تصادق طلبات loopback بصمت عبر مسار مصادقة خاطئ.

إذا رأيت الخطأ `mixed_trusted_proxy_token` عند بدء التشغيل:

- فأزل الرمز المشترك عند استخدام وضع trusted-proxy، أو
- بدّل `gateway.auth.mode` إلى `"token"` إذا كنت تقصد المصادقة المعتمدة على الرمز.

كما أن مصادقة trusted-proxy على loopback تفشل في الوضع المغلق: يجب على المستدعين من المضيف نفسه تمرير ترويسات الهوية المهيأة عبر trusted proxy بدلًا من أن تتم مصادقتهم بصمت.

## ترويسة نطاقات المشغّل

تُعد مصادقة trusted-proxy وضع HTTP **يحمل الهوية**، لذا يمكن للمستدعين اختياريًا التصريح بنطاقات المشغّل عبر `x-openclaw-scopes`.

أمثلة:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

السلوك:

- عند وجود الترويسة، يحترم OpenClaw مجموعة النطاقات المعلنة.
- عند وجود الترويسة لكنها فارغة، يعلن الطلب **عدم وجود** أي نطاقات مشغّل.
- عند غياب الترويسة، تعود واجهات HTTP الحاملة للهوية العادية إلى مجموعة النطاقات الافتراضية القياسية للمشغّل.
- تكون **مسارات HTTP الخاصة بـ Plugin لمصادقة Gateway** أضيق افتراضيًا: عند غياب `x-openclaw-scopes`، يعود نطاق وقت التشغيل فيها إلى `operator.write`.
- لا يزال يتعين على طلبات HTTP ذات مصدر المتصفح اجتياز `gateway.controlUi.allowedOrigins` (أو وضع الرجوع المتعمد لترويسة Host) حتى بعد نجاح مصادقة trusted-proxy.

القاعدة العملية: أرسل `x-openclaw-scopes` صراحة عندما تريد أن يكون طلب trusted-proxy أضيق من الإعدادات الافتراضية، أو عندما يحتاج مسار Plugin لمصادقة Gateway إلى شيء أقوى من نطاق write.

## قائمة التحقق الأمنية

قبل تمكين مصادقة trusted-proxy، تحقّق مما يلي:

- [ ] **Proxy هو المسار الوحيد**: تم تقييد منفذ Gateway بجدار ناري من كل شيء باستثناء proxy.
- [ ] **قيمة trustedProxies دنيا**: فقط عناوين IP الفعلية الخاصة بالـ proxy، وليس شبكات فرعية كاملة.
- [ ] **لا يوجد مصدر proxy على loopback**: تفشل مصادقة trusted-proxy في الوضع المغلق لطلبات loopback.
- [ ] **Proxy يزيل الترويسات**: يقوم proxy لديك باستبدال (وليس إلحاق) ترويسات `x-forwarded-*` القادمة من العملاء.
- [ ] **إنهاء TLS**: يتولى proxy TLS؛ ويتصل المستخدمون عبر HTTPS.
- [ ] **قيمة allowedOrigins صريحة**: تستخدم Control UI غير المعتمدة على loopback قيمة `gateway.controlUi.allowedOrigins` صريحة.
- [ ] **تم تعيين allowUsers** (موصى به): قصر الوصول على مستخدمين معروفين بدلًا من السماح لأي مستخدم مصادق عليه.
- [ ] **لا توجد تهيئة رموز مختلطة**: لا تعيّن كلًا من `gateway.auth.token` و`gateway.auth.mode: "trusted-proxy"`.

## التدقيق الأمني

سيقوم `openclaw security audit` بالإبلاغ عن مصادقة trusted-proxy على أنها نتيجة ذات خطورة **حرجة**. وهذا مقصود — فهو تذكير بأنك تفوض الأمان إلى إعداد proxy الخاص بك.

يتحقق التدقيق من:

- تحذير/تذكير أساسي `gateway.trusted_proxy_auth` بمستوى warning/critical
- غياب تهيئة `trustedProxies`
- غياب تهيئة `userHeader`
- قيمة `allowUsers` فارغة (تسمح لأي مستخدم مصادق عليه)
- سياسة مصدر المتصفح wildcard أو المفقودة على أسطح Control UI المكشوفة

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    لم يأتِ الطلب من عنوان IP موجود في `gateway.trustedProxies`. تحقق من:

    - هل عنوان IP الخاص بالـ proxy صحيح؟ (قد تتغير عناوين IP لحاويات Docker.)
    - هل يوجد موازن تحميل أمام proxy؟
    - استخدم `docker inspect` أو `kubectl get pods -o wide` للعثور على عناوين IP الفعلية.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    رفض OpenClaw طلب trusted-proxy مصدره loopback.

    تحقق من:

    - هل يتصل proxy من `127.0.0.1` / `::1`؟
    - هل تحاول استخدام مصادقة trusted-proxy مع reverse proxy على loopback في المضيف نفسه؟

    الحل:

    - استخدم مصادقة الرمز/كلمة المرور لإعدادات proxy على loopback في المضيف نفسه، أو
    - مرّر الحركة عبر عنوان trusted proxy غير loopback واحتفظ بعنوان IP هذا في `gateway.trustedProxies`.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    كانت ترويسة المستخدم فارغة أو مفقودة. تحقق من:

    - هل proxy مهيأ لتمرير ترويسات الهوية؟
    - هل اسم الترويسة صحيح؟ (غير حساس لحالة الأحرف، لكن التهجئة مهمة)
    - هل تمت مصادقة المستخدم فعلًا عند proxy؟

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    لم تكن إحدى الترويسات المطلوبة موجودة. تحقق من:

    - تهيئة proxy الخاصة بهذه الترويسات المحددة.
    - ما إذا كانت الترويسات تُزال في مكان ما ضمن السلسلة.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    المستخدم مصادق عليه لكنه غير موجود في `allowUsers`. إما أن تضيفه أو تزيل قائمة السماح.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    نجحت مصادقة trusted-proxy، لكن ترويسة `Origin` الخاصة بالمتصفح لم تجتز فحوصات أصل Control UI.

    تحقق من:

    - أن `gateway.controlUi.allowedOrigins` تتضمن أصل المتصفح الدقيق.
    - أنك لا تعتمد على أصول wildcard ما لم تكن تريد سلوك السماح للجميع عمدًا.
    - إذا كنت تستخدم عمدًا وضع الرجوع لترويسة Host، فتأكد من تعيين `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` عن قصد.

  </Accordion>
  <Accordion title="WebSocket still failing">
    تأكد من أن proxy لديك:

    - يدعم ترقيات WebSocket ‏(`Upgrade: websocket` و`Connection: upgrade`).
    - يمرر ترويسات الهوية في طلبات ترقية WebSocket (وليس فقط HTTP).
    - لا يملك مسار مصادقة منفصلًا لاتصالات WebSocket.

  </Accordion>
</AccordionGroup>

## الترحيل من مصادقة الرمز

إذا كنت تنتقل من مصادقة الرمز إلى trusted-proxy:

<Steps>
  <Step title="هيّئ Proxy">
    هيّئ proxy ليصادق المستخدمين ويمرر الترويسات.
  </Step>
  <Step title="اختبر Proxy بشكل مستقل">
    اختبر إعداد proxy بشكل مستقل (`curl` مع الترويسات).
  </Step>
  <Step title="حدّث تهيئة OpenClaw">
    حدّث تهيئة OpenClaw بمصادقة trusted-proxy.
  </Step>
  <Step title="أعد تشغيل Gateway">
    أعد تشغيل Gateway.
  </Step>
  <Step title="اختبر WebSocket">
    اختبر اتصالات WebSocket من Control UI.
  </Step>
  <Step title="التدقيق">
    شغّل `openclaw security audit` وراجع النتائج.
  </Step>
</Steps>

## ذو صلة

- [التهيئة](/ar/gateway/configuration) — مرجع التهيئة
- [الوصول عن بُعد](/ar/gateway/remote) — أنماط الوصول عن بُعد الأخرى
- [الأمان](/ar/gateway/security) — دليل الأمان الكامل
- [Tailscale](/ar/gateway/tailscale) — بديل أبسط للوصول داخل tailnet فقط

---
read_when:
    - تشغيل OpenClaw خلف وكيل مدرك للهوية
    - إعداد Pomerium أو Caddy أو nginx مع OAuth أمام OpenClaw
    - إصلاح أخطاء WebSocket 1008 لعدم التخويل في إعدادات الوكيل العكسي
    - تحديد موضع ضبط HSTS وغيره من ترويسات تقوية أمان HTTP
sidebarTitle: Trusted proxy auth
summary: فوّض مصادقة Gateway إلى وكيل عكسي موثوق (Pomerium، Caddy، nginx + OAuth)
title: مصادقة الوكيل الموثوق
x-i18n:
    generated_at: "2026-07-12T06:00:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 612070e4872af23c2ac41b529c8b2fa8513bf18fccc053783f55ad00b44e1a5f
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**ميزة حساسة أمنيًا.** يفوّض هذا الوضع المصادقة بالكامل إلى الوكيل العكسي لديك. قد يؤدي سوء الإعداد إلى تعريض Gateway لوصول غير مصرّح به. اقرأ هذه الصفحة بعناية قبل التفعيل.
</Warning>

## متى يُستخدم

- تشغّل OpenClaw خلف **وكيل مدرك للهوية** (Pomerium، أو Caddy + OAuth، أو nginx + oauth2-proxy، أو Traefik + مصادقة مُمرّرة).
- يتولى وكيلك جميع عمليات المصادقة ويمرر هوية المستخدم عبر الترويسات.
- تعمل في بيئة Kubernetes أو حاويات يكون فيها الوكيل هو المسار الوحيد إلى Gateway.
- تواجه أخطاء WebSocket من نوع `1008 unauthorized` لأن المتصفحات لا تستطيع تمرير الرموز المميزة في حمولات WS.

## متى يجب عدم استخدامه

- لا يصادق وكيلك المستخدمين (بل يعمل فقط كنقطة إنهاء TLS أو موازن حمل).
- يوجد أي مسار إلى Gateway يتجاوز الوكيل (ثغرات في جدار الحماية أو وصول عبر الشبكة الداخلية).
- لست متأكدًا مما إذا كان وكيلك يزيل الترويسات المُمرّرة أو يستبدلها بشكل صحيح.
- لا تحتاج إلا إلى وصول شخصي لمستخدم واحد (فكّر في استخدام Tailscale Serve + local loopback بدلًا من ذلك).

## آلية العمل

<Steps>
  <Step title="يصادق الوكيل المستخدم">
    يصادق الوكيل العكسي المستخدمين (OAuth أو OIDC أو SAML، وما إلى ذلك).
  </Step>
  <Step title="يضيف الوكيل ترويسة هوية">
    يضيف الوكيل ترويسة تحتوي على هوية المستخدم المصادَق عليه (مثل `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="يتحقق Gateway من المصدر الموثوق">
    يتحقق OpenClaw من أن الطلب أتى من **عنوان IP لوكيل موثوق** (`gateway.trustedProxies`) وأنه ليس عنوان local loopback الخاص بـ Gateway أو عنوان واجهته المحلية.
  </Step>
  <Step title="يستخرج Gateway الهوية">
    يقرأ OpenClaw الترويسات المطلوبة، ثم يقرأ هوية المستخدم من الترويسة المُعدّة.
  </Step>
  <Step title="التخويل">
    إذا اجتازت جميع عمليات التحقق، واجتاز المستخدم `allowUsers` (عند تعيينها)، يُخوَّل الطلب.
  </Step>
</Steps>

## الإعداد

```json5
{
  gateway: {
    // Trusted-proxy auth expects the proxy's source IP to be non-loopback by default
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
**قواعد وقت التشغيل، حسب ترتيب التقييم**

1. يجب أن يطابق عنوان IP لمصدر الطلب `gateway.trustedProxies` (مع مراعاة CIDR)، وإلا يُرفض (`trusted_proxy_untrusted_source`).
2. تُرفض الطلبات الواردة من مصدر local loopback (`127.0.0.1` و`::1`) ما لم تكن `gateway.auth.trustedProxy.allowLoopback = true` وكان عنوان local loopback موجودًا أيضًا في `trustedProxies` (`trusted_proxy_loopback_source`). يُنفَّذ هذا التحقق قبل التحقق من الترويسات، لذلك يفشل مصدر local loopback بهذه الطريقة حتى إذا كانت الترويسات المطلوبة مفقودة أيضًا.
3. تُرفض المصادر غير التابعة لـ local loopback التي تطابق أحد عناوين واجهات الشبكة المحلية الخاصة بمضيف Gateway كإجراء حماية من الانتحال (`trusted_proxy_local_interface_source`). وإذا فشل اكتشاف الواجهات نفسه، يُرفض الطلب أيضًا (`trusted_proxy_local_interface_check_failed`).
4. يجب أن تكون `requiredHeaders` و`userHeader` موجودتين وغير فارغتين.
5. يجب أن تتضمن `allowUsers`، إن لم تكن فارغة، المستخدم المستخرَج.

**تتجاوز أدلة الترويسات المُمرّرة صفة local loopback عند الرجوع المحلي المباشر.** إذا وصل طلب عبر local loopback لكنه يحمل الترويسة `Forwarded` أو أي ترويسة `X-Forwarded-*` أو `X-Real-IP`، فإن هذا الدليل يجعله غير مؤهل للرجوع إلى كلمة المرور المحلية المباشرة وللتقييد بهوية الجهاز، رغم أنه يظل يفشل في مصادقة الوكيل الموثوق لكونه صادرًا من local loopback.

تمنح `allowLoopback` العمليات المحلية على مضيف Gateway درجة الثقة نفسها الممنوحة للوكيل العكسي. لا تفعّلها إلا عندما يظل Gateway محميًا بجدار ناري من الوصول البعيد المباشر، ويزيل الوكيل المحلي ترويسات الهوية المقدَّمة من العميل أو يستبدلها.

يجب على عملاء Gateway الداخليين الذين لا يمرون عبر الوكيل العكسي استخدام `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`، وليس ترويسات هوية الوكيل الموثوق. ولا تزال عمليات نشر واجهة التحكم على عناوين غير تابعة لـ local loopback بحاجة إلى تعيين `gateway.controlUi.allowedOrigins` صراحةً.
</Warning>

### مرجع الإعداد

<ParamField path="gateway.trustedProxies" type="string[]" required>
  مصفوفة بعناوين IP للوكلاء (أو نطاقات CIDR) المطلوب الوثوق بها. تُرفض الطلبات الواردة من عناوين IP أخرى.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  يجب أن تكون `"trusted-proxy"`.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  اسم الترويسة التي تحتوي على هوية المستخدم المصادَق عليه.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  ترويسات إضافية يجب أن تكون موجودة لكي يُعد الطلب موثوقًا.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  قائمة سماح بهويات المستخدمين. تعني القيمة الفارغة السماح لجميع المستخدمين المصادَق عليهم.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean" default="false">
  دعم اختياري للوكلاء العكسيين العاملين عبر local loopback على المضيف نفسه.
</ParamField>

<Warning>
لا تفعّل `allowLoopback` إلا عندما يكون الوكيل العكسي المحلي هو حد الثقة المقصود. يمكن لأي عملية محلية تستطيع الاتصال بـ Gateway محاولة إرسال ترويسات هوية الوكيل، لذا اجعل الوصول المباشر إلى Gateway خاصًا بالمضيف، واشترط ترويسات يملكها الوكيل مثل `x-forwarded-proto`، أو ترويسة إثبات موقّعة إذا كان وكيلك يدعمها.
</Warning>

## سلوك إقران واجهة التحكم

عندما يكون `gateway.auth.mode = "trusted-proxy"` نشطًا ويجتاز الطلب عمليات تحقق الوكيل الموثوق، يمكن لجلسات WebSocket الخاصة بواجهة التحكم الاتصال دون هوية إقران الجهاز.

الآثار المتعلقة بالنطاق:

- تتصل جلسات WebSocket الخاصة بواجهة التحكم التي لا ترتبط بجهاز، لكنها لا تتلقى افتراضيًا أي نطاقات للمشغّل. يمسح OpenClaw قائمة النطاقات المطلوبة إلى `[]` لكي لا تتمكن جلسة غير مرتبطة بجهاز أو رمز مميز مقترن ومعتمد من التصريح بأذوناتها ذاتيًا.
- إذا فشلت الأساليب برسالة `missing scope` بعد نجاح اتصال WebSocket، فاستخدم HTTPS لكي يتمكن المتصفح من إنشاء هوية الجهاز وإكمال الإقران. راجع [استخدام HTTP غير الآمن لواجهة التحكم](/ar/web/control-ui#insecure-http).
- للاستخدام الطارئ فقط: يحافظ `gateway.controlUi.dangerouslyDisableDeviceAuth=true` على النطاقات المطلوبة حتى دون هوية جهاز. يمثل هذا خفضًا أمنيًا شديدًا؛ تراجع عنه بسرعة. راجع [استخدام HTTP غير الآمن لواجهة التحكم](/ar/web/control-ui#insecure-http).

تقييد النطاقات عبر الوكيل العكسي: إذا أرسل وكيلك `x-openclaw-scopes` في طلب ترقية WebSocket الخاص بواجهة التحكم، يقيّد OpenClaw نطاقات الجلسة إلى تقاطع النطاقات المطلوبة مع النطاقات المعلنة. لا تمنح هذه الترويسة نطاقات؛ بل تضيّق فقط ما يمكن للجلسة الاحتفاظ به.

الآثار:

- لم يعد الإقران هو البوابة الأساسية للوصول إلى واجهة التحكم في هذا الوضع.
- تصبح سياسة المصادقة في وكيلك العكسي و`allowUsers` آلية التحكم الفعلية في الوصول.
- أبقِ حركة المرور الواردة إلى Gateway مقصورة على عناوين IP للوكلاء الموثوقين فقط (`gateway.trustedProxies` + جدار الحماية).

عملاء WebSocket المخصصون ليسوا جلسات لواجهة التحكم. لا يمنح `gateway.controlUi.dangerouslyDisableDeviceAuth` نطاقات لعملاء عشوائيين يستخدمون `client.mode: "backend"` أو يتخذون شكل عملاء CLI. يجب أن تستخدم الأتمتة المخصصة هوية الجهاز والإقران، أو مسار مساعد الواجهة الخلفية المحلي المباشر المحجوز `client.id: "gateway-client"`، أو [Plugin استدعاء HTTP RPC الإداري](/ar/plugins/admin-http-rpc) عندما تكون واجهة طلب/استجابة HTTP أنسب.

## ترويسة نطاقات المشغّل

مصادقة الوكيل الموثوق هي وضع HTTP **يحمل الهوية**، لذلك يمكن للمتصلين اختياريًا إعلان نطاقات المشغّل باستخدام `x-openclaw-scopes` في طلبات HTTP API.

ملاحظة: تحدد مصافحة بروتوكول Gateway وربط هوية الجهاز نطاقات WebSocket. في طلبات ترقية WebSocket الخاصة بواجهة التحكم، لا تمثل `x-openclaw-scopes` سوى حد أقصى لنطاقات الجلسة المتفاوض عليها، وليست منحة. راجع [سلوك إقران واجهة التحكم](#control-ui-pairing-behavior).

أمثلة:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

السلوك:

- عندما تكون الترويسة موجودة، يحترم OpenClaw مجموعة النطاقات المعلنة.
- عندما تكون الترويسة موجودة لكنها فارغة، يعلن الطلب عدم وجود **أي** نطاقات للمشغّل.
- عندما تكون الترويسة غائبة، ترجع واجهات HTTP API العادية الحاملة للهوية إلى مجموعة نطاقات المشغّل الافتراضية القياسية (`operator.admin` و`operator.read` و`operator.write` و`operator.approvals` و`operator.pairing` و`operator.talk.secrets`).
- تكون **مسارات HTTP الخاصة بالـ Plugin** والمصادَق عليها عبر Gateway أضيق افتراضيًا: عند غياب `x-openclaw-scopes`، يرجع نطاق وقت التشغيل الخاص بها إلى `operator.write` فقط.
- يجب أن تجتاز طلبات HTTP الصادرة من المتصفح `gateway.controlUi.allowedOrigins` (أو وضع الرجوع المتعمد إلى ترويسة Host) حتى بعد نجاح مصادقة الوكيل الموثوق.

قاعدة عملية: أرسل `x-openclaw-scopes` صراحةً عندما تريد أن يكون طلب الوكيل الموثوق أضيق من الإعدادات الافتراضية، أو عندما يحتاج مسار Plugin مصادَق عليه عبر Gateway إلى صلاحية أقوى من نطاق الكتابة.

## إنهاء TLS وHSTS

استخدم نقطة واحدة لإنهاء TLS وطبّق HSTS فيها.

<Tabs>
  <Tab title="إنهاء TLS عند الوكيل (موصى به)">
    عندما يتولى الوكيل العكسي HTTPS للنطاق `https://control.example.com`، عيّن `Strict-Transport-Security` في الوكيل لذلك النطاق.

    - مناسب لعمليات النشر المواجهة للإنترنت.
    - يحافظ على سياسة الشهادات وتقوية HTTP في مكان واحد.
    - يمكن أن يظل OpenClaw على HTTP عبر local loopback خلف الوكيل.

    مثال لقيمة الترويسة:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="إنهاء TLS عند Gateway">
    إذا كان OpenClaw نفسه يقدّم HTTPS مباشرةً (دون وكيل ينهي TLS)، فعيّن:

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

    يقبل `strictTransportSecurity` قيمة نصية للترويسة، أو `false` لتعطيله صراحةً.

  </Tab>
</Tabs>

### إرشادات الطرح

- ابدأ أولًا بعمر أقصى قصير (مثل `max-age=300`) أثناء التحقق من حركة المرور.
- زِد القيمة إلى مدة طويلة (مثل `max-age=31536000`) فقط بعد اكتساب ثقة عالية.
- أضف `includeSubDomains` فقط إذا كانت جميع النطاقات الفرعية جاهزة لاستخدام HTTPS.
- استخدم التحميل المسبق فقط إذا كنت تستوفي عمدًا متطلباته لمجموعة نطاقاتك الكاملة.
- لا تستفيد بيئة التطوير المحلية التي تقتصر على local loopback من HSTS.

## أمثلة على إعداد الوكيل

<AccordionGroup>
  <Accordion title="Pomerium">
    يمرر Pomerium الهوية في `x-pomerium-claim-email` (أو ترويسات مطالبات أخرى) وJWT في `x-pomerium-jwt-assertion`.

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

    مقتطف من إعداد Pomerium:

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
    يستطيع Caddy مع Plugin ‏`caddy-security` مصادقة المستخدمين وتمرير ترويسات الهوية.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // عنوان IP لوكيل Caddy/sidecar
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

    ```caddy
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
        trustedProxies: ["10.0.0.1"], // عنوان IP لـ nginx/oauth2-proxy
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-auth-request-email",
          },
        },
      },
    }
    ```

    مقتطف من إعداد nginx:

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
  <Accordion title="Traefik مع المصادقة المُمرَّرة">
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

## إعداد الرموز المميّزة المختلط

يرفض بدء تشغيل Gateway مصادقة الوكيل الموثوق إذا كان رمز مميّز مشترك مُعدًّا أيضًا (`gateway.auth.token` أو `OPENCLAW_GATEWAY_TOKEN`). الخياران متنافيان، لأن الرمز المميّز المشترك سيسمح للمتصلين من المضيف نفسه بالمصادقة عبر مسار مختلف تمامًا عن الهوية التي تحقق منها الوكيل، والتي صُمم هذا الوضع لفرضها.

إذا فشل بدء التشغيل برسالة خطأ مثل `gateway auth mode is trusted-proxy, but a shared token is also configured`:

- أزل الرمز المميّز المشترك عند استخدام وضع الوكيل الموثوق، أو
- غيّر `gateway.auth.mode` إلى `"token"` إذا كنت تقصد استخدام المصادقة المستندة إلى رمز مميّز.

تظل ترويسات هوية الوكيل الموثوق عبر local loopback تفشل بشكل مغلق: لا تتم مصادقة المتصلين من المضيف نفسه ضمنيًا كمستخدمي الوكيل. ويمكن لمتصلِي OpenClaw الداخليين الذين يتجاوزون الوكيل المصادقة باستخدام `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` بدلًا من ذلك. يظل الرجوع إلى الرمز المميّز غير مدعوم عمدًا في وضع الوكيل الموثوق.

## قائمة التحقق الأمنية

قبل تمكين مصادقة الوكيل الموثوق، تحقق مما يلي:

- [ ] **الوكيل هو المسار الوحيد**: منفذ Gateway محمي بجدار ناري من كل شيء باستثناء وكيلك.
- [ ] **`trustedProxies` في حدها الأدنى**: عناوين IP الفعلية لوكيلك فقط، وليس شبكات فرعية كاملة.
- [ ] **مصدر وكيل local loopback مقصود**: تفشل مصادقة الوكيل الموثوق بشكل مغلق للطلبات ذات مصدر local loopback ما لم يُمكّن `gateway.auth.trustedProxy.allowLoopback` صراحةً لوكيل على المضيف نفسه.
- [ ] **الوكيل يزيل الترويسات**: يستبدل وكيلك ترويسات `x-forwarded-*` الواردة من العملاء، ولا يلحقها.
- [ ] **إنهاء TLS**: يتولى وكيلك TLS؛ ويتصل المستخدمون عبر HTTPS.
- [ ] **`allowedOrigins` محددة صراحةً**: تستخدم واجهة التحكم غير المتصلة عبر local loopback قيمة صريحة لـ `gateway.controlUi.allowedOrigins`.
- [ ] **`allowUsers` مضبوطة** (موصى به): اقصر الوصول على المستخدمين المعروفين بدلًا من السماح لأي مستخدم تمت مصادقته.
- [ ] **لا يوجد إعداد مختلط للرمز المميّز**: لا تضبط كلًا من `gateway.auth.token` و`gateway.auth.mode: "trusted-proxy"`.
- [ ] **الرجوع المحلي إلى كلمة المرور خاص**: إذا أعددت `gateway.auth.password` للمتصلين الداخليين المباشرين، فأبقِ منفذ Gateway محميًا بجدار ناري بحيث لا يتمكن العملاء البعيدون غير المارين بالوكيل من الوصول إليه مباشرةً.

## التدقيق الأمني

يُبلغ `openclaw security audit` عن مصادقة الوكيل الموثوق كنتيجة ذات خطورة **حرجة**. هذا مقصود؛ فهو تذكير بأنك تفوض الأمان إلى إعداد وكيلك.

يتحقق التدقيق مما يلي:

- التحذير/التذكير الحرج الأساسي `gateway.trusted_proxy_auth`.
- غياب إعداد `trustedProxies`.
- غياب إعداد `userHeader`.
- كون `allowUsers` فارغة (ما يسمح لأي مستخدم تمت مصادقته).
- تمكين `allowLoopback` لمصادر الوكيل الموجودة على المضيف نفسه.

تنطبق أيضًا نتائج منفصلة غير خاصة بالوكيل الموثوق كلما كانت واجهة التحكم مكشوفة: استخدام حرف بدل أو غياب `gateway.controlUi.allowedOrigins`، والرجوع إلى أصل ترويسة Host.

## استكشاف الأخطاء وإصلاحها

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    لم يأتِ الطلب من عنوان IP موجود في `gateway.trustedProxies`. تحقق مما يلي:

    - هل عنوان IP الخاص بالوكيل صحيح؟ (قد تتغير عناوين IP لحاويات Docker.)
    - هل يوجد موازن تحميل أمام وكيلك؟
    - استخدم `docker inspect` أو `kubectl get pods -o wide` للعثور على عناوين IP الفعلية.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    رفض OpenClaw طلب وكيل موثوق مصدره local loopback.

    تحقق مما يلي:

    - هل يتصل الوكيل من `127.0.0.1` / `::1`؟
    - هل تحاول استخدام مصادقة الوكيل الموثوق مع وكيل عكسي عبر local loopback على المضيف نفسه؟

    الإصلاح:

    - فضّل المصادقة بالرمز المميّز/كلمة المرور للعملاء الداخليين على المضيف نفسه الذين لا يمرون عبر الوكيل، أو
    - وجّه الاتصال عبر عنوان وكيل موثوق ليس عنوان local loopback، واحتفظ بعنوان IP هذا في `gateway.trustedProxies`، أو
    - بالنسبة إلى وكيل عكسي مقصود على المضيف نفسه، اضبط `gateway.auth.trustedProxy.allowLoopback = true`، واحتفظ بعنوان local loopback في `gateway.trustedProxies`، وتأكد من أن الوكيل يزيل ترويسات الهوية أو يستبدلها.

  </Accordion>
  <Accordion title="trusted_proxy_local_interface_source / trusted_proxy_local_interface_check_failed">
    تطابق عنوان IP لمصدر الطلب مع أحد عناوين واجهات الشبكة غير التابعة لـ local loopback في مضيف Gateway نفسه (وليس الوكيل)، وذلك للحماية من حركة المرور المنتحلة من المضيف نفسه على شبكات tailnet أو شبكات جسر Docker. وتعني `..._check_failed` أن اكتشاف الواجهات نفسه واجه خطأ، لذا يفشل OpenClaw بشكل مغلق.

    تحقق مما يلي:

    - هل ترسل عملية على مضيف Gateway نفسه ترويسات الهوية مباشرةً متجاوزةً الوكيل؟
    - هل يعمل الوكيل في مساحة أسماء الشبكة نفسها التي يعمل فيها Gateway، بعنوان IP يظهر أيضًا كواجهة محلية؟

    الإصلاح: وجّه حركة مرور الوكيل عبر عنوان غير مرتبط محليًا أيضًا بمضيف Gateway، أو استخدم `allowLoopback` فقط لإعداد وكيل حقيقي على المضيف نفسه.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    كانت ترويسة المستخدم فارغة أو مفقودة. تحقق مما يلي:

    - هل وكيلك مُعد لتمرير ترويسات الهوية؟
    - هل اسم الترويسة صحيح؟ (غير حساس لحالة الأحرف، لكن التهجئة مهمة)
    - هل تمت مصادقة المستخدم فعليًا لدى الوكيل؟

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    لم تكن إحدى الترويسات المطلوبة موجودة. تحقق مما يلي:

    - إعداد وكيلك لتلك الترويسات المحددة.
    - ما إذا كانت الترويسات تُزال في مكان ما ضمن السلسلة.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    تمت مصادقة المستخدم لكنه غير موجود في `allowUsers`. إما أن تضفه أو تزيل قائمة السماح.
  </Accordion>
  <Accordion title="trusted_proxy_no_proxies_configured / trusted_proxy_config_missing">
    قيمة `gateway.auth.mode` هي `"trusted-proxy"` لكن `gateway.trustedProxies` فارغة، أو أن `gateway.auth.trustedProxy` نفسها مفقودة. يُرفض كل طلب حتى يتم ضبطهما معًا.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    نجحت مصادقة الوكيل الموثوق، لكن ترويسة المتصفح `Origin` لم تجتز عمليات تحقق واجهة التحكم من الأصل.

    تحقق مما يلي:

    - تتضمن `gateway.controlUi.allowedOrigins` أصل المتصفح المطابق تمامًا.
    - لا تعتمد على أصول حرف البدل إلا إذا كنت تريد عمدًا سلوك السماح للجميع.
    - إذا كنت تستخدم عمدًا وضع الرجوع إلى ترويسة Host، فاضبط `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` عن قصد.

  </Accordion>
  <Accordion title="ينجح الاتصال لكن الأساليب تُبلغ عن نطاق مفقود">
    يتصل WebSocket، لكن `chat.history` أو `sessions.list` أو
    `models.list` يفشل مع `missing scope: operator.read`.

    الأسباب الشائعة:

    - جلسة واجهة تحكم بلا جهاز: يمكن لمصادقة الوكيل الموثوق السماح باتصال WebSocket من دون هوية جهاز، لكن OpenClaw يمسح النطاقات في الجلسات التي بلا جهاز حسب التصميم.
    - عميل خلفي مخصص: يقتصر `gateway.controlUi.dangerouslyDisableDeviceAuth` على واجهة التحكم، ولا يمنح نطاقات لعملاء WebSocket عشوائيين للواجهة الخلفية أو المشابهين لـ CLI.
    - قيمة `x-openclaw-scopes` ضيقة أكثر من اللازم: إذا حقن وكيلك هذه الترويسة في طلب ترقية WebSocket الخاص بواجهة التحكم، فتُحدَّد نطاقات الجلسة بتلك المجموعة. وتؤدي قيمة الترويسة الفارغة إلى عدم وجود نطاقات.

    الإصلاح:

    - بالنسبة إلى واجهة التحكم، استخدم HTTPS كي يتمكن المتصفح من إنشاء هوية الجهاز وإكمال الاقتران.
    - بالنسبة إلى الأتمتة المخصصة، استخدم هوية الجهاز/الاقتران، أو مسار مساعد الواجهة الخلفية المباشر المحلي المحجوز `gateway-client`، أو [استدعاء RPC الإداري عبر HTTP](/ar/plugins/admin-http-rpc).
    - استخدم `gateway.controlUi.dangerouslyDisableDeviceAuth: true` فقط كمسار طوارئ مؤقت لواجهة التحكم.

  </Accordion>
  <Accordion title="ما يزال WebSocket يفشل">
    تأكد من أن وكيلك:

    - يدعم ترقيات WebSocket (`Upgrade: websocket`، و`Connection: upgrade`).
    - يمرر ترويسات الهوية في طلبات ترقية WebSocket (وليس HTTP فقط).
    - لا يملك مسار مصادقة منفصلًا لاتصالات WebSocket.

  </Accordion>
</AccordionGroup>

## الترحيل من مصادقة الرمز المميّز

<Steps>
  <Step title="إعداد الوكيل">
    أعد وكيلك لمصادقة المستخدمين وتمرير الترويسات.
  </Step>
  <Step title="اختبار الوكيل بشكل مستقل">
    اختبر إعداد الوكيل بشكل مستقل (استخدم curl مع الترويسات).
  </Step>
  <Step title="تحديث إعداد OpenClaw">
    حدّث إعداد OpenClaw باستخدام مصادقة الوكيل الموثوق.
  </Step>
  <Step title="إعادة تشغيل Gateway">
    أعد تشغيل Gateway.
  </Step>
  <Step title="اختبار WebSocket">
    اختبر اتصالات WebSocket من واجهة التحكم.
  </Step>
  <Step title="التدقيق">
    شغّل `openclaw security audit` وراجع النتائج.
  </Step>
</Steps>

## ذات صلة

- [الإعداد](/ar/gateway/configuration) — مرجع الإعدادات
- [نطاقات المشغّل](/ar/gateway/operator-scopes) — الأدوار والنطاقات وعمليات تحقق الموافقة
- [الوصول عن بُعد](/ar/gateway/remote) — أنماط أخرى للوصول عن بُعد
- [الأمان](/ar/gateway/security) — دليل الأمان الكامل
- [Tailscale](/ar/gateway/tailscale) — بديل أبسط للوصول المقصور على tailnet

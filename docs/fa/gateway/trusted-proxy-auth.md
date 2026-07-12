---
read_when:
    - اجرای OpenClaw پشت یک پروکسی آگاه از هویت
    - راه‌اندازی Pomerium، Caddy یا nginx با OAuth در جلوی OpenClaw
    - رفع خطاهای عدم مجوز WebSocket 1008 در پیکربندی‌های پراکسی معکوس
    - تصمیم‌گیری دربارهٔ محل تنظیم HSTS و سایر سرآیندهای مقاوم‌سازی HTTP
sidebarTitle: Trusted proxy auth
summary: احراز هویت Gateway را به یک پروکسی معکوس مورد اعتماد واگذار کنید (Pomerium، Caddy، nginx + OAuth)
title: احراز هویت پروکسی مورد اعتماد
x-i18n:
    generated_at: "2026-07-12T10:11:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 612070e4872af23c2ac41b529c8b2fa8513bf18fccc053783f55ad00b44e1a5f
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**قابلیت حساس از نظر امنیتی.** این حالت، احراز هویت را به‌طور کامل به پروکسی معکوس شما واگذار می‌کند. پیکربندی نادرست می‌تواند Gateway شما را در معرض دسترسی غیرمجاز قرار دهد. پیش از فعال‌سازی، این صفحه را با دقت بخوانید.
</Warning>

## زمان استفاده

- OpenClaw را پشت یک **پروکسی آگاه از هویت** اجرا می‌کنید (Pomerium، ‏Caddy + OAuth، ‏nginx + oauth2-proxy، ‏Traefik + forward auth).
- پروکسی شما تمام احراز هویت را انجام می‌دهد و هویت کاربر را از طریق سرآیندها ارسال می‌کند.
- در محیط Kubernetes یا کانتینری هستید که پروکسی تنها مسیر دسترسی به Gateway است.
- با خطاهای WebSocket از نوع `1008 unauthorized` مواجه می‌شوید، زیرا مرورگرها نمی‌توانند توکن‌ها را در بارهای WS ارسال کنند.

## زمان عدم استفاده

- پروکسی شما کاربران را احراز هویت نمی‌کند و صرفاً پایان‌دهنده TLS یا متعادل‌کننده بار است.
- مسیری برای دسترسی به Gateway وجود دارد که پروکسی را دور می‌زند، مانند حفره‌های دیوار آتش یا دسترسی از شبکه داخلی.
- مطمئن نیستید که پروکسی شما سرآیندهای فورواردشده را به‌درستی حذف یا بازنویسی می‌کند.
- فقط به دسترسی شخصی تک‌کاربره نیاز دارید؛ در عوض Tailscale Serve + local loopback را در نظر بگیرید.

## نحوه کار

<Steps>
  <Step title="پروکسی کاربر را احراز هویت می‌کند">
    پروکسی معکوس شما کاربران را احراز هویت می‌کند (OAuth، ‏OIDC، ‏SAML و غیره).
  </Step>
  <Step title="پروکسی یک سرآیند هویت اضافه می‌کند">
    پروکسی سرآیندی حاوی هویت کاربر احرازشده اضافه می‌کند؛ برای مثال، `x-forwarded-user: nick@example.com`.
  </Step>
  <Step title="Gateway منبع مورداعتماد را تأیید می‌کند">
    OpenClaw بررسی می‌کند که درخواست از یک **نشانی IP پروکسی مورداعتماد** (`gateway.trustedProxies`) آمده باشد و مبدأ آن local loopback خود Gateway یا نشانی رابط محلی آن نباشد.
  </Step>
  <Step title="Gateway هویت را استخراج می‌کند">
    OpenClaw ابتدا سرآیندهای الزامی و سپس هویت کاربر را از سرآیند پیکربندی‌شده می‌خواند.
  </Step>
  <Step title="صدور مجوز">
    اگر همه بررسی‌ها موفق باشند و کاربر در صورت تنظیم بودن `allowUsers` از آن عبور کند، درخواست مجاز می‌شود.
  </Step>
</Steps>

## پیکربندی

```json5
{
  gateway: {
    // احراز هویت پروکسی مورداعتماد به‌طور پیش‌فرض انتظار دارد IP مبدأ پروکسی loopback نباشد
    bind: "lan",

    // حیاتی: فقط IPهای پروکسی خود را اینجا اضافه کنید
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // سرآیند حاوی هویت کاربر احرازشده (الزامی)
        userHeader: "x-forwarded-user",

        // اختیاری: سرآیندهایی که باید وجود داشته باشند (تأیید پروکسی)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // اختیاری: محدودسازی به کاربران مشخص (خالی = اجازه به همه)
        allowUsers: ["nick@example.com", "admin@company.org"],

        // اختیاری: اجازه به پروکسی loopback هم‌میزبان پس از پذیرش صریح
        allowLoopback: false,
      },
    },
  },
}
```

<Warning>
**قواعد زمان اجرا، به‌ترتیب ارزیابی**

1. IP مبدأ درخواست باید با `gateway.trustedProxies` مطابقت داشته باشد، با درنظرگرفتن CIDR؛ در غیر این صورت رد می‌شود (`trusted_proxy_untrusted_source`).
2. درخواست‌های دارای مبدأ loopback (`127.0.0.1`، ‏`::1`) رد می‌شوند، مگر اینکه `gateway.auth.trustedProxy.allowLoopback = true` باشد و نشانی loopback نیز در `trustedProxies` قرار داشته باشد (`trusted_proxy_loopback_source`). این بررسی پیش از بررسی سرآیندها اجرا می‌شود؛ بنابراین مبدأ loopback حتی در صورت نبود سرآیندهای الزامی نیز به همین دلیل شکست می‌خورد.
3. مبدأهای غیر-loopback که با یکی از نشانی‌های رابط شبکه محلی خود میزبان Gateway مطابقت دارند، برای جلوگیری از جعل رد می‌شوند (`trusted_proxy_local_interface_source`). اگر خود فرایند کشف رابط نیز شکست بخورد، درخواست رد می‌شود (`trusted_proxy_local_interface_check_failed`).
4. `requiredHeaders` و `userHeader` باید موجود و غیرخالی باشند.
5. اگر `allowUsers` خالی نباشد، باید کاربر استخراج‌شده را شامل شود.

**شواهد سرآیند فورواردشده، محلی‌بودن loopback را برای بازگشت مستقیم محلی نادیده می‌گیرند.** اگر درخواستی از loopback برسد اما دارای سرآیند `Forwarded`، هر سرآیند `X-Forwarded-*` یا `X-Real-IP` باشد، این شواهد آن را از بازگشت به گذرواژه مستقیم محلی و کنترل هویت دستگاه محروم می‌کنند، هرچند همچنان احراز هویت پروکسی مورداعتماد را به‌دلیل loopback بودن نمی‌گذراند.

`allowLoopback` به فرایندهای محلی روی میزبان Gateway به همان اندازه پروکسی معکوس اعتماد می‌کند. آن را فقط زمانی فعال کنید که Gateway همچنان با دیوار آتش در برابر دسترسی مستقیم از راه دور محافظت شده باشد و پروکسی محلی، سرآیندهای هویتی ارسالی کارخواه را حذف یا بازنویسی کند.

کارخواه‌های داخلی Gateway که از پروکسی معکوس عبور نمی‌کنند، باید به‌جای سرآیندهای هویت پروکسی مورداعتماد از `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` استفاده کنند. استقرارهای غیر-loopback رابط کنترل همچنان به `gateway.controlUi.allowedOrigins` صریح نیاز دارند.
</Warning>

### مرجع پیکربندی

<ParamField path="gateway.trustedProxies" type="string[]" required>
  آرایه‌ای از نشانی‌های IP پروکسی یا CIDRهایی که باید مورداعتماد باشند. درخواست‌های سایر IPها رد می‌شوند.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  باید `"trusted-proxy"` باشد.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  نام سرآیندی که هویت کاربر احرازشده را در بر دارد.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  سرآیندهای دیگری که برای مورداعتماد بودن درخواست باید موجود باشند.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  فهرست مجاز هویت‌های کاربران. خالی بودن به‌معنای اجازه به همه کاربران احرازشده است.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean" default="false">
  پشتیبانی اختیاری از پروکسی‌های معکوس loopback هم‌میزبان.
</ParamField>

<Warning>
`allowLoopback` را فقط زمانی فعال کنید که پروکسی معکوس محلی، مرز اعتماد موردنظر باشد. هر فرایند محلی که بتواند به Gateway متصل شود، می‌تواند برای ارسال سرآیندهای هویت پروکسی تلاش کند؛ بنابراین دسترسی مستقیم به Gateway را به میزبان محدود نگه دارید و سرآیندهای تحت مالکیت پروکسی، مانند `x-forwarded-proto`، یا در صورت پشتیبانی پروکسی، یک سرآیند ادعای امضاشده را الزامی کنید.
</Warning>

## رفتار جفت‌سازی رابط کنترل

هنگامی که `gateway.auth.mode = "trusted-proxy"` فعال باشد و درخواست بررسی‌های پروکسی مورداعتماد را بگذراند، نشست‌های WebSocket رابط کنترل می‌توانند بدون هویت جفت‌سازی دستگاه متصل شوند.

پیامدهای محدوده‌ها:

- نشست‌های WebSocket رابط کنترل بدون دستگاه متصل می‌شوند، اما به‌طور پیش‌فرض هیچ محدوده راهبری دریافت نمی‌کنند. OpenClaw فهرست محدوده‌های درخواستی را به `[]` پاک می‌کند تا نشستی که به دستگاه یا توکن جفت‌شده و تأییدشده‌ای متصل نیست، نتواند مجوزها را خوداظهاری کند.
- اگر پس از اتصال موفق WebSocket، متدها با `missing scope` شکست می‌خورند، از HTTPS استفاده کنید تا مرورگر بتواند هویت دستگاه را ایجاد و جفت‌سازی را کامل کند. به [HTTP ناامن رابط کنترل](/fa/web/control-ui#insecure-http) مراجعه کنید.
- فقط برای شرایط اضطراری: `gateway.controlUi.dangerouslyDisableDeviceAuth=true` حتی بدون هویت دستگاه نیز محدوده‌های درخواستی را حفظ می‌کند. این کار امنیت را به‌شدت کاهش می‌دهد؛ آن را سریعاً بازگردانید. به [HTTP ناامن رابط کنترل](/fa/web/control-ui#insecure-http) مراجعه کنید.

محدودسازی محدوده توسط پروکسی معکوس: اگر پروکسی شما در درخواست ارتقای WebSocket رابط کنترل، `x-openclaw-scopes` را ارسال کند، OpenClaw محدوده‌های نشست را به اشتراک محدوده‌های درخواستی و محدوده‌های اعلام‌شده محدود می‌کند. این سرآیند محدوده‌ای اعطا نمی‌کند؛ فقط مواردی را که نشست می‌تواند داشته باشد محدودتر می‌کند.

پیامدها:

- در این حالت، جفت‌سازی دیگر دروازه اصلی دسترسی به رابط کنترل نیست.
- خط‌مشی احراز هویت پروکسی معکوس شما و `allowUsers` به کنترل دسترسی مؤثر تبدیل می‌شوند.
- ورودی Gateway را فقط به IPهای پروکسی مورداعتماد محدود نگه دارید (`gateway.trustedProxies` + دیوار آتش).

کارخواه‌های سفارشی WebSocket نشست رابط کنترل نیستند. `gateway.controlUi.dangerouslyDisableDeviceAuth` به کارخواه‌های دلخواه با `client.mode: "backend"` یا کارخواه‌های دارای ساختار CLI محدوده اعطا نمی‌کند. خودکارسازی سفارشی باید از هویت دستگاه و جفت‌سازی، مسیر کمکی بک‌اند مستقیم و محلی رزروشده با `client.id: "gateway-client"`، یا در مواردی که سطح درخواست/پاسخ HTTP مناسب‌تر است از [Plugin مربوط به RPC مدیریتی HTTP](/fa/plugins/admin-http-rpc) استفاده کند.

## سرآیند محدوده‌های راهبری

احراز هویت پروکسی مورداعتماد یک حالت HTTP **حامل هویت** است؛ بنابراین فراخوان‌ها می‌توانند در صورت نیاز، محدوده‌های راهبری را با `x-openclaw-scopes` در درخواست‌های API مبتنی بر HTTP اعلام کنند.

نکته: محدوده‌های WebSocket توسط دست‌دهی پروتکل Gateway و اتصال هویت دستگاه تعیین می‌شوند. در درخواست‌های ارتقای WebSocket رابط کنترل، `x-openclaw-scopes` فقط سقفی برای محدوده‌های توافق‌شده نشست است، نه یک اعطا. به [رفتار جفت‌سازی رابط کنترل](#control-ui-pairing-behavior) مراجعه کنید.

نمونه‌ها:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

رفتار:

- وقتی سرآیند موجود باشد، OpenClaw مجموعه محدوده اعلام‌شده را رعایت می‌کند.
- وقتی سرآیند موجود اما خالی باشد، درخواست **هیچ** محدوده راهبری را اعلام نمی‌کند.
- وقتی سرآیند وجود نداشته باشد، APIهای HTTP حامل هویت عادی به مجموعه استاندارد محدوده‌های پیش‌فرض راهبری بازمی‌گردند (`operator.admin`، ‏`operator.read`، ‏`operator.write`، ‏`operator.approvals`، ‏`operator.pairing`، ‏`operator.talk.secrets`).
- **مسیرهای HTTP متعلق به Plugin** که با احراز هویت Gateway کار می‌کنند، به‌طور پیش‌فرض محدودترند: وقتی `x-openclaw-scopes` وجود نداشته باشد، محدوده زمان اجرای آن‌ها فقط به `operator.write` بازمی‌گردد.
- درخواست‌های HTTP با مبدأ مرورگر حتی پس از موفقیت احراز هویت پروکسی مورداعتماد نیز باید از `gateway.controlUi.allowedOrigins` یا حالت بازگشت عمدی به سرآیند Host عبور کنند.

قاعده عملی: هنگامی که می‌خواهید درخواست پروکسی مورداعتماد محدودتر از مقادیر پیش‌فرض باشد، یا زمانی که یک مسیر Plugin دارای احراز هویت Gateway به محدوده‌ای قوی‌تر از محدوده نوشتن نیاز دارد، `x-openclaw-scopes` را صریحاً ارسال کنید.

## پایان‌دهی TLS و HSTS

از یک نقطه پایان‌دهی TLS استفاده کنید و HSTS را در همان‌جا اعمال کنید.

<Tabs>
  <Tab title="پایان‌دهی TLS در پروکسی (توصیه‌شده)">
    هنگامی که پروکسی معکوس شما HTTPS را برای `https://control.example.com` مدیریت می‌کند، `Strict-Transport-Security` را در پروکسی برای آن دامنه تنظیم کنید.

    - برای استقرارهای در معرض اینترنت مناسب است.
    - خط‌مشی گواهی و سخت‌سازی HTTP را در یک محل نگه می‌دارد.
    - OpenClaw می‌تواند پشت پروکسی روی HTTP مبتنی بر loopback باقی بماند.

    نمونه مقدار سرآیند:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="پایان‌دهی TLS در Gateway">
    اگر خود OpenClaw مستقیماً HTTPS ارائه می‌دهد و پروکسی پایان‌دهنده TLS وجود ندارد، موارد زیر را تنظیم کنید:

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

    `strictTransportSecurity` یک مقدار رشته‌ای برای سرآیند می‌پذیرد؛ برای غیرفعال‌سازی صریح نیز می‌توانید از `false` استفاده کنید.

  </Tab>
</Tabs>

### راهنمای استقرار تدریجی

- هنگام اعتبارسنجی ترافیک، ابتدا با حداکثر عمر کوتاه شروع کنید؛ برای مثال، `max-age=300`.
- فقط پس از اطمینان بالا، آن را به مقادیر بلندمدت افزایش دهید؛ برای مثال، `max-age=31536000`.
- `includeSubDomains` را فقط زمانی اضافه کنید که همه زیردامنه‌ها برای HTTPS آماده باشند.
- فقط زمانی از preload استفاده کنید که عمداً الزامات آن را برای کل مجموعه دامنه‌های خود برآورده می‌کنید.
- توسعه محلی محدود به loopback از HSTS سودی نمی‌برد.

## نمونه‌های راه‌اندازی پروکسی

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium هویت را در `x-pomerium-claim-email` یا سایر سرآیندهای ادعا و یک JWT را در `x-pomerium-jwt-assertion` ارسال می‌کند.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // IP مربوط به Pomerium
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

    قطعه پیکربندی Pomerium:

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
  <Accordion title="Caddy همراه با OAuth">
    Caddy با Plugin مربوط به `caddy-security` می‌تواند کاربران را احراز هویت کند و سرآیندهای هویت را ارسال کند.

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

    قطعه‌ای از Caddyfile:

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
    ‏oauth2-proxy کاربران را احراز هویت می‌کند و هویت را در `x-auth-request-email` ارسال می‌کند.

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

    قطعه‌ای از پیکربندی nginx:

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
  <Accordion title="Traefik with forward auth">
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

## پیکربندی ترکیبی توکن

اگر هم‌زمان یک توکن مشترک نیز پیکربندی شده باشد (`gateway.auth.token` یا `OPENCLAW_GATEWAY_TOKEN`)، راه‌اندازی Gateway احراز هویت پراکسی مورداعتماد را رد می‌کند. این دو متقابلاً ناسازگارند، زیرا توکن مشترک به فراخوانندگان همان میزبان اجازه می‌دهد از مسیری کاملاً متفاوت با هویتی که پراکسی تأیید کرده و این حالت برای اعمال آن طراحی شده است، احراز هویت شوند.

اگر راه‌اندازی با خطایی مانند `gateway auth mode is trusted-proxy, but a shared token is also configured` شکست خورد:

- هنگام استفاده از حالت پراکسی مورداعتماد، توکن مشترک را حذف کنید، یا
- اگر قصد دارید از احراز هویت مبتنی بر توکن استفاده کنید، `gateway.auth.mode` را به `"token"` تغییر دهید.

سربرگ‌های هویت پراکسی مورداعتماد در local loopback همچنان به‌صورت بسته شکست می‌خورند: فراخوانندگان همان میزبان بدون اطلاع به‌عنوان کاربران پراکسی احراز هویت نمی‌شوند. فراخوانندگان داخلی OpenClaw که پراکسی را دور می‌زنند، می‌توانند در عوض با `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` احراز هویت کنند. بازگشت به توکن در حالت پراکسی مورداعتماد همچنان عمداً پشتیبانی نمی‌شود.

## چک‌لیست امنیتی

پیش از فعال‌کردن احراز هویت پراکسی مورداعتماد، موارد زیر را بررسی کنید:

- [ ] **پراکسی تنها مسیر است**: پورت Gateway از دسترسی همه‌چیز به‌جز پراکسی شما با فایروال محافظت شده است.
- [ ] **`trustedProxies` حداقلی است**: فقط IPهای واقعی پراکسی شما، نه کل زیرشبکه‌ها.
- [ ] **مبدأ پراکسی local loopback آگاهانه انتخاب شده است**: احراز هویت پراکسی مورداعتماد برای درخواست‌هایی با مبدأ local loopback به‌صورت بسته شکست می‌خورد، مگر اینکه `gateway.auth.trustedProxy.allowLoopback` صریحاً برای پراکسی همان میزبان فعال شده باشد.
- [ ] **پراکسی سربرگ‌ها را حذف می‌کند**: پراکسی شما سربرگ‌های `x-forwarded-*` دریافتی از کلاینت‌ها را بازنویسی می‌کند، نه اینکه به آن‌ها بیفزاید.
- [ ] **خاتمه TLS**: پراکسی شما TLS را مدیریت می‌کند؛ کاربران از طریق HTTPS متصل می‌شوند.
- [ ] **`allowedOrigins` صریح است**: رابط کنترل خارج از local loopback از `gateway.controlUi.allowedOrigins` صریح استفاده می‌کند.
- [ ] **`allowUsers` تنظیم شده است** (توصیه می‌شود): به‌جای اجازه‌دادن به هر فرد احراز هویت‌شده، دسترسی را به کاربران شناخته‌شده محدود کنید.
- [ ] **پیکربندی ترکیبی توکن وجود ندارد**: `gateway.auth.token` و `gateway.auth.mode: "trusted-proxy"` را هم‌زمان تنظیم نکنید.
- [ ] **بازگشت به گذرواژه محلی خصوصی است**: اگر `gateway.auth.password` را برای فراخوانندگان مستقیم داخلی پیکربندی می‌کنید، پورت Gateway را با فایروال محافظت کنید تا کلاینت‌های راه‌دور خارج از پراکسی نتوانند مستقیماً به آن دسترسی پیدا کنند.

## ممیزی امنیتی

`openclaw security audit` احراز هویت پراکسی مورداعتماد را با یافته‌ای با شدت **بحرانی** علامت‌گذاری می‌کند. این رفتار عمدی است؛ یادآوری می‌کند که امنیت را به پیکربندی پراکسی خود واگذار کرده‌اید.

ممیزی موارد زیر را بررسی می‌کند:

- هشدار یا یادآوری بحرانی پایه `gateway.trusted_proxy_auth`.
- نبود پیکربندی `trustedProxies`.
- نبود پیکربندی `userHeader`.
- خالی‌بودن `allowUsers` که به هر کاربر احراز هویت‌شده اجازه دسترسی می‌دهد.
- فعال‌بودن `allowLoopback` برای مبدأهای پراکسی همان میزبان.

یافته‌های جداگانه‌ای که مختص پراکسی مورداعتماد نیستند نیز هر زمان که رابط کنترل در معرض دسترسی قرار گیرد اعمال می‌شوند: مقدار عام یا نبود `gateway.controlUi.allowedOrigins` و بازگشت مبدأ به سربرگ Host.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    درخواست از IP موجود در `gateway.trustedProxies` نیامده است. بررسی کنید:

    - آیا IP پراکسی صحیح است؟ (IP کانتینرهای Docker ممکن است تغییر کند.)
    - آیا جلوی پراکسی شما یک متعادل‌کننده بار قرار دارد؟
    - برای یافتن IPهای واقعی از `docker inspect` یا `kubectl get pods -o wide` استفاده کنید.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    ‏OpenClaw یک درخواست پراکسی مورداعتماد با مبدأ local loopback را رد کرده است.

    بررسی کنید:

    - آیا پراکسی از `127.0.0.1` / `::1` متصل می‌شود؟
    - آیا می‌خواهید احراز هویت پراکسی مورداعتماد را با یک پراکسی معکوس local loopback روی همان میزبان استفاده کنید؟

    راه‌حل:

    - برای کلاینت‌های داخلی همان میزبان که از پراکسی عبور نمی‌کنند، احراز هویت با توکن یا گذرواژه را ترجیح دهید، یا
    - ترافیک را از یک نشانی پراکسی مورداعتماد غیر local loopback عبور دهید و آن IP را در `gateway.trustedProxies` نگه دارید، یا
    - برای یک پراکسی معکوس عمدی روی همان میزبان، `gateway.auth.trustedProxy.allowLoopback = true` را تنظیم کنید، نشانی local loopback را در `gateway.trustedProxies` نگه دارید و مطمئن شوید پراکسی سربرگ‌های هویت را حذف یا بازنویسی می‌کند.

  </Accordion>
  <Accordion title="trusted_proxy_local_interface_source / trusted_proxy_local_interface_check_failed">
    IP مبدأ درخواست با یکی از نشانی‌های رابط شبکه غیر local loopback خود میزبان Gateway، نه پراکسی، مطابقت داشته است؛ این محافظی در برابر ترافیک جعل‌شده همان میزبان در tailnetها یا شبکه‌های پل Docker است. `..._check_failed` یعنی خود فرایند کشف رابط با خطا مواجه شده است، بنابراین OpenClaw به‌صورت بسته شکست می‌خورد.

    بررسی کنید:

    - آیا فرایندی روی خود میزبان Gateway با دورزدن پراکسی، سربرگ‌های هویت را مستقیماً ارسال می‌کند؟
    - آیا پراکسی در همان فضای نام شبکه Gateway اجرا می‌شود و IP آن به‌عنوان یک رابط محلی نیز نمایش داده می‌شود؟

    راه‌حل: ترافیک پراکسی را از نشانی‌ای عبور دهید که به‌صورت محلی نیز به میزبان Gateway متصل نشده باشد، یا `allowLoopback` را فقط برای پیکربندی واقعی پراکسی همان میزبان استفاده کنید.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    سربرگ کاربر خالی یا موجود نبوده است. بررسی کنید:

    - آیا پراکسی شما برای ارسال سربرگ‌های هویت پیکربندی شده است؟
    - آیا نام سربرگ صحیح است؟ (به بزرگی و کوچکی حروف حساس نیست، اما املای آن اهمیت دارد.)
    - آیا کاربر واقعاً در پراکسی احراز هویت شده است؟

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    یکی از سربرگ‌های الزامی موجود نبوده است. بررسی کنید:

    - پیکربندی پراکسی خود را برای آن سربرگ‌های مشخص بررسی کنید.
    - بررسی کنید آیا سربرگ‌ها در جایی از زنجیره حذف می‌شوند.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    کاربر احراز هویت شده است، اما در `allowUsers` نیست. او را اضافه کنید یا فهرست مجاز را حذف کنید.
  </Accordion>
  <Accordion title="trusted_proxy_no_proxies_configured / trusted_proxy_config_missing">
    ‏`gateway.auth.mode` برابر با `"trusted-proxy"` است، اما `gateway.trustedProxies` خالی است یا خود `gateway.auth.trustedProxy` وجود ندارد. تا زمانی که هر دو تنظیم نشوند، همه درخواست‌ها رد می‌شوند.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    احراز هویت پراکسی مورداعتماد موفق بوده است، اما سربرگ `Origin` مرورگر بررسی‌های مبدأ رابط کنترل را نگذرانده است.

    بررسی کنید:

    - `gateway.controlUi.allowedOrigins` دقیقاً شامل مبدأ مرورگر باشد.
    - مگر اینکه عمداً رفتار اجازه به همه را می‌خواهید، به مبدأهای عام تکیه نکنید.
    - اگر عمداً از حالت بازگشت به سربرگ Host استفاده می‌کنید، `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` آگاهانه تنظیم شده باشد.

  </Accordion>
  <Accordion title="Connection succeeds but methods report missing scope">
    اتصال WebSocket برقرار می‌شود، اما `chat.history`، `sessions.list` یا
    `models.list` با خطای `missing scope: operator.read` شکست می‌خورد.

    دلایل رایج:

    - نشست رابط کنترل بدون دستگاه: احراز هویت پراکسی مورداعتماد می‌تواند اتصال WebSocket را بدون هویت دستگاه بپذیرد، اما OpenClaw طبق طراحی، محدوده‌های دسترسی نشست‌های بدون دستگاه را پاک می‌کند.
    - کلاینت سفارشی سمت سرور: `gateway.controlUi.dangerouslyDisableDeviceAuth` محدود به رابط کنترل است و به کلاینت‌های WebSocket دلخواه سمت سرور یا دارای ساختار CLI محدوده دسترسی اعطا نمی‌کند.
    - `x-openclaw-scopes` بیش‌ازحد محدود: اگر پراکسی شما این سربرگ را در درخواست ارتقای WebSocket رابط کنترل تزریق کند، محدوده‌های دسترسی نشست به همان مجموعه محدود می‌شوند. مقدار خالی سربرگ باعث می‌شود هیچ محدوده دسترسی‌ای وجود نداشته باشد.

    راه‌حل:

    - برای رابط کنترل، از HTTPS استفاده کنید تا مرورگر بتواند هویت دستگاه را ایجاد و جفت‌سازی را تکمیل کند.
    - برای خودکارسازی سفارشی، از هویت دستگاه و جفت‌سازی، مسیر رزروشده مستقیم و محلیِ ابزار کمکی سمت سرور `gateway-client` یا [‏RPC مدیریتی HTTP](/fa/plugins/admin-http-rpc) استفاده کنید.
    - از `gateway.controlUi.dangerouslyDisableDeviceAuth: true` فقط به‌عنوان مسیر اضطراری موقت برای رابط کنترل استفاده کنید.

  </Accordion>
  <Accordion title="WebSocket still failing">
    مطمئن شوید پراکسی شما:

    - از ارتقای WebSocket پشتیبانی می‌کند (`Upgrade: websocket`، `Connection: upgrade`).
    - سربرگ‌های هویت را در درخواست‌های ارتقای WebSocket نیز ارسال می‌کند، نه فقط در HTTP.
    - برای اتصال‌های WebSocket مسیر احراز هویت جداگانه‌ای ندارد.

  </Accordion>
</AccordionGroup>

## مهاجرت از احراز هویت توکنی

<Steps>
  <Step title="Configure the proxy">
    پراکسی خود را برای احراز هویت کاربران و ارسال سربرگ‌ها پیکربندی کنید.
  </Step>
  <Step title="Test the proxy independently">
    پیکربندی پراکسی را به‌طور مستقل آزمایش کنید؛ برای نمونه، از curl همراه با سربرگ‌ها استفاده کنید.
  </Step>
  <Step title="Update OpenClaw config">
    پیکربندی OpenClaw را با احراز هویت پراکسی مورداعتماد به‌روزرسانی کنید.
  </Step>
  <Step title="Restart the Gateway">
    ‏Gateway را دوباره راه‌اندازی کنید.
  </Step>
  <Step title="Test WebSocket">
    اتصال‌های WebSocket را از رابط کنترل آزمایش کنید.
  </Step>
  <Step title="Audit">
    دستور `openclaw security audit` را اجرا و یافته‌ها را بررسی کنید.
  </Step>
</Steps>

## مطالب مرتبط

- [پیکربندی](/fa/gateway/configuration) — مرجع پیکربندی
- [محدوده‌های دسترسی اپراتور](/fa/gateway/operator-scopes) — نقش‌ها، محدوده‌های دسترسی و بررسی‌های تأیید
- [دسترسی راه‌دور](/fa/gateway/remote) — الگوهای دیگر دسترسی راه‌دور
- [امنیت](/fa/gateway/security) — راهنمای کامل امنیت
- [Tailscale](/fa/gateway/tailscale) — جایگزینی ساده‌تر برای دسترسی محدود به tailnet

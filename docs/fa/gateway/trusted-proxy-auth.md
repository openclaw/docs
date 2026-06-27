---
read_when:
    - اجرای OpenClaw پشت یک پراکسی آگاه از هویت
    - راه‌اندازی Pomerium، Caddy یا nginx با OAuth در جلوی OpenClaw
    - رفع خطاهای غیرمجاز WebSocket 1008 در پیکربندی‌های پروکسی معکوس
    - تصمیم‌گیری دربارهٔ محل تنظیم HSTS و دیگر هدرهای مقاوم‌سازی HTTP
sidebarTitle: Trusted proxy auth
summary: واگذاری احراز هویت Gateway به یک reverse proxy مورد اعتماد (Pomerium، Caddy، nginx + OAuth)
title: احراز هویت پروکسی مورد اعتماد
x-i18n:
    generated_at: "2026-06-27T17:52:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 498a8aca666f88201302af3895b11ba43ab9c0b1bff00a262145fc9e21e80fa7
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**ویژگی حساس از نظر امنیتی.** این حالت احراز هویت را کاملاً به پراکسی معکوس شما واگذار می‌کند. پیکربندی نادرست می‌تواند Gateway شما را در معرض دسترسی غیرمجاز قرار دهد. پیش از فعال‌سازی، این صفحه را با دقت بخوانید.
</Warning>

## زمان استفاده

از حالت احراز هویت `trusted-proxy` زمانی استفاده کنید که:

- OpenClaw را پشت یک **پراکسی آگاه از هویت** اجرا می‌کنید (Pomerium، Caddy + OAuth، nginx + oauth2-proxy، Traefik + forward auth).
- پراکسی شما تمام احراز هویت را انجام می‌دهد و هویت کاربر را از طریق headerها ارسال می‌کند.
- در یک محیط Kubernetes یا container هستید که پراکسی تنها مسیر دسترسی به Gateway است.
- با خطاهای WebSocket `1008 unauthorized` روبه‌رو می‌شوید چون مرورگرها نمی‌توانند tokenها را در payloadهای WS ارسال کنند.

## زمان عدم استفاده

- اگر پراکسی شما کاربران را احراز هویت نمی‌کند (فقط یک TLS terminator یا load balancer است).
- اگر هر مسیری به Gateway وجود دارد که پراکسی را دور می‌زند (حفره‌های firewall، دسترسی شبکه داخلی).
- اگر مطمئن نیستید پراکسی شما headerهای forwarded را درست حذف/بازنویسی می‌کند.
- اگر فقط به دسترسی شخصی تک‌کاربره نیاز دارید (برای راه‌اندازی ساده‌تر، Tailscale Serve + loopback را در نظر بگیرید).

## نحوه کار

<Steps>
  <Step title="Proxy authenticates the user">
    پراکسی معکوس شما کاربران را احراز هویت می‌کند (OAuth، OIDC، SAML و غیره).
  </Step>
  <Step title="Proxy adds an identity header">
    پراکسی یک header با هویت کاربر احرازشده اضافه می‌کند (مثلاً `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Gateway verifies trusted source">
    OpenClaw بررسی می‌کند که درخواست از یک **IP پراکسی مورد اعتماد** آمده باشد (در `gateway.trustedProxies` پیکربندی شده است).
  </Step>
  <Step title="Gateway extracts identity">
    OpenClaw هویت کاربر را از header پیکربندی‌شده استخراج می‌کند.
  </Step>
  <Step title="Authorize">
    اگر همه چیز درست باشد، درخواست مجاز می‌شود.
  </Step>
</Steps>

## رفتار pairing در Control UI

وقتی `gateway.auth.mode = "trusted-proxy"` فعال است و درخواست بررسی‌های trusted-proxy را با موفقیت می‌گذراند، نشست‌های WebSocket در Control UI می‌توانند بدون هویت pairing دستگاه وصل شوند.

پیامدهای scope:

- نشست‌های WebSocket در Control UI بدون دستگاه وصل می‌شوند، اما به‌طور پیش‌فرض هیچ scope اپراتوری دریافت نمی‌کنند. OpenClaw فهرست scope درخواستی را به `[]` پاک می‌کند تا نشستی که به دستگاه/token pairing و تأییدشده متصل نیست، نتواند خودش مجوزها را اعلام کند.
- اگر methodها پس از اتصال موفق WebSocket با `missing scope` شکست خوردند، از HTTPS استفاده کنید تا مرورگر بتواند هویت دستگاه را ایجاد کند و pairing را کامل کند. [Control UI insecure HTTP](/fa/web/control-ui#insecure-http) را ببینید.
- فقط برای شرایط اضطراری: `gateway.controlUi.dangerouslyDisableDeviceAuth=true` حتی بدون هویت دستگاه، scopeهای درخواستی را حفظ می‌کند. این یک کاهش امنیتی شدید است؛ سریعاً آن را برگردانید. [Control UI insecure HTTP](/fa/web/control-ui#insecure-http) را ببینید.

محدودسازی scope توسط پراکسی معکوس:

- اگر پراکسی شما در درخواست upgrade WebSocket مربوط به Control UI، `x-openclaw-scopes` را ارسال کند، OpenClaw scopeهای نشست را به اشتراک scopeهای درخواستی و scopeهای اعلام‌شده محدود می‌کند. این header scope اعطا نمی‌کند؛ فقط آنچه نشست می‌تواند نگه دارد را محدودتر می‌کند.

پیامدها:

- در این حالت، pairing دیگر gate اصلی برای دسترسی به Control UI نیست.
- سیاست احراز هویت پراکسی معکوس شما و `allowUsers` به کنترل دسترسی مؤثر تبدیل می‌شوند.
- ورودی Gateway را فقط به IPهای پراکسی مورد اعتماد قفل نگه دارید (`gateway.trustedProxies` + firewall).

کلاینت‌های سفارشی WebSocket نشست Control UI نیستند. `gateway.controlUi.dangerouslyDisableDeviceAuth` به کلاینت‌های دلخواه `client.mode: "backend"` یا کلاینت‌های شبیه CLI، scope اعطا نمی‌کند. automation سفارشی باید از هویت دستگاه/pairing، مسیر helper backend رزروشده direct-local با `client.id: "gateway-client"`، یا [admin HTTP RPC Plugin](/fa/plugins/admin-http-rpc) استفاده کند، وقتی سطح درخواست/پاسخ HTTP گزینه مناسب‌تری است.

## پیکربندی

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
**قواعد مهم زمان اجرا**

- احراز هویت trusted-proxy به‌طور پیش‌فرض درخواست‌هایی با منبع loopback (`127.0.0.1`، `::1`، CIDRهای loopback) را رد می‌کند.
- پراکسی‌های معکوس loopback روی همان host، احراز هویت trusted-proxy را برآورده نمی‌کنند مگر اینکه صراحتاً `gateway.auth.trustedProxy.allowLoopback = true` را تنظیم کنید و آدرس loopback را در `gateway.trustedProxies` بگنجانید.
- `allowLoopback` به processهای محلی روی host Gateway به همان اندازه پراکسی معکوس اعتماد می‌کند. آن را فقط زمانی فعال کنید که Gateway همچنان از دسترسی مستقیم راه دور با firewall جدا شده باشد و پراکسی محلی headerهای هویت ارسالی از سمت کلاینت را حذف یا بازنویسی کند.
- کلاینت‌های داخلی Gateway که از پراکسی معکوس عبور نمی‌کنند باید از `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` استفاده کنند، نه headerهای هویت trusted-proxy.
- استقرارهای غیر-loopback Control UI همچنان به `gateway.controlUi.allowedOrigins` صریح نیاز دارند.
- **شواهد forwarded-header برای fallback مستقیم محلی، locality مربوط به loopback را override می‌کند.** اگر درخواستی روی loopback برسد اما شواهد headerهای `Forwarded`، هر `X-Forwarded-*`، یا `X-Real-IP` را همراه داشته باشد، آن شواهد fallback رمز عبور local-direct و gate هویت دستگاه را فاقد صلاحیت می‌کند. با `allowLoopback: true`، احراز هویت trusted-proxy همچنان می‌تواند درخواست را به‌عنوان درخواست پراکسی روی همان host بپذیرد، در حالی که `requiredHeaders` و `allowUsers` همچنان اعمال می‌شوند.

</Warning>

### مرجع پیکربندی

<ParamField path="gateway.trustedProxies" type="string[]" required>
  آرایه‌ای از آدرس‌های IP پراکسی که باید به آن‌ها اعتماد شود. درخواست‌ها از IPهای دیگر رد می‌شوند.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  باید `"trusted-proxy"` باشد.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  نام header که هویت کاربر احرازشده را در خود دارد.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  headerهای اضافی که باید برای مورد اعتماد بودن درخواست حاضر باشند.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  allowlist هویت‌های کاربری. خالی بودن یعنی همه کاربران احرازشده مجاز هستند.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean">
  پشتیبانی opt-in برای پراکسی‌های معکوس loopback روی همان host. پیش‌فرض `false` است.
</ParamField>

<Warning>
`allowLoopback` را فقط زمانی فعال کنید که پراکسی معکوس محلی مرز اعتماد موردنظر باشد. هر process محلی که بتواند به Gateway وصل شود می‌تواند تلاش کند headerهای هویت پراکسی را ارسال کند، بنابراین دسترسی مستقیم Gateway را خصوصی و محدود به host نگه دارید و headerهای تحت مالکیت پراکسی مانند `x-forwarded-proto` یا header assertion امضاشده را، اگر پراکسی شما از آن پشتیبانی می‌کند، الزامی کنید.
</Warning>

## پایان‌دهی TLS و HSTS

از یک نقطه پایان‌دهی TLS استفاده کنید و HSTS را همان‌جا اعمال کنید.

<Tabs>
  <Tab title="Proxy TLS termination (recommended)">
    وقتی پراکسی معکوس شما HTTPS را برای `https://control.example.com` مدیریت می‌کند، `Strict-Transport-Security` را در پراکسی برای آن دامنه تنظیم کنید.

    - برای استقرارهای رو به اینترنت مناسب است.
    - سیاست certificate + سخت‌سازی HTTP را در یک نقطه نگه می‌دارد.
    - OpenClaw می‌تواند پشت پراکسی روی HTTP loopback باقی بماند.

    نمونه مقدار header:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Gateway TLS termination">
    اگر خود OpenClaw مستقیماً HTTPS را ارائه می‌کند (بدون پراکسی پایان‌دهنده TLS)، تنظیم کنید:

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

    `strictTransportSecurity` یک مقدار string برای header می‌پذیرد، یا `false` برای غیرفعال‌سازی صریح.

  </Tab>
</Tabs>

### راهنمای rollout

- ابتدا با max age کوتاه شروع کنید (برای مثال `max-age=300`) در حالی که ترافیک را اعتبارسنجی می‌کنید.
- فقط پس از بالا رفتن اطمینان، آن را به مقادیر بلندمدت افزایش دهید (برای مثال `max-age=31536000`).
- فقط اگر هر subdomain آماده HTTPS است، `includeSubDomains` را اضافه کنید.
- فقط اگر عمداً الزامات preload را برای مجموعه کامل دامنه‌های خود برآورده می‌کنید، از preload استفاده کنید.
- توسعه محلی فقط روی loopback از HSTS سودی نمی‌برد.

## نمونه‌های راه‌اندازی پراکسی

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium هویت را در `x-pomerium-claim-email` (یا headerهای claim دیگر) و یک JWT را در `x-pomerium-jwt-assertion` ارسال می‌کند.

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
  <Accordion title="Caddy with OAuth">
    Caddy با Plugin `caddy-security` می‌تواند کاربران را احراز هویت کند و headerهای هویت را ارسال کند.

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

    قطعه Caddyfile:

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
    oauth2-proxy کاربران را احراز هویت می‌کند و هویت را در `x-auth-request-email` ارسال می‌کند.

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

    قطعه پیکربندی nginx:

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

## پیکربندی token مختلط

OpenClaw پیکربندی‌های مبهمی را که در آن‌ها هم `gateway.auth.token` (یا `OPENCLAW_GATEWAY_TOKEN`) و هم حالت `trusted-proxy` هم‌زمان فعال هستند رد می‌کند. پیکربندی‌های token مختلط می‌توانند باعث شوند درخواست‌های loopback بی‌صدا در مسیر احراز هویت اشتباه احراز هویت شوند.

اگر هنگام startup خطای `mixed_trusted_proxy_token` دیدید:

- هنگام استفاده از حالت trusted-proxy، token مشترک را حذف کنید، یا
- اگر قصد احراز هویت مبتنی بر token دارید، `gateway.auth.mode` را به `"token"` تغییر دهید.

هدرهای هویت پراکسی معتمد local loopback همچنان در حالت fail closed شکست می‌خورند: فراخواننده‌های همان میزبان بی‌صدا به‌عنوان کاربران پراکسی احراز هویت نمی‌شوند. فراخواننده‌های داخلی OpenClaw که پراکسی را دور می‌زنند می‌توانند در عوض با `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` احراز هویت کنند. fallback توکن در حالت پراکسی معتمد عمداً پشتیبانی نمی‌شود.

## هدر دامنه‌های اپراتور

احراز هویت پراکسی معتمد یک حالت HTTP **حامل هویت** است، بنابراین فراخواننده‌ها می‌توانند به‌صورت اختیاری دامنه‌های اپراتور را با `x-openclaw-scopes` در درخواست‌های HTTP API اعلام کنند.

نکته: دامنه‌های WebSocket توسط handshake پروتکل Gateway و اتصال هویت دستگاه تعیین می‌شوند. در درخواست‌های ارتقای WebSocket برای Control UI، `x-openclaw-scopes` فقط سقفی برای دامنه‌های نشست مذاکره‌شده است، نه یک اعطا. برای رفتار دامنه WebSocket با پراکسی معتمد، [رفتار جفت‌سازی Control UI](#control-ui-pairing-behavior) را ببینید.

نمونه‌ها:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

رفتار:

- وقتی هدر وجود دارد، OpenClaw مجموعه دامنه اعلام‌شده را رعایت می‌کند.
- وقتی هدر وجود دارد اما خالی است، درخواست **هیچ** دامنه اپراتوری اعلام نمی‌کند.
- وقتی هدر وجود ندارد، APIهای HTTP عادیِ حامل هویت به مجموعه دامنه پیش‌فرض استاندارد اپراتور fallback می‌کنند.
- **مسیرهای HTTP Plugin** با احراز هویت Gateway به‌صورت پیش‌فرض محدودترند: وقتی `x-openclaw-scopes` وجود ندارد، دامنه زمان اجرای آن‌ها به `operator.write` fallback می‌کند.
- درخواست‌های HTTP با مبدأ مرورگر همچنان باید از `gateway.controlUi.allowedOrigins` (یا حالت fallback عمدی Host-header) عبور کنند، حتی پس از موفقیت احراز هویت پراکسی معتمد.
- برای نشست‌های WebSocket در Control UI، وقتی `x-openclaw-scopes` در درخواست ارتقا وجود داشته باشد، سقف دامنه است. مقدار خالی به هیچ دامنه‌ای منجر نمی‌شود.

قاعده عملی: وقتی می‌خواهید درخواست پراکسی معتمد از پیش‌فرض‌ها محدودتر باشد، یا وقتی یک مسیر Plugin با احراز هویت gateway به چیزی قوی‌تر از دامنه نوشتن نیاز دارد، `x-openclaw-scopes` را صریحاً ارسال کنید.

## چک‌لیست امنیت

پیش از فعال‌کردن احراز هویت پراکسی معتمد، بررسی کنید:

- [ ] **پراکسی تنها مسیر است**: پورت Gateway از همه‌چیز به‌جز پراکسی شما پشت فایروال است.
- [ ] **trustedProxies حداقلی است**: فقط IPهای واقعی پراکسی شما، نه کل زیرشبکه‌ها.
- [ ] **مبدأ پراکسی local loopback عمدی است**: احراز هویت پراکسی معتمد برای درخواست‌های با مبدأ local loopback در حالت fail closed شکست می‌خورد، مگر اینکه `gateway.auth.trustedProxy.allowLoopback` صریحاً برای پراکسی همان میزبان فعال شده باشد.
- [ ] **پراکسی هدرها را حذف می‌کند**: پراکسی شما هدرهای `x-forwarded-*` از کلاینت‌ها را بازنویسی می‌کند (نه اینکه به آن‌ها اضافه کند).
- [ ] **پایان‌دهی TLS**: پراکسی شما TLS را مدیریت می‌کند؛ کاربران از طریق HTTPS وصل می‌شوند.
- [ ] **allowedOrigins صریح است**: Control UI غیر local loopback از `gateway.controlUi.allowedOrigins` صریح استفاده می‌کند.
- [ ] **allowUsers تنظیم شده است** (توصیه‌شده): به‌جای اجازه‌دادن به هر کاربر احراز هویت‌شده، دسترسی را به کاربران شناخته‌شده محدود کنید.
- [ ] **پیکربندی توکن ترکیبی وجود ندارد**: هم‌زمان `gateway.auth.token` و `gateway.auth.mode: "trusted-proxy"` را تنظیم نکنید.
- [ ] **fallback رمز عبور محلی خصوصی است**: اگر `gateway.auth.password` را برای فراخواننده‌های مستقیم داخلی پیکربندی می‌کنید، پورت Gateway را پشت فایروال نگه دارید تا کلاینت‌های راه‌دور غیرپراکسی نتوانند مستقیماً به آن برسند.

## ممیزی امنیت

`openclaw security audit` احراز هویت پراکسی معتمد را با یافته‌ای با شدت **critical** علامت‌گذاری می‌کند. این عمدی است — یادآوری می‌کند که امنیت را به راه‌اندازی پراکسی خود واگذار کرده‌اید.

ممیزی این موارد را بررسی می‌کند:

- هشدار/یادآوری critical پایه `gateway.trusted_proxy_auth`
- نبود پیکربندی `trustedProxies`
- نبود پیکربندی `userHeader`
- `allowUsers` خالی (اجازه به هر کاربر احراز هویت‌شده)
- فعال بودن `allowLoopback` برای مبدأهای پراکسی همان میزبان
- سیاست مبدأ مرورگر wildcard یا مفقود در سطح‌های درمعرض‌دسترسی Control UI

## عیب‌یابی

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    درخواست از IP موجود در `gateway.trustedProxies` نیامده است. بررسی کنید:

    - آیا IP پراکسی درست است؟ (IPهای کانتینر Docker می‌توانند تغییر کنند.)
    - آیا جلوی پراکسی شما load balancer وجود دارد؟
    - برای یافتن IPهای واقعی از `docker inspect` یا `kubectl get pods -o wide` استفاده کنید.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw یک درخواست پراکسی معتمد با مبدأ local loopback را رد کرد.

    بررسی کنید:

    - آیا پراکسی از `127.0.0.1` / `::1` وصل می‌شود؟
    - آیا می‌خواهید احراز هویت پراکسی معتمد را با یک reverse proxy local loopback روی همان میزبان استفاده کنید؟

    رفع مشکل:

    - برای کلاینت‌های داخلی همان میزبان که از پراکسی عبور نمی‌کنند، احراز هویت توکن/رمز عبور را ترجیح دهید، یا
    - از طریق یک آدرس پراکسی معتمد غیر local loopback مسیریابی کنید و آن IP را در `gateway.trustedProxies` نگه دارید، یا
    - برای یک reverse proxy عمدی روی همان میزبان، `gateway.auth.trustedProxy.allowLoopback = true` را تنظیم کنید، آدرس local loopback را در `gateway.trustedProxies` نگه دارید، و مطمئن شوید پراکسی هدرهای هویت را حذف یا بازنویسی می‌کند.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    هدر کاربر خالی بود یا وجود نداشت. بررسی کنید:

    - آیا پراکسی شما برای عبوردادن هدرهای هویت پیکربندی شده است؟
    - آیا نام هدر درست است؟ (به حروف بزرگ و کوچک حساس نیست، اما املا مهم است)
    - آیا کاربر واقعاً در پراکسی احراز هویت شده است؟

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    یک هدر لازم وجود نداشت. بررسی کنید:

    - پیکربندی پراکسی شما برای آن هدرهای مشخص.
    - آیا هدرها در جایی از زنجیره حذف می‌شوند یا نه.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    کاربر احراز هویت شده اما در `allowUsers` نیست. یا او را اضافه کنید یا allowlist را حذف کنید.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    احراز هویت پراکسی معتمد موفق شد، اما هدر `Origin` مرورگر از بررسی‌های مبدأ Control UI عبور نکرد.

    بررسی کنید:

    - `gateway.controlUi.allowedOrigins` شامل مبدأ دقیق مرورگر باشد.
    - مگر اینکه عمداً رفتار allow-all می‌خواهید، به مبدأهای wildcard تکیه نکنید.
    - اگر عمداً از حالت fallback برای Host-header استفاده می‌کنید، `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` به‌صورت عمدی تنظیم شده باشد.

  </Accordion>
  <Accordion title="Connection succeeds but methods report missing scope">
    WebSocket وصل می‌شود، اما `chat.history`، `sessions.list`، یا
    `models.list` با `missing scope: operator.read` شکست می‌خورد.

    علت‌های رایج:

    - نشست Control UI بدون دستگاه: احراز هویت پراکسی معتمد می‌تواند اتصال WebSocket را بدون هویت دستگاه بپذیرد، اما OpenClaw طبق طراحی دامنه‌ها را در نشست‌های بدون دستگاه پاک می‌کند.
    - کلاینت backend سفارشی: `gateway.controlUi.dangerouslyDisableDeviceAuth` محدود به Control UI است و به کلاینت‌های WebSocket دلخواه backend یا شبیه CLI دامنه اعطا نمی‌کند.
    - `x-openclaw-scopes` بیش‌ازحد محدود: اگر پراکسی شما این هدر را در درخواست ارتقای WebSocket برای Control UI تزریق کند، دامنه‌های نشست به آن مجموعه محدود می‌شوند. مقدار هدر خالی به هیچ دامنه‌ای منجر نمی‌شود.

    رفع مشکل:

    - برای Control UI، از HTTPS استفاده کنید تا مرورگر بتواند هویت دستگاه تولید کند و جفت‌سازی را کامل کند.
    - برای خودکارسازی سفارشی، از هویت/جفت‌سازی دستگاه، مسیر helper backend رزروشده direct-local با نام `gateway-client`، یا [admin HTTP RPC](/fa/plugins/admin-http-rpc) استفاده کنید.
    - از `gateway.controlUi.dangerouslyDisableDeviceAuth: true` فقط به‌عنوان مسیر موقت break-glass برای Control UI استفاده کنید.

  </Accordion>
  <Accordion title="WebSocket still failing">
    مطمئن شوید پراکسی شما:

    - از ارتقاهای WebSocket پشتیبانی می‌کند (`Upgrade: websocket`، `Connection: upgrade`).
    - هدرهای هویت را در درخواست‌های ارتقای WebSocket عبور می‌دهد (نه فقط HTTP).
    - مسیر احراز هویت جداگانه‌ای برای اتصال‌های WebSocket ندارد.

  </Accordion>
</AccordionGroup>

## مهاجرت از احراز هویت توکن

اگر از احراز هویت توکن به پراکسی معتمد منتقل می‌شوید:

<Steps>
  <Step title="Configure the proxy">
    پراکسی خود را برای احراز هویت کاربران و عبوردادن هدرها پیکربندی کنید.
  </Step>
  <Step title="Test the proxy independently">
    راه‌اندازی پراکسی را به‌صورت مستقل آزمایش کنید (curl با هدرها).
  </Step>
  <Step title="Update OpenClaw config">
    پیکربندی OpenClaw را با احراز هویت پراکسی معتمد به‌روزرسانی کنید.
  </Step>
  <Step title="Restart the Gateway">
    Gateway را راه‌اندازی مجدد کنید.
  </Step>
  <Step title="Test WebSocket">
    اتصال‌های WebSocket را از Control UI آزمایش کنید.
  </Step>
  <Step title="Audit">
    `openclaw security audit` را اجرا کنید و یافته‌ها را مرور کنید.
  </Step>
</Steps>

## مرتبط

- [پیکربندی](/fa/gateway/configuration) — مرجع پیکربندی
- [دسترسی راه‌دور](/fa/gateway/remote) — الگوهای دیگر دسترسی راه‌دور
- [امنیت](/fa/gateway/security) — راهنمای کامل امنیت
- [Tailscale](/fa/gateway/tailscale) — جایگزین ساده‌تر برای دسترسی فقط tailnet

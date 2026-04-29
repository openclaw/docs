---
read_when:
    - اجرای OpenClaw پشت یک پروکسی آگاه از هویت
    - راه‌اندازی Pomerium، Caddy یا nginx با OAuth در جلوی OpenClaw
    - رفع خطاهای غیرمجاز WebSocket 1008 در پیکربندی‌های پراکسی معکوس
    - تصمیم‌گیری دربارهٔ اینکه HSTS و دیگر سرآیندهای سخت‌سازی HTTP کجا تنظیم شوند
sidebarTitle: Trusted proxy auth
summary: احراز هویت Gateway را به یک پروکسی معکوس مورد اعتماد واگذار کنید (Pomerium، Caddy، nginx + OAuth)
title: احراز هویت پروکسی مورد اعتماد
x-i18n:
    generated_at: "2026-04-29T22:57:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 311498b822d2dbf9833c71ec070ab5cee5b4dd2dfb0eeaad1d758eee367a2df3
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**ویژگی حساس از نظر امنیتی.** این حالت احراز هویت را کاملا به reverse proxy شما واگذار می‌کند. پیکربندی نادرست می‌تواند Gateway شما را در معرض دسترسی غیرمجاز قرار دهد. پیش از فعال‌سازی، این صفحه را با دقت بخوانید.
</Warning>

## زمان استفاده

از حالت احراز هویت `trusted-proxy` زمانی استفاده کنید که:

- OpenClaw را پشت یک **پروکسی آگاه از هویت** اجرا می‌کنید (Pomerium، Caddy + OAuth، nginx + oauth2-proxy، Traefik + forward auth).
- پروکسی شما همه احراز هویت را انجام می‌دهد و هویت کاربر را از طریق headerها ارسال می‌کند.
- در محیط Kubernetes یا container هستید که در آن پروکسی تنها مسیر به Gateway است.
- با خطاهای WebSocket `1008 unauthorized` روبه‌رو هستید، چون مرورگرها نمی‌توانند tokenها را در payloadهای WS ارسال کنند.

## زمان عدم استفاده

- اگر پروکسی شما کاربران را احراز هویت نمی‌کند (فقط یک TLS terminator یا load balancer است).
- اگر هر مسیری به Gateway وجود دارد که پروکسی را دور می‌زند (حفره‌های firewall، دسترسی شبکه داخلی).
- اگر مطمئن نیستید پروکسی شما headerهای forwarded را به‌درستی حذف یا بازنویسی می‌کند.
- اگر فقط به دسترسی شخصی تک‌کاربره نیاز دارید (برای راه‌اندازی ساده‌تر، Tailscale Serve + loopback را در نظر بگیرید).

## نحوه کار

<Steps>
  <Step title="پروکسی کاربر را احراز هویت می‌کند">
    reverse proxy شما کاربران را احراز هویت می‌کند (OAuth، OIDC، SAML و غیره).
  </Step>
  <Step title="پروکسی یک header هویت اضافه می‌کند">
    پروکسی یک header با هویت کاربر احراز‌شده اضافه می‌کند (مثلا `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Gateway منبع مورد اعتماد را بررسی می‌کند">
    OpenClaw بررسی می‌کند که درخواست از یک **IP پروکسی مورد اعتماد** آمده باشد (در `gateway.trustedProxies` پیکربندی شده است).
  </Step>
  <Step title="Gateway هویت را استخراج می‌کند">
    OpenClaw هویت کاربر را از header پیکربندی‌شده استخراج می‌کند.
  </Step>
  <Step title="مجوزدهی">
    اگر همه چیز درست باشد، درخواست مجاز می‌شود.
  </Step>
</Steps>

## رفتار جفت‌سازی Control UI

وقتی `gateway.auth.mode = "trusted-proxy"` فعال است و درخواست بررسی‌های trusted-proxy را با موفقیت پشت سر می‌گذارد، sessionهای WebSocket در Control UI می‌توانند بدون هویت جفت‌سازی دستگاه متصل شوند.

پیامدها:

- جفت‌سازی دیگر در این حالت دروازه اصلی برای دسترسی به Control UI نیست.
- سیاست احراز هویت reverse proxy شما و `allowUsers` به کنترل دسترسی موثر تبدیل می‌شوند.
- ورودی Gateway را فقط به IPهای پروکسی مورد اعتماد محدود نگه دارید (`gateway.trustedProxies` + firewall).

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

- احراز هویت trusted-proxy به‌صورت پیش‌فرض درخواست‌های با منبع loopback (`127.0.0.1`، `::1`، CIDRهای loopback) را رد می‌کند.
- reverse proxyهای loopback روی همان میزبان، احراز هویت trusted-proxy را برآورده نمی‌کنند مگر اینکه صریحا `gateway.auth.trustedProxy.allowLoopback = true` را تنظیم کنید و آدرس loopback را در `gateway.trustedProxies` قرار دهید.
- `allowLoopback` به فرایندهای محلی روی میزبان Gateway به همان اندازه reverse proxy اعتماد می‌کند. آن را فقط زمانی فعال کنید که Gateway همچنان در برابر دسترسی مستقیم راه دور با firewall محافظت شده باشد و پروکسی محلی headerهای هویت ارسالی از سمت client را حذف یا بازنویسی کند.
- کلاینت‌های داخلی Gateway که از reverse proxy عبور نمی‌کنند باید از `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` استفاده کنند، نه headerهای هویت trusted-proxy.
- استقرارهای Control UI غیر loopback همچنان به `gateway.controlUi.allowedOrigins` صریح نیاز دارند.
- **شواهد forwarded-header برای fallback مستقیم محلی بر محلی‌بودن loopback اولویت دارند.** اگر درخواستی روی loopback برسد اما headerهای `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` را همراه داشته باشد که به یک مبدأ غیرمحلی اشاره می‌کنند، این شواهد fallback رمز عبور local-direct و gating هویت دستگاه را نامعتبر می‌کند. با `allowLoopback: true`، احراز هویت trusted-proxy همچنان می‌تواند درخواست را به‌عنوان درخواست پروکسی روی همان میزبان بپذیرد، در حالی که `requiredHeaders` و `allowUsers` همچنان اعمال می‌شوند.

</Warning>

### مرجع پیکربندی

<ParamField path="gateway.trustedProxies" type="string[]" required>
  آرایه‌ای از آدرس‌های IP پروکسی برای اعتماد. درخواست‌ها از IPهای دیگر رد می‌شوند.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  باید `"trusted-proxy"` باشد.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  نام headerی که هویت کاربر احراز‌شده را در خود دارد.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  headerهای اضافی که باید وجود داشته باشند تا درخواست مورد اعتماد باشد.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  فهرست مجاز هویت‌های کاربری. خالی بودن یعنی همه کاربران احراز‌شده مجازند.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean">
  پشتیبانی opt-in برای reverse proxyهای loopback روی همان میزبان. مقدار پیش‌فرض `false` است.
</ParamField>

<Warning>
`allowLoopback` را فقط زمانی فعال کنید که reverse proxy محلی همان مرز اعتماد مورد نظر باشد. هر فرایند محلی که بتواند به Gateway متصل شود می‌تواند تلاش کند headerهای هویت پروکسی را ارسال کند؛ بنابراین دسترسی مستقیم Gateway را فقط برای میزبان خصوصی نگه دارید و headerهای متعلق به پروکسی مانند `x-forwarded-proto` یا یک header assertion امضاشده را، در صورت پشتیبانی پروکسی، الزامی کنید.
</Warning>

## پایان‌دهی TLS و HSTS

از یک نقطه پایان‌دهی TLS استفاده کنید و HSTS را همان‌جا اعمال کنید.

<Tabs>
  <Tab title="پایان‌دهی TLS در پروکسی (توصیه‌شده)">
    وقتی reverse proxy شما HTTPS را برای `https://control.example.com` مدیریت می‌کند، `Strict-Transport-Security` را در پروکسی برای آن دامنه تنظیم کنید.

    - برای استقرارهای رو به اینترنت مناسب است.
    - سیاست certificate + سخت‌سازی HTTP را در یک جا نگه می‌دارد.
    - OpenClaw می‌تواند پشت پروکسی روی HTTP loopback باقی بماند.

    مقدار نمونه header:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="پایان‌دهی TLS در Gateway">
    اگر خود OpenClaw مستقیما HTTPS ارائه می‌دهد (بدون پروکسی پایان‌دهنده TLS)، تنظیم کنید:

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

- ابتدا با یک max age کوتاه شروع کنید (برای مثال `max-age=300`) و هم‌زمان traffic را اعتبارسنجی کنید.
- فقط پس از بالا رفتن اطمینان، مقدار را به مقادیر بلندمدت افزایش دهید (برای مثال `max-age=31536000`).
- `includeSubDomains` را فقط زمانی اضافه کنید که همه subdomainها برای HTTPS آماده باشند.
- preload را فقط زمانی استفاده کنید که عمدا الزامات preload را برای کل مجموعه دامنه خود برآورده کرده باشید.
- توسعه محلی فقط loopback از HSTS سودی نمی‌برد.

## نمونه‌های راه‌اندازی پروکسی

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
  <Accordion title="Caddy با OAuth">
    Caddy با Plugin به نام `caddy-security` می‌تواند کاربران را احراز هویت کند و headerهای هویت را ارسال کند.

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
  <Accordion title="Traefik با forward auth">
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

## پیکربندی token ترکیبی

OpenClaw پیکربندی‌های مبهمی را که در آن‌ها هم `gateway.auth.token` (یا `OPENCLAW_GATEWAY_TOKEN`) و هم حالت `trusted-proxy` هم‌زمان فعال باشند، رد می‌کند. پیکربندی‌های token ترکیبی می‌توانند باعث شوند درخواست‌های loopback بی‌صدا از مسیر احراز هویت اشتباه احراز شوند.

اگر هنگام startup خطای `mixed_trusted_proxy_token` را می‌بینید:

- هنگام استفاده از حالت trusted-proxy، token مشترک را حذف کنید، یا
- اگر قصد احراز هویت مبتنی بر token دارید، `gateway.auth.mode` را به `"token"` تغییر دهید.

headerهای هویت trusted-proxy روی loopback همچنان fail-closed هستند: فراخوان‌های همان میزبان بی‌صدا به‌عنوان کاربران پروکسی احراز هویت نمی‌شوند. فراخوان‌های داخلی OpenClaw که پروکسی را دور می‌زنند می‌توانند به‌جای آن با `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` احراز هویت کنند. fallback مبتنی بر token عمدا در حالت trusted-proxy پشتیبانی نمی‌شود.

## header حوزه‌های operator

احراز هویت trusted-proxy یک حالت HTTP **حامل هویت** است، بنابراین فراخوان‌ها می‌توانند به‌صورت اختیاری حوزه‌های operator را با `x-openclaw-scopes` اعلام کنند.

نمونه‌ها:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

رفتار:

- وقتی header وجود دارد، OpenClaw مجموعه scope اعلام‌شده را رعایت می‌کند.
- وقتی header وجود دارد اما خالی است، درخواست اعلام می‌کند که **هیچ** scope مربوط به operator ندارد.
- وقتی header وجود ندارد، APIهای HTTP حامل هویت عادی به مجموعه scope پیش‌فرض استاندارد operator fallback می‌کنند.
- **مسیرهای HTTP متعلق به Plugin** در احراز هویت Gateway به‌صورت پیش‌فرض محدودتر هستند: وقتی `x-openclaw-scopes` وجود ندارد، scope زمان اجرای آن‌ها به `operator.write` fallback می‌کند.
- درخواست‌های HTTP با مبدأ مرورگر همچنان باید `gateway.controlUi.allowedOrigins` (یا حالت fallback عمدی Host-header) را بگذرانند، حتی پس از موفقیت احراز هویت trusted-proxy.

قاعده عملی: وقتی می‌خواهید یک درخواست trusted-proxy محدودتر از پیش‌فرض‌ها باشد، یا وقتی یک مسیر Plugin با احراز هویت Gateway به چیزی قوی‌تر از scope نوشتن نیاز دارد، `x-openclaw-scopes` را صریحا ارسال کنید.

## چک‌لیست امنیتی

پیش از فعال‌کردن احراز هویت trusted-proxy، بررسی کنید:

- [ ] **پروکسی تنها مسیر است**: پورت Gateway از همه چیز به‌جز پروکسی شما با فایروال مسدود شده است.
- [ ] **trustedProxies حداقلی است**: فقط IPهای واقعی پروکسی شما، نه کل زیرشبکه‌ها.
- [ ] **منبع پروکسی loopback آگاهانه است**: احراز هویت trusted-proxy برای درخواست‌های با منبع loopback به‌صورت بسته شکست می‌خورد، مگر اینکه `gateway.auth.trustedProxy.allowLoopback` صریحاً برای یک پروکسی روی همان میزبان فعال شده باشد.
- [ ] **پروکسی سرآیندها را حذف می‌کند**: پروکسی شما سرآیندهای `x-forwarded-*` دریافتی از کلاینت‌ها را بازنویسی می‌کند، نه اینکه به آن‌ها اضافه کند.
- [ ] **پایان‌دهی TLS**: پروکسی شما TLS را مدیریت می‌کند؛ کاربران از طریق HTTPS وصل می‌شوند.
- [ ] **allowedOrigins صریح است**: رابط کاربری کنترل غیر loopback از `gateway.controlUi.allowedOrigins` صریح استفاده می‌کند.
- [ ] **allowUsers تنظیم شده است** (توصیه می‌شود): دسترسی را به کاربران شناخته‌شده محدود کنید، به‌جای اینکه هر فرد احراز هویت‌شده‌ای مجاز باشد.
- [ ] **پیکربندی توکن مختلط وجود ندارد**: هم‌زمان `gateway.auth.token` و `gateway.auth.mode: "trusted-proxy"` را تنظیم نکنید.
- [ ] **جایگزین محلی گذرواژه خصوصی است**: اگر `gateway.auth.password` را برای فراخواننده‌های مستقیم داخلی پیکربندی می‌کنید، پورت Gateway را پشت فایروال نگه دارید تا کلاینت‌های راه دور غیرپروکسی نتوانند مستقیماً به آن دسترسی داشته باشند.

## ممیزی امنیتی

`openclaw security audit` احراز هویت trusted-proxy را با یافته‌ای با شدت **بحرانی** علامت‌گذاری می‌کند. این عمدی است؛ یادآوری می‌کند که امنیت را به راه‌اندازی پروکسی خود واگذار کرده‌اید.

ممیزی این موارد را بررسی می‌کند:

- هشدار/یادآوری بحرانی پایه `gateway.trusted_proxy_auth`
- نبود پیکربندی `trustedProxies`
- نبود پیکربندی `userHeader`
- خالی بودن `allowUsers` (هر کاربر احراز هویت‌شده‌ای را مجاز می‌کند)
- فعال بودن `allowLoopback` برای منابع پروکسی روی همان میزبان
- سیاست مبدأ مرورگر wildcard یا مفقود روی سطوح در معرض دسترس رابط کاربری کنترل

## عیب‌یابی

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    درخواست از IP موجود در `gateway.trustedProxies` نیامده است. بررسی کنید:

    - آیا IP پروکسی درست است؟ (IPهای کانتینر Docker می‌توانند تغییر کنند.)
    - آیا جلوی پروکسی شما یک load balancer قرار دارد؟
    - برای یافتن IPهای واقعی از `docker inspect` یا `kubectl get pods -o wide` استفاده کنید.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw یک درخواست trusted-proxy با منبع loopback را رد کرد.

    بررسی کنید:

    - آیا پروکسی از `127.0.0.1` / `::1` وصل می‌شود؟
    - آیا تلاش می‌کنید احراز هویت trusted-proxy را با یک پروکسی معکوس loopback روی همان میزبان استفاده کنید؟

    رفع مشکل:

    - برای کلاینت‌های داخلی روی همان میزبان که از پروکسی عبور نمی‌کنند، احراز هویت توکن/گذرواژه را ترجیح دهید، یا
    - از طریق یک نشانی پروکسی معتبر غیر loopback مسیریابی کنید و آن IP را در `gateway.trustedProxies` نگه دارید، یا
    - برای یک پروکسی معکوس آگاهانه روی همان میزبان، `gateway.auth.trustedProxy.allowLoopback = true` را تنظیم کنید، نشانی loopback را در `gateway.trustedProxies` نگه دارید، و مطمئن شوید پروکسی سرآیندهای هویت را حذف یا بازنویسی می‌کند.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    سرآیند کاربر خالی یا مفقود بود. بررسی کنید:

    - آیا پروکسی شما برای عبور دادن سرآیندهای هویت پیکربندی شده است؟
    - آیا نام سرآیند درست است؟ (به بزرگی و کوچکی حروف حساس نیست، اما املای آن مهم است)
    - آیا کاربر واقعاً در پروکسی احراز هویت شده است؟

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    یک سرآیند الزامی وجود نداشت. بررسی کنید:

    - پیکربندی پروکسی خود را برای آن سرآیندهای مشخص.
    - اینکه آیا سرآیندها در جایی از زنجیره حذف می‌شوند یا نه.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    کاربر احراز هویت شده است اما در `allowUsers` نیست. یا او را اضافه کنید یا فهرست مجاز را حذف کنید.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    احراز هویت trusted-proxy موفق بود، اما سرآیند `Origin` مرورگر از بررسی‌های مبدأ رابط کاربری کنترل عبور نکرد.

    بررسی کنید:

    - `gateway.controlUi.allowedOrigins` مبدأ دقیق مرورگر را شامل می‌شود.
    - مگر اینکه عمداً رفتار اجازه به همه را می‌خواهید، به مبدأهای wildcard تکیه نمی‌کنید.
    - اگر عمداً از حالت جایگزین Host-header استفاده می‌کنید، `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` آگاهانه تنظیم شده است.

  </Accordion>
  <Accordion title="WebSocket still failing">
    مطمئن شوید پروکسی شما:

    - ارتقاهای WebSocket را پشتیبانی می‌کند (`Upgrade: websocket`, `Connection: upgrade`).
    - سرآیندهای هویت را روی درخواست‌های ارتقای WebSocket هم عبور می‌دهد، نه فقط HTTP.
    - مسیر احراز هویت جداگانه‌ای برای اتصال‌های WebSocket ندارد.

  </Accordion>
</AccordionGroup>

## مهاجرت از احراز هویت توکن

اگر از احراز هویت توکن به trusted-proxy منتقل می‌شوید:

<Steps>
  <Step title="Configure the proxy">
    پروکسی خود را برای احراز هویت کاربران و عبور دادن سرآیندها پیکربندی کنید.
  </Step>
  <Step title="Test the proxy independently">
    راه‌اندازی پروکسی را مستقل آزمایش کنید (curl با سرآیندها).
  </Step>
  <Step title="Update OpenClaw config">
    پیکربندی OpenClaw را با احراز هویت trusted-proxy به‌روزرسانی کنید.
  </Step>
  <Step title="Restart the Gateway">
    Gateway را راه‌اندازی مجدد کنید.
  </Step>
  <Step title="Test WebSocket">
    اتصال‌های WebSocket را از رابط کاربری کنترل آزمایش کنید.
  </Step>
  <Step title="Audit">
    `openclaw security audit` را اجرا کنید و یافته‌ها را بررسی کنید.
  </Step>
</Steps>

## مرتبط

- [پیکربندی](/fa/gateway/configuration) — مرجع پیکربندی
- [دسترسی راه دور](/fa/gateway/remote) — الگوهای دیگر دسترسی راه دور
- [امنیت](/fa/gateway/security) — راهنمای کامل امنیت
- [Tailscale](/fa/gateway/tailscale) — جایگزینی ساده‌تر برای دسترسی فقط در tailnet

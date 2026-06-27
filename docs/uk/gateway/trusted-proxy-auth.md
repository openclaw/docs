---
read_when:
    - Запуск OpenClaw за проксі з урахуванням ідентичності
    - Налаштування Pomerium, Caddy або nginx з OAuth перед OpenClaw
    - Виправлення помилок WebSocket 1008 unauthorized у конфігураціях зі зворотним проксі
    - Вибір місця налаштування HSTS та інших HTTP-заголовків посилення захисту
sidebarTitle: Trusted proxy auth
summary: Делегуйте автентифікацію Gateway довіреному зворотному проксі (Pomerium, Caddy, nginx + OAuth)
title: Довірена автентифікація через проксі
x-i18n:
    generated_at: "2026-06-27T17:37:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 498a8aca666f88201302af3895b11ba43ab9c0b1bff00a262145fc9e21e80fa7
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Функція, чутлива до безпеки.** Цей режим повністю делегує автентифікацію вашому зворотному проксі. Неправильна конфігурація може відкрити ваш Gateway для несанкціонованого доступу. Уважно прочитайте цю сторінку перед увімкненням.
</Warning>

## Коли використовувати

Використовуйте режим автентифікації `trusted-proxy`, коли:

- Ви запускаєте OpenClaw за **проксі з урахуванням ідентичності** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth).
- Ваш проксі обробляє всю автентифікацію та передає ідентичність користувача через заголовки.
- Ви працюєте в Kubernetes або контейнерному середовищі, де проксі є єдиним шляхом до Gateway.
- Ви отримуєте помилки WebSocket `1008 unauthorized`, бо браузери не можуть передавати токени в корисному навантаженні WS.

## Коли НЕ використовувати

- Якщо ваш проксі не автентифікує користувачів (лише TLS-термінатор або балансувальник навантаження).
- Якщо існує будь-який шлях до Gateway в обхід проксі (прогалини у firewall, доступ з внутрішньої мережі).
- Якщо ви не впевнені, чи ваш проксі коректно видаляє/перезаписує переслані заголовки.
- Якщо вам потрібен лише персональний однокористувацький доступ (розгляньте Tailscale Serve + loopback для простішого налаштування).

## Як це працює

<Steps>
  <Step title="Проксі автентифікує користувача">
    Ваш зворотний проксі автентифікує користувачів (OAuth, OIDC, SAML тощо).
  </Step>
  <Step title="Проксі додає заголовок ідентичності">
    Проксі додає заголовок з ідентичністю автентифікованого користувача (наприклад, `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Gateway перевіряє довірене джерело">
    OpenClaw перевіряє, що запит надійшов від **довіреної IP-адреси проксі** (налаштовано в `gateway.trustedProxies`).
  </Step>
  <Step title="Gateway витягує ідентичність">
    OpenClaw витягує ідентичність користувача з налаштованого заголовка.
  </Step>
  <Step title="Авторизація">
    Якщо всі перевірки успішні, запит авторизується.
  </Step>
</Steps>

## Поведінка сполучення Control UI

Коли активний `gateway.auth.mode = "trusted-proxy"` і запит проходить перевірки trusted-proxy, WebSocket-сеанси Control UI можуть підключатися без ідентичності сполученого пристрою.

Наслідки для області дії:

- WebSocket-сеанси Control UI без пристрою підключаються, але типово не отримують операторських областей дії. OpenClaw очищає список запитаних областей дії до `[]`, щоб сеанс, не прив'язаний до схваленого сполученого пристрою/токена, не міг самостійно оголошувати дозволи.
- Якщо методи завершуються помилкою `missing scope` після успішного WebSocket-підключення, використовуйте HTTPS, щоб браузер міг згенерувати ідентичність пристрою та завершити сполучення. Див. [небезпечний HTTP Control UI](/uk/web/control-ui#insecure-http).
- Лише аварійний обхід: `gateway.controlUi.dangerouslyDisableDeviceAuth=true` зберігає запитані області дії навіть без ідентичності пристрою. Це суттєве зниження рівня безпеки; швидко скасуйте. Див. [небезпечний HTTP Control UI](/uk/web/control-ui#insecure-http).

Обмеження областей дії зворотним проксі:

- Якщо ваш проксі надсилає `x-openclaw-scopes` у запиті оновлення WebSocket для Control UI, OpenClaw обмежує області дії сеансу перетином запитаних і оголошених областей дії. Цей заголовок не надає областей дії; він лише звужує те, що може мати сеанс.

Наслідки:

- Сполучення більше не є основним бар'єром для доступу до Control UI в цьому режимі.
- Ваша політика автентифікації зворотного проксі та `allowUsers` стають фактичним контролем доступу.
- Тримайте вхідний доступ до gateway обмеженим лише довіреними IP-адресами проксі (`gateway.trustedProxies` + firewall).

Власні WebSocket-клієнти не є сеансами Control UI. `gateway.controlUi.dangerouslyDisableDeviceAuth` не надає областей дії довільним клієнтам `client.mode: "backend"` або клієнтам у стилі CLI. Власна автоматизація має використовувати ідентичність/сполучення пристрою, зарезервований прямий локальний допоміжний шлях backend `client.id: "gateway-client"` або [Plugin admin HTTP RPC](/uk/plugins/admin-http-rpc), коли поверхня HTTP-запит/відповідь підходить краще.

## Конфігурація

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
**Важливі правила виконання**

- Автентифікація trusted-proxy типово відхиляє запити з loopback-джерел (`127.0.0.1`, `::1`, loopback CIDR).
- Зворотні проксі same-host loopback **не** задовольняють автентифікацію trusted-proxy, якщо ви явно не задасте `gateway.auth.trustedProxy.allowLoopback = true` і не включите loopback-адресу в `gateway.trustedProxies`.
- `allowLoopback` довіряє локальним процесам на хості Gateway тією самою мірою, що й зворотному проксі. Увімкніть це лише тоді, коли Gateway все ще захищений firewall від прямого віддаленого доступу, а локальний проксі видаляє або перезаписує надані клієнтом заголовки ідентичності.
- Внутрішні клієнти Gateway, які не проходять через зворотний проксі, мають використовувати `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, а не заголовки ідентичності trusted-proxy.
- Розгортання Control UI не на loopback усе ще потребують явного `gateway.controlUi.allowedOrigins`.
- **Докази пересланих заголовків мають пріоритет над loopback-локальністю для локального прямого fallback.** Якщо запит надходить через loopback, але містить докази заголовків `Forwarded`, будь-які `X-Forwarded-*` або `X-Real-IP`, ці докази дискваліфікують локальний прямий password fallback і gating за ідентичністю пристрою. З `allowLoopback: true` автентифікація trusted-proxy усе ще може прийняти запит як same-host proxy-запит, тоді як `requiredHeaders` і `allowUsers` продовжують застосовуватися.

</Warning>

### Довідник конфігурації

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Масив IP-адрес проксі, яким слід довіряти. Запити з інших IP-адрес відхиляються.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  Має бути `"trusted-proxy"`.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Ім'я заголовка, що містить ідентичність автентифікованого користувача.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  Додаткові заголовки, які мають бути присутні, щоб запит вважався довіреним.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Список дозволених ідентичностей користувачів. Порожнє значення означає дозволити всіх автентифікованих користувачів.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean">
  Явне ввімкнення підтримки same-host loopback зворотних проксі. Типово `false`.
</ParamField>

<Warning>
Увімкніть `allowLoopback` лише тоді, коли локальний зворотний проксі є передбаченою межею довіри. Будь-який локальний процес, який може підключитися до Gateway, може спробувати надіслати заголовки ідентичності проксі, тому тримайте прямий доступ до Gateway приватним для хоста та вимагайте заголовків, якими володіє проксі, як-от `x-forwarded-proto`, або підписаного assertion-заголовка, якщо ваш проксі підтримує такий.
</Warning>

## TLS-термінація та HSTS

Використовуйте одну точку TLS-термінації та застосовуйте HSTS там.

<Tabs>
  <Tab title="TLS-термінація на проксі (рекомендовано)">
    Коли ваш зворотний проксі обробляє HTTPS для `https://control.example.com`, задайте `Strict-Transport-Security` на проксі для цього домену.

    - Добре підходить для розгортань, доступних з інтернету.
    - Тримає політику сертифікатів і HTTP-захисту в одному місці.
    - OpenClaw може залишатися на loopback HTTP за проксі.

    Приклад значення заголовка:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="TLS-термінація на Gateway">
    Якщо OpenClaw сам напряму обслуговує HTTPS (без проксі, що термінує TLS), задайте:

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

    `strictTransportSecurity` приймає рядкове значення заголовка або `false` для явного вимкнення.

  </Tab>
</Tabs>

### Рекомендації з розгортання

- Спершу почніть із короткого max age (наприклад, `max-age=300`), поки перевіряєте трафік.
- Збільшуйте до довготривалих значень (наприклад, `max-age=31536000`) лише після високої впевненості.
- Додавайте `includeSubDomains` лише якщо кожен піддомен готовий до HTTPS.
- Використовуйте preload лише якщо ви свідомо відповідаєте вимогам preload для повного набору доменів.
- Локальна розробка лише через loopback не отримує користі від HSTS.

## Приклади налаштування проксі

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium передає ідентичність у `x-pomerium-claim-email` (або інших claim-заголовках) і JWT у `x-pomerium-jwt-assertion`.

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

    Фрагмент конфігурації Pomerium:

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
  <Accordion title="Caddy з OAuth">
    Caddy з Plugin `caddy-security` може автентифікувати користувачів і передавати заголовки ідентичності.

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

    Фрагмент Caddyfile:

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
    oauth2-proxy автентифікує користувачів і передає ідентичність у `x-auth-request-email`.

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

    Фрагмент конфігурації nginx:

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
  <Accordion title="Traefik із forward auth">
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

## Змішана конфігурація токенів

OpenClaw відхиляє неоднозначні конфігурації, де одночасно активні `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`) і режим `trusted-proxy`. Змішані конфігурації токенів можуть призвести до того, що loopback-запити тихо автентифікуватимуться неправильним шляхом автентифікації.

Якщо під час запуску ви бачите помилку `mixed_trusted_proxy_token`:

- Видаліть спільний токен, коли використовуєте режим trusted-proxy, або
- Перемкніть `gateway.auth.mode` на `"token"`, якщо ви маєте намір використовувати автентифікацію на основі токенів.

Довірені proxy-заголовки ідентичності loopback усе ще завершуються відмовою: виклики з того самого хоста не автентифікуються неявно як користувачі proxy. Внутрішні виклики OpenClaw, що обходять proxy, натомість можуть автентифікуватися через `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. Резервний варіант із токеном у режимі trusted-proxy навмисно не підтримується.

## Заголовок операторських scopes

Автентифікація trusted-proxy є HTTP-режимом, що **передає ідентичність**, тож виклики можуть необов’язково оголошувати операторські scopes за допомогою `x-openclaw-scopes` в HTTP API-запитах.

Примітка: WebSocket scopes визначаються handshake протоколу Gateway і прив’язкою ідентичності пристрою. У запитах Control UI на WebSocket upgrade `x-openclaw-scopes` є лише обмеженням negotiated session scopes, а не наданням прав. Про поведінку WebSocket scope з trusted-proxy див. [поведінку pairing Control UI](#control-ui-pairing-behavior).

Приклади:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Поведінка:

- Коли заголовок присутній, OpenClaw враховує оголошений набір scopes.
- Коли заголовок присутній, але порожній, запит оголошує, що операторських scopes **немає**.
- Коли заголовок відсутній, звичайні HTTP API, що передають ідентичність, повертаються до стандартного набору операторських scopes за замовчуванням.
- **Plugin HTTP routes** з Gateway-автентифікацією типово мають вужчі права: коли `x-openclaw-scopes` відсутній, їхній runtime scope повертається до `operator.write`.
- HTTP-запити з браузерним origin усе ще мають пройти `gateway.controlUi.allowedOrigins` (або навмисний fallback-режим Host-заголовка) навіть після успішної trusted-proxy auth.
- Для WebSocket-сеансів Control UI `x-openclaw-scopes` є обмеженням scopes, коли він присутній у upgrade-запиті. Порожнє значення не дає жодних scopes.

Практичне правило: надсилайте `x-openclaw-scopes` явно, коли хочете, щоб trusted-proxy-запит був вужчим за типові значення, або коли Plugin route з gateway-auth потребує чогось сильнішого за write scope.

## Контрольний список безпеки

Перш ніж увімкнути trusted-proxy auth, перевірте:

- [ ] **Proxy є єдиним шляхом**: порт Gateway закритий firewall для всього, крім вашого proxy.
- [ ] **trustedProxies мінімальний**: лише фактичні IP-адреси вашого proxy, а не цілі підмережі.
- [ ] **Джерело loopback proxy є навмисним**: trusted-proxy auth завершується відмовою для запитів із loopback-джерела, якщо `gateway.auth.trustedProxy.allowLoopback` не ввімкнено явно для proxy на тому самому хості.
- [ ] **Proxy прибирає заголовки**: ваш proxy перезаписує (а не додає) `x-forwarded-*` заголовки від клієнтів.
- [ ] **TLS termination**: ваш proxy обробляє TLS; користувачі підключаються через HTTPS.
- [ ] **allowedOrigins задано явно**: Control UI не з loopback використовує явний `gateway.controlUi.allowedOrigins`.
- [ ] **allowUsers задано** (рекомендовано): обмежте доступ відомими користувачами замість дозволяти всім автентифікованим.
- [ ] **Без змішаної конфігурації токенів**: не задавайте одночасно `gateway.auth.token` і `gateway.auth.mode: "trusted-proxy"`.
- [ ] **Локальний fallback пароля приватний**: якщо ви налаштовуєте `gateway.auth.password` для внутрішніх прямих викликів, тримайте порт Gateway за firewall, щоб віддалені клієнти не через proxy не могли звернутися до нього напряму.

## Аудит безпеки

`openclaw security audit` позначить trusted-proxy auth знахідкою з **критичною** серйозністю. Це навмисно — нагадування, що ви делегуєте безпеку налаштуванню свого proxy.

Аудит перевіряє:

- Базове попередження/критичне нагадування `gateway.trusted_proxy_auth`
- Відсутню конфігурацію `trustedProxies`
- Відсутню конфігурацію `userHeader`
- Порожній `allowUsers` (дозволяє будь-якого автентифікованого користувача)
- Увімкнений `allowLoopback` для proxy-джерел на тому самому хості
- Wildcard або відсутню політику браузерного origin на відкритих поверхнях Control UI

## Усунення несправностей

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    Запит надійшов не з IP у `gateway.trustedProxies`. Перевірте:

    - Чи правильний IP proxy? (IP контейнерів Docker можуть змінюватися.)
    - Чи є load balancer перед вашим proxy?
    - Використайте `docker inspect` або `kubectl get pods -o wide`, щоб знайти фактичні IP-адреси.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw відхилив trusted-proxy-запит із loopback-джерела.

    Перевірте:

    - Чи proxy підключається з `127.0.0.1` / `::1`?
    - Чи намагаєтеся ви використати trusted-proxy auth із loopback reverse proxy на тому самому хості?

    Виправлення:

    - Надавайте перевагу token/password auth для внутрішніх клієнтів на тому самому хості, які не проходять через proxy, або
    - Маршрутизуйте через trusted proxy address не з loopback і тримайте цю IP-адресу в `gateway.trustedProxies`, або
    - Для навмисного reverse proxy на тому самому хості задайте `gateway.auth.trustedProxy.allowLoopback = true`, тримайте loopback-адресу в `gateway.trustedProxies` і переконайтеся, що proxy прибирає або перезаписує заголовки ідентичності.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    Заголовок користувача був порожній або відсутній. Перевірте:

    - Чи ваш proxy налаштований передавати заголовки ідентичності?
    - Чи правильна назва заголовка? (без урахування регістру, але написання важливе)
    - Чи користувач справді автентифікований на proxy?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Обов’язкового заголовка не було. Перевірте:

    - Конфігурацію proxy для цих конкретних заголовків.
    - Чи заголовки не прибираються десь у ланцюжку.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    Користувач автентифікований, але його немає в `allowUsers`. Або додайте його, або видаліть allowlist.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Trusted-proxy auth успішна, але браузерний заголовок `Origin` не пройшов перевірки origin Control UI.

    Перевірте:

    - `gateway.controlUi.allowedOrigins` містить точний браузерний origin.
    - Ви не покладаєтеся на wildcard origins, якщо не хочете навмисно дозволити все.
    - Якщо ви навмисно використовуєте fallback-режим Host-заголовка, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` задано свідомо.

  </Accordion>
  <Accordion title="Connection succeeds but methods report missing scope">
    WebSocket підключається, але `chat.history`, `sessions.list` або
    `models.list` завершується помилкою `missing scope: operator.read`.

    Типові причини:

    - Сеанс Control UI без пристрою: trusted-proxy auth може допустити WebSocket-з’єднання без ідентичності пристрою, але OpenClaw за задумом очищає scopes у сеансах без пристрою.
    - Custom backend client: `gateway.controlUi.dangerouslyDisableDeviceAuth` має scope Control UI і не надає scopes довільним backend або CLI-подібним WebSocket-клієнтам.
    - Надто вузький `x-openclaw-scopes`: якщо ваш proxy вставляє цей заголовок у WebSocket upgrade-запит Control UI, scopes сеансу обмежуються цим набором. Порожнє значення заголовка не дає жодних scopes.

    Виправлення:

    - Для Control UI використовуйте HTTPS, щоб браузер міг згенерувати ідентичність пристрою та завершити pairing.
    - Для custom automation використовуйте device identity/pairing, зарезервований direct-local шлях backend helper `gateway-client` або [admin HTTP RPC](/uk/plugins/admin-http-rpc).
    - Використовуйте `gateway.controlUi.dangerouslyDisableDeviceAuth: true` лише як тимчасовий break-glass шлях Control UI.

  </Accordion>
  <Accordion title="WebSocket still failing">
    Переконайтеся, що ваш proxy:

    - Підтримує WebSocket upgrades (`Upgrade: websocket`, `Connection: upgrade`).
    - Передає заголовки ідентичності у WebSocket upgrade-запитах (не лише HTTP).
    - Не має окремого auth path для WebSocket-з’єднань.

  </Accordion>
</AccordionGroup>

## Міграція з token auth

Якщо ви переходите з token auth на trusted-proxy:

<Steps>
  <Step title="Configure the proxy">
    Налаштуйте proxy для автентифікації користувачів і передавання заголовків.
  </Step>
  <Step title="Test the proxy independently">
    Протестуйте налаштування proxy незалежно (curl із заголовками).
  </Step>
  <Step title="Update OpenClaw config">
    Оновіть конфігурацію OpenClaw з trusted-proxy auth.
  </Step>
  <Step title="Restart the Gateway">
    Перезапустіть Gateway.
  </Step>
  <Step title="Test WebSocket">
    Протестуйте WebSocket-з’єднання з Control UI.
  </Step>
  <Step title="Audit">
    Запустіть `openclaw security audit` і перегляньте знахідки.
  </Step>
</Steps>

## Пов’язане

- [Конфігурація](/uk/gateway/configuration) — довідник конфігурації
- [Віддалений доступ](/uk/gateway/remote) — інші шаблони віддаленого доступу
- [Безпека](/uk/gateway/security) — повний посібник із безпеки
- [Tailscale](/uk/gateway/tailscale) — простіша альтернатива для доступу лише з tailnet

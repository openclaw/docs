---
read_when:
    - Запуск OpenClaw за проксі з підтримкою ідентифікації
    - Налаштування Pomerium, Caddy або nginx з OAuth перед OpenClaw
    - Виправлення помилок WebSocket 1008 «неавторизовано» у конфігураціях зі зворотним проксі
    - Визначення місця налаштування HSTS та інших заголовків HTTP для посилення безпеки
sidebarTitle: Trusted proxy auth
summary: Делегуйте автентифікацію Gateway довіреному зворотному проксі (Pomerium, Caddy, nginx + OAuth)
title: Автентифікація довіреного проксі
x-i18n:
    generated_at: "2026-04-26T08:15:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64e0f4dee942aedec548135f0408e7773e7b498f8262af13a4d0eff262cae646
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

<Warning>
**Функція, чутлива до безпеки.** У цьому режимі автентифікація повністю делегується вашому зворотному проксі. Неправильна конфігурація може відкрити ваш Gateway для несанкціонованого доступу. Уважно прочитайте цю сторінку перед увімкненням.
</Warning>

## Коли використовувати

Використовуйте режим автентифікації `trusted-proxy`, коли:

- Ви запускаєте OpenClaw за **проксі з підтримкою ідентифікації** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth).
- Ваш проксі виконує всю автентифікацію та передає ідентичність користувача через заголовки.
- Ви працюєте в середовищі Kubernetes або контейнерному середовищі, де проксі є єдиним шляхом до Gateway.
- Ви стикаєтеся з помилками WebSocket `1008 unauthorized`, тому що браузери не можуть передавати токени в корисному навантаженні WS.

## Коли НЕ використовувати

- Якщо ваш проксі не автентифікує користувачів (лише завершує TLS або є балансувальником навантаження).
- Якщо існує будь-який шлях до Gateway в обхід проксі (дірки у фаєрволі, доступ із внутрішньої мережі).
- Якщо ви не впевнені, що ваш проксі правильно видаляє/перезаписує переслані заголовки.
- Якщо вам потрібен лише персональний доступ для одного користувача (розгляньте Tailscale Serve + loopback для простішого налаштування).

## Як це працює

<Steps>
  <Step title="Проксі автентифікує користувача">
    Ваш зворотний проксі автентифікує користувачів (OAuth, OIDC, SAML тощо).
  </Step>
  <Step title="Проксі додає заголовок ідентичності">
    Проксі додає заголовок з ідентичністю автентифікованого користувача (наприклад, `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Gateway перевіряє довірене джерело">
    OpenClaw перевіряє, що запит надійшов від **довіреної IP-адреси проксі** (налаштованої в `gateway.trustedProxies`).
  </Step>
  <Step title="Gateway витягує ідентичність">
    OpenClaw витягує ідентичність користувача з налаштованого заголовка.
  </Step>
  <Step title="Авторизація">
    Якщо все гаразд, запит авторизується.
  </Step>
</Steps>

## Поведінка сполучення Control UI

Коли `gateway.auth.mode = "trusted-proxy"` активний і запит проходить перевірки trusted-proxy, сеанси WebSocket Control UI можуть підключатися без ідентичності сполучення пристрою.

Наслідки:

- Сполучення більше не є основним бар’єром для доступу до Control UI в цьому режимі.
- Політика автентифікації вашого зворотного проксі та `allowUsers` стають фактичним контролем доступу.
- Тримайте вхідний доступ до gateway заблокованим лише для IP-адрес довіреного проксі (`gateway.trustedProxies` + фаєрвол).

## Конфігурація

```json5
{
  gateway: {
    // Автентифікація trusted-proxy очікує запити з не-loopback джерела довіреного проксі
    bind: "lan",

    // КРИТИЧНО: Додавайте тут лише IP-адреси вашого проксі
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Заголовок, що містить ідентичність автентифікованого користувача (обов’язково)
        userHeader: "x-forwarded-user",

        // Необов’язково: заголовки, які ОБОВ’ЯЗКОВО мають бути присутні (перевірка проксі)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Необов’язково: обмеження до конкретних користувачів (порожньо = дозволити всіх)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

<Warning>
**Важливі правила під час виконання**

- Автентифікація trusted-proxy відхиляє запити з loopback-джерела (`127.0.0.1`, `::1`, loopback CIDR).
- Зворотні проксі loopback на тому самому хості **не** задовольняють вимоги автентифікації trusted-proxy.
- Для конфігурацій із loopback-проксі на тому самому хості використовуйте натомість автентифікацію за токеном/паролем або маршрутизуйте через не-loopback адресу довіреного проксі, яку OpenClaw може перевірити.
- Розгортання Control UI поза loopback усе одно потребують явного `gateway.controlUi.allowedOrigins`.
- **Докази з пересланих заголовків мають пріоритет над loopback-локальністю.** Якщо запит надходить через loopback, але містить заголовки `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`, що вказують на не-локальне джерело, ці докази спростовують твердження про loopback-локальність. Такий запит вважається віддаленим для сполучення, автентифікації trusted-proxy та контролю ідентичності пристрою в Control UI. Це запобігає тому, щоб loopback-проксі на тому самому хості «відмивав» ідентичність із пересланих заголовків у trusted-proxy автентифікацію.
  </Warning>

### Довідник конфігурації

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Масив IP-адрес проксі, яким можна довіряти. Запити з інших IP-адрес відхиляються.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  Має бути `"trusted-proxy"`.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Назва заголовка, що містить ідентичність автентифікованого користувача.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  Додаткові заголовки, які мають бути присутні, щоб запит вважався довіреним.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Список дозволених ідентичностей користувачів. Порожньо означає дозволити всіх автентифікованих користувачів.
</ParamField>

## Завершення TLS і HSTS

Використовуйте одну точку завершення TLS і застосовуйте HSTS саме там.

<Tabs>
  <Tab title="Завершення TLS на проксі (рекомендовано)">
    Коли ваш зворотний проксі обробляє HTTPS для `https://control.example.com`, налаштуйте `Strict-Transport-Security` на проксі для цього домену.

    - Добре підходить для розгортань, доступних з інтернету.
    - Зберігає сертифікати та політику посилення безпеки HTTP в одному місці.
    - OpenClaw може залишатися на loopback HTTP за проксі.

    Приклад значення заголовка:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Завершення TLS на Gateway">
    Якщо сам OpenClaw напряму обслуговує HTTPS (без проксі, що завершує TLS), налаштуйте:

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

### Рекомендації щодо поетапного впровадження

- Спочатку використовуйте короткий max age (наприклад, `max-age=300`) під час перевірки трафіку.
- Збільшуйте до довготривалих значень (наприклад, `max-age=31536000`) лише після того, як будете повністю впевнені.
- Додавайте `includeSubDomains` лише якщо кожен піддомен готовий до HTTPS.
- Використовуйте preload лише якщо ви навмисно виконуєте вимоги preload для всього набору ваших доменів.
- Локальна розробка лише на loopback не отримує переваг від HSTS.

## Приклади налаштування проксі

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium передає ідентичність у `x-pomerium-claim-email` (або інші заголовки claims) і JWT у `x-pomerium-jwt-assertion`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // IP-адреса Pomerium
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
        trustedProxies: ["10.0.0.1"], // IP-адреса Caddy/sidecar proxy
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
        trustedProxies: ["10.0.0.1"], // IP-адреса nginx/oauth2-proxy
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
  <Accordion title="Traefik з forward auth">
    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["172.17.0.1"], // IP-адреса контейнера Traefik
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

OpenClaw відхиляє неоднозначні конфігурації, у яких одночасно активні `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`) і режим `trusted-proxy`. Змішані конфігурації токенів можуть призвести до того, що loopback-запити мовчки автентифікуватимуться неправильним шляхом автентифікації.

Якщо під час запуску ви бачите помилку `mixed_trusted_proxy_token`:

- Видаліть спільний токен, якщо використовуєте режим trusted-proxy, або
- Змініть `gateway.auth.mode` на `"token"`, якщо ви маєте намір використовувати автентифікацію на основі токена.

Loopback trusted-proxy автентифікація також працює за принципом fail closed: виклики з того самого хоста мають передавати налаштовані заголовки ідентичності через довірений проксі, а не автентифікуватися мовчки.

## Заголовок областей операторів

Автентифікація trusted-proxy — це HTTP-режим, **що несе ідентичність**, тому виклики можуть за бажанням оголошувати області операторів через `x-openclaw-scopes`.

Приклади:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Поведінка:

- Коли заголовок присутній, OpenClaw враховує оголошений набір областей.
- Коли заголовок присутній, але порожній, запит оголошує **жодних** областей операторів.
- Коли заголовок відсутній, звичайні HTTP API, що несуть ідентичність, повертаються до стандартного набору областей операторів за замовчуванням.
- **HTTP-маршрути Plugin** з gateway-auth за замовчуванням вужчі: коли `x-openclaw-scopes` відсутній, їхня область виконання повертається до `operator.write`.
- HTTP-запити з браузера все одно мають проходити `gateway.controlUi.allowedOrigins` (або навмисний резервний режим Host-заголовка), навіть після успішної trusted-proxy автентифікації.

Практичне правило: надсилайте `x-openclaw-scopes` явно, коли хочете, щоб trusted-proxy запит мав вужчі області, ніж типові значення за замовчуванням, або коли маршруту Plugin з gateway-auth потрібне щось сильніше за область write.

## Контрольний список безпеки

Перш ніж увімкнути автентифікацію trusted-proxy, перевірте:

- [ ] **Проксі є єдиним шляхом**: Порт Gateway захищений фаєрволом від усього, окрім вашого проксі.
- [ ] **trustedProxies мінімальний**: Лише фактичні IP-адреси вашого проксі, а не цілі підмережі.
- [ ] **Немає loopback-джерела проксі**: автентифікація trusted-proxy працює за принципом fail closed для запитів із loopback-джерела.
- [ ] **Проксі видаляє заголовки**: Ваш проксі перезаписує (а не додає) заголовки `x-forwarded-*`, отримані від клієнтів.
- [ ] **Завершення TLS**: Ваш проксі обробляє TLS; користувачі підключаються через HTTPS.
- [ ] **allowedOrigins явний**: Control UI поза loopback використовує явний `gateway.controlUi.allowedOrigins`.
- [ ] **allowUsers налаштовано** (рекомендовано): Обмежуйте доступ відомими користувачами, а не дозволяйте будь-кому, хто пройшов автентифікацію.
- [ ] **Немає змішаної конфігурації токена**: Не налаштовуйте одночасно `gateway.auth.token` і `gateway.auth.mode: "trusted-proxy"`.

## Аудит безпеки

`openclaw security audit` позначить автентифікацію trusted-proxy як проблему з рівнем серйозності **critical**. Це навмисно — це нагадування про те, що ви делегуєте безпеку вашій конфігурації проксі.

Аудит перевіряє:

- Базове попередження/нагадування warning/critical для `gateway.trusted_proxy_auth`
- Відсутня конфігурація `trustedProxies`
- Відсутня конфігурація `userHeader`
- Порожній `allowUsers` (дозволяє будь-якого автентифікованого користувача)
- Політика browser-origin із wildcard або її відсутність на відкритих поверхнях Control UI

## Усунення несправностей

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    Запит не надійшов з IP-адреси, вказаної в `gateway.trustedProxies`. Перевірте:

    - Чи правильна IP-адреса проксі? (IP-адреси контейнерів Docker можуть змінюватися.)
    - Чи є балансувальник навантаження перед вашим проксі?
    - Використайте `docker inspect` або `kubectl get pods -o wide`, щоб знайти фактичні IP-адреси.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw відхилив trusted-proxy запит із loopback-джерела.

    Перевірте:

    - Чи підключається проксі з `127.0.0.1` / `::1`?
    - Чи намагаєтеся ви використовувати trusted-proxy автентифікацію зі зворотним loopback-проксі на тому самому хості?

    Виправлення:

    - Використовуйте автентифікацію за токеном/паролем для конфігурацій із loopback-проксі на тому самому хості, або
    - Маршрутизуйте через не-loopback адресу довіреного проксі та збережіть цю IP-адресу в `gateway.trustedProxies`.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    Заголовок користувача був порожній або відсутній. Перевірте:

    - Чи налаштований ваш проксі на передавання заголовків ідентичності?
    - Чи правильна назва заголовка? (регістр не має значення, але написання має)
    - Чи користувач справді автентифікований на проксі?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Обов’язковий заголовок був відсутній. Перевірте:

    - Конфігурацію вашого проксі для цих конкретних заголовків.
    - Чи не видаляються заголовки десь у ланцюжку.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    Користувач автентифікований, але його немає в `allowUsers`. Або додайте його, або видаліть список дозволених.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Trusted-proxy автентифікація пройшла успішно, але заголовок браузера `Origin` не пройшов перевірки походження Control UI.

    Перевірте:

    - `gateway.controlUi.allowedOrigins` містить точне browser origin.
    - Ви не покладаєтеся на wildcard origins, якщо тільки навмисно не хочете поведінку «дозволити все».
    - Якщо ви навмисно використовуєте резервний режим Host-заголовка, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` налаштовано свідомо.

  </Accordion>
  <Accordion title="WebSocket still failing">
    Переконайтеся, що ваш проксі:

    - Підтримує оновлення WebSocket (`Upgrade: websocket`, `Connection: upgrade`).
    - Передає заголовки ідентичності в запитах на оновлення WebSocket (а не лише для HTTP).
    - Не має окремого шляху автентифікації для з’єднань WebSocket.

  </Accordion>
</AccordionGroup>

## Міграція з автентифікації за токеном

Якщо ви переходите з автентифікації за токеном на trusted-proxy:

<Steps>
  <Step title="Налаштуйте проксі">
    Налаштуйте ваш проксі на автентифікацію користувачів і передавання заголовків.
  </Step>
  <Step title="Окремо протестуйте проксі">
    Окремо протестуйте налаштування проксі (`curl` із заголовками).
  </Step>
  <Step title="Оновіть конфігурацію OpenClaw">
    Оновіть конфігурацію OpenClaw для trusted-proxy автентифікації.
  </Step>
  <Step title="Перезапустіть Gateway">
    Перезапустіть Gateway.
  </Step>
  <Step title="Перевірте WebSocket">
    Перевірте з’єднання WebSocket з Control UI.
  </Step>
  <Step title="Аудит">
    Запустіть `openclaw security audit` і перегляньте результати.
  </Step>
</Steps>

## Пов’язане

- [Конфігурація](/uk/gateway/configuration) — довідник конфігурації
- [Віддалений доступ](/uk/gateway/remote) — інші шаблони віддаленого доступу
- [Безпека](/uk/gateway/security) — повний посібник із безпеки
- [Tailscale](/uk/gateway/tailscale) — простіша альтернатива для доступу лише в межах tailnet

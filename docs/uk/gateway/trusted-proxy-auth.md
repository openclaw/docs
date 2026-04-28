---
read_when:
    - Запуск OpenClaw за identity-aware проксі
    - Налаштування Pomerium, Caddy або nginx з OAuth перед OpenClaw
    - Усунення помилок WebSocket 1008 «несанкціоновано» у конфігураціях зі зворотним проксі
    - Визначення, де встановлювати HSTS та інші заголовки посилення безпеки HTTP
sidebarTitle: Trusted proxy auth
summary: Делегуйте автентифікацію Gateway довіреному зворотному проксі (Pomerium, Caddy, nginx + OAuth)
title: Автентифікація через довірений проксі
x-i18n:
    generated_at: "2026-04-27T22:22:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 863a448f84d1bc5bf2a5a07a894bcc1bb7e724826ba9cec3fa135338af8dd3eb
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

<Warning>
**Функція, чутлива до безпеки.** У цьому режимі автентифікація повністю делегується вашому зворотному проксі. Помилкова конфігурація може відкрити ваш Gateway для несанкціонованого доступу. Уважно прочитайте цю сторінку перед увімкненням.
</Warning>

## Коли використовувати

Використовуйте режим автентифікації `trusted-proxy`, коли:

- Ви запускаєте OpenClaw за **identity-aware проксі** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth).
- Ваш проксі обробляє всю автентифікацію та передає ідентичність користувача через заголовки.
- Ви перебуваєте в середовищі Kubernetes або контейнерному середовищі, де проксі є єдиним шляхом до Gateway.
- Ви стикаєтеся з помилками WebSocket `1008 unauthorized`, тому що браузери не можуть передавати токени в WS payload.

## Коли НЕ слід використовувати

- Якщо ваш проксі не автентифікує користувачів (лише завершує TLS або є балансувальником навантаження).
- Якщо існує будь-який шлях до Gateway в обхід проксі (дірки у фаєрволі, доступ із внутрішньої мережі).
- Якщо ви не впевнені, що ваш проксі правильно видаляє/перезаписує forwarded headers.
- Якщо вам потрібен лише персональний доступ для одного користувача (для простішого налаштування розгляньте Tailscale Serve + local loopback).

## Як це працює

<Steps>
  <Step title="Проксі автентифікує користувача">
    Ваш зворотний проксі автентифікує користувачів (OAuth, OIDC, SAML тощо).
  </Step>
  <Step title="Проксі додає заголовок ідентичності">
    Проксі додає заголовок з ідентичністю автентифікованого користувача (наприклад, `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Gateway перевіряє довірене джерело">
    OpenClaw перевіряє, що запит надійшов із **довіреної IP-адреси проксі** (налаштованої в `gateway.trustedProxies`).
  </Step>
  <Step title="Gateway витягує ідентичність">
    OpenClaw витягує ідентичність користувача з налаштованого заголовка.
  </Step>
  <Step title="Авторизація">
    Якщо все перевірено успішно, запит авторизується.
  </Step>
</Steps>

## Поведінка сполучення з Control UI

Коли `gateway.auth.mode = "trusted-proxy"` активний і запит проходить перевірки trusted-proxy, сеанси WebSocket Control UI можуть підключатися без ідентичності сполучення пристрою.

Наслідки:

- Сполучення більше не є основним бар’єром доступу до Control UI в цьому режимі.
- Політика автентифікації вашого зворотного проксі та `allowUsers` стають фактичним контролем доступу.
- Тримайте вхідний доступ до Gateway заблокованим лише для довірених IP-адрес проксі (`gateway.trustedProxies` + фаєрвол).

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

        // Необов’язково: заголовки, які ОБОВ’ЯЗКОВО мають бути присутніми (перевірка проксі)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Необов’язково: обмежити конкретними користувачами (порожньо = дозволити всіх)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

<Warning>
**Важливі правила часу виконання**

- Автентифікація trusted-proxy відхиляє запити з loopback-джерела (`127.0.0.1`, `::1`, loopback CIDR).
- Зворотні проксі на loopback на тому самому хості **не** відповідають вимогам trusted-proxy auth.
- Для конфігурацій проксі на loopback на тому самому хості натомість використовуйте автентифікацію токеном/паролем або маршрутизуйте через не-loopback адресу довіреного проксі, яку OpenClaw може перевірити.
- Для не-loopback розгортань Control UI усе одно потрібен явний `gateway.controlUi.allowedOrigins`.
- **Докази через forwarded headers мають пріоритет над loopback-локальністю.** Якщо запит надходить через loopback, але містить заголовки `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`, що вказують на нелокальне джерело, ці докази скасовують твердження про loopback-локальність. Запит вважається віддаленим для сполучення, trusted-proxy auth і контролю ідентичності пристрою в Control UI. Це запобігає тому, щоб проксі на loopback на тому самому хості «відмивав» ідентичність із forwarded headers у trusted-proxy auth.
</Warning>

### Довідник із конфігурації

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Масив IP-адрес проксі, яким слід довіряти. Запити з інших IP-адрес відхиляються.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  Має бути `"trusted-proxy"`.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Назва заголовка, що містить ідентичність автентифікованого користувача.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  Додаткові заголовки, які мають бути присутніми, щоб запит вважався довіреним.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Список дозволених ідентичностей користувачів. Порожнє значення означає дозвіл для всіх автентифікованих користувачів.
</ParamField>

## Завершення TLS і HSTS

Використовуйте одну точку завершення TLS і застосовуйте HSTS саме там.

<Tabs>
  <Tab title="Завершення TLS на проксі (рекомендовано)">
    Коли ваш зворотний проксі обробляє HTTPS для `https://control.example.com`, встановіть `Strict-Transport-Security` на проксі для цього домену.

    - Добре підходить для розгортань, доступних з інтернету.
    - Зберігає сертифікати та політику посилення безпеки HTTP в одному місці.
    - OpenClaw може залишатися на loopback HTTP за проксі.

    Приклад значення заголовка:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Завершення TLS на Gateway">
    Якщо OpenClaw сам безпосередньо обслуговує HTTPS (без проксі, що завершує TLS), установіть:

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

### Рекомендації щодо розгортання

- Спочатку використовуйте короткий max age (наприклад, `max-age=300`) під час перевірки трафіку.
- Переходьте до довгострокових значень (наприклад, `max-age=31536000`) лише після того, як матимете високу впевненість.
- Додавайте `includeSubDomains` лише якщо кожен піддомен готовий до HTTPS.
- Використовуйте preload лише якщо ви навмисно виконуєте вимоги preload для всього набору ваших доменів.
- Для суто локальної розробки лише на loopback HSTS не дає переваг.

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
    Caddy з плагіном `caddy-security` може автентифікувати користувачів і передавати заголовки ідентичності.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // IP-адреса Caddy/sidecar-проксі
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

OpenClaw відхиляє неоднозначні конфігурації, у яких одночасно активні і `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`), і режим `trusted-proxy`. Змішані конфігурації токенів можуть призводити до того, що loopback-запити тихо автентифікуються неправильним шляхом автентифікації.

Якщо під час запуску ви бачите помилку `mixed_trusted_proxy_token`:

- Видаліть спільний токен при використанні режиму trusted-proxy, або
- Перемкніть `gateway.auth.mode` на `"token"`, якщо ви маєте намір використовувати автентифікацію на основі токена.

Заголовки ідентичності trusted-proxy для loopback усе одно відмовляють у закритому режимі: виклики з того самого хоста не автентифікуються непомітно як користувачі проксі. Внутрішні виклики OpenClaw, які обходять проксі, натомість можуть автентифікуватися через `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. Резервний перехід на токен навмисно не підтримується в режимі trusted-proxy.

## Заголовок областей оператора

Автентифікація trusted-proxy — це HTTP-режим, **що несе ідентичність**, тому викликачі за бажанням можуть оголошувати області оператора через `x-openclaw-scopes`.

Приклади:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Поведінка:

- Коли заголовок присутній, OpenClaw враховує оголошений набір областей.
- Коли заголовок присутній, але порожній, запит не оголошує **жодних** областей оператора.
- Коли заголовок відсутній, звичайні HTTP API, що несуть ідентичність, повертаються до стандартного набору областей оператора за замовчуванням.
- **HTTP-маршрути Plugin** з автентифікацією Gateway за замовчуванням вужчі: коли `x-openclaw-scopes` відсутній, їхня область часу виконання повертається до `operator.write`.
- HTTP-запити з браузера все одно мають пройти `gateway.controlUi.allowedOrigins` (або навмисний резервний режим заголовка Host) навіть після успішної trusted-proxy auth.

Практичне правило: надсилайте `x-openclaw-scopes` явно, коли хочете, щоб trusted-proxy запит був вужчим за значення за замовчуванням, або коли маршруту plugin з автентифікацією Gateway потрібне щось сильніше за область write.

## Контрольний список безпеки

Перш ніж увімкнути trusted-proxy auth, переконайтеся, що:

- [ ] **Проксі — єдиний шлях**: Порт Gateway закритий фаєрволом для всіх, окрім вашого проксі.
- [ ] **trustedProxies мінімальний**: Лише фактичні IP-адреси вашого проксі, а не цілі підмережі.
- [ ] **Немає loopback-джерела проксі**: trusted-proxy auth відмовляє в закритому режимі для запитів із loopback-джерела.
- [ ] **Проксі очищує заголовки**: Ваш проксі перезаписує (а не додає) заголовки `x-forwarded-*`, що надходять від клієнтів.
- [ ] **Завершення TLS**: Ваш проксі обробляє TLS; користувачі підключаються через HTTPS.
- [ ] **allowedOrigins задано явно**: Для не-loopback Control UI використовується явний `gateway.controlUi.allowedOrigins`.
- [ ] **allowUsers задано** (рекомендовано): Обмежте доступ відомими користувачами, а не дозволяйте його будь-кому, хто автентифікувався.
- [ ] **Немає змішаної конфігурації токенів**: Не встановлюйте одночасно `gateway.auth.token` і `gateway.auth.mode: "trusted-proxy"`.
- [ ] **Локальний резервний пароль є приватним**: Якщо ви налаштовуєте `gateway.auth.password` для внутрішніх прямих викликачів, тримайте порт Gateway закритим фаєрволом, щоб віддалені клієнти не через проксі не могли напряму до нього підключитися.

## Аудит безпеки

`openclaw security audit` позначить автентифікацію trusted-proxy як проблему з рівнем серйозності **critical**. Це зроблено навмисно — як нагадування, що ви делегуєте безпеку конфігурації свого проксі.

Аудит перевіряє:

- Базове попередження/критичне нагадування `gateway.trusted_proxy_auth`
- Відсутню конфігурацію `trustedProxies`
- Відсутню конфігурацію `userHeader`
- Порожній `allowUsers` (дозволяє будь-якого автентифікованого користувача)
- Політику browser-origin із wildcard або її відсутність на відкритих поверхнях Control UI

## Усунення несправностей

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    Запит надійшов не з IP-адреси в `gateway.trustedProxies`. Перевірте:

    - Чи правильна IP-адреса проксі? (IP-адреси контейнерів Docker можуть змінюватися.)
    - Чи є балансувальник навантаження перед вашим проксі?
    - Використайте `docker inspect` або `kubectl get pods -o wide`, щоб знайти фактичні IP-адреси.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw відхилив trusted-proxy запит із loopback-джерела.

    Перевірте:

    - Чи підключається проксі з `127.0.0.1` / `::1`?
    - Чи намагаєтеся ви використовувати trusted-proxy auth зі зворотним проксі на loopback на тому самому хості?

    Виправлення:

    - Використовуйте автентифікацію токеном/паролем для конфігурацій проксі на loopback на тому самому хості, або
    - Маршрутизуйте через не-loopback адресу довіреного проксі та тримайте цю IP-адресу в `gateway.trustedProxies`.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    Заголовок користувача був порожнім або відсутнім. Перевірте:

    - Чи налаштовано ваш проксі на передавання заголовків ідентичності?
    - Чи правильна назва заголовка? (регістр не має значення, але написання має)
    - Чи користувач справді автентифікований на проксі?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Обов’язковий заголовок був відсутній. Перевірте:

    - Конфігурацію вашого проксі для цих конкретних заголовків.
    - Чи не видаляються заголовки десь у ланцюжку.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    Користувач автентифікований, але його немає в `allowUsers`. Або додайте його, або приберіть список дозволених.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Автентифікація trusted-proxy пройшла успішно, але заголовок браузера `Origin` не пройшов перевірки походження Control UI.

    Перевірте:

    - `gateway.controlUi.allowedOrigins` містить точне browser origin.
    - Ви не покладаєтеся на wildcard origins, якщо тільки свідомо не хочете поведінку «дозволити все».
    - Якщо ви навмисно використовуєте резервний режим заголовка Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` задано свідомо.

  </Accordion>
  <Accordion title="WebSocket все ще не працює">
    Переконайтеся, що ваш проксі:

    - Підтримує оновлення WebSocket (`Upgrade: websocket`, `Connection: upgrade`).
    - Передає заголовки ідентичності в запитах оновлення WebSocket (а не лише HTTP).
    - Не має окремого шляху автентифікації для підключень WebSocket.

  </Accordion>
</AccordionGroup>

## Міграція з автентифікації токеном

Якщо ви переходите з автентифікації токеном на trusted-proxy:

<Steps>
  <Step title="Налаштуйте проксі">
    Налаштуйте свій проксі на автентифікацію користувачів і передавання заголовків.
  </Step>
  <Step title="Окремо протестуйте проксі">
    Окремо протестуйте налаштування проксі (`curl` із заголовками).
  </Step>
  <Step title="Оновіть конфігурацію OpenClaw">
    Оновіть конфігурацію OpenClaw для trusted-proxy auth.
  </Step>
  <Step title="Перезапустіть Gateway">
    Перезапустіть Gateway.
  </Step>
  <Step title="Протестуйте WebSocket">
    Протестуйте WebSocket-підключення з Control UI.
  </Step>
  <Step title="Аудит">
    Запустіть `openclaw security audit` і перегляньте результати.
  </Step>
</Steps>

## Пов’язане

- [Конфігурація](/uk/gateway/configuration) — довідник із конфігурації
- [Віддалений доступ](/uk/gateway/remote) — інші шаблони віддаленого доступу
- [Безпека](/uk/gateway/security) — повний посібник із безпеки
- [Tailscale](/uk/gateway/tailscale) — простіша альтернатива для доступу лише в tailnet

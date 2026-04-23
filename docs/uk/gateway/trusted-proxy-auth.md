---
read_when:
    - Запуск OpenClaw за identity-aware проксі
    - Налаштування Pomerium, Caddy або nginx з OAuth перед OpenClaw
    - Усунення помилок WebSocket 1008 unauthorized у конфігураціях зі зворотним проксі
    - Визначення місця встановлення HSTS та інших заголовків посилення HTTP-безпеки
summary: Делегувати автентифікацію gateway довіреному зворотному проксі (Pomerium, Caddy, nginx + OAuth)
title: Автентифікація через довірений проксі
x-i18n:
    generated_at: "2026-04-23T20:55:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: af406f218fb91c5ae2fed04921670bfc4cd3d06f51b08eec91cddde4521bf771
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

> ⚠️ **Функція, чутлива до безпеки.** Цей режим повністю делегує автентифікацію вашому зворотному проксі. Неправильна конфігурація може відкрити ваш Gateway для неавторизованого доступу. Уважно прочитайте цю сторінку перед увімкненням.

## Коли використовувати

Використовуйте режим автентифікації `trusted-proxy`, якщо:

- Ви запускаєте OpenClaw за **identity-aware proxy** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth)
- Ваш проксі обробляє всю автентифікацію і передає identity користувача через заголовки
- Ви працюєте в середовищі Kubernetes або контейнерів, де проксі є єдиним шляхом до Gateway
- Ви отримуєте помилки WebSocket `1008 unauthorized`, тому що браузери не можуть передавати токени в payload WS

## Коли НЕ використовувати

- Якщо ваш проксі не автентифікує користувачів (лише термінатор TLS або балансувальник навантаження)
- Якщо існує будь-який шлях до Gateway в обхід проксі (дірки у фаєрволі, доступ із внутрішньої мережі)
- Якщо ви не впевнені, що ваш проксі правильно видаляє/перезаписує forwarded headers
- Якщо вам потрібен лише персональний однокористувацький доступ (розгляньте Tailscale Serve + local loopback для простішого налаштування)

## Як це працює

1. Ваш зворотний проксі автентифікує користувачів (OAuth, OIDC, SAML тощо)
2. Проксі додає заголовок з identity автентифікованого користувача (наприклад, `x-forwarded-user: nick@example.com`)
3. OpenClaw перевіряє, що запит надійшов від **довіреної IP-адреси проксі** (налаштовується в `gateway.trustedProxies`)
4. OpenClaw витягує identity користувача з налаштованого заголовка
5. Якщо все збігається, запит авторизується

## Поведінка pairing у Control UI

Коли активний `gateway.auth.mode = "trusted-proxy"` і запит проходить
перевірки trusted-proxy, WebSocket-сесії Control UI можуть підключатися без
identity pairing пристрою.

Наслідки:

- Pairing більше не є основним шлюзом доступу для Control UI у цьому режимі.
- Ваша політика автентифікації зворотного проксі та `allowUsers` стають ефективним контролем доступу.
- Тримайте вхід до gateway заблокованим лише для IP-адрес довірених проксі (`gateway.trustedProxies` + фаєрвол).

## Конфігурація

```json5
{
  gateway: {
    // Trusted-proxy auth expects requests from a non-loopback trusted proxy source
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
      },
    },
  },
}
```

Важливе правило під час runtime:

- Автентифікація trusted-proxy відхиляє запити з loopback-джерела (`127.0.0.1`, `::1`, loopback CIDR).
- Зворотні проксі на тому самому хості через loopback **не** задовольняють trusted-proxy auth.
- Для конфігурацій із loopback-проксі на тому самому хості використовуйте натомість token/password auth або маршрутизуйте через не-loopback адресу довіреного проксі, яку OpenClaw може перевірити.
- Для розгортань Control UI не через loopback усе одно потрібен явний `gateway.controlUi.allowedOrigins`.
- **Докази forwarded-header мають пріоритет над локальністю loopback.** Якщо запит надходить через loopback, але містить заголовки `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`, що вказують на нелокальне джерело, такі докази скасовують припущення про локальність loopback. Запит розглядається як віддалений для pairing, trusted-proxy auth і шлюзу identity пристрою Control UI. Це не дозволяє loopback-проксі на тому самому хості «відмивати» identity з forwarded-header у trusted-proxy auth.

### Довідник конфігурації

| Поле                                        | Обов’язково | Опис                                                                         |
| ------------------------------------------- | ----------- | ---------------------------------------------------------------------------- |
| `gateway.trustedProxies`                    | Так         | Масив IP-адрес проксі, яким довіряють. Запити з інших IP відхиляються.       |
| `gateway.auth.mode`                         | Так         | Має бути `"trusted-proxy"`                                                   |
| `gateway.auth.trustedProxy.userHeader`      | Так         | Ім’я заголовка, що містить identity автентифікованого користувача            |
| `gateway.auth.trustedProxy.requiredHeaders` | Ні          | Додаткові заголовки, які мають бути присутні, щоб запит вважався довіреним   |
| `gateway.auth.trustedProxy.allowUsers`      | Ні          | Allowlist identity користувачів. Порожньо означає дозволити всіх автентифікованих користувачів |

## Завершення TLS і HSTS

Використовуйте одну точку завершення TLS і застосовуйте HSTS там.

### Рекомендований шаблон: завершення TLS на проксі

Коли ваш зворотний проксі обробляє HTTPS для `https://control.example.com`, задайте
`Strict-Transport-Security` на проксі для цього домену.

- Добре підходить для розгортань, доступних з інтернету.
- Зберігає сертифікати й політику посилення HTTP в одному місці.
- OpenClaw може залишатися на loopback HTTP за проксі.

Приклад значення заголовка:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Завершення TLS на Gateway

Якщо сам OpenClaw напряму обслуговує HTTPS (без проксі, що завершує TLS), задайте:

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

### Рекомендації щодо поетапного впровадження

- Спочатку використовуйте малий max age (наприклад, `max-age=300`), поки перевіряєте трафік.
- Збільшуйте до довгоживучих значень (наприклад, `max-age=31536000`) лише після достатньої впевненості.
- Додавайте `includeSubDomains` лише якщо кожен піддомен готовий до HTTPS.
- Використовуйте preload лише якщо ви свідомо виконуєте вимоги preload для всього набору доменів.
- Локальна розробка лише через loopback не отримує користі від HSTS.

## Приклади налаштування проксі

### Pomerium

Pomerium передає identity в `x-pomerium-claim-email` (або інші claim-заголовки) і JWT в `x-pomerium-jwt-assertion`.

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

### Caddy з OAuth

Caddy з Plugin `caddy-security` може автентифікувати користувачів і передавати заголовки identity.

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

### nginx + oauth2-proxy

oauth2-proxy автентифікує користувачів і передає identity в `x-auth-request-email`.

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

### Traefik з Forward Auth

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

## Змішана конфігурація токенів

OpenClaw відхиляє неоднозначні конфігурації, у яких одночасно активні `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`) і режим `trusted-proxy`. Змішані конфігурації токенів можуть призвести до того, що loopback-запити тихо автентифікуються через неправильний шлях автентифікації.

Якщо під час запуску ви бачите помилку `mixed_trusted_proxy_token`:

- Видаліть спільний токен під час використання режиму trusted-proxy, або
- Перемкніть `gateway.auth.mode` на `"token"`, якщо ви справді хочете автентифікацію на основі токена.

Автентифікація trusted-proxy через loopback також завершується безпечною відмовою: виклики з того самого хоста мають надсилати налаштовані заголовки identity через довірений проксі, а не автентифікуватися мовчки.

## Заголовок операторських scope

Автентифікація trusted-proxy — це HTTP-режим, що **переносить identity**, тому виклики
можуть необов’язково оголошувати operator scope через `x-openclaw-scopes`.

Приклади:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Поведінка:

- Коли заголовок присутній, OpenClaw дотримується оголошеного набору scope.
- Коли заголовок присутній, але порожній, запит оголошує **відсутність** operator scope.
- Коли заголовок відсутній, звичайні HTTP API, що переносять identity, повертаються до стандартного типового набору operator scope.
- **Plugin HTTP routes** з gateway-auth типово вужчі: коли `x-openclaw-scopes` відсутній, їхній runtime scope повертається до `operator.write`.
- HTTP-запити з браузера все одно мають пройти `gateway.controlUi.allowedOrigins` (або навмисний fallback-режим заголовка Host) навіть після успішної trusted-proxy auth.

Практичне правило:

- Явно надсилайте `x-openclaw-scopes`, коли хочете, щоб запит trusted-proxy
  був вужчим за типові значення, або коли gateway-auth Plugin route потребує
  чогось сильнішого за scope write.

## Контрольний список безпеки

Перед увімкненням автентифікації trusted-proxy перевірте:

- [ ] **Проксі — єдиний шлях**: порт Gateway закритий фаєрволом від усього, крім вашого проксі
- [ ] **trustedProxies мінімальний**: лише фактичні IP вашого проксі, а не цілі підмережі
- [ ] **Немає loopback-джерела проксі**: trusted-proxy auth завершується безпечною відмовою для запитів із loopback-джерела
- [ ] **Проксі очищує заголовки**: ваш проксі перезаписує (а не дописує) заголовки `x-forwarded-*`, отримані від клієнтів
- [ ] **Завершення TLS**: ваш проксі обробляє TLS; користувачі підключаються через HTTPS
- [ ] **allowedOrigins задано явно**: для non-loopback Control UI використовується явний `gateway.controlUi.allowedOrigins`
- [ ] **allowUsers задано** (рекомендовано): обмежуйте доступ відомими користувачами замість дозволу будь-кому з автентифікацією
- [ ] **Немає змішаної конфігурації токенів**: не задавайте одночасно `gateway.auth.token` і `gateway.auth.mode: "trusted-proxy"`

## Аудит безпеки

`openclaw security audit` позначатиме trusted-proxy auth як проблему з рівнем **critical**. Це навмисно — нагадування про те, що ви делегуєте безпеку конфігурації свого проксі.

Аудит перевіряє:

- базове попередження/нагадування `gateway.trusted_proxy_auth` рівня warning/critical
- відсутню конфігурацію `trustedProxies`
- відсутню конфігурацію `userHeader`
- порожній `allowUsers` (дозволяє будь-якому автентифікованому користувачу)
- wildcard або відсутню політику browser-origin на відкритих поверхнях Control UI

## Усунення проблем

### `trusted_proxy_untrusted_source`

Запит надійшов не з IP-адреси з `gateway.trustedProxies`. Перевірте:

- Чи правильна IP-адреса проксі? (IP контейнерів Docker можуть змінюватися)
- Чи є балансувальник навантаження перед вашим проксі?
- Використовуйте `docker inspect` або `kubectl get pods -o wide`, щоб знайти реальні IP-адреси

### `trusted_proxy_loopback_source`

OpenClaw відхилив trusted-proxy-запит із loopback-джерела.

Перевірте:

- Чи підключається проксі з `127.0.0.1` / `::1`?
- Чи намагаєтеся ви використовувати trusted-proxy auth із loopback reverse proxy на тому самому хості?

Виправлення:

- Використовуйте token/password auth для конфігурацій із loopback proxy на тому самому хості, або
- Маршрутизуйте через не-loopback адресу довіреного проксі й тримайте цю IP-адресу в `gateway.trustedProxies`.

### `trusted_proxy_user_missing`

Заголовок користувача був порожнім або відсутнім. Перевірте:

- Чи налаштований ваш проксі на передавання заголовків identity?
- Чи правильна назва заголовка? (без урахування регістру, але написання важливе)
- Чи користувач справді автентифікований на проксі?

### `trusted_proxy_missing_header*`

Не було одного з обов’язкових заголовків. Перевірте:

- Конфігурацію вашого проксі для цих конкретних заголовків
- Чи не видаляються заголовки десь у ланцюжку

### `trusted_proxy_user_not_allowed`

Користувач автентифікований, але його немає в `allowUsers`. Або додайте його, або приберіть allowlist.

### `trusted_proxy_origin_not_allowed`

Автентифікація trusted-proxy пройшла успішно, але заголовок браузера `Origin` не пройшов перевірки origin у Control UI.

Перевірте:

- `gateway.controlUi.allowedOrigins` містить точний origin браузера
- Ви не покладаєтеся на wildcard origins, якщо тільки свідомо не хочете дозволити все
- Якщо ви свідомо використовуєте fallback-режим заголовка Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` задано навмисно

### WebSocket усе ще не працює

Переконайтеся, що ваш проксі:

- Підтримує WebSocket upgrade (`Upgrade: websocket`, `Connection: upgrade`)
- Передає заголовки identity у запитах WebSocket upgrade (а не лише HTTP)
- Не має окремого шляху автентифікації для з’єднань WebSocket

## Міграція з token auth

Якщо ви переходите з token auth на trusted-proxy:

1. Налаштуйте проксі на автентифікацію користувачів і передавання заголовків
2. Перевірте конфігурацію проксі незалежно (curl із заголовками)
3. Оновіть конфігурацію OpenClaw для trusted-proxy auth
4. Перезапустіть Gateway
5. Перевірте WebSocket-з’єднання з Control UI
6. Запустіть `openclaw security audit` і перегляньте результати

## Пов’язане

- [Security](/uk/gateway/security) — повний посібник із безпеки
- [Configuration](/uk/gateway/configuration) — довідник конфігурації
- [Remote Access](/uk/gateway/remote) — інші шаблони віддаленого доступу
- [Tailscale](/uk/gateway/tailscale) — простіша альтернатива для доступу лише в межах tailnet

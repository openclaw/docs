---
read_when:
    - Запуск OpenClaw за проксі-сервером з урахуванням ідентичності
    - Налаштування Pomerium, Caddy або nginx з OAuth перед OpenClaw
    - Виправлення помилок WebSocket 1008 «не авторизовано» в конфігураціях зі зворотним проксі
    - Вибір місця для налаштування HSTS та інших заголовків посилення безпеки HTTP
sidebarTitle: Trusted proxy auth
summary: Делегуйте автентифікацію Gateway довіреному зворотному проксі (Pomerium, Caddy, nginx + OAuth)
title: Автентифікація довіреного проксі
x-i18n:
    generated_at: "2026-07-12T13:20:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 612070e4872af23c2ac41b529c8b2fa8513bf18fccc053783f55ad00b44e1a5f
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Функція, критична для безпеки.** У цьому режимі автентифікацію повністю делеговано зворотному проксі. Неправильна конфігурація може відкрити неавторизований доступ до вашого Gateway. Уважно прочитайте цю сторінку перед увімкненням.
</Warning>

## Коли використовувати

- Ви запускаєте OpenClaw за **проксі з підтримкою ідентифікації** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth).
- Ваш проксі виконує всю автентифікацію та передає ідентичність користувача через заголовки.
- Ви працюєте в середовищі Kubernetes або контейнерів, де проксі є єдиним шляхом до Gateway.
- Ви стикаєтеся з помилками WebSocket `1008 unauthorized`, оскільки браузери не можуть передавати токени в корисному навантаженні WS.

## Коли НЕ використовувати

- Ваш проксі не автентифікує користувачів, а лише завершує TLS або балансує навантаження.
- Існує будь-який шлях до Gateway в обхід проксі (прогалини в міжмережевому екрані, доступ із внутрішньої мережі).
- Ви не впевнені, що проксі правильно видаляє або перезаписує переспрямовані заголовки.
- Вам потрібен лише особистий однокористувацький доступ (натомість розгляньте Tailscale Serve + local loopback).

## Як це працює

<Steps>
  <Step title="Проксі автентифікує користувача">
    Ваш зворотний проксі автентифікує користувачів (OAuth, OIDC, SAML тощо).
  </Step>
  <Step title="Проксі додає заголовок ідентичності">
    Проксі додає заголовок з ідентичністю автентифікованого користувача (наприклад, `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="Gateway перевіряє довірене джерело">
    OpenClaw перевіряє, що запит надійшов із **довіреної IP-адреси проксі** (`gateway.trustedProxies`), а не з власної адреси local loopback або локального інтерфейсу Gateway.
  </Step>
  <Step title="Gateway отримує ідентичність">
    OpenClaw зчитує обов’язкові заголовки, а потім ідентичність користувача з налаштованого заголовка.
  </Step>
  <Step title="Авторизація">
    Якщо всі перевірки успішні й користувач проходить перевірку `allowUsers` (якщо її налаштовано), запит авторизується.
  </Step>
</Steps>

## Конфігурація

```json5
{
  gateway: {
    // Автентифікація через довірений проксі за замовчуванням очікує, що вихідна IP-адреса проксі не буде loopback-адресою
    bind: "lan",

    // КРИТИЧНО: додавайте сюди лише IP-адреси свого проксі
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Заголовок, що містить ідентичність автентифікованого користувача (обов’язково)
        userHeader: "x-forwarded-user",

        // Необов’язково: заголовки, які ОБОВ’ЯЗКОВО мають бути наявні (перевірка проксі)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Необов’язково: обмеження конкретними користувачами (порожній список = дозволити всіх)
        allowUsers: ["nick@example.com", "admin@company.org"],

        // Необов’язково: дозволити loopback-проксі на тому самому хості після явної згоди
        allowLoopback: false,
      },
    },
  },
}
```

<Warning>
**Правила середовища виконання в порядку перевірки**

1. Вихідна IP-адреса запиту має відповідати `gateway.trustedProxies` з урахуванням CIDR, інакше запит буде відхилено (`trusted_proxy_untrusted_source`).
2. Запити з джерела local loopback (`127.0.0.1`, `::1`) відхиляються, якщо не встановлено `gateway.auth.trustedProxy.allowLoopback = true` і loopback-адресу також не додано до `trustedProxies` (`trusted_proxy_loopback_source`). Ця перевірка виконується до перевірки заголовків, тому джерело local loopback завершується цією помилкою, навіть якщо обов’язкові заголовки також відсутні.
3. Джерела не з local loopback, які відповідають одній із власних адрес локальних мережевих інтерфейсів хоста Gateway, відхиляються для захисту від підміни (`trusted_proxy_local_interface_source`). Якщо не вдається виконати саме виявлення інтерфейсів, запит також відхиляється (`trusted_proxy_local_interface_check_failed`).
4. `requiredHeaders` і `userHeader` мають бути наявні та не можуть бути порожніми.
5. Якщо `allowUsers` не порожній, він має містити отриманого користувача.

**Дані переспрямованих заголовків мають пріоритет над локальністю local loopback для прямого локального резервного механізму.** Якщо запит надходить через local loopback, але містить заголовок `Forwarded`, будь-який `X-Forwarded-*` або `X-Real-IP`, ці дані унеможливлюють використання прямого локального резервного механізму пароля та перевірки ідентичності пристрою, хоча автентифікація через довірений проксі все одно завершується помилкою через джерело local loopback.

`allowLoopback` надає локальним процесам на хості Gateway такий самий рівень довіри, як і зворотному проксі. Вмикайте його лише тоді, коли Gateway усе ще захищений міжмережевим екраном від прямого віддаленого доступу, а локальний проксі видаляє або перезаписує надані клієнтом заголовки ідентичності.

Внутрішні клієнти Gateway, трафік яких не проходить через зворотний проксі, мають використовувати `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, а не заголовки ідентичності довіреного проксі. Для розгортань Control UI не через local loopback усе ще потрібно явно налаштувати `gateway.controlUi.allowedOrigins`.
</Warning>

### Довідник із конфігурації

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Масив довірених IP-адрес проксі або діапазонів CIDR. Запити з інших IP-адрес відхиляються.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  Значення має бути `"trusted-proxy"`.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Назва заголовка, що містить ідентичність автентифікованого користувача.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  Додаткові заголовки, які мають бути наявні, щоб запит вважався довіреним.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Список дозволених ідентичностей користувачів. Порожній список означає, що дозволено всіх автентифікованих користувачів.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean" default="false">
  Підтримка зворотних проксі через local loopback на тому самому хості, що вмикається явно.
</ParamField>

<Warning>
Вмикайте `allowLoopback` лише тоді, коли локальний зворотний проксі є передбаченою межею довіри. Будь-який локальний процес, здатний підключитися до Gateway, може спробувати надіслати проксі-заголовки ідентичності, тому залишайте прямий доступ до Gateway приватним для хоста та вимагайте заголовки, якими керує проксі, як-от `x-forwarded-proto`, або підписаний заголовок підтвердження, якщо ваш проксі його підтримує.
</Warning>

## Поведінка сполучення Control UI

Коли режим `gateway.auth.mode = "trusted-proxy"` активний і запит проходить перевірки довіреного проксі, сеанси WebSocket Control UI можуть підключатися без ідентичності сполученого пристрою.

Наслідки для областей доступу:

- Сеанси WebSocket Control UI без пристрою підключаються, але за замовчуванням не отримують жодних операторських областей доступу. OpenClaw очищає список запитаних областей доступу до `[]`, щоб сеанс, не прив’язаний до схваленого сполученого пристрою або токена, не міг самостійно оголошувати дозволи.
- Якщо після успішного підключення WebSocket методи завершуються помилкою `missing scope`, використовуйте HTTPS, щоб браузер міг створити ідентичність пристрою та завершити сполучення. Див. [Незахищений HTTP у Control UI](/uk/web/control-ui#insecure-http).
- Лише для аварійного доступу: `gateway.controlUi.dangerouslyDisableDeviceAuth=true` зберігає запитані області доступу навіть без ідентичності пристрою. Це суттєве послаблення безпеки; якнайшвидше скасуйте його. Див. [Незахищений HTTP у Control UI](/uk/web/control-ui#insecure-http).

Обмеження областей доступу зворотним проксі: якщо ваш проксі надсилає `x-openclaw-scopes` у запиті на оновлення з’єднання WebSocket Control UI, OpenClaw обмежує області доступу сеансу перетином запитаних і оголошених областей. Цей заголовок не надає областей доступу, а лише звужує їх набір для сеансу.

Наслідки:

- У цьому режимі сполучення більше не є основним бар’єром доступу до Control UI.
- Політика автентифікації зворотного проксі та `allowUsers` стають фактичними засобами контролю доступу.
- Дозволяйте вхідний трафік Gateway лише з довірених IP-адрес проксі (`gateway.trustedProxies` + міжмережевий екран).

Власні клієнти WebSocket не є сеансами Control UI. `gateway.controlUi.dangerouslyDisableDeviceAuth` не надає областей доступу довільним клієнтам із `client.mode: "backend"` або клієнтам у формі CLI. Власна автоматизація має використовувати ідентичність пристрою та сполучення, зарезервований прямий локальний допоміжний шлях серверної частини `client.id: "gateway-client"` або [Plugin адміністрування HTTP RPC](/uk/plugins/admin-http-rpc), якщо інтерфейс запитів і відповідей HTTP краще відповідає потребам.

## Заголовок операторських областей доступу

Автентифікація через довірений проксі — це режим HTTP, що **містить ідентичність**, тому виклики можуть за бажанням оголошувати операторські області доступу за допомогою `x-openclaw-scopes` у запитах HTTP API.

Примітка: області доступу WebSocket визначаються рукостисканням протоколу Gateway і прив’язкою ідентичності пристрою. У запитах на оновлення з’єднання WebSocket Control UI `x-openclaw-scopes` лише обмежує узгоджені області доступу сеансу, а не надає їх. Див. [Поведінка сполучення Control UI](#control-ui-pairing-behavior).

Приклади:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Поведінка:

- Якщо заголовок наявний, OpenClaw враховує оголошений набір областей доступу.
- Якщо заголовок наявний, але порожній, запит не оголошує **жодних** операторських областей доступу.
- Якщо заголовок відсутній, звичайні HTTP API, що містять ідентичність, використовують стандартний набір операторських областей доступу за замовчуванням (`operator.admin`, `operator.read`, `operator.write`, `operator.approvals`, `operator.pairing`, `operator.talk.secrets`).
- **Маршрути HTTP Plugin**, що використовують автентифікацію Gateway, за замовчуванням мають вужчі права: якщо `x-openclaw-scopes` відсутній, їхня область доступу середовища виконання обмежується лише `operator.write`.
- HTTP-запити з браузерного джерела мають пройти перевірку `gateway.controlUi.allowedOrigins` або навмисно налаштованого резервного режиму на основі заголовка Host навіть після успішної автентифікації через довірений проксі.

Практичне правило: явно надсилайте `x-openclaw-scopes`, коли потрібно звузити права запиту через довірений проксі порівняно зі стандартними або коли маршруту Plugin з автентифікацією Gateway потрібні ширші права, ніж область запису.

## Завершення TLS та HSTS

Використовуйте одну точку завершення TLS і застосовуйте HSTS у ній.

<Tabs>
  <Tab title="Завершення TLS на проксі (рекомендовано)">
    Якщо ваш зворотний проксі обробляє HTTPS для `https://control.example.com`, установіть `Strict-Transport-Security` на проксі для цього домену.

    - Добре підходить для розгортань із доступом з інтернету.
    - Зберігає політику сертифікатів і посилення безпеки HTTP в одному місці.
    - OpenClaw може продовжувати працювати через HTTP на local loopback за проксі.

    Приклад значення заголовка:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Завершення TLS на Gateway">
    Якщо OpenClaw сам безпосередньо обслуговує HTTPS без проксі, який завершує TLS, установіть:

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

- Спочатку встановіть короткий максимальний термін, наприклад `max-age=300`, на час перевірки трафіку.
- Збільшуйте його до тривалих значень, наприклад `max-age=31536000`, лише після досягнення високої впевненості.
- Додавайте `includeSubDomains`, лише якщо кожен піддомен готовий до HTTPS.
- Використовуйте попереднє завантаження, лише якщо свідомо виконуєте його вимоги для повного набору доменів.
- Локальна розробка лише через local loopback не отримує переваг від HSTS.

## Приклади налаштування проксі

<AccordionGroup>
  <Accordion title="Pomerium">
    Pomerium передає ідентичність у `x-pomerium-claim-email` або інших заголовках тверджень, а JWT — у `x-pomerium-jwt-assertion`.

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
    oauth2-proxy автентифікує користувачів і передає ідентифікаційні дані в `x-auth-request-email`.

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

## Змішана конфігурація токенів

Gateway відхиляє запуск автентифікації через довірений проксі, якщо також налаштовано спільний токен (`gateway.auth.token` або `OPENCLAW_GATEWAY_TOKEN`). Ці два способи взаємовиключні, оскільки спільний токен дозволив би викликам із того самого хоста автентифікуватися цілком іншим шляхом, ніж перевірені проксі ідентифікаційні дані, які має забезпечувати цей режим.

Якщо запуск завершується помилкою на кшталт `gateway auth mode is trusted-proxy, but a shared token is also configured`:

- Видаліть спільний токен під час використання режиму довіреного проксі або
- Змініть `gateway.auth.mode` на `"token"`, якщо ви плануєте автентифікацію на основі токена.

Заголовки ідентифікаційних даних довіреного проксі для local loopback усе одно працюють за принципом безпечної відмови: виклики з того самого хоста не автентифікуються неявно як користувачі проксі. Внутрішні клієнти OpenClaw, які обходять проксі, натомість можуть автентифікуватися за допомогою `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. Резервна автентифікація за токеном навмисно не підтримується в режимі довіреного проксі.

## Контрольний список безпеки

Перш ніж увімкнути автентифікацію через довірений проксі, перевірте:

- [ ] **Проксі — єдиний шлях**: порт Gateway захищено брандмауером від усіх підключень, крім вашого проксі.
- [ ] **Мінімальний список trustedProxies**: лише фактичні IP-адреси ваших проксі, а не цілі підмережі.
- [ ] **Джерело проксі через local loopback вибрано свідомо**: автентифікація через довірений проксі працює за принципом безпечної відмови для запитів із джерелом local loopback, якщо `gateway.auth.trustedProxy.allowLoopback` явно не ввімкнено для проксі на тому самому хості.
- [ ] **Проксі видаляє заголовки**: ваш проксі перезаписує (а не доповнює) отримані від клієнтів заголовки `x-forwarded-*`.
- [ ] **Завершення TLS**: ваш проксі обробляє TLS; користувачі підключаються через HTTPS.
- [ ] **allowedOrigins задано явно**: Control UI поза local loopback використовує явно заданий `gateway.controlUi.allowedOrigins`.
- [ ] **allowUsers налаштовано** (рекомендовано): обмежте доступ відомими користувачами замість дозволу всім автентифікованим користувачам.
- [ ] **Немає змішаної конфігурації токенів**: не задавайте одночасно `gateway.auth.token` і `gateway.auth.mode: "trusted-proxy"`.
- [ ] **Локальний резервний пароль є приватним**: якщо ви налаштували `gateway.auth.password` для внутрішніх прямих клієнтів, захистіть порт Gateway брандмауером, щоб віддалені клієнти поза проксі не могли підключитися до нього безпосередньо.

## Аудит безпеки

`openclaw security audit` позначає автентифікацію через довірений проксі результатом із **критичним** рівнем серйозності. Це навмисно: таке попередження нагадує, що ви делегуєте безпеку конфігурації проксі.

Аудит перевіряє:

- Базове попередження або критичне нагадування `gateway.trusted_proxy_auth`.
- Відсутню конфігурацію `trustedProxies`.
- Відсутню конфігурацію `userHeader`.
- Порожній список `allowUsers` (дозволяє доступ будь-якому автентифікованому користувачу).
- Увімкнений `allowLoopback` для джерел проксі на тому самому хості.

Окремі результати, не пов’язані безпосередньо з довіреним проксі, також застосовуються щоразу, коли Control UI доступний ззовні: шаблон `*` або відсутній `gateway.controlUi.allowedOrigins`, а також резервне визначення джерела за заголовком Host.

## Усунення несправностей

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    Запит надійшов не з IP-адреси, зазначеної в `gateway.trustedProxies`. Перевірте:

    - Чи правильна IP-адреса проксі? (IP-адреси контейнерів Docker можуть змінюватися.)
    - Чи є перед вашим проксі балансувальник навантаження?
    - Скористайтеся `docker inspect` або `kubectl get pods -o wide`, щоб знайти фактичні IP-адреси.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    OpenClaw відхилив запит до довіреного проксі з джерелом local loopback.

    Перевірте:

    - Чи підключається проксі з `127.0.0.1` / `::1`?
    - Чи намагаєтеся ви використовувати автентифікацію через довірений проксі зі зворотним проксі local loopback на тому самому хості?

    Виправлення:

    - Надавайте перевагу автентифікації за токеном або паролем для внутрішніх клієнтів на тому самому хості, які не проходять через проксі, або
    - Спрямовуйте трафік через адресу довіреного проксі, яка не належить до local loopback, і залиште цю IP-адресу в `gateway.trustedProxies`, або
    - Для навмисно налаштованого зворотного проксі на тому самому хості задайте `gateway.auth.trustedProxy.allowLoopback = true`, залиште адресу local loopback у `gateway.trustedProxies` і переконайтеся, що проксі видаляє або перезаписує заголовки ідентифікаційних даних.

  </Accordion>
  <Accordion title="trusted_proxy_local_interface_source / trusted_proxy_local_interface_check_failed">
    IP-адреса джерела запиту збіглася з однією з власних адрес мережевих інтерфейсів хоста Gateway, що не належать до local loopback (і не є проксі). Це захист від підробленого трафіку з того самого хоста в мережах Tailscale або мостових мережах Docker. `..._check_failed` означає, що під час виявлення інтерфейсів сталася помилка, тому OpenClaw працює за принципом безпечної відмови.

    Перевірте:

    - Чи надсилає процес безпосередньо на хості Gateway заголовки ідентифікаційних даних в обхід проксі?
    - Чи працює проксі в тому самому просторі мережевих імен, що й Gateway, з IP-адресою, яка також відображається як локальний інтерфейс?

    Виправлення: спрямовуйте трафік проксі через адресу, яка також не прив’язана локально до хоста Gateway, або використовуйте `allowLoopback` лише для справжньої конфігурації проксі на тому самому хості.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    Заголовок користувача був порожнім або відсутнім. Перевірте:

    - Чи налаштовано проксі для передавання заголовків ідентифікаційних даних?
    - Чи правильна назва заголовка? (Регістр не враховується, але написання має значення.)
    - Чи справді користувач автентифікований на проксі?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Обов’язковий заголовок був відсутній. Перевірте:

    - Конфігурацію проксі для відповідних заголовків.
    - Чи не видаляються заголовки на якомусь етапі ланцюжка.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    Користувач автентифікований, але його немає в `allowUsers`. Додайте його або видаліть список дозволених користувачів.
  </Accordion>
  <Accordion title="trusted_proxy_no_proxies_configured / trusted_proxy_config_missing">
    `gateway.auth.mode` має значення `"trusted-proxy"`, але `gateway.trustedProxies` порожній або відсутній сам `gateway.auth.trustedProxy`. Усі запити відхиляються, доки не буде налаштовано обидва параметри.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    Автентифікація через довірений проксі успішна, але заголовок браузера `Origin` не пройшов перевірки джерела Control UI.

    Перевірте:

    - `gateway.controlUi.allowedOrigins` містить точне джерело браузера.
    - Ви не покладаєтеся на джерела з шаблоном `*`, якщо лише навмисно не бажаєте дозволити всі джерела.
    - Якщо ви навмисно використовуєте режим резервного визначення за заголовком Host, параметр `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` задано свідомо.

  </Accordion>
  <Accordion title="Connection succeeds but methods report missing scope">
    WebSocket підключається, але `chat.history`, `sessions.list` або
    `models.list` завершується помилкою `missing scope: operator.read`.

    Поширені причини:

    - Сеанс Control UI без пристрою: автентифікація через довірений проксі може дозволити з’єднання WebSocket без ідентифікаційних даних пристрою, але OpenClaw навмисно очищає області доступу в сеансах без пристрою.
    - Власний клієнт серверної частини: `gateway.controlUi.dangerouslyDisableDeviceAuth` діє лише в межах Control UI і не надає областей доступу довільним клієнтам WebSocket серверної частини або клієнтам у формі CLI.
    - Надто вузький `x-openclaw-scopes`: якщо ваш проксі додає цей заголовок до запиту оновлення WebSocket Control UI, області доступу сеансу обмежуються цим набором. Порожнє значення заголовка не надає жодних областей доступу.

    Виправлення:

    - Для Control UI використовуйте HTTPS, щоб браузер міг створити ідентифікаційні дані пристрою та завершити сполучення.
    - Для власної автоматизації використовуйте ідентифікаційні дані пристрою та сполучення, зарезервований допоміжний шлях серверної частини `gateway-client` для прямих локальних підключень або [адміністративний HTTP RPC](/uk/plugins/admin-http-rpc).
    - Використовуйте `gateway.controlUi.dangerouslyDisableDeviceAuth: true` лише як тимчасовий аварійний спосіб доступу до Control UI.

  </Accordion>
  <Accordion title="WebSocket still failing">
    Переконайтеся, що ваш проксі:

    - Підтримує оновлення WebSocket (`Upgrade: websocket`, `Connection: upgrade`).
    - Передає заголовки ідентифікаційних даних у запитах оновлення WebSocket (а не лише HTTP).
    - Не має окремого шляху автентифікації для з’єднань WebSocket.

  </Accordion>
</AccordionGroup>

## Перехід з автентифікації за токеном

<Steps>
  <Step title="Configure the proxy">
    Налаштуйте проксі для автентифікації користувачів і передавання заголовків.
  </Step>
  <Step title="Test the proxy independently">
    Перевірте конфігурацію проксі окремо (`curl` із заголовками).
  </Step>
  <Step title="Update OpenClaw config">
    Оновіть конфігурацію OpenClaw, додавши автентифікацію через довірений проксі.
  </Step>
  <Step title="Restart the Gateway">
    Перезапустіть Gateway.
  </Step>
  <Step title="Test WebSocket">
    Перевірте з’єднання WebSocket із Control UI.
  </Step>
  <Step title="Audit">
    Виконайте `openclaw security audit` і перегляньте результати.
  </Step>
</Steps>

## Пов’язані матеріали

- [Конфігурація](/uk/gateway/configuration) — довідник із конфігурації
- [Області доступу оператора](/uk/gateway/operator-scopes) — ролі, області доступу та перевірки схвалення
- [Віддалений доступ](/uk/gateway/remote) — інші схеми віддаленого доступу
- [Безпека](/uk/gateway/security) — повний посібник із безпеки
- [Tailscale](/uk/gateway/tailscale) — простіша альтернатива для доступу лише з мережі Tailscale

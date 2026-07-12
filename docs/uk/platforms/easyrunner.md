---
read_when:
    - Розгортання OpenClaw на EasyRunner
    - Запуск Gateway за проксі Caddy від EasyRunner
    - Вибір постійних томів і автентифікації для розміщеного Gateway
summary: Запустіть OpenClaw Gateway на EasyRunner за допомогою Podman і Caddy
title: EasyRunner
x-i18n:
    generated_at: "2026-07-12T13:22:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 80cbde016a8bf7662d4b4a056a3d122a423264179daf70b5705e8f10b0dad5cb
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner розміщує Gateway OpenClaw як невеликий контейнеризований застосунок за своїм
проксі Caddy. Цей посібник передбачає наявність хоста EasyRunner, який запускає сумісні з Podman
застосунки Compose та завершує HTTPS-з’єднання через Caddy.

## Перед початком

- Сервер EasyRunner із прив’язаним до нього доменом.
- Офіційний образ OpenClaw (`ghcr.io/openclaw/openclaw`) або ваша власна збірка.
- Постійний том конфігурації для `/home/node/.openclaw`.
- Постійний том робочого простору для `/home/node/.openclaw/workspace`.
- Надійний токен або пароль Gateway.

За можливості залишайте автентифікацію пристроїв увімкненою. Якщо зворотний проксі не може
правильно передавати ідентичність пристрою, спочатку виправте налаштування довіреного проксі (див.
[Автентифікація через довірений проксі](/uk/gateway/trusted-proxy-auth)); використовуйте небезпечні
способи обходу автентифікації лише в повністю приватній мережі під контролем оператора.

## Застосунок Compose

Створіть застосунок EasyRunner із файлом Compose такого вигляду:

```yaml
services:
  openclaw:
    image: ghcr.io/openclaw/openclaw:latest
    restart: unless-stopped
    environment:
      OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
      OPENCLAW_HOME: /home/node
      OPENCLAW_STATE_DIR: /home/node/.openclaw
      OPENCLAW_CONFIG_PATH: /home/node/.openclaw/openclaw.json
      OPENCLAW_WORKSPACE_DIR: /home/node/.openclaw/workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/home/node/.openclaw/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["node", "openclaw.mjs", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

Замініть `openclaw.example.com` на ім’я хоста вашого Gateway. Зберігайте
`OPENCLAW_GATEWAY_TOKEN` у менеджері секретів або змінних середовища EasyRunner, а не
додавайте його до визначення застосунку. За замовчуванням образ прив’язується до local loopback,
тому явні параметри `--bind lan --port 1455` у `command` потрібні, щоб Caddy
міг підключитися до контейнера.

## Налаштування OpenClaw

У постійному томі конфігурації зробіть Gateway доступним лише через
проксі та вимагайте автентифікацію:

```json5
{
  gateway: {
    bind: "lan",
    port: 1455,
    auth: {
      token: "${OPENCLAW_GATEWAY_TOKEN}",
    },
  },
}
```

Якщо Caddy завершує TLS-з’єднання для Gateway, налаштуйте параметри довіреного проксі для
точного шляху проксі замість глобального вимкнення перевірок автентифікації. Див.
[Автентифікація через довірений проксі](/uk/gateway/trusted-proxy-auth).

## Перевірка

З вашої робочої станції:

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

На хості EasyRunner запити `GET /healthz` (перевірка працездатності) та `GET /readyz`
(перевірка готовності) не потребують автентифікації та використовуються вбудованою в образ
перевіркою стану контейнера. Також перевірте журнали застосунку: Gateway має прослуховувати
з’єднання, а під час запуску не повинно бути помилок SecretRef, Plugin або автентифікації каналів.

## Оновлення та резервні копії

- Завантажте або зберіть новий образ OpenClaw, а потім повторно розгорніть застосунок EasyRunner.
- Перед оновленнями створіть резервну копію тому `openclaw-config`. Він містить
  `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json` і стан установлених
  пакетів плагінів.
- Створюйте резервну копію `openclaw-workspace`, якщо агенти зберігають там постійні дані проєктів.
- Після значних оновлень запустіть `openclaw doctor`, щоб виявити необхідні міграції конфігурації та
  попередження служб.

## Усунення несправностей

- `gateway probe` не може підключитися: переконайтеся, що ім’я хоста Caddy вказує на застосунок
  і контейнер прослуховує `0.0.0.0:1455`.
- Помилка автентифікації: одночасно замініть токен у секретах EasyRunner і команді
  локального клієнта.
- Після відновлення власником файлів є root: образ працює від імені `node` (uid 1000);
  виправте права змонтованих томів, щоб цей користувач міг записувати дані до
  `/home/node/.openclaw` і `/home/node/.openclaw/workspace`.
- Плагіни браузера або каналів не працюють: перевірте, чи доступні всередині
  контейнера необхідні зовнішні виконувані файли, вихідний доступ до мережі та змонтовані облікові дані.

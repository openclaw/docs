---
read_when:
    - Інтеграція інструментів, які очікують OpenAI Chat Completions
summary: Надати з Gateway HTTP-ендпоінт `/v1/chat/completions`, сумісний з OpenAI
title: Chat completions OpenAI
x-i18n:
    generated_at: "2026-04-23T20:53:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 088ec389cd8c8f717054beb0304a4d9cea70e48075410c5c4d00b89d88b445c4
    source_path: gateway/openai-http-api.md
    workflow: 15
---

# Chat completions OpenAI (HTTP)

Gateway OpenClaw може надавати невеликий ендпоінт Chat Completions, сумісний з OpenAI.

Цей ендпоінт **типово вимкнений**. Спочатку увімкніть його в конфігурації.

- `POST /v1/chat/completions`
- Той самий порт, що й у Gateway (мультиплексування WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Коли HTTP-поверхню Gateway, сумісну з OpenAI, увімкнено, вона також надає:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Під капотом запити виконуються як звичайний запуск агента Gateway (той самий шлях коду, що й `openclaw agent`), тому маршрутизація/дозволи/конфігурація відповідають вашому Gateway.

## Автентифікація

Використовує конфігурацію автентифікації Gateway.

Поширені шляхи HTTP-автентифікації:

- автентифікація через спільний секрет (`gateway.auth.mode="token"` або `"password"`):
  `Authorization: Bearer <token-or-password>`
- HTTP-автентифікація через довірену ідентичність (`gateway.auth.mode="trusted-proxy"`):
  маршрутизуйте через налаштований проксі з підтримкою ідентичності й дозвольте йому вставляти
  потрібні заголовки ідентичності
- відкрита автентифікація для приватного ingress (`gateway.auth.mode="none"`):
  заголовок автентифікації не потрібен

Примітки:

- Коли `gateway.auth.mode="token"`, використовуйте `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
- Коли `gateway.auth.mode="password"`, використовуйте `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
- Коли `gateway.auth.mode="trusted-proxy"`, HTTP-запит має надходити з
  налаштованого довіреного джерела proxy поза loopback; proxy на тому самому host через loopback
  не задовольняють цей режим.
- Якщо налаштовано `gateway.auth.rateLimit` і відбувається надто багато збоїв автентифікації, ендпоінт повертає `429` з `Retry-After`.

## Межа безпеки (важливо)

Ставтеся до цього ендпоінта як до поверхні **повного операторського доступу** для екземпляра gateway.

- HTTP bearer auth тут не є вузькою моделлю scope для окремого користувача.
- Валідний токен/пароль Gateway для цього ендпоінта слід розглядати як облікові дані власника/оператора.
- Запити проходять через той самий шлях агента control-plane, що й довірені дії оператора.
- На цьому ендпоінті немає окремої межі інструментів для невласника/окремого користувача; щойно викликальник проходить автентифікацію Gateway тут, OpenClaw розглядає його як довіреного оператора цього gateway.
- Для режимів автентифікації через спільний секрет (`token` і `password`) ендпоінт відновлює звичайні повні операторські значення за замовчуванням, навіть якщо викликальник надсилає вужчий заголовок `x-openclaw-scopes`.
- Довірені режими HTTP із передачею ідентичності (наприклад, trusted proxy auth або `gateway.auth.mode="none"`) враховують `x-openclaw-scopes`, якщо заголовок присутній, інакше повертаються до звичайного типового набору операторських scope.
- Якщо політика цільового агента дозволяє чутливі інструменти, цей ендпоінт може їх використовувати.
- Тримайте цей ендпоінт лише на loopback/tailnet/приватному ingress; не виставляйте його безпосередньо в публічний інтернет.

Матриця автентифікації:

- `gateway.auth.mode="token"` або `"password"` + `Authorization: Bearer ...`
  - підтверджує володіння спільним секретом оператора gateway
  - ігнорує вужчі `x-openclaw-scopes`
  - відновлює повний типовий набір операторських scope:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - розглядає chat-turns на цьому ендпоінті як turns відправника-власника
- довірені режими HTTP із передачею ідентичності (наприклад, trusted proxy auth або `gateway.auth.mode="none"` на приватному ingress)
  - автентифікують певну зовнішню довірену ідентичність або межу розгортання
  - враховують `x-openclaw-scopes`, коли цей заголовок присутній
  - повертаються до звичайного типового набору операторських scope, коли заголовок відсутній
  - втрачають семантику власника лише тоді, коли викликальник явно звужує scope і пропускає `operator.admin`

Див. [Безпека](/uk/gateway/security) і [Віддалений доступ](/uk/gateway/remote).

## Контракт моделі з пріоритетом агента

OpenClaw трактує поле OpenAI `model` як **ціль агента**, а не як необроблений id моделі провайдера.

- `model: "openclaw"` маршрутизується до налаштованого типового агента.
- `model: "openclaw/default"` також маршрутизується до налаштованого типового агента.
- `model: "openclaw/<agentId>"` маршрутизується до конкретного агента.

Необов’язкові заголовки запиту:

- `x-openclaw-model: <provider/model-or-bare-id>` перевизначає backend-модель для вибраного агента.
- `x-openclaw-agent-id: <agentId>` і далі підтримується як сумісне перевизначення.
- `x-openclaw-session-key: <sessionKey>` повністю керує маршрутизацією сесії.
- `x-openclaw-message-channel: <channel>` задає синтетичний контекст вхідного каналу для prompt і політик, чутливих до каналу.

Псевдоніми сумісності, які все ще приймаються:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Увімкнення ендпоінта

Установіть `gateway.http.endpoints.chatCompletions.enabled` у `true`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

## Вимкнення ендпоінта

Установіть `gateway.http.endpoints.chatCompletions.enabled` у `false`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false },
      },
    },
  },
}
```

## Поведінка сесії

За замовчуванням ендпоінт є **безстанним для кожного запиту** (для кожного виклику генерується новий ключ сесії).

Якщо запит містить рядок OpenAI `user`, Gateway виводить із нього стабільний ключ сесії, тож повторні виклики можуть використовувати спільну сесію агента.

## Чому ця поверхня важлива

Це найцінніший набір сумісності для self-hosted frontend і інструментів:

- Більшість налаштувань Open WebUI, LobeChat і LibreChat очікують `/v1/models`.
- Багато RAG-систем очікують `/v1/embeddings`.
- Наявні клієнти OpenAI chat зазвичай можуть почати з `/v1/chat/completions`.
- Більш нативні до агентів клієнти дедалі частіше надають перевагу `/v1/responses`.

## Список моделей і маршрутизація агентів

<AccordionGroup>
  <Accordion title="Що повертає `/v1/models`?">
    Список цілей агентів OpenClaw.

    Повернені id — це записи `openclaw`, `openclaw/default` і `openclaw/<agentId>`.
    Використовуйте їх безпосередньо як значення OpenAI `model`.

  </Accordion>
  <Accordion title="`/v1/models` перелічує агентів чи підагентів?">
    Він перелічує цілі верхнього рівня агентів, а не backend-моделі провайдерів і не підагентів.

    Підагенти залишаються внутрішньою топологією виконання. Вони не з’являються як псевдомоделі.

  </Accordion>
  <Accordion title="Чому включено `openclaw/default`?">
    `openclaw/default` — це стабільний псевдонім для налаштованого типового агента.

    Це означає, що клієнти можуть і надалі використовувати один передбачуваний id, навіть якщо фактичний id типового агента змінюється між середовищами.

  </Accordion>
  <Accordion title="Як перевизначити backend-модель?">
    Використовуйте `x-openclaw-model`.

    Приклади:
    `x-openclaw-model: openai/gpt-5.5`
    `x-openclaw-model: gpt-5.5`

    Якщо його не вказати, вибраний агент працюватиме зі своїм звичайним налаштованим вибором моделі.

  </Accordion>
  <Accordion title="Як embeddings вписуються в цей контракт?">
    `/v1/embeddings` використовує ті самі id `model` для цілей агентів.

    Використовуйте `model: "openclaw/default"` або `model: "openclaw/<agentId>"`.
    Якщо вам потрібна конкретна embedding-модель, передайте її в `x-openclaw-model`.
    Без цього заголовка запит проходить до звичайного налаштування embeddings вибраного агента.

  </Accordion>
</AccordionGroup>

## Потокова передача (SSE)

Установіть `stream: true`, щоб отримувати Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Кожен рядок події має вигляд `data: <json>`
- Потік завершується з `data: [DONE]`

## Швидке налаштування Open WebUI

Для базового підключення Open WebUI:

- Base URL: `http://127.0.0.1:18789/v1`
- Base URL для Docker на macOS: `http://host.docker.internal:18789/v1`
- API key: ваш bearer token Gateway
- Model: `openclaw/default`

Очікувана поведінка:

- `GET /v1/models` має перелічувати `openclaw/default`
- Open WebUI має використовувати `openclaw/default` як id chat-моделі
- Якщо вам потрібен конкретний backend provider/model для цього агента, задайте звичайну типову модель агента або передайте `x-openclaw-model`

Швидка перевірка:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Якщо це повертає `openclaw/default`, більшість налаштувань Open WebUI можуть підключитися з тим самим base URL і токеном.

## Приклади

Без потокової передачі:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Потокова передача:

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/gpt-5.5' \
  -d '{
    "model": "openclaw/research",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Перелік моделей:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Отримати одну модель:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Створити embeddings:

```bash
curl -sS http://127.0.0.1:18789/v1/embeddings \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/text-embedding-3-small' \
  -d '{
    "model": "openclaw/default",
    "input": ["alpha", "beta"]
  }'
```

Примітки:

- `/v1/models` повертає цілі агентів OpenClaw, а не необроблені каталоги провайдерів.
- `openclaw/default` завжди присутній, тому один стабільний id працює в різних середовищах.
- Перевизначення backend provider/model належать до `x-openclaw-model`, а не до поля OpenAI `model`.
- `/v1/embeddings` підтримує `input` як рядок або масив рядків.

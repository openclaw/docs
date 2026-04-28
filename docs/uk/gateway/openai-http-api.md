---
read_when:
    - Інтеграція інструментів, які очікують OpenAI Chat Completions
summary: Надайте HTTP-кінцеву точку /v1/chat/completions, сумісну з OpenAI, через Gateway
title: Завершення чату OpenAI
x-i18n:
    generated_at: "2026-04-28T11:12:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a19f9d9d6d8ce6d605f8af5324ae3eb0c100c167609341c8dfb569970b0b2c9
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw Gateway може обслуговувати невелику OpenAI-сумісну кінцеву точку Chat Completions.

Цю кінцеву точку **вимкнено за замовчуванням**. Спершу увімкніть її в конфігурації.

- `POST /v1/chat/completions`
- Той самий порт, що й Gateway (мультиплексування WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Коли OpenAI-сумісну HTTP-поверхню Gateway увімкнено, вона також обслуговує:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Під капотом запити виконуються як звичайний запуск агента Gateway (той самий шлях коду, що й `openclaw agent`), тому маршрутизація/дозволи/конфігурація відповідають вашому Gateway.

## Автентифікація

Використовує конфігурацію автентифікації Gateway.

Поширені шляхи HTTP-автентифікації:

- автентифікація зі спільним секретом (`gateway.auth.mode="token"` або `"password"`):
  `Authorization: Bearer <token-or-password>`
- довірена HTTP-автентифікація з ідентичністю (`gateway.auth.mode="trusted-proxy"`):
  маршрутизуйте через налаштований проксі, що враховує ідентичність, і дозвольте йому вставити
  потрібні заголовки ідентичності
- відкрита автентифікація для приватного ingress (`gateway.auth.mode="none"`):
  заголовок автентифікації не потрібен

Примітки:

- Коли `gateway.auth.mode="token"`, використовуйте `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
- Коли `gateway.auth.mode="password"`, використовуйте `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
- Коли `gateway.auth.mode="trusted-proxy"`, HTTP-запит має надходити з
  налаштованого довіреного джерела проксі; loopback-проксі на тому самому хості потребують явного
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Якщо `gateway.auth.rateLimit` налаштовано і стається забагато помилок автентифікації, кінцева точка повертає `429` з `Retry-After`.

## Межа безпеки (важливо)

Вважайте цю кінцеву точку поверхнею з **повним операторським доступом** до екземпляра Gateway.

- HTTP bearer-автентифікація тут не є вузькою моделлю областей доступу для окремих користувачів.
- Дійсний токен/пароль Gateway для цієї кінцевої точки слід вважати обліковими даними власника/оператора.
- Запити проходять через той самий шлях агента control plane, що й довірені операторські дії.
- Для цієї кінцевої точки немає окремої межі інструментів для невласника/окремого користувача; щойно викликач проходить автентифікацію Gateway тут, OpenClaw вважає такого викликача довіреним оператором для цього Gateway.
- Для режимів автентифікації зі спільним секретом (`token` і `password`) кінцева точка відновлює звичайні повні операторські значення за замовчуванням, навіть якщо викликач надсилає вужчий заголовок `x-openclaw-scopes`.
- Довірені HTTP-режими з ідентичністю (наприклад, автентифікація довіреного проксі або `gateway.auth.mode="none"`) враховують `x-openclaw-scopes`, коли він присутній, а інакше повертаються до звичайного набору операторських областей доступу за замовчуванням.
- Якщо політика цільового агента дозволяє чутливі інструменти, ця кінцева точка може їх використовувати.
- Тримайте цю кінцеву точку лише на loopback/tailnet/приватному ingress; не відкривайте її напряму в публічний інтернет.

Матриця автентифікації:

- `gateway.auth.mode="token"` або `"password"` + `Authorization: Bearer ...`
  - доводить володіння спільним операторським секретом Gateway
  - ігнорує вужчий `x-openclaw-scopes`
  - відновлює повний набір операторських областей доступу за замовчуванням:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - трактує ходи чату на цій кінцевій точці як ходи відправника-власника
- довірені HTTP-режими з ідентичністю (наприклад, автентифікація довіреного проксі або `gateway.auth.mode="none"` на приватному ingress)
  - автентифікують певну зовнішню довірену ідентичність або межу розгортання
  - враховують `x-openclaw-scopes`, коли заголовок присутній
  - повертаються до звичайного набору операторських областей доступу за замовчуванням, коли заголовок відсутній
  - втрачають семантику власника лише тоді, коли викликач явно звужує області доступу й опускає `operator.admin`

Див. [Безпека](/uk/gateway/security) і [Віддалений доступ](/uk/gateway/remote).

## Контракт моделі з пріоритетом агента

OpenClaw трактує поле OpenAI `model` як **ціль агента**, а не сирий ідентифікатор моделі провайдера.

- `model: "openclaw"` маршрутизує до налаштованого агента за замовчуванням.
- `model: "openclaw/default"` також маршрутизує до налаштованого агента за замовчуванням.
- `model: "openclaw/<agentId>"` маршрутизує до конкретного агента.

Необов’язкові заголовки запиту:

- `x-openclaw-model: <provider/model-or-bare-id>` перевизначає бекенд-модель для вибраного агента.
- `x-openclaw-agent-id: <agentId>` і надалі підтримується як сумісне перевизначення.
- `x-openclaw-session-key: <sessionKey>` повністю керує маршрутизацією сесії.
- `x-openclaw-message-channel: <channel>` задає синтетичний контекст вхідного каналу для підказок і політик, що враховують канал.

Сумісні псевдоніми, які все ще приймаються:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Увімкнення кінцевої точки

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

## Вимкнення кінцевої точки

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

За замовчуванням кінцева точка **не має стану між запитами** (для кожного виклику генерується новий ключ сесії).

Якщо запит містить рядок OpenAI `user`, Gateway виводить із нього стабільний ключ сесії, тож повторні виклики можуть спільно використовувати сесію агента.

## Чому ця поверхня важлива

Це найефективніший набір сумісності для self-hosted фронтендів та інструментів:

- Більшість налаштувань Open WebUI, LobeChat і LibreChat очікують `/v1/models`.
- Багато RAG-систем очікують `/v1/embeddings`.
- Наявні чат-клієнти OpenAI зазвичай можуть почати з `/v1/chat/completions`.
- Більш agent-native клієнти дедалі частіше віддають перевагу `/v1/responses`.

## Список моделей і маршрутизація агентів

<AccordionGroup>
  <Accordion title="What does `/v1/models` return?">
    Список цілей агентів OpenClaw.

    Повернуті ідентифікатори — це записи `openclaw`, `openclaw/default` і `openclaw/<agentId>`.
    Використовуйте їх безпосередньо як значення OpenAI `model`.

  </Accordion>
  <Accordion title="Does `/v1/models` list agents or sub-agents?">
    Він перелічує цілі агентів верхнього рівня, а не бекенд-моделі провайдерів і не субагентів.

    Субагенти залишаються внутрішньою топологією виконання. Вони не з’являються як псевдомоделі.

  </Accordion>
  <Accordion title="Why is `openclaw/default` included?">
    `openclaw/default` — це стабільний псевдонім для налаштованого агента за замовчуванням.

    Це означає, що клієнти можуть продовжувати використовувати один передбачуваний ідентифікатор, навіть якщо справжній ідентифікатор агента за замовчуванням змінюється між середовищами.

  </Accordion>
  <Accordion title="How do I override the backend model?">
    Використовуйте `x-openclaw-model`.

    Приклади:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Якщо його опущено, вибраний агент запускається зі своїм звичайним налаштованим вибором моделі.

  </Accordion>
  <Accordion title="How do embeddings fit this contract?">
    `/v1/embeddings` використовує ті самі ідентифікатори `model` цілей агентів.

    Використовуйте `model: "openclaw/default"` або `model: "openclaw/<agentId>"`.
    Коли потрібна конкретна модель embeddings, надішліть її в `x-openclaw-model`.
    Без цього заголовка запит проходить до звичайного налаштування embeddings вибраного агента.

  </Accordion>
</AccordionGroup>

## Потокова передача (SSE)

Установіть `stream: true`, щоб отримувати Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Кожен рядок події має вигляд `data: <json>`
- Потік завершується `data: [DONE]`

## Швидке налаштування Open WebUI

Для базового підключення Open WebUI:

- Базова URL-адреса: `http://127.0.0.1:18789/v1`
- Базова URL-адреса Docker на macOS: `http://host.docker.internal:18789/v1`
- Ключ API: ваш bearer-токен Gateway
- Модель: `openclaw/default`

Очікувана поведінка:

- `GET /v1/models` має перелічити `openclaw/default`
- Open WebUI має використовувати `openclaw/default` як ідентифікатор чат-моделі
- Якщо вам потрібен конкретний бекенд-провайдер/модель для цього агента, установіть звичайну модель агента за замовчуванням або надішліть `x-openclaw-model`

Швидка smoke-перевірка:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Якщо це повертає `openclaw/default`, більшість налаштувань Open WebUI можуть підключитися з тією самою базовою URL-адресою та токеном.

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
  -H 'x-openclaw-model: openai/gpt-5.4' \
  -d '{
    "model": "openclaw/research",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Перелічити моделі:

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

- `/v1/models` повертає цілі агентів OpenClaw, а не сирі каталоги провайдерів.
- `openclaw/default` завжди присутній, тож один стабільний ідентифікатор працює в різних середовищах.
- Перевизначення бекенд-провайдера/моделі належать до `x-openclaw-model`, а не до поля OpenAI `model`.
- `/v1/embeddings` підтримує `input` як рядок або масив рядків.

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference)
- [OpenAI](/uk/providers/openai)

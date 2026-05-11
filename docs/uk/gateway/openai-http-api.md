---
read_when:
    - Інтеграція інструментів, які очікують OpenAI Chat Completions
summary: Надайте сумісну з OpenAI кінцеву HTTP-точку /v1/chat/completions із Gateway
title: Завершення чатів OpenAI
x-i18n:
    generated_at: "2026-05-11T20:38:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: e71e25fc1299754ebc65d3998834dc5e9c03acfbd005387aef96f946be1d04a1
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw Gateway може надавати невелику OpenAI-сумісну кінцеву точку Chat Completions.

Ця кінцева точка **вимкнена за замовчуванням**. Спочатку увімкніть її в конфігурації.

- `POST /v1/chat/completions`
- Той самий порт, що й Gateway (мультиплекс WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Коли OpenAI-сумісну HTTP-поверхню Gateway увімкнено, вона також надає:

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
  маршрутизуйте через налаштований проксі з урахуванням ідентичності й дозвольте йому вставити
  потрібні заголовки ідентичності
- відкрита автентифікація для приватного входу (`gateway.auth.mode="none"`):
  заголовок автентифікації не потрібен

Примітки:

- Коли `gateway.auth.mode="token"`, використовуйте `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
- Коли `gateway.auth.mode="password"`, використовуйте `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
- Коли `gateway.auth.mode="trusted-proxy"`, HTTP-запит має надходити з
  налаштованого довіреного джерела проксі; same-host loopback проксі потребують явного
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Якщо `gateway.auth.rateLimit` налаштовано й відбувається забагато помилок автентифікації, кінцева точка повертає `429` з `Retry-After`.

## Межа безпеки (важливо)

Розглядайте цю кінцеву точку як поверхню з **повним операторським доступом** для екземпляра gateway.

- HTTP bearer auth тут не є вузькою моделлю доступу для окремого користувача.
- Дійсний токен/пароль Gateway для цієї кінцевої точки слід розглядати як облікові дані власника/оператора.
- Запити проходять через той самий шлях агента control-plane, що й довірені операторські дії.
- На цій кінцевій точці немає окремої межі інструментів для не-власника/окремого користувача; щойно виклик проходить Gateway auth тут, OpenClaw розглядає цього викликача як довіреного оператора для цього gateway.
- Для режимів автентифікації зі спільним секретом (`token` і `password`) кінцева точка відновлює звичайні повні операторські типові налаштування, навіть якщо викликач надсилає вужчий заголовок `x-openclaw-scopes`.
- Довірені HTTP-режими з ідентичністю (наприклад, автентифікація довіреного проксі або `gateway.auth.mode="none"`) враховують `x-openclaw-scopes`, коли він присутній, а інакше повертаються до звичайного типового набору операторських областей.
- Якщо політика цільового агента дозволяє чутливі інструменти, ця кінцева точка може їх використовувати.
- Тримайте цю кінцеву точку лише на loopback/tailnet/приватному вході; не відкривайте її напряму для публічного інтернету.

Матриця автентифікації:

- `gateway.auth.mode="token"` або `"password"` + `Authorization: Bearer ...`
  - доводить володіння спільним секретом оператора gateway
  - ігнорує вужчий `x-openclaw-scopes`
  - відновлює повний типовий набір операторських областей:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - розглядає ходи чату на цій кінцевій точці як ходи від власника-відправника
- довірені HTTP-режими з ідентичністю (наприклад, автентифікація довіреного проксі або `gateway.auth.mode="none"` на приватному вході)
  - автентифікують певну зовнішню довірену ідентичність або межу розгортання
  - враховують `x-openclaw-scopes`, коли заголовок присутній
  - повертаються до звичайного типового набору операторських областей, коли заголовок відсутній
  - втрачають семантику власника лише тоді, коли викликач явно звужує області й пропускає `operator.admin`

Див. [Безпека](/uk/gateway/security) і [Віддалений доступ](/uk/gateway/remote).

## Контракт моделі за принципом «спершу агент»

OpenClaw трактує поле OpenAI `model` як **ціль агента**, а не необроблений id моделі провайдера.

- `model: "openclaw"` маршрутизує до налаштованого агента за замовчуванням.
- `model: "openclaw/default"` також маршрутизує до налаштованого агента за замовчуванням.
- `model: "openclaw/<agentId>"` маршрутизує до конкретного агента.

Необов’язкові заголовки запиту:

- `x-openclaw-model: <provider/model-or-bare-id>` перевизначає бекенд-модель для вибраного агента.
- `x-openclaw-agent-id: <agentId>` залишається підтримуваним як перевизначення для сумісності.
- `x-openclaw-session-key: <sessionKey>` повністю керує маршрутизацією сесії.
- `x-openclaw-message-channel: <channel>` задає синтетичний контекст вхідного каналу для підказок і політик, що враховують канал.

Сумісні псевдоніми, які все ще приймаються:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Увімкнення кінцевої точки

Встановіть `gateway.http.endpoints.chatCompletions.enabled` у `true`:

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

Встановіть `gateway.http.endpoints.chatCompletions.enabled` у `false`:

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

За замовчуванням кінцева точка є **stateless для кожного запиту** (новий ключ сесії генерується під час кожного виклику).

Якщо запит містить рядок OpenAI `user`, Gateway виводить із нього стабільний ключ сесії, тож повторні виклики можуть спільно використовувати сесію агента.

## Чому ця поверхня важлива

Це найефективніший набір сумісності для self-hosted фронтендів та інструментів:

- Більшість налаштувань Open WebUI, LobeChat і LibreChat очікують `/v1/models`.
- Багато RAG-систем очікують `/v1/embeddings`.
- Наявні клієнти чату OpenAI зазвичай можуть почати з `/v1/chat/completions`.
- Більш agent-native клієнти дедалі частіше віддають перевагу `/v1/responses`.

## Список моделей і маршрутизація агентів

<AccordionGroup>
  <Accordion title="Що повертає `/v1/models`?">
    Список цілей агентів OpenClaw.

    Повернені ids — це записи `openclaw`, `openclaw/default` і `openclaw/<agentId>`.
    Використовуйте їх напряму як значення OpenAI `model`.

  </Accordion>
  <Accordion title="Чи перелічує `/v1/models` агентів або під-агентів?">
    Він перелічує цілі агентів верхнього рівня, а не бекенд-моделі провайдерів і не під-агентів.

    Під-агенти залишаються внутрішньою топологією виконання. Вони не з’являються як псевдо-моделі.

  </Accordion>
  <Accordion title="Чому включено `openclaw/default`?">
    `openclaw/default` — це стабільний псевдонім для налаштованого агента за замовчуванням.

    Це означає, що клієнти можуть продовжувати використовувати один передбачуваний id, навіть якщо реальний id агента за замовчуванням змінюється між середовищами.

  </Accordion>
  <Accordion title="Як перевизначити бекенд-модель?">
    Використовуйте `x-openclaw-model`.

    Приклади:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Якщо ви його пропустите, вибраний агент запускатиметься зі своїм звичайним налаштованим вибором моделі.

  </Accordion>
  <Accordion title="Як embeddings вписуються в цей контракт?">
    `/v1/embeddings` використовує ті самі ids `model` для цілей агентів.

    Використовуйте `model: "openclaw/default"` або `model: "openclaw/<agentId>"`.
    Коли потрібна конкретна embedding-модель, надішліть її в `x-openclaw-model`.
    Без цього заголовка запит передається до звичайного налаштування embeddings вибраного агента.

  </Accordion>
</AccordionGroup>

## Стрімінг (SSE)

Встановіть `stream: true`, щоб отримувати Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Кожен рядок події має вигляд `data: <json>`
- Потік завершується `data: [DONE]`

## Контракт інструментів чату

`/v1/chat/completions` підтримує підмножину function-tool, сумісну з поширеними клієнтами OpenAI Chat.

### Підтримувані поля запиту

- `tools`: масив `{ "type": "function", "function": { ... } }`
- `tool_choice`: `"auto"`, `"none"`
- `messages[*].role: "tool"` подальші ходи
- `messages[*].tool_call_id` для прив’язування результатів інструментів назад до попереднього виклику інструмента

### Непідтримувані варіанти

Кінцева точка повертає `400 invalid_request_error` для непідтримуваних варіантів інструментів, зокрема:

- не-масив `tools`
- записи інструментів не типу function
- відсутній `tool.function.name`
- варіанти `tool_choice`, як-от `allowed_tools` і `custom`
- `tool_choice: "required"` (поки що не застосовується під час виконання; буде підтримано після реалізації жорсткого застосування)
- `tool_choice: { "type": "function", "function": { "name": "..." } }` (та сама причина, що й для `required`)
- значення `tool_choice.function.name`, які не відповідають наданим `tools`

### Форма відповіді інструмента без стрімінгу

Коли агент вирішує викликати інструменти, відповідь використовує:

- `choices[0].finish_reason = "tool_calls"`
- записи `choices[0].message.tool_calls[]` з:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (рядок JSON)

Коментар асистента перед викликом інструмента повертається в `choices[0].message.content` (можливо, порожній).

### Форма відповіді інструмента зі стрімінгом

Коли `stream: true`, виклики інструментів передаються як інкрементальні фрагменти SSE:

- початкова дельта ролі асистента
- необов’язкові дельти коментаря асистента
- один або кілька фрагментів `delta.tool_calls`, що несуть ідентичність інструмента та фрагменти аргументів
- фінальний фрагмент із `finish_reason: "tool_calls"`
- `data: [DONE]`

Якщо `stream_options.include_usage=true`, кінцевий фрагмент використання передається перед `[DONE]`.

### Цикл подальшого виклику інструмента

Після отримання `tool_calls` клієнт має виконати запитані функції й надіслати подальший запит, який містить:

- попереднє повідомлення асистента з викликом інструмента
- одне або кілька повідомлень `role: "tool"` з відповідним `tool_call_id`

Це дозволяє запуску агента gateway продовжити той самий цикл міркування й створити фінальну відповідь асистента.

## Швидке налаштування Open WebUI

Для базового підключення Open WebUI:

- Base URL: `http://127.0.0.1:18789/v1`
- Docker на macOS Base URL: `http://host.docker.internal:18789/v1`
- API key: ваш bearer-токен Gateway
- Model: `openclaw/default`

Очікувана поведінка:

- `GET /v1/models` має перелічувати `openclaw/default`
- Open WebUI має використовувати `openclaw/default` як id моделі чату
- Якщо вам потрібен конкретний бекенд-провайдер/модель для цього агента, встановіть звичайну модель агента за замовчуванням або надішліть `x-openclaw-model`

Швидка перевірка:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Якщо це повертає `openclaw/default`, більшість налаштувань Open WebUI можуть підключитися з тим самим Base URL і токеном.

## Приклади

Без стрімінгу:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Зі стрімінгом:

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

Список моделей:

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
- `openclaw/default` завжди присутній, щоб один стабільний id працював у різних середовищах.
- Перевизначення бекенд-провайдера/моделі належать до `x-openclaw-model`, а не до поля OpenAI `model`.
- `/v1/embeddings` підтримує `input` як рядок або масив рядків.

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference)
- [OpenAI](/uk/providers/openai)

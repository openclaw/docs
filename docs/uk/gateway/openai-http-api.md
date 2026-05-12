---
read_when:
    - Інтеграція інструментів, які очікують OpenAI Chat Completions
summary: Надайте OpenAI-сумісну HTTP-кінцеву точку /v1/chat/completions через Gateway
title: Завершення чату OpenAI
x-i18n:
    generated_at: "2026-05-12T15:43:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 21d901ab70908d6e4e3770e716319b961348c2a7ff6ef9bb2d0ffc6952a073f2
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw Gateway може обслуговувати невелику OpenAI-сумісну кінцеву точку Chat Completions.

Ця кінцева точка **вимкнена за замовчуванням**. Спочатку ввімкніть її в конфігурації.

- `POST /v1/chat/completions`
- Той самий порт, що й у Gateway (мультиплексування WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Коли OpenAI-сумісна HTTP-поверхня Gateway увімкнена, вона також обслуговує:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Під капотом запити виконуються як звичайний запуск агента Gateway (той самий шлях виконання коду, що й `openclaw agent`), тому маршрутизація/дозволи/конфігурація відповідають вашому Gateway.

## Автентифікація

Використовує конфігурацію автентифікації Gateway.

Поширені шляхи HTTP-автентифікації:

- автентифікація за спільним секретом (`gateway.auth.mode="token"` або `"password"`):
  `Authorization: Bearer <token-or-password>`
- довірена HTTP-автентифікація з ідентичністю (`gateway.auth.mode="trusted-proxy"`):
  маршрутизуйте через налаштований проксі, що враховує ідентичність, і дозвольте йому вставити
  потрібні заголовки ідентичності
- відкрита автентифікація для приватного вхідного доступу (`gateway.auth.mode="none"`):
  заголовок автентифікації не потрібен

Примітки:

- Коли `gateway.auth.mode="token"`, використовуйте `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
- Коли `gateway.auth.mode="password"`, використовуйте `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
- Коли `gateway.auth.mode="trusted-proxy"`, HTTP-запит має надходити з
  налаштованого довіреного джерела проксі; loopback-проксі на тому самому хості потребують явного
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Якщо `gateway.auth.rateLimit` налаштовано й сталося забагато помилок автентифікації, кінцева точка повертає `429` з `Retry-After`.

## Межа безпеки (важливо)

Розглядайте цю кінцеву точку як поверхню з **повним операторським доступом** до екземпляра Gateway.

- HTTP bearer-автентифікація тут не є вузькою моделлю області дії для окремого користувача.
- Дійсний токен/пароль Gateway для цієї кінцевої точки слід розглядати як облікові дані власника/оператора.
- Запити проходять через той самий шлях агента площини керування, що й довірені операторські дії.
- Для цієї кінцевої точки немає окремої межі інструментів для невласника/окремого користувача; щойно виклик проходить автентифікацію Gateway тут, OpenClaw розглядає цього викликача як довіреного оператора для цього Gateway.
- Для режимів автентифікації зі спільним секретом (`token` і `password`) кінцева точка відновлює звичайні повні операторські налаштування за замовчуванням, навіть якщо викликач надсилає вужчий заголовок `x-openclaw-scopes`.
- Довірені HTTP-режими з ідентичністю (наприклад, автентифікація через довірений проксі або `gateway.auth.mode="none"`) враховують `x-openclaw-scopes`, коли він присутній, а інакше повертаються до звичайного операторського набору областей дії за замовчуванням.
- Якщо політика цільового агента дозволяє чутливі інструменти, ця кінцева точка може їх використовувати.
- Тримайте цю кінцеву точку лише на loopback/tailnet/приватному вхідному доступі; не виставляйте її напряму в публічний інтернет.

Матриця автентифікації:

- `gateway.auth.mode="token"` або `"password"` + `Authorization: Bearer ...`
  - доводить володіння спільним операторським секретом gateway
  - ігнорує вужчий `x-openclaw-scopes`
  - відновлює повний операторський набір областей дії за замовчуванням:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - розглядає ходи чату на цій кінцевій точці як ходи відправника-власника
- довірені HTTP-режими з ідентичністю (наприклад, автентифікація через довірений проксі або `gateway.auth.mode="none"` на приватному вхідному доступі)
  - автентифікують певну зовнішню довірену ідентичність або межу розгортання
  - враховують `x-openclaw-scopes`, коли заголовок присутній
  - повертаються до звичайного операторського набору областей дії за замовчуванням, коли заголовок відсутній
  - втрачають семантику власника лише тоді, коли викликач явно звужує області дії та пропускає `operator.admin`

Див. [Безпека](/uk/gateway/security) і [Віддалений доступ](/uk/gateway/remote).

## Контракт моделі з пріоритетом агента

OpenClaw трактує поле OpenAI `model` як **ціль агента**, а не сирий ідентифікатор моделі провайдера.

- `model: "openclaw"` маршрутизує до налаштованого агента за замовчуванням.
- `model: "openclaw/default"` також маршрутизує до налаштованого агента за замовчуванням.
- `model: "openclaw/<agentId>"` маршрутизує до конкретного агента.

Необов’язкові заголовки запиту:

- `x-openclaw-model: <provider/model-or-bare-id>` перевизначає бекенд-модель для вибраного агента.
- `x-openclaw-agent-id: <agentId>` і далі підтримується як перевизначення для сумісності.
- `x-openclaw-session-key: <sessionKey>` повністю керує маршрутизацією сесії.
- `x-openclaw-message-channel: <channel>` задає синтетичний контекст вхідного каналу для підказок і політик, що враховують канал.

Псевдоніми сумісності, які все ще приймаються:

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

За замовчуванням кінцева точка є **безстанною для кожного запиту** (для кожного виклику генерується новий ключ сесії).

Якщо запит містить рядок OpenAI `user`, Gateway виводить із нього стабільний ключ сесії, тож повторні виклики можуть спільно використовувати сесію агента.

## Чому ця поверхня важлива

Це найефективніший набір сумісності для самостійно розгорнутих фронтендів та інструментів:

- Більшість налаштувань Open WebUI, LobeChat і LibreChat очікують `/v1/models`.
- Багато RAG-систем очікують `/v1/embeddings`.
- Наявні чат-клієнти OpenAI зазвичай можуть почати з `/v1/chat/completions`.
- Клієнти, більш орієнтовані на агентів, дедалі частіше віддають перевагу `/v1/responses`.

## Список моделей і маршрутизація агентів

<AccordionGroup>
  <Accordion title="Що повертає `/v1/models`?">
    Список цілей агентів OpenClaw.

    Повернуті ідентифікатори — це записи `openclaw`, `openclaw/default` і `openclaw/<agentId>`.
    Використовуйте їх безпосередньо як значення OpenAI `model`.

  </Accordion>
  <Accordion title="Чи `/v1/models` перелічує агентів або підагентів?">
    Він перелічує цілі агентів верхнього рівня, а не бекенд-моделі провайдерів і не підагентів.

    Підагенті залишаються внутрішньою топологією виконання. Вони не з’являються як псевдомоделі.

  </Accordion>
  <Accordion title="Чому включено `openclaw/default`?">
    `openclaw/default` — це стабільний псевдонім для налаштованого агента за замовчуванням.

    Це означає, що клієнти можуть продовжувати використовувати один передбачуваний ідентифікатор, навіть якщо справжній ідентифікатор агента за замовчуванням змінюється між середовищами.

  </Accordion>
  <Accordion title="Як перевизначити бекенд-модель?">
    Використовуйте `x-openclaw-model`.

    Приклади:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Якщо його опустити, вибраний агент працюватиме зі своїм звичайним налаштованим вибором моделі.

  </Accordion>
  <Accordion title="Як embeddings вписуються в цей контракт?">
    `/v1/embeddings` використовує ті самі agent-target ідентифікатори `model`.

    Використовуйте `model: "openclaw/default"` або `model: "openclaw/<agentId>"`.
    Коли потрібна конкретна модель embeddings, надішліть її в `x-openclaw-model`.
    Без цього заголовка запит передається до звичайного налаштування embeddings вибраного агента.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Установіть `stream: true`, щоб отримувати Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Кожен рядок події має формат `data: <json>`
- Stream завершується `data: [DONE]`

## Контракт інструментів чату

`/v1/chat/completions` підтримує підмножину function-tool, сумісну з поширеними клієнтами OpenAI Chat.

### Підтримувані поля запиту

- `tools`: масив `{ "type": "function", "function": { ... } }`
- `tool_choice`: `"auto"`, `"none"`
- `messages[*].role: "tool"` подальші ходи
- `messages[*].tool_call_id` для прив’язування результатів інструмента назад до попереднього виклику інструмента
- `max_completion_tokens`: число; обмеження на один виклик для загальної кількості completion tokens (включно з reasoning tokens). Поточна назва поля OpenAI Chat Completions; має перевагу, коли надіслано і `max_completion_tokens`, і `max_tokens`.
- `max_tokens`: число; застарілий псевдонім, приймається для зворотної сумісності. Ігнорується, коли також наявне `max_completion_tokens`.

Коли встановлено будь-яке з цих полів, значення передається upstream-провайдеру через stream-param канал агента. Фактичну назву wire-поля, надіслану upstream-провайдеру, вибирає provider transport: `max_completion_tokens` для endpoint-ів родини OpenAI і `max_tokens` для провайдерів, які приймають лише застарілу назву (наприклад, Mistral і Chutes).

### Непідтримувані варіанти

Endpoint повертає `400 invalid_request_error` для непідтримуваних варіантів інструментів, зокрема:

- `tools`, що не є масивом
- записи інструментів, що не є function
- відсутній `tool.function.name`
- варіанти `tool_choice`, як-от `allowed_tools` і `custom`
- `tool_choice: "required"` (ще не застосовується під час виконання; буде підтримано після реалізації жорсткого застосування)
- `tool_choice: { "type": "function", "function": { "name": "..." } }` (те саме обґрунтування, що й для `required`)
- значення `tool_choice.function.name`, які не відповідають наданим `tools`

### Форма відповіді інструментів без streaming

Коли агент вирішує викликати інструменти, відповідь використовує:

- `choices[0].finish_reason = "tool_calls"`
- записи `choices[0].message.tool_calls[]` з:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (рядок JSON)

Коментар асистента перед викликом інструмента повертається в `choices[0].message.content` (можливо, порожній).

### Форма відповіді інструментів зі streaming

Коли `stream: true`, виклики інструментів надсилаються як інкрементальні SSE-фрагменти:

- початкова assistant role delta
- необов’язкові assistant commentary deltas
- один або більше фрагментів `delta.tool_calls`, що містять ідентичність інструмента та фрагменти аргументів
- фінальний фрагмент із `finish_reason: "tool_calls"`
- `data: [DONE]`

Якщо `stream_options.include_usage=true`, кінцевий usage-фрагмент надсилається перед `[DONE]`.

### Цикл подальших викликів інструментів

Після отримання `tool_calls` клієнт має виконати запитані функції та надіслати подальший запит, який містить:

- попереднє повідомлення асистента з викликом інструмента
- одне або більше повідомлень `role: "tool"` з відповідним `tool_call_id`

Це дає змогу виконанню агента Gateway продовжити той самий цикл reasoning і створити фінальну відповідь асистента.

## Швидке налаштування Open WebUI

Для базового підключення Open WebUI:

- Base URL: `http://127.0.0.1:18789/v1`
- Docker на macOS base URL: `http://host.docker.internal:18789/v1`
- API key: ваш bearer token Gateway
- Model: `openclaw/default`

Очікувана поведінка:

- `GET /v1/models` має перелічити `openclaw/default`
- Open WebUI має використовувати `openclaw/default` як ідентифікатор моделі чату
- Якщо вам потрібен конкретний backend provider/model для цього агента, установіть звичайну модель за замовчуванням агента або надішліть `x-openclaw-model`

Швидка smoke-перевірка:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Якщо це повертає `openclaw/default`, більшість налаштувань Open WebUI можуть підключитися з тим самим base URL і token.

## Приклади

Без streaming:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Streaming:

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
- `openclaw/default` завжди наявний, тож один стабільний ідентифікатор працює в різних середовищах.
- Перевизначення бекендного провайдера/моделі мають задаватися в `x-openclaw-model`, а не в полі OpenAI `model`.
- `/v1/embeddings` підтримує `input` як рядок або масив рядків.

## Пов’язане

- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [OpenAI](/uk/providers/openai)

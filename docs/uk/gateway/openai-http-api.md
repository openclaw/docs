---
read_when:
    - Інтеграція інструментів, які очікують OpenAI Chat Completions
summary: Відкрийте OpenAI-сумісну HTTP-кінцеву точку /v1/chat/completions із Gateway
title: Завершення чату OpenAI
x-i18n:
    generated_at: "2026-06-27T17:34:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8746f4f5964a5d0b948877b64b5d20440dea3aa45b36813c404cd06660792cf
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

Під капотом запити виконуються як звичайний агентський запуск Gateway (той самий шлях коду, що й `openclaw agent`), тому маршрутизація/дозволи/конфігурація відповідають вашому Gateway.

## Автентифікація

Використовує конфігурацію автентифікації Gateway.

Поширені шляхи HTTP-автентифікації:

- автентифікація зі спільним секретом (`gateway.auth.mode="token"` або `"password"`):
  `Authorization: Bearer <token-or-password>`
- довірена HTTP-автентифікація з ідентичністю (`gateway.auth.mode="trusted-proxy"`):
  маршрутизуйте через налаштований проксі з підтримкою ідентичності й дозвольте йому вставити
  потрібні заголовки ідентичності
- відкрита автентифікація для приватного входу (`gateway.auth.mode="none"`):
  заголовок автентифікації не потрібен

Примітки:

- Коли `gateway.auth.mode="token"`, використовуйте `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
- Коли `gateway.auth.mode="password"`, використовуйте `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
- Коли `gateway.auth.mode="trusted-proxy"`, HTTP-запит має надходити з
  налаштованого довіреного джерела проксі; loopback-проксі на тому самому хості потребують явного
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Внутрішні викликачі на тому самому хості, які обходять проксі, можуть використовувати
  `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` як локальний прямий
  резервний варіант. Будь-які докази в заголовках `Forwarded`, `X-Forwarded-*` або `X-Real-IP`
  натомість залишають запит на шляху trusted-proxy.
- Якщо `gateway.auth.rateLimit` налаштовано й стається забагато невдалих спроб автентифікації, кінцева точка повертає `429` з `Retry-After`.

## Межа безпеки (важливо)

Розглядайте цю кінцеву точку як поверхню з **повним операторським доступом** до екземпляра Gateway.

- HTTP bearer-автентифікація тут не є вузькою моделлю областей доступу на користувача.
- Дійсний токен/пароль Gateway для цієї кінцевої точки слід розглядати як облікові дані власника/оператора.
- Запити проходять через той самий агентський шлях площини керування, що й довірені операторські дії.
- Для цієї кінцевої точки немає окремої межі інструментів для невласників/окремих користувачів; коли викликач проходить автентифікацію Gateway тут, OpenClaw розглядає цього викликача як довіреного оператора для цього Gateway.
- Для режимів автентифікації зі спільним секретом (`token` і `password`) кінцева точка відновлює звичайні повні операторські значення за замовчуванням, навіть якщо викликач надсилає вужчий заголовок `x-openclaw-scopes`.
- Довірені HTTP-режими з ідентичністю (наприклад, автентифікація через довірений проксі або `gateway.auth.mode="none"`) враховують `x-openclaw-scopes`, коли він присутній, а інакше повертаються до звичайного набору операторських областей за замовчуванням.
- Якщо цільова політика агента дозволяє чутливі інструменти, ця кінцева точка може їх використовувати.
- Тримайте цю кінцеву точку лише на loopback/tailnet/приватному вході; не відкривайте її напряму в публічний інтернет.

Матриця автентифікації:

- `gateway.auth.mode="token"` або `"password"` + `Authorization: Bearer ...`
  - доводить володіння спільним операторським секретом gateway
  - ігнорує вужчий `x-openclaw-scopes`
  - відновлює повний набір операторських областей за замовчуванням:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - розглядає чат-ходи на цій кінцевій точці як ходи від власника-відправника
- довірені HTTP-режими з ідентичністю (наприклад, автентифікація через довірений проксі або `gateway.auth.mode="none"` на приватному вході)
  - автентифікують певну зовнішню довірену ідентичність або межу розгортання
  - враховують `x-openclaw-scopes`, коли заголовок присутній
  - повертаються до звичайного набору операторських областей за замовчуванням, коли заголовок відсутній
  - втрачають семантику власника лише тоді, коли викликач явно звужує області й опускає `operator.admin`
  - потребують `operator.admin` для елементів керування запитом рівня власника, як-от `x-openclaw-model`

Див. [Безпека](/uk/gateway/security) і [Віддалений доступ](/uk/gateway/remote).

## Коли використовувати цю кінцеву точку

Використовуйте `/v1/chat/completions`, коли інтегруєте інструменти або довірений бекенд на боці застосунку з наявним gateway і можете безпечно зберігати операторські облікові дані gateway.

- Надавайте перевагу цьому замість додавання нового вбудованого каналу, коли ваша інтеграція є просто ще однією операторською/клієнтською поверхнею для того самого gateway.
- Для нативних мобільних клієнтів, які підключаються напряму до віддаленого gateway, надавайте перевагу [WebChat](/uk/web/webchat) або [Gateway Protocol](/uk/gateway/protocol) і реалізуйте потік paired-device bootstrap/device-token, щоб пристрою не був потрібен спільний HTTP-токен/пароль.
- Натомість створіть Plugin каналу, коли інтегруєте зовнішню мережу повідомлень із власними користувачами, кімнатами, доставкою Webhook або вихідним транспортом. Див. [Створення Plugin](/uk/plugins/building-plugins).

## Контракт моделі з пріоритетом агента

OpenClaw розглядає поле OpenAI `model` як **ціль агента**, а не як сирий ідентифікатор моделі провайдера.

- `model: "openclaw"` маршрутизує до налаштованого агента за замовчуванням.
- `model: "openclaw/default"` також маршрутизує до налаштованого агента за замовчуванням.
- `model: "openclaw/<agentId>"` маршрутизує до конкретного агента.

Необов’язкові заголовки запиту:

- `x-openclaw-model: <provider/model-or-bare-id>` перевизначає бекенд-модель для вибраного агента. Викликачі зі спільним секретом bearer можуть використовувати цей заголовок. Викликачам з ідентичністю, як-от trusted-proxy або приватні запити без автентифікації з `x-openclaw-scopes`, потрібен `operator.admin`; викликачі лише з правом запису отримують `403 missing scope: operator.admin`.
- `x-openclaw-agent-id: <agentId>` залишається підтримуваним як сумісне перевизначення.
- `x-openclaw-session-key: <sessionKey>` явно керує маршрутизацією сесії. Значення не має використовувати зарезервовані внутрішні простори імен сесій, як-от `subagent:`, `cron:` або `acp:`; такі запити відхиляються з `400 invalid_request_error`.
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

За замовчуванням кінцева точка є **безстановою для кожного запиту** (новий ключ сесії генерується під час кожного виклику).

Якщо запит містить рядок OpenAI `user`, Gateway виводить із нього стабільний ключ сесії, тому повторні виклики можуть спільно використовувати агентську сесію.

Для користувацьких застосунків найбезпечніше за замовчуванням повторно використовувати те саме значення `user` для кожної гілки розмови. Уникайте ідентифікаторів рівня облікового запису, якщо ви явно не хочете, щоб кілька розмов або пристроїв спільно використовували одну сесію OpenClaw. Використовуйте `x-openclaw-session-key` лише тоді, коли вам потрібен явний контроль маршрутизації між кількома клієнтами або гілками, і вибирайте ключі, що належать застосунку та не починаються із зарезервованих внутрішніх просторів імен, як-от `subagent:`, `cron:` або `acp:`.

## Чому ця поверхня важлива

Це найцінніший набір сумісності для self-hosted фронтендів та інструментів:

- Більшість налаштувань Open WebUI, LobeChat і LibreChat очікують `/v1/models`.
- Багато RAG-систем очікують `/v1/embeddings`.
- Наявні чат-клієнти OpenAI зазвичай можуть почати з `/v1/chat/completions`.
- Клієнти, більш нативні для агентів, дедалі частіше надають перевагу `/v1/responses`.

## Список моделей і маршрутизація агентів

<AccordionGroup>
  <Accordion title="Що повертає `/v1/models`?">
    Список цілей агентів OpenClaw.

    Повернені ідентифікатори — це записи `openclaw`, `openclaw/default` і `openclaw/<agentId>`.
    Використовуйте їх напряму як значення OpenAI `model`.

  </Accordion>
  <Accordion title="Чи `/v1/models` перелічує агентів або під-агентів?">
    Він перелічує цілі агентів верхнього рівня, а не бекенд-моделі провайдерів і не під-агентів.

    Під-агенти залишаються внутрішньою топологією виконання. Вони не з’являються як псевдомоделі.

  </Accordion>
  <Accordion title="Чому включено `openclaw/default`?">
    `openclaw/default` — це стабільний псевдонім для налаштованого агента за замовчуванням.

    Це означає, що клієнти можуть продовжувати використовувати один передбачуваний ідентифікатор, навіть якщо справжній ідентифікатор агента за замовчуванням змінюється між середовищами.

  </Accordion>
  <Accordion title="Як перевизначити бекенд-модель?">
    Використовуйте `x-openclaw-model`. Це перевизначення рівня власника: воно працює зі шляхом токена/пароля bearer зі спільним секретом Gateway і потребує `operator.admin` на HTTP-шляхах з ідентичністю, як-от автентифікація через довірений проксі.

    Приклади:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Якщо ви його опустите, вибраний агент працюватиме зі своїм звичайним налаштованим вибором моделі.

  </Accordion>
  <Accordion title="Як embeddings вписуються в цей контракт?">
    `/v1/embeddings` використовує ті самі ідентифікатори `model` для цілей агентів.

    Використовуйте `model: "openclaw/default"` або `model: "openclaw/<agentId>"`.
    Коли вам потрібна конкретна модель embeddings, надішліть її в `x-openclaw-model` від викликача зі спільним секретом або викликача з ідентичністю, який має `operator.admin`.
    Без цього заголовка запит передається до звичайного налаштування embeddings вибраного агента.

  </Accordion>
</AccordionGroup>

## Потокове передавання (SSE)

Установіть `stream: true`, щоб отримувати Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Кожен рядок події має вигляд `data: <json>`
- Потік завершується `data: [DONE]`

## Контракт чат-інструментів

`/v1/chat/completions` підтримує підмножину function-tool, сумісну з поширеними клієнтами OpenAI Chat.

### Підтримувані поля запиту

- `tools`: масив `{ "type": "function", "function": { ... } }`
- `tool_choice`: `"auto"`, `"none"`, `"required"` або `{ "type": "function", "function": { "name": "..." } }`
- `messages[*].role: "tool"` подальші ходи
- `messages[*].tool_call_id` для прив’язування результатів інструмента назад до попереднього виклику інструмента
- `max_completion_tokens`: число; ліміт на виклик для загальної кількості токенів завершення (включно з reasoning-токенами). Поточна назва поля OpenAI Chat Completions; бажана, коли надсилаються і `max_completion_tokens`, і `max_tokens`.
- `max_tokens`: число; застарілий псевдонім, прийнятий для зворотної сумісності. Ігнорується, коли також присутній `max_completion_tokens`.
- `temperature`: число; best-effort температура семплінгу, що передається upstream-провайдеру через канал stream-param агента.
- `top_p`: число; best-effort nucleus sampling, що передається upstream-провайдеру через канал stream-param агента.
- `frequency_penalty`: число; best-effort штраф частоти, що передається upstream-провайдеру через канал stream-param агента. Перевірений діапазон: -2.0 до 2.0. Повертає `400 invalid_request_error` для значень поза діапазоном.
- `presence_penalty`: число; best-effort штраф присутності, що передається upstream-провайдеру через канал stream-param агента. Перевірений діапазон: -2.0 до 2.0. Повертає `400 invalid_request_error` для значень поза діапазоном.
- `seed`: число (ціле); best-effort seed, що передається upstream-провайдеру через канал stream-param агента. Повертає `400 invalid_request_error` для нецілих значень.
- `stop`: рядок або масив до 4 рядків; best-effort стоп-послідовності, що передаються upstream-провайдеру через канал stream-param агента. Повертає `400 invalid_request_error` для понад 4 послідовностей або нерядкових/порожніх елементів.

Коли задано будь-яке поле обмеження токенів, значення передається upstream-провайдеру через канал stream-param агента. Фактичну назву wire-поля, яку надсилають upstream-провайдеру, вибирає транспорт провайдера: `max_completion_tokens` для endpoint-ів сімейства OpenAI і `max_tokens` для провайдерів, які приймають лише застарілу назву (наприклад, Mistral і Chutes). Поля семплінгу (`temperature`, `top_p`, `frequency_penalty`, `presence_penalty`, `seed`) проходять тим самим каналом stream-param; backend Codex Responses на основі ChatGPT вилучає їх на боці сервера, оскільки використовує фіксований семплінг. `stop` також передається каналом stream-param і зіставляється з полем stop транспорту (`stop` для backend-ів Chat Completions, `stop_sequences` для Anthropic); OpenAI Responses API не має параметра stop, тому `stop` не застосовується до моделей на основі Responses.

### Непідтримувані варіанти

Endpoint повертає `400 invalid_request_error` для непідтримуваних варіантів інструментів, зокрема:

- `tools`, що не є масивом
- записи інструментів, що не є function
- відсутній `tool.function.name`
- варіанти `tool_choice`, як-от `allowed_tools` і `custom`
- значення `tool_choice.function.name`, які не відповідають наданим `tools`

Для `tool_choice: "required"` і прив’язаного до function `tool_choice` endpoint звужує відкритий клієнту набір function-tool, наказує runtime викликати клієнтський інструмент перед відповіддю та повертає помилку, якщо відповідь агента не містить відповідного структурованого виклику клієнтського інструмента. Цей контракт застосовується до наданого викликачем HTTP-списку `tools`, а не до кожного внутрішнього інструмента агента OpenClaw.

### Форма відповіді інструмента без стримінгу

Коли агент вирішує викликати інструменти, відповідь використовує:

- записи `choices[0].finish_reason = "tool_calls"`
- `choices[0].message.tool_calls[]` з:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (рядок JSON)

Коментар assistant перед викликом інструмента повертається в `choices[0].message.content` (можливо, порожньому).

### Форма відповіді інструмента зі стримінгом

Коли `stream: true`, виклики інструментів надсилаються як інкрементальні SSE-фрагменти:

- початкова дельта ролі assistant
- необов’язкові дельти коментаря assistant
- один або кілька фрагментів `delta.tool_calls`, що містять ідентичність інструмента та фрагменти аргументів
- фінальний фрагмент із `finish_reason: "tool_calls"`
- `data: [DONE]`

Якщо `stream_options.include_usage=true`, кінцевий фрагмент usage надсилається перед `[DONE]`.

### Цикл продовження після інструмента

Після отримання `tool_calls` клієнт має виконати запитані function(s) і надіслати подальший запит, який містить:

- попереднє повідомлення assistant із викликом інструмента
- одне або кілька повідомлень `role: "tool"` з відповідним `tool_call_id`

Це дає змогу запуску агента Gateway продовжити той самий цикл міркування та створити фінальну відповідь assistant.

## Швидке налаштування Open WebUI

Для базового підключення Open WebUI:

- Базова URL-адреса: `http://127.0.0.1:18789/v1`
- Базова URL-адреса Docker на macOS: `http://host.docker.internal:18789/v1`
- API-ключ: ваш bearer-токен Gateway
- Модель: `openclaw/default`

Очікувана поведінка:

- `GET /v1/models` має показувати `openclaw/default`
- Open WebUI має використовувати `openclaw/default` як id моделі чату
- Якщо для цього агента потрібен конкретний backend-провайдер/модель, задайте звичайну модель за замовчуванням агента або надішліть `x-openclaw-model` від викликача зі shared-secret чи викликача з ідентичністю та `operator.admin`

Швидка smoke-перевірка:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Якщо це повертає `openclaw/default`, більшість налаштувань Open WebUI можуть підключитися з тією самою базовою URL-адресою та токеном.

## Приклади

Стабільна сесія для однієї розмови в застосунку:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "user": "conv:YOUR_CONVERSATION_ID",
    "messages": [{"role":"user","content":"Summarize my tasks for today"}]
  }'
```

Повторно використовуйте те саме значення `user` у пізніших викликах для цієї розмови, щоб продовжити ту саму сесію агента.

Без стримінгу:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Зі стримінгом:

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

- `/v1/models` повертає цілі агентів OpenClaw, а не сирі каталоги провайдерів.
- `openclaw/default` завжди наявний, тож один стабільний id працює в різних середовищах.
- Перевизначення backend-провайдера/моделі мають бути в `x-openclaw-model`, а не в полі OpenAI `model`. На HTTP-шляхах автентифікації з ідентичністю цей заголовок потребує `operator.admin`.
- `/v1/embeddings` підтримує `input` як рядок або масив рядків.

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference)
- [OpenAI](/uk/providers/openai)

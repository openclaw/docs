---
read_when:
    - Інтеграція клієнтів, які підтримують OpenResponses API
    - Вам потрібні вхідні дані на основі елементів, виклики інструментів клієнта або події SSE
summary: Відкрийте з Gateway HTTP-ендпоїнт /v1/responses, сумісний з OpenResponses
title: API OpenResponses
x-i18n:
    generated_at: "2026-05-06T05:49:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69d46dc448a8856a6f3213f2fbfdba000a342ec4dcf258435b7029102cfb8119
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

Gateway OpenClaw може обслуговувати сумісну з OpenResponses кінцеву точку `POST /v1/responses`.

Ця кінцева точка **вимкнена за замовчуванням**. Спочатку увімкніть її в конфігурації.

- `POST /v1/responses`
- Той самий порт, що й Gateway (мультиплекс WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

Під капотом запити виконуються як звичайний запуск агента Gateway (той самий шлях коду, що й
`openclaw agent`), тому маршрутизація/дозволи/конфігурація відповідають вашому Gateway.

## Автентифікація, безпека та маршрутизація

Операційна поведінка відповідає [OpenAI Chat Completions](/uk/gateway/openai-http-api):

- використовуйте відповідний шлях HTTP-автентифікації Gateway:
  - автентифікація зі спільним секретом (`gateway.auth.mode="token"` або `"password"`): `Authorization: Bearer <token-or-password>`
  - автентифікація через довірений проксі (`gateway.auth.mode="trusted-proxy"`): проксі-заголовки з урахуванням ідентичності від налаштованого довіреного джерела проксі; проксі local loopback на тому самому хості потребують явного `gateway.auth.trustedProxy.allowLoopback = true`
  - відкрита автентифікація для приватного входу (`gateway.auth.mode="none"`): без заголовка автентифікації
- розглядайте кінцеву точку як повний операторський доступ до екземпляра gateway
- для режимів автентифікації зі спільним секретом (`token` і `password`) ігноруйте вужчі значення `x-openclaw-scopes`, оголошені bearer, і відновлюйте звичайні повні операторські налаштування за замовчуванням
- для довірених HTTP-режимів із передаванням ідентичності (наприклад, автентифікація через довірений проксі або `gateway.auth.mode="none"`) враховуйте `x-openclaw-scopes`, коли він присутній, інакше повертайтеся до звичайного набору операторських областей за замовчуванням
- вибирайте агентів за допомогою `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` або `x-openclaw-agent-id`
- використовуйте `x-openclaw-model`, коли потрібно перевизначити бекенд-модель вибраного агента
- використовуйте `x-openclaw-session-key` для явної маршрутизації сеансу
- використовуйте `x-openclaw-message-channel`, коли потрібен нестандартний контекст синтетичного вхідного каналу

Матриця автентифікації:

- `gateway.auth.mode="token"` або `"password"` + `Authorization: Bearer ...`
  - підтверджує володіння спільним операторським секретом gateway
  - ігнорує вужчий `x-openclaw-scopes`
  - відновлює повний набір операторських областей за замовчуванням:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - розглядає ходи чату на цій кінцевій точці як ходи відправника-власника
- довірені HTTP-режими з передаванням ідентичності (наприклад, автентифікація через довірений проксі або `gateway.auth.mode="none"` на приватному вході)
  - враховують `x-openclaw-scopes`, коли заголовок присутній
  - повертаються до звичайного набору операторських областей за замовчуванням, коли заголовок відсутній
  - втрачають семантику власника лише тоді, коли викликач явно звужує області й опускає `operator.admin`

Увімкніть або вимкніть цю кінцеву точку за допомогою `gateway.http.endpoints.responses.enabled`.

Та сама поверхня сумісності також містить:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Канонічне пояснення того, як моделі, націлені на агентів, `openclaw/default`, наскрізне передавання embeddings і перевизначення бекенд-моделі працюють разом, див. у [OpenAI Chat Completions](/uk/gateway/openai-http-api#agent-first-model-contract) та [Список моделей і маршрутизація агентів](/uk/gateway/openai-http-api#model-list-and-agent-routing).

## Поведінка сеансу

За замовчуванням кінцева точка **не зберігає стан між запитами** (новий ключ сеансу генерується під час кожного виклику).

Якщо запит містить рядок OpenResponses `user`, Gateway виводить із нього стабільний ключ сеансу,
тому повторні виклики можуть спільно використовувати сеанс агента.

## Форма запиту (підтримується)

Запит відповідає API OpenResponses із вхідними даними на основі елементів. Поточна підтримка:

- `input`: рядок або масив об’єктів елементів.
- `instructions`: об’єднується із системним prompt.
- `tools`: визначення клієнтських інструментів (функціональні інструменти).
- `tool_choice`: фільтрує або вимагає клієнтські інструменти.
- `stream`: вмикає потокове передавання SSE.
- `max_output_tokens`: ліміт виводу за найкращою спробою (залежить від provider).
- `user`: стабільна маршрутизація сеансу.

Приймається, але **наразі ігнорується**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Підтримується:

- `previous_response_id`: OpenClaw повторно використовує попередній сеанс відповіді, коли запит залишається в межах тієї самої області агента/користувача/запитаного сеансу.

## Елементи (вхідні дані)

### `message`

Ролі: `system`, `developer`, `user`, `assistant`.

- `system` і `developer` додаються до системного prompt.
- Найновіший елемент `user` або `function_call_output` стає "поточним повідомленням."
- Попередні повідомлення користувача/асистента включаються як історія для контексту.

### `function_call_output` (інструменти на основі ходів)

Надсилайте результати інструментів назад до моделі:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` і `item_reference`

Приймаються для сумісності схеми, але ігноруються під час побудови prompt.

## Інструменти (клієнтські функціональні інструменти)

Надавайте інструменти за допомогою `tools: [{ type: "function", function: { name, description?, parameters? } }]`.

Якщо агент вирішує викликати інструмент, відповідь повертає вихідний елемент `function_call`.
Потім надішліть подальший запит із `function_call_output`, щоб продовжити хід.

## Зображення (`input_image`)

Підтримує джерела base64 або URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Дозволені типи MIME (поточні): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
Максимальний розмір (поточний): 10MB.

## Файли (`input_file`)

Підтримує джерела base64 або URL:

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

Дозволені типи MIME (поточні): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

Максимальний розмір (поточний): 5MB.

Поточна поведінка:

- Вміст файлу декодується й додається до **системного prompt**, а не до повідомлення користувача,
  тому він залишається ефемерним (не зберігається в історії сеансу).
- Декодований текст файлу обгортається як **недовірений зовнішній вміст** перед додаванням,
  тому байти файлу розглядаються як дані, а не як довірені інструкції.
- Вставлений блок використовує явні маркери меж, як-от
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`, і містить рядок метаданих
  `Source: External`.
- Цей шлях введення файлів навмисно пропускає довгий банер `SECURITY NOTICE:`, щоб
  зберегти бюджет prompt; маркери меж і метадані все одно залишаються на місці.
- PDF спочатку аналізуються для вилучення тексту. Якщо знайдено мало тексту, перші сторінки
  растеризуються в зображення й передаються моделі, а вставлений файловий блок використовує
  placeholder `[PDF content rendered to images]`.

Аналіз PDF забезпечує вбудований Plugin `document-extract`, який використовує
сумісну з Node legacy-збірку `pdfjs-dist` (без worker). Сучасна збірка PDF.js
очікує browser workers/DOM globals, тому вона не використовується в Gateway.

Параметри отримання URL за замовчуванням:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (загальна кількість URL-частин `input_file` + `input_image` на запит)
- Запити захищені (DNS-резолюція, блокування приватних IP, обмеження перенаправлень, тайм-аути).
- Необов’язкові списки дозволених імен хостів підтримуються для кожного типу вхідних даних (`files.urlAllowlist`, `images.urlAllowlist`).
  - Точний хост: `"cdn.example.com"`
  - Піддомени з wildcard: `"*.assets.example.com"` (не збігається з apex)
  - Порожні або пропущені списки дозволених означають відсутність обмеження за списком дозволених імен хостів.
- Щоб повністю вимкнути отримання на основі URL, установіть `files.allowUrl: false` та/або `images.allowUrl: false`.

## Ліміти файлів і зображень (конфігурація)

Значення за замовчуванням можна налаштувати в `gateway.http.endpoints.responses`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxUrlParts: 8,
          files: {
            allowUrl: true,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "text/plain",
              "text/markdown",
              "text/html",
              "text/csv",
              "application/json",
              "application/pdf",
            ],
            maxBytes: 5242880,
            maxChars: 200000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            urlAllowlist: ["images.example.com"],
            allowedMimes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/heic",
              "image/heif",
            ],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

Значення за замовчуванням, якщо опущено:

- `maxBodyBytes`: 20MB
- `maxUrlParts`: 8
- `files.maxBytes`: 5MB
- `files.maxChars`: 200k
- `files.maxRedirects`: 3
- `files.timeoutMs`: 10s
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4,000,000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10s
- Джерела HEIC/HEIF `input_image` приймаються й нормалізуються до JPEG перед доставкою provider.

Примітка щодо безпеки:

- Списки дозволених URL застосовуються перед отриманням і на кроках перенаправлення.
- Додавання імені хоста до списку дозволених не обходить блокування приватних/внутрішніх IP.
- Для gateway, відкритих в інтернет, застосовуйте керування мережевим egress додатково до захистів на рівні застосунку.
  Див. [Безпека](/uk/gateway/security).

## Потокове передавання (SSE)

Установіть `stream: true`, щоб отримувати Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Кожен рядок події має вигляд `event: <type>` і `data: <json>`
- Потік завершується `data: [DONE]`

Типи подій, які наразі надсилаються:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (у разі помилки)

## Використання

`usage` заповнюється, коли базовий provider повідомляє кількість токенів.
OpenClaw нормалізує поширені псевдоніми в стилі OpenAI до того, як ці лічильники потраплять
у downstream-поверхні статусу/сеансу, зокрема `input_tokens` / `output_tokens`
і `prompt_tokens` / `completion_tokens`.

## Помилки

Помилки використовують JSON-об’єкт на кшталт:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Поширені випадки:

- `401` відсутня/недійсна автентифікація
- `400` недійсне тіло запиту
- `405` неправильний метод

## Приклади

Без потокового передавання:

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "hi"
  }'
```

Із потоковим передаванням:

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "hi"
  }'
```

## Пов’язане

- [OpenAI chat completions](/uk/gateway/openai-http-api)
- [OpenAI](/uk/providers/openai)

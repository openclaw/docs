---
read_when:
    - Інтеграція клієнтів, які використовують API OpenResponses
    - Вам потрібні input на основі елементів, клієнтські виклики інструментів або SSE-події
summary: Відкрити сумісну з OpenResponses HTTP-кінцеву точку `/v1/responses` із Gateway
title: API OpenResponses
x-i18n:
    generated_at: "2026-04-24T18:10:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: d286b0626aaf699537658264f5daff9185ee102234555b269f6d79edd3a68d6f
    source_path: gateway/openresponses-http-api.md
    workflow: 15
---

Gateway OpenClaw може надавати сумісну з OpenResponses кінцеву точку `POST /v1/responses`.

Цю кінцеву точку **вимкнено за замовчуванням**. Спочатку увімкніть її в конфігурації.

- `POST /v1/responses`
- Той самий порт, що й у Gateway (мультиплексування WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

Під капотом запити виконуються як звичайний запуск агента Gateway (той самий шлях коду, що й
`openclaw agent`), тож маршрутизація/дозволи/конфігурація збігаються з вашим Gateway.

## Автентифікація, безпека та маршрутизація

Робоча поведінка відповідає [OpenAI Chat Completions](/uk/gateway/openai-http-api):

- використовуйте відповідний шлях HTTP-автентифікації Gateway:
  - автентифікація зі спільним секретом (`gateway.auth.mode="token"` або `"password"`): `Authorization: Bearer <token-or-password>`
  - автентифікація через trusted-proxy (`gateway.auth.mode="trusted-proxy"`): заголовки проксі з урахуванням ідентичності від налаштованого довіреного джерела trusted proxy не на loopback
  - відкрита автентифікація для приватного ingress (`gateway.auth.mode="none"`): без заголовка автентифікації
- розглядайте кінцеву точку як повний операторський доступ до екземпляра gateway
- для режимів автентифікації зі спільним секретом (`token` і `password`) ігноруйте вужчі значення `x-openclaw-scopes`, оголошені через bearer, і відновлюйте звичайні типові повні операторські значення
- для довірених HTTP-режимів із передаванням ідентичності (наприклад, автентифікація через trusted proxy або `gateway.auth.mode="none"`) враховуйте `x-openclaw-scopes`, якщо заголовок присутній, інакше повертайтеся до звичайного типового набору операторських scope
- вибирайте агентів через `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` або `x-openclaw-agent-id`
- використовуйте `x-openclaw-model`, якщо хочете перевизначити бекенд-модель вибраного агента
- використовуйте `x-openclaw-session-key` для явної маршрутизації сесії
- використовуйте `x-openclaw-message-channel`, якщо вам потрібен нетиповий синтетичний контекст вхідного каналу

Матриця автентифікації:

- `gateway.auth.mode="token"` або `"password"` + `Authorization: Bearer ...`
  - доводить володіння спільним операторським секретом gateway
  - ігнорує вужчі `x-openclaw-scopes`
  - відновлює повний типовий набір операторських scope:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - розглядає чат-цикли на цій кінцевій точці як цикли відправника-власника
- довірені HTTP-режими з передаванням ідентичності (наприклад, автентифікація через trusted proxy або `gateway.auth.mode="none"` на приватному ingress)
  - враховують `x-openclaw-scopes`, коли заголовок присутній
  - повертаються до звичайного типового набору операторських scope, коли заголовок відсутній
  - втрачають семантику власника лише тоді, коли викликач явно звужує scope і пропускає `operator.admin`

Увімкнути або вимкнути цю кінцеву точку можна через `gateway.http.endpoints.responses.enabled`.

Та сама поверхня сумісності також включає:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Щоб отримати канонічне пояснення того, як поєднуються моделі, націлені на агентів, `openclaw/default`, наскрізна передача embeddings і перевизначення бекенд-моделей, див. [OpenAI Chat Completions](/uk/gateway/openai-http-api#agent-first-model-contract) і [Список моделей і маршрутизація агентів](/uk/gateway/openai-http-api#model-list-and-agent-routing).

## Поведінка сесії

За замовчуванням кінцева точка є **безстановою для кожного запиту** (для кожного виклику генерується новий ключ сесії).

Якщо запит містить рядок `user` OpenResponses, Gateway виводить із нього стабільний ключ сесії,
щоб повторні виклики могли спільно використовувати сесію агента.

## Форма запиту (підтримується)

Запит дотримується API OpenResponses з item-based input. Поточна підтримка:

- `input`: рядок або масив об’єктів item.
- `instructions`: об’єднується із system prompt.
- `tools`: визначення клієнтських інструментів (function tools).
- `tool_choice`: фільтрує або вимагає клієнтські інструменти.
- `stream`: вмикає SSE-потік.
- `max_output_tokens`: best-effort ліміт виведення (залежить від provider).
- `user`: стабільна маршрутизація сесії.

Приймаються, але **поки що ігноруються**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Підтримується:

- `previous_response_id`: OpenClaw повторно використовує сесію попередньої відповіді, коли запит залишається в межах того самого агента/користувача/запитаної сесії.

## Items (input)

### `message`

Ролі: `system`, `developer`, `user`, `assistant`.

- `system` і `developer` додаються до system prompt.
- Найновіший item `user` або `function_call_output` стає “поточним повідомленням”.
- Попередні повідомлення user/assistant включаються як історія для контексту.

### `function_call_output` (інструменти на основі turn)

Надішліть результати інструмента назад до моделі:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` і `item_reference`

Приймаються для сумісності зі схемою, але ігноруються під час побудови prompt.

## Tools (клієнтські function tools)

Надавайте інструменти через `tools: [{ type: "function", function: { name, description?, parameters? } }]`.

Якщо агент вирішить викликати інструмент, відповідь поверне output item `function_call`.
Після цього ви надсилаєте наступний запит із `function_call_output`, щоб продовжити цикл.

## Зображення (`input_image`)

Підтримує джерела base64 або URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Дозволені MIME-типи (поточні): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
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

Дозволені MIME-типи (поточні): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

Максимальний розмір (поточний): 5MB.

Поточна поведінка:

- Вміст файлу декодується й додається до **system prompt**, а не до повідомлення користувача,
  тому він залишається ефемерним (не зберігається в історії сесії).
- Декодований текст файлу обгортається як **ненадійний зовнішній вміст** перед додаванням,
  тому байти файлу трактуються як дані, а не як довірені інструкції.
- Інжектований блок використовує явні маркери меж на кшталт
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` і включає рядок метаданих
  `Source: External`.
- Цей шлях input файлів навмисно пропускає довгий банер `SECURITY NOTICE:`,
  щоб зберегти бюджет prompt; маркери меж і метадані при цьому все одно зберігаються.
- Для PDF спочатку виконується парсинг тексту. Якщо тексту знайдено мало, перші сторінки
  растеризуються в зображення й передаються моделі, а інжектований файловий блок використовує
  заповнювач `[PDF content rendered to images]`.

Парсинг PDF використовує `pdfjs-dist` legacy build, придатний для Node (без worker). Сучасний
build PDF.js очікує браузерні worker-и/DOM globals, тому в Gateway не використовується.

Типові параметри завантаження URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (загальна кількість URL-частин `input_file` + `input_image` на запит)
- Запити захищені (DNS-резолюція, блокування приватних IP, обмеження редиректів, тайм-аути).
- Для кожного типу input підтримуються необов’язкові allowlist-и імен хостів (`files.urlAllowlist`, `images.urlAllowlist`).
  - Точний хост: `"cdn.example.com"`
  - Піддомени з wildcard: `"*.assets.example.com"` (не збігається з apex-доменом)
  - Порожні або пропущені allowlist-и означають відсутність обмеження allowlist для імен хостів.
- Щоб повністю вимкнути завантаження за URL, установіть `files.allowUrl: false` і/або `images.allowUrl: false`.

## Обмеження файлів і зображень (конфігурація)

Типові значення можна налаштувати в `gateway.http.endpoints.responses`:

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

Типові значення, якщо їх не вказано:

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
- Джерела `input_image` у форматах HEIC/HEIF приймаються й нормалізуються до JPEG перед передаванням provider.

Примітка щодо безпеки:

- Allowlist-и URL застосовуються до завантаження та на кожному кроці редиректу.
- Додавання імені хоста до allowlist не обходить блокування приватних/внутрішніх IP.
- Для gateway, доступних з інтернету, застосовуйте засоби контролю вихідного мережевого трафіку на додачу до захисту на рівні застосунку.
  Див. [Безпека](/uk/gateway/security).

## Потокова передача (SSE)

Установіть `stream: true`, щоб отримувати Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Кожен рядок події має формат `event: <type>` і `data: <json>`
- Потік завершується `data: [DONE]`

Типи подій, що зараз надсилаються:

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
OpenClaw нормалізує поширені псевдоніми у стилі OpenAI до того, як ці лічильники
потрапляють у нижчі рівні поверхонь status/session, зокрема `input_tokens` / `output_tokens`
і `prompt_tokens` / `completion_tokens`.

## Помилки

Помилки використовують JSON-об’єкт на кшталт:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Поширені випадки:

- `401` відсутня/некоректна автентифікація
- `400` некоректне тіло запиту
- `405` неправильний метод

## Приклади

Без потоку:

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

Потоково:

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

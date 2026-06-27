---
read_when:
    - Інтеграція клієнтів, які підтримують OpenResponses API
    - Вам потрібні вхідні дані на основі елементів, виклики клієнтських інструментів або події SSE
summary: Надайте через Gateway HTTP-ендпойнт /v1/responses, сумісний з OpenResponses
title: OpenResponses API
x-i18n:
    generated_at: "2026-06-27T17:34:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbc41a14f5c585a0fb0aae96fb3d2376f94cdb77f41bcd7cc5e7998a27673c44
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

Gateway OpenClaw може надавати OpenResponses-сумісний endpoint `POST /v1/responses`.

Цей endpoint **вимкнено за замовчуванням**. Спочатку увімкніть його в конфігурації.

- `POST /v1/responses`
- Той самий порт, що й Gateway (мультиплекс WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

Під капотом запити виконуються як звичайний запуск агента Gateway (той самий шлях коду, що й
`openclaw agent`), тому маршрутизація/дозволи/конфігурація відповідають вашому Gateway.

## Автентифікація, безпека та маршрутизація

Операційна поведінка відповідає [OpenAI Chat Completions](/uk/gateway/openai-http-api):

- використовуйте відповідний шлях HTTP-автентифікації Gateway:
  - автентифікація зі спільним секретом (`gateway.auth.mode="token"` або `"password"`): `Authorization: Bearer <token-or-password>`
  - автентифікація через довірений проксі (`gateway.auth.mode="trusted-proxy"`): заголовки проксі з урахуванням ідентичності з налаштованого довіреного джерела проксі; проксі same-host loopback вимагають явного `gateway.auth.trustedProxy.allowLoopback = true`
  - локальний прямий резервний варіант довіреного проксі: виклики same-host без заголовків `Forwarded`, `X-Forwarded-*` або `X-Real-IP` можуть використовувати `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`
  - відкрита автентифікація private-ingress (`gateway.auth.mode="none"`): без заголовка автентифікації
- розглядайте endpoint як повний операторський доступ до екземпляра gateway
- для режимів автентифікації зі спільним секретом (`token` і `password`) ігноруйте вужчі значення `x-openclaw-scopes`, оголошені bearer, і відновлюйте звичайні повні операторські значення за замовчуванням
- для довірених HTTP-режимів із передаванням ідентичності (наприклад, автентифікація через довірений проксі або `gateway.auth.mode="none"`) враховуйте `x-openclaw-scopes`, коли він присутній, інакше повертайтеся до звичайного стандартного набору операторських scope
- вибирайте агентів за допомогою `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` або `x-openclaw-agent-id`
- використовуйте `x-openclaw-model`, коли потрібно перевизначити backend model вибраного агента
- використовуйте `x-openclaw-session-key` для явної маршрутизації сесії
- використовуйте `x-openclaw-message-channel`, коли потрібен нестандартний синтетичний контекст ingress-каналу

Матриця автентифікації:

- `gateway.auth.mode="token"` або `"password"` + `Authorization: Bearer ...`
  - доводить володіння спільним операторським секретом gateway
  - ігнорує вужчий `x-openclaw-scopes`
  - відновлює повний стандартний операторський набір scope:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - розглядає ходи чату на цьому endpoint як ходи owner-sender
- довірені HTTP-режими з передаванням ідентичності (наприклад, автентифікація через довірений проксі або `gateway.auth.mode="none"` на private ingress)
  - враховують `x-openclaw-scopes`, коли заголовок присутній
  - повертаються до звичайного стандартного операторського набору scope, коли заголовок відсутній
  - втрачають семантику owner лише тоді, коли викликач явно звужує scope і не вказує `operator.admin`

Увімкніть або вимкніть цей endpoint за допомогою `gateway.http.endpoints.responses.enabled`.

Та сама поверхня сумісності також охоплює:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Канонічне пояснення того, як поєднуються моделі, націлені на агентів, `openclaw/default`, наскрізне передавання embeddings і перевизначення backend model, див. у [OpenAI Chat Completions](/uk/gateway/openai-http-api#agent-first-model-contract) і [Список моделей і маршрутизація агентів](/uk/gateway/openai-http-api#model-list-and-agent-routing).

## Поведінка сесії

За замовчуванням endpoint є **безстанним для кожного запиту** (новий ключ сесії генерується під час кожного виклику).

Якщо запит містить рядок OpenResponses `user`, Gateway виводить із нього стабільний ключ сесії,
тому повторні виклики можуть спільно використовувати сесію агента.

## Форма запиту (підтримується)

Запит відповідає API OpenResponses із введенням на основі елементів. Поточна підтримка:

- `input`: рядок або масив об'єктів елементів.
- `instructions`: об'єднується із системним prompt.
- `tools`: визначення клієнтських інструментів (function tools).
- `tool_choice`: `"auto"`, `"none"`, `"required"` або `{ "type": "function", "name": "..." }` для фільтрування або вимагання клієнтських інструментів.
- `stream`: вмикає SSE-стримінг.
- `max_output_tokens`: output limit за принципом best-effort (залежить від provider).
- `temperature`: sampling temperature за принципом best-effort, що передається provider. Ігнорується backend ChatGPT-based Codex Responses, який використовує фіксований серверний sampling.
- `top_p`: nucleus sampling за принципом best-effort, що передається provider. Те саме застереження Codex Responses, що й для `temperature`.
- `user`: стабільна маршрутизація сесії.

Приймаються, але **наразі ігноруються**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Підтримується:

- `previous_response_id`: OpenClaw повторно використовує попередню сесію відповіді, коли запит залишається в межах того самого scope агента/користувача/запитаної сесії.

## Елементи (`input`)

### `message`

Ролі: `system`, `developer`, `user`, `assistant`.

- `system` і `developer` додаються до системного prompt.
- Найновіший елемент `user` або `function_call_output` стає "поточним повідомленням".
- Попередні повідомлення user/assistant включаються як історія для контексту.

### `function_call_output` (інструменти на основі ходу)

Надсилайте результати інструмента назад до моделі:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` і `item_reference`

Приймаються для сумісності схеми, але ігноруються під час побудови prompt.

## Інструменти (клієнтські function tools)

Надавайте інструменти через `tools: [{ type: "function", name, description?, parameters? }]`.

Якщо агент вирішить викликати інструмент, відповідь поверне вихідний елемент `function_call`.
Потім ви надсилаєте follow-up request із `function_call_output`, щоб продовжити хід.

Для `tool_choice: "required"` і function-pinned `tool_choice` endpoint звужує відкритий набір клієнтських function-tool, інструктує runtime викликати клієнтський інструмент перед відповіддю та відхиляє хід, якщо він не містить відповідного структурованого виклику клієнтського інструмента. Цей контракт застосовується до HTTP-списку `tools`, наданого викликачем, а не до кожного внутрішнього інструмента агента OpenClaw. Нестрімінгові запити повертають `502` з `api_error`; стрімінгові запити випускають подію `response.failed`. Це відповідає контракту `/v1/chat/completions`.

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

- Вміст файлу декодується й додається до **системного prompt**, а не до повідомлення користувача,
  тому він залишається ephemeral (не зберігається в історії сесії).
- Декодований текст файлу обгортається як **недовірений зовнішній вміст** перед додаванням,
  тому байти файлу розглядаються як дані, а не як довірені інструкції.
- Вставлений блок використовує явні boundary markers, як-от
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`, і містить рядок метаданих
  `Source: External`.
- Цей шлях file-input навмисно пропускає довгий банер `SECURITY NOTICE:`, щоб
  зберегти бюджет prompt; boundary markers і метадані все одно залишаються на місці.
- PDF спочатку аналізуються для витягування тексту. Якщо знайдено мало тексту, перші сторінки
  растеризуються в зображення й передаються моделі, а вставлений файловий блок використовує
  placeholder `[PDF content rendered to images]`.

Парсинг PDF забезпечує bundled Plugin `document-extract`, який використовує
`clawpdf` і його packaged PDFium WebAssembly runtime для витягування тексту та
рендерингу сторінок.

Стандартні параметри отримання URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (загальна кількість URL-based частин `input_file` + `input_image` на запит)
- Запити захищаються (DNS-розв'язання, блокування приватних IP, обмеження перенаправлень, тайм-аути).
- Підтримуються необов'язкові allowlist імен хостів для кожного типу введення (`files.urlAllowlist`, `images.urlAllowlist`).
  - Точний хост: `"cdn.example.com"`
  - Wildcard-піддомени: `"*.assets.example.com"` (не збігається з apex)
  - Порожні або пропущені allowlist означають відсутність обмеження allowlist імен хостів.
- Щоб повністю вимкнути URL-based отримання, установіть `files.allowUrl: false` та/або `images.allowUrl: false`.

## Обмеження файлів і зображень (конфігурація)

Стандартні значення можна налаштувати в `gateway.http.endpoints.responses`:

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

Стандартні значення, якщо пропущено:

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
- Джерела HEIC/HEIF `input_image` приймаються, коли доступний системний converter, і нормалізуються до JPEG перед доставкою provider. Підтримувані converters: macOS `sips`, ImageMagick, GraphicsMagick або ffmpeg.

Примітка щодо безпеки:

- URL allowlists застосовуються перед fetch і на переходах перенаправлення.
- Додавання імені хоста до allowlist не обходить блокування приватних/внутрішніх IP.
- Для gateway, відкритих в інтернет, застосовуйте мережеві засоби контролю вихідного трафіку на додаток до захистів рівня застосунку.
  Див. [Безпека](/uk/gateway/security).

## Стримінг (SSE)

Установіть `stream: true`, щоб отримувати Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Кожен рядок події має формат `event: <type>` і `data: <json>`
- Потік завершується `data: [DONE]`

Типи подій, які наразі випускаються:

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

`usage` заповнюється, коли underlying provider повідомляє кількість токенів.
OpenClaw нормалізує поширені alias у стилі OpenAI до того, як ці лічильники потрапляють
до downstream status/session surfaces, зокрема `input_tokens` / `output_tokens`
і `prompt_tokens` / `completion_tokens`.

## Помилки

Помилки використовують JSON-об'єкт на кшталт:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Поширені випадки:

- `401` відсутня/недійсна автентифікація
- `400` недійсне тіло запиту
- `405` неправильний метод

## Приклади

Без стримінгу:

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

Стримінг:

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

- [завершення чатів OpenAI](/uk/gateway/openai-http-api)
- [OpenAI](/uk/providers/openai)

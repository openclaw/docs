---
read_when:
    - Інтеграція клієнтів, що використовують API OpenResponses
    - Вам потрібні вхідні дані на основі елементів, виклики клієнтських інструментів або події SSE
summary: Надайте через Gateway HTTP-кінцеву точку `/v1/responses`, сумісну з OpenResponses
title: API OpenResponses
x-i18n:
    generated_at: "2026-07-12T13:18:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37fcf5016d1455383181923ec31b26cf31533b990045df300f0356f135c95579
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

Gateway може обслуговувати сумісну з OpenResponses кінцеву точку `POST /v1/responses`. Її **вимкнено за замовчуванням**, і вона використовує спільний порт із Gateway (мультиплексування WS + HTTP): `http://<gateway-host>:<port>/v1/responses`.

Запити виконуються як звичайний запуск агента Gateway (тим самим шляхом коду, що й `openclaw agent`), тому маршрутизація, дозволи та конфігурація відповідають вашому Gateway.

Увімкніть або вимкніть її за допомогою `gateway.http.endpoints.responses.enabled`. Коли її ввімкнено, ця сама поверхня сумісності також обслуговує `GET /v1/models`, `GET /v1/models/{id}`, `POST /v1/embeddings` і `POST /v1/chat/completions`.

## Автентифікація, безпека та маршрутизація

Робоча поведінка відповідає [OpenAI Chat Completions](/uk/gateway/openai-http-api):

- Шлях автентифікації відповідає `gateway.auth.mode`: режим зі спільним секретом (`token`/`password`) використовує `Authorization: Bearer <token-or-password>`; режим довіреного проксі використовує заголовки проксі з даними ідентичності (для проксі local loopback на тому самому хості потрібне `gateway.auth.trustedProxy.allowLoopback = true`, а коли немає заголовка `Forwarded`/`X-Forwarded-*`/`X-Real-IP`, доступний прямий резервний варіант на тому самому хості через `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`); режим `none` для приватного вхідного трафіку не потребує заголовка автентифікації. Див. [Автентифікація через довірений проксі](/uk/gateway/trusted-proxy-auth).
- Розглядайте цю кінцеву точку як повний операторський доступ до екземпляра Gateway.
- Режими автентифікації зі спільним секретом ігнорують вужчі області доступу `x-openclaw-scopes`, заявлені в bearer-токені, і відновлюють повний стандартний набір операторських областей доступу: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Репліки чату на цій кінцевій точці вважаються репліками відправника-власника.
- Довірені HTTP-режими з даними ідентичності (довірений проксі або `gateway.auth.mode="none"`) ураховують `x-openclaw-scopes`, якщо його вказано; інакше використовують стандартний набір операторських областей доступу. Семантика власника втрачається лише тоді, коли викликач явно звужує області доступу й не вказує `operator.admin`.
- Вибирайте агентів за допомогою `model: "openclaw"`, `"openclaw/default"`, `"openclaw/<agentId>"` або заголовка `x-openclaw-agent-id`.
- Використовуйте `x-openclaw-model`, щоб перевизначити модель бекенду вибраного агента (для шляхів автентифікації з даними ідентичності потрібна область доступу `operator.admin`).
- Використовуйте `x-openclaw-session-key` для явної маршрутизації сеансу (запит відхиляється з `400 invalid_request_error`, якщо ключ використовує зарезервований простір імен: `subagent:`, `cron:`, `acp:`).
- Використовуйте `x-openclaw-message-channel` для нестандартного контексту синтетичного каналу вхідного трафіку.

Канонічне пояснення моделей, націлених на агентів, `openclaw/default`, наскрізного передавання вкладень і перевизначень моделей бекенду див. в [OpenAI Chat Completions](/uk/gateway/openai-http-api#agent-first-model-contract).

Див. [Операторські області доступу](/uk/gateway/operator-scopes) і [Безпека](/uk/gateway/security).

## Поведінка сеансу

За замовчуванням кінцева точка є **безстановою для кожного запиту** (для кожного виклику генерується новий ключ сеансу).

Якщо запит містить рядок OpenResponses `user`, Gateway виводить із нього стабільний ключ сеансу, щоб повторні виклики могли спільно використовувати сеанс агента.

`previous_response_id` повторно використовує сеанс попередньої відповіді, якщо запит залишається в межах тієї самої області агента, користувача й запитаного сеансу (зіставлення виконується за суб’єктом автентифікації, ідентифікатором агента та `x-openclaw-session-key`).

## Структура запиту

| Поле                                                             | Підтримка                                                                                                                                            |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `input`                                                          | Рядок або масив об’єктів-елементів.                                                                                                                  |
| `instructions`                                                   | Об’єднується із системним запитом.                                                                                                                    |
| `tools`                                                          | Визначення клієнтських інструментів (функціональні інструменти).                                                                                      |
| `tool_choice`                                                    | `"auto"`, `"none"`, `"required"` або `{ "type": "function", "name": "..." }` для фільтрування клієнтських інструментів чи вимоги їх використання.     |
| `stream`                                                         | Вмикає потокове передавання SSE.                                                                                                                      |
| `max_output_tokens`                                              | Орієнтовне обмеження виводу (залежить від провайдера).                                                                                                |
| `temperature`                                                    | Орієнтовна температура вибірки. Ігнорується бекендом Codex Responses на основі ChatGPT, який використовує фіксовані серверні параметри вибірки.       |
| `top_p`                                                          | Орієнтовна ядерна вибірка. Те саме застереження щодо Codex Responses, що й для `temperature`.                                                         |
| `user`                                                           | Стабільна маршрутизація сеансу.                                                                                                                       |
| `previous_response_id`                                           | Безперервність сеансу (див. вище).                                                                                                                    |
| `max_tool_calls`, `reasoning`, `metadata`, `store`, `truncation` | Приймаються, але наразі ігноруються.                                                                                                                   |

## Елементи (`input`)

### `message`

Ролі: `system`, `developer`, `user`, `assistant`.

- `system` і `developer` додаються до системного запиту.
- Найновіший елемент `user` або `function_call_output` стає «поточним повідомленням».
- Попередні повідомлення користувача й асистента включаються як історія для контексту.

### `function_call_output` (інструменти на основі реплік)

Надсилайте результати інструментів назад моделі:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` та `item_reference`

Приймаються для сумісності зі схемою, але ігноруються під час формування запиту.

## Інструменти (клієнтські функціональні інструменти)

Надавайте інструменти за допомогою `tools: [{ type: "function", name, description?, parameters? }]`.

Якщо агент викликає інструмент, відповідь повертає вихідний елемент `function_call`. Щоб продовжити репліку, надішліть наступний запит із `function_call_output`.

Для `tool_choice: "required"` і `tool_choice`, закріпленого за функцією, кінцева точка звужує набір доступних клієнтських функціональних інструментів, вказує середовищу виконання викликати клієнтський інструмент перед відповіддю та відхиляє репліку, якщо вона не містить відповідного структурованого виклику клієнтського інструмента, згідно з контрактом `/v1/chat/completions`. Непотокові запити повертають `502` з `api_error`; потокові запити генерують подію `response.failed`.

## Зображення (`input_image`)

Підтримуються джерела у форматі base64 або URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Дозволені типи MIME (за замовчуванням): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`. Максимальний розмір (за замовчуванням): 10 МБ.

## Файли (`input_file`)

Підтримуються джерела у форматі base64 або URL:

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

Дозволені типи MIME (за замовчуванням): `text/plain`, `text/markdown`, `text/html`, `text/csv`, `application/json`, `application/pdf`. Максимальний розмір (за замовчуванням): 5 МБ.

Поточна поведінка:

- Вміст файлу декодується й додається до **системного запиту**, а не до повідомлення користувача, тому він залишається тимчасовим (не зберігається в історії сеансу).
- Декодований текст файлу перед додаванням обгортається як **ненадійний зовнішній вміст**, тому байти файлу розглядаються як дані, а не як довірені інструкції. Вставлений блок використовує явні маркери меж (`<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`) і рядок метаданих `Source: External`. У ньому навмисно пропущено довгий банер `SECURITY NOTICE:`, щоб зберегти бюджет запиту; маркери меж і метадані все одно застосовуються.
- Спочатку з PDF видобувається текст. Якщо тексту знайдено мало, перші сторінки растеризуються в зображення й передаються моделі, а вставлений блок файлу використовує заповнювач `[Вміст PDF відтворено як зображення]`.

Розбір PDF забезпечує вбудований plugin `document-extract`, який використовує `clawpdf` і його упаковане середовище виконання PDFium WebAssembly для видобування тексту та відтворення сторінок.

Початкові параметри отримання за URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (загальна кількість частин `input_file` + `input_image` на основі URL в одному запиті)
- Запити захищені (розв’язання DNS, блокування приватних IP-адрес, обмеження переспрямувань, тайм-аути).
- Для кожного типу вхідних даних підтримуються необов’язкові списки дозволених імен хостів (`files.urlAllowlist`, `images.urlAllowlist`): точний хост (`"cdn.example.com"`) або піддомени з груповим символом (`"*.assets.example.com"`, не відповідає кореневому домену). Порожні або пропущені списки дозволів означають відсутність обмежень за іменами хостів.
- Щоб повністю вимкнути отримання за URL, задайте `files.allowUrl: false` та/або `images.allowUrl: false`.

## Обмеження файлів і зображень (конфігурація)

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
            maxChars: 60000,
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

Значення за замовчуванням, якщо параметр не вказано:

| Ключ                     | Значення за замовчуванням |
| ------------------------ | ------------------------- |
| `maxBodyBytes`           | 20 МБ                     |
| `maxUrlParts`            | 8                         |
| `files.maxBytes`         | 5 МБ                      |
| `files.maxChars`         | 60 тис.                   |
| `files.maxRedirects`     | 3                         |
| `files.timeoutMs`        | 10 с                      |
| `files.pdf.maxPages`     | 4                         |
| `files.pdf.maxPixels`    | 4 000 000                 |
| `files.pdf.minTextChars` | 200                       |
| `images.maxBytes`        | 10 МБ                     |
| `images.maxRedirects`    | 3                         |
| `images.timeoutMs`       | 10 с                      |

Джерела `input_image` у форматах HEIC/HEIF нормалізуються до JPEG перед передаванням провайдеру через спільний процесор зображень OpenClaw (Rastermill), який використовує системний конвертер (`sips`, ImageMagick, GraphicsMagick або ffmpeg) як резервний варіант для форматів, що потребують підтримки зовнішнього кодека.

Примітка щодо безпеки: списки дозволених URL застосовуються перед отриманням і на кожному етапі переспрямування. Додавання імені хоста до списку дозволів не обходить блокування приватних або внутрішніх IP-адрес. Для Gateway, доступних з інтернету, застосовуйте засоби контролю вихідного мережевого трафіку на додачу до захисту на рівні застосунку. Див. [Безпека](/uk/gateway/security).

## Потокове передавання (SSE)

Задайте `stream: true`, щоб отримувати події, надіслані сервером:

- `Content-Type: text/event-stream`
- Кожен рядок події має формат `event: <type>` і `data: <json>`
- Потік завершується рядком `data: [DONE]`

Наразі надсилаються такі типи подій: `response.created`, `response.in_progress`, `response.output_item.added`, `response.content_part.added`, `response.output_text.delta`, `response.output_text.done`, `response.content_part.done`, `response.output_item.done`, `response.completed`, `response.failed` (у разі помилки).

## Використання

Поле `usage` заповнюється, коли базовий постачальник повідомляє кількість токенів. OpenClaw нормалізує поширені псевдоніми у стилі OpenAI, перш ніж ці лічильники потрапляють до подальших поверхонь стану та сеансів, зокрема `input_tokens` / `output_tokens` і `prompt_tokens` / `completion_tokens`.

## Помилки

Для помилок використовується об’єкт JSON такого вигляду:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Поширені випадки: `400` — недійсне тіло запиту, `401` — автентифікація відсутня або недійсна, `403` — відсутня область доступу оператора, `405` — неправильний метод, `429` — забагато невдалих спроб автентифікації (із заголовком `Retry-After`).

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

З потоковим передаванням:

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

## Пов’язані матеріали

- [Завершення чатів OpenAI](/uk/gateway/openai-http-api)
- [Області доступу оператора](/uk/gateway/operator-scopes)
- [OpenAI](/uk/providers/openai)

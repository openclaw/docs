---
read_when:
    - Интеграция клиентов, поддерживающих API OpenResponses
    - Вам нужны входные данные на основе элементов, вызовы клиентских инструментов или события SSE
summary: Предоставление совместимой с OpenResponses конечной точки HTTP `/v1/responses` через Gateway
title: API OpenResponses
x-i18n:
    generated_at: "2026-07-13T18:09:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 37fcf5016d1455383181923ec31b26cf31533b990045df300f0356f135c95579
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

Gateway может предоставлять совместимую с OpenResponses конечную точку `POST /v1/responses`. Она **по умолчанию отключена** и использует тот же порт, что и Gateway (мультиплексирование WS + HTTP): `http://<gateway-host>:<port>/v1/responses`.

Запросы выполняются как обычный запуск агента Gateway (по тому же пути кода, что и `openclaw agent`), поэтому маршрутизация, разрешения и конфигурация соответствуют вашему Gateway.

Включайте или отключайте её с помощью `gateway.http.endpoints.responses.enabled`. Когда она включена, та же поверхность совместимости также предоставляет `GET /v1/models`, `GET /v1/models/{id}`, `POST /v1/embeddings` и `POST /v1/chat/completions`.

## Аутентификация, безопасность и маршрутизация

Рабочее поведение соответствует [OpenAI Chat Completions](/ru/gateway/openai-http-api):

- Путь аутентификации соответствует `gateway.auth.mode`: общий секрет (`token`/`password`) использует `Authorization: Bearer <token-or-password>`; доверенный прокси использует заголовки прокси с данными об идентификации (для прокси обратной петли на том же хосте требуется `gateway.auth.trustedProxy.allowLoopback = true`, а прямой резервный доступ с того же хоста выполняется через `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, если отсутствуют заголовки `Forwarded`/`X-Forwarded-*`/`X-Real-IP`); для `none` на частной точке входа заголовок аутентификации не требуется. См. [Аутентификация через доверенный прокси](/ru/gateway/trusted-proxy-auth).
- Рассматривайте эту конечную точку как полный операторский доступ к экземпляру Gateway.
- Режимы аутентификации с общим секретом игнорируют более узкую область `x-openclaw-scopes`, объявленную в bearer-токене, и восстанавливают полный стандартный набор операторских областей: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Реплики чата на этой конечной точке рассматриваются как реплики отправителя-владельца.
- Доверенные HTTP-режимы с идентификацией (доверенный прокси или `gateway.auth.mode="none"`) учитывают `x-openclaw-scopes`, если он присутствует, а иначе используют стандартный набор операторских областей. Семантика владельца утрачивается только тогда, когда вызывающая сторона явно сужает области и исключает `operator.admin`.
- Выбирайте агентов с помощью `model: "openclaw"`, `"openclaw/default"`, `"openclaw/<agentId>"` или заголовка `x-openclaw-agent-id`.
- Используйте `x-openclaw-model`, чтобы переопределить серверную модель выбранного агента (для путей аутентификации с идентификацией требуется `operator.admin`).
- Используйте `x-openclaw-session-key` для явной маршрутизации сеанса (запрос отклоняется с `400 invalid_request_error`, если используется зарезервированное пространство имён: `subagent:`, `cron:`, `acp:`).
- Используйте `x-openclaw-message-channel` для нестандартного контекста синтетического входящего канала.

Каноническое описание моделей, нацеленных на агентов, `openclaw/default`, сквозной передачи векторных представлений и переопределения серверных моделей см. в разделе [OpenAI Chat Completions](/ru/gateway/openai-http-api#agent-first-model-contract).

См. [Операторские области](/ru/gateway/operator-scopes) и [Безопасность](/ru/gateway/security).

## Поведение сеанса

По умолчанию конечная точка **не сохраняет состояние между запросами** (для каждого вызова создаётся новый ключ сеанса).

Если запрос содержит строку OpenResponses `user`, Gateway создаёт на её основе стабильный ключ сеанса, чтобы повторные вызовы могли совместно использовать сеанс агента.

`previous_response_id` повторно использует сеанс предыдущего ответа, если запрос остаётся в пределах той же области агента, пользователя и запрошенного сеанса (сопоставление выполняется по субъекту аутентификации, идентификатору агента и `x-openclaw-session-key`).

## Структура запроса

| Поле                                                            | Поддержка                                                                                                                        |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `input`                                                          | Строка или массив объектов элементов.                                                                                               |
| `instructions`                                                   | Объединяется с системным промптом.                                                                                                 |
| `tools`                                                          | Определения клиентских инструментов (функциональные инструменты).                                                                                      |
| `tool_choice`                                                    | `"auto"`, `"none"`, `"required"` или `{ "type": "function", "name": "..." }` для фильтрации клиентских инструментов или обязательного их использования.                |
| `stream`                                                         | Включает потоковую передачу SSE.                                                                                                         |
| `max_output_tokens`                                              | Приблизительное ограничение вывода (зависит от провайдера).                                                                                 |
| `temperature`                                                    | Приблизительная температура сэмплирования. Игнорируется серверной частью Codex Responses на основе ChatGPT, которая использует фиксированные серверные параметры сэмплирования. |
| `top_p`                                                          | Приблизительное сэмплирование по ядру распределения. Для Codex Responses действует то же примечание, что и для `temperature`.                                                    |
| `user`                                                           | Стабильная маршрутизация сеанса.                                                                                                        |
| `previous_response_id`                                           | Непрерывность сеанса (см. выше).                                                                                                |
| `max_tool_calls`, `reasoning`, `metadata`, `store`, `truncation` | Принимаются, но в настоящее время игнорируются.                                                                                                |

## Элементы (входные данные)

### `message`

Роли: `system`, `developer`, `user`, `assistant`.

- `system` и `developer` добавляются в конец системного промпта.
- Самый последний элемент `user` или `function_call_output` становится «текущим сообщением».
- Более ранние сообщения пользователя и ассистента включаются в историю для контекста.

### `function_call_output` (инструменты с пошаговым обменом)

Отправляйте результаты инструментов обратно модели:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` и `item_reference`

Принимаются для совместимости схемы, но игнорируются при формировании промпта.

## Инструменты (клиентские функциональные инструменты)

Предоставляйте инструменты с помощью `tools: [{ type: "function", name, description?, parameters? }]`.

Если агент вызывает инструмент, ответ возвращает элемент вывода `function_call`. Чтобы продолжить реплику, отправьте следующий запрос с `function_call_output`.

Для `tool_choice: "required"` и привязанного к функции `tool_choice` конечная точка сужает набор доступных клиентских функциональных инструментов, предписывает среде выполнения вызвать клиентский инструмент перед ответом и отклоняет реплику, если она не содержит соответствующего структурированного вызова клиентского инструмента согласно контракту `/v1/chat/completions`. Непотоковые запросы возвращают `502` с `api_error`; потоковые запросы отправляют событие `response.failed`.

## Изображения (`input_image`)

Поддерживаются источники в формате base64 или URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Разрешённые типы MIME (по умолчанию): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`. Максимальный размер (по умолчанию): 10MB.

## Файлы (`input_file`)

Поддерживаются источники в формате base64 или URL:

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

Разрешённые типы MIME (по умолчанию): `text/plain`, `text/markdown`, `text/html`, `text/csv`, `application/json`, `application/pdf`. Максимальный размер (по умолчанию): 5MB.

Текущее поведение:

- Содержимое файла декодируется и добавляется в **системный промпт**, а не в сообщение пользователя, поэтому оно остаётся эфемерным (не сохраняется в истории сеанса).
- Декодированный текст файла перед добавлением оборачивается как **недоверенное внешнее содержимое**, поэтому байты файла рассматриваются как данные, а не как доверенные инструкции. Внедряемый блок использует явные маркеры границ (`<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`) и строку метаданных `Source: External`. Длинный баннер `SECURITY NOTICE:` намеренно исключён для экономии бюджета промпта; маркеры границ и метаданные по-прежнему применяются.
- Сначала из PDF извлекается текст. Если текста найдено мало, первые страницы растрируются в изображения и передаются модели, а внедряемый блок файла использует заполнитель `[PDF content rendered to images]`.

Разбор PDF обеспечивает встроенный плагин `document-extract`, который использует `clawpdf` и входящую в его пакет среду выполнения PDFium WebAssembly для извлечения текста и отрисовки страниц.

Стандартные параметры получения данных по URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (общее количество частей `input_file` + `input_image`, получаемых по URL, на запрос)
- Запросы защищены (разрешение DNS, блокировка частных IP-адресов, ограничения перенаправлений, тайм-ауты).
- Для каждого типа входных данных поддерживаются необязательные списки разрешённых имён хостов (`files.urlAllowlist`, `images.urlAllowlist`): точный хост (`"cdn.example.com"`) или поддомены с подстановочным знаком (`"*.assets.example.com"`, не соответствует корневому домену). Пустые или отсутствующие списки разрешённых хостов означают отсутствие ограничений по имени хоста.
- Чтобы полностью отключить получение данных по URL, задайте `files.allowUrl: false` и/или `images.allowUrl: false`.

## Ограничения файлов и изображений (конфигурация)

Стандартные значения можно настроить в `gateway.http.endpoints.responses`:

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

Стандартные значения при отсутствии параметров:

| Ключ                      | Стандартное значение   |
| ------------------------ | --------- |
| `maxBodyBytes`           | 20MB      |
| `maxUrlParts`            | 8         |
| `files.maxBytes`         | 5MB       |
| `files.maxChars`         | 60k       |
| `files.maxRedirects`     | 3         |
| `files.timeoutMs`        | 10s       |
| `files.pdf.maxPages`     | 4         |
| `files.pdf.maxPixels`    | 4,000,000 |
| `files.pdf.minTextChars` | 200       |
| `images.maxBytes`        | 10MB      |
| `images.maxRedirects`    | 3         |
| `images.timeoutMs`       | 10s       |

Источники HEIC/HEIF `input_image` нормализуются в JPEG перед передачей провайдеру через общий обработчик изображений OpenClaw (Rastermill), который для форматов, требующих поддержки внешних кодеков, использует в качестве резервного варианта системный конвертер (`sips`, ImageMagick, GraphicsMagick или ffmpeg).

Примечание по безопасности: списки разрешённых URL применяются перед получением данных и на каждом этапе перенаправления. Добавление имени хоста в список разрешённых не отменяет блокировку частных и внутренних IP-адресов. Для Gateway, доступных из интернета, применяйте средства контроля исходящего сетевого трафика в дополнение к защите на уровне приложения. См. раздел [Безопасность](/ru/gateway/security).

## Потоковая передача (SSE)

Установите `stream: true`, чтобы получать события Server-Sent Events:

- `Content-Type: text/event-stream`
- Каждая строка события имеет вид `event: <type>` и `data: <json>`
- Поток завершается значением `data: [DONE]`

В настоящее время отправляются события следующих типов: `response.created`, `response.in_progress`, `response.output_item.added`, `response.content_part.added`, `response.output_text.delta`, `response.output_text.done`, `response.content_part.done`, `response.output_item.done`, `response.completed`, `response.failed` (при ошибке).

## Использование

Поле `usage` заполняется, когда базовый провайдер сообщает количество токенов. OpenClaw нормализует распространённые псевдонимы в стиле OpenAI до того, как эти счётчики попадут в нижестоящие поверхности состояния и сеансов, включая `input_tokens` / `output_tokens` и `prompt_tokens` / `completion_tokens`.

## Ошибки

Для ошибок используется объект JSON следующего вида:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Распространённые случаи: `400` — недопустимое тело запроса, `401` — отсутствующая или недопустимая аутентификация, `403` — отсутствующая область полномочий оператора, `405` — неверный метод, `429` — слишком много неудачных попыток аутентификации (с `Retry-After`).

## Примеры

Без потоковой передачи:

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

С потоковой передачей:

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

## Связанные материалы

- [Завершения чата OpenAI](/ru/gateway/openai-http-api)
- [Области полномочий оператора](/ru/gateway/operator-scopes)
- [OpenAI](/ru/providers/openai)

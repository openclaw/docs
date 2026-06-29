---
read_when:
    - Интеграция инструментов, ожидающих OpenAI Chat Completions
summary: Предоставьте через Gateway OpenAI-совместимый HTTP-эндпоинт /v1/chat/completions
title: Чат-завершения OpenAI
x-i18n:
    generated_at: "2026-06-28T22:58:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8746f4f5964a5d0b948877b64b5d20440dea3aa45b36813c404cd06660792cf
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw Gateway может обслуживать небольшой OpenAI-совместимый эндпоинт Chat Completions.

Этот эндпоинт **по умолчанию отключен**. Сначала включите его в конфигурации.

- `POST /v1/chat/completions`
- Тот же порт, что и у Gateway (мультиплексирование WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Когда OpenAI-совместимая HTTP-поверхность Gateway включена, она также обслуживает:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Под капотом запросы выполняются как обычный запуск агента Gateway (тот же путь кода, что и `openclaw agent`), поэтому маршрутизация, разрешения и конфигурация соответствуют вашему Gateway.

## Аутентификация

Использует конфигурацию аутентификации Gateway.

Распространенные пути HTTP-аутентификации:

- аутентификация с общим секретом (`gateway.auth.mode="token"` или `"password"`):
  `Authorization: Bearer <token-or-password>`
- доверенная HTTP-аутентификация с идентичностью (`gateway.auth.mode="trusted-proxy"`):
  направьте через настроенный прокси с поддержкой идентичности и позвольте ему внедрить
  необходимые заголовки идентичности
- открытая аутентификация для приватного входа (`gateway.auth.mode="none"`):
  заголовок аутентификации не требуется

Примечания:

- Когда `gateway.auth.mode="token"`, используйте `gateway.auth.token` (или `OPENCLAW_GATEWAY_TOKEN`).
- Когда `gateway.auth.mode="password"`, используйте `gateway.auth.password` (или `OPENCLAW_GATEWAY_PASSWORD`).
- Когда `gateway.auth.mode="trusted-proxy"`, HTTP-запрос должен поступать из
  настроенного доверенного источника прокси; same-host loopback proxies требуют явного
  `gateway.auth.trustedProxy.allowLoopback = true`.
- Внутренние вызывающие стороны на том же хосте, которые обходят прокси, могут использовать
  `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` как локальный прямой
  резервный вариант. Любые свидетельства в заголовках `Forwarded`, `X-Forwarded-*` или `X-Real-IP`
  вместо этого оставляют запрос на пути trusted-proxy.
- Если настроен `gateway.auth.rateLimit` и происходит слишком много неудачных попыток аутентификации, эндпоинт возвращает `429` с `Retry-After`.

## Граница безопасности (важно)

Считайте этот эндпоинт поверхностью с **полным операторским доступом** для экземпляра Gateway.

- HTTP bearer auth здесь не является узкой моделью областей действия для каждого пользователя.
- Действительный токен/пароль Gateway для этого эндпоинта следует считать учетными данными владельца/оператора.
- Запросы выполняются через тот же агентский путь control-plane, что и доверенные операторские действия.
- На этом эндпоинте нет отдельной инструментальной границы для не-владельцев/отдельных пользователей; как только вызывающая сторона проходит здесь аутентификацию Gateway, OpenClaw считает эту вызывающую сторону доверенным оператором для этого Gateway.
- Для режимов аутентификации с общим секретом (`token` и `password`) эндпоинт восстанавливает обычные полные операторские значения по умолчанию, даже если вызывающая сторона отправляет более узкий заголовок `x-openclaw-scopes`.
- Доверенные HTTP-режимы с идентичностью (например, аутентификация через доверенный прокси или `gateway.auth.mode="none"`) учитывают `x-openclaw-scopes`, когда он присутствует, и иначе возвращаются к обычному набору операторских областей по умолчанию.
- Если политика целевого агента разрешает чувствительные инструменты, этот эндпоинт может их использовать.
- Держите этот эндпоинт только на loopback/tailnet/private ingress; не открывайте его напрямую в публичный интернет.

Матрица аутентификации:

- `gateway.auth.mode="token"` или `"password"` + `Authorization: Bearer ...`
  - доказывает владение общим операторским секретом Gateway
  - игнорирует более узкий `x-openclaw-scopes`
  - восстанавливает полный набор операторских областей по умолчанию:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - считает ходы чата на этом эндпоинте ходами от владельца-отправителя
- доверенные HTTP-режимы с идентичностью (например, аутентификация через доверенный прокси или `gateway.auth.mode="none"` на приватном входе)
  - аутентифицируют некоторую внешнюю доверенную идентичность или границу развертывания
  - учитывают `x-openclaw-scopes`, когда заголовок присутствует
  - возвращаются к обычному набору операторских областей по умолчанию, когда заголовок отсутствует
  - теряют семантику владельца только когда вызывающая сторона явно сужает области и опускает `operator.admin`
  - требуют `operator.admin` для элементов управления запросом уровня владельца, таких как `x-openclaw-model`

См. [Безопасность](/ru/gateway/security) и [Удаленный доступ](/ru/gateway/remote).

## Когда использовать этот эндпоинт

Используйте `/v1/chat/completions`, когда вы интегрируете инструменты или доверенный backend на стороне приложения с существующим Gateway и можете безопасно хранить операторские учетные данные Gateway.

- Предпочитайте это добавлению нового встроенного канала, когда ваша интеграция является просто еще одной операторской/клиентской поверхностью для того же Gateway.
- Для нативных мобильных клиентов, которые подключаются напрямую к удаленному Gateway, предпочитайте [WebChat](/ru/web/webchat) или [Gateway Protocol](/ru/gateway/protocol) и реализуйте поток bootstrap/device-token для сопряженного устройства, чтобы устройству не требовался общий HTTP-токен/пароль.
- Вместо этого создайте channel plugin, когда интегрируете внешнюю сеть обмена сообщениями с собственными пользователями, комнатами, доставкой Webhook или исходящим транспортом. См. [Создание plugins](/ru/plugins/building-plugins).

## Контракт модели с приоритетом агента

OpenClaw трактует поле OpenAI `model` как **цель агента**, а не как сырой id модели провайдера.

- `model: "openclaw"` направляет к настроенному агенту по умолчанию.
- `model: "openclaw/default"` также направляет к настроенному агенту по умолчанию.
- `model: "openclaw/<agentId>"` направляет к конкретному агенту.

Необязательные заголовки запроса:

- `x-openclaw-model: <provider/model-or-bare-id>` переопределяет backend-модель для выбранного агента. Вызывающие стороны с bearer-токеном общего секрета могут использовать этот заголовок. Вызывающим сторонам с идентичностью, например trusted-proxy или запросам приватного входа без аутентификации с `x-openclaw-scopes`, нужен `operator.admin`; вызывающие стороны только с правом записи получают `403 missing scope: operator.admin`.
- `x-openclaw-agent-id: <agentId>` остается поддерживаемым как переопределение для совместимости.
- `x-openclaw-session-key: <sessionKey>` явно управляет маршрутизацией сессии. Значение не должно использовать зарезервированные внутренние пространства имен сессий, такие как `subagent:`, `cron:` или `acp:`; такие запросы отклоняются с `400 invalid_request_error`.
- `x-openclaw-message-channel: <channel>` задает синтетический контекст входного канала для подсказок и политик, учитывающих каналы.

Псевдонимы совместимости, которые все еще принимаются:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Включение эндпоинта

Установите `gateway.http.endpoints.chatCompletions.enabled` в `true`:

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

## Отключение эндпоинта

Установите `gateway.http.endpoints.chatCompletions.enabled` в `false`:

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

## Поведение сессии

По умолчанию эндпоинт **не хранит состояние между запросами** (при каждом вызове генерируется новый ключ сессии).

Если запрос включает строку OpenAI `user`, Gateway выводит из нее стабильный ключ сессии, поэтому повторные вызовы могут разделять сессию агента.

Для пользовательских приложений самый безопасный вариант по умолчанию — повторно использовать одно и то же значение `user` для каждой ветки разговора. Избегайте идентификаторов уровня аккаунта, если явно не хотите, чтобы несколько разговоров или устройств разделяли одну сессию OpenClaw. Используйте `x-openclaw-session-key` только когда вам нужен явный контроль маршрутизации между несколькими клиентами или ветками, и выбирайте ключи, принадлежащие приложению, которые не начинаются с зарезервированных внутренних пространств имен, таких как `subagent:`, `cron:` или `acp:`.

## Почему эта поверхность важна

Это самый эффективный набор совместимости для self-hosted фронтендов и инструментов:

- Большинство установок Open WebUI, LobeChat и LibreChat ожидают `/v1/models`.
- Многие RAG-системы ожидают `/v1/embeddings`.
- Существующие клиенты чата OpenAI обычно могут начать с `/v1/chat/completions`.
- Более agent-native клиенты все чаще предпочитают `/v1/responses`.

## Список моделей и маршрутизация агентов

<AccordionGroup>
  <Accordion title="Что возвращает `/v1/models`?">
    Список целей агентов OpenClaw.

    Возвращаемые id — это записи `openclaw`, `openclaw/default` и `openclaw/<agentId>`.
    Используйте их напрямую как значения OpenAI `model`.

  </Accordion>
  <Accordion title="`/v1/models` перечисляет агентов или sub-agents?">
    Он перечисляет цели верхнеуровневых агентов, а не backend-модели провайдеров и не sub-agents.

    Sub-agents остаются внутренней топологией выполнения. Они не появляются как псевдомодели.

  </Accordion>
  <Accordion title="Почему включен `openclaw/default`?">
    `openclaw/default` — стабильный псевдоним для настроенного агента по умолчанию.

    Это означает, что клиенты могут продолжать использовать один предсказуемый id, даже если реальный id агента по умолчанию меняется между окружениями.

  </Accordion>
  <Accordion title="Как переопределить backend-модель?">
    Используйте `x-openclaw-model`. Это переопределение уровня владельца: оно работает с путем bearer-токена/пароля общего секрета Gateway и требует `operator.admin` на HTTP-путях с идентичностью, таких как аутентификация через доверенный прокси.

    Примеры:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Если вы его опускаете, выбранный агент запускается со своим обычным настроенным выбором модели.

  </Accordion>
  <Accordion title="Как embeddings вписываются в этот контракт?">
    `/v1/embeddings` использует те же id `model` для целей агентов.

    Используйте `model: "openclaw/default"` или `model: "openclaw/<agentId>"`.
    Когда нужна конкретная embedding-модель, отправьте ее в `x-openclaw-model` от вызывающей стороны с общим секретом или вызывающей стороны с идентичностью и `operator.admin`.
    Без этого заголовка запрос передается в обычную настройку embeddings выбранного агента.

  </Accordion>
</AccordionGroup>

## Потоковая передача (SSE)

Установите `stream: true`, чтобы получать Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Каждая строка события имеет вид `data: <json>`
- Поток завершается `data: [DONE]`

## Контракт инструментов чата

`/v1/chat/completions` поддерживает подмножество function-tool, совместимое с распространенными клиентами OpenAI Chat.

### Поддерживаемые поля запроса

- `tools`: массив `{ "type": "function", "function": { ... } }`
- `tool_choice`: `"auto"`, `"none"`, `"required"` или `{ "type": "function", "function": { "name": "..." } }`
- `messages[*].role: "tool"` последующие ходы
- `messages[*].tool_call_id` для привязки результатов инструмента к предыдущему вызову инструмента
- `max_completion_tokens`: число; лимит на общий объем токенов completion для каждого вызова (включая reasoning-токены). Текущее имя поля OpenAI Chat Completions; предпочтительно, когда отправлены и `max_completion_tokens`, и `max_tokens`.
- `max_tokens`: число; legacy-псевдоним, принимаемый для обратной совместимости. Игнорируется, когда также присутствует `max_completion_tokens`.
- `temperature`: число; best-effort температура сэмплирования, передаваемая upstream-провайдеру через канал stream-param агента.
- `top_p`: число; best-effort nucleus sampling, передаваемый upstream-провайдеру через канал stream-param агента.
- `frequency_penalty`: число; best-effort штраф частоты, передаваемый upstream-провайдеру через канал stream-param агента. Допустимый диапазон: от -2.0 до 2.0. Возвращает `400 invalid_request_error` для значений вне диапазона.
- `presence_penalty`: число; best-effort штраф присутствия, передаваемый upstream-провайдеру через канал stream-param агента. Допустимый диапазон: от -2.0 до 2.0. Возвращает `400 invalid_request_error` для значений вне диапазона.
- `seed`: число (целое); best-effort seed, передаваемый upstream-провайдеру через канал stream-param агента. Возвращает `400 invalid_request_error` для нецелых значений.
- `stop`: строка или массив до 4 строк; best-effort stop-последовательности, передаваемые upstream-провайдеру через канал stream-param агента. Возвращает `400 invalid_request_error` для более чем 4 последовательностей или нестроковых/пустых элементов.

Когда задано любое из полей ограничения токенов, значение передается вышестоящему провайдеру через канал stream-param агента. Фактическое имя поля в wire-протоколе, отправляемое вышестоящему провайдеру, выбирается транспортом провайдера: `max_completion_tokens` для конечных точек семейства OpenAI и `max_tokens` для провайдеров, которые принимают только устаревшее имя (например, Mistral и Chutes). Поля сэмплирования (`temperature`, `top_p`, `frequency_penalty`, `presence_penalty`, `seed`) следуют через тот же канал stream-param; backend Codex Responses на основе ChatGPT удаляет их на стороне сервера, поскольку использует фиксированный сэмплинг. `stop` также передается через канал stream-param и сопоставляется с полем остановки транспорта (`stop` для backend-ов Chat Completions, `stop_sequences` для Anthropic); у OpenAI Responses API нет параметра остановки, поэтому `stop` не применяется к моделям на базе Responses.

### Неподдерживаемые варианты

Конечная точка возвращает `400 invalid_request_error` для неподдерживаемых вариантов инструментов, включая:

- `tools`, не являющийся массивом
- записи инструментов, не являющиеся функциями
- отсутствующий `tool.function.name`
- варианты `tool_choice`, такие как `allowed_tools` и `custom`
- значения `tool_choice.function.name`, которые не совпадают с предоставленными `tools`

Для `tool_choice: "required"` и `tool_choice` с закрепленной функцией конечная точка сужает открытый набор function-tool клиента, указывает runtime вызвать клиентский инструмент перед ответом и возвращает ошибку, если ответ агента не включает соответствующий структурированный вызов клиентского инструмента. Этот контракт применяется к предоставленному вызывающей стороной HTTP-списку `tools`, а не к каждому внутреннему инструменту агента OpenClaw.

### Форма ответа инструмента без потоковой передачи

Когда агент решает вызвать инструменты, ответ использует:

- записи `choices[0].finish_reason = "tool_calls"`
- `choices[0].message.tool_calls[]` с:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (строка JSON)

Комментарий ассистента перед вызовом инструмента возвращается в `choices[0].message.content` (возможно, пустой).

### Форма ответа инструмента при потоковой передаче

Когда `stream: true`, вызовы инструментов выдаются как инкрементальные SSE-фрагменты:

- начальная delta роли ассистента
- необязательные delta комментариев ассистента
- один или несколько фрагментов `delta.tool_calls`, содержащих идентификатор инструмента и фрагменты аргументов
- финальный фрагмент с `finish_reason: "tool_calls"`
- `data: [DONE]`

Если `stream_options.include_usage=true`, завершающий фрагмент usage выдается перед `[DONE]`.

### Цикл продолжения после инструмента

После получения `tool_calls` клиент должен выполнить запрошенные функции и отправить последующий запрос, который включает:

- предыдущее сообщение ассистента с вызовом инструмента
- одно или несколько сообщений `role: "tool"` с соответствующим `tool_call_id`

Это позволяет запуску агента Gateway продолжить тот же цикл рассуждения и сформировать финальный ответ ассистента.

## Быстрая настройка Open WebUI

Для базового подключения Open WebUI:

- Базовый URL: `http://127.0.0.1:18789/v1`
- Базовый URL Docker на macOS: `http://host.docker.internal:18789/v1`
- API-ключ: ваш bearer-токен Gateway
- Модель: `openclaw/default`

Ожидаемое поведение:

- `GET /v1/models` должен перечислять `openclaw/default`
- Open WebUI должен использовать `openclaw/default` как id чат-модели
- Если для этого агента нужен конкретный backend-провайдер/модель, задайте обычную модель по умолчанию агента или отправьте `x-openclaw-model` от вызывающей стороны с общим секретом либо от вызывающей стороны с идентификацией и `operator.admin`

Быстрая проверка:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Если это возвращает `openclaw/default`, большинство настроек Open WebUI могут подключиться с тем же базовым URL и токеном.

## Примеры

Стабильная сессия для одного разговора приложения:

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

Повторно используйте то же значение `user` в последующих вызовах для этого разговора, чтобы продолжить ту же сессию агента.

Без потоковой передачи:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Потоковая передача:

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

Получить одну модель:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Создать embeddings:

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

Примечания:

- `/v1/models` возвращает целевые агенты OpenClaw, а не необработанные каталоги провайдеров.
- `openclaw/default` всегда присутствует, поэтому один стабильный id работает в разных окружениях.
- Переопределения backend-провайдера/модели должны находиться в `x-openclaw-model`, а не в поле OpenAI `model`. В HTTP-путях аутентификации с идентификацией этот заголовок требует `operator.admin`.
- `/v1/embeddings` поддерживает `input` как строку или массив строк.

## Связанные материалы

- [Справочник по конфигурации](/ru/gateway/configuration-reference)
- [OpenAI](/ru/providers/openai)

---
read_when:
    - Вы хотите использовать OpenClaw с облачными или локальными моделями через Ollama
    - Вам нужны инструкции по установке и настройке Ollama
    - Вы хотите использовать модели компьютерного зрения Ollama для анализа изображений
summary: Запуск OpenClaw с Ollama (облачные и локальные модели)
title: Ollama
x-i18n:
    generated_at: "2026-07-12T11:47:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaa2ab1cf22b318499ef2a040c9e356bfb1c24be811ae0749cce0090f5978c13
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw взаимодействует с нативным API Ollama (`/api/chat`), а не с
совместимой с OpenAI конечной точкой `/v1`. Поддерживаются три режима:

| Режим                  | Что используется                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| Облако + локально      | Доступный хост Ollama, обслуживающий локальные модели и, если выполнен вход, модели `:cloud`                |
| Только облако          | Непосредственно `https://ollama.com`, без локального фонового процесса                                     |
| Только локально        | Доступный хост Ollama, только локальные модели                                                              |

Настройка только облачного режима с выделенным идентификатором провайдера `ollama-cloud`
описана в разделе [Ollama Cloud](/ru/providers/ollama-cloud). Используйте ссылки
`ollama-cloud/<model>`, если облачную маршрутизацию нужно отделить от локального
провайдера `ollama`.

<Warning>
Не используйте совместимый с OpenAI URL `/v1` (`http://host:11434/v1`). Он нарушает вызов инструментов, и модели могут выводить необработанный JSON вызова инструмента как обычный текст. Используйте нативный URL: `baseUrl: "http://host:11434"` (без `/v1`).
</Warning>

Канонический ключ конфигурации — `baseUrl`. В примерах в стиле OpenAI SDK
также принимается `baseURL`, но в новой конфигурации следует использовать `baseUrl`.

## Правила аутентификации

<AccordionGroup>
  <Accordion title="Локальные хосты и хосты локальной сети">
    Для URL Ollama, указывающих на local loopback, частную сеть, домен `.local` или простое имя хоста, настоящий токен-носитель не требуется. OpenClaw использует для них маркер `ollama-local`.
  </Accordion>
  <Accordion title="Удалённые хосты и хосты Ollama Cloud">
    Для общедоступных удалённых хостов и `https://ollama.com` требуются настоящие учётные данные: `OLLAMA_API_KEY`, профиль аутентификации или `apiKey` провайдера. Для непосредственного использования размещённого сервиса предпочтителен провайдер `ollama-cloud`.
  </Accordion>
  <Accordion title="Пользовательские идентификаторы провайдеров">
    Пользовательский провайдер с `api: "ollama"` подчиняется тем же правилам. Например, провайдер `ollama-remote`, указывающий на хост в частной локальной сети, может использовать `apiKey: "ollama-local"`; подагенты разрешают этот маркер через обработчик провайдера Ollama, а не считают его отсутствующими учётными данными. `agents.defaults.memorySearch.provider` также может указывать на идентификатор пользовательского провайдера, чтобы для векторных представлений использовалась соответствующая конечная точка Ollama.
  </Accordion>
  <Accordion title="Профили аутентификации">
    `auth-profiles.json` хранит учётные данные для идентификатора провайдера; параметры конечной точки (`baseUrl`, `api`, модели, заголовки, тайм-ауты) следует задавать в `models.providers.<id>`. Старые плоские файлы, например `{ "ollama-windows": { "apiKey": "ollama-local" } }`, не являются форматом среды выполнения; `openclaw doctor --fix` преобразует их в канонический профиль API-ключа `ollama-windows:default`, сохраняя резервную копию. Значение `baseUrl` в таком устаревшем файле избыточно и должно быть перенесено в конфигурацию провайдера.
  </Accordion>
  <Accordion title="Область действия векторных представлений памяти">
    Аутентификация с помощью токена-носителя для векторных представлений памяти Ollama ограничена хостом, для которого она была объявлена:

    - Ключ уровня провайдера отправляется только на хост этого провайдера.
    - `agents.*.memorySearch.remote.apiKey` отправляется только на удалённый хост векторных представлений.
    - Значение только из переменной окружения `OLLAMA_API_KEY` считается соглашением Ollama Cloud и по умолчанию не отправляется локальным или самостоятельно размещённым хостам.

  </Accordion>
</AccordionGroup>

## Начало работы

<Tabs>
  <Tab title="Первоначальная настройка (рекомендуется)">
    <Steps>
      <Step title="Запустите первоначальную настройку">
        ```bash
        openclaw onboard
        ```

        Выберите **Ollama**, затем выберите режим: **Cloud + Local**, **Cloud only** или **Local only**.
      </Step>
      <Step title="Выберите модель">
        В режиме `Cloud only` запрашивается `OLLAMA_API_KEY` и предлагаются рекомендуемые модели размещённого облачного сервиса. В режимах `Cloud + Local` и `Local only` запрашивается базовый URL Ollama, обнаруживаются доступные модели, а выбранная локальная модель автоматически загружается, если она отсутствует. Установленный тег `:latest`, например `gemma4:latest`, отображается один раз без дублирования `gemma4`. В режиме `Cloud + Local` также проверяется, выполнен ли на хосте вход для доступа к облаку.
      </Step>
      <Step title="Проверьте">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    Неинтерактивный режим:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

    Параметры `--custom-base-url` и `--custom-model-id` необязательны; если их не указывать, используются локальный хост по умолчанию и рекомендуемая модель `gemma4`.

  </Tab>

  <Tab title="Ручная настройка">
    <Steps>
      <Step title="Установите и запустите Ollama">
        Загрузите Ollama с [ollama.com/download](https://ollama.com/download), затем скачайте модель:

        ```bash
        ollama pull gemma4
        ```

        Для гибридного доступа к облаку выполните `ollama signin` на том же хосте.
      </Step>
      <Step title="Задайте учётные данные">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # local/LAN host, any value works
        export OLLAMA_API_KEY="your-real-key"   # https://ollama.com only
        ```

        Либо в конфигурации: `openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"`.
      </Step>
      <Step title="Выберите модель">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Либо в конфигурации:

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Облачные модели через локальный хост

Режим `Cloud + Local` направляет запросы к локальным моделям и моделям
`:cloud` через один доступный хост Ollama. Это гибридный сценарий Ollama,
который следует выбрать при настройке, если нужны оба типа моделей.

OpenClaw запрашивает базовый URL, обнаруживает локальные модели и проверяет
состояние `ollama signin`. Если вход выполнен, предлагаются рекомендуемые
модели размещённого сервиса (`kimi-k2.5:cloud`, `minimax-m2.7:cloud`,
`glm-5.1:cloud`, `glm-5.2:cloud`). Если вход не выполнен, настройка остаётся
только локальной до выполнения `ollama signin`.

Для доступа только к облаку без локального фонового процесса используйте `openclaw onboard --auth-choice ollama-cloud` и обратитесь к разделу [Ollama Cloud](/ru/providers/ollama-cloud). Для этого варианта не требуются `ollama signin` и работающий сервер:

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

Список облачных моделей, отображаемый во время `openclaw onboard`, загружается
в реальном времени из `https://ollama.com/api/tags` и ограничен 500 записями,
поэтому средство выбора отражает текущий каталог размещённого сервиса. Если
`ollama.com` недоступен или во время настройки не возвращает моделей, OpenClaw
использует резервный встроенный список рекомендуемых моделей, чтобы
первоначальная настройка всё равно завершилась.

## Обнаружение моделей (неявный провайдер)

Если задан `OLLAMA_API_KEY` или профиль аутентификации, но не определены ни
`models.providers.ollama`, ни другой пользовательский провайдер с
`api: "ollama"`, OpenClaw обнаруживает модели по адресу
`http://127.0.0.1:11434`:

| Поведение                      | Подробности                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Запрос каталога                | `/api/tags`                                                                                                                                                                                                                                                                                                                                                                        |
| Определение возможностей       | `/api/show` по мере возможности считывает `contextWindow`, параметры `num_ctx` из Modelfile и возможности модели (зрение, инструменты, рассуждение)                                                                                                                                                                                                                                  |
| Модели с поддержкой изображений | Возможность `vision` из `/api/show` отмечает модель как поддерживающую изображения (`input: ["text", "image"]`)                                                                                                                                                                                                                                                                      |
| Определение рассуждения        | Используется возможность `thinking` из `/api/show`, если она доступна; если Ollama не сообщает возможности, применяется эвристика по имени (`r1`, `reason`, `reasoning`, `think`). `glm-5.2:cloud` и `deepseek-v4-flash\|pro:cloud` всегда считаются моделями рассуждения независимо от заявленных возможностей.                                                                            |
| Ограничения токенов            | Для `maxTokens` по умолчанию используется максимальное ограничение токенов Ollama в OpenClaw                                                                                                                                                                                                                                                                                        |
| Стоимость                      | Все значения стоимости равны `0`                                                                                                                                                                                                                                                                                                                                                   |

```bash
ollama list
openclaw models list
```

Задание `models.providers.ollama` с явным массивом `models` либо
пользовательского провайдера с `api: "ollama"` и `baseUrl`, не указывающим на
local loopback, отключает автоматическое обнаружение; в этом случае модели
необходимо определять вручную (см. [Конфигурация](#configuration)). Запись
`models.providers.ollama`, указывающая на размещённый сервис
`https://ollama.com`, также отключает обнаружение, поскольку моделями Ollama
Cloud управляет провайдер. Пользовательские провайдеры с local loopback,
например `http://127.0.0.2:11434`, по-прежнему считаются локальными и сохраняют
автоматическое обнаружение.

Можно использовать полную ссылку, например `ollama/<pulled-model>:latest`, без
созданной вручную записи в `models.json`; OpenClaw разрешает её в реальном
времени. Для хостов с выполненным входом выбор отсутствующей в списке ссылки
`ollama/<model>:cloud` проверяет конкретную модель через `/api/show` и добавляет
её в каталог среды выполнения, только если Ollama подтверждает метаданные;
ссылки с опечатками по-прежнему отклоняются как неизвестные модели.

### Быстрые проверки

Для узкой проверки текста без загрузки всей поверхности инструментов агента:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Добавьте `--file` с изображением для облегчённой проверки модели с поддержкой
изображений (принимаются PNG/JPEG/WebP; файлы, не являющиеся изображениями,
отклоняются до вызова Ollama — для аудио используйте
`openclaw infer audio transcribe`):

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

Ни один из этих вариантов не загружает инструменты чата, память или контекст
сеанса. Если такая проверка проходит успешно, а обычные ответы агента
завершаются ошибкой, проблема, вероятно, связана с возможностями модели по
работе с инструментами или агентами, а не с конечной точкой.

Выбор модели с помощью `/model ollama/<model>` является точным выбором
пользователя: если настроенный `baseUrl` недоступен, следующий ответ завершится
ошибкой провайдера вместо незаметного перехода на другую настроенную модель.

Изолированные задания Cron выполняют одну локальную проверку безопасности
перед началом хода агента: если выбранная модель разрешается в провайдер Ollama
с локальным адресом, адресом частной сети или доменом `.local`, а `/api/tags`
недоступна, OpenClaw записывает этот запуск со статусом `skipped`, указывая
модель в тексте ошибки. Результат проверки конечной точки кэшируется на
5 минут для каждого хоста, поэтому повторяющиеся задания Cron при остановленном
фоновом процессе не запускают множество заведомо неудачных запросов.

Проверка в реальной среде:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Для Ollama Cloud направьте тот же интерактивный тест на размещённую конечную точку (встраивания по умолчанию пропускаются; принудительно включите их с помощью `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`, поскольку облачный ключ может не предоставлять доступ к `/api/embed`):

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Чтобы добавить модель, загрузите её — она будет обнаружена автоматически:

```bash
ollama pull mistral
```

## Локальный вывод на Node

Агенты могут делегировать короткую задачу модели Ollama на сопряжённом настольном компьютере или серверном Node. Запрос и ответ передаются через существующее аутентифицированное соединение Gateway/Node; запрос выполняется через собственную конечную точку Ollama на local loopback этого Node (`http://127.0.0.1:11434`).

<Steps>
  <Step title="Start Ollama on the node">
    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```
  </Step>
  <Step title="Connect the node host">
    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    Одобрите устройство и его команды Node на хосте Gateway, затем проверьте:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    Первое подключение или обновление, добавляющее команды Ollama, может запросить одобрение команд Node. Если Node подключается, не объявляя `ollama.models` и `ollama.chat`, снова проверьте `openclaw nodes pending`.

  </Step>
  <Step title="Use it from an agent">
    Встроенный Plugin Ollama предоставляет инструмент `node_inference`. Агенты сначала вызывают `action: "discover"`, а затем `action: "run"` с Node и моделью из полученного результата (`run` может не указывать Node, если подключён ровно один подходящий Node). Например: «Обнаружь модели Ollama на моих Node, а затем используй самую быструю загруженную модель, чтобы кратко изложить этот текст».
  </Step>
</Steps>

Обнаружение считывает `/api/tags`, проверяет возможности через `/api/show` и, когда доступно, использует `/api/ps`, чтобы первыми ранжировать уже загруженные модели. Возвращаются только локальные модели, которые Ollama определяет как способные работать в режиме чата (возможность `completion`), — строки Ollama Cloud и модели только для встраиваний исключаются. При каждом запуске размышление модели отключается, а объём вывода по умолчанию ограничивается 512 токенами (жёсткий предел — 8192), если вызов инструмента не запрашивает другое значение `maxTokens`; некоторые модели (например, GPT-OSS) не поддерживают отключение размышления и всё равно могут выводить токены рассуждений.

Чтобы Ollama продолжала работать на Node, не предоставляя к ней доступ агентам:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Перезапустите Node (`openclaw node restart` или остановите и снова выполните `openclaw node run` для сеанса переднего плана). Node перестанет объявлять `ollama.models` и `ollama.chat`; сама Ollama и провайдер Ollama в Gateway останутся без изменений. Верните значение `true` и перезапустите Node, чтобы снова включить эту возможность; после повторного подключения изменившаяся поверхность команд может снова потребовать одобрения через `openclaw nodes pending`.

Проверьте команды Node напрямую, без обращения к агенту:

```bash
openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.models \
  --params '{}' \
  --invoke-timeout 90000 \
  --timeout 100000

openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.chat \
  --params '{"model":"qwen3:0.6b","prompt":"Reply with exactly: pong","maxTokens":32,"timeoutMs":120000}' \
  --invoke-timeout 130000 \
  --timeout 140000
```

`--invoke-timeout` ограничивает время, отведённое Node на выполнение команды; `--timeout` ограничивает общую длительность вызова Gateway и должен быть больше.

Локальный вывод на Node всегда использует собственную конечную точку этого Node на local loopback — настроенный удалённый или облачный адрес `models.providers.ollama.baseUrl` не используется повторно. Команды Node по умолчанию доступны на хостах Node с macOS, Linux и Windows и по-прежнему подчиняются обычной политике сопряжения и команд Node.

## Компьютерное зрение и описание изображений

Встроенный Plugin Ollama регистрирует Ollama как провайдер анализа медиа с поддержкой изображений, поэтому OpenClaw может направлять явные запросы на описание изображений и настроенные модели изображений по умолчанию в локальные или размещённые модели компьютерного зрения Ollama.

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` должен быть полной ссылкой `<provider/model>`; если он указан, `infer image describe` сначала пробует эту модель, а не пропускает описание для моделей, уже поддерживающих компьютерное зрение напрямую. Если вызов завершается ошибкой, OpenClaw может продолжить перебор `agents.defaults.imageModel.fallbacks`; ошибки подготовки файла или URL приводят к сбою до попытки резервного варианта. Используйте `infer image describe` для процесса анализа изображений OpenClaw и настроенной `imageModel`; используйте `infer model run --file` для прямой мультимодальной проверки с пользовательским запросом.

Чтобы сделать Ollama провайдером анализа изображений по умолчанию для входящих медиа:

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

Предпочтительно использовать полную ссылку `ollama/<model>`. Ссылка `imageModel` без провайдера, например `qwen2.5vl:7b`, нормализуется в `ollama/qwen2.5vl:7b` только тогда, когда эта точная модель указана в `models.providers.ollama.models` с `input: ["text", "image"]` и никакой другой настроенный провайдер изображений не предоставляет тот же идентификатор без префикса; в остальных случаях явно укажите префикс провайдера.

Медленным локальным моделям компьютерного зрения может требоваться более длительный тайм-аут анализа изображений, чем облачным моделям; кроме того, на оборудовании с ограниченными ресурсами они могут аварийно завершаться, если Ollama пытается выделить память под весь заявленный контекст компьютерного зрения модели. Установите тайм-аут возможности и ограничьте `num_ctx`:

```json5
{
  models: {
    providers: {
      ollama: {
        models: [
          {
            id: "qwen2.5vl:7b",
            name: "qwen2.5vl:7b",
            input: ["text", "image"],
            params: { num_ctx: 2048, keep_alive: "1m" },
          },
        ],
      },
    },
  },
  tools: {
    media: {
      image: {
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "qwen2.5vl:7b", timeoutSeconds: 300 }],
      },
    },
  },
}
```

Этот тайм-аут применяется к анализу входящих изображений и к явному инструменту `image`. Параметр `models.providers.ollama.timeoutSeconds` по-прежнему управляет ограничением базового HTTP-запроса Ollama для обычных вызовов моделей.

Интерактивная проверка:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Если вы задаёте `models.providers.ollama.models` вручную, явно отмечайте модели компьютерного зрения:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw отклоняет запросы на описание изображений для моделей, не отмеченных как поддерживающие изображения. При неявном обнаружении эта информация берётся из возможности компьютерного зрения `/api/show`.

## Конфигурация

<Tabs>
  <Tab title="Basic (implicit discovery)">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Если задана переменная `OLLAMA_API_KEY`, можно не указывать `apiKey` в записи провайдера; OpenClaw подставит его при проверках доступности.
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    Используйте явную конфигурацию для размещённой облачной среды, нестандартного хоста или порта, принудительно заданных размеров контекста либо полностью ручных списков моделей:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="Custom base URL">
    Явная конфигурация отключает автоматическое обнаружение, поэтому модели необходимо перечислить:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - native Ollama API URL
            api: "ollama", // Explicit: guarantees native tool-calling behavior
            timeoutSeconds: 300, // Optional: longer connect/stream budget for cold local models
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Optional: keep the model loaded between turns
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    Не добавляйте `/v1`. Этот путь выбирает режим совместимости с OpenAI, в котором вызов инструментов работает ненадёжно.
    </Warning>

  </Tab>
</Tabs>

## Распространённые варианты настройки

Замените идентификаторы моделей точными именами из `ollama list` или `openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Local model with auto-discovery">
    Ollama на том же компьютере, что и Gateway, с автоматическим обнаружением:

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    Не добавляйте блок `models.providers.ollama`, если вам не нужны модели, заданные вручную.

  </Accordion>

  <Accordion title="LAN Ollama host with manual models">
    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                reasoning: true,
                input: ["text"],
                params: {
                  num_ctx: 32768,
                  thinking: false,
                  keep_alive: "15m",
                },
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/qwen3.5:9b" },
        },
      },
    }
    ```

    `contextWindow` — бюджет контекста OpenClaw; `params.num_ctx` отправляется в Ollama. Сохраняйте эти значения согласованными, если оборудование не способно обработать весь заявленный контекст модели.

  </Accordion>

  <Accordion title="Ollama Cloud only">
    Без локального фонового процесса, с прямым использованием размещённых моделей:

    ```bash
    export OLLAMA_API_KEY="your-ollama-api-key"
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                contextWindow: 128000,
                maxTokens: 8192,
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/kimi-k2.5:cloud" },
        },
      },
    }
    ```

    Если вместо этой структуры вы хотите использовать отдельный идентификатор провайдера `ollama-cloud`, см. [Ollama Cloud](/ru/providers/ollama-cloud).

  </Accordion>

  <Accordion title="Cloud plus local through a signed-in daemon">
    ```bash
    ollama signin
    ollama pull gemma4
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            models: [
              { id: "gemma4", name: "gemma4", input: ["text"] },
              { id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text", "image"] },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama/gemma4",
            fallbacks: ["ollama/kimi-k2.5:cloud"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Multiple Ollama hosts">
    При запуске нескольких серверов Ollama используйте собственные идентификаторы провайдеров; каждый из них получает
    отдельный хост, модели, аутентификацию и тайм-аут.

    ```json5
    {
      models: {
        providers: {
          "ollama-fast": {
            baseUrl: "http://mini.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [{ id: "gemma4", name: "gemma4", input: ["text"] }],
          },
          "ollama-large": {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 420,
            contextWindow: 131072,
            maxTokens: 16384,
            models: [{ id: "qwen3.5:27b", name: "qwen3.5:27b", input: ["text"] }],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama-fast/gemma4",
            fallbacks: ["ollama-large/qwen3.5:27b"],
          },
        },
      },
    }
    ```

    Перед обращением к Ollama OpenClaw удаляет префикс активного провайдера (или
    резервный базовый префикс `ollama/`), поэтому `ollama-large/qwen3.5:27b`
    передаётся в Ollama как `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Lean local model profile">
    Некоторые локальные модели справляются с простыми запросами, но испытывают трудности
    с полным набором инструментов агента. Ограничьте инструменты и контекст, прежде чем изменять
    глобальные настройки среды выполнения:

    ```json5
    {
      agents: {
        list: [
          {
            id: "local",
            experimental: {
              localModelLean: true,
            },
            model: { primary: "ollama/gemma4" },
          },
        ],
      },
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [
              {
                id: "gemma4",
                name: "gemma4",
                input: ["text"],
                params: { num_ctx: 32768 },
                compat: { supportsTools: false },
              },
            ],
          },
        },
      },
    }
    ```

    Используйте `compat.supportsTools: false`, только если модель или сервер стабильно
    завершается с ошибкой при обработке схем инструментов — это повышает стабильность за счёт возможностей агента.
    `localModelLean` удаляет ресурсоёмкие инструменты браузера, Cron, сообщений, создания
    медиаматериалов, голоса и PDF из непосредственного набора инструментов агента, если они явно не требуются,
    и помещает крупные каталоги за Tool Search. Он не изменяет контекст среды выполнения
    или режим рассуждений Ollama. Для небольших моделей рассуждений в стиле Qwen, которые зацикливаются или
    расходуют свой бюджет на скрытые рассуждения, используйте его вместе с `params.num_ctx` и
    `params.thinking: false`.

  </Accordion>
</AccordionGroup>

### Выбор модели

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

Собственные идентификаторы провайдеров работают аналогично: для ссылки с префиксом активного
провайдера, например `ollama-spark/qwen3:32b`, OpenClaw удаляет этот префикс перед
обращением к Ollama и отправляет `qwen3:32b`.

Для медленных локальных моделей сначала настраивайте параметры на уровне провайдера, а не увеличивайте
тайм-аут всей среды выполнения агента:

```json5
{
  models: {
    providers: {
      ollama: {
        timeoutSeconds: 300,
        models: [
          {
            id: "gemma4:26b",
            name: "gemma4:26b",
            params: { keep_alive: "15m" },
          },
        ],
      },
    },
  },
}
```

`timeoutSeconds` охватывает HTTP-запрос к модели: установление соединения, заголовки,
потоковую передачу тела и полную отмену защищённого запроса по тайм-ауту. `params.keep_alive`
передаётся как `keep_alive` верхнего уровня в нативных запросах `/api/chat`; задавайте его отдельно
для каждой модели, если узким местом является время загрузки при первом запросе.

### Быстрая проверка

```bash
# Ollama daemon visible to this machine
curl http://127.0.0.1:11434/api/tags

# OpenClaw catalog and selected model
openclaw models list --provider ollama
openclaw models status

# Direct model smoke
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Reply with exactly: ok"
```

Для удалённых хостов замените `127.0.0.1` на хост из `baseUrl`. Если `curl`
работает, а OpenClaw — нет, проверьте, не запущен ли Gateway на другом
компьютере, в контейнере или под другой служебной учётной записью.

## Веб-поиск Ollama

OpenClaw включает **веб-поиск Ollama** в качестве провайдера `web_search`.

| Свойство    | Сведения                                                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Хост        | `models.providers.ollama.baseUrl`, если задан; иначе `http://127.0.0.1:11434`; `https://ollama.com` напрямую использует размещённый API                          |
| Аутентификация        | Не требует ключа для локального хоста с выполненным входом; `OLLAMA_API_KEY` или настроенная аутентификация провайдера для прямого поиска через `https://ollama.com` либо хостов с защищённым доступом           |
| Требование | Локальные или самостоятельно размещённые хосты должны быть запущены, а вход должен быть выполнен с помощью `ollama signin`; для прямого размещённого поиска требуется `baseUrl: "https://ollama.com"` и действующий ключ API |

Выберите его во время выполнения `openclaw onboard` или `openclaw configure --section web` либо задайте:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Для прямого размещённого поиска через Ollama Cloud:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
        api: "ollama",
        models: [{ id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text"] }],
      },
    },
  },
  tools: {
    web: {
      search: { provider: "ollama" },
    },
  },
}
```

Для самостоятельно размещённого хоста OpenClaw сначала обращается к локальному прокси `/api/experimental/web_search`,
а затем использует резервный размещённый путь `/api/web_search` на том же хосте;
локальный демон с выполненным входом обычно отвечает через локальный прокси. Прямые
обращения к `https://ollama.com` всегда используют размещённую конечную точку `/api/web_search`.

<Note>
Полное описание настройки и поведения см. в разделе [Веб-поиск Ollama](/ru/tools/ollama-search).
</Note>

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Legacy OpenAI-compatible mode">
    <Warning>
    **Вызов инструментов в этом режиме ненадёжен.** Используйте его, только если прокси требует формат OpenAI и вы не зависите от нативного вызова инструментов.
    </Warning>

    Явно задайте `api: "openai-completions"` для прокси, расположенного за
    `/v1/chat/completions`:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // default: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    Этот режим может не поддерживать потоковую передачу и вызов инструментов одновременно;
    возможно, потребуется задать для модели `params: { streaming: false }`.

    По умолчанию OpenClaw внедряет `options.num_ctx` в этом режиме, чтобы Ollama
    не использовала без уведомления контекст на 4096 токенов. Если ваш прокси отклоняет
    неизвестные поля `options`, отключите это поведение:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Context windows">
    Для автоматически обнаруженных моделей OpenClaw использует окно контекста, указанное
    `/api/show`, включая увеличенные значения `PARAMETER num_ctx` из собственных
    файлов Modelfile; в противном случае используется стандартное окно контекста
    Ollama в OpenClaw.

    Параметры `contextWindow`, `contextTokens` и `maxTokens` на уровне провайдера задают
    значения по умолчанию для каждой модели этого провайдера и могут быть переопределены
    для отдельных моделей. `contextWindow` — это собственный бюджет OpenClaw для запросов и Compaction. В нативных
    запросах `/api/chat` параметр `options.num_ctx` остаётся незаданным, если вы явно не укажете
    `params.num_ctx`, поэтому Ollama применяет собственное значение модели,
    `OLLAMA_CONTEXT_LENGTH` или значение по умолчанию на основе объёма VRAM; недопустимые, нулевые, отрицательные
    или неконечные значения `params.num_ctx` игнорируются. Если в старой конфигурации
    для принудительного задания контекста нативного запроса использовались только `contextWindow`/`maxTokens`, выполните
    `openclaw doctor --fix`, чтобы скопировать их в `params.num_ctx`.
    Адаптер, совместимый с OpenAI, по-прежнему по умолчанию внедряет `options.num_ctx` из
    настроенного `params.num_ctx` или `contextWindow`; отключите это с помощью
    `injectNumCtxForOpenAICompat: false`, если вышестоящий сервис отклоняет `options`.

    Нативные записи моделей также принимают распространённые параметры среды выполнения Ollama в
    `params`, которые передаются как `options` нативного запроса `/api/chat`: `num_keep`, `seed`,
    `num_predict`, `top_k`, `top_p`, `min_p`, `typical_p`, `repeat_last_n`,
    `temperature`, `repeat_penalty`, `presence_penalty`, `frequency_penalty`,
    `stop`, `num_batch`, `num_gpu`, `main_gpu`, `use_mmap` и `num_thread`.
    Некоторые ключи (`format`, `keep_alive`, `truncate`, `shift`) передаются как
    поля запроса верхнего уровня, а не как вложенные `options`. OpenClaw передаёт
    только эти ключи запросов Ollama, поэтому параметры, относящиеся только к среде выполнения, например
    `streaming`, никогда не отправляются в Ollama. Используйте `params.think` (или
    `params.thinking`), чтобы задать `think` верхнего уровня; значение `false` отключает рассуждения
    на уровне API для моделей рассуждений в стиле Qwen.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
                params: {
                  num_ctx: 32768,
                  temperature: 0.7,
                  top_p: 0.9,
                  thinking: false,
                },
              }
            ]
          }
        }
      }
    }
    ```

    Параметр `agents.defaults.models["ollama/<model>"].params.num_ctx` для отдельной модели также
    работает; если заданы оба значения, явная запись модели провайдера имеет приоритет.

  </Accordion>

  <Accordion title="Thinking control">
    OpenClaw передаёт параметр рассуждений в ожидаемом Ollama формате: `think` верхнего уровня, а не
    `options.think`. Автоматически обнаруженные модели, для которых `/api/show` сообщает о
    поддержке `thinking`, предоставляют `/think low`, `/think medium`, `/think high`
    и `/think max`; модели без поддержки рассуждений предоставляют только `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Или задайте значение по умолчанию для модели:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "ollama/gemma4": {
              thinking: "low",
            },
          },
        },
      },
    }
    ```

    Параметры `params.think`/`params.thinking` для отдельных моделей могут отключать или принудительно включать
    обдумывание через API для конкретной модели. OpenClaw сохраняет эту явно заданную конфигурацию,
    когда для активного запуска действует только неявное значение по умолчанию `off`; команда среды выполнения
    с отличным от `off` значением, например `/think medium`, по-прежнему переопределяет её. Запрос
    на обдумывание с истинным значением никогда не отправляется модели, для которой явно указано
    `reasoning: false`; запрос `think: false` отправляется всегда.

  </Accordion>

  <Accordion title="Reasoning models">
    Модели с именами `deepseek-r1`, `reasoning`, `reason` или `think` по умолчанию считаются
    поддерживающими рассуждение — дополнительная конфигурация не требуется:

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="Model costs">
    Ollama работает локально и бесплатно, поэтому стоимость всех моделей равна `0` как для
    автоматически обнаруженных, так и для определённых вручную моделей.
  </Accordion>

  <Accordion title="Memory embeddings">
    Встроенный Plugin Ollama регистрирует поставщика эмбеддингов памяти для
    [поиска по памяти](/ru/concepts/memory). Он использует настроенные базовый URL Ollama
    и ключ API, вызывает `/api/embed` и по возможности объединяет несколько фрагментов памяти
    в один запрос `input`.

    Когда задано `proxy.enabled=true`, запросы эмбеддингов к точному локальному
    origin обратной петли хоста, полученному из настроенного `baseUrl`, используют
    защищённый прямой путь OpenClaw вместо управляемого прокси пересылки. Само настроенное
    имя хоста должно быть `localhost` или IP-литералом обратной петли — DNS-имена,
    которые лишь разрешаются в адрес обратной петли, всё равно используют путь через
    управляемый прокси. Хосты Ollama в LAN, tailnet, частной или общедоступной сети всегда
    остаются на пути через управляемый прокси, а перенаправления на другой хост или порт
    не наследуют доверие. Значение `proxy.loopbackMode: "proxy"` в любом случае направляет
    трафик обратной петли через прокси; `proxy.loopbackMode: "block"` запрещает его до
    установления соединения — см. [Управляемый прокси](/ru/security/network-proxy#gateway-loopback-mode).

    | Свойство | Значение |
    | --- | --- |
    | Модель по умолчанию | `nomic-embed-text` |
    | Автоматическое скачивание | Да, если модель отсутствует локально |
    | Параллелизм встроенной обработки по умолчанию | 1 (для других поставщиков значение по умолчанию выше; увеличьте с помощью `nonBatchConcurrency`, если хост справится с нагрузкой) |

    Эмбеддинги во время запроса используют префиксы поиска для моделей, которые требуют
    или рекомендуют их: `nomic-embed-text`, `qwen3-embedding` и
    `mxbai-embed-large`. Пакеты документов остаются без изменений, поэтому существующим индексам
    не требуется миграция формата.

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Default for Ollama. Raise on larger hosts if reindexing is too slow.
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    Для удалённого хоста эмбеддингов ограничьте область действия аутентификации этим хостом:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            model: "nomic-embed-text",
            remote: {
              baseUrl: "http://gpu-box.local:11434",
              apiKey: "ollama-local",
              nonBatchConcurrency: 2,
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Streaming configuration">
    По умолчанию Ollama использует **собственный API** (`/api/chat`), который одновременно поддерживает
    потоковую передачу и вызов инструментов — специальная конфигурация не требуется.

    Для собственных запросов управление обдумыванием передаётся напрямую: `/think off`
    и `openclaw agent --thinking off` отправляют верхнеуровневый параметр `think: false`, если
    явно не настроен `params.think`/`params.thinking`; `/think
    low|medium|high` отправляют соответствующую строку интенсивности; `/think max` соответствует
    максимальной интенсивности Ollama — `think: "high"`.

    <Tip>
    Чтобы вместо этого использовать конечную точку, совместимую с OpenAI, см. раздел «Устаревший режим совместимости с OpenAI» выше — в нём потоковая передача и вызов инструментов могут не работать одновременно.
    </Tip>

  </Accordion>
</AccordionGroup>

## Устранение неполадок

<AccordionGroup>
  <Accordion title="WSL2 crash loop (repeated reboots)">
    В WSL2 с NVIDIA/CUDA официальный установщик Ollama для Linux создаёт модуль systemd
    `ollama.service` с параметром `Restart=always`. Если эта служба
    запускается автоматически и загружает модель с поддержкой GPU во время запуска WSL2, Ollama может
    закрепить память хоста на время загрузки; механизм освобождения памяти Hyper-V не всегда может
    вернуть эти страницы, поэтому Windows может завершить виртуальную машину WSL2, systemd перезапустит
    Ollama, и цикл повторится.

    Признаки: повторяющиеся перезапуски или завершения WSL2, высокая загрузка CPU в `app.slice` или
    `ollama.service` сразу после запуска WSL2 и сигнал SIGTERM от systemd, а
    не от механизма Linux OOM killer.

    OpenClaw записывает предупреждение при запуске, если обнаруживает WSL2, включённую службу
    `ollama.service` с `Restart=always` и видимые маркеры CUDA.

    Способ устранения:

    ```bash
    sudo systemctl disable ollama
    ```

    В Windows добавьте следующее в `%USERPROFILE%\.wslconfig`, затем выполните
    `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Либо сократите время сохранения активности или запускайте Ollama вручную только при необходимости:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    См. [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama not detected">
    Убедитесь, что Ollama запущен, задан `OLLAMA_API_KEY` (или профиль аутентификации),
    а `models.providers.ollama` **не** определён явно:

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="No models available">
    Скачайте модель локально или явно определите её в
    `models.providers.ollama`:

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="Connection refused">
    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Remote host works with curl but not OpenClaw">
    Выполните проверку на той же машине и в той же среде выполнения, где работает Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Распространённые причины:

    - `baseUrl` указывает на `localhost`, но Gateway работает в Docker или на другом хосте.
    - URL содержит `/v1`, что выбирает режим совместимости с OpenAI вместо собственного режима Ollama.
    - Для удалённого хоста требуется изменить настройки межсетевого экрана или привязки к LAN.
    - Модель находится в службе на вашем ноутбуке, но отсутствует в удалённой службе.

  </Accordion>

  <Accordion title="Model outputs tool JSON as text">
    Обычно поставщик работает в режиме совместимости с OpenAI либо модель не может
    обрабатывать схемы инструментов. Предпочтительно использовать собственный режим:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434",
            api: "ollama",
          },
        },
      },
    }
    ```

    Если небольшая локальная модель по-прежнему не справляется со схемами инструментов, задайте
    `compat.supportsTools: false` в записи этой модели и повторите проверку.

  </Accordion>

  <Accordion title="Kimi or GLM returns garbled symbols">
    Ответы размещённых моделей Kimi/GLM, представляющие собой длинные последовательности
    неязыковых символов, считаются неуспешным вызовом поставщика, а не успешным ответом,
    поэтому вместо сохранения повреждённого текста в сеансе применяются обычные механизмы
    повторной попытки, переключения на резервный вариант и обработки ошибок.

    Если проблема повторится, сохраните название модели, текущий файл сеанса и сведения
    о том, использовался ли режим `Cloud + Local` или `Cloud only`, затем попробуйте новый
    сеанс и резервную модель:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Cold local model times out">
    Первичная загрузка крупных локальных моделей может занимать много времени. Ограничьте область действия
    тайм-аута поставщиком Ollama и при необходимости сохраняйте модель загруженной между обращениями:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            timeoutSeconds: 300,
            models: [
              {
                id: "gemma4:26b",
                name: "gemma4:26b",
                params: { keep_alive: "15m" },
              },
            ],
          },
        },
      },
    }
    ```

    Если сам хост медленно принимает соединения, `timeoutSeconds` также
    увеличивает защищённый тайм-аут подключения для этого поставщика.

  </Accordion>

  <Accordion title="Large-context model is too slow or runs out of memory">
    Многие модели заявляют контекст, превышающий объём, с которым ваше оборудование может
    комфортно работать. Собственный режим Ollama использует значение среды выполнения по умолчанию, если
    не задан `params.num_ctx`. Ограничьте бюджет OpenClaw и контекст запроса Ollama,
    чтобы обеспечить предсказуемую задержку до первого токена:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                params: { num_ctx: 32768, thinking: false },
              },
            ],
          },
        },
      },
    }
    ```

    Уменьшите `contextWindow`, если OpenClaw отправляет слишком большой промпт. Уменьшите
    `params.num_ctx`, если контекст среды выполнения Ollama слишком велик для этой машины.
    Уменьшите `maxTokens`, если генерация занимает слишком много времени.

  </Accordion>
</AccordionGroup>

<Note>
Дополнительная помощь: [Устранение неполадок](/ru/help/troubleshooting) и [Часто задаваемые вопросы](/ru/help/faq).
</Note>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/ru/providers/ollama-cloud" icon="cloud">
    Настройка только для облака с выделенным поставщиком `ollama-cloud`.
  </Card>
  <Card title="Model providers" href="/ru/concepts/model-providers" icon="layers">
    Обзор всех поставщиков, ссылок на модели и поведения при переключении на резервный вариант.
  </Card>
  <Card title="Model selection" href="/ru/concepts/models" icon="brain">
    Выбор и настройка моделей.
  </Card>
  <Card title="Ollama Web Search" href="/ru/tools/ollama-search" icon="magnifying-glass">
    Полные сведения о настройке и поведении веб-поиска на основе Ollama.
  </Card>
  <Card title="Configuration" href="/ru/gateway/configuration" icon="gear">
    Полный справочник по конфигурации.
  </Card>
</CardGroup>

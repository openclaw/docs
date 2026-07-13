---
read_when:
    - Вы хотите использовать OpenClaw с облачными или локальными моделями через Ollama
    - Вам нужны инструкции по установке и настройке Ollama
    - Вам нужны модели компьютерного зрения Ollama для анализа изображений
summary: Запуск OpenClaw с Ollama (облачные и локальные модели)
title: Ollama
x-i18n:
    generated_at: "2026-07-13T18:30:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: aaa2ab1cf22b318499ef2a040c9e356bfb1c24be811ae0749cce0090f5978c13
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw взаимодействует с нативным API Ollama (`/api/chat`), а не с OpenAI-совместимой
конечной точкой `/v1`. Поддерживаются три режима:

| Режим                   | Что используется                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------ |
| Облако + локально       | Доступный хост Ollama, обслуживающий локальные модели и, если выполнен вход, модели `:cloud` |
| Только облако           | Непосредственно `https://ollama.com`, без локального демона                            |
| Только локально         | Доступный хост Ollama, только локальные модели                                        |

Настройка только облачного режима с выделенным идентификатором провайдера `ollama-cloud` описана в разделе
[Ollama Cloud](/ru/providers/ollama-cloud). Используйте ссылки `ollama-cloud/<model>`, если
требуется отделить облачную маршрутизацию от локального провайдера `ollama`.

<Warning>
Не используйте OpenAI-совместимый URL `/v1` (`http://host:11434/v1`). Он нарушает вызов инструментов, и модели могут выводить необработанный JSON вызова инструмента как обычный текст. Используйте нативный URL: `baseUrl: "http://host:11434"` (без `/v1`).
</Warning>

Канонический ключ конфигурации — `baseUrl`. Для примеров в стиле OpenAI SDK также допускается `baseURL`,
но в новой конфигурации следует использовать `baseUrl`.

## Правила аутентификации

<AccordionGroup>
  <Accordion title="Локальные хосты и хосты в локальной сети">
    URL-адресам Ollama для loopback-интерфейса, частной сети, `.local` и простых имён хостов не требуется настоящий bearer-токен. Для них OpenClaw использует маркер `ollama-local`.
  </Accordion>
  <Accordion title="Удалённые хосты и хосты Ollama Cloud">
    Для общедоступных удалённых хостов и `https://ollama.com` требуются настоящие учётные данные: `OLLAMA_API_KEY`, профиль аутентификации или `apiKey` провайдера. Для прямого использования размещённого сервиса предпочтителен провайдер `ollama-cloud`.
  </Accordion>
  <Accordion title="Пользовательские идентификаторы провайдеров">
    Пользовательский провайдер с `api: "ollama"` подчиняется тем же правилам. Например, провайдер `ollama-remote`, указывающий на частный хост в локальной сети, может использовать `apiKey: "ollama-local"`; подагенты разрешают этот маркер через хук провайдера Ollama, а не считают его отсутствующими учётными данными. `agents.defaults.memorySearch.provider` также может указывать на пользовательский идентификатор провайдера, чтобы для эмбеддингов использовалась эта конечная точка Ollama.
  </Accordion>
  <Accordion title="Профили аутентификации">
    `auth-profiles.json` хранит учётные данные для идентификатора провайдера; параметры конечной точки (`baseUrl`, `api`, модели, заголовки, тайм-ауты) указывайте в `models.providers.<id>`. Старые плоские файлы, такие как `{ "ollama-windows": { "apiKey": "ollama-local" } }`, не являются форматом среды выполнения; `openclaw doctor --fix` преобразует их в канонический профиль API-ключа `ollama-windows:default` с созданием резервной копии. Значение `baseUrl` в таком устаревшем файле является лишним и должно быть перенесено в конфигурацию провайдера.
  </Accordion>
  <Accordion title="Область действия эмбеддингов памяти">
    Bearer-аутентификация для эмбеддингов памяти Ollama ограничена хостом, для которого она была объявлена:

    - Ключ уровня провайдера отправляется только на хост этого провайдера.
    - `agents.*.memorySearch.remote.apiKey` отправляется только на удалённый хост эмбеддингов.
    - Значение только из переменной окружения `OLLAMA_API_KEY` считается соглашением Ollama Cloud и по умолчанию не отправляется на локальные или самостоятельно размещённые хосты.

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

        Выберите **Ollama**, затем режим: **Облако + локально**, **Только облако** или **Только локально**.
      </Step>
      <Step title="Выберите модель">
        `Cloud only` запрашивает `OLLAMA_API_KEY` и предлагает размещённые облачные варианты по умолчанию. `Cloud + Local` и `Local only` запрашивают базовый URL Ollama, обнаруживают доступные модели и автоматически загружают выбранную локальную модель, если она отсутствует. Установленный тег `:latest`, например `gemma4:latest`, отображается один раз без дублирования `gemma4`. `Cloud + Local` также проверяет, выполнен ли на хосте вход для облачного доступа.
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

    `--custom-base-url` и `--custom-model-id` необязательны; если их не указывать, используются локальный хост по умолчанию и предлагаемая модель `gemma4`.

  </Tab>

  <Tab title="Ручная настройка">
    <Steps>
      <Step title="Установите и запустите Ollama">
        Загрузите Ollama с [ollama.com/download](https://ollama.com/download), затем загрузите модель:

        ```bash
        ollama pull gemma4
        ```

        Для гибридного облачного доступа выполните `ollama signin` на том же хосте.
      </Step>
      <Step title="Задайте учётные данные">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # локальный хост или хост в локальной сети, подходит любое значение
        export OLLAMA_API_KEY="your-real-key"   # только https://ollama.com
        ```

        Или в конфигурации: `openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"`.
      </Step>
      <Step title="Выберите модель">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Или в конфигурации:

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

`Cloud + Local` маршрутизирует как локальные модели, так и модели `:cloud` через один доступный
хост Ollama — это гибридный режим Ollama, который следует выбрать во время настройки,
если нужны оба варианта.

OpenClaw запрашивает базовый URL, обнаруживает локальные модели и проверяет
состояние `ollama signin`. Если вход выполнен, предлагаются размещённые варианты по умолчанию
(`kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`, `glm-5.2:cloud`). Если
вход не выполнен, настройка остаётся только локальной до запуска `ollama signin`.

Для доступа только к облаку без локального демона используйте `openclaw onboard --auth-choice ollama-cloud` и см. [Ollama Cloud](/ru/providers/ollama-cloud) — для этого способа не требуется `ollama signin` или запущенный сервер:

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

Список облачных моделей, отображаемый во время `openclaw onboard`, заполняется в реальном времени из
`https://ollama.com/api/tags` и ограничен 500 записями, поэтому средство выбора отражает
текущий каталог размещённых моделей. Если `ollama.com` недоступен или не возвращает
модели во время настройки, OpenClaw использует резервный встроенный список предлагаемых моделей,
чтобы первоначальная настройка всё равно завершилась.

## Обнаружение моделей (неявный провайдер)

Если задан `OLLAMA_API_KEY` (или профиль аутентификации), но не определены ни
`models.providers.ollama`, ни другой пользовательский провайдер с `api: "ollama"`,
OpenClaw обнаруживает модели из `http://127.0.0.1:11434`:

| Поведение                | Подробности                                                                                                                                                                                                                                                                                    |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Запрос каталога          | `/api/tags`                                                                                                                                                                                                                                                                            |
| Определение возможностей | `/api/show` по возможности считывает `contextWindow`, параметры Modelfile `num_ctx` и возможности (зрение/инструменты/рассуждение)                                                                                                                                            |
| Модели с поддержкой зрения | Возможность `vision` из `/api/show` помечает модель как поддерживающую изображения (`input: ["text", "image"]`)                                                                                                                                                                     |
| Определение рассуждения  | Использует возможность `thinking` из `/api/show`, если она доступна; если Ollama не предоставляет возможности, применяется эвристика по имени (`r1`, `reason`, `reasoning`, `think`). `glm-5.2:cloud` и `deepseek-v4-flash\|pro:cloud` всегда считаются моделями рассуждения независимо от заявленных возможностей. |
| Лимиты токенов           | `maxTokens` по умолчанию соответствует максимальному ограничению токенов Ollama в OpenClaw                                                                                                                                                                                              |
| Стоимость                | Вся стоимость равна `0`                                                                                                                                                                                                                                                        |

```bash
ollama list
openclaw models list
```

Задание `models.providers.ollama` с явным массивом `models` или
пользовательского провайдера с `api: "ollama"` и не-loopback-значением `baseUrl` отключает
автоматическое обнаружение; в этом случае модели необходимо определять вручную (см.
[Конфигурация](#configuration)). Запись `models.providers.ollama`, указывающая на
размещённый `https://ollama.com`, также пропускает обнаружение, поскольку моделями Ollama Cloud
управляет провайдер. Пользовательские loopback-провайдеры, такие как
`http://127.0.0.2:11434`, по-прежнему считаются локальными и сохраняют автоматическое обнаружение.

Можно использовать полную ссылку, например `ollama/<pulled-model>:latest`, без
записи `models.json`, созданной вручную; OpenClaw разрешает её в реальном времени. Для хостов,
на которых выполнен вход, выбор отсутствующей в списке ссылки `ollama/<model>:cloud` проверяет именно эту
модель через `/api/show` и добавляет её в каталог среды выполнения, только если Ollama
подтверждает метаданные — опечатки по-прежнему приводят к ошибке неизвестной модели.

### Дымовые тесты

Для узкой проверки текста без загрузки полной поверхности инструментов агента:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Ответь точно: pong" \
    --json
```

Добавьте `--file` с изображением для облегчённой проверки модели с поддержкой зрения (принимаются PNG/JPEG/WebP;
файлы, не являющиеся изображениями, отклоняются до вызова Ollama — для аудио используйте
`openclaw infer audio transcribe`):

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Опиши это изображение одним предложением." \
    --file ./photo.jpg \
    --json
```

Ни один из этих способов не загружает инструменты чата, память или контекст сеанса. Если проверка проходит,
а обычные ответы агента завершаются ошибкой, вероятная причина — способность модели работать с инструментами или агентом,
а не конечная точка.

Выбор модели с помощью `/model ollama/<model>` является точным выбором пользователя: если
настроенный `baseUrl` недоступен, следующий ответ завершится ошибкой провайдера,
а не незаметным переключением на другую настроенную модель.

Изолированные задания cron выполняют одну локальную проверку безопасности перед запуском хода агента:
если выбранная модель разрешается в локального провайдера Ollama, провайдера в частной сети или провайдера `.local`,
а `/api/tags` недоступен, OpenClaw регистрирует этот запуск как
`skipped`, указывая модель в тексте ошибки. Эта проверка конечной точки кэшируется на
5 минут для каждого хоста, поэтому повторные задания cron для остановленного демона не запускают
множество заведомо неудачных запросов.

Проверка в реальной среде:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Для Ollama Cloud направьте тот же интерактивный тест на размещённую конечную точку (по умолчанию
эмбеддинги пропускаются; принудительно включите их с помощью `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`, поскольку
облачный ключ может не предоставлять доступ к `/api/embed`):

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

## Локальный инференс на Node

Агенты могут делегировать короткую задачу модели Ollama на сопряжённом настольном компьютере или
серверном Node. Запрос и ответ передаются через существующее аутентифицированное
соединение Gateway/Node; запрос выполняется через собственную локальную конечную точку Ollama
на Node (`http://127.0.0.1:11434`).

<Steps>
  <Step title="Запустите Ollama на Node">
    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```
  </Step>
  <Step title="Подключите хост Node">
    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    Разрешите устройство и его команды Node на хосте Gateway, затем проверьте:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    Первое подключение или обновление, добавляющее команды Ollama, может вызвать
    запрос на разрешение команд Node. Если Node подключается, не объявляя
    `ollama.models` и `ollama.chat`, снова проверьте `openclaw nodes pending`.

  </Step>
  <Step title="Используйте его из агента">
    Встроенный плагин Ollama предоставляет инструмент `node_inference`. Сначала агенты вызывают
    `action: "discover"`, затем `action: "run"`, указав Node и модель из
    полученного результата (`run` может не указывать Node, если подключён ровно один
    подходящий Node). Например: «Обнаружь модели Ollama на моих Node, затем используй
    самую быструю загруженную модель, чтобы кратко изложить этот текст».
  </Step>
</Steps>

При обнаружении считывается `/api/tags`, проверяются возможности `/api/show`, а когда
доступен `/api/ps`, уже загруженные модели получают приоритет. Возвращаются только
локальные модели, которые Ollama указывает как поддерживающие чат (возможность `completion`) —
строки Ollama Cloud и модели только для эмбеддингов исключаются. При каждом запуске мышление
модели отключается, а объём вывода по умолчанию ограничен 512 токенами (жёсткий предел — 8192), если
вызов инструмента не запрашивает другое значение `maxTokens`; некоторые модели (например GPT-OSS)
не поддерживают отключение мышления и всё равно могут выводить токены рассуждений.

Чтобы Ollama продолжала работать на Node, но не была доступна агентам:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Перезапустите Node (`openclaw node restart` или остановите и снова запустите `openclaw node run`
для сеанса переднего плана). Node перестанет объявлять `ollama.models` и
`ollama.chat`; сама Ollama и провайдер Ollama в Gateway не затрагиваются.
Верните значение `true` и перезапустите для повторного включения; после повторного подключения
изменившийся набор команд может снова потребовать разрешения `openclaw nodes pending`.

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

`--invoke-timeout` ограничивает время, отведённое Node на выполнение команды;
`--timeout` ограничивает общую продолжительность вызова Gateway и должно быть больше.

Локальный инференс на Node всегда использует собственную локальную конечную точку Node —
настроенный удалённый или облачный `models.providers.ollama.baseUrl` не используется повторно. Команды
Node по умолчанию доступны на хостах Node с macOS, Linux и Windows
и по-прежнему подчиняются обычной политике сопряжения и команд Node.

## Компьютерное зрение и описание изображений

Встроенный плагин Ollama регистрирует Ollama как провайдера анализа мультимедиа
с поддержкой изображений, поэтому OpenClaw может направлять явные запросы
на описание изображений и настроенные модели изображений по умолчанию в локальные
или размещённые модели компьютерного зрения Ollama.

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model` должна быть полной ссылкой `<provider/model>`; когда она задана, `infer image
describe` сначала пробует эту модель, а не пропускает описание для моделей,
которые уже имеют встроенную поддержку компьютерного зрения. Если вызов завершится ошибкой, OpenClaw может продолжить
через `agents.defaults.imageModel.fallbacks`; ошибки подготовки файла или URL
возникают до попытки резервного варианта. Используйте `infer image describe` для потока
анализа изображений OpenClaw и настроенного `imageModel`; используйте `infer model run
--file` для прямой мультимодальной проверки с пользовательским запросом.

Чтобы сделать Ollama провайдером анализа изображений по умолчанию для входящих медиафайлов:

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

Предпочтительно использовать полную ссылку `ollama/<model>`. Ссылка `imageModel` без префикса, например
`qwen2.5vl:7b`, нормализуется в `ollama/qwen2.5vl:7b`, только если эта точная модель
указана в `models.providers.ollama.models` с
`input: ["text", "image"]` и ни один другой настроенный провайдер изображений не предоставляет
тот же идентификатор без префикса; в противном случае явно укажите префикс провайдера.

Медленным локальным моделям компьютерного зрения может требоваться более длительный тайм-аут анализа
изображений, чем облачным моделям; на оборудовании с ограниченными ресурсами они могут аварийно завершаться, если Ollama попытается
выделить полный заявленный моделью контекст компьютерного зрения. Задайте тайм-аут
возможности и ограничьте `num_ctx`:

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

Этот тайм-аут применяется к анализу входящих изображений и к явному
инструменту `image`. `models.providers.ollama.timeoutSeconds` по-прежнему управляет
ограничением базового HTTP-запроса Ollama для обычных вызовов модели.

Интерактивная проверка:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Если вы задаёте `models.providers.ollama.models` вручную, явно отметьте модели
компьютерного зрения:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw отклоняет запросы на описание изображений для моделей, не отмеченных
как поддерживающие изображения. При неявном обнаружении это определяется возможностью
компьютерного зрения `/api/show`.

## Конфигурация

<Tabs>
  <Tab title="Базовая (неявное обнаружение)">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Если задан `OLLAMA_API_KEY`, можно не указывать `apiKey` в записи провайдера; OpenClaw подставит его для проверок доступности.
    </Tip>

  </Tab>

  <Tab title="Явная (модели задаются вручную)">
    Используйте явную конфигурацию для облачного размещения, нестандартного хоста или порта, принудительно заданных
    окон контекста или полностью ручных списков моделей:

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

  <Tab title="Пользовательский базовый URL">
    Явная конфигурация отключает автоматическое обнаружение, поэтому модели необходимо перечислить:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // Без /v1 — URL нативного API Ollama
            api: "ollama", // Явно: гарантирует нативное поведение при вызове инструментов
            timeoutSeconds: 300, // Необязательно: увеличенный бюджет подключения и потоковой передачи для холодных локальных моделей
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Необязательно: сохранять модель загруженной между обращениями
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

## Распространённые рецепты

Замените идентификаторы моделей точными именами из `ollama list` или
`openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Локальная модель с автоматическим обнаружением">
    Ollama на том же компьютере, что и Gateway, обнаруживается автоматически:

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    Не добавляйте блок `models.providers.ollama`, если модели не требуется задавать вручную.

  </Accordion>

  <Accordion title="Хост Ollama в локальной сети с моделями, заданными вручную">
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

    `contextWindow` — бюджет контекста OpenClaw; `params.num_ctx` отправляется в
    Ollama. Согласуйте их, если оборудование не может работать с полным
    заявленным контекстом модели.

  </Accordion>

  <Accordion title="Только Ollama Cloud">
    Без локального демона, напрямую с размещёнными моделями:

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

    Если вместо этой структуры нужен отдельный идентификатор провайдера `ollama-cloud`, см.
    [Ollama Cloud](/ru/providers/ollama-cloud).

  </Accordion>

  <Accordion title="Облако и локальные модели через демон с выполненным входом">
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

  <Accordion title="Несколько хостов Ollama">
    Пользовательские идентификаторы провайдеров при запуске нескольких серверов Ollama; у каждого
    собственные хост, модели, аутентификация и тайм-аут.

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

    Перед вызовом Ollama OpenClaw удаляет префикс активного провайдера (используя в качестве запасного варианта обычный
    префикс `ollama/`), поэтому `ollama-large/qwen3.5:27b`
    передаётся в Ollama как `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Облегчённый профиль локальной модели">
    Некоторые локальные модели справляются с простыми запросами, но испытывают трудности с полным набором
    инструментов агента. Ограничьте инструменты и контекст, прежде чем изменять глобальные
    настройки среды выполнения:

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

    Используйте `compat.supportsTools: false`, только если модель или сервер регулярно
    завершаются с ошибкой при обработке схем инструментов: это повышает стабильность за счёт возможностей агента.
    `localModelLean` удаляет ресурсоёмкие инструменты браузера, Cron, сообщений, генерации медиа,
    голоса и PDF из непосредственного набора инструментов агента, если они явно не требуются,
    и помещает более крупные каталоги за Tool Search. Это не изменяет контекст
    среды выполнения Ollama или режим мышления. Используйте эту настройку вместе с `params.num_ctx` и
    `params.thinking: false` для небольших моделей мышления в стиле Qwen, которые зацикливаются или
    расходуют свой бюджет на скрытые рассуждения.

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

Пользовательские идентификаторы провайдеров работают так же: для ссылки с префиксом активного
провайдера, например `ollama-spark/qwen3:32b`, OpenClaw удаляет этот префикс перед
вызовом Ollama и отправляет `qwen3:32b`.

Для медленных локальных моделей сначала настраивайте параметры на уровне провайдера, а не увеличивайте тайм-аут
всей среды выполнения агента:

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

`timeoutSeconds` охватывает HTTP-запрос модели: установление соединения, заголовки,
потоковую передачу тела и общее защищённое прерывание получения данных. `params.keep_alive`
передаётся как `keep_alive` верхнего уровня в нативных запросах `/api/chat`; задавайте его отдельно для
каждой модели, когда узким местом является время загрузки при первом обращении.

### Быстрая проверка

```bash
# Демон Ollama доступен с этого компьютера
curl http://127.0.0.1:11434/api/tags

# Каталог OpenClaw и выбранная модель
openclaw models list --provider ollama
openclaw models status

# Прямая базовая проверка модели
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Ответь в точности: ok"
```

Для удалённых хостов замените `127.0.0.1` на хост `baseUrl`. Если `curl`
работает, а OpenClaw — нет, проверьте, не запущен ли Gateway на другом
компьютере, в контейнере или под другой учётной записью службы.

## Веб-поиск Ollama

OpenClaw включает **веб-поиск Ollama** как провайдер `web_search`.

| Свойство    | Подробности                                                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Хост        | `models.providers.ollama.baseUrl`, если задан, иначе `http://127.0.0.1:11434`; `https://ollama.com` использует размещённый API напрямую                          |
| Аутентификация        | Без ключа для локального хоста с выполненным входом; `OLLAMA_API_KEY` или настроенная аутентификация провайдера для прямого поиска через `https://ollama.com` либо защищённых аутентификацией хостов           |
| Требование | Локальные/самостоятельно размещённые хосты должны быть запущены, а вход должен быть выполнен с помощью `ollama signin`; для прямого размещённого поиска требуется `baseUrl: "https://ollama.com"` и настоящий ключ API |

Выберите его во время `openclaw onboard` или `openclaw configure --section web` либо задайте:

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

Для самостоятельно размещённого хоста OpenClaw сначала пытается использовать локальный прокси
`/api/experimental/web_search`, а затем переходит к размещённому пути `/api/web_search` на том же хосте;
локальный демон с выполненным входом обычно отвечает через локальный прокси. Прямые вызовы
`https://ollama.com` всегда используют размещённую конечную точку `/api/web_search`.

<Note>
Полное описание настройки и поведения см. в разделе [Веб-поиск Ollama](/ru/tools/ollama-search).
</Note>

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Устаревший режим совместимости с OpenAI">
    <Warning>
    **Вызов инструментов в этом режиме ненадёжен.** Используйте его, только если прокси требует формат OpenAI и вы не зависите от нативного вызова инструментов.
    </Warning>

    Явно задайте `api: "openai-completions"` для прокси за
    `/v1/chat/completions`:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // по умолчанию: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    Этот режим может не поддерживать потоковую передачу и вызов инструментов одновременно; возможно,
    потребуется `params: { streaming: false }` в модели.

    По умолчанию OpenClaw внедряет `options.num_ctx` в этом режиме, чтобы Ollama
    не переходил без предупреждения к контексту на 4096 токенов. Если ваш прокси отклоняет
    неизвестные поля `options`, отключите это:

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

  <Accordion title="Окна контекста">
    Для автоматически обнаруженных моделей OpenClaw использует окно контекста, которое сообщает
    `/api/show`, включая увеличенные значения `PARAMETER num_ctx` из пользовательских
    Modelfiles; в противном случае используется стандартное окно контекста Ollama в OpenClaw.

    `contextWindow`, `contextTokens` и `maxTokens` на уровне провайдера задают
    значения по умолчанию для каждой модели этого провайдера и могут быть переопределены отдельно для
    каждой модели. `contextWindow` — собственный бюджет OpenClaw для запросов и Compaction. Нативные
    запросы `/api/chat` оставляют `options.num_ctx` незаданным, если вы явно не задали
    `params.num_ctx`, поэтому Ollama применяет собственное значение модели,
    `OLLAMA_CONTEXT_LENGTH` или значение по умолчанию на основе объёма VRAM; недопустимые, нулевые, отрицательные
    или не являющиеся конечными значения `params.num_ctx` игнорируются. Если старая конфигурация использовала
    только `contextWindow`/`maxTokens`, чтобы принудительно задавать контекст нативного запроса, выполните
    `openclaw doctor --fix`, чтобы скопировать эти значения в `params.num_ctx`. Адаптер,
    совместимый с OpenAI, по-прежнему по умолчанию внедряет `options.num_ctx` из
    настроенного `params.num_ctx` или `contextWindow`; отключите это с помощью
    `injectNumCtxForOpenAICompat: false`, если вышестоящий сервис отклоняет `options`.

    Записи нативных моделей также принимают распространённые параметры среды выполнения Ollama в
    `params`, которые передаются как нативные `/api/chat` `options`: `num_keep`, `seed`,
    `num_predict`, `top_k`, `top_p`, `min_p`, `typical_p`, `repeat_last_n`,
    `temperature`, `repeat_penalty`, `presence_penalty`, `frequency_penalty`,
    `stop`, `num_batch`, `num_gpu`, `main_gpu`, `use_mmap` и `num_thread`.
    Несколько ключей (`format`, `keep_alive`, `truncate`, `shift`) передаются как
    поля запроса верхнего уровня, а не как вложенные `options`. OpenClaw передаёт только
    эти ключи запросов Ollama, поэтому параметры, относящиеся только к среде выполнения, например
    `streaming`, никогда не отправляются в Ollama. Используйте `params.think` (или
    `params.thinking`), чтобы задать `think` верхнего уровня; `false` отключает мышление
    на уровне API для моделей мышления в стиле Qwen.

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

    `agents.defaults.models["ollama/<model>"].params.num_ctx` для отдельной модели также
    работает; если заданы оба значения, приоритет имеет явная запись модели провайдера.

  </Accordion>

  <Accordion title="Управление мышлением">
    OpenClaw передаёт мышление в ожидаемом Ollama формате: `think` верхнего уровня, а не
    `options.think`. Автоматически обнаруженные модели, у которых `/api/show` сообщает о
    возможности `thinking`, предоставляют `/think low`, `/think medium`, `/think high`
    и `/think max`; модели без мышления предоставляют только `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Либо задайте значение по умолчанию для модели:

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

    Настройки для отдельных моделей `params.think`/`params.thinking` могут отключать или принудительно включать
    рассуждение через API для конкретной модели. OpenClaw сохраняет эту явную конфигурацию,
    когда в активном запуске действует только неявное значение по умолчанию `off`; команда среды выполнения,
    отличная от отключения, например `/think medium`, по-прежнему переопределяет её. Запрос
    на рассуждение с истинным значением никогда не отправляется модели, явно помеченной
    `reasoning: false`; запрос `think: false` отправляется всегда.

  </Accordion>

  <Accordion title="Модели рассуждений">
    Модели с именами `deepseek-r1`, `reasoning`, `reason` или `think` по умолчанию считаются
    способными к рассуждению — дополнительная конфигурация не требуется:

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="Стоимость моделей">
    Ollama работает локально и бесплатно, поэтому стоимость всех моделей равна `0` как для
    автоматически обнаруженных, так и для определённых вручную моделей.
  </Accordion>

  <Accordion title="Эмбеддинги памяти">
    Встроенный плагин Ollama регистрирует поставщика эмбеддингов памяти для
    [поиска по памяти](/ru/concepts/memory). Он использует настроенные базовый URL Ollama
    и ключ API, вызывает `/api/embed` и по возможности объединяет несколько фрагментов памяти
    в один запрос `input`.

    Когда `proxy.enabled=true`, запросы эмбеддингов к точному локальному
    loopback-источнику хоста, полученному из настроенного `baseUrl`, используют защищённый
    прямой путь OpenClaw вместо управляемого прокси пересылки. Само настроенное
    имя хоста должно быть `localhost` или литералом loopback-IP — DNS-имена,
    которые лишь разрешаются в loopback-адрес, по-прежнему используют путь через управляемый прокси. Хосты Ollama
    в LAN, tailnet, частной или публичной сети всегда используют
    путь через управляемый прокси, а перенаправления на другой хост или порт не наследуют
    доверие. `proxy.loopbackMode: "proxy"` всё равно направляет loopback-трафик через
    прокси; `proxy.loopbackMode: "block"` запрещает его до подключения —
    см. [Управляемый прокси](/ru/security/network-proxy#gateway-loopback-mode).

    | Свойство | Значение |
    | --- | --- |
    | Модель по умолчанию | `nomic-embed-text` |
    | Автоматическое скачивание | Да, если модель отсутствует локально |
    | Параллелизм по умолчанию без пакетной обработки | 1 (у других поставщиков значение по умолчанию выше; увеличьте его с помощью `nonBatchConcurrency`, если хост справится) |

    Эмбеддинги во время запроса используют префиксы поиска для моделей, которые их требуют или
    рекомендуют: `nomic-embed-text`, `qwen3-embedding` и
    `mxbai-embed-large`. Пакеты документов остаются без изменений, поэтому существующим индексам
    не требуется миграция формата.

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Значение по умолчанию для Ollama. Увеличьте на более мощных хостах, если переиндексация выполняется слишком медленно.
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

  <Accordion title="Конфигурация потоковой передачи">
    По умолчанию Ollama использует **нативный API** (`/api/chat`), который одновременно поддерживает
    потоковую передачу и вызов инструментов — специальная конфигурация не требуется.

    Для нативных запросов управление рассуждением передаётся напрямую: `/think off`
    и `openclaw agent --thinking off` отправляют верхнеуровневый `think: false`, если
    явно не настроен `params.think`/`params.thinking`; `/think
    low|medium|high` отправляют соответствующую строку уровня усилий; `/think max` сопоставляется
    с максимальным уровнем усилий Ollama — `think: "high"`.

    <Tip>
    Чтобы вместо этого использовать OpenAI-совместимую конечную точку, см. раздел «Устаревший OpenAI-совместимый режим» выше — потоковая передача и вызов инструментов в нём могут не работать одновременно.
    </Tip>

  </Accordion>
</AccordionGroup>

## Устранение неполадок

<AccordionGroup>
  <Accordion title="Циклические сбои WSL2 (повторные перезагрузки)">
    В WSL2 с NVIDIA/CUDA официальный установщик Ollama для Linux создаёт
    модуль systemd `ollama.service` с `Restart=always`. Если эта служба
    запускается автоматически и загружает модель с поддержкой GPU при загрузке WSL2, Ollama может закрепить
    память хоста во время загрузки; механизм освобождения памяти Hyper-V не всегда может освободить
    эти страницы, поэтому Windows может завершить работу виртуальной машины WSL2, systemd перезапустит
    Ollama, и цикл повторится.

    Признаки: повторные перезагрузки или завершения работы WSL2, высокая загрузка CPU процессом `app.slice` или
    `ollama.service` сразу после запуска WSL2, а также SIGTERM от systemd, а
    не от механизма Linux OOM killer.

    OpenClaw записывает предупреждение при запуске, когда обнаруживает WSL2, включённый `ollama.service`
    с `Restart=always` и видимые маркеры CUDA.

    Способ устранения:

    ```bash
    sudo systemctl disable ollama
    ```

    На стороне Windows добавьте следующую настройку в `%USERPROFILE%\.wslconfig`, затем выполните
    `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Либо сократите время keep-alive или запускайте Ollama вручную только при необходимости:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    См. [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama не обнаружен">
    Убедитесь, что Ollama запущен, задан `OLLAMA_API_KEY` (или профиль аутентификации),
    а `models.providers.ollama` **не** определён явно:

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Нет доступных моделей">
    Скачайте модель локально или явно определите её в
    `models.providers.ollama`:

    ```bash
    ollama list  # Просмотреть установленные модели
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Или другую модель
    ```

  </Accordion>

  <Accordion title="В подключении отказано">
    ```bash
    # Проверьте, запущен ли Ollama
    ps aux | grep ollama

    # Или перезапустите Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Удалённый хост работает с curl, но не с OpenClaw">
    Выполните проверку на той же машине и в той же среде выполнения, где работает Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Распространённые причины:

    - `baseUrl` указывает на `localhost`, но Gateway работает в Docker или на другом хосте.
    - URL использует `/v1`, выбирая OpenAI-совместимое поведение вместо нативного Ollama.
    - Для удалённого хоста необходимо изменить настройки межсетевого экрана или привязки к LAN.
    - Модель находится в демоне на вашем ноутбуке, но отсутствует на удалённом хосте.

  </Accordion>

  <Accordion title="Модель выводит JSON инструмента как текст">
    Обычно поставщик работает в OpenAI-совместимом режиме или модель не может
    обрабатывать схемы инструментов. Предпочтительно использовать нативный режим:

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

  <Accordion title="Kimi или GLM возвращает искажённые символы">
    Ответы размещённых моделей Kimi/GLM, представляющие собой длинные последовательности
    нелингвистических символов, считаются неудачным вызовом поставщика, а не успешным ответом, поэтому
    вместо сохранения повреждённого текста в сеансе запускается обычная
    обработка повторной попытки, резервного варианта или ошибки.

    Если проблема повторится, сохраните имя модели, текущий файл сеанса и
    сведения о том, использовал ли запуск `Cloud + Local` или `Cloud only`, затем попробуйте новый
    сеанс и резервную модель:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Ответь точно: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Холодный запуск локальной модели завершается по тайм-ауту">
    Первичная загрузка крупных локальных моделей может занимать много времени. Ограничьте область действия тайм-аута
    поставщиком Ollama и при необходимости сохраняйте модель загруженной между обращениями:

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

    Если сам хост медленно принимает подключения, `timeoutSeconds` также
    увеличивает защищённый тайм-аут подключения для этого поставщика.

  </Accordion>

  <Accordion title="Модель с большим контекстом работает слишком медленно или исчерпывает память">
    Многие модели заявляют размер контекста, с которым ваше оборудование не может
    комфортно работать. Нативный Ollama использует собственное значение среды выполнения по умолчанию, если
    не задан `params.num_ctx`. Ограничьте и бюджет OpenClaw, и контекст запроса Ollama,
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
    Уменьшите `maxTokens`, если генерация выполняется слишком долго.

  </Accordion>
</AccordionGroup>

<Note>
Дополнительная помощь: [Устранение неполадок](/ru/help/troubleshooting) и [Часто задаваемые вопросы](/ru/help/faq).
</Note>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/ru/providers/ollama-cloud" icon="cloud">
    Настройка только для облака с отдельным поставщиком `ollama-cloud`.
  </Card>
  <Card title="Поставщики моделей" href="/ru/concepts/model-providers" icon="layers">
    Обзор всех поставщиков, ссылок на модели и поведения при переключении на резервный вариант.
  </Card>
  <Card title="Выбор модели" href="/ru/concepts/models" icon="brain">
    Как выбирать и настраивать модели.
  </Card>
  <Card title="Веб-поиск Ollama" href="/ru/tools/ollama-search" icon="magnifying-glass">
    Полные сведения о настройке и поведении веб-поиска на базе Ollama.
  </Card>
  <Card title="Конфигурация" href="/ru/gateway/configuration" icon="gear">
    Полный справочник по конфигурации.
  </Card>
</CardGroup>

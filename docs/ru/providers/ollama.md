---
read_when:
    - Вы хотите запускать OpenClaw с облачными или локальными моделями через Ollama
    - Вам нужны инструкции по настройке и конфигурации Ollama
    - Вам нужны vision-модели Ollama для понимания изображений
summary: Запуск OpenClaw с Ollama (облачные и локальные модели)
title: Ollama
x-i18n:
    generated_at: "2026-06-28T23:38:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 929db683f4861f117f5866bdbc4af9a70752b2848a6f09437eb2f8b32b5ff37b
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw интегрируется с нативным API Ollama (`/api/chat`) для размещенных облачных моделей и локальных/самостоятельно размещенных серверов Ollama. Вы можете использовать Ollama в трех режимах: `Cloud + Local` через доступный хост Ollama, `Cloud only` с `https://ollama.com` или `Local only` с доступным хостом Ollama.

OpenClaw также регистрирует `ollama-cloud` как полноценный id размещенного провайдера для
прямого использования Ollama Cloud. Используйте ссылки вроде `ollama-cloud/kimi-k2.5:cloud`, когда
нужна маршрутизация только в облако без совместного использования id локального провайдера `ollama`.

Для отдельной страницы настройки только для облака см. [Ollama Cloud](/ru/providers/ollama-cloud).

<Warning>
**Пользователи удаленного Ollama**: не используйте OpenAI-совместимый URL `/v1` (`http://host:11434/v1`) с OpenClaw. Это ломает вызов инструментов, и модели могут выводить необработанный JSON инструментов как обычный текст. Вместо этого используйте URL нативного API Ollama: `baseUrl: "http://host:11434"` (без `/v1`).
</Warning>

Конфигурация провайдера Ollama использует `baseUrl` как канонический ключ. OpenClaw также принимает `baseURL` для совместимости с примерами в стиле OpenAI SDK, но в новой конфигурации следует предпочитать `baseUrl`.

## Правила аутентификации

<AccordionGroup>
  <Accordion title="Локальные хосты и хосты LAN">
    Локальным хостам и хостам LAN Ollama не нужен настоящий bearer token. OpenClaw использует локальный маркер `ollama-local` только для базовых URL Ollama с loopback, частной сетью, `.local` и простыми именами хостов.
  </Accordion>
  <Accordion title="Удаленные хосты и хосты Ollama Cloud">
    Удаленные публичные хосты и Ollama Cloud (`https://ollama.com`) требуют реальные учетные данные через `OLLAMA_API_KEY`, профиль аутентификации или `apiKey` провайдера. Для прямого размещенного использования предпочитайте провайдер `ollama-cloud`.
  </Accordion>
  <Accordion title="Пользовательские id провайдеров">
    Пользовательские id провайдеров, которые задают `api: "ollama"`, следуют тем же правилам. Например, провайдер `ollama-remote`, указывающий на приватный хост Ollama в LAN, может использовать `apiKey: "ollama-local"`, и подагенты будут разрешать этот маркер через хук провайдера Ollama, а не считать его отсутствующими учетными данными. Поиск по памяти также может задать `agents.defaults.memorySearch.provider` равным этому пользовательскому id провайдера, чтобы embeddings использовали соответствующий endpoint Ollama.
  </Accordion>
  <Accordion title="Профили аутентификации">
    `auth-profiles.json` хранит учетные данные для id провайдера. Помещайте настройки endpoint (`baseUrl`, `api`, id моделей, заголовки, тайм-ауты) в `models.providers.<id>`. Старые плоские файлы профилей аутентификации, такие как `{ "ollama-windows": { "apiKey": "ollama-local" } }`, не являются форматом времени выполнения; выполните `openclaw doctor --fix`, чтобы переписать их в канонический профиль API-ключа `ollama-windows:default` с резервной копией. `baseUrl` в этом файле является шумом совместимости и должен быть перенесен в конфигурацию провайдера.
  </Accordion>
  <Accordion title="Область embedding памяти">
    Когда Ollama используется для embeddings памяти, bearer-аутентификация ограничена хостом, где она была объявлена:

    - Ключ уровня провайдера отправляется только на хост Ollama этого провайдера.
    - `agents.*.memorySearch.remote.apiKey` отправляется только на свой удаленный хост embedding.
    - Чистое значение env `OLLAMA_API_KEY` рассматривается как соглашение Ollama Cloud и по умолчанию не отправляется локальным или самостоятельно размещенным хостам.

  </Accordion>
</AccordionGroup>

## Начало работы

Выберите предпочитаемый способ настройки и режим.

<Tabs>
  <Tab title="Onboarding (рекомендуется)">
    **Лучше всего для:** самого быстрого пути к рабочей облачной или локальной настройке Ollama.

    <Steps>
      <Step title="Запустите onboarding">
        ```bash
        openclaw onboard
        ```

        Выберите **Ollama** из списка провайдеров.
      </Step>
      <Step title="Выберите режим">
        - **Cloud + Local** — локальный хост Ollama плюс облачные модели, маршрутизируемые через этот хост
        - **Cloud only** — размещенные модели Ollama через `https://ollama.com`
        - **Local only** — только локальные модели

      </Step>
      <Step title="Выберите модель">
        `Cloud only` запрашивает `OLLAMA_API_KEY` и предлагает размещенные облачные значения по умолчанию. `Cloud + Local` и `Local only` запрашивают базовый URL Ollama, обнаруживают доступные модели и автоматически загружают выбранную локальную модель, если она еще недоступна. Когда Ollama сообщает об установленном теге `:latest`, таком как `gemma4:latest`, настройка показывает эту установленную модель один раз вместо отображения и `gemma4`, и `gemma4:latest` или повторной загрузки голого псевдонима. `Cloud + Local` также проверяет, выполнен ли вход на этом хосте Ollama для доступа к облаку.
      </Step>
      <Step title="Проверьте доступность модели">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### Неинтерактивный режим

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    При необходимости укажите пользовательский базовый URL или модель:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Ручная настройка">
    **Лучше всего для:** полного контроля над облачной или локальной настройкой.

    <Steps>
      <Step title="Выберите облако или локальный режим">
        - **Cloud + Local**: установите Ollama, войдите с помощью `ollama signin` и маршрутизируйте облачные запросы через этот хост
        - **Cloud only**: используйте `https://ollama.com` с `OLLAMA_API_KEY`
        - **Local only**: установите Ollama с [ollama.com/download](https://ollama.com/download)

      </Step>
      <Step title="Загрузите локальную модель (только локальный режим)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Включите Ollama для OpenClaw">
        Для `Cloud only` используйте настоящий `OLLAMA_API_KEY`. Для настроек с хостом подойдет любое placeholder-значение:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Просмотрите и задайте модель">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Или задайте значение по умолчанию в конфигурации:

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

## Облачные модели

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local` использует доступный хост Ollama как точку управления и для локальных, и для облачных моделей. Это предпочитаемый гибридный поток Ollama.

    Используйте **Cloud + Local** во время настройки. OpenClaw запрашивает базовый URL Ollama, обнаруживает локальные модели с этого хоста и проверяет, выполнен ли вход на хосте для облачного доступа с помощью `ollama signin`. Когда вход выполнен, OpenClaw также предлагает размещенные облачные значения по умолчанию, такие как `kimi-k2.5:cloud`, `minimax-m2.7:cloud` и `glm-5.1:cloud`.

    Если вход на хосте еще не выполнен, OpenClaw сохраняет настройку только локальной, пока вы не выполните `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` работает с размещенным API Ollama по адресу `https://ollama.com`.

    Используйте **Cloud only** во время настройки. OpenClaw запрашивает `OLLAMA_API_KEY`, задает `baseUrl: "https://ollama.com"` и заполняет список размещенных облачных моделей. Этот путь **не** требует локального сервера Ollama или `ollama signin`.

    Список облачных моделей, показанный во время `openclaw onboard`, заполняется live из `https://ollama.com/api/tags`, ограничен 500 записями, поэтому выбор отражает текущий размещенный каталог, а не статический seed. Если `ollama.com` недоступен или не возвращает моделей во время настройки, OpenClaw возвращается к предыдущим жестко заданным предложениям, чтобы onboarding все равно завершился.

    Также можно напрямую настроить первоклассный облачный провайдер:

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="Local only">
    В режиме только локальных моделей OpenClaw обнаруживает модели из настроенного экземпляра Ollama. Этот путь предназначен для локальных или самостоятельно размещенных серверов Ollama.

    В настоящее время OpenClaw предлагает `gemma4` как локальное значение по умолчанию.

  </Tab>
</Tabs>

## Обнаружение моделей (неявный провайдер)

Когда вы задаете `OLLAMA_API_KEY` (или профиль аутентификации) и **не** определяете `models.providers.ollama` или другой пользовательский удаленный провайдер с `api: "ollama"`, OpenClaw обнаруживает модели из локального экземпляра Ollama по адресу `http://127.0.0.1:11434`.

| Поведение            | Детали                                                                                                                                                                        |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Запрос каталога      | Запрашивает `/api/tags`                                                                                                                                                       |
| Обнаружение возможностей | Использует best-effort обращения к `/api/show`, чтобы прочитать `contextWindow`, расширенные параметры Modelfile `num_ctx` и возможности, включая vision/tools           |
| Модели vision        | Модели с возможностью `vision`, сообщенной `/api/show`, помечаются как поддерживающие изображения (`input: ["text", "image"]`), поэтому OpenClaw автоматически добавляет изображения в prompt |
| Обнаружение reasoning | Использует возможности `/api/show`, когда они доступны, включая `thinking`; возвращается к эвристике по имени модели (`r1`, `reasoning`, `think`), когда Ollama опускает возможности |
| Лимиты токенов       | Задает `maxTokens` равным стандартному ограничению max-token Ollama, используемому OpenClaw                                                                                   |
| Стоимость            | Задает все стоимости равными `0`                                                                                                                                              |

Это позволяет избежать ручных записей моделей, сохраняя каталог согласованным с локальным экземпляром Ollama. Вы можете использовать полную ссылку, например `ollama/<pulled-model>:latest`, в локальном `infer model run`; OpenClaw разрешает эту установленную модель из live-каталога Ollama без необходимости вручную написанной записи в `models.json`.

Для хостов Ollama с выполненным входом некоторые модели `:cloud` могут быть доступны через `/api/chat`
и `/api/show` до того, как появятся в `/api/tags`. Когда вы явно выбираете
полную ссылку `ollama/<model>:cloud`, OpenClaw проверяет именно эту отсутствующую модель с помощью
`/api/show` и добавляет ее в runtime-каталог только если Ollama подтверждает
метаданные модели. Опечатки по-прежнему завершаются ошибкой неизвестной модели, а не автоматически создаются.

```bash
# See what models are available
ollama list
openclaw models list
```

Для узкого smoke test генерации текста, который обходит полную поверхность инструментов агента,
используйте локальный `infer model run` с полной ссылкой на модель Ollama:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Этот путь по-прежнему использует настроенный провайдер, аутентификацию и нативный транспорт Ollama
OpenClaw, но он не запускает ход chat-agent и не загружает контекст MCP/инструментов. Если
это проходит успешно, а обычные ответы агента завершаются ошибкой, далее диагностируйте емкость модели
для agent prompt/инструментов.

Для узкого smoke test модели vision на том же легковесном пути добавьте один или несколько
файлов изображений в `infer model run`. Это отправляет prompt и изображение напрямую в
выбранную модель Ollama vision без загрузки chat-инструментов, памяти или предыдущего
контекста сессии:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

`model run --file` принимает файлы, определенные как `image/*`, включая распространенные входные PNG,
JPEG и WebP. Неизображения отклоняются до вызова Ollama.
Для распознавания речи используйте вместо этого `openclaw infer audio transcribe`.

Когда вы переключаете разговор с помощью `/model ollama/<model>`, OpenClaw трактует
это как точный выбор пользователя. Если настроенный Ollama `baseUrl`
недоступен, следующий ответ завершается ошибкой провайдера вместо того, чтобы незаметно
ответить через другую настроенную резервную модель.

Изолированные задания cron выполняют одну дополнительную локальную проверку безопасности перед запуском хода агента.
Если выбранная модель разрешается в локальный, частной сети или `.local`
провайдер Ollama и `/api/tags` недоступен, OpenClaw записывает этот запуск cron
как `skipped` с выбранным `ollama/<model>` в тексте ошибки. Предварительная проверка endpoint
кэшируется на 5 минут, поэтому несколько заданий cron, указывающих на один и тот же
остановленный daemon Ollama, не запускают все неудачные запросы к модели.

Проверьте вживую локальный текстовый путь, нативный путь потока и embeddings на
локальном Ollama с помощью:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Для smoke-тестов ключа API Ollama Cloud укажите live-тесту `https://ollama.com`
и выберите размещенную модель из текущего каталога:

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Cloud-smoke запускает текст, нативный поток и веб-поиск. Он по умолчанию пропускает embeddings для
`https://ollama.com`, потому что ключи API Ollama Cloud могут не давать доступ к
`/api/embed`. Установите `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`, если вы явно хотите,
чтобы live-тест завершался ошибкой, если настроенный cloud-ключ не может использовать endpoint embed.

Чтобы добавить новую модель, просто загрузите ее через Ollama:

```bash
ollama pull mistral
```

Новая модель будет автоматически обнаружена и доступна для использования.

<Note>
Если вы явно задаете `models.providers.ollama` или настраиваете пользовательский удаленный провайдер, например `models.providers.ollama-cloud` с `api: "ollama"`, автообнаружение пропускается, и модели нужно определить вручную. Пользовательские loopback-провайдеры, такие как `http://127.0.0.2:11434`, по-прежнему считаются локальными. См. раздел явной конфигурации ниже.
</Note>

## Зрение и описание изображений

Встроенный Plugin Ollama регистрирует Ollama как провайдера понимания медиа с поддержкой изображений. Это позволяет OpenClaw маршрутизировать явные запросы на описание изображений и настроенные значения по умолчанию для image-моделей через локальные или размещенные vision-модели Ollama.

Для локального зрения загрузите модель, поддерживающую изображения:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Затем проверьте через infer CLI:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` должен быть полной ссылкой `<provider/model>`. Когда он задан, `openclaw infer image describe` запускает эту модель напрямую вместо пропуска описания из-за того, что модель поддерживает нативное зрение.

Используйте `infer image describe`, когда вам нужен поток провайдера понимания изображений OpenClaw, настроенный `agents.defaults.imageModel` и форма вывода описания изображения. Используйте `infer model run --file`, когда вам нужна сырая проверка мультимодальной модели с пользовательским prompt и одним или несколькими изображениями.

Чтобы сделать Ollama моделью понимания изображений по умолчанию для входящих медиа, настройте `agents.defaults.imageModel`:

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

Предпочитайте полную ссылку `ollama/<model>`. Если та же модель указана в `models.providers.ollama.models` с `input: ["text", "image"]` и никакой другой настроенный провайдер изображений не предоставляет этот bare ID модели, OpenClaw также нормализует bare-ссылку `imageModel`, например `qwen2.5vl:7b`, в `ollama/qwen2.5vl:7b`. Если более одного настроенного провайдера изображений имеет один и тот же bare ID, явно используйте префикс провайдера.

Медленным локальным vision-моделям может требоваться более долгий timeout понимания изображений, чем cloud-моделям. Они также могут аварийно завершаться или останавливаться, когда Ollama пытается выделить полный заявленный vision-контекст на ограниченном оборудовании. Задайте timeout для capability и ограничьте `num_ctx` в записи модели, когда вам нужен только обычный ход описания изображения:

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

Этот timeout применяется к пониманию входящих изображений и к явному инструменту `image`, который агент может вызвать во время хода. `models.providers.ollama.timeoutSeconds` на уровне провайдера по-прежнему управляет базовой защитой HTTP-запроса Ollama для обычных вызовов модели.

Проверьте вживую явный инструмент image на локальном Ollama с помощью:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Если вы определяете `models.providers.ollama.models` вручную, пометьте vision-модели поддержкой входных изображений:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw отклоняет запросы описания изображений для моделей, которые не помечены как поддерживающие изображения. При неявном обнаружении OpenClaw считывает это из Ollama, когда `/api/show` сообщает о capability vision.

## Конфигурация

<Tabs>
  <Tab title="Базовая (неявное обнаружение)">
    Самый простой локальный путь включения — через переменную окружения:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Если `OLLAMA_API_KEY` задан, можно опустить `apiKey` в записи провайдера, и OpenClaw заполнит его для проверок доступности.
    </Tip>

  </Tab>

  <Tab title="Явная (ручные модели)">
    Используйте явную конфигурацию, когда вам нужна настройка размещенного cloud, Ollama работает на другом хосте/порту, вы хотите принудительно задать конкретные окна контекста или списки моделей либо хотите полностью ручные определения моделей.

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
    Если Ollama работает на другом хосте или порту (явная конфигурация отключает автообнаружение, поэтому определите модели вручную):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // Без /v1 - используйте URL нативного API Ollama
            api: "ollama", // Задайте явно, чтобы гарантировать нативное поведение вызова инструментов
            timeoutSeconds: 300, // Необязательно: дайте холодным локальным моделям больше времени на подключение и потоковую передачу
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // Необязательно: держать модель загруженной между ходами
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    Не добавляйте `/v1` к URL. Путь `/v1` использует режим совместимости с OpenAI, в котором вызов инструментов ненадежен. Используйте базовый URL Ollama без суффикса пути.
    </Warning>

  </Tab>
</Tabs>

## Распространенные рецепты

Используйте их как отправные точки и замените ID моделей точными именами из `ollama list` или `openclaw models list --provider ollama`.

<AccordionGroup>
  <Accordion title="Локальная модель с автообнаружением">
    Используйте это, когда Ollama работает на той же машине, что и Gateway, и вы хотите, чтобы OpenClaw автоматически обнаруживал установленные модели.

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    Этот путь сохраняет конфигурацию минимальной. Не добавляйте блок `models.providers.ollama`, если не хотите определять модели вручную.

  </Accordion>

  <Accordion title="LAN-хост Ollama с ручными моделями">
    Используйте нативные URL Ollama для LAN-хостов. Не добавляйте `/v1`.

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

    `contextWindow` — это бюджет контекста на стороне OpenClaw. `params.num_ctx` отправляется в Ollama для запроса. Держите их согласованными, когда ваше оборудование не может запустить полный заявленный контекст модели.

  </Accordion>

  <Accordion title="Только Ollama Cloud">
    Используйте это, когда вы не запускаете локальный daemon и хотите напрямую использовать размещенные модели Ollama.

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

  </Accordion>

  <Accordion title="Cloud плюс локальные модели через daemon с выполненным входом">
    Используйте это, когда локальный или LAN daemon Ollama вошел в систему через `ollama signin` и должен обслуживать и локальные модели, и модели `:cloud`.

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
    Используйте пользовательские ID провайдеров, когда у вас больше одного сервера Ollama. Каждый провайдер получает собственный хост, модели, auth, timeout и ссылки на модели.

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

    Когда OpenClaw отправляет запрос, активный префикс провайдера удаляется, поэтому `ollama-large/qwen3.5:27b` поступает в Ollama как `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Облегченный профиль локальной модели">
    Некоторые локальные модели могут отвечать на простые промпты, но испытывают трудности с полной поверхностью инструментов агента. Начните с ограничения инструментов и контекста, прежде чем менять глобальные настройки среды выполнения.

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

    Используйте `compat.supportsTools: false` только когда модель или сервер стабильно не справляются со схемами инструментов. Это обменивает возможности агента на стабильность.
    `localModelLean` удаляет браузер, Cron и инструменты сообщений с прямой поверхности агента и по умолчанию помещает более крупные каталоги за структурированные элементы управления поиском инструментов, кроме случаев, когда запуск должен сохранить семантику прямой доставки сообщений, но не меняет контекст среды выполнения Ollama или режим мышления. Сочетайте это с явными `params.num_ctx` и `params.thinking: false` для небольших моделей мышления в стиле Qwen, которые зацикливаются или тратят бюджет ответа на скрытое рассуждение.

  </Accordion>
</AccordionGroup>

### Выбор модели

После настройки доступны все ваши модели Ollama:

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

Также поддерживаются пользовательские идентификаторы провайдеров Ollama. Когда ссылка на модель использует активный
префикс провайдера, например `ollama-spark/qwen3:32b`, OpenClaw удаляет только этот
префикс перед вызовом Ollama, поэтому сервер получает `qwen3:32b`.

Для медленных локальных моделей предпочитайте настройку запросов в рамках провайдера, прежде чем увеличивать
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

`timeoutSeconds` применяется к HTTP-запросу модели, включая установку соединения,
заголовки, потоковую передачу тела и полное прерывание защищенной выборки. `params.keep_alive`
передается в Ollama как верхнеуровневый `keep_alive` в нативных запросах `/api/chat`;
задавайте его для каждой модели, когда узким местом является время загрузки первого хода.

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

Для удаленных хостов замените `127.0.0.1` на хост, используемый в `baseUrl`. Если `curl` работает, а OpenClaw — нет, проверьте, не работает ли Gateway на другой машине, в контейнере или под другой сервисной учетной записью.

## Веб-поиск Ollama

OpenClaw поддерживает **веб-поиск Ollama** как встроенный провайдер `web_search`.

| Свойство    | Подробности                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Хост        | Использует настроенный хост Ollama (`models.providers.ollama.baseUrl`, если задан, иначе `http://127.0.0.1:11434`); `https://ollama.com` использует размещенный API напрямую |
| Аутентификация        | Без ключа для локальных хостов Ollama с выполненным входом; `OLLAMA_API_KEY` или настроенная аутентификация провайдера для прямого поиска через `https://ollama.com` или хостов, защищенных аутентификацией               |
| Требование | Локальные/самостоятельно размещенные хосты должны быть запущены и авторизованы через `ollama signin`; прямой размещенный поиск требует `baseUrl: "https://ollama.com"` плюс настоящий ключ API Ollama |

Выберите **веб-поиск Ollama** во время `openclaw onboard` или `openclaw configure --section web`, либо задайте:

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

Для прямого размещенного поиска через Ollama Cloud:

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

Для локального демона с выполненным входом OpenClaw использует прокси демона `/api/experimental/web_search`. Для `https://ollama.com` он напрямую вызывает размещенную конечную точку `/api/web_search`.

<Note>
Полные сведения о настройке и поведении см. в [веб-поиске Ollama](/ru/tools/ollama-search).
</Note>

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Устаревший OpenAI-совместимый режим">
    <Warning>
    **Вызов инструментов ненадежен в OpenAI-совместимом режиме.** Используйте этот режим только если вам нужен формат OpenAI для прокси и вы не зависите от нативного поведения вызова инструментов.
    </Warning>

    Если вместо этого нужно использовать OpenAI-совместимую конечную точку (например, за прокси, который поддерживает только формат OpenAI), явно задайте `api: "openai-completions"`:

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

    Этот режим может не поддерживать потоковую передачу и вызов инструментов одновременно. Возможно, потребуется отключить потоковую передачу с помощью `params: { streaming: false }` в конфигурации модели.

    Когда `api: "openai-completions"` используется с Ollama, OpenClaw по умолчанию внедряет `options.num_ctx`, чтобы Ollama не откатывалась молча к контекстному окну 4096. Если ваш прокси или вышестоящий сервис отклоняет неизвестные поля `options`, отключите это поведение:

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

  <Accordion title="Контекстные окна">
    Для автоматически обнаруженных моделей OpenClaw использует контекстное окно, сообщаемое Ollama, когда оно доступно, включая более крупные значения `PARAMETER num_ctx` из пользовательских Modelfiles. В противном случае он откатывается к контекстному окну Ollama по умолчанию, используемому OpenClaw.

    Вы можете задать значения по умолчанию `contextWindow`, `contextTokens` и `maxTokens` на уровне провайдера для каждой модели под этим провайдером Ollama, а затем переопределять их для отдельных моделей при необходимости. `contextWindow` — это бюджет промпта и Compaction в OpenClaw. Нативные запросы Ollama оставляют `options.num_ctx` незаданным, если вы явно не настроите `params.num_ctx`, поэтому Ollama может применить собственное значение по умолчанию на основе модели, `OLLAMA_CONTEXT_LENGTH` или VRAM. Чтобы ограничить или принудительно задать контекст среды выполнения Ollama для каждого запроса без пересборки Modelfile, задайте `params.num_ctx`; недопустимые, нулевые, отрицательные и не конечные значения игнорируются. Если вы обновили старую конфигурацию, которая использовала только `contextWindow` или `maxTokens` для принудительного задания контекста нативного запроса Ollama, запустите `openclaw doctor --fix`, чтобы скопировать эти явные бюджеты провайдера или модели в `params.num_ctx`. OpenAI-совместимый адаптер Ollama по-прежнему по умолчанию внедряет `options.num_ctx` из настроенных `params.num_ctx` или `contextWindow`; отключите это с помощью `injectNumCtxForOpenAICompat: false`, если ваш вышестоящий сервис отклоняет `options`.

    Нативные записи моделей Ollama также принимают общие параметры среды выполнения Ollama в `params`, включая `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` и `use_mmap`. OpenClaw пересылает только ключи запросов Ollama, поэтому параметры среды выполнения OpenClaw, такие как `streaming`, не попадают в Ollama. Используйте `params.think` или `params.thinking`, чтобы отправить верхнеуровневый `think` Ollama; `false` отключает мышление на уровне API для моделей мышления в стиле Qwen.

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

    `agents.defaults.models["ollama/<model>"].params.num_ctx` для каждой модели тоже работает. Если настроены оба варианта, явная запись модели провайдера имеет приоритет над значением по умолчанию агента.

  </Accordion>

  <Accordion title="Управление мышлением">
    Для нативных моделей Ollama OpenClaw пересылает управление мышлением так, как ожидает Ollama: верхнеуровневый `think`, а не `options.think`. Автоматически обнаруженные модели, чей ответ `/api/show` включает возможность `thinking`, предоставляют `/think low`, `/think medium`, `/think high` и `/think max`; модели без мышления предоставляют только `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Также можно задать значение модели по умолчанию:

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

    `params.think` или `params.thinking` для каждой модели могут отключить или принудительно включить мышление API Ollama для конкретной настроенной модели. OpenClaw сохраняет эти явные параметры модели, когда активный запуск имеет только неявное значение по умолчанию `off`; команды среды выполнения не `off`, такие как `/think medium`, все равно переопределяют активный запуск.

  </Accordion>

  <Accordion title="Модели рассуждения">
    OpenClaw по умолчанию рассматривает модели с именами вроде `deepseek-r1`, `reasoning` или `think` как поддерживающие рассуждение.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Дополнительная настройка не требуется. OpenClaw помечает их автоматически.

  </Accordion>

  <Accordion title="Стоимость моделей">
    Ollama бесплатна и работает локально, поэтому все стоимости моделей установлены в $0. Это относится как к автоматически обнаруженным, так и к вручную определенным моделям.
  </Accordion>

  <Accordion title="Эмбеддинги памяти">
    Встроенный Plugin Ollama регистрирует поставщика эмбеддингов памяти для
    [поиска по памяти](/ru/concepts/memory). Он использует настроенный базовый URL
    Ollama и ключ API, вызывает текущий endpoint Ollama `/api/embed` и, когда
    возможно, объединяет несколько фрагментов памяти в один запрос `input`.

    Когда `proxy.enabled=true`, запросы эмбеддингов памяти Ollama к точному
    host-local loopback origin, выведенному из настроенного `baseUrl`, используют
    защищенный прямой путь OpenClaw вместо управляемого прокси пересылки.
    Настроенное имя хоста само должно быть `localhost` или буквальным loopback
    IP-адресом; DNS-имена, которые лишь разрешаются в loopback, все равно
    используют путь управляемого прокси. LAN, tailnet, частные сети и публичные
    хосты Ollama также остаются на пути управляемого прокси. Перенаправления на
    другой хост или порт не наследуют доверие. Операторы все еще могут задать
    глобальную настройку `proxy.loopbackMode: "proxy"`, чтобы отправлять loopback
    трафик через прокси, или `proxy.loopbackMode: "block"`, чтобы запрещать
    loopback подключения до открытия соединения; см.
    [Управляемый прокси](/ru/security/network-proxy#gateway-loopback-mode) для
    эффекта этой настройки на весь процесс.

    | Свойство             | Значение               |
    | -------------------- | ---------------------- |
    | Модель по умолчанию  | `nomic-embed-text`     |
    | Автозагрузка         | Да — модель эмбеддингов загружается автоматически, если ее нет локально |

    Эмбеддинги во время запроса используют префиксы извлечения для моделей, которым они требуются или рекомендованы, включая `nomic-embed-text`, `qwen3-embedding` и `mxbai-embed-large`. Пакеты документов памяти остаются необработанными, чтобы существующим индексам не требовалась миграция формата.

    Чтобы выбрать Ollama как поставщика эмбеддингов для поиска по памяти:

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

    Для удаленного хоста эмбеддингов держите аутентификацию ограниченной этим хостом:

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
    Интеграция Ollama в OpenClaw по умолчанию использует **нативный API Ollama** (`/api/chat`), который полностью поддерживает потоковую передачу и вызов инструментов одновременно. Специальная конфигурация не требуется.

    Для нативных запросов `/api/chat` OpenClaw также напрямую передает Ollama управление thinking: `/think off` и `openclaw agent --thinking off` отправляют верхнеуровневое `think: false`, если не настроено явное значение модели `params.think`/`params.thinking`, а `/think low|medium|high` отправляют соответствующую верхнеуровневую строку усилия `think`. `/think max` сопоставляется с самым высоким нативным усилием Ollama, `think: "high"`.

    <Tip>
    Если вам нужно использовать OpenAI-совместимый endpoint, см. раздел «Устаревший OpenAI-совместимый режим» выше. В этом режиме потоковая передача и вызов инструментов могут не работать одновременно.
    </Tip>

  </Accordion>
</AccordionGroup>

## Устранение неполадок

<AccordionGroup>
  <Accordion title="Цикл сбоев WSL2 (повторные перезагрузки)">
    В WSL2 с NVIDIA/CUDA официальный установщик Ollama для Linux создает unit systemd `ollama.service` с `Restart=always`. Если эта служба запускается автоматически и загружает модель с поддержкой GPU во время загрузки WSL2, Ollama может закрепить память хоста на время загрузки модели. Возврат памяти Hyper-V не всегда может вернуть эти закрепленные страницы, поэтому Windows может завершить VM WSL2, systemd снова запускает Ollama, и цикл повторяется.

    Типичные признаки:

    - повторные перезагрузки или завершения WSL2 со стороны Windows
    - высокая CPU-нагрузка в `app.slice` или `ollama.service` вскоре после запуска WSL2
    - SIGTERM от systemd, а не событие Linux OOM-killer

    OpenClaw записывает предупреждение при запуске, когда обнаруживает WSL2, включенный `ollama.service` с `Restart=always` и видимые маркеры CUDA.

    Смягчение:

    ```bash
    sudo systemctl disable ollama
    ```

    Добавьте это в `%USERPROFILE%\.wslconfig` на стороне Windows, затем выполните `wsl --shutdown`:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    Установите более короткий keep-alive в окружении службы Ollama или запускайте Ollama вручную только тогда, когда он нужен:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    См. [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama не обнаружен">
    Убедитесь, что Ollama запущен, что вы задали `OLLAMA_API_KEY` (или профиль аутентификации) и что вы **не** определили явную запись `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    Проверьте, что API доступен:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Нет доступных моделей">
    Если вашей модели нет в списке, либо загрузите модель локально, либо явно определите ее в `models.providers.ollama`.

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="В соединении отказано">
    Проверьте, что Ollama запущен на правильном порту:

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="Удаленный хост работает с curl, но не с OpenClaw">
    Проверьте с той же машины и среды выполнения, где работает Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Типичные причины:

    - `baseUrl` указывает на `localhost`, но Gateway работает в Docker или на другом хосте.
    - URL использует `/v1`, что выбирает OpenAI-совместимое поведение вместо нативного Ollama.
    - Удаленному хосту нужны изменения firewall или привязки LAN на стороне Ollama.
    - Модель присутствует в daemon на вашем ноутбуке, но отсутствует в удаленном daemon.

  </Accordion>

  <Accordion title="Модель выводит JSON инструмента как текст">
    Обычно это означает, что поставщик использует OpenAI-совместимый режим или модель не может обрабатывать схемы инструментов.

    Предпочитайте нативный режим Ollama:

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

    Если небольшая локальная модель все еще не справляется со схемами инструментов, задайте `compat.supportsTools: false` для записи этой модели и протестируйте повторно.

  </Accordion>

  <Accordion title="Kimi или GLM возвращает искаженные символы">
    Размещенные ответы Kimi/GLM, представляющие собой длинные нелингвистические последовательности символов, обрабатываются как неудачный вывод поставщика, а не как успешный ответ ассистента. Это позволяет обычным повторным попыткам, fallback или обработке ошибок вступить в действие без сохранения поврежденного текста в сеанс.

    Если это повторяется, сохраните исходное имя модели, текущий файл сеанса и сведения о том, использовал ли запуск `Cloud + Local` или `Cloud only`, затем попробуйте новый сеанс и fallback модель:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Холодная локальная модель превышает тайм-аут">
    Большим локальным моделям может требоваться долгая первая загрузка перед началом потоковой передачи. Ограничьте тайм-аут поставщиком Ollama и при желании попросите Ollama держать модель загруженной между ходами:

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

    Если сам хост медленно принимает соединения, `timeoutSeconds` также расширяет защищенный тайм-аут подключения Undici для этого поставщика.

  </Accordion>

  <Accordion title="Модель с большим контекстом слишком медленная или исчерпывает память">
    Многие модели Ollama объявляют контексты, которые больше, чем ваше оборудование может комфортно выполнять. Нативный Ollama использует собственное значение контекста среды выполнения Ollama по умолчанию, если вы не задаете `params.num_ctx`. Ограничьте и бюджет OpenClaw, и контекст запроса Ollama, когда вам нужна предсказуемая задержка до первого токена:

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

    Сначала уменьшите `contextWindow`, если OpenClaw отправляет слишком большой prompt. Уменьшите `params.num_ctx`, если Ollama загружает контекст среды выполнения, слишком большой для машины. Уменьшите `maxTokens`, если генерация выполняется слишком долго.

  </Accordion>
</AccordionGroup>

<Note>
Дополнительная помощь: [Устранение неполадок](/ru/help/troubleshooting) и [FAQ](/ru/help/faq).
</Note>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Поставщики моделей" href="/ru/concepts/model-providers" icon="layers">
    Обзор всех поставщиков, ссылок на модели и поведения failover.
  </Card>
  <Card title="Выбор модели" href="/ru/concepts/models" icon="brain">
    Как выбирать и настраивать модели.
  </Card>
  <Card title="Веб-поиск Ollama" href="/ru/tools/ollama-search" icon="magnifying-glass">
    Полная настройка и подробности поведения для веб-поиска на базе Ollama.
  </Card>
  <Card title="Конфигурация" href="/ru/gateway/configuration" icon="gear">
    Полный справочник конфигурации.
  </Card>
</CardGroup>

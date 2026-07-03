---
read_when:
    - Вы хотите запускать OpenClaw с облачными или локальными моделями через Ollama
    - Вам нужны инструкции по установке и настройке Ollama
    - Вам нужны модели Ollama Vision для понимания изображений
summary: Запуск OpenClaw с Ollama (облачные и локальные модели)
title: Ollama
x-i18n:
    generated_at: "2026-07-03T09:52:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d91871ef96c3bdc027fe7cfceecae7e1d050913d859e3c6840725002fdf57af
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw интегрируется с нативным API Ollama (`/api/chat`) для размещенных облачных моделей и локальных/самостоятельно размещенных серверов Ollama. Вы можете использовать Ollama в трех режимах: `Cloud + Local` через доступный хост Ollama, `Cloud only` с `https://ollama.com` или `Local only` через доступный хост Ollama.

OpenClaw также регистрирует `ollama-cloud` как полноценный id размещенного провайдера для
прямого использования Ollama Cloud. Используйте ссылки вроде `ollama-cloud/kimi-k2.5:cloud`, когда
вам нужна маршрутизация только в облако без совместного использования id локального провайдера `ollama`.

Специальную страницу настройки только для облака см. в [Ollama Cloud](/ru/providers/ollama-cloud).

<Warning>
**Пользователи удаленного Ollama**: не используйте OpenAI-совместимый URL `/v1` (`http://host:11434/v1`) с OpenClaw. Это нарушает вызов инструментов, и модели могут выводить сырой JSON инструментов как обычный текст. Вместо этого используйте URL нативного API Ollama: `baseUrl: "http://host:11434"` (без `/v1`).
</Warning>

Конфигурация провайдера Ollama использует `baseUrl` как канонический ключ. OpenClaw также принимает `baseURL` для совместимости с примерами в стиле OpenAI SDK, но в новой конфигурации следует предпочитать `baseUrl`.

## Правила аутентификации

<AccordionGroup>
  <Accordion title="Local and LAN hosts">
    Локальным и LAN-хостам Ollama не нужен настоящий bearer-токен. OpenClaw использует локальный маркер `ollama-local` только для loopback, частных сетей, `.local` и базовых URL Ollama с простым именем хоста.
  </Accordion>
  <Accordion title="Remote and Ollama Cloud hosts">
    Удаленным публичным хостам и Ollama Cloud (`https://ollama.com`) требуются настоящие учетные данные через `OLLAMA_API_KEY`, профиль аутентификации или `apiKey` провайдера. Для прямого размещенного использования предпочитайте провайдер `ollama-cloud`.
  </Accordion>
  <Accordion title="Custom provider ids">
    Пользовательские id провайдеров, которые задают `api: "ollama"`, следуют тем же правилам. Например, провайдер `ollama-remote`, указывающий на хост Ollama в частной LAN, может использовать `apiKey: "ollama-local"`, и субагенты будут разрешать этот маркер через hook провайдера Ollama, а не считать его отсутствующими учетными данными. Поиск в памяти также может задать `agents.defaults.memorySearch.provider` равным этому пользовательскому id провайдера, чтобы embeddings использовали соответствующий endpoint Ollama.
  </Accordion>
  <Accordion title="Auth profiles">
    `auth-profiles.json` хранит учетные данные для id провайдера. Помещайте настройки endpoint (`baseUrl`, `api`, id моделей, заголовки, тайм-ауты) в `models.providers.<id>`. Старые плоские файлы профилей аутентификации, такие как `{ "ollama-windows": { "apiKey": "ollama-local" } }`, не являются runtime-форматом; выполните `openclaw doctor --fix`, чтобы переписать их в канонический профиль API-ключа `ollama-windows:default` с резервной копией. `baseUrl` в этом файле является шумом совместимости и должен быть перенесен в конфигурацию провайдера.
  </Accordion>
  <Accordion title="Memory embedding scope">
    Когда Ollama используется для embeddings памяти, bearer-аутентификация ограничивается хостом, где она была объявлена:

    - Ключ уровня провайдера отправляется только на хост Ollama этого провайдера.
    - `agents.*.memorySearch.remote.apiKey` отправляется только на его удаленный хост embeddings.
    - Чистое значение env `OLLAMA_API_KEY` трактуется как соглашение Ollama Cloud и по умолчанию не отправляется на локальные или самостоятельно размещенные хосты.

  </Accordion>
</AccordionGroup>

## Начало работы

Выберите предпочитаемый способ настройки и режим.

<Tabs>
  <Tab title="Onboarding (recommended)">
    **Лучше всего подходит для:** самого быстрого пути к рабочей облачной или локальной настройке Ollama.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        ```

        Выберите **Ollama** из списка провайдеров.
      </Step>
      <Step title="Choose your mode">
        - **Облако + локально** — локальный хост Ollama плюс облачные модели, маршрутизируемые через этот хост
        - **Только облако** — размещенные модели Ollama через `https://ollama.com`
        - **Только локально** — только локальные модели

      </Step>
      <Step title="Select a model">
        `Cloud only` запрашивает `OLLAMA_API_KEY` и предлагает размещенные облачные значения по умолчанию. `Cloud + Local` и `Local only` запрашивают базовый URL Ollama, обнаруживают доступные модели и автоматически скачивают выбранную локальную модель, если она еще недоступна. Когда Ollama сообщает об установленном теге `:latest`, например `gemma4:latest`, настройка показывает эту установленную модель один раз вместо показа и `gemma4`, и `gemma4:latest` или повторного скачивания простого alias. `Cloud + Local` также проверяет, выполнен ли вход на этом хосте Ollama для облачного доступа.
      </Step>
      <Step title="Verify the model is available">
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

  <Tab title="Manual setup">
    **Лучше всего подходит для:** полного контроля над облачной или локальной настройкой.

    <Steps>
      <Step title="Choose cloud or local">
        - **Облако + локально**: установите Ollama, войдите с помощью `ollama signin` и маршрутизируйте облачные запросы через этот хост
        - **Только облако**: используйте `https://ollama.com` с `OLLAMA_API_KEY`
        - **Только локально**: установите Ollama с [ollama.com/download](https://ollama.com/download)

      </Step>
      <Step title="Pull a local model (local only)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Enable Ollama for OpenClaw">
        Для `Cloud only` используйте свой настоящий `OLLAMA_API_KEY`. Для настроек, поддерживаемых хостом, подходит любое значение-заполнитель:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Inspect and set your model">
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
    `Cloud + Local` использует доступный хост Ollama как точку управления как локальными, так и облачными моделями. Это предпочитаемый гибридный поток Ollama.

    Используйте **Облако + локально** во время настройки. OpenClaw запрашивает базовый URL Ollama, обнаруживает локальные модели с этого хоста и проверяет, выполнен ли на хосте вход для облачного доступа с помощью `ollama signin`. Когда вход выполнен, OpenClaw также предлагает размещенные облачные значения по умолчанию, такие как `kimi-k2.5:cloud`, `minimax-m2.7:cloud` и `glm-5.1:cloud`.

    Если вход на хосте еще не выполнен, OpenClaw оставляет настройку только локальной, пока вы не выполните `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` работает с размещенным API Ollama по адресу `https://ollama.com`.

    Используйте **Только облако** во время настройки. OpenClaw запрашивает `OLLAMA_API_KEY`, задает `baseUrl: "https://ollama.com"` и заполняет список размещенных облачных моделей. Этот путь **не** требует локального сервера Ollama или `ollama signin`.

    Список облачных моделей, показываемый во время `openclaw onboard`, заполняется в реальном времени из `https://ollama.com/api/tags`, с ограничением в 500 записей, поэтому выбор отражает текущий размещенный каталог, а не статический начальный список. Если `ollama.com` недоступен или не возвращает моделей во время настройки, OpenClaw возвращается к прежним жестко заданным предложениям, чтобы onboarding все равно завершился.

    Вы также можете настроить полноценного облачного провайдера напрямую:

    ```bash
    openclaw onboard --auth-choice ollama-cloud
    openclaw models set ollama-cloud/kimi-k2.5:cloud
    ```

  </Tab>

  <Tab title="Local only">
    В режиме только локальной работы OpenClaw обнаруживает модели из настроенного экземпляра Ollama. Этот путь предназначен для локальных или самостоятельно размещенных серверов Ollama.

    Сейчас OpenClaw предлагает `gemma4` как локальное значение по умолчанию.

  </Tab>
</Tabs>

## Обнаружение моделей (неявный провайдер)

Когда вы задаете `OLLAMA_API_KEY` (или профиль аутентификации) и **не** определяете `models.providers.ollama` или другой пользовательский удаленный провайдер с `api: "ollama"`, OpenClaw обнаруживает модели из локального экземпляра Ollama по адресу `http://127.0.0.1:11434`.

| Поведение            | Подробности                                                                                                                                                           |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Запрос каталога      | Запрашивает `/api/tags`                                                                                                                                              |
| Определение возможностей | Использует best-effort-запросы `/api/show`, чтобы читать `contextWindow`, расширенные параметры Modelfile `num_ctx` и возможности, включая vision/tools             |
| Vision-модели        | Модели с возможностью `vision`, сообщенной `/api/show`, помечаются как поддерживающие изображения (`input: ["text", "image"]`), поэтому OpenClaw автоматически внедряет изображения в prompt |
| Определение reasoning | Использует возможности `/api/show`, когда они доступны, включая `thinking`; при отсутствии возможностей в Ollama возвращается к эвристике по имени модели (`r1`, `reasoning`, `think`) |
| Лимиты токенов       | Задает `maxTokens` равным лимиту max-token Ollama по умолчанию, используемому OpenClaw                                                                               |
| Стоимость            | Задает все стоимости равными `0`                                                                                                                                      |

Это устраняет необходимость вручную добавлять записи моделей, сохраняя каталог согласованным с локальным экземпляром Ollama. Вы можете использовать полную ссылку, например `ollama/<pulled-model>:latest`, в локальном `infer model run`; OpenClaw разрешает эту установленную модель из живого каталога Ollama без необходимости вручную писать запись в `models.json`.

Для хостов Ollama, где выполнен вход, некоторые модели `:cloud` могут быть доступны через `/api/chat`
и `/api/show` до того, как появятся в `/api/tags`. Когда вы явно выбираете
полную ссылку `ollama/<model>:cloud`, OpenClaw проверяет именно эту отсутствующую модель через
`/api/show` и добавляет ее в runtime-каталог только если Ollama подтверждает
метаданные модели. Опечатки по-прежнему завершаются ошибкой неизвестной модели, а не приводят к автоматическому созданию.

```bash
# See what models are available
ollama list
openclaw models list
```

Для узкого smoke-теста генерации текста, который избегает полной поверхности агентских инструментов,
используйте локальный `infer model run` с полной ссылкой на модель Ollama:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

Этот путь все равно использует настроенного провайдера OpenClaw, аутентификацию и нативный
транспорт Ollama, но не запускает ход чат-агента и не загружает контекст MCP/инструментов. Если
это успешно, а обычные ответы агента завершаются ошибкой, следующим шагом диагностируйте
емкость модели для агентского prompt/инструментов.

Для узкого smoke-теста vision-модели на том же легком пути добавьте один или несколько
файлов изображений в `infer model run`. Это отправляет prompt и изображение напрямую в
выбранную vision-модель Ollama без загрузки чат-инструментов, памяти или предшествующего
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

`model run --file` принимает файлы, определенные как `image/*`, включая распространенные входные файлы PNG,
JPEG и WebP. Неизображения отклоняются до вызова Ollama.
Для распознавания речи используйте вместо этого `openclaw infer audio transcribe`.

Когда вы переключаете разговор с помощью `/model ollama/<model>`, OpenClaw считает
это точным выбором пользователя. Если настроенный Ollama `baseUrl`
недоступен, следующий ответ завершается ошибкой провайдера, а не молча
отвечает через другую настроенную резервную модель.

Изолированные Cron-задания выполняют одну дополнительную локальную проверку безопасности перед запуском
хода агента. Если выбранная модель разрешается в локальный, частносетевой или `.local`
провайдер Ollama и `/api/tags` недоступен, OpenClaw записывает этот запуск Cron
как `skipped` с выбранным `ollama/<model>` в тексте ошибки. Предварительная проверка
endpoint кэшируется на 5 минут, поэтому несколько Cron-заданий, указывающих на один и тот же
остановленный демон Ollama, не запускают все сразу неуспешные запросы к модели.

Проверьте вживую локальный текстовый путь, путь нативного потока и embeddings на
локальной Ollama с помощью:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Для smoke-тестов API-ключа Ollama Cloud укажите live-тесту `https://ollama.com`
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

Облачный smoke-тест выполняет текст, нативный поток и веб-поиск. По умолчанию он пропускает embeddings для
`https://ollama.com`, потому что API-ключи Ollama Cloud могут не давать доступ к
`/api/embed`. Задайте `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`, когда вы явно хотите,
чтобы live-тест завершался ошибкой, если настроенный облачный ключ не может использовать endpoint embed.

Чтобы добавить новую модель, просто загрузите ее через Ollama:

```bash
ollama pull mistral
```

Новая модель будет автоматически обнаружена и станет доступна для использования.

<Note>
Если вы явно задаете `models.providers.ollama` или настраиваете пользовательский удаленный провайдер, например `models.providers.ollama-cloud` с `api: "ollama"`, автообнаружение пропускается, и вы должны определить модели вручную. Пользовательские loopback-провайдеры, такие как `http://127.0.0.2:11434`, все равно считаются локальными. См. раздел явной конфигурации ниже.
</Note>

## Node-локальный инференс

Агенты могут делегировать короткую задачу модели Ollama, установленной на сопряженном
настольном компьютере или серверном Node. Запрос и ответ проходят через существующее аутентифицированное
соединение Gateway/Node; запрос к модели выполняется на выбранном Node через
его стандартный loopback endpoint Ollama (`http://127.0.0.1:11434`).

<Steps>
  <Step title="Start Ollama on the node">
    Загрузите хотя бы одну чат-модель и оставьте Ollama запущенной:

    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```

  </Step>
  <Step title="Connect the node host">
    На той же машине, где работает Ollama, подключите Node-хост к Gateway:

    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    Одобрите новое устройство и его объявленные команды Node на хосте Gateway,
    затем проверьте Node:

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    Первое подключение и обновление, добавляющее команды Ollama, оба могут
    вызвать необходимость одобрения команд Node. Если Node подключается без объявления
    `ollama.models` и `ollama.chat`, снова проверьте `openclaw nodes pending`.

  </Step>
  <Step title="Ask an agent to use local inference">
    Встроенный Plugin Ollama предоставляет инструмент `node_inference`. Агенты сначала
    используют `action: "discover"`, затем `action: "run"` с возвращенными Node и
    моделью. Если подключен ровно один подходящий Node, `run` может не указывать Node.

    Например: «Найди модели Ollama на моих Node, затем используй самую быструю
    загруженную модель, чтобы резюмировать этот текст».

  </Step>
</Steps>

Обнаружение читает `/api/tags`, проверяет возможности через `/api/show` и использует `/api/ps`,
когда он доступен, чтобы сначала ранжировать уже загруженные модели. Оно возвращает только локальные
модели с поддержкой чата: строки Ollama Cloud и модели только для embeddings исключаются.
Каждый запуск просит Ollama отключить мышление модели и ограничивает вывод 512 токенами,
если вызов инструмента не запрашивает другое значение `maxTokens`. Некоторые модели, например
GPT-OSS, не поддерживают отключение мышления и все равно могут использовать reasoning-токены.

Чтобы оставить Ollama запущенной на Node, но не делать ее доступной агентам, задайте
следующее в конфигурации, используемой этим Node-хостом:

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Если Node использует команду переднего плана `openclaw node run` из настройки
выше, остановите этот процесс и снова выполните команду. Если используется установленная служба Node,
выполните `openclaw node restart`.

Node перестает объявлять `ollama.models` и `ollama.chat`; сама Ollama и
Ollama-провайдер Gateway остаются без изменений. Задайте значение `true` и
перезапустите Node, чтобы снова объявить локальный инференс. Измененная поверхность команд
может потребовать одобрения через `openclaw nodes pending` после повторного подключения.

Вы можете проверить те же команды Node без хода агента:

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

Node-локальный инференс намеренно не переиспользует удаленный или облачный
`models.providers.ollama.baseUrl`. Запустите Ollama на стандартном loopback endpoint
Node. Команды Node доступны по умолчанию на macOS, Linux и
Windows Node-хостах и остаются подчинены обычной политике сопряжения Node и команд.

## Зрение и описание изображений

Встроенный Plugin Ollama регистрирует Ollama как провайдера понимания медиа с поддержкой изображений. Это позволяет OpenClaw направлять явные запросы на описание изображений и настроенные значения по умолчанию для моделей изображений через локальные или размещенные vision-модели Ollama.

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

`--model` должен быть полной ссылкой `<provider/model>`. Когда он задан, `openclaw infer image describe` сначала пробует эту модель, а не пропускает описание из-за того, что модель поддерживает нативное зрение. Если вызов модели завершается ошибкой, OpenClaw может продолжить через настроенные `agents.defaults.imageModel.fallbacks`; ошибки подготовки файла или URL все равно завершаются до попыток fallback.

Используйте `infer image describe`, когда вам нужен поток провайдера понимания изображений OpenClaw, настроенный `agents.defaults.imageModel` и форма вывода описания изображения. Используйте `infer model run --file`, когда вам нужна сырая мультимодальная проверка модели с пользовательским запросом и одним или несколькими изображениями.

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

Предпочитайте полную ссылку `ollama/<model>`. Если та же модель указана в `models.providers.ollama.models` с `input: ["text", "image"]` и ни один другой настроенный провайдер изображений не предоставляет этот bare ID модели, OpenClaw также нормализует bare-ссылку `imageModel`, такую как `qwen2.5vl:7b`, в `ollama/qwen2.5vl:7b`. Если более одного настроенного провайдера изображений имеет тот же bare ID, явно используйте префикс провайдера.

Медленным локальным vision-моделям может требоваться более длинный тайм-аут понимания изображений, чем облачным моделям. Они также могут аварийно завершаться или останавливаться, когда Ollama пытается выделить полный объявленный vision-контекст на ограниченном оборудовании. Задайте тайм-аут возможности и ограничьте `num_ctx` в записи модели, когда вам нужен только обычный ход описания изображения:

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

Этот тайм-аут применяется к пониманию входящих изображений и к явному инструменту `image`, который агент может вызвать во время хода. `models.providers.ollama.timeoutSeconds` на уровне провайдера по-прежнему управляет базовой защитой HTTP-запроса Ollama для обычных вызовов модели.

Проверьте вживую явный инструмент изображений на локальной Ollama с помощью:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

Если вы определяете `models.providers.ollama.models` вручную, пометьте vision-модели поддержкой ввода изображений:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw отклоняет запросы описания изображений для моделей, которые не помечены как поддерживающие изображения. При неявном обнаружении OpenClaw считывает это из Ollama, когда `/api/show` сообщает о vision-возможности.

## Конфигурация

<Tabs>
  <Tab title="Basic (implicit discovery)">
    Самый простой путь включения только для локальной среды — через переменную окружения:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Если `OLLAMA_API_KEY` задан, вы можете опустить `apiKey` в записи провайдера, и OpenClaw заполнит его для проверок доступности.
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    Используйте явную конфигурацию, когда вам нужна настройка размещенного облака, Ollama работает на другом хосте/порту, вы хотите принудительно задать конкретные окна контекста или списки моделей либо хотите полностью ручные определения моделей.

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
    Если Ollama работает на другом хосте или порту (явная конфигурация отключает автообнаружение, поэтому определите модели вручную):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - use native Ollama API URL
            api: "ollama", // Set explicitly to guarantee native tool-calling behavior
            timeoutSeconds: 300, // Optional: give cold local models longer to connect and stream
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
    Не добавляйте `/v1` к URL. Путь `/v1` использует OpenAI-совместимый режим, в котором вызов инструментов ненадежен. Используйте базовый URL Ollama без суффикса пути.
    </Warning>

  </Tab>
</Tabs>

## Распространенные рецепты

Используйте эти примеры как отправные точки и заменяйте ID моделей точными именами из `ollama list` или `openclaw models list --provider ollama`.

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

    Этот путь оставляет конфигурацию минимальной. Не добавляйте блок `models.providers.ollama`, если не хотите задавать модели вручную.

  </Accordion>

  <Accordion title="LAN-хост Ollama с моделями вручную">
    Используйте нативные URL Ollama для хостов в LAN. Не добавляйте `/v1`.

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
    Используйте это, когда вы не запускаете локальный демон и хотите напрямую использовать размещенные модели Ollama.

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

  <Accordion title="Облако плюс локальные модели через демон с выполненным входом">
    Используйте это, когда локальный или LAN-демон Ollama вошел в учетную запись через `ollama signin` и должен обслуживать и локальные модели, и модели `:cloud`.

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
    Используйте пользовательские ID провайдеров, когда у вас больше одного сервера Ollama. Каждый провайдер получает собственный хост, модели, аутентификацию, тайм-аут и ссылки на модели.

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

    Когда OpenClaw отправляет запрос, активный префикс провайдера удаляется, поэтому `ollama-large/qwen3.5:27b` доходит до Ollama как `qwen3.5:27b`.

  </Accordion>

  <Accordion title="Облегченный профиль локальной модели">
    Некоторые локальные модели могут отвечать на простые промпты, но испытывают трудности с полной поверхностью инструментов агента. Начните с ограничения инструментов и контекста, прежде чем менять глобальные настройки runtime.

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

    Используйте `compat.supportsTools: false` только тогда, когда модель или сервер стабильно ломается на схемах инструментов. Это обменивает возможности агента на стабильность.
    `localModelLean` удаляет браузер, cron и инструменты сообщений с прямой поверхности агента и по умолчанию прячет более крупные каталоги за структурированными элементами управления поиском инструментов, кроме случаев, когда запуск должен сохранять семантику прямой доставки сообщений, но не меняет runtime-контекст Ollama или режим мышления. Сочетайте это с явными `params.num_ctx` и `params.thinking: false` для небольших моделей мышления в стиле Qwen, которые зацикливаются или тратят бюджет ответа на скрытое рассуждение.

  </Accordion>
</AccordionGroup>

### Выбор модели

После настройки все ваши модели Ollama доступны:

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

Пользовательские ID провайдеров Ollama также поддерживаются. Когда ссылка на модель использует активный
префикс провайдера, например `ollama-spark/qwen3:32b`, OpenClaw удаляет только этот
префикс перед вызовом Ollama, поэтому сервер получает `qwen3:32b`.

Для медленных локальных моделей предпочитайте настройку запросов на уровне провайдера, прежде чем увеличивать
тайм-аут всего runtime агента:

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
заголовки, потоковую передачу тела и общее защищенное прерывание fetch. `params.keep_alive`
передается в Ollama как верхнеуровневый `keep_alive` в нативных запросах `/api/chat`;
задавайте его для каждой модели, когда время загрузки первого хода становится узким местом.

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

## Ollama Web Search

OpenClaw поддерживает **Ollama Web Search** как встроенный провайдер `web_search`.

| Свойство    | Сведения                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Хост        | Использует настроенный вами хост Ollama (`models.providers.ollama.baseUrl`, если задан, иначе `http://127.0.0.1:11434`); `https://ollama.com` использует размещенный API напрямую |
| Аутентификация        | Без ключа для локальных хостов Ollama с выполненным входом; `OLLAMA_API_KEY` или настроенная аутентификация провайдера для прямого поиска через `https://ollama.com` или защищенных аутентификацией хостов               |
| Требование | Локальные/самостоятельно размещенные хосты должны быть запущены и должны выполнить вход через `ollama signin`; для прямого размещенного поиска требуется `baseUrl: "https://ollama.com"` плюс настоящий API-ключ Ollama |

Выберите **Ollama Web Search** во время `openclaw onboard` или `openclaw configure --section web` либо задайте:

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

Для локального демона с выполненным входом OpenClaw использует прокси демона `/api/experimental/web_search`. Для `https://ollama.com` он напрямую вызывает размещенный endpoint `/api/web_search`.

<Note>
Полные сведения о настройке и поведении см. в [Ollama Web Search](/ru/tools/ollama-search).
</Note>

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Устаревший режим, совместимый с OpenAI">
    <Warning>
    **Вызов инструментов ненадежен в режиме совместимости с OpenAI.** Используйте этот режим только если вам нужен формат OpenAI для прокси и вы не зависите от нативного поведения вызова инструментов.
    </Warning>

    Если вместо этого нужно использовать endpoint, совместимый с OpenAI (например, за прокси, который поддерживает только формат OpenAI), явно задайте `api: "openai-completions"`:

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

    Этот режим может не поддерживать потоковую передачу и вызов инструментов одновременно. Возможно, вам потребуется отключить потоковую передачу через `params: { streaming: false }` в конфигурации модели.

    Когда `api: "openai-completions"` используется с Ollama, OpenClaw по умолчанию внедряет `options.num_ctx`, чтобы Ollama не откатывался молча к контекстному окну 4096. Если ваш прокси или upstream отклоняет неизвестные поля `options`, отключите это поведение:

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
    Для автоматически обнаруженных моделей OpenClaw использует контекстное окно, сообщаемое Ollama, когда оно доступно, включая более крупные значения `PARAMETER num_ctx` из пользовательских Modelfile. В противном случае он откатывается к стандартному контекстному окну Ollama, используемому OpenClaw.

    Вы можете задать значения по умолчанию уровня провайдера `contextWindow`, `contextTokens` и `maxTokens` для каждой модели у этого провайдера Ollama, а затем при необходимости переопределять их для отдельных моделей. `contextWindow` — это бюджет OpenClaw для промпта и Compaction. Нативные запросы Ollama оставляют `options.num_ctx` незаданным, если вы явно не настроили `params.num_ctx`, чтобы Ollama мог применить собственную модель, `OLLAMA_CONTEXT_LENGTH` или значение по умолчанию на основе VRAM. Чтобы ограничить или принудительно задать runtime-контекст Ollama для отдельного запроса без пересборки Modelfile, задайте `params.num_ctx`; недопустимые, нулевые, отрицательные и не конечные значения игнорируются. Если вы обновили старую конфигурацию, которая использовала только `contextWindow` или `maxTokens` для принудительной установки контекста нативного запроса Ollama, запустите `openclaw doctor --fix`, чтобы скопировать эти явные бюджеты провайдера или модели в `params.num_ctx`. OpenAI-совместимый адаптер Ollama по-прежнему по умолчанию внедряет `options.num_ctx` из настроенного `params.num_ctx` или `contextWindow`; отключите это с помощью `injectNumCtxForOpenAICompat: false`, если ваш upstream отклоняет `options`.

    Записи нативных моделей Ollama также принимают общие runtime-параметры Ollama в `params`, включая `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` и `use_mmap`. OpenClaw передает только ключи запросов Ollama, поэтому runtime-параметры OpenClaw, такие как `streaming`, не передаются в Ollama. Используйте `params.think` или `params.thinking`, чтобы отправить верхнеуровневый `think` Ollama; `false` отключает мышление на уровне API для моделей с мышлением в стиле Qwen.

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

    Также работает `agents.defaults.models["ollama/<model>"].params.num_ctx` для отдельной модели. Если настроены оба варианта, явная запись модели провайдера имеет приоритет над значением по умолчанию агента.

  </Accordion>

  <Accordion title="Управление мышлением">
    Для нативных моделей Ollama OpenClaw передает управление мышлением так, как ожидает Ollama: верхнеуровневый `think`, а не `options.think`. Автоматически обнаруженные модели, чей ответ `/api/show` включает возможность `thinking`, предоставляют `/think low`, `/think medium`, `/think high` и `/think max`; модели без мышления предоставляют только `/think off`.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    Вы также можете задать значение по умолчанию для модели:

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

    `params.think` или `params.thinking` для отдельной модели может отключить или принудительно включить мышление Ollama API для конкретной настроенной модели. OpenClaw сохраняет эти явные параметры модели, когда у активного запуска есть только неявное значение по умолчанию `off`; runtime-команды не `off`, такие как `/think medium`, все равно переопределяют активный запуск.

  </Accordion>

  <Accordion title="Модели рассуждения">
    OpenClaw по умолчанию считает модели с такими именами, как `deepseek-r1`, `reasoning` или `think`, поддерживающими рассуждение.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Дополнительная настройка не нужна. OpenClaw помечает их автоматически.

  </Accordion>

  <Accordion title="Стоимость моделей">
    Ollama бесплатен и работает локально, поэтому стоимость всех моделей установлена в $0. Это относится как к автоматически обнаруженным, так и к вручную заданным моделям.
  </Accordion>

  <Accordion title="Эмбеддинги памяти">
    Встроенный Plugin Ollama регистрирует провайдера эмбеддингов памяти для
    [поиска по памяти](/ru/concepts/memory). Он использует настроенный базовый URL
    Ollama и API-ключ, вызывает текущий endpoint `/api/embed` Ollama и по возможности
    объединяет несколько фрагментов памяти в один запрос `input`.

    Когда `proxy.enabled=true`, запросы эмбеддингов памяти Ollama к точному
    host-local loopback-источнику, полученному из настроенного `baseUrl`, используют
    защищенный прямой путь OpenClaw вместо управляемого forward proxy. Настроенное
    имя хоста само должно быть `localhost` или IP-литералом loopback;
    DNS-имена, которые лишь разрешаются в loopback, все равно используют управляемый proxy path.
    LAN, tailnet, private-network и публичные хосты Ollama также остаются на
    управляемом proxy path. Перенаправления на другой хост или порт не наследуют доверие.
    Операторы по-прежнему могут задать глобальную настройку `proxy.loopbackMode: "proxy"`,
    чтобы отправлять loopback-трафик через proxy, или `proxy.loopbackMode: "block"`,
    чтобы запрещать loopback-подключения до открытия соединения; см.
    [Управляемый proxy](/ru/security/network-proxy#gateway-loopback-mode) для
    эффекта этой настройки на весь процесс.

    | Свойство      | Значение               |
    | ------------- | ------------------- |
    | Модель по умолчанию | `nomic-embed-text`  |
    | Автоматическая загрузка     | Да — модель эмбеддингов загружается автоматически, если ее нет локально |

    Эмбеддинги во время запроса используют префиксы извлечения для моделей, которым они нужны или рекомендованы, включая `nomic-embed-text`, `qwen3-embedding` и `mxbai-embed-large`. Пакеты документов памяти остаются без изменений, чтобы существующим индексам не требовалась миграция формата.

    Чтобы выбрать Ollama как провайдера эмбеддингов для поиска по памяти:

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

    Для удаленного хоста эмбеддингов ограничьте auth этим хостом:

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
    Интеграция Ollama в OpenClaw по умолчанию использует **нативный Ollama API** (`/api/chat`), который полностью поддерживает потоковую передачу и вызов инструментов одновременно. Специальная настройка не нужна.

    Для нативных запросов `/api/chat` OpenClaw также напрямую передает управление мышлением в Ollama: `/think off` и `openclaw agent --thinking off` отправляют верхнеуровневый `think: false`, если не настроено явное значение модели `params.think`/`params.thinking`, а `/think low|medium|high` отправляют соответствующую строку усилия верхнеуровневого `think`. `/think max` сопоставляется с максимальным нативным усилием Ollama, `think: "high"`.

    <Tip>
    Если вам нужно использовать OpenAI-совместимый endpoint, см. раздел «Устаревший OpenAI-совместимый режим» выше. В этом режиме потоковая передача и вызов инструментов могут не работать одновременно.
    </Tip>

  </Accordion>
</AccordionGroup>

## Устранение неполадок

<AccordionGroup>
  <Accordion title="Цикл сбоев WSL2 (повторные перезагрузки)">
    В WSL2 с NVIDIA/CUDA официальный Linux-установщик Ollama создает systemd unit `ollama.service` с `Restart=always`. Если этот сервис запускается автоматически и загружает модель с GPU во время загрузки WSL2, Ollama может закрепить память хоста на время загрузки модели. Hyper-V memory reclaim не всегда может освободить эти закрепленные страницы, поэтому Windows может завершить WSL2 VM, systemd снова запускает Ollama, и цикл повторяется.

    Типичные признаки:

    - повторные перезагрузки или завершения WSL2 со стороны Windows
    - высокая загрузка CPU в `app.slice` или `ollama.service` вскоре после запуска WSL2
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

    Задайте более короткий keep-alive в окружении сервиса Ollama или запускайте Ollama вручную только тогда, когда он нужен:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    См. [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317).

  </Accordion>

  <Accordion title="Ollama не обнаружен">
    Убедитесь, что Ollama запущен, что вы задали `OLLAMA_API_KEY` (или профиль auth), и что вы **не** определили явную запись `models.providers.ollama`:

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
    Проверьте с той же машины и runtime, на которых работает Gateway:

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    Типичные причины:

    - `baseUrl` указывает на `localhost`, но Gateway работает в Docker или на другом хосте.
    - URL использует `/v1`, что выбирает OpenAI-совместимое поведение вместо нативного Ollama.
    - Удаленному хосту нужны изменения firewall или LAN binding на стороне Ollama.
    - Модель присутствует в daemon на вашем ноутбуке, но не в удаленном daemon.

  </Accordion>

  <Accordion title="Модель выводит tool JSON как текст">
    Обычно это означает, что провайдер использует OpenAI-совместимый режим или модель не может обработать схемы инструментов.

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

    Если небольшая локальная модель все равно не справляется со схемами инструментов, задайте `compat.supportsTools: false` в записи этой модели и повторно протестируйте.

  </Accordion>

  <Accordion title="Kimi или GLM возвращает искаженные символы">
    Hosted-ответы Kimi/GLM, представляющие собой длинные нелингвистические последовательности символов, обрабатываются как неудачный вывод провайдера, а не как успешный ответ assistant. Это позволяет обычной логике повторной попытки, fallback или обработки ошибок вступить в действие без сохранения поврежденного текста в сессии.

    Если это повторяется, зафиксируйте raw-имя модели, текущий файл сессии и то, использовал ли запуск `Cloud + Local` или `Cloud only`, затем попробуйте новую сессию и fallback-модель:

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="Холодная локальная модель превышает время ожидания">
    Большим локальным моделям может потребоваться долгая первая загрузка до начала потоковой передачи. Ограничьте timeout провайдером Ollama и при желании попросите Ollama держать модель загруженной между ходами:

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

    Если сам хост медленно принимает подключения, `timeoutSeconds` также продлевает защищенный тайм-аут подключения Undici для этого поставщика.

  </Accordion>

  <Accordion title="Модель с большим контекстом работает слишком медленно или исчерпывает память">
    Многие модели Ollama объявляют контексты, которые больше, чем ваше оборудование может комфортно обработать. Нативный Ollama использует собственное значение контекста по умолчанию из среды выполнения Ollama, если вы не зададите `params.num_ctx`. Ограничьте и бюджет OpenClaw, и контекст запроса Ollama, если вам нужна предсказуемая задержка до первого токена:

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

    Сначала уменьшите `contextWindow`, если OpenClaw отправляет слишком большой prompt. Уменьшите `params.num_ctx`, если Ollama загружает контекст среды выполнения, слишком большой для этой машины. Уменьшите `maxTokens`, если генерация длится слишком долго.

  </Accordion>
</AccordionGroup>

<Note>
Дополнительная помощь: [Устранение неполадок](/ru/help/troubleshooting) и [FAQ](/ru/help/faq).
</Note>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Поставщики моделей" href="/ru/concepts/model-providers" icon="layers">
    Обзор всех поставщиков, ссылок на модели и поведения при отказе.
  </Card>
  <Card title="Выбор модели" href="/ru/concepts/models" icon="brain">
    Как выбирать и настраивать модели.
  </Card>
  <Card title="Веб-поиск Ollama" href="/ru/tools/ollama-search" icon="magnifying-glass">
    Полная настройка и сведения о поведении веб-поиска на базе Ollama.
  </Card>
  <Card title="Конфигурация" href="/ru/gateway/configuration" icon="gear">
    Полный справочник конфигурации.
  </Card>
</CardGroup>

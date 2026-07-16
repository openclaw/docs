---
read_when:
    - Вы хотите запускать OpenClaw с моделями с открытым исходным кодом через LM Studio
    - Вы хотите установить и настроить LM Studio
summary: Запуск OpenClaw с LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-07-16T16:49:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 21129dad2f1bf53fcf9474db2393fce7642b82f4f22e1770d9788547f08eca7f
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio запускает модели llama.cpp (GGUF) или MLX локально — как приложение с графическим интерфейсом или безголовый демон `llmster`.
Инструкции по установке и документацию продукта см. на [lmstudio.ai](https://lmstudio.ai/).

## Быстрый старт

<Steps>
  <Step title="Установите и запустите сервер">
    Установите LM Studio (настольное приложение) или `llmster` (безголовый режим), затем запустите сервер:

    ```bash
    lms server start --port 1234
    ```

    Или запустите безголовый демон:

    ```bash
    lms daemon up
    ```

    При использовании настольного приложения включите JIT для плавной загрузки моделей; см.
    [руководство LM Studio по JIT и TTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

  </Step>
  <Step title="Задайте ключ API, если включена аутентификация">
    ```bash
    export LM_API_TOKEN="your-lm-studio-api-token"
    ```

    Если аутентификация LM Studio отключена, оставьте ключ API пустым во время настройки. См.
    [Аутентификация LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

  </Step>
  <Step title="Запустите первоначальную настройку">
    ```bash
    openclaw onboard
    ```

    Выберите `LM Studio`, затем выберите модель в ответ на запрос `Default model`.

    При новой пошаговой настройке OpenClaw сначала запрашивает `/api/v1/models` на
    стандартном или настроенном хосте LM Studio. Существующая LLM предлагается через
    ту же последовательность настройки в CLI/macOS и проверяется реальной генерацией ответа до
    сохранения конфигурации. Автоматическая проверка никогда не загружает модель и
    игнорирует записи каталога, предназначенные только для эмбеддингов.

  </Step>
</Steps>

Чтобы впоследствии изменить модель по умолчанию:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Ключи моделей LM Studio используют формат `author/model-name` (например, `qwen/qwen3.5-9b`); в ссылках на модели OpenClaw
перед ними указывается провайдер: `lmstudio/qwen/qwen3.5-9b`. Чтобы найти точный ключ модели, выполните
приведённую ниже команду и найдите поле `key`:

```bash
curl http://localhost:1234/api/v1/models
```

## Неинтерактивная первоначальная настройка

```bash
openclaw onboard --non-interactive --accept-risk --auth-choice lmstudio
```

Или явно укажите базовый URL, модель и ключ API:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` принимает ключ модели, возвращённый LM Studio (например, `qwen/qwen3.5-9b`), без
префикса провайдера `lmstudio/`. Передайте `--lmstudio-api-key` (или задайте `LM_API_TOKEN`) для серверов
с аутентификацией; не указывайте его для серверов без аутентификации — вместо него OpenClaw сохранит локальный несекретный маркер.
`--custom-api-key` по-прежнему принимается для совместимости, но предпочтителен `--lmstudio-api-key`.

При этом записывается `models.providers.lmstudio`, а моделью по умолчанию становится `lmstudio/<custom-model-id>`.
Если указан ключ API, также записывается профиль аутентификации `lmstudio:default`.

При интерактивной настройке также может быть предложено указать предпочтительный размер контекста загрузки; это значение применяется ко
всем обнаруженным моделям, сохраняемым в конфигурацию.

## Конфигурация

### Совместимость потоковой передачи со статистикой использования

LM Studio не всегда включает объект `usage` в формате OpenAI в потоковые ответы. OpenClaw
вместо этого восстанавливает количество токенов из метаданных `timings.prompt_n` / `timings.predicted_n`
в стиле llama.cpp. Тот же резервный механизм применяется к любой OpenAI-совместимой конечной точке,
определённой как локальная (хост обратной петли), включая другие локальные бэкенды, такие как vLLM,
SGLang, llama.cpp, LocalAI, Jan, TabbyAPI и text-generation-webui.

### Совместимость режима рассуждений

Когда обнаружение через `/api/v1/models` в LM Studio сообщает параметры рассуждений для конкретной модели, OpenClaw
предоставляет соответствующие значения `reasoning_effort` (`none`, `minimal`, `low`, `medium`, `high`, `xhigh`) в
метаданных совместимости модели. Некоторые сборки LM Studio объявляют бинарный параметр интерфейса (`allowed_options: ["off",
"on"]`),
но отклоняют эти буквальные значения в `/v1/chat/completions`; OpenClaw нормализует
такой бинарный формат до шестиуровневой шкалы перед отправкой запросов, в том числе для ранее сохранённой конфигурации,
где всё ещё присутствуют карты рассуждений `off`/`on`.

### Явная конфигурация

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "qwen/qwen3-coder-next",
            name: "Qwen 3 Coder Next",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### Отключение предварительной загрузки

LM Studio поддерживает загрузку моделей по требованию (JIT), загружая их при первом запросе. По умолчанию OpenClaw
предварительно загружает модели через встроенную конечную точку загрузки LM Studio, что полезно, когда JIT
отключён. Чтобы вместо этого передать управление жизненным циклом моделей механизмам JIT, TTL простоя и автоматического вытеснения
LM Studio, отключите этап предварительной загрузки OpenClaw:

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        api: "openai-completions",
        params: { preload: false },
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

### Хост в локальной сети или tailnet

Используйте доступный адрес хоста LM Studio, сохраните `/v1` и убедитесь, что на этом компьютере
LM Studio принимает подключения не только через интерфейс обратной петли:

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://gpu-box.local:1234/v1",
        apiKey: "lmstudio",
        api: "openai-completions",
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

`lmstudio` автоматически считает настроенную конечную точку доверенной для запросов к моделям, включая хосты
обратной петли, локальной сети и tailnet (за исключением источников метаданных и link-local). Любая запись пользовательского или локального
OpenAI-совместимого провайдера получает такое же доверие к источнику при точном совпадении. Для запросов к другому частному хосту или порту
по-прежнему требуется `models.providers.<id>.request.allowPrivateNetwork: true`; задайте значение `false`, чтобы отказаться от
доверия по умолчанию.

## Устранение неполадок

### LM Studio не обнаружен

Убедитесь, что LM Studio запущен:

```bash
lms server start --port 1234
```

Если аутентификация включена, также задайте `LM_API_TOKEN`. Проверьте доступность API:

```bash
curl http://localhost:1234/api/v1/models
```

### Ошибки аутентификации (HTTP 401)

- Убедитесь, что `LM_API_TOKEN` соответствует ключу, настроенному в LM Studio.
- См. [Аутентификация LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Если сервер не требует аутентификации, оставьте ключ пустым во время настройки.

## Связанные материалы

- [Выбор модели](/ru/concepts/model-providers)
- [Ollama](/ru/providers/ollama)
- [Локальные модели](/ru/gateway/local-models)

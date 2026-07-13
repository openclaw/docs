---
read_when:
    - Вы хотите запустить OpenClaw с моделями с открытым исходным кодом через LM Studio
    - Вы хотите установить и настроить LM Studio
summary: Запуск OpenClaw с LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-07-13T20:12:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: b4223f90e786e285651fc889985dd61124c60758b4e9c3599d76201d9ac20b46
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio запускает модели llama.cpp (GGUF) или MLX локально — как приложение с графическим интерфейсом или автономный `llmster`
демон. Инструкции по установке и документацию продукта см. на [lmstudio.ai](https://lmstudio.ai/).

## Быстрый старт

<Steps>
  <Step title="Установите и запустите сервер">
    Установите LM Studio (настольное приложение) или `llmster` (без графического интерфейса), затем запустите сервер:

    ```bash
    lms server start --port 1234
    ```

    Или запустите автономный демон:

    ```bash
    lms daemon up
    ```

    Если вы используете настольное приложение, включите JIT для плавной загрузки моделей; см.
    [руководство LM Studio по JIT и TTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

  </Step>
  <Step title="Задайте ключ API, если включена аутентификация">
    ```bash
    export LM_API_TOKEN="your-lm-studio-api-token"
    ```

    Если аутентификация LM Studio отключена, при настройке оставьте ключ API пустым. См.
    [Аутентификация LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

  </Step>
  <Step title="Запустите первоначальную настройку">
    ```bash
    openclaw onboard
    ```

    Выберите `LM Studio`, затем выберите модель в запросе `Default model`.

  </Step>
</Steps>

Чтобы позднее изменить модель по умолчанию:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Ключи моделей LM Studio используют формат `author/model-name` (например, `qwen/qwen3.5-9b`); в ссылках на модели OpenClaw
перед ними указывается провайдер: `lmstudio/qwen/qwen3.5-9b`. Чтобы узнать точный ключ модели, выполните
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
с аутентификацией; для серверов без аутентификации не указывайте его, и OpenClaw вместо этого сохранит локальный несекретный маркер.
`--custom-api-key` по-прежнему поддерживается для совместимости, но предпочтительно использовать `--lmstudio-api-key`.

При этом записывается `models.providers.lmstudio`, а моделью по умолчанию становится `lmstudio/<custom-model-id>`.
Если указан ключ API, также записывается профиль аутентификации `lmstudio:default`.

При интерактивной настройке также может быть предложено выбрать предпочтительный размер контекста загрузки, который применяется ко
всем обнаруженным моделям, сохраняемым в конфигурации.

## Конфигурация

### Совместимость потоковой статистики использования

LM Studio не всегда включает объект `usage` в формате OpenAI в потоковые ответы. OpenClaw
вместо этого восстанавливает количество токенов из метаданных `timings.prompt_n` / `timings.predicted_n`
в формате llama.cpp. Та же резервная обработка применяется к любой OpenAI-совместимой конечной точке, определённой как локальная
(узел обратной петли), и охватывает другие локальные серверные системы, включая vLLM, SGLang, llama.cpp, LocalAI, Jan, TabbyAPI
и text-generation-webui.

### Совместимость режима рассуждений

Когда при обнаружении через `/api/v1/models` LM Studio сообщает параметры рассуждений для конкретной модели, OpenClaw
предоставляет соответствующие значения `reasoning_effort` (`none`, `minimal`, `low`, `medium`, `high`, `xhigh`) в
метаданных совместимости модели. Некоторые сборки LM Studio показывают в интерфейсе двоичный параметр (`allowed_options: ["off",
"on"]`), но отклоняют эти буквальные значения в `/v1/chat/completions`; перед отправкой запросов OpenClaw нормализует
этот двоичный формат до шестиступенчатой шкалы, в том числе для ранее сохранённой конфигурации, в которой
по-прежнему используются карты рассуждений `off`/`on`.

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

LM Studio поддерживает загрузку моделей по требованию (JIT), то есть загружает их при первом запросе. По умолчанию OpenClaw
предварительно загружает модели через встроенную конечную точку загрузки LM Studio, что полезно, когда JIT
отключён. Чтобы жизненным циклом моделей вместо этого управляли механизмы JIT, TTL простоя и автоматического вытеснения LM Studio,
отключите этап предварительной загрузки OpenClaw:

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

### Узел в локальной сети или tailnet

Используйте доступный адрес узла LM Studio, сохраните `/v1` и убедитесь, что LM Studio на этом компьютере
принимает подключения не только через интерфейс обратной петли:

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

`lmstudio` автоматически считает настроенную конечную точку доверенной для запросов к моделям, включая узлы
обратной петли, локальной сети и tailnet (кроме источников метаданных и link-local). Для любой пользовательской или локальной
записи OpenAI-совместимого провайдера применяется такое же доверие к точно совпадающему источнику. Для запросов к другому частному узлу или порту по-прежнему
требуется `models.providers.<id>.request.allowPrivateNetwork: true`; задайте значение `false`, чтобы отказаться от
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

- Убедитесь, что `LM_API_TOKEN` совпадает с ключом, настроенным в LM Studio.
- См. [Аутентификация LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Если сервер не требует аутентификации, при настройке оставьте ключ пустым.

## Связанные материалы

- [Выбор модели](/ru/concepts/model-providers)
- [Ollama](/ru/providers/ollama)
- [Локальные модели](/ru/gateway/local-models)

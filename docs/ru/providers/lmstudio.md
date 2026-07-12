---
read_when:
    - Вы хотите запустить OpenClaw с моделями с открытым исходным кодом через LM Studio
    - Вы хотите установить и настроить LM Studio
summary: Запуск OpenClaw с LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-07-12T11:47:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b4223f90e786e285651fc889985dd61124c60758b4e9c3599d76201d9ac20b46
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio запускает модели llama.cpp (GGUF) или MLX локально — как приложение с графическим интерфейсом или как фоновый демон `llmster`. Инструкции по установке и документацию продукта см. на сайте [lmstudio.ai](https://lmstudio.ai/).

## Быстрый старт

<Steps>
  <Step title="Установите и запустите сервер">
    Установите LM Studio (с графическим интерфейсом) или `llmster` (без графического интерфейса), затем запустите сервер:

    ```bash
    lms server start --port 1234
    ```

    Или запустите фоновый демон:

    ```bash
    lms daemon up
    ```

    Если вы используете приложение с графическим интерфейсом, включите JIT для плавной загрузки моделей; см.
    [руководство LM Studio по JIT и TTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

  </Step>
  <Step title="Задайте ключ API, если включена аутентификация">
    ```bash
    export LM_API_TOKEN="your-lm-studio-api-token"
    ```

    Если аутентификация LM Studio отключена, при настройке оставьте ключ API пустым. См.
    [документацию по аутентификации LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

  </Step>
  <Step title="Запустите первоначальную настройку">
    ```bash
    openclaw onboard
    ```

    Выберите `LM Studio`, затем выберите модель в приглашении `Default model`.

  </Step>
</Steps>

Чтобы позже изменить модель по умолчанию, выполните:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Ключи моделей LM Studio имеют формат `author/model-name` (например, `qwen/qwen3.5-9b`); в ссылках на модели OpenClaw
перед ними указывается поставщик: `lmstudio/qwen/qwen3.5-9b`. Чтобы узнать точный ключ модели, выполните
приведённую ниже команду и найдите поле `key`:

```bash
curl http://localhost:1234/api/v1/models
```

## Неинтерактивная первоначальная настройка

```bash
openclaw onboard --non-interactive --accept-risk --auth-choice lmstudio
```

Также можно явно указать базовый URL-адрес, модель и ключ API:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

Параметр `--custom-model-id` принимает ключ модели, возвращаемый LM Studio (например, `qwen/qwen3.5-9b`), без
префикса поставщика `lmstudio/`. Передайте `--lmstudio-api-key` (или задайте `LM_API_TOKEN`) для серверов
с аутентификацией; для серверов без аутентификации не указывайте его — вместо этого OpenClaw сохранит локальный
несекретный маркер. Параметр `--custom-api-key` по-прежнему поддерживается для совместимости, но предпочтительно
использовать `--lmstudio-api-key`.

При этом записывается `models.providers.lmstudio`, а моделью по умолчанию становится `lmstudio/<custom-model-id>`.
При указании ключа API также записывается профиль аутентификации `lmstudio:default`.

При интерактивной настройке дополнительно может быть предложено выбрать предпочтительную длину контекста загрузки;
она применяется ко всем обнаруженным моделям, сохраняемым в конфигурации.

## Конфигурация

### Совместимость потоковой статистики использования

LM Studio не всегда возвращает объект `usage` в формате OpenAI в потоковых ответах. OpenClaw
вместо этого восстанавливает количество токенов из метаданных `timings.prompt_n` / `timings.predicted_n`
в стиле llama.cpp. Та же резервная обработка применяется к любой OpenAI-совместимой конечной точке,
определённой как локальная (узел local loopback); это также охватывает другие локальные серверные системы,
такие как vLLM, SGLang, llama.cpp, LocalAI, Jan, TabbyAPI и text-generation-webui.

### Совместимость режима рассуждений

Когда механизм обнаружения LM Studio через `/api/v1/models` сообщает о параметрах рассуждений для конкретной модели,
OpenClaw публикует соответствующие значения `reasoning_effort` (`none`, `minimal`, `low`, `medium`, `high`, `xhigh`)
в метаданных совместимости модели. Некоторые сборки LM Studio показывают двоичный параметр интерфейса
(`allowed_options: ["off", "on"]`), но отклоняют эти буквальные значения в `/v1/chat/completions`; перед отправкой
запросов OpenClaw преобразует этот двоичный формат в шестиуровневую шкалу, в том числе для старых сохранённых
конфигураций, в которых карты рассуждений всё ещё содержат `off`/`on`.

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
отключён. Чтобы управление жизненным циклом моделей выполнялось средствами JIT, TTL простоя и автоматического
вытеснения LM Studio, отключите этап предварительной загрузки OpenClaw:

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
принимает подключения не только через local loopback:

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
local loopback, локальной сети и tailnet (кроме источников метаданных и локальных адресов канала). Любая запись
пользовательского или локального OpenAI-совместимого поставщика получает такое же доверие к источнику с точным
совпадением. Для запросов к другому частному узлу или порту по-прежнему требуется
`models.providers.<id>.request.allowPrivateNetwork: true`; задайте значение `false`, чтобы отказаться от
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
- См. [документацию по аутентификации LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Если сервер не требует аутентификации, оставьте ключ пустым при настройке.

## Связанные материалы

- [Выбор модели](/ru/concepts/model-providers)
- [Ollama](/ru/providers/ollama)
- [Локальные модели](/ru/gateway/local-models)

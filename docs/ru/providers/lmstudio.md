---
read_when:
    - Вы хотите запускать OpenClaw с моделями с открытым исходным кодом через LM Studio
    - Вы хотите установить и настроить LM Studio
summary: Запуск OpenClaw с LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-06-28T23:37:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 20dff6e3156edf0e840c5450999bc511ba168b23692494c9030bfb946936ae40
    source_path: providers/lmstudio.md
    workflow: 16
---

LM Studio — удобное и при этом мощное приложение для запуска моделей с открытыми весами на собственном оборудовании. Оно позволяет запускать модели llama.cpp (GGUF) или MLX (Apple Silicon). Поставляется в виде GUI-пакета или daemon без графического интерфейса (`llmster`). Документацию по продукту и настройке см. на [lmstudio.ai](https://lmstudio.ai/).

## Быстрый старт

1. Установите LM Studio (настольное приложение) или `llmster` (без графического интерфейса), затем запустите локальный сервер:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Запустите сервер

Убедитесь, что вы либо запустили настольное приложение, либо запустили daemon следующей командой:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Если вы используете приложение, убедитесь, что JIT включен для плавной работы. Подробнее см. в [руководстве LM Studio по JIT и TTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. Если аутентификация LM Studio включена, задайте `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Если аутентификация LM Studio отключена, при интерактивной настройке OpenClaw можно оставить API-ключ пустым.

Подробности настройки аутентификации LM Studio см. в разделе [Аутентификация LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

4. Запустите onboarding и выберите `LM Studio`:

```bash
openclaw onboard
```

5. В onboarding используйте запрос `Default model`, чтобы выбрать модель LM Studio.

Вы также можете задать или изменить ее позже:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Ключи моделей LM Studio используют формат `author/model-name` (например, `qwen/qwen3.5-9b`). Ссылки на модели OpenClaw
добавляют имя провайдера в начало: `lmstudio/qwen/qwen3.5-9b`. Точный ключ
модели можно найти, выполнив `curl http://localhost:1234/api/v1/models` и посмотрев поле `key`.

## Неинтерактивный onboarding

Используйте неинтерактивный onboarding, когда нужно автоматизировать настройку скриптом (CI, provisioning, удаленная начальная загрузка):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Или укажите базовый URL, модель и необязательный API-ключ:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` принимает ключ модели, возвращаемый LM Studio (например, `qwen/qwen3.5-9b`), без
префикса провайдера `lmstudio/`.

Для серверов LM Studio с аутентификацией передайте `--lmstudio-api-key` или задайте `LM_API_TOKEN`.
Для серверов LM Studio без аутентификации не указывайте ключ; OpenClaw сохранит локальный несекретный маркер.

`--custom-api-key` по-прежнему поддерживается для совместимости, но для LM Studio предпочтительно использовать `--lmstudio-api-key`.

Это записывает `models.providers.lmstudio` и задает модель по умолчанию как
`lmstudio/<custom-model-id>`. Если вы указываете API-ключ, настройка также записывает
профиль аутентификации `lmstudio:default`.

Интерактивная настройка может запросить необязательную предпочитаемую длину контекста загрузки и применяет ее ко всем обнаруженным моделям LM Studio, которые сохраняет в конфигурацию.
Конфигурация Plugin LM Studio доверяет настроенной конечной точке LM Studio для запросов моделей, включая loopback, LAN и узлы tailnet. Источники metadata/link-local по-прежнему требуют явного согласия. Можно отказаться, задав `models.providers.lmstudio.request.allowPrivateNetwork: false`.

## Конфигурация

### Совместимость с потоковой статистикой использования

LM Studio совместим с потоковой статистикой использования. Когда он не выдает объект
`usage` в форме OpenAI, OpenClaw вместо этого восстанавливает счетчики токенов из метаданных
`timings.prompt_n` / `timings.predicted_n` в стиле llama.cpp.

То же поведение потоковой статистики использования применяется к этим локальным бэкендам, совместимым с OpenAI:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Совместимость с thinking

Когда discovery LM Studio `/api/v1/models` сообщает параметры reasoning,
зависящие от модели, OpenClaw публикует соответствующие OpenAI-совместимые значения
`reasoning_effort` в метаданных совместимости модели. Текущие сборки LM Studio могут объявлять бинарные
параметры UI, такие как `allowed_options: ["off", "on"]`, но отклонять эти значения
на `/v1/chat/completions`; OpenClaw нормализует такую бинарную форму discovery в
`none`, `minimal`, `low`, `medium`, `high` и `xhigh` перед отправкой запросов.
Старая сохраненная конфигурация LM Studio, содержащая карты reasoning `off`/`on`, нормализуется
таким же образом при загрузке каталога.

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

## Устранение неполадок

### LM Studio не обнаружен

Убедитесь, что LM Studio запущен. Если аутентификация включена, также задайте `LM_API_TOKEN`:

```bash
# Запуск через настольное приложение или без графического интерфейса:
lms server start --port 1234
```

Проверьте, что API доступен:

```bash
curl http://localhost:1234/api/v1/models
```

### Ошибки аутентификации (HTTP 401)

Если настройка сообщает HTTP 401, проверьте API-ключ:

- Убедитесь, что `LM_API_TOKEN` совпадает с ключом, настроенным в LM Studio.
- Подробности настройки аутентификации LM Studio см. в разделе [Аутентификация LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Если вашему серверу не требуется аутентификация, оставьте ключ пустым при настройке.

### Загрузка моделей just-in-time

LM Studio поддерживает загрузку моделей just-in-time (JIT), при которой модели загружаются при первом запросе. OpenClaw по умолчанию предварительно загружает модели через собственную конечную точку загрузки LM Studio, что помогает, когда JIT отключен. Чтобы жизненным циклом модели управляли JIT, idle TTL и auto-evict в LM Studio, отключите шаг предварительной загрузки OpenClaw:

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

### Узел LM Studio в LAN или tailnet

Используйте доступный адрес узла LM Studio, сохраните `/v1` и убедитесь, что LM Studio привязан не только к loopback на этой машине:

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

`lmstudio` автоматически доверяет своей настроенной локальной/частной конечной точке для защищенных запросов моделей. Пользовательские/локальные записи OpenAI-совместимых провайдеров также доверяют точному настроенному источнику `baseUrl`, кроме источников metadata/link-local; запросы к другим частным портам или назначениям по-прежнему требуют `models.providers.<id>.request.allowPrivateNetwork: true`. Задайте `models.providers.<id>.request.allowPrivateNetwork: false`, чтобы отказаться от доверия точному источнику.

## Связанные материалы

- [Выбор модели](/ru/concepts/model-providers)
- [Ollama](/ru/providers/ollama)
- [Локальные модели](/ru/gateway/local-models)

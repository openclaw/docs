---
read_when:
    - Вы хотите использовать размещённые в облаке модели Ollama без локального сервера Ollama
    - Вам нужен идентификатор, ключ или конечная точка провайдера ollama-cloud
summary: Используйте Ollama Cloud напрямую с OpenClaw
title: Ollama Cloud
x-i18n:
    generated_at: "2026-07-12T11:48:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 966e5237e37134cef109979079db390e9844714001e921e7976dc8ca7f58bcc4
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud — это размещённый API моделей Ollama. Провайдер `ollama-cloud` обращается к нему
напрямую по адресу `https://ollama.com` через нативный API Ollama `/api/chat`, без
локального сервера Ollama и локального приложения Ollama, авторизованного в облачном режиме. Используйте ссылки
на модели вида `ollama-cloud/kimi-k2.6`.

OpenClaw регистрирует `ollama-cloud` с отдельным идентификатором провайдера, чтобы предназначенные только для облака
учётные данные, динамическое обнаружение каталога и выбор моделей не смешивались
с локальным хостом `ollama`. Сведения о локальном Ollama, гибридной маршрутизации между облаком и локальной средой,
эмбеддингах и настройках пользовательского хоста см. в разделе [Ollama](/ru/providers/ollama).

## Настройка

Создайте API-ключ Ollama Cloud на странице [ollama.com/settings/keys](https://ollama.com/settings/keys), затем выполните:

```bash
openclaw onboard --auth-choice ollama-cloud
```

Или задайте:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

При неинтерактивной первоначальной настройке ключ можно передать напрямую:

```bash
openclaw onboard --auth-choice ollama-cloud --ollama-cloud-api-key "<key>"
```

При первоначальной настройке моделью по умолчанию становится `ollama-cloud/kimi-k2.5:cloud`.

## Значения по умолчанию

- Провайдер: `ollama-cloud`
- Базовый URL: `https://ollama.com`
- Переменная окружения: `OLLAMA_API_KEY`
- Стиль API: нативный `/api/chat` Ollama
- Модель по умолчанию при первоначальной настройке: `ollama-cloud/kimi-k2.5:cloud`

## Когда следует выбирать Ollama Cloud

- Вам нужны размещённые модели Ollama без локального запуска `ollama serve`.
- Вам нужен тот же формат нативного API чата Ollama, который OpenClaw использует для локального
  Ollama, но с обращением к `https://ollama.com`.
- Вам нужен простой облачный способ доступа к моделям, уже представленным в размещённом
  каталоге Ollama.
- Вам не требуются локальная загрузка моделей, локальное управление GPU или выполнение вывода только в локальной сети.

Вместо этого используйте [Ollama](/ru/providers/ollama), если вам нужна только локальная
маршрутизация или маршрутизация между облаком и локальной средой через авторизованный хост Ollama. Используйте
OpenAI-совместимый провайдер, если вам нужна семантика `/v1/chat/completions`
или специфичные для провайдера возможности в стиле OpenAI.

## Модели

Провайдеру требуется API-ключ; без него он остаётся неактивным. При наличии ключа
OpenClaw динамически обнаруживает модели Ollama Cloud в размещённом каталоге:

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

Идентификаторы размещённых моделей в динамическом каталоге включают `deepseek-v4-flash`, `glm-5`,
`gpt-oss:20b`, `kimi-k2.6` и `minimax-m2.7`. Если динамическое обнаружение
не возвращает результатов, OpenClaw использует встроенные записи `kimi-k2.5:cloud`,
`minimax-m2.7:cloud`, `glm-5.1:cloud` и `glm-5.2:cloud`.

Идентификаторы моделей — это идентификаторы облачного каталога, а не имена для локальной загрузки. Если имя модели работает
на локальном хосте Ollama, но отсутствует в размещённом каталоге, вместо этого используйте провайдер `ollama`
с этим локальным хостом.

## Проверка в реальной среде

Для быстрой проверки Ollama Cloud с API-ключом укажите в проверке Ollama размещённую
конечную точку и выберите модель из текущего каталога:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Облачная быстрая проверка охватывает текст, нативную потоковую передачу и веб-поиск; задайте
`OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0`, чтобы пропустить веб-поиск. По умолчанию для
`https://ollama.com` проверка эмбеддингов пропускается, поскольку API-ключи Ollama Cloud могут не
разрешать доступ к `/api/embed`; для принудительного запуска задайте `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`.

## Устранение неполадок

- Ошибки `Ollama Cloud requires an API key` / `Set OLLAMA_API_KEY`: укажите
  настоящий облачный API-ключ. Маркер `ollama-local` предназначен только для локальных или
  частных хостов Ollama.
- Ошибки неизвестной модели: выполните `openclaw models list --provider ollama-cloud` и
  в точности скопируйте идентификатор размещённой модели.
- Проблемы с вызовом инструментов или необработанным JSON на пользовательских хостах Ollama: проверьте, не
  используете ли вы случайно OpenAI-совместимый URL `/v1`. Маршруты Ollama должны использовать
  нативный базовый URL без суффикса `/v1`.

## Связанные разделы

- [Ollama](/ru/providers/ollama)
- [Провайдеры моделей](/ru/concepts/model-providers)
- [Все провайдеры](/ru/providers/index)

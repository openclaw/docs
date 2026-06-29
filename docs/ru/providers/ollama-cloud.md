---
read_when:
    - Вы хотите использовать размещенные модели Ollama без локального сервера Ollama
    - Вам нужен идентификатор, ключ или конечная точка провайдера ollama-cloud
summary: Используйте Ollama Cloud напрямую с OpenClaw
title: Ollama Cloud
x-i18n:
    generated_at: "2026-06-28T23:38:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24b937085de1ed805b7bb0fe76a4197030bd45cd989ede8030386f3c721b9763
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud — размещенный API моделей Ollama. Он позволяет OpenClaw напрямую вызывать модели, размещенные в Ollama, без установки локального сервера Ollama или входа локального приложения Ollama в облачный режим. Используйте id провайдера `ollama-cloud` и ссылки на модели вроде `ollama-cloud/kimi-k2.6`.

Эта страница предназначена для прямой маршрутизации только через облако. Провайдер использует нативный стиль Ollama `/api/chat`, а не OpenAI-совместимый маршрут `/v1`. OpenClaw регистрирует его как отдельный id провайдера, чтобы облачные учетные данные, обнаружение живого каталога и выбор моделей не смешивались с локальным хостом `ollama`.

Используйте эту страницу, когда вам нужна маршрутизация только через облако. Для локального Ollama, гибридной маршрутизации облако-плюс-локально, embeddings и сведений о пользовательском хосте см. [Ollama](/ru/providers/ollama).

## Настройка

Создайте API-ключ Ollama Cloud на [ollama.com/settings/keys](https://ollama.com/settings/keys), затем выполните:

```bash
openclaw onboard --auth-choice ollama-cloud
```

Или задайте:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

## Значения по умолчанию

- Провайдер: `ollama-cloud`
- Базовый URL: `https://ollama.com`
- Переменная окружения: `OLLAMA_API_KEY`
- Стиль API: нативный Ollama `/api/chat`
- Пример модели: `ollama-cloud/kimi-k2.6`

## Когда выбирать Ollama Cloud

- Вам нужны размещенные модели Ollama без локального запуска `ollama serve`.
- Вам нужна та же форма нативного chat API Ollama, которую OpenClaw использует для локального Ollama, но направленная на `https://ollama.com`.
- Вам нужен простой облачный путь для моделей, которые уже есть в размещенном каталоге Ollama.
- Вам не нужны локальные загрузки моделей, локальное управление GPU или inference только по LAN.

Используйте [Ollama](/ru/providers/ollama), если вам нужна маршрутизация только локально или облако-плюс-локально через хост Ollama с выполненным входом. Используйте OpenAI-совместимого провайдера, если вам нужны семантика `/v1/chat/completions` или специфичные для провайдера функции в стиле OpenAI.

## Модели

OpenClaw обнаруживает модели Ollama Cloud из живого размещенного каталога. Обычно доступные размещенные id включают:

- `ollama-cloud/gpt-oss:20b`
- `ollama-cloud/kimi-k2.6`
- `ollama-cloud/deepseek-v4-flash`
- `ollama-cloud/minimax-m2.7`
- `ollama-cloud/glm-5`

Используйте id модели из вашего текущего размещенного каталога:

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

Id моделей — это id облачного каталога, а не имена локальных загрузок. Если имя модели работает на локальном хосте Ollama, но отсутствует в размещенном каталоге, используйте вместо этого провайдера `ollama` с этим локальным хостом.

## Live-тест

Для smoke-тестов API-ключа Ollama Cloud укажите live-тесту Ollama размещенный endpoint и выберите модель из вашего текущего каталога:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Облачный smoke-тест выполняет текст, нативный поток и web search. По умолчанию он пропускает embeddings для `https://ollama.com`, потому что API-ключи Ollama Cloud могут не авторизовать `/api/embed`.

## Устранение неполадок

- Ошибки `Set OLLAMA_API_KEY`: укажите настоящий облачный API-ключ. Локальный маркер `ollama-local` предназначен только для локальных или частных хостов Ollama.
- Ошибки неизвестной модели: выполните `openclaw models list --provider ollama-cloud` и точно скопируйте id размещенной модели.
- Проблемы с tool-call или необработанным JSON на пользовательских хостах Ollama: проверьте, не используете ли вы случайно OpenAI-совместимый URL `/v1`. Маршруты Ollama должны использовать нативный базовый URL без суффикса `/v1`.

## Связанные материалы

- [Ollama](/ru/providers/ollama)
- [Провайдеры моделей](/ru/concepts/model-providers)
- [Все провайдеры](/ru/providers/index)

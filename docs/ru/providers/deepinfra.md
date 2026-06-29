---
read_when:
    - Вам нужен единый API-ключ для лучших LLM с открытым исходным кодом
    - Вы хотите запускать модели через API DeepInfra в OpenClaw
summary: Используйте унифицированный API DeepInfra для доступа к самым популярным open source и передовым моделям в OpenClaw
title: DeepInfra
x-i18n:
    generated_at: "2026-06-28T23:35:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 059a556c24d2de2c8c5290b54c78fbc7451dc534238bfc4c725dcfbbd9a2d17f
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra предоставляет **унифицированный API**, который направляет запросы к самым популярным open source и frontier-моделям через одну
конечную точку и ключ API. Он совместим с OpenAI, поэтому большинство SDK OpenAI работают после смены базового URL.

## Установка Plugin

Установите официальный Plugin, затем перезапустите Gateway:

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## Получение ключа API

1. Перейдите на [https://deepinfra.com/](https://deepinfra.com/)
2. Войдите или создайте учетную запись
3. Перейдите в Панель управления / Ключи и создайте новый ключ API или используйте автоматически созданный

## Настройка CLI

```bash
openclaw onboard --deepinfra-api-key <key>
```

Или задайте переменную окружения:

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## Фрагмент конфигурации

```json5
{
  env: { DEEPINFRA_API_KEY: "<your-deepinfra-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V4-Flash" },
    },
  },
}
```

## Поддерживаемые поверхности OpenClaw

Plugin регистрирует все поверхности DeepInfra, которые соответствуют текущим
контрактам провайдера OpenClaw. Чат, генерация изображений и генерация видео
обновляют свои каталоги моделей в реальном времени из `/v1/openai/models?sort_by=openclaw&filter=with_meta`,
когда настроен `DEEPINFRA_API_KEY`; остальные поверхности используют отобранные
статические значения по умолчанию ниже.

| Поверхность              | Модель по умолчанию                                                                                   | Конфигурация/инструмент OpenClaw                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Чат / провайдер моделей  | первая запись с тегом чата из живого каталога (резерв из манифеста `deepseek-ai/DeepSeek-V4-Flash`)   | `agents.defaults.model`                                  |
| Генерация/редактирование изображений | первая запись с тегом `image-gen` из живого каталога (статический резерв `black-forest-labs/FLUX-1-schnell`) | `image_generate`, `agents.defaults.imageGenerationModel` |
| Понимание медиа          | `moonshotai/Kimi-K2.5` для изображений                                                                | понимание входящих изображений                           |
| Распознавание речи в текст | `openai/whisper-large-v3-turbo`                                                                     | транскрипция входящего аудио                             |
| Синтез речи из текста    | `hexgrad/Kokoro-82M`                                                                                  | `messages.tts.provider: "deepinfra"`                     |
| Генерация видео          | первая запись с тегом `video-gen` из живого каталога (статический резерв `Pixverse/Pixverse-T2V`)     | `video_generate`, `agents.defaults.videoGenerationModel` |
| Эмбеддинги памяти        | `BAAI/bge-m3`                                                                                         | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra также предоставляет reranking, классификацию, обнаружение объектов и другие
нативные типы моделей. В OpenClaw сейчас нет полноценных контрактов провайдера
для этих категорий, поэтому этот Plugin пока их не регистрирует.

## Доступные модели

OpenClaw динамически обнаруживает доступные модели DeepInfra при запуске. Используйте
`/models deepinfra`, чтобы увидеть полный список доступных моделей.

Любую модель, доступную на [DeepInfra.com](https://deepinfra.com/), можно использовать с префиксом `deepinfra/`:

```
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...and many more
```

## Примечания

- Ссылки на модели имеют формат `deepinfra/<provider>/<model>` (например, `deepinfra/Qwen/Qwen3-Max`).
- Модель по умолчанию: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- Базовый URL: `https://api.deepinfra.com/v1/openai`
- Нативная генерация видео использует `https://api.deepinfra.com/v1/inference/<model>`.

## Связанные материалы

- [Провайдеры моделей](/ru/concepts/model-providers)
- [Все провайдеры](/ru/providers/index)

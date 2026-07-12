---
read_when:
    - Вам нужен единый ключ API для ведущих LLM с открытым исходным кодом
    - Вы хотите запускать модели через API DeepInfra в OpenClaw
summary: Используйте унифицированный API DeepInfra для доступа к самым популярным моделям с открытым исходным кодом и передовым моделям в OpenClaw
title: DeepInfra
x-i18n:
    generated_at: "2026-07-12T11:46:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f68bac84311d20348007c715803a34451ba8ab0c09beba63366ba5b1b29de05
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra направляет запросы к популярным моделям с открытым исходным кодом и передовым моделям через единую OpenAI-совместимую конечную точку и ключ API. Большинство SDK OpenAI работают с ней после изменения базового URL.

## Установка Plugin

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## Получение ключа API

1. Войдите в систему на [deepinfra.com](https://deepinfra.com/)
2. Перейдите в Dashboard / Keys и создайте ключ либо используйте автоматически созданный

## Настройка CLI

```bash
openclaw onboard --deepinfra-api-key <key>
```

Либо задайте переменную окружения:

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

## Поддерживаемые возможности

После настройки `DEEPINFRA_API_KEY` каталоги моделей для чата, генерации изображений и генерации видео обновляются в реальном времени с адреса `https://api.deepinfra.com/v1/openai/models?sort_by=openclaw&filter=with_meta`. Для остальных возможностей используются приведённые ниже статические значения по умолчанию, пока они не будут переведены на тот же динамический каталог.

| Возможность                  | Модель по умолчанию                                                                                         | Конфигурация/инструмент OpenClaw                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Чат / поставщик моделей    | первая запись с тегом `chat` из динамического каталога (статический резервный вариант: `deepseek-ai/DeepSeek-V4-Flash`)           | `agents.defaults.model`                                  |
| Генерация/редактирование изображений | первая запись с тегом `image-gen` из динамического каталога (статический резервный вариант: `black-forest-labs/FLUX-1-schnell`) | `image_generate`, `agents.defaults.imageGenerationModel` |
| Анализ мультимедиа      | `moonshotai/Kimi-K2.5` для изображений                                                                     | анализ входящих изображений                              |
| Преобразование речи в текст           | `openai/whisper-large-v3-turbo`                                                                       | расшифровка входящего аудио                              |
| Преобразование текста в речь           | `hexgrad/Kokoro-82M`                                                                                  | `messages.tts.provider: "deepinfra"`                     |
| Генерация видео         | статический резервный вариант `Pixverse/Pixverse-T2V` (сейчас DeepInfra не предоставляет динамических записей `video-gen`)                 | `video_generate`, `agents.defaults.videoGenerationModel` |
| Векторные представления памяти        | `BAAI/bge-m3`                                                                                         | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra также предоставляет переранжирование, классификацию, обнаружение объектов и другие собственные типы моделей. В OpenClaw пока нет контракта поставщика для этих категорий, поэтому этот Plugin их не регистрирует.

## Доступные модели

После настройки ключа OpenClaw динамически обнаруживает модели DeepInfra. Чтобы просмотреть текущий список, используйте `/models deepinfra` или `openclaw models list --provider deepinfra`.

Любая модель на [deepinfra.com](https://deepinfra.com/) работает с префиксом `deepinfra/`:

```text
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...и многие другие
```

## Примечания

- Ссылки на модели имеют формат `deepinfra/<provider>/<model>` (например, `deepinfra/Qwen/Qwen3-Max`).
- Модель чата по умолчанию: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- Базовый URL: `https://api.deepinfra.com/v1/openai`
- Нативная генерация видео использует `https://api.deepinfra.com/v1/inference/<model>`.

## Связанные материалы

- [Поставщики моделей](/ru/concepts/model-providers)
- [Все поставщики](/ru/providers/index)

---
read_when:
    - Вы устанавливаете, настраиваете или проверяете плагин microsoft-foundry
summary: Добавляет в OpenClaw поддержку провайдера моделей Microsoft Foundry.
title: Плагин Microsoft Foundry
x-i18n:
    generated_at: "2026-07-13T18:34:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: c120a68393626e5ff9f24cd80bce4612a3772faf3722b93f2ff4677f743d0252
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Плагин Microsoft Foundry

Добавляет в OpenClaw поддержку поставщика моделей Microsoft Foundry.

## Распространение

- Пакет: `@openclaw/microsoft-foundry`
- Способ установки: включён в OpenClaw

## Интерфейс

поставщики: microsoft-foundry; контракты: imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- Поставщик генерации изображений: `microsoft-foundry`

## Требования

- Ресурс Microsoft Foundry или Azure AI Foundry с развёртываниями.
- Аутентификация по ключу API через `AZURE_OPENAI_API_KEY` или настроенный ключ API поставщика.
- Для аутентификации через Entra ID установите Azure CLI и выполните `az login` перед
  первоначальной настройкой. OpenClaw обновляет токены среды выполнения Microsoft Foundry через
  `az account get-access-token`.

## Модели чата

Развёртывания чата Microsoft Foundry используют ссылку на модель поставщика
`microsoft-foundry/<deployment-name>`. Во время первоначальной настройки ресурсы
и развёртывания Foundry обнаруживаются с помощью Azure CLI, после чего имя выбранного развёртывания
записывается в конфигурацию модели.

Для поддерживаемых API чата, совместимых с OpenAI, OpenClaw использует конечную точку
Foundry `/openai/v1`:

- Для семейств моделей GPT, `o*`, `computer-use-preview` и DeepSeek-V4 по умолчанию используется
  `openai-responses`.
- Для MAI-DS-R1 и других развёртываний завершения чата используется `openai-completions`,
  если явно не настроен другой поддерживаемый API.
- MAI-DS-R1 регистрируется как модель с поддержкой рассуждений посредством содержимого рассуждений, а не
  через `reasoning_effort`. Метаданные контекста и выходных токенов
  составляют 163,840 токенов.

Развёртывания Anthropic Claude в Microsoft Foundry используют формат API Anthropic Messages,
а не совместимый с OpenAI формат `/openai/v1`. Настройте их как
пользовательского поставщика `anthropic-messages`, пока плагин Microsoft Foundry не получит
собственную среду выполнения Anthropic. Если имя развёртывания Foundry отличается от
идентификатора модели Claude, задайте `params.canonicalModelId` в записи модели, чтобы OpenClaw
мог применять зависящие от модели контракты обмена данными, правильно сопоставлять `/think off` и
безопасно сохранять подписанные данные процесса рассуждения.

## Генерация изображений MAI

Плагин регистрирует `microsoft-foundry` для `image_generate` с текущими
моделями генерации изображений Microsoft AI:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

Используйте имя развёрнутого развёртывания изображений MAI в качестве ссылки на модель. Поставщик
не объявляет модель изображений по умолчанию, поскольку API MAI требует указывать имя вашего развёртывания
в поле запроса `model`:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "microsoft-foundry/<deployment-name>",
        timeoutMs: 600000,
      },
    },
  },
}
```

При генерации только по текстовому запросу вызывается конечная точка генерации MAI в Microsoft Foundry:
`/mai/v1/images/generations`. При редактировании по эталонному изображению вызывается
`/mai/v1/images/edits`; такие операции доступны только для развёртываний `MAI-Image-2.5-Flash` и
`MAI-Image-2.5`.

Для генерации только по текстовому запросу можно использовать пользовательское имя развёртывания, настроив лишь
конечную точку Foundry. Для редактирования изображений с пользовательским именем развёртывания выберите
развёртывание во время первоначальной настройки или добавьте метаданные модели, чтобы OpenClaw мог проверить,
что развёртывание основано на `MAI-Image-2.5-Flash` или `MAI-Image-2.5`.

Ограничения изображений MAI:

- Результат: одно изображение PNG на запрос.
- Размер: по умолчанию `1024x1024`; ширина и высота должны составлять не менее 768 px.
- Общее количество пикселей: произведение ширины и высоты не должно превышать 1,048,576.
- Редактирование: одно входное изображение PNG или JPEG.
- Неподдерживаемые общие параметры, такие как `aspectRatio`, `resolution`, `quality`,
  `background` и форматы `outputFormat`, отличные от PNG, не отправляются в Microsoft Foundry.

## Устранение неполадок

- `az: command not found`: установите Azure CLI или используйте аутентификацию по ключу API.
- `Microsoft Foundry endpoint missing for MAI image generation`: выберите
  развёртывание Foundry во время первоначальной настройки или добавьте `models.providers.microsoft-foundry.baseUrl`.
- `supports MAI image deployments only`: выбранная модель изображений указывает на
  развёртывание, не относящееся к MAI. Используйте развёрнутую модель изображений MAI для `image_generate`.

<!-- openclaw-plugin-reference:manual-end -->

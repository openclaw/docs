---
read_when:
    - Вы устанавливаете, настраиваете или проверяете плагин microsoft-foundry
summary: Добавляет в OpenClaw поддержку провайдера моделей Microsoft Foundry.
title: Плагин Microsoft Foundry
x-i18n:
    generated_at: "2026-07-16T16:35:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f2ea554ce16cffeb4cc315e53d986d6f07b5e113fbb844c61c6575f19f8ad291
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Плагин Microsoft Foundry

Добавляет в OpenClaw поддержку поставщика моделей Microsoft Foundry.

## Распространение

- Пакет: `@openclaw/microsoft-foundry`
- Способ установки: входит в состав OpenClaw

## Поверхность

поставщики: `microsoft-foundry`; контракты: `imageGenerationProviders`

<!-- openclaw-plugin-reference:manual-start -->

- Поставщик генерации изображений: `microsoft-foundry`

## Требования

- Ресурс Microsoft Foundry или Azure AI Foundry с развертываниями.
- Аутентификация с помощью ключа API через `AZURE_OPENAI_API_KEY` или настроенный ключ API поставщика.
- Для аутентификации Entra ID установите Azure CLI и выполните `az login` перед
  начальной настройкой. OpenClaw обновляет токены среды выполнения Microsoft Foundry через
  `az account get-access-token`.

## Модели чата

Развертывания чата Microsoft Foundry используют ссылку на модель поставщика
`microsoft-foundry/<deployment-name>`. Во время начальной настройки ресурсы
и развертывания Foundry обнаруживаются с помощью Azure CLI, после чего имя выбранного развертывания записывается
в конфигурацию модели.

OpenClaw использует конечную точку Foundry `/openai/v1` для поддерживаемых совместимых с OpenAI
API чата:

- Семейства моделей GPT, `o*`, `computer-use-preview` и DeepSeek-V4 по умолчанию используют
  `openai-responses`.
- MAI-DS-R1 и другие развертывания завершения чата используют `openai-completions`,
  если явно не настроен поддерживаемый API.
- MAI-DS-R1 регистрируется как модель с поддержкой рассуждений через содержимое рассуждений, а не
  через `reasoning_effort`. Метаданные контекста и выходных токенов этой модели составляют
  163,840 токенов.

Развертывания Anthropic Claude в Microsoft Foundry используют формат API Anthropic Messages,
а не совместимый с OpenAI формат `/openai/v1`. Настройте их как пользовательского
поставщика `anthropic-messages`, пока в плагине Microsoft Foundry не появится
нативная среда выполнения Anthropic. Если имя развертывания Foundry отличается от
идентификатора модели Claude, задайте `params.canonicalModelId` в записи модели, чтобы OpenClaw
мог применять специфичные для модели контракты передачи данных, правильно сопоставлять `/think off` и
безопасно сохранять подписанные рассуждения.

## Генерация изображений MAI

Плагин регистрирует `microsoft-foundry` для `image_generate` с текущими
моделями изображений Microsoft AI:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

Используйте имя развернутого развертывания изображений MAI как ссылку на модель. Поставщик
не объявляет модель изображений по умолчанию, поскольку API MAI требует указывать имя вашего развертывания
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

При генерации только по запросу вызывается конечная точка генераций MAI Microsoft Foundry:
`/mai/v1/images/generations`. При редактировании по эталонному изображению вызывается
`/mai/v1/images/edits`; такая возможность доступна только для развертываний `MAI-Image-2.5-Flash` и
`MAI-Image-2.5`.

Для генерации только по запросу можно использовать пользовательское имя развертывания, настроив лишь конечную точку
Foundry. Для редактирования изображений с пользовательским именем развертывания выберите
развертывание во время начальной настройки или укажите метаданные модели, чтобы OpenClaw мог проверить,
что развертывание основано на `MAI-Image-2.5-Flash` или `MAI-Image-2.5`.

Ограничения изображений MAI:

- Выходные данные: одно изображение PNG на запрос.
- Размер: по умолчанию `1024x1024`; ширина и высота должны быть не менее 768 пикселей.
- Общее количество пикселей: ширина × высота не должно превышать 1,048,576.
- Редактирование: одно входное изображение PNG или JPEG.
- Неподдерживаемые общие подсказки, такие как `aspectRatio`, `resolution`, `quality`,
  `background`, а также `outputFormat` в формате, отличном от PNG, не отправляются в Microsoft Foundry.

## Устранение неполадок

- `az: command not found`: установите Azure CLI или используйте аутентификацию с помощью ключа API.
- `Microsoft Foundry endpoint missing for MAI image generation`: выберите
  развертывание Foundry во время начальной настройки или добавьте `models.providers.microsoft-foundry.baseUrl`.
- `supports MAI image deployments only`: выбранная модель изображений указывает на
  развертывание, отличное от MAI. Используйте развернутую модель изображений MAI для `image_generate`.

<!-- openclaw-plugin-reference:manual-end -->

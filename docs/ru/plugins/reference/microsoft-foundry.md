---
read_when:
    - Вы устанавливаете, настраиваете или проверяете plugin microsoft-foundry
summary: Добавляет поддержку провайдера моделей Microsoft Foundry в OpenClaw.
title: Plugin Microsoft Foundry
x-i18n:
    generated_at: "2026-06-28T23:26:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120a68393626e5ff9f24cd80bce4612a3772faf3722b93f2ff4677f743d0252
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Plugin Microsoft Foundry

Добавляет в OpenClaw поддержку поставщика моделей Microsoft Foundry.

## Распространение

- Пакет: `@openclaw/microsoft-foundry`
- Способ установки: включен в OpenClaw

## Поверхность

поставщики: microsoft-foundry; контракты: imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- Поставщик генерации изображений: `microsoft-foundry`

## Требования

- Ресурс Microsoft Foundry или Azure AI Foundry с развертываниями.
- Аутентификация по API-ключу через `AZURE_OPENAI_API_KEY` или настроенный API-ключ поставщика.
- Для аутентификации Entra ID установите Azure CLI и выполните `az login` перед
  подключением. OpenClaw обновляет токены среды выполнения Microsoft Foundry через
  `az account get-access-token`.

## Чат-модели

Чат-развертывания Microsoft Foundry используют ссылку на модель поставщика
`microsoft-foundry/<deployment-name>`. При подключении OpenClaw обнаруживает ресурсы
и развертывания Foundry с помощью Azure CLI, затем записывает имя выбранного развертывания в
конфигурацию модели.

OpenClaw использует конечную точку Foundry `/openai/v1` для поддерживаемых OpenAI-совместимых
чат-API:

- Семейства моделей GPT, `o*`, `computer-use-preview` и DeepSeek-V4 по умолчанию используют
  `openai-responses`.
- MAI-DS-R1 и другие развертывания chat-completion используют `openai-completions`,
  если явно не настроен поддерживаемый API.
- MAI-DS-R1 записывается как модель с поддержкой рассуждений через содержимое рассуждений, а не
  через `reasoning_effort`. Ее метаданные контекста и выходных токенов составляют
  163 840 токенов.

Развертывания Anthropic Claude в Microsoft Foundry используют форму API Anthropic Messages,
а не OpenAI-совместимую форму `/openai/v1`. Настраивайте их как
пользовательский поставщик `anthropic-messages`, пока Plugin Microsoft Foundry не получит
собственную среду выполнения Anthropic. Когда имя развертывания Foundry отличается от
идентификатора модели Claude, задайте `params.canonicalModelId` в записи модели, чтобы OpenClaw
мог применять специфичные для модели wire-контракты, корректно сопоставлять `/think off` и
безопасно сохранять подписанное мышление.

## Генерация изображений MAI

Plugin регистрирует `microsoft-foundry` для `image_generate` с текущими
моделями изображений Microsoft AI:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

Используйте имя развертывания изображения MAI как ссылку на модель. Поставщик
не объявляет модель изображения по умолчанию, потому что API MAI требует имя вашего развертывания
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

Вызовы генерации только по промпту используют конечную точку генераций MAI Microsoft Foundry:
`/mai/v1/images/generations`. Редактирование по эталонному изображению вызывает
`/mai/v1/images/edits` и ограничено развертываниями `MAI-Image-2.5-Flash` и
`MAI-Image-2.5`.

Генерация только по промпту может использовать пользовательское имя развертывания, если настроена
только конечная точка Foundry. Для редактирования изображений с пользовательским именем развертывания выберите
развертывание через подключение или включите метаданные модели, чтобы OpenClaw мог проверить,
что развертывание основано на `MAI-Image-2.5-Flash` или `MAI-Image-2.5`.

Ограничения изображений MAI:

- Вывод: одно PNG-изображение на запрос.
- Размер: по умолчанию `1024x1024`; ширина и высота должны быть не менее 768 px.
- Общее число пикселей: ширина × высота не должна превышать 1 048 576.
- Редактирование: одно входное изображение PNG или JPEG.
- Неподдерживаемые общие подсказки, такие как `aspectRatio`, `resolution`, `quality`,
  `background` и не-PNG `outputFormat`, не отправляются в Microsoft Foundry.

## Устранение неполадок

- `az: command not found`: установите Azure CLI или используйте аутентификацию по API-ключу.
- `Microsoft Foundry endpoint missing for MAI image generation`: выберите
  развертывание Foundry через подключение или добавьте `models.providers.microsoft-foundry.baseUrl`.
- `supports MAI image deployments only`: выбранная модель изображения указывает на
  не-MAI-развертывание. Используйте развернутую модель изображения MAI для `image_generate`.

<!-- openclaw-plugin-reference:manual-end -->

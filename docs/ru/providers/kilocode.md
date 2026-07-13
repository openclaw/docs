---
read_when:
    - Вам нужен единый ключ API для множества LLM-моделей
    - Вы хотите запускать модели через Kilo Gateway в OpenClaw
summary: Используйте единый API Kilo Gateway для доступа ко множеству моделей в OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-07-13T18:30:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 2108e1bb5b2430f42bf9e798da1d5e40448f05d396ab1710a0d6708961960756
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway направляет запросы к множеству моделей через единую конечную точку, совместимую с OpenAI, и один ключ API.

| Свойство    | Значение                           |
| ----------- | ---------------------------------- |
| Провайдер   | `kilocode`                 |
| Авторизация | `KILOCODE_API_KEY`                 |
| API         | Совместимый с OpenAI               |
| Базовый URL | `https://api.kilo.ai/api/gateway/`                 |

## Установка плагина

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## Настройка

<Steps>
  <Step title="Создайте учётную запись">
    Перейдите на [app.kilo.ai](https://app.kilo.ai), войдите или создайте учётную запись, затем сгенерируйте ключ API.
  </Step>
  <Step title="Запустите первоначальную настройку">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Или задайте переменную окружения напрямую:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Убедитесь, что модель доступна">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Модель по умолчанию и каталог

Модель по умолчанию — `kilocode/kilo/auto`, принадлежащая провайдеру модель с интеллектуальной маршрутизацией. OpenClaw не
публикует для неё сопоставление задач с моделями вышестоящих провайдеров; маршрутизацией за `kilo/auto` управляет Kilo Gateway.

При запуске OpenClaw запрашивает `GET https://api.kilo.ai/api/gateway/models` и объединяет обнаруженные модели,
помещая их перед статическим резервным каталогом. Статический резервный каталог содержит только `kilocode/kilo/auto` (`Kilo Auto`,
`input: ["text", "image"]`, `reasoning: true`, `contextWindow: 1000000`, `maxTokens: 128000`).

К любой модели в Gateway можно обратиться как к `kilocode/<upstream-id>` (например,
`kilocode/anthropic/claude-sonnet-4`, `kilocode/openai/gpt-5.5`). Выполните `/models kilocode` или
`openclaw models list --provider kilocode`, чтобы просмотреть полный список обнаруженных моделей.

## Пример конфигурации

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

## Примечания о поведении

<AccordionGroup>
  <Accordion title="Транспорт и совместимость">
    Kilo Gateway совместим с OpenRouter, поэтому использует прокси-путь запросов, совместимый с OpenAI,
    вместо формирования нативных запросов OpenAI (без `store` и без полезной нагрузки OpenAI для уровня рассуждений).

    - Ссылки Kilo на базе Gemini остаются на прокси-пути Gemini: OpenClaw очищает там сигнатуры
      рассуждений Gemini, но не включает нативную проверку воспроизведения Gemini или перезапись начальной загрузки.
    - В запросах используется токен Bearer, сформированный из вашего ключа API.

  </Accordion>

  <Accordion title="Обёртка потока и рассуждения">
    Обёртка потока Kilo добавляет к запросу заголовок `X-KILOCODE-FEATURE` (по умолчанию `openclaw`,
    переопределяется переменной окружения `KILOCODE_FEATURE`) и нормализует полезную нагрузку уровня рассуждений для
    поддерживающих её моделей.

    <Warning>
    Для ссылок `kilocode/kilo/auto` и `x-ai/*` внедрение уровня рассуждений пропускается. Если вам нужна поддержка
    рассуждений, используйте ссылку на конкретную модель, например `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Устранение неполадок">
    - Если при запуске не удаётся обнаружить модели, OpenClaw использует статический резервный каталог, содержащий `kilocode/kilo/auto`.
    - Убедитесь, что ваш ключ API действителен и в вашей учётной записи Kilo включены нужные модели.
    - Если Gateway работает как демон, убедитесь, что `KILOCODE_API_KEY` доступна этому процессу (например, в `~/.openclaw/.env` или через `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения при переключении после сбоя.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/configuration-reference" icon="gear">
    Полный справочник по конфигурации OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Панель управления Kilo Gateway, ключи API и управление учётной записью.
  </Card>
</CardGroup>

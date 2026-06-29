---
read_when:
    - Вам нужен один API-ключ для многих LLMs
    - Вы хотите запускать модели через Kilo Gateway в OpenClaw
summary: Используйте единый API Kilo Gateway для доступа ко множеству моделей в OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-06-28T23:37:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be06295295b63ce9b9d00d6f3d73e132c805237fde056eac4619616bf992e803
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway предоставляет **единый API**, который маршрутизирует запросы ко многим моделям через одну
конечную точку и API-ключ. Он совместим с OpenAI, поэтому большинство OpenAI SDK работают после смены базового URL.

| Свойство | Значение                           |
| -------- | ---------------------------------- |
| Провайдер | `kilocode`                         |
| Авторизация | `KILOCODE_API_KEY`                 |
| API      | Совместимый с OpenAI               |
| Базовый URL | `https://api.kilo.ai/api/gateway/` |

## Установка Plugin

Установите официальный Plugin, затем перезапустите Gateway:

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## Начало работы

<Steps>
  <Step title="Создайте учетную запись">
    Перейдите на [app.kilo.ai](https://app.kilo.ai), войдите или создайте учетную запись, затем откройте API Keys и сгенерируйте новый ключ.
  </Step>
  <Step title="Запустите онбординг">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    Или задайте переменную окружения напрямую:

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="Проверьте, что модель доступна">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## Модель по умолчанию

Модель по умолчанию — `kilocode/kilo/auto`, принадлежащая провайдеру модель
интеллектуальной маршрутизации, управляемая Kilo Gateway.

<Note>
OpenClaw рассматривает `kilocode/kilo/auto` как стабильную ссылку по умолчанию, но не
публикует подтвержденное исходниками сопоставление задач с вышестоящими моделями для этого маршрута. Точная
вышестоящая маршрутизация за `kilocode/kilo/auto` принадлежит Kilo Gateway, а не
зашита в OpenClaw.
</Note>

## Встроенный каталог

OpenClaw динамически обнаруживает доступные модели из Kilo Gateway при запуске. Используйте
`/models kilocode`, чтобы увидеть полный список моделей, доступных для вашей учетной записи.

Любую модель, доступную в Gateway, можно использовать с префиксом `kilocode/`:

| Ссылка на модель                         | Примечания                         |
| ---------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                     | По умолчанию — интеллектуальная маршрутизация |
| `kilocode/anthropic/claude-sonnet-4`     | Anthropic через Kilo               |
| `kilocode/openai/gpt-5.5`                | OpenAI через Kilo                  |
| `kilocode/google/gemini-3.1-pro-preview` | Google через Kilo                  |
| ...и многие другие                       | Используйте `/models kilocode`, чтобы вывести все |

<Tip>
При запуске OpenClaw выполняет запрос `GET https://api.kilo.ai/api/gateway/models` и объединяет
обнаруженные модели перед статическим резервным каталогом. Статический резервный каталог всегда
включает `kilocode/kilo/auto` (`Kilo Auto`) с `input: ["text", "image"]`,
`reasoning: true`, `contextWindow: 1000000` и `maxTokens: 128000`.
</Tip>

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

<AccordionGroup>
  <Accordion title="Транспорт и совместимость">
    Kilo Gateway задокументирован в исходном коде как совместимый с OpenRouter, поэтому он остается на
    прокси-пути, совместимом с OpenAI, а не использует нативное формирование запросов OpenAI.

    - Ссылки Kilo на базе Gemini остаются на прокси-пути Gemini, поэтому OpenClaw сохраняет
      там очистку thought-signature Gemini без включения нативной проверки воспроизведения Gemini
      или перезаписей начальной загрузки.
    - Kilo Gateway использует токен Bearer с вашим API-ключом внутри.

  </Accordion>

  <Accordion title="Обертка потока и reasoning">
    Общая обертка потока Kilo добавляет заголовок приложения провайдера и нормализует
    прокси-полезные нагрузки reasoning для поддерживаемых конкретных ссылок на модели.

    <Warning>
    `kilocode/kilo/auto` и другие подсказки, не поддерживающие прокси-reasoning, пропускают
    внедрение reasoning. Если вам нужна поддержка reasoning, используйте конкретную ссылку на модель, например
    `kilocode/anthropic/claude-sonnet-4`.
    </Warning>

  </Accordion>

  <Accordion title="Устранение неполадок">
    - Если обнаружение моделей при запуске не удается, OpenClaw возвращается к статическому каталогу, содержащему `kilocode/kilo/auto`.
    - Убедитесь, что ваш API-ключ действителен и что в вашей учетной записи Kilo включены нужные модели.
    - Когда Gateway работает как daemon, убедитесь, что `KILOCODE_API_KEY` доступен этому процессу (например, в `~/.openclaw/.env` или через `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок на модели и поведения failover.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/configuration-reference" icon="gear">
    Полный справочник по конфигурации OpenClaw.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Панель управления Kilo Gateway, API-ключи и управление учетной записью.
  </Card>
</CardGroup>

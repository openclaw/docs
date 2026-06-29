---
read_when:
    - Вам нужны модели Z.AI / GLM в OpenClaw
    - Вам нужна простая настройка ZAI_API_KEY
summary: Использование Z.AI (моделей GLM) с OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-06-28T23:41:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a40675d3db518c090828bcc46c3bca348d1bed1027ba6b80228aa27773efd10f
    source_path: providers/zai.md
    workflow: 16
---

Z.AI — это API-платформа для моделей **GLM**. Она предоставляет REST API для GLM и
использует ключи API для аутентификации. Создайте ключ API в консоли Z.AI.
OpenClaw использует провайдера `zai` с ключом API Z.AI.

| Свойство | Значение                                      |
| -------- | -------------------------------------------- |
| Провайдер | `zai`                                       |
| Пакет    | `@openclaw/zai-provider`                     |
| Аутентификация | `ZAI_API_KEY` (устаревший псевдоним: `Z_AI_API_KEY`) |
| API      | Chat Completions Z.AI (аутентификация Bearer) |

## Модели GLM

GLM — это семейство моделей, а не отдельный провайдер. В OpenClaw модели GLM используют
ссылки, такие как `zai/glm-5.2`: провайдер `zai`, идентификатор модели `glm-5.2`.

## Начало работы

Сначала установите Plugin провайдера:

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="Автоопределение конечной точки">
    **Лучше всего подходит для:** большинства пользователей. OpenClaw проверяет поддерживаемые конечные точки Z.AI с вашим ключом API и автоматически применяет правильный базовый URL.

    <Steps>
      <Step title="Запустите онбординг">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Проверьте, что модель есть в списке">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Явная региональная конечная точка">
    **Лучше всего подходит для:** пользователей, которые хотят принудительно выбрать конкретный Coding Plan или общий интерфейс API.

    <Steps>
      <Step title="Выберите правильный вариант онбординга">
        ```bash
        # Coding Plan Global (recommended for Coding Plan users)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (China region)
        openclaw onboard --auth-choice zai-coding-cn

        # General API
        openclaw onboard --auth-choice zai-global

        # General API CN (China region)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Проверьте, что модель есть в списке">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Пример конфигурации

<Tip>
`zai-api-key` позволяет OpenClaw определить соответствующую конечную точку Z.AI по ключу и
автоматически применить правильный базовый URL. Используйте явные региональные варианты, когда
хотите принудительно выбрать конкретный Coding Plan или общий интерфейс API.
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 uses the Coding Plan endpoint.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## Встроенный каталог

Plugin провайдера `zai` поставляет свой каталог в манифесте Plugin, поэтому список
для чтения может показывать известные строки GLM без загрузки среды выполнения провайдера:

```bash
openclaw models list --all --provider zai
```

Каталог на основе манифеста сейчас включает:

| Ссылка модели       | Примечания                      |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | Значение по умолчанию для Coding Plan; контекст 1M |
| `zai/glm-5.1`        | Значение по умолчанию для общего API |
| `zai/glm-5`          |                                 |
| `zai/glm-5-turbo`    |                                 |
| `zai/glm-5v-turbo`   |                                 |
| `zai/glm-4.7`        |                                 |
| `zai/glm-4.7-flash`  |                                 |
| `zai/glm-4.7-flashx` |                                 |
| `zai/glm-4.6`        |                                 |
| `zai/glm-4.6v`       |                                 |
| `zai/glm-4.5`        |                                 |
| `zai/glm-4.5-air`    |                                 |
| `zai/glm-4.5-flash`  |                                 |
| `zai/glm-4.5v`       |                                 |

<Tip>
Модели GLM доступны как `zai/<model>` (пример: `zai/glm-5`).
</Tip>

<Tip>
GLM-5.2 поддерживает уровни мышления `off`, `low`, `high` и `max`. OpenClaw сопоставляет
`low` и `high` с высоким уровнем усилия рассуждения Z.AI, а `max` — с максимальным усилием.
</Tip>

<Note>
Настройка Coding Plan по умолчанию использует `zai/glm-5.2`; настройка общего API сохраняет
`zai/glm-5.1`. Автоопределение конечной точки откатывается к `glm-5.1` или `glm-4.7`,
когда выбранный план не предоставляет GLM-5.2. Версии и доступность GLM
могут меняться; выполните `openclaw models list --all --provider zai`, чтобы увидеть каталог,
известный вашей установленной версии.
</Note>

## Расширенная конфигурация

<AccordionGroup>
  <Accordion title="Прямое разрешение неизвестных моделей GLM-5">
    Неизвестные идентификаторы `glm-5*` все равно прямо разрешаются на пути провайдера путем
    синтеза метаданных, принадлежащих провайдеру, из шаблона `glm-4.7`, когда идентификатор
    соответствует текущей форме семейства GLM-5.
  </Accordion>

  <Accordion title="Потоковая передача вызовов инструментов">
    `tool_stream` включен по умолчанию для потоковой передачи вызовов инструментов Z.AI. Чтобы отключить его:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/<model>": {
              params: { tool_stream: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Мышление и сохраненное мышление">
    Мышление Z.AI следует элементам управления `/think` в OpenClaw. При отключенном мышлении
    OpenClaw отправляет `thinking: { type: "disabled" }`, чтобы избежать ответов, которые
    тратят бюджет вывода на `reasoning_content` до видимого текста.

    Сохраненное мышление включается явно, потому что Z.AI требует повторной передачи полного исторического
    `reasoning_content`, что увеличивает количество токенов промпта. Включите его
    для каждой модели:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.2": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    Когда оно включено и мышление активно, OpenClaw отправляет
    `thinking: { type: "enabled", clear_thinking: false }` и повторно передает предыдущий
    `reasoning_content` для той же совместимой с OpenAI стенограммы.

    Опытные пользователи по-прежнему могут переопределить точную полезную нагрузку провайдера с помощью
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Понимание изображений">
    Plugin Z.AI регистрирует понимание изображений.

    | Свойство      | Значение    |
    | ------------- | ----------- |
    | Модель        | `glm-4.6v`  |

    Понимание изображений автоматически разрешается из настроенной аутентификации Z.AI — дополнительная
    конфигурация не нужна.

  </Accordion>

  <Accordion title="Сведения об аутентификации">
    - Z.AI использует аутентификацию Bearer с вашим ключом API.
    - Вариант онбординга `zai-api-key` автоматически определяет соответствующую конечную точку Z.AI, проверяя поддерживаемые конечные точки с вашим ключом.
    - Используйте явные региональные варианты (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`), когда хотите принудительно выбрать конкретный интерфейс API.
    - Устаревшая переменная окружения `Z_AI_API_KEY` все еще принимается; OpenClaw копирует ее в `ZAI_API_KEY` при запуске, если `ZAI_API_KEY` не задана.

  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Выбор провайдеров, ссылок моделей и поведения при отказе.
  </Card>
  <Card title="Справочник по конфигурации" href="/ru/gateway/configuration-reference" icon="gear">
    Полная схема конфигурации OpenClaw, включая настройки провайдера и модели.
  </Card>
</CardGroup>

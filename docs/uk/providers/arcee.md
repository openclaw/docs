---
read_when:
    - Ви хочете використовувати Arcee AI з OpenClaw
    - Вам потрібна env var ключа API або варіант auth у CLI
summary: Налаштування Arcee AI (auth + вибір моделі)
title: Arcee AI
x-i18n:
    generated_at: "2026-04-23T21:05:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 54989e1706901fedc8a0c816ca7ee7f877fa4b973697540dd90cb9182420043f
    source_path: providers/arcee.md
    workflow: 15
---

[Arcee AI](https://arcee.ai) надає доступ до сімейства моделей Trinity на основі mixture-of-experts через API, сумісний з OpenAI. Усі моделі Trinity ліцензовано за Apache 2.0.

До моделей Arcee AI можна отримати доступ безпосередньо через платформу Arcee або через [OpenRouter](/uk/providers/openrouter).

| Властивість | Значення                                                                            |
| ----------- | ----------------------------------------------------------------------------------- |
| Provider    | `arcee`                                                                             |
| Auth        | `ARCEEAI_API_KEY` (напряму) або `OPENROUTER_API_KEY` (через OpenRouter)            |
| API         | Сумісний з OpenAI                                                                   |
| Base URL    | `https://api.arcee.ai/api/v1` (напряму) або `https://openrouter.ai/api/v1` (OpenRouter) |

## Початок роботи

<Tabs>
  <Tab title="Напряму (платформа Arcee)">
    <Steps>
      <Step title="Отримайте ключ API">
        Створіть ключ API в [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Задайте типову модель">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Через OpenRouter">
    <Steps>
      <Step title="Отримайте ключ API">
        Створіть ключ API в [OpenRouter](https://openrouter.ai/keys).
      </Step>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Задайте типову модель">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        Ті самі refs моделей працюють і для прямого налаштування, і для налаштування через OpenRouter (наприклад `arcee/trinity-large-thinking`).
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Неінтерактивне налаштування

<Tabs>
  <Tab title="Напряму (платформа Arcee)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="Через OpenRouter">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## Вбудований каталог

Наразі OpenClaw постачає такий вбудований каталог Arcee:

| Ref моделі                     | Назва                  | Вхід | Контекст | Вартість (in/out за 1M) | Примітки                                  |
| ------------------------------ | ---------------------- | ---- | -------- | ----------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text | 256K     | $0.25 / $0.90           | Типова модель; reasoning увімкнено        |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text | 128K     | $0.25 / $1.00           | Загального призначення; 400B params, 13B active |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text | 128K     | $0.045 / $0.15          | Швидка й економна; function calling       |

<Tip>
Preset онбордингу встановлює `arcee/trinity-large-thinking` як типову модель.
</Tip>

## Підтримувані можливості

| Можливість                                    | Підтримується                |
| --------------------------------------------- | ---------------------------- |
| Streaming                                     | Так                          |
| Tool use / function calling                   | Так                          |
| Structured output (режим JSON і JSON schema)  | Так                          |
| Extended thinking                             | Так (Trinity Large Thinking) |

<AccordionGroup>
  <Accordion title="Примітка щодо середовища">
    Якщо Gateway працює як daemon (launchd/systemd), переконайтеся, що `ARCEEAI_API_KEY`
    (або `OPENROUTER_API_KEY`) доступний цьому процесу (наприклад, у
    `~/.openclaw/.env` або через `env.shellEnv`).
  </Accordion>

  <Accordion title="Маршрутизація OpenRouter">
    Коли ви використовуєте моделі Arcee через OpenRouter, застосовуються ті самі refs моделей `arcee/*`.
    OpenClaw прозоро обробляє маршрутизацію залежно від вашого вибору auth. Див.
    [документацію provider-а OpenRouter](/uk/providers/openrouter) щодо деталей конфігурації, специфічних для OpenRouter.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/uk/providers/openrouter" icon="shuffle">
    Доступ до моделей Arcee та багатьох інших через один ключ API.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір provider-ів, refs моделей і поведінки failover.
  </Card>
</CardGroup>

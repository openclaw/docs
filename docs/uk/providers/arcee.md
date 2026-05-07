---
read_when:
    - Ви хочете використовувати Arcee AI з OpenClaw
    - Потрібна змінна середовища для ключа API або вибір автентифікації CLI
summary: Налаштування Arcee AI (автентифікація + вибір моделі)
title: Arcee AI
x-i18n:
    generated_at: "2026-05-07T15:12:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c3775ac2783da0833988c68621bd81c73a3b3e8240c26b4c1b590c1e9df2a8f
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) надає доступ до сімейства моделей Trinity типу mixture-of-experts через API, сумісний з OpenAI. Усі моделі Trinity ліцензовано за Apache 2.0.

До моделей Arcee AI можна отримати доступ безпосередньо через платформу Arcee або через [OpenRouter](/uk/providers/openrouter).

| Властивість | Значення                                                                              |
| -------- | ------------------------------------------------------------------------------------- |
| Провайдер | `arcee`                                                                               |
| Автентифікація     | `ARCEEAI_API_KEY` (безпосередньо) або `OPENROUTER_API_KEY` (через OpenRouter)                   |
| API      | Сумісний з OpenAI                                                                     |
| Базова URL-адреса | `https://api.arcee.ai/api/v1` (безпосередньо) або `https://openrouter.ai/api/v1` (OpenRouter) |

## Початок роботи

<Tabs>
  <Tab title="Direct (Arcee platform)">
    <Steps>
      <Step title="Get an API key">
        Створіть API-ключ в [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Set a default model">
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

  <Tab title="Via OpenRouter">
    <Steps>
      <Step title="Get an API key">
        Створіть API-ключ в [OpenRouter](https://openrouter.ai/keys).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        Ті самі посилання на моделі працюють як для безпосереднього налаштування, так і для налаштування через OpenRouter (наприклад, `arcee/trinity-large-thinking`).
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Неінтерактивне налаштування

<Tabs>
  <Tab title="Direct (Arcee platform)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="Via OpenRouter">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## Вбудований каталог

OpenClaw наразі постачається з цим вбудованим каталогом Arcee:

| Посилання на модель                      | Назва                   | Вхід | Контекст | Вартість (вхід/вихід за 1 млн) | Примітки                                     |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | текст  | 256K    | $0.25 / $0.90        | Модель за замовчуванням; reasoning увімкнено          |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | текст  | 128K    | $0.25 / $1.00        | Загального призначення; 400B параметрів, 13B активних  |
| `arcee/trinity-mini`           | Trinity Mini 26B       | текст  | 128K    | $0.045 / $0.15       | Швидка та економічна; виклик функцій |

<Tip>
Пресет onboarding встановлює `arcee/trinity-large-thinking` як модель за замовчуванням.
</Tip>

## Підтримувані можливості

| Можливість                                       | Підтримується                                    |
| --------------------------------------------- | -------------------------------------------- |
| Потокове передавання                                     | Так                                          |
| Використання інструментів / виклик функцій                   | Так (Trinity Mini, Trinity Large Preview)    |
| Структурований вивід (режим JSON і схема JSON) | Так                                          |
| Розширене мислення                             | Так (Trinity Large Thinking; інструменти вимкнено) |

<AccordionGroup>
  <Accordion title="Environment note">
    Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `ARCEEAI_API_KEY`
    (або `OPENROUTER_API_KEY`) доступний цьому процесу (наприклад, у
    `~/.openclaw/.env` або через `env.shellEnv`).
  </Accordion>

  <Accordion title="OpenRouter routing">
    Під час використання моделей Arcee через OpenRouter застосовуються ті самі посилання на моделі `arcee/*`.
    OpenClaw прозоро обробляє маршрутизацію на основі вашого вибору автентифікації. Див.
    [документацію провайдера OpenRouter](/uk/providers/openrouter), щоб дізнатися
    подробиці конфігурації, специфічні для OpenRouter.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/uk/providers/openrouter" icon="shuffle">
    Отримуйте доступ до моделей Arcee та багатьох інших через один API-ключ.
  </Card>
  <Card title="Model selection" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
</CardGroup>

---
read_when:
    - Ви хочете використовувати Arcee AI з OpenClaw
    - Потрібна змінна середовища для ключа API або вибір автентифікації CLI
summary: Налаштування Arcee AI (автентифікація + вибір моделі)
title: Arcee AI
x-i18n:
    generated_at: "2026-05-02T23:39:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 622ee5288aec3ae0b45d3f06ba65fd6f972e07d7a7596ae3905d6fbdac0bf737
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) надає доступ до сімейства моделей Trinity із сумішшю експертів через API, сумісний з OpenAI. Усі моделі Trinity ліцензовано за Apache 2.0.

До моделей Arcee AI можна звертатися напряму через платформу Arcee або через [OpenRouter](/uk/providers/openrouter).

| Властивість | Значення                                                                              |
| -------- | ------------------------------------------------------------------------------------- |
| Provider | `arcee`                                                                               |
| Auth     | `ARCEEAI_API_KEY` (напряму) або `OPENROUTER_API_KEY` (через OpenRouter)               |
| API      | сумісний з OpenAI                                                                      |
| Base URL | `https://api.arcee.ai/api/v1` (напряму) або `https://openrouter.ai/api/v1` (OpenRouter) |

## Початок роботи

<Tabs>
  <Tab title="Напряму (платформа Arcee)">
    <Steps>
      <Step title="Отримайте API-ключ">
        Створіть API-ключ в [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Встановіть модель за замовчуванням">
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
      <Step title="Отримайте API-ключ">
        Створіть API-ключ в [OpenRouter](https://openrouter.ai/keys).
      </Step>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Встановіть модель за замовчуванням">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        Ті самі посилання на моделі працюють як для прямого налаштування, так і для налаштування через OpenRouter (наприклад, `arcee/trinity-large-thinking`).
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

OpenClaw наразі постачається з таким вбудованим каталогом Arcee:

| Посилання на модель            | Назва                  | Ввід | Контекст | Вартість (ввід/вивід за 1 млн) | Примітки                                  |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ------------------------------------------ |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text  | 256K    | $0.25 / $0.90        | Модель за замовчуванням; reasoning увімкнено; без інструментів |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text  | 128K    | $0.25 / $1.00        | Загального призначення; 400B параметрів, 13B активних |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text  | 128K    | $0.045 / $0.15       | Швидка й економічна; виклик функцій       |

<Tip>
Пресет онбордингу встановлює `arcee/trinity-large-thinking` як модель за замовчуванням. Вона підтримує reasoning/лише текст і не підтримує використання інструментів або виклик функцій.
</Tip>

## Підтримувані функції

| Функція                                      | Підтримка                                  |
| --------------------------------------------- | ------------------------------------------- |
| Потокове передавання                          | Так                                         |
| Використання інструментів / виклик функцій    | Залежить від моделі; не Trinity Large Thinking |
| Структурований вивід (режим JSON і схема JSON) | Так                                      |
| Розширене thinking                            | Так (Trinity Large Thinking)                |

<AccordionGroup>
  <Accordion title="Примітка щодо середовища">
    Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `ARCEEAI_API_KEY`
    (або `OPENROUTER_API_KEY`) доступний цьому процесу (наприклад, у
    `~/.openclaw/.env` або через `env.shellEnv`).
  </Accordion>

  <Accordion title="Маршрутизація OpenRouter">
    Під час використання моделей Arcee через OpenRouter застосовуються ті самі посилання на моделі `arcee/*`.
    OpenClaw прозоро обробляє маршрутизацію на основі вашого вибору автентифікації. Див.
    [документацію провайдера OpenRouter](/uk/providers/openrouter), щоб дізнатися
    деталі конфігурації, специфічні для OpenRouter.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/uk/providers/openrouter" icon="shuffle">
    Доступ до моделей Arcee та багатьох інших через один API-ключ.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки відмовостійкості.
  </Card>
</CardGroup>

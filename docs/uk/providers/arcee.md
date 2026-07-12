---
read_when:
    - Ви хочете використовувати Arcee AI з OpenClaw
    - Вам потрібна змінна середовища з ключем API або вибір автентифікації в CLI
summary: Налаштування Arcee AI (автентифікація + вибір моделі)
title: Arcee AI
x-i18n:
    generated_at: "2026-07-12T13:40:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe519393db3cf39f1b14b8121603b6f667102ac8c122fb6560d9b73a6ee6b0a3
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) надає сімейство моделей Trinity на основі суміші експертів через API, сумісний з OpenAI. Усі моделі Trinity ліцензовано за Apache 2.0. Arcee — офіційний Plugin OpenClaw, який не входить до складу ядра, тому перед початковим налаштуванням його потрібно встановити.

Отримуйте доступ до моделей Arcee безпосередньо через платформу Arcee або через [OpenRouter](/uk/providers/openrouter).

| Властивість  | Значення                                                                              |
| ------------ | ------------------------------------------------------------------------------------- |
| Постачальник | `arcee`                                                                               |
| Автентифікація | `ARCEEAI_API_KEY` (напряму) або `OPENROUTER_API_KEY` (через OpenRouter)              |
| API          | Сумісний з OpenAI                                                                     |
| Базова URL-адреса | `https://api.arcee.ai/api/v1` (напряму) або `https://openrouter.ai/api/v1` (OpenRouter) |

## Установлення Plugin

```bash
openclaw plugins install @openclaw/arcee-provider
openclaw gateway restart
```

## Початок роботи

<Tabs>
  <Tab title="Напряму (платформа Arcee)">
    <Steps>
      <Step title="Отримайте ключ API">
        Створіть ключ API на [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="Запустіть початкове налаштування">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Установіть модель за замовчуванням">
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
        Створіть ключ API на [OpenRouter](https://openrouter.ai/keys).
      </Step>
      <Step title="Запустіть початкове налаштування">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Установіть модель за замовчуванням">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        Ті самі посилання на моделі працюють як для прямого підключення, так і для налаштування через OpenRouter.
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

| Посилання на модель            | Назва                  | Вхідні дані | Контекст | Макс. обсяг виведення | Вартість (вхід/вихід за 1 млн) | Інструменти | Примітки                                  |
| ------------------------------ | ---------------------- | ----------- | -------- | --------------------- | ------------------------------ | ----------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | текст       | 256K     | 80K                   | $0.25 / $0.90                  | Ні          | Модель за замовчуванням; розширене міркування |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | текст       | 128K     | 16K                   | $0.25 / $1.00                  | Так         | Загального призначення; 400 млрд параметрів, 13 млрд активних |
| `arcee/trinity-mini`           | Trinity Mini 26B       | текст       | 128K     | 80K                   | $0.045 / $0.15                 | Так         | Швидка й економічна; виклик функцій       |

<Tip>
Попередньо визначене налаштування початкової конфігурації встановлює `arcee/trinity-large-thinking` як модель за замовчуванням.
</Tip>

## Підтримувані можливості

| Можливість                                    | Підтримка                                    |
| --------------------------------------------- | -------------------------------------------- |
| Потокове передавання                          | Так                                          |
| Використання інструментів / виклик функцій    | Так (Trinity Mini, Trinity Large Preview)    |
| Структуроване виведення (режим JSON і схема JSON) | Так                                      |
| Розширене міркування                          | Так (Trinity Large Thinking; інструменти вимкнено) |

<AccordionGroup>
  <Accordion title="Примітка щодо середовища">
    Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `ARCEEAI_API_KEY`
    (або `OPENROUTER_API_KEY`) доступний цьому процесу, наприклад у
    `~/.openclaw/.env` або через `env.shellEnv`.
  </Accordion>

  <Accordion title="Маршрутизація OpenRouter">
    Під час використання моделей Arcee через OpenRouter застосовуються ті самі посилання на моделі `arcee/*`.
    OpenClaw прозоро виконує маршрутизацію на основі вибраного способу автентифікації. Докладні відомості
    про налаштування OpenRouter див. у [документації постачальника OpenRouter](/uk/providers/openrouter).
  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/uk/providers/openrouter" icon="shuffle">
    Отримуйте доступ до моделей Arcee та багатьох інших за допомогою одного ключа API.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки резервного перемикання.
  </Card>
</CardGroup>

---
read_when:
    - Ви хочете запустити OpenClaw із локальним сервером inferrs
    - Ви надаєте доступ до Gemma або іншої моделі через inferrs
    - Вам потрібні точні прапорці сумісності OpenClaw для inferrs
summary: Запуск OpenClaw через inferrs (локальний сервер, сумісний з OpenAI)
title: Виводить висновок
x-i18n:
    generated_at: "2026-07-12T13:41:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b9b6fe337a2ec6536332dd62840052fd802fad0a5f3d885ce137523266ff3c9
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) надає локальні моделі через сумісний з OpenAI API `/v1`. OpenClaw взаємодіє з ним через універсальний адаптер `openai-completions`.

| Властивість              | Значення                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| Ідентифікатор провайдера | `inferrs` (власний; налаштовується в `models.providers.inferrs`)                         |
| Plugin                   | немає — це не вбудований Plugin провайдера OpenClaw                                      |
| Змінна середовища автентифікації | не потрібна; підійде будь-яке значення, якщо ваш сервер inferrs не має автентифікації |
| API                      | сумісний з OpenAI (`openai-completions`)                                                 |
| Рекомендована базова URL-адреса | `http://127.0.0.1:8080/v1` (або адреса, яку прослуховує ваш сервер inferrs)        |

<Note>
  `inferrs` — це власний самостійно розміщений бекенд, сумісний з OpenAI, а не спеціалізований Plugin провайдера OpenClaw: ви налаштовуєте його в `models.providers.inferrs`, а не вибираєте варіант автентифікації під час початкового налаштування. Відомості про вбудований Plugin з автоматичним виявленням див. у розділах [SGLang](/uk/providers/sglang) або [vLLM](/uk/providers/vllm).
</Note>

## Початок роботи

<Steps>
  <Step title="Запустіть inferrs із моделлю">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="Перевірте доступність сервера">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="Додайте запис провайдера OpenClaw">
    Додайте явний запис провайдера та спрямуйте на нього модель за замовчуванням. Див. приклад конфігурації нижче.
  </Step>
</Steps>

## Повний приклад конфігурації

Gemma 4 на локальному сервері `inferrs`:

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
      models: {
        "inferrs/google/gemma-4-E2B-it": {
          alias: "Gemma 4 (inferrs)",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

## Запуск на вимогу

OpenClaw може самостійно запускати `inferrs`, лише коли вибрано модель `inferrs/...`. Додайте `localService` до того самого запису провайдера:

```json5
{
  models: {
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

`command` має містити абсолютний шлях. Виконайте `which inferrs` на хості Gateway і використайте отриманий шлях. Повний опис полів: [Служби локальних моделей](/uk/gateway/local-model-services).

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Чому requiresStringContent має значення">
    Деякі маршрути Chat Completions у `inferrs` приймають у `messages[].content` лише рядки, а не структуровані масиви частин вмісту.

    <Warning>
    Якщо виконання OpenClaw завершується помилкою:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    установіть `compat.requiresStringContent: true` у записі моделі. Тоді OpenClaw перетворюватиме частини суто текстового вмісту на звичайні рядки перед надсиланням запиту.
    </Warning>

  </Accordion>

  <Accordion title="Застереження щодо Gemma та схеми інструментів">
    Деякі комбінації `inferrs` і Gemma приймають невеликі прямі запити `/v1/chat/completions`, але не можуть виконати повні цикли середовища виконання агента OpenClaw. Спочатку спробуйте вимкнути поверхню схеми інструментів:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Це зменшує навантаження запиту на суворіші локальні бекенди. Якщо малі прямі запити й далі працюють, але звичайні цикли агента OpenClaw продовжують спричиняти аварійне завершення всередині `inferrs`, вважайте це обмеженням моделі або сервера на стороні постачальника, а не проблемою транспорту OpenClaw.

  </Accordion>

  <Accordion title="Ручна базова перевірка">
    Після налаштування перевірте обидва рівні:

    ```bash
    curl http://127.0.0.1:8080/v1/chat/completions \
      -H 'content-type: application/json' \
      -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'
    ```

    ```bash
    openclaw infer model run \
      --model inferrs/google/gemma-4-E2B-it \
      --prompt "What is 2 + 2? Reply with one short sentence." \
      --json
    ```

    Якщо перша команда працює, а друга завершується помилкою, див. розділ «Усунення несправностей» нижче.

  </Accordion>

  <Accordion title="Поведінка в режимі проксі">
    Оскільки `inferrs` використовує універсальний адаптер `openai-completions` (а не `openai-responses`), формування запитів, властиве лише нативному OpenAI, ніколи не застосовується: не надсилаються ані `service_tier`, ані `store` Responses, ані підказки кешу запитів, ані корисне навантаження сумісності міркувань OpenAI.
  </Accordion>
</AccordionGroup>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Помилка curl /v1/models">
    `inferrs` не запущено, він недоступний або не прив’язаний до налаштованих вами хоста чи порту. Переконайтеся, що сервер запущено й він прослуховує цю адресу.
  </Accordion>

  <Accordion title="messages[].content очікує рядок">
    Установіть `compat.requiresStringContent: true` у записі моделі (див. вище).
  </Accordion>

  <Accordion title="Прямі виклики /v1/chat/completions успішні, але openclaw infer model run завершується помилкою">
    Установіть `compat.supportsTools: false`, щоб вимкнути поверхню схеми інструментів (див. застереження щодо Gemma вище).
  </Accordion>

  <Accordion title="inferrs усе ще аварійно завершується під час більших циклів агента">
    Якщо помилки схеми зникли, але `inferrs` усе ще аварійно завершується під час більших циклів агента, вважайте це обмеженням `inferrs` або моделі на стороні постачальника. Зменште навантаження запиту або змініть бекенд чи модель.
  </Accordion>
</AccordionGroup>

<Tip>
Загальну довідку див. у розділах [Усунення несправностей](/uk/help/troubleshooting) і [Поширені запитання](/uk/help/faq).
</Tip>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Локальні моделі" href="/uk/gateway/local-models" icon="server">
    Запуск OpenClaw із локальними серверами моделей.
  </Card>
  <Card title="Служби локальних моделей" href="/uk/gateway/local-model-services" icon="play">
    Запуск локальних серверів моделей на вимогу для налаштованих провайдерів.
  </Card>
  <Card title="Усунення несправностей Gateway" href="/uk/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Діагностика локальних сумісних з OpenAI бекендів, які проходять перевірки, але не можуть виконувати цикли агента.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх провайдерів, посилань на моделі та поведінки резервного перемикання.
  </Card>
</CardGroup>

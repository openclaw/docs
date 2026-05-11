---
read_when:
    - Ви хочете запустити OpenClaw для роботи з локальним сервером inferrs
    - Ви обслуговуєте Gemma або іншу модель через inferrs
    - Вам потрібні точні прапорці сумісності OpenClaw для inferrs
summary: Запуск OpenClaw через inferrs (локальний сервер, сумісний з OpenAI)
title: Виводить
x-i18n:
    generated_at: "2026-05-11T20:54:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8352da589baaa3a193bb3a56d12ee1a50630346dda186898346e805844d22aa1
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) може обслуговувати локальні моделі за OpenAI-сумісним API `/v1`. OpenClaw працює з `inferrs` через загальний шлях `openai-completions`.

| Властивість       | Значення                                                           |
| ----------------- | ------------------------------------------------------------------ |
| ID провайдера     | `inferrs` (користувацький; налаштовується в `models.providers.inferrs`) |
| Plugin            | немає — `inferrs` не є вбудованим Plugin провайдера OpenClaw       |
| Змінна env для автентифікації | Необов’язкова. Будь-яке значення працює, якщо ваш сервер inferrs не має автентифікації |
| API               | OpenAI-сумісний (`openai-completions`)                             |
| Пропонована базова URL-адреса | `http://127.0.0.1:8080/v1` (або там, де працює ваш сервер inferrs) |

<Note>
  `inferrs` наразі найкраще розглядати як користувацький самостійно розміщений OpenAI-сумісний бекенд, а не як окремий Plugin провайдера OpenClaw. Ви налаштовуєте його через `models.providers.inferrs`, а не через прапорець вибору під час онбордингу. Якщо вам потрібен справжній вбудований Plugin з автовиявленням, див. [SGLang](/uk/providers/sglang) або [vLLM](/uk/providers/vllm).
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
  <Step title="Перевірте, що сервер доступний">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="Додайте запис провайдера OpenClaw">
    Додайте явний запис провайдера та спрямуйте на нього вашу модель за замовчуванням. Повний приклад конфігурації наведено нижче.
  </Step>
</Steps>

## Повний приклад конфігурації

У цьому прикладі використовується Gemma 4 на локальному сервері `inferrs`.

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

Inferrs також може запускатися OpenClaw лише тоді, коли вибрано модель `inferrs/...`.
Додайте `localService` до того самого запису провайдера:

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

`command` має бути абсолютним. Використайте `which inferrs` на хості Gateway і вкажіть цей
шлях у конфігурації. Повний довідник полів див. у
[Служби локальних моделей](/uk/gateway/local-model-services).

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Чому requiresStringContent важливий">
    Деякі маршрути Chat Completions у `inferrs` приймають лише рядковий
    `messages[].content`, а не структуровані масиви частин вмісту.

    <Warning>
    Якщо запуски OpenClaw завершуються помилкою на кшталт:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    задайте `compat.requiresStringContent: true` у записі вашої моделі.
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    OpenClaw перетворить частини суто текстового вмісту на прості рядки перед надсиланням
    запиту.

  </Accordion>

  <Accordion title="Застереження щодо Gemma і схем інструментів">
    Деякі поточні комбінації `inferrs` + Gemma приймають невеликі прямі
    запити `/v1/chat/completions`, але все одно дають збій на повних ходах
    agent-runtime OpenClaw.

    Якщо це трапляється, спершу спробуйте таке:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Це вимикає поверхню схем інструментів OpenClaw для моделі й може зменшити навантаження промпта
    на суворіші локальні бекенди.

    Якщо крихітні прямі запити все ще працюють, але звичайні ходи агента OpenClaw продовжують
    аварійно завершуватися всередині `inferrs`, решта проблеми зазвичай пов’язана з поведінкою
    upstream-моделі або сервера, а не з транспортним шаром OpenClaw.

  </Accordion>

  <Accordion title="Ручний smoke-тест">
    Після налаштування перевірте обидва шари:

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

    Якщо перша команда працює, а друга завершується помилкою, перегляньте розділ усунення несправностей нижче.

  </Accordion>

  <Accordion title="Поведінка у стилі проксі">
    `inferrs` розглядається як OpenAI-сумісний бекенд `/v1` у стилі проксі, а не як
    нативна кінцева точка OpenAI.

    - Формування запитів, призначене лише для нативного OpenAI, тут не застосовується
    - Немає `service_tier`, немає Responses `store`, немає підказок prompt-cache і немає
      формування payload для сумісності reasoning OpenAI
    - Приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`)
      не додаються до користувацьких базових URL-адрес `inferrs`

  </Accordion>
</AccordionGroup>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="curl /v1/models завершується помилкою">
    `inferrs` не запущено, він недоступний або не прив’язаний до очікуваного
    хоста/порту. Переконайтеся, що сервер запущено й він прослуховує адресу, яку ви
    налаштували.
  </Accordion>

  <Accordion title="messages[].content очікує рядок">
    Задайте `compat.requiresStringContent: true` у записі моделі. Докладніше див.
    розділ `requiresStringContent` вище.
  </Accordion>

  <Accordion title="Прямі виклики /v1/chat/completions проходять, але openclaw infer model run завершується помилкою">
    Спробуйте задати `compat.supportsTools: false`, щоб вимкнути поверхню схем інструментів.
    Див. застереження щодо схем інструментів Gemma вище.
  </Accordion>

  <Accordion title="inferrs все ще аварійно завершується на більших ходах агента">
    Якщо OpenClaw більше не отримує помилок схеми, але `inferrs` усе ще аварійно завершується на більших
    ходах агента, розглядайте це як обмеження upstream `inferrs` або моделі. Зменште
    навантаження промпта або перейдіть на інший локальний бекенд чи модель.
  </Accordion>
</AccordionGroup>

<Tip>
Загальну довідку див. у [Усунення несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Tip>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Локальні моделі" href="/uk/gateway/local-models" icon="server">
    Запуск OpenClaw із локальними серверами моделей.
  </Card>
  <Card title="Служби локальних моделей" href="/uk/gateway/local-model-services" icon="play">
    Запуск локальних серверів моделей на вимогу для налаштованих провайдерів.
  </Card>
  <Card title="Усунення несправностей Gateway" href="/uk/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Налагодження локальних OpenAI-сумісних бекендів, які проходять перевірки, але дають збій під час запусків агента.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх провайдерів, посилань на моделі та поведінки failover.
  </Card>
</CardGroup>

---
read_when:
    - Ви хочете запустити OpenClaw для роботи з локальним сервером inferrs
    - Ви обслуговуєте Gemma або іншу модель через inferrs
    - Вам потрібні точні прапорці сумісності OpenClaw для inferrs
summary: Запуск OpenClaw через inferrs (локальний сервер, сумісний з OpenAI)
title: Робить висновки
x-i18n:
    generated_at: "2026-05-06T00:38:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 216783689527229835acf4f0fb6d2981d1915bd5df28e631b5384c4cbb9ee158
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) може обслуговувати локальні моделі за OpenAI-сумісним API `/v1`. OpenClaw працює з `inferrs` через загальний шлях `openai-completions`.

| Властивість             | Значення                                                          |
| ----------------------- | ----------------------------------------------------------------- |
| Ідентифікатор провайдера | `inferrs` (власний; налаштовується в `models.providers.inferrs`)  |
| Plugin                  | немає — `inferrs` не є вбудованим Plugin провайдера OpenClaw      |
| Змінна середовища автентифікації | Необов’язково. Підійде будь-яке значення, якщо ваш сервер inferrs не має автентифікації |
| API                     | OpenAI-сумісний (`openai-completions`)                            |
| Пропонований базовий URL | `http://127.0.0.1:8080/v1` (або там, де працює ваш сервер inferrs) |

<Note>
  `inferrs` наразі найкраще розглядати як власний самостійно розгорнутий OpenAI-сумісний бекенд, а не як окремий Plugin провайдера OpenClaw. Його налаштовують через `models.providers.inferrs`, а не через прапорець вибору під час онбордингу. Якщо вам потрібен справжній вбудований Plugin з автоматичним виявленням, див. [SGLang](/uk/providers/sglang) або [vLLM](/uk/providers/vllm).
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
    Додайте явний запис провайдера й спрямуйте на нього свою типову модель. Повний приклад конфігурації наведено нижче.
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

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Чому requiresStringContent має значення">
    Деякі маршрути Chat Completions у `inferrs` приймають лише рядковий
    `messages[].content`, а не структуровані масиви частин вмісту.

    <Warning>
    Якщо запуски OpenClaw завершуються помилкою на кшталт:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    установіть `compat.requiresStringContent: true` у записі моделі.
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    OpenClaw перетворить частини з чистим текстовим вмістом на звичайні рядки перед надсиланням
    запиту.

  </Accordion>

  <Accordion title="Застереження щодо Gemma та схеми інструментів">
    Деякі поточні комбінації `inferrs` + Gemma приймають невеликі прямі
    запити `/v1/chat/completions`, але все одно дають збій на повних ходах
    середовища виконання агента OpenClaw.

    Якщо це трапляється, спершу спробуйте таке:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Це вимикає поверхню схеми інструментів OpenClaw для моделі й може зменшити навантаження промпта
    на суворіші локальні бекенди.

    Якщо дуже малі прямі запити все ще працюють, але звичайні ходи агента OpenClaw і далі
    аварійно завершуються всередині `inferrs`, решта проблеми зазвичай пов’язана з поведінкою
    upstream-моделі або сервера, а не з транспортним шаром OpenClaw.

  </Accordion>

  <Accordion title="Ручний smoke-тест">
    Після налаштування протестуйте обидва шари:

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

  <Accordion title="Поведінка в стилі проксі">
    `inferrs` розглядається як OpenAI-сумісний бекенд `/v1` у стилі проксі, а не як
    нативна кінцева точка OpenAI.

    - Формування запитів, призначене лише для нативного OpenAI, тут не застосовується
    - Немає `service_tier`, Responses `store`, підказок prompt-cache і
      формування payload для сумісності з reasoning OpenAI
    - Приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`)
      не додаються до власних базових URL `inferrs`

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
    Установіть `compat.requiresStringContent: true` у записі моделі. Докладніше див.
    у розділі `requiresStringContent` вище.
  </Accordion>

  <Accordion title="Прямі виклики /v1/chat/completions проходять, але openclaw infer model run завершується помилкою">
    Спробуйте встановити `compat.supportsTools: false`, щоб вимкнути поверхню схеми інструментів.
    Див. застереження щодо схеми інструментів Gemma вище.
  </Accordion>

  <Accordion title="inferrs усе ще аварійно завершується на більших ходах агента">
    Якщо OpenClaw більше не отримує помилки схеми, але `inferrs` усе ще аварійно завершується на більших
    ходах агента, розглядайте це як обмеження upstream-`inferrs` або моделі. Зменште
    навантаження промпта або перейдіть на інший локальний бекенд чи модель.
  </Accordion>
</AccordionGroup>

<Tip>
Загальну довідку див. у [Усуненні несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Tip>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Локальні моделі" href="/uk/gateway/local-models" icon="server">
    Запуск OpenClaw з локальними серверами моделей.
  </Card>
  <Card title="Усунення несправностей Gateway" href="/uk/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Налагодження локальних OpenAI-сумісних бекендів, які проходять проби, але дають збій під час запусків агента.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх провайдерів, посилань на моделі та поведінки failover.
  </Card>
</CardGroup>

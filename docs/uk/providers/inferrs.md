---
read_when:
    - Ви хочете запускати OpenClaw проти локального сервера inferrs
    - Ви обслуговуєте Gemma або іншу модель через inferrs
    - Вам потрібні точні прапорці сумісності OpenClaw для inferrs
summary: Запуск OpenClaw через inferrs (локальний сервер, сумісний з OpenAI)
title: inferrs
x-i18n:
    generated_at: "2026-04-23T21:06:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c0926be4b599479595dd322eb0b6de02fee4b3ff07a7360d09e9f2527df9d02
    source_path: providers/inferrs.md
    workflow: 15
---

[inferrs](https://github.com/ericcurtin/inferrs) може обслуговувати локальні моделі через
OpenAI-сумісний API `/v1`. OpenClaw працює з `inferrs` через загальний шлях
`openai-completions`.

Наразі `inferrs` найкраще розглядати як кастомний self-hosted
backend, сумісний з OpenAI, а не як окремий Plugin provider-а OpenClaw.

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
  <Step title="Додайте запис provider-а OpenClaw">
    Додайте явний запис provider-а і спрямуйте на нього свою типову модель. Повний приклад config див. нижче.
  </Step>
</Steps>

## Повний приклад config

Цей приклад використовує Gemma 4 на локальному сервері `inferrs`.

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
  <Accordion title="Чому важливий requiresStringContent">
    Деякі маршрути Chat Completions в `inferrs` приймають лише рядковий
    `messages[].content`, а не структуровані масиви content-part.

    <Warning>
    Якщо запуски OpenClaw завершуються помилкою на кшталт:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    задайте `compat.requiresStringContent: true` у записі моделі.
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    OpenClaw згорне чисто текстові content-part у звичайні рядки перед надсиланням
    запиту.

  </Accordion>

  <Accordion title="Застереження щодо Gemma і tool schema">
    Деякі поточні комбінації `inferrs` + Gemma приймають малі прямі
    запити `/v1/chat/completions`, але все одно падають на повних ходах
    agent-runtime OpenClaw.

    Якщо це трапляється, спочатку спробуйте таке:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Це вимикає поверхню tool schema OpenClaw для моделі й може зменшити тиск на prompt
    у суворіших локальних backend-ах.

    Якщо крихітні прямі запити все ще працюють, але звичайні ходи агента OpenClaw
    продовжують аварійно завершуватися всередині `inferrs`, залишкова проблема зазвичай
    пов’язана з поведінкою upstream-моделі/сервера, а не транспортного шару OpenClaw.

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

    Якщо перша команда працює, а друга — ні, перевірте розділ усунення несправностей нижче.

  </Accordion>

  <Accordion title="Поведінка у стилі proxy">
    `inferrs` трактується як OpenAI-сумісний backend `/v1` у стилі proxy, а не як
    нативний endpoint OpenAI.

    - Тут не застосовується формування запитів лише для нативного OpenAI
    - Немає `service_tier`, немає Responses `store`, немає підказок prompt-cache і немає
      формування payload для reasoning-compat OpenAI
    - Приховані заголовки attribution OpenClaw (`originator`, `version`, `User-Agent`)
      не впроваджуються для кастомних base URL `inferrs`

  </Accordion>
</AccordionGroup>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Не працює curl /v1/models">
    `inferrs` не запущено, він недоступний або не прив’язаний до очікуваного
    host/port. Переконайтеся, що сервер запущено й він слухає адресу, яку ви
    налаштували.
  </Accordion>

  <Accordion title="messages[].content expected a string">
    Задайте `compat.requiresStringContent: true` у записі моделі. Див.
    розділ `requiresStringContent` вище для деталей.
  </Accordion>

  <Accordion title="Прямі виклики /v1/chat/completions проходять, але openclaw infer model run не працює">
    Спробуйте задати `compat.supportsTools: false`, щоб вимкнути поверхню tool schema.
    Див. застереження про Gemma і tool schema вище.
  </Accordion>

  <Accordion title="inferrs усе ще падає на більших ходах агента">
    Якщо OpenClaw більше не отримує schema-помилки, але `inferrs` усе ще падає на більших
    ходах агента, вважайте це обмеженням upstream `inferrs` або моделі. Зменште
    тиск на prompt або перейдіть на інший локальний backend чи модель.
  </Accordion>
</AccordionGroup>

<Tip>
Для загальної допомоги див. [Усунення несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Tip>

## Див. також

<CardGroup cols={2}>
  <Card title="Локальні моделі" href="/uk/gateway/local-models" icon="server">
    Запуск OpenClaw проти локальних серверів моделей.
  </Card>
  <Card title="Усунення несправностей Gateway" href="/uk/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Налагодження локальних OpenAI-сумісних backend-ів, які проходять probe, але не працюють у запусках агента.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх provider-ів, посилань на моделі та поведінки failover.
  </Card>
</CardGroup>

---
read_when:
    - Ви хочете запускати OpenClaw із локальним сервером inferrs
    - Ви обслуговуєте Gemma або іншу модель через inferrs
    - Вам потрібні точні прапорці сумісності OpenClaw для inferrs
summary: Запускайте OpenClaw через inferrs (локальний сервер, сумісний з OpenAI)
title: inferrs
x-i18n:
    generated_at: "2026-04-08T14:17:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03b9d5a9935c75fd369068bacb7807a5308cd0bd74303b664227fb664c3a2098
    source_path: providers/inferrs.md
    workflow: 15
---

# inferrs

[inferrs](https://github.com/ericcurtin/inferrs) може обслуговувати локальні моделі через
API `/v1`, сумісний з OpenAI. OpenClaw працює з `inferrs` через загальний
шлях `openai-completions`.

Наразі `inferrs` найкраще розглядати як спеціальний самостійно розгорнутий
бекенд, сумісний з OpenAI, а не як окремий plugin постачальника OpenClaw.

## Швидкий старт

1. Запустіть `inferrs` із моделлю.

Приклад:

```bash
inferrs serve google/gemma-4-E2B-it \
  --host 127.0.0.1 \
  --port 8080 \
  --device metal
```

2. Переконайтеся, що сервер доступний.

```bash
curl http://127.0.0.1:8080/health
curl http://127.0.0.1:8080/v1/models
```

3. Додайте явний запис постачальника OpenClaw і вкажіть на нього свою типову модель.

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

## Чому `requiresStringContent` має значення

Деякі маршрути Chat Completions в `inferrs` приймають лише рядковий
`messages[].content`, а не структуровані масиви частин вмісту.

Якщо запуски OpenClaw завершуються помилкою на кшталт:

```text
messages[1].content: invalid type: sequence, expected a string
```

установіть:

```json5
compat: {
  requiresStringContent: true
}
```

OpenClaw перетворить частини вмісту, що містять лише текст, на звичайні рядки перед надсиланням
запиту.

## Gemma і застереження щодо схеми інструментів

Деякі поточні комбінації `inferrs` + Gemma приймають невеликі прямі
запити до `/v1/chat/completions`, але все одно не працюють на повних ходах
середовища агента OpenClaw.

Якщо це трапляється, спочатку спробуйте таке:

```json5
compat: {
  requiresStringContent: true,
  supportsTools: false
}
```

Це вимикає поверхню схеми інструментів OpenClaw для моделі та може зменшити навантаження від prompt
на суворіші локальні бекенди.

Якщо маленькі прямі запити все ще працюють, але звичайні ходи агента OpenClaw
продовжують аварійно завершуватися всередині `inferrs`, то решта проблеми зазвичай пов’язана
з поведінкою моделі/сервера на боці upstream, а не з транспортним шаром OpenClaw.

## Ручний smoke-тест

Після налаштування перевірте обидва шари:

```bash
curl http://127.0.0.1:8080/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'

openclaw infer model run \
  --model inferrs/google/gemma-4-E2B-it \
  --prompt "What is 2 + 2? Reply with one short sentence." \
  --json
```

Якщо перша команда працює, а друга — ні, скористайтеся наведеними нижче
примітками з усунення несправностей.

## Усунення несправностей

- `curl /v1/models` не працює: `inferrs` не запущено, він недоступний або не
  прив’язаний до очікуваного хоста/порту.
- `messages[].content ... expected a string`: установіть
  `compat.requiresStringContent: true`.
- Прямі маленькі виклики `/v1/chat/completions` проходять, але `openclaw infer model run`
  не працює: спробуйте `compat.supportsTools: false`.
- OpenClaw більше не отримує помилок схеми, але `inferrs` усе ще аварійно завершується на більших
  ходах агента: вважайте це обмеженням `inferrs` або моделі на боці upstream і зменште навантаження prompt або змініть локальний бекенд/модель.

## Поведінка в стилі проксі

`inferrs` розглядається як бекенд `/v1`, сумісний з OpenAI, у стилі проксі, а не як
рідна кінцева точка OpenAI.

- тут не застосовується формування запитів лише для рідного OpenAI
- немає `service_tier`, немає `store` для Responses, немає підказок кешу prompt і немає
  формування payload сумісності міркувань OpenAI
- приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`)
  не додаються для спеціальних базових URL `inferrs`

## Див. також

- [Локальні моделі](/uk/gateway/local-models)
- [Усунення несправностей Gateway](/uk/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail)
- [Постачальники моделей](/uk/concepts/model-providers)

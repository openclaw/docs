---
read_when:
    - Ви хочете використовувати моделі Mistral в OpenClaw
    - Вам потрібне транскрибування Voxtral у реальному часі для голосового дзвінка
    - Потрібні онбординг для API-ключа Mistral і посилання на моделі
summary: Використовуйте моделі Mistral і транскрибування Voxtral з OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-28T11:23:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fdba72a5a526bed78ef3a6ea633839634efca3f9d2e96b305315d534d115122
    source_path: providers/mistral.md
    workflow: 16
---

OpenClaw підтримує Mistral як для маршрутизації текстових/зображувальних моделей (`mistral/...`), так і для
транскрибування аудіо через Voxtral у розумінні медіа.
Mistral також можна використовувати для ембедингів пам'яті (`memorySearch.provider = "mistral"`).

- Постачальник: `mistral`
- Автентифікація: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Початок роботи

<Steps>
  <Step title="Отримайте свій API-ключ">
    Створіть API-ключ у [Mistral Console](https://console.mistral.ai/).
  </Step>
  <Step title="Запустіть онбординг">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Або передайте ключ напряму:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Налаштуйте модель за замовчуванням">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Перевірте, що модель доступна">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Вбудований каталог LLM

OpenClaw наразі постачається з цим вбудованим каталогом Mistral:

| Посилання на модель              | Ввід        | Контекст | Макс. вивід | Примітки                                                        |
| -------------------------------- | ----------- | -------- | ----------- | --------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | текст, зображення | 262,144 | 16,384     | Модель за замовчуванням                                        |
| `mistral/mistral-medium-2508`    | текст, зображення | 262,144 | 8,192      | Mistral Medium 3.1                                             |
| `mistral/mistral-small-latest`   | текст, зображення | 128,000 | 16,384     | Mistral Small 4; регульоване міркування через API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | текст, зображення | 128,000 | 32,768     | Pixtral                                                        |
| `mistral/codestral-latest`       | текст        | 256,000 | 4,096       | Програмування                                                  |
| `mistral/devstral-medium-latest` | текст        | 262,144 | 32,768      | Devstral 2                                                     |
| `mistral/magistral-small`        | текст        | 128,000 | 40,000      | З увімкненим міркуванням                                       |

## Транскрибування аудіо (Voxtral)

Використовуйте Voxtral для пакетного транскрибування аудіо через конвеєр
розуміння медіа.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

<Tip>
Шлях транскрибування медіа використовує `/v1/audio/transcriptions`. Аудіомодель за замовчуванням для Mistral — `voxtral-mini-latest`.
</Tip>

## Потокове STT для Voice Call

Вбудований Plugin `mistral` реєструє Voxtral Realtime як постачальника
потокового STT для Voice Call.

| Налаштування | Шлях конфігурації                                                   | За замовчуванням                       |
| ------------ | ------------------------------------------------------------------- | -------------------------------------- |
| API-ключ     | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Повертається до `MISTRAL_API_KEY`      |
| Модель       | `...mistral.model`                                                  | `voxtral-mini-transcribe-realtime-2602` |
| Кодування    | `...mistral.encoding`                                               | `pcm_mulaw`                            |
| Частота дискретизації | `...mistral.sampleRate`                                     | `8000`                                 |
| Цільова затримка | `...mistral.targetStreamingDelayMs`                              | `800`                                  |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "mistral",
            providers: {
              mistral: {
                apiKey: "${MISTRAL_API_KEY}",
                targetStreamingDelayMs: 800,
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
OpenClaw за замовчуванням налаштовує Mistral realtime STT на `pcm_mulaw` з частотою 8 кГц, щоб Voice Call
міг напряму пересилати медіакадри Twilio. Використовуйте `encoding: "pcm_s16le"` і
відповідний `sampleRate` лише якщо ваш вхідний потік уже є необробленим PCM.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Регульоване міркування (mistral-small-latest)">
    `mistral/mistral-small-latest` відповідає Mistral Small 4 і підтримує [регульоване міркування](https://docs.mistral.ai/capabilities/reasoning/adjustable) в API Chat Completions через `reasoning_effort` (`none` мінімізує додаткове обдумування у виводі; `high` показує повні траси міркування перед фінальною відповіддю).

    OpenClaw зіставляє рівень **thinking** сесії з API Mistral:

    | Рівень thinking в OpenClaw                        | `reasoning_effort` Mistral |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Інші моделі вбудованого каталогу Mistral не використовують цей параметр. Продовжуйте використовувати моделі `magistral-*`, коли вам потрібна нативна поведінка Mistral з пріоритетом міркування.
    </Note>

  </Accordion>

  <Accordion title="Ембединги пам'яті">
    Mistral може обслуговувати ембединги пам'яті через `/v1/embeddings` (модель за замовчуванням: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Автентифікація та базовий URL">
    - Автентифікація Mistral використовує `MISTRAL_API_KEY`.
    - Базовий URL постачальника за замовчуванням — `https://api.mistral.ai/v1`.
    - Модель онбордингу за замовчуванням — `mistral/mistral-large-latest`.
    - Z.AI використовує Bearer-автентифікацію з вашим API-ключем.

  </Accordion>
</AccordionGroup>

## Пов'язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки відмовостійкості.
  </Card>
  <Card title="Розуміння медіа" href="/uk/nodes/media-understanding" icon="microphone">
    Налаштування транскрибування аудіо та вибір постачальника.
  </Card>
</CardGroup>

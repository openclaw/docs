---
read_when:
    - Ви хочете використовувати моделі Mistral у OpenClaw
    - Вам потрібна транскрипція Voxtral у реальному часі для голосового виклику
    - Вам потрібні онбординг ключа API Mistral і посилання на моделі
summary: Використовуйте моделі Mistral і транскрипцію Voxtral з OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-05-06T00:38:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb55915526e292210df61b646e1bbcdb2da86a0e46ea4bd5afd63d244f8da71a
    source_path: providers/mistral.md
    workflow: 16
---

OpenClaw містить вбудований Plugin Mistral, який реєструє чотири контракти: чат-доповнення, розуміння медіа (пакетна транскрипція Voxtral), STT у реальному часі для голосових викликів (Voxtral Realtime) і embeddings пам’яті (`mistral-embed`).

| Властивість                | Значення                                    |
| -------------------------- | ------------------------------------------ |
| Ідентифікатор провайдера   | `mistral`                                  |
| Plugin                     | вбудований, `enabledByDefault: true`       |
| Змінна середовища автентифікації | `MISTRAL_API_KEY`                    |
| Прапорець онбордингу       | `--auth-choice mistral-api-key`            |
| Прямий прапорець CLI       | `--mistral-api-key <key>`                  |
| API                        | сумісний з OpenAI (`openai-completions`)   |
| Базова URL-адреса          | `https://api.mistral.ai/v1`                |
| Модель за замовчуванням    | `mistral/mistral-large-latest`             |
| Модель embedding           | `mistral-embed`                            |
| Пакетний Voxtral           | `voxtral-mini-latest` (аудіотранскрипція)  |
| Voxtral у реальному часі   | `voxtral-mini-transcribe-realtime-2602`    |

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
  <Step title="Установіть модель за замовчуванням">
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

OpenClaw наразі постачається з таким вбудованим каталогом Mistral:

| Посилання на модель              | Вхідні дані | Контекст | Максимальний вихід | Примітки                                                        |
| -------------------------------- | ----------- | -------- | ------------------ | --------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | текст, зображення | 262,144 | 16,384     | Модель за замовчуванням                                        |
| `mistral/mistral-medium-2508`    | текст, зображення | 262,144 | 8,192      | Mistral Medium 3.1                                             |
| `mistral/mistral-small-latest`   | текст, зображення | 128,000 | 16,384     | Mistral Small 4; регульоване reasoning через API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | текст, зображення | 128,000 | 32,768     | Pixtral                                                        |
| `mistral/codestral-latest`       | текст        | 256,000 | 4,096      | Програмування                                                  |
| `mistral/devstral-medium-latest` | текст        | 262,144 | 32,768     | Devstral 2                                                     |
| `mistral/magistral-small`        | текст        | 128,000 | 40,000     | З увімкненим reasoning                                         |

## Аудіотранскрипція (Voxtral)

Використовуйте Voxtral для пакетної аудіотранскрипції через конвеєр розуміння
медіа.

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
Шлях транскрипції медіа використовує `/v1/audio/transcriptions`. Аудіомодель за замовчуванням для Mistral — `voxtral-mini-latest`.
</Tip>

## Потокове STT для голосових викликів

Вбудований Plugin `mistral` реєструє Voxtral Realtime як провайдера
потокового STT для голосових викликів.

| Налаштування | Шлях конфігурації                                                   | За замовчуванням                       |
| ------------ | ------------------------------------------------------------------- | -------------------------------------- |
| API-ключ     | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Повертається до `MISTRAL_API_KEY`    |
| Модель       | `...mistral.model`                                                  | `voxtral-mini-transcribe-realtime-2602` |
| Кодування    | `...mistral.encoding`                                               | `pcm_mulaw`                            |
| Частота дискретизації | `...mistral.sampleRate`                                      | `8000`                                 |
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
OpenClaw за замовчуванням використовує для STT Mistral у реальному часі `pcm_mulaw` на 8 кГц, щоб голосові виклики
могли напряму пересилати медіакадри Twilio. Використовуйте `encoding: "pcm_s16le"` і
відповідний `sampleRate` лише якщо ваш upstream-потік уже є необробленим PCM.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Регульоване reasoning (mistral-small-latest)">
    `mistral/mistral-small-latest` відповідає Mistral Small 4 і підтримує [регульоване reasoning](https://docs.mistral.ai/capabilities/reasoning/adjustable) в API Chat Completions через `reasoning_effort` (`none` мінімізує додаткове мислення у вихідних даних; `high` показує повні трасування мислення перед фінальною відповіддю).

    OpenClaw зіставляє рівень **thinking** сесії з API Mistral:

    | Рівень thinking в OpenClaw                       | `reasoning_effort` Mistral |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Інші моделі вбудованого каталогу Mistral не використовують цей параметр. Продовжуйте використовувати моделі `magistral-*`, коли вам потрібна нативна поведінка Mistral з пріоритетом reasoning.
    </Note>

  </Accordion>

  <Accordion title="Embeddings пам’яті">
    Mistral може надавати embeddings пам’яті через `/v1/embeddings` (модель за замовчуванням: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Автентифікація та базова URL-адреса">
    - Автентифікація Mistral використовує `MISTRAL_API_KEY` (заголовок Bearer).
    - Базова URL-адреса провайдера за замовчуванням — `https://api.mistral.ai/v1`; вона приймає стандартну форму запиту chat-completions, сумісну з OpenAI.
    - Модель онбордингу за замовчуванням — `mistral/mistral-large-latest`.
    - Перевизначайте базову URL-адресу в `models.providers.mistral.baseUrl` лише тоді, коли Mistral явно публікує потрібний вам регіональний endpoint.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Розуміння медіа" href="/uk/nodes/media-understanding" icon="microphone">
    Налаштування аудіотранскрипції та вибір провайдера.
  </Card>
</CardGroup>

---
read_when:
    - Ви хочете використовувати моделі Mistral в OpenClaw
    - Ви хочете транскрипцію Voxtral у реальному часі для Voice Call
    - Вам потрібні онбординг API-ключа Mistral і посилання на моделі
summary: Використовуйте моделі Mistral і транскрипцію Voxtral з OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-23T02:13:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8aec3c47fee12588b28ea2b652b89f0ff136399d25ca47174d7cb6e7b5d5d97f
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw підтримує Mistral як для маршрутизації текстових/графічних моделей (`mistral/...`), так і для аудіотранскрипції через Voxtral у функції розуміння медіа.
Mistral також можна використовувати для ембедингів пам’яті (`memorySearch.provider = "mistral"`).

- Провайдер: `mistral`
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

    Або передайте ключ безпосередньо:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Встановіть модель за замовчуванням">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Переконайтеся, що модель доступна">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Вбудований каталог LLM

Наразі OpenClaw постачається з таким вбудованим каталогом Mistral:

| Посилання на модель              | Вхідні дані | Контекст | Макс. вивід | Примітки                                                         |
| -------------------------------- | ----------- | -------- | ----------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | текст, зображення | 262,144 | 16,384      | Модель за замовчуванням                                          |
| `mistral/mistral-medium-2508`    | текст, зображення | 262,144 | 8,192       | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | текст, зображення | 128,000 | 16,384      | Mistral Small 4; налаштовуване міркування через API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | текст, зображення | 128,000 | 32,768      | Pixtral                                                          |
| `mistral/codestral-latest`       | текст        | 256,000 | 4,096       | Програмування                                                    |
| `mistral/devstral-medium-latest` | текст        | 262,144 | 32,768      | Devstral 2                                                       |
| `mistral/magistral-small`        | текст        | 128,000 | 40,000      | З підтримкою міркування                                          |

## Аудіотранскрипція (Voxtral)

Використовуйте Voxtral для пакетної аудіотранскрипції через конвеєр
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
Шлях транскрипції медіа використовує `/v1/audio/transcriptions`. Моделлю аудіо за замовчуванням для Mistral є `voxtral-mini-latest`.
</Tip>

## Потоковий STT для Voice Call

Вбудований Plugin `mistral` реєструє Voxtral Realtime як провайдера
потокового STT для Voice Call.

| Параметр     | Шлях конфігурації                                                      | За замовчуванням                        |
| ------------ | ---------------------------------------------------------------------- | -------------------------------------- |
| API-ключ     | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Резервно використовує `MISTRAL_API_KEY` |
| Модель       | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| Кодування    | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| Частота дискретизації | `...mistral.sampleRate`                                        | `8000`                                  |
| Цільова затримка | `...mistral.targetStreamingDelayMs`                                | `800`                                   |

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
OpenClaw за замовчуванням використовує для потокового STT Mistral формат `pcm_mulaw` на 8 кГц, щоб Voice Call
міг напряму пересилати медіакадри Twilio. Використовуйте `encoding: "pcm_s16le"` і
відповідний `sampleRate`, лише якщо ваш вхідний потік уже є необробленим PCM.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Налаштовуване міркування (mistral-small-latest)">
    `mistral/mistral-small-latest` відповідає Mistral Small 4 і підтримує [налаштовуване міркування](https://docs.mistral.ai/capabilities/reasoning/adjustable) в API Chat Completions через `reasoning_effort` (`none` мінімізує додаткові роздуми у виводі; `high` показує повні сліди міркування перед фінальною відповіддю).

    OpenClaw зіставляє рівень **thinking** сеансу з API Mistral:

    | Рівень thinking в OpenClaw                     | Mistral `reasoning_effort` |
    | ---------------------------------------------- | -------------------------- |
    | **off** / **minimal**                          | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Інші моделі з вбудованого каталогу Mistral не використовують цей параметр. Продовжуйте використовувати моделі `magistral-*`, якщо вам потрібна нативна поведінка Mistral, орієнтована насамперед на міркування.
    </Note>

  </Accordion>

  <Accordion title="Ембединги пам’яті">
    Mistral може надавати ембединги пам’яті через `/v1/embeddings` (модель за замовчуванням: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Автентифікація та базовий URL">
    - Для автентифікації Mistral використовується `MISTRAL_API_KEY`.
    - Базовий URL провайдера за замовчуванням: `https://api.mistral.ai/v1`.
    - Модель за замовчуванням для онбордингу — `mistral/mistral-large-latest`.
    - Z.AI використовує Bearer-автентифікацію з вашим API-ключем.
  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Розуміння медіа" href="/tools/media-understanding" icon="microphone">
    Налаштування аудіотранскрипції та вибір провайдера.
  </Card>
</CardGroup>

---
read_when:
    - Ви хочете використовувати моделі Mistral в OpenClaw
    - Ви хочете використовувати транскрипцію Voxtral у реальному часі для Voice Call
    - Вам потрібні onboarding з API key Mistral і посилання на моделі
summary: Використання моделей Mistral і транскрипції Voxtral з OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-23T21:06:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63e1eb462f836f5ddc1afd0d01954080eee461230924368d77e2e57fef12caf1
    source_path: providers/mistral.md
    workflow: 15
---

OpenClaw підтримує Mistral як для маршрутизації текстових/візуальних моделей (`mistral/...`), так і для
аудіотранскрипції через Voxtral у media understanding.
Mistral також можна використовувати для embeddings пам’яті (`memorySearch.provider = "mistral"`).

- Провайдер: `mistral`
- Автентифікація: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Початок роботи

<Steps>
  <Step title="Отримайте свій API key">
    Створіть API key у [Mistral Console](https://console.mistral.ai/).
  </Step>
  <Step title="Запустіть onboarding">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Або передайте ключ безпосередньо:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Установіть типову модель">
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

Наразі OpenClaw постачається з таким вбудованим каталогом Mistral:

| Посилання на модель              | Вхід        | Контекст | Макс. вивід | Примітки                                                         |
| -------------------------------- | ----------- | -------- | ----------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | text, image | 262,144  | 16,384      | Типова модель                                                    |
| `mistral/mistral-medium-2508`    | text, image | 262,144  | 8,192       | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | text, image | 128,000  | 16,384      | Mistral Small 4; налаштовуване reasoning через API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | text, image | 128,000  | 32,768      | Pixtral                                                          |
| `mistral/codestral-latest`       | text        | 256,000  | 4,096       | Для кодування                                                    |
| `mistral/devstral-medium-latest` | text        | 262,144  | 32,768      | Devstral 2                                                       |
| `mistral/magistral-small`        | text        | 128,000  | 40,000      | З увімкненим reasoning                                           |

## Аудіотранскрипція (Voxtral)

Використовуйте Voxtral для пакетної аудіотранскрипції через конвеєр
media understanding.

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
Шлях медіатранскрипції використовує `/v1/audio/transcriptions`. Типова аудіомодель для Mistral — `voxtral-mini-latest`.
</Tip>

## Потокова STT для Voice Call

Вбудований Plugin `mistral` реєструє Voxtral Realtime як провайдера
потокової STT для Voice Call.

| Параметр      | Шлях конфігурації                                                     | Типове значення                         |
| ------------- | --------------------------------------------------------------------- | --------------------------------------- |
| API key       | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Використовує запасний варіант `MISTRAL_API_KEY` |
| Модель        | `...mistral.model`                                                    | `voxtral-mini-transcribe-realtime-2602` |
| Кодування     | `...mistral.encoding`                                                 | `pcm_mulaw`                             |
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
OpenClaw типово використовує для realtime STT Mistral `pcm_mulaw` на 8 кГц, щоб Voice Call
міг напряму пересилати медіакадри Twilio. Використовуйте `encoding: "pcm_s16le"` і
відповідний `sampleRate` лише тоді, коли ваш вхідний потік уже є сирим PCM.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Налаштовуване reasoning (mistral-small-latest)">
    `mistral/mistral-small-latest` відображається на Mistral Small 4 і підтримує [adjustable reasoning](https://docs.mistral.ai/capabilities/reasoning/adjustable) у Chat Completions API через `reasoning_effort` (`none` мінімізує додаткове thinking у виводі; `high` показує повні thinking traces перед фінальною відповіддю).

    OpenClaw відображає рівень **thinking** сесії на API Mistral:

    | Рівень thinking в OpenClaw                     | `reasoning_effort` у Mistral |
    | ---------------------------------------------- | ---------------------------- |
    | **off** / **minimal**                          | `none`                       |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`   |

    <Note>
    Інші вбудовані моделі каталогу Mistral не використовують цей параметр. І далі використовуйте моделі `magistral-*`, коли вам потрібна нативна поведінка Mistral із пріоритетом reasoning.
    </Note>

  </Accordion>

  <Accordion title="Embeddings пам’яті">
    Mistral може надавати embeddings пам’яті через `/v1/embeddings` (типова модель: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Автентифікація і base URL">
    - Автентифікація Mistral використовує `MISTRAL_API_KEY`.
    - Типова base URL провайдера: `https://api.mistral.ai/v1`.
    - Типова модель onboarding: `mistral/mistral-large-latest`.
    - Z.AI використовує Bearer auth з вашим API key.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки запасних варіантів.
  </Card>
  <Card title="Media understanding" href="/uk/nodes/media-understanding" icon="microphone">
    Налаштування аудіотранскрипції та вибір провайдера.
  </Card>
</CardGroup>

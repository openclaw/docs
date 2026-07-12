---
read_when:
    - Ви хочете використовувати моделі Mistral в OpenClaw
    - Вам потрібне транскрибування в реальному часі за допомогою Voxtral для голосових викликів
    - Вам потрібне налаштування ключа API Mistral і посилання на моделі
summary: Використання моделей Mistral і транскрибування Voxtral з OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-07-12T13:37:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58f27b9917d2e7144a64cad559de4fe26a5a1101703bbe21c04252717df801cd
    source_path: providers/mistral.md
    workflow: 16
---

Вбудований плагін `mistral` реєструє чотири контракти: завершення чату, розпізнавання медіа (пакетна транскрипція Voxtral), STT у реальному часі для голосових викликів (Voxtral Realtime) і векторні представлення пам’яті (`mistral-embed`).

| Властивість              | Значення                                         |
| ------------------------ | ------------------------------------------------ |
| Ідентифікатор провайдера | `mistral`                                        |
| Плагін                   | вбудований, увімкнений за замовчуванням          |
| Змінна середовища автентифікації | `MISTRAL_API_KEY`                        |
| Прапорець початкового налаштування | `--auth-choice mistral-api-key`          |
| Прямий прапорець CLI     | `--mistral-api-key <key>`                        |
| API                      | сумісний з OpenAI (`openai-completions`)         |
| Базова URL-адреса        | `https://api.mistral.ai/v1`                      |
| Модель за замовчуванням  | `mistral/mistral-large-latest`                   |
| Модель векторних представлень | `mistral-embed`                              |
| Пакетний режим Voxtral   | `voxtral-mini-latest` (транскрипція аудіо)       |
| Voxtral у реальному часі | `voxtral-mini-transcribe-realtime-2602`          |

## Початок роботи

<Steps>
  <Step title="Отримайте ключ API">
    Створіть ключ API в [консолі Mistral](https://console.mistral.ai/).
  </Step>
  <Step title="Запустіть початкове налаштування">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Або передайте ключ безпосередньо:

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
  <Step title="Перевірте доступність моделі">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Вбудований каталог LLM

| Посилання на модель              | Вхідні дані  | Контекст | Максимальний вивід | Примітки                                                     |
| -------------------------------- | ------------ | -------- | ------------------ | ------------------------------------------------------------ |
| `mistral/mistral-large-latest`   | текст, зображення | 262,144 | 16,384         | Модель за замовчуванням                                      |
| `mistral/mistral-medium-2508`    | текст, зображення | 262,144 | 8,192          | Mistral Medium 3.1                                           |
| `mistral/mistral-medium-3-5`     | текст, зображення | 262,144 | 8,192          | Mistral Medium 3.5; регульоване міркування                   |
| `mistral/mistral-small-latest`   | текст, зображення | 262,144 | 16,384         | Найновіша Mistral Small 4; регульований `reasoning_effort`   |
| `mistral/mistral-small-2603`     | текст, зображення | 262,144 | 16,384         | Зафіксована Mistral Small 4; регульований `reasoning_effort` |
| `mistral/pixtral-large-latest`   | текст, зображення | 128,000 | 32,768         | Pixtral                                                      |
| `mistral/codestral-latest`       | текст        | 256,000  | 4,096              | Програмування                                                |
| `mistral/devstral-medium-latest` | текст        | 262,144  | 32,768             | Devstral 2                                                   |
| `mistral/magistral-small`        | текст        | 128,000  | 40,000             | З підтримкою міркування                                      |

Перегляньте рядок вбудованого каталогу, перш ніж змінювати конфігурацію:

```bash
openclaw models list --all --provider mistral --plain
```

Виконайте базову перевірку моделі без запуску Gateway:

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Reply with exactly: mistral-ok" \
  --json
```

## Транскрипція аудіо (Voxtral)

Використовуйте Voxtral для пакетної транскрипції аудіо через конвеєр розпізнавання медіа:

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
Шлях транскрипції медіа використовує `/v1/audio/transcriptions`. Модель аудіо за замовчуванням для Mistral — `voxtral-mini-latest`.
</Tip>

## Потокове STT для голосових викликів

Вбудований плагін `mistral` реєструє Voxtral Realtime як провайдера потокового STT для голосових викликів.

| Налаштування    | Шлях конфігурації                                                   | Значення за замовчуванням                |
| --------------- | ------------------------------------------------------------------- | ---------------------------------------- |
| Ключ API        | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Використовує `MISTRAL_API_KEY` як резерв |
| Модель          | `...mistral.model`                                                  | `voxtral-mini-transcribe-realtime-2602`  |
| Кодування       | `...mistral.encoding`                                               | `pcm_mulaw`                              |
| Частота дискретизації | `...mistral.sampleRate`                                        | `8000`                                   |
| Цільова затримка | `...mistral.targetStreamingDelayMs`                                | `800`                                    |

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
За замовчуванням OpenClaw використовує для STT Mistral у реальному часі `pcm_mulaw` із частотою 8 кГц, щоб голосові виклики могли безпосередньо пересилати медіакадри Twilio. Використовуйте `encoding: "pcm_s16le"` і відповідне значення `sampleRate`, лише якщо ваш вхідний потік уже є необробленим PCM.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Регульоване міркування">
    `mistral/mistral-small-latest`, `mistral/mistral-small-2603` і `mistral/mistral-medium-3-5` підтримують [регульоване міркування](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable) в API завершень чату через `reasoning_effort` (`none` мінімізує додаткові міркування у виводі; `high` показує повні ланцюжки міркувань перед остаточною відповіддю).

    OpenClaw зіставляє рівень **міркування** сеансу з API Mistral:

    | Рівень міркування OpenClaw                                           | `reasoning_effort` Mistral |
    | -------------------------------------------------------------------- | -------------------------- |
    | **вимкнено** / **мінімальний**                                       | `none`                     |
    | **низький** / **середній** / **високий** / **дуже високий** / **адаптивний** / **максимальний** | `high` |

    <Warning>
    Не поєднуйте режим міркування Medium 3.5 із `temperature: 0`: за наявними повідомленнями, HTTP API Mistral відхиляє поєднання `reasoning_effort="high"` і `temperature: 0` із відповіддю 400. Не задавайте температуру або вимкніть міркування чи встановіть мінімальний рівень, щоб OpenClaw надсилав `reasoning_effort: "none"`, перш ніж задавати низьку температуру.
    </Warning>

    Приклад конфігурації міркування Medium 3.5 для конкретної моделі:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "mistral/mistral-medium-3-5" },
          models: {
            "mistral/mistral-medium-3-5": {
              params: { thinking: "high" },
            },
          },
        },
      },
    }
    ```

    <Note>
    Інші моделі з вбудованого каталогу Mistral не використовують цей параметр. Продовжуйте використовувати моделі `magistral-*`, якщо вам потрібна нативна поведінка Mistral із пріоритетом міркування.
    </Note>

  </Accordion>

  <Accordion title="Векторні представлення пам’яті">
    Mistral може надавати векторні представлення пам’яті через `/v1/embeddings` (модель за замовчуванням: `mistral-embed`):

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "mistral" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Автентифікація та базова URL-адреса">
    - Для автентифікації Mistral використовується `MISTRAL_API_KEY` (заголовок Bearer).
    - Базова URL-адреса провайдера за замовчуванням — `https://api.mistral.ai/v1`; вона приймає стандартну, сумісну з OpenAI структуру запиту завершень чату.
    - Модель за замовчуванням під час початкового налаштування — `mistral/mistral-large-latest`.
    - Перевизначайте базову URL-адресу в `models.providers.mistral.baseUrl`, лише якщо Mistral явно публікує потрібну вам регіональну кінцеву точку.

  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки перемикання після відмови.
  </Card>
  <Card title="Розпізнавання медіа" href="/uk/nodes/media-understanding" icon="microphone">
    Налаштування транскрипції аудіо та вибір провайдера.
  </Card>
</CardGroup>

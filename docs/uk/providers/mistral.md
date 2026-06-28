---
read_when:
    - Ви хочете використовувати моделі Mistral в OpenClaw
    - Вам потрібна транскрипція Voxtral у реальному часі для голосового виклику
    - Вам потрібні налаштування ключа API Mistral і посилання на моделі
summary: Використовуйте моделі Mistral і транскрибування Voxtral з OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-05-11T20:55:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94c4caa86d4a3eb873d8b6a1cc639edbad3dd7478f401e2ca53f704de095f829
    source_path: providers/mistral.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw містить вбудований плагін Mistral, який реєструє чотири контракти: chat completions, розуміння медіа (пакетна транскрипція Voxtral), realtime STT для Voice Call (Voxtral Realtime) і вбудовування пам’яті (`mistral-embed`).

| Властивість        | Значення                                    |
| ------------------ | ------------------------------------------- |
| ID провайдера      | `mistral`                                   |
| Plugin             | вбудований, `enabledByDefault: true`        |
| Змінна env для auth | `MISTRAL_API_KEY`                          |
| Прапорець onboarding | `--auth-choice mistral-api-key`           |
| Прямий прапорець CLI | `--mistral-api-key <key>`                 |
| API                | сумісний з OpenAI (`openai-completions`)    |
| Базовий URL        | `https://api.mistral.ai/v1`                 |
| Модель за замовчуванням | `mistral/mistral-large-latest`        |
| Модель embedding   | `mistral-embed`                             |
| Пакетний Voxtral   | `voxtral-mini-latest` (транскрипція аудіо) |
| Voxtral realtime   | `voxtral-mini-transcribe-realtime-2602`     |

## Початок роботи

<Steps>
  <Step title="Отримайте свій API-ключ">
    Створіть API-ключ у [Mistral Console](https://console.mistral.ai/).
  </Step>
  <Step title="Запустіть onboarding">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Або передайте ключ напряму:

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
  <Step title="Перевірте, що модель доступна">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Вбудований каталог LLM

[Mistral Medium 3.5](https://docs.mistral.ai/models/model-cards/mistral-medium-3-5-26-04)
є поточною змішаною моделлю Medium у вбудованому каталозі: 128B щільних ваг,
текстовий і графічний ввід, контекст 256K, виклики функцій, структурований вивід, програмування
та настроюване reasoning через Chat Completions API. Використовуйте
`mistral/mistral-medium-3-5`, коли потрібна новіша уніфікована
agentic/coding-модель Mistral замість стандартної `mistral/mistral-large-latest`.

OpenClaw наразі постачає цей вбудований каталог Mistral:

| Посилання на модель              | Ввід        | Контекст | Макс. вивід | Примітки                                                        |
| -------------------------------- | ----------- | -------- | ----------- | --------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | текст, зображення | 262,144 | 16,384 | Модель за замовчуванням                                        |
| `mistral/mistral-medium-2508`    | текст, зображення | 262,144 | 8,192  | Mistral Medium 3.1                                             |
| `mistral/mistral-medium-3-5`     | текст, зображення | 262,144 | 8,192  | Mistral Medium 3.5; настроюване reasoning                      |
| `mistral/mistral-small-latest`   | текст, зображення | 128,000 | 16,384 | Mistral Small 4; настроюване reasoning через API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | текст, зображення | 128,000 | 32,768 | Pixtral                                                        |
| `mistral/codestral-latest`       | текст       | 256,000 | 4,096       | Програмування                                                  |
| `mistral/devstral-medium-latest` | текст       | 262,144 | 32,768      | Devstral 2                                                     |
| `mistral/magistral-small`        | текст       | 128,000 | 40,000      | З увімкненим reasoning                                         |

Після onboarding виконайте smoke-test Medium 3.5 без запуску Gateway:

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Reply with exactly: mistral-ok" \
  --json
```

Щоб переглянути рядок вбудованого каталогу перед зміною конфігурації:

```bash
openclaw models list --all --provider mistral --plain
```

## Транскрипція аудіо (Voxtral)

Використовуйте Voxtral для пакетної транскрипції аудіо через pipeline
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
Шлях транскрипції медіа використовує `/v1/audio/transcriptions`. Стандартна аудіомодель для Mistral — `voxtral-mini-latest`.
</Tip>

## Потоковий STT для Voice Call

Вбудований плагін `mistral` реєструє Voxtral Realtime як провайдера
потокового STT для Voice Call.

| Налаштування | Шлях конфігурації                                                  | За замовчуванням                     |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| API-ключ     | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Повертається до `MISTRAL_API_KEY`       |
| Модель       | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| Кодування    | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| Частота дискретизації | `...mistral.sampleRate`                                       | `8000`                                  |
| Цільова затримка | `...mistral.targetStreamingDelayMs`                                 | `800`                                   |

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
OpenClaw за замовчуванням встановлює Mistral realtime STT на `pcm_mulaw` з 8 kHz, щоб Voice Call
міг напряму передавати медіакадри Twilio. Використовуйте `encoding: "pcm_s16le"` і
відповідний `sampleRate` лише якщо ваш upstream-потік уже є необробленим PCM.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Настроюване reasoning">
    `mistral/mistral-small-latest` (Mistral Small 4) і `mistral/mistral-medium-3-5` підтримують [настроюване reasoning](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable) у Chat Completions API через `reasoning_effort` (`none` мінімізує додаткове мислення у виводі; `high` показує повні трасування мислення перед фінальною відповіддю). Mistral рекомендує `reasoning_effort="high"` для agentic і code-сценаріїв Medium 3.5.

    OpenClaw зіставляє рівень **thinking** сесії з API Mistral:

    | Рівень thinking в OpenClaw                      | Mistral `reasoning_effort` |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Warning>
    Не поєднуйте режим reasoning Medium 3.5 із `temperature: 0`. HTTP API Mistral
    відхиляє `reasoning_effort="high"` плюс `temperature: 0` відповіддю 400.
    Залиште temperature невстановленою, щоб Mistral використовував стандартне значення, або дотримуйтеся
    [рекомендованих налаштувань Medium 3.5](https://huggingface.co/mistralai/Mistral-Medium-3.5-128B)
    і використовуйте `temperature: 0.7` для високого reasoning. Для детермінованих прямих
    відповідей вимкніть thinking або встановіть minimal, щоб OpenClaw надсилав
    `reasoning_effort: "none"` перед зниженням temperature.
    </Warning>

    Приклад конфігурації, scoped до моделі, для reasoning Medium 3.5:

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
    Інші моделі вбудованого каталогу Mistral не використовують цей параметр. Продовжуйте використовувати моделі `magistral-*`, коли потрібна нативна reasoning-first поведінка Mistral.
    </Note>

  </Accordion>

  <Accordion title="Вбудовування пам’яті">
    Mistral може обслуговувати вбудовування пам’яті через `/v1/embeddings` (модель за замовчуванням: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Auth і базовий URL">
    - Auth Mistral використовує `MISTRAL_API_KEY` (заголовок Bearer).
    - Базовий URL провайдера за замовчуванням — `https://api.mistral.ai/v1`, він приймає стандартну форму запиту chat-completions, сумісну з OpenAI.
    - Модель onboarding за замовчуванням — `mistral/mistral-large-latest`.
    - Перевизначайте базовий URL у `models.providers.mistral.baseUrl` лише тоді, коли Mistral явно публікує потрібний вам регіональний endpoint.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Розуміння медіа" href="/uk/nodes/media-understanding" icon="microphone">
    Налаштування транскрипції аудіо та вибір провайдера.
  </Card>
</CardGroup>

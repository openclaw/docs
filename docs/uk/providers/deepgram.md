---
read_when:
    - Вам потрібне перетворення мовлення на текст від Deepgram для аудіовкладень
    - Вам потрібна потокова транскрипція Deepgram для голосового дзвінка
    - Вам потрібен швидкий приклад конфігурації Deepgram
summary: Транскрипція Deepgram для вхідних голосових нотаток
title: Deepgram
x-i18n:
    generated_at: "2026-04-23T02:13:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddc55436ebae295db9bd979765fbccab3ba7f25a6f5354a4e7964d151faffa22
    source_path: providers/deepgram.md
    workflow: 15
---

# Deepgram (Транскрипція аудіо)

Deepgram — це API для перетворення мовлення на текст. В OpenClaw він використовується для транскрипції вхідних аудіо/голосових нотаток через `tools.media.audio` і для потокового STT у Voice Call через `plugins.entries.voice-call.config.streaming`.

Для пакетної транскрипції OpenClaw завантажує повний аудіофайл у Deepgram і вставляє транскрипт у конвеєр відповіді (`{{Transcript}}` + блок `[Audio]`). Для потокової обробки Voice Call OpenClaw пересилає живі кадри G.711 u-law через WebSocket-ендпойнт `listen` Deepgram і надсилає часткові або фінальні транскрипти в міру того, як їх повертає Deepgram.

| Деталь        | Значення                                                   |
| ------------- | ---------------------------------------------------------- |
| Вебсайт       | [deepgram.com](https://deepgram.com)                       |
| Документація  | [developers.deepgram.com](https://developers.deepgram.com) |
| Автентифікація | `DEEPGRAM_API_KEY`                                         |
| Модель за замовчуванням | `nova-3`                                          |

## Початок роботи

<Steps>
  <Step title="Установіть свій API-ключ">
    Додайте свій API-ключ Deepgram до середовища:

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="Увімкніть аудіопровайдер">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Надішліть голосову нотатку">
    Надішліть аудіоповідомлення через будь-який підключений канал. OpenClaw виконає його транскрипцію через Deepgram і вставить транскрипт у конвеєр відповіді.
  </Step>
</Steps>

## Параметри конфігурації

| Параметр         | Шлях                                                        | Опис                                  |
| ---------------- | ----------------------------------------------------------- | ------------------------------------- |
| `model`          | `tools.media.audio.models[].model`                          | Ідентифікатор моделі Deepgram (типово: `nova-3`) |
| `language`       | `tools.media.audio.models[].language`                       | Підказка мови (необов’язково)         |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | Увімкнути визначення мови (необов’язково) |
| `punctuate`      | `tools.media.audio.providerOptions.deepgram.punctuate`      | Увімкнути пунктуацію (необов’язково)  |
| `smart_format`   | `tools.media.audio.providerOptions.deepgram.smart_format`   | Увімкнути розумне форматування (необов’язково) |

<Tabs>
  <Tab title="Із підказкою мови">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="З параметрами Deepgram">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            providerOptions: {
              deepgram: {
                detect_language: true,
                punctuate: true,
                smart_format: true,
              },
            },
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Потоковий STT для Voice Call

Вбудований Plugin `deepgram` також реєструє провайдера транскрипції в реальному часі для Plugin Voice Call.

| Налаштування     | Шлях конфігурації                                                    | Типове значення                 |
| ---------------- | -------------------------------------------------------------------- | ------------------------------- |
| API-ключ         | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | Використовує `DEEPGRAM_API_KEY` |
| Модель           | `...deepgram.model`                                                  | `nova-3`                        |
| Мова             | `...deepgram.language`                                               | (не встановлено)                |
| Кодування        | `...deepgram.encoding`                                               | `mulaw`                         |
| Частота дискретизації | `...deepgram.sampleRate`                                        | `8000`                          |
| Визначення кінця фрази | `...deepgram.endpointingMs`                                     | `800`                           |
| Проміжні результати | `...deepgram.interimResults`                                      | `true`                          |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "deepgram",
            providers: {
              deepgram: {
                apiKey: "${DEEPGRAM_API_KEY}",
                model: "nova-3",
                endpointingMs: 800,
                language: "en-US",
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
Voice Call отримує телефонне аудіо у форматі 8 кГц G.711 u-law. Потоковий провайдер Deepgram типово використовує `encoding: "mulaw"` і `sampleRate: 8000`, тому медіакадри Twilio можна пересилати напряму.
</Note>

## Примітки

<AccordionGroup>
  <Accordion title="Автентифікація">
    Автентифікація відбувається за стандартним порядком автентифікації провайдера. `DEEPGRAM_API_KEY` — найпростіший варіант.
  </Accordion>
  <Accordion title="Проксі та власні ендпойнти">
    Перевизначайте ендпойнти або заголовки через `tools.media.audio.baseUrl` і
    `tools.media.audio.headers`, якщо використовуєте проксі.
  </Accordion>
  <Accordion title="Поведінка виводу">
    Вивід дотримується тих самих правил для аудіо, що й в інших провайдерів (обмеження розміру, таймаути, вставлення транскрипту).
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Медіаінструменти" href="/tools/media" icon="photo-film">
    Огляд конвеєра обробки аудіо, зображень і відео.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник із конфігурації, включно з налаштуваннями медіаінструментів.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та кроки з налагодження.
  </Card>
  <Card title="FAQ" href="/uk/help/faq" icon="circle-question">
    Поширені запитання про налаштування OpenClaw.
  </Card>
</CardGroup>

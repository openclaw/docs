---
read_when:
    - Вам потрібне перетворення мовлення на текст від Deepgram для аудіовкладень
    - Вам потрібна потокова транскрипція Deepgram для Voice Call
    - Вам потрібен швидкий приклад конфігурації Deepgram
summary: Транскрипція Deepgram для вхідних голосових повідомлень
title: Deepgram
x-i18n:
    generated_at: "2026-04-24T18:12:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d591aa24a5477fd9fe69b7a0dc44b204d28ea0c2f89e6dfef66f9ceb76da34d
    source_path: providers/deepgram.md
    workflow: 15
---

Deepgram — це API перетворення мовлення на текст. В OpenClaw він використовується для транскрипції вхідних
аудіо/голосових повідомлень через `tools.media.audio` і для потокового STT у Voice Call
через `plugins.entries.voice-call.config.streaming`.

Для пакетної транскрипції OpenClaw завантажує повний аудіофайл у Deepgram
і інжектує транскрипт у конвеєр відповіді (`{{Transcript}}` +
блок `[Audio]`). Для потокового Voice Call OpenClaw пересилає live кадри G.711
u-law через WebSocket-кінцеву точку Deepgram `listen` і надсилає часткові або
фінальні транскрипти в міру того, як Deepgram їх повертає.

| Деталь        | Значення                                                   |
| ------------- | ---------------------------------------------------------- |
| Вебсайт       | [deepgram.com](https://deepgram.com)                       |
| Документація  | [developers.deepgram.com](https://developers.deepgram.com) |
| Автентифікація | `DEEPGRAM_API_KEY`                                        |
| Типова модель | `nova-3`                                                   |

## Початок роботи

<Steps>
  <Step title="Установіть свій API-ключ">
    Додайте свій API-ключ Deepgram до середовища:

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="Увімкніть provider аудіо">
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
  <Step title="Надішліть голосове повідомлення">
    Надішліть аудіоповідомлення через будь-який підключений канал. OpenClaw транскрибує його
    через Deepgram і інжектує транскрипт у конвеєр відповіді.
  </Step>
</Steps>

## Параметри конфігурації

| Параметр         | Шлях                                                         | Опис                                  |
| ---------------- | ------------------------------------------------------------ | ------------------------------------- |
| `model`          | `tools.media.audio.models[].model`                           | id моделі Deepgram (типово: `nova-3`) |
| `language`       | `tools.media.audio.models[].language`                        | Підказка мови (необов’язково)         |
| `detect_language`| `tools.media.audio.providerOptions.deepgram.detect_language` | Увімкнути визначення мови (необов’язково) |
| `punctuate`      | `tools.media.audio.providerOptions.deepgram.punctuate`       | Увімкнути пунктуацію (необов’язково)  |
| `smart_format`   | `tools.media.audio.providerOptions.deepgram.smart_format`    | Увімкнути smart formatting (необов’язково) |

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

Вбудований Plugin `deepgram` також реєструє provider транскрипції в реальному часі
для Plugin Voice Call.

| Налаштування      | Шлях конфігурації                                                      | Типове значення                 |
| ----------------- | ---------------------------------------------------------------------- | ------------------------------- |
| API-ключ          | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | Резервно використовує `DEEPGRAM_API_KEY` |
| Модель            | `...deepgram.model`                                                    | `nova-3`                        |
| Мова              | `...deepgram.language`                                                 | (не задано)                     |
| Кодування         | `...deepgram.encoding`                                                 | `mulaw`                         |
| Частота дискретизації | `...deepgram.sampleRate`                                           | `8000`                          |
| Endpointing       | `...deepgram.endpointingMs`                                            | `800`                           |
| Проміжні результати | `...deepgram.interimResults`                                         | `true`                          |

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
Voice Call отримує телефонне аудіо у форматі 8 kHz G.711 u-law. Provider
потокової передачі Deepgram типово використовує `encoding: "mulaw"` і `sampleRate: 8000`, тож
медіакадри Twilio можна пересилати напряму.
</Note>

## Примітки

<AccordionGroup>
  <Accordion title="Автентифікація">
    Автентифікація дотримується стандартного порядку автентифікації provider. `DEEPGRAM_API_KEY` —
    найпростіший шлях.
  </Accordion>
  <Accordion title="Проксі та власні кінцеві точки">
    Перевизначайте кінцеві точки або заголовки через `tools.media.audio.baseUrl` і
    `tools.media.audio.headers`, якщо використовуєте проксі.
  </Accordion>
  <Accordion title="Поведінка виведення">
    Виведення дотримується тих самих правил для аудіо, що й в інших provider (обмеження розміру, тайм-аути,
    інжекція транскрипту).
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Media tools" href="/uk/tools/media-overview" icon="photo-film">
    Огляд конвеєра обробки аудіо, зображень і відео.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник конфігурації, включно з налаштуваннями media tools.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та кроки налагодження.
  </Card>
  <Card title="FAQ" href="/uk/help/faq" icon="circle-question">
    Поширені запитання про налаштування OpenClaw.
  </Card>
</CardGroup>

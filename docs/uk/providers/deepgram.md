---
read_when:
    - Ви хочете використовувати перетворення мовлення на текст від Deepgram для аудіовкладень
    - Вам потрібне потокове транскрибування Deepgram для голосових викликів
    - Вам потрібен короткий приклад конфігурації Deepgram
summary: Транскрибування вхідних голосових нотаток за допомогою Deepgram
title: Deepgram
x-i18n:
    generated_at: "2026-07-12T13:41:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b0f407829ba47344ad92c5fe63aacd0ce234909c439c96370e7bd900cadff8b
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram — це API перетворення мовлення на текст. OpenClaw використовує його для
транскрибування вхідних аудіо та голосових повідомлень через `tools.media.audio`,
а також для потокового перетворення мовлення на текст під час голосових викликів
через `plugins.entries.voice-call.config.streaming`.

Під час пакетного транскрибування повний аудіофайл завантажується до Deepgram,
а транскрипт додається до конвеєра відповіді (блок `{{Transcript}}` + `[Audio]`).
Потокове передавання голосових викликів пересилає кадри G.711 u-law у реальному
часі через кінцеву точку WebSocket `listen` Deepgram і видає проміжні та остаточні
транскрипти в міру їх повернення Deepgram.

| Відомості           | Значення                                                   |
| ------------------- | ---------------------------------------------------------- |
| Вебсайт             | [deepgram.com](https://deepgram.com)                       |
| Документація        | [developers.deepgram.com](https://developers.deepgram.com) |
| Автентифікація      | `DEEPGRAM_API_KEY`                                         |
| Модель за замовчуванням | `nova-3`                                               |

## Початок роботи

<Steps>
  <Step title="Установіть ключ API">
    ```bash
    DEEPGRAM_API_KEY=dg_...
    ```
  </Step>
  <Step title="Увімкніть постачальника аудіо">
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
    Надішліть аудіоповідомлення через будь-який підключений канал. OpenClaw
    транскрибує його за допомогою Deepgram і додає транскрипт до конвеєра відповіді.
  </Step>
</Steps>

## Параметри конфігурації

| Параметр   | Шлях                                  | Опис                                        |
| ---------- | ------------------------------------- | ------------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | Ідентифікатор моделі Deepgram (типово: `nova-3`) |
| `language` | `tools.media.audio.models[].language` | Підказка щодо мови (необов’язково)          |

`providerOptions.deepgram` об’єднує додаткові параметри запиту безпосередньо із
запитом Deepgram `/listen`, тому можна використовувати будь-яку назву параметра,
яку підтримує Deepgram (наприклад, `detect_language`, `punctuate`, `smart_format`):

<Tabs>
  <Tab title="З підказкою щодо мови">
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

## Потокове перетворення мовлення на текст для голосових викликів

Вбудований plugin `deepgram` також реєструє постачальника транскрибування в
реальному часі для plugin голосових викликів.

| Налаштування       | Шлях конфігурації                                                       | Значення за замовчуванням                    |
| ------------------ | ----------------------------------------------------------------------- | -------------------------------------------- |
| Ключ API           | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | Резервно використовує `DEEPGRAM_API_KEY`     |
| Модель             | `...deepgram.model`                                                     | `nova-3`                                     |
| Мова               | `...deepgram.language`                                                  | (не задано)                                  |
| Кодування          | `...deepgram.encoding`                                                  | `mulaw`                                      |
| Частота дискретизації | `...deepgram.sampleRate`                                             | `8000`                                       |
| Визначення кінця висловлювання | `...deepgram.endpointingMs`                                  | `800`                                        |
| Проміжні результати | `...deepgram.interimResults`                                           | `true`                                       |

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
Голосові виклики отримують телефонний аудіосигнал у форматі G.711 u-law із
частотою 8 кГц. Постачальник потокового передавання Deepgram типово використовує
`encoding: "mulaw"` і `sampleRate: 8000`, тому медіакадри Twilio можна
пересилати безпосередньо.
</Note>

## Примітки

<AccordionGroup>
  <Accordion title="Автентифікація">
    Автентифікація відбувається відповідно до стандартного порядку автентифікації
    постачальників. Використання `DEEPGRAM_API_KEY` — найпростіший спосіб.
  </Accordion>
  <Accordion title="Проксі та власні кінцеві точки">
    Під час використання проксі перевизначайте кінцеві точки або заголовки за
    допомогою `tools.media.audio.baseUrl` і `tools.media.audio.headers`.
  </Accordion>
  <Accordion title="Поведінка виведення">
    Виведення підпорядковується тим самим правилам обробки аудіо, що й для інших
    постачальників (обмеження розміру, тайм-аути, додавання транскрипту).
  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Медіаінструменти" href="/uk/tools/media-overview" icon="photo-film">
    Огляд конвеєра обробки аудіо, зображень і відео.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник із конфігурації, зокрема налаштувань медіаінструментів.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та кроки з налагодження.
  </Card>
  <Card title="Поширені запитання" href="/uk/help/faq" icon="circle-question">
    Поширені запитання щодо налаштування OpenClaw.
  </Card>
</CardGroup>

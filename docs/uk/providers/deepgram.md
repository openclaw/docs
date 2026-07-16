---
read_when:
    - Вам потрібне перетворення мовлення на текст від Deepgram для аудіовкладень
    - Вам потрібне потокове транскрибування Deepgram для голосових викликів
    - Вам потрібен короткий приклад конфігурації Deepgram
summary: Транскрибування вхідних голосових нотаток за допомогою Deepgram
title: Deepgram
x-i18n:
    generated_at: "2026-07-16T18:31:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 74652e089899423d117dae6267e7c9af09e52ec91ee15e3532fcb2d705f43099
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram — це API перетворення мовлення на текст. OpenClaw використовує його для транскрибування вхідних аудіо та голосових нотаток через `tools.media.audio`, а також для потокового STT голосових викликів через `plugins.entries.voice-call.config.streaming`.

Під час пакетного транскрибування повний аудіофайл завантажується до Deepgram, а транскрипт додається до конвеєра відповідей (блок `{{Transcript}}` + `[Audio]`). Потокова обробка голосових викликів передає наживо кадри G.711 u-law через кінцеву точку WebSocket `listen` Deepgram і видає проміжні та остаточні транскрипти в міру їх повернення Deepgram.

| Відомості     | Значення                                                   |
| ------------- | ---------------------------------------------------------- |
| Вебсайт       | [deepgram.com](https://deepgram.com)                       |
| Документація  | [developers.deepgram.com](https://developers.deepgram.com) |
| Автентифікація | `DEEPGRAM_API_KEY`                                         |
| Типова модель | `nova-3`                                         |

## Початок роботи

<Steps>
  <Step title="Задайте ключ API">
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
  <Step title="Надішліть голосову нотатку">
    Надішліть аудіоповідомлення через будь-який підключений канал. OpenClaw транскрибує його за допомогою Deepgram і додає транскрипт до конвеєра відповідей.
  </Step>
</Steps>

## Параметри конфігурації

| Параметр   | Шлях                                  | Опис                                  |
| ---------- | ------------------------------------- | ------------------------------------- |
| `model` | `tools.media.audio.models[].model`             | Ідентифікатор моделі Deepgram (типово: `nova-3`) |
| `language` | `tools.media.audio.models[].language`              | Підказка щодо мови (необов’язково)    |

`providerOptions.deepgram` безпосередньо додає додаткові параметри запиту до запиту Deepgram `/listen`, тому можна використовувати будь-які назви параметрів, які підтримує Deepgram (наприклад, `detect_language`, `punctuate`, `smart_format`):

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

## Потокове STT голосових викликів

Вбудований plugin `deepgram` також реєструє постачальника транскрибування в реальному часі для plugin голосових викликів.

| Налаштування       | Шлях конфігурації                                                      | Типове значення                              |
| ------------------ | ---------------------------------------------------------------------- | -------------------------------------------- |
| Ключ API           | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey`                                                     | Якщо не задано, використовується `DEEPGRAM_API_KEY` |
| Базова URL-адреса  | `...deepgram.baseUrl`                                                     | `DEEPGRAM_BASE_URL` або публічний API Deepgram |
| Модель             | `...deepgram.model`                                                     | `nova-3`                           |
| Мова               | `...deepgram.language`                                                     | (не задано)                                  |
| Кодування          | `...deepgram.encoding`                                                     | `mulaw`                           |
| Частота дискретизації | `...deepgram.sampleRate`                                                  | `8000`                           |
| Визначення завершення | `...deepgram.endpointingMs`                                                  | `800`                           |
| Проміжні результати | `...deepgram.interimResults`                                                    | `true`                           |

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

Для [власної кінцевої точки Deepgram](https://developers.deepgram.com/reference/custom-endpoints) задайте для `baseUrl` кореневу адресу кінцевої точки, включно з будь-яким базовим шляхом, але без `/listen`. Кінцеві точки реального часу приймають `http://`, `https://`, `ws://` та `wss://`. HTTP зіставляється з WS, HTTPS — із WSS, а явно вказані схеми WebSocket залишаються без змін. Неправильно сформовані URL-адреси та інші схеми спричиняють помилку під час налаштування сеансу.

<Note>
Voice Call отримує телефонний аудіосигнал у форматі G.711 u-law із частотою 8 кГц. Постачальник потокової обробки Deepgram типово використовує `encoding: "mulaw"` і `sampleRate: 8000`, тому медіакадри Twilio можна передавати безпосередньо.
</Note>

## Примітки

<AccordionGroup>
  <Accordion title="Автентифікація">
    Автентифікація виконується у стандартному порядку автентифікації постачальника. `DEEPGRAM_API_KEY` — найпростіший спосіб.
  </Accordion>
  <Accordion title="Проксі та власні кінцеві точки">
    Під час використання проксі перевизначте кінцеві точки або заголовки за допомогою `tools.media.audio.baseUrl` і `tools.media.audio.headers`.
  </Accordion>
  <Accordion title="Поведінка виведення">
    Виведення підпорядковується тим самим правилам обробки аудіо, що й для інших постачальників (обмеження розміру, час очікування, додавання транскрипту).
  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Медіаінструменти" href="/uk/tools/media-overview" icon="photo-film">
    Огляд конвеєра обробки аудіо, зображень і відео.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник із конфігурації, включно з налаштуваннями медіаінструментів.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та кроки діагностики.
  </Card>
  <Card title="Поширені запитання" href="/uk/help/faq" icon="circle-question">
    Поширені запитання щодо налаштування OpenClaw.
  </Card>
</CardGroup>

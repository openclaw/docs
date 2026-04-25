---
read_when:
    - Ви хочете синтез мовлення Inworld для вихідних відповідей
    - Вам потрібен вихід PCM telephony або OGG_OPUS голосових нотаток від Inworld
summary: Потокове перетворення тексту на мовлення Inworld для відповідей OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-04-25T21:40:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4c3908b6ab11fd7bd2e18e5c56d1fdc1ac2e52448538d31cc6c83c2c97917641
    source_path: providers/inworld.md
    workflow: 15
---

Inworld — це постачальник потокового перетворення тексту на мовлення (TTS). В OpenClaw він
синтезує аудіо вихідних відповідей (MP3 за замовчуванням, OGG_OPUS для голосових нотаток)
і PCM-аудіо для телефонних каналів, таких як Voice Call.

OpenClaw надсилає запит до потокового TTS-ендпойнта Inworld, об’єднує
повернені аудіофрагменти base64 в один буфер і передає результат
до стандартного конвеєра аудіовідповідей.

| Деталь        | Значення                                                    |
| ------------- | ----------------------------------------------------------- |
| Вебсайт       | [inworld.ai](https://inworld.ai)                            |
| Документація  | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)  |
| Автентифікація | `INWORLD_API_KEY` (HTTP Basic, облікові дані панелі керування у Base64) |
| Голос за замовчуванням | `Sarah`                                             |
| Модель за замовчуванням | `inworld-tts-1.5-max`                               |

## Початок роботи

<Steps>
  <Step title="Установіть свій API-ключ">
    Скопіюйте облікові дані з панелі керування Inworld (Workspace > API Keys)
    і встановіть їх як змінну середовища. Значення надсилається дослівно як облікові дані HTTP Basic,
    тому не кодуйте його в Base64 повторно і не перетворюйте на bearer-токен.

    ```
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="Виберіть Inworld у messages.tts">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "inworld",
          providers: {
            inworld: {
              voiceId: "Sarah",
              modelId: "inworld-tts-1.5-max",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Надішліть повідомлення">
    Надішліть відповідь через будь-який підключений канал. OpenClaw синтезує
    аудіо за допомогою Inworld і доставить його як MP3 (або OGG_OPUS, якщо канал
    очікує голосову нотатку).
  </Step>
</Steps>

## Параметри конфігурації

| Параметр      | Шлях                                         | Опис                                                              |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Облікові дані панелі керування у Base64. Використовує `INWORLD_API_KEY` як запасний варіант. |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Перевизначити базовий URL API Inworld (типово `https://api.inworld.ai`). |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | Ідентифікатор голосу (типово `Sarah`).                            |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | Ідентифікатор моделі TTS (типово `inworld-tts-1.5-max`).          |
| `temperature` | `messages.tts.providers.inworld.temperature` | Температура семплювання `0..2` (необов’язково).                   |

## Примітки

<AccordionGroup>
  <Accordion title="Автентифікація">
    Inworld використовує HTTP Basic-автентифікацію з єдиним рядком
    облікових даних, закодованим у Base64. Скопіюйте його дослівно з панелі керування Inworld. Постачальник надсилає
    його як `Authorization: Basic <apiKey>` без будь-якого додаткового кодування, тому
    не кодуйте його в Base64 самостійно й не передавайте токен у стилі bearer.
    Див. [примітки щодо TTS-автентифікації](/uk/tools/tts#inworld-primary) для такого самого застереження.
  </Accordion>
  <Accordion title="Моделі">
    Підтримувані ідентифікатори моделей: `inworld-tts-1.5-max` (типово),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Аудіовиходи">
    Відповіді типово використовують MP3. Коли ціль каналу — `voice-note`,
    OpenClaw запитує в Inworld формат `OGG_OPUS`, щоб аудіо відтворювалося як нативна
    голосова бульбашка. Телефонний синтез використовує необроблений `PCM` на 22050 Гц для подачі
    в телефонний міст.
  </Accordion>
  <Accordion title="Спеціальні ендпойнти">
    Перевизначте хост API за допомогою `messages.tts.providers.inworld.baseUrl`.
    Кінцеві скісні риски видаляються перед надсиланням запитів.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Перетворення тексту на мовлення" href="/uk/tools/tts" icon="waveform-lines">
    Огляд TTS, постачальники та конфігурація `messages.tts`.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник із конфігурації, включно з параметрами `messages.tts`.
  </Card>
  <Card title="Постачальники" href="/uk/providers" icon="grid">
    Усі вбудовані постачальники OpenClaw.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та кроки налагодження.
  </Card>
</CardGroup>

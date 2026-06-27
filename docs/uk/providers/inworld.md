---
read_when:
    - Вам потрібен синтез мовлення Inworld для вихідних відповідей
    - Вам потрібен PCM-телефонний звук або вихід голосової нотатки OGG_OPUS від Inworld
summary: Потокове перетворення тексту на мовлення Inworld для відповідей OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-06-27T18:11:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea65903945586516b51b239f0671b9e59dac92f302442f3cb629f66b68338cfb
    source_path: providers/inworld.md
    workflow: 16
---

Inworld — це провайдер потокового перетворення тексту на мовлення (TTS). В OpenClaw він
синтезує аудіо вихідних відповідей (MP3 за замовчуванням, OGG_OPUS для голосових нотаток)
і PCM-аудіо для телефонних каналів, таких як Голосовий виклик.

OpenClaw надсилає запити до потокової TTS-кінцевої точки Inworld, об’єднує
повернуті аудіофрагменти base64 в один буфер і передає результат у
стандартний конвеєр аудіовідповідей.

| Властивість                  | Значення                                                        |
| ---------------------------- | --------------------------------------------------------------- |
| Ідентифікатор провайдера     | `inworld`                                                       |
| Plugin                       | офіційний зовнішній пакет                                       |
| Контракт                     | `speechProviders` (лише TTS)                                    |
| Змінна середовища авторизації | `INWORLD_API_KEY` (HTTP Basic, облікові дані Base64 з панелі)   |
| Базова URL-адреса            | `https://api.inworld.ai`                                        |
| Голос за замовчуванням       | `Sarah`                                                         |
| Модель за замовчуванням      | `inworld-tts-1.5-max`                                           |
| Вихідний формат              | MP3 (за замовчуванням), OGG_OPUS (голосові нотатки), PCM 22050 Hz (телефонія) |
| Вебсайт                      | [inworld.ai](https://inworld.ai)                                |
| Документація                 | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## Установлення Plugin

Установіть офіційний Plugin, а потім перезапустіть Gateway:

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## Початок роботи

<Steps>
  <Step title="Установіть свій API-ключ">
    Скопіюйте облікові дані з панелі Inworld (Workspace > API Keys)
    і задайте їх як змінну середовища. Значення надсилається дослівно як
    облікові дані HTTP Basic, тому не кодуйте його в Base64 повторно й не
    перетворюйте на bearer-токен.

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
              speakerVoiceId: "Sarah",
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
    аудіо за допомогою Inworld і доставить його як MP3 (або OGG_OPUS, коли канал
    очікує голосову нотатку).
  </Step>
</Steps>

## Параметри конфігурації

| Параметр         | Шлях                                            | Опис                                                              |
| ---------------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`         | `messages.tts.providers.inworld.apiKey`         | Облікові дані Base64 з панелі. Використовує `INWORLD_API_KEY` як резервний варіант. |
| `baseUrl`        | `messages.tts.providers.inworld.baseUrl`        | Перевизначає базову URL-адресу API Inworld (за замовчуванням `https://api.inworld.ai`). |
| `speakerVoiceId` | `messages.tts.providers.inworld.speakerVoiceId` | Ідентифікатор голосу (за замовчуванням `Sarah`).                  |
| `modelId`        | `messages.tts.providers.inworld.modelId`        | Ідентифікатор моделі TTS (за замовчуванням `inworld-tts-1.5-max`). |
| `temperature`    | `messages.tts.providers.inworld.temperature`    | Температура семплювання `0..2` (необов’язково).                   |

## Примітки

<AccordionGroup>
  <Accordion title="Автентифікація">
    Inworld використовує автентифікацію HTTP Basic з одним рядком облікових
    даних, закодованим у Base64. Скопіюйте його дослівно з панелі Inworld.
    Провайдер надсилає його як `Authorization: Basic <apiKey>` без додаткового
    кодування, тому не кодуйте його в Base64 самостійно й не передавайте
    токен у bearer-стилі. Див. [примітки щодо автентифікації TTS](/uk/tools/tts#inworld-primary)
    з таким самим застереженням.
  </Accordion>
  <Accordion title="Моделі">
    Підтримувані ідентифікатори моделей: `inworld-tts-1.5-max` (за замовчуванням),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Аудіовиходи">
    Відповіді за замовчуванням використовують MP3. Коли ціль каналу — `voice-note`,
    OpenClaw запитує в Inworld `OGG_OPUS`, щоб аудіо відтворювалося як нативна
    голосова бульбашка. Телефонний синтез використовує необроблений `PCM` на 22050 Hz
    для передавання в телефонний міст.
  </Accordion>
  <Accordion title="Власні кінцеві точки">
    Перевизначте хост API за допомогою `messages.tts.providers.inworld.baseUrl`.
    Завершальні скісні риски видаляються перед надсиланням запитів.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Перетворення тексту на мовлення" href="/uk/tools/tts" icon="waveform-lines">
    Огляд TTS, провайдери та конфігурація `messages.tts`.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник конфігурації, включно з налаштуваннями `messages.tts`.
  </Card>
  <Card title="Провайдери" href="/uk/providers" icon="grid">
    Усі підтримувані провайдери OpenClaw.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та кроки налагодження.
  </Card>
</CardGroup>

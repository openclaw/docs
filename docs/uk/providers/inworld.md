---
read_when:
    - Ви хочете використовувати синтез мовлення Inworld для вихідних відповідей
    - Вам потрібен вихід телефонного аудіо PCM або голосових нотаток OGG_OPUS від Inworld
summary: Потокове перетворення тексту на мовлення від Inworld для відповідей OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-07-12T13:42:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 443797be3eec0f63c52a7b6b697abb85b15db9b878174f6f6b70ddec474e6326
    source_path: providers/inworld.md
    workflow: 16
---

Inworld — це постачальник потокового перетворення тексту на мовлення (TTS). В OpenClaw він синтезує аудіо вихідних відповідей (типово MP3, OGG_OPUS для голосових повідомлень) і необроблене PCM-аудіо для телефонних каналів, як-от Voice Call.

OpenClaw надсилає запити до потокової кінцевої точки TTS Inworld, об’єднує повернені фрагменти аудіо у форматі base64 в єдиний буфер і передає результат стандартному конвеєру аудіовідповідей.

| Властивість            | Значення                                                        |
| ---------------------- | --------------------------------------------------------------- |
| Ідентифікатор постачальника | `inworld`                                                  |
| Plugin                 | офіційний зовнішній пакет (`@openclaw/inworld-speech`)           |
| Контракт               | `speechProviders` (лише TTS)                                    |
| Змінна середовища автентифікації | `INWORLD_API_KEY` (HTTP Basic, облікові дані Base64 із панелі керування) |
| Базова URL-адреса      | `https://api.inworld.ai`                                        |
| Типовий голос          | `Sarah`                                                         |
| Типова модель          | `inworld-tts-1.5-max`                                           |
| Вихідний формат        | MP3 (типово), OGG_OPUS (голосові повідомлення), PCM 22050 Гц (телефонія) |
| Вебсайт                | [inworld.ai](https://inworld.ai)                                |
| Документація           | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## Встановлення Plugin

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## Початок роботи

<Steps>
  <Step title="Задайте ключ API">
    Скопіюйте облікові дані з панелі керування Inworld (Workspace > API Keys) і задайте їх як змінну середовища. Значення надсилається без змін як облікові дані HTTP Basic, тому не кодуйте його в Base64 повторно й не перетворюйте на токен носія.

    ```bash
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
    Надішліть відповідь через будь-який підключений канал. OpenClaw синтезує аудіо за допомогою Inworld і доставить його у форматі MP3 (або OGG_OPUS, коли канал очікує голосове повідомлення).
  </Step>
</Steps>

## Параметри конфігурації

| Параметр      | Шлях                                         | Опис                                                                |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Облікові дані Base64 із панелі керування. Якщо не задано, використовується `INWORLD_API_KEY`. |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Перевизначає базову URL-адресу API Inworld (типово `https://api.inworld.ai`). |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | Ідентифікатор голосу (типово `Sarah`). Застарілий псевдонім: `speakerVoiceId`. |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | Ідентифікатор моделі TTS (типово `inworld-tts-1.5-max`).             |
| `temperature` | `messages.tts.providers.inworld.temperature` | Температура вибірки: від `0` (не включно) до `2` (необов’язково).    |

## Примітки

<AccordionGroup>
  <Accordion title="Автентифікація">
    Inworld використовує автентифікацію HTTP Basic з одним рядком облікових даних, закодованим у Base64. Скопіюйте його без змін із панелі керування Inworld. Постачальник надсилає його як `Authorization: Basic <apiKey>` без додаткового кодування, тому не кодуйте його в Base64 самостійно й не передавайте токен у стилі bearer. Те саме застереження наведено в [примітках щодо автентифікації TTS](/uk/tools/tts#inworld-primary).
  </Accordion>
  <Accordion title="Моделі">
    Підтримувані ідентифікатори моделей: `inworld-tts-1.5-max` (типово), `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Вихідні аудіоформати">
    Типово для відповідей використовується MP3. Коли ціль каналу — `voice-note`, OpenClaw запитує в Inworld формат `OGG_OPUS`, щоб аудіо відтворювалося як нативна голосова бульбашка. Для телефонного синтезу використовується необроблений формат `PCM` із частотою 22050 Гц, який передається до телефонного мосту.
  </Accordion>
  <Accordion title="Власні кінцеві точки">
    Перевизначте хост API за допомогою `messages.tts.providers.inworld.baseUrl`. Перед надсиланням запитів кінцеві скісні риски видаляються.
  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Перетворення тексту на мовлення" href="/uk/tools/tts" icon="waveform-lines">
    Огляд TTS, постачальники та конфігурація `messages.tts`.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник із конфігурації, зокрема параметрів `messages.tts`.
  </Card>
  <Card title="Постачальники" href="/uk/providers" icon="grid">
    Усі постачальники, які підтримує OpenClaw.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та кроки налагодження.
  </Card>
</CardGroup>

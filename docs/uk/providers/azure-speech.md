---
read_when:
    - Вам потрібен синтез мовлення Azure для вихідних відповідей
    - Вам потрібен нативний вивід голосових нотаток Ogg Opus з Azure Speech
summary: Azure AI Speech для перетворення тексту на мовлення у відповідях OpenClaw
title: Azure Speech
x-i18n:
    generated_at: "2026-06-27T18:08:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c14b1f3c2fda9b2f820e537d7133b1dbf71573b7d735207c6a4ca19432a8d8c3
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech — це постачальник перетворення тексту на мовлення Azure AI Speech. В OpenClaw він
за замовчуванням синтезує аудіо вихідних відповідей у форматі MP3, нативний Ogg/Opus для голосових
нотаток і 8 кГц mulaw-аудіо для телефонних каналів, як-от Голосовий виклик.

OpenClaw використовує Azure Speech REST API напряму з SSML і надсилає
формат виводу, що належить постачальнику, через `X-Microsoft-OutputFormat`.

| Деталь                  | Значення                                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Вебсайт                 | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| Документація            | [Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Автентифікація          | `AZURE_SPEECH_KEY` плюс `AZURE_SPEECH_REGION`                                                                  |
| Голос за замовчуванням  | `en-US-JennyNeural`                                                                                            |
| Вивід файлу за замовчуванням | `audio-24khz-48kbitrate-mono-mp3`                                                                        |
| Файл голосової нотатки за замовчуванням | `ogg-24khz-16bit-mono-opus`                                                                  |

## Початок роботи

<Steps>
  <Step title="Створіть ресурс Azure Speech">
    На порталі Azure створіть ресурс Speech. Скопіюйте **KEY 1** з
    Resource Management > Keys and Endpoint і скопіюйте розташування ресурсу,
    наприклад `eastus`.

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="Виберіть Azure Speech у messages.tts">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "azure-speech",
          providers: {
            "azure-speech": {
              speakerVoice: "en-US-JennyNeural",
              lang: "en-US",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Надішліть повідомлення">
    Надішліть відповідь через будь-який підключений канал. OpenClaw синтезує аудіо
    за допомогою Azure Speech і доставить MP3 для стандартного аудіо або Ogg/Opus,
    коли канал очікує голосову нотатку.
  </Step>
</Steps>

## Параметри конфігурації

| Параметр                | Шлях                                                        | Опис                                                                                                  |
| ----------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | `messages.tts.providers.azure-speech.apiKey`                | Ключ ресурсу Azure Speech. Резервно використовує `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` або `SPEECH_KEY`. |
| `region`                | `messages.tts.providers.azure-speech.region`                | Регіон ресурсу Azure Speech. Резервно використовує `AZURE_SPEECH_REGION` або `SPEECH_REGION`.         |
| `endpoint`              | `messages.tts.providers.azure-speech.endpoint`              | Необов’язкове перевизначення кінцевої точки або базової URL-адреси Azure Speech.                      |
| `baseUrl`               | `messages.tts.providers.azure-speech.baseUrl`               | Необов’язкове перевизначення базової URL-адреси Azure Speech.                                         |
| `speakerVoice`          | `messages.tts.providers.azure-speech.speakerVoice`          | ShortName голосу Azure (за замовчуванням `en-US-JennyNeural`). Застарілий псевдонім: `voice`.         |
| `lang`                  | `messages.tts.providers.azure-speech.lang`                  | Код мови SSML (за замовчуванням `en-US`).                                                            |
| `outputFormat`          | `messages.tts.providers.azure-speech.outputFormat`          | Формат виводу аудіофайлу (за замовчуванням `audio-24khz-48kbitrate-mono-mp3`).                        |
| `voiceNoteOutputFormat` | `messages.tts.providers.azure-speech.voiceNoteOutputFormat` | Формат виводу голосової нотатки (за замовчуванням `ogg-24khz-16bit-mono-opus`).                       |

## Примітки

<AccordionGroup>
  <Accordion title="Автентифікація">
    Azure Speech використовує ключ ресурсу Speech, а не ключ Azure OpenAI. Ключ
    надсилається як `Ocp-Apim-Subscription-Key`; OpenClaw виводить
    `https://<region>.tts.speech.microsoft.com` з `region`, якщо ви не
    вкажете `endpoint` або `baseUrl`.
  </Accordion>
  <Accordion title="Назви голосів">
    Використовуйте значення `ShortName` голосу Azure Speech, наприклад
    `en-US-JennyNeural`. Вбудований постачальник може перелічувати голоси через
    той самий ресурс Speech і фільтрує голоси, позначені як застарілі або виведені з використання.
  </Accordion>
  <Accordion title="Аудіовиходи">
    Azure приймає формати виводу, як-от `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` і `riff-24khz-16bit-mono-pcm`. OpenClaw
    запитує Ogg/Opus для цілей `voice-note`, щоб канали могли надсилати нативні
    голосові бульбашки без додаткового перетворення MP3.
  </Accordion>
  <Accordion title="Псевдонім">
    `azure` приймається як псевдонім постачальника для наявних PR і користувацької конфігурації,
    але нова конфігурація має використовувати `azure-speech`, щоб уникнути плутанини з
    постачальниками моделей Azure OpenAI.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Перетворення тексту на мовлення" href="/uk/tools/tts" icon="waveform-lines">
    Огляд TTS, постачальники та конфігурація `messages.tts`.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник конфігурації, включно з налаштуваннями `messages.tts`.
  </Card>
  <Card title="Постачальники" href="/uk/providers" icon="grid">
    Усі вбудовані постачальники OpenClaw.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та кроки налагодження.
  </Card>
</CardGroup>

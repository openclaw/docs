---
read_when:
    - Ви хочете синтез мовлення Azure Speech для вихідних відповідей
    - Вам потрібен нативний вивід голосових повідомлень Ogg Opus від Azure Speech
summary: Azure AI Speech перетворення тексту на мовлення для відповідей OpenClaw
title: Azure Speech
x-i18n:
    generated_at: "2026-04-26T00:46:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59baf0865e0eba1076ae5c074b5978e1f5f104b3395c816c30c546da41a303b9
    source_path: providers/azure-speech.md
    workflow: 15
---

Azure Speech — це провайдер перетворення тексту на мовлення Azure AI Speech. В OpenClaw він
синтезує аудіо вихідних відповідей як MP3 за замовчуванням, нативний Ogg/Opus для голосових
повідомлень і аудіо mulaw 8 кГц для телефонних каналів, таких як Voice Call.

OpenClaw використовує REST API Azure Speech безпосередньо з SSML і надсилає
формат виводу, що належить провайдеру, через `X-Microsoft-OutputFormat`.

| Деталь                  | Значення                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| Вебсайт                 | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                 |
| Документація            | [Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Автентифікація          | `AZURE_SPEECH_KEY` плюс `AZURE_SPEECH_REGION`                                                                 |
| Голос за замовчуванням  | `en-US-JennyNeural`                                                                                           |
| Вивід файлу за замовчуванням | `audio-24khz-48kbitrate-mono-mp3`                                                                         |
| Файл голосового повідомлення за замовчуванням | `ogg-24khz-16bit-mono-opus`                                                           |

## Початок роботи

<Steps>
  <Step title="Створіть ресурс Azure Speech">
    У порталі Azure створіть ресурс Speech. Скопіюйте **KEY 1** з
    Resource Management > Keys and Endpoint, а також скопіюйте розташування ресурсу,
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
              voice: "en-US-JennyNeural",
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
    за допомогою Azure Speech і доставляє MP3 для стандартного аудіо або Ogg/Opus, коли
    канал очікує голосове повідомлення.
  </Step>
</Steps>

## Параметри конфігурації

| Параметр                | Шлях                                                        | Опис                                                                                                  |
| ----------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | `messages.tts.providers.azure-speech.apiKey`                | Ключ ресурсу Azure Speech. Використовує `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` або `SPEECH_KEY` як запасний варіант. |
| `region`                | `messages.tts.providers.azure-speech.region`                | Регіон ресурсу Azure Speech. Використовує `AZURE_SPEECH_REGION` або `SPEECH_REGION` як запасний варіант. |
| `endpoint`              | `messages.tts.providers.azure-speech.endpoint`              | Необов’язкове перевизначення endpoint/base URL Azure Speech.                                          |
| `baseUrl`               | `messages.tts.providers.azure-speech.baseUrl`               | Необов’язкове перевизначення base URL Azure Speech.                                                   |
| `voice`                 | `messages.tts.providers.azure-speech.voice`                 | `ShortName` голосу Azure (за замовчуванням `en-US-JennyNeural`).                                      |
| `lang`                  | `messages.tts.providers.azure-speech.lang`                  | Код мови SSML (за замовчуванням `en-US`).                                                             |
| `outputFormat`          | `messages.tts.providers.azure-speech.outputFormat`          | Формат виводу аудіофайлу (за замовчуванням `audio-24khz-48kbitrate-mono-mp3`).                        |
| `voiceNoteOutputFormat` | `messages.tts.providers.azure-speech.voiceNoteOutputFormat` | Формат виводу голосового повідомлення (за замовчуванням `ogg-24khz-16bit-mono-opus`).                |

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
    `en-US-JennyNeural`. Вбудований провайдер може перелічувати голоси через
    той самий ресурс Speech і відфільтровує голоси, позначені як deprecated або retired.
  </Accordion>
  <Accordion title="Аудіовиходи">
    Azure приймає такі формати виводу, як `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` і `riff-24khz-16bit-mono-pcm`. OpenClaw
    запитує Ogg/Opus для цілей `voice-note`, щоб канали могли надсилати нативні
    голосові бульбашки без додаткового перетворення MP3.
  </Accordion>
  <Accordion title="Псевдонім">
    `azure` приймається як псевдонім провайдера для наявних PR і конфігурації користувачів,
    але в новій конфігурації слід використовувати `azure-speech`, щоб уникнути плутанини з
    провайдерами моделей Azure OpenAI.
  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Перетворення тексту на мовлення" href="/uk/tools/tts" icon="waveform-lines">
    Огляд TTS, провайдери та конфігурація `messages.tts`.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник із конфігурації, включно з параметрами `messages.tts`.
  </Card>
  <Card title="Провайдери" href="/uk/providers" icon="grid">
    Усі вбудовані провайдери OpenClaw.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та кроки налагодження.
  </Card>
</CardGroup>

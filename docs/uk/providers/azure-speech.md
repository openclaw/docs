---
read_when:
    - Ви хочете використовувати синтез мовлення Azure для вихідних відповідей
    - Вам потрібен нативний формат Ogg Opus для голосових повідомлень від Azure Speech
summary: Синтез мовлення Azure AI Speech для відповідей OpenClaw
title: Azure Speech
x-i18n:
    generated_at: "2026-07-12T13:35:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 61e700724dbb7cb8c217f91485cea0eec776698e439f6c6985dac58dc4cafc01
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech — це вбудований провайдер синтезу мовлення Azure AI Speech. OpenClaw
викликає REST API Azure Speech безпосередньо з SSML, синтезуючи MP3 для
стандартних відповідей, нативний Ogg/Opus для голосових повідомлень і mulaw із частотою 8 кГц для
телефонних каналів, як-от Voice Call. У запиті формат виведення, визначений провайдером,
передається через заголовок `X-Microsoft-OutputFormat`.

| Відомості                     | Значення                                                                                                       |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Ідентифікатор провайдера      | `azure-speech` (псевдонім: `azure`)                                                                            |
| Вебсайт                       | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| Документація                  | [REST API Speech для синтезу мовлення](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Автентифікація                | `AZURE_SPEECH_KEY` разом із `AZURE_SPEECH_REGION`                                                              |
| Голос за замовчуванням        | `en-US-JennyNeural`                                                                                            |
| Формат файлу за замовчуванням | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| Формат файлу голосового повідомлення за замовчуванням | `ogg-24khz-16bit-mono-opus`                                                              |

## Початок роботи

<Steps>
  <Step title="Створіть ресурс Azure Speech">
    На порталі Azure створіть ресурс Speech. Скопіюйте **KEY 1** із розділу
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
    за допомогою Azure Speech і передає MP3 для стандартного аудіо або Ogg/Opus, коли
    канал очікує голосове повідомлення.
  </Step>
</Steps>

## Параметри конфігурації

Усі параметри розташовані в `messages.tts.providers["azure-speech"]`.

| Параметр                | Опис                                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | Ключ ресурсу Azure Speech. Резервно використовує `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` або `SPEECH_KEY`. |
| `region`                | Регіон ресурсу Azure Speech. Резервно використовує `AZURE_SPEECH_REGION` або `SPEECH_REGION`.         |
| `endpoint`              | Необов’язкове перевизначення кінцевої точки Azure Speech. Резервно використовує `AZURE_SPEECH_ENDPOINT`. |
| `baseUrl`               | Необов’язкове перевизначення базової URL-адреси Azure Speech.                                         |
| `voice`                 | Значення ShortName голосу Azure (за замовчуванням `en-US-JennyNeural`). Застарілий псевдонім: `voiceId`. |
| `lang`                  | Код мови SSML (за замовчуванням `en-US`).                                                             |
| `outputFormat`          | Формат вихідного аудіофайлу (за замовчуванням `audio-24khz-48kbitrate-mono-mp3`).                      |
| `voiceNoteOutputFormat` | Формат вихідного голосового повідомлення (за замовчуванням `ogg-24khz-16bit-mono-opus`).               |
| `timeoutMs`             | Перевизначення часу очікування запиту в мілісекундах. Резервно використовує глобальне значення `messages.tts.timeoutMs`. |

Провайдер вважається налаштованим, коли встановлено `apiKey` і один із параметрів:
`region`, `endpoint` або `baseUrl`. Змінні середовища перевіряються лише як резервний варіант
для невстановлених ключів конфігурації.

## Примітки

<AccordionGroup>
  <Accordion title="Автентифікація">
    Azure Speech використовує ключ ресурсу Speech, а не ключ Azure OpenAI. Ключ
    надсилається як `Ocp-Apim-Subscription-Key`; OpenClaw формує
    `https://<region>.tts.speech.microsoft.com` із `region`, якщо ви не
    вказали `endpoint` або `baseUrl`.
  </Accordion>
  <Accordion title="Назви голосів">
    Використовуйте значення `ShortName` голосу Azure Speech, наприклад
    `en-US-JennyNeural`. Вбудований провайдер може отримувати список голосів через
    той самий ресурс Speech і відфільтровує голоси, позначені як застарілі, вилучені
    або вимкнені.
  </Accordion>
  <Accordion title="Формати аудіо">
    Azure приймає такі формати виведення, як `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` і `riff-24khz-16bit-mono-pcm`. OpenClaw
    запитує Ogg/Opus для цільових об’єктів `voice-note`, щоб канали могли надсилати нативні
    голосові повідомлення без додаткового перетворення MP3, і примусово використовує
    `raw-8khz-8bit-mono-mulaw` для телефонних цільових об’єктів.
  </Accordion>
  <Accordion title="Псевдонім">
    `azure` приймається як псевдонім провайдера для наявної конфігурації, але в новій
    конфігурації слід використовувати `azure-speech`, щоб уникнути плутанини з провайдерами
    моделей Azure OpenAI.
  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Синтез мовлення" href="/uk/tools/tts" icon="waveform-lines">
    Огляд TTS, провайдери та конфігурація `messages.tts`.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник із конфігурації, зокрема параметри `messages.tts`.
  </Card>
  <Card title="Провайдери" href="/uk/providers" icon="grid">
    Усі вбудовані провайдери OpenClaw.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та кроки діагностики.
  </Card>
</CardGroup>

---
read_when:
    - Ви хочете використовувати синтез мовлення Azure для вихідних відповідей
    - Вам потрібен нативний вихід голосових нотаток Ogg Opus з Azure Speech
summary: Перетворення тексту на мовлення за допомогою Azure AI Speech для відповідей OpenClaw
title: Мовлення Azure
x-i18n:
    generated_at: "2026-07-16T18:31:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f5eab231afee8f606c5257465f958d42838efab7fde1642578cad987c564c700
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech — це вбудований постачальник синтезу мовлення на основі Azure AI Speech. OpenClaw
безпосередньо викликає REST API Azure Speech із SSML, синтезуючи MP3 для
стандартних відповідей, нативний Ogg/Opus для голосових повідомлень і mulaw 8 кГц для
телефонних каналів, як-от Voice Call. Запит передає визначений постачальником
формат виведення через заголовок `X-Microsoft-OutputFormat`.

| Відомості               | Значення                                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Ідентифікатор постачальника | `azure-speech` (псевдонім: `azure`)                                                        |
| Вебсайт                 | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| Документація            | [REST API Speech для синтезу мовлення](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Автентифікація          | `AZURE_SPEECH_KEY` разом із `AZURE_SPEECH_REGION`                                                                |
| Стандартний голос       | `en-US-JennyNeural`                                                                                            |
| Стандартний формат файлу | `audio-24khz-48kbitrate-mono-mp3`                                                                                           |
| Стандартний файл голосового повідомлення | `ogg-24khz-16bit-mono-opus`                                                                              |

## Початок роботи

<Steps>
  <Step title="Створіть ресурс Azure Speech">
    На порталі Azure створіть ресурс Speech. Скопіюйте **KEY 1** з
    Resource Management > Keys and Endpoint, а також розташування ресурсу,
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

Усі параметри містяться в `messages.tts.providers["azure-speech"]`.

| Параметр                | Опис                                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`      | Ключ ресурсу Azure Speech. Резервно використовує `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` або `SPEECH_KEY`. |
| `region`      | Регіон ресурсу Azure Speech. Резервно використовує `AZURE_SPEECH_REGION` або `SPEECH_REGION`.          |
| `endpoint`      | Необов’язкове перевизначення кінцевої точки Azure Speech. Резервно використовує довірений `AZURE_SPEECH_ENDPOINT`. |
| `baseUrl`      | Необов’язкове перевизначення базової URL-адреси Azure Speech.                                         |
| `voice`      | ShortName голосу Azure (стандартне значення — `en-US-JennyNeural`). Застарілий псевдонім: `voiceId`. |
| `lang`      | Код мови SSML (стандартне значення — `en-US`).                                            |
| `outputFormat`      | Формат виведення аудіофайлу (стандартне значення — `audio-24khz-48kbitrate-mono-mp3`).                              |
| `voiceNoteOutputFormat`      | Формат виведення голосового повідомлення (стандартне значення — `ogg-24khz-16bit-mono-opus`).                  |
| `timeoutMs`      | Перевизначення часу очікування запиту в мілісекундах. Резервно використовує глобальний `messages.tts.timeoutMs`. |

Постачальник вважається налаштованим, коли задано `apiKey` разом з одним із
`region`, `endpoint` або `baseUrl`. Змінні середовища перевіряються лише як резервний варіант
для незаданих ключів конфігурації. Файли `.env` робочої області не можуть задавати
`AZURE_SPEECH_ENDPOINT`; для маршрутизації кінцевої точки використовуйте середовище процесу, глобальний dotenv середовища виконання
або явну конфігурацію.

## Примітки

<AccordionGroup>
  <Accordion title="Автентифікація">
    Azure Speech використовує ключ ресурсу Speech, а не ключ Azure OpenAI. Ключ
    надсилається як `Ocp-Apim-Subscription-Key`; OpenClaw формує
    `https://<region>.tts.speech.microsoft.com` з `region`, якщо не надано
    `endpoint` або `baseUrl`.
  </Accordion>
  <Accordion title="Назви голосів">
    Використовуйте значення `ShortName` голосу Azure Speech, наприклад
    `en-US-JennyNeural`. Вбудований постачальник може отримувати список голосів через
    той самий ресурс Speech і відфільтровує голоси, позначені як застарілі, вилучені
    або вимкнені.
  </Accordion>
  <Accordion title="Формати аудіо">
    Azure приймає такі формати виведення, як `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` і `riff-24khz-16bit-mono-pcm`. OpenClaw
    запитує Ogg/Opus для цілей `voice-note`, щоб канали могли надсилати нативні
    голосові повідомлення без додаткового перетворення MP3, і примусово використовує
    `raw-8khz-8bit-mono-mulaw` для телефонних цілей.
  </Accordion>
  <Accordion title="Псевдонім">
    `azure` підтримується як псевдонім постачальника для наявної конфігурації, але в новій
    конфігурації слід використовувати `azure-speech`, щоб уникнути плутанини з постачальниками
    моделей Azure OpenAI.
  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Синтез мовлення" href="/uk/tools/tts" icon="waveform-lines">
    Огляд TTS, постачальники та конфігурація `messages.tts`.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник із конфігурації, включно з налаштуваннями `messages.tts`.
  </Card>
  <Card title="Постачальники" href="/uk/providers" icon="grid">
    Усі вбудовані постачальники OpenClaw.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та кроки діагностики.
  </Card>
</CardGroup>

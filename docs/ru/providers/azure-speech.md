---
read_when:
    - Вам нужен синтез речи Azure для исходящих ответов
    - Вам нужен нативный вывод голосовых заметок Ogg Opus из Azure Speech
summary: Синтез речи Azure AI Speech для ответов OpenClaw
title: Речь Azure
x-i18n:
    generated_at: "2026-06-28T23:34:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c14b1f3c2fda9b2f820e537d7133b1dbf71573b7d735207c6a4ca19432a8d8c3
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech — это провайдер преобразования текста в речь Azure AI Speech. В OpenClaw он
по умолчанию синтезирует аудио исходящих ответов в MP3, нативный Ogg/Opus для
голосовых сообщений и 8 kHz mulaw-аудио для телефонных каналов, таких как голосовой вызов.

OpenClaw использует Azure Speech REST API напрямую с SSML и передает
формат вывода, определяемый провайдером, через `X-Microsoft-OutputFormat`.

| Сведения                | Значение                                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Сайт                    | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| Документация            | [Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Аутентификация          | `AZURE_SPEECH_KEY` плюс `AZURE_SPEECH_REGION`                                                                  |
| Голос по умолчанию      | `en-US-JennyNeural`                                                                                            |
| Файловый вывод по умолчанию | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| Файл голосового сообщения по умолчанию | `ogg-24khz-16bit-mono-opus`                                                                                    |

## Начало работы

<Steps>
  <Step title="Create an Azure Speech resource">
    В портале Azure создайте ресурс Speech. Скопируйте **KEY 1** из
    «Управление ресурсами > Ключи и конечная точка», а также скопируйте расположение ресурса,
    например `eastus`.

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="Select Azure Speech in messages.tts">
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
  <Step title="Send a message">
    Отправьте ответ через любой подключенный канал. OpenClaw синтезирует аудио
    с помощью Azure Speech и доставляет MP3 для стандартного аудио либо Ogg/Opus, когда
    канал ожидает голосовое сообщение.
  </Step>
</Steps>

## Параметры конфигурации

| Параметр                | Путь                                                        | Описание                                                                                              |
| ----------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | `messages.tts.providers.azure-speech.apiKey`                | Ключ ресурса Azure Speech. Использует `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` или `SPEECH_KEY` как запасной вариант. |
| `region`                | `messages.tts.providers.azure-speech.region`                | Регион ресурса Azure Speech. Использует `AZURE_SPEECH_REGION` или `SPEECH_REGION` как запасной вариант. |
| `endpoint`              | `messages.tts.providers.azure-speech.endpoint`              | Необязательное переопределение конечной точки/базового URL Azure Speech.                              |
| `baseUrl`               | `messages.tts.providers.azure-speech.baseUrl`               | Необязательное переопределение базового URL Azure Speech.                                             |
| `speakerVoice`          | `messages.tts.providers.azure-speech.speakerVoice`          | ShortName голоса Azure (по умолчанию `en-US-JennyNeural`). Устаревший псевдоним: `voice`.             |
| `lang`                  | `messages.tts.providers.azure-speech.lang`                  | Код языка SSML (по умолчанию `en-US`).                                                               |
| `outputFormat`          | `messages.tts.providers.azure-speech.outputFormat`          | Формат вывода аудиофайла (по умолчанию `audio-24khz-48kbitrate-mono-mp3`).                            |
| `voiceNoteOutputFormat` | `messages.tts.providers.azure-speech.voiceNoteOutputFormat` | Формат вывода голосового сообщения (по умолчанию `ogg-24khz-16bit-mono-opus`).                        |

## Примечания

<AccordionGroup>
  <Accordion title="Authentication">
    Azure Speech использует ключ ресурса Speech, а не ключ Azure OpenAI. Ключ
    отправляется как `Ocp-Apim-Subscription-Key`; OpenClaw выводит
    `https://<region>.tts.speech.microsoft.com` из `region`, если вы не
    укажете `endpoint` или `baseUrl`.
  </Accordion>
  <Accordion title="Voice names">
    Используйте значение `ShortName` голоса Azure Speech, например
    `en-US-JennyNeural`. Встроенный провайдер может перечислять голоса через тот же
    ресурс Speech и отфильтровывает голоса, помеченные как устаревшие или выведенные из эксплуатации.
  </Accordion>
  <Accordion title="Audio outputs">
    Azure принимает форматы вывода, такие как `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` и `riff-24khz-16bit-mono-pcm`. OpenClaw
    запрашивает Ogg/Opus для целей `voice-note`, чтобы каналы могли отправлять нативные
    голосовые сообщения без дополнительного преобразования MP3.
  </Accordion>
  <Accordion title="Alias">
    `azure` принимается как псевдоним провайдера для существующих PR и пользовательской конфигурации,
    но новая конфигурация должна использовать `azure-speech`, чтобы избежать путаницы с
    провайдерами моделей Azure OpenAI.
  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Text-to-speech" href="/ru/tools/tts" icon="waveform-lines">
    Обзор TTS, провайдеры и конфигурация `messages.tts`.
  </Card>
  <Card title="Configuration" href="/ru/gateway/configuration" icon="gear">
    Полный справочник конфигурации, включая настройки `messages.tts`.
  </Card>
  <Card title="Providers" href="/ru/providers" icon="grid">
    Все встроенные провайдеры OpenClaw.
  </Card>
  <Card title="Troubleshooting" href="/ru/help/troubleshooting" icon="wrench">
    Распространенные проблемы и шаги отладки.
  </Card>
</CardGroup>

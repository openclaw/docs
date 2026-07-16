---
read_when:
    - Вам нужен синтез речи Azure для исходящих ответов
    - Вам нужен нативный вывод голосовых сообщений в формате Ogg Opus из Azure Speech
summary: Преобразование текста в речь с помощью Azure AI Speech для ответов OpenClaw
title: Azure Speech
x-i18n:
    generated_at: "2026-07-16T17:21:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f5eab231afee8f606c5257465f958d42838efab7fde1642578cad987c564c700
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech — это встроенный провайдер преобразования текста в речь Azure AI Speech. OpenClaw
напрямую вызывает REST API Azure Speech с использованием SSML, синтезируя MP3 для
стандартных ответов, нативный Ogg/Opus для голосовых сообщений и mulaw 8 кГц для
телефонных каналов, таких как Voice Call. В запросе принадлежащий провайдеру
формат вывода передаётся через заголовок `X-Microsoft-OutputFormat`.

| Сведения                | Значение                                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Идентификатор провайдера | `azure-speech` (псевдоним: `azure`)                                                            |
| Веб-сайт                | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| Документация            | [Преобразование текста в речь через Speech REST](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| Аутентификация          | `AZURE_SPEECH_KEY` и `AZURE_SPEECH_REGION`                                                                       |
| Голос по умолчанию      | `en-US-JennyNeural`                                                                                             |
| Файл по умолчанию       | `audio-24khz-48kbitrate-mono-mp3`                                                                                             |
| Файл голосового сообщения по умолчанию | `ogg-24khz-16bit-mono-opus`                                                                                  |

## Начало работы

<Steps>
  <Step title="Создание ресурса Azure Speech">
    На портале Azure создайте ресурс Speech. Скопируйте **KEY 1** из раздела
    Resource Management > Keys and Endpoint, а также расположение ресурса,
    например `eastus`.

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="Выбор Azure Speech в messages.tts">
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
  <Step title="Отправка сообщения">
    Отправьте ответ через любой подключённый канал. OpenClaw синтезирует аудио
    с помощью Azure Speech и передаст MP3 для стандартного аудио или Ogg/Opus,
    если канал ожидает голосовое сообщение.
  </Step>
</Steps>

## Параметры конфигурации

Все параметры находятся в `messages.tts.providers["azure-speech"]`.

| Параметр                | Описание                                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`      | Ключ ресурса Azure Speech. Если не задан, используются `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` или `SPEECH_KEY`. |
| `region`      | Регион ресурса Azure Speech. Если не задан, используются `AZURE_SPEECH_REGION` или `SPEECH_REGION`.   |
| `endpoint`      | Необязательное переопределение конечной точки Azure Speech. Если не задано, используется доверенный `AZURE_SPEECH_ENDPOINT`. |
| `baseUrl`      | Необязательное переопределение базового URL Azure Speech.                                             |
| `voice`      | ShortName голоса Azure (по умолчанию `en-US-JennyNeural`). Устаревший псевдоним: `voiceId`.   |
| `lang`      | Код языка SSML (по умолчанию `en-US`).                                                     |
| `outputFormat`      | Формат выходного аудиофайла (по умолчанию `audio-24khz-48kbitrate-mono-mp3`).                                        |
| `voiceNoteOutputFormat`      | Формат вывода голосового сообщения (по умолчанию `ogg-24khz-16bit-mono-opus`).                                 |
| `timeoutMs`      | Переопределение времени ожидания запроса в миллисекундах. Если не задано, используется глобальное значение `messages.tts.timeoutMs`. |

Провайдер считается настроенным, если задан `apiKey` и один из
`region`, `endpoint` или `baseUrl`. Переменные окружения проверяются только как резервный
вариант для незаданных ключей конфигурации. Файлы рабочей области `.env` не могут задавать
`AZURE_SPEECH_ENDPOINT`; для маршрутизации конечных точек используйте окружение процесса, глобальный dotenv среды выполнения
или явную конфигурацию.

## Примечания

<AccordionGroup>
  <Accordion title="Аутентификация">
    Azure Speech использует ключ ресурса Speech, а не ключ Azure OpenAI. Ключ
    передаётся как `Ocp-Apim-Subscription-Key`; OpenClaw формирует
    `https://<region>.tts.speech.microsoft.com` на основе `region`, если не
    указан `endpoint` или `baseUrl`.
  </Accordion>
  <Accordion title="Названия голосов">
    Используйте значение `ShortName` голоса Azure Speech, например
    `en-US-JennyNeural`. Встроенный провайдер может получать список голосов через
    тот же ресурс Speech и исключает голоса, помеченные как устаревшие, выведенные
    из эксплуатации или отключённые.
  </Accordion>
  <Accordion title="Форматы аудио">
    Azure принимает такие форматы вывода, как `audio-24khz-48kbitrate-mono-mp3`,
    `ogg-24khz-16bit-mono-opus` и `riff-24khz-16bit-mono-pcm`. OpenClaw
    запрашивает Ogg/Opus для целей `voice-note`, чтобы каналы могли отправлять нативные
    голосовые сообщения без дополнительного преобразования MP3, и принудительно использует
    `raw-8khz-8bit-mono-mulaw` для телефонных целей.
  </Accordion>
  <Accordion title="Псевдоним">
    `azure` принимается как псевдоним провайдера для существующей конфигурации, но в новой
    конфигурации следует использовать `azure-speech`, чтобы избежать путаницы с провайдерами
    моделей Azure OpenAI.
  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Преобразование текста в речь" href="/ru/tools/tts" icon="waveform-lines">
    Обзор TTS, провайдеры и конфигурация `messages.tts`.
  </Card>
  <Card title="Конфигурация" href="/ru/gateway/configuration" icon="gear">
    Полный справочник по конфигурации, включая настройки `messages.tts`.
  </Card>
  <Card title="Провайдеры" href="/ru/providers" icon="grid">
    Все встроенные провайдеры OpenClaw.
  </Card>
  <Card title="Устранение неполадок" href="/ru/help/troubleshooting" icon="wrench">
    Распространённые проблемы и шаги по отладке.
  </Card>
</CardGroup>

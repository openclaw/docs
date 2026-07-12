---
read_when:
    - Вам нужен синтез речи Inworld для исходящих ответов
    - Вам нужен вывод телефонии в формате PCM или голосовых заметок OGG_OPUS из Inworld
summary: Потоковый синтез речи Inworld для ответов OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-07-12T11:47:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 443797be3eec0f63c52a7b6b697abb85b15db9b878174f6f6b70ddec474e6326
    source_path: providers/inworld.md
    workflow: 16
---

Inworld — провайдер потокового преобразования текста в речь (TTS). В OpenClaw он синтезирует аудио для исходящих ответов (по умолчанию MP3, а для голосовых сообщений — OGG_OPUS) и необработанное аудио PCM для телефонных каналов, таких как Voice Call.

OpenClaw отправляет запросы к потоковой конечной точке TTS Inworld, объединяет возвращённые фрагменты аудио в формате base64 в единый буфер и передаёт результат в стандартный конвейер обработки аудиоответов.

| Свойство             | Значение                                                                     |
| -------------------- | ---------------------------------------------------------------------------- |
| Идентификатор провайдера | `inworld`                                                                |
| Plugin               | официальный внешний пакет (`@openclaw/inworld-speech`)                       |
| Контракт             | `speechProviders` (только TTS)                                               |
| Переменная окружения для аутентификации | `INWORLD_API_KEY` (HTTP Basic, учётные данные Base64 из панели управления) |
| Базовый URL          | `https://api.inworld.ai`                                                     |
| Голос по умолчанию   | `Sarah`                                                                      |
| Модель по умолчанию  | `inworld-tts-1.5-max`                                                        |
| Выходной формат      | MP3 (по умолчанию), OGG_OPUS (голосовые сообщения), PCM 22050 Гц (телефония) |
| Веб-сайт             | [inworld.ai](https://inworld.ai)                                             |
| Документация         | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)                   |

## Установка Plugin

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## Начало работы

<Steps>
  <Step title="Задайте ключ API">
    Скопируйте учётные данные из панели управления Inworld (Workspace > API Keys) и задайте их в переменной окружения. Значение передаётся без изменений в качестве учётных данных HTTP Basic, поэтому не кодируйте его в Base64 повторно и не преобразовывайте в токен предъявителя.

    ```bash
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="Выберите Inworld в messages.tts">
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
  <Step title="Отправьте сообщение">
    Отправьте ответ через любой подключённый канал. OpenClaw синтезирует аудио с помощью Inworld и доставит его в формате MP3 (или OGG_OPUS, если канал ожидает голосовое сообщение).
  </Step>
</Steps>

## Параметры конфигурации

| Параметр      | Путь                                         | Описание                                                                    |
| ------------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Учётные данные Base64 из панели управления. Резервный источник — `INWORLD_API_KEY`. |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | Переопределяет базовый URL API Inworld (по умолчанию `https://api.inworld.ai`). |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | Идентификатор голоса (по умолчанию `Sarah`). Устаревший псевдоним: `speakerVoiceId`. |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | Идентификатор модели TTS (по умолчанию `inworld-tts-1.5-max`).              |
| `temperature` | `messages.tts.providers.inworld.temperature` | Температура выборки: от `0` (не включая) до `2` (необязательный параметр).   |

## Примечания

<AccordionGroup>
  <Accordion title="Аутентификация">
    Inworld использует аутентификацию HTTP Basic с единой строкой учётных данных, закодированной в Base64. Скопируйте её без изменений из панели управления Inworld. Провайдер отправляет её в виде `Authorization: Basic <apiKey>` без дополнительного кодирования, поэтому не кодируйте её в Base64 самостоятельно и не передавайте токен в формате Bearer. Аналогичное предупреждение приведено в разделе [примечаний об аутентификации TTS](/ru/tools/tts#inworld-primary).
  </Accordion>
  <Accordion title="Модели">
    Поддерживаемые идентификаторы моделей: `inworld-tts-1.5-max` (по умолчанию), `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Выходные аудиоформаты">
    По умолчанию для ответов используется MP3. Если целевой тип канала — `voice-note`, OpenClaw запрашивает у Inworld формат `OGG_OPUS`, чтобы аудио воспроизводилось как нативное голосовое сообщение. Для синтеза в телефонии используется необработанный формат `PCM` с частотой 22050 Гц, который передаётся в телефонный мост.
  </Accordion>
  <Accordion title="Пользовательские конечные точки">
    Переопределите хост API с помощью `messages.tts.providers.inworld.baseUrl`. Завершающие косые черты удаляются перед отправкой запросов.
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
    Все поддерживаемые провайдеры OpenClaw.
  </Card>
  <Card title="Устранение неполадок" href="/ru/help/troubleshooting" icon="wrench">
    Распространённые проблемы и действия по отладке.
  </Card>
</CardGroup>

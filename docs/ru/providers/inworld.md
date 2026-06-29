---
read_when:
    - Вам нужен синтез речи Inworld для исходящих ответов
    - Вам нужен вывод из Inworld в виде PCM-телефонии или голосовой заметки OGG_OPUS
summary: Потоковый синтез речи Inworld для ответов OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-06-28T23:37:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea65903945586516b51b239f0671b9e59dac92f302442f3cb629f66b68338cfb
    source_path: providers/inworld.md
    workflow: 16
---

Inworld — это поставщик потокового преобразования текста в речь (TTS). В OpenClaw он
синтезирует аудио исходящих ответов (MP3 по умолчанию, OGG_OPUS для голосовых заметок)
и PCM-аудио для телефонных каналов, таких как голосовой вызов.

OpenClaw отправляет запросы в потоковую конечную точку TTS Inworld, объединяет
возвращенные фрагменты аудио в base64 в единый буфер и передает результат в
стандартный конвейер аудиоответов.

| Свойство      | Значение                                                           |
| ------------- | --------------------------------------------------------------- |
| ID поставщика   | `inworld`                                                       |
| Plugin        | официальный внешний пакет                                       |
| Контракт      | `speechProviders` (только TTS)                                    |
| Переменная окружения для аутентификации  | `INWORLD_API_KEY` (HTTP Basic, учетные данные панели управления в Base64)     |
| Базовый URL      | `https://api.inworld.ai`                                        |
| Голос по умолчанию | `Sarah`                                                         |
| Модель по умолчанию | `inworld-tts-1.5-max`                                           |
| Вывод        | MP3 (по умолчанию), OGG_OPUS (голосовые заметки), PCM 22050 Гц (телефония) |
| Веб-сайт       | [inworld.ai](https://inworld.ai)                                |
| Документация          | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## Установка Plugin

Установите официальный Plugin, затем перезапустите Gateway:

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## Начало работы

<Steps>
  <Step title="Задайте ключ API">
    Скопируйте учетные данные из панели управления Inworld (Workspace > API Keys)
    и задайте их как переменную окружения. Значение отправляется без изменений как учетные данные HTTP Basic,
    поэтому не кодируйте его в Base64 повторно и не преобразуйте в bearer-
    токен.

    ```
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
              speakerVoiceId: "Sarah",
              modelId: "inworld-tts-1.5-max",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Отправьте сообщение">
    Отправьте ответ через любой подключенный канал. OpenClaw синтезирует
    аудио с помощью Inworld и доставляет его как MP3 (или OGG_OPUS, когда канал
    ожидает голосовую заметку).
  </Step>
</Steps>

## Параметры конфигурации

| Параметр           | Путь                                            | Описание                                                       |
| ---------------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`         | `messages.tts.providers.inworld.apiKey`         | Учетные данные панели управления в Base64. Использует `INWORLD_API_KEY` как запасной вариант.     |
| `baseUrl`        | `messages.tts.providers.inworld.baseUrl`        | Переопределяет базовый URL API Inworld (по умолчанию `https://api.inworld.ai`). |
| `speakerVoiceId` | `messages.tts.providers.inworld.speakerVoiceId` | Идентификатор голоса (по умолчанию `Sarah`).                               |
| `modelId`        | `messages.tts.providers.inworld.modelId`        | ID модели TTS (по умолчанию `inworld-tts-1.5-max`).                     |
| `temperature`    | `messages.tts.providers.inworld.temperature`    | Температура сэмплирования `0..2` (необязательно).                           |

## Примечания

<AccordionGroup>
  <Accordion title="Аутентификация">
    Inworld использует аутентификацию HTTP Basic с одной строкой учетных данных,
    закодированной в Base64. Скопируйте ее без изменений из панели управления Inworld. Поставщик отправляет
    ее как `Authorization: Basic <apiKey>` без какого-либо дополнительного кодирования, поэтому
    не кодируйте ее в Base64 самостоятельно и не передавайте токен в стиле bearer.
    См. [примечания по аутентификации TTS](/ru/tools/tts#inworld-primary) с тем же указанием.
  </Accordion>
  <Accordion title="Модели">
    Поддерживаемые ID моделей: `inworld-tts-1.5-max` (по умолчанию),
    `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.
  </Accordion>
  <Accordion title="Аудиовыходы">
    По умолчанию ответы используют MP3. Когда целевой тип канала — `voice-note`,
    OpenClaw запрашивает у Inworld `OGG_OPUS`, чтобы аудио воспроизводилось как нативный
    голосовой пузырь. Телефонный синтез использует необработанный `PCM` с частотой 22050 Гц для передачи
    в телефонный мост.
  </Accordion>
  <Accordion title="Пользовательские конечные точки">
    Переопределите хост API с помощью `messages.tts.providers.inworld.baseUrl`.
    Завершающие косые черты удаляются перед отправкой запросов.
  </Accordion>
</AccordionGroup>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Преобразование текста в речь" href="/ru/tools/tts" icon="waveform-lines">
    Обзор TTS, поставщики и конфигурация `messages.tts`.
  </Card>
  <Card title="Конфигурация" href="/ru/gateway/configuration" icon="gear">
    Полный справочник конфигурации, включая настройки `messages.tts`.
  </Card>
  <Card title="Поставщики" href="/ru/providers" icon="grid">
    Все поддерживаемые поставщики OpenClaw.
  </Card>
  <Card title="Устранение неполадок" href="/ru/help/troubleshooting" icon="wrench">
    Распространенные проблемы и шаги отладки.
  </Card>
</CardGroup>

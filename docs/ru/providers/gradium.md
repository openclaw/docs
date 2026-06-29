---
read_when:
    - Вам нужен Gradium для преобразования текста в речь
    - Вам нужна конфигурация API-ключа, голоса или токена директив Gradium
summary: Используйте преобразование текста в речь Gradium в OpenClaw
title: Gradium
x-i18n:
    generated_at: "2026-06-28T23:36:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5178bfaf5087e18d5d71f46d04b16d52e0e132257b9ef772b7869ac11b49a0da
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) — провайдер преобразования текста в речь для OpenClaw. Plugin может создавать обычные аудиоответы (WAV), совместимый с голосовыми заметками вывод Opus и 8 кГц u-law-аудио для телефонных поверхностей.

| Свойство      | Значение                             |
| ------------- | ------------------------------------ |
| ID провайдера | `gradium`                            |
| Аутентификация | `GRADIUM_API_KEY` или config `apiKey` |
| Базовый URL   | `https://api.gradium.ai` (по умолчанию) |
| Голос по умолчанию | `Emma` (`YTpq7expH9539ERJ`)     |

## Установка plugin

Установите официальный plugin, затем перезапустите Gateway:

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## Настройка

Создайте API-ключ Gradium, затем передайте его в OpenClaw через переменную окружения или ключ конфигурации.

<Tabs>
  <Tab title="Переменная окружения">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="Ключ конфигурации">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "gradium",
          providers: {
            gradium: {
              apiKey: "${GRADIUM_API_KEY}",
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

Plugin сначала проверяет разрешенный `apiKey`, а затем откатывается к переменной окружения `GRADIUM_API_KEY`.

## Конфигурация

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          speakerVoiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

| Ключ                                            | Тип    | Описание                                                                                   |
| ----------------------------------------------- | ------ | ------------------------------------------------------------------------------------------ |
| `messages.tts.providers.gradium.apiKey`         | string | Разрешенный API-ключ. Поддерживает `${ENV}` и ссылки на секреты.                           |
| `messages.tts.providers.gradium.baseUrl`        | string | Переопределяет origin API. Завершающие косые черты удаляются. По умолчанию `https://api.gradium.ai`. |
| `messages.tts.providers.gradium.speakerVoiceId` | string | ID голоса по умолчанию, используемый при отсутствии переопределения директивой.             |

Формат выходного аудио автоматически выбирается средой выполнения на основе целевой поверхности и не настраивается из `openclaw.json`. См. [Вывод](#output) ниже.

## Голоса

| Имя       | ID голоса          |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

Голос по умолчанию: Emma.

### Переопределение голоса для сообщения

Когда активная политика речи разрешает переопределения голоса, можно переключать голоса прямо в тексте с помощью токена директивы. Используйте `speakerVoiceId` для нативных ID голосов провайдера.

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

Если политика речи отключает переопределения голоса, директива потребляется, но игнорируется.

## Вывод

Среда выполнения выбирает формат вывода на основе целевой поверхности. Сейчас провайдер не синтезирует другие форматы.

| Цель             | Формат      | Расширение файла | Частота дискретизации | Флаг совместимости с голосом |
| ---------------- | ----------- | ---------------- | --------------------- | ---------------------------- |
| Стандартное аудио | `wav`       | `.wav`           | provider              | нет                          |
| Голосовая заметка | `opus`      | `.opus`          | provider              | да                           |
| Телефония         | `ulaw_8000` | n/a              | 8 кГц                 | n/a                          |

## Порядок автовыбора

Среди настроенных TTS-провайдеров порядок автовыбора Gradium — `30`. См. [Преобразование текста в речь](/ru/tools/tts), чтобы узнать, как OpenClaw выбирает активного провайдера, когда `messages.tts.provider` не закреплен.

## Связанные материалы

- [Преобразование текста в речь](/ru/tools/tts)
- [Обзор медиа](/ru/tools/media-overview)

---
read_when:
    - Вы хотите читать сохраненные сводки транскриптов из терминала
    - Требуется путь к Markdown-сводке расшифровок
    - Вы отлаживаете схему хранения основных транскриптов
summary: Справочник CLI для `openclaw transcripts` (список, просмотр и поиск сохраненных стенограмм)
title: CLI для транскриптов
x-i18n:
    generated_at: "2026-06-28T22:47:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae6010cfb4e051182f1c48d0d728b30d054542e1e7983ff15a2432840193f9c0
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

Просматривайте расшифровки, записанные базовым инструментом OpenClaw `transcripts`. Этот CLI
доступен только для чтения; захват, импорт и суммаризация принадлежат инструменту агента и
настроенным источникам автозапуска.

Используйте CLI, когда нужно найти вчерашние заметки, открыть Markdown-файл в
редакторе, передать расшифровку другому инструменту или отладить, куда сессия попала на
диске. Он не запускает и не останавливает захват.

Артефакты находятся в каталоге состояния OpenClaw:

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

Каталог состояния по умолчанию — `~/.openclaw`; задайте `OPENCLAW_STATE_DIR`, чтобы использовать
другой. Каталог даты берется из времени начала сессии, а каталог
сессии — это безопасный сегмент файловой системы, полученный из id сессии.

## Команды

```bash
openclaw transcripts list
openclaw transcripts show <session>
openclaw transcripts show YYYY-MM-DD/<session>
openclaw transcripts path <session>
openclaw transcripts path YYYY-MM-DD/<session>
openclaw transcripts path <session> --dir
openclaw transcripts path <session> --metadata
openclaw transcripts path <session> --transcript
openclaw transcripts list --json
openclaw transcripts show <session> --json
openclaw transcripts path <session> --json
```

- `list`: вывести сохраненные сессии, селектор с датой, время начала, заголовок и путь к `summary.md`.
- `show <session>`: вывести сохраненный `summary.md`.
- `path <session>`: вывести путь к `summary.md`.
- `path <session> --dir`: вывести каталог сессии.
- `path <session> --metadata`: вывести `metadata.json`.
- `path <session> --transcript`: вывести `transcript.jsonl`.
- `--json`: вывести машиночитаемый вывод.

Когда человеческий id сессии повторяется в разные дни, используйте селектор с датой
из `list`, например `openclaw transcripts show 2026-05-22/standup`.
Стандартные id сессий включают временную метку и случайный суффикс; настраивайте фиксированные
id сессий только тогда, когда они уникальны в пределах дня.

## Вывод

`list` выводит по одной сессии в строке:

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  Weekly standup  /Users/alex/.openclaw/transcripts/2026-05-22/standup/summary.md
```

Вывод разделен табуляцией. Столбцы: селектор, время начала, заголовок и
путь к сводке. Селектор — самое безопасное значение для передачи обратно в `show` или `path`.

`list --json` выводит объекты с:

- `sessionId`
- `selector`
- `date`
- `title`
- `startedAt`
- `stoppedAt`
- `source`
- `path`
- `summaryPath`
- `hasSummary`

`show --json` возвращает сохраненные метаданные сессии, селектор, каталог сессии,
путь к сводке и Markdown-текст сводки. `path --json` возвращает выбранный путь
и сведения о том, существует ли этот файл.

## Много встреч в день

Transcripts группирует сессии по дате, затем по id сессии. Десять встреч за один
день становятся десятью соседними папками:

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

Используйте стандартные сгенерированные id для большей части автоматизации. Используйте фиксированный id, например `standup`,
только когда тот же id не будет использован дважды в ту же дату.

## Отсутствующие сводки

Живые сессии записывают `summary.md`, когда сессия останавливается. Импортированные расшифровки
записывают `summary.md` сразу после импорта. Сессия все еще может отображаться в
`list` без сводки, когда захват активен, провайдер завершился с ошибкой во время остановки
или метаданные были записаны до появления каких-либо реплик.

Используйте `path <session> --transcript`, чтобы просмотреть добавляемую только в конец расшифровку, и используйте
действие инструмента `transcripts` `summarize`, чтобы заново создать Markdown-сводку.

## Конфигурация

Захват расшифровок включается явно, потому что живые источники могут присоединяться и записывать аудио
встреч. Включите инструмент с помощью верхнеуровневого `transcripts.enabled`:

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

Настройте источники автозапуска с помощью `transcripts.autoStart` в `openclaw.json`.
Каждая запись включается своим наличием; опустите запись, чтобы отключить этот источник.

```json
{
  "transcripts": {
    "enabled": true,
    "autoStart": [
      {
        "providerId": "discord-voice",
        "guildId": "1234567890",
        "channelId": "2345678901"
      },
      {
        "providerId": "slack-huddle",
        "accountId": "workspace",
        "channelId": "C123"
      }
    ]
  }
}
```

---
read_when:
    - Ви хочете читати збережені підсумки транскриптів із термінала
    - Вам потрібен шлях до Markdown-зведення транскриптів
    - Ви налагоджуєте основну схему зберігання транскриптів
summary: Довідник CLI для `openclaw transcripts` (перегляд списку, показ і визначення розташування збережених транскриптів)
title: CLI транскриптів
x-i18n:
    generated_at: "2026-06-27T17:23:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ae6010cfb4e051182f1c48d0d728b30d054542e1e7983ff15a2432840193f9c0
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

Переглядайте транскрипти, записані основним інструментом OpenClaw `transcripts`. Цей CLI доступний
тільки для читання; запис, імпорт і підсумовування належать інструменту агента та
налаштованим джерелам автозапуску.

Використовуйте CLI, коли потрібно знайти вчорашні нотатки, відкрити Markdown-файл у
редакторі, передати транскрипт іншому інструменту або з’ясувати, куди сесія потрапила на
диску. Він не запускає й не зупиняє запис.

Артефакти зберігаються в каталозі стану OpenClaw:

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

Типовий каталог стану — `~/.openclaw`; задайте `OPENCLAW_STATE_DIR`, щоб використовувати
інший. Каталог дати визначається часом початку сесії, а каталог
сесії є безпечним сегментом файлової системи, отриманим з ідентифікатора сесії.

## Команди

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

- `list`: перелічує збережені сесії, селектор із датою, час початку, назву та шлях до `summary.md`.
- `show <session>`: виводить збережений `summary.md`.
- `path <session>`: виводить шлях до `summary.md`.
- `path <session> --dir`: виводить каталог сесії.
- `path <session> --metadata`: виводить `metadata.json`.
- `path <session> --transcript`: виводить `transcript.jsonl`.
- `--json`: виводить машинозчитуваний результат.

Коли людський ідентифікатор сесії повторюється в різні дні, використовуйте селектор
із датою з `list`, наприклад `openclaw transcripts show 2026-05-22/standup`.
Типові ідентифікатори сесій містять часову позначку та випадковий суфікс; налаштовуйте фіксовані
ідентифікатори сесій лише тоді, коли вони унікальні в межах дня.

## Вивід

`list` виводить по одній сесії на рядок:

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  Weekly standup  /Users/alex/.openclaw/transcripts/2026-05-22/standup/summary.md
```

Вивід розділений табуляцією. Стовпці: селектор, час початку, назва та
шлях до підсумку. Селектор — найбезпечніше значення для передавання назад у `show` або `path`.

`list --json` виводить об’єкти з:

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

`show --json` повертає збережені метадані сесії, селектор, каталог сесії,
шлях до підсумку та текст підсумку Markdown. `path --json` повертає вибраний шлях
і те, чи існує цей файл.

## Багато зустрічей на день

Транскрипти групують сесії за датою, а потім за ідентифікатором сесії. Десять зустрічей за один
день стають десятьма сусідніми папками:

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

Для більшості автоматизації використовуйте типово згенеровані ідентифікатори. Використовуйте фіксований ідентифікатор, як-от `standup`,
лише тоді, коли той самий ідентифікатор не буде використано двічі в ту саму дату.

## Відсутні підсумки

Живі сесії записують `summary.md`, коли сесія зупиняється. Імпортовані транскрипти
записують `summary.md` одразу після імпорту. Сесія все ще може з’являтися в
`list` без підсумку, коли запис активний, провайдер зазнав помилки під час зупинки
або метадані були записані до надходження будь-яких висловлювань.

Використовуйте `path <session> --transcript`, щоб переглянути транскрипт, який лише дописується, і використовуйте
дію інструмента `transcripts` `summarize`, щоб повторно згенерувати Markdown-підсумок.

## Конфігурація

Запис транскриптів вмикається явно, оскільки живі джерела можуть приєднуватися та записувати
аудіо зустрічей. Увімкніть інструмент за допомогою верхньорівневого `transcripts.enabled`:

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

Налаштуйте джерела автозапуску за допомогою `transcripts.autoStart` в `openclaw.json`.
Кожен запис вмикається самою наявністю; пропустіть запис, щоб вимкнути це джерело.

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

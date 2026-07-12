---
read_when:
    - Ви хочете переглянути виявлені подальші зобов’язання
    - Ви хочете відхилити заплановані нагадування про реєстрацію
    - Ви перевіряєте, що може доставити Heartbeat
summary: Довідник CLI для `openclaw commitments` (перегляд і відхилення визначених подальших дій)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-12T13:06:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4323273a5d73975532f4728dc5e40c5d59e0c6d2e31a538f96bf3451e3fdf4d9
    source_path: cli/commitments.md
    workflow: 16
---

Переглядайте та керуйте визначеними подальшими зобов’язаннями.

Зобов’язання вмикаються за бажанням (`commitments.enabled`) і є короткочасними спогадами про подальші дії,
створеними з контексту розмови та доставленими через Heartbeat. Концептуальний опис і конфігурацію див. у розділі
[Визначені зобов’язання](/uk/concepts/commitments).

Без підкоманди `openclaw commitments` виводить список зобов’язань, що очікують на виконання.

## Використання

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## Параметри

- `--all`: показати всі статуси, а не лише зобов’язання, що очікують на виконання.
- `--agent <id>`: відфільтрувати за ідентифікатором одного агента.
- `--status <status>`: відфільтрувати за статусом. Значення: `pending`, `sent`,
  `dismissed`, `snoozed` або `expired`. У разі невідомого значення команда завершується з помилкою.
- `--json`: вивести JSON у форматі, придатному для машинної обробки.

`dismiss` позначає зобов’язання із зазначеними ідентифікаторами як `dismissed`, щоб Heartbeat не
доставляв їх.

## Приклади

Вивести список зобов’язань, що очікують на виконання:

```bash
openclaw commitments
```

Вивести список усіх збережених зобов’язань:

```bash
openclaw commitments --all
```

Відфільтрувати за одним агентом:

```bash
openclaw commitments --agent main
```

Знайти відкладені зобов’язання:

```bash
openclaw commitments --status snoozed
```

Відхилити одне або кілька зобов’язань:

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

Експортувати у форматі JSON:

```bash
openclaw commitments --all --json
```

## Виведення

Текстове виведення містить кількість зобов’язань, шлях до сховища, усі активні фільтри
та по одному рядку для кожного зобов’язання:

- ідентифікатор зобов’язання
- статус
- тип (`event_check_in`, `deadline_check`, `care_check_in` або `open_loop`)
- найраніший термін виконання
- область дії (агент/канал/одержувач)
- запропонований текст нагадування

Виведення JSON містить кількість, активні фільтри статусу й агента, шлях до
сховища зобов’язань і повні збережені записи.

## Пов’язані розділи

- [Визначені зобов’язання](/uk/concepts/commitments)
- [Огляд пам’яті](/uk/concepts/memory)
- [Heartbeat](/uk/gateway/heartbeat)
- [Заплановані завдання](/uk/automation/cron-jobs)

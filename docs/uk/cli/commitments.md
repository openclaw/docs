---
read_when:
    - Ви хочете переглянути виявлені ймовірні зобов’язання щодо подальших дій
    - Ви хочете відхилити очікувані запити на реєстрацію стану
    - Ви перевіряєте, що може доставити Heartbeat
summary: Довідка CLI для `openclaw commitments` (перегляд і відхилення визначених подальших дій)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-16T17:45:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: db8a7d8f5756ccb18ed0990fcedf50d1072bb67e775c29eefdbd1a7dd795b7b0
    source_path: cli/commitments.md
    workflow: 16
---

Переглядайте й керуйте визначеними подальшими зобов’язаннями.

Зобов’язання вмикаються за бажанням (`commitments.enabled`) і є короткочасними спогадами про подальші дії,
створеними з контексту розмови та доставленими через Heartbeat. Концептуальний посібник і налаштування див. у розділі
[Визначені зобов’язання](/uk/concepts/commitments).

Без підкоманди `openclaw commitments` виводить список зобов’язань, що очікують виконання.

## Використання

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## Параметри

- `--all`: показувати всі статуси, а не лише зобов’язання, що очікують виконання.
- `--agent <id>`: фільтрувати за ідентифікатором одного агента.
- `--status <status>`: фільтрувати за статусом. Значення: `pending`, `sent`,
  `dismissed`, `snoozed` або `expired`. Невідомі значення спричиняють завершення з помилкою.
- `--json`: виводити машинозчитуваний JSON.

`dismiss` позначає вказані ідентифікатори зобов’язань як `dismissed`, щоб Heartbeat не
доставляв їх.

## Приклади

Вивести список зобов’язань, що очікують виконання:

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

Експортувати як JSON:

```bash
openclaw commitments --all --json
```

## Виведення

Текстове виведення містить кількість зобов’язань, шлях до спільної бази даних SQLite, усі активні фільтри
та по одному рядку для кожного зобов’язання:

- ідентифікатор зобов’язання
- статус
- тип (`event_check_in`, `deadline_check`, `care_check_in` або `open_loop`)
- найраніший термін виконання
- область дії (агент/канал/ціль)
- запропонований текст нагадування

Виведення JSON містить кількість, активні фільтри статусу й агента,
шлях до спільної бази даних SQLite та повні збережені записи.

## Пов’язані матеріали

- [Визначені зобов’язання](/uk/concepts/commitments)
- [Огляд пам’яті](/uk/concepts/memory)
- [Heartbeat](/uk/gateway/heartbeat)
- [Заплановані завдання](/uk/automation/cron-jobs)

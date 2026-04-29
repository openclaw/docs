---
read_when:
    - Ви хочете переглянути виведені зобов’язання щодо подальших дій
    - Ви хочете відхилити очікувані контрольні повідомлення
    - Ви перевіряєте, що може доставляти Heartbeat
summary: Довідник CLI для `openclaw commitments` (перегляд і відхилення виведених подальших дій)
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-04-29T21:45:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37d5e5dca25cf649a5069360aa4e41fcc33d042dea99f643b98c07189c58f21c
    source_path: cli/commitments.md
    workflow: 16
---

Переглядайте й керуйте виведеними зобов’язаннями щодо подальших дій.

Зобов’язання — це короткочасні пам’ятки про подальші дії, створені з
контексту розмови за явною згодою. Див. [Виведені зобов’язання](/uk/concepts/commitments) для
концептуального посібника.

Без підкоманди `openclaw commitments` показує список очікуваних зобов’язань.

## Використання

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## Параметри

- `--all`: показати всі статуси замість лише очікуваних зобов’язань.
- `--agent <id>`: відфільтрувати за одним ідентифікатором агента.
- `--status <status>`: відфільтрувати за статусом. Значення: `pending`, `sent`,
  `dismissed`, `snoozed` або `expired`.
- `--json`: вивести машинозчитуваний JSON.

## Приклади

Показати очікувані зобов’язання:

```bash
openclaw commitments
```

Показати кожне збережене зобов’язання:

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

## Вивід

Текстовий вивід містить:

- ідентифікатор зобов’язання
- статус
- тип
- найраніший строк виконання
- область дії
- запропонований текст перевірки стану

Вивід JSON також містить шлях до сховища зобов’язань і повні збережені записи.

## Пов’язане

- [Виведені зобов’язання](/uk/concepts/commitments)
- [Огляд пам’яті](/uk/concepts/memory)
- [Heartbeat](/uk/gateway/heartbeat)
- [Заплановані завдання](/uk/automation/cron-jobs)

---
read_when:
    - Налаштування UI mac-меню або логіки статусу
summary: Логіка статусу в рядку меню і те, що відображається користувачам
title: Рядок меню
x-i18n:
    generated_at: "2026-04-23T21:01:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8155aed327094887b72725fde25b2e4dcb233c8fbd5eed9823ef1e3be7a4e56d
    source_path: platforms/mac/menu-bar.md
    workflow: 15
---

# Логіка статусу в рядку меню

## Що показується

- Ми показуємо поточний стан роботи агента в значку рядка меню та в першому рядку статусу меню.
- Статус здоров’я приховується, поки активна робота; він повертається, коли всі сесії стають неактивними.
- Блок “Nodes” у меню показує лише **пристрої** (paired Node через `node.list`), а не записи клієнтів/присутності.
- Розділ “Usage” з’являється під Context, коли доступні snapshot використання провайдера.

## Модель стану

- Сесії: події надходять з `runId` (для окремого запуску) плюс `sessionKey` у payload. “main” session — це ключ `main`; якщо його немає, ми повертаємося до останньої оновленої сесії.
- Пріоритет: main завжди має перевагу. Якщо main активна, її стан показується негайно. Якщо main неактивна, показується не-main сесія, яка була активною останньою. Ми не перемикаємося туди-сюди посеред активності; перемикання відбувається лише тоді, коли поточна сесія стає неактивною або main стає активною.
- Типи активності:
  - `job`: високорівневе виконання команд (`state: started|streaming|done|error`).
  - `tool`: `phase: start|result` з `toolName` і `meta/args`.

## Enum IconState (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (debug override)

### `ActivityKind` → гліф

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- типово → 🛠️

### Візуальне зіставлення

- `idle`: звичайна істота.
- `workingMain`: бейдж із гліфом, повне тонування, анімація “working” для ніжок.
- `workingOther`: бейдж із гліфом, приглушене тонування, без метушіння.
- `overridden`: використовує вибраний гліф/тонування незалежно від активності.

## Текст рядка статусу (меню)

- Поки активна робота: `<Session role> · <activity label>`
  - Приклади: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- У стані idle: повертається до зведення health.

## Отримання подій

- Джерело: події `agent` control-channel (`ControlChannel.handleAgentEvent`).
- Розібрані поля:
  - `stream: "job"` з `data.state` для start/stop.
  - `stream: "tool"` з `data.phase`, `name`, необов’язковими `meta`/`args`.
- Мітки:
  - `exec`: перший рядок `args.command`.
  - `read`/`write`: скорочений шлях.
  - `edit`: шлях плюс визначений тип зміни з `meta`/кількості diff.
  - fallback: назва інструмента.

## Debug override

- Settings ▸ Debug ▸ вибір “Icon override”:
  - `System (auto)` (типово)
  - `Working: main` (для кожного типу інструмента)
  - `Working: other` (для кожного типу інструмента)
  - `Idle`
- Зберігається через `@AppStorage("iconOverride")`; зіставляється з `IconState.overridden`.

## Контрольний список тестування

- Запустіть job у main session: перевірте, що значок перемикається негайно, а рядок статусу показує мітку main.
- Запустіть job у не-main session, коли main idle: значок/статус показує не-main; залишається стабільним до завершення.
- Запустіть main, коли інша сесія активна: значок миттєво перемикається на main.
- Швидкі сплески інструментів: переконайтеся, що бейдж не мерехтить (TTL grace для результатів інструментів).
- Рядок health знову з’являється, щойно всі сесії стають idle.

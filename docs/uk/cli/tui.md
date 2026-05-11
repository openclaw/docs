---
read_when:
    - Вам потрібен термінальний інтерфейс для Gateway (зручний для віддаленого доступу)
    - Ви хочете передавати url/token/session зі скриптів
    - Ви хочете запустити TUI у локальному вбудованому режимі без Gateway
    - Ви хочете використовувати openclaw chat або openclaw tui --local
summary: Довідник CLI для `openclaw tui` (на базі Gateway або локальний вбудований термінальний інтерфейс користувача)
title: TUI
x-i18n:
    generated_at: "2026-05-11T20:30:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e59f0f5360a456d19cfee38adc540b27665c55de68480616f269d1088f13677
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Відкрийте термінальний UI, підключений до Gateway, або запустіть його в локальному вбудованому
режимі.

Пов’язано:

- Посібник TUI: [TUI](/uk/web/tui)

## Параметри

| Прапорець             | Типове значення                         | Опис                                                                                         |
| --------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------- |
| `--local`             | `false`                                 | Запустити з локальним вбудованим середовищем виконання агента замість Gateway.               |
| `--url <url>`         | `gateway.remote.url` з конфігурації     | URL WebSocket Gateway.                                                                        |
| `--token <token>`     | (немає)                                 | Токен Gateway, якщо потрібен.                                                                 |
| `--password <pass>`   | (немає)                                 | Пароль Gateway, якщо потрібен.                                                                |
| `--session <key>`     | `main` (або `global`, коли scope global) | Ключ сесії. Усередині робочого простору агента автоматично вибирає цього агента, якщо немає префікса. |
| `--deliver`           | `false`                                 | Доставляти відповіді асистента через налаштовані канали.                                      |
| `--thinking <level>`  | (типове значення моделі)                | Перевизначення рівня мислення.                                                                |
| `--message <text>`    | (немає)                                 | Надіслати початкове повідомлення після підключення.                                           |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`        | Тайм-аут агента. Недійсні значення записуються як попередження та ігноруються.                |
| `--history-limit <n>` | `200`                                   | Записи історії, які потрібно завантажити під час під’єднання.                                 |

Псевдоніми: `openclaw chat` і `openclaw terminal` викликають ту саму команду з неявним `--local`.

Примітки:

- `chat` і `terminal` є псевдонімами для `openclaw tui --local`.
- `--local` не можна поєднувати з `--url`, `--token` або `--password`.
- `tui` за можливості визначає налаштовані SecretRefs автентифікації gateway для автентифікації за токеном/паролем (провайдери `env`/`file`/`exec`).
- Якщо запуск відбувається з каталогу налаштованого робочого простору агента, TUI автоматично вибирає цього агента як типове значення ключа сесії (якщо `--session` явно не має вигляду `agent:<id>:...`).
- Локальний режим використовує вбудоване середовище виконання агента напряму. Більшість локальних інструментів працюють, але функції, доступні лише через Gateway, недоступні.
- Локальний режим додає `/auth [provider]` у командну поверхню TUI.
- Захисні механізми затвердження Plugin і далі діють у локальному режимі. Інструменти, що потребують затвердження, запитують рішення в терміналі; нічого не затверджується автоматично без повідомлення лише тому, що Gateway не залучено.

## Приклади

```bash
openclaw chat
openclaw tui --local
openclaw tui
openclaw tui --url ws://127.0.0.1:18789 --token <token>
openclaw tui --session main --deliver
openclaw chat --message "Compare my config to the docs and tell me what to fix"
# when run inside an agent workspace, infers that agent automatically
openclaw tui --session bugfix
```

## Цикл виправлення конфігурації

Використовуйте локальний режим, коли поточна конфігурація вже проходить перевірку, а ви хочете, щоб
вбудований агент перевірив її, порівняв із документацією та допоміг виправити її
з того самого термінала:

Якщо `openclaw config validate` вже завершується помилкою, спочатку використайте `openclaw configure` або
`openclaw doctor --fix`. `openclaw chat` не обходить захист від недійсної
конфігурації.

```bash
openclaw chat
```

Потім у TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Застосуйте цільові виправлення за допомогою `openclaw config set` або `openclaw configure`, потім
повторно запустіть `openclaw config validate`. Див. [TUI](/uk/web/tui) і [Конфігурація](/uk/cli/config).

## Пов’язано

- [Довідник CLI](/uk/cli)
- [TUI](/uk/web/tui)

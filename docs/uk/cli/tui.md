---
read_when:
    - Вам потрібен термінальний інтерфейс користувача для Gateway (зручний для віддаленого доступу)
    - Ви хочете передати url/token/session зі скриптів
    - Ви хочете запустити TUI у локальному вбудованому режимі без Gateway
    - Ви хочете використовувати openclaw chat або openclaw tui --local
summary: Довідник CLI для `openclaw tui` (термінальний інтерфейс на базі Gateway або локальний вбудований термінальний інтерфейс)
title: TUI
x-i18n:
    generated_at: "2026-06-27T17:23:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 514bbbcd0b695e8d4ccc87d1e242d816e264ac1f8b137f2bd891803ef7f48d5a
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Відкрийте термінальний UI, підключений до Gateway, або запустіть його в локальному вбудованому
режимі.

Пов’язане:

- Посібник TUI: [TUI](/uk/web/tui)

## Параметри

| Прапорець             | Типове значення                         | Опис                                                                                         |
| --------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------- |
| `--local`             | `false`                                 | Запуск із локальним вбудованим середовищем виконання агента замість Gateway.                 |
| `--url <url>`         | `gateway.remote.url` з конфігурації     | URL WebSocket для Gateway.                                                                   |
| `--token <token>`     | (немає)                                 | Токен Gateway, якщо потрібен.                                                                |
| `--password <pass>`   | (немає)                                 | Пароль Gateway, якщо потрібен.                                                               |
| `--session <key>`     | `main` (або `global`, коли scope є global) | Ключ сеансу. У робочій області агента автоматично вибирає цього агента, якщо немає префікса. |
| `--deliver`           | `false`                                 | Доставляти відповіді асистента через налаштовані канали.                                     |
| `--thinking <level>`  | (типове для моделі)                     | Перевизначення рівня мислення.                                                               |
| `--message <text>`    | (немає)                                 | Надіслати початкове повідомлення після підключення.                                          |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`        | Тайм-аут агента. Недійсні значення записуються як попередження та ігноруються.               |
| `--history-limit <n>` | `200`                                   | Кількість записів історії для завантаження під час підключення.                              |

Псевдоніми: `openclaw chat` і `openclaw terminal` викликають ту саму команду з неявним `--local`.

Примітки:

- `chat` і `terminal` є псевдонімами для `openclaw tui --local`.
- `--local` не можна поєднувати з `--url`, `--token` або `--password`.
- `tui` за можливості розв’язує налаштовані SecretRefs автентифікації gateway для автентифікації токеном/паролем (провайдери `env`/`file`/`exec`).
- Під час запуску зсередини налаштованого каталогу робочої області агента TUI автоматично вибирає цього агента як типове значення ключа сеансу (якщо `--session` явно не має вигляду `agent:<id>:...`).
- Щоб показати ім’я хоста Gateway у нижньому колонтитулі для нелокальних підключень на основі URL, виконайте `openclaw config set tui.footer.showRemoteHost true`. Мітка хоста вимкнена за замовчуванням і ніколи не з’являється для loopback або вбудованих локальних підключень.
- Локальний режим напряму використовує вбудоване середовище виконання агента. Більшість локальних інструментів працюють, але функції, доступні лише через Gateway, недоступні.
- Локальний режим додає `/auth [provider]` до командної поверхні TUI.
- Шлюзи схвалення Plugin усе одно застосовуються в локальному режимі. Інструменти, що потребують схвалення, запитують рішення в терміналі; нічого не схвалюється автоматично без повідомлення лише тому, що Gateway не задіяний.
- [Цілі](/uk/tools/goal) сеансу відображаються в нижньому колонтитулі, і ними можна керувати за допомогою `/goal`.

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

Використовуйте локальний режим, коли поточна конфігурація вже проходить перевірку, і ви хочете, щоб
вбудований агент перевірив її, порівняв із документацією та допоміг виправити її
з того самого термінала:

Якщо `openclaw config validate` уже завершується помилкою, спочатку використайте `openclaw configure` або
`openclaw doctor --fix`. `openclaw chat` не обходить захист від недійсної
конфігурації.

```bash
openclaw chat
```

Потім усередині TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Застосуйте цільові виправлення за допомогою `openclaw config set` або `openclaw configure`, потім
повторно запустіть `openclaw config validate`. Див. [TUI](/uk/web/tui) і [Config](/uk/cli/config).

## Пов’язане

- [Довідник CLI](/uk/cli)
- [TUI](/uk/web/tui)
- [Ціль](/uk/tools/goal)

---
read_when:
    - Ви хочете TUI для Gateway (зручно для віддаленої роботи)
    - Ви хочете передавати url/token/session зі скриптів
    - Ви хочете запускати TUI у локальному вбудованому режимі без Gateway
    - Ви хочете використовувати openclaw chat або openclaw tui --local
summary: Довідка CLI для `openclaw tui` (TUI на основі Gateway або локально вбудований)
title: TUI
x-i18n:
    generated_at: "2026-04-23T06:19:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f4b7cf2468779e0711f38a2cc304d783bb115fd5c5e573c9d1bc982da6e2905
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

Відкрийте TUI термінала, підключений до Gateway, або запустіть його в локальному вбудованому
режимі.

Пов’язано:

- Посібник з TUI: [TUI](/uk/web/tui)

Примітки:

- `chat` і `terminal` — це псевдоніми для `openclaw tui --local`.
- `--local` не можна поєднувати з `--url`, `--token` або `--password`.
- `tui` визначає налаштовані auth SecretRef Gateway для автентифікації токеном/паролем, коли це можливо (`env`/`file`/`exec` providers).
- Якщо запуск відбувається зсередини каталогу налаштованого робочого простору агента, TUI автоматично вибирає цього агента як типове значення ключа сесії (якщо тільки `--session` не задано явно як `agent:<id>:...`).
- Локальний режим використовує вбудоване середовище виконання агента безпосередньо. Більшість локальних інструментів працює, але функції лише Gateway недоступні.
- У локальному режимі до поверхні команд TUI додається `/auth [provider]`.

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

Використовуйте локальний режим, коли поточна конфігурація вже проходить
перевірку і ви хочете, щоб вбудований агент проаналізував її, порівняв із документацією та допоміг виправити
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

Застосовуйте точкові виправлення за допомогою `openclaw config set` або `openclaw configure`, а потім
повторно запускайте `openclaw config validate`. Див. [TUI](/uk/web/tui) і [Config](/uk/cli/config).

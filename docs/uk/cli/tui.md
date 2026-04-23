---
read_when:
    - Вам потрібен термінальний UI для Gateway (зручний для віддаленої роботи)
    - Ви хочете передавати url/token/session зі скриптів
    - Ви хочете запускати TUI у локальному вбудованому режимі без Gateway
    - Ви хочете використовувати openclaw chat або openclaw tui --local
summary: Довідник CLI для `openclaw tui` (TUI через Gateway або локальний вбудований)
title: TUI
x-i18n:
    generated_at: "2026-04-23T20:48:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8f22590edd78b2b294cf8f0a0f8b8f851cef5c3722ad2c5d1a4bf02681419f7
    source_path: cli/tui.md
    workflow: 15
---

# `openclaw tui`

Відкрити термінальний UI, підключений до Gateway, або запустити його в локальному вбудованому
режимі.

Пов’язане:

- Посібник з TUI: [TUI](/uk/web/tui)

Примітки:

- `chat` і `terminal` — це псевдоніми для `openclaw tui --local`.
- `--local` не можна поєднувати з `--url`, `--token` або `--password`.
- `tui` за можливості розв’язує налаштовані SecretRef автентифікації Gateway для автентифікації токеном/паролем (`env`/`file`/`exec` providers).
- Якщо TUI запущено з каталогу налаштованого робочого простору агента, він автоматично вибирає цього агента як типове значення ключа сесії (якщо тільки `--session` явно не має вигляд `agent:<id>:...`).
- Локальний режим напряму використовує вбудований runtime агента. Більшість локальних інструментів працює, але функції лише для Gateway недоступні.
- Локальний режим додає `/auth [provider]` у поверхню команд TUI.
- Обмеження на схвалення Plugin застосовуються і в локальному режимі. Інструменти, що потребують схвалення, запитують рішення в терміналі; нічого не схвалюється мовчки автоматично, оскільки Gateway не залучений.

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

Використовуйте локальний режим, коли поточна конфігурація вже проходить валідацію і ви хочете, щоб
вбудований агент перевірив її, порівняв із документацією та допоміг виправити
все з того самого термінала:

Якщо `openclaw config validate` уже завершується помилкою, спочатку використайте `openclaw configure` або
`openclaw doctor --fix`. `openclaw chat` не обходить захист від невалідної
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

Застосуйте точкові виправлення через `openclaw config set` або `openclaw configure`, а потім
повторно запустіть `openclaw config validate`. Див. [TUI](/uk/web/tui) і [Config](/uk/cli/config).

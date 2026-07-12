---
read_when:
    - Вам потрібен термінальний інтерфейс для Gateway (зручний для віддаленої роботи)
    - Ви хочете передати URL-адресу, токен і сеанс зі скриптів
    - Ви хочете запустити TUI у локальному вбудованому режимі без Gateway
    - Ви хочете використовувати `openclaw chat` або `openclaw tui --local`
summary: Довідник CLI для `openclaw tui` (термінальний інтерфейс на основі Gateway або локально вбудований)
title: TUI
x-i18n:
    generated_at: "2026-07-12T13:07:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e7b4a067e957c72836b22688f7446861b64fb7078b43e206bbe765ea0d62e57
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Відкрийте термінальний інтерфейс, підключений до Gateway, або запустіть його в локальному вбудованому режимі.

Пов’язаний посібник: [TUI](/uk/web/tui)

## Параметри

| Прапорець                    | Типове значення                           | Опис                                                                                                      |
| ---------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `--local`                    | `false`                                   | Працювати з локальним вбудованим середовищем виконання агента замість Gateway.                            |
| `--url <url>`                | `gateway.remote.url` з конфігурації       | URL WebSocket для Gateway.                                                                                |
| `--token <token>`            | (немає)                                   | Токен Gateway, якщо потрібен.                                                                             |
| `--password <pass>`          | (немає)                                   | Пароль Gateway, якщо потрібен.                                                                            |
| `--tls-fingerprint <sha256>` | `gateway.remote.tlsFingerprint`           | Очікуваний відбиток сертифіката TLS для закріпленого Gateway з `wss://`.                                   |
| `--session <key>`            | `main` (або `global` для глобальної області) | Ключ сеансу. У робочому просторі агента цей агент вибирається автоматично, якщо ключ не має префікса.   |
| `--deliver`                  | `false`                                   | Доставляти відповіді асистента через налаштовані канали.                                                  |
| `--thinking <level>`         | (типове значення моделі)                  | Перевизначення рівня міркування.                                                                          |
| `--message <text>`           | (немає)                                   | Надіслати початкове повідомлення після підключення.                                                       |
| `--timeout-ms <ms>`          | `agents.defaults.timeoutSeconds`          | Час очікування агента. Недійсні значення спричиняють запис попередження в журнал та ігноруються.          |
| `--history-limit <n>`        | `200`                                     | Кількість записів історії, які потрібно завантажити під час підключення.                                  |

Псевдоніми `openclaw chat` і `openclaw terminal` викликають цю команду з неявно заданим `--local`.

## Примітки

- `--local` не можна поєднувати з `--url`, `--token`, `--password` або `--tls-fingerprint`.
- Коли це можливо, `tui` розпізнає налаштовані посилання SecretRef для автентифікації Gateway за токеном або паролем (постачальники `env`/`file`/`exec`).
- Якщо URL або порт не вказано явно, `tui` використовує активний порт локального Gateway, записаний запущеним Gateway. Явно задані `--url`, `OPENCLAW_GATEWAY_URL`, `OPENCLAW_GATEWAY_PORT` і конфігурація віддаленого Gateway мають вищий пріоритет.
- Якщо TUI запущено з каталогу налаштованого робочого простору агента, цей агент автоматично вибирається як типове значення ключа сеансу (якщо для `--session` явно не задано `agent:<id>:...`).
- Щоб показувати ім’я хоста Gateway в нижньому колонтитулі для нелокальних підключень за URL, виконайте `openclaw config set tui.footer.showRemoteHost true`. Типово вимкнено; ніколи не відображається для підключень через local loopback або вбудованих локальних підключень.
- Локальний режим безпосередньо використовує вбудоване середовище виконання агента. Більшість локальних інструментів працює, але функції, доступні лише через Gateway, недоступні.
- У локальному режимі до команд TUI додається `/auth [provider]`.
- Вимоги Plugin щодо схвалення діють і в локальному режимі: інструменти, які потребують схвалення, запитують рішення в терміналі; нічого не схвалюється автоматично без повідомлення.
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

Використовуйте локальний режим, щоб вбудований агент перевірив поточну конфігурацію, порівняв її з документацією та допоміг виправити її в тому самому терміналі.

Якщо `openclaw config validate` вже завершується помилкою, спочатку виконайте `openclaw configure` або `openclaw doctor --fix`; `openclaw chat` не обходить перевірку недійсної конфігурації.

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

Застосуйте цільові виправлення за допомогою `openclaw config set` або `openclaw configure`, а потім знову виконайте `openclaw config validate`. Див. [TUI](/uk/web/tui) та [Конфігурація](/uk/cli/config).

## Пов’язані матеріали

- [Довідник CLI](/uk/cli)
- [TUI](/uk/web/tui)
- [Ціль](/uk/tools/goal)

---
read_when:
    - Вам нужен терминальный интерфейс для Gateway (удобный для удаленной работы)
    - Вы хотите передавать url/token/session из скриптов
    - Вы хотите запустить TUI в локальном встроенном режиме без Gateway
    - Вы хотите использовать openclaw chat или openclaw tui --local
summary: Справочник CLI для `openclaw tui` (терминальный UI на базе Gateway или локальный встроенный)
title: TUI
x-i18n:
    generated_at: "2026-06-28T22:47:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 514bbbcd0b695e8d4ccc87d1e242d816e264ac1f8b137f2bd891803ef7f48d5a
    source_path: cli/tui.md
    workflow: 16
---

# `openclaw tui`

Открывает терминальный UI, подключенный к Gateway, или запускает его в локальном встроенном
режиме.

Связано:

- Руководство по TUI: [TUI](/ru/web/tui)

## Параметры

| Флаг                  | По умолчанию                             | Описание                                                                                      |
| --------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------- |
| `--local`             | `false`                                 | Запустить с локальным встроенным рантаймом агента вместо Gateway.                             |
| `--url <url>`         | `gateway.remote.url` из конфигурации    | URL WebSocket для Gateway.                                                                    |
| `--token <token>`     | (нет)                                   | Токен Gateway, если требуется.                                                                |
| `--password <pass>`   | (нет)                                   | Пароль Gateway, если требуется.                                                               |
| `--session <key>`     | `main` (или `global`, когда область глобальная) | Ключ сессии. Внутри рабочей области агента автоматически выбирает этого агента, если не задан префикс. |
| `--deliver`           | `false`                                 | Доставлять ответы ассистента через настроенные каналы.                                        |
| `--thinking <level>`  | (по умолчанию модели)                   | Переопределение уровня рассуждений.                                                           |
| `--message <text>`    | (нет)                                   | Отправить начальное сообщение после подключения.                                              |
| `--timeout-ms <ms>`   | `agents.defaults.timeoutSeconds`        | Тайм-аут агента. Недопустимые значения записываются в журнал как предупреждение и игнорируются. |
| `--history-limit <n>` | `200`                                   | Количество записей истории для загрузки при подключении.                                      |

Алиасы: `openclaw chat` и `openclaw terminal` вызывают ту же команду с подразумеваемым `--local`.

Примечания:

- `chat` и `terminal` являются алиасами для `openclaw tui --local`.
- `--local` нельзя сочетать с `--url`, `--token` или `--password`.
- `tui` по возможности разрешает настроенные SecretRefs аутентификации Gateway для аутентификации по токену/паролю (провайдеры `env`/`file`/`exec`).
- При запуске изнутри настроенного каталога рабочей области агента TUI автоматически выбирает этого агента как значение ключа сессии по умолчанию (если `--session` явно не задан как `agent:<id>:...`).
- Чтобы показывать имя хоста Gateway в нижнем колонтитуле для нелокальных подключений на основе URL, выполните `openclaw config set tui.footer.showRemoteHost true`. Метка хоста отключена по умолчанию и никогда не отображается для loopback или встроенных локальных подключений.
- Локальный режим использует встроенный рантайм агента напрямую. Большинство локальных инструментов работает, но функции, доступные только через Gateway, недоступны.
- Локальный режим добавляет `/auth [provider]` в командную поверхность TUI.
- Контуры подтверждения Plugin по-прежнему применяются в локальном режиме. Инструменты, которым требуется подтверждение, запрашивают решение в терминале; ничто не подтверждается автоматически без уведомления только потому, что Gateway не участвует.
- [Цели](/ru/tools/goal) сессии отображаются в нижнем колонтитуле, ими можно управлять с помощью `/goal`.

## Примеры

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

## Цикл исправления конфигурации

Используйте локальный режим, когда текущая конфигурация уже проходит проверку и вы хотите, чтобы
встроенный агент проверил ее, сравнил с документацией и помог исправить ее
из того же терминала:

Если `openclaw config validate` уже завершается с ошибкой, сначала используйте `openclaw configure` или
`openclaw doctor --fix`. `openclaw chat` не обходит защиту от недопустимой
конфигурации.

```bash
openclaw chat
```

Затем внутри TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Примените точечные исправления с помощью `openclaw config set` или `openclaw configure`, затем
повторно выполните `openclaw config validate`. См. [TUI](/ru/web/tui) и [Конфигурация](/ru/cli/config).

## Связано

- [Справочник CLI](/ru/cli)
- [TUI](/ru/web/tui)
- [Цель](/ru/tools/goal)

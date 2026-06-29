---
read_when:
    - Вы хотите быстро проверить работоспособность запущенного Gateway
summary: Справочник CLI для `openclaw health` (снимок состояния Gateway через RPC)
title: Состояние
x-i18n:
    generated_at: "2026-06-28T22:43:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26be7bbbf75c2eca1213fe145fdeeab6fee96798dff457278ac69a20145bf75d
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

Получает состояние от работающего Gateway.

## Параметры

| Флаг             | По умолчанию | Описание                                                        |
| ---------------- | ------- | ------------------------------------------------------------------ |
| `--json`         | `false` | Выводит машиночитаемый JSON вместо текста.                       |
| `--timeout <ms>` | `10000` | Тайм-аут подключения в миллисекундах.                                |
| `--verbose`      | `false` | Подробное логирование. Принудительно выполняет живую проверку и расширяет вывод по агентам. |
| `--debug`        | `false` | Псевдоним для `--verbose`.                                             |

Примеры:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

Примечания:

- По умолчанию `openclaw health` запрашивает у работающего Gateway снимок его состояния. Когда у
  Gateway уже есть свежий кэшированный снимок, он может вернуть этот кэшированный payload и
  обновиться в фоновом режиме.
- `--verbose` принудительно выполняет живую проверку, выводит сведения о подключении к Gateway и расширяет
  человекочитаемый вывод по всем настроенным аккаунтам и агентам.
- Вывод включает хранилища сессий по агентам, когда настроено несколько агентов.

## Связанные материалы

- [Справочник CLI](/ru/cli)
- [Состояние Gateway](/ru/gateway/health)

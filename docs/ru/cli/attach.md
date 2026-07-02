---
read_when:
    - Вы хотите, чтобы Claude Code использовал инструменты MCP OpenClaw Gateway
    - Вам нужен временный привязанный к сеансу грант MCP для внешнего тестового окружения
summary: Справочник CLI для `openclaw attach` (запуск Claude Code с ограниченным по области действия разрешением Gateway MCP)
title: Подключение через CLI
x-i18n:
    generated_at: "2026-07-02T01:07:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1445c9bbf28e5365d070f69bf8f53e249d70ac6e8690ed68831404d041e41e86
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` запускает Claude Code со строгой временной конфигурацией MCP, привязанной
к одному сеансу Gateway.

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

Параметры:

- `--session <key>` привязывает grant к сеансу Gateway. По умолчанию используется основной сеанс.
- `--ttl <ms>` запрашивает положительный TTL grant в миллисекундах. Gateway применяет собственный верхний предел.
- `--bin <path>` выбирает бинарный файл Claude Code. По умолчанию используется `claude`.
- `--print-config` записывает временный `.mcp.json`, выводит команду запуска и env и оставляет grant активным до истечения TTL.

Bearer-токен передается через переменные окружения, а не через argv. OpenClaw
запускает Claude Code с `--strict-mcp-config --mcp-config <path>`, чтобы фоновые
MCP-серверы Claude не подключались к присоединенному сеансу. При обычных запусках
grant отзывается, когда процесс Claude Code завершается.

См. также: [Gateway CLI](/ru/cli/gateway), [MCP CLI](/ru/cli/mcp) и [ACP CLI](/ru/cli/acp).

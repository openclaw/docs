---
read_when:
    - Вы хотите, чтобы Claude Code использовал MCP-инструменты OpenClaw Gateway
    - Вам нужно временное разрешение MCP, привязанное к сеансу, для внешней тестовой системы
summary: Справочник CLI для `openclaw attach` (запуск Claude Code с ограниченным разрешением Gateway MCP)
title: Подключить CLI
x-i18n:
    generated_at: "2026-07-13T19:36:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 0d8ac60724adef1439af09179806af537b8f2925f06b3715850e4dd3b83b080f
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` запускает Claude Code со строгой временной конфигурацией MCP, привязанной к одному сеансу Gateway.

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

Параметры:

- `--session <key>` привязывает разрешение к сеансу Gateway. По умолчанию используется основной сеанс.
- `--ttl <ms>` запрашивает положительный срок действия разрешения в миллисекундах. Gateway применяет собственное максимальное ограничение.
- `--bin <path>` выбирает исполняемый файл Claude Code. По умолчанию: `claude`.
- `--print-config` записывает временный `.mcp.json`, выводит команду запуска и переменные окружения и оставляет разрешение действующим до истечения срока действия (этот параметр не запускает Claude Code и не отзывает разрешение).

Токен-носитель передаётся через переменные окружения, а не через argv. OpenClaw запускает Claude Code с `--strict-mcp-config --mcp-config <path>`, чтобы фоновые MCP-серверы Claude не подключались к присоединённому сеансу. При обычном запуске (без `--print-config`) разрешение отзывается после завершения процесса Claude Code.

См. также: [CLI Gateway](/ru/cli/gateway), [CLI MCP](/ru/cli/mcp) и [CLI ACP](/ru/cli/acp).

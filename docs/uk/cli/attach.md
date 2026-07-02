---
read_when:
    - Ви хочете, щоб Claude Code використовував MCP-інструменти OpenClaw Gateway
    - Вам потрібен тимчасовий, прив’язаний до сеансу дозвіл MCP для зовнішнього стенда
summary: Довідник CLI для `openclaw attach` (запуск Claude Code з обмеженим за областю дії дозволом Gateway MCP)
title: Підключення CLI
x-i18n:
    generated_at: "2026-07-02T01:14:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1445c9bbf28e5365d070f69bf8f53e249d70ac6e8690ed68831404d041e41e86
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` запускає Claude Code зі суворою тимчасовою конфігурацією MCP, привʼязаною
до одного сеансу Gateway.

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

Параметри:

- `--session <key>` привʼязує дозвіл до сеансу Gateway. За замовчуванням використовується основний сеанс.
- `--ttl <ms>` запитує додатний TTL дозволу в мілісекундах. Gateway застосовує власну верхню межу.
- `--bin <path>` вибирає бінарний файл Claude Code. За замовчуванням використовується `claude`.
- `--print-config` записує тимчасовий `.mcp.json`, виводить команду запуску й змінні середовища та залишає дозвіл активним до завершення TTL.

Bearer-токен передається через змінні середовища, а не через argv. OpenClaw
запускає Claude Code з `--strict-mcp-config --mcp-config <path>`, щоб навколишні
сервери Claude MCP не приєднувалися до прикріпленого сеансу. Звичайні запуски відкликають
дозвіл, коли процес Claude Code завершується.

Див. також: [Gateway CLI](/uk/cli/gateway), [MCP CLI](/uk/cli/mcp) і [ACP CLI](/uk/cli/acp).

---
read_when:
    - Ви хочете, щоб Claude Code використовував MCP-інструменти OpenClaw Gateway
    - Вам потрібен тимчасовий дозвіл MCP, прив’язаний до сеансу, для зовнішнього тестового середовища
summary: Довідник CLI для `openclaw attach` (запуск Claude Code з обмеженим дозволом Gateway MCP)
title: Підключити CLI
x-i18n:
    generated_at: "2026-07-12T13:06:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0d8ac60724adef1439af09179806af537b8f2925f06b3715850e4dd3b83b080f
    source_path: cli/attach.md
    workflow: 16
---

`openclaw attach` запускає Claude Code із суворою тимчасовою конфігурацією MCP, прив’язаною до одного сеансу Gateway.

```sh
openclaw attach
openclaw attach --session agent:main:telegram:123 --ttl 600000
openclaw attach --print-config
```

Параметри:

- `--session <key>` прив’язує дозвіл до сеансу Gateway. Типово використовується основний сеанс.
- `--ttl <ms>` запитує додатний строк дії дозволу в мілісекундах. Gateway застосовує власне максимальне обмеження.
- `--bin <path>` вибирає виконуваний файл Claude Code. Типове значення: `claude`.
- `--print-config` записує тимчасовий файл `.mcp.json`, виводить команду запуску та змінні середовища й залишає дозвіл чинним до завершення строку дії (не запускає Claude Code і не відкликає дозвіл).

Токен пред’явника передається через змінні середовища, а не через argv. OpenClaw запускає Claude Code з параметрами `--strict-mcp-config --mcp-config <path>`, щоб наявні в середовищі сервери Claude MCP не приєднувалися до підключеного сеансу. За звичайного запуску (без `--print-config`) дозвіл відкликається після завершення процесу Claude Code.

Див. також: [CLI Gateway](/uk/cli/gateway), [CLI MCP](/uk/cli/mcp) і [CLI ACP](/uk/cli/acp).
